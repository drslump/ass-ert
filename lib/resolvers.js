var _ = require('lodash');

// This is the core resolution algorithm, it operates over the chain of
// expectations checking them one after the other against a value.
// If a function is returned it'll be immediately called passing as only
// argument the current resolve function, this allows an expectation to
// override the value and/or control the end result of the resolution
// without exposing too many internal details.
// When it returns `undefined` is just means that it did not run any more
// expectations, in other words, it was already at the end of the chain.
// This can be used by matchers when taking over the resolution to know
// if they need to mangle the results or they can just wait until there
// are new expectations in the chain.
function resolver (value) {
  var list, offset, result, exp;

  list = this.chain.__expectations__;
  offset = this.done.length;
  result = undefined;
  for (var i = offset; i < list.length; i++) {
    // Create a new object inheriting from the expression but with the
    // current actual value provisioned. It allows the expression to mutate
    // its state for this execution but not affect other uses of it.
    exp = _.create(list[i], { actual: value });

    // Execute the expectation to obtain its result
    result = exp.resolve();

    // Keep track of resolved expectations
    this.done.push(exp);

    // Allow expectations to take control for the remaining of the chain
    if (typeof result === 'function') {
      return result.call(exp, this);
    }

    // Stop on first failure
    if (result === false) {
      break;
    }
  }

  return result;
}


// When resolving async flows (i.e.: promises) this will pause the given
// resolver until a call to .resume() is made.
function pause () {
  // First of all lock the resolver so we don't recycle it
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

  // When no override result is given let's continue resolving
  // Note: this() looks weird but remember we're using a function as context
  if (result === undefined) {
    result = this(actual)
  }

  // Unlock the resolver
  this.locks--;

  // When not failed but there are pending async tasks just keep waiting
  if (result !== false && this.locks > 0) {
    return;
  }

  // Generate a nice error for the failure
  if (result === false) {
    actual = chain.buildError(this.done, resume);
  }

  // Dispatch everyone who was waiting to be notified of the outcome
  // Note: We don't follow Promise/A semantics, the registered callbacks
  //       will be executed on each resolving phase!
  var queue = result === false ? 1 : 0;
  _.forEach(chain.__thens__, function (callbacks) {
    if (callbacks[queue]) {
      callbacks[queue](actual);
    }
  });
}

// Instantiates a new resolver functor
function factory () {
  // Just forwards the call to the resolver by setting itself as context.
  function fn (value) {
    return resolver.call(fn, value);
  }

  // The state is attached to the function object so it's available to the
  // state-less functions when running under `this.`.
  fn.locks = 0;
  fn.chain = null;
  fn.done = [];

  // Expose the pause/resume logic in the context
  fn.pause = pause;
  fn.resume = resume;

  return fn;
}


var pool = [];

exports.acquire = function (chain) {
  var resolver = pool.pop() || factory();

  // Reset the state of the resolver
  resolver.locks = 0;
  resolver.chain = chain;
  while (resolver.done.length > 0) {
    resolver.done.pop();
  }

  return resolver;
};

exports.release = function (resolver) {
  if (resolver.locks === 0) {
    pool.push(resolver);
  }
  return resolver.locks !== 0;
};
