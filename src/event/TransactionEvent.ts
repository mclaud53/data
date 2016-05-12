import {Event, EventType} from 'frog-event-dispatcher';
import {Transaction} from '../Transaction';

export class TransactionEvent extends Event<Transaction>
{
	public static get BEGIN(): string
	{
		return 'transactionBegin'
	}

	public static get COMMIT(): string
	{
		return 'transactionCommit';
	}

	public static get ROLLBACK(): string
	{
		return 'transactionRollback';
	}
}