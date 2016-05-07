import {EntityMeta} from '../src/meta/EntityMeta';
import {Entity, EntityState} from '../src/Entity';
import {SimpleEntityMeta} from './meta/SimpleEntityMeta';

export class SimpleEntity extends Entity
{
	private static _entityMeta: SimpleEntityMeta = null;

	public constructor(data: EntityState = null, isNew: boolean = true, readOnly: boolean = false, uuid: string = null)
	{
		super(data, isNew, readOnly, uuid);
	}

	protected initEntityMeta(): EntityMeta
	{
		if (null === SimpleEntity._entityMeta) {
			SimpleEntity._entityMeta = new SimpleEntityMeta();
		}
		return SimpleEntity._entityMeta;
	}
}