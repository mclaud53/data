/// <reference path="../typings/main.d.ts" />

import {EventDispatcher, Event} from 'frog-event-dispatcher';
import {RelationType} from './meta/RelationType';
import {Relation} from './meta/Relation';
import {EntityMeta} from './meta/EntityMeta';
import {Registry} from './Registry';
import {EntityEvent} from './event/EntityEvent';
import {RelationEvent} from './event/RelationEvent';
import {Collection} from './Collection';

export type EntityState = { [key: string]: any; };

export abstract class Entity extends EventDispatcher<Event<any>, any>
{
	protected _entityMeta: EntityMeta;

	private _uuid: string;

	private _readOnly: boolean;

	private _related: { [key: string]: (Entity | Collection) } = {};

	private _initialState: EntityState = {};

	private _currentState: EntityState = {};

	public constructor(data: EntityState = null, isNew: boolean = true, readOnly: boolean = false, uuid: string = null)
	{
		super();

		this._entityMeta = this.initEntityMeta();

		this._initData(data);

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

	private _initData(data: EntityState = null): void
	{
		var i: number,
			name: string,
			// field: Field,
			value: any;

		if (null === data) {
			data = {};
		}

		for (i = 0; i < this.entityMeta.fields.length; i++) {
			name = this.entityMeta.fields[i].name;
			if (data.hasOwnProperty(name)) {
				value = data[name]
			} else {
				value = this.entityMeta.fields[i].defaultValue;
			}

			this._initialState[name] = value;
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

	public get(field: string, initial: boolean = false): any
	{
		if (this.entityMeta.fieldNames.indexOf(field) === -1) {
			throw new Error('Field don\'t exist ' + field);
		}

		if (!initial && this._currentState.hasOwnProperty(field)) {
			return this._currentState[field];
		}

		return this._initialState[field];
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

	public setState(state: EntityState, options: boolean | Object = {}): boolean
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
				e = new EntityEvent(events, this, fields, newState, oldState, true, options);
				this.dispatch(e);
				if (e.isDefaultPrevented) {
					return false;
				}
			}
		}

		for (i = 0; i < fields.length; i++) {
			field = fields[i];
			if (this._initialState[field] === newState[field]) {
				if (this._currentState.hasOwnProperty(field)) {
					delete this._currentState[field];
				}
			} else {
				this._currentState[field] = newState[field];
			}
		}

		if (false !== options) {
			events = {
				[this.entityMeta.name]: [
					EntityEvent.CHANGED,
					{
						[EntityEvent.CHANGED]: fields
					}
				]
			};

			if (this.willDispatch(events)) {
				e = new EntityEvent(events, this, fields, newState, oldState, false, options);
				this.dispatch(e);
			}
		}

		return true;
	}

	public getRelated(name: string): (Entity | Collection)
	{
		return this.hasRelated(name) ? this._related[name] : null;
	}

	public hasRelated(name: string): boolean
	{
		if (!this.entityMeta.hasRelation(name)) {
			throw new Error('Relation with name: ' + name + ' isn\'t exist in entity ' + this.entityMeta.name);
		}
		return !!this._related[name];
	}

	public setRelated(name: string, value: (Entity | Collection), options: boolean | Object = {}, updateRelated: boolean = true): boolean
	{
		var events: any,
			relation: Relation = this.entityMeta.getRelation(name),
			e: RelationEvent,
			newRelated: (Entity | Collection) = value,
			oldRelated: (Entity | Collection) = this.getRelated(name);

		// if (value.name !== relation.entityName) {
		// 	throw new Error('Relation must has name: ' + relation.entityName + ' passed model with name: ' + value.name);
		// }

		if (this._related[name] === value) {
			return true;
		}

		if (this.readOnly) {
			return false;
		}

		if (false !== options) {
			events = {
				[this.entityMeta.name]: [
					RelationEvent.BEFORE_CHANGE,
					{
						[RelationEvent.BEFORE_CHANGE]: [name]
					}
				]
			};

			if (this.willDispatch(events)) {
				e = new RelationEvent(events, this, name, newRelated, oldRelated, true, options);
				this.dispatch(e);
				if (e.isDefaultPrevented) {
					return false;
				}
			}
		}

		switch (relation.type) {
			case RelationType.BelongsTo:
				if (!this._assignBelongsTo(name, relation, newRelated, oldRelated, options, updateRelated)) {
					return false;
				}
				break;

			case RelationType.HasOne:
				if (!this._assignHasOne(name, relation, newRelated, oldRelated, options, updateRelated)) {
					return false;
				}
				break;

			case RelationType.HasMany:
				if (!this._assignHasMany(name, relation, newRelated, oldRelated, options, updateRelated)) {
					return false;
				}
				break;
		}

		if (false !== options) {
			events = {
				[this.entityMeta.name]: [
					RelationEvent.CHANGED,
					{
						[RelationEvent.CHANGED]: [name]
					}
				]
			};

			if (this.willDispatch(events)) {
				e = new RelationEvent(events, this, name, newRelated, oldRelated, false, options);
				this.dispatch(e);
			}
		}

		return true;
	}

	public clear(): boolean
	{
		var i: number,
			field: string;

		for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
			field = this.entityMeta.fieldNames[i];

			if (this._initialState.hasOwnProperty(field)) {
				this._initialState[field] = this.entityMeta.fieldMap[field].defaultValue;
			}
		}

		this.revert();

		return true;
	}

	public revert(): boolean
	{
		var i: number,
			field: string;

		for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
			field = this.entityMeta.fieldNames[i];

			if (this._currentState.hasOwnProperty(field)) {
				delete this._currentState[field];
			}
		}

		return true;
	}

	public flush(): void
	{
		var i: number,
			field: string;

		for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
			field = this.entityMeta.fieldNames[i];

			if (!this._currentState.hasOwnProperty(field)) {
				continue;
			}

			this._initialState[field] = this._currentState[field];
		}

		this.revert();
	}

	private onRelatedEntityChanged(e: EntityEvent, extra: Object): void
	{
		var name: string = extra['name'],
			field: string,
			relation: Relation = this.entityMeta.getRelation(name),
			related: Entity = e.target,
			state: EntityState = this.getState();

		// for (field in relation.fieldsMap) {
		// 	state[field] = related.get(relation.fieldsMap[field]);
		// }

		if (!this.setState(state, e.options)) {
			// @todo
		}
	}

	private _assignBelongsTo(name: string, relation: Relation, newRelated: (Entity | Collection), oldRelated: (Entity | Collection), options: boolean | Object, updateRelated: boolean): boolean
	{
		return true;

		// var i: number,
		// 	field: string,
		// 	related: (Entity | Collection),
		// 	tmpRelated: (Entity | Collection),
		// 	backwardRelationName: string,
		// 	newState: EntityState = this.getState(),
		// 	oldState: EntityState = this.getState(),
		// 	fields: string[] = [],
		// 	events: Object,
		// 	token: string,
		// 	suspended: (Entity | Collection)[] = [],
		// 	ret: boolean = true;

		// token = this.suspend(true);
		// suspended.push(this);
		// try {
		// 	if (ret && (oldRelated instanceof Entity)) {
		// 		oldRelated.suspend(true, token);
		// 		suspended.push(oldRelated);
		// 		if (relation.relayEvents) {
		// 			this.unrelay(oldRelated);
		// 		}

		// 		if (updateRelated) {
		// 			backwardRelationName = oldRelated.findRelationName(this.entityMeta.name, RelationType.HasOne);
		// 			if (null !== backwardRelationName) {
		// 				if (!oldRelated.setRelated(backwardRelationName, null, options, false)) {
		// 					ret = false;
		// 				}
		// 			} else {
		// 				backwardRelationName = oldRelated.findRelationName(this.entityMeta.name, RelationType.HasMany);
		// 				if (null !== backwardRelationName) {
		// 					related = oldRelated.getRelated(backwardRelationName);
		// 					if (related instanceof Collection) {
		// 						related.suspend(true, token);
		// 						suspended.push(related);
		// 						if (!related.removeEntity(this, options)) {
		// 							ret = false;
		// 						}
		// 					}
		// 				}
		// 			}
		// 		}
		// 	}

		// 	if (ret) {
		// 		if (newRelated instanceof Entity) {
		// 			newRelated.suspend(true, token);
		// 			suspended.push(newRelated);
		// 			for (field in relation.fieldsMap) {
		// 				fields.push(relation.fieldsMap[field]);
		// 				newState[field] = newRelated.get(relation.fieldsMap[field]);
		// 			}

		// 			if (!this.setState(newState, options)) {
		// 				ret = false;
		// 			}

		// 			if (updateRelated) {
		// 				backwardRelationName = newRelated.findRelationName(this.entityMeta.name, RelationType.HasOne);
		// 				if (null !== backwardRelationName) {
		// 					tmpRelated = newRelated.getRelated(backwardRelationName);
		// 					if (!newRelated.setRelated(backwardRelationName, this, options, false)) {
		// 						ret = false;
		// 					}
		// 				} else {
		// 					backwardRelationName = newRelated.findRelationName(this.entityMeta.name, RelationType.HasMany);
		// 					if (null !== backwardRelationName) {
		// 						related = newRelated.getRelated(backwardRelationName);
		// 						if (related instanceof Collection) {
		// 							related.suspend(true, token);
		// 							suspended.push(related);
		// 							if (!related.addEntity(this, options)) {
		// 								ret = false;
		// 							}
		// 						}
		// 					}
		// 				}
		// 			}
		// 		} else if (null !== newRelated) {
		// 			throw new Error('Relation "' + name + '" in entity "' + this.entityMeta.name + '" must be instance of Entity');
		// 		} else {
		// 			for (field in relation.fieldsMap) {
		// 				fields.push(relation.fieldsMap[field]);
		// 				newState[field] = this.entityMeta.fieldMap[field].defaultValue;
		// 			}

		// 			if (!this.setState(newState, options)) {
		// 				ret = false;
		// 			}
		// 		}			
		// 	}
		// } catch (error) {
		// 	ret = false;
		// 	throw error;
		// } finally {
		// 	if (!ret) {
		// 		this.setState(oldState, false);

		// 		if (updateRelated && (newRelated instanceof Entity)) {
		// 			backwardRelationName = newRelated.findRelationName(this.entityMeta.name, RelationType.HasOne);
		// 			if (null !== backwardRelationName) {
		// 				if (tmpRelated) {
		// 					newRelated.setRelated(backwardRelationName, tmpRelated, false, false);
		// 				}
		// 			} else {
		// 				backwardRelationName = newRelated.findRelationName(this.entityMeta.name, RelationType.HasMany);
		// 				if (null !== backwardRelationName) {
		// 					related = newRelated.getRelated(backwardRelationName);
		// 					if (related instanceof Collection) {
		// 						related.removeEntity(this, false);
		// 					}
		// 				}
		// 			}
		// 		}

		// 		if (oldRelated instanceof Entity) {
		// 			if (updateRelated) {
		// 				backwardRelationName = oldRelated.findRelationName(this.entityMeta.name, RelationType.HasOne);
		// 				if (null !== backwardRelationName) {
		// 					oldRelated.setRelated(backwardRelationName, this, false, false);
		// 				} else {
		// 					backwardRelationName = oldRelated.findRelationName(this.entityMeta.name, RelationType.HasMany);
		// 					if (null !== backwardRelationName) {
		// 						related = oldRelated.getRelated(backwardRelationName);
		// 						if (related instanceof Collection) {
		// 							related.addEntity(this, false);
		// 						}
		// 					}
		// 				}
		// 			}
		// 			if (relation.relayEvents) {
		// 				this.relay(oldRelated);
		// 			}
		// 		}

		// 		for (i = suspended.length - 1; i >= 0; i--) {
		// 			suspended[i].purgeQueue(token);
		// 			suspended[i].resume(token);
		// 		}
		// 	}
		// }

		// if (ret) {
		// 	this._related[name] = newRelated;

		// 	events = {
		// 		[relation.entityName]: {
		// 			[EntityEvent.CHANGED]: fields
		// 		}
		// 	};

		// 	if (oldRelated) {
		// 		oldRelated.removeListener(this.onRelatedEntityChanged, this, events);
		// 	}
		// 	if (newRelated) {
		// 		newRelated.addListener(this.onRelatedEntityChanged, this, events, {
		// 			extra: {
		// 				name: name
		// 			}
		// 		});
		// 		if (relation.relayEvents) {
		// 			this.relay(newRelated);
		// 		}
		// 	}

		// 	for (i = suspended.length - 1; i >= 0; i--) {
		// 		suspended[i].resume(token);
		// 	}
		// }

		// return ret;
	}

	private _assignHasOne(name: string, relation: Relation, newRelated: (Entity | Collection), oldRelated: (Entity | Collection), options: boolean | Object, updateRelated: boolean): boolean
	{
		return true;
		
		// var i: number,
		// 	tmpRelated: (Entity | Collection),
		// 	backwardRelationName: string,
		// 	token: string,
		// 	suspended: (Entity | Collection)[] = [],
		// 	ret: boolean = true;

		// token = this.suspend(true);
		// suspended.push(this);
		// try {
		// 	if (ret && (oldRelated instanceof Entity)) {
		// 		oldRelated.suspend(true, token);
		// 		suspended.push(oldRelated);
		// 		if (relation.relayEvents) {
		// 			this.unrelay(oldRelated);
		// 		}

		// 		if (updateRelated) {
		// 			backwardRelationName = oldRelated.findRelationName(this.entityMeta.name, RelationType.BelongsTo);
		// 			if (null !== backwardRelationName) {
		// 				if (!oldRelated.setRelated(backwardRelationName, null, options, false)) {
		// 					ret = false;
		// 				}
		// 			}
		// 		}
		// 	}

		// 	if (ret) {
		// 		if (newRelated instanceof Entity) {
		// 			newRelated.suspend(true, token);
		// 			suspended.push(newRelated);

		// 			if (updateRelated) {
		// 				backwardRelationName = newRelated.findRelationName(this.entityMeta.name, RelationType.BelongsTo);
		// 				if (null !== backwardRelationName) {
		// 					tmpRelated = newRelated.getRelated(backwardRelationName);
		// 					if (!newRelated.setRelated(backwardRelationName, this, options, false)) {
		// 						ret = false;
		// 					}
		// 				}
		// 			}
		// 		} else if (null !== newRelated) {
		// 			throw new Error('Relation "' + name + '" in entity "' + this.entityMeta.name + '" must be instance of Entity');
		// 		}		
		// 	}
		// } catch (error) {
		// 	ret = false;
		// 	throw error;
		// } finally {
		// 	if (!ret) {
		// 		if (updateRelated && (newRelated instanceof Entity)) {
		// 			backwardRelationName = newRelated.findRelationName(this.entityMeta.name, RelationType.BelongsTo);
		// 			if (null !== backwardRelationName) {
		// 				if (tmpRelated) {
		// 					newRelated.setRelated(backwardRelationName, tmpRelated, false, false);
		// 				}
		// 			}
		// 		}

		// 		if (oldRelated instanceof Entity) {
		// 			if (updateRelated) {
		// 				backwardRelationName = oldRelated.findRelationName(this.entityMeta.name, RelationType.BelongsTo);
		// 				if (null !== backwardRelationName) {
		// 					oldRelated.setRelated(backwardRelationName, this, false, false);
		// 				}
		// 			}
		// 			if (relation.relayEvents) {
		// 				this.relay(oldRelated);
		// 			}
		// 		}

		// 		for (i = suspended.length - 1; i >= 0; i--) {
		// 			suspended[i].purgeQueue(token);
		// 			suspended[i].resume(token);
		// 		}
		// 	}
		// }

		// if (ret) {
		// 	this._related[name] = newRelated;

		// 	if (relation.relayEvents && newRelated) {
		// 		this.relay(newRelated);
		// 	}

		// 	for (i = suspended.length - 1; i >= 0; i--) {
		// 		suspended[i].resume(token);
		// 	}
		// }

		// return ret;
	}

	private _assignHasMany(name: string, relation: Relation, newRelated: (Entity | Collection), oldRelated: (Entity | Collection), options: boolean | Object, updateRelated: boolean): boolean
	{
		return true;
	}

	private _fillState(state: EntityState, initial: boolean = false): EntityState
	{
		var i: number,
			field: string;

		for (i = 0; i < this.entityMeta.fieldNames.length; i++) {
			field = this.entityMeta.fieldNames[i];
			state[field] = this.get(field, initial);
		}

		return state;
	}
}