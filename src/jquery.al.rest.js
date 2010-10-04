(function($) {

// TODO: send data in traditional way (id=1&id=2)
// TODO: Handle the scenario of retrieving another datatype than requested in
// a transparent and consistent manner (now, IE8 throws a syntax error in case
// of jsonp requested and html retrieved -- not sure about behavior in other
// scenarios).

$.Rest = function(url, dataType, error) {
	if (!(this instanceof $.Rest)) {
		return new $.Rest(url, dataType, error);
	}
	
	if (!$.isFunction(error)) {
		error = $.noop;
	}
	
	this.request = function(verb, handler, data, success) {
		setTimeout(function() {
			var contentType = (verb === 'POST' || verb === 'PUT') ?
				'application/json' :
				'application/x-www-form-urlencoded';
			
			$.ajax({
				type: verb,
				url: url + handler,
				dataType: dataType,
				contentType: contentType,
				processData: contentType === 'application/x-www-form-urlencoded',
				data: contentType === 'application/json' ? JSON.stringify(data) : data,
				// TODO: smartpr api expects traditional (I think?)
				// traditional: true,
				complete: function(xhr, textStatus) {
					// console.log('$.ajax complete:');
					// console.log(textStatus);
				},
				dataFilter: function(data, type) {
					// console.log('$.ajax dataFilter:');
					// console.log(data);
					// console.log(type);
					return data;
				},
				success: function(data, textStatus, xhr) {
					// console.log(data);
					// console.log(textStatus);
					success.call(this, data);
				},
				error: function(xhr, textStatus, errorThrown) {
					// console.log('$.ajax error:');
					// console.log(textStatus);
					// console.log(error);
					error.call(this, $.httpData(xhr));
				}
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
					// TODO: add callback to handler in case of jsonp?
		this.request('POST', handler, data, success);
	},
	put: function(handler, data, success) {
		this.request('PUT', handler, data, success);
	}
	
};

}(jQuery));
