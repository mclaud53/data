import ug = require('./UUIDGenerator');
import ugi = require('./UUIDGeneratorImpl');

export class Registry
{
	private static _instance: Registry = null;

	public static getInstance(): Registry
	{
		if (null === Registry._instance) {
			Registry._instance = new Registry();
		}
		return Registry._instance;
	}

	public static setInstance(value: Registry): void
	{
		Registry._instance = value;
	}
	

	private _uuidGenerator: ug.UUIDGenerator = null;

	public getUUIDGenerator(): ug.UUIDGenerator
	{
		if (null === this._uuidGenerator) {
			this._uuidGenerator = new ugi.UUIDGeneratorImpl();
		}
		return this._uuidGenerator;
	}

	public setUUIDGenerator(value: ug.UUIDGenerator): Registry
	{
		this._uuidGenerator = value;
		return this;
	}
}