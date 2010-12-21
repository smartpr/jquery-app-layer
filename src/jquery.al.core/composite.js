(function($, undefined) {

var getObservables = function(value) {
	if (!(value instanceof Object)) return [];
	
	// TODO: Work-around JScript's DontEnum bug in the following
	// iterations.
	return _(value).chain().
		values().
		select(function(property) { return property instanceof Object; }).
	value();
};

$.al.Composite = $.al.Object.subtype({
	
	name: 'jQuery.al.Composite',
	
	args: [],
	
	construct: function(v) {
		
		var _valueOf = this.valueOf;
		this.valueOf = function() {
			// TODO: Align right margin.
			
			// A composite's value is solely about the properties; i.e. the
			// containing object's identity is irrelevant and should not be
			// exposed to the outside world, for two reasons:
			// 1. As soon as we expose the internal object reference, the
			//    object can be altered without us being able to detect it and
			//    trigger a `valuechange` event. By not allowing this to
			//    happen we will
			//    probably prevent more problems and confusion than we will cause
			//    frustration, because the premise is simpler: if the composite
			//    changes, we can be certain that it will be notified through a
			//    `valuechange` event.
			// 2. In order for an object of any type (including a composite) to
			//    work with `$.al.Wrapper` it requires that the object's value is
			//    actually changed when it triggers a `valuechange` event. In the
			//    case of a composite; the composite object value's reference
			//    needs to be changed. Otherwise the change that is notified by
			//    the composite simply gets lost inside the wrapper who decides
			//    that the value did not actually change and does not trigger a
			//    `valuechange` event as a result.
			return _.clone(_valueOf.call(this));
		};
		
		var onPropertyChange = function() {
			_valueOf.call(this, this.valueOf());
		};
		
		// TODO: We should be able to unbind these somehow, in order to allow
		// garbage collection to do its work. Probably leverage an
		// `$.al.Object`-level `destroy` method for this.
		$(getObservables(v)).bind('valuechange', $.proxy(onPropertyChange, this));
		
		// TODO: Should override method on `$.al.Object`.
		this.destroy = function() {
			$(getObservables(this.valueOf())).unbind('valuechange', onPropertyChange);
		};
		
		if (arguments.length > 0) {
			// Clone `v` because we don't want the outside world being able to
			// adjust our internal composite definition without us being able
			// to detect it.
			_valueOf.call(this, _.clone(v));
		}
	},
	
	proto: {
		
		// TODO: Should we DRY up this `get` with `$.al.Record`'s `get`?
		get: function(path) {
			if (arguments.length === 0) {
				return this.valueOf();
			}
			// TODO: This deep lookup doesn't really have any use here.
			return $.getObject(path, this.valueOf());
		}
		
	}
	
});

}(this.jQuery));