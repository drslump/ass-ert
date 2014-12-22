var _ = require('lodash');

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