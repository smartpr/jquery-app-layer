(function($, undefined) {

$.al.Statement = $.al.Wrapper.subtype({
	
	name: 'jQuery.al.Statement',
	
	construct: function() {
		
		var _wraps = this.wraps;
		delete this.wraps;
		delete this.filter;
		
		this.operand = function(setup) {
			var operand = $.al.Boolean(false),
				operands = _.clone(_wraps.call(this).valueOf());
				// TODO: The clone above is fix the following BUG. Test case:
				// Understand why!
				/*
				o = $.al.Object(false); c = $.al.Conjunction().operand(function(operand) { operand.valueOf(true); }).operand(function(operand) { $(o).bind('valuechange', function() { operand.valueOf(this.valueOf()); }); });$(c).bind('valuechange', function() { console.log(this.valueOf()); });
				*/
			
			// Setup before assigning updated collection of operands, as
			// setting new `wraps` will trigger value re-evaluation already.
			setup.call(this, operand);
			operands.push(operand);
			
			// TODO: destroy current composite.
			_wraps.call(this).destroy();
			_wraps.call(this, $.al.Composite(operands));
			
			return this;
		};
		
	}
	
	// TODO: Remove `this.wraps` and `this.filter`.
	
});

// TODO: Subtypes below could be a bit DRYer.

$.al.And = $.al.Statement.subtype({
	
	name: 'jQuery.al.And',
	
	args: [$.al.Composite([]), function(operands) {
		return operands.length === 0 ? undefined :
			_.all(operands, function(operand) { return operand.valueOf(); });
	}]
	
});

$.al.Or = $.al.Statement.subtype({
	
	name: 'jQuery.al.Or',
	
	args: [$.al.Composite([]), function(operands) {
		return operands.length === 0 ? undefined :
			_.any(operands, function(operand) { return operand.valueOf(); });
	}]
	
});

}(this.jQuery));