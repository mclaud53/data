/// <reference path="../typings/main.d.ts" />
import * as assert from 'assert';
require('sinomocha')();

import {Collection} from '../src/Collection';
import {Field} from '../src/meta/Field';
import {Relation} from '../src/meta/Relation';
import {RelationType} from '../src/meta/RelationType';
import {Entity} from '../src/Entity';
import {CollectionEvent} from '../src/event/CollectionEvent';
import {EntityEvent} from '../src/event/EntityEvent';
import {FieldTypeRegistry} from '../src/meta/FieldTypeRegistry';

import {BooleanFieldType} from '../src/meta/type/BooleanFieldType';
import {FloatFieldType} from '../src/meta/type/FloatFieldType';
import {IntegerFieldType} from '../src/meta/type/IntegerFieldType';
import {StringFieldType} from '../src/meta/type/StringFieldType';

import {SimpleEntity} from '../dummy/SimpleEntity';

describe('Entity', function()
{
	FieldTypeRegistry.getInstance().register<any>([
			new BooleanFieldType(),
			new FloatFieldType(),
			new IntegerFieldType(),
			new StringFieldType()
		], true);

	it('creation', function()
	{
		var instance: Entity = new SimpleEntity();

		assert.equal(instance.id, 0, 'The property "id" has a wrong value');
		assert.equal(instance.readOnly, false, 'The property "readOnly" has a wrong value');
	});

	it('get/set', function()
	{
		var instance: Entity = new SimpleEntity();

		assert.equal(instance.get('id'), 0, 'The field "id" has a wrong value');
		assert.equal(instance.get('title'), '', 'The field "title" has a wrong value');

		assert.equal(instance.set('id', 5), true, 'Can\'t set "id" field');
		assert.equal(instance.get('id'), 5, 'The field "id" has a wrong value');

		assert.equal(instance.set('title', 'New title'), true, 'Can\'t set "title" field');
		assert.equal(instance.get('title'), 'New title', 'The field "title" has a wrong value');
	});

	it('get initial', function() {
		var instance: Entity = new SimpleEntity({
				id: 3,
				title: 'title'
			});

		assert.equal(instance.get('id'), 3, 'The field "id" has a wrong value');
		assert.equal(instance.get('title'), 'title', 'The field "title" has a wrong value');

		assert.equal(instance.set('id', 5), true, 'Can\'t set "id" field');
		assert.equal(instance.get('id'), 5, 'The field "id" has a wrong value');
		assert.equal(instance.get('id', true), 3, 'The field "id" has a wrong initial value');

		assert.equal(instance.set('title', 'New title'), true, 'Can\'t set "title" field');
		assert.equal(instance.get('title'), 'New title', 'The field "title" has a wrong value');
		assert.equal(instance.get('title', true), 'title', 'The field "title" has a wrong initial value');
	});	

	it('setState events', function()
	{
		var instance: Entity = new SimpleEntity({
				id: 3,
				title: 'title'
			}),
			callCount: number = 0;

		instance.addListener(function (e: EntityEvent): void {
			callCount++;
		}, this);

		assert.equal(instance.setState({id: 5, title: 'New title'}), true, 'Can\'t set state');

		assert.equal(instance.get('id'), 5, 'The field "id" has a wrong value');
		assert.equal(instance.get('id', true), 3, 'The field "id" has a wrong initial value');

		assert.equal(callCount, 2, 'The entity should dispatch events');
	});

	it('silent setState', function()
	{
		var instance: Entity = new SimpleEntity({
				id: 3,
				title: 'title'
			}),
			callCount: number = 0;

		instance.addListener(function (e: EntityEvent): void {
			callCount++;
		}, this);

		assert.equal(instance.setState({id: 5, title: 'New title'}, false), true, 'Can\'t set state');

		assert.equal(instance.get('id'), 5, 'The field "id" has a wrong value');
		assert.equal(instance.get('id', true), 3, 'The field "id" has a wrong initial value');

		assert.equal(callCount, 0, 'The entity should not dispatch events');
	});	

	it('cancel setState', function()
	{
		var instance: Entity = new SimpleEntity({
				id: 3,
				title: 'title'
			});

		instance.addListener(function (e: EntityEvent): void {
			e.preventDefault();
		}, this);

		assert.equal(instance.setState({id: 5, title: 'New title'}), false, 'Can\'t cancel set state');

		assert.equal(instance.get('id'), 3, 'The field "id" has a wrong value');
		assert.equal(instance.get('id', true), 3, 'The field "id" has a wrong initial value');

		assert.equal(instance.get('title'), 'title', 'The field "title" has a wrong value');
		assert.equal(instance.get('title', true), 'title', 'The field "title" has a wrong initial value');
	});

	// it('setRelated (belongsTo)', function () {
	// 	var belongsTo: Entity = new Entity('belongsToEntity', {
	// 			primaryId: new Field(0)
	// 		}, ['primaryId'], {
	// 			hasOne: new Relation(RelationType.HasOne, name, {
	// 				primaryId: 'foreingId'
	// 			})
	// 		}, {primaryId: 5}),
	// 		instance: Entity = new Entity(name, fields, primary, relations);

	// 	assert.equal(instance.hasRelated('belongsTo'), false, 'The new entity has no related entities');
	// 	assert.equal(instance.setRelated('belongsTo', belongsTo), true, 'The assign releated failed');
	// 	assert.equal(instance.hasRelated('belongsTo'), true, 'The entity must have related entity');
	// 	assert.equal(instance.get('foreignId'), 5, 'The foreign key must be updated while set relation');
	// });

	// it('setRelated (belongsTo) throw error if pass collection instead entity', function () {
	// 	var instance: Entity = new Entity(name, fields, primary, relations),
	// 		actual: boolean = false;

	// 	try {
	// 		instance.setRelated('belongsTo', new Collection('belongsToEntity'));
	// 	} catch (e) {
	// 		actual = true;
	// 	}

	// 	assert.equal(actual, true, 'Entity must throw error if pass collection instead entity');
	// });

	// it('setRelated (belongsTo) relayEvents', function () {
	// 	var belongsTo: Entity = new Entity('belongsToEntity', {
	// 			primaryId: new Field(0),
	// 			value: new Field(0)
	// 		}, ['primaryId'], {
	// 			hasOne: new Relation(RelationType.HasOne, name, {
	// 				primaryId: 'foreignId'
	// 			})
	// 		}, {primaryId: 5}),
	// 		instance: Entity = new Entity(name, fields, primary, relations),
	// 		actualCallCount: number = 0;

	// 	instance.setRelated('belongsTo', belongsTo);
	// 	instance.addListener(function (e: entev.EntityEvent): void {
	// 		actualCallCount++;
	// 	}, this, 'belongsToEntity:changed:value');
	// 	belongsTo.set('value', 5);
	// 	assert.equal(actualCallCount, 1, 'Entity must relay events from related entities');
	// });	

	// it('setRelated (belongsTo) update cascade', function () {
	// 	var belongsTo: Entity = new Entity('belongsToEntity', {
	// 			primaryId: new Field(0)
	// 		}, ['primaryId'], {
	// 			hasOne: new Relation(RelationType.HasOne, name, {
	// 				primaryId: 'foreingId'
	// 			})
	// 		}, {primaryId: 5}),
	// 		instance: Entity = new Entity(name, fields, primary, relations);

	// 	instance.setRelated('belongsTo', belongsTo);
	// 	assert.equal(instance.get('foreignId'), 5, 'Foreign key has a wrong value');
	// 	belongsTo.set('primaryId', 12);
	// 	assert.equal(instance.get('foreignId'), 12, 'BelongsTo relation must be updated cascade');
	// });

	// it('setRelated (hasOne)', function () {
	// 	var hasOne: Entity = new Entity('hasOneEntity', {
	// 			primaryId: new Field(0),
	// 			foreingId: new Field(0)
	// 		}, ['primaryId'], {
	// 			belongsTo: new Relation(RelationType.BelongsTo, name, {
	// 				foreingId: 'id'
	// 			})
	// 		}, {primaryId: 5}),
	// 		instance: Entity = new Entity(name, fields, primary, relations, {id: 8});

	// 	assert.equal(instance.hasRelated('hasOne'), false, 'The new entity has no related entities');
	// 	assert.equal(instance.setRelated('hasOne', hasOne), true, 'The assign releated failed');
	// 	assert.equal(instance.hasRelated('hasOne'), true, 'The entity must have related entity');
	// 	assert.equal(hasOne.get('foreingId'), 8, 'The foreign key must be updated while set relation');
	// });

	// it('setRelated (hasOne) throw error if pass collection instead entity', function () {
	// 	var instance: Entity = new Entity(name, fields, primary, relations),
	// 		actual: boolean = false;

	// 	try {
	// 		instance.setRelated('hasOne', new Collection('hasOneEntity'));
	// 	} catch (e) {
	// 		actual = true;
	// 	}

	// 	assert.equal(actual, true, 'Entity must throw error if pass collection instead entity');
	// });

	// it('setRelated (hasOne) relayEvents', function () {
	// 	var hasOne: Entity = new Entity('hasOneEntity', {
	// 			primaryId: new Field(0),
	// 			foreingId: new Field(0),
	// 			value: new Field(0)
	// 		}, ['primaryId'], {
	// 			belongsTo: new Relation(RelationType.BelongsTo, name, {
	// 				foreingId: 'id'
	// 			})
	// 		}, {primaryId: 5}),
	// 		instance: Entity = new Entity(name, fields, primary, relations),
	// 		actualCallCount: number = 0;

	// 	instance.setRelated('hasOne', hasOne);
	// 	instance.addListener(function (e: entev.EntityEvent): void {
	// 		actualCallCount++;
	// 	}, this, 'hasOneEntity:changed:value');
	// 	hasOne.set('value', 5);
	// 	assert.equal(actualCallCount, 1, 'Entity must relay events from related entities');
	// });		
});