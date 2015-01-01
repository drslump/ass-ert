var _ = require('lodash');

var Chain = require('./chain');
var Matcher = require('./matcher');

var template = require('./util').template;


// Expectation represents an instantiated Matcher already configured with
// any additional arguments.
function Expectation (matcher, args) {
  // Get the matcher configuration into this instance
  matcher.assign(this);

  // Support being given an `arguments` object
  this.args = _.toArray(args);
  this.actual = undefined;
}

// Inherit the prototype from Matcher
var proto = Expectation.prototype = Object.create(Matcher.prototype);
proto.constructor = Expectation;

// Generate getter for `.expected` (an alias for args[0])
Object.defineProperty(proto, 'expected', {
  get: function () {
    return this.args[0];
  }
});

// Generate getters for the first 5 arguments as arg1, arg2, ...
_.times(5, function (i) {
  Object.defineProperty(proto, 'arg' + (i + 1), {
    get: function () {
      return this.args[i];
    }
  });
});

// Compute the description message for the current state of the expectation
Object.defineProperty(proto, 'description', {
  get: function () {
    if (!this.desc) {
      return null;
    }
    if (typeof this.desc === 'function') {
      return this.desc(this);
    }
    return template(this.desc, this);
  }
});

// Compute the failure message for the current state of the expectation
Object.defineProperty(proto, 'failure', {
  get: function () {
    if (typeof this.fail === 'function') {
      return this.fail(this);
    }
    return template(this.fail, this);
  }
});

// Helper to mutate the value under test
Expectation.prototype.mutate = function (value) {
  return function (resolver) {
    var fork = resolver.fork();
    var result = fork(value);
    resolver.join(fork);
    return result;
  };
};

// Resolving can override the expectation state, if that's not desirable make
// sure that this method is called in a new context.
Expectation.prototype.resolve = function () {
  var args, result;

  // Execute the matcher test now that everything is set
  args = [this.actual].concat(this.args);
  result = this.test.apply(this, args);

  // Returning a string overrides the mismatch description
  if (typeof result === 'string') {
    this.fail = result;
    result = false;
  }

  return result;
};

Expectation.prototype.toString = function () {
  return this.description;
};


module.exports = Expectation;
