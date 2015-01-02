# Mutating the subject

Often times we want to check a specific aspect of a value but when doing the
processing manually we will loose the nice error descriptions given by the
matchers.

**ass** integrates [LoDash](http://lodash.com) to provide a powerful data manipulation
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
ass(data).size.value === 'abcdef';
ass(data).size.mutation === 6;
```
