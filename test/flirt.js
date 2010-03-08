jQuery(function($) {

var $flirt = $('#flirt');

module('flirt');

test('$.fn.flirt', 2, function() {
	equals($flirt.flirt([{text: 'item 1'}, {text: 'item 2'}, {text: 'item 3'}], false), '<li>item 1</li><li>item 2</li><li>item 3</li>', "Compile and parse template(s)");
	equals($flirt.contents('[nodeType=8]').length, 1, "Templates have been removed from DOM after compilation, regular comments are left untouched");
});

});
