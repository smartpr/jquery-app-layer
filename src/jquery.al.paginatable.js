/*

IFF we still need this:
- make subwidget of al.lazyloadable
- rename: al.paginable

*/

(function($) {

$.widget('al.paginatable', {
	
	options: {
		load: $.noop,
		page: 1,
		pages: null
	},
	
	_create: function() {
		var self = this;
		
		self.element.bind('visible', function() {
			self.flip(self.options.page);
		});
	},
	
	page: function(page) {
		var self = this,
			ns = self.widgetName;
		
		return self.element.children(':data(' + ns + '.page=' + (page === undefined ? self.options.page : page) + ')');
	},
	
	flip: function(page) {
		var self = this,
			ns = self.widgetName,
			$page = self.page(page);
		
		if ($page.length === 0) {
			self._trigger('flipstart');
			self.options.load.call(self.element, function(html) {
				$page = $(html).filter('[nodeType=1]').store(ns, 'page', page).hide();
				self.element.append($page);
				self._flip($page);
			}, page);
			return;
		}
		if (page !== self.options.page) {
			self._trigger('flipstart');
			self._flip($page);
		}
	},
	
	_flip: function($page) {
		var self = this,
			ns = self.widgetName;
		
		self.element.children().hide();
		self.options.page = parseInt($page.fetch(ns, 'page'));
		$page.show();
		self._trigger('flip');
	},
	
	prev: function() {
		var self = this,
			prev = self.options.page - 1;
		
		if (prev > 0) {
			self.flip(prev);
		}
	},
	
	next: function() {
		var self = this,
			next = self.options.page + 1;
		
		if (self.options.pages === null || next <= pages) {
			self.flip(next);
		}
	}
	
});

}(jQuery));
