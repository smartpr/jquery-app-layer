(function($, undefined) {

var needSetup = new HashSet();

$.fn.component = function(action, arg) {
	if (typeof action !== 'string') {
		arg = action;
		action = 'define';
	}
	
	if (action === 'binding') {
		// `arg` is the key of the property which is to be bound.
		
		var $this = this.eq(0);
		
		// We do not care if `component[arg]` is still a property instance or
		// if it is already installed, as `$.al.Property`'s constructor can
		// deal with both and they will all eventually lead to the actual
		// value, which is what a binding ultimately is all about.
		return $.al.Property(function() {
			var component = $this.fetch('component', 'definition');
			
			// We need the actual component object in order to get to its
			// properties, but we do not want to touch setup status.
			if ($.isFunction(component)) component = component(false);
			
			return component[arg];
		}, true);
	}
	
	// `arg` is a definition of the properties that need to go on the
	// component.
	
	if (arg !== undefined) {
		
		this.each(function() {
			var $this = $(this),
				properties = {},
				parent = $this.fetch('component', 'definition');
			
			// Since `arg` is a definition that may be used for more elements
			// than just `this`, we need to derive an independent definition
			// from it.
			for (key in arg) {
				properties[key] = arg[key];
				if (properties[key] instanceof $.al.Property) {
					properties[key] = properties[key].clone();
				}
			}
			
			// We don't inherit from components that are already setup. We are
			// not sure if it's technically or conceptually impossible, but we
			// cannot think of a decent use case. In that light, if we end up
			// trying to do so, this is most probably not intended and can
			// therefore best be ignored.
			if (parent !== undefined && !$.isFunction(parent)) return true;
			
			// A feature of `$.fn.component` is that each component is
			// automatically given an `element` property. We do not need to
			// wrap it inside a `$.al.Property` object as it does not have any
			// behavior attached to it upon setup. This can be added by the
			// caller by providing an inheriting property at key `element`. We
			// obtain the component that was already defined on this element
			// in order to inherit from it.
			parent = $.extend({ element: this }, $.isFunction(parent) ? parent(false) : parent);
			
			$.each(parent, function(key, property) {
				// Inheritance can occur directly, if the current component
				// does not contain a definition for a particular property (or
				// this definition is `undefined`, which means "inherit from
				// parent component").
				if (properties[key] === undefined) {
					properties[key] = property;
				}
				// Or the current component contains a property without a
				// value, in which case the parent property will be assigned
				// as its value. Note that `.isEmpty()` is used to as opposed
				// to `.valueOf() === undefined` because the latter would
				// evaluate lazily defined values, which is not something we
				// would like to do at this stage, as they might refer to
				// other properties or values that have yet to be defined
				// (defined; as in constructed without installation and
				// setup).
				else if (properties[key] instanceof $.al.Property && properties[key].isEmpty()) {
					properties[key].valueOf(property);
				}
			});
			
			// Create component, but don't set it up just yet.
			$this.store('component', 'definition', $.component(properties, false));
			needSetup.add(this);
		});
		
	}
	
	if (action === 'setup') {
		
		this.each(function() {
			var $this = $(this);
			
			var component = $this.fetch('component', 'definition');
			
			// If a component is already setup, move on.
			if (!$.isFunction(component)) return true;
			
			// Setup the component (by calling the stored setup function).
			$this.store('component', 'definition', component());
			needSetup.remove(this);
		});
		
	}
	
	return this;
};

$.component = function() {
	return $.al.Component.apply(undefined, arguments);
};

$.component.setup = function(cb) {
	$(needSetup.values()).component('setup');
	// TODO: Replace this dumb timeout with a mechanism which observes the
	// call stack and calls `cb` when it is empty. Should probably go into
	// `$.event.special.valuechange`.
	setTimeout(cb, 1000);
};

// The significance of `$.component.property` as opposed to `$.al.Property` is
// that this one has a more specific use-case. It is for use on a component,
// it always has a value other than `undefined` (which means it is never
// interpreted as inheriting property in the context of a component), and it
// tries to trigger an event on the element (if available) upon value change.
$.component.property = function() {
	var property;
	if (arguments.length === 2) {
		// Property is defined in terms of (a binding to) another property.
		property = $(arguments[0]).component('binding', arguments[1]);
	} else if (arguments[0] instanceof $.al.Object) {
		// TODO: We should verify if we really need to take instances, as it
		// doesn't really make things more intuitive. On top of that, it is
		// impossible to always guess correctly if an argument is intended as
		// an instance or a type.
		// TODO: The condition we are using in the preceding line is sloppy.
		// Property is defined in terms of its value.
		property = $.al.Property(arguments[0]);
	} else {
		// Property is defined in terms of its type.
		var Type = arguments[0] === undefined ? $.al.Object : arguments[0];
		property = $.al.Property(function() { return new Type(); }, true);
	}
	return property.setup(function(me, key) {
		var component = this;
		
		if (!('element' in component)) return;
		
		$([me]).bind('valuechange', function() {
			var args = _.toArray(arguments);
			args[0] = 'component:valuechange:' + key;
			$.fn.trigger.apply($([component.element]), args);
		});
	});
};

// TODO: Run inherited setup(?)
$.component.inherit = function() {
	// Does not use `$.component.property`, as it is explicitly not intended
	// for creating inheriting properties.
	return $.al.Property().setup(function(me, key, setupParent) {
		if ($.isFunction(setupParent)) setupParent();
	});
};

// The interface of `$.component.flag` is identical to that of
// `$.component.property`, with the slight difference that if no type has been
// specified (which is the usual scenario for a flag), it will use
// `$.al.Boolean` (where a `$.component.property` uses `$.al.Object`).
$.component.flag = function() {
	return $.component.property.apply(this, arguments.length === 0 ? [$.al.Boolean] : arguments).setup(function(me, key) {
		var component = this;
		if ('element' in component) {
			$([me]).bind('valuechange', function() {
				$([component.element]).toggleSwitch(key, this.valueOf());
			});
		}
		me.valueOf(false);
	});
};

// Returns a function to setup `component`, allowing for delayed setup which
// in turn allows for creating multiple interdependent components without
// having to worry about definition order.
var createSetupKit = function(component) {
	return function(setup) {
		if (setup !== false) {
			var setups = [];
			// First make sure we assign all values, so setup functions can
			// freely reference them all.
			$.each(component, function(key, property) {
				if (!(property instanceof $.al.Property)) {
					return true;
				}
				setups.push(property.install(component, key));
			});
			// Then run all setup functions. We do not have an ordering
			// problem (race condition) here as all property values are
			// already assigned, and handlers that are bound to `valuechange`
			// events of internal property values will only be called after
			// the call stack has been cleared (thanks to
			// `$.event.special.valuechange`).
			for (var i = 0, l = setups.length; i < l; i++) {
				setups[i]();
			}
		}
		return component;
	};
};

$.al.Component = $.al.subtype({
	
	name: 'jQuery.al.Component',
	
	construct: function(properties, setup) {
		var self = this;
		
		// TODO: Deal with JScript's DontEnum bug (see `$.al.extend`). And the
		// same for all other places where an object's properties are iterated
		// over.
		$.each(properties, function(key, property) {
			// TODO: Do we really need to put a value into a property if it
			// isn't already? Isn't it simply already "installed"?
			self[key] = property instanceof $.al.Property ? property : $.al.Property(property);
		});
		
		if (setup !== false) createSetupKit(this).call();
	},
	
	type: {
		
		call: function(properties, setup) {
			if (setup !== false) {
				// As `$.al.Component` does not subtype from a custom type, we
				// will have to create a custom type in order to get to a
				// default implementation of a type's `call` method.
				return $.al.subtype().call.apply(this, arguments);
			}
			return createSetupKit(this.instantiate(properties, setup));
		}
	
	}
	
});

// Although `$.al.Property` is (currently) exclusively used in the context of
// components, its concept is more generic than that. It allows defining and
// installing a value and related behavior onto any context, not just
// components.
$.al.Property = $.al.Object.subtype({
	
	name: 'jQuery.al.Property',
	
	construct: function(v, lazy) {
		
		var _valueOf = this.valueOf,
			isLazy;
		this.valueOf = function(v, lazy, notify) {
			if (arguments.length > 0) {
				isLazy = lazy;
				return _valueOf.call(this, v, notify);
			}
			
			var value = _valueOf.call(this);
			if (isLazy === true && $.isFunction(value)) {
				// We are dealing with a "get" call, and the value is to be
				// evaluated lazily.
				value = value.call(this);
				// A property should be consistent with respect to its value.
				// I.e. it should not deliver a different value upon every
				// request. In case of a lazily defined value this means that
				// we should make sure that the evaluation function is only
				// executed once, after which the property turns into a non-
				// lazy state.
				this.valueOf(value, false, false);
			}
			return value;
		};
		
		// This enables one to check for emptiness without losing potential
		// laziness.
		this.isEmpty = function() {
			// Known laziness entails non-emptiness. Make sure to preserve
			// lazy state in that scenario.
			return isLazy !== true && this.valueOf() === undefined;
		};
		
		var setups = [];
		this.setup = function(s) {
			setups.push(s);
			return this;
		};
		
		this.clone = function() {
			var clone = $.al.Property(_valueOf.call(this), isLazy);
			for (var i = 0, l = setups.length; i < l; i++) {
				clone.setup(setups[i]);
			}
			return clone;
		};
		
		this.install = function(context, key) {
			// Obtain value once at the beginning in order to guarantee that
			// we are using the same value in the install and setup steps of
			// the process.
			var value = this.valueOf(),
				valueSetup;
			
			if (value instanceof $.al.Property) {
				// This property holds another property, so delegate
				// installation and store its setup function.
				valueSetup = value.install(context, key);
				// `this.valueOf()` has not returned the actual value, but an
				// inherited property, so update `value` as soon as we can be
				// certain that we have found the property value.
				value = context[key];
			} else {
				context[key] = value;
			}
			
			return function() {
				for (var i = 0, l = setups.length; i < l; i++) {
					setups[i].call(context, value, key, valueSetup);
				}
			};
		};
		
		this.valueOf(v, lazy, false);
		
	},
	
	args: []
	
});

}(this.jQuery));
