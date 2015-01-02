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

    it('sanity', function () {
      ass.ok( _.isEqual('foo', 'foo') );
      ass.ok( _.isEqual(true, true) );
      ass.ok( _.isEqual([10], [10]) );
      ass.ok( _.isEqual({foo: 'foo'}, {foo: 'foo'}) );

      ass.ko( _.isEqual('foo', 'bar') );
      ass.ko( _.isEqual(true, false) );
      ass.ko( _.isEqual([10], [20]) );
      ass.ko( _.isEqual({foo: 'foo'}, {foo: 'bar'}) );
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

    it('sanity', function () {
      ass(
        _.pluck(data, 'key')
      ).eql( ['foo', 'bar'] );

      ass(
        _.filter(data, {key: 'bar'})
      ).at(0).is(data[1]);

      ass(
        _.filter(data, function (x) { return x.key === 'bar'; })
      ).at(0).is(data[1]);
    });

    it('should support chains', function () {
      ass(
        _.filter(data, ass.prop('key').eq('bar'))
      ).at(0).is(data[1]);
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
