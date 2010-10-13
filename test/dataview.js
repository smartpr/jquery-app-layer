jQuery(function($) {

var member = {
		id: 1,
		name: "Art",
		fonts: ["Arial", "Verdana"]
	},
	group = {
		group: "A",
		members: [
			member,
			{
				id: 2,
				name: "Amsterdam",
				fonts: ["Arial", "Verdana"]
			}
		]
	},
	data = [
		group,
		{
			group: "B",
			members: [
				{
					id: 3,
					name: "Business",
					fonts: ["Arial", "Verdana"]
				}
			]
		},
		{
			group: "C",
			members: [
				{
					id: 4,
					name: "Computers",
					fonts: ["does-not-exist", "'Times New Roman'"]
				},
				{
					id: 5,
					name: "Cool",
					fonts: ["'Courier New'", "Courier"]
				}
			]
		}
	];
	
	module('dataview');
	
	test("set", 3, function() {
		var $dataview = $('#flirt');
		
		equals($dataview.dataview('set', 'some data'), $dataview, "Dataview returns the jQuery object upon set");
		equals($dataview.find('li').eq(1).text(), "some data", "If no template name is supplied the first (breadth-first) template is used");
		
		$dataview.dataview('set', ['more data', 'and even more']);
		equals($dataview.find('li').length, 3, "Set overwrites existing views of the same template");
		
	});
	
});

/*
jQuery(function($) {

var $dataview,
	$dataviews,
	member = {
		id: 1,
		name: "Art",
		fonts: ["Arial", "Verdana"]
	},
	group = {
		group: "A",
		members: [
			member,
			{
				id: 2,
				name: "Amsterdam",
				fonts: ["Arial", "Verdana"]
			}
		]
	},
	data = [
		group,
		{
			group: "B",
			members: [
				{
					id: 3,
					name: "Business",
					fonts: ["Arial", "Verdana"]
				}
			]
		},
		{
			group: "C",
			members: [
				{
					id: 4,
					name: "Computers",
					fonts: ["does-not-exist", "'Times New Roman'"]
				},
				{
					id: 5,
					name: "Cool",
					fonts: ["'Courier New'", "Courier"]
				}
			]
		}
	];

module('dataview', {
	setup: function() {
		$dataview = $('#flirt');
		$dataviews = $('#flirt, #dataview');
	}
});

test("Set and get data", 7, function() {
	
	$dataview.dataview('set', 'namedtemplate', data);
	equals($dataview.children('li').length, 7, "Setting data results in a correspondingly created view");
	
	var count = 0;
	$dataviews.dataview('set', 'namedtemplate', function(cb) {
		if (count++ === 1) {
			equals(this, $dataviews[1], "Data function's context is the element in which the view is created");
		}
		cb(data);
	});
	equals($dataview.children('li').length, 7, "Setting data via a function results in a correspondingly created view");
	
	equals($dataview.children('li').eq(1).dataview('get'), group, "Getting data on an element that stores data returns that data");
	equals($dataview.find('li').eq(1).find('a:first').dataview('get'), member, "Getting data on an element that does not store data returns the data stored by the closest parent");
	
	equals($dataview.children('li:first').dataview('get'), undefined, "No data to be found fails gracefully");
	equals($dataview.children('li').slice(2, 3).dataview('get'), group, "Getting data on several elements equals getting data on first element");
	
});

test("$.fn.dataview('get')", 2, function() {
	
	var $view = $('#flirt');
	$view.dataview('set', 'namedtemplate', data);
	
	// Dataview only deals with data items, not with their container. The
	// container, either as a concept and as a data structure, is therefore
	// not persisted.
	ok($view.dataview('get')[0] === data[0] &&
		$view.dataview('get')[1] === data[1] &&
		$view.dataview('get')[2] === data[2], "Getting data from element on which dataview was created returns a data set with the exact same items that were supplied upon set");
	
	equals($view.find('li').eq(1).dataview('get'), data[0], "Getting data from element which was created by a template returns data that was use to parse the smallest containing template part");
	
});

test("$.fn.dataview('invalidate')", 2, function() {
	
	var $view = $('#flirt');
	$view.dataview('set', 'namedtemplate', data);
	
	member.name += 'je';
	$view.find('li').eq(1).dataview('invalidate');
	equals($view.find('li').eq(1).find('strong').length, 2, "Invalidation does not change amount of elements");
	equals($view.find('strong:first').text(), "Artje", "Parsed template invalidated based on new data");
	
});

});
*/