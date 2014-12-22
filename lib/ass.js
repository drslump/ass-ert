var _ = require('lodash');

var Chain = require('./chain');
var Matcher = require('./matcher');
var AssError = require('./error');
var util = require('./util');

var defProp = Object.defineProperty.bind(Object);


// Public interface
function ass (value) {
  return new Chain(value);
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

// Resets or verifies the number of marks so far
ass.marks = function (expected, desc) {
  if (typeof expected === 'undefined') {
    expected = ass.marks.counter;
    ass.marks.counter = 0;
    return expected;  // return back how many there were
  }

  ass.desc('ass.marks').eq(expected).assert(ass.marks.counter);
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

    matcher = new Matcher(name, matcher)
  }

  // Keep the matcher around for ass.help
  ass.matchers.push(matcher);

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
  prop[fnKey] = function () {
    // TODO: Verify the arity of the matcher versus the call
    var exp = matcher.expectation.apply(matcher, arguments);
    this.expectations.push(exp);
    // TODO: Avoid repeating assertions for every new one when we have an initial value
    return this.assert(this.value);
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

  // Create a pass-thru version by prefixing the name with the dollar sign.
  // Calling this will apply the verification but return always the same
  // value if it a failure is not raised.
  defProp(ass, '$' + name, {
    value: function (value) {
      var context = new Chain(value);
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


module.exports = ass;
