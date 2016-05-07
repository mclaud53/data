/// <reference path="../../typings/main.d.ts" />
import * as assert from 'assert';
require('sinomocha')();

import {FieldTypeRegistry} from '../../src/meta/FieldTypeRegistry';
import {FieldType} from '../../src/meta/FieldType';

describe('FieldTypeRegistry', function()
{

	it('register & hasByName & getByName', function()
	{
		var instance: FieldTypeRegistry = new FieldTypeRegistry(),
			fieldType: FieldType<number> = new FieldType<number>('test');

		instance.register(fieldType);
		assert.equal(instance.hasByName(fieldType.name), true, 'Method "hasByName" returns wrong values');
		assert.equal(instance.getByName(fieldType.name), fieldType, 'Method "getByName" returns wrong values');
	});	

	it('Throw error if try to getByName of not exists FiledType', function()
	{
		var instance: FieldTypeRegistry = new FieldTypeRegistry(),
			actual: boolean = false;

		assert.equal(instance.hasByName('test'), false, 'Method "hasByName" returns wrong values');
		try {
			instance.getByName('test');
		} catch (e) {
			actual = true;
		}
		assert.equal(actual, true, 'Method "getByName" must throw error');
	});

	it('Throw error if twice register FieldType with same name', function ()
	{
		var instance: FieldTypeRegistry = new FieldTypeRegistry(),
			actual: boolean = false;

		instance.register(new FieldType<number>('test'));
		try {
			instance.register(new FieldType<number>('test'));
		} catch (e) {
			actual = true;
		}
		assert.equal(actual, true, 'Method "register" must throw error');
	});
});