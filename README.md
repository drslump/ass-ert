# ass-ert

> Because **assert** and even **ass** were already taken!

**ass-ert** is a matchers library based on Hamcrest but offering
a *fluent-ish* inteface.

It tries to mix the best aspects of [jshamcrest]() with its highly
composable design featuring beautifully descriptive messages and
the easy on the eyes and the fingers of [chai]()'s fluent syntax
for defining assertions.

While the primary use case is testing it's by no means restricted
to it, use the matchers anywhere you may have a need for matching
complex data structures with ease.


## Coordination

As your data structures get more complex **ass** won't be left
behind. Coordinate assertions with **or**/**and** to fully express
the assertion by composition.

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

It's very common to work with collections (i.e. Arrays) so it should
be easy to match against them.

```js
ass(data).some.equal(10);   // At least one equals 10
ass(data).all.lessThan(20); // All of them are < 20
ass(data).none.empty;       // None of them is an empty value
```


## Mutating the subject

Often times we want to check a specific aspect of a value but when
doing the processing manually we will loose the nice error descriptions
given by the matchers.

**ass** integrates [LoDash]() to provide a powerful data manipulation
mechanism. These are the operations supported:

 - [size]()
 - [pluck]()
 - [max]()
 - ...

> **Note:** When the subject is mutated it stays that way for the following
  matchers in the chain. If you have other needs check the `.and` coordinator.


```js
ass(data).size.equal(10)       // a collection with a size of 10
ass.pluck('name').has('John')  // finds a person named John
```


## Interoperability

### Promises

By using `.then` and `.catch` we can attach matchers to the promise
which will only be evaluated once the promise gets resolved or
rejected.

> When working with [Mocha]() or [Jasmine 2.x]() we are allowed to
  return a promise from a test to have it consumed before the test
  is ended.

```js
var promise = $.get('http://google.com');
return ass(promise).then.string.contains('<body>');
```

### Sinon

Matchers expose a `.test` method returning a boolean value which make
them compatible with the [Sinon mocking library]().

```js
var callback = sinon.stub();
callback.withArgs(ass.string.contains('foo')).returns(true)
callback.withArgs(ass.has({
    foo: ass.number
})).returns(null);
```

## Troubleshooting

Sometimes you can't make sense of why something doesn't work and you
want to inspect the value it's receiving. Use `.log` to dump on the
console the received value, `.fn(func)` to apply your own logic or
`.debugger` if you have an interactive debugger in the environment.

```js
    ass(data).log.string;  // prints the value of data before asserting
```


