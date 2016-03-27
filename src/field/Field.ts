/// <reference path="../../typings/main.d.ts" />

import validate = require('frog-validate');
import filter = require('frog-filter');

export class Field implements validate.Validate<any>, filter.Filter<any>
{

	private _defaultValue: any;

	private _filterList: filter.Filter<any>[];

	private _validateList: validate.Validate<any>[];

	private _errors: string[] = [];

	public constructor(defaultValue: any, filterList: filter.Filter<any>[] = [], validateList: validate.Validate<any>[] = [])
	{
		this._defaultValue = defaultValue;
		this._filterList = filterList;
		this._validateList = validateList;
	}
	
	public get defaultValue(): any
	{
		return this._defaultValue;
	}

	public filter(value: any): any
	{
		var i: number;

		for (i = 0; i < this._filterList.length; i++) {
			value = this._filterList[i].filter(value);
		}

		return value;
	}

	public isValid(value: any): boolean
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