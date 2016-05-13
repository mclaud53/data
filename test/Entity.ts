/// <reference path="../typings/main.d.ts" />
import * as assert from 'assert';
require('sinomocha')();

import {Registry} from '../src/Registry';
import {Collection} from '../src/Collection';
import {Field} from '../src/meta/Field';
import {Relation} from '../src/meta/Relation';
import {RelationType} from '../src/meta/RelationType';
import {Entity} from '../src/Entity';
import {Transaction} from '../src/Transaction';
import {CollectionEvent} from '../src/event/CollectionEvent';
import {EntityEvent} from '../src/event/EntityEvent';
import {TransactionEvent} from '../src/event/TransactionEvent';
import {FieldTypeRegistry} from '../src/meta/FieldTypeRegistry';

import {BooleanFieldType} from '../src/meta/type/BooleanFieldType';
import {FloatFieldType} from '../src/meta/type/FloatFieldType';
import {IntegerFieldType} from '../src/meta/type/IntegerFieldType';
import {StringFieldType} from '../src/meta/type/StringFieldType';

import {SimpleEntityMeta} from '../dummy/meta/SimpleEntityMeta';
import {SimpleEntity} from '../dummy/SimpleEntity';

import {AccountCollectionMeta} from '../dummy/meta/AccountCollectionMeta';
import {AccountEntityMeta} from '../dummy/meta/AccountEntityMeta';
import {CardCollectionMeta} from '../dummy/meta/CardCollectionMeta';
import {CardEntityMeta} from '../dummy/meta/CardEntityMeta';
import {UserEntityMeta} from '../dummy/meta/UserEntityMeta';

import {AccountCollection} from '../dummy/AccountCollection';
import {AccountEntity} from '../dummy/AccountEntity';
import {CardCollection} from '../dummy/CardCollection';
import {CardEntity} from '../dummy/CardEntity';
import {UserEntity} from '../dummy/UserEntity';

describe('Entity', function()
{
	Registry.getInstance()
		.getFieldTypeRegistry()
		.register<any>([
			new BooleanFieldType(),
			new FloatFieldType(),
			new IntegerFieldType(),
			new StringFieldType()
		], true);

	Registry.getInstance()
		.getMetaRegistry()
		.register([
			new SimpleEntityMeta(),
			new AccountEntityMeta(),
			new CardEntityMeta(),
			new UserEntityMeta()
		], true)
		.register([
			new AccountCollectionMeta(),
			new CardCollectionMeta()
		])

	it('creation', function ()
	{
		var instance: Entity = new SimpleEntity();

		assert.equal(instance.id, 0, 'The property "id" has a wrong value');
		assert.equal(instance.readOnly, false, 'The property "readOnly" has a wrong value');
		assert.equal(instance.hasTransaction(), false, 'The new entity can\'t has transaction');
		assert.equal(instance.getTransaction(), null, 'The new entity can\'t returns transaction');
	});

	it('get/set', function ()
	{
		var instance: Entity = new SimpleEntity();

		assert.equal(instance.get('id'), 0, 'The field "id" has a wrong value');
		assert.equal(instance.get('title'), '', 'The field "title" has a wrong value');

		assert.equal(instance.set('id', 5), true, 'Can\'t set "id" field');
		assert.equal(instance.get('id'), 5, 'The field "id" has a wrong value');

		assert.equal(instance.set('title', 'New title'), true, 'Can\'t set "title" field');
		assert.equal(instance.get('title'), 'New title', 'The field "title" has a wrong value');
	});

	it('get initial', function ()
	{
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

	it('setState events', function ()
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

	it('silent setState', function ()
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

	it('cancel setState', function ()
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

	it('transaction success', function ()
	{
		var instance: Entity = new SimpleEntity({
			id: 3,
			title: 'Initial title'
		}),
			begin: boolean = false,
			commit: boolean = false,
			beforeChange: boolean = false,
			changed: boolean = false;

		instance.addListener(function(event: TransactionEvent): void {
			begin = true;
		}, this, TransactionEvent.BEGIN);

		instance.addListener(function(event: TransactionEvent): void {
			commit = true;
		}, this, TransactionEvent.COMMIT);

		instance.set('title', 'Current title');
		assert.equal(begin, false, 'Can\'t fire event "transactionBegin" before transaction begined');

		instance.beginTransaction();

		assert.equal(begin, true, 'After begin transaction must fire event "transactionBegin"');
		assert.equal(commit, false, 'Can\'t fire event "transactionCommit" before transaction commited');
		assert.equal(instance.hasTransaction(), true, 'Method "hasTransaction" must returns "true"');

		instance.addListener(function(event: EntityEvent): void {
			beforeChange = true;
		}, this, EntityEvent.BEFORE_CHANGE);

		instance.addListener(function(event: EntityEvent): void {
			changed = true;
		}, this, EntityEvent.CHANGED);

		instance.set('title', 'New title');

		assert.equal(beforeChange, true, 'Event "beforeChange" must be failed in transaction');
		assert.equal(changed, false, 'Event "changed" can\' be failed in transaction');
		assert.equal(instance.get('title'), 'New title', 'Field "title" has a wrong value in transaction');

		instance.getTransaction().commit();

		assert.equal(commit, true, 'After commit transaction must fire event "transactionCommit"');
		assert.equal(changed, true, 'Event "changed" must be failed after commit transaction');
		assert.equal(instance.get('title'), 'New title', 'Field "title" has a wrong value after commit transaction');
		assert.equal(instance.hasTransaction(), false, 'Method "hasTransaction" must returns "false" after transaction commited');
	});

	it('transaction failed', function () {
		var instance: Entity = new SimpleEntity({
				id: 3,
				title: 'Initial title'
			}),
			rollback: boolean = false,
			beforeChange: boolean = false,
			changed: boolean = false;

		instance.addListener(function(event: TransactionEvent): void {
			rollback = true;
		}, this, TransactionEvent.ROLLBACK);

		instance.set('title', 'Current title');

		instance.beginTransaction();

		assert.equal(rollback, false, 'Can\'t fire event "transactionRollback" before transaction rolled back');
		assert.equal(instance.hasTransaction(), true, 'Method "hasTransaction" must returns "true"');

		instance.addListener(function(event: EntityEvent): void {
			beforeChange = true;
		}, this, EntityEvent.BEFORE_CHANGE);

		instance.addListener(function(event: EntityEvent): void {
			changed = true;
		}, this, EntityEvent.CHANGED);

		instance.set('title', 'New title');

		assert.equal(beforeChange, true, 'Event "beforeChange" must be failed in transaction');
		assert.equal(changed, false, 'Event "changed" can\' be failed in transaction');
		assert.equal(instance.get('title'), 'New title', 'Field "title" has a wrong value in transaction');

		instance.getTransaction().rollback();

		assert.equal(rollback, true, 'After rollback transaction must fire event "transactionRollback"');
		assert.equal(changed, false, 'Event "changed" can\'t be failed after commit transaction');
		assert.equal(instance.get('title'), 'Current title', 'Field "title" has a wrong value after transaction rolled back');
		assert.equal(instance.hasTransaction(), false, 'Method "hasTransaction" must returns "false" after transaction rolled back');
	});

	it('rollback transaction if can\'t set field value', function ()
	{
		var instance: Entity = new SimpleEntity({
				id: 3,
				title: 'Initial title'
			}),
			transaction: Transaction;

		instance.set('title', 'Current title');

		transaction = instance.beginTransaction();

		instance.addListener(function(event: EntityEvent): void {
			event.preventDefault();
		}, this, EntityEvent.BEFORE_CHANGE);

		instance.set('title', 'New title');

		assert.equal(instance.get('title'), 'Current title', 'Field "title" has a wrong value');
		assert.equal(transaction.isFinished(), true, 'Method "isFinished" must returns "true" after transaction rolled back');
		assert.equal(transaction.isSuccess(), false, 'Method "isSuccess" must returns "false" after transaction rolled back');
		assert.equal(instance.hasTransaction(), false, 'Method "hasTransaction" must returns "false" after transaction rolled back');
	});

	it('setRelated (belongsTo <-> hasOne)', function ()
	{
		var account: AccountEntity = new AccountEntity({
				accountId: 2,
				balance: 100
			}),
			card: CardEntity = new CardEntity({
				cardId: 3,
				number: 'XXXX-XXXX-XXXX-XXXX'
			});

		assert.equal(card.hasRelated('account'), false, 'The new entity has no related entities (belongsTo -> hasOne)');
		assert.equal(account.hasRelated('card'), false, 'The new entity has no related entities (hasOne -> belongsTo)');

		assert.equal(card.setRelated('account', account), true, 'The assign releated failed');

		assert.equal(card.hasRelated('account'), true, 'The entity must have related entity (belongsTo -> hasOne)');
		assert.equal(account.hasRelated('card'), true, 'The entity must have related entity (hasOne -> belongsTo)');

		assert.equal(card.get('accountId'), 2, 'The foreign key must be updated while set relation');
	});	

	it('setRelated (belongsTo <-> hasOne) throw error if pass collection instead entity', function()
	{
		var instance: CardEntity = new CardEntity(),
			actual: boolean = false;

		try {
			instance.setRelated('account', new AccountCollection());
		} catch (e) {
			actual = true;
		}

		assert.equal(actual, true, 'Entity must throw error if pass collection instead entity');
	});

	it('setRelated (belongsTo <-> hasOne) relayEvents', function ()
	{
		var account: AccountEntity = new AccountEntity({}),
			card: CardEntity = new CardEntity({}, {
				account: account
			}),
			accountEvent: boolean = false,
			cardEvent: boolean = false;

		account.addListener(function(e: EntityEvent): void {
			cardEvent = true;
		}, this, 'Card:changed:number');

		card.set('number', 'XXXX-XXXX-XXXX-XXXX');

		assert.equal(cardEvent, true, 'Event "Card:changed:number" must be fired');

		card.addListener(function(e: EntityEvent): void {
			accountEvent = true;
		}, this, 'Account:changed:balance');

		account.set('balance', 100);

		assert.equal(accountEvent, true, 'Event "Account:changed:balance" must be fired');
	});	

	it('setRelated (belongsTo <-> hasOne) update cascade', function ()
	{
		var account: AccountEntity = new AccountEntity({
				accountId: 3
			}),
			card: CardEntity = new CardEntity({}, {
				account: account
			});

		assert.equal(card.get('accountId'), 3, 'Foreign key has a wrong value');
		account.set('accountId', 12);
		assert.equal(card.get('accountId'), 12, 'BelongsTo relation must be updated cascade');
	});

	it('setRelated (belongsTo <-> hasMany)', function ()
	{
		var card: CardEntity = new CardEntity({
				cardId: 3,
				number: 'XXXX-XXXX-XXXX-XXXX'
			}),
			user: UserEntity = new UserEntity({
				userId: 5
			});

		assert.equal(card.hasRelated('user'), false, 'The new entity has no related entities (belongsTo -> hasMany)');
		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card), false, 'The new entity has no related entities (hasMany -> belongsTo)');

		assert.equal(card.setRelated('user', user), true, 'The assign releated failed');

		assert.equal(card.hasRelated('user'), true, 'The entity must have related entity (belongsTo -> hasMany)');
		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card), true, 'The entity must have related entity (hasMany -> belongsTo)');

		assert.equal(card.get('userId'), 5, 'The foreign key must be updated while set relation');
	});

	it('setRelated (belongsTo <-> hasMany) relayEvents', function ()
	{
		var user: UserEntity = new UserEntity(),
			card: CardEntity = new CardEntity({}, {
				user: user
			}),
			userEvent: boolean = false,
			cardEvent: boolean = false;

		user.addListener(function(e: EntityEvent): void {
			cardEvent = true;
		}, this, 'Card:changed:number');

		card.set('number', 'XXXX-XXXX-XXXX-XXXX');

		assert.equal(cardEvent, true, 'Event "Card:changed:number" must be fired');

		card.addListener(function(e: EntityEvent): void {
			userEvent = true;
		}, this, 'User:changed:name');

		user.set('name', 'John Snow');

		assert.equal(userEvent, true, 'Event "User:changed:name" must be fired');
	});

	it('setRelated (belongsTo <-> hasMany) update cascade', function ()
	{
		var user: UserEntity = new UserEntity({
				userId: 3
			}),
			card: CardEntity = new CardEntity({}, {
				user: user
			});

		assert.equal(card.get('userId'), 3, 'Foreign key has a wrong value');
		user.set('userId', 12);
		assert.equal(card.get('userId'), 12, 'BelongsTo relation must be updated cascade');
	});

	it('setRelated (hasOne <-> belongsTo)', function ()
	{
		var account: AccountEntity = new AccountEntity({
				accountId: 2,
				balance: 100
			}),
			card: CardEntity = new CardEntity({
				cardId: 3,
				number: 'XXXX-XXXX-XXXX-XXXX'
			});

		assert.equal(account.hasRelated('card'), false, 'The new entity has no related entities (hasOne -> belongsTo)');
		assert.equal(card.hasRelated('account'), false, 'The new entity has no related entities (belongsTo -> hasOne)');

		assert.equal(account.setRelated('card', card), true, 'The assign releated failed');

		assert.equal(account.hasRelated('card'), true, 'The entity must have related entity (hasOne -> belongsTo)');
		assert.equal(card.hasRelated('account'), true, 'The entity must have related entity (belongsTo -> hasOne)');

		assert.equal(card.get('accountId'), 2, 'The foreign key must be updated while set relation');
	});

	it('setRelated (hasOne <-> belongsTo) throw error if pass collection instead entity', function ()
	{
		var instance: AccountEntity = new AccountEntity(),
			actual: boolean = false;

		try {
			instance.setRelated('card', new CardCollection());
		} catch (e) {
			actual = true;
		}

		assert.equal(actual, true, 'Entity must throw error if pass collection instead entity');
	});

	it('setRelated (hasMany <-> belongsTo)', function()
	{
		var user: UserEntity = new UserEntity({
			userId: 3
		}),
			card1: CardEntity = new CardEntity({
				cardId: 1
			}, {
					user: user
				}),
			card2: CardEntity = new CardEntity({
				cardId: 2
			}),
			cards: CardCollection = new CardCollection([card2]);

		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card1), true, 'The UserEntity must have related CardEntity[1] before setRelated (hasMany -> belongsTo)');
		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card2), false, 'The UserEntity has no related CardEntity[2] before setRelated (hasMany -> belongsTo)');
		assert.equal(card1.hasRelated('user'), true, 'The CardEntity[1] must have related UserEntity before setRelated (belongsTo -> hasMany)');
		assert.equal(card2.hasRelated('user'), false, 'The CardEntity[2] must have related UserEntity before setRelated (belongsTo -> hasMany)');

		assert.equal(user.setRelated('card', cards), true, 'The assign releated failed');

		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card1), false, 'The UserEntity must have related CardEntity[1] after setRelated (hasMany -> belongsTo)');
		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card2), true, 'The UserEntity must have related CardEntity[2] after setRelated (hasMany -> belongsTo)');
		assert.equal(card1.hasRelated('user'), false, 'The CardEntity[1] must have related UserEntity after setRelated (belongsTo -> hasMany)');
		assert.equal(card2.hasRelated('user'), true, 'The CardEntity[2] must have related UserEntity after setRelated (belongsTo -> hasMany)');

		assert.equal(card1.get('userId'), 0, 'The foreign key must be updated while clear relation');
		assert.equal(card2.get('userId'), 3, 'The foreign key must be updated while set relation');
	});

	it('setRelated (hasMany <-> belongsTo) throw error if pass entity instead collection', function ()
	{
		var instance: UserEntity = new UserEntity(),
			actual: boolean = false;

		try {
			instance.setRelated('card', new CardEntity());
		} catch (e) {
			actual = true;
		}

		assert.equal(actual, true, 'Entity must throw error if pass entity instead collection');
	});

	it('(hasMany <-> belongsTo) addEntity & removeEntity', function ()
	{
		var user: UserEntity = new UserEntity({
				userId: 3
			}),
			card1: CardEntity = new CardEntity({
				cardId: 1
			}, {
				user: user
			}),
			card2: CardEntity = new CardEntity({
				cardId: 2
			});

		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card1), true, 'The UserEntity must have related CardEntity[1] before removeEntity (hasMany -> belongsTo)');
		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card2), false, 'The UserEntity has no related CardEntity[2] before addEntity (hasMany -> belongsTo)');
		assert.equal(card1.hasRelated('user'), true, 'The CardEntity[1] must have related UserEntity before removeEntity (belongsTo -> hasMany)');
		assert.equal(card2.hasRelated('user'), false, 'The CardEntity[2] has no related UserEntity before addEntity (belongsTo -> hasMany)');

		assert.equal(user.getRelated<CardCollection>('card').addEntity(card2), true, 'The add releated entity failed');
		assert.equal(user.getRelated<CardCollection>('card').removeEntity(card1), true, 'The remove releated entity failed');

		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card1), false, 'The UserEntity has no related CardEntity[1] after removeEntity (hasMany -> belongsTo)');
		assert.equal(user.getRelated<CardCollection>('card').hasEntity(card2), true, 'The UserEntity must have related CardEntity[2] after addEntity (hasMany -> belongsTo)');
		assert.equal(card1.hasRelated('user'), false, 'The CardEntity[1] has no related UserEntity after removeEntity (belongsTo -> hasMany)');
		assert.equal(card2.hasRelated('user'), true, 'The CardEntity[2] must have related UserEntity after addEntity (belongsTo -> hasMany)');

		assert.equal(card1.get('userId'), 0, 'The foreign key must be updated while clear relation');
		assert.equal(card2.get('userId'), 3, 'The foreign key must be updated while set relation');

	});

});