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

}(jQuery));