(function($) {
/*
module('manipulate', {
	teardown: function() {
		$('#main').hide()[0].style.visibility = '';
	}
});

test('Element cannot be displayed', 1, function() {
	var $block = $('#block0');
	
	try {
		$block.manipulate(function() {
			ok(false, "Manipulation function is not being called");
		});
	} catch (err) {
		ok(err, "Error is thrown if element cannot be displayed");
	}
	
});

asyncTest('Elements are displayed and invisible during manipulation', 4, function() {
	var $blocks = $('#block0, #block1');
	
	$('#main').show();
	
	$blocks.manipulate(function() {
		var $this = $(this);
		
		ok($this.is(':visible'), "Element is displayed");
		equals($this.css('visibility'), 'hidden', "Element is invisible");
		
		if ($this.is('#block1')) {
			start();
		}
	});
	
});

test('Element visibility returns to original setting', 2, function() {
	var $block = $('#block0'),
		visibility = $block[0].style.visibility;
	
	$('#main').
		css('visibility', 'hidden').
		show();
	
	$block.manipulate($.noop, function() {
		equals($(this).css('visibility'), 'hidden', "Computed visibility is hidden");
		equals(this.style.visibility, visibility, "Element-level visibility is back to original")
	});
});
*/

module('employ', {
	setup: function() {
		$('#main').show();
	},
	teardown: function() {
		$('#main').hide();
	}
});

test('Employment triggers progress events', 8, function() {
	
	$('#block0, #block1').
		bind('employconstruct employdeconstruct employsleep', function(e) {
			ok(true, e.type + " event is triggered on #" + this.id);
		}).
		employ(true, 1).
		employ(true, 2).
		employ(false);
	
});

test('Construct and deconstruct handlers get passed the appropriate state', 2, function() {
	
	$('#block0').
		one('employdeconstruct employconstruct', function(e) {
			same($.makeArray(arguments).slice(1), [1], e.type + " gets supplied correct state");
		}).
		employ(true, 1).
		employ(true, 2).
		employ(false);
	
});

test('Blocks are shown and hidden appropriately', 3, function() {
	
	$('#block0').
		one('employdeconstruct', function() {
			ok($(this).is(':visible'), "Block is displayed upon deconstruct");
		}).
		one('employconstruct', function() {
			ok($(this).is(':visible'), "Block is displayed upon construct");
		}).
		one('employsleep', function() {
			ok($(this).is(':hidden'), "Block is not displayed upon sleep");
		}).
		employ(true, 1).
		employ(true, 2).
		employ(false);
	
});

/*
asyncTest('Employ unemployed element for the first time', 4, function() {
	var $block = $('#block0');
	
	$('#main').show();
	
	$block.
		bind('employconstruct', function(e, fcb) {
			ok($(this).is(':visible'), "Element is displayed upon construct");
			equals($(this).css('visibility'), 'hidden', "Element's visibility is hidden upon construct");
			same($.makeArray(arguments).slice(2), ['mystate'], "New state is provided upon construct");
		}).
		bind('employready', function() {
			equals($(this).css('visibility'), 'visible', "Element's visibility is visible upon ready")
			start();
		}).
		bind('employsleep employdeconstruct', function(e) {
			ok(false, e.type + " should not be triggered");
		}).
		employ(true, undefined, 'mystate');
	
});

asyncTest('Unemploy employed element', 1, function() {
	var $block = $('#block0');
	
	$('#main').show();
	
	$block.
		one('employready', function() {
			$block.
				bind('employsleep', function() {
					ok($(this).is(':hidden'), "Element is not displayed upon sleep");
					start();
				}).
				bind('employready employdeconstruct employconstruct', function(e) {
					ok(false, e.type + " should not be triggered");
				}).
				employ(false);
		}).
		employ(true);
	
});

asyncTest('Employ employed element with different state', 7, function() {
	var $block = $('#block0');
	
	$('#main').show();
	
	$block.
		one('employready', function() {
			$block.
				bind('employdeconstruct', function(e, fcb) {
					ok($(this).is(':visible'), "Element is displayed upon deconstruct");
					equals($(this).css('visibility'), 'hidden', "Element's visibility is hidden upon deconstruct");
					same($.makeArray(arguments).slice(2), ['mystate'], "Old state is provided upon deconstruct");
				}).
				bind('employconstruct', function(e, fcb) {
					ok($(this).is(':visible'), "Element is displayed upon construct");
					equals($(this).css('visibility'), 'hidden', "Element's visibility is hidden upon construct");
					same($.makeArray(arguments).slice(2), ['mynewstate'], "New state is provided upon construct");
				}).
				bind('employready', function() {
					equals($(this).css('visibility'), 'visible', "Element's visibility is visible upon ready")
					start();
				}).
				bind('employsleep', function(e) {
					ok(false, e.type + " should not be triggered");
				}).
				employ(true, undefined, 'mynewstate');
		}).
		employ(true, undefined, 'mystate');
		
});

asyncTest('Employ unemployed element that was employed before with same state', 1, function() {
	var $block = $('#block0');
	
	$('#main').show();
	
	$block.
		one('employready', function() {
			$block.
				one('employsleep', function() {
					$block.
						bind('employsleep employready employdeconstruct employconstruct', function(e) {
							equals(e.type, 'employready', "Only employready is triggered");
							start();
						}).
						employ(true);
				}).
				employ(false);
		}).
		employ(true);
	
});

asyncTest('Employ unemployed element that was employed before with different state', 2, function() {
	var $block = $('#block0');
	
	$('#main').show();
	
	$block.
		one('employready', function() {
			$block.
				one('employsleep', function() {
					$block.
						bind('employdeconstruct', function() {
							same($.makeArray(arguments).slice(2), ['mystate'], "Old state is provided upon deconstruct");
						}).
						bind('employconstruct', function() {
							same($.makeArray(arguments).slice(2), ['mynewstate'], "New state is provided upon construct");
						}).
						bind('employready', function() {
							start();
						}).
						bind('employsleep', function(e) {
							ok(false, e.type + " should not be triggered");
						}).
						employ(true, undefined, 'mynewstate');
				}).
				employ(false);
		}).
		employ(true, undefined, 'mystate');
	
});

asyncTest('Employment callbacks can be handled synchronously', 2, function() {
	var completed;
	
	$('#main').show();
	
	$('#block0').
		bind('employconstruct', function(e, fcb) {
			fcb.expect();
			setTimeout(function() {
				completed = e.type;
				fcb.call();
			}, 1000);
		}).
		bind('employready', function(e, fcb) {
			equals(completed, 'employconstruct', "employready is not handled before employconstruct's handler has completed");
			fcb.expect();
			setTimeout(function() {
				completed = e.type;
				fcb.call();
			}, 1000);
		}).
		employ(true, function() {
			equals(completed, 'employready', "employ callback is not handled before employready's handler has completed");
			start();
		});
	
});

asyncTest('General callback is synchronous over all elements', 3, function() {
	var count = 0;
	
	$('#main').show();
	
	$('#block0, #block1').bind('employready', function(e, fcb) {
		fcb.expect();
		setTimeout(function() {
			count++;
			fcb.call();
		}, 1000);
	});
	
	$('#block0, #block1').employ(true, function() {
		equals(count++, 2, "Blocks are fully employed before general callback is called");
	});
	
	$('#block1').bind('employsleep', function(e, fcb) {
		fcb.expect();
		equals(count, 3, "Preceding employ is fully finished before current unemploy is started");
		setTimeout(function() {
			count++;
			fcb.call();
		}, 1000);
	});
	
	$('#block0, #block1').employ(false, function() {
		equals(count, 4, "Blocks are fully unemployed before general callback is called");
		start();
	});
	
	$(window).dequeue('employ.outer');
});
*/
// TODO: Test what happens if you employ twice with the same state.
// TODO: Check that state parameter is ignored when status parameter is false.
// TODO: Add callback to employ which always calls (even if employ doesn't do anything).
// TODO: Test synchronicity

}(jQuery));