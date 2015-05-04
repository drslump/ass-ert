module.exports = function(config) {
  config.set({
    //logLevel: 'LOG_DEBUG',

    reporters: ['progress', 'saucelabs'],

    singleRun : true,
    autoWatch : true,

    frameworks: ['mocha', 'browserify'],

    files: [
      'node_modules/sinon/pkg/sinon.js',
      'test/**/*.js'
    ],

    preprocessors: {
      'test/**/*.js': ['browserify']
    },

    browserify: {
      debug: true,
      configure: function (bro) {
        // Mocha is already included by Karma
        bro.exclude('mocha');
        // We include Sinon as a global to test the patching mechanism
        bro.exclude('sinon');
      }
    },

    browsers: ['Chrome', 'Firefox', 'sl_ie11', 'sl_ff30', 'sl_ios'],

    customLaunchers: {
      sl_ie8: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '8.0',
        platform: 'Windows XP',
        "record-video": false,
        "record-screenshot": false
      },
      sl_ie10: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '10.0',
        platform: 'Windows 8',
        "record-video": false,
        "record-screenshot": false
      },
      sl_ie11: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8.1',
        version: '11',
        "record-video": false,
        "record-screenshot": false
      },
      sl_ff30: {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Linux',
        "record-video": false,
        "record-screenshot": false
      },
      sl_ios: {
        base: 'SauceLabs',
        browserName: 'iphone',
        platform: 'OS X 10.9',
        version: '7.1'
      },
    }

  });
};
