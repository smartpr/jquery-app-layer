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
	return new Function('data',
		'var p=this.p=[];' +
		'this.print=function(){p.push.apply(p,arguments);};' +
		'with(data){this.p.push(\'' +
		template.replace(/[\r\t\n]/g, " ").
			replace(regexps.singleQuoteHack, "\t").
			split("'").join("\\'").
			split("\t").join("'").
			replace(regexps.interpolation, "',$1,'").
			split(settings.executeStart).join("');").
			split(settings.executeEnd).join("this.p.push('") +
		"');}" +
		"return this.nodes(p);"
	);
};
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

var Flirt = function(template, which, cb) {
	if (!(this instanceof Flirt)) {
		return new Flirt(template, which, cb);
	}
	
	if (typeof template === 'string') {
		var reduced,
			compiled = [],
			t = 0;
		while (true) {
			reduced = template.replace(regexps.nestingLeaf, function(match, field, part) {
				compiled[++t] = compile(part);
				return settings.interpolateStart + 'this.flirt.parse(' + field + ',' + t + ')' + settings.interpolateEnd;
			});
			if (reduced === template) {
				break;
			}
			template = reduced;
		}
		compiled[0] = compile(template);
		template = compiled;
	}
	if (cb === undefined && $.isFunction(which)) {
		cb = which;
		which = undefined;
	}
	if (which === undefined) {
		which = 0;
	}
	
	this.parse = function(data, t) {
		if (!$.isArray(data)) {
			data = [data];
		}
		if (t === undefined) {
			t = which;
		}
		var $part,
			$all = $('<div />');
		for (var i = 0, l = data.length; i < l; i++) {
			$part = template[t].call({flirt: this, nodes: nodes}, data[i]);
			if ($.isFunction(cb)) {
				cb.call($part, data[i], new Flirt(template, t));
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
	
	return new Flirt(template, cb).parse(data);
};

}(jQuery));







(function($) {

var NS = 'flirt_outdated';

$.fn[NS] = function(data, commit) {
	var $this = this,
		template = $this.fetch(NS, 'template'),
		html = '';
	
	if (template === undefined) {
		template = '';
		$this.contents('[nodeType=8]').each(function() {
			if (this.data.substr(0, NS.length).toLowerCase() === NS) {
				template += $.trim(this.data.substr(NS.length));
				$(this).remove();
			}
		});
		if (!template) {
			return null;
		}
		template = _.template(template);
		$this.store(NS, 'template', template);
	}
	if (!$.isArray(data)) {
		data = [data];
	}
	for (var i = 0, l = data.length; i < l; i++) {
		html += template(data[i]);
	}
	if (commit === false) {
		return html;
	}
	return $this.html(html);
};

}(jQuery));
