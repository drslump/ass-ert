describe('Matchers: has', function () {

  require('failure').patch(global, 'it');

  var ass = require('../../');

  it('should support values on an array', function () {
    var subject = [1,5,8];
    ass(subject).has(1);
    ass(subject).has(5);
    ass(subject).has(8);
    ass(subject).not.has(9);
  });

  it('should support matchers on an array', function () {
    ass(['foo', 'bar', 10]).has(ass.string);
  });

  it('should support arbitrary expected arguments', function () {
    var subject = [1,5,8,'foo'];
    ass(subject).has(1, 5);
    ass(subject).not.has(1, 3, 5);
    ass(subject).has(1, ass.number, ass.string);
    ass(subject).not.has(ass.string, ass.null);
  });

  it('should support sub string matches', function () {
    ass('foobarbaz').has('foo');
    ass('foobarbaz').has('bar');
    ass('foobarbaz').has('baz');
  });

  it('should support partial object matches', function () {
    var subject = {foo: 'foo', bar: 'bar', baz: 'baz'};
    ass(subject).has({foo: 'foo'});
    ass(subject).has({bar: ass.string});
    ass(subject).not.has({baz: ass.number});
    ass(subject).not.has({qux: ass.any});
  });

  it.skip('should produce a nice failure');
});
