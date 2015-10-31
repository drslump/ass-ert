var _ = require('lodash');

// Get the native Promise or a shim
exports.Promise = global.Promise || require('es6-promise').Promise;


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

  // Check if Karma is being used and has defined the colors
  var karma = global.__karma__;
  if (karma && karma.config && typeof karma.config.colors !== 'undefined') {
    return karma.config.colors;
  }

  // Check if mocha is around and verify against its configuration
  var Mocha = global.Mocha;
  if (Mocha === undefined && require.resolve && require.resolve('mocha')) {
    Mocha = require('mocha');
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
  } else if (_.isRegExp(v)) {
    value = v.toString();
  } else if (_.isFunction(v)) {
    if (v.displayName) {
      value = v.displayName + '()';
    } else if (v.name) {
      value = v.name + '()';
    } else {
      value = '<function>';
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
  return _.assign(new create(), values || {});
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
