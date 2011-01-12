(function($, undefined) {

$.al = {};

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