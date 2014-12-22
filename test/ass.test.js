describe('ass', function () {

  var ass = require('../');
  var ä = ass;  // used to tell apart assertions

  describe('factory', function () {

    it('should return a chain when called', function () {
      ä(ass()).isa(ass.Chain);
    });

    it('should return an uninitialized chain when no arguments', function () {
      var obj = ass();
      ä(obj.value).is(obj.__GUARD__);
    });

    it('should return initialized chain with argument', function () {
      var obj = ass('foo');
      ä(obj.value).is('foo');
    });

    it('should return deferred', function () {
      var obj = ass._('foo');
      obj.string.equal('bar');
      ä( obj.test() ).false;

      obj = ass._('foo').string.equal('foo');
      ä( obj.__deferred__ ).true;
      ä( obj.value ).equal('foo');
      ä( obj.assert().value ).equal('foo');
      ä( obj._.__deferred__ ).false;
    });

  });

  describe('static', function () {

    it('should return uninitialized chain', function () {
      var obj = ass.eq(3);
      ä( obj.value ).is( obj.__GUARD__ );
    });

    it('should create new instances', function () {

      ä( ass.true ).not.is( ass.true );

    });

  });

  // TODO: we need to solve the "multiple evaluation" first
  //       On easy way to "solve" it is by simply acknowledging that
  //       it's how it works, for an initialized expressions every
  //       update triggers the evaluation of the whole chain.
  //       Users can use .mark reliably if they appear at the end of
  //       the chains.
  //       A more difficult way to fix it is to keep the state when
  //       evaluating the chain, not only the expectations that run
  //       but also any custom resolvers and actual values used with
  //       it. This will impact however on the current error generation,
  //       we'll have to be able to traverse from the root to build
  //       them.
  describe.skip('checkmarks', function () {

    it('should count marks', function () {
      ä( ass.checkmarks() ).number;

      ass(true).equal(true).mark;
      ass(true).mark.equal(true);

      ass.checkmarks(2);

      if (false) {
        ass(true).true.mark;
      }

      ass.checkmarks(2);

      ass.true.mark;  // defined but not executed
      ass.mark.true.assert(true);

      ass.checkmarks(3);
    });

    it('should not evaluate more than once when building', function () {
      ass.checkmarks();

      ass(1).mark.number.mark.eq(1).mark
      ass.checkmarks(3);

      ass.mark.number.mark.eq(1).mark.assert(1);
      ass.checkmarks(6);
    });
  });



});