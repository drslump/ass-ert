# Failure messages

Right now, it's settled down on the following format, I think it offers a clear
view and has less corner cases than Hamcrest's almost natural language. Anyway,
this is still an open issue and will see some tuning since having very clear and
easily readable messages is a top priority.

!!! note
    This actually has colors: green for *Passed*, red for *Failed* and yellow
    for *But*, while inspected values are in cyan.

```bash
AssError:

 Failed: For every one:
   Passed: to be a number
   Failed: to be more than <3>
      But: was <1>

  >> ass([1,2,3]).all.number.above(3)

  at /Users/drslump/www/ass-ert/test.js:8:27
  at it (/Users/drslump/www/ass-ert/test.js:4:3)
  at Object.<anonymous> (/Users/drslump/www/ass-ert/test.js:7:1)
```

!!! note
    The printing of the source line that produced the error and the filtered
    stack trace is provided by the [Failure](https://github.com/drslump/failure)
    project. It's still kind of experimental but it should work fairly well on V8
    based engines and Firefox.

!!! attention
    In order to show the offending source line the code must be structured in a
    very specific way, it matches the pattern used by the describe/it DSL from
    most test frameworks, so it comes naturally when using *ass-ert* with them.
