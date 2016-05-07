import {UUIDGenerator} from './UUIDGenerator';

export class UUIDGeneratorImpl implements UUIDGenerator
{
	private static _sequence: number = 0;

	public uuid(name: string): string
	{
		return '_' + name + (++UUIDGeneratorImpl._sequence);
	}
}