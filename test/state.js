(function($) {

var onenter = $.noop;

module('state', {
	setup: function() {
		this.$block = $('#block');
		this.$block1 = $('#block1');
		this.$block2 = $('#block2');
		this.$block3 = $('#block3');
		
		$.state(
			{
				pattern: /^\//,
				elements: this.$block
			},
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
				pattern: '^/witharg/(\w+)$',
				elements: [this.$block1[0], this.$block3[0]]
			}
		);
	},
	teardown: function() {
		window.location.hash = '';
	}
});

asyncTest('$.state', 1, function() {
	
	onenter = function() {
		ok('state' in this && 'pattern' in this && 'elements' in this, "Controller is being called on state enter with 'this' being the (post-processed) state definition");
		start();
	};
	
	window.location.hash = '/static';
});

}(jQuery));
