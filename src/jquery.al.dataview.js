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

$.event.special.invalidate = {
	
	add: function(obj) {
		console.log(this);
		console.log(obj);
	}
	
};

var Record = function(data) {
	if (!(this instanceof Record)) {
		return new Record(data);
	}
	
	this.get = function() {
		return data;
	};
};

// TODO: Add 'clear' action
$.fn.dataview = function(action, templateName, data) {
	// TODO: What if the data we want to store is a string? This code won't cut it.
	if (data === undefined && typeof templateName !== 'string') {
		data = templateName;
		templateName = undefined;
	}
	
	switch (action) {
		
		case 'set':
			this.each(function() {
				var $this = $(this);
				if ($.isFunction(data)) {
					data.call(this, function(data) {
						$this.dataview(action, templateName, data);
					});
					return true;
				}
				// var rs = new $.RecordSet();
				$this.
					flirt('clear').
					flirt(data, templateName, function(data) {
						// transform data to record via recordset (keep an eye on memory!)
						this.store('dataview', 'data', new Record(data));	// rs.get(data)
					});
			});
			break;
		
		case 'get':
			// TODO: This implementation is inefficient and ugly; use $.fn.closest(':data(dataview.data)')
			var record = this.eq(0).parentsUntil('html').andSelf().filter(function() {
				return !!$(this).fetch('dataview', 'data');
			}).eq(-1).fetch('dataview', 'data');	// .get()
			// TODO: If no data found upwards, look downwards in order to support
			// $('#mydiv').dataview('set', {...1 item...}) and then $('#mydiv').dataview('get')
			return record instanceof Record ? record.get() : undefined;
			break;
		
		// TODO: invalidation	
//		case 'invalidate':
//			
//			this.each(function() {
//				var $view = getClosestViewOf(this);
// 				TODO: if there is no closest view upwards, resort to reflirting
//				all closest downward views (... perhaps this should be the meaning
//				of getClosestViewOf anyway? ... but then wouldn't 'get' have to
//				behave in a similar fashion?)
//				$view.flirt($view.fetch('dataview', 'data'), function(data) {
//					$(this).store('dataview', 'data', data);
//				});
//			});
//			break;
		
	}
	return this;
	
};

}(jQuery));



