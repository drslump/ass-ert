!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ass=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var Chain = require('./chain');
var Matcher = require('./matcher');
var Expectation = require('./expectation');
var util = require('./util');


var defProp = util.bind(Object.defineProperty, Object);


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

ass.ok = function (cond, message) {
  if (arguments.length === 1) {
    message = 'expected a truish value';
  }
  ass.desc(message).truthy.assert(cond, ass.ok);
  return cond;
};

ass.ko = function (cond, message) {
  if (arguments.length === 1) {
    message = 'expected a falsy value';
  }
  ass.desc(message).falsy.assert(cond, ass.ko);
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

  ass.desc(desc || 'ass.marks').eq(expected)
  .assert(ass.marks.counter, ass.marks);
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
      return chain.through;
    },
    enumerable: false
  });

};


module.exports = ass;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./chain":2,"./expectation":4,"./matcher":5,"./util":13}],2:[function(require,module,exports){
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
  if (!Chain.isChain(this)) {
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

Chain.isChain = function (obj) {
  // This looks contrived but instanceof is kind of slow-ish
  return obj && obj.constructor === Chain;
};


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
// Here though we just collect the callbacks, the actual promise resolution
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

  var inst = new AssError(error, ssf || arguments.callee || proto.buildError);
  inst.showDiff = false;
  inst.actual = null;
  inst.expected = null;
  return inst;
};

// Resolves the current chain for a given value. The result is always a
// boolean indicating the outcome or an undefined to signal that it reached
// an asynchronous flow.
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
// The `ssf` stands for StackTraceFunction, a reference to the first function
// to show on the stack trace.
proto.assert = function (actual, ssf) {
  if (arguments.length === 0) {
    actual = this.value;
  }

  // Just ignore if the actual value is not present yet
  // TODO: Shall it produce an error?
  if (actual === this.__GUARD__) return this;

  var resolver = resolvers.acquire(this);
  var result = resolver(actual);

  // It failed so report it with a nice error
  if (result === false) {
    throw this.buildError(resolver.resolved, ssf || this.assert);
  }

  // Convert the expression into a deferred if an async expection was found
  if (result === undefined) {
    this.__deferred__ = true;
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

  if (arguments.length === 0) {
    actual = this.value;
  }

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

  var descs =
    this.__expectations__
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

},{"./error":3,"./resolvers":11,"./util":13}],3:[function(require,module,exports){
// API compatible with https://github.com/chaijs/assertion-error/
// This should make integration with Mocha work, including diffed
// output.

var Failure = require('failure');

var unansi = require('./util').unansi;


var AssError = Failure.create('AssError');
var proto = AssError.prototype;

proto.showDiff = false;
proto.actual = null;
proto.expected = null;

function getTargetLine (frames) {
  function getSrc (frame) {
    var fn = frame.getFunction();
    return fn ? fn.toString().replace(/\s+/g, '') : null;
  }

  // First frame is now the target
  var target = frames[0];
  var targetSrc = getSrc(target);
  if (!targetSrc) {
    return null;
  }

  // Filter out all frames which are not in the same file
  samefile = frames.filter(function (frame) {
    return frame && frame.getFileName() === target.getFileName();
  });

  // Get the closest function in the same file that wraps the target frame
  var wrapper;
  for (var i=1; i < samefile.length; i++) {
    var src = getSrc(samefile[i]);
    if (src && -1 !== src.indexOf(targetSrc)) {
      wrapper = samefile[i];
      break;
    }
  }

  // When a wrapper function is found we can use it to obtain the line we want
  if (wrapper) {
    // Get relative positions
    var relLn = target.getLineNumber() - wrapper.getLineNumber();
    var relCl = target.getLineNumber() === wrapper.getLineNumber()
              ? 0
              : target.getColumnNumber() - 1;

    var lines = target.getFunction().toString().split(/\n/);
    if (lines[relLn]) {
      return lines[relLn];
    }
  }

  return null;
}

proto.toJSON = function (stack) {
  var props = {
    name: this.name,
    message: unansi(this.message),
    actual: this.actual,
    expected: this.expected,
    showDiff: this.showDiff
  };

  // include stack if exists and not turned off
  if (stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

proto.toString = function () {
  var msg = Failure.prototype.toString.call(this);

  var line = getTargetLine(this.frames);
  if (line) {
    msg += '\n  >> ' + line.replace(/^\s+/, '').slice(0, 60) + '\n';
  }

  return msg;
};



module.exports = AssError;

},{"./util":13,"failure":19}],4:[function(require,module,exports){
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
  },
  // Hack: allow it to be overriden on the instance
  set: function (v) {
    Object.defineProperty(this, 'expected', {
      value: v
    });
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

},{"./chain":2,"./matcher":5,"./util":13}],5:[function(require,module,exports){
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
      'Composes a new expectation from two or more expressions, which will only',
      'succeed if all the expressions that form it do indeed succeed.',
      'Note: evaluation will stop as soon as one of the expressions fails.'
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
      'Composes a new expectation from two or more expressions, which will only',
      'succeed if at least one of the expressions does.',
      'Note: evaluation will stop as soon as one of the expressions succeeds.'
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
      'Composes a new expectation from two or more expressions, which will only',
      'succeed if at least one of the expressions does but not all of them.'
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
var util = require('../util');

// Set of default matchers
ass.register({
  // TODO: Move this to the Chain prototype
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
      'preceding expectations are actually being executed.',
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
    help: 'Checks if the value is empty (or has a length of 0).',
    desc: 'is empty',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual == null || actual.length === 0;
    }
  },
  nempty: {
    aliases: [ 'nonEmpty' ],
    help: 'Checks if the value is not empty (or has a length greater than 0).',
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
      return typeof actual.length === 'number' ? actual.length > 0 : true;
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
    aliases: [ 'no', 'NO', 'NOT' ],
    help: 'Negates the result for the rest of the expression.',
    desc: 'Not!',
    fail: 'was {{ actual }}',
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
      if (ass.Chain.isChain(expected)) {
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

  match: {
    help: [
      'Tries to match the subject against the expected value which can be either',
      'a function, an ass expression, an object with a .test() function (for ',
      'instance a RegExp) or a plain object to partially match against the value.'
    ],
    desc: 'to match {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {

      if (typeof expected.test === 'function') {
        return !!expected.test(actual);
      }

      if (_.isPlainObject(expected)) {
        // Hack: use lodash .where filtering to perform the match
        var result = _.where([actual], expected);
        return 1 === result.length;
      }

      if (typeof expected !== 'function') {
        return 'expected is not a function and does not have a .test method';
      }

      return !!expected(actual);
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

  close: {
    aliases: [ 'closeTo' ],
    help: [
      'Checks if the value is close to the expected based on a given delta.',
      'The default delta is 0.1 so the value 3.55 is close to any value between',
      '3.45 and 3.65 (both inclusive).',
      'String values are also supported by computing the distance between them',
      'using the Sift4 algorithm. For string values the delta is interpreted as',
      'a percentage (ie: 0.25 is 25%).'
    ],
    desc: 'to be close to {{ expected }}',
    fail: 'was {{ actual }}',
    test: function (actual, expected, delta) {
      delta = delta == null ? 0.1 : delta;

      // Support strings by computing their distance
      if (_.isString(actual) && _.isString(expected)) {
        var diff = util.sift4(actual, expected, 3) / Math.max(actual.length, expected.length);
        return diff <= delta;
      }

      return actual >= expected - delta && actual <= expected + delta;
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
      return actual === null;
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
    test: function (actual, arg1 /*, ... */) {

      // allow multiple expected values
      this.expected = _.toArray(arguments).slice(1);

      if (!_.isString(actual) && !_.isArray(actual) && !_.isObject(actual)) {
        return 'got {{actual}}';
      }

      return _.every(this.expected, function (expected) {
        if (_.isString(actual) && _.isString(expected)) {
          return -1 !== actual.indexOf(expected);
        }

        if (_.isArray(actual)) {
          // TODO: Isn't there an easier way to test this using lodash only?
          if (!ass.Chain.isChain(expected)) {
            expected = ass.eq(expected);
          }
          return -1 !== _.findIndex(actual, expected);
        }

        // Hack: Compare objects with .where by filtering a wrapper array
        return 1 === _.where([actual], expected).length;
      });
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
      var result = util.template.call(actual, tpl, actual);
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
      'expression will fork to operate on the returned value.',
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
  notify: {
    help: [
      'Similar to .tap() but it won\'t pass the current value as argument,',
      'instead it will be provided as the `this` context when performing the',
      'call. This allows it to be used with test runners `done` style callbacks.',
      'Note that it will neither mutate the value even if it returns something.'
    ],
    desc: 'notify {{arg1}}',
    test: function (actual, fn) {
      fn.call(actual);
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
        return 'was not found in keys {{ keys }}';
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
    desc: 'slice({{actual}}, ${arg1 || 0})',
    test: function (actual, start, end) {
      return this.mutate(
        _.toArray(actual).slice(start, end)
      );
    }
  },

  filter: {
    help: [
      'Iterates over elements of the collection, forking the expectation to',
      'operate on an array with all the elements for which the callback returned',
      'truthy for.',
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
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../ass":1,"../util":13}],8:[function(require,module,exports){
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
    aliases: [ 'resolved', 'fulfilled', 'fulfill', 'eventually' ],
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
            // When the equality succeeds just keep resolving
            var result = _.isEqual(value, expected) ? undefined : false;
            resolver.resume(value, result);
          },
          resume(resolver, false)
        );

        return undefined;
      };
    }
  },

  rejects: {
    aliases: [ 'rejected' ],
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
var Chain = require('./chain');
var util = require('./util');


var checkChain = new Chain();


exports.lodash = function (_) {
  // Exit if already patched
  if (_.createCallback(checkChain) === checkChain.test) {
    return _;
  }

  // Override lodash's default createCallback mechanism to make it understand
  // about our expression chains.
  _.createCallback = _.wrap(_.createCallback, function(orig, callback, thisArg) {
    if (Chain.isChain(callback)) {
      return callback.test;
    }

    // Support _.where style. It's not as fast as the original one since we
    // have to go via _.isEqual instead of using the internal function
    if (_.isPlainObject(callback)) {
      var props = _.keys(callback);
      return function (object) {
        if (object == null) return false;
        var result = false, length = props.length, key;
        while (length--) {
          key = props[length];
          // Fail when the key is not even present
          if (!(key in object)) {
              result = false;
              break;
          }
          result = _.isEqual(object[key], callback[key]);
          if (!result) break;
        }
        return result;
      };
    }

    return orig(callback, thisArg);
  });

  // Override lodash's default isEqual implementation so it understands
  // about expression chains.
  function cmp (a, b) {
    return Chain.isChain(a) ? a.test(b) : Chain.isChain(b) ? b.test(a) : undefined;
  }
  _.isEqual = _.wrap(_.isEqual, function (orig, a, b, callback, thisArg) {
    var result = callback ? callback.call(thisArg || this, a, b) : undefined;
    if (result === undefined) {
      result = orig(a, b, cmp, thisArg);
    }
    return result;
  });

  return _;
};


exports.sinon = function (sinon) {
  // Exit if already patched
  if (sinon.match.isMatcher(checkChain)) {
    return sinon;
  }

  // Override Sinon's .isMatcher implementation to allow our expressions to be
  // transparently supported by it.
  var oldIsMatcher = util.bind(sinon.match.isMatcher, sinon.match);
  sinon.match.isMatcher = function (obj) {
    return Chain.isChain(obj) || oldIsMatcher(obj);
  };

  return sinon;
};

},{"./chain":2,"./util":13}],11:[function(require,module,exports){
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
  var list, result, exp;

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

},{"./util":13}],12:[function(require,module,exports){
// Support for .should style syntax, notice that while here resides the core
// logic for it, the interface is done in ass.js in order to make it return
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
    if (!Chain.isChain(Object.prototype[name])) {
      throw new Error('ass.should: Object.prototype already has a .' + name + ' property');
    }
    return;
  }

  // modify Object.prototype to have `<name>`
  Object.defineProperty(Object.prototype, name, {
    get: function () {
      if (Chain.isChain(this)) {
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
    if (Chain.isChain(Object.prototype[name])) {
      delete Object.prototype[name];
      delete Chain.prototype[name];
    }
  }
};


module.exports = should;

},{"./chain":2}],13:[function(require,module,exports){
(function (process,global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

// Get the native Promise or a shim
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
  } else if (_.isFunction(v)) {
    if (v.displayName) {
      value = v.displayName + '()';
    } else if (v.name) {
      value = v.name + '()';
    } else {
      value = 'function' + v.name;
    }
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


// From http://siderite.blogspot.com/2014/11/super-fast-and-accurate-string-distance.html
function sift4(s1, s2, maxOffset) {
  if (!s1 || !s1.length) {
    if (!s2) {
      return 0;
    }
    return s2.length;
  }

  if (!s2 || !s2.length) {
    return s1.length;
  }

  var l1 = s1.length;
  var l2 = s2.length;

  var c1 = 0;  // cursor for string 1
  var c2 = 0;  // cursor for string 2
  var lcss = 0;  // largest common subsequence
  var local_cs = 0; // local common substring

  while ((c1 < l1) && (c2 < l2)) {
    if (s1.charAt(c1) == s2.charAt(c2)) {
      local_cs++;
    } else {
      lcss += local_cs;
      local_cs = 0;
      if (c1 != c2) {
        c1 = c2 = Math.max(c1,c2); // using max to bypass the need for computer transpositions ('ab' vs 'ba')
      }
      for (var i = 0; i < maxOffset; i++) {
        if ((c1 + i < l1) && (s1.charAt(c1 + i) === s2.charAt(c2))) {
          c1 += i;
          local_cs++;
          break;
        }
        if ((c2 + i < l2) && (s1.charAt(c1) === s2.charAt(c2 + i))) {
          c2 += i;
          local_cs++;
          break;
        }
      }
    }
    c1++;
    c2++;
  }
  lcss += local_cs;
  return Math.round(Math.max(l1, l2) - lcss);
}

exports.bind = bind;
exports.create = create;
exports.template = template;
exports.unansi = unansi;
exports.doColors = doColors;
exports.sift4 = sift4;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":16,"tty":15}],14:[function(require,module,exports){
(function (global){
var ass = require('./lib/ass');
var Chain = require('./lib/chain');
var AssError = require('./lib/error');
var should = require('./lib/should');
var patches = require('./lib/patches');

// Register the default matchers
require('./lib/matchers/core');
require('./lib/matchers/coordination');
require('./lib/matchers/quantifiers');
require('./lib/matchers/promise');


// Bundle some of the internal stuff with the ass function
ass.Chain = Chain;
ass.Error = AssError;
ass.patches = patches;

// Forward the should installer
// Note: make them arity-0 to allow beforeEach(ass.should) in Mocha
ass.should = function (/* name */) {
  should(arguments.length > 0 ? arguments[0] : undefined);
  return ass;
};
ass.should.restore = function (/* name */) {
  should.restore(arguments.length > 0 ? arguments[0] : undefined);
  return ass;
};


// Patch third party libraries to understand about ass-ert expressions. We
// depend on patching lodash for the library to work correctly, however the
// rest are optional.
patches.lodash((typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null));

if (global.sinon && global.sinon.match) {
  patches.sinon(global.sinon);
} else if (require.resolve && require.resolve('sinon')) {
  patches.sinon((typeof window !== "undefined" ? window.sinon : typeof global !== "undefined" ? global.sinon : null));
}


module.exports = ass;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./lib/ass":1,"./lib/chain":2,"./lib/error":3,"./lib/matchers/coordination":6,"./lib/matchers/core":7,"./lib/matchers/promise":8,"./lib/matchers/quantifiers":9,"./lib/patches":10,"./lib/should":12}],15:[function(require,module,exports){

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
// Emulates V8's CallSite object from a stacktrace.js frame object

function CallSite (frame) {
  if (!(this instanceof CallSite)) {
    return new CallSite(frame);
  }
  this.frame = frame;
};

CallSite.prototype = Object.create({
  getLineNumber: function () {
    return this.frame.lineNumber;
  },
  getColumnNumber: function () {
    return this.frame.columnNumber;
  },
  getFileName: function () {
    return this.frame.fileName;
  },
  getFunction: function () {
    return this.frame.function;
  },
  getThis: function () {
    return null;
  },
  getTypeName: function () {
    return null;
  },
  getMethodName: function () {
    if (this.frame.functionName) {
      return this.frame.functionName.split('.').pop();
    }
    return null;
  },
  getFunctionName: function () {
    return this.frame.functionName;
  },
  getEvalOrigin: function () {
    return null;
  },
  isToplevel: function () {
    return false; // TODO
  },
  isEval: function () {
    return false; // TODO
  },
  isNative: function () {
    return false; // TODO
  },
  isConstructor: function () {
    return /^new(\s|$)/.test(this.frame.functionName);
  },
  toString: function () {
    var name = this.getFunctionName() || '<anonymous>';
    var loc = this.getFileName() + ':' + this.getLineNumber() + ':' + this.getColumnNumber()
    return name + ' (' + loc + ')';
  }
});


module.exports = CallSite;

},{}],18:[function(require,module,exports){
(function (process,global){
var ErrorStackParser = require('error-stack-parser');
var CallSite = require('./call-site');

// Keep a reference to the builtin error constructor
var NativeError = Error;


function Failure (message, sff) {
  if (!(this instanceof Failure)) {
    return new Failure(message, sff || Failure);
  }

  this.sff = sff || this.constructor;

  this.message = message;

  // Generate a getter for the frames, this ensures that we do as little work
  // as possible when instantiating the error, deferring the expensive stack
  // mangling operations until the .stack property is actually requested.
  this._getFrames = makeFramesGetter(this.sff);

  // On ES5 engines we use one-time getters to actually defer the expensive
  // operations (defined in the prototype for performance reasons) while legacy
  // engines will simply do all the work up front.
  if (typeof Object.defineProperty !== 'function') {
    this.frames = unwind(this._getFrames());
    this._getFrames(true);
    this._getFrames = null;
    this.stack = this.generateStackTrace();
  }

  return this;
}

// Set FRAME_EMPTY to null to disable any sort of separator
Failure.FRAME_EMPTY = '  ----------------------------------------';
Failure.FRAME_PREFIX = '  at ';

// By default we enable tracking for async stack traces
Failure.TRACK = true;


// Helper to obtain the current stack trace
var getErrorWithStack = function () {
  return new NativeError;
};
// Some engines do not generate the .stack property until it's thrown
if (!getErrorWithStack().stack) {
  getErrorWithStack = function () {
    try { throw new NativeError } catch (e) { return e };
  };
}

// Trim frames under the provided stack first function
function trim(frames, sff) {
  var fn, name = sff.name;
  for (var i=0; i < frames.length; i++) {
    fn = frames[i].getFunction();
    if (fn && fn === sff || name && name === frames[i].getFunctionName()) {
      return frames.slice(i + 1);
    }
  }
  return frames;
}

function unwind (frames) {
  var result = [];

  for (var i=0, fn; i < frames.length; i++) {
    fn = frames[i].getFunction();

    if (!fn || !fn['failure:ignore']) {
      result.push(frames[i]);
    }

    if (fn && fn['failure:frames']) {
      if (Failure.FRAME_EMPTY) {
        result.push(null);
      }

      // Call the getter and keep a reference to the result in case we have to
      // unwind the same function another time.
      // TODO: Make sure keeping a reference to the frames doesn't create leaks
      if (typeof fn['failure:frames'] === 'function') {
        var getter = fn['failure:frames'];
        fn['failure:frames'] = null;
        fn['failure:frames'] = getter();
      }

      result.push.apply(result, unwind(fn['failure:frames']));
      break;
    }
  }

  return result;
}

// Receiver for the frames in a .stack property from captureStackTrace
var V8FRAMES = {};

// V8 code path for generating a frames getter
function makeFramesGetterV8 (sff) {
  NativeError.captureStackTrace(V8FRAMES, sff || makeFramesGetterV8);
  sff = null;
  var frames = V8FRAMES.stack;
  V8FRAMES.stack = null;  // IMPORTANT: This is needed to avoid leaks!!!
  return function (cleanup) {
    var result = frames;
    // Clean up closure variables to help GC
    frames = null;
    return result;
  };
}

// non-V8 code path for generating a frames getter
function makeFramesGetterCompat (sff) {
  // Obtain a stack trace at the current point
  var error = getErrorWithStack();

  // Walk the caller chain to annotate the stack with function references
  // Given the limitations imposed by ES5 "strict mode" it's not possible
  // to obtain references to functions beyond one that is defined in strict
  // mode. Also note that any kind of recursion will make the walker unable
  // to go past it.
  var caller = arguments.callee;
  var functions = [getErrorWithStack];
  for (var i=0; caller && i < 10; i++) {
    functions.push(caller);
    if (caller.caller === caller) break;
    caller = caller.caller;
  }
  caller = null;

  return function (cleanup) {
    var frames = null;

    if (!cleanup) {
      // Parse the stack trace
      frames = ErrorStackParser.parse(error);
      // Attach function references to the frames (skipping the maker frames)
      // and creating CallSite objects for each one.
      for (var i=2; i < frames.length; i++) {
        frames[i].function = functions[i];
        frames[i] = new CallSite(frames[i]);
      }

      frames = trim(frames.slice(2), sff);
    }

    // Clean up closure variables to help GC
    sff = null;
    error = null;
    functions = null;

    return frames;
  };
}

// Generates a getter for the call site frames
// TODO: If we observe leaks with complex use cases (due to closure scopes)
//       we can generate here our compat CallSite objects storing the function's
//       source code instead of an actual reference to them, that should help
//       the GC since we'll be just keeping literals around.
var makeFramesGetter = typeof NativeError.captureStackTrace === 'function'
                     ? makeFramesGetterV8
                     : makeFramesGetterCompat;


// Override V8 stack trace builder to inject our logic
var oldPrepareStackTrace = Error.prepareStackTrace;
Error.prepareStackTrace = function (error, frames) {
  // When called from makeFramesGetter we just want to obtain the frames
  if (error === V8FRAMES) {
    return frames;
  }

  // Forward to any previously defined behaviour
  if (oldPrepareStackTrace) {
    return oldPrepareStackTrace.call(Error, error, frames);
  }

  // Emulate default behaviour (with long-traces)
  return Failure.prototype.prepareStackTrace.call(error, unwind(frames));
};

// Attach a new exclusion predicate for frames
function exclude (ctor, predicate) {
  var fn = predicate;

  if (typeof predicate === 'string') {
    fn = function (frame) {
      return -1 !== frame.getFileName().indexOf(predicate);
    };
  } else if (typeof predicate.test === 'function') {
    fn = function (frame) {
      return predicate.test(frame.getFileName());
    };
  }

  ctor.excludes.push(fn);
}

// Expose the filter in the root Failure type
Failure.excludes = [];
Failure.exclude = function Failure_exclude (predicate) {
  exclude(Failure, predicate);
};

// Attach a frames getter to the function so we can re-construct async stacks.
//
// Note that this just augments the function with the new property, it doesn't
// create a wrapper every time it's called, so using it multiple times on the
// same function will indeed overwrite the previous tracking information. This
// is intended since it's faster and more importantly doesn't break some APIs
// using callback references to unregister them for instance.
// When you want to use the same function with different tracking information
// just use Failure.wrap().
//
// The tracking can be globally disabled by setting Failure.TRACK to false
Failure.track = function Failure_track (fn, sff) {
  if (typeof fn !== 'function') {
    return fn;
  }

  // Clean up previous frames to help the GC
  if (typeof fn['failure:frames'] === 'function') {
    fn['failure:frames'](true);
  }

  if (Failure.TRACK) {
    fn['failure:frames'] = null;
    fn['failure:frames'] = makeFramesGetter(sff || Failure_track);
  }

  return fn;
};

// Wraps the function before annotating it with tracking information, this
// allows to track multiple schedullings of a single function.
Failure.wrap = function Failure_wrap (fn) {
  var wrapper = Failure.ignore(function () {
    return fn.apply(this, arguments);
  });

  return Failure.track(wrapper, Failure_wrap);
};

// Mark a function to be ignored when generating stack traces
Failure.ignore = function Failure_ignore (fn) {
  fn['failure:ignore'] = true;
  return fn;
};

Failure.setTimeout = function Failure_setTimeout () {
  arguments[0] = Failure.track(arguments[0], Failure_setTimeout);
  return setTimeout.apply(null, arguments);
};

Failure.nextTick = function Failure_nextTick () {
  arguments[0] = Failure.track(arguments[0], Failure_nextTick);
  return process.nextTick.apply(process, arguments);
};

Failure.patch = function Failure_patch(obj, name, idx) {
  if (obj && typeof obj[name] !== 'function') {
    throw new Error('Object does not have a "' + name + '" method');
  }

  var original = obj[name];

  // When the exact argument index is provided use an optimized code path
  if (typeof idx === 'number') {

    obj[name] = function () {
      arguments[idx] = Failure.track(arguments[idx], obj[name]);
      return original.apply(this, arguments);
    };

  // Otherwise detect the functions to track at invokation time
  } else {

    obj[name] = function () {
      for (var i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'function') {
          arguments[i] = Failure.track(arguments[i], obj[name]);
        }
      }
      return original.apply(this, arguments);
    };

  }

  // Augment the wrapper with any properties from the original
  for (var k in original) if (original.hasOwnProperty(k)) {
    obj[name][k] = original[k];
  }

  return obj[name];
};

// Helper to create new Failure types
Failure.create = function (name, props) {
  if (typeof name !== 'string') {
    throw new Failure('Expected a name as first argument');
  }

  function ctor (message, sff) {
    if (!(this instanceof Failure)) {
      return new ctor(message, sff);
    }
    Failure.apply(this, arguments);
  }

  // Augment constructor
  ctor.excludes = [];
  ctor.exclude = function (predicate) {
    exclude(ctor, predicate);
  };

  ctor.prototype = Object.create(Failure.prototype);
  ctor.prototype.constructor = ctor;
  ctor.prototype.name = name;
  if (typeof props === 'function') {
    ctor.prototype.prepareStackTrace = props;
  } else if (props) {
    Object.keys(props).forEach(function (prop) {
      ctor.prototype[prop] = prop;
    });
  }
  return ctor;
};

var builtinErrorTypes = [
  'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError',
  'EvalError', 'URIError', 'InternalError'
];
var builtinErrors = {};

Failure.install = function () {
  var root = typeof window === 'object' ? window : global;

  builtinErrorTypes.forEach(function (type) {
    if (root[type] && !builtinErrors[type]) {
      builtinErrors[type] = root[type];
      root[type] = Failure.create(type);
    }
  });

  // Allow usage: var Failure = require('failure').install()
  return Failure;
};

Failure.uninstall = function () {
  builtinErrorTypes.forEach(function (type) {
    root[type] = builtinErrors[type] || root[type];
  });
};


var proto = Failure.prototype = Object.create(Error.prototype);
proto.constructor = Failure;

proto.name = 'Failure';
proto.message = '';

if (typeof Object.defineProperty === 'function') {
  Object.defineProperty(proto, 'frames', {
    get: function () {
      // Use trimming just in case the sff was defined after constructing
      var frames = unwind(trim(this._getFrames(), this.sff));

      // Cache next accesses to the property
      Object.defineProperty(this, 'frames', {
        value: frames,
        writable: true
      });

      // Clean up the getter closure
      this._getFrames = null;

      return frames;
    }
  });

  Object.defineProperty(proto, 'stack', {
    get: function () {
      return this.generateStackTrace();
    }
  });
}

proto.generateStackTrace = function () {
  var excludes = this.constructor.excludes;
  var include, frames = [];

  // Specific prototypes inherit the excludes from Failure
  if (excludes !== Failure.excludes) {
    excludes.push.apply(excludes, Failure.excludes);
  }

  // Apply filtering
  for (var i=0; i < this.frames.length; i++) {
    include = true;
    if (this.frames[i]) {
      for (var j=0; include && j < excludes.length; j++) {
        include &= !excludes[j].call(this, this.frames[i]);
      }
    }
    if (include) {
      frames.push(this.frames[i]);
    }
  }

  return this.prepareStackTrace(frames);
};

proto.prepareStackTrace = function (frames) {
  var lines = [this];
  for (var i=0; i < frames.length; i++) {
    lines.push(
      frames[i] ? Failure.FRAME_PREFIX + frames[i] : Failure.FRAME_EMPTY
    );
  }
  return lines.join('\n');
};


module.exports = Failure;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./call-site":17,"_process":16,"error-stack-parser":20}],19:[function(require,module,exports){
var Failure = require('./lib/failure');

module.exports = Failure;

},{"./lib/failure":18}],20:[function(require,module,exports){
(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
    if (typeof define === 'function' && define.amd) {
        define('error-stack-parser', ['stackframe'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('stackframe'));
    } else {
        root.ErrorStackParser = factory(root.StackFrame);
    }
}(this, function ErrorStackParser(StackFrame) {
    'use strict';

    // ES5 Polyfills
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
    if (!Array.prototype.map) {
        Array.prototype.map = function(callback, thisArg) {
            var O = Object(this);
            var len = O.length >>> 0;
            var T;
            if (arguments.length > 1) {
                T = thisArg;
            }

            var A = new Array(len);
            var k = 0;

            while (k < len) {
                var kValue, mappedValue;
                if (k in O) {
                    kValue = O[k];
                    mappedValue = callback.call(T, kValue, k, O);
                    A[k] = mappedValue;
                }
                k++;
            }

            return A;
        };
    }

    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
    if (!Array.prototype.filter) {
        Array.prototype.filter = function(callback/*, thisArg*/) {
            var t = Object(this);
            var len = t.length >>> 0;

            var res = [];
            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i];
                    if (callback.call(thisArg, val, i, t)) {
                        res.push(val);
                    }
                }
            }

            return res;
        };
    }

    var FIREFOX_SAFARI_STACK_REGEXP = /\S+\:\d+/;
    var CHROME_IE_STACK_REGEXP = /\s+at /;

    return {
        /**
         * Given an Error object, extract the most information from it.
         * @param error {Error}
         * @return Array[StackFrame]
         */
        parse: function ErrorStackParser$$parse(error) {
            if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
                return this.parseOpera(error);
            } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
                return this.parseV8OrIE(error);
            } else if (error.stack && error.stack.match(FIREFOX_SAFARI_STACK_REGEXP)) {
                return this.parseFFOrSafari(error);
            } else {
                throw new Error('Cannot parse given Error object');
            }
        },

        /**
         * Separate line and column numbers from a URL-like string.
         * @param urlLike String
         * @return Array[String]
         */
        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
            var locationParts = urlLike.split(':');
            var lastNumber = locationParts.pop();
            var possibleNumber = locationParts[locationParts.length - 1];
            if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
                var lineNumber = locationParts.pop();
                return [locationParts.join(':'), lineNumber, lastNumber];
            } else {
                return [locationParts.join(':'), lastNumber, undefined];
            }
        },

        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
            return error.stack.split('\n').slice(1).map(function (line) {
                var tokens = line.replace(/^\s+/, '').split(/\s+/).slice(1);
                var locationParts = this.extractLocation(tokens.pop().replace(/[\(\)\s]/g, ''));
                var functionName = (!tokens[0] || tokens[0] === 'Anonymous') ? undefined : tokens[0];
                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2]);
            }, this);
        },

        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
            return error.stack.split('\n').filter(function (line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP);
            }, this).map(function (line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionName = tokens.shift() || undefined;
                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2]);
            }, this);
        },

        parseOpera: function ErrorStackParser$$parseOpera(e) {
            if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
                e.message.split('\n').length > e.stacktrace.split('\n').length)) {
                return this.parseOpera9(e);
            } else if (!e.stack) {
                return this.parseOpera10(e);
            } else {
                return this.parseOpera11(e);
            }
        },

        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
            var lines = e.message.split('\n');
            var result = [];

            for (var i = 2, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame(undefined, undefined, match[2], match[1]));
                }
            }

            return result;
        },

        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
            var lines = e.stacktrace.split('\n');
            var result = [];

            for (var i = 0, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1]));
                }
            }

            return result;
        },

        // Opera 10.65+ Error.stack very similar to FF/Safari
        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
            return error.stack.split('\n').filter(function (line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) &&
                    !line.match(/^Error created at/);
            }, this).map(function (line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionCall = (tokens.shift() || '');
                var functionName = functionCall
                        .replace(/<anonymous function(: (\w+))?>/, '$2')
                        .replace(/\([^\)]*\)/g, '') || undefined;
                var argsRaw;
                if (functionCall.match(/\(([^\)]*)\)/)) {
                    argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
                }
                var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ? undefined : argsRaw.split(',');
                return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2]);
            }, this);
        }
    };
}));


},{"stackframe":21}],21:[function(require,module,exports){
(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.StackFrame = factory();
    }
}(this, function () {
    'use strict';
    function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function StackFrame(functionName, args, fileName, lineNumber, columnNumber) {
        if (functionName !== undefined) {
            this.setFunctionName(functionName);
        }
        if (args !== undefined) {
            this.setArgs(args);
        }
        if (fileName !== undefined) {
            this.setFileName(fileName);
        }
        if (lineNumber !== undefined) {
            this.setLineNumber(lineNumber);
        }
        if (columnNumber !== undefined) {
            this.setColumnNumber(columnNumber);
        }
    }

    StackFrame.prototype = {
        getFunctionName: function () {
            return this.functionName;
        },
        setFunctionName: function (v) {
            this.functionName = String(v);
        },

        getArgs: function () {
            return this.args;
        },
        setArgs: function (v) {
            if (Object.prototype.toString.call(v) !== '[object Array]') {
                throw new TypeError('Args must be an Array');
            }
            this.args = v;
        },

        // NOTE: Property name may be misleading as it includes the path,
        // but it somewhat mirrors V8's JavaScriptStackTraceApi
        // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
        getFileName: function () {
            return this.fileName;
        },
        setFileName: function (v) {
            this.fileName = String(v);
        },

        getLineNumber: function () {
            return this.lineNumber;
        },
        setLineNumber: function (v) {
            if (!_isNumber(v)) {
                throw new TypeError('Line Number must be a Number');
            }
            this.lineNumber = Number(v);
        },

        getColumnNumber: function () {
            return this.columnNumber;
        },
        setColumnNumber: function (v) {
            if (!_isNumber(v)) {
                throw new TypeError('Column Number must be a Number');
            }
            this.columnNumber = Number(v);
        },

        toString: function() {
            var functionName = this.getFunctionName() || '{anonymous}';
            var args = '(' + (this.getArgs() || []).join(',') + ')';
            var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
            var lineNumber = _isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
            var columnNumber = _isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
            return functionName + args + fileName + lineNumber + columnNumber;
        }
    };

    return StackFrame;
}));

},{}]},{},[14])(14)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2Vycm9yLmpzIiwibGliL2V4cGVjdGF0aW9uLmpzIiwibGliL21hdGNoZXIuanMiLCJsaWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uLmpzIiwibGliL21hdGNoZXJzL2NvcmUuanMiLCJsaWIvbWF0Y2hlcnMvcHJvbWlzZS5qcyIsImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyIsImxpYi9wYXRjaGVzLmpzIiwibGliL3Jlc29sdmVycy5qcyIsImxpYi9zaG91bGQuanMiLCJsaWIvdXRpbC5qcyIsIm1haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9jYWxsLXNpdGUuanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9saWIvZmFpbHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL21haW4uanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9ub2RlX21vZHVsZXMvZXJyb3Itc3RhY2stcGFyc2VyL2Vycm9yLXN0YWNrLXBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL25vZGVfbW9kdWxlcy9lcnJvci1zdGFjay1wYXJzZXIvbm9kZV9tb2R1bGVzL3N0YWNrZnJhbWUvc3RhY2tmcmFtZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3gzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzQ0E7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNWFBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciBNYXRjaGVyID0gcmVxdWlyZSgnLi9tYXRjaGVyJyk7XG52YXIgRXhwZWN0YXRpb24gPSByZXF1aXJlKCcuL2V4cGVjdGF0aW9uJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5cbnZhciBkZWZQcm9wID0gdXRpbC5iaW5kKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgT2JqZWN0KTtcblxuXG4vLyBQdWJsaWMgaW50ZXJmYWNlXG5mdW5jdGlvbiBhc3MgKHZhbHVlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBDaGFpbigpO1xuICB9XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpO1xufVxuXG4vLyBEZWZlcnJlZCBmYWN0b3J5XG5hc3MuXyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gbmV3IENoYWluKHZhbHVlKS5fO1xufTtcblxuLy8gR2xvYmFsIHJlZ2lzdHJ5IG9mIG1hdGNoZXJzICh1c2VkIGZvciBhc3MuaGVscClcbmFzcy5tYXRjaGVycyA9IFtdO1xuXG4vLyBhc3MuaGVscCBkdW1wcyB0aGUgaGVscCBvZiBlYWNoIG1hdGNoZXIgcmVnaXN0ZXJlZFxuZGVmUHJvcChhc3MsICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcyA9ICcnO1xuICAgIF8uZm9yRWFjaChhc3MubWF0Y2hlcnMsIGZ1bmN0aW9uIChtYXRjaGVyKSB7XG4gICAgICAvLyBUT0RPOiBUaGlzIGNhbiBiZSBuaWNlclxuICAgICAgdmFyIGZuID0gbWF0Y2hlci50ZXN0LnRvU3RyaW5nKCk7XG4gICAgICB2YXIgYXJncyA9IGZuLnJlcGxhY2UoL15mdW5jdGlvblxccypcXCgoW15cXCldKilcXClbXFxTXFxzXSovLCAnJDEnKTtcbiAgICAgIGFyZ3MgPSBhcmdzLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnRyaW0oKTsgfSk7XG4gICAgICBhcmdzLnNoaWZ0KCk7XG4gICAgICBmbiA9IGFyZ3MubGVuZ3RoID8gJyAoJyArIGFyZ3Muam9pbignLCAnKSArICcpJyA6ICcnO1xuXG4gICAgICBzICs9ICc+IC4nICsgbWF0Y2hlci5uYW1lICsgZm4gKyAnXFxuXFxuJztcbiAgICAgIHMgKz0gJyAgJyArIG1hdGNoZXIuaGVscC5yZXBsYWNlKC9cXG4vZywgJ1xcbiAgJyk7XG4gICAgICBzICs9ICdcXG5cXG4nO1xuICAgIH0pO1xuICAgIHJldHVybiBzO1xuICB9XG59KTtcblxuYXNzLm9rID0gZnVuY3Rpb24gKGNvbmQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBtZXNzYWdlID0gJ2V4cGVjdGVkIGEgdHJ1aXNoIHZhbHVlJztcbiAgfVxuICBhc3MuZGVzYyhtZXNzYWdlKS50cnV0aHkuYXNzZXJ0KGNvbmQsIGFzcy5vayk7XG4gIHJldHVybiBjb25kO1xufTtcblxuYXNzLmtvID0gZnVuY3Rpb24gKGNvbmQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBtZXNzYWdlID0gJ2V4cGVjdGVkIGEgZmFsc3kgdmFsdWUnO1xuICB9XG4gIGFzcy5kZXNjKG1lc3NhZ2UpLmZhbHN5LmFzc2VydChjb25kLCBhc3Mua28pO1xuICByZXR1cm4gY29uZDtcbn07XG5cbi8vIFJlc2V0cyBvciB2ZXJpZmllcyB0aGUgbnVtYmVyIG9mIG1hcmtzIHNvIGZhclxuLy8gRm9yY2VkIGFyaXR5LTAgdG8gYmUgY29tcGF0aWJsZSB3aXRoOiBiZWZvcmVFYWNoKGFzcy5tYXJrcylcbmFzcy5tYXJrcyA9IGZ1bmN0aW9uICgvKiBleHBlY3RlZCwgZGVzYyAqLykge1xuICB2YXIgZXhwZWN0ZWQgPSBhcmd1bWVudHNbMF07XG4gIHZhciBkZXNjID0gYXJndW1lbnRzWzFdO1xuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAndW5kZWZpbmVkJykge1xuICAgIGV4cGVjdGVkID0gYXNzLm1hcmtzLmNvdW50ZXI7XG4gICAgYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuICAgIHJldHVybiBleHBlY3RlZDsgIC8vIHJldHVybiBiYWNrIGhvdyBtYW55IHRoZXJlIHdlcmVcbiAgfVxuXG4gIGFzcy5kZXNjKGRlc2MgfHwgJ2Fzcy5tYXJrcycpLmVxKGV4cGVjdGVkKVxuICAuYXNzZXJ0KGFzcy5tYXJrcy5jb3VudGVyLCBhc3MubWFya3MpO1xufTtcbmFzcy5tYXJrcy5jb3VudGVyID0gMDtcblxuXG4vLyBIZWxwZXIgdG8gcmVnaXN0ZXIgbmV3IG1hdGNoZXJzIGluIHRoZSByZWdpc3RyeVxuYXNzLnJlZ2lzdGVyID0gZnVuY3Rpb24gKG5hbWUsIG1hdGNoZXIpIHtcbiAgaWYgKG5hbWUgaW5zdGFuY2VvZiBNYXRjaGVyKSB7XG4gICAgbWF0Y2hlciA9IG5hbWU7XG4gICAgbmFtZSA9IG1hdGNoZXIubmFtZTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICBPYmplY3Qua2V5cyhuYW1lKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGFzcy5yZWdpc3RlcihrZXksIG5hbWVba2V5XSk7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgeyAgLy8gQXNzdW1lIGEgZGVzY3JpcHRvciB3YXMgZ2l2ZW5cbiAgICAvLyBDcmVhdGUgdGhlIGFsaWFzZXMgZmlyc3RcbiAgICBfLmZvckVhY2gobWF0Y2hlci5hbGlhc2VzLCBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgIGFzcy5yZWdpc3RlcihuZXcgTWF0Y2hlcihhbGlhcywgbWF0Y2hlcikpO1xuICAgIH0pO1xuXG4gICAgbWF0Y2hlciA9IG5ldyBNYXRjaGVyKG5hbWUsIG1hdGNoZXIpO1xuICB9XG5cbiAgLy8gS2VlcCB0aGUgbWF0Y2hlciBhcm91bmQgZm9yIGFzcy5oZWxwXG4gIGFzcy5tYXRjaGVycy5wdXNoKG1hdGNoZXIpO1xuXG5cbiAgLy8gVE9ETzogQWxsb3cgbWF0Y2hlcnMgdG8gYmUgb3ZlcnJpZGRlbiBhbmQgYWxzbyBvdmVybG9hZGVkXG4gIC8vICAgICAgIGlmIHRoZXkgaGF2ZSBhbiBcIm92ZXJsb2FkXCIgbWV0aG9kIGl0IGNhbiBiZSB1c2VkXG4gIC8vICAgICAgIHRvIGNoZWNrIHdoaWNoIG9uZSBzaG91bGQgYmUgdXNlZC5cbiAgLy8gICAgICAgQmV0dGVyIElkZWEgKEkgdGhpbmspLCBpbnN0ZWFkIG9mIG92ZXJsb2FkaW5nIGJhc2VkXG4gIC8vICAgICAgIG9uIHRoZSB2YWx1ZSB1bmRlciB0ZXN0LCB3aGljaCBtYXkgcHJvZHVjZSBpc3N1ZXNcbiAgLy8gICAgICAgc2luY2Ugd2UgZG9uJ3Qga25vdyBmb3Igc3VyZSB3aGF0IHRoYXQgdmFsdWUgaXMsXG4gIC8vICAgICAgIGFsbG93IG1hdGNoZXJzIHRvIGludHJvZHVjZSBhIG5ldyBcInByb3RvdHlwZVwiIGZvclxuICAvLyAgICAgICB0aGUgY2hhaW4sIHRoYXQgaXMsIGEgLmRvbSBtYXRjaGVyIHdpbGwgaW5jbHVkZVxuICAvLyAgICAgICBhbGwgdGhlIGNvcmUgZXhwZWN0YXRpb25zIGJ1dCB0aGVuIGFsc28gb3ZlcnJpZGVzXG4gIC8vICAgICAgIGFuZCBuZXcgb25lcyB1bnRpbCB0aGUgZW5kIG9mIHRoZSBjaGFpbi5cblxuXG4gIC8vIE1hdGNoZXIgZnVuY3Rpb25zIHdpdGggYSBzaW5nbGUgYXJndW1lbnQgYXJlIGdldHRlcnNcbiAgdmFyIGZuS2V5ID0gbWF0Y2hlci5hcml0eSA9PT0gMSA/ICdnZXQnIDogJ3ZhbHVlJztcbiAgdmFyIHByb3AgPSB7XG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH07XG4gIGlmIChmbktleSA9PT0gJ3ZhbHVlJykge1xuICAgIHByb3Aud3JpdGFibGUgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIEF1Z21lbnQgdGhlIENoYWluIHByb3RvdHlwZVxuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uIGZuICgpIHtcbiAgICB2YXIgZXhwID0gbmV3IEV4cGVjdGF0aW9uKG1hdGNoZXIsIGFyZ3VtZW50cyk7XG4gICAgdGhpcy5fX2V4cGVjdGF0aW9uc19fLnB1c2goZXhwKTtcbiAgICBpZiAoIXRoaXMuX19kZWZlcnJlZF9fKSB7XG4gICAgICB0aGlzLmFzc2VydCh0aGlzLnZhbHVlLCBmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIGRlZlByb3AoQ2hhaW4ucHJvdG90eXBlLCBuYW1lLCBwcm9wKTtcblxuICAvLyBBdWdtZW50IHRoZSBzdGF0aWMgaW50ZXJmYWNlXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGFpbiA9IG5ldyBDaGFpbigpO1xuXG4gICAgaWYgKGZuS2V5ID09PSAnZ2V0Jykge1xuICAgICAgcmV0dXJuIGNoYWluW25hbWVdO1xuICAgIH1cblxuICAgIHJldHVybiBjaGFpbltuYW1lXS5hcHBseShjaGFpbiwgYXJndW1lbnRzKTtcbiAgfTtcblxuICBkZWZQcm9wKGFzcywgbmFtZSwgcHJvcCk7XG5cbiAgLy8gUGFzcyB0aHJvdWdoIGZvciBjaGFpbnNcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiBwYXNzdGhyb3VnaCgpIHtcbiAgICByZXR1cm4gdGhpc1tuYW1lXS5hc3NlcnQodGhpcy52YWx1ZSwgcGFzc3Rocm91Z2gpLnZhbHVlT2YoKTtcbiAgfTtcbiAgcHJvcC5lbnVtZXJhYmxlID0gZmFsc2U7XG4gIGRlZlByb3AoQ2hhaW4ucHJvdG90eXBlLCAnJCcgKyBuYW1lLCBwcm9wKTtcblxuICAvLyBQYXNzIHRocm91Z2ggc3RhdGljIGNvbnN0cnVjdG9yXG4gIGRlZlByb3AoYXNzLCAnJCcgKyBuYW1lLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKGZuS2V5ID09PSAnZ2V0Jykge1xuICAgICAgICByZXR1cm4gYXNzKHZhbHVlKVsnJCcgKyBuYW1lXTtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIGEgbmV3IGV4cHJlc3Npb24gZm9yIHRoZSBleHBlY3RhdGlvblxuICAgICAgdmFyIGNoYWluID0gbmV3IENoYWluKCk7XG4gICAgICBjaGFpbltuYW1lXS5hcHBseShjaGFpbiwgYXJndW1lbnRzKTtcbiAgICAgIC8vIFJldHVybiBhIGNhbGxhYmxlIHRoYXQgYXNzZXJ0cyB1cG9uIHJlY2VpdmluZyBhIHZhbHVlXG4gICAgICByZXR1cm4gY2hhaW4udGhyb3VnaDtcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IGZhbHNlXG4gIH0pO1xuXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gYXNzO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciByZXNvbHZlcnMgPSByZXF1aXJlKCcuL3Jlc29sdmVycycpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBQcm9taXNlID0gdXRpbC5Qcm9taXNlO1xuXG52YXIgZGVmUHJvcCA9IHV0aWwuYmluZChPYmplY3QuZGVmaW5lUHJvcGVydHksIE9iamVjdCk7XG5cbi8vIEFuIGV4cGVjdGF0aW9ucyBjaGFpbiAoYWthIGV4cHJlc3Npb24pLCB0aGUgY29yZSBvYmplY3Qgb2YgdGhlIGxpYnJhcnksXG4vLyBhbGxvd3MgdG8gc2V0dXAgYSBzZXQgb2YgZXhwZWN0YXRpb25zIHRvIGJlIHJ1biBhdCBhbnkgcG9pbnQgYWdhaW5zdCBhXG4vLyB2YWx1ZS5cbmZ1bmN0aW9uIENoYWluICh2YWx1ZSkge1xuICBpZiAoIUNoYWluLmlzQ2hhaW4odGhpcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FzcyBDaGFpbiBjb25zdHJ1Y3RvciBjYWxsZWQgd2l0aG91dCBuZXchJyk7XG4gIH1cblxuICAvLyBUT0RPOiBPbiBub24gaW5pdGlhbGl6ZWQgY2hhaW5zIHdlIGNhbid0IGRvIC52YWx1ZSwgaXQgc2hvdWxkXG4gIC8vICAgICAgIGJlIGEgZXhwZWN0YXRpb24gdGhhdCBnZXRzIHRoZSBpbml0aWFsIHZhbHVlIGdpdmVuIHdoZW5cbiAgLy8gICAgICAgcmVzb2x2aW5nIChzbywgaXQgc2hvdWxkIGJlIHN0b3JlZCBvbiB0aGUgcmVzb2x2ZXIpXG4gIHRoaXMudmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IHZhbHVlIDogdGhpcy5fX0dVQVJEX187XG5cbiAgLy8gQ3VzdG9tIGRlc2NyaXB0aW9uXG4gIGRlZlByb3AodGhpcywgJ19fZGVzY3JpcHRpb25fXycsIHtcbiAgICB2YWx1ZTogJycsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBMaXN0IG9mIFsgRXhwZWN0YXRpb24gXVxuICBkZWZQcm9wKHRoaXMsICdfX2V4cGVjdGF0aW9uc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBXaGVuIHRydWUgdGhlIGV4cHJlc3Npb24gaXMgY29uc2lkZXJlZCBkZWZlcnJlZCBhbmQgd29uJ3RcbiAgLy8gdHJ5IHRvIGltbWVkaWF0ZWx5IGV2YWx1YXRlIGFueSBuZXdseSBjaGFpbmVkIGV4cGVjdGF0aW9uLlxuICBkZWZQcm9wKHRoaXMsICdfX2RlZmVycmVkX18nLCB7XG4gICAgdmFsdWU6IHRoaXMudmFsdWUgPT09IHRoaXMuX19HVUFSRF9fLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gSG9sZHMgdGhlIGxpc3Qgb2YgcHJvbWlzZSBjYWxsYmFja3MgYXR0YWNoZWQgdG8gdGhlIGV4cHJlc3Npb25cbiAgZGVmUHJvcCh0aGlzLCAnX190aGVuc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBTZWFsIHRoZSBjb250ZXh0IHRvIHRoZSBtZXRob2RzIHNvIHdlIGNhbiBjYWxsIHRoZW0gYXMgcGxhaW4gZnVuY3Rpb25zXG4gIHRoaXMudGVzdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUudGVzdCwgdGhpcyk7XG4gIHRoaXMuYXNzZXJ0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS5hc3NlcnQsIHRoaXMpO1xuICB0aGlzLnJlc3VsdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUucmVzdWx0LCB0aGlzKTtcbiAgdGhpcy50aHJvdWdoID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS50aHJvdWdoLCB0aGlzKTtcbiAgdGhpcy4kID0gdGhpcy50aHJvdWdoO1xufVxuXG5DaGFpbi5pc0NoYWluID0gZnVuY3Rpb24gKG9iaikge1xuICAvLyBUaGlzIGxvb2tzIGNvbnRyaXZlZCBidXQgaW5zdGFuY2VvZiBpcyBraW5kIG9mIHNsb3ctaXNoXG4gIHJldHVybiBvYmogJiYgb2JqLmNvbnN0cnVjdG9yID09PSBDaGFpbjtcbn07XG5cblxudmFyIHByb3RvID0gQ2hhaW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gQ2hhaW47XG5cbi8vIEd1YXJkIHRva2VuIHRvIGRldGVjdCB2YWx1ZWxlc3MgbWF0Y2hlcnNcbnByb3RvLl9fR1VBUkRfXyA9IHtcbiAgdmFsdWVPZjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd7e3ZhbHVlbGVzc319JztcbiAgfVxufTtcblxuLy8gU3VwcG9ydHMgdGhlIHVzYWdlOiBhc3Muc3RyaW5nLmhlbHBcbmRlZlByb3AocHJvdG8sICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPOiBQcm9kdWN0aXplIHRoaXMgYW5kIHBlcmhhcHMgc2hvdyBoZWxwIGZvciB0aGUgd2hvbGUgY2hhaW5cbiAgICB2YXIgdGFpbCA9IF8udGFpbCh0aGlzLl9fZXhwZWN0YXRpb25zX18pO1xuICAgIHJldHVybiB0YWlsID8gdGFpbC5oZWxwIDogJ04vQSc7XG4gIH1cbn0pO1xuXG4vLyBTdXBwb3J0IHVzZSBjYXNlOiBhc3ModmFsdWUpLl8uc29tZS5udW1iZXIuYWJvdmUoNSkuX1xuZGVmUHJvcChwcm90bywgJ18nLCB7XG4gIGdldDogZnVuY3Rpb24gZm4oKSB7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5fX2RlZmVycmVkX18gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IGZhbHNlO1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufSk7XG5cblxuLy8gRXhwb3NlcyBhIFByb21pc2UvQSBpbnRlcmZhY2UgZm9yIHRoZSBleHByZXNzaW9uLCB0aGUgaW50ZW5kZWQgdXNlIGlzIGZvclxuLy8gb2J0YWluaW5nIHRoZSByZXN1bHQgZm9yIGFzeW5jaHJvbm91cyBleHByZXNzaW9ucy5cbi8vIEhlcmUgdGhvdWdoIHdlIGp1c3QgY29sbGVjdCB0aGUgY2FsbGJhY2tzLCB0aGUgYWN0dWFsIHByb21pc2UgcmVzb2x1dGlvblxuLy8gaXMgZG9uZSBpbiB0aGUgcmVzb2x2ZXIgd2hlbiBpdCByZWFjaGVzIGEgcmVzdWx0LlxucHJvdG8udGhlbiA9IGZ1bmN0aW9uIChjYiwgZWIpIHtcbiAgLy8gUmVnaXN0ZXIgdGhlIGNhbGxiYWNrcyB0byBiZSB1c2VkIHdoZW4gcmVzb2x2ZWRcbiAgdGhpcy5fX3RoZW5zX18ucHVzaChbY2IsIGViXSk7XG5cbiAgLy8gV2hlbiB0aGUgZXhwcmVzc2lvbiBpcyBub24gZGVmZXJyZWQgYW5kIHdlIGhhdmUgYSB2YWx1ZSB3ZSBmb3JjZSB0aGVcbiAgLy8gcmVzb2x2ZXIgdG8gcnVuIGluIG9yZGVyIHRvIHJlc29sdmUgdGhlIHByb21pc2UgYXQgbGVhc3Qgb25jZS5cbiAgLy8gVGhpcyBpcyBwcmltYXJpbHkgdG8gc3VwcG9ydCB0aGUgdGVzdCBydW5uZXJzIHVzZSBjYXNlIHdoZXJlIGFuIGV4cHJlc3Npb25cbiAgLy8gaXMgcmV0dXJuZWQgZnJvbSB0aGUgdGVzdCBhbmQgdGhlIHJ1bm5lciB3aWxsIGF0dGFjaCBpdHNlbGYgaGVyZS5cbiAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXyAmJiB0aGlzLnZhbHVlICE9PSB0aGlzLl9fR1VBUkRfXykge1xuICAgIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICAgIHJlc29sdmVyKHRoaXMudmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5jYXRjaCA9IGZ1bmN0aW9uIChlYikge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIGViKTtcbn07XG5cbi8vIERpc3BhdGNoIGV2ZXJ5b25lIHdobyB3YXMgd2FpdGluZyB0byBiZSBub3RpZmllZCBvZiB0aGUgb3V0Y29tZVxucHJvdG8uZGlzcGF0Y2hSZXN1bHQgPSBmdW5jdGlvbiAocmVzb2x2ZWQsIHJlc3VsdCkge1xuICBpZiAoMCA9PT0gdGhpcy5fX3RoZW5zX18ubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR2VuZXJhdGUgYSBuaWNlIGVycm9yIGZvciB0aGUgZmFpbHVyZVxuICB2YXIgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICBhY3R1YWwgPSB0aGlzLmJ1aWxkRXJyb3IocmVzb2x2ZWQsIHByb3RvLmRpc3BhdGNoUmVzdWx0KTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb21pc2UgdGhhdCByZWplY3RzIGltbWVkaWF0ZWx5IHdpdGggYSBmYWlsdXJlIGVycm9yIG9yXG4gIC8vIHJlc29sdmVzIHdpdGggdGhlIGV4cHJlc3Npb24gc3ViamVjdC5cbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gQ2FsbGluZyByZXNvbHZlKCkgd2l0aCBhIHByb21pc2Ugd2lsbCBhdHRhY2ggaXRzZWxmIHRvIHRoZSBwcm9taXNlXG4gICAgLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGl0IGFzIGEgc2ltcGxlIHZhbHVlLiBUbyBhdm9pZCB0aGF0IHdlIGRldGVjdCB0aGVcbiAgICAvLyBjYXNlIGFuZCB3cmFwIGl0IGluIGFuIGFycmF5LlxuICAgIGlmIChhY3R1YWwgJiYgdHlwZW9mIGFjdHVhbC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhY3R1YWwgPSBbXG4gICAgICAgICdBc3M6IFZhbHVlIHdyYXBwZWQgaW4gYW4gYXJyYXkgc2luY2UgaXQgbG9va3MgbGlrZSBhIFByb21pc2UnLFxuICAgICAgICBhY3R1YWxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgKHJlc3VsdCA/IHJlc29sdmUgOiByZWplY3QpKCBhY3R1YWwgKTtcbiAgfSk7XG5cbiAgLy8gQXR0YWNoIGFsbCB0aGUgcmVnaXN0ZXJlZCB0aGVucyB0byB0aGUgcHJvbWlzZSBzbyB0aGV5IGdldCBub3RpZmllZFxuICBfLmZvckVhY2godGhpcy5fX3RoZW5zX18sIGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuLmFwcGx5KHByb21pc2UsIGNhbGxiYWNrcyk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZHVtcENoYWluIChyZXNvbHZlZCwgaW5kZW50KSB7XG4gIHZhciByZXN1bHQgPSAnJztcblxuICBpbmRlbnQgPSBpbmRlbnQgfHwgJyc7XG5cbiAgcmVzb2x2ZWQuZm9yRWFjaChmdW5jdGlvbiAoZXhwLCBpZHgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShleHApKSB7XG4gICAgICByZXN1bHQgKz0gZHVtcENoYWluKGV4cCwgaW5kZW50ICsgJyAgJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV4cC5yZXN1bHQpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzJtUGFzc2VkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzFtRmFpbGVkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgIGlmIChpZHggPT09IHJlc29sdmVkLmxlbmd0aCAtIDEpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMG0gJyArIGV4cC5mYWlsdXJlICsgJ1xcbic7XG4gICAgfVxuXG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuLy8gQnVpbGRzIGFuIEFzc0Vycm9yIGZvciB0aGUgY3VycmVudCBleHByZXNzaW9uLiBJdCBtYWtlcyBhIGNvdXBsZSBvZlxuLy8gYXNzdW1wdGlvbnMsIGZvciBpbnN0YW5jZSB0aGUgLl9fb2Zmc2V0X18gbXVzdCBiZSBwbGFjZWQganVzdCBhZnRlciB0aGVcbi8vIGV4cGVjdGF0aW9uIHRoYXQgcHJvZHVjZWQgdGhlIGZhaWx1cmUgb2YgdGhlIGNoYWluLlxucHJvdG8uYnVpbGRFcnJvciA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgc3NmKSB7XG5cbiAgdmFyIGVycm9yID0gdGhpcy5fX2Rlc2NyaXB0aW9uX18gKyAnXFxuXFxuJztcblxuICBleHAgPSByZXNvbHZlZFsgcmVzb2x2ZWQubGVuZ3RoIC0gMSBdO1xuICBlcnJvciArPSBkdW1wQ2hhaW4ocmVzb2x2ZWQpO1xuXG4gIGlmICghdXRpbC5kb0NvbG9ycygpKSB7XG4gICAgZXJyb3IgPSB1dGlsLnVuYW5zaShlcnJvcik7XG4gIH1cblxuICAvLyBUT0RPOiBzaG93RGlmZiBzaG91bGQgYmUgdXNlZCBvbmx5IHdoZW4gaXQgbWFrZXMgc2Vuc2UgcGVyaGFwc1xuICAvLyAgICAgICB3ZSBjYW4gcGFzcyBudWxsL3VuZGVmaW5lZCBhbmQgbGV0IEFzc0Vycm9yIGRldGVjdCB3aGVuIGl0XG4gIC8vICAgICAgIG1ha2VzIHNlbnNlLlxuXG4gIHZhciBleHBlY3RlZCA9IGV4cC5leHBlY3RlZDtcbiAgLy8gTW9jaGEgd2lsbCB0cnkgdG8ganNvbmlmeSB0aGUgZXhwZWN0ZWQgdmFsdWUsIGp1c3QgaWdub3JlIGlmIGl0J3MgYSBmdW5jdGlvblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdmFyIGluc3QgPSBuZXcgQXNzRXJyb3IoZXJyb3IsIHNzZiB8fCBhcmd1bWVudHMuY2FsbGVlIHx8IHByb3RvLmJ1aWxkRXJyb3IpO1xuICBpbnN0LnNob3dEaWZmID0gZmFsc2U7XG4gIGluc3QuYWN0dWFsID0gbnVsbDtcbiAgaW5zdC5leHBlY3RlZCA9IG51bGw7XG4gIHJldHVybiBpbnN0O1xufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIFRoZSByZXN1bHQgaXMgYWx3YXlzIGFcbi8vIGJvb2xlYW4gaW5kaWNhdGluZyB0aGUgb3V0Y29tZSBvciBhbiB1bmRlZmluZWQgdG8gc2lnbmFsIHRoYXQgaXQgcmVhY2hlZFxuLy8gYW4gYXN5bmNocm9ub3VzIGZsb3cuXG5wcm90by50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBSZXNvbHZlIHRoZSBjaGFpbiBzdGFydGluZyBmcm9tIHJvb3RcbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyBQZXJmb3JtcyB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhaW4gYnV0IGFkZGl0aW9uYWxseSB3aWxsIHJhaXNlIGFuIGVycm9yXG4vLyBpZiBpdCBmYWlscyB0byBjb21wbGV0ZS4gV2hlbiB0aGUgZXhwcmVzc2lvbiByZXNvbHZlcyBhcyB1bmRlZmluZWQgKGFzeW5jKVxuLy8gaXQnbGwgYmUgYXV0b21hdGljYWxseSBlbmFibGUgaXRzIGRlZmVycmVkIGZsYWcuXG4vLyBUaGUgYHNzZmAgc3RhbmRzIGZvciBTdGFja1RyYWNlRnVuY3Rpb24sIGEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBmdW5jdGlvblxuLy8gdG8gc2hvdyBvbiB0aGUgc3RhY2sgdHJhY2UuXG5wcm90by5hc3NlcnQgPSBmdW5jdGlvbiAoYWN0dWFsLCBzc2YpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgLy8gSnVzdCBpZ25vcmUgaWYgdGhlIGFjdHVhbCB2YWx1ZSBpcyBub3QgcHJlc2VudCB5ZXRcbiAgLy8gVE9ETzogU2hhbGwgaXQgcHJvZHVjZSBhbiBlcnJvcj9cbiAgaWYgKGFjdHVhbCA9PT0gdGhpcy5fX0dVQVJEX18pIHJldHVybiB0aGlzO1xuXG4gIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICB2YXIgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcblxuICAvLyBJdCBmYWlsZWQgc28gcmVwb3J0IGl0IHdpdGggYSBuaWNlIGVycm9yXG4gIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgdGhpcy5idWlsZEVycm9yKHJlc29sdmVyLnJlc29sdmVkLCBzc2YgfHwgdGhpcy5hc3NlcnQpO1xuICB9XG5cbiAgLy8gQ29udmVydCB0aGUgZXhwcmVzc2lvbiBpbnRvIGEgZGVmZXJyZWQgaWYgYW4gYXN5bmMgZXhwZWN0aW9uIHdhcyBmb3VuZFxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIEFzc2VydHMgdGhlIHByb3ZpZGVkIHZhbHVlIGFuZCBpZiBzdWNjZXNzZnVsIHJldHVybnMgdGhlIG9yaWdpbmFsXG4vLyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBjaGFpbiBpbnN0YW5jZS5cbnByb3RvLnRocm91Z2ggPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHRoaXMuYXNzZXJ0KGFjdHVhbCwgcHJvdG8udGhyb3VnaCk7XG4gIHJldHVybiBhY3R1YWw7XG59O1xuXG4vLyBFdmFsdWF0ZXMgdGhlIGV4cHJlc3Npb24gY2hhaW4gcmVwb3J0aW5nIHRoZSBsYXN0IG11dGF0ZWQgdmFsdWUgc2VlbiBpblxuLy8gaXQuIElmIHRoZSBleHByZXNzaW9uIGRvZXMgbm90IGNvbXBsZXRlIGl0J2xsIHJldHVybiB1bmRlZmluZWQuXG5wcm90by5yZXN1bHQgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHZhciByZXN1bHQ7XG5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB0aGlzLnRhcChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgIH0pLnRlc3QoYWN0dWFsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBSZW1vdmUgdGhlIC50YXAgZnJvbSB0aGUgY2hhaW5cbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fX2Rlc2NyaXB0aW9uX18pIHtcbiAgICByZXR1cm4gdGhpcy5fX2Rlc2NyaXB0aW9uX187XG4gIH1cblxuICB2YXIgZGVzY3MgPVxuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfX1xuICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZGVzY3JpcHRpb24gfSlcbiAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmRlc2NyaXB0aW9uIH0pO1xuXG4gIGlmIChkZXNjcy5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuICcoJyArIGRlc2NzLmpvaW4oJywgJykgKyAnKSc7XG4gIH0gZWxzZSBpZiAoZGVzY3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGRlc2NzWzBdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnPEFzc0NoYWluPic7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDaGFpbjtcbiIsIi8vIEFQSSBjb21wYXRpYmxlIHdpdGggaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9hc3NlcnRpb24tZXJyb3IvXG4vLyBUaGlzIHNob3VsZCBtYWtlIGludGVncmF0aW9uIHdpdGggTW9jaGEgd29yaywgaW5jbHVkaW5nIGRpZmZlZFxuLy8gb3V0cHV0LlxuXG52YXIgRmFpbHVyZSA9IHJlcXVpcmUoJ2ZhaWx1cmUnKTtcblxudmFyIHVuYW5zaSA9IHJlcXVpcmUoJy4vdXRpbCcpLnVuYW5zaTtcblxuXG52YXIgQXNzRXJyb3IgPSBGYWlsdXJlLmNyZWF0ZSgnQXNzRXJyb3InKTtcbnZhciBwcm90byA9IEFzc0Vycm9yLnByb3RvdHlwZTtcblxucHJvdG8uc2hvd0RpZmYgPSBmYWxzZTtcbnByb3RvLmFjdHVhbCA9IG51bGw7XG5wcm90by5leHBlY3RlZCA9IG51bGw7XG5cbmZ1bmN0aW9uIGdldFRhcmdldExpbmUgKGZyYW1lcykge1xuICBmdW5jdGlvbiBnZXRTcmMgKGZyYW1lKSB7XG4gICAgdmFyIGZuID0gZnJhbWUuZ2V0RnVuY3Rpb24oKTtcbiAgICByZXR1cm4gZm4gPyBmbi50b1N0cmluZygpLnJlcGxhY2UoL1xccysvZywgJycpIDogbnVsbDtcbiAgfVxuXG4gIC8vIEZpcnN0IGZyYW1lIGlzIG5vdyB0aGUgdGFyZ2V0XG4gIHZhciB0YXJnZXQgPSBmcmFtZXNbMF07XG4gIHZhciB0YXJnZXRTcmMgPSBnZXRTcmModGFyZ2V0KTtcbiAgaWYgKCF0YXJnZXRTcmMpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEZpbHRlciBvdXQgYWxsIGZyYW1lcyB3aGljaCBhcmUgbm90IGluIHRoZSBzYW1lIGZpbGVcbiAgc2FtZWZpbGUgPSBmcmFtZXMuZmlsdGVyKGZ1bmN0aW9uIChmcmFtZSkge1xuICAgIHJldHVybiBmcmFtZSAmJiBmcmFtZS5nZXRGaWxlTmFtZSgpID09PSB0YXJnZXQuZ2V0RmlsZU5hbWUoKTtcbiAgfSk7XG5cbiAgLy8gR2V0IHRoZSBjbG9zZXN0IGZ1bmN0aW9uIGluIHRoZSBzYW1lIGZpbGUgdGhhdCB3cmFwcyB0aGUgdGFyZ2V0IGZyYW1lXG4gIHZhciB3cmFwcGVyO1xuICBmb3IgKHZhciBpPTE7IGkgPCBzYW1lZmlsZS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzcmMgPSBnZXRTcmMoc2FtZWZpbGVbaV0pO1xuICAgIGlmIChzcmMgJiYgLTEgIT09IHNyYy5pbmRleE9mKHRhcmdldFNyYykpIHtcbiAgICAgIHdyYXBwZXIgPSBzYW1lZmlsZVtpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFdoZW4gYSB3cmFwcGVyIGZ1bmN0aW9uIGlzIGZvdW5kIHdlIGNhbiB1c2UgaXQgdG8gb2J0YWluIHRoZSBsaW5lIHdlIHdhbnRcbiAgaWYgKHdyYXBwZXIpIHtcbiAgICAvLyBHZXQgcmVsYXRpdmUgcG9zaXRpb25zXG4gICAgdmFyIHJlbExuID0gdGFyZ2V0LmdldExpbmVOdW1iZXIoKSAtIHdyYXBwZXIuZ2V0TGluZU51bWJlcigpO1xuICAgIHZhciByZWxDbCA9IHRhcmdldC5nZXRMaW5lTnVtYmVyKCkgPT09IHdyYXBwZXIuZ2V0TGluZU51bWJlcigpXG4gICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICA6IHRhcmdldC5nZXRDb2x1bW5OdW1iZXIoKSAtIDE7XG5cbiAgICB2YXIgbGluZXMgPSB0YXJnZXQuZ2V0RnVuY3Rpb24oKS50b1N0cmluZygpLnNwbGl0KC9cXG4vKTtcbiAgICBpZiAobGluZXNbcmVsTG5dKSB7XG4gICAgICByZXR1cm4gbGluZXNbcmVsTG5dO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5wcm90by50b0pTT04gPSBmdW5jdGlvbiAoc3RhY2spIHtcbiAgdmFyIHByb3BzID0ge1xuICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICBtZXNzYWdlOiB1bmFuc2kodGhpcy5tZXNzYWdlKSxcbiAgICBhY3R1YWw6IHRoaXMuYWN0dWFsLFxuICAgIGV4cGVjdGVkOiB0aGlzLmV4cGVjdGVkLFxuICAgIHNob3dEaWZmOiB0aGlzLnNob3dEaWZmXG4gIH07XG5cbiAgLy8gaW5jbHVkZSBzdGFjayBpZiBleGlzdHMgYW5kIG5vdCB0dXJuZWQgb2ZmXG4gIGlmIChzdGFjayAmJiB0aGlzLnN0YWNrKSB7XG4gICAgcHJvcHMuc3RhY2sgPSB0aGlzLnN0YWNrO1xuICB9XG5cbiAgcmV0dXJuIHByb3BzO1xufTtcblxucHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtc2cgPSBGYWlsdXJlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRoaXMpO1xuXG4gIHZhciBsaW5lID0gZ2V0VGFyZ2V0TGluZSh0aGlzLmZyYW1lcyk7XG4gIGlmIChsaW5lKSB7XG4gICAgbXNnICs9ICdcXG4gID4+ICcgKyBsaW5lLnJlcGxhY2UoL15cXHMrLywgJycpLnNsaWNlKDAsIDYwKSArICdcXG4nO1xuICB9XG5cbiAgcmV0dXJuIG1zZztcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc0Vycm9yO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciBNYXRjaGVyID0gcmVxdWlyZSgnLi9tYXRjaGVyJyk7XG5cbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdXRpbCcpLnRlbXBsYXRlO1xuXG5cbi8vIEV4cGVjdGF0aW9uIHJlcHJlc2VudHMgYW4gaW5zdGFudGlhdGVkIE1hdGNoZXIgYWxyZWFkeSBjb25maWd1cmVkIHdpdGhcbi8vIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cy5cbmZ1bmN0aW9uIEV4cGVjdGF0aW9uIChtYXRjaGVyLCBhcmdzKSB7XG4gIC8vIEdldCB0aGUgbWF0Y2hlciBjb25maWd1cmF0aW9uIGludG8gdGhpcyBpbnN0YW5jZVxuICBtYXRjaGVyLmFzc2lnbih0aGlzKTtcblxuICAvLyBTdXBwb3J0IGJlaW5nIGdpdmVuIGFuIGBhcmd1bWVudHNgIG9iamVjdFxuICB0aGlzLmFyZ3MgPSBfLnRvQXJyYXkoYXJncyk7XG4gIHRoaXMuYWN0dWFsID0gdW5kZWZpbmVkO1xufVxuXG4vLyBJbmhlcml0IHRoZSBwcm90b3R5cGUgZnJvbSBNYXRjaGVyXG52YXIgcHJvdG8gPSBFeHBlY3RhdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE1hdGNoZXIucHJvdG90eXBlKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gRXhwZWN0YXRpb247XG5cbi8vIEdlbmVyYXRlIGdldHRlciBmb3IgYC5leHBlY3RlZGAgKGFuIGFsaWFzIGZvciBhcmdzWzBdKVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZXhwZWN0ZWQnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmFyZ3NbMF07XG4gIH0sXG4gIC8vIEhhY2s6IGFsbG93IGl0IHRvIGJlIG92ZXJyaWRlbiBvbiB0aGUgaW5zdGFuY2VcbiAgc2V0OiBmdW5jdGlvbiAodikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZXhwZWN0ZWQnLCB7XG4gICAgICB2YWx1ZTogdlxuICAgIH0pO1xuICB9XG59KTtcblxuLy8gR2VuZXJhdGUgZ2V0dGVycyBmb3IgdGhlIGZpcnN0IDUgYXJndW1lbnRzIGFzIGFyZzEsIGFyZzIsIC4uLlxuXy50aW1lcyg1LCBmdW5jdGlvbiAoaSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdhcmcnICsgKGkgKyAxKSwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuYXJnc1tpXTtcbiAgICB9XG4gIH0pO1xufSk7XG5cbi8vIENvbXB1dGUgdGhlIGRlc2NyaXB0aW9uIG1lc3NhZ2UgZm9yIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBleHBlY3RhdGlvblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZGVzY3JpcHRpb24nLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5kZXNjKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzLmRlc2MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlc2ModGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB0ZW1wbGF0ZSh0aGlzLmRlc2MsIHRoaXMpO1xuICB9XG59KTtcblxuLy8gQ29tcHV0ZSB0aGUgZmFpbHVyZSBtZXNzYWdlIGZvciB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZXhwZWN0YXRpb25cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2ZhaWx1cmUnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgdGhpcy5mYWlsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5mYWlsKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcGxhdGUodGhpcy5mYWlsLCB0aGlzKTtcbiAgfVxufSk7XG5cbi8vIEhlbHBlciB0byBtdXRhdGUgdGhlIHZhbHVlIHVuZGVyIHRlc3RcbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5tdXRhdGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgIHJldHVybiByZXNvbHZlcih2YWx1ZSk7XG4gIH07XG59O1xuXG4vLyBSZXNvbHZpbmcgY2FuIG92ZXJyaWRlIHRoZSBleHBlY3RhdGlvbiBzdGF0ZSwgaWYgdGhhdCdzIG5vdCBkZXNpcmFibGUgbWFrZVxuLy8gc3VyZSB0aGF0IHRoaXMgbWV0aG9kIGlzIGNhbGxlZCBpbiBhIG5ldyBjb250ZXh0LlxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhcmdzLCByZXN1bHQ7XG5cbiAgLy8gRXhlY3V0ZSB0aGUgbWF0Y2hlciB0ZXN0IG5vdyB0aGF0IGV2ZXJ5dGhpbmcgaXMgc2V0XG4gIGFyZ3MgPSBbdGhpcy5hY3R1YWxdLmNvbmNhdCh0aGlzLmFyZ3MpO1xuICByZXN1bHQgPSB0aGlzLnRlc3QuYXBwbHkodGhpcywgYXJncyk7XG5cbiAgLy8gUmV0dXJuaW5nIGEgc3RyaW5nIG92ZXJyaWRlcyB0aGUgbWlzbWF0Y2ggZGVzY3JpcHRpb25cbiAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5mYWlsID0gcmVzdWx0O1xuICAgIHJlc3VsdCA9IGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZGVzY3JpcHRpb247XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gRXhwZWN0YXRpb247XG4iLCIvLyBUaGUgTWF0Y2hlciBvYmplY3QgaXMgYSBkZXNjcmlwdG9yIGZvciB0aGUgbWF0Y2hpbmcgbG9naWMgYnV0IGNhbm5vdFxuLy8gYmUgdXNlZCBkaXJlY3RseS4gVXNlIGFuIEV4cGVjdGF0aW9uIHRvIGdldCBhbiBpbml0aWFsaXplZCBtYXRjaGVyLlxuZnVuY3Rpb24gTWF0Y2hlciAobmFtZSwgZGVzY3JpcHRvcikge1xuXG4gIC8vIFNob3J0Y3V0IGZvciBzaW1wbGUgdGVzdCBmdW5jdGlvbnNcbiAgaWYgKHR5cGVvZiBkZXNjcmlwdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZGVzY3JpcHRvciA9IHt0ZXN0OiBkZXNjcmlwdG9yfTtcbiAgfVxuXG4gIC8vIFRoZSBnZW5lcmljIG5hbWUgb2YgdGhlIG1hdGNoZXJcbiAgdGhpcy5uYW1lID0gbmFtZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShkZXNjcmlwdG9yLmhlbHApKSB7XG4gICAgdGhpcy5oZWxwID0gZGVzY3JpcHRvci5oZWxwLmpvaW4oJ1xcbicpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaGVscCA9IGRlc2NyaXB0b3IuaGVscCB8fCAnTm90IGF2YWlsYWJsZSc7XG4gIH1cblxuICAvLyBFaXRoZXIgYSB0ZW1wbGF0ZSBzdHJpbmcgb3IgYSBmdW5jdGlvbiB0aGF0IHdpbGwgcmVjZWl2ZSBhcyBvbmx5XG4gIC8vIGFyZ3VtZW50IGFuIEV4cGVjdGF0aW9uIGluc3RhbmNlIChjYWxsZWQgYXMgYSBtZXRob2Qgb2YgaXQpLlxuICB0aGlzLmRlc2MgPSBkZXNjcmlwdG9yLmRlc2MgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBkZXNjcmlwdG9yLmRlc2NcbiAgICAgICAgICAgIDogdGhpcy5uYW1lO1xuXG4gIC8vIEVpdGhlciBhIHRlbXBsYXRlIHN0cmluZyBvciBhIGZ1bmN0aW9uIHRoYXQgd2lsbCByZWNlaXZlIGFzIG9ubHlcbiAgLy8gYXJndW1lbnQgYW4gRXhwZWN0YXRpb24gaW5zdGFuY2UgKGNhbGxlZCBhcyBhIG1ldGhvZCBvZiBpdCkuXG4gIHRoaXMuZmFpbCA9IGRlc2NyaXB0b3IuZmFpbCB8fCAnd2FzIHt7IGFjdHVhbCB9fSc7XG5cbiAgaWYgKCFkZXNjcmlwdG9yLnRlc3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Rlc3QgZnVuY3Rpb24gbm90IGRlZmluZWQgZm9yIHRoZSBtYXRjaGVyJyk7XG4gIH1cbiAgdGhpcy50ZXN0ID0gZGVzY3JpcHRvci50ZXN0O1xuXG4gIHRoaXMuYXJpdHkgPSBkZXNjcmlwdG9yLmFyaXR5ICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICA/IGRlc2NyaXB0b3IuYXJpdHlcbiAgICAgICAgICAgICA6IHRoaXMudGVzdC5sZW5ndGg7XG59XG5cbk1hdGNoZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbk1hdGNoZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTWF0Y2hlcjtcblxuTWF0Y2hlci5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzLm5hbWUsIHtcbiAgICBoZWxwOiB0aGlzLmhlbHAsXG4gICAgZGVzYzogdGhpcy5kZXNjLFxuICAgIGZhaWw6IHRoaXMuZmFpbCxcbiAgICB0ZXN0OiB0aGlzLnRlc3QsXG4gICAgYXJpdHk6IHRoaXMuYXJpdHlcbiAgfSk7XG59O1xuXG4vLyBBdWdtZW50IGFub3RoZXIgb2JqZWN0IHdpdGggdGhlIHByb3BlcnRpZXMgb2YgdGhpcyBtYXRjaGVyXG5NYXRjaGVyLnByb3RvdHlwZS5hc3NpZ24gPSBmdW5jdGlvbiAob2JqKSB7XG4gIG9iai5oZWxwID0gdGhpcy5oZWxwO1xuICBvYmouZGVzYyA9IHRoaXMuZGVzYztcbiAgb2JqLmZhaWwgPSB0aGlzLmZhaWw7XG4gIG9iai50ZXN0ID0gdGhpcy50ZXN0O1xuICBvYmouYXJpdHkgPSB0aGlzLmFyaXR5O1xufTtcblxuTWF0Y2hlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAnPEFzcy5NYXRjaGVyICcgKyB0aGlzLm5hbWUgKyAnPic7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTWF0Y2hlcjtcbiIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cblxuYXNzLnJlZ2lzdGVyKHtcblxuICBhbmQ6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgZXhwZWN0YXRpb24gZnJvbSB0d28gb3IgbW9yZSBleHByZXNzaW9ucywgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGFsbCB0aGUgZXhwcmVzc2lvbnMgdGhhdCBmb3JtIGl0IGRvIGluZGVlZCBzdWNjZWVkLicsXG4gICAgICAnTm90ZTogZXZhbHVhdGlvbiB3aWxsIHN0b3AgYXMgc29vbiBhcyBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIGZhaWxzLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgQU5EIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgcmVzdWx0ID0gXy5ldmVyeShicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIGZhbHNlKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIGtlZXAgaXRlcmF0aW5nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhcnRpYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFrZSBjYXJlIG9mIGFueSBleHBlY3RhdGlvbnMgbGF0ZXIgaW4gdGhlIGNoYWluXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICBvcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIGV4cHJlc3Npb25zLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBleHByZXNzaW9ucyBkb2VzLicsXG4gICAgICAnTm90ZTogZXZhbHVhdGlvbiB3aWxsIHN0b3AgYXMgc29vbiBhcyBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIHN1Y2NlZWRzLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgT1IgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciByZXN1bHQgPSBfLnNvbWUoYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICB2YXIgcGFydGlhbCA9IGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgICAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuZGVmcyArPSAxO1xuICAgICAgICAgICAgYnJhbmNoLnRoZW4oXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8ga2VlcCBpdGVyYXRpbmdcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGFydGlhbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGV4cGVjdGF0aW9ucyBsYXRlciBpbiB0aGUgY2hhaW5cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIHhvcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIGV4cHJlc3Npb25zLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBleHByZXNzaW9ucyBkb2VzIGJ1dCBub3QgYWxsIG9mIHRoZW0uJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBYT1IgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciBva3MgPSAwO1xuICAgICAgICB2YXIga29zID0gMDtcbiAgICAgICAgXy5mb3JFYWNoKGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChrb3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG9rcyArPSAxO1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwsIG9rcyA+IDAgJiYga29zID4gMCA/IHVuZGVmaW5lZCA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksIF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChva3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGtvcyArPSAxO1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwsIG9rcyA+IDAgJiYga29zID4gMCA/IHVuZGVmaW5lZCA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0aWFsID09PSB0cnVlKSB7XG4gICAgICAgICAgICBva3MgKz0gMTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRpYWwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBrb3MgKz0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9rcyA+IDAgJiYga29zID4gMCA/IHJlc29sdmVyKGFjdHVhbCkgOiBmYWxzZTtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG4vLyBTZXQgb2YgZGVmYXVsdCBtYXRjaGVyc1xuYXNzLnJlZ2lzdGVyKHtcbiAgLy8gVE9ETzogTW92ZSB0aGlzIHRvIHRoZSBDaGFpbiBwcm90b3R5cGVcbiAgZGVzYzoge1xuICAgIGhlbHA6ICdQcm92aWRlIGEgY3VzdG9tIGRlc2NyaXB0aW9uIGZvciByZXBvcnRlZCBmYWlsdXJlcycsXG4gICAgZGVzYzogbnVsbCwgIC8vIFNraXAgaXQgZnJvbSByZXBvcnRzXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZGVzYykge1xuICAgICAgLy8gTm90ZSB0aGF0IHRoZSBkZXNjcmlwdGlvbiB3b24ndCBiZSBzZXQgdW50aWwgdGhlIGNoYWluIGlzIHJlc29sdmVkLFxuICAgICAgLy8gYXQgbGVhc3Qgb25jZSwgcmVhY2hpbmcgdGhpcyBleHBlY3RhdGlvbi5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgcmVzb2x2ZXIuY2hhaW4uX19kZXNjcmlwdGlvbl9fID0gZGVzYztcbiAgICAgICAgcmV0dXJuIHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICAvLyBJZ25vcmVkIG1hdGNoZXJzXG4gIHRvOiB7XG4gICAgYWxpYXNlczogWyAnYScsICdhbicsICdiZScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnSnVzdCBzb21lIHN5bnRheCBzdWdhciB0byBtYWtlIHRoZSBleHBlY3RhdGlvbnMgZWFzaWVyIG9uIHRoZSBleWVzLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIG1hcms6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSW5jcmVhc2VzIHRoZSBnbG9iYWwgYGFzcy5tYXJrc2AgY291bnRlciBldmVyeSB0aW1lIGl0IGdldHMnLFxuICAgICAgJ2V2YWx1YXRlZCBhcyBwYXJ0IG9mIGFuIGV4cHJlc3Npb24uIFVzZSBpdCB0byB2ZXJpZnkgdGhhdCB0aGUnLFxuICAgICAgJ3ByZWNlZGluZyBleHBlY3RhdGlvbnMgYXJlIGFjdHVhbGx5IGJlaW5nIGV4ZWN1dGVkLicsXG4gICAgICAnQW4gZWFzeSB3YXkgdG8gc3VwcG9ydCB0aGlzIHdoZW4gdXNpbmcgYSB0ZXN0IHJ1bm5lciBpcyB0byByZXNldCcsXG4gICAgICAndGhlIGNvdW50ZXIgYnkgY2FsbGluZyBgYXNzLm1hcmtzKClgIG9uIGEgYmVmb3JlRWFjaCBob29rIGFuZCcsXG4gICAgICAndGhlbiB2ZXJpZnkgYXQgdGhlIGVuZCBvZiB0ZXN0IHdpdGggYGFzcy5tYXJrcyhOKWAgKHdoZXJlIE4gaXMnLFxuICAgICAgJ3RoZSBudW1iZXIgb2YgbWFya3MgeW91IGV4cGVjdGVkKS4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGFzcy5tYXJrcy5jb3VudGVyICs9IDE7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gSnVzdCBhbGxvdyBhbnl0aGluZyA6KVxuICBhbnk6IHtcbiAgICBoZWxwOiAnQWxsb3dzIGFueSB2YWx1ZSB3aXRob3V0IHRlc3RpbmcgaXQuJyxcbiAgICBkZXNjOiAnaXMgYW55dGhpbmcnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgLy8gQW55dGhpbmcgdGhhdCBpc24ndCBudWxsIG9yIHVuZGVmaW5lZFxuICBkZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbm90IG51bGwgb3IgdW5kZWZpbmVkLicsXG4gICAgZGVzYzogJ2lzIGRlZmluZWQnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgIT0gbnVsbDtcbiAgICB9XG4gIH0sXG4gIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBlbXB0eVxuICBlbXB0eToge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGVtcHR5IChvciBoYXMgYSBsZW5ndGggb2YgMCkuJyxcbiAgICBkZXNjOiAnaXMgZW1wdHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPT0gbnVsbCB8fCBhY3R1YWwubGVuZ3RoID09PSAwO1xuICAgIH1cbiAgfSxcbiAgbmVtcHR5OiB7XG4gICAgYWxpYXNlczogWyAnbm9uRW1wdHknIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbm90IGVtcHR5IChvciBoYXMgYSBsZW5ndGggZ3JlYXRlciB0aGFuIDApLicsXG4gICAgZGVzYzogJ2lzIG5vdCBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAhPSBudWxsICYmIGFjdHVhbC5sZW5ndGggPiAwO1xuICAgIH1cbiAgfSxcbiAgdHJ1dGh5OiB7XG4gICAgYWxpYXNlczogWyAndHJ1aXNoJyBdLFxuICAgIGhlbHA6ICdUaGUgdmFsdWUgc2hvdWxkIGJlIHRydXRoeSAobm90IHVuZGVmaW5lZCwgbnVsbCwgMCwgXCJcIiBvciBbXSkuJyxcbiAgICBkZXNjOiAnaXMgdHJ1dGh5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWFjdHVhbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwubGVuZ3RoID09PSAnbnVtYmVyJyA/IGFjdHVhbC5sZW5ndGggPiAwIDogdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGZhbHN5OiB7XG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgZmFsc3kgKHVuZGVmaW5lZCwgbnVsbCwgMCwgXCJcIiBvciBbXSkuJyxcbiAgICBkZXNjOiAnaXMgZmFsc3knLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWFjdHVhbCkgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbC5sZW5ndGggPT09ICdudW1iZXInID8gYWN0dWFsLmxlbmd0aCA9PT0gMCA6IGZhbHNlO1xuICAgIH1cbiAgfSxcblxuICAvLyBOZWdhdGlvblxuICBub3Q6IHtcbiAgICBhbGlhc2VzOiBbICdubycsICdOTycsICdOT1QnIF0sXG4gICAgaGVscDogJ05lZ2F0ZXMgdGhlIHJlc3VsdCBmb3IgdGhlIHJlc3Qgb2YgdGhlIGV4cHJlc3Npb24uJyxcbiAgICBkZXNjOiAnTm90IScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcblxuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlci5maW5hbGl6ZShmdW5jdGlvbiAoZmluYWwpIHtcbiAgICAgICAgICByZXR1cm4gIWZpbmFsO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIGlzOiB7XG4gICAgYWxpYXNlczogWyAnZXF1YWwnLCAnZXF1YWxzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3Mgc3RyaWN0IGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlIGFuZCBpdHMgZXhwZWN0ZWQuJyxcbiAgICAgICdOb3RlOiBpZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBjaGFpbiBleHByZXNzaW9uIGl0XFwnbGwgYmUgdGVzdGVkIGluc3RlYWQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIHN0cmljdGx5IGVxdWFsIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgLy8gdGhpcyBpcyBhIGJpdCBjb250cml2ZWQgYnV0IGl0IG1ha2VzIGZvciBzb21lIG5pY2Ugc3ludGF4IHRvIGJlIGFibGUgdG9cbiAgICAgIC8vIHVzZSAuaXMgZm9yIHBhc3NpbmcgaW4gZXhwZWN0YXRpb25zXG4gICAgICBpZiAoYXNzLkNoYWluLmlzQ2hhaW4oZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY3R1YWwgPT09IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcbiAgZXE6IHtcbiAgICBhbGlhc2VzOiBbICdlcWwnLCAnZXFscycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIGRlZXAgbm9uLXN0cmljdCBlcXVhbGl0eSBiZXR3ZWVuIHRoZSB2YWx1ZSBhbmQgaXRzIGV4cGVjdGVkLicsXG4gICAgICAnSXQgdW5kZXJzdGFuZHMgYXNzIGV4cHJlc3Npb25zIHNvIHlvdSBjYW4gY29tYmluZSB0aGVtIGF0IHdpbGwgaW4gdGhlJyxcbiAgICAgICdleHBlY3RlZCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gZXF1YWwge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gXy5pc0VxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpO1xuICAgIH1cbiAgfSxcblxuICBtYXRjaDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdUcmllcyB0byBtYXRjaCB0aGUgc3ViamVjdCBhZ2FpbnN0IHRoZSBleHBlY3RlZCB2YWx1ZSB3aGljaCBjYW4gYmUgZWl0aGVyJyxcbiAgICAgICdhIGZ1bmN0aW9uLCBhbiBhc3MgZXhwcmVzc2lvbiwgYW4gb2JqZWN0IHdpdGggYSAudGVzdCgpIGZ1bmN0aW9uIChmb3IgJyxcbiAgICAgICdpbnN0YW5jZSBhIFJlZ0V4cCkgb3IgYSBwbGFpbiBvYmplY3QgdG8gcGFydGlhbGx5IG1hdGNoIGFnYWluc3QgdGhlIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBtYXRjaCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcblxuICAgICAgaWYgKHR5cGVvZiBleHBlY3RlZC50ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAhIWV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdChleHBlY3RlZCkpIHtcbiAgICAgICAgLy8gSGFjazogdXNlIGxvZGFzaCAud2hlcmUgZmlsdGVyaW5nIHRvIHBlcmZvcm0gdGhlIG1hdGNoXG4gICAgICAgIHZhciByZXN1bHQgPSBfLndoZXJlKFthY3R1YWxdLCBleHBlY3RlZCk7XG4gICAgICAgIHJldHVybiAxID09PSByZXN1bHQubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAnZXhwZWN0ZWQgaXMgbm90IGEgZnVuY3Rpb24gYW5kIGRvZXMgbm90IGhhdmUgYSAudGVzdCBtZXRob2QnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gISFleHBlY3RlZChhY3R1YWwpO1xuICAgIH1cbiAgfSxcblxuICBhYm92ZToge1xuICAgIGFsaWFzZXM6IFsgJ2d0JywgJ21vcmVUaGFuJywgJ2dyZWF0ZXJUaGFuJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGhpZ2hlciB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBtb3JlIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID4gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGJlbG93OiB7XG4gICAgYWxpYXNlczogWyAnbHQnLCAnbGVzc1RoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbG93ZXIgdGhhIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDwgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlT3JFcXVhbDoge1xuICAgIGFsaWFzZXM6IFsgJ2xlYXN0JywgJ2F0TGVhc3QnLCAnZ3RlJywgJ21vcmVUaGFuT3JFcXVhbCcsICdncmVhdGVyVGhhbk9yRXF1YWwnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3dPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnbW9zdCcsICdhdE1vc3QnLCAnbHRlJywgJ2xlc3NUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciBvciBlcXVhbCB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA8PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgY2xvc2U6IHtcbiAgICBhbGlhc2VzOiBbICdjbG9zZVRvJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGNsb3NlIHRvIHRoZSBleHBlY3RlZCBiYXNlZCBvbiBhIGdpdmVuIGRlbHRhLicsXG4gICAgICAnVGhlIGRlZmF1bHQgZGVsdGEgaXMgMC4xIHNvIHRoZSB2YWx1ZSAzLjU1IGlzIGNsb3NlIHRvIGFueSB2YWx1ZSBiZXR3ZWVuJyxcbiAgICAgICczLjQ1IGFuZCAzLjY1IChib3RoIGluY2x1c2l2ZSkuJyxcbiAgICAgICdTdHJpbmcgdmFsdWVzIGFyZSBhbHNvIHN1cHBvcnRlZCBieSBjb21wdXRpbmcgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlbScsXG4gICAgICAndXNpbmcgdGhlIFNpZnQ0IGFsZ29yaXRobS4gRm9yIHN0cmluZyB2YWx1ZXMgdGhlIGRlbHRhIGlzIGludGVycHJldGVkIGFzJyxcbiAgICAgICdhIHBlcmNlbnRhZ2UgKGllOiAwLjI1IGlzIDI1JSkuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGNsb3NlIHRvIHt7IGV4cGVjdGVkIH19JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIGRlbHRhKSB7XG4gICAgICBkZWx0YSA9IGRlbHRhID09IG51bGwgPyAwLjEgOiBkZWx0YTtcblxuICAgICAgLy8gU3VwcG9ydCBzdHJpbmdzIGJ5IGNvbXB1dGluZyB0aGVpciBkaXN0YW5jZVxuICAgICAgaWYgKF8uaXNTdHJpbmcoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICB2YXIgZGlmZiA9IHV0aWwuc2lmdDQoYWN0dWFsLCBleHBlY3RlZCwgMykgLyBNYXRoLm1heChhY3R1YWwubGVuZ3RoLCBleHBlY3RlZC5sZW5ndGgpO1xuICAgICAgICByZXR1cm4gZGlmZiA8PSBkZWx0YTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZCAtIGRlbHRhICYmIGFjdHVhbCA8PSBleHBlY3RlZCArIGRlbHRhO1xuICAgIH1cbiAgfSxcblxuICBpbnN0YW5jZW9mOiB7XG4gICAgYWxpYXNlczogWyAnaW5zdGFuY2VPZicsICdpbnN0YW5jZScsICdpc2EnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yLicsXG4gICAgICAnV2hlbiB0aGUgZXhwZWN0ZWQgaXMgYSBzdHJpbmcgaXRcXCdsbCBhY3R1YWxseSB1c2UgYSBgdHlwZW9mYCcsXG4gICAgICAnY29tcGFyaXNvbi4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYW4gaW5zdGFuY2Ugb2Yge3tleHBlY3RlZH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsID09PSBleHBlY3RlZCA/IHRydWUgOiAnaGFkIHR5cGUge3sgdHlwZW9mIGFjdHVhbCB9fSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIHR5cGVvZjoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG9mIGEgc3BlY2lmaWMgdHlwZScsXG4gICAgZGVzYzogJ3RvIGhhdmUgdHlwZSB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICdoYWQgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIF8uaXNFcXVhbCh0eXBlb2YgYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuICBudW1iZXI6IHtcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgbnVtYmVyIChkaWZmZXJlbnQgb2YgTmFOKS4nLFxuICAgIGRlc2M6ICd0byBiZSBhIG51bWJlcicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNOdW1iZXIoYWN0dWFsKSAmJiAhaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGJvb2w6IHtcbiAgICBhbGlhc2VzOiBbICdib29sZWFuJyBdLFxuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBib29sZWFuLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgYm9vbGVhbicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNCb29sZWFuKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBzdHJpbmc6IHtcbiAgICBhbGlhc2VzOiBbICdzdHInIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZy4nLFxuICAgIGRlc2M6ICd0byBiZSBhIHN0cmluZycsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNTdHJpbmcoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG9iamVjdDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIG9mIHR5cGUgb2JqZWN0LicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIG9iamVjdCcsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHBsYWluT2JqZWN0OiB7XG4gICAgYWxpYXNlczogWyAncGxhaW4nLCAnb2JqJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGUgT2JqZWN0IGNvbnN0cnVjdG9yLicsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUGxhaW5PYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGFycmF5OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYW4gQXJyYXkuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gQXJyYXknLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzQXJyYXkoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGZ1bmN0aW9uOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBGdW5jdGlvbi4nLFxuICAgIGRlc2M6ICd0byBiZSBhIEZ1bmN0aW9uJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICByZWdleHA6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIFJlZ0V4cCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgUmVnRXhwJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1JlZ0V4cChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZGF0ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRGF0ZScsXG4gICAgZGVzYzogJ3RvIGJlIGEgRGF0ZScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNEYXRlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBlbGVtZW50OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBET00gZWxlbWVudCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgRE9NIGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRWxlbWVudChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZXJyb3I6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBlcnJvciAob3IgbG9va3MgbGlrZSBpdCknLFxuICAgIGRlc2M6ICd0byBiZSBhbiBFcnJvcicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5uYW1lKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5tZXNzYWdlKTtcbiAgICB9XG4gIH0sXG5cbiAgdW5kZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgdW5kZWZpbmVkLicsXG4gICAgZGVzYzogJ3RvIGJlIHVuZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNVbmRlZmluZWQoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG51bGw6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBudWxsLicsXG4gICAgZGVzYzogJ3RvIGJlIG51bGwnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPT09IG51bGw7XG4gICAgfVxuICB9LFxuICBOYU46IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBOYU4uJyxcbiAgICBkZXNjOiAndG8gYmUgTmFOJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc051bWJlcihhY3R1YWwpKSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgdHJ1ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHRydWUnLFxuICAgIGRlc2M6ICd0byBiZSB0cnVlJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbCA9PSB0cnVlID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZmFsc2U6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBmYWxzZScsXG4gICAgZGVzYzogJ3RvIGJlIGZhbHNlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gYWN0dWFsID09IGZhbHNlID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICByYWlzZXM6IHtcbiAgICBhbGlhc2VzOiBbICd0aHJvd3MnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyB0aGF0IGV4ZWN1dGluZyB0aGUgdmFsdWUgcmVzdWx0cyBpbiBhbiBleGNlcHRpb24gYmVpbmcgdGhyb3duLicsXG4gICAgICAnVGhlIGNhcHR1cmVkIGV4Y2VwdGlvbiB2YWx1ZSBpcyB1c2VkIHRvIG11dGF0ZSB0aGUgc3ViamVjdCBmb3IgdGhlJyxcbiAgICAgICdmb2xsb3dpbmcgZXhwZWN0YXRpb25zLidcbiAgICBdLFxuICAgIGRlc2M6ICd0aHJvd3MgYW4gZXJyb3InLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNGdW5jdGlvbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgZnVuY3Rpb246IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhY3R1YWwoKTtcbiAgICAgICAgcmV0dXJuICdkaWQgbm90IHRocm93IGFueXRoaW5nJztcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGV4cGVjdGVkID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihleHBlY3RlZCkgJiYgZSBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzRXF1YWwoZSwgZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVnbWVudCB0aGUgZXhwZWN0YXRpb24gb2JqZWN0IHdpdGggYSBuZXcgdGVtcGxhdGUgdmFyaWFibGVcbiAgICAgICAgdGhpcy5leGNlcHRpb24gPSBlO1xuICAgICAgICByZXR1cm4gJ2dvdCB7eyBleGNlcHRpb24gfX0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBoYXM6IHtcbiAgICBhbGlhc2VzOiBbICdoYXZlJywgJ2NvbnRhaW4nLCAnY29udGFpbnMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgc29tZSBleHBlY3RlZCB2YWx1ZS4gSXQgdW5kZXJzdGFuZHMgZXhwZWN0ZWQnLFxuICAgICAgJ2NoYWluIGV4cHJlc3Npb25zIHNvIHRoaXMgc2VydmVzIGFzIHRoZSBlcXVpdmFsZW50IG9mIC5lcSBmb3IgcGFydGlhbCcsXG4gICAgICAnbWF0Y2hlcy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gY29udGFpbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYXJnMSAvKiwgLi4uICovKSB7XG5cbiAgICAgIC8vIGFsbG93IG11bHRpcGxlIGV4cGVjdGVkIHZhbHVlc1xuICAgICAgdGhpcy5leHBlY3RlZCA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuXG4gICAgICBpZiAoIV8uaXNTdHJpbmcoYWN0dWFsKSAmJiAhXy5pc0FycmF5KGFjdHVhbCkgJiYgIV8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2dvdCB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIF8uZXZlcnkodGhpcy5leHBlY3RlZCwgZnVuY3Rpb24gKGV4cGVjdGVkKSB7XG4gICAgICAgIGlmIChfLmlzU3RyaW5nKGFjdHVhbCkgJiYgXy5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICAgICAgICByZXR1cm4gLTEgIT09IGFjdHVhbC5pbmRleE9mKGV4cGVjdGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLmlzQXJyYXkoYWN0dWFsKSkge1xuICAgICAgICAgIC8vIFRPRE86IElzbid0IHRoZXJlIGFuIGVhc2llciB3YXkgdG8gdGVzdCB0aGlzIHVzaW5nIGxvZGFzaCBvbmx5P1xuICAgICAgICAgIGlmICghYXNzLkNoYWluLmlzQ2hhaW4oZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgICBleHBlY3RlZCA9IGFzcy5lcShleHBlY3RlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAtMSAhPT0gXy5maW5kSW5kZXgoYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYWNrOiBDb21wYXJlIG9iamVjdHMgd2l0aCAud2hlcmUgYnkgZmlsdGVyaW5nIGEgd3JhcHBlciBhcnJheVxuICAgICAgICByZXR1cm4gMSA9PT0gXy53aGVyZShbYWN0dWFsXSwgZXhwZWN0ZWQpLmxlbmd0aDtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcbiAgaGFzT3duOiB7XG4gICAgYWxpYXNlczogWyAnaGFzS2V5JywgJ2hhc0luZGV4JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVjayBpZiB0aGUgdmFsdWUgaGFzIG9uZSBvciBtb3JlIG93biBwcm9wZXJ0aWVzIGFzIGRlZmluZWQgYnknLFxuICAgICAgJ3RoZSBnaXZlbiBhcmd1bWVudHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGhhdmUgb3duIHByb3BlcnR5ICR7IGV4cGVjdGVkIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ3dhcyB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgdGhpcy5mYWlsID0gJ29ubHkgaGFkIHt7IF8ua2V5cyhhY3R1YWwpIH19JztcblxuICAgICAgLy8gVE9ETzogT2ZmZXIgYmV0dGVyIGZhaWx1cmUgbWVzc2FnZVxuICAgICAgdmFyIGFyZ3MgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KGFyZ3MsIGZ1bmN0aW9uICh4KSB7IHJldHVybiBfLmhhcyhhY3R1YWwsIHgpOyB9KTtcbiAgICB9XG4gIH0sXG5cbiAgbG9nOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0R1bXBzIHRoZSByZWNlaXZlZCB2YWx1ZSB0byB0aGUgY29uc29sZS4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbQVNTXScsIGFjdHVhbCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGR1bXA6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRHVtcHMgdGhlIHJlY2VpdmVkIHZhbHVlIHRvIHRoZSBjb25zb2xlIGFwcGx5aW5nIHRoZSBnaXZlbiB0ZW1wbGF0ZS4nLFxuICAgICAgJ05vdGU6IFVzZSAke3RoaXN9IHRvIGludGVycG9sYXRlIHRoZSB3aG9sZSB2YWx1ZS4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjdGVtcGxhdGUnXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHRwbCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHV0aWwudGVtcGxhdGUuY2FsbChhY3R1YWwsIHRwbCwgYWN0dWFsKTtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGRlYnVnZ2VyOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0hhbHRzIHNjcmlwdCBleGVjdXRpb24gYnkgdHJpZ2dlcmluZyB0aGUgaW50ZXJhY3RpdmUgZGVidWdnZXIuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICB0YXA6IHtcbiAgICBhbGlhc2VzOiBbICdmbicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2FsbHMgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uIHdpdGggdGhlIGN1cnJlbnQgdmFsdWUgYXMgYXJndW1lbnQuJyxcbiAgICAgICdJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyBzb21ldGhpbmcgZGlmZmVyZW50IHRvICp1bmRlZmluZWQqIHRoZScsXG4gICAgICAnZXhwcmVzc2lvbiB3aWxsIGZvcmsgdG8gb3BlcmF0ZSBvbiB0aGUgcmV0dXJuZWQgdmFsdWUuJyxcbiAgICBdLFxuICAgIGRlc2M6ICdjYWxsIHt7YXJnMX19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBmbikge1xuICAgICAgdmFyIHJlc3VsdCA9IGZuKGFjdHVhbCk7XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKHJlc3VsdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIG5vdGlmeToge1xuICAgIGhlbHA6IFtcbiAgICAgICdTaW1pbGFyIHRvIC50YXAoKSBidXQgaXQgd29uXFwndCBwYXNzIHRoZSBjdXJyZW50IHZhbHVlIGFzIGFyZ3VtZW50LCcsXG4gICAgICAnaW5zdGVhZCBpdCB3aWxsIGJlIHByb3ZpZGVkIGFzIHRoZSBgdGhpc2AgY29udGV4dCB3aGVuIHBlcmZvcm1pbmcgdGhlJyxcbiAgICAgICdjYWxsLiBUaGlzIGFsbG93cyBpdCB0byBiZSB1c2VkIHdpdGggdGVzdCBydW5uZXJzIGBkb25lYCBzdHlsZSBjYWxsYmFja3MuJyxcbiAgICAgICdOb3RlIHRoYXQgaXQgd2lsbCBuZWl0aGVyIG11dGF0ZSB0aGUgdmFsdWUgZXZlbiBpZiBpdCByZXR1cm5zIHNvbWV0aGluZy4nXG4gICAgXSxcbiAgICBkZXNjOiAnbm90aWZ5IHt7YXJnMX19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBmbikge1xuICAgICAgZm4uY2FsbChhY3R1YWwpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIHNpemU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gdGhlIHNpemUgb2YgdGhlIGN1cnJlbnQgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBzaXplJyxcbiAgICBmYWlsOiAnbm90IGhhcyBhIGxlbmd0aDoge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpIHx8IF8uaXNBcnJheShhY3R1YWwpIHx8IF8uaXNTdHJpbmcoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXy5zaXplKGFjdHVhbCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LFxuICBwcm9wOiB7XG4gICAgYWxpYXNlczogWyAna2V5JywgJ3Byb3BlcnR5JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIHZhbHVlIHByb3BlcnRpZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBwcm9wZXJ0eSB7eyBhcmcxIH19JyxcbiAgICBmYWlsOiAnd2FzIG5vdCBmb3VuZCBvbiB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGtleSkge1xuICAgICAgaWYgKF8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICBpZiAoa2V5IGluIGFjdHVhbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShhY3R1YWxba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmtleXMgPSBbXTtcbiAgICAgICAgXy5mb3JJbihhY3R1YWwsIGZ1bmN0aW9uICh2LCBrKSB7IHRoaXMua2V5cy5wdXNoKGspOyB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuICd3YXMgbm90IGZvdW5kIGluIGtleXMge3sga2V5cyB9fSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ2dvdCB7e2FjdHVhbH19JztcbiAgICB9XG4gIH0sXG4gIGF0OiB7XG4gICAgYWxpYXNlczogWyAnaW5kZXgnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIG9wZXJhdGUgb24gb25lIG9mIHRoZSBpbmRleGVkIGVsZW1lbnRzLiBJZicsXG4gICAgICAnbXVsdGlwbGUgaW5kZXhlcyBhcmUgcHJvdmlkZWQgYW4gYXJyYXkgaXMgY29tcG9zZWQgd2l0aCB0aGVtLicsXG4gICAgICAnTm90ZTogSXQgc3VwcG9ydHMgbmVnYXRpdmUgaW5kZXhlcydcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgaW5kZXggJHsgYXJncy5qb2luKFwiLCBcIikgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgaW5kZXgpIHtcbiAgICAgIGlmICghXy5pc0FycmF5KGFjdHVhbCkgJiYgIV8uaXNTdHJpbmcoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ25vdCBhbiBhcnJheSBvciBhIHN0cmluZzogJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgdmFyIGluZGV4ZXMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHZhciBlbGVtcyA9IFtdO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGV4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGlkeCA9IGluZGV4ZXNbaV07XG5cbiAgICAgICAgaWR4ID0gaWR4IDwgMCA/IGFjdHVhbC5sZW5ndGggKyBpZHggOiBpZHg7XG4gICAgICAgIGlmIChpZHggPCAwIHx8IGlkeCA+PSBhY3R1YWwubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIGlkeCArICcgb3V0IG9mIGJvdW5kcyBmb3Ige3thY3R1YWx9fSc7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtcy5wdXNoKGFjdHVhbFtpZHhdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBlbGVtcy5sZW5ndGggPT09IDEgPyBlbGVtc1swXSA6IGVsZW1zXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBrZXlzOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIG9wZXJhdGUgb24gaXRzIGxpc3Qgb2Ygb3duIGtleXMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBrZXlzJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ua2V5cyhhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgdmFsdWVzOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIG9wZXJhdGUgb24gaXRzIGxpc3Qgb2YgdmFsdWVzJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCB2YWx1ZXMnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy52YWx1ZXMoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc2xpY2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRXh0cmFjdHMgYSBwb3J0aW9uIGZyb20gdGhlIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdzbGljZSh7e2FjdHVhbH19LCAke2FyZzEgfHwgMH0pJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBzdGFydCwgZW5kKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8udG9BcnJheShhY3R1YWwpLnNsaWNlKHN0YXJ0LCBlbmQpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBmaWx0ZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiB0aGUgY29sbGVjdGlvbiwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8nLFxuICAgICAgJ29wZXJhdGUgb24gYW4gYXJyYXkgd2l0aCBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCB0aGUgY2FsbGJhY2sgcmV0dXJuZWQnLFxuICAgICAgJ3RydXRoeSBmb3IuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ZpbHRlcidcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uZmlsdGVyKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgcmVqZWN0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ0l0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgY29sbGVjdGlvbiwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZScsXG4gICAgICAnb24gYW4gYXJyYXkgd2l0aCBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCB0aGUgY2FsbGJhY2sgcmV0dXJuZWQgZmFsc3knLFxuICAgICAgJ2ZvciAodGhlIG9wcG9zaXRlIG9mIC5maWx0ZXIpLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNyZWplY3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnJlamVjdChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgd2hlcmU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnUGVyZm9ybXMgYSBkZWVwIGNvbXBhcmlzb24gb2YgZWFjaCBlbGVtZW50IGluIGEgY29sbGVjdGlvbiB0byB0aGUgZ2l2ZW4nLFxuICAgICAgJ3Byb3BlcnRpZXMgb2JqZWN0LCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIGFuIGFycmF5IG9mIGFsbCcsXG4gICAgICAnZWxlbWVudHMgdGhhdCBoYXZlIGVxdWl2YWxlbnQgcHJvcGVydHkgdmFsdWVzLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyN3aGVyZSdcbiAgICBdLFxuICAgIGRlc2M6ICd3aGVyZSB7e2FyZzF9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgcHJvcHMpIHtcbiAgICAgIGlmICghXy5pc1BsYWluT2JqZWN0KHByb3BzKSkge1xuICAgICAgICByZXR1cm4gJ3Byb3BzIGlzIG5vdCBhbiBvYmplY3QnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLndoZXJlKGFjdHVhbCwgcHJvcHMpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBtYXA6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIGNhbGxiYWNrIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWFwJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5tYXAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1ldGhvZDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiB0aGUgcmVzdWx0IG9mIGludm9raW5nIHRoZSBuYW1lZCcsXG4gICAgICAnbWV0aG9kIG9uIHRoZSBzdWJqZWN0IHZhbHVlLicsXG4gICAgXSxcbiAgICBkZXNjOiBcIm1ldGhvZCAuJHthcmcxfSgpXCIsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgbWV0aG9kLCBhcmcpIHtcbiAgICAgIGlmICh0eXBlb2YgYWN0dWFsW21ldGhvZF0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICcke2FyZzF9IGlzIG5vdCBhIG1ldGhvZCBpbiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgdmFyIGFyZ3MgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgyKTtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgYWN0dWFsW21ldGhvZF0uYXBwbHkoYWN0dWFsLCBhcmdzKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgaW52b2tlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIGFuIGFycmF5IGhvbGRpbmcgdGhlIHJlc3VsdHMgb2YnLFxuICAgICAgJ2ludm9raW5nIHRoZSBtZXRob2QgbmFtZWQgYnkgdGhlIGFyZ3VtZW50IGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlJyxcbiAgICAgICdjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ludm9rZSdcbiAgICBdLFxuICAgIGRlc2M6IFwiaW52b2tlIC4ke2FyZzF9KClcIixcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBtZXRob2QsIGFyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmludm9rZS5hcHBseShfLCBhcmd1bWVudHMpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBwbHVjazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBiZSB0aGUgb25lIG9mIHRoZSBzcGVjaWZpYyBwcm9wZXJ0eSBmb3IgYWxsIGVsZW1lbnRzJyxcbiAgICAgICdpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNwbHVjaydcbiAgICBdLFxuICAgIGRlc2M6ICdwbHVjaygge3thcmcxfX0gKScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgcHJvcCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnBsdWNrKGFjdHVhbCwgcHJvcClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGZpcnN0OiB7XG4gICAgYWxpYXNlczogWyAnaGVhZCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnVE9ETycsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNmaXJzdCdcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgZmlyc3QgZWxlbWVudCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmhlYWQoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIGxhc3Q6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnVE9ETycsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNsYXN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmxhc3QoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHJlc3Q6IHtcbiAgICBhbGlhc2VzOiBbICd0YWlsJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3Jlc3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8udGFpbChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBtaW46IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgc3ViamVjdCB0byBiZSB0aGUgbWluaW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWluJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1pbihhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgbWF4OiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHN1YmplY3QgdG8gYmUgdGhlIG1heGltdW0gdmFsdWUgZm91bmQgb24gdGhlIGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI21heCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5tYXgoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc29ydDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBiZSBzb3J0ZWQgaW4gYXNjZW5kaW5nIG9yZGVyLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNzb3J0QnknXG4gICAgXSxcbiAgICBkZXNjOiAnc29ydCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIC8vIEFsbG93IHRoZSB1c2Ugb2YgZXhwcmVzc2lvbnMgYXMgY2FsbGJhY2tzXG4gICAgICBpZiAoY2FsbGJhY2sgaW5zdGFuY2VvZiBhc3MuQ2hhaW4pIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjay5yZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5zb3J0QnkoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHN0b3JlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0hlbHBlciB0byBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCB2YWx1ZSBiZWluZyBldmFsdWF0ZWQgaW4gdGhlJyxcbiAgICAgICdleHByZXNzaW9uIGluIHNvbWUgb3RoZXIgb2JqZWN0LiBJdCBleHBlY3RzIGEgdGFyZ2V0IG9iamVjdCBhbmQgb3B0aW9uYWxseScsXG4gICAgICAndGhlIG5hbWUgb2YgYSBwcm9wZXJ0eS4gSWYgdGFyZ2V0IGlzIGEgZnVuY3Rpb24gaXRcXCdsbCByZWNlaXZlIHRoZSB2YWx1ZScsXG4gICAgICAndXNpbmcgYHByb3BgIGFzIHRoaXMgY29udGV4dC4gSWYgYHByb3BgIGlzIG5vdCBwcm92aWRlZCBhbmQgYHRhcmdldGAgaXMgYW4nLFxuICAgICAgJ2FycmF5IHRoZSB2YWx1ZSB3aWxsIGJlIHB1c2hlZCB0byBpdC4nXG4gICAgXSxcbiAgICBkZXNjOiAnc3RvcmUnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHRhcmdldCwgcHJvcCkge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbih0YXJnZXQpKSB7XG4gICAgICAgIHRhcmdldC5jYWxsKHByb3AsIGFjdHVhbCk7XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoXy5pc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICB0YXJnZXQucHVzaChhY3R1YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAncHJvcCB1bmRlZmluZWQgYW5kIHRhcmdldCBpcyBub3QgYW4gYXJyYXkgb3IgYSBmdW5jdGlvbjoge3thcmcxfX0nO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKF8uaXNPYmplY3QodGFyZ2V0KSkge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSBhY3R1YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ3RhcmdldCBpcyBub3QgYW4gb2JqZWN0OiB7e2FyZzF9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG59KTtcbiIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cblxuLy8gSGVscGVyIGZhY3RvcnkgZm9yIHRoZW5hYmxlIGNhbGxiYWNrc1xuZnVuY3Rpb24gcmVzdW1lIChyZXNvbHZlciwgcmVzdWx0KSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXNvbHZlci5yZXN1bWUodmFsdWUsIHJlc3VsdCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzUHJvbWlzZSAodmFsdWUpIHtcbiAgdmFyIHRoZW4gPSB2YWx1ZSAmJiB2YWx1ZS50aGVuO1xuICByZXR1cm4gdHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5cblxuLy8gUHJvbWlzZSByZWxhdGVkIG1hdGNoZXJzXG5hc3MucmVnaXN0ZXIoe1xuXG4gIHByb21pc2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnVmVyaWZpZXMgdGhhdCB0aGUgdmFsdWUgaXMgYSBwcm9taXNlIChQcm9taXNlL0ErKSBidXQgZG9lcyBub3QgYXR0YWNoJyxcbiAgICAgICd0aGUgZXhwcmVzc2lvbiB0byBpdHMgcmVzb2x1dGlvbiBsaWtlIGByZXNvbHZlc2Agb3IgYHJlamVjdHNgLCBpbnN0ZWFkJyxcbiAgICAgICd0aGUgb3JpZ2luYWwgcHJvbWlzZSB2YWx1ZSBpcyBrZXB0IGFzIHRoZSBzdWJqZWN0IGZvciB0aGUgZm9sbG93aW5nJyxcbiAgICAgICdleHBlY3RhdGlvbnMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGEgcHJvbWlzZScsXG4gICAgZmFpbDogJ2dvdCAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGlzUHJvbWlzZShhY3R1YWwpO1xuICAgIH1cbiAgfSxcblxuICByZXNvbHZlczoge1xuICAgIGFsaWFzZXM6IFsgJ3Jlc29sdmVkJywgJ2Z1bGZpbGxlZCcsICdmdWxmaWxsJywgJ2V2ZW50dWFsbHknIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0F0dGFjaCB0aGUgbWF0Y2hlciB0byBhIHByb21pc2UgdmFsdWUgKFByb21pc2VzL0ErKSB0byBjb250aW51ZScsXG4gICAgICAnYXBwbHlpbmcgdGhlIGNoYWluIG9mIG1hdGNoZXJzIG9uY2UgdGhlIHByb21pc2UgaGFzIGJlZW4gcmVzb2x2ZWQsJyxcbiAgICAgICdtdXRhdGluZyB0aGUgdmFsdWUgdG8gdGhlIHJlc29sdmVkIG9uZS4nLFxuICAgICAgJ0l0IHdpbGwgZmFpbCBpZiB0aGUgdmFsdWUgaXMgbm90IGEgcHJvbWlzZSAobm8gLnRoZW4gbWV0aG9kKSBvciB0aGUnLFxuICAgICAgJ3Byb21pc2UgaXMgYWN0dWFsbHkgcmVqZWN0ZWQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGEgcmVzb2x2ZWQgcHJvbWlzZScsXG4gICAgZmFpbDogJ3dhcyByZWplY3RlZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIEVudGVyIGFzeW5jIG1vZGVcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICAvLyBBdHRhY2ggdG8gdGhlIHByb21pc2Ugc28gd2UgZ2V0IG5vdGlmaWVkIHdoZW4gaXQncyByZXNvbHZlZC5cbiAgICAgICAgYWN0dWFsLnRoZW4oXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyKSxcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIsIGZhbHNlKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFJpZ2h0IG5vdyB3ZSBkb24ndCBrbm93IGlmIHRoZSBleHByZXNzaW9uIGlzIHZhbGlkXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBiZWNvbWU6IHtcbiAgICBhbGlhc2VzOiBbICdiZWNvbWVzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdXb3JrcyB0aGUgc2FtZSBhcyAucmVzb2x2ZXMgYnV0IGFkZGl0aW9uYWxseSB3aWxsIGRvIGEgY29tcGFyaXNvbiBiZXR3ZWVuJyxcbiAgICAgICd0aGUgcmVzb2x2ZWQgdmFsdWUgZnJvbSB0aGUgcHJvbWlzZSBhbmQgdGhlIGV4cGVjdGVkIG9uZS4gSXQgY2FuIGJlIHNlZW4nLFxuICAgICAgJ2FzIGEgc2hvcnRjdXQgZm9yIGAucmVzb2x2ZXMuZXEoZXhwZWN0ZWQpYC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmVjb21lIHt7IGV4cGVjdGVkIH19JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghaXNQcm9taXNlKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBwcm9taXNlOiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBNYWtlIGl0IGFzeW5jXG4gICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG5cbiAgICAgICAgLy8gQXR0YWNoIHRvIHRoZSBwcm9taXNlIHJlc29sdXRpb25cbiAgICAgICAgYWN0dWFsLnRoZW4oXG4gICAgICAgICAgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBlcXVhbGl0eSBzdWNjZWVkcyBqdXN0IGtlZXAgcmVzb2x2aW5nXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gXy5pc0VxdWFsKHZhbHVlLCBleHBlY3RlZCkgPyB1bmRlZmluZWQgOiBmYWxzZTtcbiAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZSh2YWx1ZSwgcmVzdWx0KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIHJlamVjdHM6IHtcbiAgICBhbGlhc2VzOiBbICdyZWplY3RlZCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlIGFwcGx5aW5nJyxcbiAgICAgICd0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZWplY3RlZCwgbXV0YXRpbmcgdGhlJyxcbiAgICAgICd2YWx1ZSB0byBiZWNvbWUgdGhlIHJlamVjdGVkIGVycm9yLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZScsXG4gICAgICAncHJvbWlzZSBpcyBhY3R1YWxseSBmdWxmaWxsZWQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGEgcmVqZWN0ZWQgcHJvbWlzZScsXG4gICAgZmFpbDogJ3dhcyBmdWxmaWxsZWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghaXNQcm9taXNlKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBwcm9taXNlOiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBFbnRlciBhc3luYyBtb2RlXG4gICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG5cbiAgICAgICAgYWN0dWFsLnRoZW4oXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyLCBmYWxzZSksXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFJpZ2h0IG5vdyB3ZSBkb24ndCBrbm93IGlmIHRoZSBleHByZXNzaW9uIGlzIHZhbGlkXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG59KTtcbiIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgYSB2YWx1ZSBjcmVhdGluZyBmb3JrcyBmb3IgZWFjaCBlbGVtZW50LCBoYW5kbGluZ1xuLy8gYXN5bmMgZXhwZWN0YXRpb25zIGlmIG5lZWRlZC5cbmZ1bmN0aW9uIGZvcmtlciAocmVzb2x2ZXIsIGFjdHVhbCwgaXRlcmF0b3IsIHN0b3ApIHtcbiAgdmFyIGJyYW5jaGVzID0gXy5zaXplKGFjdHVhbCk7XG4gIHZhciByZXN1bHQgPSBpdGVyYXRvcihhY3R1YWwsIGZ1bmN0aW9uICh2YWx1ZSkge1xuXG4gICAgdmFyIGZvcmsgPSByZXNvbHZlci5mb3JrKCk7XG5cbiAgICB2YXIgcGFydGlhbCA9IGZvcmsodmFsdWUpO1xuXG4gICAgLy8gU3RvcCBpdGVyYXRpbmcgYXMgc29vbiBhcyBwb3NzaWJsZVxuICAgIGlmIChwYXJ0aWFsID09PSBzdG9wKSB7XG4gICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgcmV0dXJuIHN0b3A7XG4gICAgfVxuXG4gICAgaWYgKHBhcnRpYWwgPT09ICFzdG9wKSB7XG4gICAgICBicmFuY2hlcyAtPSAxO1xuICAgICAgaWYgKDAgPT09IGJyYW5jaGVzKSB7XG4gICAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICB9XG4gICAgICByZXR1cm4gIXN0b3A7XG4gICAgfVxuXG4gICAgLy8gQXN5bmMgc3VwcG9ydFxuICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmliZSB0byB0aGUgZm9yaydzIGZpbmFsIHJlc3VsdFxuICAgIGZvcmsuZmluYWxpemUoZnVuY3Rpb24gKGZpbmFsKSB7XG4gICAgICAvLyBXZSdyZSBkb25lIHRoZSBtb21lbnQgb25lIGlzIGEgc3RvcCByZXN1bHRcbiAgICAgIGlmIChmaW5hbCA9PT0gc3RvcCkge1xuICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgc3RvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmFuY2hlcyAtPSAxO1xuICAgICAgICBpZiAoMCA9PT0gYnJhbmNoZXMpIHtcbiAgICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCAhc3RvcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmaW5hbDtcbiAgICB9KTtcblxuICAgIHJldHVybiAhc3RvcDsgIC8vIGtlZXAgaXRlcmF0aW5nXG4gIH0pO1xuXG4gIC8vIFdoZW4gdGhlIGZvcmtzIGNvbXBsZXRlZCBzeW5jaHJvbm91c2x5IGp1c3QgZmluYWxpemUgdGhlIHJlc29sdmVyXG4gIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHJlc3VsdCk7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5cbi8vIFF1YW50aWZpZXJzXG5hc3MucmVnaXN0ZXIoe1xuXG4gIGV2ZXJ5OiB7XG4gICAgYWxpYXNlczogWyAnYWxsJywgJ2FsbE9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdhbGwgb2YgdGhlbSBzdWNjZWVkJ1xuICAgIF0sXG4gICAgZGVzYzogJ0ZvciBldmVyeSBvbmU6JyxcbiAgICBmYWlsOiAnb25lIGRpZG5cXCd0JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBzdHVmZiB0byBkb1xuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvcmtlcihyZXNvbHZlciwgYWN0dWFsLCBfLmV2ZXJ5LCBmYWxzZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBzb21lOiB7XG4gICAgYWxpYXNlczogWyAnYW55T2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ2F0IGxlYXN0IG9uZSBvZiB0aGVtIHN1Y2NlZWRzJ10sXG4gICAgZGVzYzogJ0F0IGxlYXN0IG9uZTonLFxuICAgIGZhaWw6ICdub25lIGRpZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5zb21lLCB0cnVlKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIG5vbmU6IHtcbiAgICBhbGlhc2VzOiBbICdub25lT2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ25vbmUgb2YgdGhlbSBzdWNjZWVkLidcbiAgICBdLFxuICAgIGRlc2M6ICdOb25lIG9mIHRoZW06JyxcbiAgICBmYWlsOiAnb25lIGRpZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGFyZSBnb2luZyB0byB1c2UgdGhlIHNhbWUgYWxnb3JpdGhtIGFzIGZvciAuc29tZSBidXQgd2UnbGwgbmVnYXRlXG4gICAgICAgIC8vIGl0cyByZXN1bHQgdXNpbmcgYSBmaW5hbGl6ZXIuXG4gICAgICAgIHJlc29sdmVyLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgICAgIHJldHVybiAhZmluYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5zb21lLCB0cnVlKTtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuIiwidmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuXG52YXIgY2hlY2tDaGFpbiA9IG5ldyBDaGFpbigpO1xuXG5cbmV4cG9ydHMubG9kYXNoID0gZnVuY3Rpb24gKF8pIHtcbiAgLy8gRXhpdCBpZiBhbHJlYWR5IHBhdGNoZWRcbiAgaWYgKF8uY3JlYXRlQ2FsbGJhY2soY2hlY2tDaGFpbikgPT09IGNoZWNrQ2hhaW4udGVzdCkge1xuICAgIHJldHVybiBfO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgbG9kYXNoJ3MgZGVmYXVsdCBjcmVhdGVDYWxsYmFjayBtZWNoYW5pc20gdG8gbWFrZSBpdCB1bmRlcnN0YW5kXG4gIC8vIGFib3V0IG91ciBleHByZXNzaW9uIGNoYWlucy5cbiAgXy5jcmVhdGVDYWxsYmFjayA9IF8ud3JhcChfLmNyZWF0ZUNhbGxiYWNrLCBmdW5jdGlvbihvcmlnLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIGlmIChDaGFpbi5pc0NoYWluKGNhbGxiYWNrKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLnRlc3Q7XG4gICAgfVxuXG4gICAgLy8gU3VwcG9ydCBfLndoZXJlIHN0eWxlLiBJdCdzIG5vdCBhcyBmYXN0IGFzIHRoZSBvcmlnaW5hbCBvbmUgc2luY2Ugd2VcbiAgICAvLyBoYXZlIHRvIGdvIHZpYSBfLmlzRXF1YWwgaW5zdGVhZCBvZiB1c2luZyB0aGUgaW50ZXJuYWwgZnVuY3Rpb25cbiAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGNhbGxiYWNrKSkge1xuICAgICAgdmFyIHByb3BzID0gXy5rZXlzKGNhbGxiYWNrKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB2YXIgcmVzdWx0ID0gZmFsc2UsIGxlbmd0aCA9IHByb3BzLmxlbmd0aCwga2V5O1xuICAgICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgICBrZXkgPSBwcm9wc1tsZW5ndGhdO1xuICAgICAgICAgIC8vIEZhaWwgd2hlbiB0aGUga2V5IGlzIG5vdCBldmVuIHByZXNlbnRcbiAgICAgICAgICBpZiAoIShrZXkgaW4gb2JqZWN0KSkge1xuICAgICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3VsdCA9IF8uaXNFcXVhbChvYmplY3Rba2V5XSwgY2FsbGJhY2tba2V5XSk7XG4gICAgICAgICAgaWYgKCFyZXN1bHQpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBvcmlnKGNhbGxiYWNrLCB0aGlzQXJnKTtcbiAgfSk7XG5cbiAgLy8gT3ZlcnJpZGUgbG9kYXNoJ3MgZGVmYXVsdCBpc0VxdWFsIGltcGxlbWVudGF0aW9uIHNvIGl0IHVuZGVyc3RhbmRzXG4gIC8vIGFib3V0IGV4cHJlc3Npb24gY2hhaW5zLlxuICBmdW5jdGlvbiBjbXAgKGEsIGIpIHtcbiAgICByZXR1cm4gQ2hhaW4uaXNDaGFpbihhKSA/IGEudGVzdChiKSA6IENoYWluLmlzQ2hhaW4oYikgPyBiLnRlc3QoYSkgOiB1bmRlZmluZWQ7XG4gIH1cbiAgXy5pc0VxdWFsID0gXy53cmFwKF8uaXNFcXVhbCwgZnVuY3Rpb24gKG9yaWcsIGEsIGIsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgdmFyIHJlc3VsdCA9IGNhbGxiYWNrID8gY2FsbGJhY2suY2FsbCh0aGlzQXJnIHx8IHRoaXMsIGEsIGIpIDogdW5kZWZpbmVkO1xuICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVzdWx0ID0gb3JpZyhhLCBiLCBjbXAsIHRoaXNBcmcpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KTtcblxuICByZXR1cm4gXztcbn07XG5cblxuZXhwb3J0cy5zaW5vbiA9IGZ1bmN0aW9uIChzaW5vbikge1xuICAvLyBFeGl0IGlmIGFscmVhZHkgcGF0Y2hlZFxuICBpZiAoc2lub24ubWF0Y2guaXNNYXRjaGVyKGNoZWNrQ2hhaW4pKSB7XG4gICAgcmV0dXJuIHNpbm9uO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgU2lub24ncyAuaXNNYXRjaGVyIGltcGxlbWVudGF0aW9uIHRvIGFsbG93IG91ciBleHByZXNzaW9ucyB0byBiZVxuICAvLyB0cmFuc3BhcmVudGx5IHN1cHBvcnRlZCBieSBpdC5cbiAgdmFyIG9sZElzTWF0Y2hlciA9IHV0aWwuYmluZChzaW5vbi5tYXRjaC5pc01hdGNoZXIsIHNpbm9uLm1hdGNoKTtcbiAgc2lub24ubWF0Y2guaXNNYXRjaGVyID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBDaGFpbi5pc0NoYWluKG9iaikgfHwgb2xkSXNNYXRjaGVyKG9iaik7XG4gIH07XG5cbiAgcmV0dXJuIHNpbm9uO1xufTtcbiIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vLyBVc2UgYSBjYXBwZWQgcG9vbCwgdGhlIHJlbGVhc2luZyBhbGdvcml0aG0gaXMgcHJldHR5IHNvbGlkIHNvIHdlIHNob3VsZFxuLy8gaGF2ZSBhIGdvb2QgcmUtdXNlIHJhdGlvIHdpdGgganVzdCBhIGZldyBpbiB0aGUgcG9vbC4gVGhlbiBpbiBjYXNlXG4vLyBzb21ldGhpbmcgZ29lcyB3cm9uZyB0aGUgR0Mgd2lsbCB0YWtlIGNhcmUgb2YgaXQgYWZ0ZXIgYSB3aGlsZS5cbnZhciBwb29sID0gdXRpbC5DYXBwZWRQb29sKDEwMCk7XG52YXIgY3JlYXRlZCA9IDA7XG5cblxuLy8gSW5zdGFudGlhdGVzIGEgbmV3IHJlc29sdmVyIGZ1bmN0b3JcbmZ1bmN0aW9uIGZhY3RvcnkgKCkge1xuICAvLyBKdXN0IGZvcndhcmRzIHRoZSBjYWxsIHRvIHRoZSByZXNvbHZlciBieSBzZXR0aW5nIGl0c2VsZiBhcyBjb250ZXh0LlxuICBmdW5jdGlvbiBmbiAodmFsdWUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIuY2FsbChmbiwgdmFsdWUpO1xuICB9XG5cbiAgZm4uaWQgPSArK2NyZWF0ZWQ7XG5cbiAgLy8gVGhlIHN0YXRlIGlzIGF0dGFjaGVkIHRvIHRoZSBmdW5jdGlvbiBvYmplY3Qgc28gaXQncyBhdmFpbGFibGUgdG8gdGhlXG4gIC8vIHN0YXRlLWxlc3MgZnVuY3Rpb25zIHdoZW4gcnVubmluZyB1bmRlciBgdGhpcy5gLlxuICBmbi5jaGFpbiA9IG51bGw7XG4gIGZuLnBhcmVudCA9IG51bGw7XG4gIGZuLnBhdXNlZCA9IGZhbHNlO1xuICBmbi5yZXNvbHZlZCA9IFtdO1xuICBmbi5maW5hbGl6ZXJzID0gW107XG5cbiAgLy8gRXhwb3NlIHRoZSBiZWhhdmlvdXIgaW4gdGhlIGZ1bmN0b3JcbiAgZm4ucGF1c2UgPSBwYXVzZTtcbiAgZm4ucmVzdW1lID0gcmVzdW1lO1xuICBmbi5mb3JrID0gZm9yaztcbiAgZm4uam9pbiA9IGpvaW47XG4gIGZuLmZpbmFsaXplID0gZmluYWxpemU7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZuLCAnZXhoYXVzdGVkJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZWQubGVuZ3RoID49IHRoaXMuY2hhaW4uX19leHBlY3RhdGlvbnNfXy5sZW5ndGg7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZm47XG59XG5cbi8vIFRoaXMgaXMgdGhlIGNvcmUgcmVzb2x1dGlvbiBhbGdvcml0aG0sIGl0IG9wZXJhdGVzIG92ZXIgdGhlIGNoYWluXG4vLyBvZiBleHBlY3RhdGlvbnMgY2hlY2tpbmcgdGhlbSBvbmUgYWZ0ZXIgdGhlIG90aGVyIGFnYWluc3QgYSB2YWx1ZS5cbi8vIElmIGEgZnVuY3Rpb24gaXMgcmV0dXJuZWQgaXQnbGwgYmUgaW1tZWRpYXRlbHkgY2FsbGVkIHVzaW5nIHRoZVxuLy8gZXhwZWN0YXRpb24gaW5zdGFuY2UgYXMgY29udGV4dCBhbmQgcGFzc2luZyBhcyBvbmx5IGFyZ3VtZW50IHRoZVxuLy8gY3VycmVudCByZXNvbHZlIGZ1bmN0aW9uLCB0aGlzIGFsbG93cyBhbiBleHBlY3RhdGlvbiB0byBvdmVycmlkZVxuLy8gdGhlIHZhbHVlIGFuZC9vciBjb250cm9sIHRoZSByZXNvbHV0aW9uIHdpdGhvdXQgZXhwb3NpbmcgdG9vIG1hbnlcbi8vIGludGVybmFsIGRldGFpbHMuXG4vLyBXaGVuIGl0IHJldHVybnMgYHVuZGVmaW5lZGAgaXQganVzdCBtZWFucyB0aGF0IHRoZSByZXNvbHV0aW9uIHdhc1xuLy8gcGF1c2VkIChhc3luYyksIHdlIGNhbiBub3Qgb2J0YWluIGEgZmluYWwgcmVzdWx0IHVzaW5nIGEgc3luY2hyb25vdXNcbi8vIGNhbGwuIFRoaXMgY2FuIGJlIHVzZWQgYnkgbWF0Y2hlcnMgd2hlbiB0YWtpbmcgb3ZlciB0aGUgcmVzb2x1dGlvbiB0b1xuLy8ga25vdyBpZiB0aGV5IG5lZWQgdG8gbWFuZ2xlIHRoZSByZXN1bHRzIG9yIHRoZXkgaGF2ZSB0byByZWdpc3RlciBhXG4vLyBmaW5hbGl6ZXIgdG8gYmUgbm90aWZpZWQgb2YgdGhlIGZpbmFsIHJlc3VsdCBmcm9tIHRoZSBjaGFpbi5cbmZ1bmN0aW9uIHJlc29sdmVyICh2YWx1ZSkge1xuICB2YXIgbGlzdCwgcmVzdWx0LCBleHA7XG5cbiAgbGlzdCA9IHRoaXMuY2hhaW4uX19leHBlY3RhdGlvbnNfXztcbiAgb2Zmc2V0ID0gdGhpcy5yZXNvbHZlZC5sZW5ndGg7XG4gIHJlc3VsdCA9IHRydWU7XG5cbiAgZm9yICh2YXIgaSA9IG9mZnNldDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBDcmVhdGUgYSBuZXcgb2JqZWN0IGluaGVyaXRpbmcgZnJvbSB0aGUgZXhwZWN0YXRpb24gYnV0IHdpdGggdGhlXG4gICAgLy8gY3VycmVudCBhY3R1YWwgdmFsdWUgcHJvdmlzaW9uZWQuIEl0IGFsbG93cyB0aGUgZXhwcmVzc2lvbiB0byBtdXRhdGVcbiAgICAvLyBpdHMgc3RhdGUgZm9yIHRoaXMgZXhlY3V0aW9uIGJ1dCBub3QgYWZmZWN0IG90aGVyIHVzZXMgb2YgaXQuXG4gICAgZXhwID0gdXRpbC5jcmVhdGUobGlzdFtpXSwgeyBhY3R1YWw6IHZhbHVlIH0pO1xuXG4gICAgLy8gS2VlcCB0cmFjayBvZiByZXNvbHZlZCBleHBlY3RhdGlvbnNcbiAgICB0aGlzLnJlc29sdmVkLnB1c2goZXhwKTtcblxuICAgIC8vIEV4ZWN1dGUgdGhlIGV4cGVjdGF0aW9uIHRvIG9idGFpbiBpdHMgcmVzdWx0XG4gICAgcmVzdWx0ID0gZXhwLnJlc3VsdCA9IGV4cC5yZXNvbHZlKCk7XG5cbiAgICAvLyBBbGxvdyBleHBlY3RhdGlvbnMgdG8gdGFrZSBjb250cm9sIGZvciB0aGUgcmVtYWluaW5nIG9mIHRoZSBjaGFpblxuICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBTaW5jZSB0aGUgY29udHJvbCBpcyBkZWxlZ2F0ZWQgdG8gdGhlIGV4cHJlc3Npb24gd2UgZG9uJ3QgaGF2ZSB0b1xuICAgICAgLy8gZG8gYW55dGhpbmcgbW9yZSBoZXJlLlxuICAgICAgcmV0dXJuIGV4cC5yZXN1bHQgPSByZXN1bHQuY2FsbChleHAsIHRoaXMpO1xuICAgIH1cblxuICAgIC8vIFN0b3Agb24gZmlyc3QgZmFpbHVyZVxuICAgIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHdlIGp1c3QgbmVlZCB0byBhcHBseSBhbnkgcGVuZGluZyBmaW5hbGl6ZXJzXG4gIHJldHVybiB0aGlzLmZpbmFsaXplKHJlc3VsdCk7XG59XG5cblxuLy8gV2hlbiByZXNvbHZpbmcgYXN5bmMgZmxvd3MgKGkuZS46IHByb21pc2VzKSB0aGlzIHdpbGwgcGF1c2UgdGhlIGdpdmVuXG4vLyByZXNvbHZlciB1bnRpbCBhIGNhbGwgdG8gLnJlc3VtZSgpIGlzIG1hZGUuXG5mdW5jdGlvbiBwYXVzZSAoKSB7XG4gIGlmICh0aGlzLnBhdXNlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVzb2x2ZXIgYWxyZWFkeSBwYXVzZWQnKTtcbiAgfVxuXG4gIHRoaXMucGF1c2VkID0gdHJ1ZTtcbn1cblxuLy8gT25jZSB0aGUgYXN5bmMgZmxvdyBoYXMgY29tcGxldGVkIHdlIGNhbiBjb250aW51ZSByZXNvbHZpbmcgd2hlcmUgd2Vcbi8vIHN0b3BlZC4gV2hlbiB0aGUgb3ZlcnJpZGUgcGFyYW0gaXMgbm90IHVuZGVmaW5lZCB3ZSdsbCBza2lwIGNhbGxpbmcgdGhlXG4vLyByZXNvbHZlciBhbmQgYXNzdW1lIHRoYXQgYm9vbCBhcyB0aGUgZmluYWwgcmVzdWx0LiBUaGlzIGFsbG93cyB0aGUgYXN5bmNcbi8vIGNvZGUgdG8gc2hvcnRjdXQgdGhlIHJlc29sdmVyLlxuZnVuY3Rpb24gcmVzdW1lIChhY3R1YWwsIG92ZXJyaWRlKSB7XG4gIGlmICghdGhpcy5wYXVzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc29sdmVyIGlzIG5vdCBjdXJyZW50bHkgcGF1c2VkJyk7XG4gIH1cblxuICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xuXG4gIC8vIEEgZmluYWwgcmVzdWx0IHdhcyBwcm92aWRlZCBzbyBqdXN0IGZpbmFsaXplIHRoZSByZXNvbHZlclxuICBpZiAob3ZlcnJpZGUgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB0aGlzLmZpbmFsaXplKG92ZXJyaWRlKTtcbiAgfVxuXG4gIC8vIExldCdzIGNvbnRpbnVlIHJlc29sdmluZyB3aXRoIHRoZSBuZXcgdmFsdWVcbiAgLy8gTm90ZTogdGhpcygpIGxvb2tzIHdlaXJkIGJ1dCByZW1lbWJlciB3ZSdyZSB1c2luZyBhIGZ1bmN0aW9uIGFzIGNvbnRleHRcbiAgcmV0dXJuIHRoaXMoYWN0dWFsKTtcbn1cblxuLy8gQ2xvbmVzIHRoZSBjdXJyZW50IHJlc29sdmVyIHNvIHdlIGNhbiBmb3JrIGFuZCBkaXNjYXJkIG9wZXJhdGlvbnMuXG5mdW5jdGlvbiBmb3JrICgpIHtcbiAgdmFyIGZvcmsgPSBhY3F1aXJlKHRoaXMuY2hhaW4pO1xuICBmb3JrLnBhcmVudCA9IHRoaXM7XG4gIGZvcmsucmVzb2x2ZWQgPSBfLnJlamVjdCh0aGlzLnJlc29sdmVkLCBBcnJheS5pc0FycmF5KTtcbiAgcmV0dXJuIGZvcms7XG59XG5cbi8vIEFzc3VtZSB0aGUgcmVzdWx0cyBmcm9tIGEgZm9yayBpbiB0aGUgbWFpbiByZXNvbHZlclxuZnVuY3Rpb24gam9pbiAoZm9yaykge1xuICB2YXIgbGVuID0gXy5yZWplY3QodGhpcy5yZXNvbHZlZCwgQXJyYXkuaXNBcnJheSkubGVuZ3RoO1xuICB0aGlzLnJlc29sdmVkLnB1c2goXG4gICAgZm9yay5yZXNvbHZlZC5zbGljZShsZW4pXG4gICk7XG59XG5cbi8vIFdoZW4gdGhlIGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24gaXQgZ2V0cyByZWdpc3RlcmVkIGFzIGEgZmluYWxpemVyIGZvciB0aGVcbi8vIHJlc3VsdCBvYnRhaW5lZCBvbmNlIHRoZSBleHByZXNzaW9uIGhhcyBiZWVuIGZ1bGx5IHJlc29sdmVkIChpLmUuIGFzeW5jKS5cbi8vIE90aGVyd2lzZSBpdCdsbCBleGVjdXRlIGFueSByZWdpc3RlcmVkIGZ1bmN0aW9ucyBvbiB0aGUgZ2l2ZW4gcmVzdWx0IGFuZFxuLy8gYWxsb3cgdGhlbSB0byBjaGFuZ2UgaXQgYmVmb3JlIHJlbGVhc2luZyB0aGUgcmVzb2x2ZXIgaW50byB0aGUgcG9vbC5cbmZ1bmN0aW9uIGZpbmFsaXplKHJlc3VsdCkge1xuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMuZmluYWxpemVycy5wdXNoKFxuICAgICAgW3Jlc3VsdCwgXy5sYXN0KHRoaXMucmVzb2x2ZWQpXVxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gTm90aGluZyB5ZXQgdG8gZmluYWxpemUgc2luY2UgdGhlIHJlc3VsdCBpcyBzdGlsbCB1bmtub3duXG4gIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBBbGxvdyBmaW5hbGl6ZXJzIHRvIHRvZ2dsZSB0aGUgcmVzdWx0IChMSUZPIG9yZGVyKVxuICB2YXIgZmluYWxpemVyO1xuICB3aGlsZSAodGhpcy5maW5hbGl6ZXJzLmxlbmd0aCA+IDApIHtcbiAgICBmaW5hbGl6ZXIgPSB0aGlzLmZpbmFsaXplcnMucG9wKCk7XG4gICAgcmVzdWx0ID0gZmluYWxpemVyWzBdLmNhbGwoZmluYWxpemVyWzFdLCByZXN1bHQpO1xuICAgIGZpbmFsaXplclsxXS5yZXN1bHQgPSByZXN1bHQ7XG4gIH1cblxuICAvLyBMZXQgdGhlIGNoYWluIGRpc3BhdGNoIHRoZSBmaW5hbCByZXN1bHQgYnV0IG9ubHkgZm9yIG5vbi1mb3JrZWQgcmVzb2x2ZXJzXG4gIGlmICghdGhpcy5wYXJlbnQpIHtcbiAgICB0aGlzLmNoYWluLmRpc3BhdGNoUmVzdWx0KHRoaXMucmVzb2x2ZWQsIHJlc3VsdCk7XG4gIH1cblxuICAvLyBXaGVuIGEgZmluYWwgcmVzdWx0IGhhcyBiZWVuIG9idGFpbmVkIHJlbGVhc2UgdGhlIHJlc29sdmVyIHRvIHRoZSBwb29sXG4gIHBvb2wucHVzaCh0aGlzKTtcbiAgaWYgKHBvb2wubGVuZ3RoID4gY3JlYXRlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUG9vbCBjb3JydXB0ZWQhIENyZWF0ZWQgJyArIGNyZWF0ZWQgKyAnIGJ1dCB0aGVyZSBhcmUgJyArIHBvb2wubGVuZ3RoICsgJyBwb29sZWQnKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEFjcXVpcmVzIGEgcmVzb2x2ZXIgZnVuY3RvciwgaWYgdGhlcmUgaXMgb25lIGluIHRoZSBwb29sIGl0J2xsIGJlIHJlc2V0IGFuZFxuLy8gcmV1c2VkLCBvdGhlcndpc2UgaXQnbGwgY3JlYXRlIGEgbmV3IG9uZS4gV2hlbiB5b3UncmUgZG9uZSB3aXRoIHRoZSByZXNvbHZlclxuLy8geW91IHNob3VkIGdpdmUgaXQgdG8gYHJlbGVhc2UoKWAgc28gaXQgY2FuIGJlIGluY29ycG9yYXRlZCB0byB0aGUgcG9vbC5cbi8vIFRoZSByZWFzb24gZm9yIHVzaW5nIGEgcG9vbCBvZiBvYmplY3RzIGhlcmUgaXMgdGhhdCBldmVyeSB0aW1lIHdlIGV2YWx1YXRlXG4vLyBhbiBleHByZXNzaW9uIHdlJ2xsIG5lZWQgYSByZXNvbHZlciwgd2hlbiB1c2luZyBxdWFudGlmaWVycyBtdWx0aXBsZSBmb3Jrc1xuLy8gd2lsbCBiZSBjcmVhdGVkLCBzbyBpdCdzIGltcG9ydGFudCB0byBpbXByb3ZlIHRoZSBwZXJmb3JtYW5jZS5cbmZ1bmN0aW9uIGFjcXVpcmUgKGNoYWluKSB7XG4gIHZhciByZXNvbHZlciA9IHBvb2wucG9wKCkgfHwgZmFjdG9yeSgpO1xuXG4gIC8vIFJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgcmVzb2x2ZXJcbiAgcmVzb2x2ZXIuY2hhaW4gPSBjaGFpbjtcbiAgcmVzb2x2ZXIucGFyZW50ID0gbnVsbDtcbiAgcmVzb2x2ZXIucGF1c2VkID0gZmFsc2U7XG4gIHdoaWxlIChyZXNvbHZlci5yZXNvbHZlZC5sZW5ndGggPiAwKSB7XG4gICAgcmVzb2x2ZXIucmVzb2x2ZWQucG9wKCk7XG4gIH1cbiAgd2hpbGUgKHJlc29sdmVyLmZpbmFsaXplcnMubGVuZ3RoID4gMCkge1xuICAgIHJlc29sdmVyLmZpbmFsaXplcnMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzb2x2ZXI7XG59XG5cblxuZXhwb3J0cy5hY3F1aXJlID0gYWNxdWlyZTtcbiIsIi8vIFN1cHBvcnQgZm9yIC5zaG91bGQgc3R5bGUgc3ludGF4LCBub3RpY2UgdGhhdCB3aGlsZSBoZXJlIHJlc2lkZXMgdGhlIGNvcmVcbi8vIGxvZ2ljIGZvciBpdCwgdGhlIGludGVyZmFjZSBpcyBkb25lIGluIGFzcy5qcyBpbiBvcmRlciB0byBtYWtlIGl0IHJldHVyblxuLy8gdGhlIGBhc3NgIGZ1bmN0aW9uIGFuZCBwcm92aWRlIHN1cHBvcnQgZm9yIGl0cyB1c2Ugb24gYmVmb3JlRWFjaC9hZnRlckVhY2guXG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcblxuXG52YXIgREVGQVVMVF9QUk9QID0gJ3Nob3VsZCc7XG5cbi8vIEluc3RhbGxzIHRoZSB0eXBpY2FsIC5zaG91bGQgcHJvcGVydHkgb24gdGhlIHJvb3QgT2JqZWN0IHByb3RvdHlwZS5cbi8vIFlvdSBjYW4gaW5zdGFsbCB1bmRlciBhbnkgbmFtZSBvZiB5b3VyIGNob29zaW5nIGJ5IGdpdmluZyBpdCBhcyBhcmd1bWVudC5cbi8vXG4vLyBCYXNpY2FsbHkgYm9ycm93ZWQgZnJvbSB0aGUgQ2hhaSBwcm9qZWN0OlxuLy8gIENvcHlyaWdodChjKSAyMDExLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4vLyAgaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9jaGFpL2Jsb2IvbWFzdGVyL2xpYi9jaGFpL2ludGVyZmFjZS9zaG91bGQuanNcbmZ1bmN0aW9uIHNob3VsZCAobmFtZSkge1xuICBpZiAobmFtZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBzaG91bGQucmVzdG9yZSgpO1xuICB9XG5cbiAgbmFtZSA9IG5hbWUgfHwgREVGQVVMVF9QUk9QO1xuXG4gIGlmIChuYW1lIGluIE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICBpZiAoIUNoYWluLmlzQ2hhaW4oT2JqZWN0LnByb3RvdHlwZVtuYW1lXSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXNzLnNob3VsZDogT2JqZWN0LnByb3RvdHlwZSBhbHJlYWR5IGhhcyBhIC4nICsgbmFtZSArICcgcHJvcGVydHknKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gbW9kaWZ5IE9iamVjdC5wcm90b3R5cGUgdG8gaGF2ZSBgPG5hbWU+YFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgbmFtZSwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKENoYWluLmlzQ2hhaW4odGhpcykpIHtcbiAgICAgICAgLy8gQWN0dWFsbHkgQ2hhaW4gaW5zdGFuY2VzIGRvbid0IGluaGVyaXQgZnJvbSBPYmplY3QgYnV0IHN0aWxsXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSBlbHNlIGlmICh0aGlzIGluc3RhbmNlb2YgU3RyaW5nIHx8IHRoaXMgaW5zdGFuY2VvZiBOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzLmNvbnN0cnVjdG9yKHRoaXMpKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIEJvb2xlYW4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzID09IHRydWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzKTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBBbGxvdzogZ2xvYmFsLmFzcyA9IHJlcXVpcmUoJ2FzcycpLnNob3VsZCgpXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLCAgLy8gQWxsb3cgcmVzdG9yYXRpb25cbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBFeHBvc2UgaXQgYXMgYSBuby1vcCBvbiBDaGFpbnMgc2luY2UgdGhleSBkb24ndCBpbmhlcml0IGZyb20gT2JqZWN0XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlICAvLyBBbGxvdyByZXN0b3JhdGlvblxuICB9KTtcblxufVxuXG5zaG91bGQucmVzdG9yZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIG5hbWUgPSBuYW1lIHx8IERFRkFVTFRfUFJPUDtcblxuICBpZiAobmFtZSBpbiBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgaWYgKENoYWluLmlzQ2hhaW4oT2JqZWN0LnByb3RvdHlwZVtuYW1lXSkpIHtcbiAgICAgIGRlbGV0ZSBPYmplY3QucHJvdG90eXBlW25hbWVdO1xuICAgICAgZGVsZXRlIENoYWluLnByb3RvdHlwZVtuYW1lXTtcbiAgICB9XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGQ7XG4iLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxuLy8gR2V0IHRoZSBuYXRpdmUgUHJvbWlzZSBvciBhIHNoaW1cbmV4cG9ydHMuUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlIHx8ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LndpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwud2luZG93IDogbnVsbCkuUHJvbWlzZTtcblxuXG4vLyBDYXBwZWQgcG9vbCB0byBsaW1pdCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBjYW4gYmVcbi8vIHN0b3JlZCAodW5ib3VuZGVkIGJ5IGRlZmF1bHQpLlxuZXhwb3J0cy5DYXBwZWRQb29sID0gZnVuY3Rpb24gKG1heCkge1xuICB2YXIgcG9vbCA9IFtdO1xuXG4gIG1heCA9IG1heCB8fCBOdW1iZXIuTUFYX1ZBTFVFO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwb29sLCAncHVzaCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA8IG1heCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKHRoaXMsIHYpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHBvb2w7XG59O1xuXG5cbnZhciBkb0NvbG9ycyA9IF8ub25jZShmdW5jdGlvbiAoKSB7XG4gIC8vIE1hc3RlciBvdmVycmlkZSB3aXRoIG91ciBjdXN0b20gZW52IHZhcmlhYmxlXG4gIGlmIChwcm9jZXNzLmVudi5BU1NfQ09MT1JTICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gL3RydWV8b258eWVzfGVuYWJsZWQ/fDEvaS50ZXN0KHByb2Nlc3MuZW52LkFTU19DT0xPUlMpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgbW9jaGEgaXMgYXJvdW5kIGFuZCB2ZXJpZnkgYWdhaW5zdCBpdHMgY29uZmlndXJhdGlvblxuICB2YXIgTW9jaGEgPSBnbG9iYWwuTW9jaGE7XG4gIGlmIChNb2NoYSA9PT0gdW5kZWZpbmVkICYmIHJlcXVpcmUucmVzb2x2ZSAmJiByZXF1aXJlLnJlc29sdmUoJ21vY2hhJykpIHtcbiAgICBNb2NoYSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Lk1vY2hhIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5Nb2NoYSA6IG51bGwpO1xuICB9XG4gIGlmIChNb2NoYSAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycyAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycy5CYXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gTW9jaGEucmVwb3J0ZXJzLkJhc2UudXNlQ29sb3JzO1xuICB9XG5cbiAgLy8gUXVlcnkgdGhlIGVudmlyb25tZW50IGFuZCBzZWUgaWYgc29tZSBjb21tb24gdmFyaWFibGVzIGFyZSBzZXRcbiAgaWYgKHByb2Nlc3MuZW52Lk1PQ0hBX0NPTE9SUyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKC8tLWNvbG9yPWFsd2F5cy8udGVzdChwcm9jZXNzLmVudi5HUkVQX09QVElPTlMgfHwgJycpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBGaW5hbGx5IGp1c3QgY2hlY2sgaWYgdGhlIGVudmlyb25tZW50IGlzIGNhcGFibGVcbiAgdmFyIHR0eSA9IHJlcXVpcmUoJ3R0eScpO1xuICByZXR1cm4gdHR5LmlzYXR0eSgxKSAmJiB0dHkuaXNhdHR5KDIpO1xufSk7XG5cblxuLy8gUmVtb3ZlIEFOU0kgZXNjYXBlcyBmcm9tIGEgc3RyaW5nXG5mdW5jdGlvbiB1bmFuc2kgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xceDFiXFxbKFxcZCs7PykrW2Etel0vZ2ksICcnKTtcbn1cblxuXG4vLyBBdm9pZCByZXBlYXRlZCBjb21waWxhdGlvbnMgYnkgbWVtb2l6aW5nXG52YXIgY29tcGlsZVRlbXBsYXRlID0gXy5tZW1vaXplKGZ1bmN0aW9uICh0cGwpIHtcbiAgcmV0dXJuIF8udGVtcGxhdGUodHBsLCBudWxsLCB7XG4gICAgZXNjYXBlOiAvXFx7XFx7KFtcXHNcXFNdKz8pXFx9XFx9L2dcbiAgfSk7XG59KTtcblxuLy8gRHVtcHMgYXJiaXRyYXJ5IHZhbHVlcyBhcyBzdHJpbmdzIGluIGEgY29uY2lzZSB3YXlcbi8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS91dGlscy9vYmpEaXNwbGF5LmpzXG5mdW5jdGlvbiB2YWx1ZUR1bXBlciAodikge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKF8uaXNOdW1iZXIodikgfHwgXy5pc05hTih2KSB8fCBfLmlzQm9vbGVhbih2KSB8fCBfLmlzTnVsbCh2KSB8fCBfLmlzVW5kZWZpbmVkKHYpKSB7XG4gICAgdmFsdWUgPSAnPCcgKyB2ICsgJz4nO1xuICB9IGVsc2UgaWYgKF8uaXNGdW5jdGlvbih2KSkge1xuICAgIGlmICh2LmRpc3BsYXlOYW1lKSB7XG4gICAgICB2YWx1ZSA9IHYuZGlzcGxheU5hbWUgKyAnKCknO1xuICAgIH0gZWxzZSBpZiAodi5uYW1lKSB7XG4gICAgICB2YWx1ZSA9IHYubmFtZSArICcoKSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gJ2Z1bmN0aW9uJyArIHYubmFtZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfVxuXG4gIHJldHVybiAnXFx1MDAxYlsxOzM2bScgKyB2YWx1ZSArICdcXHUwMDFiWzBtJztcbn1cblxuXG4vLyBDdXN0b21pemVkIHZlcnNpb24gb2YgbG9kYXNoIHRlbXBsYXRlXG5mdW5jdGlvbiB0ZW1wbGF0ZSAodHBsLCBjb250ZXh0KSB7XG4gIHZhciBmbiA9IGNvbXBpbGVUZW1wbGF0ZSh0cGwpO1xuICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIG9yaWdFc2NhcGUgPSBfLmVzY2FwZTtcbiAgdHJ5IHtcbiAgICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBlc2NhcGUgZnVuY3Rpb24gdG8gdXNlIGl0IGZvciBkdW1waW5nIGZvcm1hdHRlZCB2YWx1ZXNcbiAgICBfLmVzY2FwZSA9IHZhbHVlRHVtcGVyO1xuXG4gICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuXG4gIH0gZmluYWxseSB7XG4gICAgXy5lc2NhcGUgPSBvcmlnRXNjYXBlO1xuICB9XG59XG5cbi8vIEEgc2ltcGxlIGZhc3QgZnVuY3Rpb24gYmluZGluZyBwcmltaXRpdmUgb25seSBzdXBwb3J0aW5nIHNldHRpbmcgdGhlIGNvbnRleHRcbmZ1bmN0aW9uIGJpbmQoZm4sIHRoaXNBcmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxuLy8gUXVpY2tseSBjcmVhdGVzIGEgbmV3IG9iamVjdCB3aXRoIGEgY3VzdG9tIHByb3RvdHlwZSBhbmQgc29tZSB2YWx1ZVxuLy8gb3ZlcnJpZGVzLlxuZnVuY3Rpb24gY3JlYXRlKHByb3RvLCB2YWx1ZXMpIHtcbiAgaWYgKDAgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEhBQ0s6IFVzZSBGdW5jdGlvbi5wcm90b3R5cGUgKyBuZXcgaW5zdGVhZCBvZiB0aGUgc2xvdy1pc2ggT2JqZWN0LmNyZWF0ZVxuICBjcmVhdGUucHJvdG90eXBlID0gcHJvdG87XG4gIHJldHVybiBfLmFzc2lnbihuZXcgY3JlYXRlLCB2YWx1ZXMgfHwge30pO1xufVxuXG5cbi8vIEZyb20gaHR0cDovL3NpZGVyaXRlLmJsb2dzcG90LmNvbS8yMDE0LzExL3N1cGVyLWZhc3QtYW5kLWFjY3VyYXRlLXN0cmluZy1kaXN0YW5jZS5odG1sXG5mdW5jdGlvbiBzaWZ0NChzMSwgczIsIG1heE9mZnNldCkge1xuICBpZiAoIXMxIHx8ICFzMS5sZW5ndGgpIHtcbiAgICBpZiAoIXMyKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHMyLmxlbmd0aDtcbiAgfVxuXG4gIGlmICghczIgfHwgIXMyLmxlbmd0aCkge1xuICAgIHJldHVybiBzMS5sZW5ndGg7XG4gIH1cblxuICB2YXIgbDEgPSBzMS5sZW5ndGg7XG4gIHZhciBsMiA9IHMyLmxlbmd0aDtcblxuICB2YXIgYzEgPSAwOyAgLy8gY3Vyc29yIGZvciBzdHJpbmcgMVxuICB2YXIgYzIgPSAwOyAgLy8gY3Vyc29yIGZvciBzdHJpbmcgMlxuICB2YXIgbGNzcyA9IDA7ICAvLyBsYXJnZXN0IGNvbW1vbiBzdWJzZXF1ZW5jZVxuICB2YXIgbG9jYWxfY3MgPSAwOyAvLyBsb2NhbCBjb21tb24gc3Vic3RyaW5nXG5cbiAgd2hpbGUgKChjMSA8IGwxKSAmJiAoYzIgPCBsMikpIHtcbiAgICBpZiAoczEuY2hhckF0KGMxKSA9PSBzMi5jaGFyQXQoYzIpKSB7XG4gICAgICBsb2NhbF9jcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBsY3NzICs9IGxvY2FsX2NzO1xuICAgICAgbG9jYWxfY3MgPSAwO1xuICAgICAgaWYgKGMxICE9IGMyKSB7XG4gICAgICAgIGMxID0gYzIgPSBNYXRoLm1heChjMSxjMik7IC8vIHVzaW5nIG1heCB0byBieXBhc3MgdGhlIG5lZWQgZm9yIGNvbXB1dGVyIHRyYW5zcG9zaXRpb25zICgnYWInIHZzICdiYScpXG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1heE9mZnNldDsgaSsrKSB7XG4gICAgICAgIGlmICgoYzEgKyBpIDwgbDEpICYmIChzMS5jaGFyQXQoYzEgKyBpKSA9PT0gczIuY2hhckF0KGMyKSkpIHtcbiAgICAgICAgICBjMSArPSBpO1xuICAgICAgICAgIGxvY2FsX2NzKys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChjMiArIGkgPCBsMikgJiYgKHMxLmNoYXJBdChjMSkgPT09IHMyLmNoYXJBdChjMiArIGkpKSkge1xuICAgICAgICAgIGMyICs9IGk7XG4gICAgICAgICAgbG9jYWxfY3MrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjMSsrO1xuICAgIGMyKys7XG4gIH1cbiAgbGNzcyArPSBsb2NhbF9jcztcbiAgcmV0dXJuIE1hdGgucm91bmQoTWF0aC5tYXgobDEsIGwyKSAtIGxjc3MpO1xufVxuXG5leHBvcnRzLmJpbmQgPSBiaW5kO1xuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGU7XG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG5leHBvcnRzLnVuYW5zaSA9IHVuYW5zaTtcbmV4cG9ydHMuZG9Db2xvcnMgPSBkb0NvbG9ycztcbmV4cG9ydHMuc2lmdDQgPSBzaWZ0NDtcbiIsInZhciBhc3MgPSByZXF1aXJlKCcuL2xpYi9hc3MnKTtcbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vbGliL2NoYWluJyk7XG52YXIgQXNzRXJyb3IgPSByZXF1aXJlKCcuL2xpYi9lcnJvcicpO1xudmFyIHNob3VsZCA9IHJlcXVpcmUoJy4vbGliL3Nob3VsZCcpO1xudmFyIHBhdGNoZXMgPSByZXF1aXJlKCcuL2xpYi9wYXRjaGVzJyk7XG5cbi8vIFJlZ2lzdGVyIHRoZSBkZWZhdWx0IG1hdGNoZXJzXG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9jb3JlJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9jb29yZGluYXRpb24nKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL3F1YW50aWZpZXJzJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9wcm9taXNlJyk7XG5cblxuLy8gQnVuZGxlIHNvbWUgb2YgdGhlIGludGVybmFsIHN0dWZmIHdpdGggdGhlIGFzcyBmdW5jdGlvblxuYXNzLkNoYWluID0gQ2hhaW47XG5hc3MuRXJyb3IgPSBBc3NFcnJvcjtcbmFzcy5wYXRjaGVzID0gcGF0Y2hlcztcblxuLy8gRm9yd2FyZCB0aGUgc2hvdWxkIGluc3RhbGxlclxuLy8gTm90ZTogbWFrZSB0aGVtIGFyaXR5LTAgdG8gYWxsb3cgYmVmb3JlRWFjaChhc3Muc2hvdWxkKSBpbiBNb2NoYVxuYXNzLnNob3VsZCA9IGZ1bmN0aW9uICgvKiBuYW1lICovKSB7XG4gIHNob3VsZChhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IHVuZGVmaW5lZCk7XG4gIHJldHVybiBhc3M7XG59O1xuYXNzLnNob3VsZC5yZXN0b3JlID0gZnVuY3Rpb24gKC8qIG5hbWUgKi8pIHtcbiAgc2hvdWxkLnJlc3RvcmUoYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQpO1xuICByZXR1cm4gYXNzO1xufTtcblxuXG4vLyBQYXRjaCB0aGlyZCBwYXJ0eSBsaWJyYXJpZXMgdG8gdW5kZXJzdGFuZCBhYm91dCBhc3MtZXJ0IGV4cHJlc3Npb25zLiBXZVxuLy8gZGVwZW5kIG9uIHBhdGNoaW5nIGxvZGFzaCBmb3IgdGhlIGxpYnJhcnkgdG8gd29yayBjb3JyZWN0bHksIGhvd2V2ZXIgdGhlXG4vLyByZXN0IGFyZSBvcHRpb25hbC5cbnBhdGNoZXMubG9kYXNoKCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKSk7XG5cbmlmIChnbG9iYWwuc2lub24gJiYgZ2xvYmFsLnNpbm9uLm1hdGNoKSB7XG4gIHBhdGNoZXMuc2lub24oZ2xvYmFsLnNpbm9uKTtcbn0gZWxzZSBpZiAocmVxdWlyZS5yZXNvbHZlICYmIHJlcXVpcmUucmVzb2x2ZSgnc2lub24nKSkge1xuICBwYXRjaGVzLnNpbm9uKCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LnNpbm9uIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5zaW5vbiA6IG51bGwpKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzcztcbiIsbnVsbCwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuTXV0YXRpb25PYnNlcnZlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG5cbiAgICBpZiAoY2FuTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICB2YXIgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlTGlzdCA9IHF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcXVldWVMaXN0LmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGhpZGRlbkRpdiwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBoaWRkZW5EaXYuc2V0QXR0cmlidXRlKCd5ZXMnLCAnbm8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIi8vIEVtdWxhdGVzIFY4J3MgQ2FsbFNpdGUgb2JqZWN0IGZyb20gYSBzdGFja3RyYWNlLmpzIGZyYW1lIG9iamVjdFxuXG5mdW5jdGlvbiBDYWxsU2l0ZSAoZnJhbWUpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENhbGxTaXRlKSkge1xuICAgIHJldHVybiBuZXcgQ2FsbFNpdGUoZnJhbWUpO1xuICB9XG4gIHRoaXMuZnJhbWUgPSBmcmFtZTtcbn07XG5cbkNhbGxTaXRlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoe1xuICBnZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUubGluZU51bWJlcjtcbiAgfSxcbiAgZ2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuY29sdW1uTnVtYmVyO1xuICB9LFxuICBnZXRGaWxlTmFtZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmZpbGVOYW1lO1xuICB9LFxuICBnZXRGdW5jdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmZ1bmN0aW9uO1xuICB9LFxuICBnZXRUaGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGdldFR5cGVOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGdldE1ldGhvZE5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5mcmFtZS5mdW5jdGlvbk5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmZyYW1lLmZ1bmN0aW9uTmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgZ2V0RnVuY3Rpb25OYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lO1xuICB9LFxuICBnZXRFdmFsT3JpZ2luOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGlzVG9wbGV2ZWw6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cbiAgfSxcbiAgaXNFdmFsOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXG4gIH0sXG4gIGlzTmF0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXG4gIH0sXG4gIGlzQ29uc3RydWN0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gL15uZXcoXFxzfCQpLy50ZXN0KHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lKTtcbiAgfSxcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbmFtZSA9IHRoaXMuZ2V0RnVuY3Rpb25OYW1lKCkgfHwgJzxhbm9ueW1vdXM+JztcbiAgICB2YXIgbG9jID0gdGhpcy5nZXRGaWxlTmFtZSgpICsgJzonICsgdGhpcy5nZXRMaW5lTnVtYmVyKCkgKyAnOicgKyB0aGlzLmdldENvbHVtbk51bWJlcigpXG4gICAgcmV0dXJuIG5hbWUgKyAnICgnICsgbG9jICsgJyknO1xuICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENhbGxTaXRlO1xuIiwidmFyIEVycm9yU3RhY2tQYXJzZXIgPSByZXF1aXJlKCdlcnJvci1zdGFjay1wYXJzZXInKTtcbnZhciBDYWxsU2l0ZSA9IHJlcXVpcmUoJy4vY2FsbC1zaXRlJyk7XG5cbi8vIEtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIGJ1aWx0aW4gZXJyb3IgY29uc3RydWN0b3JcbnZhciBOYXRpdmVFcnJvciA9IEVycm9yO1xuXG5cbmZ1bmN0aW9uIEZhaWx1cmUgKG1lc3NhZ2UsIHNmZikge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmFpbHVyZSkpIHtcbiAgICByZXR1cm4gbmV3IEZhaWx1cmUobWVzc2FnZSwgc2ZmIHx8IEZhaWx1cmUpO1xuICB9XG5cbiAgdGhpcy5zZmYgPSBzZmYgfHwgdGhpcy5jb25zdHJ1Y3RvcjtcblxuICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXG4gIC8vIEdlbmVyYXRlIGEgZ2V0dGVyIGZvciB0aGUgZnJhbWVzLCB0aGlzIGVuc3VyZXMgdGhhdCB3ZSBkbyBhcyBsaXR0bGUgd29ya1xuICAvLyBhcyBwb3NzaWJsZSB3aGVuIGluc3RhbnRpYXRpbmcgdGhlIGVycm9yLCBkZWZlcnJpbmcgdGhlIGV4cGVuc2l2ZSBzdGFja1xuICAvLyBtYW5nbGluZyBvcGVyYXRpb25zIHVudGlsIHRoZSAuc3RhY2sgcHJvcGVydHkgaXMgYWN0dWFsbHkgcmVxdWVzdGVkLlxuICB0aGlzLl9nZXRGcmFtZXMgPSBtYWtlRnJhbWVzR2V0dGVyKHRoaXMuc2ZmKTtcblxuICAvLyBPbiBFUzUgZW5naW5lcyB3ZSB1c2Ugb25lLXRpbWUgZ2V0dGVycyB0byBhY3R1YWxseSBkZWZlciB0aGUgZXhwZW5zaXZlXG4gIC8vIG9wZXJhdGlvbnMgKGRlZmluZWQgaW4gdGhlIHByb3RvdHlwZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucykgd2hpbGUgbGVnYWN5XG4gIC8vIGVuZ2luZXMgd2lsbCBzaW1wbHkgZG8gYWxsIHRoZSB3b3JrIHVwIGZyb250LlxuICBpZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMuZnJhbWVzID0gdW53aW5kKHRoaXMuX2dldEZyYW1lcygpKTtcbiAgICB0aGlzLl9nZXRGcmFtZXModHJ1ZSk7XG4gICAgdGhpcy5fZ2V0RnJhbWVzID0gbnVsbDtcbiAgICB0aGlzLnN0YWNrID0gdGhpcy5nZW5lcmF0ZVN0YWNrVHJhY2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufVxuXG4vLyBTZXQgRlJBTUVfRU1QVFkgdG8gbnVsbCB0byBkaXNhYmxlIGFueSBzb3J0IG9mIHNlcGFyYXRvclxuRmFpbHVyZS5GUkFNRV9FTVBUWSA9ICcgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nO1xuRmFpbHVyZS5GUkFNRV9QUkVGSVggPSAnICBhdCAnO1xuXG4vLyBCeSBkZWZhdWx0IHdlIGVuYWJsZSB0cmFja2luZyBmb3IgYXN5bmMgc3RhY2sgdHJhY2VzXG5GYWlsdXJlLlRSQUNLID0gdHJ1ZTtcblxuXG4vLyBIZWxwZXIgdG8gb2J0YWluIHRoZSBjdXJyZW50IHN0YWNrIHRyYWNlXG52YXIgZ2V0RXJyb3JXaXRoU3RhY2sgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgTmF0aXZlRXJyb3I7XG59O1xuLy8gU29tZSBlbmdpbmVzIGRvIG5vdCBnZW5lcmF0ZSB0aGUgLnN0YWNrIHByb3BlcnR5IHVudGlsIGl0J3MgdGhyb3duXG5pZiAoIWdldEVycm9yV2l0aFN0YWNrKCkuc3RhY2spIHtcbiAgZ2V0RXJyb3JXaXRoU3RhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHsgdGhyb3cgbmV3IE5hdGl2ZUVycm9yIH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGUgfTtcbiAgfTtcbn1cblxuLy8gVHJpbSBmcmFtZXMgdW5kZXIgdGhlIHByb3ZpZGVkIHN0YWNrIGZpcnN0IGZ1bmN0aW9uXG5mdW5jdGlvbiB0cmltKGZyYW1lcywgc2ZmKSB7XG4gIHZhciBmbiwgbmFtZSA9IHNmZi5uYW1lO1xuICBmb3IgKHZhciBpPTA7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBmbiA9IGZyYW1lc1tpXS5nZXRGdW5jdGlvbigpO1xuICAgIGlmIChmbiAmJiBmbiA9PT0gc2ZmIHx8IG5hbWUgJiYgbmFtZSA9PT0gZnJhbWVzW2ldLmdldEZ1bmN0aW9uTmFtZSgpKSB7XG4gICAgICByZXR1cm4gZnJhbWVzLnNsaWNlKGkgKyAxKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZyYW1lcztcbn1cblxuZnVuY3Rpb24gdW53aW5kIChmcmFtZXMpIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gIGZvciAodmFyIGk9MCwgZm47IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBmbiA9IGZyYW1lc1tpXS5nZXRGdW5jdGlvbigpO1xuXG4gICAgaWYgKCFmbiB8fCAhZm5bJ2ZhaWx1cmU6aWdub3JlJ10pIHtcbiAgICAgIHJlc3VsdC5wdXNoKGZyYW1lc1tpXSk7XG4gICAgfVxuXG4gICAgaWYgKGZuICYmIGZuWydmYWlsdXJlOmZyYW1lcyddKSB7XG4gICAgICBpZiAoRmFpbHVyZS5GUkFNRV9FTVBUWSkge1xuICAgICAgICByZXN1bHQucHVzaChudWxsKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2FsbCB0aGUgZ2V0dGVyIGFuZCBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSByZXN1bHQgaW4gY2FzZSB3ZSBoYXZlIHRvXG4gICAgICAvLyB1bndpbmQgdGhlIHNhbWUgZnVuY3Rpb24gYW5vdGhlciB0aW1lLlxuICAgICAgLy8gVE9ETzogTWFrZSBzdXJlIGtlZXBpbmcgYSByZWZlcmVuY2UgdG8gdGhlIGZyYW1lcyBkb2Vzbid0IGNyZWF0ZSBsZWFrc1xuICAgICAgaWYgKHR5cGVvZiBmblsnZmFpbHVyZTpmcmFtZXMnXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgZ2V0dGVyID0gZm5bJ2ZhaWx1cmU6ZnJhbWVzJ107XG4gICAgICAgIGZuWydmYWlsdXJlOmZyYW1lcyddID0gbnVsbDtcbiAgICAgICAgZm5bJ2ZhaWx1cmU6ZnJhbWVzJ10gPSBnZXR0ZXIoKTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCB1bndpbmQoZm5bJ2ZhaWx1cmU6ZnJhbWVzJ10pKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIFJlY2VpdmVyIGZvciB0aGUgZnJhbWVzIGluIGEgLnN0YWNrIHByb3BlcnR5IGZyb20gY2FwdHVyZVN0YWNrVHJhY2VcbnZhciBWOEZSQU1FUyA9IHt9O1xuXG4vLyBWOCBjb2RlIHBhdGggZm9yIGdlbmVyYXRpbmcgYSBmcmFtZXMgZ2V0dGVyXG5mdW5jdGlvbiBtYWtlRnJhbWVzR2V0dGVyVjggKHNmZikge1xuICBOYXRpdmVFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShWOEZSQU1FUywgc2ZmIHx8IG1ha2VGcmFtZXNHZXR0ZXJWOCk7XG4gIHNmZiA9IG51bGw7XG4gIHZhciBmcmFtZXMgPSBWOEZSQU1FUy5zdGFjaztcbiAgVjhGUkFNRVMuc3RhY2sgPSBudWxsOyAgLy8gSU1QT1JUQU5UOiBUaGlzIGlzIG5lZWRlZCB0byBhdm9pZCBsZWFrcyEhIVxuICByZXR1cm4gZnVuY3Rpb24gKGNsZWFudXApIHtcbiAgICB2YXIgcmVzdWx0ID0gZnJhbWVzO1xuICAgIC8vIENsZWFuIHVwIGNsb3N1cmUgdmFyaWFibGVzIHRvIGhlbHAgR0NcbiAgICBmcmFtZXMgPSBudWxsO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG5cbi8vIG5vbi1WOCBjb2RlIHBhdGggZm9yIGdlbmVyYXRpbmcgYSBmcmFtZXMgZ2V0dGVyXG5mdW5jdGlvbiBtYWtlRnJhbWVzR2V0dGVyQ29tcGF0IChzZmYpIHtcbiAgLy8gT2J0YWluIGEgc3RhY2sgdHJhY2UgYXQgdGhlIGN1cnJlbnQgcG9pbnRcbiAgdmFyIGVycm9yID0gZ2V0RXJyb3JXaXRoU3RhY2soKTtcblxuICAvLyBXYWxrIHRoZSBjYWxsZXIgY2hhaW4gdG8gYW5ub3RhdGUgdGhlIHN0YWNrIHdpdGggZnVuY3Rpb24gcmVmZXJlbmNlc1xuICAvLyBHaXZlbiB0aGUgbGltaXRhdGlvbnMgaW1wb3NlZCBieSBFUzUgXCJzdHJpY3QgbW9kZVwiIGl0J3Mgbm90IHBvc3NpYmxlXG4gIC8vIHRvIG9idGFpbiByZWZlcmVuY2VzIHRvIGZ1bmN0aW9ucyBiZXlvbmQgb25lIHRoYXQgaXMgZGVmaW5lZCBpbiBzdHJpY3RcbiAgLy8gbW9kZS4gQWxzbyBub3RlIHRoYXQgYW55IGtpbmQgb2YgcmVjdXJzaW9uIHdpbGwgbWFrZSB0aGUgd2Fsa2VyIHVuYWJsZVxuICAvLyB0byBnbyBwYXN0IGl0LlxuICB2YXIgY2FsbGVyID0gYXJndW1lbnRzLmNhbGxlZTtcbiAgdmFyIGZ1bmN0aW9ucyA9IFtnZXRFcnJvcldpdGhTdGFja107XG4gIGZvciAodmFyIGk9MDsgY2FsbGVyICYmIGkgPCAxMDsgaSsrKSB7XG4gICAgZnVuY3Rpb25zLnB1c2goY2FsbGVyKTtcbiAgICBpZiAoY2FsbGVyLmNhbGxlciA9PT0gY2FsbGVyKSBicmVhaztcbiAgICBjYWxsZXIgPSBjYWxsZXIuY2FsbGVyO1xuICB9XG4gIGNhbGxlciA9IG51bGw7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChjbGVhbnVwKSB7XG4gICAgdmFyIGZyYW1lcyA9IG51bGw7XG5cbiAgICBpZiAoIWNsZWFudXApIHtcbiAgICAgIC8vIFBhcnNlIHRoZSBzdGFjayB0cmFjZVxuICAgICAgZnJhbWVzID0gRXJyb3JTdGFja1BhcnNlci5wYXJzZShlcnJvcik7XG4gICAgICAvLyBBdHRhY2ggZnVuY3Rpb24gcmVmZXJlbmNlcyB0byB0aGUgZnJhbWVzIChza2lwcGluZyB0aGUgbWFrZXIgZnJhbWVzKVxuICAgICAgLy8gYW5kIGNyZWF0aW5nIENhbGxTaXRlIG9iamVjdHMgZm9yIGVhY2ggb25lLlxuICAgICAgZm9yICh2YXIgaT0yOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZyYW1lc1tpXS5mdW5jdGlvbiA9IGZ1bmN0aW9uc1tpXTtcbiAgICAgICAgZnJhbWVzW2ldID0gbmV3IENhbGxTaXRlKGZyYW1lc1tpXSk7XG4gICAgICB9XG5cbiAgICAgIGZyYW1lcyA9IHRyaW0oZnJhbWVzLnNsaWNlKDIpLCBzZmYpO1xuICAgIH1cblxuICAgIC8vIENsZWFuIHVwIGNsb3N1cmUgdmFyaWFibGVzIHRvIGhlbHAgR0NcbiAgICBzZmYgPSBudWxsO1xuICAgIGVycm9yID0gbnVsbDtcbiAgICBmdW5jdGlvbnMgPSBudWxsO1xuXG4gICAgcmV0dXJuIGZyYW1lcztcbiAgfTtcbn1cblxuLy8gR2VuZXJhdGVzIGEgZ2V0dGVyIGZvciB0aGUgY2FsbCBzaXRlIGZyYW1lc1xuLy8gVE9ETzogSWYgd2Ugb2JzZXJ2ZSBsZWFrcyB3aXRoIGNvbXBsZXggdXNlIGNhc2VzIChkdWUgdG8gY2xvc3VyZSBzY29wZXMpXG4vLyAgICAgICB3ZSBjYW4gZ2VuZXJhdGUgaGVyZSBvdXIgY29tcGF0IENhbGxTaXRlIG9iamVjdHMgc3RvcmluZyB0aGUgZnVuY3Rpb24nc1xuLy8gICAgICAgc291cmNlIGNvZGUgaW5zdGVhZCBvZiBhbiBhY3R1YWwgcmVmZXJlbmNlIHRvIHRoZW0sIHRoYXQgc2hvdWxkIGhlbHBcbi8vICAgICAgIHRoZSBHQyBzaW5jZSB3ZSdsbCBiZSBqdXN0IGtlZXBpbmcgbGl0ZXJhbHMgYXJvdW5kLlxudmFyIG1ha2VGcmFtZXNHZXR0ZXIgPSB0eXBlb2YgTmF0aXZlRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgID8gbWFrZUZyYW1lc0dldHRlclY4XG4gICAgICAgICAgICAgICAgICAgICA6IG1ha2VGcmFtZXNHZXR0ZXJDb21wYXQ7XG5cblxuLy8gT3ZlcnJpZGUgVjggc3RhY2sgdHJhY2UgYnVpbGRlciB0byBpbmplY3Qgb3VyIGxvZ2ljXG52YXIgb2xkUHJlcGFyZVN0YWNrVHJhY2UgPSBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZTtcbkVycm9yLnByZXBhcmVTdGFja1RyYWNlID0gZnVuY3Rpb24gKGVycm9yLCBmcmFtZXMpIHtcbiAgLy8gV2hlbiBjYWxsZWQgZnJvbSBtYWtlRnJhbWVzR2V0dGVyIHdlIGp1c3Qgd2FudCB0byBvYnRhaW4gdGhlIGZyYW1lc1xuICBpZiAoZXJyb3IgPT09IFY4RlJBTUVTKSB7XG4gICAgcmV0dXJuIGZyYW1lcztcbiAgfVxuXG4gIC8vIEZvcndhcmQgdG8gYW55IHByZXZpb3VzbHkgZGVmaW5lZCBiZWhhdmlvdXJcbiAgaWYgKG9sZFByZXBhcmVTdGFja1RyYWNlKSB7XG4gICAgcmV0dXJuIG9sZFByZXBhcmVTdGFja1RyYWNlLmNhbGwoRXJyb3IsIGVycm9yLCBmcmFtZXMpO1xuICB9XG5cbiAgLy8gRW11bGF0ZSBkZWZhdWx0IGJlaGF2aW91ciAod2l0aCBsb25nLXRyYWNlcylcbiAgcmV0dXJuIEZhaWx1cmUucHJvdG90eXBlLnByZXBhcmVTdGFja1RyYWNlLmNhbGwoZXJyb3IsIHVud2luZChmcmFtZXMpKTtcbn07XG5cbi8vIEF0dGFjaCBhIG5ldyBleGNsdXNpb24gcHJlZGljYXRlIGZvciBmcmFtZXNcbmZ1bmN0aW9uIGV4Y2x1ZGUgKGN0b3IsIHByZWRpY2F0ZSkge1xuICB2YXIgZm4gPSBwcmVkaWNhdGU7XG5cbiAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgZm4gPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICAgIHJldHVybiAtMSAhPT0gZnJhbWUuZ2V0RmlsZU5hbWUoKS5pbmRleE9mKHByZWRpY2F0ZSk7XG4gICAgfTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcHJlZGljYXRlLnRlc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICBmbiA9IGZ1bmN0aW9uIChmcmFtZSkge1xuICAgICAgcmV0dXJuIHByZWRpY2F0ZS50ZXN0KGZyYW1lLmdldEZpbGVOYW1lKCkpO1xuICAgIH07XG4gIH1cblxuICBjdG9yLmV4Y2x1ZGVzLnB1c2goZm4pO1xufVxuXG4vLyBFeHBvc2UgdGhlIGZpbHRlciBpbiB0aGUgcm9vdCBGYWlsdXJlIHR5cGVcbkZhaWx1cmUuZXhjbHVkZXMgPSBbXTtcbkZhaWx1cmUuZXhjbHVkZSA9IGZ1bmN0aW9uIEZhaWx1cmVfZXhjbHVkZSAocHJlZGljYXRlKSB7XG4gIGV4Y2x1ZGUoRmFpbHVyZSwgcHJlZGljYXRlKTtcbn07XG5cbi8vIEF0dGFjaCBhIGZyYW1lcyBnZXR0ZXIgdG8gdGhlIGZ1bmN0aW9uIHNvIHdlIGNhbiByZS1jb25zdHJ1Y3QgYXN5bmMgc3RhY2tzLlxuLy9cbi8vIE5vdGUgdGhhdCB0aGlzIGp1c3QgYXVnbWVudHMgdGhlIGZ1bmN0aW9uIHdpdGggdGhlIG5ldyBwcm9wZXJ0eSwgaXQgZG9lc24ndFxuLy8gY3JlYXRlIGEgd3JhcHBlciBldmVyeSB0aW1lIGl0J3MgY2FsbGVkLCBzbyB1c2luZyBpdCBtdWx0aXBsZSB0aW1lcyBvbiB0aGVcbi8vIHNhbWUgZnVuY3Rpb24gd2lsbCBpbmRlZWQgb3ZlcndyaXRlIHRoZSBwcmV2aW91cyB0cmFja2luZyBpbmZvcm1hdGlvbi4gVGhpc1xuLy8gaXMgaW50ZW5kZWQgc2luY2UgaXQncyBmYXN0ZXIgYW5kIG1vcmUgaW1wb3J0YW50bHkgZG9lc24ndCBicmVhayBzb21lIEFQSXNcbi8vIHVzaW5nIGNhbGxiYWNrIHJlZmVyZW5jZXMgdG8gdW5yZWdpc3RlciB0aGVtIGZvciBpbnN0YW5jZS5cbi8vIFdoZW4geW91IHdhbnQgdG8gdXNlIHRoZSBzYW1lIGZ1bmN0aW9uIHdpdGggZGlmZmVyZW50IHRyYWNraW5nIGluZm9ybWF0aW9uXG4vLyBqdXN0IHVzZSBGYWlsdXJlLndyYXAoKS5cbi8vXG4vLyBUaGUgdHJhY2tpbmcgY2FuIGJlIGdsb2JhbGx5IGRpc2FibGVkIGJ5IHNldHRpbmcgRmFpbHVyZS5UUkFDSyB0byBmYWxzZVxuRmFpbHVyZS50cmFjayA9IGZ1bmN0aW9uIEZhaWx1cmVfdHJhY2sgKGZuLCBzZmYpIHtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIC8vIENsZWFuIHVwIHByZXZpb3VzIGZyYW1lcyB0byBoZWxwIHRoZSBHQ1xuICBpZiAodHlwZW9mIGZuWydmYWlsdXJlOmZyYW1lcyddID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm5bJ2ZhaWx1cmU6ZnJhbWVzJ10odHJ1ZSk7XG4gIH1cblxuICBpZiAoRmFpbHVyZS5UUkFDSykge1xuICAgIGZuWydmYWlsdXJlOmZyYW1lcyddID0gbnVsbDtcbiAgICBmblsnZmFpbHVyZTpmcmFtZXMnXSA9IG1ha2VGcmFtZXNHZXR0ZXIoc2ZmIHx8IEZhaWx1cmVfdHJhY2spO1xuICB9XG5cbiAgcmV0dXJuIGZuO1xufTtcblxuLy8gV3JhcHMgdGhlIGZ1bmN0aW9uIGJlZm9yZSBhbm5vdGF0aW5nIGl0IHdpdGggdHJhY2tpbmcgaW5mb3JtYXRpb24sIHRoaXNcbi8vIGFsbG93cyB0byB0cmFjayBtdWx0aXBsZSBzY2hlZHVsbGluZ3Mgb2YgYSBzaW5nbGUgZnVuY3Rpb24uXG5GYWlsdXJlLndyYXAgPSBmdW5jdGlvbiBGYWlsdXJlX3dyYXAgKGZuKSB7XG4gIHZhciB3cmFwcGVyID0gRmFpbHVyZS5pZ25vcmUoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gRmFpbHVyZS50cmFjayh3cmFwcGVyLCBGYWlsdXJlX3dyYXApO1xufTtcblxuLy8gTWFyayBhIGZ1bmN0aW9uIHRvIGJlIGlnbm9yZWQgd2hlbiBnZW5lcmF0aW5nIHN0YWNrIHRyYWNlc1xuRmFpbHVyZS5pZ25vcmUgPSBmdW5jdGlvbiBGYWlsdXJlX2lnbm9yZSAoZm4pIHtcbiAgZm5bJ2ZhaWx1cmU6aWdub3JlJ10gPSB0cnVlO1xuICByZXR1cm4gZm47XG59O1xuXG5GYWlsdXJlLnNldFRpbWVvdXQgPSBmdW5jdGlvbiBGYWlsdXJlX3NldFRpbWVvdXQgKCkge1xuICBhcmd1bWVudHNbMF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1swXSwgRmFpbHVyZV9zZXRUaW1lb3V0KTtcbiAgcmV0dXJuIHNldFRpbWVvdXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn07XG5cbkZhaWx1cmUubmV4dFRpY2sgPSBmdW5jdGlvbiBGYWlsdXJlX25leHRUaWNrICgpIHtcbiAgYXJndW1lbnRzWzBdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbMF0sIEZhaWx1cmVfbmV4dFRpY2spO1xuICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljay5hcHBseShwcm9jZXNzLCBhcmd1bWVudHMpO1xufTtcblxuRmFpbHVyZS5wYXRjaCA9IGZ1bmN0aW9uIEZhaWx1cmVfcGF0Y2gob2JqLCBuYW1lLCBpZHgpIHtcbiAgaWYgKG9iaiAmJiB0eXBlb2Ygb2JqW25hbWVdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdPYmplY3QgZG9lcyBub3QgaGF2ZSBhIFwiJyArIG5hbWUgKyAnXCIgbWV0aG9kJyk7XG4gIH1cblxuICB2YXIgb3JpZ2luYWwgPSBvYmpbbmFtZV07XG5cbiAgLy8gV2hlbiB0aGUgZXhhY3QgYXJndW1lbnQgaW5kZXggaXMgcHJvdmlkZWQgdXNlIGFuIG9wdGltaXplZCBjb2RlIHBhdGhcbiAgaWYgKHR5cGVvZiBpZHggPT09ICdudW1iZXInKSB7XG5cbiAgICBvYmpbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBhcmd1bWVudHNbaWR4XSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzW2lkeF0sIG9ialtuYW1lXSk7XG4gICAgICByZXR1cm4gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gIC8vIE90aGVyd2lzZSBkZXRlY3QgdGhlIGZ1bmN0aW9ucyB0byB0cmFjayBhdCBpbnZva2F0aW9uIHRpbWVcbiAgfSBlbHNlIHtcblxuICAgIG9ialtuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgYXJndW1lbnRzW2ldID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbaV0sIG9ialtuYW1lXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgfVxuXG4gIC8vIEF1Z21lbnQgdGhlIHdyYXBwZXIgd2l0aCBhbnkgcHJvcGVydGllcyBmcm9tIHRoZSBvcmlnaW5hbFxuICBmb3IgKHZhciBrIGluIG9yaWdpbmFsKSBpZiAob3JpZ2luYWwuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICBvYmpbbmFtZV1ba10gPSBvcmlnaW5hbFtrXTtcbiAgfVxuXG4gIHJldHVybiBvYmpbbmFtZV07XG59O1xuXG4vLyBIZWxwZXIgdG8gY3JlYXRlIG5ldyBGYWlsdXJlIHR5cGVzXG5GYWlsdXJlLmNyZWF0ZSA9IGZ1bmN0aW9uIChuYW1lLCBwcm9wcykge1xuICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEZhaWx1cmUoJ0V4cGVjdGVkIGEgbmFtZSBhcyBmaXJzdCBhcmd1bWVudCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3RvciAobWVzc2FnZSwgc2ZmKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZhaWx1cmUpKSB7XG4gICAgICByZXR1cm4gbmV3IGN0b3IobWVzc2FnZSwgc2ZmKTtcbiAgICB9XG4gICAgRmFpbHVyZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgLy8gQXVnbWVudCBjb25zdHJ1Y3RvclxuICBjdG9yLmV4Y2x1ZGVzID0gW107XG4gIGN0b3IuZXhjbHVkZSA9IGZ1bmN0aW9uIChwcmVkaWNhdGUpIHtcbiAgICBleGNsdWRlKGN0b3IsIHByZWRpY2F0ZSk7XG4gIH07XG5cbiAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEZhaWx1cmUucHJvdG90eXBlKTtcbiAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yO1xuICBjdG9yLnByb3RvdHlwZS5uYW1lID0gbmFtZTtcbiAgaWYgKHR5cGVvZiBwcm9wcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGN0b3IucHJvdG90eXBlLnByZXBhcmVTdGFja1RyYWNlID0gcHJvcHM7XG4gIH0gZWxzZSBpZiAocHJvcHMpIHtcbiAgICBPYmplY3Qua2V5cyhwcm9wcykuZm9yRWFjaChmdW5jdGlvbiAocHJvcCkge1xuICAgICAgY3Rvci5wcm90b3R5cGVbcHJvcF0gPSBwcm9wO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiBjdG9yO1xufTtcblxudmFyIGJ1aWx0aW5FcnJvclR5cGVzID0gW1xuICAnRXJyb3InLCAnVHlwZUVycm9yJywgJ1JhbmdlRXJyb3InLCAnUmVmZXJlbmNlRXJyb3InLCAnU3ludGF4RXJyb3InLFxuICAnRXZhbEVycm9yJywgJ1VSSUVycm9yJywgJ0ludGVybmFsRXJyb3InXG5dO1xudmFyIGJ1aWx0aW5FcnJvcnMgPSB7fTtcblxuRmFpbHVyZS5pbnN0YWxsID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcm9vdCA9IHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnID8gd2luZG93IDogZ2xvYmFsO1xuXG4gIGJ1aWx0aW5FcnJvclR5cGVzLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcbiAgICBpZiAocm9vdFt0eXBlXSAmJiAhYnVpbHRpbkVycm9yc1t0eXBlXSkge1xuICAgICAgYnVpbHRpbkVycm9yc1t0eXBlXSA9IHJvb3RbdHlwZV07XG4gICAgICByb290W3R5cGVdID0gRmFpbHVyZS5jcmVhdGUodHlwZSk7XG4gICAgfVxuICB9KTtcblxuICAvLyBBbGxvdyB1c2FnZTogdmFyIEZhaWx1cmUgPSByZXF1aXJlKCdmYWlsdXJlJykuaW5zdGFsbCgpXG4gIHJldHVybiBGYWlsdXJlO1xufTtcblxuRmFpbHVyZS51bmluc3RhbGwgPSBmdW5jdGlvbiAoKSB7XG4gIGJ1aWx0aW5FcnJvclR5cGVzLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcbiAgICByb290W3R5cGVdID0gYnVpbHRpbkVycm9yc1t0eXBlXSB8fCByb290W3R5cGVdO1xuICB9KTtcbn07XG5cblxudmFyIHByb3RvID0gRmFpbHVyZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSk7XG5wcm90by5jb25zdHJ1Y3RvciA9IEZhaWx1cmU7XG5cbnByb3RvLm5hbWUgPSAnRmFpbHVyZSc7XG5wcm90by5tZXNzYWdlID0gJyc7XG5cbmlmICh0eXBlb2YgT2JqZWN0LmRlZmluZVByb3BlcnR5ID09PSAnZnVuY3Rpb24nKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2ZyYW1lcycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFVzZSB0cmltbWluZyBqdXN0IGluIGNhc2UgdGhlIHNmZiB3YXMgZGVmaW5lZCBhZnRlciBjb25zdHJ1Y3RpbmdcbiAgICAgIHZhciBmcmFtZXMgPSB1bndpbmQodHJpbSh0aGlzLl9nZXRGcmFtZXMoKSwgdGhpcy5zZmYpKTtcblxuICAgICAgLy8gQ2FjaGUgbmV4dCBhY2Nlc3NlcyB0byB0aGUgcHJvcGVydHlcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZnJhbWVzJywge1xuICAgICAgICB2YWx1ZTogZnJhbWVzLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIC8vIENsZWFuIHVwIHRoZSBnZXR0ZXIgY2xvc3VyZVxuICAgICAgdGhpcy5fZ2V0RnJhbWVzID0gbnVsbDtcblxuICAgICAgcmV0dXJuIGZyYW1lcztcbiAgICB9XG4gIH0pO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ3N0YWNrJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVTdGFja1RyYWNlKCk7XG4gICAgfVxuICB9KTtcbn1cblxucHJvdG8uZ2VuZXJhdGVTdGFja1RyYWNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZXhjbHVkZXMgPSB0aGlzLmNvbnN0cnVjdG9yLmV4Y2x1ZGVzO1xuICB2YXIgaW5jbHVkZSwgZnJhbWVzID0gW107XG5cbiAgLy8gU3BlY2lmaWMgcHJvdG90eXBlcyBpbmhlcml0IHRoZSBleGNsdWRlcyBmcm9tIEZhaWx1cmVcbiAgaWYgKGV4Y2x1ZGVzICE9PSBGYWlsdXJlLmV4Y2x1ZGVzKSB7XG4gICAgZXhjbHVkZXMucHVzaC5hcHBseShleGNsdWRlcywgRmFpbHVyZS5leGNsdWRlcyk7XG4gIH1cblxuICAvLyBBcHBseSBmaWx0ZXJpbmdcbiAgZm9yICh2YXIgaT0wOyBpIDwgdGhpcy5mcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpbmNsdWRlID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5mcmFtZXNbaV0pIHtcbiAgICAgIGZvciAodmFyIGo9MDsgaW5jbHVkZSAmJiBqIDwgZXhjbHVkZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaW5jbHVkZSAmPSAhZXhjbHVkZXNbal0uY2FsbCh0aGlzLCB0aGlzLmZyYW1lc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICBmcmFtZXMucHVzaCh0aGlzLmZyYW1lc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXMucHJlcGFyZVN0YWNrVHJhY2UoZnJhbWVzKTtcbn07XG5cbnByb3RvLnByZXBhcmVTdGFja1RyYWNlID0gZnVuY3Rpb24gKGZyYW1lcykge1xuICB2YXIgbGluZXMgPSBbdGhpc107XG4gIGZvciAodmFyIGk9MDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBmcmFtZXNbaV0gPyBGYWlsdXJlLkZSQU1FX1BSRUZJWCArIGZyYW1lc1tpXSA6IEZhaWx1cmUuRlJBTUVfRU1QVFlcbiAgICApO1xuICB9XG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBGYWlsdXJlO1xuIiwidmFyIEZhaWx1cmUgPSByZXF1aXJlKCcuL2xpYi9mYWlsdXJlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmFpbHVyZTtcbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvLyBVbml2ZXJzYWwgTW9kdWxlIERlZmluaXRpb24gKFVNRCkgdG8gc3VwcG9ydCBBTUQsIENvbW1vbkpTL05vZGUuanMsIFJoaW5vLCBhbmQgYnJvd3NlcnMuXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicsIFsnc3RhY2tmcmFtZSddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnc3RhY2tmcmFtZScpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LkVycm9yU3RhY2tQYXJzZXIgPSBmYWN0b3J5KHJvb3QuU3RhY2tGcmFtZSk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyKFN0YWNrRnJhbWUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBFUzUgUG9seWZpbGxzXG4gICAgLy8gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L21hcFxuICAgIGlmICghQXJyYXkucHJvdG90eXBlLm1hcCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgICAgIHZhciBPID0gT2JqZWN0KHRoaXMpO1xuICAgICAgICAgICAgdmFyIGxlbiA9IE8ubGVuZ3RoID4+PiAwO1xuICAgICAgICAgICAgdmFyIFQ7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBUID0gdGhpc0FyZztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIEEgPSBuZXcgQXJyYXkobGVuKTtcbiAgICAgICAgICAgIHZhciBrID0gMDtcblxuICAgICAgICAgICAgd2hpbGUgKGsgPCBsZW4pIHtcbiAgICAgICAgICAgICAgICB2YXIga1ZhbHVlLCBtYXBwZWRWYWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoayBpbiBPKSB7XG4gICAgICAgICAgICAgICAgICAgIGtWYWx1ZSA9IE9ba107XG4gICAgICAgICAgICAgICAgICAgIG1hcHBlZFZhbHVlID0gY2FsbGJhY2suY2FsbChULCBrVmFsdWUsIGssIE8pO1xuICAgICAgICAgICAgICAgICAgICBBW2tdID0gbWFwcGVkVmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIEE7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbHRlclxuICAgIGlmICghQXJyYXkucHJvdG90eXBlLmZpbHRlcikge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24oY2FsbGJhY2svKiwgdGhpc0FyZyovKSB7XG4gICAgICAgICAgICB2YXIgdCA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBsZW4gPSB0Lmxlbmd0aCA+Pj4gMDtcblxuICAgICAgICAgICAgdmFyIHJlcyA9IFtdO1xuICAgICAgICAgICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHMubGVuZ3RoID49IDIgPyBhcmd1bWVudHNbMV0gOiB2b2lkIDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgaW4gdCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdmFsLCBpLCB0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2godmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQID0gL1xcUytcXDpcXGQrLztcbiAgICB2YXIgQ0hST01FX0lFX1NUQUNLX1JFR0VYUCA9IC9cXHMrYXQgLztcblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHaXZlbiBhbiBFcnJvciBvYmplY3QsIGV4dHJhY3QgdGhlIG1vc3QgaW5mb3JtYXRpb24gZnJvbSBpdC5cbiAgICAgICAgICogQHBhcmFtIGVycm9yIHtFcnJvcn1cbiAgICAgICAgICogQHJldHVybiBBcnJheVtTdGFja0ZyYW1lXVxuICAgICAgICAgKi9cbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVycm9yLnN0YWNrdHJhY2UgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBlcnJvclsnb3BlcmEjc291cmNlbG9jJ10gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYShlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yLnN0YWNrICYmIGVycm9yLnN0YWNrLm1hdGNoKENIUk9NRV9JRV9TVEFDS19SRUdFWFApKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VWOE9ySUUoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5zdGFjayAmJiBlcnJvci5zdGFjay5tYXRjaChGSVJFRk9YX1NBRkFSSV9TVEFDS19SRUdFWFApKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VGRk9yU2FmYXJpKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcGFyc2UgZ2l2ZW4gRXJyb3Igb2JqZWN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlcGFyYXRlIGxpbmUgYW5kIGNvbHVtbiBudW1iZXJzIGZyb20gYSBVUkwtbGlrZSBzdHJpbmcuXG4gICAgICAgICAqIEBwYXJhbSB1cmxMaWtlIFN0cmluZ1xuICAgICAgICAgKiBAcmV0dXJuIEFycmF5W1N0cmluZ11cbiAgICAgICAgICovXG4gICAgICAgIGV4dHJhY3RMb2NhdGlvbjogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkZXh0cmFjdExvY2F0aW9uKHVybExpa2UpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdXJsTGlrZS5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdmFyIGxhc3ROdW1iZXIgPSBsb2NhdGlvblBhcnRzLnBvcCgpO1xuICAgICAgICAgICAgdmFyIHBvc3NpYmxlTnVtYmVyID0gbG9jYXRpb25QYXJ0c1tsb2NhdGlvblBhcnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKCFpc05hTihwYXJzZUZsb2F0KHBvc3NpYmxlTnVtYmVyKSkgJiYgaXNGaW5pdGUocG9zc2libGVOdW1iZXIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmVOdW1iZXIgPSBsb2NhdGlvblBhcnRzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbbG9jYXRpb25QYXJ0cy5qb2luKCc6JyksIGxpbmVOdW1iZXIsIGxhc3ROdW1iZXJdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2xvY2F0aW9uUGFydHMuam9pbignOicpLCBsYXN0TnVtYmVyLCB1bmRlZmluZWRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlVjhPcklFOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZVY4T3JJRShlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLnN0YWNrLnNwbGl0KCdcXG4nKS5zbGljZSgxKS5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5zID0gbGluZS5yZXBsYWNlKC9eXFxzKy8sICcnKS5zcGxpdCgvXFxzKy8pLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdGhpcy5leHRyYWN0TG9jYXRpb24odG9rZW5zLnBvcCgpLnJlcGxhY2UoL1tcXChcXClcXHNdL2csICcnKSk7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9ICghdG9rZW5zWzBdIHx8IHRva2Vuc1swXSA9PT0gJ0Fub255bW91cycpID8gdW5kZWZpbmVkIDogdG9rZW5zWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsIHVuZGVmaW5lZCwgbG9jYXRpb25QYXJ0c1swXSwgbG9jYXRpb25QYXJ0c1sxXSwgbG9jYXRpb25QYXJ0c1syXSk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZUZGT3JTYWZhcmk6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlRkZPclNhZmFyaShlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLnN0YWNrLnNwbGl0KCdcXG4nKS5maWx0ZXIoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFsaW5lLm1hdGNoKEZJUkVGT1hfU0FGQVJJX1NUQUNLX1JFR0VYUCk7XG4gICAgICAgICAgICB9LCB0aGlzKS5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5zID0gbGluZS5zcGxpdCgnQCcpO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdGhpcy5leHRyYWN0TG9jYXRpb24odG9rZW5zLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gdG9rZW5zLnNoaWZ0KCkgfHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsIHVuZGVmaW5lZCwgbG9jYXRpb25QYXJ0c1swXSwgbG9jYXRpb25QYXJ0c1sxXSwgbG9jYXRpb25QYXJ0c1syXSk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZU9wZXJhOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhKGUpIHtcbiAgICAgICAgICAgIGlmICghZS5zdGFja3RyYWNlIHx8IChlLm1lc3NhZ2UuaW5kZXhPZignXFxuJykgPiAtMSAmJlxuICAgICAgICAgICAgICAgIGUubWVzc2FnZS5zcGxpdCgnXFxuJykubGVuZ3RoID4gZS5zdGFja3RyYWNlLnNwbGl0KCdcXG4nKS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYTkoZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFlLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYTEwKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9wZXJhMTEoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VPcGVyYTk6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmE5KGUpIHtcbiAgICAgICAgICAgIHZhciBsaW5lUkUgPSAvTGluZSAoXFxkKykuKnNjcmlwdCAoPzppbiApPyhcXFMrKS9pO1xuICAgICAgICAgICAgdmFyIGxpbmVzID0gZS5tZXNzYWdlLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDIsIGxlbiA9IGxpbmVzLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbGluZVJFLmV4ZWMobGluZXNbaV0pO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgU3RhY2tGcmFtZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgbWF0Y2hbMl0sIG1hdGNoWzFdKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlT3BlcmExMDogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYTEwKGUpIHtcbiAgICAgICAgICAgIHZhciBsaW5lUkUgPSAvTGluZSAoXFxkKykuKnNjcmlwdCAoPzppbiApPyhcXFMrKSg/OjogSW4gZnVuY3Rpb24gKFxcUyspKT8kL2k7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBlLnN0YWNrdHJhY2Uuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBsaW5lUkUuZXhlYyhsaW5lc1tpXSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBTdGFja0ZyYW1lKG1hdGNoWzNdIHx8IHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBtYXRjaFsyXSwgbWF0Y2hbMV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gT3BlcmEgMTAuNjUrIEVycm9yLnN0YWNrIHZlcnkgc2ltaWxhciB0byBGRi9TYWZhcmlcbiAgICAgICAgcGFyc2VPcGVyYTExOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhMTEoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci5zdGFjay5zcGxpdCgnXFxuJykuZmlsdGVyKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhbGluZS5tYXRjaChGSVJFRk9YX1NBRkFSSV9TVEFDS19SRUdFWFApICYmXG4gICAgICAgICAgICAgICAgICAgICFsaW5lLm1hdGNoKC9eRXJyb3IgY3JlYXRlZCBhdC8pO1xuICAgICAgICAgICAgfSwgdGhpcykubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VucyA9IGxpbmUuc3BsaXQoJ0AnKTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHRoaXMuZXh0cmFjdExvY2F0aW9uKHRva2Vucy5wb3AoKSk7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uQ2FsbCA9ICh0b2tlbnMuc2hpZnQoKSB8fCAnJyk7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IGZ1bmN0aW9uQ2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLzxhbm9ueW1vdXMgZnVuY3Rpb24oOiAoXFx3KykpPz4vLCAnJDInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKFteXFwpXSpcXCkvZywgJycpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB2YXIgYXJnc1JhdztcbiAgICAgICAgICAgICAgICBpZiAoZnVuY3Rpb25DYWxsLm1hdGNoKC9cXCgoW15cXCldKilcXCkvKSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzUmF3ID0gZnVuY3Rpb25DYWxsLnJlcGxhY2UoL15bXlxcKF0rXFwoKFteXFwpXSopXFwpJC8sICckMScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IChhcmdzUmF3ID09PSB1bmRlZmluZWQgfHwgYXJnc1JhdyA9PT0gJ1thcmd1bWVudHMgbm90IGF2YWlsYWJsZV0nKSA/IHVuZGVmaW5lZCA6IGFyZ3NSYXcuc3BsaXQoJywnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN0YWNrRnJhbWUoZnVuY3Rpb25OYW1lLCBhcmdzLCBsb2NhdGlvblBhcnRzWzBdLCBsb2NhdGlvblBhcnRzWzFdLCBsb2NhdGlvblBhcnRzWzJdKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgfTtcbn0pKTtcblxuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcywgUmhpbm8sIGFuZCBicm93c2Vycy5cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5TdGFja0ZyYW1lID0gZmFjdG9yeSgpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBmdW5jdGlvbiBfaXNOdW1iZXIobikge1xuICAgICAgICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIFN0YWNrRnJhbWUoZnVuY3Rpb25OYW1lLCBhcmdzLCBmaWxlTmFtZSwgbGluZU51bWJlciwgY29sdW1uTnVtYmVyKSB7XG4gICAgICAgIGlmIChmdW5jdGlvbk5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRGdW5jdGlvbk5hbWUoZnVuY3Rpb25OYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEFyZ3MoYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbGVOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RmlsZU5hbWUoZmlsZU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaW5lTnVtYmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TGluZU51bWJlcihsaW5lTnVtYmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sdW1uTnVtYmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0Q29sdW1uTnVtYmVyKGNvbHVtbk51bWJlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBTdGFja0ZyYW1lLnByb3RvdHlwZSA9IHtcbiAgICAgICAgZ2V0RnVuY3Rpb25OYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mdW5jdGlvbk5hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldEZ1bmN0aW9uTmFtZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHRoaXMuZnVuY3Rpb25OYW1lID0gU3RyaW5nKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEFyZ3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFyZ3M7XG4gICAgICAgIH0sXG4gICAgICAgIHNldEFyZ3M6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHYpICE9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJncyBtdXN0IGJlIGFuIEFycmF5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFyZ3MgPSB2O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIE5PVEU6IFByb3BlcnR5IG5hbWUgbWF5IGJlIG1pc2xlYWRpbmcgYXMgaXQgaW5jbHVkZXMgdGhlIHBhdGgsXG4gICAgICAgIC8vIGJ1dCBpdCBzb21ld2hhdCBtaXJyb3JzIFY4J3MgSmF2YVNjcmlwdFN0YWNrVHJhY2VBcGlcbiAgICAgICAgLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC93aWtpL0phdmFTY3JpcHRTdGFja1RyYWNlQXBpXG4gICAgICAgIGdldEZpbGVOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWxlTmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0RmlsZU5hbWU6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVOYW1lID0gU3RyaW5nKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldExpbmVOdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpbmVOdW1iZXI7XG4gICAgICAgIH0sXG4gICAgICAgIHNldExpbmVOdW1iZXI6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAoIV9pc051bWJlcih2KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0xpbmUgTnVtYmVyIG11c3QgYmUgYSBOdW1iZXInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubGluZU51bWJlciA9IE51bWJlcih2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDb2x1bW5OdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbHVtbk51bWJlcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKCFfaXNOdW1iZXIodikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb2x1bW4gTnVtYmVyIG11c3QgYmUgYSBOdW1iZXInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY29sdW1uTnVtYmVyID0gTnVtYmVyKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSB0aGlzLmdldEZ1bmN0aW9uTmFtZSgpIHx8ICd7YW5vbnltb3VzfSc7XG4gICAgICAgICAgICB2YXIgYXJncyA9ICcoJyArICh0aGlzLmdldEFyZ3MoKSB8fCBbXSkuam9pbignLCcpICsgJyknO1xuICAgICAgICAgICAgdmFyIGZpbGVOYW1lID0gdGhpcy5nZXRGaWxlTmFtZSgpID8gKCdAJyArIHRoaXMuZ2V0RmlsZU5hbWUoKSkgOiAnJztcbiAgICAgICAgICAgIHZhciBsaW5lTnVtYmVyID0gX2lzTnVtYmVyKHRoaXMuZ2V0TGluZU51bWJlcigpKSA/ICgnOicgKyB0aGlzLmdldExpbmVOdW1iZXIoKSkgOiAnJztcbiAgICAgICAgICAgIHZhciBjb2x1bW5OdW1iZXIgPSBfaXNOdW1iZXIodGhpcy5nZXRDb2x1bW5OdW1iZXIoKSkgPyAoJzonICsgdGhpcy5nZXRDb2x1bW5OdW1iZXIoKSkgOiAnJztcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbk5hbWUgKyBhcmdzICsgZmlsZU5hbWUgKyBsaW5lTnVtYmVyICsgY29sdW1uTnVtYmVyO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBTdGFja0ZyYW1lO1xufSkpO1xuIl19
