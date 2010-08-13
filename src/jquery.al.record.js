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
