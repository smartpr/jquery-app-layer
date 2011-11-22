(function($, undefined) {

// Default engine implementation based on jquery-tmpl.
$.flirt = function(template, data, cb) {
	template = $.template(null, template);
	if (arguments.length === 1) return template;
	
	// We cannot consider `null` a regular value because `$.tmpl` will treat it
	// not as such (see http://api.jquery.com/jquery.tmpl/).
	if (data === undefined || data === null) return $();
	if (!$.isArray(data)) data = [data];
	
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