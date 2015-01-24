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
        var result = false, length = props.length, key;
        while (length--) {
          key = props[length];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2Vycm9yLmpzIiwibGliL2V4cGVjdGF0aW9uLmpzIiwibGliL21hdGNoZXIuanMiLCJsaWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uLmpzIiwibGliL21hdGNoZXJzL2NvcmUuanMiLCJsaWIvbWF0Y2hlcnMvcHJvbWlzZS5qcyIsImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyIsImxpYi9wYXRjaGVzLmpzIiwibGliL3Jlc29sdmVycy5qcyIsImxpYi9zaG91bGQuanMiLCJsaWIvdXRpbC5qcyIsIm1haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9jYWxsLXNpdGUuanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9saWIvZmFpbHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL21haW4uanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9ub2RlX21vZHVsZXMvZXJyb3Itc3RhY2stcGFyc2VyL2Vycm9yLXN0YWNrLXBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL25vZGVfbW9kdWxlcy9lcnJvci1zdGFjay1wYXJzZXIvbm9kZV9tb2R1bGVzL3N0YWNrZnJhbWUvc3RhY2tmcmFtZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM5ekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzQ0E7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNWFBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciBNYXRjaGVyID0gcmVxdWlyZSgnLi9tYXRjaGVyJyk7XG52YXIgRXhwZWN0YXRpb24gPSByZXF1aXJlKCcuL2V4cGVjdGF0aW9uJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5cbnZhciBkZWZQcm9wID0gdXRpbC5iaW5kKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgT2JqZWN0KTtcblxuXG4vLyBQdWJsaWMgaW50ZXJmYWNlXG5mdW5jdGlvbiBhc3MgKHZhbHVlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBDaGFpbigpO1xuICB9XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpO1xufVxuXG4vLyBEZWZlcnJlZCBmYWN0b3J5XG5hc3MuXyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gbmV3IENoYWluKHZhbHVlKS5fO1xufTtcblxuLy8gR2xvYmFsIHJlZ2lzdHJ5IG9mIG1hdGNoZXJzICh1c2VkIGZvciBhc3MuaGVscClcbmFzcy5tYXRjaGVycyA9IFtdO1xuXG4vLyBhc3MuaGVscCBkdW1wcyB0aGUgaGVscCBvZiBlYWNoIG1hdGNoZXIgcmVnaXN0ZXJlZFxuZGVmUHJvcChhc3MsICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcyA9ICcnO1xuICAgIF8uZm9yRWFjaChhc3MubWF0Y2hlcnMsIGZ1bmN0aW9uIChtYXRjaGVyKSB7XG4gICAgICAvLyBUT0RPOiBUaGlzIGNhbiBiZSBuaWNlclxuICAgICAgdmFyIGZuID0gbWF0Y2hlci50ZXN0LnRvU3RyaW5nKCk7XG4gICAgICB2YXIgYXJncyA9IGZuLnJlcGxhY2UoL15mdW5jdGlvblxccypcXCgoW15cXCldKilcXClbXFxTXFxzXSovLCAnJDEnKTtcbiAgICAgIGFyZ3MgPSBhcmdzLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnRyaW0oKTsgfSk7XG4gICAgICBhcmdzLnNoaWZ0KCk7XG4gICAgICBmbiA9IGFyZ3MubGVuZ3RoID8gJyAoJyArIGFyZ3Muam9pbignLCAnKSArICcpJyA6ICcnO1xuXG4gICAgICBzICs9ICc+IC4nICsgbWF0Y2hlci5uYW1lICsgZm4gKyAnXFxuXFxuJztcbiAgICAgIHMgKz0gJyAgJyArIG1hdGNoZXIuaGVscC5yZXBsYWNlKC9cXG4vZywgJ1xcbiAgJyk7XG4gICAgICBzICs9ICdcXG5cXG4nO1xuICAgIH0pO1xuICAgIHJldHVybiBzO1xuICB9XG59KTtcblxuYXNzLm9rID0gZnVuY3Rpb24gKGNvbmQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBtZXNzYWdlID0gJ2V4cGVjdGVkIGEgdHJ1aXNoIHZhbHVlJztcbiAgfVxuICBhc3MuZGVzYyhtZXNzYWdlKS50cnV0aHkuYXNzZXJ0KGNvbmQsIGFzcy5vayk7XG4gIHJldHVybiBjb25kO1xufTtcblxuYXNzLmtvID0gZnVuY3Rpb24gKGNvbmQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBtZXNzYWdlID0gJ2V4cGVjdGVkIGEgZmFsc3kgdmFsdWUnO1xuICB9XG4gIGFzcy5kZXNjKG1lc3NhZ2UpLmZhbHN5LmFzc2VydChjb25kLCBhc3Mua28pO1xuICByZXR1cm4gY29uZDtcbn07XG5cbi8vIFJlc2V0cyBvciB2ZXJpZmllcyB0aGUgbnVtYmVyIG9mIG1hcmtzIHNvIGZhclxuLy8gRm9yY2VkIGFyaXR5LTAgdG8gYmUgY29tcGF0aWJsZSB3aXRoOiBiZWZvcmVFYWNoKGFzcy5tYXJrcylcbmFzcy5tYXJrcyA9IGZ1bmN0aW9uICgvKiBleHBlY3RlZCwgZGVzYyAqLykge1xuICB2YXIgZXhwZWN0ZWQgPSBhcmd1bWVudHNbMF07XG4gIHZhciBkZXNjID0gYXJndW1lbnRzWzFdO1xuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAndW5kZWZpbmVkJykge1xuICAgIGV4cGVjdGVkID0gYXNzLm1hcmtzLmNvdW50ZXI7XG4gICAgYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuICAgIHJldHVybiBleHBlY3RlZDsgIC8vIHJldHVybiBiYWNrIGhvdyBtYW55IHRoZXJlIHdlcmVcbiAgfVxuXG4gIGFzcy5kZXNjKGRlc2MgfHwgJ2Fzcy5tYXJrcycpLmVxKGV4cGVjdGVkKVxuICAuYXNzZXJ0KGFzcy5tYXJrcy5jb3VudGVyLCBhc3MubWFya3MpO1xufTtcbmFzcy5tYXJrcy5jb3VudGVyID0gMDtcblxuXG4vLyBIZWxwZXIgdG8gcmVnaXN0ZXIgbmV3IG1hdGNoZXJzIGluIHRoZSByZWdpc3RyeVxuYXNzLnJlZ2lzdGVyID0gZnVuY3Rpb24gKG5hbWUsIG1hdGNoZXIpIHtcbiAgaWYgKG5hbWUgaW5zdGFuY2VvZiBNYXRjaGVyKSB7XG4gICAgbWF0Y2hlciA9IG5hbWU7XG4gICAgbmFtZSA9IG1hdGNoZXIubmFtZTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICBPYmplY3Qua2V5cyhuYW1lKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGFzcy5yZWdpc3RlcihrZXksIG5hbWVba2V5XSk7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgeyAgLy8gQXNzdW1lIGEgZGVzY3JpcHRvciB3YXMgZ2l2ZW5cbiAgICAvLyBDcmVhdGUgdGhlIGFsaWFzZXMgZmlyc3RcbiAgICBfLmZvckVhY2gobWF0Y2hlci5hbGlhc2VzLCBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgIGFzcy5yZWdpc3RlcihuZXcgTWF0Y2hlcihhbGlhcywgbWF0Y2hlcikpO1xuICAgIH0pO1xuXG4gICAgbWF0Y2hlciA9IG5ldyBNYXRjaGVyKG5hbWUsIG1hdGNoZXIpO1xuICB9XG5cbiAgLy8gS2VlcCB0aGUgbWF0Y2hlciBhcm91bmQgZm9yIGFzcy5oZWxwXG4gIGFzcy5tYXRjaGVycy5wdXNoKG1hdGNoZXIpO1xuXG5cbiAgLy8gVE9ETzogQWxsb3cgbWF0Y2hlcnMgdG8gYmUgb3ZlcnJpZGRlbiBhbmQgYWxzbyBvdmVybG9hZGVkXG4gIC8vICAgICAgIGlmIHRoZXkgaGF2ZSBhbiBcIm92ZXJsb2FkXCIgbWV0aG9kIGl0IGNhbiBiZSB1c2VkXG4gIC8vICAgICAgIHRvIGNoZWNrIHdoaWNoIG9uZSBzaG91bGQgYmUgdXNlZC5cbiAgLy8gICAgICAgQmV0dGVyIElkZWEgKEkgdGhpbmspLCBpbnN0ZWFkIG9mIG92ZXJsb2FkaW5nIGJhc2VkXG4gIC8vICAgICAgIG9uIHRoZSB2YWx1ZSB1bmRlciB0ZXN0LCB3aGljaCBtYXkgcHJvZHVjZSBpc3N1ZXNcbiAgLy8gICAgICAgc2luY2Ugd2UgZG9uJ3Qga25vdyBmb3Igc3VyZSB3aGF0IHRoYXQgdmFsdWUgaXMsXG4gIC8vICAgICAgIGFsbG93IG1hdGNoZXJzIHRvIGludHJvZHVjZSBhIG5ldyBcInByb3RvdHlwZVwiIGZvclxuICAvLyAgICAgICB0aGUgY2hhaW4sIHRoYXQgaXMsIGEgLmRvbSBtYXRjaGVyIHdpbGwgaW5jbHVkZVxuICAvLyAgICAgICBhbGwgdGhlIGNvcmUgZXhwZWN0YXRpb25zIGJ1dCB0aGVuIGFsc28gb3ZlcnJpZGVzXG4gIC8vICAgICAgIGFuZCBuZXcgb25lcyB1bnRpbCB0aGUgZW5kIG9mIHRoZSBjaGFpbi5cblxuXG4gIC8vIE1hdGNoZXIgZnVuY3Rpb25zIHdpdGggYSBzaW5nbGUgYXJndW1lbnQgYXJlIGdldHRlcnNcbiAgdmFyIGZuS2V5ID0gbWF0Y2hlci5hcml0eSA9PT0gMSA/ICdnZXQnIDogJ3ZhbHVlJztcbiAgdmFyIHByb3AgPSB7XG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH07XG4gIGlmIChmbktleSA9PT0gJ3ZhbHVlJykge1xuICAgIHByb3Aud3JpdGFibGUgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIEF1Z21lbnQgdGhlIENoYWluIHByb3RvdHlwZVxuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uIGZuICgpIHtcbiAgICB2YXIgZXhwID0gbmV3IEV4cGVjdGF0aW9uKG1hdGNoZXIsIGFyZ3VtZW50cyk7XG4gICAgdGhpcy5fX2V4cGVjdGF0aW9uc19fLnB1c2goZXhwKTtcbiAgICBpZiAoIXRoaXMuX19kZWZlcnJlZF9fKSB7XG4gICAgICB0aGlzLmFzc2VydCh0aGlzLnZhbHVlLCBmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIGRlZlByb3AoQ2hhaW4ucHJvdG90eXBlLCBuYW1lLCBwcm9wKTtcblxuICAvLyBBdWdtZW50IHRoZSBzdGF0aWMgaW50ZXJmYWNlXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGFpbiA9IG5ldyBDaGFpbigpO1xuXG4gICAgaWYgKGZuS2V5ID09PSAnZ2V0Jykge1xuICAgICAgcmV0dXJuIGNoYWluW25hbWVdO1xuICAgIH1cblxuICAgIHJldHVybiBjaGFpbltuYW1lXS5hcHBseShjaGFpbiwgYXJndW1lbnRzKTtcbiAgfTtcblxuICBkZWZQcm9wKGFzcywgbmFtZSwgcHJvcCk7XG5cbiAgLy8gUGFzcyB0aHJvdWdoIGZvciBjaGFpbnNcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiBwYXNzdGhyb3VnaCgpIHtcbiAgICByZXR1cm4gdGhpc1tuYW1lXS5hc3NlcnQodGhpcy52YWx1ZSwgcGFzc3Rocm91Z2gpLnZhbHVlT2YoKTtcbiAgfTtcbiAgcHJvcC5lbnVtZXJhYmxlID0gZmFsc2U7XG4gIGRlZlByb3AoQ2hhaW4ucHJvdG90eXBlLCAnJCcgKyBuYW1lLCBwcm9wKTtcblxuICAvLyBQYXNzIHRocm91Z2ggc3RhdGljIGNvbnN0cnVjdG9yXG4gIGRlZlByb3AoYXNzLCAnJCcgKyBuYW1lLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKGZuS2V5ID09PSAnZ2V0Jykge1xuICAgICAgICByZXR1cm4gYXNzKHZhbHVlKVsnJCcgKyBuYW1lXTtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIGEgbmV3IGV4cHJlc3Npb24gZm9yIHRoZSBleHBlY3RhdGlvblxuICAgICAgdmFyIGNoYWluID0gbmV3IENoYWluKCk7XG4gICAgICBjaGFpbltuYW1lXS5hcHBseShjaGFpbiwgYXJndW1lbnRzKTtcbiAgICAgIC8vIFJldHVybiBhIGNhbGxhYmxlIHRoYXQgYXNzZXJ0cyB1cG9uIHJlY2VpdmluZyBhIHZhbHVlXG4gICAgICByZXR1cm4gY2hhaW4udGhyb3VnaDtcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IGZhbHNlXG4gIH0pO1xuXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gYXNzO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciByZXNvbHZlcnMgPSByZXF1aXJlKCcuL3Jlc29sdmVycycpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBQcm9taXNlID0gdXRpbC5Qcm9taXNlO1xuXG52YXIgZGVmUHJvcCA9IHV0aWwuYmluZChPYmplY3QuZGVmaW5lUHJvcGVydHksIE9iamVjdCk7XG5cbi8vIEFuIGV4cGVjdGF0aW9ucyBjaGFpbiAoYWthIGV4cHJlc3Npb24pLCB0aGUgY29yZSBvYmplY3Qgb2YgdGhlIGxpYnJhcnksXG4vLyBhbGxvd3MgdG8gc2V0dXAgYSBzZXQgb2YgZXhwZWN0YXRpb25zIHRvIGJlIHJ1biBhdCBhbnkgcG9pbnQgYWdhaW5zdCBhXG4vLyB2YWx1ZS5cbmZ1bmN0aW9uIENoYWluICh2YWx1ZSkge1xuICBpZiAoIUNoYWluLmlzQ2hhaW4odGhpcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FzcyBDaGFpbiBjb25zdHJ1Y3RvciBjYWxsZWQgd2l0aG91dCBuZXchJyk7XG4gIH1cblxuICAvLyBUT0RPOiBPbiBub24gaW5pdGlhbGl6ZWQgY2hhaW5zIHdlIGNhbid0IGRvIC52YWx1ZSwgaXQgc2hvdWxkXG4gIC8vICAgICAgIGJlIGEgZXhwZWN0YXRpb24gdGhhdCBnZXRzIHRoZSBpbml0aWFsIHZhbHVlIGdpdmVuIHdoZW5cbiAgLy8gICAgICAgcmVzb2x2aW5nIChzbywgaXQgc2hvdWxkIGJlIHN0b3JlZCBvbiB0aGUgcmVzb2x2ZXIpXG4gIHRoaXMudmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IHZhbHVlIDogdGhpcy5fX0dVQVJEX187XG5cbiAgLy8gQ3VzdG9tIGRlc2NyaXB0aW9uXG4gIGRlZlByb3AodGhpcywgJ19fZGVzY3JpcHRpb25fXycsIHtcbiAgICB2YWx1ZTogJycsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBMaXN0IG9mIFsgRXhwZWN0YXRpb24gXVxuICBkZWZQcm9wKHRoaXMsICdfX2V4cGVjdGF0aW9uc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBXaGVuIHRydWUgdGhlIGV4cHJlc3Npb24gaXMgY29uc2lkZXJlZCBkZWZlcnJlZCBhbmQgd29uJ3RcbiAgLy8gdHJ5IHRvIGltbWVkaWF0ZWx5IGV2YWx1YXRlIGFueSBuZXdseSBjaGFpbmVkIGV4cGVjdGF0aW9uLlxuICBkZWZQcm9wKHRoaXMsICdfX2RlZmVycmVkX18nLCB7XG4gICAgdmFsdWU6IHRoaXMudmFsdWUgPT09IHRoaXMuX19HVUFSRF9fLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gSG9sZHMgdGhlIGxpc3Qgb2YgcHJvbWlzZSBjYWxsYmFja3MgYXR0YWNoZWQgdG8gdGhlIGV4cHJlc3Npb25cbiAgZGVmUHJvcCh0aGlzLCAnX190aGVuc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBTZWFsIHRoZSBjb250ZXh0IHRvIHRoZSBtZXRob2RzIHNvIHdlIGNhbiBjYWxsIHRoZW0gYXMgcGxhaW4gZnVuY3Rpb25zXG4gIHRoaXMudGVzdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUudGVzdCwgdGhpcyk7XG4gIHRoaXMuYXNzZXJ0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS5hc3NlcnQsIHRoaXMpO1xuICB0aGlzLnJlc3VsdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUucmVzdWx0LCB0aGlzKTtcbiAgdGhpcy50aHJvdWdoID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS50aHJvdWdoLCB0aGlzKTtcbiAgdGhpcy4kID0gdGhpcy50aHJvdWdoO1xufVxuXG5DaGFpbi5pc0NoYWluID0gZnVuY3Rpb24gKG9iaikge1xuICAvLyBUaGlzIGxvb2tzIGNvbnRyaXZlZCBidXQgaW5zdGFuY2VvZiBpcyBraW5kIG9mIHNsb3ctaXNoXG4gIHJldHVybiBvYmogJiYgb2JqLmNvbnN0cnVjdG9yID09PSBDaGFpbjtcbn07XG5cblxudmFyIHByb3RvID0gQ2hhaW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gQ2hhaW47XG5cbi8vIEd1YXJkIHRva2VuIHRvIGRldGVjdCB2YWx1ZWxlc3MgbWF0Y2hlcnNcbnByb3RvLl9fR1VBUkRfXyA9IHtcbiAgdmFsdWVPZjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd7e3ZhbHVlbGVzc319JztcbiAgfVxufTtcblxuLy8gU3VwcG9ydHMgdGhlIHVzYWdlOiBhc3Muc3RyaW5nLmhlbHBcbmRlZlByb3AocHJvdG8sICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPOiBQcm9kdWN0aXplIHRoaXMgYW5kIHBlcmhhcHMgc2hvdyBoZWxwIGZvciB0aGUgd2hvbGUgY2hhaW5cbiAgICB2YXIgdGFpbCA9IF8udGFpbCh0aGlzLl9fZXhwZWN0YXRpb25zX18pO1xuICAgIHJldHVybiB0YWlsID8gdGFpbC5oZWxwIDogJ04vQSc7XG4gIH1cbn0pO1xuXG4vLyBTdXBwb3J0IHVzZSBjYXNlOiBhc3ModmFsdWUpLl8uc29tZS5udW1iZXIuYWJvdmUoNSkuX1xuZGVmUHJvcChwcm90bywgJ18nLCB7XG4gIGdldDogZnVuY3Rpb24gZm4oKSB7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5fX2RlZmVycmVkX18gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IGZhbHNlO1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufSk7XG5cblxuLy8gRXhwb3NlcyBhIFByb21pc2UvQSBpbnRlcmZhY2UgZm9yIHRoZSBleHByZXNzaW9uLCB0aGUgaW50ZW5kZWQgdXNlIGlzIGZvclxuLy8gb2J0YWluaW5nIHRoZSByZXN1bHQgZm9yIGFzeW5jaHJvbm91cyBleHByZXNzaW9ucy5cbi8vIEhlcmUgdGhvdWdoIHdlIGp1c3QgY29sbGVjdCB0aGUgY2FsbGJhY2tzLCB0aGUgYWN0dWFsIHByb21pc2UgcmVzb2x1dGlvblxuLy8gaXMgZG9uZSBpbiB0aGUgcmVzb2x2ZXIgd2hlbiBpdCByZWFjaGVzIGEgcmVzdWx0LlxucHJvdG8udGhlbiA9IGZ1bmN0aW9uIChjYiwgZWIpIHtcbiAgLy8gUmVnaXN0ZXIgdGhlIGNhbGxiYWNrcyB0byBiZSB1c2VkIHdoZW4gcmVzb2x2ZWRcbiAgdGhpcy5fX3RoZW5zX18ucHVzaChbY2IsIGViXSk7XG5cbiAgLy8gV2hlbiB0aGUgZXhwcmVzc2lvbiBpcyBub24gZGVmZXJyZWQgYW5kIHdlIGhhdmUgYSB2YWx1ZSB3ZSBmb3JjZSB0aGVcbiAgLy8gcmVzb2x2ZXIgdG8gcnVuIGluIG9yZGVyIHRvIHJlc29sdmUgdGhlIHByb21pc2UgYXQgbGVhc3Qgb25jZS5cbiAgLy8gVGhpcyBpcyBwcmltYXJpbHkgdG8gc3VwcG9ydCB0aGUgdGVzdCBydW5uZXJzIHVzZSBjYXNlIHdoZXJlIGFuIGV4cHJlc3Npb25cbiAgLy8gaXMgcmV0dXJuZWQgZnJvbSB0aGUgdGVzdCBhbmQgdGhlIHJ1bm5lciB3aWxsIGF0dGFjaCBpdHNlbGYgaGVyZS5cbiAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXyAmJiB0aGlzLnZhbHVlICE9PSB0aGlzLl9fR1VBUkRfXykge1xuICAgIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICAgIHJlc29sdmVyKHRoaXMudmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5jYXRjaCA9IGZ1bmN0aW9uIChlYikge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIGViKTtcbn07XG5cbi8vIERpc3BhdGNoIGV2ZXJ5b25lIHdobyB3YXMgd2FpdGluZyB0byBiZSBub3RpZmllZCBvZiB0aGUgb3V0Y29tZVxucHJvdG8uZGlzcGF0Y2hSZXN1bHQgPSBmdW5jdGlvbiAocmVzb2x2ZWQsIHJlc3VsdCkge1xuICBpZiAoMCA9PT0gdGhpcy5fX3RoZW5zX18ubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR2VuZXJhdGUgYSBuaWNlIGVycm9yIGZvciB0aGUgZmFpbHVyZVxuICB2YXIgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICBhY3R1YWwgPSB0aGlzLmJ1aWxkRXJyb3IocmVzb2x2ZWQsIHByb3RvLmRpc3BhdGNoUmVzdWx0KTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb21pc2UgdGhhdCByZWplY3RzIGltbWVkaWF0ZWx5IHdpdGggYSBmYWlsdXJlIGVycm9yIG9yXG4gIC8vIHJlc29sdmVzIHdpdGggdGhlIGV4cHJlc3Npb24gc3ViamVjdC5cbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gQ2FsbGluZyByZXNvbHZlKCkgd2l0aCBhIHByb21pc2Ugd2lsbCBhdHRhY2ggaXRzZWxmIHRvIHRoZSBwcm9taXNlXG4gICAgLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGl0IGFzIGEgc2ltcGxlIHZhbHVlLiBUbyBhdm9pZCB0aGF0IHdlIGRldGVjdCB0aGVcbiAgICAvLyBjYXNlIGFuZCB3cmFwIGl0IGluIGFuIGFycmF5LlxuICAgIGlmIChhY3R1YWwgJiYgdHlwZW9mIGFjdHVhbC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhY3R1YWwgPSBbXG4gICAgICAgICdBc3M6IFZhbHVlIHdyYXBwZWQgaW4gYW4gYXJyYXkgc2luY2UgaXQgbG9va3MgbGlrZSBhIFByb21pc2UnLFxuICAgICAgICBhY3R1YWxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgKHJlc3VsdCA/IHJlc29sdmUgOiByZWplY3QpKCBhY3R1YWwgKTtcbiAgfSk7XG5cbiAgLy8gQXR0YWNoIGFsbCB0aGUgcmVnaXN0ZXJlZCB0aGVucyB0byB0aGUgcHJvbWlzZSBzbyB0aGV5IGdldCBub3RpZmllZFxuICBfLmZvckVhY2godGhpcy5fX3RoZW5zX18sIGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuLmFwcGx5KHByb21pc2UsIGNhbGxiYWNrcyk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZHVtcENoYWluIChyZXNvbHZlZCwgaW5kZW50KSB7XG4gIHZhciByZXN1bHQgPSAnJztcblxuICBpbmRlbnQgPSBpbmRlbnQgfHwgJyc7XG5cbiAgcmVzb2x2ZWQuZm9yRWFjaChmdW5jdGlvbiAoZXhwLCBpZHgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShleHApKSB7XG4gICAgICByZXN1bHQgKz0gZHVtcENoYWluKGV4cCwgaW5kZW50ICsgJyAgJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV4cC5yZXN1bHQpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzJtUGFzc2VkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzFtRmFpbGVkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgIGlmIChpZHggPT09IHJlc29sdmVkLmxlbmd0aCAtIDEpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMG0gJyArIGV4cC5mYWlsdXJlICsgJ1xcbic7XG4gICAgfVxuXG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuLy8gQnVpbGRzIGFuIEFzc0Vycm9yIGZvciB0aGUgY3VycmVudCBleHByZXNzaW9uLiBJdCBtYWtlcyBhIGNvdXBsZSBvZlxuLy8gYXNzdW1wdGlvbnMsIGZvciBpbnN0YW5jZSB0aGUgLl9fb2Zmc2V0X18gbXVzdCBiZSBwbGFjZWQganVzdCBhZnRlciB0aGVcbi8vIGV4cGVjdGF0aW9uIHRoYXQgcHJvZHVjZWQgdGhlIGZhaWx1cmUgb2YgdGhlIGNoYWluLlxucHJvdG8uYnVpbGRFcnJvciA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgc3NmKSB7XG5cbiAgdmFyIGVycm9yID0gdGhpcy5fX2Rlc2NyaXB0aW9uX18gKyAnXFxuXFxuJztcblxuICBleHAgPSByZXNvbHZlZFsgcmVzb2x2ZWQubGVuZ3RoIC0gMSBdO1xuICBlcnJvciArPSBkdW1wQ2hhaW4ocmVzb2x2ZWQpO1xuXG4gIGlmICghdXRpbC5kb0NvbG9ycygpKSB7XG4gICAgZXJyb3IgPSB1dGlsLnVuYW5zaShlcnJvcik7XG4gIH1cblxuICAvLyBUT0RPOiBzaG93RGlmZiBzaG91bGQgYmUgdXNlZCBvbmx5IHdoZW4gaXQgbWFrZXMgc2Vuc2UgcGVyaGFwc1xuICAvLyAgICAgICB3ZSBjYW4gcGFzcyBudWxsL3VuZGVmaW5lZCBhbmQgbGV0IEFzc0Vycm9yIGRldGVjdCB3aGVuIGl0XG4gIC8vICAgICAgIG1ha2VzIHNlbnNlLlxuXG4gIHZhciBleHBlY3RlZCA9IGV4cC5leHBlY3RlZDtcbiAgLy8gTW9jaGEgd2lsbCB0cnkgdG8ganNvbmlmeSB0aGUgZXhwZWN0ZWQgdmFsdWUsIGp1c3QgaWdub3JlIGlmIGl0J3MgYSBmdW5jdGlvblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdmFyIGluc3QgPSBuZXcgQXNzRXJyb3IoZXJyb3IsIHNzZiB8fCBhcmd1bWVudHMuY2FsbGVlIHx8IHByb3RvLmJ1aWxkRXJyb3IpO1xuICBpbnN0LnNob3dEaWZmID0gZmFsc2U7XG4gIGluc3QuYWN0dWFsID0gbnVsbDtcbiAgaW5zdC5leHBlY3RlZCA9IG51bGw7XG4gIHJldHVybiBpbnN0O1xufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIFRoZSByZXN1bHQgaXMgYWx3YXlzIGFcbi8vIGJvb2xlYW4gaW5kaWNhdGluZyB0aGUgb3V0Y29tZSBvciBhbiB1bmRlZmluZWQgdG8gc2lnbmFsIHRoYXQgaXQgcmVhY2hlZFxuLy8gYW4gYXN5bmNocm9ub3VzIGZsb3cuXG5wcm90by50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBSZXNvbHZlIHRoZSBjaGFpbiBzdGFydGluZyBmcm9tIHJvb3RcbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyBQZXJmb3JtcyB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhaW4gYnV0IGFkZGl0aW9uYWxseSB3aWxsIHJhaXNlIGFuIGVycm9yXG4vLyBpZiBpdCBmYWlscyB0byBjb21wbGV0ZS4gV2hlbiB0aGUgZXhwcmVzc2lvbiByZXNvbHZlcyBhcyB1bmRlZmluZWQgKGFzeW5jKVxuLy8gaXQnbGwgYmUgYXV0b21hdGljYWxseSBlbmFibGUgaXRzIGRlZmVycmVkIGZsYWcuXG4vLyBUaGUgYHNzZmAgc3RhbmRzIGZvciBTdGFja1RyYWNlRnVuY3Rpb24sIGEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBmdW5jdGlvblxuLy8gdG8gc2hvdyBvbiB0aGUgc3RhY2sgdHJhY2UuXG5wcm90by5hc3NlcnQgPSBmdW5jdGlvbiAoYWN0dWFsLCBzc2YpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgLy8gSnVzdCBpZ25vcmUgaWYgdGhlIGFjdHVhbCB2YWx1ZSBpcyBub3QgcHJlc2VudCB5ZXRcbiAgLy8gVE9ETzogU2hhbGwgaXQgcHJvZHVjZSBhbiBlcnJvcj9cbiAgaWYgKGFjdHVhbCA9PT0gdGhpcy5fX0dVQVJEX18pIHJldHVybiB0aGlzO1xuXG4gIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICB2YXIgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcblxuICAvLyBJdCBmYWlsZWQgc28gcmVwb3J0IGl0IHdpdGggYSBuaWNlIGVycm9yXG4gIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgdGhpcy5idWlsZEVycm9yKHJlc29sdmVyLnJlc29sdmVkLCBzc2YgfHwgdGhpcy5hc3NlcnQpO1xuICB9XG5cbiAgLy8gQ29udmVydCB0aGUgZXhwcmVzc2lvbiBpbnRvIGEgZGVmZXJyZWQgaWYgYW4gYXN5bmMgZXhwZWN0aW9uIHdhcyBmb3VuZFxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIEFzc2VydHMgdGhlIHByb3ZpZGVkIHZhbHVlIGFuZCBpZiBzdWNjZXNzZnVsIHJldHVybnMgdGhlIG9yaWdpbmFsXG4vLyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBjaGFpbiBpbnN0YW5jZS5cbnByb3RvLnRocm91Z2ggPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHRoaXMuYXNzZXJ0KGFjdHVhbCwgcHJvdG8udGhyb3VnaCk7XG4gIHJldHVybiBhY3R1YWw7XG59O1xuXG4vLyBFdmFsdWF0ZXMgdGhlIGV4cHJlc3Npb24gY2hhaW4gcmVwb3J0aW5nIHRoZSBsYXN0IG11dGF0ZWQgdmFsdWUgc2VlbiBpblxuLy8gaXQuIElmIHRoZSBleHByZXNzaW9uIGRvZXMgbm90IGNvbXBsZXRlIGl0J2xsIHJldHVybiB1bmRlZmluZWQuXG5wcm90by5yZXN1bHQgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHZhciByZXN1bHQ7XG5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB0aGlzLnRhcChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgIH0pLnRlc3QoYWN0dWFsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBSZW1vdmUgdGhlIC50YXAgZnJvbSB0aGUgY2hhaW5cbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fX2Rlc2NyaXB0aW9uX18pIHtcbiAgICByZXR1cm4gdGhpcy5fX2Rlc2NyaXB0aW9uX187XG4gIH1cblxuICB2YXIgZGVzY3MgPVxuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfX1xuICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZGVzY3JpcHRpb24gfSlcbiAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmRlc2NyaXB0aW9uIH0pO1xuXG4gIGlmIChkZXNjcy5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuICcoJyArIGRlc2NzLmpvaW4oJywgJykgKyAnKSc7XG4gIH0gZWxzZSBpZiAoZGVzY3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGRlc2NzWzBdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnPEFzc0NoYWluPic7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDaGFpbjtcbiIsIi8vIEFQSSBjb21wYXRpYmxlIHdpdGggaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9hc3NlcnRpb24tZXJyb3IvXG4vLyBUaGlzIHNob3VsZCBtYWtlIGludGVncmF0aW9uIHdpdGggTW9jaGEgd29yaywgaW5jbHVkaW5nIGRpZmZlZFxuLy8gb3V0cHV0LlxuXG52YXIgRmFpbHVyZSA9IHJlcXVpcmUoJ2ZhaWx1cmUnKTtcblxudmFyIHVuYW5zaSA9IHJlcXVpcmUoJy4vdXRpbCcpLnVuYW5zaTtcblxuXG52YXIgQXNzRXJyb3IgPSBGYWlsdXJlLmNyZWF0ZSgnQXNzRXJyb3InKTtcbnZhciBwcm90byA9IEFzc0Vycm9yLnByb3RvdHlwZTtcblxucHJvdG8uc2hvd0RpZmYgPSBmYWxzZTtcbnByb3RvLmFjdHVhbCA9IG51bGw7XG5wcm90by5leHBlY3RlZCA9IG51bGw7XG5cbmZ1bmN0aW9uIGdldFRhcmdldExpbmUgKGZyYW1lcykge1xuICBmdW5jdGlvbiBnZXRTcmMgKGZyYW1lKSB7XG4gICAgdmFyIGZuID0gZnJhbWUuZ2V0RnVuY3Rpb24oKTtcbiAgICByZXR1cm4gZm4gPyBmbi50b1N0cmluZygpLnJlcGxhY2UoL1xccysvZywgJycpIDogbnVsbDtcbiAgfVxuXG4gIC8vIEZpcnN0IGZyYW1lIGlzIG5vdyB0aGUgdGFyZ2V0XG4gIHZhciB0YXJnZXQgPSBmcmFtZXNbMF07XG4gIHZhciB0YXJnZXRTcmMgPSBnZXRTcmModGFyZ2V0KTtcbiAgaWYgKCF0YXJnZXRTcmMpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEZpbHRlciBvdXQgYWxsIGZyYW1lcyB3aGljaCBhcmUgbm90IGluIHRoZSBzYW1lIGZpbGVcbiAgc2FtZWZpbGUgPSBmcmFtZXMuZmlsdGVyKGZ1bmN0aW9uIChmcmFtZSkge1xuICAgIHJldHVybiBmcmFtZSAmJiBmcmFtZS5nZXRGaWxlTmFtZSgpID09PSB0YXJnZXQuZ2V0RmlsZU5hbWUoKTtcbiAgfSk7XG5cbiAgLy8gR2V0IHRoZSBjbG9zZXN0IGZ1bmN0aW9uIGluIHRoZSBzYW1lIGZpbGUgdGhhdCB3cmFwcyB0aGUgdGFyZ2V0IGZyYW1lXG4gIHZhciB3cmFwcGVyO1xuICBmb3IgKHZhciBpPTE7IGkgPCBzYW1lZmlsZS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzcmMgPSBnZXRTcmMoc2FtZWZpbGVbaV0pO1xuICAgIGlmIChzcmMgJiYgLTEgIT09IHNyYy5pbmRleE9mKHRhcmdldFNyYykpIHtcbiAgICAgIHdyYXBwZXIgPSBzYW1lZmlsZVtpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFdoZW4gYSB3cmFwcGVyIGZ1bmN0aW9uIGlzIGZvdW5kIHdlIGNhbiB1c2UgaXQgdG8gb2J0YWluIHRoZSBsaW5lIHdlIHdhbnRcbiAgaWYgKHdyYXBwZXIpIHtcbiAgICAvLyBHZXQgcmVsYXRpdmUgcG9zaXRpb25zXG4gICAgdmFyIHJlbExuID0gdGFyZ2V0LmdldExpbmVOdW1iZXIoKSAtIHdyYXBwZXIuZ2V0TGluZU51bWJlcigpO1xuICAgIHZhciByZWxDbCA9IHRhcmdldC5nZXRMaW5lTnVtYmVyKCkgPT09IHdyYXBwZXIuZ2V0TGluZU51bWJlcigpXG4gICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICA6IHRhcmdldC5nZXRDb2x1bW5OdW1iZXIoKSAtIDE7XG5cbiAgICB2YXIgbGluZXMgPSB0YXJnZXQuZ2V0RnVuY3Rpb24oKS50b1N0cmluZygpLnNwbGl0KC9cXG4vKTtcbiAgICBpZiAobGluZXNbcmVsTG5dKSB7XG4gICAgICByZXR1cm4gbGluZXNbcmVsTG5dO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5wcm90by50b0pTT04gPSBmdW5jdGlvbiAoc3RhY2spIHtcbiAgdmFyIHByb3BzID0ge1xuICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICBtZXNzYWdlOiB1bmFuc2kodGhpcy5tZXNzYWdlKSxcbiAgICBhY3R1YWw6IHRoaXMuYWN0dWFsLFxuICAgIGV4cGVjdGVkOiB0aGlzLmV4cGVjdGVkLFxuICAgIHNob3dEaWZmOiB0aGlzLnNob3dEaWZmXG4gIH07XG5cbiAgLy8gaW5jbHVkZSBzdGFjayBpZiBleGlzdHMgYW5kIG5vdCB0dXJuZWQgb2ZmXG4gIGlmIChzdGFjayAmJiB0aGlzLnN0YWNrKSB7XG4gICAgcHJvcHMuc3RhY2sgPSB0aGlzLnN0YWNrO1xuICB9XG5cbiAgcmV0dXJuIHByb3BzO1xufTtcblxucHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtc2cgPSBGYWlsdXJlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRoaXMpO1xuXG4gIHZhciBsaW5lID0gZ2V0VGFyZ2V0TGluZSh0aGlzLmZyYW1lcyk7XG4gIGlmIChsaW5lKSB7XG4gICAgbXNnICs9ICdcXG4gID4+ICcgKyBsaW5lLnJlcGxhY2UoL15cXHMrLywgJycpLnNsaWNlKDAsIDYwKSArICdcXG4nO1xuICB9XG5cbiAgcmV0dXJuIG1zZztcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc0Vycm9yO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciBNYXRjaGVyID0gcmVxdWlyZSgnLi9tYXRjaGVyJyk7XG5cbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdXRpbCcpLnRlbXBsYXRlO1xuXG5cbi8vIEV4cGVjdGF0aW9uIHJlcHJlc2VudHMgYW4gaW5zdGFudGlhdGVkIE1hdGNoZXIgYWxyZWFkeSBjb25maWd1cmVkIHdpdGhcbi8vIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cy5cbmZ1bmN0aW9uIEV4cGVjdGF0aW9uIChtYXRjaGVyLCBhcmdzKSB7XG4gIC8vIEdldCB0aGUgbWF0Y2hlciBjb25maWd1cmF0aW9uIGludG8gdGhpcyBpbnN0YW5jZVxuICBtYXRjaGVyLmFzc2lnbih0aGlzKTtcblxuICAvLyBTdXBwb3J0IGJlaW5nIGdpdmVuIGFuIGBhcmd1bWVudHNgIG9iamVjdFxuICB0aGlzLmFyZ3MgPSBfLnRvQXJyYXkoYXJncyk7XG4gIHRoaXMuYWN0dWFsID0gdW5kZWZpbmVkO1xufVxuXG4vLyBJbmhlcml0IHRoZSBwcm90b3R5cGUgZnJvbSBNYXRjaGVyXG52YXIgcHJvdG8gPSBFeHBlY3RhdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE1hdGNoZXIucHJvdG90eXBlKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gRXhwZWN0YXRpb247XG5cbi8vIEdlbmVyYXRlIGdldHRlciBmb3IgYC5leHBlY3RlZGAgKGFuIGFsaWFzIGZvciBhcmdzWzBdKVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZXhwZWN0ZWQnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmFyZ3NbMF07XG4gIH1cbn0pO1xuXG4vLyBHZW5lcmF0ZSBnZXR0ZXJzIGZvciB0aGUgZmlyc3QgNSBhcmd1bWVudHMgYXMgYXJnMSwgYXJnMiwgLi4uXG5fLnRpbWVzKDUsIGZ1bmN0aW9uIChpKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2FyZycgKyAoaSArIDEpLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5hcmdzW2ldO1xuICAgIH1cbiAgfSk7XG59KTtcblxuLy8gQ29tcHV0ZSB0aGUgZGVzY3JpcHRpb24gbWVzc2FnZSBmb3IgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGV4cGVjdGF0aW9uXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdkZXNjcmlwdGlvbicsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmRlc2MpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMuZGVzYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuZGVzYyh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlKHRoaXMuZGVzYywgdGhpcyk7XG4gIH1cbn0pO1xuXG4vLyBDb21wdXRlIHRoZSBmYWlsdXJlIG1lc3NhZ2UgZm9yIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBleHBlY3RhdGlvblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZmFpbHVyZScsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmZhaWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0aGlzLmZhaWwodGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB0ZW1wbGF0ZSh0aGlzLmZhaWwsIHRoaXMpO1xuICB9XG59KTtcblxuLy8gSGVscGVyIHRvIG11dGF0ZSB0aGUgdmFsdWUgdW5kZXIgdGVzdFxuRXhwZWN0YXRpb24ucHJvdG90eXBlLm11dGF0ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyKHZhbHVlKTtcbiAgfTtcbn07XG5cbi8vIFJlc29sdmluZyBjYW4gb3ZlcnJpZGUgdGhlIGV4cGVjdGF0aW9uIHN0YXRlLCBpZiB0aGF0J3Mgbm90IGRlc2lyYWJsZSBtYWtlXG4vLyBzdXJlIHRoYXQgdGhpcyBtZXRob2QgaXMgY2FsbGVkIGluIGEgbmV3IGNvbnRleHQuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFyZ3MsIHJlc3VsdDtcblxuICAvLyBFeGVjdXRlIHRoZSBtYXRjaGVyIHRlc3Qgbm93IHRoYXQgZXZlcnl0aGluZyBpcyBzZXRcbiAgYXJncyA9IFt0aGlzLmFjdHVhbF0uY29uY2F0KHRoaXMuYXJncyk7XG4gIHJlc3VsdCA9IHRoaXMudGVzdC5hcHBseSh0aGlzLCBhcmdzKTtcblxuICAvLyBSZXR1cm5pbmcgYSBzdHJpbmcgb3ZlcnJpZGVzIHRoZSBtaXNtYXRjaCBkZXNjcmlwdGlvblxuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICB0aGlzLmZhaWwgPSByZXN1bHQ7XG4gICAgcmVzdWx0ID0gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5kZXNjcmlwdGlvbjtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBFeHBlY3RhdGlvbjtcbiIsIi8vIFRoZSBNYXRjaGVyIG9iamVjdCBpcyBhIGRlc2NyaXB0b3IgZm9yIHRoZSBtYXRjaGluZyBsb2dpYyBidXQgY2Fubm90XG4vLyBiZSB1c2VkIGRpcmVjdGx5LiBVc2UgYW4gRXhwZWN0YXRpb24gdG8gZ2V0IGFuIGluaXRpYWxpemVkIG1hdGNoZXIuXG5mdW5jdGlvbiBNYXRjaGVyIChuYW1lLCBkZXNjcmlwdG9yKSB7XG5cbiAgLy8gU2hvcnRjdXQgZm9yIHNpbXBsZSB0ZXN0IGZ1bmN0aW9uc1xuICBpZiAodHlwZW9mIGRlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkZXNjcmlwdG9yID0ge3Rlc3Q6IGRlc2NyaXB0b3J9O1xuICB9XG5cbiAgLy8gVGhlIGdlbmVyaWMgbmFtZSBvZiB0aGUgbWF0Y2hlclxuICB0aGlzLm5hbWUgPSBuYW1lO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGRlc2NyaXB0b3IuaGVscCkpIHtcbiAgICB0aGlzLmhlbHAgPSBkZXNjcmlwdG9yLmhlbHAuam9pbignXFxuJyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5oZWxwID0gZGVzY3JpcHRvci5oZWxwIHx8ICdOb3QgYXZhaWxhYmxlJztcbiAgfVxuXG4gIC8vIEVpdGhlciBhIHRlbXBsYXRlIHN0cmluZyBvciBhIGZ1bmN0aW9uIHRoYXQgd2lsbCByZWNlaXZlIGFzIG9ubHlcbiAgLy8gYXJndW1lbnQgYW4gRXhwZWN0YXRpb24gaW5zdGFuY2UgKGNhbGxlZCBhcyBhIG1ldGhvZCBvZiBpdCkuXG4gIHRoaXMuZGVzYyA9IGRlc2NyaXB0b3IuZGVzYyAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IGRlc2NyaXB0b3IuZGVzY1xuICAgICAgICAgICAgOiB0aGlzLm5hbWU7XG5cbiAgLy8gRWl0aGVyIGEgdGVtcGxhdGUgc3RyaW5nIG9yIGEgZnVuY3Rpb24gdGhhdCB3aWxsIHJlY2VpdmUgYXMgb25seVxuICAvLyBhcmd1bWVudCBhbiBFeHBlY3RhdGlvbiBpbnN0YW5jZSAoY2FsbGVkIGFzIGEgbWV0aG9kIG9mIGl0KS5cbiAgdGhpcy5mYWlsID0gZGVzY3JpcHRvci5mYWlsIHx8ICd3YXMge3sgYWN0dWFsIH19JztcblxuICBpZiAoIWRlc2NyaXB0b3IudGVzdCkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGVzdCBmdW5jdGlvbiBub3QgZGVmaW5lZCBmb3IgdGhlIG1hdGNoZXInKTtcbiAgfVxuICB0aGlzLnRlc3QgPSBkZXNjcmlwdG9yLnRlc3Q7XG5cbiAgdGhpcy5hcml0eSA9IGRlc2NyaXB0b3IuYXJpdHkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgID8gZGVzY3JpcHRvci5hcml0eVxuICAgICAgICAgICAgIDogdGhpcy50ZXN0Lmxlbmd0aDtcbn1cblxuTWF0Y2hlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuTWF0Y2hlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNYXRjaGVyO1xuXG5NYXRjaGVyLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMubmFtZSwge1xuICAgIGhlbHA6IHRoaXMuaGVscCxcbiAgICBkZXNjOiB0aGlzLmRlc2MsXG4gICAgZmFpbDogdGhpcy5mYWlsLFxuICAgIHRlc3Q6IHRoaXMudGVzdCxcbiAgICBhcml0eTogdGhpcy5hcml0eVxuICB9KTtcbn07XG5cbi8vIEF1Z21lbnQgYW5vdGhlciBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBvZiB0aGlzIG1hdGNoZXJcbk1hdGNoZXIucHJvdG90eXBlLmFzc2lnbiA9IGZ1bmN0aW9uIChvYmopIHtcbiAgb2JqLmhlbHAgPSB0aGlzLmhlbHA7XG4gIG9iai5kZXNjID0gdGhpcy5kZXNjO1xuICBvYmouZmFpbCA9IHRoaXMuZmFpbDtcbiAgb2JqLnRlc3QgPSB0aGlzLnRlc3Q7XG4gIG9iai5hcml0eSA9IHRoaXMuYXJpdHk7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICc8QXNzLk1hdGNoZXIgJyArIHRoaXMubmFtZSArICc+Jztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXRjaGVyO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG5hc3MucmVnaXN0ZXIoe1xuXG4gIGFuZDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIGV4cHJlc3Npb25zLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYWxsIHRoZSBleHByZXNzaW9ucyB0aGF0IGZvcm0gaXQgZG8gaW5kZWVkIHN1Y2NlZWQuJyxcbiAgICAgICdOb3RlOiBldmFsdWF0aW9uIHdpbGwgc3RvcCBhcyBzb29uIGFzIG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgZmFpbHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBBTkQgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciByZXN1bHQgPSBfLmV2ZXJ5KGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8ga2VlcCBpdGVyYXRpbmdcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGFydGlhbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGV4cGVjdGF0aW9ucyBsYXRlciBpbiB0aGUgY2hhaW5cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIG9yOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgZXhwcmVzc2lvbnMsIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIGRvZXMuJyxcbiAgICAgICdOb3RlOiBldmFsdWF0aW9uIHdpbGwgc3RvcCBhcyBzb29uIGFzIG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgc3VjY2VlZHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBPUiBcIikgfScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBDaGVjayBpZiBhbGwgYnJhbmNoZXMgcGFzcyB0aGUgdGVzdFxuICAgICAgICB2YXIgdW5kZWZzID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IF8uc29tZShicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBrZWVwIGl0ZXJhdGluZ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXJ0aWFsO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRha2UgY2FyZSBvZiBhbnkgZXhwZWN0YXRpb25zIGxhdGVyIGluIHRoZSBjaGFpblxuICAgICAgICBpZiAocmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcbiAgeG9yOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgZXhwcmVzc2lvbnMsIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIGRvZXMgYnV0IG5vdCBhbGwgb2YgdGhlbS4nXG4gICAgXSxcbiAgICBkZXNjOiAnJHsgYXJncy5qb2luKFwiIFhPUiBcIikgfScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBDaGVjayBpZiBhbGwgYnJhbmNoZXMgcGFzcyB0aGUgdGVzdFxuICAgICAgICB2YXIgdW5kZWZzID0gMDtcbiAgICAgICAgdmFyIG9rcyA9IDA7XG4gICAgICAgIHZhciBrb3MgPSAwO1xuICAgICAgICBfLmZvckVhY2goYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICB2YXIgcGFydGlhbCA9IGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgICAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuZGVmcyArPSAxO1xuICAgICAgICAgICAgYnJhbmNoLnRoZW4oXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKGtvcyA+IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgb2tzICs9IDE7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCwgb2tzID4gMCAmJiBrb3MgPiAwID8gdW5kZWZpbmVkIDogZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKG9rcyA+IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAga29zICs9IDE7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCwgb2tzID4gMCAmJiBrb3MgPiAwID8gdW5kZWZpbmVkIDogZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRpYWwgPT09IHRydWUpIHtcbiAgICAgICAgICAgIG9rcyArPSAxO1xuICAgICAgICAgIH0gZWxzZSBpZiAocGFydGlhbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGtvcyArPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2tzID4gMCAmJiBrb3MgPiAwID8gcmVzb2x2ZXIoYWN0dWFsKSA6IGZhbHNlO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG4iLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8vIFNldCBvZiBkZWZhdWx0IG1hdGNoZXJzXG5hc3MucmVnaXN0ZXIoe1xuICAvLyBUT0RPOiBNb3ZlIHRoaXMgdG8gdGhlIENoYWluIHByb3RvdHlwZVxuICBkZXNjOiB7XG4gICAgaGVscDogJ1Byb3ZpZGUgYSBjdXN0b20gZGVzY3JpcHRpb24gZm9yIHJlcG9ydGVkIGZhaWx1cmVzJyxcbiAgICBkZXNjOiBudWxsLCAgLy8gU2tpcCBpdCBmcm9tIHJlcG9ydHNcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBkZXNjKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgdGhlIGRlc2NyaXB0aW9uIHdvbid0IGJlIHNldCB1bnRpbCB0aGUgY2hhaW4gaXMgcmVzb2x2ZWQsXG4gICAgICAvLyBhdCBsZWFzdCBvbmNlLCByZWFjaGluZyB0aGlzIGV4cGVjdGF0aW9uLlxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXNvbHZlci5jaGFpbi5fX2Rlc2NyaXB0aW9uX18gPSBkZXNjO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIC8vIElnbm9yZWQgbWF0Y2hlcnNcbiAgdG86IHtcbiAgICBhbGlhc2VzOiBbICdhJywgJ2FuJywgJ2JlJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdKdXN0IHNvbWUgc3ludGF4IHN1Z2FyIHRvIG1ha2UgdGhlIGV4cGVjdGF0aW9ucyBlYXNpZXIgb24gdGhlIGV5ZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgbWFyazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJbmNyZWFzZXMgdGhlIGdsb2JhbCBgYXNzLm1hcmtzYCBjb3VudGVyIGV2ZXJ5IHRpbWUgaXQgZ2V0cycsXG4gICAgICAnZXZhbHVhdGVkIGFzIHBhcnQgb2YgYW4gZXhwcmVzc2lvbi4gVXNlIGl0IHRvIHZlcmlmeSB0aGF0IHRoZScsXG4gICAgICAncHJlY2VkaW5nIGV4cGVjdGF0aW9ucyBhcmUgYWN0dWFsbHkgYmVpbmcgZXhlY3V0ZWQuJyxcbiAgICAgICdBbiBlYXN5IHdheSB0byBzdXBwb3J0IHRoaXMgd2hlbiB1c2luZyBhIHRlc3QgcnVubmVyIGlzIHRvIHJlc2V0JyxcbiAgICAgICd0aGUgY291bnRlciBieSBjYWxsaW5nIGBhc3MubWFya3MoKWAgb24gYSBiZWZvcmVFYWNoIGhvb2sgYW5kJyxcbiAgICAgICd0aGVuIHZlcmlmeSBhdCB0aGUgZW5kIG9mIHRlc3Qgd2l0aCBgYXNzLm1hcmtzKE4pYCAod2hlcmUgTiBpcycsXG4gICAgICAndGhlIG51bWJlciBvZiBtYXJrcyB5b3UgZXhwZWN0ZWQpLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgYXNzLm1hcmtzLmNvdW50ZXIgKz0gMTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICAvLyBKdXN0IGFsbG93IGFueXRoaW5nIDopXG4gIGFueToge1xuICAgIGhlbHA6ICdBbGxvd3MgYW55IHZhbHVlIHdpdGhvdXQgdGVzdGluZyBpdC4nLFxuICAgIGRlc2M6ICdpcyBhbnl0aGluZycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICAvLyBBbnl0aGluZyB0aGF0IGlzbid0IG51bGwgb3IgdW5kZWZpbmVkXG4gIGRlZmluZWQ6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgbnVsbCBvciB1bmRlZmluZWQuJyxcbiAgICBkZXNjOiAnaXMgZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAhPSBudWxsO1xuICAgIH1cbiAgfSxcbiAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGVtcHR5XG4gIGVtcHR5OiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgZW1wdHkgKG9yIGhhcyBhIGxlbmd0aCBvZiAwKS4nLFxuICAgIGRlc2M6ICdpcyBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA9PSBudWxsIHx8IGFjdHVhbC5sZW5ndGggPT09IDA7XG4gICAgfVxuICB9LFxuICBuZW1wdHk6IHtcbiAgICBhbGlhc2VzOiBbICdub25FbXB0eScgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgZW1wdHkgKG9yIGhhcyBhIGxlbmd0aCBncmVhdGVyIHRoYW4gMCkuJyxcbiAgICBkZXNjOiAnaXMgbm90IGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9IG51bGwgJiYgYWN0dWFsLmxlbmd0aCA+IDA7XG4gICAgfVxuICB9LFxuICB0cnV0aHk6IHtcbiAgICBhbGlhc2VzOiBbICd0cnVpc2gnIF0sXG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgdHJ1dGh5IChub3QgdW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyB0cnV0aHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbC5sZW5ndGggPT09ICdudW1iZXInID8gYWN0dWFsLmxlbmd0aCA+IDAgOiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZmFsc3k6IHtcbiAgICBoZWxwOiAnVGhlIHZhbHVlIHNob3VsZCBiZSBmYWxzeSAodW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyBmYWxzeScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwubGVuZ3RoID09PSAwIDogZmFsc2U7XG4gICAgfVxuICB9LFxuXG4gIC8vIE5lZ2F0aW9uXG4gIG5vdDoge1xuICAgIGFsaWFzZXM6IFsgJ25vJywgJ05PJywgJ05PVCcgXSxcbiAgICBoZWxwOiAnTmVnYXRlcyB0aGUgcmVzdWx0IGZvciB0aGUgcmVzdCBvZiB0aGUgZXhwcmVzc2lvbi4nLFxuICAgIGRlc2M6ICdOb3QhJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmVyLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgICAgIHJldHVybiAhZmluYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgaXM6IHtcbiAgICBhbGlhc2VzOiBbICdlcXVhbCcsICdlcXVhbHMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBzdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgICAgJ05vdGU6IGlmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIGNoYWluIGV4cHJlc3Npb24gaXRcXCdsbCBiZSB0ZXN0ZWQgaW5zdGVhZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gc3RyaWN0bHkgZXF1YWwge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAvLyB0aGlzIGlzIGEgYml0IGNvbnRyaXZlZCBidXQgaXQgbWFrZXMgZm9yIHNvbWUgbmljZSBzeW50YXggdG8gYmUgYWJsZSB0b1xuICAgICAgLy8gdXNlIC5pcyBmb3IgcGFzc2luZyBpbiBleHBlY3RhdGlvbnNcbiAgICAgIGlmIChhc3MuQ2hhaW4uaXNDaGFpbihleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjdHVhbCA9PT0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuICBlcToge1xuICAgIGFsaWFzZXM6IFsgJ2VxbCcsICdlcWxzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgZGVlcCBub24tc3RyaWN0IGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlIGFuZCBpdHMgZXhwZWN0ZWQuJyxcbiAgICAgICdJdCB1bmRlcnN0YW5kcyBhc3MgZXhwcmVzc2lvbnMgc28geW91IGNhbiBjb21iaW5lIHRoZW0gYXQgd2lsbCBpbiB0aGUnLFxuICAgICAgJ2V4cGVjdGVkIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBlcXVhbCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBfLmlzRXF1YWwoYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlOiB7XG4gICAgYWxpYXNlczogWyAnZ3QnLCAnbW9yZVRoYW4nLCAnZ3JlYXRlclRoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPiBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3c6IHtcbiAgICBhbGlhc2VzOiBbICdsdCcsICdsZXNzVGhhbicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciB0aGEgaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIGxlc3MgdGhhbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPCBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYWJvdmVPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnbGVhc3QnLCAnYXRMZWFzdCcsICdndGUnLCAnbW9yZVRoYW5PckVxdWFsJywgJ2dyZWF0ZXJUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBoaWdoZXIgb3IgZXF1YWwgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbW9yZSB0aGFuIG9yIGVxdWFsIHRvICR7ZXhwZWN0ZWR9JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID49IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBiZWxvd09yRXF1YWw6IHtcbiAgICBhbGlhc2VzOiBbICdtb3N0JywgJ2F0TW9zdCcsICdsdGUnLCAnbGVzc1RoYW5PckVxdWFsJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGxvd2VyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDw9IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBpbnN0YW5jZW9mOiB7XG4gICAgYWxpYXNlczogWyAnaW5zdGFuY2VPZicsICdpbnN0YW5jZScsICdpc2EnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yLicsXG4gICAgICAnV2hlbiB0aGUgZXhwZWN0ZWQgaXMgYSBzdHJpbmcgaXRcXCdsbCBhY3R1YWxseSB1c2UgYSBgdHlwZW9mYCcsXG4gICAgICAnY29tcGFyaXNvbi4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYW4gaW5zdGFuY2Ugb2Yge3tleHBlY3RlZH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsID09PSBleHBlY3RlZCA/IHRydWUgOiAnaGFkIHR5cGUge3sgdHlwZW9mIGFjdHVhbCB9fSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIHR5cGVvZjoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG9mIGEgc3BlY2lmaWMgdHlwZScsXG4gICAgZGVzYzogJ3RvIGhhdmUgdHlwZSB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICdoYWQgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIF8uaXNFcXVhbCh0eXBlb2YgYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuICBudW1iZXI6IHtcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgbnVtYmVyIChkaWZmZXJlbnQgb2YgTmFOKS4nLFxuICAgIGRlc2M6ICd0byBiZSBhIG51bWJlcicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNOdW1iZXIoYWN0dWFsKSAmJiAhaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGJvb2w6IHtcbiAgICBhbGlhc2VzOiBbICdib29sZWFuJyBdLFxuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBib29sZWFuLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgYm9vbGVhbicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNCb29sZWFuKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBzdHJpbmc6IHtcbiAgICBhbGlhc2VzOiBbICdzdHInIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZy4nLFxuICAgIGRlc2M6ICd0byBiZSBhIHN0cmluZycsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNTdHJpbmcoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG9iamVjdDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIG9mIHR5cGUgb2JqZWN0LicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIG9iamVjdCcsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHBsYWluT2JqZWN0OiB7XG4gICAgYWxpYXNlczogWyAncGxhaW4nLCAnb2JqJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGUgT2JqZWN0IGNvbnN0cnVjdG9yLicsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUGxhaW5PYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGFycmF5OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYW4gQXJyYXkuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gQXJyYXknLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzQXJyYXkoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGZ1bmN0aW9uOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBGdW5jdGlvbi4nLFxuICAgIGRlc2M6ICd0byBiZSBhIEZ1bmN0aW9uJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICByZWdleHA6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIFJlZ0V4cCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgUmVnRXhwJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1JlZ0V4cChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZGF0ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRGF0ZScsXG4gICAgZGVzYzogJ3RvIGJlIGEgRGF0ZScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNEYXRlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBlbGVtZW50OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBET00gZWxlbWVudCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgRE9NIGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRWxlbWVudChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZXJyb3I6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBlcnJvciAob3IgbG9va3MgbGlrZSBpdCknLFxuICAgIGRlc2M6ICd0byBiZSBhbiBFcnJvcicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5uYW1lKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5tZXNzYWdlKTtcbiAgICB9XG4gIH0sXG5cbiAgdW5kZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgdW5kZWZpbmVkLicsXG4gICAgZGVzYzogJ3RvIGJlIHVuZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNVbmRlZmluZWQoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG51bGw6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBudWxsLicsXG4gICAgZGVzYzogJ3RvIGJlIG51bGwnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPT09IG51bGw7XG4gICAgfVxuICB9LFxuICBOYU46IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBOYU4uJyxcbiAgICBkZXNjOiAndG8gYmUgTmFOJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc051bWJlcihhY3R1YWwpKSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgdHJ1ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHRydWUnLFxuICAgIGRlc2M6ICd0byBiZSB0cnVlJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbCA9PSB0cnVlID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZmFsc2U6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBmYWxzZScsXG4gICAgZGVzYzogJ3RvIGJlIGZhbHNlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gYWN0dWFsID09IGZhbHNlID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICByYWlzZXM6IHtcbiAgICBhbGlhc2VzOiBbICd0aHJvd3MnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyB0aGF0IGV4ZWN1dGluZyB0aGUgdmFsdWUgcmVzdWx0cyBpbiBhbiBleGNlcHRpb24gYmVpbmcgdGhyb3duLicsXG4gICAgICAnVGhlIGNhcHR1cmVkIGV4Y2VwdGlvbiB2YWx1ZSBpcyB1c2VkIHRvIG11dGF0ZSB0aGUgc3ViamVjdCBmb3IgdGhlJyxcbiAgICAgICdmb2xsb3dpbmcgZXhwZWN0YXRpb25zLidcbiAgICBdLFxuICAgIGRlc2M6ICd0aHJvd3MgYW4gZXJyb3InLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNGdW5jdGlvbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgZnVuY3Rpb246IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhY3R1YWwoKTtcbiAgICAgICAgcmV0dXJuICdkaWQgbm90IHRocm93IGFueXRoaW5nJztcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGV4cGVjdGVkID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihleHBlY3RlZCkgJiYgZSBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzRXF1YWwoZSwgZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVnbWVudCB0aGUgZXhwZWN0YXRpb24gb2JqZWN0IHdpdGggYSBuZXcgdGVtcGxhdGUgdmFyaWFibGVcbiAgICAgICAgdGhpcy5leGNlcHRpb24gPSBlO1xuICAgICAgICByZXR1cm4gJ2dvdCB7eyBleGNlcHRpb24gfX0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBoYXM6IHtcbiAgICBhbGlhc2VzOiBbICdoYXZlJywgJ2NvbnRhaW4nLCAnY29udGFpbnMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgc29tZSBleHBlY3RlZCB2YWx1ZS4gSXQgdW5kZXJzdGFuZHMgZXhwZWN0ZWQnLFxuICAgICAgJ2NoYWluIGV4cHJlc3Npb25zIHNvIHRoaXMgc2VydmVzIGFzIHRoZSBlcXVpdmFsZW50IG9mIC5lcSBmb3IgcGFydGlhbCcsXG4gICAgICAnbWF0Y2hlcy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gY29udGFpbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcblxuICAgICAgaWYgKF8uaXNTdHJpbmcoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICByZXR1cm4gLTEgIT09IGFjdHVhbC5pbmRleE9mKGV4cGVjdGVkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKF8uaXNBcnJheShhY3R1YWwpKSB7XG4gICAgICAgIC8vIEhhY2s6IGZvciBhcnJheXMgd2UgYWxsb3cgbXVsdGlwbGUgZXhwZWN0ZWQgdmFsdWVzXG4gICAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZCA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgICByZXR1cm4gXy5ldmVyeShleHBlY3RlZCwgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgcmV0dXJuIC0xICE9PSBfLmZpbmRJbmRleChhY3R1YWwsIGV2KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnZ290IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICAvLyBDb21wYXJlIG9iamVjdHMgd2l0aCAud2hlcmVcbiAgICAgIHJldHVybiAwIDwgXy53aGVyZShhY3R1YWwsIGV4cGVjdGVkKS5sZW5ndGg7XG4gICAgfVxuICB9LFxuICBoYXNPd246IHtcbiAgICBhbGlhc2VzOiBbICdoYXNLZXknLCAnaGFzSW5kZXgnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgb25lIG9yIG1vcmUgb3duIHByb3BlcnRpZXMgYXMgZGVmaW5lZCBieScsXG4gICAgICAndGhlIGdpdmVuIGFyZ3VtZW50cy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gaGF2ZSBvd24gcHJvcGVydHkgJHsgZXhwZWN0ZWQgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnd2FzIHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmZhaWwgPSAnb25seSBoYWQge3sgXy5rZXlzKGFjdHVhbCkgfX0nO1xuXG4gICAgICAvLyBUT0RPOiBPZmZlciBiZXR0ZXIgZmFpbHVyZSBtZXNzYWdlXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIF8uZXZlcnkoYXJncywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIF8uaGFzKGFjdHVhbCwgeCk7IH0pO1xuICAgIH1cbiAgfSxcblxuICBsb2c6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRHVtcHMgdGhlIHJlY2VpdmVkIHZhbHVlIHRvIHRoZSBjb25zb2xlLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgY29uc29sZS5sb2coJ1tBU1NdJywgYWN0dWFsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZHVtcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdEdW1wcyB0aGUgcmVjZWl2ZWQgdmFsdWUgdG8gdGhlIGNvbnNvbGUgYXBwbHlpbmcgdGhlIGdpdmVuIHRlbXBsYXRlLicsXG4gICAgICAnTm90ZTogVXNlICR7dGhpc30gdG8gaW50ZXJwb2xhdGUgdGhlIHdob2xlIHZhbHVlLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyN0ZW1wbGF0ZSdcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgdHBsKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gdXRpbC50ZW1wbGF0ZS5jYWxsKGFjdHVhbCwgdHBsLCBhY3R1YWwpO1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZGVidWdnZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGFsdHMgc2NyaXB0IGV4ZWN1dGlvbiBieSB0cmlnZ2VyaW5nIHRoZSBpbnRlcmFjdGl2ZSBkZWJ1Z2dlci4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIHRhcDoge1xuICAgIGFsaWFzZXM6IFsgJ2ZuJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDYWxscyB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gd2l0aCB0aGUgY3VycmVudCB2YWx1ZSBhcyBhcmd1bWVudC4nLFxuICAgICAgJ0lmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHNvbWV0aGluZyBkaWZmZXJlbnQgdG8gKnVuZGVmaW5lZCogdGhlJyxcbiAgICAgICdleHByZXNzaW9uIHdpbGwgZm9yayB0byBvcGVyYXRlIG9uIHRoZSByZXR1cm5lZCB2YWx1ZS4nLFxuICAgIF0sXG4gICAgZGVzYzogJ2NhbGwge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZm4oYWN0dWFsKTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgbm90aWZ5OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1NpbWlsYXIgdG8gLnRhcCgpIGJ1dCBpdCB3b25cXCd0IHBhc3MgdGhlIGN1cnJlbnQgdmFsdWUgYXMgYXJndW1lbnQsJyxcbiAgICAgICdpbnN0ZWFkIGl0IHdpbGwgYmUgcHJvdmlkZWQgYXMgdGhlIGB0aGlzYCBjb250ZXh0IHdoZW4gcGVyZm9ybWluZyB0aGUnLFxuICAgICAgJ2NhbGwuIFRoaXMgYWxsb3dzIGl0IHRvIGJlIHVzZWQgd2l0aCB0ZXN0IHJ1bm5lcnMgYGRvbmVgIHN0eWxlIGNhbGxiYWNrcy4nLFxuICAgICAgJ05vdGUgdGhhdCBpdCB3aWxsIG5laXRoZXIgbXV0YXRlIHRoZSB2YWx1ZSBldmVuIGlmIGl0IHJldHVybnMgc29tZXRoaW5nLidcbiAgICBdLFxuICAgIGRlc2M6ICdub3RpZnkge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICBmbi5jYWxsKGFjdHVhbCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgc2l6ZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiB0aGUgc2l6ZSBvZiB0aGUgY3VycmVudCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHNpemUnLFxuICAgIGZhaWw6ICdub3QgaGFzIGEgbGVuZ3RoOiB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGFjdHVhbCkgfHwgXy5pc0FycmF5KGFjdHVhbCkgfHwgXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShfLnNpemUoYWN0dWFsKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sXG4gIHByb3A6IHtcbiAgICBhbGlhc2VzOiBbICdrZXknLCAncHJvcGVydHknIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgdmFsdWUgcHJvcGVydGllcy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHByb3BlcnR5IHt7IGFyZzEgfX0nLFxuICAgIGZhaWw6ICd3YXMgbm90IGZvdW5kIG9uIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwga2V5KSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIGlmIChrZXkgaW4gYWN0dWFsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGFjdHVhbFtrZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMua2V5cyA9IFtdO1xuICAgICAgICBfLmZvckluKGFjdHVhbCwgZnVuY3Rpb24gKHYsIGspIHsgdGhpcy5rZXlzLnB1c2goayk7IH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gJ3dhcyBub3QgZm91bmQgaW4ga2V5cyB7eyBrZXlzIH19JztcbiAgICAgIH1cbiAgICAgIHJldHVybiAnZ290IHt7YWN0dWFsfX0nO1xuICAgIH1cbiAgfSxcbiAgYXQ6IHtcbiAgICBhbGlhc2VzOiBbICdpbmRleCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIGluZGV4ZWQgZWxlbWVudHMuIElmJyxcbiAgICAgICdtdWx0aXBsZSBpbmRleGVzIGFyZSBwcm92aWRlZCBhbiBhcnJheSBpcyBjb21wb3NlZCB3aXRoIHRoZW0uJyxcbiAgICAgICdOb3RlOiBJdCBzdXBwb3J0cyBuZWdhdGl2ZSBpbmRleGVzJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBpbmRleCAkeyBhcmdzLmpvaW4oXCIsIFwiKSB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBpbmRleCkge1xuICAgICAgaWYgKCFfLmlzQXJyYXkoYWN0dWFsKSAmJiAhXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnbm90IGFuIGFycmF5IG9yIGEgc3RyaW5nOiAke2FjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW5kZXhlcyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgdmFyIGVsZW1zID0gW107XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaWR4ID0gaW5kZXhlc1tpXTtcblxuICAgICAgICBpZHggPSBpZHggPCAwID8gYWN0dWFsLmxlbmd0aCArIGlkeCA6IGlkeDtcbiAgICAgICAgaWYgKGlkeCA8IDAgfHwgaWR4ID49IGFjdHVhbC5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gaWR4ICsgJyBvdXQgb2YgYm91bmRzIGZvciB7e2FjdHVhbH19JztcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1zLnB1c2goYWN0dWFsW2lkeF0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIGVsZW1zLmxlbmd0aCA9PT0gMSA/IGVsZW1zWzBdIDogZWxlbXNcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGtleXM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBpdHMgbGlzdCBvZiBvd24ga2V5cy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGtleXMnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5rZXlzKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICB2YWx1ZXM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBpdHMgbGlzdCBvZiB2YWx1ZXMnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHZhbHVlcycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnZhbHVlcyhhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzbGljZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdFeHRyYWN0cyBhIHBvcnRpb24gZnJvbSB0aGUgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3NsaWNlKHt7YWN0dWFsfX0sICR7YXJnMSB8fCAwfSknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHN0YXJ0LCBlbmQpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50b0FycmF5KGFjdHVhbCkuc2xpY2Uoc3RhcnQsIGVuZClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGZpbHRlcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIHRoZSBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0bycsXG4gICAgICAnb3BlcmF0ZSBvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCcsXG4gICAgICAndHJ1dGh5IGZvci4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlsdGVyJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5maWx0ZXIoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICByZWplY3Q6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlJyxcbiAgICAgICdvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCBmYWxzeScsXG4gICAgICAnZm9yICh0aGUgb3Bwb3NpdGUgb2YgLmZpbHRlcikuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3JlamVjdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucmVqZWN0KGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICB3aGVyZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdQZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbiBvZiBlYWNoIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uIHRvIHRoZSBnaXZlbicsXG4gICAgICAncHJvcGVydGllcyBvYmplY3QsIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgb2YgYWxsJyxcbiAgICAgICdlbGVtZW50cyB0aGF0IGhhdmUgZXF1aXZhbGVudCBwcm9wZXJ0eSB2YWx1ZXMuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3doZXJlJ1xuICAgIF0sXG4gICAgZGVzYzogJ3doZXJlIHt7YXJnMX19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wcykge1xuICAgICAgaWYgKCFfLmlzUGxhaW5PYmplY3QocHJvcHMpKSB7XG4gICAgICAgIHJldHVybiAncHJvcHMgaXMgbm90IGFuIG9iamVjdCc7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ud2hlcmUoYWN0dWFsLCBwcm9wcylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1hcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXAnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1hcChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWV0aG9kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSByZXN1bHQgb2YgaW52b2tpbmcgdGhlIG5hbWVkJyxcbiAgICAgICdtZXRob2Qgb24gdGhlIHN1YmplY3QgdmFsdWUuJyxcbiAgICBdLFxuICAgIGRlc2M6IFwibWV0aG9kIC4ke2FyZzF9KClcIixcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBtZXRob2QsIGFyZykge1xuICAgICAgaWYgKHR5cGVvZiBhY3R1YWxbbWV0aG9kXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gJyR7YXJnMX0gaXMgbm90IGEgbWV0aG9kIGluIHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDIpO1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBhY3R1YWxbbWV0aG9kXS5hcHBseShhY3R1YWwsIGFyZ3MpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBpbnZva2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIG1ldGhvZCBuYW1lZCBieSB0aGUgYXJndW1lbnQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjaW52b2tlJ1xuICAgIF0sXG4gICAgZGVzYzogXCJpbnZva2UgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZCwgYXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaW52b2tlLmFwcGx5KF8sIGFyZ3VtZW50cylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHBsdWNrOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHRoZSBvbmUgb2YgdGhlIHNwZWNpZmljIHByb3BlcnR5IGZvciBhbGwgZWxlbWVudHMnLFxuICAgICAgJ2luIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3BsdWNrJ1xuICAgIF0sXG4gICAgZGVzYzogJ3BsdWNrKCB7e2FyZzF9fSApJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucGx1Y2soYWN0dWFsLCBwcm9wKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgZmlyc3Q6IHtcbiAgICBhbGlhc2VzOiBbICdoZWFkJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ZpcnN0J1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBmaXJzdCBlbGVtZW50JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaGVhZChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgbGFzdDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2xhc3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubGFzdChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgcmVzdDoge1xuICAgIGFsaWFzZXM6IFsgJ3RhaWwnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50YWlsKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1pbjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSBzdWJqZWN0IHRvIGJlIHRoZSBtaW5pbXVtIHZhbHVlIGZvdW5kIG9uIHRoZSBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtaW4nXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWluKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBtYXg6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgc3ViamVjdCB0byBiZSB0aGUgbWF4aW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWF4J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1heChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzb3J0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHNvcnRlZCBpbiBhc2NlbmRpbmcgb3JkZXIuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3NvcnRCeSdcbiAgICBdLFxuICAgIGRlc2M6ICdzb3J0JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgLy8gQWxsb3cgdGhlIHVzZSBvZiBleHByZXNzaW9ucyBhcyBjYWxsYmFja3NcbiAgICAgIGlmIChjYWxsYmFjayBpbnN0YW5jZW9mIGFzcy5DaGFpbikge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrLnJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnNvcnRCeShhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RvcmU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGVscGVyIHRvIHN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IHZhbHVlIGJlaW5nIGV2YWx1YXRlZCBpbiB0aGUnLFxuICAgICAgJ2V4cHJlc3Npb24gaW4gc29tZSBvdGhlciBvYmplY3QuIEl0IGV4cGVjdHMgYSB0YXJnZXQgb2JqZWN0IGFuZCBvcHRpb25hbGx5JyxcbiAgICAgICd0aGUgbmFtZSBvZiBhIHByb3BlcnR5LiBJZiB0YXJnZXQgaXMgYSBmdW5jdGlvbiBpdFxcJ2xsIHJlY2VpdmUgdGhlIHZhbHVlJyxcbiAgICAgICd1c2luZyBgcHJvcGAgYXMgdGhpcyBjb250ZXh0LiBJZiBgcHJvcGAgaXMgbm90IHByb3ZpZGVkIGFuZCBgdGFyZ2V0YCBpcyBhbicsXG4gICAgICAnYXJyYXkgdGhlIHZhbHVlIHdpbGwgYmUgcHVzaGVkIHRvIGl0LidcbiAgICBdLFxuICAgIGRlc2M6ICdzdG9yZScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgdGFyZ2V0LCBwcm9wKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0LmNhbGwocHJvcCwgYWN0dWFsKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChfLmlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgIHRhcmdldC5wdXNoKGFjdHVhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICdwcm9wIHVuZGVmaW5lZCBhbmQgdGFyZ2V0IGlzIG5vdCBhbiBhcnJheSBvciBhIGZ1bmN0aW9uOiB7e2FyZzF9fSc7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoXy5pc09iamVjdCh0YXJnZXQpKSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IGFjdHVhbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAndGFyZ2V0IGlzIG5vdCBhbiBvYmplY3Q6IHt7YXJnMX19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn0pO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG4vLyBIZWxwZXIgZmFjdG9yeSBmb3IgdGhlbmFibGUgY2FsbGJhY2tzXG5mdW5jdGlvbiByZXN1bWUgKHJlc29sdmVyLCByZXN1bHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJlc29sdmVyLnJlc3VtZSh2YWx1ZSwgcmVzdWx0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNQcm9taXNlICh2YWx1ZSkge1xuICB2YXIgdGhlbiA9IHZhbHVlICYmIHZhbHVlLnRoZW47XG4gIHJldHVybiB0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuXG4vLyBQcm9taXNlIHJlbGF0ZWQgbWF0Y2hlcnNcbmFzcy5yZWdpc3Rlcih7XG5cbiAgcHJvbWlzZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdWZXJpZmllcyB0aGF0IHRoZSB2YWx1ZSBpcyBhIHByb21pc2UgKFByb21pc2UvQSspIGJ1dCBkb2VzIG5vdCBhdHRhY2gnLFxuICAgICAgJ3RoZSBleHByZXNzaW9uIHRvIGl0cyByZXNvbHV0aW9uIGxpa2UgYHJlc29sdmVzYCBvciBgcmVqZWN0c2AsIGluc3RlYWQnLFxuICAgICAgJ3RoZSBvcmlnaW5hbCBwcm9taXNlIHZhbHVlIGlzIGtlcHQgYXMgdGhlIHN1YmplY3QgZm9yIHRoZSBmb2xsb3dpbmcnLFxuICAgICAgJ2V4cGVjdGF0aW9ucy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSBwcm9taXNlJyxcbiAgICBmYWlsOiAnZ290ICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gaXNQcm9taXNlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuXG4gIHJlc29sdmVzOiB7XG4gICAgYWxpYXNlczogWyAncmVzb2x2ZWQnLCAnZnVsZmlsbGVkJywgJ2Z1bGZpbGwnLCAnZXZlbnR1YWxseScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlJyxcbiAgICAgICdhcHBseWluZyB0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZXNvbHZlZCwnLFxuICAgICAgJ211dGF0aW5nIHRoZSB2YWx1ZSB0byB0aGUgcmVzb2x2ZWQgb25lLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZScsXG4gICAgICAncHJvbWlzZSBpcyBhY3R1YWxseSByZWplY3RlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZXNvbHZlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIHJlamVjdGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEF0dGFjaCB0byB0aGUgcHJvbWlzZSBzbyB3ZSBnZXQgbm90aWZpZWQgd2hlbiBpdCdzIHJlc29sdmVkLlxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIGJlY29tZToge1xuICAgIGFsaWFzZXM6IFsgJ2JlY29tZXMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1dvcmtzIHRoZSBzYW1lIGFzIC5yZXNvbHZlcyBidXQgYWRkaXRpb25hbGx5IHdpbGwgZG8gYSBjb21wYXJpc29uIGJldHdlZW4nLFxuICAgICAgJ3RoZSByZXNvbHZlZCB2YWx1ZSBmcm9tIHRoZSBwcm9taXNlIGFuZCB0aGUgZXhwZWN0ZWQgb25lLiBJdCBjYW4gYmUgc2VlbicsXG4gICAgICAnYXMgYSBzaG9ydGN1dCBmb3IgYC5yZXNvbHZlcy5lcShleHBlY3RlZClgLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZWNvbWUge3sgZXhwZWN0ZWQgfX0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIE1ha2UgaXQgYXN5bmNcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICAvLyBBdHRhY2ggdG8gdGhlIHByb21pc2UgcmVzb2x1dGlvblxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGVxdWFsaXR5IHN1Y2NlZWRzIGp1c3Qga2VlcCByZXNvbHZpbmdcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBfLmlzRXF1YWwodmFsdWUsIGV4cGVjdGVkKSA/IHVuZGVmaW5lZCA6IGZhbHNlO1xuICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKHZhbHVlLCByZXN1bHQpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyLCBmYWxzZSlcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgcmVqZWN0czoge1xuICAgIGFsaWFzZXM6IFsgJ3JlamVjdGVkJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBdHRhY2ggdGhlIG1hdGNoZXIgdG8gYSBwcm9taXNlIHZhbHVlIChQcm9taXNlcy9BKykgdG8gY29udGludWUgYXBwbHlpbmcnLFxuICAgICAgJ3RoZSBjaGFpbiBvZiBtYXRjaGVycyBvbmNlIHRoZSBwcm9taXNlIGhhcyBiZWVuIHJlamVjdGVkLCBtdXRhdGluZyB0aGUnLFxuICAgICAgJ3ZhbHVlIHRvIGJlY29tZSB0aGUgcmVqZWN0ZWQgZXJyb3IuJyxcbiAgICAgICdJdCB3aWxsIGZhaWwgaWYgdGhlIHZhbHVlIGlzIG5vdCBhIHByb21pc2UgKG5vIC50aGVuIG1ldGhvZCkgb3IgdGhlJyxcbiAgICAgICdwcm9taXNlIGlzIGFjdHVhbGx5IGZ1bGZpbGxlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZWplY3RlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIGZ1bGZpbGxlZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIEVudGVyIGFzeW5jIG1vZGVcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIsIGZhbHNlKSxcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gaXRlcmF0ZSBhIHZhbHVlIGNyZWF0aW5nIGZvcmtzIGZvciBlYWNoIGVsZW1lbnQsIGhhbmRsaW5nXG4vLyBhc3luYyBleHBlY3RhdGlvbnMgaWYgbmVlZGVkLlxuZnVuY3Rpb24gZm9ya2VyIChyZXNvbHZlciwgYWN0dWFsLCBpdGVyYXRvciwgc3RvcCkge1xuICB2YXIgYnJhbmNoZXMgPSBfLnNpemUoYWN0dWFsKTtcbiAgdmFyIHJlc3VsdCA9IGl0ZXJhdG9yKGFjdHVhbCwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cbiAgICB2YXIgZm9yayA9IHJlc29sdmVyLmZvcmsoKTtcblxuICAgIHZhciBwYXJ0aWFsID0gZm9yayh2YWx1ZSk7XG5cbiAgICAvLyBTdG9wIGl0ZXJhdGluZyBhcyBzb29uIGFzIHBvc3NpYmxlXG4gICAgaWYgKHBhcnRpYWwgPT09IHN0b3ApIHtcbiAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICByZXR1cm4gc3RvcDtcbiAgICB9XG5cbiAgICBpZiAocGFydGlhbCA9PT0gIXN0b3ApIHtcbiAgICAgIGJyYW5jaGVzIC09IDE7XG4gICAgICBpZiAoMCA9PT0gYnJhbmNoZXMpIHtcbiAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAhc3RvcDtcbiAgICB9XG5cbiAgICAvLyBBc3luYyBzdXBwb3J0XG4gICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIHRoZSBmb3JrJ3MgZmluYWwgcmVzdWx0XG4gICAgZm9yay5maW5hbGl6ZShmdW5jdGlvbiAoZmluYWwpIHtcbiAgICAgIC8vIFdlJ3JlIGRvbmUgdGhlIG1vbWVudCBvbmUgaXMgYSBzdG9wIHJlc3VsdFxuICAgICAgaWYgKGZpbmFsID09PSBzdG9wKSB7XG4gICAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCBzdG9wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyYW5jaGVzIC09IDE7XG4gICAgICAgIGlmICgwID09PSBicmFuY2hlcykge1xuICAgICAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsICFzdG9wKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbmFsO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICFzdG9wOyAgLy8ga2VlcCBpdGVyYXRpbmdcbiAgfSk7XG5cbiAgLy8gV2hlbiB0aGUgZm9ya3MgY29tcGxldGVkIHN5bmNocm9ub3VzbHkganVzdCBmaW5hbGl6ZSB0aGUgcmVzb2x2ZXJcbiAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUocmVzdWx0KTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cblxuLy8gUXVhbnRpZmllcnNcbmFzcy5yZWdpc3Rlcih7XG5cbiAgZXZlcnk6IHtcbiAgICBhbGlhc2VzOiBbICdhbGwnLCAnYWxsT2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ2FsbCBvZiB0aGVtIHN1Y2NlZWQnXG4gICAgXSxcbiAgICBkZXNjOiAnRm9yIGV2ZXJ5IG9uZTonLFxuICAgIGZhaWw6ICdvbmUgZGlkblxcJ3QnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uZXZlcnksIGZhbHNlKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIHNvbWU6IHtcbiAgICBhbGlhc2VzOiBbICdhbnlPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnYXQgbGVhc3Qgb25lIG9mIHRoZW0gc3VjY2VlZHMnXSxcbiAgICBkZXNjOiAnQXQgbGVhc3Qgb25lOicsXG4gICAgZmFpbDogJ25vbmUgZGlkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBzdHVmZiB0byBkb1xuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvcmtlcihyZXNvbHZlciwgYWN0dWFsLCBfLnNvbWUsIHRydWUpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgbm9uZToge1xuICAgIGFsaWFzZXM6IFsgJ25vbmVPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnbm9uZSBvZiB0aGVtIHN1Y2NlZWQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ05vbmUgb2YgdGhlbTonLFxuICAgIGZhaWw6ICdvbmUgZGlkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBzdHVmZiB0byBkb1xuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgYXJlIGdvaW5nIHRvIHVzZSB0aGUgc2FtZSBhbGdvcml0aG0gYXMgZm9yIC5zb21lIGJ1dCB3ZSdsbCBuZWdhdGVcbiAgICAgICAgLy8gaXRzIHJlc3VsdCB1c2luZyBhIGZpbmFsaXplci5cbiAgICAgICAgcmVzb2x2ZXIuZmluYWxpemUoZnVuY3Rpb24gKGZpbmFsKSB7XG4gICAgICAgICAgcmV0dXJuICFmaW5hbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZvcmtlcihyZXNvbHZlciwgYWN0dWFsLCBfLnNvbWUsIHRydWUpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG4iLCJ2YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5cbnZhciBjaGVja0NoYWluID0gbmV3IENoYWluKCk7XG5cblxuZXhwb3J0cy5sb2Rhc2ggPSBmdW5jdGlvbiAoXykge1xuICAvLyBFeGl0IGlmIGFscmVhZHkgcGF0Y2hlZFxuICBpZiAoXy5jcmVhdGVDYWxsYmFjayhjaGVja0NoYWluKSA9PT0gY2hlY2tDaGFpbi50ZXN0KSB7XG4gICAgcmV0dXJuIF87XG4gIH1cblxuICAvLyBPdmVycmlkZSBsb2Rhc2gncyBkZWZhdWx0IGNyZWF0ZUNhbGxiYWNrIG1lY2hhbmlzbSB0byBtYWtlIGl0IHVuZGVyc3RhbmRcbiAgLy8gYWJvdXQgb3VyIGV4cHJlc3Npb24gY2hhaW5zLlxuICBfLmNyZWF0ZUNhbGxiYWNrID0gXy53cmFwKF8uY3JlYXRlQ2FsbGJhY2ssIGZ1bmN0aW9uKG9yaWcsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgaWYgKENoYWluLmlzQ2hhaW4oY2FsbGJhY2spKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sudGVzdDtcbiAgICB9XG5cbiAgICAvLyBTdXBwb3J0IF8ud2hlcmUgc3R5bGUuIEl0J3Mgbm90IGFzIGZhc3QgYXMgdGhlIG9yaWdpbmFsIG9uZSBzaW5jZSB3ZVxuICAgIC8vIGhhdmUgdG8gZ28gdmlhIF8uaXNFcXVhbCBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBpbnRlcm5hbCBmdW5jdGlvblxuICAgIGlmIChfLmlzUGxhaW5PYmplY3QoY2FsbGJhY2spKSB7XG4gICAgICB2YXIgcHJvcHMgPSBfLmtleXMoY2FsbGJhY2spO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlLCBsZW5ndGggPSBwcm9wcy5sZW5ndGgsIGtleTtcbiAgICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgICAga2V5ID0gcHJvcHNbbGVuZ3RoXTtcbiAgICAgICAgICByZXN1bHQgPSBfLmlzRXF1YWwob2JqZWN0W2tleV0sIGNhbGxiYWNrW2tleV0pO1xuICAgICAgICAgIGlmICghcmVzdWx0KSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3JpZyhjYWxsYmFjaywgdGhpc0FyZyk7XG4gIH0pO1xuXG4gIC8vIE92ZXJyaWRlIGxvZGFzaCdzIGRlZmF1bHQgaXNFcXVhbCBpbXBsZW1lbnRhdGlvbiBzbyBpdCB1bmRlcnN0YW5kc1xuICAvLyBhYm91dCBleHByZXNzaW9uIGNoYWlucy5cbiAgZnVuY3Rpb24gY21wIChhLCBiKSB7XG4gICAgcmV0dXJuIENoYWluLmlzQ2hhaW4oYSkgPyBhLnRlc3QoYikgOiBDaGFpbi5pc0NoYWluKGIpID8gYi50ZXN0KGEpIDogdW5kZWZpbmVkO1xuICB9XG4gIF8uaXNFcXVhbCA9IF8ud3JhcChfLmlzRXF1YWwsIGZ1bmN0aW9uIChvcmlnLCBhLCBiLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHZhciByZXN1bHQgPSBjYWxsYmFjayA/IGNhbGxiYWNrLmNhbGwodGhpc0FyZyB8fCB0aGlzLCBhLCBiKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJlc3VsdCA9IG9yaWcoYSwgYiwgY21wLCB0aGlzQXJnKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG5cbiAgcmV0dXJuIF87XG59O1xuXG5cbmV4cG9ydHMuc2lub24gPSBmdW5jdGlvbiAoc2lub24pIHtcbiAgLy8gRXhpdCBpZiBhbHJlYWR5IHBhdGNoZWRcbiAgaWYgKHNpbm9uLm1hdGNoLmlzTWF0Y2hlcihjaGVja0NoYWluKSkge1xuICAgIHJldHVybiBzaW5vbjtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIFNpbm9uJ3MgLmlzTWF0Y2hlciBpbXBsZW1lbnRhdGlvbiB0byBhbGxvdyBvdXIgZXhwcmVzc2lvbnMgdG8gYmVcbiAgLy8gdHJhbnNwYXJlbnRseSBzdXBwb3J0ZWQgYnkgaXQuXG4gIHZhciBvbGRJc01hdGNoZXIgPSB1dGlsLmJpbmQoc2lub24ubWF0Y2guaXNNYXRjaGVyLCBzaW5vbi5tYXRjaCk7XG4gIHNpbm9uLm1hdGNoLmlzTWF0Y2hlciA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gQ2hhaW4uaXNDaGFpbihvYmopIHx8IG9sZElzTWF0Y2hlcihvYmopO1xuICB9O1xuXG4gIHJldHVybiBzaW5vbjtcbn07XG4iLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLy8gVXNlIGEgY2FwcGVkIHBvb2wsIHRoZSByZWxlYXNpbmcgYWxnb3JpdGhtIGlzIHByZXR0eSBzb2xpZCBzbyB3ZSBzaG91bGRcbi8vIGhhdmUgYSBnb29kIHJlLXVzZSByYXRpbyB3aXRoIGp1c3QgYSBmZXcgaW4gdGhlIHBvb2wuIFRoZW4gaW4gY2FzZVxuLy8gc29tZXRoaW5nIGdvZXMgd3JvbmcgdGhlIEdDIHdpbGwgdGFrZSBjYXJlIG9mIGl0IGFmdGVyIGEgd2hpbGUuXG52YXIgcG9vbCA9IHV0aWwuQ2FwcGVkUG9vbCgxMDApO1xudmFyIGNyZWF0ZWQgPSAwO1xuXG5cbi8vIEluc3RhbnRpYXRlcyBhIG5ldyByZXNvbHZlciBmdW5jdG9yXG5mdW5jdGlvbiBmYWN0b3J5ICgpIHtcbiAgLy8gSnVzdCBmb3J3YXJkcyB0aGUgY2FsbCB0byB0aGUgcmVzb2x2ZXIgYnkgc2V0dGluZyBpdHNlbGYgYXMgY29udGV4dC5cbiAgZnVuY3Rpb24gZm4gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyLmNhbGwoZm4sIHZhbHVlKTtcbiAgfVxuXG4gIGZuLmlkID0gKytjcmVhdGVkO1xuXG4gIC8vIFRoZSBzdGF0ZSBpcyBhdHRhY2hlZCB0byB0aGUgZnVuY3Rpb24gb2JqZWN0IHNvIGl0J3MgYXZhaWxhYmxlIHRvIHRoZVxuICAvLyBzdGF0ZS1sZXNzIGZ1bmN0aW9ucyB3aGVuIHJ1bm5pbmcgdW5kZXIgYHRoaXMuYC5cbiAgZm4uY2hhaW4gPSBudWxsO1xuICBmbi5wYXJlbnQgPSBudWxsO1xuICBmbi5wYXVzZWQgPSBmYWxzZTtcbiAgZm4ucmVzb2x2ZWQgPSBbXTtcbiAgZm4uZmluYWxpemVycyA9IFtdO1xuXG4gIC8vIEV4cG9zZSB0aGUgYmVoYXZpb3VyIGluIHRoZSBmdW5jdG9yXG4gIGZuLnBhdXNlID0gcGF1c2U7XG4gIGZuLnJlc3VtZSA9IHJlc3VtZTtcbiAgZm4uZm9yayA9IGZvcms7XG4gIGZuLmpvaW4gPSBqb2luO1xuICBmbi5maW5hbGl6ZSA9IGZpbmFsaXplO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwgJ2V4aGF1c3RlZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlc29sdmVkLmxlbmd0aCA+PSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX18ubGVuZ3RoO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGZuO1xufVxuXG4vLyBUaGlzIGlzIHRoZSBjb3JlIHJlc29sdXRpb24gYWxnb3JpdGhtLCBpdCBvcGVyYXRlcyBvdmVyIHRoZSBjaGFpblxuLy8gb2YgZXhwZWN0YXRpb25zIGNoZWNraW5nIHRoZW0gb25lIGFmdGVyIHRoZSBvdGhlciBhZ2FpbnN0IGEgdmFsdWUuXG4vLyBJZiBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGl0J2xsIGJlIGltbWVkaWF0ZWx5IGNhbGxlZCB1c2luZyB0aGVcbi8vIGV4cGVjdGF0aW9uIGluc3RhbmNlIGFzIGNvbnRleHQgYW5kIHBhc3NpbmcgYXMgb25seSBhcmd1bWVudCB0aGVcbi8vIGN1cnJlbnQgcmVzb2x2ZSBmdW5jdGlvbiwgdGhpcyBhbGxvd3MgYW4gZXhwZWN0YXRpb24gdG8gb3ZlcnJpZGVcbi8vIHRoZSB2YWx1ZSBhbmQvb3IgY29udHJvbCB0aGUgcmVzb2x1dGlvbiB3aXRob3V0IGV4cG9zaW5nIHRvbyBtYW55XG4vLyBpbnRlcm5hbCBkZXRhaWxzLlxuLy8gV2hlbiBpdCByZXR1cm5zIGB1bmRlZmluZWRgIGl0IGp1c3QgbWVhbnMgdGhhdCB0aGUgcmVzb2x1dGlvbiB3YXNcbi8vIHBhdXNlZCAoYXN5bmMpLCB3ZSBjYW4gbm90IG9idGFpbiBhIGZpbmFsIHJlc3VsdCB1c2luZyBhIHN5bmNocm9ub3VzXG4vLyBjYWxsLiBUaGlzIGNhbiBiZSB1c2VkIGJ5IG1hdGNoZXJzIHdoZW4gdGFraW5nIG92ZXIgdGhlIHJlc29sdXRpb24gdG9cbi8vIGtub3cgaWYgdGhleSBuZWVkIHRvIG1hbmdsZSB0aGUgcmVzdWx0cyBvciB0aGV5IGhhdmUgdG8gcmVnaXN0ZXIgYVxuLy8gZmluYWxpemVyIHRvIGJlIG5vdGlmaWVkIG9mIHRoZSBmaW5hbCByZXN1bHQgZnJvbSB0aGUgY2hhaW4uXG5mdW5jdGlvbiByZXNvbHZlciAodmFsdWUpIHtcbiAgdmFyIGxpc3QsIHJlc3VsdCwgZXhwO1xuXG4gIGxpc3QgPSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX187XG4gIG9mZnNldCA9IHRoaXMucmVzb2x2ZWQubGVuZ3RoO1xuICByZXN1bHQgPSB0cnVlO1xuXG4gIGZvciAodmFyIGkgPSBvZmZzZXQ7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gQ3JlYXRlIGEgbmV3IG9iamVjdCBpbmhlcml0aW5nIGZyb20gdGhlIGV4cGVjdGF0aW9uIGJ1dCB3aXRoIHRoZVxuICAgIC8vIGN1cnJlbnQgYWN0dWFsIHZhbHVlIHByb3Zpc2lvbmVkLiBJdCBhbGxvd3MgdGhlIGV4cHJlc3Npb24gdG8gbXV0YXRlXG4gICAgLy8gaXRzIHN0YXRlIGZvciB0aGlzIGV4ZWN1dGlvbiBidXQgbm90IGFmZmVjdCBvdGhlciB1c2VzIG9mIGl0LlxuICAgIGV4cCA9IHV0aWwuY3JlYXRlKGxpc3RbaV0sIHsgYWN0dWFsOiB2YWx1ZSB9KTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgcmVzb2x2ZWQgZXhwZWN0YXRpb25zXG4gICAgdGhpcy5yZXNvbHZlZC5wdXNoKGV4cCk7XG5cbiAgICAvLyBFeGVjdXRlIHRoZSBleHBlY3RhdGlvbiB0byBvYnRhaW4gaXRzIHJlc3VsdFxuICAgIHJlc3VsdCA9IGV4cC5yZXN1bHQgPSBleHAucmVzb2x2ZSgpO1xuXG4gICAgLy8gQWxsb3cgZXhwZWN0YXRpb25zIHRvIHRha2UgY29udHJvbCBmb3IgdGhlIHJlbWFpbmluZyBvZiB0aGUgY2hhaW5cbiAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gU2luY2UgdGhlIGNvbnRyb2wgaXMgZGVsZWdhdGVkIHRvIHRoZSBleHByZXNzaW9uIHdlIGRvbid0IGhhdmUgdG9cbiAgICAgIC8vIGRvIGFueXRoaW5nIG1vcmUgaGVyZS5cbiAgICAgIHJldHVybiBleHAucmVzdWx0ID0gcmVzdWx0LmNhbGwoZXhwLCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBTdG9wIG9uIGZpcnN0IGZhaWx1cmVcbiAgICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB3ZSBqdXN0IG5lZWQgdG8gYXBwbHkgYW55IHBlbmRpbmcgZmluYWxpemVyc1xuICByZXR1cm4gdGhpcy5maW5hbGl6ZShyZXN1bHQpO1xufVxuXG5cbi8vIFdoZW4gcmVzb2x2aW5nIGFzeW5jIGZsb3dzIChpLmUuOiBwcm9taXNlcykgdGhpcyB3aWxsIHBhdXNlIHRoZSBnaXZlblxuLy8gcmVzb2x2ZXIgdW50aWwgYSBjYWxsIHRvIC5yZXN1bWUoKSBpcyBtYWRlLlxuZnVuY3Rpb24gcGF1c2UgKCkge1xuICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc29sdmVyIGFscmVhZHkgcGF1c2VkJyk7XG4gIH1cblxuICB0aGlzLnBhdXNlZCA9IHRydWU7XG59XG5cbi8vIE9uY2UgdGhlIGFzeW5jIGZsb3cgaGFzIGNvbXBsZXRlZCB3ZSBjYW4gY29udGludWUgcmVzb2x2aW5nIHdoZXJlIHdlXG4vLyBzdG9wZWQuIFdoZW4gdGhlIG92ZXJyaWRlIHBhcmFtIGlzIG5vdCB1bmRlZmluZWQgd2UnbGwgc2tpcCBjYWxsaW5nIHRoZVxuLy8gcmVzb2x2ZXIgYW5kIGFzc3VtZSB0aGF0IGJvb2wgYXMgdGhlIGZpbmFsIHJlc3VsdC4gVGhpcyBhbGxvd3MgdGhlIGFzeW5jXG4vLyBjb2RlIHRvIHNob3J0Y3V0IHRoZSByZXNvbHZlci5cbmZ1bmN0aW9uIHJlc3VtZSAoYWN0dWFsLCBvdmVycmlkZSkge1xuICBpZiAoIXRoaXMucGF1c2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHZlciBpcyBub3QgY3VycmVudGx5IHBhdXNlZCcpO1xuICB9XG5cbiAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcblxuICAvLyBBIGZpbmFsIHJlc3VsdCB3YXMgcHJvdmlkZWQgc28ganVzdCBmaW5hbGl6ZSB0aGUgcmVzb2x2ZXJcbiAgaWYgKG92ZXJyaWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdGhpcy5maW5hbGl6ZShvdmVycmlkZSk7XG4gIH1cblxuICAvLyBMZXQncyBjb250aW51ZSByZXNvbHZpbmcgd2l0aCB0aGUgbmV3IHZhbHVlXG4gIC8vIE5vdGU6IHRoaXMoKSBsb29rcyB3ZWlyZCBidXQgcmVtZW1iZXIgd2UncmUgdXNpbmcgYSBmdW5jdGlvbiBhcyBjb250ZXh0XG4gIHJldHVybiB0aGlzKGFjdHVhbCk7XG59XG5cbi8vIENsb25lcyB0aGUgY3VycmVudCByZXNvbHZlciBzbyB3ZSBjYW4gZm9yayBhbmQgZGlzY2FyZCBvcGVyYXRpb25zLlxuZnVuY3Rpb24gZm9yayAoKSB7XG4gIHZhciBmb3JrID0gYWNxdWlyZSh0aGlzLmNoYWluKTtcbiAgZm9yay5wYXJlbnQgPSB0aGlzO1xuICBmb3JrLnJlc29sdmVkID0gXy5yZWplY3QodGhpcy5yZXNvbHZlZCwgQXJyYXkuaXNBcnJheSk7XG4gIHJldHVybiBmb3JrO1xufVxuXG4vLyBBc3N1bWUgdGhlIHJlc3VsdHMgZnJvbSBhIGZvcmsgaW4gdGhlIG1haW4gcmVzb2x2ZXJcbmZ1bmN0aW9uIGpvaW4gKGZvcmspIHtcbiAgdmFyIGxlbiA9IF8ucmVqZWN0KHRoaXMucmVzb2x2ZWQsIEFycmF5LmlzQXJyYXkpLmxlbmd0aDtcbiAgdGhpcy5yZXNvbHZlZC5wdXNoKFxuICAgIGZvcmsucmVzb2x2ZWQuc2xpY2UobGVuKVxuICApO1xufVxuXG4vLyBXaGVuIHRoZSBhcmd1bWVudCBpcyBhIGZ1bmN0aW9uIGl0IGdldHMgcmVnaXN0ZXJlZCBhcyBhIGZpbmFsaXplciBmb3IgdGhlXG4vLyByZXN1bHQgb2J0YWluZWQgb25jZSB0aGUgZXhwcmVzc2lvbiBoYXMgYmVlbiBmdWxseSByZXNvbHZlZCAoaS5lLiBhc3luYykuXG4vLyBPdGhlcndpc2UgaXQnbGwgZXhlY3V0ZSBhbnkgcmVnaXN0ZXJlZCBmdW5jdGlvbnMgb24gdGhlIGdpdmVuIHJlc3VsdCBhbmRcbi8vIGFsbG93IHRoZW0gdG8gY2hhbmdlIGl0IGJlZm9yZSByZWxlYXNpbmcgdGhlIHJlc29sdmVyIGludG8gdGhlIHBvb2wuXG5mdW5jdGlvbiBmaW5hbGl6ZShyZXN1bHQpIHtcbiAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLmZpbmFsaXplcnMucHVzaChcbiAgICAgIFtyZXN1bHQsIF8ubGFzdCh0aGlzLnJlc29sdmVkKV1cbiAgICApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIE5vdGhpbmcgeWV0IHRvIGZpbmFsaXplIHNpbmNlIHRoZSByZXN1bHQgaXMgc3RpbGwgdW5rbm93blxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gQWxsb3cgZmluYWxpemVycyB0byB0b2dnbGUgdGhlIHJlc3VsdCAoTElGTyBvcmRlcilcbiAgdmFyIGZpbmFsaXplcjtcbiAgd2hpbGUgKHRoaXMuZmluYWxpemVycy5sZW5ndGggPiAwKSB7XG4gICAgZmluYWxpemVyID0gdGhpcy5maW5hbGl6ZXJzLnBvcCgpO1xuICAgIHJlc3VsdCA9IGZpbmFsaXplclswXS5jYWxsKGZpbmFsaXplclsxXSwgcmVzdWx0KTtcbiAgICBmaW5hbGl6ZXJbMV0ucmVzdWx0ID0gcmVzdWx0O1xuICB9XG5cbiAgLy8gTGV0IHRoZSBjaGFpbiBkaXNwYXRjaCB0aGUgZmluYWwgcmVzdWx0IGJ1dCBvbmx5IGZvciBub24tZm9ya2VkIHJlc29sdmVyc1xuICBpZiAoIXRoaXMucGFyZW50KSB7XG4gICAgdGhpcy5jaGFpbi5kaXNwYXRjaFJlc3VsdCh0aGlzLnJlc29sdmVkLCByZXN1bHQpO1xuICB9XG5cbiAgLy8gV2hlbiBhIGZpbmFsIHJlc3VsdCBoYXMgYmVlbiBvYnRhaW5lZCByZWxlYXNlIHRoZSByZXNvbHZlciB0byB0aGUgcG9vbFxuICBwb29sLnB1c2godGhpcyk7XG4gIGlmIChwb29sLmxlbmd0aCA+IGNyZWF0ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bvb2wgY29ycnVwdGVkISBDcmVhdGVkICcgKyBjcmVhdGVkICsgJyBidXQgdGhlcmUgYXJlICcgKyBwb29sLmxlbmd0aCArICcgcG9vbGVkJyk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBBY3F1aXJlcyBhIHJlc29sdmVyIGZ1bmN0b3IsIGlmIHRoZXJlIGlzIG9uZSBpbiB0aGUgcG9vbCBpdCdsbCBiZSByZXNldCBhbmRcbi8vIHJldXNlZCwgb3RoZXJ3aXNlIGl0J2xsIGNyZWF0ZSBhIG5ldyBvbmUuIFdoZW4geW91J3JlIGRvbmUgd2l0aCB0aGUgcmVzb2x2ZXJcbi8vIHlvdSBzaG91ZCBnaXZlIGl0IHRvIGByZWxlYXNlKClgIHNvIGl0IGNhbiBiZSBpbmNvcnBvcmF0ZWQgdG8gdGhlIHBvb2wuXG4vLyBUaGUgcmVhc29uIGZvciB1c2luZyBhIHBvb2wgb2Ygb2JqZWN0cyBoZXJlIGlzIHRoYXQgZXZlcnkgdGltZSB3ZSBldmFsdWF0ZVxuLy8gYW4gZXhwcmVzc2lvbiB3ZSdsbCBuZWVkIGEgcmVzb2x2ZXIsIHdoZW4gdXNpbmcgcXVhbnRpZmllcnMgbXVsdGlwbGUgZm9ya3Ncbi8vIHdpbGwgYmUgY3JlYXRlZCwgc28gaXQncyBpbXBvcnRhbnQgdG8gaW1wcm92ZSB0aGUgcGVyZm9ybWFuY2UuXG5mdW5jdGlvbiBhY3F1aXJlIChjaGFpbikge1xuICB2YXIgcmVzb2x2ZXIgPSBwb29sLnBvcCgpIHx8IGZhY3RvcnkoKTtcblxuICAvLyBSZXNldCB0aGUgc3RhdGUgb2YgdGhlIHJlc29sdmVyXG4gIHJlc29sdmVyLmNoYWluID0gY2hhaW47XG4gIHJlc29sdmVyLnBhcmVudCA9IG51bGw7XG4gIHJlc29sdmVyLnBhdXNlZCA9IGZhbHNlO1xuICB3aGlsZSAocmVzb2x2ZXIucmVzb2x2ZWQubGVuZ3RoID4gMCkge1xuICAgIHJlc29sdmVyLnJlc29sdmVkLnBvcCgpO1xuICB9XG4gIHdoaWxlIChyZXNvbHZlci5maW5hbGl6ZXJzLmxlbmd0aCA+IDApIHtcbiAgICByZXNvbHZlci5maW5hbGl6ZXJzLnBvcCgpO1xuICB9XG5cbiAgcmV0dXJuIHJlc29sdmVyO1xufVxuXG5cbmV4cG9ydHMuYWNxdWlyZSA9IGFjcXVpcmU7XG4iLCIvLyBTdXBwb3J0IGZvciAuc2hvdWxkIHN0eWxlIHN5bnRheCwgbm90aWNlIHRoYXQgd2hpbGUgaGVyZSByZXNpZGVzIHRoZSBjb3JlXG4vLyBsb2dpYyBmb3IgaXQsIHRoZSBpbnRlcmZhY2UgaXMgZG9uZSBpbiBhc3MuanMgaW4gb3JkZXIgdG8gbWFrZSBpdCByZXR1cm5cbi8vIHRoZSBgYXNzYCBmdW5jdGlvbiBhbmQgcHJvdmlkZSBzdXBwb3J0IGZvciBpdHMgdXNlIG9uIGJlZm9yZUVhY2gvYWZ0ZXJFYWNoLlxuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG5cblxudmFyIERFRkFVTFRfUFJPUCA9ICdzaG91bGQnO1xuXG4vLyBJbnN0YWxscyB0aGUgdHlwaWNhbCAuc2hvdWxkIHByb3BlcnR5IG9uIHRoZSByb290IE9iamVjdCBwcm90b3R5cGUuXG4vLyBZb3UgY2FuIGluc3RhbGwgdW5kZXIgYW55IG5hbWUgb2YgeW91ciBjaG9vc2luZyBieSBnaXZpbmcgaXQgYXMgYXJndW1lbnQuXG4vL1xuLy8gQmFzaWNhbGx5IGJvcnJvd2VkIGZyb20gdGhlIENoYWkgcHJvamVjdDpcbi8vICBDb3B5cmlnaHQoYykgMjAxMS0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS9pbnRlcmZhY2Uvc2hvdWxkLmpzXG5mdW5jdGlvbiBzaG91bGQgKG5hbWUpIHtcbiAgaWYgKG5hbWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gc2hvdWxkLnJlc3RvcmUoKTtcbiAgfVxuXG4gIG5hbWUgPSBuYW1lIHx8IERFRkFVTFRfUFJPUDtcblxuICBpZiAobmFtZSBpbiBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgaWYgKCFDaGFpbi5pc0NoYWluKE9iamVjdC5wcm90b3R5cGVbbmFtZV0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Fzcy5zaG91bGQ6IE9iamVjdC5wcm90b3R5cGUgYWxyZWFkeSBoYXMgYSAuJyArIG5hbWUgKyAnIHByb3BlcnR5Jyk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIG1vZGlmeSBPYmplY3QucHJvdG90eXBlIHRvIGhhdmUgYDxuYW1lPmBcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChDaGFpbi5pc0NoYWluKHRoaXMpKSB7XG4gICAgICAgIC8vIEFjdHVhbGx5IENoYWluIGluc3RhbmNlcyBkb24ndCBpbmhlcml0IGZyb20gT2JqZWN0IGJ1dCBzdGlsbFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIFN0cmluZyB8fCB0aGlzIGluc3RhbmNlb2YgTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcy5jb25zdHJ1Y3Rvcih0aGlzKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMgaW5zdGFuY2VvZiBCb29sZWFuKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyA9PSB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQWxsb3c6IGdsb2JhbC5hc3MgPSByZXF1aXJlKCdhc3MnKS5zaG91bGQoKVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgIC8vIEFsbG93IHJlc3RvcmF0aW9uXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgLy8gRXhwb3NlIGl0IGFzIGEgbm8tb3Agb24gQ2hhaW5zIHNpbmNlIHRoZXkgZG9uJ3QgaW5oZXJpdCBmcm9tIE9iamVjdFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2hhaW4ucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSAgLy8gQWxsb3cgcmVzdG9yYXRpb25cbiAgfSk7XG5cbn1cblxuc2hvdWxkLnJlc3RvcmUgPSBmdW5jdGlvbiAobmFtZSkge1xuICBuYW1lID0gbmFtZSB8fCBERUZBVUxUX1BST1A7XG5cbiAgaWYgKG5hbWUgaW4gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIGlmIChDaGFpbi5pc0NoYWluKE9iamVjdC5wcm90b3R5cGVbbmFtZV0pKSB7XG4gICAgICBkZWxldGUgT2JqZWN0LnByb3RvdHlwZVtuYW1lXTtcbiAgICAgIGRlbGV0ZSBDaGFpbi5wcm90b3R5cGVbbmFtZV07XG4gICAgfVxuICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdWxkO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbi8vIEdldCB0aGUgbmF0aXZlIFByb21pc2Ugb3IgYSBzaGltXG5leHBvcnRzLlByb21pc2UgPSBnbG9iYWwuUHJvbWlzZSB8fCAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy53aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLndpbmRvdyA6IG51bGwpLlByb21pc2U7XG5cblxuLy8gQ2FwcGVkIHBvb2wgdG8gbGltaXQgdGhlIG1heGltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgY2FuIGJlXG4vLyBzdG9yZWQgKHVuYm91bmRlZCBieSBkZWZhdWx0KS5cbmV4cG9ydHMuQ2FwcGVkUG9vbCA9IGZ1bmN0aW9uIChtYXgpIHtcbiAgdmFyIHBvb2wgPSBbXTtcblxuICBtYXggPSBtYXggfHwgTnVtYmVyLk1BWF9WQUxVRTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocG9vbCwgJ3B1c2gnLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uICh2KSB7XG4gICAgICBpZiAodGhpcy5sZW5ndGggPCBtYXgpIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guY2FsbCh0aGlzLCB2KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBwb29sO1xufTtcblxuXG52YXIgZG9Db2xvcnMgPSBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAvLyBNYXN0ZXIgb3ZlcnJpZGUgd2l0aCBvdXIgY3VzdG9tIGVudiB2YXJpYWJsZVxuICBpZiAocHJvY2Vzcy5lbnYuQVNTX0NPTE9SUyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIC90cnVlfG9ufHllc3xlbmFibGVkP3wxL2kudGVzdChwcm9jZXNzLmVudi5BU1NfQ09MT1JTKTtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIG1vY2hhIGlzIGFyb3VuZCBhbmQgdmVyaWZ5IGFnYWluc3QgaXRzIGNvbmZpZ3VyYXRpb25cbiAgdmFyIE1vY2hhID0gZ2xvYmFsLk1vY2hhO1xuICBpZiAoTW9jaGEgPT09IHVuZGVmaW5lZCAmJiByZXF1aXJlLnJlc29sdmUgJiYgcmVxdWlyZS5yZXNvbHZlKCdtb2NoYScpKSB7XG4gICAgTW9jaGEgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5Nb2NoYSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuTW9jaGEgOiBudWxsKTtcbiAgfVxuICBpZiAoTW9jaGEgIT09IHVuZGVmaW5lZCAmJiBNb2NoYS5yZXBvcnRlcnMgIT09IHVuZGVmaW5lZCAmJiBNb2NoYS5yZXBvcnRlcnMuQmFzZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIE1vY2hhLnJlcG9ydGVycy5CYXNlLnVzZUNvbG9ycztcbiAgfVxuXG4gIC8vIFF1ZXJ5IHRoZSBlbnZpcm9ubWVudCBhbmQgc2VlIGlmIHNvbWUgY29tbW9uIHZhcmlhYmxlcyBhcmUgc2V0XG4gIGlmIChwcm9jZXNzLmVudi5NT0NIQV9DT0xPUlMgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICgvLS1jb2xvcj1hbHdheXMvLnRlc3QocHJvY2Vzcy5lbnYuR1JFUF9PUFRJT05TIHx8ICcnKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gRmluYWxseSBqdXN0IGNoZWNrIGlmIHRoZSBlbnZpcm9ubWVudCBpcyBjYXBhYmxlXG4gIHZhciB0dHkgPSByZXF1aXJlKCd0dHknKTtcbiAgcmV0dXJuIHR0eS5pc2F0dHkoMSkgJiYgdHR5LmlzYXR0eSgyKTtcbn0pO1xuXG5cbi8vIFJlbW92ZSBBTlNJIGVzY2FwZXMgZnJvbSBhIHN0cmluZ1xuZnVuY3Rpb24gdW5hbnNpIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXHgxYlxcWyhcXGQrOz8pK1thLXpdL2dpLCAnJyk7XG59XG5cblxuLy8gQXZvaWQgcmVwZWF0ZWQgY29tcGlsYXRpb25zIGJ5IG1lbW9pemluZ1xudmFyIGNvbXBpbGVUZW1wbGF0ZSA9IF8ubWVtb2l6ZShmdW5jdGlvbiAodHBsKSB7XG4gIHJldHVybiBfLnRlbXBsYXRlKHRwbCwgbnVsbCwge1xuICAgIGVzY2FwZTogL1xce1xceyhbXFxzXFxTXSs/KVxcfVxcfS9nXG4gIH0pO1xufSk7XG5cbi8vIER1bXBzIGFyYml0cmFyeSB2YWx1ZXMgYXMgc3RyaW5ncyBpbiBhIGNvbmNpc2Ugd2F5XG4vLyBUT0RPOiBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2NoYWkvYmxvYi9tYXN0ZXIvbGliL2NoYWkvdXRpbHMvb2JqRGlzcGxheS5qc1xuZnVuY3Rpb24gdmFsdWVEdW1wZXIgKHYpIHtcbiAgdmFyIHZhbHVlO1xuXG4gIGlmIChfLmlzTnVtYmVyKHYpIHx8IF8uaXNOYU4odikgfHwgXy5pc0Jvb2xlYW4odikgfHwgXy5pc051bGwodikgfHwgXy5pc1VuZGVmaW5lZCh2KSkge1xuICAgIHZhbHVlID0gJzwnICsgdiArICc+JztcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHYpO1xuICB9XG5cbiAgcmV0dXJuICdcXHUwMDFiWzE7MzZtJyArIHZhbHVlICsgJ1xcdTAwMWJbMG0nO1xufVxuXG5cbi8vIEN1c3RvbWl6ZWQgdmVyc2lvbiBvZiBsb2Rhc2ggdGVtcGxhdGVcbmZ1bmN0aW9uIHRlbXBsYXRlICh0cGwsIGNvbnRleHQpIHtcbiAgdmFyIGZuID0gY29tcGlsZVRlbXBsYXRlKHRwbCk7XG4gIGlmIChjb250ZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgb3JpZ0VzY2FwZSA9IF8uZXNjYXBlO1xuICB0cnkge1xuICAgIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IGVzY2FwZSBmdW5jdGlvbiB0byB1c2UgaXQgZm9yIGR1bXBpbmcgZm9ybWF0dGVkIHZhbHVlc1xuICAgIF8uZXNjYXBlID0gdmFsdWVEdW1wZXI7XG5cbiAgICByZXR1cm4gZm4oY29udGV4dCk7XG5cbiAgfSBmaW5hbGx5IHtcbiAgICBfLmVzY2FwZSA9IG9yaWdFc2NhcGU7XG4gIH1cbn1cblxuLy8gQSBzaW1wbGUgZmFzdCBmdW5jdGlvbiBiaW5kaW5nIHByaW1pdGl2ZSBvbmx5IHN1cHBvcnRpbmcgc2V0dGluZyB0aGUgY29udGV4dFxuZnVuY3Rpb24gYmluZChmbiwgdGhpc0FyZykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseSh0aGlzQXJnLCBhcmd1bWVudHMpO1xuICB9O1xufVxuXG4vLyBRdWlja2x5IGNyZWF0ZXMgYSBuZXcgb2JqZWN0IHdpdGggYSBjdXN0b20gcHJvdG90eXBlIGFuZCBzb21lIHZhbHVlXG4vLyBvdmVycmlkZXMuXG5mdW5jdGlvbiBjcmVhdGUocHJvdG8sIHZhbHVlcykge1xuICBpZiAoMCA9PT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gSEFDSzogVXNlIEZ1bmN0aW9uLnByb3RvdHlwZSArIG5ldyBpbnN0ZWFkIG9mIHRoZSBzbG93LWlzaCBPYmplY3QuY3JlYXRlXG4gIGNyZWF0ZS5wcm90b3R5cGUgPSBwcm90bztcbiAgcmV0dXJuIF8uYXNzaWduKG5ldyBjcmVhdGUsIHZhbHVlcyB8fCB7fSk7XG59XG5cblxuZXhwb3J0cy5iaW5kID0gYmluZDtcbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlO1xuZXhwb3J0cy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuZXhwb3J0cy51bmFuc2kgPSB1bmFuc2k7XG5leHBvcnRzLmRvQ29sb3JzID0gZG9Db2xvcnM7XG4iLCJ2YXIgYXNzID0gcmVxdWlyZSgnLi9saWIvYXNzJyk7XG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2xpYi9jaGFpbicpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9saWIvZXJyb3InKTtcbnZhciBzaG91bGQgPSByZXF1aXJlKCcuL2xpYi9zaG91bGQnKTtcbnZhciBwYXRjaGVzID0gcmVxdWlyZSgnLi9saWIvcGF0Y2hlcycpO1xuXG4vLyBSZWdpc3RlciB0aGUgZGVmYXVsdCBtYXRjaGVyc1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvY29yZScpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9xdWFudGlmaWVycycpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvcHJvbWlzZScpO1xuXG5cbi8vIEJ1bmRsZSBzb21lIG9mIHRoZSBpbnRlcm5hbCBzdHVmZiB3aXRoIHRoZSBhc3MgZnVuY3Rpb25cbmFzcy5DaGFpbiA9IENoYWluO1xuYXNzLkVycm9yID0gQXNzRXJyb3I7XG5hc3MucGF0Y2hlcyA9IHBhdGNoZXM7XG5cbi8vIEZvcndhcmQgdGhlIHNob3VsZCBpbnN0YWxsZXJcbi8vIE5vdGU6IG1ha2UgdGhlbSBhcml0eS0wIHRvIGFsbG93IGJlZm9yZUVhY2goYXNzLnNob3VsZCkgaW4gTW9jaGFcbmFzcy5zaG91bGQgPSBmdW5jdGlvbiAoLyogbmFtZSAqLykge1xuICBzaG91bGQoYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQpO1xuICByZXR1cm4gYXNzO1xufTtcbmFzcy5zaG91bGQucmVzdG9yZSA9IGZ1bmN0aW9uICgvKiBuYW1lICovKSB7XG4gIHNob3VsZC5yZXN0b3JlKGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogdW5kZWZpbmVkKTtcbiAgcmV0dXJuIGFzcztcbn07XG5cblxuLy8gUGF0Y2ggdGhpcmQgcGFydHkgbGlicmFyaWVzIHRvIHVuZGVyc3RhbmQgYWJvdXQgYXNzLWVydCBleHByZXNzaW9ucy4gV2Vcbi8vIGRlcGVuZCBvbiBwYXRjaGluZyBsb2Rhc2ggZm9yIHRoZSBsaWJyYXJ5IHRvIHdvcmsgY29ycmVjdGx5LCBob3dldmVyIHRoZVxuLy8gcmVzdCBhcmUgb3B0aW9uYWwuXG5wYXRjaGVzLmxvZGFzaCgodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCkpO1xuXG5pZiAoZ2xvYmFsLnNpbm9uICYmIGdsb2JhbC5zaW5vbi5tYXRjaCkge1xuICBwYXRjaGVzLnNpbm9uKGdsb2JhbC5zaW5vbik7XG59IGVsc2UgaWYgKHJlcXVpcmUucmVzb2x2ZSAmJiByZXF1aXJlLnJlc29sdmUoJ3Npbm9uJykpIHtcbiAgcGF0Y2hlcy5zaW5vbigodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5zaW5vbiA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuc2lub24gOiBudWxsKSk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBhc3M7XG4iLG51bGwsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhbk11dGF0aW9uT2JzZXJ2ZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIHZhciBxdWV1ZSA9IFtdO1xuXG4gICAgaWYgKGNhbk11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgICAgdmFyIGhpZGRlbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBxdWV1ZUxpc3QgPSBxdWV1ZS5zbGljZSgpO1xuICAgICAgICAgICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHF1ZXVlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShoaWRkZW5EaXYsIHsgYXR0cmlidXRlczogdHJ1ZSB9KTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIGlmICghcXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaGlkZGVuRGl2LnNldEF0dHJpYnV0ZSgneWVzJywgJ25vJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIvLyBFbXVsYXRlcyBWOCdzIENhbGxTaXRlIG9iamVjdCBmcm9tIGEgc3RhY2t0cmFjZS5qcyBmcmFtZSBvYmplY3RcblxuZnVuY3Rpb24gQ2FsbFNpdGUgKGZyYW1lKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDYWxsU2l0ZSkpIHtcbiAgICByZXR1cm4gbmV3IENhbGxTaXRlKGZyYW1lKTtcbiAgfVxuICB0aGlzLmZyYW1lID0gZnJhbWU7XG59O1xuXG5DYWxsU2l0ZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHtcbiAgZ2V0TGluZU51bWJlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmxpbmVOdW1iZXI7XG4gIH0sXG4gIGdldENvbHVtbk51bWJlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmNvbHVtbk51bWJlcjtcbiAgfSxcbiAgZ2V0RmlsZU5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5mcmFtZS5maWxlTmFtZTtcbiAgfSxcbiAgZ2V0RnVuY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5mcmFtZS5mdW5jdGlvbjtcbiAgfSxcbiAgZ2V0VGhpczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBudWxsO1xuICB9LFxuICBnZXRUeXBlTmFtZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBudWxsO1xuICB9LFxuICBnZXRNZXRob2ROYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5mcmFtZS5mdW5jdGlvbk5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGdldEZ1bmN0aW9uTmFtZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmZ1bmN0aW9uTmFtZTtcbiAgfSxcbiAgZ2V0RXZhbE9yaWdpbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBudWxsO1xuICB9LFxuICBpc1RvcGxldmVsOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXG4gIH0sXG4gIGlzRXZhbDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xuICB9LFxuICBpc05hdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xuICB9LFxuICBpc0NvbnN0cnVjdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIC9ebmV3KFxcc3wkKS8udGVzdCh0aGlzLmZyYW1lLmZ1bmN0aW9uTmFtZSk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5hbWUgPSB0aGlzLmdldEZ1bmN0aW9uTmFtZSgpIHx8ICc8YW5vbnltb3VzPic7XG4gICAgdmFyIGxvYyA9IHRoaXMuZ2V0RmlsZU5hbWUoKSArICc6JyArIHRoaXMuZ2V0TGluZU51bWJlcigpICsgJzonICsgdGhpcy5nZXRDb2x1bW5OdW1iZXIoKVxuICAgIHJldHVybiBuYW1lICsgJyAoJyArIGxvYyArICcpJztcbiAgfVxufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDYWxsU2l0ZTtcbiIsInZhciBFcnJvclN0YWNrUGFyc2VyID0gcmVxdWlyZSgnZXJyb3Itc3RhY2stcGFyc2VyJyk7XG52YXIgQ2FsbFNpdGUgPSByZXF1aXJlKCcuL2NhbGwtc2l0ZScpO1xuXG4vLyBLZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBidWlsdGluIGVycm9yIGNvbnN0cnVjdG9yXG52YXIgTmF0aXZlRXJyb3IgPSBFcnJvcjtcblxuXG5mdW5jdGlvbiBGYWlsdXJlIChtZXNzYWdlLCBzZmYpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZhaWx1cmUpKSB7XG4gICAgcmV0dXJuIG5ldyBGYWlsdXJlKG1lc3NhZ2UsIHNmZiB8fCBGYWlsdXJlKTtcbiAgfVxuXG4gIHRoaXMuc2ZmID0gc2ZmIHx8IHRoaXMuY29uc3RydWN0b3I7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblxuICAvLyBHZW5lcmF0ZSBhIGdldHRlciBmb3IgdGhlIGZyYW1lcywgdGhpcyBlbnN1cmVzIHRoYXQgd2UgZG8gYXMgbGl0dGxlIHdvcmtcbiAgLy8gYXMgcG9zc2libGUgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBlcnJvciwgZGVmZXJyaW5nIHRoZSBleHBlbnNpdmUgc3RhY2tcbiAgLy8gbWFuZ2xpbmcgb3BlcmF0aW9ucyB1bnRpbCB0aGUgLnN0YWNrIHByb3BlcnR5IGlzIGFjdHVhbGx5IHJlcXVlc3RlZC5cbiAgdGhpcy5fZ2V0RnJhbWVzID0gbWFrZUZyYW1lc0dldHRlcih0aGlzLnNmZik7XG5cbiAgLy8gT24gRVM1IGVuZ2luZXMgd2UgdXNlIG9uZS10aW1lIGdldHRlcnMgdG8gYWN0dWFsbHkgZGVmZXIgdGhlIGV4cGVuc2l2ZVxuICAvLyBvcGVyYXRpb25zIChkZWZpbmVkIGluIHRoZSBwcm90b3R5cGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIHdoaWxlIGxlZ2FjeVxuICAvLyBlbmdpbmVzIHdpbGwgc2ltcGx5IGRvIGFsbCB0aGUgd29yayB1cCBmcm9udC5cbiAgaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLmZyYW1lcyA9IHVud2luZCh0aGlzLl9nZXRGcmFtZXMoKSk7XG4gICAgdGhpcy5fZ2V0RnJhbWVzKHRydWUpO1xuICAgIHRoaXMuX2dldEZyYW1lcyA9IG51bGw7XG4gICAgdGhpcy5zdGFjayA9IHRoaXMuZ2VuZXJhdGVTdGFja1RyYWNlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn1cblxuLy8gU2V0IEZSQU1FX0VNUFRZIHRvIG51bGwgdG8gZGlzYWJsZSBhbnkgc29ydCBvZiBzZXBhcmF0b3JcbkZhaWx1cmUuRlJBTUVfRU1QVFkgPSAnICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJztcbkZhaWx1cmUuRlJBTUVfUFJFRklYID0gJyAgYXQgJztcblxuLy8gQnkgZGVmYXVsdCB3ZSBlbmFibGUgdHJhY2tpbmcgZm9yIGFzeW5jIHN0YWNrIHRyYWNlc1xuRmFpbHVyZS5UUkFDSyA9IHRydWU7XG5cblxuLy8gSGVscGVyIHRvIG9idGFpbiB0aGUgY3VycmVudCBzdGFjayB0cmFjZVxudmFyIGdldEVycm9yV2l0aFN0YWNrID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IE5hdGl2ZUVycm9yO1xufTtcbi8vIFNvbWUgZW5naW5lcyBkbyBub3QgZ2VuZXJhdGUgdGhlIC5zdGFjayBwcm9wZXJ0eSB1bnRpbCBpdCdzIHRocm93blxuaWYgKCFnZXRFcnJvcldpdGhTdGFjaygpLnN0YWNrKSB7XG4gIGdldEVycm9yV2l0aFN0YWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7IHRocm93IG5ldyBOYXRpdmVFcnJvciB9IGNhdGNoIChlKSB7IHJldHVybiBlIH07XG4gIH07XG59XG5cbi8vIFRyaW0gZnJhbWVzIHVuZGVyIHRoZSBwcm92aWRlZCBzdGFjayBmaXJzdCBmdW5jdGlvblxuZnVuY3Rpb24gdHJpbShmcmFtZXMsIHNmZikge1xuICB2YXIgZm4sIG5hbWUgPSBzZmYubmFtZTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4gPSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb24oKTtcbiAgICBpZiAoZm4gJiYgZm4gPT09IHNmZiB8fCBuYW1lICYmIG5hbWUgPT09IGZyYW1lc1tpXS5nZXRGdW5jdGlvbk5hbWUoKSkge1xuICAgICAgcmV0dXJuIGZyYW1lcy5zbGljZShpICsgMSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBmcmFtZXM7XG59XG5cbmZ1bmN0aW9uIHVud2luZCAoZnJhbWVzKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcblxuICBmb3IgKHZhciBpPTAsIGZuOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4gPSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb24oKTtcblxuICAgIGlmICghZm4gfHwgIWZuWydmYWlsdXJlOmlnbm9yZSddKSB7XG4gICAgICByZXN1bHQucHVzaChmcmFtZXNbaV0pO1xuICAgIH1cblxuICAgIGlmIChmbiAmJiBmblsnZmFpbHVyZTpmcmFtZXMnXSkge1xuICAgICAgaWYgKEZhaWx1cmUuRlJBTUVfRU1QVFkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENhbGwgdGhlIGdldHRlciBhbmQga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgcmVzdWx0IGluIGNhc2Ugd2UgaGF2ZSB0b1xuICAgICAgLy8gdW53aW5kIHRoZSBzYW1lIGZ1bmN0aW9uIGFub3RoZXIgdGltZS5cbiAgICAgIC8vIFRPRE86IE1ha2Ugc3VyZSBrZWVwaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBmcmFtZXMgZG9lc24ndCBjcmVhdGUgbGVha3NcbiAgICAgIGlmICh0eXBlb2YgZm5bJ2ZhaWx1cmU6ZnJhbWVzJ10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFyIGdldHRlciA9IGZuWydmYWlsdXJlOmZyYW1lcyddO1xuICAgICAgICBmblsnZmFpbHVyZTpmcmFtZXMnXSA9IG51bGw7XG4gICAgICAgIGZuWydmYWlsdXJlOmZyYW1lcyddID0gZ2V0dGVyKCk7XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgdW53aW5kKGZuWydmYWlsdXJlOmZyYW1lcyddKSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBSZWNlaXZlciBmb3IgdGhlIGZyYW1lcyBpbiBhIC5zdGFjayBwcm9wZXJ0eSBmcm9tIGNhcHR1cmVTdGFja1RyYWNlXG52YXIgVjhGUkFNRVMgPSB7fTtcblxuLy8gVjggY29kZSBwYXRoIGZvciBnZW5lcmF0aW5nIGEgZnJhbWVzIGdldHRlclxuZnVuY3Rpb24gbWFrZUZyYW1lc0dldHRlclY4IChzZmYpIHtcbiAgTmF0aXZlRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoVjhGUkFNRVMsIHNmZiB8fCBtYWtlRnJhbWVzR2V0dGVyVjgpO1xuICBzZmYgPSBudWxsO1xuICB2YXIgZnJhbWVzID0gVjhGUkFNRVMuc3RhY2s7XG4gIFY4RlJBTUVTLnN0YWNrID0gbnVsbDsgIC8vIElNUE9SVEFOVDogVGhpcyBpcyBuZWVkZWQgdG8gYXZvaWQgbGVha3MhISFcbiAgcmV0dXJuIGZ1bmN0aW9uIChjbGVhbnVwKSB7XG4gICAgdmFyIHJlc3VsdCA9IGZyYW1lcztcbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgZnJhbWVzID0gbnVsbDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG4vLyBub24tVjggY29kZSBwYXRoIGZvciBnZW5lcmF0aW5nIGEgZnJhbWVzIGdldHRlclxuZnVuY3Rpb24gbWFrZUZyYW1lc0dldHRlckNvbXBhdCAoc2ZmKSB7XG4gIC8vIE9idGFpbiBhIHN0YWNrIHRyYWNlIGF0IHRoZSBjdXJyZW50IHBvaW50XG4gIHZhciBlcnJvciA9IGdldEVycm9yV2l0aFN0YWNrKCk7XG5cbiAgLy8gV2FsayB0aGUgY2FsbGVyIGNoYWluIHRvIGFubm90YXRlIHRoZSBzdGFjayB3aXRoIGZ1bmN0aW9uIHJlZmVyZW5jZXNcbiAgLy8gR2l2ZW4gdGhlIGxpbWl0YXRpb25zIGltcG9zZWQgYnkgRVM1IFwic3RyaWN0IG1vZGVcIiBpdCdzIG5vdCBwb3NzaWJsZVxuICAvLyB0byBvYnRhaW4gcmVmZXJlbmNlcyB0byBmdW5jdGlvbnMgYmV5b25kIG9uZSB0aGF0IGlzIGRlZmluZWQgaW4gc3RyaWN0XG4gIC8vIG1vZGUuIEFsc28gbm90ZSB0aGF0IGFueSBraW5kIG9mIHJlY3Vyc2lvbiB3aWxsIG1ha2UgdGhlIHdhbGtlciB1bmFibGVcbiAgLy8gdG8gZ28gcGFzdCBpdC5cbiAgdmFyIGNhbGxlciA9IGFyZ3VtZW50cy5jYWxsZWU7XG4gIHZhciBmdW5jdGlvbnMgPSBbZ2V0RXJyb3JXaXRoU3RhY2tdO1xuICBmb3IgKHZhciBpPTA7IGNhbGxlciAmJiBpIDwgMTA7IGkrKykge1xuICAgIGZ1bmN0aW9ucy5wdXNoKGNhbGxlcik7XG4gICAgaWYgKGNhbGxlci5jYWxsZXIgPT09IGNhbGxlcikgYnJlYWs7XG4gICAgY2FsbGVyID0gY2FsbGVyLmNhbGxlcjtcbiAgfVxuICBjYWxsZXIgPSBudWxsO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoY2xlYW51cCkge1xuICAgIHZhciBmcmFtZXMgPSBudWxsO1xuXG4gICAgaWYgKCFjbGVhbnVwKSB7XG4gICAgICAvLyBQYXJzZSB0aGUgc3RhY2sgdHJhY2VcbiAgICAgIGZyYW1lcyA9IEVycm9yU3RhY2tQYXJzZXIucGFyc2UoZXJyb3IpO1xuICAgICAgLy8gQXR0YWNoIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdG8gdGhlIGZyYW1lcyAoc2tpcHBpbmcgdGhlIG1ha2VyIGZyYW1lcylcbiAgICAgIC8vIGFuZCBjcmVhdGluZyBDYWxsU2l0ZSBvYmplY3RzIGZvciBlYWNoIG9uZS5cbiAgICAgIGZvciAodmFyIGk9MjsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmcmFtZXNbaV0uZnVuY3Rpb24gPSBmdW5jdGlvbnNbaV07XG4gICAgICAgIGZyYW1lc1tpXSA9IG5ldyBDYWxsU2l0ZShmcmFtZXNbaV0pO1xuICAgICAgfVxuXG4gICAgICBmcmFtZXMgPSB0cmltKGZyYW1lcy5zbGljZSgyKSwgc2ZmKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgc2ZmID0gbnVsbDtcbiAgICBlcnJvciA9IG51bGw7XG4gICAgZnVuY3Rpb25zID0gbnVsbDtcblxuICAgIHJldHVybiBmcmFtZXM7XG4gIH07XG59XG5cbi8vIEdlbmVyYXRlcyBhIGdldHRlciBmb3IgdGhlIGNhbGwgc2l0ZSBmcmFtZXNcbi8vIFRPRE86IElmIHdlIG9ic2VydmUgbGVha3Mgd2l0aCBjb21wbGV4IHVzZSBjYXNlcyAoZHVlIHRvIGNsb3N1cmUgc2NvcGVzKVxuLy8gICAgICAgd2UgY2FuIGdlbmVyYXRlIGhlcmUgb3VyIGNvbXBhdCBDYWxsU2l0ZSBvYmplY3RzIHN0b3JpbmcgdGhlIGZ1bmN0aW9uJ3Ncbi8vICAgICAgIHNvdXJjZSBjb2RlIGluc3RlYWQgb2YgYW4gYWN0dWFsIHJlZmVyZW5jZSB0byB0aGVtLCB0aGF0IHNob3VsZCBoZWxwXG4vLyAgICAgICB0aGUgR0Mgc2luY2Ugd2UnbGwgYmUganVzdCBrZWVwaW5nIGxpdGVyYWxzIGFyb3VuZC5cbnZhciBtYWtlRnJhbWVzR2V0dGVyID0gdHlwZW9mIE5hdGl2ZUVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICA/IG1ha2VGcmFtZXNHZXR0ZXJWOFxuICAgICAgICAgICAgICAgICAgICAgOiBtYWtlRnJhbWVzR2V0dGVyQ29tcGF0O1xuXG5cbi8vIE92ZXJyaWRlIFY4IHN0YWNrIHRyYWNlIGJ1aWxkZXIgdG8gaW5qZWN0IG91ciBsb2dpY1xudmFyIG9sZFByZXBhcmVTdGFja1RyYWNlID0gRXJyb3IucHJlcGFyZVN0YWNrVHJhY2U7XG5FcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChlcnJvciwgZnJhbWVzKSB7XG4gIC8vIFdoZW4gY2FsbGVkIGZyb20gbWFrZUZyYW1lc0dldHRlciB3ZSBqdXN0IHdhbnQgdG8gb2J0YWluIHRoZSBmcmFtZXNcbiAgaWYgKGVycm9yID09PSBWOEZSQU1FUykge1xuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICAvLyBGb3J3YXJkIHRvIGFueSBwcmV2aW91c2x5IGRlZmluZWQgYmVoYXZpb3VyXG4gIGlmIChvbGRQcmVwYXJlU3RhY2tUcmFjZSkge1xuICAgIHJldHVybiBvbGRQcmVwYXJlU3RhY2tUcmFjZS5jYWxsKEVycm9yLCBlcnJvciwgZnJhbWVzKTtcbiAgfVxuXG4gIC8vIEVtdWxhdGUgZGVmYXVsdCBiZWhhdmlvdXIgKHdpdGggbG9uZy10cmFjZXMpXG4gIHJldHVybiBGYWlsdXJlLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZS5jYWxsKGVycm9yLCB1bndpbmQoZnJhbWVzKSk7XG59O1xuXG4vLyBBdHRhY2ggYSBuZXcgZXhjbHVzaW9uIHByZWRpY2F0ZSBmb3IgZnJhbWVzXG5mdW5jdGlvbiBleGNsdWRlIChjdG9yLCBwcmVkaWNhdGUpIHtcbiAgdmFyIGZuID0gcHJlZGljYXRlO1xuXG4gIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgIGZuID0gZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgICByZXR1cm4gLTEgIT09IGZyYW1lLmdldEZpbGVOYW1lKCkuaW5kZXhPZihwcmVkaWNhdGUpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByZWRpY2F0ZS50ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm4gPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICAgIHJldHVybiBwcmVkaWNhdGUudGVzdChmcmFtZS5nZXRGaWxlTmFtZSgpKTtcbiAgICB9O1xuICB9XG5cbiAgY3Rvci5leGNsdWRlcy5wdXNoKGZuKTtcbn1cblxuLy8gRXhwb3NlIHRoZSBmaWx0ZXIgaW4gdGhlIHJvb3QgRmFpbHVyZSB0eXBlXG5GYWlsdXJlLmV4Y2x1ZGVzID0gW107XG5GYWlsdXJlLmV4Y2x1ZGUgPSBmdW5jdGlvbiBGYWlsdXJlX2V4Y2x1ZGUgKHByZWRpY2F0ZSkge1xuICBleGNsdWRlKEZhaWx1cmUsIHByZWRpY2F0ZSk7XG59O1xuXG4vLyBBdHRhY2ggYSBmcmFtZXMgZ2V0dGVyIHRvIHRoZSBmdW5jdGlvbiBzbyB3ZSBjYW4gcmUtY29uc3RydWN0IGFzeW5jIHN0YWNrcy5cbi8vXG4vLyBOb3RlIHRoYXQgdGhpcyBqdXN0IGF1Z21lbnRzIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBuZXcgcHJvcGVydHksIGl0IGRvZXNuJ3Rcbi8vIGNyZWF0ZSBhIHdyYXBwZXIgZXZlcnkgdGltZSBpdCdzIGNhbGxlZCwgc28gdXNpbmcgaXQgbXVsdGlwbGUgdGltZXMgb24gdGhlXG4vLyBzYW1lIGZ1bmN0aW9uIHdpbGwgaW5kZWVkIG92ZXJ3cml0ZSB0aGUgcHJldmlvdXMgdHJhY2tpbmcgaW5mb3JtYXRpb24uIFRoaXNcbi8vIGlzIGludGVuZGVkIHNpbmNlIGl0J3MgZmFzdGVyIGFuZCBtb3JlIGltcG9ydGFudGx5IGRvZXNuJ3QgYnJlYWsgc29tZSBBUElzXG4vLyB1c2luZyBjYWxsYmFjayByZWZlcmVuY2VzIHRvIHVucmVnaXN0ZXIgdGhlbSBmb3IgaW5zdGFuY2UuXG4vLyBXaGVuIHlvdSB3YW50IHRvIHVzZSB0aGUgc2FtZSBmdW5jdGlvbiB3aXRoIGRpZmZlcmVudCB0cmFja2luZyBpbmZvcm1hdGlvblxuLy8ganVzdCB1c2UgRmFpbHVyZS53cmFwKCkuXG4vL1xuLy8gVGhlIHRyYWNraW5nIGNhbiBiZSBnbG9iYWxseSBkaXNhYmxlZCBieSBzZXR0aW5nIEZhaWx1cmUuVFJBQ0sgdG8gZmFsc2VcbkZhaWx1cmUudHJhY2sgPSBmdW5jdGlvbiBGYWlsdXJlX3RyYWNrIChmbiwgc2ZmKSB7XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICAvLyBDbGVhbiB1cCBwcmV2aW91cyBmcmFtZXMgdG8gaGVscCB0aGUgR0NcbiAgaWYgKHR5cGVvZiBmblsnZmFpbHVyZTpmcmFtZXMnXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGZuWydmYWlsdXJlOmZyYW1lcyddKHRydWUpO1xuICB9XG5cbiAgaWYgKEZhaWx1cmUuVFJBQ0spIHtcbiAgICBmblsnZmFpbHVyZTpmcmFtZXMnXSA9IG51bGw7XG4gICAgZm5bJ2ZhaWx1cmU6ZnJhbWVzJ10gPSBtYWtlRnJhbWVzR2V0dGVyKHNmZiB8fCBGYWlsdXJlX3RyYWNrKTtcbiAgfVxuXG4gIHJldHVybiBmbjtcbn07XG5cbi8vIFdyYXBzIHRoZSBmdW5jdGlvbiBiZWZvcmUgYW5ub3RhdGluZyBpdCB3aXRoIHRyYWNraW5nIGluZm9ybWF0aW9uLCB0aGlzXG4vLyBhbGxvd3MgdG8gdHJhY2sgbXVsdGlwbGUgc2NoZWR1bGxpbmdzIG9mIGEgc2luZ2xlIGZ1bmN0aW9uLlxuRmFpbHVyZS53cmFwID0gZnVuY3Rpb24gRmFpbHVyZV93cmFwIChmbikge1xuICB2YXIgd3JhcHBlciA9IEZhaWx1cmUuaWdub3JlKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIEZhaWx1cmUudHJhY2sod3JhcHBlciwgRmFpbHVyZV93cmFwKTtcbn07XG5cbi8vIE1hcmsgYSBmdW5jdGlvbiB0byBiZSBpZ25vcmVkIHdoZW4gZ2VuZXJhdGluZyBzdGFjayB0cmFjZXNcbkZhaWx1cmUuaWdub3JlID0gZnVuY3Rpb24gRmFpbHVyZV9pZ25vcmUgKGZuKSB7XG4gIGZuWydmYWlsdXJlOmlnbm9yZSddID0gdHJ1ZTtcbiAgcmV0dXJuIGZuO1xufTtcblxuRmFpbHVyZS5zZXRUaW1lb3V0ID0gZnVuY3Rpb24gRmFpbHVyZV9zZXRUaW1lb3V0ICgpIHtcbiAgYXJndW1lbnRzWzBdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbMF0sIEZhaWx1cmVfc2V0VGltZW91dCk7XG4gIHJldHVybiBzZXRUaW1lb3V0LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG5GYWlsdXJlLm5leHRUaWNrID0gZnVuY3Rpb24gRmFpbHVyZV9uZXh0VGljayAoKSB7XG4gIGFyZ3VtZW50c1swXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzWzBdLCBGYWlsdXJlX25leHRUaWNrKTtcbiAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2suYXBwbHkocHJvY2VzcywgYXJndW1lbnRzKTtcbn07XG5cbkZhaWx1cmUucGF0Y2ggPSBmdW5jdGlvbiBGYWlsdXJlX3BhdGNoKG9iaiwgbmFtZSwgaWR4KSB7XG4gIGlmIChvYmogJiYgdHlwZW9mIG9ialtuYW1lXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBcIicgKyBuYW1lICsgJ1wiIG1ldGhvZCcpO1xuICB9XG5cbiAgdmFyIG9yaWdpbmFsID0gb2JqW25hbWVdO1xuXG4gIC8vIFdoZW4gdGhlIGV4YWN0IGFyZ3VtZW50IGluZGV4IGlzIHByb3ZpZGVkIHVzZSBhbiBvcHRpbWl6ZWQgY29kZSBwYXRoXG4gIGlmICh0eXBlb2YgaWR4ID09PSAnbnVtYmVyJykge1xuXG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgYXJndW1lbnRzW2lkeF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1tpZHhdLCBvYmpbbmFtZV0pO1xuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAvLyBPdGhlcndpc2UgZGV0ZWN0IHRoZSBmdW5jdGlvbnMgdG8gdHJhY2sgYXQgaW52b2thdGlvbiB0aW1lXG4gIH0gZWxzZSB7XG5cbiAgICBvYmpbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGFyZ3VtZW50c1tpXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzW2ldLCBvYmpbbmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSB3cmFwcGVyIHdpdGggYW55IHByb3BlcnRpZXMgZnJvbSB0aGUgb3JpZ2luYWxcbiAgZm9yICh2YXIgayBpbiBvcmlnaW5hbCkgaWYgKG9yaWdpbmFsLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgb2JqW25hbWVdW2tdID0gb3JpZ2luYWxba107XG4gIH1cblxuICByZXR1cm4gb2JqW25hbWVdO1xufTtcblxuLy8gSGVscGVyIHRvIGNyZWF0ZSBuZXcgRmFpbHVyZSB0eXBlc1xuRmFpbHVyZS5jcmVhdGUgPSBmdW5jdGlvbiAobmFtZSwgcHJvcHMpIHtcbiAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBGYWlsdXJlKCdFeHBlY3RlZCBhIG5hbWUgYXMgZmlyc3QgYXJndW1lbnQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGN0b3IgKG1lc3NhZ2UsIHNmZikge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGYWlsdXJlKSkge1xuICAgICAgcmV0dXJuIG5ldyBjdG9yKG1lc3NhZ2UsIHNmZik7XG4gICAgfVxuICAgIEZhaWx1cmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIC8vIEF1Z21lbnQgY29uc3RydWN0b3JcbiAgY3Rvci5leGNsdWRlcyA9IFtdO1xuICBjdG9yLmV4Y2x1ZGUgPSBmdW5jdGlvbiAocHJlZGljYXRlKSB7XG4gICAgZXhjbHVkZShjdG9yLCBwcmVkaWNhdGUpO1xuICB9O1xuXG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShGYWlsdXJlLnByb3RvdHlwZSk7XG4gIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvcjtcbiAgY3Rvci5wcm90b3R5cGUubmFtZSA9IG5hbWU7XG4gIGlmICh0eXBlb2YgcHJvcHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjdG9yLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZSA9IHByb3BzO1xuICB9IGVsc2UgaWYgKHByb3BzKSB7XG4gICAgT2JqZWN0LmtleXMocHJvcHMpLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIGN0b3IucHJvdG90eXBlW3Byb3BdID0gcHJvcDtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY3Rvcjtcbn07XG5cbnZhciBidWlsdGluRXJyb3JUeXBlcyA9IFtcbiAgJ0Vycm9yJywgJ1R5cGVFcnJvcicsICdSYW5nZUVycm9yJywgJ1JlZmVyZW5jZUVycm9yJywgJ1N5bnRheEVycm9yJyxcbiAgJ0V2YWxFcnJvcicsICdVUklFcnJvcicsICdJbnRlcm5hbEVycm9yJ1xuXTtcbnZhciBidWlsdGluRXJyb3JzID0ge307XG5cbkZhaWx1cmUuaW5zdGFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyA/IHdpbmRvdyA6IGdsb2JhbDtcblxuICBidWlsdGluRXJyb3JUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgaWYgKHJvb3RbdHlwZV0gJiYgIWJ1aWx0aW5FcnJvcnNbdHlwZV0pIHtcbiAgICAgIGJ1aWx0aW5FcnJvcnNbdHlwZV0gPSByb290W3R5cGVdO1xuICAgICAgcm9vdFt0eXBlXSA9IEZhaWx1cmUuY3JlYXRlKHR5cGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQWxsb3cgdXNhZ2U6IHZhciBGYWlsdXJlID0gcmVxdWlyZSgnZmFpbHVyZScpLmluc3RhbGwoKVxuICByZXR1cm4gRmFpbHVyZTtcbn07XG5cbkZhaWx1cmUudW5pbnN0YWxsID0gZnVuY3Rpb24gKCkge1xuICBidWlsdGluRXJyb3JUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgcm9vdFt0eXBlXSA9IGJ1aWx0aW5FcnJvcnNbdHlwZV0gfHwgcm9vdFt0eXBlXTtcbiAgfSk7XG59O1xuXG5cbnZhciBwcm90byA9IEZhaWx1cmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xucHJvdG8uY29uc3RydWN0b3IgPSBGYWlsdXJlO1xuXG5wcm90by5uYW1lID0gJ0ZhaWx1cmUnO1xucHJvdG8ubWVzc2FnZSA9ICcnO1xuXG5pZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdmcmFtZXMnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBVc2UgdHJpbW1pbmcganVzdCBpbiBjYXNlIHRoZSBzZmYgd2FzIGRlZmluZWQgYWZ0ZXIgY29uc3RydWN0aW5nXG4gICAgICB2YXIgZnJhbWVzID0gdW53aW5kKHRyaW0odGhpcy5fZ2V0RnJhbWVzKCksIHRoaXMuc2ZmKSk7XG5cbiAgICAgIC8vIENhY2hlIG5leHQgYWNjZXNzZXMgdG8gdGhlIHByb3BlcnR5XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2ZyYW1lcycsIHtcbiAgICAgICAgdmFsdWU6IGZyYW1lcyxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICAvLyBDbGVhbiB1cCB0aGUgZ2V0dGVyIGNsb3N1cmVcbiAgICAgIHRoaXMuX2dldEZyYW1lcyA9IG51bGw7XG5cbiAgICAgIHJldHVybiBmcmFtZXM7XG4gICAgfVxuICB9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdzdGFjaycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlU3RhY2tUcmFjZSgpO1xuICAgIH1cbiAgfSk7XG59XG5cbnByb3RvLmdlbmVyYXRlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGV4Y2x1ZGVzID0gdGhpcy5jb25zdHJ1Y3Rvci5leGNsdWRlcztcbiAgdmFyIGluY2x1ZGUsIGZyYW1lcyA9IFtdO1xuXG4gIC8vIFNwZWNpZmljIHByb3RvdHlwZXMgaW5oZXJpdCB0aGUgZXhjbHVkZXMgZnJvbSBGYWlsdXJlXG4gIGlmIChleGNsdWRlcyAhPT0gRmFpbHVyZS5leGNsdWRlcykge1xuICAgIGV4Y2x1ZGVzLnB1c2guYXBwbHkoZXhjbHVkZXMsIEZhaWx1cmUuZXhjbHVkZXMpO1xuICB9XG5cbiAgLy8gQXBwbHkgZmlsdGVyaW5nXG4gIGZvciAodmFyIGk9MDsgaSA8IHRoaXMuZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaW5jbHVkZSA9IHRydWU7XG4gICAgaWYgKHRoaXMuZnJhbWVzW2ldKSB7XG4gICAgICBmb3IgKHZhciBqPTA7IGluY2x1ZGUgJiYgaiA8IGV4Y2x1ZGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGluY2x1ZGUgJj0gIWV4Y2x1ZGVzW2pdLmNhbGwodGhpcywgdGhpcy5mcmFtZXNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaW5jbHVkZSkge1xuICAgICAgZnJhbWVzLnB1c2godGhpcy5mcmFtZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzLnByZXBhcmVTdGFja1RyYWNlKGZyYW1lcyk7XG59O1xuXG5wcm90by5wcmVwYXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChmcmFtZXMpIHtcbiAgdmFyIGxpbmVzID0gW3RoaXNdO1xuICBmb3IgKHZhciBpPTA7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBsaW5lcy5wdXNoKFxuICAgICAgZnJhbWVzW2ldID8gRmFpbHVyZS5GUkFNRV9QUkVGSVggKyBmcmFtZXNbaV0gOiBGYWlsdXJlLkZSQU1FX0VNUFRZXG4gICAgKTtcbiAgfVxuICByZXR1cm4gbGluZXMuam9pbignXFxuJyk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gRmFpbHVyZTtcbiIsInZhciBGYWlsdXJlID0gcmVxdWlyZSgnLi9saWIvZmFpbHVyZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZhaWx1cmU7XG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgLy8gVW5pdmVyc2FsIE1vZHVsZSBEZWZpbml0aW9uIChVTUQpIHRvIHN1cHBvcnQgQU1ELCBDb21tb25KUy9Ob2RlLmpzLCBSaGlubywgYW5kIGJyb3dzZXJzLlxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKCdlcnJvci1zdGFjay1wYXJzZXInLCBbJ3N0YWNrZnJhbWUnXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3N0YWNrZnJhbWUnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5FcnJvclN0YWNrUGFyc2VyID0gZmFjdG9yeShyb290LlN0YWNrRnJhbWUpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlcihTdGFja0ZyYW1lKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gRVM1IFBvbHlmaWxsc1xuICAgIC8vIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9tYXBcbiAgICBpZiAoIUFycmF5LnByb3RvdHlwZS5tYXApIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAgICAgICB2YXIgTyA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBsZW4gPSBPLmxlbmd0aCA+Pj4gMDtcbiAgICAgICAgICAgIHZhciBUO1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgVCA9IHRoaXNBcmc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBBID0gbmV3IEFycmF5KGxlbik7XG4gICAgICAgICAgICB2YXIgayA9IDA7XG5cbiAgICAgICAgICAgIHdoaWxlIChrIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtWYWx1ZSwgbWFwcGVkVmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKGsgaW4gTykge1xuICAgICAgICAgICAgICAgICAgICBrVmFsdWUgPSBPW2tdO1xuICAgICAgICAgICAgICAgICAgICBtYXBwZWRWYWx1ZSA9IGNhbGxiYWNrLmNhbGwoVCwga1ZhbHVlLCBrLCBPKTtcbiAgICAgICAgICAgICAgICAgICAgQVtrXSA9IG1hcHBlZFZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBBO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maWx0ZXJcbiAgICBpZiAoIUFycmF5LnByb3RvdHlwZS5maWx0ZXIpIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uKGNhbGxiYWNrLyosIHRoaXNBcmcqLykge1xuICAgICAgICAgICAgdmFyIHQgPSBPYmplY3QodGhpcyk7XG4gICAgICAgICAgICB2YXIgbGVuID0gdC5sZW5ndGggPj4+IDA7XG5cbiAgICAgICAgICAgIHZhciByZXMgPSBbXTtcbiAgICAgICAgICAgIHZhciB0aGlzQXJnID0gYXJndW1lbnRzLmxlbmd0aCA+PSAyID8gYXJndW1lbnRzWzFdIDogdm9pZCAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpIGluIHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHZhbCwgaSwgdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5wdXNoKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIEZJUkVGT1hfU0FGQVJJX1NUQUNLX1JFR0VYUCA9IC9cXFMrXFw6XFxkKy87XG4gICAgdmFyIENIUk9NRV9JRV9TVEFDS19SRUdFWFAgPSAvXFxzK2F0IC87XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogR2l2ZW4gYW4gRXJyb3Igb2JqZWN0LCBleHRyYWN0IHRoZSBtb3N0IGluZm9ybWF0aW9uIGZyb20gaXQuXG4gICAgICAgICAqIEBwYXJhbSBlcnJvciB7RXJyb3J9XG4gICAgICAgICAqIEByZXR1cm4gQXJyYXlbU3RhY2tGcmFtZV1cbiAgICAgICAgICovXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZShlcnJvcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlcnJvci5zdGFja3RyYWNlICE9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgZXJyb3JbJ29wZXJhI3NvdXJjZWxvYyddICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmEoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5zdGFjayAmJiBlcnJvci5zdGFjay5tYXRjaChDSFJPTUVfSUVfU1RBQ0tfUkVHRVhQKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlVjhPcklFKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3Iuc3RhY2sgJiYgZXJyb3Iuc3RhY2subWF0Y2goRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRkZPclNhZmFyaShlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHBhcnNlIGdpdmVuIEVycm9yIG9iamVjdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXBhcmF0ZSBsaW5lIGFuZCBjb2x1bW4gbnVtYmVycyBmcm9tIGEgVVJMLWxpa2Ugc3RyaW5nLlxuICAgICAgICAgKiBAcGFyYW0gdXJsTGlrZSBTdHJpbmdcbiAgICAgICAgICogQHJldHVybiBBcnJheVtTdHJpbmddXG4gICAgICAgICAqL1xuICAgICAgICBleHRyYWN0TG9jYXRpb246IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJGV4dHJhY3RMb2NhdGlvbih1cmxMaWtlKSB7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHVybExpa2Uuc3BsaXQoJzonKTtcbiAgICAgICAgICAgIHZhciBsYXN0TnVtYmVyID0gbG9jYXRpb25QYXJ0cy5wb3AoKTtcbiAgICAgICAgICAgIHZhciBwb3NzaWJsZU51bWJlciA9IGxvY2F0aW9uUGFydHNbbG9jYXRpb25QYXJ0cy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICghaXNOYU4ocGFyc2VGbG9hdChwb3NzaWJsZU51bWJlcikpICYmIGlzRmluaXRlKHBvc3NpYmxlTnVtYmVyKSkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lTnVtYmVyID0gbG9jYXRpb25QYXJ0cy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2xvY2F0aW9uUGFydHMuam9pbignOicpLCBsaW5lTnVtYmVyLCBsYXN0TnVtYmVyXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsb2NhdGlvblBhcnRzLmpvaW4oJzonKSwgbGFzdE51bWJlciwgdW5kZWZpbmVkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZVY4T3JJRTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VWOE9ySUUoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci5zdGFjay5zcGxpdCgnXFxuJykuc2xpY2UoMSkubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VucyA9IGxpbmUucmVwbGFjZSgvXlxccysvLCAnJykuc3BsaXQoL1xccysvKS5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHRoaXMuZXh0cmFjdExvY2F0aW9uKHRva2Vucy5wb3AoKS5yZXBsYWNlKC9bXFwoXFwpXFxzXS9nLCAnJykpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSAoIXRva2Vuc1swXSB8fCB0b2tlbnNbMF0gPT09ICdBbm9ueW1vdXMnKSA/IHVuZGVmaW5lZCA6IHRva2Vuc1swXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN0YWNrRnJhbWUoZnVuY3Rpb25OYW1lLCB1bmRlZmluZWQsIGxvY2F0aW9uUGFydHNbMF0sIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0pO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VGRk9yU2FmYXJpOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZUZGT3JTYWZhcmkoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci5zdGFjay5zcGxpdCgnXFxuJykuZmlsdGVyKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhbGluZS5tYXRjaChGSVJFRk9YX1NBRkFSSV9TVEFDS19SRUdFWFApO1xuICAgICAgICAgICAgfSwgdGhpcykubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VucyA9IGxpbmUuc3BsaXQoJ0AnKTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHRoaXMuZXh0cmFjdExvY2F0aW9uKHRva2Vucy5wb3AoKSk7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IHRva2Vucy5zaGlmdCgpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN0YWNrRnJhbWUoZnVuY3Rpb25OYW1lLCB1bmRlZmluZWQsIGxvY2F0aW9uUGFydHNbMF0sIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0pO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VPcGVyYTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYShlKSB7XG4gICAgICAgICAgICBpZiAoIWUuc3RhY2t0cmFjZSB8fCAoZS5tZXNzYWdlLmluZGV4T2YoJ1xcbicpID4gLTEgJiZcbiAgICAgICAgICAgICAgICBlLm1lc3NhZ2Uuc3BsaXQoJ1xcbicpLmxlbmd0aCA+IGUuc3RhY2t0cmFjZS5zcGxpdCgnXFxuJykubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmE5KGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghZS5zdGFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmExMChlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYTExKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlT3BlcmE5OiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhOShlKSB7XG4gICAgICAgICAgICB2YXIgbGluZVJFID0gL0xpbmUgKFxcZCspLipzY3JpcHQgKD86aW4gKT8oXFxTKykvaTtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IGUubWVzc2FnZS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAyLCBsZW4gPSBsaW5lcy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMikge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IGxpbmVSRS5leGVjKGxpbmVzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFN0YWNrRnJhbWUodW5kZWZpbmVkLCB1bmRlZmluZWQsIG1hdGNoWzJdLCBtYXRjaFsxXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZU9wZXJhMTA6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmExMChlKSB7XG4gICAgICAgICAgICB2YXIgbGluZVJFID0gL0xpbmUgKFxcZCspLipzY3JpcHQgKD86aW4gKT8oXFxTKykoPzo6IEluIGZ1bmN0aW9uIChcXFMrKSk/JC9pO1xuICAgICAgICAgICAgdmFyIGxpbmVzID0gZS5zdGFja3RyYWNlLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxpbmVzLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbGluZVJFLmV4ZWMobGluZXNbaV0pO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgU3RhY2tGcmFtZShtYXRjaFszXSB8fCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgbWF0Y2hbMl0sIG1hdGNoWzFdKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIE9wZXJhIDEwLjY1KyBFcnJvci5zdGFjayB2ZXJ5IHNpbWlsYXIgdG8gRkYvU2FmYXJpXG4gICAgICAgIHBhcnNlT3BlcmExMTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYTExKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLmZpbHRlcihmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIWxpbmUubWF0Y2goRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQKSAmJlxuICAgICAgICAgICAgICAgICAgICAhbGluZS5tYXRjaCgvXkVycm9yIGNyZWF0ZWQgYXQvKTtcbiAgICAgICAgICAgIH0sIHRoaXMpLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBsaW5lLnNwbGl0KCdAJyk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbkNhbGwgPSAodG9rZW5zLnNoaWZ0KCkgfHwgJycpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSBmdW5jdGlvbkNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC88YW5vbnltb3VzIGZ1bmN0aW9uKDogKFxcdyspKT8+LywgJyQyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXChbXlxcKV0qXFwpL2csICcnKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3NSYXc7XG4gICAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uQ2FsbC5tYXRjaCgvXFwoKFteXFwpXSopXFwpLykpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1JhdyA9IGZ1bmN0aW9uQ2FsbC5yZXBsYWNlKC9eW15cXChdK1xcKChbXlxcKV0qKVxcKSQvLCAnJDEnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSAoYXJnc1JhdyA9PT0gdW5kZWZpbmVkIHx8IGFyZ3NSYXcgPT09ICdbYXJndW1lbnRzIG5vdCBhdmFpbGFibGVdJykgPyB1bmRlZmluZWQgOiBhcmdzUmF3LnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgYXJncywgbG9jYXRpb25QYXJ0c1swXSwgbG9jYXRpb25QYXJ0c1sxXSwgbG9jYXRpb25QYXJ0c1syXSk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH07XG59KSk7XG5cbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvLyBVbml2ZXJzYWwgTW9kdWxlIERlZmluaXRpb24gKFVNRCkgdG8gc3VwcG9ydCBBTUQsIENvbW1vbkpTL05vZGUuanMsIFJoaW5vLCBhbmQgYnJvd3NlcnMuXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QuU3RhY2tGcmFtZSA9IGZhY3RvcnkoKTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgZnVuY3Rpb24gX2lzTnVtYmVyKG4pIHtcbiAgICAgICAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgYXJncywgZmlsZU5hbWUsIGxpbmVOdW1iZXIsIGNvbHVtbk51bWJlcikge1xuICAgICAgICBpZiAoZnVuY3Rpb25OYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RnVuY3Rpb25OYW1lKGZ1bmN0aW9uTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRBcmdzKGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWxlTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEZpbGVOYW1lKGZpbGVOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGluZU51bWJlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldExpbmVOdW1iZXIobGluZU51bWJlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbHVtbk51bWJlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldENvbHVtbk51bWJlcihjb2x1bW5OdW1iZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgU3RhY2tGcmFtZS5wcm90b3R5cGUgPSB7XG4gICAgICAgIGdldEZ1bmN0aW9uTmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnVuY3Rpb25OYW1lO1xuICAgICAgICB9LFxuICAgICAgICBzZXRGdW5jdGlvbk5hbWU6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB0aGlzLmZ1bmN0aW9uTmFtZSA9IFN0cmluZyh2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRBcmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcmdzO1xuICAgICAgICB9LFxuICAgICAgICBzZXRBcmdzOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2KSAhPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3MgbXVzdCBiZSBhbiBBcnJheScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hcmdzID0gdjtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBOT1RFOiBQcm9wZXJ0eSBuYW1lIG1heSBiZSBtaXNsZWFkaW5nIGFzIGl0IGluY2x1ZGVzIHRoZSBwYXRoLFxuICAgICAgICAvLyBidXQgaXQgc29tZXdoYXQgbWlycm9ycyBWOCdzIEphdmFTY3JpcHRTdGFja1RyYWNlQXBpXG4gICAgICAgIC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3Avdjgvd2lraS9KYXZhU2NyaXB0U3RhY2tUcmFjZUFwaVxuICAgICAgICBnZXRGaWxlTmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsZU5hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldEZpbGVOYW1lOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdGhpcy5maWxlTmFtZSA9IFN0cmluZyh2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saW5lTnVtYmVyO1xuICAgICAgICB9LFxuICAgICAgICBzZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKCFfaXNOdW1iZXIodikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdMaW5lIE51bWJlciBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxpbmVOdW1iZXIgPSBOdW1iZXIodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5OdW1iZXI7XG4gICAgICAgIH0sXG4gICAgICAgIHNldENvbHVtbk51bWJlcjogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmICghX2lzTnVtYmVyKHYpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29sdW1uIE51bWJlciBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbHVtbk51bWJlciA9IE51bWJlcih2KTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gdGhpcy5nZXRGdW5jdGlvbk5hbWUoKSB8fCAne2Fub255bW91c30nO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSAnKCcgKyAodGhpcy5nZXRBcmdzKCkgfHwgW10pLmpvaW4oJywnKSArICcpJztcbiAgICAgICAgICAgIHZhciBmaWxlTmFtZSA9IHRoaXMuZ2V0RmlsZU5hbWUoKSA/ICgnQCcgKyB0aGlzLmdldEZpbGVOYW1lKCkpIDogJyc7XG4gICAgICAgICAgICB2YXIgbGluZU51bWJlciA9IF9pc051bWJlcih0aGlzLmdldExpbmVOdW1iZXIoKSkgPyAoJzonICsgdGhpcy5nZXRMaW5lTnVtYmVyKCkpIDogJyc7XG4gICAgICAgICAgICB2YXIgY29sdW1uTnVtYmVyID0gX2lzTnVtYmVyKHRoaXMuZ2V0Q29sdW1uTnVtYmVyKCkpID8gKCc6JyArIHRoaXMuZ2V0Q29sdW1uTnVtYmVyKCkpIDogJyc7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb25OYW1lICsgYXJncyArIGZpbGVOYW1lICsgbGluZU51bWJlciArIGNvbHVtbk51bWJlcjtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gU3RhY2tGcmFtZTtcbn0pKTtcbiJdfQ==
