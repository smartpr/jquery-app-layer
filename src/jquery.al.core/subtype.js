(function($, undefined) {

// TODO: This is not a generic solution (https://github.com/documentcloud/
// underscore/issues/issue/60/), but merely a solution to the problem in
// $.al.subtype. So implement it as part of $.al.subtype instead of as a
// would-be re-implementation of $.extend.

// [Source](http://msdn.microsoft.com/en-us/library/kb6te8d3(v=VS.85).aspx)
var objectPrototype = [
	'constructor',
	'propertyIsEnumerable',
	'isPrototypeOf',
	'hasOwnProperty',
	'toLocaleString',
	'toString',
	'valueOf',
	// The following properties will not be enumerated over in IE8 if they are
	// held by an object of type `Function`. This is not documented as part of
	// JScript's DontEnum bug, but the work-around is the same. We are not
	// sure if more properties are affected by this problem.
	'call',
	'apply'
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

// TODO: Rename `opts.base` to `opts.parent` because it better describes what
// it is (`base` sounds too much like a root), and we want to use the same
// term as the type method (to be done) that returns the type that a type was
// extended from. Or rename to `opts.supertype`.
$.al.subtype = function(opts) {
	// Make sure not to mutate the original `opts` object, as we do not know
	// where it came from and what else might depends on it.
	opts = $.extend({
		base: Object,
		name: undefined,
		construct: $.noop,
		args: $.noop,
		proto: {},
		type: {}
	}, opts);
	
	// TODO: If `opts.base` has a `subtype` method, simply use that one and
	// we're done.
	
	var isNamed = typeof opts.name === 'string' && opts.name.length > 0,
		// If either this type or one of its parents is named, use it to
		// name the type function: replace any prepending numbers with `$`,
		// any other non-valid function name characters with `_`.
		funcName = (isNamed ? opts.name : opts.base.getName ? opts.base.getName() : '').
			replace(/^[0-9]+/, function(prefix) {
				return _.map(prefix, function() { return '$'; }).join('');
			}).
			replace(/[^a-zA-Z0-9_$]/g, '_');
	
	var Type = Function('run',
		"return function " + funcName + "() {\
			return run.apply(this, arguments);\
		};"
	)(function() {
		if (!(this instanceof Type)) return Type.call.apply(Type, arguments);
		if (!initializing) Type.instantiate.apply(this, arguments);
	});
	
	Type.prototype = $.al.extend(
		initialize(opts.base),
		{ constructor: Type },
		opts.proto
	);
	
	// TODO: Solve this in a more generic way, i.e. moving it into
	// `$.al.extend`.
	// Make sure we ignore `prototype` because obviously we do not want to
	// replace `Type`'s prototype with the `opts.base`'s prototype. In most
	// browsers this won't happen, but at least in Firefox (3.6) the
	// `prototype` property is included in the extend.
	var baseProps = $.al.extend({}, opts.base);
	delete baseProps.prototype;
	delete baseProps.__events__;
	
	return $.al.extend(
		Type,
		// We make these overridable by methods in `baseProps` as we always
		// want to use the implementation that is lowest in the type chain.
		{
			
			subtype: function(o) {
				return $.al.subtype($.extend({}, o, { base: this }));
			},
			
			call: function() {
				// Default behavior for calling a type without `new` operator
				// is to return an instance, as seems to be the convention in
				// jQuery (cf. `$.Event`).
				return this.instantiate.apply(this, arguments);
			}
			
		},
		baseProps,
		isNamed ? {
			
			getName: function() {
				return opts.name;
			},
			
			toString: function() {
				return this.getName();
			}
			
		} : {},
		opts.type,
		{
			
			// TODO: Not sure if we want to support this, as it might trigger
			// a way of thinking that is not recommended: as if it is a good
			// idea for type methods to forward their implementation to a
			// method on a supertype. This is generally not a good idea,
			// because the supertype can be anything -- including types that
			// were not created by `$.al.subtype` (and therefore probably do
			// not have many of the type methods that `$.al.subtype` creates).
			supertype: function() {
				return opts.base;
			},
			
			instantiate: function() {
				var instance = this instanceof Type ? this : initialize(Type);
				
				// Note that calling `opts.base` as a regular function will
				// not do anything useful if `opts.base === Object`, but it
				// doesn't harm either.
				var parentArgs = $.isFunction(opts.args) ? opts.args.apply(instance, arguments) : opts.args;
				opts.base.apply(instance, parentArgs === undefined ? arguments :
					$.isArray(parentArgs) ? parentArgs : [parentArgs]);
				opts.construct.apply(instance, arguments);
				
				return instance;
			}
			
		}
	);
};

}(this.jQuery));