/*

RecordSet
---------

rs = $.RecordSet(id)

rs.clear()

[r1] = rs.add(o1)

[r2, r3] = rs.add([o1, o2, o3, o2])

[r1, r2, r3] = rs.get()

[r1, r2, r2, r4] = rs.get([o1, o2, o2, o4])

[r1, r2, r3, r4] = rs.get()

?? [r1] = rs.set(o1)

?? [r2, r3, r4] = rs.set([o2, o3, o4])

[r4] = rs.remove(o4)

[r2] = rs.remove([o1, o2, o2])

[] = rs.remove([o1, o5])

[r3] = rs.get()

true = rs.equals(o3)

true = rs.equals([o3, o3])

rs2 = rs.clone()

---

rs.*(items, dry-run)

Record
------

r.set(<$.fn.store syntax>)

r.get(<$.fn.fetch syntax>)

r.invalidate()


*/

(function($) {

$.al.Record = $.al.Field.extend(function() {
	
	this.equals = function(record) {
		return this.toString() === record.toString() && this.val() === record.val();
	};
	
	this.toString = function() {
		return "[object $.al.Record]";
	};
	
});

// TODO: store does not have to be global i guess...
var store = $.store = new Hashtable();
$.al.Record.instantiate = function(data, type) {
	if (!$.isFunction(type) || !((new type) instanceof $.al.Record)) {
		type = $.al.Record;
	}
	
	var singularity = false;
	if (!$.isArray(data)) {
		data = [data];
		singularity = true;
	}
	
	var records = [],
		record, existingRecord;
	for (var i = 0, l = data.length; i < l; i++) {
		record = type().val(data[i]);
		if (store.containsKey(record)) {
			existingRecord = store.remove(record);
			record = existingRecord.val(record.val());
		}
		store.put(record, record);
		records.push(record);
	}
	
	return records.length === 1 && singularity ? records[0] : records;
};

$.al.Record.del = function(records) {
	if (records === undefined) {
		return;
	}
	
	if (!$.isArray(records)) {
		records = [records];
	}
	
	for (var i = 0, l = records.length; i < l; i++) {
		// TODO: can't this remove call be done by an observer that is attached
		// to the fielddelete event at the moment the record is added to the store?
		store.remove(records[i]);
		// records[i].remove();
		// $(records[i]).trigger('fielddelete');
	}
};

}(jQuery));




/*
(function($) {

var Record = function(data) {
	if (!(this instanceof Record)) {
		return new Record(data);
	}
	
	this.get = function() {
		return data;
	};
};

$.RecordSet = function(data) {
	if (!(this instanceof $.RecordSet)) {
		return new $.RecordSet(data);
	}
	
	var records = [];
	for (var i = 0, l = data.length; i < l; i++) {
		records.push(new Record(data[i]));
	}
	
	this.data = function() {
		return data;
	};
	this.get = function(data) {
		if (data !== undefined) {
			for (var i = 0, l = records.length; i < l; i++) {
				if (records[i].get() === data) {
					return records[i];
				}
			}
		}
		return records;
	};
};

}(jQuery));
*/