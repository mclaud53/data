import {EntityMeta} from '../../src/meta/EntityMeta';
import {Field} from '../../src/meta/Field';
import {FieldTypeRegistry} from '../../src/meta/FieldTypeRegistry';
import {Registry} from '../../src/Registry';
import {SimpleEntity} from '../SimpleEntity';

export class SimpleEntityMeta extends EntityMeta
{
	public constructor()
	{
		var fieldTypeRegistry: FieldTypeRegistry = Registry.getInstance().getFieldTypeRegistry();
		
		super('Simple', SimpleEntity, 'id', [
			new Field<number>('id', fieldTypeRegistry.getByName<number>('integer'), 0),
			new Field<number>('value', fieldTypeRegistry.getByName<number>('float'), 0.0),
			new Field<boolean>('flag', fieldTypeRegistry.getByName<boolean>('boolean'), false),
			new Field<string>('title', fieldTypeRegistry.getByName<string>('string'), '')
		]);
	}
}