import {CollectionMeta} from '../../src/meta/CollectionMeta';
import {SimpleCollection} from '../SimpleCollection';
import {SimpleEntityMeta} from './SimpleEntityMeta';

export class SimpleCollectionMeta extends CollectionMeta
{
	public constructor()
	{
		super(SimpleCollection, new SimpleEntityMeta());
	}
}