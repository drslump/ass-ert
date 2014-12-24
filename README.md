# ass-ert

> Because **assert** and even **ass** were already taken!

**ass-ert** is a library of *composable* matchers offering a *fluent-ish* interface.

It tries to mix the best aspects of [Hamcrest](http://hamcrest.org/) with its
highly composable design, featuring beautifully descriptive messages, and the
easy on the eyes and the fingers of [chai](http://chaijs.com)'s fluent syntax
for defining assertions.

While the primary use case is testing it's by no means restricted to it, use
the matchers anywhere you may have a need for matching complex data structures
with ease.

> If you are looking for something similar for Python have a look at
  [pyshould](https://github.com/drslump/pyshould)!


## Failure messages

Right now, it's settled down on the following format, I think it offers a clear
view and has less corner cases than Hamcrest's almost natural language. Anyway,
this is still an open issue and will see some tuning since having very clear and
easily readable messages is a top priority.

> This actually has colors: green for *Passed*, red for *Failed* and yellow
  for *But*, while the values are in cyan.

```
AssError: ass([1,2,3]).all.number.above(3)

 Passed: For every one:
 Passed: to be a number
 Failed: to be more than <3>
    But: was <1>

 @ /Users/drslump/www/ass-ert/test.js:72:27

 at Object.<anonymous> (/Users/drslump/www/ass-ert/test.js:72:27)
 at Module._compile (module.js:456:26)
```

> The printing of the actual expression code that produced the error and the
  exact file location is something experimental and still on the works. It
  won't work in all environments but V8 and Firefox at least should be covered.
  It'll probably be released as a separate project so it can be easily used by
  others.


## Some core concepts

Without going into the internals of the library, just to be able to understand
correctly the language in the documentation, these are some of terms and concepts
used:

  - *Matcher*: abstract definition of some test (i.e. "equals something")
  - *Expectation*: concrete instance of a *matcher* (i.e. "equals 10")
  - *Expression*: chain of *expectations* (1 or more) that are evaluated from
    left to right and stops on the first *expectation* that fails.
  - *Resolver*: the algorithm that traverses an *expression* and produces a boolean
    result from it.
  - *Subject*: refers to the value we're testing the expression against.

Unless you want to create your own *matchers* the only concept you'll be working
with are *expressions*. An *expression* can have three possible results when
resolved:

  - **true**: All the *expectations* were run and tested that the data was valid
  - **false**: One of the *expectations* failed its test on the data. Since
    *expressions* are short-circuited, not all the *expectations* are guaranteed
    to have been tested, this is similar to most programming languages so it
    should be a familiar behaviour (ie: `false && work()`, work is never executed).
  - **undefined**: An asynchronous *expectation* (i.e. Promises) has taken control
    of the *resolver* and it'll produce a true/false result at a later point via
    the own *Promises/A* interface of the *expression*.


## Styles

### Assert style

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


### Expect style

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


### Should style

It just looks nice to have you assertion subject on the left without anything
else cluttering its view. You can use *should style* expressions easily and
they behave the same as the *expect style* ones.

```js
  // Install .should on Object.prototype and assign the static interface to the
  // `should` variable. Additionally by passing a custom name it'll be used as
  // property name instead of `should`.
  var should = require('ass').should();  // NOTE: the function must be called!

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


## Combinators

As your data structures get more complex **ass** won't be left behind.
Coordinate expressions with **or** / **and** to fully express the assertion by
composition.

> Note: fluent *expectation* chaining is implicitly evaluated as **and**.

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

Since some *expectations* will mutate the value for the rest of the *expression*,
sometimes we may wish to go back to a previous version of the value. By using
the `.and` combinator we can achieve that and express complex assertions with
ease:

```js
  ass(data).array.and(
    ass.size.moreThan(10).lessThan(100),
    ass.pluck('name').string.and(
      ass.not.empty,
      ass.match(/^[A-Z]/)
    ),
    ass.filter( ass.pluck('age').moreThan(18) ).and(
      ass.size.is( ass.lessThan(8) ),
      ass.all.prop('adult').true
    ).store(result, 'adults')  // this sets the intermediate value in result.adults
  )
```

Here we've seen the power of composition, we've defined an *expression* that
would certainly be quite a bit more complex if we did it in an *imperative*
programming style. It takes a bit of effort to get familiar with the syntax but
once you do it's hard to go back. Not only did the assertion get simpler but
it should hopefully produce easy to understand failure messages.

Of course, this example was a little bit oriented towards testing, but the only
thing that produces an assertion error is the `ass(data).` at the beginning, we
could simply use `ass.` and pass the value at the end of the *expression* with
`.test(data)` to get a boolean result. Even more, using `.tap(fn)` we can inject
our logic anywhere in the expression and evaluate or mutate the values as they
pass through, while with `.store()` we can keep the intermediate results around
for further analysis.


## Negation

When using `.not` in an *expression* we are not actually mutating the *subject*,
what it does is allow the resolver to continue and when a result has finally been
found it'll inverse it before we obtain it. It's indeed negating the rest of the
*expression*.

```js
  ass('foo').not.number;
  // It even supports async expressions
  ass(promise).not.resolves.string.equal('foo');
```


## Quantifiers

It's very common to work with collections (i.e. Arrays) so it should be easy to
match against them.

```js
  ass(data).some.equal(10);   // At least one equals 10
  ass(data).all.lessThan(20); // All of them are < 20
  ass(data).none.empty;       // None of them is an empty value
```

All quantifiers support *async expressions* too, so you can for instance operate
over a list of *promises* by using them.

```js
  ass([p1,p2,p3]).all.resolve.be.a.number.above(1000)
  .catch(function (err) {
    console.error(err)
  })
```


## Mutating the subject

Often times we want to check a specific aspect of a value but when doing the
processing manually we will loose the nice error descriptions given by the
matchers.

**ass** integrates [LoDash](lodash.com) to provide a powerful data manipulation
mechanism with a known interface.

> **Note:** When the subject is mutated it stays that way for the following
  matchers in the chain. If you have other needs check out the `.and` coordinator.


```js
  ass(data).size.eq(10)          // a collection with a size of 10
  ass.pluck('name').has('Juan')  // finds a person named Juan!
```

While the expression evaluates the initial value under test may mutate but we
can always get back the original by calling `.value`, if we're actually
interested in the current one we can access it with `.mutation`.

```js
  var data = 'abcdef';
  ass(data).size.value === 'abcdef'
  ass(data).size.mutation === 6
```

## Asynchronous expressions

When an *expectation* needs to test something asynchronous, for instance testing
the result from a *promise*, the *expresion* will resolve as *undefined*. At this
point we don't know if the *expression* succeeded or failed, in order to know the
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

> **Important**: We divert from the Promise/A specification in that callback
  functions registered with `.then` will be called **each and every time** the
  *expression* is resolved. The reassoning is that the `.then` is targetting
  the *expression*, which is an abstract form until it gets resolved.

### Testing Promises

By using `.resolves` and `.rejects` we can attach *expectations* to a promise
object, the *expression* will automatically enter the *async mode* and will
subscribe itself to the promise object using its `.then` method. Once the promise
is fulfilled (or rejected) the rest of the *expression* will continue resolving
now using the value transfered by the promise.
In other words, every *expectation* chained after `.resolves` or `.rejects` will
be only tested once the promise is resolved and will mutate the subject value to
be whatever the promise resolves to.

> When working with [Mocha](http://mochajs.org) or [Jasmine 2.x](http://jasmine.github.io)
we are allowed to return a promise from a test and have it consumed before the
test ends. Just return any *ass* expression to have it evaluated (even if it's not
asynchronous).

```js
  it('should fetch page asynchronously and test it', function () {
    var promise = $.get('http://google.com');
    return ass(promise).resolves.string.contains('<body>');
    // The test runner will wait here until promise is resolved and the
    // expression has completed.
  });
```


## Interoperability

### Lo-Dash

The library wraps Lo-Dash [_.createCallback](https://lodash.com/docs#createCallback)
to make it understand about expression chains. This means that in every Lo-Dash
function accepting a callback it'll now accept an *expression*, which will get
automatically evaluated every time it's used by Lo-Dash.

```js
  var over18 = ass.pluck('age').moreThan(18);
  var adults = _.filter(students, over18);
```

That works well for the whole filtering primitives but if we want to use something
like `_.map`, it'll get just `true` or `false`. To get the mutated value from an
expression we can use `.result()` like so:

```js
  var truncatedName = ass.pluck('name').slice(0, 20).result;
  var result = _.map(students, truncatedName);
```

> `_.isEquals` is also wrapped to make it understand our *expressions*, so you
  can use it check arbitrary object structures with nested *expressions*.

> **Note**: You can use `.result`, `.test`, `.assert` and `.through` with any
  library that expects a callback receiving the value to resolve. Those methods
  are bound to the *expression* instance so there is no need to force a scope
  when using them.


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

> Note: Actually `.test` may return `undefined` when resolving an asynchronous
  *expression*, however since Sinon doesn't have that concept it'll be coerced
  into a failed evaluation.


## Troubleshooting

### Logging

Sometimes you can't make sense of why something doesn't work and you want to
inspect the value it's receiving. Use `.log` to dump on the console the received
value, `.tap(func)` to apply your own logic or `.debugger` if you have an
interactive debugger in the environment.

```js
  ass(data).log.string;  // prints the value of data before asserting
```

### Marks

A common issue when testing, specially asynchronous code, is to be certain if
the tests actually passes all the assertions or are some code paths simply
not being executed.

The *marks* feature is designed to solve this case, it's composed of two
elements, the first is the `.mark` *expectation*, it just increments the marks
counter every time the *expression* is evaluated. The second is `ass.marks()`
which when called without arguments will reset a counter but when called with a
number will throw an error if it doesn't match the current value of the counter.

Here is a simplified example to see how they work:

```js
  // Simple way to reset the counter automatically for each test
  beforeEach(ass.marks);

  it('should detect if callback is called', function () {
    project.doWork(data, function (x) {
      ass(x).equal(true).mark;  // increases the counter when evaluated
    });

    ass.marks(1);   // If the callback didn't run it'll produce an error
  });
```

Now, if your test is more complicated and you need to somehow assert different
marks depending on some condition, you can call `ass.marks()` and it'll reset
the counter but also return the last count. But since we are using a *library of
highly composable matchers* lets do it in a more interesting and flexible way:

```js
  ass.marks( ass.above(3) );  // asserts that .mark was called 4 or more times
```

And finally, for instance in Mocha, to verify that an *asynchronous expression*
has properly executed:

```js
  beforeEach(function () {
    ass.marks();
    this.expected = 0;
  });

  afterEach(function () {
    ass.marks(this.expected, this.currentTest.title);
  });

  it('should evaluate an async expression or fail', function () {
    this.expected = 1;   // Here we are setting how many marks will be used
    return _(promise).resolves.string.equals('foo').mark;
  });
```
