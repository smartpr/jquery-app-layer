(function($, undefined) {

$.al.wrapper.Dict = $.al.wrapper.Value.subtype({
	
	name: 'jQuery.al.wrapper.Dict',
	
	args: [],
	
	// TODO: Why doesn't this work??
	// args: function() {
	// 	if (arguments.length === 0) {
	// 		return [{}];
	// 	}
	// 	return arguments;
	// },
	
	construct: function(v) {
		if (arguments.length === 0) v = {};
		
		var _valueOf = this.valueOf;
		this.valueOf = function(key, fallback) {
			if (typeof key === 'string') {
				var value = $.getObject(key, this.valueOf());
				return value === undefined ? fallback : value;
			}
			// TODO: Filter out jQuery**** property
			return _valueOf.apply(this, arguments);
		}
		
		this.valueOf(v, false);
	},
	
	proto: {
		
		observable: function() {
			var args = arguments;
			
			// TODO: Use list type if this.valueOf returns array?
			//    or make it an optional parameter which type should be used
			var observable = $.al.type.Object(this.valueOf.apply(this, args));
			
			// TODO: Think about if we introduce a memory-leak risk here, and
			// if so how to deal with it.
			
			$(this).bind('change', function() {
				observable.valueOf(this.valueOf.apply(this, args));
			});
			
			return observable;
			
		},
		
		valueEquals: function(v) {
			
			// TODO: This one is very delicate -- there's many edge cases in
			// which it is not obvious what the return value should be.
			// Example: this.valueOf() == {id: 1, name: "tim"}
			//          v == {name: "tim"}
			//     ==> should this resolve to equality? and the other way around?
			//         and then; when do we
			//         want to overwrite the current value with the new value?
			//         only when !valueEquals()? or simply always?
			
			var a = this.valueOf(),
				b = v;
			
			if (_.isArray(a) && _.isArray(b) && a.length !== b.length) {
				return false;
			}
			
			a = _.reduce(a, function(memo, value, key) {
				if (key.substr(0, 6) !== 'jQuery') {
					memo[key] = value;
				}
				return memo;
			}, {});
			b = _.reduce(b, function(memo, value, key) {
				if (key.substr(0, 6) !== 'jQuery') memo[key] = value;
				return memo;
			}, {});
			if (!_.isEqual(a, b)) {
				// console.log('not equal!', JSON.stringify(a), JSON.stringify(b));
				return false;
			}
			// console.log('equal!', JSON.stringify(a), JSON.stringify(b));
			return true;
		}
		
		// valueEquals: function(v) {
		// 	// console.log('valueEquals: ', this.valueOf('emails'), v.emails, _.isEqual(this.valueOf('emails'), v.emails));
		// 	return _.isEqual((this.valueOf() || { emails: 1 }).emails, (v || { emails: 2 }).emails);
		// }
		
	}
	
});

$.property.Dict = function(setup) {
	var property = $.component.property($.al.wrapper.Dict);
	property.setup(setup);
	return property;
};

}(this.jQuery));