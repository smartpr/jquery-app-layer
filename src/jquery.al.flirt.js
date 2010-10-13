// TODO: Add a function to the flirt run-time environment which can tell us if
// we are at the first or last item of a list. Use case: allow for easy
// generation of comma-separated lists.

// TODO: Find out why it does not work on <title />, and if we can change
// this situation.

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
		nestingLeaf: new RegExp(settings.nestStart + '(\\S+)\\s((?:[\\S\\s](?!' + settings.nestStart + '))+?)' + settings.nestEnd)
	};
};
compileRegexps();

var compile = function(template) {
	// TODO: Do not allow this function to execute if ('this' in data). Throw
	// exception in that case?
	return new Function('data',
		"this.data=data;this.p=[];" +
		"with(this){" +
			"this.print=function(){p.push.apply(p,$.map(arguments,esc));};" +
			"with((data===undefined||data===null)?this:data){" +
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
	
	// Avoid using .html() because it is flawed in dealing with whitespace in
	// IE8. See also: http://dev.jquery.com/ticket/7138
	var $nodes = $('<div />').append(parts.join(''));
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

// It turns out that escaping via a pre element is the only way to preserve
// whitespace correctly in IE8, regardless of white-space CSS settings in the
// page. This has something to do with the behavior of the innerHTML property
// in IE8.
var $escaper = $('<pre />');
// TODO: rename to simply 'esc': consistent with naming inside Flirt, therefore
// easier to comprehend.
var escapeHtml = function(token) {
	// Safemarked tokens should not be touched.
	if (token instanceof Safemarked) {
		return token.value();
	}
	// Escaping only applies to string tokens, as a number or a boolean cannot
	// contain dangerous characters.
	if (typeof token === 'string') {
		token = $escaper.text(token).html();
	}
	// This function is not in charge of serializing to string values, as we
	// want to leave that to nodes(), which delegates to Array.prototype.join.
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
				callback: cb,	// TODO: Do we really want to make this
								// accessible?
				safe: Safemarked,
				esc: escapeHtml,
				nodes: nodes
			}, data[i]);
			
			$part.filter(function() {
				return $(this).fetch('flirt', 'data') === undefined;
			}).store('flirt', {
				// TODO: It is not necessary to create a new renderer for
				// every data item at this level, apart from us needing an
				// identifier that allows us to find out which nodes belong to
				// the same template part.
				renderer: new Flirt(template, t),
				data: data[i]
			});
			
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
			// TODO: '[nodeType=1]' filter works, but gives the illusion that
			// elements with another nodeType are even considered, which is not
			// the case.
			$.merge(nodes, this.filter('[nodeType=1]').contents().
				chain($findTemplates, filter, remainder).get());
		}
		
	}
	
	return $(max === undefined ? nodes : nodes.slice(0, max));
};

var templateNode = function(context, name) {
	var templateFilter = new RegExp('^' + (name ? name + '\\s' : '')),
		$template = $(context).chain($findTemplates, function() {
			var flirt = $(this).fetch('flirt');
			return flirt && flirt.name === name || templateFilter.test(this.data);
		}, 1);
	
	if ($template.length === 0) {
		return;
	}
	
	if (!$template.fetch('flirt', 'renderer')) {
		var body = $template[0].data,
			nameMatch = /^\S+\s/.exec(body);
		if (nameMatch !== null) {
			body = body.substr(nameMatch.length + 1);
		}
		$template.store('flirt', {
			name: name,
			renderer: new Flirt(body)
		});
	}
	
	return $template[0];
};

$.fn.flirt = function(action) {
	
	switch (action) {
		
		case 'closest':
			var $closest = this.eq(0);
			
			if ($closest.fetch('flirt', 'renderer') === undefined) {
				$closest = $closest.closest(':data(flirt.renderer)');
			}
			// We found a piece of the edge of a template part, now get the
			// entire edge.
			if ($closest.length > 0) {
				var identity = $closest.fetch('flirt', 'renderer');
				$closest = $closest.parent().contents().filter(function() {
					return $(this).fetch('flirt', 'renderer') === identity;
				});
			}
			return $closest;
		
		case 'add':
			var data = arguments[1],
				templateName = arguments[2],
				cb = arguments[3];
			if (arguments.length < 4 && $.isFunction(templateName)) {
				cb = templateName;
				templateName = undefined;
			}
			
			return this.each(function() {
				var $this = $(this),
					$closest = $this.flirt('closest');
				
				if ($closest.length > 0) {
					$closest.eq(-1).after($closest.fetch('flirt', 'renderer').parse(data, cb));
				} else {
					var $node = $(templateNode(this, templateName));
					if ($node.length > 0) {
						$node.before($node.fetch('flirt', 'renderer').parse(data, cb));
					}
				}
			});
		
		case 'clear':
			var templateName = arguments[1];
			
			return this.each(function() {
				var $this = $(this),
					$closest = $this.flirt('closest');
				
				if ($closest.length > 0) {
					$closest.remove();
				} else {
					var clear = [];
					$this.chain($findTemplates, function() {
						var flirt = $(this).fetch('flirt');
						return flirt && (templateName === undefined || flirt.name === templateName);
					}).each(function() {
						var node = this.previousSibling;
						while (node && $(node).fetch('flirt', 'renderer') !== undefined) {
							clear.push(node);
							node = node.previousSibling;
						}
					});
					$(clear).remove();
				}
			});
		
		case 'set':
			var data = arguments[1],
				templateName = arguments[2],
				cb = arguments[3];
			if (arguments.length < 4 && $.isFunction(templateName)) {
				cb = templateName;
				templateName = undefined;
			}
			
			return this.each(function() {
				var $this = $(this),
					$closest = $this.flirt('closest');
				
				if ($closest.length > 0) {
					$this.
						flirt('add', data, templateName, cb).
						flirt('clear');
				} else {
					var $node = $(templateNode(this, templateName));
					if ($node.length > 0) {
						var clear = [],
							node = $node[0].previousSibling;
						while (node && $(node).fetch('flirt', 'renderer') !== undefined) {
							clear.push(node);
							node = node.previousSibling;
						}
						$(clear).remove();
						$node.before($node.fetch('flirt', 'renderer').parse(data, cb));
					}
				}
			});
		
	}
	
};

}(jQuery));

