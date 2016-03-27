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

	public static get BEFORE_REMOVE(): string
	{
		return 'beforeRemove';
	}

	public static get REMOVED(): string
	{
		return 'removed';
	}

	private _entites: ent.Entity[];

	public constructor(type: fed.EventType, target: col.Collection, entites: ent.Entity[], cancellable: boolean, options?: Object)
	{
		super(type, target, cancellable, options);
		this._entites = entites;
	}

	public get entites(): ent.Entity[]
	{
		return this._entites;
	}
}