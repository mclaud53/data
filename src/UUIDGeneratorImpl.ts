import ug = require('./UUIDGenerator');

export class UUIDGeneratorImpl implements ug.UUIDGenerator
{
	private static _sequence: number = 0;

	public uuid(name: string): string
	{
		return '_' + name + (++UUIDGeneratorImpl._sequence);
	}
}