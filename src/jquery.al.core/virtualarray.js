(function($, undefined) {

$.al.VirtualArray = $.al.Array.subtype({
	
	name: 'jQuery.al.VirtualArray',
	
	args: function(loader) {
		if ($.isFunction(loader)) {
			return [];
		}
	},
	
	construct: function(l) {
		var length;
		
		var _size = this.size;
		this.size = function(s) {
			var size = _size.call(this);
			if (arguments.length === 0) {
				return length === undefined ? size : length;
			}
			length = undefined;
			if (s < size) {
				_size.call(this, s);
			} else if (s > size) {
				length = s;
				$(this).trigger('sizechange', { to: length });
			}
			return this;
		};
		
		// TODO: Move to `.size('loaded')`.
		this.loaded = function() {
			return _size.call(this);
		};
		
		var loader,
			isPristine = true;
		this.loader = function(l) {
			loader = l;
			return this;
		};
		this.load = function(cb) {
			this.isPristine(false);
			loader.call(this, $.proxy(cb, this));
			return this;
		};
		this.isPristine = function(p) {
			if (arguments.length === 0) {
				return isPristine;
			}
			isPristine = !!p;
			return this;
		};
		
		if ($.isFunction(l)) {
			this.loader(l);
		}
	},
	
	proto: {
		
		// TODO: Remove, as useless(?)
		each: function(cb) {
			var _each = this.each;
			if (this.isPristine()) {
				return this.load(function() {
					_each.call(this, cb);
				});
			}
			return _each.call(this, cb);
		}
		
	}
	
});

}(this.jQuery));