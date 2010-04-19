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
	
	get: function(handler, data, success) {
		this.request('GET', handler, data, success);
	},
	post: function(handler, data, success) {
		this.request('POST', handler + '?callback=?', data, success);
	}
	
};

}(jQuery));