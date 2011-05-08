(function($, undefined) {

// TODO: Why is this type here, given that we already have wrapper.Value?
$.al.type.Object = $.al.subtype({
	
	name: 'jQuery.al.type.Object',
	
	construct: function(v) {
		
		var value;
		this.valueOf = function(v, notify) {
			if (arguments.length === 0) return value;
			
			var $this = $(this),
				from = value,
				to = v;
			
			// TODO: De-uglify
			if (notify === true || !this.valueEquals(to)) {
				if (notify === false) {
					value = to;
				} else {
					var pass;
					if (to instanceof $.record.Account) {
						pass = $this.triggerHandler('change:before', [to, from]);
					} else {
						pass = $this.triggerHandler('change:before', [to, from]);
					}
					if (pass === false) {
						$this.triggerHandler('change:fail', [to, from]);
					} else {
						value = to;
						$this.triggerHandler('change', [to, from]);
						$this.triggerHandler('change:done', [to, from]);
					}
				}
			}
			
			return this;
		};
		
		// Don't bother to notify `change` upon object instantiation, as
		// nobody has had the chance to bind an actual handler yet. Not even
		// an imaginary subtype of `$.al.type.Object`, as its constructor is
		// executed after this one.
		// ==> this is now a hard requirement because notifications here will
		// result in the event handlers in $.al.type.Value being called due to
		// the delay that is inflicted in jquery.al.events.js.
		this.valueOf(v, false);
	},
	
	proto: {
		
		// TODO: Make overridable without losing the event triggers by defining
		// a custom subtype method on this type that wraps event triggering
		// around a new destroy implementation.
		// ALTERNATIVE: Don't implemenent actual destroy (and invalidate) stuff
		// in this method, but instead handle the corresponding events and do
		// it wherever you want it (except here).
		destroy: function() {
			// TODO: include destroy:before and destroy:fail?
			$(this).triggerHandler('destroy');
			
			// TODO: Abstract event triggering (:before, :fail, :done) in plugin?
			// $(this).triggerEvents('destroy', function() { ... destroy implementation ... })
			
			return this;
		},
		
		equals: function(other) {
			return this === other;
		},
		
		// TODO: Do we really need this? Where will this need a different
		// implementation than the one provided here?
		valueEquals: function(v) {
			return this.valueOf() === v;
		},
		
		toString: function() {
			// We must not omit `valueOf()` as it would result in an infinite
			// loop.
			return this.valueOf() + '';
		}
		
	}
	
});

}(this.jQuery));