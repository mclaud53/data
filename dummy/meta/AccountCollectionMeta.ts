import {Registry} from '../../src/Registry';
import {CollectionMeta} from '../../src/meta/CollectionMeta';
import {AccountCollection} from '../AccountCollection';

export class AccountCollectionMeta extends CollectionMeta
{
	public constructor()
	{
		super(AccountCollection, 'Account');
	}
}