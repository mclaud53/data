/// <reference path="../typings/main.d.ts" />
import * as assert from 'assert';
require('sinomocha')();

import {Serialize} from '../src/Serialize';

import {Registry} from '../src/Registry';

import {BooleanFieldType} from '../src/meta/type/BooleanFieldType';
import {FloatFieldType} from '../src/meta/type/FloatFieldType';
import {IntegerFieldType} from '../src/meta/type/IntegerFieldType';
import {StringFieldType} from '../src/meta/type/StringFieldType';

import {AccountCollectionMeta} from '../dummy/meta/AccountCollectionMeta';
import {AccountEntityMeta} from '../dummy/meta/AccountEntityMeta';
import {CardCollectionMeta} from '../dummy/meta/CardCollectionMeta';
import {CardEntityMeta} from '../dummy/meta/CardEntityMeta';
import {UserCollectionMeta} from '../dummy/meta/UserCollectionMeta';
import {UserEntityMeta} from '../dummy/meta/UserEntityMeta';

import {AccountCollection} from '../dummy/AccountCollection';
import {AccountEntity} from '../dummy/AccountEntity';
import {CardCollection} from '../dummy/CardCollection';
import {CardEntity} from '../dummy/CardEntity';
import {UserCollection} from '../dummy/UserCollection';
import {UserEntity} from '../dummy/UserEntity';

describe('Serialize', function()
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
			new AccountEntityMeta(),
			new CardEntityMeta(),
			new UserEntityMeta()
		], true)
		.register([
			new AccountCollectionMeta(),
			new CardCollectionMeta(),
			new UserCollectionMeta()
		], true);

	var instance: Serialize = new Serialize(),
		user1: UserEntity = new UserEntity({ userId: 1, name: 'John Snow' }, {}, false, 'User-1'),
		user2: UserEntity = new UserEntity({ name: 'Eddard Stark' }, {}, false, 'User-2'),
		account1: AccountEntity = new AccountEntity({ accountId: 1, balance: 10 }, {}, false, 'Account-1'),
		account2: AccountEntity = new AccountEntity({ accountId: 2, balance: 20 }, {}, false, 'Account-2'),
		account3: AccountEntity = new AccountEntity({ balance: 30 }, {}, false, 'Account-3'),
		account4: AccountEntity = new AccountEntity({ balance: 40 }, {}, false, 'Account-4'),
		card1: CardEntity = new CardEntity({ cardId: 1, number: '#1' }, { user: user1, account: account1 }, false, 'Card-1'),
		card2: CardEntity = new CardEntity({ cardId: 2, number: '#2' }, { user: user1, account: account2 }, false, 'Card-2'),
		card3: CardEntity = new CardEntity({ number: '#3' }, { user: user2, account: account3 }, false, 'Card-3'),
		card4: CardEntity = new CardEntity({ number: '#4' }, { user: user2, account: account4 }, false, 'Card-4');

	beforeEach(function () {
		user1.revert();
	});

	it('serialize !new & !dirty', function ()
	{
		var data: Object = instance.serialize(user1),
			json: string = JSON.stringify(data);

		assert.equal(json, '{}');
	});

	it('serialize !new & dirty', function ()
	{
		user1.set('name', 'Brother of Night Watch');

		var data: Object = instance.serialize(user1),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"User":{"User-1":{"userId":1,"name":"Brother of Night Watch"}}}');
	});

	it('serialize new', function ()
	{
		var data: Object = instance.serialize(user2),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"User":{"User-2":{"name":"Eddard Stark"}}}');
	});

	it('serialize full !new && !dirty', function ()
	{
		var data: Object = instance.serialize(user1, {full: true}),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"User":{"User-1":{"userId":1,"name":"John Snow"}}}');
	});

	it('serialize deep (belongsTo)', function ()
	{
		var data: Object = instance.serialize(card1, { deep: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Card":{"Card-1":{"cardId":1}}}');
	});

	it('serialize deep (hasOne)', function ()
	{
		var data: Object = instance.serialize(account1, { deep: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Account":{"Account-1":{"accountId":1}},"Card":{"Card-1":{"cardId":1}}}');
	});

	it('serialize deep (hasMany)', function ()
	{
		var data: Object = instance.serialize(user1, { deep: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"User":{"User-1":{"userId":1}},"Card":{"Card-1":{"cardId":1},"Card-2":{"cardId":2}}}');
	});

	it('serialize deep (belongsTo) & backRel', function ()
	{
		var data: Object = instance.serialize(card1, { deep: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Card":{"Card-1":{"cardId":1},"Card-2":{"cardId":2}},"User":{"User-1":{"userId":1}},"Account":{"Account-2":{"accountId":2},"Account-1":{"accountId":1}}}');
	});

	it('serialize deep (hasOne) & backRel', function ()
	{
		var data: Object = instance.serialize(account1, { deep: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Account":{"Account-1":{"accountId":1},"Account-2":{"accountId":2}},"Card":{"Card-1":{"cardId":1},"Card-2":{"cardId":2}},"User":{"User-1":{"userId":1}}}');
	});

	it('serialize deep (hasMany) & backRel', function ()
	{
		var data: Object = instance.serialize(user1, { deep: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"User":{"User-1":{"userId":1}},"Card":{"Card-1":{"cardId":1},"Card-2":{"cardId":2}},"Account":{"Account-1":{"accountId":1},"Account-2":{"accountId":2}}}');
	});

	it('serialize deep (belongsTo) & rel', function ()
	{
		var data: Object = instance.serialize(card1, { deep: true, rel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Card":{"Card-1":{"cardId":1}}}');
	});

	it('serialize deep (hasOne) & rel', function ()
	{
		var data: Object = instance.serialize(account1, { deep: true, rel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Account":{"Account-1":{"accountId":1,"card":"Card-1"}},"Card":{"Card-1":{"cardId":1}}}');
	});

	it('serialize deep (hasMany) & rel', function ()
	{
		var data: Object = instance.serialize(user1, { deep: true, rel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"User":{"User-1":{"userId":1,"card":["Card-1","Card-2"]}},"Card":{"Card-1":{"cardId":1},"Card-2":{"cardId":2}}}');
	});

	it('serialize deep (belongsTo) & rel & backRel', function ()
	{
		var data: Object = instance.serialize(card1, { deep: true, rel: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Card":{"Card-1":{"cardId":1},"Card-2":{"cardId":2}},"User":{"User-1":{"userId":1,"card":["Card-1","Card-2"]}},"Account":{"Account-2":{"accountId":2,"card":"Card-2"},"Account-1":{"accountId":1,"card":"Card-1"}}}');
	});

	it('serialize deep (hasOne) & rel & backRel', function ()
	{
		var data: Object = instance.serialize(account1, { deep: true, rel: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Account":{"Account-1":{"accountId":1,"card":"Card-1"},"Account-2":{"accountId":2,"card":"Card-2"}},"Card":{"Card-1":{"cardId":1},"Card-2":{"cardId":2}},"User":{"User-1":{"userId":1,"card":["Card-1","Card-2"]}}}');
	});

	it('serialize deep (hasMany) & rel & backRel', function ()
	{
		var data: Object = instance.serialize(user1, { deep: true, rel: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"User":{"User-1":{"userId":1,"card":["Card-1","Card-2"]}},"Card":{"Card-1":{"cardId":1},"Card-2":{"cardId":2}},"Account":{"Account-1":{"accountId":1,"card":"Card-1"},"Account-2":{"accountId":2,"card":"Card-2"}}}');
	});	

	it('serialize new deep (belongsTo) & rel & backRel', function ()
	{
		var data: Object = instance.serialize(card3, { deep: true, rel: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Card":{"Card-3":{"number":"#3"},"Card-4":{"number":"#4"}},"User":{"User-2":{"name":"Eddard Stark","card":["Card-3","Card-4"]}},"Account":{"Account-4":{"balance":40,"card":"Card-4"},"Account-3":{"balance":30,"card":"Card-3"}}}');
	});

	it('serialize new deep (hasOne) & rel & backRel', function ()
	{
		var data: Object = instance.serialize(account3, { deep: true, rel: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"Account":{"Account-3":{"balance":30,"card":"Card-3"},"Account-4":{"balance":40,"card":"Card-4"}},"Card":{"Card-3":{"number":"#3"},"Card-4":{"number":"#4"}},"User":{"User-2":{"name":"Eddard Stark","card":["Card-3","Card-4"]}}}');
	});

	it('serialize new deep (hasMany) & rel & backRel', function ()
	{
		var data: Object = instance.serialize(user2, { deep: true, rel: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{"User":{"User-2":{"name":"Eddard Stark","card":["Card-3","Card-4"]}},"Card":{"Card-3":{"number":"#3"},"Card-4":{"number":"#4"}},"Account":{"Account-3":{"balance":30,"card":"Card-3"},"Account-4":{"balance":40,"card":"Card-4"}}}');
	});	

	it('serialize !deep (belongsTo) & rel & backRel', function ()
	{
		var data: Object = instance.serialize(card1, { rel: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{}');
	});

	it('serialize !deep (hasOne) & rel & backRel', function() {
		var data: Object = instance.serialize(account1, { rel: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{}');
	});

	it('serialize !deep (hasMany) & rel & backRel', function() {
		var data: Object = instance.serialize(user1, { rel: true, backRel: true }),
			json: string = JSON.stringify(data);

		assert.equal(json, '{}');
	});		

});
