var Failure = require('failure');

// Make sure tracking is enabled
Failure.TRACK = true;
// Customize the empty frame just for fun
Failure.FRAME_EMPTY = '  ··························'

// Filter out mocha and node internals
Failure.exclude(/mocha/);
Failure.exclude(/^(node|module|timers)\.js$/);
