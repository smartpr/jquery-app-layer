(function($) {

$.al.Record = $.al.Object.subtype('jQuery.al.Record', function() {
	
}, {}, {
	
	Array: $.al.VirtualArray.subtype('jQuery.al.Record.Array', function() {
		
	}),
	
	records: function() {
		return this.read.apply(this, arguments);
	}
	
});

}(jQuery));