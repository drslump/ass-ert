describe('Promise', function () {

  var ass = require('../../');
  var _ = require('lodash');

  var Promise = require('es6-promise').Promise;

  // Helper to make easier to factory deferreds
  function defer () {
    var d = {};
    d.promise = new Promise(function (resolve, reject) {
      d.resolve = resolve;
      d.reject = reject;
    });
    return d;
  }

  // Create a promise inside a hook to make sure it's fully
  // resolved when the tests are executed.
  var resolvedFoo, rejectedFoo;
  beforeEach(function () {
    var d1 = defer(), d2 = defer();
    d1.resolve('foo');
    resolvedFoo = d1.promise;
    d2.reject('foo');
    rejectedFoo = d2.promise;
    return resolvedFoo;
  });

  describe('type', function () {

    it('should detect a promise', function () {
      ass(resolvedFoo).promise;
      ass(rejectedFoo).promise;
      ass({then: function() {}}).promise;
    });

    it('should be clever on the detection', function () {
      ass({then: true}).not.promise;
      ass({then: 'foo'}).not.promise;
      ass({then: null}).not.promise;
    });

  });

  describe('fulfilled', function () {

    it('should check already resolved promises', function () {
      return ass(resolvedFoo).resolves.eq('foo').size.eq(3);
    });

    it('should check just resolved promises', function () {
      var d = defer();
      d.resolve('foo');

      return ass(d.promise).resolves.eq('foo').size.eq(3);
    });

    it('should check pending promises', function () {
      var d = defer();
      setTimeout(_.bind(d.resolve, d, 'foo'), 25);

      return ass(d.promise).resolves.eq('foo').size.eq(3);
    });
  });

  describe('rejected', function () {

    it('should check already rejected promises', function () {
      return ass(rejectedFoo).rejects.eq('foo').size.eq(3);
    });

    it('should check just resolved promises', function () {
      var d = defer();
      d.reject('foo');

      return ass(d.promise).rejects.eq('foo').size.eq(3);
    });

    it('should check pending promises', function () {
      var d = defer();
      setTimeout(_.bind(d.reject, d, 'foo'), 25);

      return ass(d.promise).rejects.eq('foo').size.eq(3);
    });

  });


});
