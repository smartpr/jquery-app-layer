jQuery(function($) {

module('state', {
	setup: function() {
		$('#main').show();
	},
	teardown: function() {
		$('#main').hide();
	}
});

test('Activity default', 4, function() {
	
	$('#block0').state();
	
	ok(!$('#block0').state('isActive'), "Uninitialized state block is inactive");
	ok($('#block0').is(':visible'), "Uninitialized state block entails no visibility has been enforced, so it can be visible");
	
	$('#block0').
		hide().
		state('update');
	
	ok($('#block0').state('isActive'), "Default after first update is to be active");
	ok($('#block0').is(':visible'), "Activity entails visibility");
	
});

test('Activity from an explicitly set option', 2, function() {
	
	$('#block0').
		hide().
		state({
			active: false
		}).
		state('update');
	
	ok(!$('#block0').state('isActive'), "State block is inactive after first update");
	ok($('#block0').is(':hidden'), "Inactivity entails invisibility");
	
});

test('Activity from a function result', 4, function() {
	var active = false;
	
	$('#block0').
		hide().
		state({
			active: function(state) {
				equals(this, $('#block0')[0], "Function's context is the state block element");
				active = !active;
				return active ? 'this evaluates to true' : 0; // 0 evaluates to false.
			}
		}).
		state('update');
	
	ok($('#block0').state('isActive'), "State block is active after first update");
	
	$('#block0').state('update');
	ok(!$('#block0').state('isActive'), "State block is inactive after second update");
	
});

test('Update triggered by an event', 2, function() {
	
	$('#block0').
		hide().
		state({
			observe: {
				'click dblclick': '#main',
				'customevent': window
			},
			active: function() {
				return !$(this).state('isActive');
			}
		});
	
	$('#main').trigger('click');
	ok($('#block0').state('isActive'), "State block activity is toggled after click");
	
	$(window).trigger('customevent');
	ok(!$('#block0').state('isActive'), "State block activity is toggled after customevent");
	
});

test('Default state value', 1, function() {
	
	$('#block0').
		hide().
		state();
	
	equals($('#block0').state('value'), null, "Default state value is null");
	
});

test('Non-object state value', 1, function() {
	
	$('#block0').
		hide().
		state({
			value: 'tim'
		}).
		state('update');
	
	same($('#block0').state('value'), 'tim', "Non-object state value is fine");
	
});

test('State value from an explicitly set option', 2, function() {
	var y = ['tim', 'art'];
	
	$('#block0').
		hide().
		state({
			value: {
				x: 1,
				y: y,
				z: true
			}
		}).
		state('update');
	
	same($('#block0').state('value'), {x: 1, y: y, z: true}, "State value is an object of static values");
	
	$('#block0').state('update');
	y.pop();
	same($('#block0').state('value'), {x: 1, y: ['tim', 'art'], z: true}, "Adjusting an object value does not propagate to state value (due to how widget options work)");
	
});

test('State value from a function result', 3, function() {
	var x = 1,
		y = ['tim', 'art'],
		z = true;
	
	$('#block0').
		hide().
		state({
			active: function(value) {
				same(value, {x: 2, y: ['tim'], z: false}, "State value is supplied to activity getter");
				return true;
			},
			value: function() {
				equals(this, $('#block0')[0], "Function's context is the state block element");
				x++;
				y.pop();
				z = !z;
				return {x: x, y: y, z: z};
			}
		}).
		state('update');
	
	same($('#block0').state('value'), {x: 2, y: ['tim'], z: false}, "State value is calculated every time state is updated");
	
});

test('Multiple elements', 2, function() {
	
	$('#block0, #block1').
		hide().
		state().
		state('update');
	
	ok($('#block0').is(':visible'), "#block0 is visible");
	ok($('#block1').is(':visible'), "#block1 is visible");
	
});

test('State callbacks', 8, function() {
	var age = 27;
	
	$('#block0').
		hide().
		state({
			active: function(value) {
				return value.age > 27 && value.age < 30;
			},
			value: function() {
				return {
					name: 'tim',
					age: age++
				};
			}
		});
	
	var last;
	$('#block0').
		bind('stateactivate', function(e) {
			ok($(this).state('isActive'), "Activity has already been changed");
			last = e.type;
		}).
		bind('stateinit', function(e, data) {
			equals(last, 'stateactivate', last + " event is triggered and handled before " + e.type + " event");
			same(data.value, {name: 'tim', age: 28}, "State value is supplied as data to " + e.type + " handler");
			ok(!('from' in data), "There is no preceding state value");
		}).
		bind('statedeactivate change', function(e) {
			ok(false, e.type + " event should not be triggered");
		}).
		state('update').
		state('update').
		unbind();
	
	$('#block0').
		bind('statechange', function(e, data) {
			same(data.value, {name: 'tim', age: 29}, "State value is supplied as data to " + e.type + " handler");
			same(data.from, {name: 'tim', age: 28}, "Preceding state value is supplied as data to " + e.type + " handler");
		}).
		bind('statedeactivate stateactivate stateinit', function(e) {
			ok(false, e.type + " event should not be triggered");
		}).
		state('update').
		unbind();
	
	$('#block0').
		bind('statedeactivate', function(e) {
			equals(age, 31, "State is deactivated when age < 30 no longer holds true");
							// ... which is the case if the local age variable equals 31.
			ok($(this).is(':hidden'), "State block is hidden");
		}).
		bind('stateactivate stateinit', function(e) {
			ok(false, e.type + " event should not be triggered");
		}).
		state('update').
		state('update').	// Should not trigger a second deactivate event.
		unbind();
	
});

test('stateinit is triggered exactly once (under the assumption that time has a limit at infinity)', 1, function() {
	var count = 0;
	
	$('#block0').
		state({
			active: function() {
				return count++ > 1; 
			},
			init: function(e) {
				equals(count, 3, e.type + " is not triggered before state block is active");
			}
		}).
		state('update').
		state('update').
		state('update').
		state('update');	// Should not trigger a second init event.
	
});

// TODO: Test that we cannot return to a (internal) state value of null as
// soon as we left it (maybe integrated in test that verifies that stateinit
// is triggered once).

// TODO: Test isInit().

});