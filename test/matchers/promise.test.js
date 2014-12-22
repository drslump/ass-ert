describe('Promise', function () {

  var ass = require('../../');

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

  describe('fulfilled', function () {

    it('should check already resolved promises', function () {
      return ass(resolvedFoo).resolves.eq('foo').size.eq(3);
    });

    it('should check just resolved promises', function () {
      var d = defer();
      d.resolve('foo');

      return ass(d.promise).resolves.eq('foo').size.eq(3);
    });

    it('should check non yet resolved promises', function () {
      var d = defer();
      setTimeout(d.resolve.bind(d, 'foo'), 25);

      return ass(d.promise).resolves.eq('foo').size.eq(3);
    });
  });

  describe('unfulfilled', function () {

    it('should check already rejected promises', function () {
      return ass(rejectedFoo).rejects.eq('foo').size.eq(3);
    });

    it('should check just resolved promises', function () {
      var d = defer();
      d.reject('foo');

      return ass(d.promise).rejects.eq('foo').size.eq(3);
    });

    it('should check non yet resolved promises', function () {
      var d = defer();
      setTimeout(d.reject.bind(d, 'foo'), 25);

      return ass(d.promise).rejects.eq('foo').size.eq(3);
    });

  });


});
