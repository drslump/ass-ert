//

var Chain = require('./chain');

// Installs the typical .should property on the root Object.
// You can install under any name of your choosing by giving it
// as argument.
// Basically borrowed from the Chai project:
//  Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
//  https://github.com/chaijs/chai/blob/master/lib/chai/interface/should.js
function should (name) {

  name = name || 'should';

  // modify Object.prototype to have `should`
  Object.defineProperty(Object.prototype, name, {
    get: function () {
      if (this instanceof String || this instanceof Number) {
        return new Chain(this.constructor(this));
      } else if (this instanceof Boolean) {
        return new Chain(this == true);
      }
      return new Chain(this);
    },
    set: function (value) {
      // Allow: global.should = require('ass').should()
      Object.defineProperty(this, name, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    },
    configurable: false,
    enumerable: false
  });

}


module.exports = should;