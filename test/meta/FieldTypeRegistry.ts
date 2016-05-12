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
			fieldType: FieldType<number> = new FieldType<number>('test'),
			actual: FieldType<number> = null;

		instance.register(fieldType);
		assert.equal(instance.hasByName(fieldType.name), true, 'Method "hasByName" returns wrong values');

		instance.getByName(fieldType.name, function(ft: FieldType<number>): void {
			actual = ft;
		});
		assert.equal(actual, fieldType, 'Method "getByName" returns wrong values');
	});	

	it('register after getByName', function()
	{
		var instance: FieldTypeRegistry = new FieldTypeRegistry(),
			fieldType: FieldType<number> = new FieldType<number>('test'),
			actual: FieldType<number> = null;

		instance.getByName(fieldType.name, function(ft: FieldType<number>): void {
			actual = ft;
		});

		assert.equal(instance.hasByName('test'), false, 'Method "hasByName" returns wrong values');
		assert.equal(actual, null, 'FieldType returns before registered');

		instance.register(fieldType);

		assert.equal(instance.hasByName('test'), true, 'Method "hasByName" returns wrong values');
		assert.equal(actual, fieldType, 'Returns null after registered FieldType');
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