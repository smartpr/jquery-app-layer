(function($) {

var $flagable;

module('flagable', {
	setup: function() {
		$flagable = $('#dataview');
	}
});

test("Initial state", 2, function() {
	
	$flagable.flagable();
	
	same($flagable.flagable('flagged'), [], "Flagged items is an empty array");
	equals($flagable.flagable('unflagged'), null, "Unflagged items is null, denoting all but flagged");
	
});

test("Flag and unflag", 26, function() {
	
	$flagable.flagable();
	
	$flagable.bind({
		flagableflag: function(e, items) {
			equals(items, null, "flagableflag event triggered with correct items");
		},
		flagableunflag: function(e, items) {
			ok(false, "This point should not be reached, as no flagableunflag event must be triggered (with items: " + items + ")");
		}
	});
	$flagable.flagable('flag', null);
	equals($flagable.flagable('flagged'), null, "Flagging all items after all items were implicitly non-flagged does impact flagged items");
	same($flagable.flagable('unflagged'), [], "And it also has an effect on unflagged items");
	$flagable.unbind();
	
	$flagable.bind({
		flagableflag: function(e, items) {
			ok(false, "This point should not be reached, as no flagableflag event must be triggered (with items: " + items + ")");
		},
		flagableunflag: function(e, items) {
			ok(false, "This point should not be reached, as no flagableunflag event must be triggered (with items: " + items + ")");
		}
	});
	$flagable.flagable('flag', 1);
	equals($flagable.flagable('flagged'), null, "Flagging implicitly flagged items does not impact flagged items");
	same($flagable.flagable('unflagged'), [], "Nor does it have an effect on unflagged items");
	$flagable.unbind();
	
	$flagable.bind({
		flagableflag: function(e, items) {
			ok(false, "This point should not be reached, as no flagableflag event must be triggered (with items: " + items + ")");
		},
		flagableunflag: function(e, items) {
			same(items, [1, 2], "flagableunflag event triggered with correct items");
		}
	});
	$flagable.flagable('unflag', [1, 2]);
	equals($flagable.flagable('flagged'), null, "Unflagging implicitly flagged items does not impact flagged items");
	same($flagable.flagable('unflagged'), [1, 2], "But it does have an effect on unflagged items");
	$flagable.unbind();
	
	$flagable.bind({
		flagableflag: function(e, items) {
			same(items, [2], "flagableflag event triggered with correct items");
		},
		flagableunflag: function(e, items) {
			ok(false, "This point should not be reached, as no unflagableflag event must be triggered (with items: " + items + ")");
		}
	});
	$flagable.flagable('flag', [2, 3]);
	equals($flagable.flagable('flagged'), null, "Flagging explicitly non-flagged items or implicitly flagged items does not impact flagged items");
	same($flagable.flagable('unflagged'), [1], "But it does have an effect on unflagged items");
	$flagable.unbind();
	
	$flagable.bind({
		flagableflag: function(e, items) {
			ok(false, "This point should not be reached, as no flagableflag event must be triggered (with items: " + items + ")");
		},
		flagableunflag: function(e, items) {
			equals(items, null, "flagableunflag event triggered with correct items");
		}
	});
	$flagable.flagable('unflag', null);
	same($flagable.flagable('flagged'), [], "Unflagging all items after all items were implicitly flagged does impact flagged items");
	equals($flagable.flagable('unflagged'), null, "And it also has an effect on unflagged items");
	$flagable.unbind();
	
	$flagable.bind({
		flagableflag: function(e, items) {
			same(items, [1], "flagableflag event triggered with correct items");
		},
		flagableunflag: function(e, items) {
			ok(false, "This point should not be reached, as no flagableunflag event must be triggered (with items: " + items + ")");
		}
	});
	$flagable.flagable('flag', 1);
	same($flagable.flagable('flagged'), [1], "Flagging implicitly non-flagged items does impact flagged items");
	equals($flagable.flagable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flagable.unbind();
	
	$flagable.bind({
		flagableflag: function(e, items) {
			same(items, [2, 3], "flagableflag event triggered with correct items");
		},
		flagableunflag: function(e, items) {
			ok(false, "This point should not be reached, as no flagableunflag event must be triggered (with items: " + items + ")");
		}
	});
	$flagable.flagable('flag', [2, 3]);
	same($flagable.flagable('flagged'), [1, 2, 3], "Flagging implicitly non-flagged items does impact flagged items in a way that takes currently flagged items into account");
	equals($flagable.flagable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flagable.unbind();
	
	$flagable.bind({
		flagableflag: function(e, items) {
			ok(false, "This point should not be reached, as no flagableflag event must be triggered (with items: " + items + ")");
		},
		flagableunflag: function(e, items) {
			same(items, [1, 3], "flagableunflag event triggered with correct items");
		}
	});
	$flagable.flagable('unflag', [1, 3, 4]);
	same($flagable.flagable('flagged'), [2], "Unflagging explicitly flagged items or implicitly non-flagged items does impact flagged items");
	equals($flagable.flagable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flagable.unbind();
	
	$flagable.bind({
		flagableflag: function(e, items) {
			ok(false, "This point should not be reached, as no flagableflag event must be triggered (with items: " + items + ")");
		},
		flagableunflag: function(e, items) {
			same(items, [2], "flagableunflag event triggered with correct items");
		}
	});
	$flagable.flagable('unflag', null);
	same($flagable.flagable('flagged'), [], "Unflagging all items after some items were explicitly flagged does impact flagged items");
	equals($flagable.flagable('unflagged'), null, "But it does not have an effect on unflagged items");
	$flagable.unbind();
	
});

}(jQuery));


/*
(function($) {

module('flagable', {
	setup: function() {
		this.$ul = $('#main > ul:first');
		this.$li = $('#main > ul:first > li');
	}
});

test('flag event', function() {
	expect(2);

	var q = this;

	q.$ul.
		flagable({item: '#main > ul > li'}).
		bind('flagableflag', function(e, $items) {
			equals(e.type, 'flagableflag', "flag event triggered");
			equals($items[0], q.$li[0], "Flagged item supplied as data");
		});
	q.$li.simulate('click');
});

test('unflag event', function() {
	expect(2);

	var q = this;

	q.$ul.
		flagable({item: '#main > ul > li'}).
		bind('flagableunflag', function(e, $items) {
			equals(e.type, 'flagableunflag', "unflag event triggered");
			equals($items[0], q.$li[0], "Unflagged item supplied as data");
		});
	q.$li.simulate('click').simulate('click');
});

}(jQuery));
*/
