import fed = require('frog-event-dispatcher');
export abstract class Base extends fed.EventDispatcher <fed.Event<Base>, Base>
{
	name: string;
	
}