import {Collection} from './Collection';
import {Entity} from './Entity';
import {Field} from './meta/Field';
import {Relation} from './meta/Relation';
import {RelationType} from './meta/RelationType';

export interface SerializeOptions
{
	backRel?: boolean;
	deep?: boolean;
	full?: boolean;
	rel?: boolean;
	prefix?: string;
}

export interface Serialized
{
	[key: string]: {
		[key: string]: {
			[key: string]: any;
		};
	};
}

export class Serialize
{
	public serialize(obj: Entity | Collection, options: SerializeOptions = {}): Serialized
	{
		var ret: Serialized = {},
			processed: (Collection | Entity)[] = [];
		this._serialize(obj, options, ret, processed);
		return ret;
	}

	public unserialize(obj: Serialized): Entity | Collection
	{
		return null;
	}

	private _serialize(obj: Entity | Collection, options: SerializeOptions, serialized: Serialized, processed: (Collection | Entity)[]): string | string[]
	{
		if (obj instanceof Entity) {
			return this._serializeEntity(obj, options, serialized, processed);
		} else if (obj instanceof Collection) {
			return this._serializeCollection(obj, options, serialized, processed);
		}
	}

	private _serializeEntity(entity: Entity, options: SerializeOptions, serialized: Serialized, processed: (Collection | Entity)[]): string
	{
		var i: number,
			field: Field<any>,
			value: any,
			rel: Relation,

			uuid: string | string[],
			obj: {
				[key: string]: any;
			};

		if (entity.hasTransaction()) {
			throw new Error('Transaction "' + entity.getTransaction().uuid + '" must be finished before serialize entity "' + entity.entityMeta.name + '[' + entity.uuid + ']"');
		}

		if (processed.indexOf(entity) > -1) {
			return entity.uuid;
		}

		processed.push(entity);

		if (entity.isNew) {
			obj = {};
			for (i = 0; i < entity.entityMeta.fields.length; i++) {
				field = entity.entityMeta.fields[i];
				if (entity.entityMeta.primaryKey instanceof Array) {
					if (entity.entityMeta.primaryKey.indexOf(field.name) > -1) {
						continue;
					}
				} else if (entity.entityMeta.primaryKey === field.name) {
					continue;
				}

				value = entity.get(field.name);
				if (entity.entityMeta.foreignKeys.indexOf(field.name) > -1) {
					if (field.defaultValue === value) {
						continue;
					}
				}

				obj[field.name] = value;
			}
		} else if (options.full) {
			obj = entity.getState();
		} else if (options.deep && !entity.isDirty) {
			obj = {};
			for (i = 0; i < entity.entityMeta.fields.length; i++) {
				field = entity.entityMeta.fields[i];
				if (entity.entityMeta.primaryKey instanceof Array) {
					if (entity.entityMeta.primaryKey.indexOf(field.name) > -1) {
						value = entity.get(field.name, true);
						if (field.defaultValue !== value) {
							obj[field.name] = value;
						}
					}
				} else if (entity.entityMeta.primaryKey === field.name) {
					value = entity.get(field.name, true);
					if (field.defaultValue !== value) {
						obj[field.name] = value;
					}
				}
			}
		} else if (!entity.isDirty) {
			return entity.uuid;
		} else {
			obj = {};
			for (i = 0; i < entity.entityMeta.fields.length; i++) {
				field = entity.entityMeta.fields[i];
				if (entity.entityMeta.primaryKey instanceof Array) {
					if (entity.entityMeta.primaryKey.indexOf(field.name) > -1) {
						value = entity.get(field.name, true);
						if (field.defaultValue !== value) {
							obj[field.name] = value;
						}
						continue;
					}
				} else if (entity.entityMeta.primaryKey === field.name) {
					value = entity.get(field.name, true);
					if (field.defaultValue !== value) {
						obj[field.name] = value;
					}
					continue;
				}

				value = entity.get(field.name);
				if (entity.get(field.name, true) !== value) {
					obj[field.name] = value;
				}
			}
		}

		if (!serialized.hasOwnProperty(entity.entityMeta.name)) {
			serialized[entity.entityMeta.name] = {};
		}
		serialized[entity.entityMeta.name][this._uuid(entity.uuid, options)] = obj;

		if (options.deep) {
			for (i = 0; i < entity.entityMeta.relations.length; i++) {
				rel = entity.entityMeta.relations[i];
				if (!options.backRel && (RelationType.BelongsTo === rel.type)) {
					continue;
				}

				uuid = this._serialize(entity.getRelated<Entity | Collection>(rel.name), options, serialized, processed);

				if (options.rel && (RelationType.BelongsTo !== rel.type)) {
					obj[rel.name] = this._uuids(uuid, options);
				}
			}
		}

		return entity.uuid;
	}

	private _serializeCollection(obj: Collection, options: SerializeOptions, serialized: Serialized, processed: (Collection | Entity)[]): string[]
	{
		var i: number,
			ret: string[] = [];

		if (obj.hasTransaction()) {
			throw new Error('Transaction "' + obj.getTransaction().uuid + '" must be finished before serialize collection "' + obj.entityMeta.name + '[' + obj.uuid + ']"');
		}

		if (processed.indexOf(obj) > -1) {
			for (i = 0; i < obj.length; i++) {
				ret.push(obj.getAt(i).uuid);
			}
			return ret;
		}
		processed.push(obj);

		for (i = 0; i < obj.length; i++) {
			ret.push(this._serializeEntity(obj.getAt(i), options, serialized, processed));
		}

		return ret;
	}

	private _uuid(value: string, options: SerializeOptions): string
	{
		var len: number,
			ret: string = value;

		if (options.hasOwnProperty('prefix') && options.prefix.length > 0) {
			len = options.prefix.length;
			if (ret.substr(0, len) === options.prefix) {
				ret = ret.substr(len);
			}
			ret = options.prefix + ret;
		}
		return ret;
	}

	private _uuids(value: string | string[], options: SerializeOptions): string | string[]
	{
		var i: number,
			ret: string[];

		if (value instanceof Array) {
			ret = [];
			for (i = 0; i < value.length; i++) {
				ret.push(this._uuid(value[i], options));
			}
			return ret;
		} else {
			return this._uuid(value, options);
		}
	}
}