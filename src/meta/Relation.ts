import {ForeignKey} from './ForeignKey';
import {RelationType} from './RelationType';
import {CollectionMeta} from './CollectionMeta';
import {EntityMeta} from './EntityMeta';

export class Relation
{
	private _name: string;

	private _type: RelationType;

	private _relatedMeta: (CollectionMeta | EntityMeta);

	private _foreignKey: ForeignKey;

	private _relayEvents: boolean;

	public constructor(name: string, type: RelationType, relatedMeta: CollectionMeta | EntityMeta, foreignKey: ForeignKey, relayEvents: boolean = false)
	{
		this._name = name;
		this._type = type;
		this._relatedMeta = relatedMeta;
		this._foreignKey = foreignKey;
		this._relayEvents = relayEvents;
	}

	public get name(): string
	{
		return this._name;
	}

	public get type(): RelationType
	{
		return this._type;
	}

	public get entityMeta(): EntityMeta
	{
		if (this._relatedMeta instanceof CollectionMeta) {
			return (this._relatedMeta as CollectionMeta).entityMeta;
		} else if (this._relatedMeta instanceof EntityMeta) {
			return (this._relatedMeta as EntityMeta);
		} else {
			throw new Error('Field "relatedMeta" is null');
		}
	}

	public get relatedMeta(): CollectionMeta | EntityMeta
	{
		return this._relatedMeta;
	}

	public get foreignKey(): ForeignKey
	{
		return this._foreignKey;
	}

	public get relayEvents(): boolean
	{
		return this._relayEvents;
	}

	public validate(): void
	{
		var key: string,
			field: string,
			entityMeta: EntityMeta = this.entityMeta;

		if (RelationType.HasMany === this.type) {
			if (!(this._relatedMeta instanceof CollectionMeta)) {
				throw new Error('For HasMany relation relatedMeta must be instanceof CollectionMeta');
			}
		} else {
			if (this._relatedMeta instanceof CollectionMeta) {
				throw new Error('For ' + RelationType[this.type] + ' relation relatedMeta must be instanceof EntityMeta');
			}
		}

		for (key in this._foreignKey) {
			field = this._foreignKey[key];
			if (!entityMeta.hasField(field)) {
				throw new Error('Field "' + field + '" in foreign key not exist in model ' + entityMeta.name);
			}
		}
	}
}