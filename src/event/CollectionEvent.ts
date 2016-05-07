import {Event, EventType} from 'frog-event-dispatcher';
import {Entity} from '../Entity';
import {Collection} from '../Collection';

export class CollectionEvent extends Event<Collection>
{
	public static get ADDED(): string
	{
		return 'added';
	}

	public static get BEFORE_ADD(): string
	{
		return 'beforeAdd';
	}

	public static get BEFORE_CLEAR(): string
	{
		return 'beforeClear';
	}

	public static get BEFORE_REMOVE(): string
	{
		return 'beforeRemove';
	}

	public static get BEFORE_REVERT(): string
	{
		return 'beforeRevert';
	}

	public static get CLEARED(): string
	{
		return 'cleared';
	}

	public static get REMOVED(): string
	{
		return 'removed';
	}

	public static get REVERTED(): string
	{
		return 'reverted';
	}

	private _addedEntites: Entity[];
	private _removedEntites: Entity[];

	public constructor(type: EventType, target: Collection, addedEntites: Entity[], removedEntites: Entity[], cancellable: boolean, options?: Object)
	{
		super(type, target, cancellable, options);
		this._addedEntites = addedEntites;
		this._removedEntites = removedEntites;
	}

	public get addedEntites(): Entity[]
	{
		return this._addedEntites;
	}

	public get removedEntites(): Entity[]
	{
		return this._removedEntites;
	}

}