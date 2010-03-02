/*

- rename: lazyloading (?)
	argument against: it implies that it requires lazy loading, while the idea
	is that if the required items are already in the list, it does not do lazy
	loading.

*/

(function($) {

$.widget('al.lazyloadable', {
	
	options: {
		load: $.noop,
	},
	
	_create: function() {
		var self = this;
		
		self.invalidate();
	},
	
	invalidate: function(html) {
		var self = this,
			set = function(html) {
				self.element.html(html);
			};
		
		if (html !== undefined) {
			return set(html);
		}
		self.options.load.call(self.element, set);
	}
	
});

}(jQuery));
