(function($, undefined) {

// TODO: What if a change in wrapped object occurs, but condition is not true,
// so change is pending, then wrapped object changes back to original value,
// then condition switches to true ==> no `valuechange` should ideally trigger
// I think... but I have the idea that currently this is not how it behaves.

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
			// TODO: how to know when we can call value.wrapped.valueOf() and when not??
			if (value.condition.valueOf()) return (value.wrapped === undefined || value.wrapped === null) ? value.wrapped : value.wrapped.valueOf();
		}];
	}
	
	// TODO: Remove `this.wraps` and `this.filter`.
	
});

}(this.jQuery));