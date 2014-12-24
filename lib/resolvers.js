var _ = require('lodash');

var util = require('./util');
var Promise = util.Promise;

// Use a capped pool, the releasing algorithm is pretty solid so we should
// have good a good re-use ratio with just a few in the pool. Then in case
// something goes wrong the GC will take care of it after a while.
var pool = util.CappedPool(100);
var created = 0;

// Instantiates a new resolver functor
function factory () {
  // Just forwards the call to the resolver by setting itself as context.
  function fn (value) {
    return resolver.call(fn, value);
  }

  created += 1;
  fn.id = created;

  // The state is attached to the function object so it's available to the
  // state-less functions when running under `this.`.
  fn.locks = 0;
  fn.chain = null;
  fn.resolved = [];
  fn.filters = [];
  fn.forks = [];

  // Expose the behaviour in the functor
  fn.pause = pause;
  fn.resume = resume;
  fn.filter = filter;
  fn.fork = fork;
  fn.merge = merge;
  fn.completed = completed;

  return fn;
}

// This is the core resolution algorithm, it operates over the chain
// of expectations checking them one after the other against a value.
// If a function is returned it'll be immediately called using the
// expectation instance as context and passing as only argument the
// current resolve function, this allows an expectation to override
// the value and/or control the resolution without exposing too many
// internal details.
// When it returns `undefined` it just means that it the resolution
// was paused (async) or did not run any more expectations, in other
// words, it was already at the end of the chain. This can be used
// by matchers when taking over the resolution to know if they need
// to mangle the results or they can just wait until there are new
// expectations in the chain.
function resolver (value) {
  var list, offset, result, exp;

  list = this.chain.__expectations__;
  offset = this.resolved.length;
  result = undefined;
  for (var i = offset; i < list.length; i++) {
    // Create a new object inheriting from the expression but with the
    // current actual value provisioned. It allows the expression to mutate
    // its state for this execution but not affect other uses of it.
    exp = _.create(list[i], { actual: value });

    // Keep track of resolved expectations
    this.resolved.push(exp);

    // Execute the expectation to obtain its result
    result = exp.resolve();

    // Allow expectations to take control for the remaining of the chain
    if (typeof result === 'function') {
      // Since the control is delegated to the expression we don't have to
      // do anything more here.
      return result.call(exp, this);
    }

    // Stop on first failure
    if (result === false) {
      break;
    }
  }

  this.locks--;

  // At this point we just need to apply any pending filters
  result = this.filter(result);

  // TODO: When not going via the `resume()` path we should also notify
  //       any subscribers to __thens__

  return result;
}


// When resolving async flows (i.e.: promises) this will pause the given
// resolver until a call to .resume() is made.
function pause () {
  // First of all lock the resolver so we don't recycle it
  // TODO: This needs to be reviewed, the locks should only be useful for
  //       multiple async flows in a single chain, which is probably weird
  //       and if difficult shouldn't be supported, just detected and notified.
  this.locks++;

  // As soon as one of the expectations ask us to pause we force the chain
  // to act as deferred. This is basically a hack though!
  this.chain.__deferred__ = true;
}

// Once the async flow has completed we can continue resolving where we
// stoped. When the override param is not undefined we'll skip calling the
// resolver and assume that bool as actual result. This allows the async
// code to shortcut the resolver.
// When the last async flow has completed any promise callbacks attached
// to the chain will be run.
function resume (actual, override) {
  var chain = this.chain,
      result = override;

  // Unlock the resolver
  this.locks--;

  // When no override result is given let's continue resolving
  // Note: this() looks weird but remember we're using a function as context
  if (result === undefined) {
    result = this(actual);
  // Otherwise apply the final result filters
  } else {
    result = this.filter(result);
  }

  // Bail out if we're still not ready for a complete resolve
  if (result === undefined) {
    return;
  }

  // When not failed but there are pending async tasks just keep waiting
  if (result !== false && this.locks > 0) {
    return;
  }

  // Generate a nice error for the failure
  if (result === false) {
    actual = chain.buildError(this.resolved, resume);
  } else {
    actual = this.chain.value;
  }

  // Dispatch everyone who was waiting to be notified of the outcome
  var thens = this.chain.__thens__;
  if (thens.length) {
    // Create a promise that rejects immediately with a failure error or
    // resolves with the last mutated value.
    var promise = new Promise(function (resolve, reject) {
      // Calling resolve() with a promise will attach itself to the promise
      // instead passing it as a simple value. To avoid that we detect the
      // case and wrap it in an array.
      if (actual && typeof actual.then === 'function') {
        actual = [
          'Ass: Value wrapped in an array since it looks like a Promise',
          actual
        ];
      }

      (result ? resolve : reject)( actual );
    });
    // Attach all the registered thens to the promise so they get notified
    _.forEach(thens, function (callbacks) {
      promise = promise.then.apply(promise, callbacks);
    });
  }
}

// Clones the current resolver so we can fork operations.
// Note: Do not release forks, they'll be automatically
// recalled for the pool once the main resolver is released.
function fork () {
  var fork = acquire(this.chain);
  fork.resolved = this.resolved.slice(0);
  return fork;
}

// Assume the results of a fork in the main resolver
function merge (fork) {
  // TODO: Is the array copying necessary?
  this.resolved = fork.resolved.slice(0);
}


function filter(result) {
  if (typeof result === 'function') {
    this.filters.push(
      util.bind(result, _.last(this.resolved))
    );
    return;
  }

  while (result !== undefined && this.filters.length > 0) {
    result = this.filters.pop()(result);
  }

  // When a final result is obtained release the resolver to the pool
  if (result !== undefined) {
    // TODO: Do we need to take into account .locks ????
    pool.push(this);
    if (pool.length > created) {
      throw new Error('Pool corrupted! Created ' + created + ' and there are ' + pool.length + ' pooled');
    }
  }

  return result;
}

// Tells if the resolver is currently completed, that is, there
// are no more expectations to resolve right now.
function completed () {
  return this.resolved.length === this.chain.__expectations__.length;
}


// Acquires a resolver functor, if there is one in the pool it'll be reset and
// reused, otherwise it'll create a new one. When you're done with the resolver
// you shoud give it to `release()` so it can be incorporated to the pool.
// The reason for using a pool of objects here is that every time we evaluate
// an expression we'll need a resolver, when using quantifiers multiple forks
// will be created, so it's important to improve the performance.
function acquire (chain) {
  var resolver = pool.pop() || factory();

  // Reset the state of the resolver
  resolver.locks = 0;
  resolver.chain = chain;
  while (resolver.resolved.length > 0) {
    resolver.resolved.pop();
  }
  while (resolver.filters.length > 0) {
    resolver.filters.pop();
  }

  return resolver;
};


exports.acquire = acquire;
