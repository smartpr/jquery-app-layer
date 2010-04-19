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

(function($) {

var dataview = function() {
	return $(this).dataview('get');
};

$.widget('al.flaggable', {
	
	options: {
		elements: null,
		data: false,
		bind: 'click',
		handle: $.noop,
		id: null,
		flag: $.noop,
		unflag: $.noop
	},
	
	_create: function() {
		var self = this,
			flag = self.options.flag,
			unflag = self.options.unflag;
		
		if (self.options.data === true) {
			self.options.data = dataview;
		}
		// TODO: trigger flagFirst and unflagLast
		$.extend(self.options, {
			flag: function(e, data) {
				self._trigger('invalidateFlagged', undefined, {elements: self._elementsWithData(data.items)});
				return flag.apply(this, arguments);
			},
			unflag: function(e, data) {
				self._trigger('invalidateUnflagged', undefined, {elements: self._elementsWithData(data.items)});
				return unflag.apply(this, arguments);
			}
		});
		
		self._flagged = [];	// $.RecordSet(self.options.id);
		self._inverted = false;
		
		// If no DOM elements are involved, we are done setting up.
		if (self.options.elements === null) {
			return;
		}
		
		self.element.delegate(self.options.elements, self.options.bind, function(e) {
			self.toggle($.isFunction(self.options.data) ? self.options.data.call(this) : this);
			return self.options.handle.call(this, e);
		});
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
	
	flag: function(items, invert) {
		invert = !!invert;
		var self = this,
			trigger = invert ? 'unflag' : 'flag';
		
		if (items === null) {
			if (self._inverted !== invert) {
				return self.flag(self._flagged, invert);
			}
			self._flagged = [];	// self._flagged.clear();
			self._inverted = !invert;
			self._trigger(trigger, undefined, {items: null});
			return;
		}
		
		if (!$.isArray(items)) {
			return self.flag([items], invert);
		}
		
		if (self._inverted === invert) {
			$.merge(self._flagged, items);	// self._flagged.add(items)
			self._trigger(trigger, undefined, {items: items});
			return;
		}
		
		// var removed = self._flagged.remove(items);
		// if (removed.length > 0) {
		//		self._trigger(trigger, undefined, [$.map(removed, function(record) {
		//			return record.get();
		//		})]);
		// }
		var impacted = [];
		for (var i = 0, l = self._flagged.length, p; i < l; i++) {
			p = $.inArray(items[i], self._flagged);
			if (p !== -1) {
				$.merge(impacted, self._flagged.splice(p, 1));
			}
		}
		if (impacted.length > 0) {
			self._trigger(trigger, undefined, {items: impacted});
		}
	},
	
	unflag: function(items) {
		var self = this;
		
		self.flag(items, true);
	},
	
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
