jQuery(function($) {

module('newcore');

test("$.al.extend", 1, function() {
	
	equals($.al.extend({}, { toString: 'x' }).toString, 'x', "Properties that are in Object.prototype are copied");
	
});

test("$.al.subtype", 14, function() {
	
	var Obj = $.al.subtype(Object, 'Obj', function() {
		this.args = $.makeArray(arguments);
		// We only want to test instantiation arguments alteration if we are
		// creating a MyObj instance, as that is where we have defined an
		// alteration function.
		if (this instanceof MyObj) {
			same(this.args, [1, 2, 3, 4, 5], "Instantation arguments are altered by MyObj");
		}
	}, {
		toString: function() { return "custom name"; }
	}, function() {
		ok(true, "Arguments alteration function is called");
	});
	var MyObj = $.al.subtype(Obj, 'MyObj', function() {
		ok(this instanceof MyObj, "Constructor is called with correct context");
		this.onInstance = true;
		same($.makeArray(arguments), [1, 2, 3], "Instantiation arguments are passed to constructor");
	}, {
		onPrototype: true
	}, {
		onType: true
	}, function() {
		return $.makeArray(arguments).concat([4, 5]);
	});
	equals(Obj.toString(), "Obj", "toString on type returns type name");
	ok('subtype' in Obj, "Type object has subtype method");
	ok('onType' in MyObj, "Type object can have custom properties");
	
	var obj = new Obj(),
		myobj = new MyObj(1, 2, 3);
	ok(myobj instanceof MyObj && myobj instanceof Obj, "Instances are instanceof all their parent types");
	equals(obj.toString(), "custom name", "toString can be overridden by defining it as a prototype method");
	ok('valueOf' in myobj && !myobj.hasOwnProperty('valueOf'), "Instance has properties from Object");
	ok('onPrototype' in myobj && 'onPrototype' in MyObj.prototype && !myobj.hasOwnProperty('onPrototype'), "Instance has custom properties from its prototype")
	ok('onInstance' in myobj && myobj.hasOwnProperty('onInstance'), "Instance has instance properties");
	
	var curried = Obj('tim');
	equals(curried.create().args[0], 'tim', "Curried instantiation");
	ok(curried.call() !== curried.call(), "Curried instantiator creates new instance every time it is called");
	
});

test("$.al.subtype: optional arguments", 3, function() {
	
	var Nameless = $.al.subtype(Object);
	equals(Nameless.toString, Object.toString, "No name implies leaving toString alone");
	
	var Initless = $.al.subtype(Object, {
		onPrototype: true
	});
	equals(Initless().create().onPrototype, true, "Constructor is not required");
	
	$.al.subtype(Object, $.noop, function() {
		equals(arguments.length, 2, "Prototype and class properties are not required");
	})(1, 2).create();
	
});

// TODO: test alterArgs: value/function, return sth/nothing, return array/value.

// TODO: test $.al.Object (mainly toString and extend)

// TODO: test that alterArgs function is not turned into its return value after first object instantiation.

/*
test("$.al.extend: class types", 2, function() {
	
	var MyArray = $.al.extend(Array),
		array = new MyArray();
	ok(array instanceof MyArray &&
		array instanceof Array, "Instance is of both types");
	
	var MySubArray = $.al.extend(MyArray);
	array = new MySubArray();
	ok(array instanceof MySubArray &&
		array instanceof MyArray &&
		array instanceof Array, "Instance of of all three types");
	
});

test("$.al.extend: instantiation arguments", 2, function() {
	
	var MyArray = $.al.extend(Array),
		MySubArray = $.al.extend(MyArray, function() {
			this.mySubArrayArgs = arguments;
		}),
		array = new MySubArray(1, 2, 3);
	
	equals(array.length, 3, "Arguments are propagated upwards");
	equals(array.mySubArrayArgs.length, 3, "Arguments pass all constructors");
	
});

test("$.al.extend: prototype", 3, function() {
	
	var MyArray = $.al.extend(Array, function() {
			this.myArrayProperty = true;
		}),
		MySubArray = $.al.extend(MyArray, function() {
			this.mySubArrayProperty = true;
		}),
		array = new MySubArray();
	
	ok(array.hasOwnProperty('mySubArrayProperty', "Custom methods are stored on the instance"));
	ok(array.hasOwnProperty('myArrayProperty', "Custom methods are stored on the instance"));
	ok(!array.hasOwnProperty('push'), "Array methods are not stored on the instance");
	
});
*/
});