module.exports = function(config) {
  config.set({
    //logLevel: 'LOG_DEBUG',

    reporters: ['progress', 'saucelabs'],

    singleRun : true,
    autoWatch : true,

    frameworks: [
      'mocha',
      'browserify'
    ],

    files: [
      'test/**/*.js'
    ],

    preprocessors: {
      'test/**/*.js': ['browserify']
    },

    browserify: {
      debug: true,
      configure: function (bro) {
        // Mocha gets included in the bundle but it breaks the build
        bro.exclude('mocha');
      }
    },

    browsers: ['Chrome'],

    customLaunchers: {
      // sl_ie_8_xp: {
      //   base: 'SauceLabs',
      //   browserName: 'internet explorer',
      //   version: '8.0',
      //   platform: 'Windows XP',
      //   "record-video": false,
      //   "record-screenshot": false
      // },
      sl_ie10: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '10.0',
        platform: 'Windows 8',
        "record-video": false,
        "record-screenshot": false
      },
      // sl_ie11: {
      //   base: 'SauceLabs',
      //   browserName: 'internet explorer',
      //   platform: 'Windows 8.1',
      //   version: '11'
      //   "record-video": false,
      //   "record-screenshot": false
      // },
      sl_ff30: {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Linux',
        "record-video": false,
        "record-screenshot": false
      },
      // sl_ios: {
      //   base: 'SauceLabs',
      //   browserName: 'iphone',
      //   platform: 'OS X 10.9',
      //   version: '7.1'
      // },
    }

  });
};
