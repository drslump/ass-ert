describe('should', function () {

  require('failure').patch(global, 'it');

  var ass = require('../');
  var assCheckShould = ass._(Object.prototype).prop('should').isa(ass.Chain).assert;
  var assCheckNotShould = ass._(Object.prototype).not.prop('should').assert;

  afterEach(function () {
    ass.should.restore();
    assCheckNotShould();
  });

  describe('installation', function () {
    it('install with default name', function () {

      assCheckNotShould();
      ass.should();
      assCheckShould();

    });

    it('install with a custom name', function () {

      ass.should('ass');
      ass(Object.prototype).prop('ass').isa(ass.Chain);

    });

    it('uninstall default', function () {
      ass.should();
      assCheckShould();

      ass.should.restore();
      assCheckNotShould();

      ass.should();
      assCheckShould();

      ass.should(null); // shortcut to restore
      assCheckNotShould();
    });

    it('uninstall custom name', function () {
      ass.should('ass');
      ass(Object.prototype).prop('ass').isa(ass.Chain);

      ass.should.restore('ass');
      ass(Object.prototype).not.prop('ass');
    });

    it('install already defined', function () {
      ass.should();
      assCheckShould();
      ass.should();
      assCheckShould();

      ass.should.restore();
      assCheckNotShould();
    });

    it('install name already used', function () {
      Object.prototype.should = function () {};

      ass(function () {
        ass.should();
      }).raises(Error);

      delete Object.prototype.should;
    });

  });

  describe('usage', function () {
    beforeEach(ass.should);
    afterEach(ass.should.restore);

    it('should support numbers', function () {
      (12).should.equal(12);
    });

    it('should support strings', function () {
      'foo'.should.equal('foo');
    });

    it('should support bools', function () {
      true.should.equal(true);
    });

    it('should support objects', function () {
      ({foo: 'foo'}).should.prop('foo').equal('foo');
    });

    it('should forward to chain', function () {
      ass(true).should.be.bool;
    });

  });

});
