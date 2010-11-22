(function($) {

$.fn.dataview = function(action, opts) {
	var $this = this;
	
	switch (action) {
		// Expects data that consists of at most two levels:
		// 1. Array of data items for which a view should be maintained. This
		//    level is optional in that it will be created if the top level
		//    does not have a value of type `Array`.
		// 2. An individual data item that makes up one item in the view.
		case 'set':
			// Always use `.valueOf()` to access the value of an object so to
			// make dataview capable of working with custom types (such as
			// `$.al.Object`).
			var array = $.isArray(opts.data.valueOf()) ? opts.data : [opts.data],
				$template = $($this.flirt('template', opts.template));
			
			if ($template.fetch('dataview', 'array') !== array) {
				$template.store('dataview', 'array', array);
				// TODO: We don't need this condition, as we can bind to any
				// type of object (including arrays) using `$([array])`.
				if (!$.isArray(array)) {
					$(opts.condition !== undefined ? new $.al.Conditional(array, opts.condition) : array).bind('valuechange', function() {
						$this.dataview('set', {
							data: array,
							template: opts.template,
							condition: opts.condition
						});
					});
				}
			}
			
			var invalidate = [];
			$this.flirt('set', array.valueOf(), opts.template, function(item) {
				this.store('dataview', 'data', item);
				if (!$.isArray(item)) {
					var $nodes = this;
					$(opts.condition !== undefined ? new $.al.Conditional(item, opts.condition) : item).bind('valuechange', function() {
						// TODO: Make flirt smart enough to make `.eq(0)` not
						// necessary here.
						// TODO: Use `.dataview('invalidate')`.
						var invalidate = [];
						$nodes.eq(0).flirt('set', [item], function() {
							this.store('dataview', 'data', item);
							$nodes = this;
							invalidate.push.apply(invalidate, $nodes.get());
						}, true);
						$(invalidate).trigger('invalidate');
					});
				}
				invalidate.push.apply(invalidate, this.get());
			}, true);
			$(invalidate).trigger('invalidate');
			
			break;
			
		case 'invalidate':
			// TODO: 'set' with stored data.
			
			break;
	}
	
	return this;
};

}(jQuery));
