import {Event, EventType} from 'frog-event-dispatcher';
import {Entity} from '../Entity';
import {Collection} from '../Collection';

export class RelationEvent extends Event<Entity>
{
	public static get BEFORE_CHANGE(): string
	{
		return 'beforeRelationChange';
	}

	public static get CHANGED(): string
	{
		return 'relationChanged';
	}

	private _relationName: string;
	private _newInstance: Entity | Collection;
	private _oldInstance: Entity | Collection;

	public constructor(type: EventType, target: Entity, relationName: string, newInstance: Entity | Collection, oldInstance: Entity | Collection, cancellable: boolean, options?: Object)
	{
		super(type, target, cancellable, options);
		this._relationName = relationName;
		this._newInstance = newInstance;
		this._oldInstance = oldInstance;
	}

	public get relationName(): string
	{
		return this._relationName;
	}

	public get newInstance(): Entity | Collection
	{
		return this._newInstance;
	}

	public get oldInstance(): Entity | Collection
	{
		return this._oldInstance;
	}
}