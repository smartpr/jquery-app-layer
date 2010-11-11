// This module contains generic components that are depended on through-out
// all of **jQuery App Layer**.

(function($) {

$.al = {};

// ## Utilities

// [Source](http://msdn.microsoft.com/en-us/library/kb6te8d3(v=VS.85).aspx)
var objectPrototype = [
	'constructor',
	'propertyIsEnumerable',
	'isPrototypeOf',
	'hasOwnProperty',
	'toLocaleString',
	'toString',
	'valueOf'
];
// Like `jQuery.extend`, but attempts to work-around [JScript's DontEnum
// bug](https://developer.mozilla.org/en/ECMAScript_DontEnum_attribute#
// JScript_DontEnum_Bug). Does not support deep copy for now. Hopefully we can
// expect this utility function to become obsolete once jQuery decides to
// [incorporate a fix](http://bugs.jquery.com/ticket/7467).
$.al.extend = function(target) {
	var result = $.extend.apply(undefined, arguments),
		p, n, prop;
	
	// TODO: Ideally we would only run this if our current environment suffers
	// from the said bug, but we do not want to invest any more time in this
	// before jQuery has decided if they will be taking care of this problem
	// for us (see ticket as linked above).
	for (var i = typeof arguments[0] === 'boolean' ? 1 : 0, l = arguments.length - i; i < l && arguments[i]; i++) {
		for (p = 0, n = objectPrototype.length; p < n; p++) {
			prop = objectPrototype[p];
			if (arguments[i].hasOwnProperty(prop)) {
				result[prop] = arguments[i][prop];
			}
		}
	}
	
	return result;
};

// ## Type inheritance

// Inspired by [Correct OOP for Javascript](http://www.coolpage.com/developer/
// javascript/Correct%20OOP%20for%20Javascript.html) and [Simple JavaScript
// Inheritance](http://ejohn.org/blog/simple-javascript-inheritance/).
// Argument `Base` should be either `Object` or a non-native class function.

var initializing = false;
var initialize = function(Type) {
	initializing = true;
	var initialized = new Type;
	initializing = false;
	return initialized;
};
$.al.subtype = function(Base, name, init, protoProps, typeProps, alterArgs) {
	if (typeof name !== 'string') {
		alterArgs = typeProps;
		typeProps = protoProps;
		protoProps = init;
		init = name;
		name = undefined;
	}
	if (!$.isFunction(init)) {
		alterArgs = typeProps;
		typeProps = protoProps;
		protoProps = init;
		init = $.noop;
	}
	if ($.isFunction(protoProps)) {
		alterArgs = protoProps;
		typeProps = undefined;
		protoProps = undefined;
	}
	
	var isNamed = typeof name === 'string' && name.length > 0;
	var Type = Function('init',
		// TODO: Preprocessing on name should be smarter than just dealing
		// with dots.
		"return function" + (isNamed ? " " + _.last(name.split('.')) : "") + "() {\
			return init.apply(this, arguments);\
		};"
	)(function() {
		var args = arguments;
		var construct = function() {
			// Calling `Base` as a regular function will not do anything
			// useful if `Base === Object`, but it doesn't harm either.
			var baseArgs = args;
			if ($.isFunction(alterArgs)) {
				baseArgs = alterArgs.apply(this, args);
				baseArgs = baseArgs === undefined ? args : _.flatten([baseArgs]);
			}
			Base.apply(this, baseArgs);
			init.apply(this, args);
			return this;
		};
		
		if (!(this instanceof Type)) {
			// TODO: Implement true currying, in that you can pass part of the
			// instantiation arguments upon actual instantiation (as opposed
			// to upon creation of instantiator).
			var instantiate = function() {
				return construct.call(initialize(Type));
			};
			instantiate.create = instantiate.call;
			return instantiate;
		}
		
		if (!initializing) construct.call(this);
	});
	
	Type.prototype = $.al.extend(
		initialize(Base),
		{ constructor: Type },
		isNamed ? { toString: function() { return "[object " + name + "]"; } } : {},
		protoProps
	);
	
	$.al.extend(
		Type,
		{ subtype: _.bind($.al.subtype, undefined, Type) },
		isNamed ? { toString: function() { return "[type " + name + "]"; } } : {},
		typeProps
	);
	
	return Type;
};

// ## Base types

// Every single **jQuery App Layer** type extends from this one.
$.al.Value = $.al.subtype(Object, 'jQuery.al.Value', function() {
	this.args = arguments;
});

// And every array type extends from this one.
$.al.Value.Array = $.al.Value.subtype('jQuery.al.Value.Array', function() {
	// this.set(Array.apply(undefined, arguments));
});

}(jQuery));