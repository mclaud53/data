import {EventDispatcher, Event, EventType} from 'frog-event-dispatcher';
import {Registry} from './Registry';
import {Entity} from './Entity';
import {Transaction} from './Transaction';
import {CollectionEvent} from './event/CollectionEvent';
import {TransactionEvent} from './event/TransactionEvent';
import {CollectionMeta} from './meta/CollectionMeta';
import {EntityMeta} from './meta/EntityMeta';

export abstract class Collection extends EventDispatcher<Event<any>, any>
{
	private _collectionMeta: CollectionMeta;

	private _uuid: string;

	private _initialEntities: Entity[];

	private _currentEntities: Entity[];

	private _transaction: Transaction = null;

	private _transactionDeep: boolean = false;

	private _transactionEntities: Entity[];

	private _readOnly: boolean = false;

	private _relayEntityEvents: boolean;

	public constructor(entities: Entity[] = null, relayEvents: boolean = false, readOnly: boolean = false, uuid: string = null)
	{
		super();

		this._collectionMeta = this.initCollectionMeta();

		if (null !== entities) {
			this._initialEntities = entities;
		} else {
			this._initialEntities = [];
		}
		this._currentEntities = this._initialEntities.slice();
		this._relayEntityEvents = relayEvents;
		this._readOnly = readOnly;
		if (null === uuid) {
			uuid = Registry
				.getInstance()
				.getUUIDGenerator()
				.uuid(this._collectionMeta.entityMeta.name);
		}
		this._uuid = uuid;
		if (this._relayEntityEvents && this.length) {
			this.relayAll(this._currentEntities);
			this.unrelayAll(this._currentEntities, [TransactionEvent.BEGIN, TransactionEvent.COMMIT, TransactionEvent.ROLLBACK]);
		} 
	}

	protected abstract initCollectionMeta(): CollectionMeta;

	public get uuid(): string
	{
		return this._uuid;
	}

	public get collectionMeta(): CollectionMeta
	{
		return this._collectionMeta;
	}

	public get entityMeta(): EntityMeta
	{
		return this._collectionMeta.entityMeta;
	}

	public get added(): Entity[]
	{
		var i: number,
			entities: Entity[] = this._currentEntities,
			ret: Entity[] = [];

		for (i = 0; i < entities.length; i++) {
			if (this._initialEntities.indexOf(entities[i]) === -1) {
				ret.push(entities[i]);
			}
		}

		return ret;
	}

	public get removed(): Entity[]
	{
		var i: number,
			entities: Entity[] = this._currentEntities,
			ret: Entity[] = [];

		for (i = 0; i < this._initialEntities.length; i++) {
			if (entities.indexOf(this._initialEntities[i]) === -1) {
				ret.push(entities[i]);
			}
		}

		return ret;
	}

	public get length(): number
	{
		return this._currentEntities.length;
	}

	public get readOnly(): boolean
	{
		return this._readOnly;
	}

	public addEntity(entity: Entity, options: boolean | Object = {}, force: boolean = false): boolean
	{
		if (this.hasEntity(entity)) {
			return true;
		}

		return this.addEntities([entity], options, force);
	}

	public addEntities(entities: Entity[], options: boolean | Object = {}, force: boolean = false): boolean
	{
		var i: number,
			event: CollectionEvent,
			eventType: EventType,
			addedEntities: Entity[] = [];

		for (i = 0; i < entities.length; i++) {
			if (!this.hasEntity(entities[i])) {
				addedEntities.push(entities[i]);
			}
		}

		if (0 === addedEntities.length) {
			return true;
		}

		if (this._readOnly) {
			return false;
		}

		if (false !== options) {
			eventType = [
				CollectionEvent.BEFORE_ADD,
				{ [this._collectionMeta.entityMeta.name]: CollectionEvent.BEFORE_ADD }
			];
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, addedEntities, [], !force, options);
				this.dispatch(event);
				if (event.isDefaultPrevented) {
					if (this.hasTransaction()) {
						this.getTransaction().rollback();
					}
					return false;
				}
			}
		}

		if (this._relayEntityEvents) {
			this.relayAll(addedEntities);
			this.unrelayAll(addedEntities, [TransactionEvent.BEGIN, TransactionEvent.COMMIT, TransactionEvent.ROLLBACK]);
		}

		if (this.hasTransaction() && this._transactionDeep) {
			for (i = 0; i < addedEntities.length; i++) {
				addedEntities[i].beginTransaction(this._transaction, true, options);
			}
		}

		for (i = 0; i < addedEntities.length; i++) {
			this._currentEntities.push(addedEntities[i]);
		}

		if (false !== options && !this.hasTransaction()) {
			eventType = [
				CollectionEvent.ADDED,
				{ [this._collectionMeta.entityMeta.name]: CollectionEvent.ADDED }
			];
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, addedEntities, [], false, options);
				this.dispatch(event);
			}
		}

		return true;
	}

	public hasEntity(entity: Entity): boolean
	{
		return this.indexOf(entity) > -1;
	}

	public getAt(index: number): Entity
	{
		return this._currentEntities[index];
	}

	public indexOf(entity: Entity): number
	{
		return this._currentEntities.indexOf(entity);
	}

	public removeEntity(entity: Entity, options: boolean | Object = {}, force: boolean = false): boolean
	{
		if (!this.hasEntity(entity)) {
			return true;
		}

		return this.removeEntities([entity], options, force);
	}

	public removeEntities(entities: Entity[], options: boolean | Object = {}, force: boolean = false): boolean
	{
		var i: number,
			index: number,
			event: CollectionEvent,
			eventType: EventType,
			removedEntities: Entity[] = [];

		for (i = 0; i < entities.length; i++) {
			if (this.hasEntity(entities[i])) {
				removedEntities.push(entities[i]);
			}
		}

		if (0 === this.length) {
			return true;
		}

		if (this.readOnly) {
			return false;
		}

		if (false !== options) {
			eventType = [
				CollectionEvent.BEFORE_REMOVE,
				{ [this._collectionMeta.entityMeta.name]: CollectionEvent.BEFORE_REMOVE }
			];
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, [], removedEntities, !force, options);
				this.dispatch(event);
				if (event.isDefaultPrevented) {
					if (this.hasTransaction()) {
						this.getTransaction().rollback();
					}
					return false;
				}
			}
		}

		if (this._relayEntityEvents) {
			this.unrelayAll(removedEntities);
		}

		for (i = 0; i < removedEntities.length; i++) {
			index = this.indexOf(removedEntities[i]);
			if (index > -1) {
				this._currentEntities.splice(index, 1);
			}
		}

		if (false !== options && !this.hasTransaction()) {
			eventType = [
				CollectionEvent.REMOVED,
				{ [this._collectionMeta.entityMeta.name]: CollectionEvent.REMOVED }
			];
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, [], removedEntities, false, options);
				this.dispatch(event);
			}
		}

		return true;
	}

	public removeAllEntities(options: boolean | Object = {}, force: boolean = false): boolean
	{
		return this.clear(options, force);
	}

	public clear(options: boolean | Object = {}, force: boolean = false): boolean
	{
		var i: number,
			event: CollectionEvent,
			eventType: EventType,
			removedEntities: Entity[] = [];

		if (0 === this.length) {
			return true;
		}

		if (this.readOnly) {
			return false;
		}

		for (i = 0; i < this._currentEntities.length; i++) {
			removedEntities.push(this._currentEntities[i]);
		}

		if (false !== options) {
			eventType = [
				CollectionEvent.BEFORE_REMOVE,
				{ [this._collectionMeta.entityMeta.name]: CollectionEvent.BEFORE_REMOVE }
			];
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, [], removedEntities, !force, options);
				this.dispatch(event);
				if (event.isDefaultPrevented) {
					if (this.hasTransaction()) {
						this.getTransaction().rollback();
					}
					return false;
				}
			}
		}

		if (this._relayEntityEvents) {
			this.unrelayAll(removedEntities);
		}
		this._currentEntities.length = 0;

		if (false !== options && !this.hasTransaction()) {
			eventType = [
				CollectionEvent.REMOVED,
				{ [this._collectionMeta.entityMeta.name]: CollectionEvent.REMOVED }
			];
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, [], removedEntities, false, options);
				this.dispatch(event);
			}
		}

		return true;
	}

	public flush(): void
	{
		var i: number;
		this._initialEntities.length = 0;
		for (i = 0; i < this._currentEntities.length; i++) {
			this._initialEntities.push(this._currentEntities[i]);
		}
	}

	public revert(options: boolean | Object = {}): boolean
	{
		// if (!this.dirty) {
		// 	return true;
		// }

		if (this.readOnly) {
			return false;
		}
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
			transaction = transaction = Registry.getInstance()
				.getTransactionRegistry()
				.createTransaction();
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
		this._transactionEntities = this._currentEntities.slice();
		this.relay(transaction, null, 1);

		if (deep !== this._transactionDeep && deep) {
			this._transactionDeep = deep;

			for (i = 0; i < this._currentEntities.length; i++) {
				this._currentEntities[i].beginTransaction(transaction, true, options);
			}
		}

		if (this.willDispatch(TransactionEvent.BEGIN)) {
			e = new TransactionEvent(TransactionEvent.BEGIN, transaction, false, options);
			this.dispatch(e);
		}

		return transaction;
	}

	private onTransactionCommit(event: TransactionEvent, extra: Object): void
	{
		var i: number,
			index: number,
			e: CollectionEvent,
			eventType: any[],
			entity: Entity,
			addedEntities: Entity[] = [],
			removedEntities: Entity[] = [];

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

		for (i = 0; i < this._transactionEntities.length; i++) {
			entity = this._transactionEntities[i];
			if (this._currentEntities.indexOf(entity) === -1) {
				removedEntities.push(entity);
			}
		}

		for (i = 0; i < this._currentEntities.length; i++) {
			entity = this._currentEntities[i];
			if (this._transactionEntities.indexOf(entity) === -1) {
				addedEntities.push(entity);
			}
		}

		if (addedEntities.length > 0 || removedEntities.length > 0) {
			eventType = [];
			if (addedEntities.length > 0) {
				eventType.push(CollectionEvent.ADDED);
				eventType.push({ [this._collectionMeta.entityMeta.name]: CollectionEvent.ADDED });
			}
			if (removedEntities.length > 0) {
				eventType.push(CollectionEvent.REMOVED);
				eventType.push({ [this._collectionMeta.entityMeta.name]: CollectionEvent.REMOVED });
			}
			if (this.willDispatch(eventType)) {
				e = new CollectionEvent(eventType, this, addedEntities, removedEntities, false, event.options);
				this.dispatch(e);
			}
		}
	}

	private onTransactionRollback(e: TransactionEvent, extra: Object): void
	{
		var i: number,
			fieldName: string;

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

		if (this._relayEntityEvents) {
			this.unrelayAll(this._currentEntities);
		}
		this._currentEntities = this._transactionEntities.slice();
		if (this._relayEntityEvents) {
			this.relayAll(this._currentEntities);
			this.unrelayAll(this._currentEntities, [TransactionEvent.BEGIN, TransactionEvent.COMMIT, TransactionEvent.ROLLBACK]);
		}
	}	
}