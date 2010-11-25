(function($, undefined) {
/*
$.fn.component = function(definition) {
	
	return this.each(function() {
		var $this = $(this);
		
		var component = ($this.fetch('component', 'type') || $.component.Component).subtype({
			
			
			
		});
		
		var parsed = $.component($.extend({}, definition), base);
		
		$this.store('component', 'definition', parsed);
	});
	
};
*/

$.component = {};

function setupComponent() {
	for (var key in this.constructor.prototype) {
		if (this.constructor.prototype[key] instanceof $.component.Property) {
			this.constructor.prototype[key].setup(this);
		}
	}
	return this;
};

// TODO: Put all type definitions under `$.al`.
$.component.Component = $.al.subtype({
	
	name: 'jQuery.component.Component',
	
	construct: function(setup) {
		
		// TODO: Ignore bindings.
		for (var key in this) {
			if (this[key] instanceof $.component.Property) {
				this[key] = this[key].valueOf();
			}
		}
		if (setup !== false) setupComponent.call(this);
	},
	
	args: [],
	
	type: {
		
		subtype: function(opts) {
			var Base = this,
				properties = {}
			
			// TODO: We could use `_.reduce()`.
			$.each(opts, function(key, value) {
				if (!(value instanceof $.component.Property)) {
					value = new $.component.Property(value);
				}
				if (Base.prototype) value.parent(Base.prototype[key]);
				properties[key] = value;
			});
			
			// TODO: See corresponding implementation in `$.al.Record`.
			return $.al.subtype({
				
				base: Base,
				
				proto: properties
				
			});
		},
		
		call: function() {
			return $.proxy(setupComponent, this.instantiate(false));
		}
		
	}
	
});

$.component.Property = $.al.Object.subtype({
	
	name: 'jQuery.component.Property',
	
	construct: function() {
		
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			var v = _valueOf.call(this);
			return v !== undefined ? v :
				parent instanceof $.component.Property ? parent.valueOf() :
				undefined;
		};
		
		var parent;
		this.parent = function(p) {
			parent = p;
			return this;
		};
		
		var setups = [];
		this.setup = function(s) {
			if (s instanceof $.component.Component) {
				// Execute setup in context of `s`.
				for (var i = 0, l = setups.length; i < l; i++) {
					setups[i].call(s);
				}
			} else {
				// Add `s` to list of setup functions.
				setups.push(s);
			}
			return this;
		};
		
	}
	
});
/*
$.component.property = function(type) {
	if (arguments.length === 0) {
		type = $.al.Object;
	}
	return new $.component.Property(new $.al.CurriedObject(type));
};

$.component.switch = function() {
	
	return $.component.property().setup(function(me) {
		// TODO: toggle switch css class.
	});
	
};

$.component.inherit = function() {
	
	return new $.component.Property();
	
};

$.component.binding = function(element, property) {
	
	return new $.component.Property();
};
*/
}(this.jQuery));



/*
(function($) {

var pending = [];

$.fn.component = function(action, definition) {
	if (arguments.length === 1 && typeof action !== 'string') {
		definition = action;
		action = 'define';
	}
	
	return this.each(function() {
		var $this = $(this),
			elementDefinition,
			parentDefinition = $this.fetch('component', 'definition') || {};
		
		if (definition) {
			elementDefinition = $.extend({}, definition, { element: new $.component.Property(undefined, definition.element) });
			// TODO: Work-around DontEnum bug.
			$.each(elementDefinition, function(key, property) {
				if (!(property instanceof $.component.Property)) {
					return true;
				}
				if (!(key in parentDefinition)) {
					return true;
				}
				var parentProperty = parentDefinition[key],
					inheritProperty = new $.component.Property();
				inheritProperty.type = property.type || parentProperty instanceof $.component.Property ? parentProperty.type : parentProperty;
				inheritProperty.setup = function() {
					var args = _.toArray(arguments);
					if (parentProperty instanceof $.component.Property) {
						args.push(parentProperty.setup);
					}
					property.setup.apply(this, args);
				};
				elementDefinition[key] = inheritProperty;
			});
			$this.store('component', 'definition', $.extend({}, parentDefinition, elementDefinition));
		}
		
		// TODO: None of the elements should be started before all of them are
		// defined.
		if (action === 'start') {
			elementDefinition = $this.fetch('component', 'definition');
			
			var component = {};
			$.each(elementDefinition, function(key, property) {
				if (key === 'element') {
					component[key] = $this[0];
				} else if (property instanceof $.component.Property) {
					component[key] = new property.type();
				} else {
					component[key] = property;
				}
				$(component[key]).bind('valuechange', function(e, data) {
					$(component.element).trigger('componentchange:' + key, data);
				});
			});
			
			// TODO: None of the elements should be setup before all of them
			// are instantiated.
			$.each(elementDefinition, function(key, property) {
				if (property instanceof $.component.Property) {
					property.setup.call(component, component[key], key);
				}
			});
			
			// component.start();
		}
	});
	// 
	// 
	// // TODO: Deal with inheritance where necessary.
	// this.store('component', 'definition', $.extend(this.fetch('component', 'definition'), definition));
	// 
	// // TODO: Loop `this`.
	// if (action === 'start') {
	// 	definition = this.fetch('component', 'definition');
	// 	
	// 	var component = {};
	// 	for (field in definition) {
	// 		if ($.isPlainObject(definition[field]) && definition[field].instance) {
	// 			component[field] = new $.al.Decorator();
	// 		} else {
	// 			component[field] = definition[field];
	// 		}
	// 	}
	// 	component.element = this[0];
	// 	
	// 	for (field in definition) {
	// 		if ($.isPlainObject(definition[field]) && definition[field].instance) {
	// 			component[field].decorate(definition[field].instance.call(component));
	// 		}
	// 	}
	// 	
	// 	component.start();
	// 	
	// }
	// 
	// return this;
	// 
};

$.component = {};

$.component.start = function(cb) {
	$(window).component('start');
	$('#nav, #contact-list').component('start');
	
	// TODO: Should only be called when we are certain that all component-related
	// code has finished running (i.e. valuechange callstack is empty or sth like that)
	cb();
};

$.component.Property = $.al.Object.subtype({
	
	name: 'jQuery.component.Property',
	
	construct: function(type, setup) {
		this.type = type;
		this.setup = setup;
	}
	
});

$.component.property = function(type, setup) {
	if (arguments.length === 1) {
		setup = type;
		type = $.al.Object;
	}
	
	return new $.component.Property(type, setup);
};

// TODO: rename to $.component.switch (corresponds with $.al.toggleSwitch).
$.component.flag = function() {
	var operands = _.toArray(arguments);
	return $.component.property(function(me, name) {
		var component = this,
			ops = [];
		$(me).bind('valuechange', function() {
			$(component.element).
				removeClass(this.valueOf() ? ('no-' + name) : name).
				addClass(this.valueOf() ? name : ('no-' + name));
		});
		var update = function(ops) {
			for (var i = 0, l = ops.length; i < l; i++) {
				if (!ops[i].valueOf()) {
					me.valueOf(false);
					return;
				}
			}
			me.valueOf(true);
		};
		$.each(operands, function(i, operand) {
			var op = new $.al.Object(false);
			ops.push(op);
			$(op).bind('valuechange', function() {
				update(ops);
			});
			operand.call(component, function(flag) {
				// TODO: return value?
				op.valueOf(!!flag);
			});
		});
		update(ops);
	});
};

$.component.binding = function(element, key) {
	return $.component.property(function(me) {
		$(element).bind('componentchange:' + key, function(e, data) {
			me.valueOf(data.to);
		});
	});
};

}(jQuery));
*/