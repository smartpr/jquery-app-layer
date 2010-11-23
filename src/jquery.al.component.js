(function($) {

var pending = [];

$.fn.component = function(action, definition) {
	if (arguments.length === 1) {
		definition = action;
		action = 'define';
	}
	
	return this.each(function() {
		var $this = $(this),
			elementDefinition,
			parentDefinition = $this.fetch('component', 'definition') || {};
		
		if (definition) {
			elementDefinition = $.extend({}, definition);
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
			
			var component = { element: this };
			$.each(elementDefinition, function(key, property) {
				if (property instanceof $.component.Property) {
					component[key] = new property.type();
				} else {
					component[key] = property;
				}
			});
			
			// TODO: None of the elements should be setup before all of them
			// are instantiated.
			$.each(elementDefinition, function(key, property) {
				if (property instanceof $.component.Property) {
					property.setup.call(component, component[key]);
				}
			});
			
			component.start();
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

$.component.start = function() {
	
};

$.component.Property = $.al.Object.subtype({
	
	name: 'jQuery.component.Property',
	
	init: function(type, setup) {
		this.type = type;
		this.setup = setup;
	}
	
});

}(jQuery));