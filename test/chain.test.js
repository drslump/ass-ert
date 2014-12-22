describe('Chain', function () {

  var ass = require('../');


  describe('bound methods', function () {

    it('should return bound assert', function () {
      ass.checkmarks();

      var fn = ass._(true).bool.true.mark.assert;
      ass.checkmarks(0);

      fn();
      ass.checkmarks(1);
    });

    it('should return bound test', function () {
      ass.checkmarks();

      var fn = ass._(1).mark.number.eq(1).test;
      ass.checkmarks(0);

      ass( fn() ).true;
      ass( fn(2) ).false;
      ass.checkmarks(2);
    });

    it('should return bound pass-through shortcut', function () {
      ass.checkmarks();

      var fn = ass.string.equal('foo').index(0).equal('f').mark.$;

      ass( fn('foo') ).is('foo');

      ass.checkmarks(1);
    });

  });

  describe('underscore', function () {

    it('should defer evaluation', function () {
      ass.checkmarks()

      var ex = ass(true)._.mark.true;
      ass.checkmarks(0);

      ex._;  // now the evaluation takes place
      ass.checkmarks(1);
    });

  });

});