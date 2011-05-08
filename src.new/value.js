(function($, undefined) {

$.al.wrapper.Value = $.al.type.Object.subtype({
	
	name: 'jQuery.al.wrapper.Value',
	
	// We want this type to take care of setting its own initial value so that
	// the event handlers that are bound in the constructor will have effect
	// on it.
	args: [],
	
	construct: function(v) {
		var self = this;
		
		var deepchange = function(e) {
			return $(this).triggerHandler(e.type.replace('change', 'deepchange'), [this.valueOf()]);
		};
		var destroy = function() {
			if (self.valueEquals(this)) self.valueOf(undefined);
		};
		
		$(this).
			bind('change:before change:fail change:done change', deepchange).
			bind('change:done', function(e, to, from) {
				$(from instanceof Object ? [from] : []).
					unbind('change:before change:fail change:done change', deepchange).
					unbind('destroy', destroy);
				$(to instanceof Object ? [to] : []).
					bind('change:before change:fail change:done change', $.proxy(deepchange, this)).
					bind('destroy', destroy);
			});
		
		this.valueOf(v, false);
		
	},
	
	proto: {
		
		// TODO: Move up in class chain
		invalidate: function() {
			// TODO: include :before etc? See destroy on base type.
			
			$(this).triggerHandler('invalidate');
			return this;
		}
		
	}
	
});

$.al.list.Value = $.al.type.Object.subtype({
	
	name: 'jQuery.al.list.Value',
	
	args: function() {
		// The full list of arguments should be interpreted as one single
		// array value by the parent constructor.
		return [_.toArray(arguments)];
	},
	
	construct: function() {
		
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			var args = _.toArray(arguments);
			
			if (args.length > 0) {
				// A list should hold an array at all times.
				args[0] = _.toArray(args[0]);
			}
			
			return _valueOf.apply(this, args);
		};
		
		var size;
		this.size = function(s) {
			var l = this.valueOf().length;
			
			if (arguments.length === 0) return size === undefined ? l : size;
			
			// TODO: Should we prune internal array if specified size is
			// lower than current value's length?
			size = (s === null || s > l) ? s : undefined;
			
			return this;
		};
		
		var self = this;
		var deepchange = function(e) {
			return $(this).triggerHandler(e.type.replace('change', 'deepchange'), [this.valueOf()]);
		};
		// TODO: If an item is removed from this list because it was destroyed,
		// which in turn is the result of it being deleted, I think we can
		// safely conclude that we need to adjust this.size (?!?)
		var destroy = function() {
			// console.log("list.Value: destroy notification, remove ", this, " from list");
			self.valueOf(_.without(self.valueOf(), this));
			// _valueOf.apply(self, _.without(self.valueOf(), this));
		};
		
		$(this).
			bind('change:before change:fail change:done change', deepchange).
			bind('change:done', function(e, to, from) {
				$(_.select(from, function(item) { return item instanceof Object; })).
					unbind('change:before change:fail change:done change', deepchange).
					unbind('destroy', destroy);
				$(_.select(to, function(item) { return item instanceof Object; })).
					bind('change:before change:fail change:done change', $.proxy(deepchange, this)).
					one('destroy', destroy);	// I think `bind` should be fine here too.
			});
		
	},
	
	proto: {
		
		invalidate: function() {
			// TODO: include :before etc? See destroy on base type.
			
			$(this).triggerHandler('invalidate');
			return this;
		},
		
		valueEquals: function(v) {
			// TODO: `_.isEqual` performs a deep comparison, while all we need
			// here is a one-level deep comparison. So this can be optimized.
			return _.isEqual(this.valueOf(), v);
		},
		
		// TODO: size, should always be used to get length of a list, can be
		// used to construct virtual data sets. ==> implemented on instance,
		// so remove this one.
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
		}
		
	}
	
});

$.property.Value = function(setup) {
	var property = $.component.property($.al.wrapper.Value);
	if (setup) property.setup(setup);
	return property;
};

$.property.Values = function(setup) {
	var property = $.component.property($.al.list.Value);
	if (setup) property.setup(setup);
	return property;
};

}(this.jQuery));