(function($) {

$.aop.around({target: $.fn, method: 'show'}, function(invocation) {
    // TODO: Check detectVisible for every element. Also, move to one (manual)
    // loop, or another solution that makes this function fast in case of no
    // detection required.
	if (this.data('jal.detectVisible') !== true) {
	    return invocation.proceed();
	}
    this.each(function() {
        var elem = this,
            $elem = $(elem),
            isVisible = $elem.is(':visible');
        $elem.data('jal.origVisible', isVisible);
        if (!isVisible) {
            $elem.data('jal.origVisibility', elem.style.visibility);
            elem.style.visibility = 'hidden';
            elem.offsetTop; // TODO: Move into force flow utility
        }
    });
    var result = invocation.proceed();
    this.each(function() {
        var elem = this,
            $elem = $(elem),
            isVisible = $elem.data('jal.origVisible');
        $elem.removeData('jal.origVisible');
        if (isVisible != $elem.is(':visible')) {
            $.event.handle.apply(elem, [$.Event('visible')]);
        }
    });
    return result;
});

// TODO: This architecture only works with event handlers on the same element
// that show() called on. I think this is not what we want. Think again about
// the exact function of this system.

$.event.special.visible = {
    
    setup: function() {
        $(this).data('jal.detectVisible', true);
    },
    
    add: function(handler) {
        return function(e) {
            // TODO: Does this event bubble? If so, I think it should be
            // prevented.
            var elem = this,
                $elem = $(elem),
                origVisibility = $elem.data('jal.origVisibility');
            e.data = {	// move event callback stuff to reusable chunk of code
                expectsCallback: false,	// rename: awaitCallback = function(n=1) {}
                callback: function() {
                    $elem.removeData('jal.origVisibility');
                    if (origVisibility !== undefined) {
                        elem.style.visibility = origVisibility;
                        // TODO: Force flow necessary?
                    }
                    if ($elem.css('visibility') === 'visible') {
                        $elem.trigger('perceivable');
                    }
                }
            };
            var result = handler.apply(elem, arguments);
            if (e.data.expectsCallback !== true) {
                e.data.callback();
            }
            return result;
        };
    }
    
};



/*
$.event.special.visible = {
    advices: [],
    setup:
        if $.event.special.visible.advices:
           return
        $.event.special.visible.advices = around.show:
            this.data(origVisible, this.is(:visible))
            if this.data(origVisible):
                this.data(origVisibility, this.style.visibility)
                this.style.visibility = hidden
                force flow
            invocation.proceed()
            if this.data(origVisible) != this.is(:visible):
                this.removeData(origVisible)
                trigger(visible)
    add:
        callback:
            if this.data(origVisibility):
                this.style.visibility = this.data(origVisibility)
                this.removeData(origVisibility)
                force flow (already enforced by next line?)
            if this.css(visibility) == visible:
                trigger(perceivable)
        // supply callback and do sth with return value of handler to find out
        // whether callback will be called or we should call it ourselves.
        $.event.handle.apply(this, arguments)
}
*/



















/* Goals:
- set/get perceivibility instead of display
- 'smooth' show/hide: process as much stuff as possible before visibility is
    visible. For this to be possible we should be able to handle both display
    and visibility changes. This requires detecting/knowing when handlers of a
    particular type finish.
- asynchronicity: handlers are called only when the corresponding event has
    really finished (needed for dealing with iframes in Gecko)
- make it work as automatically as possible, i.e. integrate with $.fn.show() and
    $.fn.hide(). But also provide manual 'triggers' to cover cases in which
    perceivibility is adjusted by CSS.

setDisplay(true):
    if this.is(:hidden) && parent.is(:visible):
        if this.css(visibility) == visible:
            var origVisibility = this.style.visibility
            this.style.visibility = hidden
            force flow
        this.show()
        trigger(visible, visibleCallback)
    else:
        this.show()
    
    visibleCallback:
        if origVisibility:
            this.style.visibility = origVisibility
            force flow (already enforced by next line?)
        if this.css(visibility) == visible:
            trigger(perceivable)






console.log($.aop.before({target: $.fn, method: 'show'}, function() {
    console.log('about to call show');
}));

console.log($.aop.after({target: $.fn, method: 'show'}, function() {
    this.each(function() {
        this.style.visibility = $(this).data('_visibility');
        if ($(this).data('_display') !== $(this).css('display')) {
            $(this).trigger('display');
            if ($(this).css('visibility') === 'visible') {
                $(this).trigger('visibility');
            }
        }
        $(this).removeData('_display');
        $(this).removeData('_visibility');
    });
}));

$.event.special.display = {
    
    setup: function(data, namespaces) {
    },
    
    teardown: function(namespaces) {
    },
    
    add: function(handler, data, namespaces) {
        console.log('display');
    },
    
    handler: function(event) {
        console.log('display');
    }
    
};

$.event.special.visibility = {
    
    setup: function(data, namespaces) {
    },
    
    teardown: function(namespaces) {
    },
    
    add: function(handler, data, namespaces) {
        console.log('visibility');
    },
    
    handler: function(event) {
        console.log('visibility');
    }
    
};
*/
}(jQuery))
