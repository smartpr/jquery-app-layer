(function($) {

$.al.Record = $.al.Object.subtype({
	
	name: 'jQuery.al.Record',
	
	construct: function() {
		
	},
	
	args: function() {
		
	},
	
	proto: {
		
		// TODO: Merge `get` and `set` into something like `data`? What about
		// `exists` in that case?
		
		// TODO: Allow for optional getters and setters.
		
		get: function(path) {
			if (arguments.length === 0) {
				return this.valueOf();
			}
			return $.getObject(path, this.valueOf());
		},
		
		// TODO: Use `$.fn.data` in order to be compatible with
		// jquery-datalink.
		set: function(path, value) {
			if (arguments.length > 0) {

				if (arguments.length === 1) {
					value = path;
					path = undefined;
				}

				if (path === undefined) {
					this.valueOf(value);
				} else {
					$.setObject(path, value, this.valueOf());
				}

			}

			return this;
		},
		
		exists: $.noop, // TODO
		
		isNew: function() {
			// TODO: Should be more generic.
			return this.get('id') === undefined;
		},
		
		save: function() {
			if (this.isNew()) {
				// TODO: create
			} else {
				this.constructor.update(this.get());
			}
			return this;
		}
		
	},
	
	type: {
		
		subtype: function(opts) {
			opts = $.extend({}, opts);
			
			opts.type = $.extend(opts.type || {}, {
				
				Array: this.Array.subtype({
					
					name: opts.name + '.Array',
					
					construct: function() {
						var _loader = this.loader;
						this.loader = function() {
							var args = _.toArray(arguments);
							return _loader.call(this, function() {
								opts.type.load.apply(Type, $.merge([this], args));
							});
						};
					},
					
					type: {
						
						recordType: function() {
							return Type;
						}
						
					}
					
				})
				
			});
			
			if (opts.type.read) {
				var read = opts.type.read;
				opts.type.read = function(query, cb) {
					var Type = this;
					return read.call(Type, query, function() {
						$([Type]).trigger('readsuccess');
						if ($.isFunction(cb)) {
							// TODO: Map data items in `arguments[0]` to
							// instances of `Type`?
							cb.apply(this, arguments);
						}
					});
				};
			}
			
			// TODO: What would be better here is to use `this`'s `subtype`
			// method that is being overridden by this one, as here we are
			// making assumptions about its implementation, which is not
			// something we can technically do as `this` might by any subtype
			// of `$.al.Record`. Problem: we currently have no means of
			// accessing this method (before it is actually overridden).
			// Idea: if we can find `this`'s parent type, we could call its
			// `subtype` method and force `Type` as its context. For instance:
			// `this.parentType().subtype.call(Type, opts)`.
			var Type = $.al.subtype($.extend(opts, { base: this }));
			
			return Type;
			
		},
		
		Array: $.al.VirtualArray.subtype({
			
			name: 'jQuery.al.Record.Array',
			
			construct: function() {
				var _splice = this.splice;
				this.splice = function() {
					var Record = this.constructor.recordType();
					
					return _splice.apply(this, $.merge(_.toArray(arguments).slice(0, 2), _.map(_.toArray(arguments).slice(2), function(item) {
						// TODO: Here we might need call in the central store
						// (which is to be done), instead of direct
						// instantiation.
						return item instanceof Record ? item : new Record(item);
					})));
				};
			},
			
			proto: {
				
				pluck: function(path) {
					return _.map(this.valueOf(), function(record) { return record.get(path); });
				}
				
			},
			
			type: {
				
				recordType: function() {
					return $.al.Record;
				}
				
			}
			
		})
		
	}
	
});

}(jQuery));

(function($) {

// TODO: We might want to switch to not returning the new type, but instead
// assigning it automatically to the variable as denoted by the name
// argument.
$.al.Record = $.al.Object.subtype('jQuery.al.Record', function() {
	
}, {
	
	get: function(path) {
		if (arguments.length === 0) {
			return this.valueOf();
		}
		return $.getObject(path, this.valueOf());
	},
	
	set: function(path, value) {
		if (arguments.length > 0) {
			
			if (arguments.length === 1) {
				value = path;
				path = undefined;
			}
		
			if (path === undefined) {
				this.valueOf(value);
			} else {
				$.setObject(path, value, this.valueOf());
			}
			
		}
		
		return this;
	},
	
	exists: $.noop, // TODO
	
	isNew: function() {
		// TODO: Should be more generic.
		return this.get('id') === undefined;
	},
	
	save: function() {
		if (this.isNew()) {
			// TODO: create
		} else {
			this.constructor.update(this.get());
		}
		return this;
	}
	
}, {
	
	// subtype: function(definition) {
	// 	// TODO: custom subtyping logic
	// },
	
	Array: $.al.VirtualArray.subtype('jQuery.al.Record.Array', function() {
		
	}, {
		
		pluck: function(path) {
			return _.map(this.valueOf(), function(record) { return record.get(path); });
		},
		
		del: function() {
			var self = this;
			self.constructor.recordType.del(this.pluck(self.constructor.recordType.idField));
		}
		
	}, function() {
		// TODO: Can't we get this logic out of here, into the array's value
		// setter or something like that? Include logic that reuses instances
		// from a central store in case identity matches.
		if (!_.all(arguments, function(arg) { return $.isPlainObject(arg); })) return;
		console.log(arguments);
		return _.map(arguments, function(arg) { return new this.constructor.recordType(arg); });
	}),
	
	records: function() {
		return this.read.apply(this, arguments);
	}
	
});

}/*(jQuery)*/);