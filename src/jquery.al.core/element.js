(function($, undefined) {

$.al.Element = $.al.Wrapper.subtype({
	
	name: 'jQuery.al.Element',
	
	args: [undefined, function(element) {
		return $(element).val();
	}],
	
	construct: function(e) {
		
		var _wraps = this.wraps;
		delete this.wraps;
		delete this.filter;
		
		var _valueOf = this.valueOf;
		this.valueOf = function(v) {
			var result = _valueOf.apply(this, arguments);
			
			// By setting the DOM element's value based on this object's
			// internal value, we make this object a full-fledged interface to
			// the wrapped DOM element. As the object's internal value is at
			// the central value (instead of the DOM element's value), we can
			// detect and trigger `valuechange` appropriately.
			if (arguments.length > 0) $(this.element()).val(v);
			
			return result;
		};
		
		this.element = function(e) {
			var current = _wraps.call(this);
			
			if (arguments.length === 0) return current;
			
			if (typeof e === 'string') e = $(e);
			if (e instanceof $) e = e[0];
			
			// TODO: Edge cases that are being missed by handling these event
			// types:
			// 1. Using mouse and context menu to change contents of an
			//    element, f.e. by copy, cut or paste actions.
			// 2. Holding a key down, which results in many entries of the
			//    same character, while a change has been detected only after
			//    the first one.
			
			$(current).unbind('focus keydown change click', onTouch);
			var result = _wraps.call(this, e);
			if (current !== e) onTouch.call(this);
			$(e).bind('focus keydown change click', $.proxy(onTouch, this));
			
			return result;
		};
		
		var onTouch = function() {
			// We update asynchronously, as we need to give the element some
			// time to update its value upon `keydown`.
			setTimeout($.proxy(this.update, this), 0);
		};
		
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