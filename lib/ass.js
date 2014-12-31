var _ = require('lodash');

var Chain = require('./chain');
var Matcher = require('./matcher');
var Expectation = require('./expectation');
var AssError = require('./error');
var util = require('./util');
var should = require('./should');


var defProp = util.bind(Object.defineProperty, Object);


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
};

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
  ass.desc(message).truthy.assert(cond);
  return cond;
};

ass.ko = function (message, cond) {
  if (arguments.length === 1) {
    cond = message;
    message = 'expected a falsy value';
  }
  ass.desc(message).falsy.assert(cond);
  return cond;
};

// Resets or verifies the number of marks so far
// Forced arity-0 to be compatible with: beforeEach(ass.marks)
ass.marks = function (/* expected, desc */) {
  var expected = arguments[0];
  var desc = arguments[1];
  if (typeof expected === 'undefined') {
    expected = ass.marks.counter;
    ass.marks.counter = 0;
    return expected;  // return back how many there were
  }

  ass.desc(desc || 'ass.marks').eq(expected).assert(
    ass.marks.counter, ass.marks
  );
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

    matcher = new Matcher(name, matcher);
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
    var exp = new Expectation(matcher, arguments);
    this.__expectations__.push(exp);
    if (!this.__deferred__) {
      this.assert(this.value, fn);
    }
    return this;
  };

  defProp(Chain.prototype, name, prop);

  // Augment the static interface
  prop[fnKey] = function () {
    var chain = new Chain();

    if (fnKey === 'get') {
      return chain[name];
    }

    return chain[name].apply(chain, arguments);
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
      var chain = new Chain();
      chain[name].apply(chain, arguments);
      // Return a callable that asserts upon receiving a value
      return function fn (actual) {
        chain.assert(actual, fn);
        return actual;
      };
    },
    enumerable: false
  });

};


// Override lodash's default createCallback mechanism to make it understand
// about our expression chains.
_.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
  // This looks contrived but instanceof is kind of slow-ish
  if (callback && callback.constructor === Chain) {
    return callback.test;
  }

  // Support _.where style. It's not as fast as the original one since we
  // have to go via _.isEqual instead of using the internal function
  if (_.isPlainObject(callback)) {
    var props = _.keys(callback);
    return function (object) {
      var length = props.length, result = false, key;
      while (length--) {
        key = props[length];
        result = _.isEqual(object[key], callback[key]);
        if (!result) break;
      }
      return result;
    };
  }

  return func(callback, thisArg);
});

// Override lodash's default isEqual implementation so it understands
// about expression chains.
// TODO: Make sure we don't break anything, perhaps run lodash unit tests
//       to be absolutely sure we don't mess with anything.
_.isEqual = _.wrap(_.isEqual, function (func, a, b, callback, thisArg) {
  function cmp (a1, b1) {
    // This looks contrived but instanceof is kind of slow-ish
    if (b1 && b1.constructor === Chain) {
      return b1.test(a1);
    }
    if (a1 && a1.constructor === Chain) {
      return a1.test(b1);
    }
    return callback ? callback.call(this, a1, b1) : undefined;
  }
  return func(a, b, cmp, thisArg);
});


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
