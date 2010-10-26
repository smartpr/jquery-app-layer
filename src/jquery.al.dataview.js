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

// TODO: 'setCallback' is unfortunate naming for a function that is not a
// setter.
var setCallback = function(data) {
	var $nodes = this;
	if (data instanceof $.al.Field) {
		data.observe(function() {
			// TODO: Simply call invalidate on $nodes (instead
			// of $nodes.eq(0)) as soon as invalidate is smart
			// enough to recognize that the corresponding
			// template part only needs to be invalidated
			// once.
			$nodes.eq(0).dataview('invalidate');
			return false;
		});
	}
	$nodes.store('dataview', 'data', new Record(data));
};

// TODO: We cannot delegate this to flirt for now, due to a discrepancy
// between flirt and dataview that yet needs to be resolved. See TODO at
// Flirt.parse in jquery.al.flirt.js.
var closest = function() {
	var $closest = this.eq(0);
	if ($closest.fetch('dataview', 'data') === undefined) {
		$closest = $closest.closest(':data(dataview.data)');
	}
	if ($closest.length > 0) {
		var identity = $closest.fetch('dataview', 'data');
		$closest = $closest.parent().contents().filter(function() {
			return $(this).fetch('dataview', 'data') === identity;
		});
	}
	return $closest;
}

$.fn.dataview = function(action) {
	
	switch (action) {
		
		case 'set':
			var data = arguments[1],
				templateName = arguments[2];
			
			return this.each(function() {
				var $this = $(this);
				
				// Do not support set on a part of the view because that would
				// lead to the data in the view running out of sync with the
				// data in the list on the template node.
				if (closest.call($this).length > 0) {
					return true;
				}
				
				var $template = $this.flirt('templateNode', templateName);
				
				var savedList = $template.fetch('dataview', 'data');
				if (data instanceof $.al.List && (!savedList || savedList.gettt() !== data)) {
					data.observe(function() {
						// TODO: Note that templateName can be undefined, in
						// which case all views contained by $this will be
						// invalidated if we implement the idea that is
						// described in the first TODO under case
						// 'invalidate'.
						$this.dataview('invalidate', templateName);
					});
				}
				
				$template.store('dataview', 'data', new Record(data));
				
				var trigger = [];
				$this.flirt('set', data instanceof $.al.List ? data.val() : data, templateName, function(d) {
					var $nodes = this;
					if (d instanceof $.al.Field) {
						// console.log('flirt set rendered:');
						// console.log($nodes);
						d.observe(function() {
							// console.log("observed change in field:");
							// console.log(d.val());
							// console.log("dataview invalidate:");
							// console.log($nodes);
							$nodes.eq(0).dataview('invalidate');
							return false;
						}, data instanceof $.al.List ? data.notifiesField() : undefined);
					}
					$nodes.store('dataview', 'data', new Record(d));
					trigger = trigger.concat($nodes.get());
				}, true);
				$(trigger).trigger('dataviewinvalidate');
				
			});
		
		case 'get':
			var $this = this.eq(0),
				$closest = closest.call($this);
			
			if ($closest.length > 0) {
				return $closest.fetch('dataview', 'data').gettt();
			}
			
			var templateName = arguments[1],
				data = $this.flirt('templateNode', templateName).fetch('dataview', 'data');
			
			return data ? data.gettt() : undefined;	// TODO: Formalize return type in test suite.
		
		case 'invalidate':
			var templateName = arguments[1];
			
			// TODO: Allow invalidate to be called on multiple rendered nodes
			// from the same template part without that part being invalidated
			// more than once.
			return this.each(function() {
				var $this = $(this),
					$closest = closest.call($this);
				
				if ($closest.length > 0) {
					// Do not use dataview's set here because it does not
					// support (re)setting part of the view.
					var data = $closest.flirt('templateNode').fetch('dataview', 'data').gettt(),
						trigger = [];
					$closest.eq(0).flirt('set', $closest.dataview('get'), function(d) {
						var $nodes = this;
						if (d instanceof $.al.Field) {
							d.observe(function() {
								// console.log("observed change in field:");
								// console.log(d.val());
								// console.log("invalidate:");
								// console.log($nodes);
								$nodes.eq(0).dataview('invalidate');
								return false;
							}, data instanceof $.al.List ? data.notifiesField() : undefined);
						}
						$nodes.store('dataview', 'data', new Record(d));
						trigger = trigger.concat($nodes.get());
					}, true);
					$(trigger).trigger('dataviewinvalidate');
					return true;
				}
				
				// TODO: In case of no templateName provided, I think what we
				// would want there to happen is that the views of all
				// contained templates would invalidate. The problem is that
				// in order to implement this we would need a means of getting
				// all template nodes and looping them. This functionality is
				// part of flirt and as of now not yet exposed via a public
				// method. The current 'templateNode' method returns the one
				// template node based on a supplied name, and the first in
				// case of no name provided.
				$this.dataview('set', $this.dataview('get', templateName), templateName);
			});
			
	}
	
};

$.fn.dataview_old = function(action, data, templateName) {
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



