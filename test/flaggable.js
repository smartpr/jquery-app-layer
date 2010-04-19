(function($) {

var $flaggable;

module('flaggable', {
	setup: function() {
		$flaggable = $('#flaggable');
	}
});

test("Initial state", 2, function() {
	
	$flaggable.flaggable();
	
	same($flaggable.flaggable('flagged'), [], "Flagged items is an empty array");
	equals($flaggable.flaggable('unflagged'), null, "Unflagged items is null, denoting all but flagged");
	
});

test("Flag and unflag", 28, function() {
	
	var count = 0;
	$flaggable.flaggable({
		flagFirst: function(e) {
			count++;
		},
		unflagLast: function(e) {
			count++;
		}
	});
	equals(count, 10, "flagFirst and unflagLast callbacks are being called correctly");
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			equals(data.items, null, "flag event triggered with correct items");
		},
		flaggableunflag: function(e, data) {
			ok(false, "This point should not be reached, as no unflag event must be triggered (with items: " + data.items + ")");
		}
	});
	$flaggable.flaggable('flag', null);
	equals($flaggable.flaggable('flagged'), null, "Flagging all items after all items were implicitly non-flagged does impact flagged items");
	same($flaggable.flaggable('unflagged'), [], "And it also has an effect on unflagged items");
	$flaggable.unbind();
	
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
	$flaggable.flaggable('toggle', [1, 3, 4]);
	same($flaggable.flaggable('flagged'), [2, 4], "Unflagging explicitly flagged items or implicitly non-flagged items does impact flagged items");
	equals($flaggable.flaggable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flaggable.unbind();
	
	$flaggable.bind({
		flaggableflag: function(e, data) {
			ok(false, "This point should not be reached, as no flag event must be triggered (with items: " + data.items + ")");
		},
		flaggableunflag: function(e, data) {
			same(data.items, [2], "unflag event triggered with correct items");
		}
	});
	$flaggable.flaggable('unflag', null);
	same($flaggable.flaggable('flagged'), [4], "Unflagging all items after some items were explicitly flagged does impact flagged items");
	equals($flaggable.flaggable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flaggable.unbind();
	
});

test("Link to DOM; elements are flagged", 2, function() {
	
	var items = 'a',
		$items = $flaggable.find(items),
		count = 0;
	
	$flaggable.flaggable({
		elements: items,
		handle: function(e) {
			e.preventDefault();
		},
		flag: function(e, data) {
			if (count === 0) {
				same(data.items, [$items[0]], "Clicked element is passed to flag handler");
			}
			count++;
		}
	});
	
	$items.eq(0).click();
	$items.eq(2).click();
	same($flaggable.flaggable('flagged'), [$items[0], $items[2]], "Clicked elements are flagged items");
	
});

test("Link to DOM; data that is retrieved from elements are flagged", 5, function() {

	var items = 'a',
		$items = $flaggable.find(items),
		count1 = 0, count2 = 0;
	
	$flaggable.flaggable({
		elements: items,
		handle: function(e) {
			e.preventDefault();
		},
		data: function() {
			return parseInt($(this).attr('href'));
		},
		flag: function(e, data) {
			if (count1++ === 0) {
				same(data.items, [1], "Clicked element's data is passed to flag handler");
			}
		},
		invalidateFlagged: function(e, data) {
			if (count2 === 1) {
				same(data.elements, [$items[1], $items[4], $items[7]], "Elements corresponding to data from flagged element are passed to invalidateFlagged handler");
			}
			if (count2 === 3) {
				same(data.elements, $items.get(), "All elements are passed to invalidateFlagged handler when all data is flagged");
			}
			count2++;
		},
		invalidateUnflagged: function(e, data) {
			same(data.elements, [$items[0]], "Element corresponding to data from unflagged element is passed to invalidateUnflagged handler");
		}
	});
	
	$items.eq(0).click();
	$items.eq(1).click();
	same($flaggable.flaggable('flagged'), [1, 2], "Clicked elements' data are flagged items");
	
	$items.eq(0).click();
	$flaggable.flaggable('flag', null);
	
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
