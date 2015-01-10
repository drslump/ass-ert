describe('Matchers: typeof', function () {

  require('Failure').patch(global, 'it');
  
  var ass = require('../../');

  it('should detect the correct type', function () {
    ass({}).typeof('object');
    ass(null).typeof('object');
    ass([]).typeof('object');
    ass(1).typeof('number');
    ass(parseInt('foo')).typeof('number');
    ass('foo').typeof('string');
    ass(true).typeof('boolean');
    ass(it).typeof('function');
  });

  it('numbers', function () {
    ass(1).number;
    ass(0.1).number;
  });

  it('NaN is not a number', function () {
    var nan = parseInt('foo');
    ass(nan).not.number;
    ass(nan).NaN;
  });

  it('strings', function () {
    ass('foo').string;
    ass(new String('foo')).string;
  });

  it('booleans', function () {
    ass(true).bool.true;
    ass(false).bool.false;
    ass(new Boolean(true)).bool.true;
  });

  it('arrays', function () {
    ass([]).array;
    ass(new Array).array;
    ass(arguments).not.array;
  });

  it('functions', function () {
    ass(it).function;
    ass(new Function).function;
  });

  it('object', function () {
    ass({}).object;
    ass({}).plain;
    ass(this).object;
    ass(this).not.plain;
  });

});
