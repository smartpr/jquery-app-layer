/*
$('ul').flaggable({
	elements: '> li',
	bind: 'click',
	id: 'fieldName',
	minOne: false,
	maxOne: false,
	flag: function(items) {
	},
	unflag: function(items) {
	},
	flagFirst: function(item) {
	},
	unflagLast: function(item) {
	},
	invalidateFlagged: function($elements) {
	},
	invalidateUnflagged: function($elements) {
	}
});

$('ul').flaggable('flagged')		=> items | null
$('ul').flaggable('unflagged')	=> null | items
Internally this translates to:
	flagged: items
	inverse: false | true

$('ul').flaggable('flag', items | $elements | null)
$('ul').flaggable('unflag', items | $elements | null)

$('ul').flaggable('invalidate')


*/




// TODO: add invalidate method to force/manually signal invalidation
(function($) {

$.widget('al.flaggable', {
	
	options: {
		elements: null,
		data: false,
		// bind: 'click',
		// handle: $.noop,
		id: null
	},
	
	_create: function() {
		var self = this,
			flag = $.isFunction(self.options.flag) ? self.options.flag : $.noop,
			unflag = $.isFunction(self.options.unflag) ? self.options.unflag : $.noop;
		
		if (self.options.data === true) {
			self.options.data = function() {
				return $(this).dataview('get');
			};
		}
		
		// TODO: Introduce invalidatechanged event(?)
		$.extend(self.options, {
			flag: function(e, data) {
				self._trigger('invalidateflagged', e, {elements: self._elementsWithData(data.items)});
				return flag.apply(this, arguments);
			},
			unflag: function(e, data) {
				self._trigger('invalidateunflagged', e, {elements: self._elementsWithData(data.items)});
				return unflag.apply(this, arguments);
			}
		});
		
		// TODO: This is just a proof of concept.
		self.element.delegate(self.options.elements, 'invalidate', function(e) {
			if (self.flagged(self.options.data.call(this))) {
				self._trigger('invalidateflagged', e, {elements: $(this)});
			}
		});
		
		self._flagged = [];	// $.RecordSet(self.options.id);
		self._inverted = false;
		
		// // If no DOM elements are involved, we are done setting up.
		// if (self.options.elements === null) {
		// 	return;
		// }
		// 
		// self.element.delegate(self.options.elements, self.options.bind, function(e) {
		// 	self.toggle($.isFunction(self.options.data) ? self.options.data.call(this) : this);
		// 	return self.options.handle.call(this, e);
		// });
	},
	
	_elementsWithData: function(data) {
		var self = this,
			elements = [],
			$elements = self.element.find(self.options.elements);
		
		// TODO: Shouldn't we leave out the elements that hold data that is
		// already flagged/unflagged?
		if (data === null) {
			return $elements.get();
		}
		if (!$.isFunction(self.options.data)) {
			return data;
		}
		
		$elements.each(function() {
			if ($.inArray(self.options.data.call(this), data) === -1) {
				return true;
			}
			elements.push(this);
		});
		
		return elements;
	},
	
	change: function(flagged, unflagged) {
		var self = this,
			items = flagged,
			invert = false;
		if (flagged === null) {
			items = unflagged;
			invert = true;
		}
		return self._change(items, invert);
	},
	
	// TODO: support both (items, invert) and (flagged, unflagged) interfaces:
	// former in _change, latter in change.
	// TODO: deal with items=null (and invert!=unflagged)
	_change: function(items, invert) {
		var self = this;
		invert = !!invert;
		
		if (items === null) {
			items = [];
			invert = !invert;
		}
		items = $.makeArray(items);
		
		if (self._inverted === invert) {
			if (_.isEqual(self._flagged, items) /*self._flagged.equals(items)*/) {
				return;
			}
			// var one = self._flagged.remove(items, true),
			// 	two = self._flagged.add(items, true),
			var one = $.merge([], items),
				two = $.merge([], self._flagged);
			one.unshift(self._flagged);
			two.unshift(items);
			one = _.without.apply(undefined, one);
			two = _.without.apply(undefined, two);
			var unflag = [invert ? two : one, null],
				flag = [invert ? one : two, null];
		} else {
			// var one = self._flagged.intersection(items, true),
			// 	two = self._flagged.union(items, true);
			var one = _.intersect(self._flagged, items),
				two = _.uniq($.merge($.merge([], self._flagged), items));
			var unflag = invert ? [one, null] : [null, two],
				flag = invert ? [null, two] : [one, null];
		}
		var lastFlagged = self._flagged,
			lastInverted = self._inverted;
		// self._flagged.set(items);
		self._flagged = items;
		self._inverted = invert;
		if (!$.isArray(unflag[0]) || unflag[0].length > 0) {
			self._trigger('unflag', undefined, {items: unflag[0], unaffected: unflag[1]});
		}
		if (self._inverted === false && self._flagged.length === 0) {
			self._trigger('unflaglast');
		}
		if (!$.isArray(flag[0]) || flag[0].length > 0) {
			self._trigger('flag', undefined, {items: flag[0], unaffected: flag[1]});
		}
		if (lastInverted === false && lastFlagged.length === 0) {
			self._trigger('flagfirst');
		}
		self._trigger('change', undefined, {flagged: invert ? null : self._flagged, unflagged: invert ? self._flagged : null});
	},
	
	flag: function(items, invert) {
		var self = this;
		invert = !!invert;
		
		if (items === null) {
			return self._change(items, invert);
		}
		
		items = $.makeArray(items);
		
		if (self._inverted === invert) {
			return self._change(_.uniq($.merge($.merge([], self._flagged), items)), invert);
		}
		var without = $.merge([], items);
		without.unshift(self._flagged);
		without = _.without.apply(undefined, without);
		return self._change(without, self._inverted);
	},
	
	unflag: function(items) {
		var self = this;
		return self.flag(items, true);
	},
	
	// flag: function(items, invert) {
	// 	invert = !!invert;
	// 	var self = this,
	// 		current = self._flagged.length,
	// 		trigger = invert ? 'unflag' : 'flag',
	// 		modeTrigger = invert ? 'unflagLast' : 'flagFirst';
	// 	
	// 	if (items === null) {
	// 		if (self._inverted !== invert) {
	// 			return self.flag(self._flagged, invert);
	// 		}
	// 		self._flagged = [];	// self._flagged.clear();
	// 		self._inverted = !invert;
	// 		if (current === 0) {
	// 			self._trigger(modeTrigger);
	// 		}
	// 		self._trigger(trigger, undefined, {items: null});
	// 		return;
	// 	}
	// 	
	// 	if (!$.isArray(items)) {
	// 		return self.flag([items], invert);
	// 	}
	// 	
	// 	if (items.length === 0) {
	// 		return;
	// 	}
	// 	
	// 	if (self._inverted === invert) {
	// 		$.merge(self._flagged, items);	// self._flagged.add(items)
	// 		if (current === 0) {
	// 			self._trigger(modeTrigger);
	// 		}
	// 		self._trigger(trigger, undefined, {items: items});
	// 		return;
	// 	}
	// 	
	// 	// var removed = self._flagged.remove(items);
	// 	// if (removed.length > 0) {
	// 	//		self._trigger(trigger, undefined, [$.map(removed, function(record) {
	// 	//			return record.get();
	// 	//		})]);
	// 	// }
	// 	var impacted = [];
	// 	for (var i = 0, l = self._flagged.length, p; i < l; i++) {
	// 		p = $.inArray(items[i], self._flagged);
	// 		if (p !== -1) {
	// 			$.merge(impacted, self._flagged.splice(p, 1));
	// 		}
	// 	}
	// 	if (impacted.length > 0) {
	// 		if (current === impacted.length) {
	// 			self._trigger(modeTrigger);
	// 		}
	// 		self._trigger(trigger, undefined, {items: impacted});
	// 	}
	// },
	// 
	// unflag: function(items) {
	// 	var self = this;
	// 	
	// 	self.flag(items, true);
	// },
	
	toggle: function(items) {
		var self = this,
			flag = [],
			unflag = [];
		
		if (!$.isArray(items)) {
			return self.toggle([items]);
		}
		
		for (var i = 0, l = items.length; i < l; i++) {
			(self.flagged(items[i]) ? unflag : flag).push(items[i]);
		}
		self.unflag(unflag);
		self.flag(flag);
	},
	
	flagged: function(item, invert) {
		invert = !!invert;
		var self = this;
		
		if (item === undefined) {
			return self._inverted === invert ? self._flagged : null;
		}
		return (self._inverted === invert) === ($.inArray(item, self._flagged) !== -1);
	},
	
	unflagged: function(item) {
		var self = this;
		
		return self.flagged(item, true);
	}
	
});

}(jQuery));






/*
(function($) {


WISHLIST
- Support this syntax: $('section > ul').flaggable({item: '> li'});
  which will end up as: $('section > ul').flaggable({item: 'section > ul > li'});
  Default value for option item can be '> *' in that case.
- Cache methods such as flagged().


$.widget('al.flaggable', {

	options: {
		item: 'li',
		bind: 'click',
		trigger: 'flag',
		minOne: false,
		maxOne: false,
		sync: ':checkbox'
	},
	
	_create: function() {
		var self = this,
			ns = self.widgetName;
		
		$(self.options.item, self.element[0]).live(self.options.bind, function(e) {
			var $this = $(this),
				flag = $this.fetch(ns, 'flagged') !== true;
			
			$this.store(ns, 'flagged', flag || undefined);
			
			$this.find(self.options.sync).attr('checked', flag);
			
			// Supply $this in a list to prevent elements (just 'this' in this
			// case) from ending up as separate arguments of the event handler.
			self._trigger((flag ? '' : 'un') + self.options.trigger, e, [$this]);
		});
	},
	
	flagged: function() {
		var self = this,
			ns = self.widgetName;
		
		return self.element.find(self.options.item + ':data(' + ns + '.flagged=true)');
	}

});

$.widget('al.selectable', $.al.flaggable, {

	options: {
		minOne: false,
		maxOne: true,
		sync: ':radio'
	}

});

}(jQuery));
*/
