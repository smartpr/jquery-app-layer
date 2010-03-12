(function($) {

module('data', {
	setup: function() {
		this.$div = $('#main > div:first');
		this.$ul = $('#main > ul:first');
		this.$both = $([this.$div.get(0), this.$ul.get(0)]);
	}
});

test('$.fn.fetch', function() {
	expect(6);
	
	same(this.$div.fetch(), undefined, "No arguments and no data returns undefined");
	
	this.$div.data('key', 'value');
	same(this.$div.fetch(), {key: 'value'}, "No arguments returns all data");
	equals(this.$div.fetch('key'), 'value', "Fetch value one level deep");
	same(this.$div.fetch('does-not-exist'), undefined, "Non-existent key one level deep returns undefined");
	same(this.$div.fetch('key', 'does-not-exist'), undefined, "Non-existent key two levels deep returns undefined");
	same(this.$div.fetch('does-not-exist', 'does-not-exist'), undefined, "Non-existent keys two levels deep returns undefined");
});

test('$.fn.store', function() {
	expect(10);
	
	equals(this.$div.store({key: 'value'}), this.$div, "Returns jQuery object");
	
	this.$div.store({newKey: 'value'});
	same(this.$div.data(), {newKey: 'value'}, "Store without a path expects a data object that replaces any existing objects");
	equals(this.$div.store('this is not a data object'), this.$div, "Store without a path and without a data object returns jQuery object");
	same(this.$div.data(), {newKey: 'value'}, "Store without a path and without a data object does not affect existing data");
	
	this.$div.store('key', 'level2', 'level3', true);
	same(this.$div.data(), {newKey: 'value', key: {level2: {level3: true}}}, "Store multiple levels deep");
	
	this.$div.store('newKey', 'level2', false);
	same(this.$div.data(), {newKey: {level2: false}, key: {level2: {level3: true}}}, "Existing data may be overridden and destroyed");
	
	this.$div.removeData();
	this.$both.store({key: {level2: {level3: true}}});
	this.$div.store('key', 'more-level2', 2010);
	same(this.$div.data(), {key: {level2: {level3: true}, 'more-level2': 2010}}, "Changing data on one element does not affect data on other elements that was stored in the same operation");
	same(this.$ul.data(), {key: {level2: {level3: true}}}, "Changing data on one element does not affect data on other elements that was stored in the same operation");
	
	this.$both.store('key', 'level2"', 'value"');
	same(this.$ul.data(), {key: {level2: {level3: true}, 'level2"': 'value"'}}, "Changing data on multiple elements results in a change with regard to the existing data on each individual element");
	
	this.$both.removeData();
	this.$both.store({key: {level2: true, 'level2"': false}});
	this.$div.store('key', 'level2', undefined);
	this.$ul.del('key', 'level2');
	same(this.$div.data(), this.$ul.data(), "Storing undefined equals delete");
});

test('$.fn.del', function() {
	expect(4);
	
	this.$both.data({key: {level2: true, 'level2"': false}});
	this.$div.del('key', 'level2');
	same(this.$div.data(), {key: {'level2"': false}}, "Delete part of data some levels deep");
	same(this.$ul.data(), {key: {level2: true, 'level2"': false}}, "Data on other elements is unaffected");
	
	this.$both.del('key', 'level2"');
	same(this.$div.data(), {}, "Empty objects collapse to undefined and fields with value undefined collapse to being deleted");
	same(this.$ul.data(), {key: {level2: true}}, "Deleting data from multiple elements results in a change with regard to the existing data on each individual element");
});

test(':data selector', function() {
	expect(1);
	
	this.$both.data({key: {level2: true, 'level2"': false}});
	delete this.$div.data().key.level2;
	equals($(':data(key.level2=true)')[0], this.$ul[0], "Nested data is matched");
});

}(jQuery));
