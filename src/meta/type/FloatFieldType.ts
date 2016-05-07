import {FieldType} from '../FieldType';

export class FloatFieldType extends FieldType<number>
{
	public constructor()
	{
		super('float');
	}
}