(function($, undefined) {

// TODO: I think databind should listen to and act upon invalidate events
// TODO: Use jQuery 1.6's val() hooks?

$.fn.databind = function(data, serialize, deserialize) {
	serialize = serialize || function(data) {
		return data;
	};
	deserialize = deserialize || {};
	
	var $this = this;
	
	var toDom = function(data) {
		var $inputs = $this.find(':input').andSelf().filter(':input');
		
		if ($inputs.length === 1) {
			
			var value = data,
				$input = $inputs;
			
			if (!_.isArray(value)) value = [value];
			// See behavior of $.fn.val() for rationale behind this distinction
			if ($input.is(':checkbox, :radio, select[multiple="multiple"]')) {
				$input.val(value);
			} else {
				$input.each(function(i) {
					var current = $(this).val();
					var v = typeof value[i] === 'string' ? value[i].replace(/\r/g, '') : value[i];
					if (current !== v) {
						$(this).val(v);
					}
				});
			}
			
		} else {
			
			// TODO: Work from form fields instead of data object, so that
			// empty data objects will actually actively clean out the form
			
			$.each(data || {}, function(key, value) {
			
				if (deserialize[key] === false) return true;
				
				if (deserialize[key]) value = deserialize[key](value);
			
				var $input = $inputs.filter('[name="' + key + '"]');
				
				if (!_.isArray(value)) value = [value];
				
				// See behavior of $.fn.val() for rationale behind this distinction
				if ($input.is(':checkbox, :radio, select[multiple="multiple"]')) {
					// console.log($input.attr('name'), ' = ', value);
					// TODO: we need some condition that prevents superfluous
					// DOM manipulation here as well (like we are using below).
					// Just for the sake of minimizing DOM manipulation.
					$input.val(value);
				} else {
					$input.each(function(i) {
						var current = $(this).val();
						var v = typeof value[i] === 'string' ? value[i].replace(/\r/g, '') : value[i];
						// TODO: Uncertain if this is an actual scenario:
						if (typeof current === 'number' && typeof v === 'string') {
							v = parseInt(v, 10);
						}
						if (current !== v) {
							// console.log(key, v);
							// console.log(key, ' = |', _(v).chain().toArray().map(function(c) { return c.charCodeAt(0); }).value(), '| was: |', _(current).chain().toArray().map(function(c) { return c.charCodeAt(0); }).value(), '|');
							$(this).val(v);
						}
					});
				}
			
			});
			
		}
	};
	
	var fromDom = function() {
		var $inputs = $this.find(':input').andSelf().filter(':input');
		
		// TODO: Checking for length===1 is not correct, because it makes it
		// impossible to represent data objects in forms containing 1 field.
		if ($inputs.length === 1) {
			// console.log('databind interpreted as a one-field binding');
			data.valueOf($inputs.val());	// TODO: will this work in case of non-text boxes?
			
		} else {
			
			var d = serialize(_($inputs.filter('[name]').serializeArray()).chain().
				reduce(function(serialized, control) {
					
					if (control.name in serialized) {
						serialized[control.name].push(control.value);
					} else {
						serialized[control.name] = [control.value];
					}
					return serialized;

				}, {}).
				reduce(function(serialized, value, name) {
					
					serialized[name] = value.length === 1 ? value[0] : value;
					return serialized;

				}, {}).value());
			
			// console.log(d);
			
			data.valueOf(d);
						
		}
	};
	
	$([data]).bind('change', function(e, to) {
		toDom(to);
	});
	
	var timer;
	var onFocus = function() {
		timer = setTimeout(function() {
			fromDom();
			onFocus();
		}, 50);
	};
	
	$this.
		bind('focusin', onFocus).
		bind('focusout', function() {
			clearTimeout(timer);
		}).
		delegate(':checkbox, :radio, select', 'change', fromDom);
	
	toDom(data.valueOf());
	
	return this;
};

}(this.jQuery));


(function($, undefined) {

$.fn.databind = function(data, serialize, deserialize) {
	var $context = this;
	
	serialize = serialize || function(name, value) { return value; };
	deserialize = deserialize || function(name, value) { return value; };
	
	// Brackets necessary to deal with arrays.
	$([data]).bind('change', function(e, to) {
		
		if ($.isPlainObject(to)) {
			_.each(to, function(value, key) {
				$context.find(':input[name="' + key + '"]').val([deserialize(key, value)]);
			});
		} else {
			$context.find(':input').val([to]);
		}
		
	});
	
	var timer;
	var onFocus = function() {
		console.log("onFocus: ", $context);
		timer = setTimeout(function() {
			if ($.isPlainObject(data.valueOf())) {
				d = {};
				// TODO: include :input in $context
				_.each($context.find(':input').serializeArray(), function(pair) {
					d[pair.name] = serialize(pair.name, pair.value);
				});
				// $context.find(':input[name]').each(function() {
				// 	d[$(this).attr('name')] = serialize($(this).attr('name'), $(this).val());
				// });
				// console.log('update data from ', $context, ' to ', d);
				data.valueOf(d);
			} else {
				// console.log('update data from ', $context.find(':input:first')[0]);
				data.valueOf($context.find(':input:first').val());
			}
			onFocus();
		}, 50);
	};
	var onBlur = function() {
		console.log("onBlur: ", $context);
		clearTimeout(timer);
	};
	
	$context.
		bind('focusin', onFocus).
		bind('change', function() {
			if ($.isPlainObject(data.valueOf())) {
				d = {};
				// TODO: include :input in $context
				_.each($context.find(':input').serializeArray(), function(pair) {
					d[pair.name] = serialize(pair.name, pair.value);
				});
				// $context.find(':input[name]').each(function() {
				// 	d[$(this).attr('name')] = serialize($(this).attr('name'), $(this).val());
				// });
				// console.log('update data from ', $context, ' to ', d);
				data.valueOf(d);
			} else {
				// console.log('update data from ', $context.find(':input:first')[0]);
				data.valueOf($context.find(':input:first').val());
			}
		}).
		bind('focusout', onBlur);
	
	return this;
	
};

}/*(this.jQuery)*/);