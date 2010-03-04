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
			render = function(html) {
				self.element.html(html);
				// TODO: trigger render event.
			};
		
		if (html !== undefined) {
			return render(html);
		}
		self.options.load.call(self.element, render);
	}
	
});

}(jQuery));
