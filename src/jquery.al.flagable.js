/*
$('ul').flagable({
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
	flagRender: function($elements) {
	},
	unflagRender: function($elements) {
	}
});

$('ul').flagable('flagged')		=> items | null
$('ul').flagable('unflagged')	=> null | items
Internally this translates to:
	flagged: items
	inverse: false | true

$('ul').flagable('flag', items | $elements | null)
$('ul').flagable('unflag', items | $elements | null)
*/

(function($) {

$.widget('al.flagable', {
	
	options: {
		id: null
	},
	
	_create: function() {
		var self = this;
		
		self._flagged = [];	// $.RecordSet(self.options.id);
		self._inverted = false;
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
			self._trigger(trigger, undefined, [null]);
			return;
		}
		
		if (!$.isArray(items)) {
			return self.flag([items], invert);
		}
		
		if (self._inverted === invert) {
			$.merge(self._flagged, items);	// self._flagged.add(items)
			self._trigger(trigger, undefined, [items]);
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
			p = self._flagged.indexOf(items[i]);
			if (p !== -1) {
				$.merge(impacted, self._flagged.splice(p, 1));
			}
		}
		if (impacted.length > 0) {
			self._trigger(trigger, undefined, [impacted]);
		}
	},
	
	unflag: function(items) {
		var self = this;
		
		self.flag(items, true);
	},
	
	flagged: function(invert) {
		invert = !!invert;
		var self = this;
		
		return self._inverted === invert ? self._flagged : null;
	},
	
	unflagged: function() {
		var self = this;
		
		return self.flagged(true);
	}
	
});

}(jQuery));






/*
(function($) {


WISHLIST
- Support this syntax: $('section > ul').flagable({item: '> li'});
  which will end up as: $('section > ul').flagable({item: 'section > ul > li'});
  Default value for option item can be '> *' in that case.
- Cache methods such as flagged().


$.widget('al.flagable', {

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

$.widget('al.selectable', $.al.flagable, {

	options: {
		minOne: false,
		maxOne: true,
		sync: ':radio'
	}

});

}(jQuery));
*/
