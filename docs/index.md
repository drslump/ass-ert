# ass-ert documentation

**ass-ert** is a library of *composable* matchers offering a *fluent-ish* interface.

It tries to mix the best aspects of [Hamcrest](http://hamcrest.org/) with its
highly composable design, featuring beautifully descriptive messages, and the
easy on the eyes and the fingers of [chai](http://chaijs.com)'s fluent syntax
for defining assertions.

While the primary use case is testing it's by no means restricted to it, use
the matchers anywhere you may have a need for matching complex data structures
with ease.


## Some core concepts

Without going into the internals of the library, just to be able to understand
correctly the language in the documentation, these are some of terms and concepts
used:

- *Matcher*: abstract definition of some test (i.e. "equals something").
- *Expectation*: concrete instance of a *matcher* (i.e. "equals 10").
- *Expression*: chain of *expectations* (1 or more) that are evaluated from
left to right and stops on the first *expectation* that fails.
- *Resolver*: the algorithm that traverses an *expression* and produces a boolean
result from it.
- *Subject*: refers to the value we're testing the expression against.

Unless you want to create your own *matchers* the only concept you'll be working
with are *expressions*. An *expression* can have three possible results when
resolved:

- **true**: All the *expectations* were run and tested that the data was valid
- **false**: One of the *expectations* failed its test on the data. Since
*expressions* are short-circuited, not all the *expectations* are guaranteed
to have been tested, this is similar to most programming languages so it
should be a familiar behaviour (ie: `false && work()`, work is never executed).
- **undefined**: An asynchronous *expectation* (i.e. Promises) has taken control
of the *resolver* and it'll produce a true/false result at a later point via
the own *Promises/A* interface of the *expression*.
