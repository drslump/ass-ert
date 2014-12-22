!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ass=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var Chain = require('./chain');
var Matcher = require('./matcher');
var AssError = require('./error');
var util = require('./util');

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

  ass(ass.marks.counter).eq(expected);
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
  prop[fnKey] = function () {
    // TODO: Verify the arity of the matcher versus the call
    var exp = matcher.expectation.apply(matcher, arguments);
    this.expectations.push(exp);
    return this.assert(this.value);
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


module.exports = ass;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./chain":2,"./error":4,"./matcher":6,"./util":7}],2:[function(require,module,exports){
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
    writable: false
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

// Resolves the current chain for a value. If the resolved argument
// is given it'll be populated with all the expectations resolved
// on this run (stops on first failure).
Chain.prototype.resolve = function (actual, resolved) {

  // This is the core resolution function, it operates over a list
  // of expressions checking them one after the other against a value.
  // If a function is returned it'll be immediately called passing
  // as only argument the same resolver function with the remaining
  // expectations already provisioned, so to complete the resolution
  // the matcher should invoke it passing the new value.
  function resolver (expectations, value) {
    var exp, result;
    for (var i = 0; i < expectations.length; i++) {
      exp = expectations[i];

      // Keep track of what expectations have already been resolved
      resolved && resolved.push(exp);

      result = exp.resolve(value);

      // Allow expectations to take control of the remaining chain
      if (typeof result === 'function') {
        return result(
          resolver.bind(this, expectations.slice(i + 1))
        );
      }

      if (result === false) {
        return false;
      }
    }

    return true;
  }

  // Resolve the chain starting at root
  return resolver(this.expectations, actual);
};

// Default resolver to apply matchers over the subject value
Chain.prototype.assert = function (actual) {
  // Just ignore if the actual value is not present yet
  if (actual === this.__GUARD__) return this;

  var resolved = [];
  var result = this.resolve(actual, resolved);

  // It failed so report it with a nice error
  if (result === false) {

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

    throw new AssError(error);
  }

  return this;
};


// Returns a bool (Sinon API compatibility)
Chain.prototype.test = function (actual) {
  return this.resolve(actual);
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
    desc: 'and',
    fail: 'TODO',
    test: function () {
      // TODO: Hamcrest CombinableMatcher.and (allOf)
    }
  },
  or: {
    help: [
      'Composes a new matcher from two or more of them, which will only',
      'succeed if at least one of the matchers does'],
    desc: 'or',
    fail: 'TODO',
    test: function () {
      // TODO: Hamcrest CombinableMatcher.or (anyOf)
    }
  },

  // Negation
  not: {
    help: 'Negates the result of following matchers',
    desc: 'not',
    fail: 'TODO',  // i.e.: .not.not makes it fail :)
    test: function (actual) {
      // Returning a resolver wrapper, we can then either modify
      // the result or the value feed into the parent resolver
      return function (resolver) {
        console.log('NOT RESOLVER', actual);
        return !resolver(actual);
      };
    }
  },
  lower: {
    help: 'TODO',
    desc: 'lower',
    fail: 'TODO',
    test: function (actual) {
      return function (resolver) {
        console.log('LOWER RESOLVER', actual);
        return resolver(actual.toLowerCase());
      };
    }
  },

  // Quantifiers
  every: {
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'all of them succeed'],
    desc: 'every one of the elements',
    fail: 'TODO',
    test: function (actual) {
      return function (resolver) {
        return _.every(actual, resolver);
      };
    }
  },
  some: {
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'at least one of them succeeds'],
    desc: 'some of the elements',
    fail: 'TODO',
    test: function (actual) {
      return function (resolver) {
        return _.some(actual, resolver);
      };
    }
  },
  none: {
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'none of them succeed.'
    ],
    desc: 'none of the elements',
    fail: 'TODO',
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
    desc: 'to strictly equal {{expected}}',  // TODO: expected is an alias for arg1
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
    desc: 'call ${arg1}',
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
    desc: 'get property ${ arg1 }',
    fail: 'was not found: ${actual}',
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
    desc: 'get index ${ arg1 }',
    test: function (actual, key) {
      if (!_.isArray(actual)) {
        return 'not an array: ${actual}';
      }
      if (key < 0 || key >= actual.length) {
        return 'out of bounds: ${actual}';
      }

      return this.mutate(actual[idx]);
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
    desc: 'where ${arg1}',
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
    desc: 'pluck(${arg1})',
    test: function (actual, prop) {
      return this.mutate(
        _.pluck(actual, prop)
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

},{"./util":7}],5:[function(require,module,exports){
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
  }
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
},{"./chain":2,"./util":7}],6:[function(require,module,exports){
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
    // Override the default escape function to use for dumping values instead
    // of ensuring HTML correctness.
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
},{}],8:[function(require,module,exports){
// Register the default matchers
require('./lib/core-matchers');

module.exports = require('./lib/ass.js');

},{"./lib/ass.js":1,"./lib/core-matchers":3}]},{},[8])(8)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2NvcmUtbWF0Y2hlcnMuanMiLCJsaWIvZXJyb3IuanMiLCJsaWIvZXhwZWN0YXRpb24uanMiLCJsaWIvbWF0Y2hlci5qcyIsImxpYi91dGlsLmpzIiwibWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMXJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIE1hdGNoZXIgPSByZXF1aXJlKCcuL21hdGNoZXInKTtcbnZhciBBc3NFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbnZhciBkZWZQcm9wID0gT2JqZWN0LmRlZmluZVByb3BlcnR5LmJpbmQoT2JqZWN0KTtcblxuXG4vLyBQdWJsaWMgaW50ZXJmYWNlXG5mdW5jdGlvbiBhc3MgKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpO1xufVxuXG4vLyBHbG9iYWwgcmVnaXN0cnkgb2YgbWF0Y2hlcnMgKHVzZWQgZm9yIGFzcy5oZWxwKVxuYXNzLm1hdGNoZXJzID0gW107XG5cbi8vIGFzcy5oZWxwIGR1bXBzIHRoZSBoZWxwIG9mIGVhY2ggbWF0Y2hlciByZWdpc3RlcmVkXG5kZWZQcm9wKGFzcywgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gJyc7XG4gICAgXy5mb3JFYWNoKGFzcy5tYXRjaGVycywgZnVuY3Rpb24gKG1hdGNoZXIpIHtcbiAgICAgIC8vIFRPRE86IFRoaXMgY2FuIGJlIG5pY2VyXG4gICAgICB2YXIgZm4gPSBtYXRjaGVyLnRlc3QudG9TdHJpbmcoKTtcbiAgICAgIHZhciBhcmdzID0gZm4ucmVwbGFjZSgvXmZ1bmN0aW9uXFxzKlxcKChbXlxcKV0qKVxcKVtcXFNcXHNdKi8sICckMScpO1xuICAgICAgYXJncyA9IGFyZ3Muc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgudHJpbSgpOyB9KTtcbiAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgIGZuID0gYXJncy5sZW5ndGggPyAnICgnICsgYXJncy5qb2luKCcsICcpICsgJyknIDogJyc7XG5cbiAgICAgIHMgKz0gJz4gLicgKyBtYXRjaGVyLm5hbWUgKyBmbiArICdcXG5cXG4nO1xuICAgICAgcyArPSAnICAnICsgbWF0Y2hlci5oZWxwLnJlcGxhY2UoL1xcbi9nLCAnXFxuICAnKTtcbiAgICAgIHMgKz0gJ1xcblxcbic7XG4gICAgfSk7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn0pO1xuXG5hc3Mub2sgPSBmdW5jdGlvbiAobWVzc2FnZSwgY29uZCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIGNvbmQgPSBtZXNzYWdlO1xuICAgIG1lc3NhZ2UgPSBudWxsO1xuICB9XG4gIHJldHVybiBhc3MoY29uZCwgbWVzc2FnZSB8fCAnZXhwZWN0ZWQgYSB0cnVpc2ggdmFsdWUnKS5lcXVhbCh0cnVlKTtcbn07XG5cbmFzcy5rbyA9IGZ1bmN0aW9uIChtZXNzYWdlLCBjb25kKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgY29uZCA9IG1lc3NhZ2U7XG4gICAgbWVzc2FnZSA9IG51bGw7XG4gIH1cbiAgcmV0dXJuIGFzcy5vaygnZXhwZWN0ZWQgYSBmYWxzeSB2YWx1ZScsICFjb25kKTtcbn07XG5cbi8vIFJlc2V0cyBvciB2ZXJpZmllcyB0aGUgbnVtYmVyIG9mIG1hcmtzIHNvIGZhclxuYXNzLm1hcmtzID0gZnVuY3Rpb24gKGV4cGVjdGVkLCBkZXNjKSB7XG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgZXhwZWN0ZWQgPSBhc3MubWFya3MuY291bnRlcjtcbiAgICBhc3MubWFya3MuY291bnRlciA9IDA7XG4gICAgcmV0dXJuIGV4cGVjdGVkOyAgLy8gcmV0dXJuIGJhY2sgaG93IG1hbnkgdGhlcmUgd2VyZVxuICB9XG5cbiAgYXNzKGFzcy5tYXJrcy5jb3VudGVyKS5lcShleHBlY3RlZCk7XG59O1xuYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuXG5cbi8vIEhlbHBlciB0byByZWdpc3RlciBuZXcgbWF0Y2hlcnMgaW4gdGhlIHJlZ2lzdHJ5XG5hc3MucmVnaXN0ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWF0Y2hlcikge1xuICBpZiAobmFtZSBpbnN0YW5jZW9mIE1hdGNoZXIpIHtcbiAgICBtYXRjaGVyID0gbmFtZTtcbiAgICBuYW1lID0gbWF0Y2hlci5uYW1lO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgIE9iamVjdC5rZXlzKG5hbWUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgYXNzLnJlZ2lzdGVyKGtleSwgbmFtZVtrZXldKTtcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSB7ICAvLyBBc3N1bWUgYSBkZXNjcmlwdG9yIHdhcyBnaXZlblxuICAgIC8vIENyZWF0ZSB0aGUgYWxpYXNlcyBmaXJzdFxuICAgIF8uZm9yRWFjaChtYXRjaGVyLmFsaWFzZXMsIGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgYXNzLnJlZ2lzdGVyKG5ldyBNYXRjaGVyKGFsaWFzLCBtYXRjaGVyKSk7XG4gICAgfSk7XG5cbiAgICBtYXRjaGVyID0gbmV3IE1hdGNoZXIobmFtZSwgbWF0Y2hlcilcbiAgfVxuXG4gIC8vIEtlZXAgdGhlIG1hdGNoZXIgYXJvdW5kIGZvciBhc3MuaGVscFxuICBhc3MubWF0Y2hlcnMucHVzaChtYXRjaGVyKTtcblxuICAvLyBNYXRjaGVyIGZ1bmN0aW9ucyB3aXRoIGEgc2luZ2xlIGFyZ3VtZW50IGFyZSBnZXR0ZXJzXG4gIHZhciBmbktleSA9IG1hdGNoZXIuYXJpdHkgPT09IDEgPyAnZ2V0JyA6ICd2YWx1ZSc7XG4gIHZhciBwcm9wID0ge1xuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9O1xuICBpZiAoZm5LZXkgPT09ICd2YWx1ZScpIHtcbiAgICBwcm9wLndyaXRhYmxlID0gZmFsc2U7XG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSBDaGFpbiBwcm90b3R5cGVcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gVE9ETzogVmVyaWZ5IHRoZSBhcml0eSBvZiB0aGUgbWF0Y2hlciB2ZXJzdXMgdGhlIGNhbGxcbiAgICB2YXIgZXhwID0gbWF0Y2hlci5leHBlY3RhdGlvbi5hcHBseShtYXRjaGVyLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuZXhwZWN0YXRpb25zLnB1c2goZXhwKTtcbiAgICByZXR1cm4gdGhpcy5hc3NlcnQodGhpcy52YWx1ZSk7XG4gIH07XG5cbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHByb3ApO1xuXG4gIC8vIEF1Z21lbnQgdGhlIHN0YXRpYyBpbnRlcmZhY2VcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1hdGNoID0gbmV3IENoYWluKCk7XG5cbiAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICByZXR1cm4gbWF0Y2hbbmFtZV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoW25hbWVdLmFwcGx5KG1hdGNoLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIGRlZlByb3AoYXNzLCBuYW1lLCBwcm9wKTtcblxuICAvLyBDcmVhdGUgYSBwYXNzLXRocnUgdmVyc2lvbiBieSBwcmVmaXhpbmcgdGhlIG5hbWUgd2l0aCB0aGUgZG9sbGFyIHNpZ24uXG4gIC8vIENhbGxpbmcgdGhpcyB3aWxsIGFwcGx5IHRoZSB2ZXJpZmljYXRpb24gYnV0IHJldHVybiBhbHdheXMgdGhlIHNhbWVcbiAgLy8gdmFsdWUgaWYgaXQgYSBmYWlsdXJlIGlzIG5vdCByYWlzZWQuXG4gIGRlZlByb3AoYXNzLCAnJCcgKyBuYW1lLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ2hhaW4odmFsdWUpO1xuICAgICAgdmFyIHJlc3VsdDtcbiAgICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgICAgcmVzdWx0ID0gY29udGV4dFtuYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgcmVzdWx0ID0gY29udGV4dFtuYW1lXS5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQudmFsdWVPZigpO1xuICAgIH1cbiAgfSk7XG5cbn07XG5cblxuXG4vLyBPdmVycmlkZSBsb2Rhc2gncyBkZWZhdWx0IGNyZWF0ZUNhbGxiYWNrIG1lY2hhbmlzbSB0byBtYWtlIGl0IHVuZGVyc3RhbmRcbi8vIGFib3V0IG91ciBtYXRjaGVycyAodGhpcyBzaG91bGQgc29sdmUgcGx1Y2svbWFwL2ZpbHRlci8uLi4pLlxuLy8gVE9ETyEhISEhISEhISEhISEhXG4vLyBfLmNyZWF0ZUNhbGxiYWNrID0gXy53cmFwKF8uY3JlYXRlQ2FsbGJhY2ssIGZ1bmN0aW9uKGZ1bmMsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4vLyAgIHZhciBtYXRjaCA9IC9eKC4rPylfXyhbZ2xddCkoLispJC8uZXhlYyhjYWxsYmFjayk7XG4vLyAgIHJldHVybiAhbWF0Y2ggPyBmdW5jKGNhbGxiYWNrLCB0aGlzQXJnKSA6IGZ1bmN0aW9uKG9iamVjdCkge1xuLy8gICAgIHJldHVybiBtYXRjaFsyXSA9PSAnZ3QnID8gb2JqZWN0W21hdGNoWzFdXSA+IG1hdGNoWzNdIDogb2JqZWN0W21hdGNoWzFdXSA8IG1hdGNoWzNdO1xuLy8gICB9O1xuLy8gfSk7XG5cblxuLy8gQnVuZGxlIHNvbWUgb2YgdGhlIGludGVybmFsIHN0dWZmIHdpdGggdGhlIGFzcyBmdW5jdGlvblxuYXNzLkNoYWluID0gQ2hhaW47XG5hc3MuRXJyb3IgPSBBc3NFcnJvcjtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzcztcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xuXG52YXIgZGVmUHJvcCA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eS5iaW5kKE9iamVjdCk7XG5cbi8vIEFuIGV4cGVjdGF0aW9ucyBjaGFpbiwgdGhlIGNvcmUgb2JqZWN0IG9mIHRoZSBsaWJyYXJ5LCBhbGxvd3Ncbi8vIHRvIHNldHVwIGEgc2V0IG9mIGV4cGVjdGF0aW9ucyB0byBiZSBydW4gYXQgYW55IHBvaW50IHdpdGggYVxuLy8gdmFsdWUuXG5mdW5jdGlvbiBDaGFpbiAodmFsdWUpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENoYWluKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQXNzIENoYWluIGNvbnN0cnVjdG9yIGNhbGxlZCB3aXRob3V0IG5ldyEnKTtcbiAgfVxuXG4gIC8vIExpc3Qgb2YgWyBFeHBlY3RhdGlvbiBdXG4gIGRlZlByb3AodGhpcywgJ2V4cGVjdGF0aW9ucycsIHtcbiAgICB2YWx1ZTogW10sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgLy8gQ3VzdG9tIGRlc2NyaXB0aW9uXG4gIGRlZlByb3AodGhpcywgJ2Rlc2NyaXB0aW9uJywge1xuICAgIHZhbHVlOiAnJyxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiB0cnVlXG4gIH0pO1xuXG4gIC8vIFN1cHBvcnQgdXNhZ2UgbGlrZTogYXNzLnN0cmluZy5oZWxwXG4gIGRlZlByb3AodGhpcywgJ2hlbHAnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBUT0RPOiBQcm9kdWN0aXplIHRoaXMgYW5kIHBlcmhhcHMgc2hvdyBoZWxwIGZvciB0aGUgd2hvbGUgY2hhaW5cbiAgICAgIHJldHVybiB0aGlzLmV4cGVjdGF0aW9uc1swXS5oZWxwO1xuICAgIH1cbiAgfSk7XG5cbiAgZGVmUHJvcCh0aGlzLCAndmFsdWUnLCB7XG4gICAgdmFsdWU6IGFyZ3VtZW50cy5sZW5ndGggPiAwID8gdmFsdWUgOiB0aGlzLl9fR1VBUkRfXyxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcbn1cblxuQ2hhaW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbkNoYWluLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENoYWluO1xuXG4vLyBHdWFyZCB0b2tlbiB0byBkZXRlY3QgdmFsdWVsZXNzIG1hdGNoZXJzXG5DaGFpbi5wcm90b3R5cGUuX19HVUFSRF9fID0ge1xuICB2YWx1ZU9mOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgfSxcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ3t7dmFsdWVsZXNzfX0nO1xuICB9XG59O1xuXG4vLyBSZXNvbHZlcyB0aGUgY3VycmVudCBjaGFpbiBmb3IgYSB2YWx1ZS4gSWYgdGhlIHJlc29sdmVkIGFyZ3VtZW50XG4vLyBpcyBnaXZlbiBpdCdsbCBiZSBwb3B1bGF0ZWQgd2l0aCBhbGwgdGhlIGV4cGVjdGF0aW9ucyByZXNvbHZlZFxuLy8gb24gdGhpcyBydW4gKHN0b3BzIG9uIGZpcnN0IGZhaWx1cmUpLlxuQ2hhaW4ucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiAoYWN0dWFsLCByZXNvbHZlZCkge1xuXG4gIC8vIFRoaXMgaXMgdGhlIGNvcmUgcmVzb2x1dGlvbiBmdW5jdGlvbiwgaXQgb3BlcmF0ZXMgb3ZlciBhIGxpc3RcbiAgLy8gb2YgZXhwcmVzc2lvbnMgY2hlY2tpbmcgdGhlbSBvbmUgYWZ0ZXIgdGhlIG90aGVyIGFnYWluc3QgYSB2YWx1ZS5cbiAgLy8gSWYgYSBmdW5jdGlvbiBpcyByZXR1cm5lZCBpdCdsbCBiZSBpbW1lZGlhdGVseSBjYWxsZWQgcGFzc2luZ1xuICAvLyBhcyBvbmx5IGFyZ3VtZW50IHRoZSBzYW1lIHJlc29sdmVyIGZ1bmN0aW9uIHdpdGggdGhlIHJlbWFpbmluZ1xuICAvLyBleHBlY3RhdGlvbnMgYWxyZWFkeSBwcm92aXNpb25lZCwgc28gdG8gY29tcGxldGUgdGhlIHJlc29sdXRpb25cbiAgLy8gdGhlIG1hdGNoZXIgc2hvdWxkIGludm9rZSBpdCBwYXNzaW5nIHRoZSBuZXcgdmFsdWUuXG4gIGZ1bmN0aW9uIHJlc29sdmVyIChleHBlY3RhdGlvbnMsIHZhbHVlKSB7XG4gICAgdmFyIGV4cCwgcmVzdWx0O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhwZWN0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBleHAgPSBleHBlY3RhdGlvbnNbaV07XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2Ygd2hhdCBleHBlY3RhdGlvbnMgaGF2ZSBhbHJlYWR5IGJlZW4gcmVzb2x2ZWRcbiAgICAgIHJlc29sdmVkICYmIHJlc29sdmVkLnB1c2goZXhwKTtcblxuICAgICAgcmVzdWx0ID0gZXhwLnJlc29sdmUodmFsdWUpO1xuXG4gICAgICAvLyBBbGxvdyBleHBlY3RhdGlvbnMgdG8gdGFrZSBjb250cm9sIG9mIHRoZSByZW1haW5pbmcgY2hhaW5cbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQoXG4gICAgICAgICAgcmVzb2x2ZXIuYmluZCh0aGlzLCBleHBlY3RhdGlvbnMuc2xpY2UoaSArIDEpKVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBSZXNvbHZlIHRoZSBjaGFpbiBzdGFydGluZyBhdCByb290XG4gIHJldHVybiByZXNvbHZlcih0aGlzLmV4cGVjdGF0aW9ucywgYWN0dWFsKTtcbn07XG5cbi8vIERlZmF1bHQgcmVzb2x2ZXIgdG8gYXBwbHkgbWF0Y2hlcnMgb3ZlciB0aGUgc3ViamVjdCB2YWx1ZVxuQ2hhaW4ucHJvdG90eXBlLmFzc2VydCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgLy8gSnVzdCBpZ25vcmUgaWYgdGhlIGFjdHVhbCB2YWx1ZSBpcyBub3QgcHJlc2VudCB5ZXRcbiAgaWYgKGFjdHVhbCA9PT0gdGhpcy5fX0dVQVJEX18pIHJldHVybiB0aGlzO1xuXG4gIHZhciByZXNvbHZlZCA9IFtdO1xuICB2YXIgcmVzdWx0ID0gdGhpcy5yZXNvbHZlKGFjdHVhbCwgcmVzb2x2ZWQpO1xuXG4gIC8vIEl0IGZhaWxlZCBzbyByZXBvcnQgaXQgd2l0aCBhIG5pY2UgZXJyb3JcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcblxuICAgIC8vIEdldCB0aGUgb2ZmZW5kaW5nIGV4cGVjdGF0aW9uIChzaG91bGQgYmUgdGhlIGxhc3Qgb25lKVxuICAgIHZhciBleHAgPSByZXNvbHZlZC5wb3AoKTtcblxuICAgIHZhciBlcnJvciA9IHRoaXMuZGVzY3JpcHRpb24gKyAnXFxuXFxuJztcblxuICAgIHJlc29sdmVkLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgIHZhciBkZXNjID0geC5nZXREZXNjcmlwdGlvbigpO1xuICAgICAgaWYgKGRlc2MgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZXJyb3IgKz0gJyBcXHUwMDFiWzMybVBhc3NlZDpcXHUwMDFiWzM5bSAnICsgZGVzYyArICdcXG4nO1xuICAgIH0pO1xuXG4gICAgZXJyb3IgKz0gJyBcXHUwMDFiWzMxbUZhaWxlZDpcXHUwMDFiWzM5bSAnICsgZXhwLmdldERlc2NyaXB0aW9uKCkgKyAnXFxuJztcbiAgICBlcnJvciArPSAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMzltICcgKyBleHAuZ2V0TWlzbWF0Y2goKSArICdcXG4nO1xuXG4gICAgdGhyb3cgbmV3IEFzc0Vycm9yKGVycm9yKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vLyBSZXR1cm5zIGEgYm9vbCAoU2lub24gQVBJIGNvbXBhdGliaWxpdHkpXG5DaGFpbi5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgcmV0dXJuIHRoaXMucmVzb2x2ZShhY3R1YWwpO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5kZXNjcmlwdGlvbikge1xuICAgIHJldHVybiB0aGlzLmRlc2NyaXB0aW9uO1xuICB9XG5cbiAgdmFyIGRlc2NzID0gdGhpcy5leHBlY3RhdGlvbnNcbiAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmdldERlc2NyaXB0aW9uKCk7IH0pXG4gICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5nZXREZXNjcmlwdGlvbigpOyB9KTtcblxuICBpZiAoZGVzY3MubGVuZ3RoID4gMSkge1xuICAgIHJldHVybiAnKCcgKyBkZXNjcy5qb2luKCcsICcpICsgJyknO1xuICB9IGVsc2UgaWYgKGRlc2NzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBkZXNjc1swXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJzxBc3M+JztcbiAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENoYWluO1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuL2FzcycpO1xuXG4vLyBTZXQgb2YgZGVmYXVsdCBtYXRjaGVyc1xuYXNzLnJlZ2lzdGVyKHtcbiAgZGVzYzoge1xuICAgIGhlbHA6ICdQcm92aWRlIGEgY3VzdG9tIGRlc2NyaXB0aW9uIGZvciByZXBvcnRlZCBmYWlsdXJlcycsXG4gICAgZGVzYzogbnVsbCwgIC8vIFNraXAgaXQgZnJvbSByZXBvcnRzXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZGVzYykge1xuICAgICAgLy8gU2luY2UgdGhlIHJldHVybmVkIGZ1bmN0aW9uIHdpbGwgYmUgZXhlY3V0ZWQgb24gdGhlIGNoYWluXG4gICAgICAvLyBjb250ZXh0IHdlIGNhbiBzZXQgdGhlbiB0aGUgZGVzY3JpcHRpb24uIEFsdGhvdWdoIHRoaXMgbWVhbnNcbiAgICAgIC8vIHRoYXQgaXQgd29uJ3QgYmUgc2V0IHVudGlsIHRoZSBjaGFpbiBpcyBhY3R1YWxseSByZXNvbHZlZC5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2M7XG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gSWdub3JlZCBtYXRjaGVyc1xuICB0bzoge1xuICAgIGFsaWFzZXM6IFsgJ2EnLCAnYW4nLCAnYmUnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0p1c3Qgc29tZSBzeW50YXggc3VnYXIgdG8gbWFrZSB0aGUgZXhwZWN0YXRpb25zIGVhc2llciBvbicsXG4gICAgICAndGhlIGV5ZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgbWFyazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJbmNyZWFzZXMgdGhlIGdsb2JhbCBgYXNzLm1hcmtzYCBjb3VudGVyIGV2ZXJ5IHRpbWUgaXQgZ2V0cycsXG4gICAgICAnZXZhbHVhdGVkIGFzIHBhcnQgb2YgYW4gZXhwcmVzc2lvbi4gVXNlIGl0IHRvIHZlcmlmeSB0aGF0IHRoZScsXG4gICAgICAnZXhwZWN0YXRpb25zIGFyZSBhY3R1YWxseSBiZWluZyBleGVjdXRlZC4nLFxuICAgICAgJ0FuIGVhc3kgd2F5IHRvIHN1cHBvcnQgdGhpcyB3aGVuIHVzaW5nIGEgdGVzdCBydW5uZXIgaXMgdG8gcmVzZXQnLFxuICAgICAgJ3RoZSBjb3VudGVyIGJ5IGNhbGxpbmcgYGFzcy5tYXJrcygpYCBvbiBhIGJlZm9yZUVhY2ggaG9vayBhbmQnLFxuICAgICAgJ3RoZW4gdmVyaWZ5IGF0IHRoZSBlbmQgb2YgdGVzdCB3aXRoIGBhc3MubWFya3MoTilgICh3aGVyZSBOIGlzJyxcbiAgICAgICd0aGUgbnVtYmVyIG9mIG1hcmtzIHlvdSBleHBlY3RlZCkuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAvLyBUT0RPOiBSaWdodCBub3cgZG9lc24ndCB3b3JrIHNpbmNlIHRoZSBjaGFpbiBpcyBldmFsdWF0ZWRcbiAgICAgIC8vICAgICAgIG11bHRpcGxlIHRpbWVzISEhIVxuICAgICAgYXNzLm1hcmtzLmNvdW50ZXIgKz0gMTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICAvLyBKdXN0IGFsbG93IGFueXRoaW5nIDopXG4gIGFueToge1xuICAgIGhlbHA6ICdBbGxvd3MgYW55IHZhbHVlIHdpdGhvdXQgdGVzdGluZyBpdCcsXG4gICAgZGVzYzogJ2lzIGFueXRoaW5nJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIC8vIEFueXRoaW5nIHRoYXQgaXNuJ3QgbnVsbCBvciB1bmRlZmluZWRcbiAgZGVmaW5lZDoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZCcsXG4gICAgZGVzYzogJ2lzIGRlZmluZWQnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgIT0gbnVsbDtcbiAgICB9XG4gIH0sXG4gIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBlbXB0eVxuICBlbXB0eToge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGVtcHR5IChoYXMgYSBsZW5ndGggb2YgMCknLFxuICAgIGRlc2M6ICdpcyBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAhPSBudWxsICYmIGFjdHVhbC5sZW5ndGggPiAwO1xuICAgIH1cbiAgfSxcbiAgbm9uRW1wdHk6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgZW1wdHkgKGhhcyBhIGxlbmd0aCBncmVhdGVyIHRoYW4gMCknLFxuICAgIGRlc2M6ICdpcyBub3QgZW1wdHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPT0gbnVsbCB8fCBhY3R1YWwubGVuZ3RoID09PSAwO1xuICAgIH1cbiAgfSxcbiAgdHJ1dGh5OiB7XG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgdHJ1dGh5IChub3QgdW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKScsXG4gICAgZGVzYzogJ2lzIHRydXRoeScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFhY3R1YWwpIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwubGVuZ3RoID4gMCA6IHRydWU7XG4gICAgfVxuICB9LFxuICBmYWxzeToge1xuICAgIGhlbHA6ICdUaGUgdmFsdWUgc2hvdWxkIGJlIGZhbHN5ICh1bmRlZmluZWQsIG51bGwsIDAsIFwiXCIgb3IgW10pJyxcbiAgICBkZXNjOiAnaXMgZmFsc3knLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwgPT09IDAgOiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICAvLyBDb29yZGluYXRpb25cbiAgYW5kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IG1hdGNoZXIgZnJvbSB0d28gb3IgbW9yZSBvZiB0aGVtLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYWxsIHRoZSBtYXRjaGVycyB0aGF0IGZvcm0gaXQgZG8gc3VjY2VlZCddLFxuICAgIGRlc2M6ICdhbmQnLFxuICAgIGZhaWw6ICdUT0RPJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBUT0RPOiBIYW1jcmVzdCBDb21iaW5hYmxlTWF0Y2hlci5hbmQgKGFsbE9mKVxuICAgIH1cbiAgfSxcbiAgb3I6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgbWF0Y2hlciBmcm9tIHR3byBvciBtb3JlIG9mIHRoZW0sIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIG1hdGNoZXJzIGRvZXMnXSxcbiAgICBkZXNjOiAnb3InLFxuICAgIGZhaWw6ICdUT0RPJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBUT0RPOiBIYW1jcmVzdCBDb21iaW5hYmxlTWF0Y2hlci5vciAoYW55T2YpXG4gICAgfVxuICB9LFxuXG4gIC8vIE5lZ2F0aW9uXG4gIG5vdDoge1xuICAgIGhlbHA6ICdOZWdhdGVzIHRoZSByZXN1bHQgb2YgZm9sbG93aW5nIG1hdGNoZXJzJyxcbiAgICBkZXNjOiAnbm90JyxcbiAgICBmYWlsOiAnVE9ETycsICAvLyBpLmUuOiAubm90Lm5vdCBtYWtlcyBpdCBmYWlsIDopXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgLy8gUmV0dXJuaW5nIGEgcmVzb2x2ZXIgd3JhcHBlciwgd2UgY2FuIHRoZW4gZWl0aGVyIG1vZGlmeVxuICAgICAgLy8gdGhlIHJlc3VsdCBvciB0aGUgdmFsdWUgZmVlZCBpbnRvIHRoZSBwYXJlbnQgcmVzb2x2ZXJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ05PVCBSRVNPTFZFUicsIGFjdHVhbCk7XG4gICAgICAgIHJldHVybiAhcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICBsb3dlcjoge1xuICAgIGhlbHA6ICdUT0RPJyxcbiAgICBkZXNjOiAnbG93ZXInLFxuICAgIGZhaWw6ICdUT0RPJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdMT1dFUiBSRVNPTFZFUicsIGFjdHVhbCk7XG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwudG9Mb3dlckNhc2UoKSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICAvLyBRdWFudGlmaWVyc1xuICBldmVyeToge1xuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdhbGwgb2YgdGhlbSBzdWNjZWVkJ10sXG4gICAgZGVzYzogJ2V2ZXJ5IG9uZSBvZiB0aGUgZWxlbWVudHMnLFxuICAgIGZhaWw6ICdUT0RPJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIHJldHVybiBfLmV2ZXJ5KGFjdHVhbCwgcmVzb2x2ZXIpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIHNvbWU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnYXQgbGVhc3Qgb25lIG9mIHRoZW0gc3VjY2VlZHMnXSxcbiAgICBkZXNjOiAnc29tZSBvZiB0aGUgZWxlbWVudHMnLFxuICAgIGZhaWw6ICdUT0RPJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIHJldHVybiBfLnNvbWUoYWN0dWFsLCByZXNvbHZlcik7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcbiAgbm9uZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdub25lIG9mIHRoZW0gc3VjY2VlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAnbm9uZSBvZiB0aGUgZWxlbWVudHMnLFxuICAgIGZhaWw6ICdUT0RPJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIHJldHVybiAhXy5zb21lKGFjdHVhbCwgcmVzb2x2ZXIpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gUHJvbWlzZXNcbiAgcHJvbWlzZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdWZXJpZmllcyB0aGF0IHRoZSB2YWx1ZSBpcyBhIHByb21pc2UgKFByb21pc2UvQSspIGJ1dCBkb2VzIG5vdCBhdHRhY2ggdGhlJyxcbiAgICAgICd0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgdG8gaXRzIHJlc29sdXRpb24gbGlrZSBgcmVzb2x2ZXNgIG9yIGByZWplY3RzYCwnLFxuICAgICAgJ2luc3RlYWQgdGhlIG9yaWdpbmFsIHByb21pc2UgdmFsdWUgaXMgc3RpbGwgdGhlIHN1YmplY3QgZm9yIHRoZSBuZXh0JyxcbiAgICAgICdtYXRjaGVycy4nXSxcbiAgICBkZXNjOiAndG8gYmUgYSBwcm9taXNlJyxcbiAgICBmYWlsOiAnZ290ICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICYmIHR5cGVvZiBhY3R1YWwudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9XG4gIH0sXG5cbiAgLy8gVE9ETzogSG93IGNhbiB3ZSBzdXBwb3J0IHRlc3QgcnVubmVycyBjb25zdW1pbmcgcHJvbWlzZXMgaWYgdGhlIG5hbWVcbiAgLy8gICAgICAgaGVyZSBpcyBcInRoZW5cIj8gVGhlIG9ubHkgc29sdXRpb24gc2VlbXMgdG8gYmUgdXNpbmcgXCJyZXNvbHZlc1wiL1wicmVqZWN0c1wiXG4gIC8vIFRPRE86IFRoZSBjdXJyZW50IGRlc2lnbiBzZWVtcyB0byB3b3JrIGZvciB1bnJlc29sdmVkIHByb21pc2VzIGJ1dFxuICAvLyAgICAgICB3aGVuIHRoZSBwcm9taXNlIGlzIGFscmVhZHkgcmVzb2x2ZWQgKGFuZCB0aGV5IGFyZSBzeW5jIGxpa2UgaW4gdGVzdHMpXG4gIC8vICAgICAgIHdpbGwgdGhlIG1hdGNoZXJzIGF0dGFjaGVkIHRvIHRoZSBmb3JrIGJlIGV2YWx1YXRlZD9cbiAgcmVzb2x2ZXM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlIGFwcGx5aW5nJyxcbiAgICAgICd0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZXNvbHZlZCwgbXV0YXRpbmcgdGhlJyxcbiAgICAgICd2YWx1ZSB0byB0aGUgcmVzb2x2ZWQgb25lLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZSBwcm9taXNlJyxcbiAgICAgICdpcyBhY3R1YWxseSByZWplY3RlZC4nXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZXNvbHZlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIHJlamVjdGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWFjdHVhbCB8fCB0eXBlb2YgYWN0dWFsLnRoZW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBwcm9taXNlOiAke2FjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICAvLyBUT0RPOiBUaGUgYXN5bmMgbmF0dXJlIG9mIHByb21pc2VzIGNvdWxkIGJlIGEgcHJvYmxlbSBzaW5jZSBleHBlY3RhdGlvbnNcbiAgICAgIC8vICAgICAgIGhhdmUgc29tZSBzdGF0ZSB3aGlsZSB0aGV5IGV4ZWN1dGUuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIGFjdHVhbC50aGVuKHJlc29sdmVyLCBfLmNvbnN0YW50KGZhbHNlKSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcbiAgcmVqZWN0czoge1xuICAgIGhlbHA6IFtcbiAgICAgICdBdHRhY2ggdGhlIG1hdGNoZXIgdG8gYSBwcm9taXNlIHZhbHVlIChQcm9taXNlcy9BKykgdG8gY29udGludWUgYXBwbHlpbmcnLFxuICAgICAgJ3RoZSBjaGFpbiBvZiBtYXRjaGVycyBvbmNlIHRoZSBwcm9taXNlIGhhcyBiZWVuIHJlamVjdGVkLCBtdXRhdGluZyB0aGUnLFxuICAgICAgJ3ZhbHVlIHRvIHRoZSByZWplY3RlZCBlcnJvci4nLFxuICAgICAgJ0l0IHdpbGwgZmFpbCBpZiB0aGUgdmFsdWUgaXMgbm90IGEgcHJvbWlzZSAobm8gLnRoZW4gbWV0aG9kKSBvciB0aGUgcHJvbWlzZScsXG4gICAgICAnaXMgYWN0dWFsbHkgcmVzb2x2ZWQuJ10sXG4gICAgZGVzYzogJ3RvIGJlIGEgcmVqZWN0ZWQgcHJvbWlzZScsXG4gICAgZmFpbDogJ3dhcyByZXNvbHZlZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghYWN0dWFsIHx8IHR5cGVvZiBhY3R1YWwudGhlbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6ICR7YWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgYWN0dWFsLnRoZW4oXy5jb25zdGFudChmYWxzZSksIHJlc29sdmVyKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIGlzOiB7XG4gICAgYWxpYXNlczogWyAnZXF1YWwnLCAnZXF1YWxzJyBdLFxuICAgIGhlbHA6ICdDaGVja3Mgc3RyaWN0IGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlIGFuZCBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gc3RyaWN0bHkgZXF1YWwge3tleHBlY3RlZH19JywgIC8vIFRPRE86IGV4cGVjdGVkIGlzIGFuIGFsaWFzIGZvciBhcmcxXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA9PT0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuICBlcToge1xuICAgIGFsaWFzZXM6IFsgJ2VxbCcsICdlcWxzJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgZGVlcCBub24tc3RyaWN0IGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlIGFuZCBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gZXF1YWwge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5lcXVhbHMoYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlOiB7XG4gICAgYWxpYXNlczogWyAnZ3QnLCAnbW9yZVRoYW4nLCAnZ3JlYXRlclRoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID4gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGJlbG93OiB7XG4gICAgYWxpYXNlczogWyAnbHQnLCAnbGVzc1RoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbG93ZXIgdGhhIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA8IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBhYm92ZU9yRXF1YWw6IHtcbiAgICBhbGlhc2VzOiBbICdndGUnLCAnbW9yZVRoYW5PckVxdWFsJywgJ2dyZWF0ZXJUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBoaWdoZXIgb3IgZXF1YWwgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbW9yZSB0aGFuIG9yIGVxdWFsIHRvICR7ZXhwZWN0ZWR9JyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPj0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGJlbG93T3JFcXVhbDoge1xuICAgIGFsaWFzZXM6IFsgJ2x0ZScsICdsZXNzVGhhbk9yRXF1YWwnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbG93ZXIgb3IgZXF1YWwgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvICR7ZXhwZWN0ZWR9JyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPD0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGluc3RhbmNlT2Y6IHtcbiAgICBhbGlhc2VzOiBbICdpbnN0YW5jZScsICdpc2EnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gaW5zdGFuY2Ugb2YgJHtleHBlY3RlZH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIHR5cGVvZjoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG9mIGEgc3BlY2lmaWMgdHlwZScsXG4gICAgZGVzYzogJ3RvIGhhdmUgdHlwZSAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ2hhZCAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXRjaGVzKGFjdHVhbCwgZXhwZWN0ZWQpO1xuICAgIH1cbiAgfSxcbiAgbnVtYmVyOiB7XG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIG51bWJlciAoZGlmZmVyZW50IG9mIE5hTikuJyxcbiAgICBkZXNjOiAndG8gYmUgYSBudW1iZXInLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsID09PSAnbnVtYmVyJyAmJiAhaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGJvb2w6IHtcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgYm9vbGVhbi4nLFxuICAgIGRlc2M6ICd0byBiZSBhIGJvb2xlYW4nLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsID09PSAnYm9vbGVhbic7XG4gICAgfVxuICB9LFxuICBzdHJpbmc6IHtcbiAgICBhbGlhc2VzOiBbICdzdHInIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZy4nLFxuICAgIGRlc2M6ICd0byBiZSBhIHN0cmluZycsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwgPT09ICdzdHJpbmcnO1xuICAgIH1cbiAgfSxcbiAgb2JqZWN0OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgb2YgdHlwZSBvYmplY3QuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gb2JqZWN0JyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbCA9PT0gJ29iamVjdCc7XG4gICAgfVxuICB9LFxuICBwbGFpbk9iamVjdDoge1xuICAgIGFsaWFzZXM6IFsgJ3BsYWluJywgJ29iaicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIE9iamVjdCBjb25zdHJ1Y3Rvci4nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1BsYWluT2JqZWN0KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBhcnJheToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGFuIEFycmF5LicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIEFycmF5JyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZnVuY3Rpb246IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIEZ1bmN0aW9uLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgRnVuY3Rpb24nLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRnVuY3Rpb24oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHJlZ2V4cDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgUmVnRXhwJyxcbiAgICBkZXNjOiAndG8gYmUgYSBSZWdFeHAnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUmVnRXhwKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBkYXRlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBEYXRlJyxcbiAgICBkZXNjOiAndG8gYmUgYSBEYXRlJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0RhdGUoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGVsZW1lbnQ6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIERPTSBlbGVtZW50JyxcbiAgICBkZXNjOiAndG8gYmUgYSBET00gZWxlbWVudCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNFbGVtZW50KGFjdHVhbClcbiAgICB9XG4gIH0sXG5cbiAgdW5kZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgdW5kZWZpbmVkLicsXG4gICAgZGVzYzogJ3RvIGJlIHVuZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNVbmRlZmluZWQoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG51bGw6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBudWxsLicsXG4gICAgZGVzYzogJ3RvIGJlIG51bGwnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgIT09IG51bGw7XG4gICAgfVxuICB9LFxuICBOYU46IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBOYU4uJyxcbiAgICBkZXNjOiAndG8gYmUgTmFOJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc051bWJlcihhY3R1YWwpKSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgdHJ1ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHRydWUnLFxuICAgIGRlc2M6ICd0byBiZSB0cnVlJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICB0aGlzLmZhaWwgPSAnd2FzICR7YWN0dWFsfSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmZhaWwgPSAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY3R1YWwgPT09IHRydWU7XG4gICAgfVxuICB9LFxuICBmYWxzZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGZhbHNlJyxcbiAgICBkZXNjOiAndG8gYmUgZmFsc2UnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzQm9vbGVhbihhY3R1YWwpKSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjdHVhbCA9PT0gZmFsc2U7XG4gICAgfVxuICB9LFxuXG4gIC8vIFRPRE86IFRISVMgSVMgV1JPTkcsIFdFIFdBTlQgVE8gQ0hFQ0sgVkFMVUVTIE5PVCBLRVlTXG4gIGhhczoge1xuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaGFzIG9uZSBvciBtb3JlIHNwZWNpZmllZCBpdGVtcycsXG4gICAgZGVzYzogJ3RvIGhhdmUgcHJvcGVydHkgJHtleHBlY3RlZH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ3dhcyAke2FjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICAvLyBUT0RPOiBPZmZlciBiZXR0ZXIgZmFpbHVyZSBtZXNzYWdlXG4gICAgICB0aGlzLmZhaWwgPSAnZGlkIG5vdCBoYXZlIGFsbCBvZiB0aGVtJztcblxuICAgICAgdmFyIGFyZ3MgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KGFyZ3MsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4IGluIGFjdHVhbDsgfSk7XG4gICAgfVxuICB9LFxuICBoYXNPd246IHtcbiAgICBhbGlhc2VzOiBbICdjb250YWlucycsICdoYXNLZXknLCAnaGFzSW5kZXgnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgb25lIG9yIG1vcmUgb3duIHByb3BlcnRpZXMgYXMgZGVmaW5lZCBieScsXG4gICAgICAndGhlIGdpdmVuIGFyZ3VtZW50cy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gaGF2ZSBvd24gcHJvcGVydHkgJHsgZXhwZWN0ZWQgfScsICAvLyBUT0RPOiBDYW4gd2Ugc3VwcG9ydCBtdWx0aXBsZSBhcmdzP1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ3dhcyAke2FjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmZhaWwgPSAnb25seSBoYWQgJHsgXy5rZXlzKGFjdHVhbCkgfSc7XG5cbiAgICAgIC8vIFRPRE86IE9mZmVyIGJldHRlciBmYWlsdXJlIG1lc3NhZ2VcbiAgICAgIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gXy5ldmVyeShhcmdzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4gXy5oYXMoYWN0dWFsLCB4KTsgfSk7XG4gICAgfVxuICB9LFxuXG4gIGxvZzoge1xuICAgIGhlbHA6IFtcbiAgICAgICdEdW1wcyB0aGUgcmVjZWl2ZWQgdmFsdWUgdG8gdGhlIGNvbnNvbGUuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBjb25zb2xlLmxvZygnW0FTU10nLCBhY3R1YWwpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBkZWJ1Z2dlcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdIYWx0cyBzY3JpcHQgZXhlY3V0aW9uIGJ5IHRyaWdnZXJpbmcgdGhlIGludGVyYWN0aXZlIGRlYnVnZ2VyLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgZGVidWdnZXI7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGZuOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NhbGxzIHRoZSBwcm92aWRlZCBmdW5jdGlvbiB3aXRoIHRoZSBjdXJyZW50IHZhbHVlIGFzIGFyZ3VtZW50LicsXG4gICAgICAnSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgc29tZXRoaW5nIGRpZmZlcmVudCB0byAqdW5kZWZpbmVkKiB0aGUnLFxuICAgICAgJ2V4cHJlc3Npb24gd2lsbCBmb3JrIHRvIG9wZXJhdGUgb24gdGhlIHJldHVybmVkIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdjYWxsICR7YXJnMX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZm4oYWN0dWFsKTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuXG4gIHNpemU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gdGhlIHNpemUgb2YgdGhlIGN1cnJlbnQgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBzaXplJyxcbiAgICBmYWlsOiAnbm90IGhhcyBhIGxlbmd0aDogJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGFjdHVhbCkgfHwgXy5pc0FycmF5KGFjdHVhbCkgfHwgXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShfLnNpemUoYWN0dWFsKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sXG4gIHByb3A6IHtcbiAgICBhbGlhc2VzOiBbICdrZXknLCAncHJvcGVydHknIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgdmFsdWUgcHJvcGVydGllcy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHByb3BlcnR5ICR7IGFyZzEgfScsXG4gICAgZmFpbDogJ3dhcyBub3QgZm91bmQ6ICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwga2V5KSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpICYmIGtleSBpbiBhY3R1YWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGFjdHVhbFtrZXldKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sXG4gIGluZGV4OiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgaW5kZXhlZCB2YWx1ZXMgZnJvbScsXG4gICAgICAndGhlIGN1cnJlbnQgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBpbmRleCAkeyBhcmcxIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGtleSkge1xuICAgICAgaWYgKCFfLmlzQXJyYXkoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ25vdCBhbiBhcnJheTogJHthY3R1YWx9JztcbiAgICAgIH1cbiAgICAgIGlmIChrZXkgPCAwIHx8IGtleSA+PSBhY3R1YWwubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAnb3V0IG9mIGJvdW5kczogJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGFjdHVhbFtpZHhdKTtcbiAgICB9XG4gIH0sXG5cbiAgZmlsdGVyOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0l0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgY29sbGVjdGlvbiwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZScsXG4gICAgICAnb24gYW4gYXJyYXkgd2l0aCBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCB0aGUgY2FsbGJhY2sgcmV0dXJuZWQgdHJ1dGh5JyxcbiAgICAgICdmb3IuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ZpbHRlcidcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uZmlsdGVyKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgcmVqZWN0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ0l0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgY29sbGVjdGlvbiwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZScsXG4gICAgICAnb24gYW4gYXJyYXkgd2l0aCBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCB0aGUgY2FsbGJhY2sgcmV0dXJuZWQgZmFsc3knLFxuICAgICAgJ2ZvciAodGhlIG9wcG9zaXRlIG9mIC5maWx0ZXIpLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNyZWplY3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnJlamVjdChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgd2hlcmU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnUGVyZm9ybXMgYSBkZWVwIGNvbXBhcmlzb24gb2YgZWFjaCBlbGVtZW50IGluIGEgY29sbGVjdGlvbiB0byB0aGUgZ2l2ZW4nLFxuICAgICAgJ3Byb3BlcnRpZXMgb2JqZWN0LCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIGFuIGFycmF5IG9mIGFsbCcsXG4gICAgICAnZWxlbWVudHMgdGhhdCBoYXZlIGVxdWl2YWxlbnQgcHJvcGVydHkgdmFsdWVzLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyN3aGVyZSdcbiAgICBdLFxuICAgIGRlc2M6ICd3aGVyZSAke2FyZzF9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wcykge1xuICAgICAgLy8gVE9ETzogV2UgbmVlZCB0byBzdXBwb3J0IGNvbXBvc2FibGUgbWF0Y2hlcnMgaW4gdGhlIGNvbXBhcmlzb24hISEhXG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ud2hlcmUoYWN0dWFsLCBwcm9wcylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1hcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXAnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1hcChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIGludm9rZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgbWV0aG9kIG5hbWVkIGJ5IHRoZSBhcmd1bWVudCBmb3IgZWFjaCBlbGVtZW50IGluIHRoZScsXG4gICAgICAnY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNpbnZva2UnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBtZXRob2ROYW1lLCBhcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5pbnZva2UuYXBwbHkoXywgYXJndW1lbnRzKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgcGx1Y2s6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgdmFsdWUgZm9yJyxcbiAgICAgICd0aGUgc3BlY2lmaWVkIHByb3BlcnR5IGZyb20gYWxsIGVsZW1lbnRzIGluIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3BsdWNrJ1xuICAgIF0sXG4gICAgZGVzYzogJ3BsdWNrKCR7YXJnMX0pJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucGx1Y2soYWN0dWFsLCBwcm9wKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWluOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbnMgdG8gb3BlcmF0ZSBvbiB0aGUgbWluaW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWluJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5taW4oYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBtYXg6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9ucyB0byBvcGVyYXRlIG9uIHRoZSBtYXhpbXVtIHZhbHVlIGZvdW5kIG9uIHRoZScsXG4gICAgICAnY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXgnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1heChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuXG59KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIHVuYW5zaSA9IHJlcXVpcmUoJy4vdXRpbCcpLnVuYW5zaTtcblxuLy8gQVBJIGNvbXBhdGlibGUgd2l0aCBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2Fzc2VydGlvbi1lcnJvci9cbi8vIFRoaXMgc2hvdWxkIG1ha2UgaW50ZWdyYXRpb24gd2l0aCBNb2NoYSB3b3JrLCBpbmNsdWRpbmcgZGlmZmVkXG4vLyBvdXRwdXQuXG5mdW5jdGlvbiBBc3NFcnJvciAobWVzc2FnZSwgYWN0dWFsLCBleHBlY3RlZCwgc2hvd0RpZmYsIHNzZikge1xuICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXG4gIHRoaXMuYWN0dWFsID0gYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQ7XG5cbiAgdGhpcy5zaG93RGlmZiA9IHNob3dEaWZmIHx8IGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzc2YgfHwgYXJndW1lbnRzLmNhbGxlZSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zdGFjayA9IChuZXcgRXJyb3IobWVzc2FnZSkpLnN0YWNrO1xuICB9XG59O1xuQXNzRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuQXNzRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQXNzRXJyb3I7XG5Bc3NFcnJvci5wcm90b3R5cGUubmFtZSA9ICdBc3NFcnJvcic7XG5cbi8vIEltcGxlbWVudCBmaWx0ZXJpbmcgQVBJXG5Bc3NFcnJvci5wcm90b3R5cGUuZmlsdGVyU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChmcmFtZXMpIHtcbiAgcmV0dXJuIGZyYW1lcy5maWx0ZXIoZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgcmV0dXJuICEvQXNzRXJyb3J8YXNzZXJ0Ly50ZXN0KGZyYW1lLmdldEZ1bmN0aW9uTmFtZSgpKTtcbiAgfSk7XG59O1xuXG5Bc3NFcnJvci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKHN0YWNrKSB7XG4gIHZhciBwcm9wcyA9IHtcbiAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgbWVzc2FnZTogdW5hbnNpKHRoaXMubWVzc2FnZSksXG4gICAgYWN0dWFsOiB0aGlzLmFjdHVhbCxcbiAgICBleHBlY3RlZDogdGhpcy5leHBlY3RlZCxcbiAgICBzaG93RGlmZjogdGhpcy5zaG93RGlmZlxuICB9O1xuXG4gIC8vIGluY2x1ZGUgc3RhY2sgaWYgZXhpc3RzIGFuZCBub3QgdHVybmVkIG9mZlxuICBpZiAoZmFsc2UgIT09IHN0YWNrICYmIHRoaXMuc3RhY2spIHtcbiAgICBwcm9wcy5zdGFjayA9IHRoaXMuc3RhY2s7XG4gIH1cblxuICByZXR1cm4gcHJvcHM7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzRXJyb3I7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIHRlbXBsYXRlID0gcmVxdWlyZSgnLi91dGlsJykudGVtcGxhdGU7XG5cblxuLy8gRXhwZWN0YXRpb24gcmVwcmVzZW50cyBhbiBpbnN0YW50aWF0ZWQgTWF0Y2hlciBhbHJlYWR5XG4vLyBjb25maWd1cmVkIHdpdGggYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzLlxuZnVuY3Rpb24gRXhwZWN0YXRpb24gKG1hdGNoZXIsIGFyZ3MpIHtcbiAgdGhpcy5tYXRjaGVyID0gbWF0Y2hlcjtcbiAgdGhpcy5mYWlsID0gbWF0Y2hlci5mYWlsOyAgLy8gZmFpbCBtZXNzYWdlIGNhbiBiZSBvdmVycmlkZGVuXG4gIHRoaXMuYXJncyA9IGFyZ3MgfHwgW107XG4gIHRoaXMuZXhwZWN0ZWQgPSBhcmdzWzBdO1xuICB0aGlzLmFjdHVhbCA9IHVuZGVmaW5lZDtcbn07XG5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5FeHBlY3RhdGlvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBFeHBlY3RhdGlvbjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cGVjdGF0aW9uLnByb3RvdHlwZSwgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoZXIuaGVscDtcbiAgfVxufSk7XG5cbi8vIEhlbHBlciB0byBjaGVjayBpZiBhIHZhbHVlIHBhc3NlcyB0aGUgZXhwZWN0YXRpb24sIGl0IHRha2VzIGNhcmVcbi8vIG9mIGluc3BlY3RpbmcgdGhlIGV4cGVjdGVkIHZhbHVlIGFuZCBkZXRlY3QgaWYgaXQncyBhIG1hdGNoZXIuXG4vLyBPdGhlcndpc2UgaXQgdXNlcyBsb29zZSBlcXVhbGl0eSBiZXR3ZWVuIHRoZSB2YWx1ZXMuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgcmV0dXJuIF8uaXNFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmdW5jdGlvbiAoYSwgYikge1xuICAgIGlmIChiIGluc3RhbmNlb2YgQ2hhaW4pIHtcbiAgICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGEpO1xuICAgIH1cbiAgICByZXR1cm4gXy5pc0VxdWFsKGEsIGIpO1xuICB9KTtcbn07XG5cbi8vIEhlbHBlciB0byBtdXRhdGUgdGhlIHZhbHVlIHVuZGVyIHRlc3RcbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5tdXRhdGUgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgfVxufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIC8vIFJlc3RvcmUgdGhlIG1hdGNoZXIgZGVmYXVsdCBmYWlsIG1lc3NhZ2VcbiAgdGhpcy5mYWlsID0gdGhpcy5tYXRjaGVyLmZhaWw7XG5cbiAgLy8gVE9ETzogVGhpcyBtdXRhdGlvbiBvZiB0aGUgaW5zdGFuY2Ugd2lsbCBiZSBhdm9pZGVkIHdoZW5cbiAgLy8gICAgICAgdGhlcmUgaXMgYW4gbW9yZSBlbGFib3JhdGUgbWVjaGFuaXNtIGZvciBhcHBseWluZyB0aGVcbiAgLy8gICAgICAgdGVtcGxhdGVzXG4gIHRoaXMuYWN0dWFsID0gYWN0dWFsO1xuICB0aGlzLmFyZ3MudW5zaGlmdChhY3R1YWwpO1xuICB0cnkge1xuXG4gICAgdmFyIHJlc3VsdCA9IHRoaXMubWF0Y2hlci50ZXN0LmFwcGx5KHRoaXMsIHRoaXMuYXJncyk7XG5cbiAgICAvLyBSZXR1cm5pbmcgYSBzdHJpbmcgb3ZlcnJpZGVzIHRoZSBtaXNtYXRjaCBkZXNjcmlwdGlvblxuICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5mYWlsID0gcmVzdWx0O1xuICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcblxuICB9IGZpbmFsbHkge1xuICAgIHRoaXMuYXJncy5zaGlmdCgpOyAgLy8gcmVtb3ZlIHRoZSBhY3R1YWwgdmFsdWUgZnJvbSBhcmdzXG4gIH1cbn07XG5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5nZXREZXNjcmlwdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLm1hdGNoZXIuZGVzYykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB0ZW1wbGF0ZSh0aGlzLm1hdGNoZXIuZGVzYywgdGhpcyk7XG59O1xuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUuZ2V0TWlzbWF0Y2ggPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0ZW1wbGF0ZSh0aGlzLmZhaWwsIHRoaXMpO1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5nZXREZXNjcmlwdGlvbigpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cGVjdGF0aW9uO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLy8gVGhlIE1hdGNoZXIgb2JqZWN0IGlzIGEgZGVzY3JpcHRvciBmb3IgdGhlIG1hdGNoaW5nIGxvZ2ljXG4vLyBidXQgY2Fubm90IGJlIHVzZWQgZGlyZWN0bHkuXG5cbnZhciBFeHBlY3RhdGlvbiA9IHJlcXVpcmUoJy4vZXhwZWN0YXRpb24nKTtcblxuXG5mdW5jdGlvbiBNYXRjaGVyIChuYW1lLCBkZXNjcmlwdG9yKSB7XG5cbiAgLy8gU2hvcnRjdXQgZm9yIHNpbXBsZSB0ZXN0IGZ1bmN0aW9uc1xuICBpZiAodHlwZW9mIGRlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkZXNjcmlwdG9yID0ge3Rlc3Q6IGRlc2NyaXB0b3J9O1xuICB9XG5cbiAgdGhpcy5uYW1lID0gbmFtZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShkZXNjcmlwdG9yLmhlbHApKSB7XG4gICAgdGhpcy5oZWxwID0gZGVzY3JpcHRvci5oZWxwLmpvaW4oJ1xcbicpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaGVscCA9IGRlc2NyaXB0b3IuaGVscCB8fCAnTm90IGF2YWlsYWJsZSc7XG4gIH1cblxuICB0aGlzLmRlc2MgPSBkZXNjcmlwdG9yLmRlc2MgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBkZXNjcmlwdG9yLmRlc2NcbiAgICAgICAgICAgIDogdGhpcy5uYW1lXG5cbiAgdGhpcy5mYWlsID0gZGVzY3JpcHRvci5mYWlsIHx8ICd3YXMgJHsgYWN0dWFsIH0nO1xuXG4gIHRoaXMudGVzdCA9IGRlc2NyaXB0b3IudGVzdCB8fCBmdW5jdGlvbiAoYWN0dWFsKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHRoaXMuYXJpdHkgPSBkZXNjcmlwdG9yLmFyaXR5ICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICA/IGRlc2NyaXB0b3IuYXJpdHlcbiAgICAgICAgICAgICA6IHRoaXMudGVzdC5sZW5ndGg7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5NYXRjaGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1hdGNoZXI7XG5cbk1hdGNoZXIucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IodGhpcy5uYW1lLCB7XG4gICAgaGVscDogdGhpcy5oZWxwLFxuICAgIGRlc2M6IHRoaXMuZGVzYyxcbiAgICBmYWlsOiB0aGlzLmZhaWwsXG4gICAgdGVzdDogdGhpcy50ZXN0XG4gIH0pO1xufTtcblxuLy8gRmFjdG9yeSBmb3IgRXhwZWN0YXRpb25cbk1hdGNoZXIucHJvdG90eXBlLmV4cGVjdGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIHJldHVybiBuZXcgRXhwZWN0YXRpb24odGhpcywgYXJncyk7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICc8QXNzLk1hdGNoZXIgJyArIHRoaXMubmFtZSArICc+Jztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXRjaGVyOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG4vLyBBdm9pZCByZXBlYXRlZCBjb21waWxhdGlvbnMgYnkgbWVtb2l6aW5nXG52YXIgY29tcGlsZVRlbXBsYXRlID0gXy5tZW1vaXplKGZ1bmN0aW9uICh0cGwpIHtcbiAgcmV0dXJuIF8udGVtcGxhdGUodHBsLCBudWxsLCB7XG4gICAgZXNjYXBlOiAvXFx7XFx7KFtcXHNcXFNdKz8pXFx9XFx9L2dcbiAgfSk7XG59KTtcblxuLy8gRHVtcHMgYXJiaXRyYXJ5IHZhbHVlcyBhcyBzdHJpbmdzIGluIGEgY29uY2lzZSB3YXlcbi8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS91dGlscy9vYmpEaXNwbGF5LmpzXG5mdW5jdGlvbiB2YWx1ZUR1bXBlciAodikge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKF8uaXNOdW1iZXIodikgfHwgXy5pc05hTih2KSB8fCBfLmlzQm9vbGVhbih2KSB8fCBfLmlzTnVsbCh2KSB8fCBfLmlzVW5kZWZpbmVkKHYpKSB7XG4gICAgdmFsdWUgPSAnPCcgKyB2ICsgJz4nO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkodik7XG4gIH1cblxuICByZXR1cm4gJ1xcdTAwMWJbMTszNm0nICsgdmFsdWUgKyAnXFx1MDAxYlswOzM5bSc7XG59XG5cblxuLy8gQ3VzdG9taXplZCB2ZXJzaW9uIG9mIGxvZGFzaCB0ZW1wbGF0ZVxuZnVuY3Rpb24gdGVtcGxhdGUgKHRwbCwgY29udGV4dCkge1xuICB2YXIgb3JpZ0VzY2FwZSA9IF8uZXNjYXBlO1xuICB0cnkge1xuICAgIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IGVzY2FwZSBmdW5jdGlvbiB0byB1c2UgZm9yIGR1bXBpbmcgdmFsdWVzIGluc3RlYWRcbiAgICAvLyBvZiBlbnN1cmluZyBIVE1MIGNvcnJlY3RuZXNzLlxuICAgIF8uZXNjYXBlID0gdmFsdWVEdW1wZXI7XG5cbiAgICByZXR1cm4gY29tcGlsZVRlbXBsYXRlKHRwbCkoY29udGV4dCk7XG5cbiAgfSBmaW5hbGx5IHtcbiAgICBfLmVzY2FwZSA9IG9yaWdFc2NhcGU7XG4gIH1cbn1cblxuLy8gUmVtb3ZlIEFOU0kgZXNjYXBlcyBmcm9tIGEgc3RyaW5nXG5mdW5jdGlvbiB1bmFuc2kgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xceDFiXFxbKFxcZCs7PykrW2Etel0vZ2ksICcnKTtcbn1cblxuXG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG5leHBvcnRzLnVuYW5zaSA9IHVuYW5zaTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLy8gUmVnaXN0ZXIgdGhlIGRlZmF1bHQgbWF0Y2hlcnNcbnJlcXVpcmUoJy4vbGliL2NvcmUtbWF0Y2hlcnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9hc3MuanMnKTtcbiJdfQ==
