/*
(root?)	<div>
		<!--
l1			<img src="yadda" />
l1			<span>
				<%= group %>
				<!-tags
l2					<strong><a href="" class="tag"><%= name %></a></strong>, 
				->
			</span>
			&bull;
		-->
		</div>


$('div').dataview('set', [
	{
		group: "Molendijk",
		tags: [
			{id: 1, name: 'ouwe'},
			{id: 2, name: 'jonge'}
		]
	},
	{
		group: "Galle",
		tags: [
			{id: 3, name: 'broabent'},
			{id: 4, name: 'ldope'}
		]
	}
]);

$('a.tag', $('ul')[0]).live('click', function(e) {
	e.preventDefault();
	var d = $(this).dataview('get');
	alert("Clicked tag with id " + d.id);
	d.name = 'clicked';
	$(this).dataview('invalidate');
});

comment element -> template functie -> aanroepen met data -> html -> invoegen in dom -> nieuwe dom elements
*/

(function($) {

var settings = {
		start: '<%',
		end: '%>',
		interpolate: /<%=(.+?)%>/g
	},
	compile = function(str) {
		return new Function('obj',
			'var self=this;' +
			'self.obj=obj;' +
			'self.p=[];' +
			'self.print=function(){self.p.push.apply(self.p,arguments);};' +
			'self.parse=function(id,data){' +
				'var r="";' +
				'for(var i=0,l=data.length;i<l;i++){r+=self.templates[id].call({templates:self.templates}, data[i]);}' +
				'return r;' +
			'};' +
			'with(self.obj){this.p.push(\'' +
			str.replace(/[\r\t\n]/g, " ").
				replace(new RegExp("'(?=[^" + settings.end[0] + "]*" + settings.end + ")","g"),"\t").
				split("'").join("\\'").
				split("\t").join("'").
				replace(settings.interpolate, "',$1,'").
				split(settings.start).join("');").
				split(settings.end).join("this.p.push('") +
			"');}return self.p.join('');"
		);
	};

$.fn.dataview_outdated = function(action, data) {
	var template = '<!-' + this[0].data + '->',
		compiled = [],
		t = 0;
	
	while (template.indexOf('<!-') !== -1) {
		template = template.replace(/<!-(\w*)\s((?:[\S\s](?!<!-))+?)->/, function(match, field, nested) {
			compiled[t] = compile(nested);
			console.log(compiled[t]);
			var value = "<%= this.parse(" + t + ", " + (field || 'this.obj') + ") %>";
			t++;
			return value;
		});
	}
	template = compile(template)
	return template.call({templates: compiled}, data);
};

var getClosestViewOf = function(element) {
	// TODO: we could ditch reverse and use filter(':data(dataview.data):last')
	return $(element).parentsUntil('html').andSelf().reverse().filter(':data(dataview.data):first');
};

$.fn.dataview = function(action, template, data) {
	
	switch (action) {
	
		case 'set':
			
			// create recordset
			this.
				flirt('clear').
				flirt(data, template, function(data) {
					// transform data to record via recordset (keep an eye on memory!)
					$(this).store('dataview', 'data', data);
				});
			break;
			
		case 'get':
			
			return getClosestViewOf(this[0]).fetch('dataview', 'data');
			break;
			
		case 'invalidate':
			
			this.each(function() {
				var $view = getClosestViewOf(this);
				$view.flirt($view.fetch('dataview', 'data'), function(data) {
					$(this).store('dataview', 'data', data);
				});
			});
			break;
		
	}
	return this;
	
};


}(jQuery));



