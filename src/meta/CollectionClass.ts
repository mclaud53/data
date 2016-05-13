import {Collection} from './../Collection';
import {Entity} from './../Entity';

export interface CollectionClass
{
	new (entities?: Entity[], relayEvents?: boolean, readOnly?: boolean, uuid?: string): Collection;
}