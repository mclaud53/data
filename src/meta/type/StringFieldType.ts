import {FieldType} from '../FieldType';

export class StringFieldType extends FieldType<number>
{
	public constructor()
	{
		super('string');
	}
}