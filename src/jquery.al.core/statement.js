(function($, undefined) {

$.al.Statement = $.al.Wrapper.subtype({
	
	name: 'jQuery.al.Statement',
	
	construct: function() {
		
		var _wraps = this.wraps;
		delete this.wraps;
		delete this.filter;
		
		this.operand = function(setup) {
			var operand = $.al.Boolean(false),
				operands = _wraps.call(this).valueOf();
			
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

$.al.Conjunction = $.al.Statement.subtype({
	
	name: 'jQuery.al.Conjunction',
	
	args: [$.al.Composite([]), function(operands) {
		return operands.length === 0 ? undefined :
			_.all(operands, function(operand) { return operand.valueOf(); });
	}]
	
});

$.al.Disjunction = $.al.Statement.subtype({
	
	name: 'jQuery.al.Disjunction',
	
	args: [$.al.Composite([]), function(operands) {
		return operands.length === 0 ? undefined :
			_.any(operands, function(operand) { return operand.valueOf(); });
	}]
	
});

}(this.jQuery));