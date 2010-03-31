jQuery(function($) {

var $listview,
	data = [
		{id: 1, name: "Tim Molendijk", age: 27},
		{id: 3, name: "Art Molendijk", age: 25},
		{id: 2, name: "Manja Molendijk", age: 22},
		{id: 4, name: "Corrie van Vliet", age: 56},
		{id: 1, name: "Tim Molendijk", age: 27},
		{id: 5, name: "Teunis Molendijk", age: 61}
	];

module('listview', {
	setup: function() {
		$listview = $('#listview');
	}
});

test("Data via a function", 15, function() {
	
	var attempt = 0;
	
	$listview.listview({
		data: function(cb, after) {
			if (attempt === 0) {
				equals(this, $listview[0], "Data function's context is the element in which the view is created");
			}
			attempt++;
			cb(data);
		}
	});
	equals($listview.find('li').length, 6, "View displays all items");
	equals($listview.listview('displayCount'), 6, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 6, "Correct internal representation for number of loaded items");
	equals($listview.listview('totalCount'), 6, "Correct internal representation for size of total data set");
	
	data[0].age = 28;
	$listview.listview('invalidate');
	equals($listview.find('li:first').text(), "Tim Molendijk (28)", "Updated data is reflected by the view upon invalidate");
	
	data.push({id: 6, name: "Bassie & Adriaan", age: 134});
	equals($listview.listview('displayCount'), 7, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 7, "Correct internal representation for number of loaded items");
	equals($listview.listview('totalCount'), 7, "Correct internal representation for size of total data set");
	
	$listview.listview('invalidate');
	equals($listview.find('li').length, 7, "Inexplicitly added data is reflected by the view upon invalidate");
	
	data[0].age = 27;
	data.splice(6, 1);
	
	$listview.listview('option', 'key', 'id');
	$listview.listview('load');
	$listview.listview('option', 'key', null);
	equals($listview.listview('loadedCount'), 6, "Load does not actually add data if the provided data set is identical to the already loaded set");
	
	$listview.listview('load', [{id: 7, name: "Sjakie van de Chocoladefabriek", age: 13}]);
	equals($listview.find('li').length, 7, "Explicitly added data is reflected by the view upon invalidate");
	equals($listview.listview('displayCount'), 7, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 7, "Correct internal representation for number of loaded items");
	equals($listview.listview('totalCount'), 7, "Correct internal representation for size of total data set");
	
	$listview.listview('destroy');
	
});

/* TODO: Add the possibility to supply data directly as soon as this issue is
	resolved: http://dev.jqueryui.com/ticket/5303
test("Data directly", 2, function() {
	
	$listview.listview({
		data: data.slice(0, 2)
	});
	equals($listview.find('li').length, 2, "View displays all items");
	
	data[0].age = 28;
	$listview.listview('invalidate');
	equals($listview.find('li:first').text(), "Tim Molendijk (28)", "Updated data (even without passing it to listview explicitly) is reflected by the view upon invalidate");
	
	$listview.listview('destroy');
	
});
*/

test("Data via a lazy loading function", 31, function() {
	
	var attempt = 0,
		firstChunk;
	
	$listview.listview({
		data: function(cb, after) {
			var d, l = data.length;
			switch (attempt) {
				case 0:
					equals(after, undefined, "No last data item is supplied as this is the first data function call");
					d = firstChunk = data.slice(0, 3);
					l--;
					break;
				case 1:
					d = data.slice(3, 4);
					break;
				case 2:
					equals(after.id, 4, "Last data item that was already loaded is supplied to data function");
					d = data.slice(2, 6);
					break;
				default:
					ok(false, "This point should not be reached, as all data has been provided");
					break;
			}
			attempt++;
			cb(d, l);
		}
	});
	equals($listview.find('li').length, 3, "View displays items that were supplied upon first call to data function");
	equals($listview.listview('displayCount'), 3, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 3, "Correct internal representation for number of loaded items");
	equals($listview.listview('totalCount'), 5, "Correct internal representation for size of total data set");

	equals($listview.listview('load'), true, "If data loading is successful or at least attempted, return value is true");
	equals($listview.find('li').length, 4, "More data (as decided by data function) is added on demand");
	equals($listview.listview('displayCount'), 4, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 4, "Correct internal representation for number of loaded items");
	equals($listview.listview('totalCount'), 6, "Correct internal representation for size of total data set");
	equals(firstChunk.length, 3, "Object that was supplied in a previous call is not modified");
	
	$listview.listview('load');
	equals($listview.find('li').length, 8, "More data (as decided by data function) is added on demand");
	equals($listview.listview('displayCount'), 8, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 8, "Correct internal representation for number of loaded items");
	
	// This call should not result in another attempt to fetch data.
	equals($listview.listview('load'), false, "If all data is already loaded, attempts to load more fail with a return value of false");
	
	$listview.listview('option', 'key', 'does-not-exist');
	equals($listview.find('li').length, 8, "Invalid identity parameter behaves like no identity parameter");
	equals($listview.listview('displayCount'), 8, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 8, "Correct internal representation for number of loaded items");
	
	$listview.listview('option', 'key', 'id');
	equals($listview.find('li').length, 5, "Identity parameter results in automatic deduplication");
	equals($listview.listview('displayCount'), 5, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 5, "Correct internal representation for number of loaded items");
	
	attempt = 0;
	$listview.listview('reload');
	equals($listview.find('li').length, 3, "Reloading clears all data and starts anew");
	equals($listview.listview('displayCount'), 3, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 3, "Correct internal representation for number of loaded items");
	equals($listview.listview('totalCount'), 5, "Correct internal representation for size of total data set");
	
	$listview.listview('load');
	$listview.listview('load');
	equals($listview.find('li').length, 5, "More data (as decided by data function) is added and deduplicated on demand");
	equals($listview.listview('displayCount'), 5, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 5, "Correct internal representation for number of loaded items");
	
	$listview.listview('destroy');
	
});

test("Display threshold", 17, function() {
	
	var attempt = 0;
	
	$listview.listview({
		data: function(cb) {
			var d;
			switch (attempt) {
				case 0:
					d = data.slice(0, 1);
					break;
				case 1:
					d = data.slice(1, 4);
					break;
				case 2:
					d = data.slice(4, 6);
					break;
			}
			attempt++;
			cb(d);
		},
		key: 'id',
		threshold: 2
	});
	equals($listview.find('li').length, 1, "View displays all items that are both available and below threshold");
	equals($listview.listview('displayCount'), 1, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 1, "Correct internal representation for number of loaded items");
	equals($listview.listview('totalCount'), 1, "Correct internal representation for size of total data set");
	
	$listview.listview('load');
	equals($listview.find('li').length, 2, "View displays all items that are both available and below threshold");
	equals($listview.listview('displayCount'), 2, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 4, "Correct internal representation for number of loaded items");
	
	$listview.listview('moveThreshold', 3);
	equals($listview.listview('threshold'), 5, "Threshold has been adjusted");
	equals($listview.find('li').length, 4, "View displays all items that are both available and below threshold");
	equals($listview.listview('displayCount'), 4, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 4, "Correct internal representation for number of loaded items");
	
	$listview.listview('load');
	equals($listview.find('li').length, 5, "View displays all items that are both available and below threshold");
	equals($listview.listview('displayCount'), 5, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 5, "Correct internal representation for number of loaded items");
	
	$listview.listview('threshold', 4);
	equals($listview.find('li').length, 4, "View displays all items that are both available and below threshold");
	equals($listview.listview('displayCount'), 4, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 5, "Correct internal representation for number of loaded items");
	
	$listview.listview('destroy');
	
});

test("Sort and grep", 14, function() {
	
	var order = 'name',
		query = 'molendijk';
	
	$listview.listview({
		data: function(cb) {
			cb(data);
		},
		sort: function(a, b) {
			a = a[order];
			b = b[order];
			return a < b ? -1 : a > b ? 1 : 0;
		},
		grep: function(item) {
			return item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
		},
		key: 'id',
		threshold: 5
	});
	equals($listview.find('li').length, 4, "View displays all items that both match grep criteria and are below threshold");
	equals($listview.find('li').text(), "Art Molendijk (25)Manja Molendijk (22)Teunis Molendijk (61)Tim Molendijk (27)", "View displays items in order according to supplied sort function");
	equals($listview.listview('displayCount'), 4, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 5, "Correct internal representation for number of loaded items");
	equals($listview.listview('greppedCount'), 4, "Correct internal representation for number of items that match grep criteria");
	
	$listview.listview('moveThreshold', -3);
	equals($listview.find('li').length, 2, "View displays all items that both match grep criteria and are below threshold");
	equals($listview.listview('displayCount'), 2, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 5, "Correct internal representation for number of loaded items");
	equals($listview.listview('greppedCount'), 4, "Correct internal representation for number of items that match grep criteria");
	
	query = 'a';
	$listview.listview('threshold', null);
	equals($listview.find('li').length, 3, "View displays all items that match grep criteria");
	equals($listview.find('li').text(), "Art Molendijk (25)Corrie van Vliet (56)Manja Molendijk (22)", "View displays items in order according to supplied sort function");
	equals($listview.listview('displayCount'), 3, "Correct internal representation for number of displayed items");
	equals($listview.listview('loadedCount'), 5, "Correct internal representation for number of loaded items");
	equals($listview.listview('greppedCount'), 3, "Correct internal representation for number of items that match grep criteria");
	
	$listview.listview('destroy');

});






/* OUTDATED

test("The basics; data by reference, automatic deduplication", 8, function() {

	$listview.listview({
		data: function(render) {
			equals(this, $listview[0], "Data function's context is the element in which the view is created");
			render(data);
		},
		invalidate: function() {
			ok(true, "Invalidate triggers event");
		}
	});
	equals($listview.find('li').length, 5, "View displays all unique items");
	equals($listview.listview('displayed'), 3, "Correct internal representation for number of displayed items");
	equals($listview.listview('loaded'), 5, "Correct internal representation for number of unique loaded items");
	equals($listview.listview('option', 'total'), 5, "Total amount of data items reflects unique items in loaded data set");
	
	data[0].age = 28;
	$listview.listview('invalidate');
	equals($listview.find('li:first').text(), "Tim Molendijk (28)", "Updated data (even without passing it to listview explicitly) is in reflected by the view upon invalidate");
	
	$listview.listview('destroy');

});

test("Cap on the view", 18, function() {
	
	var attempt = 0;
	
	$listview.listview({
		data: function(render) {
			render(data);
		},
		cap: 3,
		more: function(e, displayed, loaded) {
			switch (attempt) {
				case 0:
					equals(displayed, 3, "Correct number of newly displayed items at stage one");
					equals(loaded, 5, "Correct number of newly loaded items at stage one");
					break;
				case 1:
					equals(displayed, 1, "Correct number of newly displayed items at stage two");
					equals(loaded, 0, "Correct number of newly loaded items at stage two");
					break;
				case 2:
					equals(displayed, 1, "Correct number of newly displayed items at stage three");
					equals(loaded, 0, "Correct number of newly loaded items at stage three");
					break;
				default:
					ok(false, "This point should not be reached, as all data has been provided");
					break;
			}
			attempt++;
		},
		nomore: function() {
			equals($listview.listview('displayed'), $listview.listview('option', 'total'), "nomore event is triggered right after the last chunk has been displayed");
		}
	});
	equals($listview.find('li').length, 3, "View displays first chunk");
	equals($listview.listview('displayed'), 3, "Correct internal representation for number of displayed items");
	equals($listview.listview('loaded'), 5, "Correct internal representation for number of unique loaded items");
	equals($listview.listview('option', 'total'), 5, "Total amount of data items reflects loaded data set");
	
	$listview.listview('more', 1);
	equals($listview.listview('option', 'cap'), 4, "Cap is updated accordingly");
	equals($listview.find('li').length, 4, "View displays an additional chunk of size one");
	equals($listview.listview('displayed'), 4, "Correct internal representation for number of displayed items");
	
	$listview.listview('more');
	equals($listview.listview('option', 'cap'), 7, "Cap is updated accordingly");
	equals($listview.find('li').length, 5, "View displays all items");
	equals($listview.listview('displayed'), 5, "Correct internal representation for number of displayed items");
	
	$listview.listview('more');
	equals($listview.listview('displayed'), 5, "Number of displayed items is not impacted by calls for more, as no more data is available");
	
	$listview.listview('destroy');
	
});

test("Supply data via a lazy loading function", 14, function() {
	
	var attempt = 0;
	
	$listview.listview({
		data: function(render, count, after) {
			var d;
			switch (attempt) {
				case 0:
					equals(count, undefined, "No item count is supplied as no cap has been defined");
					equals(after, undefined, "No last data item is supplied as this is the first data function call");
					d = data.slice(0, 3);
					break;
				case 1:
					equals(count, 100, "Explicit quantity requests from calls for more are passed on to data function");
					// Quantity requests can safely be overruled.
					d = data.slice(3, 4);
					break;
				case 2:
					equals(after.id, 4, "Last data item that was already loaded is supplied to data function");
					// Supply data that overlaps with already loaded data, which
					// will automatically be deduplicated.
					d = data.slice(2, 6);
					break;
				default:
					ok(false, "This point should not be reached, as all data has been provided");
					break;
			}
			attempt++;
			render(d, 5);
		},
		// The field that identifies an item can be explicitly set.
		id: 'age'
	});
	equals($listview.find('li').length, 3, "View displays items that were supplied upon first call to data function");
	equals($listview.listview('displayed'), 3, "Correct internal representation for number of displayed items");
	equals($listview.listview('loaded'), 3, "Correct internal representation for number of unique loaded items");
	equals($listview.listview('option', 'total'), data.length, "Total amount of data items as reported by data function");

	$listview.listview('more', 100);
	equals($listview.find('li').length, 4, "More data (as decided by data function) is added on demand");
	equals($listview.listview('displayed'), 4, "Correct internal representation for number of displayed items");
	equals($listview.listview('loaded'), 4, "Correct internal representation for number of unique loaded items");
	
	$listview.listview('more');
	equals($listview.find('li').length, 5, "More data (as decided by data function) is added on demand");
	equals($listview.listview('displayed'), 5, "Correct internal representation for number of displayed items");
	equals($listview.listview('loaded'), 5, "Correct internal representation for number of unique loaded items");
	
	// This call should not result in another attempt to fetch data.
	$listview.listview('more');
	
	$listview.listview('destroy');
	
});

test("Supply data via a lazy loading function in combination with a cap on the view", 11, function() {
	
	var attempt = 0;
	
	$listview.listview({
		data: function(render, count, after) {
			var d, l = 5;
			switch (attempt) {
				case 0:
					equals(count, 2, "Two data items are requested upon first data function call");
					d = data.slice(0, 3);
					// Total expected items can be updated upon every call.
					l--;
					break;
				case 1:
					equals(count, 1, "Only one more data item is required to generate the requested view");
					equals(after.id, 2, "Last data item that was already loaded is supplied to data function");
					// It is the data function's responsibility to supply the
					// requested data. If it doesn't, the view won't be filled
					// up to the cap and/or calls for more look unsuccessful.
					d = [];
					break;
				case 3:
					d = data.slice(3, 6);
					break;
				default:
					ok(false, "This point should not be reached, as all required data has been supplied");
			}
			attempt++;
			render(d, l);
		},
		more: function(e, displayed, loaded) {
			switch (attempt) {
				case 1:
					equals(displayed, 1, "Correct number of newly displayed items at stage one");
					equals(loaded, 3, "Correct number of newly loaded items at stage one");
					break;
				case 2:
					equals(displayed, 2, "Correct number of newly displayed items at stage two");
					equals(loaded, 0, "Correct number of newly loaded items at stage two");
					break;
				case 3:
					equals(displayed, 2, "Correct number of newly displayed items at stage three");
					equals(loaded, 2, "Correct number of newly loaded items at stage three");
					break;
				default:
					ok(false, "This point should not be reached, as all data has been provided");
					break;
			}
		},
		cap: 1,
		step: 2
	});
	equals($listview.find('li').length, 2, "View displays first chunk");
	equals($listview.listview('option', 'display'), 2, "Correct internal representation for number of displayed items");
	equals($listview.listview('option', 'total'), data.length - 1, "Total amount of data items as reported by data function");
	
	$listview.listview('more');
	equals($listview.find('li').length, 4, "View displays first two chunks");
	equals($listview.listview('option', 'display'), 4, "Correct internal representation for number of displayed items");
	equals($listview.listview('option', 'total'), data.length, "Total amount of data items as reported by (last call to) data function");
	
	$listview.listview('more');
	equals($listview.find('li').length, 5, "View displays first three chunks (all data)");
	equals($listview.listview('option', 'display'), data.length, "Correct internal representation for number of displayed items");

	$listview.listview('destroy');
	
});

test("Apply sorting and grepping in combination with view in (pre-defined) chunks", 7, function() {
	
	var order = 'name',
		query = 'molendijk';
	
	$listview.listview({
		data: function(render) {
			render(data);
		},
		sort: function(a, b) {
			a = a[order];
			b = b[order];
			return a < b ? -1 : a > b ? 1 : 0;
		},
		grep: function(item) {
			return item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
		},
		chunk: 3
	});
	equals($listview.find('li').length, 3, "View displays first chunk of items that match grep criteria");
	equals($listview.find('li').text(), "Art Molendijk (25)Manja Molendijk (22)Teunis Molendijk (61)", "View displays items in order according to supplied sort function");
	equals($listview.listview('option', 'display'), 3, "Correct internal representation for number of displayed items");
	equals($listview.listview('option', 'total'), data.length, "Total amount of data items reflects loaded data set");
	
	$listview.listview('more');
	equals($listview.find('li').length, 4, "View displays all items that match grep criteria");
	equals($listview.find('li').text(), "Art Molendijk (25)Manja Molendijk (22)Teunis Molendijk (61)Tim Molendijk (27)", "View displays items in order according to supplied sort function");
	equals($listview.listview('option', 'display'), 4, "Correct internal representation for number of displayed items");
	
	$listview.listview('destroy');

});

test("Apply sorting and grepping in combination with data from a lazy loading function and a cap on the view", 7, function() {
	
	var attempt = 0,
		order = 'name',
		query = 'a';
	
	$listview.listview({
		data: function(render, count, after) {
			render(data.slice(attempt, ++attempt), data.length);
		},
		sort: function(a, b) {
			a = a[order];
			b = b[order];
			return a < b ? -1 : a > b ? 1 : 0;
		},
		grep: function(item) {
			return item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
		},
		cap: 2
		// TODO: test 'more' event, which should provide the handler with number
		// of items added to the display and number of items added to the
		// internal data set.
	});
	equals($listview.find('li').length, 3, "View displays first chunk of items that match grep criteria");
	equals($listview.find('li').text(), "Art Molendijk (25)Manja Molendijk (22)Teunis Molendijk (61)", "View displays items in order according to supplied sort function");
	equals($listview.listview('option', 'display'), 3, "Correct internal representation for number of displayed items");
	equals($listview.listview('option', 'total'), data.length, "Total amount of data items reflects loaded data set");
	
	$listview.listview('more');
	equals($listview.find('li').length, 4, "View displays all items that match grep criteria");
	equals($listview.find('li').text(), "Art Molendijk (25)Manja Molendijk (22)Teunis Molendijk (61)Tim Molendijk (27)", "View displays items in order according to supplied sort function");
	equals($listview.listview('option', 'display'), 4, "Correct internal representation for number of displayed items");
	
	$listview.listview('destroy');

});

// TODO: change options via 'option' method
*/

});
