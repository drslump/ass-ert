describe('Matchers: lodash integration', function () {

  require('failure').patch(global, 'it');

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

  describe('.pluck', function () {

    it('should support lists of objects', function () {
      ass(data).pluck('key').eq(['foo', 'bar']);
    });

  });

  describe('.invoke', function () {

    it('should support simple calls', function () {
      ass(['foo', 'bar']).invoke('toUpperCase').eq(['FOO', 'BAR']);
    });

    it('should support calls with arguments', function () {
      ass([10, 15]).invoke('toString', 16).eq(['a', 'f']);
    });

  });

  describe('.min', function () {

      it('should provide the min value of a collection', function () {
        ass([10,30,1]).min.eq(1);
      });

  });

  describe('.max', function () {

    it('should provide the max value of a collection', function () {
      ass([10,30,1]).max.eq(30);
    });

  });

  describe('.first', function () {

    it('should provide the first value of a collection', function () {
      ass([10,30,1]).first.eq(10);
    });

  });

  describe('.last', function () {

    it('should provide the last value of a collection', function () {
      ass([10,30,1]).last.eq(1);
    });

  });

  describe('.rest', function () {

    it('should provide the rest of a collection', function () {
      ass([10,30,1]).rest.eq([30, 1]);
    });

  });

  describe('.sort', function () {

    it('should sort an array of numbers', function () {
      ass([10,30,1]).sort().eq([1,10,30]);
    });

    it('should sort an array of strings by an expression', function () {
      ass(['abc', 'a', 'ab']).sort(ass.size).eq(['a', 'ab', 'abc']);
    });

  });


});
