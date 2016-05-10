import {UUIDGenerator} from './UUIDGenerator';
import {UUIDGeneratorImpl} from './UUIDGeneratorImpl';
import {FieldTypeRegistry} from './meta/FieldTypeRegistry';
import {MetaRegistry} from './meta/MetaRegistry';

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

	private _fieldTypeRegistry: FieldTypeRegistry = null;

	private _metaRegistry: MetaRegistry = null;

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

	public getFieldTypeRegistry(): FieldTypeRegistry
	{
		if (null === this._fieldTypeRegistry) {
			this._fieldTypeRegistry = new FieldTypeRegistry();
		}
		return this._fieldTypeRegistry;
	}

	public setFieldTypeRegistry(value: FieldTypeRegistry): Registry
	{
		this._fieldTypeRegistry = value;
		return this;
	}

	public getMetaRegistry(): MetaRegistry
	{
		if (null === this._metaRegistry) {
			this._metaRegistry = new MetaRegistry();
		}
		return this._metaRegistry;
	}

	public setMetaRegistry(value: MetaRegistry): Registry
	{
		this._metaRegistry = value;
		return this;
	}
}