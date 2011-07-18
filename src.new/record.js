(function($, undefined) {

// TODO: Extend from wrapper.Value or type.Object?
// TODO: Store in $.al.type or in local namespace?

$.record = function(parent, name, definition, operations) {
	if (arguments.length < 4) {
		operations = definition;
		definition = name;
		name = parent;
		parent = 'Record';
	}
	
	$.record[name] = $.record[parent].subtype($.extend({}, definition, {
		
		name: 'jQuery.record.' + name
		
	}), operations);
	
	$.al.wrapper[name] = $.al.wrapper[parent].subtype({
		
		name: 'jQuery.al.wrapper.' + name,
		
		type: {
			
			recordType: function() {
				return $.record[name];
			}
			
		}
		
	});
	
	$.al.list[name] = $.al.list[parent].subtype({
		
		name: 'jQuery.al.list.' + name,
		
		type: {
			
			recordType: function() {
				return $.record[name];
			}
			
		}
		
	});
	
	// TODO: Shouldn't this factory stuff be implemented at a higher level?
	
	$.property[name] = function(setup) {
		var p = $.component.property($.al.wrapper[name]);
		if (setup) p.setup(setup);
		return p;
	};
	$.property[name + 's'] = function(setup) {
		var p = $.component.property($.al.list[name]);
		if (setup) p.setup(setup);
		return p;
	};
	
	return $.record[name];
};

$.record.Record = $.al.wrapper.Dict.subtype({
	
	name: 'jQuery.record.Record',
	
	// should always have an object value (empty in case of new instance)
	
	proto: {
		
		id: function() {
			// TODO: We should have another field/attribute which can hold the
			// name of the id data-field. So we can use it not just here but
			// also in methods like `ids()` --- or, why can't ids() just be
			// implemented in terms of this method?
			return undefined;
		},
		
		isNew: function() {
			return this.id() === undefined;
		},
		
		read: function() {
			var self = this;
			
			// fail if isNew
			
			return self.constructor.read(self.id(), undefined);
		},
		
		del: function() {
			var self = this;
			// fail if isNew
			return this.constructor.del(this.id());
		},
		
		send: function(query) {
			return this.constructor.send(_.extend({}, query, { id: this.id() }));
		},
		
		attach: function(contacts) {
			return this.constructor.attach([this], contacts);
		},
		
		detach: function(contacts) {
			return this.constructor.detach([this], contacts);
		},
		
		// TODO: valueEquals?
		
		// TODO: rename to isEqual (used by _.isEqual)? ==> remember that
		// equals is used by Hashtable.
		equals: function(v) {
			return this.constructor === v.constructor && this.id() === v.id();
		}
		
	},
	
	type: {
		
		subtype: function(opts, operations) {
			// all implementations that depend on `operations` need to be
			// done here.
			
			opts = _.extend({}, opts);
			
			opts.proto = _.extend({}, opts.proto, {
				
				save: function(data) {
					var self = this;

					// TODO: || or extend ?
					data = data || self.valueOf();

					if (self.isNew()) {

						var Type = this.constructor,
							params = _.toArray(arguments);
						
						params[0] = data;
						
						var d = $.Deferred();
						
						$(Type).triggerSandwich('create', function(done, fail) {
							
							params.push(function(data) {
								var args = _.toArray(arguments);
								
								self.valueOf(data);
								args[0] = self;
								register(self);
								
								done.apply(this, args);
								d.resolveWith(this, args);
							});
						
							params.push(function() {
								fail.apply(this, arguments);
								d.rejectWith(this, arguments);
							});
							
							operations.create.apply(Type, params);
						
						});
						
						return d.promise();
						
					} else {
						return self.constructor.update(this.id(), data);
					}
				}
				
			});
			
			opts.type = _.extend({}, opts.type, {
				
				// deferred: function(operation) {
				// 	return this[operation](arguments.callee);
				// },
				
				create: function() {
					// implement in terms of record.save ===> NO because multi-create cannot be done this way
					
					var Type = this,
						params = _.toArray(arguments);
					
					return $.Deferred(function(d) {
						
						$(Type).triggerSandwich('create', function(done, fail) {
							
							params.push(function(data) {
								var args = _.toArray(arguments);
								
								if ($.isArray(data)) {
									args[0] = _.map(data, function(item) {
										return normalize(Type.instantiate(item));
									});
								} else {
									args[0] = normalize(Type.instantiate(data));
								}
								
								done.apply(this, args);
								d.resolveWith(this, args);
							});
							
							params.push(function() {
								fail.apply(this, arguments);
								d.rejectWith(this, arguments);
							});
							
							operations.create.apply(Type, params);
						
						});
						
					}).promise();
					
				},
				
				read: function() {
					
					// 
					// var operate = function() {
						var Type = this,
							params = _.toArray(arguments);
						
						$(Type).triggerHandler('read:before'); // TODO: cancelable?
						
						return $.Deferred(function(d) {
						
							params.push(function(data) {
								var args = _.toArray(arguments);
								
								if ($.isArray(data)) {
									args[0] = _.map(data, function(item) {
										return normalize(Type.instantiate(item));
									});
								} else {
									args[0] = normalize(Type.instantiate(data));
								}
								
								$(Type).triggerHandler('read:done'); // TODO: Provide args?
								$(Type).triggerHandler('read');
							
								d.resolveWith(this, args);
							});

							params.push(function() {
								$(Type).triggerHandler('read:error', arguments); // TODO: Provide args?
								
								d.rejectWith(this, arguments);
							});
							operations.read.apply(Type, params);
						
						}).promise();
					// };
					// 
					// if (defer === this.deferred) return _.bind(operate, this, _.rest(arguments));
					// else return operate.apply(this, arguments);
					
				},
				
				update: function() {
					var Type = this,
						params = _.toArray(arguments);
					
					return $.Deferred(function(d) {
						
						$(Type).triggerSandwich('update', function(done, fail) {
							
							params.push(function(data) {
								var args = _.toArray(arguments);
								
								if ($.isArray(data)) {
									args[0] = _.map(data, function(item) {
										return normalize(Type.instantiate(item));
									});
								} else {
									args[0] = normalize(Type.instantiate(data));
								}
								
								done.apply(this, args);
								d.resolveWith(this, args);
							});
							
							params.push(function() {
								fail.apply(this, arguments);
								d.rejectWith(this, arguments);
							});
							
							operations.update.apply(Type, params);
						
						});
						
					}).promise();
				},
				
				send: function() {
					var Type = this,
						params = _.toArray(arguments);
					
					return $.Deferred(function(d) {
						
						$(Type).triggerSandwich('send', function(done, fail) {
							
							params.push(function(data) {
								var args = _.toArray(arguments);
								
								if ($.isArray(data)) {
									args[0] = _.map(data, function(item) {
										return normalize(Type.instantiate(item));
									});
								} else {
									args[0] = normalize(Type.instantiate(data));
								}
								
								done.apply(this, args);
								d.resolveWith(this, args);
							});
							
							params.push(function() {
								fail.apply(this, arguments);
								d.rejectWith(this, arguments);
							});
							
							operations.send.apply(Type, params);
						
						});
						
					}).promise();
				},
				
				attach: function() {
					var Type = this,
						params = _.toArray(arguments);
					
					return $.Deferred(function(d) {
						
						$(Type).triggerSandwich('attach', function(done, fail) {
							
							params.push(function(data) {
								var args = _.toArray(arguments);
								
								if ($.isArray(data)) {
									args[0] = _.map(data, function(item) {
										return normalize(Type.instantiate(item));
									});
								} else {
									args[0] = normalize(Type.instantiate(data));
								}
								
								done.apply(this, args);
								d.resolveWith(this, args);
							});
							
							params.push(function() {
								fail.apply(this, arguments);
								d.rejectWith(this, arguments);
							});
							
							operations.attach.apply(Type, params);
						
						});
						
					}).promise();
				},
				
				detach: function() {
					var Type = this,
						params = _.toArray(arguments);
					
					return $.Deferred(function(d) {
						
						$(Type).triggerSandwich('detach', function(done, fail) {
							
							params.push(function(data) {
								var args = _.toArray(arguments);
								
								if ($.isArray(data)) {
									args[0] = _.map(data, function(item) {
										return normalize(Type.instantiate(item));
									});
								} else {
									args[0] = normalize(Type.instantiate(data));
								}
								
								done.apply(this, args);
								d.resolveWith(this, args);
							});
							
							params.push(function() {
								fail.apply(this, arguments);
								d.rejectWith(this, arguments);
							});
							
							operations.detach.apply(Type, params);
						
						});
						
					}).promise();
				},
				
				del: function() {
					var Type = this,
						params = _.toArray(arguments);
					
					return $.Deferred(function(d) {
						
						$(Type).triggerSandwich('del', function(done, fail) {
							
							params.push(function(data) {
								var args = _.toArray(arguments);
								
								if ($.isArray(data)) {
									args[0] = _.map(data, function(item) {
										// console.log(item.email);
										return normalize(Type.instantiate(item), true).destroy();
									});
								} else {
									args[0] = normalize(Type.instantiate(data)).destroy();
								}
								
								done.apply(this, args);
								d.resolveWith(this, args);
							});
							
							params.push(function() {
								fail.apply(this, arguments);
								d.rejectWith(this, arguments);
							});
							
							operations.del.apply(Type, params);
						
						});
						
					}).promise();
				}
				
			});
			
			// Explicitly *not* using `this.subtype()` here, as we do not
			// control its implementation.
			// TODO: Why do we want control over its implementation? Isn't
			// this what this entire type inheritance setup is about?
			// ==> this.subtype will be inherited, so the superclass's subtype
			// method will not be usable here...(?)
			var Type = $.al.subtype(_.extend(opts, { base: this }));
			
			return Type;
		},
		
		read: function() {
			var Type = this,
				params = _.toArray(arguments);
			
			return $.Deferred(function() {
				this.reject("No implementation for read operation on ", Type, " with parameters ", params);
			}).promise();
			
		}
		
	}
	
});

// TODO: Regarding when the store comes into play:
// * currently this happens at the data layer (crud)
// * but this means normalization will never happen for instances that haven't
//   touched the data layer yet
// * so if we do want this, we need to move it to either:
//   - the managers, but then the data layer would supply non-normalized record
//     instances ... that's probably annoying(?)
//   - the record, but then we must make sure that instances are never created
//     via the new keyword, because that stands in the way of denormalization


// TODO: Make `STORE` private (and get rid of uppercase). Or; use an ordinary
// `$.al.Array` instance?
STORE = new Hashtable(function(item) {
	return '[' + item.id() + ' ' + item.constructor.toString() + ']';
});
var normalize = STOREnormalize = function(instance, noUpdate) {
	if (!(instance instanceof $.record.Record) || instance.isNew()) return instance;
	// if ($.isArray(instance)) return _.map(instance, normalize);
	
	var current = STORE.get(instance);
	if (current !== null) {
		current = current.record;
		// TODO: Delegate update logic to instance.
		// console.log('update', current.valueOf(), 'with', instance.valueOf());
		if (noUpdate !== true) current.valueOf(_.extend({}, current.valueOf(), instance.valueOf()));
	} else {
		current = instance;
	}
	return current;
};
var removeQueue = [];
var deferredRemoveAction;
var register = /*STOREregister =*/ function(instance) {
	if (!(instance instanceof $.record.Record) || instance.isNew()) return;
	
	var current = STORE.get(instance);
	if (current === null) {
		// console.error("Trying to register management of record that is not in STORE -- should not be possible!");
		current = { record: instance, count: 1 };
		$(current.record).bind('destroy', function() {
			// console.log('destroy', this.valueOf('email'));
			// Can be called twice (once manually, second time from unregister)
			// TODO: Should be implemented more tightly. (using one instead of bind perhaps?)
			var entry = STORE.get(this);
			if (entry && entry.count <= 0) {
				removeQueue.push(this);
				if (!deferredRemoveAction) {
					deferredRemoveAction = function() {
						for (var i = 0, l = removeQueue.length; i < l; i++) {
							STORE.remove(removeQueue[i]);
						}
						removeQueue = [];
						deferredRemoveAction = undefined;
					};
					_.defer(deferredRemoveAction);
				}
			}
			// if (STORE.get(this) && STORE.get(this).count <= 0) STORE.remove(this);
		});
		STORE.put(current.record, current);
	} else {
		current.count += 1;
	}
	// console.log("register", current.record.valueOf(), current.count);
};
var unregister = /*STOREunregister =*/ function(instance) {
	if (!(instance instanceof $.record.Record) || instance.isNew()) return;
	
	var current = STORE.get(instance);
	if (current === null) {
		// Can happen with instances that were new and then saved, and then
		// are attempted to be unregistered before they are registered by
		// record.save.
		// console.warn("STORE: Cannot unregister record that is not registered!", instance.valueOf());
		return;
	}
	if (current.count <= 0) {
		// console.warn("STORE: Cannot unregister record that has zero registrations!", current.record.valueOf());
	}
	current.count--;
	// console.log("unregister", current.record.valueOf(), current.count);
	if (current.count === 0) {
		current.record.destroy();
	}
	
};

$.al.wrapper.Record = $.al.wrapper.Value.subtype({
	
	name: 'jQuery.al.wrapper.Record',
	
	construct: function() {
		
		// TODO: Convert 1-sized array with Record instance to just the instance?
		
		$(this).bind('invalidate', function() {
			
			read.call(this);
			
		});
		
		var query, condition;
		
		var request;
		
		var read = function() {
			// TODO: Should this go *after* read:before? Btw; it's ugly.
			if (query === undefined) {
				return $.Deferred(function() {
					this.reject();
				}).promise();
			}
			
			$(this).triggerSandwich('read', function(done, fail) {
				var self = this;
				
				// TODO: This cancels requests -- is (probably) not what we want
				if (request) return;
				
				var Type = self.constructor.recordType();
				if (query instanceof Object && query.type) {
					Type = query.type.valueOf();
					// delete query.type;
				}
				request = Type.read(query, undefined).
					done(function(record) {
						// console.log("set wrapper value: ", self, record);
						self.valueOf(_.isArray(record) ? record[0] : record);
						done.apply(this, arguments);
						request = undefined;
					}).
					fail(function(code) {
						// TODO: Implement by handling read:error (?)
						if (code === 403) {
							// TODO: Binding to both types (explicitly)
							// is obviously not an attractive solution...
							$(DPL.Session).one('create', function() {
								// console.log('invalidate', self);
								self.invalidate();
							});
						}
						fail.apply(this, arguments);
						request = undefined;
					});
				
			});
			
			return request;
		};
		this.read = function(q, c) {
			
			if (arguments.length > 0) {
				if (q instanceof Object && !_.isArray(q)) {
					$(q).bind('change', $.proxy(this, 'invalidate'));
				}
				// TODO: unbind: upon new query supplied.
				
				query = q;
				condition = c;
				// this.invalidate();
			}
			
			return read.call(this);
		};
		
		$(this).bind('change:done', function(e, to, from) {
			unregister(from);
			register(to);
		});
		
	},
	
	proto: {
		
		save: function() {
			var value = this.valueOf();
			if (value instanceof $.record.Record) {
				return value.save.apply(value, arguments);
			}
		},
		
		del: function() {
			var value = this.valueOf();
			if (value instanceof $.record.Record) {
				return value.del.apply(value, arguments);
			}
		}
		
	},
	
	type: {
		
		recordType: function() {
			return $.record.Record;
		}
		
	}
	
});

$.al.list.Record = $.al.list.Value.subtype({
	
	name: 'jQuery.al.list.Record',
	
	construct: function() {
		
		var self = this;
		$(this.constructor.recordType()).bind('create', function() {
			// TODO: Depending on the record type, we can sometimes leave out
			// this invalidate. F.e. if this list represents a bunch of tags
			// that belong to a contact, we know for sure that a mere create
			// operation will not impact our data representation, as attaching
			// a tag to a contact requires an update operation.
			// console.log(self, ' invalidated as the result of a create of type ', self.constructor);
			if (cond && cond.valueOf()) self.invalidate();
		});
		
		// TODO: Alright, this obviously is specific to $.al.list.Tag.
		$(this.constructor.recordType()).bind('attach detach', function() {
			if (query && query.contact && cond && cond.valueOf()) {
				self.invalidate();
			}
		});
		
		$(this).bind('invalidate', function() {
			// TODO: I guess this logic should only hold if query has been
			// set -- lists that do not get their data from API should never
			// initiate API interactions all by themselves.
			if (query !== undefined) read.call(this, true);
			
		});
		
		var query, cond;
		
		var request;
		
		var read = function(reset, debounce) {
			if (debounce === undefined && _.isNumber(reset)) {
				debounce = reset;
				reset = false;
			}
			
			$(this).triggerSandwich('read', function(done, fail) {
				var self = this;
				
				if (!request) {
					request = _.debounce(function(reset) {
						// Making the request available directly effectively
						// means that we never have "post-request debouncing".
						// TODO: I think we still want this
						request = undefined;
						
						var self = this,
							offset = null;
						
						if (reset !== true && self.valueOf().length > 0) {
							offset = {
								count: self.valueOf().length,
								after: _.last(self.valueOf())
							};
						}
						
						// TODO: We should build in a guarantee that the
						// callbacks (done/fail) are called in sequence --
						// that is, in the order that the corresponding
						// requests were issued.
						var Type = self.constructor.recordType();
						if (query instanceof Object && query.type) {
							Type = query.type.valueOf();
							// delete query.type; 	deleting makes invalidation not work
						}
						Type.read(query, offset).
							done(function(records, total, rest) {
								// console.log('_hack = ', rest);
								self._hack = rest;
								// TODO: size before value, or event after size change?
								self.size(total);
								self.valueOf(reset === true ? records : self.valueOf().concat(records));
								done.apply(this, arguments);
							}).
							fail(function(code) {
								// TODO: Implement by handling read:error (?)
								if (code === 403) {
									// TODO: Binding to both types (explicitly)
									// is obviously not an attractive solution...
									$(/*[SPR.Session, */DPL.Session/*]*/).one('create', function() {
										// console.log('invalidate', self);
										self.invalidate();
									});
								}
								fail.apply(this, arguments);
							});
					}, debounce === true ? 200 : debounce || 0);
				}
				
				request.call(this, reset);
				
			});
		};
		this.read = function(q, condition) {
			if (arguments.length > 0) {
				
				// TODO: allow primitive values in condition.
				if (!(condition instanceof Object)) condition = new Boolean(true);
				cond = condition;
				
				var observables = _.select(q, function(value, key) {
					return value instanceof Object && !_.isArray(value);
				});
				
				var self = this;
				var pending = !condition.valueOf();
				$(condition).bind('change', function(e, to) {
					// console.log(self, 'condition = ', to);
					if (to && pending) {
						pending = false;
						// console.log(self, 'latent read');
						read.call(self, true, observables.length > 1);
					}
				});
				$(observables).bind('change', function(e, to) {
					if (!condition.valueOf()) {
						pending = true;
					} else {
						read.call(self, true, observables.length > 1);
					}
				});
				
				// $(observables.concat([condition])).bind('change', function(e, to) {
				// 	// TODO: invalidate event should trigger
				// 	if (condition.valueOf()) {
				// 		// console.log('observables/condition changed => read', q, condition);
				// 		read.call(self, true, observables.length > 1);
				// 	}
				// });
				// TODO: unbind: upon new query supplied.
				
				query = q;
				if (condition.valueOf()) {
					this.invalidate();
				}
			} else {
				read.call(this);
			}
			
			// TODO: Return "non-resolving promise".
			return this;
		};
		
		$(this).bind('change:done', function(e, to, from) {
			var intersect = _.intersect(from, to);
			_.map(_.without.apply(this, $.merge([from], intersect)), unregister);
			_.map(_.without.apply(this, $.merge([to], intersect)), register);
			// console.log("STORE: size = ", STORE.entries().length);
		});
		
	},
	
	proto: {
		
		// TODO: Are we using this one?
		pluck: function(key, fallback) {
			return _.map(this.valueOf(), function(record) {
				return key in record ? record[key]() : record.valueOf(key, fallback);
			});
		},
		
		ids: function() {
			return _.map(this.valueOf(), function(record) {
				return record.id();
			});
		},
		
		// TODO: Alright, this implementation is obviously completely nuts.
		// TODO: We want to be able to specify which fields we want in the
		// response!!
		save: function() {
			var create = []
			
			$.each(this.valueOf(), function(i, record) {
				if (record.isNew()) {
					create.push(record.valueOf());
				} else {
					record.save();
				}
			});
			
			var p;
			var self = this;
			// TODO: Should the manager really trigger its own non-read events?
			// We currently use this in #recipient-list-edit .contact-list in
			// selectedEmails.
			$(this).triggerSandwich('create', function(done, fail) {
				p = self.constructor.recordType().create(create).done(done).fail(fail);
			});
			return p;
		},
		
		del: function() {
			var self = this;
			return this.constructor.recordType().del({
				id: self.ids()
			});
		}
		
		/*
		
		
		read: function(query) {
			// TODO: no args = next chunk of current query (increase offset)
			var p, self = this;
			
			// TODO: where to put custom invalidation logic?
			
			$(this).triggerHandler('read:before');	// cancellable?
			
			var observables = _.select(query, function(value, key) {
				return value instanceof Object && !_.isArray(value);
			});
			
			$(observables).bind('change', $.proxy(this, 'invalidate'));
			// TODO: unbind? (when?)
			
			var args = arguments;
			if (observables.length > 1) {
				console.log('read with prepending debounce');
				p = $.Deferred(function(d) {
					self._read_soon.apply(self, $.merge([function() {
						d.resolve.apply(this, arguments);
					}], args));
				}).promise();
			} else {
				console.log('read with postpending debounce');
				p = self._read_now.apply(this, args);
			}
			
			// if ($.isPlainObject(query) && _.keys(query).length > 1) {	// not smart enough; should account for stuff like 'field'
			// 	var args = arguments;
			// 	if ('field' in query && !_.include(query.field, 'id')) {
			// 		query.field.unshift('id'); // TODO: Get 'id' from record definition
			// 	}
			// 	p = $.Deferred(function(d) {
			// 		self._read_soon.apply(self, $.merge([function() {
			// 			d.resolve.apply(this, arguments);
			// 		}], args));
			// 	}).promise();
			// } else {
			// 	p = this._read_now.apply(this, arguments);
			// }
			
			return p.
				done(function() {
					$(self).triggerHandler('read:done');
					$(self).triggerHandler('read');
				}).
				fail(function() {
					$(self).triggerHandler('read:fail');
				});
		}
		*/
		
	},
	
	type: {
		
		recordType: function() {
			return $.record.Record;
		}
		
	}
	
});

$.property.Record = function(setup) {
	var property = $.component.property($.al.wrapper.Record);
	property.setup(setup);
	return property;
};

$.property.Records = function(setup) {
	var property = $.component.property($.al.list.Record);
	property.setup(setup);
	return property;
};

}(this.jQuery));