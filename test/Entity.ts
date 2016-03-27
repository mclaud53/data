/// <reference path="../typings/main.d.ts" />
import col = require('../src/Collection');
import fil = require('../src/field/Field');
import ent = require('../src/Entity');
import colev = require('../src/event/CollectionEvent');
import entev = require('../src/event/EntityEvent');
import assert = require('assert');
require('sinomocha')();

describe('Entity', function() {
	var name: string = 'example',
		fields: {
			[key:string]: fil.Field
		} = {
			id: new fil.Field(0),
			title: new fil.Field('')
		},
		primary: string[] = ['id'];

	it('creation', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary);

		assert.equal(instance.name, name, 'The wrong name of entity');
		assert.equal(instance.separator, ':', 'The wrong value of separator');
		assert.equal(instance.id, 0, 'The wrong id of entity');
		assert.equal(instance.id instanceof Array, false, 'The id has a wrong type');
		//assert.equal(instance.readOnly, false, 'The wrong readOnly flag value');
		assert.equal(instance.fieldsNames.join(', '), 'id, title', 'The wrong fields names of entity');
		assert.equal(instance.primaryNames, 'id', 'The wrong primary fields names of entity');
	});

	it('get/set', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary);

		assert.equal(instance.get('id'), 0, 'The field id has a wrong value');
		assert.equal(instance.get('title'), '', 'The field id has a wrong value');

		assert.equal(instance.set('id', 5), true, 'Can\'t set id field');
		assert.equal(instance.get('id'), 5, 'The field id has a wrong value');

		assert.equal(instance.set('title', 'New title'), true, 'Can\'t set title field');
		assert.equal(instance.get('title'), 'New title', 'The field title has a wrong value');
	});

	it('get initial', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary, null, {
			id: 3,
			title: 'title'
		});

		assert.equal(instance.get('id'), 3, 'The field id has a wrong value');
		assert.equal(instance.get('title'), 'title', 'The field id has a wrong value');

		assert.equal(instance.set('id', 5), true, 'Can\'t set id field');
		assert.equal(instance.get('id'), 5, 'The field id has a wrong value');
		assert.equal(instance.get('id', true), 3, 'The field id has a wrong initial value');

		assert.equal(instance.set('title', 'New title'), true, 'Can\'t set title field');
		assert.equal(instance.get('title'), 'New title', 'The field title has a wrong value');
		assert.equal(instance.get('title', true), 'title', 'The field title has a wrong initial value');
	});	

	it('setState events', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary, null, {
				id: 3,
				title: 'title'
			}),
			callCount: number = 0;

		instance.addListener(function (e: entev.EntityEvent): void {
			callCount++;
		}, this);

		assert.equal(instance.setState({id: 5, title: 'New title'}), true, 'Can\'t set state');

		assert.equal(instance.get('id'), 5, 'The field id has a wrong value');
		assert.equal(instance.get('id', true), 3, 'The field id has a wrong initial value');

		assert.equal(callCount, 2, 'The entity should dispatch events');
	});

	it('silent setState', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary, null, {
				id: 3,
				title: 'title'
			}),
			callCount: number = 0;

		instance.addListener(function (e: entev.EntityEvent): void {
			callCount++;
		}, this);

		assert.equal(instance.setState({id: 5, title: 'New title'}, false), true, 'Can\'t set state');

		assert.equal(instance.get('id'), 5, 'The field id has a wrong value');
		assert.equal(instance.get('id', true), 3, 'The field id has a wrong initial value');

		assert.equal(callCount, 0, 'The entity should not dispatch events');
	});	

	it('cancel setState', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary, null, {
				id: 3,
				title: 'title'
			});

		instance.addListener(function (e: entev.EntityEvent): void {
			e.preventDefault();
		}, this);

		assert.equal(instance.setState({id: 5, title: 'New title'}), false, 'Can\'t cancel set state');

		assert.equal(instance.get('id'), 3, 'The field id has a wrong value');
		assert.equal(instance.get('id', true), 3, 'The field id has a wrong initial value');

		assert.equal(instance.get('title'), 'title', 'The field id has a wrong value');
		assert.equal(instance.get('title', true), 'title', 'The field id has a wrong initial value');

	});	

});