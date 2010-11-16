(function($) {

var $findTemplates = function(filter, max) {
	var nodes = [];

	if (this.length > 0) {

		$.merge(nodes, this.filter(function() {
			return this.nodeType === 8 && filter.apply(this, arguments) === true;
		}).get());

		if (max === undefined || nodes.length < max) {
			var remainder = max === undefined ?
				undefined :
				max - nodes.length;
			$.merge(nodes, this.contents().chain($findTemplates, filter, remainder).get());
		}

	}
	
	return $(max === undefined ? nodes : nodes.slice(0, max));
};

var templateNode = function(context, name) {
	var templateFilter = new RegExp('^' + (name ? name + '\\s' : '')),
		$template = $(context).chain($findTemplates, function() {
			var flirt = $(this).data('flirt');
			return flirt && flirt.name === name || templateFilter.test(this.data);
		}, 1);
	
	if ($template.length === 0) {
		return;
	}
	
	if (!$template.data('flirt') || !$template.data('flirt').compiled) {
		var body = $template[0].data,
			nameMatch = /^\S+\s/.exec(body);
		if (nameMatch !== null) {
			body = body.substr(nameMatch[0].length);
		}
		$template.data('flirt', {
			name: name,
			compiled: $.flirt(body)
		});
	}

	return $template[0];
};

$.fn.flirt = function(action, opts, cb) {
	opts = opts || {};
	
	switch (action) {
		case 'template':
			return templateNode(this[0], opts.template);
			break;
		case 'add':
			var $template = $(this.flirt('template', opts));
			$template.before($.flirt($template.data('flirt').compiled, opts.data, cb));
			break;
	}
	
	return this;
};

// If an engine implementation is already defined by another source, we are
// done here.
if ($.flirt) {
	return;
}

// Default engine implementation based on jquery-tmpl.
$.flirt = function(template, data, cb) {
	template = $.template(null, template);
	if (arguments.length === 1) {
		return template;
	}
	var nodes = [], $item;
	for (var i = 0, l = data.length; i < l; i++) {
		$item = $.tmpl(template, data[i]);
		if ($.isFunction(cb)) {
			cb.call($item, data[i]);
		}
		nodes.push.apply(nodes, $item.get());
	}
	return $(nodes);
};

}(jQuery));