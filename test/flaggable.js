(function($) {

var $f, $flaggable;

module('flaggable', {
	setup: function() {
		$f = $flaggable = $('#flaggable');
	}
});

test("flagged & unflagged", 2, function() {
	
	$flaggable.flaggable();
	
	same($flaggable.flaggable('flagged'), [], "Flagged items is an empty array");
	equals($flaggable.flaggable('unflagged'), null, "Unflagged items is null, denoting all but flagged");
	
	// TODO: flaggable('flagged', <full data list>);
	
});

test("change", 8, function() {
	
	$f.flaggable();
	
	$f.one('flaggablechange', function(e, data) {
		equals(data.flagged, $f.flaggable('flagged'), "Correct set of flagged items is supplied to change handler");
		equals(data.unflagged, $f.flaggable('unflagged'), "Correct set of unflagged items is supplied to change handler");
	});
	
	$f.flaggable('change', 1);
	same($f.flaggable('flagged'), [1], "Set of flagged items is always a list");
	equals($f.flaggable('unflagged'), null, "Set of unflagged items is null");
	
	$f.flaggable('change', [2, 3]);
	same($f.flaggable('flagged'), [2, 3], "Set of flagged items is changed entirely");
	
	$f.
		one('flaggableflag', function(e) {
			ok(true, "flag event is triggered upon change");
		}).
		one('flaggableunflag', function(e, data) {
			ok(false, "This point should not be reached, as no unflag event must be triggered (with items: " + data.items + ")");
		});
	
	$f.flaggable('change', null, [1]);
	equals($f.flaggable('flagged'), null, "Set of flagged items is null");
	same($f.flaggable('unflagged'), [1], "Set of unflagged items is a list");
	
});

test("flag & unflag", 28, function() {
	
	$flaggable.
		one('flaggableflag', function(e, data) {
			equals(data.items, null, "flag event triggered with correct items");
		}).
		one('flaggableunflag', function(e, data) {
			ok(false, "This point should not be reached, as no unflag event must be triggered (with items: " + data.items + ")");
		}).
		one('flaggablechange', function(e, data) {
			ok(true, "One change event is triggered for every atomic change");
		}).
		flaggable();
	
	$flaggable.flaggable('flag', null);
	equals($flaggable.flaggable('flagged'), null, "Flagging all items after all items were implicitly non-flagged does impact flagged items");
	same($flaggable.flaggable('unflagged'), [], "And it also has an effect on unflagged items");
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			ok(false, "This point should not be reached, as no flag event must be triggered (with items: " + data.items + ")");
		},
		flaggableunflag: function(e, data) {
			ok(false, "This point should not be reached, as no unflag event must be triggered (with items: " + data.items + ")");
		}
	});
	$flaggable.flaggable('flag', 1);
	ok($flaggable.flaggable('flagged', null), "Flagging implicitly flagged items does not impact flagged items");
	same($flaggable.flaggable('unflagged'), [], "Nor does it have an effect on unflagged items");
	$flaggable.unbind();
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			ok(false, "This point should not be reached, as no flag event must be triggered (with items: " + data.items + ")");
		},
		flaggableunflag: function(e, data) {
			same(data.items, [1, 2], "unflag event triggered with correct items");
		}
	});
	$flaggable.flaggable('unflag', [1, 2]);
	equals($flaggable.flaggable('flagged'), null, "Unflagging implicitly flagged items does not impact flagged items");
	same($flaggable.flaggable('unflagged'), [1, 2], "But it does have an effect on unflagged items");
	$flaggable.unbind();
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			same(data.items, [2], "flag event triggered with correct items");
		},
		flaggableunflag: function(e, data) {
			ok(false, "This point should not be reached, as no unflag event must be triggered (with items: " + data.items + ")");
		}
	});
	$flaggable.flaggable('flag', [2, 3]);
	equals($flaggable.flaggable('flagged'), null, "Flagging explicitly non-flagged items or implicitly flagged items does not impact flagged items");
	ok($flaggable.flaggable('unflagged', 1), "But it does have an effect on unflagged items");
	$flaggable.unbind();
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			ok(false, "This point should not be reached, as no flag event must be triggered (with items: " + data.items + ")");
		},
		flaggableunflag: function(e, data) {
			equals(data.items, null, "unflag event triggered with correct items");
		}
	});
	$flaggable.flaggable('unflag', null);
	same($flaggable.flaggable('flagged'), [], "Unflagging all items after all items were implicitly flagged does impact flagged items");
	equals($flaggable.flaggable('unflagged'), null, "And it also has an effect on unflagged items");
	$flaggable.unbind();
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			same(data.items, [1], "flag event triggered with correct items");
		},
		flaggableunflag: function(e, data) {
			ok(false, "This point should not be reached, as no unflag event must be triggered (with items: " + data.items + ")");
		}
	});
	$flaggable.flaggable('flag', 1);
	ok($flaggable.flaggable('flagged', 1), "Flagging implicitly non-flagged items does impact flagged items");
	equals($flaggable.flaggable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flaggable.unbind();
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			same(data.items, [2, 3], "flag event triggered with correct items");
		},
		flaggableunflag: function(e, data) {
			ok(false, "This point should not be reached, as no unflag event must be triggered (with items: " + data.items + ")");
		}
	});
	$flaggable.flaggable('flag', [2, 3]);
	same($flaggable.flaggable('flagged'), [1, 2, 3], "Flagging implicitly non-flagged items does impact flagged items in a way that takes currently flagged items into account");
	equals($flaggable.flaggable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flaggable.unbind();
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			same(data.items, [4], "flag event triggered with correct items");
		},
		flaggableunflag: function(e, data) {
			same(data.items, [1, 3], "unflag event triggered with correct items");
		}
	});
	$flaggable.flaggable('change', [2, 4]);		// TODO: Use flag/unflag here.
	same($flaggable.flaggable('flagged'), [2, 4], "Unflagging explicitly flagged items or implicitly non-flagged items does impact flagged items");
	equals($flaggable.flaggable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flaggable.unbind();
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			ok(false, "This point should not be reached, as no flag event must be triggered (with items: " + data.items + ")");
		},
		flaggableunflag: function(e, data) {
			same(data.items, [2, 4], "unflag event triggered with correct items");
		}
	});
	$flaggable.flaggable('unflag', null);
	same($flaggable.flaggable('flagged'), [], "Unflagging all items after some items were explicitly flagged does impact flagged items");
	equals($flaggable.flaggable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flaggable.unbind();
	
});

test("toggle", 2, function() {
	
	$f.flaggable();
	
	$f.flaggable('flag', 1);
	$f.flaggable('toggle', [1, 2, 3]);
	same($f.flaggable('flagged'), [2, 3], "Toggle explicitly flagged items");
	
	$f.flaggable('change', null, [1, 2]);
	$f.flaggable('toggle', [2, 3]);
	same($f.flaggable('unflagged'), [1, 3], "Toggle implicitly flagged items");
	
});

// TODO: Test taking in DOM elements that map to data automagically
// (change, flag, unflag, toggle)

test("flagfirst & unflaglast", 2, function() {
	
	$f.
		bind('flaggableflagfirst flaggableunflaglast', function(e) {
			ok(true, e.type + " event triggered");
		}).
		flaggable();
	
	$f.flaggable('flag', 4);
	$f.flaggable('unflag', null);
	
});

test("Link to DOM; elements are flaggable items", 2, function() {
	
	var $items = $f.find('a');
	
	$f.
		one('flaggableflag', function(e, data) {
			same(data.items, [$items[0]], "Clicked element is passed to flag handler");
		}).
		flaggable({
			elements: 'a'
		}).
		delegate('a', 'click', function(e) {
			e.preventDefault();
			$f.flaggable('toggle', this);
		});
	
	$items.eq(0).click();
	$items.eq(2).click();
	same($f.flaggable('flagged'), [$items[0], $items[2]], "Clicked elements are flagged items");
	
});

test("Link to DOM; data that are retrieved from elements are flaggable items", 5, function() {
	
	var $items = $f.find('a'),
		count = 0;
	
	$f.
		one('flaggableflag', function(e, data) {
			same(data.items, [1], "Clicked element's data are passed to flag handler");
		}).
		flaggable({
			elements: 'a',
			data: function() {
				return parseInt($(this).attr('href'), 10);
			},
			invalidateFlagged: function(e, data) {
				if (count === 1) {
					same(data.elements, [$items[1], $items[4], $items[7]], "Elements corresponding to data from flagged element are passed to invalidateFlagged handler");
				}
				if (count === 2) {
					same(data.elements, $items.get(), "All elements are passed to invalidateFlagged handler when all data is flagged");
				}
				count++;
			},
			invalidateUnflagged: function(e, data) {
				same(data.elements, [$items[0]], "Element corresponding to data from unflagged element is passed to invalidateUnflagged handler");
			}
		}).
		delegate('a', 'click', function(e) {
			e.preventDefault();
			$f.flaggable('flag', this);
		});

	$items.eq(0).click();
	$items.eq(1).click();
	same($f.flaggable('flagged'), [1, 2], "Clicked elements' data are flagged items");
	
	$items.eq(0).click();
	$f.flaggable('flag', null);
	
});

}(jQuery));


/*
(function($) {

module('flaggable', {
	setup: function() {
		this.$ul = $('#main > ul:first');
		this.$li = $('#main > ul:first > li');
	}
});

test('flag event', function() {
	expect(2);

	var q = this;

	q.$ul.
		flaggable({item: '#main > ul > li'}).
		bind('flag', function(e, $items) {
			equals(e.type, 'flag', "flag event triggered");
			equals($items[0], q.$li[0], "Flagged item supplied as data");
		});
	q.$li.simulate('click');
});

test('unflag event', function() {
	expect(2);

	var q = this;

	q.$ul.
		flaggable({item: '#main > ul > li'}).
		bind('unflag', function(e, $items) {
			equals(e.type, 'unflag', "unflag event triggered");
			equals($items[0], q.$li[0], "Unflagged item supplied as data");
		});
	q.$li.simulate('click').simulate('click');
});

}(jQuery));
*/
