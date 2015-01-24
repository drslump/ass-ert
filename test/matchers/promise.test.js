describe('Matchers: Promise', function () {

  require('failure').patch(global, 'it');

  var _ = require('lodash');

  var ass = require('../../');
  var Promise = require('../../lib/util').Promise;


  // Helper to make easier to factory deferreds
  function defer (value, ms) {
    var resolveFn, rejectFn;
    var p = new Promise(function (resolve, reject) {
      resolveFn = resolve;
      rejectFn = reject;
      if (value) _.delay(resolve, ms|0, value);
    });
    p.resolve = resolveFn;
    p.reject = rejectFn;
    return p;
  }

  // Create a promise inside a hook to make sure it's fully
  // resolved when the tests are executed.
  var resolvedFoo, rejectedFoo;
  beforeEach(function () {
    resolvedFoo = defer();
    resolvedFoo.resolve('foo');
    rejectedFoo = defer();
    rejectedFoo.reject('foo');
    return resolvedFoo;
  });

  // Simplify marks checking
  beforeEach(function () {
    ass.marks();
    this.currentTest.ctx.expected = 0;
  });
  afterEach(function () {
    var test = this.currentTest;
    if (test.state === 'passed') {
      ass.marks(test.ctx.expected, test.title);
    }
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

    it('should not call getters twice', function () {

      this.calls = 0;
      Object.defineProperty(this, 'then', {
        get: function () {
          this.calls += 1;
          return function () {};
        }
      });

      ass(this).promise;
      ass(this.calls).eq(1);
    });

  });

  describe('fulfilled', function () {

    it('should support done callback', function (done) {
      ass(resolvedFoo).resolves.string.notify(done).catch(done);
    });

    it('should support done callback failures', function (done) {
      this.expected = 1;
      var failure = ass.isa(ass.Error).mark.notify(done).catch(done).$;
      ass(resolvedFoo).resolves.number.notify(done).catch(failure);
    });

    it('should check already resolved promises', function () {
      this.expected = 1;
      return ass(resolvedFoo).resolves.eq('foo').size.eq(3).mark;
    });

    it('should check just resolved promises', function () {
      var p = defer();
      p.resolve('foo');

      this.expected = 1;
      return ass(p).resolves.eq('foo').size.eq(3).mark;
    });

    it('should check pending promises', function () {
      var p = defer('foo', 1);

      this.expected = 1;
      return ass(p).resolves.eq('foo').size.eq(3).mark;
    });

    it('should support negation', function () {
      var p = defer('foo');

      this.expected = 1;
      return ass(p).not.resolves.mark.eq('BOO');
    });

    it('should support all quantifier', function () {
      var p1 = defer('foo', 1), p2 = defer('FOO');

      this.expected = 2;
      return ass([p1, p2])
        .all.resolves
        .mark
        .string.method('toLowerCase').eq('foo');
    });

    it('should support some quantifier', function () {
      var p1 = defer('foo', 1), p2 = defer('bar');
      this.expected = 2;
      return ass([p1, p2])
        .some.resolves
        .mark
        .string.eq('foo');
    });

    it('should support none quantifier', function () {
      var promises = [defer('foo', 1), defer('bar')];
      this.expected = promises.length;
      return ass(promises)
        .none.resolves
        .mark
        .string.eq('qux');
    });

    it('should support AND combinator', function () {
      this.expected = 3;
      return ass(resolvedFoo).and(
        ass.promise.mark,
        ass.resolves.string.mark,
        ass.resolves.equal('foo').mark
      );
    });

    it('should support OR combinator', function () {
      this.expected = 1;
      return ass(resolvedFoo).or(
        ass.string.mark,
        ass.resolves.equal('bar').mark,
        ass.resolves.string.mark
      );
    });

  });

  describe('become', function () {

    it('should work with resolved promises', function () {
      return ass(resolvedFoo).become('foo');
    });

    it('should work with just resolved promises', function () {
      var promise = defer();
      promise.resolve('foo');
      return ass(promise).become('foo');
    });

    it('should work with pending promises', function () {
      var promise = defer();
      _.delay(promise.resolve, 1, 'foo');
      return ass(promise).become('foo');
    });

    it('should fail if not equal', function (done) {
      ass(resolvedFoo).become('bar').catch(function (err) {
        ass(err).isa(ass.Error).notify(done);
      });
    });

    it('should fail with rejected promises', function (done) {
      ass(rejectedFoo).become('foo').catch(function (err) {
        ass(err).isa(ass.Error).notify(done);
      });
    });

    it('should continue resolving', function () {
      this.expected = 1;
      return ass(resolvedFoo).become('foo').string.mark;
    });

  });

  describe('rejected', function () {

    it('should check already rejected promises', function () {
      return ass(rejectedFoo).rejects.eq('foo').size.eq(3);
    });

    it('should check just resolved promises', function () {
      var promise = defer();
      promise.reject('foo');

      return ass(promise).rejects.eq('foo').size.eq(3);
    });

    it('should check pending promises', function () {
      var promise = defer();
      _.delay(promise.reject, 1, 'foo');

      return ass(promise).rejects.eq('foo').size.eq(3);
    });

  });

});
