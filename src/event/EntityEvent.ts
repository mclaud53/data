import {Event, EventType} from 'frog-event-dispatcher';
import {Entity, EntityState} from '../Entity';

export class EntityEvent extends Event<Entity>
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
	private _newState: EntityState;
	private _oldState: EntityState;

	public constructor(type: EventType, target: Entity, fields: string[], newState: EntityState, oldState: EntityState, cancellable: boolean, options?: Object)
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

	public get newStage(): EntityState
	{
		return this._newState;
	}

	public get oldStage(): EntityState
	{
		return this._oldState;
	}
}