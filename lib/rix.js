/*
 * jQuery AppLayer - New Wave Web App Tools
 *
 * @version 0.9
 * @requires jQuery >= 1.2.6
 * @requires IE >= 7 || Mozilla Gecko >= 1.9 (Firefox 3) || WebKit >= 522.11 (Safari 3)
 *
 * Copyright (c) 2008 Tim Molendijk
 * http://timmolendijk.nl/applayer/
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */

/*=========================================================================================================== library */
(function($) {
	
	$.jal = {
		
		util: {
			
			changeScope: function(funcs, scope, depth) {
				
				if (depth === undefined) {
					depth = 1;
				}
				
				if (typeof funcs === 'function') {
					return function() {
						return funcs.apply(scope, arguments);
					};
				}
				
				if (depth <= 0 || typeof funcs === 'string' || typeof funcs === 'number') {
					return funcs;
				}
				
				if (funcs instanceof Array) {
					return $.map(funcs, function(func) {
						return $.jal.util.changeScope(func, scope, depth - 1);
					});
				}
				
				var scoped = {};
				$.each(funcs, function(key, func) {
					scoped[key] = $.jal.util.changeScope(func, scope, depth - 1);
				});
				return scoped;
				
			},
			
			getSetOptionsArgs: function(key, value) {
				
				var get, set, restArg;
				
				if (typeof key === 'object' && !(key instanceof Array)) {
					set = key;
					restArg = value;
				} else if (value !== undefined) {
					set = {}
					set[key] = value;
				} else {
					get = key;
				}
				
				return {get: get, set: set, restArg: restArg};
				
			},
			
			setOptionsArgs: function(key, value) {
				
				var actions = $.jal.util.getSetOptionsArgs(key, value);
				
				actions.set = actions.set || {};
				
				if (actions.get !== undefined) {
					actions.set[actions.get] = undefined;
					delete actions.get
				}
				
				return actions;
				
			},
			
			decomposeNamespaced: function(namespaced, separator, copy) {
				
				if (typeof separator === 'boolean') {
					return arguments.callee.call(this, namespaced, undefined, separator);
				}
				
				var ns;
				
				// An array argument consists of the regular value for this argument in the first element and in the
				// second element a namespace string (which overrides an eventual namespace existent in the first
				// element) or else a value that is considered irrelevant and is therefore ignored.
				if (namespaced instanceof Array) {
					
					if (typeof namespaced[1] === 'string') {
						ns = namespaced[1];
					}
					
					namespaced = namespaced[0];
					
				}
				
				// namespaced is not already an object, so create one based on the string value.
				if (typeof namespaced !== 'object') {
					
					separator = separator || '.';
					
					var decomposed = namespaced.split(separator);
					
					namespaced = {
						base: decomposed[0],
						ns: decomposed[1],
						compose: function() {
							if (!this.ns) {
								return this.base;
							}
							return [this.base, this.ns].join(separator);
						}
					};
					
				}
				
				// Override the current namespace, if desired.
				if (ns !== undefined) {
					namespaced.ns = ns;
				}
				
				return namespaced;
				
			},
			
			createEventSoldier: function(e) {
				
				return $.extend({}, e, {
				
					preventDefault: function() {
						e.preventDefault();
					},
					
					stopPropagation: function() {
						e.stopPropagation();
					}
					
				});
				
			},
			
			isEmptyObject: function(obj) {
				
				var empty = true;
				$.each(obj, function() {
					empty = false;
					return false;
				});
				return empty;
				
			},
			
			changeStyle: function(elem, key, value, resetCurrent) {
				
				if (key instanceof Array) {
					var set = {};
					var $value = $(value);
					$.each(key, function(i, item) {
						set[item] = value.style[item];
						// Style that is specified on the element itself is
						// always dominant, so if we find that we do not have to
						// look any further. Else, we can request the computed
						// style, but only if the element is part of the DOM.
						if (!set[item] && value.ownerDocument) {
							// We do not use jQuery's $.fn.css() here because it
							// does not work correctly inside iframes (at least
							// not in Firefox):
							// 		http://dev.jquery.com/ticket/4203
							// The code that we use here instead is not cross
							// browser compatible though.
							// TODO: We need to revise it as soon as we want to
							// support other browsers than Firefox. The issue
							// might solve itself if jQuery releases a fixed
							// version (1.3.3?) before that moment.
							set[item] = value.ownerDocument.defaultView.getComputedStyle(value, null).getPropertyValue(item);
						}
					});
					key = set;
					value = undefined;
				}
				
				if (resetCurrent === true) {
					elem.style.cssText = '';
				}
				
				var actions = $.jal.util.getSetOptionsArgs(key, value);
				
				var original = {};
				$.each(actions.set, function(key, value) {
					key = $.map(key.split('-'), function(item, i) {
						return i === 0 ? item : item.charAt(0).toUpperCase() + item.slice(1);
					}).join('');
					original[key] = elem.style[key];
					elem.style[key] = value;
				});
				
				return function() {
					$.extend(elem.style, original);
				};
				
			},
			
			parseFourpartedCssValue: function(value) {
				
				var values = value.split(' ');
				
				if (values.length < 2) {
					values.push(values[0]);
				}
				if (values.length < 3) {
					values.push(values[0]);
				}
				if (values.length < 4) {
					values.push(values[1]);
				}
				
				return values;
				
			},
			
			getObjectProperties: function(obj) {
				
				var props = [];
				for (prop in obj) {
					props.push(prop);
				}
				return props;
				
			},
			
			areArraysEqual: function(a, b) {
				
				if (a.length !== b.length) {
					return false;
				}
				
				var foundDifference = false;
				$.each(a, function(i, value) {
					if ($.inArray(value, b) === -1) {
						foundDifference = true;
						return false;
					}
				});
				
				return !foundDifference;
				
			},
			
			iterate: function(iterable, iteration, callback) {
				
				var i = -1,
					keys,
					size = iterable.length;
				
				if (size === undefined) {
					keys = [];
					for (key in iterable) {
						keys.push(key);
					}
					size = keys.length
				}
				
				var next = function() {
					i++;
					if (i === size) {
						return callback.call();
					}
					var key = keys ? keys[i] : i,
						result = iteration.call(next, key, iterable[key]);
					if (result !== false) {
						next.call();
					}
				};
				
				next.call();
				
				return iterable;
				
			},
			
			smoothShow: function(elem, onDisplay, onVisible, callback) {
				
				var $elem = $(elem),
					s = elem.style,
					isDisplayed = $elem.css('display') != 'none',
					isVisible = $elem.css('visibility') == 'visible';
				
				// If elem is already perceivable, make sure no handlers are
				// called.
				// TODO: What we really want to know is if setting display and/
				// or visibility attributes will have any effect. (F.e. if a
				// parent of elem has display == 'none', the current check will
				// conclude it makes sense to continue, while in fact elem will
				// not appear as a result of this function.
				if (isDisplayed && isVisible) {
					return;
				}
				
				if ($elem.pluginData('perceivable', '_locked') === true) {
					return;
				}
					
				$elem.pluginData('perceivable', '_locked', true);
				
				var result = true,
					done = function() {
						if (typeof callback === 'function') {
							callback.call(elem);
						}
						$elem.pluginRemoveData('perceivable', '_locked');
					},
					makeVisible = function() {
						// Do not make assumptions about the contents of 'this',
						// as this function might be called from an onDisplay
						// handler, which can be from any arbitrary third party
						// piece of code.
						result = true;
						// If elem was already displayed and already visible
						// perceivability has not changed.
						if (!isDisplayed || !isVisible) {
							// We should avoid leaving visibility settings on
							// elements, as they override their parents'
							// visibility settings.
							s.visibility = '';
							if (typeof onVisible === 'function') {
								result = onVisible.call(elem, done);
							}
						}
						// Only if onUndisplay returns false we expect its
						// callback to be called.
						if (result !== false) {
							done.call()
						}
					};
				
				result = true;
				if (!isDisplayed) {
					s.visibility = 'hidden';
					// Force DOM flow.
					s.visibility;
					// We cannot use s.display because we do not know if we should
					// set it to 'block' or 'inline'. jQuery's show() already solves
					// this problem.
					$(elem).show();
					if (typeof onDisplay === 'function') {
						result = onDisplay.call(elem, makeVisible);
					}
				}
				if (result !== false) {
					makeVisible.call();
				}
				
			},
			
			smoothHide: function(elem, onHidden, onUndisplay, callback) {
				
				var $elem = $(elem),
					s = elem.style;
				
				// If elem is already unperceivable, make sure no handlers are
				// called.
				if ($elem.css('display') == 'none') {
					return;
				}
				
				if ($elem.pluginData('perceivable', '_locked') === true) {
					return;
				}
					
				$elem.pluginData('perceivable', '_locked', true);
				
				var result = true,
					done = function() {
						if (typeof callback === 'function') {
							callback.call(elem);
						}
						$elem.pluginRemoveData('perceivable', '_locked');
					},
					makeUndisplay = function() {
						// Do not make assumptions about the contents of 'this',
						// as this function might be called from an onHidden
						// handler, which can be from any arbitrary third party
						// piece of code.
						result = true;
						s.display = 'none';
						// We should avoid leaving visibility settings on
						// elements, as they override their parents' visibility
						// settings.
						s.visibility = '';
						if (typeof onUndisplay === 'function') {
							result = onUndisplay.call(elem, done);
						}
						// Only if onUndisplay returns false we expect its
						// callback to be called.
						if (result !== false) {
							done.call();
						}
					};
				
				result = true;
				s.visibility = 'hidden';
				// Force DOM flow.
				s.visibility;
				if (typeof onHidden === 'function') {
					result = onHidden.call(elem, makeUndisplay);
				}
				if (result !== false) {
					makeUndisplay.call();
				}
				
			}
			
		}
		
	};
	
}(jQuery));

/*================================================================================================= jQuery extensions */
/*
 * TODO:
 * - Check for X-UA-Compatible meta tag to detect if IE8 is supposed to behave like or emulate IE7, in which case the
 *   browser qualifies for msieLt8.
 * - Move jalData and jalRemoveData into pluginFactory data methods.
 */
(function($) {
	
	$.fn.jalData = function(key, value, update) {
		
		if (value === undefined) {
			return this.size() > 0 ? $.data(this.get(0), key) : undefined;
		}
		
		return this.each(function() {
			var set = value;
			if (update === true && typeof value === 'object') {
				set = $.extend({}, $.data(this, key), value);
			}
			$.data(this, key, set);
		});
		
	};
	
	$.fn.jalRemoveData = function(key, subKey) {
		
		return this.each(function() {
			
			var data = $.data(this, key);
			
			if (data === undefined) {
				return;
			}
			
			var set = {};
			
			if (subKey !== undefined) {
				set = $.extend({}, data);
				delete set[subKey];
			}
			
			if ($.jal.util.isEmptyObject(set)) {
				$.removeData(this, key);
			} else {
				$.data(this, key, set);
			}
			
		});
		
	};
	
	var userAgent = navigator.userAgent.toLowerCase();
	$.extend($.browser, {
		msieLt8: $.browser.msie && parseFloat($.browser.version) < 8,
		webkit: /webkit/.test(userAgent),
		chrome: /chrome/.test(userAgent)
	});
	
}(jQuery));

/*===================================================================================================== pluginFactory */
/*
 * TODO:
 * - Enable plugin data persistence defined in hours: see $.pluginData.
 */ 
(function($) {
	
	var getFirstclassName = function(ns, funcName) {
		return funcName.replace(/^([^\W_]*)(_)([^\W_]*)/, function(funcName, before, wildcard, after) {
			return before + (before !== '' ? ns.charAt(0).toUpperCase() + ns.substr(1) : ns) + after.charAt(0).toUpperCase() + after.substr(1);
		});
	};
	
	$.pluginFactory = function(plugin) {
		
		plugin = $.extend({
			opt: {},
			glob: {},
			pub: {},
			priv: {}
		}, plugin);
		
		if (typeof plugin.ns !== 'string') {
			return;
		}
		
		plugin.optDefaults = {};
		plugin.optPersist = {};
		$.each(plugin.opt, function(key, opt) {
			plugin.optDefaults[key] = opt[0];
			var persistStore;
			if (typeof opt[1] === 'string') {
				persistStore = plugin.optPersist;
			}
			if (typeof opt[1] === 'number') {
				plugin.optPersist['hours'] = plugin.optPersist['hours'] || {};
				persistStore = plugin.optPersist['hours'];
			}
			if (persistStore !== undefined) {
				persistStore[opt[1]] = persistStore[opt[1]] || [];
				persistStore[opt[1]].push(key);
			}
		});
		delete plugin.opt;
		
		$.each(plugin.glob, function(key, prop) {
			var firstclass = getFirstclassName(plugin.ns, key);
			if (typeof prop === 'function') {
				$[firstclass] = function() {
					return $.pluginGlob(plugin.ns)[key].apply($.pluginGlob(plugin.ns), arguments);
				};
			} else {
				$[firstclass] = prop;
				plugin.glob[key] = function(value) {
					if (value === undefined) {
						return $[firstclass];
					}
					$[firstclass] = value;
				};
			}
		});
		
		$.each(plugin.pub, function(key, prop) {
			var firstclass = getFirstclassName(plugin.ns, key);
			if (typeof prop === 'function') {
				$.fn[firstclass] = function() {
					return this.pluginPub(plugin.ns)[key].apply(undefined, arguments);
				};
			} else {
				$.fn[firstclass] = prop;
				plugin.pub[key] = function(value) {
					if (value === undefined) {
						return $.fn[firstclass];
					}
					$.fn[firstclass] = value;
					return this;
				};
			}
		});
		
		$.each(plugin.priv, function(key, prop) {
			if (typeof prop !== 'function') {
				var valueKey = '__' + key;
				plugin.priv[valueKey] = prop;
				plugin.priv[key] = function(value) {
					if (value === undefined) {
						return $.pluginFactory[plugin.ns].priv[valueKey];
					}
					$.pluginFactory[plugin.ns].priv[valueKey] = value;
					return this;
				};
			}
		});
		
		$.pluginFactory[plugin.ns] = plugin;
		
	};
	
	$.pluginData = function(ns, elem, key, value, selector, cookiePersist) {
		
		if (elem !== undefined && !elem.nodeType) {
			return arguments.callee.call(this, ns, undefined, elem, key, value, selector);
		}
		
		var actions = $.jal.util.getSetOptionsArgs(key, value);
		if (actions.restArg !== undefined) {
			cookiePersist = selector;
			selector = actions.restArg;
		}
		
		if (selector !== undefined && typeof selector !== 'string') {
			cookiePersist = selector;
			selector = undefined;
		}
		
		selector = typeof selector === 'string' ? $.trim(selector) : '*';
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		var data;
		cookiePersist = false;	// Disabled cookies
		if (actions.set !== undefined) {
			
			data = $.pluginData[ns.compose()] = $.pluginData[ns.compose()] || {};
			$.each(actions.set, function(key, value) {
				data[key] = data[key] || {};
				data[key][selector] = value;
				if (cookiePersist === true || typeof cookiePersist === 'number') {
					// TODO: Pass cookiePersist numeric value to $.cookieSet as soon as it accepts cookie expiry.
					$.cookieSet([ns.compose(), key, selector], value);
				}
				
			});
			
		}
		
		data = $.extend({}, $.pluginData[ns.compose()]);
//		$.each($.cookieGet(), function() {
//			
//			if (this.key instanceof Array && this.key[0] === ns.compose()) {
//				var key = this.key[1], selector = this.key[2];
//				data[key] = $.extend({}, data[key]);
//				data[key][selector] = this.value;
//			}
//			
//		});
		
		var returnData = {};
		$.each(data, function(key, values) {
			
			if (actions.get !== undefined && actions.get !== key) {
				return true;
			}
			
			if ('*' in values) {
				returnData[key] = values['*'];
			}
			
			if (elem !== undefined) {
				$.each(values, function(selector, value) {
					if ($(elem).is(selector)) {
						returnData[key] = value;
						return false;
					}
				});
			}
			
		});
		
		return actions.get !== undefined ? returnData[actions.get] : returnData;
		
	};
	
	$.pluginRemoveData = function(ns, key, selector) {
		
		selector = typeof selector === 'string' ? $.trim(selector) : '*';
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		var nsKey = ns.compose();
		
		var data = $.pluginData;
		if (data[nsKey]) {
			if (data[nsKey][key]) {
				delete data[nsKey][key][selector];
				if ($.jal.util.isEmptyObject(data[nsKey][key])) {
					delete data[nsKey][key];
				}
			}
			if ($.jal.util.isEmptyObject(data[nsKey])) {
				delete data[nsKey];
			}
		}
		
//		$.each($.cookieGet(), function() {
//			if (this.key[0] === nsKey && this.key[1] === key && this.key[2] === selector) {
//				$.cookieRemove(this.key);
//			}
//		});
		
	};
	
	$.fn.pluginData = function(ns, key, value) {
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		var actions = $.jal.util.getSetOptionsArgs(key, value);
		
		if (actions.set !== undefined) {
			return this.jalData(ns.compose(), actions.set, true);
		}
		
		var data = this.jalData(ns.compose()) || {};
		if ($.metadata && !$.jal.util.isEmptyObject(this.metadata())) {
			$.each(this.metadata(), function(key, value) {
				data[key] = typeof value === 'string' ? unescape(value) : value;
			});
		}
		data = $.extend($.pluginData(ns, this.get(0)), data);
		
		return actions.get !== undefined ? data[actions.get] : data;
		
	};
	
	$.fn.pluginRemoveData = function(ns, key) {
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		return this.jalRemoveData(ns.compose(), key);
		
	};
	
	$.fn.pluginCache = function(ns, key, value, onObj) {
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		var nsCache;
		
		if (onObj === true) {
			
			nsCache = (this._pluginFactoryCache || {})[ns.compose()] || {};
			
			if (!(key in nsCache)) {
				
				nsCache = $.extend({}, nsCache);
				nsCache[key] = typeof value === 'function' ? value.call(this) : value;
				
				var cache = $.extend({}, this._pluginFactoryCache);
				cache[ns.compose()] = nsCache;
				this._pluginFactoryCache = cache;
				
			}
			
			return nsCache[key];
			
		}
		
		this.each(function() {
			
			var $cacheObj = $(this);
			
			nsCache = $cacheObj.pluginData(ns, '_cache') || {};
			
			if (!(key in nsCache)) {
				
				nsCache = $.extend({}, nsCache);
				nsCache[key] = typeof value === 'function' ? value.call(this) : value;
				$cacheObj.pluginData(ns, '_cache', nsCache);
				
			}
			
		});
		
		return (this.pluginData(ns, '_cache') || {})[key];
		
	};
	
	$.fn.pluginClearCache = function(ns) {
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		var cache = $.extend({}, this._pluginFactoryCache);
		delete cache[ns.compose()];
		this._pluginFactoryCache = cache;
		
		return this.pluginRemoveData(ns, '_cache');
		
	};
	
	$.pluginOptDefaults = function(ns, key, value) {
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		var actions = $.jal.util.getSetOptionsArgs(key, value);
		
		var defaults = $.extend($.pluginFactory[ns.base].optDefaults, actions.set);
		
		return actions.get !== undefined ? defaults[actions.get] : defaults;
		
	};
	
	$.pluginOpt = function(ns, key, value, noPersist) {
		
		if (ns instanceof Array && typeof ns[1] === 'object') {
			// If the second element in the ns array is an object, we assume it is an options object and a shortcut can
			// be taken.
			return ns[1];
		}
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		var actions = $.jal.util.getSetOptionsArgs(key, value);
		if (noPersist === undefined) {
			noPersist = actions.restArg;
		}
		
		if (actions.set !== undefined && noPersist !== true) {
			
			var update = {}
			$.each(actions.set, function(key, value) {
				if ($.pluginOptDefaults(ns, key) !== value) {
					var persistStore = $.pluginFactory[ns.base].optPersist;
					if ($.inArray(key, persistStore['global'] || []) !== -1) {
						$.pluginData(ns, key, value);
					}
					if ($.inArray(key, persistStore.session || []) !== -1) {
						$.pluginData(ns, key, value, true);
					}
					$.each(persistStore.hours || {}, function(hours, opts) {
						if ($.inArray(key, opts) !== -1) {
							$.pluginData(ns, key, value, hours);
						}
					});
				}
			});
			
		}
		
		var opt = $.extend({ns: ns}, $.pluginFactory[ns.base].optDefaults, $.pluginData(ns), actions.set);
		
		return actions.get !== undefined ? opt[actions.get] : opt;
		
	};
	
	$.fn.pluginOpt = function(ns, key, value, noPersist) {
		
		var $obj = this;
		
		if ($obj.size() === 0) {
			return;
		}
		
		if (ns instanceof Array && typeof ns[1] === 'object') {
			// If the second element in the ns array is an object, we assume it is an options object and a shortcut can
			// be taken.
			return ns[1];
		}
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		var actions = $.jal.util.getSetOptionsArgs(key, value);
		if (noPersist === undefined) {
			noPersist = actions.restArg;
		}
		
		if (actions.set !== undefined && noPersist !== true) {
			
			var update = {}
			$.each(actions.set, function(key, value) {
				if ($.pluginOptDefaults(ns, key) !== value && $.inArray(key, $.pluginFactory[ns.base].optPersist.element || []) !== -1) {
					update[key] = value;
				}
			});
			$obj.pluginData(ns, update);
			
			$.pluginOpt(ns, actions.set);
			
		}
		
		var opt = $.extend({ns: ns}, $.pluginFactory[ns.base].optDefaults, $obj.pluginData(ns), actions.set);
		
		return actions.get !== undefined ? opt[actions.get] : opt;
		
	};
	
	$.pluginGlob = function(ns) {
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		return $.pluginFactory[ns.base].glob;
		
	};
	
	$.fn.pluginPub = function(ns) {
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		return this.pluginCache(ns, 'pub', function() {
			return $.jal.util.changeScope($.pluginFactory[ns.base].pub, this);
		}, true);
		
	};
	
	$.fn.pluginPriv = function(ns) {
		
		ns = $.jal.util.decomposeNamespaced(ns, ':');
		
		return this.pluginCache(ns, 'priv', function() {
			return $.jal.util.changeScope($.pluginFactory[ns.base].priv, this);
		}, true);
		
	};
	
}(jQuery));

/*========================================================================================================== rix */
/*
 * TODO:
 * - Override styling of font[size="n"] elements with font-size declarations in
 *   px, so we can define our own scale (which can then also be reflected in a
 *   font size dropdown box for example). Tricky part is that the required style
 *   settings need to be both in config.pageStyle (for real-time behavior) and
 *   inline on the element as soon as the content leaves the editor. The place
 *   where this processing should probably be done is in outputHtml(). To keep
 *   things DRY we need a single point of definition, which should be used both
 *   for adjusting config.pageStyle and for applying inline style.
 * - We could probably -- although it is tricky -- detect any broken images in
 *   the content and trigger a warning event on submit. Alternative: provide a
 *   broken image count getter and a submit.rix event and leave interpretation
 *   up to the developer.
 * - Revise keyboard short-cuts: disable those that reflect functionality that
 *   we do not support. Also make them Mac-aware.
 */
(function($) {
	
	var NS = 'rix';
	
	if (!window.Xinha) {
		return;
	}
	
	// We add all CSS through config.pageStyle, no additional CSS desired.
	Xinha.addCoreCSS = function() {
		return '';
	};
	
	$.extend(Xinha.prototype, {
		
		// Disable Xinha specific resize 'magic'.
		sizeEditor: function() {},
		
		// Simpler implementation; assumes it is not called when it should not
		// be called (f.e. when the editor is not active).
		focusEditor: function() {
			($(this._textArea).rixGet('wysiwyg') ? this._iframe.contentWindow : this._textArea).focus();
		},
		
		// Our version does not crash when no control character is found in the
		// iframe content. Also it can be called without a target argument.
		// TODO: Only applies to Gecko
		_nativeFindCC: Xinha.prototype.findCC,
		findCC: function(target) {
			
			var editor = this;
			
			if (target === undefined) {
				target = $(this._textArea).rixGet('wysiwyg') ? 'iframe' : 'textarea';
			}
			
			if (target !== 'iframe') {
				return editor._nativeFindCC(target);
			}
			
			var $ccContainer;
			
			// This way of looking up Xinha.cc is rather slow, but it is very
			// safe -- it will only recognize Xinha.cc if setCC() did not mess
			// up, which is a scenario we should not exclude as we cannot
			// anticipate on the weird messy HTML that was put into the
			// textarea.
			if (editor._doc.body.innerHTML.indexOf(Xinha.cc) !== -1) {
				
				$ccContainer = $(editor._iframe).contents().find(':contains("' + Xinha.cc + '"):last');
				
				// TODO: Do some advanced positioning optimization similar to
				// the logic that is exposed in finding an ideal position in the
				// code block above. We want the cursor to be in leaf nodes, not
				// somewhere halfway a branch.
				
			} else {
				
				// Tries to find the first (depth-first) textNode which contains
				// more than whitespace. Else it will return the first
				// (depth-first) element leaf node.
				var findPos = function(node) {
						var leafText, leafElem;
						$(node.childNodes).each(function() {
							var branchLeaf = findPos(this);
							// The first textNode containing more than
							// whitespace is what we are ideally looking for.
							if (branchLeaf.nodeType === 3 && $.trim(branchLeaf.nodeValue)) {
								leafText = branchLeaf;
								return false;
							}
							// Also remember the first element leaf node that is
							// able to hold a textNode, so we can fallback to
							// it if we do not find a textNode.
							if (!leafElem && /^(a|span|b|strong|i|em|font|div|p)$/i.test(branchLeaf.tagName)) {
								leafElem = branchLeaf;
							}
						});
						return leafText || leafElem || node;
					},
					pos = findPos(editor._doc.body), $pos = $(pos);
				
				// Put in Xinha.cc ourselves.
				if (pos.nodeType === 3) {
					pos.nodeValue = Xinha.cc + pos.nodeValue;
					$ccContainer = $pos.parent();
				} else {
					$ccContainer = $pos;
					$ccContainer.text(Xinha.cc);
				}
				
			}
			
			var posElemId = 'XinhaEditingPosition';
			$ccContainer.html($ccContainer.html().replace(Xinha.cc, '<span id="' + posElemId + '"></span>'));
			// Just in case Xinha.cc occurs in more places, get rid of them.
			if (editor._doc.body.innerHTML.indexOf(Xinha.cc) !== -1) {
				editor._doc.body.innerHTML = editor._doc.body.innerHTML.replace(new RegExp(Xinha.cc, 'g'), '');
			}
			var posElem = $ccContainer.find('#' + posElemId).get(0);
			editor.selectNodeContents(posElem);
			
			// TODO: Scroll to cursor in a way that actually works.
			// editor.scrollToElement(posEl);
			posElem.parentNode.removeChild(posElem);
			
			// TODO: Do we want/need to set focus here?
			// this.focusEditor();
			
		},
		
		_nativeSetCC: Xinha.prototype.setCC,
		setCC: function(target) {
			
			var editor = this;
			
			if (target === undefined) {
				target = $(this._textArea).rixGet('wysiwyg') ? 'iframe' : 'textarea';
			}
			
			if (target !== 'textarea') {
				return editor._nativeSetCC(target);
			}
			
			var textarea = editor._textArea,
				cursorPos = textarea.selectionStart || 0,
				before = textarea.value.substring(0, cursorPos),
				after = textarea.value.substring(cursorPos);
			
			// Just in case Xinha.cc already occurs in the content, get rid of
			// all of them before putting in the one that is to represent cursor
			// position.
			textarea.value.replace(new RegExp(Xinha.cc, 'g'), '');
			
			// All that setCC is responsible for is making sure it does not put
			// the cursor in a position that is blatantly invalid, such as
			// a tag. Apart from that, all the intelligence in cursor
			// positioning is implemented in findCC(), as there we can work with
			// the DOM tree instead of merely raw HTML code.
			if (/^[^<]*>/.test(after)) {
				var tagEnd = after.indexOf('>') + 1;
				before += after.substring(0, tagEnd);
				after = after.substring(tagEnd);
			}
			
			textarea.value = before + Xinha.cc + after;
			
		}
		
	});
	
	$.extend(Xinha.getPluginConstructor('CreateLink').prototype, {
		onUpdateToolbar: function() {},
		prepareDialog: function() {},
		onGenerateOnce: function() {},
		dialog: {
			show: function(inputs) {
				this.url = inputs.f_href;
			},
			hide: function() {
				return {
					f_href: this.url,
					f_title: '',
					f_target: '',
					f_other_target: ''
				};
			}
		}
	});
	
	$.extend(Xinha.getPluginConstructor('InsertImage').prototype, {
		onUpdateToolbar: function() {},
		prepareDialog: function() {},
		onGenerateOnce: function() {},
		dialog: {
			show: function(inputs) {
				this.url = inputs.f_url;
			},
			hide: function() {
				return {
					f_url: this.url,
					f_alt: '',
					f_border: '',
					f_align: '',
					f_vert: '',
					f_horiz: '',
					f_width: '',
					f_height: ''
				};
			}
		}
	});
	
	// These functions can be viewed as complementary to inwardHtml() and
	// outwardHtml(). secureHtml() performs manipulation that is crucial before
	// we can safely do anything with it. outputHtml() is responsible for
	// delivering HTML that is appropriate for use outside this plugin.
	var secureHtml = function(html) {
			// TODO: Optimize these patterns (f.e. "< body>" should match).
			var htmlPattern = /<html(?:\s+[^>]*)?>([\w\W]*?)<\/html>/i,
				headPattern = /<head(?:\s+[^>]*)?>([\w\W]*?)<\/head>/i,
				bodyPattern = /<body(?:\s+[^>]*)?>([\w\W]*?)<\/body>/i,
				stylePattern = /<style(?:\s+[^>]*)?>([\w\W]*?)<\/style>/ig,
				match,
				content = [], style = [];
			
			match = bodyPattern.exec(html);
			if (match === null) {
				if (htmlPattern.test(html) || headPattern.test(html)) {
					return '';
				}
				return html;
			}
			content.push(match[1]);
			
			while (true) {
				match = stylePattern.exec(html);
				if (match === null) {
					break;
				}
				style.push(match[1]);
			}
			if (style.length > 0) {
				content.unshift('<style type="text/css">' + style.join('\n') + '</style>');
			}
			
			return content.join('\n');
		},
		outputHtml = function(html) {
			html = html.replace(Xinha.cc, '');
			return html;
		};
		// TODO: Implement margins condensation. (Do not override uncondensed
		// content, as we want to preserve editable content, and condensed
		// margins are irreversible.)
	
	// Reduces a supplied font name to a lowercase, unquoted and fallbackless
	// representation.
	var normalizeFontname = function(value) {
			if (typeof value === 'string') {
				value = $.trim(value.split(',')[0]).toLowerCase();
				var first = value.charAt(0), last = value.charAt(value.length - 1);
				if (first === "'" && last === "'" || first === '"' && last === '"') {
					value = value.substring(1, value.length - 1);
				}
			}
			return value;
		},
		// Tries to match the given value with one of the predefined options in
		// STATES. This is used every time we get a value from the outside (either
		// from the user or from the browser -- queryCommandValue) to ensure that we
		// work with consistent values internally.
		matchState = function(key, value) {
			var index;
			switch (key) {
				case 'fontname':
					if (!NORMALIZED_STATES.fontname) {
						NORMALIZED_STATES.fontname = [];
						$.each(STATES.fontname, function(i, value) {
							NORMALIZED_STATES.fontname.push(normalizeFontname(value));
						});
					}
					index = $.inArray(value === '' ? null : normalizeFontname(value), NORMALIZED_STATES.fontname);
					return index === -1 ? value : STATES.fontname[index];
					break;
				case 'fontsize':
					// Map any of the following keywords to corresponding size
					// numbers. Note: this is very hairy stuff, see:
					// 		http://style.cleverchimp.com/font_size_intervals/altintervals.html
					switch (value) {
						case 'xx-small':
							value = 1;
							break;
						case 'small':
							value = 2;
							break;
						case 'medium':
							value = 3;
							break;
						case 'large':
							value = 4;
							break;
						case 'x-large':
							value = 5;
							break;
						case 'xx-large':
							value = 6;
							break;
					}
					// We match fontsize in string format, because matching as
					// numbers would require doing parseInt(value), which might
					// result in undesirable behavior (such as '2em' ending up as
					// 2).
					index = $.inArray(
						typeof value === 'number' ? value.toString() : value,
						$.map(STATES.fontsize, function(size) {
							return size === null ? '' : size.toString();
						})
					);
					return index === -1 ? value : STATES.fontsize[index];
					break;
			}
			return value;
		};
	
	var EMPTY_FONTFAMILY = 'none',
		STATES = {
			fontname: [
				null,
				"Arial, Helvetica, sans-serif",
				"'Arial Black', Arial, Helvetica, sans-serif",
				"'Comic Sans MS', fantasy",
				"'Courier New', Courier, monospace",
				"Georgia, serif",
				"'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
				"'Times New Roman', Times, serif",
				"'Trebuchet MS', sans-serif",
				"Verdana, sans-serif"
			],
			fontsize: [null, 1, 2, 3, 4, 5, 6, 7]
		},
		// Used as a cache by matchState().
		NORMALIZED_STATES = {};
	
	$.pluginFactory({
		
		ns: NS,
		
		opt: {
			editorCss: [undefined, 'element'],
			templatetags: [{}, 'element'],
			defaults: [{
				fontname: STATES.fontname[1],
				fontsize: STATES.fontsize[3]
			}, 'element'],
			// Defines which style declarations should be preserved when
			// cleaning. Our default is targeted at maximum compatibility with
			// e-mail clients: only keep style declarations that are supported
			// by all major e-mail clients:
			// 		http://www.campaignmonitor.com/css/
			// line-height is not included because it is often not specifically
			// set by the author of the Word document, and causing a lot of
			// annoyance when resizing text.
			cleanKeepStyle: [[
				'font-family',
				'font-style',
				'font-variant',
				'font-size',
				'font-weight',
				'letter-spacing',
				'text-align',
				'text-decoration',
				'text-indent',
				'text-transform',
				'color',
				'background-color',
				'white-space',
				// Hotmail's issues with margins are either fixed or not so bad
				// that we want to exclude margin-*.
				'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
				'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
				'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
				'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
				'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
				'border-collapse',
				'table-layout'
			], 'element'],
			// TODO: Replace with an event (like clean.rix) as soon as we are
			// jQuery 1.3 compatible. (We need to be able to create an event
			// object using $.Event() in order to detect when preventDefault()
			// is called.)
			onClean: [undefined, 'element']
		},
		
		pub: {
			
			_: function(opt) {
				
				this.find('textarea').andSelf().filter('textarea').each(function() {
					
					var $textarea = $(this);
					
					$textarea.pluginOpt(NS, opt);
					
					$textarea.pluginData(NS, {
						onHidden: function() {
							
							var $textarea = $(this);
							
							$textarea.pluginPriv(NS).stopEditing();
							// When switching to an editor in wysiwyg mode, its
							// content is taken from textarea, so we always want
							// to leave the textarea in up-to-date state.
							if ($textarea.rixGet('wysiwyg')) {
								$textarea.pluginPriv(NS).syncTextarea();
							}
							
						},
						onDisplay: function(callback) {
							
							var $textarea = $(this),
								editor = $textarea.pluginData(NS, '_editor');
							
							if (editor) {
								
								$textarea.pluginPriv(NS).activate(function() {
									var mirror = $textarea.pluginData(NS, '_mirror') || {},
										mode = mirror.mode;
									delete mirror.mode;
									// If a mode has been specified that should
									// be mirrored, which is not already the
									// current state, the consequence is that we
									// need to do a mode switch.
									if (mode !== undefined && mode !== $textarea.rixGet('mode')) {
										// rixSet() calls startEditing(),
										// so no need to do that here.
										$textarea.rixSet('mode', mode, callback);
									} else {
										if ($textarea.rixGet('wysiwyg')) {
											// Edge case: If we switch to an
											// editor without using a mirror,
											// the implication is that we want
											// to work with the content that is
											// currently in the textarea. If the
											// editor has already been created,
											// we cannot assume that the iframe
											// content is up-to-date with the
											// textarea content, as the latter
											// may be changed (programmatically)
											// in the meantime. So, if the
											// editor is in wysiwyg mode we need
											// to synchronize the iframe
											// content.
											$textarea.pluginPriv(NS).syncIframe();
										}
										$textarea.pluginPriv(NS).startEditing();
										callback.call();
									}
								});
								
							} else {
								
								$textarea.pluginPriv(NS).createEditor(function() {
									$textarea.pluginPriv(NS).startEditing();
									callback.call();
								});
								
							}
							
							// End of function does not necessarily mean it is
							// done.
							return false;
							
						},
						onVisible: function(callback) {
							
							var $textarea = $(this),
								editor = $textarea.pluginData(NS, '_editor');
							
							// After an iframe's visibility has been changed to
							// visible, Gecko needs a timeout to get the nested
							// document ready, so it can be focused.
							setTimeout(function() {
								editor.focusEditor();
								callback.call();
							}, 0);
							
							// End of function does not necessarily mean it is
							// done.
							return false;
							
						}
					});
					
				});
				
				// TODO: Call handlers for elements that are currently
				// perceivable.
				
				return this;
				
			},
			
			// TODO: Require display
			// TODO: Only perform actions if they apply to current mode.
			_set: function(key, value, callback) {
				
				var actions = $.jal.util.setOptionsArgs(key, value);
				
				if (callback === undefined && typeof actions.restArg === 'function') {
					callback = actions.restArg;
				}
				
				return this.each(function() {
					
					var $textarea = $(this),
						editor = $textarea.pluginData(NS, '_editor');
					
					$textarea.
						pluginPriv(NS).holdStateChange().
						pluginPriv(NS).activate(function() {
							
							$.jal.util.iterate(actions.set, function(key, value) {
								
								var next = this;
								
								switch (key) {
									
									case 'content':
										$textarea.val(value);
										if ($textarea.rixGet('wysiwyg')) {
											$textarea.pluginPriv(NS).syncIframe();
										}
										break;
									
									case 'mode':
										if ($textarea.rixGet(key) === value) {
											return true;
										}
										if ($textarea.pluginData(NS, '_isModeSwitching') === true) {
											return true;
										}
										$textarea.pluginData(NS, '_isModeSwitching', true);
										var onReady = function() {
											editor.focusEditor();
											$textarea.pluginRemoveData(NS, '_isModeSwitching');
											next.call();
										};
										switch (value) {
											case 'html':
												$.jal.util.smoothHide(editor._iframe, function() {
													$textarea.pluginPriv(NS).stopEditing();
												});
												$.jal.util.smoothShow(editor._textArea, function() {
													$textarea.
														pluginPriv(NS).syncTextarea().
														pluginPriv(NS).setState(key, value).
														pluginPriv(NS).startEditing();
												}, onReady);
												break;
											case 'wysiwyg':
												$.jal.util.smoothHide(editor._textArea, function() {
													$textarea.pluginPriv(NS).stopEditing();
												});
												$.jal.util.smoothShow(editor._iframe, function(callback) {
													// After an iframe is
													// displayed, Gecko needs a
													// timeout to get the nested
													// document ready, so we can
													// work with selection.
													setTimeout(function() {
														$textarea.
															pluginPriv(NS).syncIframe().
															pluginPriv(NS).setState(key, value).
															pluginPriv(NS).startEditing();
														callback.call();
													}, 0);
													// Tell smoothShow() that
													// this handler runs
													// asynchronously.
													return false;
												}, function() {
													// After an iframe's
													// visibility has been
													// changed to visible, Gecko
													// needs a timeout to get
													// the nested document
													// ready, so it can be
													// focused.
													setTimeout(function() {
														onReady.call();
													}, 0);
												});
												break;
											default:
												$textarea.pluginRemoveData(NS, '_isModeSwitching');
												return true;
												break;
										}
										// Calling the next iteration has been
										// delegated to onReady(), so quit the
										// iterator at this point.
										return false;
										break;
									
									case 'bold':
									case 'italic':
									case 'underline':
									case 'strikethrough':
										if (value === undefined) {
											var state = $textarea.rixGet(key);
											value = state === undefined ? true : !state;
										}
									case 'justify':
										// None of these settings should be
										// repeated as they have an immediate
										// effect in the DOM, and will therefore
										// persist even when another editor is
										// activated.
										if ($textarea.rixGet(key) === value) {
											return true;
										}
										
										$textarea.pluginPriv(NS).cleanSelectionState(key);
										
										editor.execCommand(key === 'justify' ? key + value : key);
										break;
										
									case 'fontname':
									case 'fontsize':
										// TODO: Assume Gecko and the following
										// content:
										// 		h<span style="text-decoration: underline;">ell</span>o
										// with the last two letters ('lo')
										// selected. Setting underline to false
										// will not work, as the styling of the
										// span will remain intact. Can we solve
										// this without doing overly scary DOM
										// manipulation?
										
										$textarea.pluginPriv(NS).cleanSelectionState(key);
										
										value = matchState(key, value);
										if (value !== null) {
											editor.execCommand(key, undefined, value);
										}
										break;
									
									case 'orderedlist':
									case 'unorderedlist':
									case 'print':
										editor.config.btnList[key][3].call(window, editor);
										break;
									
									case 'link':
										var plugin = editor.plugins.CreateLink.instance;
										plugin.dialog.url = value;
										if (!plugin.a && editor.selectionEmpty(editor.getSelection())) {
											editor.insertHTML(value);
										}
										plugin.apply();
										break;
									
									case 'image':
										var plugin = editor.plugins.InsertImage.instance;
										plugin.dialog.url = value;
										plugin.apply();
										break;
									
									case 'collapseMargins':
										var state = $textarea.rixGet(key);
										if (value === undefined) {
											value = state === undefined ? true : !state;
										}
										if (state === value) {
											return true;
										}
										$textarea.
											pluginPriv(NS).toggleCss("\
												p {\
													margin: 0;\
												}\
											").
											pluginPriv(NS).setState(key, value);
										break;
									
									// TODO: Do not allow if cursor is situated
									// invalidly, f.e. inside a template tag.
									case 'templatetag':
										var fallback,
											title;
										if (value instanceof Array) {
											fallback = value[1];
											// Tag name is used if no title is
											// specified
											title = value[2] || value[0];
											value = value[0];
										}
										editor.insertHTML('<span class="' + key + ' ' + value + '">' + (Xinha.is_ie ? '<span class="variable">' + title.toUpperCase() + ' of </span>' : '') + fallback + '</span> ');
										editor.selectNodeContents(editor.getParentElement(), false);
										break;
									
								}
								
							}, function() {
								
								$textarea.pluginPriv(NS).commitStateChange();
								
								// Editor might be activated as a result of this
								// set action, so make sure focus is set.
								editor.focusEditor();
								
								if (typeof callback === 'function') {
									callback.call();
								}
								
							});
							
						});
						
				});
				
			},
			
			_get: function(key) {
				
				var $textarea = this.eq(0),
					editor = $textarea.pluginData(NS, '_editor');
				
				switch (key) {
					
					case 'contentAndCursor':
						if (editor && $textarea.rixGet('wysiwyg')) {
							return $textarea.pluginPriv(NS).getIframeContent();
						}
						return $textarea.val();
						break;
					
					case 'mode':
					case 'bold':
					case 'italic':
					case 'underline':
					case 'strikethrough':
					case 'justify':
					case 'fontname':
					case 'fontsize':
					case 'collapseMargins':
						return $textarea.pluginPriv(NS).getState(key);
						break;
						
					case 'link':
						if (editor) {
							var plugin = editor.plugins.CreateLink.instance;
							var anchor = plugin._getSelectedAnchor();
							plugin.show(anchor === null ? {tagName: 'bogus'} : anchor);
							if (plugin.a.tagName === 'bogus') {
								plugin.a = undefined;
							}
							return plugin.dialog.url;
						}
						break;
					
					case 'image':
						if (editor) {
							var plugin = editor.plugins.InsertImage.instance;
							plugin.show();
							return plugin.dialog.url;
						}
						break;
					
					// Meta-properties
					
					case 'content':
						return outputHtml($textarea.rixGet('contentAndCursor'));
						break;
					
					case 'wysiwyg':
						return $textarea.rixGet('mode') === 'wysiwyg';
						break;
					
				}
				
			},
			
			// TODO: Requires display
			_mirror: function($mirror) {
				
				return this.pluginData(NS, '_mirror', {
					content: $mirror.rixGet('contentAndCursor'),
					mode: $mirror.rixGet('mode'),
					collapseMargins: $mirror.rixGet('collapseMargins')
				});
				
			}
			
		},
		
		priv: {
			
			createEditor: function(callback) {
				
				var $textarea = this,
					opt = $textarea.pluginOpt(NS);
				
				var config = $.extend(new Xinha.Config(), {
					debug: false,
					statusBar: false,
					getHtmlMethod: 'TransformInnerHTML',
					mozParaHandler: 'built-in',
					browserQuirksMode: false,
					autofocus: -1,	// TODO: Explain
					pageStyleSheets: $.makeArray(opt.editorCss),
					pageStyle: "\
						body {\
							padding: .3em;\
							/* Hack: this value is not a valid font-family; we use it to detect when no font type is specified. */\
							font-family: " + EMPTY_FONTFAMILY + ";\
						}\
						/* This covers for all cases in which the first paragraph is situated five levels deep at maximum, which will probably suffice in 99% of the real-life scenarios. */\
						body > p:first-child,\
						body > *:first-child > p:first-child,\
						body > *:first-child > *:first-child > p:first-child,\
						body > *:first-child > *:first-child > *:first-child > p:first-child,\
						body > *:first-child > *:first-child > *:first-child > *:first-child > p:first-child {\
							margin-top: 0;\
						}\
						img {\
							-moz-force-broken-image-icon: 1;\
						}\
						span.templatetag {\
							padding-left: .3em;\
							padding-right: .3em;\
							background-color: lightgrey;\
						}\
						span.templatetag:before, span.templatetag span.variable, span.templatetag span.variable * {\
							font-family: Arial, sans-serif;\
							font-size: .6em;\
							font-variant: small-caps;\
							font-weight: normal;\
							font-style: normal;\
							color: #666;\
						}\
					",
					inwardHtml: function(html) {
						html = secureHtml(html);
						return html;
					},
					outwardHtml: function(html) {
						// Remove trailing br elements as they have no function
						// and can obfuscate whether content is empty or not.
						html = html.replace(/<br[^>]*>\s*$/i, '');
						return html;
					}
				});
				
				config.Events.onUpdateToolbar = function() {
					$(this._textArea).pluginPriv(NS).processStateChange();
				};
				
				// TODO: Try to catch actions that reset the font settings, such
				// as Enter at empty list item. Perhaps it is better to try to
				// achieve this based on mozParaHandler = best.
				// config.Events.onKeyPress = function(e) {
				// 	console.log(e.keyCode);
				// 	// Xinha._stopEvent(e);
				// };
				
				var editor = new Xinha($textarea.get(0), config),
					xinhaStates = {};
				
				$textarea.pluginData(NS, {
					_editor: editor,
					_nativeState: {},
					_collapseMarginsState: false
				});
				
				// Xinha needs an internal representation for native state
				// properties.
				$.each(['bold', 'italic', 'underline', 'strikethrough', 'justifyleft', 'justifycenter', 'justifyright', 'justifyfull', 'fontname', 'fontsize'], function(i, key) {
					editor._toolbarObjects[key] = {
						// Multiple choice state changes are reported by setting
						// element's selectedIndex.
						element: {selectedIndex: 0},
						// Boolean state changes are reported through this
						// function.
						state: function(type, value) {
							if (type === 'active') {
								$textarea.pluginPriv(NS).setState(key, value);
							}
						},
						swapImage: function() {}
					};
				});
				
				editor.registerPlugins(['Gecko', 'GetHtmlImplementation', 'CreateLink', 'InsertImage']);
				
				$textarea.
					attr('wrap', 'off').
					css({
						'overflow-x': 'auto',
						'overflow-y': 'auto',
						'font-family': 'monospace',
						resize: 'none'
					}).
					bind('paste', function() {
						$(this).pluginData(NS, '_pasted', true);
					});
				
				editor._iframe = $('<iframe frameborder="0"></iframe>').get(0);
				
				$.jal.util.changeStyle(editor._iframe, [
					'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
					'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
					'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
					'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
					'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
					'background-color'/*,
					'width', 'height'*/
				], editor._textArea);
				
				editor._iframe.style.display = 'none';
				
				$(editor._iframe).one('load', function() {
					
					editor.initIframe();
				
					$.each(opt.templatetags, function(tag, title) {
						$textarea.pluginPriv(NS).addCss("\
							span.templatetag." + tag + ":before {\
								content: '" + title.toUpperCase() + " of ';\
							}\
						");
					});
					
//					$(editor._textArea.ownerDocument.defaultView).smartBind('resize', function() {
//						$.jal.util.changeStyle(editor._iframe, ['width', 'height'], editor._textArea);
//					});
					
					// TODO: Handle reset (via onReset attribute).
					$textarea.parents('form:first').bind('submit', function() {
						// TODO: Undo changes to textarea.value if
						// preventDefault() is called.
						if ($textarea.rixGet('wysiwyg')) {
							$textarea.pluginPriv(NS).syncTextarea();
						}
						$textarea.val(outputHtml(secureHtml($textarea.val())));
					});
					
					// Find out in which state mode and collapseMargins should
					// be initially. We do not want to get to the desired state
					// by mode switching afterwards, as they have an impact on
					// the content.
					var mirror = $textarea.pluginData(NS, '_mirror') || {},
						initialMode = 'mode' in mirror ?
							mirror.mode :
							opt.defaults.mode,
						initialCollapseMargins = 'collapseMargins' in mirror ?
							mirror.collapseMargins :
							opt.defaults.collapseMargins;
					
					if (initialMode === undefined || initialMode === 'wysiwyg') {
						$textarea.pluginPriv(NS).syncIframe();
						editor._textArea.style.display = 'none';
						editor._iframe.style.display = '';
					}
					
					$textarea.
						pluginPriv(NS).holdStateChange().
						pluginPriv(NS).activate(function() {
							
							if (initialMode !== undefined) {
								$textarea.pluginPriv(NS).setState('mode', initialMode);
							}
							if (initialCollapseMargins !== undefined) {
								$textarea.rixSet('collapseMargins', initialCollapseMargins);
							}
							
							if (typeof callback === 'function') {
								callback.call(editor);
							}
							
						});
					
				});
				
				$textarea.after(editor._iframe);
				
				return this;
				
			},
			
			holdStateChange: function() {
				
				this.pluginData(NS, '_editor').suspendUpdateToolbar = true;
				
				return this;
				
			},
			
			commitStateChange: function() {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor');
				
				editor.suspendUpdateToolbar = false;
				
				if ($textarea.rixGet('wysiwyg')) {
					editor.updateToolbar();
				} else {
					$textarea.pluginPriv(NS).processStateChange();
				}
				
				return this;
				
			},
			
			processStateChange: function() {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor');
				
				if ($textarea.rixGet('wysiwyg')) {
					
					// For some attributes we want to override any conclusions
					// that Xinha came up with, as they are not intelligent
					// enough.
					$.each(['fontname', 'fontsize'], function(i, key) {
						$textarea.pluginPriv(NS).setState(key, $textarea.pluginPriv(NS).getSelectionState(key));
					});
					
				}
				
				var pending = $textarea.pluginData(NS, '_pending');
				if (pending !== undefined) {
					// TODO: Replace with a namespaced event (change.rix) as
					// soon as we are jQuery 1.3 compatible.
					$textarea.trigger('statechange', pending);
					$textarea.pluginRemoveData(NS, '_pending');
				}
				
				return this;
				
			},
			
			setState: function(key, value) {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor'),
					set = {};
				
				$.each($.jal.util.setOptionsArgs(key, value).set, function(key, value) {
					
					if (key.length > 7 && key.substr(0, 7) === 'justify') {
						if (value !== true) {
							return true;
						}
						value = key.substr(7);
						key = 'justify';
					}
					
					if (key === 'fontname' || key === 'fontsize') {
						value = matchState(key, value);
					}
					
					if ($textarea.pluginPriv(NS).getState(key) !== value) {
						set[key] = value;
					}
					
				});
				
				// TODO: $.extend() ignores properties with value undefined. Fix
				// this, or make sure we never ever need to accept undefined as
				// a value.
				var pending = $.extend($textarea.pluginData(NS, '_pending'), set);
				
				// Clean policy: make sure pending is always either non-existent
				// or non-empty.
				if (!$.jal.util.isEmptyObject(pending)) {
					$textarea.pluginData(NS, '_pending', pending);
				}
				
				if ('mode' in set) {
					editor._editMode = set.mode === 'wysiwyg' ? 'wysiwyg' : 'textmode';
					delete set.mode;
				}
				
				if ('collapseMargins' in set) {
					$textarea.pluginData(NS, '_collapseMarginsState', set.collapseMargins);
					delete set.collapseMargins;
				}
				
				$.extend($textarea.pluginData(NS, '_nativeState'), set);
				
				return this;
				
			},
			
			getState: function(key) {
				
				var $textarea = this;
				
				if (key === 'mode') {
					var editor = $textarea.pluginData(NS, '_editor');
					return !editor ?
						undefined :
						editor._editMode === 'wysiwyg' ?
							'wysiwyg' :
							'html';
				}
				
				if (key === 'collapseMargins') {
					return $textarea.pluginData(NS, '_collapseMarginsState');
				}
				
				var state = $textarea.pluginData(NS, '_nativeState');
				return state[key];
				
			},
			
			// Returns 'raw' state values, i.e. empty string in case no font
			// type is found, 'xx-small' if font size is specified likewise,
			// etc..
			getSelectionState: function(key) {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor'),
					styleName, tagName, attrName, emptyValue;
				
				switch (key) {
					case 'fontname':
						styleName = 'fontFamily';
						tagName = 'font';
						attrName = 'face';
						emptyValue = EMPTY_FONTFAMILY;
						break;
					case 'fontsize':
						styleName = 'fontSize';
						tagName = 'font';
						attrName = 'size';
						break;
					default:
						return;
						break;
				}
				
				var selection = editor.getSelection();
				
				if (!selection) {
					return '';
				}
				
				var range = selection.getRangeAt(0),
					left = range.startContainer,
					right = range.endContainer,
					cursor = left,
					next,
					leafs = [],
					states = [],
					result;
				
				// If we do not have a true selection, but merely a cursor, the
				// value that is reported by the browser should be dominant, as
				// it might be a value that was just set, and therefore -- not
				// having affected any content yet -- not part of the DOM yet.
				if (editor.selectionEmpty(selection)) {
					result = $.trim(editor._doc.queryCommandValue(key));
				}
				
				if (!result) {
					
					while (cursor) {
						// The states we are interested in only apply to textNodes.
						if (cursor.nodeType === 3) {
							// If we are dealing with an actual selection, exclude
							// leaf nodes of which none of their actual content is
							// part of the selection.
							if (editor.selectionEmpty(selection) || (cursor !== left || range.startOffset !== cursor.nodeValue.length) && (cursor !== right || range.endOffset !== 0)) {
								leafs.push(cursor);
							}
						}
						// Find next node.
						// Children of a node that is within the edges are always
						// within the edges as well, so try them first no matter
						// what.
						next = cursor.firstChild;
						// If cursorNode has no children, try a sibling or an
						// ancestor's sibling. Stop as soon as we come across the
						// right edge.
						while (!next) {
							if (cursor === right) {
								break;
							}
							next = cursor.nextSibling;
							cursor = cursor.parentNode;
						}
						cursor = next;
					}
					
					$.each(leafs, function() {
						var state;
						$(this).parents().each(function() {
							// Try style first, as it is the dominant force.
							state = $.trim(this.style[styleName] || $(this).filter(tagName + '[' + attrName + ']').attr(attrName));
							if (state) {
								return false;
							}
						});
						// Make sure 'no value' is always represented as empty
						// string, as that is native behavior.
						if (!state || state === emptyValue) {
							state = '';
						}
						if ($.inArray(state, states) === -1) {
							states.push(state);
						}
					});
					
					result = states.length === 0 ?
						'' :
						states.length === 1 ?
							states[0] :
							states;
					
				}
				
				if (!result) {
					result = $.trim(editor._doc.queryCommandValue(key));
				}
				
				return (!result || result === emptyValue) ? '' : result;
				
			},
			
			cleanSelectionState: function(key) {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor'),
					styleName, tagName, attrName;
				
				switch (key) {
					case 'fontname':
						styleName = 'fontFamily';
						tagName = 'font';
						attrName = 'face';
						break;
					case 'fontsize':
						styleName = 'fontSize';
						tagName = 'font';
						attrName = 'size';
						break;
					case 'justify':
						styleName = 'justify';
						tagName = '*';
						attrName = 'align';
						break;
					// TODO: Add more.
					default:
						return;
						break;
				}
				
				var selection = editor.getSelection();
				
				if (!selection || editor.selectionEmpty(selection)) {
					return this;
				}
				
				var range = selection.getRangeAt(0),
					root = range.commonAncestorContainer,
					left = range.startContainer,
					right = range.endContainer,
					includeLeft = left.nodeType !== 3 || $.trim(left.nodeValue) === $.trim(left.nodeValue.substr(range.startOffset)),
					includeRight = right.nodeType !== 3 || $.trim(right.nodeValue) === $.trim(right.nodeValue.substr(0, range.endOffset)),
					cursor = left, $cursor,
					next;
				
				while (cursor) {
					next = cursor.firstChild;
					while (!next && cursor !== root.parentNode) {
						if (cursor === left.parentNode) {
							if (left !== cursor.firstChild) {
								includeLeft = false;
							}
							left = cursor;
						}
						if (cursor === right.parentNode) {
							if (right !== cursor.lastChild) {
								includeRight = false;
							}
							right = cursor;
						}
						if ((cursor !== left || includeLeft) && (cursor !== right || includeRight)) {
							if (cursor.nodeType === 1 && cursor !== editor._doc.body) {
								cursor.style[styleName] = '';
								if (attrName) {
									$cursor = $(cursor);
									if ($cursor.is(tagName)) {
										$cursor.removeAttr(attrName);
									}
								}
								// TODO: If no attrName specified, pull out the
								// entire node: remove cursor if cursor matches
								// tagName, and if cursor === left update left
								// and includeLeft (and same with right).
							}
						}
						if (cursor !== right) {
							next = cursor.nextSibling;
						}
						cursor = cursor.parentNode;
					}
					cursor = next;
				}
				
				return this;
				
			},
			
			activate: function(callback) {
				
				var $textarea = this.eq(0),
					editor = $textarea.pluginData(NS, '_editor');
				
				callback = typeof callback === 'function' ? callback : function() {};
				
				if (Xinha._currentlyActiveEditor !== editor) {
					setTimeout(function() {
						editor.activateEditor();
						callback.call(editor);
					}, 0);
				} else {
					callback.call(editor);
				}
				
				return this;
				
			},
			
			startEditing: function() {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor'),
					mirror = $textarea.pluginData(NS, '_mirror'),
					defaults;
				
				// TODO: activateEditor (necessary?)
				
				if (mirror) {
					
					$textarea.rixSet({
						content: mirror.content,
						collapseMargins: mirror.collapseMargins
					});
					delete mirror.content;
					
					defaults = mirror;
					
				} else {
					
					defaults = $.extend({}, $textarea.pluginOpt(NS, 'defaults'));
					delete defaults.mode;
					
				}
				delete defaults.collapseMargins;
				
				editor.findCC();
				
				if ($textarea.rixGet('wysiwyg') && $textarea.rixGet('content') === '') {
					// rixSet() commits state change, so no need to do that
					// here.
					$textarea.rixSet(defaults);
				} else {
					$textarea.pluginPriv(NS).commitStateChange();
				}
				
				$textarea.pluginRemoveData(NS, '_mirror');
				
				return this;
				
			},
			
			stopEditing: function() {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor');
				
				$textarea.pluginPriv(NS).holdStateChange();
				
				// TODO: deactivateEditor (necessary? think about stopping editing and then not starting editing again)
				
				editor.setCC();
				
				$textarea.pluginData(NS, '_nativeState', {});
				
				return this;
				
			},
			
			getIframeContent: function() {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor');
				
				return $.trim(editor.outwardHtml(Xinha.getHTML(editor._doc.body, false, editor)));
				
			},
			
			syncIframe: function() {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor'),
					opt = $textarea.pluginOpt(NS),
					clean = $textarea.pluginData(NS, '_pasted') === true && typeof opt.onClean === 'function' && opt.onClean.call(this) === true,
					html = editor.inwardHtml($textarea.val());
				
				$textarea.pluginRemoveData(NS, '_pasted');
				
				// Cleaning operations on the raw HTML code.
				if (clean) {
					
					// Remove all conditional comments and their contents.
					html = html.replace(/<!--\s*\[\s*if\s*(([gl]te?|!)\s*)?(IE|mso|vml)\s*(\d+(\.\d+)?\s*)?\][\w\W]*?\[\s*endif\s*\]\s*-->/ig, '');
					
				}
				
				editor._doc.body.innerHTML = html;
				
				// Cleaning operations on the in-place DOM.
				if (clean) {
					
					var remove = [],
						newClasses = [],
						newStyle = [],
						clean = function(node, ignoreRoot) {
							var $node = $(node);
							
							if (ignoreRoot !== true && node.nodeType === 1) {
								
								// Remove weird Word tags, but keep their
								// children, as its contents could be meaningful
								// (f.e. &nbsp; inside a paragraph).
								if (node.tagName.indexOf(':') !== -1) {
									remove.push({elem: node, cascade: false});
									return;
								}
								
								// Remove any of the following elements.
								if (
									/^(link|style|meta)$/i.test(node.tagName) ||
									/^(a|span|b|strong|i|em|font|div|p)$/i.test(node.tagName) && !node.firstChild
								) {
									remove.push({elem: node, cascade: true});
									return;
								}
								
								var cleanClasses = [];
								newClasses.push({elem: node, classes: cleanClasses});
								$.each(node.className.split(/\s+/), function(i, className) {
									className = $.trim(className);
									if (className.substr(0, 3).toLowerCase() !== 'mso') {
										cleanClasses.push(className);
									}
								});
								
								// Store styling that we want to preserve. We
								// do not want to set to the node yet, as we are
								// only interested in declarations that have
								// non-default values (i.e. declarations that
								// are denoted in style sheets or inline).
								var pseudoElem = {style: {}};
								newStyle.push({elem: node, styleElem: pseudoElem});
								$.jal.util.changeStyle(pseudoElem, opt.cleanKeepStyle, node);
								
							}
							
							$node.children().each(function() {
								clean(this);
							});
							
						};
					
					clean(editor._doc.body, true);
					
					var i, obj, parent;
					for (i = 0; i < remove.length; i++) {
						obj = remove[i];
						parent = obj.elem.parentNode;
						// Should the element be pulled, or can we simply ditch
						// the entire tree from this element down?
						if (obj.cascade) {
							$(obj.elem).remove();
						} else {
							$(obj.elem).replaceWith(obj.elem.childNodes);
						}
						// If removal of this node has resulted in another empty
						// node, add this to the to-remove-list.
						if (parent && parent !== editor._doc.body && !parent.firstChild) {
							remove.push({elem: parent, cascade: true});
						}
					}
					
					// All styling that we are interested in is preserved, so we
					// can safely clean up the classes...
					$.each(newClasses, function(i, obj) {
						if (obj.classes.length === 0) {
							$(obj.elem).removeAttr('className');
							return true;
						}
						obj.elem.className = obj.classes.join(' ');
					});
					// ... and the inline styling.
					$.each(newStyle, function(i, obj) {
						obj.elem.style.cssText = '';
					});
					
					// All styling is removed now, so we can compare current
					// (default) styling with the stored declarations and find
					// out which declarations need to be set to the element.
					$.each(newStyle, function(i, obj) {
						var defaultStyle = {style: {}};
						$.jal.util.changeStyle(defaultStyle, opt.cleanKeepStyle, obj.elem);
						$.each(defaultStyle.style, function(key, value) {
							if (obj.styleElem.style[key] === value) {
								delete obj.styleElem.style[key];
							}
						});
					});
					
					// Actually putting the styling in place can only be done
					// when all declarations that have to be set are collected.
					// Setting styling earlier might influence default style
					// of other elements (f.e. through inheritance).
					$.each(newStyle, function(i, obj) {
						// Word tends to quote font name keywords, which can
						// cause problems. (We encountered a case in which GMail
						// omitted the entire font-family declaration on an
						// element if it contained "sans-serif".)
						if ('fontFamily' in obj.styleElem.style) {
							var fonts = [];
							$.each(obj.styleElem.style.fontFamily.split(','), function(i, font) {
								var normalized = normalizeFontname(font);
								if ($.inArray(normalized, ['serif', 'sans-serif', 'cursive', 'fantasy', 'monospace']) !== -1) {
									font = normalized;
								}
								fonts.push(font);
							});
							obj.styleElem.style.fontFamily = fonts.join(', ');
						}
						// Set style to element.
						$.jal.util.changeStyle(obj.elem, obj.styleElem.style);
					});
					
				}
				
				// Pull back the content from the iframe, as we want
				// textarea.value to be as up-to-date as possible. It is
				// possible that the value gets cached by the browser in some
				// way (f.e. as result of a soft refresh).
				$textarea.pluginPriv(NS).syncTextarea();
				
				return this;
				
			},
			
			syncTextarea: function() {
				
				return this.val(this.pluginPriv(NS).getIframeContent());
				
			},
			
			toggleCss: function(css, set) {
				
				var $textarea = this,
					editor = $textarea.pluginData(NS, '_editor');
				
				if (Xinha.is_ie) {
					css = '<STYLE type=text/css>' + css + '</STYLE>';
				}
				var $container = $(editor._iframe).contents().find(Xinha.is_ie ? 'head' : 'style');
				if (set !== false && $container.html().indexOf(css) === -1) {
					$container.html($container.html() + css);
				} else if (set !== true && $container.html().indexOf(css) !== -1) {
					$container.html($container.html().replace(css, ''));
				}
				
				return this;
				
			},
			
			addCss: function(css) {
				return this.pluginPriv(NS).toggleCss(css, true);
			},
			
			removeCss: function(css) {
				return this.pluginPriv(NS).toggleCss(css, false);
			}
			
		}
		
	});

}(jQuery));

