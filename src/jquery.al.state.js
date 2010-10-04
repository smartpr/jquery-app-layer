(function($) {

$.widget('al.state', {
	
	options: {
		observe: {},
		active: true,
		value: null
	},
	
	_create: function() {
		var self = this;
		
		// TODO: Validate types (i.e. prevent that it contains commas, a.o.).
		$.each(self.options.observe, function(types, elements) {
			$(elements).bind(types, $.proxy(self, 'update'));
		});
	},
	
	// TODO: Add option to force update, even if state value has not changed.
	update: function() {
		var self = this;
		
		var toValue = $.isFunction(self.options.value) ? self.options.value.call(self.element[0]) : self.options.value;
		
		var fromActive = self.isActive(),
			toActive = !!($.isFunction(self.options.active) ? self.options.active.call(self.element[0], toValue) : self.options.active);
		
		// Show or hide regardless of current state to make sure visibility
		// correlates with activity.
		self.element[toActive ? 'show' : 'hide']();
		
		if (!toActive) {
			if (fromActive) {
				self._trigger('deactivate');
			}
			return;
		} else {
			var isInit = self.isInit(),
				fromValue = isInit ? self._value : null,
				eventData = {
					value: toValue
				};
			
			if (!isInit || !_.isEqual(fromValue, toValue)) {
				self._value = toValue;
			}
			
			if (!fromActive) {
				self._trigger('activate');
			}
			
			if (!isInit || !_.isEqual(fromValue, toValue)) {
				// TODO: Always trigger change event, unless init handler(s)
				// trigger its cancelation.
				if (!isInit) {
					self._trigger('init', undefined, eventData);
				} else {
					self._trigger('change', undefined, $.extend({from: fromValue}, eventData));
				}
			}
		}
		
	},
	
	isInit: function() {
		var self = this;
		
		return '_value' in self;
	},
	
	isActive: function() {
		var self = this;
		
		// TODO: Determining activity based on visibility is not feasible, as
		// visibility may be affected by a parent element, effectively
		// deactivating this state block without it ever triggering a
		// deactivate event.
		return self.isInit() && self.element.is(':visible');
	},
	
	value: function() {
		var self = this;
		
		return self.isInit() ? self._value : null;
	}
	
});

}(jQuery));