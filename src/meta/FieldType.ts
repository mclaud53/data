/// <reference path="../../typings/main.d.ts" />

import {Validate} from 'frog-validate';
import {Filter} from 'frog-filter';

export class FieldType<T> implements Validate<T>, Filter<T>
{

	private _name: string;

	private _filterList: Filter<T>[];

	private _validateList: Validate<T>[];

	private _errors: string[] = [];

	public constructor(name: string, filterList: Filter<T>[] = [], validateList: Validate<T>[] = [])
	{
		this._name = name;
		this._filterList = filterList;
		this._validateList = validateList;
	}

	public get name(): string
	{
		return this._name;
	}

	public filter(value: T): T
	{
		var i: number;

		for (i = 0; i < this._filterList.length; i++) {
			value = this._filterList[i].filter(value);
		}

		return value;
	}

	public isValid(value: T): boolean
	{
		var i: number,
			ret: boolean = true;

		this._errors.length = 0;
		for (i = 0; i < this._validateList.length; i++) {
			if (!this._validateList[i].isValid(value)) {
				ret = false;
				this._errors = this._errors.concat(this._validateList[i].getErrors());
			}
		}

		return ret;
	}

	public getErrors(): string[]
	{
		return this._errors;
	}
}