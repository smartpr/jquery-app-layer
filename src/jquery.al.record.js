(function($, undefined) {

var interval = 250;

var hashingFunction = function(record) {
	// TODO: Increase bucket granularity by introducing some sort of
	// identifier to this hashcode.
	return record.constructor.toString();
};
var index = new Hashtable(hashingFunction);
// var counts = new Hashtable(hashingFunction);
var normalize = function(records, Type) {
	var n = _.map(records, function(record) {
		if (!(record instanceof Type)) record = Type.instantiate(record);
		
		var indexed = index.get(record);
		
		if (indexed !== null) {
			// counts.put(indexed, counts.get(indexed) + 1);
			return indexed.valueOf(record.valueOf());
		}
		
		index.put(record, record);
		// counts.put(record, 1);
		$(record).one('destroy', function() {
			index.remove(this);
			// counts.remove(this);
		});
		return record;
	});
	// console.log('index size = ', index.size());
	return n;
};

var makeMockupStoreFunction = function(verb) {
	return function(a, b, c) {
		console.warn("No implementation for " + verb + " on ", this, " with arguments ", arguments);
	};
};

var makeStoreFunction = function(operation, verb) {
	
	var request = {
		now: $.debounce(interval, true, operation),
		soon: $.debounce(interval, false, operation)
	};
	return function() {
		// TODO: We can rewrite this in a more concise manner in
		// which the call to `request.*` is constructed right away
		// based on `arguments` and `operation.length`. We should
		// also make sure that the callback is always passed in
		// the right position, that is as argument with index
		// `operation.length - 1`.
		// Also; approach with looking at `operation.length` currently fails
		// with mockup functions.
		// Also; in case of `update` and `del`; do not proceed if no records
		// were supplied to operate on. Are there more of such generic CRUD
		// requirements that can be enforced at this level?
		
		var Type = this,
			query = _.toArray(arguments).slice(0, operation.length - 2),
			success = arguments[operation.length - 2] || $.noop,
			error = arguments[operation.length - 1] || $.noop,
			debounce = arguments[operation.length];
		
		// TODO: Supply arguments that indicate on which records the operation
		// is about to take place (in case of update & del at least)
		// TODO: Can't we offer some kind of 'global events' as well? -->
		// useful in #session-expired to detect 403 errors.
		$(Type).triggerHandler(verb + ':beforeSend');
		request[debounce ? 'soon' : 'now'].apply(Type, $.merge(query, [function(items) {
			var args = $.merge([normalize(items, Type)], _.rest(arguments));
			success.apply(Type, args);
			$(Type).triggerHandler(verb + ':success', args);
		}, function() {
			error.apply(Type, arguments);
			$(Type).triggerHandler(verb + ':error', arguments);
		}]));
		
		return this;
	};
	
};

// var makeStoreDelFunction = function(delOperation) {
// 	
// 	var delRequest = {
// 		now: $.debounce(interval, true, delOperation),
// 		soon: $.debounce(interval, false, delOperation)
// 	};
// 	return function(records, cb, debounce) {
// 		cb = cb || .noop;
// 		
// 		var Type = this;
// 		
// 		$(Type).triggerHandler('del:beforeSend');
// 		delRequest[debounce ? 'soon' : 'now'].call(Type, records, function(items) {
// 			var args = $.merge([normalize(items, Type)], _.rest(arguments));
// 			cb.apply(Type, args);
// 			$(Type).triggerHandler('del:success')
// 		});
// 	};
// 	
// };

var makeRecordSaveMethod = function(createOperation) {
	
	// TODO: We probably want to move debouncing to the array/container/
	// whatever-we-are-gonna-call-it, as we want to debounce requests on the
	// same dataset, as opposed to requests on the same type. I.e. two datasets
	// of the same type should not debounce each other's requests.
	var createRequest = {
		now: $.debounce(interval, true, createOperation),
		soon: $.debounce(interval, false, createOperation)
	};
	return function(data, success, error, debounce) {
		data = data || this.valueOf();
		success = success || $.noop;
		error = error || $.noop;
		
		var self = this,
			Type = this.constructor;
		
		if (this.isNew()) {
			$(Type).triggerHandler('create:beforeSend');
			createRequest[debounce ? 'soon' : 'now'].call(Type, data, function(item) {
				self.valueOf(item);
				// TODO: supply created instance in an array (like currently)?
				var args = $.merge([normalize([self], Type)], _.rest(arguments));
				success.apply(Type, args);	// TODO: `Type` as context?
				$(Type).triggerHandler('create:success', args);
			}, function() {
				error.apply(Type, arguments);
				$(Type).triggerHandler('create:error', arguments);
			});
		} else {
			// TODO: Use same code as used for custom store methods on list??
			Type.update.call(Type, [this], data, success, error, debounce);
		}
		
		return this;
	};
	
};

$.al.Record = $.al.Dict.subtype({
	
	name: 'jQuery.al.Record',
	
	proto: {
		
		isNew: function() {
			return true;
		},
		
		save: makeRecordSaveMethod(makeMockupStoreFunction('create')),
		
		del: function() {
			var list = this.constructor.Array.instantiate(this);
			list.del();
			return this;
		},
		
		equals: function(record) {
			return this === record;
		}
		
	},
	
	type: _(['read', 'update', 'del']).chain().reduce(function(type, verb) {
		
		type[verb] = makeStoreFunction(makeMockupStoreFunction(verb), verb);
		return type;
		
	}, {}).extend({
		
		create: function() {
			var instance = this.instantiate();
			instance.save.apply(instance, arguments);
			return this;
		},
		
		toPrettyString: function(plural) {
			return plural ? "records" : "record";
		},
		
		subtype: function(record, list, store) {
			record = $.extend({}, record);
			list = $.extend({}, list);
			store = $.extend({}, store);
			
			var custom = _(store).chain().keys().without('create', 'read', 'update', 'del').value();
			
			// Construct list definition.
			
			list.name = list.name || record.name + '.Array';
			
			list.proto = _(custom).chain().reduce(function(proto, verb) {
				
				proto[verb] = function() {
					if (this.valueOf().length > 0) {
						var Type = this.constructor.recordtype();
						Type[verb].apply(Type, $.merge([this], arguments));
					}
					return this;
				};
				return proto;
				
			}, {}).extend(list.proto).value();
			
			list.type = _.extend({
				
				recordtype: function() {
					return Type;
				}
				
			}, list.type);
			
			// Construct record definition.
			
			record.base = this;
			
			record.proto = _(custom).chain().reduce(function(proto, verb) {
				
				proto[verb] = function() {
					var list = this.constructor.Array.instantiate(this);
					list[verb].apply(list, arguments);
					return this;
				};
				return proto;
				
			}, {}).extend(store.create ? { save: makeRecordSaveMethod(store.create) } : {}, record.proto).value();
			
			record.type = _(store).chain().reduce(function(type, operation, verb) {
				
				if (verb !== 'create') type[verb] = makeStoreFunction(operation, verb);
				return type;
				
			}, {}).extend({
				
				Array: record.base.Array.subtype(list)
				
			}, record.type).value();
			
			var Type = $.al.subtype(record);
			
			// TODO: Do we need such a handler on `$.al.Record` as well?
			// > Yes because it is a 'volwaardig' record type.
			// > No because it will never trigger `del:success` (at least in
			//   the current implementation, assuming no monkey-patches are
			//   being applied by externals).
			$(Type).bind('del:success', function(e, records) {
				// TODO: Can we expect `records` to be a `$.al.Array`?
				$.each(records.valueOf(), function(i, record) {
					record.destroy();
				});
			});
			
			return Type;
		},
		
		Array: $.al.Array.subtype({
			
			name: 'jQuery.al.Record.Array',
			
			construct: function() {
				
				var self = this;
				// TODO: Put this behavior in a config option. Also for `del:success`.
				$(this.constructor.recordtype()).bind('create:success', function() {
					if (self.query()) self.read(true, true);
				});
				
				var query;
				this.query = function(q, condition) {
					var self = this,
						debounce = false;
					
					if (arguments.length === 0) return query instanceof Object ? query.valueOf() : query;
					
					if ($.isPlainObject(q)) {
						if (_.keys(q).length > 1) debounce = true;
						q = $.al.Dict(q);
					}
					if (arguments.length > 1) q = $.al.Conditional(q, condition);
					 
					query = q;
					
					// TODO: Do inverse stuff on value that is being
					// overwritten.
					$(query).bind('valuechange', function() {
						self.read(true, debounce);
					});
					if (arguments.length < 2 || condition.valueOf()) self.read(true, debounce);
					
					return this;
				};
				
				var seamless = true;
				this.seamless = function(s) {
					if (arguments.length === 0) return seamless;
					seamless = !!s;
					return this;
				};
				
				// TODO: Naming
				var destroyRemainder = function(e, data) {
					$.each(_.without.apply(undefined, $.merge([data.from], data.to)), function(i, record) {
						record.destroy();
					});
				};
				this.master = function(m) {
					if (m) {
						$(this).bind('valuechange', destroyRemainder);
					} else {
						$(this).unbind('valuechange', destroyRemainder);
					}
				};
				
				// var config = {
				// 	query: {},
				// 	seamless: true
				// };
				// this.config = function(key, value) {
				// 	if (arguments.length === 0) return config;
				// 	if (arguments.length === 1) {
				// 		if (typeof key === 'string') return config[key];
				// 		$.each($.extend({}, config, key), $.proxy(this, 'config'));
				// 	} else {
				// 		// TODO: Do inverse stuff on value that is being
				// 		// overwritten.
				// 		config[key] = value;
				// 		if (key === 'query') {
				// 			var self = this,
				// 				debounce = _.keys(value).length > 1;
				// 			$($.al.Composite(value)).bind('valuechange', function() {
				// 				self.read(true, debounce);
				// 			});
				// 			self.read(true, debounce);
				// 		}
				// 	}
				// 	return this;
				// };
				
			},
			
			proto: {
				
				read: function(reset, debounce) {
					var self = this;
					
					if (!reset && self.valueOf().length >= self.size()) return this;
					
					// if (reset && !self.seamless()) {
					// 	self.size(0);
					// 	self.valueOf([]);
					// }
					$(self).trigger('changing');
					self.constructor.recordtype().read(self.query(), {
						offset: reset ? 0 : self.valueOf().length,
						after: reset ? undefined : _.last(self.valueOf())
					}, function(records, size) {
						if (arguments.length < 2) size = null;
						self.size(size);
						// Force notify because we need a way of unsetting
						// the result of `changing`. Also, it may be
						// conceptually weird to trigger `changing` and then
						// no `change`.
						self.valueOf((reset ? [] : self.valueOf()).concat(records), true);
					}, $.noop, debounce);
					
					return this;
				},
				
				del: function() {
					// TODO: Use same code as used for custom store methods on list.
					if (this.valueOf().length > 0) {
						var Type = this.constructor.recordtype();
						Type.del(this);
					}
					return this;
				},
				
				pluck: function(key) {
					return _.map(this.valueOf(), function(record) {
						return record.valueOf(key);
					});
				}
				
			},
			
			type: {
				
				recordtype: function() {
					return $.al.Record;
				}
				
			}
			
		})
		
	}).value()
	
});

}(this.jQuery));



/*
var debounce = 250;

$.record = function(Base, name, proto, crud) {
	if (arguments.length < 4) {
		crud = proto;
		proto = name;
		name = supertype;
		Base = $.al.Record;
	}
	
	var index = new Hashtable();
	var normalize = function() {
		
	};
	
	var type = {};
	
	if (crud.read) {
		var read = {
			now: $.debounce(debounce, true, crud.read),
			soon: $.debounce(debounce, false, crud.read)
		};
		type.read = function(query, latency, cb) {
			if ($.isFunction(latency)) {
				cb = latency;
				latency = false;
			}
			
			var Type = this;
			$(Type).triggerHandler('read:beforeSend');
			read[latency === true ? 'soon' : 'now'].call(Type, query, function(records) {
				records = normalize(records);
				if ($.isFunction(cb)) cb.apply(this, $.merge([records], _.rest(arguments)));
				$(Type).triggerHandler('read:success', records);
			});
		};
	}
	
	var arrayProto = {};
	
	if (type.read)
		arrayProto.load = function(query, hardReset) {
			
		};
		arrayProto.read = function() {
			this.constructor.recordtype().read
		};
	}


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
				
				// TODO: Move to `read:success` handler?
				var args = _.toArray(arguments);
				if ($.isArray(args[0])) {
					args[0] = _.map(args[0], function(item) {
						return normalize(item instanceof Type ? item : Type.instantiate(item));
					});
				}
				
				if ($.isFunction(cb)) cb.apply(this, args);
			});
		};
	}
	
	return Base.subtype({
		
		name: name,
		
		proto: proto,
		
		type: type
		
	}, {
		
		proto: arrayProto
		
	});
};
*/



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
				// TODO: new instances are not in record store yet, but we
				// want to make sure that this instance is the one that ends
				// up there upon save (as opposed to a newly created instance)
				self.constructor.create({
					// TODO: Get rid of fake empty object.
					data: $.isEmptyObject(obj) ? { contact_name: "0new" } : obj
				});
			} else {
				self.constructor.update({
					id: self.valueOf('id'),
					data: obj
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
		
		// TODO: Shouldn't we leverage a `valueEquals` (which one?)
		equals: function(other) {
			return this.constructor === other.constructor && this.valueOf('id') === other.valueOf('id');
		},
		
		// TODO: The implementation of this method influences performance of
		// record store. Wouldn't it be wiser to implement it as a
		// `hashcodeFunction` on `Hashtable`? So to eliminate the risk that
		// an overrider of `toString` accidently kills record store
		// performance. Everybody always just wants optimal performance, so it
		// does not serve any purpose to leave that responsibility up to the
		// JAL user.
		toString: function() {
			return '[' + this.valueOf('id') + ' ' + this.constructor.toString() + ']';
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
						
						// TODO: Move to `read:success` handler?
						var args = _.toArray(arguments);
						if ($.isArray(args[0])) {
							args[0] = _.map(args[0], function(item) {
								return normalize(item instanceof Type ? item : Type.instantiate(item));
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
						if (args.length > 0) {
							args[0] = normalize(args[0] instanceof Type ? args[0] : Type.instantiate(args[0]));
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
						
						// TODO: Move this to a handler of `del:success`.
						$.each(query.id, function(i, id) {
							var rec = STORE.get(Type.instantiate({ id: id }));
							rec.destroy();
						});
						
						// var args = _.toArray(arguments);
						// if ($.isArray(args[0])) {
						// 	args[0] = _.map(args[0], function(item) {
						// 		return normalize(item instanceof Type ? item : Type.instantiate(item));
						// 	});
						// 	$.each(args[0], function(i, record) {
						// 		record.destroy();
						// 	});
						// }
						if ($.isFunction(cb)) cb.apply(this, arguments);
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

// TODO: Make `STORE` private (and get rid of uppercase). Or; use an ordinary
// `$.al.Array` instance?
STORE = new Hashtable();
var normalize = function(instance) {
	var current = STORE.get(instance);
	if (current === null) {
		current = instance;
		$(current).one('destroy', function() {
			STORE.remove(this);
		});
		STORE.put(current, current);
	} else {
		current.valueOf(instance.valueOf());
	}
	return current;
};

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
}/*(jQuery)*/);

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