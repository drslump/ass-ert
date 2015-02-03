describe('Matchers: close', function () {

  require('failure').patch(global, 'it');

  var ass = require('../../');

  it('should support floats', function () {
    ass(3.55).close(3.45);
    ass(3.55).not.close(3.40);
    ass(3.55).close(3.65);
    ass(3.55).not.close(3.70);

    ass(3.55).close(4, 0.5);
    ass(3.55).not.close(3, 0.5);
  });

  it('should support ints', function () {
    ass(5).close(3, 2).close(4, 2).close(5, 2).close(6, 2).close(7, 2);
    ass(5).not.close(2, 2);
    ass(5).not.close(8, 2);
  });

  it('should support strings', function () {
    ass('foo bar baz').close('boo bar baz');
  });

});
