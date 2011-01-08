(function($, undefined) {

// REQUIREMENTS:
// - Constructor interface similar to that of `Array`.
// - Does not pretend to protect internal array identity?
// - Definition encompasses both the identity of the items and the ordering of
//   the items.
// - Has a `size` concept, which can be set independently from the internal
//   array's length. Also accepts a parameter `'loaded'`.
// - Delegates all `valuechange` triggering to `$.al.Object`.
// - `valueOf` must support the `notify` parameter.
// - Should not require a certain type for its items (allow mixed type).
// `Record.Array`:
// - Should be able to detect when contained items are removed (from record
//   store).
// - Has CRUD methods.

$.al.Array = $.al.Object.subtype({
	
	name: 'jQuery.al.Array',
	
	args: function() {
		// The full list of arguments should be interpreted as one single
		// array value by the parent constructor.
		var value = _.toArray(arguments);
		
		// We follow (native) `Array`'s conventions; if one numeric argument
		// has been passed we create an empty array of that length. In our
		// case this means an empty array with an artificial size of that
		// length (which is done in the constructor). The argument must have a
		// value of the primitive numeric type; instances of `Number` do not
		// count.
		if (value.length === 1 && typeof value[0] === 'number') value = [];
		
		return [value];
	},
	
	construct: function() {
		
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			var args = _.toArray(arguments);
			if (args.length > 0) {
				// Make sure that we are always storing a value of type
				// `Array`, even though we are trying to accept array-like
				// values of a different type.
				args[0] = _.toArray(args[0]);
				// If the artificial size is superseded by the actual size,
				// the `size` variable no longer has a function.
				if (args[0].length >= size) size = undefined;
			}
			return _valueOf.apply(this, args);
		};
		
		// TODO: It should be possible to put this method on `proto`, iff it
		// is defined on `proto` in `$.al.Object` as well.
		this.valueEquals = function(v) {
			// TODO: `_.isEqual` performs a deep comparison, while all we need
			// here is a one-level deep comparison. So this can be optimized.
			return _.isEqual(this.valueOf(), v);
		};
		
		var size;
		this.size = function(s) {
			var l = this.valueOf().length;
			
			if (arguments.length === 0) return size === undefined ? l : size;
			
			// TODO: Should we prune internal array if specified size is
			// lower than current value's length?
			size = s > l ? s : undefined;
			
			return this;
		};
		
		// Complement of the corresponding line in `args` (see above).
		if (arguments.length === 1 && typeof arguments[0] === 'number') this.size(arguments[0]);
		
	}
	
});

}(this.jQuery));








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
		// TODO: Why can't we just use `valueOf` to replace the entire array?
		// We are using `array.splice(0, array.size(), 'newitem1', 'newitem2')`
		// all the time, which is exactly that.
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			// Never output the internal array, as it may be altered without us
			// being able to detect that and trigger a valuechange event.
			
			// TODO: There is a problem with returning a different value when
			// the value is not actually changed: it incorrectly results in
			// a change of value in case this object is wrapped.
			return _valueOf.call(this).slice();
		};
		
		// All mutator methods are defined in terms of `splice`, which is
		// therefore the only method that cannot be defined on the prototype
		// because it needs access to the internal (uncloned) array, which is
		// not (and should not be) possible from the outside.
		// TODO: I need a way of specifying `notify = false`.
		this.splice = function() {
			var array = _valueOf.call(this),
				from = array.slice(),
				size = array.length,
				result = Array.prototype.splice.apply(array, arguments);
	
			if (array.length !== size || result.length > 0) {
				// TODO: Can't we delegate this event trigger to `_valueOf`?
				$(this).trigger('valuechange', { from: from, to: array.slice() });
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
			// TODO: I think it's better to trigger a dedicated event for
			// size change, as triggering `valuechange` would mean that it is
			// inevitable that `valuechange` is triggered twice consecutively
			// as soon as we want to change both the value and the size of the
			// array at the same time (which is the case every time we want
			// to partially load an array, so it's not an edge case).
			// TODO: Also, we should probably put `$.al.VirtualArray`'s `size`
			// implementation here, as the relation between the two
			// implementations is problematic: `$.al.VirtualArray` delegates
			// to here if it thinks that the size change will mutate the
			// actual array value, but if the size change is accompanied with
			// a value change this may very well be an incorrect conclusion.
			// This is essentially the same problem as referred to in the
			// previous TODO: size change and value change together should be
			// capable of acting as one single operation.
			// if (change) {
			// 	$(this).trigger('valuechange', { to: array.slice() });
			// }
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

}/*(this.jQuery)*/);