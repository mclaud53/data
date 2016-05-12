/// <reference path="../typings/main.d.ts" />
import {EventDispatcher, Event} from 'frog-event-dispatcher';
import {Registry} from './Registry';
import {TransactionEvent} from './event/TransactionEvent';

export class Transaction extends EventDispatcher<Event<any>, any>
{

	private _uuid: string;
	private _finished: boolean = false;
	private _success: boolean;

	public constructor(uuid: string = null)
	{
		super();

		if (null === uuid) {
			uuid = Registry.getInstance()
				.getUUIDGenerator()
				.uuid('$transaction');
		}

		this._uuid = uuid;
	}

	public get uuid(): string
	{
		return this._uuid;
	}

	public isFinished(): boolean
	{
		return this._finished;
	}

	public isSuccess(): boolean
	{
		if (!this.isFinished()) {
			throw new Error('Only finished transaction may has state');
		}
		return this._success;
	}

	public commit(options: Object = {}): Transaction
	{
		var event: TransactionEvent;

		if (this.isFinished()) {
			throw new Error('Can\'t commit transaction! Transaction already finished.');
		}

		this._finished = true;
		this._success = true;

		if (this.willDispatch(TransactionEvent.COMMIT)) {
			event = new TransactionEvent(TransactionEvent.COMMIT, this, false, options);
			this.dispatch(event);
		}

		return this;
	}

	public rollback(options: Object = {}): Transaction
	{
		var event: TransactionEvent;

		if (this.isFinished()) {
			throw new Error('Can\'t commit transaction! Transaction already finished.');
		}

		this._finished = true;
		this._success = false;

		if (this.willDispatch(TransactionEvent.ROLLBACK)) {
			event = new TransactionEvent(TransactionEvent.ROLLBACK, this, false, options);
			this.dispatch(event);
		}

		return this;
	}
}