/// <reference path="../typings/main.d.ts" />
import col = require('../src/Collection');
import fil = require('../src/field/Field');
import rel = require('../src/Relation');
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
			title: new fil.Field(''),
			foreignId: new fil.Field(0)
		},
		primary: string[] = ['id'],
		relations: {
			[key:string]: rel.Relation
		} = {
			belongsTo: new rel.Relation(rel.RelationType.BelongsTo, 'belongsToEntity', {
				foreignId: 'primaryId'
			}, true),
			hasOne: new rel.Relation(rel.RelationType.HasOne, 'hasOneEntity', {
				id: 'foreingId'
			}),
			hasMany: new rel.Relation(rel.RelationType.HasMany, 'hasManyEntity', {
				id: 'foreingId'
			})
		};

	it('creation', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary);

		assert.equal(instance.name, name, 'The wrong name of entity');
		assert.equal(instance.separator, ':', 'The wrong value of separator');
		assert.equal(instance.id, 0, 'The wrong id of entity');
		assert.equal(instance.id instanceof Array, false, 'The id has a wrong type');
		//assert.equal(instance.readOnly, false, 'The wrong readOnly flag value');
		assert.equal(instance.fieldsNames.join(', '), 'id, title, foreignId', 'The wrong fields names of entity');
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

	it('throw error if name of relation same as name of field', function () {
		var instance: ent.Entity,
			actual: boolean = false;

		try {
			instance = new ent.Entity(name, fields, primary, {
				id: new rel.Relation(rel.RelationType.BelongsTo, 'someEntity', {})
			});
		} catch (e) {
			actual = true;
		}

		assert.equal(actual, true, 'If name of relation same as name of field then throw error');
	});

	it('throw error if name of foreign field isn\'t exist in field list', function () {
		var instance: ent.Entity,
			actual: boolean = false;

		try {
			instance = new ent.Entity(name, fields, primary, {
				someRelation: new rel.Relation(rel.RelationType.BelongsTo, 'someEntity', {
					someField: 'someOtherField'
				})
			});
		} catch (e) {
			actual = true;
		}

		assert.equal(actual, true, 'If name of field isn\'t in list of fields then throw error');
	});

	it('hasRelation', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary, relations, {
				id: 3,
				title: 'title'
			});

		assert.equal(instance.hasRelation('belongsTo'), true, 'The relation "belongsTo" must be exists');
		assert.equal(instance.hasRelation('hasOne'), true, 'The relation "hasOne" must be exists');
		assert.equal(instance.hasRelation('hasMany'), true, 'The relation "hasMany" must be exists');
		assert.equal(instance.hasRelation('someAny'), false, 'The relation "someAny" must not be exists');
	});

	it('getRelation', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary, relations, {
				id: 3,
				title: 'title'
			});

		assert.equal(instance.getRelation('belongsTo'), relations['belongsTo'], 'The relation "belongsTo" are wrong');
		assert.equal(instance.getRelation('hasOne'), relations['hasOne'], 'The relation "hasOne" are wrong');
		assert.equal(instance.getRelation('hasMany'), relations['hasMany'], 'The relation "hasMany" are wrong');
	});	

	it('getRelation', function() {
		var instance: ent.Entity = new ent.Entity(name, fields, primary, relations, {
				id: 3,
				title: 'title'
			});

		assert.equal(instance.findRelationName('belongsToEntity', rel.RelationType.BelongsTo), 'belongsTo', 'The relation "belongsTo" are wrong');
		assert.equal(instance.findRelationName('hasOneEntity', rel.RelationType.HasOne), 'hasOne', 'The relation "hasOne" are wrong');
		assert.equal(instance.findRelationName('hasManyEntity', rel.RelationType.HasMany), 'hasMany', 'The relation "hasMany" are wrong');
		assert.equal(instance.findRelationName('belongsToEntity', rel.RelationType.HasOne), null, 'If relation are not declared method "findRelationName" must return null');
	});	

	it('throw error if setRelation called with a wrong entity name', function () {
		var belongsTo: ent.Entity = new ent.Entity('someWrongEntity', {
				primaryId: new fil.Field(0)
			}, ['primaryId'], {
				hasOne: new rel.Relation(rel.RelationType.HasOne, 'hasOneEntity', {
					primaryId: 'foreingId'
				})
			}, {primaryId: 5}),
			instance: ent.Entity = new ent.Entity(name, fields, primary, relations),
			actual: boolean = false;

		try {
			instance.setRelated('belongsTo', belongsTo);
		} catch (e) {
			actual = true;
		}

		assert.equal(actual, true, 'The method setRelated must throw error if try to pass wrong entity/collection');
	});

	it('setRelated (belongsTo)', function () {
		var belongsTo: ent.Entity = new ent.Entity('belongsToEntity', {
				primaryId: new fil.Field(0)
			}, ['primaryId'], {
				hasOne: new rel.Relation(rel.RelationType.HasOne, 'hasOneEntity', {
					primaryId: 'foreingId'
				})
			}, {primaryId: 5}),
			instance: ent.Entity = new ent.Entity(name, fields, primary, relations);

		assert.equal(instance.hasRelated('belongsTo'), false, 'The new entity has no related entities');
		assert.equal(instance.setRelated('belongsTo', belongsTo), true, 'The assign releated failed');
		assert.equal(instance.hasRelated('belongsTo'), true, 'The entity must have related entity');
		assert.equal(instance.get('foreignId'), 5, 'The foreign key must be updated while set relation');
	});

	it('setRelated (belongsTo) throw error if pass collection instead entity', function () {
		var instance: ent.Entity = new ent.Entity(name, fields, primary, relations),
			actual: boolean = false;

		try {
			instance.setRelated('belongsTo', new col.Collection('belongsToEntity'));
		} catch (e) {
			actual = true;
		}

		assert.equal(actual, true, 'Entity must throw error if pass collection instead entity');
	});

	it('setRelated (belongsTo) relayEvents', function () {
		var belongsTo: ent.Entity = new ent.Entity('belongsToEntity', {
				primaryId: new fil.Field(0),
				value: new fil.Field(0)
			}, ['primaryId'], {
				hasOne: new rel.Relation(rel.RelationType.HasOne, 'hasOneEntity', {
					primaryId: 'foreignId'
				})
			}, {primaryId: 5}),
			instance: ent.Entity = new ent.Entity(name, fields, primary, relations),
			actualCallCount: number = 0;

		instance.setRelated('belongsTo', belongsTo);
		instance.addListener(function (e: entev.EntityEvent): void {
			actualCallCount++;
		}, this, 'belongsToEntity:changed:value');
		belongsTo.set('value', 5);
		assert.equal(actualCallCount, 1, 'Entity must relay events from related entities');
	});	

	it('setRelated (belongsTo) update cascade', function () {
		var belongsTo: ent.Entity = new ent.Entity('belongsToEntity', {
				primaryId: new fil.Field(0)
			}, ['primaryId'], {
				hasOne: new rel.Relation(rel.RelationType.HasOne, 'hasOneEntity', {
					primaryId: 'foreingId'
				})
			}, {primaryId: 5}),
			instance: ent.Entity = new ent.Entity(name, fields, primary, relations);

		instance.setRelated('belongsTo', belongsTo);
		assert.equal(instance.get('foreignId'), 5, 'Foreign key has a wrong value');
		belongsTo.set('primaryId', 12);
		assert.equal(instance.get('foreignId'), 12, 'BelongsTo relation must be updated cascade');
	});		
});