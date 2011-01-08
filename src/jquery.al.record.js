(function($) {

$.al.Record = $.al.Dict.subtype({
	
	name: 'jQuery.al.Record',
	
	proto: {
		
		isNew: function() {
			return this.valueOf('id') === undefined;
		},
		
		save: function(obj) {
			var self = this;
			
			obj = obj || self.valueOf();
			
			if (self.isNew()) {
				self.constructor.create({
					// TODO: Get rid of fake empty object.
					data: $.isEmptyObject(obj) ? { contact_name: "0new" } : obj
				}, function(item) {
					self.valueOf(item);
				});
			} else {
				self.constructor.update({
					id: self.valueOf('id'),
					data: obj
				}, function(item) {
					self.valueOf(item);
				});
			}
			
			return self;
		},
		
		del: function() {
			this.constructor.del({
				id: this.valueOf('id')
			}, function(total) {
				// TODO: What to do?
				// - destroy instance
			});
		},
		
		// TODO: Remove and simply use `valueOf`.
		get: function() {
			return this.valueOf.apply(this, arguments);
		}
		
	},
	
	type: {
		
		subtype: function(opts) {
			opts = $.extend({}, opts);
			
			opts.type = $.extend(opts.type || {}, {
				
				Array: this.Array.subtype({
					
					name: opts.name + '.Array',
					
					// construct: function() {
					// 	var _loader = this.loader;
					// 	this.loader = function() {
					// 		var args = _.toArray(arguments);
					// 		return _loader.call(this, function() {
					// 			opts.type.load.apply(Type, $.merge([this], args));
					// 		});
					// 	};
					// },
					
					type: {
						
						recordType: function() {
							return Type;
						}
						
					}
					
				})
				
			});
			
			// TODO: Here we might need call in the central store
			// (which is to be done), instead of direct
			// instantiation of records.
			
			if (opts.type.create) {
				var create = opts.type.create,
					debouncedCreate = $.debounce(250, create);
				opts.type.create = function(query, cb, debounce) {
					var Type = this;
					$([Type]).trigger('create:beforeSend');
					(debounce ? debouncedCreate : create).call(Type, query, function() {
						$([Type]).trigger('create:success');
						var args = _.toArray(arguments);
						if (args.length > 0 && !(args[0] instanceof Type)) {
							args[0] = Type.instantiate(args[0]);
						}
						if ($.isFunction(cb)) cb.apply(this, args);
					});
				};
			}
			
			if (opts.type.read) {
				var activeRead = $.debounce(250, true, opts.type.read),
					passiveRead = $.debounce(250, false, opts.type.read);
				opts.type.read = function(query, cb, passive) {
					var Type = this;
					query = $.extend({}, query);
					for (var key in query) {
						if (query[key] instanceof Object) query[key] = query[key].valueOf();
					}
					$([Type]).trigger('read:beforeSend');
					(passive ? passiveRead : activeRead).call(Type, query, function() {
						$([Type]).trigger('read:success');
						var args = _.toArray(arguments);
						if ($.isArray(args[0])) {
							args[0] = _.map(args[0], function(item) {
								return item instanceof Type ? item : Type.instantiate(item);
							});
						}
						if ($.isFunction(cb)) cb.apply(this, args);
					});
				};
			}
			
			if (opts.type.update) {
				var update = opts.type.update,
					debouncedUpdate = $.debounce(250, update);
				opts.type.update = function(query, cb, debounce) {
					var Type = this;
					$([Type]).trigger('update:beforeSend');
					(debounce ? debouncedUpdate : update).call(Type, query, function() {
						$([Type]).trigger('update:success');
						var args = _.toArray(arguments);
						if (args.length > 0 && !(args[0] instanceof Type)) {
							args[0] = Type.instantiate(args[0]);
						}
						if ($.isFunction(cb)) cb.apply(this, args);
					});
				};
			}
			
			// TODO: Remove instance from store.
			if (opts.type.del) {
				var del = opts.type.del,
					debouncedDel = $.debounce(250, del);
				opts.type.del = function(query, cb, debounce) {
					var Type = this;
					$([Type]).trigger('del:beforeSend');
					(debounce ? debouncedDel : del).call(Type, query, function() {
						$([Type]).trigger('del:success');
						var args = _.toArray(arguments);
						if ($.isArray(args[0])) {
							args[0] = _.map(args[0], function(item) {
								return item instanceof Type ? item : Type.instantiate(item);
							});
						}
						if ($.isFunction(cb)) cb.apply(this, args);
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
		
		Array: $.al.Array.subtype({
			
			name: 'jQuery.al.Record.Array',
			
			proto: {
				
				read: function(query, set, lazy) {
					var self = this;
					
					if (set === 'hardreset') {
						self.size(0);
						self.valueOf([]);
					}
					// TODO: Here `offset` and `limit` are assumed to be
					// generic query parameters; probably not a good idea.
					self.constructor.recordType().read($.extend({
						offset: set === 'append' ? self.valueOf().length : 0,
						limit: 50
					}, query), function(records, total) {
						// TODO: Here `total` is assumed to be a generic part
						// of the response; probably not a good idea(?)
						self.size(total);
						// Make sure to not modify the array that is our
						// current value.
						self.valueOf(set === 'append' ? self.valueOf().concat(records) : records);
					}, lazy);
				},
				
				del: function() {
					this.constructor.recordType().del({
						id: this.pluck('id')
					}, function(total) {
						// TODO: What to do?
						// - remove instances from array
						// - destroy them
					});
				},
				
				pluck: function(key) {
					return _.map(this.valueOf(), function(record) { return record.valueOf(key); });
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

/*
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
		// TODO: Make sure `valuechange` is triggered appropriately: leverage
		// `$.al.Composite`!(?)
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
					
					// construct: function() {
					// 	var _loader = this.loader;
					// 	this.loader = function() {
					// 		var args = _.toArray(arguments);
					// 		return _loader.call(this, function() {
					// 			opts.type.load.apply(Type, $.merge([this], args));
					// 		});
					// 	};
					// },
					
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
					$([Type]).trigger('read:beforeSend')
					return read.call(Type, query, function() {
						$([Type]).trigger('read:success');
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
*/
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