(function($, undefined) {

// TODO: Why not implement this type in terms of jquery-datalink? Or even;
// ditch this type for datalink?

$.al.Element = $.al.Wrapper.subtype({
	
	name: 'jQuery.al.Element',
	
	args: [undefined, function(element) {
		return $(element).val();
	}],
	
	construct: function(e) {
		
		var _wraps = this.wraps;
		delete this.wraps;
		delete this.filter;
		
		this.element = function(e) {
			var current = _wraps.call(this);
			
			if (arguments.length === 0) return current;
			
			if (typeof e === 'string') e = $(e);
			if (e instanceof $) e = e[0];
			
			$(current).
				unbind('focus', onFocus).
				unbind('blur', onBlur);
			
			var result = _wraps.call(this, e);
			
			$(e).
				bind('focus', $.proxy(onFocus, this)).
				bind('blur', $.proxy(onBlur, this));
			
			if (current !== e) this.update();
			
			return result;
		};
		
		var timer;
		var onFocus = function() {
			var self = this;
			timer = setTimeout(function() {
				self.update();
				onFocus.call(self);
			}, 50);
		};
		var onBlur = function() {
			clearTimeout(timer);
		};
		
		$(this).bind('valuechange', function() {
			// TODO: This is not working in IE(?!?)
			$(this.element()).val(this.valueOf());
		});
		
		if (arguments.length > 0) {
			this.element(e);
		}
		
	}
	
});

}(this.jQuery));


(function($, undefined) {

// TODO: Allow setting of an element's value through this object.
// TODO: Allow setting (changing) the represented element.
// TODO: Use this type to represent components's `element`?
$.al.Element = $.al.Wrapper.subtype({
	
	name: 'jQuery.al.Element',
	
	args: function(element) {
		if (typeof element === 'string') element = $(element);
		if (element instanceof $) element = element[0];
		
		return [element, function(value) {
			return $(value).val();
		}, function(update) {
			$(element).bind('focus keydown change click', function() {
				// We update asynchronously, as we need to give the element
				// some time to update its value upon `keydown`.
				setTimeout(update, 0);
			});
		}];
	}
	
});

}/*(this.jQuery)*/);