import {FieldType} from '../FieldType';

export class IntegerFieldType extends FieldType<number>
{
	public constructor()
	{
		super('integer');
	}
}