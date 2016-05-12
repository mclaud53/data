import {Registry} from '../src/Registry';
import {EntityMeta} from '../src/meta/EntityMeta';
import {Entity, EntityState, RelationMap} from '../src/Entity';
import {SimpleEntityMeta} from './meta/SimpleEntityMeta';

export class SimpleEntity extends Entity
{
	public constructor(state: EntityState = null, relMap: RelationMap = null, isNew: boolean = true, readOnly: boolean = false, uuid: string = null)
	{
		super(state, relMap, isNew, readOnly, uuid);
	}

	protected initEntityMeta(): EntityMeta
	{
		return Registry.getInstance()
			.getMetaRegistry()
			.getEntity('Simple');
	}
}