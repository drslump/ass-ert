## Asynchronous expressions

When an *expectation* needs to test something asynchronous, for instance testing
the result from a *promise*, the *expresion* will resolve as *undefined*. At this
point we don't know if the *expression* succeeded or failed; in order to know the
actual result we simply need to use the familiar Promise/A interface supported
by the *expression*.

```js
var req = $.get('http://pollinimini.net/person.json');
ass(req).resolves.plain.prop('name').eq('Iván')
.then(function (result) {
  console.log('expression was ok!');
})
.catch(function (error) {
  ass.ok( error instanceof ass.Error );
  console.error(error);
});
```

Note that anytime we use `.then` (or `.catch`) it'll get automatically registered
with the expression, normally the chained properties only take effect when the
*expression* reaches that point while evaluating but `.then` is not an *expectation*,
it's part of the *expression* interface just like `.test` or `.assert`.

!!! caution
    We divert from the Promise/A specification in that callback functions
    registered with `.then` will be called **each and every time** the
    *expression* is resolved. The reasoning is that the `.then` is targeting
    the *expression*, which is an abstract form until it gets resolved.


### Testing Promises

By using `.resolves` and `.rejects` we can attach *expectations* to a promise
object, the *expression* will automatically enter the *async mode* and will
subscribe itself to the promise object using its `.then` method. Once the promise
is fulfilled (or rejected) the rest of the *expression* will continue resolving,
now using the value transfered by the promise.
In other words, every *expectation* chained after `.resolves` or `.rejects` will
be only tested once the promise is resolved and will mutate the subject value to
be whatever the promise resolves to.

Additionally since it's pretty common to check for equality there is a shortcut
*matcher* named `.become()` that basically is the same as `.resolves.eq()`:

```js
ass(promise).become('foo')  // <=> ass(promise).resolve.eq('foo')
```

!!! hint
    When working with [Mocha](http://mochajs.org) or [Jasmine 2.x](http://jasmine.github.io)
    we are allowed to return a promise from a test and have it consumed before the
    test ends. Just return any *ass* expression to have it evaluated (even if it's
    not asynchronous).

```js
it('should fetch page asynchronously and test it', function () {
  var promise = $.get('http://google.com');
  return ass(promise).resolves.string.contains('<body>');
  // The test runner will wait here until promise is resolved and the
  // expression has completed.
});
```

When the test runner doesn't support returning a Promise but has the concept of
a `done` function, we can implement the test like so:

```js
it('should fetch page asynchronously and test it', function (done) {
  var promise = $.get('http://google.com');
  ass(promise).resolves.string.contains('<body>').notify(done).catch(done);
});
```
