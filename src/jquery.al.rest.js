(function($) {

// TODO: send data in traditional way (id=1&id=2)

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
				// traditional: true,
				success: function(data, textStatus, xhr) {
					// console.log('$.ajax success:');
					// console.log(data);
					// console.log(textStatus);
					success.apply(this, arguments);
				},
				error: function(xhr, textStatus, error) {
					// console.log('$.ajax error:');
					// console.log(textStatus);
					// console.log(error);
				},
				complete: function(xhr, textStatus) {
					// console.log('$.ajax complete:');
					// console.log(textStatus);
				}
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