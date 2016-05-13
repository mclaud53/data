import {Registry} from '../src/Registry';
import {Collection} from '../src/Collection';
import {CollectionMeta} from '../src/meta/CollectionMeta';

export class CardCollection extends Collection
{
	protected initCollectionMeta(): CollectionMeta
	{
		return Registry.getInstance()
			.getMetaRegistry()
			.getCollection('Card');
	}
}