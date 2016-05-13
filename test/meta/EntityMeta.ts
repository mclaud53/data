/// <reference path="../../typings/main.d.ts" />
import * as assert from 'assert';
require('sinomocha')();

import {SimpleEntity} from '../../dummy/SimpleEntity';
import {EntityMeta} from '../../src/meta/EntityMeta';
import {Entity} from '../../src/Entity';
import {EntityClass} from '../../src/meta/EntityClass';
import {Field} from '../../src/meta/Field';
import {FieldType} from '../../src/meta/FieldType';

describe('EntityMeta', function()
{
	it('creation', function()
	{
		var name: string = 'SomeEntity',
			entityClass: EntityClass = SimpleEntity,
			primaryKey: string = 'primaryKey',
			instance: EntityMeta = new EntityMeta(name, entityClass, primaryKey, [
					new Field<number>('primaryKey', new FieldType<number>('number'), 0)
				]);

		assert.equal(instance.name, name, 'The field "name" has a wrong value');
		assert.equal(instance.entityClass, entityClass, 'The field "entityClas" has a wrong value');
		assert.equal(instance.primaryKey, primaryKey, 'The field "primaryKey" has a wrong value');
		assert.equal(instance.fields.length, 1, 'The list of "fields" has a wrong length');
		assert.equal(Object.keys(instance.fieldMap).join(', '), 'primaryKey', 'The field "fieldMap" has a wrong value');
		assert.equal(instance.fieldNames.join(', '), 'primaryKey', 'The field "fieldNames" has a wrong value');
		assert.equal(instance.relations.length, 0, 'The list of "relations" has a wrong length');
		assert.equal(instance.relationNames.length, 0, 'The list of "relationNames" has a wrong length');
		assert.equal(Object.keys(instance.relationMap).length, 0, 'The field "fieldMap" has a wrong value');
	});
});