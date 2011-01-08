(function($, undefined) {

$.al.Dict = $.al.Object.subtype({
	
	name: 'jQuery.al.Dict',
	
	args: function() {
		// We need to put this inside a function, because otherwise every
		// instance of `$.al.Dict` would be working on the same internal plain
		// object.
		return [{}];
	},
	
	construct: function(obj) {
		obj = obj || {};
		
		var _valueOf = this.valueOf;
		this.valueOf = function(key, value) {
			var obj = _valueOf.call(this);
			
			// TODO: This is the scenario in which an entire set of items is
			// replaced at once. We can probably implement this in a neater
			// and tighter way:
			// - `onItemChange` should be called once instead of once for
			//   every item.
			// - Use object creator as in:
			//   (http://github.com/documentcloud/underscore/issues/90).
			if (arguments.length === 1 && typeof key !== 'string') {
				var newObj = {};
				$.each(obj, function(key) {
					newObj[key] = undefined;
				});
				$.extend(newObj, key);
				
				var self = this;
				$.each(newObj, function(key, value) {
					self.valueOf(key, value);
				});
				
				return this;
			}
			
			if (arguments.length === 0) return obj;
			key = key + '';
			if (arguments.length === 1) return obj[key];
			
			if (obj[key] instanceof Object) $([obj[key]]).unbind('valuechange', onItemChange);
			
			if (value === undefined) delete obj[key]
			else obj[key] = value;
			onItemChange.call(this);
			
			// TODO: Do we really need this type to be two-way compatible with
			// `jquery-datalink`?
			// $(this).triggerHandler('changeData!', [key, value]);
			
			if (obj[key] instanceof Object) $([obj[key]]).bind('valuechange', $.proxy(onItemChange, this));
			
			return this;
		};
		
		var onItemChange = function() {
			// The current internal plain object is cloned to allow both
			// `_valueOf` and externals such as `$.al.Wrapper` to detect the
			// value change.
			_valueOf.call(this, _.clone(_valueOf.call(this)));
		};
		
		var rescue;
		$(this).bind({
			getData: function(e, key) {
				return this.valueOf(key);
			},
			setData: function(e, key) {
				rescue = key in this ? this[key] : undefined;
			},
			changeData: function(e, key, value) {
				if (rescue === undefined) delete this[key]
				else this[key] = rescue;
				rescue = undefined;
				this.valueOf(key, value);
			}
		});
		
		var self = this;
		$.each(obj, function(key, value) {
			self.valueOf(key, value);
		});
		
	},
	
	proto: {
		
		clear: function() {
			var self = this;
			
			$.each(self.valueOf(), function(key, value) {
				self.valueOf(key, undefined);
			});
			
			return self;
		},
		
		destroy: function() {
			this.clear();
			
			return this;
		}
		
	}
	
});

}(this.jQuery));