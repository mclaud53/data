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

	private _name2Field: { [key: string]: field.Field; } = {};

	private _primaryNames: string[];

	private _fieldsNames: string[] = [];

	private _name2Relation: {[key: string]: rel.Relation} = {};

	private _relationsNames: string[] = [];

	private _related: { [key: string]: base.Base } = {};

	private _initialState: EntityState = {};

	private _currentState: EntityState = {};

	private _tmpFields: string[] = [];

	private _tmpState: EntityState = {};

	private _tmpStateNew: EntityState = {};

	private _tmpStateOld: EntityState = {};

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
	}

	private _initFields(fields: { [key: string]: field.Field; }, primary: Primary, data: EntityState = null): void
	{
		var i: number,
			name: string,
			field: field.Field,
			value: any;

		if (null === data) {
			data = this._tmpState;
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
			relation: rel.Relation,
			relTypes: rel.RelationType[] = [rel.RelationType.BelongsTo];

		// for (i = 0; i < relations.length; i++) {
		// 	relation = relations[i];
		// 	name = relation.name;

		// 	if (this._relationsNames.indexOf(name) > -1) {
		// 		throw new Error('Duplicate declaration of relation: ' + name);
		// 	}

		// 	if (relTypes.indexOf(relation.type) > -1) {
		// 		if (!relation.foreignField) {
		// 			throw new Error('For relation of type ' + rel.RelationType[relation.type] + ' foreignKey must be specified!');
		// 		}

		// 		if (relation.foreignField instanceof Array) {
		// 			for (j = 0; j < relation.foreignField.length; j++) {
		// 				if (this.fieldsNames.indexOf(relation.foreignField[j]) === -1) {
		// 					throw new Error('Foreign field ' + relation.foreignField[j] + ' of relation ' + name + ' isn\'t declared in model ' + this.name);
		// 				}
		// 			}
		// 		} else {
		// 			if (this.fieldsNames.indexOf(relation.foreignField) === -1) {
		// 				throw new Error('Foreign field ' + relation.foreignField + ' of relation ' + name + ' isn\'t declared in model ' + this.name);
		// 			}
		// 		}
		// 	}

		// 	this._name2Relation[name] = relations[i];
		// 	this._relationsNames.push(name);
		// 	this._related[name] = null;
		// }
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

	public get(field: string, initial: boolean = false): any
	{
		if (!this._name2Field.hasOwnProperty(field)) {
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

	public getState(initial: boolean = false, copy: boolean = false): EntityState
	{
		var ret: EntityState;

		if (copy) {
			ret = {};
		} else {
			ret = this._tmpState;
		}

		ret = this._fillState(ret, initial);

		return ret;
	}

	public setState(state: EntityState, options: boolean | Object = {}): boolean
	{
		var i: number,
			field: string,
			fields: string[] = this._tmpFields,
			e: entityEvent.EntityEvent,
			events: any,
			oldState: EntityState = this._fillState(this._tmpStateOld),
			newState: EntityState = this._fillState(this._tmpStateNew);

		fields.length = 0;

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

	public getRelationName(modelName: string, relationType: rel.RelationType): string
	{
		throw new Error('Method getRelationName not implemented yet');
		// return null;
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
			state: EntityState,
			relation: rel.Relation,
			related: base.Base,
			backwardRealtion: rel.Relation,
			backwardRealtionName: string,
			e: relEvent.RelationEvent,
			newRelation: base.Base = value,
			oldRelation: base.Base = this.getRelated(name);

		// @todo

		if (this._related[name] === value) {
			return true;
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
				e = new relEvent.RelationEvent(events, this, name, newRelation, oldRelation, true, options);
				this.dispatch(e);
				if (e.isDefaultPrevented) {
					return false;
				}
			}
		}

		// state = this.getState();
		// relation = this.getRelation(name);

		// if (oldRelation) {
		// 	if (relation.relayEvents) {
		// 		oldRelation.unrelay(this);
		// 	}

		// 	switch (relation.type) {
		// 		case rel.RelationType.BelongsTo:
		// 			if (oldRelation instanceof Entity) {
		// 				backwardRealtionName = oldRelation.getRelationName(this.name, rel.RelationType.HasOne);
		// 				if (null !== backwardRealtionName) {
		// 					if (oldRelation.setRelated(backwardRealtionName, null, options, false)) {
		// 						return false;
		// 					}
		// 				}
		// 			}
					
		// 			break;

		// 		case rel.RelationType.HasOne:
		// 			break;

		// 		case rel.RelationType.HasMany:
		// 			break;
		// 	}

		// }

		// if (newRelation) {

		// } else {

		// }

		// if (!this.setState(state, options)) {
		// 	return false;
		// }

		this._related[name] = value;

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
				e = new relEvent.RelationEvent(events, this, name, newRelation, oldRelation, false, options);
				this.dispatch(e);
			}
		}

		return true;
	}

	public clear(): Entity
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

		return this;
	}

	public revert(): Entity
	{
		var i: number,
			field: string;

		for (i = 0; i < this.fieldsNames.length; i++) {
			field = this.fieldsNames[i];

			if (this._currentState.hasOwnProperty(field)) {
				delete this._currentState[field];
			}
		}

		return this;
	}

	public flush(): Entity
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

		return this;
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