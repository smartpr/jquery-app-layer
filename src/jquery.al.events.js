(function($, undefined) {

$.events = {};

// TODO: Don't use `hold` but dynamically assign different functions to
// `$.event.trigger`.

var hold = false,
	pending = [];

$.events.hold = function() {
	hold = true;
};

$.events.release = function() {
	hold = false;
	
	var args, e;
	while (pending.length) {
		$.event.trigger.apply(undefined, pending.shift());
	}
};

var overridden = $.event.trigger;
$.event.trigger = function() {
	if (hold) pending.push(arguments);
	else return overridden.apply(undefined, arguments);
};

}(this.jQuery));