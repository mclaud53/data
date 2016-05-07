import {FieldType} from './FieldType';

export class FieldTypeRegistry
{
	private _name2FieldTypeMap: {
		[key: string]: FieldType<any>;
	} = {};

	public getByName<T>(name: string): FieldType<T>
	{
		if (this.hasByName(name)) {
			return this._name2FieldTypeMap[name];
		} else {
			throw new Error('FieldType "' + name + '" do\'t registered');
		}
	}

	public hasByName(name: string): boolean
	{
		return this._name2FieldTypeMap.hasOwnProperty(name);
	}

	public register<T>(fieldType: FieldType<T> | FieldType<T>[], force: boolean = false): FieldTypeRegistry
	{
		var i: number;
		if (fieldType instanceof Array) {
			for (i = 0; i < fieldType.length; i++) {
				this.register(fieldType[i], force);
			}
		} else {
			if (this._name2FieldTypeMap.hasOwnProperty(fieldType.name)) {
				if (force) {
					this._name2FieldTypeMap[fieldType.name] = fieldType;
				} else {
					throw new Error('FieldType "' + fieldType.name + '" already registered');
				}
			} else {
				this._name2FieldTypeMap[fieldType.name] = fieldType;
			}
			
		}
		return this;
	}
}