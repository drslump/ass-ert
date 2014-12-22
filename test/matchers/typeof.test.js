describe('Matchers: typeof', function () {

  var ass = require('../../');

  it('should detect the correct type', function () {
    ass({}).typeof('object');
    ass(null).typeof('object');
    ass([]).typeof('object');
    ass(1).typeof('number');
    ass(parseInt('foo')).typeof('number');
    ass('foo').typeof('string');
    ass(true).typeof('boolean');
  });

  it('numbers', function () {
    ass(1).number;
    ass(0.1).number;
  });

  it('NaN is not a number', function () {
    ass(parseInt('foo')).not.number;
  });

  it('strings', function () {
    ass('foo').string;
    ass(new String('foo')).string;
  });

  it('booleans', function () {
    ass(true).bool.true;
    ass(false).bool.false;
  });

  it('arrays', function () {
    ass([]).array;
    ass(arguments).not.array;
  });

});