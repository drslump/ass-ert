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
