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
