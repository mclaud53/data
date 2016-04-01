import fed = require('frog-event-dispatcher');
export abstract class Base extends fed.EventDispatcher <fed.Event<Base>, Base>
{
	name: string;
	readOnly: boolean;

	dirty: boolean;
	abstract clear(): boolean;
	abstract flush(): void;
	abstract revert(): boolean;

}