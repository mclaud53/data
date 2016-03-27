export enum RelationType {
	BelongsTo,
	HasOne,
	HasOneThrought,
	HasMany,
	HasManyThrought,
	HasAndBelongsToMany,
};

export type FieldMap = {
	[key: string]: string;
};

export class Relation
{
	private _type: RelationType;

	private _fieldsMap: FieldMap;

	private _entityName: string;

	private _relayEvents: boolean;

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