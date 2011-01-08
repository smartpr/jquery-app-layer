(function($, undefined) {

$.fn.selection = function(opts) {
	// TODO: Iterate over elements in `this`.
	var $this = this;
	
	opts = $.extend({}, opts);
	
	var selection = $.al.Selection();
	// TODO: Checking if `opts.selection` is an array should not be required
	// in order to prevent errors (as is currently the case). `$.al.selection`
	// should simply not be called with a non-array `opts.selection`.
	if (opts.selection instanceof $.al.Array) {
		$([selection]).bind('valuechange', function() {
			opts.selection.valueOf(this.valueOf());
		});
		selection.change(opts.selection.valueOf());
	}
	
	// See if we can obtain settings from `dataview`.
	// TODO: This logic is incorrect, as it ignores the fact that there can be
	// several data views active within the current context. That's the reason
	// we have `$.fn.selection` accept a `template` option to begin with. But
	// we don't make this distinction when we simply use a filter like
	// `:dataview-item`.
	if ($.fn.dataview && $this.dataview('template', opts.template)) {
		if (!opts.elements) {
			// TODO: Change `:data(dataview.item)` to something like
			// `:dataview-item`.
			opts.elements = ':data(dataview.item)';
		}
		if (!opts.data) {
			opts.data = function() {
				var $this = $(this),
					data = $this.data('selection');
				// TODO: We should provide `opts.template` to
				// `.dataview('get')`. See also discussion above.
				if (data === undefined) data = $this.dataview('get');
				return data;
			};
		}
	}
	
	if (!opts.data) {
		opts.data = function() {
			return $(this).data('selection');
		};
	}
	
	var select = opts.select;
	opts.select = function() {
		var preventDefault = select === false || $.isFunction(select) && select.call(this) === false;
		if (!preventDefault) this.toggleSwitch('select', true);
	};
	var unselect = opts.unselect;
	opts.unselect = function() {
		var preventDefault = unselect === false || $.isFunction(unselect) && unselect.call(this) === false;
		if (!preventDefault) this.toggleSwitch('select', false);
	};
	
	// TODO: Move from `select` and `unselect` to `invalidate`?
	
	$this.bind('invalidate', function(e) {
		opts[selection.contains(opts.data.call(e.target)) ? 'select' : 'unselect'].call($(e.target));
	});
	
	var invalidate = function() {
		var invalidate = {
			select: [],
			unselect: []
		};
		
		$this.find(opts.elements).each(function() {
			invalidate[selection.contains(opts.data.call(this)) ? 'select' : 'unselect'].push(this);
		});
		
		if (invalidate.select.length > 0) {
			opts.select.call($(invalidate.select));
		}
		if (invalidate.unselect.length > 0) {
			opts.unselect.call($(invalidate.unselect));
		}
	};
	
	$([selection]).bind('valuechange', invalidate);
	
	invalidate();
	
	$.each(opts.changeOn || {}, function(eventType, target) {
		$this.delegate([opts.elements, target].join(' '), eventType, function() {
			selection.change(opts.data.call(this));
		});
	});
	$.each(opts.toggleOn || {}, function(eventType, target) {
		$this.delegate([opts.elements, target].join(' '), eventType, function() {
			selection.toggle(opts.data.call(this));
		});
	});

	if (opts.selection instanceof $.al.Array) {
		$([opts.selection]).bind('valuechange', function() {
			selection.change(this.valueOf());
		});
	}
	
	return this;
};

$.al.Selection = $.al.Object.subtype({
	
	name: 'jQuery.al.Selection',
	
	args: function() {
		var set = new HashSet();
		set.addAll(arguments);
		return [set];
	},
	
	construct: function() {
		
		var _valueOf = this.valueOf,
			values = [];
		this.valueOf = function() {
			return values;
		};
		
		// TODO: Isn't this *exactly* like `valueOf`?
		this.change = function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			var change = !_.isEqual(this.valueOf(), items);
			var set = _valueOf.call(this);
			set.clear();
			set.addAll(items);
			// We must cache a representation of the set's values at this
			// point, because we want to make sure that the object reference
			// only changes when the selection's actual value changes. If we
			// create a new selection value every time it is requested (in
			// `this.valueOf`) then we will get problems with wrappers
			// thinking that the selection has changed while it hasn't.
			values = _valueOf.call(this).values();
			if (change) $(this).trigger('valuechange', { to: values });
			return this;
		};
		
		this.contains = function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			var subset = new HashSet();
			subset.addAll(items);
			return subset.isSubsetOf(_valueOf.call(this));
		};
		
	},
	
	proto: {
		
		toggle: function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			
			var toggle = new HashSet();
			toggle.addAll(items);
			
			var current = new HashSet();
			current.addAll(this.valueOf());
			
			var set = current.union(toggle);
			
			var subtract = current.intersection(toggle).values();
			for (var i = 0, l = subtract.length; i < l; i++) {
				set.remove(subtract[i]);
			}
			
			return this.change(set.values());
		},
		
		size: function() {
			return this.valueOf().length;
		}
		
	}
	
});

/*
$.al.Selection = $.al.Object.subtype({
	
	name: 'jQuery.al.Selection',
	
	construct: function() {
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			return _valueOf.call(this).values();
		};
		
		this.add = function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			var set = _valueOf.call(this);
			set.addAll(items);
			$(this).trigger('valuechange', { to: set.values() });
		};
		
		this.remove = function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			if (items.length < 1) {
				return this;
			}
			var set = _valueOf.call(this);
			var i = items.length;
			while (i--) {
				set.remove(items[i]);
			}
			$(this).trigger('valuechange', { to: set.values() });
		};
		
		this.contains = function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			var subset = new HashSet();
			subset.addAll(items);
			return subset.isSubsetOf(_valueOf.call(this));
		};
	},
	
	args: function() {
		var set = new HashSet();
		set.addAll(arguments);
		return [set];
	},
	
	proto: {
		
		// TODO: I think we would like to make `change` the core method that all
		// selection change operations are defined in terms of.
		change: function(items) {
			// TODO: This is not completely correct, as values that are both in
			// `this.valueOf()` and in `items` should not be removed and added.
			// Also `valuechange` is triggered twice, which is undesirable.
			this.remove(this.valueOf());
			this.add(items);
		},
		
		toggle: function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			var add = [], remove = [];
			for (var i = 0, l = items.length; i < l; i++) {
				(this.contains(items[i]) ? remove : add).push(items[i]);
			}
			this.add(add);
			this.remove(remove);
		},
		
		size: function() {
			return this.valueOf().length;
		}
		
	}
	
});
*/

}(this.jQuery));


(function($) {

$.widget('al.selectable', {
	
	options: {
		elements: null,
		data: null,
		selection: new $.al.Selection(),
		changeOn: null,
		toggleOn: 'click'
	},
	
	_create: function() {
		var self = this;
		
		// TODO: Check if we can detect a dataview on `self.element`, and if
		// so use it to determine better default values for `self.options.
		// elements` and `self.options.data`.
		
		// TODO: Apply current `.valueOf()` `self.options.selection`.
		
		// TODO: Make it possible to have `select` and `no-select` classes on
		// items by default. Would take away the need to implement
		// `invalidateselected` and `invalidateunselected` handlers in most
		// scenarios.
		
		$(self.options.selection).bind('selectionadd selectionremove', function(e, data) {
			self._trigger('invalidate' + (e.type === 'selectionadd' ? '' : 'un') + 'selected', e, { elements: self._findElements(data.items) });
		});
		
		self.element.delegate(self.options.elements, 'invalidate', function(e) {
			self._trigger('invalidate' + (self.options.selection.contains(self.options.data.call(this)) ? '' : 'un') + 'selected', e, { elements: [this] });
		});
		
		// TODO: This not a core task of selectable.
		if (self.options.changeOn !== null) {
			self.element.delegate(self.options.elements, self.options.changeOn, function() {
				self.options.selection.change(self.options.data.call(this));
			});
		}
		if (self.options.toggleOn !== null) {
			self.element.delegate(self.options.elements, self.options.toggleOn, function() {
				self.options.selection.toggle(self.options.data.call(this));
			});
		}
	},
	
	_findElements: function(items) {
		var self = this,
			set = new HashSet(),
			elements = [];
		
		set.addAll($.isArray(items) ? items : [items]);
		
		self.element.find(self.options.elements).each(function() {
			if (set.contains(self.options.data.call(this))) {
				elements.push(this);
			}
		});
		
		return elements;
	}
	
});

}/*(jQuery)*/);