import {Registry} from '../src/Registry';
import {Collection} from '../src/Collection';
import {CollectionMeta} from '../src/meta/CollectionMeta';
import {SimpleCollectionMeta} from './meta/SimpleCollectionMeta';

export class SimpleCollection extends Collection
{
	protected initCollectionMeta(): CollectionMeta
	{
		return Registry.getInstance()
			.getMetaRegistry()
			.getCollection('Simple');
	}
}