export interface Filter<T>
{
	filter(value: T): T
}