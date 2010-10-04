jQuery(function($) {

var $blocks = $('#block0, #block1, #block2, #block3');

module('flexicallback');

asyncTest('$.fn.flexiqueue', 7, function() {
	
	$blocks.flexiqueue([function(flexicallback) {
		// Prevent this fx queue from dequeueing automatically.
		flexicallback.expect();
	}, $.noop]);
	equals($blocks.eq(0).flexiqueue('fx').length, 2, "Setting a nameless queue means setting 'fx' queue");
	equals($blocks.eq(1).flexiqueue().length, 2, "Queues can be set on multiple elements simultaneously");
	
	var flag = false;
	
	$blocks.
		flexiqueue('test', [function(flexicallback) {
			ok('call' in flexicallback && 'expect' in flexicallback, "Queued functions (via an array) are supplied a flexicallback");
			equals(this, $blocks[3], "Queued functions are called with the element on which dequeueing was started as 'this'");
		}, function(flexicallback) {
			ok(true, "This queued function is reached without the former calling a callback");
			flexicallback.expect(2);
			setTimeout(function() {
				flag = true;
				flexicallback.call();
			}, 500);
			flexicallback.call();
		}]);
	
	$blocks.eq(3).
		flexiqueue('test', function(flexicallback) {
			ok('call' in flexicallback && 'expect' in flexicallback, "Queued functions (via a callback) are supplied a flexicallback");
			equals(flag, true, "This queued function is not called before the former has called the expected callback");
			start();
		}).
		dequeue('test');
	
});

test('$.fn.flexiqueue: interface', 1, function() {
	
	var queue = [$.noop, $.noop];
	
	$(window).flexiqueue('test', queue);
	
	same(queue, [$.noop, $.noop], "Queue argument is not modified");
	
});

// TODO: Think about if supplied queue (functions) to flexiqueue should be
// modified or not (now the supplied data structures are modified). Make a
// test to verify whatever is decided.

});
