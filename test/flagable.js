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
