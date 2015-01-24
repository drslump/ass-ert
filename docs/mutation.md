# Mutating the subject

Often times we want to check a specific aspect of a value but when doing the
processing manually we will loose the nice error descriptions given by *ass*
expressions.

**ass** integrates [LoDash](http://lodash.com) to provide a powerful data
manipulation mechanism with a known interface.

!!! hint
    When the subject is mutated it stays that way for the rest of the *expression*.
    If you have other needs check out the `.and` combinator.


```js
ass(data).size.eq(10)                // a collection with a size of 10
ass(data).pluck('name').has('Juan')  // contains a person named Juan!
```

While the *expression* resolves the *subject* value under test may mutate but
we can always get back the original by calling `.value`, if we're actually
interested in the mutated one we can access it with `.result()`.

```js
var data = 'abcdef';
ass(data).size.value === 'abcdef';
ass(data).size.result() === 6;
```
