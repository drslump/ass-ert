var _ = require('lodash');

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
// Note: make them arity-0 to allow beforeEach(ass.should) in Mocha
ass.should = function (/* name */) {
  should(arguments.length > 0 ? arguments[0] : undefined);
  return ass;
};
ass.should.restore = function (/* name */) {
  should.restore(arguments.length > 0 ? arguments[0] : undefined);
};

module.exports = ass;
