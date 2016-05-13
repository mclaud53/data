import {EntityMeta} from '../../src/meta/EntityMeta';
import {Field} from '../../src/meta/Field';
import {Relation} from '../../src/meta/Relation';
import {RelationType} from '../../src/meta/RelationType'; 
import {Registry} from '../../src/Registry';
import {UserEntity} from '../UserEntity';

export class UserEntityMeta extends EntityMeta
{
	public constructor()
	{
		super('User', UserEntity, 'userId', [
			new Field<number>('userId', 'integer', 0),
			new Field<string>('name', 'string', '')
		], [
			new Relation('card', RelationType.HasMany, 'Card', { userId: 'userId' }, true)
		]);
	}
}