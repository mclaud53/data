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

	private _fieldMap: FieldMap;

	private _fieldNames: string[];

	private _relationMap: RelationMap = {};

	private _relationNames: string[] = [];

	private _relations: Relation[] = [];

	public constructor(name: string, entityClass: EntityClass, primaryKey: PrimaryKey, fields: Field<any>[])
	{
		var i: number;

		this._name = name;
		this._entityClass = entityClass;
		this._primaryKey = primaryKey;
		this._fields = fields;

		this._fieldMap = {};
		this._fieldNames = [];
		for (i = 0; i < fields.length; i++) {
			if (this._fieldMap.hasOwnProperty(fields[i].name)) {
				throw new Error('Duplicate fields: ' + fields[i].name);
			}
			this._fieldMap[fields[i].name] = fields[i];
			this._fieldNames.push(fields[i].name);
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

	public addRelation(relation: Relation | Relation[]): EntityMeta
	{
		var i: number;
		if (relation instanceof Array) {
			for (i = 0; i < relation.length; i++) {
				this.addRelation(relation[i]);
			}
		} else {
			this._relations.push(relation);
			this._relationMap[relation.name] = relation;
			this._relationNames.push(relation.name);
		}
		return this;
	}

	public hasRelation(name: string): boolean
	{
		return this.relationNames.indexOf(name) > -1;
	}

	public getRelation(name: string): Relation
	{
		return this.hasRelation(name) ? this._relationMap[name] : null;
	}

	public getBackwardRelation(rel: string | Relation): Relation
	{
		var i: number,
			types: RelationType[],
			foreignKey: ForeignKey,
			relation: Relation,
			relations: Relation[];

		if (rel instanceof Relation) {
			relation = rel;
		} else {
			relation = this.getRelation(rel as string);
		}

		if (this.relations.indexOf(relation) === -1) {
			return null;
		}

		foreignKey = {};
		

		relations = relation.entityMeta.relations;

		for (i = 0; i < relations.length; i++) {

		}
	}

	public validate(): void
	{
		// @todo
	}
}