# Failure messages

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
