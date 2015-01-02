# Styles

## Assert style

Not a big fan but it's nice for the occasional use, only two primitives are
exposed in this style: `ass.ok` and `ass.ko`. The former succeeds if the value
is *truthy* (`value == true` in Javascript), the later is the inverse.

They come with a nice twist, they will perform the assertions and return the
exact same value that was provided. This allows to use them to validate some
values while actually using them.

```js
var data = {option: true};

ass.ok(data)

var x = ass.ok(data).option
```


## Expect style

Just wrap any value you want to be the subject of the expression with `ass()`
and start chaining matchers to it.

```js
ass('foo').string                     // not impressed right?
ass('foo').string.size.eq(3)          // ok, the chain can mutate the subject!
ass('foo').size.eq(3).value === 'foo' // oh boy! the original value is back!
```

As we've seen in the above example it's possible to chain the *expectations* at
will, some of them do not actually test anything, they just mutate the *subject*
for the remaining of the *expression*. At any point we can get back the original
value by using `.value` or `.valueOf()`.


## Should style

It just looks nice to have you assertion subject on the left without anything
else cluttering its view. You can use *should style* expressions easily and
they behave the same as the *expect style* ones.

```js
// Install .should on Object.prototype and assign the static interface to the
// `should` variable. Additionally by passing a custom name it'll be used as
// property name instead of `should`.
var ass = require('ass').should();  // NOTE: the function must be called!

"foo".should.be.a.string;
[1,2,3].should.contain(2);

// We can't use .should if the value is null or undefined
ass(obj).be.null;

// Unregister should from Object.prototype
ass.should.restore();
```

!!! hint
    When working with a test runner, if you don't want to globally enable
    *should style* expressions, you can simply use this on your tests

```js
beforeEach(ass.should);
afterEach(ass.should.restore);
```
