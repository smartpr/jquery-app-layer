(function($) {

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

module('employ', {
	teardown: function() {
		$('#main').hide();
	}
});

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
		employ(true, 'mystate');
	
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
				employ(true, 'mynewstate');
		}).
		employ(true, 'mystate');
		
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
						employ(true, 'mynewstate');
				}).
				employ(false);
		}).
		employ(true, 'mystate');
	
});

}(jQuery));