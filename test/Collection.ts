/// <reference path="../typings/main.d.ts" />
import col = require('../src/Collection');
import fil = require('../src/field/Field');
import ent = require('../src/Entity');
import colev = require('../src/event/CollectionEvent');
import entev = require('../src/event/EntityEvent');
import assert = require('assert');
require('sinomocha')();

describe('Collection', function() {
	it('creation', function() {
		var name: string = 'example',
			instance: col.Collection = new col.Collection(name);

		assert.equal(instance.name, name, 'The wrong name of collection');
		assert.equal(instance.separator, ':', 'The wrong value of separator');
		assert.equal(instance.length, 0, 'The wrong length of collection');
		assert.equal(instance.readOnly, false, 'The wrong readOnly flag value');
	});

	it('create read only collection', function() {
		var name: string = 'example',
			entities: ent.Entity[] = [
				new ent.Entity(name, {}, []),
				new ent.Entity(name, {}, []),
				new ent.Entity(name, {}, [])
			],
			length: number = entities.length,
			instance: col.Collection = new col.Collection(name, entities, false, true);

		assert.equal(instance.length, length, 'The wrong length of collection');
		assert.equal(instance.readOnly, true, 'The wrong readOnly flag value');

		assert.equal(instance.removeAllEntities(), false, 'Can\'t remove all entities from read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');

		assert.equal(instance.removeEntities(entities), false, 'Can\'t remove entities from read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');

		assert.equal(instance.removeEntity(entities[0]), false, 'Can\'t remove entity from read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');

		assert.equal(instance.addEntity(new ent.Entity(name, {}, [])), false, 'Can\'t add entity to read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');

		assert.equal(instance.addEntities([new ent.Entity(name, {}, [])]), false, 'Can\'t add entities to read only collection');
		assert.equal(instance.length, length, 'The wrong length of collection');
	});

	it('add & has & indexOf & remove', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name);

		assert.equal(instance.length, 0, 'The wrong length of collection');

		assert.equal(instance.addEntity(entity), true, 'Could not add entity to collection');
		assert.equal(instance.length, 1, 'The wrong length of collection');

		assert.equal(instance.hasEntity(entity), true, 'Could not find entity in collection');
		assert.equal(instance.indexOf(entity), 0, 'The wrong index of entity in collection');

		assert.equal(instance.removeEntity(entity), true, 'Could not add entity to collection');
		assert.equal(instance.length, 0, 'The wrong length of collection');
	});

	it('add events', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name),
			actualCall: any[] = [];

		instance.addListener(function(e: colev.CollectionEvent) {
			actualCall.push(e.type);
		}, this);

		instance.addEntity(entity);
		assert.equal(actualCall.join(', '), 'example:beforeAdd, example:added', 'Collection don\'t dispatch events');
	});

	it('remove events', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name, [entity]),
			actualCall: any[] = [];

		instance.addListener(function(e: colev.CollectionEvent) {
			actualCall.push(e.type);
		}, this);

		instance.removeEntity(entity);
		assert.equal(actualCall.join(', '), 'example:beforeRemove, example:removed', 'Collection don\'t dispatch events');
	});

	it('removeAll events', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name, [entity]),
			actualCall: any[] = [];

		instance.addListener(function(e: colev.CollectionEvent) {
			actualCall.push(e.type);
		}, this);

		instance.removeAllEntities();
		assert.equal(actualCall.join(', '), 'example:beforeRemove, example:removed', 'Collection don\'t dispatch events');
	});

	it('relay events from entities', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {
				field: new fil.Field(0)
			}, []),
			instance: col.Collection = new col.Collection(name, [entity], true),
			actualCallCount: number = 0;

		instance.addListener(function(e: colev.CollectionEvent) {
			actualCallCount++;
		}, this, {[name]: [entev.EntityEvent.BEFORE_CHANGE, entev.EntityEvent.CHANGED]});

		entity.set('field', 1);

		assert.equal(actualCallCount, 2, 'Collection don\'t relay events');

		instance.removeEntity(entity);
		entity.set('field', 2);

		assert.equal(actualCallCount, 2, 'Collection relaed events from removed entities');

		instance.addEntity(entity);
		entity.set('field', 3);

		assert.equal(actualCallCount, 4, 'Collection don\'t relay events');
	});	

	it('cancel add', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name);

		instance.addListener(function(e: colev.CollectionEvent) {
			e.preventDefault();
		}, this, name + ':beforeAdd');

		assert.equal(instance.addEntity(entity), false, 'Cancelling of add failed');
		assert.equal(instance.length, 0, 'Collection should be empty');
	});	

	it('cancel remove', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name, [entity]);

		instance.addListener(function(e: colev.CollectionEvent) {
			e.preventDefault();
		}, this, name + ':beforeRemove');

		assert.equal(instance.removeEntity(entity), false, 'Cancelling of add failed');
		assert.equal(instance.length, 1, 'Collection could not be empty');
	});

	it('cancel removeAll', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name, [entity]);

		instance.addListener(function(e: colev.CollectionEvent) {
			e.preventDefault();
		}, this, name + ':beforeRemove');

		assert.equal(instance.removeAllEntities(), false, 'Cancelling of add failed');
		assert.equal(instance.length, 1, 'Collection could not be empty');
	});

	it('silent add', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name),
			callCount: number = 0;

		instance.addListener(function(e: colev.CollectionEvent) {
			callCount++;
		}, this);

		assert.equal(instance.addEntity(entity, false), true, 'Adds of entity failed');
		assert.equal(callCount, 0, 'Collection should not dispatch events');
	});	

	it('silent remove', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name, [entity]),
			callCount: number = 0;

		instance.addListener(function(e: colev.CollectionEvent) {
			callCount++;
		}, this);

		assert.equal(instance.removeEntity(entity, false), true, 'Removes of entity failed');
		assert.equal(callCount, 0, 'Collection should not dispatch events');
	});	

	it('silent addAll', function() {
		var name: string = 'example',
			entity: ent.Entity = new ent.Entity(name, {}, []),
			instance: col.Collection = new col.Collection(name, [entity]),
			callCount: number = 0;

		instance.addListener(function(e: colev.CollectionEvent) {
			callCount++;
		}, this);

		assert.equal(instance.removeAllEntities(false), true, 'Removes of all entities failed');
		assert.equal(callCount, 0, 'Collection should not dispatch events');
	});	
});