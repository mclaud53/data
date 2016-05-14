import {Registry} from '../../src/Registry';
import {CollectionMeta} from '../../src/meta/CollectionMeta';
import {UserCollection} from '../UserCollection';

export class UserCollectionMeta extends CollectionMeta
{
	public constructor()
	{
		super(UserCollection, 'User');
	}
}