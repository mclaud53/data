import {EntityClass} from './EntityClass';
import {PrimaryKey} from './PrimaryKey';
import {Field} from './Field';
import {FieldMap} from './FieldMap';
import {FieldType} from './FieldType';
import {Relation} from './Relation';
import {RelationMap} from './RelationMap';
import {RelationType} from './RelationType';
import {ForeignKey} from './ForeignKey';

export class EntityMeta
{

	private _name: string;

	private _entityClass: EntityClass;

	private _primaryKey: PrimaryKey;

	private _fields: Field<any>[];

	private _fieldMap: FieldMap = {};

	private _fieldNames: string[] = [];

	private _relationMap: RelationMap = {};

	private _relationNames: string[] = [];

	private _relations: Relation[] = [];

	public constructor(name: string, entityClass: EntityClass, primaryKey: PrimaryKey, fields: Field<any>[], relations: Relation[] = [])
	{
		var i: number,
			field: Field<any>,
			fieldName: string,
			rel: Relation,
			relName: string;

		this._name = name;
		this._entityClass = entityClass;
		this._primaryKey = primaryKey;
		this._fields = fields;
		this._relations = relations;

		for (i = 0; i < fields.length; i++) {
			field = fields[i];
			fieldName = field.name;
			if (this._fieldNames.indexOf(fieldName) > -1) {
				throw new Error('Duplicate fields: ' + fieldName);
			}
			this._fieldMap[fieldName] = field;
			this._fieldNames.push(fieldName);
		}

		for (i = 0; i < relations.length; i++) {
			rel = relations[i];
			relName = rel.name;
			if (this._relationNames.indexOf(relName) > -1) {
				throw new Error('Duplicate relations: ' + relName);
			}
			if (this._fieldNames.indexOf(relName) > -1) {
				throw new Error('Relation can\'t has the same name as field: ' + relName);
			}
			this._relationMap[relName] = rel;
			this._relationNames.push(relName);
		}
	}

	public get name(): string
	{
		return this._name;
	}

	public get entityClass(): EntityClass
	{
		return this._entityClass;
	}

	public get primaryKey(): PrimaryKey
	{
		return this._primaryKey;
	}

	public get fields(): Field<any>[]
	{
		return this._fields;
	}

	public get fieldMap(): FieldMap
	{
		return this._fieldMap;
	}

	public get fieldNames(): string[]
	{
		return this._fieldNames;
	}

	public get relations(): Relation[]
	{
		return this._relations;
	}

	public get relationNames(): string[]
	{
		return this._relationNames;
	}

	public get relationMap(): RelationMap
	{
		return this._relationMap;
	}

	public hasField(name: string): boolean
	{
		return this.fieldNames.indexOf(name) > -1;
	}

	public getField<T>(name: string): Field<T>
	{
		return this.hasField(name) ? this._fieldMap[name] : null;
	}

	public hasRelation(name: string): boolean
	{
		return this.relationNames.indexOf(name) > -1;
	}

	public getRelation(name: string): Relation
	{
		return this.hasRelation(name) ? this._relationMap[name] : null;
	}

	public findRelation(types: RelationType[], entityMeta: EntityMeta, foreignKey: ForeignKey): Relation
	{
		var i: number;

		for (i = 0; i < this.relations.length; i++) {
			if ((this.relations[i].entityMeta === entityMeta) &&
				(types.indexOf(this.relations[i].type) > -1) &&
				this.isEqualFKs(foreignKey, this.relations[i].foreignKey)) {
				return this.relations[i];
			}
		}

		return null;
	}

	public getBackwardRelation(rel: string | Relation): Relation
	{
		var i: number,
			field: string,
			fields: string[],
			types: RelationType[],
			foreignKey: ForeignKey,
			relation: Relation;

		if (rel instanceof Relation) {
			relation = rel;
		} else {
			relation = this.getRelation(rel as string);
		}

		if (this.relations.indexOf(relation) === -1) {
			return null;
		}

		if (relation.backwardRelation || null === relation.backwardRelation) {
			return relation.backwardRelation;
		}

		switch (relation.type) {
			case RelationType.BelongsTo:
				types = [RelationType.HasMany, RelationType.HasOne];
				break;

			case RelationType.HasMany:
			case RelationType.HasOne:
				types = [RelationType.BelongsTo];
				break;
		}

		foreignKey = {};
		fields = Object.keys(relation.foreignKey);
		for (i = 0; i < fields.length; i++) {
			field = fields[i];
			foreignKey[relation.foreignKey[field]] = field;
		}

		relation.backwardRelation = relation.entityMeta.findRelation(types, this, foreignKey);

		return relation.backwardRelation;
	}

	public validate(): void
	{
		// @todo
	}

	protected isEqualFKs(a: ForeignKey, b: ForeignKey): boolean
	{
		var i: number,
			aKeys: string[] = Object.keys(a),
			bKeys: string[] = Object.keys(b);

		if (aKeys.length !== bKeys.length) {
			return false;
		}

		for (i = 0; i < aKeys.length; i++) {
			if (bKeys.indexOf(aKeys[i]) === -1) {
				return false;
			}
			if (a[aKeys[i]] !== b[aKeys[i]]) {
				return false;
			}
		}

		return true;
	}
}