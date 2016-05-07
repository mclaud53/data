import {CollectionClass} from './CollectionClass';
import {EntityMeta} from './EntityMeta';

export class CollectionMeta
{
	private _collectionClass: CollectionClass;
	private _entityMeta: EntityMeta;

	public constructor(collectionClass: CollectionClass, entityMeta: EntityMeta)
	{
		this._collectionClass = collectionClass;
		this._entityMeta = entityMeta;
	}

	public get collectionClass(): CollectionClass
	{
		return this._collectionClass;
	}

	public get entityMeta(): EntityMeta
	{
		return this._entityMeta;
	}
}