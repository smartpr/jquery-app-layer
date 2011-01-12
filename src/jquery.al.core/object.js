(function($, undefined) {

$.al.Object = $.al.subtype({
	
	name: 'jQuery.al.Object',
	
	construct: function(v) {
		
		var value;
		this.valueOf = function(v, notify) {
			if (arguments.length === 0) return value;
			
			var from = value;
			value = v;
			if (notify === true || !this.valueEquals(from) && notify !== false) {
				// TODO: Use `triggerHandler`?
				$(this).trigger('valuechange', { from: from, to: value });
			}
			return this;
		};
		
		// TODO: Why can't we use `.valueOf()` instead of `value`, so we can
		// define this method on `proto`? Things go wrong if we do that, but
		// I don't really understand why.
		this.valueEquals = function(v) {
			return value === v;
		};
		
		// Don't bother to notify `valuechange` upon object instantiation, as
		// nobody has had the chance to bind an actual handler yet. Not even
		// an imaginary subtype of `$.al.Object`, as its constructor is
		// executed after this one.
		this.valueOf(v, false);
	},
	
	proto: {
		
		destroy: function() {
			$(this).triggerHandler('destroy');
			return this;
		},
		
		equals: function(other) {
			return this === other;
		},
		
		toString: function() {
			// We must not omit `.valueOf()` as it would result in an infinite
			// loop.
			return this.valueOf() + '';
		}
		
	}
});

}(this.jQuery));