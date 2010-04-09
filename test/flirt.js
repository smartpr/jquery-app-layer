jQuery(function($) {

var $flirt,
	templateNode,
	template,
	flatten = function(str, strip) {
		if (typeof str !== 'string') {
			str = str.appendTo('<div />').parent().html();
		}
		str = str.replace(/\s/g, '').toLowerCase();
		if (strip !== undefined) {
			str = str.replace(strip, '');
		}
		return str;
	},
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
testdata = data;
module('flirt', {
	setup: function() {
		$flirt = $('#flirt');
		templateNode = $flirt.contents('[nodeType=8]')[1];
		template = templateNode.data.substr('namedtemplate'.length + 1);
	}
});

test('$.flirt as a settings accessor', 4, function() {
	
	equals($.flirt().nestStart, '<!-', "Without arguments returns settings objects");
	equals($.flirt({nestStart: 'changed'}).nestStart, 'changed', "Changing settings returns changed settings object");
	equals($.flirt().nestStart, 'changed', "Changes are persistent");
	equals($.flirt().nestEnd, '->', "Other settings remain untouched");
	$.flirt({nestStart: '<!-'});
	
});

test('$.flirt as a template parser', 4, function() {
	
	var count = 0;
	
	$parsed = $('<div />').append($.flirt(template, data, function(d) {
		if (d === member && count++ === 0) {
			ok(true, "Callback at member level");
			// TODO: invalidation
//			$parsed = $('<div />').append(flirt.parse(d));
//			equals($('<div />').append(this).html(), $parsed.html(), "Callback at member level: parsed data and template represents same node tree as supplied elements");
//			equals(flatten($parsed.text()), '[artarial,verdana,]', "Callback at member level: parsed data and template matches textwise");
//			equals($parsed.find('strong').length, 1, "Callback at member level: parsed data and template contains 'strong' element");
//			equals(flatten($parsed.find('a[href=1]').attr('style'), ';'), flatten("font-family:Arial,Verdana"), "Callback at member level: parsed data and template contains correct 'a' element");
		}
		if (d === group && count++ === 2) {
			ok(true, "Callback at group level");
			// TODO: invalidation
//			$parsed = $('<div />').append(flirt.parse(d));
//			equals($('<div />').append(this).html(), $parsed.html(), "Callback at group level: parsed data and template represents same node tree as supplied elements");
//			equals(flatten($parsed.text()), 'a:[artarial,verdana,][amsterdamarial,verdana,](2)thosewereids1,2,...', "Callback at group level: parsed data and template matches textwise");
//			equals($parsed.children('li').length, 2, "Callback at group level: parsed data and template contains correct amount of 'li' elements");
//			equals($parsed.find('strong').length, 2, "Callback at group level: parsed data and template contains correct amount of 'strong' elements");
		}
	}));
	equals(flatten($parsed.text()), 'a:[artarial,verdana,][amsterdamarial,verdana,](2)thosewereids1,2,...b:[businessarial,verdana,](1)thosewereids3,...c:[computersdoes-not-exist,\'timesnewroman\',][cool\'couriernew\',courier,](2)thosewereids4,5,...', "Compile and parse template: parsed data and template matches textwise");
	equals($parsed.children('li').length, 6, "Compile and parse template: correct amount of 'li' elements");
	
});

test('$.fn.flirt', 5, function() {
	
	$flirt.flirt(data);
	equals($(templateNode).prevAll('li').length, 4, "First comment node is parsed and set into the DOM");
	
	$flirt.flirt(data, 'namedtemplate');
	equals($(templateNode).prevAll('li').length, 10, "Comment node with the given name is parsed and set into the DOM, after the previously set nodes");
	
	$flirt.flirt('clear', 'namedtemplate');
	equals($(templateNode).prevAll('li').length, 4, "All nodes that sprouted from the template with the given name are cleared from the DOM");
	
	$flirt.flirt('clear');
	equals($(templateNode).prevAll('li').length, 1, "All nodes that sprouted from the remaining uncleared template are cleared from the DOM");
	
	$flirt.flirt(data, 'namedtemplate');
	$flirt.flirt('clear');
	equals($(templateNode).prevAll('li').length, 1, "All nodes that sprouted from any template within the context are cleared from the DOM, including the nodes from named templates that were not explicitly named in the clear call");
	
});

});
