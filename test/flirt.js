jQuery(function($) {

var $flirt,
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
	};

module('flirt', {
	setup: function() {
		$flirt = $('#flirt');
		template = $flirt.contents('[nodeType=8]')[0].data;
	}
});

test('$.flirt as a settings accessor', 4, function() {
	
	equals($.flirt().nestStart, '<!-', "Without arguments returns settings objects");
	equals($.flirt({nestStart: 'changed'}).nestStart, 'changed', "Changing settings returns changed settings object");
	equals($.flirt().nestStart, 'changed', "Changes are persistent");
	equals($.flirt().nestEnd, '->', "Other settings remain untouched");
	$.flirt({nestStart: '<!-'});
	
});

test('$.flirt as a template parser', 10, function() {
	
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
		],
		count = 0;
	
	$parsed = $('<div />').append($.flirt(template, data, function(d, flirt) {
		if (d === member && count++ === 0) {
			$parsed = $('<div />').append(flirt.parse(d));
			equals($('<div />').append(this).html(), $parsed.html(), "Callback at member level: parsed data and template represents same node tree as supplied elements");
			equals(flatten($parsed.text()), '[artarial,verdana,]', "Callback at member level: parsed data and template matches textwise");
			equals($parsed.find('strong').length, 1, "Callback at member level: parsed data and template contains 'strong' element");
			equals(flatten($parsed.find('a[href=1]').attr('style'), ';'), flatten("font-family:Arial,Verdana"), "Callback at member level: parsed data and template contains correct 'a' element");
		}
		if (d === group && count++ === 2) {
			$parsed = $('<div />').append(flirt.parse(d));
			equals($('<div />').append(this).html(), $parsed.html(), "Callback at group level: parsed data and template represents same node tree as supplied elements");
			equals(flatten($parsed.text()), 'a:[artarial,verdana,][amsterdamarial,verdana,](2)thosewereids1,2,...', "Callback at group level: parsed data and template matches textwise");
			equals($parsed.children('li').length, 2, "Callback at group level: parsed data and template contains correct amount of 'li' elements");
			equals($parsed.find('strong').length, 2, "Callback at group level: parsed data and template contains correct amount of 'strong' elements");
		}
	}));
	equals(flatten($parsed.text()), 'a:[artarial,verdana,][amsterdamarial,verdana,](2)thosewereids1,2,...b:[businessarial,verdana,](1)thosewereids3,...c:[computersdoes-not-exist,\'timesnewroman\',][cool\'couriernew\',courier,](2)thosewereids4,5,...', "Compile and parse template: parsed data and template matches textwise");
	equals($parsed.children('li').length, 6, "Compile and parse template: correct amount of 'li' elements");
	
});

});
