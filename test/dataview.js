jQuery(function($) {

var $dataview,
	member = {
		id: 1,
		name: "Art",
		fonts: ["Arial", "Verdana"]
	};
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
	};
var data = [
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
	}
});

test("Set and get data", 5, function() {
	
	$dataview.dataview('set', 'namedtemplate', data);
	equals($dataview.children('li').length, 7, "Setting data results in a correspondingly created view");
	
	equals($dataview.children('li').eq(1).dataview('get'), group, "Getting data on an element that stores data returns that data");
	equals($dataview.find('li').eq(1).find('a:first').dataview('get'), member, "Getting data on an element that does not store data returns the data stored by the closest parent");
	
	equals($dataview.children('li:first').dataview('get'), undefined, "No data to be found fails gracefully");
	equals($dataview.children('li').slice(2, 3).dataview('get'), group, "Getting data on several elements equals getting data on first element");
	
});

});
