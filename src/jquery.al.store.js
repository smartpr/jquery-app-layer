(function($) {

var getContactSet = function() {
	
	
	
};



$.store = {};

$.store.Contact.read = function() {
	
	return $.al.DataSet(function(store) {
		
		$.smartpr.contacts.read(function(contacts, total) {
			val($.map(contacts, function(contact) {
				return $.smartpr.Contact(contact);
			}));
			// TODO: What to do with total?
		}, {
			tags: [self.tag.val() ? self.tag.val().id : self.tag.val()],
			order: self.order.val(),
			filter: self.filter.val(),
			offset: self.element.listview('loadedCount'),
			limit: 50
		});
		
	});
	
};

$.al.Dataset = function(type, fetch) {
	
	var set = [];
	var loaded = false;
	
	var store = function(data, total) {
		for (var i = 0, l = data.length; i < l; i++) {
			var record = type(data[i]);
			var current = sessionStorage[type.toString()][record.id()];
			if (current) {
				current.val(data[i]);
			} else {
				current = record;
			}
			sessionStorage[type.toString()][record.id()] = record;
			set.push(current);
		}
		loaded = true;
	};
	
	fetch(store);
	
};

var contacts = $.al.Dataset($.smartpr.Contact, )

}(jQuery));
