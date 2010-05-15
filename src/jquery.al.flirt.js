(function($) {

var settings = {
	executeStart: '<%',
	executeEnd: '%>',
	interpolateStart: '<%=',
	interpolateEnd: '%>',
	nestStart: '<!-',
	nestEnd: '->',
	safeId: '_flirt-temporary-placeholder'
};

var regexps;
var compileRegexps = function() {
	regexps = {
		singleQuoteHack: new RegExp("'(?=[^" + settings.executeEnd[0] + "]*" + settings.executeEnd + ")", 'g'),
		interpolation: new RegExp(settings.interpolateStart + '(.+?)' + settings.interpolateEnd, 'g'),
		nestingLeaf: new RegExp(settings.nestStart + '(\\w+)\\s((?:[\\S\\s](?!' + settings.nestStart + '))+?)' + settings.nestEnd)
	};
};
compileRegexps();

var compile = function(template) {
	// TODO: Do not allow this function to execute if ('this' in data). Throw
	// exception in that case?
	return new Function('data',
		"this.p=[];" +
		"with(this){" +
			"this.print=function(){p.push.apply(p,$.map(arguments,esc));};" +
			"with(data){" +
				"this.p.push('" +
				template.replace(/[\r\t\n]/g, " ").
					replace(regexps.singleQuoteHack, "\t").
					split("'").join("\\'").
					split("\t").join("'").
					replace(regexps.interpolation, "',this.esc($1),'").
					split(settings.executeStart).join("');").
					split(settings.executeEnd).join("this.p.push('") +
				"');" +
			"}" +
			"return this.nodes(p);" +
		"}"
	);
};
// TODO: Extend part data type support (currently string and node, anything else
// is casted to string) with function (evaluate) and undefined (empty string).
var nodes = function(parts) {
	if (!$.isArray(parts)) {
		parts = [parts];
	}
	
	var nodeParts = [],
		nodePart,
		i = parts.length;
	while (i--) {
		nodePart = parts[i];
		if (nodePart instanceof $) {
			nodeParts.push([i, nodePart]);
			parts[i] = '<div id="' + settings.safeId + i + '" />';
		}
	}
	
	var $nodes = $('<div>' + parts.join('') + '</div>');
	i = nodeParts.length;
	while (i--) {
		nodePart = nodeParts[i];
		$nodes.find('#' + settings.safeId + nodePart[0]).replaceWith(nodePart[1]);
	}
	return $nodes.contents();
};

var Safemarked = function(value) {
	if (!(this instanceof Safemarked)) {
		return new Safemarked(value);
	}
	
	this.value = function() {
		return value;
	};
};

var $escaper = $('<div />');
// TODO: rename to simply 'esc': consistent with naming inside Flirt, therefore
// easier to comprehend.
var escapeHtml = function(token) {
	var safe = token instanceof Safemarked;
	if (safe) {
		token = token.value();
	}
	if (typeof token !== 'object') {
		token = safe ? ('' + token) : $escaper.text(token).html();
	}
	return token;
};

var Flirt = function(template, which) {
	if (!(this instanceof Flirt)) {
		return new Flirt(template, which);
	}
	
	if (typeof template === 'string') {
		var reduced,
			compiled = [],
			t = 0;
		while (true) {
			reduced = template.replace(regexps.nestingLeaf, function(match, field, part) {
				compiled[++t] = compile(part);
				return settings.interpolateStart + 'this.flirt.parse(' + field + ',' + t + ',this.callback)' + settings.interpolateEnd;
			});
			if (reduced === template) {
				break;
			}
			template = reduced;
		}
		compiled[0] = compile(template);
		template = compiled;
	}
	if (which === undefined) {
		which = 0;
	}
	
	this.parse = function(data, t, cb) {
		// TODO: Write test for this scenario (parser enters nested level for
		// non-existent data field).
		if (data === undefined) {
			return $();
		}
		if (!$.isArray(data)) {
			data = [data];
		}
		if (cb === undefined && $.isFunction(t)) {
			cb = t;
			t = undefined;
		}
		if (t === undefined) {
			t = which;
		}
		var $part,
			$all = $('<div />');
		for (var i = 0, l = data.length; i < l; i++) {
			$part = template[t].call({
				flirt: this,
				callback: cb,
				safe: Safemarked,
				esc: escapeHtml,
				nodes: nodes
			}, data[i]);
			// TODO: invalidation
//			$part.store('flirt', 'source', new Flirt(template, t));
			if ($.isFunction(cb)) {
				cb.call($part, data[i]);
			}
			$all.append($part);
		}
		return $all.contents();
	};
};

$.flirt = function(template, data, cb) {
	if (cb === undefined && $.isFunction(data)) {
		cb = data;
		data = undefined;
	}
	
	if (data === undefined) {
		if ($.isPlainObject(template)) {
			$.extend(settings, template);
			compileRegexps();
		}
		// Do not return the actual settings object in order to prevent
		// inconsistent behavior in case the returned object is modified.
		return $.extend({}, settings);
	}
	
	return new Flirt(template).parse(data, cb);
};

var $findTemplates = function(filter, max) {
	var nodes = [];
	
	if (this.length > 0) {
		
		$.merge(nodes, this.filter(function() {
			return this.nodeType === 8 && filter.apply(this, arguments) === true;
		}).get());
		
		if (max === undefined || nodes.length < max) {
			var remainder = max === undefined ?
				undefined :
				max - nodes.length;
			$.merge(nodes, this.filter('[nodeType=1]').contents().
				chain($findTemplates, filter, remainder).get());
		}
		
	}
	
	return $(max === undefined ? nodes : nodes.slice(0, max));
};

$.fn.flirt = function(action, data, templateName, cb) {
	// TODO: Remove support for this shortcut interface, as it's not worth the
	// inconsistency.
	if (typeof action !== 'string') {
		cb = templateName;
		templateName = data;
		data = action;
		action = 'set';
	}
	
	switch (action) {
		
		// TODO: Perhaps we should use 'append' or 'add' here, and use 'set' for
		// its combination with 'clear'. This design would be consistent with
		// dataview's.
		case 'set':
			var templateFilter = new RegExp('^' + (templateName ? templateName + '\\s' : ''));
			
			this.each(function() {
				// TODO: invalidation
//				var flirt = $this.fetch('flirt', 'source');
//				if (flirt) {
//					$this.replaceWith(flirt.parse(data, cb));
//					return true;
//				}
				
				var $template = $(this).chain($findTemplates, function() {
					var flirt = $(this).fetch('flirt');
					return flirt && flirt.name === templateName ||
						templateFilter.test(this.data);
				}, 1);
				if ($template.length === 0) {
					return true;
				}
				
				var flirt = $template.fetch('flirt', 'compiled');
				if (!flirt) {
					flirt = new Flirt($template[0].data.substr(templateName ? templateName.length + 1 : 0));
					$template.store('flirt', {
						name: templateName,
						compiled: flirt
					});
				}
				
				$template.before(flirt.parse(data, cb).store('flirt', 'clearable', true));
			});
			
			break;
	
		case 'clear':
			templateName = data;
			var clear = [];
			
			this.each(function() {
				$(this).chain($findTemplates, function() {
					var flirt = $(this).fetch('flirt');
					return flirt && (templateName === undefined || flirt.name === templateName);
				}).each(function() {
					var node = this.previousSibling;
					while (node && $(node).fetch('flirt', 'clearable') === true) {
						clear.push(node);
						node = node.previousSibling;
					}
				});
			});
			
			$(clear).remove();
			break;
	
	}
	return this;
};

}(jQuery));

