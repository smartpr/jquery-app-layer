(function($, undefined) {

$.al = {
	type: {},
	wrapper: {},
	list: {},
	
	util: {}
};

// TODO: Don't use "switch" in the name, as the corresponding property is not
// named `$.component.switch`.
$.fn.toggleSwitch = function(name, state) {
	var on = name,
		off = 'no-' + name;
	return this.each(function() {
		var $this = $(this);
		if (state === undefined) {
			// TODO: If no class is set on the element at all, do we want to
			// interpret this as off, or leave it alone?
			state = $this.is('.' + on) ? false : $this.is('.' + off) ? true : undefined;
		}
		if (state === undefined) return true;
		$this.removeClass(state ? off : on).addClass(state ? on : off);
	});
};

// TODO: Use jQuery.sub() somehow?
var _isFunction = $.isFunction;
$.isFunction = function(obj) {
	// The presence of a `subtype` and `supertype` method on `obj` is
	// interpreted as `obj` being a type that was created by `$.al.subtype`.
	// We don't want these types to be considered functions by jQuery (even
	// though they technically are), so that we can wrap them in jQuery
	// objects (and trigger or bind events on them for example) without this
	// being interpreted as a `$.ready` shorthand.
	if (obj instanceof Object && $.isFunction(obj.subtype) && $.isFunction(obj.supertype)) return false;
	return _isFunction.apply(this, arguments);
};

}(this.jQuery));