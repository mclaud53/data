/// <reference path="main.d.ts" />

import {EventDispatcher, Event, EventType, Listener} from 'frog-event-dispatcher';
import {Field} from './meta/Field';
import {Relation} from './meta/Relation';
import {RelationType} from './meta/RelationType';
import {CollectionMeta} from './meta/CollectionMeta';
import {EntityMeta} from './meta/EntityMeta';
import {Registry} from './Registry';
import {CollectionEvent} from './event/CollectionEvent';
import {EntityEvent} from './event/EntityEvent';
import {RelationEvent} from './event/RelationEvent';
import {TransactionEvent} from './event/TransactionEvent';
import {Collection} from './Collection';
import {Transaction} from './Transaction';
import {RelatedMap} from './RelatedMap';

export type EntityState = { [key: string]: any; };

export abstract class Entity extends EventDispatcher<Event<any>, any>
{
	protected _entityMeta: EntityMeta;

	private _uuid: string;

	private _readOnly: boolean;

	private _initialState: EntityState = {};

	private _initialRelMap: RelatedMap = {};

	private _currentState: EntityState = {};

	private _currentRelMap: RelatedMap = {};

	private _transaction: Transaction = null;

	private _transactionDeep: boolean = false;

	private _transactionState: EntityState = {};

	private _transactionRelMap: RelatedMap = {};

	public constructor(state: EntityState = {}, relMap: RelatedMap = {}, isNew: boolean = true, readOnly: boolean = false, uuid: string = null)
	{
		super();

		this._entityMeta = this.initEntityMeta();

		this._initState(state);
		this._initRelMap(relMap);

		if (null === uuid) {
			uuid = Registry
				.getInstance()
				.getUUIDGenerator()
				.uuid(this._entityMeta.name);
		}

		this._uuid = uuid;

		this._readOnly = readOnly;
	}

	protected abstract initEntityMeta(): EntityMeta;

	private _initState(state: EntityState = null): void
	{
		var i: number,
			field: Field<any>,
			name: string,
			value: any;

		for (i = 0; i < this.entityMeta.fields.length; i++) {
			field = this.entityMeta.fields[i];
			name = field.name;
			if (state.hasOwnProperty(name)) {
				value = state[name]
			} else {
				value = field.defaultValue;
			}

			this._initialState[name] = value;
			this._currentState[name] = value;
		}
	}

	private _initRelMap(relMap: RelatedMap = null): void
	{
		var i: number,
			rel: Relation,
			relMeta: CollectionMeta | EntityMeta,
			name: string,
			value: Entity | Collection;

		for (i = 0; i < this.entityMeta.relations.length; i++) {
			rel = this.entityMeta.relations[i];
			relMeta = rel.relatedMeta;
			name = rel.name;
			value = null;
			if (relMap.hasOwnProperty(name) && (null !== relMap[name])) {
				if (relMeta instanceof EntityMeta) {
					if (relMap[name] instanceof relMeta.entityClass) {
						value = relMap[name];
					}
				} else if (relMeta instanceof CollectionMeta) {
					if (relMap[name] instanceof relMeta.collectionClass) {
						value = relMap[name];
					}
				}
			} else if (relMeta instanceof CollectionMeta) {
				value = new relMeta.collectionClass([], rel.relayEvents);
			}
			this._initialRelMap[name] = value;
			this._currentRelMap[name] = null;
			if (null !== value) {
				this.setRelated(name, value, false, true);
			}
		}
	}

	public get entityMeta(): EntityMeta
	{
		return this._entityMeta;
	}

	public get id(): any
	{
		var i: number,
			ret: any;

		if (this._entityMeta.primaryKey instanceof Array) {
			if (1 === this._entityMeta.primaryKey.length) {
				ret = this.get(this._entityMeta.primaryKey[0]);
			} else {
				ret = [];
				for (i = 0; i < this._entityMeta.primaryKey.length; i++) {
					ret.push(this.get(this._entityMeta.primaryKey[i]));
				}
			}
		} else {
			ret = this.get(this._entityMeta.primaryKey as string);
		}
		
		return ret;
	}

	public get uuid(): string
	{
		return this._uuid;
	}

	public get readOnly(): boolean
	{
		return this._readOnly;
	}

	public hasTransaction(): boolean
	{
		return null !== this._transaction;
	}

	public getTransaction(): Transaction
	{
		return this._transaction;
	}

	public beginTransaction(transactionId: string | Transaction = null, deep: boolean = false, options: Object = {}): Transaction
	{
		var i: number,
			rel: Relation,
			e: TransactionEvent,
			transaction: Transaction = null;

		if (transactionId instanceof Transaction) {
			transaction = transactionId;
		} else if (null !== transactionId) {
			transaction = Registry.getInstance()
				.getTransactionRegistry()
				.getByUUID(transactionId as string);
		}

		if (this.hasTransaction()) {
			if (this._transaction === transaction) {
				return this._transaction;
			} else {
				throw new Error('Transaction already strated!');
			}
		}

		if (null === transaction) {
			transaction = new Transaction();
		} else if (transaction.isFinished()) {
			throw new Error('Transaction already finished');
		}

		transaction.addListeners([
				{
					listener: this.onTransactionCommit,
					scope: this,
					eventType: TransactionEvent.COMMIT
				},
				{
					listener: this.onTransactionRollback,
					scope: this,
					eventType: TransactionEvent.ROLLBACK
				}
			]);

		this._transaction = transaction;
		this._fillState(this._transactionState);
		this._fillRelMap(this._transactionRelMap);
		this.relay(transaction, null, 1);

		if (deep !== this._transactionDeep && deep) {
			this._transactionDeep = deep;

			for (i = 0; i < this.entityMeta.relations.length; i++) {
				rel = this.entityMeta.relations[i];
				// if (RelationType.BelongsTo === rel.type) {
				// 	continue;
				// }

				if (this._currentRelMap[rel.name] instanceof Entity) {
					this._currentRelMap[rel.name].beginTransaction(transaction, deep, options);
				} else if (this._currentRelMap[rel.name] instanceof Collection) {
					this._currentRelMap[rel.name].beginTransaction(transaction, deep, options);
				}
			}
		}

		if (this.willDispatch(TransactionEvent.BEGIN)) {
			e = new TransactionEvent(TransactionEvent.BEGIN, transaction, false, options);
			this.dispatch(e);
		}

		return transaction;
	}

	public get(field: string, initial: boolean = false): any
	{
		if (this.entityMeta.fieldNames.indexOf(field) === -1) {
			throw new Error('Field don\'t exist ' + field);
		}

		return initial ? this._initialState[field] : this._currentState[field];
	}

	public set(field: string, value: any, options: boolean | Object = {}): boolean
	{
		if (this.entityMeta.fieldNames.indexOf(field) === -1) {
			throw new Error('Field don\'t exist ' + field);
		}

		var state: EntityState = this.getState();

		state[field] = value;

		return this.setState(state, options);
	}

	public getState(initial: boolean = false): EntityState
	{
		var ret: EntityState = {};

		ret = this._fillState(ret, initial);

		return ret;
	}

	public setState(state: EntityState, options: boolean | Object = {}, force: boolean = false): boolean
	{
		var i: number,
			field: string,
			fields: string[] = [],
			e: EntityEvent,
			events: any,
			oldState: EntityState = this._fillState({}),
			newState: EntityState = this._fillState({});

		for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
			field = this.entityMeta.fieldNames[i];
			if (!state.hasOwnProperty(field)) {
				continue;
			}

			state[field] = this.entityMeta.fieldMap[field].type.filter(state[field]);

			if (state[field] === newState[field]) {
				continue;
			}

			newState[field] = state[field];
			fields.push(field);
		}

		if (0 === fields.length) {
			return true;
		}

		if (this.readOnly) {
			return false;
		}

		if (false !== options) {
			events = [
				EntityEvent.BEFORE_CHANGE,
				{
					[this.entityMeta.name]: [
						EntityEvent.BEFORE_CHANGE,
						{
							[EntityEvent.BEFORE_CHANGE]: fields
						}
					]
				}
			];

			if (this.willDispatch(events)) {
				e = new EntityEvent(events, this, fields, newState, oldState, !force, options);
				this.dispatch(e);
				if (e.isDefaultPrevented) {
					if (this.hasTransaction()) {
						this.getTransaction().rollback(options);
					}
					return false;
				}
			}
		}

		for (i = 0; i < fields.length; i++) {
			field = fields[i];
			this._currentState[field] = newState[field];
		}

		// @todo PrimaryKey & ForeignKey ???

		if (false !== options && !this.hasTransaction()) {
			events = [
				EntityEvent.CHANGED,
				{
					[this.entityMeta.name]: [
						EntityEvent.CHANGED,
						{
							[EntityEvent.CHANGED]: fields
						}
					]
				}
			];

			if (this.willDispatch(events)) {
				e = new EntityEvent(events, this, fields, newState, oldState, false, options);
				this.dispatch(e);
			}
		}

		return true;
	}

	public getRelated<T extends (Entity | Collection)>(name: string, initial: boolean = false): T
	{
		return initial ? this._initialState[name] : this._currentRelMap[name];
	}

	public hasRelated(name: string): boolean
	{
		if (!this.entityMeta.hasRelation(name)) {
			throw new Error('Relation with name: ' + name + ' isn\'t exist in entity ' + this.entityMeta.name);
		}
		return !!this._currentRelMap[name];
	}

	public setRelated(name: string, value: (Entity | Collection), options: boolean | Object = {}, force: boolean = false, updateRelated: boolean = true): boolean
	{
		var events: any,
			relation: Relation = this.entityMeta.getRelation(name),
			relatedMeta: EntityMeta | CollectionMeta = relation.relatedMeta,
			e: RelationEvent,
			newRelated: (Entity | Collection) = value,
			oldRelated: (Entity | Collection) = this.getRelated(name),
			transaction: Transaction = null;

		if (null !== value) {
			if (relatedMeta instanceof EntityMeta) {
				if (!(value instanceof relatedMeta.entityClass)) {
					throw new Error('For relation "' + relation.name + '" of entity "' + this.entityMeta.name + '" value must be entity of class "' + relatedMeta.name + '"');
				}
			} else if (relatedMeta instanceof CollectionMeta) {
				if (!(value instanceof relatedMeta.collectionClass)) {
					throw new Error('For relation "' + relation.name + '" of entity "' + this.entityMeta.name + '" value must be collection of class "' + relatedMeta.entityMeta.name + '"');
				}
			}
		}

		if (this._currentRelMap[name] === value) {
			return true;
		}

		if (this.readOnly) {
			return false;
		}

		if (false !== options) {
			events = [
				RelationEvent.BEFORE_CHANGE,
				{
					[this.entityMeta.name]: [
						RelationEvent.BEFORE_CHANGE,
						{
							[RelationEvent.BEFORE_CHANGE]: [name]
						}
					]
				}
			];

			if (this.willDispatch(events)) {
				e = new RelationEvent(events, this, [name], { [name]: newRelated }, { [name]: oldRelated }, !force, options);
				this.dispatch(e);
				if (e.isDefaultPrevented) {
					if (this.hasTransaction()) {
						this.getTransaction().rollback();
					}
					return false;
				}
			}
		}

		if (!this.hasTransaction()) {
			transaction = this.beginTransaction();
		}

		if (newRelated) {
			newRelated.beginTransaction(this.getTransaction(), this._transactionDeep, options);
		}

		if (oldRelated) {
			oldRelated.beginTransaction(this.getTransaction(), this._transactionDeep, options);
		}

		switch (relation.type) {
			case RelationType.BelongsTo:
				if (!this._assignBelongsTo(name, relation, newRelated, oldRelated, options, force, updateRelated)) {
					return false;
				}
				break;

			case RelationType.HasOne:
				if (!this._assignHasOne(name, relation, newRelated, oldRelated, options, force, updateRelated)) {
					return false;
				}
				break;

			case RelationType.HasMany:
				if (!this._assignHasMany(name, relation, newRelated, oldRelated, options, force, updateRelated)) {
					return false;
				}
				break;
		}

		if (transaction && !transaction.isFinished()) {
			transaction.commit();
		}

		if (false !== options && !this.hasTransaction()) {
			events = [
				RelationEvent.CHANGED,
				{
					[this.entityMeta.name]: [
						RelationEvent.CHANGED,
						{
							[RelationEvent.CHANGED]: [name]
						}
					]
				}
			];

			if (this.willDispatch(events)) {
				e = new RelationEvent(events, this, [name], { [name]: newRelated }, { [name]: oldRelated }, false, options);
				this.dispatch(e);
			}
		}

		return true;
	}

	// public clear(): void
	// {
	// 	var i: number,
	// 		field: string;

	// 	for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
	// 		field = this.entityMeta.fieldNames[i];

	// 		this._initialState[field] = this.entityMeta.fieldMap[field].defaultValue;
	// 	}
	// }

	// public revert(): void
	// {
	// 	var i: number,
	// 		field: string;

	// 	for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
	// 		field = this.entityMeta.fieldNames[i];

	// 		this._currentState[field] = this._initialState[field];
	// 	}
	// }

	// public flush(): void
	// {
	// 	var i: number,
	// 		field: string;

	// 	for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
	// 		field = this.entityMeta.fieldNames[i];

	// 		this._initialState[field] = this._currentState[field];
	// 	}
	// }

	private onTransactionCommit(event: TransactionEvent, extra: Object): void
	{
		var i: number,
			field: string,
			fields: string[] = [],
			relation: string,
			relations: string[] = [],
			relMap: RelatedMap,
			ee: EntityEvent,
			re: RelationEvent,
			events: any,
			newState: EntityState = this._currentState,
			oldState: EntityState = this._transactionState,
			newRelMap: RelatedMap = {},
			oldRelMap: RelatedMap = {};

		this.unrelay(this._transaction);
		this._transaction.removeListeners([
			{
				listener: this.onTransactionCommit,
				scope: this,
				eventType: TransactionEvent.COMMIT
			},
			{
				listener: this.onTransactionRollback,
				scope: this,
				eventType: TransactionEvent.ROLLBACK
			}
		]);
		this._transaction = null;
		this._transactionDeep = false;

		for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
			field = this.entityMeta.fieldNames[i];
			if (!newState.hasOwnProperty(field)) {
				continue;
			}

			if (oldState[field] === newState[field]) {
				continue;
			}

			fields.push(field);
		}

		for (i = 0; i < this.entityMeta.relationNames.length; i++) {
			relation = this.entityMeta.relationNames[i];
			if (!this._transactionRelMap.hasOwnProperty(relation)) {
				continue;
			}
			if (this._transactionRelMap[relation] === this._currentRelMap[relation]) {
				continue;
			}
			newRelMap[relation] = this._currentRelMap[relation];
			oldRelMap[relation] = this._transactionRelMap[relation];
			relations.push(relation);
		}

		if (fields.length > 0) {
			events = [
				EntityEvent.CHANGED,
				{
					[this.entityMeta.name]: [
						EntityEvent.CHANGED,
						{
							[EntityEvent.CHANGED]: fields
						}
					]
				}
			];

			if (this.willDispatch(events)) {
				ee = new EntityEvent(events, this, fields, newState, oldState, false, event.options);
				this.dispatch(ee);
			}
		}

		if (relations.length > 0) {
			events = [
				RelationEvent.CHANGED,
				{
					[this.entityMeta.name]: [
						RelationEvent.CHANGED,
						{
							[RelationEvent.CHANGED]: relations
						}
					]
				}
			];

			if (this.willDispatch(events)) {
				re = new RelationEvent(events, this, relations, newRelMap, oldRelMap, false, event.options);
				this.dispatch(re);
			}
		}
	}

	private onTransactionRollback(e: TransactionEvent, extra: Object): void
	{
		var i: number,
			fieldName: string,
			rel: Relation,
			relName: string;

		this.unrelay(this._transaction);
		this._transaction.removeListeners([
			{
				listener: this.onTransactionCommit,
				scope: this,
				eventType: TransactionEvent.COMMIT
			},
			{
				listener: this.onTransactionRollback,
				scope: this,
				eventType: TransactionEvent.ROLLBACK
			}
		]);
		this._transaction = null;
		this._transactionDeep = false;

		for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
			fieldName = this.entityMeta.fieldNames[i];
			if (!this._transactionState.hasOwnProperty(fieldName)) {
				continue;
			}
			this._currentState[fieldName] = this._transactionState[fieldName];
		}

		for (i = 0; i < this.entityMeta.relations.length; i++) {
			rel = this.entityMeta.relations[i];
			relName = rel.name;
			if (!this._transactionRelMap.hasOwnProperty(relName)) {
				continue;
			}
			if (rel.relayEvents && null !== this._currentRelMap[relName]) {
				this.unrelay(this._currentRelMap[relName]);
			}
			this._currentRelMap[relName] = this._transactionRelMap[relName];
			if (rel.relayEvents && null !== this._transactionRelMap[relName]) {
				this.relay(this._transactionRelMap[relName]);
				this.unrelay(this._transactionRelMap[relName], [TransactionEvent.BEGIN, TransactionEvent.COMMIT, TransactionEvent.ROLLBACK]);
			}
		}
	}

	private onRelatedEntityChanged(e: EntityEvent, extra: Object): void
	{
		var name: string = extra['name'],
			field: string,
			relation: Relation = this.entityMeta.getRelation(name),
			related: Entity = e.target,
			state: EntityState = this.getState();

		for (field in relation.foreignKey) {
			state[field] = related.get(relation.foreignKey[field]);
		}

		this.setState(state, e.options, true);
	}

	private onRelatedCollectionModified(e: CollectionEvent, extra: Object): void
	{
		var i: number,
			name: string = extra['name'],
			transaction: Transaction = null,
			backwardRelation: Relation = this.entityMeta.getBackwardRelation(name);

		if (null === backwardRelation) {
			return;
		}

		if (this.getRelated(name) !== e.target) {
			return;
		}

		if (!this.hasTransaction()) {
			for (i = 0; i < e.addedEntites.length; i++) {
				if (e.addedEntites[i].hasTransaction()) {
					this.beginTransaction(e.addedEntites[i].getTransaction());
					break;
				}
			}
		}

		if (!this.hasTransaction()) {
			for (i = 0; i < e.removedEntites.length; i++) {
				if (e.removedEntites[i].hasTransaction()) {
					this.beginTransaction(e.removedEntites[i].getTransaction());
					break;
				}
			}
		}

		if (!this.hasTransaction()) {
			transaction = this.beginTransaction();
		}

		for (i = 0; i < e.addedEntites.length; i++) {
			e.addedEntites[i].beginTransaction(this.getTransaction());
			e.addedEntites[i].setRelated(backwardRelation.name, this, e.options, true, false);
		}

		for (i = 0; i < e.removedEntites.length; i++) {
			e.removedEntites[i].beginTransaction(this.getTransaction());
			e.removedEntites[i].setRelated(backwardRelation.name, null, e.options, true, false);
		}

		if (null !== transaction) {
			transaction.commit();
		}
	}

	private _assignBelongsTo(name: string, relation: Relation, newRelated: (Entity | Collection), oldRelated: (Entity | Collection), options: boolean | Object, force: boolean, updateRelated: boolean): boolean
	{
		var i: number,
			field: string,
			related: Collection,
			backwardRelation: Relation = updateRelated ? this.entityMeta.getBackwardRelation(relation) : null,
			backwardRelationMeta: CollectionMeta | EntityMeta,
			newState: EntityState = this.getState(),
			oldState: EntityState = this.getState(),
			fields: string[] = [],
			eventType: EventType,
			ret: boolean = true;

		for (field in relation.foreignKey) {
			fields.push(relation.foreignKey[field]);
		}

		eventType = {
			[relation.entityMeta.name]: {
				[EntityEvent.CHANGED]: fields
			}
		};


		if (oldRelated instanceof Entity) {
			if (relation.relayEvents) {
				this.unrelay(oldRelated);
			}

			oldRelated.removeListener(this.onRelatedEntityChanged, this, eventType);

			if (null !== backwardRelation) {
				backwardRelationMeta = backwardRelation.relatedMeta;
				if (backwardRelationMeta instanceof EntityMeta) {
					if (!oldRelated.setRelated(backwardRelation.name, null, options, force, false)) {
						ret = false;
					}
				} else if (backwardRelationMeta instanceof CollectionMeta) {
					related = oldRelated.getRelated(backwardRelation.name) as Collection;
					related.beginTransaction(this.getTransaction(), this._transactionDeep, options);
					if (!related.removeEntity(this, options, force)) {
						ret = false;
					}
				}
			}
		}

		if (ret) {
			if (newRelated instanceof Entity) {
				for (field in relation.foreignKey) {
					newState[field] = newRelated.get(relation.foreignKey[field]);
				}

				if (!this.setState(newState, options, force)) {
					ret = false;
				}
			} else if (null !== newRelated) {
				throw new Error('Relation "' + name + '" in entity "' + this.entityMeta.name + '" must be instance of Entity');
			} else {
				for (field in relation.foreignKey) {
					newState[field] = this.entityMeta.fieldMap[field].defaultValue;
				}

				if (!this.setState(newState, options)) {
					ret = false;
				}
			}			
		}

		if (ret) {
			if (newRelated instanceof Entity) {
				if (null !== backwardRelation) {
					backwardRelationMeta = backwardRelation.relatedMeta;
					if (backwardRelationMeta instanceof EntityMeta) {
						if (!newRelated.setRelated(backwardRelation.name, this, options, force, false)) {
							ret = false;
						}
					} else if (backwardRelationMeta instanceof CollectionMeta) {
						related = newRelated.getRelated(backwardRelation.name) as Collection;
						related.beginTransaction(this.getTransaction(), this._transactionDeep, options);
						if (!related.addEntity(this, options, force)) {
							ret = false;
						}
					}
				}
			}
		}

		if (ret) {
			this._currentRelMap[name] = newRelated;

			if (newRelated) {
				newRelated.addListener(this.onRelatedEntityChanged, this, eventType, {
					extra: {
						name: name
					}
				});
				if (relation.relayEvents) {
					this.relay(newRelated);
					this.unrelay(newRelated, [TransactionEvent.BEGIN, TransactionEvent.COMMIT, TransactionEvent.ROLLBACK]);
				}
			}
		}

		return ret;
	}

	private _assignHasOne(name: string, relation: Relation, newRelated: (Entity | Collection), oldRelated: (Entity | Collection), options: boolean | Object, force: boolean, updateRelated: boolean): boolean
	{
		var i: number,
			backwardRelation: Relation = updateRelated ? this.entityMeta.getBackwardRelation(relation) : null,
			ret: boolean = true;

		if (oldRelated instanceof Entity) {
			if (relation.relayEvents) {
				this.unrelay(oldRelated);
			}

			if (null !== backwardRelation) {
				if (!oldRelated.setRelated(backwardRelation.name, null, options, force, false)) {
					ret = false;
				}
			}
		}

		if (ret) {
			if (newRelated instanceof Entity) {
				if (null !== backwardRelation) {
					if (!newRelated.setRelated(backwardRelation.name, this, options, force, false)) {
						ret = false;
					}
				}
			} else if (null !== newRelated) {
				throw new Error('Relation "' + name + '" in entity "' + this.entityMeta.name + '" must be instance of Entity');
			}		
		}

		if (ret) {
			this._currentRelMap[name] = newRelated;

			if (relation.relayEvents && newRelated) {
				this.relay(newRelated);
				this.unrelay(newRelated, [TransactionEvent.BEGIN, TransactionEvent.COMMIT, TransactionEvent.ROLLBACK]);
			}
		}

		return ret;
	}

	private _assignHasMany(name: string, relation: Relation, newRelated: (Entity | Collection), oldRelated: (Entity | Collection), options: boolean | Object, force: boolean, updateRelated: boolean): boolean
	{
		var i: number,
			backwardRelation: Relation = updateRelated ? this.entityMeta.getBackwardRelation(relation) : null,
			related: Entity,
			ret: boolean = true,
			eventType: EventType = {
				[relation.entityMeta.name]: [CollectionEvent.ADDED, CollectionEvent.REMOVED]
			};

		if (oldRelated instanceof Collection) {
			if (relation.relayEvents) {
				this.unrelay(oldRelated);
			}
			oldRelated.removeListener(this.onRelatedCollectionModified, this, eventType);
			if (null !== backwardRelation) {
				for (i = 0; i < oldRelated.length; i++) {
					related = oldRelated.getAt(i);
					related.beginTransaction(this.getTransaction(), this._transactionDeep, options);
					if (!related.setRelated(backwardRelation.name, null, options, force, false)) {
						ret = false;
						break;
					}
				}
			}
		}

		if (newRelated instanceof Collection) {
			if (null !== backwardRelation) {
				for (i = 0; i < newRelated.length; i++) {
					related = newRelated.getAt(i);
					related.beginTransaction(this.getTransaction(), this._transactionDeep, options);
					if (!related.setRelated(backwardRelation.name, this, options, force, false)) {
						ret = false;
						break;
					}
				}
			}
		}

		if (ret) {
			this._currentRelMap[name] = newRelated;

			if (newRelated) {
				newRelated.addListener(this.onRelatedCollectionModified, this, eventType, {
					extra: {
						name: relation.name
					}
				});
				if (relation.relayEvents) {
					this.relay(newRelated);
					this.unrelay(newRelated, [TransactionEvent.BEGIN, TransactionEvent.COMMIT, TransactionEvent.ROLLBACK]);
				}
			}
		}

		return ret;
	}

	private _fillState(state: EntityState, initial: boolean = false): EntityState
	{
		var i: number,
			fieldName: string;

		for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
			fieldName = this.entityMeta.fieldNames[i];
			state[fieldName] = this.get(fieldName, initial);
		}

		return state;
	}

	private _fillRelMap(relMap: RelatedMap, initial: boolean = false): RelatedMap
	{
		var i: number,
			relationName: string;

		for (i = 0; i < this.entityMeta.relationNames.length; i++) {
			relationName = this.entityMeta.relationNames[i];
			relMap[relationName] = this.getRelated(relationName, initial);
		}

		return relMap;
	}
}