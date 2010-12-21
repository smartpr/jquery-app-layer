(function($, undefined) {

// TODO: Don't use "switch" in the name, as the corresponding property is not
// named `$.component.switch`.
$.fn.toggleSwitch = function(name, state) {
	var on = name,
		off = 'no-' + name;
	return this.each(function() {
		var $this = $(this);
		if (state === undefined) {
			// TODO: If no class is set on the element at all, do we want to
			// interpret this as off, or leave it alone?
			state = $this.is('.' + on) ? false : $this.is('.' + off) ? true : undefined;
		}
		if (state === undefined) return true;
		$this.removeClass(state ? off : on).addClass(state ? on : off);
	});
};

}(this.jQuery));