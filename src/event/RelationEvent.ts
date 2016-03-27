import fed = require('frog-event-dispatcher');
import entity = require('../Entity');
import base = require('../Base');

export class RelationEvent extends fed.Event<entity.Entity>
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
	private _newInstance: base.Base;
	private _oldInstance: base.Base;

	public constructor(type: fed.EventType, target: entity.Entity, relationName: string, newInstance: base.Base, oldInstance: base.Base, cancellable: boolean, options?: Object)
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

	public get newInstance(): base.Base
	{
		return this._newInstance;
	}

	public get oldInstance(): base.Base
	{
		return this._oldInstance;
	}
}