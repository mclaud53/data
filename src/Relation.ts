export enum RelationType {
	BelongsTo,
	HasOne,
	// HasOneThrought,
	HasMany
	// HasManyThrought,
	// HasAndBelongsToMany,
};

export type FieldMap = {
	[key: string]: string;
};

export class Relation
{
	private _type: RelationType;

	private _entityName: string;

	private _fieldsMap: FieldMap;

	private _relayEvents: boolean;

	public constructor(type: RelationType, entityName: string, fieldsMap: FieldMap, relayEvents: boolean = false)
	{
		this._type = type;
		this._entityName = entityName;
		this._fieldsMap = fieldsMap;
		this._relayEvents = relayEvents;
	}

	public get type(): RelationType
	{
		return this._type;
	}

	public get entityName(): string
	{
		return this._entityName;
	}

	public get fieldsMap(): FieldMap
	{
		return this._fieldsMap;
	}

	public get relayEvents(): boolean
	{
		return this._relayEvents;
	}
}