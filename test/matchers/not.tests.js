describe.only('Matchers: not', function () {

  var ass = require('../../');

  it('should negate the next expectation', function () {
    ass('foo').not.number;
    ass.not.number.assert('foo');
  });

  it('TODO: should negate the following expectations', function () {
    // TODO: This could probably be solved if we implement some kind of
    //       state tracking for continuing evaluations from where we left off.
    // ass('foo').not.string.equal('bar');
    ass.not.string.equal('bar').assert('foo');
  });

  it('should negate the negation', function () {
    // TODO: see above
    // ass('foo').not.string.equal('bar');
    ass.not.not.equal('foo').assert('foo');
  });

  it('should negate quantifiers', function () {
    ass.not.all.number.assert([1,null,3]);
  });

});