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

// TODO: Make al.data not change object identities, so we don't need this
// work-around here!
	var Record = function(data) {
		if (!(this instanceof Record)) {
			return new Record(data);
		}

		this.gettt = function() {
			return data;
		};
	};

$.fn.dataview = function(action, data, templateName) {
	var self = this;
	
	switch (action) {
		
		case 'set':
			if (arguments.length === 1) {
				this.flirt('set', this.flirt('closest').fetch('dataview', 'data').gettt(), undefined, function(data) {
					var $nodes = this;
					if (data instanceof $.al.Field) {
						data.observe(function(v) {
							console.log('observed change => invalidate:');
							console.log($nodes);
							$nodes.eq(0).dataview('invalidate');
							return false;
						});
					}
					$nodes.store('dataview', 'data', new Record(data));
				});
				return this;
			}
			
			if (data instanceof $.al.Field) {
				data.observe(function(v) {
					self.flirt('set', v, templateName, function(d) {
						var $nodes = this;
						if (d instanceof $.al.Field) {
							var boundField = $.al.Field().val(d.val());
							boundField.bind(function(val) {
								var f, listnotifies;
								var notifiesField = data.notifiesField();
								if (notifiesField) {
									notifiesField.observe(function(v) {
										listnotifies = v;
										if (listnotifies && f !== undefined) {
											val(f);
											f = undefined;
										}
									});
								}
								listnotifies = data.notifies();
								d.observe(function(v) {
									f = v;
									if (listnotifies && f !== undefined) {
										val(f);
										f = undefined;
									}
								});
							});
							boundField.observe(function() {
								console.log('observed change => invalidate:');
								console.log($nodes);
								$nodes.eq(0).dataview('invalidate');
								return false;
							});
						}
						$nodes.store('dataview', 'data', new Record(d));
					});
				});
				if (data instanceof $.al.List) {
					data.fetch();
				}
			} else {
				return this.flirt('set', data, templateName, function(data) {
					var $nodes = this;
					if (data instanceof $.al.Field) {
						data.observe(function(v) {
							console.log('observed change => invalidate:');
							console.log($nodes);
							$nodes.eq(0).dataview('invalidate');
							return false;
						});
					}
					$nodes.store('dataview', 'data', new Record(data));
				});
			}
			break;
		
		case 'get':
			// TODO: get all containing data in case no closest can be found.
			var d = this.flirt('closest').fetch('dataview', 'data');
			return d instanceof Record ? d.gettt() : d;
			break;
		
		case 'invalidate':
			// Provided that this is a node that was rendered from a template,
			// invalidation means setting it without data, which will result
			// in reflirting its closest template part with the data that was
			// used to render it.
			return this.dataview('set');
			break;
		
	}
	return this;
	
};


/*
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
						if ($.isPlainObject(data)) {
							data = new Record(data);
						}
						var $nodes = this;
						if (data instanceof $.al.Field) {
							data.observe(function(v) {
								$nodes.flirt(v, function(d) {
									this.store('dataview', 'data', d);
								}).trigger('invalidate');
								console.log('triggered invalidate on:');
								console.log($nodes);
								// $elem.dataview('invalidate');
							});
						}
						$nodes.store('dataview', 'data', data);	// rs.get(data)
					});
			});
			break;
		
		case 'get':
			// TODO: What if this is multiple elements??
			
			var $view = this.eq(0).closest(':data(dataview.data)');
			if ($view.length === 0) {
				// TODO: iterate one level deeper every time we don't find dataview(s)
				$view = this.eq(0).children(':data(dataview.data)');
			}
			var items = [];
			$.map($view.get(), function(elem) {
				var record = $(elem).fetch('dataview', 'data');
				var item = record instanceof Record ? record.get() : record;
				if ($.inArray(item, items) === -1) {
					items.push(item);
				}
			});
			// TODO: Do we really want to be inconsistent in the data structure
			// that we return?
			return items.length === 1 ? items[0] : items;
			break;
		
			// // TODO: This implementation is inefficient and ugly; use $.fn.closest(':data(dataview.data)')
			// var record = this.eq(0).parentsUntil('html').andSelf().filter(function() {
			// 	return !!$(this).fetch('dataview', 'data');
			// }).eq(-1).fetch('dataview', 'data');	// .get()
			// // TODO: If no data found upwards, look downwards in order to support
			// // $('#mydiv').dataview('set', {...1 item...}) and then $('#mydiv').dataview('get')
			// return record instanceof $.al.Field ? record.val() : undefined;
			// break;
		
		case 'invalidate':
			console.log('invalidate:');
			invalideet = this;
			this.each(function() {
				var $view = $(this).closest(':data(dataview.data)');
				if ($view.length === 0) {
					// TODO: iterate one level deeper every time we don't find dataview(s)
					$view = $(this).children(':data(dataview.data)');
				}
				console.log('   each:');
				console.log($view);
				$view.flirt($(this).dataview('get'), function(data) {
					$(this).store('dataview', 'data', data);
				});
			});
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
*/
}(jQuery));



