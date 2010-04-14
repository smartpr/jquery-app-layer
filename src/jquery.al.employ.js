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


$block.employ(['start',] *mode);
$block.employ('stop');

// alternative naming: activate/deactivate
$block.bind('construct', function(e, fcb, *mode) {});
$block.bind('deconstruct', function(e, fcb, *mode) {});
$block.bind('employstart', function(e, fcb, *mode) {});
$block.bind('employstop', function(e, fcb, *mode) {});





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
