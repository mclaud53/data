import {Registry} from '../src/Registry';
import {EntityMeta} from '../src/meta/EntityMeta';
import {Entity, EntityState} from '../src/Entity';
import {SimpleEntityMeta} from './meta/SimpleEntityMeta';

export class SimpleEntity extends Entity
{
	public constructor(data: EntityState = null, isNew: boolean = true, readOnly: boolean = false, uuid: string = null)
	{
		super(data, isNew, readOnly, uuid);
	}

	protected initEntityMeta(): EntityMeta
	{
		return Registry.getInstance()
			.getMetaRegistry()
			.getEntity('Simple');
	}
}