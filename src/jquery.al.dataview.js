(function($) {

// Finds out if two data collections contain the same items (as defined by
// keyProperty) in the same order.
var isIdenticalData = function(d1, d2, keyProperty) {
	if (keyProperty === null || !$.isArray(d1) || !$.isArray(d2) || d1.length !== d2.length) {
		return false;
	}
	for (var i = 0, l = d1.length; i < l; i++) {
		if (d1[i][keyProperty] !== d2[i][keyProperty]) {
			return false;
		}
	}
	return true;
};

$.widget('al.dataview', {
	
	options: {
		data: null,
		sort: null,
		grep: null,
		threshold: null,
		key: null
	},
	
	_create: function() {
		var self = this;
		
		self.reload();
	},
	
	_setOption: function(key, value) {
		$.Widget.prototype._setOption.apply(this, arguments);
		var self = this;
		
		if (key === 'data') {
			self.reload();
		} else {
			self.invalidate();
		}
	},
	
	reload: function(cb) {
		var self = this;
		
		delete self._data;
		self._expectCount = null;
		self.load(cb);
	},
	
	load: function(cb) {
		var self = this;
		cb = cb || $.noop;
		
		if (self.options.data === null || self._expectCount !== null && self.loadedCount() >= self._expectCount) {
			cb();
			return false;
		}
		
		self.options.data.call(self.element[0], function(data, expectCount) {
			
			// Prevent a scenario in which the raw data store is flooded with
			// identical copies that have no effect on the set of clean data,
			// and would therefore very likely go unnoticed. This could happen
			// if load is (accidently) called superfluously.
			if (isIdenticalData(self._data, data, self.options.key)) {
				cb();
				return;
			}
			
			if (expectCount !== undefined) {
				self._expectCount = expectCount;
			}
			
			if ($.isArray(data)) {
				if ('_data' in self) {
					// Append data without modifying the existing object (as it
					// may be used outside this widget as well).
					data = $.merge($.merge([], self._data), data);
				}
				self._data = data;
			}
			
			self.invalidate();
			cb();
			
		}, '_data' in self ? self._data[self._data.length - 1] : undefined);
		return true;
	},
	
	invalidate: function() {
		var self = this;
		
		self.element.flirt(self._displayData());
	},
	
	threshold: function(threshold) {
		var self = this;
		
		if (threshold !== undefined) {
			self.option('threshold', threshold);
		}
		
		return self.options.threshold;
	},
	
	moveThreshold: function(move) {
		var self = this;
		
		self.threshold(Math.max((self.threshold() === null ? 0 : self.threshold()) + move, 0));
	},
	
	displayCount: function() {
		var self = this;
		
		return self._displayData().length;
	},
	
	loadedCount: function() {
		var self = this;
		
		return self._cleanData().length;
	},
	
	totalCount: function() {
		var self = this;
		
		return self._expectCount !== null ? self._expectCount : self.loadedCount();
	},
	
	greppedCount: function() {
		var self = this;
		
		return self._filteredData('grep').length;
	},
	
	_cleanData: function() {
		var self = this,
			data = self._data || [],
			clean = [],
			keyProperty = self.options.key,
			key,
			keys = [];
		
		if (keyProperty === null) {
			return data;
		}
		
		for (var i = 0, l = data.length; i < l; i++) {
			key = data[i][keyProperty];
			if ($.inArray(key, keys) === -1) {
				keys.push(key);
				clean.push(data[i]);
			}
		}
		return clean;
	},
	
	_filteredData: function() {
		var self = this,
			data = $.merge([], self._cleanData()),
			doGrep = (arguments.length === 0 || $.inArray('grep', arguments) !== -1) && $.isFunction(self.options.grep),
			doSort = (arguments.length === 0 || $.inArray('sort', arguments) !== -1) && $.isFunction(self.options.sort);
		
		if (doGrep) {
			data = $.grep(data, self.options.grep);
		}
		if (doSort) {
			data.sort(self.options.sort);
		}
		
		return data;
	},
	
	_displayData: function() {
		var self = this,
			data = $.merge([], self._filteredData());
		
		if (self.threshold() !== null) {
			data = data.slice(0, self.threshold());
		}
		
		return data;
	}
	
});

}(jQuery));
