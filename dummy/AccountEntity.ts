import {Registry} from '../src/Registry';
import {EntityMeta} from '../src/meta/EntityMeta';
import {Entity} from '../src/Entity';

export class AccountEntity extends Entity
{
	protected initEntityMeta(): EntityMeta
	{
		return Registry.getInstance()
			.getMetaRegistry()
			.getEntity('Account');
	}
}