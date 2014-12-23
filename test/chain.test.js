describe('Chain', function () {

  var ass = require('../');


  describe('bound methods', function () {

    it('should return bound assert', function () {
      ass.marks();

      var fn = ass._(true).bool.true.mark.assert;
      ass.marks(0);

      fn();
      ass.marks(1);
    });

    it('should return bound test', function () {
      ass.marks();

      var fn = ass._(1).mark.number.eq(1).test;
      ass.marks(0);

      ass( fn() ).true;
      ass( fn(2) ).false;
      ass.marks(2);
    });

    it('should return bound result', function () {
      ass.marks();

      var fn = ass.bool.true.mark.result;
      ass.marks(0);

      fn(true);
      ass.marks(1);
    });

    it('should return bound pass-through shortcut', function () {
      ass.marks();

      var fn = ass.string.equal('foo').index(0).equal('f').mark.$;

      ass( fn('foo') ).is('foo');

      ass.marks(1);
    });

  });

  describe('result', function () {

    it('should obtain the last result in the evaluation', function () {

      var ex = ass.filter(ass.moreThan(3));
      ass( ex.result([1,2,3,4,5,6]) ).eq([4,5,6]);

    });

  });

  describe('underscore', function () {

    it('should defer evaluation', function () {
      ass.marks()

      var ex = ass(true)._.mark.true;
      ass.marks(0);

      ex._;  // now the evaluation takes place
      ass.marks(1);
    });

  });

});