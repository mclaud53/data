import {FieldType} from './FieldType';
import {Registry} from '../Registry';

export class Field<T>
{
	private _name: string;
	private _type: FieldType<T> = null;
	private _typeName: string;
	private _defaultValue: T;

	public constructor(name: string, type: string | FieldType<T>, defaultValue: T)
	{
		this._name = name;
		this._defaultValue = defaultValue;
		
		if (type instanceof FieldType) {
			this._type = type;
			this._typeName = type.name;
		} else {
			this._typeName = type;

			Registry.getInstance()
				.getFieldTypeRegistry()
				.getByName(type, this.retrieveTypeCallback.bind(this));
		}
	}

	public get name(): string
	{
		return this._name;
	}

	public get type(): FieldType<T>
	{
		if (null === this._type) {
			throw new Error('Type "' + this._typeName + '" for field "' + this._name + '" arem\'t registered yet');
		}
		return this._type;
	}

	public get defaultValue(): T
	{
		return this._defaultValue;
	}

	private retrieveTypeCallback(type: FieldType<T>): void
	{
		this._type = type;
	}
}