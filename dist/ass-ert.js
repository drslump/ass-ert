!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ass=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var Chain = require('./chain');
var Matcher = require('./matcher');
var Expectation = require('./expectation');
var util = require('./util');


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

ass.ok = function (cond, message) {
  if (arguments.length === 1) {
    message = 'expected a truish value';
  }
  ass.desc(message).truthy.assert(cond);
  return cond;
};

ass.ko = function (cond, message) {
  if (arguments.length === 1) {
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

  var inst = new AssError(error, ssf || arguments.callee || proto.buildError);
  inst.showDiff = false;
  inst.actual = null;
  inst.expected = null;
  return inst;
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
// on the stack trace.
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
    return this;
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
}


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
}

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

},{"./util":13}],12:[function(require,module,exports){
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

},{"./chain":2}],13:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2Vycm9yLmpzIiwibGliL2V4cGVjdGF0aW9uLmpzIiwibGliL21hdGNoZXIuanMiLCJsaWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uLmpzIiwibGliL21hdGNoZXJzL2NvcmUuanMiLCJsaWIvbWF0Y2hlcnMvcHJvbWlzZS5qcyIsImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyIsImxpYi9wYXRjaGVzLmpzIiwibGliL3Jlc29sdmVycy5qcyIsImxpYi9zaG91bGQuanMiLCJsaWIvdXRpbC5qcyIsIm1haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9jYWxsLXNpdGUuanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9saWIvZmFpbHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL21haW4uanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9ub2RlX21vZHVsZXMvZXJyb3Itc3RhY2stcGFyc2VyL2Vycm9yLXN0YWNrLXBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL25vZGVfbW9kdWxlcy9lcnJvci1zdGFjay1wYXJzZXIvbm9kZV9tb2R1bGVzL3N0YWNrZnJhbWUvc3RhY2tmcmFtZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDeDBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFDQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1YUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIE1hdGNoZXIgPSByZXF1aXJlKCcuL21hdGNoZXInKTtcbnZhciBFeHBlY3RhdGlvbiA9IHJlcXVpcmUoJy4vZXhwZWN0YXRpb24nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cblxudmFyIGRlZlByb3AgPSB1dGlsLmJpbmQoT2JqZWN0LmRlZmluZVByb3BlcnR5LCBPYmplY3QpO1xuXG5cbi8vIFRPRE86IERldGVjdCBzdXBwb3J0IGZvciBQcm94eSBhbmQgb2ZmZXIgc3VnZ2VzdGlvbnMgbGlrZSBweXNob3VsZFxuXG5cbi8vIFB1YmxpYyBpbnRlcmZhY2VcbmZ1bmN0aW9uIGFzcyAodmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IENoYWluKCk7XG4gIH1cbiAgcmV0dXJuIG5ldyBDaGFpbih2YWx1ZSk7XG59XG5cbi8vIERlZmVycmVkIGZhY3RvcnlcbmFzcy5fID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpLl87XG59O1xuXG4vLyBHbG9iYWwgcmVnaXN0cnkgb2YgbWF0Y2hlcnMgKHVzZWQgZm9yIGFzcy5oZWxwKVxuYXNzLm1hdGNoZXJzID0gW107XG5cbi8vIGFzcy5oZWxwIGR1bXBzIHRoZSBoZWxwIG9mIGVhY2ggbWF0Y2hlciByZWdpc3RlcmVkXG5kZWZQcm9wKGFzcywgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gJyc7XG4gICAgXy5mb3JFYWNoKGFzcy5tYXRjaGVycywgZnVuY3Rpb24gKG1hdGNoZXIpIHtcbiAgICAgIC8vIFRPRE86IFRoaXMgY2FuIGJlIG5pY2VyXG4gICAgICB2YXIgZm4gPSBtYXRjaGVyLnRlc3QudG9TdHJpbmcoKTtcbiAgICAgIHZhciBhcmdzID0gZm4ucmVwbGFjZSgvXmZ1bmN0aW9uXFxzKlxcKChbXlxcKV0qKVxcKVtcXFNcXHNdKi8sICckMScpO1xuICAgICAgYXJncyA9IGFyZ3Muc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgudHJpbSgpOyB9KTtcbiAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgIGZuID0gYXJncy5sZW5ndGggPyAnICgnICsgYXJncy5qb2luKCcsICcpICsgJyknIDogJyc7XG5cbiAgICAgIHMgKz0gJz4gLicgKyBtYXRjaGVyLm5hbWUgKyBmbiArICdcXG5cXG4nO1xuICAgICAgcyArPSAnICAnICsgbWF0Y2hlci5oZWxwLnJlcGxhY2UoL1xcbi9nLCAnXFxuICAnKTtcbiAgICAgIHMgKz0gJ1xcblxcbic7XG4gICAgfSk7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn0pO1xuXG5hc3Mub2sgPSBmdW5jdGlvbiAoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSB0cnVpc2ggdmFsdWUnO1xuICB9XG4gIGFzcy5kZXNjKG1lc3NhZ2UpLnRydXRoeS5hc3NlcnQoY29uZCk7XG4gIHJldHVybiBjb25kO1xufTtcblxuYXNzLmtvID0gZnVuY3Rpb24gKGNvbmQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBtZXNzYWdlID0gJ2V4cGVjdGVkIGEgZmFsc3kgdmFsdWUnO1xuICB9XG4gIGFzcy5kZXNjKG1lc3NhZ2UpLmZhbHN5LmFzc2VydChjb25kKTtcbiAgcmV0dXJuIGNvbmQ7XG59O1xuXG4vLyBSZXNldHMgb3IgdmVyaWZpZXMgdGhlIG51bWJlciBvZiBtYXJrcyBzbyBmYXJcbi8vIEZvcmNlZCBhcml0eS0wIHRvIGJlIGNvbXBhdGlibGUgd2l0aDogYmVmb3JlRWFjaChhc3MubWFya3MpXG5hc3MubWFya3MgPSBmdW5jdGlvbiAoLyogZXhwZWN0ZWQsIGRlc2MgKi8pIHtcbiAgdmFyIGV4cGVjdGVkID0gYXJndW1lbnRzWzBdO1xuICB2YXIgZGVzYyA9IGFyZ3VtZW50c1sxXTtcbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBleHBlY3RlZCA9IGFzcy5tYXJrcy5jb3VudGVyO1xuICAgIGFzcy5tYXJrcy5jb3VudGVyID0gMDtcbiAgICByZXR1cm4gZXhwZWN0ZWQ7ICAvLyByZXR1cm4gYmFjayBob3cgbWFueSB0aGVyZSB3ZXJlXG4gIH1cblxuICBhc3MuZGVzYyhkZXNjIHx8ICdhc3MubWFya3MnKS5lcShleHBlY3RlZCkuYXNzZXJ0KFxuICAgIGFzcy5tYXJrcy5jb3VudGVyLCBhc3MubWFya3NcbiAgKTtcbn07XG5hc3MubWFya3MuY291bnRlciA9IDA7XG5cblxuLy8gSGVscGVyIHRvIHJlZ2lzdGVyIG5ldyBtYXRjaGVycyBpbiB0aGUgcmVnaXN0cnlcbmFzcy5yZWdpc3RlciA9IGZ1bmN0aW9uIChuYW1lLCBtYXRjaGVyKSB7XG4gIGlmIChuYW1lIGluc3RhbmNlb2YgTWF0Y2hlcikge1xuICAgIG1hdGNoZXIgPSBuYW1lO1xuICAgIG5hbWUgPSBtYXRjaGVyLm5hbWU7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgT2JqZWN0LmtleXMobmFtZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBhc3MucmVnaXN0ZXIoa2V5LCBuYW1lW2tleV0pO1xuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIHsgIC8vIEFzc3VtZSBhIGRlc2NyaXB0b3Igd2FzIGdpdmVuXG4gICAgLy8gQ3JlYXRlIHRoZSBhbGlhc2VzIGZpcnN0XG4gICAgXy5mb3JFYWNoKG1hdGNoZXIuYWxpYXNlcywgZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICBhc3MucmVnaXN0ZXIobmV3IE1hdGNoZXIoYWxpYXMsIG1hdGNoZXIpKTtcbiAgICB9KTtcblxuICAgIG1hdGNoZXIgPSBuZXcgTWF0Y2hlcihuYW1lLCBtYXRjaGVyKTtcbiAgfVxuXG4gIC8vIEtlZXAgdGhlIG1hdGNoZXIgYXJvdW5kIGZvciBhc3MuaGVscFxuICBhc3MubWF0Y2hlcnMucHVzaChtYXRjaGVyKTtcblxuXG4gIC8vIFRPRE86IEFsbG93IG1hdGNoZXJzIHRvIGJlIG92ZXJyaWRkZW4gYW5kIGFsc28gb3ZlcmxvYWRlZFxuICAvLyAgICAgICBpZiB0aGV5IGhhdmUgYW4gXCJvdmVybG9hZFwiIG1ldGhvZCBpdCBjYW4gYmUgdXNlZFxuICAvLyAgICAgICB0byBjaGVjayB3aGljaCBvbmUgc2hvdWxkIGJlIHVzZWQuXG4gIC8vICAgICAgIEJldHRlciBJZGVhIChJIHRoaW5rKSwgaW5zdGVhZCBvZiBvdmVybG9hZGluZyBiYXNlZFxuICAvLyAgICAgICBvbiB0aGUgdmFsdWUgdW5kZXIgdGVzdCwgd2hpY2ggbWF5IHByb2R1Y2UgaXNzdWVzXG4gIC8vICAgICAgIHNpbmNlIHdlIGRvbid0IGtub3cgZm9yIHN1cmUgd2hhdCB0aGF0IHZhbHVlIGlzLFxuICAvLyAgICAgICBhbGxvdyBtYXRjaGVycyB0byBpbnRyb2R1Y2UgYSBuZXcgXCJwcm90b3R5cGVcIiBmb3JcbiAgLy8gICAgICAgdGhlIGNoYWluLCB0aGF0IGlzLCBhIC5kb20gbWF0Y2hlciB3aWxsIGluY2x1ZGVcbiAgLy8gICAgICAgYWxsIHRoZSBjb3JlIGV4cGVjdGF0aW9ucyBidXQgdGhlbiBhbHNvIG92ZXJyaWRlc1xuICAvLyAgICAgICBhbmQgbmV3IG9uZXMgdW50aWwgdGhlIGVuZCBvZiB0aGUgY2hhaW4uXG5cblxuICAvLyBNYXRjaGVyIGZ1bmN0aW9ucyB3aXRoIGEgc2luZ2xlIGFyZ3VtZW50IGFyZSBnZXR0ZXJzXG4gIHZhciBmbktleSA9IG1hdGNoZXIuYXJpdHkgPT09IDEgPyAnZ2V0JyA6ICd2YWx1ZSc7XG4gIHZhciBwcm9wID0ge1xuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9O1xuICBpZiAoZm5LZXkgPT09ICd2YWx1ZScpIHtcbiAgICBwcm9wLndyaXRhYmxlID0gZmFsc2U7XG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSBDaGFpbiBwcm90b3R5cGVcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiBmbiAoKSB7XG4gICAgdmFyIGV4cCA9IG5ldyBFeHBlY3RhdGlvbihtYXRjaGVyLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfXy5wdXNoKGV4cCk7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBkZWZQcm9wKENoYWluLnByb3RvdHlwZSwgbmFtZSwgcHJvcCk7XG5cbiAgLy8gQXVnbWVudCB0aGUgc3RhdGljIGludGVyZmFjZVxuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hhaW4gPSBuZXcgQ2hhaW4oKTtcblxuICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgIHJldHVybiBjaGFpbltuYW1lXTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhaW5bbmFtZV0uYXBwbHkoY2hhaW4sIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgZGVmUHJvcChhc3MsIG5hbWUsIHByb3ApO1xuXG4gIC8vIFBhc3MgdGhyb3VnaCBmb3IgY2hhaW5zXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gcGFzc3Rocm91Z2goKSB7XG4gICAgcmV0dXJuIHRoaXNbbmFtZV0uYXNzZXJ0KHRoaXMudmFsdWUsIHBhc3N0aHJvdWdoKS52YWx1ZU9mKCk7XG4gIH07XG4gIHByb3AuZW51bWVyYWJsZSA9IGZhbHNlO1xuICBkZWZQcm9wKENoYWluLnByb3RvdHlwZSwgJyQnICsgbmFtZSwgcHJvcCk7XG5cbiAgLy8gUGFzcyB0aHJvdWdoIHN0YXRpYyBjb25zdHJ1Y3RvclxuICBkZWZQcm9wKGFzcywgJyQnICsgbmFtZSwge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgICAgcmV0dXJuIGFzcyh2YWx1ZSlbJyQnICsgbmFtZV07XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSBhIG5ldyBleHByZXNzaW9uIGZvciB0aGUgZXhwZWN0YXRpb25cbiAgICAgIHZhciBjaGFpbiA9IG5ldyBDaGFpbigpO1xuICAgICAgY2hhaW5bbmFtZV0uYXBwbHkoY2hhaW4sIGFyZ3VtZW50cyk7XG4gICAgICAvLyBSZXR1cm4gYSBjYWxsYWJsZSB0aGF0IGFzc2VydHMgdXBvbiByZWNlaXZpbmcgYSB2YWx1ZVxuICAgICAgcmV0dXJuIGNoYWluLnRocm91Z2g7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcblxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzcztcbiIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgcmVzb2x2ZXJzID0gcmVxdWlyZSgnLi9yZXNvbHZlcnMnKTtcbnZhciBBc3NFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgUHJvbWlzZSA9IHV0aWwuUHJvbWlzZTtcblxudmFyIGRlZlByb3AgPSB1dGlsLmJpbmQoT2JqZWN0LmRlZmluZVByb3BlcnR5LCBPYmplY3QpO1xuXG4vLyBBbiBleHBlY3RhdGlvbnMgY2hhaW4gKGFrYSBleHByZXNzaW9uKSwgdGhlIGNvcmUgb2JqZWN0IG9mIHRoZSBsaWJyYXJ5LFxuLy8gYWxsb3dzIHRvIHNldHVwIGEgc2V0IG9mIGV4cGVjdGF0aW9ucyB0byBiZSBydW4gYXQgYW55IHBvaW50IGFnYWluc3QgYVxuLy8gdmFsdWUuXG5mdW5jdGlvbiBDaGFpbiAodmFsdWUpIHtcbiAgaWYgKCFDaGFpbi5pc0NoYWluKHRoaXMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBc3MgQ2hhaW4gY29uc3RydWN0b3IgY2FsbGVkIHdpdGhvdXQgbmV3IScpO1xuICB9XG5cbiAgLy8gVE9ETzogT24gbm9uIGluaXRpYWxpemVkIGNoYWlucyB3ZSBjYW4ndCBkbyAudmFsdWUsIGl0IHNob3VsZFxuICAvLyAgICAgICBiZSBhIGV4cGVjdGF0aW9uIHRoYXQgZ2V0cyB0aGUgaW5pdGlhbCB2YWx1ZSBnaXZlbiB3aGVuXG4gIC8vICAgICAgIHJlc29sdmluZyAoc28sIGl0IHNob3VsZCBiZSBzdG9yZWQgb24gdGhlIHJlc29sdmVyKVxuICB0aGlzLnZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgPyB2YWx1ZSA6IHRoaXMuX19HVUFSRF9fO1xuXG4gIC8vIEN1c3RvbSBkZXNjcmlwdGlvblxuICBkZWZQcm9wKHRoaXMsICdfX2Rlc2NyaXB0aW9uX18nLCB7XG4gICAgdmFsdWU6ICcnLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gTGlzdCBvZiBbIEV4cGVjdGF0aW9uIF1cbiAgZGVmUHJvcCh0aGlzLCAnX19leHBlY3RhdGlvbnNfXycsIHtcbiAgICB2YWx1ZTogW10sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgLy8gV2hlbiB0cnVlIHRoZSBleHByZXNzaW9uIGlzIGNvbnNpZGVyZWQgZGVmZXJyZWQgYW5kIHdvbid0XG4gIC8vIHRyeSB0byBpbW1lZGlhdGVseSBldmFsdWF0ZSBhbnkgbmV3bHkgY2hhaW5lZCBleHBlY3RhdGlvbi5cbiAgZGVmUHJvcCh0aGlzLCAnX19kZWZlcnJlZF9fJywge1xuICAgIHZhbHVlOiB0aGlzLnZhbHVlID09PSB0aGlzLl9fR1VBUkRfXyxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiB0cnVlXG4gIH0pO1xuXG4gIC8vIEhvbGRzIHRoZSBsaXN0IG9mIHByb21pc2UgY2FsbGJhY2tzIGF0dGFjaGVkIHRvIHRoZSBleHByZXNzaW9uXG4gIGRlZlByb3AodGhpcywgJ19fdGhlbnNfXycsIHtcbiAgICB2YWx1ZTogW10sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgLy8gU2VhbCB0aGUgY29udGV4dCB0byB0aGUgbWV0aG9kcyBzbyB3ZSBjYW4gY2FsbCB0aGVtIGFzIHBsYWluIGZ1bmN0aW9uc1xuICB0aGlzLnRlc3QgPSB1dGlsLmJpbmQoQ2hhaW4ucHJvdG90eXBlLnRlc3QsIHRoaXMpO1xuICB0aGlzLmFzc2VydCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUuYXNzZXJ0LCB0aGlzKTtcbiAgdGhpcy5yZXN1bHQgPSB1dGlsLmJpbmQoQ2hhaW4ucHJvdG90eXBlLnJlc3VsdCwgdGhpcyk7XG4gIHRoaXMudGhyb3VnaCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUudGhyb3VnaCwgdGhpcyk7XG4gIHRoaXMuJCA9IHRoaXMudGhyb3VnaDtcbn1cblxuQ2hhaW4uaXNDaGFpbiA9IGZ1bmN0aW9uIChvYmopIHtcbiAgLy8gVGhpcyBsb29rcyBjb250cml2ZWQgYnV0IGluc3RhbmNlb2YgaXMga2luZCBvZiBzbG93LWlzaFxuICByZXR1cm4gb2JqICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gQ2hhaW47XG59O1xuXG5cbnZhciBwcm90byA9IENoYWluLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5wcm90by5jb25zdHJ1Y3RvciA9IENoYWluO1xuXG4vLyBHdWFyZCB0b2tlbiB0byBkZXRlY3QgdmFsdWVsZXNzIG1hdGNoZXJzXG5wcm90by5fX0dVQVJEX18gPSB7XG4gIHZhbHVlT2Y6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICB9LFxuICB0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAne3t2YWx1ZWxlc3N9fSc7XG4gIH1cbn07XG5cbi8vIFN1cHBvcnRzIHRoZSB1c2FnZTogYXNzLnN0cmluZy5oZWxwXG5kZWZQcm9wKHByb3RvLCAnaGVscCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gVE9ETzogUHJvZHVjdGl6ZSB0aGlzIGFuZCBwZXJoYXBzIHNob3cgaGVscCBmb3IgdGhlIHdob2xlIGNoYWluXG4gICAgdmFyIHRhaWwgPSBfLnRhaWwodGhpcy5fX2V4cGVjdGF0aW9uc19fKTtcbiAgICByZXR1cm4gdGFpbCA/IHRhaWwuaGVscCA6ICdOL0EnO1xuICB9XG59KTtcblxuLy8gU3VwcG9ydCB1c2UgY2FzZTogYXNzKHZhbHVlKS5fLnNvbWUubnVtYmVyLmFib3ZlKDUpLl9cbmRlZlByb3AocHJvdG8sICdfJywge1xuICBnZXQ6IGZ1bmN0aW9uIGZuKCkge1xuICAgIGlmICghdGhpcy5fX2RlZmVycmVkX18pIHtcbiAgICAgIHRoaXMuX19kZWZlcnJlZF9fID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2RlZmVycmVkX18gPSBmYWxzZTtcbiAgICAgIHRoaXMuYXNzZXJ0KHRoaXMudmFsdWUsIGZuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn0pO1xuXG5cbi8vIEV4cG9zZXMgYSBQcm9taXNlL0EgaW50ZXJmYWNlIGZvciB0aGUgZXhwcmVzc2lvbiwgdGhlIGludGVuZGVkIHVzZSBpcyBmb3Jcbi8vIG9idGFpbmluZyB0aGUgcmVzdWx0IGZvciBhc3luY2hyb25vdXMgZXhwcmVzc2lvbnMuXG4vLyBIZXJlIHRob3VnaCB3ZSBqdXN0IGNvbGxlY3QgdGhlIGNhbGxiYWNrcyB0aGUgYWN0dWFsIHByb21pc2UgcmVzb2x1dGlvblxuLy8gaXMgZG9uZSBpbiB0aGUgcmVzb2x2ZXIgd2hlbiBpdCByZWFjaGVzIGEgcmVzdWx0LlxucHJvdG8udGhlbiA9IGZ1bmN0aW9uIChjYiwgZWIpIHtcbiAgLy8gUmVnaXN0ZXIgdGhlIGNhbGxiYWNrcyB0byBiZSB1c2VkIHdoZW4gcmVzb2x2ZWRcbiAgdGhpcy5fX3RoZW5zX18ucHVzaChbY2IsIGViXSk7XG5cbiAgLy8gV2hlbiB0aGUgZXhwcmVzc2lvbiBpcyBub24gZGVmZXJyZWQgYW5kIHdlIGhhdmUgYSB2YWx1ZSB3ZSBmb3JjZSB0aGVcbiAgLy8gcmVzb2x2ZXIgdG8gcnVuIGluIG9yZGVyIHRvIHJlc29sdmUgdGhlIHByb21pc2UgYXQgbGVhc3Qgb25jZS5cbiAgLy8gVGhpcyBpcyBwcmltYXJpbHkgdG8gc3VwcG9ydCB0aGUgdGVzdCBydW5uZXJzIHVzZSBjYXNlIHdoZXJlIGFuIGV4cHJlc3Npb25cbiAgLy8gaXMgcmV0dXJuZWQgZnJvbSB0aGUgdGVzdCBhbmQgdGhlIHJ1bm5lciB3aWxsIGF0dGFjaCBpdHNlbGYgaGVyZS5cbiAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXyAmJiB0aGlzLnZhbHVlICE9PSB0aGlzLl9fR1VBUkRfXykge1xuICAgIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICAgIHJlc29sdmVyKHRoaXMudmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5jYXRjaCA9IGZ1bmN0aW9uIChlYikge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIGViKTtcbn07XG5cbi8vIERpc3BhdGNoIGV2ZXJ5b25lIHdobyB3YXMgd2FpdGluZyB0byBiZSBub3RpZmllZCBvZiB0aGUgb3V0Y29tZVxucHJvdG8uZGlzcGF0Y2hSZXN1bHQgPSBmdW5jdGlvbiAocmVzb2x2ZWQsIHJlc3VsdCkge1xuICBpZiAoMCA9PT0gdGhpcy5fX3RoZW5zX18ubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR2VuZXJhdGUgYSBuaWNlIGVycm9yIGZvciB0aGUgZmFpbHVyZVxuICB2YXIgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICBhY3R1YWwgPSB0aGlzLmJ1aWxkRXJyb3IocmVzb2x2ZWQsIHByb3RvLmRpc3BhdGNoUmVzdWx0KTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb21pc2UgdGhhdCByZWplY3RzIGltbWVkaWF0ZWx5IHdpdGggYSBmYWlsdXJlIGVycm9yIG9yXG4gIC8vIHJlc29sdmVzIHdpdGggdGhlIGV4cHJlc3Npb24gc3ViamVjdC5cbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gQ2FsbGluZyByZXNvbHZlKCkgd2l0aCBhIHByb21pc2Ugd2lsbCBhdHRhY2ggaXRzZWxmIHRvIHRoZSBwcm9taXNlXG4gICAgLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGl0IGFzIGEgc2ltcGxlIHZhbHVlLiBUbyBhdm9pZCB0aGF0IHdlIGRldGVjdCB0aGVcbiAgICAvLyBjYXNlIGFuZCB3cmFwIGl0IGluIGFuIGFycmF5LlxuICAgIGlmIChhY3R1YWwgJiYgdHlwZW9mIGFjdHVhbC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhY3R1YWwgPSBbXG4gICAgICAgICdBc3M6IFZhbHVlIHdyYXBwZWQgaW4gYW4gYXJyYXkgc2luY2UgaXQgbG9va3MgbGlrZSBhIFByb21pc2UnLFxuICAgICAgICBhY3R1YWxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgKHJlc3VsdCA/IHJlc29sdmUgOiByZWplY3QpKCBhY3R1YWwgKTtcbiAgfSk7XG5cbiAgLy8gQXR0YWNoIGFsbCB0aGUgcmVnaXN0ZXJlZCB0aGVucyB0byB0aGUgcHJvbWlzZSBzbyB0aGV5IGdldCBub3RpZmllZFxuICBfLmZvckVhY2godGhpcy5fX3RoZW5zX18sIGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuLmFwcGx5KHByb21pc2UsIGNhbGxiYWNrcyk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZHVtcENoYWluIChyZXNvbHZlZCwgaW5kZW50KSB7XG4gIHZhciByZXN1bHQgPSAnJztcblxuICBpbmRlbnQgPSBpbmRlbnQgfHwgJyc7XG5cbiAgcmVzb2x2ZWQuZm9yRWFjaChmdW5jdGlvbiAoZXhwLCBpZHgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShleHApKSB7XG4gICAgICByZXN1bHQgKz0gZHVtcENoYWluKGV4cCwgaW5kZW50ICsgJyAgJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV4cC5yZXN1bHQpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzJtUGFzc2VkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzFtRmFpbGVkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgIGlmIChpZHggPT09IHJlc29sdmVkLmxlbmd0aCAtIDEpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMG0gJyArIGV4cC5mYWlsdXJlICsgJ1xcbic7XG4gICAgfVxuXG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuLy8gQnVpbGRzIGFuIEFzc0Vycm9yIGZvciB0aGUgY3VycmVudCBleHByZXNzaW9uLiBJdCBtYWtlcyBhIGNvdXBsZSBvZlxuLy8gYXNzdW1wdGlvbnMsIGZvciBpbnN0YW5jZSB0aGUgLl9fb2Zmc2V0X18gbXVzdCBiZSBwbGFjZWQganVzdCBhZnRlciB0aGVcbi8vIGV4cGVjdGF0aW9uIHRoYXQgcHJvZHVjZWQgdGhlIGZhaWx1cmUgb2YgdGhlIGNoYWluLlxucHJvdG8uYnVpbGRFcnJvciA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgc3NmKSB7XG5cbiAgdmFyIGVycm9yID0gdGhpcy5fX2Rlc2NyaXB0aW9uX18gKyAnXFxuXFxuJztcblxuICBleHAgPSByZXNvbHZlZFsgcmVzb2x2ZWQubGVuZ3RoIC0gMSBdO1xuICBlcnJvciArPSBkdW1wQ2hhaW4ocmVzb2x2ZWQpO1xuXG4gIGlmICghdXRpbC5kb0NvbG9ycygpKSB7XG4gICAgZXJyb3IgPSB1dGlsLnVuYW5zaShlcnJvcik7XG4gIH1cblxuICAvLyBUT0RPOiBzaG93RGlmZiBzaG91bGQgYmUgdXNlZCBvbmx5IHdoZW4gaXQgbWFrZXMgc2Vuc2UgcGVyaGFwc1xuICAvLyAgICAgICB3ZSBjYW4gcGFzcyBudWxsL3VuZGVmaW5lZCBhbmQgbGV0IEFzc0Vycm9yIGRldGVjdCB3aGVuIGl0XG4gIC8vICAgICAgIG1ha2VzIHNlbnNlLlxuXG4gIHZhciBleHBlY3RlZCA9IGV4cC5leHBlY3RlZDtcbiAgLy8gTW9jaGEgd2lsbCB0cnkgdG8ganNvbmlmeSB0aGUgZXhwZWN0ZWQgdmFsdWUsIGp1c3QgaWdub3JlIGlmIGl0J3MgYSBmdW5jdGlvblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdmFyIGluc3QgPSBuZXcgQXNzRXJyb3IoZXJyb3IsIHNzZiB8fCBhcmd1bWVudHMuY2FsbGVlIHx8IHByb3RvLmJ1aWxkRXJyb3IpO1xuICBpbnN0LnNob3dEaWZmID0gZmFsc2U7XG4gIGluc3QuYWN0dWFsID0gbnVsbDtcbiAgaW5zdC5leHBlY3RlZCA9IG51bGw7XG4gIHJldHVybiBpbnN0O1xufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIFRoZSByZXN1bHQgaXMgYWx3YXlzIGFcbi8vIGJvb2xlYW4gaW5kaWNhdGluZyB0aGUgb3V0Y29tZSBvciBhbiB1bmRlZmluZWQgdG8gc2lnbmFsIHRoYXQgaXQgcmVhY2hlZFxuLy8gYW4gYXN5bmNocm9ub3VzIGZsb3cuXG4vLyBOb3RlOiBuYW1lZCBgdGVzdGAgdG8gYmUgY29tcGF0aWJsZSB3aXRoIFNpbm9uJ3MgbWF0Y2hlcnMuXG5wcm90by50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBSZXNvbHZlIHRoZSBjaGFpbiBzdGFydGluZyBmcm9tIHJvb3RcbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyBQZXJmb3JtcyB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhaW4gYnV0IGFkZGl0aW9uYWxseSB3aWxsIHJhaXNlIGFuIGVycm9yXG4vLyBpZiBpdCBmYWlscyB0byBjb21wbGV0ZS4gV2hlbiB0aGUgZXhwcmVzc2lvbiByZXNvbHZlcyBhcyB1bmRlZmluZWQgKGFzeW5jKVxuLy8gaXQnbGwgYmUgYXV0b21hdGljYWxseSBlbmFibGUgaXRzIGRlZmVycmVkIGZsYWcuXG4vLyBUaGUgYHNzZmAgaXMgU3RhY2tUcmFjZUZ1bmN0aW9uLCBhIHJlZmVyZW5jZSB0byB0aGUgZmlyc3QgZnVuY3Rpb24gdG8gc2hvd1xuLy8gb24gdGhlIHN0YWNrIHRyYWNlLlxucHJvdG8uYXNzZXJ0ID0gZnVuY3Rpb24gKGFjdHVhbCwgc3NmKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgfVxuXG4gIC8vIEp1c3QgaWdub3JlIGlmIHRoZSBhY3R1YWwgdmFsdWUgaXMgbm90IHByZXNlbnQgeWV0XG4gIC8vIFRPRE86IFNoYWxsIGl0IHByb2R1Y2UgYW4gZXJyb3I/XG4gIGlmIChhY3R1YWwgPT09IHRoaXMuX19HVUFSRF9fKSByZXR1cm4gdGhpcztcblxuICB2YXIgcmVzb2x2ZXIgPSByZXNvbHZlcnMuYWNxdWlyZSh0aGlzKTtcbiAgdmFyIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG5cbiAgLy8gSXQgZmFpbGVkIHNvIHJlcG9ydCBpdCB3aXRoIGEgbmljZSBlcnJvclxuICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgIHRocm93IHRoaXMuYnVpbGRFcnJvcihyZXNvbHZlci5yZXNvbHZlZCwgc3NmIHx8IHRoaXMuYXNzZXJ0KTtcbiAgfVxuXG4gIC8vIENvbnZlcnQgdGhlIGV4cHJlc3Npb24gaW50byBhIGRlZmVycmVkIGlmIGFuIGFzeW5jIGV4cGVjdGlvbiB3YXMgZm91bmRcbiAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fX2RlZmVycmVkX18gPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBBc3NlcnRzIHRoZSBwcm92aWRlZCB2YWx1ZSBhbmQgaWYgc3VjY2Vzc2Z1bCByZXR1cm5zIHRoZSBvcmlnaW5hbFxuLy8gdmFsdWUgaW5zdGVhZCBvZiB0aGUgY2hhaW4gaW5zdGFuY2UuXG5wcm90by50aHJvdWdoID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICB0aGlzLmFzc2VydChhY3R1YWwsIHByb3RvLnRocm91Z2gpO1xuICByZXR1cm4gYWN0dWFsO1xufTtcblxuLy8gRXZhbHVhdGVzIHRoZSBleHByZXNzaW9uIGNoYWluIHJlcG9ydGluZyB0aGUgbGFzdCBtdXRhdGVkIHZhbHVlIHNlZW4gaW5cbi8vIGl0LiBJZiB0aGUgZXhwcmVzc2lvbiBkb2VzIG5vdCBjb21wbGV0ZSBpdCdsbCByZXR1cm4gdW5kZWZpbmVkLlxucHJvdG8ucmVzdWx0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICB2YXIgcmVzdWx0O1xuXG4gIHRyeSB7XG4gICAgdGhpcy50YXAoZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICB9KS50ZXN0KGFjdHVhbCk7XG4gIH0gZmluYWxseSB7XG4gICAgLy8gUmVtb3ZlIHRoZSAudGFwIGZyb20gdGhlIGNoYWluXG4gICAgdGhpcy5fX2V4cGVjdGF0aW9uc19fLnBvcCgpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbkNoYWluLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy52YWx1ZTtcbn07XG5cbkNoYWluLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuX19kZXNjcmlwdGlvbl9fKSB7XG4gICAgcmV0dXJuIHRoaXMuX19kZXNjcmlwdGlvbl9fO1xuICB9XG5cbiAgdmFyIGRlc2NzID0gdGhpcy5fX2V4cGVjdGF0aW9uc19fXG4gICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5kZXNjcmlwdGlvbiB9KVxuICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZGVzY3JpcHRpb24gfSk7XG5cbiAgaWYgKGRlc2NzLmxlbmd0aCA+IDEpIHtcbiAgICByZXR1cm4gJygnICsgZGVzY3Muam9pbignLCAnKSArICcpJztcbiAgfSBlbHNlIGlmIChkZXNjcy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gZGVzY3NbMF07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICc8QXNzQ2hhaW4+JztcbiAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENoYWluO1xuIiwiLy8gQVBJIGNvbXBhdGlibGUgd2l0aCBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2Fzc2VydGlvbi1lcnJvci9cbi8vIFRoaXMgc2hvdWxkIG1ha2UgaW50ZWdyYXRpb24gd2l0aCBNb2NoYSB3b3JrLCBpbmNsdWRpbmcgZGlmZmVkXG4vLyBvdXRwdXQuXG5cbnZhciBGYWlsdXJlID0gcmVxdWlyZSgnZmFpbHVyZScpO1xuXG52YXIgdW5hbnNpID0gcmVxdWlyZSgnLi91dGlsJykudW5hbnNpO1xuXG5cbnZhciBBc3NFcnJvciA9IEZhaWx1cmUuY3JlYXRlKCdBc3NFcnJvcicpO1xudmFyIHByb3RvID0gQXNzRXJyb3IucHJvdG90eXBlO1xuXG5wcm90by5zaG93RGlmZiA9IGZhbHNlO1xucHJvdG8uYWN0dWFsID0gbnVsbDtcbnByb3RvLmV4cGVjdGVkID0gbnVsbDtcblxuZnVuY3Rpb24gZ2V0VGFyZ2V0TGluZSAoZnJhbWVzKSB7XG4gIGZ1bmN0aW9uIGdldFNyYyAoZnJhbWUpIHtcbiAgICB2YXIgZm4gPSBmcmFtZS5nZXRGdW5jdGlvbigpO1xuICAgIHJldHVybiBmbiA/IGZuLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxzKy9nLCAnJykgOiBudWxsO1xuICB9XG5cbiAgLy8gRmlyc3QgZnJhbWUgaXMgbm93IHRoZSB0YXJnZXRcbiAgdmFyIHRhcmdldCA9IGZyYW1lc1swXTtcbiAgdmFyIHRhcmdldFNyYyA9IGdldFNyYyh0YXJnZXQpO1xuICBpZiAoIXRhcmdldFNyYykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gRmlsdGVyIG91dCBhbGwgZnJhbWVzIHdoaWNoIGFyZSBub3QgaW4gdGhlIHNhbWUgZmlsZVxuICBzYW1lZmlsZSA9IGZyYW1lcy5maWx0ZXIoZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgcmV0dXJuIGZyYW1lICYmIGZyYW1lLmdldEZpbGVOYW1lKCkgPT09IHRhcmdldC5nZXRGaWxlTmFtZSgpO1xuICB9KTtcblxuICAvLyBHZXQgdGhlIGNsb3Nlc3QgZnVuY3Rpb24gaW4gdGhlIHNhbWUgZmlsZSB0aGF0IHdyYXBzIHRoZSB0YXJnZXQgZnJhbWVcbiAgdmFyIHdyYXBwZXI7XG4gIGZvciAodmFyIGk9MTsgaSA8IHNhbWVmaWxlLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNyYyA9IGdldFNyYyhzYW1lZmlsZVtpXSk7XG4gICAgaWYgKHNyYyAmJiAtMSAhPT0gc3JjLmluZGV4T2YodGFyZ2V0U3JjKSkge1xuICAgICAgd3JhcHBlciA9IHNhbWVmaWxlW2ldO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gV2hlbiBhIHdyYXBwZXIgZnVuY3Rpb24gaXMgZm91bmQgd2UgY2FuIHVzZSBpdCB0byBvYnRhaW4gdGhlIGxpbmUgd2Ugd2FudFxuICBpZiAod3JhcHBlcikge1xuICAgIC8vIEdldCByZWxhdGl2ZSBwb3NpdGlvbnNcbiAgICB2YXIgcmVsTG4gPSB0YXJnZXQuZ2V0TGluZU51bWJlcigpIC0gd3JhcHBlci5nZXRMaW5lTnVtYmVyKCk7XG4gICAgdmFyIHJlbENsID0gdGFyZ2V0LmdldExpbmVOdW1iZXIoKSA9PT0gd3JhcHBlci5nZXRMaW5lTnVtYmVyKClcbiAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgIDogdGFyZ2V0LmdldENvbHVtbk51bWJlcigpIC0gMTtcblxuICAgIHZhciBsaW5lcyA9IHRhcmdldC5nZXRGdW5jdGlvbigpLnRvU3RyaW5nKCkuc3BsaXQoL1xcbi8pO1xuICAgIGlmIChsaW5lc1tyZWxMbl0pIHtcbiAgICAgIHJldHVybiBsaW5lc1tyZWxMbl07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbnByb3RvLnRvSlNPTiA9IGZ1bmN0aW9uIChzdGFjaykge1xuICB2YXIgcHJvcHMgPSB7XG4gICAgbmFtZTogdGhpcy5uYW1lLFxuICAgIG1lc3NhZ2U6IHVuYW5zaSh0aGlzLm1lc3NhZ2UpLFxuICAgIGFjdHVhbDogdGhpcy5hY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IHRoaXMuZXhwZWN0ZWQsXG4gICAgc2hvd0RpZmY6IHRoaXMuc2hvd0RpZmZcbiAgfTtcblxuICAvLyBpbmNsdWRlIHN0YWNrIGlmIGV4aXN0cyBhbmQgbm90IHR1cm5lZCBvZmZcbiAgaWYgKHN0YWNrICYmIHRoaXMuc3RhY2spIHtcbiAgICBwcm9wcy5zdGFjayA9IHRoaXMuc3RhY2s7XG4gIH1cblxuICByZXR1cm4gcHJvcHM7XG59O1xuXG5wcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1zZyA9IEZhaWx1cmUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGhpcyk7XG5cbiAgdmFyIGxpbmUgPSBnZXRUYXJnZXRMaW5lKHRoaXMuZnJhbWVzKTtcbiAgaWYgKGxpbmUpIHtcbiAgICBtc2cgKz0gJ1xcbiAgPj4gJyArIGxpbmUucmVwbGFjZSgvXlxccysvLCAnJykuc2xpY2UoMCwgNjApICsgJ1xcbic7XG4gIH1cblxuICByZXR1cm4gbXNnO1xufTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzRXJyb3I7XG4iLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIE1hdGNoZXIgPSByZXF1aXJlKCcuL21hdGNoZXInKTtcblxudmFyIHRlbXBsYXRlID0gcmVxdWlyZSgnLi91dGlsJykudGVtcGxhdGU7XG5cblxuLy8gRXhwZWN0YXRpb24gcmVwcmVzZW50cyBhbiBpbnN0YW50aWF0ZWQgTWF0Y2hlciBhbHJlYWR5IGNvbmZpZ3VyZWQgd2l0aFxuLy8gYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzLlxuZnVuY3Rpb24gRXhwZWN0YXRpb24gKG1hdGNoZXIsIGFyZ3MpIHtcbiAgLy8gR2V0IHRoZSBtYXRjaGVyIGNvbmZpZ3VyYXRpb24gaW50byB0aGlzIGluc3RhbmNlXG4gIG1hdGNoZXIuYXNzaWduKHRoaXMpO1xuXG4gIC8vIFN1cHBvcnQgYmVpbmcgZ2l2ZW4gYW4gYGFyZ3VtZW50c2Agb2JqZWN0XG4gIHRoaXMuYXJncyA9IF8udG9BcnJheShhcmdzKTtcbiAgdGhpcy5hY3R1YWwgPSB1bmRlZmluZWQ7XG59XG5cbi8vIEluaGVyaXQgdGhlIHByb3RvdHlwZSBmcm9tIE1hdGNoZXJcbnZhciBwcm90byA9IEV4cGVjdGF0aW9uLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTWF0Y2hlci5wcm90b3R5cGUpO1xucHJvdG8uY29uc3RydWN0b3IgPSBFeHBlY3RhdGlvbjtcblxuLy8gR2VuZXJhdGUgZ2V0dGVyIGZvciBgLmV4cGVjdGVkYCAoYW4gYWxpYXMgZm9yIGFyZ3NbMF0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdleHBlY3RlZCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXJnc1swXTtcbiAgfVxufSk7XG5cbi8vIEdlbmVyYXRlIGdldHRlcnMgZm9yIHRoZSBmaXJzdCA1IGFyZ3VtZW50cyBhcyBhcmcxLCBhcmcyLCAuLi5cbl8udGltZXMoNSwgZnVuY3Rpb24gKGkpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnYXJnJyArIChpICsgMSksIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmFyZ3NbaV07XG4gICAgfVxuICB9KTtcbn0pO1xuXG4vLyBDb21wdXRlIHRoZSBkZXNjcmlwdGlvbiBtZXNzYWdlIGZvciB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZXhwZWN0YXRpb25cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2Rlc2NyaXB0aW9uJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdGhpcy5kZXNjID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZXNjKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcGxhdGUodGhpcy5kZXNjLCB0aGlzKTtcbiAgfVxufSk7XG5cbi8vIENvbXB1dGUgdGhlIGZhaWx1cmUgbWVzc2FnZSBmb3IgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGV4cGVjdGF0aW9uXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdmYWlsdXJlJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuZmFpbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuZmFpbCh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlKHRoaXMuZmFpbCwgdGhpcyk7XG4gIH1cbn0pO1xuXG4vLyBIZWxwZXIgdG8gbXV0YXRlIHRoZSB2YWx1ZSB1bmRlciB0ZXN0XG5FeHBlY3RhdGlvbi5wcm90b3R5cGUubXV0YXRlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIodmFsdWUpO1xuICB9O1xufTtcblxuLy8gUmVzb2x2aW5nIGNhbiBvdmVycmlkZSB0aGUgZXhwZWN0YXRpb24gc3RhdGUsIGlmIHRoYXQncyBub3QgZGVzaXJhYmxlIG1ha2Vcbi8vIHN1cmUgdGhhdCB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgaW4gYSBuZXcgY29udGV4dC5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncywgcmVzdWx0O1xuXG4gIC8vIEV4ZWN1dGUgdGhlIG1hdGNoZXIgdGVzdCBub3cgdGhhdCBldmVyeXRoaW5nIGlzIHNldFxuICBhcmdzID0gW3RoaXMuYWN0dWFsXS5jb25jYXQodGhpcy5hcmdzKTtcbiAgcmVzdWx0ID0gdGhpcy50ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuXG4gIC8vIFJldHVybmluZyBhIHN0cmluZyBvdmVycmlkZXMgdGhlIG1pc21hdGNoIGRlc2NyaXB0aW9uXG4gIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuZmFpbCA9IHJlc3VsdDtcbiAgICByZXN1bHQgPSBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRlc2NyaXB0aW9uO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cGVjdGF0aW9uO1xuIiwiLy8gVGhlIE1hdGNoZXIgb2JqZWN0IGlzIGEgZGVzY3JpcHRvciBmb3IgdGhlIG1hdGNoaW5nIGxvZ2ljIGJ1dCBjYW5ub3Rcbi8vIGJlIHVzZWQgZGlyZWN0bHkuIFVzZSBhbiBFeHBlY3RhdGlvbiB0byBnZXQgYW4gaW5pdGlhbGl6ZWQgbWF0Y2hlci5cbmZ1bmN0aW9uIE1hdGNoZXIgKG5hbWUsIGRlc2NyaXB0b3IpIHtcblxuICAvLyBTaG9ydGN1dCBmb3Igc2ltcGxlIHRlc3QgZnVuY3Rpb25zXG4gIGlmICh0eXBlb2YgZGVzY3JpcHRvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGRlc2NyaXB0b3IgPSB7dGVzdDogZGVzY3JpcHRvcn07XG4gIH1cblxuICAvLyBUaGUgZ2VuZXJpYyBuYW1lIG9mIHRoZSBtYXRjaGVyXG4gIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoZGVzY3JpcHRvci5oZWxwKSkge1xuICAgIHRoaXMuaGVscCA9IGRlc2NyaXB0b3IuaGVscC5qb2luKCdcXG4nKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmhlbHAgPSBkZXNjcmlwdG9yLmhlbHAgfHwgJ05vdCBhdmFpbGFibGUnO1xuICB9XG5cbiAgLy8gRWl0aGVyIGEgdGVtcGxhdGUgc3RyaW5nIG9yIGEgZnVuY3Rpb24gdGhhdCB3aWxsIHJlY2VpdmUgYXMgb25seVxuICAvLyBhcmd1bWVudCBhbiBFeHBlY3RhdGlvbiBpbnN0YW5jZSAoY2FsbGVkIGFzIGEgbWV0aG9kIG9mIGl0KS5cbiAgdGhpcy5kZXNjID0gZGVzY3JpcHRvci5kZXNjICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gZGVzY3JpcHRvci5kZXNjXG4gICAgICAgICAgICA6IHRoaXMubmFtZTtcblxuICAvLyBFaXRoZXIgYSB0ZW1wbGF0ZSBzdHJpbmcgb3IgYSBmdW5jdGlvbiB0aGF0IHdpbGwgcmVjZWl2ZSBhcyBvbmx5XG4gIC8vIGFyZ3VtZW50IGFuIEV4cGVjdGF0aW9uIGluc3RhbmNlIChjYWxsZWQgYXMgYSBtZXRob2Qgb2YgaXQpLlxuICB0aGlzLmZhaWwgPSBkZXNjcmlwdG9yLmZhaWwgfHwgJ3dhcyB7eyBhY3R1YWwgfX0nO1xuXG4gIGlmICghZGVzY3JpcHRvci50ZXN0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0ZXN0IGZ1bmN0aW9uIG5vdCBkZWZpbmVkIGZvciB0aGUgbWF0Y2hlcicpO1xuICB9XG4gIHRoaXMudGVzdCA9IGRlc2NyaXB0b3IudGVzdDtcblxuICB0aGlzLmFyaXR5ID0gZGVzY3JpcHRvci5hcml0eSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgPyBkZXNjcmlwdG9yLmFyaXR5XG4gICAgICAgICAgICAgOiB0aGlzLnRlc3QubGVuZ3RoO1xufVxuXG5NYXRjaGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5NYXRjaGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1hdGNoZXI7XG5cbk1hdGNoZXIucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IodGhpcy5uYW1lLCB7XG4gICAgaGVscDogdGhpcy5oZWxwLFxuICAgIGRlc2M6IHRoaXMuZGVzYyxcbiAgICBmYWlsOiB0aGlzLmZhaWwsXG4gICAgdGVzdDogdGhpcy50ZXN0LFxuICAgIGFyaXR5OiB0aGlzLmFyaXR5XG4gIH0pO1xufTtcblxuLy8gQXVnbWVudCBhbm90aGVyIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIG9mIHRoaXMgbWF0Y2hlclxuTWF0Y2hlci5wcm90b3R5cGUuYXNzaWduID0gZnVuY3Rpb24gKG9iaikge1xuICBvYmouaGVscCA9IHRoaXMuaGVscDtcbiAgb2JqLmRlc2MgPSB0aGlzLmRlc2M7XG4gIG9iai5mYWlsID0gdGhpcy5mYWlsO1xuICBvYmoudGVzdCA9IHRoaXMudGVzdDtcbiAgb2JqLmFyaXR5ID0gdGhpcy5hcml0eTtcbn07XG5cbk1hdGNoZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gJzxBc3MuTWF0Y2hlciAnICsgdGhpcy5uYW1lICsgJz4nO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGNoZXI7XG4iLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xuXG5cbmFzcy5yZWdpc3Rlcih7XG5cbiAgYW5kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgb2YgdGhlbSwgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGFsbCB0aGUgZXhwZWN0YXRpb25zIHRoYXQgZm9ybSBpdCBkbyBpbmRlZWQgc3VjY2VlZC4nLFxuICAgICAgJ05vdGU6IGV2YWx1YXRpb24gd2lsbCBzdG9wIGFzIHNvb24gYXMgb25lIG9mIHRoZSBleHBlY3RhdGlvbnMgZmFpbHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBBTkQgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciByZXN1bHQgPSBfLmV2ZXJ5KGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8ga2VlcCBpdGVyYXRpbmdcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGFydGlhbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGV4cGVjdGF0aW9ucyBsYXRlciBpbiB0aGUgY2hhaW5cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIG9yOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgb2YgdGhlbSwgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZXhwZWN0YXRpb25zIGRvZXMuJyxcbiAgICAgICdOb3RlOiBldmFsdWF0aW9uIHdpbGwgc3RvcCBhcyBzb29uIGFzIG9uZSBvZiB0aGUgZXhwZWN0YXRpb25zIHN1Y2NlZWRzLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgT1IgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciByZXN1bHQgPSBfLnNvbWUoYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICB2YXIgcGFydGlhbCA9IGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgICAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuZGVmcyArPSAxO1xuICAgICAgICAgICAgYnJhbmNoLnRoZW4oXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8ga2VlcCBpdGVyYXRpbmdcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGFydGlhbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGV4cGVjdGF0aW9ucyBsYXRlciBpbiB0aGUgY2hhaW5cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIHhvcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIG9mIHRoZW0sIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGV4cGVjdGF0aW9ucyBkb2VzIGJ1dCBub3QgYWxsIG9mIHRoZW0uJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBYT1IgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciBva3MgPSAwO1xuICAgICAgICB2YXIga29zID0gMDtcbiAgICAgICAgXy5mb3JFYWNoKGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChrb3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG9rcyArPSAxO1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwsIG9rcyA+IDAgJiYga29zID4gMCA/IHVuZGVmaW5lZCA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksIF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChva3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGtvcyArPSAxO1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwsIG9rcyA+IDAgJiYga29zID4gMCA/IHVuZGVmaW5lZCA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0aWFsID09PSB0cnVlKSB7XG4gICAgICAgICAgICBva3MgKz0gMTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRpYWwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBrb3MgKz0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9rcyA+IDAgJiYga29zID4gMCA/IHJlc29sdmVyKGFjdHVhbCkgOiBmYWxzZTtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuIiwidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuLy8gU2V0IG9mIGRlZmF1bHQgbWF0Y2hlcnNcbmFzcy5yZWdpc3Rlcih7XG4gIGRlc2M6IHtcbiAgICBoZWxwOiAnUHJvdmlkZSBhIGN1c3RvbSBkZXNjcmlwdGlvbiBmb3IgcmVwb3J0ZWQgZmFpbHVyZXMnLFxuICAgIGRlc2M6IG51bGwsICAvLyBTa2lwIGl0IGZyb20gcmVwb3J0c1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGRlc2MpIHtcbiAgICAgIC8vIE5vdGUgdGhhdCB0aGUgZGVzY3JpcHRpb24gd29uJ3QgYmUgc2V0IHVudGlsIHRoZSBjaGFpbiBpcyByZXNvbHZlZCxcbiAgICAgIC8vIGF0IGxlYXN0IG9uY2UsIHJlYWNoaW5nIHRoaXMgZXhwZWN0YXRpb24uXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIHJlc29sdmVyLmNoYWluLl9fZGVzY3JpcHRpb25fXyA9IGRlc2M7XG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gSWdub3JlZCBtYXRjaGVyc1xuICB0bzoge1xuICAgIGFsaWFzZXM6IFsgJ2EnLCAnYW4nLCAnYmUnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0p1c3Qgc29tZSBzeW50YXggc3VnYXIgdG8gbWFrZSB0aGUgZXhwZWN0YXRpb25zIGVhc2llciBvbiB0aGUgZXllcy4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBtYXJrOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0luY3JlYXNlcyB0aGUgZ2xvYmFsIGBhc3MubWFya3NgIGNvdW50ZXIgZXZlcnkgdGltZSBpdCBnZXRzJyxcbiAgICAgICdldmFsdWF0ZWQgYXMgcGFydCBvZiBhbiBleHByZXNzaW9uLiBVc2UgaXQgdG8gdmVyaWZ5IHRoYXQgdGhlJyxcbiAgICAgICdleHBlY3RhdGlvbnMgYXJlIGFjdHVhbGx5IGJlaW5nIGV4ZWN1dGVkLicsXG4gICAgICAnQW4gZWFzeSB3YXkgdG8gc3VwcG9ydCB0aGlzIHdoZW4gdXNpbmcgYSB0ZXN0IHJ1bm5lciBpcyB0byByZXNldCcsXG4gICAgICAndGhlIGNvdW50ZXIgYnkgY2FsbGluZyBgYXNzLm1hcmtzKClgIG9uIGEgYmVmb3JlRWFjaCBob29rIGFuZCcsXG4gICAgICAndGhlbiB2ZXJpZnkgYXQgdGhlIGVuZCBvZiB0ZXN0IHdpdGggYGFzcy5tYXJrcyhOKWAgKHdoZXJlIE4gaXMnLFxuICAgICAgJ3RoZSBudW1iZXIgb2YgbWFya3MgeW91IGV4cGVjdGVkKS4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGFzcy5tYXJrcy5jb3VudGVyICs9IDE7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gSnVzdCBhbGxvdyBhbnl0aGluZyA6KVxuICBhbnk6IHtcbiAgICBoZWxwOiAnQWxsb3dzIGFueSB2YWx1ZSB3aXRob3V0IHRlc3RpbmcgaXQuJyxcbiAgICBkZXNjOiAnaXMgYW55dGhpbmcnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgLy8gQW55dGhpbmcgdGhhdCBpc24ndCBudWxsIG9yIHVuZGVmaW5lZFxuICBkZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbm90IG51bGwgb3IgdW5kZWZpbmVkLicsXG4gICAgZGVzYzogJ2lzIGRlZmluZWQnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgIT0gbnVsbDtcbiAgICB9XG4gIH0sXG4gIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBlbXB0eVxuICBlbXB0eToge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGVtcHR5IChoYXMgYSBsZW5ndGggb2YgMCkuJyxcbiAgICBkZXNjOiAnaXMgZW1wdHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPT0gbnVsbCB8fCBhY3R1YWwubGVuZ3RoID09PSAwO1xuICAgIH1cbiAgfSxcbiAgbm9uRW1wdHk6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgZW1wdHkgKGhhcyBhIGxlbmd0aCBncmVhdGVyIHRoYW4gMCkuJyxcbiAgICBkZXNjOiAnaXMgbm90IGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9IG51bGwgJiYgYWN0dWFsLmxlbmd0aCA+IDA7XG4gICAgfVxuICB9LFxuICB0cnV0aHk6IHtcbiAgICBhbGlhc2VzOiBbICd0cnVpc2gnIF0sXG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgdHJ1dGh5IChub3QgdW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyB0cnV0aHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbC5sZW5ndGggPT09ICdudW1iZXInID8gYWN0dWFsLmxlbmd0aCAhPT0gMCA6IHRydWU7XG4gICAgfVxuICB9LFxuICBmYWxzeToge1xuICAgIGhlbHA6ICdUaGUgdmFsdWUgc2hvdWxkIGJlIGZhbHN5ICh1bmRlZmluZWQsIG51bGwsIDAsIFwiXCIgb3IgW10pLicsXG4gICAgZGVzYzogJ2lzIGZhbHN5JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFhY3R1YWwpIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwubGVuZ3RoID09PSAnbnVtYmVyJyA/IGFjdHVhbC5sZW5ndGggPT09IDAgOiBmYWxzZTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gTmVnYXRpb25cbiAgbm90OiB7XG4gICAgaGVscDogJ05lZ2F0ZXMgdGhlIHJlc3VsdCBmb3IgdGhlIHJlc3Qgb2YgdGhlIGV4cHJlc3Npb24uJyxcbiAgICBkZXNjOiAnTm90IScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZXIuZmluYWxpemUoZnVuY3Rpb24gKGZpbmFsKSB7XG4gICAgICAgICAgcmV0dXJuICFmaW5hbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBpczoge1xuICAgIGFsaWFzZXM6IFsgJ2VxdWFsJywgJ2VxdWFscycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIHN0cmljdCBlcXVhbGl0eSBiZXR3ZWVuIHRoZSB2YWx1ZSBhbmQgaXRzIGV4cGVjdGVkLicsXG4gICAgICAnTm90ZTogaWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgY2hhaW4gZXhwcmVzc2lvbiBpdFxcJ2xsIGJlIHRlc3RlZCBpbnN0ZWFkLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBzdHJpY3RseSBlcXVhbCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIC8vIHRoaXMgaXMgYSBiaXQgY29udHJpdmVkIGJ1dCBpdCBtYWtlcyBmb3Igc29tZSBuaWNlIHN5bnRheCB0byBiZSBhYmxlIHRvXG4gICAgICAvLyB1c2UgLmlzIGZvciBwYXNzaW5nIGluIGV4cGVjdGF0aW9uc1xuICAgICAgaWYgKGV4cGVjdGVkICYmIGV4cGVjdGVkIGluc3RhbmNlb2YgYXNzLkNoYWluKSB7XG4gICAgICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY3R1YWwgPT09IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcbiAgZXE6IHtcbiAgICBhbGlhc2VzOiBbICdlcWwnLCAnZXFscycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIGRlZXAgbm9uLXN0cmljdCBlcXVhbGl0eSBiZXR3ZWVuIHRoZSB2YWx1ZSBhbmQgaXRzIGV4cGVjdGVkLicsXG4gICAgICAnSXQgdW5kZXJzdGFuZHMgYXNzIGV4cHJlc3Npb25zIHNvIHlvdSBjYW4gY29tYmluZSB0aGVtIGF0IHdpbGwgaW4gdGhlJyxcbiAgICAgICdleHBlY3RlZCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gZXF1YWwge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gXy5pc0VxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpO1xuICAgIH1cbiAgfSxcblxuICBhYm92ZToge1xuICAgIGFsaWFzZXM6IFsgJ2d0JywgJ21vcmVUaGFuJywgJ2dyZWF0ZXJUaGFuJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGhpZ2hlciB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBtb3JlIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID4gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGJlbG93OiB7XG4gICAgYWxpYXNlczogWyAnbHQnLCAnbGVzc1RoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbG93ZXIgdGhhIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDwgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlT3JFcXVhbDoge1xuICAgIGFsaWFzZXM6IFsgJ2xlYXN0JywgJ2F0TGVhc3QnLCAnZ3RlJywgJ21vcmVUaGFuT3JFcXVhbCcsICdncmVhdGVyVGhhbk9yRXF1YWwnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3dPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnbW9zdCcsICdhdE1vc3QnLCAnbHRlJywgJ2xlc3NUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciBvciBlcXVhbCB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA8PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgaW5zdGFuY2VvZjoge1xuICAgIGFsaWFzZXM6IFsgJ2luc3RhbmNlT2YnLCAnaW5zdGFuY2UnLCAnaXNhJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3Rvci4nLFxuICAgICAgJ1doZW4gdGhlIGV4cGVjdGVkIGlzIGEgc3RyaW5nIGl0XFwnbGwgYWN0dWFsbHkgdXNlIGEgYHR5cGVvZmAnLFxuICAgICAgJ2NvbXBhcmlzb24uJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGFuIGluc3RhbmNlIG9mIHt7ZXhwZWN0ZWR9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmIChfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbCA9PT0gZXhwZWN0ZWQgPyB0cnVlIDogJ2hhZCB0eXBlIHt7IHR5cGVvZiBhY3R1YWwgfX0nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICB0eXBlb2Y6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBvZiBhIHNwZWNpZmljIHR5cGUnLFxuICAgIGRlc2M6ICd0byBoYXZlIHR5cGUge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnaGFkICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBfLmlzRXF1YWwodHlwZW9mIGFjdHVhbCwgZXhwZWN0ZWQpO1xuICAgIH1cbiAgfSxcbiAgbnVtYmVyOiB7XG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIG51bWJlciAoZGlmZmVyZW50IG9mIE5hTikuJyxcbiAgICBkZXNjOiAndG8gYmUgYSBudW1iZXInLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzTnVtYmVyKGFjdHVhbCkgJiYgIWlzTmFOKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBib29sOiB7XG4gICAgYWxpYXNlczogWyAnYm9vbGVhbicgXSxcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgYm9vbGVhbi4nLFxuICAgIGRlc2M6ICd0byBiZSBhIGJvb2xlYW4nLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzQm9vbGVhbihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgc3RyaW5nOiB7XG4gICAgYWxpYXNlczogWyAnc3RyJyBdLFxuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBzdHJpbmcuJyxcbiAgICBkZXNjOiAndG8gYmUgYSBzdHJpbmcnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzU3RyaW5nKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBvYmplY3Q6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBvZiB0eXBlIG9iamVjdC4nLFxuICAgIGRlc2M6ICd0byBiZSBhbiBvYmplY3QnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzT2JqZWN0KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBwbGFpbk9iamVjdDoge1xuICAgIGFsaWFzZXM6IFsgJ3BsYWluJywgJ29iaicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIE9iamVjdCBjb25zdHJ1Y3Rvci4nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1BsYWluT2JqZWN0KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBhcnJheToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGFuIEFycmF5LicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIEFycmF5JyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0FycmF5KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBmdW5jdGlvbjoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRnVuY3Rpb24uJyxcbiAgICBkZXNjOiAndG8gYmUgYSBGdW5jdGlvbicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNGdW5jdGlvbihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgcmVnZXhwOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBSZWdFeHAnLFxuICAgIGRlc2M6ICd0byBiZSBhIFJlZ0V4cCcsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNSZWdFeHAoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGRhdGU6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIERhdGUnLFxuICAgIGRlc2M6ICd0byBiZSBhIERhdGUnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRGF0ZShhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZWxlbWVudDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRE9NIGVsZW1lbnQnLFxuICAgIGRlc2M6ICd0byBiZSBhIERPTSBlbGVtZW50JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0VsZW1lbnQoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGVycm9yOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYW4gZXJyb3IgKG9yIGxvb2tzIGxpa2UgaXQpJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gRXJyb3InLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfLmlzT2JqZWN0KGFjdHVhbCkgJiYgXy5pc1N0cmluZyhhY3R1YWwubmFtZSkgJiYgXy5pc1N0cmluZyhhY3R1YWwubWVzc2FnZSk7XG4gICAgfVxuICB9LFxuXG4gIHVuZGVmaW5lZDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHVuZGVmaW5lZC4nLFxuICAgIGRlc2M6ICd0byBiZSB1bmRlZmluZWQnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzVW5kZWZpbmVkKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBudWxsOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgbnVsbC4nLFxuICAgIGRlc2M6ICd0byBiZSBudWxsJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9PSBudWxsO1xuICAgIH1cbiAgfSxcbiAgTmFOOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgTmFOLicsXG4gICAgZGVzYzogJ3RvIGJlIE5hTicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNOdW1iZXIoYWN0dWFsKSkge1xuICAgICAgICB0aGlzLmZhaWwgPSAnd2FzICR7YWN0dWFsfSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmZhaWwgPSAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHRydWU6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyB0cnVlJyxcbiAgICBkZXNjOiAndG8gYmUgdHJ1ZScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzQm9vbGVhbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiBhY3R1YWwgPT0gdHJ1ZSA/IHRydWUgOiAnd2FzIHt7YWN0dWFsfX0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGZhbHNlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgZmFsc2UnLFxuICAgIGRlc2M6ICd0byBiZSBmYWxzZScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbCA9PSBmYWxzZSA/IHRydWUgOiAnd2FzIHt7YWN0dWFsfX0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgcmFpc2VzOiB7XG4gICAgYWxpYXNlczogWyAndGhyb3dzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgdGhhdCBleGVjdXRpbmcgdGhlIHZhbHVlIHJlc3VsdHMgaW4gYW4gZXhjZXB0aW9uIGJlaW5nIHRocm93bi4nLFxuICAgICAgJ1RoZSBjYXB0dXJlZCBleGNlcHRpb24gdmFsdWUgaXMgdXNlZCB0byBtdXRhdGUgdGhlIHN1YmplY3QgZm9yIHRoZScsXG4gICAgICAnZm9sbG93aW5nIGV4cGVjdGF0aW9ucy4nXG4gICAgXSxcbiAgICBkZXNjOiAndGhyb3dzIGFuIGVycm9yJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFfLmlzRnVuY3Rpb24oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIGZ1bmN0aW9uOiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgYWN0dWFsKCk7XG4gICAgICAgIHJldHVybiAnZGlkIG5vdCB0aHJvdyBhbnl0aGluZyc7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmIChleHBlY3RlZCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24oZXhwZWN0ZWQpICYmIGUgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXy5pc0VxdWFsKGUsIGV4cGVjdGVkKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF1Z21lbnQgdGhlIGV4cGVjdGF0aW9uIG9iamVjdCB3aXRoIGEgbmV3IHRlbXBsYXRlIHZhcmlhYmxlXG4gICAgICAgIHRoaXMuZXhjZXB0aW9uID0gZTtcbiAgICAgICAgcmV0dXJuICdnb3Qge3sgZXhjZXB0aW9uIH19JztcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgaGFzOiB7XG4gICAgYWxpYXNlczogWyAnaGF2ZScsICdjb250YWluJywgJ2NvbnRhaW5zJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVjayBpZiB0aGUgdmFsdWUgaGFzIHNvbWUgZXhwZWN0ZWQgdmFsdWUuIEl0IHVuZGVyc3RhbmRzIGV4cGVjdGVkJyxcbiAgICAgICdjaGFpbiBleHByZXNzaW9ucyBzbyB0aGlzIHNlcnZlcyBhcyB0aGUgZXF1aXZhbGVudCBvZiAuZXEgZm9yIHBhcnRpYWwnLFxuICAgICAgJ21hdGNoZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGNvbnRhaW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG5cbiAgICAgIGlmIChfLmlzU3RyaW5nKGFjdHVhbCkgJiYgXy5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIC0xICE9PSBhY3R1YWwuaW5kZXhPZihleHBlY3RlZCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChfLmlzQXJyYXkoYWN0dWFsKSkge1xuICAgICAgICAvLyBIYWNrOiBmb3IgYXJyYXlzIHdlIGFsbG93IG11bHRpcGxlIGV4cGVjdGVkIHZhbHVlc1xuICAgICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgICAgcmV0dXJuIF8uZXZlcnkoZXhwZWN0ZWQsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgIHJldHVybiAtMSAhPT0gXy5maW5kSW5kZXgoYWN0dWFsLCBldik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIV8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2dvdCB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgLy8gQ29tcGFyZSBvYmplY3RzIHdpdGggLndoZXJlXG4gICAgICByZXR1cm4gMCA8IF8ud2hlcmUoYWN0dWFsLCBleHBlY3RlZCkubGVuZ3RoO1xuICAgIH1cbiAgfSxcbiAgaGFzT3duOiB7XG4gICAgYWxpYXNlczogWyAnaGFzS2V5JywgJ2hhc0luZGV4JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVjayBpZiB0aGUgdmFsdWUgaGFzIG9uZSBvciBtb3JlIG93biBwcm9wZXJ0aWVzIGFzIGRlZmluZWQgYnknLFxuICAgICAgJ3RoZSBnaXZlbiBhcmd1bWVudHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGhhdmUgb3duIHByb3BlcnR5ICR7IGV4cGVjdGVkIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ3dhcyB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgdGhpcy5mYWlsID0gJ29ubHkgaGFkIHt7IF8ua2V5cyhhY3R1YWwpIH19JztcblxuICAgICAgLy8gVE9ETzogT2ZmZXIgYmV0dGVyIGZhaWx1cmUgbWVzc2FnZVxuICAgICAgdmFyIGFyZ3MgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KGFyZ3MsIGZ1bmN0aW9uICh4KSB7IHJldHVybiBfLmhhcyhhY3R1YWwsIHgpOyB9KTtcbiAgICB9XG4gIH0sXG5cbiAgbG9nOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0R1bXBzIHRoZSByZWNlaXZlZCB2YWx1ZSB0byB0aGUgY29uc29sZS4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbQVNTXScsIGFjdHVhbCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGR1bXA6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRHVtcHMgdGhlIHJlY2VpdmVkIHZhbHVlIHRvIHRoZSBjb25zb2xlIGFwcGx5aW5nIHRoZSBnaXZlbiB0ZW1wbGF0ZS4nLFxuICAgICAgJ05vdGU6IFVzZSAke3RoaXN9IHRvIGludGVycG9sYXRlIHRoZSB3aG9sZSB2YWx1ZS4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjdGVtcGxhdGUnXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHRwbCkge1xuICAgICAgdmFyIHRlbXBsYXRlID0gXy50ZW1wbGF0ZSh0cGwpO1xuICAgICAgdmFyIHJlc3VsdCA9IHRlbXBsYXRlLmNhbGwoYWN0dWFsLCBhY3R1YWwpO1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZGVidWdnZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGFsdHMgc2NyaXB0IGV4ZWN1dGlvbiBieSB0cmlnZ2VyaW5nIHRoZSBpbnRlcmFjdGl2ZSBkZWJ1Z2dlci4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIHRhcDoge1xuICAgIGFsaWFzZXM6IFsgJ2ZuJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDYWxscyB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gd2l0aCB0aGUgY3VycmVudCB2YWx1ZSBhcyBhcmd1bWVudC4nLFxuICAgICAgJ0lmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHNvbWV0aGluZyBkaWZmZXJlbnQgdG8gKnVuZGVmaW5lZCogdGhlJyxcbiAgICAgICdleHByZXNzaW9uIHdpbGwgZm9yayB0byBvcGVyYXRlIG9uIHRoZSByZXR1cm5lZCB2YWx1ZS4nLFxuICAgIF0sXG4gICAgZGVzYzogJ2NhbGwge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZm4oYWN0dWFsKTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgbm90aWZ5OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1NpbWlsYXIgdG8gLnRhcCgpIGJ1dCBpdCB3b25cXCd0IHBhc3MgdGhlIGN1cnJlbnQgdmFsdWUgYXMgYXJndW1lbnQsJyxcbiAgICAgICdpbnN0ZWFkIGl0IHdpbGwgYmUgcHJvdmlkZWQgYXMgdGhlIGB0aGlzYCBjb250ZXh0IHdoZW4gcGVyZm9ybWluZyB0aGUnLFxuICAgICAgJ2NhbGwuIFRoaXMgYWxsb3dzIGl0IHRvIGJlIHVzZWQgd2l0aCB0ZXN0IHJ1bm5lcnMgYGRvbmVgIHN0eWxlIGNhbGxiYWNrcy4nLFxuICAgICAgJ05vdGUgdGhhdCBpdCB3aWxsIG5laXRoZXIgbXV0YXRlIHRoZSB2YWx1ZSBldmVuIGlmIGl0IHJldHVybnMgc29tZXRoaW5nLidcbiAgICBdLFxuICAgIGRlc2M6ICdub3RpZnkge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICBmbi5jYWxsKGFjdHVhbCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgc2l6ZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiB0aGUgc2l6ZSBvZiB0aGUgY3VycmVudCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHNpemUnLFxuICAgIGZhaWw6ICdub3QgaGFzIGEgbGVuZ3RoOiB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGFjdHVhbCkgfHwgXy5pc0FycmF5KGFjdHVhbCkgfHwgXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShfLnNpemUoYWN0dWFsKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sXG4gIHByb3A6IHtcbiAgICBhbGlhc2VzOiBbICdrZXknLCAncHJvcGVydHknIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgdmFsdWUgcHJvcGVydGllcy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHByb3BlcnR5IHt7IGFyZzEgfX0nLFxuICAgIGZhaWw6ICd3YXMgbm90IGZvdW5kIG9uIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwga2V5KSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIGlmIChrZXkgaW4gYWN0dWFsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGFjdHVhbFtrZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMua2V5cyA9IFtdO1xuICAgICAgICBfLmZvckluKGFjdHVhbCwgZnVuY3Rpb24gKHYsIGspIHsgdGhpcy5rZXlzLnB1c2goayk7IH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gJ25vdCBmb3VuZCBmcm9tIHt7IGtleXMgfX0nO1xuICAgICAgfVxuICAgICAgcmV0dXJuICdnb3Qge3thY3R1YWx9fSc7XG4gICAgfVxuICB9LFxuICBhdDoge1xuICAgIGFsaWFzZXM6IFsgJ2luZGV4JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgaW5kZXhlZCBlbGVtZW50cy4gSWYnLFxuICAgICAgJ211bHRpcGxlIGluZGV4ZXMgYXJlIHByb3ZpZGVkIGFuIGFycmF5IGlzIGNvbXBvc2VkIHdpdGggdGhlbS4nLFxuICAgICAgJ05vdGU6IEl0IHN1cHBvcnRzIG5lZ2F0aXZlIGluZGV4ZXMnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGluZGV4ICR7IGFyZ3Muam9pbihcIiwgXCIpIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGluZGV4KSB7XG4gICAgICBpZiAoIV8uaXNBcnJheShhY3R1YWwpICYmICFfLmlzU3RyaW5nKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdub3QgYW4gYXJyYXkgb3IgYSBzdHJpbmc6ICR7YWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIHZhciBpbmRleGVzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICB2YXIgZWxlbXMgPSBbXTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbmRleGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBpZHggPSBpbmRleGVzW2ldO1xuXG4gICAgICAgIGlkeCA9IGlkeCA8IDAgPyBhY3R1YWwubGVuZ3RoICsgaWR4IDogaWR4O1xuICAgICAgICBpZiAoaWR4IDwgMCB8fCBpZHggPj0gYWN0dWFsLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBpZHggKyAnIG91dCBvZiBib3VuZHMgZm9yIHt7YWN0dWFsfX0nO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbXMucHVzaChhY3R1YWxbaWR4XSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgZWxlbXMubGVuZ3RoID09PSAxID8gZWxlbXNbMF0gOiBlbGVtc1xuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAga2V5czoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBvcGVyYXRlIG9uIGl0cyBsaXN0IG9mIG93biBrZXlzLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQga2V5cycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmtleXMoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHZhbHVlczoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBvcGVyYXRlIG9uIGl0cyBsaXN0IG9mIHZhbHVlcydcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgdmFsdWVzJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8udmFsdWVzKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHNsaWNlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0V4dHJhY3RzIGEgcG9ydGlvbiBmcm9tIHRoZSB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnc2xpY2UoJHthcmdzWzBdfSwgJHthcmdzWzFdIHx8IDB9KScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgc3RhcnQsIGVuZCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnRvQXJyYXkoYWN0dWFsKS5zbGljZShzdGFydCwgZW5kKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgZmlsdGVyOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0l0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgY29sbGVjdGlvbiwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZScsXG4gICAgICAnb24gYW4gYXJyYXkgd2l0aCBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCB0aGUgY2FsbGJhY2sgcmV0dXJuZWQgdHJ1dGh5JyxcbiAgICAgICdmb3IuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ZpbHRlcidcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uZmlsdGVyKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgLy8gTm90ZTogXCJyZWplY3RcIiBpcyB1c2VkIGZvciBwcm9taXNlc1xuICAvLyBUT0RPOiBDb21lIHVwIHdpdGggYSBiZXR0ZXIgbmFtZVxuICB1bmxlc3M6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlJyxcbiAgICAgICdvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCBmYWxzeScsXG4gICAgICAnZm9yICh0aGUgb3Bwb3NpdGUgb2YgLmZpbHRlcikuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3JlamVjdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucmVqZWN0KGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICB3aGVyZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdQZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbiBvZiBlYWNoIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uIHRvIHRoZSBnaXZlbicsXG4gICAgICAncHJvcGVydGllcyBvYmplY3QsIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgb2YgYWxsJyxcbiAgICAgICdlbGVtZW50cyB0aGF0IGhhdmUgZXF1aXZhbGVudCBwcm9wZXJ0eSB2YWx1ZXMuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3doZXJlJ1xuICAgIF0sXG4gICAgZGVzYzogJ3doZXJlIHt7YXJnMX19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wcykge1xuICAgICAgaWYgKCFfLmlzUGxhaW5PYmplY3QocHJvcHMpKSB7XG4gICAgICAgIHJldHVybiAncHJvcHMgaXMgbm90IGFuIG9iamVjdCc7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ud2hlcmUoYWN0dWFsLCBwcm9wcylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1hcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXAnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1hcChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWV0aG9kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSByZXN1bHQgb2YgaW52b2tpbmcgdGhlIG5hbWVkJyxcbiAgICAgICdtZXRob2Qgb24gdGhlIHN1YmplY3QgdmFsdWUuJyxcbiAgICBdLFxuICAgIGRlc2M6IFwibWV0aG9kIC4ke2FyZzF9KClcIixcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBtZXRob2QsIGFyZykge1xuICAgICAgaWYgKHR5cGVvZiBhY3R1YWxbbWV0aG9kXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gJyR7YXJnMX0gaXMgbm90IGEgbWV0aG9kIGluIHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDIpO1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBhY3R1YWxbbWV0aG9kXS5hcHBseShhY3R1YWwsIGFyZ3MpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBpbnZva2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIG1ldGhvZCBuYW1lZCBieSB0aGUgYXJndW1lbnQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjaW52b2tlJ1xuICAgIF0sXG4gICAgZGVzYzogXCJpbnZva2UgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZCwgYXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaW52b2tlLmFwcGx5KF8sIGFyZ3VtZW50cylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHBsdWNrOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHRoZSBvbmUgb2YgdGhlIHNwZWNpZmljIHByb3BlcnR5IGZvciBhbGwgZWxlbWVudHMnLFxuICAgICAgJ2luIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3BsdWNrJ1xuICAgIF0sXG4gICAgZGVzYzogJ3BsdWNrKCB7e2FyZzF9fSApJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucGx1Y2soYWN0dWFsLCBwcm9wKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgZmlyc3Q6IHtcbiAgICBhbGlhc2VzOiBbICdoZWFkJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ZpcnN0J1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBmaXJzdCBlbGVtZW50JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaGVhZChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgbGFzdDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2xhc3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubGFzdChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgcmVzdDoge1xuICAgIGFsaWFzZXM6IFsgJ3RhaWwnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50YWlsKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1pbjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSBzdWJqZWN0IHRvIGJlIHRoZSBtaW5pbXVtIHZhbHVlIGZvdW5kIG9uIHRoZSBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtaW4nXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWluKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBtYXg6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgc3ViamVjdCB0byBiZSB0aGUgbWF4aW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWF4J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1heChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzb3J0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHNvcnRlZCBpbiBhc2NlbmRpbmcgb3JkZXIuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3NvcnRCeSdcbiAgICBdLFxuICAgIGRlc2M6ICdzb3J0JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgLy8gQWxsb3cgdGhlIHVzZSBvZiBleHByZXNzaW9ucyBhcyBjYWxsYmFja3NcbiAgICAgIGlmIChjYWxsYmFjayBpbnN0YW5jZW9mIGFzcy5DaGFpbikge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrLnJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnNvcnRCeShhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RvcmU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGVscGVyIHRvIHN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IHZhbHVlIGJlaW5nIGV2YWx1YXRlZCBpbiB0aGUnLFxuICAgICAgJ2V4cHJlc3Npb24gaW4gc29tZSBvdGhlciBvYmplY3QuIEl0IGV4cGVjdHMgYSB0YXJnZXQgb2JqZWN0IGFuZCBvcHRpb25hbGx5JyxcbiAgICAgICd0aGUgbmFtZSBvZiBhIHByb3BlcnR5LiBJZiB0YXJnZXQgaXMgYSBmdW5jdGlvbiBpdFxcJ2xsIHJlY2VpdmUgdGhlIHZhbHVlJyxcbiAgICAgICd1c2luZyBgcHJvcGAgYXMgdGhpcyBjb250ZXh0LiBJZiBgcHJvcGAgaXMgbm90IHByb3ZpZGVkIGFuZCBgdGFyZ2V0YCBpcyBhbicsXG4gICAgICAnYXJyYXkgdGhlIHZhbHVlIHdpbGwgYmUgcHVzaGVkIHRvIGl0LidcbiAgICBdLFxuICAgIGRlc2M6ICdzdG9yZScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgdGFyZ2V0LCBwcm9wKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0LmNhbGwocHJvcCwgYWN0dWFsKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChfLmlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgIHRhcmdldC5wdXNoKGFjdHVhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICdwcm9wIHVuZGVmaW5lZCBhbmQgdGFyZ2V0IGlzIG5vdCBhbiBhcnJheSBvciBhIGZ1bmN0aW9uOiB7e2FyZzF9fSc7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoXy5pc09iamVjdCh0YXJnZXQpKSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IGFjdHVhbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAndGFyZ2V0IGlzIG5vdCBhbiBvYmplY3Q6IHt7YXJnMX19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIG11dGF0aW9uOiB7XG4gICAgaGVscDogW1xuICAgICAgJ09idGFpbnMgdGhlIGxhc3QgbXV0YXRlZCB2YWx1ZSB1c2VkIG9uIHRoZSBjaGFpbi4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIC8vIFRPRE86IFRoaXMgd2lsbCBicmVhayBpZiB3ZSByZXR1cm4gdHJ1ZS9mYWxzZSBvciBhIGZ1bmN0aW9uXG4gICAgICByZXR1cm4gYWN0dWFsO1xuICAgIH1cbiAgfVxuXG59KTtcbiIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cblxuLy8gSGVscGVyIGZhY3RvcnkgZm9yIHRoZW5hYmxlIGNhbGxiYWNrc1xuZnVuY3Rpb24gcmVzdW1lIChyZXNvbHZlciwgcmVzdWx0KSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXNvbHZlci5yZXN1bWUodmFsdWUsIHJlc3VsdCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzUHJvbWlzZSAodmFsdWUpIHtcbiAgdmFyIHRoZW4gPSB2YWx1ZSAmJiB2YWx1ZS50aGVuO1xuICByZXR1cm4gdHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5cblxuLy8gUHJvbWlzZSByZWxhdGVkIG1hdGNoZXJzXG5hc3MucmVnaXN0ZXIoe1xuXG4gIHByb21pc2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnVmVyaWZpZXMgdGhhdCB0aGUgdmFsdWUgaXMgYSBwcm9taXNlIChQcm9taXNlL0ErKSBidXQgZG9lcyBub3QgYXR0YWNoJyxcbiAgICAgICd0aGUgZXhwcmVzc2lvbiB0byBpdHMgcmVzb2x1dGlvbiBsaWtlIGByZXNvbHZlc2Agb3IgYHJlamVjdHNgLCBpbnN0ZWFkJyxcbiAgICAgICd0aGUgb3JpZ2luYWwgcHJvbWlzZSB2YWx1ZSBpcyBrZXB0IGFzIHRoZSBzdWJqZWN0IGZvciB0aGUgZm9sbG93aW5nJyxcbiAgICAgICdleHBlY3RhdGlvbnMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGEgcHJvbWlzZScsXG4gICAgZmFpbDogJ2dvdCAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGlzUHJvbWlzZShhY3R1YWwpO1xuICAgIH1cbiAgfSxcblxuICByZXNvbHZlczoge1xuICAgIGFsaWFzZXM6IFsgJ3Jlc29sdmUnLCAnZnVsZmlsbGVkJywgJ2Z1bGZpbGwnLCAnZXZlbnR1YWxseScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlJyxcbiAgICAgICdhcHBseWluZyB0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZXNvbHZlZCwnLFxuICAgICAgJ211dGF0aW5nIHRoZSB2YWx1ZSB0byB0aGUgcmVzb2x2ZWQgb25lLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZScsXG4gICAgICAncHJvbWlzZSBpcyBhY3R1YWxseSByZWplY3RlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZXNvbHZlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIHJlamVjdGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEF0dGFjaCB0byB0aGUgcHJvbWlzZSBzbyB3ZSBnZXQgbm90aWZpZWQgd2hlbiBpdCdzIHJlc29sdmVkLlxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIGJlY29tZToge1xuICAgIGFsaWFzZXM6IFsgJ2JlY29tZXMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1dvcmtzIHRoZSBzYW1lIGFzIC5yZXNvbHZlcyBidXQgYWRkaXRpb25hbGx5IHdpbGwgZG8gYSBjb21wYXJpc29uIGJldHdlZW4nLFxuICAgICAgJ3RoZSByZXNvbHZlZCB2YWx1ZSBmcm9tIHRoZSBwcm9taXNlIGFuZCB0aGUgZXhwZWN0ZWQgb25lLiBJdCBjYW4gYmUgc2VlbicsXG4gICAgICAnYXMgYSBzaG9ydGN1dCBmb3IgYC5yZXNvbHZlcy5lcShleHBlY3RlZClgLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZWNvbWUge3sgZXhwZWN0ZWQgfX0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIE1ha2UgaXQgYXN5bmNcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICAvLyBBdHRhY2ggdG8gdGhlIHByb21pc2UgcmVzb2x1dGlvblxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBfLmlzRXF1YWwodmFsdWUsIGV4cGVjdGVkKTtcbiAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZSh2YWx1ZSwgcmVzdWx0KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIHJlamVjdHM6IHtcbiAgICBhbGlhc2VzOiBbICdyZWplY3RlZCcsICdyZWplY3QnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0F0dGFjaCB0aGUgbWF0Y2hlciB0byBhIHByb21pc2UgdmFsdWUgKFByb21pc2VzL0ErKSB0byBjb250aW51ZSBhcHBseWluZycsXG4gICAgICAndGhlIGNoYWluIG9mIG1hdGNoZXJzIG9uY2UgdGhlIHByb21pc2UgaGFzIGJlZW4gcmVqZWN0ZWQsIG11dGF0aW5nIHRoZScsXG4gICAgICAndmFsdWUgdG8gYmVjb21lIHRoZSByZWplY3RlZCBlcnJvci4nLFxuICAgICAgJ0l0IHdpbGwgZmFpbCBpZiB0aGUgdmFsdWUgaXMgbm90IGEgcHJvbWlzZSAobm8gLnRoZW4gbWV0aG9kKSBvciB0aGUnLFxuICAgICAgJ3Byb21pc2UgaXMgYWN0dWFsbHkgZnVsZmlsbGVkLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhIHJlamVjdGVkIHByb21pc2UnLFxuICAgIGZhaWw6ICd3YXMgZnVsZmlsbGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIGFjdHVhbC50aGVuKFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlcilcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBSaWdodCBub3cgd2UgZG9uJ3Qga25vdyBpZiB0aGUgZXhwcmVzc2lvbiBpcyB2YWxpZFxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG4iLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xuXG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBpdGVyYXRlIGEgdmFsdWUgY3JlYXRpbmcgZm9ya3MgZm9yIGVhY2ggZWxlbWVudCwgaGFuZGxpbmdcbi8vIGFzeW5jIGV4cGVjdGF0aW9ucyBpZiBuZWVkZWQuXG5mdW5jdGlvbiBmb3JrZXIgKHJlc29sdmVyLCBhY3R1YWwsIGl0ZXJhdG9yLCBzdG9wKSB7XG4gIHZhciBicmFuY2hlcyA9IF8uc2l6ZShhY3R1YWwpO1xuICB2YXIgcmVzdWx0ID0gaXRlcmF0b3IoYWN0dWFsLCBmdW5jdGlvbiAodmFsdWUpIHtcblxuICAgIHZhciBmb3JrID0gcmVzb2x2ZXIuZm9yaygpO1xuXG4gICAgdmFyIHBhcnRpYWwgPSBmb3JrKHZhbHVlKTtcblxuICAgIC8vIFN0b3AgaXRlcmF0aW5nIGFzIHNvb24gYXMgcG9zc2libGVcbiAgICBpZiAocGFydGlhbCA9PT0gc3RvcCkge1xuICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgIHJldHVybiBzdG9wO1xuICAgIH1cblxuICAgIGlmIChwYXJ0aWFsID09PSAhc3RvcCkge1xuICAgICAgYnJhbmNoZXMgLT0gMTtcbiAgICAgIGlmICgwID09PSBicmFuY2hlcykge1xuICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgfVxuICAgICAgcmV0dXJuICFzdG9wO1xuICAgIH1cblxuICAgIC8vIEFzeW5jIHN1cHBvcnRcbiAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIGZvcmsncyBmaW5hbCByZXN1bHRcbiAgICBmb3JrLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgLy8gV2UncmUgZG9uZSB0aGUgbW9tZW50IG9uZSBpcyBhIHN0b3AgcmVzdWx0XG4gICAgICBpZiAoZmluYWwgPT09IHN0b3ApIHtcbiAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIHN0b3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJhbmNoZXMgLT0gMTtcbiAgICAgICAgaWYgKDAgPT09IGJyYW5jaGVzKSB7XG4gICAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgIXN0b3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmluYWw7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gIXN0b3A7ICAvLyBrZWVwIGl0ZXJhdGluZ1xuICB9KTtcblxuICAvLyBXaGVuIHRoZSBmb3JrcyBjb21wbGV0ZWQgc3luY2hyb25vdXNseSBqdXN0IGZpbmFsaXplIHRoZSByZXNvbHZlclxuICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZShyZXN1bHQpO1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuXG4vLyBRdWFudGlmaWVyc1xuYXNzLnJlZ2lzdGVyKHtcblxuICBldmVyeToge1xuICAgIGFsaWFzZXM6IFsgJ2FsbCcsICdhbGxPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnYWxsIG9mIHRoZW0gc3VjY2VlZCdcbiAgICBdLFxuICAgIGRlc2M6ICdGb3IgZXZlcnkgb25lOicsXG4gICAgZmFpbDogJ29uZSBkaWRuXFwndCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5ldmVyeSwgZmFsc2UpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgc29tZToge1xuICAgIGFsaWFzZXM6IFsgJ2FueU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdhdCBsZWFzdCBvbmUgb2YgdGhlbSBzdWNjZWVkcyddLFxuICAgIGRlc2M6ICdBdCBsZWFzdCBvbmU6JyxcbiAgICBmYWlsOiAnbm9uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uc29tZSwgdHJ1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBub25lOiB7XG4gICAgYWxpYXNlczogWyAnbm9uZU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdub25lIG9mIHRoZW0gc3VjY2VlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAnTm9uZSBvZiB0aGVtOicsXG4gICAgZmFpbDogJ29uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhcmUgZ29pbmcgdG8gdXNlIHRoZSBzYW1lIGFsZ29yaXRobSBhcyBmb3IgLnNvbWUgYnV0IHdlJ2xsIG5lZ2F0ZVxuICAgICAgICAvLyBpdHMgcmVzdWx0IHVzaW5nIGEgZmluYWxpemVyLlxuICAgICAgICByZXNvbHZlci5maW5hbGl6ZShmdW5jdGlvbiAoZmluYWwpIHtcbiAgICAgICAgICByZXR1cm4gIWZpbmFsO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uc29tZSwgdHJ1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG59KTtcbiIsInZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cblxudmFyIGNoZWNrQ2hhaW4gPSBuZXcgQ2hhaW4oKTtcblxuXG5leHBvcnRzLmxvZGFzaCA9IGZ1bmN0aW9uIChfKSB7XG4gIC8vIEV4aXQgaWYgYWxyZWFkeSBwYXRjaGVkXG4gIGlmIChfLmNyZWF0ZUNhbGxiYWNrKGNoZWNrQ2hhaW4pID09PSBjaGVja0NoYWluLnRlc3QpIHtcbiAgICByZXR1cm4gXztcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIGxvZGFzaCdzIGRlZmF1bHQgY3JlYXRlQ2FsbGJhY2sgbWVjaGFuaXNtIHRvIG1ha2UgaXQgdW5kZXJzdGFuZFxuICAvLyBhYm91dCBvdXIgZXhwcmVzc2lvbiBjaGFpbnMuXG4gIF8uY3JlYXRlQ2FsbGJhY2sgPSBfLndyYXAoXy5jcmVhdGVDYWxsYmFjaywgZnVuY3Rpb24ob3JpZywgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICBpZiAoQ2hhaW4uaXNDaGFpbihjYWxsYmFjaykpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjay50ZXN0O1xuICAgIH1cblxuICAgIC8vIFN1cHBvcnQgXy53aGVyZSBzdHlsZS4gSXQncyBub3QgYXMgZmFzdCBhcyB0aGUgb3JpZ2luYWwgb25lIHNpbmNlIHdlXG4gICAgLy8gaGF2ZSB0byBnbyB2aWEgXy5pc0VxdWFsIGluc3RlYWQgb2YgdXNpbmcgdGhlIGludGVybmFsIGZ1bmN0aW9uXG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdChjYWxsYmFjaykpIHtcbiAgICAgIHZhciBwcm9wcyA9IF8ua2V5cyhjYWxsYmFjayk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gZmFsc2UsIGxlbmd0aCA9IHByb3BzLmxlbmd0aCwga2V5O1xuICAgICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgICBrZXkgPSBwcm9wc1tsZW5ndGhdO1xuICAgICAgICAgIHJlc3VsdCA9IF8uaXNFcXVhbChvYmplY3Rba2V5XSwgY2FsbGJhY2tba2V5XSk7XG4gICAgICAgICAgaWYgKCFyZXN1bHQpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBvcmlnKGNhbGxiYWNrLCB0aGlzQXJnKTtcbiAgfSk7XG5cbiAgLy8gT3ZlcnJpZGUgbG9kYXNoJ3MgZGVmYXVsdCBpc0VxdWFsIGltcGxlbWVudGF0aW9uIHNvIGl0IHVuZGVyc3RhbmRzXG4gIC8vIGFib3V0IGV4cHJlc3Npb24gY2hhaW5zLlxuICBmdW5jdGlvbiBjbXAgKGEsIGIpIHtcbiAgICByZXR1cm4gQ2hhaW4uaXNDaGFpbihhKSA/IGEudGVzdChiKSA6IENoYWluLmlzQ2hhaW4oYikgPyBiLnRlc3QoYSkgOiB1bmRlZmluZWQ7XG4gIH1cbiAgXy5pc0VxdWFsID0gXy53cmFwKF8uaXNFcXVhbCwgZnVuY3Rpb24gKG9yaWcsIGEsIGIsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgdmFyIHJlc3VsdCA9IGNhbGxiYWNrID8gY2FsbGJhY2suY2FsbCh0aGlzQXJnIHx8IHRoaXMsIGEsIGIpIDogdW5kZWZpbmVkO1xuICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVzdWx0ID0gb3JpZyhhLCBiLCBjbXAsIHRoaXNBcmcpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KTtcblxuICByZXR1cm4gXztcbn1cblxuXG5leHBvcnRzLnNpbm9uID0gZnVuY3Rpb24gKHNpbm9uKSB7XG4gIC8vIEV4aXQgaWYgYWxyZWFkeSBwYXRjaGVkXG4gIGlmIChzaW5vbi5tYXRjaC5pc01hdGNoZXIoY2hlY2tDaGFpbikpIHtcbiAgICByZXR1cm4gc2lub247XG4gIH1cblxuICAvLyBPdmVycmlkZSBTaW5vbidzIC5pc01hdGNoZXIgaW1wbGVtZW50YXRpb24gdG8gYWxsb3cgb3VyIGV4cHJlc3Npb25zIHRvIGJlXG4gIC8vIHRyYW5zcGFyZW50bHkgc3VwcG9ydGVkIGJ5IGl0LlxuICB2YXIgb2xkSXNNYXRjaGVyID0gdXRpbC5iaW5kKHNpbm9uLm1hdGNoLmlzTWF0Y2hlciwgc2lub24ubWF0Y2gpO1xuICBzaW5vbi5tYXRjaC5pc01hdGNoZXIgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIENoYWluLmlzQ2hhaW4ob2JqKSB8fCBvbGRJc01hdGNoZXIob2JqKTtcbiAgfTtcblxuICByZXR1cm4gc2lub247XG59XG4iLCJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLy8gVXNlIGEgY2FwcGVkIHBvb2wsIHRoZSByZWxlYXNpbmcgYWxnb3JpdGhtIGlzIHByZXR0eSBzb2xpZCBzbyB3ZSBzaG91bGRcbi8vIGhhdmUgYSBnb29kIHJlLXVzZSByYXRpbyB3aXRoIGp1c3QgYSBmZXcgaW4gdGhlIHBvb2wuIFRoZW4gaW4gY2FzZVxuLy8gc29tZXRoaW5nIGdvZXMgd3JvbmcgdGhlIEdDIHdpbGwgdGFrZSBjYXJlIG9mIGl0IGFmdGVyIGEgd2hpbGUuXG52YXIgcG9vbCA9IHV0aWwuQ2FwcGVkUG9vbCgxMDApO1xudmFyIGNyZWF0ZWQgPSAwO1xuXG5cbi8vIEluc3RhbnRpYXRlcyBhIG5ldyByZXNvbHZlciBmdW5jdG9yXG5mdW5jdGlvbiBmYWN0b3J5ICgpIHtcbiAgLy8gSnVzdCBmb3J3YXJkcyB0aGUgY2FsbCB0byB0aGUgcmVzb2x2ZXIgYnkgc2V0dGluZyBpdHNlbGYgYXMgY29udGV4dC5cbiAgZnVuY3Rpb24gZm4gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyLmNhbGwoZm4sIHZhbHVlKTtcbiAgfVxuXG4gIGZuLmlkID0gKytjcmVhdGVkO1xuXG4gIC8vIFRoZSBzdGF0ZSBpcyBhdHRhY2hlZCB0byB0aGUgZnVuY3Rpb24gb2JqZWN0IHNvIGl0J3MgYXZhaWxhYmxlIHRvIHRoZVxuICAvLyBzdGF0ZS1sZXNzIGZ1bmN0aW9ucyB3aGVuIHJ1bm5pbmcgdW5kZXIgYHRoaXMuYC5cbiAgZm4uY2hhaW4gPSBudWxsO1xuICBmbi5wYXJlbnQgPSBudWxsO1xuICBmbi5wYXVzZWQgPSBmYWxzZTtcbiAgZm4ucmVzb2x2ZWQgPSBbXTtcbiAgZm4uZmluYWxpemVycyA9IFtdO1xuXG4gIC8vIEV4cG9zZSB0aGUgYmVoYXZpb3VyIGluIHRoZSBmdW5jdG9yXG4gIGZuLnBhdXNlID0gcGF1c2U7XG4gIGZuLnJlc3VtZSA9IHJlc3VtZTtcbiAgZm4uZm9yayA9IGZvcms7XG4gIGZuLmpvaW4gPSBqb2luO1xuICBmbi5maW5hbGl6ZSA9IGZpbmFsaXplO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwgJ2V4aGF1c3RlZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlc29sdmVkLmxlbmd0aCA+PSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX18ubGVuZ3RoO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGZuO1xufVxuXG4vLyBUaGlzIGlzIHRoZSBjb3JlIHJlc29sdXRpb24gYWxnb3JpdGhtLCBpdCBvcGVyYXRlcyBvdmVyIHRoZSBjaGFpblxuLy8gb2YgZXhwZWN0YXRpb25zIGNoZWNraW5nIHRoZW0gb25lIGFmdGVyIHRoZSBvdGhlciBhZ2FpbnN0IGEgdmFsdWUuXG4vLyBJZiBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGl0J2xsIGJlIGltbWVkaWF0ZWx5IGNhbGxlZCB1c2luZyB0aGVcbi8vIGV4cGVjdGF0aW9uIGluc3RhbmNlIGFzIGNvbnRleHQgYW5kIHBhc3NpbmcgYXMgb25seSBhcmd1bWVudCB0aGVcbi8vIGN1cnJlbnQgcmVzb2x2ZSBmdW5jdGlvbiwgdGhpcyBhbGxvd3MgYW4gZXhwZWN0YXRpb24gdG8gb3ZlcnJpZGVcbi8vIHRoZSB2YWx1ZSBhbmQvb3IgY29udHJvbCB0aGUgcmVzb2x1dGlvbiB3aXRob3V0IGV4cG9zaW5nIHRvbyBtYW55XG4vLyBpbnRlcm5hbCBkZXRhaWxzLlxuLy8gV2hlbiBpdCByZXR1cm5zIGB1bmRlZmluZWRgIGl0IGp1c3QgbWVhbnMgdGhhdCB0aGUgcmVzb2x1dGlvbiB3YXNcbi8vIHBhdXNlZCAoYXN5bmMpLCB3ZSBjYW4gbm90IG9idGFpbiBhIGZpbmFsIHJlc3VsdCB1c2luZyBhIHN5bmNocm9ub3VzXG4vLyBjYWxsLiBUaGlzIGNhbiBiZSB1c2VkIGJ5IG1hdGNoZXJzIHdoZW4gdGFraW5nIG92ZXIgdGhlIHJlc29sdXRpb24gdG9cbi8vIGtub3cgaWYgdGhleSBuZWVkIHRvIG1hbmdsZSB0aGUgcmVzdWx0cyBvciB0aGV5IGhhdmUgdG8gcmVnaXN0ZXIgYVxuLy8gZmluYWxpemVyIHRvIGJlIG5vdGlmaWVkIG9mIHRoZSBmaW5hbCByZXN1bHQgZnJvbSB0aGUgY2hhaW4uXG5mdW5jdGlvbiByZXNvbHZlciAodmFsdWUpIHtcbiAgdmFyIGxpc3QsIHJlc3VsdCwgZXhwO1xuXG4gIGxpc3QgPSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX187XG4gIG9mZnNldCA9IHRoaXMucmVzb2x2ZWQubGVuZ3RoO1xuICByZXN1bHQgPSB0cnVlO1xuXG4gIGZvciAodmFyIGkgPSBvZmZzZXQ7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gQ3JlYXRlIGEgbmV3IG9iamVjdCBpbmhlcml0aW5nIGZyb20gdGhlIGV4cGVjdGF0aW9uIGJ1dCB3aXRoIHRoZVxuICAgIC8vIGN1cnJlbnQgYWN0dWFsIHZhbHVlIHByb3Zpc2lvbmVkLiBJdCBhbGxvd3MgdGhlIGV4cHJlc3Npb24gdG8gbXV0YXRlXG4gICAgLy8gaXRzIHN0YXRlIGZvciB0aGlzIGV4ZWN1dGlvbiBidXQgbm90IGFmZmVjdCBvdGhlciB1c2VzIG9mIGl0LlxuICAgIGV4cCA9IHV0aWwuY3JlYXRlKGxpc3RbaV0sIHsgYWN0dWFsOiB2YWx1ZSB9KTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgcmVzb2x2ZWQgZXhwZWN0YXRpb25zXG4gICAgdGhpcy5yZXNvbHZlZC5wdXNoKGV4cCk7XG5cbiAgICAvLyBFeGVjdXRlIHRoZSBleHBlY3RhdGlvbiB0byBvYnRhaW4gaXRzIHJlc3VsdFxuICAgIHJlc3VsdCA9IGV4cC5yZXN1bHQgPSBleHAucmVzb2x2ZSgpO1xuXG4gICAgLy8gQWxsb3cgZXhwZWN0YXRpb25zIHRvIHRha2UgY29udHJvbCBmb3IgdGhlIHJlbWFpbmluZyBvZiB0aGUgY2hhaW5cbiAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gU2luY2UgdGhlIGNvbnRyb2wgaXMgZGVsZWdhdGVkIHRvIHRoZSBleHByZXNzaW9uIHdlIGRvbid0IGhhdmUgdG9cbiAgICAgIC8vIGRvIGFueXRoaW5nIG1vcmUgaGVyZS5cbiAgICAgIHJldHVybiBleHAucmVzdWx0ID0gcmVzdWx0LmNhbGwoZXhwLCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBTdG9wIG9uIGZpcnN0IGZhaWx1cmVcbiAgICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB3ZSBqdXN0IG5lZWQgdG8gYXBwbHkgYW55IHBlbmRpbmcgZmluYWxpemVyc1xuICByZXR1cm4gdGhpcy5maW5hbGl6ZShyZXN1bHQpO1xufVxuXG5cbi8vIFdoZW4gcmVzb2x2aW5nIGFzeW5jIGZsb3dzIChpLmUuOiBwcm9taXNlcykgdGhpcyB3aWxsIHBhdXNlIHRoZSBnaXZlblxuLy8gcmVzb2x2ZXIgdW50aWwgYSBjYWxsIHRvIC5yZXN1bWUoKSBpcyBtYWRlLlxuZnVuY3Rpb24gcGF1c2UgKCkge1xuICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc29sdmVyIGFscmVhZHkgcGF1c2VkJyk7XG4gIH1cblxuICB0aGlzLnBhdXNlZCA9IHRydWU7XG59XG5cbi8vIE9uY2UgdGhlIGFzeW5jIGZsb3cgaGFzIGNvbXBsZXRlZCB3ZSBjYW4gY29udGludWUgcmVzb2x2aW5nIHdoZXJlIHdlXG4vLyBzdG9wZWQuIFdoZW4gdGhlIG92ZXJyaWRlIHBhcmFtIGlzIG5vdCB1bmRlZmluZWQgd2UnbGwgc2tpcCBjYWxsaW5nIHRoZVxuLy8gcmVzb2x2ZXIgYW5kIGFzc3VtZSB0aGF0IGJvb2wgYXMgdGhlIGZpbmFsIHJlc3VsdC4gVGhpcyBhbGxvd3MgdGhlIGFzeW5jXG4vLyBjb2RlIHRvIHNob3J0Y3V0IHRoZSByZXNvbHZlci5cbmZ1bmN0aW9uIHJlc3VtZSAoYWN0dWFsLCBvdmVycmlkZSkge1xuICBpZiAoIXRoaXMucGF1c2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHZlciBpcyBub3QgY3VycmVudGx5IHBhdXNlZCcpO1xuICB9XG5cbiAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcblxuICAvLyBBIGZpbmFsIHJlc3VsdCB3YXMgcHJvdmlkZWQgc28ganVzdCBmaW5hbGl6ZSB0aGUgcmVzb2x2ZXJcbiAgaWYgKG92ZXJyaWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdGhpcy5maW5hbGl6ZShvdmVycmlkZSk7XG4gIH1cblxuICAvLyBMZXQncyBjb250aW51ZSByZXNvbHZpbmcgd2l0aCB0aGUgbmV3IHZhbHVlXG4gIC8vIE5vdGU6IHRoaXMoKSBsb29rcyB3ZWlyZCBidXQgcmVtZW1iZXIgd2UncmUgdXNpbmcgYSBmdW5jdGlvbiBhcyBjb250ZXh0XG4gIHJldHVybiB0aGlzKGFjdHVhbCk7XG59XG5cbi8vIENsb25lcyB0aGUgY3VycmVudCByZXNvbHZlciBzbyB3ZSBjYW4gZm9yayBhbmQgZGlzY2FyZCBvcGVyYXRpb25zLlxuZnVuY3Rpb24gZm9yayAoKSB7XG4gIHZhciBmb3JrID0gYWNxdWlyZSh0aGlzLmNoYWluKTtcbiAgZm9yay5wYXJlbnQgPSB0aGlzO1xuICAvLyBmb3JrLnJlc29sdmVkID0gdGhpcy5yZXNvbHZlZC5zbGljZSgwKTtcbiAgZm9yay5yZXNvbHZlZCA9IF8ucmVqZWN0KHRoaXMucmVzb2x2ZWQsIEFycmF5LmlzQXJyYXkpO1xuICByZXR1cm4gZm9yaztcbn1cblxuLy8gQXNzdW1lIHRoZSByZXN1bHRzIGZyb20gYSBmb3JrIGluIHRoZSBtYWluIHJlc29sdmVyXG5mdW5jdGlvbiBqb2luIChmb3JrKSB7XG4gIHZhciBsZW4gPSBfLnJlamVjdCh0aGlzLnJlc29sdmVkLCBBcnJheS5pc0FycmF5KS5sZW5ndGg7XG4gIHRoaXMucmVzb2x2ZWQucHVzaChcbiAgICBmb3JrLnJlc29sdmVkLnNsaWNlKGxlbilcbiAgKTtcbn1cblxuLy8gV2hlbiB0aGUgYXJndW1lbnQgaXMgYSBmdW5jdGlvbiBpdCBnZXRzIHJlZ2lzdGVyZWQgYXMgYSBmaW5hbGl6ZXIgZm9yIHRoZVxuLy8gcmVzdWx0IG9idGFpbmVkIG9uY2UgdGhlIGV4cHJlc3Npb24gaGFzIGJlZW4gZnVsbHkgcmVzb2x2ZWQgKGkuZS4gYXN5bmMpLlxuLy8gT3RoZXJ3aXNlIGl0J2xsIGV4ZWN1dGUgYW55IHJlZ2lzdGVyZWQgZnVuY3Rpb25zIG9uIHRoZSBnaXZlbiByZXN1bHQgYW5kXG4vLyBhbGxvdyB0aGVtIHRvIGNoYW5nZSBpdCBiZWZvcmUgcmVsZWFzaW5nIHRoZSByZXNvbHZlciBpbnRvIHRoZSBwb29sLlxuZnVuY3Rpb24gZmluYWxpemUocmVzdWx0KSB7XG4gIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5maW5hbGl6ZXJzLnB1c2goXG4gICAgICBbcmVzdWx0LCBfLmxhc3QodGhpcy5yZXNvbHZlZCldXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBOb3RoaW5nIHlldCB0byBmaW5hbGl6ZSBzaW5jZSB0aGUgcmVzdWx0IGlzIHN0aWxsIHVua25vd25cbiAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vIEFsbG93IGZpbmFsaXplcnMgdG8gdG9nZ2xlIHRoZSByZXN1bHQgKExJRk8gb3JkZXIpXG4gIHZhciBmaW5hbGl6ZXI7XG4gIHdoaWxlICh0aGlzLmZpbmFsaXplcnMubGVuZ3RoID4gMCkge1xuICAgIGZpbmFsaXplciA9IHRoaXMuZmluYWxpemVycy5wb3AoKTtcbiAgICByZXN1bHQgPSBmaW5hbGl6ZXJbMF0uY2FsbChmaW5hbGl6ZXJbMV0sIHJlc3VsdCk7XG4gICAgZmluYWxpemVyWzFdLnJlc3VsdCA9IHJlc3VsdDtcbiAgfVxuXG4gIC8vIExldCB0aGUgY2hhaW4gZGlzcGF0Y2ggdGhlIGZpbmFsIHJlc3VsdCBidXQgb25seSBmb3Igbm9uLWZvcmtlZCByZXNvbHZlcnNcbiAgaWYgKCF0aGlzLnBhcmVudCkge1xuICAgIHRoaXMuY2hhaW4uZGlzcGF0Y2hSZXN1bHQodGhpcy5yZXNvbHZlZCwgcmVzdWx0KTtcbiAgfVxuXG4gIC8vIFdoZW4gYSBmaW5hbCByZXN1bHQgaGFzIGJlZW4gb2J0YWluZWQgcmVsZWFzZSB0aGUgcmVzb2x2ZXIgdG8gdGhlIHBvb2xcbiAgcG9vbC5wdXNoKHRoaXMpO1xuICBpZiAocG9vbC5sZW5ndGggPiBjcmVhdGVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQb29sIGNvcnJ1cHRlZCEgQ3JlYXRlZCAnICsgY3JlYXRlZCArICcgYnV0IHRoZXJlIGFyZSAnICsgcG9vbC5sZW5ndGggKyAnIHBvb2xlZCcpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gQWNxdWlyZXMgYSByZXNvbHZlciBmdW5jdG9yLCBpZiB0aGVyZSBpcyBvbmUgaW4gdGhlIHBvb2wgaXQnbGwgYmUgcmVzZXQgYW5kXG4vLyByZXVzZWQsIG90aGVyd2lzZSBpdCdsbCBjcmVhdGUgYSBuZXcgb25lLiBXaGVuIHlvdSdyZSBkb25lIHdpdGggdGhlIHJlc29sdmVyXG4vLyB5b3Ugc2hvdWQgZ2l2ZSBpdCB0byBgcmVsZWFzZSgpYCBzbyBpdCBjYW4gYmUgaW5jb3Jwb3JhdGVkIHRvIHRoZSBwb29sLlxuLy8gVGhlIHJlYXNvbiBmb3IgdXNpbmcgYSBwb29sIG9mIG9iamVjdHMgaGVyZSBpcyB0aGF0IGV2ZXJ5IHRpbWUgd2UgZXZhbHVhdGVcbi8vIGFuIGV4cHJlc3Npb24gd2UnbGwgbmVlZCBhIHJlc29sdmVyLCB3aGVuIHVzaW5nIHF1YW50aWZpZXJzIG11bHRpcGxlIGZvcmtzXG4vLyB3aWxsIGJlIGNyZWF0ZWQsIHNvIGl0J3MgaW1wb3J0YW50IHRvIGltcHJvdmUgdGhlIHBlcmZvcm1hbmNlLlxuZnVuY3Rpb24gYWNxdWlyZSAoY2hhaW4pIHtcbiAgdmFyIHJlc29sdmVyID0gcG9vbC5wb3AoKSB8fCBmYWN0b3J5KCk7XG5cbiAgLy8gUmVzZXQgdGhlIHN0YXRlIG9mIHRoZSByZXNvbHZlclxuICByZXNvbHZlci5jaGFpbiA9IGNoYWluO1xuICByZXNvbHZlci5wYXJlbnQgPSBudWxsO1xuICByZXNvbHZlci5wYXVzZWQgPSBmYWxzZTtcbiAgd2hpbGUgKHJlc29sdmVyLnJlc29sdmVkLmxlbmd0aCA+IDApIHtcbiAgICByZXNvbHZlci5yZXNvbHZlZC5wb3AoKTtcbiAgfVxuICB3aGlsZSAocmVzb2x2ZXIuZmluYWxpemVycy5sZW5ndGggPiAwKSB7XG4gICAgcmVzb2x2ZXIuZmluYWxpemVycy5wb3AoKTtcbiAgfVxuXG4gIHJldHVybiByZXNvbHZlcjtcbn1cblxuXG5leHBvcnRzLmFjcXVpcmUgPSBhY3F1aXJlO1xuIiwiLy8gU3VwcG9ydCBmb3IgLnNob3VsZCBzdHlsZSBzeW50YXgsIG5vdGljZSB0aGF0IHdoaWxlIGhlcmUgcmVzaWRlcyB0aGUgY29yZVxuLy8gbG9naWMgZm9yIGl0IHRoZSBpbnRlcmZhY2UgaXMgZG9uZSBpbiBhc3MuanMgaW4gb3JkZXIgdG8gbWFrZSBpdCByZXR1cm5cbi8vIHRoZSBgYXNzYCBmdW5jdGlvbiBhbmQgcHJvdmlkZSBzdXBwb3J0IGZvciBpdHMgdXNlIG9uIGJlZm9yZUVhY2gvYWZ0ZXJFYWNoLlxuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG5cblxudmFyIERFRkFVTFRfUFJPUCA9ICdzaG91bGQnO1xuXG4vLyBJbnN0YWxscyB0aGUgdHlwaWNhbCAuc2hvdWxkIHByb3BlcnR5IG9uIHRoZSByb290IE9iamVjdCBwcm90b3R5cGUuXG4vLyBZb3UgY2FuIGluc3RhbGwgdW5kZXIgYW55IG5hbWUgb2YgeW91ciBjaG9vc2luZyBieSBnaXZpbmcgaXQgYXMgYXJndW1lbnQuXG4vL1xuLy8gQmFzaWNhbGx5IGJvcnJvd2VkIGZyb20gdGhlIENoYWkgcHJvamVjdDpcbi8vICBDb3B5cmlnaHQoYykgMjAxMS0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS9pbnRlcmZhY2Uvc2hvdWxkLmpzXG5mdW5jdGlvbiBzaG91bGQgKG5hbWUpIHtcbiAgaWYgKG5hbWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gc2hvdWxkLnJlc3RvcmUoKTtcbiAgfVxuXG4gIG5hbWUgPSBuYW1lIHx8IERFRkFVTFRfUFJPUDtcblxuICBpZiAobmFtZSBpbiBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgaWYgKCEoT2JqZWN0LnByb3RvdHlwZVtuYW1lXSBpbnN0YW5jZW9mIENoYWluKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdhc3Muc2hvdWxkOiBPYmplY3QucHJvdG90eXBlIGFscmVhZHkgaGFzIGEgLicgKyBuYW1lICsgJyBwcm9wZXJ0eScpO1xuICAgIH1cbiAgfVxuXG4gIC8vIG1vZGlmeSBPYmplY3QucHJvdG90eXBlIHRvIGhhdmUgYDxuYW1lPmBcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgQ2hhaW4pIHtcbiAgICAgICAgLy8gQWN0dWFsbHkgQ2hhaW4gaW5zdGFuY2VzIGRvbid0IGluaGVyaXQgZnJvbSBPYmplY3QgYnV0IHN0aWxsXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSBlbHNlIGlmICh0aGlzIGluc3RhbmNlb2YgU3RyaW5nIHx8IHRoaXMgaW5zdGFuY2VvZiBOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzLmNvbnN0cnVjdG9yKHRoaXMpKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIEJvb2xlYW4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzID09IHRydWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzKTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBBbGxvdzogZ2xvYmFsLmFzcyA9IHJlcXVpcmUoJ2FzcycpLnNob3VsZCgpXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLCAgLy8gQWxsb3cgcmVzdG9yYXRpb25cbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBFeHBvc2UgaXQgYXMgYSBuby1vcCBvbiBDaGFpbnMgc2luY2UgdGhleSBkb24ndCBpbmhlcml0IGZyb20gT2JqZWN0XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlICAvLyBBbGxvdyByZXN0b3JhdGlvblxuICB9KTtcblxufVxuXG5zaG91bGQucmVzdG9yZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIG5hbWUgPSBuYW1lIHx8IERFRkFVTFRfUFJPUDtcblxuICBpZiAobmFtZSBpbiBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGVbbmFtZV0gaW5zdGFuY2VvZiBDaGFpbikge1xuICAgICAgZGVsZXRlIE9iamVjdC5wcm90b3R5cGVbbmFtZV07XG4gICAgICBkZWxldGUgQ2hhaW4ucHJvdG90eXBlW25hbWVdO1xuICAgIH1cbiAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZDtcbiIsInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG4vLyBHZXQgdGhlIG5hdGl2ZSBQcm9taXNlIG9yIGEgc2hpbVxuLy8gVE9ETzogQ2hlY2sgdGhhdCB0aGlzIHdvcmtzIGluIGEgYnJvd3NlciBlbnZpcm9ubWVudFxuZXhwb3J0cy5Qcm9taXNlID0gZ2xvYmFsLlByb21pc2UgfHwgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cud2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC53aW5kb3cgOiBudWxsKS5Qcm9taXNlO1xuXG5cbi8vIENhcHBlZCBwb29sIHRvIGxpbWl0IHRoZSBtYXhpbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IGNhbiBiZVxuLy8gc3RvcmVkICh1bmJvdW5kZWQgYnkgZGVmYXVsdCkuXG5leHBvcnRzLkNhcHBlZFBvb2wgPSBmdW5jdGlvbiAobWF4KSB7XG4gIHZhciBwb29sID0gW107XG5cbiAgbWF4ID0gbWF4IHx8IE51bWJlci5NQVhfVkFMVUU7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHBvb2wsICdwdXNoJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAodikge1xuICAgICAgaWYgKHRoaXMubGVuZ3RoIDwgbWF4KSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwodGhpcywgdik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcG9vbDtcbn07XG5cblxudmFyIGRvQ29sb3JzID0gXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgLy8gTWFzdGVyIG92ZXJyaWRlIHdpdGggb3VyIGN1c3RvbSBlbnYgdmFyaWFibGVcbiAgaWYgKHByb2Nlc3MuZW52LkFTU19DT0xPUlMgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAvdHJ1ZXxvbnx5ZXN8ZW5hYmxlZD98MS9pLnRlc3QocHJvY2Vzcy5lbnYuQVNTX0NPTE9SUyk7XG4gIH1cblxuICAvLyBDaGVjayBpZiBtb2NoYSBpcyBhcm91bmQgYW5kIHZlcmlmeSBhZ2FpbnN0IGl0cyBjb25maWd1cmF0aW9uXG4gIHZhciBNb2NoYSA9IGdsb2JhbC5Nb2NoYTtcbiAgaWYgKE1vY2hhID09PSB1bmRlZmluZWQgJiYgcmVxdWlyZS5yZXNvbHZlICYmIHJlcXVpcmUucmVzb2x2ZSgnbW9jaGEnKSkge1xuICAgIE1vY2hhID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuTW9jaGEgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLk1vY2hhIDogbnVsbCk7XG4gIH1cbiAgaWYgKE1vY2hhICE9PSB1bmRlZmluZWQgJiYgTW9jaGEucmVwb3J0ZXJzICE9PSB1bmRlZmluZWQgJiYgTW9jaGEucmVwb3J0ZXJzLkJhc2UgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBNb2NoYS5yZXBvcnRlcnMuQmFzZS51c2VDb2xvcnM7XG4gIH1cblxuICAvLyBRdWVyeSB0aGUgZW52aXJvbm1lbnQgYW5kIHNlZSBpZiBzb21lIGNvbW1vbiB2YXJpYWJsZXMgYXJlIHNldFxuICBpZiAocHJvY2Vzcy5lbnYuTU9DSEFfQ09MT1JTICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoLy0tY29sb3I9YWx3YXlzLy50ZXN0KHByb2Nlc3MuZW52LkdSRVBfT1BUSU9OUyB8fCAnJykpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIEZpbmFsbHkganVzdCBjaGVjayBpZiB0aGUgZW52aXJvbm1lbnQgaXMgY2FwYWJsZVxuICB2YXIgdHR5ID0gcmVxdWlyZSgndHR5Jyk7XG4gIHJldHVybiB0dHkuaXNhdHR5KDEpICYmIHR0eS5pc2F0dHkoMik7XG59KTtcblxuXG4vLyBSZW1vdmUgQU5TSSBlc2NhcGVzIGZyb20gYSBzdHJpbmdcbmZ1bmN0aW9uIHVuYW5zaSAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXFx4MWJcXFsoXFxkKzs/KStbYS16XS9naSwgJycpO1xufVxuXG5cbi8vIEF2b2lkIHJlcGVhdGVkIGNvbXBpbGF0aW9ucyBieSBtZW1vaXppbmdcbnZhciBjb21waWxlVGVtcGxhdGUgPSBfLm1lbW9pemUoZnVuY3Rpb24gKHRwbCkge1xuICByZXR1cm4gXy50ZW1wbGF0ZSh0cGwsIG51bGwsIHtcbiAgICBlc2NhcGU6IC9cXHtcXHsoW1xcc1xcU10rPylcXH1cXH0vZ1xuICB9KTtcbn0pO1xuXG4vLyBEdW1wcyBhcmJpdHJhcnkgdmFsdWVzIGFzIHN0cmluZ3MgaW4gYSBjb25jaXNlIHdheVxuLy8gVE9ETzogaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9jaGFpL2Jsb2IvbWFzdGVyL2xpYi9jaGFpL3V0aWxzL29iakRpc3BsYXkuanNcbmZ1bmN0aW9uIHZhbHVlRHVtcGVyICh2KSB7XG4gIHZhciB2YWx1ZTtcblxuICBpZiAoXy5pc051bWJlcih2KSB8fCBfLmlzTmFOKHYpIHx8IF8uaXNCb29sZWFuKHYpIHx8IF8uaXNOdWxsKHYpIHx8IF8uaXNVbmRlZmluZWQodikpIHtcbiAgICB2YWx1ZSA9ICc8JyArIHYgKyAnPic7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfVxuXG4gIHJldHVybiAnXFx1MDAxYlsxOzM2bScgKyB2YWx1ZSArICdcXHUwMDFiWzBtJztcbn1cblxuXG4vLyBDdXN0b21pemVkIHZlcnNpb24gb2YgbG9kYXNoIHRlbXBsYXRlXG5mdW5jdGlvbiB0ZW1wbGF0ZSAodHBsLCBjb250ZXh0KSB7XG4gIHZhciBmbiA9IGNvbXBpbGVUZW1wbGF0ZSh0cGwpO1xuICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIG9yaWdFc2NhcGUgPSBfLmVzY2FwZTtcbiAgdHJ5IHtcbiAgICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBlc2NhcGUgZnVuY3Rpb24gdG8gdXNlIGl0IGZvciBkdW1waW5nIGZvcm1hdHRlZCB2YWx1ZXNcbiAgICBfLmVzY2FwZSA9IHZhbHVlRHVtcGVyO1xuXG4gICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuXG4gIH0gZmluYWxseSB7XG4gICAgXy5lc2NhcGUgPSBvcmlnRXNjYXBlO1xuICB9XG59XG5cbi8vIEEgc2ltcGxlIGZhc3QgZnVuY3Rpb24gYmluZGluZyBwcmltaXRpdmUgb25seSBzdXBwb3J0aW5nIHNldHRpbmcgdGhlIGNvbnRleHRcbmZ1bmN0aW9uIGJpbmQoZm4sIHRoaXNBcmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxuLy8gUXVpY2tseSBjcmVhdGVzIGEgbmV3IG9iamVjdCB3aXRoIGEgY3VzdG9tIHByb3RvdHlwZSBhbmQgc29tZSB2YWx1ZVxuLy8gb3ZlcnJpZGVzLlxuZnVuY3Rpb24gY3JlYXRlKHByb3RvLCB2YWx1ZXMpIHtcbiAgaWYgKDAgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEhBQ0s6IFVzZSBGdW5jdGlvbi5wcm90b3R5cGUgKyBuZXcgaW5zdGVhZCBvZiB0aGUgc2xvdy1pc2ggT2JqZWN0LmNyZWF0ZVxuICBjcmVhdGUucHJvdG90eXBlID0gcHJvdG87XG4gIHJldHVybiBfLmFzc2lnbihuZXcgY3JlYXRlLCB2YWx1ZXMgfHwge30pO1xufVxuXG5cbmV4cG9ydHMuYmluZCA9IGJpbmQ7XG5leHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZTtcbmV4cG9ydHMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbmV4cG9ydHMudW5hbnNpID0gdW5hbnNpO1xuZXhwb3J0cy5kb0NvbG9ycyA9IGRvQ29sb3JzO1xuIiwidmFyIGFzcyA9IHJlcXVpcmUoJy4vbGliL2FzcycpO1xudmFyIENoYWluID0gcmVxdWlyZSgnLi9saWIvY2hhaW4nKTtcbnZhciBBc3NFcnJvciA9IHJlcXVpcmUoJy4vbGliL2Vycm9yJyk7XG52YXIgc2hvdWxkID0gcmVxdWlyZSgnLi9saWIvc2hvdWxkJyk7XG52YXIgcGF0Y2hlcyA9IHJlcXVpcmUoJy4vbGliL3BhdGNoZXMnKTtcblxuLy8gUmVnaXN0ZXIgdGhlIGRlZmF1bHQgbWF0Y2hlcnNcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL2NvcmUnKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL2Nvb3JkaW5hdGlvbicpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvcXVhbnRpZmllcnMnKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL3Byb21pc2UnKTtcblxuXG4vLyBCdW5kbGUgc29tZSBvZiB0aGUgaW50ZXJuYWwgc3R1ZmYgd2l0aCB0aGUgYXNzIGZ1bmN0aW9uXG5hc3MuQ2hhaW4gPSBDaGFpbjtcbmFzcy5FcnJvciA9IEFzc0Vycm9yO1xuXG4vLyBGb3J3YXJkIHRoZSBzaG91bGQgaW5zdGFsbGVyXG4vLyBOb3RlOiBtYWtlIHRoZW0gYXJpdHktMCB0byBhbGxvdyBiZWZvcmVFYWNoKGFzcy5zaG91bGQpIGluIE1vY2hhXG5hc3Muc2hvdWxkID0gZnVuY3Rpb24gKC8qIG5hbWUgKi8pIHtcbiAgc2hvdWxkKGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogdW5kZWZpbmVkKTtcbiAgcmV0dXJuIGFzcztcbn07XG5hc3Muc2hvdWxkLnJlc3RvcmUgPSBmdW5jdGlvbiAoLyogbmFtZSAqLykge1xuICBzaG91bGQucmVzdG9yZShhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IHVuZGVmaW5lZCk7XG4gIHJldHVybiBhc3M7XG59O1xuXG5cbi8vIFBhdGNoIHRoaXJkIHBhcnR5IGxpYnJhcmllcyB0byB1bmRlcnN0YW5kIGFib3V0IGFzcy1lcnQgZXhwcmVzc2lvbnMuIFdlXG4vLyBkZXBlbmQgb24gcGF0Y2hpbmcgbG9kYXNoIGZvciB0aGUgbGlicmFyeSB0byB3b3JrIGNvcnJlY3RseSwgaG93ZXZlciB0aGVcbi8vIHJlc3QgYXJlIG9wdGlvbmFsLlxucGF0Y2hlcy5sb2Rhc2goKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpKTtcblxuaWYgKGdsb2JhbC5zaW5vbiAmJiBnbG9iYWwuc2lub24ubWF0Y2gpIHtcbiAgcGF0Y2hlcy5zaW5vbihnbG9iYWwuc2lub24pO1xufSBlbHNlIGlmIChyZXF1aXJlLnJlc29sdmUgJiYgcmVxdWlyZS5yZXNvbHZlKCdzaW5vbicpKSB7XG4gIHBhdGNoZXMuc2lub24oKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuc2lub24gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLnNpbm9uIDogbnVsbCkpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gYXNzO1xuIixudWxsLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5NdXRhdGlvbk9ic2VydmVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuTXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICB2YXIgcXVldWUgPSBbXTtcblxuICAgIGlmIChjYW5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgIHZhciBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcXVldWVMaXN0ID0gcXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBxdWV1ZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoaGlkZGVuRGl2LCB7IGF0dHJpYnV0ZXM6IHRydWUgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGhpZGRlbkRpdi5zZXRBdHRyaWJ1dGUoJ3llcycsICdubycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiLy8gRW11bGF0ZXMgVjgncyBDYWxsU2l0ZSBvYmplY3QgZnJvbSBhIHN0YWNrdHJhY2UuanMgZnJhbWUgb2JqZWN0XG5cbmZ1bmN0aW9uIENhbGxTaXRlIChmcmFtZSkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2FsbFNpdGUpKSB7XG4gICAgcmV0dXJuIG5ldyBDYWxsU2l0ZShmcmFtZSk7XG4gIH1cbiAgdGhpcy5mcmFtZSA9IGZyYW1lO1xufTtcblxuQ2FsbFNpdGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSh7XG4gIGdldExpbmVOdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5mcmFtZS5saW5lTnVtYmVyO1xuICB9LFxuICBnZXRDb2x1bW5OdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5mcmFtZS5jb2x1bW5OdW1iZXI7XG4gIH0sXG4gIGdldEZpbGVOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuZmlsZU5hbWU7XG4gIH0sXG4gIGdldEZ1bmN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuZnVuY3Rpb247XG4gIH0sXG4gIGdldFRoaXM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgZ2V0VHlwZU5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgZ2V0TWV0aG9kTmFtZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmZyYW1lLmZ1bmN0aW9uTmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lLnNwbGl0KCcuJykucG9wKCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9LFxuICBnZXRGdW5jdGlvbk5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5mcmFtZS5mdW5jdGlvbk5hbWU7XG4gIH0sXG4gIGdldEV2YWxPcmlnaW46IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgaXNUb3BsZXZlbDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xuICB9LFxuICBpc0V2YWw6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cbiAgfSxcbiAgaXNOYXRpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cbiAgfSxcbiAgaXNDb25zdHJ1Y3RvcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAvXm5ldyhcXHN8JCkvLnRlc3QodGhpcy5mcmFtZS5mdW5jdGlvbk5hbWUpO1xuICB9LFxuICB0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuICAgIHZhciBuYW1lID0gdGhpcy5nZXRGdW5jdGlvbk5hbWUoKSB8fCAnPGFub255bW91cz4nO1xuICAgIHZhciBsb2MgPSB0aGlzLmdldEZpbGVOYW1lKCkgKyAnOicgKyB0aGlzLmdldExpbmVOdW1iZXIoKSArICc6JyArIHRoaXMuZ2V0Q29sdW1uTnVtYmVyKClcbiAgICByZXR1cm4gbmFtZSArICcgKCcgKyBsb2MgKyAnKSc7XG4gIH1cbn0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ2FsbFNpdGU7XG4iLCJ2YXIgRXJyb3JTdGFja1BhcnNlciA9IHJlcXVpcmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicpO1xudmFyIENhbGxTaXRlID0gcmVxdWlyZSgnLi9jYWxsLXNpdGUnKTtcblxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgYnVpbHRpbiBlcnJvciBjb25zdHJ1Y3RvclxudmFyIE5hdGl2ZUVycm9yID0gRXJyb3I7XG5cblxuZnVuY3Rpb24gRmFpbHVyZSAobWVzc2FnZSwgc2ZmKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGYWlsdXJlKSkge1xuICAgIHJldHVybiBuZXcgRmFpbHVyZShtZXNzYWdlLCBzZmYgfHwgRmFpbHVyZSk7XG4gIH1cblxuICB0aGlzLnNmZiA9IHNmZiB8fCB0aGlzLmNvbnN0cnVjdG9yO1xuXG4gIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG5cbiAgLy8gR2VuZXJhdGUgYSBnZXR0ZXIgZm9yIHRoZSBmcmFtZXMsIHRoaXMgZW5zdXJlcyB0aGF0IHdlIGRvIGFzIGxpdHRsZSB3b3JrXG4gIC8vIGFzIHBvc3NpYmxlIHdoZW4gaW5zdGFudGlhdGluZyB0aGUgZXJyb3IsIGRlZmVycmluZyB0aGUgZXhwZW5zaXZlIHN0YWNrXG4gIC8vIG1hbmdsaW5nIG9wZXJhdGlvbnMgdW50aWwgdGhlIC5zdGFjayBwcm9wZXJ0eSBpcyBhY3R1YWxseSByZXF1ZXN0ZWQuXG4gIHRoaXMuX2dldEZyYW1lcyA9IG1ha2VGcmFtZXNHZXR0ZXIodGhpcy5zZmYpO1xuXG4gIC8vIE9uIEVTNSBlbmdpbmVzIHdlIHVzZSBvbmUtdGltZSBnZXR0ZXJzIHRvIGFjdHVhbGx5IGRlZmVyIHRoZSBleHBlbnNpdmVcbiAgLy8gb3BlcmF0aW9ucyAoZGVmaW5lZCBpbiB0aGUgcHJvdG90eXBlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zKSB3aGlsZSBsZWdhY3lcbiAgLy8gZW5naW5lcyB3aWxsIHNpbXBseSBkbyBhbGwgdGhlIHdvcmsgdXAgZnJvbnQuXG4gIGlmICh0eXBlb2YgT2JqZWN0LmRlZmluZVByb3BlcnR5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5mcmFtZXMgPSB1bndpbmQodGhpcy5fZ2V0RnJhbWVzKCkpO1xuICAgIHRoaXMuX2dldEZyYW1lcyh0cnVlKTtcbiAgICB0aGlzLl9nZXRGcmFtZXMgPSBudWxsO1xuICAgIHRoaXMuc3RhY2sgPSB0aGlzLmdlbmVyYXRlU3RhY2tUcmFjZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIFNldCBGUkFNRV9FTVBUWSB0byBudWxsIHRvIGRpc2FibGUgYW55IHNvcnQgb2Ygc2VwYXJhdG9yXG5GYWlsdXJlLkZSQU1FX0VNUFRZID0gJyAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSc7XG5GYWlsdXJlLkZSQU1FX1BSRUZJWCA9ICcgIGF0ICc7XG5cbi8vIEJ5IGRlZmF1bHQgd2UgZW5hYmxlIHRyYWNraW5nIGZvciBhc3luYyBzdGFjayB0cmFjZXNcbkZhaWx1cmUuVFJBQ0sgPSB0cnVlO1xuXG5cbi8vIEhlbHBlciB0byBvYnRhaW4gdGhlIGN1cnJlbnQgc3RhY2sgdHJhY2VcbnZhciBnZXRFcnJvcldpdGhTdGFjayA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyBOYXRpdmVFcnJvcjtcbn07XG4vLyBTb21lIGVuZ2luZXMgZG8gbm90IGdlbmVyYXRlIHRoZSAuc3RhY2sgcHJvcGVydHkgdW50aWwgaXQncyB0aHJvd25cbmlmICghZ2V0RXJyb3JXaXRoU3RhY2soKS5zdGFjaykge1xuICBnZXRFcnJvcldpdGhTdGFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICB0cnkgeyB0aHJvdyBuZXcgTmF0aXZlRXJyb3IgfSBjYXRjaCAoZSkgeyByZXR1cm4gZSB9O1xuICB9O1xufVxuXG4vLyBUcmltIGZyYW1lcyB1bmRlciB0aGUgcHJvdmlkZWQgc3RhY2sgZmlyc3QgZnVuY3Rpb25cbmZ1bmN0aW9uIHRyaW0oZnJhbWVzLCBzZmYpIHtcbiAgdmFyIGZuLCBuYW1lID0gc2ZmLm5hbWU7XG4gIGZvciAodmFyIGk9MDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGZuID0gZnJhbWVzW2ldLmdldEZ1bmN0aW9uKCk7XG4gICAgaWYgKGZuICYmIGZuID09PSBzZmYgfHwgbmFtZSAmJiBuYW1lID09PSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb25OYW1lKCkpIHtcbiAgICAgIHJldHVybiBmcmFtZXMuc2xpY2UoaSArIDEpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZnJhbWVzO1xufVxuXG5mdW5jdGlvbiB1bndpbmQgKGZyYW1lcykge1xuICB2YXIgcmVzdWx0ID0gW107XG5cbiAgZm9yICh2YXIgaT0wLCBmbjsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGZuID0gZnJhbWVzW2ldLmdldEZ1bmN0aW9uKCk7XG5cbiAgICBpZiAoIWZuIHx8ICFmblsnZmFpbHVyZTppZ25vcmUnXSkge1xuICAgICAgcmVzdWx0LnB1c2goZnJhbWVzW2ldKTtcbiAgICB9XG5cbiAgICBpZiAoZm4gJiYgZm5bJ2ZhaWx1cmU6ZnJhbWVzJ10pIHtcbiAgICAgIGlmIChGYWlsdXJlLkZSQU1FX0VNUFRZKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKG51bGwpO1xuICAgICAgfVxuXG4gICAgICAvLyBDYWxsIHRoZSBnZXR0ZXIgYW5kIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIHJlc3VsdCBpbiBjYXNlIHdlIGhhdmUgdG9cbiAgICAgIC8vIHVud2luZCB0aGUgc2FtZSBmdW5jdGlvbiBhbm90aGVyIHRpbWUuXG4gICAgICAvLyBUT0RPOiBNYWtlIHN1cmUga2VlcGluZyBhIHJlZmVyZW5jZSB0byB0aGUgZnJhbWVzIGRvZXNuJ3QgY3JlYXRlIGxlYWtzXG4gICAgICBpZiAodHlwZW9mIGZuWydmYWlsdXJlOmZyYW1lcyddID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBnZXR0ZXIgPSBmblsnZmFpbHVyZTpmcmFtZXMnXTtcbiAgICAgICAgZm5bJ2ZhaWx1cmU6ZnJhbWVzJ10gPSBudWxsO1xuICAgICAgICBmblsnZmFpbHVyZTpmcmFtZXMnXSA9IGdldHRlcigpO1xuICAgICAgfVxuXG4gICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHVud2luZChmblsnZmFpbHVyZTpmcmFtZXMnXSkpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gUmVjZWl2ZXIgZm9yIHRoZSBmcmFtZXMgaW4gYSAuc3RhY2sgcHJvcGVydHkgZnJvbSBjYXB0dXJlU3RhY2tUcmFjZVxudmFyIFY4RlJBTUVTID0ge307XG5cbi8vIFY4IGNvZGUgcGF0aCBmb3IgZ2VuZXJhdGluZyBhIGZyYW1lcyBnZXR0ZXJcbmZ1bmN0aW9uIG1ha2VGcmFtZXNHZXR0ZXJWOCAoc2ZmKSB7XG4gIE5hdGl2ZUVycm9yLmNhcHR1cmVTdGFja1RyYWNlKFY4RlJBTUVTLCBzZmYgfHwgbWFrZUZyYW1lc0dldHRlclY4KTtcbiAgc2ZmID0gbnVsbDtcbiAgdmFyIGZyYW1lcyA9IFY4RlJBTUVTLnN0YWNrO1xuICBWOEZSQU1FUy5zdGFjayA9IG51bGw7ICAvLyBJTVBPUlRBTlQ6IFRoaXMgaXMgbmVlZGVkIHRvIGF2b2lkIGxlYWtzISEhXG4gIHJldHVybiBmdW5jdGlvbiAoY2xlYW51cCkge1xuICAgIHZhciByZXN1bHQgPSBmcmFtZXM7XG4gICAgLy8gQ2xlYW4gdXAgY2xvc3VyZSB2YXJpYWJsZXMgdG8gaGVscCBHQ1xuICAgIGZyYW1lcyA9IG51bGw7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxuLy8gbm9uLVY4IGNvZGUgcGF0aCBmb3IgZ2VuZXJhdGluZyBhIGZyYW1lcyBnZXR0ZXJcbmZ1bmN0aW9uIG1ha2VGcmFtZXNHZXR0ZXJDb21wYXQgKHNmZikge1xuICAvLyBPYnRhaW4gYSBzdGFjayB0cmFjZSBhdCB0aGUgY3VycmVudCBwb2ludFxuICB2YXIgZXJyb3IgPSBnZXRFcnJvcldpdGhTdGFjaygpO1xuXG4gIC8vIFdhbGsgdGhlIGNhbGxlciBjaGFpbiB0byBhbm5vdGF0ZSB0aGUgc3RhY2sgd2l0aCBmdW5jdGlvbiByZWZlcmVuY2VzXG4gIC8vIEdpdmVuIHRoZSBsaW1pdGF0aW9ucyBpbXBvc2VkIGJ5IEVTNSBcInN0cmljdCBtb2RlXCIgaXQncyBub3QgcG9zc2libGVcbiAgLy8gdG8gb2J0YWluIHJlZmVyZW5jZXMgdG8gZnVuY3Rpb25zIGJleW9uZCBvbmUgdGhhdCBpcyBkZWZpbmVkIGluIHN0cmljdFxuICAvLyBtb2RlLiBBbHNvIG5vdGUgdGhhdCBhbnkga2luZCBvZiByZWN1cnNpb24gd2lsbCBtYWtlIHRoZSB3YWxrZXIgdW5hYmxlXG4gIC8vIHRvIGdvIHBhc3QgaXQuXG4gIHZhciBjYWxsZXIgPSBhcmd1bWVudHMuY2FsbGVlO1xuICB2YXIgZnVuY3Rpb25zID0gW2dldEVycm9yV2l0aFN0YWNrXTtcbiAgZm9yICh2YXIgaT0wOyBjYWxsZXIgJiYgaSA8IDEwOyBpKyspIHtcbiAgICBmdW5jdGlvbnMucHVzaChjYWxsZXIpO1xuICAgIGlmIChjYWxsZXIuY2FsbGVyID09PSBjYWxsZXIpIGJyZWFrO1xuICAgIGNhbGxlciA9IGNhbGxlci5jYWxsZXI7XG4gIH1cbiAgY2FsbGVyID0gbnVsbDtcblxuICByZXR1cm4gZnVuY3Rpb24gKGNsZWFudXApIHtcbiAgICB2YXIgZnJhbWVzID0gbnVsbDtcblxuICAgIGlmICghY2xlYW51cCkge1xuICAgICAgLy8gUGFyc2UgdGhlIHN0YWNrIHRyYWNlXG4gICAgICBmcmFtZXMgPSBFcnJvclN0YWNrUGFyc2VyLnBhcnNlKGVycm9yKTtcbiAgICAgIC8vIEF0dGFjaCBmdW5jdGlvbiByZWZlcmVuY2VzIHRvIHRoZSBmcmFtZXMgKHNraXBwaW5nIHRoZSBtYWtlciBmcmFtZXMpXG4gICAgICAvLyBhbmQgY3JlYXRpbmcgQ2FsbFNpdGUgb2JqZWN0cyBmb3IgZWFjaCBvbmUuXG4gICAgICBmb3IgKHZhciBpPTI7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZnJhbWVzW2ldLmZ1bmN0aW9uID0gZnVuY3Rpb25zW2ldO1xuICAgICAgICBmcmFtZXNbaV0gPSBuZXcgQ2FsbFNpdGUoZnJhbWVzW2ldKTtcbiAgICAgIH1cblxuICAgICAgZnJhbWVzID0gdHJpbShmcmFtZXMuc2xpY2UoMiksIHNmZik7XG4gICAgfVxuXG4gICAgLy8gQ2xlYW4gdXAgY2xvc3VyZSB2YXJpYWJsZXMgdG8gaGVscCBHQ1xuICAgIHNmZiA9IG51bGw7XG4gICAgZXJyb3IgPSBudWxsO1xuICAgIGZ1bmN0aW9ucyA9IG51bGw7XG5cbiAgICByZXR1cm4gZnJhbWVzO1xuICB9O1xufVxuXG4vLyBHZW5lcmF0ZXMgYSBnZXR0ZXIgZm9yIHRoZSBjYWxsIHNpdGUgZnJhbWVzXG4vLyBUT0RPOiBJZiB3ZSBvYnNlcnZlIGxlYWtzIHdpdGggY29tcGxleCB1c2UgY2FzZXMgKGR1ZSB0byBjbG9zdXJlIHNjb3Blcylcbi8vICAgICAgIHdlIGNhbiBnZW5lcmF0ZSBoZXJlIG91ciBjb21wYXQgQ2FsbFNpdGUgb2JqZWN0cyBzdG9yaW5nIHRoZSBmdW5jdGlvbidzXG4vLyAgICAgICBzb3VyY2UgY29kZSBpbnN0ZWFkIG9mIGFuIGFjdHVhbCByZWZlcmVuY2UgdG8gdGhlbSwgdGhhdCBzaG91bGQgaGVscFxuLy8gICAgICAgdGhlIEdDIHNpbmNlIHdlJ2xsIGJlIGp1c3Qga2VlcGluZyBsaXRlcmFscyBhcm91bmQuXG52YXIgbWFrZUZyYW1lc0dldHRlciA9IHR5cGVvZiBOYXRpdmVFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgPyBtYWtlRnJhbWVzR2V0dGVyVjhcbiAgICAgICAgICAgICAgICAgICAgIDogbWFrZUZyYW1lc0dldHRlckNvbXBhdDtcblxuXG4vLyBPdmVycmlkZSBWOCBzdGFjayB0cmFjZSBidWlsZGVyIHRvIGluamVjdCBvdXIgbG9naWNcbnZhciBvbGRQcmVwYXJlU3RhY2tUcmFjZSA9IEVycm9yLnByZXBhcmVTdGFja1RyYWNlO1xuRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoZXJyb3IsIGZyYW1lcykge1xuICAvLyBXaGVuIGNhbGxlZCBmcm9tIG1ha2VGcmFtZXNHZXR0ZXIgd2UganVzdCB3YW50IHRvIG9idGFpbiB0aGUgZnJhbWVzXG4gIGlmIChlcnJvciA9PT0gVjhGUkFNRVMpIHtcbiAgICByZXR1cm4gZnJhbWVzO1xuICB9XG5cbiAgLy8gRm9yd2FyZCB0byBhbnkgcHJldmlvdXNseSBkZWZpbmVkIGJlaGF2aW91clxuICBpZiAob2xkUHJlcGFyZVN0YWNrVHJhY2UpIHtcbiAgICByZXR1cm4gb2xkUHJlcGFyZVN0YWNrVHJhY2UuY2FsbChFcnJvciwgZXJyb3IsIGZyYW1lcyk7XG4gIH1cblxuICAvLyBFbXVsYXRlIGRlZmF1bHQgYmVoYXZpb3VyICh3aXRoIGxvbmctdHJhY2VzKVxuICByZXR1cm4gRmFpbHVyZS5wcm90b3R5cGUucHJlcGFyZVN0YWNrVHJhY2UuY2FsbChlcnJvciwgdW53aW5kKGZyYW1lcykpO1xufTtcblxuLy8gQXR0YWNoIGEgbmV3IGV4Y2x1c2lvbiBwcmVkaWNhdGUgZm9yIGZyYW1lc1xuZnVuY3Rpb24gZXhjbHVkZSAoY3RvciwgcHJlZGljYXRlKSB7XG4gIHZhciBmbiA9IHByZWRpY2F0ZTtcblxuICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICBmbiA9IGZ1bmN0aW9uIChmcmFtZSkge1xuICAgICAgcmV0dXJuIC0xICE9PSBmcmFtZS5nZXRGaWxlTmFtZSgpLmluZGV4T2YocHJlZGljYXRlKTtcbiAgICB9O1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwcmVkaWNhdGUudGVzdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGZuID0gZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgICByZXR1cm4gcHJlZGljYXRlLnRlc3QoZnJhbWUuZ2V0RmlsZU5hbWUoKSk7XG4gICAgfTtcbiAgfVxuXG4gIGN0b3IuZXhjbHVkZXMucHVzaChmbik7XG59XG5cbi8vIEV4cG9zZSB0aGUgZmlsdGVyIGluIHRoZSByb290IEZhaWx1cmUgdHlwZVxuRmFpbHVyZS5leGNsdWRlcyA9IFtdO1xuRmFpbHVyZS5leGNsdWRlID0gZnVuY3Rpb24gRmFpbHVyZV9leGNsdWRlIChwcmVkaWNhdGUpIHtcbiAgZXhjbHVkZShGYWlsdXJlLCBwcmVkaWNhdGUpO1xufTtcblxuLy8gQXR0YWNoIGEgZnJhbWVzIGdldHRlciB0byB0aGUgZnVuY3Rpb24gc28gd2UgY2FuIHJlLWNvbnN0cnVjdCBhc3luYyBzdGFja3MuXG4vL1xuLy8gTm90ZSB0aGF0IHRoaXMganVzdCBhdWdtZW50cyB0aGUgZnVuY3Rpb24gd2l0aCB0aGUgbmV3IHByb3BlcnR5LCBpdCBkb2Vzbid0XG4vLyBjcmVhdGUgYSB3cmFwcGVyIGV2ZXJ5IHRpbWUgaXQncyBjYWxsZWQsIHNvIHVzaW5nIGl0IG11bHRpcGxlIHRpbWVzIG9uIHRoZVxuLy8gc2FtZSBmdW5jdGlvbiB3aWxsIGluZGVlZCBvdmVyd3JpdGUgdGhlIHByZXZpb3VzIHRyYWNraW5nIGluZm9ybWF0aW9uLiBUaGlzXG4vLyBpcyBpbnRlbmRlZCBzaW5jZSBpdCdzIGZhc3RlciBhbmQgbW9yZSBpbXBvcnRhbnRseSBkb2Vzbid0IGJyZWFrIHNvbWUgQVBJc1xuLy8gdXNpbmcgY2FsbGJhY2sgcmVmZXJlbmNlcyB0byB1bnJlZ2lzdGVyIHRoZW0gZm9yIGluc3RhbmNlLlxuLy8gV2hlbiB5b3Ugd2FudCB0byB1c2UgdGhlIHNhbWUgZnVuY3Rpb24gd2l0aCBkaWZmZXJlbnQgdHJhY2tpbmcgaW5mb3JtYXRpb25cbi8vIGp1c3QgdXNlIEZhaWx1cmUud3JhcCgpLlxuLy9cbi8vIFRoZSB0cmFja2luZyBjYW4gYmUgZ2xvYmFsbHkgZGlzYWJsZWQgYnkgc2V0dGluZyBGYWlsdXJlLlRSQUNLIHRvIGZhbHNlXG5GYWlsdXJlLnRyYWNrID0gZnVuY3Rpb24gRmFpbHVyZV90cmFjayAoZm4sIHNmZikge1xuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgLy8gQ2xlYW4gdXAgcHJldmlvdXMgZnJhbWVzIHRvIGhlbHAgdGhlIEdDXG4gIGlmICh0eXBlb2YgZm5bJ2ZhaWx1cmU6ZnJhbWVzJ10gPT09ICdmdW5jdGlvbicpIHtcbiAgICBmblsnZmFpbHVyZTpmcmFtZXMnXSh0cnVlKTtcbiAgfVxuXG4gIGlmIChGYWlsdXJlLlRSQUNLKSB7XG4gICAgZm5bJ2ZhaWx1cmU6ZnJhbWVzJ10gPSBudWxsO1xuICAgIGZuWydmYWlsdXJlOmZyYW1lcyddID0gbWFrZUZyYW1lc0dldHRlcihzZmYgfHwgRmFpbHVyZV90cmFjayk7XG4gIH1cblxuICByZXR1cm4gZm47XG59O1xuXG4vLyBXcmFwcyB0aGUgZnVuY3Rpb24gYmVmb3JlIGFubm90YXRpbmcgaXQgd2l0aCB0cmFja2luZyBpbmZvcm1hdGlvbiwgdGhpc1xuLy8gYWxsb3dzIHRvIHRyYWNrIG11bHRpcGxlIHNjaGVkdWxsaW5ncyBvZiBhIHNpbmdsZSBmdW5jdGlvbi5cbkZhaWx1cmUud3JhcCA9IGZ1bmN0aW9uIEZhaWx1cmVfd3JhcCAoZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSBGYWlsdXJlLmlnbm9yZShmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuXG4gIHJldHVybiBGYWlsdXJlLnRyYWNrKHdyYXBwZXIsIEZhaWx1cmVfd3JhcCk7XG59O1xuXG4vLyBNYXJrIGEgZnVuY3Rpb24gdG8gYmUgaWdub3JlZCB3aGVuIGdlbmVyYXRpbmcgc3RhY2sgdHJhY2VzXG5GYWlsdXJlLmlnbm9yZSA9IGZ1bmN0aW9uIEZhaWx1cmVfaWdub3JlIChmbikge1xuICBmblsnZmFpbHVyZTppZ25vcmUnXSA9IHRydWU7XG4gIHJldHVybiBmbjtcbn07XG5cbkZhaWx1cmUuc2V0VGltZW91dCA9IGZ1bmN0aW9uIEZhaWx1cmVfc2V0VGltZW91dCAoKSB7XG4gIGFyZ3VtZW50c1swXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzWzBdLCBGYWlsdXJlX3NldFRpbWVvdXQpO1xuICByZXR1cm4gc2V0VGltZW91dC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xufTtcblxuRmFpbHVyZS5uZXh0VGljayA9IGZ1bmN0aW9uIEZhaWx1cmVfbmV4dFRpY2sgKCkge1xuICBhcmd1bWVudHNbMF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1swXSwgRmFpbHVyZV9uZXh0VGljayk7XG4gIHJldHVybiBwcm9jZXNzLm5leHRUaWNrLmFwcGx5KHByb2Nlc3MsIGFyZ3VtZW50cyk7XG59O1xuXG5GYWlsdXJlLnBhdGNoID0gZnVuY3Rpb24gRmFpbHVyZV9wYXRjaChvYmosIG5hbWUsIGlkeCkge1xuICBpZiAob2JqICYmIHR5cGVvZiBvYmpbbmFtZV0gIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ09iamVjdCBkb2VzIG5vdCBoYXZlIGEgXCInICsgbmFtZSArICdcIiBtZXRob2QnKTtcbiAgfVxuXG4gIHZhciBvcmlnaW5hbCA9IG9ialtuYW1lXTtcblxuICAvLyBXaGVuIHRoZSBleGFjdCBhcmd1bWVudCBpbmRleCBpcyBwcm92aWRlZCB1c2UgYW4gb3B0aW1pemVkIGNvZGUgcGF0aFxuICBpZiAodHlwZW9mIGlkeCA9PT0gJ251bWJlcicpIHtcblxuICAgIG9ialtuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGFyZ3VtZW50c1tpZHhdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbaWR4XSwgb2JqW25hbWVdKTtcbiAgICAgIHJldHVybiBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgLy8gT3RoZXJ3aXNlIGRldGVjdCB0aGUgZnVuY3Rpb25zIHRvIHRyYWNrIGF0IGludm9rYXRpb24gdGltZVxuICB9IGVsc2Uge1xuXG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBhcmd1bWVudHNbaV0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1tpXSwgb2JqW25hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICB9XG5cbiAgLy8gQXVnbWVudCB0aGUgd3JhcHBlciB3aXRoIGFueSBwcm9wZXJ0aWVzIGZyb20gdGhlIG9yaWdpbmFsXG4gIGZvciAodmFyIGsgaW4gb3JpZ2luYWwpIGlmIChvcmlnaW5hbC5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgIG9ialtuYW1lXVtrXSA9IG9yaWdpbmFsW2tdO1xuICB9XG5cbiAgcmV0dXJuIG9ialtuYW1lXTtcbn07XG5cbi8vIEhlbHBlciB0byBjcmVhdGUgbmV3IEZhaWx1cmUgdHlwZXNcbkZhaWx1cmUuY3JlYXRlID0gZnVuY3Rpb24gKG5hbWUsIHByb3BzKSB7XG4gIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgRmFpbHVyZSgnRXhwZWN0ZWQgYSBuYW1lIGFzIGZpcnN0IGFyZ3VtZW50Jyk7XG4gIH1cblxuICBmdW5jdGlvbiBjdG9yIChtZXNzYWdlLCBzZmYpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmFpbHVyZSkpIHtcbiAgICAgIHJldHVybiBuZXcgY3RvcihtZXNzYWdlLCBzZmYpO1xuICAgIH1cbiAgICBGYWlsdXJlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICAvLyBBdWdtZW50IGNvbnN0cnVjdG9yXG4gIGN0b3IuZXhjbHVkZXMgPSBbXTtcbiAgY3Rvci5leGNsdWRlID0gZnVuY3Rpb24gKHByZWRpY2F0ZSkge1xuICAgIGV4Y2x1ZGUoY3RvciwgcHJlZGljYXRlKTtcbiAgfTtcblxuICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRmFpbHVyZS5wcm90b3R5cGUpO1xuICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3I7XG4gIGN0b3IucHJvdG90eXBlLm5hbWUgPSBuYW1lO1xuICBpZiAodHlwZW9mIHByb3BzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY3Rvci5wcm90b3R5cGUucHJlcGFyZVN0YWNrVHJhY2UgPSBwcm9wcztcbiAgfSBlbHNlIGlmIChwcm9wcykge1xuICAgIE9iamVjdC5rZXlzKHByb3BzKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICBjdG9yLnByb3RvdHlwZVtwcm9wXSA9IHByb3A7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGN0b3I7XG59O1xuXG52YXIgYnVpbHRpbkVycm9yVHlwZXMgPSBbXG4gICdFcnJvcicsICdUeXBlRXJyb3InLCAnUmFuZ2VFcnJvcicsICdSZWZlcmVuY2VFcnJvcicsICdTeW50YXhFcnJvcicsXG4gICdFdmFsRXJyb3InLCAnVVJJRXJyb3InLCAnSW50ZXJuYWxFcnJvcidcbl07XG52YXIgYnVpbHRpbkVycm9ycyA9IHt9O1xuXG5GYWlsdXJlLmluc3RhbGwgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByb290ID0gdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgPyB3aW5kb3cgOiBnbG9iYWw7XG5cbiAgYnVpbHRpbkVycm9yVHlwZXMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIGlmIChyb290W3R5cGVdICYmICFidWlsdGluRXJyb3JzW3R5cGVdKSB7XG4gICAgICBidWlsdGluRXJyb3JzW3R5cGVdID0gcm9vdFt0eXBlXTtcbiAgICAgIHJvb3RbdHlwZV0gPSBGYWlsdXJlLmNyZWF0ZSh0eXBlKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEFsbG93IHVzYWdlOiB2YXIgRmFpbHVyZSA9IHJlcXVpcmUoJ2ZhaWx1cmUnKS5pbnN0YWxsKClcbiAgcmV0dXJuIEZhaWx1cmU7XG59O1xuXG5GYWlsdXJlLnVuaW5zdGFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgYnVpbHRpbkVycm9yVHlwZXMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIHJvb3RbdHlwZV0gPSBidWlsdGluRXJyb3JzW3R5cGVdIHx8IHJvb3RbdHlwZV07XG4gIH0pO1xufTtcblxuXG52YXIgcHJvdG8gPSBGYWlsdXJlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gRmFpbHVyZTtcblxucHJvdG8ubmFtZSA9ICdGYWlsdXJlJztcbnByb3RvLm1lc3NhZ2UgPSAnJztcblxuaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgPT09ICdmdW5jdGlvbicpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZnJhbWVzJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gVXNlIHRyaW1taW5nIGp1c3QgaW4gY2FzZSB0aGUgc2ZmIHdhcyBkZWZpbmVkIGFmdGVyIGNvbnN0cnVjdGluZ1xuICAgICAgdmFyIGZyYW1lcyA9IHVud2luZCh0cmltKHRoaXMuX2dldEZyYW1lcygpLCB0aGlzLnNmZikpO1xuXG4gICAgICAvLyBDYWNoZSBuZXh0IGFjY2Vzc2VzIHRvIHRoZSBwcm9wZXJ0eVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdmcmFtZXMnLCB7XG4gICAgICAgIHZhbHVlOiBmcmFtZXMsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgLy8gQ2xlYW4gdXAgdGhlIGdldHRlciBjbG9zdXJlXG4gICAgICB0aGlzLl9nZXRGcmFtZXMgPSBudWxsO1xuXG4gICAgICByZXR1cm4gZnJhbWVzO1xuICAgIH1cbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnc3RhY2snLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZVN0YWNrVHJhY2UoKTtcbiAgICB9XG4gIH0pO1xufVxuXG5wcm90by5nZW5lcmF0ZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBleGNsdWRlcyA9IHRoaXMuY29uc3RydWN0b3IuZXhjbHVkZXM7XG4gIHZhciBpbmNsdWRlLCBmcmFtZXMgPSBbXTtcblxuICAvLyBTcGVjaWZpYyBwcm90b3R5cGVzIGluaGVyaXQgdGhlIGV4Y2x1ZGVzIGZyb20gRmFpbHVyZVxuICBpZiAoZXhjbHVkZXMgIT09IEZhaWx1cmUuZXhjbHVkZXMpIHtcbiAgICBleGNsdWRlcy5wdXNoLmFwcGx5KGV4Y2x1ZGVzLCBGYWlsdXJlLmV4Y2x1ZGVzKTtcbiAgfVxuXG4gIC8vIEFwcGx5IGZpbHRlcmluZ1xuICBmb3IgKHZhciBpPTA7IGkgPCB0aGlzLmZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGluY2x1ZGUgPSB0cnVlO1xuICAgIGlmICh0aGlzLmZyYW1lc1tpXSkge1xuICAgICAgZm9yICh2YXIgaj0wOyBpbmNsdWRlICYmIGogPCBleGNsdWRlcy5sZW5ndGg7IGorKykge1xuICAgICAgICBpbmNsdWRlICY9ICFleGNsdWRlc1tqXS5jYWxsKHRoaXMsIHRoaXMuZnJhbWVzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgIGZyYW1lcy5wdXNoKHRoaXMuZnJhbWVzW2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcy5wcmVwYXJlU3RhY2tUcmFjZShmcmFtZXMpO1xufTtcblxucHJvdG8ucHJlcGFyZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoZnJhbWVzKSB7XG4gIHZhciBsaW5lcyA9IFt0aGlzXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGZyYW1lc1tpXSA/IEZhaWx1cmUuRlJBTUVfUFJFRklYICsgZnJhbWVzW2ldIDogRmFpbHVyZS5GUkFNRV9FTVBUWVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEZhaWx1cmU7XG4iLCJ2YXIgRmFpbHVyZSA9IHJlcXVpcmUoJy4vbGliL2ZhaWx1cmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGYWlsdXJlO1xuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcywgUmhpbm8sIGFuZCBicm93c2Vycy5cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZSgnZXJyb3Itc3RhY2stcGFyc2VyJywgWydzdGFja2ZyYW1lJ10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdzdGFja2ZyYW1lJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QuRXJyb3JTdGFja1BhcnNlciA9IGZhY3Rvcnkocm9vdC5TdGFja0ZyYW1lKTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIoU3RhY2tGcmFtZSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEVTNSBQb2x5ZmlsbHNcbiAgICAvLyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvbWFwXG4gICAgaWYgKCFBcnJheS5wcm90b3R5cGUubWFwKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgICAgICAgdmFyIE8gPSBPYmplY3QodGhpcyk7XG4gICAgICAgICAgICB2YXIgbGVuID0gTy5sZW5ndGggPj4+IDA7XG4gICAgICAgICAgICB2YXIgVDtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIFQgPSB0aGlzQXJnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgQSA9IG5ldyBBcnJheShsZW4pO1xuICAgICAgICAgICAgdmFyIGsgPSAwO1xuXG4gICAgICAgICAgICB3aGlsZSAoayA8IGxlbikge1xuICAgICAgICAgICAgICAgIHZhciBrVmFsdWUsIG1hcHBlZFZhbHVlO1xuICAgICAgICAgICAgICAgIGlmIChrIGluIE8pIHtcbiAgICAgICAgICAgICAgICAgICAga1ZhbHVlID0gT1trXTtcbiAgICAgICAgICAgICAgICAgICAgbWFwcGVkVmFsdWUgPSBjYWxsYmFjay5jYWxsKFQsIGtWYWx1ZSwgaywgTyk7XG4gICAgICAgICAgICAgICAgICAgIEFba10gPSBtYXBwZWRWYWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gQTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZmlsdGVyXG4gICAgaWYgKCFBcnJheS5wcm90b3R5cGUuZmlsdGVyKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbihjYWxsYmFjay8qLCB0aGlzQXJnKi8pIHtcbiAgICAgICAgICAgIHZhciB0ID0gT2JqZWN0KHRoaXMpO1xuICAgICAgICAgICAgdmFyIGxlbiA9IHQubGVuZ3RoID4+PiAwO1xuXG4gICAgICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgICAgICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50cy5sZW5ndGggPj0gMiA/IGFyZ3VtZW50c1sxXSA6IHZvaWQgMDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaSBpbiB0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSB0W2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWwsIGksIHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMucHVzaCh2YWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBGSVJFRk9YX1NBRkFSSV9TVEFDS19SRUdFWFAgPSAvXFxTK1xcOlxcZCsvO1xuICAgIHZhciBDSFJPTUVfSUVfU1RBQ0tfUkVHRVhQID0gL1xccythdCAvO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdpdmVuIGFuIEVycm9yIG9iamVjdCwgZXh0cmFjdCB0aGUgbW9zdCBpbmZvcm1hdGlvbiBmcm9tIGl0LlxuICAgICAgICAgKiBAcGFyYW0gZXJyb3Ige0Vycm9yfVxuICAgICAgICAgKiBAcmV0dXJuIEFycmF5W1N0YWNrRnJhbWVdXG4gICAgICAgICAqL1xuICAgICAgICBwYXJzZTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2UoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXJyb3Iuc3RhY2t0cmFjZSAhPT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIGVycm9yWydvcGVyYSNzb3VyY2Vsb2MnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9wZXJhKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3Iuc3RhY2sgJiYgZXJyb3Iuc3RhY2subWF0Y2goQ0hST01FX0lFX1NUQUNLX1JFR0VYUCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVY4T3JJRShlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yLnN0YWNrICYmIGVycm9yLnN0YWNrLm1hdGNoKEZJUkVGT1hfU0FGQVJJX1NUQUNLX1JFR0VYUCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUZGT3JTYWZhcmkoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwYXJzZSBnaXZlbiBFcnJvciBvYmplY3QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VwYXJhdGUgbGluZSBhbmQgY29sdW1uIG51bWJlcnMgZnJvbSBhIFVSTC1saWtlIHN0cmluZy5cbiAgICAgICAgICogQHBhcmFtIHVybExpa2UgU3RyaW5nXG4gICAgICAgICAqIEByZXR1cm4gQXJyYXlbU3RyaW5nXVxuICAgICAgICAgKi9cbiAgICAgICAgZXh0cmFjdExvY2F0aW9uOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRleHRyYWN0TG9jYXRpb24odXJsTGlrZSkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB1cmxMaWtlLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB2YXIgbGFzdE51bWJlciA9IGxvY2F0aW9uUGFydHMucG9wKCk7XG4gICAgICAgICAgICB2YXIgcG9zc2libGVOdW1iZXIgPSBsb2NhdGlvblBhcnRzW2xvY2F0aW9uUGFydHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAoIWlzTmFOKHBhcnNlRmxvYXQocG9zc2libGVOdW1iZXIpKSAmJiBpc0Zpbml0ZShwb3NzaWJsZU51bWJlcikpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGluZU51bWJlciA9IGxvY2F0aW9uUGFydHMucG9wKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsb2NhdGlvblBhcnRzLmpvaW4oJzonKSwgbGluZU51bWJlciwgbGFzdE51bWJlcl07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbG9jYXRpb25QYXJ0cy5qb2luKCc6JyksIGxhc3ROdW1iZXIsIHVuZGVmaW5lZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VWOE9ySUU6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlVjhPcklFKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLnNsaWNlKDEpLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBsaW5lLnJlcGxhY2UoL15cXHMrLywgJycpLnNwbGl0KC9cXHMrLykuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkucmVwbGFjZSgvW1xcKFxcKVxcc10vZywgJycpKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gKCF0b2tlbnNbMF0gfHwgdG9rZW5zWzBdID09PSAnQW5vbnltb3VzJykgPyB1bmRlZmluZWQgOiB0b2tlbnNbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgdW5kZWZpbmVkLCBsb2NhdGlvblBhcnRzWzBdLCBsb2NhdGlvblBhcnRzWzFdLCBsb2NhdGlvblBhcnRzWzJdKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlRkZPclNhZmFyaTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VGRk9yU2FmYXJpKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLmZpbHRlcihmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIWxpbmUubWF0Y2goRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQKTtcbiAgICAgICAgICAgIH0sIHRoaXMpLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBsaW5lLnNwbGl0KCdAJyk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSB0b2tlbnMuc2hpZnQoKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgdW5kZWZpbmVkLCBsb2NhdGlvblBhcnRzWzBdLCBsb2NhdGlvblBhcnRzWzFdLCBsb2NhdGlvblBhcnRzWzJdKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlT3BlcmE6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmEoZSkge1xuICAgICAgICAgICAgaWYgKCFlLnN0YWNrdHJhY2UgfHwgKGUubWVzc2FnZS5pbmRleE9mKCdcXG4nKSA+IC0xICYmXG4gICAgICAgICAgICAgICAgZS5tZXNzYWdlLnNwbGl0KCdcXG4nKS5sZW5ndGggPiBlLnN0YWNrdHJhY2Uuc3BsaXQoJ1xcbicpLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9wZXJhOShlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWUuc3RhY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9wZXJhMTAoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmExMShlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZU9wZXJhOTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYTkoZSkge1xuICAgICAgICAgICAgdmFyIGxpbmVSRSA9IC9MaW5lIChcXGQrKS4qc2NyaXB0ICg/OmluICk/KFxcUyspL2k7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBlLm1lc3NhZ2Uuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMiwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBsaW5lUkUuZXhlYyhsaW5lc1tpXSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBTdGFja0ZyYW1lKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBtYXRjaFsyXSwgbWF0Y2hbMV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VPcGVyYTEwOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhMTAoZSkge1xuICAgICAgICAgICAgdmFyIGxpbmVSRSA9IC9MaW5lIChcXGQrKS4qc2NyaXB0ICg/OmluICk/KFxcUyspKD86OiBJbiBmdW5jdGlvbiAoXFxTKykpPyQvaTtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IGUuc3RhY2t0cmFjZS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBsaW5lcy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMikge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IGxpbmVSRS5leGVjKGxpbmVzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFN0YWNrRnJhbWUobWF0Y2hbM10gfHwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIG1hdGNoWzJdLCBtYXRjaFsxXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBPcGVyYSAxMC42NSsgRXJyb3Iuc3RhY2sgdmVyeSBzaW1pbGFyIHRvIEZGL1NhZmFyaVxuICAgICAgICBwYXJzZU9wZXJhMTE6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmExMShlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLnN0YWNrLnNwbGl0KCdcXG4nKS5maWx0ZXIoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFsaW5lLm1hdGNoKEZJUkVGT1hfU0FGQVJJX1NUQUNLX1JFR0VYUCkgJiZcbiAgICAgICAgICAgICAgICAgICAgIWxpbmUubWF0Y2goL15FcnJvciBjcmVhdGVkIGF0Lyk7XG4gICAgICAgICAgICB9LCB0aGlzKS5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5zID0gbGluZS5zcGxpdCgnQCcpO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdGhpcy5leHRyYWN0TG9jYXRpb24odG9rZW5zLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25DYWxsID0gKHRva2Vucy5zaGlmdCgpIHx8ICcnKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gZnVuY3Rpb25DYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvPGFub255bW91cyBmdW5jdGlvbig6IChcXHcrKSk/Pi8sICckMicpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwoW15cXCldKlxcKS9nLCAnJykgfHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhciBhcmdzUmF3O1xuICAgICAgICAgICAgICAgIGlmIChmdW5jdGlvbkNhbGwubWF0Y2goL1xcKChbXlxcKV0qKVxcKS8pKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NSYXcgPSBmdW5jdGlvbkNhbGwucmVwbGFjZSgvXlteXFwoXStcXCgoW15cXCldKilcXCkkLywgJyQxJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gKGFyZ3NSYXcgPT09IHVuZGVmaW5lZCB8fCBhcmdzUmF3ID09PSAnW2FyZ3VtZW50cyBub3QgYXZhaWxhYmxlXScpID8gdW5kZWZpbmVkIDogYXJnc1Jhdy5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsIGFyZ3MsIGxvY2F0aW9uUGFydHNbMF0sIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0pO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xufSkpO1xuXG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgLy8gVW5pdmVyc2FsIE1vZHVsZSBEZWZpbml0aW9uIChVTUQpIHRvIHN1cHBvcnQgQU1ELCBDb21tb25KUy9Ob2RlLmpzLCBSaGlubywgYW5kIGJyb3dzZXJzLlxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LlN0YWNrRnJhbWUgPSBmYWN0b3J5KCk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGZ1bmN0aW9uIF9pc051bWJlcihuKSB7XG4gICAgICAgIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsIGFyZ3MsIGZpbGVOYW1lLCBsaW5lTnVtYmVyLCBjb2x1bW5OdW1iZXIpIHtcbiAgICAgICAgaWYgKGZ1bmN0aW9uTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEZ1bmN0aW9uTmFtZShmdW5jdGlvbk5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmdzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJncyhhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlsZU5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRGaWxlTmFtZShmaWxlTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbmVOdW1iZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRMaW5lTnVtYmVyKGxpbmVOdW1iZXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2x1bW5OdW1iZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRDb2x1bW5OdW1iZXIoY29sdW1uTnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFN0YWNrRnJhbWUucHJvdG90eXBlID0ge1xuICAgICAgICBnZXRGdW5jdGlvbk5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZ1bmN0aW9uTmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0RnVuY3Rpb25OYW1lOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdGhpcy5mdW5jdGlvbk5hbWUgPSBTdHJpbmcodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0QXJnczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXJncztcbiAgICAgICAgfSxcbiAgICAgICAgc2V0QXJnczogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodikgIT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmdzIG11c3QgYmUgYW4gQXJyYXknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYXJncyA9IHY7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gTk9URTogUHJvcGVydHkgbmFtZSBtYXkgYmUgbWlzbGVhZGluZyBhcyBpdCBpbmNsdWRlcyB0aGUgcGF0aCxcbiAgICAgICAgLy8gYnV0IGl0IHNvbWV3aGF0IG1pcnJvcnMgVjgncyBKYXZhU2NyaXB0U3RhY2tUcmFjZUFwaVxuICAgICAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L3dpa2kvSmF2YVNjcmlwdFN0YWNrVHJhY2VBcGlcbiAgICAgICAgZ2V0RmlsZU5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbGVOYW1lO1xuICAgICAgICB9LFxuICAgICAgICBzZXRGaWxlTmFtZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZU5hbWUgPSBTdHJpbmcodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TGluZU51bWJlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGluZU51bWJlcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0TGluZU51bWJlcjogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmICghX2lzTnVtYmVyKHYpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTGluZSBOdW1iZXIgbXVzdCBiZSBhIE51bWJlcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5saW5lTnVtYmVyID0gTnVtYmVyKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldENvbHVtbk51bWJlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1uTnVtYmVyO1xuICAgICAgICB9LFxuICAgICAgICBzZXRDb2x1bW5OdW1iZXI6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAoIV9pc051bWJlcih2KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbHVtbiBOdW1iZXIgbXVzdCBiZSBhIE51bWJlcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb2x1bW5OdW1iZXIgPSBOdW1iZXIodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IHRoaXMuZ2V0RnVuY3Rpb25OYW1lKCkgfHwgJ3thbm9ueW1vdXN9JztcbiAgICAgICAgICAgIHZhciBhcmdzID0gJygnICsgKHRoaXMuZ2V0QXJncygpIHx8IFtdKS5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICB2YXIgZmlsZU5hbWUgPSB0aGlzLmdldEZpbGVOYW1lKCkgPyAoJ0AnICsgdGhpcy5nZXRGaWxlTmFtZSgpKSA6ICcnO1xuICAgICAgICAgICAgdmFyIGxpbmVOdW1iZXIgPSBfaXNOdW1iZXIodGhpcy5nZXRMaW5lTnVtYmVyKCkpID8gKCc6JyArIHRoaXMuZ2V0TGluZU51bWJlcigpKSA6ICcnO1xuICAgICAgICAgICAgdmFyIGNvbHVtbk51bWJlciA9IF9pc051bWJlcih0aGlzLmdldENvbHVtbk51bWJlcigpKSA/ICgnOicgKyB0aGlzLmdldENvbHVtbk51bWJlcigpKSA6ICcnO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uTmFtZSArIGFyZ3MgKyBmaWxlTmFtZSArIGxpbmVOdW1iZXIgKyBjb2x1bW5OdW1iZXI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIFN0YWNrRnJhbWU7XG59KSk7XG4iXX0=
