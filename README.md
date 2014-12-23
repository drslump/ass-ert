# ass-ert

> Because **assert** and even **ass** were already taken!

**ass-ert** is a library of *composable* matchers offering also a
*fluent-ish* interface.

It tries to mix the best aspects of [Hamcrest](http://hamcrest.org/)
with its highly composable design, featuring beautifully descriptive
messages, and the easy on the eyes and the fingers of [chai](http://chaijs.com)'s
fluent syntax for defining assertions.

While the primary use case is testing it's by no means restricted to
it, use the matchers anywhere you may have a need for matching complex
data structures with ease.

> If you are looking for something similar for Python have a look at
  [pyshould](https://github.com/drslump/pyshould)!


## Failure messages

Right now, it's settled down on the following format, I think it offers a clear
view and has less corner cases than Hamcrest's almost natural language. Anyway,
this is still an open issue and will see some tuning since having very clear
and easily readable messages is a top priority.

> This actually has colors, green for *Passed*, red for *Failed* and yellow
  for *But*, while the values are in cyan.

```sh
AssError: ass([1,2,3]).all.number.above(3)

 Passed: For every one:
 Passed: to be a number
 Failed: to be more than <3>
    But: was <1>

 @ /Users/drslump/www/ass-ert/test.js:72:27

 at Object.<anonymous> (/Users/drslump/www/ass-ert/test.js:72:27)
 at Module._compile (module.js:456:26)
```

> The printing of the actual expression code that produced the error and the exact
  file location is something experimental and still on the works. It won't work in
  all environments but V8 and Firefox at least should be covered. It'll probably
  be released as a separate project so it can be easily used by others.


## Styles

### Assert style

Not a big fan but it's nice for the occasional use, only two primitives are
exposed in this style: `ass.ok` and `ass.ko`. The former succeeds if the
value is *truthy* (`value == true` in Javascript), the later is the inverse.

They come with a nice twist, they will perform the assertions and return the
exact same value that was provided. This allows to use them to validate some
values while actually using them.

```js
  var data = {option: true};

  ass.ok(data)

  var x = ass.ok(data).option
```


### Expect style

Just wrap any value you want to be the subject of the expression with `ass()`
and start chaining matchers to it.

```js
  ass('foo').string                     // not impressed right?
  ass('foo').string.size.eq(3)          // ok, the chain can mutate the subject!
  ass('foo').size.eq(3).value === 'foo' // oh boy! the original value is back!
```

As we've seen in the above example it's possible to chain the matchers at will,
some of them do not actually test anything, they just mutate the subject for
the remaining of the expression. At any point we can get back the original value
by using `.value` or `.valueOf()`.


### Should style

It just looks nice to have you assertion subject on the left without anything
else cluttering its view. You can use *should style* expressions easily and
they behave the same as the *expect style* ones.

```js
  // Install .should on Object.prototype and assign the static interface
  // to the `should` variable. (NOTE: it's a function and it must be called!)
  // Additionally by passing a custom name it'll be registered instead of `should`
  var should = require('ass').should();

  "foo".should.be.a.string;
  [1,2,3].should.contain(2);

  should(obj).be.null;

  // Unregister from the Object.prototype
  ass.should.restore()
```

When working with a test runner, if you don't want to globally enable *should
style* expressions, you can simply use this on your tests:

```js
  beforeEach(ass.should);
  afterEach(ass.should.restore);
```

## On composability

> **TODO**


## Coordination

As your data structures get more complex **ass** won't be left behind.
Coordinate assertions with **or**/**and** to fully express the assertion
by composition.

> **Note**: fluent matcher chaining is implicitly evaluated as **and**.

```js
  ass(data).or(
    ass.string,
    ass.number.lessThan(12),
    ass.array.and(
      ass.size.equal(2),
      ass.contains('foo')
  )
)
```


## Quantifiers

It's very common to work with collections (i.e. Arrays) so it should be
easy to match against them.

```js
  ass(data).some.equal(10);   // At least one equals 10
  ass(data).all.lessThan(20); // All of them are < 20
  ass(data).none.empty;       // None of them is an empty value
```


## Mutating the subject

Often times we want to check a specific aspect of a value but when doing
the processing manually we will loose the nice error descriptions given by
the matchers.

**ass** integrates [LoDash](lodash.com) to provide a powerful data manipulation
mechanism with a known interface.

> **Note:** When the subject is mutated it stays that way for the following
  matchers in the chain. If you have other needs check out the `.and` coordinator.


```js
  ass(data).size.eq(10)          // a collection with a size of 10
  ass.pluck('name').has('Juan')  // finds a person named Juan!
```


## Interoperability

### Promises

By using `.resolves` and `.rejects` we can attach matchers to the promise
which will only be evaluated once the promise gets resolved or rejected.
In other words, every matcher chained after those will be only tested once
the promise is resolved and using the value provided by it.

> When working with [Mocha](http://mochajs.org) or [Jasmine 2.x](http://jasmine.github.io)
  we are allowed to return a promise from a test to have it consumed before
  the test terminates. Just return any *ass* expression to have it evaluated.

```js
  var promise = $.get('http://google.com');
  return ass(promise).resolves.string.contains('<body>');
```


### Sinon

Matchers expose a `.test` method returning a boolean value which make
them compatible with the [Sinon test doubles library](http://sinonjs.org).

```js
  var callback = sinon.stub();
  callback.withArgs(ass.string.contains('foo')).returns(true)
  callback.withArgs(ass.has({
    foo: ass.number
  })).returns(null);
```


## Troubleshooting

Sometimes you can't make sense of why something doesn't work and you want to
inspect the value it's receiving. Use `.log` to dump on the console the received
value, `.fn(func)` to apply your own logic or `.debugger` if you have an
interactive debugger in the environment.

```js
  ass(data).log.string;  // prints the value of data before asserting
```
