import {EntityMeta} from '../../src/meta/EntityMeta';
import {Field} from '../../src/meta/Field';
import {FieldTypeRegistry} from '../../src/meta/FieldTypeRegistry';
import {SimpleEntity} from '../SimpleEntity';

export class SimpleEntityMeta extends EntityMeta
{
	public constructor()
	{
		super('Simple', SimpleEntity, 'id', [
			new Field<number>('id', FieldTypeRegistry.getInstance().getByName<number>('integer'), 0),
			new Field<number>('value', FieldTypeRegistry.getInstance().getByName<number>('float'), 0.0),
			new Field<boolean>('flag', FieldTypeRegistry.getInstance().getByName<boolean>('boolean'), false),
			new Field<string>('title', FieldTypeRegistry.getInstance().getByName<string>('string'), '')
		]);
	}
}