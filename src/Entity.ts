/// <reference path="../typings/main.d.ts" />

import fed = require('frog-event-dispatcher');
import base = require('./Base');
import reg = require('./Registry');
import field = require('./Field');

export type EntityState = { [key: string]: any; };
export type Options = { [key: string]: any; };

export class Entity extends fed.EventDispatcher<fed.Event<base.Base>, base.Base> implements base.Base
{
	private _name: string;

	private _uuid: string;

	private _fields: field.Field[];

	private _name2Field: { [key: string]: field.Field; } = {};

	private _fieldsNames: string[] = [];

	private _initialState: EntityState = {};

	private _currentState: EntityState = {};

	private _tmpFields: string[] = [];

	private _tmpState: EntityState = {};

	private _tmpStateNew: EntityState = {};

	private _tmpStateOld: EntityState = {};

	public constructor(name: string, fields: field.Field[], data: EntityState = null, uuid: string = null)
	{
		super();

		this._name = name;

		this._initFields(fields, data);

		if (null === uuid) {
			uuid = reg.Registry
				.getInstance()
				.getUUIDGenerator()
				.uuid(name);
		}

		this._uuid = uuid;
	}

	private _initFields(fields: field.Field[], data: EntityState = null): void
	{
		var i: number,
			name: string,
			value: any;

		if (null === data) {
			data = this._tmpState;
		}

		for (i = 0; i < fields.length; i++) {
			name = fields[i].name;
			if (data.hasOwnProperty(name)) {
				value = data[name]
			} else {
				value = fields[i].defaultValue;
			}

			this._name2Field[name] = fields[i];
			this._fieldsNames.push(name);
			this._initialState[name] = value;
		}

		this._fields = fields;
	}

	public get fields(): field.Field[]
	{
		return this._fields;
	}

	public get fieldsNames(): string[]
	{
		return this._fieldsNames;
	}

	public get name(): string
	{
		return this._name;
	}

	public get uuid(): string
	{
		return this._uuid;
	}

	public get(key: string, initial: boolean = false): any
	{
		if (!this._name2Field.hasOwnProperty(key)) {
			throw new Error('Field don\'t exist ' + key);
		}

		if (!initial && this._currentState.hasOwnProperty(key)) {
			return this._currentState[key];
		}

		return this._initialState[key];
	}

	public set(key: string, value: any, options: Options = null): boolean
	{
		if (!this._name2Field.hasOwnProperty(key)) {
			throw new Error('Field don\'t exist ' + key);
		}

		var state: EntityState = this.getState();

		state[key] = value;

		return this.setState(state, options);
	}

	public getState(copy: boolean = false): EntityState
	{
		var ret: EntityState;

		if (copy) {
			ret = {};
		} else {
			ret = this._tmpState;
		}

		ret = this._fillState(ret);

		return ret;
	}

	public setState(state: EntityState, options: Options = null): boolean
	{
		var i: number,
			field: string,
			fields: string[] = this._tmpFields,
			oldState: EntityState = this._fillState(this._tmpStateOld),
			newState: EntityState = this._fillState(this._tmpStateNew);

		fields.length = 0;

		for (i = 0; i < this.fieldsNames.length; i++) {
			if (!state.hasOwnProperty(field)) {
				continue;
			}

			if (state[field] === newState[field]) {
				continue;
			}

			newState[field] = state[field];
			fields.push(field);
		}

		if (0 === fields.length) {
			return true;
		}

		

		return true;
	}

	public getRelation<R extends base.Base>()
	{
		return null;
	}

	public setRelation<R extends base.Base>(value: R, options: Options = null): boolean
	{
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