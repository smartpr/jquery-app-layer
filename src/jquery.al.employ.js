(function($) {

// TODO: Bring back employready

$.fn.employ = function(status) {
	var state = status === true ? $.makeArray(arguments).slice(1) : undefined;
	
	return this.each(function() {
		var $this = $(this),
			oldState = $this.fetch('employ', 'state'),
			oldStatus = oldState !== undefined && $this.is(':visible'),
			stateChange = !_.isEqual(state, oldState);
		
		if (status === oldStatus && !stateChange) {
			return true;
		}
		if (status === false) {
			$this.
				hide().
				trigger('employsleep');
		}
		if (status === true) {
			$this.show();
			// console.log(state);
			if (stateChange) {
				if (oldState !== undefined) {
					$this.trigger('employdeconstruct', oldState);
				}
				$this.
					store('employ', 'state', state).
					trigger('employconstruct', state);
			}
			$this.trigger('employready');
		}
		
	});
	
};

}(jQuery));




/*
(function($) {

$.state.map(
	{
		state: ...,
		url: ...,
		employ: ...,
		enter: function(e, fcb, state, mappings, params) {},
		leave: function(e, fcb, state, mappings, params) {}
	},
	...
});


$block.employ('start', *mode);
$block.employ('stop');

// alternative naming: activate/deactivate
$block.bind('construct', function(e, fcb, *mode) {});
$block.bind('deconstruct', function(e, fcb, *mode) {});
$block.bind('employstart', function(e, fcb, *mode) {});
$block.bind('employstop', function(e, fcb, *mode) {});

// latest requirements:
// 3 callback/event levels:
// 1. for setting up stuff that may be required by other blocks (with given params/mode?); f.e. 'employdeclare'
// 2. for constructing the block's content and behavior with given params/mode; f.e. 'employdefine'
// 3. for stuff when block is ready and visible (= display & visibility) (with given params/mode?); f.e. 'employstart'

// revised design: merge 1 and 2 by making sure employconstructs are called synchronously.

$block.employ(true, *mode);
$block.employ(false, *mode);

$block.bind('employconstruct', function(e, fcb, *mode) {});
$block.bind('employdeconstruct', ...);
$block.bind('employready', ...);
$block.bind('employsleep', ...);


$block.activate(*params)

(activate) -> activated


$block.active(true | false);

triggers:
activate
active
deactivate
unactive

$block.bind(


[none] --active=true-> activate ->
[active] -> active --active=false->
[unactive] -> unactive -



}(jQuery));
*/

(function($) {

// TODO: Force redraws?
$.fn.manipulate = function(manipulate, done) {
	return this.
		flexiqueue('manipulate', [function() {
			var $this = $(this);
					
			$this.store('manipulate', 'visibility', this.style.visibility);
			this.style.visibility = 'hidden';
			$this.show();
			
		}, function(fcb) {
			fcb.expect();
			var $this = $(this);
			
			if ($this.is(':hidden')) {
				$.error("DOM elements cannot be displayed; parent element(s) keep them hidden");
			} else {
				fcb.call();
			}
			
		}, manipulate, function() {
			var $this = $(this);
			
			this.style.visibility = $this.fetch('manipulate', 'visibility');
			$this.del('manipulate', 'visibility');
			
		}, $.isFunction(done) ? done : $.noop]).
		dequeue('manipulate');
};

// TODO: Rename sleep, ready => hidden, visible (??)
// TODO: employ(false) may be confusing, as it sounds like: "do not employ" ...
// which is not the same as "unemploy"
// TODO: Implement status getter: $('...').employ() ...? or revise all
// interfaces to sth like: .employ('change', true|false), .employ('status')
$.fn.employ_old = function(status) {
	var $this = this,
		state = status === true ? $.makeArray(arguments).slice(1) : undefined;
	
	// TODO: Bring back iteration to support multiple elements to be employed
	// in one call.
	// $this.each(function() {
	// 	var $this = $(this),
		var currentState = $this.fetch('employ', 'state'),
			currentStatus = currentState !== undefined && $this.is(':visible');
		
		// no state en visible => false
		// no state en invisible => false
		// state en visible = true
		// state en invisible = false
		
		if (currentStatus === false && status === false) {
			return this;
			// return true;
		}
		
		if (status === false) {
			
			$this.
				flexiqueue('employ', [function(fcb) {
					$(this).hide();
				}, function(fcb) {
					$(this).trigger('employsleep', [fcb]);
				}]).
				dequeue('employ');
			
			return this;
			// return true;
			
		}
		
		// TODO: Think about the potential risk of nesting two employ calls:
		// $block.
		//		bind('employready', function() { $block.employ(true, y); }).
		//		employ(true, x);
		// This loops infinitely, but that is acceptable (it's expected behavior)
		// and can be fixed by using a one() instead of a bind().
		// But there is also the risk that both employ calls use the same queue
		// internally, which may result in infinite loop as well. This is not
		// acceptable behavior as it the user can't tell what's going wrong.
		$this.manipulate(function(mfcb) {
			// console.log('manipulate:');
			// console.log(currentState);
			// console.log(state);
			if (!_.isEqual(currentState, state)) {
				mfcb.expect();
				// console.log('queue deconstruct and construct');
				$(this).
					flexiqueue('employ', [function(fcb) {
						// console.log(this);
						// console.log('consider deconstruct');
						if (currentState !== undefined) {
							// console.log('trigger deconstruct');
							$(this).trigger('employdeconstruct', $.merge([fcb], currentState));
						}
					}, function(fcb) {
						console.log('construct');
						$(this).store('employ', 'state', state);
						$(this).trigger('employconstruct', $.merge([fcb], state));
					}, function(fcb) {
						console.log('after construct');
						mfcb.call();
					}]).
					dequeue('employ');
			}
		}, function(fcb) {
			$(this).trigger('employready', [fcb]);
		});
		
	// });
	return $this;
};

var getStatus = function() {
	var $this = $(this);
	
	return $this.fetch('employ', 'state') !== undefined && $this.is(':visible');
};

var undisplay = function() {
	$(this).hide();
};
var display = function() {
	var $this = $(this);
	
	$this.store('manipulate', 'visibility', this.style.visibility);
	this.style.visibility = 'hidden';
	$this.show();
};
var restoreVisibility = function() {
	var $this = $(this);
	
	this.style.visibility = $this.fetch('manipulate', 'visibility');
	$this.del('manipulate', 'visibility');
};
var sleep = function(fcb) {
	$(this).trigger('employsleep', [fcb]);
};
var ready = function(fcb) {
	$(this).trigger('employready', [fcb]);
};

$.fn.employ_overlycomplicated = function(status, cb) {
	var $this = this,
		state = status === true ? $.makeArray(arguments).slice(2) : undefined;
	cb = $.isFunction(cb) ? cb : $.noop;
	if (typeof status !== 'boolean') {
		cb();
		return $this.chain(getStatus);
	}
	
	// TODO: Rename to employOuter.
	$().
		flexiqueue('employ.outer', function(fcbOuter) {
			fcbOuter.expect($this.length);
		
			$this.each(function() {
				var $this = $(this),
					oldState = $this.fetch('employ', 'state'),
					oldStatus = $this.chain(getStatus),
					queue = [];
			
				if (status === false) {
					queue.push(undisplay, sleep);
				} else {
					queue.push(display);
					if (!_.isEqual(state, oldState)) {
						if (oldState !== undefined) {
							queue.push(function(fcbInner) {
								$(this).trigger('employdeconstruct', $.merge([fcbInner], oldState));
							}, function() {
								// TODO: We might just remove this function,
								// as the state value will be updated in the
								// upcoming employconstruct function. But; if
								// we want to support unemploy with forced
								// deconstruct, we will be needing it.
								$(this).del('employ', 'state');
							});
						}
						queue.push(function(fcbInner) {
							$(this).
								store('employ', 'state', state).
								trigger('employconstruct', $.merge([fcbInner], state));
						});
					}
					queue.push(restoreVisibility, ready);
				}
				
				queue.push(function() {
					fcbOuter.call();
				});
				
				$this.flexiqueue('employ.inner', queue).dequeue('employ.inner');
			
			});
		
		}).flexiqueue('employ.outer', function() {
			cb();
		}).dequeue('employ.outer');
	
};

}(jQuery));
