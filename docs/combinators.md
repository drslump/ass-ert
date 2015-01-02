# Combinators

As your data structures get more complex **ass** won't be left behind.
Coordinate expressions with **or** / **and** to fully express the assertion by
composition.

!!! hint
    fluent *expectation* chaining is implicitly evaluated as **and**.

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
// Note: pluck mutates the value to be the one of the specific property for
//       all elements in the array.
ass(data).array.and(
  ass.size.above(10).below(100),
  ass.pluck('name').every.string.and(
    ass.not.empty,
    ass.match(/^[A-Z]/)
  ),
  ass.filter( ass.pluck('age').above(18) ).and(
    ass.size.is( ass.below(8) ),
    ass.all.prop('adult').true
  ).store(result, 'adults')  // this sets the intermediate value in result.adults
);
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
