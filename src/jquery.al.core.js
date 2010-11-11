(function($) {

$.al = $.al || {};

var initializing = false;
var Flag = function() {};
var flag = new Flag();
$.al.MolendijkClass = function() {
	if (!(this instanceof $.al.MolendijkClass)) {
		return new $.al.MolendijkClass();
	}
};

// WISHLIST:
// - subclassing native objects (other than Object), f.e. Array.
// - ability to alter constructor arguments, f.e. to have $.record.Array()
//	work with different instantiation parameters than Array(). ==> not sure if
//	we really want/need this.
// - find out if a class is a subclass of another, f.e. to check if class x
//	is the same as or a subclass of $.al.Class.
// - allow supplying a name upon subclassing, which is used in toString.
// - create an Array class in a class property.
// - put/keep stuff in prototype whenever it is possible.
// - instantiation is curried if no new operator is used.
// - can/should $.al.Value.Array be of type $.al.Value?

// Problem: because we are trying to emulate inheritance by merely *wrapping*
// an instance of another class, there is some unexpected behavior. If an
// instance of the extended class overrides a method, one would expect other
// methods from the superclass that use that method to start using that new
// method instead. That's how classical OOP works. But that's not the case
// here. Also; if the instance of the superclass has methods that return
// 'this', one would expect these to return these to be of the type of the
// subclass. Yet, that's not the case.
$.al.MolendijkClass.extend = function(wrap) {
	// TODO: Make it possible to extend native classes (other than Object) --
	// should work for most (not for Function, RegExp(?)).
	var Class = this;
	var Subclass = function() {
		// idea: i can also instantiate Subclass without arguments if
		// this is not an instance of Subclass, and then use the supplied
		// arguments to this function call (as it's not an instantiation)
		// in the remainder. Then at last return the instantiated Subclass.
		if (!(this instanceof Subclass)) {
			return new Subclass(flag, arguments);
		}
		if (!initializing) {
			var args;
			if (arguments[0] === flag) {
				args = arguments[1];
			} else {
				args = $.makeArray(arguments);
			}
			var parent = Class.apply(undefined, args);
			// TODO: don't copy properties that are only present
			// on the parent's prototype (and not on its instance) -- one of
			// them: constructor
			var self = this;
			$.each(parent, function(key, value) {
				self[key] = value;
				// if ($.isFunction(value)) {
				// 	self[key] = function() {
				// 		console.log(key + ': pass to parent');
				// 		console.log(this);
				// 		console.log(value);
				// 		console.log('with arguments:');
				// 		console.log(arguments);
				// 		var t = value.apply(this, arguments);
				// 		console.log('returned by parent (' + key + ')');
				// 		console.log(t);
				// 		return t;
				// 	};
				// } else {
				// 	self[key] = value;
				// }
			});
			// for (p in parent) {
			// 	// this[p] = parent[p];
			// 	if ($.isFunction(parent[p])) {
			// 		this[p] = function() {
			// 			console.log('pass to parent');
			// 			console.log(this);
			// 			console.log(parent[p]);
			// 			var t = parent[p].apply(this, arguments);
			// 			console.log(t);
			// 			return t;
			// 		};
			// 	} else {
			// 		this[p] = parent[p];
			// 	}
			// }
			wrap.apply(this, args);
		}
	};
	initializing = true;
	Subclass.prototype = new Class();
	initializing = false;
	Subclass.extend = this.prototype.constructor.extend;
	Subclass.prototype.constructor = Subclass;
	return Subclass;
};
// TODO: add 'create' class method.

// TODO: Support for supplying an object instance as value for methods.
$.al.Meta = $.al.MolendijkClass.extend(function(type, instance, playback) {
	if (typeof instance !== 'string') {
		instance = 'instance';
	}
	if (typeof playback !== 'string') {
		playback = 'playback';
	}
	
	this[instance] = function() {
		return type.apply(this, arguments);
	};
	
	this[playback] = function(on) {
		if (!(on instanceof type)) {
			on = this[instance].apply(this, arguments);
		}
		for (var i = 0, l = record.length; i < l; i++) {
			on[record[i].method].apply(on, record[i].arguments);
		}
		return on;
	};
	
	var self = this,
		methods = _.keys(this[instance]()),
		record = [];
	$.each(methods, function(i, method) {
		self[method] = function() {
			record.push({
				method: method,
				// context: this,
				arguments: arguments
			});
			return this;
		};
	});
	
});

$.al.Field = $.al.MolendijkClass.extend(function(base, context) {
	var $registry = $('<div />');
	
	var lastSignal = {};
	var signal = function(type) {
		var change = {
			from: type in lastSignal ? lastSignal[type] : this.base(),
			to: this.val()
		};
		if (change.from !== change.to) {
			lastSignal[type] = change.to;
			$registry.trigger('fieldchange' + type, change);
		}
	};
	var notify = function() {
		if (this.sleep()) {
			return;
		}
		signal.call(this, 'silent');
		if (this.notifies()) {
			signal.call(this, 'notify');
		}
	};
	
	// The idea behind base is that it is the field's baseline value; the
	// value against which is decided if a value change has occurred or not.
	// Setting the base value will never cause notifications.
	// FIXME: Get rid of this concept.
	this.base = function(i) {
		if (arguments.length === 0) {
			return base;
		}
		base = i;
		return this;
	};
	
	var val;
	this.val = function(v) {
		if (arguments.length === 0) {
			return val === undefined ? this.base() : val;
		}
		val = v;
		notify.call(this);
		return this;
	};
	
	this.context = function(c) {
		if (arguments.length === 0) {
			return context === undefined ? this : context;
		}
		context = c;
		return this;
	};
	
	// TODO: We can move this one to prototype (but do we want to?)
	this.bind = function() {
		var args = arguments,
			binding;
		
		// Scenario 1: binding is defined in a setup function.
		if (args.length === 1 && $.isFunction(args[0])) {
			binding = args[0];
		}
		
		// Scenario 2: binding is defined as an event handler and optional
		// data tree path.
		else if (args.length >= 2 && typeof args[1] === 'string') {
			binding = function(val) {
				var on = args[0];
				if (!(on instanceof $)) {
					on = $(on);
				}
				on.bind(args[1], function(e, data) {
					for (var i = 2, l = args.length; i < l; i++) {
						if ($.isFunction(args[i])) {
							return args[i].apply(this, $.merge([val], arguments));
						}
						data = data[args[i]];
					}
					val(data);
				});
			};
		}
		
		// Scenario 3: binding is defined as an observer for a field which is
		// held in a property of our context.
		else if (args.length >= 1 && typeof args[0] === 'string') {
			binding = function(val) {
				this[args[0]].observe(function(v) {
					if ($.isFunction(args[1])) {
						return args[1].call(this, val, v);
					}
					val(v);
				}, args[2]);
			};
		}
		
		if ($.isFunction(binding)) {
			binding.call(this.context(), $.proxy(this, 'val'));
		}
		
		return this;
	};
	
	this.observe = function(observer, condition) {
		var self = this,
			observerCondition = true,
			d, evt;
		var callObserver = function(e, data) {
			if (!e || !data || !observerCondition) {
				d = data;
				evt = e;
				return;
			}
			// TODO: Supply of data.from is not documented/tested.
			if (observer.call(self.context(), data.to, data.from) === false) {
				// TODO: Using return value for this purpose should be tested.
				$registry.unbind(e);
			}
			d = undefined;
			evt = undefined;
		};
		if (condition instanceof $.al.Field) {
			condition.observe(function(v) {
				observerCondition = !!v;
				callObserver(evt, d);
			});
			observerCondition = condition.val();
		}
		$registry.bind('fieldchange' + (condition === null ? 'silent' : 'notify'), function(e, data) {
			callObserver(e, data);
		});
		return this;
	};
	
	var triggersOn;
	this.triggersOn = function(on) {
		if (arguments.length === 0) {
			return triggersOn === undefined ? this.context() : triggersOn;
		}
		triggersOn = on;
		return this;
	};
	
	var triggers = {};
	var always = function() {
		return true;
	};
	this.triggers = function(events) {
		if (arguments.length === 0) {
			return triggers;
		}
		
		var extension = {};
		
		// Short-cut to trigger on every change.
		if (typeof events === 'string') {
			extension[events] = always;
		}
		// Any sort of object is interpreted as a collection of trigger
		// behavior.
		else if (typeof events === 'object') {
			$.each(events, function(key, value) {
				if ($.isFunction(value)) {
					extension[key] = value;
				} else {
					extension[key] = function(v) {
						return v === value;
					}
				}
			});
		}
		
		if (!$.isEmptyObject(extension)) {
			$.extend(triggers, extension);
		}
		// A falsy value means trigger no events at all.
		else if (!events) {
			triggers = {};
		}
		
		return this;
	};
	
	// We do not create a field instance before notifies is explicitly set
	// because otherwise we would end up in a field instantiation loop.
	var notifies;
	this.notifies = function(condition) {
		if (arguments.length === 0) {
			return notifies === undefined ? true : !!notifies.val();
		}
		// TODO: Functions should not be evaluated now but every time the
		// notifies value is needed. It would be nice if we can implement this
		// behavior by adding this feature to the general field
		// implementation.
		if ($.isFunction(condition)) {
			condition = condition.call(this.context());
		}
		// String values are interpreted as properties of our context.
		else if (typeof condition === 'string') {
			condition = this.context()[condition];
		}
		if (!(condition instanceof $.al.Field)) {
			condition = $.al.Field(condition);
		}
		// notifies is now guaranteed to be a field.
		var self = this;
		notifies = condition.observe(function() {
			// notify can be safely called at any time, regardless of the
			// value of notifies and the value that was last notified, as it
			// will check for itself if it needs to do actual signaling.
			notify.call(self);
		});
		// Observer is not called for current value of notifies, so call
		// notify right now as well.
		notify.call(this);
		return this;
	};
	// FIXME: temporary
	this.notifiesField = function() {
		return notifies instanceof $.al.Field ? notifies : undefined;
	};
	
	var sleep = false;
	this.sleep = function(s) {
		if (arguments.length < 1) {
			return sleep;
		}
		sleep = !!s;
		notify.call(this);
		return this;
	};
	
	// Triggering events is always done along with notification, so we can
	// define one in terms of the other.
	var self = this;
	this.observe(function(v) {
		var eventData = {
				to: v
			};
		$.each(self.triggers(), function(type, condition) {
			if (condition.call(self.context(), v) === true) {
				var on = self.triggersOn();
				if (!(on instanceof $)) {
					on = $(on);
				}
				on.trigger(type, eventData);
			}
		});
	});
	
});

$.al.ConjunctionField = $.al.Field.extend(function() {
	var operands = [];
	
	delete this.bind;
	
	// TODO: use 'bind' instead of 'operand'.
	this.operand = function() {
		var self = this,
			operand = $.al.Field(false, this.context());
		operand.
			observe(function(v) {
				var conjunction = true;
				for (var i = 0, l = operands.length; i < l; i++) {
					conjunction = conjunction && !!operands[i].val();
				}
				// TODO: self is here *always* an instance of
				// $.al.ConjunctionField, even if this constructor is being
				// called as the result of the instantiation of a subclass.
				// Is this safe??
				self.val(conjunction);
			}).
			bind.apply(operand, arguments);
		operands.push(operand);
		return this;
	};
	
});

$.al.List = $.al.Field.extend(function() {
	var fetcher;
	this.fetcher = function(f) {
		if (arguments.length < 1) {
			return fetcher;
		}
		fetcher = f;
		return this;
	};
	
	this.fetch = function() {
		if ($.isFunction(this.fetcher())) {
			this.fetcher().call(this.context(), $.proxy(this, 'val'));
		}
		return this;
	};
	
});


}(jQuery));

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.al.ResigClass = function(){};
  
  // Create a new Class that inherits from this class
  this.al.ResigClass.extend = function(prop) {
    var _super = this.prototype;
    
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
    
    return Class;
  };
}).call(jQuery);



// Idea for a state-less kind of $.Widget
// 
// $.al.plugin = function(methods) {
// 	
// }
// 
// $.fn.flirt = $.al.plugin({
// 	
// 	closest: function() {
// 		
// 	},
// 	
// 	template: function() {
// 		
// 	}
// 	
// });
