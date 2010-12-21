(function($, undefined) {

$.al.Array = $.al.Object.subtype({
	
	name: 'jQuery.al.Array',
	
	args: function(length) {
		// If one numeric argument has been passed we follow Array's
		// interpretation and create an empty array of that length.
		if (arguments.length === 1 && _.isNumber(length)) {
			return [new Array(length)];
		}
		// The full list of arguments should be stored by the parent constructor
		// as one array value.
		// TODO: Do we really need to do the `_.toArray()` here?
		return [_.toArray(arguments)];
	},
	
	construct: function() {
		// We want $.al.Array to represent array identity, like Array, so do not
		// allow setting another array instance.
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			// Never output the internal array, as it may be altered without us
			// being able to detect that and trigger a valuechange event.
			return _valueOf.call(this).slice();
		};
		
		// All mutator methods are defined in terms of `splice`, which is
		// therefore the only method that cannot be defined on the prototype
		// because it needs access to the internal (uncloned) array, which is
		// not (and should not be) possible from the outside.
		this.splice = function() {
			var array = _valueOf.call(this),
				size = array.length,
				result = Array.prototype.splice.apply(array, arguments);
	
			if (array.length !== size || result.length > 0) {
				$(this).trigger('valuechange', { to: array.slice() });
			}
	
			return result;
		};
	},
	
	proto: {
		
		// TODO: Implement all other [JavaScript 1.5 Array mutator methods](
		// https://developer.mozilla.org/en/JavaScript/Reference/
		// Global_Objects/Array#Methods_2).
		
		push: function() {
			this.splice.apply(this, $.merge([this.valueOf().length, 0], arguments));
			
			return this.valueOf().length;
		},
		
		size: function(s) {
			var array = this.valueOf();
			if (arguments.length === 0) {
				return array.length;
			}
			var change = array.length !== s;
			this.valueOf().length = s;
			if (change) {
				$(this).trigger('valuechange', { to: array.slice() });
			}
			return this;
		},
		
		// TODO: Get rid of this `each` concept, as it seems to have no use case.
		each: function(cb) {
			var array = this.valueOf();
			for (var i = 0, l = array.length; i < l; i++) {
				// TODO: Handle return values (false = break, non-false = continue)
				cb.call(array[i], i, array[i]);
			}
			return this;
		}
		
	}
	
});

}(this.jQuery));