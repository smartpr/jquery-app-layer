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
	
	test("$.fn.dataview: set", 3, function() {
		var $dataview = $('#flirt');
		
		equals($dataview.dataview('set', 'some data'), $dataview, "Returns object on which set is initiated");
		equals($dataview.find('li').eq(1).text(), "some data", "If no template name is supplied the (breadth-)first template is used");
		
		$dataview.dataview('set', ['more data', 'and even more']);
		equals($dataview.find('li').length, 5, "Set overwrites existing views of the same template");
		
	});
	
	test("$.fn.dataview: get from containing element", 3, function() {
		var $dataview = $('#flirt').dataview('set', data, 'complex');
		
		$dataview.dataview('set', ["tim", "art"], 'simple');
		equals($dataview.dataview('get').length, 2, "Getting data without specifying template name returns data from (breadth-)first template");
		equals($dataview.dataview('get', 'complex'), data, "Getting data from container returns the exact data object that was used to create the dataview using the same template name");
		equals($('#main').dataview('get', 'complex'), data, "Data can be retrieved from a containing element at any level, as long as the template name will end up at the same template node");
		
	});
	
	test("$.fn.dataview: get from rendered element", 3, function() {
		var $dataview = $('#flirt').dataview('set', data, 'complex');
		
		equals($dataview.find('li').eq(2).dataview('get'), group, "Getting data from a node that is part of a view returns the smallest (closest) piece of data that is responsible for the node");
		equals($dataview.find('li').eq(2).contents().dataview('get'), group, "Getting from a child node that is not part of a smaller data piece returns the same data");
		
		equals($dataview.find('li').eq(2).find('a:first').dataview('get'), member, "Closest piece of data may well be a nested item");
		
	});
	
	test("$.fn.dataview: invalidate", 2, function() {
		var $dataview = $('#flirt'),
			d = $.merge([], data);
		
		$dataview.dataview('set', d, 'complex');
		d[0].group = 'A"';
		$dataview.dataview('invalidate', 'complex');
		ok($dataview.text().indexOf('A"') !== -1, "Changed data item is reflected in the view");
		
		var list = ["tim", "art", "manja"];
		$dataview.dataview('set', list, 'simple');
		list.push("molendijk");
		$dataview.dataview('invalidate', 'simple');
		equals($dataview.find('li.simple').length, 4, "Changed list definition is reflected in the view");
		
		// TODO: Do we really want this behavior? See first TODO under case
		// 'invalidate'.
		// d.push(d[0]);
		// list.pop(0);
		// $dataview.dataview('invalidate');
		// equals($dataview.find('li').length, 14, "Invalidate without template name invalidates all contained data");
		
	});
	
	test("$.fn.dataview: auto-invalidation for data items of type $.al.Field", 3, function() {
		var $dataview = $('#flirt');
		
		var list = [$.al.Field().val("tim"), $.al.Field().val("art")];
		$dataview.dataview('set', list, 'fields');
		equals($dataview.find('li.field').length, 2, "View based on fields is rendered correctly");
		
		list[0].val("molendijk");
		equals($dataview.find('li.field:first').text(), "molendijk", "View is updated automagically upon field change");
		
		list[0].val("wizard");
		equals($dataview.find('li.field:first').text(), "wizard", "This capability is maintained after first change");
		
	});
	
	test("$.fn.dataview: auto-invalidate for data lists of type $.al.List", 3, function() {
		var $dataview = $('#flirt');
		
		var list = $.al.List().val(["tim", "art"]);
		
		$dataview.dataview('set', list);
		equals($dataview.find('li.simple').length, 2, "View based on list is rendered correctly");
		
		list.val(["tim", "art", "manja"]);
		equals($dataview.find('li.simple').length, 3, "View is updated automagically upon list change");
		
		list.val(["tim"]);
		equals($dataview.find('li.simple').length, 1, "This capability is maintained after first change");
		
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