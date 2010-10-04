(function($) {

$.val.Value = function(get) {
	if (!(this instanceof Value)) {
		return new Value(get);
	}
	
	
};

}(jQuery));

/*

v = Value(1);

v = Value('tim');

v = Value(function() {
	return true;
});

v = Value(function() {
	this.set([1, 'tim', true]);
});

v = Value(function() {
	$.smartpr.contacts.read($.proxy(this, 'set'));
});

v = Value();
$('#an-element').bind('an-event-type', function(e, data) {
	v.set(data.some-event-data);
});

v = Composite(
	Value(false),
	TrueOnEvent('#an-element', 'an-event-type')
)
>>>
for (var i = 0, l = arguments.length; i < l; i++) {
	arguments[i].registerObserver(this);
}
this.notify = function(val) {
	this.set(val);
}
-OR-
var c = this;
$(arguments).bind('change', function(e, data) {
	c.set(data.to);
});

*/