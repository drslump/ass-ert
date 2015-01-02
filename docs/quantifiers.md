# Quantifiers

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
