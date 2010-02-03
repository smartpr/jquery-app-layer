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
		
		self.element.bind('visible', function(e) {
			e.data.expectsCallback = true;
			self.options.load.call(self.element, function(html) {
				self.element.html(html);
				e.data.callback();
			});
		});
	}
	
});

}(jQuery));
