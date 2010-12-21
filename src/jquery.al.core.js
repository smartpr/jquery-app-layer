// This module contains generic components that are depended on through-out
// all of **jQuery App Layer**.

(function($) {

$.al = {};

// ## Utilities

// // TODO: We can (and should) probably move this delay into `$.event.special`.
// $.fn.asyncTrigger = function() {
// 	var $this = this,
// 		args = arguments;
// 	setTimeout(function() {
// 		$.fn.trigger.apply($this, args);
// 	}, 0);
// 	return this;
// };

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

var defaultOpts = {
	base: Object,
	name: undefined,
	construct: $.noop,
	args: $.noop,
	proto: {},
	type: {}
};

// TODO: Rename `opts.base` to `opts.parent` because it better describes what
// it is (`base` sounds too much like a root), and we want to use the same
// term as the type method (to be done) that returns the type that a type was
// extended from.
$.al.subtype = function(opts) {
	// Make sure not to mutate the original `opts` object, as we do not know
	// where it came from and what else might depends on it.
	opts = $.extend({}, defaultOpts, opts);
	
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
	
	// TODO: Make sure we don't copy `__events__` properties. (Also move into
	// `$.al.extend`?)
	
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

// ## Base types

// Every (non-native) type in **jQuery App Layer** is a subtype of this one.
$.al.Object = $.al.subtype({
	
	name: 'jQuery.al.Object',
	
	construct: function(v) {
		var value;
		this.valueOf = function(v, notify) {
			if (arguments.length === 0) {
				return value;
			}
		
			var change = value !== v;
			value = v;
			if (notify === true || change && notify !== false) {
				$(this).trigger('valuechange', { to: value });
			}
			return this;
		};
		
		// Don't bother to notify `valuechange` upon object instantiation, as
		// nobody has had the chance to bind an actual handler yet. Not even
		// an imaginary subtype of `$.al.Object`, as its constructor is
		// executed after this one.
		this.valueOf(v, false);
	},
	
	proto: {
		
		toString: function() {
			// We must not omit `.valueOf()` as it would result in an infinite
			// loop.
			return this.valueOf() + '';
		}
		
	}
});

$.al.Boolean = $.al.Object.subtype({
	
	name: 'jQuery.al.Boolean',
	
	args: [],
	
	construct: function(v) {
		
		$(this).bind('valuechange', function() {
			var args = arguments;
			args[0] = this.valueOf() ? 'valuetrue' : 'valuefalse';
			$.fn.trigger.apply($(this), args);
		});
		
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			var args = _.toArray(arguments);
			if (args.length > 0) {
				// If a new value has been provided, make sure that is gets
				// passed on as a boolean.
				args[0] = !!args[0];
			}
			return _valueOf.apply(this, args);
		};
		
		// We want to distinguish between instantiation without a value and
		// instantiation with a falsy value, as we want to be able to be
		// certain to be notified of the first value change, regardless of its
		// value (either `true` or `false`).
		if (arguments.length > 0) {
			this.valueOf(v);
		}
	}
	
});


var getObservables = function(value) {
	if (!(value instanceof Object)) {
		return [];
	}
	// TODO: Work-around JScript's DontEnum bug in the following
	// iterations.
	return _(value).chain().
		values().
		select(function(property) { return property instanceof Object; }).
	value();
};

$.al.Composite = $.al.Object.subtype({
	
	name: 'jQuery.al.Composite',
	
	args: [],
	
	construct: function(v) {
		
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			// Never provide the original composite object to the outside
			// world, for two reasons:
			// 1. As soon as we pass out the original object reference, the
			//    object can be altered without us being able to detect it and
			//    trigger a `valuechange` event. By not allowing this to
			//    happen we will probably prevent more problems and confusion
			//    than we will cause frustration, because the premise is
			//    simpler: if the composite changes, we can be certain that it
			//    will be notified through a `valuechange` event.
			// 2. In order for an object of any type (including a composite)
			//    to work with `$.al.Wrapper` it requires that the object's
			//    value is actually changed when it triggers a `valuechange`
			//    event. In the case of a composite; the composite object
			//    value's reference needs to be changed. Otherwise the change
			//    that is notified by the composite simply gets lost inside
			//    the wrapper who decides that the value did not actually
			//    change and does not trigger a `valuechange` event as a
			//    result.
			return $.extend({}, _valueOf.call(this));
		};
		
		var onPropertyChange = function() {
			_valueOf.call(this, _valueOf.call(this), true);
		};
		
		// TODO: We should be able to unbind these somehow, in order to allow
		// garbage collection to do its work. Probably leverage an
		// `$.al.Object`-level `destroy` method for this.
		// TODO: Somehow signal to `$.event.special.valuechange` that we want
		// all upcoming changes among the observables to be completed before
		// a `valuechange` handlers is being called.
		$(getObservables(v)).bind('valuechange', $.proxy(onPropertyChange, this));
		
		// This condition is not technically necessary (I think), but it makes
		// sense only to set a value if this was explicitly requested by the
		// instantiating party.
		if (arguments.length > 0) {
			_valueOf.apply(this, arguments);
		}
	},
	
	proto: {
		
		// TODO: Should we DRY up this `get` with `$.al.Record`'s `get`?
		get: function(path) {
			if (arguments.length === 0) {
				return this.valueOf();
			}
			// TODO: This deep lookup doesn't really have any use here.
			return $.getObject(path, this.valueOf());
		}
		
	}
	
});

$.al.Array = $.al.Object.subtype({
	
	name: 'jQuery.al.Array',
	
	args: function(length) {
		// If one numeric argument has been passed we follow Array's
		// interpretation and create an empty array of that length.
		if (arguments.length === 1 && _.isNumber(length)) {
			return [new Array(length)];
		}
		// The full list of arguments should be stored by the parent constructor
		// as one array value.
		// TODO: Do we really need to do the `_.toArray()` here?
		return [_.toArray(arguments)];
	},
	
	construct: function() {
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
				$(this).trigger('valuechange', { to: array.slice() });
			}
	
			return result;
		};
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
				$(this).trigger('valuechange', { to: array.slice() });
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
	
	args: function(loader) {
		if ($.isFunction(loader)) {
			return [];
		}
	},
	
	construct: function(l) {
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
		
		// TODO: Move to `.size('loaded')`.
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

$.al.Wrapper = $.al.Object.subtype({
	
	name: 'jQuery.al.Wrapper',
	
	args: [],
	
	// The `updater` argument determines when `filter` is executed (and
	// consequently the possibility of change of this object's value). One
	// could argue that the necessity of such a function contradicts with
	// **jQuery App Layer**'s basic premise that It All Just Works™ as long as
	// an object has a `valueOf` method and triggers `valuechange` events to
	// notify changes. `$.al.Wrapper` should not be an exception, and if you
	// want DOM elements to be wrapable you should define a dedicated type
	// that acts as a thin shell around the element. *But*; such a shell would
	// have basically the same implementation as `$.al.Wrapper`, except for a
	// few minor element-specific differences. So then we would end up with a
	// bunch of non-DRY code. Which leads us to the conclusion that
	// `$.al.Wrapper`'s responsibility needs to include being capable of
	// dealing with "custom"  objects (i.e. objects that do not comply to
	// **jQuery App Layer**'s conventions). That is where the `updater`
	// arguments comes in.
	construct: function(wrapped, filter, updater) {
		// We need `wrapped` to be of type `Object`. If it isn't already we
		// use `$.al.Object` instead of `Object` due to the embarrassing fact
		// that the following holds true in IE8:
		//   `new Object([object HTMLElement]) instanceof Object === false`
		if (!(wrapped instanceof Object)) wrapped = $.al.Object(wrapped);
		// TODO: A(n small) optimization would be to just skip calling a
		// function if `filter` is not one.
		if (!$.isFunction(filter)) filter = function(value) { return value; };
		// `updater` can be defined as a string of event type(s) which should
		// be observed, or as a function that calls its argument whenever an
		// update should be done.
		if (updater === undefined) updater = 'valuechange';
		if (typeof updater === 'string') {
			var eventType = updater;
			updater = function(update) {
				$([wrapped]).bind(eventType, update);
			};
		}
		
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			return _valueOf.call(this);
		};
		
		var update = function() {
			var result = filter.call(this, wrapped.valueOf());
			// If `filter` does not return anything, don't update the
			// wrapper's value. This allows for delays and conditions.
			if (result !== undefined) _valueOf.call(this, result);
		};
		
		updater.call(this, $.proxy(update, this));
		
		update.call(this);
		
		// TODO: Provide a means to unwrap; make this object
		// garbage-collectible (i.e. `.unbind('valuechange', update)`). We
		// should probably leverage an `$.al.Object`-level `destroy` method
		// for this.
	}
	
});

$.al.Conditional = $.al.Wrapper.subtype({
	
	name: 'jQuery.al.Conditional',
	
	args: function(wrapped, condition) {
		// `undefined` condition is interpreted as "no condition".
		if (condition === undefined) condition = true;
		if (!(condition instanceof Object)) condition = new Boolean(condition);
		
		return [$.al.Composite({
			wrapped: wrapped,
			condition: condition
		}), function(value) {
			if (value.condition.valueOf()) return value.wrapped.valueOf();
		}];
	}
	
});

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
/*
$.al.Conjunction = $.al.Wrapper.subtype({
	
	name: 'jQuery.al.Conjunction',
	
	args: [$.al.Composite()],
	
	construct: function() {
		
		this.operand = function(o) {
			
		};
		
	}
	
});
*/
}(jQuery));