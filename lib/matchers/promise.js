var _ = require('lodash');

var ass = require('../ass');


// Helper factory for thenable callbacks
function resume (resolver, result) {
  return function (value) {
    resolver.resume(value, result);
  };
}

function isPromise (value) {
  var then = value && value.then;
  return typeof then === 'function';
}


// Promise related matchers
ass.register({

  promise: {
    help: [
      'Verifies that the value is a promise (Promise/A+) but does not attach',
      'the expression to its resolution like `resolves` or `rejects`, instead',
      'the original promise value is kept as the subject for the following',
      'expectations.'
    ],
    desc: 'to be a promise',
    fail: 'got ${ actual }',
    test: function (actual) {
      return isPromise(actual);
    }
  },

  resolves: {
    aliases: [ 'resolve', 'fulfilled', 'fulfill', 'eventually' ],
    help: [
      'Attach the matcher to a promise value (Promises/A+) to continue',
      'applying the chain of matchers once the promise has been resolved,',
      'mutating the value to the resolved one.',
      'It will fail if the value is not a promise (no .then method) or the',
      'promise is actually rejected.'
    ],
    desc: 'to be a resolved promise',
    fail: 'was rejected',
    test: function (actual) {
      if (!isPromise(actual)) {
        return 'is not a promise: {{actual}}';
      }

      return function (resolver) {
        // Enter async mode
        resolver.pause();

        // Attach to the promise so we get notified when it's resolved.
        actual.then(
          resume(resolver),
          resume(resolver, false)
        );

        // Right now we don't know if the expression is valid
        return undefined;
      };
    }
  },

  become: {
    aliases: [ 'becomes' ],
    help: [
      'Works the same as .resolves but additionally will do a comparison between',
      'the resolved value from the promise and the expected one. It can be seen',
      'as a shortcut for `.resolves.eq(expected)`.'
    ],
    desc: 'to become {{ expected }}',
    fail: 'was {{ actual }}',
    test: function (actual, expected) {
      if (!isPromise(actual)) {
        return 'is not a promise: {{actual}}';
      }

      return function (resolver) {
        // Make it async
        resolver.pause();

        // Attach to the promise resolution
        actual.then(
          function (value) {
            var result = _.isEqual(value, expected);
            resolver.resume(value, result);
          },
          resume(resolver, false)
        );

        return undefined;
      };
    }
  },

  rejects: {
    aliases: [ 'rejected', 'reject' ],
    help: [
      'Attach the matcher to a promise value (Promises/A+) to continue applying',
      'the chain of matchers once the promise has been rejected, mutating the',
      'value to become the rejected error.',
      'It will fail if the value is not a promise (no .then method) or the',
      'promise is actually fulfilled.'
    ],
    desc: 'to be a rejected promise',
    fail: 'was fulfilled',
    test: function (actual) {
      if (!isPromise(actual)) {
        return 'is not a promise: {{actual}}';
      }

      return function (resolver) {
        // Enter async mode
        resolver.pause();

        actual.then(
          resume(resolver, false),
          resume(resolver)
        );

        // Right now we don't know if the expression is valid
        return undefined;
      };
    }
  }

});
