(function($, undefined) {

$.al.Boolean = $.al.Object.subtype({
	
	name: 'jQuery.al.Boolean',
	
	args: [],
	
	construct: function(v) {
		
		$(this).bind('valuechange', function() {
			var args = arguments;
			args[0] = this.valueOf() ? 'valuetrue' : 'valuefalse';
			$.fn.trigger.apply($(this), args);
		});
		
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			var args = _.toArray(arguments);
			if (args.length > 0) {
				// If a new value has been provided, make sure that is gets
				// passed on as a boolean.
				args[0] = !!args[0];
			}
			return _valueOf.apply(this, args);
		};
		
		// We want to distinguish between instantiation without a value and
		// instantiation with a falsy value, as we want to be able to be
		// certain to be notified of the first value change, regardless of its
		// value (either `true` or `false`).
		if (arguments.length > 0) {
			this.valueOf(v);
		}
	}
	
});

}(this.jQuery));