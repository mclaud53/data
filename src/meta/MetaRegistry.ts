import {CollectionMeta} from './CollectionMeta';
import {EntityMeta} from './EntityMeta';

export class MetaRegistry
{

	private _name2CollectionMetaMap: {
		[key: string]: CollectionMeta;
	} = {};

	private _name2EntityMetaMap: {
		[key: string]: EntityMeta;
	} = {};

	public hasCollection(name: string): boolean
	{
		return this._name2CollectionMetaMap.hasOwnProperty(name);
	}

	public hasEntity(name: string): boolean
	{
		return this._name2EntityMetaMap.hasOwnProperty(name);
	}

	public getCollection(name: string): CollectionMeta
	{
		if (!this.hasCollection(name)) {
			throw new Error('CollectionMeta "' + name + '" isn\'t registed');
		}
		return this._name2CollectionMetaMap[name];
	}

	public getEntity(name: string): EntityMeta
	{
		if (!this.hasEntity(name)) {
			throw new Error('EntityMeta "' + name + '" isn\'t registed');
		}
		return this._name2EntityMetaMap[name];
	}

	public register(meta: CollectionMeta | EntityMeta | CollectionMeta[] | EntityMeta[], force: boolean = false): MetaRegistry
	{
		var i: number;
		if (meta instanceof Array) {
			for (i = 0; i < meta.length; i++) {
				this.register(meta[i], force);
			}
		} else if (meta instanceof CollectionMeta) {
			if (!force && this.hasCollection(meta.entityMeta.name)) {
				throw new Error('CollectionMeta already registered ' + meta.entityMeta.name);
			}
			this._name2CollectionMetaMap[meta.entityMeta.name] = meta;
		} else if (meta instanceof EntityMeta) {
			if (!force && this.hasEntity(meta.name)) {
				throw new Error('EntityMeta already registered ' + meta.name);	
			}
			this._name2EntityMetaMap[meta.name] = meta;
		} else {
			throw new Error('Unknown type of meta');
		}
		return this;
	}
}