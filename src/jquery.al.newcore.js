// This module contains generic components that are depended on through-out
// all of **jQuery App Layer**.

(function($) {

$.al = {};

// ## Utilities

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
	if (!$.isPlainObject(protoProps)) {
		alterArgs = protoProps;
		typeProps = undefined;
		protoProps = undefined;
	} else if (!$.isPlainObject(typeProps)) {
		alterArgs = typeProps;
		typeProps = undefined;
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
			if ($.isFunction(alterArgs)) alterArgs = alterArgs.apply(this, args);
			Base.apply(this, alterArgs === undefined ? args :
				$.isArray(alterArgs) ? alterArgs : [alterArgs]);
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
		protoProps
	);
	
	return $.al.extend(
		Type,
		{ subtype: _.bind($.al.subtype, undefined, Type) },
		isNamed ? { toString: function() { return name; } } : {},
		typeProps
	);
};

// ## Base types

// Every (non-native) type in **jQuery App Layer** is a subtype of this one.
$.al.Object = $.al.subtype(Object, 'jQuery.al.Object', function(v) {
	var value;
	this.valueOf = function(newValue, notify) {
		if (arguments.length === 0) {
			return value;
		}
		
		var change = value !== newValue;
		value = newValue;
		if (notify === true || change && notify !== false) {
			$(this).trigger('valuechange', { to: value });
		}
		return this;
	};
	
	// Always notify valuechange if an initial value is supplied, so that
	// undefined can be used as a value like any others.
	if (arguments.length > 0) {
		this.valueOf(v, true);
	}
}, {
	toString: function() {
		// We must not omit `.valueOf()` as it would result in an infinite
		// loop.
		return this.valueOf() + '';
	}
});

$.al.Array = $.al.Object.subtype('jQuery.al.Array', function() {
	// We want $.al.Array to represent array identity, like Array, so do not
	// allow setting another array instance.
	var _valueOf = this.valueOf;
	this.valueOf = function() {
		// Never output the internal array, as it may be altered without us
		// being able to detect that and trigger a valuechange event.
		return _valueOf.call(this).slice();
	};
	
	// These methods cannot be defined on the prototype because we need access
	// to the internal (uncloned) array, which is not possible from the
	// outside.
	this.push = function() {
		var array = _valueOf.call(this),
			result = Array.prototype.push.apply(array, arguments);
		
		if (arguments.length > 0) {
			$(this).trigger('valuechange', { to: array.slice() });
		}
		
		return result;
	};
	this.splice = function() {
		var array = _valueOf.call(this),
			size = array.length,
			result = Array.prototype.splice.apply(array, arguments);
		
		if (array.length !== size || result.length > 0) {
			$(this).trigger('valuechange', { to: array.slice() });
		}
		
		return result;
	};
	// TODO: Implement all other [JavaScript 1.5 Array mutator methods](https:
	// //developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array#
	// Methods_2).
}, {
	size: function(s) {
		var array = this.valueOf();
		if (arguments.length === 0) {
			return array.length;
		}
		var change = array.length !== s;
		this.valueOf().length = s;
		if (change) {
			$(this).trigger('valuechange', { to: array.slice() });
		}
		return this;
	}
}, function(length) {
	// If one numeric argument has been passed we follow Array's
	// interpretation and create an empty array of that length.
	if (arguments.length === 1 && _.isNumber(length)) {
		return [new Array(length)];
	}
	// The full list of arguments should be stored by the parent constructor
	// as one array value.
	return [_.toArray(arguments)];
});

$.al.VirtualArray = $.al.Array.subtype('jQuery.al.VirtualArray', function(loader) {
	var length;
	
	var _size = this.size;
	this.size = function(s) {
		var size = _size.call(this);
		if (arguments.length === 0) {
			return length === undefined ? size : length;
		}
		length = undefined;
		if (s < size) {
			_size.call(this, s);
		} else if (s > size) {
			length = s;
			$(this).trigger('sizechange', { to: length });
		}
		return this;
	};
	
	this.loaded = function() {
		return _size.call(this);
	};
	
	loader.call(this);
}, function(loader) {
	if ($.isFunction(loader)) {
		return [];
	}
});

$.al.Conditional = $.al.Object.subtype('jQuery.al.Conditional', function(object, condition) {
	var self = this,
		pending;
	
	$(object).bind('valuechange', function(e, data) {
		if (condition.valueOf()) {
			$(self).trigger('valuechange', data);
		} else {
			pending = arguments;
		}
	});
	
	$(condition).bind('valuechange', function(e, data) {
		if (data.to && pending !== undefined) {
			pending[0] = pending[0].type;
			$.fn.trigger.apply($(self), pending);
			pending = undefined;
		}
	});
	
});


/*
$.al.Value = $.al.Object.subtype('jQuery.al.Value', function() {
	var data;
	
	this.get = function() {
		return data;
	};
	this.set = function(value, notify) {
		var change = data !== value;
		data = value;
		if (notify === true || change && notify !== false) {
			$(this).trigger('valuechange', data);
		}
		return this;
	};
}, {
	toString: function() {
		// We must not omit `.valueOf()` as it would result in an infinite
		// loop.
		return this.valueOf() + '';
	},
	valueOf: function() {
		// If this method is called directly on the prototype, there will be
		// no `get` method.
		return this instanceof $.al.Value ? this.get() : this;
	}
});

// Every array type in **jQuery App Layer** is a subtype of this one.
$.al.Value.Array = $.al.Value.subtype('jQuery.al.Value.Array', function() {
	var setter,
		_get = this.get,
		_set = this.set;
	
	this.set([], false);
	
	this.get = function() {
		if (_get.call(this).length === 0 && $.isFunction(setter)) {
			var data = setter.call(this);
			if ($.isArray(data)) {
				_set.call(this, data);
			}
		}
		return _get.call(this);
	};
	this.set = function(set) {
		if (!$.isFunction(set)) {
			return _set.apply(this, arguments);
		}
		setter = set;
		return this;
	};
	
	this.push = function() {
		var data = _.flatten([_get.call(this), arguments]);
		_set.call(this, data);
		return data.length;
	};
});
*/
}(jQuery));