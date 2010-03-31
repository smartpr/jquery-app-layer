(function($) {

$.widget('al.listview', {
	
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
	
	// If we are certain that we have all data this method does nothing and
	// returns false. In all other cases it will attempt to load more data and
	// returns true, regardless of the result.
	// TODO: Introduce a 'replace' argument, whose default corresponds with
	// options.key being null or not.
	load: function(data, cb) {
		var self = this;
		if ($.isFunction(data)) {
			cb = data;
			data = undefined;
		}
		data = data === undefined ? self.options.data : data;
		cb = cb || $.noop;
		
		if (self._expectCount !== null && self.loadedCount() >= self._expectCount) {
			cb();
			return false;
		}
		
		if ($.isFunction(data)) {
		
			data.call(self.element[0], function(data, expectCount) {
			
				// Prevent a scenario in which the raw data store is flooded
				// with identical copies that have no effect on the set of clean
				// data, and would therefore very likely go unnoticed. This
				// could happen if load is (accidently) called superfluously.
				if (self._isIdenticalToRawData(data)) {
					cb();
					return;
				}
			
				if (expectCount !== undefined) {
					self._expectCount = expectCount;
				}
			
				self._append(data);
				cb();
			
			}, '_data' in self ? self._data[self._data.length - 1] : undefined);
			
		} else {
			
			self._append(data);
			cb();
			
		}
		
		return true;
	},
	
	_append: function(data) {
		var self = this;
		
		if (!$.isArray(data) || data.length === 0) {
			return;
		}
		
		if ('_data' in self) {
			// Append data without modifying the existing object (as it may be
			// used outside of this widget as well).
			data = $.merge($.merge([], self._data), data);
		}
		self._data = data;
		
		self.invalidate();
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
			// Only way for data not to be clean is if it has a key value and
			// this value has been seen before.
			if (keyProperty in data[i] && $.inArray(key, keys) !== -1) {
				continue;
			}
			keys.push(key);
			clean.push(data[i]);
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
	},
	
	// Finds out if the supplied data collection contains the same items
	// (identity as defined by options.key) in the same order as the raw data
	// that has already been loaded.
	_isIdenticalToRawData: function(data) {
		var self = this,
			keyProperty = self.options.key;
		
		if (keyProperty === null || !$.isArray(self._data) || !$.isArray(data) || self._data.length !== data.length) {
			return false;
		}
		for (var i = 0, l = self._data.length; i < l; i++) {
			if (self._data[i][keyProperty] !== data[i][keyProperty]) {
				return false;
			}
		}
		return true;
	}
	
});

}(jQuery));
