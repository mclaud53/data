import {Collection} from './Collection';
import {Entity} from './Entity';

export type RelatedMap = {
	[key: string]: (Entity | Collection)
};