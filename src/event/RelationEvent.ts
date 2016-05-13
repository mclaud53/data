import {Event, EventType} from 'frog-event-dispatcher';
import {Entity} from '../Entity';
import {RelatedMap} from '../RelatedMap';

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

	private _relationNames: string[];
	private _newRelatedMap: RelatedMap;
	private _oldRelatedMap: RelatedMap;

	public constructor(type: EventType, target: Entity, relationNames: string[], newRelatedMap: RelatedMap, oldRelatedMap: RelatedMap, cancellable: boolean, options?: Object)
	{
		super(type, target, cancellable, options);
		this._relationNames = relationNames;
		this._newRelatedMap = newRelatedMap;
		this._oldRelatedMap = oldRelatedMap;
	}

	public get relationNames(): string[]
	{
		return this._relationNames;
	}

	public get newRelatedMap(): RelatedMap
	{
		return this._newRelatedMap;
	}

	public get oldRelatedMap(): RelatedMap
	{
		return this._oldRelatedMap;
	}
}