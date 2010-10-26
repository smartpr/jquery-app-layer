(function($) {

$.route = function(action) {
	if (action === 'get') {
		return $(window).fetch('route', 'match');
	}
	
	var routes = $.makeArray(arguments);
	
	var map = function() {
		var $this = $(this),
			hash = location.hash,
			oldMatch = $this.fetch('route', 'match'),	// TODO: Use $.fetch(?)
			newMatch;
		
		if (hash.length > 0 && hash[0] === '#') {
			hash = hash.substr(1);
		}
		
		for (var i = 0, l = routes.length, route, match; i < l; i++) {
			route = routes[i];
			match = route.pattern.exec(hash);
			if (match !== null) {
				newMatch = {
					route: route,
					params: match.slice(1)
				};
				break;
			}
		}
		
		var eventData = {};
		if (oldMatch) {
			eventData.from = oldMatch;
			$this.del('route', 'match');
		}
		if (newMatch) {
			eventData.to = newMatch;
			$this.store('route', 'match', newMatch);
		}
		$this.trigger('routechange', eventData);
		
	};
	
	$(window).bind('hashchange', map);
	
	map();
	
};

}(jQuery));


(function($) {

// TODO: Introduce statechange event which supplies both leaving and entering
// state as data.

// TODO: supersimplify:
//	- rename to something with 'hash'
//	- no more block employments
//	- exactly one route matches (or none)

var base = {
	// Unnamed routes are non-final routes.
	name: null,
	// A pattern that matches nothing effectively disables a route.
	pattern: /$./,
	employ: []
};

$.state_hash = function() {
	var routes = $.makeArray(arguments);
	
	// Create route definitions based on supplied arguments.
	for (var i = 0, l = routes.length, route; i < l; i++) {
		route = routes[i] = $.extend({}, base, routes[i]);
		if (typeof route.pattern === 'string') {
			route.pattern = new RegExp(route.pattern);
		}
		route.employ = $(route.employ).get();
	}
	
	$(window).bind('hashchange', function() {
		var $this = $(this),
			uri = location.hash,
			oldState = $this.fetch('state', 'current'),	// TODO: Use $.fetch(?)
			newState;	// TODO: Rename to state (in line with naming in
						// employ)
		
		if (uri.length > 0 && uri[0] === '#') {
			uri = uri.substr(1);
		}
		
		// Construct new state definition from matching route definitions.
		for (var i = 0, l = routes.length, route, match, matches = []; i < l; i++) {
			route = routes[i];
			match = route.pattern.exec(uri);
			if (match === null) {
				continue;
			}
			matches.push({
				route: route,
				params: match.slice(1)
			});
			if (typeof route.name === 'string') {
				// Final route found; state definition complete.
				newState = matches;
				break;
			}
		}
		
		if (oldState) {
			for (var i = 0, l = oldState.length, elements = []; i < l; i++) {
				$.merge(elements, oldState[i].route.employ);
			}
			$(elements).employ(false, oldState[oldState.length - 1].route.name);
			$this.del('state', 'current');
		}
		
		if (newState) {
			$this.store('state', 'current', newState);
			for (var i = 0, l = newState.length, elements = []; i < l; i++) {
				$.merge(elements, newState[i].route.employ);
			}
			$(elements).employ(true, newState[newState.length - 1].route.name);
		}
		
	});
	
};

}(jQuery));






/* APPLICABILITY:
	basic rule of thumb: if you want a state to be part of browser history, model
	it using this plugin. (and then it's automatically permalinkable.)
	
	*/

/* possible scenario's for a content block, when going from current to new state

// block that is not part of current but part of new state:
// show & if state is different from last time block was active; change state
visibility=hidden
display=block
handle visible
	(stateleave
	stateenter)
handle perceivable
	visibility=visible

// block that is part of current but not part of new state:
hide

// block that is part of both states:
// change state (and do smoothhide and smoothshow to hide the process of dom changing,
// but that's not something the user should care about)
visibility=hidden
handle unperceivable
	stateleave
	[display=none		// this is not necessary, and undesirable if we want to allow users
	display=block]		// to engage with visible and hidden events (which could be useful for disabling polling f.e.)
	handle visible
		stateenter
	handle perceivable
		visibility=visible	

*/

/* idea: also triggers stateenter and stateleave on the window */

/* idea: resolves any state uris in <a href="state:tweets" ...>
occurences in the dom at document.ready (or at $.state.define?) */

/* provide navigation functions:
	- $.state.go('tweets', 'timmolendijk') or  $.state.go.tweets('timmolendijk')  or  $.state.go('state:tweets(timmolendijk)')
	- $.state.replace ... like go but replace item in history (is this useful??) ... we could call it 'redirect' ?
	- $.state.back()
	- $.state.forward()

/* question: how do html-anchors blend in and behave with this system? */

/* question: we need to add a way to define start-state ...
also, we need consistency and as it looks like there is no way to completely get rid of a hash
in the url as soon as you started using one (you can only get back to '#'), i'd say we want
to always do a redirect: to a specified start-state, or else to '#' */

/* problem: if we want to support anything else than raw state uris ...
like f.e. state:tweets(timmolendijk) or $.state.go('tweets', 'timmolendijk'),
we need to stop using regex patterns but move to custom (reversible) patterns instead.
which suck
or try an attempt at building a reversing algorithm... which is hard and will never be perfect
but it's probably our best option (as it can be postponed to some undetermined moment in the future */

/* API sugar idea:
		// TODO: Define stateenter and stateleave as special events via
		//       $.event.special to enable binding 'stateenter.*' and
		//       'stateleave.*' as nicer ways of denoting 'stateenter._' and
		//       'stateleave._'.
*/

/* API sugar idea:
support sinatra pattern syntax (translate to regexp internally)
*/

/* idea: allow for a 'reload' state, which defines a pattern that results in reloading the previous
	state in history */

/* define states:

$.state(
	// define a start state (how to call this? start, init, empty??)
	$.state.start('tweets(timmolendijk)'), // or ('tweets', 'timmolendijk') or ('state:tweets(timmolendijk)')
	// keeps looking for more matches
	// does not trigger dedicated events
	{
		pattern: '^/',
		elements: '#nav',
	},
	// actual state: match means destination has been found => don't look further
	// triggers dedicated events
	{
		state: 'tweetsoverview',
		pattern: '^/tweets/overview$',
		elements: '#overview, #tags, #basket'
	},
	// actual state, triggers dedicated events
	// is not reached in case of '/tweets/overview'
	{
		state: 'tweets',
		pattern: '^/tweets/(\w+)$',
		elements: '#contacts, #tags, #basket'
	},
	// actual state, triggers dedicated events
	// does not tolerate other matches, any others found so far are cancelled
	{
		state: 'ad',
		pattern: '^/ad$',
		elements: '#screenfiller',
		singleton: true
	},
	// actual state, triggers dedicated events
	// singleton not necessary, as we haven't defined non-final states
	// in this layer
	// operates in another layer than the default layer, which means that
	// elements that are in the default layer (and all layers other than 'layername')
	// are not hidden (and they won't be notified about state change either, but
	// that is already intrinsic to how the state system works)
	{
		state: 'subscribe',
		pattern: '^/subscribe$',
		elements: '#dialog',
		layer: 'layername'
	},
	// an alternative approach is to work with 'direct' controller functions,
	// which may be more familiar to many people and works fine in simple setups.
	// this can be mixed with defining elements
	// one thing that may be confusing though: enter and leave are called when
	// the events on window are triggered... which can be very different from
	// when events on elements are triggered.
	// question: maybe we should use different names for the events on the
	// elements, to communicate the fact that they are different from the events
	// on the window. something like stategain and statelose oid... then again,
	// it's really the same message, just on another level / from another viewpoint.
	{
		state: 'author',
		pattern: '^/about/(\w+)$',
		enter: function(author) {
			// create/show element(s) about supplied author
		},
		leave: function(author) {
			// delete/hide element(s) about supplied author
			// add author to list of visited bios (or whatever)
		}
	}
	// pre-defined state (state: '404', pattern: '', singleton: true)
	// defaults can be overridden
	$.state.404({
		elements: '#error-404',
		singleton: false
	}
);

// Conclusion: a state definition has the following signature with corresponding defaults:
{
	state: null,
	pattern: null,	// can be /pat\/tern/ig or 'pat\/tern' or 'pat/tern'
	elements: [],	// can be 'selector' or [elem1, elem2] or elem or $jQueryObj
	singleton: false,	// can't we think of a better name for this one?
	layer: 'base',
	enter: $.noop,
	leave: $.noop
}

// A couple of useful pre-defined states (alterations of the defaults) (with overridable options):
$.state.404 = {
	state: '404',
	pattern: '',
	singleton: true
}
$.state.overlay = {
	layer: 'overlay'
}
$.state.start = {
	pattern: '^$',
	enter: function() {
		$.state.redirect(*args);
	}
}


// Or... we could go with a design like this:
$.state.partial('^/', '#nav', {...});
$.state.finite('tweets', '^/tweets/(\w+)$', '#contacts, #tags, #basket', {...})
$.state.404('#error-404', {...});
// ... ehrm... nope don't think that makes things better
// perhaps leaving out partial and finite and using shorthand just for pre-defined states?


// This is how you would/could work with element-level state changes.

$('#nav').bind({
	stateenter: function(e) {
		// set tab selection based on e.data.state
	},
	stateleave: function(e) {
		// unset tab selection based on e.data.state
	}
});






//====================== OLD STUFF BELOW ====================================

// idea: we could also opt for a design where we handle 'stateenter.name'
// with 'name' being the name of the state that we enter.
// does this work? are only the right namespaced handlers called?
//		answer: yes!
//		additional idea: trigger both non-namespaced and namespaced events
// todo: define $.event.special.stateenter & $.event.special.stateleave
$('#contacts').bind({
	stateenter: function(e) {
		// e.type === 'enterstate';
		// e.data === {state: 'name', args: ['timmolendijk']};
		if (e.data.state === 'name') {
			// init ul.lazyloadable using args
		}
		// e.data.callback() or callback(), but only if all (async) stuff is done
	},
	stateleave: ...
});
	

var r = /^#\/contacts\/(\w+)$/,
	controller = function(user) {
		$('#contacts').show().
			find('> ul').lazyloadable({
				load: function(callback) {
					var $this = this;
					$.getJSON('http://twitter.com/statuses/user_timeline/timmolendijk.json?count=100&callback=?', function(data) {
						callback($this.flirt(data, false));
					});
				}
			});
	};
*/
// START ROUTING/PAGES ---> move to widget/plugin
/*
	$.route({
		'routename': ['regex', '#nav, #contacts, ...'],
		...
	});
	
	$.routeUri('routename', args...) ===> '#/<parsed regex>'
	
	HOW TO DEAL WITH ARGS??
*/
/*
var enable = function() {
	var parts = Array.prototype.slice.call(arguments);
	// TODO: Loop elements because perceivable cannot handle
	// multiple elements at once yet.
	$(parts.join(', ')).each(function() {
		$(this).show();
	});
};

route('#').bind(function() {
	$('#error-404').flirt({url: window.routes.args.path});
	enable('#nav', '#error-404');
});
route('#/contacts').bind(function() {
	enable('#nav', '#tags', '#basket', '#contacts');
});
route('#/dpl').bind(function() {
	enable('#nav', '#basket', '#dpl-lists');
});

$(window).bind('hashchange', function(e) {
	$('body > div').css('display', '');
//					route(location.hash).run();
	
	if (r.test(location.hash)) {
		location.hash.replace(r, function() {
			controller.apply(this, Array.prototype.slice.call(arguments, 1, arguments.length - 2));
		});
	}
	
});

// END ROUTING/PAGES
*/


(function($) {

var ns = 'state_old',
	definition = {
		// Unnamed states are non-final states.
		name: null,
		// A pattern that matches nothing effectively disables a state.
		pattern: /$./,
		elements: [],
		enter: $.noop,
		leave: $.noop
	},
	$trigger = function(type, states, flexicallback) {
		var e = {states: states, callback: flexicallback},
			l = states.length,
			named = states[l - 1],
			args = [named.state.name];
		for (var i = 0; i < l; i++) {
			$.merge(args, states[i].params);
		}
		this.
			trigger($.extend({type: type + '._'}, e), args).
			trigger($.extend({type: type + '.' + named.state.name}, e), args);
	};

$[ns] = function() {
	// TODO: Exit if states are yet defined, perhaps switch to alternate
	//       behavior (getter?)
	var states = Array.prototype.slice.call(arguments);
	
	// Create condensed state definitions based on supplied arguments.
	// TODO: Validate characters in name as it should be a valid event namespace
	//       and not conflicting with the identifier for 'any namespace': '_'. 
	for (var i = 0, l = states.length, state; i < l; i++) {
		state = states[i] = $.extend({}, definition, states[i]);
		if (typeof state.pattern === 'string') {
			state.pattern = new RegExp(state.pattern);
		}
		state.elements = $(state.elements).get();
	}
	
	$(window).bind('hashchange', function() {
		var $this = $(this),
			uri = location.hash,
			matches = [],
			i, l, state, match;
		
		if (uri.length > 0 && uri[0] === '#') {
			uri = uri.substr(1);
		}
		
		// Collect matching state definitions.
		for (i = 0, l = states.length; i < l; i++) {
			state = states[i];
			match = state.pattern.exec(uri);
			if (match === null) {
				continue;
			}
			matches.push({
				state: state,
				params: match.slice(1)
			});
			if (state.name && typeof state.name === 'string') {
				break;
			}
		}
		
		// SCENARIOS:
		// 0. page is loaded
		// 1. state x with block1 & block2 is entered; block1 is perceivable, block2 is hidden
		// 2. state y(a) with block2 & block3 is entered; block3 is visible yet unperceivable
		// 3. state y(b) is entered
		// 4. state z with block4 is entered
		// 5. state x is entered
		
		// CHANGE TO matches:
		
		// window.bindone:
		//		stateleave:
		//			for match in current:
		//				match.state.leave
		//		stateenter:
		//			for match in matches:
		//				match.state.enter
		//		stateready:
		//			for match in matches:
		//				match.state.ready
		// TODO: move to element loop?
		// window.queue:
		//		if current:
		//			stateleave
		//		stateenter
		//		stateready
		// TODO: use $.fetch
		var current = $this.fetch(ns, 'current');
		$this.
			flexiqueue(ns, [function(flexicallback) {
				if (current) {
					$(this).chain($trigger, 'stateleave', current, flexicallback);
				}
			}, function(flexicallback) {
				if (matches.length > 0) {
					$(this).chain($trigger, 'stateenter', matches, flexicallback);
				}
			}/*, function(flexicallback) {
				// TODO: Wasn't the idea behind stateready that it would only
				// be triggered when all blocks are ready too?
				$(this).chain($trigger, 'stateready', matches, flexicallback);
			}*/]).
			dequeue(ns);
		
		var $matches = [];
		for (i = 0, l = matches.length; i < l; i++) {
			$.merge($matches, matches[i].state.elements);
		}
		$matches = $($.unique($matches));
		var $current = [];
		for (i = 0, l = $.isArray(current) ? current.length : 0; i < l; i++) {
			$.merge($current, current[i].state.elements);
		}
		$current = $($.unique($current));
		
		// hide all elements in current that do not occur in matches
		$current.filter(function() {
			return $matches.index(this) === -1;
		}).hide();
				
		// for elem in elements-in(matches):
		//		if matches-that-contain(matches, elem) != elem.current:
		//			elem.queue:
		//				visible & unperceivable
		//				if elem.current:
		//					stateleave
		//				stateenter
		//				visible & perceivable
		//				stateready
		
		// TODO: set element.current somewhere (in a stateenter handler, or right after triggering stateleave?)
		$matches.
			filter(function() {
				// TODO: Write comparator. Can't we use the :data selector? < like how??
				return !_.isEqual($(this).fetch(ns, 'current'), matches);
			}).
				flexiqueue(ns, [function() {
					// TODO: if this code is indeed synchronous, we could move
					// it out of the queue... (but do we want to? we don't want
					// to hide a block any longer than absolutely necessary)
					$(this).
						css('visibility', 'hidden').
						show();
				}, function(fcb) {
					var $this = $(this),
						current = $this.fetch(ns, 'current');
					if (current) {
						$this.chain($trigger, 'stateleave', current, fcb);
					}
				}, function(fcb) {
					$(this).store(ns, 'current', matches.length > 0 ? matches : undefined);
					if (matches.length > 0) {
						$(this).chain($trigger, 'stateenter', matches, fcb);
					}
				}]).
				end().
			flexiqueue(ns, function() {
				$(this).
					show().
					css('visibility', 'visible');
			}).
			flexiqueue(ns, function(fcb) {
				$(this).chain($trigger, 'stateready', matches, fcb);
			}).
			dequeue(ns);
		
		// current = matches
		// TODO: use $.store
		$this.store(ns, 'current', matches.length > 0 ? matches : undefined);
		
		/*
		// Change state; trigger events and callbacks.
		// TODO: Use $.fetch() and $.store() as soon as we have implemented them.
		// Leave current state.
		var current = $(this).fetch(ns, 'current'),
			$active = current ? current.state.elements : $();
		if (current) {
			current.state.leave.apply(current.state, current.params);
			$this.
				trigger($.extend({type: 'stateleave._'}, current), current.params).
				trigger($.extend({type: 'stateleave.' + current.state.name}, current), current.params);
		}
		// Set and enter new current state.
		// TODO: Is it ok that stored current state is updated only after the
		//       enter events and callbacks are triggered?
		current = undefined;
		for (i = 0, l = matches.length; i < l; i++) {
			current = matches[i];
			
			// REGARDLESS OF VISIBILITY:
			// for element in current.state.elements:
			//		if element.current:
			//			if element.current.state.name !== current.state.name || element.current.params !== current.params:
			//				trigger stateleave
			//				trigger stateenter
			//		else:
			//			trigger stateenter
			
			// REGARDFUL OF VISIBILITY:
			// TODO: whenever depending on visibility event handlers: make sure they are always triggered
			// $active.subtract(current.state.elements).hide()
			// for async element in current.state.elements:
			//		if !element.current:
			//			element.bind visible:
			//				enable callback
			//				trigger stateenter, next
			//			TODO: element should be able to do something on perceivability as well.
			//				simply bind visibility event? then why not simply bind visible
			//				event as well (instead of stateenter event)?
			//				afterthought: should it really? isn't perceivability a matter for
			//				the global scope? i should investigate what, besides focus, needs
			//				perceivability.
			//		if element.current !== current:
			//			element.bind hidden:
			//				element.show
			//			element.bind unperceivable:
			//				enable callback
			//				trigger stateleave, callback
			//			element.bind visible:
			//				trigger stateenter, next
			//		TODO: simply hide and then show is too course-grained for the scenario in which the element is already visible,
			//			in which case a visibility switch would suffice.
			//		TODO: what to do when element is already hidden, resulting in no unperceivable event?
			//		element.hide
			
			current.state.elements.
				each(function() {
					var activeIdx = $active.index(this);
					if (activeIdx !== -1) {
						if (JSON.stringify($active.eq(activeIdx).fetch(ns, 'current').params) === JSON.stringify(current.params)) {
							return true;
						}
					}
					var $this = $(this),
						elemState = $this.fetch(ns, 'current');
					if (elemState && (elemState.state !== current.state || JSON.stringify(elemState.params) !== JSON.stringify(current.params))) {
						$this.trigger($.extend({type: 'stateleave._'}, elemState), elemState.params);
						if (elemState.state.name !== null) {
							$this.trigger($.extend({type: 'stateleave.' + elemState.state.name}, elemState), elemState.params);
						}
					}
					$this.store(ns, 'current', current);
					$this.trigger($.extend({type: 'stateenter._'}, current), current.params);
					if (current.state.name !== null) {
						$this.trigger($.extend({type: 'stateenter.' + current.state.name}, current), current.params);
					}
				});
			current.state.enter.apply(current.state, current.params);
		}
		if (current) {
			// TODO: i think we shouldn't trigger the (or any) global event until all block-level
			//		stuff is done (and perceivable). same applies to enter and leave controllers(?)
			$this.
				trigger($.extend({type: 'stateenter._'}, current), current.params).
				trigger($.extend({type: 'stateenter.' + current.state.name}, current), current.params);
		}
		$(this).store(ns, 'current', current);
		*/
	});
};

}(jQuery));


