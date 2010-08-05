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
				$.error("DOM elements cannot be displayed; parent element(s) keep them invisible");
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
$.fn.employ = function(status) {
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
						// console.log('construct');
						$(this).store('employ', 'state', state);
						$(this).trigger('employconstruct', $.merge([fcb], state));
					}, function(fcb) {
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

}(jQuery));
