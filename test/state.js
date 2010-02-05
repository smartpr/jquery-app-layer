(function($) {

var onenter = $.noop;

$.state(
	{
		state: 'static',
		pattern: '^\/static$',
		elements: '#block1, #block2',
		enter: function() {
			onenter.apply(this, arguments);
		}
	},
	{
		state: 'witharg',
		pattern: /^\/witharg\/(\w+)$/,
		elements: [$('#block1')[0], $('#block3')[0]],
		enter: function() {
			onenter.apply(this, arguments);
		}
	}
);

module('state', {
	setup: function() {
		this.$block = $('#block');
		this.$block1 = $('#block1');
		this.$block2 = $('#block2');
		this.$block3 = $('#block3');
	}
});

test('State without parameters', 2, function() {

	stop(500);	
	onenter = function() {
		ok('state' in this && 'pattern' in this && 'elements' in this, "Controller is being called on state enter with 'this' being the state definition");
		equals(this.state, 'static', "And the correct state definition");
		start()
	};
	window.location.hash = '/static';
	
});

test('State with parameters', 1, function() {

	stop(500);
	onenter = function() {
		same(Array.prototype.slice.call(arguments), ['hello'], "If a state defines parameters, their value(s) are passed to the controller");
		start()
	};
	window.location.hash = '/witharg/hello';
	
});

test('Reset state', 0, function() {
	
	window.location.hash = '';
	
});

}(jQuery));
