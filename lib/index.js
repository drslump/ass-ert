// TODO: Emulate if not available?
var defprop = Object.defineProperty.bind(Object);

function Ass (value) {
  if (!(this instanceof Ass)) {
    throw new Error('Ass constructor called without new!');
  }

  // List of [ name, matcherFn, [args...] ]
  defprop(this, '_chain', {
    value: [],
    enumerable: false,
    configurable: false,
    writable: false
  });

  // Custom description
  defprop(this, '_desc', {
    value: null,
    enumerable: false,
    configurable: false,
    writable: false
  });

  defprop(this, 'value', {
    value: arguments.length > 0 ? value : this.__GUARD__,
    enumerable: false,
    configurable: false,
    writable: false
  });
}

Ass.prototype = Object.create(null);
Ass.prototype.constructor = Ass;

// Guard value to detect valueless matchers
Ass.prototype.__GUARD__ = {
  valueOf: function () {
    return undefined;
  },
  toString: function () {
    return '{{valueless}}';
  }
};

// Throw an assertion error
Ass.prototype.fail = function (msg) {
  throw new Ass.Error(msg || 'failed');
};

// Fork the current matcher with a new value and an
// optional new resolver
Ass.prototype.fork = function (value, resolver) {
  var obj = new Ass(value);
  // Chain the resolver with the current one
  if (resolver) {
    obj.resolver = resolver.bind(obj, this.resolver.bind(this));
  }
  return obj;
};

// Default resolver to apply matchers over the subject value
// TODO: "assert" may sound better than "resolver" since we also have "test"
Ass.prototype.resolver = function (actual) {
  // Just ignore if the actual value is not valid yet
  if (actual === this.__GUARD__) return this;

  var proxy = this;
  this._chain.forEach(function (op) {
    // Unwrap [matcher, [args...]] structure
    var matcher = op[1];
    var args = [actual];
    args.push.apply(args, op[2]);

    var result = matcher.apply(proxy, args);
    if (typeof result !== undefined) {
      proxy = result;
    }
  });

  return proxy;
};

// Returns a bool (Sinon API compatibility)
Ass.prototype.test = function (actual) {
  try {
    this.resolver(actual);
    return true;
  } catch (e) {
    if (e instanceof Ass.Error) {
      return false;
    }
    // Try to support other matcher libraries
    if (e.name && /assert/i.test(e.name)) {
      return false;
    }

    // Raise again unexpected errors
    throw e;
  }
};

// Assign a custom description for the matcher
Ass.prototype.desc = function (desc) {
  this._desc = desc;
  return this;
};

Ass.prototype.valueOf = function () {
  return this.value;
};

Ass.prototype.toString = function () {
  return '<Ass ' + this.value + '>';
};


Ass.Error = function Error (message) {
  this.message = message;
};
Ass.Error.prototype = Object.create(Error.prototype);
Ass.Error.prototype.name = 'AssError';


// Public interface
function ass (value) {
  return new Ass(value);
}

ass.ok = function (message, cond) {
  if (arguments.length === 1) {
    cond = message;
    message = null;
  }
  return ass(cond, message || 'expected a truish value').equal(true);
};

ass.ko = function (message, cond) {
  if (arguments.length === 1) {
    cond = message;
    message = null;
  }
  return ass.ok('expected a falsy value', !cond);
};


// Helper to register new matchers in the registry
ass.register = function (name, matcherFn) {
  if (typeof name === 'object') {
    Object.keys(name).forEach(function (key) {
      ass.register(key, name[key]);
    });
    return;
  }

  // Matcher functions with a single argument are getters
  var fnKey = matcherFn.length < 2 ? 'get' : 'value';
  var prop = {
    configurable: false,
    enumerable: true
  };
  if (fnKey === 'value') {
    prop.writable = false;
  }

  // Augment the Ass prototype
  prop[fnKey] = function () {
    var args = Array.prototype.slice.call(arguments);
    this._chain.push([ name, matcherFn, args ]);
    return this.resolver(this.value);
  };

  defprop(Ass.prototype, name, prop);

  // Augment the static interface
  prop[fnKey] = function () {
    var match = new Ass();

    if (fnKey === 'get') {
      return match[name];
    }

    return match[name].apply(match, arguments);
  };

  defprop(ass, name, prop);

  // Create a pass-thru version by prefixing the name with the dollar sign.
  // Calling this will apply the verification but return always the same
  // value if it a failure is not raised.
  defprop(ass, '$' + name, {
    value: function (value) {
      var context = new Ass(value);
      var result;
      if (fnKey === 'get') {
        result = context[name];
      } else {
        var args = Array.prototype.slice.call(arguments, 1);
        result = context[name].apply(context, args);
      }
      return result.valueOf();
    }
  });

};


// Try to generate a hamcrest matcher that makes sense based on
// a simple matches function and its name
ass.factory = function (name, matcherFn) {
  // Wrap a whole bunch
  if (typeof name === 'object') {
    var data = {};
    return Object.keys(name).map(function (key) {
      return ass.factory(key, name[key]);
    });
  }

  function wrapper (expected) {
    var matcher = {};

    matcher.matches = matcherFn;

    matcher.describeTo = function (description) {
      description.append(name);
      if (matcherFn.length > 1) {
        if (expected !== null && typeof expected === 'object') {
          description.appendDescriptionOf(expected);
        } else {
          description.appendLiteral(expected);
        }
      }
    };

    return new JsHamcrest.SimpleMatcher(matcher);
  }

  return wrapper;
}


// Set of default matchers
ass.register({
  // Just allow anything :)
  any: function (actual) {
    return this;
  },
  // Anything that isn't null or undefined
  defined: function (actual) {
    if (actual == null) {
      this.fail('expected a value but was null or undefined');
    }
  },
  // Check if the value is empty
  empty: function (actual) {
    if (actual != null && actual.length > 0) {
      this.fail('expected an empty value but got ', actual);
    }
  },
  nonEmpty: function (actual) {
    if (actual == null || actual.length === 0) {
      this.fail('expected a non empty value but got ', actual);
    }
  },
  truthy: function (actual) {
    if (!actual) this.fail('expected truthy value');
  },
  falsy: function (actual) {
    if (actual) this.fail('expected falsy value');
  },


  and: function () {
    // TODO: Hamcrest CombinableMatcher.and (allOf)
  },
  or: function () {
    // TODO: Hamcrest CombinableMatcher.or (anyOf)
  },

  // Negation
  not: function (actual) {
    // TODO: Negate the matcher
    return this.fork(actual, function (resolver, value) {
      try {
        resolver(value);
      } catch (e) {
        return;
      }
      this.fail('Expected to not succeed');
    });
  },

  // Quantifiers
  every: function (actual) {
    // TODO: Apply the remaining matchers for each item in value
    return this.fork(actual, function (resolver, value) {
      value.forEach(function (v) {
        try {
          resolver(v);
        } catch (e) {
          this.fail('Expected all to succeed');
        }
      }.bind(this));
    });
  },
  some: function (actual) {
    // TODO: Apply the remaining matchers for each item in value
    return this.fork(actual, function (resolver, value) {
      var counter = value.length;
      value.forEach(function (v) {
        try {
          resolver(v);
        } catch (e) {
          counter--;
        }
      });

      if (counter === 0) {
        this.fail('Expected at least one to succeed');
      }
    });
  },
  none: function (actual) {
    // TODO: Apply the remaining matchers for each item in value
    return this.fork(actual, function (resolver, value) {
      value.forEach(function (v) {
        try {
          resolver(value);
          this.fail('Expected none to succeed');
        } catch (e) {
        }
      }.bind(this));
    });
  },


  // Promises
  // TODO: How can we support test runners consuming promises if the name
  //       here is "then"? The only solution seems to be using "resolves"/"rejects"
  // TODO: The current design seems to work for unresolved promises but
  //       when the promise is already resolved (and they are sync like in tests)
  //       will the matchers attached to the fork be evaluated?
  then: function (actual) {
    if (!actual || typeof actual.then !== 'function') {
      this.fail('expected a promise');
    }

    // Let's create a valueless fork
    var fork = this.fork(this.__GUARD__);

    actual.then(function (value) {
      // Now resolve any other matchers in the fork
      fork.resolver(value);
    }, function (error) {
      fork.fail('expected a resolved promise but it was rejected');
    });

    return fork;
  },
  catch: function (actual, expected) {
    if (!actual || typeof actual.then !== 'function') {
      this.fail('expected a promise');
    }

    // Let's create a valueless fork
    var fork = this.fork(this.__GUARD__);

    actual.then(function (value) {
      this.fail('expected a rejected promise but it was resolved');
    }, function () {
      // Now resolve any other matchers in the fork
      fork.resolver(value);
    });

    return fork;
  },

  equal: function (actual, expected) {
    if (value != expected) {
      this.fail('expected <' + value + '> to equal <' + expected + '>');
    }
  },
  typeof: function (actual, expected) {
    if (typeof actual !== expected) {
      this.fail('expected type ' + expected + ' but got ' + typeof(actual));
    }
  },
  number: function (actual) {
    this.typeof('number');
  },
  bool: function (actual) {
    this.typeof('boolean');
  },
  string: function (actual) {
    this.typeof('string')
  },
  object: function (actual) {
    this.typeof('object');
  },
  array: function (actual) {
    if (!Array.isArray(actual)) this.fail('expected Array but got ' + actual);
  },
  null: function (actual) {
    if (actual !== null) this.fail('expected null but got ' + actual);
  },
  NaN: function (actual) {
    if (!isNaN(actual)) this.fail('expected NaN but got ' + actual);
  },
  true: function (actual) {
    if (actual !== true) this.fail('expected true');
  },
  false: function (actual) {
    if (actual !== false) this.fail('expected false');
  },
  // Dumps whatever value it receives using console
  log: function (actual) {
    console.log('[DUMP]', actual);
  },
  // Triggers the interactive debugger
  debugger: function (actual) {
    debugger;
  },
  // Call argument function with the current value
  fn: function (actual, fn) {
    var result = fn(actual);
    if (typeof result !== undefined) {
      return this.fork(result);
    }
  },
  // Mutates the subject
  len: function (actual) {
    if (!actual || typeof actual.length !== 'number') {
      this.fail('expected to get the length but got ' + actual);
    }
    return this.fork(
      actual.length
    );
  },
  keys: function (actual) {
    return this.fork(
      Object.keys(actual)
    );
  },
  values: function (actual) {
    return this.fork(
      Object.keys(actual).map(function (key) { return obj[key]; })
    );
  },
  filter: function (actual, fn) {
    return this.fork(
      actual.filter(fn)
    );
  }

});

// Mostly designed for underscore, allows to easily register a bunch of
//   ass.import(_, ['pluck', 'compact', 'first'])
ass.import = function (_, keys) {
  if (!keys) {
    keys = Object.keys(_);
  } else if (typeof keys === 'string') {
    keys = [keys];
  }
  keys.forEach(function (key) {
    ass.register(key, function () {
      return this.fork(_[key].apply(_, arguments));
    });
  });
};
