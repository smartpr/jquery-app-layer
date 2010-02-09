(function($) {

var onenter = $.noop,
	onleave = $.noop;

$.state(
	{
		name: 'static',
		pattern: '^\/static$',
		elements: '#block1, #block2',
		enter: function() {
			onenter.apply(this, arguments);
		},
		leave: function() {
			onleave.apply(this, arguments);
		}
	},
	{
		name: 'witharg',
		pattern: /^\/witharg\/(\w+)$/,
		elements: [$('#block1')[0], $('#block3')[0]],
		enter: function() {
			onenter.apply(this, arguments);
		},
		leave: function() {
			onleave.apply(this, arguments);
		}
	}
);

module('state', {
	setup: function() {
		this.$window = $(window);
	}
});

asyncTest('Change to state without parameters', 4, function() {
	var $window = this.$window;
	
	onenter = function() {
		ok('name' in this && 'pattern' in this && 'elements' in this, "Controller is being called on state enter with 'this' being the state definition");
		equals(this.name, 'static', "And with the correct state definition");
	};
	$window.bind({
		'stateenter.all': function(e) {
			equals(e.type, 'stateenter', "General global stateenter event is triggered");
		},
		'stateenter.static': function(e) {
			equals(e.type, 'stateenter', "Matching state-specific global stateenter event is triggered");
		},
		'stateenter.doesnotexist': function(e) {
			equals(e.type, 'stateenter', "Non-matching state-specific global stateenter event is not triggered");
		}
	});
	window.location.hash = '/static';
	
	setTimeout(function() {
		$window.unbind('stateenter');
		start();
	}, 100);
});

asyncTest('Change to state with parameters', 3, function() {

	onenter = function() {
		same(Array.prototype.slice.call(arguments), ['hello'], "If a state defines parameters, their value(s) are passed to the controller");
	};
	onleave = function() {
		ok('name' in this && 'pattern' in this && 'elements' in this, "Controller is being called on state leave with 'this' being the state definition");
		equals(this.name, 'static', "And with the correct state definition");
	};
	window.location.hash = '/witharg/hello';
	
	setTimeout(start, 100);
});

asyncTest('Reset state', 1, function() {
	var $window = this.$window;
	
	onleave = $.noop;
	onenter = function() {
		ok(true, "This point should not be reached, as no state matches and thus no controller is invoked");
	};
	window.location.hash = '';
	
	setTimeout(function() {
		// TODO: Use $.fetch() as soon as we have implemented it.
		equals($window.fetch('state', 'current'), undefined, "No state matches so no current state should be held");
		start()
	}, 100);
});

}(jQuery));
