!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ass=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./chain":2,"./error":3,"./expectation":4,"./matcher":5,"./should":11,"./util":12}],2:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var resolvers = require('./resolvers');
var AssError = require('./error');
var util = require('./util');
var Promise = util.Promise;

var defProp = util.bind(Object.defineProperty, Object);

// An expectations chain (aka expression), the core object of the library,
// allows to setup a set of expectations to be run at any point against a
// value.
function Chain (value) {
  if (!(this instanceof Chain)) {
    throw new Error('Ass Chain constructor called without new!');
  }

  // TODO: On non initialized chains we can't do .value, it should
  //       be a expectation that gets the initial value given when
  //       resolving (so, it should be stored on the resolver)
  this.value = arguments.length > 0 ? value : this.__GUARD__;

  // Custom description
  defProp(this, '__description__', {
    value: '',
    enumerable: false,
    configurable: false,
    writable: true
  });

  // List of [ Expectation ]
  defProp(this, '__expectations__', {
    value: [],
    enumerable: false,
    configurable: false,
    writable: false
  });

  // When true the expression is considered deferred and won't
  // try to immediately evaluate any newly chained expectation.
  defProp(this, '__deferred__', {
    value: this.value === this.__GUARD__,
    enumerable: false,
    configurable: false,
    writable: true
  });

  // Holds the list of promise callbacks attached to the expression
  defProp(this, '__thens__', {
    value: [],
    enumerable: false,
    configurable: false,
    writable: false
  });

  // Seal the context to the methods so we can call them as plain functions
  this.test = util.bind(Chain.prototype.test, this);
  this.assert = util.bind(Chain.prototype.assert, this);
  this.result = util.bind(Chain.prototype.result, this);
  this.through = util.bind(Chain.prototype.through, this);
  this.$ = this.through;
}

var proto = Chain.prototype = Object.create(null);
proto.constructor = Chain;

// Guard token to detect valueless matchers
proto.__GUARD__ = {
  valueOf: function () {
    return this.toString();
  },
  toString: function () {
    return '{{valueless}}';
  }
};

// Supports the usage: ass.string.help
defProp(proto, 'help', {
  get: function () {
    // TODO: Productize this and perhaps show help for the whole chain
    var tail = _.tail(this.__expectations__);
    return tail ? tail.help : 'N/A';
  }
});

// Support use case: ass(value)._.some.number.above(5)._
defProp(proto, '_', {
  get: function fn() {
    if (!this.__deferred__) {
      this.__deferred__ = true;
    } else {
      this.__deferred__ = false;
      this.assert(this.value, fn);
    }
    return this;
  }
});


// Exposes a Promise/A interface for the expression, the intended use is for
// obtaining the result for asynchronous expressions.
// Here though we just collect the callbacks the actual promise resolution
// is done in the resolver when it reaches a result.
proto.then = function (cb, eb) {
  // Register the callbacks to be used when resolved
  this.__thens__.push([cb, eb]);

  // When the expression is non deferred and we have a value we force the
  // resolver to run in order to resolve the promise at least once.
  // This is primarily to support the test runners use case where an expression
  // is returned from the test and the runner will attach itself here.
  if (!this.__deferred__ && this.value !== this.__GUARD__) {
    var resolver = resolvers.acquire(this);
    resolver(this.value);
  }

  return this;
};

proto.catch = function (eb) {
  return this.then(null, eb);
};

// Dispatch everyone who was waiting to be notified of the outcome
proto.dispatchResult = function (resolved, result) {
  if (0 === this.__thens__.length) {
    return;
  }

  // Generate a nice error for the failure
  var actual = this.value;
  if (result === false) {
    actual = this.buildError(resolved, proto.dispatchResult);
  }

  // Create a promise that rejects immediately with a failure error or
  // resolves with the expression subject.
  var promise = new Promise(function (resolve, reject) {
    // Calling resolve() with a promise will attach itself to the promise
    // instead of passing it as a simple value. To avoid that we detect the
    // case and wrap it in an array.
    if (actual && typeof actual.then === 'function') {
      actual = [
        'Ass: Value wrapped in an array since it looks like a Promise',
        actual
      ];
    }

    (result ? resolve : reject)( actual );
  });

  // Attach all the registered thens to the promise so they get notified
  _.forEach(this.__thens__, function (callbacks) {
    promise = promise.then.apply(promise, callbacks);
  });
};

function dumpChain (resolved, indent) {
  var result = '';

  indent = indent || '';

  resolved.forEach(function (exp, idx) {
    if (Array.isArray(exp)) {
      result += dumpChain(exp, indent + '  ');
      return;
    }

    if (exp.result) {
      result += indent + ' \u001b[32mPassed:\u001b[0m ' + exp.description + '\n';
      return;
    }

    result += indent + ' \u001b[31mFailed:\u001b[0m ' + exp.description + '\n';
    if (idx === resolved.length - 1) {
      result += indent + '    \u001b[33mBut:\u001b[0m ' + exp.failure + '\n';
    }

  });

  return result;
}


// Builds an AssError for the current expression. It makes a couple of
// assumptions, for instance the .__offset__ must be placed just after the
// expectation that produced the failure of the chain.
proto.buildError = function (resolved, ssf) {

  var error = this.__description__ + '\n\n';

  exp = resolved[ resolved.length - 1 ];
  error += dumpChain(resolved);

  if (!util.doColors()) {
    error = util.unansi(error);
  }

  // TODO: showDiff should be used only when it makes sense perhaps
  //       we can pass null/undefined and let AssError detect when it
  //       makes sense.

  var expected = exp.expected;
  // Mocha will try to jsonify the expected value, just ignore if it's a function
  if (typeof expected === 'function') {
    expected = null;
  }

  return new AssError(error, exp.actual, expected, true, ssf || arguments.callee);
};

// Resolves the current chain for a given value. The result is always a
// boolean indicating the outcome or an undefined to signal that it reached
// an asynchronous flow.
// Note: named `test` to be compatible with Sinon's matchers.
proto.test = function (actual) {
  if (arguments.length === 0) {
    actual = this.value;
  }

  // Resolve the chain starting from root
  var resolver = resolvers.acquire(this);
  var result = resolver(actual);

  return result;
};

// Performs the resolution of the chain but additionally will raise an error
// if it fails to complete. When the expression resolves as undefined (async)
// it'll be automatically enable its deferred flag.
// The `ssf` is StackTraceFunction, a reference to the first function to show
// on the stack trace on supported environments (V8).
proto.assert = function (actual, ssf) {
  if (arguments.length === 0) {
    actual = this.value;
  }

  // Just ignore if the actual value is not present yet
  // TODO: Shall it produce an error?
  if (actual === this.__GUARD__) return this;

  var resolver = resolvers.acquire(this);
  var result = resolver(actual);

  // Convert the expression into a deferred if an async expection was found
  if (result === undefined) {
    this.__deferred__ = true;
    return this;
  }

  // It failed so report it with a nice error
  if (result === false) {
    throw this.buildError(resolver.resolved, ssf || this.assert);
  }

  return this;
};

// Asserts the provided value and if successful returns the original
// value instead of the chain instance.
proto.through = function (actual) {
  this.assert(actual, proto.through);
  return actual;
};

// Evaluates the expression chain reporting the last mutated value seen in
// it. If the expression does not complete it'll return undefined.
proto.result = function (actual) {
  var result;

  try {
    this.tap(function (value) {
      result = value;
    }).test(actual);
  } finally {
    // Remove the .tap from the chain
    this.__expectations__.pop();
  }

  return result;
};

Chain.prototype.valueOf = function () {
  return this.value;
};

Chain.prototype.toString = function () {
  if (this.__description__) {
    return this.__description__;
  }

  var descs = this.__expectations__
    .filter(function (c) { return c.description })
    .map(function (c) { return c.description });

  if (descs.length > 1) {
    return '(' + descs.join(', ') + ')';
  } else if (descs.length === 1) {
    return descs[0];
  } else {
    return '<AssChain>';
  }
};


module.exports = Chain;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./error":3,"./resolvers":10,"./util":12}],3:[function(require,module,exports){
var unansi = require('./util').unansi;

// API compatible with https://github.com/chaijs/assertion-error/
// This should make integration with Mocha work, including diffed
// output.
function AssError (message, actual, expected, showDiff, ssf) {
  this.message = message;

  if (typeof actual === 'function') actual = null;
  if (typeof expected === 'function') expected = null;
  // this.actual = actual;
  // this.expected = expected;

  // this.showDiff = showDiff || false;

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

},{"./util":12}],4:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
    return resolver(value);
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./chain":2,"./matcher":5,"./util":12}],5:[function(require,module,exports){
// The Matcher object is a descriptor for the matching logic but cannot
// be used directly. Use an Expectation to get an initialized matcher.
function Matcher (name, descriptor) {

  // Shortcut for simple test functions
  if (typeof descriptor === 'function') {
    descriptor = {test: descriptor};
  }

  // The generic name of the matcher
  this.name = name;

  if (Array.isArray(descriptor.help)) {
    this.help = descriptor.help.join('\n');
  } else {
    this.help = descriptor.help || 'Not available';
  }

  // Either a template string or a function that will receive as only
  // argument an Expectation instance (called as a method of it).
  this.desc = descriptor.desc !== undefined
            ? descriptor.desc
            : this.name;

  // Either a template string or a function that will receive as only
  // argument an Expectation instance (called as a method of it).
  this.fail = descriptor.fail || 'was {{ actual }}';

  if (!descriptor.test) {
    throw new Error('test function not defined for the matcher');
  }
  this.test = descriptor.test;

  this.arity = descriptor.arity !== undefined
             ? descriptor.arity
             : this.test.length;
}

Matcher.prototype = Object.create(null);
Matcher.prototype.constructor = Matcher;

Matcher.prototype.clone = function () {
  return new this.constructor(this.name, {
    help: this.help,
    desc: this.desc,
    fail: this.fail,
    test: this.test,
    arity: this.arity
  });
};

// Augment another object with the properties of this matcher
Matcher.prototype.assign = function (obj) {
  obj.help = this.help;
  obj.desc = this.desc;
  obj.fail = this.fail;
  obj.test = this.test;
  obj.arity = this.arity;
};

Matcher.prototype.toString = function () {
  return '<Ass.Matcher ' + this.name + '>';
};


module.exports = Matcher;

},{}],6:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var ass = require('../ass');


ass.register({

  and: {
    help: [
      'Composes a new expectation from two or more of them, which will only',
      'succeed if all the expectations that form it do indeed succeed.',
      'Note: evaluation will stop as soon as one of the expectations fails.'
    ],
    desc: '${ args.join(" AND ") }',
    fail: 'was {{ actual }}',
    test: function (actual, branch1, branch2) {
      var branches = _.toArray(arguments).slice(1);
      return function (resolver) {
        // Check if all branches pass the test
        var undefs = 0;
        var result = _.every(branches, function (branch) {
          var partial = branch.test(actual);
          if (partial === undefined) {
            if (!resolver.paused) {
              resolver.pause();
            }
            undefs += 1;
            branch.then(_.once(function () {
              undefs -= 1;
              if (0 === undefs) {
                resolver.resume(actual);
              }
            }), _.once(function () {
              resolver.resume(null, false);
            }));

            return true; // keep iterating
          }

          return partial;
        });

        if (resolver.paused) {
          return undefined;
        }

        // Take care of any expectations later in the chain
        if (result === true) {
          result = resolver(actual);
        }

        return result;
      };
    }
  },
  or: {
    help: [
      'Composes a new expectation from two or more of them, which will only',
      'succeed if at least one of the expectations does.',
      'Note: evaluation will stop as soon as one of the expectations succeeds.'
    ],
    desc: '${ args.join(" OR ") }',
    fail: 'was {{ actual }}',
    test: function (actual, branch1, branch2) {
      var branches = _.toArray(arguments).slice(1);
      return function (resolver) {
        // Check if all branches pass the test
        var undefs = 0;
        var result = _.some(branches, function (branch) {
          var partial = branch.test(actual);
          if (partial === undefined) {
            if (!resolver.paused) {
              resolver.pause();
            }
            undefs += 1;
            branch.then(_.once(function () {
              resolver.resume(actual);
            }), _.once(function () {
              undefs -= 1;
              if (0 === undefs) {
                resolver.resume(null, false);
              }
            }));

            return false; // keep iterating
          }

          return partial;
        });

        if (resolver.paused) {
          return undefined;
        }

        // Take care of any expectations later in the chain
        if (result === true) {
          result = resolver(actual);
        }

        return result;
      };
    }
  },
  xor: {
    help: [
      'Composes a new expectation from two or more of them, which will only',
      'succeed if at least one of the expectations does but not all of them.'
    ],
    desc: '${ args.join(" XOR ") }',
    fail: 'was {{ actual }}',
    test: function (actual, branch1, branch2) {
      var branches = _.toArray(arguments).slice(1);
      return function (resolver) {
        // Check if all branches pass the test
        var undefs = 0;
        var oks = 0;
        var kos = 0;
        _.forEach(branches, function (branch) {
          var partial = branch.test(actual);
          if (partial === undefined) {
            if (!resolver.paused) {
              resolver.pause();
            }
            undefs += 1;
            branch.then(_.once(function () {
              if (kos > 0) {
                resolver.resume(actual);
                return;
              }
              oks += 1;
              undefs -= 1;
              if (0 === undefs) {
                resolver.resume(actual, oks > 0 && kos > 0 ? undefined : false);
              }
            }), _.once(function () {
              if (oks > 0) {
                resolver.resume(actual);
                return;
              }
              kos += 1;
              undefs -= 1;
              if (0 === undefs) {
                resolver.resume(actual, oks > 0 && kos > 0 ? undefined : false);
              }
            }));

          } else if (partial === true) {
            oks += 1;
          } else if (partial === false) {
            kos += 1;
          }
        });

        if (resolver.paused) {
          return undefined;
        }

        return oks > 0 && kos > 0 ? resolver(actual) : false;
      };
    }
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../ass":1}],7:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var ass = require('../ass');

// Set of default matchers
ass.register({
  desc: {
    help: 'Provide a custom description for reported failures',
    desc: null,  // Skip it from reports
    test: function (actual, desc) {
      // Note that the description won't be set until the chain is resolved,
      // at least once, reaching this expectation.
      return function (resolver) {
        resolver.chain.__description__ = desc;
        return resolver(actual);
      };
    }
  },

  // Ignored matchers
  to: {
    aliases: [ 'a', 'an', 'be' ],
    help: [
      'Just some syntax sugar to make the expectations easier on the eyes.'
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
      ass.marks.counter += 1;
      return true;
    }
  },

  // Just allow anything :)
  any: {
    help: 'Allows any value without testing it.',
    desc: 'is anything',
    test: function (actual) {
      return true;
    }
  },
  // Anything that isn't null or undefined
  defined: {
    help: 'Checks if the value is not null or undefined.',
    desc: 'is defined',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual != null;
    }
  },
  // Check if the value is empty
  empty: {
    help: 'Checks if the value is empty (has a length of 0).',
    desc: 'is empty',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual == null || actual.length === 0;
    }
  },
  nonEmpty: {
    help: 'Checks if the value is not empty (has a length greater than 0).',
    desc: 'is not empty',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual != null && actual.length > 0;
    }
  },
  truthy: {
    aliases: [ 'truish' ],
    help: 'The value should be truthy (not undefined, null, 0, "" or []).',
    desc: 'is truthy',
    fail: 'was ${ actual }',
    test: function (actual) {
      if (!actual) return false;
      return typeof actual.length === 'number' ? actual.length !== 0 : true;
    }
  },
  falsy: {
    help: 'The value should be falsy (undefined, null, 0, "" or []).',
    desc: 'is falsy',
    fail: 'was {{ actual }}',
    test: function (actual) {
      if (!actual) return true;
      return typeof actual.length === 'number' ? actual.length === 0 : false;
    }
  },

  // Negation
  not: {
    help: 'Negates the result for the rest of the expression.',
    desc: 'Not!',
    fail: 'was {{actual}}',
    test: function (actual) {
      return function (resolver) {

        if (resolver.exhausted) {
          return true;
        }

        resolver.finalize(function (final) {
          return !final;
        });

        return resolver(actual);
      };
    }
  },

  is: {
    aliases: [ 'equal', 'equals' ],
    help: [
      'Checks strict equality between the value and its expected.',
      'Note: if the expected value is a chain expression it\'ll be tested instead.'
    ],
    desc: 'to strictly equal {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      // this is a bit contrived but it makes for some nice syntax to be able to
      // use .is for passing in expectations
      if (expected && expected instanceof ass.Chain) {
        return expected.test(actual);
      }

      return actual === expected;
    }
  },
  eq: {
    aliases: [ 'eql', 'eqls' ],
    help: [
      'Checks deep non-strict equality between the value and its expected.',
      'It understands ass expressions so you can combine them at will in the',
      'expected value.'
    ],
    desc: 'to equal {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return _.isEqual(actual, expected);
    }
  },

  above: {
    aliases: [ 'gt', 'moreThan', 'greaterThan' ],
    help: 'Checks if the value is higher than its expected.',
    desc: 'to be more than {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return actual > expected;
    }
  },

  below: {
    aliases: [ 'lt', 'lessThan' ],
    help: 'Checks if the value is lower tha its expected.',
    desc: 'to be less than {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return actual < expected;
    }
  },

  aboveOrEqual: {
    aliases: [ 'least', 'atLeast', 'gte', 'moreThanOrEqual', 'greaterThanOrEqual' ],
    help: 'Checks if the value is higher or equal than its expected.',
    desc: 'to be more than or equal to ${expected}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return actual >= expected;
    }
  },

  belowOrEqual: {
    aliases: [ 'most', 'atMost', 'lte', 'lessThanOrEqual' ],
    help: 'Checks if the value is lower or equal than its expected.',
    desc: 'to be less than or equal to ${expected}',
    fail: 'was ${actual}',
    test: function (actual, expected) {
      return actual <= expected;
    }
  },

  instanceof: {
    aliases: [ 'instanceOf', 'instance', 'isa' ],
    help: [
      'Checks if the value is an instance of the given constructor.',
      'When the expected is a string it\'ll actually use a `typeof`',
      'comparison.'
    ],
    desc: 'to be an instance of {{expected}}',
    test: function (actual, expected) {
      if (_.isString(expected)) {
        return typeof actual === expected ? true : 'had type {{ typeof actual }}';
      }
      return actual instanceof expected;
    }
  },

  typeof: {
    help: 'Checks if the value is of a specific type',
    desc: 'to have type {{expected}}',
    fail: 'had ${ typeof actual }',
    test: function (actual, expected) {
      return _.isEqual(typeof actual, expected);
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
      return _.isElement(actual);
    }
  },
  error: {
    help: 'Check that value is an error (or looks like it)',
    desc: 'to be an Error',
    test: function (actual) {
      if (actual instanceof Error) {
        return true;
      }
      return _.isObject(actual) && _.isString(actual.name) && _.isString(actual.message);
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
    fail: 'was {{ actual }}',
    test: function (actual) {
      if (_.isBoolean(actual)) {
        return actual == true ? true : 'was {{actual}}';
      } else {
        return 'had type ${typeof actual}';
      }
    }
  },
  false: {
    help: 'Check that value is false',
    desc: 'to be false',
    test: function (actual) {
      if (_.isBoolean(actual)) {
        return actual == false ? true : 'was {{actual}}';
      } else {
        return 'had type ${typeof actual}';
      }
    }
  },

  raises: {
    aliases: [ 'throws' ],
    help: [
      'Checks that executing the value results in an exception being thrown.',
      'The captured exception value is used to mutate the subject for the',
      'following expectations.'
    ],
    desc: 'throws an error',
    test: function (actual, expected) {
      if (!_.isFunction(actual)) {
        return 'is not a function: {{actual}}';
      }

      try {
        actual();
        return 'did not throw anything';
      } catch (e) {
        if (expected == null) {
          return this.mutate(e);
        }
        if (_.isFunction(expected) && e instanceof expected) {
          return this.mutate(e);
        }
        if (_.isEqual(e, expected)) {
          return this.mutate(e);
        }

        // Augment the expectation object with a new template variable
        this.exception = e;
        return 'got {{ exception }}';
      }
    }
  },

  has: {
    aliases: [ 'have', 'contain', 'contains' ],
    help: [
      'Check if the value has some expected value. It understands expected',
      'chain expressions so this serves as the equivalent of .eq for partial',
      'matches.'
    ],
    desc: 'to contain {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {

      if (_.isString(actual) && _.isString(expected)) {
        return -1 !== actual.indexOf(expected);
      }

      if (_.isArray(actual)) {
        // Hack: for arrays we allow multiple expected values
        this.expected = expected = _.toArray(arguments).slice(1);
        return _.every(expected, function (ev) {
          return -1 !== _.findIndex(actual, ev);
        });
      }

      if (!_.isObject(actual)) {
        return 'got {{actual}}';
      }

      // Compare objects with .where
      return 0 < _.where(actual, expected).length;
    }
  },
  hasOwn: {
    aliases: [ 'hasKey', 'hasIndex' ],
    help: [
      'Check if the value has one or more own properties as defined by',
      'the given arguments.'
    ],
    desc: 'to have own property ${ expected }',
    test: function (actual, expected) {
      if (!_.isObject(actual)) {
        return 'was {{actual}}';
      }

      this.fail = 'only had {{ _.keys(actual) }}';

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
  dump: {
    help: [
      'Dumps the received value to the console applying the given template.',
      'Note: Use ${this} to interpolate the whole value.',
      'See: https://lodash.com/docs#template'
    ],
    desc: null,
    test: function (actual, tpl) {
      var template = _.template(tpl);
      var result = template.call(actual, actual);
      console.log(result);
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

  tap: {
    aliases: [ 'fn' ],
    help: [
      'Calls the provided function with the current value as argument.',
      'If the function returns something different to *undefined* the',
      'expression will fork to operate on the returned value.'
    ],
    desc: 'call {{arg1}}',
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
    fail: 'not has a length: {{ actual }}',
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
      if (_.isObject(actual)) {
        if (key in actual) {
          return this.mutate(actual[key]);
        }

        this.keys = [];
        _.forIn(actual, function (v, k) { this.keys.push(k); }, this);
        return 'not found from {{ keys }}';
      }
      return 'got {{actual}}';
    }
  },
  at: {
    aliases: [ 'index' ],
    help: [
      'Mutates the value to operate on one of the indexed elements. If',
      'multiple indexes are provided an array is composed with them.',
      'Note: It supports negative indexes'
    ],
    desc: 'get index ${ args.join(", ") }',
    test: function (actual, index) {
      if (!_.isArray(actual) && !_.isString(actual)) {
        return 'not an array or a string: ${actual}';
      }

      var indexes = _.toArray(arguments).slice(1);
      var elems = [];

      for (var i = 0; i < indexes.length; i++) {
        var idx = indexes[i];

        idx = idx < 0 ? actual.length + idx : idx;
        if (idx < 0 || idx >= actual.length) {
          return idx + ' out of bounds for {{actual}}';
        }

        elems.push(actual[idx]);
      }

      return this.mutate(
        elems.length === 1 ? elems[0] : elems
      );
    }
  },

  keys: {
    help: [
      'Mutates the value to operate on its list of own keys.'
    ],
    desc: 'get keys',
    test: function (actual) {
      return this.mutate(
        _.keys(actual)
      );
    }
  },
  values: {
    help: [
      'Mutates the value to operate on its list of values'
    ],
    desc: 'get values',
    test: function (actual) {
      return this.mutate(
        _.values(actual)
      );
    }
  },

  slice: {
    help: [
      'Extracts a portion from the value.'
    ],
    desc: 'slice(${args[0]}, ${args[1] || 0})',
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
  // Note: "reject" is used for promises
  // TODO: Come up with a better name
  unless: {
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
    desc: 'where {{arg1}}',
    test: function (actual, props) {
      if (!_.isPlainObject(props)) {
        return 'props is not an object';
      }
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

  method: {
    help: [
      'Forks the expectation to operate on the result of invoking the named',
      'method on the subject value.',
    ],
    desc: "method .${arg1}()",
    test: function (actual, method, arg) {
      if (typeof actual[method] !== 'function') {
        return '${arg1} is not a method in {{actual}}';
      }

      var args = _.toArray(arguments).slice(2);
      return this.mutate(
        actual[method].apply(actual, args)
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
    test: function (actual, method, arg) {
      return this.mutate(
        _.invoke.apply(_, arguments)
      );
    }
  },

  pluck: {
    help: [
      'Mutates the value to be the one of the specific property for all elements',
      'in the current collection.',
      'See: https://lodash.com/docs#pluck'
    ],
    desc: 'pluck( {{arg1}} )',
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
      'Mutates the subject to be the minimum value found on the collection.',
      'See: https://lodash.com/docs#min'
    ],
    test: function (actual) {
      return this.mutate(
        _.min(actual)
      );
    }
  },
  max: {
    help: [
      'Mutates the subject to be the maximum value found on the collection.',
      'See: https://lodash.com/docs#max'
    ],
    test: function (actual) {
      return this.mutate(
        _.max(actual)
      );
    }
  },

  sort: {
    help: [
      'Mutates the value to be sorted in ascending order.',
      'See: https://lodash.com/docs#sortBy'
    ],
    desc: 'sort',
    test: function (actual, callback, thisArg) {
      // Allow the use of expressions as callbacks
      if (callback instanceof ass.Chain) {
        callback = callback.result;
      }

      return this.mutate(
        _.sortBy(actual, callback, thisArg)
      );
    }
  },

  store: {
    help: [
      'Helper to store a reference to the current value being evaluated in the',
      'expression in some other object. It expects a target object and optionally',
      'the name of a property. If target is a function it\'ll receive the value',
      'using `prop` as this context. If `prop` is not provided and `target` is an',
      'array the value will be pushed to it.'
    ],
    desc: 'store',
    test: function (actual, target, prop) {
      if (_.isFunction(target)) {
        target.call(prop, actual);
      } else if (prop === undefined) {
        if (_.isArray(target)) {
          target.push(actual);
        } else {
          return 'prop undefined and target is not an array or a function: {{arg1}}';
        }
      } else if (_.isObject(target)) {
        target[prop] = actual;
      } else {
        return 'target is not an object: {{arg1}}';
      }

      return true;
    }
  },

  mutation: {
    help: [
      'Obtains the last mutated value used on the chain.'
    ],
    desc: null,
    test: function (actual) {
      // TODO: This will break if we return true/false or a function
      return actual;
    }
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../ass":1}],8:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
    aliases: [ 'resolve', 'fulfilled', 'fulfill' ],
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../ass":1}],9:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var ass = require('../ass');


// Helper function to iterate a value creating forks for each element, handling
// async expectations if needed.
function forker (resolver, actual, iterator, stop) {
  var branches = _.size(actual);
  var result = iterator(actual, function (value) {

    var fork = resolver.fork();

    var partial = fork(value);

    // Stop iterating as soon as possible
    if (partial === stop) {
      resolver.join(fork);
      return stop;
    }

    if (partial === !stop) {
      branches -= 1;
      if (0 === branches) {
        resolver.join(fork);
      }
      return !stop;
    }

    // Async support
    if (!resolver.paused) {
      resolver.pause();
    }

    // Subscribe to the fork's final result
    fork.finalize(function (final) {
      // We're done the moment one is a stop result
      if (final === stop) {
        resolver.join(fork);
        resolver.resume(null, stop);
      } else {
        branches -= 1;
        if (0 === branches) {
          resolver.join(fork);
          resolver.resume(null, !stop);
        }
      }
      return final;
    });

    return !stop;  // keep iterating
  });

  // When the forks completed synchronously just finalize the resolver
  if (!resolver.paused) {
    return resolver.finalize(result);
  }

  return undefined;
}


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
        // Shortcut when there is no more stuff to do
        if (resolver.exhausted) {
          return resolver.finalize(true);
        }

        return forker(resolver, actual, _.every, false);
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
        // Shortcut when there is no more stuff to do
        if (resolver.exhausted) {
          return resolver.finalize(true);
        }

        return forker(resolver, actual, _.some, true);
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
        // Shortcut when there is no more stuff to do
        if (resolver.exhausted) {
          return resolver.finalize(true);
        }

        // We are going to use the same algorithm as for .some but we'll negate
        // its result using a finalizer.
        resolver.finalize(function (final) {
          return !final;
        });

        return forker(resolver, actual, _.some, true);
      };
    }
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../ass":1}],10:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var util = require('./util');

// Use a capped pool, the releasing algorithm is pretty solid so we should
// have a good re-use ratio with just a few in the pool. Then in case
// something goes wrong the GC will take care of it after a while.
var pool = util.CappedPool(100);
var created = 0;


// Instantiates a new resolver functor
function factory () {
  // Just forwards the call to the resolver by setting itself as context.
  function fn (value) {
    return resolver.call(fn, value);
  }

  fn.id = ++created;

  // The state is attached to the function object so it's available to the
  // state-less functions when running under `this.`.
  fn.chain = null;
  fn.parent = null;
  fn.paused = false;
  fn.resolved = [];
  fn.finalizers = [];

  // Expose the behaviour in the functor
  fn.pause = pause;
  fn.resume = resume;
  fn.fork = fork;
  fn.join = join;
  fn.finalize = finalize;

  Object.defineProperty(fn, 'exhausted', {
    get: function () {
      return this.resolved.length >= this.chain.__expectations__.length;
    }
  });

  return fn;
}

// This is the core resolution algorithm, it operates over the chain
// of expectations checking them one after the other against a value.
// If a function is returned it'll be immediately called using the
// expectation instance as context and passing as only argument the
// current resolve function, this allows an expectation to override
// the value and/or control the resolution without exposing too many
// internal details.
// When it returns `undefined` it just means that the resolution was
// paused (async), we can not obtain a final result using a synchronous
// call. This can be used by matchers when taking over the resolution to
// know if they need to mangle the results or they have to register a
// finalizer to be notified of the final result from the chain.
function resolver (value) {
  var list, offset, result, exp;

  list = this.chain.__expectations__;
  offset = this.resolved.length;
  result = true;

  for (var i = offset; i < list.length; i++) {
    // Create a new object inheriting from the expectation but with the
    // current actual value provisioned. It allows the expression to mutate
    // its state for this execution but not affect other uses of it.
    exp = util.create(list[i], { actual: value });

    // Keep track of resolved expectations
    this.resolved.push(exp);

    // Execute the expectation to obtain its result
    result = exp.result = exp.resolve();

    // Allow expectations to take control for the remaining of the chain
    if (typeof result === 'function') {
      // Since the control is delegated to the expression we don't have to
      // do anything more here.
      return exp.result = result.call(exp, this);
    }

    // Stop on first failure
    if (result === false) {
      break;
    }
  }

  // At this point we just need to apply any pending finalizers
  return this.finalize(result);
}


// When resolving async flows (i.e.: promises) this will pause the given
// resolver until a call to .resume() is made.
function pause () {
  if (this.paused) {
    throw new Error('Resolver already paused');
  }

  this.paused = true;
}

// Once the async flow has completed we can continue resolving where we
// stoped. When the override param is not undefined we'll skip calling the
// resolver and assume that bool as the final result. This allows the async
// code to shortcut the resolver.
function resume (actual, override) {
  if (!this.paused) {
    throw new Error('Resolver is not currently paused');
  }

  this.paused = false;

  // A final result was provided so just finalize the resolver
  if (override !== undefined) {
    return this.finalize(override);
  }

  // Let's continue resolving with the new value
  // Note: this() looks weird but remember we're using a function as context
  return this(actual);
}

// Clones the current resolver so we can fork and discard operations.
function fork () {
  var fork = acquire(this.chain);
  fork.parent = this;
  // fork.resolved = this.resolved.slice(0);
  fork.resolved = _.reject(this.resolved, Array.isArray);
  return fork;
}

// Assume the results from a fork in the main resolver
function join (fork) {
  var len = _.reject(this.resolved, Array.isArray).length;
  this.resolved.push(
    fork.resolved.slice(len)
  );
}

// When the argument is a function it gets registered as a finalizer for the
// result obtained once the expression has been fully resolved (i.e. async).
// Otherwise it'll execute any registered functions on the given result and
// allow them to change it before releasing the resolver into the pool.
function finalize(result) {
  if (typeof result === 'function') {
    this.finalizers.push(
      [result, _.last(this.resolved)]
    );
    return;
  }

  // Nothing yet to finalize since the result is still unknown
  if (result === undefined) {
    return undefined;
  }

  // Allow finalizers to toggle the result (LIFO order)
  var finalizer;
  while (this.finalizers.length > 0) {
    finalizer = this.finalizers.pop();
    result = finalizer[0].call(finalizer[1], result);
    finalizer[1].result = result;
  }

  // Let the chain dispatch the final result but only for non-forked resolvers
  if (!this.parent) {
    this.chain.dispatchResult(this.resolved, result);
  }

  // When a final result has been obtained release the resolver to the pool
  pool.push(this);
  if (pool.length > created) {
    throw new Error('Pool corrupted! Created ' + created + ' but there are ' + pool.length + ' pooled');
  }

  return result;
}

// Acquires a resolver functor, if there is one in the pool it'll be reset and
// reused, otherwise it'll create a new one. When you're done with the resolver
// you shoud give it to `release()` so it can be incorporated to the pool.
// The reason for using a pool of objects here is that every time we evaluate
// an expression we'll need a resolver, when using quantifiers multiple forks
// will be created, so it's important to improve the performance.
function acquire (chain) {
  var resolver = pool.pop() || factory();

  // Reset the state of the resolver
  resolver.chain = chain;
  resolver.parent = null;
  resolver.paused = false;
  while (resolver.resolved.length > 0) {
    resolver.resolved.pop();
  }
  while (resolver.finalizers.length > 0) {
    resolver.finalizers.pop();
  }

  return resolver;
}


exports.acquire = acquire;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./util":12}],11:[function(require,module,exports){
// Support for .should style syntax, notice that while here resides the core
// logic for it the interface is done in ass.js in order to make it return
// the `ass` function and provide support for its use on beforeEach/afterEach.

var Chain = require('./chain');


var DEFAULT_PROP = 'should';

// Installs the typical .should property on the root Object prototype.
// You can install under any name of your choosing by giving it as argument.
//
// Basically borrowed from the Chai project:
//  Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
//  https://github.com/chaijs/chai/blob/master/lib/chai/interface/should.js
function should (name) {
  if (name === null) {
    return should.restore();
  }

  name = name || DEFAULT_PROP;

  if (name in Object.prototype) {
    if (!(Object.prototype[name] instanceof Chain)) {
      throw new Error('ass.should: Object.prototype already has a .' + name + ' property');
    }
  }

  // modify Object.prototype to have `<name>`
  Object.defineProperty(Object.prototype, name, {
    get: function () {
      if (this instanceof Chain) {
        // Actually Chain instances don't inherit from Object but still
        return this;
      } else if (this instanceof String || this instanceof Number) {
        return new Chain(this.constructor(this));
      } else if (this instanceof Boolean) {
        return new Chain(this == true);
      }
      return new Chain(this);
    },
    set: function (value) {
      // Allow: global.ass = require('ass').should()
      Object.defineProperty(this, name, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    },
    configurable: true,  // Allow restoration
    enumerable: false
  });

  // Expose it as a no-op on Chains since they don't inherit from Object
  Object.defineProperty(Chain.prototype, name, {
    get: function () {
      return this;
    },
    configurable: true  // Allow restoration
  });

}

should.restore = function (name) {
  name = name || DEFAULT_PROP;

  if (name in Object.prototype) {
    if (Object.prototype[name] instanceof Chain) {
      delete Object.prototype[name];
      delete Chain.prototype[name];
    }
  }
};


module.exports = should;

},{"./chain":2}],12:[function(require,module,exports){
(function (process,global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

// Get the native Promise or a shim
// TODO: Check that this works in a browser environment
exports.Promise = global.Promise || (typeof window !== "undefined" ? window.window : typeof global !== "undefined" ? global.window : null).Promise;


// Capped pool to limit the maximum number of elements that can be
// stored (unbounded by default).
exports.CappedPool = function (max) {
  var pool = [];

  max = max || Number.MAX_VALUE;

  Object.defineProperty(pool, 'push', {
    value: function (v) {
      if (this.length < max) {
        Array.prototype.push.call(this, v);
      }
    }
  });

  return pool;
};


var doColors = _.once(function () {
  // Master override with our custom env variable
  if (process.env.ASS_COLORS !== undefined) {
    return /true|on|yes|enabled?|1/i.test(process.env.ASS_COLORS);
  }

  // Check if mocha is around and verify against its configuration
  var Mocha = global.Mocha;
  if (Mocha === undefined && require.resolve && require.resolve('mocha')) {
    Mocha = (typeof window !== "undefined" ? window.Mocha : typeof global !== "undefined" ? global.Mocha : null);
  }
  if (Mocha !== undefined && Mocha.reporters !== undefined && Mocha.reporters.Base !== undefined) {
    return Mocha.reporters.Base.useColors;
  }

  // Query the environment and see if some common variables are set
  if (process.env.MOCHA_COLORS !== undefined) {
    return true;
  }
  if (/--color=always/.test(process.env.GREP_OPTIONS || '')) {
    return true;
  }

  // Finally just check if the environment is capable
  var tty = require('tty');
  return tty.isatty(1) && tty.isatty(2);
});


// Remove ANSI escapes from a string
function unansi (str) {
  return str.replace(/\x1b\[(\d+;?)+[a-z]/gi, '');
}


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

  return '\u001b[1;36m' + value + '\u001b[0m';
}


// Customized version of lodash template
function template (tpl, context) {
  var fn = compileTemplate(tpl);
  if (context === undefined) {
    return fn;
  }

  var origEscape = _.escape;
  try {
    // Override the default escape function to use it for dumping formatted values
    _.escape = valueDumper;

    return fn(context);

  } finally {
    _.escape = origEscape;
  }
}

// A simple fast function binding primitive only supporting setting the context
function bind(fn, thisArg) {
  return function () {
    return fn.apply(thisArg, arguments);
  };
}

// Quickly creates a new object with a custom prototype and some value
// overrides.
function create(proto, values) {
  if (0 === arguments.length) {
    return this;
  }

  // HACK: Use Function.prototype + new instead of the slow-ish Object.create
  create.prototype = proto;
  return _.assign(new create, values || {});
}


exports.bind = bind;
exports.create = create;
exports.template = template;
exports.unansi = unansi;
exports.doColors = doColors;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":14,"tty":15}],13:[function(require,module,exports){
// Register the default matchers
require('./lib/matchers/core');
require('./lib/matchers/coordination');
require('./lib/matchers/quantifiers');
require('./lib/matchers/promise');

module.exports = require('./lib/ass.js');

},{"./lib/ass.js":1,"./lib/matchers/coordination":6,"./lib/matchers/core":7,"./lib/matchers/promise":8,"./lib/matchers/quantifiers":9}],14:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],15:[function(require,module,exports){
exports.isatty = function () { return false; };

function ReadStream() {
  throw new Error('tty.ReadStream is not implemented');
}
exports.ReadStream = ReadStream;

function WriteStream() {
  throw new Error('tty.ReadStream is not implemented');
}
exports.WriteStream = WriteStream;

},{}]},{},[13])(13)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2Vycm9yLmpzIiwibGliL2V4cGVjdGF0aW9uLmpzIiwibGliL21hdGNoZXIuanMiLCJsaWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uLmpzIiwibGliL21hdGNoZXJzL2NvcmUuanMiLCJsaWIvbWF0Y2hlcnMvcHJvbWlzZS5qcyIsImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyIsImxpYi9yZXNvbHZlcnMuanMiLCJsaWIvc2hvdWxkLmpzIiwibGliL3V0aWwuanMiLCJtYWluLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy90dHktYnJvd3NlcmlmeS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN6UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMzekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM3TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG52YXIgTWF0Y2hlciA9IHJlcXVpcmUoJy4vbWF0Y2hlcicpO1xudmFyIEV4cGVjdGF0aW9uID0gcmVxdWlyZSgnLi9leHBlY3RhdGlvbicpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBzaG91bGQgPSByZXF1aXJlKCcuL3Nob3VsZCcpO1xuXG5cbnZhciBkZWZQcm9wID0gdXRpbC5iaW5kKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgT2JqZWN0KTtcblxuXG4vLyBUT0RPOiBEZXRlY3Qgc3VwcG9ydCBmb3IgUHJveHkgYW5kIG9mZmVyIHN1Z2dlc3Rpb25zIGxpa2UgcHlzaG91bGRcblxuXG4vLyBQdWJsaWMgaW50ZXJmYWNlXG5mdW5jdGlvbiBhc3MgKHZhbHVlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBDaGFpbigpO1xuICB9XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpO1xufVxuXG4vLyBEZWZlcnJlZCBmYWN0b3J5XG5hc3MuXyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gbmV3IENoYWluKHZhbHVlKS5fO1xufTtcblxuLy8gR2xvYmFsIHJlZ2lzdHJ5IG9mIG1hdGNoZXJzICh1c2VkIGZvciBhc3MuaGVscClcbmFzcy5tYXRjaGVycyA9IFtdO1xuXG4vLyBhc3MuaGVscCBkdW1wcyB0aGUgaGVscCBvZiBlYWNoIG1hdGNoZXIgcmVnaXN0ZXJlZFxuZGVmUHJvcChhc3MsICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcyA9ICcnO1xuICAgIF8uZm9yRWFjaChhc3MubWF0Y2hlcnMsIGZ1bmN0aW9uIChtYXRjaGVyKSB7XG4gICAgICAvLyBUT0RPOiBUaGlzIGNhbiBiZSBuaWNlclxuICAgICAgdmFyIGZuID0gbWF0Y2hlci50ZXN0LnRvU3RyaW5nKCk7XG4gICAgICB2YXIgYXJncyA9IGZuLnJlcGxhY2UoL15mdW5jdGlvblxccypcXCgoW15cXCldKilcXClbXFxTXFxzXSovLCAnJDEnKTtcbiAgICAgIGFyZ3MgPSBhcmdzLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnRyaW0oKTsgfSk7XG4gICAgICBhcmdzLnNoaWZ0KCk7XG4gICAgICBmbiA9IGFyZ3MubGVuZ3RoID8gJyAoJyArIGFyZ3Muam9pbignLCAnKSArICcpJyA6ICcnO1xuXG4gICAgICBzICs9ICc+IC4nICsgbWF0Y2hlci5uYW1lICsgZm4gKyAnXFxuXFxuJztcbiAgICAgIHMgKz0gJyAgJyArIG1hdGNoZXIuaGVscC5yZXBsYWNlKC9cXG4vZywgJ1xcbiAgJyk7XG4gICAgICBzICs9ICdcXG5cXG4nO1xuICAgIH0pO1xuICAgIHJldHVybiBzO1xuICB9XG59KTtcblxuLy8gVE9ETzogUmV2aWV3IGlmIGNoYW5naW5nIHRoZSBzZW1pLXN0YW5kYXJkIG9yZGVyIG9mIChjb25kLCBtZXNzYWdlKSBpcyBhIGdvb2QgaWRlYVxuYXNzLm9rID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGNvbmQpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBjb25kID0gbWVzc2FnZTtcbiAgICBtZXNzYWdlID0gJ2V4cGVjdGVkIGEgdHJ1aXNoIHZhbHVlJztcbiAgfVxuICBhc3MuZGVzYyhtZXNzYWdlKS50cnV0aHkuYXNzZXJ0KGNvbmQpO1xuICByZXR1cm4gY29uZDtcbn07XG5cbmFzcy5rbyA9IGZ1bmN0aW9uIChtZXNzYWdlLCBjb25kKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgY29uZCA9IG1lc3NhZ2U7XG4gICAgbWVzc2FnZSA9ICdleHBlY3RlZCBhIGZhbHN5IHZhbHVlJztcbiAgfVxuICBhc3MuZGVzYyhtZXNzYWdlKS5mYWxzeS5hc3NlcnQoY29uZCk7XG4gIHJldHVybiBjb25kO1xufTtcblxuLy8gUmVzZXRzIG9yIHZlcmlmaWVzIHRoZSBudW1iZXIgb2YgbWFya3Mgc28gZmFyXG4vLyBGb3JjZWQgYXJpdHktMCB0byBiZSBjb21wYXRpYmxlIHdpdGg6IGJlZm9yZUVhY2goYXNzLm1hcmtzKVxuYXNzLm1hcmtzID0gZnVuY3Rpb24gKC8qIGV4cGVjdGVkLCBkZXNjICovKSB7XG4gIHZhciBleHBlY3RlZCA9IGFyZ3VtZW50c1swXTtcbiAgdmFyIGRlc2MgPSBhcmd1bWVudHNbMV07XG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgZXhwZWN0ZWQgPSBhc3MubWFya3MuY291bnRlcjtcbiAgICBhc3MubWFya3MuY291bnRlciA9IDA7XG4gICAgcmV0dXJuIGV4cGVjdGVkOyAgLy8gcmV0dXJuIGJhY2sgaG93IG1hbnkgdGhlcmUgd2VyZVxuICB9XG5cbiAgYXNzLmRlc2MoZGVzYyB8fCAnYXNzLm1hcmtzJykuZXEoZXhwZWN0ZWQpLmFzc2VydChcbiAgICBhc3MubWFya3MuY291bnRlciwgYXNzLm1hcmtzXG4gICk7XG59O1xuYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuXG5cbi8vIEhlbHBlciB0byByZWdpc3RlciBuZXcgbWF0Y2hlcnMgaW4gdGhlIHJlZ2lzdHJ5XG5hc3MucmVnaXN0ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWF0Y2hlcikge1xuICBpZiAobmFtZSBpbnN0YW5jZW9mIE1hdGNoZXIpIHtcbiAgICBtYXRjaGVyID0gbmFtZTtcbiAgICBuYW1lID0gbWF0Y2hlci5uYW1lO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgIE9iamVjdC5rZXlzKG5hbWUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgYXNzLnJlZ2lzdGVyKGtleSwgbmFtZVtrZXldKTtcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSB7ICAvLyBBc3N1bWUgYSBkZXNjcmlwdG9yIHdhcyBnaXZlblxuICAgIC8vIENyZWF0ZSB0aGUgYWxpYXNlcyBmaXJzdFxuICAgIF8uZm9yRWFjaChtYXRjaGVyLmFsaWFzZXMsIGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgYXNzLnJlZ2lzdGVyKG5ldyBNYXRjaGVyKGFsaWFzLCBtYXRjaGVyKSk7XG4gICAgfSk7XG5cbiAgICBtYXRjaGVyID0gbmV3IE1hdGNoZXIobmFtZSwgbWF0Y2hlcik7XG4gIH1cblxuICAvLyBLZWVwIHRoZSBtYXRjaGVyIGFyb3VuZCBmb3IgYXNzLmhlbHBcbiAgYXNzLm1hdGNoZXJzLnB1c2gobWF0Y2hlcik7XG5cblxuICAvLyBUT0RPOiBBbGxvdyBtYXRjaGVycyB0byBiZSBvdmVycmlkZGVuIGFuZCBhbHNvIG92ZXJsb2FkZWRcbiAgLy8gICAgICAgaWYgdGhleSBoYXZlIGFuIFwib3ZlcmxvYWRcIiBtZXRob2QgaXQgY2FuIGJlIHVzZWRcbiAgLy8gICAgICAgdG8gY2hlY2sgd2hpY2ggb25lIHNob3VsZCBiZSB1c2VkLlxuICAvLyAgICAgICBCZXR0ZXIgSWRlYSAoSSB0aGluayksIGluc3RlYWQgb2Ygb3ZlcmxvYWRpbmcgYmFzZWRcbiAgLy8gICAgICAgb24gdGhlIHZhbHVlIHVuZGVyIHRlc3QsIHdoaWNoIG1heSBwcm9kdWNlIGlzc3Vlc1xuICAvLyAgICAgICBzaW5jZSB3ZSBkb24ndCBrbm93IGZvciBzdXJlIHdoYXQgdGhhdCB2YWx1ZSBpcyxcbiAgLy8gICAgICAgYWxsb3cgbWF0Y2hlcnMgdG8gaW50cm9kdWNlIGEgbmV3IFwicHJvdG90eXBlXCIgZm9yXG4gIC8vICAgICAgIHRoZSBjaGFpbiwgdGhhdCBpcywgYSAuZG9tIG1hdGNoZXIgd2lsbCBpbmNsdWRlXG4gIC8vICAgICAgIGFsbCB0aGUgY29yZSBleHBlY3RhdGlvbnMgYnV0IHRoZW4gYWxzbyBvdmVycmlkZXNcbiAgLy8gICAgICAgYW5kIG5ldyBvbmVzIHVudGlsIHRoZSBlbmQgb2YgdGhlIGNoYWluLlxuXG5cbiAgLy8gTWF0Y2hlciBmdW5jdGlvbnMgd2l0aCBhIHNpbmdsZSBhcmd1bWVudCBhcmUgZ2V0dGVyc1xuICB2YXIgZm5LZXkgPSBtYXRjaGVyLmFyaXR5ID09PSAxID8gJ2dldCcgOiAndmFsdWUnO1xuICB2YXIgcHJvcCA9IHtcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfTtcbiAgaWYgKGZuS2V5ID09PSAndmFsdWUnKSB7XG4gICAgcHJvcC53cml0YWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgLy8gQXVnbWVudCB0aGUgQ2hhaW4gcHJvdG90eXBlXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gZm4gKCkge1xuICAgIC8vIFRPRE86IFZlcmlmeSB0aGUgYXJpdHkgb2YgdGhlIG1hdGNoZXIgdmVyc3VzIHRoZSBjYWxsXG4gICAgdmFyIGV4cCA9IG5ldyBFeHBlY3RhdGlvbihtYXRjaGVyLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfXy5wdXNoKGV4cCk7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBkZWZQcm9wKENoYWluLnByb3RvdHlwZSwgbmFtZSwgcHJvcCk7XG5cbiAgLy8gQXVnbWVudCB0aGUgc3RhdGljIGludGVyZmFjZVxuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hhaW4gPSBuZXcgQ2hhaW4oKTtcblxuICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgIHJldHVybiBjaGFpbltuYW1lXTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhaW5bbmFtZV0uYXBwbHkoY2hhaW4sIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgZGVmUHJvcChhc3MsIG5hbWUsIHByb3ApO1xuXG4gIC8vIFBhc3MgdGhyb3VnaCBmb3IgY2hhaW5zXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gcGFzc3Rocm91Z2goKSB7XG4gICAgcmV0dXJuIHRoaXNbbmFtZV0uYXNzZXJ0KHRoaXMudmFsdWUsIHBhc3N0aHJvdWdoKS52YWx1ZU9mKCk7XG4gIH07XG4gIHByb3AuZW51bWVyYWJsZSA9IGZhbHNlO1xuICBkZWZQcm9wKENoYWluLnByb3RvdHlwZSwgJyQnICsgbmFtZSwgcHJvcCk7XG5cbiAgLy8gUGFzcyB0aHJvdWdoIHN0YXRpYyBjb25zdHJ1Y3RvclxuICBkZWZQcm9wKGFzcywgJyQnICsgbmFtZSwge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgICAgcmV0dXJuIGFzcyh2YWx1ZSlbJyQnICsgbmFtZV07XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSBhIG5ldyBleHByZXNzaW9uIGZvciB0aGUgZXhwZWN0YXRpb25cbiAgICAgIHZhciBjaGFpbiA9IG5ldyBDaGFpbigpO1xuICAgICAgY2hhaW5bbmFtZV0uYXBwbHkoY2hhaW4sIGFyZ3VtZW50cyk7XG4gICAgICAvLyBSZXR1cm4gYSBjYWxsYWJsZSB0aGF0IGFzc2VydHMgdXBvbiByZWNlaXZpbmcgYSB2YWx1ZVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGZuIChhY3R1YWwpIHtcbiAgICAgICAgY2hhaW4uYXNzZXJ0KGFjdHVhbCwgZm4pO1xuICAgICAgICByZXR1cm4gYWN0dWFsO1xuICAgICAgfTtcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IGZhbHNlXG4gIH0pO1xuXG59O1xuXG5cbi8vIE92ZXJyaWRlIGxvZGFzaCdzIGRlZmF1bHQgY3JlYXRlQ2FsbGJhY2sgbWVjaGFuaXNtIHRvIG1ha2UgaXQgdW5kZXJzdGFuZFxuLy8gYWJvdXQgb3VyIGV4cHJlc3Npb24gY2hhaW5zLlxuXy5jcmVhdGVDYWxsYmFjayA9IF8ud3JhcChfLmNyZWF0ZUNhbGxiYWNrLCBmdW5jdGlvbihmdW5jLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAvLyBUaGlzIGxvb2tzIGNvbnRyaXZlZCBidXQgaW5zdGFuY2VvZiBpcyBraW5kIG9mIHNsb3ctaXNoXG4gIGlmIChjYWxsYmFjayAmJiBjYWxsYmFjay5jb25zdHJ1Y3RvciA9PT0gQ2hhaW4pIHtcbiAgICByZXR1cm4gY2FsbGJhY2sudGVzdDtcbiAgfVxuXG4gIC8vIFN1cHBvcnQgXy53aGVyZSBzdHlsZS4gSXQncyBub3QgYXMgZmFzdCBhcyB0aGUgb3JpZ2luYWwgb25lIHNpbmNlIHdlXG4gIC8vIGhhdmUgdG8gZ28gdmlhIF8uaXNFcXVhbCBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBpbnRlcm5hbCBmdW5jdGlvblxuICBpZiAoXy5pc1BsYWluT2JqZWN0KGNhbGxiYWNrKSkge1xuICAgIHZhciBwcm9wcyA9IF8ua2V5cyhjYWxsYmFjayk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgIHZhciBsZW5ndGggPSBwcm9wcy5sZW5ndGgsIHJlc3VsdCA9IGZhbHNlLCBrZXk7XG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAga2V5ID0gcHJvcHNbbGVuZ3RoXTtcbiAgICAgICAgcmVzdWx0ID0gXy5pc0VxdWFsKG9iamVjdFtrZXldLCBjYWxsYmFja1trZXldKTtcbiAgICAgICAgaWYgKCFyZXN1bHQpIGJyZWFrO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGZ1bmMoY2FsbGJhY2ssIHRoaXNBcmcpO1xufSk7XG5cbi8vIE92ZXJyaWRlIGxvZGFzaCdzIGRlZmF1bHQgaXNFcXVhbCBpbXBsZW1lbnRhdGlvbiBzbyBpdCB1bmRlcnN0YW5kc1xuLy8gYWJvdXQgZXhwcmVzc2lvbiBjaGFpbnMuXG4vLyBUT0RPOiBNYWtlIHN1cmUgd2UgZG9uJ3QgYnJlYWsgYW55dGhpbmcsIHBlcmhhcHMgcnVuIGxvZGFzaCB1bml0IHRlc3RzXG4vLyAgICAgICB0byBiZSBhYnNvbHV0ZWx5IHN1cmUgd2UgZG9uJ3QgbWVzcyB3aXRoIGFueXRoaW5nLlxuXy5pc0VxdWFsID0gXy53cmFwKF8uaXNFcXVhbCwgZnVuY3Rpb24gKGZ1bmMsIGEsIGIsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gIGZ1bmN0aW9uIGNtcCAoYTEsIGIxKSB7XG4gICAgLy8gVGhpcyBsb29rcyBjb250cml2ZWQgYnV0IGluc3RhbmNlb2YgaXMga2luZCBvZiBzbG93LWlzaFxuICAgIGlmIChiMSAmJiBiMS5jb25zdHJ1Y3RvciA9PT0gQ2hhaW4pIHtcbiAgICAgIHJldHVybiBiMS50ZXN0KGExKTtcbiAgICB9XG4gICAgaWYgKGExICYmIGExLmNvbnN0cnVjdG9yID09PSBDaGFpbikge1xuICAgICAgcmV0dXJuIGExLnRlc3QoYjEpO1xuICAgIH1cbiAgICByZXR1cm4gY2FsbGJhY2sgPyBjYWxsYmFjay5jYWxsKHRoaXMsIGExLCBiMSkgOiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIGZ1bmMoYSwgYiwgY21wLCB0aGlzQXJnKTtcbn0pO1xuXG5cbi8vIEJ1bmRsZSBzb21lIG9mIHRoZSBpbnRlcm5hbCBzdHVmZiB3aXRoIHRoZSBhc3MgZnVuY3Rpb25cbmFzcy5DaGFpbiA9IENoYWluO1xuYXNzLkVycm9yID0gQXNzRXJyb3I7XG5cbi8vIEZvcndhcmQgdGhlIHNob3VsZCBpbnN0YWxsZXJcbi8vIE5vdGU6IG1ha2UgdGhlbSBhcml0eS0wIHRvIGFsbG93IGJlZm9yZUVhY2goYXNzLnNob3VsZCkgaW4gTW9jaGFcbmFzcy5zaG91bGQgPSBmdW5jdGlvbiAoLyogbmFtZSAqLykge1xuICBzaG91bGQoYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQpO1xuICByZXR1cm4gYXNzO1xufTtcbmFzcy5zaG91bGQucmVzdG9yZSA9IGZ1bmN0aW9uICgvKiBuYW1lICovKSB7XG4gIHNob3VsZC5yZXN0b3JlKGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogdW5kZWZpbmVkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXNzO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciByZXNvbHZlcnMgPSByZXF1aXJlKCcuL3Jlc29sdmVycycpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBQcm9taXNlID0gdXRpbC5Qcm9taXNlO1xuXG52YXIgZGVmUHJvcCA9IHV0aWwuYmluZChPYmplY3QuZGVmaW5lUHJvcGVydHksIE9iamVjdCk7XG5cbi8vIEFuIGV4cGVjdGF0aW9ucyBjaGFpbiAoYWthIGV4cHJlc3Npb24pLCB0aGUgY29yZSBvYmplY3Qgb2YgdGhlIGxpYnJhcnksXG4vLyBhbGxvd3MgdG8gc2V0dXAgYSBzZXQgb2YgZXhwZWN0YXRpb25zIHRvIGJlIHJ1biBhdCBhbnkgcG9pbnQgYWdhaW5zdCBhXG4vLyB2YWx1ZS5cbmZ1bmN0aW9uIENoYWluICh2YWx1ZSkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2hhaW4pKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBc3MgQ2hhaW4gY29uc3RydWN0b3IgY2FsbGVkIHdpdGhvdXQgbmV3IScpO1xuICB9XG5cbiAgLy8gVE9ETzogT24gbm9uIGluaXRpYWxpemVkIGNoYWlucyB3ZSBjYW4ndCBkbyAudmFsdWUsIGl0IHNob3VsZFxuICAvLyAgICAgICBiZSBhIGV4cGVjdGF0aW9uIHRoYXQgZ2V0cyB0aGUgaW5pdGlhbCB2YWx1ZSBnaXZlbiB3aGVuXG4gIC8vICAgICAgIHJlc29sdmluZyAoc28sIGl0IHNob3VsZCBiZSBzdG9yZWQgb24gdGhlIHJlc29sdmVyKVxuICB0aGlzLnZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgPyB2YWx1ZSA6IHRoaXMuX19HVUFSRF9fO1xuXG4gIC8vIEN1c3RvbSBkZXNjcmlwdGlvblxuICBkZWZQcm9wKHRoaXMsICdfX2Rlc2NyaXB0aW9uX18nLCB7XG4gICAgdmFsdWU6ICcnLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gTGlzdCBvZiBbIEV4cGVjdGF0aW9uIF1cbiAgZGVmUHJvcCh0aGlzLCAnX19leHBlY3RhdGlvbnNfXycsIHtcbiAgICB2YWx1ZTogW10sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgLy8gV2hlbiB0cnVlIHRoZSBleHByZXNzaW9uIGlzIGNvbnNpZGVyZWQgZGVmZXJyZWQgYW5kIHdvbid0XG4gIC8vIHRyeSB0byBpbW1lZGlhdGVseSBldmFsdWF0ZSBhbnkgbmV3bHkgY2hhaW5lZCBleHBlY3RhdGlvbi5cbiAgZGVmUHJvcCh0aGlzLCAnX19kZWZlcnJlZF9fJywge1xuICAgIHZhbHVlOiB0aGlzLnZhbHVlID09PSB0aGlzLl9fR1VBUkRfXyxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiB0cnVlXG4gIH0pO1xuXG4gIC8vIEhvbGRzIHRoZSBsaXN0IG9mIHByb21pc2UgY2FsbGJhY2tzIGF0dGFjaGVkIHRvIHRoZSBleHByZXNzaW9uXG4gIGRlZlByb3AodGhpcywgJ19fdGhlbnNfXycsIHtcbiAgICB2YWx1ZTogW10sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgLy8gU2VhbCB0aGUgY29udGV4dCB0byB0aGUgbWV0aG9kcyBzbyB3ZSBjYW4gY2FsbCB0aGVtIGFzIHBsYWluIGZ1bmN0aW9uc1xuICB0aGlzLnRlc3QgPSB1dGlsLmJpbmQoQ2hhaW4ucHJvdG90eXBlLnRlc3QsIHRoaXMpO1xuICB0aGlzLmFzc2VydCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUuYXNzZXJ0LCB0aGlzKTtcbiAgdGhpcy5yZXN1bHQgPSB1dGlsLmJpbmQoQ2hhaW4ucHJvdG90eXBlLnJlc3VsdCwgdGhpcyk7XG4gIHRoaXMudGhyb3VnaCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUudGhyb3VnaCwgdGhpcyk7XG4gIHRoaXMuJCA9IHRoaXMudGhyb3VnaDtcbn1cblxudmFyIHByb3RvID0gQ2hhaW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gQ2hhaW47XG5cbi8vIEd1YXJkIHRva2VuIHRvIGRldGVjdCB2YWx1ZWxlc3MgbWF0Y2hlcnNcbnByb3RvLl9fR1VBUkRfXyA9IHtcbiAgdmFsdWVPZjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd7e3ZhbHVlbGVzc319JztcbiAgfVxufTtcblxuLy8gU3VwcG9ydHMgdGhlIHVzYWdlOiBhc3Muc3RyaW5nLmhlbHBcbmRlZlByb3AocHJvdG8sICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPOiBQcm9kdWN0aXplIHRoaXMgYW5kIHBlcmhhcHMgc2hvdyBoZWxwIGZvciB0aGUgd2hvbGUgY2hhaW5cbiAgICB2YXIgdGFpbCA9IF8udGFpbCh0aGlzLl9fZXhwZWN0YXRpb25zX18pO1xuICAgIHJldHVybiB0YWlsID8gdGFpbC5oZWxwIDogJ04vQSc7XG4gIH1cbn0pO1xuXG4vLyBTdXBwb3J0IHVzZSBjYXNlOiBhc3ModmFsdWUpLl8uc29tZS5udW1iZXIuYWJvdmUoNSkuX1xuZGVmUHJvcChwcm90bywgJ18nLCB7XG4gIGdldDogZnVuY3Rpb24gZm4oKSB7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5fX2RlZmVycmVkX18gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IGZhbHNlO1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufSk7XG5cblxuLy8gRXhwb3NlcyBhIFByb21pc2UvQSBpbnRlcmZhY2UgZm9yIHRoZSBleHByZXNzaW9uLCB0aGUgaW50ZW5kZWQgdXNlIGlzIGZvclxuLy8gb2J0YWluaW5nIHRoZSByZXN1bHQgZm9yIGFzeW5jaHJvbm91cyBleHByZXNzaW9ucy5cbi8vIEhlcmUgdGhvdWdoIHdlIGp1c3QgY29sbGVjdCB0aGUgY2FsbGJhY2tzIHRoZSBhY3R1YWwgcHJvbWlzZSByZXNvbHV0aW9uXG4vLyBpcyBkb25lIGluIHRoZSByZXNvbHZlciB3aGVuIGl0IHJlYWNoZXMgYSByZXN1bHQuXG5wcm90by50aGVuID0gZnVuY3Rpb24gKGNiLCBlYikge1xuICAvLyBSZWdpc3RlciB0aGUgY2FsbGJhY2tzIHRvIGJlIHVzZWQgd2hlbiByZXNvbHZlZFxuICB0aGlzLl9fdGhlbnNfXy5wdXNoKFtjYiwgZWJdKTtcblxuICAvLyBXaGVuIHRoZSBleHByZXNzaW9uIGlzIG5vbiBkZWZlcnJlZCBhbmQgd2UgaGF2ZSBhIHZhbHVlIHdlIGZvcmNlIHRoZVxuICAvLyByZXNvbHZlciB0byBydW4gaW4gb3JkZXIgdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSBhdCBsZWFzdCBvbmNlLlxuICAvLyBUaGlzIGlzIHByaW1hcmlseSB0byBzdXBwb3J0IHRoZSB0ZXN0IHJ1bm5lcnMgdXNlIGNhc2Ugd2hlcmUgYW4gZXhwcmVzc2lvblxuICAvLyBpcyByZXR1cm5lZCBmcm9tIHRoZSB0ZXN0IGFuZCB0aGUgcnVubmVyIHdpbGwgYXR0YWNoIGl0c2VsZiBoZXJlLlxuICBpZiAoIXRoaXMuX19kZWZlcnJlZF9fICYmIHRoaXMudmFsdWUgIT09IHRoaXMuX19HVUFSRF9fKSB7XG4gICAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gICAgcmVzb2x2ZXIodGhpcy52YWx1ZSk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmNhdGNoID0gZnVuY3Rpb24gKGViKSB7XG4gIHJldHVybiB0aGlzLnRoZW4obnVsbCwgZWIpO1xufTtcblxuLy8gRGlzcGF0Y2ggZXZlcnlvbmUgd2hvIHdhcyB3YWl0aW5nIHRvIGJlIG5vdGlmaWVkIG9mIHRoZSBvdXRjb21lXG5wcm90by5kaXNwYXRjaFJlc3VsdCA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgcmVzdWx0KSB7XG4gIGlmICgwID09PSB0aGlzLl9fdGhlbnNfXy5sZW5ndGgpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBHZW5lcmF0ZSBhIG5pY2UgZXJyb3IgZm9yIHRoZSBmYWlsdXJlXG4gIHZhciBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgIGFjdHVhbCA9IHRoaXMuYnVpbGRFcnJvcihyZXNvbHZlZCwgcHJvdG8uZGlzcGF0Y2hSZXN1bHQpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgaW1tZWRpYXRlbHkgd2l0aCBhIGZhaWx1cmUgZXJyb3Igb3JcbiAgLy8gcmVzb2x2ZXMgd2l0aCB0aGUgZXhwcmVzc2lvbiBzdWJqZWN0LlxuICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAvLyBDYWxsaW5nIHJlc29sdmUoKSB3aXRoIGEgcHJvbWlzZSB3aWxsIGF0dGFjaCBpdHNlbGYgdG8gdGhlIHByb21pc2VcbiAgICAvLyBpbnN0ZWFkIG9mIHBhc3NpbmcgaXQgYXMgYSBzaW1wbGUgdmFsdWUuIFRvIGF2b2lkIHRoYXQgd2UgZGV0ZWN0IHRoZVxuICAgIC8vIGNhc2UgYW5kIHdyYXAgaXQgaW4gYW4gYXJyYXkuXG4gICAgaWYgKGFjdHVhbCAmJiB0eXBlb2YgYWN0dWFsLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGFjdHVhbCA9IFtcbiAgICAgICAgJ0FzczogVmFsdWUgd3JhcHBlZCBpbiBhbiBhcnJheSBzaW5jZSBpdCBsb29rcyBsaWtlIGEgUHJvbWlzZScsXG4gICAgICAgIGFjdHVhbFxuICAgICAgXTtcbiAgICB9XG5cbiAgICAocmVzdWx0ID8gcmVzb2x2ZSA6IHJlamVjdCkoIGFjdHVhbCApO1xuICB9KTtcblxuICAvLyBBdHRhY2ggYWxsIHRoZSByZWdpc3RlcmVkIHRoZW5zIHRvIHRoZSBwcm9taXNlIHNvIHRoZXkgZ2V0IG5vdGlmaWVkXG4gIF8uZm9yRWFjaCh0aGlzLl9fdGhlbnNfXywgZnVuY3Rpb24gKGNhbGxiYWNrcykge1xuICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4uYXBwbHkocHJvbWlzZSwgY2FsbGJhY2tzKTtcbiAgfSk7XG59O1xuXG5mdW5jdGlvbiBkdW1wQ2hhaW4gKHJlc29sdmVkLCBpbmRlbnQpIHtcbiAgdmFyIHJlc3VsdCA9ICcnO1xuXG4gIGluZGVudCA9IGluZGVudCB8fCAnJztcblxuICByZXNvbHZlZC5mb3JFYWNoKGZ1bmN0aW9uIChleHAsIGlkeCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV4cCkpIHtcbiAgICAgIHJlc3VsdCArPSBkdW1wQ2hhaW4oZXhwLCBpbmRlbnQgKyAnICAnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZXhwLnJlc3VsdCkge1xuICAgICAgcmVzdWx0ICs9IGluZGVudCArICcgXFx1MDAxYlszMm1QYXNzZWQ6XFx1MDAxYlswbSAnICsgZXhwLmRlc2NyaXB0aW9uICsgJ1xcbic7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVzdWx0ICs9IGluZGVudCArICcgXFx1MDAxYlszMW1GYWlsZWQ6XFx1MDAxYlswbSAnICsgZXhwLmRlc2NyaXB0aW9uICsgJ1xcbic7XG4gICAgaWYgKGlkeCA9PT0gcmVzb2x2ZWQubGVuZ3RoIC0gMSkge1xuICAgICAgcmVzdWx0ICs9IGluZGVudCArICcgICAgXFx1MDAxYlszM21CdXQ6XFx1MDAxYlswbSAnICsgZXhwLmZhaWx1cmUgKyAnXFxuJztcbiAgICB9XG5cbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG4vLyBCdWlsZHMgYW4gQXNzRXJyb3IgZm9yIHRoZSBjdXJyZW50IGV4cHJlc3Npb24uIEl0IG1ha2VzIGEgY291cGxlIG9mXG4vLyBhc3N1bXB0aW9ucywgZm9yIGluc3RhbmNlIHRoZSAuX19vZmZzZXRfXyBtdXN0IGJlIHBsYWNlZCBqdXN0IGFmdGVyIHRoZVxuLy8gZXhwZWN0YXRpb24gdGhhdCBwcm9kdWNlZCB0aGUgZmFpbHVyZSBvZiB0aGUgY2hhaW4uXG5wcm90by5idWlsZEVycm9yID0gZnVuY3Rpb24gKHJlc29sdmVkLCBzc2YpIHtcblxuICB2YXIgZXJyb3IgPSB0aGlzLl9fZGVzY3JpcHRpb25fXyArICdcXG5cXG4nO1xuXG4gIGV4cCA9IHJlc29sdmVkWyByZXNvbHZlZC5sZW5ndGggLSAxIF07XG4gIGVycm9yICs9IGR1bXBDaGFpbihyZXNvbHZlZCk7XG5cbiAgaWYgKCF1dGlsLmRvQ29sb3JzKCkpIHtcbiAgICBlcnJvciA9IHV0aWwudW5hbnNpKGVycm9yKTtcbiAgfVxuXG4gIC8vIFRPRE86IHNob3dEaWZmIHNob3VsZCBiZSB1c2VkIG9ubHkgd2hlbiBpdCBtYWtlcyBzZW5zZSBwZXJoYXBzXG4gIC8vICAgICAgIHdlIGNhbiBwYXNzIG51bGwvdW5kZWZpbmVkIGFuZCBsZXQgQXNzRXJyb3IgZGV0ZWN0IHdoZW4gaXRcbiAgLy8gICAgICAgbWFrZXMgc2Vuc2UuXG5cbiAgdmFyIGV4cGVjdGVkID0gZXhwLmV4cGVjdGVkO1xuICAvLyBNb2NoYSB3aWxsIHRyeSB0byBqc29uaWZ5IHRoZSBleHBlY3RlZCB2YWx1ZSwganVzdCBpZ25vcmUgaWYgaXQncyBhIGZ1bmN0aW9uXG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gbmV3IEFzc0Vycm9yKGVycm9yLCBleHAuYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSwgc3NmIHx8IGFyZ3VtZW50cy5jYWxsZWUpO1xufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIFRoZSByZXN1bHQgaXMgYWx3YXlzIGFcbi8vIGJvb2xlYW4gaW5kaWNhdGluZyB0aGUgb3V0Y29tZSBvciBhbiB1bmRlZmluZWQgdG8gc2lnbmFsIHRoYXQgaXQgcmVhY2hlZFxuLy8gYW4gYXN5bmNocm9ub3VzIGZsb3cuXG4vLyBOb3RlOiBuYW1lZCBgdGVzdGAgdG8gYmUgY29tcGF0aWJsZSB3aXRoIFNpbm9uJ3MgbWF0Y2hlcnMuXG5wcm90by50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBSZXNvbHZlIHRoZSBjaGFpbiBzdGFydGluZyBmcm9tIHJvb3RcbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyBQZXJmb3JtcyB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhaW4gYnV0IGFkZGl0aW9uYWxseSB3aWxsIHJhaXNlIGFuIGVycm9yXG4vLyBpZiBpdCBmYWlscyB0byBjb21wbGV0ZS4gV2hlbiB0aGUgZXhwcmVzc2lvbiByZXNvbHZlcyBhcyB1bmRlZmluZWQgKGFzeW5jKVxuLy8gaXQnbGwgYmUgYXV0b21hdGljYWxseSBlbmFibGUgaXRzIGRlZmVycmVkIGZsYWcuXG4vLyBUaGUgYHNzZmAgaXMgU3RhY2tUcmFjZUZ1bmN0aW9uLCBhIHJlZmVyZW5jZSB0byB0aGUgZmlyc3QgZnVuY3Rpb24gdG8gc2hvd1xuLy8gb24gdGhlIHN0YWNrIHRyYWNlIG9uIHN1cHBvcnRlZCBlbnZpcm9ubWVudHMgKFY4KS5cbnByb3RvLmFzc2VydCA9IGZ1bmN0aW9uIChhY3R1YWwsIHNzZikge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBKdXN0IGlnbm9yZSBpZiB0aGUgYWN0dWFsIHZhbHVlIGlzIG5vdCBwcmVzZW50IHlldFxuICAvLyBUT0RPOiBTaGFsbCBpdCBwcm9kdWNlIGFuIGVycm9yP1xuICBpZiAoYWN0dWFsID09PSB0aGlzLl9fR1VBUkRfXykgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIC8vIENvbnZlcnQgdGhlIGV4cHJlc3Npb24gaW50byBhIGRlZmVycmVkIGlmIGFuIGFzeW5jIGV4cGVjdGlvbiB3YXMgZm91bmRcbiAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fX2RlZmVycmVkX18gPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gSXQgZmFpbGVkIHNvIHJlcG9ydCBpdCB3aXRoIGEgbmljZSBlcnJvclxuICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgIHRocm93IHRoaXMuYnVpbGRFcnJvcihyZXNvbHZlci5yZXNvbHZlZCwgc3NmIHx8IHRoaXMuYXNzZXJ0KTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gQXNzZXJ0cyB0aGUgcHJvdmlkZWQgdmFsdWUgYW5kIGlmIHN1Y2Nlc3NmdWwgcmV0dXJucyB0aGUgb3JpZ2luYWxcbi8vIHZhbHVlIGluc3RlYWQgb2YgdGhlIGNoYWluIGluc3RhbmNlLlxucHJvdG8udGhyb3VnaCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgdGhpcy5hc3NlcnQoYWN0dWFsLCBwcm90by50aHJvdWdoKTtcbiAgcmV0dXJuIGFjdHVhbDtcbn07XG5cbi8vIEV2YWx1YXRlcyB0aGUgZXhwcmVzc2lvbiBjaGFpbiByZXBvcnRpbmcgdGhlIGxhc3QgbXV0YXRlZCB2YWx1ZSBzZWVuIGluXG4vLyBpdC4gSWYgdGhlIGV4cHJlc3Npb24gZG9lcyBub3QgY29tcGxldGUgaXQnbGwgcmV0dXJuIHVuZGVmaW5lZC5cbnByb3RvLnJlc3VsdCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgdmFyIHJlc3VsdDtcblxuICB0cnkge1xuICAgIHRoaXMudGFwKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgfSkudGVzdChhY3R1YWwpO1xuICB9IGZpbmFsbHkge1xuICAgIC8vIFJlbW92ZSB0aGUgLnRhcCBmcm9tIHRoZSBjaGFpblxuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfXy5wb3AoKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5DaGFpbi5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudmFsdWU7XG59O1xuXG5DaGFpbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLl9fZGVzY3JpcHRpb25fXykge1xuICAgIHJldHVybiB0aGlzLl9fZGVzY3JpcHRpb25fXztcbiAgfVxuXG4gIHZhciBkZXNjcyA9IHRoaXMuX19leHBlY3RhdGlvbnNfX1xuICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZGVzY3JpcHRpb24gfSlcbiAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmRlc2NyaXB0aW9uIH0pO1xuXG4gIGlmIChkZXNjcy5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuICcoJyArIGRlc2NzLmpvaW4oJywgJykgKyAnKSc7XG4gIH0gZWxzZSBpZiAoZGVzY3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGRlc2NzWzBdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnPEFzc0NoYWluPic7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDaGFpbjtcbiIsInZhciB1bmFuc2kgPSByZXF1aXJlKCcuL3V0aWwnKS51bmFuc2k7XG5cbi8vIEFQSSBjb21wYXRpYmxlIHdpdGggaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9hc3NlcnRpb24tZXJyb3IvXG4vLyBUaGlzIHNob3VsZCBtYWtlIGludGVncmF0aW9uIHdpdGggTW9jaGEgd29yaywgaW5jbHVkaW5nIGRpZmZlZFxuLy8gb3V0cHV0LlxuZnVuY3Rpb24gQXNzRXJyb3IgKG1lc3NhZ2UsIGFjdHVhbCwgZXhwZWN0ZWQsIHNob3dEaWZmLCBzc2YpIHtcbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblxuICBpZiAodHlwZW9mIGFjdHVhbCA9PT0gJ2Z1bmN0aW9uJykgYWN0dWFsID0gbnVsbDtcbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ2Z1bmN0aW9uJykgZXhwZWN0ZWQgPSBudWxsO1xuICAvLyB0aGlzLmFjdHVhbCA9IGFjdHVhbDtcbiAgLy8gdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkO1xuXG4gIC8vIHRoaXMuc2hvd0RpZmYgPSBzaG93RGlmZiB8fCBmYWxzZTtcblxuICBpZiAodHlwZW9mIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3NmIHx8IGFyZ3VtZW50cy5jYWxsZWUpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuc3RhY2sgPSAobmV3IEVycm9yKG1lc3NhZ2UpKS5zdGFjaztcbiAgfVxufTtcbkFzc0Vycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbkFzc0Vycm9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEFzc0Vycm9yO1xuQXNzRXJyb3IucHJvdG90eXBlLm5hbWUgPSAnQXNzRXJyb3InO1xuXG4vLyBJbXBsZW1lbnQgZmlsdGVyaW5nIEFQSVxuQXNzRXJyb3IucHJvdG90eXBlLmZpbHRlclN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoZnJhbWVzKSB7XG4gIHJldHVybiBmcmFtZXMuZmlsdGVyKGZ1bmN0aW9uIChmcmFtZSkge1xuICAgIHJldHVybiAhL0Fzc0Vycm9yfGFzc2VydC8udGVzdChmcmFtZS5nZXRGdW5jdGlvbk5hbWUoKSk7XG4gIH0pO1xufTtcblxuQXNzRXJyb3IucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIChzdGFjaykge1xuICB2YXIgcHJvcHMgPSB7XG4gICAgbmFtZTogdGhpcy5uYW1lLFxuICAgIG1lc3NhZ2U6IHVuYW5zaSh0aGlzLm1lc3NhZ2UpLFxuICAgIGFjdHVhbDogdGhpcy5hY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IHRoaXMuZXhwZWN0ZWQsXG4gICAgc2hvd0RpZmY6IHRoaXMuc2hvd0RpZmZcbiAgfTtcblxuICAvLyBpbmNsdWRlIHN0YWNrIGlmIGV4aXN0cyBhbmQgbm90IHR1cm5lZCBvZmZcbiAgaWYgKGZhbHNlICE9PSBzdGFjayAmJiB0aGlzLnN0YWNrKSB7XG4gICAgcHJvcHMuc3RhY2sgPSB0aGlzLnN0YWNrO1xuICB9XG5cbiAgcmV0dXJuIHByb3BzO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc0Vycm9yO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciBNYXRjaGVyID0gcmVxdWlyZSgnLi9tYXRjaGVyJyk7XG5cbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdXRpbCcpLnRlbXBsYXRlO1xuXG5cbi8vIEV4cGVjdGF0aW9uIHJlcHJlc2VudHMgYW4gaW5zdGFudGlhdGVkIE1hdGNoZXIgYWxyZWFkeSBjb25maWd1cmVkIHdpdGhcbi8vIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cy5cbmZ1bmN0aW9uIEV4cGVjdGF0aW9uIChtYXRjaGVyLCBhcmdzKSB7XG4gIC8vIEdldCB0aGUgbWF0Y2hlciBjb25maWd1cmF0aW9uIGludG8gdGhpcyBpbnN0YW5jZVxuICBtYXRjaGVyLmFzc2lnbih0aGlzKTtcblxuICAvLyBTdXBwb3J0IGJlaW5nIGdpdmVuIGFuIGBhcmd1bWVudHNgIG9iamVjdFxuICB0aGlzLmFyZ3MgPSBfLnRvQXJyYXkoYXJncyk7XG4gIHRoaXMuYWN0dWFsID0gdW5kZWZpbmVkO1xufVxuXG4vLyBJbmhlcml0IHRoZSBwcm90b3R5cGUgZnJvbSBNYXRjaGVyXG52YXIgcHJvdG8gPSBFeHBlY3RhdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE1hdGNoZXIucHJvdG90eXBlKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gRXhwZWN0YXRpb247XG5cbi8vIEdlbmVyYXRlIGdldHRlciBmb3IgYC5leHBlY3RlZGAgKGFuIGFsaWFzIGZvciBhcmdzWzBdKVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZXhwZWN0ZWQnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmFyZ3NbMF07XG4gIH1cbn0pO1xuXG4vLyBHZW5lcmF0ZSBnZXR0ZXJzIGZvciB0aGUgZmlyc3QgNSBhcmd1bWVudHMgYXMgYXJnMSwgYXJnMiwgLi4uXG5fLnRpbWVzKDUsIGZ1bmN0aW9uIChpKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2FyZycgKyAoaSArIDEpLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5hcmdzW2ldO1xuICAgIH1cbiAgfSk7XG59KTtcblxuLy8gQ29tcHV0ZSB0aGUgZGVzY3JpcHRpb24gbWVzc2FnZSBmb3IgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGV4cGVjdGF0aW9uXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdkZXNjcmlwdGlvbicsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmRlc2MpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMuZGVzYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuZGVzYyh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlKHRoaXMuZGVzYywgdGhpcyk7XG4gIH1cbn0pO1xuXG4vLyBDb21wdXRlIHRoZSBmYWlsdXJlIG1lc3NhZ2UgZm9yIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBleHBlY3RhdGlvblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZmFpbHVyZScsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmZhaWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0aGlzLmZhaWwodGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB0ZW1wbGF0ZSh0aGlzLmZhaWwsIHRoaXMpO1xuICB9XG59KTtcblxuLy8gSGVscGVyIHRvIG11dGF0ZSB0aGUgdmFsdWUgdW5kZXIgdGVzdFxuRXhwZWN0YXRpb24ucHJvdG90eXBlLm11dGF0ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyKHZhbHVlKTtcbiAgfTtcbn07XG5cbi8vIFJlc29sdmluZyBjYW4gb3ZlcnJpZGUgdGhlIGV4cGVjdGF0aW9uIHN0YXRlLCBpZiB0aGF0J3Mgbm90IGRlc2lyYWJsZSBtYWtlXG4vLyBzdXJlIHRoYXQgdGhpcyBtZXRob2QgaXMgY2FsbGVkIGluIGEgbmV3IGNvbnRleHQuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFyZ3MsIHJlc3VsdDtcblxuICAvLyBFeGVjdXRlIHRoZSBtYXRjaGVyIHRlc3Qgbm93IHRoYXQgZXZlcnl0aGluZyBpcyBzZXRcbiAgYXJncyA9IFt0aGlzLmFjdHVhbF0uY29uY2F0KHRoaXMuYXJncyk7XG4gIHJlc3VsdCA9IHRoaXMudGVzdC5hcHBseSh0aGlzLCBhcmdzKTtcblxuICAvLyBSZXR1cm5pbmcgYSBzdHJpbmcgb3ZlcnJpZGVzIHRoZSBtaXNtYXRjaCBkZXNjcmlwdGlvblxuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICB0aGlzLmZhaWwgPSByZXN1bHQ7XG4gICAgcmVzdWx0ID0gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5kZXNjcmlwdGlvbjtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBFeHBlY3RhdGlvbjtcbiIsIi8vIFRoZSBNYXRjaGVyIG9iamVjdCBpcyBhIGRlc2NyaXB0b3IgZm9yIHRoZSBtYXRjaGluZyBsb2dpYyBidXQgY2Fubm90XG4vLyBiZSB1c2VkIGRpcmVjdGx5LiBVc2UgYW4gRXhwZWN0YXRpb24gdG8gZ2V0IGFuIGluaXRpYWxpemVkIG1hdGNoZXIuXG5mdW5jdGlvbiBNYXRjaGVyIChuYW1lLCBkZXNjcmlwdG9yKSB7XG5cbiAgLy8gU2hvcnRjdXQgZm9yIHNpbXBsZSB0ZXN0IGZ1bmN0aW9uc1xuICBpZiAodHlwZW9mIGRlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkZXNjcmlwdG9yID0ge3Rlc3Q6IGRlc2NyaXB0b3J9O1xuICB9XG5cbiAgLy8gVGhlIGdlbmVyaWMgbmFtZSBvZiB0aGUgbWF0Y2hlclxuICB0aGlzLm5hbWUgPSBuYW1lO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGRlc2NyaXB0b3IuaGVscCkpIHtcbiAgICB0aGlzLmhlbHAgPSBkZXNjcmlwdG9yLmhlbHAuam9pbignXFxuJyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5oZWxwID0gZGVzY3JpcHRvci5oZWxwIHx8ICdOb3QgYXZhaWxhYmxlJztcbiAgfVxuXG4gIC8vIEVpdGhlciBhIHRlbXBsYXRlIHN0cmluZyBvciBhIGZ1bmN0aW9uIHRoYXQgd2lsbCByZWNlaXZlIGFzIG9ubHlcbiAgLy8gYXJndW1lbnQgYW4gRXhwZWN0YXRpb24gaW5zdGFuY2UgKGNhbGxlZCBhcyBhIG1ldGhvZCBvZiBpdCkuXG4gIHRoaXMuZGVzYyA9IGRlc2NyaXB0b3IuZGVzYyAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IGRlc2NyaXB0b3IuZGVzY1xuICAgICAgICAgICAgOiB0aGlzLm5hbWU7XG5cbiAgLy8gRWl0aGVyIGEgdGVtcGxhdGUgc3RyaW5nIG9yIGEgZnVuY3Rpb24gdGhhdCB3aWxsIHJlY2VpdmUgYXMgb25seVxuICAvLyBhcmd1bWVudCBhbiBFeHBlY3RhdGlvbiBpbnN0YW5jZSAoY2FsbGVkIGFzIGEgbWV0aG9kIG9mIGl0KS5cbiAgdGhpcy5mYWlsID0gZGVzY3JpcHRvci5mYWlsIHx8ICd3YXMge3sgYWN0dWFsIH19JztcblxuICBpZiAoIWRlc2NyaXB0b3IudGVzdCkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGVzdCBmdW5jdGlvbiBub3QgZGVmaW5lZCBmb3IgdGhlIG1hdGNoZXInKTtcbiAgfVxuICB0aGlzLnRlc3QgPSBkZXNjcmlwdG9yLnRlc3Q7XG5cbiAgdGhpcy5hcml0eSA9IGRlc2NyaXB0b3IuYXJpdHkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgID8gZGVzY3JpcHRvci5hcml0eVxuICAgICAgICAgICAgIDogdGhpcy50ZXN0Lmxlbmd0aDtcbn1cblxuTWF0Y2hlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuTWF0Y2hlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNYXRjaGVyO1xuXG5NYXRjaGVyLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMubmFtZSwge1xuICAgIGhlbHA6IHRoaXMuaGVscCxcbiAgICBkZXNjOiB0aGlzLmRlc2MsXG4gICAgZmFpbDogdGhpcy5mYWlsLFxuICAgIHRlc3Q6IHRoaXMudGVzdCxcbiAgICBhcml0eTogdGhpcy5hcml0eVxuICB9KTtcbn07XG5cbi8vIEF1Z21lbnQgYW5vdGhlciBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBvZiB0aGlzIG1hdGNoZXJcbk1hdGNoZXIucHJvdG90eXBlLmFzc2lnbiA9IGZ1bmN0aW9uIChvYmopIHtcbiAgb2JqLmhlbHAgPSB0aGlzLmhlbHA7XG4gIG9iai5kZXNjID0gdGhpcy5kZXNjO1xuICBvYmouZmFpbCA9IHRoaXMuZmFpbDtcbiAgb2JqLnRlc3QgPSB0aGlzLnRlc3Q7XG4gIG9iai5hcml0eSA9IHRoaXMuYXJpdHk7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICc8QXNzLk1hdGNoZXIgJyArIHRoaXMubmFtZSArICc+Jztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXRjaGVyO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG5hc3MucmVnaXN0ZXIoe1xuXG4gIGFuZDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIG9mIHRoZW0sIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhbGwgdGhlIGV4cGVjdGF0aW9ucyB0aGF0IGZvcm0gaXQgZG8gaW5kZWVkIHN1Y2NlZWQuJyxcbiAgICAgICdOb3RlOiBldmFsdWF0aW9uIHdpbGwgc3RvcCBhcyBzb29uIGFzIG9uZSBvZiB0aGUgZXhwZWN0YXRpb25zIGZhaWxzLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgQU5EIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgcmVzdWx0ID0gXy5ldmVyeShicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIGZhbHNlKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIGtlZXAgaXRlcmF0aW5nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhcnRpYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFrZSBjYXJlIG9mIGFueSBleHBlY3RhdGlvbnMgbGF0ZXIgaW4gdGhlIGNoYWluXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICBvcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIG9mIHRoZW0sIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGV4cGVjdGF0aW9ucyBkb2VzLicsXG4gICAgICAnTm90ZTogZXZhbHVhdGlvbiB3aWxsIHN0b3AgYXMgc29vbiBhcyBvbmUgb2YgdGhlIGV4cGVjdGF0aW9ucyBzdWNjZWVkcy4nXG4gICAgXSxcbiAgICBkZXNjOiAnJHsgYXJncy5qb2luKFwiIE9SIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgcmVzdWx0ID0gXy5zb21lKGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgfSksIF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIGtlZXAgaXRlcmF0aW5nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhcnRpYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFrZSBjYXJlIG9mIGFueSBleHBlY3RhdGlvbnMgbGF0ZXIgaW4gdGhlIGNoYWluXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICB4b3I6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgZXhwZWN0YXRpb24gZnJvbSB0d28gb3IgbW9yZSBvZiB0aGVtLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBleHBlY3RhdGlvbnMgZG9lcyBidXQgbm90IGFsbCBvZiB0aGVtLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgWE9SIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgb2tzID0gMDtcbiAgICAgICAgdmFyIGtvcyA9IDA7XG4gICAgICAgIF8uZm9yRWFjaChicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAoa29zID4gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBva3MgKz0gMTtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsLCBva3MgPiAwICYmIGtvcyA+IDAgPyB1bmRlZmluZWQgOiBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAob2tzID4gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBrb3MgKz0gMTtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsLCBva3MgPiAwICYmIGtvcyA+IDAgPyB1bmRlZmluZWQgOiBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIH0gZWxzZSBpZiAocGFydGlhbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgb2tzICs9IDE7XG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0aWFsID09PSBmYWxzZSkge1xuICAgICAgICAgICAga29zICs9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBva3MgPiAwICYmIGtvcyA+IDAgPyByZXNvbHZlcihhY3R1YWwpIDogZmFsc2U7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG59KTtcbiIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cbi8vIFNldCBvZiBkZWZhdWx0IG1hdGNoZXJzXG5hc3MucmVnaXN0ZXIoe1xuICBkZXNjOiB7XG4gICAgaGVscDogJ1Byb3ZpZGUgYSBjdXN0b20gZGVzY3JpcHRpb24gZm9yIHJlcG9ydGVkIGZhaWx1cmVzJyxcbiAgICBkZXNjOiBudWxsLCAgLy8gU2tpcCBpdCBmcm9tIHJlcG9ydHNcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBkZXNjKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgdGhlIGRlc2NyaXB0aW9uIHdvbid0IGJlIHNldCB1bnRpbCB0aGUgY2hhaW4gaXMgcmVzb2x2ZWQsXG4gICAgICAvLyBhdCBsZWFzdCBvbmNlLCByZWFjaGluZyB0aGlzIGV4cGVjdGF0aW9uLlxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXNvbHZlci5jaGFpbi5fX2Rlc2NyaXB0aW9uX18gPSBkZXNjO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIC8vIElnbm9yZWQgbWF0Y2hlcnNcbiAgdG86IHtcbiAgICBhbGlhc2VzOiBbICdhJywgJ2FuJywgJ2JlJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdKdXN0IHNvbWUgc3ludGF4IHN1Z2FyIHRvIG1ha2UgdGhlIGV4cGVjdGF0aW9ucyBlYXNpZXIgb24gdGhlIGV5ZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgbWFyazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJbmNyZWFzZXMgdGhlIGdsb2JhbCBgYXNzLm1hcmtzYCBjb3VudGVyIGV2ZXJ5IHRpbWUgaXQgZ2V0cycsXG4gICAgICAnZXZhbHVhdGVkIGFzIHBhcnQgb2YgYW4gZXhwcmVzc2lvbi4gVXNlIGl0IHRvIHZlcmlmeSB0aGF0IHRoZScsXG4gICAgICAnZXhwZWN0YXRpb25zIGFyZSBhY3R1YWxseSBiZWluZyBleGVjdXRlZC4nLFxuICAgICAgJ0FuIGVhc3kgd2F5IHRvIHN1cHBvcnQgdGhpcyB3aGVuIHVzaW5nIGEgdGVzdCBydW5uZXIgaXMgdG8gcmVzZXQnLFxuICAgICAgJ3RoZSBjb3VudGVyIGJ5IGNhbGxpbmcgYGFzcy5tYXJrcygpYCBvbiBhIGJlZm9yZUVhY2ggaG9vayBhbmQnLFxuICAgICAgJ3RoZW4gdmVyaWZ5IGF0IHRoZSBlbmQgb2YgdGVzdCB3aXRoIGBhc3MubWFya3MoTilgICh3aGVyZSBOIGlzJyxcbiAgICAgICd0aGUgbnVtYmVyIG9mIG1hcmtzIHlvdSBleHBlY3RlZCkuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBhc3MubWFya3MuY291bnRlciArPSAxO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIC8vIEp1c3QgYWxsb3cgYW55dGhpbmcgOilcbiAgYW55OiB7XG4gICAgaGVscDogJ0FsbG93cyBhbnkgdmFsdWUgd2l0aG91dCB0ZXN0aW5nIGl0LicsXG4gICAgZGVzYzogJ2lzIGFueXRoaW5nJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIC8vIEFueXRoaW5nIHRoYXQgaXNuJ3QgbnVsbCBvciB1bmRlZmluZWRcbiAgZGVmaW5lZDoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZC4nLFxuICAgIGRlc2M6ICdpcyBkZWZpbmVkJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9IG51bGw7XG4gICAgfVxuICB9LFxuICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgZW1wdHlcbiAgZW1wdHk6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBlbXB0eSAoaGFzIGEgbGVuZ3RoIG9mIDApLicsXG4gICAgZGVzYzogJ2lzIGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID09IG51bGwgfHwgYWN0dWFsLmxlbmd0aCA9PT0gMDtcbiAgICB9XG4gIH0sXG4gIG5vbkVtcHR5OiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbm90IGVtcHR5IChoYXMgYSBsZW5ndGggZ3JlYXRlciB0aGFuIDApLicsXG4gICAgZGVzYzogJ2lzIG5vdCBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAhPSBudWxsICYmIGFjdHVhbC5sZW5ndGggPiAwO1xuICAgIH1cbiAgfSxcbiAgdHJ1dGh5OiB7XG4gICAgYWxpYXNlczogWyAndHJ1aXNoJyBdLFxuICAgIGhlbHA6ICdUaGUgdmFsdWUgc2hvdWxkIGJlIHRydXRoeSAobm90IHVuZGVmaW5lZCwgbnVsbCwgMCwgXCJcIiBvciBbXSkuJyxcbiAgICBkZXNjOiAnaXMgdHJ1dGh5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWFjdHVhbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwubGVuZ3RoID09PSAnbnVtYmVyJyA/IGFjdHVhbC5sZW5ndGggIT09IDAgOiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZmFsc3k6IHtcbiAgICBoZWxwOiAnVGhlIHZhbHVlIHNob3VsZCBiZSBmYWxzeSAodW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyBmYWxzeScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwubGVuZ3RoID09PSAwIDogZmFsc2U7XG4gICAgfVxuICB9LFxuXG4gIC8vIE5lZ2F0aW9uXG4gIG5vdDoge1xuICAgIGhlbHA6ICdOZWdhdGVzIHRoZSByZXN1bHQgZm9yIHRoZSByZXN0IG9mIHRoZSBleHByZXNzaW9uLicsXG4gICAgZGVzYzogJ05vdCEnLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmVyLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgICAgIHJldHVybiAhZmluYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgaXM6IHtcbiAgICBhbGlhc2VzOiBbICdlcXVhbCcsICdlcXVhbHMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBzdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgICAgJ05vdGU6IGlmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIGNoYWluIGV4cHJlc3Npb24gaXRcXCdsbCBiZSB0ZXN0ZWQgaW5zdGVhZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gc3RyaWN0bHkgZXF1YWwge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAvLyB0aGlzIGlzIGEgYml0IGNvbnRyaXZlZCBidXQgaXQgbWFrZXMgZm9yIHNvbWUgbmljZSBzeW50YXggdG8gYmUgYWJsZSB0b1xuICAgICAgLy8gdXNlIC5pcyBmb3IgcGFzc2luZyBpbiBleHBlY3RhdGlvbnNcbiAgICAgIGlmIChleHBlY3RlZCAmJiBleHBlY3RlZCBpbnN0YW5jZW9mIGFzcy5DaGFpbikge1xuICAgICAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWN0dWFsID09PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG4gIGVxOiB7XG4gICAgYWxpYXNlczogWyAnZXFsJywgJ2VxbHMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBkZWVwIG5vbi1zdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgICAgJ0l0IHVuZGVyc3RhbmRzIGFzcyBleHByZXNzaW9ucyBzbyB5b3UgY2FuIGNvbWJpbmUgdGhlbSBhdCB3aWxsIGluIHRoZScsXG4gICAgICAnZXhwZWN0ZWQgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGVxdWFsIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIF8uaXNFcXVhbChhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICB9XG4gIH0sXG5cbiAgYWJvdmU6IHtcbiAgICBhbGlhc2VzOiBbICdndCcsICdtb3JlVGhhbicsICdncmVhdGVyVGhhbicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBoaWdoZXIgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbW9yZSB0aGFuIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA+IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBiZWxvdzoge1xuICAgIGFsaWFzZXM6IFsgJ2x0JywgJ2xlc3NUaGFuJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGxvd2VyIHRoYSBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbGVzcyB0aGFuIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA8IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBhYm92ZU9yRXF1YWw6IHtcbiAgICBhbGlhc2VzOiBbICdsZWFzdCcsICdhdExlYXN0JywgJ2d0ZScsICdtb3JlVGhhbk9yRXF1YWwnLCAnZ3JlYXRlclRoYW5PckVxdWFsJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGhpZ2hlciBvciBlcXVhbCB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBtb3JlIHRoYW4gb3IgZXF1YWwgdG8gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPj0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGJlbG93T3JFcXVhbDoge1xuICAgIGFsaWFzZXM6IFsgJ21vc3QnLCAnYXRNb3N0JywgJ2x0ZScsICdsZXNzVGhhbk9yRXF1YWwnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbG93ZXIgb3IgZXF1YWwgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvICR7ZXhwZWN0ZWR9JyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPD0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGluc3RhbmNlb2Y6IHtcbiAgICBhbGlhc2VzOiBbICdpbnN0YW5jZU9mJywgJ2luc3RhbmNlJywgJ2lzYScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gY29uc3RydWN0b3IuJyxcbiAgICAgICdXaGVuIHRoZSBleHBlY3RlZCBpcyBhIHN0cmluZyBpdFxcJ2xsIGFjdHVhbGx5IHVzZSBhIGB0eXBlb2ZgJyxcbiAgICAgICdjb21wYXJpc29uLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhbiBpbnN0YW5jZSBvZiB7e2V4cGVjdGVkfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwgPT09IGV4cGVjdGVkID8gdHJ1ZSA6ICdoYWQgdHlwZSB7eyB0eXBlb2YgYWN0dWFsIH19JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgdHlwZW9mOiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgb2YgYSBzcGVjaWZpYyB0eXBlJyxcbiAgICBkZXNjOiAndG8gaGF2ZSB0eXBlIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ2hhZCAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gXy5pc0VxdWFsKHR5cGVvZiBhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICB9XG4gIH0sXG4gIG51bWJlcjoge1xuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBudW1iZXIgKGRpZmZlcmVudCBvZiBOYU4pLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgbnVtYmVyJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc051bWJlcihhY3R1YWwpICYmICFpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgYm9vbDoge1xuICAgIGFsaWFzZXM6IFsgJ2Jvb2xlYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIGJvb2xlYW4uJyxcbiAgICBkZXNjOiAndG8gYmUgYSBib29sZWFuJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Jvb2xlYW4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHN0cmluZzoge1xuICAgIGFsaWFzZXM6IFsgJ3N0cicgXSxcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgc3RyaW5nLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgc3RyaW5nJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1N0cmluZyhhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgb2JqZWN0OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgb2YgdHlwZSBvYmplY3QuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gb2JqZWN0JyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc09iamVjdChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgcGxhaW5PYmplY3Q6IHtcbiAgICBhbGlhc2VzOiBbICdwbGFpbicsICdvYmonIF0sXG4gICAgaGVscDogJ0NoZWNrcyB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZSBPYmplY3QgY29uc3RydWN0b3IuJyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNQbGFpbk9iamVjdChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgYXJyYXk6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBBcnJheS4nLFxuICAgIGRlc2M6ICd0byBiZSBhbiBBcnJheScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNBcnJheShhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZnVuY3Rpb246IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIEZ1bmN0aW9uLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgRnVuY3Rpb24nLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRnVuY3Rpb24oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHJlZ2V4cDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgUmVnRXhwJyxcbiAgICBkZXNjOiAndG8gYmUgYSBSZWdFeHAnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUmVnRXhwKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBkYXRlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBEYXRlJyxcbiAgICBkZXNjOiAndG8gYmUgYSBEYXRlJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0RhdGUoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGVsZW1lbnQ6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIERPTSBlbGVtZW50JyxcbiAgICBkZXNjOiAndG8gYmUgYSBET00gZWxlbWVudCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNFbGVtZW50KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBlcnJvcjoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGFuIGVycm9yIChvciBsb29rcyBsaWtlIGl0KScsXG4gICAgZGVzYzogJ3RvIGJlIGFuIEVycm9yJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoYWN0dWFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gXy5pc09iamVjdChhY3R1YWwpICYmIF8uaXNTdHJpbmcoYWN0dWFsLm5hbWUpICYmIF8uaXNTdHJpbmcoYWN0dWFsLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSxcblxuICB1bmRlZmluZWQ6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyB1bmRlZmluZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgdW5kZWZpbmVkJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1VuZGVmaW5lZChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgbnVsbDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIG51bGwuJyxcbiAgICBkZXNjOiAndG8gYmUgbnVsbCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAhPT0gbnVsbDtcbiAgICB9XG4gIH0sXG4gIE5hTjoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIE5hTi4nLFxuICAgIGRlc2M6ICd0byBiZSBOYU4nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzTnVtYmVyKGFjdHVhbCkpIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ3dhcyAke2FjdHVhbH0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGlzTmFOKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICB0cnVlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgdHJ1ZScsXG4gICAgZGVzYzogJ3RvIGJlIHRydWUnLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gYWN0dWFsID09IHRydWUgPyB0cnVlIDogJ3dhcyB7e2FjdHVhbH19JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBmYWxzZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGZhbHNlJyxcbiAgICBkZXNjOiAndG8gYmUgZmFsc2UnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzQm9vbGVhbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiBhY3R1YWwgPT0gZmFsc2UgPyB0cnVlIDogJ3dhcyB7e2FjdHVhbH19JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJhaXNlczoge1xuICAgIGFsaWFzZXM6IFsgJ3Rocm93cycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIHRoYXQgZXhlY3V0aW5nIHRoZSB2YWx1ZSByZXN1bHRzIGluIGFuIGV4Y2VwdGlvbiBiZWluZyB0aHJvd24uJyxcbiAgICAgICdUaGUgY2FwdHVyZWQgZXhjZXB0aW9uIHZhbHVlIGlzIHVzZWQgdG8gbXV0YXRlIHRoZSBzdWJqZWN0IGZvciB0aGUnLFxuICAgICAgJ2ZvbGxvd2luZyBleHBlY3RhdGlvbnMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3Rocm93cyBhbiBlcnJvcicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghXy5pc0Z1bmN0aW9uKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBmdW5jdGlvbjoge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGFjdHVhbCgpO1xuICAgICAgICByZXR1cm4gJ2RpZCBub3QgdGhyb3cgYW55dGhpbmcnO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZXhwZWN0ZWQgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGV4cGVjdGVkKSAmJiBlIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNFcXVhbChlLCBleHBlY3RlZCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdWdtZW50IHRoZSBleHBlY3RhdGlvbiBvYmplY3Qgd2l0aCBhIG5ldyB0ZW1wbGF0ZSB2YXJpYWJsZVxuICAgICAgICB0aGlzLmV4Y2VwdGlvbiA9IGU7XG4gICAgICAgIHJldHVybiAnZ290IHt7IGV4Y2VwdGlvbiB9fSc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGhhczoge1xuICAgIGFsaWFzZXM6IFsgJ2hhdmUnLCAnY29udGFpbicsICdjb250YWlucycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2sgaWYgdGhlIHZhbHVlIGhhcyBzb21lIGV4cGVjdGVkIHZhbHVlLiBJdCB1bmRlcnN0YW5kcyBleHBlY3RlZCcsXG4gICAgICAnY2hhaW4gZXhwcmVzc2lvbnMgc28gdGhpcyBzZXJ2ZXMgYXMgdGhlIGVxdWl2YWxlbnQgb2YgLmVxIGZvciBwYXJ0aWFsJyxcbiAgICAgICdtYXRjaGVzLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBjb250YWluIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuXG4gICAgICBpZiAoXy5pc1N0cmluZyhhY3R1YWwpICYmIF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiAtMSAhPT0gYWN0dWFsLmluZGV4T2YoZXhwZWN0ZWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoXy5pc0FycmF5KGFjdHVhbCkpIHtcbiAgICAgICAgLy8gSGFjazogZm9yIGFycmF5cyB3ZSBhbGxvdyBtdWx0aXBsZSBleHBlY3RlZCB2YWx1ZXNcbiAgICAgICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICAgIHJldHVybiBfLmV2ZXJ5KGV4cGVjdGVkLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICByZXR1cm4gLTEgIT09IF8uZmluZEluZGV4KGFjdHVhbCwgZXYpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdnb3Qge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIC8vIENvbXBhcmUgb2JqZWN0cyB3aXRoIC53aGVyZVxuICAgICAgcmV0dXJuIDAgPCBfLndoZXJlKGFjdHVhbCwgZXhwZWN0ZWQpLmxlbmd0aDtcbiAgICB9XG4gIH0sXG4gIGhhc093bjoge1xuICAgIGFsaWFzZXM6IFsgJ2hhc0tleScsICdoYXNJbmRleCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2sgaWYgdGhlIHZhbHVlIGhhcyBvbmUgb3IgbW9yZSBvd24gcHJvcGVydGllcyBhcyBkZWZpbmVkIGJ5JyxcbiAgICAgICd0aGUgZ2l2ZW4gYXJndW1lbnRzLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBoYXZlIG93biBwcm9wZXJ0eSAkeyBleHBlY3RlZCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZmFpbCA9ICdvbmx5IGhhZCB7eyBfLmtleXMoYWN0dWFsKSB9fSc7XG5cbiAgICAgIC8vIFRPRE86IE9mZmVyIGJldHRlciBmYWlsdXJlIG1lc3NhZ2VcbiAgICAgIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gXy5ldmVyeShhcmdzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4gXy5oYXMoYWN0dWFsLCB4KTsgfSk7XG4gICAgfVxuICB9LFxuXG4gIGxvZzoge1xuICAgIGhlbHA6IFtcbiAgICAgICdEdW1wcyB0aGUgcmVjZWl2ZWQgdmFsdWUgdG8gdGhlIGNvbnNvbGUuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBjb25zb2xlLmxvZygnW0FTU10nLCBhY3R1YWwpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBkdW1wOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0R1bXBzIHRoZSByZWNlaXZlZCB2YWx1ZSB0byB0aGUgY29uc29sZSBhcHBseWluZyB0aGUgZ2l2ZW4gdGVtcGxhdGUuJyxcbiAgICAgICdOb3RlOiBVc2UgJHt0aGlzfSB0byBpbnRlcnBvbGF0ZSB0aGUgd2hvbGUgdmFsdWUuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3RlbXBsYXRlJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCB0cGwpIHtcbiAgICAgIHZhciB0ZW1wbGF0ZSA9IF8udGVtcGxhdGUodHBsKTtcbiAgICAgIHZhciByZXN1bHQgPSB0ZW1wbGF0ZS5jYWxsKGFjdHVhbCwgYWN0dWFsKTtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGRlYnVnZ2VyOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0hhbHRzIHNjcmlwdCBleGVjdXRpb24gYnkgdHJpZ2dlcmluZyB0aGUgaW50ZXJhY3RpdmUgZGVidWdnZXIuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICB0YXA6IHtcbiAgICBhbGlhc2VzOiBbICdmbicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2FsbHMgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uIHdpdGggdGhlIGN1cnJlbnQgdmFsdWUgYXMgYXJndW1lbnQuJyxcbiAgICAgICdJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyBzb21ldGhpbmcgZGlmZmVyZW50IHRvICp1bmRlZmluZWQqIHRoZScsXG4gICAgICAnZXhwcmVzc2lvbiB3aWxsIGZvcmsgdG8gb3BlcmF0ZSBvbiB0aGUgcmV0dXJuZWQgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2NhbGwge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZm4oYWN0dWFsKTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBzaXplOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSBzaXplIG9mIHRoZSBjdXJyZW50IHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgc2l6ZScsXG4gICAgZmFpbDogJ25vdCBoYXMgYSBsZW5ndGg6IHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNPYmplY3QoYWN0dWFsKSB8fCBfLmlzQXJyYXkoYWN0dWFsKSB8fCBfLmlzU3RyaW5nKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKF8uc2l6ZShhY3R1YWwpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSxcbiAgcHJvcDoge1xuICAgIGFsaWFzZXM6IFsgJ2tleScsICdwcm9wZXJ0eScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gb25lIG9mIHRoZSB2YWx1ZSBwcm9wZXJ0aWVzLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgcHJvcGVydHkge3sgYXJnMSB9fScsXG4gICAgZmFpbDogJ3dhcyBub3QgZm91bmQgb24ge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBrZXkpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgaWYgKGtleSBpbiBhY3R1YWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoYWN0dWFsW2tleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5rZXlzID0gW107XG4gICAgICAgIF8uZm9ySW4oYWN0dWFsLCBmdW5jdGlvbiAodiwgaykgeyB0aGlzLmtleXMucHVzaChrKTsgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiAnbm90IGZvdW5kIGZyb20ge3sga2V5cyB9fSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ2dvdCB7e2FjdHVhbH19JztcbiAgICB9XG4gIH0sXG4gIGF0OiB7XG4gICAgYWxpYXNlczogWyAnaW5kZXgnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIG9wZXJhdGUgb24gb25lIG9mIHRoZSBpbmRleGVkIGVsZW1lbnRzLiBJZicsXG4gICAgICAnbXVsdGlwbGUgaW5kZXhlcyBhcmUgcHJvdmlkZWQgYW4gYXJyYXkgaXMgY29tcG9zZWQgd2l0aCB0aGVtLicsXG4gICAgICAnTm90ZTogSXQgc3VwcG9ydHMgbmVnYXRpdmUgaW5kZXhlcydcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgaW5kZXggJHsgYXJncy5qb2luKFwiLCBcIikgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgaW5kZXgpIHtcbiAgICAgIGlmICghXy5pc0FycmF5KGFjdHVhbCkgJiYgIV8uaXNTdHJpbmcoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ25vdCBhbiBhcnJheSBvciBhIHN0cmluZzogJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgdmFyIGluZGV4ZXMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHZhciBlbGVtcyA9IFtdO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGV4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGlkeCA9IGluZGV4ZXNbaV07XG5cbiAgICAgICAgaWR4ID0gaWR4IDwgMCA/IGFjdHVhbC5sZW5ndGggKyBpZHggOiBpZHg7XG4gICAgICAgIGlmIChpZHggPCAwIHx8IGlkeCA+PSBhY3R1YWwubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIGlkeCArICcgb3V0IG9mIGJvdW5kcyBmb3Ige3thY3R1YWx9fSc7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtcy5wdXNoKGFjdHVhbFtpZHhdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBlbGVtcy5sZW5ndGggPT09IDEgPyBlbGVtc1swXSA6IGVsZW1zXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBrZXlzOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIG9wZXJhdGUgb24gaXRzIGxpc3Qgb2Ygb3duIGtleXMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBrZXlzJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ua2V5cyhhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgdmFsdWVzOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIG9wZXJhdGUgb24gaXRzIGxpc3Qgb2YgdmFsdWVzJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCB2YWx1ZXMnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy52YWx1ZXMoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc2xpY2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRXh0cmFjdHMgYSBwb3J0aW9uIGZyb20gdGhlIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdzbGljZSgke2FyZ3NbMF19LCAke2FyZ3NbMV0gfHwgMH0pJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBzdGFydCwgZW5kKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8udG9BcnJheShhY3R1YWwpLnNsaWNlKHN0YXJ0LCBlbmQpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBmaWx0ZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlJyxcbiAgICAgICdvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCB0cnV0aHknLFxuICAgICAgJ2Zvci4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlsdGVyJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5maWx0ZXIoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICAvLyBOb3RlOiBcInJlamVjdFwiIGlzIHVzZWQgZm9yIHByb21pc2VzXG4gIC8vIFRPRE86IENvbWUgdXAgd2l0aCBhIGJldHRlciBuYW1lXG4gIHVubGVzczoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGNvbGxlY3Rpb24sIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUnLFxuICAgICAgJ29uIGFuIGFycmF5IHdpdGggYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggdGhlIGNhbGxiYWNrIHJldHVybmVkIGZhbHN5JyxcbiAgICAgICdmb3IgKHRoZSBvcHBvc2l0ZSBvZiAuZmlsdGVyKS4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVqZWN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5yZWplY3QoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHdoZXJlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1BlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIG9mIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24gdG8gdGhlIGdpdmVuJyxcbiAgICAgICdwcm9wZXJ0aWVzIG9iamVjdCwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBvZiBhbGwnLFxuICAgICAgJ2VsZW1lbnRzIHRoYXQgaGF2ZSBlcXVpdmFsZW50IHByb3BlcnR5IHZhbHVlcy4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3Mjd2hlcmUnXG4gICAgXSxcbiAgICBkZXNjOiAnd2hlcmUge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHByb3BzKSB7XG4gICAgICBpZiAoIV8uaXNQbGFpbk9iamVjdChwcm9wcykpIHtcbiAgICAgICAgcmV0dXJuICdwcm9wcyBpcyBub3QgYW4gb2JqZWN0JztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy53aGVyZShhY3R1YWwsIHByb3BzKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWFwOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIGFuIGFycmF5IGhvbGRpbmcgdGhlIHJlc3VsdHMgb2YnLFxuICAgICAgJ2ludm9raW5nIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI21hcCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWFwKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBtZXRob2Q6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gdGhlIHJlc3VsdCBvZiBpbnZva2luZyB0aGUgbmFtZWQnLFxuICAgICAgJ21ldGhvZCBvbiB0aGUgc3ViamVjdCB2YWx1ZS4nLFxuICAgIF0sXG4gICAgZGVzYzogXCJtZXRob2QgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZCwgYXJnKSB7XG4gICAgICBpZiAodHlwZW9mIGFjdHVhbFttZXRob2RdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAnJHthcmcxfSBpcyBub3QgYSBtZXRob2QgaW4ge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMik7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIGFjdHVhbFttZXRob2RdLmFwcGx5KGFjdHVhbCwgYXJncylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGludm9rZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgbWV0aG9kIG5hbWVkIGJ5IHRoZSBhcmd1bWVudCBmb3IgZWFjaCBlbGVtZW50IGluIHRoZScsXG4gICAgICAnY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNpbnZva2UnXG4gICAgXSxcbiAgICBkZXNjOiBcImludm9rZSAuJHthcmcxfSgpXCIsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgbWV0aG9kLCBhcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5pbnZva2UuYXBwbHkoXywgYXJndW1lbnRzKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgcGx1Y2s6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gYmUgdGhlIG9uZSBvZiB0aGUgc3BlY2lmaWMgcHJvcGVydHkgZm9yIGFsbCBlbGVtZW50cycsXG4gICAgICAnaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcGx1Y2snXG4gICAgXSxcbiAgICBkZXNjOiAncGx1Y2soIHt7YXJnMX19ICknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHByb3ApIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5wbHVjayhhY3R1YWwsIHByb3ApXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBmaXJzdDoge1xuICAgIGFsaWFzZXM6IFsgJ2hlYWQnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlyc3QnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGZpcnN0IGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5oZWFkKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBsYXN0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbGFzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5sYXN0KGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICByZXN0OiB7XG4gICAgYWxpYXNlczogWyAndGFpbCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnVE9ETycsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNyZXN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnRhaWwoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWluOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHN1YmplY3QgdG8gYmUgdGhlIG1pbmltdW0gdmFsdWUgZm91bmQgb24gdGhlIGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI21pbidcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5taW4oYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIG1heDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSBzdWJqZWN0IHRvIGJlIHRoZSBtYXhpbXVtIHZhbHVlIGZvdW5kIG9uIHRoZSBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXgnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWF4KGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHNvcnQ6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gYmUgc29ydGVkIGluIGFzY2VuZGluZyBvcmRlci4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3Mjc29ydEJ5J1xuICAgIF0sXG4gICAgZGVzYzogJ3NvcnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAvLyBBbGxvdyB0aGUgdXNlIG9mIGV4cHJlc3Npb25zIGFzIGNhbGxiYWNrc1xuICAgICAgaWYgKGNhbGxiYWNrIGluc3RhbmNlb2YgYXNzLkNoYWluKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sucmVzdWx0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uc29ydEJ5KGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzdG9yZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdIZWxwZXIgdG8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgdmFsdWUgYmVpbmcgZXZhbHVhdGVkIGluIHRoZScsXG4gICAgICAnZXhwcmVzc2lvbiBpbiBzb21lIG90aGVyIG9iamVjdC4gSXQgZXhwZWN0cyBhIHRhcmdldCBvYmplY3QgYW5kIG9wdGlvbmFsbHknLFxuICAgICAgJ3RoZSBuYW1lIG9mIGEgcHJvcGVydHkuIElmIHRhcmdldCBpcyBhIGZ1bmN0aW9uIGl0XFwnbGwgcmVjZWl2ZSB0aGUgdmFsdWUnLFxuICAgICAgJ3VzaW5nIGBwcm9wYCBhcyB0aGlzIGNvbnRleHQuIElmIGBwcm9wYCBpcyBub3QgcHJvdmlkZWQgYW5kIGB0YXJnZXRgIGlzIGFuJyxcbiAgICAgICdhcnJheSB0aGUgdmFsdWUgd2lsbCBiZSBwdXNoZWQgdG8gaXQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3N0b3JlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCB0YXJnZXQsIHByb3ApIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24odGFyZ2V0KSkge1xuICAgICAgICB0YXJnZXQuY2FsbChwcm9wLCBhY3R1YWwpO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKF8uaXNBcnJheSh0YXJnZXQpKSB7XG4gICAgICAgICAgdGFyZ2V0LnB1c2goYWN0dWFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJ3Byb3AgdW5kZWZpbmVkIGFuZCB0YXJnZXQgaXMgbm90IGFuIGFycmF5IG9yIGEgZnVuY3Rpb246IHt7YXJnMX19JztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BdID0gYWN0dWFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICd0YXJnZXQgaXMgbm90IGFuIG9iamVjdDoge3thcmcxfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgbXV0YXRpb246IHtcbiAgICBoZWxwOiBbXG4gICAgICAnT2J0YWlucyB0aGUgbGFzdCBtdXRhdGVkIHZhbHVlIHVzZWQgb24gdGhlIGNoYWluLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgLy8gVE9ETzogVGhpcyB3aWxsIGJyZWFrIGlmIHdlIHJldHVybiB0cnVlL2ZhbHNlIG9yIGEgZnVuY3Rpb25cbiAgICAgIHJldHVybiBhY3R1YWw7XG4gICAgfVxuICB9XG5cbn0pO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG4vLyBIZWxwZXIgZmFjdG9yeSBmb3IgdGhlbmFibGUgY2FsbGJhY2tzXG5mdW5jdGlvbiByZXN1bWUgKHJlc29sdmVyLCByZXN1bHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJlc29sdmVyLnJlc3VtZSh2YWx1ZSwgcmVzdWx0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNQcm9taXNlICh2YWx1ZSkge1xuICB2YXIgdGhlbiA9IHZhbHVlICYmIHZhbHVlLnRoZW47XG4gIHJldHVybiB0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuXG4vLyBQcm9taXNlIHJlbGF0ZWQgbWF0Y2hlcnNcbmFzcy5yZWdpc3Rlcih7XG5cbiAgcHJvbWlzZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdWZXJpZmllcyB0aGF0IHRoZSB2YWx1ZSBpcyBhIHByb21pc2UgKFByb21pc2UvQSspIGJ1dCBkb2VzIG5vdCBhdHRhY2gnLFxuICAgICAgJ3RoZSBleHByZXNzaW9uIHRvIGl0cyByZXNvbHV0aW9uIGxpa2UgYHJlc29sdmVzYCBvciBgcmVqZWN0c2AsIGluc3RlYWQnLFxuICAgICAgJ3RoZSBvcmlnaW5hbCBwcm9taXNlIHZhbHVlIGlzIGtlcHQgYXMgdGhlIHN1YmplY3QgZm9yIHRoZSBmb2xsb3dpbmcnLFxuICAgICAgJ2V4cGVjdGF0aW9ucy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSBwcm9taXNlJyxcbiAgICBmYWlsOiAnZ290ICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gaXNQcm9taXNlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuXG4gIHJlc29sdmVzOiB7XG4gICAgYWxpYXNlczogWyAncmVzb2x2ZScsICdmdWxmaWxsZWQnLCAnZnVsZmlsbCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlJyxcbiAgICAgICdhcHBseWluZyB0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZXNvbHZlZCwnLFxuICAgICAgJ211dGF0aW5nIHRoZSB2YWx1ZSB0byB0aGUgcmVzb2x2ZWQgb25lLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZScsXG4gICAgICAncHJvbWlzZSBpcyBhY3R1YWxseSByZWplY3RlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZXNvbHZlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIHJlamVjdGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEF0dGFjaCB0byB0aGUgcHJvbWlzZSBzbyB3ZSBnZXQgbm90aWZpZWQgd2hlbiBpdCdzIHJlc29sdmVkLlxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIHJlamVjdHM6IHtcbiAgICBhbGlhc2VzOiBbICdyZWplY3RlZCcsICdyZWplY3QnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0F0dGFjaCB0aGUgbWF0Y2hlciB0byBhIHByb21pc2UgdmFsdWUgKFByb21pc2VzL0ErKSB0byBjb250aW51ZSBhcHBseWluZycsXG4gICAgICAndGhlIGNoYWluIG9mIG1hdGNoZXJzIG9uY2UgdGhlIHByb21pc2UgaGFzIGJlZW4gcmVqZWN0ZWQsIG11dGF0aW5nIHRoZScsXG4gICAgICAndmFsdWUgdG8gYmVjb21lIHRoZSByZWplY3RlZCBlcnJvci4nLFxuICAgICAgJ0l0IHdpbGwgZmFpbCBpZiB0aGUgdmFsdWUgaXMgbm90IGEgcHJvbWlzZSAobm8gLnRoZW4gbWV0aG9kKSBvciB0aGUnLFxuICAgICAgJ3Byb21pc2UgaXMgYWN0dWFsbHkgZnVsZmlsbGVkLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhIHJlamVjdGVkIHByb21pc2UnLFxuICAgIGZhaWw6ICd3YXMgZnVsZmlsbGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIGFjdHVhbC50aGVuKFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlcilcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBSaWdodCBub3cgd2UgZG9uJ3Qga25vdyBpZiB0aGUgZXhwcmVzc2lvbiBpcyB2YWxpZFxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG4iLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xuXG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBpdGVyYXRlIGEgdmFsdWUgY3JlYXRpbmcgZm9ya3MgZm9yIGVhY2ggZWxlbWVudCwgaGFuZGxpbmdcbi8vIGFzeW5jIGV4cGVjdGF0aW9ucyBpZiBuZWVkZWQuXG5mdW5jdGlvbiBmb3JrZXIgKHJlc29sdmVyLCBhY3R1YWwsIGl0ZXJhdG9yLCBzdG9wKSB7XG4gIHZhciBicmFuY2hlcyA9IF8uc2l6ZShhY3R1YWwpO1xuICB2YXIgcmVzdWx0ID0gaXRlcmF0b3IoYWN0dWFsLCBmdW5jdGlvbiAodmFsdWUpIHtcblxuICAgIHZhciBmb3JrID0gcmVzb2x2ZXIuZm9yaygpO1xuXG4gICAgdmFyIHBhcnRpYWwgPSBmb3JrKHZhbHVlKTtcblxuICAgIC8vIFN0b3AgaXRlcmF0aW5nIGFzIHNvb24gYXMgcG9zc2libGVcbiAgICBpZiAocGFydGlhbCA9PT0gc3RvcCkge1xuICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgIHJldHVybiBzdG9wO1xuICAgIH1cblxuICAgIGlmIChwYXJ0aWFsID09PSAhc3RvcCkge1xuICAgICAgYnJhbmNoZXMgLT0gMTtcbiAgICAgIGlmICgwID09PSBicmFuY2hlcykge1xuICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgfVxuICAgICAgcmV0dXJuICFzdG9wO1xuICAgIH1cblxuICAgIC8vIEFzeW5jIHN1cHBvcnRcbiAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIGZvcmsncyBmaW5hbCByZXN1bHRcbiAgICBmb3JrLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgLy8gV2UncmUgZG9uZSB0aGUgbW9tZW50IG9uZSBpcyBhIHN0b3AgcmVzdWx0XG4gICAgICBpZiAoZmluYWwgPT09IHN0b3ApIHtcbiAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIHN0b3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJhbmNoZXMgLT0gMTtcbiAgICAgICAgaWYgKDAgPT09IGJyYW5jaGVzKSB7XG4gICAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgIXN0b3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmluYWw7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gIXN0b3A7ICAvLyBrZWVwIGl0ZXJhdGluZ1xuICB9KTtcblxuICAvLyBXaGVuIHRoZSBmb3JrcyBjb21wbGV0ZWQgc3luY2hyb25vdXNseSBqdXN0IGZpbmFsaXplIHRoZSByZXNvbHZlclxuICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZShyZXN1bHQpO1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuXG4vLyBRdWFudGlmaWVyc1xuYXNzLnJlZ2lzdGVyKHtcblxuICBldmVyeToge1xuICAgIGFsaWFzZXM6IFsgJ2FsbCcsICdhbGxPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnYWxsIG9mIHRoZW0gc3VjY2VlZCdcbiAgICBdLFxuICAgIGRlc2M6ICdGb3IgZXZlcnkgb25lOicsXG4gICAgZmFpbDogJ29uZSBkaWRuXFwndCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5ldmVyeSwgZmFsc2UpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgc29tZToge1xuICAgIGFsaWFzZXM6IFsgJ2FueU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdhdCBsZWFzdCBvbmUgb2YgdGhlbSBzdWNjZWVkcyddLFxuICAgIGRlc2M6ICdBdCBsZWFzdCBvbmU6JyxcbiAgICBmYWlsOiAnbm9uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uc29tZSwgdHJ1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBub25lOiB7XG4gICAgYWxpYXNlczogWyAnbm9uZU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdub25lIG9mIHRoZW0gc3VjY2VlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAnTm9uZSBvZiB0aGVtOicsXG4gICAgZmFpbDogJ29uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhcmUgZ29pbmcgdG8gdXNlIHRoZSBzYW1lIGFsZ29yaXRobSBhcyBmb3IgLnNvbWUgYnV0IHdlJ2xsIG5lZ2F0ZVxuICAgICAgICAvLyBpdHMgcmVzdWx0IHVzaW5nIGEgZmluYWxpemVyLlxuICAgICAgICByZXNvbHZlci5maW5hbGl6ZShmdW5jdGlvbiAoZmluYWwpIHtcbiAgICAgICAgICByZXR1cm4gIWZpbmFsO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uc29tZSwgdHJ1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG59KTtcbiIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vLyBVc2UgYSBjYXBwZWQgcG9vbCwgdGhlIHJlbGVhc2luZyBhbGdvcml0aG0gaXMgcHJldHR5IHNvbGlkIHNvIHdlIHNob3VsZFxuLy8gaGF2ZSBhIGdvb2QgcmUtdXNlIHJhdGlvIHdpdGgganVzdCBhIGZldyBpbiB0aGUgcG9vbC4gVGhlbiBpbiBjYXNlXG4vLyBzb21ldGhpbmcgZ29lcyB3cm9uZyB0aGUgR0Mgd2lsbCB0YWtlIGNhcmUgb2YgaXQgYWZ0ZXIgYSB3aGlsZS5cbnZhciBwb29sID0gdXRpbC5DYXBwZWRQb29sKDEwMCk7XG52YXIgY3JlYXRlZCA9IDA7XG5cblxuLy8gSW5zdGFudGlhdGVzIGEgbmV3IHJlc29sdmVyIGZ1bmN0b3JcbmZ1bmN0aW9uIGZhY3RvcnkgKCkge1xuICAvLyBKdXN0IGZvcndhcmRzIHRoZSBjYWxsIHRvIHRoZSByZXNvbHZlciBieSBzZXR0aW5nIGl0c2VsZiBhcyBjb250ZXh0LlxuICBmdW5jdGlvbiBmbiAodmFsdWUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIuY2FsbChmbiwgdmFsdWUpO1xuICB9XG5cbiAgZm4uaWQgPSArK2NyZWF0ZWQ7XG5cbiAgLy8gVGhlIHN0YXRlIGlzIGF0dGFjaGVkIHRvIHRoZSBmdW5jdGlvbiBvYmplY3Qgc28gaXQncyBhdmFpbGFibGUgdG8gdGhlXG4gIC8vIHN0YXRlLWxlc3MgZnVuY3Rpb25zIHdoZW4gcnVubmluZyB1bmRlciBgdGhpcy5gLlxuICBmbi5jaGFpbiA9IG51bGw7XG4gIGZuLnBhcmVudCA9IG51bGw7XG4gIGZuLnBhdXNlZCA9IGZhbHNlO1xuICBmbi5yZXNvbHZlZCA9IFtdO1xuICBmbi5maW5hbGl6ZXJzID0gW107XG5cbiAgLy8gRXhwb3NlIHRoZSBiZWhhdmlvdXIgaW4gdGhlIGZ1bmN0b3JcbiAgZm4ucGF1c2UgPSBwYXVzZTtcbiAgZm4ucmVzdW1lID0gcmVzdW1lO1xuICBmbi5mb3JrID0gZm9yaztcbiAgZm4uam9pbiA9IGpvaW47XG4gIGZuLmZpbmFsaXplID0gZmluYWxpemU7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZuLCAnZXhoYXVzdGVkJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZWQubGVuZ3RoID49IHRoaXMuY2hhaW4uX19leHBlY3RhdGlvbnNfXy5sZW5ndGg7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZm47XG59XG5cbi8vIFRoaXMgaXMgdGhlIGNvcmUgcmVzb2x1dGlvbiBhbGdvcml0aG0sIGl0IG9wZXJhdGVzIG92ZXIgdGhlIGNoYWluXG4vLyBvZiBleHBlY3RhdGlvbnMgY2hlY2tpbmcgdGhlbSBvbmUgYWZ0ZXIgdGhlIG90aGVyIGFnYWluc3QgYSB2YWx1ZS5cbi8vIElmIGEgZnVuY3Rpb24gaXMgcmV0dXJuZWQgaXQnbGwgYmUgaW1tZWRpYXRlbHkgY2FsbGVkIHVzaW5nIHRoZVxuLy8gZXhwZWN0YXRpb24gaW5zdGFuY2UgYXMgY29udGV4dCBhbmQgcGFzc2luZyBhcyBvbmx5IGFyZ3VtZW50IHRoZVxuLy8gY3VycmVudCByZXNvbHZlIGZ1bmN0aW9uLCB0aGlzIGFsbG93cyBhbiBleHBlY3RhdGlvbiB0byBvdmVycmlkZVxuLy8gdGhlIHZhbHVlIGFuZC9vciBjb250cm9sIHRoZSByZXNvbHV0aW9uIHdpdGhvdXQgZXhwb3NpbmcgdG9vIG1hbnlcbi8vIGludGVybmFsIGRldGFpbHMuXG4vLyBXaGVuIGl0IHJldHVybnMgYHVuZGVmaW5lZGAgaXQganVzdCBtZWFucyB0aGF0IHRoZSByZXNvbHV0aW9uIHdhc1xuLy8gcGF1c2VkIChhc3luYyksIHdlIGNhbiBub3Qgb2J0YWluIGEgZmluYWwgcmVzdWx0IHVzaW5nIGEgc3luY2hyb25vdXNcbi8vIGNhbGwuIFRoaXMgY2FuIGJlIHVzZWQgYnkgbWF0Y2hlcnMgd2hlbiB0YWtpbmcgb3ZlciB0aGUgcmVzb2x1dGlvbiB0b1xuLy8ga25vdyBpZiB0aGV5IG5lZWQgdG8gbWFuZ2xlIHRoZSByZXN1bHRzIG9yIHRoZXkgaGF2ZSB0byByZWdpc3RlciBhXG4vLyBmaW5hbGl6ZXIgdG8gYmUgbm90aWZpZWQgb2YgdGhlIGZpbmFsIHJlc3VsdCBmcm9tIHRoZSBjaGFpbi5cbmZ1bmN0aW9uIHJlc29sdmVyICh2YWx1ZSkge1xuICB2YXIgbGlzdCwgb2Zmc2V0LCByZXN1bHQsIGV4cDtcblxuICBsaXN0ID0gdGhpcy5jaGFpbi5fX2V4cGVjdGF0aW9uc19fO1xuICBvZmZzZXQgPSB0aGlzLnJlc29sdmVkLmxlbmd0aDtcbiAgcmVzdWx0ID0gdHJ1ZTtcblxuICBmb3IgKHZhciBpID0gb2Zmc2V0OyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIC8vIENyZWF0ZSBhIG5ldyBvYmplY3QgaW5oZXJpdGluZyBmcm9tIHRoZSBleHBlY3RhdGlvbiBidXQgd2l0aCB0aGVcbiAgICAvLyBjdXJyZW50IGFjdHVhbCB2YWx1ZSBwcm92aXNpb25lZC4gSXQgYWxsb3dzIHRoZSBleHByZXNzaW9uIHRvIG11dGF0ZVxuICAgIC8vIGl0cyBzdGF0ZSBmb3IgdGhpcyBleGVjdXRpb24gYnV0IG5vdCBhZmZlY3Qgb3RoZXIgdXNlcyBvZiBpdC5cbiAgICBleHAgPSB1dGlsLmNyZWF0ZShsaXN0W2ldLCB7IGFjdHVhbDogdmFsdWUgfSk7XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIHJlc29sdmVkIGV4cGVjdGF0aW9uc1xuICAgIHRoaXMucmVzb2x2ZWQucHVzaChleHApO1xuXG4gICAgLy8gRXhlY3V0ZSB0aGUgZXhwZWN0YXRpb24gdG8gb2J0YWluIGl0cyByZXN1bHRcbiAgICByZXN1bHQgPSBleHAucmVzdWx0ID0gZXhwLnJlc29sdmUoKTtcblxuICAgIC8vIEFsbG93IGV4cGVjdGF0aW9ucyB0byB0YWtlIGNvbnRyb2wgZm9yIHRoZSByZW1haW5pbmcgb2YgdGhlIGNoYWluXG4gICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIFNpbmNlIHRoZSBjb250cm9sIGlzIGRlbGVnYXRlZCB0byB0aGUgZXhwcmVzc2lvbiB3ZSBkb24ndCBoYXZlIHRvXG4gICAgICAvLyBkbyBhbnl0aGluZyBtb3JlIGhlcmUuXG4gICAgICByZXR1cm4gZXhwLnJlc3VsdCA9IHJlc3VsdC5jYWxsKGV4cCwgdGhpcyk7XG4gICAgfVxuXG4gICAgLy8gU3RvcCBvbiBmaXJzdCBmYWlsdXJlXG4gICAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgd2UganVzdCBuZWVkIHRvIGFwcGx5IGFueSBwZW5kaW5nIGZpbmFsaXplcnNcbiAgcmV0dXJuIHRoaXMuZmluYWxpemUocmVzdWx0KTtcbn1cblxuXG4vLyBXaGVuIHJlc29sdmluZyBhc3luYyBmbG93cyAoaS5lLjogcHJvbWlzZXMpIHRoaXMgd2lsbCBwYXVzZSB0aGUgZ2l2ZW5cbi8vIHJlc29sdmVyIHVudGlsIGEgY2FsbCB0byAucmVzdW1lKCkgaXMgbWFkZS5cbmZ1bmN0aW9uIHBhdXNlICgpIHtcbiAgaWYgKHRoaXMucGF1c2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHZlciBhbHJlYWR5IHBhdXNlZCcpO1xuICB9XG5cbiAgdGhpcy5wYXVzZWQgPSB0cnVlO1xufVxuXG4vLyBPbmNlIHRoZSBhc3luYyBmbG93IGhhcyBjb21wbGV0ZWQgd2UgY2FuIGNvbnRpbnVlIHJlc29sdmluZyB3aGVyZSB3ZVxuLy8gc3RvcGVkLiBXaGVuIHRoZSBvdmVycmlkZSBwYXJhbSBpcyBub3QgdW5kZWZpbmVkIHdlJ2xsIHNraXAgY2FsbGluZyB0aGVcbi8vIHJlc29sdmVyIGFuZCBhc3N1bWUgdGhhdCBib29sIGFzIHRoZSBmaW5hbCByZXN1bHQuIFRoaXMgYWxsb3dzIHRoZSBhc3luY1xuLy8gY29kZSB0byBzaG9ydGN1dCB0aGUgcmVzb2x2ZXIuXG5mdW5jdGlvbiByZXN1bWUgKGFjdHVhbCwgb3ZlcnJpZGUpIHtcbiAgaWYgKCF0aGlzLnBhdXNlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVzb2x2ZXIgaXMgbm90IGN1cnJlbnRseSBwYXVzZWQnKTtcbiAgfVxuXG4gIHRoaXMucGF1c2VkID0gZmFsc2U7XG5cbiAgLy8gQSBmaW5hbCByZXN1bHQgd2FzIHByb3ZpZGVkIHNvIGp1c3QgZmluYWxpemUgdGhlIHJlc29sdmVyXG4gIGlmIChvdmVycmlkZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuZmluYWxpemUob3ZlcnJpZGUpO1xuICB9XG5cbiAgLy8gTGV0J3MgY29udGludWUgcmVzb2x2aW5nIHdpdGggdGhlIG5ldyB2YWx1ZVxuICAvLyBOb3RlOiB0aGlzKCkgbG9va3Mgd2VpcmQgYnV0IHJlbWVtYmVyIHdlJ3JlIHVzaW5nIGEgZnVuY3Rpb24gYXMgY29udGV4dFxuICByZXR1cm4gdGhpcyhhY3R1YWwpO1xufVxuXG4vLyBDbG9uZXMgdGhlIGN1cnJlbnQgcmVzb2x2ZXIgc28gd2UgY2FuIGZvcmsgYW5kIGRpc2NhcmQgb3BlcmF0aW9ucy5cbmZ1bmN0aW9uIGZvcmsgKCkge1xuICB2YXIgZm9yayA9IGFjcXVpcmUodGhpcy5jaGFpbik7XG4gIGZvcmsucGFyZW50ID0gdGhpcztcbiAgLy8gZm9yay5yZXNvbHZlZCA9IHRoaXMucmVzb2x2ZWQuc2xpY2UoMCk7XG4gIGZvcmsucmVzb2x2ZWQgPSBfLnJlamVjdCh0aGlzLnJlc29sdmVkLCBBcnJheS5pc0FycmF5KTtcbiAgcmV0dXJuIGZvcms7XG59XG5cbi8vIEFzc3VtZSB0aGUgcmVzdWx0cyBmcm9tIGEgZm9yayBpbiB0aGUgbWFpbiByZXNvbHZlclxuZnVuY3Rpb24gam9pbiAoZm9yaykge1xuICB2YXIgbGVuID0gXy5yZWplY3QodGhpcy5yZXNvbHZlZCwgQXJyYXkuaXNBcnJheSkubGVuZ3RoO1xuICB0aGlzLnJlc29sdmVkLnB1c2goXG4gICAgZm9yay5yZXNvbHZlZC5zbGljZShsZW4pXG4gICk7XG59XG5cbi8vIFdoZW4gdGhlIGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24gaXQgZ2V0cyByZWdpc3RlcmVkIGFzIGEgZmluYWxpemVyIGZvciB0aGVcbi8vIHJlc3VsdCBvYnRhaW5lZCBvbmNlIHRoZSBleHByZXNzaW9uIGhhcyBiZWVuIGZ1bGx5IHJlc29sdmVkIChpLmUuIGFzeW5jKS5cbi8vIE90aGVyd2lzZSBpdCdsbCBleGVjdXRlIGFueSByZWdpc3RlcmVkIGZ1bmN0aW9ucyBvbiB0aGUgZ2l2ZW4gcmVzdWx0IGFuZFxuLy8gYWxsb3cgdGhlbSB0byBjaGFuZ2UgaXQgYmVmb3JlIHJlbGVhc2luZyB0aGUgcmVzb2x2ZXIgaW50byB0aGUgcG9vbC5cbmZ1bmN0aW9uIGZpbmFsaXplKHJlc3VsdCkge1xuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMuZmluYWxpemVycy5wdXNoKFxuICAgICAgW3Jlc3VsdCwgXy5sYXN0KHRoaXMucmVzb2x2ZWQpXVxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gTm90aGluZyB5ZXQgdG8gZmluYWxpemUgc2luY2UgdGhlIHJlc3VsdCBpcyBzdGlsbCB1bmtub3duXG4gIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBBbGxvdyBmaW5hbGl6ZXJzIHRvIHRvZ2dsZSB0aGUgcmVzdWx0IChMSUZPIG9yZGVyKVxuICB2YXIgZmluYWxpemVyO1xuICB3aGlsZSAodGhpcy5maW5hbGl6ZXJzLmxlbmd0aCA+IDApIHtcbiAgICBmaW5hbGl6ZXIgPSB0aGlzLmZpbmFsaXplcnMucG9wKCk7XG4gICAgcmVzdWx0ID0gZmluYWxpemVyWzBdLmNhbGwoZmluYWxpemVyWzFdLCByZXN1bHQpO1xuICAgIGZpbmFsaXplclsxXS5yZXN1bHQgPSByZXN1bHQ7XG4gIH1cblxuICAvLyBMZXQgdGhlIGNoYWluIGRpc3BhdGNoIHRoZSBmaW5hbCByZXN1bHQgYnV0IG9ubHkgZm9yIG5vbi1mb3JrZWQgcmVzb2x2ZXJzXG4gIGlmICghdGhpcy5wYXJlbnQpIHtcbiAgICB0aGlzLmNoYWluLmRpc3BhdGNoUmVzdWx0KHRoaXMucmVzb2x2ZWQsIHJlc3VsdCk7XG4gIH1cblxuICAvLyBXaGVuIGEgZmluYWwgcmVzdWx0IGhhcyBiZWVuIG9idGFpbmVkIHJlbGVhc2UgdGhlIHJlc29sdmVyIHRvIHRoZSBwb29sXG4gIHBvb2wucHVzaCh0aGlzKTtcbiAgaWYgKHBvb2wubGVuZ3RoID4gY3JlYXRlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUG9vbCBjb3JydXB0ZWQhIENyZWF0ZWQgJyArIGNyZWF0ZWQgKyAnIGJ1dCB0aGVyZSBhcmUgJyArIHBvb2wubGVuZ3RoICsgJyBwb29sZWQnKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEFjcXVpcmVzIGEgcmVzb2x2ZXIgZnVuY3RvciwgaWYgdGhlcmUgaXMgb25lIGluIHRoZSBwb29sIGl0J2xsIGJlIHJlc2V0IGFuZFxuLy8gcmV1c2VkLCBvdGhlcndpc2UgaXQnbGwgY3JlYXRlIGEgbmV3IG9uZS4gV2hlbiB5b3UncmUgZG9uZSB3aXRoIHRoZSByZXNvbHZlclxuLy8geW91IHNob3VkIGdpdmUgaXQgdG8gYHJlbGVhc2UoKWAgc28gaXQgY2FuIGJlIGluY29ycG9yYXRlZCB0byB0aGUgcG9vbC5cbi8vIFRoZSByZWFzb24gZm9yIHVzaW5nIGEgcG9vbCBvZiBvYmplY3RzIGhlcmUgaXMgdGhhdCBldmVyeSB0aW1lIHdlIGV2YWx1YXRlXG4vLyBhbiBleHByZXNzaW9uIHdlJ2xsIG5lZWQgYSByZXNvbHZlciwgd2hlbiB1c2luZyBxdWFudGlmaWVycyBtdWx0aXBsZSBmb3Jrc1xuLy8gd2lsbCBiZSBjcmVhdGVkLCBzbyBpdCdzIGltcG9ydGFudCB0byBpbXByb3ZlIHRoZSBwZXJmb3JtYW5jZS5cbmZ1bmN0aW9uIGFjcXVpcmUgKGNoYWluKSB7XG4gIHZhciByZXNvbHZlciA9IHBvb2wucG9wKCkgfHwgZmFjdG9yeSgpO1xuXG4gIC8vIFJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgcmVzb2x2ZXJcbiAgcmVzb2x2ZXIuY2hhaW4gPSBjaGFpbjtcbiAgcmVzb2x2ZXIucGFyZW50ID0gbnVsbDtcbiAgcmVzb2x2ZXIucGF1c2VkID0gZmFsc2U7XG4gIHdoaWxlIChyZXNvbHZlci5yZXNvbHZlZC5sZW5ndGggPiAwKSB7XG4gICAgcmVzb2x2ZXIucmVzb2x2ZWQucG9wKCk7XG4gIH1cbiAgd2hpbGUgKHJlc29sdmVyLmZpbmFsaXplcnMubGVuZ3RoID4gMCkge1xuICAgIHJlc29sdmVyLmZpbmFsaXplcnMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzb2x2ZXI7XG59XG5cblxuZXhwb3J0cy5hY3F1aXJlID0gYWNxdWlyZTtcbiIsIi8vIFN1cHBvcnQgZm9yIC5zaG91bGQgc3R5bGUgc3ludGF4LCBub3RpY2UgdGhhdCB3aGlsZSBoZXJlIHJlc2lkZXMgdGhlIGNvcmVcbi8vIGxvZ2ljIGZvciBpdCB0aGUgaW50ZXJmYWNlIGlzIGRvbmUgaW4gYXNzLmpzIGluIG9yZGVyIHRvIG1ha2UgaXQgcmV0dXJuXG4vLyB0aGUgYGFzc2AgZnVuY3Rpb24gYW5kIHByb3ZpZGUgc3VwcG9ydCBmb3IgaXRzIHVzZSBvbiBiZWZvcmVFYWNoL2FmdGVyRWFjaC5cblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xuXG5cbnZhciBERUZBVUxUX1BST1AgPSAnc2hvdWxkJztcblxuLy8gSW5zdGFsbHMgdGhlIHR5cGljYWwgLnNob3VsZCBwcm9wZXJ0eSBvbiB0aGUgcm9vdCBPYmplY3QgcHJvdG90eXBlLlxuLy8gWW91IGNhbiBpbnN0YWxsIHVuZGVyIGFueSBuYW1lIG9mIHlvdXIgY2hvb3NpbmcgYnkgZ2l2aW5nIGl0IGFzIGFyZ3VtZW50LlxuLy9cbi8vIEJhc2ljYWxseSBib3Jyb3dlZCBmcm9tIHRoZSBDaGFpIHByb2plY3Q6XG4vLyAgQ29weXJpZ2h0KGMpIDIwMTEtMjAxNCBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbi8vICBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2NoYWkvYmxvYi9tYXN0ZXIvbGliL2NoYWkvaW50ZXJmYWNlL3Nob3VsZC5qc1xuZnVuY3Rpb24gc2hvdWxkIChuYW1lKSB7XG4gIGlmIChuYW1lID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHNob3VsZC5yZXN0b3JlKCk7XG4gIH1cblxuICBuYW1lID0gbmFtZSB8fCBERUZBVUxUX1BST1A7XG5cbiAgaWYgKG5hbWUgaW4gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIGlmICghKE9iamVjdC5wcm90b3R5cGVbbmFtZV0gaW5zdGFuY2VvZiBDaGFpbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXNzLnNob3VsZDogT2JqZWN0LnByb3RvdHlwZSBhbHJlYWR5IGhhcyBhIC4nICsgbmFtZSArICcgcHJvcGVydHknKTtcbiAgICB9XG4gIH1cblxuICAvLyBtb2RpZnkgT2JqZWN0LnByb3RvdHlwZSB0byBoYXZlIGA8bmFtZT5gXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIENoYWluKSB7XG4gICAgICAgIC8vIEFjdHVhbGx5IENoYWluIGluc3RhbmNlcyBkb24ndCBpbmhlcml0IGZyb20gT2JqZWN0IGJ1dCBzdGlsbFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIFN0cmluZyB8fCB0aGlzIGluc3RhbmNlb2YgTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcy5jb25zdHJ1Y3Rvcih0aGlzKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMgaW5zdGFuY2VvZiBCb29sZWFuKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyA9PSB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQWxsb3c6IGdsb2JhbC5hc3MgPSByZXF1aXJlKCdhc3MnKS5zaG91bGQoKVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgIC8vIEFsbG93IHJlc3RvcmF0aW9uXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgLy8gRXhwb3NlIGl0IGFzIGEgbm8tb3Agb24gQ2hhaW5zIHNpbmNlIHRoZXkgZG9uJ3QgaW5oZXJpdCBmcm9tIE9iamVjdFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2hhaW4ucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSAgLy8gQWxsb3cgcmVzdG9yYXRpb25cbiAgfSk7XG5cbn1cblxuc2hvdWxkLnJlc3RvcmUgPSBmdW5jdGlvbiAobmFtZSkge1xuICBuYW1lID0gbmFtZSB8fCBERUZBVUxUX1BST1A7XG5cbiAgaWYgKG5hbWUgaW4gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlW25hbWVdIGluc3RhbmNlb2YgQ2hhaW4pIHtcbiAgICAgIGRlbGV0ZSBPYmplY3QucHJvdG90eXBlW25hbWVdO1xuICAgICAgZGVsZXRlIENoYWluLnByb3RvdHlwZVtuYW1lXTtcbiAgICB9XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGQ7XG4iLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxuLy8gR2V0IHRoZSBuYXRpdmUgUHJvbWlzZSBvciBhIHNoaW1cbi8vIFRPRE86IENoZWNrIHRoYXQgdGhpcyB3b3JrcyBpbiBhIGJyb3dzZXIgZW52aXJvbm1lbnRcbmV4cG9ydHMuUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlIHx8ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LndpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwud2luZG93IDogbnVsbCkuUHJvbWlzZTtcblxuXG4vLyBDYXBwZWQgcG9vbCB0byBsaW1pdCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBjYW4gYmVcbi8vIHN0b3JlZCAodW5ib3VuZGVkIGJ5IGRlZmF1bHQpLlxuZXhwb3J0cy5DYXBwZWRQb29sID0gZnVuY3Rpb24gKG1heCkge1xuICB2YXIgcG9vbCA9IFtdO1xuXG4gIG1heCA9IG1heCB8fCBOdW1iZXIuTUFYX1ZBTFVFO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwb29sLCAncHVzaCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA8IG1heCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKHRoaXMsIHYpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHBvb2w7XG59O1xuXG5cbnZhciBkb0NvbG9ycyA9IF8ub25jZShmdW5jdGlvbiAoKSB7XG4gIC8vIE1hc3RlciBvdmVycmlkZSB3aXRoIG91ciBjdXN0b20gZW52IHZhcmlhYmxlXG4gIGlmIChwcm9jZXNzLmVudi5BU1NfQ09MT1JTICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gL3RydWV8b258eWVzfGVuYWJsZWQ/fDEvaS50ZXN0KHByb2Nlc3MuZW52LkFTU19DT0xPUlMpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgbW9jaGEgaXMgYXJvdW5kIGFuZCB2ZXJpZnkgYWdhaW5zdCBpdHMgY29uZmlndXJhdGlvblxuICB2YXIgTW9jaGEgPSBnbG9iYWwuTW9jaGE7XG4gIGlmIChNb2NoYSA9PT0gdW5kZWZpbmVkICYmIHJlcXVpcmUucmVzb2x2ZSAmJiByZXF1aXJlLnJlc29sdmUoJ21vY2hhJykpIHtcbiAgICBNb2NoYSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Lk1vY2hhIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5Nb2NoYSA6IG51bGwpO1xuICB9XG4gIGlmIChNb2NoYSAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycyAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycy5CYXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gTW9jaGEucmVwb3J0ZXJzLkJhc2UudXNlQ29sb3JzO1xuICB9XG5cbiAgLy8gUXVlcnkgdGhlIGVudmlyb25tZW50IGFuZCBzZWUgaWYgc29tZSBjb21tb24gdmFyaWFibGVzIGFyZSBzZXRcbiAgaWYgKHByb2Nlc3MuZW52Lk1PQ0hBX0NPTE9SUyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKC8tLWNvbG9yPWFsd2F5cy8udGVzdChwcm9jZXNzLmVudi5HUkVQX09QVElPTlMgfHwgJycpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBGaW5hbGx5IGp1c3QgY2hlY2sgaWYgdGhlIGVudmlyb25tZW50IGlzIGNhcGFibGVcbiAgdmFyIHR0eSA9IHJlcXVpcmUoJ3R0eScpO1xuICByZXR1cm4gdHR5LmlzYXR0eSgxKSAmJiB0dHkuaXNhdHR5KDIpO1xufSk7XG5cblxuLy8gUmVtb3ZlIEFOU0kgZXNjYXBlcyBmcm9tIGEgc3RyaW5nXG5mdW5jdGlvbiB1bmFuc2kgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xceDFiXFxbKFxcZCs7PykrW2Etel0vZ2ksICcnKTtcbn1cblxuXG4vLyBBdm9pZCByZXBlYXRlZCBjb21waWxhdGlvbnMgYnkgbWVtb2l6aW5nXG52YXIgY29tcGlsZVRlbXBsYXRlID0gXy5tZW1vaXplKGZ1bmN0aW9uICh0cGwpIHtcbiAgcmV0dXJuIF8udGVtcGxhdGUodHBsLCBudWxsLCB7XG4gICAgZXNjYXBlOiAvXFx7XFx7KFtcXHNcXFNdKz8pXFx9XFx9L2dcbiAgfSk7XG59KTtcblxuLy8gRHVtcHMgYXJiaXRyYXJ5IHZhbHVlcyBhcyBzdHJpbmdzIGluIGEgY29uY2lzZSB3YXlcbi8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS91dGlscy9vYmpEaXNwbGF5LmpzXG5mdW5jdGlvbiB2YWx1ZUR1bXBlciAodikge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKF8uaXNOdW1iZXIodikgfHwgXy5pc05hTih2KSB8fCBfLmlzQm9vbGVhbih2KSB8fCBfLmlzTnVsbCh2KSB8fCBfLmlzVW5kZWZpbmVkKHYpKSB7XG4gICAgdmFsdWUgPSAnPCcgKyB2ICsgJz4nO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkodik7XG4gIH1cblxuICByZXR1cm4gJ1xcdTAwMWJbMTszNm0nICsgdmFsdWUgKyAnXFx1MDAxYlswbSc7XG59XG5cblxuLy8gQ3VzdG9taXplZCB2ZXJzaW9uIG9mIGxvZGFzaCB0ZW1wbGF0ZVxuZnVuY3Rpb24gdGVtcGxhdGUgKHRwbCwgY29udGV4dCkge1xuICB2YXIgZm4gPSBjb21waWxlVGVtcGxhdGUodHBsKTtcbiAgaWYgKGNvbnRleHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciBvcmlnRXNjYXBlID0gXy5lc2NhcGU7XG4gIHRyeSB7XG4gICAgLy8gT3ZlcnJpZGUgdGhlIGRlZmF1bHQgZXNjYXBlIGZ1bmN0aW9uIHRvIHVzZSBpdCBmb3IgZHVtcGluZyBmb3JtYXR0ZWQgdmFsdWVzXG4gICAgXy5lc2NhcGUgPSB2YWx1ZUR1bXBlcjtcblxuICAgIHJldHVybiBmbihjb250ZXh0KTtcblxuICB9IGZpbmFsbHkge1xuICAgIF8uZXNjYXBlID0gb3JpZ0VzY2FwZTtcbiAgfVxufVxuXG4vLyBBIHNpbXBsZSBmYXN0IGZ1bmN0aW9uIGJpbmRpbmcgcHJpbWl0aXZlIG9ubHkgc3VwcG9ydGluZyBzZXR0aW5nIHRoZSBjb250ZXh0XG5mdW5jdGlvbiBiaW5kKGZuLCB0aGlzQXJnKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXNBcmcsIGFyZ3VtZW50cyk7XG4gIH07XG59XG5cbi8vIFF1aWNrbHkgY3JlYXRlcyBhIG5ldyBvYmplY3Qgd2l0aCBhIGN1c3RvbSBwcm90b3R5cGUgYW5kIHNvbWUgdmFsdWVcbi8vIG92ZXJyaWRlcy5cbmZ1bmN0aW9uIGNyZWF0ZShwcm90bywgdmFsdWVzKSB7XG4gIGlmICgwID09PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBIQUNLOiBVc2UgRnVuY3Rpb24ucHJvdG90eXBlICsgbmV3IGluc3RlYWQgb2YgdGhlIHNsb3ctaXNoIE9iamVjdC5jcmVhdGVcbiAgY3JlYXRlLnByb3RvdHlwZSA9IHByb3RvO1xuICByZXR1cm4gXy5hc3NpZ24obmV3IGNyZWF0ZSwgdmFsdWVzIHx8IHt9KTtcbn1cblxuXG5leHBvcnRzLmJpbmQgPSBiaW5kO1xuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGU7XG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG5leHBvcnRzLnVuYW5zaSA9IHVuYW5zaTtcbmV4cG9ydHMuZG9Db2xvcnMgPSBkb0NvbG9ycztcbiIsIi8vIFJlZ2lzdGVyIHRoZSBkZWZhdWx0IG1hdGNoZXJzXG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9jb3JlJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9jb29yZGluYXRpb24nKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL3F1YW50aWZpZXJzJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9wcm9taXNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvYXNzLmpzJyk7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5NdXRhdGlvbk9ic2VydmVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuTXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICB2YXIgcXVldWUgPSBbXTtcblxuICAgIGlmIChjYW5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgIHZhciBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcXVldWVMaXN0ID0gcXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBxdWV1ZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoaGlkZGVuRGl2LCB7IGF0dHJpYnV0ZXM6IHRydWUgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGhpZGRlbkRpdi5zZXRBdHRyaWJ1dGUoJ3llcycsICdubycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiZXhwb3J0cy5pc2F0dHkgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcblxuZnVuY3Rpb24gUmVhZFN0cmVhbSgpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCd0dHkuUmVhZFN0cmVhbSBpcyBub3QgaW1wbGVtZW50ZWQnKTtcbn1cbmV4cG9ydHMuUmVhZFN0cmVhbSA9IFJlYWRTdHJlYW07XG5cbmZ1bmN0aW9uIFdyaXRlU3RyZWFtKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ3R0eS5SZWFkU3RyZWFtIGlzIG5vdCBpbXBsZW1lbnRlZCcpO1xufVxuZXhwb3J0cy5Xcml0ZVN0cmVhbSA9IFdyaXRlU3RyZWFtO1xuIl19
