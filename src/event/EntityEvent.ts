import fed = require('frog-event-dispatcher');
import entity = require('../Entity');

export class EntityEvent extends fed.Event<entity.Entity>
{
	public static get BEFORE_CHANGE(): string
	{
		return 'beforeChange';
	}

	public static get CHANGED(): string
	{
		return 'changed';
	}

	private _fields: string[];
	private _newState: entity.EntityState;
	private _oldState: entity.EntityState;

	public constructor(type: fed.EventType, target: entity.Entity, fields: string[], newState: entity.EntityState, oldState: entity.EntityState, cancellable: boolean, options?: Object)
	{
		super(type, target, cancellable, options);
		this._fields = fields;
		this._newState = newState;
		this._oldState = oldState;
	}

	public get fields(): string[]
	{
		return this._fields;
	}

	public get newStage(): entity.EntityState
	{
		return this._newState;
	}

	public get oldStage(): entity.EntityState
	{
		return this._oldState;
	}
}