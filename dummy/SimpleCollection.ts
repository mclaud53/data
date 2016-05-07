import {Collection} from '../src/Collection';
import {CollectionMeta} from '../src/meta/CollectionMeta';
import {SimpleCollectionMeta} from './meta/SimpleCollectionMeta';

export class SimpleCollection extends Collection
{
	private static _collectionMeta: CollectionMeta = null;

	protected initCollectionMeta(): CollectionMeta
	{
		if (null === SimpleCollection._collectionMeta) {
			SimpleCollection._collectionMeta = new SimpleCollectionMeta();
		}
		return SimpleCollection._collectionMeta;
	}
}