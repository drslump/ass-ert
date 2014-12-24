// Register the default matchers
require('./lib/matchers/core');
require('./lib/matchers/quantifiers');
require('./lib/matchers/promise');

module.exports = require('./lib/ass.js');
