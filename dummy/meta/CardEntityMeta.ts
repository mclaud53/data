import {EntityMeta} from '../../src/meta/EntityMeta';
import {Field} from '../../src/meta/Field';
import {Relation} from '../../src/meta/Relation';
import {RelationType} from '../../src/meta/RelationType'; 
import {Registry} from '../../src/Registry';
import {CardEntity} from '../CardEntity';

export class CardEntityMeta extends EntityMeta
{
	public constructor()
	{
		super('Card', CardEntity, 'cardId', [
			new Field<number>('cardId', 'integer', 0),
			new Field<number>('userId', 'integer', 0),
			new Field<number>('accountId', 'integer', 0),
			new Field<string>('number', 'string', '')
		], [
			new Relation('user', RelationType.BelongsTo, 'User', { userId: 'userId' }, true),
			new Relation('account', RelationType.BelongsTo, 'Account', { accountId: 'accountId' }, true)
		]);
	}
}