import {Registry} from '../Registry';
import {CollectionClass} from './CollectionClass';
import {EntityMeta} from './EntityMeta';

export class CollectionMeta
{
	private _collectionClass: CollectionClass;
	private _entityMeta: EntityMeta = null;
	private _entityMetaName: string;

	public constructor(collectionClass: CollectionClass, entityMeta: EntityMeta | string)
	{
		this._collectionClass = collectionClass;
		if (entityMeta instanceof EntityMeta) {
			this._entityMeta = entityMeta;
			this._entityMetaName = entityMeta.name;
		} else {
			this._entityMetaName = entityMeta;

			Registry.getInstance()
				.getMetaRegistry()
				.getEntityDeferred(entityMeta, this.retrieveTypeCallback.bind(this));
		}
	}

	public get collectionClass(): CollectionClass
	{
		return this._collectionClass;
	}

	public get entityMeta(): EntityMeta
	{
		if (null === this._entityMeta) {
			throw new Error('For collection "' + this._entityMetaName + '" aren\'t registered entityMeta');
		}
		return this._entityMeta;
	}

	private retrieveTypeCallback(entityMeta: EntityMeta): void
	{
		this._entityMeta = entityMeta;
	}	
}