import {EntityMeta} from '../../src/meta/EntityMeta';
import {Field} from '../../src/meta/Field';
import {FieldTypeRegistry} from '../../src/meta/FieldTypeRegistry';
import {Registry} from '../../src/Registry';
import {SimpleEntity} from '../SimpleEntity';

export class SimpleEntityMeta extends EntityMeta
{
	public constructor()
	{
		super('Simple', SimpleEntity, 'id', [
			new Field<number>('id', 'integer', 0),
			new Field<number>('value', 'float', 0.0),
			new Field<boolean>('flag', 'boolean', false),
			new Field<string>('title', 'string', '')
		]);
	}
}