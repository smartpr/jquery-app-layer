(function($, undefined) {

$.fn.dataview = function(action, opts) {
	if (typeof action !== 'string') {
		opts = action;
		action = 'set';
	}
	
	switch (action) {
		
		// TODO: This action needs some tightening up.
		case 'template':
			// Prevent infinite loop in case of no template to be found.
			if (this.length === 0) return;
			
			if (!$.isPlainObject(opts)) opts = { template: opts };
			
			// Code path 1 - Context is part of view: return template node
			// that was used to create the view.
			var $rendered = this.eq(0);
			if ($rendered.fetch('dataview', 'item') === undefined) {
				$rendered = $rendered.closest(':data(dataview.item)');
			}
			if ($rendered.length > 0) {
				var node = $rendered[0];
				while (node.nodeType !== 8) {
					node = node.nextSibling;
				}
				// `node` is template node, which is guaranteed to be setup
				// already, as a view has been created on it before.
				return node;
			}
			
			var template;
			
			// Code path 2 - Context is a template: return first.
			// TODO: If `opts.template` is provided, only return template that
			// has the right name?
			this.each(function() {
				if (this.nodeType === 8) {
					template = this;
					return false;
				}
			});
			
			// Code path 3 - Context is not part of view: return template node
			// based on `opts.template`.
			if (!template) {
				var name = new RegExp('^' + (opts.template ? opts.template + '\\s' : ''));
				// Our template search space is all direct children of the
				// elements in `this`.
				this.contents().each(function() {
					if (this.nodeType === 8 && name.test(this.data)) {
						template = this;
						return false;
					}
				});
			}
			
			// Recur to look for a template one nested level deeper.
			if (!template) {
				return this.children().dataview('template', opts);
			}
			
			// Setup template node (if not already done).
			if (template) {
				var $template = $(template);
				// TODO: Check for existence instead of fetch.
				if ($template.fetch('dataview') === undefined) {
					$template.store('dataview', {
						compiled: $.flirt(/^\S*\s([\s\S]*)$/.exec(template.data)[1]),
						onSetChange: function() {
							$template.dataview('set');
						},
						onItemChange: function() {
							var $nodes = this,
								item = $nodes.fetch('dataview', 'item');
							$nodes.
								eq(0).before($.flirt($template.fetch('dataview', 'compiled'), [item], function(item) {
									this.store('dataview', 'item', item);
									$nodes = this;
								})).end().
								remove();
							// `$nodes` is now the newly rendered item, which
							// is different from its value in the previous
							// line of code.
							$nodes.trigger('invalidate');
						}
					});
				}
			}
			
			return template;
			
			break;
		
		case 'rendered':
			if (!$.isPlainObject(opts)) opts = { template: opts };
			
			// Use value from `template` to return all DOM nodes that comprise
			// the current view on this template.
			var template = this.eq(0).dataview('template', opts.template),
				node = template.previousSibling,
				rendered = [];
			// TODO: Check for existence instead of fetch.
			while ($(node).fetch('dataview', 'item') !== undefined) {
				rendered.unshift(node);
				node = node.previousSibling;
			}
			return $(rendered);
			
			break;
		
		case 'get':
			if (!$.isPlainObject(opts)) opts = { template: opts };
			
			// If context is part of rendered view, return the closest
			// (smallest) data piece (item) whose representation it is part
			// of.
			// TODO: What to do in case of multiple elements in `this`?
			var $rendered = this.eq(0);
			if ($rendered.fetch('dataview', 'item') === undefined) {
				$rendered = $rendered.closest(':data(dataview.item)');
			}
			if ($rendered.length > 0) {
				return $rendered.fetch('dataview', 'item');
			}
			
			// If context not part of rendered view, return the data set that
			// makes up the current view on `opts.template`.
			return $(this.eq(0).dataview('template', opts.template)).fetch('dataview', 'set');
			
			break;
		
		case 'set':
			// TODO: Can we make this method for judging if data is supplied
			// directly or not more robust?
			if (!$.isPlainObject(opts) || !opts.data) opts = { data: opts };
			
			// Make sure `opts.data` always is a set (as opposed to an
			// item).
			if (opts.data && !$.isArray(opts.data.valueOf())) opts.data = [opts.data];
		
			// TODO: It would be better to have `$.al.Conditional` deal with
			// `opts.conditional` being `undefined`.
			if (!('condition' in opts)) {
				opts.condition = new Boolean(true);
			}
			
			// Use value from `template` to create view of data. Different
			// types of context are dealt with by `template`. If no
			// `opts.data` has been provided, use data that is currently
			// stored on template node.
			return this.each(function() {
				var $this = $(this),
					$template = $($this.dataview('template', opts.template)),
					data = opts.data || $template.fetch('dataview', 'set');
				
				$this.dataview('clear', opts.template);
				
				$template.store('dataview', 'set', data);
				
				$([$.al.Conditional(data, opts.condition)]).bind('valuechange', $template.fetch('dataview', 'onSetChange'));
				
				var invalidate = [];
				$template.before($.flirt($template.fetch('dataview', 'compiled'), data.valueOf(), function(item) {
					var $nodes = this;
					$nodes.store('dataview', 'item', item);
					$([$.al.Conditional(item, opts.conditional)]).bind('valuechange', $.proxy($template.fetch('dataview', 'onItemChange'), $nodes));
					invalidate.push.apply(invalidate, $nodes.get());
				}));
				$(invalidate).trigger('invalidate');
			});
			
			break;
		
		case 'clear':
			if (!$.isPlainObject(opts)) opts = { template: opts };
			
			// Remove current view on template node that is returned by
			// `template`: remove data from template node and remove
			// corresponding DOM nodes.
			return this.each(function() {
				var $this = $(this),
					$template = $($this.dataview('template', opts.template));
				
				// TODO: Check for existence instead of fetch.
				if ($template.fetch('dataview', 'set') !== undefined) {
					$([$template.fetch('dataview', 'set')]).unbind('valuechange', $template.fetch('dataview', 'onSetChange'));
					$template.del('dataview', 'set');
					$this.dataview('rendered', opts.template).each(function() {
						$([$(this).fetch('dataview', 'item')]).unbind('valuechange', $template.fetch('dataview', 'onItemChange'));
					}).remove();
				}
				
			});
			
			break;
		
		case 'invalidate':
			// Same as `set` without data.
			break;
		
	}
	
	return this;
	
};

}(this.jQuery));
