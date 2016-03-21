export interface Validate<T>
{
	isValid(value: T): boolean;
	getErrors(): string[];
}