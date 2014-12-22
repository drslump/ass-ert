!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ass=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var Chain = require('./chain');
var Matcher = require('./matcher');
var AssError = require('./error');
var util = require('./util');
var should = require('./should');


var defProp = Object.defineProperty.bind(Object);


// TODO: Detect support for Proxy and offer suggestions like pyshould



// Public interface
function ass (value) {
  if (arguments.length === 0) {
    return new Chain();
  }
  return new Chain(value);
}

// Deferred factory
ass._ = function (value) {
  return new Chain(value)._;
}

// Global registry of matchers (used for ass.help)
ass.matchers = [];

// ass.help dumps the help of each matcher registered
defProp(ass, 'help', {
  get: function () {
    var s = '';
    _.forEach(ass.matchers, function (matcher) {
      // TODO: This can be nicer
      var fn = matcher.test.toString();
      var args = fn.replace(/^function\s*\(([^\)]*)\)[\S\s]*/, '$1');
      args = args.split(',').map(function (x) { return x.trim(); });
      args.shift();
      fn = args.length ? ' (' + args.join(', ') + ')' : '';

      s += '> .' + matcher.name + fn + '\n\n';
      s += '  ' + matcher.help.replace(/\n/g, '\n  ');
      s += '\n\n';
    });
    return s;
  }
});

// TODO: Review if changing the semi-standard order of (cond, message) is a good idea
ass.ok = function (message, cond) {
  if (arguments.length === 1) {
    cond = message;
    message = 'expected a truish value';
  }
  return ass.desc(message).truthy.assert(cond);
};

ass.ko = function (message, cond) {
  if (arguments.length === 1) {
    cond = message;
    message = 'expected a falsy value';
  }
  return ass.desc(message).falsy.assert(!cond);
};

// Resets or verifies the number of marks so far
ass.checkmarks = function (expected, desc) {
  if (typeof expected === 'undefined') {
    expected = ass.checkmarks.counter;
    ass.checkmarks.counter = 0;
    return expected;  // return back how many there were
  }

  ass.desc(desc || 'ass.checkmarks').eq(expected).assert(
    ass.checkmarks.counter, ass.checkmarks
  );
};
ass.checkmarks.counter = 0;


// Helper to register new matchers in the registry
ass.register = function (name, matcher) {
  if (name instanceof Matcher) {
    matcher = name;
    name = matcher.name;
  } else if (typeof name === 'object') {
    Object.keys(name).forEach(function (key) {
      ass.register(key, name[key]);
    });
    return;
  } else {  // Assume a descriptor was given
    // Create the aliases first
    _.forEach(matcher.aliases, function (alias) {
      ass.register(new Matcher(alias, matcher));
    });

    matcher = new Matcher(name, matcher)
  }

  // Keep the matcher around for ass.help
  ass.matchers.push(matcher);


  // TODO: Allow matchers to be overridden and also overloaded
  //       if they have an "overload" method it can be used
  //       to check which one should be used.
  //       Better Idea (I think), instead of overloading based
  //       on the value under test, which may produce issues
  //       since we don't know for sure what that value is,
  //       allow matchers to introduce a new "prototype" for
  //       the chain, that is, a .dom matcher will include
  //       all the core expectations but then also overrides
  //       and new ones until the end of the chain.


  // Matcher functions with a single argument are getters
  var fnKey = matcher.arity === 1 ? 'get' : 'value';
  var prop = {
    configurable: false,
    enumerable: true
  };
  if (fnKey === 'value') {
    prop.writable = false;
  }

  // Augment the Chain prototype
  prop[fnKey] = function fn () {
    // TODO: Verify the arity of the matcher versus the call
    var exp = matcher.expectation.apply(matcher, arguments);
    this.expectations.push(exp);
    if (!this.__deferred__) {
      this.assert(this.value, fn);
    }
    return this;
  };

  defProp(Chain.prototype, name, prop);

  // Augment the static interface
  prop[fnKey] = function () {
    var match = new Chain();

    if (fnKey === 'get') {
      return match[name];
    }

    return match[name].apply(match, arguments);
  };

  defProp(ass, name, prop);

  // Pass through for chains
  prop[fnKey] = function passthrough() {
    return this[name].assert(this.value, passthrough).valueOf();
  };
  prop.enumerable = false;
  defProp(Chain.prototype, '$' + name, prop);

  // Pass through static constructor
  defProp(ass, '$' + name, {
    value: function (value) {
      if (fnKey === 'get') {
        return ass(value)['$' + name];
      }

      // Create a new expression for the expectation
      var chain = ass();
      chain[name].apply(chain, arguments);
      // Return a callable that asserts upon receiving a value
      return function fn (actual) {
        chain.assert(actual, fn);
        return actual;
      }
    },
    enumerable: false
  });

};



// Override lodash's default createCallback mechanism to make it understand
// about our matchers (this should solve pluck/map/filter/...).
// TODO!!!!!!!!!!!!!!
// _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
//   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
//   return !match ? func(callback, thisArg) : function(object) {
//     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
//   };
// });


// Bundle some of the internal stuff with the ass function
ass.Chain = Chain;
ass.Error = AssError;

// Forward the should installer
ass.should = function (name) {
  should(name);
  return ass;
};
ass.should.restore = should.restore;

module.exports = ass;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./chain":2,"./error":4,"./matcher":6,"./should":7,"./util":8}],2:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./error":4}],3:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var ass = require('./ass');

// Set of default matchers
ass.register({
  desc: {
    help: 'Provide a custom description for reported failures',
    desc: null,  // Skip it from reports
    test: function (actual, desc) {
      // Since the returned function will be executed on the chain
      // context we can set then the description. Although this means
      // that it won't be set until the chain is actually resolved.
      return function (resolver) {
        this.description = desc;
        return resolver(actual);
      };
    }
  },

  // Ignored matchers
  to: {
    aliases: [ 'a', 'an', 'be' ],
    help: [
      'Just some syntax sugar to make the expectations easier on',
      'the eyes.'
    ],
    desc: null,
    test: function (actual) {
      return true;
    }
  },

  mark: {
    help: [
      'Increases the global `ass.marks` counter every time it gets',
      'evaluated as part of an expression. Use it to verify that the',
      'expectations are actually being executed.',
      'An easy way to support this when using a test runner is to reset',
      'the counter by calling `ass.marks()` on a beforeEach hook and',
      'then verify at the end of test with `ass.marks(N)` (where N is',
      'the number of marks you expected).'
    ],
    desc: null,
    test: function (actual) {
      ass.checkmarks.counter += 1;
      return true;
    }
  },

  // Just allow anything :)
  any: {
    help: 'Allows any value without testing it',
    desc: 'is anything',
    test: function (actual) {
      return true;
    }
  },
  // Anything that isn't null or undefined
  defined: {
    help: 'Checks if the value is not null or undefined',
    desc: 'is defined',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual != null;
    }
  },
  // Check if the value is empty
  empty: {
    help: 'Checks if the value is empty (has a length of 0)',
    desc: 'is empty',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual != null && actual.length > 0;
    }
  },
  nonEmpty: {
    help: 'Checks if the value is not empty (has a length greater than 0)',
    desc: 'is not empty',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual == null || actual.length === 0;
    }
  },
  truthy: {
    aliases: [ 'truish' ],
    help: 'The value should be truthy (not undefined, null, 0, "" or [])',
    desc: 'is truthy',
    fail: 'was ${ actual }',
    test: function (actual) {
      if (!actual) return false;
      return typeof actual.length === 'number' ? actual.length > 0 : true;
    }
  },
  falsy: {
    help: 'The value should be falsy (undefined, null, 0, "" or [])',
    desc: 'is falsy',
    fail: 'was ${ actual }',
    test: function (actual) {
      if (!actual) {
        return false;
      }
      return typeof actual.length === 'number' ? actual === 0 : true;
    }
  },

  // Coordination
  and: {
    help: [
      'Composes a new matcher from two or more of them, which will only',
      'succeed if all the matchers that form it do succeed'],
    desc: '(${ args.join(") AND (") })',
    fail: 'was {{ actual }}',
    test: function (actual, branch1, branch2) {
      var branches = _.toArray(arguments).slice(1);
      return function (resolver) {
        return _.every(branches, function (branch) {
          return branch.test(actual);
        });
      };
    }
  },
  or: {
    help: [
      'Composes a new matcher from two or more of them, which will only',
      'succeed if at least one of the matchers does'],
    desc: '(${ args.join(") OR (") })',
    fail: 'was {{actual}}',
    test: function (actual, branch1, branch2) {
      var branches = _.toArray(arguments).slice(1);
      return function (resolver) {
        return _.some(branches, function (branch) {
          return branch.test(actual);
        });
      };
    }
  },

  // Negation
  not: {
    help: 'Negates the result for the rest of the expression.',
    desc: 'Not!',
    fail: 'was {{actual}}',
    test: function (actual) {
      // TODO: Negation doesn't work very well with chains already
      //       having a value. To solve it perhaps it's better to
      //       produce a descriptive error on the .not getter with
      //       alternatives on how to work with negation.
      //       Perhaps we can allow .not.matcher but raise an error
      //       if it's .not.matcher.matcher.

      // Returning a resolver wrapper, we can then either modify
      // the result or the value feed into the parent resolver
      return function (resolver) {
        return !resolver(actual);
      };
    }
  },

  // Quantifiers
  every: {
    aliases: [ 'all', 'allOf' ],
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'all of them succeed'],
    desc: 'For every one:',
    fail: 'at least one didn\'t',
    test: function (actual) {
      return function (resolver) {
        return _.every(actual, resolver);
      };
    }
  },
  some: {
    aliased: [ 'anyOf' ],
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'at least one of them succeeds'],
    desc: 'At least one:',
    fail: 'none did',
    test: function (actual) {
      return function (resolver) {
        return _.some(actual, resolver);
      };
    }
  },
  none: {
    aliases: [ 'noneOf' ],
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'none of them succeed.'
    ],
    desc: 'None of them:',
    fail: 'at least one did',
    test: function (actual) {
      return function (resolver) {
        return !_.some(actual, resolver);
      };
    }
  },

  // Promises
  promise: {
    help: [
      'Verifies that the value is a promise (Promise/A+) but does not attach the',
      'the chain of matchers to its resolution like `resolves` or `rejects`,',
      'instead the original promise value is still the subject for the next',
      'matchers.'],
    desc: 'to be a promise',
    fail: 'got ${ actual }',
    test: function (actual) {
      return actual && typeof actual.then === 'function';
    }
  },

  // TODO: How can we support test runners consuming promises if the name
  //       here is "then"? The only solution seems to be using "resolves"/"rejects"
  // TODO: The current design seems to work for unresolved promises but
  //       when the promise is already resolved (and they are sync like in tests)
  //       will the matchers attached to the fork be evaluated?
  resolves: {
    help: [
      'Attach the matcher to a promise value (Promises/A+) to continue applying',
      'the chain of matchers once the promise has been resolved, mutating the',
      'value to the resolved one.',
      'It will fail if the value is not a promise (no .then method) or the promise',
      'is actually rejected.'],
    desc: 'to be a resolved promise',
    fail: 'was rejected',
    test: function (actual) {
      if (!actual || typeof actual.then !== 'function') {
        return 'is not a promise: ${actual}';
      }

      // TODO: The async nature of promises could be a problem since expectations
      //       have some state while they execute.
      return function (resolver) {
        actual.then(resolver, _.constant(false));
      };
    }
  },
  rejects: {
    help: [
      'Attach the matcher to a promise value (Promises/A+) to continue applying',
      'the chain of matchers once the promise has been rejected, mutating the',
      'value to the rejected error.',
      'It will fail if the value is not a promise (no .then method) or the promise',
      'is actually resolved.'],
    desc: 'to be a rejected promise',
    fail: 'was resolved',
    test: function (actual, expected) {
      if (!actual || typeof actual.then !== 'function') {
        return 'is not a promise: ${actual}';
      }

      return function (resolver) {
        actual.then(_.constant(false), resolver);
      };
    }
  },

  is: {
    aliases: [ 'equal', 'equals' ],
    help: 'Checks strict equality between the value and its expected.',
    desc: 'to strictly equal {{expected}}',  // TODO: expected is an alias for args[1]
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return actual === expected;
    }
  },
  eq: {
    aliases: [ 'eql', 'eqls' ],
    help: 'Checks deep non-strict equality between the value and its expected.',
    desc: 'to equal {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return this.equals(actual, expected);
    }
  },

  above: {
    aliases: [ 'gt', 'moreThan', 'greaterThan' ],
    help: 'Checks if the value is higher than its expected.',
    desc: 'to be more than ${expected}',
    fail: 'was ${actual}',
    test: function (actual, expected) {
      return actual > expected;
    }
  },

  below: {
    aliases: [ 'lt', 'lessThan' ],
    help: 'Checks if the value is lower tha its expected.',
    desc: 'to be less than ${expected}',
    fail: 'was ${actual}',
    test: function (actual, expected) {
      return actual < expected;
    }
  },

  aboveOrEqual: {
    aliases: [ 'gte', 'moreThanOrEqual', 'greaterThanOrEqual' ],
    help: 'Checks if the value is higher or equal than its expected.',
    desc: 'to be more than or equal to ${expected}',
    fail: 'was ${actual}',
    test: function (actual, expected) {
      return actual >= expected;
    }
  },

  belowOrEqual: {
    aliases: [ 'lte', 'lessThanOrEqual' ],
    help: 'Checks if the value is lower or equal than its expected.',
    desc: 'to be less than or equal to ${expected}',
    fail: 'was ${actual}',
    test: function (actual, expected) {
      return actual <= expected;
    }
  },

  instanceof: {
    aliases: [ 'instanceOf', 'instance', 'isa' ],
    help: 'Checks if the value is an instance of the given constructor',
    desc: 'to be an instance of ${expected}',
    test: function (actual, expected) {
      return actual instanceof expected;
    }
  },

  typeof: {
    help: 'Checks if the value is of a specific type',
    desc: 'to have type ${expected}',
    fail: 'had ${ typeof actual }',
    test: function (actual, expected) {
      return this.equals(typeof actual, expected);
    }
  },
  number: {
    help: 'Check if the value is a number (different of NaN).',
    desc: 'to be a number',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isNumber(actual) && !isNaN(actual);
    }
  },
  bool: {
    aliases: [ 'boolean' ],
    help: 'Check if the value is a boolean.',
    desc: 'to be a boolean',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isBoolean(actual);
    }
  },
  string: {
    aliases: [ 'str' ],
    help: 'Check if the value is a string.',
    desc: 'to be a string',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isString(actual);
    }
  },
  object: {
    help: 'Check that value is of type object.',
    desc: 'to be an object',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isObject(actual);
    }
  },
  plainObject: {
    aliases: [ 'plain', 'obj' ],
    help: 'Checks that value is an object created by the Object constructor.',
    fail: 'was ${actual}',
    test: function (actual) {
      return _.isPlainObject(actual);
    }
  },
  array: {
    help: 'Check that value is an Array.',
    desc: 'to be an Array',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isArray(actual);
    }
  },
  function: {
    help: 'Check that value is a Function.',
    desc: 'to be a Function',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isFunction(actual);
    }
  },
  regexp: {
    help: 'Check that value is a RegExp',
    desc: 'to be a RegExp',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isRegExp(actual);
    }
  },
  date: {
    help: 'Check that value is a Date',
    desc: 'to be a Date',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isDate(actual);
    }
  },
  element: {
    help: 'Check that value is a DOM element',
    desc: 'to be a DOM element',
    test: function (actual) {
      return _.isElement(actual)
    }
  },
  error: {
    help: 'Check that value is an error (or looks like it)',
    desc: 'to be an Error',
    test: function (actual) {
      if (actual instanceof Error) {
        return true;
      }
      return _.isObject(actual) && _.isString(actual.name) && _.isString(actual.message);
    }
  },

  undefined: {
    help: 'Check that value is undefined.',
    desc: 'to be undefined',
    fail: 'was ${ actual }',
    test: function (actual) {
      return _.isUndefined(actual);
    }
  },
  null: {
    help: 'Check that value is null.',
    desc: 'to be null',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual !== null;
    }
  },
  NaN: {
    help: 'Check that value is NaN.',
    desc: 'to be NaN',
    test: function (actual) {
      if (_.isNumber(actual)) {
        this.fail = 'was ${actual}';
      } else {
        this.fail = 'had type ${typeof actual}';
      }
      return isNaN(actual);
    }
  },
  true: {
    help: 'Check that value is true',
    desc: 'to be true',
    fail: 'was ${ actual }',
    test: function (actual) {
      if (_.isBoolean(actual)) {
        this.fail = 'was ${actual}';
      } else {
        this.fail = 'had type ${typeof actual}';
      }

      return actual === true;
    }
  },
  false: {
    help: 'Check that value is false',
    desc: 'to be false',
    test: function (actual) {
      if (_.isBoolean(actual)) {
        this.fail = 'was ${actual}';
      } else {
        this.fail = 'had type ${typeof actual}';
      }

      return actual === false;
    }
  },

  // TODO: THIS IS WRONG, WE WANT TO CHECK VALUES NOT KEYS
  has: {
    help: 'Check if the value has one or more specified items',
    desc: 'to have property ${expected}',
    test: function (actual, expected) {
      if (!_.isObject(actual)) {
        return 'was ${actual}';
      }

      // TODO: Offer better failure message
      this.fail = 'did not have all of them';

      var args = _.toArray(arguments).slice(1);
      return _.every(args, function (x) { return x in actual; });
    }
  },
  hasOwn: {
    aliases: [ 'contains', 'hasKey', 'hasIndex' ],
    help: [
      'Check if the value has one or more own properties as defined by',
      'the given arguments.'
    ],
    desc: 'to have own property ${ expected }',  // TODO: Can we support multiple args?
    test: function (actual, expected) {
      if (!_.isObject(actual)) {
        return 'was ${actual}';
      }

      this.fail = 'only had ${ _.keys(actual) }';

      // TODO: Offer better failure message
      var args = _.toArray(arguments).slice(1);
      return _.every(args, function (x) { return _.has(actual, x); });
    }
  },

  log: {
    help: [
      'Dumps the received value to the console.'
    ],
    desc: null,
    test: function (actual) {
      console.log('[ASS]', actual);
      return true;
    }
  },
  debugger: {
    help: [
      'Halts script execution by triggering the interactive debugger.'
    ],
    desc: null,
    test: function (actual) {
      debugger;
      return true;
    }
  },
  fn: {
    help: [
      'Calls the provided function with the current value as argument.',
      'If the function returns something different to *undefined* the',
      'expression will fork to operate on the returned value.'
    ],
    desc: 'call ${args[1]}',
    test: function (actual, fn) {
      var result = fn(actual);
      if (typeof result !== 'undefined') {
        return this.mutate(result);
      }
      return true;
    }
  },


  size: {
    help: [
      'Forks the expectation to operate on the size of the current value.'
    ],
    desc: 'get size',
    fail: 'not has a length: ${ actual }',
    test: function (actual) {
      if (_.isObject(actual) || _.isArray(actual) || _.isString(actual)) {
        return this.mutate(_.size(actual));
      }

      return false;
    }
  },
  prop: {
    aliases: [ 'key', 'property' ],
    help: [
      'Forks the expectation to operate on one of the value properties.'
    ],
    desc: 'get property {{ arg1 }}',
    fail: 'was not found on {{ actual }}',
    test: function (actual, key) {
      if (_.isObject(actual) && key in actual) {
        return this.mutate(actual[key]);
      }
      return false;
    }
  },
  index: {
    help: [
      'Forks the expectation to operate on one of the indexed values from',
      'the current value.'
    ],
    desc: 'get index {{ arg1 }}',
    test: function (actual, idx) {
      if (!_.isArray(actual) && !_.isString(actual)) {
        return 'not an array or a string: ${actual}';
      }
      if (idx < 0 || idx >= actual.length) {
        return 'out of bounds for ${actual}';
      }

      return this.mutate(actual[idx]);
    }
  },

  slice: {
    help: [
      'Extracts a portion from the value.'
    ],
    desc: 'slice(${args[0]}, ${args[1]})',
    test: function (actual, start, end) {
      return this.mutate(
        _.toArray(actual).slice(start, end)
      );
    }
  },

  filter: {
    help: [
      'Iterates over elements of collection, forking the expectation to operate',
      'on an array with all the elements for which the callback returned truthy',
      'for.',
      'See: https://lodash.com/docs#filter'
    ],
    test: function (actual, callback, thisArg) {
      return this.mutate(
        _.filter(actual, callback, thisArg)
      );
    }
  },
  reject: {
    help: [
      'Iterates over elements of collection, forking the expectation to operate',
      'on an array with all the elements for which the callback returned falsy',
      'for (the opposite of .filter).',
      'See: https://lodash.com/docs#reject'
    ],
    test: function (actual, callback, thisArg) {
      return this.mutate(
        _.reject(actual, callback, thisArg)
      );
    }
  },

  where: {
    help: [
      'Performs a deep comparison of each element in a collection to the given',
      'properties object, forking the expectation to operate on an array of all',
      'elements that have equivalent property values.',
      'See: https://lodash.com/docs#where'
    ],
    desc: 'where ${args[1]}',
    test: function (actual, props) {
      // TODO: We need to support composable matchers in the comparison!!!!
      return this.mutate(
        _.where(actual, props)
      );
    }
  },

  map: {
    help: [
      'Forks the expectation to operate on an array holding the results of',
      'invoking the callback for each element in the current collection.',
      'See: https://lodash.com/docs#map'
    ],
    test: function (actual, callback, thisArg) {
      return this.mutate(
        _.map(actual, callback, thisArg)
      );
    }
  },
  invoke: {
    help: [
      'Forks the expectation to operate on an array holding the results of',
      'invoking the method named by the argument for each element in the',
      'current collection.',
      'See: https://lodash.com/docs#invoke'
    ],
    desc: "invoke .${arg1}()",
    test: function (actual, methodName, arg) {
      return this.mutate(
        _.invoke.apply(_, arguments)
      );
    }
  },

  pluck: {
    help: [
      'Forks the expectation to operate on an array holding the value for',
      'the specified property from all elements in the current collection.',
      'See: https://lodash.com/docs#pluck'
    ],
    desc: 'pluck(${args[1]})',
    test: function (actual, prop) {
      return this.mutate(
        _.pluck(actual, prop)
      );
    }
  },

  first: {
    aliases: [ 'head' ],
    help: [
      'TODO',
      'See: https://lodash.com/docs#first'
    ],
    desc: 'get first element',
    test: function (actual) {
      return this.mutate(
        _.head(actual)
      );
    }
  },
  last: {
    help: [
      'TODO',
      'See: https://lodash.com/docs#last'
    ],
    test: function (actual) {
      return this.mutate(
        _.last(actual)
      );
    }
  },
  rest: {
    aliases: [ 'tail' ],
    help: [
      'TODO',
      'See: https://lodash.com/docs#rest'
    ],
    test: function (actual) {
      return this.mutate(
        _.tail(actual)
      );
    }
  },

  min: {
    help: [
      'Forks the expectations to operate on the minimum value found on the',
      'current collection.',
      'See: https://lodash.com/docs#min'
    ],
    test: function (actual, callback, thisArg) {
      return this.mutate(
        _.min(actual, callback, thisArg)
      );
    }
  },
  max: {
    help: [
      'Forks the expectations to operate on the maximum value found on the',
      'current collection.',
      'See: https://lodash.com/docs#max'
    ],
    test: function (actual, callback, thisArg) {
      return this.mutate(
        _.max(actual, callback, thisArg)
      );
    }
  }


});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./ass":1}],4:[function(require,module,exports){
var unansi = require('./util').unansi;

// API compatible with https://github.com/chaijs/assertion-error/
// This should make integration with Mocha work, including diffed
// output.
function AssError (message, actual, expected, showDiff, ssf) {
  this.message = message;

  this.actual = actual;
  this.expected = expected;

  this.showDiff = showDiff || false;

  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(this, ssf || arguments.callee);
  } else {
    this.stack = (new Error(message)).stack;
  }
};
AssError.prototype = Object.create(Error.prototype);
AssError.prototype.constructor = AssError;
AssError.prototype.name = 'AssError';

// Implement filtering API
AssError.prototype.filterStackTrace = function (frames) {
  return frames.filter(function (frame) {
    return !/AssError|assert/.test(frame.getFunctionName());
  });
};

AssError.prototype.toJSON = function (stack) {
  var props = {
    name: this.name,
    message: unansi(this.message),
    actual: this.actual,
    expected: this.expected,
    showDiff: this.showDiff
  };

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};


module.exports = AssError;

},{"./util":8}],5:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var Chain = require('./chain');
var template = require('./util').template;


// Expectation represents an instantiated Matcher already
// configured with any additional arguments.
function Expectation (matcher, args) {
  this.matcher = matcher;
  this.fail = matcher.fail;  // fail message can be overridden
  this.args = args || [];
  this.expected = args[0];

  // TODO: Move this to the template?
  this.args.forEach(function (arg, idx) {
      this['arg' + (idx + 1)] = arg;
  }, this);

  this.actual = undefined;
};

Expectation.prototype = Object.create(null);
Expectation.prototype.constructor = Expectation;

Object.defineProperty(Expectation.prototype, 'help', {
  get: function () {
    return this.matcher.help;
  }
});

// Helper to check if a value passes the expectation, it takes care
// of inspecting the expected value and detect if it's a matcher.
// Otherwise it uses loose equality between the values.
Expectation.prototype.equals = function (actual, expected) {
  return _.isEqual(actual, expected, function (a, b) {
    if (b instanceof Chain) {
      return expected.test(a);
    }
    return _.isEqual(a, b);
  });
};

// Helper to mutate the value under test
Expectation.prototype.mutate = function (actual) {
  return function (resolver) {
    return resolver(actual);
  };
};

Expectation.prototype.resolve = function (actual) {
  // Restore the matcher default fail message
  this.fail = this.matcher.fail;

  // TODO: This mutation of the instance will be avoided when
  //       there is an more elaborate mechanism for applying the
  //       templates
  this.actual = actual;
  this.args.unshift(actual);
  try {

    var result = this.matcher.test.apply(this, this.args);

    // Returning a string overrides the mismatch description
    if (typeof result === 'string') {
      this.fail = result;
      result = false;
    }

    return result;

  } finally {
    this.args.shift();  // remove the actual value from args
  }
};

Expectation.prototype.getDescription = function () {
  if (!this.matcher.desc) {
    return null;
  }
  return template(this.matcher.desc, this);
};

Expectation.prototype.getMismatch = function () {
  return template(this.fail, this);
};

Expectation.prototype.toString = function () {
  return this.getDescription();
};


module.exports = Expectation;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./chain":2,"./util":8}],6:[function(require,module,exports){
// The Matcher object is a descriptor for the matching logic
// but cannot be used directly.

var Expectation = require('./expectation');


function Matcher (name, descriptor) {

  // Shortcut for simple test functions
  if (typeof descriptor === 'function') {
    descriptor = {test: descriptor};
  }

  this.name = name;

  if (Array.isArray(descriptor.help)) {
    this.help = descriptor.help.join('\n');
  } else {
    this.help = descriptor.help || 'Not available';
  }

  this.desc = descriptor.desc !== undefined
            ? descriptor.desc
            : this.name

  this.fail = descriptor.fail || 'was ${ actual }';

  this.test = descriptor.test || function (actual) { return false; }

  this.arity = descriptor.arity !== undefined
             ? descriptor.arity
             : this.test.length;
};

Matcher.prototype = Object.create(null);
Matcher.prototype.constructor = Matcher;

Matcher.prototype.clone = function () {
  return new this.constructor(this.name, {
    help: this.help,
    desc: this.desc,
    fail: this.fail,
    test: this.test
  });
};

// Factory for Expectation
Matcher.prototype.expectation = function () {
  var args = Array.prototype.slice.call(arguments);
  return new Expectation(this, args);
};

Matcher.prototype.toString = function () {
  return '<Ass.Matcher ' + this.name + '>';
};


module.exports = Matcher;
},{"./expectation":5}],7:[function(require,module,exports){
//

var Chain = require('./chain');

var DEFAULT_PROP = 'should';

// Installs the typical .should property on the root Object.
// You can install under any name of your choosing by giving it
// as argument.
// Basically borrowed from the Chai project:
//  Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
//  https://github.com/chaijs/chai/blob/master/lib/chai/interface/should.js
function should (name) {

  if (name === null) {
    return should.restore();
  }

  name = name || DEFAULT_PROP;

  if (name in Object.prototype) {
    if (!(Object.prototype[name] instanceof Chain)) {
      throw new Error('ass.should: Object.prototype already has a .should property');
    }
  }

  // modify Object.prototype to have `should`
  Object.defineProperty(Object.prototype, name, {
    get: function () {
      if (this instanceof String || this instanceof Number) {
        return new Chain(this.constructor(this));
      } else if (this instanceof Boolean) {
        return new Chain(this == true);
      }
      return new Chain(this);
    },
    set: function (value) {
      // Allow: global.should = require('ass').should()
      Object.defineProperty(this, name, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    },
    configurable: true,  // Allow restoration
    enumerable: false
  });

  return this;
}

should.restore = function (name) {
  name = name || DEFAULT_PROP;

  if (name in Object.prototype) {
    if (Object.prototype[name] instanceof Chain) {
      delete Object.prototype[name];
    }
  }
};


module.exports = should;
},{"./chain":2}],8:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

// Avoid repeated compilations by memoizing
var compileTemplate = _.memoize(function (tpl) {
  return _.template(tpl, null, {
    escape: /\{\{([\s\S]+?)\}\}/g
  });
});

// Dumps arbitrary values as strings in a concise way
// TODO: https://github.com/chaijs/chai/blob/master/lib/chai/utils/objDisplay.js
function valueDumper (v) {
  var value;

  if (_.isNumber(v) || _.isNaN(v) || _.isBoolean(v) || _.isNull(v) || _.isUndefined(v)) {
    value = '<' + v + '>';
  } else {
    value = JSON.stringify(v);
  }

  return '\u001b[1;36m' + value + '\u001b[0;39m';
}


// Customized version of lodash template
function template (tpl, context) {
  var origEscape = _.escape;
  try {
    // Override the default escape function to use it for dumping formatted values
    _.escape = valueDumper;

    return compileTemplate(tpl)(context);

  } finally {
    _.escape = origEscape;
  }
}

// Remove ANSI escapes from a string
function unansi (str) {
  return str.replace(/\x1b\[(\d+;?)+[a-z]/gi, '');
}


exports.template = template;
exports.unansi = unansi;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
// Register the default matchers
require('./lib/core-matchers');

module.exports = require('./lib/ass.js');

},{"./lib/ass.js":1,"./lib/core-matchers":3}]},{},[9])(9)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2NvcmUtbWF0Y2hlcnMuanMiLCJsaWIvZXJyb3IuanMiLCJsaWIvZXhwZWN0YXRpb24uanMiLCJsaWIvbWF0Y2hlci5qcyIsImxpYi9zaG91bGQuanMiLCJsaWIvdXRpbC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzl2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIE1hdGNoZXIgPSByZXF1aXJlKCcuL21hdGNoZXInKTtcbnZhciBBc3NFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgc2hvdWxkID0gcmVxdWlyZSgnLi9zaG91bGQnKTtcblxuXG52YXIgZGVmUHJvcCA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eS5iaW5kKE9iamVjdCk7XG5cblxuLy8gVE9ETzogRGV0ZWN0IHN1cHBvcnQgZm9yIFByb3h5IGFuZCBvZmZlciBzdWdnZXN0aW9ucyBsaWtlIHB5c2hvdWxkXG5cblxuXG4vLyBQdWJsaWMgaW50ZXJmYWNlXG5mdW5jdGlvbiBhc3MgKHZhbHVlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBDaGFpbigpO1xuICB9XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpO1xufVxuXG4vLyBEZWZlcnJlZCBmYWN0b3J5XG5hc3MuXyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gbmV3IENoYWluKHZhbHVlKS5fO1xufVxuXG4vLyBHbG9iYWwgcmVnaXN0cnkgb2YgbWF0Y2hlcnMgKHVzZWQgZm9yIGFzcy5oZWxwKVxuYXNzLm1hdGNoZXJzID0gW107XG5cbi8vIGFzcy5oZWxwIGR1bXBzIHRoZSBoZWxwIG9mIGVhY2ggbWF0Y2hlciByZWdpc3RlcmVkXG5kZWZQcm9wKGFzcywgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gJyc7XG4gICAgXy5mb3JFYWNoKGFzcy5tYXRjaGVycywgZnVuY3Rpb24gKG1hdGNoZXIpIHtcbiAgICAgIC8vIFRPRE86IFRoaXMgY2FuIGJlIG5pY2VyXG4gICAgICB2YXIgZm4gPSBtYXRjaGVyLnRlc3QudG9TdHJpbmcoKTtcbiAgICAgIHZhciBhcmdzID0gZm4ucmVwbGFjZSgvXmZ1bmN0aW9uXFxzKlxcKChbXlxcKV0qKVxcKVtcXFNcXHNdKi8sICckMScpO1xuICAgICAgYXJncyA9IGFyZ3Muc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgudHJpbSgpOyB9KTtcbiAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgIGZuID0gYXJncy5sZW5ndGggPyAnICgnICsgYXJncy5qb2luKCcsICcpICsgJyknIDogJyc7XG5cbiAgICAgIHMgKz0gJz4gLicgKyBtYXRjaGVyLm5hbWUgKyBmbiArICdcXG5cXG4nO1xuICAgICAgcyArPSAnICAnICsgbWF0Y2hlci5oZWxwLnJlcGxhY2UoL1xcbi9nLCAnXFxuICAnKTtcbiAgICAgIHMgKz0gJ1xcblxcbic7XG4gICAgfSk7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn0pO1xuXG4vLyBUT0RPOiBSZXZpZXcgaWYgY2hhbmdpbmcgdGhlIHNlbWktc3RhbmRhcmQgb3JkZXIgb2YgKGNvbmQsIG1lc3NhZ2UpIGlzIGEgZ29vZCBpZGVhXG5hc3Mub2sgPSBmdW5jdGlvbiAobWVzc2FnZSwgY29uZCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIGNvbmQgPSBtZXNzYWdlO1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSB0cnVpc2ggdmFsdWUnO1xuICB9XG4gIHJldHVybiBhc3MuZGVzYyhtZXNzYWdlKS50cnV0aHkuYXNzZXJ0KGNvbmQpO1xufTtcblxuYXNzLmtvID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGNvbmQpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBjb25kID0gbWVzc2FnZTtcbiAgICBtZXNzYWdlID0gJ2V4cGVjdGVkIGEgZmFsc3kgdmFsdWUnO1xuICB9XG4gIHJldHVybiBhc3MuZGVzYyhtZXNzYWdlKS5mYWxzeS5hc3NlcnQoIWNvbmQpO1xufTtcblxuLy8gUmVzZXRzIG9yIHZlcmlmaWVzIHRoZSBudW1iZXIgb2YgbWFya3Mgc28gZmFyXG5hc3MuY2hlY2ttYXJrcyA9IGZ1bmN0aW9uIChleHBlY3RlZCwgZGVzYykge1xuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAndW5kZWZpbmVkJykge1xuICAgIGV4cGVjdGVkID0gYXNzLmNoZWNrbWFya3MuY291bnRlcjtcbiAgICBhc3MuY2hlY2ttYXJrcy5jb3VudGVyID0gMDtcbiAgICByZXR1cm4gZXhwZWN0ZWQ7ICAvLyByZXR1cm4gYmFjayBob3cgbWFueSB0aGVyZSB3ZXJlXG4gIH1cblxuICBhc3MuZGVzYyhkZXNjIHx8ICdhc3MuY2hlY2ttYXJrcycpLmVxKGV4cGVjdGVkKS5hc3NlcnQoXG4gICAgYXNzLmNoZWNrbWFya3MuY291bnRlciwgYXNzLmNoZWNrbWFya3NcbiAgKTtcbn07XG5hc3MuY2hlY2ttYXJrcy5jb3VudGVyID0gMDtcblxuXG4vLyBIZWxwZXIgdG8gcmVnaXN0ZXIgbmV3IG1hdGNoZXJzIGluIHRoZSByZWdpc3RyeVxuYXNzLnJlZ2lzdGVyID0gZnVuY3Rpb24gKG5hbWUsIG1hdGNoZXIpIHtcbiAgaWYgKG5hbWUgaW5zdGFuY2VvZiBNYXRjaGVyKSB7XG4gICAgbWF0Y2hlciA9IG5hbWU7XG4gICAgbmFtZSA9IG1hdGNoZXIubmFtZTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICBPYmplY3Qua2V5cyhuYW1lKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGFzcy5yZWdpc3RlcihrZXksIG5hbWVba2V5XSk7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgeyAgLy8gQXNzdW1lIGEgZGVzY3JpcHRvciB3YXMgZ2l2ZW5cbiAgICAvLyBDcmVhdGUgdGhlIGFsaWFzZXMgZmlyc3RcbiAgICBfLmZvckVhY2gobWF0Y2hlci5hbGlhc2VzLCBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgIGFzcy5yZWdpc3RlcihuZXcgTWF0Y2hlcihhbGlhcywgbWF0Y2hlcikpO1xuICAgIH0pO1xuXG4gICAgbWF0Y2hlciA9IG5ldyBNYXRjaGVyKG5hbWUsIG1hdGNoZXIpXG4gIH1cblxuICAvLyBLZWVwIHRoZSBtYXRjaGVyIGFyb3VuZCBmb3IgYXNzLmhlbHBcbiAgYXNzLm1hdGNoZXJzLnB1c2gobWF0Y2hlcik7XG5cblxuICAvLyBUT0RPOiBBbGxvdyBtYXRjaGVycyB0byBiZSBvdmVycmlkZGVuIGFuZCBhbHNvIG92ZXJsb2FkZWRcbiAgLy8gICAgICAgaWYgdGhleSBoYXZlIGFuIFwib3ZlcmxvYWRcIiBtZXRob2QgaXQgY2FuIGJlIHVzZWRcbiAgLy8gICAgICAgdG8gY2hlY2sgd2hpY2ggb25lIHNob3VsZCBiZSB1c2VkLlxuICAvLyAgICAgICBCZXR0ZXIgSWRlYSAoSSB0aGluayksIGluc3RlYWQgb2Ygb3ZlcmxvYWRpbmcgYmFzZWRcbiAgLy8gICAgICAgb24gdGhlIHZhbHVlIHVuZGVyIHRlc3QsIHdoaWNoIG1heSBwcm9kdWNlIGlzc3Vlc1xuICAvLyAgICAgICBzaW5jZSB3ZSBkb24ndCBrbm93IGZvciBzdXJlIHdoYXQgdGhhdCB2YWx1ZSBpcyxcbiAgLy8gICAgICAgYWxsb3cgbWF0Y2hlcnMgdG8gaW50cm9kdWNlIGEgbmV3IFwicHJvdG90eXBlXCIgZm9yXG4gIC8vICAgICAgIHRoZSBjaGFpbiwgdGhhdCBpcywgYSAuZG9tIG1hdGNoZXIgd2lsbCBpbmNsdWRlXG4gIC8vICAgICAgIGFsbCB0aGUgY29yZSBleHBlY3RhdGlvbnMgYnV0IHRoZW4gYWxzbyBvdmVycmlkZXNcbiAgLy8gICAgICAgYW5kIG5ldyBvbmVzIHVudGlsIHRoZSBlbmQgb2YgdGhlIGNoYWluLlxuXG5cbiAgLy8gTWF0Y2hlciBmdW5jdGlvbnMgd2l0aCBhIHNpbmdsZSBhcmd1bWVudCBhcmUgZ2V0dGVyc1xuICB2YXIgZm5LZXkgPSBtYXRjaGVyLmFyaXR5ID09PSAxID8gJ2dldCcgOiAndmFsdWUnO1xuICB2YXIgcHJvcCA9IHtcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfTtcbiAgaWYgKGZuS2V5ID09PSAndmFsdWUnKSB7XG4gICAgcHJvcC53cml0YWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgLy8gQXVnbWVudCB0aGUgQ2hhaW4gcHJvdG90eXBlXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gZm4gKCkge1xuICAgIC8vIFRPRE86IFZlcmlmeSB0aGUgYXJpdHkgb2YgdGhlIG1hdGNoZXIgdmVyc3VzIHRoZSBjYWxsXG4gICAgdmFyIGV4cCA9IG1hdGNoZXIuZXhwZWN0YXRpb24uYXBwbHkobWF0Y2hlciwgYXJndW1lbnRzKTtcbiAgICB0aGlzLmV4cGVjdGF0aW9ucy5wdXNoKGV4cCk7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBkZWZQcm9wKENoYWluLnByb3RvdHlwZSwgbmFtZSwgcHJvcCk7XG5cbiAgLy8gQXVnbWVudCB0aGUgc3RhdGljIGludGVyZmFjZVxuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWF0Y2ggPSBuZXcgQ2hhaW4oKTtcblxuICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgIHJldHVybiBtYXRjaFtuYW1lXTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hbbmFtZV0uYXBwbHkobWF0Y2gsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgZGVmUHJvcChhc3MsIG5hbWUsIHByb3ApO1xuXG4gIC8vIFBhc3MgdGhyb3VnaCBmb3IgY2hhaW5zXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gcGFzc3Rocm91Z2goKSB7XG4gICAgcmV0dXJuIHRoaXNbbmFtZV0uYXNzZXJ0KHRoaXMudmFsdWUsIHBhc3N0aHJvdWdoKS52YWx1ZU9mKCk7XG4gIH07XG4gIHByb3AuZW51bWVyYWJsZSA9IGZhbHNlO1xuICBkZWZQcm9wKENoYWluLnByb3RvdHlwZSwgJyQnICsgbmFtZSwgcHJvcCk7XG5cbiAgLy8gUGFzcyB0aHJvdWdoIHN0YXRpYyBjb25zdHJ1Y3RvclxuICBkZWZQcm9wKGFzcywgJyQnICsgbmFtZSwge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgICAgcmV0dXJuIGFzcyh2YWx1ZSlbJyQnICsgbmFtZV07XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSBhIG5ldyBleHByZXNzaW9uIGZvciB0aGUgZXhwZWN0YXRpb25cbiAgICAgIHZhciBjaGFpbiA9IGFzcygpO1xuICAgICAgY2hhaW5bbmFtZV0uYXBwbHkoY2hhaW4sIGFyZ3VtZW50cyk7XG4gICAgICAvLyBSZXR1cm4gYSBjYWxsYWJsZSB0aGF0IGFzc2VydHMgdXBvbiByZWNlaXZpbmcgYSB2YWx1ZVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGZuIChhY3R1YWwpIHtcbiAgICAgICAgY2hhaW4uYXNzZXJ0KGFjdHVhbCwgZm4pO1xuICAgICAgICByZXR1cm4gYWN0dWFsO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbn07XG5cblxuXG4vLyBPdmVycmlkZSBsb2Rhc2gncyBkZWZhdWx0IGNyZWF0ZUNhbGxiYWNrIG1lY2hhbmlzbSB0byBtYWtlIGl0IHVuZGVyc3RhbmRcbi8vIGFib3V0IG91ciBtYXRjaGVycyAodGhpcyBzaG91bGQgc29sdmUgcGx1Y2svbWFwL2ZpbHRlci8uLi4pLlxuLy8gVE9ETyEhISEhISEhISEhISEhXG4vLyBfLmNyZWF0ZUNhbGxiYWNrID0gXy53cmFwKF8uY3JlYXRlQ2FsbGJhY2ssIGZ1bmN0aW9uKGZ1bmMsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4vLyAgIHZhciBtYXRjaCA9IC9eKC4rPylfXyhbZ2xddCkoLispJC8uZXhlYyhjYWxsYmFjayk7XG4vLyAgIHJldHVybiAhbWF0Y2ggPyBmdW5jKGNhbGxiYWNrLCB0aGlzQXJnKSA6IGZ1bmN0aW9uKG9iamVjdCkge1xuLy8gICAgIHJldHVybiBtYXRjaFsyXSA9PSAnZ3QnID8gb2JqZWN0W21hdGNoWzFdXSA+IG1hdGNoWzNdIDogb2JqZWN0W21hdGNoWzFdXSA8IG1hdGNoWzNdO1xuLy8gICB9O1xuLy8gfSk7XG5cblxuLy8gQnVuZGxlIHNvbWUgb2YgdGhlIGludGVybmFsIHN0dWZmIHdpdGggdGhlIGFzcyBmdW5jdGlvblxuYXNzLkNoYWluID0gQ2hhaW47XG5hc3MuRXJyb3IgPSBBc3NFcnJvcjtcblxuLy8gRm9yd2FyZCB0aGUgc2hvdWxkIGluc3RhbGxlclxuYXNzLnNob3VsZCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIHNob3VsZChuYW1lKTtcbiAgcmV0dXJuIGFzcztcbn07XG5hc3Muc2hvdWxkLnJlc3RvcmUgPSBzaG91bGQucmVzdG9yZTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3M7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgQXNzRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yJyk7XG5cbnZhciBkZWZQcm9wID0gT2JqZWN0LmRlZmluZVByb3BlcnR5LmJpbmQoT2JqZWN0KTtcblxuLy8gQW4gZXhwZWN0YXRpb25zIGNoYWluLCB0aGUgY29yZSBvYmplY3Qgb2YgdGhlIGxpYnJhcnksIGFsbG93c1xuLy8gdG8gc2V0dXAgYSBzZXQgb2YgZXhwZWN0YXRpb25zIHRvIGJlIHJ1biBhdCBhbnkgcG9pbnQgd2l0aCBhXG4vLyB2YWx1ZS5cbmZ1bmN0aW9uIENoYWluICh2YWx1ZSkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2hhaW4pKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBc3MgQ2hhaW4gY29uc3RydWN0b3IgY2FsbGVkIHdpdGhvdXQgbmV3IScpO1xuICB9XG5cbiAgLy8gTGlzdCBvZiBbIEV4cGVjdGF0aW9uIF1cbiAgZGVmUHJvcCh0aGlzLCAnZXhwZWN0YXRpb25zJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBDdXN0b20gZGVzY3JpcHRpb25cbiAgZGVmUHJvcCh0aGlzLCAnZGVzY3JpcHRpb24nLCB7XG4gICAgdmFsdWU6ICcnLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gU3VwcG9ydCB1c2FnZSBsaWtlOiBhc3Muc3RyaW5nLmhlbHBcbiAgZGVmUHJvcCh0aGlzLCAnaGVscCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFRPRE86IFByb2R1Y3RpemUgdGhpcyBhbmQgcGVyaGFwcyBzaG93IGhlbHAgZm9yIHRoZSB3aG9sZSBjaGFpblxuICAgICAgcmV0dXJuIHRoaXMuZXhwZWN0YXRpb25zWzBdLmhlbHA7XG4gICAgfVxuICB9KTtcblxuICB2YWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAwID8gdmFsdWUgOiB0aGlzLl9fR1VBUkRfXztcbiAgZGVmUHJvcCh0aGlzLCAndmFsdWUnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2KSB7XG4gICAgICB2YWx1ZSA9IHY7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gIH0pO1xuXG4gIGRlZlByb3AodGhpcywgJ19fZGVmZXJyZWRfXycsIHtcbiAgICB2YWx1ZTogdmFsdWUgPT09IHRoaXMuX19HVUFSRF9fLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gU3VwcG9ydCB0aGlzIHVzZSBjYXNlOiBhc3ModmFsdWUpLl8uc29tZS5udW1iZXIuYWJvdmUoNSkuX1xuICBkZWZQcm9wKHRoaXMsICdfJywge1xuICAgIGdldDogZnVuY3Rpb24gZ2V0dGVyKCkge1xuICAgICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmFzc2VydCh0aGlzLnZhbHVlLCBnZXR0ZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9KTtcblxuICAvLyBTZWFsIHRoZSBjb250ZXh0IHRvIHRoZSBtZXRob2RzIHNvIHdlIGNhbiBkaXJlY3RseSBjYWxsIHRoZW1cbiAgdGhpcy50ZXN0ID0gQ2hhaW4ucHJvdG90eXBlLnRlc3QuYmluZCh0aGlzKTtcbiAgdGhpcy5hc3NlcnQgPSBDaGFpbi5wcm90b3R5cGUuYXNzZXJ0LmJpbmQodGhpcyk7XG5cbiAgLy8gUGFzcyB0aHJvdWdoIGFzc2VydGlvblxuICB0aGlzLiQgPSBmdW5jdGlvbiBwYXNzdGhyb3VnaChhY3R1YWwpIHtcbiAgICB0aGlzLmFzc2VydChhY3R1YWwsIHBhc3N0aHJvdWdoKTtcbiAgICByZXR1cm4gYWN0dWFsO1xuICB9LmJpbmQodGhpcyk7XG59XG5cbkNoYWluLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5DaGFpbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDaGFpbjtcblxuLy8gR3VhcmQgdG9rZW4gdG8gZGV0ZWN0IHZhbHVlbGVzcyBtYXRjaGVyc1xuQ2hhaW4ucHJvdG90eXBlLl9fR1VBUkRfXyA9IHtcbiAgdmFsdWVPZjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd7e3ZhbHVlbGVzc319JztcbiAgfVxufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIElmIHRoZSByZXNvbHZlZFxuLy8gYXJndW1lbnQgaXMgZ2l2ZW4gaXQnbGwgYmUgcG9wdWxhdGVkIHdpdGggYWxsIHRoZSBleHBlY3RhdGlvbnNcbi8vIHJlc29sdmVkIG9uIHRoaXMgcnVuIChzdG9wcyBvbiBmaXJzdCBmYWlsdXJlKS4gVGhlIHJlc3VsdCBpc1xuLy8gYWx3YXlzIGEgYm9vbGVhbiBpbmRpY2F0aW5nIHRoZSBvdXRjb21lLlxuLy8gTm90ZTogbmFtZWQgYHRlc3RgIHRvIGJlIGNvbXBhdGlibGUgd2l0aCBTaW5vbidzIG1hdGNoZXJzLlxuQ2hhaW4ucHJvdG90eXBlLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsLCByZXNvbHZlZCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBUaGlzIGlzIHRoZSBjb3JlIHJlc29sdXRpb24gYWxnb3JpdGhtLCBpdCBvcGVyYXRlcyBvdmVyIGEgbGlzdFxuICAvLyBvZiBleHByZXNzaW9ucyBjaGVja2luZyB0aGVtIG9uZSBhZnRlciB0aGUgb3RoZXIgYWdhaW5zdCBhIHZhbHVlLlxuICAvLyBJZiBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGl0J2xsIGJlIGltbWVkaWF0ZWx5IGNhbGxlZCBwYXNzaW5nXG4gIC8vIGFzIG9ubHkgYXJndW1lbnQgdGhlIHNhbWUgcmVzb2x2ZXIgZnVuY3Rpb24gd2l0aCB0aGUgcmVtYWluaW5nXG4gIC8vIGV4cGVjdGF0aW9ucyBhcmd1bWVudCBhbHJlYWR5IGFwcGxpZWQsIHRoaXMgYWxsb3dzIGFuIGV4cGVjdGF0aW9uXG4gIC8vIHRvIG92ZXJyaWRlIHRoZSB2YWx1ZSBhbmQvb3IgY29udHJvbCB0aGUgZW5kIHJlc3VsdCBvZiB0aGVcbiAgLy8gcmVzb2x1dGlvbiB3aXRob3V0IGV4cG9zaW5nIHRvbyBtYW55IGRldGFpbHMuXG4gIGZ1bmN0aW9uIHJlc29sdmVyIChleHBlY3RhdGlvbnMsIHZhbHVlKSB7XG4gICAgdmFyIGV4cCwgcmVzdWx0O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhwZWN0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBleHAgPSBleHBlY3RhdGlvbnNbaV07XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2Ygd2hhdCBleHBlY3RhdGlvbnMgaGF2ZSBhbHJlYWR5IGJlZW4gcmVzb2x2ZWRcbiAgICAgIHJlc29sdmVkICYmIHJlc29sdmVkLnB1c2goZXhwKTtcblxuICAgICAgcmVzdWx0ID0gZXhwLnJlc29sdmUodmFsdWUpO1xuXG4gICAgICAvLyBBbGxvdyBleHBlY3RhdGlvbnMgdG8gdGFrZSBjb250cm9sIG9mIHRoZSByZW1haW5pbmcgY2hhaW5cbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIENvcm5lciBjYXNlIHdoZXJlIHRoZXJlIGFyZSBubyBtb3JlIGV4cGVjdGF0aW9ucyB3YWl0aW5nXG4gICAgICAgIC8vIHRvIGJlIHJlc29sdmVkIHJpZ2h0IG5vdy4gSW4gdGhhdCBjYXNlIGFzc3VtZSB0aGF0IHRoZVxuICAgICAgICAvLyBleHByZXNzaW9uIHdhcyBzdWNjZXNzZnVsLiBpZTogYXNzKCdmb28nKS5ub3QuZXF1YWwoJ2JhcicpXG4gICAgICAgIGlmIChpID09PSBleHBlY3RhdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKFxuICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgcmVzb2x2ZXIuYmluZCh0aGlzLCBleHBlY3RhdGlvbnMuc2xpY2UoaSArIDEpKVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICAvLyBTdG9wIG9uIGZpcnN0IGZhaWx1cmVcbiAgICAgIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIFJlc29sdmUgdGhlIGNoYWluIHN0YXJ0aW5nIGZyb20gcm9vdFxuICByZXR1cm4gcmVzb2x2ZXIuY2FsbCh0aGlzLCB0aGlzLmV4cGVjdGF0aW9ucywgYWN0dWFsKTtcbn07XG5cbi8vIERlZmF1bHQgcmVzb2x2ZXIgdG8gYXBwbHkgbWF0Y2hlcnMgb3ZlciB0aGUgc3ViamVjdCB2YWx1ZVxuQ2hhaW4ucHJvdG90eXBlLmFzc2VydCA9IGZ1bmN0aW9uIChhY3R1YWwsIHNzZikge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBKdXN0IGlnbm9yZSBpZiB0aGUgYWN0dWFsIHZhbHVlIGlzIG5vdCBwcmVzZW50IHlldFxuICBpZiAoYWN0dWFsID09PSB0aGlzLl9fR1VBUkRfXykgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIHJlc29sdmVkID0gW107XG4gIHZhciByZXN1bHQgPSB0aGlzLnRlc3QoYWN0dWFsLCByZXNvbHZlZCk7XG5cbiAgLy8gSXQgZmFpbGVkIHNvIHJlcG9ydCBpdCB3aXRoIGEgbmljZSBlcnJvclxuICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuXG4gICAgLy8gVXNpbmcgcXVhbnRpZmllcnMgaW50cm9kdWNlcyBkdXBsaWNhdGVzIGZvciBlYWNoIGl0ZXJhdGlvblxuICAgIHJlc29sdmVkID0gXy51bmlxKHJlc29sdmVkKTtcblxuICAgIC8vIEdldCB0aGUgb2ZmZW5kaW5nIGV4cGVjdGF0aW9uIChzaG91bGQgYmUgdGhlIGxhc3Qgb25lKVxuICAgIHZhciBleHAgPSByZXNvbHZlZC5wb3AoKTtcblxuICAgIHZhciBlcnJvciA9IHRoaXMuZGVzY3JpcHRpb24gKyAnXFxuXFxuJztcblxuICAgIHJlc29sdmVkLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgIHZhciBkZXNjID0geC5nZXREZXNjcmlwdGlvbigpO1xuICAgICAgaWYgKGRlc2MgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZXJyb3IgKz0gJyBcXHUwMDFiWzMybVBhc3NlZDpcXHUwMDFiWzM5bSAnICsgZGVzYyArICdcXG4nO1xuICAgIH0pO1xuXG4gICAgZXJyb3IgKz0gJyBcXHUwMDFiWzMxbUZhaWxlZDpcXHUwMDFiWzM5bSAnICsgZXhwLmdldERlc2NyaXB0aW9uKCkgKyAnXFxuJztcbiAgICBlcnJvciArPSAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMzltICcgKyBleHAuZ2V0TWlzbWF0Y2goKSArICdcXG4nO1xuXG4gICAgLy8gVE9ETzogc2hvd0RpZmYgc2hvdWxkIGJlIHVzZWQgb25seSB3aGVuIGl0IG1ha2VzIHNlbnNlIHBlcmhhcHNcbiAgICAvLyAgICAgICB3ZSBjYW4gcGFzcyBudWxsL3VuZGVmaW5lZCBhbmQgbGV0IEFzc0Vycm9yIGRldGVjdCB3aGVuIGl0XG4gICAgLy8gICAgICAgbWFrZXMgc2Vuc2UuXG4gICAgdGhyb3cgbmV3IEFzc0Vycm9yKGVycm9yLCBhY3R1YWwsIGV4cC5leHBlY3RlZCwgdHJ1ZSwgc3NmIHx8IGFyZ3VtZW50cy5jYWxsZWUpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5DaGFpbi5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudmFsdWU7XG59O1xuXG5DaGFpbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmRlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpcHRpb247XG4gIH1cblxuICB2YXIgZGVzY3MgPSB0aGlzLmV4cGVjdGF0aW9uc1xuICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZ2V0RGVzY3JpcHRpb24oKTsgfSlcbiAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmdldERlc2NyaXB0aW9uKCk7IH0pO1xuXG4gIGlmIChkZXNjcy5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuICcoJyArIGRlc2NzLmpvaW4oJywgJykgKyAnKSc7XG4gIH0gZWxzZSBpZiAoZGVzY3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGRlc2NzWzBdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnPEFzcz4nO1xuICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhaW47XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi9hc3MnKTtcblxuLy8gU2V0IG9mIGRlZmF1bHQgbWF0Y2hlcnNcbmFzcy5yZWdpc3Rlcih7XG4gIGRlc2M6IHtcbiAgICBoZWxwOiAnUHJvdmlkZSBhIGN1c3RvbSBkZXNjcmlwdGlvbiBmb3IgcmVwb3J0ZWQgZmFpbHVyZXMnLFxuICAgIGRlc2M6IG51bGwsICAvLyBTa2lwIGl0IGZyb20gcmVwb3J0c1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGRlc2MpIHtcbiAgICAgIC8vIFNpbmNlIHRoZSByZXR1cm5lZCBmdW5jdGlvbiB3aWxsIGJlIGV4ZWN1dGVkIG9uIHRoZSBjaGFpblxuICAgICAgLy8gY29udGV4dCB3ZSBjYW4gc2V0IHRoZW4gdGhlIGRlc2NyaXB0aW9uLiBBbHRob3VnaCB0aGlzIG1lYW5zXG4gICAgICAvLyB0aGF0IGl0IHdvbid0IGJlIHNldCB1bnRpbCB0aGUgY2hhaW4gaXMgYWN0dWFsbHkgcmVzb2x2ZWQuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIC8vIElnbm9yZWQgbWF0Y2hlcnNcbiAgdG86IHtcbiAgICBhbGlhc2VzOiBbICdhJywgJ2FuJywgJ2JlJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdKdXN0IHNvbWUgc3ludGF4IHN1Z2FyIHRvIG1ha2UgdGhlIGV4cGVjdGF0aW9ucyBlYXNpZXIgb24nLFxuICAgICAgJ3RoZSBleWVzLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIG1hcms6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSW5jcmVhc2VzIHRoZSBnbG9iYWwgYGFzcy5tYXJrc2AgY291bnRlciBldmVyeSB0aW1lIGl0IGdldHMnLFxuICAgICAgJ2V2YWx1YXRlZCBhcyBwYXJ0IG9mIGFuIGV4cHJlc3Npb24uIFVzZSBpdCB0byB2ZXJpZnkgdGhhdCB0aGUnLFxuICAgICAgJ2V4cGVjdGF0aW9ucyBhcmUgYWN0dWFsbHkgYmVpbmcgZXhlY3V0ZWQuJyxcbiAgICAgICdBbiBlYXN5IHdheSB0byBzdXBwb3J0IHRoaXMgd2hlbiB1c2luZyBhIHRlc3QgcnVubmVyIGlzIHRvIHJlc2V0JyxcbiAgICAgICd0aGUgY291bnRlciBieSBjYWxsaW5nIGBhc3MubWFya3MoKWAgb24gYSBiZWZvcmVFYWNoIGhvb2sgYW5kJyxcbiAgICAgICd0aGVuIHZlcmlmeSBhdCB0aGUgZW5kIG9mIHRlc3Qgd2l0aCBgYXNzLm1hcmtzKE4pYCAod2hlcmUgTiBpcycsXG4gICAgICAndGhlIG51bWJlciBvZiBtYXJrcyB5b3UgZXhwZWN0ZWQpLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgYXNzLmNoZWNrbWFya3MuY291bnRlciArPSAxO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIC8vIEp1c3QgYWxsb3cgYW55dGhpbmcgOilcbiAgYW55OiB7XG4gICAgaGVscDogJ0FsbG93cyBhbnkgdmFsdWUgd2l0aG91dCB0ZXN0aW5nIGl0JyxcbiAgICBkZXNjOiAnaXMgYW55dGhpbmcnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgLy8gQW55dGhpbmcgdGhhdCBpc24ndCBudWxsIG9yIHVuZGVmaW5lZFxuICBkZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbm90IG51bGwgb3IgdW5kZWZpbmVkJyxcbiAgICBkZXNjOiAnaXMgZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAhPSBudWxsO1xuICAgIH1cbiAgfSxcbiAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGVtcHR5XG4gIGVtcHR5OiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgZW1wdHkgKGhhcyBhIGxlbmd0aCBvZiAwKScsXG4gICAgZGVzYzogJ2lzIGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9IG51bGwgJiYgYWN0dWFsLmxlbmd0aCA+IDA7XG4gICAgfVxuICB9LFxuICBub25FbXB0eToge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG5vdCBlbXB0eSAoaGFzIGEgbGVuZ3RoIGdyZWF0ZXIgdGhhbiAwKScsXG4gICAgZGVzYzogJ2lzIG5vdCBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA9PSBudWxsIHx8IGFjdHVhbC5sZW5ndGggPT09IDA7XG4gICAgfVxuICB9LFxuICB0cnV0aHk6IHtcbiAgICBhbGlhc2VzOiBbICd0cnVpc2gnIF0sXG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgdHJ1dGh5IChub3QgdW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKScsXG4gICAgZGVzYzogJ2lzIHRydXRoeScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFhY3R1YWwpIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwubGVuZ3RoID4gMCA6IHRydWU7XG4gICAgfVxuICB9LFxuICBmYWxzeToge1xuICAgIGhlbHA6ICdUaGUgdmFsdWUgc2hvdWxkIGJlIGZhbHN5ICh1bmRlZmluZWQsIG51bGwsIDAsIFwiXCIgb3IgW10pJyxcbiAgICBkZXNjOiAnaXMgZmFsc3knLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwgPT09IDAgOiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICAvLyBDb29yZGluYXRpb25cbiAgYW5kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IG1hdGNoZXIgZnJvbSB0d28gb3IgbW9yZSBvZiB0aGVtLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYWxsIHRoZSBtYXRjaGVycyB0aGF0IGZvcm0gaXQgZG8gc3VjY2VlZCddLFxuICAgIGRlc2M6ICcoJHsgYXJncy5qb2luKFwiKSBBTkQgKFwiKSB9KScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXR1cm4gXy5ldmVyeShicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHJldHVybiBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICBvcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBtYXRjaGVyIGZyb20gdHdvIG9yIG1vcmUgb2YgdGhlbSwgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgbWF0Y2hlcnMgZG9lcyddLFxuICAgIGRlc2M6ICcoJHsgYXJncy5qb2luKFwiKSBPUiAoXCIpIH0pJyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXR1cm4gXy5zb21lKGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgcmV0dXJuIGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gTmVnYXRpb25cbiAgbm90OiB7XG4gICAgaGVscDogJ05lZ2F0ZXMgdGhlIHJlc3VsdCBmb3IgdGhlIHJlc3Qgb2YgdGhlIGV4cHJlc3Npb24uJyxcbiAgICBkZXNjOiAnTm90IScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAvLyBUT0RPOiBOZWdhdGlvbiBkb2Vzbid0IHdvcmsgdmVyeSB3ZWxsIHdpdGggY2hhaW5zIGFscmVhZHlcbiAgICAgIC8vICAgICAgIGhhdmluZyBhIHZhbHVlLiBUbyBzb2x2ZSBpdCBwZXJoYXBzIGl0J3MgYmV0dGVyIHRvXG4gICAgICAvLyAgICAgICBwcm9kdWNlIGEgZGVzY3JpcHRpdmUgZXJyb3Igb24gdGhlIC5ub3QgZ2V0dGVyIHdpdGhcbiAgICAgIC8vICAgICAgIGFsdGVybmF0aXZlcyBvbiBob3cgdG8gd29yayB3aXRoIG5lZ2F0aW9uLlxuICAgICAgLy8gICAgICAgUGVyaGFwcyB3ZSBjYW4gYWxsb3cgLm5vdC5tYXRjaGVyIGJ1dCByYWlzZSBhbiBlcnJvclxuICAgICAgLy8gICAgICAgaWYgaXQncyAubm90Lm1hdGNoZXIubWF0Y2hlci5cblxuICAgICAgLy8gUmV0dXJuaW5nIGEgcmVzb2x2ZXIgd3JhcHBlciwgd2UgY2FuIHRoZW4gZWl0aGVyIG1vZGlmeVxuICAgICAgLy8gdGhlIHJlc3VsdCBvciB0aGUgdmFsdWUgZmVlZCBpbnRvIHRoZSBwYXJlbnQgcmVzb2x2ZXJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgcmV0dXJuICFyZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gUXVhbnRpZmllcnNcbiAgZXZlcnk6IHtcbiAgICBhbGlhc2VzOiBbICdhbGwnLCAnYWxsT2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ2FsbCBvZiB0aGVtIHN1Y2NlZWQnXSxcbiAgICBkZXNjOiAnRm9yIGV2ZXJ5IG9uZTonLFxuICAgIGZhaWw6ICdhdCBsZWFzdCBvbmUgZGlkblxcJ3QnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgcmV0dXJuIF8uZXZlcnkoYWN0dWFsLCByZXNvbHZlcik7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcbiAgc29tZToge1xuICAgIGFsaWFzZWQ6IFsgJ2FueU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdhdCBsZWFzdCBvbmUgb2YgdGhlbSBzdWNjZWVkcyddLFxuICAgIGRlc2M6ICdBdCBsZWFzdCBvbmU6JyxcbiAgICBmYWlsOiAnbm9uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgcmV0dXJuIF8uc29tZShhY3R1YWwsIHJlc29sdmVyKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICBub25lOiB7XG4gICAgYWxpYXNlczogWyAnbm9uZU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdub25lIG9mIHRoZW0gc3VjY2VlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAnTm9uZSBvZiB0aGVtOicsXG4gICAgZmFpbDogJ2F0IGxlYXN0IG9uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgcmV0dXJuICFfLnNvbWUoYWN0dWFsLCByZXNvbHZlcik7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICAvLyBQcm9taXNlc1xuICBwcm9taXNlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1ZlcmlmaWVzIHRoYXQgdGhlIHZhbHVlIGlzIGEgcHJvbWlzZSAoUHJvbWlzZS9BKykgYnV0IGRvZXMgbm90IGF0dGFjaCB0aGUnLFxuICAgICAgJ3RoZSBjaGFpbiBvZiBtYXRjaGVycyB0byBpdHMgcmVzb2x1dGlvbiBsaWtlIGByZXNvbHZlc2Agb3IgYHJlamVjdHNgLCcsXG4gICAgICAnaW5zdGVhZCB0aGUgb3JpZ2luYWwgcHJvbWlzZSB2YWx1ZSBpcyBzdGlsbCB0aGUgc3ViamVjdCBmb3IgdGhlIG5leHQnLFxuICAgICAgJ21hdGNoZXJzLiddLFxuICAgIGRlc2M6ICd0byBiZSBhIHByb21pc2UnLFxuICAgIGZhaWw6ICdnb3QgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgJiYgdHlwZW9mIGFjdHVhbC50aGVuID09PSAnZnVuY3Rpb24nO1xuICAgIH1cbiAgfSxcblxuICAvLyBUT0RPOiBIb3cgY2FuIHdlIHN1cHBvcnQgdGVzdCBydW5uZXJzIGNvbnN1bWluZyBwcm9taXNlcyBpZiB0aGUgbmFtZVxuICAvLyAgICAgICBoZXJlIGlzIFwidGhlblwiPyBUaGUgb25seSBzb2x1dGlvbiBzZWVtcyB0byBiZSB1c2luZyBcInJlc29sdmVzXCIvXCJyZWplY3RzXCJcbiAgLy8gVE9ETzogVGhlIGN1cnJlbnQgZGVzaWduIHNlZW1zIHRvIHdvcmsgZm9yIHVucmVzb2x2ZWQgcHJvbWlzZXMgYnV0XG4gIC8vICAgICAgIHdoZW4gdGhlIHByb21pc2UgaXMgYWxyZWFkeSByZXNvbHZlZCAoYW5kIHRoZXkgYXJlIHN5bmMgbGlrZSBpbiB0ZXN0cylcbiAgLy8gICAgICAgd2lsbCB0aGUgbWF0Y2hlcnMgYXR0YWNoZWQgdG8gdGhlIGZvcmsgYmUgZXZhbHVhdGVkP1xuICByZXNvbHZlczoge1xuICAgIGhlbHA6IFtcbiAgICAgICdBdHRhY2ggdGhlIG1hdGNoZXIgdG8gYSBwcm9taXNlIHZhbHVlIChQcm9taXNlcy9BKykgdG8gY29udGludWUgYXBwbHlpbmcnLFxuICAgICAgJ3RoZSBjaGFpbiBvZiBtYXRjaGVycyBvbmNlIHRoZSBwcm9taXNlIGhhcyBiZWVuIHJlc29sdmVkLCBtdXRhdGluZyB0aGUnLFxuICAgICAgJ3ZhbHVlIHRvIHRoZSByZXNvbHZlZCBvbmUuJyxcbiAgICAgICdJdCB3aWxsIGZhaWwgaWYgdGhlIHZhbHVlIGlzIG5vdCBhIHByb21pc2UgKG5vIC50aGVuIG1ldGhvZCkgb3IgdGhlIHByb21pc2UnLFxuICAgICAgJ2lzIGFjdHVhbGx5IHJlamVjdGVkLiddLFxuICAgIGRlc2M6ICd0byBiZSBhIHJlc29sdmVkIHByb21pc2UnLFxuICAgIGZhaWw6ICd3YXMgcmVqZWN0ZWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsIHx8IHR5cGVvZiBhY3R1YWwudGhlbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6ICR7YWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IFRoZSBhc3luYyBuYXR1cmUgb2YgcHJvbWlzZXMgY291bGQgYmUgYSBwcm9ibGVtIHNpbmNlIGV4cGVjdGF0aW9uc1xuICAgICAgLy8gICAgICAgaGF2ZSBzb21lIHN0YXRlIHdoaWxlIHRoZXkgZXhlY3V0ZS5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgYWN0dWFsLnRoZW4ocmVzb2x2ZXIsIF8uY29uc3RhbnQoZmFsc2UpKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICByZWplY3RzOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0F0dGFjaCB0aGUgbWF0Y2hlciB0byBhIHByb21pc2UgdmFsdWUgKFByb21pc2VzL0ErKSB0byBjb250aW51ZSBhcHBseWluZycsXG4gICAgICAndGhlIGNoYWluIG9mIG1hdGNoZXJzIG9uY2UgdGhlIHByb21pc2UgaGFzIGJlZW4gcmVqZWN0ZWQsIG11dGF0aW5nIHRoZScsXG4gICAgICAndmFsdWUgdG8gdGhlIHJlamVjdGVkIGVycm9yLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZSBwcm9taXNlJyxcbiAgICAgICdpcyBhY3R1YWxseSByZXNvbHZlZC4nXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZWplY3RlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIHJlc29sdmVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFhY3R1YWwgfHwgdHlwZW9mIGFjdHVhbC50aGVuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZTogJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICBhY3R1YWwudGhlbihfLmNvbnN0YW50KGZhbHNlKSwgcmVzb2x2ZXIpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgaXM6IHtcbiAgICBhbGlhc2VzOiBbICdlcXVhbCcsICdlcXVhbHMnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBzdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBzdHJpY3RseSBlcXVhbCB7e2V4cGVjdGVkfX0nLCAgLy8gVE9ETzogZXhwZWN0ZWQgaXMgYW4gYWxpYXMgZm9yIGFyZ3NbMV1cbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID09PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG4gIGVxOiB7XG4gICAgYWxpYXNlczogWyAnZXFsJywgJ2VxbHMnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBkZWVwIG5vbi1zdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBlcXVhbCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmVxdWFscyhhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICB9XG4gIH0sXG5cbiAgYWJvdmU6IHtcbiAgICBhbGlhc2VzOiBbICdndCcsICdtb3JlVGhhbicsICdncmVhdGVyVGhhbicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBoaWdoZXIgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbW9yZSB0aGFuICR7ZXhwZWN0ZWR9JyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPiBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3c6IHtcbiAgICBhbGlhc2VzOiBbICdsdCcsICdsZXNzVGhhbicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciB0aGEgaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIGxlc3MgdGhhbiAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDwgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlT3JFcXVhbDoge1xuICAgIGFsaWFzZXM6IFsgJ2d0ZScsICdtb3JlVGhhbk9yRXF1YWwnLCAnZ3JlYXRlclRoYW5PckVxdWFsJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGhpZ2hlciBvciBlcXVhbCB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBtb3JlIHRoYW4gb3IgZXF1YWwgdG8gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3dPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnbHRlJywgJ2xlc3NUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciBvciBlcXVhbCB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA8PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgaW5zdGFuY2VvZjoge1xuICAgIGFsaWFzZXM6IFsgJ2luc3RhbmNlT2YnLCAnaW5zdGFuY2UnLCAnaXNhJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3RvcicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIGluc3RhbmNlIG9mICR7ZXhwZWN0ZWR9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICB0eXBlb2Y6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBvZiBhIHNwZWNpZmljIHR5cGUnLFxuICAgIGRlc2M6ICd0byBoYXZlIHR5cGUgJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICdoYWQgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXF1YWxzKHR5cGVvZiBhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICB9XG4gIH0sXG4gIG51bWJlcjoge1xuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBudW1iZXIgKGRpZmZlcmVudCBvZiBOYU4pLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgbnVtYmVyJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc051bWJlcihhY3R1YWwpICYmICFpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgYm9vbDoge1xuICAgIGFsaWFzZXM6IFsgJ2Jvb2xlYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIGJvb2xlYW4uJyxcbiAgICBkZXNjOiAndG8gYmUgYSBib29sZWFuJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Jvb2xlYW4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHN0cmluZzoge1xuICAgIGFsaWFzZXM6IFsgJ3N0cicgXSxcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgc3RyaW5nLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgc3RyaW5nJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1N0cmluZyhhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgb2JqZWN0OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgb2YgdHlwZSBvYmplY3QuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gb2JqZWN0JyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc09iamVjdChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgcGxhaW5PYmplY3Q6IHtcbiAgICBhbGlhc2VzOiBbICdwbGFpbicsICdvYmonIF0sXG4gICAgaGVscDogJ0NoZWNrcyB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZSBPYmplY3QgY29uc3RydWN0b3IuJyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNQbGFpbk9iamVjdChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgYXJyYXk6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBBcnJheS4nLFxuICAgIGRlc2M6ICd0byBiZSBhbiBBcnJheScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNBcnJheShhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZnVuY3Rpb246IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIEZ1bmN0aW9uLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgRnVuY3Rpb24nLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRnVuY3Rpb24oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHJlZ2V4cDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgUmVnRXhwJyxcbiAgICBkZXNjOiAndG8gYmUgYSBSZWdFeHAnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUmVnRXhwKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBkYXRlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBEYXRlJyxcbiAgICBkZXNjOiAndG8gYmUgYSBEYXRlJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0RhdGUoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGVsZW1lbnQ6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIERPTSBlbGVtZW50JyxcbiAgICBkZXNjOiAndG8gYmUgYSBET00gZWxlbWVudCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNFbGVtZW50KGFjdHVhbClcbiAgICB9XG4gIH0sXG4gIGVycm9yOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYW4gZXJyb3IgKG9yIGxvb2tzIGxpa2UgaXQpJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gRXJyb3InLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfLmlzT2JqZWN0KGFjdHVhbCkgJiYgXy5pc1N0cmluZyhhY3R1YWwubmFtZSkgJiYgXy5pc1N0cmluZyhhY3R1YWwubWVzc2FnZSk7XG4gICAgfVxuICB9LFxuXG4gIHVuZGVmaW5lZDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHVuZGVmaW5lZC4nLFxuICAgIGRlc2M6ICd0byBiZSB1bmRlZmluZWQnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzVW5kZWZpbmVkKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBudWxsOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgbnVsbC4nLFxuICAgIGRlc2M6ICd0byBiZSBudWxsJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9PSBudWxsO1xuICAgIH1cbiAgfSxcbiAgTmFOOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgTmFOLicsXG4gICAgZGVzYzogJ3RvIGJlIE5hTicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNOdW1iZXIoYWN0dWFsKSkge1xuICAgICAgICB0aGlzLmZhaWwgPSAnd2FzICR7YWN0dWFsfSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmZhaWwgPSAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHRydWU6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyB0cnVlJyxcbiAgICBkZXNjOiAndG8gYmUgdHJ1ZScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGFjdHVhbCkpIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ3dhcyAke2FjdHVhbH0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWN0dWFsID09PSB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZmFsc2U6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBmYWxzZScsXG4gICAgZGVzYzogJ3RvIGJlIGZhbHNlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICB0aGlzLmZhaWwgPSAnd2FzICR7YWN0dWFsfSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmZhaWwgPSAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY3R1YWwgPT09IGZhbHNlO1xuICAgIH1cbiAgfSxcblxuICAvLyBUT0RPOiBUSElTIElTIFdST05HLCBXRSBXQU5UIFRPIENIRUNLIFZBTFVFUyBOT1QgS0VZU1xuICBoYXM6IHtcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGhhcyBvbmUgb3IgbW9yZSBzcGVjaWZpZWQgaXRlbXMnLFxuICAgIGRlc2M6ICd0byBoYXZlIHByb3BlcnR5ICR7ZXhwZWN0ZWR9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETzogT2ZmZXIgYmV0dGVyIGZhaWx1cmUgbWVzc2FnZVxuICAgICAgdGhpcy5mYWlsID0gJ2RpZCBub3QgaGF2ZSBhbGwgb2YgdGhlbSc7XG5cbiAgICAgIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gXy5ldmVyeShhcmdzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geCBpbiBhY3R1YWw7IH0pO1xuICAgIH1cbiAgfSxcbiAgaGFzT3duOiB7XG4gICAgYWxpYXNlczogWyAnY29udGFpbnMnLCAnaGFzS2V5JywgJ2hhc0luZGV4JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVjayBpZiB0aGUgdmFsdWUgaGFzIG9uZSBvciBtb3JlIG93biBwcm9wZXJ0aWVzIGFzIGRlZmluZWQgYnknLFxuICAgICAgJ3RoZSBnaXZlbiBhcmd1bWVudHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGhhdmUgb3duIHByb3BlcnR5ICR7IGV4cGVjdGVkIH0nLCAgLy8gVE9ETzogQ2FuIHdlIHN1cHBvcnQgbXVsdGlwbGUgYXJncz9cbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgdGhpcy5mYWlsID0gJ29ubHkgaGFkICR7IF8ua2V5cyhhY3R1YWwpIH0nO1xuXG4gICAgICAvLyBUT0RPOiBPZmZlciBiZXR0ZXIgZmFpbHVyZSBtZXNzYWdlXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIF8uZXZlcnkoYXJncywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIF8uaGFzKGFjdHVhbCwgeCk7IH0pO1xuICAgIH1cbiAgfSxcblxuICBsb2c6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRHVtcHMgdGhlIHJlY2VpdmVkIHZhbHVlIHRvIHRoZSBjb25zb2xlLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgY29uc29sZS5sb2coJ1tBU1NdJywgYWN0dWFsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZGVidWdnZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGFsdHMgc2NyaXB0IGV4ZWN1dGlvbiBieSB0cmlnZ2VyaW5nIHRoZSBpbnRlcmFjdGl2ZSBkZWJ1Z2dlci4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBmbjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDYWxscyB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gd2l0aCB0aGUgY3VycmVudCB2YWx1ZSBhcyBhcmd1bWVudC4nLFxuICAgICAgJ0lmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHNvbWV0aGluZyBkaWZmZXJlbnQgdG8gKnVuZGVmaW5lZCogdGhlJyxcbiAgICAgICdleHByZXNzaW9uIHdpbGwgZm9yayB0byBvcGVyYXRlIG9uIHRoZSByZXR1cm5lZCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnY2FsbCAke2FyZ3NbMV19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBmbikge1xuICAgICAgdmFyIHJlc3VsdCA9IGZuKGFjdHVhbCk7XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKHJlc3VsdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cblxuICBzaXplOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSBzaXplIG9mIHRoZSBjdXJyZW50IHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgc2l6ZScsXG4gICAgZmFpbDogJ25vdCBoYXMgYSBsZW5ndGg6ICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpIHx8IF8uaXNBcnJheShhY3R1YWwpIHx8IF8uaXNTdHJpbmcoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXy5zaXplKGFjdHVhbCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LFxuICBwcm9wOiB7XG4gICAgYWxpYXNlczogWyAna2V5JywgJ3Byb3BlcnR5JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIHZhbHVlIHByb3BlcnRpZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBwcm9wZXJ0eSB7eyBhcmcxIH19JyxcbiAgICBmYWlsOiAnd2FzIG5vdCBmb3VuZCBvbiB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGtleSkge1xuICAgICAgaWYgKF8uaXNPYmplY3QoYWN0dWFsKSAmJiBrZXkgaW4gYWN0dWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShhY3R1YWxba2V5XSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LFxuICBpbmRleDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIGluZGV4ZWQgdmFsdWVzIGZyb20nLFxuICAgICAgJ3RoZSBjdXJyZW50IHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgaW5kZXgge3sgYXJnMSB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgaWR4KSB7XG4gICAgICBpZiAoIV8uaXNBcnJheShhY3R1YWwpICYmICFfLmlzU3RyaW5nKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdub3QgYW4gYXJyYXkgb3IgYSBzdHJpbmc6ICR7YWN0dWFsfSc7XG4gICAgICB9XG4gICAgICBpZiAoaWR4IDwgMCB8fCBpZHggPj0gYWN0dWFsLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gJ291dCBvZiBib3VuZHMgZm9yICR7YWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShhY3R1YWxbaWR4XSk7XG4gICAgfVxuICB9LFxuXG4gIHNsaWNlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0V4dHJhY3RzIGEgcG9ydGlvbiBmcm9tIHRoZSB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnc2xpY2UoJHthcmdzWzBdfSwgJHthcmdzWzFdfSknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHN0YXJ0LCBlbmQpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50b0FycmF5KGFjdHVhbCkuc2xpY2Uoc3RhcnQsIGVuZClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGZpbHRlcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGNvbGxlY3Rpb24sIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUnLFxuICAgICAgJ29uIGFuIGFycmF5IHdpdGggYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggdGhlIGNhbGxiYWNrIHJldHVybmVkIHRydXRoeScsXG4gICAgICAnZm9yLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNmaWx0ZXInXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmZpbHRlcihhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHJlamVjdDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGNvbGxlY3Rpb24sIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUnLFxuICAgICAgJ29uIGFuIGFycmF5IHdpdGggYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggdGhlIGNhbGxiYWNrIHJldHVybmVkIGZhbHN5JyxcbiAgICAgICdmb3IgKHRoZSBvcHBvc2l0ZSBvZiAuZmlsdGVyKS4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVqZWN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5yZWplY3QoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHdoZXJlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1BlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIG9mIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24gdG8gdGhlIGdpdmVuJyxcbiAgICAgICdwcm9wZXJ0aWVzIG9iamVjdCwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBvZiBhbGwnLFxuICAgICAgJ2VsZW1lbnRzIHRoYXQgaGF2ZSBlcXVpdmFsZW50IHByb3BlcnR5IHZhbHVlcy4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3Mjd2hlcmUnXG4gICAgXSxcbiAgICBkZXNjOiAnd2hlcmUgJHthcmdzWzFdfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgcHJvcHMpIHtcbiAgICAgIC8vIFRPRE86IFdlIG5lZWQgdG8gc3VwcG9ydCBjb21wb3NhYmxlIG1hdGNoZXJzIGluIHRoZSBjb21wYXJpc29uISEhIVxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLndoZXJlKGFjdHVhbCwgcHJvcHMpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBtYXA6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIGNhbGxiYWNrIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWFwJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5tYXAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBpbnZva2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIG1ldGhvZCBuYW1lZCBieSB0aGUgYXJndW1lbnQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjaW52b2tlJ1xuICAgIF0sXG4gICAgZGVzYzogXCJpbnZva2UgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZE5hbWUsIGFyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmludm9rZS5hcHBseShfLCBhcmd1bWVudHMpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBwbHVjazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSB2YWx1ZSBmb3InLFxuICAgICAgJ3RoZSBzcGVjaWZpZWQgcHJvcGVydHkgZnJvbSBhbGwgZWxlbWVudHMgaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcGx1Y2snXG4gICAgXSxcbiAgICBkZXNjOiAncGx1Y2soJHthcmdzWzFdfSknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHByb3ApIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5wbHVjayhhY3R1YWwsIHByb3ApXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBmaXJzdDoge1xuICAgIGFsaWFzZXM6IFsgJ2hlYWQnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlyc3QnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGZpcnN0IGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5oZWFkKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBsYXN0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbGFzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5sYXN0KGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICByZXN0OiB7XG4gICAgYWxpYXNlczogWyAndGFpbCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnVE9ETycsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNyZXN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnRhaWwoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWluOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbnMgdG8gb3BlcmF0ZSBvbiB0aGUgbWluaW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWluJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5taW4oYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBtYXg6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9ucyB0byBvcGVyYXRlIG9uIHRoZSBtYXhpbXVtIHZhbHVlIGZvdW5kIG9uIHRoZScsXG4gICAgICAnY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXgnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1heChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuXG59KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIHVuYW5zaSA9IHJlcXVpcmUoJy4vdXRpbCcpLnVuYW5zaTtcblxuLy8gQVBJIGNvbXBhdGlibGUgd2l0aCBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2Fzc2VydGlvbi1lcnJvci9cbi8vIFRoaXMgc2hvdWxkIG1ha2UgaW50ZWdyYXRpb24gd2l0aCBNb2NoYSB3b3JrLCBpbmNsdWRpbmcgZGlmZmVkXG4vLyBvdXRwdXQuXG5mdW5jdGlvbiBBc3NFcnJvciAobWVzc2FnZSwgYWN0dWFsLCBleHBlY3RlZCwgc2hvd0RpZmYsIHNzZikge1xuICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXG4gIHRoaXMuYWN0dWFsID0gYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQ7XG5cbiAgdGhpcy5zaG93RGlmZiA9IHNob3dEaWZmIHx8IGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzc2YgfHwgYXJndW1lbnRzLmNhbGxlZSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zdGFjayA9IChuZXcgRXJyb3IobWVzc2FnZSkpLnN0YWNrO1xuICB9XG59O1xuQXNzRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuQXNzRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQXNzRXJyb3I7XG5Bc3NFcnJvci5wcm90b3R5cGUubmFtZSA9ICdBc3NFcnJvcic7XG5cbi8vIEltcGxlbWVudCBmaWx0ZXJpbmcgQVBJXG5Bc3NFcnJvci5wcm90b3R5cGUuZmlsdGVyU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChmcmFtZXMpIHtcbiAgcmV0dXJuIGZyYW1lcy5maWx0ZXIoZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgcmV0dXJuICEvQXNzRXJyb3J8YXNzZXJ0Ly50ZXN0KGZyYW1lLmdldEZ1bmN0aW9uTmFtZSgpKTtcbiAgfSk7XG59O1xuXG5Bc3NFcnJvci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKHN0YWNrKSB7XG4gIHZhciBwcm9wcyA9IHtcbiAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgbWVzc2FnZTogdW5hbnNpKHRoaXMubWVzc2FnZSksXG4gICAgYWN0dWFsOiB0aGlzLmFjdHVhbCxcbiAgICBleHBlY3RlZDogdGhpcy5leHBlY3RlZCxcbiAgICBzaG93RGlmZjogdGhpcy5zaG93RGlmZlxuICB9O1xuXG4gIC8vIGluY2x1ZGUgc3RhY2sgaWYgZXhpc3RzIGFuZCBub3QgdHVybmVkIG9mZlxuICBpZiAoZmFsc2UgIT09IHN0YWNrICYmIHRoaXMuc3RhY2spIHtcbiAgICBwcm9wcy5zdGFjayA9IHRoaXMuc3RhY2s7XG4gIH1cblxuICByZXR1cm4gcHJvcHM7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzRXJyb3I7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIHRlbXBsYXRlID0gcmVxdWlyZSgnLi91dGlsJykudGVtcGxhdGU7XG5cblxuLy8gRXhwZWN0YXRpb24gcmVwcmVzZW50cyBhbiBpbnN0YW50aWF0ZWQgTWF0Y2hlciBhbHJlYWR5XG4vLyBjb25maWd1cmVkIHdpdGggYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzLlxuZnVuY3Rpb24gRXhwZWN0YXRpb24gKG1hdGNoZXIsIGFyZ3MpIHtcbiAgdGhpcy5tYXRjaGVyID0gbWF0Y2hlcjtcbiAgdGhpcy5mYWlsID0gbWF0Y2hlci5mYWlsOyAgLy8gZmFpbCBtZXNzYWdlIGNhbiBiZSBvdmVycmlkZGVuXG4gIHRoaXMuYXJncyA9IGFyZ3MgfHwgW107XG4gIHRoaXMuZXhwZWN0ZWQgPSBhcmdzWzBdO1xuXG4gIC8vIFRPRE86IE1vdmUgdGhpcyB0byB0aGUgdGVtcGxhdGU/XG4gIHRoaXMuYXJncy5mb3JFYWNoKGZ1bmN0aW9uIChhcmcsIGlkeCkge1xuICAgICAgdGhpc1snYXJnJyArIChpZHggKyAxKV0gPSBhcmc7XG4gIH0sIHRoaXMpO1xuXG4gIHRoaXMuYWN0dWFsID0gdW5kZWZpbmVkO1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEV4cGVjdGF0aW9uO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwZWN0YXRpb24ucHJvdG90eXBlLCAnaGVscCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2hlci5oZWxwO1xuICB9XG59KTtcblxuLy8gSGVscGVyIHRvIGNoZWNrIGlmIGEgdmFsdWUgcGFzc2VzIHRoZSBleHBlY3RhdGlvbiwgaXQgdGFrZXMgY2FyZVxuLy8gb2YgaW5zcGVjdGluZyB0aGUgZXhwZWN0ZWQgdmFsdWUgYW5kIGRldGVjdCBpZiBpdCdzIGEgbWF0Y2hlci5cbi8vIE90aGVyd2lzZSBpdCB1c2VzIGxvb3NlIGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlcy5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICByZXR1cm4gXy5pc0VxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBDaGFpbikge1xuICAgICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYSk7XG4gICAgfVxuICAgIHJldHVybiBfLmlzRXF1YWwoYSwgYik7XG4gIH0pO1xufTtcblxuLy8gSGVscGVyIHRvIG11dGF0ZSB0aGUgdmFsdWUgdW5kZXIgdGVzdFxuRXhwZWN0YXRpb24ucHJvdG90eXBlLm11dGF0ZSA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICB9O1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIC8vIFJlc3RvcmUgdGhlIG1hdGNoZXIgZGVmYXVsdCBmYWlsIG1lc3NhZ2VcbiAgdGhpcy5mYWlsID0gdGhpcy5tYXRjaGVyLmZhaWw7XG5cbiAgLy8gVE9ETzogVGhpcyBtdXRhdGlvbiBvZiB0aGUgaW5zdGFuY2Ugd2lsbCBiZSBhdm9pZGVkIHdoZW5cbiAgLy8gICAgICAgdGhlcmUgaXMgYW4gbW9yZSBlbGFib3JhdGUgbWVjaGFuaXNtIGZvciBhcHBseWluZyB0aGVcbiAgLy8gICAgICAgdGVtcGxhdGVzXG4gIHRoaXMuYWN0dWFsID0gYWN0dWFsO1xuICB0aGlzLmFyZ3MudW5zaGlmdChhY3R1YWwpO1xuICB0cnkge1xuXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMubWF0Y2hlci50ZXN0LmFwcGx5KHRoaXMsIHRoaXMuYXJncyk7XG5cbiAgICAvLyBSZXR1cm5pbmcgYSBzdHJpbmcgb3ZlcnJpZGVzIHRoZSBtaXNtYXRjaCBkZXNjcmlwdGlvblxuICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5mYWlsID0gcmVzdWx0O1xuICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcblxuICB9IGZpbmFsbHkge1xuICAgIHRoaXMuYXJncy5zaGlmdCgpOyAgLy8gcmVtb3ZlIHRoZSBhY3R1YWwgdmFsdWUgZnJvbSBhcmdzXG4gIH1cbn07XG5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5nZXREZXNjcmlwdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLm1hdGNoZXIuZGVzYykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB0ZW1wbGF0ZSh0aGlzLm1hdGNoZXIuZGVzYywgdGhpcyk7XG59O1xuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUuZ2V0TWlzbWF0Y2ggPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0ZW1wbGF0ZSh0aGlzLmZhaWwsIHRoaXMpO1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5nZXREZXNjcmlwdGlvbigpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cGVjdGF0aW9uO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLy8gVGhlIE1hdGNoZXIgb2JqZWN0IGlzIGEgZGVzY3JpcHRvciBmb3IgdGhlIG1hdGNoaW5nIGxvZ2ljXG4vLyBidXQgY2Fubm90IGJlIHVzZWQgZGlyZWN0bHkuXG5cbnZhciBFeHBlY3RhdGlvbiA9IHJlcXVpcmUoJy4vZXhwZWN0YXRpb24nKTtcblxuXG5mdW5jdGlvbiBNYXRjaGVyIChuYW1lLCBkZXNjcmlwdG9yKSB7XG5cbiAgLy8gU2hvcnRjdXQgZm9yIHNpbXBsZSB0ZXN0IGZ1bmN0aW9uc1xuICBpZiAodHlwZW9mIGRlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkZXNjcmlwdG9yID0ge3Rlc3Q6IGRlc2NyaXB0b3J9O1xuICB9XG5cbiAgdGhpcy5uYW1lID0gbmFtZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShkZXNjcmlwdG9yLmhlbHApKSB7XG4gICAgdGhpcy5oZWxwID0gZGVzY3JpcHRvci5oZWxwLmpvaW4oJ1xcbicpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaGVscCA9IGRlc2NyaXB0b3IuaGVscCB8fCAnTm90IGF2YWlsYWJsZSc7XG4gIH1cblxuICB0aGlzLmRlc2MgPSBkZXNjcmlwdG9yLmRlc2MgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBkZXNjcmlwdG9yLmRlc2NcbiAgICAgICAgICAgIDogdGhpcy5uYW1lXG5cbiAgdGhpcy5mYWlsID0gZGVzY3JpcHRvci5mYWlsIHx8ICd3YXMgJHsgYWN0dWFsIH0nO1xuXG4gIHRoaXMudGVzdCA9IGRlc2NyaXB0b3IudGVzdCB8fCBmdW5jdGlvbiAoYWN0dWFsKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHRoaXMuYXJpdHkgPSBkZXNjcmlwdG9yLmFyaXR5ICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICA/IGRlc2NyaXB0b3IuYXJpdHlcbiAgICAgICAgICAgICA6IHRoaXMudGVzdC5sZW5ndGg7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5NYXRjaGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1hdGNoZXI7XG5cbk1hdGNoZXIucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IodGhpcy5uYW1lLCB7XG4gICAgaGVscDogdGhpcy5oZWxwLFxuICAgIGRlc2M6IHRoaXMuZGVzYyxcbiAgICBmYWlsOiB0aGlzLmZhaWwsXG4gICAgdGVzdDogdGhpcy50ZXN0XG4gIH0pO1xufTtcblxuLy8gRmFjdG9yeSBmb3IgRXhwZWN0YXRpb25cbk1hdGNoZXIucHJvdG90eXBlLmV4cGVjdGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIHJldHVybiBuZXcgRXhwZWN0YXRpb24odGhpcywgYXJncyk7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICc8QXNzLk1hdGNoZXIgJyArIHRoaXMubmFtZSArICc+Jztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXRjaGVyOyIsIi8vXG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcblxudmFyIERFRkFVTFRfUFJPUCA9ICdzaG91bGQnO1xuXG4vLyBJbnN0YWxscyB0aGUgdHlwaWNhbCAuc2hvdWxkIHByb3BlcnR5IG9uIHRoZSByb290IE9iamVjdC5cbi8vIFlvdSBjYW4gaW5zdGFsbCB1bmRlciBhbnkgbmFtZSBvZiB5b3VyIGNob29zaW5nIGJ5IGdpdmluZyBpdFxuLy8gYXMgYXJndW1lbnQuXG4vLyBCYXNpY2FsbHkgYm9ycm93ZWQgZnJvbSB0aGUgQ2hhaSBwcm9qZWN0OlxuLy8gIENvcHlyaWdodChjKSAyMDExLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4vLyAgaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9jaGFpL2Jsb2IvbWFzdGVyL2xpYi9jaGFpL2ludGVyZmFjZS9zaG91bGQuanNcbmZ1bmN0aW9uIHNob3VsZCAobmFtZSkge1xuXG4gIGlmIChuYW1lID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHNob3VsZC5yZXN0b3JlKCk7XG4gIH1cblxuICBuYW1lID0gbmFtZSB8fCBERUZBVUxUX1BST1A7XG5cbiAgaWYgKG5hbWUgaW4gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIGlmICghKE9iamVjdC5wcm90b3R5cGVbbmFtZV0gaW5zdGFuY2VvZiBDaGFpbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXNzLnNob3VsZDogT2JqZWN0LnByb3RvdHlwZSBhbHJlYWR5IGhhcyBhIC5zaG91bGQgcHJvcGVydHknKTtcbiAgICB9XG4gIH1cblxuICAvLyBtb2RpZnkgT2JqZWN0LnByb3RvdHlwZSB0byBoYXZlIGBzaG91bGRgXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIFN0cmluZyB8fCB0aGlzIGluc3RhbmNlb2YgTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcy5jb25zdHJ1Y3Rvcih0aGlzKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMgaW5zdGFuY2VvZiBCb29sZWFuKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyA9PSB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQWxsb3c6IGdsb2JhbC5zaG91bGQgPSByZXF1aXJlKCdhc3MnKS5zaG91bGQoKVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgIC8vIEFsbG93IHJlc3RvcmF0aW9uXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbnNob3VsZC5yZXN0b3JlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgbmFtZSA9IG5hbWUgfHwgREVGQVVMVF9QUk9QO1xuXG4gIGlmIChuYW1lIGluIE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZVtuYW1lXSBpbnN0YW5jZW9mIENoYWluKSB7XG4gICAgICBkZWxldGUgT2JqZWN0LnByb3RvdHlwZVtuYW1lXTtcbiAgICB9XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGQ7IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbi8vIEF2b2lkIHJlcGVhdGVkIGNvbXBpbGF0aW9ucyBieSBtZW1vaXppbmdcbnZhciBjb21waWxlVGVtcGxhdGUgPSBfLm1lbW9pemUoZnVuY3Rpb24gKHRwbCkge1xuICByZXR1cm4gXy50ZW1wbGF0ZSh0cGwsIG51bGwsIHtcbiAgICBlc2NhcGU6IC9cXHtcXHsoW1xcc1xcU10rPylcXH1cXH0vZ1xuICB9KTtcbn0pO1xuXG4vLyBEdW1wcyBhcmJpdHJhcnkgdmFsdWVzIGFzIHN0cmluZ3MgaW4gYSBjb25jaXNlIHdheVxuLy8gVE9ETzogaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9jaGFpL2Jsb2IvbWFzdGVyL2xpYi9jaGFpL3V0aWxzL29iakRpc3BsYXkuanNcbmZ1bmN0aW9uIHZhbHVlRHVtcGVyICh2KSB7XG4gIHZhciB2YWx1ZTtcblxuICBpZiAoXy5pc051bWJlcih2KSB8fCBfLmlzTmFOKHYpIHx8IF8uaXNCb29sZWFuKHYpIHx8IF8uaXNOdWxsKHYpIHx8IF8uaXNVbmRlZmluZWQodikpIHtcbiAgICB2YWx1ZSA9ICc8JyArIHYgKyAnPic7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfVxuXG4gIHJldHVybiAnXFx1MDAxYlsxOzM2bScgKyB2YWx1ZSArICdcXHUwMDFiWzA7MzltJztcbn1cblxuXG4vLyBDdXN0b21pemVkIHZlcnNpb24gb2YgbG9kYXNoIHRlbXBsYXRlXG5mdW5jdGlvbiB0ZW1wbGF0ZSAodHBsLCBjb250ZXh0KSB7XG4gIHZhciBvcmlnRXNjYXBlID0gXy5lc2NhcGU7XG4gIHRyeSB7XG4gICAgLy8gT3ZlcnJpZGUgdGhlIGRlZmF1bHQgZXNjYXBlIGZ1bmN0aW9uIHRvIHVzZSBpdCBmb3IgZHVtcGluZyBmb3JtYXR0ZWQgdmFsdWVzXG4gICAgXy5lc2NhcGUgPSB2YWx1ZUR1bXBlcjtcblxuICAgIHJldHVybiBjb21waWxlVGVtcGxhdGUodHBsKShjb250ZXh0KTtcblxuICB9IGZpbmFsbHkge1xuICAgIF8uZXNjYXBlID0gb3JpZ0VzY2FwZTtcbiAgfVxufVxuXG4vLyBSZW1vdmUgQU5TSSBlc2NhcGVzIGZyb20gYSBzdHJpbmdcbmZ1bmN0aW9uIHVuYW5zaSAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXFx4MWJcXFsoXFxkKzs/KStbYS16XS9naSwgJycpO1xufVxuXG5cbmV4cG9ydHMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbmV4cG9ydHMudW5hbnNpID0gdW5hbnNpO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIvLyBSZWdpc3RlciB0aGUgZGVmYXVsdCBtYXRjaGVyc1xucmVxdWlyZSgnLi9saWIvY29yZS1tYXRjaGVycycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2Fzcy5qcycpO1xuIl19
