jQuery(function($) {

module('state_hash', {
	setup: function() {
		$('#main').show();
		$.state(
			{
				pattern: /^\//,
				employ: '#block0'
			},
			{
				name: 'static',
				pattern: /^\/static$/,
				employ: '#block1, #block2'
			},
			{
				name: 'anotherstatic',
				pattern: /^\/anotherstatic$/,
				employ: '#block3'
			},
			{
				name: 'witharg',
				pattern: /^\/witharg\/(\w+)$/,
				employ: '#block2, #block3'
			}
		);
	},
	teardown: function() {
		// TODO: Replace with $.state('destroy') call.
		$(window).
			unbind('hashchange').
			del('state', 'current');
		location.hash = '';
		$('#main').hide();
	}
});

asyncTest('Change from unmatched state to matched state', 6, function() {
	var count = 0;
	
	$('#block0, #block1, #block2, #block3').bind('employsleep', function() {
		ok(false, "#" + this.id + " should not be unemployed");
	});
	$('#block0, #block1, #block2').bind('employconstruct', function(e, name) {
		switch (count++) {
			case 0:
				equals(this.id, 'block0', "#block0 is employed first");
				break;
			case 1:
				equals(this.id, 'block1', "#block1 is employed second");
				break;
			case 2:
				equals(this.id, 'block2', "#block2 is employed third");
				break;
		}
		equals(name, "static", "State name is supplied as parameter to employconstruct handler");
	});
	$('#block3').bind('employconstruct', function() {
		ok(false, "#" + this.id + " should not be employed");
	});
	
	$('#block2').bind('employconstruct', function() {
		start();
	});
	
	location.hash = '/static';
	
});

asyncTest('Change from matched state to unmatched state', 3, function() {
	var count = 0;
	
	location.hash = '/static';
	
	$(window).bind('hashchange', function() {
		
		$('#block0, #block1, #block2').bind('employsleep', function() {
			switch (count++) {
				case 0:
					equals(this.id, 'block0', "#block0 is unemployed first");
					break;
				case 1:
					equals(this.id, 'block1', "#block1 is unemployed second");
					break;
				case 2:
					equals(this.id, 'block2', "#block2 is unemployed third");
					break;
			}
		});
		$('#block4').bind('employsleep', function() {
			ok(false, "#" + this.id + " should not be unemployed");
		});
		$('#block0, #block1, #block2, #block3').bind('employready', function() {
			ok(false, "#" + this.id + " should not be employed");
		});
	
		$('#block2').bind('employsleep', function() {
			start();
		});
	
		// This only matches a non-final state, so all blocks should be
		// unemployed as a result.
		location.hash = '/';
		
	});
	
});
/*
asyncTest('State change is synchronous', 1, function() {
	
	var unemployed = 0;
	
	location.hash = '/static';
	
	$(window).bind('hashchange', function() {
		
		$('#block1, #block2').bind('employsleep', function() {
			var id = this.id;
			fcb.expect();
			setTimeout(function() {
				unemployed++;
				fcb.call();
			}, 1000);
		});
		
		$('#block3').bind('employconstruct', function() {
			equals(unemployed, 2, "No blocks are employed until unemploys are completed");
			start();
		});
		
		location.hash = '/anotherstatic';
		
	});
	
});
*/
// TODO: Write test for moving to the same state (due to hash being changed
// twice right after each other, resulting in the event handler finding the
// same value in location.hash). --> should be solved automatically as soon as
// we calculate intersections between states.

});

// jQuery(function($) {
// 
// var $window = $(window),
// 	$blocks = $('#block0, #block1, #block2, #block3'),
// 	
// 	wait = function(callback) {
// 		if (callback === undefined) {
// 			callback = start;
// 		}
// 		setTimeout(callback, $.hashchangeDelay);
// 	},
// 	onenter = $.noop,
// 	onleave = $.noop;
// 
// $.state(
// 	{
// 		pattern: '^\/',
// 		elements: $blocks.eq(0)
// 	},
// 	{
// 		name: 'static',
// 		pattern: '^\/static$',
// 		elements: '#block1, #block2',
// 		enter: function() {
// 			onenter.apply(this, arguments);
// 		},
// 		leave: function() {
// 			onleave.apply(this, arguments);
// 		}
// 	},
// 	{
// 		name: 'witharg',
// 		pattern: /^\/witharg\/(\w+)$/,
// 		elements: [$('#block2')[0], $('#block3')[0]],
// 		enter: function() {
// 			onenter.apply(this, arguments);
// 		},
// 		leave: function() {
// 			onleave.apply(this, arguments);
// 		}
// 	}
// );
// 
// module('state');
// 
// asyncTest('Change to state without parameters', 11 /*13*/, function() {
// 	onenter = function() {
// 		ok('name' in this && 'pattern' in this && 'elements' in this, "Controller is being called on state enter with 'this' being the state definition");
// 		equals(this.name, 'static', "And with the correct state definition");
// 	};
// 	
// 	$window.bind({
// 		'stateenter._': function(e, name) {
// 			equals(e.type, 'stateenter', "General global stateenter event is triggered");
// 			equals(name, 'static', "And with the correct state definition");
// 			same(e.states[e.states.length - 1].params, [], "No parameters is represented as an empty array");
// 			equals(this, window, "While 'this' is (as usual) the element to which the handler is bound");
// 		},
// 		'stateenter.static': function(e) {
// 			equals(e.type, 'stateenter', "Matching state-specific global stateenter event is triggered");
// 		},
// 		'stateenter.witharg': function(e) {
// 			ok(false, "Non-matching state-specific global stateenter event is not triggered");
// 		}
// 	});
// 	
// 	$blocks.slice(0, 3).bind({
// 		'stateenter._': function(e, name) {
// 			equals(e.type, 'stateenter', "General element-level stateenter event is triggered on element #" + this.id);
// 			equals(name, 'static', "And with the correct state definition");
// 		}
// 	});
// 	$blocks.eq(3).bind({
// 		'stateenter._': function(e) {
// 			ok(false, "This point should not be reached, as stateenter event should not be triggered on element #" + this.id);
// 		}
// 	});
// 	
// 	window.location.hash = '/static';
// 	
// 	wait(function() {
// 		$window.unbind('stateenter stateleave');
// 		$blocks.unbind('stateenter stateleave');
// 		start();
// 	});
// });
// 
// asyncTest('Change to state with parameters', 8 /*9*/, function() {
// 	onenter = function() {
// 		same($.makeArray(arguments), ['hello'], "If the entered state defines parameters, their value(s) are passed to the controller");
// 	};
// 	onleave = function() {
// 		ok('name' in this && 'pattern' in this && 'elements' in this, "Controller is being called on state leave with 'this' being the state definition");
// 		equals(this.name, 'static', "And with the correct state definition");
// 	};
// 	
// 	$window.bind({
// 		'stateenter.witharg': function(e) {
// 			var args = $.makeArray(arguments).slice(2);
// 			same(args, ['hello'], "If the entered state defines parameters, their value(s) are passed as arguments to the event handler");
// 			same(args, e.states[e.states.length - 1].params, "And also in the event object");
// 		},
// 	});
// 	
// 	$([$blocks[0], $blocks[2], $blocks[3]]).bind({
// 		'stateenter._': function(e, name) {
// 			equals(e.type, 'stateenter', "General element-level stateenter event is triggered on element #" + this.id);
// 			equals(name, 'witharg', "And with the correct state definition");
// 		}
// 	});
// 	$blocks.eq(1).bind({
// 		'stateenter._': function(e) {
// 			ok(false, "This point should not be reached, as stateenter event should not be triggered on element #" + this.id);
// 		}
// 	});
// 	
// 	window.location.hash = '/witharg/hello';
// 	
// 	wait(function() {
// 		$window.unbind('stateenter stateleave');
// 		$blocks.unbind('stateenter stateleave');
// 		start();
// 	});
// });
// 
// asyncTest('Change to same state with different parameters', 4, function() {
// 	$([$blocks[0], $blocks[2]]).bind({
// 		'stateenter._': function(e, name) {
// 			equals(e.type, 'stateenter', "General element-level stateenter event is triggered on element #" + this.id);
// 			equals(name, 'static', "And with the correct state definition");
// 		}
// 	});
// 	$([$blocks[1], $blocks[3]]).bind({
// 		'stateenter._': function(e) {
// 			ok(false, "This point should not be reached, as stateenter event should not be triggered on element #" + this.id);
// 		}
// 	});
// 	
// 	window.location.hash = '/static';
// 	
// 	wait(function() {
// 		$window.unbind('stateenter stateleave');
// 		$blocks.unbind('stateenter stateleave');
// 		start();
// 	});
// });
// 
// asyncTest('Change back to previously visited state', 6, function() {
// 	$([$blocks[0], $blocks[2], $blocks[3]]).bind({
// 		'stateenter._': function(e, name) {
// 			equals(e.type, 'stateenter', "General element-level stateenter event is triggered on element #" + this.id);
// 			equals(name, 'witharg', "And with the correct state definition");
// 		}
// 	});
// 	$blocks.eq(1).bind({
// 		'stateenter._': function(e) {
// 			ok(false, "This point should not be reached, as stateenter event should not be triggered on element #" + this.id);
// 		}
// 	});
// 	
// 	window.location.hash = '/witharg/goodbye';
// 	
// 	wait(function() {
// 		$window.unbind('stateenter stateleave');
// 		$blocks.unbind('stateenter stateleave');
// 		start();
// 	});
// });
// 
// asyncTest('Reset state', 6 /*7*/, function() {
// 	onleave = function() {
// 		same($.makeArray(arguments), ['goodbye'], "If the left state defines parameters, their value(s) are passed to the controller");
// 	};
// 	onenter = function() {
// 		ok(false, "This point should not be reached, as no state matches and thus no controller is invoked");
// 	};
// 	$window.bind({
// 		'stateleave._': function(e, name) {
// 			equals(e.type, 'stateleave', "General global stateleave event is triggered");
// 			equals(name, 'witharg', "And with the correct state definition");
// 			var args = $.makeArray(arguments).slice(2);
// 			same(args, ['goodbye'], "If the left state defines parameters, their value(s) are passed as arguments to the event handler");
// 			same(args, e.states[e.states.length - 1].params, "And also in the event object");
// 		},
// 		'stateleave.witharg': function(e) {
// 			equals(e.type, 'stateleave', "Matching state-specific global stateleave event is triggered");
// 		},
// 		'stateleave.static': function(e) {
// 			ok(false, "Non-matching state-specific global stateleave event is not triggered");
// 		}
// 	});
// 	window.location.hash = '#';
// 	
// 	wait(function() {
// 		// TODO: Use $.fetch() as soon as we have implemented it.
// 		equals($window.fetch('state', 'current'), undefined, "No state matches so no current state should be held");
// 		$window.unbind('stateenter stateleave');
// 		$blocks.unbind('stateenter stateleave');
// 		start()
// 	});
// });
// 
// });
