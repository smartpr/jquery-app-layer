(function($) {

$.fn.chain = function(func) {
    return func.apply(this, $.makeArray(arguments).slice(1));
};

}(jQuery));

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

[r4] = rs.remove(o4)

[r1, r2] = rs.remove([o1, o2, o2])

[] = rs.remove([o1, o5])

[r3] = rs.get()


Record
------

r.set(<$.fn.store syntax>)

r.get(<$.fn.fetch syntax>)

r.invalidate()


*/
