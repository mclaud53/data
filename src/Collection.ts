import fed = require('frog-event-dispatcher');
import base = require('./Base');
import reg = require('./Registry');
import en = require('./Entity');
import ce = require('./event/CollectionEvent');

export class Collection extends base.Base
{

	private _name: string;

	private _uuid: string;

	private _tmp1: en.Entity[] = [];

	private _tmp2: en.Entity[] = [];

	private _entities: en.Entity[];

	private _readOnly: boolean = false;

	private _relayEntityEvents: boolean;

	public constructor(name: string, entities: en.Entity[] = null, relayEvents: boolean = false, readOnly: boolean = false, uuid: string = null)
	{
		super();

		this._name = name;
		if (null !== entities) {
			this._entities = entities;
		} else {
			this._entities = [];
		}
		this._relayEntityEvents = relayEvents;
		this._readOnly = readOnly;
		if (null === uuid) {
			uuid = reg.Registry
				.getInstance()
				.getUUIDGenerator()
				.uuid(name);
		}
		this._uuid = uuid;
		if (this._relayEntityEvents && this.length) {
			this.relayAll(this._entities);
		} 
	}

	public get name(): string
	{
		return this._name;
	}

	public get length(): number
	{
		return this._entities.length;
	}

	public get readOnly(): boolean
	{
		return this._readOnly;
	}

	public addEntity(entity: en.Entity, options: boolean | Object = {}): boolean
	{
		if (this.hasEntity(entity)) {
			return true;
		}

		this._tmp1.length = 0;
		this._tmp1.push(entity);

		return this.addEntities(this._tmp1, options);
	}

	public addEntities(entities: en.Entity[], options: boolean | Object = {}): boolean
	{
		var i: number,
			event: ce.CollectionEvent,
			eventType: string,
			_entities: en.Entity[] = this._tmp2;

		_entities.length = 0;
		for (i = 0; i < entities.length; i++) {
			if (!this.hasEntity(entities[i])) {
				_entities.push(entities[i]);
			}
		}

		if (0 === _entities.length) {
			return true;
		}

		if (this._readOnly) {
			return false;
		}

		if (false !== options) {
			eventType = this.name + this.separator + ce.CollectionEvent.BEFORE_ADD;
			if (this.willDispatch(eventType)) {
				event = new ce.CollectionEvent(eventType, this, _entities, true, options);
				this.dispatch(event);
				if (event.isDefaultPrevented) {
					return false;
				}
			}
		}

		if (this._relayEntityEvents) {
			this.relayAll(_entities);
		}

		for (i = 0; i < _entities.length; i++) {
			this._entities.push(_entities[i]);
		}

		if (false !== options) {
			eventType = this.name + this.separator + ce.CollectionEvent.ADDED;
			if (this.willDispatch(eventType)) {
				event = new ce.CollectionEvent(eventType, this, _entities, false, options);
				this.dispatch(event);
			}
		}

		return true;
	}

	public hasEntity(entity: en.Entity): boolean
	{
		return this.indexOf(entity) > -1;
	}

	public indexOf(entity: en.Entity): number
	{
		return this._entities.indexOf(entity);
	}

	public removeEntity(entity: en.Entity, options: boolean | Object = {}): boolean
	{
		if (!this.hasEntity(entity)) {
			return true;
		}

		this._tmp1.length = 0;
		this._tmp1.push(entity);

		return this.removeEntities(this._tmp1, options);
	}

	public removeEntities(entities: en.Entity[], options: boolean | Object = {}): boolean
	{
		var i: number,
			index: number,
			event: ce.CollectionEvent,
			eventType: string,
			_entities: en.Entity[] = this._tmp2;

		_entities.length = 0;
		for (i = 0; i < entities.length; i++) {
			if (this.hasEntity(entities[i])) {
				_entities.push(entities[i]);
			}
		}

		if (0 === _entities.length) {
			return true;
		}

		if (this._readOnly) {
			return false;
		}

		if (false !== options) {
			eventType = this.name + this.separator + ce.CollectionEvent.BEFORE_REMOVE;
			if (this.willDispatch(eventType)) {
				event = new ce.CollectionEvent(eventType, this, _entities, true, options);
				this.dispatch(event);
				if (event.isDefaultPrevented) {
					return false;
				}
			}
		}

		if (this._relayEntityEvents) {
			this.unrelayAll(_entities);
		}

		for (i = 0; i < _entities.length; i++) {
			index = this.indexOf(_entities[i]);
			if (index > -1) {
				this._entities.splice(index, 1);
			}
		}

		if (false !== options) {
			eventType = this.name + this.separator + ce.CollectionEvent.REMOVED;
			if (this.willDispatch(eventType)) {
				event = new ce.CollectionEvent(eventType, this, _entities, false, options);
				this.dispatch(event);
			}
		}

		return true;
	}

	public removeAllEntities(options: boolean | Object = {}): boolean
	{
		var i: number,
			event: ce.CollectionEvent,
			eventType: string,
			_entities: en.Entity[] = this._tmp2;

		if (0 === this.length) {
			return true;
		}

		if (this._readOnly) {
			return false;
		}

		_entities.length = 0;
		for (i = 0; i < this._entities.length; i++) {
			_entities.push(this._entities[i]);
		}

		if (false !== options) {
			eventType = this.name + this.separator + ce.CollectionEvent.BEFORE_REMOVE;
			if (this.willDispatch(eventType)) {
				event = new ce.CollectionEvent(eventType, this, _entities, true, options);
				this.dispatch(event);
				if (event.isDefaultPrevented) {
					return false;
				}
			}
		}

		if (this._relayEntityEvents) {
			this.unrelayAll(this._entities);
		}
		this._entities.length = 0;

		if (false !== options) {
			eventType = this.name + this.separator + ce.CollectionEvent.REMOVED;
			if (this.willDispatch(eventType)) {
				event = new ce.CollectionEvent(eventType, this, _entities, false, options);
				this.dispatch(event);
			}
		}

		return true;
	}
}