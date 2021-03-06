describe('Matchers: strings', function () {

  require('failure').patch(global, 'it');

  var ass = require('../../');

  it('should equal', function () {
    ass('foo').equal('foo');
    ass('foo').not.equal('bar');
    ass('foo').eq('foo');
    ass('foo').not.eq('bar');
  });

  it('should work as a collection', function () {
    ass('abc').index(1).equal('b');
    ass('abc').invoke('toUpperCase').index(1).equal('B');
  });

  it('should have a size', function () {
    ass('foo').size.eq(3);
  });

  it('should match', function () {
    ass('abc123').match(/\d$/);
    ass('abc').not.match(/\d/);
    ass('abc').match(function foo(v) {
      return v.indexOf('a') >= 0;
    });
    ass('abc').match(ass.string);
  });

});
