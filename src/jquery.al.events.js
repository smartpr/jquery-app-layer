// TODO:
// I'm afraid that this 'hack' is structurally problematic. We leave it for
// now because there is no obvious alternative for making it possible to setup
// multiple components simultaneously without having ordering problems (one
// component triggering an event that another component has not yet bound).
// There are edges where this solution will break things or at least result in
// unexpected behavior:
// * handlers bound to :before events will only be handled *after* the fact,
//   which also means they lose they cancelling capabilities;
// * two consecutive change events on the same object will have the effect
//   that the first execution of a corresponding handler will report a change
//   that has already been outdated by another change:
//   `to` !== `this.valueOf()`.

(function($, undefined) {

$.events = {};

// TODO: Don't use `hold` but dynamically assign different functions to
// `$.event.trigger`.

var hold = false,
	pending = [];

$.events.hold = function() {
	// console.log("HOLD");
	hold = true;
};

$.events.release = function() {
	// console.log("RELEASE: start");
	var args, e, i = 0;
	while (pending.length || i++ > 100) {
		var pl = pending.length;
		var p = pending.shift();
		// console.log('releases pending:', pending.length);
		// console.log('shift from pending: ', pl, ' to ', pending.length);
		overridden.apply(undefined, p);
	}
	// console.log("RELEASE: end");
	hold = false;
};

var overridden = $.event.trigger;
$.event.trigger = function() {
	if (hold) {
		var pl = pending.length;
		pending.push(arguments);
		// console.log('push to pending: ', pl, ' to ', pending.length);
	}
	else return overridden.apply(undefined, arguments);
};

$.fn.triggerSandwich = function(type, action) {
	var args = _.rest(arguments, 2);
	
	return this.each(function() {
		var $this = $(this);
		
		$.Deferred(function() {
			
			return $this.triggerHandler(type + ':before', args) === false ?
				this.reject() :
				// TODO: Attach meaning to return value?
				action.call($this[0], this.resolve, this.reject);
			
		}).done(function() {
			$this.triggerHandler(type + ':done', arguments);
			$this.triggerHandler(type, arguments);
		}).fail(function() {
			$this.triggerHandler(type + ':fail', arguments);
		});
	});
};

}(this.jQuery));