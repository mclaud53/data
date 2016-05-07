import {FieldType} from '../FieldType';

export class BooleanFieldType extends FieldType<boolean>
{
	public constructor()
	{
		super('boolean');
	}
}