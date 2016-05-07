import {FieldType} from './FieldType';

export class Field<T>
{
	private _name: string;
	private _type: FieldType<T>;
	private _defaultValue: T;

	public constructor(name: string, type: FieldType<T>, defaultValue: T)
	{
		this._name = name;
		this._type = type;
		this._defaultValue = defaultValue;
	}

	public get name(): string
	{
		return this._name;
	}

	public get type(): FieldType<T>
	{
		return this._type;
	}

	public get defaultValue(): T
	{
		return this._defaultValue;
	}
}