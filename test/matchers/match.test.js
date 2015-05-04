describe('Matchers: match', function () {

  require('failure').patch(global, 'it');

  var ass = require('../../');

  describe('regexp', function () {
    var subject = 'foo-bar-baz';

    it('should match regexp', function () {
      ass(subject).match(/-bar-/);
    });

    it.skip('should produce a nice failure');
  });

  describe('function', function () {
    var subject = 'foo-bar-baz';

    it('should match with user provided function', function () {
      ass(subject).match(function (v) {
        return v.split('-').length === 3;
      });
    });

    it.skip('should produce a nice failure');
  });

  describe('test method', function () {
    var subject = 'foo-bar-baz';

    it('should match with an object exposing a test function', function () {
      var tester = {test: function (v) { return v === subject; }};
      ass(subject).match(tester);
    });

    it('should match with sinon', function () {
      var sinon = global.sinon || require('sinon');
      ass(subject).match(sinon.match.string);
    });

    it.skip('should produce a nice failure');
  });

  describe('objects', function () {

    var subject = {foo: 'foo', bar: 'bar', baz: 'baz'};

    it('should support multiple props', function () {
      ass(subject).match({
        foo: 'foo',
        bar: 'bar'
      });
    });

    it('should fail on missing keys', function () {
      ass(function () {
        ass(subject).match({
          foo: 'foo',
          qux: 'qux'
        });
      }).throws(ass.Error);
    });

    it.skip('should produce a nice failure');
  });

  describe('arrays', function () {
    var subject = ['foo', 'bar', 'baz'];

    it('should support same length', function () {
      ass(subject).match([
        'foo',
        ass.string,
        'baz'
      ]);
    });

    it('should match start of', function () {
      ass(subject).match([
        ass.string.eq('foo')
      ]);
    });

    it('should support undefined', function () {
      ass(subject).match([, ass.string.eq('bar')]);
    });

  });

});