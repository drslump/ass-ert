var _ = require('lodash');

var ass = require('../ass');

// Quantifiers
ass.register({

  every: {
    aliases: [ 'all', 'allOf' ],
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'all of them succeed'
    ],
    desc: 'For every one:',
    fail: 'one didn\'t',
    test: function (actual) {
      return function (resolver) {
        var undefs = 0;

        // Shortcut when there is no more stuff to do
        if (resolver.exhausted) {
          return true;
        }

        var result = _.every(actual, function (value) {
          var fork = resolver.fork();
          var partial = fork(value);

          // Stop iterating on first failure
          if (partial === false) {
            resolver.merge(fork);
            return false;
          }

          if (partial === true) {
            return true;
          }

          // Async support
          if (undefs === 0) {
            resolver.pause();
          }

          undefs += 1;

          // Subscribe to the fork's final result
          fork.finalize(function (final) {
            // We're done the moment one is a failure
            if (final === false) {
              resolver.merge(fork);
              resolver.resume(actual, false);
              return;
            }

            undefs -= 1;
            if (0 === undefs) {
              resolver.resume(actual, true);
            }
          });

          return true;  // keep iterating
        });

        return undefs > 0 ? undefined : result;
      };
    }
  },

  some: {
    aliases: [ 'anyOf' ],
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'at least one of them succeeds'],
    desc: 'At least one:',
    fail: 'none did',
    test: function (actual) {
      return function (resolver) {
        var undefs = 0;

        // Shortcut when there is no more stuff to do
        if (resolver.exhausted) {
          return true;
        }

        var result = _.some(actual, function (value) {
          var fork = resolver.fork();
          var partial = fork(value);

          // Stop iterating on first failure
          if (partial === false) {
            resolver.merge(fork);
            return false;
          }

          if (partial === true) {
            return true;
          }

          // Async support
          if (undefs === 0) {
            resolver.pause();
          }
          undefs += 1;

          // Subscribe to the fork's final result
          fork.finalize(function (final) {
            // We're done the moment one is a success
            if (final === true) {
              resolver.merge(fork);
              resolver.resume(actual, true);
              return;
            }

            undefs -= 1;
            if (0 === undefs) {
              resolver.resume(actual, false);
            }
          });

          return false;  // keep iterating
        });

        return undefs > 0 ? undefined : result;
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
    fail: 'one did',
    test: function (actual) {
      return function (resolver) {
        var undefs = 0;

        // Shortcut when there is no more stuff to do
        if (resolver.exhausted) {
          return true;
        }

        var result = _.some(actual, function (value) {
          var fork = resolver.fork();
          var partial = fork(value);

          // Stop iterating on first success
          if (partial === true) {
            resolver.merge(fork);
            return true;
          }

          // Keep going until we find a success
          if (partial === false) {
            return false;
          }

          // Async support
          if (0 === undefs) {
            resolver.pause();
          }
          undefs += 1;

          // Subscribe to the fork's final result
          fork.finalize(function (final) {
            // We're done the moment one is a success
            if (final === true) {
              resolver.merge(fork);
              resolver.resume(actual, false);
              return;
            }

            undefs -= 1;
            if (undefs === 0) {
              resolver.resume(actual, true);
            }
          });

          return false;  // keep iterating
        });

        return undefs > 0 ? undefined : !result;
      };
    }
  }

});
