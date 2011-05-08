#### Design considerations ####

The idea behind the design of components with properties is that every
component defines its own behavior and within a component every property
defines its own behavior. This approach of loose coupling means that we can
develop large-scale application interfaces by incrementally adding components
without the risk of complexity running out of hand. This keeps the application
maintainable and flexible.

### Inter-property communication ###

One of the big questions in this design is how we should allow communication
between components and between properties within components. As the underlying
philosophy assumes that properties will never be changed from outside the
property's own definition, one could argue that read-only access should
suffice for any properties outside the property's own definition.

Yet, there is a difference between discouraging a certain practice and making
it plain impossible. Java, for example, a language that is very opiniated
about how it should be used, is an absolute pain in the ass precisely for this
reason. It is too harsh in neglecting the fact that reality is a hairy beast
and in order to get things done you sometimes want to cheat the theory a bit.

## Within the same component ##

This leads us to suggest that all properties within the same component should
just be readable and writable from any part in the component. We encourage
that a property describes its own behavior by making the property's setup
function an integral part of a property's instantiation. Beyond that, it's up
to the developer. If he wants to set things up differently, it's his own
decision. And if the component ends up as a mess, it's still not the end of
the world, as it will never affect other components. If at a later stage the
developer learnt from his mistakes and would like to fix the messy component,
he can refactor it without impacting any of the other components.

# Between different components ##

That leaves us with the question; what to do with inter-component
communication? Let us say that every property triggers change events on the
DOM that can be handled from any external component to get notified of their
value. That accounts for read access. Does that mean we are done? Hmm,
doubtful... let me explain. Several reasons:

1. change events only communicate a property's value, while a property may
   hold additional state information that could be of interest. For example;
   the full size of a virtual data set (currently accessible via the `size()`
   method on `$.al.Array`).
2. It is quite common that you have several components working on the same
   property (at least conceptually). For example; one component creates a
   session, another deletes it. Implementing something like this using just
   change events is complicated and suboptimal. You will need two different
   properties, each of which observes the other. This means that both
   components will have to know about the other, while conceptually it would
   also be possible to define a relation unilaterally.
3. Although change events provide read access, in some scenarios you need an
   observable object instead of a DOM element and an event. Of course you can
   easily create such an object based on this event, but it would require
   additional code. Also, a property is already an observable object, so why
   not using that one directly?

# Solution 1 #

Allow for direct access to external components' properties
(implying read and write access).
Pro: one interface to rule them all (three use cases given above).
Con: does not discourage or encourage certain patterns, like:
* It is easy to write code that will not behave as expected (like installing
  an external property directly onto another component's attribute:
  `myattr: $('#nav').component('attr'),` -- will not work because property
  `attr` does not yet exist at this point).
* Any component's properties can be modified directly from virtually any line
  of code, which opens up the way for some pretty unmaintainable situations.
* You will end up repeatedly specifying the reference to the external
  property, including its CSS selector and external property name. As soon as
  either one changes you will have to make changes through-out your entire
  code-base.

# Solution 2 #

Allow for change access via events and in addition provide direct access to
the external property by requiring it to be a property on the local component
as well. This means that you can always listen for external properties' value
changes directly. If you need more than that, like in the three use cases
described above, you can get it at the price of adding a property to your
component definition. What I like about it is that we still allow for direct
access to external properties, but by requiring that this property is
included in the local component definition, we make this inter-component
relation specific and thereby maintainable. It says; here we link this
component to property *x* on component *y*, and from there on all references
to this property will be local again (because they will use the local name of
the property). So this solution is not really a hard guideline on how things
should be done, but merely faces the developer with a trade-off every time he
wants to work with external properties. This trade-off puts a brake on
complexity running wild, while not making anything plain impossible. Win.

### Post scriptum ###

A relevent aspect that has been missed in the preceding discussion is the fact
that DOM events bubble up (by default). This characteristic can be used to our
advantage (we use it to construct a container's display logic). But it can
also get in the way and result in non-intuitive behavior. An example would be
if we handle an element's display change event, while this element contains
other elements that have also defined a component with a display property. Any
display change on a contained component will be handled on the containing
component if you don't explicitly check for the event's target. Hmm... is this
a reason to degrade our dependency on events for inter-component
communication?