# Troubleshooting

## Logging

Sometimes you can't make sense of why something doesn't work and you want to
inspect the value it's receiving. Use `.log` to dump on the console the received
value, `.tap(func)` to apply your own logic or `.debugger` if you have an
interactive debugger in the environment.

```js
ass(data).log.string;  // prints the value of data before asserting
```

For a finer control of the output we can supply a template to `.dump` that will
be interpolated using the current value.

```js
// Prints "X: 10, Y: 17"
ass(mouseevent).dump('X: ${pageX}, Y: ${pageY}')
// Prints "Value: foo"
ass('foo').dump('Value: ${this}')
```


## Marks

A common issue when testing, specially asynchronous code, is to be certain if
the tests actually pass all the assertions or are some code paths simply
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
highly composable matchers* let's do it in a more interesting and flexible way:

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
  return ass(promise).resolves.string.equals('foo').mark;
});
```
