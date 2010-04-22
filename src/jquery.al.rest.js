(function($) {

$.Rest = function(url, dataType) {
	if (!(this instanceof $.Rest)) {
		return new $.Rest(url, dataType);
	}
	
	this.request = function(verb, handler, data, success) {
		setTimeout(function() {
			$.ajax({
				type: verb,
				url: url + handler,
				dataType: dataType,
				data: data,
				success: success
			});
		}, 0);
	};
};

$.Rest.prototype = {
	
	// TODO: if cb is not provided, return curried function
	// I think this is only useful if it accepts a 'lazy data object', with
	// functions in the fields, that are only evaluated when the actual request
	// is done.
	get: function(handler, data, success) {
		this.request('GET', handler, data, success);
	},
	post: function(handler, data, success) {
		this.request('POST', handler + '?callback=?', data, success);
	}
	
};

}(jQuery));
