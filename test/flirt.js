jQuery(function($) {

// Note: should not be used with nodes that are part of the DOM tree, as they
// will be removed from it as a result.
var flatten = function(str, strip) {
	// Convert to text-only, because IE messes with the order of attributes
	// on HTML elements, which makes string comparison impossible.
	str = $('<div />').append(str).text().replace(/\s/g, '').toLowerCase();
	if (typeof strip === 'string') {
		str = str.replace(strip, '');
	}
	return str;
};

var font = "Garamond",	// Should be a unique value for the purpose of these
						// tests.
	member = {
		id: 1,
		name: "Art",
		fonts: [font, "Verdana"]
	},
	group = {
		group: "A",
		members: [
			member,
			{
				id: 2,
				name: "<b>Amsterdam</b>",
				fonts: ["Arial", "Verdana"]
			}
		],
		data: "not a data object"
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
			group: "<span class=\"safe\">C</span>",
			members: [
				{
					id: 4,
					name: "Co<mpute>rs",
					fonts: ["does-not-exist", "'Times New Roman'"]
				},
				{
					id: 5,
					name: "Cool",
					fonts: ["'Courier New'", "Courier"]
				}
			]
		}
	],
	messy = [
		{
			group: 5,
			members: [
				{
					id: undefined,
					name: "Ch>r>cters that should b& <scap<d and Unicode: áœØ™‹¢ÅÛ—±≥÷√∂",
					fonts: [undefined, "arial", null, true, 0]
				}
			]
		}
	];

module('flirt');

test("$.flirt: configuration", 4, function() {
	
	equals($.flirt().nestStart, '<!-', "Without arguments returns settings objects");
	equals($.flirt({nestStart: 'changed'}).nestStart, 'changed', "Changing settings returns changed settings object");
	equals($.flirt().nestStart, 'changed', "Changes are persistent");
	equals($.flirt().nestEnd, '->', "Other settings remain untouched");
	$.flirt({nestStart: '<!-'});
	
});

test("$.flirt: render environment", 7, function() {
	
	var rendered = $.map($('<div />').append($.flirt("\
		<%= this.data.id %>,\
		<%= data %>,\
		<%= 'flirt' in this %>,\
		<%= 'callback' in this %>,\
		<%= 'safe' in this %>,\
		<%= 'esc' in this %>,\
		<%= 'nodes' in this %>\
	", [{id: 1, data: 'data'}])).text().split(','), $.trim);
	
	equals(rendered[0], "1", "this.data is the full data object");
	equals(rendered[1], "data", "data is the value of the data field, if it exists");
	equals(rendered[2], "true", "this.flirt");
	equals(rendered[3], "true", "this.callback");
	equals(rendered[4], "true", "this.safe");
	equals(rendered[5], "true", "this.esc");
	equals(rendered[6], "true", "this.nodes");
	
});

test("$.flirt: render errors", 1, function() {
	
	try {
		$.flirt("<%= doesnotexist %>", [{doesexist: 'tim'}]);
	} catch (err) {
		ok(err, "Error is thrown if non-existent data field is referenced");
	}
	
});

test("$.flirt: render callback", 8, function() {
	var template = $('#flirt').contents('[nodeType=8]')[1].data.substr('complex'.length + 1),
		count = 0;
	
	$.flirt(template, data, function(d, t) {
		
		if (d === font) {
			ok(true, "Callback at font level");
			equals(flatten(this), flatten(font + ","), "Callback's context is the DOM nodes that were rendered using the font data");
			// TODO: Move to checking both data and template as soon we
			// provide the template appropriately.
			// equals(flatten(this), flatten(t(font)), "Callback's context is the DOM nodes that resulted from rendering given data with given template");
		}
		
		// Our template uses member twice, so this runs twice as well.
		if (d === member) {
			ok(true, "Callback at member level");
			if (count++ === 0) {
				equals(flatten(this), flatten('[<strong><a href="1" style="font-family:Garamond,Verdana;">Art</a></strong>        Garamond,              Verdana,       ]'), "Callback's context is the DOM nodes that were rendered using the member data");
			} else {
				equals(flatten(this), flatten('1,'), "Callback's context is the DOM nodes that were rendered using the member data");
			}
			// TODO: Make sure font names after strong close still hold the
			// right data and template (and not d and t).
		}
		
		if (d === group) {
			ok(true, "Callback at group level");
			equals(flatten(this), flatten('<li>      A:            [<strong><a href="1" style="font-family:Garamond,Verdana;">Art</a></strong>        Garamond,              Verdana,       ]            [<strong><a href="2" style="font-family:Arial,Verdana;">&lt;b&gt;Amsterdam&lt;/b&gt;</a></strong>        Arial,              Verdana,       ]            (2)     </li>     <li>      those were ids            1,            2,      ...     </li>'), "Callback's context is the DOM nodes that were rendered using the group data");
		}
		
	});
	
});

test("$.flirt: render result", 2, function() {
	var template = $('#flirt').contents('[nodeType=8]')[1].data.substr('complex'.length + 1);
	
	equals(flatten($.flirt(template, data)), flatten('<li>      A:            [<strong><a href="1" style="font-family:Garamond,Verdana;">Art</a></strong>        Garamond,              Verdana,       ]            [<strong><a href="2" style="font-family:Arial,Verdana;">&lt;b&gt;Amsterdam&lt;/b&gt;</a></strong>        Arial,              Verdana,       ]            (2)     </li>     <li>      those were ids            1,            2,      ...     </li>    <li>      B:            [<strong><a href="3" style="font-family:Arial,Verdana;">Business</a></strong>        Arial,              Verdana,       ]            (1)     </li>     <li>      those were ids            3,      ...     </li>    <li>      <span class="safe">C</span>:            [<strong><a href="4" style="font-family:does-not-exist,\'Times New Roman\';">Co&lt;mpute&gt;rs</a></strong>        does-not-exist,              \'Times New Roman\',       ]            [<strong><a href="5" style="font-family:\'Courier New\',Courier;">Cool</a></strong>        \'Courier New\',              Courier,       ]            (2)     </li>     <li>      those were ids            4,            5,      ...     </li>'), "DOM tree that is generated by the renderer represent correct HTML");
	equals(flatten($.flirt(template, messy)), flatten('<li>      5:            [<strong><a href="" style="font-family:,arial,,true,0;">Ch&gt;r&gt;cters that should b&amp; &lt;scap&lt;d and Unicode: áœØ™‹¢ÅÛ—±≥÷√∂</a></strong>        ,              arial,              ,              true,              0,       ]            (1)     </li>     <li>      those were ids            ,      ...     </li>'), "Messy data is rendered correctly");
	
});

test("$.flirt: newlines", 1, function() {
	var newlines = "line1\nline3\n\n\nline6";
	
	equals($('<pre />').append($.flirt("<%= data %>", newlines)).text(), newlines, "Newlines are preserved correctly");
	
});

test("$.fn.flirt: add from containing element", 4, function() {
	var $flirt = $('#flirt');
	
	equals($flirt.flirt('add', "tim", function() {
		ok(true, "Callback is being called just like with $.flirt, even if no template name is specified");
	}), $flirt, "Returns object on which add is initiated");
	
	equals($flirt.find('li').length, 4, "One data item is rendered to one additional list item");
	
	$flirt.flirt('add', ["anton", "willem"]);
	equals($flirt.find('li').length, 6, "Additional items are added to the existing rendered parts");
	
});

test("$.fn.flirt: add from rendered element", 6, function() {
	var $flirt = $('#flirt').flirt('add', ["tim", "art"]),
		$item = $flirt.find('li').eq(1),
		$insideItem = $item.contents().eq(0);
	
	equals($item.flirt('add', "manja"), $item, "Returns object on which add is initiated");
	equals($flirt.find('li').length, 6, "Rendered item is added to the list");
	equals($flirt.find('li').eq(2).text(), "manja", "Rendered item is added after the item from which it was added");
	
	equals($insideItem.flirt('add', ["molendijk"]), $insideItem, "Returns object on which add is initiated even if it contains only text node(s)");
	equals($flirt.find('li').length, 7, "Rendered item is added to the list");
	equals($flirt.find('li').eq(2).text(), "molendijk", "Rendered item is added after the item from inside which it was added");
	
});

test("$.fn.flirt: add at a nested level", 3, function() {
	var $flirt = $('#flirt').flirt('add', data, 'complex'),
		$member = $flirt.find('strong:first');
	
	$member.flirt('add', data[1].members[0]);
	
	equals($flirt.find('li').length, 9, "First-level items have not been changed");
	equals($flirt.find('li').eq(2).find('strong').length, 3, "Second-level items have been changed");
	equals($flirt.find('li').eq(2).find('strong').eq(1).text(), "Business", "Item has been added at the correct position");
	
});

test("$.fn.flirt: get from containing element", 3, function() {
	var $flirt = $('#flirt');
	
	$flirt.
		flirt('set', ["tim", "art", "manja"]).
		flirt('set', data, 'complex');
	
	equals($flirt.flirt('get', 'complex').filter('li').length, 6, "Returns DOM nodes that were rendered from the specified template");
	equals($flirt.flirt('get').filter('li').length, 9, "If no template is specified, return all rendered items from any contained template");
	equals($flirt.flirt('get', 'doesnotexist').length, 0, "In case of no items rendered or specified template not found, and empty selection is returned");
	
});

test("$.fn.flirt: get from rendered element", 1, function() {
	var $flirt = $('#flirt').flirt('set', ["tim", "art"]);
	
	equals($flirt.find('li.simple:first').contents().flirt('get')[0], $flirt.find('li.simple:first')[0], "Returns closest (and smallest) rendered item that contains the (first) selected node");
	
});

test("$.fn.flirt: clear from containing element", 2, function() {
	var $flirt = $('#flirt').flirt('add', ["tim", "art", "manja"]);
	
	equals($flirt.flirt('clear'), $flirt, "Returns object on which clear is initiated");
	equals($flirt.find('li').length, 3, "All rendered items are cleared, but others are left untouched");
	
});

test("$.fn.flirt: clear from rendered element", 2, function() {
	var $flirt = $('#flirt').flirt('add', ["tim", "art", "manja"]),
		$item = $flirt.find('li').eq(1);
	
	equals($item.flirt('clear'), $item, "Returns object on which clear is initiated");
	ok($item.parent().length === 0, "Cleared item is no longer part of DOM tree");
	
});

test("$.fn.flirt: clear at a nested level", 3, function() {
	var $flirt = $('#flirt').flirt('add', data, 'complex'),
		$member = $flirt.find('strong:first');
	
	$member.flirt('clear');
	equals($flirt.find('li').length, 9, "First-level items have not been changed");
	equals($flirt.find('li').eq(2).find('strong').length, 1, "Second-level items have been changed");
	ok($flirt.find('strong')[0] !== $member[0], "Item has been removed from the DOM");
	
});

test("$.fn.flirt: clear flat DOM tree that resulted from nested template", 2, function() {
	var $flirt = $('#flirt');
	
	$flirt.flirt('set', {name: 'level1', level2: {name: 'level2', level3: {name: 'level3'}}}, 'nestedtemplateflatdomtree');
	equals($flirt.find('li').length, 6, "Nested template result in a (flat) set of list items");
	
	$flirt.flirt('clear', undefined, 'nestedtemplateflatdomtree');
	equals($flirt.find('li').length, 3, "All of which are cleared out upon request");
	
});

test("$.fn.flirt: set from containing element", 3, function() {
	var $flirt = $('#flirt');
	
	equals($flirt.flirt('set', ["tim", "art", "manja"]), $flirt, "Returns object on which set is initiated");
	equals($flirt.find('li').length, 6, "Three list items are rendered");
	
	$flirt.flirt('set', "molendijk");
	equals($flirt.find('li').length, 4, "All previously rendered items are replaced with a new one");
	
});

test("$.fn.flirt: set from rendered element", 3, function() {
	var $flirt = $('#flirt').flirt('set', ["tim", "art", "manja"]),
		$item = $flirt.find('li').eq(1);
	
	equals($item.flirt('set', ["anton", "willem"]), $item, "Returns object on which set is initiated");
	ok($item.parent().length === 0, "Set (overwritten) item is no longer part of DOM tree");
	equals($flirt.find('li').length, 7, "Two new items are in the place of the replaced one");
	
});

test("$.fn.flirt: identifying templates", 3, function() {
	var $flirt = $('#flirt-deep');
	
	$flirt.flirt('set', data);
	equals($flirt.find('ul > li').length, 7, "If no template name is specified the breadth-first template (comment node) is used");
	
	$flirt.flirt('set', ["tim", "art", "manja"], 'simple');
	equals($flirt.find('ul > li:first strong').length, 3, "If template name is specified the entire DOM tree is searched for the particular template");
	
	equals(flatten($('#flirt-name').flirt('set', ["tim", "art"]).text()), flatten("timart"), "Template name is never part of the template, regardless of whether it was explicitly selected or not");
	
});

test("$.fn.flirt: working with multiple templates in the same container", 5, function() {
	var $flirt = $('#flirt');
	
	$flirt.
		flirt('add', data, 'complex').
		flirt('add', ["tim", "art", "manja"]);
	ok(flatten($flirt).indexOf('simple') === -1, "Template name is never part of the template, regardless of whether it was explicitly selected or not");
	equals($flirt.find('li').length, 12, "Rendered items of both templates coexist in the same container after adding items to both");
	
	$flirt.flirt('clear');
	equals($flirt.find('li').length, 3, "Clearing without specifying a template name clears all items of all templates in the container");
	
	$flirt.
		flirt('add', ["tim", "art", "manja"], 'simple').
		flirt('add', data, 'complex').
		flirt('clear', 'complex');
	equals($flirt.find('li').length, 6, "Clearing a named template only removes items that resulted from that template");
	
	$flirt.
		flirt('set', data, 'complex').
		flirt('set', ["tim", "art", "manja"]);
	equals($flirt.find('li').length, 12, "Rendered items of both templates coexist in the same container after setting items to both");
	
});

test("$.fn.flirt: working on plural objects", 6, function() {
	
	$('#flirt, #flirt-deep').flirt('set', ["tim", "art", "manja"], 'simple');
	equals($('#flirt li').length, 6, "Set has been successful on first block");
	equals($('#flirt-deep ul > li:first strong').length, 3, "Set has been successful on second block");
	
	// The following are not recommend uses, as it mixes a call that accepts a
	// template name (the one from the container) with a call that does not
	// accept a template name (the one from the rendered element). Yet,
	// entirely blocking mixed calls would be an even less desirable approach
	// so we opt for making sure they behave logically and consistently.
	
	$('#flirt, #flirt-deep ul > li:first strong:first').flirt('add', "molendijk");
	equals($('#flirt li').length, 7, "Add has been successful on first block");
	equals($('#flirt-deep ul > li:first strong').length, 4, "Add has been successful on second block");
	
	$('#flirt, #flirt-deep ul > li:first strong:first').flirt('clear');
	equals($('#flirt li').length, 3, "Clear has been successful on first block");
	equals($('#flirt-deep ul > li:first strong').length, 3, "Clear has been successful on second block");
	
});

});
