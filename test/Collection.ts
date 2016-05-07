/// <reference path="../typings/main.d.ts" />
import * as assert from 'assert';
require('sinomocha')();

import {Registry} from '../src/Registry';
import {Collection} from '../src/Collection';
import {Entity} from '../src/Entity';
import {CollectionEvent} from '../src/event/CollectionEvent';
import {EntityEvent} from '../src/event/EntityEvent';
import {FieldTypeRegistry} from '../src/meta/FieldTypeRegistry';

import {BooleanFieldType} from '../src/meta/type/BooleanFieldType';
import {FloatFieldType} from '../src/meta/type/FloatFieldType';
import {IntegerFieldType} from '../src/meta/type/IntegerFieldType';
import {StringFieldType} from '../src/meta/type/StringFieldType';

import {SimpleCollection} from '../dummy/SimpleCollection';
import {SimpleEntity} from '../dummy/SimpleEntity';

describe('Collection', function()
{
	var fieldTypeRegistry: FieldTypeRegistry = Registry.getInstance().getFieldTypeRegistry();
	fieldTypeRegistry.register<any>([
			new BooleanFieldType(),
			new FloatFieldType(),
			new IntegerFieldType(),
			new StringFieldType()
		], true);

	it('creation', function()
	{
		var instance: Collection = new SimpleCollection();

		assert.equal(instance.length, 0, 'The property "length" has a wrong value');
		assert.equal(instance.readOnly, false, 'The property "readOnly" has a wrong value');
		assert.equal(instance.added, 0, 'The property "added" has a wrong value');
		assert.equal(instance.removed, 0, 'The property "removed" has a wrong value');
	});

	it('create read only collection', function()
	{
		var entities: Entity[] = [
				new SimpleEntity(),
				new SimpleEntity(),
				new SimpleEntity()
			],
			length: number = entities.length,
			instance: Collection = new SimpleCollection(entities, false, true);

		assert.equal(instance.length, length, 'The wrong length of collection');
		assert.equal(instance.readOnly, true, 'The wrong readOnly flag value');

		assert.equal(instance.removeAllEntities(), false, 'Can\'t remove all entities from read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');

		assert.equal(instance.removeEntities(entities), false, 'Can\'t remove entities from read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');

		assert.equal(instance.removeEntity(entities[0]), false, 'Can\'t remove entity from read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');

		assert.equal(instance.addEntity(new SimpleEntity()), false, 'Can\'t add entity to read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');

		assert.equal(instance.addEntities([new SimpleEntity()]), false, 'Can\'t add entities to read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');
	});

	it('add & has & indexOf & remove', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection();

		assert.equal(instance.length, 0, 'The wrong length of collection');

		assert.equal(instance.addEntity(entity), true, 'Could not add entity to collection');
		assert.equal(instance.length, 1, 'The wrong length of collection');

		assert.equal(instance.hasEntity(entity), true, 'Could not find entity in collection');
		assert.equal(instance.indexOf(entity), 0, 'The wrong index of entity in collection');

		assert.equal(instance.removeEntity(entity), true, 'Could not add entity to collection');
		assert.equal(instance.length, 0, 'The wrong length of collection');
	});

	it('add events', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection(),
			actualCall: any[] = [];

		instance.addListener(function(e: CollectionEvent) {
			actualCall.push(e.type);
		}, this);

		instance.addEntity(entity);
		assert.equal(actualCall.join(', '), 'Simple:beforeAdd, Simple:added', 'Collection don\'t dispatch events');
	});

	it('remove events', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection([entity]),
			actualCall: any[] = [];

		instance.addListener(function(e: CollectionEvent) {
			actualCall.push(e.type);
		}, this);

		instance.removeEntity(entity);
		assert.equal(actualCall.join(', '), 'Simple:beforeRemove, Simple:removed', 'Collection don\'t dispatch events');
	});

	it('clear events', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection([entity]),
			actualCall: any[] = [];

		instance.addListener(function(e: CollectionEvent) {
			actualCall.push(e.type);
		}, this);

		instance.removeAllEntities();
		assert.equal(actualCall.join(', '), 'Simple:beforeClear, Simple:cleared', 'Collection don\'t dispatch events');
	});

	it('relay events from entities', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection([entity], true),
			actualCallCount: number = 0;

		instance.addListener(function(e: CollectionEvent) {
			actualCallCount++;
		}, this, { [entity.entityMeta.name]: [EntityEvent.BEFORE_CHANGE, EntityEvent.CHANGED] });

		entity.set('value', 1);

		assert.equal(actualCallCount, 2, 'Collection don\'t relay events');

		instance.removeEntity(entity);
		entity.set('value', 2);

		assert.equal(actualCallCount, 2, 'Collection relaed events from removed entities');

		instance.addEntity(entity);
		entity.set('value', 3);

		assert.equal(actualCallCount, 4, 'Collection don\'t relay events');
	});	

	it('cancel add', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection();

		instance.addListener(function(e: CollectionEvent) {
			e.preventDefault();
		}, this, entity.entityMeta.name + ':beforeAdd');

		assert.equal(instance.addEntity(entity), false, 'Cancelling of add failed');
		assert.equal(instance.length, 0, 'Collection should be empty');
	});	

	it('cancel remove', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection([entity]);

		instance.addListener(function(e: CollectionEvent) {
			e.preventDefault();
		}, this, entity.entityMeta.name + ':beforeRemove');

		assert.equal(instance.removeEntity(entity), false, 'Cancelling of add failed');
		assert.equal(instance.length, 1, 'Collection could not be empty');
	});

	it('cancel clear', function()
	{
		var name: string = 'example',
			entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection([entity]);

		instance.addListener(function(e: CollectionEvent) {
			e.preventDefault();
		}, this, entity.entityMeta.name + ':beforeClear');

		assert.equal(instance.removeAllEntities(), false, 'Cancelling of add failed');
		assert.equal(instance.length, 1, 'Collection could not be empty');
	});

	it('silent add', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection(),
			callCount: number = 0;

		instance.addListener(function(e: CollectionEvent) {
			callCount++;
		}, this);

		assert.equal(instance.addEntity(entity, false), true, 'Adds of entity failed');
		assert.equal(callCount, 0, 'Collection should not dispatch events');
	});	

	it('silent remove', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection([entity]),
			callCount: number = 0;

		instance.addListener(function(e: CollectionEvent) {
			callCount++;
		}, this);

		assert.equal(instance.removeEntity(entity, false), true, 'Removes of entity failed');
		assert.equal(callCount, 0, 'Collection should not dispatch events');
	});	

	it('silent addAll', function()
	{
		var entity: Entity = new SimpleEntity(),
			instance: Collection = new SimpleCollection([entity]),
			callCount: number = 0;

		instance.addListener(function(e: CollectionEvent) {
			callCount++;
		}, this);

		assert.equal(instance.removeAllEntities(false), true, 'Removes of all entities failed');
		assert.equal(callCount, 0, 'Collection should not dispatch events');
	});	
});