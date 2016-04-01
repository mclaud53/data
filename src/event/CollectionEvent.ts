import fed = require('frog-event-dispatcher');
import ent = require('../Entity');
import col = require('../Collection');

export class CollectionEvent extends fed.Event<col.Collection>
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

	private _addedEntites: ent.Entity[];
	private _removedEntites: ent.Entity[];

	public constructor(type: fed.EventType, target: col.Collection, addedEntites: ent.Entity[], removedEntites: ent.Entity[], cancellable: boolean, options?: Object)
	{
		super(type, target, cancellable, options);
		this._addedEntites = addedEntites;
		this._removedEntites = removedEntites;
	}

	public get addedEntites(): ent.Entity[]
	{
		return this._addedEntites;
	}

	public get removedEntites(): ent.Entity[]
	{
		return this._removedEntites;
	}

}