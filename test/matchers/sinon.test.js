describe('Matchers: Sinon.js integration', function () {

  var sinon = require('sinon');
  var ass = require('../../');


  it('should still support sinon matchers', function () {
     var spy = sinon.spy();
     spy('foo');
     ass( spy.calledWith(sinon.match.number) ).be.false;
     ass( spy.calledWith(sinon.match.string) ).be.true;

     var stub = sinon.stub();
     stub.withArgs(sinon.match.number).returns(true);
     ass(stub(10)).be.true;
  });

  it('should accept expressions for spies', function () {
    var spy = sinon.spy();
    spy('foo');
    ass( spy.calledWith(ass.number) ).be.false;
    ass( spy.calledWith(ass.string) ).be.true;
  });

  it('should accept expressions for stubs', function () {
     var stub = sinon.stub();
     stub.withArgs(ass.number.above(5)).returns(true);
     ass(stub(10)).be.true;
  });

});
