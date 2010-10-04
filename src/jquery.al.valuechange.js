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

}(jQuery));