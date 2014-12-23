var _ = require('lodash');

var AssError = require('./error');
var util = require('./util');

var defProp = Object.defineProperty.bind(Object);

// An expectations chain, the core object of the library, allows to setup a
// set of expectations to be run at any point against a value.
function Chain (value) {
  if (!(this instanceof Chain)) {
    throw new Error('Ass Chain constructor called without new!');
  }

  // List of [ Expectation ]
  defProp(this, 'expectations', {
    value: [],
    enumerable: false,
    configurable: false,
    writable: false
  });

  // Custom description
  defProp(this, 'description', {
    value: '',
    enumerable: false,
    configurable: false,
    writable: true
  });

  // Support usage like: ass.string.help
  defProp(this, 'help', {
    get: function () {
      // TODO: Productize this and perhaps show help for the whole chain
      return this.expectations[0].help;
    }
  });

  value = arguments.length > 0 ? value : this.__GUARD__;
  defProp(this, 'value', {
    get: function () {
      return value;
    },
    set: function (v) {
      value = v;
    },
    enumerable: false,
    configurable: false
  });

  defProp(this, '__deferred__', {
    value: value === this.__GUARD__,
    enumerable: false,
    configurable: false,
    writable: true
  });

  // Support this use case: ass(value)._.some.number.above(5)._
  defProp(this, '_', {
    get: function getter() {
      if (!this.__deferred__) {
        this.__deferred__ = true;
      } else {
        this.__deferred__ = false;
        this.assert(this.value, getter);
      }
      return this;
    }
  });

  defProp(this, '__then__', {
    value: [],
    enumerable: false,
    configurable: false,
    writable: false
  });

  // Pointer to the current position in the iteration of expectations while
  // resolving the expression. This means that we can't resolve the same
  // expression in parallel since this state is shared. This will probably
  // be solved in the future, right now it could only affect the promise
  // matchers given Javascript's event loop design.
  defProp(this, '__offset__', {
    value: 0,
    enumerable: false,
    configurable: false,
    writable: true
  });


  // Seal the context to the methods so we can directly call them
  this.test = Chain.prototype.test.bind(this);
  this.assert = Chain.prototype.assert.bind(this);

  // Pass through assertion
  this.$ = function passthrough(actual) {
    this.assert(actual, passthrough);
    return actual;
  }.bind(this);
}

Chain.prototype = Object.create(null);
Chain.prototype.constructor = Chain;

// Guard token to detect valueless matchers
Chain.prototype.__GUARD__ = {
  valueOf: function () {
    return this.toString();
  },
  toString: function () {
    return '{{valueless}}';
  }
};


// Exposes a Promise/A interface for the expression, the intended use is for
// test runners supporting returning a promise from the test to wait until
// its completion.
// We don't actually implement the exact Promise/A algorithm, just a way to
// keep the promise chain running.
Chain.prototype.then = function (cb, eb) {
  if (this.__deferred__) {
    this.__then__.push([cb, eb]);
    return this;
  }

  // When not in deferred mode just assume that everything went well so we
  // basically just want to provide whatever value we have now. This will
  // help for instance when we return by mistake an expression in Mocha that
  // isn't really waiting on a promise.
  if (cb) {
    cb(this.value);
  }
  return this;
};

// When the promise matchers are activated from the promise they've been
// attached to, they must call this method so we regain control over the
// resolution of the chain and notify anyone that has registered to use
// using .then
Chain.prototype.thenResume = function (result, actual) {
  var queue = result ? 0 : 1;

  // Wrap failures with a nice AssError :)
  if (!result) {
    actual = this.buildError(actual, Chain.prototype.thenResume);
  }

  // Dispatch everyone who wanted to be notified
  while (this.__then__.length) {
    var callbacks = this.__then__.shift();
    if (callbacks[queue]) {
      callbacks[queue](actual);
    }
  }
};


// Builds an AssError for the current expression. It makes a couple of
// assumptions, for instance the .__offset__ must be placed just after the
// expectation that produced the failure of the chain.
Chain.prototype.buildError = function (actual, ssf) {
  var resolved = this.expectations.slice(0, this.__offset__);

  // Using quantifiers introduces duplicates for each iteration
  resolved = _.uniq(resolved);

  // Get the offending expectation (should be the last one)
  var exp = resolved.pop();

  var error = this.description + '\n\n';

  resolved.forEach(function (x) {
    var desc = x.getDescription();
    if (desc === null) {
      return;
    }
    error += ' \u001b[32mPassed:\u001b[0m ' + desc + '\n';
  });

  error += ' \u001b[31mFailed:\u001b[0m ' + exp.getDescription() + '\n';
  error += '    \u001b[33mBut:\u001b[0m ' + exp.getMismatch() + '\n';

  if (!util.doColors()) {
    error = util.unansi(error);
  }

  // TODO: showDiff should be used only when it makes sense perhaps
  //       we can pass null/undefined and let AssError detect when it
  //       makes sense.

  var expected = exp.expected;
  // Mocha will try to jsonify the expected value, just ignore if it's a function
  if (typeof expected === 'function') {
    expected = null;
  }

  return new AssError(error, actual, expected, true, ssf || arguments.callee);
};

// Resolves the current chain for a given value. If the resolved argument is
// given it'll be populated with all the expectations resolved on this run
// (stops on first failure). The result is always a boolean indicating the
// outcome.
// Note: named `test` to be compatible with Sinon's matchers.
Chain.prototype.test = function (actual, resolved) {
  if (arguments.length === 0) {
    actual = this.value;
  }

  // This is the core resolution algorithm, it operates over the chain of
  // expectations checking them one after the other against a value.
  // If a function is returned it'll be immediately called passing as only
  // argument the current resolver function, this allows an expectation to
  // override the value and/or control the end result of the resolution
  // without exposing too many internal details.
  // When it returns `undefined` is just means that it did not run any more
  // expectations, in other words, it was already at the end of the chain.
  // This can be used by matchers when taking over the resolution to know
  // if they need to mangle the results or they can just wait until there
  // are new expectations in the chain.
  function resolver (value) {
    var exp, result;

    result = undefined;
    for (var i = this.__offset__; i < this.expectations.length; i++) {
      exp = this.expectations[i];

      result = exp.resolve(value);

      this.__offset__ = i + 1;

      // Allow expectations to take control for the remaining of the chain
      if (typeof result === 'function') {
        return result.call(
          this,
          resolver.bind(this)
        );
      }

      // Stop on first failure
      if (result === false) {
        break;
      }
    }

    return result;
  }

  // Resolve the chain starting from root
  this.__offset__ = 0;
  var result = resolver.call(this, actual);
  return result === undefined ? true : result
};

// Performs the resolution of the chain but additionally will raise an error
// if it fails to complete.
// The `ssf` is StackTraceFunction, a reference to the first function to show
// on the stack trace on supported environments (V8).
Chain.prototype.assert = function (actual, ssf) {
  if (arguments.length === 0) {
    actual = this.value;
  }
  ssf = ssf || arguments.callee;

  // Just ignore if the actual value is not present yet
  // TODO: Shall it produce an error?
  if (actual === this.__GUARD__) return this;

  var result = this.test(actual);

  // It failed so report it with a nice error
  if (result === false) {
    throw this.buildError(actual, ssf);
  }

  return this;
};

Chain.prototype.valueOf = function () {
  return this.value;
};

Chain.prototype.toString = function () {
  if (this.description) {
    return this.description;
  }

  var descs = this.expectations
    .filter(function (c) { return c.getDescription(); })
    .map(function (c) { return c.getDescription(); });

  if (descs.length > 1) {
    return '(' + descs.join(', ') + ')';
  } else if (descs.length === 1) {
    return descs[0];
  } else {
    return '<Ass>';
  }
};


module.exports = Chain;
