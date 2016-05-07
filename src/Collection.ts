import {EventDispatcher, Event} from 'frog-event-dispatcher';
import {Registry} from './Registry';
import {Entity} from './Entity';
import {CollectionEvent} from './event/CollectionEvent';
import {CollectionMeta} from './meta/CollectionMeta';

export abstract class Collection extends EventDispatcher<Event<any>, any>
{
	private _collectionMeta: CollectionMeta;

	private _uuid: string;

	private _initialEntities: Entity[];

	private _currentEntities: Entity[];

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
			this.relayAll(this._entities);
		} 
	}

	protected abstract initCollectionMeta(): CollectionMeta;

	public get added(): Entity[]
	{
		var i: number,
			entities: Entity[] = this._entities,
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
			entities: Entity[] = this._entities,
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
		return this._entities.length;
	}

	public get readOnly(): boolean
	{
		return this._readOnly;
	}

	public addEntity(entity: Entity, options: boolean | Object = {}): boolean
	{
		if (this.hasEntity(entity)) {
			return true;
		}

		return this.addEntities([entity], options);
	}

	public addEntities(entities: Entity[], options: boolean | Object = {}): boolean
	{
		var i: number,
			event: CollectionEvent,
			eventType: string,
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
			eventType = this._collectionMeta.entityMeta.name + this.separator + CollectionEvent.BEFORE_ADD;
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, addedEntities, [], true, options);
				this.dispatch(event);
				if (event.isDefaultPrevented) {
					return false;
				}
			}
		}

		if (this._relayEntityEvents) {
			this.relayAll(addedEntities);
		}

		for (i = 0; i < addedEntities.length; i++) {
			this._entities.push(addedEntities[i]);
		}

		if (false !== options) {
			eventType = this._collectionMeta.entityMeta.name + this.separator + CollectionEvent.ADDED;
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

	public indexOf(entity: Entity): number
	{
		return this._entities.indexOf(entity);
	}

	public removeEntity(entity: Entity, options: boolean | Object = {}): boolean
	{
		if (!this.hasEntity(entity)) {
			return true;
		}

		return this.removeEntities([entity], options);
	}

	public removeEntities(entities: Entity[], options: boolean | Object = {}): boolean
	{
		var i: number,
			index: number,
			event: CollectionEvent,
			eventType: string,
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
			eventType = this._collectionMeta.entityMeta.name + this.separator + CollectionEvent.BEFORE_REMOVE;
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, [], removedEntities, true, options);
				this.dispatch(event);
				if (event.isDefaultPrevented) {
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
				this._entities.splice(index, 1);
			}
		}

		if (false !== options) {
			eventType = this._collectionMeta.entityMeta.name + this.separator + CollectionEvent.REMOVED;
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, [], removedEntities, false, options);
				this.dispatch(event);
			}
		}

		return true;
	}

	public removeAllEntities(options: boolean | Object = {}): boolean
	{
		return this.clear(options);
	}

	public clear(options: boolean | Object = {}): boolean
	{
		var i: number,
			event: CollectionEvent,
			eventType: string,
			removedEntities: Entity[] = [];

		if (0 === this.length) {
			return true;
		}

		if (this.readOnly) {
			return false;
		}

		for (i = 0; i < this._entities.length; i++) {
			removedEntities.push(this._entities[i]);
		}

		if (false !== options) {
			eventType = this._collectionMeta.entityMeta.name + this.separator + CollectionEvent.BEFORE_CLEAR;
			if (this.willDispatch(eventType)) {
				event = new CollectionEvent(eventType, this, [], removedEntities, true, options);
				this.dispatch(event);
				if (event.isDefaultPrevented) {
					return false;
				}
			}
		}

		if (this._relayEntityEvents) {
			this.unrelayAll(removedEntities);
		}
		this._entities.length = 0;

		if (false !== options) {
			eventType = this._collectionMeta.entityMeta.name + this.separator + CollectionEvent.CLEARED;
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

	protected get _entities(): Entity[]
	{
		return this._currentEntities;
	}
}