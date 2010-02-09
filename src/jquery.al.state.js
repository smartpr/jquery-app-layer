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

var ns = 'state',
	stateDefault = {
		// Unnamed states are non-final states.
		name: null,
		// A pattern that matches nothing effectively disables a state.
		pattern: /$./,
		elements: [],
		enter: $.noop,
		leave: $.noop
	};

$[ns] = function() {
	var states = Array.prototype.slice.call(arguments);
	
	// Create condensed state definitions based on supplied arguments.
	// TODO: Validate characters in name (in order to prevent conflicts with
	//       the identifier we choose to represent '*' (any event namespace)).
	for (var i = 0, l = states.length, state; i < l; i++) {
		state = states[i] = $.extend({}, stateDefault, states[i]);
		if (typeof state.pattern === 'string') {
			state.pattern = new RegExp(state.pattern);
		}
		state.elements = $(state.elements);
	}
	
	$(window).bind('hashchange', function(e) {
		var $this = $(this),
			uri = window.location.hash,
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
		
		// Trigger events and callbacks.
		// TODO: Use $.fetch() and $.store() as soon as we have implemented them.
		// TODO: Define stateenter and stateleave as special events via
		//       $.event.special to enable binding 'stateenter.*' and
		//       'stateleave.*' instead of 'stateenter.all' and 'stateleave.all'.
		// Leave current state.
		var current = $(this).fetch(ns, 'current');
		if (current) {
			current.state.leave.apply(current.state, current.params);
			$this.
				trigger('stateleave.all', current.params).
				trigger('stateleave.' + current.state.name, current.params);
		}
		// Set and enter new current state.
		// TODO: Is it ok that stored current state is updated only after the
		//       enter events and callbacks are triggered?
		current = undefined;
		for (i = 0, l = matches.length; i < l; i++) {
			current = matches[i];
			current.state.enter.apply(current.state, current.params);
		}
		if (current) {
			$this.
				trigger('stateenter.all', current.params).
				trigger('stateenter.' + current.state.name, current.params);
		}
		$(this).store(ns, 'current', current);
	});
};

}(jQuery));


