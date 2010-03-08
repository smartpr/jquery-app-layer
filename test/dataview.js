jQuery(function($) {

var $dataview = $('#dataview'),
	data = [
		{id: 1, name: "Tim", age: 27},
		{id: 3, name: "Art", age: 25},
		{id: 2, name: "Manja", age: 22},
		{id: 4, name: "Corrie", age: 56},
		{id: 5, name: "Teunis", age: 61}
	];

module('dataview');

/* TODO: Add the possibility to supply data directly as soon as this issue is
	resolved: http://dev.jqueryui.com/ticket/5303
test("Supply data directly", 2, function() {
	
	$dataview.dataview({
		data: data.slice(0, 2)
	});
	equals($dataview.find('li').length, 2, "View is built correctly");
	
	data[0].age = 28;
	$dataview.dataview('invalidate');
	equals($dataview.find('li:first').text(), "Tim (28)", "Invalidate to reflect updated data");
	
});
*/

test("Supply data via a function", 4, function() {

	$dataview.dataview({
		data: function(render) {
			equals(this, $dataview[0], "Data function's context is the element in which the view is created");
			render(data);
		}
	});
	// TODO: test invalidate event
	equals($dataview.find('li').length, data.length, "View displays all items");
	equals($dataview.dataview('option', 'total'), data.length, "Total amount of data items reflects loaded data set");
	
	data[0].age = 28;
	$dataview.dataview('invalidate');
	equals($dataview.find('li:first').text(), "Tim (28)", "Invalidate to reflect updated data");
	
	$dataview.dataview('destroy');

});

test("View in chunks", 7, function() {

	$dataview.dataview({
		data: function(render) {
			render(data);
		},
		chunk: 3,
		nomore: function() {
			equals($dataview.dataview('option', 'display'), $dataview.dataview('option', 'total'), "nomore event is triggered right after the last chunk has been displayed");
		}
	});
	equals($dataview.find('li').length, 3, "View displays only first chunk");
	equals($dataview.dataview('option', 'display'), 3, "Correct internal representation for number of displayed items");
	equals($dataview.dataview('option', 'total'), data.length, "Total amount of data items reflects loaded data set");
	
	$dataview.dataview('more');
	equals($dataview.find('li').length, 5, "View displays first two chunks");
	equals($dataview.dataview('option', 'display'), 5, "Correct internal representation for number of displayed items");
	
	$dataview.dataview('more');
	equals($dataview.dataview('option', 'display'), 5, "Number of displayed items is not impacted by calls for more, as no more data is available");
	
	$dataview.dataview('destroy');
	
});


test("Supply data via a lazy loading function", 6, function() {
	
	$dataview.dataview({
		data: function(render, count, after) {
			if (count === undefined) {
				count = 3;
			}
			var d = data.slice(0, 0 + count);
			if (after !== undefined) {
				equals(after.id, 2, "Last data item that was already loaded is supplied");
				// TODO: supply overlapping data
				d = data.slice(3, 3 + count);
			}
			render(d, data.length);
		}
	});
	equals($dataview.find('li').length, 3, "View displays only first chunk");
	equals($dataview.dataview('option', 'display'), 3, "Correct internal representation for number of displayed items");
	equals($dataview.dataview('option', 'total'), data.length, "Total amount of data items reflects loaded data set");

	$dataview.dataview('more');
	equals($dataview.find('li').length, 5, "More data is added on demand");
	equals($dataview.dataview('option', 'display'), 5, "Correct internal representation for number of displayed items");
	
	$dataview.dataview('destroy');
	
	// TODO: same as above but with chunk = 2 (which is different from the default chunks as supplied by the data function)
	
});

// TODO: change data via 'option' method

});
