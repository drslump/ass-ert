!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ass=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var Chain = require('./chain');
var Matcher = require('./matcher');
var AssError = require('./error');
var util = require('./util');
var should = require('./should');


var defProp = Object.defineProperty.bind(Object);


// Public interface
function ass (value) {
  return new Chain(value);
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

ass.ok = function (message, cond) {
  if (arguments.length === 1) {
    cond = message;
    message = null;
  }
  return ass(cond, message || 'expected a truish value').equal(true);
};

ass.ko = function (message, cond) {
  if (arguments.length === 1) {
    cond = message;
    message = null;
  }
  return ass.ok('expected a falsy value', !cond);
};

// Resets or verifies the number of marks so far
ass.marks = function (expected, desc) {
  if (typeof expected === 'undefined') {
    expected = ass.marks.counter;
    ass.marks.counter = 0;
    return expected;  // return back how many there were
  }

  ass.desc('ass.marks').eq(expected).assert(ass.marks.counter);
};
ass.marks.counter = 0;


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
    // TODO: Avoid repeating assertions for every new one when we have an initial value
    return this.assert(this.value, fn);
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

  // Create a pass-thru version by prefixing the name with the dollar sign.
  // Calling this will apply the verification but return always the same
  // value if it a failure is not raised.
  defProp(ass, '$' + name, {
    value: function (value) {
      var context = new Chain(value);
      var result;
      if (fnKey === 'get') {
        result = context[name];
      } else {
        var args = Array.prototype.slice.call(arguments, 1);
        result = context[name].apply(context, args);
      }
      return result.valueOf();
    }
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
ass.should = function (name) {
  should(name);
  return ass;
};

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

  defProp(this, 'value', {
    value: arguments.length > 0 ? value : this.__GUARD__,
    enumerable: false,
    configurable: false,
    writable: true
  });

  // Support this use case: ass(value)._.some.number.above(5)._
  var deferred = this.__GUARD__;
  defProp(this, '_', {
    get: function () {
      if (deferred === this.__GUARD__) {
        deferred = this.value;
        this.value = this.__GUARD__;
      } else {
        this.assert(deferred);
      }
      return this;
    }
  });
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

  // Resolve the chain starting at root
  return resolver.call(this, this.expectations, actual);
};

// Default resolver to apply matchers over the subject value
Chain.prototype.assert = function (actual, ssf) {
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

    throw new AssError(error, actual, exp.expected, true, ssf);
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
      // TODO: Right now doesn't work since the chain is evaluated
      //       multiple times!!!!
      ass.marks.counter += 1;
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

  instanceOf: {
    aliases: [ 'instance', 'isa' ],
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
      return this.matches(actual, expected);
    }
  },
  number: {
    help: 'Check if the value is a number (different of NaN).',
    desc: 'to be a number',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return typeof actual === 'number' && !isNaN(actual);
    }
  },
  bool: {
    help: 'Check if the value is a boolean.',
    desc: 'to be a boolean',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return typeof actual === 'boolean';
    }
  },
  string: {
    aliases: [ 'str' ],
    help: 'Check if the value is a string.',
    desc: 'to be a string',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return typeof actual === 'string';
    }
  },
  object: {
    help: 'Check that value is of type object.',
    desc: 'to be an object',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return typeof actual === 'object';
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
      return Array.isArray(actual);
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

// Installs the typical .should property on the root Object.
// You can install under any name of your choosing by giving it
// as argument.
// Basically borrowed from the Chai project:
//  Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
//  https://github.com/chaijs/chai/blob/master/lib/chai/interface/should.js
function should (name) {

  name = name || 'should';

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
    configurable: false,
    enumerable: false
  });

}


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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2NvcmUtbWF0Y2hlcnMuanMiLCJsaWIvZXJyb3IuanMiLCJsaWIvZXhwZWN0YXRpb24uanMiLCJsaWIvbWF0Y2hlci5qcyIsImxpYi9zaG91bGQuanMiLCJsaWIvdXRpbC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciBNYXRjaGVyID0gcmVxdWlyZSgnLi9tYXRjaGVyJyk7XG52YXIgQXNzRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIHNob3VsZCA9IHJlcXVpcmUoJy4vc2hvdWxkJyk7XG5cblxudmFyIGRlZlByb3AgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkuYmluZChPYmplY3QpO1xuXG5cbi8vIFB1YmxpYyBpbnRlcmZhY2VcbmZ1bmN0aW9uIGFzcyAodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBDaGFpbih2YWx1ZSk7XG59XG5cbi8vIEdsb2JhbCByZWdpc3RyeSBvZiBtYXRjaGVycyAodXNlZCBmb3IgYXNzLmhlbHApXG5hc3MubWF0Y2hlcnMgPSBbXTtcblxuLy8gYXNzLmhlbHAgZHVtcHMgdGhlIGhlbHAgb2YgZWFjaCBtYXRjaGVyIHJlZ2lzdGVyZWRcbmRlZlByb3AoYXNzLCAnaGVscCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHMgPSAnJztcbiAgICBfLmZvckVhY2goYXNzLm1hdGNoZXJzLCBmdW5jdGlvbiAobWF0Y2hlcikge1xuICAgICAgLy8gVE9ETzogVGhpcyBjYW4gYmUgbmljZXJcbiAgICAgIHZhciBmbiA9IG1hdGNoZXIudGVzdC50b1N0cmluZygpO1xuICAgICAgdmFyIGFyZ3MgPSBmbi5yZXBsYWNlKC9eZnVuY3Rpb25cXHMqXFwoKFteXFwpXSopXFwpW1xcU1xcc10qLywgJyQxJyk7XG4gICAgICBhcmdzID0gYXJncy5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAoeCkgeyByZXR1cm4geC50cmltKCk7IH0pO1xuICAgICAgYXJncy5zaGlmdCgpO1xuICAgICAgZm4gPSBhcmdzLmxlbmd0aCA/ICcgKCcgKyBhcmdzLmpvaW4oJywgJykgKyAnKScgOiAnJztcblxuICAgICAgcyArPSAnPiAuJyArIG1hdGNoZXIubmFtZSArIGZuICsgJ1xcblxcbic7XG4gICAgICBzICs9ICcgICcgKyBtYXRjaGVyLmhlbHAucmVwbGFjZSgvXFxuL2csICdcXG4gICcpO1xuICAgICAgcyArPSAnXFxuXFxuJztcbiAgICB9KTtcbiAgICByZXR1cm4gcztcbiAgfVxufSk7XG5cbmFzcy5vayA9IGZ1bmN0aW9uIChtZXNzYWdlLCBjb25kKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgY29uZCA9IG1lc3NhZ2U7XG4gICAgbWVzc2FnZSA9IG51bGw7XG4gIH1cbiAgcmV0dXJuIGFzcyhjb25kLCBtZXNzYWdlIHx8ICdleHBlY3RlZCBhIHRydWlzaCB2YWx1ZScpLmVxdWFsKHRydWUpO1xufTtcblxuYXNzLmtvID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGNvbmQpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBjb25kID0gbWVzc2FnZTtcbiAgICBtZXNzYWdlID0gbnVsbDtcbiAgfVxuICByZXR1cm4gYXNzLm9rKCdleHBlY3RlZCBhIGZhbHN5IHZhbHVlJywgIWNvbmQpO1xufTtcblxuLy8gUmVzZXRzIG9yIHZlcmlmaWVzIHRoZSBudW1iZXIgb2YgbWFya3Mgc28gZmFyXG5hc3MubWFya3MgPSBmdW5jdGlvbiAoZXhwZWN0ZWQsIGRlc2MpIHtcbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBleHBlY3RlZCA9IGFzcy5tYXJrcy5jb3VudGVyO1xuICAgIGFzcy5tYXJrcy5jb3VudGVyID0gMDtcbiAgICByZXR1cm4gZXhwZWN0ZWQ7ICAvLyByZXR1cm4gYmFjayBob3cgbWFueSB0aGVyZSB3ZXJlXG4gIH1cblxuICBhc3MuZGVzYygnYXNzLm1hcmtzJykuZXEoZXhwZWN0ZWQpLmFzc2VydChhc3MubWFya3MuY291bnRlcik7XG59O1xuYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuXG5cbi8vIEhlbHBlciB0byByZWdpc3RlciBuZXcgbWF0Y2hlcnMgaW4gdGhlIHJlZ2lzdHJ5XG5hc3MucmVnaXN0ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWF0Y2hlcikge1xuICBpZiAobmFtZSBpbnN0YW5jZW9mIE1hdGNoZXIpIHtcbiAgICBtYXRjaGVyID0gbmFtZTtcbiAgICBuYW1lID0gbWF0Y2hlci5uYW1lO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgIE9iamVjdC5rZXlzKG5hbWUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgYXNzLnJlZ2lzdGVyKGtleSwgbmFtZVtrZXldKTtcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSB7ICAvLyBBc3N1bWUgYSBkZXNjcmlwdG9yIHdhcyBnaXZlblxuICAgIC8vIENyZWF0ZSB0aGUgYWxpYXNlcyBmaXJzdFxuICAgIF8uZm9yRWFjaChtYXRjaGVyLmFsaWFzZXMsIGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgYXNzLnJlZ2lzdGVyKG5ldyBNYXRjaGVyKGFsaWFzLCBtYXRjaGVyKSk7XG4gICAgfSk7XG5cbiAgICBtYXRjaGVyID0gbmV3IE1hdGNoZXIobmFtZSwgbWF0Y2hlcilcbiAgfVxuXG4gIC8vIEtlZXAgdGhlIG1hdGNoZXIgYXJvdW5kIGZvciBhc3MuaGVscFxuICBhc3MubWF0Y2hlcnMucHVzaChtYXRjaGVyKTtcblxuXG4gIC8vIFRPRE86IEFsbG93IG1hdGNoZXJzIHRvIGJlIG92ZXJyaWRkZW4gYW5kIGFsc28gb3ZlcmxvYWRlZFxuICAvLyAgICAgICBpZiB0aGV5IGhhdmUgYW4gXCJvdmVybG9hZFwiIG1ldGhvZCBpdCBjYW4gYmUgdXNlZFxuICAvLyAgICAgICB0byBjaGVjayB3aGljaCBvbmUgc2hvdWxkIGJlIHVzZWQuXG5cblxuICAvLyBNYXRjaGVyIGZ1bmN0aW9ucyB3aXRoIGEgc2luZ2xlIGFyZ3VtZW50IGFyZSBnZXR0ZXJzXG4gIHZhciBmbktleSA9IG1hdGNoZXIuYXJpdHkgPT09IDEgPyAnZ2V0JyA6ICd2YWx1ZSc7XG4gIHZhciBwcm9wID0ge1xuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9O1xuICBpZiAoZm5LZXkgPT09ICd2YWx1ZScpIHtcbiAgICBwcm9wLndyaXRhYmxlID0gZmFsc2U7XG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSBDaGFpbiBwcm90b3R5cGVcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiBmbiAoKSB7XG4gICAgLy8gVE9ETzogVmVyaWZ5IHRoZSBhcml0eSBvZiB0aGUgbWF0Y2hlciB2ZXJzdXMgdGhlIGNhbGxcbiAgICB2YXIgZXhwID0gbWF0Y2hlci5leHBlY3RhdGlvbi5hcHBseShtYXRjaGVyLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuZXhwZWN0YXRpb25zLnB1c2goZXhwKTtcbiAgICAvLyBUT0RPOiBBdm9pZCByZXBlYXRpbmcgYXNzZXJ0aW9ucyBmb3IgZXZlcnkgbmV3IG9uZSB3aGVuIHdlIGhhdmUgYW4gaW5pdGlhbCB2YWx1ZVxuICAgIHJldHVybiB0aGlzLmFzc2VydCh0aGlzLnZhbHVlLCBmbik7XG4gIH07XG5cbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHByb3ApO1xuXG4gIC8vIEF1Z21lbnQgdGhlIHN0YXRpYyBpbnRlcmZhY2VcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1hdGNoID0gbmV3IENoYWluKCk7XG5cbiAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICByZXR1cm4gbWF0Y2hbbmFtZV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoW25hbWVdLmFwcGx5KG1hdGNoLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIGRlZlByb3AoYXNzLCBuYW1lLCBwcm9wKTtcblxuICAvLyBDcmVhdGUgYSBwYXNzLXRocnUgdmVyc2lvbiBieSBwcmVmaXhpbmcgdGhlIG5hbWUgd2l0aCB0aGUgZG9sbGFyIHNpZ24uXG4gIC8vIENhbGxpbmcgdGhpcyB3aWxsIGFwcGx5IHRoZSB2ZXJpZmljYXRpb24gYnV0IHJldHVybiBhbHdheXMgdGhlIHNhbWVcbiAgLy8gdmFsdWUgaWYgaXQgYSBmYWlsdXJlIGlzIG5vdCByYWlzZWQuXG4gIGRlZlByb3AoYXNzLCAnJCcgKyBuYW1lLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ2hhaW4odmFsdWUpO1xuICAgICAgdmFyIHJlc3VsdDtcbiAgICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgICAgcmVzdWx0ID0gY29udGV4dFtuYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgcmVzdWx0ID0gY29udGV4dFtuYW1lXS5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQudmFsdWVPZigpO1xuICAgIH1cbiAgfSk7XG5cbn07XG5cblxuXG4vLyBPdmVycmlkZSBsb2Rhc2gncyBkZWZhdWx0IGNyZWF0ZUNhbGxiYWNrIG1lY2hhbmlzbSB0byBtYWtlIGl0IHVuZGVyc3RhbmRcbi8vIGFib3V0IG91ciBtYXRjaGVycyAodGhpcyBzaG91bGQgc29sdmUgcGx1Y2svbWFwL2ZpbHRlci8uLi4pLlxuLy8gVE9ETyEhISEhISEhISEhISEhXG4vLyBfLmNyZWF0ZUNhbGxiYWNrID0gXy53cmFwKF8uY3JlYXRlQ2FsbGJhY2ssIGZ1bmN0aW9uKGZ1bmMsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4vLyAgIHZhciBtYXRjaCA9IC9eKC4rPylfXyhbZ2xddCkoLispJC8uZXhlYyhjYWxsYmFjayk7XG4vLyAgIHJldHVybiAhbWF0Y2ggPyBmdW5jKGNhbGxiYWNrLCB0aGlzQXJnKSA6IGZ1bmN0aW9uKG9iamVjdCkge1xuLy8gICAgIHJldHVybiBtYXRjaFsyXSA9PSAnZ3QnID8gb2JqZWN0W21hdGNoWzFdXSA+IG1hdGNoWzNdIDogb2JqZWN0W21hdGNoWzFdXSA8IG1hdGNoWzNdO1xuLy8gICB9O1xuLy8gfSk7XG5cblxuLy8gQnVuZGxlIHNvbWUgb2YgdGhlIGludGVybmFsIHN0dWZmIHdpdGggdGhlIGFzcyBmdW5jdGlvblxuYXNzLkNoYWluID0gQ2hhaW47XG5hc3MuRXJyb3IgPSBBc3NFcnJvcjtcbmFzcy5zaG91bGQgPSBmdW5jdGlvbiAobmFtZSkge1xuICBzaG91bGQobmFtZSk7XG4gIHJldHVybiBhc3M7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzcztcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBBc3NFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKTtcblxudmFyIGRlZlByb3AgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkuYmluZChPYmplY3QpO1xuXG4vLyBBbiBleHBlY3RhdGlvbnMgY2hhaW4sIHRoZSBjb3JlIG9iamVjdCBvZiB0aGUgbGlicmFyeSwgYWxsb3dzXG4vLyB0byBzZXR1cCBhIHNldCBvZiBleHBlY3RhdGlvbnMgdG8gYmUgcnVuIGF0IGFueSBwb2ludCB3aXRoIGFcbi8vIHZhbHVlLlxuZnVuY3Rpb24gQ2hhaW4gKHZhbHVlKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDaGFpbikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FzcyBDaGFpbiBjb25zdHJ1Y3RvciBjYWxsZWQgd2l0aG91dCBuZXchJyk7XG4gIH1cblxuICAvLyBMaXN0IG9mIFsgRXhwZWN0YXRpb24gXVxuICBkZWZQcm9wKHRoaXMsICdleHBlY3RhdGlvbnMnLCB7XG4gICAgdmFsdWU6IFtdLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pO1xuXG4gIC8vIEN1c3RvbSBkZXNjcmlwdGlvblxuICBkZWZQcm9wKHRoaXMsICdkZXNjcmlwdGlvbicsIHtcbiAgICB2YWx1ZTogJycsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBTdXBwb3J0IHVzYWdlIGxpa2U6IGFzcy5zdHJpbmcuaGVscFxuICBkZWZQcm9wKHRoaXMsICdoZWxwJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gVE9ETzogUHJvZHVjdGl6ZSB0aGlzIGFuZCBwZXJoYXBzIHNob3cgaGVscCBmb3IgdGhlIHdob2xlIGNoYWluXG4gICAgICByZXR1cm4gdGhpcy5leHBlY3RhdGlvbnNbMF0uaGVscDtcbiAgICB9XG4gIH0pO1xuXG4gIGRlZlByb3AodGhpcywgJ3ZhbHVlJywge1xuICAgIHZhbHVlOiBhcmd1bWVudHMubGVuZ3RoID4gMCA/IHZhbHVlIDogdGhpcy5fX0dVQVJEX18sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBTdXBwb3J0IHRoaXMgdXNlIGNhc2U6IGFzcyh2YWx1ZSkuXy5zb21lLm51bWJlci5hYm92ZSg1KS5fXG4gIHZhciBkZWZlcnJlZCA9IHRoaXMuX19HVUFSRF9fO1xuICBkZWZQcm9wKHRoaXMsICdfJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGRlZmVycmVkID09PSB0aGlzLl9fR1VBUkRfXykge1xuICAgICAgICBkZWZlcnJlZCA9IHRoaXMudmFsdWU7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLl9fR1VBUkRfXztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYXNzZXJ0KGRlZmVycmVkKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSk7XG59XG5cbkNoYWluLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5DaGFpbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDaGFpbjtcblxuLy8gR3VhcmQgdG9rZW4gdG8gZGV0ZWN0IHZhbHVlbGVzcyBtYXRjaGVyc1xuQ2hhaW4ucHJvdG90eXBlLl9fR1VBUkRfXyA9IHtcbiAgdmFsdWVPZjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd7e3ZhbHVlbGVzc319JztcbiAgfVxufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIElmIHRoZSByZXNvbHZlZFxuLy8gYXJndW1lbnQgaXMgZ2l2ZW4gaXQnbGwgYmUgcG9wdWxhdGVkIHdpdGggYWxsIHRoZSBleHBlY3RhdGlvbnNcbi8vIHJlc29sdmVkIG9uIHRoaXMgcnVuIChzdG9wcyBvbiBmaXJzdCBmYWlsdXJlKS4gVGhlIHJlc3VsdCBpc1xuLy8gYWx3YXlzIGEgYm9vbGVhbiBpbmRpY2F0aW5nIHRoZSBvdXRjb21lLlxuLy8gTm90ZTogbmFtZWQgYHRlc3RgIHRvIGJlIGNvbXBhdGlibGUgd2l0aCBTaW5vbidzIG1hdGNoZXJzLlxuQ2hhaW4ucHJvdG90eXBlLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsLCByZXNvbHZlZCkge1xuXG4gIC8vIFRoaXMgaXMgdGhlIGNvcmUgcmVzb2x1dGlvbiBhbGdvcml0aG0sIGl0IG9wZXJhdGVzIG92ZXIgYSBsaXN0XG4gIC8vIG9mIGV4cHJlc3Npb25zIGNoZWNraW5nIHRoZW0gb25lIGFmdGVyIHRoZSBvdGhlciBhZ2FpbnN0IGEgdmFsdWUuXG4gIC8vIElmIGEgZnVuY3Rpb24gaXMgcmV0dXJuZWQgaXQnbGwgYmUgaW1tZWRpYXRlbHkgY2FsbGVkIHBhc3NpbmdcbiAgLy8gYXMgb25seSBhcmd1bWVudCB0aGUgc2FtZSByZXNvbHZlciBmdW5jdGlvbiB3aXRoIHRoZSByZW1haW5pbmdcbiAgLy8gZXhwZWN0YXRpb25zIGFyZ3VtZW50IGFscmVhZHkgYXBwbGllZCwgdGhpcyBhbGxvd3MgYW4gZXhwZWN0YXRpb25cbiAgLy8gdG8gb3ZlcnJpZGUgdGhlIHZhbHVlIGFuZC9vciBjb250cm9sIHRoZSBlbmQgcmVzdWx0IG9mIHRoZVxuICAvLyByZXNvbHV0aW9uIHdpdGhvdXQgZXhwb3NpbmcgdG9vIG1hbnkgZGV0YWlscy5cbiAgZnVuY3Rpb24gcmVzb2x2ZXIgKGV4cGVjdGF0aW9ucywgdmFsdWUpIHtcbiAgICB2YXIgZXhwLCByZXN1bHQ7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHBlY3RhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGV4cCA9IGV4cGVjdGF0aW9uc1tpXTtcblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB3aGF0IGV4cGVjdGF0aW9ucyBoYXZlIGFscmVhZHkgYmVlbiByZXNvbHZlZFxuICAgICAgcmVzb2x2ZWQgJiYgcmVzb2x2ZWQucHVzaChleHApO1xuXG4gICAgICByZXN1bHQgPSBleHAucmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAgIC8vIEFsbG93IGV4cGVjdGF0aW9ucyB0byB0YWtlIGNvbnRyb2wgb2YgdGhlIHJlbWFpbmluZyBjaGFpblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gQ29ybmVyIGNhc2Ugd2hlcmUgdGhlcmUgYXJlIG5vIG1vcmUgZXhwZWN0YXRpb25zIHdhaXRpbmdcbiAgICAgICAgLy8gdG8gYmUgcmVzb2x2ZWQgcmlnaHQgbm93LiBJbiB0aGF0IGNhc2UgYXNzdW1lIHRoYXQgdGhlXG4gICAgICAgIC8vIGV4cHJlc3Npb24gd2FzIHN1Y2Nlc3NmdWwuIGllOiBhc3MoJ2ZvbycpLm5vdC5lcXVhbCgnYmFyJylcbiAgICAgICAgaWYgKGkgPT09IGV4cGVjdGF0aW9ucy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0LmNhbGwoXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICByZXNvbHZlci5iaW5kKHRoaXMsIGV4cGVjdGF0aW9ucy5zbGljZShpICsgMSkpXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFN0b3Agb24gZmlyc3QgZmFpbHVyZVxuICAgICAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gUmVzb2x2ZSB0aGUgY2hhaW4gc3RhcnRpbmcgYXQgcm9vdFxuICByZXR1cm4gcmVzb2x2ZXIuY2FsbCh0aGlzLCB0aGlzLmV4cGVjdGF0aW9ucywgYWN0dWFsKTtcbn07XG5cbi8vIERlZmF1bHQgcmVzb2x2ZXIgdG8gYXBwbHkgbWF0Y2hlcnMgb3ZlciB0aGUgc3ViamVjdCB2YWx1ZVxuQ2hhaW4ucHJvdG90eXBlLmFzc2VydCA9IGZ1bmN0aW9uIChhY3R1YWwsIHNzZikge1xuICAvLyBKdXN0IGlnbm9yZSBpZiB0aGUgYWN0dWFsIHZhbHVlIGlzIG5vdCBwcmVzZW50IHlldFxuICBpZiAoYWN0dWFsID09PSB0aGlzLl9fR1VBUkRfXykgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIHJlc29sdmVkID0gW107XG4gIHZhciByZXN1bHQgPSB0aGlzLnRlc3QoYWN0dWFsLCByZXNvbHZlZCk7XG5cbiAgLy8gSXQgZmFpbGVkIHNvIHJlcG9ydCBpdCB3aXRoIGEgbmljZSBlcnJvclxuICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuXG4gICAgLy8gVXNpbmcgcXVhbnRpZmllcnMgaW50cm9kdWNlcyBkdXBsaWNhdGVzIGZvciBlYWNoIGl0ZXJhdGlvblxuICAgIHJlc29sdmVkID0gXy51bmlxKHJlc29sdmVkKTtcblxuICAgIC8vIEdldCB0aGUgb2ZmZW5kaW5nIGV4cGVjdGF0aW9uIChzaG91bGQgYmUgdGhlIGxhc3Qgb25lKVxuICAgIHZhciBleHAgPSByZXNvbHZlZC5wb3AoKTtcblxuICAgIHZhciBlcnJvciA9IHRoaXMuZGVzY3JpcHRpb24gKyAnXFxuXFxuJztcblxuICAgIHJlc29sdmVkLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgIHZhciBkZXNjID0geC5nZXREZXNjcmlwdGlvbigpO1xuICAgICAgaWYgKGRlc2MgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZXJyb3IgKz0gJyBcXHUwMDFiWzMybVBhc3NlZDpcXHUwMDFiWzM5bSAnICsgZGVzYyArICdcXG4nO1xuICAgIH0pO1xuXG4gICAgZXJyb3IgKz0gJyBcXHUwMDFiWzMxbUZhaWxlZDpcXHUwMDFiWzM5bSAnICsgZXhwLmdldERlc2NyaXB0aW9uKCkgKyAnXFxuJztcbiAgICBlcnJvciArPSAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMzltICcgKyBleHAuZ2V0TWlzbWF0Y2goKSArICdcXG4nO1xuXG4gICAgdGhyb3cgbmV3IEFzc0Vycm9yKGVycm9yLCBhY3R1YWwsIGV4cC5leHBlY3RlZCwgdHJ1ZSwgc3NmKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5kZXNjcmlwdGlvbikge1xuICAgIHJldHVybiB0aGlzLmRlc2NyaXB0aW9uO1xuICB9XG5cbiAgdmFyIGRlc2NzID0gdGhpcy5leHBlY3RhdGlvbnNcbiAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmdldERlc2NyaXB0aW9uKCk7IH0pXG4gICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5nZXREZXNjcmlwdGlvbigpOyB9KTtcblxuICBpZiAoZGVzY3MubGVuZ3RoID4gMSkge1xuICAgIHJldHVybiAnKCcgKyBkZXNjcy5qb2luKCcsICcpICsgJyknO1xuICB9IGVsc2UgaWYgKGRlc2NzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBkZXNjc1swXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJzxBc3M+JztcbiAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENoYWluO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4vYXNzJyk7XG5cbi8vIFNldCBvZiBkZWZhdWx0IG1hdGNoZXJzXG5hc3MucmVnaXN0ZXIoe1xuICBkZXNjOiB7XG4gICAgaGVscDogJ1Byb3ZpZGUgYSBjdXN0b20gZGVzY3JpcHRpb24gZm9yIHJlcG9ydGVkIGZhaWx1cmVzJyxcbiAgICBkZXNjOiBudWxsLCAgLy8gU2tpcCBpdCBmcm9tIHJlcG9ydHNcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBkZXNjKSB7XG4gICAgICAvLyBTaW5jZSB0aGUgcmV0dXJuZWQgZnVuY3Rpb24gd2lsbCBiZSBleGVjdXRlZCBvbiB0aGUgY2hhaW5cbiAgICAgIC8vIGNvbnRleHQgd2UgY2FuIHNldCB0aGVuIHRoZSBkZXNjcmlwdGlvbi4gQWx0aG91Z2ggdGhpcyBtZWFuc1xuICAgICAgLy8gdGhhdCBpdCB3b24ndCBiZSBzZXQgdW50aWwgdGhlIGNoYWluIGlzIGFjdHVhbGx5IHJlc29sdmVkLlxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzYztcbiAgICAgICAgcmV0dXJuIHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICAvLyBJZ25vcmVkIG1hdGNoZXJzXG4gIHRvOiB7XG4gICAgYWxpYXNlczogWyAnYScsICdhbicsICdiZScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnSnVzdCBzb21lIHN5bnRheCBzdWdhciB0byBtYWtlIHRoZSBleHBlY3RhdGlvbnMgZWFzaWVyIG9uJyxcbiAgICAgICd0aGUgZXllcy4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBtYXJrOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0luY3JlYXNlcyB0aGUgZ2xvYmFsIGBhc3MubWFya3NgIGNvdW50ZXIgZXZlcnkgdGltZSBpdCBnZXRzJyxcbiAgICAgICdldmFsdWF0ZWQgYXMgcGFydCBvZiBhbiBleHByZXNzaW9uLiBVc2UgaXQgdG8gdmVyaWZ5IHRoYXQgdGhlJyxcbiAgICAgICdleHBlY3RhdGlvbnMgYXJlIGFjdHVhbGx5IGJlaW5nIGV4ZWN1dGVkLicsXG4gICAgICAnQW4gZWFzeSB3YXkgdG8gc3VwcG9ydCB0aGlzIHdoZW4gdXNpbmcgYSB0ZXN0IHJ1bm5lciBpcyB0byByZXNldCcsXG4gICAgICAndGhlIGNvdW50ZXIgYnkgY2FsbGluZyBgYXNzLm1hcmtzKClgIG9uIGEgYmVmb3JlRWFjaCBob29rIGFuZCcsXG4gICAgICAndGhlbiB2ZXJpZnkgYXQgdGhlIGVuZCBvZiB0ZXN0IHdpdGggYGFzcy5tYXJrcyhOKWAgKHdoZXJlIE4gaXMnLFxuICAgICAgJ3RoZSBudW1iZXIgb2YgbWFya3MgeW91IGV4cGVjdGVkKS4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIC8vIFRPRE86IFJpZ2h0IG5vdyBkb2Vzbid0IHdvcmsgc2luY2UgdGhlIGNoYWluIGlzIGV2YWx1YXRlZFxuICAgICAgLy8gICAgICAgbXVsdGlwbGUgdGltZXMhISEhXG4gICAgICBhc3MubWFya3MuY291bnRlciArPSAxO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIC8vIEp1c3QgYWxsb3cgYW55dGhpbmcgOilcbiAgYW55OiB7XG4gICAgaGVscDogJ0FsbG93cyBhbnkgdmFsdWUgd2l0aG91dCB0ZXN0aW5nIGl0JyxcbiAgICBkZXNjOiAnaXMgYW55dGhpbmcnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgLy8gQW55dGhpbmcgdGhhdCBpc24ndCBudWxsIG9yIHVuZGVmaW5lZFxuICBkZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbm90IG51bGwgb3IgdW5kZWZpbmVkJyxcbiAgICBkZXNjOiAnaXMgZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAhPSBudWxsO1xuICAgIH1cbiAgfSxcbiAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGVtcHR5XG4gIGVtcHR5OiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgZW1wdHkgKGhhcyBhIGxlbmd0aCBvZiAwKScsXG4gICAgZGVzYzogJ2lzIGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9IG51bGwgJiYgYWN0dWFsLmxlbmd0aCA+IDA7XG4gICAgfVxuICB9LFxuICBub25FbXB0eToge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG5vdCBlbXB0eSAoaGFzIGEgbGVuZ3RoIGdyZWF0ZXIgdGhhbiAwKScsXG4gICAgZGVzYzogJ2lzIG5vdCBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA9PSBudWxsIHx8IGFjdHVhbC5sZW5ndGggPT09IDA7XG4gICAgfVxuICB9LFxuICB0cnV0aHk6IHtcbiAgICBoZWxwOiAnVGhlIHZhbHVlIHNob3VsZCBiZSB0cnV0aHkgKG5vdCB1bmRlZmluZWQsIG51bGwsIDAsIFwiXCIgb3IgW10pJyxcbiAgICBkZXNjOiAnaXMgdHJ1dGh5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWFjdHVhbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwubGVuZ3RoID09PSAnbnVtYmVyJyA/IGFjdHVhbC5sZW5ndGggPiAwIDogdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGZhbHN5OiB7XG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgZmFsc3kgKHVuZGVmaW5lZCwgbnVsbCwgMCwgXCJcIiBvciBbXSknLFxuICAgIGRlc2M6ICdpcyBmYWxzeScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFhY3R1YWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwubGVuZ3RoID09PSAnbnVtYmVyJyA/IGFjdHVhbCA9PT0gMCA6IHRydWU7XG4gICAgfVxuICB9LFxuXG4gIC8vIENvb3JkaW5hdGlvblxuICBhbmQ6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgbWF0Y2hlciBmcm9tIHR3byBvciBtb3JlIG9mIHRoZW0sIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhbGwgdGhlIG1hdGNoZXJzIHRoYXQgZm9ybSBpdCBkbyBzdWNjZWVkJ10sXG4gICAgZGVzYzogJygkeyBhcmdzLmpvaW4oXCIpIEFORCAoXCIpIH0pJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIHJldHVybiBfLmV2ZXJ5KGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgcmV0dXJuIGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIG9yOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IG1hdGNoZXIgZnJvbSB0d28gb3IgbW9yZSBvZiB0aGVtLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBtYXRjaGVycyBkb2VzJ10sXG4gICAgZGVzYzogJygkeyBhcmdzLmpvaW4oXCIpIE9SIChcIikgfSknLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIHJldHVybiBfLnNvbWUoYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICByZXR1cm4gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICAvLyBOZWdhdGlvblxuICBub3Q6IHtcbiAgICBoZWxwOiAnTmVnYXRlcyB0aGUgcmVzdWx0IGZvciB0aGUgcmVzdCBvZiB0aGUgZXhwcmVzc2lvbi4nLFxuICAgIGRlc2M6ICdOb3QhJyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIC8vIFRPRE86IE5lZ2F0aW9uIGRvZXNuJ3Qgd29yayB2ZXJ5IHdlbGwgd2l0aCBjaGFpbnMgYWxyZWFkeVxuICAgICAgLy8gICAgICAgaGF2aW5nIGEgdmFsdWUuIFRvIHNvbHZlIGl0IHBlcmhhcHMgaXQncyBiZXR0ZXIgdG9cbiAgICAgIC8vICAgICAgIHByb2R1Y2UgYSBkZXNjcmlwdGl2ZSBlcnJvciBvbiB0aGUgLm5vdCBnZXR0ZXIgd2l0aFxuICAgICAgLy8gICAgICAgYWx0ZXJuYXRpdmVzIG9uIGhvdyB0byB3b3JrIHdpdGggbmVnYXRpb24uXG4gICAgICAvLyAgICAgICBQZXJoYXBzIHdlIGNhbiBhbGxvdyAubm90Lm1hdGNoZXIgYnV0IHJhaXNlIGFuIGVycm9yXG4gICAgICAvLyAgICAgICBpZiBpdCdzIC5ub3QubWF0Y2hlci5tYXRjaGVyLlxuXG4gICAgICAvLyBSZXR1cm5pbmcgYSByZXNvbHZlciB3cmFwcGVyLCB3ZSBjYW4gdGhlbiBlaXRoZXIgbW9kaWZ5XG4gICAgICAvLyB0aGUgcmVzdWx0IG9yIHRoZSB2YWx1ZSBmZWVkIGludG8gdGhlIHBhcmVudCByZXNvbHZlclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXR1cm4gIXJlc29sdmVyKGFjdHVhbCk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICAvLyBRdWFudGlmaWVyc1xuICBldmVyeToge1xuICAgIGFsaWFzZXM6IFsgJ2FsbCcsICdhbGxPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnYWxsIG9mIHRoZW0gc3VjY2VlZCddLFxuICAgIGRlc2M6ICdGb3IgZXZlcnkgb25lOicsXG4gICAgZmFpbDogJ2F0IGxlYXN0IG9uZSBkaWRuXFwndCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXR1cm4gXy5ldmVyeShhY3R1YWwsIHJlc29sdmVyKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICBzb21lOiB7XG4gICAgYWxpYXNlZDogWyAnYW55T2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ2F0IGxlYXN0IG9uZSBvZiB0aGVtIHN1Y2NlZWRzJ10sXG4gICAgZGVzYzogJ0F0IGxlYXN0IG9uZTonLFxuICAgIGZhaWw6ICdub25lIGRpZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXR1cm4gXy5zb21lKGFjdHVhbCwgcmVzb2x2ZXIpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIG5vbmU6IHtcbiAgICBhbGlhc2VzOiBbICdub25lT2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ25vbmUgb2YgdGhlbSBzdWNjZWVkLidcbiAgICBdLFxuICAgIGRlc2M6ICdOb25lIG9mIHRoZW06JyxcbiAgICBmYWlsOiAnYXQgbGVhc3Qgb25lIGRpZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXR1cm4gIV8uc29tZShhY3R1YWwsIHJlc29sdmVyKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIC8vIFByb21pc2VzXG4gIHByb21pc2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnVmVyaWZpZXMgdGhhdCB0aGUgdmFsdWUgaXMgYSBwcm9taXNlIChQcm9taXNlL0ErKSBidXQgZG9lcyBub3QgYXR0YWNoIHRoZScsXG4gICAgICAndGhlIGNoYWluIG9mIG1hdGNoZXJzIHRvIGl0cyByZXNvbHV0aW9uIGxpa2UgYHJlc29sdmVzYCBvciBgcmVqZWN0c2AsJyxcbiAgICAgICdpbnN0ZWFkIHRoZSBvcmlnaW5hbCBwcm9taXNlIHZhbHVlIGlzIHN0aWxsIHRoZSBzdWJqZWN0IGZvciB0aGUgbmV4dCcsXG4gICAgICAnbWF0Y2hlcnMuJ10sXG4gICAgZGVzYzogJ3RvIGJlIGEgcHJvbWlzZScsXG4gICAgZmFpbDogJ2dvdCAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAmJiB0eXBlb2YgYWN0dWFsLnRoZW4gPT09ICdmdW5jdGlvbic7XG4gICAgfVxuICB9LFxuXG4gIC8vIFRPRE86IEhvdyBjYW4gd2Ugc3VwcG9ydCB0ZXN0IHJ1bm5lcnMgY29uc3VtaW5nIHByb21pc2VzIGlmIHRoZSBuYW1lXG4gIC8vICAgICAgIGhlcmUgaXMgXCJ0aGVuXCI/IFRoZSBvbmx5IHNvbHV0aW9uIHNlZW1zIHRvIGJlIHVzaW5nIFwicmVzb2x2ZXNcIi9cInJlamVjdHNcIlxuICAvLyBUT0RPOiBUaGUgY3VycmVudCBkZXNpZ24gc2VlbXMgdG8gd29yayBmb3IgdW5yZXNvbHZlZCBwcm9taXNlcyBidXRcbiAgLy8gICAgICAgd2hlbiB0aGUgcHJvbWlzZSBpcyBhbHJlYWR5IHJlc29sdmVkIChhbmQgdGhleSBhcmUgc3luYyBsaWtlIGluIHRlc3RzKVxuICAvLyAgICAgICB3aWxsIHRoZSBtYXRjaGVycyBhdHRhY2hlZCB0byB0aGUgZm9yayBiZSBldmFsdWF0ZWQ/XG4gIHJlc29sdmVzOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0F0dGFjaCB0aGUgbWF0Y2hlciB0byBhIHByb21pc2UgdmFsdWUgKFByb21pc2VzL0ErKSB0byBjb250aW51ZSBhcHBseWluZycsXG4gICAgICAndGhlIGNoYWluIG9mIG1hdGNoZXJzIG9uY2UgdGhlIHByb21pc2UgaGFzIGJlZW4gcmVzb2x2ZWQsIG11dGF0aW5nIHRoZScsXG4gICAgICAndmFsdWUgdG8gdGhlIHJlc29sdmVkIG9uZS4nLFxuICAgICAgJ0l0IHdpbGwgZmFpbCBpZiB0aGUgdmFsdWUgaXMgbm90IGEgcHJvbWlzZSAobm8gLnRoZW4gbWV0aG9kKSBvciB0aGUgcHJvbWlzZScsXG4gICAgICAnaXMgYWN0dWFsbHkgcmVqZWN0ZWQuJ10sXG4gICAgZGVzYzogJ3RvIGJlIGEgcmVzb2x2ZWQgcHJvbWlzZScsXG4gICAgZmFpbDogJ3dhcyByZWplY3RlZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFhY3R1YWwgfHwgdHlwZW9mIGFjdHVhbC50aGVuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZTogJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETzogVGhlIGFzeW5jIG5hdHVyZSBvZiBwcm9taXNlcyBjb3VsZCBiZSBhIHByb2JsZW0gc2luY2UgZXhwZWN0YXRpb25zXG4gICAgICAvLyAgICAgICBoYXZlIHNvbWUgc3RhdGUgd2hpbGUgdGhleSBleGVjdXRlLlxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICBhY3R1YWwudGhlbihyZXNvbHZlciwgXy5jb25zdGFudChmYWxzZSkpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIHJlamVjdHM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlIGFwcGx5aW5nJyxcbiAgICAgICd0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZWplY3RlZCwgbXV0YXRpbmcgdGhlJyxcbiAgICAgICd2YWx1ZSB0byB0aGUgcmVqZWN0ZWQgZXJyb3IuJyxcbiAgICAgICdJdCB3aWxsIGZhaWwgaWYgdGhlIHZhbHVlIGlzIG5vdCBhIHByb21pc2UgKG5vIC50aGVuIG1ldGhvZCkgb3IgdGhlIHByb21pc2UnLFxuICAgICAgJ2lzIGFjdHVhbGx5IHJlc29sdmVkLiddLFxuICAgIGRlc2M6ICd0byBiZSBhIHJlamVjdGVkIHByb21pc2UnLFxuICAgIGZhaWw6ICd3YXMgcmVzb2x2ZWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIWFjdHVhbCB8fCB0eXBlb2YgYWN0dWFsLnRoZW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBwcm9taXNlOiAke2FjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIGFjdHVhbC50aGVuKF8uY29uc3RhbnQoZmFsc2UpLCByZXNvbHZlcik7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBpczoge1xuICAgIGFsaWFzZXM6IFsgJ2VxdWFsJywgJ2VxdWFscycgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIHN0cmljdCBlcXVhbGl0eSBiZXR3ZWVuIHRoZSB2YWx1ZSBhbmQgaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIHN0cmljdGx5IGVxdWFsIHt7ZXhwZWN0ZWR9fScsICAvLyBUT0RPOiBleHBlY3RlZCBpcyBhbiBhbGlhcyBmb3IgYXJnc1sxXVxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPT09IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcbiAgZXE6IHtcbiAgICBhbGlhc2VzOiBbICdlcWwnLCAnZXFscycgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGRlZXAgbm9uLXN0cmljdCBlcXVhbGl0eSBiZXR3ZWVuIHRoZSB2YWx1ZSBhbmQgaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGVxdWFsIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXF1YWxzKGFjdHVhbCwgZXhwZWN0ZWQpO1xuICAgIH1cbiAgfSxcblxuICBhYm92ZToge1xuICAgIGFsaWFzZXM6IFsgJ2d0JywgJ21vcmVUaGFuJywgJ2dyZWF0ZXJUaGFuJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGhpZ2hlciB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBtb3JlIHRoYW4gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA+IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBiZWxvdzoge1xuICAgIGFsaWFzZXM6IFsgJ2x0JywgJ2xlc3NUaGFuJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGxvd2VyIHRoYSBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbGVzcyB0aGFuICR7ZXhwZWN0ZWR9JyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPCBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYWJvdmVPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnZ3RlJywgJ21vcmVUaGFuT3JFcXVhbCcsICdncmVhdGVyVGhhbk9yRXF1YWwnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID49IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBiZWxvd09yRXF1YWw6IHtcbiAgICBhbGlhc2VzOiBbICdsdGUnLCAnbGVzc1RoYW5PckVxdWFsJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGxvd2VyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDw9IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBpbnN0YW5jZU9mOiB7XG4gICAgYWxpYXNlczogWyAnaW5zdGFuY2UnLCAnaXNhJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3RvcicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIGluc3RhbmNlIG9mICR7ZXhwZWN0ZWR9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICB0eXBlb2Y6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBvZiBhIHNwZWNpZmljIHR5cGUnLFxuICAgIGRlc2M6ICd0byBoYXZlIHR5cGUgJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICdoYWQgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIHRoaXMubWF0Y2hlcyhhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICB9XG4gIH0sXG4gIG51bWJlcjoge1xuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBudW1iZXIgKGRpZmZlcmVudCBvZiBOYU4pLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgbnVtYmVyJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbCA9PT0gJ251bWJlcicgJiYgIWlzTmFOKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBib29sOiB7XG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIGJvb2xlYW4uJyxcbiAgICBkZXNjOiAndG8gYmUgYSBib29sZWFuJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbCA9PT0gJ2Jvb2xlYW4nO1xuICAgIH1cbiAgfSxcbiAgc3RyaW5nOiB7XG4gICAgYWxpYXNlczogWyAnc3RyJyBdLFxuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBzdHJpbmcuJyxcbiAgICBkZXNjOiAndG8gYmUgYSBzdHJpbmcnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsID09PSAnc3RyaW5nJztcbiAgICB9XG4gIH0sXG4gIG9iamVjdDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIG9mIHR5cGUgb2JqZWN0LicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIG9iamVjdCcsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwgPT09ICdvYmplY3QnO1xuICAgIH1cbiAgfSxcbiAgcGxhaW5PYmplY3Q6IHtcbiAgICBhbGlhc2VzOiBbICdwbGFpbicsICdvYmonIF0sXG4gICAgaGVscDogJ0NoZWNrcyB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZSBPYmplY3QgY29uc3RydWN0b3IuJyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNQbGFpbk9iamVjdChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgYXJyYXk6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBBcnJheS4nLFxuICAgIGRlc2M6ICd0byBiZSBhbiBBcnJheScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGZ1bmN0aW9uOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBGdW5jdGlvbi4nLFxuICAgIGRlc2M6ICd0byBiZSBhIEZ1bmN0aW9uJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICByZWdleHA6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIFJlZ0V4cCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgUmVnRXhwJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1JlZ0V4cChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZGF0ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRGF0ZScsXG4gICAgZGVzYzogJ3RvIGJlIGEgRGF0ZScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNEYXRlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBlbGVtZW50OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBET00gZWxlbWVudCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgRE9NIGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRWxlbWVudChhY3R1YWwpXG4gICAgfVxuICB9LFxuXG4gIHVuZGVmaW5lZDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHVuZGVmaW5lZC4nLFxuICAgIGRlc2M6ICd0byBiZSB1bmRlZmluZWQnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzVW5kZWZpbmVkKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBudWxsOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgbnVsbC4nLFxuICAgIGRlc2M6ICd0byBiZSBudWxsJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9PSBudWxsO1xuICAgIH1cbiAgfSxcbiAgTmFOOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgTmFOLicsXG4gICAgZGVzYzogJ3RvIGJlIE5hTicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNOdW1iZXIoYWN0dWFsKSkge1xuICAgICAgICB0aGlzLmZhaWwgPSAnd2FzICR7YWN0dWFsfSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmZhaWwgPSAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHRydWU6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyB0cnVlJyxcbiAgICBkZXNjOiAndG8gYmUgdHJ1ZScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGFjdHVhbCkpIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ3dhcyAke2FjdHVhbH0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWN0dWFsID09PSB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZmFsc2U6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBmYWxzZScsXG4gICAgZGVzYzogJ3RvIGJlIGZhbHNlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICB0aGlzLmZhaWwgPSAnd2FzICR7YWN0dWFsfSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmZhaWwgPSAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY3R1YWwgPT09IGZhbHNlO1xuICAgIH1cbiAgfSxcblxuICAvLyBUT0RPOiBUSElTIElTIFdST05HLCBXRSBXQU5UIFRPIENIRUNLIFZBTFVFUyBOT1QgS0VZU1xuICBoYXM6IHtcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGhhcyBvbmUgb3IgbW9yZSBzcGVjaWZpZWQgaXRlbXMnLFxuICAgIGRlc2M6ICd0byBoYXZlIHByb3BlcnR5ICR7ZXhwZWN0ZWR9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETzogT2ZmZXIgYmV0dGVyIGZhaWx1cmUgbWVzc2FnZVxuICAgICAgdGhpcy5mYWlsID0gJ2RpZCBub3QgaGF2ZSBhbGwgb2YgdGhlbSc7XG5cbiAgICAgIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gXy5ldmVyeShhcmdzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geCBpbiBhY3R1YWw7IH0pO1xuICAgIH1cbiAgfSxcbiAgaGFzT3duOiB7XG4gICAgYWxpYXNlczogWyAnY29udGFpbnMnLCAnaGFzS2V5JywgJ2hhc0luZGV4JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVjayBpZiB0aGUgdmFsdWUgaGFzIG9uZSBvciBtb3JlIG93biBwcm9wZXJ0aWVzIGFzIGRlZmluZWQgYnknLFxuICAgICAgJ3RoZSBnaXZlbiBhcmd1bWVudHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGhhdmUgb3duIHByb3BlcnR5ICR7IGV4cGVjdGVkIH0nLCAgLy8gVE9ETzogQ2FuIHdlIHN1cHBvcnQgbXVsdGlwbGUgYXJncz9cbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgdGhpcy5mYWlsID0gJ29ubHkgaGFkICR7IF8ua2V5cyhhY3R1YWwpIH0nO1xuXG4gICAgICAvLyBUT0RPOiBPZmZlciBiZXR0ZXIgZmFpbHVyZSBtZXNzYWdlXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIF8uZXZlcnkoYXJncywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIF8uaGFzKGFjdHVhbCwgeCk7IH0pO1xuICAgIH1cbiAgfSxcblxuICBsb2c6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRHVtcHMgdGhlIHJlY2VpdmVkIHZhbHVlIHRvIHRoZSBjb25zb2xlLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgY29uc29sZS5sb2coJ1tBU1NdJywgYWN0dWFsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZGVidWdnZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGFsdHMgc2NyaXB0IGV4ZWN1dGlvbiBieSB0cmlnZ2VyaW5nIHRoZSBpbnRlcmFjdGl2ZSBkZWJ1Z2dlci4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBmbjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDYWxscyB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gd2l0aCB0aGUgY3VycmVudCB2YWx1ZSBhcyBhcmd1bWVudC4nLFxuICAgICAgJ0lmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHNvbWV0aGluZyBkaWZmZXJlbnQgdG8gKnVuZGVmaW5lZCogdGhlJyxcbiAgICAgICdleHByZXNzaW9uIHdpbGwgZm9yayB0byBvcGVyYXRlIG9uIHRoZSByZXR1cm5lZCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnY2FsbCAke2FyZ3NbMV19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBmbikge1xuICAgICAgdmFyIHJlc3VsdCA9IGZuKGFjdHVhbCk7XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKHJlc3VsdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cblxuICBzaXplOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSBzaXplIG9mIHRoZSBjdXJyZW50IHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgc2l6ZScsXG4gICAgZmFpbDogJ25vdCBoYXMgYSBsZW5ndGg6ICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpIHx8IF8uaXNBcnJheShhY3R1YWwpIHx8IF8uaXNTdHJpbmcoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXy5zaXplKGFjdHVhbCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LFxuICBwcm9wOiB7XG4gICAgYWxpYXNlczogWyAna2V5JywgJ3Byb3BlcnR5JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIHZhbHVlIHByb3BlcnRpZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBwcm9wZXJ0eSB7eyBhcmcxIH19JyxcbiAgICBmYWlsOiAnd2FzIG5vdCBmb3VuZCBvbiB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGtleSkge1xuICAgICAgaWYgKF8uaXNPYmplY3QoYWN0dWFsKSAmJiBrZXkgaW4gYWN0dWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShhY3R1YWxba2V5XSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LFxuICBpbmRleDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIGluZGV4ZWQgdmFsdWVzIGZyb20nLFxuICAgICAgJ3RoZSBjdXJyZW50IHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgaW5kZXgge3sgYXJnMSB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgaWR4KSB7XG4gICAgICBpZiAoIV8uaXNBcnJheShhY3R1YWwpICYmICFfLmlzU3RyaW5nKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdub3QgYW4gYXJyYXkgb3IgYSBzdHJpbmc6ICR7YWN0dWFsfSc7XG4gICAgICB9XG4gICAgICBpZiAoaWR4IDwgMCB8fCBpZHggPj0gYWN0dWFsLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gJ291dCBvZiBib3VuZHMgZm9yICR7YWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShhY3R1YWxbaWR4XSk7XG4gICAgfVxuICB9LFxuXG4gIHNsaWNlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0V4dHJhY3RzIGEgcG9ydGlvbiBmcm9tIHRoZSB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnc2xpY2UoJHthcmdzWzBdfSwgJHthcmdzWzFdfSknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHN0YXJ0LCBlbmQpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50b0FycmF5KGFjdHVhbCkuc2xpY2Uoc3RhcnQsIGVuZClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGZpbHRlcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGNvbGxlY3Rpb24sIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUnLFxuICAgICAgJ29uIGFuIGFycmF5IHdpdGggYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggdGhlIGNhbGxiYWNrIHJldHVybmVkIHRydXRoeScsXG4gICAgICAnZm9yLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNmaWx0ZXInXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmZpbHRlcihhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHJlamVjdDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGNvbGxlY3Rpb24sIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUnLFxuICAgICAgJ29uIGFuIGFycmF5IHdpdGggYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggdGhlIGNhbGxiYWNrIHJldHVybmVkIGZhbHN5JyxcbiAgICAgICdmb3IgKHRoZSBvcHBvc2l0ZSBvZiAuZmlsdGVyKS4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVqZWN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5yZWplY3QoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHdoZXJlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1BlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIG9mIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24gdG8gdGhlIGdpdmVuJyxcbiAgICAgICdwcm9wZXJ0aWVzIG9iamVjdCwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBvZiBhbGwnLFxuICAgICAgJ2VsZW1lbnRzIHRoYXQgaGF2ZSBlcXVpdmFsZW50IHByb3BlcnR5IHZhbHVlcy4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3Mjd2hlcmUnXG4gICAgXSxcbiAgICBkZXNjOiAnd2hlcmUgJHthcmdzWzFdfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgcHJvcHMpIHtcbiAgICAgIC8vIFRPRE86IFdlIG5lZWQgdG8gc3VwcG9ydCBjb21wb3NhYmxlIG1hdGNoZXJzIGluIHRoZSBjb21wYXJpc29uISEhIVxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLndoZXJlKGFjdHVhbCwgcHJvcHMpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBtYXA6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIGNhbGxiYWNrIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWFwJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5tYXAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBpbnZva2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIG1ldGhvZCBuYW1lZCBieSB0aGUgYXJndW1lbnQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjaW52b2tlJ1xuICAgIF0sXG4gICAgZGVzYzogXCJpbnZva2UgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZE5hbWUsIGFyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmludm9rZS5hcHBseShfLCBhcmd1bWVudHMpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBwbHVjazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSB2YWx1ZSBmb3InLFxuICAgICAgJ3RoZSBzcGVjaWZpZWQgcHJvcGVydHkgZnJvbSBhbGwgZWxlbWVudHMgaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcGx1Y2snXG4gICAgXSxcbiAgICBkZXNjOiAncGx1Y2soJHthcmdzWzFdfSknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHByb3ApIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5wbHVjayhhY3R1YWwsIHByb3ApXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBmaXJzdDoge1xuICAgIGFsaWFzZXM6IFsgJ2hlYWQnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlyc3QnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGZpcnN0IGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5oZWFkKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBsYXN0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbGFzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5sYXN0KGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICByZXN0OiB7XG4gICAgYWxpYXNlczogWyAndGFpbCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnVE9ETycsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNyZXN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnRhaWwoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWluOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbnMgdG8gb3BlcmF0ZSBvbiB0aGUgbWluaW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWluJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5taW4oYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBtYXg6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9ucyB0byBvcGVyYXRlIG9uIHRoZSBtYXhpbXVtIHZhbHVlIGZvdW5kIG9uIHRoZScsXG4gICAgICAnY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXgnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1heChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuXG59KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIHVuYW5zaSA9IHJlcXVpcmUoJy4vdXRpbCcpLnVuYW5zaTtcblxuLy8gQVBJIGNvbXBhdGlibGUgd2l0aCBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2Fzc2VydGlvbi1lcnJvci9cbi8vIFRoaXMgc2hvdWxkIG1ha2UgaW50ZWdyYXRpb24gd2l0aCBNb2NoYSB3b3JrLCBpbmNsdWRpbmcgZGlmZmVkXG4vLyBvdXRwdXQuXG5mdW5jdGlvbiBBc3NFcnJvciAobWVzc2FnZSwgYWN0dWFsLCBleHBlY3RlZCwgc2hvd0RpZmYsIHNzZikge1xuICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXG4gIHRoaXMuYWN0dWFsID0gYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQ7XG5cbiAgdGhpcy5zaG93RGlmZiA9IHNob3dEaWZmIHx8IGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzc2YgfHwgYXJndW1lbnRzLmNhbGxlZSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zdGFjayA9IChuZXcgRXJyb3IobWVzc2FnZSkpLnN0YWNrO1xuICB9XG59O1xuQXNzRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuQXNzRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQXNzRXJyb3I7XG5Bc3NFcnJvci5wcm90b3R5cGUubmFtZSA9ICdBc3NFcnJvcic7XG5cbi8vIEltcGxlbWVudCBmaWx0ZXJpbmcgQVBJXG5Bc3NFcnJvci5wcm90b3R5cGUuZmlsdGVyU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChmcmFtZXMpIHtcbiAgcmV0dXJuIGZyYW1lcy5maWx0ZXIoZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgcmV0dXJuICEvQXNzRXJyb3J8YXNzZXJ0Ly50ZXN0KGZyYW1lLmdldEZ1bmN0aW9uTmFtZSgpKTtcbiAgfSk7XG59O1xuXG5Bc3NFcnJvci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKHN0YWNrKSB7XG4gIHZhciBwcm9wcyA9IHtcbiAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgbWVzc2FnZTogdW5hbnNpKHRoaXMubWVzc2FnZSksXG4gICAgYWN0dWFsOiB0aGlzLmFjdHVhbCxcbiAgICBleHBlY3RlZDogdGhpcy5leHBlY3RlZCxcbiAgICBzaG93RGlmZjogdGhpcy5zaG93RGlmZlxuICB9O1xuXG4gIC8vIGluY2x1ZGUgc3RhY2sgaWYgZXhpc3RzIGFuZCBub3QgdHVybmVkIG9mZlxuICBpZiAoZmFsc2UgIT09IHN0YWNrICYmIHRoaXMuc3RhY2spIHtcbiAgICBwcm9wcy5zdGFjayA9IHRoaXMuc3RhY2s7XG4gIH1cblxuICByZXR1cm4gcHJvcHM7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzRXJyb3I7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIHRlbXBsYXRlID0gcmVxdWlyZSgnLi91dGlsJykudGVtcGxhdGU7XG5cblxuLy8gRXhwZWN0YXRpb24gcmVwcmVzZW50cyBhbiBpbnN0YW50aWF0ZWQgTWF0Y2hlciBhbHJlYWR5XG4vLyBjb25maWd1cmVkIHdpdGggYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzLlxuZnVuY3Rpb24gRXhwZWN0YXRpb24gKG1hdGNoZXIsIGFyZ3MpIHtcbiAgdGhpcy5tYXRjaGVyID0gbWF0Y2hlcjtcbiAgdGhpcy5mYWlsID0gbWF0Y2hlci5mYWlsOyAgLy8gZmFpbCBtZXNzYWdlIGNhbiBiZSBvdmVycmlkZGVuXG4gIHRoaXMuYXJncyA9IGFyZ3MgfHwgW107XG4gIHRoaXMuZXhwZWN0ZWQgPSBhcmdzWzBdO1xuXG4gIC8vIFRPRE86IE1vdmUgdGhpcyB0byB0aGUgdGVtcGxhdGU/XG4gIHRoaXMuYXJncy5mb3JFYWNoKGZ1bmN0aW9uIChhcmcsIGlkeCkge1xuICAgICAgdGhpc1snYXJnJyArIChpZHggKyAxKV0gPSBhcmc7XG4gIH0sIHRoaXMpO1xuXG4gIHRoaXMuYWN0dWFsID0gdW5kZWZpbmVkO1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEV4cGVjdGF0aW9uO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwZWN0YXRpb24ucHJvdG90eXBlLCAnaGVscCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2hlci5oZWxwO1xuICB9XG59KTtcblxuLy8gSGVscGVyIHRvIGNoZWNrIGlmIGEgdmFsdWUgcGFzc2VzIHRoZSBleHBlY3RhdGlvbiwgaXQgdGFrZXMgY2FyZVxuLy8gb2YgaW5zcGVjdGluZyB0aGUgZXhwZWN0ZWQgdmFsdWUgYW5kIGRldGVjdCBpZiBpdCdzIGEgbWF0Y2hlci5cbi8vIE90aGVyd2lzZSBpdCB1c2VzIGxvb3NlIGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlcy5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICByZXR1cm4gXy5pc0VxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBDaGFpbikge1xuICAgICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYSk7XG4gICAgfVxuICAgIHJldHVybiBfLmlzRXF1YWwoYSwgYik7XG4gIH0pO1xufTtcblxuLy8gSGVscGVyIHRvIG11dGF0ZSB0aGUgdmFsdWUgdW5kZXIgdGVzdFxuRXhwZWN0YXRpb24ucHJvdG90eXBlLm11dGF0ZSA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICB9O1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIC8vIFJlc3RvcmUgdGhlIG1hdGNoZXIgZGVmYXVsdCBmYWlsIG1lc3NhZ2VcbiAgdGhpcy5mYWlsID0gdGhpcy5tYXRjaGVyLmZhaWw7XG5cbiAgLy8gVE9ETzogVGhpcyBtdXRhdGlvbiBvZiB0aGUgaW5zdGFuY2Ugd2lsbCBiZSBhdm9pZGVkIHdoZW5cbiAgLy8gICAgICAgdGhlcmUgaXMgYW4gbW9yZSBlbGFib3JhdGUgbWVjaGFuaXNtIGZvciBhcHBseWluZyB0aGVcbiAgLy8gICAgICAgdGVtcGxhdGVzXG4gIHRoaXMuYWN0dWFsID0gYWN0dWFsO1xuICB0aGlzLmFyZ3MudW5zaGlmdChhY3R1YWwpO1xuICB0cnkge1xuXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMubWF0Y2hlci50ZXN0LmFwcGx5KHRoaXMsIHRoaXMuYXJncyk7XG5cbiAgICAvLyBSZXR1cm5pbmcgYSBzdHJpbmcgb3ZlcnJpZGVzIHRoZSBtaXNtYXRjaCBkZXNjcmlwdGlvblxuICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5mYWlsID0gcmVzdWx0O1xuICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcblxuICB9IGZpbmFsbHkge1xuICAgIHRoaXMuYXJncy5zaGlmdCgpOyAgLy8gcmVtb3ZlIHRoZSBhY3R1YWwgdmFsdWUgZnJvbSBhcmdzXG4gIH1cbn07XG5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5nZXREZXNjcmlwdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLm1hdGNoZXIuZGVzYykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB0ZW1wbGF0ZSh0aGlzLm1hdGNoZXIuZGVzYywgdGhpcyk7XG59O1xuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUuZ2V0TWlzbWF0Y2ggPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0ZW1wbGF0ZSh0aGlzLmZhaWwsIHRoaXMpO1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5nZXREZXNjcmlwdGlvbigpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cGVjdGF0aW9uO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLy8gVGhlIE1hdGNoZXIgb2JqZWN0IGlzIGEgZGVzY3JpcHRvciBmb3IgdGhlIG1hdGNoaW5nIGxvZ2ljXG4vLyBidXQgY2Fubm90IGJlIHVzZWQgZGlyZWN0bHkuXG5cbnZhciBFeHBlY3RhdGlvbiA9IHJlcXVpcmUoJy4vZXhwZWN0YXRpb24nKTtcblxuXG5mdW5jdGlvbiBNYXRjaGVyIChuYW1lLCBkZXNjcmlwdG9yKSB7XG5cbiAgLy8gU2hvcnRjdXQgZm9yIHNpbXBsZSB0ZXN0IGZ1bmN0aW9uc1xuICBpZiAodHlwZW9mIGRlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkZXNjcmlwdG9yID0ge3Rlc3Q6IGRlc2NyaXB0b3J9O1xuICB9XG5cbiAgdGhpcy5uYW1lID0gbmFtZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShkZXNjcmlwdG9yLmhlbHApKSB7XG4gICAgdGhpcy5oZWxwID0gZGVzY3JpcHRvci5oZWxwLmpvaW4oJ1xcbicpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaGVscCA9IGRlc2NyaXB0b3IuaGVscCB8fCAnTm90IGF2YWlsYWJsZSc7XG4gIH1cblxuICB0aGlzLmRlc2MgPSBkZXNjcmlwdG9yLmRlc2MgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBkZXNjcmlwdG9yLmRlc2NcbiAgICAgICAgICAgIDogdGhpcy5uYW1lXG5cbiAgdGhpcy5mYWlsID0gZGVzY3JpcHRvci5mYWlsIHx8ICd3YXMgJHsgYWN0dWFsIH0nO1xuXG4gIHRoaXMudGVzdCA9IGRlc2NyaXB0b3IudGVzdCB8fCBmdW5jdGlvbiAoYWN0dWFsKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHRoaXMuYXJpdHkgPSBkZXNjcmlwdG9yLmFyaXR5ICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICA/IGRlc2NyaXB0b3IuYXJpdHlcbiAgICAgICAgICAgICA6IHRoaXMudGVzdC5sZW5ndGg7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5NYXRjaGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1hdGNoZXI7XG5cbk1hdGNoZXIucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IodGhpcy5uYW1lLCB7XG4gICAgaGVscDogdGhpcy5oZWxwLFxuICAgIGRlc2M6IHRoaXMuZGVzYyxcbiAgICBmYWlsOiB0aGlzLmZhaWwsXG4gICAgdGVzdDogdGhpcy50ZXN0XG4gIH0pO1xufTtcblxuLy8gRmFjdG9yeSBmb3IgRXhwZWN0YXRpb25cbk1hdGNoZXIucHJvdG90eXBlLmV4cGVjdGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIHJldHVybiBuZXcgRXhwZWN0YXRpb24odGhpcywgYXJncyk7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICc8QXNzLk1hdGNoZXIgJyArIHRoaXMubmFtZSArICc+Jztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXRjaGVyOyIsIi8vXG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcblxuLy8gSW5zdGFsbHMgdGhlIHR5cGljYWwgLnNob3VsZCBwcm9wZXJ0eSBvbiB0aGUgcm9vdCBPYmplY3QuXG4vLyBZb3UgY2FuIGluc3RhbGwgdW5kZXIgYW55IG5hbWUgb2YgeW91ciBjaG9vc2luZyBieSBnaXZpbmcgaXRcbi8vIGFzIGFyZ3VtZW50LlxuLy8gQmFzaWNhbGx5IGJvcnJvd2VkIGZyb20gdGhlIENoYWkgcHJvamVjdDpcbi8vICBDb3B5cmlnaHQoYykgMjAxMS0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS9pbnRlcmZhY2Uvc2hvdWxkLmpzXG5mdW5jdGlvbiBzaG91bGQgKG5hbWUpIHtcblxuICBuYW1lID0gbmFtZSB8fCAnc2hvdWxkJztcblxuICAvLyBtb2RpZnkgT2JqZWN0LnByb3RvdHlwZSB0byBoYXZlIGBzaG91bGRgXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIFN0cmluZyB8fCB0aGlzIGluc3RhbmNlb2YgTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcy5jb25zdHJ1Y3Rvcih0aGlzKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMgaW5zdGFuY2VvZiBCb29sZWFuKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyA9PSB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQWxsb3c6IGdsb2JhbC5zaG91bGQgPSByZXF1aXJlKCdhc3MnKS5zaG91bGQoKVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZDsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxuLy8gQXZvaWQgcmVwZWF0ZWQgY29tcGlsYXRpb25zIGJ5IG1lbW9pemluZ1xudmFyIGNvbXBpbGVUZW1wbGF0ZSA9IF8ubWVtb2l6ZShmdW5jdGlvbiAodHBsKSB7XG4gIHJldHVybiBfLnRlbXBsYXRlKHRwbCwgbnVsbCwge1xuICAgIGVzY2FwZTogL1xce1xceyhbXFxzXFxTXSs/KVxcfVxcfS9nXG4gIH0pO1xufSk7XG5cbi8vIER1bXBzIGFyYml0cmFyeSB2YWx1ZXMgYXMgc3RyaW5ncyBpbiBhIGNvbmNpc2Ugd2F5XG4vLyBUT0RPOiBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2NoYWkvYmxvYi9tYXN0ZXIvbGliL2NoYWkvdXRpbHMvb2JqRGlzcGxheS5qc1xuZnVuY3Rpb24gdmFsdWVEdW1wZXIgKHYpIHtcbiAgdmFyIHZhbHVlO1xuXG4gIGlmIChfLmlzTnVtYmVyKHYpIHx8IF8uaXNOYU4odikgfHwgXy5pc0Jvb2xlYW4odikgfHwgXy5pc051bGwodikgfHwgXy5pc1VuZGVmaW5lZCh2KSkge1xuICAgIHZhbHVlID0gJzwnICsgdiArICc+JztcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHYpO1xuICB9XG5cbiAgcmV0dXJuICdcXHUwMDFiWzE7MzZtJyArIHZhbHVlICsgJ1xcdTAwMWJbMDszOW0nO1xufVxuXG5cbi8vIEN1c3RvbWl6ZWQgdmVyc2lvbiBvZiBsb2Rhc2ggdGVtcGxhdGVcbmZ1bmN0aW9uIHRlbXBsYXRlICh0cGwsIGNvbnRleHQpIHtcbiAgdmFyIG9yaWdFc2NhcGUgPSBfLmVzY2FwZTtcbiAgdHJ5IHtcbiAgICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBlc2NhcGUgZnVuY3Rpb24gdG8gdXNlIGl0IGZvciBkdW1waW5nIGZvcm1hdHRlZCB2YWx1ZXNcbiAgICBfLmVzY2FwZSA9IHZhbHVlRHVtcGVyO1xuXG4gICAgcmV0dXJuIGNvbXBpbGVUZW1wbGF0ZSh0cGwpKGNvbnRleHQpO1xuXG4gIH0gZmluYWxseSB7XG4gICAgXy5lc2NhcGUgPSBvcmlnRXNjYXBlO1xuICB9XG59XG5cbi8vIFJlbW92ZSBBTlNJIGVzY2FwZXMgZnJvbSBhIHN0cmluZ1xuZnVuY3Rpb24gdW5hbnNpIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXHgxYlxcWyhcXGQrOz8pK1thLXpdL2dpLCAnJyk7XG59XG5cblxuZXhwb3J0cy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuZXhwb3J0cy51bmFuc2kgPSB1bmFuc2k7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8vIFJlZ2lzdGVyIHRoZSBkZWZhdWx0IG1hdGNoZXJzXG5yZXF1aXJlKCcuL2xpYi9jb3JlLW1hdGNoZXJzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvYXNzLmpzJyk7XG4iXX0=
