/*
WISHLIST
- Include metadata in fetch.
- move to ui widget utility like such:
	$(elem).tree('get', ns, 'field') , $(elem).tree('set', ns, 'field', 'value')
	!! PERFORMANCE ???
- Make it work on text nodes in IE.
*/
(function($) {

var update = function(data, path, value) {
	// Allow calling this function with an empty path.
	if (path.length === 0) {
		return value;
	}
	var field = path[0];
	if (!$.isPlainObject(data)) {
		data = {};
	}
	// If value does not correspond to a field of data, we should recursively
	// get to a value that does.
	if (path.length > 1) {
		value = update(data[field], path.slice(1), value);
	}
	// $.fn.fetch() does not distinguish undefined and non-existent, while
	// $.fn.store() does not care whether a field is an empty object or
	// non-existent. So we clear out all abundant data structures.
	if (value === undefined) {
		delete data[field];
		if ($.isEmptyObject(data)) {
			data = undefined
		}
	} else {
		data[field] = value;
	}
	return data;
};

$.fn.fetch = function() {
	if (this.length === 0) {
		return undefined;
	}
	
	var $this = this,
		path = arguments,
		data = $this.data();
	
	if ($.isEmptyObject(data)) {
		data = undefined;
	}
	for (var i = 0, l = path.length; data !== undefined && i < l; i++) {
		data = data[path[i]];
	}
	return data;
};

$.fn.store = function() {
	var $this = this,
		path = Array.prototype.slice.call(arguments, 0, -1),
		value = arguments[path.length];
	
	// if (path.length === 0) {
	// 	return $.isPlainObject(value) ? $this.data(value) : $this;
	// }
	return $this.each(function() {
		var $this = $(this),
			data = update($this.data(), path, value);
		if (data === undefined) {
			$this.removeData();
		} else {
			$this.data(data);
		}
	});
};

$.fn.del = function() {
	return $.fn.store.apply(this, $.merge(arguments, [undefined]));
};

// TODO: Design and implement semantics of ":data(family.name)" (without '='). Options:
// - validates if data field exists (could be useful to quickly select elements that have a certain data setting)
// - validates if data field evaluates to true (this is consistent with: fetch('family', 'name') ? true : false)
$.expr[':'].data = function(elem, index, meta, stack) {
	var param = meta[3].split('='),
		$elem = $(elem),
		value = $.fn.fetch.apply($elem, $.trim(param[0]).split('.'));
	
	if (value === undefined) {
		value = 'undefined';
	} else if (value === null) {
		value = 'null';
	} else if (typeof value === 'boolean') {
		value = value ? 'true' : 'false';
	} else {
		value = value.toString();
	}
	return value === param[1];
};

}(jQuery));
