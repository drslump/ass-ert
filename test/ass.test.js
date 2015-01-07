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
      ä( obj.__deferred__ ).is(true);
    });

    it('should return initialized chain with argument', function () {
      var obj = ass('foo');
      ä(obj.value).is('foo');
      ä( obj.__deferred__ ).is(false);
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
      ä( obj.__deferred__ ).is(true);
    });

    it('should create new instances', function () {

      ä( ass.true ).not.is( ass.true );

    });

  });

  describe('pass through', function () {

    it('should return original value', function () {

      ä( ass('foo').$string ).is('foo');

    });

    it('should return asserted value', function () {
      var exp = ass.$string;

      ä( exp('foo') ).is('foo');

      exp = ass.$eq('foo');
      ä( exp('foo') ).eq('foo');
    });

    it('should assert if mismatch', function () {

      ä(function () {
        ass.$string(10);
      }).raises(ass.Error);

    });

  });

  describe('marks', function () {

    describe('mocha compatibility', function () {
      // Force a mark
      beforeEach(function () { ass(true).true.mark; });
      // Reset the counter
      beforeEach(ass.marks);

      it('should support reset via beforeEach', function () {
        ass.marks(0);
      });
    });

    it('should count marks', function () {
      ä( ass.marks() ).number;

      ass(true).equal(true).mark;

      ass.marks(1);

      if (false) {
        ass(true).true.mark;
      }

      ass.marks(1);

      ass.true.mark;  // defined but not executed
      ass.mark.true.assert(true);

      ass.marks(2);
    });

    it('should raise error', function () {
      ass.marks();

      ass(function () {
        ass.marks(10);
      }).raises(ass.Error);
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
    it.skip('should not evaluate more than once when building', function () {
      ass.marks();

      ass(1).mark.number.mark.eq(1).mark
      ass.marks(3);

      ass.mark.number.mark.eq(1).mark.assert(1);
      ass.marks(6);
    });
  });


  describe('ok', function () {

    it('should evaluate expression as truthy', function () {

      ass.ok( true );
      ass.ok( "foo" );
      ass.ok( 1 );
      ass.ok( {} );
      ass.ok( [10] );

    });

    it('should raise error if not truthy', function () {

      ä(function () {
        ass.ok(null)
      }).raises(ass.Error);

    });

    it('should return the original value', function () {
      var obj = {};
      ä( ass.ok(obj) ).is(obj);
    });

    it('should support custom failure messages', function () {
      ä(function () {
        ass.ok(false, "custom message")
      }).raises(ass.Error).prop('message').has('custom message');
    });

  });

  describe('ko', function () {

    it('should evaluate expression as falsy', function () {

      ass.ko( false );
      ass.ko( "" );
      ass.ko( 0 );
      ass.ko( [] );
      ass.ko( null );
      ass.ko( undefined );

    });

    it('should raise error if not falsy', function () {

      ä(function () {
        ass.ko(true);
      }).raises(ass.Error);

    });

    it('should return the original value', function () {
      var obj = null;
      ä( ass.ko(obj) ).is(obj);
    });

    it('should support custom failure messages', function () {
      ä(function () {
        ass.ok(false, "custom message")
      }).raises(ass.Error).prop('message').has('custom message');
    });

  });

});
