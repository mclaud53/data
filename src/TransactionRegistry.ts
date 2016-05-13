import {Transaction} from './Transaction';
import {TransactionEvent} from './event/TransactionEvent';

export class TransactionRegistry
{
	private _uuid2Transaction: {
		[key: string]: Transaction;
	} = {};

	public createTransaction(uuid: string = null): Transaction
	{
		var ret: Transaction = new Transaction(uuid);
		ret.addListener(this.onTransactionFinished, this, [TransactionEvent.COMMIT, TransactionEvent.ROLLBACK]);
		this._uuid2Transaction[ret.uuid] = ret;
		return ret;
	}

	public getByUUID(uuid: string): Transaction
	{
		return this._uuid2Transaction.hasOwnProperty(uuid) ? this._uuid2Transaction[uuid] : this.createTransaction(uuid);
	}

	private onTransactionFinished(e: TransactionEvent): void
	{
		e.target.removeListener(this.onTransactionFinished, this);
		delete this._uuid2Transaction[e.target.uuid];
	}
}