# Negation

When using `.not` in an *expression* we are not actually mutating the *subject*,
what it does is allow the resolver to continue and when a result has finally been
found it'll inverse it before we obtain it. It's indeed negating the result of the
*expression*.

```js
ass('foo').not.number;
// It even supports async expressions
ass(promise).not.resolves.string.equal('foo');
```

!!! caution
    Negating an initialized expression may produce unexpected effects, basically
    for synchronous initialized expressions the *evaluator* runs for every new
    expectation we attach to it.

```js
// This one won't work since .string is true and will be evaluated before
// we can reach the .equal that would resolve as false.
ass('foo').not.string.equal('bar')

// Here it works because we only have one expectation after .not
ass('foo').not.equal('bar')

// By using composition we can also work around it
ass('foo').not.eq( ass.string.equal('bar') )

// And obviously it's always possible to avoid using an initialized expression
ass.not.string.equal('bar').assert('foo')
```
