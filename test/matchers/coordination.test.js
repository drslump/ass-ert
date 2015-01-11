describe('Matchers: coordination', function () {

  require('failure').patch(global, 'it');

  var ass = require('../../');


  describe('and', function () {

    it('should work with a single branch', function () {

      ass('foo').and( ass.string );

      ass(function () {
        ass('foo').and( ass.number );
      }).raises(ass.Error);

    });

    it('should work with N branches', function () {

      ass('foo').and( ass.string, ass.not.empty, ass.size.eq(3) );

      ass(function () {
        ass('foo').and( ass.string, ass.empty, ass.size.eq(3) );
      }).raises(ass.Error);

    });

    it('should shortcut evaluation', function () {

      ass.marks();

      ass(function () {
        ass('foo').and( ass.mark, ass.number, ass.mark, ass.string );
      }).raises(ass.Error);

      ass.marks(1);

    });

  });

  describe('or', function () {

    it('should work with a single branch', function () {

      ass('foo').or( ass.string );

      ass(function () {
        ass('foo').or( ass.number );
      }).raises(ass.Error);

    });

    it('should work with N branches', function () {

      ass('foo').or( ass.number, ass.empty, ass.size.eq(3) );

      ass(function () {
        ass('foo').or( ass.number, ass.empty, ass.size.eq(10) );
      }).raises(ass.Error);

    });

    it('should shortcut evaluation', function () {

      ass.marks();

      ass('foo').or( ass.mark, ass.string, ass.mark, ass.number );

      ass.marks(1);

    });
  });

  describe('xor', function () {

    it('should work with a single branch', function () {

      ass(function () {
        ass('foo').xor( ass.string );
      }).raises(ass.Error);

      ass(function () {
        ass('foo').xor( ass.number );
      }).raises(ass.Error);

    });

    it('should work with N branches', function () {

      ass('foo').xor( ass.number, ass.empty, ass.size.eq(3) );

      ass(function () {
        ass('foo').xor( ass.string, ass.eq('foo'), ass.size.eq(3) );
      }).raises(ass.Error);

    });

  });

});
