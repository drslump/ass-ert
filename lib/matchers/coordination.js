var _ = require('lodash');

var ass = require('../ass');


ass.register({

  and: {
    help: [
      'Composes a new matcher from two or more of them, which will only',
      'succeed if all the matchers that form it do succeed'
    ],
    desc: '(${ args.join(") AND (") })',
    fail: 'was {{ actual }}',
    test: function (actual, branch1, branch2) {
      var branches = _.toArray(arguments).slice(1);
      return function (resolver) {
        // Check if all branches pass the test
        var result = _.every(branches, function (branch) {
          return branch.test(actual);
        });
        // Take care of any expectations later in the chain
        if (result) {
          result = resolver(actual);
        }
        return result;
      };
    }
  },
  or: {
    help: [
      'Composes a new matcher from two or more of them, which will only',
      'succeed if at least one of the matchers does'
    ],
    desc: '(${ args.join(") OR (") })',
    fail: 'was {{actual}}',
    test: function (actual, branch1, branch2) {
      var branches = _.toArray(arguments).slice(1);
      return function (resolver) {
        // Check if all branches pass the test
        var result = _.some(branches, function (branch) {
          return branch.test(actual);
        });
        // Take care of any expectations later in the chain
        if (result) {
          result = resolver(actual);
        }
        return result;
      };
    }
  }

});
