import {Registry} from '../../src/Registry';
import {CollectionMeta} from '../../src/meta/CollectionMeta';
import {CardCollection} from '../CardCollection';

export class CardCollectionMeta extends CollectionMeta
{
	public constructor()
	{
		super(CardCollection, 'Card');
	}
}