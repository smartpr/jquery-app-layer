(function($, undefined) {

$.al.Object = $.al.subtype({
	
	name: 'jQuery.al.Object',
	
	construct: function(v) {
		var value;
		this.valueOf = function(v, notify) {
			if (arguments.length === 0) {
				return value;
			}
		
			var change = value !== v;
			value = v;
			if (notify === true || change && notify !== false) {
				$(this).trigger('valuechange', { to: value });
			}
			return this;
		};
		
		// Don't bother to notify `valuechange` upon object instantiation, as
		// nobody has had the chance to bind an actual handler yet. Not even
		// an imaginary subtype of `$.al.Object`, as its constructor is
		// executed after this one.
		this.valueOf(v, false);
	},
	
	proto: {
		
		toString: function() {
			// We must not omit `.valueOf()` as it would result in an infinite
			// loop.
			return this.valueOf() + '';
		}
		
	}
});

}(this.jQuery));