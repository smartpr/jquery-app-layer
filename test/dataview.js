jQuery(function($) {

var $dataview,
	$template;

module('dataview', {
	setup: function() {
		$dataview = $('#dataview');
		$template = $($dataview.contents()[3]);
	}
});

test("Set", 1, function() {
/*	
	$template.dataview('set', [
		{
			group: "A",
			members: [
				{
					id: 1,
					name: "Art",
					fonts: [{name: "Arial"}, {name: "Verdana"}]
				},
				{
					id: 2,
					name: "Amsterdam",
					fonts: [{name: "Arial"}, {name: "Verdana"}]
				}
			]
		},
		{
			group: "B",
			members: [
				{
					id: 3,
					name: "Business",
					fonts: [{name: "Arial"}, {name: "Verdana"}]
				}
			]
		},
		{
			group: "C",
			members: [
				{
					id: 4,
					name: "Computers",
					fonts: [{name: "does-not-exist"}, {name: "'Times New Roman'"}]
				},
				{
					id: 5,
					name: "Cool",
					fonts: [{name: "Courier New"}, {name: "Courier"}]
				}
			]
		}
	]);
	*/
	equals($dataview.children('li').length, 7, "Setting data results in a correspondingly created view");
	
});

});
