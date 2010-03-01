(function($) {

var Flexicallback = function(callback) {
		if (!(this instanceof Flexicallback)) {
			return new Flexicallback(callback);
		}
	
		var expect = 0;
		$.extend(this, {
			call: function(context) {
				if (this.isExpecting() && --expect === 0) {
					return callback.call(context);
				}
			},
			expect: function(n) {
				if (typeof n === 'number') {
					expect = n;
				} else {
					expect++;
				}
			},
			isExpecting: function() {
				return expect > 0;
			}
		});
	},
	flexify = function(func) {
		return function(next) {
			var flexicallback = Flexicallback(next);
			func.call(this, flexicallback);
			if (!flexicallback.isExpecting()) {
				next();
			}
		};
	};

$.fn.flexiqueue = function() {
	var args = $.makeArray(arguments),
		d = typeof args[0] === 'string' ? 1 : 0,
		data = args[d];
	
	if ($.isFunction(data)) {
		args[d] = flexify(data);
	} else if ($.isArray(data)) {
		for (var i = 0, l = data.length; i < l; i++) {
			data[i] = flexify(data[i]);
		}
	}
	
	return $.fn.queue.apply(this, args);
};

}(jQuery));

