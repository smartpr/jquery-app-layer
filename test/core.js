jQuery(function($) {

module('core - $.al.Field');

test('Instantiation', 2, function() {
	
	ok((new $.al.Field()) instanceof $.al.Field, "Instance is of correct type");
	ok($.al.Field() instanceof $.al.Field, "Instantiation does not require new operator");
	
});

// TODO: Remove base from field.
test('base()', 5, function() {
	
	equals($.al.Field().base(), undefined, "Default base value is undefined");
	equals($.al.Field('tim').base(), 'tim', "Base value can be altered through instantiation argument");
	
	var field = $.al.Field();
	equals(field.base('tim'), field, "Setter is chainable");
	equals(field.base(), 'tim', "Value has been changed");
	field.base(undefined);
	equals(field.base(), undefined, "Explicitly setting to undefined is possible");
	
});

test('val()', 5, function() {
	
	var field = $.al.Field('tim');
	equals(field.val(), 'tim', "Default value is base value");
	field.base('art');
	equals(field.val(), 'art', "Default value changes with change of base value");
	
	equals(field.val('tim'), field, "Setter is chainable");
	equals(field.val(), 'tim', "Value has been changed");
	field.val(undefined);
	equals(field.val(), 'art', "Explicitly setting to undefined is possible, after which value falls back to base");
	
});

test('context()', 5, function() {
	
	var field = $.al.Field();
	equals(field.context(), field, "Default context is the field instance itself");
	field = $.al.Field(undefined, window);
	equals(field.context(), window, "Initial context can be altered through instantiation argument");
	
	equals(field.context(document), field, "Setter is chainable");
	equals(field.context(), document, "Value has been changed");
	field.context(undefined);
	equals(field.context(), field, "Explicitly setting to undefined is possible, after which context falls back to default");
	
});

test('bind()', 14, function() {
	var field = $.al.Field(0);
	
	equals(field.bind(function(val) {
		if (val() === 0) {
			equals(this, field.context(), "Bind function has correct context");
		}
		$(window).bind('fieldtestevent', function() {
			val(val() + 1);
		});
	}), field, "Chainable");
	
	equals(field.val(), 0, "Value before binding has been active");
	
	$(window).trigger('fieldtestevent');
	equals(field.val(), 1, "Value after first binding activity");
	
	$(window).trigger('fieldtestevent');
	equals(field.val(), 2, "Value after second binding activity");
	
	field.bind(function(val) {
		val(100);
	});
	equals(field.val(), 100, "Bindings can be added at any moment in time");
	
	$(window).trigger('fieldtestevent');
	equals(field.val(), 101, "Older bindings's behavior remains intact");
	
	var triggerValue = {
		a: 'tim',
		b: [1, 2, {
			'true': 'edge',
			1: false
		}]
	};
	
	field = $.al.Field();
	field.bind(window, 'fieldtestevent');
	$(window).trigger('fieldtestevent', triggerValue);
	equals(field.val(), triggerValue, "Binding can be defined as event handler on element, value is event data");
	
	field = $.al.Field();
	field.bind('#main', 'fieldtestevent');
	$('#main').trigger('fieldtestevent', triggerValue);
	equals(field.val(), triggerValue, "Binding can be defined as event handler on selector, value is event data");
	
	field = $.al.Field();
	field.bind('#main', 'fieldtestevent', 'a');
	$('#main').trigger('fieldtestevent', triggerValue);
	equals(field.val(), 'tim', "Binding can be defined as event handler on selector, value is fetched from event data based on given path");
	
	field = $.al.Field();
	field.bind('#main', 'fieldtestevent', 'b', 2, true);
	$('#main').trigger('fieldtestevent', triggerValue);
	equals(field.val(), 'edge', "Binding can be defined as event handler on selector, value is fetched from event data based on given path");
	
	field = $.al.Field();
	field.bind('#main', 'fieldtestevent', 'b', 2, 1, function(e, v) {
		equals(this, $('#main')[0], "Context of event handler is event source, regardless of the depth of the given path");
		equals(v, false, "Value supplied to event handler is fetched from event data based on given path");
		return 'notfromtriggervalue';
	});
	$('#main').trigger('fieldtestevent', triggerValue);
	equals(field.val(), 'notfromtriggervalue', "If last supplied argument is a function, its return value is taken as the new value");
	
	// TODO: Test bind('fieldname'[, function]).
	
});

test('observe()', 9, function() {
	var field = $.al.Field();
	
	equals(field.observe(function() {
		equals(this, field.context(), "Observe function has correct context");
	}), field, "Chainable");
	field.val('tim');
	
	field = $.al.Field('tim');
	field.observe(function() {
		ok(false, "Observer should not be called because value has not been changed");
	});
	field.base('art');
	field.val('art');
	
	var count = 0;
	field = $.al.Field();
	field.observe(function(v) {
		switch (count) {
			case 0:
			case 2:
			case 4:
				equals(v, 'art', "Observer is called upon value change");
				break;
			case 1:
				equals(v, undefined, "Observer is called upon value change to undefined");
				break;
			case 3:
				equals(v, 'tim', "Observer is called upon setting value to undefined with base value as new value");
				break;
		}
		count++;
	});
	field.val('art');
	field.val(undefined);
	field.val('art');
	field.base('tim');
	field.val(undefined);
	
	field.observe(function(v) {
		equals(v, 'art', "Second observer is called upon value change as well");
	});
	field.val('art');
	
	field.
		observe(function(v) {
			equals(v, 'tim', "Forced observer is always called upon value change, regardless of notifies setting");
		}, true).
		notifies(false);
	field.val('tim');
	
});

test('notifies()', 13, function() {
	var field = $.al.Field();
	
	equals(field.notifies(function() {
		equals(this, field.context(), "Notifies function has correct context");
	}), field, "Chainable");
	field.val('tim');
	
	field = $.al.Field();
	equals(field.notifies(), true, "Default notifies setting is true");
	
	field.notifies(false);
	equals(field.notifies(), false, "Setting notifies again overwrites current setting");
	
	field.notifies('evaluates to true');
	equals(field.notifies(), true, "Notifies is converted to boolean value");
	
	var n = false;
	field.notifies(function() {
		return n;
	});
	equals(field.notifies(), false, "Notifies can be defined as a function");
	// TODO: Re-enable as soon as this feature is implemented.
	// n = true;
	// equals(field.notifies(), true, "Notifies function is evaluated every time its value is needed");
	
	n = $.al.Field(false);
	field.notifies(n);
	equals(field.notifies(), false, "Notifies can be defined as a field");
	n.val(true);
	equals(field.notifies(), true, "Changes to the field propagate to the notifies setting");
	
	field.notifies(function() {
		return $.al.Field(false);
	});
	equals(field.notifies(), false, "Notifies can be defined as a function that returns a field");
	
	// TODO: Test notifies('fieldname').
	
	var enabled = $.al.Field(true),
		count = 0;
	field = $.al.Field();
	field.
		observe(function(v) {
			switch (count) {
				case 0:
					equals(v, 'tim', "Value change observed");
					break;
				case 1:
					equals(v, 'art', "Value change observed");
					break;
				default:
					ok(false, "Observer should not be called");
			}
			count++;
		}).
		notifies(enabled);
	
	field.val('tim');					// Observer should be called.
	enabled.val(false);
	field.val('art');					// Observer should not be called.
	equals(count, 1, "Observer has only been called once thusfar");
	enabled.val(true);					// Observer should be called.
	enabled.val('evaluates to true');	// Observer should not be called.
	
	enabled.val(false);
	field.val('tim');					// Observer should not be called.
	field.val('art');					// Observer should not be called.
	enabled.val(true);					// Observer should not be called.
	
	field = $.al.Field();
	var anotherField = $.al.Field(false);
	enabled = $.al.Field().
		bind(function(val) {
			var condition1 = false,
				condition2 = false;
			field.observe(function(v) {
				condition1 = v > 1;
				val(condition1 && condition2);
			}, true);
			anotherField.observe(function(v) {
				condition2 = !!v;
				val(condition1 && condition2);
			});
		});
	field.
		observe(function(v) {
			equals(v, 3, "Notifies condition is adjusted in time to prevent observer from being called earlier");
		}).
		notifies(enabled);
	field.val(0);
	field.val(1);
	field.val(2);
	field.val(3);
	anotherField.val(true);		// Only now the notifies condition is met.
	
});

test('triggersOn()', 4, function() {
	var field = $.al.Field();
	
	equals(field.triggersOn(), field.context(), "Events are triggered on the field's context by default");
	equals(field.triggersOn(window), field, "Setter is chainable");
	equals(field.triggersOn(), window, "Value has been changed");
	field.triggersOn(undefined);
	field.context(document);
	equals(field.triggersOn(), document, "Explicitly setting to undefined is possible, after which value falls back to field's context");
	
});

test('triggers()', 10, function() {
	var field = $.al.Field();
	
	equals(field.triggers({
		fieldtestevent: 'tim'
	}), field, "Chainable");
	equals(field.triggers().fieldtestevent('tim'), true, "Triggers setting has been changed and converted to condition function");
	
	var count = 0;
	field.triggers({
		fieldtestevent: function() {
			if (count === 1) {
				equals(this, field.context(), "Event condition function has correct context");
			}
			count++;
			return false;
		},
		fieldtestevent2: 'tim'
	});
	equals(field.triggers().fieldtestevent(), false, "Previous setting for 'fieldtestevent' has been overwritten");
	ok('fieldtestevent2' in field.triggers(), "Setting for 'fieldtestevent2' has been added");
	
	field.triggers('fieldtestevent3');
	equal(field.triggers().fieldtestevent3(), true, "Providing just an event name means triggering an event upon every change")
	
	field.triggersOn(window);
	$([window, field]).bind({
		fieldtestevent: function() {
			ok(false, "'fieldtestevent' should not be triggered");
		},
		fieldtestevent2: function(e, data) {
			ok(true, "'fieldtestevent2' should be triggered");
			equals(data.to, 'tim', "Changed value is supplied as event data");
		},
		fieldtestevent3: function() {
			ok(true, "'fieldtestevent3' should be triggered");
		}
	});
	field.val('tim');
	field.val('art');
	
	// TODO: Test triggers(falsy).
	
});

});