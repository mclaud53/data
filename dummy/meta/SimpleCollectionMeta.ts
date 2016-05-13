import {Registry} from '../../src/Registry';
import {CollectionMeta} from '../../src/meta/CollectionMeta';
import {SimpleCollection} from '../SimpleCollection';

export class SimpleCollectionMeta extends CollectionMeta
{
	public constructor()
	{
		super(SimpleCollection, 'Simple');
	}
}