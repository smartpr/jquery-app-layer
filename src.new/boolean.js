(function($, undefined) {

$.al.wrapper.Boolean = $.al.wrapper.Value.subtype({
	
	name: 'jQuery.al.wrapper.Boolean',
	
	args: [],
	
	construct: function(v) {
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			var args = _.toArray(arguments);
			if (args.length > 0) {
				// If a new value has been provided, make sure that it gets
				// passed on as a boolean.
				args[0] = !!args[0];
			}
			return _valueOf.apply(this, args);
		};
		
		var operands = [];
		this.and = function(and) {
			var self = this;
			
			var operand = $.al.wrapper.Boolean();
			
			$(operand).bind('change', function() {
				// console.log(self, " = AND: ", _.all(operands, function(operand) { return operand.valueOf(); }));
				self.valueOf(_.all(operands, function(operand) { return operand.valueOf(); }));
			});
			
			operands.push(operand);
			
			operand.valueOf(false);
			
			and.call(this, operand);
			
			return self;
			
		};
		
		if (arguments.length > 0) {
			this.valueOf(v, false);
		}
	}
	
});

$.property.Boolean = function(setup) {
	var property = $.component.property($.al.wrapper.Boolean);
	property.setup(setup);
	return property;
};

// $.property.Booleans = function(setup) {
// 	var property = $.component.property($.al.list.Booleans);
// 	property.setup(setup);
// 	return property;
// };

}(this.jQuery));