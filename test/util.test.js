describe('util', function () {

  require('failure').patch(global, 'it', 1);
  var ass = require('../');

  var util = require('../lib/util.js');


  describe('template', function () {

    function asstpl (arg) {
      return ass(
        util.unansi(util.template('{{arg}}', {arg: arg}))
      );
    }

    it('should apply ansi colors', function () {
      ass(
        util.template('{{foo}}', {foo: 'foo'})
      )
      .eql('\u001b[1;36m"foo"\u001b[0m');
    });

    it('should support strings', function () {
      asstpl('foo').eql('"foo"');

      asstpl('foo\nbar').eql('"foo\\nbar"');
    });

    it('should support numbers', function () {
      asstpl(10).eql('<10>');

      asstpl(1/0).eql('<Infinity>');

      asstpl(parseInt('')).eql('<NaN>');
    });

    it('should support bools/null/undefined', function () {
      asstpl(true).eql('<true>');
      asstpl(false).eql('<false>');
      asstpl(null).eql('<null>');
      asstpl(undefined).eql('<undefined>');
    });

    it('should support regexp', function () {
      asstpl(/regexp/).eql('/regexp/');
      asstpl(/regexp/i).eql('/regexp/i');
    });

    it('should support functions', function () {
      function fnName () {}
      var fn = function () {};
      var fnDispName = function () {};
      fnDispName.displayName = 'fnDispName';

      asstpl(fn).eql('<function>');
      asstpl(fnName).or(
        'fnName()',
        '<function>'  // IE: doesn't provide the function name
      );
      asstpl(fnDispName).eql('fnDispName()');
    });

    it.skip('should support arrays');

    it.skip('should support typed arrays');

    it.skip('should support DOM nodes');

    it.skip('should support classes');

  });

});