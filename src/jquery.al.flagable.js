(function($) {

/*
WISHLIST
- Support this syntax: $('section > ul').flagable({item: '> li'});
  which will end up as: $('section > ul').flagable({item: 'section > ul > li'});
  Default value for option item can be '> *' in that case.
- Cache methods such as flagged().
*/

$.widget('al.flagable', {

	options: {
		item: 'li',
		bind: 'click',
		trigger: 'flag',
		minOne: false,
		maxOne: false,
		sync: ':checkbox'
	},
	
	_create: function() {
		var self = this,
			ns = self.widgetName;
		
		$(self.options.item, self.element[0]).live(self.options.bind, function(e) {
			var $this = $(this),
				flag = $this.fetch(ns, 'flagged') !== true;
			
			$this.store(ns, 'flagged', flag || undefined);
			
			$this.find(self.options.sync).attr('checked', flag);
			
			// Supply $this in a list to prevent elements (just 'this' in this
			// case) from ending up as separate arguments of the event handler.
			self._trigger((flag ? '' : 'un') + self.options.trigger, e, [$this]);
		});
	},
	
	flagged: function() {
		var self = this,
			ns = self.widgetName;
		
		return self.element.find(self.options.item + ':data(' + ns + '.flagged=true)');
	}

});

$.widget('al.selectable', $.al.flagable, {

	options: {
		minOne: false,
		maxOne: true,
		sync: ':radio'
	}

});

}(jQuery));
