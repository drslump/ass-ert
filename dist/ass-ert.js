!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ass=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var Chain = require('./chain');
var Matcher = require('./matcher');
var Expectation = require('./expectation');
var util = require('./util');


var defProp = util.bind(Object.defineProperty, Object);


// Public interface
function ass (value) {
  if (arguments.length === 0) {
    return new Chain();
  }
  return new Chain(value);
}

// Deferred factory
ass._ = function (value) {
  return new Chain(value)._;
};

// Global registry of matchers (used for ass.help)
ass.matchers = [];

// ass.help dumps the help of each matcher registered
defProp(ass, 'help', {
  get: function () {
    var s = '';
    _.forEach(ass.matchers, function (matcher) {
      // TODO: This can be nicer
      var fn = matcher.test.toString();
      var args = fn.replace(/^function\s*\(([^\)]*)\)[\S\s]*/, '$1');
      args = args.split(',').map(function (x) { return x.trim(); });
      args.shift();
      fn = args.length ? ' (' + args.join(', ') + ')' : '';

      s += '> .' + matcher.name + fn + '\n\n';
      s += '  ' + matcher.help.replace(/\n/g, '\n  ');
      s += '\n\n';
    });
    return s;
  }
});

ass.ok = function (cond, message) {
  if (arguments.length === 1) {
    message = 'expected a truish value';
  }
  ass.desc(message).truthy.assert(cond, ass.ok);
  return cond;
};

ass.ko = function (cond, message) {
  if (arguments.length === 1) {
    message = 'expected a falsy value';
  }
  ass.desc(message).falsy.assert(cond, ass.ko);
  return cond;
};

// Resets or verifies the number of marks so far
// Forced arity-0 to be compatible with: beforeEach(ass.marks)
ass.marks = function (/* expected, desc */) {
  var expected = arguments[0];
  var desc = arguments[1];
  if (typeof expected === 'undefined') {
    expected = ass.marks.counter;
    ass.marks.counter = 0;
    return expected;  // return back how many there were
  }

  ass.desc(desc || 'ass.marks').eq(expected)
  .assert(ass.marks.counter, ass.marks);
};
ass.marks.counter = 0;


// Helper to register new matchers in the registry
ass.register = function (name, matcher) {
  if (name instanceof Matcher) {
    matcher = name;
    name = matcher.name;
  } else if (typeof name === 'object') {
    Object.keys(name).forEach(function (key) {
      ass.register(key, name[key]);
    });
    return;
  } else {  // Assume a descriptor was given
    // Create the aliases first
    _.forEach(matcher.aliases, function (alias) {
      ass.register(new Matcher(alias, matcher));
    });

    matcher = new Matcher(name, matcher);
  }

  // Keep the matcher around for ass.help
  ass.matchers.push(matcher);


  // TODO: Allow matchers to be overridden and also overloaded
  //       if they have an "overload" method it can be used
  //       to check which one should be used.
  //       Better Idea (I think), instead of overloading based
  //       on the value under test, which may produce issues
  //       since we don't know for sure what that value is,
  //       allow matchers to introduce a new "prototype" for
  //       the chain, that is, a .dom matcher will include
  //       all the core expectations but then also overrides
  //       and new ones until the end of the chain.


  // Matcher functions with a single argument are getters
  var fnKey = matcher.arity === 1 ? 'get' : 'value';
  var prop = {
    configurable: false,
    enumerable: true
  };
  if (fnKey === 'value') {
    prop.writable = false;
  }

  // Augment the Chain prototype
  prop[fnKey] = function fn () {
    var exp = new Expectation(matcher, arguments);
    this.__expectations__.push(exp);
    if (!this.__deferred__) {
      this.assert(this.value, fn);
    }
    return this;
  };

  defProp(Chain.prototype, name, prop);

  // Augment the static interface
  prop[fnKey] = function () {
    var chain = new Chain();

    if (fnKey === 'get') {
      return chain[name];
    }

    return chain[name].apply(chain, arguments);
  };

  defProp(ass, name, prop);

  // Pass through for chains
  prop[fnKey] = function passthrough() {
    return this[name].assert(this.value, passthrough).valueOf();
  };
  prop.enumerable = false;
  defProp(Chain.prototype, '$' + name, prop);

  // Pass through static constructor
  defProp(ass, '$' + name, {
    value: function (value) {
      if (fnKey === 'get') {
        return ass(value)['$' + name];
      }

      // Create a new expression for the expectation
      var chain = new Chain();
      chain[name].apply(chain, arguments);
      // Return a callable that asserts upon receiving a value
      return chain.through;
    },
    enumerable: false
  });

};


module.exports = ass;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hc3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIE1hdGNoZXIgPSByZXF1aXJlKCcuL21hdGNoZXInKTtcbnZhciBFeHBlY3RhdGlvbiA9IHJlcXVpcmUoJy4vZXhwZWN0YXRpb24nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cblxudmFyIGRlZlByb3AgPSB1dGlsLmJpbmQoT2JqZWN0LmRlZmluZVByb3BlcnR5LCBPYmplY3QpO1xuXG5cbi8vIFB1YmxpYyBpbnRlcmZhY2VcbmZ1bmN0aW9uIGFzcyAodmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IENoYWluKCk7XG4gIH1cbiAgcmV0dXJuIG5ldyBDaGFpbih2YWx1ZSk7XG59XG5cbi8vIERlZmVycmVkIGZhY3RvcnlcbmFzcy5fID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpLl87XG59O1xuXG4vLyBHbG9iYWwgcmVnaXN0cnkgb2YgbWF0Y2hlcnMgKHVzZWQgZm9yIGFzcy5oZWxwKVxuYXNzLm1hdGNoZXJzID0gW107XG5cbi8vIGFzcy5oZWxwIGR1bXBzIHRoZSBoZWxwIG9mIGVhY2ggbWF0Y2hlciByZWdpc3RlcmVkXG5kZWZQcm9wKGFzcywgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gJyc7XG4gICAgXy5mb3JFYWNoKGFzcy5tYXRjaGVycywgZnVuY3Rpb24gKG1hdGNoZXIpIHtcbiAgICAgIC8vIFRPRE86IFRoaXMgY2FuIGJlIG5pY2VyXG4gICAgICB2YXIgZm4gPSBtYXRjaGVyLnRlc3QudG9TdHJpbmcoKTtcbiAgICAgIHZhciBhcmdzID0gZm4ucmVwbGFjZSgvXmZ1bmN0aW9uXFxzKlxcKChbXlxcKV0qKVxcKVtcXFNcXHNdKi8sICckMScpO1xuICAgICAgYXJncyA9IGFyZ3Muc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgudHJpbSgpOyB9KTtcbiAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgIGZuID0gYXJncy5sZW5ndGggPyAnICgnICsgYXJncy5qb2luKCcsICcpICsgJyknIDogJyc7XG5cbiAgICAgIHMgKz0gJz4gLicgKyBtYXRjaGVyLm5hbWUgKyBmbiArICdcXG5cXG4nO1xuICAgICAgcyArPSAnICAnICsgbWF0Y2hlci5oZWxwLnJlcGxhY2UoL1xcbi9nLCAnXFxuICAnKTtcbiAgICAgIHMgKz0gJ1xcblxcbic7XG4gICAgfSk7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn0pO1xuXG5hc3Mub2sgPSBmdW5jdGlvbiAoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSB0cnVpc2ggdmFsdWUnO1xuICB9XG4gIGFzcy5kZXNjKG1lc3NhZ2UpLnRydXRoeS5hc3NlcnQoY29uZCwgYXNzLm9rKTtcbiAgcmV0dXJuIGNvbmQ7XG59O1xuXG5hc3Mua28gPSBmdW5jdGlvbiAoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSBmYWxzeSB2YWx1ZSc7XG4gIH1cbiAgYXNzLmRlc2MobWVzc2FnZSkuZmFsc3kuYXNzZXJ0KGNvbmQsIGFzcy5rbyk7XG4gIHJldHVybiBjb25kO1xufTtcblxuLy8gUmVzZXRzIG9yIHZlcmlmaWVzIHRoZSBudW1iZXIgb2YgbWFya3Mgc28gZmFyXG4vLyBGb3JjZWQgYXJpdHktMCB0byBiZSBjb21wYXRpYmxlIHdpdGg6IGJlZm9yZUVhY2goYXNzLm1hcmtzKVxuYXNzLm1hcmtzID0gZnVuY3Rpb24gKC8qIGV4cGVjdGVkLCBkZXNjICovKSB7XG4gIHZhciBleHBlY3RlZCA9IGFyZ3VtZW50c1swXTtcbiAgdmFyIGRlc2MgPSBhcmd1bWVudHNbMV07XG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgZXhwZWN0ZWQgPSBhc3MubWFya3MuY291bnRlcjtcbiAgICBhc3MubWFya3MuY291bnRlciA9IDA7XG4gICAgcmV0dXJuIGV4cGVjdGVkOyAgLy8gcmV0dXJuIGJhY2sgaG93IG1hbnkgdGhlcmUgd2VyZVxuICB9XG5cbiAgYXNzLmRlc2MoZGVzYyB8fCAnYXNzLm1hcmtzJykuZXEoZXhwZWN0ZWQpXG4gIC5hc3NlcnQoYXNzLm1hcmtzLmNvdW50ZXIsIGFzcy5tYXJrcyk7XG59O1xuYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuXG5cbi8vIEhlbHBlciB0byByZWdpc3RlciBuZXcgbWF0Y2hlcnMgaW4gdGhlIHJlZ2lzdHJ5XG5hc3MucmVnaXN0ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWF0Y2hlcikge1xuICBpZiAobmFtZSBpbnN0YW5jZW9mIE1hdGNoZXIpIHtcbiAgICBtYXRjaGVyID0gbmFtZTtcbiAgICBuYW1lID0gbWF0Y2hlci5uYW1lO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgIE9iamVjdC5rZXlzKG5hbWUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgYXNzLnJlZ2lzdGVyKGtleSwgbmFtZVtrZXldKTtcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSB7ICAvLyBBc3N1bWUgYSBkZXNjcmlwdG9yIHdhcyBnaXZlblxuICAgIC8vIENyZWF0ZSB0aGUgYWxpYXNlcyBmaXJzdFxuICAgIF8uZm9yRWFjaChtYXRjaGVyLmFsaWFzZXMsIGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgYXNzLnJlZ2lzdGVyKG5ldyBNYXRjaGVyKGFsaWFzLCBtYXRjaGVyKSk7XG4gICAgfSk7XG5cbiAgICBtYXRjaGVyID0gbmV3IE1hdGNoZXIobmFtZSwgbWF0Y2hlcik7XG4gIH1cblxuICAvLyBLZWVwIHRoZSBtYXRjaGVyIGFyb3VuZCBmb3IgYXNzLmhlbHBcbiAgYXNzLm1hdGNoZXJzLnB1c2gobWF0Y2hlcik7XG5cblxuICAvLyBUT0RPOiBBbGxvdyBtYXRjaGVycyB0byBiZSBvdmVycmlkZGVuIGFuZCBhbHNvIG92ZXJsb2FkZWRcbiAgLy8gICAgICAgaWYgdGhleSBoYXZlIGFuIFwib3ZlcmxvYWRcIiBtZXRob2QgaXQgY2FuIGJlIHVzZWRcbiAgLy8gICAgICAgdG8gY2hlY2sgd2hpY2ggb25lIHNob3VsZCBiZSB1c2VkLlxuICAvLyAgICAgICBCZXR0ZXIgSWRlYSAoSSB0aGluayksIGluc3RlYWQgb2Ygb3ZlcmxvYWRpbmcgYmFzZWRcbiAgLy8gICAgICAgb24gdGhlIHZhbHVlIHVuZGVyIHRlc3QsIHdoaWNoIG1heSBwcm9kdWNlIGlzc3Vlc1xuICAvLyAgICAgICBzaW5jZSB3ZSBkb24ndCBrbm93IGZvciBzdXJlIHdoYXQgdGhhdCB2YWx1ZSBpcyxcbiAgLy8gICAgICAgYWxsb3cgbWF0Y2hlcnMgdG8gaW50cm9kdWNlIGEgbmV3IFwicHJvdG90eXBlXCIgZm9yXG4gIC8vICAgICAgIHRoZSBjaGFpbiwgdGhhdCBpcywgYSAuZG9tIG1hdGNoZXIgd2lsbCBpbmNsdWRlXG4gIC8vICAgICAgIGFsbCB0aGUgY29yZSBleHBlY3RhdGlvbnMgYnV0IHRoZW4gYWxzbyBvdmVycmlkZXNcbiAgLy8gICAgICAgYW5kIG5ldyBvbmVzIHVudGlsIHRoZSBlbmQgb2YgdGhlIGNoYWluLlxuXG5cbiAgLy8gTWF0Y2hlciBmdW5jdGlvbnMgd2l0aCBhIHNpbmdsZSBhcmd1bWVudCBhcmUgZ2V0dGVyc1xuICB2YXIgZm5LZXkgPSBtYXRjaGVyLmFyaXR5ID09PSAxID8gJ2dldCcgOiAndmFsdWUnO1xuICB2YXIgcHJvcCA9IHtcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfTtcbiAgaWYgKGZuS2V5ID09PSAndmFsdWUnKSB7XG4gICAgcHJvcC53cml0YWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgLy8gQXVnbWVudCB0aGUgQ2hhaW4gcHJvdG90eXBlXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gZm4gKCkge1xuICAgIHZhciBleHAgPSBuZXcgRXhwZWN0YXRpb24obWF0Y2hlciwgYXJndW1lbnRzKTtcbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucHVzaChleHApO1xuICAgIGlmICghdGhpcy5fX2RlZmVycmVkX18pIHtcbiAgICAgIHRoaXMuYXNzZXJ0KHRoaXMudmFsdWUsIGZuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHByb3ApO1xuXG4gIC8vIEF1Z21lbnQgdGhlIHN0YXRpYyBpbnRlcmZhY2VcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoYWluID0gbmV3IENoYWluKCk7XG5cbiAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICByZXR1cm4gY2hhaW5bbmFtZV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYWluW25hbWVdLmFwcGx5KGNoYWluLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIGRlZlByb3AoYXNzLCBuYW1lLCBwcm9wKTtcblxuICAvLyBQYXNzIHRocm91Z2ggZm9yIGNoYWluc1xuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uIHBhc3N0aHJvdWdoKCkge1xuICAgIHJldHVybiB0aGlzW25hbWVdLmFzc2VydCh0aGlzLnZhbHVlLCBwYXNzdGhyb3VnaCkudmFsdWVPZigpO1xuICB9O1xuICBwcm9wLmVudW1lcmFibGUgPSBmYWxzZTtcbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsICckJyArIG5hbWUsIHByb3ApO1xuXG4gIC8vIFBhc3MgdGhyb3VnaCBzdGF0aWMgY29uc3RydWN0b3JcbiAgZGVmUHJvcChhc3MsICckJyArIG5hbWUsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICAgIHJldHVybiBhc3ModmFsdWUpWyckJyArIG5hbWVdO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgZXhwcmVzc2lvbiBmb3IgdGhlIGV4cGVjdGF0aW9uXG4gICAgICB2YXIgY2hhaW4gPSBuZXcgQ2hhaW4oKTtcbiAgICAgIGNoYWluW25hbWVdLmFwcGx5KGNoYWluLCBhcmd1bWVudHMpO1xuICAgICAgLy8gUmV0dXJuIGEgY2FsbGFibGUgdGhhdCBhc3NlcnRzIHVwb24gcmVjZWl2aW5nIGEgdmFsdWVcbiAgICAgIHJldHVybiBjaGFpbi50aHJvdWdoO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBhc3M7XG4iXX0=
},{"./chain":2,"./expectation":4,"./matcher":5,"./util":13}],2:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var resolvers = require('./resolvers');
var AssError = require('./error');
var util = require('./util');
var Promise = util.Promise;

var defProp = util.bind(Object.defineProperty, Object);

// An expectations chain (aka expression), the core object of the library,
// allows to setup a set of expectations to be run at any point against a
// value.
function Chain (value) {
  if (!Chain.isChain(this)) {
    throw new Error('Ass Chain constructor called without new!');
  }

  // TODO: On non initialized chains we can't do .value, it should
  //       be a expectation that gets the initial value given when
  //       resolving (so, it should be stored on the resolver)
  this.value = arguments.length > 0 ? value : this.__GUARD__;

  // Custom description
  defProp(this, '__description__', {
    value: '',
    enumerable: false,
    configurable: false,
    writable: true
  });

  // List of [ Expectation ]
  defProp(this, '__expectations__', {
    value: [],
    enumerable: false,
    configurable: false,
    writable: false
  });

  // When true the expression is considered deferred and won't
  // try to immediately evaluate any newly chained expectation.
  defProp(this, '__deferred__', {
    value: this.value === this.__GUARD__,
    enumerable: false,
    configurable: false,
    writable: true
  });

  // Holds the list of promise callbacks attached to the expression
  defProp(this, '__thens__', {
    value: [],
    enumerable: false,
    configurable: false,
    writable: false
  });

  // Seal the context to the methods so we can call them as plain functions
  this.test = util.bind(Chain.prototype.test, this);
  this.assert = util.bind(Chain.prototype.assert, this);
  this.result = util.bind(Chain.prototype.result, this);
  this.through = util.bind(Chain.prototype.through, this);
  this.$ = this.through;
}

Chain.isChain = function (obj) {
  // This looks contrived but instanceof is kind of slow-ish
  return obj && obj.constructor === Chain;
};


var proto = Chain.prototype = Object.create(null);
proto.constructor = Chain;

// Guard token to detect valueless matchers
proto.__GUARD__ = {
  valueOf: function () {
    return this.toString();
  },
  toString: function () {
    return '{{valueless}}';
  }
};

// Supports the usage: ass.string.help
defProp(proto, 'help', {
  get: function () {
    // TODO: Productize this and perhaps show help for the whole chain
    var tail = _.tail(this.__expectations__);
    return tail ? tail.help : 'N/A';
  }
});

// Support use case: ass(value)._.some.number.above(5)._
defProp(proto, '_', {
  get: function fn() {
    if (!this.__deferred__) {
      this.__deferred__ = true;
    } else {
      this.__deferred__ = false;
      this.assert(this.value, fn);
    }
    return this;
  }
});


// Exposes a Promise/A interface for the expression, the intended use is for
// obtaining the result for asynchronous expressions.
// Here though we just collect the callbacks, the actual promise resolution
// is done in the resolver when it reaches a result.
proto.then = function (cb, eb) {
  // Register the callbacks to be used when resolved
  this.__thens__.push([cb, eb]);

  // When the expression is non deferred and we have a value we force the
  // resolver to run in order to resolve the promise at least once.
  // This is primarily to support the test runners use case where an expression
  // is returned from the test and the runner will attach itself here.
  if (!this.__deferred__ && this.value !== this.__GUARD__) {
    var resolver = resolvers.acquire(this);
    resolver(this.value);
  }

  return this;
};

proto.catch = function (eb) {
  return this.then(null, eb);
};

// Dispatch everyone who was waiting to be notified of the outcome
proto.dispatchResult = function (resolved, result) {
  if (0 === this.__thens__.length) {
    return;
  }

  // Generate a nice error for the failure
  var actual = this.value;
  if (result === false) {
    actual = this.buildError(resolved, proto.dispatchResult);
  }

  // Create a promise that rejects immediately with a failure error or
  // resolves with the expression subject.
  var promise = new Promise(function (resolve, reject) {
    // Calling resolve() with a promise will attach itself to the promise
    // instead of passing it as a simple value. To avoid that we detect the
    // case and wrap it in an array.
    if (actual && typeof actual.then === 'function') {
      actual = [
        'Ass: Value wrapped in an array since it looks like a Promise',
        actual
      ];
    }

    (result ? resolve : reject)( actual );
  });

  // Attach all the registered thens to the promise so they get notified
  _.forEach(this.__thens__, function (callbacks) {
    promise = promise.then.apply(promise, callbacks);
  });
};

function dumpChain (resolved, indent) {
  var result = '';

  indent = indent || '';

  resolved.forEach(function (exp, idx) {
    if (Array.isArray(exp)) {
      result += dumpChain(exp, indent + '  ');
      return;
    }

    if (exp.result) {
      result += indent + ' \u001b[32mPassed:\u001b[0m ' + exp.description + '\n';
      return;
    }

    result += indent + ' \u001b[31mFailed:\u001b[0m ' + exp.description + '\n';
    if (idx === resolved.length - 1) {
      result += indent + '    \u001b[33mBut:\u001b[0m ' + exp.failure + '\n';
    }

  });

  return result;
}


// Builds an AssError for the current expression. It makes a couple of
// assumptions, for instance the .__offset__ must be placed just after the
// expectation that produced the failure of the chain.
proto.buildError = function (resolved, ssf) {

  var error = this.__description__ + '\n\n';

  exp = resolved[ resolved.length - 1 ];
  error += dumpChain(resolved);

  if (!util.doColors()) {
    error = util.unansi(error);
  }

  // TODO: showDiff should be used only when it makes sense perhaps
  //       we can pass null/undefined and let AssError detect when it
  //       makes sense.

  var expected = exp.expected;
  // Mocha will try to jsonify the expected value, just ignore if it's a function
  if (typeof expected === 'function') {
    expected = null;
  }

  var inst = new AssError(error, ssf || arguments.callee || proto.buildError);
  inst.showDiff = false;
  inst.actual = null;
  inst.expected = null;
  return inst;
};

// Resolves the current chain for a given value. The result is always a
// boolean indicating the outcome or an undefined to signal that it reached
// an asynchronous flow.
proto.test = function (actual) {
  if (arguments.length === 0) {
    actual = this.value;
  }

  // Resolve the chain starting from root
  var resolver = resolvers.acquire(this);
  var result = resolver(actual);

  return result;
};

// Performs the resolution of the chain but additionally will raise an error
// if it fails to complete. When the expression resolves as undefined (async)
// it'll be automatically enable its deferred flag.
// The `ssf` stands for StackTraceFunction, a reference to the first function
// to show on the stack trace.
proto.assert = function (actual, ssf) {
  if (arguments.length === 0) {
    actual = this.value;
  }

  // Just ignore if the actual value is not present yet
  // TODO: Shall it produce an error?
  if (actual === this.__GUARD__) return this;

  var resolver = resolvers.acquire(this);
  var result = resolver(actual);

  // It failed so report it with a nice error
  if (result === false) {
    throw this.buildError(resolver.resolved, ssf || this.assert);
  }

  // Convert the expression into a deferred if an async expection was found
  if (result === undefined) {
    this.__deferred__ = true;
  }

  return this;
};

// Asserts the provided value and if successful returns the original
// value instead of the chain instance.
proto.through = function (actual) {
  this.assert(actual, proto.through);
  return actual;
};

// Evaluates the expression chain reporting the last mutated value seen in
// it. If the expression does not complete it'll return undefined.
proto.result = function (actual) {
  var result;

  if (arguments.length === 0) {
    actual = this.value;
  }

  try {
    this.tap(function (value) {
      result = value;
    }).test(actual);
  } finally {
    // Remove the .tap from the chain
    this.__expectations__.pop();
  }

  return result;
};

Chain.prototype.valueOf = function () {
  return this.value;
};

Chain.prototype.toString = function () {
  if (this.__description__) {
    return this.__description__;
  }

  var descs =
    this.__expectations__
    .filter(function (c) { return c.description; })
    .map(function (c) { return c.description; });

  if (descs.length > 1) {
    return '(' + descs.join(', ') + ')';
  } else if (descs.length === 1) {
    return descs[0];
  } else {
    return '<AssChain>';
  }
};


module.exports = Chain;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jaGFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snXyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnXyddIDogbnVsbCk7XG5cbnZhciByZXNvbHZlcnMgPSByZXF1aXJlKCcuL3Jlc29sdmVycycpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBQcm9taXNlID0gdXRpbC5Qcm9taXNlO1xuXG52YXIgZGVmUHJvcCA9IHV0aWwuYmluZChPYmplY3QuZGVmaW5lUHJvcGVydHksIE9iamVjdCk7XG5cbi8vIEFuIGV4cGVjdGF0aW9ucyBjaGFpbiAoYWthIGV4cHJlc3Npb24pLCB0aGUgY29yZSBvYmplY3Qgb2YgdGhlIGxpYnJhcnksXG4vLyBhbGxvd3MgdG8gc2V0dXAgYSBzZXQgb2YgZXhwZWN0YXRpb25zIHRvIGJlIHJ1biBhdCBhbnkgcG9pbnQgYWdhaW5zdCBhXG4vLyB2YWx1ZS5cbmZ1bmN0aW9uIENoYWluICh2YWx1ZSkge1xuICBpZiAoIUNoYWluLmlzQ2hhaW4odGhpcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FzcyBDaGFpbiBjb25zdHJ1Y3RvciBjYWxsZWQgd2l0aG91dCBuZXchJyk7XG4gIH1cblxuICAvLyBUT0RPOiBPbiBub24gaW5pdGlhbGl6ZWQgY2hhaW5zIHdlIGNhbid0IGRvIC52YWx1ZSwgaXQgc2hvdWxkXG4gIC8vICAgICAgIGJlIGEgZXhwZWN0YXRpb24gdGhhdCBnZXRzIHRoZSBpbml0aWFsIHZhbHVlIGdpdmVuIHdoZW5cbiAgLy8gICAgICAgcmVzb2x2aW5nIChzbywgaXQgc2hvdWxkIGJlIHN0b3JlZCBvbiB0aGUgcmVzb2x2ZXIpXG4gIHRoaXMudmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IHZhbHVlIDogdGhpcy5fX0dVQVJEX187XG5cbiAgLy8gQ3VzdG9tIGRlc2NyaXB0aW9uXG4gIGRlZlByb3AodGhpcywgJ19fZGVzY3JpcHRpb25fXycsIHtcbiAgICB2YWx1ZTogJycsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBMaXN0IG9mIFsgRXhwZWN0YXRpb24gXVxuICBkZWZQcm9wKHRoaXMsICdfX2V4cGVjdGF0aW9uc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBXaGVuIHRydWUgdGhlIGV4cHJlc3Npb24gaXMgY29uc2lkZXJlZCBkZWZlcnJlZCBhbmQgd29uJ3RcbiAgLy8gdHJ5IHRvIGltbWVkaWF0ZWx5IGV2YWx1YXRlIGFueSBuZXdseSBjaGFpbmVkIGV4cGVjdGF0aW9uLlxuICBkZWZQcm9wKHRoaXMsICdfX2RlZmVycmVkX18nLCB7XG4gICAgdmFsdWU6IHRoaXMudmFsdWUgPT09IHRoaXMuX19HVUFSRF9fLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gSG9sZHMgdGhlIGxpc3Qgb2YgcHJvbWlzZSBjYWxsYmFja3MgYXR0YWNoZWQgdG8gdGhlIGV4cHJlc3Npb25cbiAgZGVmUHJvcCh0aGlzLCAnX190aGVuc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBTZWFsIHRoZSBjb250ZXh0IHRvIHRoZSBtZXRob2RzIHNvIHdlIGNhbiBjYWxsIHRoZW0gYXMgcGxhaW4gZnVuY3Rpb25zXG4gIHRoaXMudGVzdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUudGVzdCwgdGhpcyk7XG4gIHRoaXMuYXNzZXJ0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS5hc3NlcnQsIHRoaXMpO1xuICB0aGlzLnJlc3VsdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUucmVzdWx0LCB0aGlzKTtcbiAgdGhpcy50aHJvdWdoID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS50aHJvdWdoLCB0aGlzKTtcbiAgdGhpcy4kID0gdGhpcy50aHJvdWdoO1xufVxuXG5DaGFpbi5pc0NoYWluID0gZnVuY3Rpb24gKG9iaikge1xuICAvLyBUaGlzIGxvb2tzIGNvbnRyaXZlZCBidXQgaW5zdGFuY2VvZiBpcyBraW5kIG9mIHNsb3ctaXNoXG4gIHJldHVybiBvYmogJiYgb2JqLmNvbnN0cnVjdG9yID09PSBDaGFpbjtcbn07XG5cblxudmFyIHByb3RvID0gQ2hhaW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gQ2hhaW47XG5cbi8vIEd1YXJkIHRva2VuIHRvIGRldGVjdCB2YWx1ZWxlc3MgbWF0Y2hlcnNcbnByb3RvLl9fR1VBUkRfXyA9IHtcbiAgdmFsdWVPZjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd7e3ZhbHVlbGVzc319JztcbiAgfVxufTtcblxuLy8gU3VwcG9ydHMgdGhlIHVzYWdlOiBhc3Muc3RyaW5nLmhlbHBcbmRlZlByb3AocHJvdG8sICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPOiBQcm9kdWN0aXplIHRoaXMgYW5kIHBlcmhhcHMgc2hvdyBoZWxwIGZvciB0aGUgd2hvbGUgY2hhaW5cbiAgICB2YXIgdGFpbCA9IF8udGFpbCh0aGlzLl9fZXhwZWN0YXRpb25zX18pO1xuICAgIHJldHVybiB0YWlsID8gdGFpbC5oZWxwIDogJ04vQSc7XG4gIH1cbn0pO1xuXG4vLyBTdXBwb3J0IHVzZSBjYXNlOiBhc3ModmFsdWUpLl8uc29tZS5udW1iZXIuYWJvdmUoNSkuX1xuZGVmUHJvcChwcm90bywgJ18nLCB7XG4gIGdldDogZnVuY3Rpb24gZm4oKSB7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5fX2RlZmVycmVkX18gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IGZhbHNlO1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufSk7XG5cblxuLy8gRXhwb3NlcyBhIFByb21pc2UvQSBpbnRlcmZhY2UgZm9yIHRoZSBleHByZXNzaW9uLCB0aGUgaW50ZW5kZWQgdXNlIGlzIGZvclxuLy8gb2J0YWluaW5nIHRoZSByZXN1bHQgZm9yIGFzeW5jaHJvbm91cyBleHByZXNzaW9ucy5cbi8vIEhlcmUgdGhvdWdoIHdlIGp1c3QgY29sbGVjdCB0aGUgY2FsbGJhY2tzLCB0aGUgYWN0dWFsIHByb21pc2UgcmVzb2x1dGlvblxuLy8gaXMgZG9uZSBpbiB0aGUgcmVzb2x2ZXIgd2hlbiBpdCByZWFjaGVzIGEgcmVzdWx0LlxucHJvdG8udGhlbiA9IGZ1bmN0aW9uIChjYiwgZWIpIHtcbiAgLy8gUmVnaXN0ZXIgdGhlIGNhbGxiYWNrcyB0byBiZSB1c2VkIHdoZW4gcmVzb2x2ZWRcbiAgdGhpcy5fX3RoZW5zX18ucHVzaChbY2IsIGViXSk7XG5cbiAgLy8gV2hlbiB0aGUgZXhwcmVzc2lvbiBpcyBub24gZGVmZXJyZWQgYW5kIHdlIGhhdmUgYSB2YWx1ZSB3ZSBmb3JjZSB0aGVcbiAgLy8gcmVzb2x2ZXIgdG8gcnVuIGluIG9yZGVyIHRvIHJlc29sdmUgdGhlIHByb21pc2UgYXQgbGVhc3Qgb25jZS5cbiAgLy8gVGhpcyBpcyBwcmltYXJpbHkgdG8gc3VwcG9ydCB0aGUgdGVzdCBydW5uZXJzIHVzZSBjYXNlIHdoZXJlIGFuIGV4cHJlc3Npb25cbiAgLy8gaXMgcmV0dXJuZWQgZnJvbSB0aGUgdGVzdCBhbmQgdGhlIHJ1bm5lciB3aWxsIGF0dGFjaCBpdHNlbGYgaGVyZS5cbiAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXyAmJiB0aGlzLnZhbHVlICE9PSB0aGlzLl9fR1VBUkRfXykge1xuICAgIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICAgIHJlc29sdmVyKHRoaXMudmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5jYXRjaCA9IGZ1bmN0aW9uIChlYikge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIGViKTtcbn07XG5cbi8vIERpc3BhdGNoIGV2ZXJ5b25lIHdobyB3YXMgd2FpdGluZyB0byBiZSBub3RpZmllZCBvZiB0aGUgb3V0Y29tZVxucHJvdG8uZGlzcGF0Y2hSZXN1bHQgPSBmdW5jdGlvbiAocmVzb2x2ZWQsIHJlc3VsdCkge1xuICBpZiAoMCA9PT0gdGhpcy5fX3RoZW5zX18ubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR2VuZXJhdGUgYSBuaWNlIGVycm9yIGZvciB0aGUgZmFpbHVyZVxuICB2YXIgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICBhY3R1YWwgPSB0aGlzLmJ1aWxkRXJyb3IocmVzb2x2ZWQsIHByb3RvLmRpc3BhdGNoUmVzdWx0KTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb21pc2UgdGhhdCByZWplY3RzIGltbWVkaWF0ZWx5IHdpdGggYSBmYWlsdXJlIGVycm9yIG9yXG4gIC8vIHJlc29sdmVzIHdpdGggdGhlIGV4cHJlc3Npb24gc3ViamVjdC5cbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gQ2FsbGluZyByZXNvbHZlKCkgd2l0aCBhIHByb21pc2Ugd2lsbCBhdHRhY2ggaXRzZWxmIHRvIHRoZSBwcm9taXNlXG4gICAgLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGl0IGFzIGEgc2ltcGxlIHZhbHVlLiBUbyBhdm9pZCB0aGF0IHdlIGRldGVjdCB0aGVcbiAgICAvLyBjYXNlIGFuZCB3cmFwIGl0IGluIGFuIGFycmF5LlxuICAgIGlmIChhY3R1YWwgJiYgdHlwZW9mIGFjdHVhbC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhY3R1YWwgPSBbXG4gICAgICAgICdBc3M6IFZhbHVlIHdyYXBwZWQgaW4gYW4gYXJyYXkgc2luY2UgaXQgbG9va3MgbGlrZSBhIFByb21pc2UnLFxuICAgICAgICBhY3R1YWxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgKHJlc3VsdCA/IHJlc29sdmUgOiByZWplY3QpKCBhY3R1YWwgKTtcbiAgfSk7XG5cbiAgLy8gQXR0YWNoIGFsbCB0aGUgcmVnaXN0ZXJlZCB0aGVucyB0byB0aGUgcHJvbWlzZSBzbyB0aGV5IGdldCBub3RpZmllZFxuICBfLmZvckVhY2godGhpcy5fX3RoZW5zX18sIGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuLmFwcGx5KHByb21pc2UsIGNhbGxiYWNrcyk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZHVtcENoYWluIChyZXNvbHZlZCwgaW5kZW50KSB7XG4gIHZhciByZXN1bHQgPSAnJztcblxuICBpbmRlbnQgPSBpbmRlbnQgfHwgJyc7XG5cbiAgcmVzb2x2ZWQuZm9yRWFjaChmdW5jdGlvbiAoZXhwLCBpZHgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShleHApKSB7XG4gICAgICByZXN1bHQgKz0gZHVtcENoYWluKGV4cCwgaW5kZW50ICsgJyAgJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV4cC5yZXN1bHQpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzJtUGFzc2VkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzFtRmFpbGVkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgIGlmIChpZHggPT09IHJlc29sdmVkLmxlbmd0aCAtIDEpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMG0gJyArIGV4cC5mYWlsdXJlICsgJ1xcbic7XG4gICAgfVxuXG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuLy8gQnVpbGRzIGFuIEFzc0Vycm9yIGZvciB0aGUgY3VycmVudCBleHByZXNzaW9uLiBJdCBtYWtlcyBhIGNvdXBsZSBvZlxuLy8gYXNzdW1wdGlvbnMsIGZvciBpbnN0YW5jZSB0aGUgLl9fb2Zmc2V0X18gbXVzdCBiZSBwbGFjZWQganVzdCBhZnRlciB0aGVcbi8vIGV4cGVjdGF0aW9uIHRoYXQgcHJvZHVjZWQgdGhlIGZhaWx1cmUgb2YgdGhlIGNoYWluLlxucHJvdG8uYnVpbGRFcnJvciA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgc3NmKSB7XG5cbiAgdmFyIGVycm9yID0gdGhpcy5fX2Rlc2NyaXB0aW9uX18gKyAnXFxuXFxuJztcblxuICBleHAgPSByZXNvbHZlZFsgcmVzb2x2ZWQubGVuZ3RoIC0gMSBdO1xuICBlcnJvciArPSBkdW1wQ2hhaW4ocmVzb2x2ZWQpO1xuXG4gIGlmICghdXRpbC5kb0NvbG9ycygpKSB7XG4gICAgZXJyb3IgPSB1dGlsLnVuYW5zaShlcnJvcik7XG4gIH1cblxuICAvLyBUT0RPOiBzaG93RGlmZiBzaG91bGQgYmUgdXNlZCBvbmx5IHdoZW4gaXQgbWFrZXMgc2Vuc2UgcGVyaGFwc1xuICAvLyAgICAgICB3ZSBjYW4gcGFzcyBudWxsL3VuZGVmaW5lZCBhbmQgbGV0IEFzc0Vycm9yIGRldGVjdCB3aGVuIGl0XG4gIC8vICAgICAgIG1ha2VzIHNlbnNlLlxuXG4gIHZhciBleHBlY3RlZCA9IGV4cC5leHBlY3RlZDtcbiAgLy8gTW9jaGEgd2lsbCB0cnkgdG8ganNvbmlmeSB0aGUgZXhwZWN0ZWQgdmFsdWUsIGp1c3QgaWdub3JlIGlmIGl0J3MgYSBmdW5jdGlvblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdmFyIGluc3QgPSBuZXcgQXNzRXJyb3IoZXJyb3IsIHNzZiB8fCBhcmd1bWVudHMuY2FsbGVlIHx8IHByb3RvLmJ1aWxkRXJyb3IpO1xuICBpbnN0LnNob3dEaWZmID0gZmFsc2U7XG4gIGluc3QuYWN0dWFsID0gbnVsbDtcbiAgaW5zdC5leHBlY3RlZCA9IG51bGw7XG4gIHJldHVybiBpbnN0O1xufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIFRoZSByZXN1bHQgaXMgYWx3YXlzIGFcbi8vIGJvb2xlYW4gaW5kaWNhdGluZyB0aGUgb3V0Y29tZSBvciBhbiB1bmRlZmluZWQgdG8gc2lnbmFsIHRoYXQgaXQgcmVhY2hlZFxuLy8gYW4gYXN5bmNocm9ub3VzIGZsb3cuXG5wcm90by50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBSZXNvbHZlIHRoZSBjaGFpbiBzdGFydGluZyBmcm9tIHJvb3RcbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyBQZXJmb3JtcyB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhaW4gYnV0IGFkZGl0aW9uYWxseSB3aWxsIHJhaXNlIGFuIGVycm9yXG4vLyBpZiBpdCBmYWlscyB0byBjb21wbGV0ZS4gV2hlbiB0aGUgZXhwcmVzc2lvbiByZXNvbHZlcyBhcyB1bmRlZmluZWQgKGFzeW5jKVxuLy8gaXQnbGwgYmUgYXV0b21hdGljYWxseSBlbmFibGUgaXRzIGRlZmVycmVkIGZsYWcuXG4vLyBUaGUgYHNzZmAgc3RhbmRzIGZvciBTdGFja1RyYWNlRnVuY3Rpb24sIGEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBmdW5jdGlvblxuLy8gdG8gc2hvdyBvbiB0aGUgc3RhY2sgdHJhY2UuXG5wcm90by5hc3NlcnQgPSBmdW5jdGlvbiAoYWN0dWFsLCBzc2YpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgLy8gSnVzdCBpZ25vcmUgaWYgdGhlIGFjdHVhbCB2YWx1ZSBpcyBub3QgcHJlc2VudCB5ZXRcbiAgLy8gVE9ETzogU2hhbGwgaXQgcHJvZHVjZSBhbiBlcnJvcj9cbiAgaWYgKGFjdHVhbCA9PT0gdGhpcy5fX0dVQVJEX18pIHJldHVybiB0aGlzO1xuXG4gIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICB2YXIgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcblxuICAvLyBJdCBmYWlsZWQgc28gcmVwb3J0IGl0IHdpdGggYSBuaWNlIGVycm9yXG4gIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgdGhpcy5idWlsZEVycm9yKHJlc29sdmVyLnJlc29sdmVkLCBzc2YgfHwgdGhpcy5hc3NlcnQpO1xuICB9XG5cbiAgLy8gQ29udmVydCB0aGUgZXhwcmVzc2lvbiBpbnRvIGEgZGVmZXJyZWQgaWYgYW4gYXN5bmMgZXhwZWN0aW9uIHdhcyBmb3VuZFxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIEFzc2VydHMgdGhlIHByb3ZpZGVkIHZhbHVlIGFuZCBpZiBzdWNjZXNzZnVsIHJldHVybnMgdGhlIG9yaWdpbmFsXG4vLyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBjaGFpbiBpbnN0YW5jZS5cbnByb3RvLnRocm91Z2ggPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHRoaXMuYXNzZXJ0KGFjdHVhbCwgcHJvdG8udGhyb3VnaCk7XG4gIHJldHVybiBhY3R1YWw7XG59O1xuXG4vLyBFdmFsdWF0ZXMgdGhlIGV4cHJlc3Npb24gY2hhaW4gcmVwb3J0aW5nIHRoZSBsYXN0IG11dGF0ZWQgdmFsdWUgc2VlbiBpblxuLy8gaXQuIElmIHRoZSBleHByZXNzaW9uIGRvZXMgbm90IGNvbXBsZXRlIGl0J2xsIHJldHVybiB1bmRlZmluZWQuXG5wcm90by5yZXN1bHQgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHZhciByZXN1bHQ7XG5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB0aGlzLnRhcChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgIH0pLnRlc3QoYWN0dWFsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBSZW1vdmUgdGhlIC50YXAgZnJvbSB0aGUgY2hhaW5cbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fX2Rlc2NyaXB0aW9uX18pIHtcbiAgICByZXR1cm4gdGhpcy5fX2Rlc2NyaXB0aW9uX187XG4gIH1cblxuICB2YXIgZGVzY3MgPVxuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfX1xuICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZGVzY3JpcHRpb247IH0pXG4gICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5kZXNjcmlwdGlvbjsgfSk7XG5cbiAgaWYgKGRlc2NzLmxlbmd0aCA+IDEpIHtcbiAgICByZXR1cm4gJygnICsgZGVzY3Muam9pbignLCAnKSArICcpJztcbiAgfSBlbHNlIGlmIChkZXNjcy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gZGVzY3NbMF07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICc8QXNzQ2hhaW4+JztcbiAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENoYWluO1xuIl19
},{"./error":3,"./resolvers":11,"./util":13}],3:[function(require,module,exports){
// API compatible with https://github.com/chaijs/assertion-error/
// This should make integration with Mocha work, including diffed
// output.

var Failure = require('failure');

var unansi = require('./util').unansi;


var AssError = Failure.create('AssError');
var proto = AssError.prototype;

proto.showDiff = false;
proto.actual = null;
proto.expected = null;

function getTargetLine (frames) {
  function getSrc (frame) {
    var fn = frame.getFunction();
    return fn ? fn.toString().replace(/\s+/g, '') : null;
  }

  if (!frames.length) return null;

  // First frame is now the target
  var target = frames[0];
  var targetSrc = getSrc(target);
  if (!targetSrc) {
    return null;
  }

  // Filter out all frames which are not in the same file
  samefile = frames.filter(function (frame) {
    return frame && frame.getFileName() === target.getFileName();
  });

  // Get the closest function in the same file that wraps the target frame
  var wrapper;
  for (var i=1; i < samefile.length; i++) {
    var src = getSrc(samefile[i]);
    if (src && -1 !== src.indexOf(targetSrc)) {
      wrapper = samefile[i];
      break;
    }
  }

  // When a wrapper function is found we can use it to obtain the line we want
  if (wrapper) {
    // Get relative positions
    var relLn = target.getLineNumber() - wrapper.getLineNumber();
    var relCl = target.getLineNumber() === wrapper.getLineNumber()
              ? 0
              : target.getColumnNumber() - 1;

    var lines = target.getFunction().toString().split(/\n/);
    if (lines[relLn]) {
      return lines[relLn];
    }
  }

  return null;
}

proto.toJSON = function (stack) {
  var props = {
    name: this.name,
    message: unansi(this.message),
    actual: this.actual,
    expected: this.expected,
    showDiff: this.showDiff
  };

  // include stack if exists and not turned off
  if (stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

proto.toString = function () {
  var msg = Failure.prototype.toString.call(this);

  var line = getTargetLine(this.frames);
  if (line) {
    msg += '\n  >> ' + line.replace(/^\s+/, '').slice(0, 60) + '\n';
  }

  return msg;
};



module.exports = AssError;

},{"./util":13,"failure":19}],4:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var Chain = require('./chain');
var Matcher = require('./matcher');

var template = require('./util').template;


// Expectation represents an instantiated Matcher already configured with
// any additional arguments.
function Expectation (matcher, args) {
  // Get the matcher configuration into this instance
  matcher.assign(this);

  // Support being given an `arguments` object
  this.args = _.toArray(args);
  this.actual = undefined;
}

// Inherit the prototype from Matcher
var proto = Expectation.prototype = Object.create(Matcher.prototype);
proto.constructor = Expectation;

// Generate getter for `.expected` (an alias for args[0])
Object.defineProperty(proto, 'expected', {
  get: function () {
    return this.args[0];
  },
  // Hack: allow it to be overriden on the instance
  set: function (v) {
    Object.defineProperty(this, 'expected', {
      value: v
    });
  }
});

// Generate getters for the first 5 arguments as arg1, arg2, ...
_.times(5, function (i) {
  Object.defineProperty(proto, 'arg' + (i + 1), {
    get: function () {
      return this.args[i];
    }
  });
});

// Compute the description message for the current state of the expectation
Object.defineProperty(proto, 'description', {
  get: function () {
    if (!this.desc) {
      return null;
    }
    if (typeof this.desc === 'function') {
      return this.desc(this);
    }
    return template(this.desc, this);
  }
});

// Compute the failure message for the current state of the expectation
Object.defineProperty(proto, 'failure', {
  get: function () {
    if (typeof this.fail === 'function') {
      return this.fail(this);
    }
    return template(this.fail, this);
  }
});

// Helper to mutate the value under test
Expectation.prototype.mutate = function (value) {
  return function (resolver) {
    return resolver(value);
  };
};

// Resolving can override the expectation state, if that's not desirable make
// sure that this method is called in a new context.
Expectation.prototype.resolve = function () {
  var args, result;

  // Execute the matcher test now that everything is set
  args = [this.actual].concat(this.args);
  result = this.test.apply(this, args);

  // Returning a string overrides the mismatch description
  if (typeof result === 'string') {
    this.fail = result;
    result = false;
  }

  return result;
};

Expectation.prototype.toString = function () {
  return this.description;
};


module.exports = Expectation;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9leHBlY3RhdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ18nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ18nXSA6IG51bGwpO1xuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG52YXIgTWF0Y2hlciA9IHJlcXVpcmUoJy4vbWF0Y2hlcicpO1xuXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3V0aWwnKS50ZW1wbGF0ZTtcblxuXG4vLyBFeHBlY3RhdGlvbiByZXByZXNlbnRzIGFuIGluc3RhbnRpYXRlZCBNYXRjaGVyIGFscmVhZHkgY29uZmlndXJlZCB3aXRoXG4vLyBhbnkgYWRkaXRpb25hbCBhcmd1bWVudHMuXG5mdW5jdGlvbiBFeHBlY3RhdGlvbiAobWF0Y2hlciwgYXJncykge1xuICAvLyBHZXQgdGhlIG1hdGNoZXIgY29uZmlndXJhdGlvbiBpbnRvIHRoaXMgaW5zdGFuY2VcbiAgbWF0Y2hlci5hc3NpZ24odGhpcyk7XG5cbiAgLy8gU3VwcG9ydCBiZWluZyBnaXZlbiBhbiBgYXJndW1lbnRzYCBvYmplY3RcbiAgdGhpcy5hcmdzID0gXy50b0FycmF5KGFyZ3MpO1xuICB0aGlzLmFjdHVhbCA9IHVuZGVmaW5lZDtcbn1cblxuLy8gSW5oZXJpdCB0aGUgcHJvdG90eXBlIGZyb20gTWF0Y2hlclxudmFyIHByb3RvID0gRXhwZWN0YXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShNYXRjaGVyLnByb3RvdHlwZSk7XG5wcm90by5jb25zdHJ1Y3RvciA9IEV4cGVjdGF0aW9uO1xuXG4vLyBHZW5lcmF0ZSBnZXR0ZXIgZm9yIGAuZXhwZWN0ZWRgIChhbiBhbGlhcyBmb3IgYXJnc1swXSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2V4cGVjdGVkJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hcmdzWzBdO1xuICB9LFxuICAvLyBIYWNrOiBhbGxvdyBpdCB0byBiZSBvdmVycmlkZW4gb24gdGhlIGluc3RhbmNlXG4gIHNldDogZnVuY3Rpb24gKHYpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2V4cGVjdGVkJywge1xuICAgICAgdmFsdWU6IHZcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIEdlbmVyYXRlIGdldHRlcnMgZm9yIHRoZSBmaXJzdCA1IGFyZ3VtZW50cyBhcyBhcmcxLCBhcmcyLCAuLi5cbl8udGltZXMoNSwgZnVuY3Rpb24gKGkpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnYXJnJyArIChpICsgMSksIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmFyZ3NbaV07XG4gICAgfVxuICB9KTtcbn0pO1xuXG4vLyBDb21wdXRlIHRoZSBkZXNjcmlwdGlvbiBtZXNzYWdlIGZvciB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZXhwZWN0YXRpb25cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2Rlc2NyaXB0aW9uJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdGhpcy5kZXNjID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZXNjKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcGxhdGUodGhpcy5kZXNjLCB0aGlzKTtcbiAgfVxufSk7XG5cbi8vIENvbXB1dGUgdGhlIGZhaWx1cmUgbWVzc2FnZSBmb3IgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGV4cGVjdGF0aW9uXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdmYWlsdXJlJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuZmFpbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuZmFpbCh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlKHRoaXMuZmFpbCwgdGhpcyk7XG4gIH1cbn0pO1xuXG4vLyBIZWxwZXIgdG8gbXV0YXRlIHRoZSB2YWx1ZSB1bmRlciB0ZXN0XG5FeHBlY3RhdGlvbi5wcm90b3R5cGUubXV0YXRlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIodmFsdWUpO1xuICB9O1xufTtcblxuLy8gUmVzb2x2aW5nIGNhbiBvdmVycmlkZSB0aGUgZXhwZWN0YXRpb24gc3RhdGUsIGlmIHRoYXQncyBub3QgZGVzaXJhYmxlIG1ha2Vcbi8vIHN1cmUgdGhhdCB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgaW4gYSBuZXcgY29udGV4dC5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncywgcmVzdWx0O1xuXG4gIC8vIEV4ZWN1dGUgdGhlIG1hdGNoZXIgdGVzdCBub3cgdGhhdCBldmVyeXRoaW5nIGlzIHNldFxuICBhcmdzID0gW3RoaXMuYWN0dWFsXS5jb25jYXQodGhpcy5hcmdzKTtcbiAgcmVzdWx0ID0gdGhpcy50ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuXG4gIC8vIFJldHVybmluZyBhIHN0cmluZyBvdmVycmlkZXMgdGhlIG1pc21hdGNoIGRlc2NyaXB0aW9uXG4gIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuZmFpbCA9IHJlc3VsdDtcbiAgICByZXN1bHQgPSBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRlc2NyaXB0aW9uO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cGVjdGF0aW9uO1xuIl19
},{"./chain":2,"./matcher":5,"./util":13}],5:[function(require,module,exports){
// The Matcher object is a descriptor for the matching logic but cannot
// be used directly. Use an Expectation to get an initialized matcher.
function Matcher (name, descriptor) {

  // Shortcut for simple test functions
  if (typeof descriptor === 'function') {
    descriptor = {test: descriptor};
  }

  // The generic name of the matcher
  this.name = name;

  if (Array.isArray(descriptor.help)) {
    this.help = descriptor.help.join('\n');
  } else {
    this.help = descriptor.help || 'Not available';
  }

  // Either a template string or a function that will receive as only
  // argument an Expectation instance (called as a method of it).
  this.desc = descriptor.desc !== undefined
            ? descriptor.desc
            : this.name;

  // Either a template string or a function that will receive as only
  // argument an Expectation instance (called as a method of it).
  this.fail = descriptor.fail || 'was {{ actual }}';

  if (!descriptor.test) {
    throw new Error('test function not defined for the matcher');
  }
  this.test = descriptor.test;

  this.arity = descriptor.arity !== undefined
             ? descriptor.arity
             : this.test.length;
}

Matcher.prototype = Object.create(null);
Matcher.prototype.constructor = Matcher;

Matcher.prototype.clone = function () {
  return new this.constructor(this.name, {
    help: this.help,
    desc: this.desc,
    fail: this.fail,
    test: this.test,
    arity: this.arity
  });
};

// Augment another object with the properties of this matcher
Matcher.prototype.assign = function (obj) {
  obj.help = this.help;
  obj.desc = this.desc;
  obj.fail = this.fail;
  obj.test = this.test;
  obj.arity = this.arity;
};

Matcher.prototype.toString = function () {
  return '<Ass.Matcher ' + this.name + '>';
};


module.exports = Matcher;

},{}],6:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var ass = require('../ass');

// Given the arguments with the branches make sure they are all expressions
function wrapArgs (args) {
  return _.toArray(args).slice(1).map(function (branch) {
    return ass.Chain.isChain(branch) ? branch : ass.eql(branch);
  });
}

ass.register({

  and: {
    help: [
      'Composes a new expectation from two or more expressions, which will only',
      'succeed if all the expressions that form it do indeed succeed.',
      'Note: evaluation will stop as soon as one of the expressions fails.'
    ],
    desc: '${ args.join(" AND ") }',
    fail: 'was {{ actual }}',
    test: function (actual, branch1, branch2) {
      var branches = wrapArgs(arguments);
      return function (resolver) {
        // Check if all branches pass the test
        var undefs = 0;
        var result = _.every(branches, function (branch) {
          var partial = branch.test(actual);
          if (partial === undefined) {
            if (!resolver.paused) {
              resolver.pause();
            }
            undefs += 1;
            branch.then(_.once(function () {
              undefs -= 1;
              if (0 === undefs) {
                resolver.resume(actual);
              }
            }), _.once(function () {
              resolver.resume(null, false);
            }));

            return true; // keep iterating
          }

          return partial;
        });

        if (resolver.paused) {
          return undefined;
        }

        // Take care of any expectations later in the chain
        if (result === true) {
          result = resolver(actual);
        }

        return result;
      };
    }
  },
  or: {
    help: [
      'Composes a new expectation from two or more expressions, which will only',
      'succeed if at least one of the expressions does.',
      'Note: evaluation will stop as soon as one of the expressions succeeds.'
    ],
    desc: '${ args.join(" OR ") }',
    fail: 'was {{ actual }}',
    test: function (actual, branch1, branch2) {
      var branches = wrapArgs(arguments);
      return function (resolver) {
        // Check if all branches pass the test
        var undefs = 0;
        var result = _.some(branches, function (branch) {
          var partial = branch.test(actual);
          if (partial === undefined) {
            if (!resolver.paused) {
              resolver.pause();
            }
            undefs += 1;
            branch.then(_.once(function () {
              resolver.resume(actual);
            }), _.once(function () {
              undefs -= 1;
              if (0 === undefs) {
                resolver.resume(null, false);
              }
            }));

            return false; // keep iterating
          }

          return partial;
        });

        if (resolver.paused) {
          return undefined;
        }

        // Take care of any expectations later in the chain
        if (result === true) {
          result = resolver(actual);
        }

        return result;
      };
    }
  },
  xor: {
    help: [
      'Composes a new expectation from two or more expressions, which will only',
      'succeed if at least one of the expressions does but not all of them.'
    ],
    desc: '${ args.join(" XOR ") }',
    fail: 'was {{ actual }}',
    test: function (actual, branch1, branch2) {
      var branches = wrapArgs(arguments);
      return function (resolver) {
        // Check if all branches pass the test
        var undefs = 0;
        var oks = 0;
        var kos = 0;
        _.forEach(branches, function (branch) {
          var partial = branch.test(actual);
          if (partial === undefined) {
            if (!resolver.paused) {
              resolver.pause();
            }
            undefs += 1;
            branch.then(_.once(function () {
              if (kos > 0) {
                resolver.resume(actual);
                return;
              }
              oks += 1;
              undefs -= 1;
              if (0 === undefs) {
                resolver.resume(actual, oks > 0 && kos > 0 ? undefined : false);
              }
            }), _.once(function () {
              if (oks > 0) {
                resolver.resume(actual);
                return;
              }
              kos += 1;
              undefs -= 1;
              if (0 === undefs) {
                resolver.resume(actual, oks > 0 && kos > 0 ? undefined : false);
              }
            }));

          } else if (partial === true) {
            oks += 1;
          } else if (partial === false) {
            kos += 1;
          }
        });

        if (resolver.paused) {
          return undefined;
        }

        return oks > 0 && kos > 0 ? resolver(actual) : false;
      };
    }
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tYXRjaGVycy9jb29yZGluYXRpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ18nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ18nXSA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cbi8vIEdpdmVuIHRoZSBhcmd1bWVudHMgd2l0aCB0aGUgYnJhbmNoZXMgbWFrZSBzdXJlIHRoZXkgYXJlIGFsbCBleHByZXNzaW9uc1xuZnVuY3Rpb24gd3JhcEFyZ3MgKGFyZ3MpIHtcbiAgcmV0dXJuIF8udG9BcnJheShhcmdzKS5zbGljZSgxKS5tYXAoZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgIHJldHVybiBhc3MuQ2hhaW4uaXNDaGFpbihicmFuY2gpID8gYnJhbmNoIDogYXNzLmVxbChicmFuY2gpO1xuICB9KTtcbn1cblxuYXNzLnJlZ2lzdGVyKHtcblxuICBhbmQ6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgZXhwZWN0YXRpb24gZnJvbSB0d28gb3IgbW9yZSBleHByZXNzaW9ucywgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGFsbCB0aGUgZXhwcmVzc2lvbnMgdGhhdCBmb3JtIGl0IGRvIGluZGVlZCBzdWNjZWVkLicsXG4gICAgICAnTm90ZTogZXZhbHVhdGlvbiB3aWxsIHN0b3AgYXMgc29vbiBhcyBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIGZhaWxzLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgQU5EIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gd3JhcEFyZ3MoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciByZXN1bHQgPSBfLmV2ZXJ5KGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8ga2VlcCBpdGVyYXRpbmdcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGFydGlhbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGV4cGVjdGF0aW9ucyBsYXRlciBpbiB0aGUgY2hhaW5cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIG9yOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgZXhwcmVzc2lvbnMsIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIGRvZXMuJyxcbiAgICAgICdOb3RlOiBldmFsdWF0aW9uIHdpbGwgc3RvcCBhcyBzb29uIGFzIG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgc3VjY2VlZHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBPUiBcIikgfScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IHdyYXBBcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgcmVzdWx0ID0gXy5zb21lKGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgfSksIF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIGtlZXAgaXRlcmF0aW5nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhcnRpYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFrZSBjYXJlIG9mIGFueSBleHBlY3RhdGlvbnMgbGF0ZXIgaW4gdGhlIGNoYWluXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICB4b3I6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgZXhwZWN0YXRpb24gZnJvbSB0d28gb3IgbW9yZSBleHByZXNzaW9ucywgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgZG9lcyBidXQgbm90IGFsbCBvZiB0aGVtLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgWE9SIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gd3JhcEFyZ3MoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciBva3MgPSAwO1xuICAgICAgICB2YXIga29zID0gMDtcbiAgICAgICAgXy5mb3JFYWNoKGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChrb3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG9rcyArPSAxO1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwsIG9rcyA+IDAgJiYga29zID4gMCA/IHVuZGVmaW5lZCA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksIF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChva3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGtvcyArPSAxO1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwsIG9rcyA+IDAgJiYga29zID4gMCA/IHVuZGVmaW5lZCA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0aWFsID09PSB0cnVlKSB7XG4gICAgICAgICAgICBva3MgKz0gMTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRpYWwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBrb3MgKz0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9rcyA+IDAgJiYga29zID4gMCA/IHJlc29sdmVyKGFjdHVhbCkgOiBmYWxzZTtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuIl19
},{"../ass":1}],7:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var ass = require('../ass');
var util = require('../util');

// Set of default matchers
ass.register({
  // TODO: Move this to the Chain prototype
  desc: {
    help: 'Provide a custom description for reported failures',
    desc: null,  // Skip it from reports
    test: function (actual, desc) {
      // Note that the description won't be set until the chain is resolved,
      // at least once, reaching this expectation.
      return function (resolver) {
        resolver.chain.__description__ = desc;
        return resolver(actual);
      };
    }
  },

  // Ignored matchers
  to: {
    aliases: [ 'a', 'an', 'be' ],
    help: [
      'Just some syntax sugar to make the expectations easier on the eyes.'
    ],
    desc: null,
    test: function (actual) {
      return true;
    }
  },

  mark: {
    help: [
      'Increases the global `ass.marks` counter every time it gets',
      'evaluated as part of an expression. Use it to verify that the',
      'preceding expectations are actually being executed.',
      'An easy way to support this when using a test runner is to reset',
      'the counter by calling `ass.marks()` on a beforeEach hook and',
      'then verify at the end of test with `ass.marks(N)` (where N is',
      'the number of marks you expected).'
    ],
    desc: null,
    test: function (actual) {
      ass.marks.counter += 1;
      return true;
    }
  },

  // Just allow anything :)
  any: {
    help: 'Allows any value without testing it.',
    desc: 'is anything',
    test: function (actual) {
      return true;
    }
  },
  // Anything that isn't null or undefined
  defined: {
    help: 'Checks if the value is not null or undefined.',
    desc: 'is defined',
    fail: 'was ${ actual }',
    test: function (actual) {
      return null != actual;
    }
  },
  // Check if the value is empty
  empty: {
    help: 'Checks if the value is empty (or has a length of 0).',
    desc: 'is empty',
    fail: 'was ${ actual }',
    test: function (actual) {
      return null == actual || actual.length === 0;
    }
  },
  nempty: {
    aliases: [ 'nonEmpty' ],
    help: 'Checks if the value is not empty (or has a length greater than 0).',
    desc: 'is not empty',
    fail: 'was ${ actual }',
    test: function (actual) {
      return null != actual && actual.length > 0;
    }
  },
  truthy: {
    aliases: [ 'truish' ],
    help: 'The value should be truthy (not undefined, null, 0, "" or []).',
    desc: 'is truthy',
    fail: 'was ${ actual }',
    test: function (actual) {
      if (!actual) return false;
      return typeof actual.length === 'number' ? actual.length > 0 : true;
    }
  },
  falsy: {
    help: 'The value should be falsy (undefined, null, 0, "" or []).',
    desc: 'is falsy',
    fail: 'was {{ actual }}',
    test: function (actual) {
      if (!actual) return true;
      return typeof actual.length === 'number' ? actual.length === 0 : false;
    }
  },

  // Negation
  not: {
    aliases: [ 'no', 'NO', 'NOT' ],
    help: 'Negates the result for the rest of the expression.',
    desc: 'Not!',
    fail: 'was {{ actual }}',
    test: function (actual) {
      return function (resolver) {

        if (resolver.exhausted) {
          return true;
        }

        resolver.finalize(function (final) {
          return !final;
        });

        return resolver(actual);
      };
    }
  },

  is: {
    aliases: [ 'equal', 'equals' ],
    help: [
      'Checks strict equality between the value and its expected.',
      'Note: if the expected value is a chain expression it\'ll be tested instead.'
    ],
    desc: 'to strictly equal {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      // this is a bit contrived but it makes for some nice syntax to be able to
      // use .is for passing in expectations
      if (ass.Chain.isChain(expected)) {
        return expected.test(actual);
      }

      return actual === expected;
    }
  },
  eq: {
    aliases: [ 'eql', 'eqls' ],
    help: [
      'Checks deep non-strict equality between the value and its expected.',
      'It understands ass expressions so you can combine them at will in the',
      'expected value.'
    ],
    desc: 'to equal {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return _.isEqual(actual, expected);
    }
  },

  match: {
    help: [
      'Tries to match the subject against the expected value which can be either',
      'a function, an ass expression, an object with a .test() function (for ',
      'instance a RegExp) or a plain object to partially match against the value.'
    ],
    desc: 'to match {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {

      if (typeof expected.test === 'function') {
        return !!expected.test(actual);
      }

      if (_.isPlainObject(expected) || _.isArray(expected) || _.isArguments(expected)) {

        if (null == actual) {
          return false;
        }

        // Support passing `[,'foo']` to mean `[ass.any, 'foo']`
        if (_.isArray(expected) || _.isArguments(expected)) {
          expected = _.map(expected, function (v) {
            return typeof v === 'undefined' ? ass.any : v;
          });
        }

        // TODO: Ideally we should "fork" the resolver so we can support
        //       async tests and also provide better failure messages.
        //       Unfortunately the current forking mechanism doesn't work
        //       for this use case since we need to create new chains for
        //       each expected key.
        var failure = true;
        _(expected).every(function (value, key) {
          if (!_.has(actual, key)) {
            failure = 'key "' + key + '" not found in {{actual}}';
            return false;
          }

          if (!_.isEqual(actual[key], value)) {
            failure = 'key "' + key + '" does not match {{actual["' + key + '"]}}';
            return false;
          }

          return true;
        });

        return failure;
      }

      if (typeof expected !== 'function') {
        return 'expected is not a function and does not have a .test method';
      }

      return !!expected(actual);
    }
  },

  above: {
    aliases: [ 'gt', 'moreThan', 'greaterThan' ],
    help: 'Checks if the value is higher than its expected.',
    desc: 'to be more than {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return actual > expected;
    }
  },

  below: {
    aliases: [ 'lt', 'lessThan' ],
    help: 'Checks if the value is lower tha its expected.',
    desc: 'to be less than {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return actual < expected;
    }
  },

  aboveOrEqual: {
    aliases: [ 'least', 'atLeast', 'gte', 'moreThanOrEqual', 'greaterThanOrEqual' ],
    help: 'Checks if the value is higher or equal than its expected.',
    desc: 'to be more than or equal to ${expected}',
    fail: 'was {{actual}}',
    test: function (actual, expected) {
      return actual >= expected;
    }
  },

  belowOrEqual: {
    aliases: [ 'most', 'atMost', 'lte', 'lessThanOrEqual' ],
    help: 'Checks if the value is lower or equal than its expected.',
    desc: 'to be less than or equal to ${expected}',
    fail: 'was ${actual}',
    test: function (actual, expected) {
      return actual <= expected;
    }
  },

  close: {
    aliases: [ 'closeTo' ],
    help: [
      'Checks if the value is close to the expected based on a given delta.',
      'The default delta is 0.1 so the value 3.55 is close to any value between',
      '3.45 and 3.65 (both inclusive).',
      'String values are also supported by computing the distance between them',
      'using the Sift4 algorithm. For string values the delta is interpreted as',
      'a percentage (ie: 0.25 is 25%).'
    ],
    desc: 'to be close to {{ expected }}',
    fail: 'was {{ actual }}',
    test: function (actual, expected, delta) {
      delta = null == delta ? 0.1 : delta;

      // Support strings by computing their distance
      if (_.isString(actual) && _.isString(expected)) {
        var diff = util.sift4(actual, expected, 3) / Math.max(actual.length, expected.length);
        return diff <= delta;
      }

      return actual >= expected - delta && actual <= expected + delta;
    }
  },

  instanceof: {
    aliases: [ 'instanceOf', 'instance', 'isa' ],
    help: [
      'Checks if the value is an instance of the given constructor.',
      'When the expected is a string it\'ll actually use a `typeof`',
      'comparison.'
    ],
    desc: 'to be an instance of {{expected}}',
    test: function (actual, expected) {
      if (_.isString(expected)) {
        return typeof actual === expected ? true : 'had type {{ typeof actual }}';
      }
      return actual instanceof expected;
    }
  },

  typeof: {
    help: 'Checks if the value is of a specific type',
    desc: 'to have type {{expected}}',
    fail: 'had ${ typeof actual }',
    test: function (actual, expected) {
      return _.isEqual(typeof actual, expected);
    }
  },
  number: {
    help: 'Check if the value is a number (different of NaN).',
    desc: 'to be a number',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isNumber(actual) && !isNaN(actual);
    }
  },
  bool: {
    aliases: [ 'boolean' ],
    help: 'Check if the value is a boolean.',
    desc: 'to be a boolean',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isBoolean(actual);
    }
  },
  string: {
    aliases: [ 'str' ],
    help: 'Check if the value is a string.',
    desc: 'to be a string',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isString(actual);
    }
  },
  object: {
    help: 'Check that value is of type object.',
    desc: 'to be an object',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isObject(actual);
    }
  },
  plainObject: {
    aliases: [ 'plain', 'obj' ],
    help: 'Checks that value is an object created by the Object constructor.',
    fail: 'was ${actual}',
    test: function (actual) {
      return _.isPlainObject(actual);
    }
  },
  array: {
    help: 'Check that value is an Array.',
    desc: 'to be an Array',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isArray(actual);
    }
  },
  function: {
    help: 'Check that value is a Function.',
    desc: 'to be a Function',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isFunction(actual);
    }
  },
  regexp: {
    help: 'Check that value is a RegExp',
    desc: 'to be a RegExp',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isRegExp(actual);
    }
  },
  date: {
    help: 'Check that value is a Date',
    desc: 'to be a Date',
    fail: 'had type ${ typeof actual }',
    test: function (actual) {
      return _.isDate(actual);
    }
  },
  element: {
    help: 'Check that value is a DOM element',
    desc: 'to be a DOM element',
    test: function (actual) {
      return _.isElement(actual);
    }
  },
  error: {
    help: 'Check that value is an error (or looks like it)',
    desc: 'to be an Error',
    test: function (actual) {
      if (actual instanceof Error) {
        return true;
      }
      return _.isObject(actual) && _.isString(actual.name) && _.isString(actual.message);
    }
  },

  undefined: {
    help: 'Check that value is undefined.',
    desc: 'to be undefined',
    fail: 'was ${ actual }',
    test: function (actual) {
      return _.isUndefined(actual);
    }
  },
  null: {
    help: 'Check that value is null.',
    desc: 'to be null',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual === null;
    }
  },
  NaN: {
    help: 'Check that value is NaN.',
    desc: 'to be NaN',
    test: function (actual) {
      if (_.isNumber(actual)) {
        this.fail = 'was ${actual}';
      } else {
        this.fail = 'had type ${typeof actual}';
      }
      return isNaN(actual);
    }
  },
  true: {
    help: 'Check that value is true',
    desc: 'to be true',
    fail: 'was {{ actual }}',
    test: function (actual) {
      if (_.isBoolean(actual)) {
        return actual ? true : 'was {{actual}}';
      } else {
        return 'had type ${typeof actual}';
      }
    }
  },
  false: {
    help: 'Check that value is false',
    desc: 'to be false',
    test: function (actual) {
      if (_.isBoolean(actual)) {
        return !actual ? true : 'was {{actual}}';
      } else {
        return 'had type ${typeof actual}';
      }
    }
  },

  raises: {
    aliases: [ 'throws' ],
    help: [
      'Checks that executing the value results in an exception being thrown.',
      'The captured exception value is used to mutate the subject for the',
      'following expectations.'
    ],
    desc: 'throws an error',
    test: function (actual, expected) {
      if (!_.isFunction(actual)) {
        return 'is not a function: {{actual}}';
      }

      try {
        actual();
        return 'did not throw anything';
      } catch (e) {
        if (null == expected) {
          return this.mutate(e);
        }
        if (_.isFunction(expected) && e instanceof expected) {
          return this.mutate(e);
        }
        if (_.isEqual(e, expected)) {
          return this.mutate(e);
        }

        // Augment the expectation object with a new template variable
        this.exception = e;
        return 'got {{ exception }}';
      }
    }
  },

  has: {
    aliases: [ 'have', 'contain', 'contains' ],
    help: [
      'Check if the value has some expected value. It understands expected',
      'chain expressions so this serves as the equivalent of .eq for partial',
      'matches.'
    ],
    desc: 'to contain {{expected}}',
    fail: 'was {{actual}}',
    test: function (actual, arg1 /*, ... */) {

      // allow multiple expected values
      var expected = _.toArray(arguments).slice(1);
      this.expected = expected.length === 1 ? expected[0] : expected;

      if (!_.isString(actual) && !_.isArray(actual) && !_.isObject(actual)) {
        return 'got {{actual}}';
      }

      return _.every(expected, function (expected) {
        if (_.isString(actual) && _.isString(expected)) {
          return -1 !== actual.indexOf(expected);
        }

        if (_.isArray(actual)) {
          // TODO: Isn't there an easier way to test this using lodash only?
          if (!ass.Chain.isChain(expected)) {
            expected = ass.eq(expected);
          }
          return -1 !== _.findIndex(actual, expected);
        }

        // Hack: Compare objects with .where by filtering a wrapper array
        return 1 === _.where([actual], expected).length;
      });
    }
  },
  hasOwn: {
    aliases: [ 'hasKey', 'hasIndex' ],
    help: [
      'Check if the value has one or more own properties as defined by',
      'the given arguments.'
    ],
    desc: 'to have own property ${ expected }',
    test: function (actual, expected) {
      if (!_.isObject(actual)) {
        return 'was {{actual}}';
      }

      this.fail = 'only had {{ _.keys(actual) }}';

      // TODO: Offer better failure message
      var args = _.toArray(arguments).slice(1);
      return _.every(args, function (x) { return _.has(actual, x); });
    }
  },

  log: {
    help: [
      'Dumps the received value to the console.'
    ],
    desc: null,
    test: function (actual) {
      console.log('[ASS]', actual);
      return true;
    }
  },
  dump: {
    help: [
      'Dumps the received value to the console applying the given template.',
      'Note: Use ${this} to interpolate the whole value.',
      'See: https://lodash.com/docs#template'
    ],
    desc: null,
    test: function (actual, tpl) {
      var result = util.template.call(actual, tpl, actual);
      console.log(result);
      return true;
    }
  },
  debugger: {
    help: [
      'Halts script execution by triggering the interactive debugger.'
    ],
    desc: null,
    test: function (actual) {
      debugger;
      return true;
    }
  },

  tap: {
    aliases: [ 'fn' ],
    help: [
      'Calls the provided function with the current value as argument.',
      'If the function returns something different to *undefined* the',
      'expression will fork to operate on the returned value.',
    ],
    desc: 'call {{arg1}}',
    test: function (actual, fn) {
      var result = fn(actual);
      if (typeof result !== 'undefined') {
        return this.mutate(result);
      }
      return true;
    }
  },
  notify: {
    help: [
      'Similar to .tap() but it won\'t pass the current value as argument,',
      'instead it will be provided as the `this` context when performing the',
      'call. This allows it to be used with test runners `done` style callbacks.',
      'Note that it will neither mutate the value even if it returns something.'
    ],
    desc: 'notify {{arg1}}',
    test: function (actual, fn) {
      fn.call(actual);
      return true;
    }
  },

  size: {
    help: [
      'Forks the expectation to operate on the size of the current value.'
    ],
    desc: 'get size',
    fail: 'not has a length: {{ actual }}',
    test: function (actual) {
      if (_.isObject(actual) || _.isArray(actual) || _.isString(actual)) {
        return this.mutate(_.size(actual));
      }

      return false;
    }
  },
  prop: {
    aliases: [ 'key', 'property' ],
    help: [
      'Forks the expectation to operate on one of the value properties.'
    ],
    desc: 'get property {{ arg1 }}',
    fail: 'was not found on {{ actual }}',
    test: function (actual, key) {
      if (_.isObject(actual)) {
        if (key in actual) {
          return this.mutate(actual[key]);
        }

        this.keys = [];
        _.forIn(actual, function (v, k) { this.keys.push(k); }, this);
        return 'was not found in keys {{ keys }}';
      }
      return 'got {{actual}}';
    }
  },
  at: {
    aliases: [ 'index' ],
    help: [
      'Mutates the value to operate on one of the indexed elements. If',
      'multiple indexes are provided an array is composed with them.',
      'Note: It supports negative indexes'
    ],
    desc: 'get index ${ args.join(", ") }',
    test: function (actual, index) {
      if (!_.isArray(actual) && !_.isString(actual)) {
        return 'not an array or a string: ${actual}';
      }

      var indexes = _.toArray(arguments).slice(1);
      var elems = [];

      for (var i = 0; i < indexes.length; i++) {
        var idx = indexes[i];

        idx = idx < 0 ? actual.length + idx : idx;
        if (idx < 0 || idx >= actual.length) {
          return idx + ' out of bounds for {{actual}}';
        }

        elems.push(actual[idx]);
      }

      return this.mutate(
        elems.length === 1 ? elems[0] : elems
      );
    }
  },

  keys: {
    help: [
      'Mutates the value to operate on its list of own keys.'
    ],
    desc: 'get keys',
    test: function (actual) {
      return this.mutate(
        _.keys(actual)
      );
    }
  },
  values: {
    help: [
      'Mutates the value to operate on its list of values'
    ],
    desc: 'get values',
    test: function (actual) {
      return this.mutate(
        _.values(actual)
      );
    }
  },

  slice: {
    help: [
      'Extracts a portion from the value.'
    ],
    desc: 'slice({{actual}}, ${arg1 || 0})',
    test: function (actual, start, end) {
      return this.mutate(
        _.toArray(actual).slice(start, end)
      );
    }
  },

  filter: {
    help: [
      'Iterates over elements of the collection, forking the expectation to',
      'operate on an array with all the elements for which the callback returned',
      'truthy for.',
      'See: https://lodash.com/docs#filter'
    ],
    test: function (actual, callback, thisArg) {
      return this.mutate(
        _.filter(actual, callback, thisArg)
      );
    }
  },
  reject: {
    help: [
      'Iterates over elements of collection, forking the expectation to operate',
      'on an array with all the elements for which the callback returned falsy',
      'for (the opposite of .filter).',
      'See: https://lodash.com/docs#reject'
    ],
    test: function (actual, callback, thisArg) {
      return this.mutate(
        _.reject(actual, callback, thisArg)
      );
    }
  },

  where: {
    help: [
      'Performs a deep comparison of each element in a collection to the given',
      'properties object, forking the expectation to operate on an array of all',
      'elements that have equivalent property values.',
      'See: https://lodash.com/docs#where'
    ],
    desc: 'where {{arg1}}',
    test: function (actual, props) {
      if (!_.isPlainObject(props)) {
        return 'props is not an object';
      }
      return this.mutate(
        _.where(actual, props)
      );
    }
  },

  map: {
    help: [
      'Forks the expectation to operate on an array holding the results of',
      'invoking the callback for each element in the current collection.',
      'See: https://lodash.com/docs#map'
    ],
    test: function (actual, callback, thisArg) {
      return this.mutate(
        _.map(actual, callback, thisArg)
      );
    }
  },

  method: {
    help: [
      'Forks the expectation to operate on the result of invoking the named',
      'method on the subject value.',
    ],
    desc: "method .${arg1}()",
    test: function (actual, method, arg) {
      if (typeof actual[method] !== 'function') {
        return '${arg1} is not a method in {{actual}}';
      }

      var args = _.toArray(arguments).slice(2);
      return this.mutate(
        actual[method].apply(actual, args)
      );
    }
  },

  invoke: {
    help: [
      'Forks the expectation to operate on an array holding the results of',
      'invoking the method named by the argument for each element in the',
      'current collection.',
      'See: https://lodash.com/docs#invoke'
    ],
    desc: "invoke .${arg1}()",
    test: function (actual, method, arg) {
      return this.mutate(
        _.invoke.apply(_, arguments)
      );
    }
  },

  pluck: {
    help: [
      'Mutates the value to be the one of the specific property for all elements',
      'in the current collection.',
      'See: https://lodash.com/docs#pluck'
    ],
    desc: 'pluck( {{arg1}} )',
    test: function (actual, prop) {
      return this.mutate(
        _.pluck(actual, prop)
      );
    }
  },

  first: {
    aliases: [ 'head' ],
    help: [
      'TODO',
      'See: https://lodash.com/docs#first'
    ],
    desc: 'get first element',
    test: function (actual) {
      return this.mutate(
        _.head(actual)
      );
    }
  },
  last: {
    help: [
      'TODO',
      'See: https://lodash.com/docs#last'
    ],
    test: function (actual) {
      return this.mutate(
        _.last(actual)
      );
    }
  },
  rest: {
    aliases: [ 'tail' ],
    help: [
      'TODO',
      'See: https://lodash.com/docs#rest'
    ],
    test: function (actual) {
      return this.mutate(
        _.tail(actual)
      );
    }
  },

  min: {
    help: [
      'Mutates the subject to be the minimum value found on the collection.',
      'See: https://lodash.com/docs#min'
    ],
    test: function (actual) {
      return this.mutate(
        _.min(actual)
      );
    }
  },
  max: {
    help: [
      'Mutates the subject to be the maximum value found on the collection.',
      'See: https://lodash.com/docs#max'
    ],
    test: function (actual) {
      return this.mutate(
        _.max(actual)
      );
    }
  },

  sort: {
    help: [
      'Mutates the value to be sorted in ascending order.',
      'See: https://lodash.com/docs#sortBy'
    ],
    desc: 'sort',
    test: function (actual, callback, thisArg) {
      // Allow the use of expressions as callbacks
      if (callback instanceof ass.Chain) {
        callback = callback.result;
      }

      return this.mutate(
        _.sortBy(actual, callback, thisArg)
      );
    }
  },

  store: {
    help: [
      'Helper to store a reference to the current value being evaluated in the',
      'expression in some other object. It expects a target object and optionally',
      'the name of a property. If target is a function it\'ll receive the value',
      'using `prop` as this context. If `prop` is not provided and `target` is an',
      'array the value will be pushed to it.'
    ],
    desc: 'store',
    test: function (actual, target, prop) {
      if (_.isFunction(target)) {
        target.call(prop, actual);
      } else if (prop === undefined) {
        if (_.isArray(target)) {
          target.push(actual);
        } else {
          return 'prop undefined and target is not an array or a function: {{arg1}}';
        }
      } else if (_.isObject(target)) {
        target[prop] = actual;
      } else {
        return 'target is not an object: {{arg1}}';
      }

      return true;
    }
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tYXRjaGVycy9jb3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8vIFNldCBvZiBkZWZhdWx0IG1hdGNoZXJzXG5hc3MucmVnaXN0ZXIoe1xuICAvLyBUT0RPOiBNb3ZlIHRoaXMgdG8gdGhlIENoYWluIHByb3RvdHlwZVxuICBkZXNjOiB7XG4gICAgaGVscDogJ1Byb3ZpZGUgYSBjdXN0b20gZGVzY3JpcHRpb24gZm9yIHJlcG9ydGVkIGZhaWx1cmVzJyxcbiAgICBkZXNjOiBudWxsLCAgLy8gU2tpcCBpdCBmcm9tIHJlcG9ydHNcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBkZXNjKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgdGhlIGRlc2NyaXB0aW9uIHdvbid0IGJlIHNldCB1bnRpbCB0aGUgY2hhaW4gaXMgcmVzb2x2ZWQsXG4gICAgICAvLyBhdCBsZWFzdCBvbmNlLCByZWFjaGluZyB0aGlzIGV4cGVjdGF0aW9uLlxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXNvbHZlci5jaGFpbi5fX2Rlc2NyaXB0aW9uX18gPSBkZXNjO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIC8vIElnbm9yZWQgbWF0Y2hlcnNcbiAgdG86IHtcbiAgICBhbGlhc2VzOiBbICdhJywgJ2FuJywgJ2JlJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdKdXN0IHNvbWUgc3ludGF4IHN1Z2FyIHRvIG1ha2UgdGhlIGV4cGVjdGF0aW9ucyBlYXNpZXIgb24gdGhlIGV5ZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgbWFyazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJbmNyZWFzZXMgdGhlIGdsb2JhbCBgYXNzLm1hcmtzYCBjb3VudGVyIGV2ZXJ5IHRpbWUgaXQgZ2V0cycsXG4gICAgICAnZXZhbHVhdGVkIGFzIHBhcnQgb2YgYW4gZXhwcmVzc2lvbi4gVXNlIGl0IHRvIHZlcmlmeSB0aGF0IHRoZScsXG4gICAgICAncHJlY2VkaW5nIGV4cGVjdGF0aW9ucyBhcmUgYWN0dWFsbHkgYmVpbmcgZXhlY3V0ZWQuJyxcbiAgICAgICdBbiBlYXN5IHdheSB0byBzdXBwb3J0IHRoaXMgd2hlbiB1c2luZyBhIHRlc3QgcnVubmVyIGlzIHRvIHJlc2V0JyxcbiAgICAgICd0aGUgY291bnRlciBieSBjYWxsaW5nIGBhc3MubWFya3MoKWAgb24gYSBiZWZvcmVFYWNoIGhvb2sgYW5kJyxcbiAgICAgICd0aGVuIHZlcmlmeSBhdCB0aGUgZW5kIG9mIHRlc3Qgd2l0aCBgYXNzLm1hcmtzKE4pYCAod2hlcmUgTiBpcycsXG4gICAgICAndGhlIG51bWJlciBvZiBtYXJrcyB5b3UgZXhwZWN0ZWQpLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgYXNzLm1hcmtzLmNvdW50ZXIgKz0gMTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICAvLyBKdXN0IGFsbG93IGFueXRoaW5nIDopXG4gIGFueToge1xuICAgIGhlbHA6ICdBbGxvd3MgYW55IHZhbHVlIHdpdGhvdXQgdGVzdGluZyBpdC4nLFxuICAgIGRlc2M6ICdpcyBhbnl0aGluZycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICAvLyBBbnl0aGluZyB0aGF0IGlzbid0IG51bGwgb3IgdW5kZWZpbmVkXG4gIGRlZmluZWQ6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgbnVsbCBvciB1bmRlZmluZWQuJyxcbiAgICBkZXNjOiAnaXMgZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIG51bGwgIT0gYWN0dWFsO1xuICAgIH1cbiAgfSxcbiAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGVtcHR5XG4gIGVtcHR5OiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgZW1wdHkgKG9yIGhhcyBhIGxlbmd0aCBvZiAwKS4nLFxuICAgIGRlc2M6ICdpcyBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIG51bGwgPT0gYWN0dWFsIHx8IGFjdHVhbC5sZW5ndGggPT09IDA7XG4gICAgfVxuICB9LFxuICBuZW1wdHk6IHtcbiAgICBhbGlhc2VzOiBbICdub25FbXB0eScgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgZW1wdHkgKG9yIGhhcyBhIGxlbmd0aCBncmVhdGVyIHRoYW4gMCkuJyxcbiAgICBkZXNjOiAnaXMgbm90IGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gbnVsbCAhPSBhY3R1YWwgJiYgYWN0dWFsLmxlbmd0aCA+IDA7XG4gICAgfVxuICB9LFxuICB0cnV0aHk6IHtcbiAgICBhbGlhc2VzOiBbICd0cnVpc2gnIF0sXG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgdHJ1dGh5IChub3QgdW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyB0cnV0aHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbC5sZW5ndGggPT09ICdudW1iZXInID8gYWN0dWFsLmxlbmd0aCA+IDAgOiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZmFsc3k6IHtcbiAgICBoZWxwOiAnVGhlIHZhbHVlIHNob3VsZCBiZSBmYWxzeSAodW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyBmYWxzeScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwubGVuZ3RoID09PSAwIDogZmFsc2U7XG4gICAgfVxuICB9LFxuXG4gIC8vIE5lZ2F0aW9uXG4gIG5vdDoge1xuICAgIGFsaWFzZXM6IFsgJ25vJywgJ05PJywgJ05PVCcgXSxcbiAgICBoZWxwOiAnTmVnYXRlcyB0aGUgcmVzdWx0IGZvciB0aGUgcmVzdCBvZiB0aGUgZXhwcmVzc2lvbi4nLFxuICAgIGRlc2M6ICdOb3QhJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmVyLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgICAgIHJldHVybiAhZmluYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgaXM6IHtcbiAgICBhbGlhc2VzOiBbICdlcXVhbCcsICdlcXVhbHMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBzdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgICAgJ05vdGU6IGlmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIGNoYWluIGV4cHJlc3Npb24gaXRcXCdsbCBiZSB0ZXN0ZWQgaW5zdGVhZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gc3RyaWN0bHkgZXF1YWwge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAvLyB0aGlzIGlzIGEgYml0IGNvbnRyaXZlZCBidXQgaXQgbWFrZXMgZm9yIHNvbWUgbmljZSBzeW50YXggdG8gYmUgYWJsZSB0b1xuICAgICAgLy8gdXNlIC5pcyBmb3IgcGFzc2luZyBpbiBleHBlY3RhdGlvbnNcbiAgICAgIGlmIChhc3MuQ2hhaW4uaXNDaGFpbihleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjdHVhbCA9PT0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuICBlcToge1xuICAgIGFsaWFzZXM6IFsgJ2VxbCcsICdlcWxzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgZGVlcCBub24tc3RyaWN0IGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlIGFuZCBpdHMgZXhwZWN0ZWQuJyxcbiAgICAgICdJdCB1bmRlcnN0YW5kcyBhc3MgZXhwcmVzc2lvbnMgc28geW91IGNhbiBjb21iaW5lIHRoZW0gYXQgd2lsbCBpbiB0aGUnLFxuICAgICAgJ2V4cGVjdGVkIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBlcXVhbCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBfLmlzRXF1YWwoYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuXG4gIG1hdGNoOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1RyaWVzIHRvIG1hdGNoIHRoZSBzdWJqZWN0IGFnYWluc3QgdGhlIGV4cGVjdGVkIHZhbHVlIHdoaWNoIGNhbiBiZSBlaXRoZXInLFxuICAgICAgJ2EgZnVuY3Rpb24sIGFuIGFzcyBleHByZXNzaW9uLCBhbiBvYmplY3Qgd2l0aCBhIC50ZXN0KCkgZnVuY3Rpb24gKGZvciAnLFxuICAgICAgJ2luc3RhbmNlIGEgUmVnRXhwKSBvciBhIHBsYWluIG9iamVjdCB0byBwYXJ0aWFsbHkgbWF0Y2ggYWdhaW5zdCB0aGUgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIG1hdGNoIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuXG4gICAgICBpZiAodHlwZW9mIGV4cGVjdGVkLnRlc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICEhZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGV4cGVjdGVkKSB8fCBfLmlzQXJyYXkoZXhwZWN0ZWQpIHx8IF8uaXNBcmd1bWVudHMoZXhwZWN0ZWQpKSB7XG5cbiAgICAgICAgaWYgKG51bGwgPT0gYWN0dWFsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3VwcG9ydCBwYXNzaW5nIGBbLCdmb28nXWAgdG8gbWVhbiBgW2Fzcy5hbnksICdmb28nXWBcbiAgICAgICAgaWYgKF8uaXNBcnJheShleHBlY3RlZCkgfHwgXy5pc0FyZ3VtZW50cyhleHBlY3RlZCkpIHtcbiAgICAgICAgICBleHBlY3RlZCA9IF8ubWFwKGV4cGVjdGVkLCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2ID09PSAndW5kZWZpbmVkJyA/IGFzcy5hbnkgOiB2O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogSWRlYWxseSB3ZSBzaG91bGQgXCJmb3JrXCIgdGhlIHJlc29sdmVyIHNvIHdlIGNhbiBzdXBwb3J0XG4gICAgICAgIC8vICAgICAgIGFzeW5jIHRlc3RzIGFuZCBhbHNvIHByb3ZpZGUgYmV0dGVyIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgICAgIC8vICAgICAgIFVuZm9ydHVuYXRlbHkgdGhlIGN1cnJlbnQgZm9ya2luZyBtZWNoYW5pc20gZG9lc24ndCB3b3JrXG4gICAgICAgIC8vICAgICAgIGZvciB0aGlzIHVzZSBjYXNlIHNpbmNlIHdlIG5lZWQgdG8gY3JlYXRlIG5ldyBjaGFpbnMgZm9yXG4gICAgICAgIC8vICAgICAgIGVhY2ggZXhwZWN0ZWQga2V5LlxuICAgICAgICB2YXIgZmFpbHVyZSA9IHRydWU7XG4gICAgICAgIF8oZXhwZWN0ZWQpLmV2ZXJ5KGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgaWYgKCFfLmhhcyhhY3R1YWwsIGtleSkpIHtcbiAgICAgICAgICAgIGZhaWx1cmUgPSAna2V5IFwiJyArIGtleSArICdcIiBub3QgZm91bmQgaW4ge3thY3R1YWx9fSc7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFfLmlzRXF1YWwoYWN0dWFsW2tleV0sIHZhbHVlKSkge1xuICAgICAgICAgICAgZmFpbHVyZSA9ICdrZXkgXCInICsga2V5ICsgJ1wiIGRvZXMgbm90IG1hdGNoIHt7YWN0dWFsW1wiJyArIGtleSArICdcIl19fSc7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmYWlsdXJlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAnZXhwZWN0ZWQgaXMgbm90IGEgZnVuY3Rpb24gYW5kIGRvZXMgbm90IGhhdmUgYSAudGVzdCBtZXRob2QnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gISFleHBlY3RlZChhY3R1YWwpO1xuICAgIH1cbiAgfSxcblxuICBhYm92ZToge1xuICAgIGFsaWFzZXM6IFsgJ2d0JywgJ21vcmVUaGFuJywgJ2dyZWF0ZXJUaGFuJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGhpZ2hlciB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBtb3JlIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID4gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGJlbG93OiB7XG4gICAgYWxpYXNlczogWyAnbHQnLCAnbGVzc1RoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbG93ZXIgdGhhIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDwgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlT3JFcXVhbDoge1xuICAgIGFsaWFzZXM6IFsgJ2xlYXN0JywgJ2F0TGVhc3QnLCAnZ3RlJywgJ21vcmVUaGFuT3JFcXVhbCcsICdncmVhdGVyVGhhbk9yRXF1YWwnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3dPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnbW9zdCcsICdhdE1vc3QnLCAnbHRlJywgJ2xlc3NUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciBvciBlcXVhbCB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA8PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgY2xvc2U6IHtcbiAgICBhbGlhc2VzOiBbICdjbG9zZVRvJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGNsb3NlIHRvIHRoZSBleHBlY3RlZCBiYXNlZCBvbiBhIGdpdmVuIGRlbHRhLicsXG4gICAgICAnVGhlIGRlZmF1bHQgZGVsdGEgaXMgMC4xIHNvIHRoZSB2YWx1ZSAzLjU1IGlzIGNsb3NlIHRvIGFueSB2YWx1ZSBiZXR3ZWVuJyxcbiAgICAgICczLjQ1IGFuZCAzLjY1IChib3RoIGluY2x1c2l2ZSkuJyxcbiAgICAgICdTdHJpbmcgdmFsdWVzIGFyZSBhbHNvIHN1cHBvcnRlZCBieSBjb21wdXRpbmcgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlbScsXG4gICAgICAndXNpbmcgdGhlIFNpZnQ0IGFsZ29yaXRobS4gRm9yIHN0cmluZyB2YWx1ZXMgdGhlIGRlbHRhIGlzIGludGVycHJldGVkIGFzJyxcbiAgICAgICdhIHBlcmNlbnRhZ2UgKGllOiAwLjI1IGlzIDI1JSkuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGNsb3NlIHRvIHt7IGV4cGVjdGVkIH19JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIGRlbHRhKSB7XG4gICAgICBkZWx0YSA9IG51bGwgPT0gZGVsdGEgPyAwLjEgOiBkZWx0YTtcblxuICAgICAgLy8gU3VwcG9ydCBzdHJpbmdzIGJ5IGNvbXB1dGluZyB0aGVpciBkaXN0YW5jZVxuICAgICAgaWYgKF8uaXNTdHJpbmcoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICB2YXIgZGlmZiA9IHV0aWwuc2lmdDQoYWN0dWFsLCBleHBlY3RlZCwgMykgLyBNYXRoLm1heChhY3R1YWwubGVuZ3RoLCBleHBlY3RlZC5sZW5ndGgpO1xuICAgICAgICByZXR1cm4gZGlmZiA8PSBkZWx0YTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZCAtIGRlbHRhICYmIGFjdHVhbCA8PSBleHBlY3RlZCArIGRlbHRhO1xuICAgIH1cbiAgfSxcblxuICBpbnN0YW5jZW9mOiB7XG4gICAgYWxpYXNlczogWyAnaW5zdGFuY2VPZicsICdpbnN0YW5jZScsICdpc2EnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yLicsXG4gICAgICAnV2hlbiB0aGUgZXhwZWN0ZWQgaXMgYSBzdHJpbmcgaXRcXCdsbCBhY3R1YWxseSB1c2UgYSBgdHlwZW9mYCcsXG4gICAgICAnY29tcGFyaXNvbi4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYW4gaW5zdGFuY2Ugb2Yge3tleHBlY3RlZH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsID09PSBleHBlY3RlZCA/IHRydWUgOiAnaGFkIHR5cGUge3sgdHlwZW9mIGFjdHVhbCB9fSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIHR5cGVvZjoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG9mIGEgc3BlY2lmaWMgdHlwZScsXG4gICAgZGVzYzogJ3RvIGhhdmUgdHlwZSB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICdoYWQgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIF8uaXNFcXVhbCh0eXBlb2YgYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuICBudW1iZXI6IHtcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgbnVtYmVyIChkaWZmZXJlbnQgb2YgTmFOKS4nLFxuICAgIGRlc2M6ICd0byBiZSBhIG51bWJlcicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNOdW1iZXIoYWN0dWFsKSAmJiAhaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGJvb2w6IHtcbiAgICBhbGlhc2VzOiBbICdib29sZWFuJyBdLFxuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBib29sZWFuLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgYm9vbGVhbicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNCb29sZWFuKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBzdHJpbmc6IHtcbiAgICBhbGlhc2VzOiBbICdzdHInIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZy4nLFxuICAgIGRlc2M6ICd0byBiZSBhIHN0cmluZycsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNTdHJpbmcoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG9iamVjdDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIG9mIHR5cGUgb2JqZWN0LicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIG9iamVjdCcsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHBsYWluT2JqZWN0OiB7XG4gICAgYWxpYXNlczogWyAncGxhaW4nLCAnb2JqJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGUgT2JqZWN0IGNvbnN0cnVjdG9yLicsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUGxhaW5PYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGFycmF5OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYW4gQXJyYXkuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gQXJyYXknLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzQXJyYXkoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGZ1bmN0aW9uOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBGdW5jdGlvbi4nLFxuICAgIGRlc2M6ICd0byBiZSBhIEZ1bmN0aW9uJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICByZWdleHA6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIFJlZ0V4cCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgUmVnRXhwJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1JlZ0V4cChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZGF0ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRGF0ZScsXG4gICAgZGVzYzogJ3RvIGJlIGEgRGF0ZScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNEYXRlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBlbGVtZW50OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBET00gZWxlbWVudCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgRE9NIGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRWxlbWVudChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZXJyb3I6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBlcnJvciAob3IgbG9va3MgbGlrZSBpdCknLFxuICAgIGRlc2M6ICd0byBiZSBhbiBFcnJvcicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5uYW1lKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5tZXNzYWdlKTtcbiAgICB9XG4gIH0sXG5cbiAgdW5kZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgdW5kZWZpbmVkLicsXG4gICAgZGVzYzogJ3RvIGJlIHVuZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNVbmRlZmluZWQoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG51bGw6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBudWxsLicsXG4gICAgZGVzYzogJ3RvIGJlIG51bGwnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPT09IG51bGw7XG4gICAgfVxuICB9LFxuICBOYU46IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBOYU4uJyxcbiAgICBkZXNjOiAndG8gYmUgTmFOJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc051bWJlcihhY3R1YWwpKSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgdHJ1ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHRydWUnLFxuICAgIGRlc2M6ICd0byBiZSB0cnVlJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbCA/IHRydWUgOiAnd2FzIHt7YWN0dWFsfX0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGZhbHNlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgZmFsc2UnLFxuICAgIGRlc2M6ICd0byBiZSBmYWxzZScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICFhY3R1YWwgPyB0cnVlIDogJ3dhcyB7e2FjdHVhbH19JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJhaXNlczoge1xuICAgIGFsaWFzZXM6IFsgJ3Rocm93cycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIHRoYXQgZXhlY3V0aW5nIHRoZSB2YWx1ZSByZXN1bHRzIGluIGFuIGV4Y2VwdGlvbiBiZWluZyB0aHJvd24uJyxcbiAgICAgICdUaGUgY2FwdHVyZWQgZXhjZXB0aW9uIHZhbHVlIGlzIHVzZWQgdG8gbXV0YXRlIHRoZSBzdWJqZWN0IGZvciB0aGUnLFxuICAgICAgJ2ZvbGxvd2luZyBleHBlY3RhdGlvbnMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3Rocm93cyBhbiBlcnJvcicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghXy5pc0Z1bmN0aW9uKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBmdW5jdGlvbjoge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGFjdHVhbCgpO1xuICAgICAgICByZXR1cm4gJ2RpZCBub3QgdGhyb3cgYW55dGhpbmcnO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAobnVsbCA9PSBleHBlY3RlZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGV4cGVjdGVkKSAmJiBlIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNFcXVhbChlLCBleHBlY3RlZCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdWdtZW50IHRoZSBleHBlY3RhdGlvbiBvYmplY3Qgd2l0aCBhIG5ldyB0ZW1wbGF0ZSB2YXJpYWJsZVxuICAgICAgICB0aGlzLmV4Y2VwdGlvbiA9IGU7XG4gICAgICAgIHJldHVybiAnZ290IHt7IGV4Y2VwdGlvbiB9fSc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGhhczoge1xuICAgIGFsaWFzZXM6IFsgJ2hhdmUnLCAnY29udGFpbicsICdjb250YWlucycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2sgaWYgdGhlIHZhbHVlIGhhcyBzb21lIGV4cGVjdGVkIHZhbHVlLiBJdCB1bmRlcnN0YW5kcyBleHBlY3RlZCcsXG4gICAgICAnY2hhaW4gZXhwcmVzc2lvbnMgc28gdGhpcyBzZXJ2ZXMgYXMgdGhlIGVxdWl2YWxlbnQgb2YgLmVxIGZvciBwYXJ0aWFsJyxcbiAgICAgICdtYXRjaGVzLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBjb250YWluIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBhcmcxIC8qLCAuLi4gKi8pIHtcblxuICAgICAgLy8gYWxsb3cgbXVsdGlwbGUgZXhwZWN0ZWQgdmFsdWVzXG4gICAgICB2YXIgZXhwZWN0ZWQgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZC5sZW5ndGggPT09IDEgPyBleHBlY3RlZFswXSA6IGV4cGVjdGVkO1xuXG4gICAgICBpZiAoIV8uaXNTdHJpbmcoYWN0dWFsKSAmJiAhXy5pc0FycmF5KGFjdHVhbCkgJiYgIV8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2dvdCB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIF8uZXZlcnkoZXhwZWN0ZWQsIGZ1bmN0aW9uIChleHBlY3RlZCkge1xuICAgICAgICBpZiAoXy5pc1N0cmluZyhhY3R1YWwpICYmIF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgcmV0dXJuIC0xICE9PSBhY3R1YWwuaW5kZXhPZihleHBlY3RlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5pc0FycmF5KGFjdHVhbCkpIHtcbiAgICAgICAgICAvLyBUT0RPOiBJc24ndCB0aGVyZSBhbiBlYXNpZXIgd2F5IHRvIHRlc3QgdGhpcyB1c2luZyBsb2Rhc2ggb25seT9cbiAgICAgICAgICBpZiAoIWFzcy5DaGFpbi5pc0NoYWluKGV4cGVjdGVkKSkge1xuICAgICAgICAgICAgZXhwZWN0ZWQgPSBhc3MuZXEoZXhwZWN0ZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gLTEgIT09IF8uZmluZEluZGV4KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFjazogQ29tcGFyZSBvYmplY3RzIHdpdGggLndoZXJlIGJ5IGZpbHRlcmluZyBhIHdyYXBwZXIgYXJyYXlcbiAgICAgICAgcmV0dXJuIDEgPT09IF8ud2hlcmUoW2FjdHVhbF0sIGV4cGVjdGVkKS5sZW5ndGg7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG4gIGhhc093bjoge1xuICAgIGFsaWFzZXM6IFsgJ2hhc0tleScsICdoYXNJbmRleCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2sgaWYgdGhlIHZhbHVlIGhhcyBvbmUgb3IgbW9yZSBvd24gcHJvcGVydGllcyBhcyBkZWZpbmVkIGJ5JyxcbiAgICAgICd0aGUgZ2l2ZW4gYXJndW1lbnRzLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBoYXZlIG93biBwcm9wZXJ0eSAkeyBleHBlY3RlZCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZmFpbCA9ICdvbmx5IGhhZCB7eyBfLmtleXMoYWN0dWFsKSB9fSc7XG5cbiAgICAgIC8vIFRPRE86IE9mZmVyIGJldHRlciBmYWlsdXJlIG1lc3NhZ2VcbiAgICAgIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gXy5ldmVyeShhcmdzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4gXy5oYXMoYWN0dWFsLCB4KTsgfSk7XG4gICAgfVxuICB9LFxuXG4gIGxvZzoge1xuICAgIGhlbHA6IFtcbiAgICAgICdEdW1wcyB0aGUgcmVjZWl2ZWQgdmFsdWUgdG8gdGhlIGNvbnNvbGUuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBjb25zb2xlLmxvZygnW0FTU10nLCBhY3R1YWwpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBkdW1wOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0R1bXBzIHRoZSByZWNlaXZlZCB2YWx1ZSB0byB0aGUgY29uc29sZSBhcHBseWluZyB0aGUgZ2l2ZW4gdGVtcGxhdGUuJyxcbiAgICAgICdOb3RlOiBVc2UgJHt0aGlzfSB0byBpbnRlcnBvbGF0ZSB0aGUgd2hvbGUgdmFsdWUuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3RlbXBsYXRlJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCB0cGwpIHtcbiAgICAgIHZhciByZXN1bHQgPSB1dGlsLnRlbXBsYXRlLmNhbGwoYWN0dWFsLCB0cGwsIGFjdHVhbCk7XG4gICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBkZWJ1Z2dlcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdIYWx0cyBzY3JpcHQgZXhlY3V0aW9uIGJ5IHRyaWdnZXJpbmcgdGhlIGludGVyYWN0aXZlIGRlYnVnZ2VyLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgZGVidWdnZXI7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgdGFwOiB7XG4gICAgYWxpYXNlczogWyAnZm4nIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NhbGxzIHRoZSBwcm92aWRlZCBmdW5jdGlvbiB3aXRoIHRoZSBjdXJyZW50IHZhbHVlIGFzIGFyZ3VtZW50LicsXG4gICAgICAnSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgc29tZXRoaW5nIGRpZmZlcmVudCB0byAqdW5kZWZpbmVkKiB0aGUnLFxuICAgICAgJ2V4cHJlc3Npb24gd2lsbCBmb3JrIHRvIG9wZXJhdGUgb24gdGhlIHJldHVybmVkIHZhbHVlLicsXG4gICAgXSxcbiAgICBkZXNjOiAnY2FsbCB7e2FyZzF9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZm4pIHtcbiAgICAgIHZhciByZXN1bHQgPSBmbihhY3R1YWwpO1xuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShyZXN1bHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBub3RpZnk6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnU2ltaWxhciB0byAudGFwKCkgYnV0IGl0IHdvblxcJ3QgcGFzcyB0aGUgY3VycmVudCB2YWx1ZSBhcyBhcmd1bWVudCwnLFxuICAgICAgJ2luc3RlYWQgaXQgd2lsbCBiZSBwcm92aWRlZCBhcyB0aGUgYHRoaXNgIGNvbnRleHQgd2hlbiBwZXJmb3JtaW5nIHRoZScsXG4gICAgICAnY2FsbC4gVGhpcyBhbGxvd3MgaXQgdG8gYmUgdXNlZCB3aXRoIHRlc3QgcnVubmVycyBgZG9uZWAgc3R5bGUgY2FsbGJhY2tzLicsXG4gICAgICAnTm90ZSB0aGF0IGl0IHdpbGwgbmVpdGhlciBtdXRhdGUgdGhlIHZhbHVlIGV2ZW4gaWYgaXQgcmV0dXJucyBzb21ldGhpbmcuJ1xuICAgIF0sXG4gICAgZGVzYzogJ25vdGlmeSB7e2FyZzF9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZm4pIHtcbiAgICAgIGZuLmNhbGwoYWN0dWFsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBzaXplOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSBzaXplIG9mIHRoZSBjdXJyZW50IHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgc2l6ZScsXG4gICAgZmFpbDogJ25vdCBoYXMgYSBsZW5ndGg6IHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNPYmplY3QoYWN0dWFsKSB8fCBfLmlzQXJyYXkoYWN0dWFsKSB8fCBfLmlzU3RyaW5nKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKF8uc2l6ZShhY3R1YWwpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSxcbiAgcHJvcDoge1xuICAgIGFsaWFzZXM6IFsgJ2tleScsICdwcm9wZXJ0eScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gb25lIG9mIHRoZSB2YWx1ZSBwcm9wZXJ0aWVzLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgcHJvcGVydHkge3sgYXJnMSB9fScsXG4gICAgZmFpbDogJ3dhcyBub3QgZm91bmQgb24ge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBrZXkpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgaWYgKGtleSBpbiBhY3R1YWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoYWN0dWFsW2tleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5rZXlzID0gW107XG4gICAgICAgIF8uZm9ySW4oYWN0dWFsLCBmdW5jdGlvbiAodiwgaykgeyB0aGlzLmtleXMucHVzaChrKTsgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiAnd2FzIG5vdCBmb3VuZCBpbiBrZXlzIHt7IGtleXMgfX0nO1xuICAgICAgfVxuICAgICAgcmV0dXJuICdnb3Qge3thY3R1YWx9fSc7XG4gICAgfVxuICB9LFxuICBhdDoge1xuICAgIGFsaWFzZXM6IFsgJ2luZGV4JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgaW5kZXhlZCBlbGVtZW50cy4gSWYnLFxuICAgICAgJ211bHRpcGxlIGluZGV4ZXMgYXJlIHByb3ZpZGVkIGFuIGFycmF5IGlzIGNvbXBvc2VkIHdpdGggdGhlbS4nLFxuICAgICAgJ05vdGU6IEl0IHN1cHBvcnRzIG5lZ2F0aXZlIGluZGV4ZXMnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGluZGV4ICR7IGFyZ3Muam9pbihcIiwgXCIpIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGluZGV4KSB7XG4gICAgICBpZiAoIV8uaXNBcnJheShhY3R1YWwpICYmICFfLmlzU3RyaW5nKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdub3QgYW4gYXJyYXkgb3IgYSBzdHJpbmc6ICR7YWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIHZhciBpbmRleGVzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICB2YXIgZWxlbXMgPSBbXTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbmRleGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBpZHggPSBpbmRleGVzW2ldO1xuXG4gICAgICAgIGlkeCA9IGlkeCA8IDAgPyBhY3R1YWwubGVuZ3RoICsgaWR4IDogaWR4O1xuICAgICAgICBpZiAoaWR4IDwgMCB8fCBpZHggPj0gYWN0dWFsLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBpZHggKyAnIG91dCBvZiBib3VuZHMgZm9yIHt7YWN0dWFsfX0nO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbXMucHVzaChhY3R1YWxbaWR4XSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgZWxlbXMubGVuZ3RoID09PSAxID8gZWxlbXNbMF0gOiBlbGVtc1xuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAga2V5czoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBvcGVyYXRlIG9uIGl0cyBsaXN0IG9mIG93biBrZXlzLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQga2V5cycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmtleXMoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHZhbHVlczoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBvcGVyYXRlIG9uIGl0cyBsaXN0IG9mIHZhbHVlcydcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgdmFsdWVzJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8udmFsdWVzKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHNsaWNlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0V4dHJhY3RzIGEgcG9ydGlvbiBmcm9tIHRoZSB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnc2xpY2Uoe3thY3R1YWx9fSwgJHthcmcxIHx8IDB9KScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgc3RhcnQsIGVuZCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnRvQXJyYXkoYWN0dWFsKS5zbGljZShzdGFydCwgZW5kKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgZmlsdGVyOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0l0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgdGhlIGNvbGxlY3Rpb24sIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvJyxcbiAgICAgICdvcGVyYXRlIG9uIGFuIGFycmF5IHdpdGggYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggdGhlIGNhbGxiYWNrIHJldHVybmVkJyxcbiAgICAgICd0cnV0aHkgZm9yLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNmaWx0ZXInXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmZpbHRlcihhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHJlamVjdDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGNvbGxlY3Rpb24sIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUnLFxuICAgICAgJ29uIGFuIGFycmF5IHdpdGggYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggdGhlIGNhbGxiYWNrIHJldHVybmVkIGZhbHN5JyxcbiAgICAgICdmb3IgKHRoZSBvcHBvc2l0ZSBvZiAuZmlsdGVyKS4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVqZWN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5yZWplY3QoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHdoZXJlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1BlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIG9mIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24gdG8gdGhlIGdpdmVuJyxcbiAgICAgICdwcm9wZXJ0aWVzIG9iamVjdCwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBvZiBhbGwnLFxuICAgICAgJ2VsZW1lbnRzIHRoYXQgaGF2ZSBlcXVpdmFsZW50IHByb3BlcnR5IHZhbHVlcy4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3Mjd2hlcmUnXG4gICAgXSxcbiAgICBkZXNjOiAnd2hlcmUge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHByb3BzKSB7XG4gICAgICBpZiAoIV8uaXNQbGFpbk9iamVjdChwcm9wcykpIHtcbiAgICAgICAgcmV0dXJuICdwcm9wcyBpcyBub3QgYW4gb2JqZWN0JztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy53aGVyZShhY3R1YWwsIHByb3BzKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWFwOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIGFuIGFycmF5IGhvbGRpbmcgdGhlIHJlc3VsdHMgb2YnLFxuICAgICAgJ2ludm9raW5nIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI21hcCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWFwKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBtZXRob2Q6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gdGhlIHJlc3VsdCBvZiBpbnZva2luZyB0aGUgbmFtZWQnLFxuICAgICAgJ21ldGhvZCBvbiB0aGUgc3ViamVjdCB2YWx1ZS4nLFxuICAgIF0sXG4gICAgZGVzYzogXCJtZXRob2QgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZCwgYXJnKSB7XG4gICAgICBpZiAodHlwZW9mIGFjdHVhbFttZXRob2RdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAnJHthcmcxfSBpcyBub3QgYSBtZXRob2QgaW4ge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMik7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIGFjdHVhbFttZXRob2RdLmFwcGx5KGFjdHVhbCwgYXJncylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGludm9rZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgbWV0aG9kIG5hbWVkIGJ5IHRoZSBhcmd1bWVudCBmb3IgZWFjaCBlbGVtZW50IGluIHRoZScsXG4gICAgICAnY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNpbnZva2UnXG4gICAgXSxcbiAgICBkZXNjOiBcImludm9rZSAuJHthcmcxfSgpXCIsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgbWV0aG9kLCBhcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5pbnZva2UuYXBwbHkoXywgYXJndW1lbnRzKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgcGx1Y2s6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gYmUgdGhlIG9uZSBvZiB0aGUgc3BlY2lmaWMgcHJvcGVydHkgZm9yIGFsbCBlbGVtZW50cycsXG4gICAgICAnaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcGx1Y2snXG4gICAgXSxcbiAgICBkZXNjOiAncGx1Y2soIHt7YXJnMX19ICknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHByb3ApIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5wbHVjayhhY3R1YWwsIHByb3ApXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBmaXJzdDoge1xuICAgIGFsaWFzZXM6IFsgJ2hlYWQnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlyc3QnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGZpcnN0IGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5oZWFkKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBsYXN0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbGFzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5sYXN0KGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICByZXN0OiB7XG4gICAgYWxpYXNlczogWyAndGFpbCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnVE9ETycsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNyZXN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnRhaWwoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWluOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHN1YmplY3QgdG8gYmUgdGhlIG1pbmltdW0gdmFsdWUgZm91bmQgb24gdGhlIGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI21pbidcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5taW4oYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIG1heDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSBzdWJqZWN0IHRvIGJlIHRoZSBtYXhpbXVtIHZhbHVlIGZvdW5kIG9uIHRoZSBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXgnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWF4KGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHNvcnQ6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gYmUgc29ydGVkIGluIGFzY2VuZGluZyBvcmRlci4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3Mjc29ydEJ5J1xuICAgIF0sXG4gICAgZGVzYzogJ3NvcnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAvLyBBbGxvdyB0aGUgdXNlIG9mIGV4cHJlc3Npb25zIGFzIGNhbGxiYWNrc1xuICAgICAgaWYgKGNhbGxiYWNrIGluc3RhbmNlb2YgYXNzLkNoYWluKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sucmVzdWx0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uc29ydEJ5KGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzdG9yZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdIZWxwZXIgdG8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgdmFsdWUgYmVpbmcgZXZhbHVhdGVkIGluIHRoZScsXG4gICAgICAnZXhwcmVzc2lvbiBpbiBzb21lIG90aGVyIG9iamVjdC4gSXQgZXhwZWN0cyBhIHRhcmdldCBvYmplY3QgYW5kIG9wdGlvbmFsbHknLFxuICAgICAgJ3RoZSBuYW1lIG9mIGEgcHJvcGVydHkuIElmIHRhcmdldCBpcyBhIGZ1bmN0aW9uIGl0XFwnbGwgcmVjZWl2ZSB0aGUgdmFsdWUnLFxuICAgICAgJ3VzaW5nIGBwcm9wYCBhcyB0aGlzIGNvbnRleHQuIElmIGBwcm9wYCBpcyBub3QgcHJvdmlkZWQgYW5kIGB0YXJnZXRgIGlzIGFuJyxcbiAgICAgICdhcnJheSB0aGUgdmFsdWUgd2lsbCBiZSBwdXNoZWQgdG8gaXQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3N0b3JlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCB0YXJnZXQsIHByb3ApIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24odGFyZ2V0KSkge1xuICAgICAgICB0YXJnZXQuY2FsbChwcm9wLCBhY3R1YWwpO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKF8uaXNBcnJheSh0YXJnZXQpKSB7XG4gICAgICAgICAgdGFyZ2V0LnB1c2goYWN0dWFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJ3Byb3AgdW5kZWZpbmVkIGFuZCB0YXJnZXQgaXMgbm90IGFuIGFycmF5IG9yIGEgZnVuY3Rpb246IHt7YXJnMX19JztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BdID0gYWN0dWFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICd0YXJnZXQgaXMgbm90IGFuIG9iamVjdDoge3thcmcxfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxufSk7XG4iXX0=
},{"../ass":1,"../util":13}],8:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var ass = require('../ass');


// Helper factory for thenable callbacks
function resume (resolver, result) {
  return function (value) {
    resolver.resume(value, result);
  };
}

function isPromise (value) {
  var then = value && value.then;
  return typeof then === 'function';
}


// Promise related matchers
ass.register({

  promise: {
    help: [
      'Verifies that the value is a promise (Promise/A+) but does not attach',
      'the expression to its resolution like `resolves` or `rejects`, instead',
      'the original promise value is kept as the subject for the following',
      'expectations.'
    ],
    desc: 'to be a promise',
    fail: 'got ${ actual }',
    test: function (actual) {
      return isPromise(actual);
    }
  },

  resolves: {
    aliases: [ 'resolved', 'fulfilled', 'fulfill', 'eventually' ],
    help: [
      'Attach the matcher to a promise value (Promises/A+) to continue',
      'applying the chain of matchers once the promise has been resolved,',
      'mutating the value to the resolved one.',
      'It will fail if the value is not a promise (no .then method) or the',
      'promise is actually rejected.'
    ],
    desc: 'to be a resolved promise',
    fail: 'was rejected',
    test: function (actual) {
      if (!isPromise(actual)) {
        return 'is not a promise: {{actual}}';
      }

      return function (resolver) {
        // Enter async mode
        resolver.pause();

        // Attach to the promise so we get notified when it's resolved.
        actual.then(
          resume(resolver),
          resume(resolver, false)
        );

        // Right now we don't know if the expression is valid
        return undefined;
      };
    }
  },

  become: {
    aliases: [ 'becomes' ],
    help: [
      'Works the same as .resolves but additionally will do a comparison between',
      'the resolved value from the promise and the expected one. It can be seen',
      'as a shortcut for `.resolves.eq(expected)`.'
    ],
    desc: 'to become {{ expected }}',
    fail: 'was {{ actual }}',
    test: function (actual, expected) {
      if (!isPromise(actual)) {
        return 'is not a promise: {{actual}}';
      }

      return function (resolver) {
        // Make it async
        resolver.pause();

        // Attach to the promise resolution
        actual.then(
          function (value) {
            // When the equality succeeds just keep resolving
            var result = _.isEqual(value, expected) ? undefined : false;
            resolver.resume(value, result);
          },
          resume(resolver, false)
        );

        return undefined;
      };
    }
  },

  rejects: {
    aliases: [ 'rejected' ],
    help: [
      'Attach the matcher to a promise value (Promises/A+) to continue applying',
      'the chain of matchers once the promise has been rejected, mutating the',
      'value to become the rejected error.',
      'It will fail if the value is not a promise (no .then method) or the',
      'promise is actually fulfilled.'
    ],
    desc: 'to be a rejected promise',
    fail: 'was fulfilled',
    test: function (actual) {
      if (!isPromise(actual)) {
        return 'is not a promise: {{actual}}';
      }

      return function (resolver) {
        // Enter async mode
        resolver.pause();

        actual.then(
          resume(resolver, false),
          resume(resolver)
        );

        // Right now we don't know if the expression is valid
        return undefined;
      };
    }
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tYXRjaGVycy9wcm9taXNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snXyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnXyddIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG4vLyBIZWxwZXIgZmFjdG9yeSBmb3IgdGhlbmFibGUgY2FsbGJhY2tzXG5mdW5jdGlvbiByZXN1bWUgKHJlc29sdmVyLCByZXN1bHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJlc29sdmVyLnJlc3VtZSh2YWx1ZSwgcmVzdWx0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNQcm9taXNlICh2YWx1ZSkge1xuICB2YXIgdGhlbiA9IHZhbHVlICYmIHZhbHVlLnRoZW47XG4gIHJldHVybiB0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuXG4vLyBQcm9taXNlIHJlbGF0ZWQgbWF0Y2hlcnNcbmFzcy5yZWdpc3Rlcih7XG5cbiAgcHJvbWlzZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdWZXJpZmllcyB0aGF0IHRoZSB2YWx1ZSBpcyBhIHByb21pc2UgKFByb21pc2UvQSspIGJ1dCBkb2VzIG5vdCBhdHRhY2gnLFxuICAgICAgJ3RoZSBleHByZXNzaW9uIHRvIGl0cyByZXNvbHV0aW9uIGxpa2UgYHJlc29sdmVzYCBvciBgcmVqZWN0c2AsIGluc3RlYWQnLFxuICAgICAgJ3RoZSBvcmlnaW5hbCBwcm9taXNlIHZhbHVlIGlzIGtlcHQgYXMgdGhlIHN1YmplY3QgZm9yIHRoZSBmb2xsb3dpbmcnLFxuICAgICAgJ2V4cGVjdGF0aW9ucy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSBwcm9taXNlJyxcbiAgICBmYWlsOiAnZ290ICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gaXNQcm9taXNlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuXG4gIHJlc29sdmVzOiB7XG4gICAgYWxpYXNlczogWyAncmVzb2x2ZWQnLCAnZnVsZmlsbGVkJywgJ2Z1bGZpbGwnLCAnZXZlbnR1YWxseScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlJyxcbiAgICAgICdhcHBseWluZyB0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZXNvbHZlZCwnLFxuICAgICAgJ211dGF0aW5nIHRoZSB2YWx1ZSB0byB0aGUgcmVzb2x2ZWQgb25lLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZScsXG4gICAgICAncHJvbWlzZSBpcyBhY3R1YWxseSByZWplY3RlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZXNvbHZlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIHJlamVjdGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEF0dGFjaCB0byB0aGUgcHJvbWlzZSBzbyB3ZSBnZXQgbm90aWZpZWQgd2hlbiBpdCdzIHJlc29sdmVkLlxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIGJlY29tZToge1xuICAgIGFsaWFzZXM6IFsgJ2JlY29tZXMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1dvcmtzIHRoZSBzYW1lIGFzIC5yZXNvbHZlcyBidXQgYWRkaXRpb25hbGx5IHdpbGwgZG8gYSBjb21wYXJpc29uIGJldHdlZW4nLFxuICAgICAgJ3RoZSByZXNvbHZlZCB2YWx1ZSBmcm9tIHRoZSBwcm9taXNlIGFuZCB0aGUgZXhwZWN0ZWQgb25lLiBJdCBjYW4gYmUgc2VlbicsXG4gICAgICAnYXMgYSBzaG9ydGN1dCBmb3IgYC5yZXNvbHZlcy5lcShleHBlY3RlZClgLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZWNvbWUge3sgZXhwZWN0ZWQgfX0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIE1ha2UgaXQgYXN5bmNcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICAvLyBBdHRhY2ggdG8gdGhlIHByb21pc2UgcmVzb2x1dGlvblxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGVxdWFsaXR5IHN1Y2NlZWRzIGp1c3Qga2VlcCByZXNvbHZpbmdcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBfLmlzRXF1YWwodmFsdWUsIGV4cGVjdGVkKSA/IHVuZGVmaW5lZCA6IGZhbHNlO1xuICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKHZhbHVlLCByZXN1bHQpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyLCBmYWxzZSlcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgcmVqZWN0czoge1xuICAgIGFsaWFzZXM6IFsgJ3JlamVjdGVkJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBdHRhY2ggdGhlIG1hdGNoZXIgdG8gYSBwcm9taXNlIHZhbHVlIChQcm9taXNlcy9BKykgdG8gY29udGludWUgYXBwbHlpbmcnLFxuICAgICAgJ3RoZSBjaGFpbiBvZiBtYXRjaGVycyBvbmNlIHRoZSBwcm9taXNlIGhhcyBiZWVuIHJlamVjdGVkLCBtdXRhdGluZyB0aGUnLFxuICAgICAgJ3ZhbHVlIHRvIGJlY29tZSB0aGUgcmVqZWN0ZWQgZXJyb3IuJyxcbiAgICAgICdJdCB3aWxsIGZhaWwgaWYgdGhlIHZhbHVlIGlzIG5vdCBhIHByb21pc2UgKG5vIC50aGVuIG1ldGhvZCkgb3IgdGhlJyxcbiAgICAgICdwcm9taXNlIGlzIGFjdHVhbGx5IGZ1bGZpbGxlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZWplY3RlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIGZ1bGZpbGxlZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIEVudGVyIGFzeW5jIG1vZGVcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIsIGZhbHNlKSxcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuIl19
},{"../ass":1}],9:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var ass = require('../ass');


// Helper function to iterate a value creating forks for each element, handling
// async expectations if needed.
function forker (resolver, actual, iterator, stop) {
  var branches = _.size(actual);
  var result = iterator(actual, function (value) {

    var fork = resolver.fork();

    var partial = fork(value);

    // Stop iterating as soon as possible
    if (partial === stop) {
      resolver.join(fork);
      return stop;
    }

    if (partial === !stop) {
      branches -= 1;
      if (0 === branches) {
        resolver.join(fork);
      }
      return !stop;
    }

    // Async support
    if (!resolver.paused) {
      resolver.pause();
    }

    // Subscribe to the fork's final result
    fork.finalize(function (final) {
      // We're done the moment one is a stop result
      if (final === stop) {
        resolver.join(fork);
        resolver.resume(null, stop);
      } else {
        branches -= 1;
        if (0 === branches) {
          resolver.join(fork);
          resolver.resume(null, !stop);
        }
      }
      return final;
    });

    return !stop;  // keep iterating
  });

  // When the forks completed synchronously just finalize the resolver
  if (!resolver.paused) {
    return resolver.finalize(result);
  }

  return undefined;
}


// Quantifiers
ass.register({

  every: {
    aliases: [ 'all', 'allOf' ],
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'all of them succeed'
    ],
    desc: 'For every one:',
    fail: 'one didn\'t',
    test: function (actual) {
      return function (resolver) {
        // Shortcut when there is no more stuff to do
        if (resolver.exhausted) {
          return resolver.finalize(true);
        }

        return forker(resolver, actual, _.every, false);
      };
    }
  },

  some: {
    aliases: [ 'anyOf' ],
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'at least one of them succeeds'],
    desc: 'At least one:',
    fail: 'none did',
    test: function (actual) {
      return function (resolver) {
        // Shortcut when there is no more stuff to do
        if (resolver.exhausted) {
          return resolver.finalize(true);
        }

        return forker(resolver, actual, _.some, true);
      };
    }
  },

  none: {
    aliases: [ 'noneOf' ],
    help: [
      'Applies matchers to all the elements in a collection expecting that',
      'none of them succeed.'
    ],
    desc: 'None of them:',
    fail: 'one did',
    test: function (actual) {
      return function (resolver) {
        // Shortcut when there is no more stuff to do
        if (resolver.exhausted) {
          return resolver.finalize(true);
        }

        // We are going to use the same algorithm as for .some but we'll negate
        // its result using a finalizer.
        resolver.finalize(function (final) {
          return !final;
        });

        return forker(resolver, actual, _.some, true);
      };
    }
  }

});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xuXG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBpdGVyYXRlIGEgdmFsdWUgY3JlYXRpbmcgZm9ya3MgZm9yIGVhY2ggZWxlbWVudCwgaGFuZGxpbmdcbi8vIGFzeW5jIGV4cGVjdGF0aW9ucyBpZiBuZWVkZWQuXG5mdW5jdGlvbiBmb3JrZXIgKHJlc29sdmVyLCBhY3R1YWwsIGl0ZXJhdG9yLCBzdG9wKSB7XG4gIHZhciBicmFuY2hlcyA9IF8uc2l6ZShhY3R1YWwpO1xuICB2YXIgcmVzdWx0ID0gaXRlcmF0b3IoYWN0dWFsLCBmdW5jdGlvbiAodmFsdWUpIHtcblxuICAgIHZhciBmb3JrID0gcmVzb2x2ZXIuZm9yaygpO1xuXG4gICAgdmFyIHBhcnRpYWwgPSBmb3JrKHZhbHVlKTtcblxuICAgIC8vIFN0b3AgaXRlcmF0aW5nIGFzIHNvb24gYXMgcG9zc2libGVcbiAgICBpZiAocGFydGlhbCA9PT0gc3RvcCkge1xuICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgIHJldHVybiBzdG9wO1xuICAgIH1cblxuICAgIGlmIChwYXJ0aWFsID09PSAhc3RvcCkge1xuICAgICAgYnJhbmNoZXMgLT0gMTtcbiAgICAgIGlmICgwID09PSBicmFuY2hlcykge1xuICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgfVxuICAgICAgcmV0dXJuICFzdG9wO1xuICAgIH1cblxuICAgIC8vIEFzeW5jIHN1cHBvcnRcbiAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIGZvcmsncyBmaW5hbCByZXN1bHRcbiAgICBmb3JrLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgLy8gV2UncmUgZG9uZSB0aGUgbW9tZW50IG9uZSBpcyBhIHN0b3AgcmVzdWx0XG4gICAgICBpZiAoZmluYWwgPT09IHN0b3ApIHtcbiAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIHN0b3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJhbmNoZXMgLT0gMTtcbiAgICAgICAgaWYgKDAgPT09IGJyYW5jaGVzKSB7XG4gICAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgIXN0b3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmluYWw7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gIXN0b3A7ICAvLyBrZWVwIGl0ZXJhdGluZ1xuICB9KTtcblxuICAvLyBXaGVuIHRoZSBmb3JrcyBjb21wbGV0ZWQgc3luY2hyb25vdXNseSBqdXN0IGZpbmFsaXplIHRoZSByZXNvbHZlclxuICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZShyZXN1bHQpO1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuXG4vLyBRdWFudGlmaWVyc1xuYXNzLnJlZ2lzdGVyKHtcblxuICBldmVyeToge1xuICAgIGFsaWFzZXM6IFsgJ2FsbCcsICdhbGxPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnYWxsIG9mIHRoZW0gc3VjY2VlZCdcbiAgICBdLFxuICAgIGRlc2M6ICdGb3IgZXZlcnkgb25lOicsXG4gICAgZmFpbDogJ29uZSBkaWRuXFwndCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5ldmVyeSwgZmFsc2UpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgc29tZToge1xuICAgIGFsaWFzZXM6IFsgJ2FueU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdhdCBsZWFzdCBvbmUgb2YgdGhlbSBzdWNjZWVkcyddLFxuICAgIGRlc2M6ICdBdCBsZWFzdCBvbmU6JyxcbiAgICBmYWlsOiAnbm9uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uc29tZSwgdHJ1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBub25lOiB7XG4gICAgYWxpYXNlczogWyAnbm9uZU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdub25lIG9mIHRoZW0gc3VjY2VlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAnTm9uZSBvZiB0aGVtOicsXG4gICAgZmFpbDogJ29uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhcmUgZ29pbmcgdG8gdXNlIHRoZSBzYW1lIGFsZ29yaXRobSBhcyBmb3IgLnNvbWUgYnV0IHdlJ2xsIG5lZ2F0ZVxuICAgICAgICAvLyBpdHMgcmVzdWx0IHVzaW5nIGEgZmluYWxpemVyLlxuICAgICAgICByZXNvbHZlci5maW5hbGl6ZShmdW5jdGlvbiAoZmluYWwpIHtcbiAgICAgICAgICByZXR1cm4gIWZpbmFsO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uc29tZSwgdHJ1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG59KTtcbiJdfQ==
},{"../ass":1}],10:[function(require,module,exports){
var Chain = require('./chain');
var util = require('./util');


var checkChain = new Chain();


exports.lodash = function (_) {
  // Exit if already patched
  if (_.createCallback(checkChain) === checkChain.test) {
    return _;
  }

  // Override lodash's default createCallback mechanism to make it understand
  // about our expression chains.
  _.createCallback = _.wrap(_.createCallback, function(orig, callback, thisArg) {
    if (Chain.isChain(callback)) {
      return callback.test;
    }

    // Support _.where style. It's not as fast as the original one since we
    // have to go via _.isEqual instead of using the internal function
    if (_.isPlainObject(callback)) {
      var props = _.keys(callback);
      return function (object) {
        if (null == object) return false;
        var result = false, length = props.length, key;
        while (length--) {
          key = props[length];
          // Fail when the key is not even present
          if (!(key in object)) {
              result = false;
              break;
          }
          result = _.isEqual(object[key], callback[key]);
          if (!result) break;
        }
        return result;
      };
    }

    return orig(callback, thisArg);
  });

  // Override lodash's default isEqual implementation so it understands
  // about expression chains.
  function cmp (a, b) {
    return Chain.isChain(a) ? a.test(b) : Chain.isChain(b) ? b.test(a) : undefined;
  }
  _.isEqual = _.wrap(_.isEqual, function (orig, a, b, callback, thisArg) {
    var result = callback ? callback.call(thisArg || this, a, b) : undefined;
    if (result === undefined) {
      result = orig(a, b, cmp, thisArg);
    }
    return result;
  });

  return _;
};


exports.sinon = function (sinon) {
  // Exit if already patched
  if (sinon.match.isMatcher(checkChain)) {
    return sinon;
  }

  // Override Sinon's .isMatcher implementation to allow our expressions to be
  // transparently supported by it.
  var oldIsMatcher = util.bind(sinon.match.isMatcher, sinon.match);
  sinon.match.isMatcher = function (obj) {
    return Chain.isChain(obj) || oldIsMatcher(obj);
  };

  return sinon;
};

},{"./chain":2,"./util":13}],11:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var util = require('./util');

// Use a capped pool, the releasing algorithm is pretty solid so we should
// have a good re-use ratio with just a few in the pool. Then in case
// something goes wrong the GC will take care of it after a while.
var pool = util.CappedPool(100);
var created = 0;


// Instantiates a new resolver functor
function factory () {
  // Just forwards the call to the resolver by setting itself as context.
  function fn (value) {
    return resolver.call(fn, value);
  }

  fn.id = ++created;

  // The state is attached to the function object so it's available to the
  // state-less functions when running under `this.`.
  fn.chain = null;
  fn.parent = null;
  fn.paused = false;
  fn.resolved = [];
  fn.finalizers = [];

  // Expose the behaviour in the functor
  fn.pause = pause;
  fn.resume = resume;
  fn.fork = fork;
  fn.join = join;
  fn.finalize = finalize;

  Object.defineProperty(fn, 'exhausted', {
    get: function () {
      return this.resolved.length >= this.chain.__expectations__.length;
    }
  });

  return fn;
}

// This is the core resolution algorithm, it operates over the chain
// of expectations checking them one after the other against a value.
// If a function is returned it'll be immediately called using the
// expectation instance as context and passing as only argument the
// current resolve function, this allows an expectation to override
// the value and/or control the resolution without exposing too many
// internal details.
// When it returns `undefined` it just means that the resolution was
// paused (async), we can not obtain a final result using a synchronous
// call. This can be used by matchers when taking over the resolution to
// know if they need to mangle the results or they have to register a
// finalizer to be notified of the final result from the chain.
function resolver (value) {
  var list, result, exp;

  list = this.chain.__expectations__;
  offset = this.resolved.length;
  result = true;

  for (var i = offset; i < list.length; i++) {
    // Create a new object inheriting from the expectation but with the
    // current actual value provisioned. It allows the expression to mutate
    // its state for this execution but not affect other uses of it.
    exp = util.create(list[i], { actual: value });

    // Keep track of resolved expectations
    this.resolved.push(exp);

    // Execute the expectation to obtain its result
    result = exp.result = exp.resolve();

    // Allow expectations to take control for the remaining of the chain
    if (typeof result === 'function') {
      // Since the control is delegated to the expression we don't have to
      // do anything more here.
      exp.result = result.call(exp, this);
      return exp.result;
    }

    // Stop on first failure
    if (result === false) {
      break;
    }
  }

  // At this point we just need to apply any pending finalizers
  return this.finalize(result);
}


// When resolving async flows (i.e.: promises) this will pause the given
// resolver until a call to .resume() is made.
function pause () {
  if (this.paused) {
    throw new Error('Resolver already paused');
  }

  this.paused = true;
}

// Once the async flow has completed we can continue resolving where we
// stoped. When the override param is not undefined we'll skip calling the
// resolver and assume that bool as the final result. This allows the async
// code to shortcut the resolver.
function resume (actual, override) {
  if (!this.paused) {
    throw new Error('Resolver is not currently paused');
  }

  this.paused = false;

  // A final result was provided so just finalize the resolver
  if (override !== undefined) {
    return this.finalize(override);
  }

  // Let's continue resolving with the new value
  // Note: this() looks weird but remember we're using a function as context
  return this(actual);
}

// Clones the current resolver so we can fork and discard operations.
function fork () {
  var branch = acquire(this.chain);
  branch.parent = this;
  branch.resolved = _.reject(this.resolved, Array.isArray);
  return branch;
}

// Assume the results from a fork in the main resolver
function join (fork) {
  var len = _.reject(this.resolved, Array.isArray).length;
  this.resolved.push(
    fork.resolved.slice(len)
  );
}

// When the argument is a function it gets registered as a finalizer for the
// result obtained once the expression has been fully resolved (i.e. async).
// Otherwise it'll execute any registered functions on the given result and
// allow them to change it before releasing the resolver into the pool.
function finalize(result) {
  if (typeof result === 'function') {
    this.finalizers.push(
      [result, _.last(this.resolved)]
    );
    return;
  }

  // Nothing yet to finalize since the result is still unknown
  if (result === undefined) {
    return undefined;
  }

  // Allow finalizers to toggle the result (LIFO order)
  var finalizer;
  while (this.finalizers.length > 0) {
    finalizer = this.finalizers.pop();
    result = finalizer[0].call(finalizer[1], result);
    finalizer[1].result = result;
  }

  // Let the chain dispatch the final result but only for non-forked resolvers
  if (!this.parent) {
    this.chain.dispatchResult(this.resolved, result);
  }

  // When a final result has been obtained release the resolver to the pool
  pool.push(this);
  if (pool.length > created) {
    throw new Error('Pool corrupted! Created ' + created + ' but there are ' + pool.length + ' pooled');
  }

  return result;
}

// Acquires a resolver functor, if there is one in the pool it'll be reset and
// reused, otherwise it'll create a new one. When you're done with the resolver
// you shoud give it to `release()` so it can be incorporated to the pool.
// The reason for using a pool of objects here is that every time we evaluate
// an expression we'll need a resolver, when using quantifiers multiple forks
// will be created, so it's important to improve the performance.
function acquire (chain) {
  var resolver = pool.pop() || factory();

  // Reset the state of the resolver
  resolver.chain = chain;
  resolver.parent = null;
  resolver.paused = false;
  while (resolver.resolved.length > 0) {
    resolver.resolved.pop();
  }
  while (resolver.finalizers.length > 0) {
    resolver.finalizers.pop();
  }

  return resolver;
}


exports.acquire = acquire;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9yZXNvbHZlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ18nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ18nXSA6IG51bGwpO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vLyBVc2UgYSBjYXBwZWQgcG9vbCwgdGhlIHJlbGVhc2luZyBhbGdvcml0aG0gaXMgcHJldHR5IHNvbGlkIHNvIHdlIHNob3VsZFxuLy8gaGF2ZSBhIGdvb2QgcmUtdXNlIHJhdGlvIHdpdGgganVzdCBhIGZldyBpbiB0aGUgcG9vbC4gVGhlbiBpbiBjYXNlXG4vLyBzb21ldGhpbmcgZ29lcyB3cm9uZyB0aGUgR0Mgd2lsbCB0YWtlIGNhcmUgb2YgaXQgYWZ0ZXIgYSB3aGlsZS5cbnZhciBwb29sID0gdXRpbC5DYXBwZWRQb29sKDEwMCk7XG52YXIgY3JlYXRlZCA9IDA7XG5cblxuLy8gSW5zdGFudGlhdGVzIGEgbmV3IHJlc29sdmVyIGZ1bmN0b3JcbmZ1bmN0aW9uIGZhY3RvcnkgKCkge1xuICAvLyBKdXN0IGZvcndhcmRzIHRoZSBjYWxsIHRvIHRoZSByZXNvbHZlciBieSBzZXR0aW5nIGl0c2VsZiBhcyBjb250ZXh0LlxuICBmdW5jdGlvbiBmbiAodmFsdWUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIuY2FsbChmbiwgdmFsdWUpO1xuICB9XG5cbiAgZm4uaWQgPSArK2NyZWF0ZWQ7XG5cbiAgLy8gVGhlIHN0YXRlIGlzIGF0dGFjaGVkIHRvIHRoZSBmdW5jdGlvbiBvYmplY3Qgc28gaXQncyBhdmFpbGFibGUgdG8gdGhlXG4gIC8vIHN0YXRlLWxlc3MgZnVuY3Rpb25zIHdoZW4gcnVubmluZyB1bmRlciBgdGhpcy5gLlxuICBmbi5jaGFpbiA9IG51bGw7XG4gIGZuLnBhcmVudCA9IG51bGw7XG4gIGZuLnBhdXNlZCA9IGZhbHNlO1xuICBmbi5yZXNvbHZlZCA9IFtdO1xuICBmbi5maW5hbGl6ZXJzID0gW107XG5cbiAgLy8gRXhwb3NlIHRoZSBiZWhhdmlvdXIgaW4gdGhlIGZ1bmN0b3JcbiAgZm4ucGF1c2UgPSBwYXVzZTtcbiAgZm4ucmVzdW1lID0gcmVzdW1lO1xuICBmbi5mb3JrID0gZm9yaztcbiAgZm4uam9pbiA9IGpvaW47XG4gIGZuLmZpbmFsaXplID0gZmluYWxpemU7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZuLCAnZXhoYXVzdGVkJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZWQubGVuZ3RoID49IHRoaXMuY2hhaW4uX19leHBlY3RhdGlvbnNfXy5sZW5ndGg7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZm47XG59XG5cbi8vIFRoaXMgaXMgdGhlIGNvcmUgcmVzb2x1dGlvbiBhbGdvcml0aG0sIGl0IG9wZXJhdGVzIG92ZXIgdGhlIGNoYWluXG4vLyBvZiBleHBlY3RhdGlvbnMgY2hlY2tpbmcgdGhlbSBvbmUgYWZ0ZXIgdGhlIG90aGVyIGFnYWluc3QgYSB2YWx1ZS5cbi8vIElmIGEgZnVuY3Rpb24gaXMgcmV0dXJuZWQgaXQnbGwgYmUgaW1tZWRpYXRlbHkgY2FsbGVkIHVzaW5nIHRoZVxuLy8gZXhwZWN0YXRpb24gaW5zdGFuY2UgYXMgY29udGV4dCBhbmQgcGFzc2luZyBhcyBvbmx5IGFyZ3VtZW50IHRoZVxuLy8gY3VycmVudCByZXNvbHZlIGZ1bmN0aW9uLCB0aGlzIGFsbG93cyBhbiBleHBlY3RhdGlvbiB0byBvdmVycmlkZVxuLy8gdGhlIHZhbHVlIGFuZC9vciBjb250cm9sIHRoZSByZXNvbHV0aW9uIHdpdGhvdXQgZXhwb3NpbmcgdG9vIG1hbnlcbi8vIGludGVybmFsIGRldGFpbHMuXG4vLyBXaGVuIGl0IHJldHVybnMgYHVuZGVmaW5lZGAgaXQganVzdCBtZWFucyB0aGF0IHRoZSByZXNvbHV0aW9uIHdhc1xuLy8gcGF1c2VkIChhc3luYyksIHdlIGNhbiBub3Qgb2J0YWluIGEgZmluYWwgcmVzdWx0IHVzaW5nIGEgc3luY2hyb25vdXNcbi8vIGNhbGwuIFRoaXMgY2FuIGJlIHVzZWQgYnkgbWF0Y2hlcnMgd2hlbiB0YWtpbmcgb3ZlciB0aGUgcmVzb2x1dGlvbiB0b1xuLy8ga25vdyBpZiB0aGV5IG5lZWQgdG8gbWFuZ2xlIHRoZSByZXN1bHRzIG9yIHRoZXkgaGF2ZSB0byByZWdpc3RlciBhXG4vLyBmaW5hbGl6ZXIgdG8gYmUgbm90aWZpZWQgb2YgdGhlIGZpbmFsIHJlc3VsdCBmcm9tIHRoZSBjaGFpbi5cbmZ1bmN0aW9uIHJlc29sdmVyICh2YWx1ZSkge1xuICB2YXIgbGlzdCwgcmVzdWx0LCBleHA7XG5cbiAgbGlzdCA9IHRoaXMuY2hhaW4uX19leHBlY3RhdGlvbnNfXztcbiAgb2Zmc2V0ID0gdGhpcy5yZXNvbHZlZC5sZW5ndGg7XG4gIHJlc3VsdCA9IHRydWU7XG5cbiAgZm9yICh2YXIgaSA9IG9mZnNldDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBDcmVhdGUgYSBuZXcgb2JqZWN0IGluaGVyaXRpbmcgZnJvbSB0aGUgZXhwZWN0YXRpb24gYnV0IHdpdGggdGhlXG4gICAgLy8gY3VycmVudCBhY3R1YWwgdmFsdWUgcHJvdmlzaW9uZWQuIEl0IGFsbG93cyB0aGUgZXhwcmVzc2lvbiB0byBtdXRhdGVcbiAgICAvLyBpdHMgc3RhdGUgZm9yIHRoaXMgZXhlY3V0aW9uIGJ1dCBub3QgYWZmZWN0IG90aGVyIHVzZXMgb2YgaXQuXG4gICAgZXhwID0gdXRpbC5jcmVhdGUobGlzdFtpXSwgeyBhY3R1YWw6IHZhbHVlIH0pO1xuXG4gICAgLy8gS2VlcCB0cmFjayBvZiByZXNvbHZlZCBleHBlY3RhdGlvbnNcbiAgICB0aGlzLnJlc29sdmVkLnB1c2goZXhwKTtcblxuICAgIC8vIEV4ZWN1dGUgdGhlIGV4cGVjdGF0aW9uIHRvIG9idGFpbiBpdHMgcmVzdWx0XG4gICAgcmVzdWx0ID0gZXhwLnJlc3VsdCA9IGV4cC5yZXNvbHZlKCk7XG5cbiAgICAvLyBBbGxvdyBleHBlY3RhdGlvbnMgdG8gdGFrZSBjb250cm9sIGZvciB0aGUgcmVtYWluaW5nIG9mIHRoZSBjaGFpblxuICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBTaW5jZSB0aGUgY29udHJvbCBpcyBkZWxlZ2F0ZWQgdG8gdGhlIGV4cHJlc3Npb24gd2UgZG9uJ3QgaGF2ZSB0b1xuICAgICAgLy8gZG8gYW55dGhpbmcgbW9yZSBoZXJlLlxuICAgICAgZXhwLnJlc3VsdCA9IHJlc3VsdC5jYWxsKGV4cCwgdGhpcyk7XG4gICAgICByZXR1cm4gZXhwLnJlc3VsdDtcbiAgICB9XG5cbiAgICAvLyBTdG9wIG9uIGZpcnN0IGZhaWx1cmVcbiAgICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB3ZSBqdXN0IG5lZWQgdG8gYXBwbHkgYW55IHBlbmRpbmcgZmluYWxpemVyc1xuICByZXR1cm4gdGhpcy5maW5hbGl6ZShyZXN1bHQpO1xufVxuXG5cbi8vIFdoZW4gcmVzb2x2aW5nIGFzeW5jIGZsb3dzIChpLmUuOiBwcm9taXNlcykgdGhpcyB3aWxsIHBhdXNlIHRoZSBnaXZlblxuLy8gcmVzb2x2ZXIgdW50aWwgYSBjYWxsIHRvIC5yZXN1bWUoKSBpcyBtYWRlLlxuZnVuY3Rpb24gcGF1c2UgKCkge1xuICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc29sdmVyIGFscmVhZHkgcGF1c2VkJyk7XG4gIH1cblxuICB0aGlzLnBhdXNlZCA9IHRydWU7XG59XG5cbi8vIE9uY2UgdGhlIGFzeW5jIGZsb3cgaGFzIGNvbXBsZXRlZCB3ZSBjYW4gY29udGludWUgcmVzb2x2aW5nIHdoZXJlIHdlXG4vLyBzdG9wZWQuIFdoZW4gdGhlIG92ZXJyaWRlIHBhcmFtIGlzIG5vdCB1bmRlZmluZWQgd2UnbGwgc2tpcCBjYWxsaW5nIHRoZVxuLy8gcmVzb2x2ZXIgYW5kIGFzc3VtZSB0aGF0IGJvb2wgYXMgdGhlIGZpbmFsIHJlc3VsdC4gVGhpcyBhbGxvd3MgdGhlIGFzeW5jXG4vLyBjb2RlIHRvIHNob3J0Y3V0IHRoZSByZXNvbHZlci5cbmZ1bmN0aW9uIHJlc3VtZSAoYWN0dWFsLCBvdmVycmlkZSkge1xuICBpZiAoIXRoaXMucGF1c2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHZlciBpcyBub3QgY3VycmVudGx5IHBhdXNlZCcpO1xuICB9XG5cbiAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcblxuICAvLyBBIGZpbmFsIHJlc3VsdCB3YXMgcHJvdmlkZWQgc28ganVzdCBmaW5hbGl6ZSB0aGUgcmVzb2x2ZXJcbiAgaWYgKG92ZXJyaWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdGhpcy5maW5hbGl6ZShvdmVycmlkZSk7XG4gIH1cblxuICAvLyBMZXQncyBjb250aW51ZSByZXNvbHZpbmcgd2l0aCB0aGUgbmV3IHZhbHVlXG4gIC8vIE5vdGU6IHRoaXMoKSBsb29rcyB3ZWlyZCBidXQgcmVtZW1iZXIgd2UncmUgdXNpbmcgYSBmdW5jdGlvbiBhcyBjb250ZXh0XG4gIHJldHVybiB0aGlzKGFjdHVhbCk7XG59XG5cbi8vIENsb25lcyB0aGUgY3VycmVudCByZXNvbHZlciBzbyB3ZSBjYW4gZm9yayBhbmQgZGlzY2FyZCBvcGVyYXRpb25zLlxuZnVuY3Rpb24gZm9yayAoKSB7XG4gIHZhciBicmFuY2ggPSBhY3F1aXJlKHRoaXMuY2hhaW4pO1xuICBicmFuY2gucGFyZW50ID0gdGhpcztcbiAgYnJhbmNoLnJlc29sdmVkID0gXy5yZWplY3QodGhpcy5yZXNvbHZlZCwgQXJyYXkuaXNBcnJheSk7XG4gIHJldHVybiBicmFuY2g7XG59XG5cbi8vIEFzc3VtZSB0aGUgcmVzdWx0cyBmcm9tIGEgZm9yayBpbiB0aGUgbWFpbiByZXNvbHZlclxuZnVuY3Rpb24gam9pbiAoZm9yaykge1xuICB2YXIgbGVuID0gXy5yZWplY3QodGhpcy5yZXNvbHZlZCwgQXJyYXkuaXNBcnJheSkubGVuZ3RoO1xuICB0aGlzLnJlc29sdmVkLnB1c2goXG4gICAgZm9yay5yZXNvbHZlZC5zbGljZShsZW4pXG4gICk7XG59XG5cbi8vIFdoZW4gdGhlIGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24gaXQgZ2V0cyByZWdpc3RlcmVkIGFzIGEgZmluYWxpemVyIGZvciB0aGVcbi8vIHJlc3VsdCBvYnRhaW5lZCBvbmNlIHRoZSBleHByZXNzaW9uIGhhcyBiZWVuIGZ1bGx5IHJlc29sdmVkIChpLmUuIGFzeW5jKS5cbi8vIE90aGVyd2lzZSBpdCdsbCBleGVjdXRlIGFueSByZWdpc3RlcmVkIGZ1bmN0aW9ucyBvbiB0aGUgZ2l2ZW4gcmVzdWx0IGFuZFxuLy8gYWxsb3cgdGhlbSB0byBjaGFuZ2UgaXQgYmVmb3JlIHJlbGVhc2luZyB0aGUgcmVzb2x2ZXIgaW50byB0aGUgcG9vbC5cbmZ1bmN0aW9uIGZpbmFsaXplKHJlc3VsdCkge1xuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMuZmluYWxpemVycy5wdXNoKFxuICAgICAgW3Jlc3VsdCwgXy5sYXN0KHRoaXMucmVzb2x2ZWQpXVxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gTm90aGluZyB5ZXQgdG8gZmluYWxpemUgc2luY2UgdGhlIHJlc3VsdCBpcyBzdGlsbCB1bmtub3duXG4gIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBBbGxvdyBmaW5hbGl6ZXJzIHRvIHRvZ2dsZSB0aGUgcmVzdWx0IChMSUZPIG9yZGVyKVxuICB2YXIgZmluYWxpemVyO1xuICB3aGlsZSAodGhpcy5maW5hbGl6ZXJzLmxlbmd0aCA+IDApIHtcbiAgICBmaW5hbGl6ZXIgPSB0aGlzLmZpbmFsaXplcnMucG9wKCk7XG4gICAgcmVzdWx0ID0gZmluYWxpemVyWzBdLmNhbGwoZmluYWxpemVyWzFdLCByZXN1bHQpO1xuICAgIGZpbmFsaXplclsxXS5yZXN1bHQgPSByZXN1bHQ7XG4gIH1cblxuICAvLyBMZXQgdGhlIGNoYWluIGRpc3BhdGNoIHRoZSBmaW5hbCByZXN1bHQgYnV0IG9ubHkgZm9yIG5vbi1mb3JrZWQgcmVzb2x2ZXJzXG4gIGlmICghdGhpcy5wYXJlbnQpIHtcbiAgICB0aGlzLmNoYWluLmRpc3BhdGNoUmVzdWx0KHRoaXMucmVzb2x2ZWQsIHJlc3VsdCk7XG4gIH1cblxuICAvLyBXaGVuIGEgZmluYWwgcmVzdWx0IGhhcyBiZWVuIG9idGFpbmVkIHJlbGVhc2UgdGhlIHJlc29sdmVyIHRvIHRoZSBwb29sXG4gIHBvb2wucHVzaCh0aGlzKTtcbiAgaWYgKHBvb2wubGVuZ3RoID4gY3JlYXRlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUG9vbCBjb3JydXB0ZWQhIENyZWF0ZWQgJyArIGNyZWF0ZWQgKyAnIGJ1dCB0aGVyZSBhcmUgJyArIHBvb2wubGVuZ3RoICsgJyBwb29sZWQnKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEFjcXVpcmVzIGEgcmVzb2x2ZXIgZnVuY3RvciwgaWYgdGhlcmUgaXMgb25lIGluIHRoZSBwb29sIGl0J2xsIGJlIHJlc2V0IGFuZFxuLy8gcmV1c2VkLCBvdGhlcndpc2UgaXQnbGwgY3JlYXRlIGEgbmV3IG9uZS4gV2hlbiB5b3UncmUgZG9uZSB3aXRoIHRoZSByZXNvbHZlclxuLy8geW91IHNob3VkIGdpdmUgaXQgdG8gYHJlbGVhc2UoKWAgc28gaXQgY2FuIGJlIGluY29ycG9yYXRlZCB0byB0aGUgcG9vbC5cbi8vIFRoZSByZWFzb24gZm9yIHVzaW5nIGEgcG9vbCBvZiBvYmplY3RzIGhlcmUgaXMgdGhhdCBldmVyeSB0aW1lIHdlIGV2YWx1YXRlXG4vLyBhbiBleHByZXNzaW9uIHdlJ2xsIG5lZWQgYSByZXNvbHZlciwgd2hlbiB1c2luZyBxdWFudGlmaWVycyBtdWx0aXBsZSBmb3Jrc1xuLy8gd2lsbCBiZSBjcmVhdGVkLCBzbyBpdCdzIGltcG9ydGFudCB0byBpbXByb3ZlIHRoZSBwZXJmb3JtYW5jZS5cbmZ1bmN0aW9uIGFjcXVpcmUgKGNoYWluKSB7XG4gIHZhciByZXNvbHZlciA9IHBvb2wucG9wKCkgfHwgZmFjdG9yeSgpO1xuXG4gIC8vIFJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgcmVzb2x2ZXJcbiAgcmVzb2x2ZXIuY2hhaW4gPSBjaGFpbjtcbiAgcmVzb2x2ZXIucGFyZW50ID0gbnVsbDtcbiAgcmVzb2x2ZXIucGF1c2VkID0gZmFsc2U7XG4gIHdoaWxlIChyZXNvbHZlci5yZXNvbHZlZC5sZW5ndGggPiAwKSB7XG4gICAgcmVzb2x2ZXIucmVzb2x2ZWQucG9wKCk7XG4gIH1cbiAgd2hpbGUgKHJlc29sdmVyLmZpbmFsaXplcnMubGVuZ3RoID4gMCkge1xuICAgIHJlc29sdmVyLmZpbmFsaXplcnMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzb2x2ZXI7XG59XG5cblxuZXhwb3J0cy5hY3F1aXJlID0gYWNxdWlyZTtcbiJdfQ==
},{"./util":13}],12:[function(require,module,exports){
// Support for .should style syntax, notice that while here resides the core
// logic for it, the interface is done in ass.js in order to make it return
// the `ass` function and provide support for its use on beforeEach/afterEach.

var Chain = require('./chain');


var DEFAULT_PROP = 'should';

// Installs the typical .should property on the root Object prototype.
// You can install under any name of your choosing by giving it as argument.
//
// Basically borrowed from the Chai project:
//  Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
//  https://github.com/chaijs/chai/blob/master/lib/chai/interface/should.js
function should (name) {
  if (name === null) {
    return should.restore();
  }

  name = name || DEFAULT_PROP;

  if (name in Object.prototype) {
    if (!Chain.isChain(Object.prototype[name])) {
      throw new Error('ass.should: Object.prototype already has a .' + name + ' property');
    }
    return;
  }

  // modify Object.prototype to have `<name>`
  Object.defineProperty(Object.prototype, name, {
    get: function () {
      if (Chain.isChain(this)) {
        // Actually Chain instances don't inherit from Object but still
        return this;
      } else if (this instanceof String || this instanceof Number) {
        return new Chain(this.constructor(this));
      } else if (this instanceof Boolean) {
        return new Chain(!!this);
      }
      return new Chain(this);
    },
    set: function (value) {
      // Allow: global.ass = require('ass').should()
      Object.defineProperty(this, name, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    },
    configurable: true,  // Allow restoration
    enumerable: false
  });

  // Expose it as a no-op on Chains since they don't inherit from Object
  Object.defineProperty(Chain.prototype, name, {
    get: function () {
      return this;
    },
    configurable: true  // Allow restoration
  });

}

should.restore = function (name) {
  name = name || DEFAULT_PROP;

  if (name in Object.prototype) {
    if (Chain.isChain(Object.prototype[name])) {
      delete Object.prototype[name];
      delete Chain.prototype[name];
    }
  }
};


module.exports = should;

},{"./chain":2}],13:[function(require,module,exports){
(function (process,global){
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

// Get the native Promise or a shim
exports.Promise = global.Promise || (typeof window !== "undefined" ? window['window'] : typeof global !== "undefined" ? global['window'] : null).Promise;


// Capped pool to limit the maximum number of elements that can be
// stored (unbounded by default).
exports.CappedPool = function (max) {
  var pool = [];

  max = max || Number.MAX_VALUE;

  Object.defineProperty(pool, 'push', {
    value: function (v) {
      if (this.length < max) {
        Array.prototype.push.call(this, v);
      }
    }
  });

  return pool;
};


var doColors = _.once(function () {
  // Master override with our custom env variable
  if (process.env.ASS_COLORS !== undefined) {
    return /true|on|yes|enabled?|1/i.test(process.env.ASS_COLORS);
  }

  // Check if Karma is being used and has defined the colors
  var karma = global.__karma__;
  if (karma && karma.config && typeof karma.config.colors !== 'undefined') {
    return karma.config.colors;
  }

  // Check if mocha is around and verify against its configuration
  var Mocha = global.Mocha;
  if (Mocha === undefined && require.resolve && require.resolve('mocha')) {
    Mocha = (typeof window !== "undefined" ? window['Mocha'] : typeof global !== "undefined" ? global['Mocha'] : null);
  }
  if (Mocha !== undefined && Mocha.reporters !== undefined && Mocha.reporters.Base !== undefined) {
    return Mocha.reporters.Base.useColors;
  }

  // Query the environment and see if some common variables are set
  if (process.env.MOCHA_COLORS !== undefined) {
    return true;
  }
  if (/--color=always/.test(process.env.GREP_OPTIONS || '')) {
    return true;
  }

  // Finally just check if the environment is capable
  var tty = require('tty');
  return tty.isatty(1) && tty.isatty(2);
});


// Remove ANSI escapes from a string
function unansi (str) {
  return str.replace(/\x1b\[(\d+;?)+[a-z]/gi, '');
}


// Avoid repeated compilations by memoizing
var compileTemplate = _.memoize(function (tpl) {
  return _.template(tpl, null, {
    escape: /\{\{([\s\S]+?)\}\}/g
  });
});

// Dumps arbitrary values as strings in a concise way
// TODO: https://github.com/chaijs/chai/blob/master/lib/chai/utils/objDisplay.js
function valueDumper (v) {
  var value;

  if (_.isNumber(v) || _.isNaN(v) || _.isBoolean(v) || _.isNull(v) || _.isUndefined(v)) {
    value = '<' + v + '>';
  } else if (_.isRegExp(v)) {
    value = v.toString();
  } else if (_.isFunction(v)) {
    if (v.displayName) {
      value = v.displayName + '()';
    } else if (v.name) {
      value = v.name + '()';
    } else {
      value = '<function>';
    }
  } else {
    value = JSON.stringify(v);
  }

  return '\u001b[1;36m' + value + '\u001b[0m';
}


// Customized version of lodash template
function template (tpl, context) {
  var fn = compileTemplate(tpl);
  if (context === undefined) {
    return fn;
  }

  var origEscape = _.escape;
  try {
    // Override the default escape function to use it for dumping formatted values
    _.escape = valueDumper;

    return fn(context);

  } finally {
    _.escape = origEscape;
  }
}

// A simple fast function binding primitive only supporting setting the context
function bind(fn, thisArg) {
  return function () {
    return fn.apply(thisArg, arguments);
  };
}

// Quickly creates a new object with a custom prototype and some value
// overrides.
function create(proto, values) {
  if (0 === arguments.length) {
    return this;
  }

  // HACK: Use Function.prototype + new instead of the slow-ish Object.create
  create.prototype = proto;
  return _.assign(new create(), values || {});
}


// From http://siderite.blogspot.com/2014/11/super-fast-and-accurate-string-distance.html
function sift4(s1, s2, maxOffset) {
  if (!s1 || !s1.length) {
    if (!s2) {
      return 0;
    }
    return s2.length;
  }

  if (!s2 || !s2.length) {
    return s1.length;
  }

  var l1 = s1.length;
  var l2 = s2.length;

  var c1 = 0;  // cursor for string 1
  var c2 = 0;  // cursor for string 2
  var lcss = 0;  // largest common subsequence
  var local_cs = 0; // local common substring

  while ((c1 < l1) && (c2 < l2)) {
    if (s1.charAt(c1) == s2.charAt(c2)) {
      local_cs++;
    } else {
      lcss += local_cs;
      local_cs = 0;
      if (c1 != c2) {
        c1 = c2 = Math.max(c1,c2); // using max to bypass the need for computer transpositions ('ab' vs 'ba')
      }
      for (var i = 0; i < maxOffset; i++) {
        if ((c1 + i < l1) && (s1.charAt(c1 + i) === s2.charAt(c2))) {
          c1 += i;
          local_cs++;
          break;
        }
        if ((c2 + i < l2) && (s1.charAt(c1) === s2.charAt(c2 + i))) {
          c2 += i;
          local_cs++;
          break;
        }
      }
    }
    c1++;
    c2++;
  }
  lcss += local_cs;
  return Math.round(Math.max(l1, l2) - lcss);
}

exports.bind = bind;
exports.create = create;
exports.template = template;
exports.unansi = unansi;
exports.doColors = doColors;
exports.sift4 = sift4;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxuLy8gR2V0IHRoZSBuYXRpdmUgUHJvbWlzZSBvciBhIHNoaW1cbmV4cG9ydHMuUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlIHx8ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Wyd3aW5kb3cnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ3dpbmRvdyddIDogbnVsbCkuUHJvbWlzZTtcblxuXG4vLyBDYXBwZWQgcG9vbCB0byBsaW1pdCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBjYW4gYmVcbi8vIHN0b3JlZCAodW5ib3VuZGVkIGJ5IGRlZmF1bHQpLlxuZXhwb3J0cy5DYXBwZWRQb29sID0gZnVuY3Rpb24gKG1heCkge1xuICB2YXIgcG9vbCA9IFtdO1xuXG4gIG1heCA9IG1heCB8fCBOdW1iZXIuTUFYX1ZBTFVFO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwb29sLCAncHVzaCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA8IG1heCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKHRoaXMsIHYpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHBvb2w7XG59O1xuXG5cbnZhciBkb0NvbG9ycyA9IF8ub25jZShmdW5jdGlvbiAoKSB7XG4gIC8vIE1hc3RlciBvdmVycmlkZSB3aXRoIG91ciBjdXN0b20gZW52IHZhcmlhYmxlXG4gIGlmIChwcm9jZXNzLmVudi5BU1NfQ09MT1JTICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gL3RydWV8b258eWVzfGVuYWJsZWQ/fDEvaS50ZXN0KHByb2Nlc3MuZW52LkFTU19DT0xPUlMpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgS2FybWEgaXMgYmVpbmcgdXNlZCBhbmQgaGFzIGRlZmluZWQgdGhlIGNvbG9yc1xuICB2YXIga2FybWEgPSBnbG9iYWwuX19rYXJtYV9fO1xuICBpZiAoa2FybWEgJiYga2FybWEuY29uZmlnICYmIHR5cGVvZiBrYXJtYS5jb25maWcuY29sb3JzICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBrYXJtYS5jb25maWcuY29sb3JzO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgbW9jaGEgaXMgYXJvdW5kIGFuZCB2ZXJpZnkgYWdhaW5zdCBpdHMgY29uZmlndXJhdGlvblxuICB2YXIgTW9jaGEgPSBnbG9iYWwuTW9jaGE7XG4gIGlmIChNb2NoYSA9PT0gdW5kZWZpbmVkICYmIHJlcXVpcmUucmVzb2x2ZSAmJiByZXF1aXJlLnJlc29sdmUoJ21vY2hhJykpIHtcbiAgICBNb2NoYSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydNb2NoYSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnTW9jaGEnXSA6IG51bGwpO1xuICB9XG4gIGlmIChNb2NoYSAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycyAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycy5CYXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gTW9jaGEucmVwb3J0ZXJzLkJhc2UudXNlQ29sb3JzO1xuICB9XG5cbiAgLy8gUXVlcnkgdGhlIGVudmlyb25tZW50IGFuZCBzZWUgaWYgc29tZSBjb21tb24gdmFyaWFibGVzIGFyZSBzZXRcbiAgaWYgKHByb2Nlc3MuZW52Lk1PQ0hBX0NPTE9SUyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKC8tLWNvbG9yPWFsd2F5cy8udGVzdChwcm9jZXNzLmVudi5HUkVQX09QVElPTlMgfHwgJycpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBGaW5hbGx5IGp1c3QgY2hlY2sgaWYgdGhlIGVudmlyb25tZW50IGlzIGNhcGFibGVcbiAgdmFyIHR0eSA9IHJlcXVpcmUoJ3R0eScpO1xuICByZXR1cm4gdHR5LmlzYXR0eSgxKSAmJiB0dHkuaXNhdHR5KDIpO1xufSk7XG5cblxuLy8gUmVtb3ZlIEFOU0kgZXNjYXBlcyBmcm9tIGEgc3RyaW5nXG5mdW5jdGlvbiB1bmFuc2kgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xceDFiXFxbKFxcZCs7PykrW2Etel0vZ2ksICcnKTtcbn1cblxuXG4vLyBBdm9pZCByZXBlYXRlZCBjb21waWxhdGlvbnMgYnkgbWVtb2l6aW5nXG52YXIgY29tcGlsZVRlbXBsYXRlID0gXy5tZW1vaXplKGZ1bmN0aW9uICh0cGwpIHtcbiAgcmV0dXJuIF8udGVtcGxhdGUodHBsLCBudWxsLCB7XG4gICAgZXNjYXBlOiAvXFx7XFx7KFtcXHNcXFNdKz8pXFx9XFx9L2dcbiAgfSk7XG59KTtcblxuLy8gRHVtcHMgYXJiaXRyYXJ5IHZhbHVlcyBhcyBzdHJpbmdzIGluIGEgY29uY2lzZSB3YXlcbi8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS91dGlscy9vYmpEaXNwbGF5LmpzXG5mdW5jdGlvbiB2YWx1ZUR1bXBlciAodikge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKF8uaXNOdW1iZXIodikgfHwgXy5pc05hTih2KSB8fCBfLmlzQm9vbGVhbih2KSB8fCBfLmlzTnVsbCh2KSB8fCBfLmlzVW5kZWZpbmVkKHYpKSB7XG4gICAgdmFsdWUgPSAnPCcgKyB2ICsgJz4nO1xuICB9IGVsc2UgaWYgKF8uaXNSZWdFeHAodikpIHtcbiAgICB2YWx1ZSA9IHYudG9TdHJpbmcoKTtcbiAgfSBlbHNlIGlmIChfLmlzRnVuY3Rpb24odikpIHtcbiAgICBpZiAodi5kaXNwbGF5TmFtZSkge1xuICAgICAgdmFsdWUgPSB2LmRpc3BsYXlOYW1lICsgJygpJztcbiAgICB9IGVsc2UgaWYgKHYubmFtZSkge1xuICAgICAgdmFsdWUgPSB2Lm5hbWUgKyAnKCknO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9ICc8ZnVuY3Rpb24+JztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfVxuXG4gIHJldHVybiAnXFx1MDAxYlsxOzM2bScgKyB2YWx1ZSArICdcXHUwMDFiWzBtJztcbn1cblxuXG4vLyBDdXN0b21pemVkIHZlcnNpb24gb2YgbG9kYXNoIHRlbXBsYXRlXG5mdW5jdGlvbiB0ZW1wbGF0ZSAodHBsLCBjb250ZXh0KSB7XG4gIHZhciBmbiA9IGNvbXBpbGVUZW1wbGF0ZSh0cGwpO1xuICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIG9yaWdFc2NhcGUgPSBfLmVzY2FwZTtcbiAgdHJ5IHtcbiAgICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBlc2NhcGUgZnVuY3Rpb24gdG8gdXNlIGl0IGZvciBkdW1waW5nIGZvcm1hdHRlZCB2YWx1ZXNcbiAgICBfLmVzY2FwZSA9IHZhbHVlRHVtcGVyO1xuXG4gICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuXG4gIH0gZmluYWxseSB7XG4gICAgXy5lc2NhcGUgPSBvcmlnRXNjYXBlO1xuICB9XG59XG5cbi8vIEEgc2ltcGxlIGZhc3QgZnVuY3Rpb24gYmluZGluZyBwcmltaXRpdmUgb25seSBzdXBwb3J0aW5nIHNldHRpbmcgdGhlIGNvbnRleHRcbmZ1bmN0aW9uIGJpbmQoZm4sIHRoaXNBcmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxuLy8gUXVpY2tseSBjcmVhdGVzIGEgbmV3IG9iamVjdCB3aXRoIGEgY3VzdG9tIHByb3RvdHlwZSBhbmQgc29tZSB2YWx1ZVxuLy8gb3ZlcnJpZGVzLlxuZnVuY3Rpb24gY3JlYXRlKHByb3RvLCB2YWx1ZXMpIHtcbiAgaWYgKDAgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEhBQ0s6IFVzZSBGdW5jdGlvbi5wcm90b3R5cGUgKyBuZXcgaW5zdGVhZCBvZiB0aGUgc2xvdy1pc2ggT2JqZWN0LmNyZWF0ZVxuICBjcmVhdGUucHJvdG90eXBlID0gcHJvdG87XG4gIHJldHVybiBfLmFzc2lnbihuZXcgY3JlYXRlKCksIHZhbHVlcyB8fCB7fSk7XG59XG5cblxuLy8gRnJvbSBodHRwOi8vc2lkZXJpdGUuYmxvZ3Nwb3QuY29tLzIwMTQvMTEvc3VwZXItZmFzdC1hbmQtYWNjdXJhdGUtc3RyaW5nLWRpc3RhbmNlLmh0bWxcbmZ1bmN0aW9uIHNpZnQ0KHMxLCBzMiwgbWF4T2Zmc2V0KSB7XG4gIGlmICghczEgfHwgIXMxLmxlbmd0aCkge1xuICAgIGlmICghczIpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gczIubGVuZ3RoO1xuICB9XG5cbiAgaWYgKCFzMiB8fCAhczIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHMxLmxlbmd0aDtcbiAgfVxuXG4gIHZhciBsMSA9IHMxLmxlbmd0aDtcbiAgdmFyIGwyID0gczIubGVuZ3RoO1xuXG4gIHZhciBjMSA9IDA7ICAvLyBjdXJzb3IgZm9yIHN0cmluZyAxXG4gIHZhciBjMiA9IDA7ICAvLyBjdXJzb3IgZm9yIHN0cmluZyAyXG4gIHZhciBsY3NzID0gMDsgIC8vIGxhcmdlc3QgY29tbW9uIHN1YnNlcXVlbmNlXG4gIHZhciBsb2NhbF9jcyA9IDA7IC8vIGxvY2FsIGNvbW1vbiBzdWJzdHJpbmdcblxuICB3aGlsZSAoKGMxIDwgbDEpICYmIChjMiA8IGwyKSkge1xuICAgIGlmIChzMS5jaGFyQXQoYzEpID09IHMyLmNoYXJBdChjMikpIHtcbiAgICAgIGxvY2FsX2NzKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxjc3MgKz0gbG9jYWxfY3M7XG4gICAgICBsb2NhbF9jcyA9IDA7XG4gICAgICBpZiAoYzEgIT0gYzIpIHtcbiAgICAgICAgYzEgPSBjMiA9IE1hdGgubWF4KGMxLGMyKTsgLy8gdXNpbmcgbWF4IHRvIGJ5cGFzcyB0aGUgbmVlZCBmb3IgY29tcHV0ZXIgdHJhbnNwb3NpdGlvbnMgKCdhYicgdnMgJ2JhJylcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF4T2Zmc2V0OyBpKyspIHtcbiAgICAgICAgaWYgKChjMSArIGkgPCBsMSkgJiYgKHMxLmNoYXJBdChjMSArIGkpID09PSBzMi5jaGFyQXQoYzIpKSkge1xuICAgICAgICAgIGMxICs9IGk7XG4gICAgICAgICAgbG9jYWxfY3MrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGMyICsgaSA8IGwyKSAmJiAoczEuY2hhckF0KGMxKSA9PT0gczIuY2hhckF0KGMyICsgaSkpKSB7XG4gICAgICAgICAgYzIgKz0gaTtcbiAgICAgICAgICBsb2NhbF9jcysrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGMxKys7XG4gICAgYzIrKztcbiAgfVxuICBsY3NzICs9IGxvY2FsX2NzO1xuICByZXR1cm4gTWF0aC5yb3VuZChNYXRoLm1heChsMSwgbDIpIC0gbGNzcyk7XG59XG5cbmV4cG9ydHMuYmluZCA9IGJpbmQ7XG5leHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZTtcbmV4cG9ydHMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbmV4cG9ydHMudW5hbnNpID0gdW5hbnNpO1xuZXhwb3J0cy5kb0NvbG9ycyA9IGRvQ29sb3JzO1xuZXhwb3J0cy5zaWZ0NCA9IHNpZnQ0O1xuIl19
},{"_process":16,"tty":15}],14:[function(require,module,exports){
(function (global){
var ass = require('./lib/ass');
var Chain = require('./lib/chain');
var AssError = require('./lib/error');
var should = require('./lib/should');
var patches = require('./lib/patches');

// Register the default matchers
require('./lib/matchers/core');
require('./lib/matchers/coordination');
require('./lib/matchers/quantifiers');
require('./lib/matchers/promise');


// Bundle some of the internal stuff with the ass function
ass.Chain = Chain;
ass.Error = AssError;
ass.patches = patches;

// Forward the should installer
// Note: make them arity-0 to allow beforeEach(ass.should) in Mocha
ass.should = function (/* name */) {
  should(arguments.length > 0 ? arguments[0] : undefined);
  return ass;
};
ass.should.restore = function (/* name */) {
  should.restore(arguments.length > 0 ? arguments[0] : undefined);
  return ass;
};


// Patch third party libraries to understand about ass-ert expressions. We
// depend on patching lodash for the library to work correctly, however the
// rest are optional.
patches.lodash((typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null));

if (global.sinon && global.sinon.match) {
  patches.sinon(global.sinon);
} else if (require.resolve) {
    try {
      patches.sinon((typeof window !== "undefined" ? window['sinon'] : typeof global !== "undefined" ? global['sinon'] : null));
    } catch (e) {
        // sinon is not installed
    }
}


module.exports = ass;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGFzcyA9IHJlcXVpcmUoJy4vbGliL2FzcycpO1xudmFyIENoYWluID0gcmVxdWlyZSgnLi9saWIvY2hhaW4nKTtcbnZhciBBc3NFcnJvciA9IHJlcXVpcmUoJy4vbGliL2Vycm9yJyk7XG52YXIgc2hvdWxkID0gcmVxdWlyZSgnLi9saWIvc2hvdWxkJyk7XG52YXIgcGF0Y2hlcyA9IHJlcXVpcmUoJy4vbGliL3BhdGNoZXMnKTtcblxuLy8gUmVnaXN0ZXIgdGhlIGRlZmF1bHQgbWF0Y2hlcnNcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL2NvcmUnKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL2Nvb3JkaW5hdGlvbicpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvcXVhbnRpZmllcnMnKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL3Byb21pc2UnKTtcblxuXG4vLyBCdW5kbGUgc29tZSBvZiB0aGUgaW50ZXJuYWwgc3R1ZmYgd2l0aCB0aGUgYXNzIGZ1bmN0aW9uXG5hc3MuQ2hhaW4gPSBDaGFpbjtcbmFzcy5FcnJvciA9IEFzc0Vycm9yO1xuYXNzLnBhdGNoZXMgPSBwYXRjaGVzO1xuXG4vLyBGb3J3YXJkIHRoZSBzaG91bGQgaW5zdGFsbGVyXG4vLyBOb3RlOiBtYWtlIHRoZW0gYXJpdHktMCB0byBhbGxvdyBiZWZvcmVFYWNoKGFzcy5zaG91bGQpIGluIE1vY2hhXG5hc3Muc2hvdWxkID0gZnVuY3Rpb24gKC8qIG5hbWUgKi8pIHtcbiAgc2hvdWxkKGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogdW5kZWZpbmVkKTtcbiAgcmV0dXJuIGFzcztcbn07XG5hc3Muc2hvdWxkLnJlc3RvcmUgPSBmdW5jdGlvbiAoLyogbmFtZSAqLykge1xuICBzaG91bGQucmVzdG9yZShhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IHVuZGVmaW5lZCk7XG4gIHJldHVybiBhc3M7XG59O1xuXG5cbi8vIFBhdGNoIHRoaXJkIHBhcnR5IGxpYnJhcmllcyB0byB1bmRlcnN0YW5kIGFib3V0IGFzcy1lcnQgZXhwcmVzc2lvbnMuIFdlXG4vLyBkZXBlbmQgb24gcGF0Y2hpbmcgbG9kYXNoIGZvciB0aGUgbGlicmFyeSB0byB3b3JrIGNvcnJlY3RseSwgaG93ZXZlciB0aGVcbi8vIHJlc3QgYXJlIG9wdGlvbmFsLlxucGF0Y2hlcy5sb2Rhc2goKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ18nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ18nXSA6IG51bGwpKTtcblxuaWYgKGdsb2JhbC5zaW5vbiAmJiBnbG9iYWwuc2lub24ubWF0Y2gpIHtcbiAgcGF0Y2hlcy5zaW5vbihnbG9iYWwuc2lub24pO1xufSBlbHNlIGlmIChyZXF1aXJlLnJlc29sdmUpIHtcbiAgICB0cnkge1xuICAgICAgcGF0Y2hlcy5zaW5vbigodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snc2lub24nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ3Npbm9uJ10gOiBudWxsKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBzaW5vbiBpcyBub3QgaW5zdGFsbGVkXG4gICAgfVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gYXNzO1xuIl19
},{"./lib/ass":1,"./lib/chain":2,"./lib/error":3,"./lib/matchers/coordination":6,"./lib/matchers/core":7,"./lib/matchers/promise":8,"./lib/matchers/quantifiers":9,"./lib/patches":10,"./lib/should":12}],15:[function(require,module,exports){

},{}],16:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],17:[function(require,module,exports){
// Emulates V8's CallSite object from a stacktrace.js frame object

function CallSite (frame) {
  this.frame = frame;
};

CallSite.prototype = Object.create({
  getLineNumber: function () {
    return this.frame.lineNumber;
  },
  getColumnNumber: function () {
    return this.frame.columnNumber;
  },
  getFileName: function () {
    return this.frame.fileName;
  },
  getFunction: function () {
    return this.frame.function;
  },
  getThis: function () {
    return null;
  },
  getTypeName: function () {
    return null;
  },
  getMethodName: function () {
    if (this.frame.functionName) {
      return this.frame.functionName.split('.').pop();
    }
    return null;
  },
  getFunctionName: function () {
    return this.frame.functionName;
  },
  getEvalOrigin: function () {
    return null;
  },
  isToplevel: function () {
    return false; // TODO
  },
  isEval: function () {
    return false; // TODO
  },
  isNative: function () {
    return false; // TODO
  },
  isConstructor: function () {
    return /^new(\s|$)/.test(this.frame.functionName);
  },
  toString: function () {
    var name = this.getFunctionName() || '<anonymous>';
    var loc = this.getFileName() + ':' + this.getLineNumber() + ':' + this.getColumnNumber()
    return name + ' (' + loc + ')';
  }
});


module.exports = CallSite;

},{}],18:[function(require,module,exports){
(function (process,global){
var ErrorStackParser = require('error-stack-parser');
var CallSite = require('./call-site');

// Keep a reference to the builtin error constructor
var NativeError = Error;

// Annotation symbols
var SYMBOL_FRAMES = '@@failure/frames';
var SYMBOL_IGNORE = '@@failure/ignore';


function Failure (message, sff) {
  if (!(this instanceof Failure)) {
    return new Failure(message, sff || Failure);
  }

  this.sff = sff || this.constructor;

  this.message = message;

  // Generate a getter for the frames, this ensures that we do as little work
  // as possible when instantiating the error, deferring the expensive stack
  // mangling operations until the .stack property is actually requested.
  this._getFrames = makeFramesGetter(this.sff);

  // On ES5 engines we use one-time getters to actually defer the expensive
  // operations (defined in the prototype for performance reasons) while legacy
  // engines will simply do all the work up front.
  if (!/\[native code\]/.test(Object.defineProperty)) {
    this.frames = unwind(this._getFrames());
    this._getFrames = null;
    this.stack = this.generateStackTrace();
  }

  return this;
}

// Set FRAME_EMPTY to null to disable any sort of separator
Failure.FRAME_EMPTY = '  ----';
Failure.FRAME_PREFIX = '  at ';

// By default we enable tracking for async stack traces
Failure.TRACKING = true;


// Helper to obtain the current stack trace
var getErrorWithStack = function () {
  return new NativeError();
};
// Some engines do not generate the .stack property until it's thrown
if (!getErrorWithStack().stack) {
  getErrorWithStack = function () {
    try { throw new NativeError(); } catch (e) { return e; }
  };
}

// Trim frames under the provided stack first function
function trim(frames, sff) {
  var fn, name = sff.name;
  if (!frames) {
    console.warn('[Failure] error capturing frames');
    return [];
  }
  for (var i=0; i < frames.length; i++) {
    fn = frames[i].getFunction();
    if (fn && fn === sff || name && name === frames[i].getFunctionName()) {
      return frames.slice(i + 1);
    }
  }
  return frames;
}

function unwind (frames) {
  var result = [];

  for (var i=0, fn; i < frames.length; i++) {
    fn = frames[i].getFunction();

    if (!fn || !fn[SYMBOL_IGNORE]) {
      result.push(frames[i]);
    }

    if (fn && fn[SYMBOL_FRAMES]) {
      if (Failure.FRAME_EMPTY) {
        result.push(null);
      }

      // Call the getter and keep a reference to the result in case we have to
      // unwind the same function another time.
      // TODO: Make sure keeping a reference to the frames doesn't create leaks
      if (typeof fn[SYMBOL_FRAMES] === 'function') {
        var getter = fn[SYMBOL_FRAMES];
        fn[SYMBOL_FRAMES] = null;
        fn[SYMBOL_FRAMES] = getter();
      }

      if (!fn[SYMBOL_FRAMES]) {
        console.warn('[Failure] Empty frames annotation');
        continue;
      }

      result.push.apply(result, unwind(fn[SYMBOL_FRAMES]));
      break;
    }
  }

  return result;
}

// Receiver for the frames in a .stack property from captureStackTrace
var V8FRAMES = {};

// V8 code path for generating a frames getter
function makeFramesGetterV8 (sff) {
  // This will call our custom prepareStackTrace
  NativeError.captureStackTrace(V8FRAMES, sff || makeFramesGetterV8);
  sff = null;
  var frames = V8FRAMES.stack;
  V8FRAMES.stack = null;  // This is needed to avoid leaks!!!
  V8FRAMES = {};  // The next call requires an empty object

  return function (cleanup) {
    var result = frames;
    // Clean up closure variables to help GC
    frames = null;
    return result;
  };
}

// non-V8 code path for generating a frames getter
function makeFramesGetterCompat (sff) {
  // Obtain a stack trace at the current point
  var error = getErrorWithStack();

  // Walk the caller chain to annotate the stack with function references
  // Given the limitations imposed by ES5 "strict mode" it's not possible
  // to obtain references to functions beyond one that is defined in strict
  // mode. Also note that any kind of recursion will make the walker unable
  // to go past it.
  var caller = arguments.callee;
  var functions = [getErrorWithStack];
  for (var i=0; caller && i < 10; i++) {
    functions.push(caller);
    if (caller.caller === caller) break;
    caller = caller.caller;
  }
  caller = null;

  return function (cleanup) {
    var frames = null;

    if (!cleanup) {
      // Parse the stack trace
      frames = ErrorStackParser.parse(error);
      // Attach function references to the frames (skipping the maker frames)
      // and creating CallSite objects for each one.
      for (var i=2; i < frames.length; i++) {
        frames[i].function = functions[i];
        frames[i] = new CallSite(frames[i]);
      }

      frames = trim(frames.slice(2), sff);
    }

    // Clean up closure variables to help GC
    sff = error = functions = null;

    return frames;
  };
}

// Generates a getter for the call site frames. The getter returned by
// these factories can only used once, since they clean up their inner state
// after they are called. They accept an optional boolean argument which
// if true will just clean up without computing the frames.
//
// TODO: If we observe leaks with complex use cases (due to closure scopes)
//       we can generate here our compat CallSite objects storing the function's
//       source code instead of an actual reference to them, that should help
//       the GC since we'll be just keeping literals around.
var makeFramesGetter = typeof NativeError.captureStackTrace === 'function'
                     ? makeFramesGetterV8
                     : makeFramesGetterCompat;


// Override V8 stack trace builder to inject our logic
var oldPrepareStackTrace = Error.prepareStackTrace;
Error.prepareStackTrace = function (error, frames) {
  // When called from makeFramesGetterV8 we just want to obtain the frames
  if (error === V8FRAMES) {
    return frames;
  }

  // Forward to any previously defined behaviour
  if (oldPrepareStackTrace) {
    try {
      return oldPrepareStackTrace.call(Error, error, frames);
    } catch (e) {
      // Just ignore the error (ie: karma-source-map-support)
    }
  }

  // Emulate default behaviour (with long-traces)
  return Failure.prototype.prepareStackTrace.call(error, unwind(frames));
};

// Attach a new exclusion predicate for frames
function exclude (ctor, predicate) {
  var fn = predicate;

  if (typeof predicate === 'string') {
    fn = function (frame) {
      return -1 !== frame.getFileName().indexOf(predicate);
    };
  } else if (typeof predicate.test === 'function') {
    fn = function (frame) {
      return predicate.test(frame.getFileName());
    };
  }

  ctor.excludes.push(fn);
}

// Expose the filter in the root Failure type
Failure.excludes = [];
Failure.exclude = exclude.bind(null, Failure);

// Attach a frames getter to the function so we can re-construct async stacks.
//
// Note that this just augments the function with the new property, it doesn't
// create a wrapper every time it's called, so using it multiple times on the
// same function will indeed overwrite the previous tracking information. This
// is intended since it's faster and more importantly doesn't break some APIs
// using callback references to unregister them for instance.
// When you want to use the same function with different tracking information
// just use Failure.wrap().
//
// The tracking can be globally disabled by setting Failure.TRACKING to false
Failure.track = function Failure_track (fn, sff) {
  if (typeof fn !== 'function') {
    return fn;
  }

  // Clean up previous frames to help the GC
  if (typeof fn[SYMBOL_FRAMES] === 'function') {
    fn[SYMBOL_FRAMES](true);
  }

  if (Failure.TRACKING) {
    fn[SYMBOL_FRAMES] = null;
    fn[SYMBOL_FRAMES] = makeFramesGetter(sff || Failure_track);
  }

  return fn;
};

// Wraps the function before annotating it with tracking information, this
// allows to track multiple calls for a single function.
Failure.wrap = function Failure_wrap (fn) {
  var wrapper = Failure.ignore(function () {
    return fn.apply(this, arguments);
  });

  return Failure.track(wrapper, Failure_wrap);
};

// Mark a function to be ignored when generating stack traces
Failure.ignore = function Failure_ignore (fn) {
  fn[SYMBOL_IGNORE] = true;
  return fn;
};

// Helper for tracking a setTimeout
Failure.setTimeout = function Failure_setTimeout () {
  arguments[0] = Failure.track(arguments[0], Failure_setTimeout);
  return setTimeout.apply(null, arguments);
};

// Helper for tracking a nextTick
Failure.nextTick = function Failure_nextTick () {
  arguments[0] = Failure.track(arguments[0], Failure_nextTick);
  return process.nextTick.apply(process, arguments);
};

// Allows to easily patch a function that receives a callback
// to allow tracking the async flows.
// ie: Failure.path(window, 'setInterval')
Failure.patch = function Failure_patch(obj, name, idx) {
  if (obj && typeof obj[name] !== 'function') {
    throw new Error('Object does not have a "' + name + '" method');
  }

  var original = obj[name];

  // When the exact argument index is provided use an optimized code path
  if (typeof idx === 'number') {

    obj[name] = function () {
      arguments[idx] = Failure.track(arguments[idx], obj[name]);
      return original.apply(this, arguments);
    };

  // Otherwise detect the functions to track at invokation time
  } else {

    obj[name] = function () {
      for (var i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'function') {
          arguments[i] = Failure.track(arguments[i], obj[name]);
        }
      }
      return original.apply(this, arguments);
    };

  }

  // Augment the wrapper with any properties from the original
  for (var k in original) if (original.hasOwnProperty(k)) {
    obj[name][k] = original[k];
  }

  return obj[name];
};

// Helper to create new Failure types
Failure.create = function (name, props) {
  if (typeof name !== 'string') {
    throw new Failure('Expected a name as first argument');
  }

  function ctor (message, sff) {
    if (!(this instanceof Failure)) {
      return new ctor(message, sff);
    }
    Failure.apply(this, arguments);
  }

  // Augment constructor
  ctor.excludes = [];
  ctor.exclude = function (predicate) {
    exclude(ctor, predicate);
  };

  ctor.prototype = Object.create(Failure.prototype);
  ctor.prototype.constructor = ctor;
  ctor.prototype.name = name;
  if (typeof props === 'function') {
    ctor.prototype.prepareStackTrace = props;
  } else if (props) {
    Object.keys(props).forEach(function (prop) {
      ctor.prototype[prop] = prop;
    });
  }
  return ctor;
};

var builtinErrorTypes = [
  'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError',
  'EvalError', 'URIError', 'InternalError'
];
var builtinErrors = {};

Failure.install = function () {
  var root = typeof window === 'object' ? window : global;

  builtinErrorTypes.forEach(function (type) {
    if (root[type] && !builtinErrors[type]) {
      builtinErrors[type] = root[type];
      root[type] = Failure.create(type);
    }
  });

  // Allow usage: var Failure = require('failure').install()
  return Failure;
};

Failure.uninstall = function () {
  builtinErrorTypes.forEach(function (type) {
    root[type] = builtinErrors[type] || root[type];
  });
};


var proto = Failure.prototype = Object.create(Error.prototype);
proto.constructor = Failure;

proto.name = 'Failure';
proto.message = '';

if (typeof Object.defineProperty === 'function') {
  Object.defineProperty(proto, 'frames', {
    get: function () {
      // Use trimming just in case the sff was defined after constructing
      var frames = unwind(trim(this._getFrames(), this.sff));

      // Cache next accesses to the property
      Object.defineProperty(this, 'frames', {
        value: frames,
        writable: true
      });

      // Clean up the getter closure
      this._getFrames = null;

      return frames;
    }
  });

  Object.defineProperty(proto, 'stack', {
    get: function () {
      var stack = this.generateStackTrace();

      // Cache next accesses to the property
      Object.defineProperty(this, 'stack', {
        value: stack,
        writable: true
      });

      return stack;
    }
  });
}

proto.generateStackTrace = function () {
  var excludes = this.constructor.excludes;
  var include, frames = [];

  // Specific prototypes inherit the excludes from Failure
  if (excludes !== Failure.excludes) {
    excludes.push.apply(excludes, Failure.excludes);
  }

  // Apply filtering
  for (var i=0; i < this.frames.length; i++) {
    include = true;
    if (this.frames[i]) {
      for (var j=0; include && j < excludes.length; j++) {
        include &= !excludes[j].call(this, this.frames[i]);
      }
    }
    if (include) {
      frames.push(this.frames[i]);
    }
  }

  // Honor any previously defined stacktrace formatter by allowing
  // it to format the frames. This is needed when using
  // node-source-map-support for instance.
  // TODO: Can we map the "null" frames to a CallFrame shim?
  if (oldPrepareStackTrace) {
    frames = frames.filter(function (x) { return !!x; });
    return oldPrepareStackTrace.call(Error, this, frames);
  }

  return this.prepareStackTrace(frames);
};

proto.prepareStackTrace = function (frames) {
  var lines = [this];
  for (var i=0; i < frames.length; i++) {
    lines.push(
      frames[i] ? Failure.FRAME_PREFIX + frames[i] : Failure.FRAME_EMPTY
    );
  }
  return lines.join('\n');
};


module.exports = Failure;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9mYWlsdXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgRXJyb3JTdGFja1BhcnNlciA9IHJlcXVpcmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicpO1xudmFyIENhbGxTaXRlID0gcmVxdWlyZSgnLi9jYWxsLXNpdGUnKTtcblxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgYnVpbHRpbiBlcnJvciBjb25zdHJ1Y3RvclxudmFyIE5hdGl2ZUVycm9yID0gRXJyb3I7XG5cbi8vIEFubm90YXRpb24gc3ltYm9sc1xudmFyIFNZTUJPTF9GUkFNRVMgPSAnQEBmYWlsdXJlL2ZyYW1lcyc7XG52YXIgU1lNQk9MX0lHTk9SRSA9ICdAQGZhaWx1cmUvaWdub3JlJztcblxuXG5mdW5jdGlvbiBGYWlsdXJlIChtZXNzYWdlLCBzZmYpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZhaWx1cmUpKSB7XG4gICAgcmV0dXJuIG5ldyBGYWlsdXJlKG1lc3NhZ2UsIHNmZiB8fCBGYWlsdXJlKTtcbiAgfVxuXG4gIHRoaXMuc2ZmID0gc2ZmIHx8IHRoaXMuY29uc3RydWN0b3I7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblxuICAvLyBHZW5lcmF0ZSBhIGdldHRlciBmb3IgdGhlIGZyYW1lcywgdGhpcyBlbnN1cmVzIHRoYXQgd2UgZG8gYXMgbGl0dGxlIHdvcmtcbiAgLy8gYXMgcG9zc2libGUgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBlcnJvciwgZGVmZXJyaW5nIHRoZSBleHBlbnNpdmUgc3RhY2tcbiAgLy8gbWFuZ2xpbmcgb3BlcmF0aW9ucyB1bnRpbCB0aGUgLnN0YWNrIHByb3BlcnR5IGlzIGFjdHVhbGx5IHJlcXVlc3RlZC5cbiAgdGhpcy5fZ2V0RnJhbWVzID0gbWFrZUZyYW1lc0dldHRlcih0aGlzLnNmZik7XG5cbiAgLy8gT24gRVM1IGVuZ2luZXMgd2UgdXNlIG9uZS10aW1lIGdldHRlcnMgdG8gYWN0dWFsbHkgZGVmZXIgdGhlIGV4cGVuc2l2ZVxuICAvLyBvcGVyYXRpb25zIChkZWZpbmVkIGluIHRoZSBwcm90b3R5cGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIHdoaWxlIGxlZ2FjeVxuICAvLyBlbmdpbmVzIHdpbGwgc2ltcGx5IGRvIGFsbCB0aGUgd29yayB1cCBmcm9udC5cbiAgaWYgKCEvXFxbbmF0aXZlIGNvZGVcXF0vLnRlc3QoT2JqZWN0LmRlZmluZVByb3BlcnR5KSkge1xuICAgIHRoaXMuZnJhbWVzID0gdW53aW5kKHRoaXMuX2dldEZyYW1lcygpKTtcbiAgICB0aGlzLl9nZXRGcmFtZXMgPSBudWxsO1xuICAgIHRoaXMuc3RhY2sgPSB0aGlzLmdlbmVyYXRlU3RhY2tUcmFjZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIFNldCBGUkFNRV9FTVBUWSB0byBudWxsIHRvIGRpc2FibGUgYW55IHNvcnQgb2Ygc2VwYXJhdG9yXG5GYWlsdXJlLkZSQU1FX0VNUFRZID0gJyAgLS0tLSc7XG5GYWlsdXJlLkZSQU1FX1BSRUZJWCA9ICcgIGF0ICc7XG5cbi8vIEJ5IGRlZmF1bHQgd2UgZW5hYmxlIHRyYWNraW5nIGZvciBhc3luYyBzdGFjayB0cmFjZXNcbkZhaWx1cmUuVFJBQ0tJTkcgPSB0cnVlO1xuXG5cbi8vIEhlbHBlciB0byBvYnRhaW4gdGhlIGN1cnJlbnQgc3RhY2sgdHJhY2VcbnZhciBnZXRFcnJvcldpdGhTdGFjayA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyBOYXRpdmVFcnJvcigpO1xufTtcbi8vIFNvbWUgZW5naW5lcyBkbyBub3QgZ2VuZXJhdGUgdGhlIC5zdGFjayBwcm9wZXJ0eSB1bnRpbCBpdCdzIHRocm93blxuaWYgKCFnZXRFcnJvcldpdGhTdGFjaygpLnN0YWNrKSB7XG4gIGdldEVycm9yV2l0aFN0YWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7IHRocm93IG5ldyBOYXRpdmVFcnJvcigpOyB9IGNhdGNoIChlKSB7IHJldHVybiBlOyB9XG4gIH07XG59XG5cbi8vIFRyaW0gZnJhbWVzIHVuZGVyIHRoZSBwcm92aWRlZCBzdGFjayBmaXJzdCBmdW5jdGlvblxuZnVuY3Rpb24gdHJpbShmcmFtZXMsIHNmZikge1xuICB2YXIgZm4sIG5hbWUgPSBzZmYubmFtZTtcbiAgaWYgKCFmcmFtZXMpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tGYWlsdXJlXSBlcnJvciBjYXB0dXJpbmcgZnJhbWVzJyk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGZvciAodmFyIGk9MDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGZuID0gZnJhbWVzW2ldLmdldEZ1bmN0aW9uKCk7XG4gICAgaWYgKGZuICYmIGZuID09PSBzZmYgfHwgbmFtZSAmJiBuYW1lID09PSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb25OYW1lKCkpIHtcbiAgICAgIHJldHVybiBmcmFtZXMuc2xpY2UoaSArIDEpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZnJhbWVzO1xufVxuXG5mdW5jdGlvbiB1bndpbmQgKGZyYW1lcykge1xuICB2YXIgcmVzdWx0ID0gW107XG5cbiAgZm9yICh2YXIgaT0wLCBmbjsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGZuID0gZnJhbWVzW2ldLmdldEZ1bmN0aW9uKCk7XG5cbiAgICBpZiAoIWZuIHx8ICFmbltTWU1CT0xfSUdOT1JFXSkge1xuICAgICAgcmVzdWx0LnB1c2goZnJhbWVzW2ldKTtcbiAgICB9XG5cbiAgICBpZiAoZm4gJiYgZm5bU1lNQk9MX0ZSQU1FU10pIHtcbiAgICAgIGlmIChGYWlsdXJlLkZSQU1FX0VNUFRZKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKG51bGwpO1xuICAgICAgfVxuXG4gICAgICAvLyBDYWxsIHRoZSBnZXR0ZXIgYW5kIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIHJlc3VsdCBpbiBjYXNlIHdlIGhhdmUgdG9cbiAgICAgIC8vIHVud2luZCB0aGUgc2FtZSBmdW5jdGlvbiBhbm90aGVyIHRpbWUuXG4gICAgICAvLyBUT0RPOiBNYWtlIHN1cmUga2VlcGluZyBhIHJlZmVyZW5jZSB0byB0aGUgZnJhbWVzIGRvZXNuJ3QgY3JlYXRlIGxlYWtzXG4gICAgICBpZiAodHlwZW9mIGZuW1NZTUJPTF9GUkFNRVNdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBnZXR0ZXIgPSBmbltTWU1CT0xfRlJBTUVTXTtcbiAgICAgICAgZm5bU1lNQk9MX0ZSQU1FU10gPSBudWxsO1xuICAgICAgICBmbltTWU1CT0xfRlJBTUVTXSA9IGdldHRlcigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWZuW1NZTUJPTF9GUkFNRVNdKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW0ZhaWx1cmVdIEVtcHR5IGZyYW1lcyBhbm5vdGF0aW9uJyk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHVud2luZChmbltTWU1CT0xfRlJBTUVTXSkpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gUmVjZWl2ZXIgZm9yIHRoZSBmcmFtZXMgaW4gYSAuc3RhY2sgcHJvcGVydHkgZnJvbSBjYXB0dXJlU3RhY2tUcmFjZVxudmFyIFY4RlJBTUVTID0ge307XG5cbi8vIFY4IGNvZGUgcGF0aCBmb3IgZ2VuZXJhdGluZyBhIGZyYW1lcyBnZXR0ZXJcbmZ1bmN0aW9uIG1ha2VGcmFtZXNHZXR0ZXJWOCAoc2ZmKSB7XG4gIC8vIFRoaXMgd2lsbCBjYWxsIG91ciBjdXN0b20gcHJlcGFyZVN0YWNrVHJhY2VcbiAgTmF0aXZlRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoVjhGUkFNRVMsIHNmZiB8fCBtYWtlRnJhbWVzR2V0dGVyVjgpO1xuICBzZmYgPSBudWxsO1xuICB2YXIgZnJhbWVzID0gVjhGUkFNRVMuc3RhY2s7XG4gIFY4RlJBTUVTLnN0YWNrID0gbnVsbDsgIC8vIFRoaXMgaXMgbmVlZGVkIHRvIGF2b2lkIGxlYWtzISEhXG4gIFY4RlJBTUVTID0ge307ICAvLyBUaGUgbmV4dCBjYWxsIHJlcXVpcmVzIGFuIGVtcHR5IG9iamVjdFxuXG4gIHJldHVybiBmdW5jdGlvbiAoY2xlYW51cCkge1xuICAgIHZhciByZXN1bHQgPSBmcmFtZXM7XG4gICAgLy8gQ2xlYW4gdXAgY2xvc3VyZSB2YXJpYWJsZXMgdG8gaGVscCBHQ1xuICAgIGZyYW1lcyA9IG51bGw7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxuLy8gbm9uLVY4IGNvZGUgcGF0aCBmb3IgZ2VuZXJhdGluZyBhIGZyYW1lcyBnZXR0ZXJcbmZ1bmN0aW9uIG1ha2VGcmFtZXNHZXR0ZXJDb21wYXQgKHNmZikge1xuICAvLyBPYnRhaW4gYSBzdGFjayB0cmFjZSBhdCB0aGUgY3VycmVudCBwb2ludFxuICB2YXIgZXJyb3IgPSBnZXRFcnJvcldpdGhTdGFjaygpO1xuXG4gIC8vIFdhbGsgdGhlIGNhbGxlciBjaGFpbiB0byBhbm5vdGF0ZSB0aGUgc3RhY2sgd2l0aCBmdW5jdGlvbiByZWZlcmVuY2VzXG4gIC8vIEdpdmVuIHRoZSBsaW1pdGF0aW9ucyBpbXBvc2VkIGJ5IEVTNSBcInN0cmljdCBtb2RlXCIgaXQncyBub3QgcG9zc2libGVcbiAgLy8gdG8gb2J0YWluIHJlZmVyZW5jZXMgdG8gZnVuY3Rpb25zIGJleW9uZCBvbmUgdGhhdCBpcyBkZWZpbmVkIGluIHN0cmljdFxuICAvLyBtb2RlLiBBbHNvIG5vdGUgdGhhdCBhbnkga2luZCBvZiByZWN1cnNpb24gd2lsbCBtYWtlIHRoZSB3YWxrZXIgdW5hYmxlXG4gIC8vIHRvIGdvIHBhc3QgaXQuXG4gIHZhciBjYWxsZXIgPSBhcmd1bWVudHMuY2FsbGVlO1xuICB2YXIgZnVuY3Rpb25zID0gW2dldEVycm9yV2l0aFN0YWNrXTtcbiAgZm9yICh2YXIgaT0wOyBjYWxsZXIgJiYgaSA8IDEwOyBpKyspIHtcbiAgICBmdW5jdGlvbnMucHVzaChjYWxsZXIpO1xuICAgIGlmIChjYWxsZXIuY2FsbGVyID09PSBjYWxsZXIpIGJyZWFrO1xuICAgIGNhbGxlciA9IGNhbGxlci5jYWxsZXI7XG4gIH1cbiAgY2FsbGVyID0gbnVsbDtcblxuICByZXR1cm4gZnVuY3Rpb24gKGNsZWFudXApIHtcbiAgICB2YXIgZnJhbWVzID0gbnVsbDtcblxuICAgIGlmICghY2xlYW51cCkge1xuICAgICAgLy8gUGFyc2UgdGhlIHN0YWNrIHRyYWNlXG4gICAgICBmcmFtZXMgPSBFcnJvclN0YWNrUGFyc2VyLnBhcnNlKGVycm9yKTtcbiAgICAgIC8vIEF0dGFjaCBmdW5jdGlvbiByZWZlcmVuY2VzIHRvIHRoZSBmcmFtZXMgKHNraXBwaW5nIHRoZSBtYWtlciBmcmFtZXMpXG4gICAgICAvLyBhbmQgY3JlYXRpbmcgQ2FsbFNpdGUgb2JqZWN0cyBmb3IgZWFjaCBvbmUuXG4gICAgICBmb3IgKHZhciBpPTI7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZnJhbWVzW2ldLmZ1bmN0aW9uID0gZnVuY3Rpb25zW2ldO1xuICAgICAgICBmcmFtZXNbaV0gPSBuZXcgQ2FsbFNpdGUoZnJhbWVzW2ldKTtcbiAgICAgIH1cblxuICAgICAgZnJhbWVzID0gdHJpbShmcmFtZXMuc2xpY2UoMiksIHNmZik7XG4gICAgfVxuXG4gICAgLy8gQ2xlYW4gdXAgY2xvc3VyZSB2YXJpYWJsZXMgdG8gaGVscCBHQ1xuICAgIHNmZiA9IGVycm9yID0gZnVuY3Rpb25zID0gbnVsbDtcblxuICAgIHJldHVybiBmcmFtZXM7XG4gIH07XG59XG5cbi8vIEdlbmVyYXRlcyBhIGdldHRlciBmb3IgdGhlIGNhbGwgc2l0ZSBmcmFtZXMuIFRoZSBnZXR0ZXIgcmV0dXJuZWQgYnlcbi8vIHRoZXNlIGZhY3RvcmllcyBjYW4gb25seSB1c2VkIG9uY2UsIHNpbmNlIHRoZXkgY2xlYW4gdXAgdGhlaXIgaW5uZXIgc3RhdGVcbi8vIGFmdGVyIHRoZXkgYXJlIGNhbGxlZC4gVGhleSBhY2NlcHQgYW4gb3B0aW9uYWwgYm9vbGVhbiBhcmd1bWVudCB3aGljaFxuLy8gaWYgdHJ1ZSB3aWxsIGp1c3QgY2xlYW4gdXAgd2l0aG91dCBjb21wdXRpbmcgdGhlIGZyYW1lcy5cbi8vXG4vLyBUT0RPOiBJZiB3ZSBvYnNlcnZlIGxlYWtzIHdpdGggY29tcGxleCB1c2UgY2FzZXMgKGR1ZSB0byBjbG9zdXJlIHNjb3Blcylcbi8vICAgICAgIHdlIGNhbiBnZW5lcmF0ZSBoZXJlIG91ciBjb21wYXQgQ2FsbFNpdGUgb2JqZWN0cyBzdG9yaW5nIHRoZSBmdW5jdGlvbidzXG4vLyAgICAgICBzb3VyY2UgY29kZSBpbnN0ZWFkIG9mIGFuIGFjdHVhbCByZWZlcmVuY2UgdG8gdGhlbSwgdGhhdCBzaG91bGQgaGVscFxuLy8gICAgICAgdGhlIEdDIHNpbmNlIHdlJ2xsIGJlIGp1c3Qga2VlcGluZyBsaXRlcmFscyBhcm91bmQuXG52YXIgbWFrZUZyYW1lc0dldHRlciA9IHR5cGVvZiBOYXRpdmVFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgPyBtYWtlRnJhbWVzR2V0dGVyVjhcbiAgICAgICAgICAgICAgICAgICAgIDogbWFrZUZyYW1lc0dldHRlckNvbXBhdDtcblxuXG4vLyBPdmVycmlkZSBWOCBzdGFjayB0cmFjZSBidWlsZGVyIHRvIGluamVjdCBvdXIgbG9naWNcbnZhciBvbGRQcmVwYXJlU3RhY2tUcmFjZSA9IEVycm9yLnByZXBhcmVTdGFja1RyYWNlO1xuRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoZXJyb3IsIGZyYW1lcykge1xuICAvLyBXaGVuIGNhbGxlZCBmcm9tIG1ha2VGcmFtZXNHZXR0ZXJWOCB3ZSBqdXN0IHdhbnQgdG8gb2J0YWluIHRoZSBmcmFtZXNcbiAgaWYgKGVycm9yID09PSBWOEZSQU1FUykge1xuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICAvLyBGb3J3YXJkIHRvIGFueSBwcmV2aW91c2x5IGRlZmluZWQgYmVoYXZpb3VyXG4gIGlmIChvbGRQcmVwYXJlU3RhY2tUcmFjZSkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gb2xkUHJlcGFyZVN0YWNrVHJhY2UuY2FsbChFcnJvciwgZXJyb3IsIGZyYW1lcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gSnVzdCBpZ25vcmUgdGhlIGVycm9yIChpZToga2FybWEtc291cmNlLW1hcC1zdXBwb3J0KVxuICAgIH1cbiAgfVxuXG4gIC8vIEVtdWxhdGUgZGVmYXVsdCBiZWhhdmlvdXIgKHdpdGggbG9uZy10cmFjZXMpXG4gIHJldHVybiBGYWlsdXJlLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZS5jYWxsKGVycm9yLCB1bndpbmQoZnJhbWVzKSk7XG59O1xuXG4vLyBBdHRhY2ggYSBuZXcgZXhjbHVzaW9uIHByZWRpY2F0ZSBmb3IgZnJhbWVzXG5mdW5jdGlvbiBleGNsdWRlIChjdG9yLCBwcmVkaWNhdGUpIHtcbiAgdmFyIGZuID0gcHJlZGljYXRlO1xuXG4gIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgIGZuID0gZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgICByZXR1cm4gLTEgIT09IGZyYW1lLmdldEZpbGVOYW1lKCkuaW5kZXhPZihwcmVkaWNhdGUpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByZWRpY2F0ZS50ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm4gPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICAgIHJldHVybiBwcmVkaWNhdGUudGVzdChmcmFtZS5nZXRGaWxlTmFtZSgpKTtcbiAgICB9O1xuICB9XG5cbiAgY3Rvci5leGNsdWRlcy5wdXNoKGZuKTtcbn1cblxuLy8gRXhwb3NlIHRoZSBmaWx0ZXIgaW4gdGhlIHJvb3QgRmFpbHVyZSB0eXBlXG5GYWlsdXJlLmV4Y2x1ZGVzID0gW107XG5GYWlsdXJlLmV4Y2x1ZGUgPSBleGNsdWRlLmJpbmQobnVsbCwgRmFpbHVyZSk7XG5cbi8vIEF0dGFjaCBhIGZyYW1lcyBnZXR0ZXIgdG8gdGhlIGZ1bmN0aW9uIHNvIHdlIGNhbiByZS1jb25zdHJ1Y3QgYXN5bmMgc3RhY2tzLlxuLy9cbi8vIE5vdGUgdGhhdCB0aGlzIGp1c3QgYXVnbWVudHMgdGhlIGZ1bmN0aW9uIHdpdGggdGhlIG5ldyBwcm9wZXJ0eSwgaXQgZG9lc24ndFxuLy8gY3JlYXRlIGEgd3JhcHBlciBldmVyeSB0aW1lIGl0J3MgY2FsbGVkLCBzbyB1c2luZyBpdCBtdWx0aXBsZSB0aW1lcyBvbiB0aGVcbi8vIHNhbWUgZnVuY3Rpb24gd2lsbCBpbmRlZWQgb3ZlcndyaXRlIHRoZSBwcmV2aW91cyB0cmFja2luZyBpbmZvcm1hdGlvbi4gVGhpc1xuLy8gaXMgaW50ZW5kZWQgc2luY2UgaXQncyBmYXN0ZXIgYW5kIG1vcmUgaW1wb3J0YW50bHkgZG9lc24ndCBicmVhayBzb21lIEFQSXNcbi8vIHVzaW5nIGNhbGxiYWNrIHJlZmVyZW5jZXMgdG8gdW5yZWdpc3RlciB0aGVtIGZvciBpbnN0YW5jZS5cbi8vIFdoZW4geW91IHdhbnQgdG8gdXNlIHRoZSBzYW1lIGZ1bmN0aW9uIHdpdGggZGlmZmVyZW50IHRyYWNraW5nIGluZm9ybWF0aW9uXG4vLyBqdXN0IHVzZSBGYWlsdXJlLndyYXAoKS5cbi8vXG4vLyBUaGUgdHJhY2tpbmcgY2FuIGJlIGdsb2JhbGx5IGRpc2FibGVkIGJ5IHNldHRpbmcgRmFpbHVyZS5UUkFDS0lORyB0byBmYWxzZVxuRmFpbHVyZS50cmFjayA9IGZ1bmN0aW9uIEZhaWx1cmVfdHJhY2sgKGZuLCBzZmYpIHtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIC8vIENsZWFuIHVwIHByZXZpb3VzIGZyYW1lcyB0byBoZWxwIHRoZSBHQ1xuICBpZiAodHlwZW9mIGZuW1NZTUJPTF9GUkFNRVNdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm5bU1lNQk9MX0ZSQU1FU10odHJ1ZSk7XG4gIH1cblxuICBpZiAoRmFpbHVyZS5UUkFDS0lORykge1xuICAgIGZuW1NZTUJPTF9GUkFNRVNdID0gbnVsbDtcbiAgICBmbltTWU1CT0xfRlJBTUVTXSA9IG1ha2VGcmFtZXNHZXR0ZXIoc2ZmIHx8IEZhaWx1cmVfdHJhY2spO1xuICB9XG5cbiAgcmV0dXJuIGZuO1xufTtcblxuLy8gV3JhcHMgdGhlIGZ1bmN0aW9uIGJlZm9yZSBhbm5vdGF0aW5nIGl0IHdpdGggdHJhY2tpbmcgaW5mb3JtYXRpb24sIHRoaXNcbi8vIGFsbG93cyB0byB0cmFjayBtdWx0aXBsZSBjYWxscyBmb3IgYSBzaW5nbGUgZnVuY3Rpb24uXG5GYWlsdXJlLndyYXAgPSBmdW5jdGlvbiBGYWlsdXJlX3dyYXAgKGZuKSB7XG4gIHZhciB3cmFwcGVyID0gRmFpbHVyZS5pZ25vcmUoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gRmFpbHVyZS50cmFjayh3cmFwcGVyLCBGYWlsdXJlX3dyYXApO1xufTtcblxuLy8gTWFyayBhIGZ1bmN0aW9uIHRvIGJlIGlnbm9yZWQgd2hlbiBnZW5lcmF0aW5nIHN0YWNrIHRyYWNlc1xuRmFpbHVyZS5pZ25vcmUgPSBmdW5jdGlvbiBGYWlsdXJlX2lnbm9yZSAoZm4pIHtcbiAgZm5bU1lNQk9MX0lHTk9SRV0gPSB0cnVlO1xuICByZXR1cm4gZm47XG59O1xuXG4vLyBIZWxwZXIgZm9yIHRyYWNraW5nIGEgc2V0VGltZW91dFxuRmFpbHVyZS5zZXRUaW1lb3V0ID0gZnVuY3Rpb24gRmFpbHVyZV9zZXRUaW1lb3V0ICgpIHtcbiAgYXJndW1lbnRzWzBdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbMF0sIEZhaWx1cmVfc2V0VGltZW91dCk7XG4gIHJldHVybiBzZXRUaW1lb3V0LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG4vLyBIZWxwZXIgZm9yIHRyYWNraW5nIGEgbmV4dFRpY2tcbkZhaWx1cmUubmV4dFRpY2sgPSBmdW5jdGlvbiBGYWlsdXJlX25leHRUaWNrICgpIHtcbiAgYXJndW1lbnRzWzBdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbMF0sIEZhaWx1cmVfbmV4dFRpY2spO1xuICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljay5hcHBseShwcm9jZXNzLCBhcmd1bWVudHMpO1xufTtcblxuLy8gQWxsb3dzIHRvIGVhc2lseSBwYXRjaCBhIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSBjYWxsYmFja1xuLy8gdG8gYWxsb3cgdHJhY2tpbmcgdGhlIGFzeW5jIGZsb3dzLlxuLy8gaWU6IEZhaWx1cmUucGF0aCh3aW5kb3csICdzZXRJbnRlcnZhbCcpXG5GYWlsdXJlLnBhdGNoID0gZnVuY3Rpb24gRmFpbHVyZV9wYXRjaChvYmosIG5hbWUsIGlkeCkge1xuICBpZiAob2JqICYmIHR5cGVvZiBvYmpbbmFtZV0gIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ09iamVjdCBkb2VzIG5vdCBoYXZlIGEgXCInICsgbmFtZSArICdcIiBtZXRob2QnKTtcbiAgfVxuXG4gIHZhciBvcmlnaW5hbCA9IG9ialtuYW1lXTtcblxuICAvLyBXaGVuIHRoZSBleGFjdCBhcmd1bWVudCBpbmRleCBpcyBwcm92aWRlZCB1c2UgYW4gb3B0aW1pemVkIGNvZGUgcGF0aFxuICBpZiAodHlwZW9mIGlkeCA9PT0gJ251bWJlcicpIHtcblxuICAgIG9ialtuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGFyZ3VtZW50c1tpZHhdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbaWR4XSwgb2JqW25hbWVdKTtcbiAgICAgIHJldHVybiBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgLy8gT3RoZXJ3aXNlIGRldGVjdCB0aGUgZnVuY3Rpb25zIHRvIHRyYWNrIGF0IGludm9rYXRpb24gdGltZVxuICB9IGVsc2Uge1xuXG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBhcmd1bWVudHNbaV0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1tpXSwgb2JqW25hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICB9XG5cbiAgLy8gQXVnbWVudCB0aGUgd3JhcHBlciB3aXRoIGFueSBwcm9wZXJ0aWVzIGZyb20gdGhlIG9yaWdpbmFsXG4gIGZvciAodmFyIGsgaW4gb3JpZ2luYWwpIGlmIChvcmlnaW5hbC5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgIG9ialtuYW1lXVtrXSA9IG9yaWdpbmFsW2tdO1xuICB9XG5cbiAgcmV0dXJuIG9ialtuYW1lXTtcbn07XG5cbi8vIEhlbHBlciB0byBjcmVhdGUgbmV3IEZhaWx1cmUgdHlwZXNcbkZhaWx1cmUuY3JlYXRlID0gZnVuY3Rpb24gKG5hbWUsIHByb3BzKSB7XG4gIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgRmFpbHVyZSgnRXhwZWN0ZWQgYSBuYW1lIGFzIGZpcnN0IGFyZ3VtZW50Jyk7XG4gIH1cblxuICBmdW5jdGlvbiBjdG9yIChtZXNzYWdlLCBzZmYpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmFpbHVyZSkpIHtcbiAgICAgIHJldHVybiBuZXcgY3RvcihtZXNzYWdlLCBzZmYpO1xuICAgIH1cbiAgICBGYWlsdXJlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICAvLyBBdWdtZW50IGNvbnN0cnVjdG9yXG4gIGN0b3IuZXhjbHVkZXMgPSBbXTtcbiAgY3Rvci5leGNsdWRlID0gZnVuY3Rpb24gKHByZWRpY2F0ZSkge1xuICAgIGV4Y2x1ZGUoY3RvciwgcHJlZGljYXRlKTtcbiAgfTtcblxuICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRmFpbHVyZS5wcm90b3R5cGUpO1xuICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3I7XG4gIGN0b3IucHJvdG90eXBlLm5hbWUgPSBuYW1lO1xuICBpZiAodHlwZW9mIHByb3BzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY3Rvci5wcm90b3R5cGUucHJlcGFyZVN0YWNrVHJhY2UgPSBwcm9wcztcbiAgfSBlbHNlIGlmIChwcm9wcykge1xuICAgIE9iamVjdC5rZXlzKHByb3BzKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICBjdG9yLnByb3RvdHlwZVtwcm9wXSA9IHByb3A7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGN0b3I7XG59O1xuXG52YXIgYnVpbHRpbkVycm9yVHlwZXMgPSBbXG4gICdFcnJvcicsICdUeXBlRXJyb3InLCAnUmFuZ2VFcnJvcicsICdSZWZlcmVuY2VFcnJvcicsICdTeW50YXhFcnJvcicsXG4gICdFdmFsRXJyb3InLCAnVVJJRXJyb3InLCAnSW50ZXJuYWxFcnJvcidcbl07XG52YXIgYnVpbHRpbkVycm9ycyA9IHt9O1xuXG5GYWlsdXJlLmluc3RhbGwgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByb290ID0gdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgPyB3aW5kb3cgOiBnbG9iYWw7XG5cbiAgYnVpbHRpbkVycm9yVHlwZXMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIGlmIChyb290W3R5cGVdICYmICFidWlsdGluRXJyb3JzW3R5cGVdKSB7XG4gICAgICBidWlsdGluRXJyb3JzW3R5cGVdID0gcm9vdFt0eXBlXTtcbiAgICAgIHJvb3RbdHlwZV0gPSBGYWlsdXJlLmNyZWF0ZSh0eXBlKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEFsbG93IHVzYWdlOiB2YXIgRmFpbHVyZSA9IHJlcXVpcmUoJ2ZhaWx1cmUnKS5pbnN0YWxsKClcbiAgcmV0dXJuIEZhaWx1cmU7XG59O1xuXG5GYWlsdXJlLnVuaW5zdGFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgYnVpbHRpbkVycm9yVHlwZXMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIHJvb3RbdHlwZV0gPSBidWlsdGluRXJyb3JzW3R5cGVdIHx8IHJvb3RbdHlwZV07XG4gIH0pO1xufTtcblxuXG52YXIgcHJvdG8gPSBGYWlsdXJlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gRmFpbHVyZTtcblxucHJvdG8ubmFtZSA9ICdGYWlsdXJlJztcbnByb3RvLm1lc3NhZ2UgPSAnJztcblxuaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgPT09ICdmdW5jdGlvbicpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZnJhbWVzJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gVXNlIHRyaW1taW5nIGp1c3QgaW4gY2FzZSB0aGUgc2ZmIHdhcyBkZWZpbmVkIGFmdGVyIGNvbnN0cnVjdGluZ1xuICAgICAgdmFyIGZyYW1lcyA9IHVud2luZCh0cmltKHRoaXMuX2dldEZyYW1lcygpLCB0aGlzLnNmZikpO1xuXG4gICAgICAvLyBDYWNoZSBuZXh0IGFjY2Vzc2VzIHRvIHRoZSBwcm9wZXJ0eVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdmcmFtZXMnLCB7XG4gICAgICAgIHZhbHVlOiBmcmFtZXMsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgLy8gQ2xlYW4gdXAgdGhlIGdldHRlciBjbG9zdXJlXG4gICAgICB0aGlzLl9nZXRGcmFtZXMgPSBudWxsO1xuXG4gICAgICByZXR1cm4gZnJhbWVzO1xuICAgIH1cbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnc3RhY2snLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc3RhY2sgPSB0aGlzLmdlbmVyYXRlU3RhY2tUcmFjZSgpO1xuXG4gICAgICAvLyBDYWNoZSBuZXh0IGFjY2Vzc2VzIHRvIHRoZSBwcm9wZXJ0eVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzdGFjaycsIHtcbiAgICAgICAgdmFsdWU6IHN0YWNrLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzdGFjaztcbiAgICB9XG4gIH0pO1xufVxuXG5wcm90by5nZW5lcmF0ZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBleGNsdWRlcyA9IHRoaXMuY29uc3RydWN0b3IuZXhjbHVkZXM7XG4gIHZhciBpbmNsdWRlLCBmcmFtZXMgPSBbXTtcblxuICAvLyBTcGVjaWZpYyBwcm90b3R5cGVzIGluaGVyaXQgdGhlIGV4Y2x1ZGVzIGZyb20gRmFpbHVyZVxuICBpZiAoZXhjbHVkZXMgIT09IEZhaWx1cmUuZXhjbHVkZXMpIHtcbiAgICBleGNsdWRlcy5wdXNoLmFwcGx5KGV4Y2x1ZGVzLCBGYWlsdXJlLmV4Y2x1ZGVzKTtcbiAgfVxuXG4gIC8vIEFwcGx5IGZpbHRlcmluZ1xuICBmb3IgKHZhciBpPTA7IGkgPCB0aGlzLmZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGluY2x1ZGUgPSB0cnVlO1xuICAgIGlmICh0aGlzLmZyYW1lc1tpXSkge1xuICAgICAgZm9yICh2YXIgaj0wOyBpbmNsdWRlICYmIGogPCBleGNsdWRlcy5sZW5ndGg7IGorKykge1xuICAgICAgICBpbmNsdWRlICY9ICFleGNsdWRlc1tqXS5jYWxsKHRoaXMsIHRoaXMuZnJhbWVzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgIGZyYW1lcy5wdXNoKHRoaXMuZnJhbWVzW2ldKTtcbiAgICB9XG4gIH1cblxuICAvLyBIb25vciBhbnkgcHJldmlvdXNseSBkZWZpbmVkIHN0YWNrdHJhY2UgZm9ybWF0dGVyIGJ5IGFsbG93aW5nXG4gIC8vIGl0IHRvIGZvcm1hdCB0aGUgZnJhbWVzLiBUaGlzIGlzIG5lZWRlZCB3aGVuIHVzaW5nXG4gIC8vIG5vZGUtc291cmNlLW1hcC1zdXBwb3J0IGZvciBpbnN0YW5jZS5cbiAgLy8gVE9ETzogQ2FuIHdlIG1hcCB0aGUgXCJudWxsXCIgZnJhbWVzIHRvIGEgQ2FsbEZyYW1lIHNoaW0/XG4gIGlmIChvbGRQcmVwYXJlU3RhY2tUcmFjZSkge1xuICAgIGZyYW1lcyA9IGZyYW1lcy5maWx0ZXIoZnVuY3Rpb24gKHgpIHsgcmV0dXJuICEheDsgfSk7XG4gICAgcmV0dXJuIG9sZFByZXBhcmVTdGFja1RyYWNlLmNhbGwoRXJyb3IsIHRoaXMsIGZyYW1lcyk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5wcmVwYXJlU3RhY2tUcmFjZShmcmFtZXMpO1xufTtcblxucHJvdG8ucHJlcGFyZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoZnJhbWVzKSB7XG4gIHZhciBsaW5lcyA9IFt0aGlzXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGZyYW1lc1tpXSA/IEZhaWx1cmUuRlJBTUVfUFJFRklYICsgZnJhbWVzW2ldIDogRmFpbHVyZS5GUkFNRV9FTVBUWVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEZhaWx1cmU7XG4iXX0=
},{"./call-site":17,"_process":16,"error-stack-parser":20}],19:[function(require,module,exports){
var Failure = require('./lib/failure');

module.exports = Failure;

},{"./lib/failure":18}],20:[function(require,module,exports){
(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define('error-stack-parser', ['stackframe'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('stackframe'));
    } else {
        root.ErrorStackParser = factory(root.StackFrame);
    }
}(this, function ErrorStackParser(StackFrame) {
    'use strict';

    var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
    var CHROME_IE_STACK_REGEXP = /\s+at .*(\S+\:\d+|\(native\))/;

    return {
        /**
         * Given an Error object, extract the most information from it.
         * @param error {Error}
         * @return Array[StackFrame]
         */
        parse: function ErrorStackParser$$parse(error) {
            if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
                return this.parseOpera(error);
            } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
                return this.parseV8OrIE(error);
            } else if (error.stack && error.stack.match(FIREFOX_SAFARI_STACK_REGEXP)) {
                return this.parseFFOrSafari(error);
            } else {
                throw new Error('Cannot parse given Error object');
            }
        },

        /**
         * Separate line and column numbers from a URL-like string.
         * @param urlLike String
         * @return Array[String]
         */
        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
            // Fail-fast but return locations like "(native)"
            if (urlLike.indexOf(':') === -1) {
                return [urlLike];
            }

            var locationParts = urlLike.replace(/[\(\)\s]/g, '').split(':');
            var lastNumber = locationParts.pop();
            var possibleNumber = locationParts[locationParts.length - 1];
            if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
                var lineNumber = locationParts.pop();
                return [locationParts.join(':'), lineNumber, lastNumber];
            } else {
                return [locationParts.join(':'), lastNumber, undefined];
            }
        },

        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
            return error.stack.split('\n').filter(function (line) {
                return !!line.match(CHROME_IE_STACK_REGEXP);
            }, this).map(function (line) {
                var tokens = line.replace(/^\s+/, '').split(/\s+/).slice(1);
                var locationParts = this.extractLocation(tokens.pop());
                var functionName = (!tokens[0] || tokens[0] === 'Anonymous') ? undefined : tokens[0];
                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], line);
            }, this);
        },

        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
            return error.stack.split('\n').filter(function (line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP);
            }, this).map(function (line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionName = tokens.shift() || undefined;
                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], line);
            }, this);
        },

        parseOpera: function ErrorStackParser$$parseOpera(e) {
            if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
                e.message.split('\n').length > e.stacktrace.split('\n').length)) {
                return this.parseOpera9(e);
            } else if (!e.stack) {
                return this.parseOpera10(e);
            } else {
                return this.parseOpera11(e);
            }
        },

        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
            var lines = e.message.split('\n');
            var result = [];

            for (var i = 2, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame(undefined, undefined, match[2], match[1], undefined, lines[i]));
                }
            }

            return result;
        },

        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
            var lines = e.stacktrace.split('\n');
            var result = [];

            for (var i = 0, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1], undefined, lines[i]));
                }
            }

            return result;
        },

        // Opera 10.65+ Error.stack very similar to FF/Safari
        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
            return error.stack.split('\n').filter(function (line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) &&
                    !line.match(/^Error created at/);
            }, this).map(function (line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionCall = (tokens.shift() || '');
                var functionName = functionCall
                        .replace(/<anonymous function(: (\w+))?>/, '$2')
                        .replace(/\([^\)]*\)/g, '') || undefined;
                var argsRaw;
                if (functionCall.match(/\(([^\)]*)\)/)) {
                    argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
                }
                var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ? undefined : argsRaw.split(',');
                return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2], line);
            }, this);
        }
    };
}));


},{"stackframe":21}],21:[function(require,module,exports){
(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define('stackframe', [], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.StackFrame = factory();
    }
}(this, function () {
    'use strict';
    function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function StackFrame(functionName, args, fileName, lineNumber, columnNumber, source) {
        if (functionName !== undefined) {
            this.setFunctionName(functionName);
        }
        if (args !== undefined) {
            this.setArgs(args);
        }
        if (fileName !== undefined) {
            this.setFileName(fileName);
        }
        if (lineNumber !== undefined) {
            this.setLineNumber(lineNumber);
        }
        if (columnNumber !== undefined) {
            this.setColumnNumber(columnNumber);
        }
        if (source !== undefined) {
            this.setSource(source);
        }
    }

    StackFrame.prototype = {
        getFunctionName: function () {
            return this.functionName;
        },
        setFunctionName: function (v) {
            this.functionName = String(v);
        },

        getArgs: function () {
            return this.args;
        },
        setArgs: function (v) {
            if (Object.prototype.toString.call(v) !== '[object Array]') {
                throw new TypeError('Args must be an Array');
            }
            this.args = v;
        },

        // NOTE: Property name may be misleading as it includes the path,
        // but it somewhat mirrors V8's JavaScriptStackTraceApi
        // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
        // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
        getFileName: function () {
            return this.fileName;
        },
        setFileName: function (v) {
            this.fileName = String(v);
        },

        getLineNumber: function () {
            return this.lineNumber;
        },
        setLineNumber: function (v) {
            if (!_isNumber(v)) {
                throw new TypeError('Line Number must be a Number');
            }
            this.lineNumber = Number(v);
        },

        getColumnNumber: function () {
            return this.columnNumber;
        },
        setColumnNumber: function (v) {
            if (!_isNumber(v)) {
                throw new TypeError('Column Number must be a Number');
            }
            this.columnNumber = Number(v);
        },

        getSource: function () {
            return this.source;
        },
        setSource: function (v) {
            this.source = String(v);
        },

        toString: function() {
            var functionName = this.getFunctionName() || '{anonymous}';
            var args = '(' + (this.getArgs() || []).join(',') + ')';
            var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
            var lineNumber = _isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
            var columnNumber = _isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
            return functionName + args + fileName + lineNumber + columnNumber;
        }
    };

    return StackFrame;
}));

},{}]},{},[14])(14)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2Vycm9yLmpzIiwibGliL2V4cGVjdGF0aW9uLmpzIiwibGliL21hdGNoZXIuanMiLCJsaWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uLmpzIiwibGliL21hdGNoZXJzL2NvcmUuanMiLCJsaWIvbWF0Y2hlcnMvcHJvbWlzZS5qcyIsImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyIsImxpYi9wYXRjaGVzLmpzIiwibGliL3Jlc29sdmVycy5qcyIsImxpYi9zaG91bGQuanMiLCJsaWIvdXRpbC5qcyIsIm1haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9jYWxsLXNpdGUuanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9saWIvZmFpbHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL21haW4uanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9ub2RlX21vZHVsZXMvZXJyb3Itc3RhY2stcGFyc2VyL2Vycm9yLXN0YWNrLXBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL25vZGVfbW9kdWxlcy9lcnJvci1zdGFjay1wYXJzZXIvbm9kZV9tb2R1bGVzL3N0YWNrZnJhbWUvc3RhY2tmcmFtZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMTVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGRBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snXyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnXyddIDogbnVsbCk7XG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciBNYXRjaGVyID0gcmVxdWlyZSgnLi9tYXRjaGVyJyk7XG52YXIgRXhwZWN0YXRpb24gPSByZXF1aXJlKCcuL2V4cGVjdGF0aW9uJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5cbnZhciBkZWZQcm9wID0gdXRpbC5iaW5kKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgT2JqZWN0KTtcblxuXG4vLyBQdWJsaWMgaW50ZXJmYWNlXG5mdW5jdGlvbiBhc3MgKHZhbHVlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBDaGFpbigpO1xuICB9XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpO1xufVxuXG4vLyBEZWZlcnJlZCBmYWN0b3J5XG5hc3MuXyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gbmV3IENoYWluKHZhbHVlKS5fO1xufTtcblxuLy8gR2xvYmFsIHJlZ2lzdHJ5IG9mIG1hdGNoZXJzICh1c2VkIGZvciBhc3MuaGVscClcbmFzcy5tYXRjaGVycyA9IFtdO1xuXG4vLyBhc3MuaGVscCBkdW1wcyB0aGUgaGVscCBvZiBlYWNoIG1hdGNoZXIgcmVnaXN0ZXJlZFxuZGVmUHJvcChhc3MsICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcyA9ICcnO1xuICAgIF8uZm9yRWFjaChhc3MubWF0Y2hlcnMsIGZ1bmN0aW9uIChtYXRjaGVyKSB7XG4gICAgICAvLyBUT0RPOiBUaGlzIGNhbiBiZSBuaWNlclxuICAgICAgdmFyIGZuID0gbWF0Y2hlci50ZXN0LnRvU3RyaW5nKCk7XG4gICAgICB2YXIgYXJncyA9IGZuLnJlcGxhY2UoL15mdW5jdGlvblxccypcXCgoW15cXCldKilcXClbXFxTXFxzXSovLCAnJDEnKTtcbiAgICAgIGFyZ3MgPSBhcmdzLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnRyaW0oKTsgfSk7XG4gICAgICBhcmdzLnNoaWZ0KCk7XG4gICAgICBmbiA9IGFyZ3MubGVuZ3RoID8gJyAoJyArIGFyZ3Muam9pbignLCAnKSArICcpJyA6ICcnO1xuXG4gICAgICBzICs9ICc+IC4nICsgbWF0Y2hlci5uYW1lICsgZm4gKyAnXFxuXFxuJztcbiAgICAgIHMgKz0gJyAgJyArIG1hdGNoZXIuaGVscC5yZXBsYWNlKC9cXG4vZywgJ1xcbiAgJyk7XG4gICAgICBzICs9ICdcXG5cXG4nO1xuICAgIH0pO1xuICAgIHJldHVybiBzO1xuICB9XG59KTtcblxuYXNzLm9rID0gZnVuY3Rpb24gKGNvbmQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBtZXNzYWdlID0gJ2V4cGVjdGVkIGEgdHJ1aXNoIHZhbHVlJztcbiAgfVxuICBhc3MuZGVzYyhtZXNzYWdlKS50cnV0aHkuYXNzZXJ0KGNvbmQsIGFzcy5vayk7XG4gIHJldHVybiBjb25kO1xufTtcblxuYXNzLmtvID0gZnVuY3Rpb24gKGNvbmQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBtZXNzYWdlID0gJ2V4cGVjdGVkIGEgZmFsc3kgdmFsdWUnO1xuICB9XG4gIGFzcy5kZXNjKG1lc3NhZ2UpLmZhbHN5LmFzc2VydChjb25kLCBhc3Mua28pO1xuICByZXR1cm4gY29uZDtcbn07XG5cbi8vIFJlc2V0cyBvciB2ZXJpZmllcyB0aGUgbnVtYmVyIG9mIG1hcmtzIHNvIGZhclxuLy8gRm9yY2VkIGFyaXR5LTAgdG8gYmUgY29tcGF0aWJsZSB3aXRoOiBiZWZvcmVFYWNoKGFzcy5tYXJrcylcbmFzcy5tYXJrcyA9IGZ1bmN0aW9uICgvKiBleHBlY3RlZCwgZGVzYyAqLykge1xuICB2YXIgZXhwZWN0ZWQgPSBhcmd1bWVudHNbMF07XG4gIHZhciBkZXNjID0gYXJndW1lbnRzWzFdO1xuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAndW5kZWZpbmVkJykge1xuICAgIGV4cGVjdGVkID0gYXNzLm1hcmtzLmNvdW50ZXI7XG4gICAgYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuICAgIHJldHVybiBleHBlY3RlZDsgIC8vIHJldHVybiBiYWNrIGhvdyBtYW55IHRoZXJlIHdlcmVcbiAgfVxuXG4gIGFzcy5kZXNjKGRlc2MgfHwgJ2Fzcy5tYXJrcycpLmVxKGV4cGVjdGVkKVxuICAuYXNzZXJ0KGFzcy5tYXJrcy5jb3VudGVyLCBhc3MubWFya3MpO1xufTtcbmFzcy5tYXJrcy5jb3VudGVyID0gMDtcblxuXG4vLyBIZWxwZXIgdG8gcmVnaXN0ZXIgbmV3IG1hdGNoZXJzIGluIHRoZSByZWdpc3RyeVxuYXNzLnJlZ2lzdGVyID0gZnVuY3Rpb24gKG5hbWUsIG1hdGNoZXIpIHtcbiAgaWYgKG5hbWUgaW5zdGFuY2VvZiBNYXRjaGVyKSB7XG4gICAgbWF0Y2hlciA9IG5hbWU7XG4gICAgbmFtZSA9IG1hdGNoZXIubmFtZTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICBPYmplY3Qua2V5cyhuYW1lKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGFzcy5yZWdpc3RlcihrZXksIG5hbWVba2V5XSk7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgeyAgLy8gQXNzdW1lIGEgZGVzY3JpcHRvciB3YXMgZ2l2ZW5cbiAgICAvLyBDcmVhdGUgdGhlIGFsaWFzZXMgZmlyc3RcbiAgICBfLmZvckVhY2gobWF0Y2hlci5hbGlhc2VzLCBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgIGFzcy5yZWdpc3RlcihuZXcgTWF0Y2hlcihhbGlhcywgbWF0Y2hlcikpO1xuICAgIH0pO1xuXG4gICAgbWF0Y2hlciA9IG5ldyBNYXRjaGVyKG5hbWUsIG1hdGNoZXIpO1xuICB9XG5cbiAgLy8gS2VlcCB0aGUgbWF0Y2hlciBhcm91bmQgZm9yIGFzcy5oZWxwXG4gIGFzcy5tYXRjaGVycy5wdXNoKG1hdGNoZXIpO1xuXG5cbiAgLy8gVE9ETzogQWxsb3cgbWF0Y2hlcnMgdG8gYmUgb3ZlcnJpZGRlbiBhbmQgYWxzbyBvdmVybG9hZGVkXG4gIC8vICAgICAgIGlmIHRoZXkgaGF2ZSBhbiBcIm92ZXJsb2FkXCIgbWV0aG9kIGl0IGNhbiBiZSB1c2VkXG4gIC8vICAgICAgIHRvIGNoZWNrIHdoaWNoIG9uZSBzaG91bGQgYmUgdXNlZC5cbiAgLy8gICAgICAgQmV0dGVyIElkZWEgKEkgdGhpbmspLCBpbnN0ZWFkIG9mIG92ZXJsb2FkaW5nIGJhc2VkXG4gIC8vICAgICAgIG9uIHRoZSB2YWx1ZSB1bmRlciB0ZXN0LCB3aGljaCBtYXkgcHJvZHVjZSBpc3N1ZXNcbiAgLy8gICAgICAgc2luY2Ugd2UgZG9uJ3Qga25vdyBmb3Igc3VyZSB3aGF0IHRoYXQgdmFsdWUgaXMsXG4gIC8vICAgICAgIGFsbG93IG1hdGNoZXJzIHRvIGludHJvZHVjZSBhIG5ldyBcInByb3RvdHlwZVwiIGZvclxuICAvLyAgICAgICB0aGUgY2hhaW4sIHRoYXQgaXMsIGEgLmRvbSBtYXRjaGVyIHdpbGwgaW5jbHVkZVxuICAvLyAgICAgICBhbGwgdGhlIGNvcmUgZXhwZWN0YXRpb25zIGJ1dCB0aGVuIGFsc28gb3ZlcnJpZGVzXG4gIC8vICAgICAgIGFuZCBuZXcgb25lcyB1bnRpbCB0aGUgZW5kIG9mIHRoZSBjaGFpbi5cblxuXG4gIC8vIE1hdGNoZXIgZnVuY3Rpb25zIHdpdGggYSBzaW5nbGUgYXJndW1lbnQgYXJlIGdldHRlcnNcbiAgdmFyIGZuS2V5ID0gbWF0Y2hlci5hcml0eSA9PT0gMSA/ICdnZXQnIDogJ3ZhbHVlJztcbiAgdmFyIHByb3AgPSB7XG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH07XG4gIGlmIChmbktleSA9PT0gJ3ZhbHVlJykge1xuICAgIHByb3Aud3JpdGFibGUgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIEF1Z21lbnQgdGhlIENoYWluIHByb3RvdHlwZVxuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uIGZuICgpIHtcbiAgICB2YXIgZXhwID0gbmV3IEV4cGVjdGF0aW9uKG1hdGNoZXIsIGFyZ3VtZW50cyk7XG4gICAgdGhpcy5fX2V4cGVjdGF0aW9uc19fLnB1c2goZXhwKTtcbiAgICBpZiAoIXRoaXMuX19kZWZlcnJlZF9fKSB7XG4gICAgICB0aGlzLmFzc2VydCh0aGlzLnZhbHVlLCBmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIGRlZlByb3AoQ2hhaW4ucHJvdG90eXBlLCBuYW1lLCBwcm9wKTtcblxuICAvLyBBdWdtZW50IHRoZSBzdGF0aWMgaW50ZXJmYWNlXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGFpbiA9IG5ldyBDaGFpbigpO1xuXG4gICAgaWYgKGZuS2V5ID09PSAnZ2V0Jykge1xuICAgICAgcmV0dXJuIGNoYWluW25hbWVdO1xuICAgIH1cblxuICAgIHJldHVybiBjaGFpbltuYW1lXS5hcHBseShjaGFpbiwgYXJndW1lbnRzKTtcbiAgfTtcblxuICBkZWZQcm9wKGFzcywgbmFtZSwgcHJvcCk7XG5cbiAgLy8gUGFzcyB0aHJvdWdoIGZvciBjaGFpbnNcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiBwYXNzdGhyb3VnaCgpIHtcbiAgICByZXR1cm4gdGhpc1tuYW1lXS5hc3NlcnQodGhpcy52YWx1ZSwgcGFzc3Rocm91Z2gpLnZhbHVlT2YoKTtcbiAgfTtcbiAgcHJvcC5lbnVtZXJhYmxlID0gZmFsc2U7XG4gIGRlZlByb3AoQ2hhaW4ucHJvdG90eXBlLCAnJCcgKyBuYW1lLCBwcm9wKTtcblxuICAvLyBQYXNzIHRocm91Z2ggc3RhdGljIGNvbnN0cnVjdG9yXG4gIGRlZlByb3AoYXNzLCAnJCcgKyBuYW1lLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKGZuS2V5ID09PSAnZ2V0Jykge1xuICAgICAgICByZXR1cm4gYXNzKHZhbHVlKVsnJCcgKyBuYW1lXTtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIGEgbmV3IGV4cHJlc3Npb24gZm9yIHRoZSBleHBlY3RhdGlvblxuICAgICAgdmFyIGNoYWluID0gbmV3IENoYWluKCk7XG4gICAgICBjaGFpbltuYW1lXS5hcHBseShjaGFpbiwgYXJndW1lbnRzKTtcbiAgICAgIC8vIFJldHVybiBhIGNhbGxhYmxlIHRoYXQgYXNzZXJ0cyB1cG9uIHJlY2VpdmluZyBhIHZhbHVlXG4gICAgICByZXR1cm4gY2hhaW4udGhyb3VnaDtcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IGZhbHNlXG4gIH0pO1xuXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gYXNzO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTloYzNNdWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqdEJRVUZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUoyWVhJZ1h5QTlJQ2gwZVhCbGIyWWdkMmx1Wkc5M0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdkMmx1Wkc5M1d5ZGZKMTBnT2lCMGVYQmxiMllnWjJ4dlltRnNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnWjJ4dlltRnNXeWRmSjEwZ09pQnVkV3hzS1R0Y2JseHVkbUZ5SUVOb1lXbHVJRDBnY21WeGRXbHlaU2duTGk5amFHRnBiaWNwTzF4dWRtRnlJRTFoZEdOb1pYSWdQU0J5WlhGMWFYSmxLQ2N1TDIxaGRHTm9aWEluS1R0Y2JuWmhjaUJGZUhCbFkzUmhkR2x2YmlBOUlISmxjWFZwY21Vb0p5NHZaWGh3WldOMFlYUnBiMjRuS1R0Y2JuWmhjaUIxZEdsc0lEMGdjbVZ4ZFdseVpTZ25MaTkxZEdsc0p5azdYRzVjYmx4dWRtRnlJR1JsWmxCeWIzQWdQU0IxZEdsc0xtSnBibVFvVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUxDQlBZbXBsWTNRcE8xeHVYRzVjYmk4dklGQjFZbXhwWXlCcGJuUmxjbVpoWTJWY2JtWjFibU4wYVc5dUlHRnpjeUFvZG1Gc2RXVXBJSHRjYmlBZ2FXWWdLR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dQVDA5SURBcElIdGNiaUFnSUNCeVpYUjFjbTRnYm1WM0lFTm9ZV2x1S0NrN1hHNGdJSDFjYmlBZ2NtVjBkWEp1SUc1bGR5QkRhR0ZwYmloMllXeDFaU2s3WEc1OVhHNWNiaTh2SUVSbFptVnljbVZrSUdaaFkzUnZjbmxjYm1GemN5NWZJRDBnWm5WdVkzUnBiMjRnS0haaGJIVmxLU0I3WEc0Z0lISmxkSFZ5YmlCdVpYY2dRMmhoYVc0b2RtRnNkV1VwTGw4N1hHNTlPMXh1WEc0dkx5QkhiRzlpWVd3Z2NtVm5hWE4wY25rZ2IyWWdiV0YwWTJobGNuTWdLSFZ6WldRZ1ptOXlJR0Z6Y3k1b1pXeHdLVnh1WVhOekxtMWhkR05vWlhKeklEMGdXMTA3WEc1Y2JpOHZJR0Z6Y3k1b1pXeHdJR1IxYlhCeklIUm9aU0JvWld4d0lHOW1JR1ZoWTJnZ2JXRjBZMmhsY2lCeVpXZHBjM1JsY21Wa1hHNWtaV1pRY205d0tHRnpjeXdnSjJobGJIQW5MQ0I3WEc0Z0lHZGxkRG9nWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUhaaGNpQnpJRDBnSnljN1hHNGdJQ0FnWHk1bWIzSkZZV05vS0dGemN5NXRZWFJqYUdWeWN5d2dablZ1WTNScGIyNGdLRzFoZEdOb1pYSXBJSHRjYmlBZ0lDQWdJQzh2SUZSUFJFODZJRlJvYVhNZ1kyRnVJR0psSUc1cFkyVnlYRzRnSUNBZ0lDQjJZWElnWm00Z1BTQnRZWFJqYUdWeUxuUmxjM1F1ZEc5VGRISnBibWNvS1R0Y2JpQWdJQ0FnSUhaaGNpQmhjbWR6SUQwZ1ptNHVjbVZ3YkdGalpTZ3ZYbVoxYm1OMGFXOXVYRnh6S2x4Y0tDaGJYbHhjS1YwcUtWeGNLVnRjWEZOY1hITmRLaThzSUNja01TY3BPMXh1SUNBZ0lDQWdZWEpuY3lBOUlHRnlaM011YzNCc2FYUW9KeXduS1M1dFlYQW9ablZ1WTNScGIyNGdLSGdwSUhzZ2NtVjBkWEp1SUhndWRISnBiU2dwT3lCOUtUdGNiaUFnSUNBZ0lHRnlaM011YzJocFpuUW9LVHRjYmlBZ0lDQWdJR1p1SUQwZ1lYSm5jeTVzWlc1bmRHZ2dQeUFuSUNnbklDc2dZWEpuY3k1cWIybHVLQ2NzSUNjcElDc2dKeWtuSURvZ0p5YzdYRzVjYmlBZ0lDQWdJSE1nS3owZ0p6NGdMaWNnS3lCdFlYUmphR1Z5TG01aGJXVWdLeUJtYmlBcklDZGNYRzVjWEc0bk8xeHVJQ0FnSUNBZ2N5QXJQU0FuSUNBbklDc2diV0YwWTJobGNpNW9aV3h3TG5KbGNHeGhZMlVvTDF4Y2JpOW5MQ0FuWEZ4dUlDQW5LVHRjYmlBZ0lDQWdJSE1nS3owZ0oxeGNibHhjYmljN1hHNGdJQ0FnZlNrN1hHNGdJQ0FnY21WMGRYSnVJSE03WEc0Z0lIMWNibjBwTzF4dVhHNWhjM011YjJzZ1BTQm1kVzVqZEdsdmJpQW9ZMjl1WkN3Z2JXVnpjMkZuWlNrZ2UxeHVJQ0JwWmlBb1lYSm5kVzFsYm5SekxteGxibWQwYUNBOVBUMGdNU2tnZTF4dUlDQWdJRzFsYzNOaFoyVWdQU0FuWlhod1pXTjBaV1FnWVNCMGNuVnBjMmdnZG1Gc2RXVW5PMXh1SUNCOVhHNGdJR0Z6Y3k1a1pYTmpLRzFsYzNOaFoyVXBMblJ5ZFhSb2VTNWhjM05sY25Rb1kyOXVaQ3dnWVhOekxtOXJLVHRjYmlBZ2NtVjBkWEp1SUdOdmJtUTdYRzU5TzF4dVhHNWhjM011YTI4Z1BTQm1kVzVqZEdsdmJpQW9ZMjl1WkN3Z2JXVnpjMkZuWlNrZ2UxeHVJQ0JwWmlBb1lYSm5kVzFsYm5SekxteGxibWQwYUNBOVBUMGdNU2tnZTF4dUlDQWdJRzFsYzNOaFoyVWdQU0FuWlhod1pXTjBaV1FnWVNCbVlXeHplU0IyWVd4MVpTYzdYRzRnSUgxY2JpQWdZWE56TG1SbGMyTW9iV1Z6YzJGblpTa3VabUZzYzNrdVlYTnpaWEowS0dOdmJtUXNJR0Z6Y3k1cmJ5azdYRzRnSUhKbGRIVnliaUJqYjI1a08xeHVmVHRjYmx4dUx5OGdVbVZ6WlhSeklHOXlJSFpsY21sbWFXVnpJSFJvWlNCdWRXMWlaWElnYjJZZ2JXRnlhM01nYzI4Z1ptRnlYRzR2THlCR2IzSmpaV1FnWVhKcGRIa3RNQ0IwYnlCaVpTQmpiMjF3WVhScFlteGxJSGRwZEdnNklHSmxabTl5WlVWaFkyZ29ZWE56TG0xaGNtdHpLVnh1WVhOekxtMWhjbXR6SUQwZ1puVnVZM1JwYjI0Z0tDOHFJR1Y0Y0dWamRHVmtMQ0JrWlhOaklDb3ZLU0I3WEc0Z0lIWmhjaUJsZUhCbFkzUmxaQ0E5SUdGeVozVnRaVzUwYzFzd1hUdGNiaUFnZG1GeUlHUmxjMk1nUFNCaGNtZDFiV1Z1ZEhOYk1WMDdYRzRnSUdsbUlDaDBlWEJsYjJZZ1pYaHdaV04wWldRZ1BUMDlJQ2QxYm1SbFptbHVaV1FuS1NCN1hHNGdJQ0FnWlhod1pXTjBaV1FnUFNCaGMzTXViV0Z5YTNNdVkyOTFiblJsY2p0Y2JpQWdJQ0JoYzNNdWJXRnlhM011WTI5MWJuUmxjaUE5SURBN1hHNGdJQ0FnY21WMGRYSnVJR1Y0Y0dWamRHVmtPeUFnTHk4Z2NtVjBkWEp1SUdKaFkyc2dhRzkzSUcxaGJua2dkR2hsY21VZ2QyVnlaVnh1SUNCOVhHNWNiaUFnWVhOekxtUmxjMk1vWkdWell5QjhmQ0FuWVhOekxtMWhjbXR6SnlrdVpYRW9aWGh3WldOMFpXUXBYRzRnSUM1aGMzTmxjblFvWVhOekxtMWhjbXR6TG1OdmRXNTBaWElzSUdGemN5NXRZWEpyY3lrN1hHNTlPMXh1WVhOekxtMWhjbXR6TG1OdmRXNTBaWElnUFNBd08xeHVYRzVjYmk4dklFaGxiSEJsY2lCMGJ5QnlaV2RwYzNSbGNpQnVaWGNnYldGMFkyaGxjbk1nYVc0Z2RHaGxJSEpsWjJsemRISjVYRzVoYzNNdWNtVm5hWE4wWlhJZ1BTQm1kVzVqZEdsdmJpQW9ibUZ0WlN3Z2JXRjBZMmhsY2lrZ2UxeHVJQ0JwWmlBb2JtRnRaU0JwYm5OMFlXNWpaVzltSUUxaGRHTm9aWElwSUh0Y2JpQWdJQ0J0WVhSamFHVnlJRDBnYm1GdFpUdGNiaUFnSUNCdVlXMWxJRDBnYldGMFkyaGxjaTV1WVcxbE8xeHVJQ0I5SUdWc2MyVWdhV1lnS0hSNWNHVnZaaUJ1WVcxbElEMDlQU0FuYjJKcVpXTjBKeWtnZTF4dUlDQWdJRTlpYW1WamRDNXJaWGx6S0c1aGJXVXBMbVp2Y2tWaFkyZ29ablZ1WTNScGIyNGdLR3RsZVNrZ2UxeHVJQ0FnSUNBZ1lYTnpMbkpsWjJsemRHVnlLR3RsZVN3Z2JtRnRaVnRyWlhsZEtUdGNiaUFnSUNCOUtUdGNiaUFnSUNCeVpYUjFjbTQ3WEc0Z0lIMGdaV3h6WlNCN0lDQXZMeUJCYzNOMWJXVWdZU0JrWlhOamNtbHdkRzl5SUhkaGN5Qm5hWFpsYmx4dUlDQWdJQzh2SUVOeVpXRjBaU0IwYUdVZ1lXeHBZWE5sY3lCbWFYSnpkRnh1SUNBZ0lGOHVabTl5UldGamFDaHRZWFJqYUdWeUxtRnNhV0Z6WlhNc0lHWjFibU4wYVc5dUlDaGhiR2xoY3lrZ2UxeHVJQ0FnSUNBZ1lYTnpMbkpsWjJsemRHVnlLRzVsZHlCTllYUmphR1Z5S0dGc2FXRnpMQ0J0WVhSamFHVnlLU2s3WEc0Z0lDQWdmU2s3WEc1Y2JpQWdJQ0J0WVhSamFHVnlJRDBnYm1WM0lFMWhkR05vWlhJb2JtRnRaU3dnYldGMFkyaGxjaWs3WEc0Z0lIMWNibHh1SUNBdkx5QkxaV1Z3SUhSb1pTQnRZWFJqYUdWeUlHRnliM1Z1WkNCbWIzSWdZWE56TG1obGJIQmNiaUFnWVhOekxtMWhkR05vWlhKekxuQjFjMmdvYldGMFkyaGxjaWs3WEc1Y2JseHVJQ0F2THlCVVQwUlBPaUJCYkd4dmR5QnRZWFJqYUdWeWN5QjBieUJpWlNCdmRtVnljbWxrWkdWdUlHRnVaQ0JoYkhOdklHOTJaWEpzYjJGa1pXUmNiaUFnTHk4Z0lDQWdJQ0FnYVdZZ2RHaGxlU0JvWVhabElHRnVJRndpYjNabGNteHZZV1JjSWlCdFpYUm9iMlFnYVhRZ1kyRnVJR0psSUhWelpXUmNiaUFnTHk4Z0lDQWdJQ0FnZEc4Z1kyaGxZMnNnZDJocFkyZ2diMjVsSUhOb2IzVnNaQ0JpWlNCMWMyVmtMbHh1SUNBdkx5QWdJQ0FnSUNCQ1pYUjBaWElnU1dSbFlTQW9TU0IwYUdsdWF5a3NJR2x1YzNSbFlXUWdiMllnYjNabGNteHZZV1JwYm1jZ1ltRnpaV1JjYmlBZ0x5OGdJQ0FnSUNBZ2IyNGdkR2hsSUhaaGJIVmxJSFZ1WkdWeUlIUmxjM1FzSUhkb2FXTm9JRzFoZVNCd2NtOWtkV05sSUdsemMzVmxjMXh1SUNBdkx5QWdJQ0FnSUNCemFXNWpaU0IzWlNCa2IyNG5kQ0JyYm05M0lHWnZjaUJ6ZFhKbElIZG9ZWFFnZEdoaGRDQjJZV3gxWlNCcGN5eGNiaUFnTHk4Z0lDQWdJQ0FnWVd4c2IzY2diV0YwWTJobGNuTWdkRzhnYVc1MGNtOWtkV05sSUdFZ2JtVjNJRndpY0hKdmRHOTBlWEJsWENJZ1ptOXlYRzRnSUM4dklDQWdJQ0FnSUhSb1pTQmphR0ZwYml3Z2RHaGhkQ0JwY3l3Z1lTQXVaRzl0SUcxaGRHTm9aWElnZDJsc2JDQnBibU5zZFdSbFhHNGdJQzh2SUNBZ0lDQWdJR0ZzYkNCMGFHVWdZMjl5WlNCbGVIQmxZM1JoZEdsdmJuTWdZblYwSUhSb1pXNGdZV3h6YnlCdmRtVnljbWxrWlhOY2JpQWdMeThnSUNBZ0lDQWdZVzVrSUc1bGR5QnZibVZ6SUhWdWRHbHNJSFJvWlNCbGJtUWdiMllnZEdobElHTm9ZV2x1TGx4dVhHNWNiaUFnTHk4Z1RXRjBZMmhsY2lCbWRXNWpkR2x2Ym5NZ2QybDBhQ0JoSUhOcGJtZHNaU0JoY21kMWJXVnVkQ0JoY21VZ1oyVjBkR1Z5YzF4dUlDQjJZWElnWm01TFpYa2dQU0J0WVhSamFHVnlMbUZ5YVhSNUlEMDlQU0F4SUQ4Z0oyZGxkQ2NnT2lBbmRtRnNkV1VuTzF4dUlDQjJZWElnY0hKdmNDQTlJSHRjYmlBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lHVnVkVzFsY21GaWJHVTZJSFJ5ZFdWY2JpQWdmVHRjYmlBZ2FXWWdLR1p1UzJWNUlEMDlQU0FuZG1Gc2RXVW5LU0I3WEc0Z0lDQWdjSEp2Y0M1M2NtbDBZV0pzWlNBOUlHWmhiSE5sTzF4dUlDQjlYRzVjYmlBZ0x5OGdRWFZuYldWdWRDQjBhR1VnUTJoaGFXNGdjSEp2ZEc5MGVYQmxYRzRnSUhCeWIzQmJabTVMWlhsZElEMGdablZ1WTNScGIyNGdabTRnS0NrZ2UxeHVJQ0FnSUhaaGNpQmxlSEFnUFNCdVpYY2dSWGh3WldOMFlYUnBiMjRvYldGMFkyaGxjaXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0IwYUdsekxsOWZaWGh3WldOMFlYUnBiMjV6WDE4dWNIVnphQ2hsZUhBcE8xeHVJQ0FnSUdsbUlDZ2hkR2hwY3k1ZlgyUmxabVZ5Y21Wa1gxOHBJSHRjYmlBZ0lDQWdJSFJvYVhNdVlYTnpaWEowS0hSb2FYTXVkbUZzZFdVc0lHWnVLVHRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTTdYRzRnSUgwN1hHNWNiaUFnWkdWbVVISnZjQ2hEYUdGcGJpNXdjbTkwYjNSNWNHVXNJRzVoYldVc0lIQnliM0FwTzF4dVhHNGdJQzh2SUVGMVoyMWxiblFnZEdobElITjBZWFJwWXlCcGJuUmxjbVpoWTJWY2JpQWdjSEp2Y0Z0bWJrdGxlVjBnUFNCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ2RtRnlJR05vWVdsdUlEMGdibVYzSUVOb1lXbHVLQ2s3WEc1Y2JpQWdJQ0JwWmlBb1ptNUxaWGtnUFQwOUlDZG5aWFFuS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWTJoaGFXNWJibUZ0WlYwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJR05vWVdsdVcyNWhiV1ZkTG1Gd2NHeDVLR05vWVdsdUxDQmhjbWQxYldWdWRITXBPMXh1SUNCOU8xeHVYRzRnSUdSbFpsQnliM0FvWVhOekxDQnVZVzFsTENCd2NtOXdLVHRjYmx4dUlDQXZMeUJRWVhOeklIUm9jbTkxWjJnZ1ptOXlJR05vWVdsdWMxeHVJQ0J3Y205d1cyWnVTMlY1WFNBOUlHWjFibU4wYVc5dUlIQmhjM04wYUhKdmRXZG9LQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQjBhR2x6VzI1aGJXVmRMbUZ6YzJWeWRDaDBhR2x6TG5aaGJIVmxMQ0J3WVhOemRHaHliM1ZuYUNrdWRtRnNkV1ZQWmlncE8xeHVJQ0I5TzF4dUlDQndjbTl3TG1WdWRXMWxjbUZpYkdVZ1BTQm1ZV3h6WlR0Y2JpQWdaR1ZtVUhKdmNDaERhR0ZwYmk1d2NtOTBiM1I1Y0dVc0lDY2tKeUFySUc1aGJXVXNJSEJ5YjNBcE8xeHVYRzRnSUM4dklGQmhjM01nZEdoeWIzVm5hQ0J6ZEdGMGFXTWdZMjl1YzNSeWRXTjBiM0pjYmlBZ1pHVm1VSEp2Y0NoaGMzTXNJQ2NrSnlBcklHNWhiV1VzSUh0Y2JpQWdJQ0IyWVd4MVpUb2dablZ1WTNScGIyNGdLSFpoYkhWbEtTQjdYRzRnSUNBZ0lDQnBaaUFvWm01TFpYa2dQVDA5SUNkblpYUW5LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJoYzNNb2RtRnNkV1VwV3lja0p5QXJJRzVoYldWZE8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQXZMeUJEY21WaGRHVWdZU0J1WlhjZ1pYaHdjbVZ6YzJsdmJpQm1iM0lnZEdobElHVjRjR1ZqZEdGMGFXOXVYRzRnSUNBZ0lDQjJZWElnWTJoaGFXNGdQU0J1WlhjZ1EyaGhhVzRvS1R0Y2JpQWdJQ0FnSUdOb1lXbHVXMjVoYldWZExtRndjR3g1S0dOb1lXbHVMQ0JoY21kMWJXVnVkSE1wTzF4dUlDQWdJQ0FnTHk4Z1VtVjBkWEp1SUdFZ1kyRnNiR0ZpYkdVZ2RHaGhkQ0JoYzNObGNuUnpJSFZ3YjI0Z2NtVmpaV2wyYVc1bklHRWdkbUZzZFdWY2JpQWdJQ0FnSUhKbGRIVnliaUJqYUdGcGJpNTBhSEp2ZFdkb08xeHVJQ0FnSUgwc1hHNGdJQ0FnWlc1MWJXVnlZV0pzWlRvZ1ptRnNjMlZjYmlBZ2ZTazdYRzVjYm4wN1hHNWNibHh1Ylc5a2RXeGxMbVY0Y0c5eWRITWdQU0JoYzNNN1hHNGlYWDA9IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snXyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnXyddIDogbnVsbCk7XG5cbnZhciByZXNvbHZlcnMgPSByZXF1aXJlKCcuL3Jlc29sdmVycycpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBQcm9taXNlID0gdXRpbC5Qcm9taXNlO1xuXG52YXIgZGVmUHJvcCA9IHV0aWwuYmluZChPYmplY3QuZGVmaW5lUHJvcGVydHksIE9iamVjdCk7XG5cbi8vIEFuIGV4cGVjdGF0aW9ucyBjaGFpbiAoYWthIGV4cHJlc3Npb24pLCB0aGUgY29yZSBvYmplY3Qgb2YgdGhlIGxpYnJhcnksXG4vLyBhbGxvd3MgdG8gc2V0dXAgYSBzZXQgb2YgZXhwZWN0YXRpb25zIHRvIGJlIHJ1biBhdCBhbnkgcG9pbnQgYWdhaW5zdCBhXG4vLyB2YWx1ZS5cbmZ1bmN0aW9uIENoYWluICh2YWx1ZSkge1xuICBpZiAoIUNoYWluLmlzQ2hhaW4odGhpcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FzcyBDaGFpbiBjb25zdHJ1Y3RvciBjYWxsZWQgd2l0aG91dCBuZXchJyk7XG4gIH1cblxuICAvLyBUT0RPOiBPbiBub24gaW5pdGlhbGl6ZWQgY2hhaW5zIHdlIGNhbid0IGRvIC52YWx1ZSwgaXQgc2hvdWxkXG4gIC8vICAgICAgIGJlIGEgZXhwZWN0YXRpb24gdGhhdCBnZXRzIHRoZSBpbml0aWFsIHZhbHVlIGdpdmVuIHdoZW5cbiAgLy8gICAgICAgcmVzb2x2aW5nIChzbywgaXQgc2hvdWxkIGJlIHN0b3JlZCBvbiB0aGUgcmVzb2x2ZXIpXG4gIHRoaXMudmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IHZhbHVlIDogdGhpcy5fX0dVQVJEX187XG5cbiAgLy8gQ3VzdG9tIGRlc2NyaXB0aW9uXG4gIGRlZlByb3AodGhpcywgJ19fZGVzY3JpcHRpb25fXycsIHtcbiAgICB2YWx1ZTogJycsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBMaXN0IG9mIFsgRXhwZWN0YXRpb24gXVxuICBkZWZQcm9wKHRoaXMsICdfX2V4cGVjdGF0aW9uc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBXaGVuIHRydWUgdGhlIGV4cHJlc3Npb24gaXMgY29uc2lkZXJlZCBkZWZlcnJlZCBhbmQgd29uJ3RcbiAgLy8gdHJ5IHRvIGltbWVkaWF0ZWx5IGV2YWx1YXRlIGFueSBuZXdseSBjaGFpbmVkIGV4cGVjdGF0aW9uLlxuICBkZWZQcm9wKHRoaXMsICdfX2RlZmVycmVkX18nLCB7XG4gICAgdmFsdWU6IHRoaXMudmFsdWUgPT09IHRoaXMuX19HVUFSRF9fLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gSG9sZHMgdGhlIGxpc3Qgb2YgcHJvbWlzZSBjYWxsYmFja3MgYXR0YWNoZWQgdG8gdGhlIGV4cHJlc3Npb25cbiAgZGVmUHJvcCh0aGlzLCAnX190aGVuc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBTZWFsIHRoZSBjb250ZXh0IHRvIHRoZSBtZXRob2RzIHNvIHdlIGNhbiBjYWxsIHRoZW0gYXMgcGxhaW4gZnVuY3Rpb25zXG4gIHRoaXMudGVzdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUudGVzdCwgdGhpcyk7XG4gIHRoaXMuYXNzZXJ0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS5hc3NlcnQsIHRoaXMpO1xuICB0aGlzLnJlc3VsdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUucmVzdWx0LCB0aGlzKTtcbiAgdGhpcy50aHJvdWdoID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS50aHJvdWdoLCB0aGlzKTtcbiAgdGhpcy4kID0gdGhpcy50aHJvdWdoO1xufVxuXG5DaGFpbi5pc0NoYWluID0gZnVuY3Rpb24gKG9iaikge1xuICAvLyBUaGlzIGxvb2tzIGNvbnRyaXZlZCBidXQgaW5zdGFuY2VvZiBpcyBraW5kIG9mIHNsb3ctaXNoXG4gIHJldHVybiBvYmogJiYgb2JqLmNvbnN0cnVjdG9yID09PSBDaGFpbjtcbn07XG5cblxudmFyIHByb3RvID0gQ2hhaW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gQ2hhaW47XG5cbi8vIEd1YXJkIHRva2VuIHRvIGRldGVjdCB2YWx1ZWxlc3MgbWF0Y2hlcnNcbnByb3RvLl9fR1VBUkRfXyA9IHtcbiAgdmFsdWVPZjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd7e3ZhbHVlbGVzc319JztcbiAgfVxufTtcblxuLy8gU3VwcG9ydHMgdGhlIHVzYWdlOiBhc3Muc3RyaW5nLmhlbHBcbmRlZlByb3AocHJvdG8sICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPOiBQcm9kdWN0aXplIHRoaXMgYW5kIHBlcmhhcHMgc2hvdyBoZWxwIGZvciB0aGUgd2hvbGUgY2hhaW5cbiAgICB2YXIgdGFpbCA9IF8udGFpbCh0aGlzLl9fZXhwZWN0YXRpb25zX18pO1xuICAgIHJldHVybiB0YWlsID8gdGFpbC5oZWxwIDogJ04vQSc7XG4gIH1cbn0pO1xuXG4vLyBTdXBwb3J0IHVzZSBjYXNlOiBhc3ModmFsdWUpLl8uc29tZS5udW1iZXIuYWJvdmUoNSkuX1xuZGVmUHJvcChwcm90bywgJ18nLCB7XG4gIGdldDogZnVuY3Rpb24gZm4oKSB7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5fX2RlZmVycmVkX18gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IGZhbHNlO1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufSk7XG5cblxuLy8gRXhwb3NlcyBhIFByb21pc2UvQSBpbnRlcmZhY2UgZm9yIHRoZSBleHByZXNzaW9uLCB0aGUgaW50ZW5kZWQgdXNlIGlzIGZvclxuLy8gb2J0YWluaW5nIHRoZSByZXN1bHQgZm9yIGFzeW5jaHJvbm91cyBleHByZXNzaW9ucy5cbi8vIEhlcmUgdGhvdWdoIHdlIGp1c3QgY29sbGVjdCB0aGUgY2FsbGJhY2tzLCB0aGUgYWN0dWFsIHByb21pc2UgcmVzb2x1dGlvblxuLy8gaXMgZG9uZSBpbiB0aGUgcmVzb2x2ZXIgd2hlbiBpdCByZWFjaGVzIGEgcmVzdWx0LlxucHJvdG8udGhlbiA9IGZ1bmN0aW9uIChjYiwgZWIpIHtcbiAgLy8gUmVnaXN0ZXIgdGhlIGNhbGxiYWNrcyB0byBiZSB1c2VkIHdoZW4gcmVzb2x2ZWRcbiAgdGhpcy5fX3RoZW5zX18ucHVzaChbY2IsIGViXSk7XG5cbiAgLy8gV2hlbiB0aGUgZXhwcmVzc2lvbiBpcyBub24gZGVmZXJyZWQgYW5kIHdlIGhhdmUgYSB2YWx1ZSB3ZSBmb3JjZSB0aGVcbiAgLy8gcmVzb2x2ZXIgdG8gcnVuIGluIG9yZGVyIHRvIHJlc29sdmUgdGhlIHByb21pc2UgYXQgbGVhc3Qgb25jZS5cbiAgLy8gVGhpcyBpcyBwcmltYXJpbHkgdG8gc3VwcG9ydCB0aGUgdGVzdCBydW5uZXJzIHVzZSBjYXNlIHdoZXJlIGFuIGV4cHJlc3Npb25cbiAgLy8gaXMgcmV0dXJuZWQgZnJvbSB0aGUgdGVzdCBhbmQgdGhlIHJ1bm5lciB3aWxsIGF0dGFjaCBpdHNlbGYgaGVyZS5cbiAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXyAmJiB0aGlzLnZhbHVlICE9PSB0aGlzLl9fR1VBUkRfXykge1xuICAgIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICAgIHJlc29sdmVyKHRoaXMudmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5jYXRjaCA9IGZ1bmN0aW9uIChlYikge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIGViKTtcbn07XG5cbi8vIERpc3BhdGNoIGV2ZXJ5b25lIHdobyB3YXMgd2FpdGluZyB0byBiZSBub3RpZmllZCBvZiB0aGUgb3V0Y29tZVxucHJvdG8uZGlzcGF0Y2hSZXN1bHQgPSBmdW5jdGlvbiAocmVzb2x2ZWQsIHJlc3VsdCkge1xuICBpZiAoMCA9PT0gdGhpcy5fX3RoZW5zX18ubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR2VuZXJhdGUgYSBuaWNlIGVycm9yIGZvciB0aGUgZmFpbHVyZVxuICB2YXIgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICBhY3R1YWwgPSB0aGlzLmJ1aWxkRXJyb3IocmVzb2x2ZWQsIHByb3RvLmRpc3BhdGNoUmVzdWx0KTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb21pc2UgdGhhdCByZWplY3RzIGltbWVkaWF0ZWx5IHdpdGggYSBmYWlsdXJlIGVycm9yIG9yXG4gIC8vIHJlc29sdmVzIHdpdGggdGhlIGV4cHJlc3Npb24gc3ViamVjdC5cbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gQ2FsbGluZyByZXNvbHZlKCkgd2l0aCBhIHByb21pc2Ugd2lsbCBhdHRhY2ggaXRzZWxmIHRvIHRoZSBwcm9taXNlXG4gICAgLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGl0IGFzIGEgc2ltcGxlIHZhbHVlLiBUbyBhdm9pZCB0aGF0IHdlIGRldGVjdCB0aGVcbiAgICAvLyBjYXNlIGFuZCB3cmFwIGl0IGluIGFuIGFycmF5LlxuICAgIGlmIChhY3R1YWwgJiYgdHlwZW9mIGFjdHVhbC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhY3R1YWwgPSBbXG4gICAgICAgICdBc3M6IFZhbHVlIHdyYXBwZWQgaW4gYW4gYXJyYXkgc2luY2UgaXQgbG9va3MgbGlrZSBhIFByb21pc2UnLFxuICAgICAgICBhY3R1YWxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgKHJlc3VsdCA/IHJlc29sdmUgOiByZWplY3QpKCBhY3R1YWwgKTtcbiAgfSk7XG5cbiAgLy8gQXR0YWNoIGFsbCB0aGUgcmVnaXN0ZXJlZCB0aGVucyB0byB0aGUgcHJvbWlzZSBzbyB0aGV5IGdldCBub3RpZmllZFxuICBfLmZvckVhY2godGhpcy5fX3RoZW5zX18sIGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuLmFwcGx5KHByb21pc2UsIGNhbGxiYWNrcyk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZHVtcENoYWluIChyZXNvbHZlZCwgaW5kZW50KSB7XG4gIHZhciByZXN1bHQgPSAnJztcblxuICBpbmRlbnQgPSBpbmRlbnQgfHwgJyc7XG5cbiAgcmVzb2x2ZWQuZm9yRWFjaChmdW5jdGlvbiAoZXhwLCBpZHgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShleHApKSB7XG4gICAgICByZXN1bHQgKz0gZHVtcENoYWluKGV4cCwgaW5kZW50ICsgJyAgJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV4cC5yZXN1bHQpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzJtUGFzc2VkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzFtRmFpbGVkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgIGlmIChpZHggPT09IHJlc29sdmVkLmxlbmd0aCAtIDEpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMG0gJyArIGV4cC5mYWlsdXJlICsgJ1xcbic7XG4gICAgfVxuXG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuLy8gQnVpbGRzIGFuIEFzc0Vycm9yIGZvciB0aGUgY3VycmVudCBleHByZXNzaW9uLiBJdCBtYWtlcyBhIGNvdXBsZSBvZlxuLy8gYXNzdW1wdGlvbnMsIGZvciBpbnN0YW5jZSB0aGUgLl9fb2Zmc2V0X18gbXVzdCBiZSBwbGFjZWQganVzdCBhZnRlciB0aGVcbi8vIGV4cGVjdGF0aW9uIHRoYXQgcHJvZHVjZWQgdGhlIGZhaWx1cmUgb2YgdGhlIGNoYWluLlxucHJvdG8uYnVpbGRFcnJvciA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgc3NmKSB7XG5cbiAgdmFyIGVycm9yID0gdGhpcy5fX2Rlc2NyaXB0aW9uX18gKyAnXFxuXFxuJztcblxuICBleHAgPSByZXNvbHZlZFsgcmVzb2x2ZWQubGVuZ3RoIC0gMSBdO1xuICBlcnJvciArPSBkdW1wQ2hhaW4ocmVzb2x2ZWQpO1xuXG4gIGlmICghdXRpbC5kb0NvbG9ycygpKSB7XG4gICAgZXJyb3IgPSB1dGlsLnVuYW5zaShlcnJvcik7XG4gIH1cblxuICAvLyBUT0RPOiBzaG93RGlmZiBzaG91bGQgYmUgdXNlZCBvbmx5IHdoZW4gaXQgbWFrZXMgc2Vuc2UgcGVyaGFwc1xuICAvLyAgICAgICB3ZSBjYW4gcGFzcyBudWxsL3VuZGVmaW5lZCBhbmQgbGV0IEFzc0Vycm9yIGRldGVjdCB3aGVuIGl0XG4gIC8vICAgICAgIG1ha2VzIHNlbnNlLlxuXG4gIHZhciBleHBlY3RlZCA9IGV4cC5leHBlY3RlZDtcbiAgLy8gTW9jaGEgd2lsbCB0cnkgdG8ganNvbmlmeSB0aGUgZXhwZWN0ZWQgdmFsdWUsIGp1c3QgaWdub3JlIGlmIGl0J3MgYSBmdW5jdGlvblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdmFyIGluc3QgPSBuZXcgQXNzRXJyb3IoZXJyb3IsIHNzZiB8fCBhcmd1bWVudHMuY2FsbGVlIHx8IHByb3RvLmJ1aWxkRXJyb3IpO1xuICBpbnN0LnNob3dEaWZmID0gZmFsc2U7XG4gIGluc3QuYWN0dWFsID0gbnVsbDtcbiAgaW5zdC5leHBlY3RlZCA9IG51bGw7XG4gIHJldHVybiBpbnN0O1xufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIFRoZSByZXN1bHQgaXMgYWx3YXlzIGFcbi8vIGJvb2xlYW4gaW5kaWNhdGluZyB0aGUgb3V0Y29tZSBvciBhbiB1bmRlZmluZWQgdG8gc2lnbmFsIHRoYXQgaXQgcmVhY2hlZFxuLy8gYW4gYXN5bmNocm9ub3VzIGZsb3cuXG5wcm90by50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBSZXNvbHZlIHRoZSBjaGFpbiBzdGFydGluZyBmcm9tIHJvb3RcbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyBQZXJmb3JtcyB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhaW4gYnV0IGFkZGl0aW9uYWxseSB3aWxsIHJhaXNlIGFuIGVycm9yXG4vLyBpZiBpdCBmYWlscyB0byBjb21wbGV0ZS4gV2hlbiB0aGUgZXhwcmVzc2lvbiByZXNvbHZlcyBhcyB1bmRlZmluZWQgKGFzeW5jKVxuLy8gaXQnbGwgYmUgYXV0b21hdGljYWxseSBlbmFibGUgaXRzIGRlZmVycmVkIGZsYWcuXG4vLyBUaGUgYHNzZmAgc3RhbmRzIGZvciBTdGFja1RyYWNlRnVuY3Rpb24sIGEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBmdW5jdGlvblxuLy8gdG8gc2hvdyBvbiB0aGUgc3RhY2sgdHJhY2UuXG5wcm90by5hc3NlcnQgPSBmdW5jdGlvbiAoYWN0dWFsLCBzc2YpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgLy8gSnVzdCBpZ25vcmUgaWYgdGhlIGFjdHVhbCB2YWx1ZSBpcyBub3QgcHJlc2VudCB5ZXRcbiAgLy8gVE9ETzogU2hhbGwgaXQgcHJvZHVjZSBhbiBlcnJvcj9cbiAgaWYgKGFjdHVhbCA9PT0gdGhpcy5fX0dVQVJEX18pIHJldHVybiB0aGlzO1xuXG4gIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICB2YXIgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcblxuICAvLyBJdCBmYWlsZWQgc28gcmVwb3J0IGl0IHdpdGggYSBuaWNlIGVycm9yXG4gIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgdGhpcy5idWlsZEVycm9yKHJlc29sdmVyLnJlc29sdmVkLCBzc2YgfHwgdGhpcy5hc3NlcnQpO1xuICB9XG5cbiAgLy8gQ29udmVydCB0aGUgZXhwcmVzc2lvbiBpbnRvIGEgZGVmZXJyZWQgaWYgYW4gYXN5bmMgZXhwZWN0aW9uIHdhcyBmb3VuZFxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIEFzc2VydHMgdGhlIHByb3ZpZGVkIHZhbHVlIGFuZCBpZiBzdWNjZXNzZnVsIHJldHVybnMgdGhlIG9yaWdpbmFsXG4vLyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBjaGFpbiBpbnN0YW5jZS5cbnByb3RvLnRocm91Z2ggPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHRoaXMuYXNzZXJ0KGFjdHVhbCwgcHJvdG8udGhyb3VnaCk7XG4gIHJldHVybiBhY3R1YWw7XG59O1xuXG4vLyBFdmFsdWF0ZXMgdGhlIGV4cHJlc3Npb24gY2hhaW4gcmVwb3J0aW5nIHRoZSBsYXN0IG11dGF0ZWQgdmFsdWUgc2VlbiBpblxuLy8gaXQuIElmIHRoZSBleHByZXNzaW9uIGRvZXMgbm90IGNvbXBsZXRlIGl0J2xsIHJldHVybiB1bmRlZmluZWQuXG5wcm90by5yZXN1bHQgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHZhciByZXN1bHQ7XG5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB0aGlzLnRhcChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgIH0pLnRlc3QoYWN0dWFsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBSZW1vdmUgdGhlIC50YXAgZnJvbSB0aGUgY2hhaW5cbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fX2Rlc2NyaXB0aW9uX18pIHtcbiAgICByZXR1cm4gdGhpcy5fX2Rlc2NyaXB0aW9uX187XG4gIH1cblxuICB2YXIgZGVzY3MgPVxuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfX1xuICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZGVzY3JpcHRpb247IH0pXG4gICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5kZXNjcmlwdGlvbjsgfSk7XG5cbiAgaWYgKGRlc2NzLmxlbmd0aCA+IDEpIHtcbiAgICByZXR1cm4gJygnICsgZGVzY3Muam9pbignLCAnKSArICcpJztcbiAgfSBlbHNlIGlmIChkZXNjcy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gZGVzY3NbMF07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICc8QXNzQ2hhaW4+JztcbiAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENoYWluO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTlqYUdGcGJpNXFjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPMEZCUVVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTSXNJbVpwYkdVaU9pSm5aVzVsY21GMFpXUXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpZG1GeUlGOGdQU0FvZEhsd1pXOW1JSGRwYm1SdmR5QWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JSGRwYm1SdmQxc25YeWRkSURvZ2RIbHdaVzltSUdkc2IySmhiQ0FoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaUEvSUdkc2IySmhiRnNuWHlkZElEb2diblZzYkNrN1hHNWNiblpoY2lCeVpYTnZiSFpsY25NZ1BTQnlaWEYxYVhKbEtDY3VMM0psYzI5c2RtVnljeWNwTzF4dWRtRnlJRUZ6YzBWeWNtOXlJRDBnY21WeGRXbHlaU2duTGk5bGNuSnZjaWNwTzF4dWRtRnlJSFYwYVd3Z1BTQnlaWEYxYVhKbEtDY3VMM1YwYVd3bktUdGNiblpoY2lCUWNtOXRhWE5sSUQwZ2RYUnBiQzVRY205dGFYTmxPMXh1WEc1MllYSWdaR1ZtVUhKdmNDQTlJSFYwYVd3dVltbHVaQ2hQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrc0lFOWlhbVZqZENrN1hHNWNiaTh2SUVGdUlHVjRjR1ZqZEdGMGFXOXVjeUJqYUdGcGJpQW9ZV3RoSUdWNGNISmxjM05wYjI0cExDQjBhR1VnWTI5eVpTQnZZbXBsWTNRZ2IyWWdkR2hsSUd4cFluSmhjbmtzWEc0dkx5QmhiR3h2ZDNNZ2RHOGdjMlYwZFhBZ1lTQnpaWFFnYjJZZ1pYaHdaV04wWVhScGIyNXpJSFJ2SUdKbElISjFiaUJoZENCaGJua2djRzlwYm5RZ1lXZGhhVzV6ZENCaFhHNHZMeUIyWVd4MVpTNWNibVoxYm1OMGFXOXVJRU5vWVdsdUlDaDJZV3gxWlNrZ2UxeHVJQ0JwWmlBb0lVTm9ZV2x1TG1selEyaGhhVzRvZEdocGN5a3BJSHRjYmlBZ0lDQjBhSEp2ZHlCdVpYY2dSWEp5YjNJb0owRnpjeUJEYUdGcGJpQmpiMjV6ZEhKMVkzUnZjaUJqWVd4c1pXUWdkMmwwYUc5MWRDQnVaWGNoSnlrN1hHNGdJSDFjYmx4dUlDQXZMeUJVVDBSUE9pQlBiaUJ1YjI0Z2FXNXBkR2xoYkdsNlpXUWdZMmhoYVc1eklIZGxJR05oYmlkMElHUnZJQzUyWVd4MVpTd2dhWFFnYzJodmRXeGtYRzRnSUM4dklDQWdJQ0FnSUdKbElHRWdaWGh3WldOMFlYUnBiMjRnZEdoaGRDQm5aWFJ6SUhSb1pTQnBibWwwYVdGc0lIWmhiSFZsSUdkcGRtVnVJSGRvWlc1Y2JpQWdMeThnSUNBZ0lDQWdjbVZ6YjJ4MmFXNW5JQ2h6Ynl3Z2FYUWdjMmh2ZFd4a0lHSmxJSE4wYjNKbFpDQnZiaUIwYUdVZ2NtVnpiMngyWlhJcFhHNGdJSFJvYVhNdWRtRnNkV1VnUFNCaGNtZDFiV1Z1ZEhNdWJHVnVaM1JvSUQ0Z01DQS9JSFpoYkhWbElEb2dkR2hwY3k1ZlgwZFZRVkpFWDE4N1hHNWNiaUFnTHk4Z1EzVnpkRzl0SUdSbGMyTnlhWEIwYVc5dVhHNGdJR1JsWmxCeWIzQW9kR2hwY3l3Z0oxOWZaR1Z6WTNKcGNIUnBiMjVmWHljc0lIdGNiaUFnSUNCMllXeDFaVG9nSnljc1hHNGdJQ0FnWlc1MWJXVnlZV0pzWlRvZ1ptRnNjMlVzWEc0Z0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQjNjbWwwWVdKc1pUb2dkSEoxWlZ4dUlDQjlLVHRjYmx4dUlDQXZMeUJNYVhOMElHOW1JRnNnUlhod1pXTjBZWFJwYjI0Z1hWeHVJQ0JrWldaUWNtOXdLSFJvYVhNc0lDZGZYMlY0Y0dWamRHRjBhVzl1YzE5Zkp5d2dlMXh1SUNBZ0lIWmhiSFZsT2lCYlhTeGNiaUFnSUNCbGJuVnRaWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklHWmhiSE5sTEZ4dUlDQWdJSGR5YVhSaFlteGxPaUJtWVd4elpWeHVJQ0I5S1R0Y2JseHVJQ0F2THlCWGFHVnVJSFJ5ZFdVZ2RHaGxJR1Y0Y0hKbGMzTnBiMjRnYVhNZ1kyOXVjMmxrWlhKbFpDQmtaV1psY25KbFpDQmhibVFnZDI5dUozUmNiaUFnTHk4Z2RISjVJSFJ2SUdsdGJXVmthV0YwWld4NUlHVjJZV3gxWVhSbElHRnVlU0J1Wlhkc2VTQmphR0ZwYm1Wa0lHVjRjR1ZqZEdGMGFXOXVMbHh1SUNCa1pXWlFjbTl3S0hSb2FYTXNJQ2RmWDJSbFptVnljbVZrWDE4bkxDQjdYRzRnSUNBZ2RtRnNkV1U2SUhSb2FYTXVkbUZzZFdVZ1BUMDlJSFJvYVhNdVgxOUhWVUZTUkY5ZkxGeHVJQ0FnSUdWdWRXMWxjbUZpYkdVNklHWmhiSE5sTEZ4dUlDQWdJR052Ym1acFozVnlZV0pzWlRvZ1ptRnNjMlVzWEc0Z0lDQWdkM0pwZEdGaWJHVTZJSFJ5ZFdWY2JpQWdmU2s3WEc1Y2JpQWdMeThnU0c5c1pITWdkR2hsSUd4cGMzUWdiMllnY0hKdmJXbHpaU0JqWVd4c1ltRmphM01nWVhSMFlXTm9aV1FnZEc4Z2RHaGxJR1Y0Y0hKbGMzTnBiMjVjYmlBZ1pHVm1VSEp2Y0NoMGFHbHpMQ0FuWDE5MGFHVnVjMTlmSnl3Z2UxeHVJQ0FnSUhaaGJIVmxPaUJiWFN4Y2JpQWdJQ0JsYm5WdFpYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lIZHlhWFJoWW14bE9pQm1ZV3h6WlZ4dUlDQjlLVHRjYmx4dUlDQXZMeUJUWldGc0lIUm9aU0JqYjI1MFpYaDBJSFJ2SUhSb1pTQnRaWFJvYjJSeklITnZJSGRsSUdOaGJpQmpZV3hzSUhSb1pXMGdZWE1nY0d4aGFXNGdablZ1WTNScGIyNXpYRzRnSUhSb2FYTXVkR1Z6ZENBOUlIVjBhV3d1WW1sdVpDaERhR0ZwYmk1d2NtOTBiM1I1Y0dVdWRHVnpkQ3dnZEdocGN5azdYRzRnSUhSb2FYTXVZWE56WlhKMElEMGdkWFJwYkM1aWFXNWtLRU5vWVdsdUxuQnliM1J2ZEhsd1pTNWhjM05sY25Rc0lIUm9hWE1wTzF4dUlDQjBhR2x6TG5KbGMzVnNkQ0E5SUhWMGFXd3VZbWx1WkNoRGFHRnBiaTV3Y205MGIzUjVjR1V1Y21WemRXeDBMQ0IwYUdsektUdGNiaUFnZEdocGN5NTBhSEp2ZFdkb0lEMGdkWFJwYkM1aWFXNWtLRU5vWVdsdUxuQnliM1J2ZEhsd1pTNTBhSEp2ZFdkb0xDQjBhR2x6S1R0Y2JpQWdkR2hwY3k0a0lEMGdkR2hwY3k1MGFISnZkV2RvTzF4dWZWeHVYRzVEYUdGcGJpNXBjME5vWVdsdUlEMGdablZ1WTNScGIyNGdLRzlpYWlrZ2UxeHVJQ0F2THlCVWFHbHpJR3h2YjJ0eklHTnZiblJ5YVhabFpDQmlkWFFnYVc1emRHRnVZMlZ2WmlCcGN5QnJhVzVrSUc5bUlITnNiM2N0YVhOb1hHNGdJSEpsZEhWeWJpQnZZbW9nSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5SUQwOVBTQkRhR0ZwYmp0Y2JuMDdYRzVjYmx4dWRtRnlJSEJ5YjNSdklEMGdRMmhoYVc0dWNISnZkRzkwZVhCbElEMGdUMkpxWldOMExtTnlaV0YwWlNodWRXeHNLVHRjYm5CeWIzUnZMbU52Ym5OMGNuVmpkRzl5SUQwZ1EyaGhhVzQ3WEc1Y2JpOHZJRWQxWVhKa0lIUnZhMlZ1SUhSdklHUmxkR1ZqZENCMllXeDFaV3hsYzNNZ2JXRjBZMmhsY25OY2JuQnliM1J2TGw5ZlIxVkJVa1JmWHlBOUlIdGNiaUFnZG1Gc2RXVlBaam9nWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUhKbGRIVnliaUIwYUdsekxuUnZVM1J5YVc1bktDazdYRzRnSUgwc1hHNGdJSFJ2VTNSeWFXNW5PaUJtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnY21WMGRYSnVJQ2Q3ZTNaaGJIVmxiR1Z6YzMxOUp6dGNiaUFnZlZ4dWZUdGNibHh1THk4Z1UzVndjRzl5ZEhNZ2RHaGxJSFZ6WVdkbE9pQmhjM011YzNSeWFXNW5MbWhsYkhCY2JtUmxabEJ5YjNBb2NISnZkRzhzSUNkb1pXeHdKeXdnZTF4dUlDQm5aWFE2SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNBdkx5QlVUMFJQT2lCUWNtOWtkV04wYVhwbElIUm9hWE1nWVc1a0lIQmxjbWhoY0hNZ2MyaHZkeUJvWld4d0lHWnZjaUIwYUdVZ2QyaHZiR1VnWTJoaGFXNWNiaUFnSUNCMllYSWdkR0ZwYkNBOUlGOHVkR0ZwYkNoMGFHbHpMbDlmWlhod1pXTjBZWFJwYjI1elgxOHBPMXh1SUNBZ0lISmxkSFZ5YmlCMFlXbHNJRDhnZEdGcGJDNW9aV3h3SURvZ0owNHZRU2M3WEc0Z0lIMWNibjBwTzF4dVhHNHZMeUJUZFhCd2IzSjBJSFZ6WlNCallYTmxPaUJoYzNNb2RtRnNkV1VwTGw4dWMyOXRaUzV1ZFcxaVpYSXVZV0p2ZG1Vb05Ta3VYMXh1WkdWbVVISnZjQ2h3Y205MGJ5d2dKMThuTENCN1hHNGdJR2RsZERvZ1puVnVZM1JwYjI0Z1ptNG9LU0I3WEc0Z0lDQWdhV1lnS0NGMGFHbHpMbDlmWkdWbVpYSnlaV1JmWHlrZ2UxeHVJQ0FnSUNBZ2RHaHBjeTVmWDJSbFptVnljbVZrWDE4Z1BTQjBjblZsTzF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQjBhR2x6TGw5ZlpHVm1aWEp5WldSZlh5QTlJR1poYkhObE8xeHVJQ0FnSUNBZ2RHaHBjeTVoYzNObGNuUW9kR2hwY3k1MllXeDFaU3dnWm00cE8xeHVJQ0FnSUgxY2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3p0Y2JpQWdmVnh1ZlNrN1hHNWNibHh1THk4Z1JYaHdiM05sY3lCaElGQnliMjFwYzJVdlFTQnBiblJsY21aaFkyVWdabTl5SUhSb1pTQmxlSEJ5WlhOemFXOXVMQ0IwYUdVZ2FXNTBaVzVrWldRZ2RYTmxJR2x6SUdadmNseHVMeThnYjJKMFlXbHVhVzVuSUhSb1pTQnlaWE4xYkhRZ1ptOXlJR0Z6ZVc1amFISnZibTkxY3lCbGVIQnlaWE56YVc5dWN5NWNiaTh2SUVobGNtVWdkR2h2ZFdkb0lIZGxJR3AxYzNRZ1kyOXNiR1ZqZENCMGFHVWdZMkZzYkdKaFkydHpMQ0IwYUdVZ1lXTjBkV0ZzSUhCeWIyMXBjMlVnY21WemIyeDFkR2x2Ymx4dUx5OGdhWE1nWkc5dVpTQnBiaUIwYUdVZ2NtVnpiMngyWlhJZ2QyaGxiaUJwZENCeVpXRmphR1Z6SUdFZ2NtVnpkV3gwTGx4dWNISnZkRzh1ZEdobGJpQTlJR1oxYm1OMGFXOXVJQ2hqWWl3Z1pXSXBJSHRjYmlBZ0x5OGdVbVZuYVhOMFpYSWdkR2hsSUdOaGJHeGlZV05yY3lCMGJ5QmlaU0IxYzJWa0lIZG9aVzRnY21WemIyeDJaV1JjYmlBZ2RHaHBjeTVmWDNSb1pXNXpYMTh1Y0hWemFDaGJZMklzSUdWaVhTazdYRzVjYmlBZ0x5OGdWMmhsYmlCMGFHVWdaWGh3Y21WemMybHZiaUJwY3lCdWIyNGdaR1ZtWlhKeVpXUWdZVzVrSUhkbElHaGhkbVVnWVNCMllXeDFaU0IzWlNCbWIzSmpaU0IwYUdWY2JpQWdMeThnY21WemIyeDJaWElnZEc4Z2NuVnVJR2x1SUc5eVpHVnlJSFJ2SUhKbGMyOXNkbVVnZEdobElIQnliMjFwYzJVZ1lYUWdiR1ZoYzNRZ2IyNWpaUzVjYmlBZ0x5OGdWR2hwY3lCcGN5QndjbWx0WVhKcGJIa2dkRzhnYzNWd2NHOXlkQ0IwYUdVZ2RHVnpkQ0J5ZFc1dVpYSnpJSFZ6WlNCallYTmxJSGRvWlhKbElHRnVJR1Y0Y0hKbGMzTnBiMjVjYmlBZ0x5OGdhWE1nY21WMGRYSnVaV1FnWm5KdmJTQjBhR1VnZEdWemRDQmhibVFnZEdobElISjFibTVsY2lCM2FXeHNJR0YwZEdGamFDQnBkSE5sYkdZZ2FHVnlaUzVjYmlBZ2FXWWdLQ0YwYUdsekxsOWZaR1ZtWlhKeVpXUmZYeUFtSmlCMGFHbHpMblpoYkhWbElDRTlQU0IwYUdsekxsOWZSMVZCVWtSZlh5a2dlMXh1SUNBZ0lIWmhjaUJ5WlhOdmJIWmxjaUE5SUhKbGMyOXNkbVZ5Y3k1aFkzRjFhWEpsS0hSb2FYTXBPMXh1SUNBZ0lISmxjMjlzZG1WeUtIUm9hWE11ZG1Gc2RXVXBPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJSFJvYVhNN1hHNTlPMXh1WEc1d2NtOTBieTVqWVhSamFDQTlJR1oxYm1OMGFXOXVJQ2hsWWlrZ2UxeHVJQ0J5WlhSMWNtNGdkR2hwY3k1MGFHVnVLRzUxYkd3c0lHVmlLVHRjYm4wN1hHNWNiaTh2SUVScGMzQmhkR05vSUdWMlpYSjViMjVsSUhkb2J5QjNZWE1nZDJGcGRHbHVaeUIwYnlCaVpTQnViM1JwWm1sbFpDQnZaaUIwYUdVZ2IzVjBZMjl0WlZ4dWNISnZkRzh1WkdsemNHRjBZMmhTWlhOMWJIUWdQU0JtZFc1amRHbHZiaUFvY21WemIyeDJaV1FzSUhKbGMzVnNkQ2tnZTF4dUlDQnBaaUFvTUNBOVBUMGdkR2hwY3k1ZlgzUm9aVzV6WDE4dWJHVnVaM1JvS1NCN1hHNGdJQ0FnY21WMGRYSnVPMXh1SUNCOVhHNWNiaUFnTHk4Z1IyVnVaWEpoZEdVZ1lTQnVhV05sSUdWeWNtOXlJR1p2Y2lCMGFHVWdabUZwYkhWeVpWeHVJQ0IyWVhJZ1lXTjBkV0ZzSUQwZ2RHaHBjeTUyWVd4MVpUdGNiaUFnYVdZZ0tISmxjM1ZzZENBOVBUMGdabUZzYzJVcElIdGNiaUFnSUNCaFkzUjFZV3dnUFNCMGFHbHpMbUoxYVd4a1JYSnliM0lvY21WemIyeDJaV1FzSUhCeWIzUnZMbVJwYzNCaGRHTm9VbVZ6ZFd4MEtUdGNiaUFnZlZ4dVhHNGdJQzh2SUVOeVpXRjBaU0JoSUhCeWIyMXBjMlVnZEdoaGRDQnlaV3BsWTNSeklHbHRiV1ZrYVdGMFpXeDVJSGRwZEdnZ1lTQm1ZV2xzZFhKbElHVnljbTl5SUc5eVhHNGdJQzh2SUhKbGMyOXNkbVZ6SUhkcGRHZ2dkR2hsSUdWNGNISmxjM05wYjI0Z2MzVmlhbVZqZEM1Y2JpQWdkbUZ5SUhCeWIyMXBjMlVnUFNCdVpYY2dVSEp2YldselpTaG1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpTd2djbVZxWldOMEtTQjdYRzRnSUNBZ0x5OGdRMkZzYkdsdVp5QnlaWE52YkhabEtDa2dkMmwwYUNCaElIQnliMjFwYzJVZ2QybHNiQ0JoZEhSaFkyZ2dhWFJ6Wld4bUlIUnZJSFJvWlNCd2NtOXRhWE5sWEc0Z0lDQWdMeThnYVc1emRHVmhaQ0J2WmlCd1lYTnphVzVuSUdsMElHRnpJR0VnYzJsdGNHeGxJSFpoYkhWbExpQlVieUJoZG05cFpDQjBhR0YwSUhkbElHUmxkR1ZqZENCMGFHVmNiaUFnSUNBdkx5QmpZWE5sSUdGdVpDQjNjbUZ3SUdsMElHbHVJR0Z1SUdGeWNtRjVMbHh1SUNBZ0lHbG1JQ2hoWTNSMVlXd2dKaVlnZEhsd1pXOW1JR0ZqZEhWaGJDNTBhR1Z1SUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdJQ0JoWTNSMVlXd2dQU0JiWEc0Z0lDQWdJQ0FnSUNkQmMzTTZJRlpoYkhWbElIZHlZWEJ3WldRZ2FXNGdZVzRnWVhKeVlYa2djMmx1WTJVZ2FYUWdiRzl2YTNNZ2JHbHJaU0JoSUZCeWIyMXBjMlVuTEZ4dUlDQWdJQ0FnSUNCaFkzUjFZV3hjYmlBZ0lDQWdJRjA3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdLSEpsYzNWc2RDQS9JSEpsYzI5c2RtVWdPaUJ5WldwbFkzUXBLQ0JoWTNSMVlXd2dLVHRjYmlBZ2ZTazdYRzVjYmlBZ0x5OGdRWFIwWVdOb0lHRnNiQ0IwYUdVZ2NtVm5hWE4wWlhKbFpDQjBhR1Z1Y3lCMGJ5QjBhR1VnY0hKdmJXbHpaU0J6YnlCMGFHVjVJR2RsZENCdWIzUnBabWxsWkZ4dUlDQmZMbVp2Y2tWaFkyZ29kR2hwY3k1ZlgzUm9aVzV6WDE4c0lHWjFibU4wYVc5dUlDaGpZV3hzWW1GamEzTXBJSHRjYmlBZ0lDQndjbTl0YVhObElEMGdjSEp2YldselpTNTBhR1Z1TG1Gd2NHeDVLSEJ5YjIxcGMyVXNJR05oYkd4aVlXTnJjeWs3WEc0Z0lIMHBPMXh1ZlR0Y2JseHVablZ1WTNScGIyNGdaSFZ0Y0VOb1lXbHVJQ2h5WlhOdmJIWmxaQ3dnYVc1a1pXNTBLU0I3WEc0Z0lIWmhjaUJ5WlhOMWJIUWdQU0FuSnp0Y2JseHVJQ0JwYm1SbGJuUWdQU0JwYm1SbGJuUWdmSHdnSnljN1hHNWNiaUFnY21WemIyeDJaV1F1Wm05eVJXRmphQ2htZFc1amRHbHZiaUFvWlhod0xDQnBaSGdwSUh0Y2JpQWdJQ0JwWmlBb1FYSnlZWGt1YVhOQmNuSmhlU2hsZUhBcEtTQjdYRzRnSUNBZ0lDQnlaWE4xYkhRZ0t6MGdaSFZ0Y0VOb1lXbHVLR1Y0Y0N3Z2FXNWtaVzUwSUNzZ0p5QWdKeWs3WEc0Z0lDQWdJQ0J5WlhSMWNtNDdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2FXWWdLR1Y0Y0M1eVpYTjFiSFFwSUh0Y2JpQWdJQ0FnSUhKbGMzVnNkQ0FyUFNCcGJtUmxiblFnS3lBbklGeGNkVEF3TVdKYk16SnRVR0Z6YzJWa09seGNkVEF3TVdKYk1HMGdKeUFySUdWNGNDNWtaWE5qY21sd2RHbHZiaUFySUNkY1hHNG5PMXh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhKbGMzVnNkQ0FyUFNCcGJtUmxiblFnS3lBbklGeGNkVEF3TVdKYk16RnRSbUZwYkdWa09seGNkVEF3TVdKYk1HMGdKeUFySUdWNGNDNWtaWE5qY21sd2RHbHZiaUFySUNkY1hHNG5PMXh1SUNBZ0lHbG1JQ2hwWkhnZ1BUMDlJSEpsYzI5c2RtVmtMbXhsYm1kMGFDQXRJREVwSUh0Y2JpQWdJQ0FnSUhKbGMzVnNkQ0FyUFNCcGJtUmxiblFnS3lBbklDQWdJRnhjZFRBd01XSmJNek50UW5WME9seGNkVEF3TVdKYk1HMGdKeUFySUdWNGNDNW1ZV2xzZFhKbElDc2dKMXhjYmljN1hHNGdJQ0FnZlZ4dVhHNGdJSDBwTzF4dVhHNGdJSEpsZEhWeWJpQnlaWE4xYkhRN1hHNTlYRzVjYmx4dUx5OGdRblZwYkdSeklHRnVJRUZ6YzBWeWNtOXlJR1p2Y2lCMGFHVWdZM1Z5Y21WdWRDQmxlSEJ5WlhOemFXOXVMaUJKZENCdFlXdGxjeUJoSUdOdmRYQnNaU0J2Wmx4dUx5OGdZWE56ZFcxd2RHbHZibk1zSUdadmNpQnBibk4wWVc1alpTQjBhR1VnTGw5ZmIyWm1jMlYwWDE4Z2JYVnpkQ0JpWlNCd2JHRmpaV1FnYW5WemRDQmhablJsY2lCMGFHVmNiaTh2SUdWNGNHVmpkR0YwYVc5dUlIUm9ZWFFnY0hKdlpIVmpaV1FnZEdobElHWmhhV3gxY21VZ2IyWWdkR2hsSUdOb1lXbHVMbHh1Y0hKdmRHOHVZblZwYkdSRmNuSnZjaUE5SUdaMWJtTjBhVzl1SUNoeVpYTnZiSFpsWkN3Z2MzTm1LU0I3WEc1Y2JpQWdkbUZ5SUdWeWNtOXlJRDBnZEdocGN5NWZYMlJsYzJOeWFYQjBhVzl1WDE4Z0t5QW5YRnh1WEZ4dUp6dGNibHh1SUNCbGVIQWdQU0J5WlhOdmJIWmxaRnNnY21WemIyeDJaV1F1YkdWdVozUm9JQzBnTVNCZE8xeHVJQ0JsY25KdmNpQXJQU0JrZFcxd1EyaGhhVzRvY21WemIyeDJaV1FwTzF4dVhHNGdJR2xtSUNnaGRYUnBiQzVrYjBOdmJHOXljeWdwS1NCN1hHNGdJQ0FnWlhKeWIzSWdQU0IxZEdsc0xuVnVZVzV6YVNobGNuSnZjaWs3WEc0Z0lIMWNibHh1SUNBdkx5QlVUMFJQT2lCemFHOTNSR2xtWmlCemFHOTFiR1FnWW1VZ2RYTmxaQ0J2Ym14NUlIZG9aVzRnYVhRZ2JXRnJaWE1nYzJWdWMyVWdjR1Z5YUdGd2MxeHVJQ0F2THlBZ0lDQWdJQ0IzWlNCallXNGdjR0Z6Y3lCdWRXeHNMM1Z1WkdWbWFXNWxaQ0JoYm1RZ2JHVjBJRUZ6YzBWeWNtOXlJR1JsZEdWamRDQjNhR1Z1SUdsMFhHNGdJQzh2SUNBZ0lDQWdJRzFoYTJWeklITmxibk5sTGx4dVhHNGdJSFpoY2lCbGVIQmxZM1JsWkNBOUlHVjRjQzVsZUhCbFkzUmxaRHRjYmlBZ0x5OGdUVzlqYUdFZ2QybHNiQ0IwY25rZ2RHOGdhbk52Ym1sbWVTQjBhR1VnWlhod1pXTjBaV1FnZG1Gc2RXVXNJR3AxYzNRZ2FXZHViM0psSUdsbUlHbDBKM01nWVNCbWRXNWpkR2x2Ymx4dUlDQnBaaUFvZEhsd1pXOW1JR1Y0Y0dWamRHVmtJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ1pYaHdaV04wWldRZ1BTQnVkV3hzTzF4dUlDQjlYRzVjYmlBZ2RtRnlJR2x1YzNRZ1BTQnVaWGNnUVhOelJYSnliM0lvWlhKeWIzSXNJSE56WmlCOGZDQmhjbWQxYldWdWRITXVZMkZzYkdWbElIeDhJSEJ5YjNSdkxtSjFhV3hrUlhKeWIzSXBPMXh1SUNCcGJuTjBMbk5vYjNkRWFXWm1JRDBnWm1Gc2MyVTdYRzRnSUdsdWMzUXVZV04wZFdGc0lEMGdiblZzYkR0Y2JpQWdhVzV6ZEM1bGVIQmxZM1JsWkNBOUlHNTFiR3c3WEc0Z0lISmxkSFZ5YmlCcGJuTjBPMXh1ZlR0Y2JseHVMeThnVW1WemIyeDJaWE1nZEdobElHTjFjbkpsYm5RZ1kyaGhhVzRnWm05eUlHRWdaMmwyWlc0Z2RtRnNkV1V1SUZSb1pTQnlaWE4xYkhRZ2FYTWdZV3gzWVhseklHRmNiaTh2SUdKdmIyeGxZVzRnYVc1a2FXTmhkR2x1WnlCMGFHVWdiM1YwWTI5dFpTQnZjaUJoYmlCMWJtUmxabWx1WldRZ2RHOGdjMmxuYm1Gc0lIUm9ZWFFnYVhRZ2NtVmhZMmhsWkZ4dUx5OGdZVzRnWVhONWJtTm9jbTl1YjNWeklHWnNiM2N1WEc1d2NtOTBieTUwWlhOMElEMGdablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNCcFppQW9ZWEpuZFcxbGJuUnpMbXhsYm1kMGFDQTlQVDBnTUNrZ2UxeHVJQ0FnSUdGamRIVmhiQ0E5SUhSb2FYTXVkbUZzZFdVN1hHNGdJSDFjYmx4dUlDQXZMeUJTWlhOdmJIWmxJSFJvWlNCamFHRnBiaUJ6ZEdGeWRHbHVaeUJtY205dElISnZiM1JjYmlBZ2RtRnlJSEpsYzI5c2RtVnlJRDBnY21WemIyeDJaWEp6TG1GamNYVnBjbVVvZEdocGN5azdYRzRnSUhaaGNpQnlaWE4xYkhRZ1BTQnlaWE52YkhabGNpaGhZM1IxWVd3cE8xeHVYRzRnSUhKbGRIVnliaUJ5WlhOMWJIUTdYRzU5TzF4dVhHNHZMeUJRWlhKbWIzSnRjeUIwYUdVZ2NtVnpiMngxZEdsdmJpQnZaaUIwYUdVZ1kyaGhhVzRnWW5WMElHRmtaR2wwYVc5dVlXeHNlU0IzYVd4c0lISmhhWE5sSUdGdUlHVnljbTl5WEc0dkx5QnBaaUJwZENCbVlXbHNjeUIwYnlCamIyMXdiR1YwWlM0Z1YyaGxiaUIwYUdVZ1pYaHdjbVZ6YzJsdmJpQnlaWE52YkhabGN5QmhjeUIxYm1SbFptbHVaV1FnS0dGemVXNWpLVnh1THk4Z2FYUW5iR3dnWW1VZ1lYVjBiMjFoZEdsallXeHNlU0JsYm1GaWJHVWdhWFJ6SUdSbFptVnljbVZrSUdac1lXY3VYRzR2THlCVWFHVWdZSE56Wm1BZ2MzUmhibVJ6SUdadmNpQlRkR0ZqYTFSeVlXTmxSblZ1WTNScGIyNHNJR0VnY21WbVpYSmxibU5sSUhSdklIUm9aU0JtYVhKemRDQm1kVzVqZEdsdmJseHVMeThnZEc4Z2MyaHZkeUJ2YmlCMGFHVWdjM1JoWTJzZ2RISmhZMlV1WEc1d2NtOTBieTVoYzNObGNuUWdQU0JtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0J6YzJZcElIdGNiaUFnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BUMDlJREFwSUh0Y2JpQWdJQ0JoWTNSMVlXd2dQU0IwYUdsekxuWmhiSFZsTzF4dUlDQjlYRzVjYmlBZ0x5OGdTblZ6ZENCcFoyNXZjbVVnYVdZZ2RHaGxJR0ZqZEhWaGJDQjJZV3gxWlNCcGN5QnViM1FnY0hKbGMyVnVkQ0I1WlhSY2JpQWdMeThnVkU5RVR6b2dVMmhoYkd3Z2FYUWdjSEp2WkhWalpTQmhiaUJsY25KdmNqOWNiaUFnYVdZZ0tHRmpkSFZoYkNBOVBUMGdkR2hwY3k1ZlgwZFZRVkpFWDE4cElISmxkSFZ5YmlCMGFHbHpPMXh1WEc0Z0lIWmhjaUJ5WlhOdmJIWmxjaUE5SUhKbGMyOXNkbVZ5Y3k1aFkzRjFhWEpsS0hSb2FYTXBPMXh1SUNCMllYSWdjbVZ6ZFd4MElEMGdjbVZ6YjJ4MlpYSW9ZV04wZFdGc0tUdGNibHh1SUNBdkx5QkpkQ0JtWVdsc1pXUWdjMjhnY21Wd2IzSjBJR2wwSUhkcGRHZ2dZU0J1YVdObElHVnljbTl5WEc0Z0lHbG1JQ2h5WlhOMWJIUWdQVDA5SUdaaGJITmxLU0I3WEc0Z0lDQWdkR2h5YjNjZ2RHaHBjeTVpZFdsc1pFVnljbTl5S0hKbGMyOXNkbVZ5TG5KbGMyOXNkbVZrTENCemMyWWdmSHdnZEdocGN5NWhjM05sY25RcE8xeHVJQ0I5WEc1Y2JpQWdMeThnUTI5dWRtVnlkQ0IwYUdVZ1pYaHdjbVZ6YzJsdmJpQnBiblJ2SUdFZ1pHVm1aWEp5WldRZ2FXWWdZVzRnWVhONWJtTWdaWGh3WldOMGFXOXVJSGRoY3lCbWIzVnVaRnh1SUNCcFppQW9jbVZ6ZFd4MElEMDlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0IwYUdsekxsOWZaR1ZtWlhKeVpXUmZYeUE5SUhSeWRXVTdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdkR2hwY3p0Y2JuMDdYRzVjYmk4dklFRnpjMlZ5ZEhNZ2RHaGxJSEJ5YjNacFpHVmtJSFpoYkhWbElHRnVaQ0JwWmlCemRXTmpaWE56Wm5Wc0lISmxkSFZ5Ym5NZ2RHaGxJRzl5YVdkcGJtRnNYRzR2THlCMllXeDFaU0JwYm5OMFpXRmtJRzltSUhSb1pTQmphR0ZwYmlCcGJuTjBZVzVqWlM1Y2JuQnliM1J2TG5Sb2NtOTFaMmdnUFNCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJSFJvYVhNdVlYTnpaWEowS0dGamRIVmhiQ3dnY0hKdmRHOHVkR2h5YjNWbmFDazdYRzRnSUhKbGRIVnliaUJoWTNSMVlXdzdYRzU5TzF4dVhHNHZMeUJGZG1Gc2RXRjBaWE1nZEdobElHVjRjSEpsYzNOcGIyNGdZMmhoYVc0Z2NtVndiM0owYVc1bklIUm9aU0JzWVhOMElHMTFkR0YwWldRZ2RtRnNkV1VnYzJWbGJpQnBibHh1THk4Z2FYUXVJRWxtSUhSb1pTQmxlSEJ5WlhOemFXOXVJR1J2WlhNZ2JtOTBJR052YlhCc1pYUmxJR2wwSjJ4c0lISmxkSFZ5YmlCMWJtUmxabWx1WldRdVhHNXdjbTkwYnk1eVpYTjFiSFFnUFNCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJSFpoY2lCeVpYTjFiSFE3WEc1Y2JpQWdhV1lnS0dGeVozVnRaVzUwY3k1c1pXNW5kR2dnUFQwOUlEQXBJSHRjYmlBZ0lDQmhZM1IxWVd3Z1BTQjBhR2x6TG5aaGJIVmxPMXh1SUNCOVhHNWNiaUFnZEhKNUlIdGNiaUFnSUNCMGFHbHpMblJoY0NobWRXNWpkR2x2YmlBb2RtRnNkV1VwSUh0Y2JpQWdJQ0FnSUhKbGMzVnNkQ0E5SUhaaGJIVmxPMXh1SUNBZ0lIMHBMblJsYzNRb1lXTjBkV0ZzS1R0Y2JpQWdmU0JtYVc1aGJHeDVJSHRjYmlBZ0lDQXZMeUJTWlcxdmRtVWdkR2hsSUM1MFlYQWdabkp2YlNCMGFHVWdZMmhoYVc1Y2JpQWdJQ0IwYUdsekxsOWZaWGh3WldOMFlYUnBiMjV6WDE4dWNHOXdLQ2s3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnY21WemRXeDBPMXh1ZlR0Y2JseHVRMmhoYVc0dWNISnZkRzkwZVhCbExuWmhiSFZsVDJZZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lISmxkSFZ5YmlCMGFHbHpMblpoYkhWbE8xeHVmVHRjYmx4dVEyaGhhVzR1Y0hKdmRHOTBlWEJsTG5SdlUzUnlhVzVuSUQwZ1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNCcFppQW9kR2hwY3k1ZlgyUmxjMk55YVhCMGFXOXVYMThwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1ZlgyUmxjMk55YVhCMGFXOXVYMTg3WEc0Z0lIMWNibHh1SUNCMllYSWdaR1Z6WTNNZ1BWeHVJQ0FnSUhSb2FYTXVYMTlsZUhCbFkzUmhkR2x2Ym5OZlgxeHVJQ0FnSUM1bWFXeDBaWElvWm5WdVkzUnBiMjRnS0dNcElIc2djbVYwZFhKdUlHTXVaR1Z6WTNKcGNIUnBiMjQ3SUgwcFhHNGdJQ0FnTG0xaGNDaG1kVzVqZEdsdmJpQW9ZeWtnZXlCeVpYUjFjbTRnWXk1a1pYTmpjbWx3ZEdsdmJqc2dmU2s3WEc1Y2JpQWdhV1lnS0dSbGMyTnpMbXhsYm1kMGFDQStJREVwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdKeWduSUNzZ1pHVnpZM011YW05cGJpZ25MQ0FuS1NBcklDY3BKenRjYmlBZ2ZTQmxiSE5sSUdsbUlDaGtaWE5qY3k1c1pXNW5kR2dnUFQwOUlERXBJSHRjYmlBZ0lDQnlaWFIxY200Z1pHVnpZM05iTUYwN1hHNGdJSDBnWld4elpTQjdYRzRnSUNBZ2NtVjBkWEp1SUNjOFFYTnpRMmhoYVc0K0p6dGNiaUFnZlZ4dWZUdGNibHh1WEc1dGIyUjFiR1V1Wlhod2IzSjBjeUE5SUVOb1lXbHVPMXh1SWwxOSIsIi8vIEFQSSBjb21wYXRpYmxlIHdpdGggaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9hc3NlcnRpb24tZXJyb3IvXG4vLyBUaGlzIHNob3VsZCBtYWtlIGludGVncmF0aW9uIHdpdGggTW9jaGEgd29yaywgaW5jbHVkaW5nIGRpZmZlZFxuLy8gb3V0cHV0LlxuXG52YXIgRmFpbHVyZSA9IHJlcXVpcmUoJ2ZhaWx1cmUnKTtcblxudmFyIHVuYW5zaSA9IHJlcXVpcmUoJy4vdXRpbCcpLnVuYW5zaTtcblxuXG52YXIgQXNzRXJyb3IgPSBGYWlsdXJlLmNyZWF0ZSgnQXNzRXJyb3InKTtcbnZhciBwcm90byA9IEFzc0Vycm9yLnByb3RvdHlwZTtcblxucHJvdG8uc2hvd0RpZmYgPSBmYWxzZTtcbnByb3RvLmFjdHVhbCA9IG51bGw7XG5wcm90by5leHBlY3RlZCA9IG51bGw7XG5cbmZ1bmN0aW9uIGdldFRhcmdldExpbmUgKGZyYW1lcykge1xuICBmdW5jdGlvbiBnZXRTcmMgKGZyYW1lKSB7XG4gICAgdmFyIGZuID0gZnJhbWUuZ2V0RnVuY3Rpb24oKTtcbiAgICByZXR1cm4gZm4gPyBmbi50b1N0cmluZygpLnJlcGxhY2UoL1xccysvZywgJycpIDogbnVsbDtcbiAgfVxuXG4gIGlmICghZnJhbWVzLmxlbmd0aCkgcmV0dXJuIG51bGw7XG5cbiAgLy8gRmlyc3QgZnJhbWUgaXMgbm93IHRoZSB0YXJnZXRcbiAgdmFyIHRhcmdldCA9IGZyYW1lc1swXTtcbiAgdmFyIHRhcmdldFNyYyA9IGdldFNyYyh0YXJnZXQpO1xuICBpZiAoIXRhcmdldFNyYykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gRmlsdGVyIG91dCBhbGwgZnJhbWVzIHdoaWNoIGFyZSBub3QgaW4gdGhlIHNhbWUgZmlsZVxuICBzYW1lZmlsZSA9IGZyYW1lcy5maWx0ZXIoZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgcmV0dXJuIGZyYW1lICYmIGZyYW1lLmdldEZpbGVOYW1lKCkgPT09IHRhcmdldC5nZXRGaWxlTmFtZSgpO1xuICB9KTtcblxuICAvLyBHZXQgdGhlIGNsb3Nlc3QgZnVuY3Rpb24gaW4gdGhlIHNhbWUgZmlsZSB0aGF0IHdyYXBzIHRoZSB0YXJnZXQgZnJhbWVcbiAgdmFyIHdyYXBwZXI7XG4gIGZvciAodmFyIGk9MTsgaSA8IHNhbWVmaWxlLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNyYyA9IGdldFNyYyhzYW1lZmlsZVtpXSk7XG4gICAgaWYgKHNyYyAmJiAtMSAhPT0gc3JjLmluZGV4T2YodGFyZ2V0U3JjKSkge1xuICAgICAgd3JhcHBlciA9IHNhbWVmaWxlW2ldO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gV2hlbiBhIHdyYXBwZXIgZnVuY3Rpb24gaXMgZm91bmQgd2UgY2FuIHVzZSBpdCB0byBvYnRhaW4gdGhlIGxpbmUgd2Ugd2FudFxuICBpZiAod3JhcHBlcikge1xuICAgIC8vIEdldCByZWxhdGl2ZSBwb3NpdGlvbnNcbiAgICB2YXIgcmVsTG4gPSB0YXJnZXQuZ2V0TGluZU51bWJlcigpIC0gd3JhcHBlci5nZXRMaW5lTnVtYmVyKCk7XG4gICAgdmFyIHJlbENsID0gdGFyZ2V0LmdldExpbmVOdW1iZXIoKSA9PT0gd3JhcHBlci5nZXRMaW5lTnVtYmVyKClcbiAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgIDogdGFyZ2V0LmdldENvbHVtbk51bWJlcigpIC0gMTtcblxuICAgIHZhciBsaW5lcyA9IHRhcmdldC5nZXRGdW5jdGlvbigpLnRvU3RyaW5nKCkuc3BsaXQoL1xcbi8pO1xuICAgIGlmIChsaW5lc1tyZWxMbl0pIHtcbiAgICAgIHJldHVybiBsaW5lc1tyZWxMbl07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbnByb3RvLnRvSlNPTiA9IGZ1bmN0aW9uIChzdGFjaykge1xuICB2YXIgcHJvcHMgPSB7XG4gICAgbmFtZTogdGhpcy5uYW1lLFxuICAgIG1lc3NhZ2U6IHVuYW5zaSh0aGlzLm1lc3NhZ2UpLFxuICAgIGFjdHVhbDogdGhpcy5hY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IHRoaXMuZXhwZWN0ZWQsXG4gICAgc2hvd0RpZmY6IHRoaXMuc2hvd0RpZmZcbiAgfTtcblxuICAvLyBpbmNsdWRlIHN0YWNrIGlmIGV4aXN0cyBhbmQgbm90IHR1cm5lZCBvZmZcbiAgaWYgKHN0YWNrICYmIHRoaXMuc3RhY2spIHtcbiAgICBwcm9wcy5zdGFjayA9IHRoaXMuc3RhY2s7XG4gIH1cblxuICByZXR1cm4gcHJvcHM7XG59O1xuXG5wcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG1zZyA9IEZhaWx1cmUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGhpcyk7XG5cbiAgdmFyIGxpbmUgPSBnZXRUYXJnZXRMaW5lKHRoaXMuZnJhbWVzKTtcbiAgaWYgKGxpbmUpIHtcbiAgICBtc2cgKz0gJ1xcbiAgPj4gJyArIGxpbmUucmVwbGFjZSgvXlxccysvLCAnJykuc2xpY2UoMCwgNjApICsgJ1xcbic7XG4gIH1cblxuICByZXR1cm4gbXNnO1xufTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzRXJyb3I7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIE1hdGNoZXIgPSByZXF1aXJlKCcuL21hdGNoZXInKTtcblxudmFyIHRlbXBsYXRlID0gcmVxdWlyZSgnLi91dGlsJykudGVtcGxhdGU7XG5cblxuLy8gRXhwZWN0YXRpb24gcmVwcmVzZW50cyBhbiBpbnN0YW50aWF0ZWQgTWF0Y2hlciBhbHJlYWR5IGNvbmZpZ3VyZWQgd2l0aFxuLy8gYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzLlxuZnVuY3Rpb24gRXhwZWN0YXRpb24gKG1hdGNoZXIsIGFyZ3MpIHtcbiAgLy8gR2V0IHRoZSBtYXRjaGVyIGNvbmZpZ3VyYXRpb24gaW50byB0aGlzIGluc3RhbmNlXG4gIG1hdGNoZXIuYXNzaWduKHRoaXMpO1xuXG4gIC8vIFN1cHBvcnQgYmVpbmcgZ2l2ZW4gYW4gYGFyZ3VtZW50c2Agb2JqZWN0XG4gIHRoaXMuYXJncyA9IF8udG9BcnJheShhcmdzKTtcbiAgdGhpcy5hY3R1YWwgPSB1bmRlZmluZWQ7XG59XG5cbi8vIEluaGVyaXQgdGhlIHByb3RvdHlwZSBmcm9tIE1hdGNoZXJcbnZhciBwcm90byA9IEV4cGVjdGF0aW9uLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTWF0Y2hlci5wcm90b3R5cGUpO1xucHJvdG8uY29uc3RydWN0b3IgPSBFeHBlY3RhdGlvbjtcblxuLy8gR2VuZXJhdGUgZ2V0dGVyIGZvciBgLmV4cGVjdGVkYCAoYW4gYWxpYXMgZm9yIGFyZ3NbMF0pXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdleHBlY3RlZCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXJnc1swXTtcbiAgfSxcbiAgLy8gSGFjazogYWxsb3cgaXQgdG8gYmUgb3ZlcnJpZGVuIG9uIHRoZSBpbnN0YW5jZVxuICBzZXQ6IGZ1bmN0aW9uICh2KSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdleHBlY3RlZCcsIHtcbiAgICAgIHZhbHVlOiB2XG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vLyBHZW5lcmF0ZSBnZXR0ZXJzIGZvciB0aGUgZmlyc3QgNSBhcmd1bWVudHMgYXMgYXJnMSwgYXJnMiwgLi4uXG5fLnRpbWVzKDUsIGZ1bmN0aW9uIChpKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2FyZycgKyAoaSArIDEpLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5hcmdzW2ldO1xuICAgIH1cbiAgfSk7XG59KTtcblxuLy8gQ29tcHV0ZSB0aGUgZGVzY3JpcHRpb24gbWVzc2FnZSBmb3IgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGV4cGVjdGF0aW9uXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdkZXNjcmlwdGlvbicsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmRlc2MpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRoaXMuZGVzYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuZGVzYyh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlKHRoaXMuZGVzYywgdGhpcyk7XG4gIH1cbn0pO1xuXG4vLyBDb21wdXRlIHRoZSBmYWlsdXJlIG1lc3NhZ2UgZm9yIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBleHBlY3RhdGlvblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZmFpbHVyZScsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmZhaWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0aGlzLmZhaWwodGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB0ZW1wbGF0ZSh0aGlzLmZhaWwsIHRoaXMpO1xuICB9XG59KTtcblxuLy8gSGVscGVyIHRvIG11dGF0ZSB0aGUgdmFsdWUgdW5kZXIgdGVzdFxuRXhwZWN0YXRpb24ucHJvdG90eXBlLm11dGF0ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyKHZhbHVlKTtcbiAgfTtcbn07XG5cbi8vIFJlc29sdmluZyBjYW4gb3ZlcnJpZGUgdGhlIGV4cGVjdGF0aW9uIHN0YXRlLCBpZiB0aGF0J3Mgbm90IGRlc2lyYWJsZSBtYWtlXG4vLyBzdXJlIHRoYXQgdGhpcyBtZXRob2QgaXMgY2FsbGVkIGluIGEgbmV3IGNvbnRleHQuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFyZ3MsIHJlc3VsdDtcblxuICAvLyBFeGVjdXRlIHRoZSBtYXRjaGVyIHRlc3Qgbm93IHRoYXQgZXZlcnl0aGluZyBpcyBzZXRcbiAgYXJncyA9IFt0aGlzLmFjdHVhbF0uY29uY2F0KHRoaXMuYXJncyk7XG4gIHJlc3VsdCA9IHRoaXMudGVzdC5hcHBseSh0aGlzLCBhcmdzKTtcblxuICAvLyBSZXR1cm5pbmcgYSBzdHJpbmcgb3ZlcnJpZGVzIHRoZSBtaXNtYXRjaCBkZXNjcmlwdGlvblxuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICB0aGlzLmZhaWwgPSByZXN1bHQ7XG4gICAgcmVzdWx0ID0gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5kZXNjcmlwdGlvbjtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBFeHBlY3RhdGlvbjtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbXhwWWk5bGVIQmxZM1JoZEdsdmJpNXFjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPMEZCUVVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFaUxDSm1hV3hsSWpvaVoyVnVaWEpoZEdWa0xtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJblpoY2lCZklEMGdLSFI1Y0dWdlppQjNhVzVrYjNjZ0lUMDlJRndpZFc1a1pXWnBibVZrWENJZ1B5QjNhVzVrYjNkYkoxOG5YU0E2SUhSNWNHVnZaaUJuYkc5aVlXd2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUJuYkc5aVlXeGJKMThuWFNBNklHNTFiR3dwTzF4dVhHNTJZWElnUTJoaGFXNGdQU0J5WlhGMWFYSmxLQ2N1TDJOb1lXbHVKeWs3WEc1MllYSWdUV0YwWTJobGNpQTlJSEpsY1hWcGNtVW9KeTR2YldGMFkyaGxjaWNwTzF4dVhHNTJZWElnZEdWdGNHeGhkR1VnUFNCeVpYRjFhWEpsS0NjdUwzVjBhV3duS1M1MFpXMXdiR0YwWlR0Y2JseHVYRzR2THlCRmVIQmxZM1JoZEdsdmJpQnlaWEJ5WlhObGJuUnpJR0Z1SUdsdWMzUmhiblJwWVhSbFpDQk5ZWFJqYUdWeUlHRnNjbVZoWkhrZ1kyOXVabWxuZFhKbFpDQjNhWFJvWEc0dkx5QmhibmtnWVdSa2FYUnBiMjVoYkNCaGNtZDFiV1Z1ZEhNdVhHNW1kVzVqZEdsdmJpQkZlSEJsWTNSaGRHbHZiaUFvYldGMFkyaGxjaXdnWVhKbmN5a2dlMXh1SUNBdkx5QkhaWFFnZEdobElHMWhkR05vWlhJZ1kyOXVabWxuZFhKaGRHbHZiaUJwYm5SdklIUm9hWE1nYVc1emRHRnVZMlZjYmlBZ2JXRjBZMmhsY2k1aGMzTnBaMjRvZEdocGN5azdYRzVjYmlBZ0x5OGdVM1Z3Y0c5eWRDQmlaV2x1WnlCbmFYWmxiaUJoYmlCZ1lYSm5kVzFsYm5SellDQnZZbXBsWTNSY2JpQWdkR2hwY3k1aGNtZHpJRDBnWHk1MGIwRnljbUY1S0dGeVozTXBPMXh1SUNCMGFHbHpMbUZqZEhWaGJDQTlJSFZ1WkdWbWFXNWxaRHRjYm4xY2JseHVMeThnU1c1b1pYSnBkQ0IwYUdVZ2NISnZkRzkwZVhCbElHWnliMjBnVFdGMFkyaGxjbHh1ZG1GeUlIQnliM1J2SUQwZ1JYaHdaV04wWVhScGIyNHVjSEp2ZEc5MGVYQmxJRDBnVDJKcVpXTjBMbU55WldGMFpTaE5ZWFJqYUdWeUxuQnliM1J2ZEhsd1pTazdYRzV3Y205MGJ5NWpiMjV6ZEhKMVkzUnZjaUE5SUVWNGNHVmpkR0YwYVc5dU8xeHVYRzR2THlCSFpXNWxjbUYwWlNCblpYUjBaWElnWm05eUlHQXVaWGh3WldOMFpXUmdJQ2hoYmlCaGJHbGhjeUJtYjNJZ1lYSm5jMXN3WFNsY2JrOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBlU2h3Y205MGJ5d2dKMlY0Y0dWamRHVmtKeXdnZTF4dUlDQm5aWFE2SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNCeVpYUjFjbTRnZEdocGN5NWhjbWR6V3pCZE8xeHVJQ0I5TEZ4dUlDQXZMeUJJWVdOck9pQmhiR3h2ZHlCcGRDQjBieUJpWlNCdmRtVnljbWxrWlc0Z2IyNGdkR2hsSUdsdWMzUmhibU5sWEc0Z0lITmxkRG9nWm5WdVkzUnBiMjRnS0hZcElIdGNiaUFnSUNCUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRIa29kR2hwY3l3Z0oyVjRjR1ZqZEdWa0p5d2dlMXh1SUNBZ0lDQWdkbUZzZFdVNklIWmNiaUFnSUNCOUtUdGNiaUFnZlZ4dWZTazdYRzVjYmk4dklFZGxibVZ5WVhSbElHZGxkSFJsY25NZ1ptOXlJSFJvWlNCbWFYSnpkQ0ExSUdGeVozVnRaVzUwY3lCaGN5QmhjbWN4TENCaGNtY3lMQ0F1TGk1Y2JsOHVkR2x0WlhNb05Td2dablZ1WTNScGIyNGdLR2twSUh0Y2JpQWdUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1S0hCeWIzUnZMQ0FuWVhKbkp5QXJJQ2hwSUNzZ01Ta3NJSHRjYmlBZ0lDQm5aWFE2SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbUZ5WjNOYmFWMDdYRzRnSUNBZ2ZWeHVJQ0I5S1R0Y2JuMHBPMXh1WEc0dkx5QkRiMjF3ZFhSbElIUm9aU0JrWlhOamNtbHdkR2x2YmlCdFpYTnpZV2RsSUdadmNpQjBhR1VnWTNWeWNtVnVkQ0J6ZEdGMFpTQnZaaUIwYUdVZ1pYaHdaV04wWVhScGIyNWNiazlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNod2NtOTBieXdnSjJSbGMyTnlhWEIwYVc5dUp5d2dlMXh1SUNCblpYUTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0JwWmlBb0lYUm9hWE11WkdWell5a2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3c3WEc0Z0lDQWdmVnh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdkR2hwY3k1a1pYTmpJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVrWlhOaktIUm9hWE1wTzF4dUlDQWdJSDFjYmlBZ0lDQnlaWFIxY200Z2RHVnRjR3hoZEdVb2RHaHBjeTVrWlhOakxDQjBhR2x6S1R0Y2JpQWdmVnh1ZlNrN1hHNWNiaTh2SUVOdmJYQjFkR1VnZEdobElHWmhhV3gxY21VZ2JXVnpjMkZuWlNCbWIzSWdkR2hsSUdOMWNuSmxiblFnYzNSaGRHVWdiMllnZEdobElHVjRjR1ZqZEdGMGFXOXVYRzVQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb2NISnZkRzhzSUNkbVlXbHNkWEpsSnl3Z2UxeHVJQ0JuWlhRNklHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JSFJvYVhNdVptRnBiQ0E5UFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11Wm1GcGJDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjbVYwZFhKdUlIUmxiWEJzWVhSbEtIUm9hWE11Wm1GcGJDd2dkR2hwY3lrN1hHNGdJSDFjYm4wcE8xeHVYRzR2THlCSVpXeHdaWElnZEc4Z2JYVjBZWFJsSUhSb1pTQjJZV3gxWlNCMWJtUmxjaUIwWlhOMFhHNUZlSEJsWTNSaGRHbHZiaTV3Y205MGIzUjVjR1V1YlhWMFlYUmxJRDBnWm5WdVkzUnBiMjRnS0haaGJIVmxLU0I3WEc0Z0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNCeVpYUjFjbTRnY21WemIyeDJaWElvZG1Gc2RXVXBPMXh1SUNCOU8xeHVmVHRjYmx4dUx5OGdVbVZ6YjJ4MmFXNW5JR05oYmlCdmRtVnljbWxrWlNCMGFHVWdaWGh3WldOMFlYUnBiMjRnYzNSaGRHVXNJR2xtSUhSb1lYUW5jeUJ1YjNRZ1pHVnphWEpoWW14bElHMWhhMlZjYmk4dklITjFjbVVnZEdoaGRDQjBhR2x6SUcxbGRHaHZaQ0JwY3lCallXeHNaV1FnYVc0Z1lTQnVaWGNnWTI5dWRHVjRkQzVjYmtWNGNHVmpkR0YwYVc5dUxuQnliM1J2ZEhsd1pTNXlaWE52YkhabElEMGdablZ1WTNScGIyNGdLQ2tnZTF4dUlDQjJZWElnWVhKbmN5d2djbVZ6ZFd4ME8xeHVYRzRnSUM4dklFVjRaV04xZEdVZ2RHaGxJRzFoZEdOb1pYSWdkR1Z6ZENCdWIzY2dkR2hoZENCbGRtVnllWFJvYVc1bklHbHpJSE5sZEZ4dUlDQmhjbWR6SUQwZ1czUm9hWE11WVdOMGRXRnNYUzVqYjI1allYUW9kR2hwY3k1aGNtZHpLVHRjYmlBZ2NtVnpkV3gwSUQwZ2RHaHBjeTUwWlhOMExtRndjR3g1S0hSb2FYTXNJR0Z5WjNNcE8xeHVYRzRnSUM4dklGSmxkSFZ5Ym1sdVp5QmhJSE4wY21sdVp5QnZkbVZ5Y21sa1pYTWdkR2hsSUcxcGMyMWhkR05vSUdSbGMyTnlhWEIwYVc5dVhHNGdJR2xtSUNoMGVYQmxiMllnY21WemRXeDBJRDA5UFNBbmMzUnlhVzVuSnlrZ2UxeHVJQ0FnSUhSb2FYTXVabUZwYkNBOUlISmxjM1ZzZER0Y2JpQWdJQ0J5WlhOMWJIUWdQU0JtWVd4elpUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQnlaWE4xYkhRN1hHNTlPMXh1WEc1RmVIQmxZM1JoZEdsdmJpNXdjbTkwYjNSNWNHVXVkRzlUZEhKcGJtY2dQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJSEpsZEhWeWJpQjBhR2x6TG1SbGMyTnlhWEIwYVc5dU8xeHVmVHRjYmx4dVhHNXRiMlIxYkdVdVpYaHdiM0owY3lBOUlFVjRjR1ZqZEdGMGFXOXVPMXh1SWwxOSIsIi8vIFRoZSBNYXRjaGVyIG9iamVjdCBpcyBhIGRlc2NyaXB0b3IgZm9yIHRoZSBtYXRjaGluZyBsb2dpYyBidXQgY2Fubm90XG4vLyBiZSB1c2VkIGRpcmVjdGx5LiBVc2UgYW4gRXhwZWN0YXRpb24gdG8gZ2V0IGFuIGluaXRpYWxpemVkIG1hdGNoZXIuXG5mdW5jdGlvbiBNYXRjaGVyIChuYW1lLCBkZXNjcmlwdG9yKSB7XG5cbiAgLy8gU2hvcnRjdXQgZm9yIHNpbXBsZSB0ZXN0IGZ1bmN0aW9uc1xuICBpZiAodHlwZW9mIGRlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkZXNjcmlwdG9yID0ge3Rlc3Q6IGRlc2NyaXB0b3J9O1xuICB9XG5cbiAgLy8gVGhlIGdlbmVyaWMgbmFtZSBvZiB0aGUgbWF0Y2hlclxuICB0aGlzLm5hbWUgPSBuYW1lO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGRlc2NyaXB0b3IuaGVscCkpIHtcbiAgICB0aGlzLmhlbHAgPSBkZXNjcmlwdG9yLmhlbHAuam9pbignXFxuJyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5oZWxwID0gZGVzY3JpcHRvci5oZWxwIHx8ICdOb3QgYXZhaWxhYmxlJztcbiAgfVxuXG4gIC8vIEVpdGhlciBhIHRlbXBsYXRlIHN0cmluZyBvciBhIGZ1bmN0aW9uIHRoYXQgd2lsbCByZWNlaXZlIGFzIG9ubHlcbiAgLy8gYXJndW1lbnQgYW4gRXhwZWN0YXRpb24gaW5zdGFuY2UgKGNhbGxlZCBhcyBhIG1ldGhvZCBvZiBpdCkuXG4gIHRoaXMuZGVzYyA9IGRlc2NyaXB0b3IuZGVzYyAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IGRlc2NyaXB0b3IuZGVzY1xuICAgICAgICAgICAgOiB0aGlzLm5hbWU7XG5cbiAgLy8gRWl0aGVyIGEgdGVtcGxhdGUgc3RyaW5nIG9yIGEgZnVuY3Rpb24gdGhhdCB3aWxsIHJlY2VpdmUgYXMgb25seVxuICAvLyBhcmd1bWVudCBhbiBFeHBlY3RhdGlvbiBpbnN0YW5jZSAoY2FsbGVkIGFzIGEgbWV0aG9kIG9mIGl0KS5cbiAgdGhpcy5mYWlsID0gZGVzY3JpcHRvci5mYWlsIHx8ICd3YXMge3sgYWN0dWFsIH19JztcblxuICBpZiAoIWRlc2NyaXB0b3IudGVzdCkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGVzdCBmdW5jdGlvbiBub3QgZGVmaW5lZCBmb3IgdGhlIG1hdGNoZXInKTtcbiAgfVxuICB0aGlzLnRlc3QgPSBkZXNjcmlwdG9yLnRlc3Q7XG5cbiAgdGhpcy5hcml0eSA9IGRlc2NyaXB0b3IuYXJpdHkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgID8gZGVzY3JpcHRvci5hcml0eVxuICAgICAgICAgICAgIDogdGhpcy50ZXN0Lmxlbmd0aDtcbn1cblxuTWF0Y2hlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuTWF0Y2hlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNYXRjaGVyO1xuXG5NYXRjaGVyLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMubmFtZSwge1xuICAgIGhlbHA6IHRoaXMuaGVscCxcbiAgICBkZXNjOiB0aGlzLmRlc2MsXG4gICAgZmFpbDogdGhpcy5mYWlsLFxuICAgIHRlc3Q6IHRoaXMudGVzdCxcbiAgICBhcml0eTogdGhpcy5hcml0eVxuICB9KTtcbn07XG5cbi8vIEF1Z21lbnQgYW5vdGhlciBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBvZiB0aGlzIG1hdGNoZXJcbk1hdGNoZXIucHJvdG90eXBlLmFzc2lnbiA9IGZ1bmN0aW9uIChvYmopIHtcbiAgb2JqLmhlbHAgPSB0aGlzLmhlbHA7XG4gIG9iai5kZXNjID0gdGhpcy5kZXNjO1xuICBvYmouZmFpbCA9IHRoaXMuZmFpbDtcbiAgb2JqLnRlc3QgPSB0aGlzLnRlc3Q7XG4gIG9iai5hcml0eSA9IHRoaXMuYXJpdHk7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICc8QXNzLk1hdGNoZXIgJyArIHRoaXMubmFtZSArICc+Jztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXRjaGVyO1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snXyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnXyddIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuLy8gR2l2ZW4gdGhlIGFyZ3VtZW50cyB3aXRoIHRoZSBicmFuY2hlcyBtYWtlIHN1cmUgdGhleSBhcmUgYWxsIGV4cHJlc3Npb25zXG5mdW5jdGlvbiB3cmFwQXJncyAoYXJncykge1xuICByZXR1cm4gXy50b0FycmF5KGFyZ3MpLnNsaWNlKDEpLm1hcChmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgcmV0dXJuIGFzcy5DaGFpbi5pc0NoYWluKGJyYW5jaCkgPyBicmFuY2ggOiBhc3MuZXFsKGJyYW5jaCk7XG4gIH0pO1xufVxuXG5hc3MucmVnaXN0ZXIoe1xuXG4gIGFuZDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIGV4cHJlc3Npb25zLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYWxsIHRoZSBleHByZXNzaW9ucyB0aGF0IGZvcm0gaXQgZG8gaW5kZWVkIHN1Y2NlZWQuJyxcbiAgICAgICdOb3RlOiBldmFsdWF0aW9uIHdpbGwgc3RvcCBhcyBzb29uIGFzIG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgZmFpbHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBBTkQgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSB3cmFwQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBDaGVjayBpZiBhbGwgYnJhbmNoZXMgcGFzcyB0aGUgdGVzdFxuICAgICAgICB2YXIgdW5kZWZzID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IF8uZXZlcnkoYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICB2YXIgcGFydGlhbCA9IGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgICAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuZGVmcyArPSAxO1xuICAgICAgICAgICAgYnJhbmNoLnRoZW4oXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksIF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBrZWVwIGl0ZXJhdGluZ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXJ0aWFsO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRha2UgY2FyZSBvZiBhbnkgZXhwZWN0YXRpb25zIGxhdGVyIGluIHRoZSBjaGFpblxuICAgICAgICBpZiAocmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcbiAgb3I6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgZXhwZWN0YXRpb24gZnJvbSB0d28gb3IgbW9yZSBleHByZXNzaW9ucywgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgZG9lcy4nLFxuICAgICAgJ05vdGU6IGV2YWx1YXRpb24gd2lsbCBzdG9wIGFzIHNvb24gYXMgb25lIG9mIHRoZSBleHByZXNzaW9ucyBzdWNjZWVkcy4nXG4gICAgXSxcbiAgICBkZXNjOiAnJHsgYXJncy5qb2luKFwiIE9SIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gd3JhcEFyZ3MoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciByZXN1bHQgPSBfLnNvbWUoYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICB2YXIgcGFydGlhbCA9IGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgICAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuZGVmcyArPSAxO1xuICAgICAgICAgICAgYnJhbmNoLnRoZW4oXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8ga2VlcCBpdGVyYXRpbmdcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGFydGlhbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGV4cGVjdGF0aW9ucyBsYXRlciBpbiB0aGUgY2hhaW5cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIHhvcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIGV4cHJlc3Npb25zLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBleHByZXNzaW9ucyBkb2VzIGJ1dCBub3QgYWxsIG9mIHRoZW0uJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBYT1IgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSB3cmFwQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBDaGVjayBpZiBhbGwgYnJhbmNoZXMgcGFzcyB0aGUgdGVzdFxuICAgICAgICB2YXIgdW5kZWZzID0gMDtcbiAgICAgICAgdmFyIG9rcyA9IDA7XG4gICAgICAgIHZhciBrb3MgPSAwO1xuICAgICAgICBfLmZvckVhY2goYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICB2YXIgcGFydGlhbCA9IGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgICAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuZGVmcyArPSAxO1xuICAgICAgICAgICAgYnJhbmNoLnRoZW4oXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKGtvcyA+IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgb2tzICs9IDE7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCwgb2tzID4gMCAmJiBrb3MgPiAwID8gdW5kZWZpbmVkIDogZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKG9rcyA+IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAga29zICs9IDE7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCwgb2tzID4gMCAmJiBrb3MgPiAwID8gdW5kZWZpbmVkIDogZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRpYWwgPT09IHRydWUpIHtcbiAgICAgICAgICAgIG9rcyArPSAxO1xuICAgICAgICAgIH0gZWxzZSBpZiAocGFydGlhbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGtvcyArPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2tzID4gMCAmJiBrb3MgPiAwID8gcmVzb2x2ZXIoYWN0dWFsKSA6IGZhbHNlO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOXRZWFJqYUdWeWN5OWpiMjl5WkdsdVlYUnBiMjR1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRWlMQ0ptYVd4bElqb2laMlZ1WlhKaGRHVmtMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSW5aaGNpQmZJRDBnS0hSNWNHVnZaaUIzYVc1a2IzY2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUIzYVc1a2IzZGJKMThuWFNBNklIUjVjR1Z2WmlCbmJHOWlZV3dnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCbmJHOWlZV3hiSjE4blhTQTZJRzUxYkd3cE8xeHVYRzUyWVhJZ1lYTnpJRDBnY21WeGRXbHlaU2duTGk0dllYTnpKeWs3WEc1Y2JpOHZJRWRwZG1WdUlIUm9aU0JoY21kMWJXVnVkSE1nZDJsMGFDQjBhR1VnWW5KaGJtTm9aWE1nYldGclpTQnpkWEpsSUhSb1pYa2dZWEpsSUdGc2JDQmxlSEJ5WlhOemFXOXVjMXh1Wm5WdVkzUnBiMjRnZDNKaGNFRnlaM01nS0dGeVozTXBJSHRjYmlBZ2NtVjBkWEp1SUY4dWRHOUJjbkpoZVNoaGNtZHpLUzV6YkdsalpTZ3hLUzV0WVhBb1puVnVZM1JwYjI0Z0tHSnlZVzVqYUNrZ2UxeHVJQ0FnSUhKbGRIVnliaUJoYzNNdVEyaGhhVzR1YVhORGFHRnBiaWhpY21GdVkyZ3BJRDhnWW5KaGJtTm9JRG9nWVhOekxtVnhiQ2hpY21GdVkyZ3BPMXh1SUNCOUtUdGNibjFjYmx4dVlYTnpMbkpsWjJsemRHVnlLSHRjYmx4dUlDQmhibVE2SUh0Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5RMjl0Y0c5elpYTWdZU0J1WlhjZ1pYaHdaV04wWVhScGIyNGdabkp2YlNCMGQyOGdiM0lnYlc5eVpTQmxlSEJ5WlhOemFXOXVjeXdnZDJocFkyZ2dkMmxzYkNCdmJteDVKeXhjYmlBZ0lDQWdJQ2R6ZFdOalpXVmtJR2xtSUdGc2JDQjBhR1VnWlhod2NtVnpjMmx2Ym5NZ2RHaGhkQ0JtYjNKdElHbDBJR1J2SUdsdVpHVmxaQ0J6ZFdOalpXVmtMaWNzWEc0Z0lDQWdJQ0FuVG05MFpUb2daWFpoYkhWaGRHbHZiaUIzYVd4c0lITjBiM0FnWVhNZ2MyOXZiaUJoY3lCdmJtVWdiMllnZEdobElHVjRjSEpsYzNOcGIyNXpJR1poYVd4ekxpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2NrZXlCaGNtZHpMbXB2YVc0b1hDSWdRVTVFSUZ3aUtTQjlKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJSHQ3SUdGamRIVmhiQ0I5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2dZbkpoYm1Ob01Td2dZbkpoYm1Ob01pa2dlMXh1SUNBZ0lDQWdkbUZ5SUdKeVlXNWphR1Z6SUQwZ2QzSmhjRUZ5WjNNb1lYSm5kVzFsYm5SektUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNBZ0lDQWdMeThnUTJobFkyc2dhV1lnWVd4c0lHSnlZVzVqYUdWeklIQmhjM01nZEdobElIUmxjM1JjYmlBZ0lDQWdJQ0FnZG1GeUlIVnVaR1ZtY3lBOUlEQTdYRzRnSUNBZ0lDQWdJSFpoY2lCeVpYTjFiSFFnUFNCZkxtVjJaWEo1S0dKeVlXNWphR1Z6TENCbWRXNWpkR2x2YmlBb1luSmhibU5vS1NCN1hHNGdJQ0FnSUNBZ0lDQWdkbUZ5SUhCaGNuUnBZV3dnUFNCaWNtRnVZMmd1ZEdWemRDaGhZM1IxWVd3cE8xeHVJQ0FnSUNBZ0lDQWdJR2xtSUNod1lYSjBhV0ZzSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doY21WemIyeDJaWEl1Y0dGMWMyVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbkJoZFhObEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0IxYm1SbFpuTWdLejBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WVc1amFDNTBhR1Z1S0Y4dWIyNWpaU2htZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhWdVpHVm1jeUF0UFNBeE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9NQ0E5UFQwZ2RXNWtaV1p6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNtVnpkVzFsS0dGamRIVmhiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBMQ0JmTG05dVkyVW9ablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTV5WlhOMWJXVW9iblZzYkN3Z1ptRnNjMlVwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU2twTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlRzZ0x5OGdhMlZsY0NCcGRHVnlZWFJwYm1kY2JpQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnY0dGeWRHbGhiRHRjYmlBZ0lDQWdJQ0FnZlNrN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0hKbGMyOXNkbVZ5TG5CaGRYTmxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMWJtUmxabWx1WldRN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0F2THlCVVlXdGxJR05oY21VZ2IyWWdZVzU1SUdWNGNHVmpkR0YwYVc5dWN5QnNZWFJsY2lCcGJpQjBhR1VnWTJoaGFXNWNiaUFnSUNBZ0lDQWdhV1lnS0hKbGMzVnNkQ0E5UFQwZ2RISjFaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxjM1ZzZENBOUlISmxjMjlzZG1WeUtHRmpkSFZoYkNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbVZ6ZFd4ME8xeHVJQ0FnSUNBZ2ZUdGNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHOXlPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owTnZiWEJ2YzJWeklHRWdibVYzSUdWNGNHVmpkR0YwYVc5dUlHWnliMjBnZEhkdklHOXlJRzF2Y21VZ1pYaHdjbVZ6YzJsdmJuTXNJSGRvYVdOb0lIZHBiR3dnYjI1c2VTY3NYRzRnSUNBZ0lDQW5jM1ZqWTJWbFpDQnBaaUJoZENCc1pXRnpkQ0J2Ym1VZ2IyWWdkR2hsSUdWNGNISmxjM05wYjI1eklHUnZaWE11Snl4Y2JpQWdJQ0FnSUNkT2IzUmxPaUJsZG1Gc2RXRjBhVzl1SUhkcGJHd2djM1J2Y0NCaGN5QnpiMjl1SUdGeklHOXVaU0J2WmlCMGFHVWdaWGh3Y21WemMybHZibk1nYzNWalkyVmxaSE11SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0p5UjdJR0Z5WjNNdWFtOXBiaWhjSWlCUFVpQmNJaWtnZlNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lCN2V5QmhZM1IxWVd3Z2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdKeVlXNWphREVzSUdKeVlXNWphRElwSUh0Y2JpQWdJQ0FnSUhaaGNpQmljbUZ1WTJobGN5QTlJSGR5WVhCQmNtZHpLR0Z5WjNWdFpXNTBjeWs3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdablZ1WTNScGIyNGdLSEpsYzI5c2RtVnlLU0I3WEc0Z0lDQWdJQ0FnSUM4dklFTm9aV05ySUdsbUlHRnNiQ0JpY21GdVkyaGxjeUJ3WVhOeklIUm9aU0IwWlhOMFhHNGdJQ0FnSUNBZ0lIWmhjaUIxYm1SbFpuTWdQU0F3TzF4dUlDQWdJQ0FnSUNCMllYSWdjbVZ6ZFd4MElEMGdYeTV6YjIxbEtHSnlZVzVqYUdWekxDQm1kVzVqZEdsdmJpQW9ZbkpoYm1Ob0tTQjdYRzRnSUNBZ0lDQWdJQ0FnZG1GeUlIQmhjblJwWVd3Z1BTQmljbUZ1WTJndWRHVnpkQ2hoWTNSMVlXd3BPMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDaHdZWEowYVdGc0lEMDlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaGNtVnpiMngyWlhJdWNHRjFjMlZrS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGMyOXNkbVZ5TG5CaGRYTmxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCMWJtUmxabk1nS3owZ01UdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVlXNWphQzUwYUdWdUtGOHViMjVqWlNobWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxuSmxjM1Z0WlNoaFkzUjFZV3dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU2tzSUY4dWIyNWpaU2htZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhWdVpHVm1jeUF0UFNBeE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9NQ0E5UFQwZ2RXNWtaV1p6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNtVnpkVzFsS0c1MWJHd3NJR1poYkhObEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnWm1Gc2MyVTdJQzh2SUd0bFpYQWdhWFJsY21GMGFXNW5YRzRnSUNBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIQmhjblJwWVd3N1hHNGdJQ0FnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaHlaWE52YkhabGNpNXdZWFZ6WldRcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdWR0ZyWlNCallYSmxJRzltSUdGdWVTQmxlSEJsWTNSaGRHbHZibk1nYkdGMFpYSWdhVzRnZEdobElHTm9ZV2x1WEc0Z0lDQWdJQ0FnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJSFJ5ZFdVcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhOMWJIUWdQU0J5WlhOdmJIWmxjaWhoWTNSMVlXd3BPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhKbGMzVnNkRHRjYmlBZ0lDQWdJSDA3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0I0YjNJNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuUTI5dGNHOXpaWE1nWVNCdVpYY2daWGh3WldOMFlYUnBiMjRnWm5KdmJTQjBkMjhnYjNJZ2JXOXlaU0JsZUhCeVpYTnphVzl1Y3l3Z2QyaHBZMmdnZDJsc2JDQnZibXg1Snl4Y2JpQWdJQ0FnSUNkemRXTmpaV1ZrSUdsbUlHRjBJR3hsWVhOMElHOXVaU0J2WmlCMGFHVWdaWGh3Y21WemMybHZibk1nWkc5bGN5QmlkWFFnYm05MElHRnNiQ0J2WmlCMGFHVnRMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNja2V5QmhjbWR6TG1wdmFXNG9YQ0lnV0U5U0lGd2lLU0I5Snl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N0lHRmpkSFZoYkNCOWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnWW5KaGJtTm9NU3dnWW5KaGJtTm9NaWtnZTF4dUlDQWdJQ0FnZG1GeUlHSnlZVzVqYUdWeklEMGdkM0poY0VGeVozTW9ZWEpuZFcxbGJuUnpLVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpYSXBJSHRjYmlBZ0lDQWdJQ0FnTHk4Z1EyaGxZMnNnYVdZZ1lXeHNJR0p5WVc1amFHVnpJSEJoYzNNZ2RHaGxJSFJsYzNSY2JpQWdJQ0FnSUNBZ2RtRnlJSFZ1WkdWbWN5QTlJREE3WEc0Z0lDQWdJQ0FnSUhaaGNpQnZhM01nUFNBd08xeHVJQ0FnSUNBZ0lDQjJZWElnYTI5eklEMGdNRHRjYmlBZ0lDQWdJQ0FnWHk1bWIzSkZZV05vS0dKeVlXNWphR1Z6TENCbWRXNWpkR2x2YmlBb1luSmhibU5vS1NCN1hHNGdJQ0FnSUNBZ0lDQWdkbUZ5SUhCaGNuUnBZV3dnUFNCaWNtRnVZMmd1ZEdWemRDaGhZM1IxWVd3cE8xeHVJQ0FnSUNBZ0lDQWdJR2xtSUNod1lYSjBhV0ZzSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doY21WemIyeDJaWEl1Y0dGMWMyVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbkJoZFhObEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0IxYm1SbFpuTWdLejBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WVc1amFDNTBhR1Z1S0Y4dWIyNWpaU2htZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaHJiM01nUGlBd0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVjbVZ6ZFcxbEtHRmpkSFZoYkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJRzlyY3lBclBTQXhPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQjFibVJsWm5NZ0xUMGdNVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0RBZ1BUMDlJSFZ1WkdWbWN5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbkpsYzNWdFpTaGhZM1IxWVd3c0lHOXJjeUErSURBZ0ppWWdhMjl6SUQ0Z01DQS9JSFZ1WkdWbWFXNWxaQ0E2SUdaaGJITmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3NJRjh1YjI1alpTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNodmEzTWdQaUF3S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNtVnpkVzFsS0dGamRIVmhiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lHdHZjeUFyUFNBeE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCMWJtUmxabk1nTFQwZ01UdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLREFnUFQwOUlIVnVaR1ZtY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxuSmxjM1Z0WlNoaFkzUjFZV3dzSUc5cmN5QStJREFnSmlZZ2EyOXpJRDRnTUNBL0lIVnVaR1ZtYVc1bFpDQTZJR1poYkhObEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNod1lYSjBhV0ZzSUQwOVBTQjBjblZsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J2YTNNZ0t6MGdNVHRjYmlBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tIQmhjblJwWVd3Z1BUMDlJR1poYkhObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcmIzTWdLejBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2h5WlhOdmJIWmxjaTV3WVhWelpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZFc1a1pXWnBibVZrTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHOXJjeUErSURBZ0ppWWdhMjl6SUQ0Z01DQS9JSEpsYzI5c2RtVnlLR0ZqZEhWaGJDa2dPaUJtWVd4elpUdGNiaUFnSUNBZ0lIMDdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JuMHBPMXh1SWwxOSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ18nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ18nXSA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuLy8gU2V0IG9mIGRlZmF1bHQgbWF0Y2hlcnNcbmFzcy5yZWdpc3Rlcih7XG4gIC8vIFRPRE86IE1vdmUgdGhpcyB0byB0aGUgQ2hhaW4gcHJvdG90eXBlXG4gIGRlc2M6IHtcbiAgICBoZWxwOiAnUHJvdmlkZSBhIGN1c3RvbSBkZXNjcmlwdGlvbiBmb3IgcmVwb3J0ZWQgZmFpbHVyZXMnLFxuICAgIGRlc2M6IG51bGwsICAvLyBTa2lwIGl0IGZyb20gcmVwb3J0c1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGRlc2MpIHtcbiAgICAgIC8vIE5vdGUgdGhhdCB0aGUgZGVzY3JpcHRpb24gd29uJ3QgYmUgc2V0IHVudGlsIHRoZSBjaGFpbiBpcyByZXNvbHZlZCxcbiAgICAgIC8vIGF0IGxlYXN0IG9uY2UsIHJlYWNoaW5nIHRoaXMgZXhwZWN0YXRpb24uXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIHJlc29sdmVyLmNoYWluLl9fZGVzY3JpcHRpb25fXyA9IGRlc2M7XG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gSWdub3JlZCBtYXRjaGVyc1xuICB0bzoge1xuICAgIGFsaWFzZXM6IFsgJ2EnLCAnYW4nLCAnYmUnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0p1c3Qgc29tZSBzeW50YXggc3VnYXIgdG8gbWFrZSB0aGUgZXhwZWN0YXRpb25zIGVhc2llciBvbiB0aGUgZXllcy4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBtYXJrOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0luY3JlYXNlcyB0aGUgZ2xvYmFsIGBhc3MubWFya3NgIGNvdW50ZXIgZXZlcnkgdGltZSBpdCBnZXRzJyxcbiAgICAgICdldmFsdWF0ZWQgYXMgcGFydCBvZiBhbiBleHByZXNzaW9uLiBVc2UgaXQgdG8gdmVyaWZ5IHRoYXQgdGhlJyxcbiAgICAgICdwcmVjZWRpbmcgZXhwZWN0YXRpb25zIGFyZSBhY3R1YWxseSBiZWluZyBleGVjdXRlZC4nLFxuICAgICAgJ0FuIGVhc3kgd2F5IHRvIHN1cHBvcnQgdGhpcyB3aGVuIHVzaW5nIGEgdGVzdCBydW5uZXIgaXMgdG8gcmVzZXQnLFxuICAgICAgJ3RoZSBjb3VudGVyIGJ5IGNhbGxpbmcgYGFzcy5tYXJrcygpYCBvbiBhIGJlZm9yZUVhY2ggaG9vayBhbmQnLFxuICAgICAgJ3RoZW4gdmVyaWZ5IGF0IHRoZSBlbmQgb2YgdGVzdCB3aXRoIGBhc3MubWFya3MoTilgICh3aGVyZSBOIGlzJyxcbiAgICAgICd0aGUgbnVtYmVyIG9mIG1hcmtzIHlvdSBleHBlY3RlZCkuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBhc3MubWFya3MuY291bnRlciArPSAxO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIC8vIEp1c3QgYWxsb3cgYW55dGhpbmcgOilcbiAgYW55OiB7XG4gICAgaGVscDogJ0FsbG93cyBhbnkgdmFsdWUgd2l0aG91dCB0ZXN0aW5nIGl0LicsXG4gICAgZGVzYzogJ2lzIGFueXRoaW5nJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIC8vIEFueXRoaW5nIHRoYXQgaXNuJ3QgbnVsbCBvciB1bmRlZmluZWRcbiAgZGVmaW5lZDoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZC4nLFxuICAgIGRlc2M6ICdpcyBkZWZpbmVkJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gbnVsbCAhPSBhY3R1YWw7XG4gICAgfVxuICB9LFxuICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgZW1wdHlcbiAgZW1wdHk6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBlbXB0eSAob3IgaGFzIGEgbGVuZ3RoIG9mIDApLicsXG4gICAgZGVzYzogJ2lzIGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gbnVsbCA9PSBhY3R1YWwgfHwgYWN0dWFsLmxlbmd0aCA9PT0gMDtcbiAgICB9XG4gIH0sXG4gIG5lbXB0eToge1xuICAgIGFsaWFzZXM6IFsgJ25vbkVtcHR5JyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG5vdCBlbXB0eSAob3IgaGFzIGEgbGVuZ3RoIGdyZWF0ZXIgdGhhbiAwKS4nLFxuICAgIGRlc2M6ICdpcyBub3QgZW1wdHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBudWxsICE9IGFjdHVhbCAmJiBhY3R1YWwubGVuZ3RoID4gMDtcbiAgICB9XG4gIH0sXG4gIHRydXRoeToge1xuICAgIGFsaWFzZXM6IFsgJ3RydWlzaCcgXSxcbiAgICBoZWxwOiAnVGhlIHZhbHVlIHNob3VsZCBiZSB0cnV0aHkgKG5vdCB1bmRlZmluZWQsIG51bGwsIDAsIFwiXCIgb3IgW10pLicsXG4gICAgZGVzYzogJ2lzIHRydXRoeScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFhY3R1YWwpIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwubGVuZ3RoID4gMCA6IHRydWU7XG4gICAgfVxuICB9LFxuICBmYWxzeToge1xuICAgIGhlbHA6ICdUaGUgdmFsdWUgc2hvdWxkIGJlIGZhbHN5ICh1bmRlZmluZWQsIG51bGwsIDAsIFwiXCIgb3IgW10pLicsXG4gICAgZGVzYzogJ2lzIGZhbHN5JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFhY3R1YWwpIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwubGVuZ3RoID09PSAnbnVtYmVyJyA/IGFjdHVhbC5sZW5ndGggPT09IDAgOiBmYWxzZTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gTmVnYXRpb25cbiAgbm90OiB7XG4gICAgYWxpYXNlczogWyAnbm8nLCAnTk8nLCAnTk9UJyBdLFxuICAgIGhlbHA6ICdOZWdhdGVzIHRoZSByZXN1bHQgZm9yIHRoZSByZXN0IG9mIHRoZSBleHByZXNzaW9uLicsXG4gICAgZGVzYzogJ05vdCEnLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZXIuZmluYWxpemUoZnVuY3Rpb24gKGZpbmFsKSB7XG4gICAgICAgICAgcmV0dXJuICFmaW5hbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBpczoge1xuICAgIGFsaWFzZXM6IFsgJ2VxdWFsJywgJ2VxdWFscycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIHN0cmljdCBlcXVhbGl0eSBiZXR3ZWVuIHRoZSB2YWx1ZSBhbmQgaXRzIGV4cGVjdGVkLicsXG4gICAgICAnTm90ZTogaWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgY2hhaW4gZXhwcmVzc2lvbiBpdFxcJ2xsIGJlIHRlc3RlZCBpbnN0ZWFkLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBzdHJpY3RseSBlcXVhbCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIC8vIHRoaXMgaXMgYSBiaXQgY29udHJpdmVkIGJ1dCBpdCBtYWtlcyBmb3Igc29tZSBuaWNlIHN5bnRheCB0byBiZSBhYmxlIHRvXG4gICAgICAvLyB1c2UgLmlzIGZvciBwYXNzaW5nIGluIGV4cGVjdGF0aW9uc1xuICAgICAgaWYgKGFzcy5DaGFpbi5pc0NoYWluKGV4cGVjdGVkKSkge1xuICAgICAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWN0dWFsID09PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG4gIGVxOiB7XG4gICAgYWxpYXNlczogWyAnZXFsJywgJ2VxbHMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBkZWVwIG5vbi1zdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgICAgJ0l0IHVuZGVyc3RhbmRzIGFzcyBleHByZXNzaW9ucyBzbyB5b3UgY2FuIGNvbWJpbmUgdGhlbSBhdCB3aWxsIGluIHRoZScsXG4gICAgICAnZXhwZWN0ZWQgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGVxdWFsIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIF8uaXNFcXVhbChhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICB9XG4gIH0sXG5cbiAgbWF0Y2g6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnVHJpZXMgdG8gbWF0Y2ggdGhlIHN1YmplY3QgYWdhaW5zdCB0aGUgZXhwZWN0ZWQgdmFsdWUgd2hpY2ggY2FuIGJlIGVpdGhlcicsXG4gICAgICAnYSBmdW5jdGlvbiwgYW4gYXNzIGV4cHJlc3Npb24sIGFuIG9iamVjdCB3aXRoIGEgLnRlc3QoKSBmdW5jdGlvbiAoZm9yICcsXG4gICAgICAnaW5zdGFuY2UgYSBSZWdFeHApIG9yIGEgcGxhaW4gb2JqZWN0IHRvIHBhcnRpYWxseSBtYXRjaCBhZ2FpbnN0IHRoZSB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gbWF0Y2gge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG5cbiAgICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQudGVzdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gISFleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QoZXhwZWN0ZWQpIHx8IF8uaXNBcnJheShleHBlY3RlZCkgfHwgXy5pc0FyZ3VtZW50cyhleHBlY3RlZCkpIHtcblxuICAgICAgICBpZiAobnVsbCA9PSBhY3R1YWwpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdXBwb3J0IHBhc3NpbmcgYFssJ2ZvbyddYCB0byBtZWFuIGBbYXNzLmFueSwgJ2ZvbyddYFxuICAgICAgICBpZiAoXy5pc0FycmF5KGV4cGVjdGVkKSB8fCBfLmlzQXJndW1lbnRzKGV4cGVjdGVkKSkge1xuICAgICAgICAgIGV4cGVjdGVkID0gXy5tYXAoZXhwZWN0ZWQsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHYgPT09ICd1bmRlZmluZWQnID8gYXNzLmFueSA6IHY7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiBJZGVhbGx5IHdlIHNob3VsZCBcImZvcmtcIiB0aGUgcmVzb2x2ZXIgc28gd2UgY2FuIHN1cHBvcnRcbiAgICAgICAgLy8gICAgICAgYXN5bmMgdGVzdHMgYW5kIGFsc28gcHJvdmlkZSBiZXR0ZXIgZmFpbHVyZSBtZXNzYWdlcy5cbiAgICAgICAgLy8gICAgICAgVW5mb3J0dW5hdGVseSB0aGUgY3VycmVudCBmb3JraW5nIG1lY2hhbmlzbSBkb2Vzbid0IHdvcmtcbiAgICAgICAgLy8gICAgICAgZm9yIHRoaXMgdXNlIGNhc2Ugc2luY2Ugd2UgbmVlZCB0byBjcmVhdGUgbmV3IGNoYWlucyBmb3JcbiAgICAgICAgLy8gICAgICAgZWFjaCBleHBlY3RlZCBrZXkuXG4gICAgICAgIHZhciBmYWlsdXJlID0gdHJ1ZTtcbiAgICAgICAgXyhleHBlY3RlZCkuZXZlcnkoZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICBpZiAoIV8uaGFzKGFjdHVhbCwga2V5KSkge1xuICAgICAgICAgICAgZmFpbHVyZSA9ICdrZXkgXCInICsga2V5ICsgJ1wiIG5vdCBmb3VuZCBpbiB7e2FjdHVhbH19JztcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIV8uaXNFcXVhbChhY3R1YWxba2V5XSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBmYWlsdXJlID0gJ2tleSBcIicgKyBrZXkgKyAnXCIgZG9lcyBub3QgbWF0Y2gge3thY3R1YWxbXCInICsga2V5ICsgJ1wiXX19JztcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZhaWx1cmU7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICdleHBlY3RlZCBpcyBub3QgYSBmdW5jdGlvbiBhbmQgZG9lcyBub3QgaGF2ZSBhIC50ZXN0IG1ldGhvZCc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhIWV4cGVjdGVkKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlOiB7XG4gICAgYWxpYXNlczogWyAnZ3QnLCAnbW9yZVRoYW4nLCAnZ3JlYXRlclRoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPiBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3c6IHtcbiAgICBhbGlhc2VzOiBbICdsdCcsICdsZXNzVGhhbicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciB0aGEgaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIGxlc3MgdGhhbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPCBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYWJvdmVPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnbGVhc3QnLCAnYXRMZWFzdCcsICdndGUnLCAnbW9yZVRoYW5PckVxdWFsJywgJ2dyZWF0ZXJUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBoaWdoZXIgb3IgZXF1YWwgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbW9yZSB0aGFuIG9yIGVxdWFsIHRvICR7ZXhwZWN0ZWR9JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID49IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBiZWxvd09yRXF1YWw6IHtcbiAgICBhbGlhc2VzOiBbICdtb3N0JywgJ2F0TW9zdCcsICdsdGUnLCAnbGVzc1RoYW5PckVxdWFsJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGxvd2VyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDw9IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBjbG9zZToge1xuICAgIGFsaWFzZXM6IFsgJ2Nsb3NlVG8nIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgY2xvc2UgdG8gdGhlIGV4cGVjdGVkIGJhc2VkIG9uIGEgZ2l2ZW4gZGVsdGEuJyxcbiAgICAgICdUaGUgZGVmYXVsdCBkZWx0YSBpcyAwLjEgc28gdGhlIHZhbHVlIDMuNTUgaXMgY2xvc2UgdG8gYW55IHZhbHVlIGJldHdlZW4nLFxuICAgICAgJzMuNDUgYW5kIDMuNjUgKGJvdGggaW5jbHVzaXZlKS4nLFxuICAgICAgJ1N0cmluZyB2YWx1ZXMgYXJlIGFsc28gc3VwcG9ydGVkIGJ5IGNvbXB1dGluZyB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGVtJyxcbiAgICAgICd1c2luZyB0aGUgU2lmdDQgYWxnb3JpdGhtLiBGb3Igc3RyaW5nIHZhbHVlcyB0aGUgZGVsdGEgaXMgaW50ZXJwcmV0ZWQgYXMnLFxuICAgICAgJ2EgcGVyY2VudGFnZSAoaWU6IDAuMjUgaXMgMjUlKS4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgY2xvc2UgdG8ge3sgZXhwZWN0ZWQgfX0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgZGVsdGEpIHtcbiAgICAgIGRlbHRhID0gbnVsbCA9PSBkZWx0YSA/IDAuMSA6IGRlbHRhO1xuXG4gICAgICAvLyBTdXBwb3J0IHN0cmluZ3MgYnkgY29tcHV0aW5nIHRoZWlyIGRpc3RhbmNlXG4gICAgICBpZiAoXy5pc1N0cmluZyhhY3R1YWwpICYmIF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHZhciBkaWZmID0gdXRpbC5zaWZ0NChhY3R1YWwsIGV4cGVjdGVkLCAzKSAvIE1hdGgubWF4KGFjdHVhbC5sZW5ndGgsIGV4cGVjdGVkLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiBkaWZmIDw9IGRlbHRhO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWN0dWFsID49IGV4cGVjdGVkIC0gZGVsdGEgJiYgYWN0dWFsIDw9IGV4cGVjdGVkICsgZGVsdGE7XG4gICAgfVxuICB9LFxuXG4gIGluc3RhbmNlb2Y6IHtcbiAgICBhbGlhc2VzOiBbICdpbnN0YW5jZU9mJywgJ2luc3RhbmNlJywgJ2lzYScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gY29uc3RydWN0b3IuJyxcbiAgICAgICdXaGVuIHRoZSBleHBlY3RlZCBpcyBhIHN0cmluZyBpdFxcJ2xsIGFjdHVhbGx5IHVzZSBhIGB0eXBlb2ZgJyxcbiAgICAgICdjb21wYXJpc29uLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhbiBpbnN0YW5jZSBvZiB7e2V4cGVjdGVkfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwgPT09IGV4cGVjdGVkID8gdHJ1ZSA6ICdoYWQgdHlwZSB7eyB0eXBlb2YgYWN0dWFsIH19JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgdHlwZW9mOiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgb2YgYSBzcGVjaWZpYyB0eXBlJyxcbiAgICBkZXNjOiAndG8gaGF2ZSB0eXBlIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ2hhZCAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gXy5pc0VxdWFsKHR5cGVvZiBhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICB9XG4gIH0sXG4gIG51bWJlcjoge1xuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBudW1iZXIgKGRpZmZlcmVudCBvZiBOYU4pLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgbnVtYmVyJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc051bWJlcihhY3R1YWwpICYmICFpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgYm9vbDoge1xuICAgIGFsaWFzZXM6IFsgJ2Jvb2xlYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIGJvb2xlYW4uJyxcbiAgICBkZXNjOiAndG8gYmUgYSBib29sZWFuJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Jvb2xlYW4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHN0cmluZzoge1xuICAgIGFsaWFzZXM6IFsgJ3N0cicgXSxcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgc3RyaW5nLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgc3RyaW5nJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1N0cmluZyhhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgb2JqZWN0OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgb2YgdHlwZSBvYmplY3QuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gb2JqZWN0JyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc09iamVjdChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgcGxhaW5PYmplY3Q6IHtcbiAgICBhbGlhc2VzOiBbICdwbGFpbicsICdvYmonIF0sXG4gICAgaGVscDogJ0NoZWNrcyB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZSBPYmplY3QgY29uc3RydWN0b3IuJyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNQbGFpbk9iamVjdChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgYXJyYXk6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBBcnJheS4nLFxuICAgIGRlc2M6ICd0byBiZSBhbiBBcnJheScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNBcnJheShhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZnVuY3Rpb246IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIEZ1bmN0aW9uLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgRnVuY3Rpb24nLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRnVuY3Rpb24oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHJlZ2V4cDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgUmVnRXhwJyxcbiAgICBkZXNjOiAndG8gYmUgYSBSZWdFeHAnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUmVnRXhwKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBkYXRlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBEYXRlJyxcbiAgICBkZXNjOiAndG8gYmUgYSBEYXRlJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0RhdGUoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGVsZW1lbnQ6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIERPTSBlbGVtZW50JyxcbiAgICBkZXNjOiAndG8gYmUgYSBET00gZWxlbWVudCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNFbGVtZW50KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBlcnJvcjoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGFuIGVycm9yIChvciBsb29rcyBsaWtlIGl0KScsXG4gICAgZGVzYzogJ3RvIGJlIGFuIEVycm9yJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoYWN0dWFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gXy5pc09iamVjdChhY3R1YWwpICYmIF8uaXNTdHJpbmcoYWN0dWFsLm5hbWUpICYmIF8uaXNTdHJpbmcoYWN0dWFsLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSxcblxuICB1bmRlZmluZWQ6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyB1bmRlZmluZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgdW5kZWZpbmVkJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1VuZGVmaW5lZChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgbnVsbDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIG51bGwuJyxcbiAgICBkZXNjOiAndG8gYmUgbnVsbCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA9PT0gbnVsbDtcbiAgICB9XG4gIH0sXG4gIE5hTjoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIE5hTi4nLFxuICAgIGRlc2M6ICd0byBiZSBOYU4nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzTnVtYmVyKGFjdHVhbCkpIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ3dhcyAke2FjdHVhbH0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGlzTmFOKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICB0cnVlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgdHJ1ZScsXG4gICAgZGVzYzogJ3RvIGJlIHRydWUnLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gYWN0dWFsID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZmFsc2U6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBmYWxzZScsXG4gICAgZGVzYzogJ3RvIGJlIGZhbHNlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gIWFjdHVhbCA/IHRydWUgOiAnd2FzIHt7YWN0dWFsfX0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgcmFpc2VzOiB7XG4gICAgYWxpYXNlczogWyAndGhyb3dzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgdGhhdCBleGVjdXRpbmcgdGhlIHZhbHVlIHJlc3VsdHMgaW4gYW4gZXhjZXB0aW9uIGJlaW5nIHRocm93bi4nLFxuICAgICAgJ1RoZSBjYXB0dXJlZCBleGNlcHRpb24gdmFsdWUgaXMgdXNlZCB0byBtdXRhdGUgdGhlIHN1YmplY3QgZm9yIHRoZScsXG4gICAgICAnZm9sbG93aW5nIGV4cGVjdGF0aW9ucy4nXG4gICAgXSxcbiAgICBkZXNjOiAndGhyb3dzIGFuIGVycm9yJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFfLmlzRnVuY3Rpb24oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIGZ1bmN0aW9uOiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgYWN0dWFsKCk7XG4gICAgICAgIHJldHVybiAnZGlkIG5vdCB0aHJvdyBhbnl0aGluZyc7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmIChudWxsID09IGV4cGVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24oZXhwZWN0ZWQpICYmIGUgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXy5pc0VxdWFsKGUsIGV4cGVjdGVkKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF1Z21lbnQgdGhlIGV4cGVjdGF0aW9uIG9iamVjdCB3aXRoIGEgbmV3IHRlbXBsYXRlIHZhcmlhYmxlXG4gICAgICAgIHRoaXMuZXhjZXB0aW9uID0gZTtcbiAgICAgICAgcmV0dXJuICdnb3Qge3sgZXhjZXB0aW9uIH19JztcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgaGFzOiB7XG4gICAgYWxpYXNlczogWyAnaGF2ZScsICdjb250YWluJywgJ2NvbnRhaW5zJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVjayBpZiB0aGUgdmFsdWUgaGFzIHNvbWUgZXhwZWN0ZWQgdmFsdWUuIEl0IHVuZGVyc3RhbmRzIGV4cGVjdGVkJyxcbiAgICAgICdjaGFpbiBleHByZXNzaW9ucyBzbyB0aGlzIHNlcnZlcyBhcyB0aGUgZXF1aXZhbGVudCBvZiAuZXEgZm9yIHBhcnRpYWwnLFxuICAgICAgJ21hdGNoZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGNvbnRhaW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGFyZzEgLyosIC4uLiAqLykge1xuXG4gICAgICAvLyBhbGxvdyBtdWx0aXBsZSBleHBlY3RlZCB2YWx1ZXNcbiAgICAgIHZhciBleHBlY3RlZCA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkLmxlbmd0aCA9PT0gMSA/IGV4cGVjdGVkWzBdIDogZXhwZWN0ZWQ7XG5cbiAgICAgIGlmICghXy5pc1N0cmluZyhhY3R1YWwpICYmICFfLmlzQXJyYXkoYWN0dWFsKSAmJiAhXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnZ290IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gXy5ldmVyeShleHBlY3RlZCwgZnVuY3Rpb24gKGV4cGVjdGVkKSB7XG4gICAgICAgIGlmIChfLmlzU3RyaW5nKGFjdHVhbCkgJiYgXy5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICAgICAgICByZXR1cm4gLTEgIT09IGFjdHVhbC5pbmRleE9mKGV4cGVjdGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLmlzQXJyYXkoYWN0dWFsKSkge1xuICAgICAgICAgIC8vIFRPRE86IElzbid0IHRoZXJlIGFuIGVhc2llciB3YXkgdG8gdGVzdCB0aGlzIHVzaW5nIGxvZGFzaCBvbmx5P1xuICAgICAgICAgIGlmICghYXNzLkNoYWluLmlzQ2hhaW4oZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgICBleHBlY3RlZCA9IGFzcy5lcShleHBlY3RlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAtMSAhPT0gXy5maW5kSW5kZXgoYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYWNrOiBDb21wYXJlIG9iamVjdHMgd2l0aCAud2hlcmUgYnkgZmlsdGVyaW5nIGEgd3JhcHBlciBhcnJheVxuICAgICAgICByZXR1cm4gMSA9PT0gXy53aGVyZShbYWN0dWFsXSwgZXhwZWN0ZWQpLmxlbmd0aDtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcbiAgaGFzT3duOiB7XG4gICAgYWxpYXNlczogWyAnaGFzS2V5JywgJ2hhc0luZGV4JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVjayBpZiB0aGUgdmFsdWUgaGFzIG9uZSBvciBtb3JlIG93biBwcm9wZXJ0aWVzIGFzIGRlZmluZWQgYnknLFxuICAgICAgJ3RoZSBnaXZlbiBhcmd1bWVudHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGhhdmUgb3duIHByb3BlcnR5ICR7IGV4cGVjdGVkIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ3dhcyB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgdGhpcy5mYWlsID0gJ29ubHkgaGFkIHt7IF8ua2V5cyhhY3R1YWwpIH19JztcblxuICAgICAgLy8gVE9ETzogT2ZmZXIgYmV0dGVyIGZhaWx1cmUgbWVzc2FnZVxuICAgICAgdmFyIGFyZ3MgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KGFyZ3MsIGZ1bmN0aW9uICh4KSB7IHJldHVybiBfLmhhcyhhY3R1YWwsIHgpOyB9KTtcbiAgICB9XG4gIH0sXG5cbiAgbG9nOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0R1bXBzIHRoZSByZWNlaXZlZCB2YWx1ZSB0byB0aGUgY29uc29sZS4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbQVNTXScsIGFjdHVhbCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGR1bXA6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRHVtcHMgdGhlIHJlY2VpdmVkIHZhbHVlIHRvIHRoZSBjb25zb2xlIGFwcGx5aW5nIHRoZSBnaXZlbiB0ZW1wbGF0ZS4nLFxuICAgICAgJ05vdGU6IFVzZSAke3RoaXN9IHRvIGludGVycG9sYXRlIHRoZSB3aG9sZSB2YWx1ZS4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjdGVtcGxhdGUnXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHRwbCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHV0aWwudGVtcGxhdGUuY2FsbChhY3R1YWwsIHRwbCwgYWN0dWFsKTtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGRlYnVnZ2VyOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0hhbHRzIHNjcmlwdCBleGVjdXRpb24gYnkgdHJpZ2dlcmluZyB0aGUgaW50ZXJhY3RpdmUgZGVidWdnZXIuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICB0YXA6IHtcbiAgICBhbGlhc2VzOiBbICdmbicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2FsbHMgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uIHdpdGggdGhlIGN1cnJlbnQgdmFsdWUgYXMgYXJndW1lbnQuJyxcbiAgICAgICdJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyBzb21ldGhpbmcgZGlmZmVyZW50IHRvICp1bmRlZmluZWQqIHRoZScsXG4gICAgICAnZXhwcmVzc2lvbiB3aWxsIGZvcmsgdG8gb3BlcmF0ZSBvbiB0aGUgcmV0dXJuZWQgdmFsdWUuJyxcbiAgICBdLFxuICAgIGRlc2M6ICdjYWxsIHt7YXJnMX19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBmbikge1xuICAgICAgdmFyIHJlc3VsdCA9IGZuKGFjdHVhbCk7XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKHJlc3VsdCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIG5vdGlmeToge1xuICAgIGhlbHA6IFtcbiAgICAgICdTaW1pbGFyIHRvIC50YXAoKSBidXQgaXQgd29uXFwndCBwYXNzIHRoZSBjdXJyZW50IHZhbHVlIGFzIGFyZ3VtZW50LCcsXG4gICAgICAnaW5zdGVhZCBpdCB3aWxsIGJlIHByb3ZpZGVkIGFzIHRoZSBgdGhpc2AgY29udGV4dCB3aGVuIHBlcmZvcm1pbmcgdGhlJyxcbiAgICAgICdjYWxsLiBUaGlzIGFsbG93cyBpdCB0byBiZSB1c2VkIHdpdGggdGVzdCBydW5uZXJzIGBkb25lYCBzdHlsZSBjYWxsYmFja3MuJyxcbiAgICAgICdOb3RlIHRoYXQgaXQgd2lsbCBuZWl0aGVyIG11dGF0ZSB0aGUgdmFsdWUgZXZlbiBpZiBpdCByZXR1cm5zIHNvbWV0aGluZy4nXG4gICAgXSxcbiAgICBkZXNjOiAnbm90aWZ5IHt7YXJnMX19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBmbikge1xuICAgICAgZm4uY2FsbChhY3R1YWwpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIHNpemU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gdGhlIHNpemUgb2YgdGhlIGN1cnJlbnQgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBzaXplJyxcbiAgICBmYWlsOiAnbm90IGhhcyBhIGxlbmd0aDoge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpIHx8IF8uaXNBcnJheShhY3R1YWwpIHx8IF8uaXNTdHJpbmcoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXy5zaXplKGFjdHVhbCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LFxuICBwcm9wOiB7XG4gICAgYWxpYXNlczogWyAna2V5JywgJ3Byb3BlcnR5JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIHZhbHVlIHByb3BlcnRpZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBwcm9wZXJ0eSB7eyBhcmcxIH19JyxcbiAgICBmYWlsOiAnd2FzIG5vdCBmb3VuZCBvbiB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGtleSkge1xuICAgICAgaWYgKF8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICBpZiAoa2V5IGluIGFjdHVhbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShhY3R1YWxba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmtleXMgPSBbXTtcbiAgICAgICAgXy5mb3JJbihhY3R1YWwsIGZ1bmN0aW9uICh2LCBrKSB7IHRoaXMua2V5cy5wdXNoKGspOyB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuICd3YXMgbm90IGZvdW5kIGluIGtleXMge3sga2V5cyB9fSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ2dvdCB7e2FjdHVhbH19JztcbiAgICB9XG4gIH0sXG4gIGF0OiB7XG4gICAgYWxpYXNlczogWyAnaW5kZXgnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIG9wZXJhdGUgb24gb25lIG9mIHRoZSBpbmRleGVkIGVsZW1lbnRzLiBJZicsXG4gICAgICAnbXVsdGlwbGUgaW5kZXhlcyBhcmUgcHJvdmlkZWQgYW4gYXJyYXkgaXMgY29tcG9zZWQgd2l0aCB0aGVtLicsXG4gICAgICAnTm90ZTogSXQgc3VwcG9ydHMgbmVnYXRpdmUgaW5kZXhlcydcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgaW5kZXggJHsgYXJncy5qb2luKFwiLCBcIikgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgaW5kZXgpIHtcbiAgICAgIGlmICghXy5pc0FycmF5KGFjdHVhbCkgJiYgIV8uaXNTdHJpbmcoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ25vdCBhbiBhcnJheSBvciBhIHN0cmluZzogJHthY3R1YWx9JztcbiAgICAgIH1cblxuICAgICAgdmFyIGluZGV4ZXMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHZhciBlbGVtcyA9IFtdO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGV4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGlkeCA9IGluZGV4ZXNbaV07XG5cbiAgICAgICAgaWR4ID0gaWR4IDwgMCA/IGFjdHVhbC5sZW5ndGggKyBpZHggOiBpZHg7XG4gICAgICAgIGlmIChpZHggPCAwIHx8IGlkeCA+PSBhY3R1YWwubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIGlkeCArICcgb3V0IG9mIGJvdW5kcyBmb3Ige3thY3R1YWx9fSc7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtcy5wdXNoKGFjdHVhbFtpZHhdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBlbGVtcy5sZW5ndGggPT09IDEgPyBlbGVtc1swXSA6IGVsZW1zXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBrZXlzOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIG9wZXJhdGUgb24gaXRzIGxpc3Qgb2Ygb3duIGtleXMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBrZXlzJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ua2V5cyhhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgdmFsdWVzOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIG9wZXJhdGUgb24gaXRzIGxpc3Qgb2YgdmFsdWVzJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCB2YWx1ZXMnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy52YWx1ZXMoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc2xpY2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRXh0cmFjdHMgYSBwb3J0aW9uIGZyb20gdGhlIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdzbGljZSh7e2FjdHVhbH19LCAke2FyZzEgfHwgMH0pJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBzdGFydCwgZW5kKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8udG9BcnJheShhY3R1YWwpLnNsaWNlKHN0YXJ0LCBlbmQpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBmaWx0ZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiB0aGUgY29sbGVjdGlvbiwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8nLFxuICAgICAgJ29wZXJhdGUgb24gYW4gYXJyYXkgd2l0aCBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCB0aGUgY2FsbGJhY2sgcmV0dXJuZWQnLFxuICAgICAgJ3RydXRoeSBmb3IuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ZpbHRlcidcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uZmlsdGVyKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgcmVqZWN0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ0l0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgY29sbGVjdGlvbiwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZScsXG4gICAgICAnb24gYW4gYXJyYXkgd2l0aCBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCB0aGUgY2FsbGJhY2sgcmV0dXJuZWQgZmFsc3knLFxuICAgICAgJ2ZvciAodGhlIG9wcG9zaXRlIG9mIC5maWx0ZXIpLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNyZWplY3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnJlamVjdChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgd2hlcmU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnUGVyZm9ybXMgYSBkZWVwIGNvbXBhcmlzb24gb2YgZWFjaCBlbGVtZW50IGluIGEgY29sbGVjdGlvbiB0byB0aGUgZ2l2ZW4nLFxuICAgICAgJ3Byb3BlcnRpZXMgb2JqZWN0LCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIGFuIGFycmF5IG9mIGFsbCcsXG4gICAgICAnZWxlbWVudHMgdGhhdCBoYXZlIGVxdWl2YWxlbnQgcHJvcGVydHkgdmFsdWVzLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyN3aGVyZSdcbiAgICBdLFxuICAgIGRlc2M6ICd3aGVyZSB7e2FyZzF9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgcHJvcHMpIHtcbiAgICAgIGlmICghXy5pc1BsYWluT2JqZWN0KHByb3BzKSkge1xuICAgICAgICByZXR1cm4gJ3Byb3BzIGlzIG5vdCBhbiBvYmplY3QnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLndoZXJlKGFjdHVhbCwgcHJvcHMpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBtYXA6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIGNhbGxiYWNrIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWFwJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5tYXAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1ldGhvZDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiB0aGUgcmVzdWx0IG9mIGludm9raW5nIHRoZSBuYW1lZCcsXG4gICAgICAnbWV0aG9kIG9uIHRoZSBzdWJqZWN0IHZhbHVlLicsXG4gICAgXSxcbiAgICBkZXNjOiBcIm1ldGhvZCAuJHthcmcxfSgpXCIsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgbWV0aG9kLCBhcmcpIHtcbiAgICAgIGlmICh0eXBlb2YgYWN0dWFsW21ldGhvZF0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICcke2FyZzF9IGlzIG5vdCBhIG1ldGhvZCBpbiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgdmFyIGFyZ3MgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgyKTtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgYWN0dWFsW21ldGhvZF0uYXBwbHkoYWN0dWFsLCBhcmdzKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgaW52b2tlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIGFuIGFycmF5IGhvbGRpbmcgdGhlIHJlc3VsdHMgb2YnLFxuICAgICAgJ2ludm9raW5nIHRoZSBtZXRob2QgbmFtZWQgYnkgdGhlIGFyZ3VtZW50IGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlJyxcbiAgICAgICdjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ludm9rZSdcbiAgICBdLFxuICAgIGRlc2M6IFwiaW52b2tlIC4ke2FyZzF9KClcIixcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBtZXRob2QsIGFyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmludm9rZS5hcHBseShfLCBhcmd1bWVudHMpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBwbHVjazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBiZSB0aGUgb25lIG9mIHRoZSBzcGVjaWZpYyBwcm9wZXJ0eSBmb3IgYWxsIGVsZW1lbnRzJyxcbiAgICAgICdpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNwbHVjaydcbiAgICBdLFxuICAgIGRlc2M6ICdwbHVjaygge3thcmcxfX0gKScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgcHJvcCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnBsdWNrKGFjdHVhbCwgcHJvcClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGZpcnN0OiB7XG4gICAgYWxpYXNlczogWyAnaGVhZCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnVE9ETycsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNmaXJzdCdcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgZmlyc3QgZWxlbWVudCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmhlYWQoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIGxhc3Q6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnVE9ETycsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNsYXN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmxhc3QoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHJlc3Q6IHtcbiAgICBhbGlhc2VzOiBbICd0YWlsJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3Jlc3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8udGFpbChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBtaW46IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgc3ViamVjdCB0byBiZSB0aGUgbWluaW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWluJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1pbihhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgbWF4OiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHN1YmplY3QgdG8gYmUgdGhlIG1heGltdW0gdmFsdWUgZm91bmQgb24gdGhlIGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI21heCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5tYXgoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc29ydDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBiZSBzb3J0ZWQgaW4gYXNjZW5kaW5nIG9yZGVyLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNzb3J0QnknXG4gICAgXSxcbiAgICBkZXNjOiAnc29ydCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIC8vIEFsbG93IHRoZSB1c2Ugb2YgZXhwcmVzc2lvbnMgYXMgY2FsbGJhY2tzXG4gICAgICBpZiAoY2FsbGJhY2sgaW5zdGFuY2VvZiBhc3MuQ2hhaW4pIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjay5yZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5zb3J0QnkoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHN0b3JlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0hlbHBlciB0byBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCB2YWx1ZSBiZWluZyBldmFsdWF0ZWQgaW4gdGhlJyxcbiAgICAgICdleHByZXNzaW9uIGluIHNvbWUgb3RoZXIgb2JqZWN0LiBJdCBleHBlY3RzIGEgdGFyZ2V0IG9iamVjdCBhbmQgb3B0aW9uYWxseScsXG4gICAgICAndGhlIG5hbWUgb2YgYSBwcm9wZXJ0eS4gSWYgdGFyZ2V0IGlzIGEgZnVuY3Rpb24gaXRcXCdsbCByZWNlaXZlIHRoZSB2YWx1ZScsXG4gICAgICAndXNpbmcgYHByb3BgIGFzIHRoaXMgY29udGV4dC4gSWYgYHByb3BgIGlzIG5vdCBwcm92aWRlZCBhbmQgYHRhcmdldGAgaXMgYW4nLFxuICAgICAgJ2FycmF5IHRoZSB2YWx1ZSB3aWxsIGJlIHB1c2hlZCB0byBpdC4nXG4gICAgXSxcbiAgICBkZXNjOiAnc3RvcmUnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHRhcmdldCwgcHJvcCkge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbih0YXJnZXQpKSB7XG4gICAgICAgIHRhcmdldC5jYWxsKHByb3AsIGFjdHVhbCk7XG4gICAgICB9IGVsc2UgaWYgKHByb3AgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoXy5pc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICB0YXJnZXQucHVzaChhY3R1YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAncHJvcCB1bmRlZmluZWQgYW5kIHRhcmdldCBpcyBub3QgYW4gYXJyYXkgb3IgYSBmdW5jdGlvbjoge3thcmcxfX0nO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKF8uaXNPYmplY3QodGFyZ2V0KSkge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSBhY3R1YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ3RhcmdldCBpcyBub3QgYW4gb2JqZWN0OiB7e2FyZzF9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG59KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbXhwWWk5dFlYUmphR1Z5Y3k5amIzSmxMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SjJZWElnWHlBOUlDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzV3lkZkoxMGdPaUIwZVhCbGIyWWdaMnh2WW1Gc0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdaMnh2WW1Gc1d5ZGZKMTBnT2lCdWRXeHNLVHRjYmx4dWRtRnlJR0Z6Y3lBOUlISmxjWFZwY21Vb0p5NHVMMkZ6Y3ljcE8xeHVkbUZ5SUhWMGFXd2dQU0J5WlhGMWFYSmxLQ2N1TGk5MWRHbHNKeWs3WEc1Y2JpOHZJRk5sZENCdlppQmtaV1poZFd4MElHMWhkR05vWlhKelhHNWhjM011Y21WbmFYTjBaWElvZTF4dUlDQXZMeUJVVDBSUE9pQk5iM1psSUhSb2FYTWdkRzhnZEdobElFTm9ZV2x1SUhCeWIzUnZkSGx3WlZ4dUlDQmtaWE5qT2lCN1hHNGdJQ0FnYUdWc2NEb2dKMUJ5YjNacFpHVWdZU0JqZFhOMGIyMGdaR1Z6WTNKcGNIUnBiMjRnWm05eUlISmxjRzl5ZEdWa0lHWmhhV3gxY21Wekp5eGNiaUFnSUNCa1pYTmpPaUJ1ZFd4c0xDQWdMeThnVTJ0cGNDQnBkQ0JtY205dElISmxjRzl5ZEhOY2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmtaWE5qS1NCN1hHNGdJQ0FnSUNBdkx5Qk9iM1JsSUhSb1lYUWdkR2hsSUdSbGMyTnlhWEIwYVc5dUlIZHZiaWQwSUdKbElITmxkQ0IxYm5ScGJDQjBhR1VnWTJoaGFXNGdhWE1nY21WemIyeDJaV1FzWEc0Z0lDQWdJQ0F2THlCaGRDQnNaV0Z6ZENCdmJtTmxMQ0J5WldGamFHbHVaeUIwYUdseklHVjRjR1ZqZEdGMGFXOXVMbHh1SUNBZ0lDQWdjbVYwZFhKdUlHWjFibU4wYVc5dUlDaHlaWE52YkhabGNpa2dlMXh1SUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTVqYUdGcGJpNWZYMlJsYzJOeWFYQjBhVzl1WDE4Z1BTQmtaWE5qTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnY21WemIyeDJaWElvWVdOMGRXRnNLVHRjYmlBZ0lDQWdJSDA3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUM4dklFbG5ibTl5WldRZ2JXRjBZMmhsY25OY2JpQWdkRzg2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkaEp5d2dKMkZ1Snl3Z0oySmxKeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEtkWE4wSUhOdmJXVWdjM2x1ZEdGNElITjFaMkZ5SUhSdklHMWhhMlVnZEdobElHVjRjR1ZqZEdGMGFXOXVjeUJsWVhOcFpYSWdiMjRnZEdobElHVjVaWE11SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ2JuVnNiQ3hjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdiV0Z5YXpvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RKYm1OeVpXRnpaWE1nZEdobElHZHNiMkpoYkNCZ1lYTnpMbTFoY210ellDQmpiM1Z1ZEdWeUlHVjJaWEo1SUhScGJXVWdhWFFnWjJWMGN5Y3NYRzRnSUNBZ0lDQW5aWFpoYkhWaGRHVmtJR0Z6SUhCaGNuUWdiMllnWVc0Z1pYaHdjbVZ6YzJsdmJpNGdWWE5sSUdsMElIUnZJSFpsY21sbWVTQjBhR0YwSUhSb1pTY3NYRzRnSUNBZ0lDQW5jSEpsWTJWa2FXNW5JR1Y0Y0dWamRHRjBhVzl1Y3lCaGNtVWdZV04wZFdGc2JIa2dZbVZwYm1jZ1pYaGxZM1YwWldRdUp5eGNiaUFnSUNBZ0lDZEJiaUJsWVhONUlIZGhlU0IwYnlCemRYQndiM0owSUhSb2FYTWdkMmhsYmlCMWMybHVaeUJoSUhSbGMzUWdjblZ1Ym1WeUlHbHpJSFJ2SUhKbGMyVjBKeXhjYmlBZ0lDQWdJQ2QwYUdVZ1kyOTFiblJsY2lCaWVTQmpZV3hzYVc1bklHQmhjM011YldGeWEzTW9LV0FnYjI0Z1lTQmlaV1p2Y21WRllXTm9JR2h2YjJzZ1lXNWtKeXhjYmlBZ0lDQWdJQ2QwYUdWdUlIWmxjbWxtZVNCaGRDQjBhR1VnWlc1a0lHOW1JSFJsYzNRZ2QybDBhQ0JnWVhOekxtMWhjbXR6S0U0cFlDQW9kMmhsY21VZ1RpQnBjeWNzWEc0Z0lDQWdJQ0FuZEdobElHNTFiV0psY2lCdlppQnRZWEpyY3lCNWIzVWdaWGh3WldOMFpXUXBMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUc1MWJHd3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnWVhOekxtMWhjbXR6TG1OdmRXNTBaWElnS3owZ01UdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0F2THlCS2RYTjBJR0ZzYkc5M0lHRnVlWFJvYVc1bklEb3BYRzRnSUdGdWVUb2dlMXh1SUNBZ0lHaGxiSEE2SUNkQmJHeHZkM01nWVc1NUlIWmhiSFZsSUhkcGRHaHZkWFFnZEdWemRHbHVaeUJwZEM0bkxGeHVJQ0FnSUdSbGMyTTZJQ2RwY3lCaGJubDBhR2x1Wnljc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0F2THlCQmJubDBhR2x1WnlCMGFHRjBJR2x6YmlkMElHNTFiR3dnYjNJZ2RXNWtaV1pwYm1Wa1hHNGdJR1JsWm1sdVpXUTZJSHRjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnR6SUdsbUlIUm9aU0IyWVd4MVpTQnBjeUJ1YjNRZ2JuVnNiQ0J2Y2lCMWJtUmxabWx1WldRdUp5eGNiaUFnSUNCa1pYTmpPaUFuYVhNZ1pHVm1hVzVsWkNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lBa2V5QmhZM1IxWVd3Z2ZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRzUxYkd3Z0lUMGdZV04wZFdGc08xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ0x5OGdRMmhsWTJzZ2FXWWdkR2hsSUhaaGJIVmxJR2x6SUdWdGNIUjVYRzRnSUdWdGNIUjVPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05yY3lCcFppQjBhR1VnZG1Gc2RXVWdhWE1nWlcxd2RIa2dLRzl5SUdoaGN5QmhJR3hsYm1kMGFDQnZaaUF3S1M0bkxGeHVJQ0FnSUdSbGMyTTZJQ2RwY3lCbGJYQjBlU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUFrZXlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3dnUFQwZ1lXTjBkV0ZzSUh4OElHRmpkSFZoYkM1c1pXNW5kR2dnUFQwOUlEQTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnVaVzF3ZEhrNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZHViMjVGYlhCMGVTY2dYU3hjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnR6SUdsbUlIUm9aU0IyWVd4MVpTQnBjeUJ1YjNRZ1pXMXdkSGtnS0c5eUlHaGhjeUJoSUd4bGJtZDBhQ0JuY21WaGRHVnlJSFJvWVc0Z01Da3VKeXhjYmlBZ0lDQmtaWE5qT2lBbmFYTWdibTkwSUdWdGNIUjVKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJQ1I3SUdGamRIVmhiQ0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2JuVnNiQ0FoUFNCaFkzUjFZV3dnSmlZZ1lXTjBkV0ZzTG14bGJtZDBhQ0ErSURBN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCMGNuVjBhSGs2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkMGNuVnBjMmduSUYwc1hHNGdJQ0FnYUdWc2NEb2dKMVJvWlNCMllXeDFaU0J6YUc5MWJHUWdZbVVnZEhKMWRHaDVJQ2h1YjNRZ2RXNWtaV1pwYm1Wa0xDQnVkV3hzTENBd0xDQmNJbHdpSUc5eUlGdGRLUzRuTEZ4dUlDQWdJR1JsYzJNNklDZHBjeUIwY25WMGFIa25MRnh1SUNBZ0lHWmhhV3c2SUNkM1lYTWdKSHNnWVdOMGRXRnNJSDBuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lHbG1JQ2doWVdOMGRXRnNLU0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEhsd1pXOW1JR0ZqZEhWaGJDNXNaVzVuZEdnZ1BUMDlJQ2R1ZFcxaVpYSW5JRDhnWVdOMGRXRnNMbXhsYm1kMGFDQStJREFnT2lCMGNuVmxPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdabUZzYzNrNklIdGNiaUFnSUNCb1pXeHdPaUFuVkdobElIWmhiSFZsSUhOb2IzVnNaQ0JpWlNCbVlXeHplU0FvZFc1a1pXWnBibVZrTENCdWRXeHNMQ0F3TENCY0lsd2lJRzl5SUZ0ZEtTNG5MRnh1SUNBZ0lHUmxjMk02SUNkcGN5Qm1ZV3h6ZVNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lCN2V5QmhZM1IxWVd3Z2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUdsbUlDZ2hZV04wZFdGc0tTQnlaWFIxY200Z2RISjFaVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBlWEJsYjJZZ1lXTjBkV0ZzTG14bGJtZDBhQ0E5UFQwZ0oyNTFiV0psY2ljZ1B5QmhZM1IxWVd3dWJHVnVaM1JvSUQwOVBTQXdJRG9nWm1Gc2MyVTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJQzh2SUU1bFoyRjBhVzl1WEc0Z0lHNXZkRG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjI1dkp5d2dKMDVQSnl3Z0owNVBWQ2NnWFN4Y2JpQWdJQ0JvWld4d09pQW5UbVZuWVhSbGN5QjBhR1VnY21WemRXeDBJR1p2Y2lCMGFHVWdjbVZ6ZENCdlppQjBhR1VnWlhod2NtVnpjMmx2Ymk0bkxGeHVJQ0FnSUdSbGMyTTZJQ2RPYjNRaEp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdJR0ZqZEhWaGJDQjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNoeVpYTnZiSFpsY2lrZ2UxeHVYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTnZiSFpsY2k1bGVHaGhkWE4wWldRcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbVpwYm1Gc2FYcGxLR1oxYm1OMGFXOXVJQ2htYVc1aGJDa2dlMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUFoWm1sdVlXdzdYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCeVpYTnZiSFpsY2loaFkzUjFZV3dwTzF4dUlDQWdJQ0FnZlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2FYTTZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RsY1hWaGJDY3NJQ2RsY1hWaGJITW5JRjBzWEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owTm9aV05yY3lCemRISnBZM1FnWlhGMVlXeHBkSGtnWW1WMGQyVmxiaUIwYUdVZ2RtRnNkV1VnWVc1a0lHbDBjeUJsZUhCbFkzUmxaQzRuTEZ4dUlDQWdJQ0FnSjA1dmRHVTZJR2xtSUhSb1pTQmxlSEJsWTNSbFpDQjJZV3gxWlNCcGN5QmhJR05vWVdsdUlHVjRjSEpsYzNOcGIyNGdhWFJjWENkc2JDQmlaU0IwWlhOMFpXUWdhVzV6ZEdWaFpDNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZEc4Z2MzUnlhV04wYkhrZ1pYRjFZV3dnZTN0bGVIQmxZM1JsWkgxOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdZV04wZFdGc2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdWNGNHVmpkR1ZrS1NCN1hHNGdJQ0FnSUNBdkx5QjBhR2x6SUdseklHRWdZbWwwSUdOdmJuUnlhWFpsWkNCaWRYUWdhWFFnYldGclpYTWdabTl5SUhOdmJXVWdibWxqWlNCemVXNTBZWGdnZEc4Z1ltVWdZV0pzWlNCMGIxeHVJQ0FnSUNBZ0x5OGdkWE5sSUM1cGN5Qm1iM0lnY0dGemMybHVaeUJwYmlCbGVIQmxZM1JoZEdsdmJuTmNiaUFnSUNBZ0lHbG1JQ2hoYzNNdVEyaGhhVzR1YVhORGFHRnBiaWhsZUhCbFkzUmxaQ2twSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdWNGNHVmpkR1ZrTG5SbGMzUW9ZV04wZFdGc0tUdGNiaUFnSUNBZ0lIMWNibHh1SUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBOVBUMGdaWGh3WldOMFpXUTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQmxjVG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjJWeGJDY3NJQ2RsY1d4ekp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkRGFHVmphM01nWkdWbGNDQnViMjR0YzNSeWFXTjBJR1Z4ZFdGc2FYUjVJR0psZEhkbFpXNGdkR2hsSUhaaGJIVmxJR0Z1WkNCcGRITWdaWGh3WldOMFpXUXVKeXhjYmlBZ0lDQWdJQ2RKZENCMWJtUmxjbk4wWVc1a2N5QmhjM01nWlhod2NtVnpjMmx2Ym5NZ2MyOGdlVzkxSUdOaGJpQmpiMjFpYVc1bElIUm9aVzBnWVhRZ2QybHNiQ0JwYmlCMGFHVW5MRnh1SUNBZ0lDQWdKMlY0Y0dWamRHVmtJSFpoYkhWbExpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCbGNYVmhiQ0I3ZTJWNGNHVmpkR1ZrZlgwbkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ2UzdGhZM1IxWVd4OWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnWlhod1pXTjBaV1FwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJmTG1selJYRjFZV3dvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUcxaGRHTm9PaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0oxUnlhV1Z6SUhSdklHMWhkR05vSUhSb1pTQnpkV0pxWldOMElHRm5ZV2x1YzNRZ2RHaGxJR1Y0Y0dWamRHVmtJSFpoYkhWbElIZG9hV05vSUdOaGJpQmlaU0JsYVhSb1pYSW5MRnh1SUNBZ0lDQWdKMkVnWm5WdVkzUnBiMjRzSUdGdUlHRnpjeUJsZUhCeVpYTnphVzl1TENCaGJpQnZZbXBsWTNRZ2QybDBhQ0JoSUM1MFpYTjBLQ2tnWm5WdVkzUnBiMjRnS0dadmNpQW5MRnh1SUNBZ0lDQWdKMmx1YzNSaGJtTmxJR0VnVW1WblJYaHdLU0J2Y2lCaElIQnNZV2x1SUc5aWFtVmpkQ0IwYnlCd1lYSjBhV0ZzYkhrZ2JXRjBZMmdnWVdkaGFXNXpkQ0IwYUdVZ2RtRnNkV1V1SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJRzFoZEdOb0lIdDdaWGh3WldOMFpXUjlmU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUI3ZTJGamRIVmhiSDE5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1WEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdWNGNHVmpkR1ZrTG5SbGMzUWdQVDA5SUNkbWRXNWpkR2x2YmljcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDRWhaWGh3WldOMFpXUXVkR1Z6ZENoaFkzUjFZV3dwTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCcFppQW9YeTVwYzFCc1lXbHVUMkpxWldOMEtHVjRjR1ZqZEdWa0tTQjhmQ0JmTG1selFYSnlZWGtvWlhod1pXTjBaV1FwSUh4OElGOHVhWE5CY21kMWJXVnVkSE1vWlhod1pXTjBaV1FwS1NCN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0c1MWJHd2dQVDBnWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdVM1Z3Y0c5eWRDQndZWE56YVc1bklHQmJMQ2RtYjI4blhXQWdkRzhnYldWaGJpQmdXMkZ6Y3k1aGJua3NJQ2RtYjI4blhXQmNiaUFnSUNBZ0lDQWdhV1lnS0Y4dWFYTkJjbkpoZVNobGVIQmxZM1JsWkNrZ2ZId2dYeTVwYzBGeVozVnRaVzUwY3lobGVIQmxZM1JsWkNrcElIdGNiaUFnSUNBZ0lDQWdJQ0JsZUhCbFkzUmxaQ0E5SUY4dWJXRndLR1Y0Y0dWamRHVmtMQ0JtZFc1amRHbHZiaUFvZGlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFI1Y0dWdlppQjJJRDA5UFNBbmRXNWtaV1pwYm1Wa0p5QS9JR0Z6Y3k1aGJua2dPaUIyTzF4dUlDQWdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdWRTlFVHpvZ1NXUmxZV3hzZVNCM1pTQnphRzkxYkdRZ1hDSm1iM0pyWENJZ2RHaGxJSEpsYzI5c2RtVnlJSE52SUhkbElHTmhiaUJ6ZFhCd2IzSjBYRzRnSUNBZ0lDQWdJQzh2SUNBZ0lDQWdJR0Z6ZVc1aklIUmxjM1J6SUdGdVpDQmhiSE52SUhCeWIzWnBaR1VnWW1WMGRHVnlJR1poYVd4MWNtVWdiV1Z6YzJGblpYTXVYRzRnSUNBZ0lDQWdJQzh2SUNBZ0lDQWdJRlZ1Wm05eWRIVnVZWFJsYkhrZ2RHaGxJR04xY25KbGJuUWdabTl5YTJsdVp5QnRaV05vWVc1cGMyMGdaRzlsYzI0bmRDQjNiM0pyWEc0Z0lDQWdJQ0FnSUM4dklDQWdJQ0FnSUdadmNpQjBhR2x6SUhWelpTQmpZWE5sSUhOcGJtTmxJSGRsSUc1bFpXUWdkRzhnWTNKbFlYUmxJRzVsZHlCamFHRnBibk1nWm05eVhHNGdJQ0FnSUNBZ0lDOHZJQ0FnSUNBZ0lHVmhZMmdnWlhod1pXTjBaV1FnYTJWNUxseHVJQ0FnSUNBZ0lDQjJZWElnWm1GcGJIVnlaU0E5SUhSeWRXVTdYRzRnSUNBZ0lDQWdJRjhvWlhod1pXTjBaV1FwTG1WMlpYSjVLR1oxYm1OMGFXOXVJQ2gyWVd4MVpTd2dhMlY1S1NCN1hHNGdJQ0FnSUNBZ0lDQWdhV1lnS0NGZkxtaGhjeWhoWTNSMVlXd3NJR3RsZVNrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdaaGFXeDFjbVVnUFNBbmEyVjVJRndpSnlBcklHdGxlU0FySUNkY0lpQnViM1FnWm05MWJtUWdhVzRnZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0ZmTG1selJYRjFZV3dvWVdOMGRXRnNXMnRsZVYwc0lIWmhiSFZsS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWm1GcGJIVnlaU0E5SUNkclpYa2dYQ0luSUNzZ2EyVjVJQ3NnSjF3aUlHUnZaWE1nYm05MElHMWhkR05vSUh0N1lXTjBkV0ZzVzF3aUp5QXJJR3RsZVNBcklDZGNJbDE5ZlNjN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCbVlXbHNkWEpsTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCcFppQW9kSGx3Wlc5bUlHVjRjR1ZqZEdWa0lDRTlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBblpYaHdaV04wWldRZ2FYTWdibTkwSUdFZ1puVnVZM1JwYjI0Z1lXNWtJR1J2WlhNZ2JtOTBJR2hoZG1VZ1lTQXVkR1Z6ZENCdFpYUm9iMlFuTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCeVpYUjFjbTRnSVNGbGVIQmxZM1JsWkNoaFkzUjFZV3dwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCaFltOTJaVG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjJkMEp5d2dKMjF2Y21WVWFHRnVKeXdnSjJkeVpXRjBaWEpVYUdGdUp5QmRMRnh1SUNBZ0lHaGxiSEE2SUNkRGFHVmphM01nYVdZZ2RHaGxJSFpoYkhWbElHbHpJR2hwWjJobGNpQjBhR0Z1SUdsMGN5QmxlSEJsWTNSbFpDNG5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0J0YjNKbElIUm9ZVzRnZTN0bGVIQmxZM1JsWkgxOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdZV04wZFdGc2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdWNGNHVmpkR1ZrS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWVdOMGRXRnNJRDRnWlhod1pXTjBaV1E3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUdKbGJHOTNPaUI3WEc0Z0lDQWdZV3hwWVhObGN6b2dXeUFuYkhRbkxDQW5iR1Z6YzFSb1lXNG5JRjBzWEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05yY3lCcFppQjBhR1VnZG1Gc2RXVWdhWE1nYkc5M1pYSWdkR2hoSUdsMGN5QmxlSEJsWTNSbFpDNG5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0JzWlhOeklIUm9ZVzRnZTN0bGVIQmxZM1JsWkgxOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdZV04wZFdGc2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdWNGNHVmpkR1ZrS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWVdOMGRXRnNJRHdnWlhod1pXTjBaV1E3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUdGaWIzWmxUM0pGY1hWaGJEb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMnhsWVhOMEp5d2dKMkYwVEdWaGMzUW5MQ0FuWjNSbEp5d2dKMjF2Y21WVWFHRnVUM0pGY1hWaGJDY3NJQ2RuY21WaGRHVnlWR2hoYms5eVJYRjFZV3duSUYwc1hHNGdJQ0FnYUdWc2NEb2dKME5vWldOcmN5QnBaaUIwYUdVZ2RtRnNkV1VnYVhNZ2FHbG5hR1Z5SUc5eUlHVnhkV0ZzSUhSb1lXNGdhWFJ6SUdWNGNHVmpkR1ZrTGljc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHMXZjbVVnZEdoaGJpQnZjaUJsY1hWaGJDQjBieUFrZTJWNGNHVmpkR1ZrZlNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lCN2UyRmpkSFZoYkgxOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR0ZqZEhWaGJDQStQU0JsZUhCbFkzUmxaRHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnWW1Wc2IzZFBja1Z4ZFdGc09pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5iVzl6ZENjc0lDZGhkRTF2YzNRbkxDQW5iSFJsSnl3Z0oyeGxjM05VYUdGdVQzSkZjWFZoYkNjZ1hTeGNiaUFnSUNCb1pXeHdPaUFuUTJobFkydHpJR2xtSUhSb1pTQjJZV3gxWlNCcGN5QnNiM2RsY2lCdmNpQmxjWFZoYkNCMGFHRnVJR2wwY3lCbGVIQmxZM1JsWkM0bkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQnNaWE56SUhSb1lXNGdiM0lnWlhGMVlXd2dkRzhnSkh0bGVIQmxZM1JsWkgwbkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ0pIdGhZM1IxWVd4OUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR0ZqZEhWaGJDQThQU0JsZUhCbFkzUmxaRHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnWTJ4dmMyVTZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RqYkc5elpWUnZKeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZERhR1ZqYTNNZ2FXWWdkR2hsSUhaaGJIVmxJR2x6SUdOc2IzTmxJSFJ2SUhSb1pTQmxlSEJsWTNSbFpDQmlZWE5sWkNCdmJpQmhJR2RwZG1WdUlHUmxiSFJoTGljc1hHNGdJQ0FnSUNBblZHaGxJR1JsWm1GMWJIUWdaR1ZzZEdFZ2FYTWdNQzR4SUhOdklIUm9aU0IyWVd4MVpTQXpMalUxSUdseklHTnNiM05sSUhSdklHRnVlU0IyWVd4MVpTQmlaWFIzWldWdUp5eGNiaUFnSUNBZ0lDY3pMalExSUdGdVpDQXpMalkxSUNoaWIzUm9JR2x1WTJ4MWMybDJaU2t1Snl4Y2JpQWdJQ0FnSUNkVGRISnBibWNnZG1Gc2RXVnpJR0Z5WlNCaGJITnZJSE4xY0hCdmNuUmxaQ0JpZVNCamIyMXdkWFJwYm1jZ2RHaGxJR1JwYzNSaGJtTmxJR0psZEhkbFpXNGdkR2hsYlNjc1hHNGdJQ0FnSUNBbmRYTnBibWNnZEdobElGTnBablEwSUdGc1oyOXlhWFJvYlM0Z1JtOXlJSE4wY21sdVp5QjJZV3gxWlhNZ2RHaGxJR1JsYkhSaElHbHpJR2x1ZEdWeWNISmxkR1ZrSUdGekp5eGNiaUFnSUNBZ0lDZGhJSEJsY21ObGJuUmhaMlVnS0dsbE9pQXdMakkxSUdseklESTFKU2t1SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUdOc2IzTmxJSFJ2SUh0N0lHVjRjR1ZqZEdWa0lIMTlKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJSHQ3SUdGamRIVmhiQ0I5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2daWGh3WldOMFpXUXNJR1JsYkhSaEtTQjdYRzRnSUNBZ0lDQmtaV3gwWVNBOUlHNTFiR3dnUFQwZ1pHVnNkR0VnUHlBd0xqRWdPaUJrWld4MFlUdGNibHh1SUNBZ0lDQWdMeThnVTNWd2NHOXlkQ0J6ZEhKcGJtZHpJR0o1SUdOdmJYQjFkR2x1WnlCMGFHVnBjaUJrYVhOMFlXNWpaVnh1SUNBZ0lDQWdhV1lnS0Y4dWFYTlRkSEpwYm1jb1lXTjBkV0ZzS1NBbUppQmZMbWx6VTNSeWFXNW5LR1Y0Y0dWamRHVmtLU2tnZTF4dUlDQWdJQ0FnSUNCMllYSWdaR2xtWmlBOUlIVjBhV3d1YzJsbWREUW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDd2dNeWtnTHlCTllYUm9MbTFoZUNoaFkzUjFZV3d1YkdWdVozUm9MQ0JsZUhCbFkzUmxaQzVzWlc1bmRHZ3BPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaR2xtWmlBOFBTQmtaV3gwWVR0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdGamRIVmhiQ0ErUFNCbGVIQmxZM1JsWkNBdElHUmxiSFJoSUNZbUlHRmpkSFZoYkNBOFBTQmxlSEJsWTNSbFpDQXJJR1JsYkhSaE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQnBibk4wWVc1alpXOW1PaUI3WEc0Z0lDQWdZV3hwWVhObGN6b2dXeUFuYVc1emRHRnVZMlZQWmljc0lDZHBibk4wWVc1alpTY3NJQ2RwYzJFbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBOb1pXTnJjeUJwWmlCMGFHVWdkbUZzZFdVZ2FYTWdZVzRnYVc1emRHRnVZMlVnYjJZZ2RHaGxJR2RwZG1WdUlHTnZibk4wY25WamRHOXlMaWNzWEc0Z0lDQWdJQ0FuVjJobGJpQjBhR1VnWlhod1pXTjBaV1FnYVhNZ1lTQnpkSEpwYm1jZ2FYUmNYQ2RzYkNCaFkzUjFZV3hzZVNCMWMyVWdZU0JnZEhsd1pXOW1ZQ2NzWEc0Z0lDQWdJQ0FuWTI5dGNHRnlhWE52Ymk0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5kRzhnWW1VZ1lXNGdhVzV6ZEdGdVkyVWdiMllnZTN0bGVIQmxZM1JsWkgxOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tGOHVhWE5UZEhKcGJtY29aWGh3WldOMFpXUXBLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwZVhCbGIyWWdZV04wZFdGc0lEMDlQU0JsZUhCbFkzUmxaQ0EvSUhSeWRXVWdPaUFuYUdGa0lIUjVjR1VnZTNzZ2RIbHdaVzltSUdGamRIVmhiQ0I5ZlNjN1hHNGdJQ0FnSUNCOVhHNGdJQ0FnSUNCeVpYUjFjbTRnWVdOMGRXRnNJR2x1YzNSaGJtTmxiMllnWlhod1pXTjBaV1E3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUhSNWNHVnZaam9nZTF4dUlDQWdJR2hsYkhBNklDZERhR1ZqYTNNZ2FXWWdkR2hsSUhaaGJIVmxJR2x6SUc5bUlHRWdjM0JsWTJsbWFXTWdkSGx3WlNjc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdoaGRtVWdkSGx3WlNCN2UyVjRjR1ZqZEdWa2ZYMG5MRnh1SUNBZ0lHWmhhV3c2SUNkb1lXUWdKSHNnZEhsd1pXOW1JR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCbGVIQmxZM1JsWkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTkZjWFZoYkNoMGVYQmxiMllnWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0J1ZFcxaVpYSTZJSHRjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnNnYVdZZ2RHaGxJSFpoYkhWbElHbHpJR0VnYm5WdFltVnlJQ2hrYVdabVpYSmxiblFnYjJZZ1RtRk9LUzRuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCaElHNTFiV0psY2ljc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTk9kVzFpWlhJb1lXTjBkV0ZzS1NBbUppQWhhWE5PWVU0b1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUdKdmIydzZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RpYjI5c1pXRnVKeUJkTEZ4dUlDQWdJR2hsYkhBNklDZERhR1ZqYXlCcFppQjBhR1VnZG1Gc2RXVWdhWE1nWVNCaWIyOXNaV0Z1TGljc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHRWdZbTl2YkdWaGJpY3NYRzRnSUNBZ1ptRnBiRG9nSjJoaFpDQjBlWEJsSUNSN0lIUjVjR1Z2WmlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVhWE5DYjI5c1pXRnVLR0ZqZEhWaGJDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnpkSEpwYm1jNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZHpkSEluSUYwc1hHNGdJQ0FnYUdWc2NEb2dKME5vWldOcklHbG1JSFJvWlNCMllXeDFaU0JwY3lCaElITjBjbWx1Wnk0bkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQmhJSE4wY21sdVp5Y3NYRzRnSUNBZ1ptRnBiRG9nSjJoaFpDQjBlWEJsSUNSN0lIUjVjR1Z2WmlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVhWE5UZEhKcGJtY29ZV04wZFdGc0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHOWlhbVZqZERvZ2UxeHVJQ0FnSUdobGJIQTZJQ2REYUdWamF5QjBhR0YwSUhaaGJIVmxJR2x6SUc5bUlIUjVjR1VnYjJKcVpXTjBMaWNzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUdGdUlHOWlhbVZqZENjc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTlBZbXBsWTNRb1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUhCc1lXbHVUMkpxWldOME9pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5jR3hoYVc0bkxDQW5iMkpxSnlCZExGeHVJQ0FnSUdobGJIQTZJQ2REYUdWamEzTWdkR2hoZENCMllXeDFaU0JwY3lCaGJpQnZZbXBsWTNRZ1kzSmxZWFJsWkNCaWVTQjBhR1VnVDJKcVpXTjBJR052Ym5OMGNuVmpkRzl5TGljc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lBa2UyRmpkSFZoYkgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmZMbWx6VUd4aGFXNVBZbXBsWTNRb1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUdGeWNtRjVPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUhSb1lYUWdkbUZzZFdVZ2FYTWdZVzRnUVhKeVlYa3VKeXhjYmlBZ0lDQmtaWE5qT2lBbmRHOGdZbVVnWVc0Z1FYSnlZWGtuTEZ4dUlDQWdJR1poYVd3NklDZG9ZV1FnZEhsd1pTQWtleUIwZVhCbGIyWWdZV04wZFdGc0lIMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJmTG1selFYSnlZWGtvWVdOMGRXRnNLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJR1oxYm1OMGFXOXVPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUhSb1lYUWdkbUZzZFdVZ2FYTWdZU0JHZFc1amRHbHZiaTRuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCaElFWjFibU4wYVc5dUp5eGNiaUFnSUNCbVlXbHNPaUFuYUdGa0lIUjVjR1VnSkhzZ2RIbHdaVzltSUdGamRIVmhiQ0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z1h5NXBjMFoxYm1OMGFXOXVLR0ZqZEhWaGJDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnlaV2RsZUhBNklIdGNiaUFnSUNCb1pXeHdPaUFuUTJobFkyc2dkR2hoZENCMllXeDFaU0JwY3lCaElGSmxaMFY0Y0Njc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHRWdVbVZuUlhod0p5eGNiaUFnSUNCbVlXbHNPaUFuYUdGa0lIUjVjR1VnSkhzZ2RIbHdaVzltSUdGamRIVmhiQ0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z1h5NXBjMUpsWjBWNGNDaGhZM1IxWVd3cE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ1pHRjBaVG9nZTF4dUlDQWdJR2hsYkhBNklDZERhR1ZqYXlCMGFHRjBJSFpoYkhWbElHbHpJR0VnUkdGMFpTY3NYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJR0VnUkdGMFpTY3NYRzRnSUNBZ1ptRnBiRG9nSjJoaFpDQjBlWEJsSUNSN0lIUjVjR1Z2WmlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVhWE5FWVhSbEtHRmpkSFZoYkNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCbGJHVnRaVzUwT2lCN1hHNGdJQ0FnYUdWc2NEb2dKME5vWldOcklIUm9ZWFFnZG1Gc2RXVWdhWE1nWVNCRVQwMGdaV3hsYldWdWRDY3NYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJR0VnUkU5TklHVnNaVzFsYm5RbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmZMbWx6Uld4bGJXVnVkQ2hoWTNSMVlXd3BPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdaWEp5YjNJNklIdGNiaUFnSUNCb1pXeHdPaUFuUTJobFkyc2dkR2hoZENCMllXeDFaU0JwY3lCaGJpQmxjbkp2Y2lBb2IzSWdiRzl2YTNNZ2JHbHJaU0JwZENrbkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQmhiaUJGY25KdmNpY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tHRmpkSFZoYkNCcGJuTjBZVzVqWlc5bUlFVnljbTl5S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lDQWdmVnh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVhWE5QWW1wbFkzUW9ZV04wZFdGc0tTQW1KaUJmTG1selUzUnlhVzVuS0dGamRIVmhiQzV1WVcxbEtTQW1KaUJmTG1selUzUnlhVzVuS0dGamRIVmhiQzV0WlhOellXZGxLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnZFc1a1pXWnBibVZrT2lCN1hHNGdJQ0FnYUdWc2NEb2dKME5vWldOcklIUm9ZWFFnZG1Gc2RXVWdhWE1nZFc1a1pXWnBibVZrTGljc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElIVnVaR1ZtYVc1bFpDY3NYRzRnSUNBZ1ptRnBiRG9nSjNkaGN5QWtleUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTlZibVJsWm1sdVpXUW9ZV04wZFdGc0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHNTFiR3c2SUh0Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJzZ2RHaGhkQ0IyWVd4MVpTQnBjeUJ1ZFd4c0xpY3NYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJRzUxYkd3bkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ0pIc2dZV04wZFdGc0lIMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJoWTNSMVlXd2dQVDA5SUc1MWJHdzdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQk9ZVTQ2SUh0Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJzZ2RHaGhkQ0IyWVd4MVpTQnBjeUJPWVU0dUp5eGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdUbUZPSnl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnBaaUFvWHk1cGMwNTFiV0psY2loaFkzUjFZV3dwS1NCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Wm1GcGJDQTlJQ2QzWVhNZ0pIdGhZM1IxWVd4OUp6dGNiaUFnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Wm1GcGJDQTlJQ2RvWVdRZ2RIbHdaU0FrZTNSNWNHVnZaaUJoWTNSMVlXeDlKenRjYmlBZ0lDQWdJSDFjYmlBZ0lDQWdJSEpsZEhWeWJpQnBjMDVoVGloaFkzUjFZV3dwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnZEhKMVpUb2dlMXh1SUNBZ0lHaGxiSEE2SUNkRGFHVmpheUIwYUdGMElIWmhiSFZsSUdseklIUnlkV1VuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCMGNuVmxKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJSHQ3SUdGamRIVmhiQ0I5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdhV1lnS0Y4dWFYTkNiMjlzWldGdUtHRmpkSFZoYkNrcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBL0lIUnlkV1VnT2lBbmQyRnpJSHQ3WVdOMGRXRnNmWDBuTzF4dUlDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJQ2RvWVdRZ2RIbHdaU0FrZTNSNWNHVnZaaUJoWTNSMVlXeDlKenRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJR1poYkhObE9pQjdYRzRnSUNBZ2FHVnNjRG9nSjBOb1pXTnJJSFJvWVhRZ2RtRnNkV1VnYVhNZ1ptRnNjMlVuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCbVlXeHpaU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2FXWWdLRjh1YVhOQ2IyOXNaV0Z1S0dGamRIVmhiQ2twSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUNGaFkzUjFZV3dnUHlCMGNuVmxJRG9nSjNkaGN5QjdlMkZqZEhWaGJIMTlKenRjYmlBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQW5hR0ZrSUhSNWNHVWdKSHQwZVhCbGIyWWdZV04wZFdGc2ZTYzdYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJSEpoYVhObGN6b2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKM1JvY205M2N5Y2dYU3hjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblEyaGxZMnR6SUhSb1lYUWdaWGhsWTNWMGFXNW5JSFJvWlNCMllXeDFaU0J5WlhOMWJIUnpJR2x1SUdGdUlHVjRZMlZ3ZEdsdmJpQmlaV2x1WnlCMGFISnZkMjR1Snl4Y2JpQWdJQ0FnSUNkVWFHVWdZMkZ3ZEhWeVpXUWdaWGhqWlhCMGFXOXVJSFpoYkhWbElHbHpJSFZ6WldRZ2RHOGdiWFYwWVhSbElIUm9aU0J6ZFdKcVpXTjBJR1p2Y2lCMGFHVW5MRnh1SUNBZ0lDQWdKMlp2Ykd4dmQybHVaeUJsZUhCbFkzUmhkR2x2Ym5NdUoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKM1JvY205M2N5QmhiaUJsY25KdmNpY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnWlhod1pXTjBaV1FwSUh0Y2JpQWdJQ0FnSUdsbUlDZ2hYeTVwYzBaMWJtTjBhVzl1S0dGamRIVmhiQ2twSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUNkcGN5QnViM1FnWVNCbWRXNWpkR2x2YmpvZ2UzdGhZM1IxWVd4OWZTYzdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lHRmpkSFZoYkNncE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0oyUnBaQ0J1YjNRZ2RHaHliM2NnWVc1NWRHaHBibWNuTzF4dUlDQWdJQ0FnZlNCallYUmphQ0FvWlNrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYm5Wc2JDQTlQU0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTExZEdGMFpTaGxLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCcFppQW9YeTVwYzBaMWJtTjBhVzl1S0dWNGNHVmpkR1ZrS1NBbUppQmxJR2x1YzNSaGJtTmxiMllnWlhod1pXTjBaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9aU2s3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2FXWWdLRjh1YVhORmNYVmhiQ2hsTENCbGVIQmxZM1JsWkNrcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWlNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0F2THlCQmRXZHRaVzUwSUhSb1pTQmxlSEJsWTNSaGRHbHZiaUJ2WW1wbFkzUWdkMmwwYUNCaElHNWxkeUIwWlcxd2JHRjBaU0IyWVhKcFlXSnNaVnh1SUNBZ0lDQWdJQ0IwYUdsekxtVjRZMlZ3ZEdsdmJpQTlJR1U3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFuWjI5MElIdDdJR1Y0WTJWd2RHbHZiaUI5ZlNjN1hHNGdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lHaGhjem9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjJoaGRtVW5MQ0FuWTI5dWRHRnBiaWNzSUNkamIyNTBZV2x1Y3ljZ1hTeGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuUTJobFkyc2dhV1lnZEdobElIWmhiSFZsSUdoaGN5QnpiMjFsSUdWNGNHVmpkR1ZrSUhaaGJIVmxMaUJKZENCMWJtUmxjbk4wWVc1a2N5QmxlSEJsWTNSbFpDY3NYRzRnSUNBZ0lDQW5ZMmhoYVc0Z1pYaHdjbVZ6YzJsdmJuTWdjMjhnZEdocGN5QnpaWEoyWlhNZ1lYTWdkR2hsSUdWeGRXbDJZV3hsYm5RZ2IyWWdMbVZ4SUdadmNpQndZWEowYVdGc0p5eGNiaUFnSUNBZ0lDZHRZWFJqYUdWekxpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCamIyNTBZV2x1SUh0N1pYaHdaV04wWldSOWZTY3NYRzRnSUNBZ1ptRnBiRG9nSjNkaGN5QjdlMkZqZEhWaGJIMTlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCaGNtY3hJQzhxTENBdUxpNGdLaThwSUh0Y2JseHVJQ0FnSUNBZ0x5OGdZV3hzYjNjZ2JYVnNkR2x3YkdVZ1pYaHdaV04wWldRZ2RtRnNkV1Z6WEc0Z0lDQWdJQ0IyWVhJZ1pYaHdaV04wWldRZ1BTQmZMblJ2UVhKeVlYa29ZWEpuZFcxbGJuUnpLUzV6YkdsalpTZ3hLVHRjYmlBZ0lDQWdJSFJvYVhNdVpYaHdaV04wWldRZ1BTQmxlSEJsWTNSbFpDNXNaVzVuZEdnZ1BUMDlJREVnUHlCbGVIQmxZM1JsWkZzd1hTQTZJR1Y0Y0dWamRHVmtPMXh1WEc0Z0lDQWdJQ0JwWmlBb0lWOHVhWE5UZEhKcGJtY29ZV04wZFdGc0tTQW1KaUFoWHk1cGMwRnljbUY1S0dGamRIVmhiQ2tnSmlZZ0lWOHVhWE5QWW1wbFkzUW9ZV04wZFdGc0tTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdKMmR2ZENCN2UyRmpkSFZoYkgxOUp6dGNiaUFnSUNBZ0lIMWNibHh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVaWFpsY25rb1pYaHdaV04wWldRc0lHWjFibU4wYVc5dUlDaGxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb1h5NXBjMU4wY21sdVp5aGhZM1IxWVd3cElDWW1JRjh1YVhOVGRISnBibWNvWlhod1pXTjBaV1FwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlDMHhJQ0U5UFNCaFkzUjFZV3d1YVc1a1pYaFBaaWhsZUhCbFkzUmxaQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnBaaUFvWHk1cGMwRnljbUY1S0dGamRIVmhiQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQXZMeUJVVDBSUE9pQkpjMjRuZENCMGFHVnlaU0JoYmlCbFlYTnBaWElnZDJGNUlIUnZJSFJsYzNRZ2RHaHBjeUIxYzJsdVp5QnNiMlJoYzJnZ2IyNXNlVDljYmlBZ0lDQWdJQ0FnSUNCcFppQW9JV0Z6Y3k1RGFHRnBiaTVwYzBOb1lXbHVLR1Y0Y0dWamRHVmtLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdaWGh3WldOMFpXUWdQU0JoYzNNdVpYRW9aWGh3WldOMFpXUXBPMXh1SUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z0xURWdJVDA5SUY4dVptbHVaRWx1WkdWNEtHRmpkSFZoYkN3Z1pYaHdaV04wWldRcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1NHRmphem9nUTI5dGNHRnlaU0J2WW1wbFkzUnpJSGRwZEdnZ0xuZG9aWEpsSUdKNUlHWnBiSFJsY21sdVp5QmhJSGR5WVhCd1pYSWdZWEp5WVhsY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SURFZ1BUMDlJRjh1ZDJobGNtVW9XMkZqZEhWaGJGMHNJR1Y0Y0dWamRHVmtLUzVzWlc1bmRHZzdYRzRnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJR2hoYzA5M2Jqb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMmhoYzB0bGVTY3NJQ2RvWVhOSmJtUmxlQ2NnWFN4Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5RMmhsWTJzZ2FXWWdkR2hsSUhaaGJIVmxJR2hoY3lCdmJtVWdiM0lnYlc5eVpTQnZkMjRnY0hKdmNHVnlkR2xsY3lCaGN5QmtaV1pwYm1Wa0lHSjVKeXhjYmlBZ0lDQWdJQ2QwYUdVZ1oybDJaVzRnWVhKbmRXMWxiblJ6TGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJvWVhabElHOTNiaUJ3Y205d1pYSjBlU0FrZXlCbGVIQmxZM1JsWkNCOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tDRmZMbWx6VDJKcVpXTjBLR0ZqZEhWaGJDa3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJQ2QzWVhNZ2UzdGhZM1IxWVd4OWZTYzdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSFJvYVhNdVptRnBiQ0E5SUNkdmJteDVJR2hoWkNCN2V5QmZMbXRsZVhNb1lXTjBkV0ZzS1NCOWZTYzdYRzVjYmlBZ0lDQWdJQzh2SUZSUFJFODZJRTltWm1WeUlHSmxkSFJsY2lCbVlXbHNkWEpsSUcxbGMzTmhaMlZjYmlBZ0lDQWdJSFpoY2lCaGNtZHpJRDBnWHk1MGIwRnljbUY1S0dGeVozVnRaVzUwY3lrdWMyeHBZMlVvTVNrN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWHk1bGRtVnllU2hoY21kekxDQm1kVzVqZEdsdmJpQW9lQ2tnZXlCeVpYUjFjbTRnWHk1b1lYTW9ZV04wZFdGc0xDQjRLVHNnZlNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lHeHZaem9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEVkVzF3Y3lCMGFHVWdjbVZqWldsMlpXUWdkbUZzZFdVZ2RHOGdkR2hsSUdOdmJuTnZiR1V1SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ2JuVnNiQ3hjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCamIyNXpiMnhsTG14dlp5Z25XMEZUVTEwbkxDQmhZM1IxWVd3cE8xeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQmtkVzF3T2lCN1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMFIxYlhCeklIUm9aU0J5WldObGFYWmxaQ0IyWVd4MVpTQjBieUIwYUdVZ1kyOXVjMjlzWlNCaGNIQnNlV2x1WnlCMGFHVWdaMmwyWlc0Z2RHVnRjR3hoZEdVdUp5eGNiaUFnSUNBZ0lDZE9iM1JsT2lCVmMyVWdKSHQwYUdsemZTQjBieUJwYm5SbGNuQnZiR0YwWlNCMGFHVWdkMmh2YkdVZ2RtRnNkV1V1Snl4Y2JpQWdJQ0FnSUNkVFpXVTZJR2gwZEhCek9pOHZiRzlrWVhOb0xtTnZiUzlrYjJOekkzUmxiWEJzWVhSbEoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2diblZzYkN4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQjBjR3dwSUh0Y2JpQWdJQ0FnSUhaaGNpQnlaWE4xYkhRZ1BTQjFkR2xzTG5SbGJYQnNZWFJsTG1OaGJHd29ZV04wZFdGc0xDQjBjR3dzSUdGamRIVmhiQ2s3WEc0Z0lDQWdJQ0JqYjI1emIyeGxMbXh2WnloeVpYTjFiSFFwTzF4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCa1pXSjFaMmRsY2pvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RJWVd4MGN5QnpZM0pwY0hRZ1pYaGxZM1YwYVc5dUlHSjVJSFJ5YVdkblpYSnBibWNnZEdobElHbHVkR1Z5WVdOMGFYWmxJR1JsWW5WbloyVnlMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUc1MWJHd3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnWkdWaWRXZG5aWEk3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2RHRndPaUI3WEc0Z0lDQWdZV3hwWVhObGN6b2dXeUFuWm00bklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBOaGJHeHpJSFJvWlNCd2NtOTJhV1JsWkNCbWRXNWpkR2x2YmlCM2FYUm9JSFJvWlNCamRYSnlaVzUwSUhaaGJIVmxJR0Z6SUdGeVozVnRaVzUwTGljc1hHNGdJQ0FnSUNBblNXWWdkR2hsSUdaMWJtTjBhVzl1SUhKbGRIVnlibk1nYzI5dFpYUm9hVzVuSUdScFptWmxjbVZ1ZENCMGJ5QXFkVzVrWldacGJtVmtLaUIwYUdVbkxGeHVJQ0FnSUNBZ0oyVjRjSEpsYzNOcGIyNGdkMmxzYkNCbWIzSnJJSFJ2SUc5d1pYSmhkR1VnYjI0Z2RHaGxJSEpsZEhWeWJtVmtJSFpoYkhWbExpY3NYRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuWTJGc2JDQjdlMkZ5WnpGOWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnWm00cElIdGNiaUFnSUNBZ0lIWmhjaUJ5WlhOMWJIUWdQU0JtYmloaFkzUjFZV3dwTzF4dUlDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCeVpYTjFiSFFnSVQwOUlDZDFibVJsWm1sdVpXUW5LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoeVpYTjFiSFFwTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCdWIzUnBabms2SUh0Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5VMmx0YVd4aGNpQjBieUF1ZEdGd0tDa2dZblYwSUdsMElIZHZibHhjSjNRZ2NHRnpjeUIwYUdVZ1kzVnljbVZ1ZENCMllXeDFaU0JoY3lCaGNtZDFiV1Z1ZEN3bkxGeHVJQ0FnSUNBZ0oybHVjM1JsWVdRZ2FYUWdkMmxzYkNCaVpTQndjbTkyYVdSbFpDQmhjeUIwYUdVZ1lIUm9hWE5nSUdOdmJuUmxlSFFnZDJobGJpQndaWEptYjNKdGFXNW5JSFJvWlNjc1hHNGdJQ0FnSUNBblkyRnNiQzRnVkdocGN5QmhiR3h2ZDNNZ2FYUWdkRzhnWW1VZ2RYTmxaQ0IzYVhSb0lIUmxjM1FnY25WdWJtVnljeUJnWkc5dVpXQWdjM1I1YkdVZ1kyRnNiR0poWTJ0ekxpY3NYRzRnSUNBZ0lDQW5UbTkwWlNCMGFHRjBJR2wwSUhkcGJHd2dibVZwZEdobGNpQnRkWFJoZEdVZ2RHaGxJSFpoYkhWbElHVjJaVzRnYVdZZ2FYUWdjbVYwZFhKdWN5QnpiMjFsZEdocGJtY3VKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nSjI1dmRHbG1lU0I3ZTJGeVp6RjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z1ptNHBJSHRjYmlBZ0lDQWdJR1p1TG1OaGJHd29ZV04wZFdGc0tUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0J6YVhwbE9pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBadmNtdHpJSFJvWlNCbGVIQmxZM1JoZEdsdmJpQjBieUJ2Y0dWeVlYUmxJRzl1SUhSb1pTQnphWHBsSUc5bUlIUm9aU0JqZFhKeVpXNTBJSFpoYkhWbExpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2RuWlhRZ2MybDZaU2NzWEc0Z0lDQWdabUZwYkRvZ0oyNXZkQ0JvWVhNZ1lTQnNaVzVuZEdnNklIdDdJR0ZqZEhWaGJDQjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2FXWWdLRjh1YVhOUFltcGxZM1FvWVdOMGRXRnNLU0I4ZkNCZkxtbHpRWEp5WVhrb1lXTjBkV0ZzS1NCOGZDQmZMbWx6VTNSeWFXNW5LR0ZqZEhWaGJDa3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJYVjBZWFJsS0Y4dWMybDZaU2hoWTNSMVlXd3BLVHRjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ2NISnZjRG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjJ0bGVTY3NJQ2R3Y205d1pYSjBlU2NnWFN4Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5SbTl5YTNNZ2RHaGxJR1Y0Y0dWamRHRjBhVzl1SUhSdklHOXdaWEpoZEdVZ2IyNGdiMjVsSUc5bUlIUm9aU0IyWVd4MVpTQndjbTl3WlhKMGFXVnpMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNkblpYUWdjSEp2Y0dWeWRIa2dlM3NnWVhKbk1TQjlmU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUJ1YjNRZ1ptOTFibVFnYjI0Z2Uzc2dZV04wZFdGc0lIMTlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCclpYa3BJSHRjYmlBZ0lDQWdJR2xtSUNoZkxtbHpUMkpxWldOMEtHRmpkSFZoYkNrcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0d0bGVTQnBiaUJoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1lXTjBkV0ZzVzJ0bGVWMHBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVyWlhseklEMGdXMTA3WEc0Z0lDQWdJQ0FnSUY4dVptOXlTVzRvWVdOMGRXRnNMQ0JtZFc1amRHbHZiaUFvZGl3Z2F5a2dleUIwYUdsekxtdGxlWE11Y0hWemFDaHJLVHNnZlN3Z2RHaHBjeWs3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFuZDJGeklHNXZkQ0JtYjNWdVpDQnBiaUJyWlhseklIdDdJR3RsZVhNZ2ZYMG5PMXh1SUNBZ0lDQWdmVnh1SUNBZ0lDQWdjbVYwZFhKdUlDZG5iM1FnZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCaGREb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMmx1WkdWNEp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkTmRYUmhkR1Z6SUhSb1pTQjJZV3gxWlNCMGJ5QnZjR1Z5WVhSbElHOXVJRzl1WlNCdlppQjBhR1VnYVc1a1pYaGxaQ0JsYkdWdFpXNTBjeTRnU1dZbkxGeHVJQ0FnSUNBZ0oyMTFiSFJwY0d4bElHbHVaR1Y0WlhNZ1lYSmxJSEJ5YjNacFpHVmtJR0Z1SUdGeWNtRjVJR2x6SUdOdmJYQnZjMlZrSUhkcGRHZ2dkR2hsYlM0bkxGeHVJQ0FnSUNBZ0owNXZkR1U2SUVsMElITjFjSEJ2Y25SeklHNWxaMkYwYVhabElHbHVaR1Y0WlhNblhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5aMlYwSUdsdVpHVjRJQ1I3SUdGeVozTXVhbTlwYmloY0lpd2dYQ0lwSUgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR2x1WkdWNEtTQjdYRzRnSUNBZ0lDQnBaaUFvSVY4dWFYTkJjbkpoZVNoaFkzUjFZV3dwSUNZbUlDRmZMbWx6VTNSeWFXNW5LR0ZqZEhWaGJDa3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJQ2R1YjNRZ1lXNGdZWEp5WVhrZ2IzSWdZU0J6ZEhKcGJtYzZJQ1I3WVdOMGRXRnNmU2M3WEc0Z0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUhaaGNpQnBibVJsZUdWeklEMGdYeTUwYjBGeWNtRjVLR0Z5WjNWdFpXNTBjeWt1YzJ4cFkyVW9NU2s3WEc0Z0lDQWdJQ0IyWVhJZ1pXeGxiWE1nUFNCYlhUdGNibHh1SUNBZ0lDQWdabTl5SUNoMllYSWdhU0E5SURBN0lHa2dQQ0JwYm1SbGVHVnpMbXhsYm1kMGFEc2dhU3NyS1NCN1hHNGdJQ0FnSUNBZ0lIWmhjaUJwWkhnZ1BTQnBibVJsZUdWelcybGRPMXh1WEc0Z0lDQWdJQ0FnSUdsa2VDQTlJR2xrZUNBOElEQWdQeUJoWTNSMVlXd3ViR1Z1WjNSb0lDc2dhV1I0SURvZ2FXUjRPMXh1SUNBZ0lDQWdJQ0JwWmlBb2FXUjRJRHdnTUNCOGZDQnBaSGdnUGowZ1lXTjBkV0ZzTG14bGJtZDBhQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCcFpIZ2dLeUFuSUc5MWRDQnZaaUJpYjNWdVpITWdabTl5SUh0N1lXTjBkV0ZzZlgwbk8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnWld4bGJYTXVjSFZ6YUNoaFkzUjFZV3hiYVdSNFhTazdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2hjYmlBZ0lDQWdJQ0FnWld4bGJYTXViR1Z1WjNSb0lEMDlQU0F4SUQ4Z1pXeGxiWE5iTUYwZ09pQmxiR1Z0YzF4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2EyVjVjem9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZE5kWFJoZEdWeklIUm9aU0IyWVd4MVpTQjBieUJ2Y0dWeVlYUmxJRzl1SUdsMGN5QnNhWE4wSUc5bUlHOTNiaUJyWlhsekxpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2RuWlhRZ2EyVjVjeWNzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXViWFYwWVhSbEtGeHVJQ0FnSUNBZ0lDQmZMbXRsZVhNb1lXTjBkV0ZzS1Z4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUhaaGJIVmxjem9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZE5kWFJoZEdWeklIUm9aU0IyWVd4MVpTQjBieUJ2Y0dWeVlYUmxJRzl1SUdsMGN5QnNhWE4wSUc5bUlIWmhiSFZsY3lkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZG5aWFFnZG1Gc2RXVnpKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1hHNGdJQ0FnSUNBZ0lGOHVkbUZzZFdWektHRmpkSFZoYkNsY2JpQWdJQ0FnSUNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lITnNhV05sT2lCN1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMFY0ZEhKaFkzUnpJR0VnY0c5eWRHbHZiaUJtY205dElIUm9aU0IyWVd4MVpTNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuYzJ4cFkyVW9lM3RoWTNSMVlXeDlmU3dnSkh0aGNtY3hJSHg4SURCOUtTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnYzNSaGNuUXNJR1Z1WkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXViWFYwWVhSbEtGeHVJQ0FnSUNBZ0lDQmZMblJ2UVhKeVlYa29ZV04wZFdGc0tTNXpiR2xqWlNoemRHRnlkQ3dnWlc1a0tWeHVJQ0FnSUNBZ0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdabWxzZEdWeU9pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBsMFpYSmhkR1Z6SUc5MlpYSWdaV3hsYldWdWRITWdiMllnZEdobElHTnZiR3hsWTNScGIyNHNJR1p2Y210cGJtY2dkR2hsSUdWNGNHVmpkR0YwYVc5dUlIUnZKeXhjYmlBZ0lDQWdJQ2R2Y0dWeVlYUmxJRzl1SUdGdUlHRnljbUY1SUhkcGRHZ2dZV3hzSUhSb1pTQmxiR1Z0Wlc1MGN5Qm1iM0lnZDJocFkyZ2dkR2hsSUdOaGJHeGlZV05ySUhKbGRIVnlibVZrSnl4Y2JpQWdJQ0FnSUNkMGNuVjBhSGtnWm05eUxpY3NYRzRnSUNBZ0lDQW5VMlZsT2lCb2RIUndjem92TDJ4dlpHRnphQzVqYjIwdlpHOWpjeU5tYVd4MFpYSW5YRzRnSUNBZ1hTeGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JqWVd4c1ltRmpheXdnZEdocGMwRnlaeWtnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJYVjBZWFJsS0Z4dUlDQWdJQ0FnSUNCZkxtWnBiSFJsY2loaFkzUjFZV3dzSUdOaGJHeGlZV05yTENCMGFHbHpRWEpuS1Z4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUhKbGFtVmpkRG9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEpkR1Z5WVhSbGN5QnZkbVZ5SUdWc1pXMWxiblJ6SUc5bUlHTnZiR3hsWTNScGIyNHNJR1p2Y210cGJtY2dkR2hsSUdWNGNHVmpkR0YwYVc5dUlIUnZJRzl3WlhKaGRHVW5MRnh1SUNBZ0lDQWdKMjl1SUdGdUlHRnljbUY1SUhkcGRHZ2dZV3hzSUhSb1pTQmxiR1Z0Wlc1MGN5Qm1iM0lnZDJocFkyZ2dkR2hsSUdOaGJHeGlZV05ySUhKbGRIVnlibVZrSUdaaGJITjVKeXhjYmlBZ0lDQWdJQ2RtYjNJZ0tIUm9aU0J2Y0hCdmMybDBaU0J2WmlBdVptbHNkR1Z5S1M0bkxGeHVJQ0FnSUNBZ0oxTmxaVG9nYUhSMGNITTZMeTlzYjJSaGMyZ3VZMjl0TDJSdlkzTWpjbVZxWldOMEoxeHVJQ0FnSUYwc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2dZMkZzYkdKaFkyc3NJSFJvYVhOQmNtY3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2hjYmlBZ0lDQWdJQ0FnWHk1eVpXcGxZM1FvWVdOMGRXRnNMQ0JqWVd4c1ltRmpheXdnZEdocGMwRnlaeWxjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUhkb1pYSmxPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0oxQmxjbVp2Y20xeklHRWdaR1ZsY0NCamIyMXdZWEpwYzI5dUlHOW1JR1ZoWTJnZ1pXeGxiV1Z1ZENCcGJpQmhJR052Ykd4bFkzUnBiMjRnZEc4Z2RHaGxJR2RwZG1WdUp5eGNiaUFnSUNBZ0lDZHdjbTl3WlhKMGFXVnpJRzlpYW1WamRDd2dabTl5YTJsdVp5QjBhR1VnWlhod1pXTjBZWFJwYjI0Z2RHOGdiM0JsY21GMFpTQnZiaUJoYmlCaGNuSmhlU0J2WmlCaGJHd25MRnh1SUNBZ0lDQWdKMlZzWlcxbGJuUnpJSFJvWVhRZ2FHRjJaU0JsY1hWcGRtRnNaVzUwSUhCeWIzQmxjblI1SUhaaGJIVmxjeTRuTEZ4dUlDQWdJQ0FnSjFObFpUb2dhSFIwY0hNNkx5OXNiMlJoYzJndVkyOXRMMlJ2WTNNamQyaGxjbVVuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbmQyaGxjbVVnZTN0aGNtY3hmWDBuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lIQnliM0J6S1NCN1hHNGdJQ0FnSUNCcFppQW9JVjh1YVhOUWJHRnBiazlpYW1WamRDaHdjbTl3Y3lrcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDZHdjbTl3Y3lCcGN5QnViM1FnWVc0Z2IySnFaV04wSnp0Y2JpQWdJQ0FnSUgxY2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoY2JpQWdJQ0FnSUNBZ1h5NTNhR1Z5WlNoaFkzUjFZV3dzSUhCeWIzQnpLVnh1SUNBZ0lDQWdLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnYldGd09pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBadmNtdHpJSFJvWlNCbGVIQmxZM1JoZEdsdmJpQjBieUJ2Y0dWeVlYUmxJRzl1SUdGdUlHRnljbUY1SUdodmJHUnBibWNnZEdobElISmxjM1ZzZEhNZ2IyWW5MRnh1SUNBZ0lDQWdKMmx1ZG05cmFXNW5JSFJvWlNCallXeHNZbUZqYXlCbWIzSWdaV0ZqYUNCbGJHVnRaVzUwSUdsdUlIUm9aU0JqZFhKeVpXNTBJR052Ykd4bFkzUnBiMjR1Snl4Y2JpQWdJQ0FnSUNkVFpXVTZJR2gwZEhCek9pOHZiRzlrWVhOb0xtTnZiUzlrYjJOekkyMWhjQ2RjYmlBZ0lDQmRMRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdOaGJHeGlZV05yTENCMGFHbHpRWEpuS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1hHNGdJQ0FnSUNBZ0lGOHViV0Z3S0dGamRIVmhiQ3dnWTJGc2JHSmhZMnNzSUhSb2FYTkJjbWNwWEc0Z0lDQWdJQ0FwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCdFpYUm9iMlE2SUh0Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5SbTl5YTNNZ2RHaGxJR1Y0Y0dWamRHRjBhVzl1SUhSdklHOXdaWEpoZEdVZ2IyNGdkR2hsSUhKbGMzVnNkQ0J2WmlCcGJuWnZhMmx1WnlCMGFHVWdibUZ0WldRbkxGeHVJQ0FnSUNBZ0oyMWxkR2h2WkNCdmJpQjBhR1VnYzNWaWFtVmpkQ0IyWVd4MVpTNG5MRnh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nWENKdFpYUm9iMlFnTGlSN1lYSm5NWDBvS1Z3aUxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJRzFsZEdodlpDd2dZWEpuS1NCN1hHNGdJQ0FnSUNCcFppQW9kSGx3Wlc5bUlHRmpkSFZoYkZ0dFpYUm9iMlJkSUNFOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFuSkh0aGNtY3hmU0JwY3lCdWIzUWdZU0J0WlhSb2IyUWdhVzRnZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lIWmhjaUJoY21keklEMGdYeTUwYjBGeWNtRjVLR0Z5WjNWdFpXNTBjeWt1YzJ4cFkyVW9NaWs3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUdGamRIVmhiRnR0WlhSb2IyUmRMbUZ3Y0d4NUtHRmpkSFZoYkN3Z1lYSm5jeWxjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUdsdWRtOXJaVG9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEdiM0pyY3lCMGFHVWdaWGh3WldOMFlYUnBiMjRnZEc4Z2IzQmxjbUYwWlNCdmJpQmhiaUJoY25KaGVTQm9iMnhrYVc1bklIUm9aU0J5WlhOMWJIUnpJRzltSnl4Y2JpQWdJQ0FnSUNkcGJuWnZhMmx1WnlCMGFHVWdiV1YwYUc5a0lHNWhiV1ZrSUdKNUlIUm9aU0JoY21kMWJXVnVkQ0JtYjNJZ1pXRmphQ0JsYkdWdFpXNTBJR2x1SUhSb1pTY3NYRzRnSUNBZ0lDQW5ZM1Z5Y21WdWRDQmpiMnhzWldOMGFXOXVMaWNzWEc0Z0lDQWdJQ0FuVTJWbE9pQm9kSFJ3Y3pvdkwyeHZaR0Z6YUM1amIyMHZaRzlqY3lOcGJuWnZhMlVuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lCY0ltbHVkbTlyWlNBdUpIdGhjbWN4ZlNncFhDSXNYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnYldWMGFHOWtMQ0JoY21jcElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTExZEdGMFpTaGNiaUFnSUNBZ0lDQWdYeTVwYm5admEyVXVZWEJ3Ykhrb1h5d2dZWEpuZFcxbGJuUnpLVnh1SUNBZ0lDQWdLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnY0d4MVkyczZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblRYVjBZWFJsY3lCMGFHVWdkbUZzZFdVZ2RHOGdZbVVnZEdobElHOXVaU0J2WmlCMGFHVWdjM0JsWTJsbWFXTWdjSEp2Y0dWeWRIa2dabTl5SUdGc2JDQmxiR1Z0Wlc1MGN5Y3NYRzRnSUNBZ0lDQW5hVzRnZEdobElHTjFjbkpsYm5RZ1kyOXNiR1ZqZEdsdmJpNG5MRnh1SUNBZ0lDQWdKMU5sWlRvZ2FIUjBjSE02THk5c2IyUmhjMmd1WTI5dEwyUnZZM01qY0d4MVkyc25YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuY0d4MVkyc29JSHQ3WVhKbk1YMTlJQ2tuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lIQnliM0FwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoY2JpQWdJQ0FnSUNBZ1h5NXdiSFZqYXloaFkzUjFZV3dzSUhCeWIzQXBYRzRnSUNBZ0lDQXBPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0JtYVhKemREb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMmhsWVdRbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjFSUFJFOG5MRnh1SUNBZ0lDQWdKMU5sWlRvZ2FIUjBjSE02THk5c2IyUmhjMmd1WTI5dEwyUnZZM01qWm1seWMzUW5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuWjJWMElHWnBjbk4wSUdWc1pXMWxiblFuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTExZEdGMFpTaGNiaUFnSUNBZ0lDQWdYeTVvWldGa0tHRmpkSFZoYkNsY2JpQWdJQ0FnSUNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCc1lYTjBPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0oxUlBSRThuTEZ4dUlDQWdJQ0FnSjFObFpUb2dhSFIwY0hNNkx5OXNiMlJoYzJndVkyOXRMMlJ2WTNNamJHRnpkQ2RjYmlBZ0lDQmRMRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoY2JpQWdJQ0FnSUNBZ1h5NXNZWE4wS0dGamRIVmhiQ2xjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0J5WlhOME9pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5kR0ZwYkNjZ1hTeGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuVkU5RVR5Y3NYRzRnSUNBZ0lDQW5VMlZsT2lCb2RIUndjem92TDJ4dlpHRnphQzVqYjIwdlpHOWpjeU55WlhOMEoxeHVJQ0FnSUYwc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLRnh1SUNBZ0lDQWdJQ0JmTG5SaGFXd29ZV04wZFdGc0tWeHVJQ0FnSUNBZ0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdiV2x1T2lCN1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMDExZEdGMFpYTWdkR2hsSUhOMVltcGxZM1FnZEc4Z1ltVWdkR2hsSUcxcGJtbHRkVzBnZG1Gc2RXVWdabTkxYm1RZ2IyNGdkR2hsSUdOdmJHeGxZM1JwYjI0dUp5eGNiaUFnSUNBZ0lDZFRaV1U2SUdoMGRIQnpPaTh2Ykc5a1lYTm9MbU52YlM5a2IyTnpJMjFwYmlkY2JpQWdJQ0JkTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTExZEdGMFpTaGNiaUFnSUNBZ0lDQWdYeTV0YVc0b1lXTjBkV0ZzS1Z4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUcxaGVEb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkTmRYUmhkR1Z6SUhSb1pTQnpkV0pxWldOMElIUnZJR0psSUhSb1pTQnRZWGhwYlhWdElIWmhiSFZsSUdadmRXNWtJRzl1SUhSb1pTQmpiMnhzWldOMGFXOXVMaWNzWEc0Z0lDQWdJQ0FuVTJWbE9pQm9kSFJ3Y3pvdkwyeHZaR0Z6YUM1amIyMHZaRzlqY3lOdFlYZ25YRzRnSUNBZ1hTeGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWJXRjRLR0ZqZEhWaGJDbGNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJSE52Y25RNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuVFhWMFlYUmxjeUIwYUdVZ2RtRnNkV1VnZEc4Z1ltVWdjMjl5ZEdWa0lHbHVJR0Z6WTJWdVpHbHVaeUJ2Y21SbGNpNG5MRnh1SUNBZ0lDQWdKMU5sWlRvZ2FIUjBjSE02THk5c2IyUmhjMmd1WTI5dEwyUnZZM01qYzI5eWRFSjVKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nSjNOdmNuUW5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdOaGJHeGlZV05yTENCMGFHbHpRWEpuS1NCN1hHNGdJQ0FnSUNBdkx5QkJiR3h2ZHlCMGFHVWdkWE5sSUc5bUlHVjRjSEpsYzNOcGIyNXpJR0Z6SUdOaGJHeGlZV05yYzF4dUlDQWdJQ0FnYVdZZ0tHTmhiR3hpWVdOcklHbHVjM1JoYm1ObGIyWWdZWE56TGtOb1lXbHVLU0I3WEc0Z0lDQWdJQ0FnSUdOaGJHeGlZV05ySUQwZ1kyRnNiR0poWTJzdWNtVnpkV3gwTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1hHNGdJQ0FnSUNBZ0lGOHVjMjl5ZEVKNUtHRmpkSFZoYkN3Z1kyRnNiR0poWTJzc0lIUm9hWE5CY21jcFhHNGdJQ0FnSUNBcE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQnpkRzl5WlRvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RJWld4d1pYSWdkRzhnYzNSdmNtVWdZU0J5WldabGNtVnVZMlVnZEc4Z2RHaGxJR04xY25KbGJuUWdkbUZzZFdVZ1ltVnBibWNnWlhaaGJIVmhkR1ZrSUdsdUlIUm9aU2NzWEc0Z0lDQWdJQ0FuWlhod2NtVnpjMmx2YmlCcGJpQnpiMjFsSUc5MGFHVnlJRzlpYW1WamRDNGdTWFFnWlhod1pXTjBjeUJoSUhSaGNtZGxkQ0J2WW1wbFkzUWdZVzVrSUc5d2RHbHZibUZzYkhrbkxGeHVJQ0FnSUNBZ0ozUm9aU0J1WVcxbElHOW1JR0VnY0hKdmNHVnlkSGt1SUVsbUlIUmhjbWRsZENCcGN5QmhJR1oxYm1OMGFXOXVJR2wwWEZ3bmJHd2djbVZqWldsMlpTQjBhR1VnZG1Gc2RXVW5MRnh1SUNBZ0lDQWdKM1Z6YVc1bklHQndjbTl3WUNCaGN5QjBhR2x6SUdOdmJuUmxlSFF1SUVsbUlHQndjbTl3WUNCcGN5QnViM1FnY0hKdmRtbGtaV1FnWVc1a0lHQjBZWEpuWlhSZ0lHbHpJR0Z1Snl4Y2JpQWdJQ0FnSUNkaGNuSmhlU0IwYUdVZ2RtRnNkV1VnZDJsc2JDQmlaU0J3ZFhOb1pXUWdkRzhnYVhRdUoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKM04wYjNKbEp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0IwWVhKblpYUXNJSEJ5YjNBcElIdGNiaUFnSUNBZ0lHbG1JQ2hmTG1selJuVnVZM1JwYjI0b2RHRnlaMlYwS1NrZ2UxeHVJQ0FnSUNBZ0lDQjBZWEpuWlhRdVkyRnNiQ2h3Y205d0xDQmhZM1IxWVd3cE8xeHVJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaHdjbTl3SUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tGOHVhWE5CY25KaGVTaDBZWEpuWlhRcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnZEdGeVoyVjBMbkIxYzJnb1lXTjBkV0ZzS1R0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z0ozQnliM0FnZFc1a1pXWnBibVZrSUdGdVpDQjBZWEpuWlhRZ2FYTWdibTkwSUdGdUlHRnljbUY1SUc5eUlHRWdablZ1WTNScGIyNDZJSHQ3WVhKbk1YMTlKenRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnZlNCbGJITmxJR2xtSUNoZkxtbHpUMkpxWldOMEtIUmhjbWRsZENrcElIdGNiaUFnSUNBZ0lDQWdkR0Z5WjJWMFczQnliM0JkSUQwZ1lXTjBkV0ZzTzF4dUlDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJQ2QwWVhKblpYUWdhWE1nYm05MElHRnVJRzlpYW1WamREb2dlM3RoY21jeGZYMG5PMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1ZlNrN1hHNGlYWDA9IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snXyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnXyddIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG4vLyBIZWxwZXIgZmFjdG9yeSBmb3IgdGhlbmFibGUgY2FsbGJhY2tzXG5mdW5jdGlvbiByZXN1bWUgKHJlc29sdmVyLCByZXN1bHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJlc29sdmVyLnJlc3VtZSh2YWx1ZSwgcmVzdWx0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNQcm9taXNlICh2YWx1ZSkge1xuICB2YXIgdGhlbiA9IHZhbHVlICYmIHZhbHVlLnRoZW47XG4gIHJldHVybiB0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuXG4vLyBQcm9taXNlIHJlbGF0ZWQgbWF0Y2hlcnNcbmFzcy5yZWdpc3Rlcih7XG5cbiAgcHJvbWlzZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdWZXJpZmllcyB0aGF0IHRoZSB2YWx1ZSBpcyBhIHByb21pc2UgKFByb21pc2UvQSspIGJ1dCBkb2VzIG5vdCBhdHRhY2gnLFxuICAgICAgJ3RoZSBleHByZXNzaW9uIHRvIGl0cyByZXNvbHV0aW9uIGxpa2UgYHJlc29sdmVzYCBvciBgcmVqZWN0c2AsIGluc3RlYWQnLFxuICAgICAgJ3RoZSBvcmlnaW5hbCBwcm9taXNlIHZhbHVlIGlzIGtlcHQgYXMgdGhlIHN1YmplY3QgZm9yIHRoZSBmb2xsb3dpbmcnLFxuICAgICAgJ2V4cGVjdGF0aW9ucy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSBwcm9taXNlJyxcbiAgICBmYWlsOiAnZ290ICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gaXNQcm9taXNlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuXG4gIHJlc29sdmVzOiB7XG4gICAgYWxpYXNlczogWyAncmVzb2x2ZWQnLCAnZnVsZmlsbGVkJywgJ2Z1bGZpbGwnLCAnZXZlbnR1YWxseScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlJyxcbiAgICAgICdhcHBseWluZyB0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZXNvbHZlZCwnLFxuICAgICAgJ211dGF0aW5nIHRoZSB2YWx1ZSB0byB0aGUgcmVzb2x2ZWQgb25lLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZScsXG4gICAgICAncHJvbWlzZSBpcyBhY3R1YWxseSByZWplY3RlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZXNvbHZlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIHJlamVjdGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEF0dGFjaCB0byB0aGUgcHJvbWlzZSBzbyB3ZSBnZXQgbm90aWZpZWQgd2hlbiBpdCdzIHJlc29sdmVkLlxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIGJlY29tZToge1xuICAgIGFsaWFzZXM6IFsgJ2JlY29tZXMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1dvcmtzIHRoZSBzYW1lIGFzIC5yZXNvbHZlcyBidXQgYWRkaXRpb25hbGx5IHdpbGwgZG8gYSBjb21wYXJpc29uIGJldHdlZW4nLFxuICAgICAgJ3RoZSByZXNvbHZlZCB2YWx1ZSBmcm9tIHRoZSBwcm9taXNlIGFuZCB0aGUgZXhwZWN0ZWQgb25lLiBJdCBjYW4gYmUgc2VlbicsXG4gICAgICAnYXMgYSBzaG9ydGN1dCBmb3IgYC5yZXNvbHZlcy5lcShleHBlY3RlZClgLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZWNvbWUge3sgZXhwZWN0ZWQgfX0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIE1ha2UgaXQgYXN5bmNcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICAvLyBBdHRhY2ggdG8gdGhlIHByb21pc2UgcmVzb2x1dGlvblxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGVxdWFsaXR5IHN1Y2NlZWRzIGp1c3Qga2VlcCByZXNvbHZpbmdcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBfLmlzRXF1YWwodmFsdWUsIGV4cGVjdGVkKSA/IHVuZGVmaW5lZCA6IGZhbHNlO1xuICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKHZhbHVlLCByZXN1bHQpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyLCBmYWxzZSlcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgcmVqZWN0czoge1xuICAgIGFsaWFzZXM6IFsgJ3JlamVjdGVkJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBdHRhY2ggdGhlIG1hdGNoZXIgdG8gYSBwcm9taXNlIHZhbHVlIChQcm9taXNlcy9BKykgdG8gY29udGludWUgYXBwbHlpbmcnLFxuICAgICAgJ3RoZSBjaGFpbiBvZiBtYXRjaGVycyBvbmNlIHRoZSBwcm9taXNlIGhhcyBiZWVuIHJlamVjdGVkLCBtdXRhdGluZyB0aGUnLFxuICAgICAgJ3ZhbHVlIHRvIGJlY29tZSB0aGUgcmVqZWN0ZWQgZXJyb3IuJyxcbiAgICAgICdJdCB3aWxsIGZhaWwgaWYgdGhlIHZhbHVlIGlzIG5vdCBhIHByb21pc2UgKG5vIC50aGVuIG1ldGhvZCkgb3IgdGhlJyxcbiAgICAgICdwcm9taXNlIGlzIGFjdHVhbGx5IGZ1bGZpbGxlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZWplY3RlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIGZ1bGZpbGxlZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIEVudGVyIGFzeW5jIG1vZGVcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIsIGZhbHNlKSxcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTl0WVhSamFHVnljeTl3Y205dGFYTmxMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU0lzSW1acGJHVWlPaUpuWlc1bGNtRjBaV1F1YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaWRtRnlJRjhnUFNBb2RIbHdaVzltSUhkcGJtUnZkeUFoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaUEvSUhkcGJtUnZkMXNuWHlkZElEb2dkSGx3Wlc5bUlHZHNiMkpoYkNBaFBUMGdYQ0oxYm1SbFptbHVaV1JjSWlBL0lHZHNiMkpoYkZzblh5ZGRJRG9nYm5Wc2JDazdYRzVjYm5aaGNpQmhjM01nUFNCeVpYRjFhWEpsS0NjdUxpOWhjM01uS1R0Y2JseHVYRzR2THlCSVpXeHdaWElnWm1GamRHOXllU0JtYjNJZ2RHaGxibUZpYkdVZ1kyRnNiR0poWTJ0elhHNW1kVzVqZEdsdmJpQnlaWE4xYldVZ0tISmxjMjlzZG1WeUxDQnlaWE4xYkhRcElIdGNiaUFnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2gyWVd4MVpTa2dlMXh1SUNBZ0lISmxjMjlzZG1WeUxuSmxjM1Z0WlNoMllXeDFaU3dnY21WemRXeDBLVHRjYmlBZ2ZUdGNibjFjYmx4dVpuVnVZM1JwYjI0Z2FYTlFjbTl0YVhObElDaDJZV3gxWlNrZ2UxeHVJQ0IyWVhJZ2RHaGxiaUE5SUhaaGJIVmxJQ1ltSUhaaGJIVmxMblJvWlc0N1hHNGdJSEpsZEhWeWJpQjBlWEJsYjJZZ2RHaGxiaUE5UFQwZ0oyWjFibU4wYVc5dUp6dGNibjFjYmx4dVhHNHZMeUJRY205dGFYTmxJSEpsYkdGMFpXUWdiV0YwWTJobGNuTmNibUZ6Y3k1eVpXZHBjM1JsY2loN1hHNWNiaUFnY0hKdmJXbHpaVG9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZFdaWEpwWm1sbGN5QjBhR0YwSUhSb1pTQjJZV3gxWlNCcGN5QmhJSEJ5YjIxcGMyVWdLRkJ5YjIxcGMyVXZRU3NwSUdKMWRDQmtiMlZ6SUc1dmRDQmhkSFJoWTJnbkxGeHVJQ0FnSUNBZ0ozUm9aU0JsZUhCeVpYTnphVzl1SUhSdklHbDBjeUJ5WlhOdmJIVjBhVzl1SUd4cGEyVWdZSEpsYzI5c2RtVnpZQ0J2Y2lCZ2NtVnFaV04wYzJBc0lHbHVjM1JsWVdRbkxGeHVJQ0FnSUNBZ0ozUm9aU0J2Y21sbmFXNWhiQ0J3Y205dGFYTmxJSFpoYkhWbElHbHpJR3RsY0hRZ1lYTWdkR2hsSUhOMVltcGxZM1FnWm05eUlIUm9aU0JtYjJ4c2IzZHBibWNuTEZ4dUlDQWdJQ0FnSjJWNGNHVmpkR0YwYVc5dWN5NG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdZU0J3Y205dGFYTmxKeXhjYmlBZ0lDQm1ZV2xzT2lBbloyOTBJQ1I3SUdGamRIVmhiQ0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2FYTlFjbTl0YVhObEtHRmpkSFZoYkNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lISmxjMjlzZG1Wek9pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5jbVZ6YjJ4MlpXUW5MQ0FuWm5Wc1ptbHNiR1ZrSnl3Z0oyWjFiR1pwYkd3bkxDQW5aWFpsYm5SMVlXeHNlU2NnWFN4Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5RWFIwWVdOb0lIUm9aU0J0WVhSamFHVnlJSFJ2SUdFZ2NISnZiV2x6WlNCMllXeDFaU0FvVUhKdmJXbHpaWE12UVNzcElIUnZJR052Ym5ScGJuVmxKeXhjYmlBZ0lDQWdJQ2RoY0hCc2VXbHVaeUIwYUdVZ1kyaGhhVzRnYjJZZ2JXRjBZMmhsY25NZ2IyNWpaU0IwYUdVZ2NISnZiV2x6WlNCb1lYTWdZbVZsYmlCeVpYTnZiSFpsWkN3bkxGeHVJQ0FnSUNBZ0oyMTFkR0YwYVc1bklIUm9aU0IyWVd4MVpTQjBieUIwYUdVZ2NtVnpiMngyWldRZ2IyNWxMaWNzWEc0Z0lDQWdJQ0FuU1hRZ2QybHNiQ0JtWVdsc0lHbG1JSFJvWlNCMllXeDFaU0JwY3lCdWIzUWdZU0J3Y205dGFYTmxJQ2h1YnlBdWRHaGxiaUJ0WlhSb2IyUXBJRzl5SUhSb1pTY3NYRzRnSUNBZ0lDQW5jSEp2YldselpTQnBjeUJoWTNSMVlXeHNlU0J5WldwbFkzUmxaQzRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbmRHOGdZbVVnWVNCeVpYTnZiSFpsWkNCd2NtOXRhWE5sSnl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUhKbGFtVmpkR1ZrSnl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnBaaUFvSVdselVISnZiV2x6WlNoaFkzUjFZV3dwS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBbmFYTWdibTkwSUdFZ2NISnZiV2x6WlRvZ2UzdGhZM1IxWVd4OWZTYzdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSEpsZEhWeWJpQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpYSXBJSHRjYmlBZ0lDQWdJQ0FnTHk4Z1JXNTBaWElnWVhONWJtTWdiVzlrWlZ4dUlDQWdJQ0FnSUNCeVpYTnZiSFpsY2k1d1lYVnpaU2dwTzF4dVhHNGdJQ0FnSUNBZ0lDOHZJRUYwZEdGamFDQjBieUIwYUdVZ2NISnZiV2x6WlNCemJ5QjNaU0JuWlhRZ2JtOTBhV1pwWldRZ2QyaGxiaUJwZENkeklISmxjMjlzZG1Wa0xseHVJQ0FnSUNBZ0lDQmhZM1IxWVd3dWRHaGxiaWhjYmlBZ0lDQWdJQ0FnSUNCeVpYTjFiV1VvY21WemIyeDJaWElwTEZ4dUlDQWdJQ0FnSUNBZ0lISmxjM1Z0WlNoeVpYTnZiSFpsY2l3Z1ptRnNjMlVwWEc0Z0lDQWdJQ0FnSUNrN1hHNWNiaUFnSUNBZ0lDQWdMeThnVW1sbmFIUWdibTkzSUhkbElHUnZiaWQwSUd0dWIzY2dhV1lnZEdobElHVjRjSEpsYzNOcGIyNGdhWE1nZG1Gc2FXUmNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpEdGNiaUFnSUNBZ0lIMDdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJR0psWTI5dFpUb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMkpsWTI5dFpYTW5JRjBzWEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0oxZHZjbXR6SUhSb1pTQnpZVzFsSUdGeklDNXlaWE52YkhabGN5QmlkWFFnWVdSa2FYUnBiMjVoYkd4NUlIZHBiR3dnWkc4Z1lTQmpiMjF3WVhKcGMyOXVJR0psZEhkbFpXNG5MRnh1SUNBZ0lDQWdKM1JvWlNCeVpYTnZiSFpsWkNCMllXeDFaU0JtY205dElIUm9aU0J3Y205dGFYTmxJR0Z1WkNCMGFHVWdaWGh3WldOMFpXUWdiMjVsTGlCSmRDQmpZVzRnWW1VZ2MyVmxiaWNzWEc0Z0lDQWdJQ0FuWVhNZ1lTQnphRzl5ZEdOMWRDQm1iM0lnWUM1eVpYTnZiSFpsY3k1bGNTaGxlSEJsWTNSbFpDbGdMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaV052YldVZ2Uzc2daWGh3WldOMFpXUWdmWDBuTEZ4dUlDQWdJR1poYVd3NklDZDNZWE1nZTNzZ1lXTjBkV0ZzSUgxOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tDRnBjMUJ5YjIxcGMyVW9ZV04wZFdGc0tTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdKMmx6SUc1dmRDQmhJSEJ5YjIxcGMyVTZJSHQ3WVdOMGRXRnNmWDBuTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCeVpYUjFjbTRnWm5WdVkzUnBiMjRnS0hKbGMyOXNkbVZ5S1NCN1hHNGdJQ0FnSUNBZ0lDOHZJRTFoYTJVZ2FYUWdZWE41Ym1OY2JpQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNHRjFjMlVvS1R0Y2JseHVJQ0FnSUNBZ0lDQXZMeUJCZEhSaFkyZ2dkRzhnZEdobElIQnliMjFwYzJVZ2NtVnpiMngxZEdsdmJseHVJQ0FnSUNBZ0lDQmhZM1IxWVd3dWRHaGxiaWhjYmlBZ0lDQWdJQ0FnSUNCbWRXNWpkR2x2YmlBb2RtRnNkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUZkb1pXNGdkR2hsSUdWeGRXRnNhWFI1SUhOMVkyTmxaV1J6SUdwMWMzUWdhMlZsY0NCeVpYTnZiSFpwYm1kY2JpQWdJQ0FnSUNBZ0lDQWdJSFpoY2lCeVpYTjFiSFFnUFNCZkxtbHpSWEYxWVd3b2RtRnNkV1VzSUdWNGNHVmpkR1ZrS1NBL0lIVnVaR1ZtYVc1bFpDQTZJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y21WemRXMWxLSFpoYkhWbExDQnlaWE4xYkhRcE8xeHVJQ0FnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUNBZ2NtVnpkVzFsS0hKbGMyOXNkbVZ5TENCbVlXeHpaU2xjYmlBZ0lDQWdJQ0FnS1R0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa08xeHVJQ0FnSUNBZ2ZUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdjbVZxWldOMGN6b2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKM0psYW1WamRHVmtKeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEJkSFJoWTJnZ2RHaGxJRzFoZEdOb1pYSWdkRzhnWVNCd2NtOXRhWE5sSUhaaGJIVmxJQ2hRY205dGFYTmxjeTlCS3lrZ2RHOGdZMjl1ZEdsdWRXVWdZWEJ3YkhscGJtY25MRnh1SUNBZ0lDQWdKM1JvWlNCamFHRnBiaUJ2WmlCdFlYUmphR1Z5Y3lCdmJtTmxJSFJvWlNCd2NtOXRhWE5sSUdoaGN5QmlaV1Z1SUhKbGFtVmpkR1ZrTENCdGRYUmhkR2x1WnlCMGFHVW5MRnh1SUNBZ0lDQWdKM1poYkhWbElIUnZJR0psWTI5dFpTQjBhR1VnY21WcVpXTjBaV1FnWlhKeWIzSXVKeXhjYmlBZ0lDQWdJQ2RKZENCM2FXeHNJR1poYVd3Z2FXWWdkR2hsSUhaaGJIVmxJR2x6SUc1dmRDQmhJSEJ5YjIxcGMyVWdLRzV2SUM1MGFHVnVJRzFsZEdodlpDa2diM0lnZEdobEp5eGNiaUFnSUNBZ0lDZHdjbTl0YVhObElHbHpJR0ZqZEhWaGJHeDVJR1oxYkdacGJHeGxaQzRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbmRHOGdZbVVnWVNCeVpXcGxZM1JsWkNCd2NtOXRhWE5sSnl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUdaMWJHWnBiR3hsWkNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdhV1lnS0NGcGMxQnliMjFwYzJVb1lXTjBkV0ZzS1NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0oybHpJRzV2ZENCaElIQnliMjFwYzJVNklIdDdZV04wZFdGc2ZYMG5PMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdablZ1WTNScGIyNGdLSEpsYzI5c2RtVnlLU0I3WEc0Z0lDQWdJQ0FnSUM4dklFVnVkR1Z5SUdGemVXNWpJRzF2WkdWY2JpQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNHRjFjMlVvS1R0Y2JseHVJQ0FnSUNBZ0lDQmhZM1IxWVd3dWRHaGxiaWhjYmlBZ0lDQWdJQ0FnSUNCeVpYTjFiV1VvY21WemIyeDJaWElzSUdaaGJITmxLU3hjYmlBZ0lDQWdJQ0FnSUNCeVpYTjFiV1VvY21WemIyeDJaWElwWEc0Z0lDQWdJQ0FnSUNrN1hHNWNiaUFnSUNBZ0lDQWdMeThnVW1sbmFIUWdibTkzSUhkbElHUnZiaWQwSUd0dWIzY2dhV1lnZEdobElHVjRjSEpsYzNOcGIyNGdhWE1nZG1Gc2FXUmNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpEdGNiaUFnSUNBZ0lIMDdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JuMHBPMXh1SWwxOSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ18nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ18nXSA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgYSB2YWx1ZSBjcmVhdGluZyBmb3JrcyBmb3IgZWFjaCBlbGVtZW50LCBoYW5kbGluZ1xuLy8gYXN5bmMgZXhwZWN0YXRpb25zIGlmIG5lZWRlZC5cbmZ1bmN0aW9uIGZvcmtlciAocmVzb2x2ZXIsIGFjdHVhbCwgaXRlcmF0b3IsIHN0b3ApIHtcbiAgdmFyIGJyYW5jaGVzID0gXy5zaXplKGFjdHVhbCk7XG4gIHZhciByZXN1bHQgPSBpdGVyYXRvcihhY3R1YWwsIGZ1bmN0aW9uICh2YWx1ZSkge1xuXG4gICAgdmFyIGZvcmsgPSByZXNvbHZlci5mb3JrKCk7XG5cbiAgICB2YXIgcGFydGlhbCA9IGZvcmsodmFsdWUpO1xuXG4gICAgLy8gU3RvcCBpdGVyYXRpbmcgYXMgc29vbiBhcyBwb3NzaWJsZVxuICAgIGlmIChwYXJ0aWFsID09PSBzdG9wKSB7XG4gICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgcmV0dXJuIHN0b3A7XG4gICAgfVxuXG4gICAgaWYgKHBhcnRpYWwgPT09ICFzdG9wKSB7XG4gICAgICBicmFuY2hlcyAtPSAxO1xuICAgICAgaWYgKDAgPT09IGJyYW5jaGVzKSB7XG4gICAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICB9XG4gICAgICByZXR1cm4gIXN0b3A7XG4gICAgfVxuXG4gICAgLy8gQXN5bmMgc3VwcG9ydFxuICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmliZSB0byB0aGUgZm9yaydzIGZpbmFsIHJlc3VsdFxuICAgIGZvcmsuZmluYWxpemUoZnVuY3Rpb24gKGZpbmFsKSB7XG4gICAgICAvLyBXZSdyZSBkb25lIHRoZSBtb21lbnQgb25lIGlzIGEgc3RvcCByZXN1bHRcbiAgICAgIGlmIChmaW5hbCA9PT0gc3RvcCkge1xuICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgc3RvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmFuY2hlcyAtPSAxO1xuICAgICAgICBpZiAoMCA9PT0gYnJhbmNoZXMpIHtcbiAgICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCAhc3RvcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmaW5hbDtcbiAgICB9KTtcblxuICAgIHJldHVybiAhc3RvcDsgIC8vIGtlZXAgaXRlcmF0aW5nXG4gIH0pO1xuXG4gIC8vIFdoZW4gdGhlIGZvcmtzIGNvbXBsZXRlZCBzeW5jaHJvbm91c2x5IGp1c3QgZmluYWxpemUgdGhlIHJlc29sdmVyXG4gIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHJlc3VsdCk7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5cbi8vIFF1YW50aWZpZXJzXG5hc3MucmVnaXN0ZXIoe1xuXG4gIGV2ZXJ5OiB7XG4gICAgYWxpYXNlczogWyAnYWxsJywgJ2FsbE9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdhbGwgb2YgdGhlbSBzdWNjZWVkJ1xuICAgIF0sXG4gICAgZGVzYzogJ0ZvciBldmVyeSBvbmU6JyxcbiAgICBmYWlsOiAnb25lIGRpZG5cXCd0JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBzdHVmZiB0byBkb1xuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvcmtlcihyZXNvbHZlciwgYWN0dWFsLCBfLmV2ZXJ5LCBmYWxzZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBzb21lOiB7XG4gICAgYWxpYXNlczogWyAnYW55T2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ2F0IGxlYXN0IG9uZSBvZiB0aGVtIHN1Y2NlZWRzJ10sXG4gICAgZGVzYzogJ0F0IGxlYXN0IG9uZTonLFxuICAgIGZhaWw6ICdub25lIGRpZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5zb21lLCB0cnVlKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIG5vbmU6IHtcbiAgICBhbGlhc2VzOiBbICdub25lT2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ25vbmUgb2YgdGhlbSBzdWNjZWVkLidcbiAgICBdLFxuICAgIGRlc2M6ICdOb25lIG9mIHRoZW06JyxcbiAgICBmYWlsOiAnb25lIGRpZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGFyZSBnb2luZyB0byB1c2UgdGhlIHNhbWUgYWxnb3JpdGhtIGFzIGZvciAuc29tZSBidXQgd2UnbGwgbmVnYXRlXG4gICAgICAgIC8vIGl0cyByZXN1bHQgdXNpbmcgYSBmaW5hbGl6ZXIuXG4gICAgICAgIHJlc29sdmVyLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgICAgIHJldHVybiAhZmluYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5zb21lLCB0cnVlKTtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTl0WVhSamFHVnljeTl4ZFdGdWRHbG1hV1Z5Y3k1cWN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU8wRkJRVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdYeUE5SUNoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnZDJsdVpHOTNXeWRmSjEwZ09pQjBlWEJsYjJZZ1oyeHZZbUZzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z1oyeHZZbUZzV3lkZkoxMGdPaUJ1ZFd4c0tUdGNibHh1ZG1GeUlHRnpjeUE5SUhKbGNYVnBjbVVvSnk0dUwyRnpjeWNwTzF4dVhHNWNiaTh2SUVobGJIQmxjaUJtZFc1amRHbHZiaUIwYnlCcGRHVnlZWFJsSUdFZ2RtRnNkV1VnWTNKbFlYUnBibWNnWm05eWEzTWdabTl5SUdWaFkyZ2daV3hsYldWdWRDd2dhR0Z1Wkd4cGJtZGNiaTh2SUdGemVXNWpJR1Y0Y0dWamRHRjBhVzl1Y3lCcFppQnVaV1ZrWldRdVhHNW1kVzVqZEdsdmJpQm1iM0pyWlhJZ0tISmxjMjlzZG1WeUxDQmhZM1IxWVd3c0lHbDBaWEpoZEc5eUxDQnpkRzl3S1NCN1hHNGdJSFpoY2lCaWNtRnVZMmhsY3lBOUlGOHVjMmw2WlNoaFkzUjFZV3dwTzF4dUlDQjJZWElnY21WemRXeDBJRDBnYVhSbGNtRjBiM0lvWVdOMGRXRnNMQ0JtZFc1amRHbHZiaUFvZG1Gc2RXVXBJSHRjYmx4dUlDQWdJSFpoY2lCbWIzSnJJRDBnY21WemIyeDJaWEl1Wm05eWF5Z3BPMXh1WEc0Z0lDQWdkbUZ5SUhCaGNuUnBZV3dnUFNCbWIzSnJLSFpoYkhWbEtUdGNibHh1SUNBZ0lDOHZJRk4wYjNBZ2FYUmxjbUYwYVc1bklHRnpJSE52YjI0Z1lYTWdjRzl6YzJsaWJHVmNiaUFnSUNCcFppQW9jR0Z5ZEdsaGJDQTlQVDBnYzNSdmNDa2dlMXh1SUNBZ0lDQWdjbVZ6YjJ4MlpYSXVhbTlwYmlobWIzSnJLVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQnpkRzl3TzF4dUlDQWdJSDFjYmx4dUlDQWdJR2xtSUNod1lYSjBhV0ZzSUQwOVBTQWhjM1J2Y0NrZ2UxeHVJQ0FnSUNBZ1luSmhibU5vWlhNZ0xUMGdNVHRjYmlBZ0lDQWdJR2xtSUNnd0lEMDlQU0JpY21GdVkyaGxjeWtnZTF4dUlDQWdJQ0FnSUNCeVpYTnZiSFpsY2k1cWIybHVLR1p2Y21zcE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2NtVjBkWEp1SUNGemRHOXdPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHZJRUZ6ZVc1aklITjFjSEJ2Y25SY2JpQWdJQ0JwWmlBb0lYSmxjMjlzZG1WeUxuQmhkWE5sWkNrZ2UxeHVJQ0FnSUNBZ2NtVnpiMngyWlhJdWNHRjFjMlVvS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2THlCVGRXSnpZM0pwWW1VZ2RHOGdkR2hsSUdadmNtc25jeUJtYVc1aGJDQnlaWE4xYkhSY2JpQWdJQ0JtYjNKckxtWnBibUZzYVhwbEtHWjFibU4wYVc5dUlDaG1hVzVoYkNrZ2UxeHVJQ0FnSUNBZ0x5OGdWMlVuY21VZ1pHOXVaU0IwYUdVZ2JXOXRaVzUwSUc5dVpTQnBjeUJoSUhOMGIzQWdjbVZ6ZFd4MFhHNGdJQ0FnSUNCcFppQW9abWx1WVd3Z1BUMDlJSE4wYjNBcElIdGNiaUFnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVhbTlwYmlobWIzSnJLVHRjYmlBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y21WemRXMWxLRzUxYkd3c0lITjBiM0FwTzF4dUlDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnWW5KaGJtTm9aWE1nTFQwZ01UdGNiaUFnSUNBZ0lDQWdhV1lnS0RBZ1BUMDlJR0p5WVc1amFHVnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWFtOXBiaWhtYjNKcktUdGNiaUFnSUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTV5WlhOMWJXVW9iblZzYkN3Z0lYTjBiM0FwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNCOVhHNGdJQ0FnSUNCeVpYUjFjbTRnWm1sdVlXdzdYRzRnSUNBZ2ZTazdYRzVjYmlBZ0lDQnlaWFIxY200Z0lYTjBiM0E3SUNBdkx5QnJaV1Z3SUdsMFpYSmhkR2x1WjF4dUlDQjlLVHRjYmx4dUlDQXZMeUJYYUdWdUlIUm9aU0JtYjNKcmN5QmpiMjF3YkdWMFpXUWdjM2x1WTJoeWIyNXZkWE5zZVNCcWRYTjBJR1pwYm1Gc2FYcGxJSFJvWlNCeVpYTnZiSFpsY2x4dUlDQnBaaUFvSVhKbGMyOXNkbVZ5TG5CaGRYTmxaQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQnlaWE52YkhabGNpNW1hVzVoYkdsNlpTaHlaWE4xYkhRcE8xeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpEdGNibjFjYmx4dVhHNHZMeUJSZFdGdWRHbG1hV1Z5YzF4dVlYTnpMbkpsWjJsemRHVnlLSHRjYmx4dUlDQmxkbVZ5ZVRvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oyRnNiQ2NzSUNkaGJHeFBaaWNnWFN4Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5RWEJ3YkdsbGN5QnRZWFJqYUdWeWN5QjBieUJoYkd3Z2RHaGxJR1ZzWlcxbGJuUnpJR2x1SUdFZ1kyOXNiR1ZqZEdsdmJpQmxlSEJsWTNScGJtY2dkR2hoZENjc1hHNGdJQ0FnSUNBbllXeHNJRzltSUhSb1pXMGdjM1ZqWTJWbFpDZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2RHYjNJZ1pYWmxjbmtnYjI1bE9pY3NYRzRnSUNBZ1ptRnBiRG9nSjI5dVpTQmthV1J1WEZ3bmRDY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2h5WlhOdmJIWmxjaWtnZTF4dUlDQWdJQ0FnSUNBdkx5QlRhRzl5ZEdOMWRDQjNhR1Z1SUhSb1pYSmxJR2x6SUc1dklHMXZjbVVnYzNSMVptWWdkRzhnWkc5Y2JpQWdJQ0FnSUNBZ2FXWWdLSEpsYzI5c2RtVnlMbVY0YUdGMWMzUmxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCeVpYTnZiSFpsY2k1bWFXNWhiR2w2WlNoMGNuVmxLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCbWIzSnJaWElvY21WemIyeDJaWElzSUdGamRIVmhiQ3dnWHk1bGRtVnllU3dnWm1Gc2MyVXBPMXh1SUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnYzI5dFpUb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMkZ1ZVU5bUp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkQmNIQnNhV1Z6SUcxaGRHTm9aWEp6SUhSdklHRnNiQ0IwYUdVZ1pXeGxiV1Z1ZEhNZ2FXNGdZU0JqYjJ4c1pXTjBhVzl1SUdWNGNHVmpkR2x1WnlCMGFHRjBKeXhjYmlBZ0lDQWdJQ2RoZENCc1pXRnpkQ0J2Ym1VZ2IyWWdkR2hsYlNCemRXTmpaV1ZrY3lkZExGeHVJQ0FnSUdSbGMyTTZJQ2RCZENCc1pXRnpkQ0J2Ym1VNkp5eGNiaUFnSUNCbVlXbHNPaUFuYm05dVpTQmthV1FuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNBZ0lDQWdMeThnVTJodmNuUmpkWFFnZDJobGJpQjBhR1Z5WlNCcGN5QnVieUJ0YjNKbElITjBkV1ptSUhSdklHUnZYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTnZiSFpsY2k1bGVHaGhkWE4wWldRcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSXVabWx1WVd4cGVtVW9kSEoxWlNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdabTl5YTJWeUtISmxjMjlzZG1WeUxDQmhZM1IxWVd3c0lGOHVjMjl0WlN3Z2RISjFaU2s3WEc0Z0lDQWdJQ0I5TzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCdWIyNWxPaUI3WEc0Z0lDQWdZV3hwWVhObGN6b2dXeUFuYm05dVpVOW1KeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEJjSEJzYVdWeklHMWhkR05vWlhKeklIUnZJR0ZzYkNCMGFHVWdaV3hsYldWdWRITWdhVzRnWVNCamIyeHNaV04wYVc5dUlHVjRjR1ZqZEdsdVp5QjBhR0YwSnl4Y2JpQWdJQ0FnSUNkdWIyNWxJRzltSUhSb1pXMGdjM1ZqWTJWbFpDNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuVG05dVpTQnZaaUIwYUdWdE9pY3NYRzRnSUNBZ1ptRnBiRG9nSjI5dVpTQmthV1FuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNBZ0lDQWdMeThnVTJodmNuUmpkWFFnZDJobGJpQjBhR1Z5WlNCcGN5QnVieUJ0YjNKbElITjBkV1ptSUhSdklHUnZYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTnZiSFpsY2k1bGVHaGhkWE4wWldRcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSXVabWx1WVd4cGVtVW9kSEoxWlNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0F2THlCWFpTQmhjbVVnWjI5cGJtY2dkRzhnZFhObElIUm9aU0J6WVcxbElHRnNaMjl5YVhSb2JTQmhjeUJtYjNJZ0xuTnZiV1VnWW5WMElIZGxKMnhzSUc1bFoyRjBaVnh1SUNBZ0lDQWdJQ0F2THlCcGRITWdjbVZ6ZFd4MElIVnphVzVuSUdFZ1ptbHVZV3hwZW1WeUxseHVJQ0FnSUNBZ0lDQnlaWE52YkhabGNpNW1hVzVoYkdsNlpTaG1kVzVqZEdsdmJpQW9abWx1WVd3cElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdJV1pwYm1Gc08xeHVJQ0FnSUNBZ0lDQjlLVHRjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWm05eWEyVnlLSEpsYzI5c2RtVnlMQ0JoWTNSMVlXd3NJRjh1YzI5dFpTd2dkSEoxWlNrN1hHNGdJQ0FnSUNCOU8xeHVJQ0FnSUgxY2JpQWdmVnh1WEc1OUtUdGNiaUpkZlE9PSIsInZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cblxudmFyIGNoZWNrQ2hhaW4gPSBuZXcgQ2hhaW4oKTtcblxuXG5leHBvcnRzLmxvZGFzaCA9IGZ1bmN0aW9uIChfKSB7XG4gIC8vIEV4aXQgaWYgYWxyZWFkeSBwYXRjaGVkXG4gIGlmIChfLmNyZWF0ZUNhbGxiYWNrKGNoZWNrQ2hhaW4pID09PSBjaGVja0NoYWluLnRlc3QpIHtcbiAgICByZXR1cm4gXztcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIGxvZGFzaCdzIGRlZmF1bHQgY3JlYXRlQ2FsbGJhY2sgbWVjaGFuaXNtIHRvIG1ha2UgaXQgdW5kZXJzdGFuZFxuICAvLyBhYm91dCBvdXIgZXhwcmVzc2lvbiBjaGFpbnMuXG4gIF8uY3JlYXRlQ2FsbGJhY2sgPSBfLndyYXAoXy5jcmVhdGVDYWxsYmFjaywgZnVuY3Rpb24ob3JpZywgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICBpZiAoQ2hhaW4uaXNDaGFpbihjYWxsYmFjaykpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjay50ZXN0O1xuICAgIH1cblxuICAgIC8vIFN1cHBvcnQgXy53aGVyZSBzdHlsZS4gSXQncyBub3QgYXMgZmFzdCBhcyB0aGUgb3JpZ2luYWwgb25lIHNpbmNlIHdlXG4gICAgLy8gaGF2ZSB0byBnbyB2aWEgXy5pc0VxdWFsIGluc3RlYWQgb2YgdXNpbmcgdGhlIGludGVybmFsIGZ1bmN0aW9uXG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdChjYWxsYmFjaykpIHtcbiAgICAgIHZhciBwcm9wcyA9IF8ua2V5cyhjYWxsYmFjayk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICBpZiAobnVsbCA9PSBvYmplY3QpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlLCBsZW5ndGggPSBwcm9wcy5sZW5ndGgsIGtleTtcbiAgICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgICAga2V5ID0gcHJvcHNbbGVuZ3RoXTtcbiAgICAgICAgICAvLyBGYWlsIHdoZW4gdGhlIGtleSBpcyBub3QgZXZlbiBwcmVzZW50XG4gICAgICAgICAgaWYgKCEoa2V5IGluIG9iamVjdCkpIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXN1bHQgPSBfLmlzRXF1YWwob2JqZWN0W2tleV0sIGNhbGxiYWNrW2tleV0pO1xuICAgICAgICAgIGlmICghcmVzdWx0KSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3JpZyhjYWxsYmFjaywgdGhpc0FyZyk7XG4gIH0pO1xuXG4gIC8vIE92ZXJyaWRlIGxvZGFzaCdzIGRlZmF1bHQgaXNFcXVhbCBpbXBsZW1lbnRhdGlvbiBzbyBpdCB1bmRlcnN0YW5kc1xuICAvLyBhYm91dCBleHByZXNzaW9uIGNoYWlucy5cbiAgZnVuY3Rpb24gY21wIChhLCBiKSB7XG4gICAgcmV0dXJuIENoYWluLmlzQ2hhaW4oYSkgPyBhLnRlc3QoYikgOiBDaGFpbi5pc0NoYWluKGIpID8gYi50ZXN0KGEpIDogdW5kZWZpbmVkO1xuICB9XG4gIF8uaXNFcXVhbCA9IF8ud3JhcChfLmlzRXF1YWwsIGZ1bmN0aW9uIChvcmlnLCBhLCBiLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHZhciByZXN1bHQgPSBjYWxsYmFjayA/IGNhbGxiYWNrLmNhbGwodGhpc0FyZyB8fCB0aGlzLCBhLCBiKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJlc3VsdCA9IG9yaWcoYSwgYiwgY21wLCB0aGlzQXJnKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG5cbiAgcmV0dXJuIF87XG59O1xuXG5cbmV4cG9ydHMuc2lub24gPSBmdW5jdGlvbiAoc2lub24pIHtcbiAgLy8gRXhpdCBpZiBhbHJlYWR5IHBhdGNoZWRcbiAgaWYgKHNpbm9uLm1hdGNoLmlzTWF0Y2hlcihjaGVja0NoYWluKSkge1xuICAgIHJldHVybiBzaW5vbjtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIFNpbm9uJ3MgLmlzTWF0Y2hlciBpbXBsZW1lbnRhdGlvbiB0byBhbGxvdyBvdXIgZXhwcmVzc2lvbnMgdG8gYmVcbiAgLy8gdHJhbnNwYXJlbnRseSBzdXBwb3J0ZWQgYnkgaXQuXG4gIHZhciBvbGRJc01hdGNoZXIgPSB1dGlsLmJpbmQoc2lub24ubWF0Y2guaXNNYXRjaGVyLCBzaW5vbi5tYXRjaCk7XG4gIHNpbm9uLm1hdGNoLmlzTWF0Y2hlciA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gQ2hhaW4uaXNDaGFpbihvYmopIHx8IG9sZElzTWF0Y2hlcihvYmopO1xuICB9O1xuXG4gIHJldHVybiBzaW5vbjtcbn07XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLy8gVXNlIGEgY2FwcGVkIHBvb2wsIHRoZSByZWxlYXNpbmcgYWxnb3JpdGhtIGlzIHByZXR0eSBzb2xpZCBzbyB3ZSBzaG91bGRcbi8vIGhhdmUgYSBnb29kIHJlLXVzZSByYXRpbyB3aXRoIGp1c3QgYSBmZXcgaW4gdGhlIHBvb2wuIFRoZW4gaW4gY2FzZVxuLy8gc29tZXRoaW5nIGdvZXMgd3JvbmcgdGhlIEdDIHdpbGwgdGFrZSBjYXJlIG9mIGl0IGFmdGVyIGEgd2hpbGUuXG52YXIgcG9vbCA9IHV0aWwuQ2FwcGVkUG9vbCgxMDApO1xudmFyIGNyZWF0ZWQgPSAwO1xuXG5cbi8vIEluc3RhbnRpYXRlcyBhIG5ldyByZXNvbHZlciBmdW5jdG9yXG5mdW5jdGlvbiBmYWN0b3J5ICgpIHtcbiAgLy8gSnVzdCBmb3J3YXJkcyB0aGUgY2FsbCB0byB0aGUgcmVzb2x2ZXIgYnkgc2V0dGluZyBpdHNlbGYgYXMgY29udGV4dC5cbiAgZnVuY3Rpb24gZm4gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyLmNhbGwoZm4sIHZhbHVlKTtcbiAgfVxuXG4gIGZuLmlkID0gKytjcmVhdGVkO1xuXG4gIC8vIFRoZSBzdGF0ZSBpcyBhdHRhY2hlZCB0byB0aGUgZnVuY3Rpb24gb2JqZWN0IHNvIGl0J3MgYXZhaWxhYmxlIHRvIHRoZVxuICAvLyBzdGF0ZS1sZXNzIGZ1bmN0aW9ucyB3aGVuIHJ1bm5pbmcgdW5kZXIgYHRoaXMuYC5cbiAgZm4uY2hhaW4gPSBudWxsO1xuICBmbi5wYXJlbnQgPSBudWxsO1xuICBmbi5wYXVzZWQgPSBmYWxzZTtcbiAgZm4ucmVzb2x2ZWQgPSBbXTtcbiAgZm4uZmluYWxpemVycyA9IFtdO1xuXG4gIC8vIEV4cG9zZSB0aGUgYmVoYXZpb3VyIGluIHRoZSBmdW5jdG9yXG4gIGZuLnBhdXNlID0gcGF1c2U7XG4gIGZuLnJlc3VtZSA9IHJlc3VtZTtcbiAgZm4uZm9yayA9IGZvcms7XG4gIGZuLmpvaW4gPSBqb2luO1xuICBmbi5maW5hbGl6ZSA9IGZpbmFsaXplO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwgJ2V4aGF1c3RlZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlc29sdmVkLmxlbmd0aCA+PSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX18ubGVuZ3RoO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGZuO1xufVxuXG4vLyBUaGlzIGlzIHRoZSBjb3JlIHJlc29sdXRpb24gYWxnb3JpdGhtLCBpdCBvcGVyYXRlcyBvdmVyIHRoZSBjaGFpblxuLy8gb2YgZXhwZWN0YXRpb25zIGNoZWNraW5nIHRoZW0gb25lIGFmdGVyIHRoZSBvdGhlciBhZ2FpbnN0IGEgdmFsdWUuXG4vLyBJZiBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGl0J2xsIGJlIGltbWVkaWF0ZWx5IGNhbGxlZCB1c2luZyB0aGVcbi8vIGV4cGVjdGF0aW9uIGluc3RhbmNlIGFzIGNvbnRleHQgYW5kIHBhc3NpbmcgYXMgb25seSBhcmd1bWVudCB0aGVcbi8vIGN1cnJlbnQgcmVzb2x2ZSBmdW5jdGlvbiwgdGhpcyBhbGxvd3MgYW4gZXhwZWN0YXRpb24gdG8gb3ZlcnJpZGVcbi8vIHRoZSB2YWx1ZSBhbmQvb3IgY29udHJvbCB0aGUgcmVzb2x1dGlvbiB3aXRob3V0IGV4cG9zaW5nIHRvbyBtYW55XG4vLyBpbnRlcm5hbCBkZXRhaWxzLlxuLy8gV2hlbiBpdCByZXR1cm5zIGB1bmRlZmluZWRgIGl0IGp1c3QgbWVhbnMgdGhhdCB0aGUgcmVzb2x1dGlvbiB3YXNcbi8vIHBhdXNlZCAoYXN5bmMpLCB3ZSBjYW4gbm90IG9idGFpbiBhIGZpbmFsIHJlc3VsdCB1c2luZyBhIHN5bmNocm9ub3VzXG4vLyBjYWxsLiBUaGlzIGNhbiBiZSB1c2VkIGJ5IG1hdGNoZXJzIHdoZW4gdGFraW5nIG92ZXIgdGhlIHJlc29sdXRpb24gdG9cbi8vIGtub3cgaWYgdGhleSBuZWVkIHRvIG1hbmdsZSB0aGUgcmVzdWx0cyBvciB0aGV5IGhhdmUgdG8gcmVnaXN0ZXIgYVxuLy8gZmluYWxpemVyIHRvIGJlIG5vdGlmaWVkIG9mIHRoZSBmaW5hbCByZXN1bHQgZnJvbSB0aGUgY2hhaW4uXG5mdW5jdGlvbiByZXNvbHZlciAodmFsdWUpIHtcbiAgdmFyIGxpc3QsIHJlc3VsdCwgZXhwO1xuXG4gIGxpc3QgPSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX187XG4gIG9mZnNldCA9IHRoaXMucmVzb2x2ZWQubGVuZ3RoO1xuICByZXN1bHQgPSB0cnVlO1xuXG4gIGZvciAodmFyIGkgPSBvZmZzZXQ7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gQ3JlYXRlIGEgbmV3IG9iamVjdCBpbmhlcml0aW5nIGZyb20gdGhlIGV4cGVjdGF0aW9uIGJ1dCB3aXRoIHRoZVxuICAgIC8vIGN1cnJlbnQgYWN0dWFsIHZhbHVlIHByb3Zpc2lvbmVkLiBJdCBhbGxvd3MgdGhlIGV4cHJlc3Npb24gdG8gbXV0YXRlXG4gICAgLy8gaXRzIHN0YXRlIGZvciB0aGlzIGV4ZWN1dGlvbiBidXQgbm90IGFmZmVjdCBvdGhlciB1c2VzIG9mIGl0LlxuICAgIGV4cCA9IHV0aWwuY3JlYXRlKGxpc3RbaV0sIHsgYWN0dWFsOiB2YWx1ZSB9KTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgcmVzb2x2ZWQgZXhwZWN0YXRpb25zXG4gICAgdGhpcy5yZXNvbHZlZC5wdXNoKGV4cCk7XG5cbiAgICAvLyBFeGVjdXRlIHRoZSBleHBlY3RhdGlvbiB0byBvYnRhaW4gaXRzIHJlc3VsdFxuICAgIHJlc3VsdCA9IGV4cC5yZXN1bHQgPSBleHAucmVzb2x2ZSgpO1xuXG4gICAgLy8gQWxsb3cgZXhwZWN0YXRpb25zIHRvIHRha2UgY29udHJvbCBmb3IgdGhlIHJlbWFpbmluZyBvZiB0aGUgY2hhaW5cbiAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gU2luY2UgdGhlIGNvbnRyb2wgaXMgZGVsZWdhdGVkIHRvIHRoZSBleHByZXNzaW9uIHdlIGRvbid0IGhhdmUgdG9cbiAgICAgIC8vIGRvIGFueXRoaW5nIG1vcmUgaGVyZS5cbiAgICAgIGV4cC5yZXN1bHQgPSByZXN1bHQuY2FsbChleHAsIHRoaXMpO1xuICAgICAgcmV0dXJuIGV4cC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgLy8gU3RvcCBvbiBmaXJzdCBmYWlsdXJlXG4gICAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgd2UganVzdCBuZWVkIHRvIGFwcGx5IGFueSBwZW5kaW5nIGZpbmFsaXplcnNcbiAgcmV0dXJuIHRoaXMuZmluYWxpemUocmVzdWx0KTtcbn1cblxuXG4vLyBXaGVuIHJlc29sdmluZyBhc3luYyBmbG93cyAoaS5lLjogcHJvbWlzZXMpIHRoaXMgd2lsbCBwYXVzZSB0aGUgZ2l2ZW5cbi8vIHJlc29sdmVyIHVudGlsIGEgY2FsbCB0byAucmVzdW1lKCkgaXMgbWFkZS5cbmZ1bmN0aW9uIHBhdXNlICgpIHtcbiAgaWYgKHRoaXMucGF1c2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHZlciBhbHJlYWR5IHBhdXNlZCcpO1xuICB9XG5cbiAgdGhpcy5wYXVzZWQgPSB0cnVlO1xufVxuXG4vLyBPbmNlIHRoZSBhc3luYyBmbG93IGhhcyBjb21wbGV0ZWQgd2UgY2FuIGNvbnRpbnVlIHJlc29sdmluZyB3aGVyZSB3ZVxuLy8gc3RvcGVkLiBXaGVuIHRoZSBvdmVycmlkZSBwYXJhbSBpcyBub3QgdW5kZWZpbmVkIHdlJ2xsIHNraXAgY2FsbGluZyB0aGVcbi8vIHJlc29sdmVyIGFuZCBhc3N1bWUgdGhhdCBib29sIGFzIHRoZSBmaW5hbCByZXN1bHQuIFRoaXMgYWxsb3dzIHRoZSBhc3luY1xuLy8gY29kZSB0byBzaG9ydGN1dCB0aGUgcmVzb2x2ZXIuXG5mdW5jdGlvbiByZXN1bWUgKGFjdHVhbCwgb3ZlcnJpZGUpIHtcbiAgaWYgKCF0aGlzLnBhdXNlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVzb2x2ZXIgaXMgbm90IGN1cnJlbnRseSBwYXVzZWQnKTtcbiAgfVxuXG4gIHRoaXMucGF1c2VkID0gZmFsc2U7XG5cbiAgLy8gQSBmaW5hbCByZXN1bHQgd2FzIHByb3ZpZGVkIHNvIGp1c3QgZmluYWxpemUgdGhlIHJlc29sdmVyXG4gIGlmIChvdmVycmlkZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuZmluYWxpemUob3ZlcnJpZGUpO1xuICB9XG5cbiAgLy8gTGV0J3MgY29udGludWUgcmVzb2x2aW5nIHdpdGggdGhlIG5ldyB2YWx1ZVxuICAvLyBOb3RlOiB0aGlzKCkgbG9va3Mgd2VpcmQgYnV0IHJlbWVtYmVyIHdlJ3JlIHVzaW5nIGEgZnVuY3Rpb24gYXMgY29udGV4dFxuICByZXR1cm4gdGhpcyhhY3R1YWwpO1xufVxuXG4vLyBDbG9uZXMgdGhlIGN1cnJlbnQgcmVzb2x2ZXIgc28gd2UgY2FuIGZvcmsgYW5kIGRpc2NhcmQgb3BlcmF0aW9ucy5cbmZ1bmN0aW9uIGZvcmsgKCkge1xuICB2YXIgYnJhbmNoID0gYWNxdWlyZSh0aGlzLmNoYWluKTtcbiAgYnJhbmNoLnBhcmVudCA9IHRoaXM7XG4gIGJyYW5jaC5yZXNvbHZlZCA9IF8ucmVqZWN0KHRoaXMucmVzb2x2ZWQsIEFycmF5LmlzQXJyYXkpO1xuICByZXR1cm4gYnJhbmNoO1xufVxuXG4vLyBBc3N1bWUgdGhlIHJlc3VsdHMgZnJvbSBhIGZvcmsgaW4gdGhlIG1haW4gcmVzb2x2ZXJcbmZ1bmN0aW9uIGpvaW4gKGZvcmspIHtcbiAgdmFyIGxlbiA9IF8ucmVqZWN0KHRoaXMucmVzb2x2ZWQsIEFycmF5LmlzQXJyYXkpLmxlbmd0aDtcbiAgdGhpcy5yZXNvbHZlZC5wdXNoKFxuICAgIGZvcmsucmVzb2x2ZWQuc2xpY2UobGVuKVxuICApO1xufVxuXG4vLyBXaGVuIHRoZSBhcmd1bWVudCBpcyBhIGZ1bmN0aW9uIGl0IGdldHMgcmVnaXN0ZXJlZCBhcyBhIGZpbmFsaXplciBmb3IgdGhlXG4vLyByZXN1bHQgb2J0YWluZWQgb25jZSB0aGUgZXhwcmVzc2lvbiBoYXMgYmVlbiBmdWxseSByZXNvbHZlZCAoaS5lLiBhc3luYykuXG4vLyBPdGhlcndpc2UgaXQnbGwgZXhlY3V0ZSBhbnkgcmVnaXN0ZXJlZCBmdW5jdGlvbnMgb24gdGhlIGdpdmVuIHJlc3VsdCBhbmRcbi8vIGFsbG93IHRoZW0gdG8gY2hhbmdlIGl0IGJlZm9yZSByZWxlYXNpbmcgdGhlIHJlc29sdmVyIGludG8gdGhlIHBvb2wuXG5mdW5jdGlvbiBmaW5hbGl6ZShyZXN1bHQpIHtcbiAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLmZpbmFsaXplcnMucHVzaChcbiAgICAgIFtyZXN1bHQsIF8ubGFzdCh0aGlzLnJlc29sdmVkKV1cbiAgICApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIE5vdGhpbmcgeWV0IHRvIGZpbmFsaXplIHNpbmNlIHRoZSByZXN1bHQgaXMgc3RpbGwgdW5rbm93blxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gQWxsb3cgZmluYWxpemVycyB0byB0b2dnbGUgdGhlIHJlc3VsdCAoTElGTyBvcmRlcilcbiAgdmFyIGZpbmFsaXplcjtcbiAgd2hpbGUgKHRoaXMuZmluYWxpemVycy5sZW5ndGggPiAwKSB7XG4gICAgZmluYWxpemVyID0gdGhpcy5maW5hbGl6ZXJzLnBvcCgpO1xuICAgIHJlc3VsdCA9IGZpbmFsaXplclswXS5jYWxsKGZpbmFsaXplclsxXSwgcmVzdWx0KTtcbiAgICBmaW5hbGl6ZXJbMV0ucmVzdWx0ID0gcmVzdWx0O1xuICB9XG5cbiAgLy8gTGV0IHRoZSBjaGFpbiBkaXNwYXRjaCB0aGUgZmluYWwgcmVzdWx0IGJ1dCBvbmx5IGZvciBub24tZm9ya2VkIHJlc29sdmVyc1xuICBpZiAoIXRoaXMucGFyZW50KSB7XG4gICAgdGhpcy5jaGFpbi5kaXNwYXRjaFJlc3VsdCh0aGlzLnJlc29sdmVkLCByZXN1bHQpO1xuICB9XG5cbiAgLy8gV2hlbiBhIGZpbmFsIHJlc3VsdCBoYXMgYmVlbiBvYnRhaW5lZCByZWxlYXNlIHRoZSByZXNvbHZlciB0byB0aGUgcG9vbFxuICBwb29sLnB1c2godGhpcyk7XG4gIGlmIChwb29sLmxlbmd0aCA+IGNyZWF0ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bvb2wgY29ycnVwdGVkISBDcmVhdGVkICcgKyBjcmVhdGVkICsgJyBidXQgdGhlcmUgYXJlICcgKyBwb29sLmxlbmd0aCArICcgcG9vbGVkJyk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBBY3F1aXJlcyBhIHJlc29sdmVyIGZ1bmN0b3IsIGlmIHRoZXJlIGlzIG9uZSBpbiB0aGUgcG9vbCBpdCdsbCBiZSByZXNldCBhbmRcbi8vIHJldXNlZCwgb3RoZXJ3aXNlIGl0J2xsIGNyZWF0ZSBhIG5ldyBvbmUuIFdoZW4geW91J3JlIGRvbmUgd2l0aCB0aGUgcmVzb2x2ZXJcbi8vIHlvdSBzaG91ZCBnaXZlIGl0IHRvIGByZWxlYXNlKClgIHNvIGl0IGNhbiBiZSBpbmNvcnBvcmF0ZWQgdG8gdGhlIHBvb2wuXG4vLyBUaGUgcmVhc29uIGZvciB1c2luZyBhIHBvb2wgb2Ygb2JqZWN0cyBoZXJlIGlzIHRoYXQgZXZlcnkgdGltZSB3ZSBldmFsdWF0ZVxuLy8gYW4gZXhwcmVzc2lvbiB3ZSdsbCBuZWVkIGEgcmVzb2x2ZXIsIHdoZW4gdXNpbmcgcXVhbnRpZmllcnMgbXVsdGlwbGUgZm9ya3Ncbi8vIHdpbGwgYmUgY3JlYXRlZCwgc28gaXQncyBpbXBvcnRhbnQgdG8gaW1wcm92ZSB0aGUgcGVyZm9ybWFuY2UuXG5mdW5jdGlvbiBhY3F1aXJlIChjaGFpbikge1xuICB2YXIgcmVzb2x2ZXIgPSBwb29sLnBvcCgpIHx8IGZhY3RvcnkoKTtcblxuICAvLyBSZXNldCB0aGUgc3RhdGUgb2YgdGhlIHJlc29sdmVyXG4gIHJlc29sdmVyLmNoYWluID0gY2hhaW47XG4gIHJlc29sdmVyLnBhcmVudCA9IG51bGw7XG4gIHJlc29sdmVyLnBhdXNlZCA9IGZhbHNlO1xuICB3aGlsZSAocmVzb2x2ZXIucmVzb2x2ZWQubGVuZ3RoID4gMCkge1xuICAgIHJlc29sdmVyLnJlc29sdmVkLnBvcCgpO1xuICB9XG4gIHdoaWxlIChyZXNvbHZlci5maW5hbGl6ZXJzLmxlbmd0aCA+IDApIHtcbiAgICByZXNvbHZlci5maW5hbGl6ZXJzLnBvcCgpO1xuICB9XG5cbiAgcmV0dXJuIHJlc29sdmVyO1xufVxuXG5cbmV4cG9ydHMuYWNxdWlyZSA9IGFjcXVpcmU7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOXlaWE52YkhabGNuTXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFaUxDSm1hV3hsSWpvaVoyVnVaWEpoZEdWa0xtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJblpoY2lCZklEMGdLSFI1Y0dWdlppQjNhVzVrYjNjZ0lUMDlJRndpZFc1a1pXWnBibVZrWENJZ1B5QjNhVzVrYjNkYkoxOG5YU0E2SUhSNWNHVnZaaUJuYkc5aVlXd2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUJuYkc5aVlXeGJKMThuWFNBNklHNTFiR3dwTzF4dVhHNTJZWElnZFhScGJDQTlJSEpsY1hWcGNtVW9KeTR2ZFhScGJDY3BPMXh1WEc0dkx5QlZjMlVnWVNCallYQndaV1FnY0c5dmJDd2dkR2hsSUhKbGJHVmhjMmx1WnlCaGJHZHZjbWwwYUcwZ2FYTWdjSEpsZEhSNUlITnZiR2xrSUhOdklIZGxJSE5vYjNWc1pGeHVMeThnYUdGMlpTQmhJR2R2YjJRZ2NtVXRkWE5sSUhKaGRHbHZJSGRwZEdnZ2FuVnpkQ0JoSUdabGR5QnBiaUIwYUdVZ2NHOXZiQzRnVkdobGJpQnBiaUJqWVhObFhHNHZMeUJ6YjIxbGRHaHBibWNnWjI5bGN5QjNjbTl1WnlCMGFHVWdSME1nZDJsc2JDQjBZV3RsSUdOaGNtVWdiMllnYVhRZ1lXWjBaWElnWVNCM2FHbHNaUzVjYm5aaGNpQndiMjlzSUQwZ2RYUnBiQzVEWVhCd1pXUlFiMjlzS0RFd01DazdYRzUyWVhJZ1kzSmxZWFJsWkNBOUlEQTdYRzVjYmx4dUx5OGdTVzV6ZEdGdWRHbGhkR1Z6SUdFZ2JtVjNJSEpsYzI5c2RtVnlJR1oxYm1OMGIzSmNibVoxYm1OMGFXOXVJR1poWTNSdmNua2dLQ2tnZTF4dUlDQXZMeUJLZFhOMElHWnZjbmRoY21SeklIUm9aU0JqWVd4c0lIUnZJSFJvWlNCeVpYTnZiSFpsY2lCaWVTQnpaWFIwYVc1bklHbDBjMlZzWmlCaGN5QmpiMjUwWlhoMExseHVJQ0JtZFc1amRHbHZiaUJtYmlBb2RtRnNkV1VwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSXVZMkZzYkNobWJpd2dkbUZzZFdVcE8xeHVJQ0I5WEc1Y2JpQWdabTR1YVdRZ1BTQXJLMk55WldGMFpXUTdYRzVjYmlBZ0x5OGdWR2hsSUhOMFlYUmxJR2x6SUdGMGRHRmphR1ZrSUhSdklIUm9aU0JtZFc1amRHbHZiaUJ2WW1wbFkzUWdjMjhnYVhRbmN5QmhkbUZwYkdGaWJHVWdkRzhnZEdobFhHNGdJQzh2SUhOMFlYUmxMV3hsYzNNZ1puVnVZM1JwYjI1eklIZG9aVzRnY25WdWJtbHVaeUIxYm1SbGNpQmdkR2hwY3k1Z0xseHVJQ0JtYmk1amFHRnBiaUE5SUc1MWJHdzdYRzRnSUdadUxuQmhjbVZ1ZENBOUlHNTFiR3c3WEc0Z0lHWnVMbkJoZFhObFpDQTlJR1poYkhObE8xeHVJQ0JtYmk1eVpYTnZiSFpsWkNBOUlGdGRPMXh1SUNCbWJpNW1hVzVoYkdsNlpYSnpJRDBnVzEwN1hHNWNiaUFnTHk4Z1JYaHdiM05sSUhSb1pTQmlaV2hoZG1sdmRYSWdhVzRnZEdobElHWjFibU4wYjNKY2JpQWdabTR1Y0dGMWMyVWdQU0J3WVhWelpUdGNiaUFnWm00dWNtVnpkVzFsSUQwZ2NtVnpkVzFsTzF4dUlDQm1iaTVtYjNKcklEMGdabTl5YXp0Y2JpQWdabTR1YW05cGJpQTlJR3B2YVc0N1hHNGdJR1p1TG1acGJtRnNhWHBsSUQwZ1ptbHVZV3hwZW1VN1hHNWNiaUFnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUtHWnVMQ0FuWlhob1lYVnpkR1ZrSnl3Z2UxeHVJQ0FnSUdkbGREb2dablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWNtVnpiMngyWldRdWJHVnVaM1JvSUQ0OUlIUm9hWE11WTJoaGFXNHVYMTlsZUhCbFkzUmhkR2x2Ym5OZlh5NXNaVzVuZEdnN1hHNGdJQ0FnZlZ4dUlDQjlLVHRjYmx4dUlDQnlaWFIxY200Z1ptNDdYRzU5WEc1Y2JpOHZJRlJvYVhNZ2FYTWdkR2hsSUdOdmNtVWdjbVZ6YjJ4MWRHbHZiaUJoYkdkdmNtbDBhRzBzSUdsMElHOXdaWEpoZEdWeklHOTJaWElnZEdobElHTm9ZV2x1WEc0dkx5QnZaaUJsZUhCbFkzUmhkR2x2Ym5NZ1kyaGxZMnRwYm1jZ2RHaGxiU0J2Ym1VZ1lXWjBaWElnZEdobElHOTBhR1Z5SUdGbllXbHVjM1FnWVNCMllXeDFaUzVjYmk4dklFbG1JR0VnWm5WdVkzUnBiMjRnYVhNZ2NtVjBkWEp1WldRZ2FYUW5iR3dnWW1VZ2FXMXRaV1JwWVhSbGJIa2dZMkZzYkdWa0lIVnphVzVuSUhSb1pWeHVMeThnWlhod1pXTjBZWFJwYjI0Z2FXNXpkR0Z1WTJVZ1lYTWdZMjl1ZEdWNGRDQmhibVFnY0dGemMybHVaeUJoY3lCdmJteDVJR0Z5WjNWdFpXNTBJSFJvWlZ4dUx5OGdZM1Z5Y21WdWRDQnlaWE52YkhabElHWjFibU4wYVc5dUxDQjBhR2x6SUdGc2JHOTNjeUJoYmlCbGVIQmxZM1JoZEdsdmJpQjBieUJ2ZG1WeWNtbGtaVnh1THk4Z2RHaGxJSFpoYkhWbElHRnVaQzl2Y2lCamIyNTBjbTlzSUhSb1pTQnlaWE52YkhWMGFXOXVJSGRwZEdodmRYUWdaWGh3YjNOcGJtY2dkRzl2SUcxaGJubGNiaTh2SUdsdWRHVnlibUZzSUdSbGRHRnBiSE11WEc0dkx5QlhhR1Z1SUdsMElISmxkSFZ5Ym5NZ1lIVnVaR1ZtYVc1bFpHQWdhWFFnYW5WemRDQnRaV0Z1Y3lCMGFHRjBJSFJvWlNCeVpYTnZiSFYwYVc5dUlIZGhjMXh1THk4Z2NHRjFjMlZrSUNoaGMzbHVZeWtzSUhkbElHTmhiaUJ1YjNRZ2IySjBZV2x1SUdFZ1ptbHVZV3dnY21WemRXeDBJSFZ6YVc1bklHRWdjM2x1WTJoeWIyNXZkWE5jYmk4dklHTmhiR3d1SUZSb2FYTWdZMkZ1SUdKbElIVnpaV1FnWW5rZ2JXRjBZMmhsY25NZ2QyaGxiaUIwWVd0cGJtY2diM1psY2lCMGFHVWdjbVZ6YjJ4MWRHbHZiaUIwYjF4dUx5OGdhMjV2ZHlCcFppQjBhR1Y1SUc1bFpXUWdkRzhnYldGdVoyeGxJSFJvWlNCeVpYTjFiSFJ6SUc5eUlIUm9aWGtnYUdGMlpTQjBieUJ5WldkcGMzUmxjaUJoWEc0dkx5Qm1hVzVoYkdsNlpYSWdkRzhnWW1VZ2JtOTBhV1pwWldRZ2IyWWdkR2hsSUdacGJtRnNJSEpsYzNWc2RDQm1jbTl0SUhSb1pTQmphR0ZwYmk1Y2JtWjFibU4wYVc5dUlISmxjMjlzZG1WeUlDaDJZV3gxWlNrZ2UxeHVJQ0IyWVhJZ2JHbHpkQ3dnY21WemRXeDBMQ0JsZUhBN1hHNWNiaUFnYkdsemRDQTlJSFJvYVhNdVkyaGhhVzR1WDE5bGVIQmxZM1JoZEdsdmJuTmZYenRjYmlBZ2IyWm1jMlYwSUQwZ2RHaHBjeTV5WlhOdmJIWmxaQzVzWlc1bmRHZzdYRzRnSUhKbGMzVnNkQ0E5SUhSeWRXVTdYRzVjYmlBZ1ptOXlJQ2gyWVhJZ2FTQTlJRzltWm5ObGREc2dhU0E4SUd4cGMzUXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0F2THlCRGNtVmhkR1VnWVNCdVpYY2diMkpxWldOMElHbHVhR1Z5YVhScGJtY2dabkp2YlNCMGFHVWdaWGh3WldOMFlYUnBiMjRnWW5WMElIZHBkR2dnZEdobFhHNGdJQ0FnTHk4Z1kzVnljbVZ1ZENCaFkzUjFZV3dnZG1Gc2RXVWdjSEp2ZG1semFXOXVaV1F1SUVsMElHRnNiRzkzY3lCMGFHVWdaWGh3Y21WemMybHZiaUIwYnlCdGRYUmhkR1ZjYmlBZ0lDQXZMeUJwZEhNZ2MzUmhkR1VnWm05eUlIUm9hWE1nWlhobFkzVjBhVzl1SUdKMWRDQnViM1FnWVdabVpXTjBJRzkwYUdWeUlIVnpaWE1nYjJZZ2FYUXVYRzRnSUNBZ1pYaHdJRDBnZFhScGJDNWpjbVZoZEdVb2JHbHpkRnRwWFN3Z2V5QmhZM1IxWVd3NklIWmhiSFZsSUgwcE8xeHVYRzRnSUNBZ0x5OGdTMlZsY0NCMGNtRmpheUJ2WmlCeVpYTnZiSFpsWkNCbGVIQmxZM1JoZEdsdmJuTmNiaUFnSUNCMGFHbHpMbkpsYzI5c2RtVmtMbkIxYzJnb1pYaHdLVHRjYmx4dUlDQWdJQzh2SUVWNFpXTjFkR1VnZEdobElHVjRjR1ZqZEdGMGFXOXVJSFJ2SUc5aWRHRnBiaUJwZEhNZ2NtVnpkV3gwWEc0Z0lDQWdjbVZ6ZFd4MElEMGdaWGh3TG5KbGMzVnNkQ0E5SUdWNGNDNXlaWE52YkhabEtDazdYRzVjYmlBZ0lDQXZMeUJCYkd4dmR5QmxlSEJsWTNSaGRHbHZibk1nZEc4Z2RHRnJaU0JqYjI1MGNtOXNJR1p2Y2lCMGFHVWdjbVZ0WVdsdWFXNW5JRzltSUhSb1pTQmphR0ZwYmx4dUlDQWdJR2xtSUNoMGVYQmxiMllnY21WemRXeDBJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQXZMeUJUYVc1alpTQjBhR1VnWTI5dWRISnZiQ0JwY3lCa1pXeGxaMkYwWldRZ2RHOGdkR2hsSUdWNGNISmxjM05wYjI0Z2QyVWdaRzl1SjNRZ2FHRjJaU0IwYjF4dUlDQWdJQ0FnTHk4Z1pHOGdZVzU1ZEdocGJtY2diVzl5WlNCb1pYSmxMbHh1SUNBZ0lDQWdaWGh3TG5KbGMzVnNkQ0E5SUhKbGMzVnNkQzVqWVd4c0tHVjRjQ3dnZEdocGN5azdYRzRnSUNBZ0lDQnlaWFIxY200Z1pYaHdMbkpsYzNWc2REdGNiaUFnSUNCOVhHNWNiaUFnSUNBdkx5QlRkRzl3SUc5dUlHWnBjbk4wSUdaaGFXeDFjbVZjYmlBZ0lDQnBaaUFvY21WemRXeDBJRDA5UFNCbVlXeHpaU2tnZTF4dUlDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JpQWdMeThnUVhRZ2RHaHBjeUJ3YjJsdWRDQjNaU0JxZFhOMElHNWxaV1FnZEc4Z1lYQndiSGtnWVc1NUlIQmxibVJwYm1jZ1ptbHVZV3hwZW1WeWMxeHVJQ0J5WlhSMWNtNGdkR2hwY3k1bWFXNWhiR2w2WlNoeVpYTjFiSFFwTzF4dWZWeHVYRzVjYmk4dklGZG9aVzRnY21WemIyeDJhVzVuSUdGemVXNWpJR1pzYjNkeklDaHBMbVV1T2lCd2NtOXRhWE5sY3lrZ2RHaHBjeUIzYVd4c0lIQmhkWE5sSUhSb1pTQm5hWFpsYmx4dUx5OGdjbVZ6YjJ4MlpYSWdkVzUwYVd3Z1lTQmpZV3hzSUhSdklDNXlaWE4xYldVb0tTQnBjeUJ0WVdSbExseHVablZ1WTNScGIyNGdjR0YxYzJVZ0tDa2dlMXh1SUNCcFppQW9kR2hwY3k1d1lYVnpaV1FwSUh0Y2JpQWdJQ0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KMUpsYzI5c2RtVnlJR0ZzY21WaFpIa2djR0YxYzJWa0p5azdYRzRnSUgxY2JseHVJQ0IwYUdsekxuQmhkWE5sWkNBOUlIUnlkV1U3WEc1OVhHNWNiaTh2SUU5dVkyVWdkR2hsSUdGemVXNWpJR1pzYjNjZ2FHRnpJR052YlhCc1pYUmxaQ0IzWlNCallXNGdZMjl1ZEdsdWRXVWdjbVZ6YjJ4MmFXNW5JSGRvWlhKbElIZGxYRzR2THlCemRHOXdaV1F1SUZkb1pXNGdkR2hsSUc5MlpYSnlhV1JsSUhCaGNtRnRJR2x6SUc1dmRDQjFibVJsWm1sdVpXUWdkMlVuYkd3Z2MydHBjQ0JqWVd4c2FXNW5JSFJvWlZ4dUx5OGdjbVZ6YjJ4MlpYSWdZVzVrSUdGemMzVnRaU0IwYUdGMElHSnZiMndnWVhNZ2RHaGxJR1pwYm1Gc0lISmxjM1ZzZEM0Z1ZHaHBjeUJoYkd4dmQzTWdkR2hsSUdGemVXNWpYRzR2THlCamIyUmxJSFJ2SUhOb2IzSjBZM1YwSUhSb1pTQnlaWE52YkhabGNpNWNibVoxYm1OMGFXOXVJSEpsYzNWdFpTQW9ZV04wZFdGc0xDQnZkbVZ5Y21sa1pTa2dlMXh1SUNCcFppQW9JWFJvYVhNdWNHRjFjMlZrS1NCN1hHNGdJQ0FnZEdoeWIzY2dibVYzSUVWeWNtOXlLQ2RTWlhOdmJIWmxjaUJwY3lCdWIzUWdZM1Z5Y21WdWRHeDVJSEJoZFhObFpDY3BPMXh1SUNCOVhHNWNiaUFnZEdocGN5NXdZWFZ6WldRZ1BTQm1ZV3h6WlR0Y2JseHVJQ0F2THlCQklHWnBibUZzSUhKbGMzVnNkQ0IzWVhNZ2NISnZkbWxrWldRZ2MyOGdhblZ6ZENCbWFXNWhiR2w2WlNCMGFHVWdjbVZ6YjJ4MlpYSmNiaUFnYVdZZ0tHOTJaWEp5YVdSbElDRTlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1bWFXNWhiR2w2WlNodmRtVnljbWxrWlNrN1hHNGdJSDFjYmx4dUlDQXZMeUJNWlhRbmN5QmpiMjUwYVc1MVpTQnlaWE52YkhacGJtY2dkMmwwYUNCMGFHVWdibVYzSUhaaGJIVmxYRzRnSUM4dklFNXZkR1U2SUhSb2FYTW9LU0JzYjI5cmN5QjNaV2x5WkNCaWRYUWdjbVZ0WlcxaVpYSWdkMlVuY21VZ2RYTnBibWNnWVNCbWRXNWpkR2x2YmlCaGN5QmpiMjUwWlhoMFhHNGdJSEpsZEhWeWJpQjBhR2x6S0dGamRIVmhiQ2s3WEc1OVhHNWNiaTh2SUVOc2IyNWxjeUIwYUdVZ1kzVnljbVZ1ZENCeVpYTnZiSFpsY2lCemJ5QjNaU0JqWVc0Z1ptOXlheUJoYm1RZ1pHbHpZMkZ5WkNCdmNHVnlZWFJwYjI1ekxseHVablZ1WTNScGIyNGdabTl5YXlBb0tTQjdYRzRnSUhaaGNpQmljbUZ1WTJnZ1BTQmhZM0YxYVhKbEtIUm9hWE11WTJoaGFXNHBPMXh1SUNCaWNtRnVZMmd1Y0dGeVpXNTBJRDBnZEdocGN6dGNiaUFnWW5KaGJtTm9MbkpsYzI5c2RtVmtJRDBnWHk1eVpXcGxZM1FvZEdocGN5NXlaWE52YkhabFpDd2dRWEp5WVhrdWFYTkJjbkpoZVNrN1hHNGdJSEpsZEhWeWJpQmljbUZ1WTJnN1hHNTlYRzVjYmk4dklFRnpjM1Z0WlNCMGFHVWdjbVZ6ZFd4MGN5Qm1jbTl0SUdFZ1ptOXlheUJwYmlCMGFHVWdiV0ZwYmlCeVpYTnZiSFpsY2x4dVpuVnVZM1JwYjI0Z2FtOXBiaUFvWm05eWF5a2dlMXh1SUNCMllYSWdiR1Z1SUQwZ1h5NXlaV3BsWTNRb2RHaHBjeTV5WlhOdmJIWmxaQ3dnUVhKeVlYa3VhWE5CY25KaGVTa3ViR1Z1WjNSb08xeHVJQ0IwYUdsekxuSmxjMjlzZG1Wa0xuQjFjMmdvWEc0Z0lDQWdabTl5YXk1eVpYTnZiSFpsWkM1emJHbGpaU2hzWlc0cFhHNGdJQ2s3WEc1OVhHNWNiaTh2SUZkb1pXNGdkR2hsSUdGeVozVnRaVzUwSUdseklHRWdablZ1WTNScGIyNGdhWFFnWjJWMGN5QnlaV2RwYzNSbGNtVmtJR0Z6SUdFZ1ptbHVZV3hwZW1WeUlHWnZjaUIwYUdWY2JpOHZJSEpsYzNWc2RDQnZZblJoYVc1bFpDQnZibU5sSUhSb1pTQmxlSEJ5WlhOemFXOXVJR2hoY3lCaVpXVnVJR1oxYkd4NUlISmxjMjlzZG1Wa0lDaHBMbVV1SUdGemVXNWpLUzVjYmk4dklFOTBhR1Z5ZDJselpTQnBkQ2RzYkNCbGVHVmpkWFJsSUdGdWVTQnlaV2RwYzNSbGNtVmtJR1oxYm1OMGFXOXVjeUJ2YmlCMGFHVWdaMmwyWlc0Z2NtVnpkV3gwSUdGdVpGeHVMeThnWVd4c2IzY2dkR2hsYlNCMGJ5QmphR0Z1WjJVZ2FYUWdZbVZtYjNKbElISmxiR1ZoYzJsdVp5QjBhR1VnY21WemIyeDJaWElnYVc1MGJ5QjBhR1VnY0c5dmJDNWNibVoxYm1OMGFXOXVJR1pwYm1Gc2FYcGxLSEpsYzNWc2RDa2dlMXh1SUNCcFppQW9kSGx3Wlc5bUlISmxjM1ZzZENBOVBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQWdJSFJvYVhNdVptbHVZV3hwZW1WeWN5NXdkWE5vS0Z4dUlDQWdJQ0FnVzNKbGMzVnNkQ3dnWHk1c1lYTjBLSFJvYVhNdWNtVnpiMngyWldRcFhWeHVJQ0FnSUNrN1hHNGdJQ0FnY21WMGRYSnVPMXh1SUNCOVhHNWNiaUFnTHk4Z1RtOTBhR2x1WnlCNVpYUWdkRzhnWm1sdVlXeHBlbVVnYzJsdVkyVWdkR2hsSUhKbGMzVnNkQ0JwY3lCemRHbHNiQ0IxYm10dWIzZHVYRzRnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJSFZ1WkdWbWFXNWxaQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQjFibVJsWm1sdVpXUTdYRzRnSUgxY2JseHVJQ0F2THlCQmJHeHZkeUJtYVc1aGJHbDZaWEp6SUhSdklIUnZaMmRzWlNCMGFHVWdjbVZ6ZFd4MElDaE1TVVpQSUc5eVpHVnlLVnh1SUNCMllYSWdabWx1WVd4cGVtVnlPMXh1SUNCM2FHbHNaU0FvZEdocGN5NW1hVzVoYkdsNlpYSnpMbXhsYm1kMGFDQStJREFwSUh0Y2JpQWdJQ0JtYVc1aGJHbDZaWElnUFNCMGFHbHpMbVpwYm1Gc2FYcGxjbk11Y0c5d0tDazdYRzRnSUNBZ2NtVnpkV3gwSUQwZ1ptbHVZV3hwZW1WeVd6QmRMbU5oYkd3b1ptbHVZV3hwZW1WeVd6RmRMQ0J5WlhOMWJIUXBPMXh1SUNBZ0lHWnBibUZzYVhwbGNsc3hYUzV5WlhOMWJIUWdQU0J5WlhOMWJIUTdYRzRnSUgxY2JseHVJQ0F2THlCTVpYUWdkR2hsSUdOb1lXbHVJR1JwYzNCaGRHTm9JSFJvWlNCbWFXNWhiQ0J5WlhOMWJIUWdZblYwSUc5dWJIa2dabTl5SUc1dmJpMW1iM0pyWldRZ2NtVnpiMngyWlhKelhHNGdJR2xtSUNnaGRHaHBjeTV3WVhKbGJuUXBJSHRjYmlBZ0lDQjBhR2x6TG1Ob1lXbHVMbVJwYzNCaGRHTm9VbVZ6ZFd4MEtIUm9hWE11Y21WemIyeDJaV1FzSUhKbGMzVnNkQ2s3WEc0Z0lIMWNibHh1SUNBdkx5QlhhR1Z1SUdFZ1ptbHVZV3dnY21WemRXeDBJR2hoY3lCaVpXVnVJRzlpZEdGcGJtVmtJSEpsYkdWaGMyVWdkR2hsSUhKbGMyOXNkbVZ5SUhSdklIUm9aU0J3YjI5c1hHNGdJSEJ2YjJ3dWNIVnphQ2gwYUdsektUdGNiaUFnYVdZZ0tIQnZiMnd1YkdWdVozUm9JRDRnWTNKbFlYUmxaQ2tnZTF4dUlDQWdJSFJvY205M0lHNWxkeUJGY25KdmNpZ25VRzl2YkNCamIzSnlkWEIwWldRaElFTnlaV0YwWldRZ0p5QXJJR055WldGMFpXUWdLeUFuSUdKMWRDQjBhR1Z5WlNCaGNtVWdKeUFySUhCdmIyd3ViR1Z1WjNSb0lDc2dKeUJ3YjI5c1pXUW5LVHRjYmlBZ2ZWeHVYRzRnSUhKbGRIVnliaUJ5WlhOMWJIUTdYRzU5WEc1Y2JpOHZJRUZqY1hWcGNtVnpJR0VnY21WemIyeDJaWElnWm5WdVkzUnZjaXdnYVdZZ2RHaGxjbVVnYVhNZ2IyNWxJR2x1SUhSb1pTQndiMjlzSUdsMEoyeHNJR0psSUhKbGMyVjBJR0Z1WkZ4dUx5OGdjbVYxYzJWa0xDQnZkR2hsY25kcGMyVWdhWFFuYkd3Z1kzSmxZWFJsSUdFZ2JtVjNJRzl1WlM0Z1YyaGxiaUI1YjNVbmNtVWdaRzl1WlNCM2FYUm9JSFJvWlNCeVpYTnZiSFpsY2x4dUx5OGdlVzkxSUhOb2IzVmtJR2RwZG1VZ2FYUWdkRzhnWUhKbGJHVmhjMlVvS1dBZ2MyOGdhWFFnWTJGdUlHSmxJR2x1WTI5eWNHOXlZWFJsWkNCMGJ5QjBhR1VnY0c5dmJDNWNiaTh2SUZSb1pTQnlaV0Z6YjI0Z1ptOXlJSFZ6YVc1bklHRWdjRzl2YkNCdlppQnZZbXBsWTNSeklHaGxjbVVnYVhNZ2RHaGhkQ0JsZG1WeWVTQjBhVzFsSUhkbElHVjJZV3gxWVhSbFhHNHZMeUJoYmlCbGVIQnlaWE56YVc5dUlIZGxKMnhzSUc1bFpXUWdZU0J5WlhOdmJIWmxjaXdnZDJobGJpQjFjMmx1WnlCeGRXRnVkR2xtYVdWeWN5QnRkV3gwYVhCc1pTQm1iM0pyYzF4dUx5OGdkMmxzYkNCaVpTQmpjbVZoZEdWa0xDQnpieUJwZENkeklHbHRjRzl5ZEdGdWRDQjBieUJwYlhCeWIzWmxJSFJvWlNCd1pYSm1iM0p0WVc1alpTNWNibVoxYm1OMGFXOXVJR0ZqY1hWcGNtVWdLR05vWVdsdUtTQjdYRzRnSUhaaGNpQnlaWE52YkhabGNpQTlJSEJ2YjJ3dWNHOXdLQ2tnZkh3Z1ptRmpkRzl5ZVNncE8xeHVYRzRnSUM4dklGSmxjMlYwSUhSb1pTQnpkR0YwWlNCdlppQjBhR1VnY21WemIyeDJaWEpjYmlBZ2NtVnpiMngyWlhJdVkyaGhhVzRnUFNCamFHRnBianRjYmlBZ2NtVnpiMngyWlhJdWNHRnlaVzUwSUQwZ2JuVnNiRHRjYmlBZ2NtVnpiMngyWlhJdWNHRjFjMlZrSUQwZ1ptRnNjMlU3WEc0Z0lIZG9hV3hsSUNoeVpYTnZiSFpsY2k1eVpYTnZiSFpsWkM1c1pXNW5kR2dnUGlBd0tTQjdYRzRnSUNBZ2NtVnpiMngyWlhJdWNtVnpiMngyWldRdWNHOXdLQ2s3WEc0Z0lIMWNiaUFnZDJocGJHVWdLSEpsYzI5c2RtVnlMbVpwYm1Gc2FYcGxjbk11YkdWdVozUm9JRDRnTUNrZ2UxeHVJQ0FnSUhKbGMyOXNkbVZ5TG1acGJtRnNhWHBsY25NdWNHOXdLQ2s3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnY21WemIyeDJaWEk3WEc1OVhHNWNibHh1Wlhod2IzSjBjeTVoWTNGMWFYSmxJRDBnWVdOeGRXbHlaVHRjYmlKZGZRPT0iLCIvLyBTdXBwb3J0IGZvciAuc2hvdWxkIHN0eWxlIHN5bnRheCwgbm90aWNlIHRoYXQgd2hpbGUgaGVyZSByZXNpZGVzIHRoZSBjb3JlXG4vLyBsb2dpYyBmb3IgaXQsIHRoZSBpbnRlcmZhY2UgaXMgZG9uZSBpbiBhc3MuanMgaW4gb3JkZXIgdG8gbWFrZSBpdCByZXR1cm5cbi8vIHRoZSBgYXNzYCBmdW5jdGlvbiBhbmQgcHJvdmlkZSBzdXBwb3J0IGZvciBpdHMgdXNlIG9uIGJlZm9yZUVhY2gvYWZ0ZXJFYWNoLlxuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG5cblxudmFyIERFRkFVTFRfUFJPUCA9ICdzaG91bGQnO1xuXG4vLyBJbnN0YWxscyB0aGUgdHlwaWNhbCAuc2hvdWxkIHByb3BlcnR5IG9uIHRoZSByb290IE9iamVjdCBwcm90b3R5cGUuXG4vLyBZb3UgY2FuIGluc3RhbGwgdW5kZXIgYW55IG5hbWUgb2YgeW91ciBjaG9vc2luZyBieSBnaXZpbmcgaXQgYXMgYXJndW1lbnQuXG4vL1xuLy8gQmFzaWNhbGx5IGJvcnJvd2VkIGZyb20gdGhlIENoYWkgcHJvamVjdDpcbi8vICBDb3B5cmlnaHQoYykgMjAxMS0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS9pbnRlcmZhY2Uvc2hvdWxkLmpzXG5mdW5jdGlvbiBzaG91bGQgKG5hbWUpIHtcbiAgaWYgKG5hbWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gc2hvdWxkLnJlc3RvcmUoKTtcbiAgfVxuXG4gIG5hbWUgPSBuYW1lIHx8IERFRkFVTFRfUFJPUDtcblxuICBpZiAobmFtZSBpbiBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgaWYgKCFDaGFpbi5pc0NoYWluKE9iamVjdC5wcm90b3R5cGVbbmFtZV0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Fzcy5zaG91bGQ6IE9iamVjdC5wcm90b3R5cGUgYWxyZWFkeSBoYXMgYSAuJyArIG5hbWUgKyAnIHByb3BlcnR5Jyk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIG1vZGlmeSBPYmplY3QucHJvdG90eXBlIHRvIGhhdmUgYDxuYW1lPmBcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChDaGFpbi5pc0NoYWluKHRoaXMpKSB7XG4gICAgICAgIC8vIEFjdHVhbGx5IENoYWluIGluc3RhbmNlcyBkb24ndCBpbmhlcml0IGZyb20gT2JqZWN0IGJ1dCBzdGlsbFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIFN0cmluZyB8fCB0aGlzIGluc3RhbmNlb2YgTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcy5jb25zdHJ1Y3Rvcih0aGlzKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMgaW5zdGFuY2VvZiBCb29sZWFuKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4oISF0aGlzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQWxsb3c6IGdsb2JhbC5hc3MgPSByZXF1aXJlKCdhc3MnKS5zaG91bGQoKVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgIC8vIEFsbG93IHJlc3RvcmF0aW9uXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgLy8gRXhwb3NlIGl0IGFzIGEgbm8tb3Agb24gQ2hhaW5zIHNpbmNlIHRoZXkgZG9uJ3QgaW5oZXJpdCBmcm9tIE9iamVjdFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2hhaW4ucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSAgLy8gQWxsb3cgcmVzdG9yYXRpb25cbiAgfSk7XG5cbn1cblxuc2hvdWxkLnJlc3RvcmUgPSBmdW5jdGlvbiAobmFtZSkge1xuICBuYW1lID0gbmFtZSB8fCBERUZBVUxUX1BST1A7XG5cbiAgaWYgKG5hbWUgaW4gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIGlmIChDaGFpbi5pc0NoYWluKE9iamVjdC5wcm90b3R5cGVbbmFtZV0pKSB7XG4gICAgICBkZWxldGUgT2JqZWN0LnByb3RvdHlwZVtuYW1lXTtcbiAgICAgIGRlbGV0ZSBDaGFpbi5wcm90b3R5cGVbbmFtZV07XG4gICAgfVxuICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdWxkO1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxuLy8gR2V0IHRoZSBuYXRpdmUgUHJvbWlzZSBvciBhIHNoaW1cbmV4cG9ydHMuUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlIHx8ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Wyd3aW5kb3cnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ3dpbmRvdyddIDogbnVsbCkuUHJvbWlzZTtcblxuXG4vLyBDYXBwZWQgcG9vbCB0byBsaW1pdCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBjYW4gYmVcbi8vIHN0b3JlZCAodW5ib3VuZGVkIGJ5IGRlZmF1bHQpLlxuZXhwb3J0cy5DYXBwZWRQb29sID0gZnVuY3Rpb24gKG1heCkge1xuICB2YXIgcG9vbCA9IFtdO1xuXG4gIG1heCA9IG1heCB8fCBOdW1iZXIuTUFYX1ZBTFVFO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwb29sLCAncHVzaCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA8IG1heCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKHRoaXMsIHYpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHBvb2w7XG59O1xuXG5cbnZhciBkb0NvbG9ycyA9IF8ub25jZShmdW5jdGlvbiAoKSB7XG4gIC8vIE1hc3RlciBvdmVycmlkZSB3aXRoIG91ciBjdXN0b20gZW52IHZhcmlhYmxlXG4gIGlmIChwcm9jZXNzLmVudi5BU1NfQ09MT1JTICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gL3RydWV8b258eWVzfGVuYWJsZWQ/fDEvaS50ZXN0KHByb2Nlc3MuZW52LkFTU19DT0xPUlMpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgS2FybWEgaXMgYmVpbmcgdXNlZCBhbmQgaGFzIGRlZmluZWQgdGhlIGNvbG9yc1xuICB2YXIga2FybWEgPSBnbG9iYWwuX19rYXJtYV9fO1xuICBpZiAoa2FybWEgJiYga2FybWEuY29uZmlnICYmIHR5cGVvZiBrYXJtYS5jb25maWcuY29sb3JzICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBrYXJtYS5jb25maWcuY29sb3JzO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgbW9jaGEgaXMgYXJvdW5kIGFuZCB2ZXJpZnkgYWdhaW5zdCBpdHMgY29uZmlndXJhdGlvblxuICB2YXIgTW9jaGEgPSBnbG9iYWwuTW9jaGE7XG4gIGlmIChNb2NoYSA9PT0gdW5kZWZpbmVkICYmIHJlcXVpcmUucmVzb2x2ZSAmJiByZXF1aXJlLnJlc29sdmUoJ21vY2hhJykpIHtcbiAgICBNb2NoYSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydNb2NoYSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnTW9jaGEnXSA6IG51bGwpO1xuICB9XG4gIGlmIChNb2NoYSAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycyAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycy5CYXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gTW9jaGEucmVwb3J0ZXJzLkJhc2UudXNlQ29sb3JzO1xuICB9XG5cbiAgLy8gUXVlcnkgdGhlIGVudmlyb25tZW50IGFuZCBzZWUgaWYgc29tZSBjb21tb24gdmFyaWFibGVzIGFyZSBzZXRcbiAgaWYgKHByb2Nlc3MuZW52Lk1PQ0hBX0NPTE9SUyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKC8tLWNvbG9yPWFsd2F5cy8udGVzdChwcm9jZXNzLmVudi5HUkVQX09QVElPTlMgfHwgJycpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBGaW5hbGx5IGp1c3QgY2hlY2sgaWYgdGhlIGVudmlyb25tZW50IGlzIGNhcGFibGVcbiAgdmFyIHR0eSA9IHJlcXVpcmUoJ3R0eScpO1xuICByZXR1cm4gdHR5LmlzYXR0eSgxKSAmJiB0dHkuaXNhdHR5KDIpO1xufSk7XG5cblxuLy8gUmVtb3ZlIEFOU0kgZXNjYXBlcyBmcm9tIGEgc3RyaW5nXG5mdW5jdGlvbiB1bmFuc2kgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xceDFiXFxbKFxcZCs7PykrW2Etel0vZ2ksICcnKTtcbn1cblxuXG4vLyBBdm9pZCByZXBlYXRlZCBjb21waWxhdGlvbnMgYnkgbWVtb2l6aW5nXG52YXIgY29tcGlsZVRlbXBsYXRlID0gXy5tZW1vaXplKGZ1bmN0aW9uICh0cGwpIHtcbiAgcmV0dXJuIF8udGVtcGxhdGUodHBsLCBudWxsLCB7XG4gICAgZXNjYXBlOiAvXFx7XFx7KFtcXHNcXFNdKz8pXFx9XFx9L2dcbiAgfSk7XG59KTtcblxuLy8gRHVtcHMgYXJiaXRyYXJ5IHZhbHVlcyBhcyBzdHJpbmdzIGluIGEgY29uY2lzZSB3YXlcbi8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS91dGlscy9vYmpEaXNwbGF5LmpzXG5mdW5jdGlvbiB2YWx1ZUR1bXBlciAodikge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKF8uaXNOdW1iZXIodikgfHwgXy5pc05hTih2KSB8fCBfLmlzQm9vbGVhbih2KSB8fCBfLmlzTnVsbCh2KSB8fCBfLmlzVW5kZWZpbmVkKHYpKSB7XG4gICAgdmFsdWUgPSAnPCcgKyB2ICsgJz4nO1xuICB9IGVsc2UgaWYgKF8uaXNSZWdFeHAodikpIHtcbiAgICB2YWx1ZSA9IHYudG9TdHJpbmcoKTtcbiAgfSBlbHNlIGlmIChfLmlzRnVuY3Rpb24odikpIHtcbiAgICBpZiAodi5kaXNwbGF5TmFtZSkge1xuICAgICAgdmFsdWUgPSB2LmRpc3BsYXlOYW1lICsgJygpJztcbiAgICB9IGVsc2UgaWYgKHYubmFtZSkge1xuICAgICAgdmFsdWUgPSB2Lm5hbWUgKyAnKCknO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9ICc8ZnVuY3Rpb24+JztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfVxuXG4gIHJldHVybiAnXFx1MDAxYlsxOzM2bScgKyB2YWx1ZSArICdcXHUwMDFiWzBtJztcbn1cblxuXG4vLyBDdXN0b21pemVkIHZlcnNpb24gb2YgbG9kYXNoIHRlbXBsYXRlXG5mdW5jdGlvbiB0ZW1wbGF0ZSAodHBsLCBjb250ZXh0KSB7XG4gIHZhciBmbiA9IGNvbXBpbGVUZW1wbGF0ZSh0cGwpO1xuICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIG9yaWdFc2NhcGUgPSBfLmVzY2FwZTtcbiAgdHJ5IHtcbiAgICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBlc2NhcGUgZnVuY3Rpb24gdG8gdXNlIGl0IGZvciBkdW1waW5nIGZvcm1hdHRlZCB2YWx1ZXNcbiAgICBfLmVzY2FwZSA9IHZhbHVlRHVtcGVyO1xuXG4gICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuXG4gIH0gZmluYWxseSB7XG4gICAgXy5lc2NhcGUgPSBvcmlnRXNjYXBlO1xuICB9XG59XG5cbi8vIEEgc2ltcGxlIGZhc3QgZnVuY3Rpb24gYmluZGluZyBwcmltaXRpdmUgb25seSBzdXBwb3J0aW5nIHNldHRpbmcgdGhlIGNvbnRleHRcbmZ1bmN0aW9uIGJpbmQoZm4sIHRoaXNBcmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxuLy8gUXVpY2tseSBjcmVhdGVzIGEgbmV3IG9iamVjdCB3aXRoIGEgY3VzdG9tIHByb3RvdHlwZSBhbmQgc29tZSB2YWx1ZVxuLy8gb3ZlcnJpZGVzLlxuZnVuY3Rpb24gY3JlYXRlKHByb3RvLCB2YWx1ZXMpIHtcbiAgaWYgKDAgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEhBQ0s6IFVzZSBGdW5jdGlvbi5wcm90b3R5cGUgKyBuZXcgaW5zdGVhZCBvZiB0aGUgc2xvdy1pc2ggT2JqZWN0LmNyZWF0ZVxuICBjcmVhdGUucHJvdG90eXBlID0gcHJvdG87XG4gIHJldHVybiBfLmFzc2lnbihuZXcgY3JlYXRlKCksIHZhbHVlcyB8fCB7fSk7XG59XG5cblxuLy8gRnJvbSBodHRwOi8vc2lkZXJpdGUuYmxvZ3Nwb3QuY29tLzIwMTQvMTEvc3VwZXItZmFzdC1hbmQtYWNjdXJhdGUtc3RyaW5nLWRpc3RhbmNlLmh0bWxcbmZ1bmN0aW9uIHNpZnQ0KHMxLCBzMiwgbWF4T2Zmc2V0KSB7XG4gIGlmICghczEgfHwgIXMxLmxlbmd0aCkge1xuICAgIGlmICghczIpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gczIubGVuZ3RoO1xuICB9XG5cbiAgaWYgKCFzMiB8fCAhczIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHMxLmxlbmd0aDtcbiAgfVxuXG4gIHZhciBsMSA9IHMxLmxlbmd0aDtcbiAgdmFyIGwyID0gczIubGVuZ3RoO1xuXG4gIHZhciBjMSA9IDA7ICAvLyBjdXJzb3IgZm9yIHN0cmluZyAxXG4gIHZhciBjMiA9IDA7ICAvLyBjdXJzb3IgZm9yIHN0cmluZyAyXG4gIHZhciBsY3NzID0gMDsgIC8vIGxhcmdlc3QgY29tbW9uIHN1YnNlcXVlbmNlXG4gIHZhciBsb2NhbF9jcyA9IDA7IC8vIGxvY2FsIGNvbW1vbiBzdWJzdHJpbmdcblxuICB3aGlsZSAoKGMxIDwgbDEpICYmIChjMiA8IGwyKSkge1xuICAgIGlmIChzMS5jaGFyQXQoYzEpID09IHMyLmNoYXJBdChjMikpIHtcbiAgICAgIGxvY2FsX2NzKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxjc3MgKz0gbG9jYWxfY3M7XG4gICAgICBsb2NhbF9jcyA9IDA7XG4gICAgICBpZiAoYzEgIT0gYzIpIHtcbiAgICAgICAgYzEgPSBjMiA9IE1hdGgubWF4KGMxLGMyKTsgLy8gdXNpbmcgbWF4IHRvIGJ5cGFzcyB0aGUgbmVlZCBmb3IgY29tcHV0ZXIgdHJhbnNwb3NpdGlvbnMgKCdhYicgdnMgJ2JhJylcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF4T2Zmc2V0OyBpKyspIHtcbiAgICAgICAgaWYgKChjMSArIGkgPCBsMSkgJiYgKHMxLmNoYXJBdChjMSArIGkpID09PSBzMi5jaGFyQXQoYzIpKSkge1xuICAgICAgICAgIGMxICs9IGk7XG4gICAgICAgICAgbG9jYWxfY3MrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGMyICsgaSA8IGwyKSAmJiAoczEuY2hhckF0KGMxKSA9PT0gczIuY2hhckF0KGMyICsgaSkpKSB7XG4gICAgICAgICAgYzIgKz0gaTtcbiAgICAgICAgICBsb2NhbF9jcysrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGMxKys7XG4gICAgYzIrKztcbiAgfVxuICBsY3NzICs9IGxvY2FsX2NzO1xuICByZXR1cm4gTWF0aC5yb3VuZChNYXRoLm1heChsMSwgbDIpIC0gbGNzcyk7XG59XG5cbmV4cG9ydHMuYmluZCA9IGJpbmQ7XG5leHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZTtcbmV4cG9ydHMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbmV4cG9ydHMudW5hbnNpID0gdW5hbnNpO1xuZXhwb3J0cy5kb0NvbG9ycyA9IGRvQ29sb3JzO1xuZXhwb3J0cy5zaWZ0NCA9IHNpZnQ0O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOTFkR2xzTG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN1FVRkJRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SjJZWElnWHlBOUlDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzV3lkZkoxMGdPaUIwZVhCbGIyWWdaMnh2WW1Gc0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdaMnh2WW1Gc1d5ZGZKMTBnT2lCdWRXeHNLVHRjYmx4dUx5OGdSMlYwSUhSb1pTQnVZWFJwZG1VZ1VISnZiV2x6WlNCdmNpQmhJSE5vYVcxY2JtVjRjRzl5ZEhNdVVISnZiV2x6WlNBOUlHZHNiMkpoYkM1UWNtOXRhWE5sSUh4OElDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzV3lkM2FXNWtiM2NuWFNBNklIUjVjR1Z2WmlCbmJHOWlZV3dnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCbmJHOWlZV3hiSjNkcGJtUnZkeWRkSURvZ2JuVnNiQ2t1VUhKdmJXbHpaVHRjYmx4dVhHNHZMeUJEWVhCd1pXUWdjRzl2YkNCMGJ5QnNhVzFwZENCMGFHVWdiV0Y0YVcxMWJTQnVkVzFpWlhJZ2IyWWdaV3hsYldWdWRITWdkR2hoZENCallXNGdZbVZjYmk4dklITjBiM0psWkNBb2RXNWliM1Z1WkdWa0lHSjVJR1JsWm1GMWJIUXBMbHh1Wlhod2IzSjBjeTVEWVhCd1pXUlFiMjlzSUQwZ1puVnVZM1JwYjI0Z0tHMWhlQ2tnZTF4dUlDQjJZWElnY0c5dmJDQTlJRnRkTzF4dVhHNGdJRzFoZUNBOUlHMWhlQ0I4ZkNCT2RXMWlaWEl1VFVGWVgxWkJURlZGTzF4dVhHNGdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNod2IyOXNMQ0FuY0hWemFDY3NJSHRjYmlBZ0lDQjJZV3gxWlRvZ1puVnVZM1JwYjI0Z0tIWXBJSHRjYmlBZ0lDQWdJR2xtSUNoMGFHbHpMbXhsYm1kMGFDQThJRzFoZUNrZ2UxeHVJQ0FnSUNBZ0lDQkJjbkpoZVM1d2NtOTBiM1I1Y0dVdWNIVnphQzVqWVd4c0tIUm9hWE1zSUhZcE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdmU2s3WEc1Y2JpQWdjbVYwZFhKdUlIQnZiMnc3WEc1OU8xeHVYRzVjYm5aaGNpQmtiME52Ykc5eWN5QTlJRjh1YjI1alpTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDOHZJRTFoYzNSbGNpQnZkbVZ5Y21sa1pTQjNhWFJvSUc5MWNpQmpkWE4wYjIwZ1pXNTJJSFpoY21saFlteGxYRzRnSUdsbUlDaHdjbTlqWlhOekxtVnVkaTVCVTFOZlEwOU1UMUpUSUNFOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQnlaWFIxY200Z0wzUnlkV1Y4YjI1OGVXVnpmR1Z1WVdKc1pXUS9mREV2YVM1MFpYTjBLSEJ5YjJObGMzTXVaVzUyTGtGVFUxOURUMHhQVWxNcE8xeHVJQ0I5WEc1Y2JpQWdMeThnUTJobFkyc2dhV1lnUzJGeWJXRWdhWE1nWW1WcGJtY2dkWE5sWkNCaGJtUWdhR0Z6SUdSbFptbHVaV1FnZEdobElHTnZiRzl5YzF4dUlDQjJZWElnYTJGeWJXRWdQU0JuYkc5aVlXd3VYMTlyWVhKdFlWOWZPMXh1SUNCcFppQW9hMkZ5YldFZ0ppWWdhMkZ5YldFdVkyOXVabWxuSUNZbUlIUjVjR1Z2WmlCcllYSnRZUzVqYjI1bWFXY3VZMjlzYjNKeklDRTlQU0FuZFc1a1pXWnBibVZrSnlrZ2UxeHVJQ0FnSUhKbGRIVnliaUJyWVhKdFlTNWpiMjVtYVdjdVkyOXNiM0p6TzF4dUlDQjlYRzVjYmlBZ0x5OGdRMmhsWTJzZ2FXWWdiVzlqYUdFZ2FYTWdZWEp2ZFc1a0lHRnVaQ0IyWlhKcFpua2dZV2RoYVc1emRDQnBkSE1nWTI5dVptbG5kWEpoZEdsdmJseHVJQ0IyWVhJZ1RXOWphR0VnUFNCbmJHOWlZV3d1VFc5amFHRTdYRzRnSUdsbUlDaE5iMk5vWVNBOVBUMGdkVzVrWldacGJtVmtJQ1ltSUhKbGNYVnBjbVV1Y21WemIyeDJaU0FtSmlCeVpYRjFhWEpsTG5KbGMyOXNkbVVvSjIxdlkyaGhKeWtwSUh0Y2JpQWdJQ0JOYjJOb1lTQTlJQ2gwZVhCbGIyWWdkMmx1Wkc5M0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdkMmx1Wkc5M1d5ZE5iMk5vWVNkZElEb2dkSGx3Wlc5bUlHZHNiMkpoYkNBaFBUMGdYQ0oxYm1SbFptbHVaV1JjSWlBL0lHZHNiMkpoYkZzblRXOWphR0VuWFNBNklHNTFiR3dwTzF4dUlDQjlYRzRnSUdsbUlDaE5iMk5vWVNBaFBUMGdkVzVrWldacGJtVmtJQ1ltSUUxdlkyaGhMbkpsY0c5eWRHVnljeUFoUFQwZ2RXNWtaV1pwYm1Wa0lDWW1JRTF2WTJoaExuSmxjRzl5ZEdWeWN5NUNZWE5sSUNFOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQnlaWFIxY200Z1RXOWphR0V1Y21Wd2IzSjBaWEp6TGtKaGMyVXVkWE5sUTI5c2IzSnpPMXh1SUNCOVhHNWNiaUFnTHk4Z1VYVmxjbmtnZEdobElHVnVkbWx5YjI1dFpXNTBJR0Z1WkNCelpXVWdhV1lnYzI5dFpTQmpiMjF0YjI0Z2RtRnlhV0ZpYkdWeklHRnlaU0J6WlhSY2JpQWdhV1lnS0hCeWIyTmxjM011Wlc1MkxrMVBRMGhCWDBOUFRFOVNVeUFoUFQwZ2RXNWtaV1pwYm1Wa0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUgxY2JpQWdhV1lnS0M4dExXTnZiRzl5UFdGc2QyRjVjeTh1ZEdWemRDaHdjbTlqWlhOekxtVnVkaTVIVWtWUVgwOVFWRWxQVGxNZ2ZId2dKeWNwS1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJSDFjYmx4dUlDQXZMeUJHYVc1aGJHeDVJR3AxYzNRZ1kyaGxZMnNnYVdZZ2RHaGxJR1Z1ZG1seWIyNXRaVzUwSUdseklHTmhjR0ZpYkdWY2JpQWdkbUZ5SUhSMGVTQTlJSEpsY1hWcGNtVW9KM1IwZVNjcE8xeHVJQ0J5WlhSMWNtNGdkSFI1TG1sellYUjBlU2d4S1NBbUppQjBkSGt1YVhOaGRIUjVLRElwTzF4dWZTazdYRzVjYmx4dUx5OGdVbVZ0YjNabElFRk9VMGtnWlhOallYQmxjeUJtY205dElHRWdjM1J5YVc1blhHNW1kVzVqZEdsdmJpQjFibUZ1YzJrZ0tITjBjaWtnZTF4dUlDQnlaWFIxY200Z2MzUnlMbkpsY0d4aFkyVW9MMXhjZURGaVhGeGJLRnhjWkNzN1B5a3JXMkV0ZWwwdloya3NJQ2NuS1R0Y2JuMWNibHh1WEc0dkx5QkJkbTlwWkNCeVpYQmxZWFJsWkNCamIyMXdhV3hoZEdsdmJuTWdZbmtnYldWdGIybDZhVzVuWEc1MllYSWdZMjl0Y0dsc1pWUmxiWEJzWVhSbElEMGdYeTV0WlcxdmFYcGxLR1oxYm1OMGFXOXVJQ2gwY0d3cElIdGNiaUFnY21WMGRYSnVJRjh1ZEdWdGNHeGhkR1VvZEhCc0xDQnVkV3hzTENCN1hHNGdJQ0FnWlhOallYQmxPaUF2WEZ4N1hGeDdLRnRjWEhOY1hGTmRLejhwWEZ4OVhGeDlMMmRjYmlBZ2ZTazdYRzU5S1R0Y2JseHVMeThnUkhWdGNITWdZWEppYVhSeVlYSjVJSFpoYkhWbGN5QmhjeUJ6ZEhKcGJtZHpJR2x1SUdFZ1kyOXVZMmx6WlNCM1lYbGNiaTh2SUZSUFJFODZJR2gwZEhCek9pOHZaMmwwYUhWaUxtTnZiUzlqYUdGcGFuTXZZMmhoYVM5aWJHOWlMMjFoYzNSbGNpOXNhV0l2WTJoaGFTOTFkR2xzY3k5dlltcEVhWE53YkdGNUxtcHpYRzVtZFc1amRHbHZiaUIyWVd4MVpVUjFiWEJsY2lBb2Rpa2dlMXh1SUNCMllYSWdkbUZzZFdVN1hHNWNiaUFnYVdZZ0tGOHVhWE5PZFcxaVpYSW9kaWtnZkh3Z1h5NXBjMDVoVGloMktTQjhmQ0JmTG1selFtOXZiR1ZoYmloMktTQjhmQ0JmTG1selRuVnNiQ2gyS1NCOGZDQmZMbWx6Vlc1a1pXWnBibVZrS0hZcEtTQjdYRzRnSUNBZ2RtRnNkV1VnUFNBblBDY2dLeUIySUNzZ0p6NG5PMXh1SUNCOUlHVnNjMlVnYVdZZ0tGOHVhWE5TWldkRmVIQW9kaWtwSUh0Y2JpQWdJQ0IyWVd4MVpTQTlJSFl1ZEc5VGRISnBibWNvS1R0Y2JpQWdmU0JsYkhObElHbG1JQ2hmTG1selJuVnVZM1JwYjI0b2Rpa3BJSHRjYmlBZ0lDQnBaaUFvZGk1a2FYTndiR0Y1VG1GdFpTa2dlMXh1SUNBZ0lDQWdkbUZzZFdVZ1BTQjJMbVJwYzNCc1lYbE9ZVzFsSUNzZ0p5Z3BKenRjYmlBZ0lDQjlJR1ZzYzJVZ2FXWWdLSFl1Ym1GdFpTa2dlMXh1SUNBZ0lDQWdkbUZzZFdVZ1BTQjJMbTVoYldVZ0t5QW5LQ2tuTzF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQjJZV3gxWlNBOUlDYzhablZ1WTNScGIyNCtKenRjYmlBZ0lDQjlYRzRnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdkbUZzZFdVZ1BTQktVMDlPTG5OMGNtbHVaMmxtZVNoMktUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQW5YRngxTURBeFlsc3hPek0yYlNjZ0t5QjJZV3gxWlNBcklDZGNYSFV3TURGaVd6QnRKenRjYm4xY2JseHVYRzR2THlCRGRYTjBiMjFwZW1Wa0lIWmxjbk5wYjI0Z2IyWWdiRzlrWVhOb0lIUmxiWEJzWVhSbFhHNW1kVzVqZEdsdmJpQjBaVzF3YkdGMFpTQW9kSEJzTENCamIyNTBaWGgwS1NCN1hHNGdJSFpoY2lCbWJpQTlJR052YlhCcGJHVlVaVzF3YkdGMFpTaDBjR3dwTzF4dUlDQnBaaUFvWTI5dWRHVjRkQ0E5UFQwZ2RXNWtaV1pwYm1Wa0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUdadU8xeHVJQ0I5WEc1Y2JpQWdkbUZ5SUc5eWFXZEZjMk5oY0dVZ1BTQmZMbVZ6WTJGd1pUdGNiaUFnZEhKNUlIdGNiaUFnSUNBdkx5QlBkbVZ5Y21sa1pTQjBhR1VnWkdWbVlYVnNkQ0JsYzJOaGNHVWdablZ1WTNScGIyNGdkRzhnZFhObElHbDBJR1p2Y2lCa2RXMXdhVzVuSUdadmNtMWhkSFJsWkNCMllXeDFaWE5jYmlBZ0lDQmZMbVZ6WTJGd1pTQTlJSFpoYkhWbFJIVnRjR1Z5TzF4dVhHNGdJQ0FnY21WMGRYSnVJR1p1S0dOdmJuUmxlSFFwTzF4dVhHNGdJSDBnWm1sdVlXeHNlU0I3WEc0Z0lDQWdYeTVsYzJOaGNHVWdQU0J2Y21sblJYTmpZWEJsTzF4dUlDQjlYRzU5WEc1Y2JpOHZJRUVnYzJsdGNHeGxJR1poYzNRZ1puVnVZM1JwYjI0Z1ltbHVaR2x1WnlCd2NtbHRhWFJwZG1VZ2IyNXNlU0J6ZFhCd2IzSjBhVzVuSUhObGRIUnBibWNnZEdobElHTnZiblJsZUhSY2JtWjFibU4wYVc5dUlHSnBibVFvWm00c0lIUm9hWE5CY21jcElIdGNiaUFnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdabTR1WVhCd2JIa29kR2hwYzBGeVp5d2dZWEpuZFcxbGJuUnpLVHRjYmlBZ2ZUdGNibjFjYmx4dUx5OGdVWFZwWTJ0c2VTQmpjbVZoZEdWeklHRWdibVYzSUc5aWFtVmpkQ0IzYVhSb0lHRWdZM1Z6ZEc5dElIQnliM1J2ZEhsd1pTQmhibVFnYzI5dFpTQjJZV3gxWlZ4dUx5OGdiM1psY25KcFpHVnpMbHh1Wm5WdVkzUnBiMjRnWTNKbFlYUmxLSEJ5YjNSdkxDQjJZV3gxWlhNcElIdGNiaUFnYVdZZ0tEQWdQVDA5SUdGeVozVnRaVzUwY3k1c1pXNW5kR2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3p0Y2JpQWdmVnh1WEc0Z0lDOHZJRWhCUTBzNklGVnpaU0JHZFc1amRHbHZiaTV3Y205MGIzUjVjR1VnS3lCdVpYY2dhVzV6ZEdWaFpDQnZaaUIwYUdVZ2MyeHZkeTFwYzJnZ1QySnFaV04wTG1OeVpXRjBaVnh1SUNCamNtVmhkR1V1Y0hKdmRHOTBlWEJsSUQwZ2NISnZkRzg3WEc0Z0lISmxkSFZ5YmlCZkxtRnpjMmxuYmlodVpYY2dZM0psWVhSbEtDa3NJSFpoYkhWbGN5QjhmQ0I3ZlNrN1hHNTlYRzVjYmx4dUx5OGdSbkp2YlNCb2RIUndPaTh2YzJsa1pYSnBkR1V1WW14dlozTndiM1F1WTI5dEx6SXdNVFF2TVRFdmMzVndaWEl0Wm1GemRDMWhibVF0WVdOamRYSmhkR1V0YzNSeWFXNW5MV1JwYzNSaGJtTmxMbWgwYld4Y2JtWjFibU4wYVc5dUlITnBablEwS0hNeExDQnpNaXdnYldGNFQyWm1jMlYwS1NCN1hHNGdJR2xtSUNnaGN6RWdmSHdnSVhNeExteGxibWQwYUNrZ2UxeHVJQ0FnSUdsbUlDZ2hjeklwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUF3TzF4dUlDQWdJSDFjYmlBZ0lDQnlaWFIxY200Z2N6SXViR1Z1WjNSb08xeHVJQ0I5WEc1Y2JpQWdhV1lnS0NGek1pQjhmQ0FoY3pJdWJHVnVaM1JvS1NCN1hHNGdJQ0FnY21WMGRYSnVJSE14TG14bGJtZDBhRHRjYmlBZ2ZWeHVYRzRnSUhaaGNpQnNNU0E5SUhNeExteGxibWQwYUR0Y2JpQWdkbUZ5SUd3eUlEMGdjekl1YkdWdVozUm9PMXh1WEc0Z0lIWmhjaUJqTVNBOUlEQTdJQ0F2THlCamRYSnpiM0lnWm05eUlITjBjbWx1WnlBeFhHNGdJSFpoY2lCak1pQTlJREE3SUNBdkx5QmpkWEp6YjNJZ1ptOXlJSE4wY21sdVp5QXlYRzRnSUhaaGNpQnNZM056SUQwZ01Ec2dJQzh2SUd4aGNtZGxjM1FnWTI5dGJXOXVJSE4xWW5ObGNYVmxibU5sWEc0Z0lIWmhjaUJzYjJOaGJGOWpjeUE5SURBN0lDOHZJR3h2WTJGc0lHTnZiVzF2YmlCemRXSnpkSEpwYm1kY2JseHVJQ0IzYUdsc1pTQW9LR014SUR3Z2JERXBJQ1ltSUNoak1pQThJR3d5S1NrZ2UxeHVJQ0FnSUdsbUlDaHpNUzVqYUdGeVFYUW9ZekVwSUQwOUlITXlMbU5vWVhKQmRDaGpNaWtwSUh0Y2JpQWdJQ0FnSUd4dlkyRnNYMk56S3lzN1hHNGdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJR3hqYzNNZ0t6MGdiRzlqWVd4ZlkzTTdYRzRnSUNBZ0lDQnNiMk5oYkY5amN5QTlJREE3WEc0Z0lDQWdJQ0JwWmlBb1l6RWdJVDBnWXpJcElIdGNiaUFnSUNBZ0lDQWdZekVnUFNCak1pQTlJRTFoZEdndWJXRjRLR014TEdNeUtUc2dMeThnZFhOcGJtY2diV0Y0SUhSdklHSjVjR0Z6Y3lCMGFHVWdibVZsWkNCbWIzSWdZMjl0Y0hWMFpYSWdkSEpoYm5Od2IzTnBkR2x2Ym5NZ0tDZGhZaWNnZG5NZ0oySmhKeWxjYmlBZ0lDQWdJSDFjYmlBZ0lDQWdJR1p2Y2lBb2RtRnlJR2tnUFNBd095QnBJRHdnYldGNFQyWm1jMlYwT3lCcEt5c3BJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tDaGpNU0FySUdrZ1BDQnNNU2tnSmlZZ0tITXhMbU5vWVhKQmRDaGpNU0FySUdrcElEMDlQU0J6TWk1amFHRnlRWFFvWXpJcEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUdNeElDczlJR2s3WEc0Z0lDQWdJQ0FnSUNBZ2JHOWpZV3hmWTNNckt6dGNiaUFnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JwWmlBb0tHTXlJQ3NnYVNBOElHd3lLU0FtSmlBb2N6RXVZMmhoY2tGMEtHTXhLU0E5UFQwZ2N6SXVZMmhoY2tGMEtHTXlJQ3NnYVNrcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnWXpJZ0t6MGdhVHRjYmlBZ0lDQWdJQ0FnSUNCc2IyTmhiRjlqY3lzck8xeHVJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVJQ0FnSUdNeEt5czdYRzRnSUNBZ1l6SXJLenRjYmlBZ2ZWeHVJQ0JzWTNOeklDczlJR3h2WTJGc1gyTnpPMXh1SUNCeVpYUjFjbTRnVFdGMGFDNXliM1Z1WkNoTllYUm9MbTFoZUNoc01Td2diRElwSUMwZ2JHTnpjeWs3WEc1OVhHNWNibVY0Y0c5eWRITXVZbWx1WkNBOUlHSnBibVE3WEc1bGVIQnZjblJ6TG1OeVpXRjBaU0E5SUdOeVpXRjBaVHRjYm1WNGNHOXlkSE11ZEdWdGNHeGhkR1VnUFNCMFpXMXdiR0YwWlR0Y2JtVjRjRzl5ZEhNdWRXNWhibk5wSUQwZ2RXNWhibk5wTzF4dVpYaHdiM0owY3k1a2IwTnZiRzl5Y3lBOUlHUnZRMjlzYjNKek8xeHVaWGh3YjNKMGN5NXphV1owTkNBOUlITnBablEwTzF4dUlsMTkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgYXNzID0gcmVxdWlyZSgnLi9saWIvYXNzJyk7XG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2xpYi9jaGFpbicpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9saWIvZXJyb3InKTtcbnZhciBzaG91bGQgPSByZXF1aXJlKCcuL2xpYi9zaG91bGQnKTtcbnZhciBwYXRjaGVzID0gcmVxdWlyZSgnLi9saWIvcGF0Y2hlcycpO1xuXG4vLyBSZWdpc3RlciB0aGUgZGVmYXVsdCBtYXRjaGVyc1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvY29yZScpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9xdWFudGlmaWVycycpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvcHJvbWlzZScpO1xuXG5cbi8vIEJ1bmRsZSBzb21lIG9mIHRoZSBpbnRlcm5hbCBzdHVmZiB3aXRoIHRoZSBhc3MgZnVuY3Rpb25cbmFzcy5DaGFpbiA9IENoYWluO1xuYXNzLkVycm9yID0gQXNzRXJyb3I7XG5hc3MucGF0Y2hlcyA9IHBhdGNoZXM7XG5cbi8vIEZvcndhcmQgdGhlIHNob3VsZCBpbnN0YWxsZXJcbi8vIE5vdGU6IG1ha2UgdGhlbSBhcml0eS0wIHRvIGFsbG93IGJlZm9yZUVhY2goYXNzLnNob3VsZCkgaW4gTW9jaGFcbmFzcy5zaG91bGQgPSBmdW5jdGlvbiAoLyogbmFtZSAqLykge1xuICBzaG91bGQoYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQpO1xuICByZXR1cm4gYXNzO1xufTtcbmFzcy5zaG91bGQucmVzdG9yZSA9IGZ1bmN0aW9uICgvKiBuYW1lICovKSB7XG4gIHNob3VsZC5yZXN0b3JlKGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogdW5kZWZpbmVkKTtcbiAgcmV0dXJuIGFzcztcbn07XG5cblxuLy8gUGF0Y2ggdGhpcmQgcGFydHkgbGlicmFyaWVzIHRvIHVuZGVyc3RhbmQgYWJvdXQgYXNzLWVydCBleHByZXNzaW9ucy4gV2Vcbi8vIGRlcGVuZCBvbiBwYXRjaGluZyBsb2Rhc2ggZm9yIHRoZSBsaWJyYXJ5IHRvIHdvcmsgY29ycmVjdGx5LCBob3dldmVyIHRoZVxuLy8gcmVzdCBhcmUgb3B0aW9uYWwuXG5wYXRjaGVzLmxvZGFzaCgodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snXyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnXyddIDogbnVsbCkpO1xuXG5pZiAoZ2xvYmFsLnNpbm9uICYmIGdsb2JhbC5zaW5vbi5tYXRjaCkge1xuICBwYXRjaGVzLnNpbm9uKGdsb2JhbC5zaW5vbik7XG59IGVsc2UgaWYgKHJlcXVpcmUucmVzb2x2ZSkge1xuICAgIHRyeSB7XG4gICAgICBwYXRjaGVzLnNpbm9uKCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydzaW5vbiddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnc2lub24nXSA6IG51bGwpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIHNpbm9uIGlzIG5vdCBpbnN0YWxsZWRcbiAgICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBhc3M7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW0xaGFXNHVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTSXNJbVpwYkdVaU9pSm5aVzVsY21GMFpXUXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpZG1GeUlHRnpjeUE5SUhKbGNYVnBjbVVvSnk0dmJHbGlMMkZ6Y3ljcE8xeHVkbUZ5SUVOb1lXbHVJRDBnY21WeGRXbHlaU2duTGk5c2FXSXZZMmhoYVc0bktUdGNiblpoY2lCQmMzTkZjbkp2Y2lBOUlISmxjWFZwY21Vb0p5NHZiR2xpTDJWeWNtOXlKeWs3WEc1MllYSWdjMmh2ZFd4a0lEMGdjbVZ4ZFdseVpTZ25MaTlzYVdJdmMyaHZkV3hrSnlrN1hHNTJZWElnY0dGMFkyaGxjeUE5SUhKbGNYVnBjbVVvSnk0dmJHbGlMM0JoZEdOb1pYTW5LVHRjYmx4dUx5OGdVbVZuYVhOMFpYSWdkR2hsSUdSbFptRjFiSFFnYldGMFkyaGxjbk5jYm5KbGNYVnBjbVVvSnk0dmJHbGlMMjFoZEdOb1pYSnpMMk52Y21VbktUdGNibkpsY1hWcGNtVW9KeTR2YkdsaUwyMWhkR05vWlhKekwyTnZiM0prYVc1aGRHbHZiaWNwTzF4dWNtVnhkV2x5WlNnbkxpOXNhV0l2YldGMFkyaGxjbk12Y1hWaGJuUnBabWxsY25NbktUdGNibkpsY1hWcGNtVW9KeTR2YkdsaUwyMWhkR05vWlhKekwzQnliMjFwYzJVbktUdGNibHh1WEc0dkx5QkNkVzVrYkdVZ2MyOXRaU0J2WmlCMGFHVWdhVzUwWlhKdVlXd2djM1IxWm1ZZ2QybDBhQ0IwYUdVZ1lYTnpJR1oxYm1OMGFXOXVYRzVoYzNNdVEyaGhhVzRnUFNCRGFHRnBianRjYm1GemN5NUZjbkp2Y2lBOUlFRnpjMFZ5Y205eU8xeHVZWE56TG5CaGRHTm9aWE1nUFNCd1lYUmphR1Z6TzF4dVhHNHZMeUJHYjNKM1lYSmtJSFJvWlNCemFHOTFiR1FnYVc1emRHRnNiR1Z5WEc0dkx5Qk9iM1JsT2lCdFlXdGxJSFJvWlcwZ1lYSnBkSGt0TUNCMGJ5QmhiR3h2ZHlCaVpXWnZjbVZGWVdOb0tHRnpjeTV6YUc5MWJHUXBJR2x1SUUxdlkyaGhYRzVoYzNNdWMyaHZkV3hrSUQwZ1puVnVZM1JwYjI0Z0tDOHFJRzVoYldVZ0tpOHBJSHRjYmlBZ2MyaHZkV3hrS0dGeVozVnRaVzUwY3k1c1pXNW5kR2dnUGlBd0lEOGdZWEpuZFcxbGJuUnpXekJkSURvZ2RXNWtaV1pwYm1Wa0tUdGNiaUFnY21WMGRYSnVJR0Z6Y3p0Y2JuMDdYRzVoYzNNdWMyaHZkV3hrTG5KbGMzUnZjbVVnUFNCbWRXNWpkR2x2YmlBb0x5b2dibUZ0WlNBcUx5a2dlMXh1SUNCemFHOTFiR1F1Y21WemRHOXlaU2hoY21kMWJXVnVkSE11YkdWdVozUm9JRDRnTUNBL0lHRnlaM1Z0Wlc1MGMxc3dYU0E2SUhWdVpHVm1hVzVsWkNrN1hHNGdJSEpsZEhWeWJpQmhjM003WEc1OU8xeHVYRzVjYmk4dklGQmhkR05vSUhSb2FYSmtJSEJoY25SNUlHeHBZbkpoY21sbGN5QjBieUIxYm1SbGNuTjBZVzVrSUdGaWIzVjBJR0Z6Y3kxbGNuUWdaWGh3Y21WemMybHZibk11SUZkbFhHNHZMeUJrWlhCbGJtUWdiMjRnY0dGMFkyaHBibWNnYkc5a1lYTm9JR1p2Y2lCMGFHVWdiR2xpY21GeWVTQjBieUIzYjNKcklHTnZjbkpsWTNSc2VTd2dhRzkzWlhabGNpQjBhR1ZjYmk4dklISmxjM1FnWVhKbElHOXdkR2x2Ym1Gc0xseHVjR0YwWTJobGN5NXNiMlJoYzJnb0tIUjVjR1Z2WmlCM2FXNWtiM2NnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCM2FXNWtiM2RiSjE4blhTQTZJSFI1Y0dWdlppQm5iRzlpWVd3Z0lUMDlJRndpZFc1a1pXWnBibVZrWENJZ1B5Qm5iRzlpWVd4YkoxOG5YU0E2SUc1MWJHd3BLVHRjYmx4dWFXWWdLR2RzYjJKaGJDNXphVzV2YmlBbUppQm5iRzlpWVd3dWMybHViMjR1YldGMFkyZ3BJSHRjYmlBZ2NHRjBZMmhsY3k1emFXNXZiaWhuYkc5aVlXd3VjMmx1YjI0cE8xeHVmU0JsYkhObElHbG1JQ2h5WlhGMWFYSmxMbkpsYzI5c2RtVXBJSHRjYmlBZ0lDQjBjbmtnZTF4dUlDQWdJQ0FnY0dGMFkyaGxjeTV6YVc1dmJpZ29kSGx3Wlc5bUlIZHBibVJ2ZHlBaFBUMGdYQ0oxYm1SbFptbHVaV1JjSWlBL0lIZHBibVJ2ZDFzbmMybHViMjRuWFNBNklIUjVjR1Z2WmlCbmJHOWlZV3dnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCbmJHOWlZV3hiSjNOcGJtOXVKMTBnT2lCdWRXeHNLU2s3WEc0Z0lDQWdmU0JqWVhSamFDQW9aU2tnZTF4dUlDQWdJQ0FnSUNBdkx5QnphVzV2YmlCcGN5QnViM1FnYVc1emRHRnNiR1ZrWEc0Z0lDQWdmVnh1ZlZ4dVhHNWNibTF2WkhWc1pTNWxlSEJ2Y25SeklEMGdZWE56TzF4dUlsMTkiLG51bGwsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhbk11dGF0aW9uT2JzZXJ2ZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIHZhciBxdWV1ZSA9IFtdO1xuXG4gICAgaWYgKGNhbk11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgICAgdmFyIGhpZGRlbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBxdWV1ZUxpc3QgPSBxdWV1ZS5zbGljZSgpO1xuICAgICAgICAgICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHF1ZXVlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShoaWRkZW5EaXYsIHsgYXR0cmlidXRlczogdHJ1ZSB9KTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIGlmICghcXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaGlkZGVuRGl2LnNldEF0dHJpYnV0ZSgneWVzJywgJ25vJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIvLyBFbXVsYXRlcyBWOCdzIENhbGxTaXRlIG9iamVjdCBmcm9tIGEgc3RhY2t0cmFjZS5qcyBmcmFtZSBvYmplY3RcblxuZnVuY3Rpb24gQ2FsbFNpdGUgKGZyYW1lKSB7XG4gIHRoaXMuZnJhbWUgPSBmcmFtZTtcbn07XG5cbkNhbGxTaXRlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoe1xuICBnZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUubGluZU51bWJlcjtcbiAgfSxcbiAgZ2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuY29sdW1uTnVtYmVyO1xuICB9LFxuICBnZXRGaWxlTmFtZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmZpbGVOYW1lO1xuICB9LFxuICBnZXRGdW5jdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmZ1bmN0aW9uO1xuICB9LFxuICBnZXRUaGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGdldFR5cGVOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGdldE1ldGhvZE5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5mcmFtZS5mdW5jdGlvbk5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmZyYW1lLmZ1bmN0aW9uTmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgZ2V0RnVuY3Rpb25OYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lO1xuICB9LFxuICBnZXRFdmFsT3JpZ2luOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGlzVG9wbGV2ZWw6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cbiAgfSxcbiAgaXNFdmFsOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXG4gIH0sXG4gIGlzTmF0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXG4gIH0sXG4gIGlzQ29uc3RydWN0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gL15uZXcoXFxzfCQpLy50ZXN0KHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lKTtcbiAgfSxcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbmFtZSA9IHRoaXMuZ2V0RnVuY3Rpb25OYW1lKCkgfHwgJzxhbm9ueW1vdXM+JztcbiAgICB2YXIgbG9jID0gdGhpcy5nZXRGaWxlTmFtZSgpICsgJzonICsgdGhpcy5nZXRMaW5lTnVtYmVyKCkgKyAnOicgKyB0aGlzLmdldENvbHVtbk51bWJlcigpXG4gICAgcmV0dXJuIG5hbWUgKyAnICgnICsgbG9jICsgJyknO1xuICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENhbGxTaXRlO1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG52YXIgRXJyb3JTdGFja1BhcnNlciA9IHJlcXVpcmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicpO1xudmFyIENhbGxTaXRlID0gcmVxdWlyZSgnLi9jYWxsLXNpdGUnKTtcblxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgYnVpbHRpbiBlcnJvciBjb25zdHJ1Y3RvclxudmFyIE5hdGl2ZUVycm9yID0gRXJyb3I7XG5cbi8vIEFubm90YXRpb24gc3ltYm9sc1xudmFyIFNZTUJPTF9GUkFNRVMgPSAnQEBmYWlsdXJlL2ZyYW1lcyc7XG52YXIgU1lNQk9MX0lHTk9SRSA9ICdAQGZhaWx1cmUvaWdub3JlJztcblxuXG5mdW5jdGlvbiBGYWlsdXJlIChtZXNzYWdlLCBzZmYpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZhaWx1cmUpKSB7XG4gICAgcmV0dXJuIG5ldyBGYWlsdXJlKG1lc3NhZ2UsIHNmZiB8fCBGYWlsdXJlKTtcbiAgfVxuXG4gIHRoaXMuc2ZmID0gc2ZmIHx8IHRoaXMuY29uc3RydWN0b3I7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblxuICAvLyBHZW5lcmF0ZSBhIGdldHRlciBmb3IgdGhlIGZyYW1lcywgdGhpcyBlbnN1cmVzIHRoYXQgd2UgZG8gYXMgbGl0dGxlIHdvcmtcbiAgLy8gYXMgcG9zc2libGUgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBlcnJvciwgZGVmZXJyaW5nIHRoZSBleHBlbnNpdmUgc3RhY2tcbiAgLy8gbWFuZ2xpbmcgb3BlcmF0aW9ucyB1bnRpbCB0aGUgLnN0YWNrIHByb3BlcnR5IGlzIGFjdHVhbGx5IHJlcXVlc3RlZC5cbiAgdGhpcy5fZ2V0RnJhbWVzID0gbWFrZUZyYW1lc0dldHRlcih0aGlzLnNmZik7XG5cbiAgLy8gT24gRVM1IGVuZ2luZXMgd2UgdXNlIG9uZS10aW1lIGdldHRlcnMgdG8gYWN0dWFsbHkgZGVmZXIgdGhlIGV4cGVuc2l2ZVxuICAvLyBvcGVyYXRpb25zIChkZWZpbmVkIGluIHRoZSBwcm90b3R5cGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIHdoaWxlIGxlZ2FjeVxuICAvLyBlbmdpbmVzIHdpbGwgc2ltcGx5IGRvIGFsbCB0aGUgd29yayB1cCBmcm9udC5cbiAgaWYgKCEvXFxbbmF0aXZlIGNvZGVcXF0vLnRlc3QoT2JqZWN0LmRlZmluZVByb3BlcnR5KSkge1xuICAgIHRoaXMuZnJhbWVzID0gdW53aW5kKHRoaXMuX2dldEZyYW1lcygpKTtcbiAgICB0aGlzLl9nZXRGcmFtZXMgPSBudWxsO1xuICAgIHRoaXMuc3RhY2sgPSB0aGlzLmdlbmVyYXRlU3RhY2tUcmFjZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIFNldCBGUkFNRV9FTVBUWSB0byBudWxsIHRvIGRpc2FibGUgYW55IHNvcnQgb2Ygc2VwYXJhdG9yXG5GYWlsdXJlLkZSQU1FX0VNUFRZID0gJyAgLS0tLSc7XG5GYWlsdXJlLkZSQU1FX1BSRUZJWCA9ICcgIGF0ICc7XG5cbi8vIEJ5IGRlZmF1bHQgd2UgZW5hYmxlIHRyYWNraW5nIGZvciBhc3luYyBzdGFjayB0cmFjZXNcbkZhaWx1cmUuVFJBQ0tJTkcgPSB0cnVlO1xuXG5cbi8vIEhlbHBlciB0byBvYnRhaW4gdGhlIGN1cnJlbnQgc3RhY2sgdHJhY2VcbnZhciBnZXRFcnJvcldpdGhTdGFjayA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyBOYXRpdmVFcnJvcigpO1xufTtcbi8vIFNvbWUgZW5naW5lcyBkbyBub3QgZ2VuZXJhdGUgdGhlIC5zdGFjayBwcm9wZXJ0eSB1bnRpbCBpdCdzIHRocm93blxuaWYgKCFnZXRFcnJvcldpdGhTdGFjaygpLnN0YWNrKSB7XG4gIGdldEVycm9yV2l0aFN0YWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7IHRocm93IG5ldyBOYXRpdmVFcnJvcigpOyB9IGNhdGNoIChlKSB7IHJldHVybiBlOyB9XG4gIH07XG59XG5cbi8vIFRyaW0gZnJhbWVzIHVuZGVyIHRoZSBwcm92aWRlZCBzdGFjayBmaXJzdCBmdW5jdGlvblxuZnVuY3Rpb24gdHJpbShmcmFtZXMsIHNmZikge1xuICB2YXIgZm4sIG5hbWUgPSBzZmYubmFtZTtcbiAgaWYgKCFmcmFtZXMpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tGYWlsdXJlXSBlcnJvciBjYXB0dXJpbmcgZnJhbWVzJyk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGZvciAodmFyIGk9MDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGZuID0gZnJhbWVzW2ldLmdldEZ1bmN0aW9uKCk7XG4gICAgaWYgKGZuICYmIGZuID09PSBzZmYgfHwgbmFtZSAmJiBuYW1lID09PSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb25OYW1lKCkpIHtcbiAgICAgIHJldHVybiBmcmFtZXMuc2xpY2UoaSArIDEpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZnJhbWVzO1xufVxuXG5mdW5jdGlvbiB1bndpbmQgKGZyYW1lcykge1xuICB2YXIgcmVzdWx0ID0gW107XG5cbiAgZm9yICh2YXIgaT0wLCBmbjsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGZuID0gZnJhbWVzW2ldLmdldEZ1bmN0aW9uKCk7XG5cbiAgICBpZiAoIWZuIHx8ICFmbltTWU1CT0xfSUdOT1JFXSkge1xuICAgICAgcmVzdWx0LnB1c2goZnJhbWVzW2ldKTtcbiAgICB9XG5cbiAgICBpZiAoZm4gJiYgZm5bU1lNQk9MX0ZSQU1FU10pIHtcbiAgICAgIGlmIChGYWlsdXJlLkZSQU1FX0VNUFRZKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKG51bGwpO1xuICAgICAgfVxuXG4gICAgICAvLyBDYWxsIHRoZSBnZXR0ZXIgYW5kIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIHJlc3VsdCBpbiBjYXNlIHdlIGhhdmUgdG9cbiAgICAgIC8vIHVud2luZCB0aGUgc2FtZSBmdW5jdGlvbiBhbm90aGVyIHRpbWUuXG4gICAgICAvLyBUT0RPOiBNYWtlIHN1cmUga2VlcGluZyBhIHJlZmVyZW5jZSB0byB0aGUgZnJhbWVzIGRvZXNuJ3QgY3JlYXRlIGxlYWtzXG4gICAgICBpZiAodHlwZW9mIGZuW1NZTUJPTF9GUkFNRVNdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhciBnZXR0ZXIgPSBmbltTWU1CT0xfRlJBTUVTXTtcbiAgICAgICAgZm5bU1lNQk9MX0ZSQU1FU10gPSBudWxsO1xuICAgICAgICBmbltTWU1CT0xfRlJBTUVTXSA9IGdldHRlcigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWZuW1NZTUJPTF9GUkFNRVNdKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW0ZhaWx1cmVdIEVtcHR5IGZyYW1lcyBhbm5vdGF0aW9uJyk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHVud2luZChmbltTWU1CT0xfRlJBTUVTXSkpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gUmVjZWl2ZXIgZm9yIHRoZSBmcmFtZXMgaW4gYSAuc3RhY2sgcHJvcGVydHkgZnJvbSBjYXB0dXJlU3RhY2tUcmFjZVxudmFyIFY4RlJBTUVTID0ge307XG5cbi8vIFY4IGNvZGUgcGF0aCBmb3IgZ2VuZXJhdGluZyBhIGZyYW1lcyBnZXR0ZXJcbmZ1bmN0aW9uIG1ha2VGcmFtZXNHZXR0ZXJWOCAoc2ZmKSB7XG4gIC8vIFRoaXMgd2lsbCBjYWxsIG91ciBjdXN0b20gcHJlcGFyZVN0YWNrVHJhY2VcbiAgTmF0aXZlRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoVjhGUkFNRVMsIHNmZiB8fCBtYWtlRnJhbWVzR2V0dGVyVjgpO1xuICBzZmYgPSBudWxsO1xuICB2YXIgZnJhbWVzID0gVjhGUkFNRVMuc3RhY2s7XG4gIFY4RlJBTUVTLnN0YWNrID0gbnVsbDsgIC8vIFRoaXMgaXMgbmVlZGVkIHRvIGF2b2lkIGxlYWtzISEhXG4gIFY4RlJBTUVTID0ge307ICAvLyBUaGUgbmV4dCBjYWxsIHJlcXVpcmVzIGFuIGVtcHR5IG9iamVjdFxuXG4gIHJldHVybiBmdW5jdGlvbiAoY2xlYW51cCkge1xuICAgIHZhciByZXN1bHQgPSBmcmFtZXM7XG4gICAgLy8gQ2xlYW4gdXAgY2xvc3VyZSB2YXJpYWJsZXMgdG8gaGVscCBHQ1xuICAgIGZyYW1lcyA9IG51bGw7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxuLy8gbm9uLVY4IGNvZGUgcGF0aCBmb3IgZ2VuZXJhdGluZyBhIGZyYW1lcyBnZXR0ZXJcbmZ1bmN0aW9uIG1ha2VGcmFtZXNHZXR0ZXJDb21wYXQgKHNmZikge1xuICAvLyBPYnRhaW4gYSBzdGFjayB0cmFjZSBhdCB0aGUgY3VycmVudCBwb2ludFxuICB2YXIgZXJyb3IgPSBnZXRFcnJvcldpdGhTdGFjaygpO1xuXG4gIC8vIFdhbGsgdGhlIGNhbGxlciBjaGFpbiB0byBhbm5vdGF0ZSB0aGUgc3RhY2sgd2l0aCBmdW5jdGlvbiByZWZlcmVuY2VzXG4gIC8vIEdpdmVuIHRoZSBsaW1pdGF0aW9ucyBpbXBvc2VkIGJ5IEVTNSBcInN0cmljdCBtb2RlXCIgaXQncyBub3QgcG9zc2libGVcbiAgLy8gdG8gb2J0YWluIHJlZmVyZW5jZXMgdG8gZnVuY3Rpb25zIGJleW9uZCBvbmUgdGhhdCBpcyBkZWZpbmVkIGluIHN0cmljdFxuICAvLyBtb2RlLiBBbHNvIG5vdGUgdGhhdCBhbnkga2luZCBvZiByZWN1cnNpb24gd2lsbCBtYWtlIHRoZSB3YWxrZXIgdW5hYmxlXG4gIC8vIHRvIGdvIHBhc3QgaXQuXG4gIHZhciBjYWxsZXIgPSBhcmd1bWVudHMuY2FsbGVlO1xuICB2YXIgZnVuY3Rpb25zID0gW2dldEVycm9yV2l0aFN0YWNrXTtcbiAgZm9yICh2YXIgaT0wOyBjYWxsZXIgJiYgaSA8IDEwOyBpKyspIHtcbiAgICBmdW5jdGlvbnMucHVzaChjYWxsZXIpO1xuICAgIGlmIChjYWxsZXIuY2FsbGVyID09PSBjYWxsZXIpIGJyZWFrO1xuICAgIGNhbGxlciA9IGNhbGxlci5jYWxsZXI7XG4gIH1cbiAgY2FsbGVyID0gbnVsbDtcblxuICByZXR1cm4gZnVuY3Rpb24gKGNsZWFudXApIHtcbiAgICB2YXIgZnJhbWVzID0gbnVsbDtcblxuICAgIGlmICghY2xlYW51cCkge1xuICAgICAgLy8gUGFyc2UgdGhlIHN0YWNrIHRyYWNlXG4gICAgICBmcmFtZXMgPSBFcnJvclN0YWNrUGFyc2VyLnBhcnNlKGVycm9yKTtcbiAgICAgIC8vIEF0dGFjaCBmdW5jdGlvbiByZWZlcmVuY2VzIHRvIHRoZSBmcmFtZXMgKHNraXBwaW5nIHRoZSBtYWtlciBmcmFtZXMpXG4gICAgICAvLyBhbmQgY3JlYXRpbmcgQ2FsbFNpdGUgb2JqZWN0cyBmb3IgZWFjaCBvbmUuXG4gICAgICBmb3IgKHZhciBpPTI7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZnJhbWVzW2ldLmZ1bmN0aW9uID0gZnVuY3Rpb25zW2ldO1xuICAgICAgICBmcmFtZXNbaV0gPSBuZXcgQ2FsbFNpdGUoZnJhbWVzW2ldKTtcbiAgICAgIH1cblxuICAgICAgZnJhbWVzID0gdHJpbShmcmFtZXMuc2xpY2UoMiksIHNmZik7XG4gICAgfVxuXG4gICAgLy8gQ2xlYW4gdXAgY2xvc3VyZSB2YXJpYWJsZXMgdG8gaGVscCBHQ1xuICAgIHNmZiA9IGVycm9yID0gZnVuY3Rpb25zID0gbnVsbDtcblxuICAgIHJldHVybiBmcmFtZXM7XG4gIH07XG59XG5cbi8vIEdlbmVyYXRlcyBhIGdldHRlciBmb3IgdGhlIGNhbGwgc2l0ZSBmcmFtZXMuIFRoZSBnZXR0ZXIgcmV0dXJuZWQgYnlcbi8vIHRoZXNlIGZhY3RvcmllcyBjYW4gb25seSB1c2VkIG9uY2UsIHNpbmNlIHRoZXkgY2xlYW4gdXAgdGhlaXIgaW5uZXIgc3RhdGVcbi8vIGFmdGVyIHRoZXkgYXJlIGNhbGxlZC4gVGhleSBhY2NlcHQgYW4gb3B0aW9uYWwgYm9vbGVhbiBhcmd1bWVudCB3aGljaFxuLy8gaWYgdHJ1ZSB3aWxsIGp1c3QgY2xlYW4gdXAgd2l0aG91dCBjb21wdXRpbmcgdGhlIGZyYW1lcy5cbi8vXG4vLyBUT0RPOiBJZiB3ZSBvYnNlcnZlIGxlYWtzIHdpdGggY29tcGxleCB1c2UgY2FzZXMgKGR1ZSB0byBjbG9zdXJlIHNjb3Blcylcbi8vICAgICAgIHdlIGNhbiBnZW5lcmF0ZSBoZXJlIG91ciBjb21wYXQgQ2FsbFNpdGUgb2JqZWN0cyBzdG9yaW5nIHRoZSBmdW5jdGlvbidzXG4vLyAgICAgICBzb3VyY2UgY29kZSBpbnN0ZWFkIG9mIGFuIGFjdHVhbCByZWZlcmVuY2UgdG8gdGhlbSwgdGhhdCBzaG91bGQgaGVscFxuLy8gICAgICAgdGhlIEdDIHNpbmNlIHdlJ2xsIGJlIGp1c3Qga2VlcGluZyBsaXRlcmFscyBhcm91bmQuXG52YXIgbWFrZUZyYW1lc0dldHRlciA9IHR5cGVvZiBOYXRpdmVFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICAgPyBtYWtlRnJhbWVzR2V0dGVyVjhcbiAgICAgICAgICAgICAgICAgICAgIDogbWFrZUZyYW1lc0dldHRlckNvbXBhdDtcblxuXG4vLyBPdmVycmlkZSBWOCBzdGFjayB0cmFjZSBidWlsZGVyIHRvIGluamVjdCBvdXIgbG9naWNcbnZhciBvbGRQcmVwYXJlU3RhY2tUcmFjZSA9IEVycm9yLnByZXBhcmVTdGFja1RyYWNlO1xuRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoZXJyb3IsIGZyYW1lcykge1xuICAvLyBXaGVuIGNhbGxlZCBmcm9tIG1ha2VGcmFtZXNHZXR0ZXJWOCB3ZSBqdXN0IHdhbnQgdG8gb2J0YWluIHRoZSBmcmFtZXNcbiAgaWYgKGVycm9yID09PSBWOEZSQU1FUykge1xuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICAvLyBGb3J3YXJkIHRvIGFueSBwcmV2aW91c2x5IGRlZmluZWQgYmVoYXZpb3VyXG4gIGlmIChvbGRQcmVwYXJlU3RhY2tUcmFjZSkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gb2xkUHJlcGFyZVN0YWNrVHJhY2UuY2FsbChFcnJvciwgZXJyb3IsIGZyYW1lcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gSnVzdCBpZ25vcmUgdGhlIGVycm9yIChpZToga2FybWEtc291cmNlLW1hcC1zdXBwb3J0KVxuICAgIH1cbiAgfVxuXG4gIC8vIEVtdWxhdGUgZGVmYXVsdCBiZWhhdmlvdXIgKHdpdGggbG9uZy10cmFjZXMpXG4gIHJldHVybiBGYWlsdXJlLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZS5jYWxsKGVycm9yLCB1bndpbmQoZnJhbWVzKSk7XG59O1xuXG4vLyBBdHRhY2ggYSBuZXcgZXhjbHVzaW9uIHByZWRpY2F0ZSBmb3IgZnJhbWVzXG5mdW5jdGlvbiBleGNsdWRlIChjdG9yLCBwcmVkaWNhdGUpIHtcbiAgdmFyIGZuID0gcHJlZGljYXRlO1xuXG4gIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgIGZuID0gZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgICByZXR1cm4gLTEgIT09IGZyYW1lLmdldEZpbGVOYW1lKCkuaW5kZXhPZihwcmVkaWNhdGUpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByZWRpY2F0ZS50ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm4gPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICAgIHJldHVybiBwcmVkaWNhdGUudGVzdChmcmFtZS5nZXRGaWxlTmFtZSgpKTtcbiAgICB9O1xuICB9XG5cbiAgY3Rvci5leGNsdWRlcy5wdXNoKGZuKTtcbn1cblxuLy8gRXhwb3NlIHRoZSBmaWx0ZXIgaW4gdGhlIHJvb3QgRmFpbHVyZSB0eXBlXG5GYWlsdXJlLmV4Y2x1ZGVzID0gW107XG5GYWlsdXJlLmV4Y2x1ZGUgPSBleGNsdWRlLmJpbmQobnVsbCwgRmFpbHVyZSk7XG5cbi8vIEF0dGFjaCBhIGZyYW1lcyBnZXR0ZXIgdG8gdGhlIGZ1bmN0aW9uIHNvIHdlIGNhbiByZS1jb25zdHJ1Y3QgYXN5bmMgc3RhY2tzLlxuLy9cbi8vIE5vdGUgdGhhdCB0aGlzIGp1c3QgYXVnbWVudHMgdGhlIGZ1bmN0aW9uIHdpdGggdGhlIG5ldyBwcm9wZXJ0eSwgaXQgZG9lc24ndFxuLy8gY3JlYXRlIGEgd3JhcHBlciBldmVyeSB0aW1lIGl0J3MgY2FsbGVkLCBzbyB1c2luZyBpdCBtdWx0aXBsZSB0aW1lcyBvbiB0aGVcbi8vIHNhbWUgZnVuY3Rpb24gd2lsbCBpbmRlZWQgb3ZlcndyaXRlIHRoZSBwcmV2aW91cyB0cmFja2luZyBpbmZvcm1hdGlvbi4gVGhpc1xuLy8gaXMgaW50ZW5kZWQgc2luY2UgaXQncyBmYXN0ZXIgYW5kIG1vcmUgaW1wb3J0YW50bHkgZG9lc24ndCBicmVhayBzb21lIEFQSXNcbi8vIHVzaW5nIGNhbGxiYWNrIHJlZmVyZW5jZXMgdG8gdW5yZWdpc3RlciB0aGVtIGZvciBpbnN0YW5jZS5cbi8vIFdoZW4geW91IHdhbnQgdG8gdXNlIHRoZSBzYW1lIGZ1bmN0aW9uIHdpdGggZGlmZmVyZW50IHRyYWNraW5nIGluZm9ybWF0aW9uXG4vLyBqdXN0IHVzZSBGYWlsdXJlLndyYXAoKS5cbi8vXG4vLyBUaGUgdHJhY2tpbmcgY2FuIGJlIGdsb2JhbGx5IGRpc2FibGVkIGJ5IHNldHRpbmcgRmFpbHVyZS5UUkFDS0lORyB0byBmYWxzZVxuRmFpbHVyZS50cmFjayA9IGZ1bmN0aW9uIEZhaWx1cmVfdHJhY2sgKGZuLCBzZmYpIHtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIC8vIENsZWFuIHVwIHByZXZpb3VzIGZyYW1lcyB0byBoZWxwIHRoZSBHQ1xuICBpZiAodHlwZW9mIGZuW1NZTUJPTF9GUkFNRVNdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm5bU1lNQk9MX0ZSQU1FU10odHJ1ZSk7XG4gIH1cblxuICBpZiAoRmFpbHVyZS5UUkFDS0lORykge1xuICAgIGZuW1NZTUJPTF9GUkFNRVNdID0gbnVsbDtcbiAgICBmbltTWU1CT0xfRlJBTUVTXSA9IG1ha2VGcmFtZXNHZXR0ZXIoc2ZmIHx8IEZhaWx1cmVfdHJhY2spO1xuICB9XG5cbiAgcmV0dXJuIGZuO1xufTtcblxuLy8gV3JhcHMgdGhlIGZ1bmN0aW9uIGJlZm9yZSBhbm5vdGF0aW5nIGl0IHdpdGggdHJhY2tpbmcgaW5mb3JtYXRpb24sIHRoaXNcbi8vIGFsbG93cyB0byB0cmFjayBtdWx0aXBsZSBjYWxscyBmb3IgYSBzaW5nbGUgZnVuY3Rpb24uXG5GYWlsdXJlLndyYXAgPSBmdW5jdGlvbiBGYWlsdXJlX3dyYXAgKGZuKSB7XG4gIHZhciB3cmFwcGVyID0gRmFpbHVyZS5pZ25vcmUoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gRmFpbHVyZS50cmFjayh3cmFwcGVyLCBGYWlsdXJlX3dyYXApO1xufTtcblxuLy8gTWFyayBhIGZ1bmN0aW9uIHRvIGJlIGlnbm9yZWQgd2hlbiBnZW5lcmF0aW5nIHN0YWNrIHRyYWNlc1xuRmFpbHVyZS5pZ25vcmUgPSBmdW5jdGlvbiBGYWlsdXJlX2lnbm9yZSAoZm4pIHtcbiAgZm5bU1lNQk9MX0lHTk9SRV0gPSB0cnVlO1xuICByZXR1cm4gZm47XG59O1xuXG4vLyBIZWxwZXIgZm9yIHRyYWNraW5nIGEgc2V0VGltZW91dFxuRmFpbHVyZS5zZXRUaW1lb3V0ID0gZnVuY3Rpb24gRmFpbHVyZV9zZXRUaW1lb3V0ICgpIHtcbiAgYXJndW1lbnRzWzBdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbMF0sIEZhaWx1cmVfc2V0VGltZW91dCk7XG4gIHJldHVybiBzZXRUaW1lb3V0LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG4vLyBIZWxwZXIgZm9yIHRyYWNraW5nIGEgbmV4dFRpY2tcbkZhaWx1cmUubmV4dFRpY2sgPSBmdW5jdGlvbiBGYWlsdXJlX25leHRUaWNrICgpIHtcbiAgYXJndW1lbnRzWzBdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbMF0sIEZhaWx1cmVfbmV4dFRpY2spO1xuICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljay5hcHBseShwcm9jZXNzLCBhcmd1bWVudHMpO1xufTtcblxuLy8gQWxsb3dzIHRvIGVhc2lseSBwYXRjaCBhIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSBjYWxsYmFja1xuLy8gdG8gYWxsb3cgdHJhY2tpbmcgdGhlIGFzeW5jIGZsb3dzLlxuLy8gaWU6IEZhaWx1cmUucGF0aCh3aW5kb3csICdzZXRJbnRlcnZhbCcpXG5GYWlsdXJlLnBhdGNoID0gZnVuY3Rpb24gRmFpbHVyZV9wYXRjaChvYmosIG5hbWUsIGlkeCkge1xuICBpZiAob2JqICYmIHR5cGVvZiBvYmpbbmFtZV0gIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ09iamVjdCBkb2VzIG5vdCBoYXZlIGEgXCInICsgbmFtZSArICdcIiBtZXRob2QnKTtcbiAgfVxuXG4gIHZhciBvcmlnaW5hbCA9IG9ialtuYW1lXTtcblxuICAvLyBXaGVuIHRoZSBleGFjdCBhcmd1bWVudCBpbmRleCBpcyBwcm92aWRlZCB1c2UgYW4gb3B0aW1pemVkIGNvZGUgcGF0aFxuICBpZiAodHlwZW9mIGlkeCA9PT0gJ251bWJlcicpIHtcblxuICAgIG9ialtuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGFyZ3VtZW50c1tpZHhdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbaWR4XSwgb2JqW25hbWVdKTtcbiAgICAgIHJldHVybiBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgLy8gT3RoZXJ3aXNlIGRldGVjdCB0aGUgZnVuY3Rpb25zIHRvIHRyYWNrIGF0IGludm9rYXRpb24gdGltZVxuICB9IGVsc2Uge1xuXG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBhcmd1bWVudHNbaV0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1tpXSwgb2JqW25hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICB9XG5cbiAgLy8gQXVnbWVudCB0aGUgd3JhcHBlciB3aXRoIGFueSBwcm9wZXJ0aWVzIGZyb20gdGhlIG9yaWdpbmFsXG4gIGZvciAodmFyIGsgaW4gb3JpZ2luYWwpIGlmIChvcmlnaW5hbC5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgIG9ialtuYW1lXVtrXSA9IG9yaWdpbmFsW2tdO1xuICB9XG5cbiAgcmV0dXJuIG9ialtuYW1lXTtcbn07XG5cbi8vIEhlbHBlciB0byBjcmVhdGUgbmV3IEZhaWx1cmUgdHlwZXNcbkZhaWx1cmUuY3JlYXRlID0gZnVuY3Rpb24gKG5hbWUsIHByb3BzKSB7XG4gIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgRmFpbHVyZSgnRXhwZWN0ZWQgYSBuYW1lIGFzIGZpcnN0IGFyZ3VtZW50Jyk7XG4gIH1cblxuICBmdW5jdGlvbiBjdG9yIChtZXNzYWdlLCBzZmYpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmFpbHVyZSkpIHtcbiAgICAgIHJldHVybiBuZXcgY3RvcihtZXNzYWdlLCBzZmYpO1xuICAgIH1cbiAgICBGYWlsdXJlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICAvLyBBdWdtZW50IGNvbnN0cnVjdG9yXG4gIGN0b3IuZXhjbHVkZXMgPSBbXTtcbiAgY3Rvci5leGNsdWRlID0gZnVuY3Rpb24gKHByZWRpY2F0ZSkge1xuICAgIGV4Y2x1ZGUoY3RvciwgcHJlZGljYXRlKTtcbiAgfTtcblxuICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRmFpbHVyZS5wcm90b3R5cGUpO1xuICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3I7XG4gIGN0b3IucHJvdG90eXBlLm5hbWUgPSBuYW1lO1xuICBpZiAodHlwZW9mIHByb3BzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY3Rvci5wcm90b3R5cGUucHJlcGFyZVN0YWNrVHJhY2UgPSBwcm9wcztcbiAgfSBlbHNlIGlmIChwcm9wcykge1xuICAgIE9iamVjdC5rZXlzKHByb3BzKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICBjdG9yLnByb3RvdHlwZVtwcm9wXSA9IHByb3A7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGN0b3I7XG59O1xuXG52YXIgYnVpbHRpbkVycm9yVHlwZXMgPSBbXG4gICdFcnJvcicsICdUeXBlRXJyb3InLCAnUmFuZ2VFcnJvcicsICdSZWZlcmVuY2VFcnJvcicsICdTeW50YXhFcnJvcicsXG4gICdFdmFsRXJyb3InLCAnVVJJRXJyb3InLCAnSW50ZXJuYWxFcnJvcidcbl07XG52YXIgYnVpbHRpbkVycm9ycyA9IHt9O1xuXG5GYWlsdXJlLmluc3RhbGwgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByb290ID0gdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgPyB3aW5kb3cgOiBnbG9iYWw7XG5cbiAgYnVpbHRpbkVycm9yVHlwZXMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIGlmIChyb290W3R5cGVdICYmICFidWlsdGluRXJyb3JzW3R5cGVdKSB7XG4gICAgICBidWlsdGluRXJyb3JzW3R5cGVdID0gcm9vdFt0eXBlXTtcbiAgICAgIHJvb3RbdHlwZV0gPSBGYWlsdXJlLmNyZWF0ZSh0eXBlKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEFsbG93IHVzYWdlOiB2YXIgRmFpbHVyZSA9IHJlcXVpcmUoJ2ZhaWx1cmUnKS5pbnN0YWxsKClcbiAgcmV0dXJuIEZhaWx1cmU7XG59O1xuXG5GYWlsdXJlLnVuaW5zdGFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgYnVpbHRpbkVycm9yVHlwZXMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIHJvb3RbdHlwZV0gPSBidWlsdGluRXJyb3JzW3R5cGVdIHx8IHJvb3RbdHlwZV07XG4gIH0pO1xufTtcblxuXG52YXIgcHJvdG8gPSBGYWlsdXJlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gRmFpbHVyZTtcblxucHJvdG8ubmFtZSA9ICdGYWlsdXJlJztcbnByb3RvLm1lc3NhZ2UgPSAnJztcblxuaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgPT09ICdmdW5jdGlvbicpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZnJhbWVzJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gVXNlIHRyaW1taW5nIGp1c3QgaW4gY2FzZSB0aGUgc2ZmIHdhcyBkZWZpbmVkIGFmdGVyIGNvbnN0cnVjdGluZ1xuICAgICAgdmFyIGZyYW1lcyA9IHVud2luZCh0cmltKHRoaXMuX2dldEZyYW1lcygpLCB0aGlzLnNmZikpO1xuXG4gICAgICAvLyBDYWNoZSBuZXh0IGFjY2Vzc2VzIHRvIHRoZSBwcm9wZXJ0eVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdmcmFtZXMnLCB7XG4gICAgICAgIHZhbHVlOiBmcmFtZXMsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgLy8gQ2xlYW4gdXAgdGhlIGdldHRlciBjbG9zdXJlXG4gICAgICB0aGlzLl9nZXRGcmFtZXMgPSBudWxsO1xuXG4gICAgICByZXR1cm4gZnJhbWVzO1xuICAgIH1cbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnc3RhY2snLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc3RhY2sgPSB0aGlzLmdlbmVyYXRlU3RhY2tUcmFjZSgpO1xuXG4gICAgICAvLyBDYWNoZSBuZXh0IGFjY2Vzc2VzIHRvIHRoZSBwcm9wZXJ0eVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzdGFjaycsIHtcbiAgICAgICAgdmFsdWU6IHN0YWNrLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzdGFjaztcbiAgICB9XG4gIH0pO1xufVxuXG5wcm90by5nZW5lcmF0ZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBleGNsdWRlcyA9IHRoaXMuY29uc3RydWN0b3IuZXhjbHVkZXM7XG4gIHZhciBpbmNsdWRlLCBmcmFtZXMgPSBbXTtcblxuICAvLyBTcGVjaWZpYyBwcm90b3R5cGVzIGluaGVyaXQgdGhlIGV4Y2x1ZGVzIGZyb20gRmFpbHVyZVxuICBpZiAoZXhjbHVkZXMgIT09IEZhaWx1cmUuZXhjbHVkZXMpIHtcbiAgICBleGNsdWRlcy5wdXNoLmFwcGx5KGV4Y2x1ZGVzLCBGYWlsdXJlLmV4Y2x1ZGVzKTtcbiAgfVxuXG4gIC8vIEFwcGx5IGZpbHRlcmluZ1xuICBmb3IgKHZhciBpPTA7IGkgPCB0aGlzLmZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGluY2x1ZGUgPSB0cnVlO1xuICAgIGlmICh0aGlzLmZyYW1lc1tpXSkge1xuICAgICAgZm9yICh2YXIgaj0wOyBpbmNsdWRlICYmIGogPCBleGNsdWRlcy5sZW5ndGg7IGorKykge1xuICAgICAgICBpbmNsdWRlICY9ICFleGNsdWRlc1tqXS5jYWxsKHRoaXMsIHRoaXMuZnJhbWVzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGluY2x1ZGUpIHtcbiAgICAgIGZyYW1lcy5wdXNoKHRoaXMuZnJhbWVzW2ldKTtcbiAgICB9XG4gIH1cblxuICAvLyBIb25vciBhbnkgcHJldmlvdXNseSBkZWZpbmVkIHN0YWNrdHJhY2UgZm9ybWF0dGVyIGJ5IGFsbG93aW5nXG4gIC8vIGl0IHRvIGZvcm1hdCB0aGUgZnJhbWVzLiBUaGlzIGlzIG5lZWRlZCB3aGVuIHVzaW5nXG4gIC8vIG5vZGUtc291cmNlLW1hcC1zdXBwb3J0IGZvciBpbnN0YW5jZS5cbiAgLy8gVE9ETzogQ2FuIHdlIG1hcCB0aGUgXCJudWxsXCIgZnJhbWVzIHRvIGEgQ2FsbEZyYW1lIHNoaW0/XG4gIGlmIChvbGRQcmVwYXJlU3RhY2tUcmFjZSkge1xuICAgIGZyYW1lcyA9IGZyYW1lcy5maWx0ZXIoZnVuY3Rpb24gKHgpIHsgcmV0dXJuICEheDsgfSk7XG4gICAgcmV0dXJuIG9sZFByZXBhcmVTdGFja1RyYWNlLmNhbGwoRXJyb3IsIHRoaXMsIGZyYW1lcyk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5wcmVwYXJlU3RhY2tUcmFjZShmcmFtZXMpO1xufTtcblxucHJvdG8ucHJlcGFyZVN0YWNrVHJhY2UgPSBmdW5jdGlvbiAoZnJhbWVzKSB7XG4gIHZhciBsaW5lcyA9IFt0aGlzXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGZyYW1lc1tpXSA/IEZhaWx1cmUuRlJBTUVfUFJFRklYICsgZnJhbWVzW2ldIDogRmFpbHVyZS5GUkFNRV9FTVBUWVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEZhaWx1cmU7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKCdfcHJvY2VzcycpLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbTV2WkdWZmJXOWtkV3hsY3k5bVlXbHNkWEpsTDJ4cFlpOW1ZV2xzZFhKbExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdSWEp5YjNKVGRHRmphMUJoY25ObGNpQTlJSEpsY1hWcGNtVW9KMlZ5Y205eUxYTjBZV05yTFhCaGNuTmxjaWNwTzF4dWRtRnlJRU5oYkd4VGFYUmxJRDBnY21WeGRXbHlaU2duTGk5allXeHNMWE5wZEdVbktUdGNibHh1THk4Z1MyVmxjQ0JoSUhKbFptVnlaVzVqWlNCMGJ5QjBhR1VnWW5WcGJIUnBiaUJsY25KdmNpQmpiMjV6ZEhKMVkzUnZjbHh1ZG1GeUlFNWhkR2wyWlVWeWNtOXlJRDBnUlhKeWIzSTdYRzVjYmk4dklFRnVibTkwWVhScGIyNGdjM2x0WW05c2MxeHVkbUZ5SUZOWlRVSlBURjlHVWtGTlJWTWdQU0FuUUVCbVlXbHNkWEpsTDJaeVlXMWxjeWM3WEc1MllYSWdVMWxOUWs5TVgwbEhUazlTUlNBOUlDZEFRR1poYVd4MWNtVXZhV2R1YjNKbEp6dGNibHh1WEc1bWRXNWpkR2x2YmlCR1lXbHNkWEpsSUNodFpYTnpZV2RsTENCelptWXBJSHRjYmlBZ2FXWWdLQ0VvZEdocGN5QnBibk4wWVc1alpXOW1JRVpoYVd4MWNtVXBLU0I3WEc0Z0lDQWdjbVYwZFhKdUlHNWxkeUJHWVdsc2RYSmxLRzFsYzNOaFoyVXNJSE5tWmlCOGZDQkdZV2xzZFhKbEtUdGNiaUFnZlZ4dVhHNGdJSFJvYVhNdWMyWm1JRDBnYzJabUlIeDhJSFJvYVhNdVkyOXVjM1J5ZFdOMGIzSTdYRzVjYmlBZ2RHaHBjeTV0WlhOellXZGxJRDBnYldWemMyRm5aVHRjYmx4dUlDQXZMeUJIWlc1bGNtRjBaU0JoSUdkbGRIUmxjaUJtYjNJZ2RHaGxJR1p5WVcxbGN5d2dkR2hwY3lCbGJuTjFjbVZ6SUhSb1lYUWdkMlVnWkc4Z1lYTWdiR2wwZEd4bElIZHZjbXRjYmlBZ0x5OGdZWE1nY0c5emMybGliR1VnZDJobGJpQnBibk4wWVc1MGFXRjBhVzVuSUhSb1pTQmxjbkp2Y2l3Z1pHVm1aWEp5YVc1bklIUm9aU0JsZUhCbGJuTnBkbVVnYzNSaFkydGNiaUFnTHk4Z2JXRnVaMnhwYm1jZ2IzQmxjbUYwYVc5dWN5QjFiblJwYkNCMGFHVWdMbk4wWVdOcklIQnliM0JsY25SNUlHbHpJR0ZqZEhWaGJHeDVJSEpsY1hWbGMzUmxaQzVjYmlBZ2RHaHBjeTVmWjJWMFJuSmhiV1Z6SUQwZ2JXRnJaVVp5WVcxbGMwZGxkSFJsY2loMGFHbHpMbk5tWmlrN1hHNWNiaUFnTHk4Z1QyNGdSVk0xSUdWdVoybHVaWE1nZDJVZ2RYTmxJRzl1WlMxMGFXMWxJR2RsZEhSbGNuTWdkRzhnWVdOMGRXRnNiSGtnWkdWbVpYSWdkR2hsSUdWNGNHVnVjMmwyWlZ4dUlDQXZMeUJ2Y0dWeVlYUnBiMjV6SUNoa1pXWnBibVZrSUdsdUlIUm9aU0J3Y205MGIzUjVjR1VnWm05eUlIQmxjbVp2Y20xaGJtTmxJSEpsWVhOdmJuTXBJSGRvYVd4bElHeGxaMkZqZVZ4dUlDQXZMeUJsYm1kcGJtVnpJSGRwYkd3Z2MybHRjR3g1SUdSdklHRnNiQ0IwYUdVZ2QyOXlheUIxY0NCbWNtOXVkQzVjYmlBZ2FXWWdLQ0V2WEZ4YmJtRjBhWFpsSUdOdlpHVmNYRjB2TG5SbGMzUW9UMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1S1NrZ2UxeHVJQ0FnSUhSb2FYTXVabkpoYldWeklEMGdkVzUzYVc1a0tIUm9hWE11WDJkbGRFWnlZVzFsY3lncEtUdGNiaUFnSUNCMGFHbHpMbDluWlhSR2NtRnRaWE1nUFNCdWRXeHNPMXh1SUNBZ0lIUm9hWE11YzNSaFkyc2dQU0IwYUdsekxtZGxibVZ5WVhSbFUzUmhZMnRVY21GalpTZ3BPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJSFJvYVhNN1hHNTlYRzVjYmk4dklGTmxkQ0JHVWtGTlJWOUZUVkJVV1NCMGJ5QnVkV3hzSUhSdklHUnBjMkZpYkdVZ1lXNTVJSE52Y25RZ2IyWWdjMlZ3WVhKaGRHOXlYRzVHWVdsc2RYSmxMa1pTUVUxRlgwVk5VRlJaSUQwZ0p5QWdMUzB0TFNjN1hHNUdZV2xzZFhKbExrWlNRVTFGWDFCU1JVWkpXQ0E5SUNjZ0lHRjBJQ2M3WEc1Y2JpOHZJRUo1SUdSbFptRjFiSFFnZDJVZ1pXNWhZbXhsSUhSeVlXTnJhVzVuSUdadmNpQmhjM2x1WXlCemRHRmpheUIwY21GalpYTmNia1poYVd4MWNtVXVWRkpCUTB0SlRrY2dQU0IwY25WbE8xeHVYRzVjYmk4dklFaGxiSEJsY2lCMGJ5QnZZblJoYVc0Z2RHaGxJR04xY25KbGJuUWdjM1JoWTJzZ2RISmhZMlZjYm5aaGNpQm5aWFJGY25KdmNsZHBkR2hUZEdGamF5QTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdjbVYwZFhKdUlHNWxkeUJPWVhScGRtVkZjbkp2Y2lncE8xeHVmVHRjYmk4dklGTnZiV1VnWlc1bmFXNWxjeUJrYnlCdWIzUWdaMlZ1WlhKaGRHVWdkR2hsSUM1emRHRmpheUJ3Y205d1pYSjBlU0IxYm5ScGJDQnBkQ2R6SUhSb2NtOTNibHh1YVdZZ0tDRm5aWFJGY25KdmNsZHBkR2hUZEdGamF5Z3BMbk4wWVdOcktTQjdYRzRnSUdkbGRFVnljbTl5VjJsMGFGTjBZV05ySUQwZ1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lIUnllU0I3SUhSb2NtOTNJRzVsZHlCT1lYUnBkbVZGY25KdmNpZ3BPeUI5SUdOaGRHTm9JQ2hsS1NCN0lISmxkSFZ5YmlCbE95QjlYRzRnSUgwN1hHNTlYRzVjYmk4dklGUnlhVzBnWm5KaGJXVnpJSFZ1WkdWeUlIUm9aU0J3Y205MmFXUmxaQ0J6ZEdGamF5Qm1hWEp6ZENCbWRXNWpkR2x2Ymx4dVpuVnVZM1JwYjI0Z2RISnBiU2htY21GdFpYTXNJSE5tWmlrZ2UxeHVJQ0IyWVhJZ1ptNHNJRzVoYldVZ1BTQnpabVl1Ym1GdFpUdGNiaUFnYVdZZ0tDRm1jbUZ0WlhNcElIdGNiaUFnSUNCamIyNXpiMnhsTG5kaGNtNG9KMXRHWVdsc2RYSmxYU0JsY25KdmNpQmpZWEIwZFhKcGJtY2dabkpoYldWekp5azdYRzRnSUNBZ2NtVjBkWEp1SUZ0ZE8xeHVJQ0I5WEc0Z0lHWnZjaUFvZG1GeUlHazlNRHNnYVNBOElHWnlZVzFsY3k1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lHWnVJRDBnWm5KaGJXVnpXMmxkTG1kbGRFWjFibU4wYVc5dUtDazdYRzRnSUNBZ2FXWWdLR1p1SUNZbUlHWnVJRDA5UFNCelptWWdmSHdnYm1GdFpTQW1KaUJ1WVcxbElEMDlQU0JtY21GdFpYTmJhVjB1WjJWMFJuVnVZM1JwYjI1T1lXMWxLQ2twSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJtY21GdFpYTXVjMnhwWTJVb2FTQXJJREVwTzF4dUlDQWdJSDFjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdabkpoYldWek8xeHVmVnh1WEc1bWRXNWpkR2x2YmlCMWJuZHBibVFnS0daeVlXMWxjeWtnZTF4dUlDQjJZWElnY21WemRXeDBJRDBnVzEwN1hHNWNiaUFnWm05eUlDaDJZWElnYVQwd0xDQm1ianNnYVNBOElHWnlZVzFsY3k1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lHWnVJRDBnWm5KaGJXVnpXMmxkTG1kbGRFWjFibU4wYVc5dUtDazdYRzVjYmlBZ0lDQnBaaUFvSVdadUlIeDhJQ0ZtYmx0VFdVMUNUMHhmU1VkT1QxSkZYU2tnZTF4dUlDQWdJQ0FnY21WemRXeDBMbkIxYzJnb1puSmhiV1Z6VzJsZEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCcFppQW9abTRnSmlZZ1ptNWJVMWxOUWs5TVgwWlNRVTFGVTEwcElIdGNiaUFnSUNBZ0lHbG1JQ2hHWVdsc2RYSmxMa1pTUVUxRlgwVk5VRlJaS1NCN1hHNGdJQ0FnSUNBZ0lISmxjM1ZzZEM1d2RYTm9LRzUxYkd3cE8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQXZMeUJEWVd4c0lIUm9aU0JuWlhSMFpYSWdZVzVrSUd0bFpYQWdZU0J5WldabGNtVnVZMlVnZEc4Z2RHaGxJSEpsYzNWc2RDQnBiaUJqWVhObElIZGxJR2hoZG1VZ2RHOWNiaUFnSUNBZ0lDOHZJSFZ1ZDJsdVpDQjBhR1VnYzJGdFpTQm1kVzVqZEdsdmJpQmhibTkwYUdWeUlIUnBiV1V1WEc0Z0lDQWdJQ0F2THlCVVQwUlBPaUJOWVd0bElITjFjbVVnYTJWbGNHbHVaeUJoSUhKbFptVnlaVzVqWlNCMGJ5QjBhR1VnWm5KaGJXVnpJR1J2WlhOdUozUWdZM0psWVhSbElHeGxZV3R6WEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdadVcxTlpUVUpQVEY5R1VrRk5SVk5kSUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdJQ0FnSUhaaGNpQm5aWFIwWlhJZ1BTQm1ibHRUV1UxQ1QweGZSbEpCVFVWVFhUdGNiaUFnSUNBZ0lDQWdabTViVTFsTlFrOU1YMFpTUVUxRlUxMGdQU0J1ZFd4c08xeHVJQ0FnSUNBZ0lDQm1ibHRUV1UxQ1QweGZSbEpCVFVWVFhTQTlJR2RsZEhSbGNpZ3BPMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0JwWmlBb0lXWnVXMU5aVFVKUFRGOUdVa0ZOUlZOZEtTQjdYRzRnSUNBZ0lDQWdJR052Ym5OdmJHVXVkMkZ5YmlnblcwWmhhV3gxY21WZElFVnRjSFI1SUdaeVlXMWxjeUJoYm01dmRHRjBhVzl1SnlrN1hHNGdJQ0FnSUNBZ0lHTnZiblJwYm5WbE8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQnlaWE4xYkhRdWNIVnphQzVoY0hCc2VTaHlaWE4xYkhRc0lIVnVkMmx1WkNobWJsdFRXVTFDVDB4ZlJsSkJUVVZUWFNrcE8xeHVJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lDQWdmVnh1SUNCOVhHNWNiaUFnY21WMGRYSnVJSEpsYzNWc2REdGNibjFjYmx4dUx5OGdVbVZqWldsMlpYSWdabTl5SUhSb1pTQm1jbUZ0WlhNZ2FXNGdZU0F1YzNSaFkyc2djSEp2Y0dWeWRIa2dabkp2YlNCallYQjBkWEpsVTNSaFkydFVjbUZqWlZ4dWRtRnlJRlk0UmxKQlRVVlRJRDBnZTMwN1hHNWNiaTh2SUZZNElHTnZaR1VnY0dGMGFDQm1iM0lnWjJWdVpYSmhkR2x1WnlCaElHWnlZVzFsY3lCblpYUjBaWEpjYm1aMWJtTjBhVzl1SUcxaGEyVkdjbUZ0WlhOSFpYUjBaWEpXT0NBb2MyWm1LU0I3WEc0Z0lDOHZJRlJvYVhNZ2QybHNiQ0JqWVd4c0lHOTFjaUJqZFhOMGIyMGdjSEpsY0dGeVpWTjBZV05yVkhKaFkyVmNiaUFnVG1GMGFYWmxSWEp5YjNJdVkyRndkSFZ5WlZOMFlXTnJWSEpoWTJVb1ZqaEdVa0ZOUlZNc0lITm1aaUI4ZkNCdFlXdGxSbkpoYldWelIyVjBkR1Z5VmpncE8xeHVJQ0J6Wm1ZZ1BTQnVkV3hzTzF4dUlDQjJZWElnWm5KaGJXVnpJRDBnVmpoR1VrRk5SVk11YzNSaFkyczdYRzRnSUZZNFJsSkJUVVZUTG5OMFlXTnJJRDBnYm5Wc2JEc2dJQzh2SUZSb2FYTWdhWE1nYm1WbFpHVmtJSFJ2SUdGMmIybGtJR3hsWVd0eklTRWhYRzRnSUZZNFJsSkJUVVZUSUQwZ2UzMDdJQ0F2THlCVWFHVWdibVY0ZENCallXeHNJSEpsY1hWcGNtVnpJR0Z1SUdWdGNIUjVJRzlpYW1WamRGeHVYRzRnSUhKbGRIVnliaUJtZFc1amRHbHZiaUFvWTJ4bFlXNTFjQ2tnZTF4dUlDQWdJSFpoY2lCeVpYTjFiSFFnUFNCbWNtRnRaWE03WEc0Z0lDQWdMeThnUTJ4bFlXNGdkWEFnWTJ4dmMzVnlaU0IyWVhKcFlXSnNaWE1nZEc4Z2FHVnNjQ0JIUTF4dUlDQWdJR1p5WVcxbGN5QTlJRzUxYkd3N1hHNGdJQ0FnY21WMGRYSnVJSEpsYzNWc2REdGNiaUFnZlR0Y2JuMWNibHh1THk4Z2JtOXVMVlk0SUdOdlpHVWdjR0YwYUNCbWIzSWdaMlZ1WlhKaGRHbHVaeUJoSUdaeVlXMWxjeUJuWlhSMFpYSmNibVoxYm1OMGFXOXVJRzFoYTJWR2NtRnRaWE5IWlhSMFpYSkRiMjF3WVhRZ0tITm1aaWtnZTF4dUlDQXZMeUJQWW5SaGFXNGdZU0J6ZEdGamF5QjBjbUZqWlNCaGRDQjBhR1VnWTNWeWNtVnVkQ0J3YjJsdWRGeHVJQ0IyWVhJZ1pYSnliM0lnUFNCblpYUkZjbkp2Y2xkcGRHaFRkR0ZqYXlncE8xeHVYRzRnSUM4dklGZGhiR3NnZEdobElHTmhiR3hsY2lCamFHRnBiaUIwYnlCaGJtNXZkR0YwWlNCMGFHVWdjM1JoWTJzZ2QybDBhQ0JtZFc1amRHbHZiaUJ5WldabGNtVnVZMlZ6WEc0Z0lDOHZJRWRwZG1WdUlIUm9aU0JzYVcxcGRHRjBhVzl1Y3lCcGJYQnZjMlZrSUdKNUlFVlROU0JjSW5OMGNtbGpkQ0J0YjJSbFhDSWdhWFFuY3lCdWIzUWdjRzl6YzJsaWJHVmNiaUFnTHk4Z2RHOGdiMkowWVdsdUlISmxabVZ5Wlc1alpYTWdkRzhnWm5WdVkzUnBiMjV6SUdKbGVXOXVaQ0J2Ym1VZ2RHaGhkQ0JwY3lCa1pXWnBibVZrSUdsdUlITjBjbWxqZEZ4dUlDQXZMeUJ0YjJSbExpQkJiSE52SUc1dmRHVWdkR2hoZENCaGJua2dhMmx1WkNCdlppQnlaV04xY25OcGIyNGdkMmxzYkNCdFlXdGxJSFJvWlNCM1lXeHJaWElnZFc1aFlteGxYRzRnSUM4dklIUnZJR2R2SUhCaGMzUWdhWFF1WEc0Z0lIWmhjaUJqWVd4c1pYSWdQU0JoY21kMWJXVnVkSE11WTJGc2JHVmxPMXh1SUNCMllYSWdablZ1WTNScGIyNXpJRDBnVzJkbGRFVnljbTl5VjJsMGFGTjBZV05yWFR0Y2JpQWdabTl5SUNoMllYSWdhVDB3T3lCallXeHNaWElnSmlZZ2FTQThJREV3T3lCcEt5c3BJSHRjYmlBZ0lDQm1kVzVqZEdsdmJuTXVjSFZ6YUNoallXeHNaWElwTzF4dUlDQWdJR2xtSUNoallXeHNaWEl1WTJGc2JHVnlJRDA5UFNCallXeHNaWElwSUdKeVpXRnJPMXh1SUNBZ0lHTmhiR3hsY2lBOUlHTmhiR3hsY2k1allXeHNaWEk3WEc0Z0lIMWNiaUFnWTJGc2JHVnlJRDBnYm5Wc2JEdGNibHh1SUNCeVpYUjFjbTRnWm5WdVkzUnBiMjRnS0dOc1pXRnVkWEFwSUh0Y2JpQWdJQ0IyWVhJZ1puSmhiV1Z6SUQwZ2JuVnNiRHRjYmx4dUlDQWdJR2xtSUNnaFkyeGxZVzUxY0NrZ2UxeHVJQ0FnSUNBZ0x5OGdVR0Z5YzJVZ2RHaGxJSE4wWVdOcklIUnlZV05sWEc0Z0lDQWdJQ0JtY21GdFpYTWdQU0JGY25KdmNsTjBZV05yVUdGeWMyVnlMbkJoY25ObEtHVnljbTl5S1R0Y2JpQWdJQ0FnSUM4dklFRjBkR0ZqYUNCbWRXNWpkR2x2YmlCeVpXWmxjbVZ1WTJWeklIUnZJSFJvWlNCbWNtRnRaWE1nS0hOcmFYQndhVzVuSUhSb1pTQnRZV3RsY2lCbWNtRnRaWE1wWEc0Z0lDQWdJQ0F2THlCaGJtUWdZM0psWVhScGJtY2dRMkZzYkZOcGRHVWdiMkpxWldOMGN5Qm1iM0lnWldGamFDQnZibVV1WEc0Z0lDQWdJQ0JtYjNJZ0tIWmhjaUJwUFRJN0lHa2dQQ0JtY21GdFpYTXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0FnSUNBZ1puSmhiV1Z6VzJsZExtWjFibU4wYVc5dUlEMGdablZ1WTNScGIyNXpXMmxkTzF4dUlDQWdJQ0FnSUNCbWNtRnRaWE5iYVYwZ1BTQnVaWGNnUTJGc2JGTnBkR1VvWm5KaGJXVnpXMmxkS1R0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ1puSmhiV1Z6SUQwZ2RISnBiU2htY21GdFpYTXVjMnhwWTJVb01pa3NJSE5tWmlrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHk4Z1EyeGxZVzRnZFhBZ1kyeHZjM1Z5WlNCMllYSnBZV0pzWlhNZ2RHOGdhR1ZzY0NCSFExeHVJQ0FnSUhObVppQTlJR1Z5Y205eUlEMGdablZ1WTNScGIyNXpJRDBnYm5Wc2JEdGNibHh1SUNBZ0lISmxkSFZ5YmlCbWNtRnRaWE03WEc0Z0lIMDdYRzU5WEc1Y2JpOHZJRWRsYm1WeVlYUmxjeUJoSUdkbGRIUmxjaUJtYjNJZ2RHaGxJR05oYkd3Z2MybDBaU0JtY21GdFpYTXVJRlJvWlNCblpYUjBaWElnY21WMGRYSnVaV1FnWW5sY2JpOHZJSFJvWlhObElHWmhZM1J2Y21sbGN5QmpZVzRnYjI1c2VTQjFjMlZrSUc5dVkyVXNJSE5wYm1ObElIUm9aWGtnWTJ4bFlXNGdkWEFnZEdobGFYSWdhVzV1WlhJZ2MzUmhkR1ZjYmk4dklHRm1kR1Z5SUhSb1pYa2dZWEpsSUdOaGJHeGxaQzRnVkdobGVTQmhZMk5sY0hRZ1lXNGdiM0IwYVc5dVlXd2dZbTl2YkdWaGJpQmhjbWQxYldWdWRDQjNhR2xqYUZ4dUx5OGdhV1lnZEhKMVpTQjNhV3hzSUdwMWMzUWdZMnhsWVc0Z2RYQWdkMmwwYUc5MWRDQmpiMjF3ZFhScGJtY2dkR2hsSUdaeVlXMWxjeTVjYmk4dlhHNHZMeUJVVDBSUE9pQkpaaUIzWlNCdlluTmxjblpsSUd4bFlXdHpJSGRwZEdnZ1kyOXRjR3hsZUNCMWMyVWdZMkZ6WlhNZ0tHUjFaU0IwYnlCamJHOXpkWEpsSUhOamIzQmxjeWxjYmk4dklDQWdJQ0FnSUhkbElHTmhiaUJuWlc1bGNtRjBaU0JvWlhKbElHOTFjaUJqYjIxd1lYUWdRMkZzYkZOcGRHVWdiMkpxWldOMGN5QnpkRzl5YVc1bklIUm9aU0JtZFc1amRHbHZiaWR6WEc0dkx5QWdJQ0FnSUNCemIzVnlZMlVnWTI5a1pTQnBibk4wWldGa0lHOW1JR0Z1SUdGamRIVmhiQ0J5WldabGNtVnVZMlVnZEc4Z2RHaGxiU3dnZEdoaGRDQnphRzkxYkdRZ2FHVnNjRnh1THk4Z0lDQWdJQ0FnZEdobElFZERJSE5wYm1ObElIZGxKMnhzSUdKbElHcDFjM1FnYTJWbGNHbHVaeUJzYVhSbGNtRnNjeUJoY205MWJtUXVYRzUyWVhJZ2JXRnJaVVp5WVcxbGMwZGxkSFJsY2lBOUlIUjVjR1Z2WmlCT1lYUnBkbVZGY25KdmNpNWpZWEIwZFhKbFUzUmhZMnRVY21GalpTQTlQVDBnSjJaMWJtTjBhVzl1SjF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQeUJ0WVd0bFJuSmhiV1Z6UjJWMGRHVnlWamhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEb2diV0ZyWlVaeVlXMWxjMGRsZEhSbGNrTnZiWEJoZER0Y2JseHVYRzR2THlCUGRtVnljbWxrWlNCV09DQnpkR0ZqYXlCMGNtRmpaU0JpZFdsc1pHVnlJSFJ2SUdsdWFtVmpkQ0J2ZFhJZ2JHOW5hV05jYm5aaGNpQnZiR1JRY21Wd1lYSmxVM1JoWTJ0VWNtRmpaU0E5SUVWeWNtOXlMbkJ5WlhCaGNtVlRkR0ZqYTFSeVlXTmxPMXh1UlhKeWIzSXVjSEpsY0dGeVpWTjBZV05yVkhKaFkyVWdQU0JtZFc1amRHbHZiaUFvWlhKeWIzSXNJR1p5WVcxbGN5a2dlMXh1SUNBdkx5QlhhR1Z1SUdOaGJHeGxaQ0JtY205dElHMWhhMlZHY21GdFpYTkhaWFIwWlhKV09DQjNaU0JxZFhOMElIZGhiblFnZEc4Z2IySjBZV2x1SUhSb1pTQm1jbUZ0WlhOY2JpQWdhV1lnS0dWeWNtOXlJRDA5UFNCV09FWlNRVTFGVXlrZ2UxeHVJQ0FnSUhKbGRIVnliaUJtY21GdFpYTTdYRzRnSUgxY2JseHVJQ0F2THlCR2IzSjNZWEprSUhSdklHRnVlU0J3Y21WMmFXOTFjMng1SUdSbFptbHVaV1FnWW1Wb1lYWnBiM1Z5WEc0Z0lHbG1JQ2h2YkdSUWNtVndZWEpsVTNSaFkydFVjbUZqWlNrZ2UxeHVJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2IyeGtVSEpsY0dGeVpWTjBZV05yVkhKaFkyVXVZMkZzYkNoRmNuSnZjaXdnWlhKeWIzSXNJR1p5WVcxbGN5azdYRzRnSUNBZ2ZTQmpZWFJqYUNBb1pTa2dlMXh1SUNBZ0lDQWdMeThnU25WemRDQnBaMjV2Y21VZ2RHaGxJR1Z5Y205eUlDaHBaVG9nYTJGeWJXRXRjMjkxY21ObExXMWhjQzF6ZFhCd2IzSjBLVnh1SUNBZ0lIMWNiaUFnZlZ4dVhHNGdJQzh2SUVWdGRXeGhkR1VnWkdWbVlYVnNkQ0JpWldoaGRtbHZkWElnS0hkcGRHZ2diRzl1WnkxMGNtRmpaWE1wWEc0Z0lISmxkSFZ5YmlCR1lXbHNkWEpsTG5CeWIzUnZkSGx3WlM1d2NtVndZWEpsVTNSaFkydFVjbUZqWlM1allXeHNLR1Z5Y205eUxDQjFibmRwYm1Rb1puSmhiV1Z6S1NrN1hHNTlPMXh1WEc0dkx5QkJkSFJoWTJnZ1lTQnVaWGNnWlhoamJIVnphVzl1SUhCeVpXUnBZMkYwWlNCbWIzSWdabkpoYldWelhHNW1kVzVqZEdsdmJpQmxlR05zZFdSbElDaGpkRzl5TENCd2NtVmthV05oZEdVcElIdGNiaUFnZG1GeUlHWnVJRDBnY0hKbFpHbGpZWFJsTzF4dVhHNGdJR2xtSUNoMGVYQmxiMllnY0hKbFpHbGpZWFJsSUQwOVBTQW5jM1J5YVc1bkp5a2dlMXh1SUNBZ0lHWnVJRDBnWm5WdVkzUnBiMjRnS0daeVlXMWxLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdMVEVnSVQwOUlHWnlZVzFsTG1kbGRFWnBiR1ZPWVcxbEtDa3VhVzVrWlhoUFppaHdjbVZrYVdOaGRHVXBPMXh1SUNBZ0lIMDdYRzRnSUgwZ1pXeHpaU0JwWmlBb2RIbHdaVzltSUhCeVpXUnBZMkYwWlM1MFpYTjBJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ1ptNGdQU0JtZFc1amRHbHZiaUFvWm5KaGJXVXBJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQndjbVZrYVdOaGRHVXVkR1Z6ZENobWNtRnRaUzVuWlhSR2FXeGxUbUZ0WlNncEtUdGNiaUFnSUNCOU8xeHVJQ0I5WEc1Y2JpQWdZM1J2Y2k1bGVHTnNkV1JsY3k1d2RYTm9LR1p1S1R0Y2JuMWNibHh1THk4Z1JYaHdiM05sSUhSb1pTQm1hV3gwWlhJZ2FXNGdkR2hsSUhKdmIzUWdSbUZwYkhWeVpTQjBlWEJsWEc1R1lXbHNkWEpsTG1WNFkyeDFaR1Z6SUQwZ1cxMDdYRzVHWVdsc2RYSmxMbVY0WTJ4MVpHVWdQU0JsZUdOc2RXUmxMbUpwYm1Rb2JuVnNiQ3dnUm1GcGJIVnlaU2s3WEc1Y2JpOHZJRUYwZEdGamFDQmhJR1p5WVcxbGN5Qm5aWFIwWlhJZ2RHOGdkR2hsSUdaMWJtTjBhVzl1SUhOdklIZGxJR05oYmlCeVpTMWpiMjV6ZEhKMVkzUWdZWE41Ym1NZ2MzUmhZMnR6TGx4dUx5OWNiaTh2SUU1dmRHVWdkR2hoZENCMGFHbHpJR3AxYzNRZ1lYVm5iV1Z1ZEhNZ2RHaGxJR1oxYm1OMGFXOXVJSGRwZEdnZ2RHaGxJRzVsZHlCd2NtOXdaWEowZVN3Z2FYUWdaRzlsYzI0bmRGeHVMeThnWTNKbFlYUmxJR0VnZDNKaGNIQmxjaUJsZG1WeWVTQjBhVzFsSUdsMEozTWdZMkZzYkdWa0xDQnpieUIxYzJsdVp5QnBkQ0J0ZFd4MGFYQnNaU0IwYVcxbGN5QnZiaUIwYUdWY2JpOHZJSE5oYldVZ1puVnVZM1JwYjI0Z2QybHNiQ0JwYm1SbFpXUWdiM1psY25keWFYUmxJSFJvWlNCd2NtVjJhVzkxY3lCMGNtRmphMmx1WnlCcGJtWnZjbTFoZEdsdmJpNGdWR2hwYzF4dUx5OGdhWE1nYVc1MFpXNWtaV1FnYzJsdVkyVWdhWFFuY3lCbVlYTjBaWElnWVc1a0lHMXZjbVVnYVcxd2IzSjBZVzUwYkhrZ1pHOWxjMjRuZENCaWNtVmhheUJ6YjIxbElFRlFTWE5jYmk4dklIVnphVzVuSUdOaGJHeGlZV05ySUhKbFptVnlaVzVqWlhNZ2RHOGdkVzV5WldkcGMzUmxjaUIwYUdWdElHWnZjaUJwYm5OMFlXNWpaUzVjYmk4dklGZG9aVzRnZVc5MUlIZGhiblFnZEc4Z2RYTmxJSFJvWlNCellXMWxJR1oxYm1OMGFXOXVJSGRwZEdnZ1pHbG1abVZ5Wlc1MElIUnlZV05yYVc1bklHbHVabTl5YldGMGFXOXVYRzR2THlCcWRYTjBJSFZ6WlNCR1lXbHNkWEpsTG5keVlYQW9LUzVjYmk4dlhHNHZMeUJVYUdVZ2RISmhZMnRwYm1jZ1kyRnVJR0psSUdkc2IySmhiR3g1SUdScGMyRmliR1ZrSUdKNUlITmxkSFJwYm1jZ1JtRnBiSFZ5WlM1VVVrRkRTMGxPUnlCMGJ5Qm1ZV3h6WlZ4dVJtRnBiSFZ5WlM1MGNtRmpheUE5SUdaMWJtTjBhVzl1SUVaaGFXeDFjbVZmZEhKaFkyc2dLR1p1TENCelptWXBJSHRjYmlBZ2FXWWdLSFI1Y0dWdlppQm1iaUFoUFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lISmxkSFZ5YmlCbWJqdGNiaUFnZlZ4dVhHNGdJQzh2SUVOc1pXRnVJSFZ3SUhCeVpYWnBiM1Z6SUdaeVlXMWxjeUIwYnlCb1pXeHdJSFJvWlNCSFExeHVJQ0JwWmlBb2RIbHdaVzltSUdadVcxTlpUVUpQVEY5R1VrRk5SVk5kSUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdabTViVTFsTlFrOU1YMFpTUVUxRlUxMG9kSEoxWlNrN1hHNGdJSDFjYmx4dUlDQnBaaUFvUm1GcGJIVnlaUzVVVWtGRFMwbE9SeWtnZTF4dUlDQWdJR1p1VzFOWlRVSlBURjlHVWtGTlJWTmRJRDBnYm5Wc2JEdGNiaUFnSUNCbWJsdFRXVTFDVDB4ZlJsSkJUVVZUWFNBOUlHMWhhMlZHY21GdFpYTkhaWFIwWlhJb2MyWm1JSHg4SUVaaGFXeDFjbVZmZEhKaFkyc3BPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJR1p1TzF4dWZUdGNibHh1THk4Z1YzSmhjSE1nZEdobElHWjFibU4wYVc5dUlHSmxabTl5WlNCaGJtNXZkR0YwYVc1bklHbDBJSGRwZEdnZ2RISmhZMnRwYm1jZ2FXNW1iM0p0WVhScGIyNHNJSFJvYVhOY2JpOHZJR0ZzYkc5M2N5QjBieUIwY21GamF5QnRkV3gwYVhCc1pTQmpZV3hzY3lCbWIzSWdZU0J6YVc1bmJHVWdablZ1WTNScGIyNHVYRzVHWVdsc2RYSmxMbmR5WVhBZ1BTQm1kVzVqZEdsdmJpQkdZV2xzZFhKbFgzZHlZWEFnS0dadUtTQjdYRzRnSUhaaGNpQjNjbUZ3Y0dWeUlEMGdSbUZwYkhWeVpTNXBaMjV2Y21Vb1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCbWJpNWhjSEJzZVNoMGFHbHpMQ0JoY21kMWJXVnVkSE1wTzF4dUlDQjlLVHRjYmx4dUlDQnlaWFIxY200Z1JtRnBiSFZ5WlM1MGNtRmpheWgzY21Gd2NHVnlMQ0JHWVdsc2RYSmxYM2R5WVhBcE8xeHVmVHRjYmx4dUx5OGdUV0Z5YXlCaElHWjFibU4wYVc5dUlIUnZJR0psSUdsbmJtOXlaV1FnZDJobGJpQm5aVzVsY21GMGFXNW5JSE4wWVdOcklIUnlZV05sYzF4dVJtRnBiSFZ5WlM1cFoyNXZjbVVnUFNCbWRXNWpkR2x2YmlCR1lXbHNkWEpsWDJsbmJtOXlaU0FvWm00cElIdGNiaUFnWm01YlUxbE5RazlNWDBsSFRrOVNSVjBnUFNCMGNuVmxPMXh1SUNCeVpYUjFjbTRnWm00N1hHNTlPMXh1WEc0dkx5QklaV3h3WlhJZ1ptOXlJSFJ5WVdOcmFXNW5JR0VnYzJWMFZHbHRaVzkxZEZ4dVJtRnBiSFZ5WlM1elpYUlVhVzFsYjNWMElEMGdablZ1WTNScGIyNGdSbUZwYkhWeVpWOXpaWFJVYVcxbGIzVjBJQ2dwSUh0Y2JpQWdZWEpuZFcxbGJuUnpXekJkSUQwZ1JtRnBiSFZ5WlM1MGNtRmpheWhoY21kMWJXVnVkSE5iTUYwc0lFWmhhV3gxY21WZmMyVjBWR2x0Wlc5MWRDazdYRzRnSUhKbGRIVnliaUJ6WlhSVWFXMWxiM1YwTG1Gd2NHeDVLRzUxYkd3c0lHRnlaM1Z0Wlc1MGN5azdYRzU5TzF4dVhHNHZMeUJJWld4d1pYSWdabTl5SUhSeVlXTnJhVzVuSUdFZ2JtVjRkRlJwWTJ0Y2JrWmhhV3gxY21VdWJtVjRkRlJwWTJzZ1BTQm1kVzVqZEdsdmJpQkdZV2xzZFhKbFgyNWxlSFJVYVdOcklDZ3BJSHRjYmlBZ1lYSm5kVzFsYm5Seld6QmRJRDBnUm1GcGJIVnlaUzUwY21GamF5aGhjbWQxYldWdWRITmJNRjBzSUVaaGFXeDFjbVZmYm1WNGRGUnBZMnNwTzF4dUlDQnlaWFIxY200Z2NISnZZMlZ6Y3k1dVpYaDBWR2xqYXk1aGNIQnNlU2h3Y205alpYTnpMQ0JoY21kMWJXVnVkSE1wTzF4dWZUdGNibHh1THk4Z1FXeHNiM2R6SUhSdklHVmhjMmxzZVNCd1lYUmphQ0JoSUdaMWJtTjBhVzl1SUhSb1lYUWdjbVZqWldsMlpYTWdZU0JqWVd4c1ltRmphMXh1THk4Z2RHOGdZV3hzYjNjZ2RISmhZMnRwYm1jZ2RHaGxJR0Z6ZVc1aklHWnNiM2R6TGx4dUx5OGdhV1U2SUVaaGFXeDFjbVV1Y0dGMGFDaDNhVzVrYjNjc0lDZHpaWFJKYm5SbGNuWmhiQ2NwWEc1R1lXbHNkWEpsTG5CaGRHTm9JRDBnWm5WdVkzUnBiMjRnUm1GcGJIVnlaVjl3WVhSamFDaHZZbW9zSUc1aGJXVXNJR2xrZUNrZ2UxeHVJQ0JwWmlBb2IySnFJQ1ltSUhSNWNHVnZaaUJ2WW1wYmJtRnRaVjBnSVQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ0lDQjBhSEp2ZHlCdVpYY2dSWEp5YjNJb0owOWlhbVZqZENCa2IyVnpJRzV2ZENCb1lYWmxJR0VnWENJbklDc2dibUZ0WlNBcklDZGNJaUJ0WlhSb2IyUW5LVHRjYmlBZ2ZWeHVYRzRnSUhaaGNpQnZjbWxuYVc1aGJDQTlJRzlpYWx0dVlXMWxYVHRjYmx4dUlDQXZMeUJYYUdWdUlIUm9aU0JsZUdGamRDQmhjbWQxYldWdWRDQnBibVJsZUNCcGN5QndjbTkyYVdSbFpDQjFjMlVnWVc0Z2IzQjBhVzFwZW1Wa0lHTnZaR1VnY0dGMGFGeHVJQ0JwWmlBb2RIbHdaVzltSUdsa2VDQTlQVDBnSjI1MWJXSmxjaWNwSUh0Y2JseHVJQ0FnSUc5aWFsdHVZVzFsWFNBOUlHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQWdJR0Z5WjNWdFpXNTBjMXRwWkhoZElEMGdSbUZwYkhWeVpTNTBjbUZqYXloaGNtZDFiV1Z1ZEhOYmFXUjRYU3dnYjJKcVcyNWhiV1ZkS1R0Y2JpQWdJQ0FnSUhKbGRIVnliaUJ2Y21sbmFXNWhiQzVoY0hCc2VTaDBhR2x6TENCaGNtZDFiV1Z1ZEhNcE8xeHVJQ0FnSUgwN1hHNWNiaUFnTHk4Z1QzUm9aWEozYVhObElHUmxkR1ZqZENCMGFHVWdablZ1WTNScGIyNXpJSFJ2SUhSeVlXTnJJR0YwSUdsdWRtOXJZWFJwYjI0Z2RHbHRaVnh1SUNCOUlHVnNjMlVnZTF4dVhHNGdJQ0FnYjJKcVcyNWhiV1ZkSUQwZ1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lDQWdabTl5SUNoMllYSWdhU0E5SURBN0lHa2dQQ0JoY21kMWJXVnVkSE11YkdWdVozUm9PeUJwS3lzcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0hSNWNHVnZaaUJoY21kMWJXVnVkSE5iYVYwZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQmhjbWQxYldWdWRITmJhVjBnUFNCR1lXbHNkWEpsTG5SeVlXTnJLR0Z5WjNWdFpXNTBjMXRwWFN3Z2IySnFXMjVoYldWZEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdmVnh1SUNBZ0lDQWdjbVYwZFhKdUlHOXlhV2RwYm1Gc0xtRndjR3g1S0hSb2FYTXNJR0Z5WjNWdFpXNTBjeWs3WEc0Z0lDQWdmVHRjYmx4dUlDQjlYRzVjYmlBZ0x5OGdRWFZuYldWdWRDQjBhR1VnZDNKaGNIQmxjaUIzYVhSb0lHRnVlU0J3Y205d1pYSjBhV1Z6SUdaeWIyMGdkR2hsSUc5eWFXZHBibUZzWEc0Z0lHWnZjaUFvZG1GeUlHc2dhVzRnYjNKcFoybHVZV3dwSUdsbUlDaHZjbWxuYVc1aGJDNW9ZWE5QZDI1UWNtOXdaWEowZVNocktTa2dlMXh1SUNBZ0lHOWlhbHR1WVcxbFhWdHJYU0E5SUc5eWFXZHBibUZzVzJ0ZE8xeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlHOWlhbHR1WVcxbFhUdGNibjA3WEc1Y2JpOHZJRWhsYkhCbGNpQjBieUJqY21WaGRHVWdibVYzSUVaaGFXeDFjbVVnZEhsd1pYTmNia1poYVd4MWNtVXVZM0psWVhSbElEMGdablZ1WTNScGIyNGdLRzVoYldVc0lIQnliM0J6S1NCN1hHNGdJR2xtSUNoMGVYQmxiMllnYm1GdFpTQWhQVDBnSjNOMGNtbHVaeWNwSUh0Y2JpQWdJQ0IwYUhKdmR5QnVaWGNnUm1GcGJIVnlaU2duUlhod1pXTjBaV1FnWVNCdVlXMWxJR0Z6SUdacGNuTjBJR0Z5WjNWdFpXNTBKeWs3WEc0Z0lIMWNibHh1SUNCbWRXNWpkR2x2YmlCamRHOXlJQ2h0WlhOellXZGxMQ0J6Wm1ZcElIdGNiaUFnSUNCcFppQW9JU2gwYUdseklHbHVjM1JoYm1ObGIyWWdSbUZwYkhWeVpTa3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQnVaWGNnWTNSdmNpaHRaWE56WVdkbExDQnpabVlwTzF4dUlDQWdJSDFjYmlBZ0lDQkdZV2xzZFhKbExtRndjR3g1S0hSb2FYTXNJR0Z5WjNWdFpXNTBjeWs3WEc0Z0lIMWNibHh1SUNBdkx5QkJkV2R0Wlc1MElHTnZibk4wY25WamRHOXlYRzRnSUdOMGIzSXVaWGhqYkhWa1pYTWdQU0JiWFR0Y2JpQWdZM1J2Y2k1bGVHTnNkV1JsSUQwZ1puVnVZM1JwYjI0Z0tIQnlaV1JwWTJGMFpTa2dlMXh1SUNBZ0lHVjRZMngxWkdVb1kzUnZjaXdnY0hKbFpHbGpZWFJsS1R0Y2JpQWdmVHRjYmx4dUlDQmpkRzl5TG5CeWIzUnZkSGx3WlNBOUlFOWlhbVZqZEM1amNtVmhkR1VvUm1GcGJIVnlaUzV3Y205MGIzUjVjR1VwTzF4dUlDQmpkRzl5TG5CeWIzUnZkSGx3WlM1amIyNXpkSEoxWTNSdmNpQTlJR04wYjNJN1hHNGdJR04wYjNJdWNISnZkRzkwZVhCbExtNWhiV1VnUFNCdVlXMWxPMXh1SUNCcFppQW9kSGx3Wlc5bUlIQnliM0J6SUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdZM1J2Y2k1d2NtOTBiM1I1Y0dVdWNISmxjR0Z5WlZOMFlXTnJWSEpoWTJVZ1BTQndjbTl3Y3p0Y2JpQWdmU0JsYkhObElHbG1JQ2h3Y205d2N5a2dlMXh1SUNBZ0lFOWlhbVZqZEM1clpYbHpLSEJ5YjNCektTNW1iM0pGWVdOb0tHWjFibU4wYVc5dUlDaHdjbTl3S1NCN1hHNGdJQ0FnSUNCamRHOXlMbkJ5YjNSdmRIbHdaVnR3Y205d1hTQTlJSEJ5YjNBN1hHNGdJQ0FnZlNrN1hHNGdJSDFjYmlBZ2NtVjBkWEp1SUdOMGIzSTdYRzU5TzF4dVhHNTJZWElnWW5WcGJIUnBia1Z5Y205eVZIbHdaWE1nUFNCYlhHNGdJQ2RGY25KdmNpY3NJQ2RVZVhCbFJYSnliM0luTENBblVtRnVaMlZGY25KdmNpY3NJQ2RTWldabGNtVnVZMlZGY25KdmNpY3NJQ2RUZVc1MFlYaEZjbkp2Y2ljc1hHNGdJQ2RGZG1Gc1JYSnliM0luTENBblZWSkpSWEp5YjNJbkxDQW5TVzUwWlhKdVlXeEZjbkp2Y2lkY2JsMDdYRzUyWVhJZ1luVnBiSFJwYmtWeWNtOXljeUE5SUh0OU8xeHVYRzVHWVdsc2RYSmxMbWx1YzNSaGJHd2dQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJSFpoY2lCeWIyOTBJRDBnZEhsd1pXOW1JSGRwYm1SdmR5QTlQVDBnSjI5aWFtVmpkQ2NnUHlCM2FXNWtiM2NnT2lCbmJHOWlZV3c3WEc1Y2JpQWdZblZwYkhScGJrVnljbTl5Vkhsd1pYTXVabTl5UldGamFDaG1kVzVqZEdsdmJpQW9kSGx3WlNrZ2UxeHVJQ0FnSUdsbUlDaHliMjkwVzNSNWNHVmRJQ1ltSUNGaWRXbHNkR2x1UlhKeWIzSnpXM1I1Y0dWZEtTQjdYRzRnSUNBZ0lDQmlkV2xzZEdsdVJYSnliM0p6VzNSNWNHVmRJRDBnY205dmRGdDBlWEJsWFR0Y2JpQWdJQ0FnSUhKdmIzUmJkSGx3WlYwZ1BTQkdZV2xzZFhKbExtTnlaV0YwWlNoMGVYQmxLVHRjYmlBZ0lDQjlYRzRnSUgwcE8xeHVYRzRnSUM4dklFRnNiRzkzSUhWellXZGxPaUIyWVhJZ1JtRnBiSFZ5WlNBOUlISmxjWFZwY21Vb0oyWmhhV3gxY21VbktTNXBibk4wWVd4c0tDbGNiaUFnY21WMGRYSnVJRVpoYVd4MWNtVTdYRzU5TzF4dVhHNUdZV2xzZFhKbExuVnVhVzV6ZEdGc2JDQTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdZblZwYkhScGJrVnljbTl5Vkhsd1pYTXVabTl5UldGamFDaG1kVzVqZEdsdmJpQW9kSGx3WlNrZ2UxeHVJQ0FnSUhKdmIzUmJkSGx3WlYwZ1BTQmlkV2xzZEdsdVJYSnliM0p6VzNSNWNHVmRJSHg4SUhKdmIzUmJkSGx3WlYwN1hHNGdJSDBwTzF4dWZUdGNibHh1WEc1MllYSWdjSEp2ZEc4Z1BTQkdZV2xzZFhKbExuQnliM1J2ZEhsd1pTQTlJRTlpYW1WamRDNWpjbVZoZEdVb1JYSnliM0l1Y0hKdmRHOTBlWEJsS1R0Y2JuQnliM1J2TG1OdmJuTjBjblZqZEc5eUlEMGdSbUZwYkhWeVpUdGNibHh1Y0hKdmRHOHVibUZ0WlNBOUlDZEdZV2xzZFhKbEp6dGNibkJ5YjNSdkxtMWxjM05oWjJVZ1BTQW5KenRjYmx4dWFXWWdLSFI1Y0dWdlppQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtnUFQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLSEJ5YjNSdkxDQW5abkpoYldWekp5d2dlMXh1SUNBZ0lHZGxkRG9nWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUNBZ0x5OGdWWE5sSUhSeWFXMXRhVzVuSUdwMWMzUWdhVzRnWTJGelpTQjBhR1VnYzJabUlIZGhjeUJrWldacGJtVmtJR0ZtZEdWeUlHTnZibk4wY25WamRHbHVaMXh1SUNBZ0lDQWdkbUZ5SUdaeVlXMWxjeUE5SUhWdWQybHVaQ2gwY21sdEtIUm9hWE11WDJkbGRFWnlZVzFsY3lncExDQjBhR2x6TG5ObVppa3BPMXh1WEc0Z0lDQWdJQ0F2THlCRFlXTm9aU0J1WlhoMElHRmpZMlZ6YzJWeklIUnZJSFJvWlNCd2NtOXdaWEowZVZ4dUlDQWdJQ0FnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUtIUm9hWE1zSUNkbWNtRnRaWE1uTENCN1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lCbWNtRnRaWE1zWEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lCMGNuVmxYRzRnSUNBZ0lDQjlLVHRjYmx4dUlDQWdJQ0FnTHk4Z1EyeGxZVzRnZFhBZ2RHaGxJR2RsZEhSbGNpQmpiRzl6ZFhKbFhHNGdJQ0FnSUNCMGFHbHpMbDluWlhSR2NtRnRaWE1nUFNCdWRXeHNPMXh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdabkpoYldWek8xeHVJQ0FnSUgxY2JpQWdmU2s3WEc1Y2JpQWdUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1S0hCeWIzUnZMQ0FuYzNSaFkyc25MQ0I3WEc0Z0lDQWdaMlYwT2lCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQjJZWElnYzNSaFkyc2dQU0IwYUdsekxtZGxibVZ5WVhSbFUzUmhZMnRVY21GalpTZ3BPMXh1WEc0Z0lDQWdJQ0F2THlCRFlXTm9aU0J1WlhoMElHRmpZMlZ6YzJWeklIUnZJSFJvWlNCd2NtOXdaWEowZVZ4dUlDQWdJQ0FnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUtIUm9hWE1zSUNkemRHRmpheWNzSUh0Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUhOMFlXTnJMRnh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nZEhKMVpWeHVJQ0FnSUNBZ2ZTazdYRzVjYmlBZ0lDQWdJSEpsZEhWeWJpQnpkR0ZqYXp0Y2JpQWdJQ0I5WEc0Z0lIMHBPMXh1ZlZ4dVhHNXdjbTkwYnk1blpXNWxjbUYwWlZOMFlXTnJWSEpoWTJVZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lIWmhjaUJsZUdOc2RXUmxjeUE5SUhSb2FYTXVZMjl1YzNSeWRXTjBiM0l1WlhoamJIVmtaWE03WEc0Z0lIWmhjaUJwYm1Oc2RXUmxMQ0JtY21GdFpYTWdQU0JiWFR0Y2JseHVJQ0F2THlCVGNHVmphV1pwWXlCd2NtOTBiM1I1Y0dWeklHbHVhR1Z5YVhRZ2RHaGxJR1Y0WTJ4MVpHVnpJR1p5YjIwZ1JtRnBiSFZ5WlZ4dUlDQnBaaUFvWlhoamJIVmtaWE1nSVQwOUlFWmhhV3gxY21VdVpYaGpiSFZrWlhNcElIdGNiaUFnSUNCbGVHTnNkV1JsY3k1d2RYTm9MbUZ3Y0d4NUtHVjRZMngxWkdWekxDQkdZV2xzZFhKbExtVjRZMngxWkdWektUdGNiaUFnZlZ4dVhHNGdJQzh2SUVGd2NHeDVJR1pwYkhSbGNtbHVaMXh1SUNCbWIzSWdLSFpoY2lCcFBUQTdJR2tnUENCMGFHbHpMbVp5WVcxbGN5NXNaVzVuZEdnN0lHa3JLeWtnZTF4dUlDQWdJR2x1WTJ4MVpHVWdQU0IwY25WbE8xeHVJQ0FnSUdsbUlDaDBhR2x6TG1aeVlXMWxjMXRwWFNrZ2UxeHVJQ0FnSUNBZ1ptOXlJQ2gyWVhJZ2FqMHdPeUJwYm1Oc2RXUmxJQ1ltSUdvZ1BDQmxlR05zZFdSbGN5NXNaVzVuZEdnN0lHb3JLeWtnZTF4dUlDQWdJQ0FnSUNCcGJtTnNkV1JsSUNZOUlDRmxlR05zZFdSbGMxdHFYUzVqWVd4c0tIUm9hWE1zSUhSb2FYTXVabkpoYldWelcybGRLVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlYRzRnSUNBZ2FXWWdLR2x1WTJ4MVpHVXBJSHRjYmlBZ0lDQWdJR1p5WVcxbGN5NXdkWE5vS0hSb2FYTXVabkpoYldWelcybGRLVHRjYmlBZ0lDQjlYRzRnSUgxY2JseHVJQ0F2THlCSWIyNXZjaUJoYm5rZ2NISmxkbWx2ZFhOc2VTQmtaV1pwYm1Wa0lITjBZV05yZEhKaFkyVWdabTl5YldGMGRHVnlJR0o1SUdGc2JHOTNhVzVuWEc0Z0lDOHZJR2wwSUhSdklHWnZjbTFoZENCMGFHVWdabkpoYldWekxpQlVhR2x6SUdseklHNWxaV1JsWkNCM2FHVnVJSFZ6YVc1blhHNGdJQzh2SUc1dlpHVXRjMjkxY21ObExXMWhjQzF6ZFhCd2IzSjBJR1p2Y2lCcGJuTjBZVzVqWlM1Y2JpQWdMeThnVkU5RVR6b2dRMkZ1SUhkbElHMWhjQ0IwYUdVZ1hDSnVkV3hzWENJZ1puSmhiV1Z6SUhSdklHRWdRMkZzYkVaeVlXMWxJSE5vYVcwL1hHNGdJR2xtSUNodmJHUlFjbVZ3WVhKbFUzUmhZMnRVY21GalpTa2dlMXh1SUNBZ0lHWnlZVzFsY3lBOUlHWnlZVzFsY3k1bWFXeDBaWElvWm5WdVkzUnBiMjRnS0hncElIc2djbVYwZFhKdUlDRWhlRHNnZlNrN1hHNGdJQ0FnY21WMGRYSnVJRzlzWkZCeVpYQmhjbVZUZEdGamExUnlZV05sTG1OaGJHd29SWEp5YjNJc0lIUm9hWE1zSUdaeVlXMWxjeWs3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnZEdocGN5NXdjbVZ3WVhKbFUzUmhZMnRVY21GalpTaG1jbUZ0WlhNcE8xeHVmVHRjYmx4dWNISnZkRzh1Y0hKbGNHRnlaVk4wWVdOclZISmhZMlVnUFNCbWRXNWpkR2x2YmlBb1puSmhiV1Z6S1NCN1hHNGdJSFpoY2lCc2FXNWxjeUE5SUZ0MGFHbHpYVHRjYmlBZ1ptOXlJQ2gyWVhJZ2FUMHdPeUJwSUR3Z1puSmhiV1Z6TG14bGJtZDBhRHNnYVNzcktTQjdYRzRnSUNBZ2JHbHVaWE11Y0hWemFDaGNiaUFnSUNBZ0lHWnlZVzFsYzF0cFhTQS9JRVpoYVd4MWNtVXVSbEpCVFVWZlVGSkZSa2xZSUNzZ1puSmhiV1Z6VzJsZElEb2dSbUZwYkhWeVpTNUdVa0ZOUlY5RlRWQlVXVnh1SUNBZ0lDazdYRzRnSUgxY2JpQWdjbVYwZFhKdUlHeHBibVZ6TG1wdmFXNG9KMXhjYmljcE8xeHVmVHRjYmx4dVhHNXRiMlIxYkdVdVpYaHdiM0owY3lBOUlFWmhhV3gxY21VN1hHNGlYWDA9IiwidmFyIEZhaWx1cmUgPSByZXF1aXJlKCcuL2xpYi9mYWlsdXJlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmFpbHVyZTtcbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvLyBVbml2ZXJzYWwgTW9kdWxlIERlZmluaXRpb24gKFVNRCkgdG8gc3VwcG9ydCBBTUQsIENvbW1vbkpTL05vZGUuanMsIFJoaW5vLCBhbmQgYnJvd3NlcnMuXG5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKCdlcnJvci1zdGFjay1wYXJzZXInLCBbJ3N0YWNrZnJhbWUnXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3N0YWNrZnJhbWUnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5FcnJvclN0YWNrUGFyc2VyID0gZmFjdG9yeShyb290LlN0YWNrRnJhbWUpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlcihTdGFja0ZyYW1lKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEZJUkVGT1hfU0FGQVJJX1NUQUNLX1JFR0VYUCA9IC8oXnxAKVxcUytcXDpcXGQrLztcbiAgICB2YXIgQ0hST01FX0lFX1NUQUNLX1JFR0VYUCA9IC9cXHMrYXQgLiooXFxTK1xcOlxcZCt8XFwobmF0aXZlXFwpKS87XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogR2l2ZW4gYW4gRXJyb3Igb2JqZWN0LCBleHRyYWN0IHRoZSBtb3N0IGluZm9ybWF0aW9uIGZyb20gaXQuXG4gICAgICAgICAqIEBwYXJhbSBlcnJvciB7RXJyb3J9XG4gICAgICAgICAqIEByZXR1cm4gQXJyYXlbU3RhY2tGcmFtZV1cbiAgICAgICAgICovXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZShlcnJvcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlcnJvci5zdGFja3RyYWNlICE9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgZXJyb3JbJ29wZXJhI3NvdXJjZWxvYyddICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmEoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5zdGFjayAmJiBlcnJvci5zdGFjay5tYXRjaChDSFJPTUVfSUVfU1RBQ0tfUkVHRVhQKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlVjhPcklFKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3Iuc3RhY2sgJiYgZXJyb3Iuc3RhY2subWF0Y2goRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRkZPclNhZmFyaShlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHBhcnNlIGdpdmVuIEVycm9yIG9iamVjdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXBhcmF0ZSBsaW5lIGFuZCBjb2x1bW4gbnVtYmVycyBmcm9tIGEgVVJMLWxpa2Ugc3RyaW5nLlxuICAgICAgICAgKiBAcGFyYW0gdXJsTGlrZSBTdHJpbmdcbiAgICAgICAgICogQHJldHVybiBBcnJheVtTdHJpbmddXG4gICAgICAgICAqL1xuICAgICAgICBleHRyYWN0TG9jYXRpb246IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJGV4dHJhY3RMb2NhdGlvbih1cmxMaWtlKSB7XG4gICAgICAgICAgICAvLyBGYWlsLWZhc3QgYnV0IHJldHVybiBsb2NhdGlvbnMgbGlrZSBcIihuYXRpdmUpXCJcbiAgICAgICAgICAgIGlmICh1cmxMaWtlLmluZGV4T2YoJzonKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3VybExpa2VdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHVybExpa2UucmVwbGFjZSgvW1xcKFxcKVxcc10vZywgJycpLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB2YXIgbGFzdE51bWJlciA9IGxvY2F0aW9uUGFydHMucG9wKCk7XG4gICAgICAgICAgICB2YXIgcG9zc2libGVOdW1iZXIgPSBsb2NhdGlvblBhcnRzW2xvY2F0aW9uUGFydHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAoIWlzTmFOKHBhcnNlRmxvYXQocG9zc2libGVOdW1iZXIpKSAmJiBpc0Zpbml0ZShwb3NzaWJsZU51bWJlcikpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGluZU51bWJlciA9IGxvY2F0aW9uUGFydHMucG9wKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsb2NhdGlvblBhcnRzLmpvaW4oJzonKSwgbGluZU51bWJlciwgbGFzdE51bWJlcl07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbG9jYXRpb25QYXJ0cy5qb2luKCc6JyksIGxhc3ROdW1iZXIsIHVuZGVmaW5lZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VWOE9ySUU6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlVjhPcklFKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLmZpbHRlcihmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIWxpbmUubWF0Y2goQ0hST01FX0lFX1NUQUNLX1JFR0VYUCk7XG4gICAgICAgICAgICB9LCB0aGlzKS5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5zID0gbGluZS5yZXBsYWNlKC9eXFxzKy8sICcnKS5zcGxpdCgvXFxzKy8pLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdGhpcy5leHRyYWN0TG9jYXRpb24odG9rZW5zLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gKCF0b2tlbnNbMF0gfHwgdG9rZW5zWzBdID09PSAnQW5vbnltb3VzJykgPyB1bmRlZmluZWQgOiB0b2tlbnNbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgdW5kZWZpbmVkLCBsb2NhdGlvblBhcnRzWzBdLCBsb2NhdGlvblBhcnRzWzFdLCBsb2NhdGlvblBhcnRzWzJdLCBsaW5lKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlRkZPclNhZmFyaTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VGRk9yU2FmYXJpKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLmZpbHRlcihmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIWxpbmUubWF0Y2goRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQKTtcbiAgICAgICAgICAgIH0sIHRoaXMpLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBsaW5lLnNwbGl0KCdAJyk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSB0b2tlbnMuc2hpZnQoKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgdW5kZWZpbmVkLCBsb2NhdGlvblBhcnRzWzBdLCBsb2NhdGlvblBhcnRzWzFdLCBsb2NhdGlvblBhcnRzWzJdLCBsaW5lKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlT3BlcmE6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmEoZSkge1xuICAgICAgICAgICAgaWYgKCFlLnN0YWNrdHJhY2UgfHwgKGUubWVzc2FnZS5pbmRleE9mKCdcXG4nKSA+IC0xICYmXG4gICAgICAgICAgICAgICAgZS5tZXNzYWdlLnNwbGl0KCdcXG4nKS5sZW5ndGggPiBlLnN0YWNrdHJhY2Uuc3BsaXQoJ1xcbicpLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9wZXJhOShlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWUuc3RhY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9wZXJhMTAoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmExMShlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZU9wZXJhOTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYTkoZSkge1xuICAgICAgICAgICAgdmFyIGxpbmVSRSA9IC9MaW5lIChcXGQrKS4qc2NyaXB0ICg/OmluICk/KFxcUyspL2k7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBlLm1lc3NhZ2Uuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMiwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBsaW5lUkUuZXhlYyhsaW5lc1tpXSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBTdGFja0ZyYW1lKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBtYXRjaFsyXSwgbWF0Y2hbMV0sIHVuZGVmaW5lZCwgbGluZXNbaV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VPcGVyYTEwOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhMTAoZSkge1xuICAgICAgICAgICAgdmFyIGxpbmVSRSA9IC9MaW5lIChcXGQrKS4qc2NyaXB0ICg/OmluICk/KFxcUyspKD86OiBJbiBmdW5jdGlvbiAoXFxTKykpPyQvaTtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IGUuc3RhY2t0cmFjZS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBsaW5lcy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMikge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IGxpbmVSRS5leGVjKGxpbmVzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFN0YWNrRnJhbWUobWF0Y2hbM10gfHwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIG1hdGNoWzJdLCBtYXRjaFsxXSwgdW5kZWZpbmVkLCBsaW5lc1tpXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBPcGVyYSAxMC42NSsgRXJyb3Iuc3RhY2sgdmVyeSBzaW1pbGFyIHRvIEZGL1NhZmFyaVxuICAgICAgICBwYXJzZU9wZXJhMTE6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmExMShlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLnN0YWNrLnNwbGl0KCdcXG4nKS5maWx0ZXIoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFsaW5lLm1hdGNoKEZJUkVGT1hfU0FGQVJJX1NUQUNLX1JFR0VYUCkgJiZcbiAgICAgICAgICAgICAgICAgICAgIWxpbmUubWF0Y2goL15FcnJvciBjcmVhdGVkIGF0Lyk7XG4gICAgICAgICAgICB9LCB0aGlzKS5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5zID0gbGluZS5zcGxpdCgnQCcpO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdGhpcy5leHRyYWN0TG9jYXRpb24odG9rZW5zLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25DYWxsID0gKHRva2Vucy5zaGlmdCgpIHx8ICcnKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gZnVuY3Rpb25DYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvPGFub255bW91cyBmdW5jdGlvbig6IChcXHcrKSk/Pi8sICckMicpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwoW15cXCldKlxcKS9nLCAnJykgfHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhciBhcmdzUmF3O1xuICAgICAgICAgICAgICAgIGlmIChmdW5jdGlvbkNhbGwubWF0Y2goL1xcKChbXlxcKV0qKVxcKS8pKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NSYXcgPSBmdW5jdGlvbkNhbGwucmVwbGFjZSgvXlteXFwoXStcXCgoW15cXCldKilcXCkkLywgJyQxJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gKGFyZ3NSYXcgPT09IHVuZGVmaW5lZCB8fCBhcmdzUmF3ID09PSAnW2FyZ3VtZW50cyBub3QgYXZhaWxhYmxlXScpID8gdW5kZWZpbmVkIDogYXJnc1Jhdy5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsIGFyZ3MsIGxvY2F0aW9uUGFydHNbMF0sIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0sIGxpbmUpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xufSkpO1xuXG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgLy8gVW5pdmVyc2FsIE1vZHVsZSBEZWZpbml0aW9uIChVTUQpIHRvIHN1cHBvcnQgQU1ELCBDb21tb25KUy9Ob2RlLmpzLCBSaGlubywgYW5kIGJyb3dzZXJzLlxuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZSgnc3RhY2tmcmFtZScsIFtdLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LlN0YWNrRnJhbWUgPSBmYWN0b3J5KCk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGZ1bmN0aW9uIF9pc051bWJlcihuKSB7XG4gICAgICAgIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsIGFyZ3MsIGZpbGVOYW1lLCBsaW5lTnVtYmVyLCBjb2x1bW5OdW1iZXIsIHNvdXJjZSkge1xuICAgICAgICBpZiAoZnVuY3Rpb25OYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RnVuY3Rpb25OYW1lKGZ1bmN0aW9uTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRBcmdzKGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWxlTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEZpbGVOYW1lKGZpbGVOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGluZU51bWJlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldExpbmVOdW1iZXIobGluZU51bWJlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbHVtbk51bWJlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldENvbHVtbk51bWJlcihjb2x1bW5OdW1iZXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzb3VyY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTb3VyY2Uoc291cmNlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFN0YWNrRnJhbWUucHJvdG90eXBlID0ge1xuICAgICAgICBnZXRGdW5jdGlvbk5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZ1bmN0aW9uTmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0RnVuY3Rpb25OYW1lOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdGhpcy5mdW5jdGlvbk5hbWUgPSBTdHJpbmcodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0QXJnczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXJncztcbiAgICAgICAgfSxcbiAgICAgICAgc2V0QXJnczogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodikgIT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmdzIG11c3QgYmUgYW4gQXJyYXknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYXJncyA9IHY7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gTk9URTogUHJvcGVydHkgbmFtZSBtYXkgYmUgbWlzbGVhZGluZyBhcyBpdCBpbmNsdWRlcyB0aGUgcGF0aCxcbiAgICAgICAgLy8gYnV0IGl0IHNvbWV3aGF0IG1pcnJvcnMgVjgncyBKYXZhU2NyaXB0U3RhY2tUcmFjZUFwaVxuICAgICAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L3dpa2kvSmF2YVNjcmlwdFN0YWNrVHJhY2VBcGkgYW5kIEdlY2tvJ3NcbiAgICAgICAgLy8gaHR0cDovL214ci5tb3ppbGxhLm9yZy9tb3ppbGxhLWNlbnRyYWwvc291cmNlL3hwY29tL2Jhc2UvbnNJRXhjZXB0aW9uLmlkbCMxNFxuICAgICAgICBnZXRGaWxlTmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsZU5hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldEZpbGVOYW1lOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdGhpcy5maWxlTmFtZSA9IFN0cmluZyh2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saW5lTnVtYmVyO1xuICAgICAgICB9LFxuICAgICAgICBzZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKCFfaXNOdW1iZXIodikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdMaW5lIE51bWJlciBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxpbmVOdW1iZXIgPSBOdW1iZXIodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5OdW1iZXI7XG4gICAgICAgIH0sXG4gICAgICAgIHNldENvbHVtbk51bWJlcjogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmICghX2lzTnVtYmVyKHYpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29sdW1uIE51bWJlciBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbHVtbk51bWJlciA9IE51bWJlcih2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRTb3VyY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNvdXJjZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0U291cmNlOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2UgPSBTdHJpbmcodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IHRoaXMuZ2V0RnVuY3Rpb25OYW1lKCkgfHwgJ3thbm9ueW1vdXN9JztcbiAgICAgICAgICAgIHZhciBhcmdzID0gJygnICsgKHRoaXMuZ2V0QXJncygpIHx8IFtdKS5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICB2YXIgZmlsZU5hbWUgPSB0aGlzLmdldEZpbGVOYW1lKCkgPyAoJ0AnICsgdGhpcy5nZXRGaWxlTmFtZSgpKSA6ICcnO1xuICAgICAgICAgICAgdmFyIGxpbmVOdW1iZXIgPSBfaXNOdW1iZXIodGhpcy5nZXRMaW5lTnVtYmVyKCkpID8gKCc6JyArIHRoaXMuZ2V0TGluZU51bWJlcigpKSA6ICcnO1xuICAgICAgICAgICAgdmFyIGNvbHVtbk51bWJlciA9IF9pc051bWJlcih0aGlzLmdldENvbHVtbk51bWJlcigpKSA/ICgnOicgKyB0aGlzLmdldENvbHVtbk51bWJlcigpKSA6ICcnO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uTmFtZSArIGFyZ3MgKyBmaWxlTmFtZSArIGxpbmVOdW1iZXIgKyBjb2x1bW5OdW1iZXI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIFN0YWNrRnJhbWU7XG59KSk7XG4iXX0=
