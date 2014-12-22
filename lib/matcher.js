// The Matcher object is a descriptor for the matching logic
// but cannot be used directly.

var Expectation = require('./expectation');


function Matcher (name, descriptor) {

  // Shortcut for simple test functions
  if (typeof descriptor === 'function') {
    descriptor = {test: descriptor};
  }

  this.name = name;

  if (Array.isArray(descriptor.help)) {
    this.help = descriptor.help.join('\n');
  } else {
    this.help = descriptor.help || 'Not available';
  }

  this.desc = descriptor.desc !== undefined
            ? descriptor.desc
            : this.name

  this.fail = descriptor.fail || 'was ${ actual }';

  this.test = descriptor.test || function (actual) { return false; }

  this.arity = descriptor.arity !== undefined
             ? descriptor.arity
             : this.test.length;
};

Matcher.prototype = Object.create(null);
Matcher.prototype.constructor = Matcher;

Matcher.prototype.clone = function () {
  return new this.constructor(this.name, {
    help: this.help,
    desc: this.desc,
    fail: this.fail,
    test: this.test
  });
};

// Factory for Expectation
Matcher.prototype.expectation = function () {
  var args = Array.prototype.slice.call(arguments);
  return new Expectation(this, args);
};

Matcher.prototype.toString = function () {
  return '<Ass.Matcher ' + this.name + '>';
};


module.exports = Matcher;