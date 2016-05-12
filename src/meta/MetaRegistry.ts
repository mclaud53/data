import {CollectionMeta} from './CollectionMeta';
import {EntityMeta} from './EntityMeta';

export type MetaRegistryCallback<T> = (meta: T) => void;

export class MetaRegistry
{

	private _name2CollectionCallbackMap: {
		[key: string]: MetaRegistryCallback<CollectionMeta>[]
	} = {};

	private _name2CollectionMetaMap: {
		[key: string]: CollectionMeta;
	} = {};

	private _name2EntityCallbackMap: {
		[key: string]: MetaRegistryCallback<EntityMeta>[]
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

	public getCollectionDeferred(name: string, callback: MetaRegistryCallback<CollectionMeta>): void
	{
		if (!this._name2CollectionCallbackMap.hasOwnProperty(name)) {
			this._name2CollectionCallbackMap[name] = [];
		}

		this._name2CollectionCallbackMap[name].push(callback);

		if (this.hasCollection(name)) {
			callback(this._name2CollectionMetaMap[name]);
		}
	}

	public getEntity(name: string): EntityMeta
	{
		if (!this.hasEntity(name)) {
			throw new Error('EntityMeta "' + name + '" isn\'t registed');
		}
		return this._name2EntityMetaMap[name];
	}	

	public getEntityDeferred(name: string, callback: MetaRegistryCallback<EntityMeta>): void
	{
		if (!this._name2EntityCallbackMap.hasOwnProperty(name)) {
			this._name2EntityCallbackMap[name] = [];
		}

		this._name2EntityCallbackMap[name].push(callback);

		if (this.hasEntity(name)) {
			callback(this._name2EntityMetaMap[name]);
		}
	}

	public register(meta: CollectionMeta | EntityMeta | CollectionMeta[] | EntityMeta[], force: boolean = false): MetaRegistry
	{
		var i: number,
			name: string;

		if (meta instanceof Array) {
			for (i = 0; i < meta.length; i++) {
				this.register(meta[i], force);
			}
		} else if (meta instanceof CollectionMeta) {
			name = meta.entityMeta.name;
			if (!force && this.hasCollection(name)) {
				throw new Error('CollectionMeta already registered ' + name);
			}

			this._name2CollectionMetaMap[name] = meta;

			if (this._name2CollectionCallbackMap.hasOwnProperty(name)) {
				for (i = 0; i < this._name2CollectionCallbackMap[name].length; i++) {
					this._name2CollectionCallbackMap[name][i](meta);
				}
			}
		} else if (meta instanceof EntityMeta) {
			name = meta.name;
			if (!force && this.hasEntity(name)) {
				throw new Error('EntityMeta already registered ' + name);	
			}

			this._name2EntityMetaMap[name] = meta;

			if (this._name2EntityCallbackMap.hasOwnProperty(name)) {
				for (i = 0; i < this._name2EntityCallbackMap[name].length; i++) {
					this._name2EntityCallbackMap[name][i](meta);
				}
			}
		} else {
			throw new Error('Unknown type of meta');
		}
		return this;
	}
}