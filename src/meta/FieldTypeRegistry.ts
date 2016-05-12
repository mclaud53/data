import {FieldType} from './FieldType';

export type FieldTypeRegistryCallback<T> = (value: FieldType<T>) => void;

export class FieldTypeRegistry
{
	private _name2FieldTypeMap: {
		[key: string]: FieldType<any>;
	} = {};

	private _name2CallbackMap: {
		[key: string]: FieldTypeRegistryCallback<any>[]
	} = {};

	public getByName<T>(name: string, callback: FieldTypeRegistryCallback<T>): void 
	{
		if (!this._name2CallbackMap.hasOwnProperty(name)) {
			this._name2CallbackMap[name] = [];
		}

		this._name2CallbackMap[name].push(callback);

		if (this.hasByName(name)) {
			callback(this._name2FieldTypeMap[name]);	
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
			if (this._name2CallbackMap.hasOwnProperty(fieldType.name)) {
				for (i = 0; i < this._name2CallbackMap[fieldType.name].length; i++) {
					this._name2CallbackMap[fieldType.name][i](fieldType);
				}
			}
		}
		return this;
	}
}