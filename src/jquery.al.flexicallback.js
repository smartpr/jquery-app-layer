/*
TODO:
- always use "new Flexicallback" as it's more efficient
- don't use $.extend(this, {}) inside Flexicallback as it adds to the noise
- put Flexicallback in a var declaration of its own to reduce indentation
- we cannot do fcb.call.call(anything) because fcb.call expects itself as the
	context... can't we make this more robust?
- make a $.flexiqueue for general (non-element-based) queues(??)
*/

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

$.fn.flexiqueue = function(name, queue) {
	var args = [];
	if (typeof name !== 'string') {
		queue = name;
	} else {
		args.push(name);
	}
	if ($.isFunction(queue)) {
		args.push(flexify(queue));
	} else if ($.isArray(queue)) {
		args.push($.map(queue, function(item) {
			return flexify(item);
		}));
	}
	return $.fn.queue.apply(this, args);
};

}(jQuery));

