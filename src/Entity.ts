/// <reference path="../typings/main.d.ts" />

import fed = require('frog-event-dispatcher');
import base = require('./Base');
import reg = require('./Registry');
import field = require('./field/Field');
import entityEvent = require('./event/EntityEvent');
import relEvent = require('./event/RelationEvent');
import rel = require('./Relation');
import col = require('./Collection');

export type EntityState = { [key: string]: any; };
export type Primary = string | string[];

export class Entity extends base.Base
{
	private _name: string;

	private _uuid: string;

	private _readOnly: boolean;

	private _name2Field: { [key: string]: field.Field; } = {};

	private _primaryNames: string[];

	private _fieldsNames: string[] = [];

	private _name2Relation: {[key: string]: rel.Relation} = {};

	private _relationsNames: string[] = [];

	private _related: { [key: string]: base.Base } = {};

	private _initialState: EntityState = {};

	private _currentState: EntityState = {};

	public constructor(name: string,
		fields: { [key: string]: field.Field; },
		primary: Primary,
		relations: { [key: string]: rel.Relation; } = null,
		data: EntityState = null,
		isNew: boolean = true,
		readOnly: boolean = false,
		uuid: string = null)
	{
		super();

		this._name = name;

		this._initFields(fields, primary, data);

		if (null !== relations) {
			this._initRelations(relations);
		}

		if (null === uuid) {
			uuid = reg.Registry
				.getInstance()
				.getUUIDGenerator()
				.uuid(name);
		}

		this._uuid = uuid;

		this._readOnly = readOnly;
	}

	private _initFields(fields: { [key: string]: field.Field; }, primary: Primary, data: EntityState = null): void
	{
		var i: number,
			name: string,
			field: field.Field,
			value: any;

		if (null === data) {
			data = {};
		}

		for (name in fields) {
			field = fields[name];
			if (data.hasOwnProperty(name)) {
				value = data[name]
			} else {
				value = field.defaultValue;
			}

			this._name2Field[name] = field;
			this._fieldsNames.push(name);
			this._initialState[name] = value;
		}

		if (primary instanceof Array) {
			for (i = 0; i < primary.length; i++) {
				if (this.fieldsNames.indexOf(primary[i]) === -1) {
					throw new Error('Primary field ' + primary[i] + ' isn\'t declared in model: ' + this.name);
				}
			}
			this._primaryNames = primary;
		} else {
			if (this.fieldsNames.indexOf(primary) === -1) {
				throw new Error('Primary field ' + primary + ' isn\'t declared in model: ' + this.name);
			}
			this._primaryNames = [primary];
		}
	}

	private _initRelations(relations: { [key: string]: rel.Relation; }): void
	{
		var i: number,
			j: number,
			name: string,
			field: string,
			relation: rel.Relation;

		for (name in relations) {
			if (this.fieldsNames.indexOf(name) > -1) {
				throw new Error('Relation ' + name + ' already declared in field list of model: ' + this.name);
			}
			relation = relations[name];

			for (field in relation.fieldsMap) {
				if (this.fieldsNames.indexOf(field) === -1) {
					throw new Error('Field ' + field + ' isn\'t registered in model ' + this.name + ' for relation ' + name);
				}
			}

			this._name2Relation[name] = relation;
			this._relationsNames.push(name);
			this._related[name] = null;
		}
	}

	public get id(): any
	{
		var i: number,
			ret: any;

		if (1 === this.primaryNames.length) {
			ret = this.get(this.primaryNames[0]);
		} else {
			ret = [];
			for (i = 0; i < this.primaryNames.length; i++) {
				ret.push(this.get(this.primaryNames[i]));
			}
		}

		return ret;
	}

	public get primaryNames(): string[]
	{
		return this._primaryNames;
	}

	public get fieldsNames(): string[]
	{
		return this._fieldsNames;
	}

	public get relationsNames(): string[]
	{
		return this._relationsNames;
	}

	public get name(): string
	{
		return this._name;
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
		if (this.fieldsNames.indexOf(field) === -1) {
			throw new Error('Field don\'t exist ' + field);
		}

		if (!initial && this._currentState.hasOwnProperty(field)) {
			return this._currentState[field];
		}

		return this._initialState[field];
	}

	public set(field: string, value: any, options: boolean | Object = {}): boolean
	{
		if (!this._name2Field.hasOwnProperty(field)) {
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
			e: entityEvent.EntityEvent,
			events: any,
			oldState: EntityState = this._fillState({}),
			newState: EntityState = this._fillState({});

		for (i = 0; i < this.fieldsNames.length; i++) {
			field = this.fieldsNames[i];
			if (!state.hasOwnProperty(field)) {
				continue;
			}

			state[field] = this._name2Field[field].filter(state[field]);

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
				entityEvent.EntityEvent.BEFORE_CHANGE,
				{
					[this.name]: [
						entityEvent.EntityEvent.BEFORE_CHANGE,
						{
							[entityEvent.EntityEvent.BEFORE_CHANGE]: fields
						}
					]
				}
			];

			if (this.willDispatch(events)) {
				e = new entityEvent.EntityEvent(events, this, fields, newState, oldState, true, options);
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
				[this.name]: [
					entityEvent.EntityEvent.CHANGED,
					{
						[entityEvent.EntityEvent.CHANGED]: fields
					}
				]
			};

			if (this.willDispatch(events)) {
				e = new entityEvent.EntityEvent(events, this, fields, newState, oldState, false, options);
				this.dispatch(e);
			}
		}

		return true;
	}

	public getRelation(name: string): rel.Relation
	{
		return this.hasRelation(name) ? this._name2Relation[name] : null;
	}

	public findRelationName(entityName: string, relationType: rel.RelationType): string
	{
		var i: number,
			name: string,
			relation: rel.Relation;

		for (i = 0; i < this.relationsNames.length; i++) {
			name = this.relationsNames[i];
			relation = this._name2Relation[name];
			if ((relation.entityName === entityName) && (relation.type === relationType)) {
				return name;
			}
		}

		return null;
	}

	public hasRelation(name: string): boolean
	{
		return this.relationsNames.indexOf(name) > -1;
	}

	public getRelated(name: string): base.Base
	{
		return this.hasRelated(name) ? this._related[name] : null;
	}

	public hasRelated(name: string): boolean
	{
		if (!this.hasRelation(name)) {
			throw new Error('Relation with name: ' + name + ' isn\'t exist in entity ' + this.name);
		}
		return !!this._related[name];
	}

	public setRelated(name: string, value: base.Base, options: boolean | Object = {}, updateRelated: boolean = true): boolean
	{
		var events: any,
			relation: rel.Relation = this.getRelation(name),
			e: relEvent.RelationEvent,
			newRelated: base.Base = value,
			oldRelated: base.Base = this.getRelated(name);

		if (value.name !== relation.entityName) {
			throw new Error('Relation must has name: ' + relation.entityName + ' passed model with name: ' + value.name);
		}

		if (this._related[name] === value) {
			return true;
		}

		if (this.readOnly) {
			return false;
		}

		if (false !== options) {
			events = {
				[this.name]: [
					relEvent.RelationEvent.BEFORE_CHANGE,
					{
						[relEvent.RelationEvent.BEFORE_CHANGE]: [name]
					}
				]
			};

			if (this.willDispatch(events)) {
				e = new relEvent.RelationEvent(events, this, name, newRelated, oldRelated, true, options);
				this.dispatch(e);
				if (e.isDefaultPrevented) {
					return false;
				}
			}
		}

		switch (relation.type) {
			case rel.RelationType.BelongsTo:
				if (!this._assignBelongsTo(name, relation, newRelated, oldRelated, options, updateRelated)) {
					return false;
				}
				break;

			case rel.RelationType.HasOne:
				if (!this._assignHasOne(name, relation, newRelated, oldRelated, options, updateRelated)) {
					return false;
				}
				break;

			case rel.RelationType.HasMany:
				if (!this._assignHasMany(name, relation, newRelated, oldRelated, options, updateRelated)) {
					return false;
				}
				break;
		}

		if (false !== options) {
			events = {
				[this.name]: [
					relEvent.RelationEvent.CHANGED,
					{
						[relEvent.RelationEvent.CHANGED]: [name]
					}
				]
			};

			if (this.willDispatch(events)) {
				e = new relEvent.RelationEvent(events, this, name, newRelated, oldRelated, false, options);
				this.dispatch(e);
			}
		}

		return true;
	}

	public clear(): boolean
	{
		var i: number,
			field: string;

		for (i = 0; i < this.fieldsNames.length; i++) {
			field = this.fieldsNames[i];

			if (this._initialState.hasOwnProperty(field)) {
				this._initialState[field] = this._name2Field[field].defaultValue;
			}
		}

		this.revert();

		return true;
	}

	public revert(): boolean
	{
		var i: number,
			field: string;

		for (i = 0; i < this.fieldsNames.length; i++) {
			field = this.fieldsNames[i];

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

		for (i = 0; i < this.fieldsNames.length; i++) {
			field = this.fieldsNames[i];

			if (!this._currentState.hasOwnProperty(field)) {
				continue;
			}

			this._initialState[field] = this._currentState[field];
		}

		this.revert();
	}

	private onRelatedEntityChanged(e: entityEvent.EntityEvent, extra: Object): void
	{
		var name: string = extra['name'],
			field: string,
			relation: rel.Relation = this.getRelation(name),
			related: Entity = e.target,
			state: EntityState = this.getState();

		for (field in relation.fieldsMap) {
			state[field] = related.get(relation.fieldsMap[field]);
		}

		if (!this.setState(state, e.options)) {
			// @todo
		}
	}

	private _assignBelongsTo(name: string, relation: rel.Relation, newRelated: base.Base, oldRelated: base.Base, options: boolean | Object, updateRelated: boolean): boolean
	{
		var i: number,
			field: string,
			related: base.Base,
			tmpRelated: base.Base,
			backwardRelationName: string,
			newState: EntityState = this.getState(),
			oldState: EntityState = this.getState(),
			fields: string[] = [],
			events: Object,
			token: string,
			suspended: base.Base[] = [],
			ret: boolean = true;

		token = this.suspend(true);
		suspended.push(this);
		try {
			if (ret && (oldRelated instanceof Entity)) {
				oldRelated.suspend(true, token);
				suspended.push(oldRelated);
				if (relation.relayEvents) {
					this.unrelay(oldRelated);
				}

				if (updateRelated) {
					backwardRelationName = oldRelated.findRelationName(this.name, rel.RelationType.HasOne);
					if (null !== backwardRelationName) {
						if (!oldRelated.setRelated(backwardRelationName, null, options, false)) {
							ret = false;
						}
					} else {
						backwardRelationName = oldRelated.findRelationName(this.name, rel.RelationType.HasMany);
						if (null !== backwardRelationName) {
							related = oldRelated.getRelated(backwardRelationName);
							if (related instanceof col.Collection) {
								related.suspend(true, token);
								suspended.push(related);
								if (!related.removeEntity(this, options)) {
									ret = false;
								}
							}
						}
					}
				}
			}

			if (ret) {
				if (newRelated instanceof Entity) {
					newRelated.suspend(true, token);
					suspended.push(newRelated);
					for (field in relation.fieldsMap) {
						fields.push(relation.fieldsMap[field]);
						newState[field] = newRelated.get(relation.fieldsMap[field]);
					}

					if (!this.setState(newState, options)) {
						ret = false;
					}

					if (updateRelated) {
						backwardRelationName = newRelated.findRelationName(this.name, rel.RelationType.HasOne);
						if (null !== backwardRelationName) {
							tmpRelated = newRelated.getRelated(backwardRelationName);
							if (!newRelated.setRelated(backwardRelationName, this, options, false)) {
								ret = false;
							}
						} else {
							backwardRelationName = newRelated.findRelationName(this.name, rel.RelationType.HasMany);
							if (null !== backwardRelationName) {
								related = newRelated.getRelated(backwardRelationName);
								if (related instanceof col.Collection) {
									related.suspend(true, token);
									suspended.push(related);
									if (!related.addEntity(this, options)) {
										ret = false;
									}
								}
							}
						}
					}
				} else if (null !== newRelated) {
					throw new Error('Relation "' + name + '" in entity "' + this.name + '" must be instance of Entity');
				} else {
					for (field in relation.fieldsMap) {
						fields.push(relation.fieldsMap[field]);
						newState[field] = this._name2Field[field].defaultValue;
					}

					if (!this.setState(newState, options)) {
						ret = false;
					}
				}			
			}
		} catch (error) {
			ret = false;
			throw error;
		} finally {
			if (!ret) {
				this.setState(oldState, false);

				if (updateRelated && (newRelated instanceof Entity)) {
					backwardRelationName = newRelated.findRelationName(this.name, rel.RelationType.HasOne);
					if (null !== backwardRelationName) {
						if (tmpRelated) {
							newRelated.setRelated(backwardRelationName, tmpRelated, false, false);
						}
					} else {
						backwardRelationName = newRelated.findRelationName(this.name, rel.RelationType.HasMany);
						if (null !== backwardRelationName) {
							related = newRelated.getRelated(backwardRelationName);
							if (related instanceof col.Collection) {
								related.removeEntity(this, false);
							}
						}
					}
				}

				if (oldRelated instanceof Entity) {
					if (updateRelated) {
						backwardRelationName = oldRelated.findRelationName(this.name, rel.RelationType.HasOne);
						if (null !== backwardRelationName) {
							oldRelated.setRelated(backwardRelationName, this, false, false);
						} else {
							backwardRelationName = oldRelated.findRelationName(this.name, rel.RelationType.HasMany);
							if (null !== backwardRelationName) {
								related = oldRelated.getRelated(backwardRelationName);
								if (related instanceof col.Collection) {
									related.addEntity(this, false);
								}
							}
						}
					}
					if (relation.relayEvents) {
						this.relay(oldRelated);
					}
				}

				for (i = suspended.length - 1; i >= 0; i--) {
					suspended[i].purgeQueue(token);
					suspended[i].resume(token);
				}

			}
		}

		if (ret) {
			this._related[name] = newRelated;

			events = {
				[relation.entityName]: {
					[entityEvent.EntityEvent.CHANGED]: fields
				}
			};

			if (oldRelated) {
				oldRelated.removeListener(this.onRelatedEntityChanged, this, events);
			}
			if (newRelated) {
				newRelated.addListener(this.onRelatedEntityChanged, this, events, {
					extra: {
						name: name
					}
				});
				if (relation.relayEvents) {
					this.relay(newRelated);
				}
			}

			for (i = suspended.length - 1; i >= 0; i--) {
				suspended[i].resume(token);
			}
		}

		return ret;
	}

	private _assignHasOne(name: string, relation: rel.Relation, newRelated: base.Base, oldRelated: base.Base, options: boolean | Object, updateRelated: boolean): boolean
	{
		return true;
	}

	private _assignHasMany(name: string, relation: rel.Relation, newRelated: base.Base, oldRelated: base.Base, options: boolean | Object, updateRelated: boolean): boolean
	{
		return true;
	}

	private _fillState(state: EntityState, initial: boolean = false): EntityState
	{
		var i: number,
			field: string;

		for (i = 0; i < this.fieldsNames.length; i++) {
			field = this.fieldsNames[i];
			state[field] = this.get(field, initial);
		}

		return state;
	}
}