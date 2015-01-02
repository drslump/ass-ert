# Interoperability

> **Note**: You can use `.result`, `.test`, `.assert` and `.through` with any
library that expects a callback receiving the value to resolve. Those methods
are bound to the *expression* instance so there is no need to force a scope
when using them.

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


### Sinon

Matchers expose a `.test` method returning a boolean value which make
them compatible with the [Sinon test doubles library](http://sinonjs.org).

```js
var callback = sinon.stub();
callback.withArgs(ass.string.contains('foo')).returns(true);
callback.withArgs(ass.has({
  foo: ass.number
})).returns(null);
```

> Note: Actually `.test` may return `undefined` when resolving an asynchronous
*expression*, however since Sinon doesn't have that concept it'll be coerced
into a failed evaluation.
