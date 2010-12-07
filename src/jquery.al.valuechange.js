(function($, undefined) {

$.event.special.valuechange = {
	
	add: function(handleObj) {
		var handler = handleObj.handler;
		handleObj.handler = $.debounce(100, handler);
	}
	
};

}(this.jQuery));


(function($) {

$.event.special.valuechange = {
	
	setup: function() {
		var $this = $(this);
		
		$this.bind('keydown', function() {
			setTimeout(function() {
				$this.trigger('valuechange');
			}, 300);
		});
	}
	
};

}/*(jQuery)*/);