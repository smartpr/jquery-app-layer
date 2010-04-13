(function($) {

$.fn.chain = function(func) {
    return func.apply(this, $.makeArray(arguments).slice(1));
};

}(jQuery));

