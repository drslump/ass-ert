describe('Matchers: lodash', function () {

  var _ = require('lodash');
  var ass = require('../../');

  var data = [{
    key: 'foo',
    nested: {
      subkey: 'foo1'
    }
  }, {
    key: 'bar',
    nested: {}
  }];


  describe('_.isEqual', function () {

    it.skip('sanity', function () {

    });

    it('should support chains', function () {
      ass.ok(
        _.isEqual(data[0], {key: ass.string, nested: ass.object })
      );
      ass.ok(
        _.isEqual(data[1], {key: ass.string.eq('bar'), nested: {} })
      );

      ass.ko(
        _.isEqual(data[0], {key: ass.string.eq('qux'), nested: ass.object })
      );
      ass.ko(
        _.isEqual(data[0], {key: 'foo'})  // missing prop.
      );
    });

  });

  describe('_.createCallback', function () {

    it.skip('sanity', function () {
      // prop names, functions and where style
    });

    it.skip('should support chains', function () {

    });

  });


  describe('.where', function () {

    it('should support plain values', function () {
      ass(data).where({key: 'foo'}).size.eq(1);
    });

    it('should support expression chains', function () {
      ass(data).where({key: ass.string}).size.eq(2);
    });

  });



});