(function($, undefined) {

$.al.Wrapper = $.al.Object.subtype({
	
	name: 'jQuery.al.Wrapper',
	
	args: [],
	
	construct: function(w, f) {
		
		var wraps;
		this.wraps = function(w) {
			if (arguments.length === 0) return wraps;
			
			// We need `w` to be of type `Object`. If it isn't already we use
			// `$.al.Object` instead of `Object` due to the embarrassing fact
			// that the following holds true in IE8:
			// `new Object([object HTMLElement]) instanceof Object === false`
			if (!(w instanceof Object)) w = $.al.Object(w);
			$($.makeArray(wraps)).unbind('valuechange', this.update);
			wraps = w;
			$($.makeArray(wraps)).bind('valuechange', $.proxy(this.update, this));
			this.update();
			
			return this;
		};
		
		var filter;
		this.filter = function(f) {
			if (arguments.length === 0) return filter;
			
			// TODO: A(n small) optimization would be to just skip calling a
			// function if `f` is not one.
			if (!$.isFunction(f)) f = function(value) { return value; };
			filter = f;
			// We do not call `update` upon `filter` change, as the concept of
			// a filter does not encompass real-time application. I.e. it is
			// being used when a `valuechange` on the wrapped object is
			// detected, beyond that there is no necessary correlation between
			// a wrapper's filter and its value.
			return this;
		};
		
		this.update = function() {
			var result = filter.call(this, wraps.valueOf());
			// If `filter` does not return anything, don't update the
			// wrapper's value. This allows for delays and conditions.
			if (result !== undefined) this.valueOf(result);
			return this;
		};
		
		// `wraps` depends on `filter` but not the other way around.
		this.filter(f).wraps(w);
		
	}
	
});

}(this.jQuery));



(function($, undefined) {

$.al.Wrapper = $.al.Object.subtype({
	
	name: 'jQuery.al.Wrapper',
	
	args: [],
	
	// The `updater` argument determines when `filter` is executed (and
	// consequently the possibility of change of this object's value). One
	// could argue that the necessity of such a function contradicts with
	// **jQuery App Layer**'s basic premise that It All Just Works™ as long as
	// an object has a `valueOf` method and triggers `valuechange` events to
	// notify changes. `$.al.Wrapper` should not be an exception, and if you
	// want DOM elements to be wrapable you should define a dedicated type
	// that acts as a thin shell around the element. *But*; such a shell would
	// have basically the same implementation as `$.al.Wrapper`, except for a
	// few minor element-specific differences. So then we would end up with a
	// bunch of non-DRY code. Which leads us to the conclusion that
	// `$.al.Wrapper`'s responsibility needs to include being capable of
	// dealing with "custom"  objects (i.e. objects that do not comply to
	// **jQuery App Layer**'s conventions). That is where the `updater`
	// arguments comes in.
	construct: function(wrapped, filter, updater) {
		// We need `wrapped` to be of type `Object`. If it isn't already we
		// use `$.al.Object` instead of `Object` due to the embarrassing fact
		// that the following holds true in IE8:
		//   `new Object([object HTMLElement]) instanceof Object === false`
		if (!(wrapped instanceof Object)) wrapped = $.al.Object(wrapped);
		// TODO: A(n small) optimization would be to just skip calling a
		// function if `filter` is not one.
		if (!$.isFunction(filter)) filter = function(value) { return value; };
		// `updater` can be defined as a string of event type(s) which should
		// be observed, or as a function that calls its argument whenever an
		// update should be done.
		if (updater === undefined) updater = 'valuechange';
		if (typeof updater === 'string') {
			var eventType = updater;
			updater = function(update) {
				$([wrapped]).bind(eventType, update);
			};
		}
		
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			return _valueOf.call(this);
		};
		
		var update = function() {
			var result = filter.call(this, wrapped.valueOf());
			// If `filter` does not return anything, don't update the
			// wrapper's value. This allows for delays and conditions.
			if (result !== undefined) _valueOf.call(this, result);
		};
		
		updater.call(this, $.proxy(update, this));
		
		update.call(this);
		
		// TODO: Provide a means to unwrap; make this object
		// garbage-collectible (i.e. `.unbind('valuechange', update)`). We
		// should probably leverage an `$.al.Object`-level `destroy` method
		// for this.
	}
	
});

}/*(this.jQuery)*/);