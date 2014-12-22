var _ = require('lodash');

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
