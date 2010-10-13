(function($) {

$.control = {};

$.control.property = function(type, initial) {
	return $.al.Meta(type).
		sleep(true).
		val(initial);
};

$.control.field = function(initial) {
	return $.al.Meta($.al.Field).
		sleep(true).
		val(initial);
};

$.control.conjunction = function(initial) {
	return $.al.Meta($.al.ConjunctionField).
		sleep(true).
		val(initial);
};

$.control.Controller = $.al.ResigClass.extend({
	
	init: function(element) {
		var self = this;
		
		if (!(element instanceof $)) {
			element = $(element);
		}
		this.element = element;
		
		var member,
			fieldDefinitions = {};
		
		// Make this a valid controller instance by replacing all field
		// definitions with actual fields. From this moment on, controller
		// members can safely be bound and observed.
		for (member in this) {
			if (this[member] instanceof $.al.Meta) {
				fieldDefinitions[member] = this[member];
				this[member] = this[member].instance(undefined, this);
				// FIXME: we should be able to chain this onto the previous
				// line of code. But this caused problems, so look into this
				// upon testing.
				this[member].triggersOn(this.element);
				// 
				// fieldDefinitions[member] = this[member];
				// this[member] = fieldDefinitions
				// // W00t this is TEM-PO-RA-RY!
				// if (fieldDefinitions[member].playbackConjunction) {
				// 	this[member] = $.al.ConjunctionField(undefined, this);
				// } else {
				// 	this[member] = $.al.Field(undefined, this);
				// }
			}
		}
		
		var prefix, observed, observer;
		
		// Setup some automagical method bindings.
		for (member in this) {
			
			if ($.isFunction(this[member])) {
				
				prefix = 'observe';
				if (member.length > prefix.length && member.substr(0, prefix.length) === prefix) {
					observed = member.substr(prefix.length, 1).toLowerCase() + member.substr(prefix.length + 1);
					if (this[observed] instanceof $.al.Field) {
						observer = this[member];
						this[observed].observe(observer);
					}
				}
			
				// Bind any method that starts with 'on' as a handler to the
				// corresponding event on the controller's element.
				prefix = 'on';
				if (member.length > prefix.length && member.substr(0, prefix.length) === prefix) {
					this.element.bind(member.substr(2, 1).toLowerCase() + member.substr(3), $.proxy(this, member));
				}
				
			}
			
		}
		
		// Add baseline display events before recorder is played-back, to
		// allow controller definitions to adjust or clear them if desired.
		if (this.display instanceof $.al.Field) {
			this.display.
				triggers('controldisplaychange').
				triggers({
					controlshow: true,
					controlhide: false
				});
		}
		
		for (member in fieldDefinitions) {
			fieldDefinitions[member].playback(this[member]);
		}
		
	},
	
	displayInit: $.noop,
	
	observeDisplay: function(value) {
		this.element[value ? 'show' : 'hide']();
		if (value && this.displayed !== true) {
			this.displayed = true;
			this.displayInit();
		}
	}
	
});

$.fn.control = function(action, value) {
	if (typeof action !== 'string') {
		value = action;
		this.control('extend', value);
		return this.control('init');
	}
	
	return this.each(function() {
		var $this = $(this);
		
		// TODO: if instance exists, we do nothing. It would be nice if we could
		// just override earlier instances, but that's scary as those are potentially
		// already referenced in a gazillion places, which would result in the instance
		// remaining active but no within reachable.
		if ($this.fetch('control', 'instance')) {
			return true;
		}
		
		var Class = $this.fetch('control', 'class') || $.control.Controller;

		if (action === 'extend') {
			$this.store('control', 'class', Class.extend(value));
			return true;
		}

		if (action === 'init') {
			var instance = new Class(this);
			for (member in instance) {
				if (instance[member] instanceof $.al.Field) {
					instance[member].sleep(false);
				}
			}
			$this.store('control', 'instance', instance);
			return true;
		}
		
	});
	
};

}(jQuery));
