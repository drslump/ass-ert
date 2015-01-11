describe('Matchers: not', function () {

  require('failure').patch(global, 'it');
  
  var ass = require('../../');

  it('should negate the next expectation', function () {
    ass('foo').not.number;
    ass.not.number.assert('foo');
  });

  it('should negate the following expectations', function () {
    ass.not.string.equal('bar').assert('foo');
  });

  it('should negate the negation', function () {
    ass.not.not.equal('foo').assert('foo');
  });

  it('should negate quantifiers', function () {
    ass.not.all.number.assert([1,null,3]);
    ass.all.not.number.assert(['foo',null,{}]);
  });

});
