import {EntityMeta} from '../../src/meta/EntityMeta';
import {Field} from '../../src/meta/Field';
import {Relation} from '../../src/meta/Relation';
import {RelationType} from '../../src/meta/RelationType';
import {Registry} from '../../src/Registry';
import {AccountEntity} from '../AccountEntity';

export class AccountEntityMeta extends EntityMeta
{
	public constructor()
	{
		super('Account', AccountEntity, 'accountId', [
			new Field<number>('accountId', 'integer', 0),
			new Field<number>('balance', 'float', 0.0)
		], [
			new Relation('card', RelationType.HasOne, 'Card', { accountId: 'accountId'}, true)
		]);
	}
}