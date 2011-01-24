(function($) {

// TODO: send data in traditional way (id=1&id=2)
// TODO: Handle the scenario of retrieving another datatype than requested in
// a transparent and consistent manner (now, IE8 throws a syntax error in case
// of jsonp requested and html retrieved -- not sure about behavior in other
// scenarios).

$.Rest = function(url, dataType, err, validate) {
	if (!(this instanceof $.Rest)) {
		return new $.Rest(url, dataType, err, validate);
	}
	
	// TODO: What about implementing success and error handlers as promises:
	//   api.get(...).success(function() { ... }).error(function() { ... })
	
	this.request = function(verb, handler, data, success, requestErr) {
		var error = function() {
			if ($.isFunction(err)) err.apply(this, arguments);
			if ($.isFunction(requestErr)) requestErr.apply(this, arguments);
		};
		
		setTimeout(function() {
			var contentType = (verb === 'POST' || verb === 'PUT') ?
				'application/json' :
				'application/x-www-form-urlencoded';
			
			var fullUrl = url + handler;
			if (verb === 'DELETE' && data && !$.isEmptyObject(data)) {
				fullUrl += '?' + $.param(data, true);
			}
			
			var ajaxObj = {
				type: verb,
				url: fullUrl,
				dataType: dataType,
				contentType: contentType,
				processData: contentType === 'application/x-www-form-urlencoded',
				data: contentType === 'application/json' ? JSON.stringify(data) : data,
				cache: false,	// IE tends to cache xhr responses.
				// TODO: smartpr api expects traditional (I think?)
				traditional: true,
				complete: function(xhr, textStatus) {
					// console.log('$.ajax complete:');
					// console.log(textStatus);
					// TODO: We probably want to cancel the request as soon
					// as the xhr does not validate...
					if ($.isFunction(validate)) {
						validate(xhr);
					}
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
					// console.log(xhr);
					// console.log(textStatus);
					// console.log(errorThrown);
					error.call(this, xhr, $.httpData(xhr));
				}
			};
			// console.log(ajaxObj);
			$.ajax(ajaxObj);
		}, 0);
	};
};

$.Rest.prototype = {
	
	// TODO: if cb is not provided, return curried function
	// I think this is only useful if it accepts a 'lazy data object', with
	// functions in the fields, that are only evaluated when the actual request
	// is done.
	get: function(handler, data, success, error) {
		this.request('GET', handler, data, success, error);
	},
	post: function(handler, data, success, error) {
		this.request('POST', handler, data, success, error);
	},
	put: function(handler, data, success, error) {
		this.request('PUT', handler, data, success, error);
	},
	del: function(handler, data, success, error) {
		this.request('DELETE', handler, data, success, error);
	}
	
};

}(jQuery));
