// This module contains generic components that are depended on through-out
// all of **jQuery App Layer**.

(function($) {

$.al = {};

// ## Utilities
/*
$.fn.holdEvents = function(type) {
	type = type || 'valuechange';
	
	return this.each(function() {
		var $this = $([this]),
			backlog = [];
		var stopper = function(e) {
			e.stopImmediatePropagation();
			var args = _.toArray(arguments);
			args[0] = args[0].type;
			backlog.push(args);
		};
		$this.bind(type, stopper);
		// TODO: How to name this event?
		$this.one('al-unholdEvents', function() {
			$([this]).unbind(type, stopper);
			while (backlog.length > 0) {
				$.fn.trigger.apply($([this]), backlog.shift());
			}
		});
	});
};

$.fn.unholdEvents = function() {
	this.trigger('al-unholdEvents');
};
*/

// TODO: We can (and should) probably move this delay into `$.event.special`.
$.fn.asyncTrigger = function() {
	var $this = this,
		args = arguments;
	setTimeout(function() {
		$.fn.trigger.apply($this, args);
	}, 0);
	return this;
};

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

// TODO: Use another term than `initialize` for this, as we want to use it for
// the constructor method, which is exactly what this `initializing` flag is
// supposed to contradict with.
var initializing = false;
var initialize = function(Type) {
	initializing = true;
	var initialized = new Type;
	initializing = false;
	return initialized;
};

var defaultOpts = {
	base: Object,
	name: undefined,
	init: $.noop,
	args: $.noop,
	proto: {},
	type: {}
};

// TODO: Rename `opts.base` to `opts.parent` because it better describes what
// it is (`base` sounds too much like a root), and we want to use the same
// term as the type method (to be done) that returns the type that a type was
// extended from.
$.al.subtype = function(opts) {
	opts = $.extend({}, defaultOpts, opts);
	
	var isNamed = typeof opts.name === 'string' && opts.name.length > 0;
	var Type = Function('init',
		// TODO: Preprocessing on name should be smarter than just dealing
		// with dots, like: `jQuery.al.Object` => `jQuery_al_Object`.
		"return function" + (isNamed ? " " + _.last(opts.name.split('.')) : "") + "() {\
			return init.apply(this, arguments);\
		};"
	)(function() {
		var args = arguments;
		var construct = function() {
			// Note that calling `opts.base` as a regular function will not do
			// anything useful if `opts.base === Object`, but it doesn't harm
			// either.
			var parentArgs = $.isFunction(opts.args) ? opts.args.apply(this, args) : args;
			opts.base.apply(this, parentArgs === undefined ? args :
				$.isArray(parentArgs) ? parentArgs : [parentArgs]);
			opts.init.apply(this, args);
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
		initialize(opts.base),
		{ constructor: Type },
		opts.proto
	);
	
	// Make sure we ignore `prototype` because obviously we do not want to
	// replace `Type`'s prototype with the `opts.base`'s prototype. In most
	// browsers this won't happen, but at least in Firefox (3.6) the
	// `prototype` property is included in the extend.
	var baseProps = $.extend({}, opts.base);
	delete baseProps.prototype;
	
	// TODO: Make sure we don't copy `__events__` properties.
	
	return $.al.extend(
		Type,
		baseProps,
		// TODO: We do not have to define a new `subtype` implementation if
		// `opts.base` already contains one.
		{ subtype: function(o) { return $.al.subtype($.extend(o, { base: this })); } },
		isNamed ? { toString: function() { return opts.name; } } : {},
		opts.type
	);
};

// TODO: Perhaps we can make `$.al.CurryableObject` (or something like that) a
// subtype of `$.al.Object`, which then is the base type for all the other
// types.

// ## Base types

// Every (non-native) type in **jQuery App Layer** is a subtype of this one.
$.al.Object = $.al.subtype({
	
	name: 'jQuery.al.Object',
	
	init: function(v) {
		var value;
		this.valueOf = function(newValue, notify) {
			var self = this;
			if (arguments.length === 0) {
				return value;
			}
		
			var change = value !== newValue;
			value = newValue;
			if (notify === true || change && notify !== false) {
				$(self).asyncTrigger('valuechange', { to: value });
			}
			return self;
		};
		
		// Don't bother to notify `valuechange` upon object instantiation, as
		// nobody has had the chance to bind an actual handler yet. Not even an
		// imaginary subtype of `$.al.Object`, as its constructor is executed
		// after this one.
		if (arguments.length > 0) {
			this.valueOf(v, false);
		}
	},
	
	proto: {
		
		toString: function() {
			// We must not omit `.valueOf()` as it would result in an infinite
			// loop.
			return this.valueOf() + '';
		}
		
	}
});

$.al.Array = $.al.Object.subtype({
	
	name: 'jQuery.al.Array',
	
	init: function() {
		// We want $.al.Array to represent array identity, like Array, so do not
		// allow setting another array instance.
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			// Never output the internal array, as it may be altered without us
			// being able to detect that and trigger a valuechange event.
			return _valueOf.call(this).slice();
		};
		
		// All mutator methods are defined in terms of `splice`, which is
		// therefore the only method that cannot be defined on the prototype
		// because it needs access to the internal (uncloned) array, which is
		// not (and should not be) possible from the outside.
		this.splice = function() {
			var array = _valueOf.call(this),
				size = array.length,
				result = Array.prototype.splice.apply(array, arguments);
	
			if (array.length !== size || result.length > 0) {
				$(this).asyncTrigger('valuechange', { to: array.slice() });
			}
	
			return result;
		};
	},
	
	args: function(length) {
		// If one numeric argument has been passed we follow Array's
		// interpretation and create an empty array of that length.
		if (arguments.length === 1 && _.isNumber(length)) {
			return [new Array(length)];
		}
		// The full list of arguments should be stored by the parent constructor
		// as one array value.
		return [_.toArray(arguments)];
	},
	
	proto: {
		
		// TODO: Implement all other [JavaScript 1.5 Array mutator methods](
		// https://developer.mozilla.org/en/JavaScript/Reference/
		// Global_Objects/Array#Methods_2).
		
		push: function() {
			this.splice.apply(this, $.merge([this.valueOf().length, 0], arguments));
			
			return this.valueOf().length;
		},
		
		size: function(s) {
			var array = this.valueOf();
			if (arguments.length === 0) {
				return array.length;
			}
			var change = array.length !== s;
			this.valueOf().length = s;
			if (change) {
				$(this).asyncTrigger('valuechange', { to: array.slice() });
			}
			return this;
		},
		
		// TODO: Get rid of this `each` concept, as it seems to have no use case.
		each: function(cb) {
			var array = this.valueOf();
			for (var i = 0, l = array.length; i < l; i++) {
				// TODO: Handle return values (false = break, non-false = continue)
				cb.call(array[i], i, array[i]);
			}
			return this;
		}
		
	}
	
});

$.al.VirtualArray = $.al.Array.subtype({
	
	name: 'jQuery.al.VirtualArray',
	
	init: function(l) {
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
				$(this).asyncTrigger('sizechange', { to: length });
			}
			return this;
		};
		
		this.loaded = function() {
			return _size.call(this);
		};
		
		var loader,
			isPristine = true;
		this.loader = function(l) {
			loader = l;
			return this;
		};
		this.load = function(cb) {
			this.isPristine(false);
			loader.call(this, $.proxy(cb, this));
			return this;
		};
		this.isPristine = function(p) {
			if (arguments.length === 0) {
				return isPristine;
			}
			isPristine = !!p;
			return this;
		};
		
		if ($.isFunction(l)) {
			this.loader(l);
		}
	},
	
	args: function(loader) {
		if ($.isFunction(loader)) {
			return [];
		}
	},
	
	proto: {
		
		each: function(cb) {
			var _each = this.each;
			if (this.isPristine()) {
				return this.load(function() {
					_each.call(this, cb);
				});
			}
			return _each.call(this, cb);
		}
		
	}
	
});

$.al.Decorator = $.al.Object.subtype({
	
	name: 'jQuery.al.Decorator',
	
	init: function() {
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			// TODO: Is it a problem that we are returning an uncloned object
			// (in case of an array for instance). Doesn't `$.al.Record` do
			// the same?
			return _valueOf.call(this);
		};
		
		var decorate;
		this.decorate = function(d) {
			var self = this;
			decorate = d;
			delete this.decorate;
			$([decorate]).bind('valuechange', function() {
				_valueOf.call(self, this.valueOf());
			});
			_valueOf.call(self, decorate.valueOf());
			return this;
		};
	}
	
});

$.al.Conditional = $.al.Object.subtype({
	
	name: 'jQuery.al.Conditional',
	
	init: function(object, condition) {
		var self = this,
			pending;
		
		$(object).bind('valuechange', function(e, data) {
			if (condition.valueOf()) {
				$(self).asyncTrigger('valuechange', data);
			} else {
				pending = arguments;
			}
		});
		
		$(condition).bind('valuechange', function(e, data) {
			if (data.to && pending !== undefined) {
				pending[0] = pending[0].type;
				$.fn.asyncTrigger.apply($(self), pending);
				pending = undefined;
			}
		});
	}
	
});

$.al.Selection = $.al.Object.subtype({
	
	name: 'jQuery.al.Selection',
	
	init: function() {
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			return _valueOf.call(this).values();
		};
	
		this.add = function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			var set = _valueOf.call(this);
			set.addAll(items);
			$(this).
				trigger('valuechange', { to: set.values() }).
				trigger('selectionadd', { items: items });
		};
	
		this.remove = function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			var set = _valueOf.call(this);
			var i = items.length;
			while (i--) {
				set.remove(items[i]);
			}
			$(this).
				trigger('valuechange', { to: set.values() }).
				trigger('selectionremove', { items: items });
		};
	
		this.contains = function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			var subset = new HashSet();
			subset.addAll(items);
			return subset.isSubsetOf(_valueOf.call(this));
		};
	},
	
	args: function() {
		var set = new HashSet();
		set.addAll(arguments);
		return [set];
	},
	
	proto: {
		
		// TODO: I think we would like to make `change` the core method that all
		// selection change operations are defined in terms of.
		change: function(items) {
			// TODO: This is not completely correct, as values that are both in
			// `this.valueOf()` and in `items` should not be removed and added.
			// Also `valuechange` is triggered twice, which is undesirable.
			this.remove(this.valueOf());
			this.add(items);
		},
		
		toggle: function(items) {
			if (!$.isArray(items)) {
				items = [items];
			}
			var add = [], remove = [];
			for (var i = 0, l = items.length; i < l; i++) {
				(this.contains(items[i]) ? remove : add).push(items[i]);
			}
			this.add(add);
			this.remove(remove);
		},
		
		size: function() {
			return this.valueOf().length;
		}
		
	}
	
});

}(jQuery));