import {Entity, EntityState} from './../Entity';
import {RelatedMap} from '../RelatedMap';

export interface EntityClass
{
	new (state?: EntityState, relMap?: RelatedMap, readOnly?: boolean, uuid?: string): Entity;
}