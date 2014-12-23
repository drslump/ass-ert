var _ = require('lodash');

var ass = require('../ass');

// Promise related matchers
ass.register({

  promise: {
    help: [
      'Verifies that the value is a promise (Promise/A+) but does not attach the',
      'the chain of matchers to its resolution like `resolves` or `rejects`,',
      'instead the original promise value is still the subject for the next',
      'matchers.'
    ],
    desc: 'to be a promise',
    fail: 'got ${ actual }',
    test: function (actual) {
      return _.isObject(actual) && _.isFunction(actual.then);
    }
  },

  resolves: {
    aliases: [ 'resolve', 'fulfilled', 'fulfill' ],
    help: [
      'Attach the matcher to a promise value (Promises/A+) to continue applying',
      'the chain of matchers once the promise has been resolved, mutating the',
      'value to the resolved one.',
      'It will fail if the value is not a promise (no .then method) or the promise',
      'is actually rejected.'
    ],
    desc: 'to be a resolved promise',
    fail: 'was rejected',
    test: function (actual) {
      if (!_.isObject(actual) || !_.isFunction(actual.then)) {
        return 'is not a promise: {{actual}}';
      }

      // TODO: The async nature of promises could be a problem since expectations
      //       have some state while they execute.
      return function (resolver) {
        // Since we're delegating the execution flow to the promise
        // we must make the chain act as a deferred from now on.
        this.__deferred__ = true;

        // Attach to the promise so we get notified when it's resolved.
        var self = this;
        actual.then(
          function (value) {
            self.thenResume(resolver(value), value);
            return value;
          },
          function (error) {
            self.thenResume(false, error);
            throw error;
          }
        );

        // Right now the expectation holds since the value was a promise
        return true;
      };
    }
  },

  rejects: {
    // TODO: Make .catch a different matcher that works like .raises but for promises?
    aliases: [ 'catch', 'rejected', 'reject' ],
    help: [
      'Attach the matcher to a promise value (Promises/A+) to continue applying',
      'the chain of matchers once the promise has been rejected, mutating the',
      'value to become the rejected error.',
      'It will fail if the value is not a promise (no .then method) or the promise',
      'is actually fulfilled.'
    ],
    desc: 'to be a rejected promise',
    fail: 'was fulfilled',
    test: function (actual) {
      if (!_.isObject(actual) || !_.isFunction(actual.then)) {
        return 'is not a promise: {{actual}}';
      }

      return function (resolver) {
        // Since we're delegating the execution flow to the promise
        // we must make the chain act as a deferred from now on.
        this.__deferred__ = true;

        var self = this;
        actual.then(
          function (value) {
            self.thenResume(false, value);
            return value;
          },
          function (error) {
            self.thenResume(resolver(error), error);
            throw error;
          }
        );

        // Right now the expectation holds since the value was a promise
        return true;
      };
    }
  }

});
