(function($, undefined) {

$.al.Conditional = $.al.Wrapper.subtype({
	
	name: 'jQuery.al.Conditional',
	
	args: function(wrapped, condition) {
		// `undefined` condition is interpreted as "no condition".
		if (condition === undefined) condition = true;
		if (!(condition instanceof Object)) condition = new Boolean(condition);
		
		return [$.al.Composite({
			wrapped: wrapped,
			condition: condition
		}), function(value) {
			if (value.condition.valueOf()) return value.wrapped.valueOf();
		}];
	}
	
	// TODO: Remove `this.wraps` and `this.filter`.
	
});

}(this.jQuery));