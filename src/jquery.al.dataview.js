(function($) {

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
			if (expectCount !== undefined) {
				self._expectCount = expectCount;
			}
			if ($.isArray(data)) {
				if ('_data' in self) {
					$.merge(self._data, data);
				} else {
					self._data = data;
				}
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










$.widget('al.olddataview', {
	
	options: {
		data: $.noop,
		sort: $.noop,
		grep: $.noop,
		chunk: null,
		display: null,
		total: null
	},
	
	_create: function() {
		var self = this;
		
		self.reload();
	},
	
	reload: function() {
		var self = this;
		
		self._data = [];
		$.extend(self.options, {
			display: null,
			total: null
		});
		self.more();
	},
	
	more: function() {
		var self = this;
		
		if (self.options.display !== null && self.options.display === self.options.total) {
			return;
		}
		
		if (self.options.chunk !== null) {
			self.options.display += self.options.chunk;
			if (typeof self.options.total === 'number' && self.options.total >= 0) {
				self.options.display = Math.min(self.options.display, self.options.total);
			}
		}
		
		// TODO: scenario that we are missing is when chunk = null, so display
		// hasn't been updated thus = _data.length, which results in missing = 0
		// and no _load call.
		var missing = self.options.display === null ? undefined : self.options.display - self._data.length,
			ready = function() {
				if (self.options.display === null) {
					self.options.display = self._data.length;
				}
				if (self.options.display === self.options.total) {
					self._trigger('nomore');
				}
				self.invalidate();
			};
		if (typeof missing !== 'number' || missing > 0) {
			self._load(ready, missing);
		} else {
			ready();
		}
	},
	
	_load: function(cb, count) {
		var self = this;
		
		self.options.data.call(self.element[0], function(data, total) {
			$.merge(self._data, data);
			self.options.total = Math.max(self._data.length, total || 0);
			cb();
		}, count, self._data[self._data.length - 1]);
	},
	
	invalidate: function() {
		var self = this,
			d = $.merge([], self._data);
		
		if (self.options.grep !== $.noop) {
			d = $.grep(d, self.options.grep);
		}
		if (self.options.sort !== $.noop) {
			d.sort(self.options.sort);
		}
		self.element.flirt(d.slice(0, self.options.display));
		self._trigger('invalidate');
	}
	
/*	
	invalidate: function() {
		var self = this;
		
		self.element.flirt(typeof self.options.chunkSize === 'number' ? self._data.slice(0, self.options.chunkSize * self.options.chunks) : self._data);
	},
	
	more: function() {
		var self = this,
			items = self.options.items,
			render = function(data, total) {
				$.merge(self._data, data);
				if (total !== undefined) {
					self.options.total = total;
				}
				if (self.options.total === undefined) {
					self.options.total = self._data.length;
				}
				self.invalidate();
				nomore();
			},
			nomore = function() {
				if (typeof self.options.chunkSize === 'number' && self.options.chunks * self.options.chunkSize >= self.options.total) {
					self._trigger('nomore');
				}
			};
		
		if (self.options.total === self._data.length) {	// we have all data
			if (self.options.chunks * self.options.chunkSize < self.options.total) {
				self.options.chunks++;
				self.invalidate();
				nomore();
			}
		} else {
			if ($.isFunction(self.options.data)) {
				if (self.options.total === undefined || self.options.total === null || typeof self.options.total === 'number' && self.options.total > self._data.length) {
					self.options.data.call(self.element[0], render, self._data[self._data.length - 1]);
				}
			} else {
				render(self.options.data, self.options.data.length);
			}
		}
	},
	
	_setOption: function(key, value) {
		$.Widget.prototype._setOption.apply(this, arguments);
		var self = this;
		
		if (key === 'data') {
			self._data = [];
			self.options.total = undefined;
			self.more();
		}
	}
*/
});

}(jQuery));
