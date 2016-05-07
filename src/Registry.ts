import {UUIDGenerator} from './UUIDGenerator';
import {UUIDGeneratorImpl} from './UUIDGeneratorImpl';

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
	

	private _uuidGenerator: UUIDGenerator = null;

	public getUUIDGenerator(): UUIDGenerator
	{
		if (null === this._uuidGenerator) {
			this._uuidGenerator = new UUIDGeneratorImpl();
		}
		return this._uuidGenerator;
	}

	public setUUIDGenerator(value: UUIDGenerator): Registry
	{
		this._uuidGenerator = value;
		return this;
	}
}