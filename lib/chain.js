var _ = require('lodash');

var AssError = require('./error');

var defProp = Object.defineProperty.bind(Object);

// An expectations chain, the core object of the library, allows
// to setup a set of expectations to be run at any point with a
// value.
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

  // Seal the context to the methods so we can directly call them
  this.test = Chain.prototype.test.bind(this);
  this.assert = Chain.prototype.assert.bind(this);
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

// Resolves the current chain for a given value. If the resolved
// argument is given it'll be populated with all the expectations
// resolved on this run (stops on first failure). The result is
// always a boolean indicating the outcome.
// Note: named `test` to be compatible with Sinon's matchers.
Chain.prototype.test = function (actual, resolved) {
  if (arguments.length === 0) {
    actual = this.value;
  }

  // This is the core resolution algorithm, it operates over a list
  // of expressions checking them one after the other against a value.
  // If a function is returned it'll be immediately called passing
  // as only argument the same resolver function with the remaining
  // expectations argument already applied, this allows an expectation
  // to override the value and/or control the end result of the
  // resolution without exposing too many details.
  function resolver (expectations, value) {
    var exp, result;
    for (var i = 0; i < expectations.length; i++) {
      exp = expectations[i];

      // Keep track of what expectations have already been resolved
      resolved && resolved.push(exp);

      result = exp.resolve(value);

      // Allow expectations to take control of the remaining chain
      if (typeof result === 'function') {
        // Corner case where there are no more expectations waiting
        // to be resolved right now. In that case assume that the
        // expression was successful. ie: ass('foo').not.equal('bar')
        if (i === expectations.length - 1) {
          return true;
        }

        return result.call(
          this,
          resolver.bind(this, expectations.slice(i + 1))
        );
      }

      // Stop on first failure
      if (result === false) {
        return false;
      }
    }

    return true;
  }

  // Resolve the chain starting from root
  return resolver.call(this, this.expectations, actual);
};

// Default resolver to apply matchers over the subject value
Chain.prototype.assert = function (actual, ssf) {
  if (arguments.length === 0) {
    actual = this.value;
  }

  // Just ignore if the actual value is not present yet
  if (actual === this.__GUARD__) return this;

  var resolved = [];
  var result = this.test(actual, resolved);

  // It failed so report it with a nice error
  if (result === false) {

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
      error += ' \u001b[32mPassed:\u001b[39m ' + desc + '\n';
    });

    error += ' \u001b[31mFailed:\u001b[39m ' + exp.getDescription() + '\n';
    error += '    \u001b[33mBut:\u001b[39m ' + exp.getMismatch() + '\n';

    // TODO: showDiff should be used only when it makes sense perhaps
    //       we can pass null/undefined and let AssError detect when it
    //       makes sense.
    throw new AssError(error, actual, exp.expected, true, ssf || arguments.callee);
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
