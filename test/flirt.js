(function($) {

module('flirt', {
	setup: function() {
		this.$lazy = $('#lazy');
	}
});

test('$.fn.flirt', function() {
	expect(2);
	
	equals(this.$lazy.flirt([{text: 'item 1'}, {text: 'item 2'}, {text: 'item 3'}]), '<li>item 1</li><li>item 2</li><li>item 3</li>', "Compile and parse template(s)");
	equals(this.$lazy.contents('[nodeType=8]').length, 1, "Templates have been removed from DOM after compilation, regular comments are left untouched");
});

}(jQuery));
