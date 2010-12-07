(function($, undefined) {

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

}(this.jQuery));