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

// Expose Failure in our custom Error to help with browserified bulds
AssError.Failure = Failure;

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

// Unfortunately we have some issues with IE and defineProperty
var IS_IE = 'ActiveXObject' in global;
var IS_EDGE = global.navigator && /Edge/.test(global.navigator.userAgent);
var USE_DEF_PROP = !IS_IE && !IS_EDGE && /\[native code\]/.test(Object.defineProperty);


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
  if (!USE_DEF_PROP) {
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
    global.console && console.warn('[Failure] error capturing frames');
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
        global.console && console.warn('[Failure] Empty frames annotation');
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
      try {
        frames = ErrorStackParser.parse(error);

        // Attach function references to the frames (skipping the maker frames)
        // and creating CallSite objects for each one.
        for (var i=2; i < frames.length; i++) {
          frames[i].function = functions[i];
          frames[i] = new CallSite(frames[i]);
        }

        frames = trim(frames.slice(2), sff);
      } catch (e) {
        // Just ignore and let the higher layers deal with it
      }
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

// By default only Error will be replaced
Failure.install = function (/* ... */) {
  var root = typeof window === 'object' ? window : global;

  var args = Array.prototype.slice.call(arguments);
  if (args.length === 0) {
    args.push('Error');
  }

  for (var i=0; i<args.length; i++) {
    root[args[i]] = Failure.create(args[i]);
  }

  // Allow usage: var Failure = require('failure').install()
  return Failure;
};


var proto = Failure.prototype = Object.create(Error.prototype);
proto.constructor = Failure;

proto.name = 'Failure';
proto.message = '';

if (USE_DEF_PROP) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9mYWlsdXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBFcnJvclN0YWNrUGFyc2VyID0gcmVxdWlyZSgnZXJyb3Itc3RhY2stcGFyc2VyJyk7XG52YXIgQ2FsbFNpdGUgPSByZXF1aXJlKCcuL2NhbGwtc2l0ZScpO1xuXG4vLyBLZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBidWlsdGluIGVycm9yIGNvbnN0cnVjdG9yXG52YXIgTmF0aXZlRXJyb3IgPSBFcnJvcjtcblxuLy8gQW5ub3RhdGlvbiBzeW1ib2xzXG52YXIgU1lNQk9MX0ZSQU1FUyA9ICdAQGZhaWx1cmUvZnJhbWVzJztcbnZhciBTWU1CT0xfSUdOT1JFID0gJ0BAZmFpbHVyZS9pZ25vcmUnO1xuXG4vLyBVbmZvcnR1bmF0ZWx5IHdlIGhhdmUgc29tZSBpc3N1ZXMgd2l0aCBJRSBhbmQgZGVmaW5lUHJvcGVydHlcbnZhciBJU19JRSA9ICdBY3RpdmVYT2JqZWN0JyBpbiBnbG9iYWw7XG52YXIgSVNfRURHRSA9IGdsb2JhbC5uYXZpZ2F0b3IgJiYgL0VkZ2UvLnRlc3QoZ2xvYmFsLm5hdmlnYXRvci51c2VyQWdlbnQpO1xudmFyIFVTRV9ERUZfUFJPUCA9ICFJU19JRSAmJiAhSVNfRURHRSAmJiAvXFxbbmF0aXZlIGNvZGVcXF0vLnRlc3QoT2JqZWN0LmRlZmluZVByb3BlcnR5KTtcblxuXG5mdW5jdGlvbiBGYWlsdXJlIChtZXNzYWdlLCBzZmYpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZhaWx1cmUpKSB7XG4gICAgcmV0dXJuIG5ldyBGYWlsdXJlKG1lc3NhZ2UsIHNmZiB8fCBGYWlsdXJlKTtcbiAgfVxuXG4gIHRoaXMuc2ZmID0gc2ZmIHx8IHRoaXMuY29uc3RydWN0b3I7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblxuICAvLyBHZW5lcmF0ZSBhIGdldHRlciBmb3IgdGhlIGZyYW1lcywgdGhpcyBlbnN1cmVzIHRoYXQgd2UgZG8gYXMgbGl0dGxlIHdvcmtcbiAgLy8gYXMgcG9zc2libGUgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBlcnJvciwgZGVmZXJyaW5nIHRoZSBleHBlbnNpdmUgc3RhY2tcbiAgLy8gbWFuZ2xpbmcgb3BlcmF0aW9ucyB1bnRpbCB0aGUgLnN0YWNrIHByb3BlcnR5IGlzIGFjdHVhbGx5IHJlcXVlc3RlZC5cbiAgdGhpcy5fZ2V0RnJhbWVzID0gbWFrZUZyYW1lc0dldHRlcih0aGlzLnNmZik7XG5cbiAgLy8gT24gRVM1IGVuZ2luZXMgd2UgdXNlIG9uZS10aW1lIGdldHRlcnMgdG8gYWN0dWFsbHkgZGVmZXIgdGhlIGV4cGVuc2l2ZVxuICAvLyBvcGVyYXRpb25zIChkZWZpbmVkIGluIHRoZSBwcm90b3R5cGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIHdoaWxlIGxlZ2FjeVxuICAvLyBlbmdpbmVzIHdpbGwgc2ltcGx5IGRvIGFsbCB0aGUgd29yayB1cCBmcm9udC5cbiAgaWYgKCFVU0VfREVGX1BST1ApIHtcbiAgICB0aGlzLmZyYW1lcyA9IHVud2luZCh0aGlzLl9nZXRGcmFtZXMoKSk7XG4gICAgdGhpcy5fZ2V0RnJhbWVzID0gbnVsbDtcbiAgICB0aGlzLnN0YWNrID0gdGhpcy5nZW5lcmF0ZVN0YWNrVHJhY2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufVxuXG4vLyBTZXQgRlJBTUVfRU1QVFkgdG8gbnVsbCB0byBkaXNhYmxlIGFueSBzb3J0IG9mIHNlcGFyYXRvclxuRmFpbHVyZS5GUkFNRV9FTVBUWSA9ICcgIC0tLS0nO1xuRmFpbHVyZS5GUkFNRV9QUkVGSVggPSAnICBhdCAnO1xuXG4vLyBCeSBkZWZhdWx0IHdlIGVuYWJsZSB0cmFja2luZyBmb3IgYXN5bmMgc3RhY2sgdHJhY2VzXG5GYWlsdXJlLlRSQUNLSU5HID0gdHJ1ZTtcblxuXG4vLyBIZWxwZXIgdG8gb2J0YWluIHRoZSBjdXJyZW50IHN0YWNrIHRyYWNlXG52YXIgZ2V0RXJyb3JXaXRoU3RhY2sgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgTmF0aXZlRXJyb3IoKTtcbn07XG4vLyBTb21lIGVuZ2luZXMgZG8gbm90IGdlbmVyYXRlIHRoZSAuc3RhY2sgcHJvcGVydHkgdW50aWwgaXQncyB0aHJvd25cbmlmICghZ2V0RXJyb3JXaXRoU3RhY2soKS5zdGFjaykge1xuICBnZXRFcnJvcldpdGhTdGFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICB0cnkgeyB0aHJvdyBuZXcgTmF0aXZlRXJyb3IoKTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZTsgfVxuICB9O1xufVxuXG4vLyBUcmltIGZyYW1lcyB1bmRlciB0aGUgcHJvdmlkZWQgc3RhY2sgZmlyc3QgZnVuY3Rpb25cbmZ1bmN0aW9uIHRyaW0oZnJhbWVzLCBzZmYpIHtcbiAgdmFyIGZuLCBuYW1lID0gc2ZmLm5hbWU7XG4gIGlmICghZnJhbWVzKSB7XG4gICAgZ2xvYmFsLmNvbnNvbGUgJiYgY29uc29sZS53YXJuKCdbRmFpbHVyZV0gZXJyb3IgY2FwdHVyaW5nIGZyYW1lcycpO1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBmb3IgKHZhciBpPTA7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBmbiA9IGZyYW1lc1tpXS5nZXRGdW5jdGlvbigpO1xuICAgIGlmIChmbiAmJiBmbiA9PT0gc2ZmIHx8IG5hbWUgJiYgbmFtZSA9PT0gZnJhbWVzW2ldLmdldEZ1bmN0aW9uTmFtZSgpKSB7XG4gICAgICByZXR1cm4gZnJhbWVzLnNsaWNlKGkgKyAxKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZyYW1lcztcbn1cblxuZnVuY3Rpb24gdW53aW5kIChmcmFtZXMpIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gIGZvciAodmFyIGk9MCwgZm47IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBmbiA9IGZyYW1lc1tpXS5nZXRGdW5jdGlvbigpO1xuXG4gICAgaWYgKCFmbiB8fCAhZm5bU1lNQk9MX0lHTk9SRV0pIHtcbiAgICAgIHJlc3VsdC5wdXNoKGZyYW1lc1tpXSk7XG4gICAgfVxuXG4gICAgaWYgKGZuICYmIGZuW1NZTUJPTF9GUkFNRVNdKSB7XG4gICAgICBpZiAoRmFpbHVyZS5GUkFNRV9FTVBUWSkge1xuICAgICAgICByZXN1bHQucHVzaChudWxsKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2FsbCB0aGUgZ2V0dGVyIGFuZCBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSByZXN1bHQgaW4gY2FzZSB3ZSBoYXZlIHRvXG4gICAgICAvLyB1bndpbmQgdGhlIHNhbWUgZnVuY3Rpb24gYW5vdGhlciB0aW1lLlxuICAgICAgLy8gVE9ETzogTWFrZSBzdXJlIGtlZXBpbmcgYSByZWZlcmVuY2UgdG8gdGhlIGZyYW1lcyBkb2Vzbid0IGNyZWF0ZSBsZWFrc1xuICAgICAgaWYgKHR5cGVvZiBmbltTWU1CT0xfRlJBTUVTXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgZ2V0dGVyID0gZm5bU1lNQk9MX0ZSQU1FU107XG4gICAgICAgIGZuW1NZTUJPTF9GUkFNRVNdID0gbnVsbDtcbiAgICAgICAgZm5bU1lNQk9MX0ZSQU1FU10gPSBnZXR0ZXIoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFmbltTWU1CT0xfRlJBTUVTXSkge1xuICAgICAgICBnbG9iYWwuY29uc29sZSAmJiBjb25zb2xlLndhcm4oJ1tGYWlsdXJlXSBFbXB0eSBmcmFtZXMgYW5ub3RhdGlvbicpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCB1bndpbmQoZm5bU1lNQk9MX0ZSQU1FU10pKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIFJlY2VpdmVyIGZvciB0aGUgZnJhbWVzIGluIGEgLnN0YWNrIHByb3BlcnR5IGZyb20gY2FwdHVyZVN0YWNrVHJhY2VcbnZhciBWOEZSQU1FUyA9IHt9O1xuXG4vLyBWOCBjb2RlIHBhdGggZm9yIGdlbmVyYXRpbmcgYSBmcmFtZXMgZ2V0dGVyXG5mdW5jdGlvbiBtYWtlRnJhbWVzR2V0dGVyVjggKHNmZikge1xuICAvLyBUaGlzIHdpbGwgY2FsbCBvdXIgY3VzdG9tIHByZXBhcmVTdGFja1RyYWNlXG4gIE5hdGl2ZUVycm9yLmNhcHR1cmVTdGFja1RyYWNlKFY4RlJBTUVTLCBzZmYgfHwgbWFrZUZyYW1lc0dldHRlclY4KTtcbiAgc2ZmID0gbnVsbDtcbiAgdmFyIGZyYW1lcyA9IFY4RlJBTUVTLnN0YWNrO1xuICBWOEZSQU1FUy5zdGFjayA9IG51bGw7ICAvLyBUaGlzIGlzIG5lZWRlZCB0byBhdm9pZCBsZWFrcyEhIVxuICBWOEZSQU1FUyA9IHt9OyAgLy8gVGhlIG5leHQgY2FsbCByZXF1aXJlcyBhbiBlbXB0eSBvYmplY3RcblxuICByZXR1cm4gZnVuY3Rpb24gKGNsZWFudXApIHtcbiAgICB2YXIgcmVzdWx0ID0gZnJhbWVzO1xuICAgIC8vIENsZWFuIHVwIGNsb3N1cmUgdmFyaWFibGVzIHRvIGhlbHAgR0NcbiAgICBmcmFtZXMgPSBudWxsO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG5cbi8vIG5vbi1WOCBjb2RlIHBhdGggZm9yIGdlbmVyYXRpbmcgYSBmcmFtZXMgZ2V0dGVyXG5mdW5jdGlvbiBtYWtlRnJhbWVzR2V0dGVyQ29tcGF0IChzZmYpIHtcbiAgLy8gT2J0YWluIGEgc3RhY2sgdHJhY2UgYXQgdGhlIGN1cnJlbnQgcG9pbnRcbiAgdmFyIGVycm9yID0gZ2V0RXJyb3JXaXRoU3RhY2soKTtcblxuICAvLyBXYWxrIHRoZSBjYWxsZXIgY2hhaW4gdG8gYW5ub3RhdGUgdGhlIHN0YWNrIHdpdGggZnVuY3Rpb24gcmVmZXJlbmNlc1xuICAvLyBHaXZlbiB0aGUgbGltaXRhdGlvbnMgaW1wb3NlZCBieSBFUzUgXCJzdHJpY3QgbW9kZVwiIGl0J3Mgbm90IHBvc3NpYmxlXG4gIC8vIHRvIG9idGFpbiByZWZlcmVuY2VzIHRvIGZ1bmN0aW9ucyBiZXlvbmQgb25lIHRoYXQgaXMgZGVmaW5lZCBpbiBzdHJpY3RcbiAgLy8gbW9kZS4gQWxzbyBub3RlIHRoYXQgYW55IGtpbmQgb2YgcmVjdXJzaW9uIHdpbGwgbWFrZSB0aGUgd2Fsa2VyIHVuYWJsZVxuICAvLyB0byBnbyBwYXN0IGl0LlxuICB2YXIgY2FsbGVyID0gYXJndW1lbnRzLmNhbGxlZTtcbiAgdmFyIGZ1bmN0aW9ucyA9IFtnZXRFcnJvcldpdGhTdGFja107XG4gIGZvciAodmFyIGk9MDsgY2FsbGVyICYmIGkgPCAxMDsgaSsrKSB7XG4gICAgZnVuY3Rpb25zLnB1c2goY2FsbGVyKTtcbiAgICBpZiAoY2FsbGVyLmNhbGxlciA9PT0gY2FsbGVyKSBicmVhaztcbiAgICBjYWxsZXIgPSBjYWxsZXIuY2FsbGVyO1xuICB9XG4gIGNhbGxlciA9IG51bGw7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChjbGVhbnVwKSB7XG4gICAgdmFyIGZyYW1lcyA9IG51bGw7XG5cbiAgICBpZiAoIWNsZWFudXApIHtcbiAgICAgIC8vIFBhcnNlIHRoZSBzdGFjayB0cmFjZVxuICAgICAgdHJ5IHtcbiAgICAgICAgZnJhbWVzID0gRXJyb3JTdGFja1BhcnNlci5wYXJzZShlcnJvcik7XG5cbiAgICAgICAgLy8gQXR0YWNoIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdG8gdGhlIGZyYW1lcyAoc2tpcHBpbmcgdGhlIG1ha2VyIGZyYW1lcylcbiAgICAgICAgLy8gYW5kIGNyZWF0aW5nIENhbGxTaXRlIG9iamVjdHMgZm9yIGVhY2ggb25lLlxuICAgICAgICBmb3IgKHZhciBpPTI7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmcmFtZXNbaV0uZnVuY3Rpb24gPSBmdW5jdGlvbnNbaV07XG4gICAgICAgICAgZnJhbWVzW2ldID0gbmV3IENhbGxTaXRlKGZyYW1lc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBmcmFtZXMgPSB0cmltKGZyYW1lcy5zbGljZSgyKSwgc2ZmKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gSnVzdCBpZ25vcmUgYW5kIGxldCB0aGUgaGlnaGVyIGxheWVycyBkZWFsIHdpdGggaXRcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgc2ZmID0gZXJyb3IgPSBmdW5jdGlvbnMgPSBudWxsO1xuXG4gICAgcmV0dXJuIGZyYW1lcztcbiAgfTtcbn1cblxuLy8gR2VuZXJhdGVzIGEgZ2V0dGVyIGZvciB0aGUgY2FsbCBzaXRlIGZyYW1lcy4gVGhlIGdldHRlciByZXR1cm5lZCBieVxuLy8gdGhlc2UgZmFjdG9yaWVzIGNhbiBvbmx5IHVzZWQgb25jZSwgc2luY2UgdGhleSBjbGVhbiB1cCB0aGVpciBpbm5lciBzdGF0ZVxuLy8gYWZ0ZXIgdGhleSBhcmUgY2FsbGVkLiBUaGV5IGFjY2VwdCBhbiBvcHRpb25hbCBib29sZWFuIGFyZ3VtZW50IHdoaWNoXG4vLyBpZiB0cnVlIHdpbGwganVzdCBjbGVhbiB1cCB3aXRob3V0IGNvbXB1dGluZyB0aGUgZnJhbWVzLlxuLy9cbi8vIFRPRE86IElmIHdlIG9ic2VydmUgbGVha3Mgd2l0aCBjb21wbGV4IHVzZSBjYXNlcyAoZHVlIHRvIGNsb3N1cmUgc2NvcGVzKVxuLy8gICAgICAgd2UgY2FuIGdlbmVyYXRlIGhlcmUgb3VyIGNvbXBhdCBDYWxsU2l0ZSBvYmplY3RzIHN0b3JpbmcgdGhlIGZ1bmN0aW9uJ3Ncbi8vICAgICAgIHNvdXJjZSBjb2RlIGluc3RlYWQgb2YgYW4gYWN0dWFsIHJlZmVyZW5jZSB0byB0aGVtLCB0aGF0IHNob3VsZCBoZWxwXG4vLyAgICAgICB0aGUgR0Mgc2luY2Ugd2UnbGwgYmUganVzdCBrZWVwaW5nIGxpdGVyYWxzIGFyb3VuZC5cbnZhciBtYWtlRnJhbWVzR2V0dGVyID0gdHlwZW9mIE5hdGl2ZUVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICA/IG1ha2VGcmFtZXNHZXR0ZXJWOFxuICAgICAgICAgICAgICAgICAgICAgOiBtYWtlRnJhbWVzR2V0dGVyQ29tcGF0O1xuXG5cbi8vIE92ZXJyaWRlIFY4IHN0YWNrIHRyYWNlIGJ1aWxkZXIgdG8gaW5qZWN0IG91ciBsb2dpY1xudmFyIG9sZFByZXBhcmVTdGFja1RyYWNlID0gRXJyb3IucHJlcGFyZVN0YWNrVHJhY2U7XG5FcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChlcnJvciwgZnJhbWVzKSB7XG4gIC8vIFdoZW4gY2FsbGVkIGZyb20gbWFrZUZyYW1lc0dldHRlclY4IHdlIGp1c3Qgd2FudCB0byBvYnRhaW4gdGhlIGZyYW1lc1xuICBpZiAoZXJyb3IgPT09IFY4RlJBTUVTKSB7XG4gICAgcmV0dXJuIGZyYW1lcztcbiAgfVxuXG4gIC8vIEZvcndhcmQgdG8gYW55IHByZXZpb3VzbHkgZGVmaW5lZCBiZWhhdmlvdXJcbiAgaWYgKG9sZFByZXBhcmVTdGFja1RyYWNlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBvbGRQcmVwYXJlU3RhY2tUcmFjZS5jYWxsKEVycm9yLCBlcnJvciwgZnJhbWVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBKdXN0IGlnbm9yZSB0aGUgZXJyb3IgKGllOiBrYXJtYS1zb3VyY2UtbWFwLXN1cHBvcnQpXG4gICAgfVxuICB9XG5cbiAgLy8gRW11bGF0ZSBkZWZhdWx0IGJlaGF2aW91ciAod2l0aCBsb25nLXRyYWNlcylcbiAgcmV0dXJuIEZhaWx1cmUucHJvdG90eXBlLnByZXBhcmVTdGFja1RyYWNlLmNhbGwoZXJyb3IsIHVud2luZChmcmFtZXMpKTtcbn07XG5cbi8vIEF0dGFjaCBhIG5ldyBleGNsdXNpb24gcHJlZGljYXRlIGZvciBmcmFtZXNcbmZ1bmN0aW9uIGV4Y2x1ZGUgKGN0b3IsIHByZWRpY2F0ZSkge1xuICB2YXIgZm4gPSBwcmVkaWNhdGU7XG5cbiAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgZm4gPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICAgIHJldHVybiAtMSAhPT0gZnJhbWUuZ2V0RmlsZU5hbWUoKS5pbmRleE9mKHByZWRpY2F0ZSk7XG4gICAgfTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcHJlZGljYXRlLnRlc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICBmbiA9IGZ1bmN0aW9uIChmcmFtZSkge1xuICAgICAgcmV0dXJuIHByZWRpY2F0ZS50ZXN0KGZyYW1lLmdldEZpbGVOYW1lKCkpO1xuICAgIH07XG4gIH1cblxuICBjdG9yLmV4Y2x1ZGVzLnB1c2goZm4pO1xufVxuXG4vLyBFeHBvc2UgdGhlIGZpbHRlciBpbiB0aGUgcm9vdCBGYWlsdXJlIHR5cGVcbkZhaWx1cmUuZXhjbHVkZXMgPSBbXTtcbkZhaWx1cmUuZXhjbHVkZSA9IGV4Y2x1ZGUuYmluZChudWxsLCBGYWlsdXJlKTtcblxuLy8gQXR0YWNoIGEgZnJhbWVzIGdldHRlciB0byB0aGUgZnVuY3Rpb24gc28gd2UgY2FuIHJlLWNvbnN0cnVjdCBhc3luYyBzdGFja3MuXG4vL1xuLy8gTm90ZSB0aGF0IHRoaXMganVzdCBhdWdtZW50cyB0aGUgZnVuY3Rpb24gd2l0aCB0aGUgbmV3IHByb3BlcnR5LCBpdCBkb2Vzbid0XG4vLyBjcmVhdGUgYSB3cmFwcGVyIGV2ZXJ5IHRpbWUgaXQncyBjYWxsZWQsIHNvIHVzaW5nIGl0IG11bHRpcGxlIHRpbWVzIG9uIHRoZVxuLy8gc2FtZSBmdW5jdGlvbiB3aWxsIGluZGVlZCBvdmVyd3JpdGUgdGhlIHByZXZpb3VzIHRyYWNraW5nIGluZm9ybWF0aW9uLiBUaGlzXG4vLyBpcyBpbnRlbmRlZCBzaW5jZSBpdCdzIGZhc3RlciBhbmQgbW9yZSBpbXBvcnRhbnRseSBkb2Vzbid0IGJyZWFrIHNvbWUgQVBJc1xuLy8gdXNpbmcgY2FsbGJhY2sgcmVmZXJlbmNlcyB0byB1bnJlZ2lzdGVyIHRoZW0gZm9yIGluc3RhbmNlLlxuLy8gV2hlbiB5b3Ugd2FudCB0byB1c2UgdGhlIHNhbWUgZnVuY3Rpb24gd2l0aCBkaWZmZXJlbnQgdHJhY2tpbmcgaW5mb3JtYXRpb25cbi8vIGp1c3QgdXNlIEZhaWx1cmUud3JhcCgpLlxuLy9cbi8vIFRoZSB0cmFja2luZyBjYW4gYmUgZ2xvYmFsbHkgZGlzYWJsZWQgYnkgc2V0dGluZyBGYWlsdXJlLlRSQUNLSU5HIHRvIGZhbHNlXG5GYWlsdXJlLnRyYWNrID0gZnVuY3Rpb24gRmFpbHVyZV90cmFjayAoZm4sIHNmZikge1xuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgLy8gQ2xlYW4gdXAgcHJldmlvdXMgZnJhbWVzIHRvIGhlbHAgdGhlIEdDXG4gIGlmICh0eXBlb2YgZm5bU1lNQk9MX0ZSQU1FU10gPT09ICdmdW5jdGlvbicpIHtcbiAgICBmbltTWU1CT0xfRlJBTUVTXSh0cnVlKTtcbiAgfVxuXG4gIGlmIChGYWlsdXJlLlRSQUNLSU5HKSB7XG4gICAgZm5bU1lNQk9MX0ZSQU1FU10gPSBudWxsO1xuICAgIGZuW1NZTUJPTF9GUkFNRVNdID0gbWFrZUZyYW1lc0dldHRlcihzZmYgfHwgRmFpbHVyZV90cmFjayk7XG4gIH1cblxuICByZXR1cm4gZm47XG59O1xuXG4vLyBXcmFwcyB0aGUgZnVuY3Rpb24gYmVmb3JlIGFubm90YXRpbmcgaXQgd2l0aCB0cmFja2luZyBpbmZvcm1hdGlvbiwgdGhpc1xuLy8gYWxsb3dzIHRvIHRyYWNrIG11bHRpcGxlIGNhbGxzIGZvciBhIHNpbmdsZSBmdW5jdGlvbi5cbkZhaWx1cmUud3JhcCA9IGZ1bmN0aW9uIEZhaWx1cmVfd3JhcCAoZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSBGYWlsdXJlLmlnbm9yZShmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuXG4gIHJldHVybiBGYWlsdXJlLnRyYWNrKHdyYXBwZXIsIEZhaWx1cmVfd3JhcCk7XG59O1xuXG4vLyBNYXJrIGEgZnVuY3Rpb24gdG8gYmUgaWdub3JlZCB3aGVuIGdlbmVyYXRpbmcgc3RhY2sgdHJhY2VzXG5GYWlsdXJlLmlnbm9yZSA9IGZ1bmN0aW9uIEZhaWx1cmVfaWdub3JlIChmbikge1xuICBmbltTWU1CT0xfSUdOT1JFXSA9IHRydWU7XG4gIHJldHVybiBmbjtcbn07XG5cbi8vIEhlbHBlciBmb3IgdHJhY2tpbmcgYSBzZXRUaW1lb3V0XG5GYWlsdXJlLnNldFRpbWVvdXQgPSBmdW5jdGlvbiBGYWlsdXJlX3NldFRpbWVvdXQgKCkge1xuICBhcmd1bWVudHNbMF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1swXSwgRmFpbHVyZV9zZXRUaW1lb3V0KTtcbiAgcmV0dXJuIHNldFRpbWVvdXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn07XG5cbi8vIEhlbHBlciBmb3IgdHJhY2tpbmcgYSBuZXh0VGlja1xuRmFpbHVyZS5uZXh0VGljayA9IGZ1bmN0aW9uIEZhaWx1cmVfbmV4dFRpY2sgKCkge1xuICBhcmd1bWVudHNbMF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1swXSwgRmFpbHVyZV9uZXh0VGljayk7XG4gIHJldHVybiBwcm9jZXNzLm5leHRUaWNrLmFwcGx5KHByb2Nlc3MsIGFyZ3VtZW50cyk7XG59O1xuXG4vLyBBbGxvd3MgdG8gZWFzaWx5IHBhdGNoIGEgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIGNhbGxiYWNrXG4vLyB0byBhbGxvdyB0cmFja2luZyB0aGUgYXN5bmMgZmxvd3MuXG4vLyBpZTogRmFpbHVyZS5wYXRoKHdpbmRvdywgJ3NldEludGVydmFsJylcbkZhaWx1cmUucGF0Y2ggPSBmdW5jdGlvbiBGYWlsdXJlX3BhdGNoKG9iaiwgbmFtZSwgaWR4KSB7XG4gIGlmIChvYmogJiYgdHlwZW9mIG9ialtuYW1lXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBcIicgKyBuYW1lICsgJ1wiIG1ldGhvZCcpO1xuICB9XG5cbiAgdmFyIG9yaWdpbmFsID0gb2JqW25hbWVdO1xuXG4gIC8vIFdoZW4gdGhlIGV4YWN0IGFyZ3VtZW50IGluZGV4IGlzIHByb3ZpZGVkIHVzZSBhbiBvcHRpbWl6ZWQgY29kZSBwYXRoXG4gIGlmICh0eXBlb2YgaWR4ID09PSAnbnVtYmVyJykge1xuXG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgYXJndW1lbnRzW2lkeF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1tpZHhdLCBvYmpbbmFtZV0pO1xuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAvLyBPdGhlcndpc2UgZGV0ZWN0IHRoZSBmdW5jdGlvbnMgdG8gdHJhY2sgYXQgaW52b2thdGlvbiB0aW1lXG4gIH0gZWxzZSB7XG5cbiAgICBvYmpbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGFyZ3VtZW50c1tpXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzW2ldLCBvYmpbbmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSB3cmFwcGVyIHdpdGggYW55IHByb3BlcnRpZXMgZnJvbSB0aGUgb3JpZ2luYWxcbiAgZm9yICh2YXIgayBpbiBvcmlnaW5hbCkgaWYgKG9yaWdpbmFsLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgb2JqW25hbWVdW2tdID0gb3JpZ2luYWxba107XG4gIH1cblxuICByZXR1cm4gb2JqW25hbWVdO1xufTtcblxuLy8gSGVscGVyIHRvIGNyZWF0ZSBuZXcgRmFpbHVyZSB0eXBlc1xuRmFpbHVyZS5jcmVhdGUgPSBmdW5jdGlvbiAobmFtZSwgcHJvcHMpIHtcbiAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBGYWlsdXJlKCdFeHBlY3RlZCBhIG5hbWUgYXMgZmlyc3QgYXJndW1lbnQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGN0b3IgKG1lc3NhZ2UsIHNmZikge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGYWlsdXJlKSkge1xuICAgICAgcmV0dXJuIG5ldyBjdG9yKG1lc3NhZ2UsIHNmZik7XG4gICAgfVxuICAgIEZhaWx1cmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIC8vIEF1Z21lbnQgY29uc3RydWN0b3JcbiAgY3Rvci5leGNsdWRlcyA9IFtdO1xuICBjdG9yLmV4Y2x1ZGUgPSBmdW5jdGlvbiAocHJlZGljYXRlKSB7XG4gICAgZXhjbHVkZShjdG9yLCBwcmVkaWNhdGUpO1xuICB9O1xuXG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShGYWlsdXJlLnByb3RvdHlwZSk7XG4gIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvcjtcbiAgY3Rvci5wcm90b3R5cGUubmFtZSA9IG5hbWU7XG4gIGlmICh0eXBlb2YgcHJvcHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjdG9yLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZSA9IHByb3BzO1xuICB9IGVsc2UgaWYgKHByb3BzKSB7XG4gICAgT2JqZWN0LmtleXMocHJvcHMpLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIGN0b3IucHJvdG90eXBlW3Byb3BdID0gcHJvcDtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY3Rvcjtcbn07XG5cbi8vIEJ5IGRlZmF1bHQgb25seSBFcnJvciB3aWxsIGJlIHJlcGxhY2VkXG5GYWlsdXJlLmluc3RhbGwgPSBmdW5jdGlvbiAoLyogLi4uICovKSB7XG4gIHZhciByb290ID0gdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgPyB3aW5kb3cgOiBnbG9iYWw7XG5cbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICBpZiAoYXJncy5sZW5ndGggPT09IDApIHtcbiAgICBhcmdzLnB1c2goJ0Vycm9yJyk7XG4gIH1cblxuICBmb3IgKHZhciBpPTA7IGk8YXJncy5sZW5ndGg7IGkrKykge1xuICAgIHJvb3RbYXJnc1tpXV0gPSBGYWlsdXJlLmNyZWF0ZShhcmdzW2ldKTtcbiAgfVxuXG4gIC8vIEFsbG93IHVzYWdlOiB2YXIgRmFpbHVyZSA9IHJlcXVpcmUoJ2ZhaWx1cmUnKS5pbnN0YWxsKClcbiAgcmV0dXJuIEZhaWx1cmU7XG59O1xuXG5cbnZhciBwcm90byA9IEZhaWx1cmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xucHJvdG8uY29uc3RydWN0b3IgPSBGYWlsdXJlO1xuXG5wcm90by5uYW1lID0gJ0ZhaWx1cmUnO1xucHJvdG8ubWVzc2FnZSA9ICcnO1xuXG5pZiAoVVNFX0RFRl9QUk9QKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2ZyYW1lcycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFVzZSB0cmltbWluZyBqdXN0IGluIGNhc2UgdGhlIHNmZiB3YXMgZGVmaW5lZCBhZnRlciBjb25zdHJ1Y3RpbmdcbiAgICAgIHZhciBmcmFtZXMgPSB1bndpbmQodHJpbSh0aGlzLl9nZXRGcmFtZXMoKSwgdGhpcy5zZmYpKTtcblxuICAgICAgLy8gQ2FjaGUgbmV4dCBhY2Nlc3NlcyB0byB0aGUgcHJvcGVydHlcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZnJhbWVzJywge1xuICAgICAgICB2YWx1ZTogZnJhbWVzLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIC8vIENsZWFuIHVwIHRoZSBnZXR0ZXIgY2xvc3VyZVxuICAgICAgdGhpcy5fZ2V0RnJhbWVzID0gbnVsbDtcblxuICAgICAgcmV0dXJuIGZyYW1lcztcbiAgICB9XG4gIH0pO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ3N0YWNrJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHN0YWNrID0gdGhpcy5nZW5lcmF0ZVN0YWNrVHJhY2UoKTtcblxuICAgICAgLy8gQ2FjaGUgbmV4dCBhY2Nlc3NlcyB0byB0aGUgcHJvcGVydHlcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnc3RhY2snLCB7XG4gICAgICAgIHZhbHVlOiBzdGFjayxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gc3RhY2s7XG4gICAgfVxuICB9KTtcbn1cblxucHJvdG8uZ2VuZXJhdGVTdGFja1RyYWNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZXhjbHVkZXMgPSB0aGlzLmNvbnN0cnVjdG9yLmV4Y2x1ZGVzO1xuICB2YXIgaW5jbHVkZSwgZnJhbWVzID0gW107XG5cbiAgLy8gU3BlY2lmaWMgcHJvdG90eXBlcyBpbmhlcml0IHRoZSBleGNsdWRlcyBmcm9tIEZhaWx1cmVcbiAgaWYgKGV4Y2x1ZGVzICE9PSBGYWlsdXJlLmV4Y2x1ZGVzKSB7XG4gICAgZXhjbHVkZXMucHVzaC5hcHBseShleGNsdWRlcywgRmFpbHVyZS5leGNsdWRlcyk7XG4gIH1cblxuICAvLyBBcHBseSBmaWx0ZXJpbmdcbiAgZm9yICh2YXIgaT0wOyBpIDwgdGhpcy5mcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpbmNsdWRlID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5mcmFtZXNbaV0pIHtcbiAgICAgIGZvciAodmFyIGo9MDsgaW5jbHVkZSAmJiBqIDwgZXhjbHVkZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaW5jbHVkZSAmPSAhZXhjbHVkZXNbal0uY2FsbCh0aGlzLCB0aGlzLmZyYW1lc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICBmcmFtZXMucHVzaCh0aGlzLmZyYW1lc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gSG9ub3IgYW55IHByZXZpb3VzbHkgZGVmaW5lZCBzdGFja3RyYWNlIGZvcm1hdHRlciBieSBhbGxvd2luZ1xuICAvLyBpdCB0byBmb3JtYXQgdGhlIGZyYW1lcy4gVGhpcyBpcyBuZWVkZWQgd2hlbiB1c2luZ1xuICAvLyBub2RlLXNvdXJjZS1tYXAtc3VwcG9ydCBmb3IgaW5zdGFuY2UuXG4gIC8vIFRPRE86IENhbiB3ZSBtYXAgdGhlIFwibnVsbFwiIGZyYW1lcyB0byBhIENhbGxGcmFtZSBzaGltP1xuICBpZiAob2xkUHJlcGFyZVN0YWNrVHJhY2UpIHtcbiAgICBmcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiAhIXg7IH0pO1xuICAgIHJldHVybiBvbGRQcmVwYXJlU3RhY2tUcmFjZS5jYWxsKEVycm9yLCB0aGlzLCBmcmFtZXMpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMucHJlcGFyZVN0YWNrVHJhY2UoZnJhbWVzKTtcbn07XG5cbnByb3RvLnByZXBhcmVTdGFja1RyYWNlID0gZnVuY3Rpb24gKGZyYW1lcykge1xuICB2YXIgbGluZXMgPSBbdGhpc107XG4gIGZvciAodmFyIGk9MDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBmcmFtZXNbaV0gPyBGYWlsdXJlLkZSQU1FX1BSRUZJWCArIGZyYW1lc1tpXSA6IEZhaWx1cmUuRlJBTUVfRU1QVFlcbiAgICApO1xuICB9XG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBGYWlsdXJlO1xuIl19
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2Vycm9yLmpzIiwibGliL2V4cGVjdGF0aW9uLmpzIiwibGliL21hdGNoZXIuanMiLCJsaWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uLmpzIiwibGliL21hdGNoZXJzL2NvcmUuanMiLCJsaWIvbWF0Y2hlcnMvcHJvbWlzZS5qcyIsImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyIsImxpYi9wYXRjaGVzLmpzIiwibGliL3Jlc29sdmVycy5qcyIsImxpYi9zaG91bGQuanMiLCJsaWIvdXRpbC5qcyIsIm1haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9jYWxsLXNpdGUuanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9saWIvZmFpbHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL21haW4uanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9ub2RlX21vZHVsZXMvZXJyb3Itc3RhY2stcGFyc2VyL2Vycm9yLXN0YWNrLXBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL25vZGVfbW9kdWxlcy9lcnJvci1zdGFjay1wYXJzZXIvbm9kZV9tb2R1bGVzL3N0YWNrZnJhbWUvc3RhY2tmcmFtZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMTVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6ZEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIE1hdGNoZXIgPSByZXF1aXJlKCcuL21hdGNoZXInKTtcbnZhciBFeHBlY3RhdGlvbiA9IHJlcXVpcmUoJy4vZXhwZWN0YXRpb24nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cblxudmFyIGRlZlByb3AgPSB1dGlsLmJpbmQoT2JqZWN0LmRlZmluZVByb3BlcnR5LCBPYmplY3QpO1xuXG5cbi8vIFB1YmxpYyBpbnRlcmZhY2VcbmZ1bmN0aW9uIGFzcyAodmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IENoYWluKCk7XG4gIH1cbiAgcmV0dXJuIG5ldyBDaGFpbih2YWx1ZSk7XG59XG5cbi8vIERlZmVycmVkIGZhY3RvcnlcbmFzcy5fID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpLl87XG59O1xuXG4vLyBHbG9iYWwgcmVnaXN0cnkgb2YgbWF0Y2hlcnMgKHVzZWQgZm9yIGFzcy5oZWxwKVxuYXNzLm1hdGNoZXJzID0gW107XG5cbi8vIGFzcy5oZWxwIGR1bXBzIHRoZSBoZWxwIG9mIGVhY2ggbWF0Y2hlciByZWdpc3RlcmVkXG5kZWZQcm9wKGFzcywgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gJyc7XG4gICAgXy5mb3JFYWNoKGFzcy5tYXRjaGVycywgZnVuY3Rpb24gKG1hdGNoZXIpIHtcbiAgICAgIC8vIFRPRE86IFRoaXMgY2FuIGJlIG5pY2VyXG4gICAgICB2YXIgZm4gPSBtYXRjaGVyLnRlc3QudG9TdHJpbmcoKTtcbiAgICAgIHZhciBhcmdzID0gZm4ucmVwbGFjZSgvXmZ1bmN0aW9uXFxzKlxcKChbXlxcKV0qKVxcKVtcXFNcXHNdKi8sICckMScpO1xuICAgICAgYXJncyA9IGFyZ3Muc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgudHJpbSgpOyB9KTtcbiAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgIGZuID0gYXJncy5sZW5ndGggPyAnICgnICsgYXJncy5qb2luKCcsICcpICsgJyknIDogJyc7XG5cbiAgICAgIHMgKz0gJz4gLicgKyBtYXRjaGVyLm5hbWUgKyBmbiArICdcXG5cXG4nO1xuICAgICAgcyArPSAnICAnICsgbWF0Y2hlci5oZWxwLnJlcGxhY2UoL1xcbi9nLCAnXFxuICAnKTtcbiAgICAgIHMgKz0gJ1xcblxcbic7XG4gICAgfSk7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn0pO1xuXG5hc3Mub2sgPSBmdW5jdGlvbiAoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSB0cnVpc2ggdmFsdWUnO1xuICB9XG4gIGFzcy5kZXNjKG1lc3NhZ2UpLnRydXRoeS5hc3NlcnQoY29uZCwgYXNzLm9rKTtcbiAgcmV0dXJuIGNvbmQ7XG59O1xuXG5hc3Mua28gPSBmdW5jdGlvbiAoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSBmYWxzeSB2YWx1ZSc7XG4gIH1cbiAgYXNzLmRlc2MobWVzc2FnZSkuZmFsc3kuYXNzZXJ0KGNvbmQsIGFzcy5rbyk7XG4gIHJldHVybiBjb25kO1xufTtcblxuLy8gUmVzZXRzIG9yIHZlcmlmaWVzIHRoZSBudW1iZXIgb2YgbWFya3Mgc28gZmFyXG4vLyBGb3JjZWQgYXJpdHktMCB0byBiZSBjb21wYXRpYmxlIHdpdGg6IGJlZm9yZUVhY2goYXNzLm1hcmtzKVxuYXNzLm1hcmtzID0gZnVuY3Rpb24gKC8qIGV4cGVjdGVkLCBkZXNjICovKSB7XG4gIHZhciBleHBlY3RlZCA9IGFyZ3VtZW50c1swXTtcbiAgdmFyIGRlc2MgPSBhcmd1bWVudHNbMV07XG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgZXhwZWN0ZWQgPSBhc3MubWFya3MuY291bnRlcjtcbiAgICBhc3MubWFya3MuY291bnRlciA9IDA7XG4gICAgcmV0dXJuIGV4cGVjdGVkOyAgLy8gcmV0dXJuIGJhY2sgaG93IG1hbnkgdGhlcmUgd2VyZVxuICB9XG5cbiAgYXNzLmRlc2MoZGVzYyB8fCAnYXNzLm1hcmtzJykuZXEoZXhwZWN0ZWQpXG4gIC5hc3NlcnQoYXNzLm1hcmtzLmNvdW50ZXIsIGFzcy5tYXJrcyk7XG59O1xuYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuXG5cbi8vIEhlbHBlciB0byByZWdpc3RlciBuZXcgbWF0Y2hlcnMgaW4gdGhlIHJlZ2lzdHJ5XG5hc3MucmVnaXN0ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWF0Y2hlcikge1xuICBpZiAobmFtZSBpbnN0YW5jZW9mIE1hdGNoZXIpIHtcbiAgICBtYXRjaGVyID0gbmFtZTtcbiAgICBuYW1lID0gbWF0Y2hlci5uYW1lO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgIE9iamVjdC5rZXlzKG5hbWUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgYXNzLnJlZ2lzdGVyKGtleSwgbmFtZVtrZXldKTtcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSB7ICAvLyBBc3N1bWUgYSBkZXNjcmlwdG9yIHdhcyBnaXZlblxuICAgIC8vIENyZWF0ZSB0aGUgYWxpYXNlcyBmaXJzdFxuICAgIF8uZm9yRWFjaChtYXRjaGVyLmFsaWFzZXMsIGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgYXNzLnJlZ2lzdGVyKG5ldyBNYXRjaGVyKGFsaWFzLCBtYXRjaGVyKSk7XG4gICAgfSk7XG5cbiAgICBtYXRjaGVyID0gbmV3IE1hdGNoZXIobmFtZSwgbWF0Y2hlcik7XG4gIH1cblxuICAvLyBLZWVwIHRoZSBtYXRjaGVyIGFyb3VuZCBmb3IgYXNzLmhlbHBcbiAgYXNzLm1hdGNoZXJzLnB1c2gobWF0Y2hlcik7XG5cblxuICAvLyBUT0RPOiBBbGxvdyBtYXRjaGVycyB0byBiZSBvdmVycmlkZGVuIGFuZCBhbHNvIG92ZXJsb2FkZWRcbiAgLy8gICAgICAgaWYgdGhleSBoYXZlIGFuIFwib3ZlcmxvYWRcIiBtZXRob2QgaXQgY2FuIGJlIHVzZWRcbiAgLy8gICAgICAgdG8gY2hlY2sgd2hpY2ggb25lIHNob3VsZCBiZSB1c2VkLlxuICAvLyAgICAgICBCZXR0ZXIgSWRlYSAoSSB0aGluayksIGluc3RlYWQgb2Ygb3ZlcmxvYWRpbmcgYmFzZWRcbiAgLy8gICAgICAgb24gdGhlIHZhbHVlIHVuZGVyIHRlc3QsIHdoaWNoIG1heSBwcm9kdWNlIGlzc3Vlc1xuICAvLyAgICAgICBzaW5jZSB3ZSBkb24ndCBrbm93IGZvciBzdXJlIHdoYXQgdGhhdCB2YWx1ZSBpcyxcbiAgLy8gICAgICAgYWxsb3cgbWF0Y2hlcnMgdG8gaW50cm9kdWNlIGEgbmV3IFwicHJvdG90eXBlXCIgZm9yXG4gIC8vICAgICAgIHRoZSBjaGFpbiwgdGhhdCBpcywgYSAuZG9tIG1hdGNoZXIgd2lsbCBpbmNsdWRlXG4gIC8vICAgICAgIGFsbCB0aGUgY29yZSBleHBlY3RhdGlvbnMgYnV0IHRoZW4gYWxzbyBvdmVycmlkZXNcbiAgLy8gICAgICAgYW5kIG5ldyBvbmVzIHVudGlsIHRoZSBlbmQgb2YgdGhlIGNoYWluLlxuXG5cbiAgLy8gTWF0Y2hlciBmdW5jdGlvbnMgd2l0aCBhIHNpbmdsZSBhcmd1bWVudCBhcmUgZ2V0dGVyc1xuICB2YXIgZm5LZXkgPSBtYXRjaGVyLmFyaXR5ID09PSAxID8gJ2dldCcgOiAndmFsdWUnO1xuICB2YXIgcHJvcCA9IHtcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfTtcbiAgaWYgKGZuS2V5ID09PSAndmFsdWUnKSB7XG4gICAgcHJvcC53cml0YWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgLy8gQXVnbWVudCB0aGUgQ2hhaW4gcHJvdG90eXBlXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gZm4gKCkge1xuICAgIHZhciBleHAgPSBuZXcgRXhwZWN0YXRpb24obWF0Y2hlciwgYXJndW1lbnRzKTtcbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucHVzaChleHApO1xuICAgIGlmICghdGhpcy5fX2RlZmVycmVkX18pIHtcbiAgICAgIHRoaXMuYXNzZXJ0KHRoaXMudmFsdWUsIGZuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHByb3ApO1xuXG4gIC8vIEF1Z21lbnQgdGhlIHN0YXRpYyBpbnRlcmZhY2VcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoYWluID0gbmV3IENoYWluKCk7XG5cbiAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICByZXR1cm4gY2hhaW5bbmFtZV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYWluW25hbWVdLmFwcGx5KGNoYWluLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIGRlZlByb3AoYXNzLCBuYW1lLCBwcm9wKTtcblxuICAvLyBQYXNzIHRocm91Z2ggZm9yIGNoYWluc1xuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uIHBhc3N0aHJvdWdoKCkge1xuICAgIHJldHVybiB0aGlzW25hbWVdLmFzc2VydCh0aGlzLnZhbHVlLCBwYXNzdGhyb3VnaCkudmFsdWVPZigpO1xuICB9O1xuICBwcm9wLmVudW1lcmFibGUgPSBmYWxzZTtcbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsICckJyArIG5hbWUsIHByb3ApO1xuXG4gIC8vIFBhc3MgdGhyb3VnaCBzdGF0aWMgY29uc3RydWN0b3JcbiAgZGVmUHJvcChhc3MsICckJyArIG5hbWUsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICAgIHJldHVybiBhc3ModmFsdWUpWyckJyArIG5hbWVdO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgZXhwcmVzc2lvbiBmb3IgdGhlIGV4cGVjdGF0aW9uXG4gICAgICB2YXIgY2hhaW4gPSBuZXcgQ2hhaW4oKTtcbiAgICAgIGNoYWluW25hbWVdLmFwcGx5KGNoYWluLCBhcmd1bWVudHMpO1xuICAgICAgLy8gUmV0dXJuIGEgY2FsbGFibGUgdGhhdCBhc3NlcnRzIHVwb24gcmVjZWl2aW5nIGEgdmFsdWVcbiAgICAgIHJldHVybiBjaGFpbi50aHJvdWdoO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBhc3M7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOWhjM011YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SjJZWElnWHlBOUlDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzV3lkZkoxMGdPaUIwZVhCbGIyWWdaMnh2WW1Gc0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdaMnh2WW1Gc1d5ZGZKMTBnT2lCdWRXeHNLVHRjYmx4dWRtRnlJRU5vWVdsdUlEMGdjbVZ4ZFdseVpTZ25MaTlqYUdGcGJpY3BPMXh1ZG1GeUlFMWhkR05vWlhJZ1BTQnlaWEYxYVhKbEtDY3VMMjFoZEdOb1pYSW5LVHRjYm5aaGNpQkZlSEJsWTNSaGRHbHZiaUE5SUhKbGNYVnBjbVVvSnk0dlpYaHdaV04wWVhScGIyNG5LVHRjYm5aaGNpQjFkR2xzSUQwZ2NtVnhkV2x5WlNnbkxpOTFkR2xzSnlrN1hHNWNibHh1ZG1GeUlHUmxabEJ5YjNBZ1BTQjFkR2xzTG1KcGJtUW9UMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1TENCUFltcGxZM1FwTzF4dVhHNWNiaTh2SUZCMVlteHBZeUJwYm5SbGNtWmhZMlZjYm1aMWJtTjBhVzl1SUdGemN5QW9kbUZzZFdVcElIdGNiaUFnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BUMDlJREFwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdibVYzSUVOb1lXbHVLQ2s3WEc0Z0lIMWNiaUFnY21WMGRYSnVJRzVsZHlCRGFHRnBiaWgyWVd4MVpTazdYRzU5WEc1Y2JpOHZJRVJsWm1WeWNtVmtJR1poWTNSdmNubGNibUZ6Y3k1ZklEMGdablZ1WTNScGIyNGdLSFpoYkhWbEtTQjdYRzRnSUhKbGRIVnliaUJ1WlhjZ1EyaGhhVzRvZG1Gc2RXVXBMbDg3WEc1OU8xeHVYRzR2THlCSGJHOWlZV3dnY21WbmFYTjBjbmtnYjJZZ2JXRjBZMmhsY25NZ0tIVnpaV1FnWm05eUlHRnpjeTVvWld4d0tWeHVZWE56TG0xaGRHTm9aWEp6SUQwZ1cxMDdYRzVjYmk4dklHRnpjeTVvWld4d0lHUjFiWEJ6SUhSb1pTQm9aV3h3SUc5bUlHVmhZMmdnYldGMFkyaGxjaUJ5WldkcGMzUmxjbVZrWEc1a1pXWlFjbTl3S0dGemN5d2dKMmhsYkhBbkxDQjdYRzRnSUdkbGREb2dablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJSFpoY2lCeklEMGdKeWM3WEc0Z0lDQWdYeTVtYjNKRllXTm9LR0Z6Y3k1dFlYUmphR1Z5Y3l3Z1puVnVZM1JwYjI0Z0tHMWhkR05vWlhJcElIdGNiaUFnSUNBZ0lDOHZJRlJQUkU4NklGUm9hWE1nWTJGdUlHSmxJRzVwWTJWeVhHNGdJQ0FnSUNCMllYSWdabTRnUFNCdFlYUmphR1Z5TG5SbGMzUXVkRzlUZEhKcGJtY29LVHRjYmlBZ0lDQWdJSFpoY2lCaGNtZHpJRDBnWm00dWNtVndiR0ZqWlNndlhtWjFibU4wYVc5dVhGeHpLbHhjS0NoYlhseGNLVjBxS1Z4Y0tWdGNYRk5jWEhOZEtpOHNJQ2NrTVNjcE8xeHVJQ0FnSUNBZ1lYSm5jeUE5SUdGeVozTXVjM0JzYVhRb0p5d25LUzV0WVhBb1puVnVZM1JwYjI0Z0tIZ3BJSHNnY21WMGRYSnVJSGd1ZEhKcGJTZ3BPeUI5S1R0Y2JpQWdJQ0FnSUdGeVozTXVjMmhwWm5Rb0tUdGNiaUFnSUNBZ0lHWnVJRDBnWVhKbmN5NXNaVzVuZEdnZ1B5QW5JQ2duSUNzZ1lYSm5jeTVxYjJsdUtDY3NJQ2NwSUNzZ0p5a25JRG9nSnljN1hHNWNiaUFnSUNBZ0lITWdLejBnSno0Z0xpY2dLeUJ0WVhSamFHVnlMbTVoYldVZ0t5Qm1iaUFySUNkY1hHNWNYRzRuTzF4dUlDQWdJQ0FnY3lBclBTQW5JQ0FuSUNzZ2JXRjBZMmhsY2k1b1pXeHdMbkpsY0d4aFkyVW9MMXhjYmk5bkxDQW5YRnh1SUNBbktUdGNiaUFnSUNBZ0lITWdLejBnSjF4Y2JseGNiaWM3WEc0Z0lDQWdmU2s3WEc0Z0lDQWdjbVYwZFhKdUlITTdYRzRnSUgxY2JuMHBPMXh1WEc1aGMzTXViMnNnUFNCbWRXNWpkR2x2YmlBb1kyOXVaQ3dnYldWemMyRm5aU2tnZTF4dUlDQnBaaUFvWVhKbmRXMWxiblJ6TG14bGJtZDBhQ0E5UFQwZ01Ta2dlMXh1SUNBZ0lHMWxjM05oWjJVZ1BTQW5aWGh3WldOMFpXUWdZU0IwY25WcGMyZ2dkbUZzZFdVbk8xeHVJQ0I5WEc0Z0lHRnpjeTVrWlhOaktHMWxjM05oWjJVcExuUnlkWFJvZVM1aGMzTmxjblFvWTI5dVpDd2dZWE56TG05cktUdGNiaUFnY21WMGRYSnVJR052Ym1RN1hHNTlPMXh1WEc1aGMzTXVhMjhnUFNCbWRXNWpkR2x2YmlBb1kyOXVaQ3dnYldWemMyRm5aU2tnZTF4dUlDQnBaaUFvWVhKbmRXMWxiblJ6TG14bGJtZDBhQ0E5UFQwZ01Ta2dlMXh1SUNBZ0lHMWxjM05oWjJVZ1BTQW5aWGh3WldOMFpXUWdZU0JtWVd4emVTQjJZV3gxWlNjN1hHNGdJSDFjYmlBZ1lYTnpMbVJsYzJNb2JXVnpjMkZuWlNrdVptRnNjM2t1WVhOelpYSjBLR052Ym1Rc0lHRnpjeTVyYnlrN1hHNGdJSEpsZEhWeWJpQmpiMjVrTzF4dWZUdGNibHh1THk4Z1VtVnpaWFJ6SUc5eUlIWmxjbWxtYVdWeklIUm9aU0J1ZFcxaVpYSWdiMllnYldGeWEzTWdjMjhnWm1GeVhHNHZMeUJHYjNKalpXUWdZWEpwZEhrdE1DQjBieUJpWlNCamIyMXdZWFJwWW14bElIZHBkR2c2SUdKbFptOXlaVVZoWTJnb1lYTnpMbTFoY210ektWeHVZWE56TG0xaGNtdHpJRDBnWm5WdVkzUnBiMjRnS0M4cUlHVjRjR1ZqZEdWa0xDQmtaWE5qSUNvdktTQjdYRzRnSUhaaGNpQmxlSEJsWTNSbFpDQTlJR0Z5WjNWdFpXNTBjMXN3WFR0Y2JpQWdkbUZ5SUdSbGMyTWdQU0JoY21kMWJXVnVkSE5iTVYwN1hHNGdJR2xtSUNoMGVYQmxiMllnWlhod1pXTjBaV1FnUFQwOUlDZDFibVJsWm1sdVpXUW5LU0I3WEc0Z0lDQWdaWGh3WldOMFpXUWdQU0JoYzNNdWJXRnlhM011WTI5MWJuUmxjanRjYmlBZ0lDQmhjM011YldGeWEzTXVZMjkxYm5SbGNpQTlJREE3WEc0Z0lDQWdjbVYwZFhKdUlHVjRjR1ZqZEdWa095QWdMeThnY21WMGRYSnVJR0poWTJzZ2FHOTNJRzFoYm5rZ2RHaGxjbVVnZDJWeVpWeHVJQ0I5WEc1Y2JpQWdZWE56TG1SbGMyTW9aR1Z6WXlCOGZDQW5ZWE56TG0xaGNtdHpKeWt1WlhFb1pYaHdaV04wWldRcFhHNGdJQzVoYzNObGNuUW9ZWE56TG0xaGNtdHpMbU52ZFc1MFpYSXNJR0Z6Y3k1dFlYSnJjeWs3WEc1OU8xeHVZWE56TG0xaGNtdHpMbU52ZFc1MFpYSWdQU0F3TzF4dVhHNWNiaTh2SUVobGJIQmxjaUIwYnlCeVpXZHBjM1JsY2lCdVpYY2diV0YwWTJobGNuTWdhVzRnZEdobElISmxaMmx6ZEhKNVhHNWhjM011Y21WbmFYTjBaWElnUFNCbWRXNWpkR2x2YmlBb2JtRnRaU3dnYldGMFkyaGxjaWtnZTF4dUlDQnBaaUFvYm1GdFpTQnBibk4wWVc1alpXOW1JRTFoZEdOb1pYSXBJSHRjYmlBZ0lDQnRZWFJqYUdWeUlEMGdibUZ0WlR0Y2JpQWdJQ0J1WVcxbElEMGdiV0YwWTJobGNpNXVZVzFsTzF4dUlDQjlJR1ZzYzJVZ2FXWWdLSFI1Y0dWdlppQnVZVzFsSUQwOVBTQW5iMkpxWldOMEp5a2dlMXh1SUNBZ0lFOWlhbVZqZEM1clpYbHpLRzVoYldVcExtWnZja1ZoWTJnb1puVnVZM1JwYjI0Z0tHdGxlU2tnZTF4dUlDQWdJQ0FnWVhOekxuSmxaMmx6ZEdWeUtHdGxlU3dnYm1GdFpWdHJaWGxkS1R0Y2JpQWdJQ0I5S1R0Y2JpQWdJQ0J5WlhSMWNtNDdYRzRnSUgwZ1pXeHpaU0I3SUNBdkx5QkJjM04xYldVZ1lTQmtaWE5qY21sd2RHOXlJSGRoY3lCbmFYWmxibHh1SUNBZ0lDOHZJRU55WldGMFpTQjBhR1VnWVd4cFlYTmxjeUJtYVhKemRGeHVJQ0FnSUY4dVptOXlSV0ZqYUNodFlYUmphR1Z5TG1Gc2FXRnpaWE1zSUdaMWJtTjBhVzl1SUNoaGJHbGhjeWtnZTF4dUlDQWdJQ0FnWVhOekxuSmxaMmx6ZEdWeUtHNWxkeUJOWVhSamFHVnlLR0ZzYVdGekxDQnRZWFJqYUdWeUtTazdYRzRnSUNBZ2ZTazdYRzVjYmlBZ0lDQnRZWFJqYUdWeUlEMGdibVYzSUUxaGRHTm9aWElvYm1GdFpTd2diV0YwWTJobGNpazdYRzRnSUgxY2JseHVJQ0F2THlCTFpXVndJSFJvWlNCdFlYUmphR1Z5SUdGeWIzVnVaQ0JtYjNJZ1lYTnpMbWhsYkhCY2JpQWdZWE56TG0xaGRHTm9aWEp6TG5CMWMyZ29iV0YwWTJobGNpazdYRzVjYmx4dUlDQXZMeUJVVDBSUE9pQkJiR3h2ZHlCdFlYUmphR1Z5Y3lCMGJ5QmlaU0J2ZG1WeWNtbGtaR1Z1SUdGdVpDQmhiSE52SUc5MlpYSnNiMkZrWldSY2JpQWdMeThnSUNBZ0lDQWdhV1lnZEdobGVTQm9ZWFpsSUdGdUlGd2liM1psY214dllXUmNJaUJ0WlhSb2IyUWdhWFFnWTJGdUlHSmxJSFZ6WldSY2JpQWdMeThnSUNBZ0lDQWdkRzhnWTJobFkyc2dkMmhwWTJnZ2IyNWxJSE5vYjNWc1pDQmlaU0IxYzJWa0xseHVJQ0F2THlBZ0lDQWdJQ0JDWlhSMFpYSWdTV1JsWVNBb1NTQjBhR2x1YXlrc0lHbHVjM1JsWVdRZ2IyWWdiM1psY214dllXUnBibWNnWW1GelpXUmNiaUFnTHk4Z0lDQWdJQ0FnYjI0Z2RHaGxJSFpoYkhWbElIVnVaR1Z5SUhSbGMzUXNJSGRvYVdOb0lHMWhlU0J3Y205a2RXTmxJR2x6YzNWbGMxeHVJQ0F2THlBZ0lDQWdJQ0J6YVc1alpTQjNaU0JrYjI0bmRDQnJibTkzSUdadmNpQnpkWEpsSUhkb1lYUWdkR2hoZENCMllXeDFaU0JwY3l4Y2JpQWdMeThnSUNBZ0lDQWdZV3hzYjNjZ2JXRjBZMmhsY25NZ2RHOGdhVzUwY205a2RXTmxJR0VnYm1WM0lGd2ljSEp2ZEc5MGVYQmxYQ0lnWm05eVhHNGdJQzh2SUNBZ0lDQWdJSFJvWlNCamFHRnBiaXdnZEdoaGRDQnBjeXdnWVNBdVpHOXRJRzFoZEdOb1pYSWdkMmxzYkNCcGJtTnNkV1JsWEc0Z0lDOHZJQ0FnSUNBZ0lHRnNiQ0IwYUdVZ1kyOXlaU0JsZUhCbFkzUmhkR2x2Ym5NZ1luVjBJSFJvWlc0Z1lXeHpieUJ2ZG1WeWNtbGtaWE5jYmlBZ0x5OGdJQ0FnSUNBZ1lXNWtJRzVsZHlCdmJtVnpJSFZ1ZEdsc0lIUm9aU0JsYm1RZ2IyWWdkR2hsSUdOb1lXbHVMbHh1WEc1Y2JpQWdMeThnVFdGMFkyaGxjaUJtZFc1amRHbHZibk1nZDJsMGFDQmhJSE5wYm1kc1pTQmhjbWQxYldWdWRDQmhjbVVnWjJWMGRHVnljMXh1SUNCMllYSWdabTVMWlhrZ1BTQnRZWFJqYUdWeUxtRnlhWFI1SUQwOVBTQXhJRDhnSjJkbGRDY2dPaUFuZG1Gc2RXVW5PMXh1SUNCMllYSWdjSEp2Y0NBOUlIdGNiaUFnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUdWdWRXMWxjbUZpYkdVNklIUnlkV1ZjYmlBZ2ZUdGNiaUFnYVdZZ0tHWnVTMlY1SUQwOVBTQW5kbUZzZFdVbktTQjdYRzRnSUNBZ2NISnZjQzUzY21sMFlXSnNaU0E5SUdaaGJITmxPMXh1SUNCOVhHNWNiaUFnTHk4Z1FYVm5iV1Z1ZENCMGFHVWdRMmhoYVc0Z2NISnZkRzkwZVhCbFhHNGdJSEJ5YjNCYlptNUxaWGxkSUQwZ1puVnVZM1JwYjI0Z1ptNGdLQ2tnZTF4dUlDQWdJSFpoY2lCbGVIQWdQU0J1WlhjZ1JYaHdaV04wWVhScGIyNG9iV0YwWTJobGNpd2dZWEpuZFcxbGJuUnpLVHRjYmlBZ0lDQjBhR2x6TGw5ZlpYaHdaV04wWVhScGIyNXpYMTh1Y0hWemFDaGxlSEFwTzF4dUlDQWdJR2xtSUNnaGRHaHBjeTVmWDJSbFptVnljbVZrWDE4cElIdGNiaUFnSUNBZ0lIUm9hWE11WVhOelpYSjBLSFJvYVhNdWRtRnNkV1VzSUdadUtUdGNiaUFnSUNCOVhHNGdJQ0FnY21WMGRYSnVJSFJvYVhNN1hHNGdJSDA3WEc1Y2JpQWdaR1ZtVUhKdmNDaERhR0ZwYmk1d2NtOTBiM1I1Y0dVc0lHNWhiV1VzSUhCeWIzQXBPMXh1WEc0Z0lDOHZJRUYxWjIxbGJuUWdkR2hsSUhOMFlYUnBZeUJwYm5SbGNtWmhZMlZjYmlBZ2NISnZjRnRtYmt0bGVWMGdQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnZG1GeUlHTm9ZV2x1SUQwZ2JtVjNJRU5vWVdsdUtDazdYRzVjYmlBZ0lDQnBaaUFvWm01TFpYa2dQVDA5SUNkblpYUW5LU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZMmhoYVc1YmJtRnRaVjA3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjbVYwZFhKdUlHTm9ZV2x1VzI1aGJXVmRMbUZ3Y0d4NUtHTm9ZV2x1TENCaGNtZDFiV1Z1ZEhNcE8xeHVJQ0I5TzF4dVhHNGdJR1JsWmxCeWIzQW9ZWE56TENCdVlXMWxMQ0J3Y205d0tUdGNibHh1SUNBdkx5QlFZWE56SUhSb2NtOTFaMmdnWm05eUlHTm9ZV2x1YzF4dUlDQndjbTl3VzJadVMyVjVYU0E5SUdaMWJtTjBhVzl1SUhCaGMzTjBhSEp2ZFdkb0tDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpXMjVoYldWZExtRnpjMlZ5ZENoMGFHbHpMblpoYkhWbExDQndZWE56ZEdoeWIzVm5hQ2t1ZG1Gc2RXVlBaaWdwTzF4dUlDQjlPMXh1SUNCd2NtOXdMbVZ1ZFcxbGNtRmliR1VnUFNCbVlXeHpaVHRjYmlBZ1pHVm1VSEp2Y0NoRGFHRnBiaTV3Y205MGIzUjVjR1VzSUNja0p5QXJJRzVoYldVc0lIQnliM0FwTzF4dVhHNGdJQzh2SUZCaGMzTWdkR2h5YjNWbmFDQnpkR0YwYVdNZ1kyOXVjM1J5ZFdOMGIzSmNiaUFnWkdWbVVISnZjQ2hoYzNNc0lDY2tKeUFySUc1aGJXVXNJSHRjYmlBZ0lDQjJZV3gxWlRvZ1puVnVZM1JwYjI0Z0tIWmhiSFZsS1NCN1hHNGdJQ0FnSUNCcFppQW9abTVMWlhrZ1BUMDlJQ2RuWlhRbktTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmhjM01vZG1Gc2RXVXBXeWNrSnlBcklHNWhiV1ZkTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBdkx5QkRjbVZoZEdVZ1lTQnVaWGNnWlhod2NtVnpjMmx2YmlCbWIzSWdkR2hsSUdWNGNHVmpkR0YwYVc5dVhHNGdJQ0FnSUNCMllYSWdZMmhoYVc0Z1BTQnVaWGNnUTJoaGFXNG9LVHRjYmlBZ0lDQWdJR05vWVdsdVcyNWhiV1ZkTG1Gd2NHeDVLR05vWVdsdUxDQmhjbWQxYldWdWRITXBPMXh1SUNBZ0lDQWdMeThnVW1WMGRYSnVJR0VnWTJGc2JHRmliR1VnZEdoaGRDQmhjM05sY25SeklIVndiMjRnY21WalpXbDJhVzVuSUdFZ2RtRnNkV1ZjYmlBZ0lDQWdJSEpsZEhWeWJpQmphR0ZwYmk1MGFISnZkV2RvTzF4dUlDQWdJSDBzWEc0Z0lDQWdaVzUxYldWeVlXSnNaVG9nWm1Gc2MyVmNiaUFnZlNrN1hHNWNibjA3WEc1Y2JseHViVzlrZFd4bExtVjRjRzl5ZEhNZ1BTQmhjM003WEc0aVhYMD0iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxudmFyIHJlc29sdmVycyA9IHJlcXVpcmUoJy4vcmVzb2x2ZXJzJyk7XG52YXIgQXNzRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIFByb21pc2UgPSB1dGlsLlByb21pc2U7XG5cbnZhciBkZWZQcm9wID0gdXRpbC5iaW5kKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgT2JqZWN0KTtcblxuLy8gQW4gZXhwZWN0YXRpb25zIGNoYWluIChha2EgZXhwcmVzc2lvbiksIHRoZSBjb3JlIG9iamVjdCBvZiB0aGUgbGlicmFyeSxcbi8vIGFsbG93cyB0byBzZXR1cCBhIHNldCBvZiBleHBlY3RhdGlvbnMgdG8gYmUgcnVuIGF0IGFueSBwb2ludCBhZ2FpbnN0IGFcbi8vIHZhbHVlLlxuZnVuY3Rpb24gQ2hhaW4gKHZhbHVlKSB7XG4gIGlmICghQ2hhaW4uaXNDaGFpbih0aGlzKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQXNzIENoYWluIGNvbnN0cnVjdG9yIGNhbGxlZCB3aXRob3V0IG5ldyEnKTtcbiAgfVxuXG4gIC8vIFRPRE86IE9uIG5vbiBpbml0aWFsaXplZCBjaGFpbnMgd2UgY2FuJ3QgZG8gLnZhbHVlLCBpdCBzaG91bGRcbiAgLy8gICAgICAgYmUgYSBleHBlY3RhdGlvbiB0aGF0IGdldHMgdGhlIGluaXRpYWwgdmFsdWUgZ2l2ZW4gd2hlblxuICAvLyAgICAgICByZXNvbHZpbmcgKHNvLCBpdCBzaG91bGQgYmUgc3RvcmVkIG9uIHRoZSByZXNvbHZlcilcbiAgdGhpcy52YWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAwID8gdmFsdWUgOiB0aGlzLl9fR1VBUkRfXztcblxuICAvLyBDdXN0b20gZGVzY3JpcHRpb25cbiAgZGVmUHJvcCh0aGlzLCAnX19kZXNjcmlwdGlvbl9fJywge1xuICAgIHZhbHVlOiAnJyxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiB0cnVlXG4gIH0pO1xuXG4gIC8vIExpc3Qgb2YgWyBFeHBlY3RhdGlvbiBdXG4gIGRlZlByb3AodGhpcywgJ19fZXhwZWN0YXRpb25zX18nLCB7XG4gICAgdmFsdWU6IFtdLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pO1xuXG4gIC8vIFdoZW4gdHJ1ZSB0aGUgZXhwcmVzc2lvbiBpcyBjb25zaWRlcmVkIGRlZmVycmVkIGFuZCB3b24ndFxuICAvLyB0cnkgdG8gaW1tZWRpYXRlbHkgZXZhbHVhdGUgYW55IG5ld2x5IGNoYWluZWQgZXhwZWN0YXRpb24uXG4gIGRlZlByb3AodGhpcywgJ19fZGVmZXJyZWRfXycsIHtcbiAgICB2YWx1ZTogdGhpcy52YWx1ZSA9PT0gdGhpcy5fX0dVQVJEX18sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBIb2xkcyB0aGUgbGlzdCBvZiBwcm9taXNlIGNhbGxiYWNrcyBhdHRhY2hlZCB0byB0aGUgZXhwcmVzc2lvblxuICBkZWZQcm9wKHRoaXMsICdfX3RoZW5zX18nLCB7XG4gICAgdmFsdWU6IFtdLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pO1xuXG4gIC8vIFNlYWwgdGhlIGNvbnRleHQgdG8gdGhlIG1ldGhvZHMgc28gd2UgY2FuIGNhbGwgdGhlbSBhcyBwbGFpbiBmdW5jdGlvbnNcbiAgdGhpcy50ZXN0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS50ZXN0LCB0aGlzKTtcbiAgdGhpcy5hc3NlcnQgPSB1dGlsLmJpbmQoQ2hhaW4ucHJvdG90eXBlLmFzc2VydCwgdGhpcyk7XG4gIHRoaXMucmVzdWx0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS5yZXN1bHQsIHRoaXMpO1xuICB0aGlzLnRocm91Z2ggPSB1dGlsLmJpbmQoQ2hhaW4ucHJvdG90eXBlLnRocm91Z2gsIHRoaXMpO1xuICB0aGlzLiQgPSB0aGlzLnRocm91Z2g7XG59XG5cbkNoYWluLmlzQ2hhaW4gPSBmdW5jdGlvbiAob2JqKSB7XG4gIC8vIFRoaXMgbG9va3MgY29udHJpdmVkIGJ1dCBpbnN0YW5jZW9mIGlzIGtpbmQgb2Ygc2xvdy1pc2hcbiAgcmV0dXJuIG9iaiAmJiBvYmouY29uc3RydWN0b3IgPT09IENoYWluO1xufTtcblxuXG52YXIgcHJvdG8gPSBDaGFpbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xucHJvdG8uY29uc3RydWN0b3IgPSBDaGFpbjtcblxuLy8gR3VhcmQgdG9rZW4gdG8gZGV0ZWN0IHZhbHVlbGVzcyBtYXRjaGVyc1xucHJvdG8uX19HVUFSRF9fID0ge1xuICB2YWx1ZU9mOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgfSxcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ3t7dmFsdWVsZXNzfX0nO1xuICB9XG59O1xuXG4vLyBTdXBwb3J0cyB0aGUgdXNhZ2U6IGFzcy5zdHJpbmcuaGVscFxuZGVmUHJvcChwcm90bywgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIC8vIFRPRE86IFByb2R1Y3RpemUgdGhpcyBhbmQgcGVyaGFwcyBzaG93IGhlbHAgZm9yIHRoZSB3aG9sZSBjaGFpblxuICAgIHZhciB0YWlsID0gXy50YWlsKHRoaXMuX19leHBlY3RhdGlvbnNfXyk7XG4gICAgcmV0dXJuIHRhaWwgPyB0YWlsLmhlbHAgOiAnTi9BJztcbiAgfVxufSk7XG5cbi8vIFN1cHBvcnQgdXNlIGNhc2U6IGFzcyh2YWx1ZSkuXy5zb21lLm51bWJlci5hYm92ZSg1KS5fXG5kZWZQcm9wKHByb3RvLCAnXycsIHtcbiAgZ2V0OiBmdW5jdGlvbiBmbigpIHtcbiAgICBpZiAoIXRoaXMuX19kZWZlcnJlZF9fKSB7XG4gICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19kZWZlcnJlZF9fID0gZmFsc2U7XG4gICAgICB0aGlzLmFzc2VydCh0aGlzLnZhbHVlLCBmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG59KTtcblxuXG4vLyBFeHBvc2VzIGEgUHJvbWlzZS9BIGludGVyZmFjZSBmb3IgdGhlIGV4cHJlc3Npb24sIHRoZSBpbnRlbmRlZCB1c2UgaXMgZm9yXG4vLyBvYnRhaW5pbmcgdGhlIHJlc3VsdCBmb3IgYXN5bmNocm9ub3VzIGV4cHJlc3Npb25zLlxuLy8gSGVyZSB0aG91Z2ggd2UganVzdCBjb2xsZWN0IHRoZSBjYWxsYmFja3MsIHRoZSBhY3R1YWwgcHJvbWlzZSByZXNvbHV0aW9uXG4vLyBpcyBkb25lIGluIHRoZSByZXNvbHZlciB3aGVuIGl0IHJlYWNoZXMgYSByZXN1bHQuXG5wcm90by50aGVuID0gZnVuY3Rpb24gKGNiLCBlYikge1xuICAvLyBSZWdpc3RlciB0aGUgY2FsbGJhY2tzIHRvIGJlIHVzZWQgd2hlbiByZXNvbHZlZFxuICB0aGlzLl9fdGhlbnNfXy5wdXNoKFtjYiwgZWJdKTtcblxuICAvLyBXaGVuIHRoZSBleHByZXNzaW9uIGlzIG5vbiBkZWZlcnJlZCBhbmQgd2UgaGF2ZSBhIHZhbHVlIHdlIGZvcmNlIHRoZVxuICAvLyByZXNvbHZlciB0byBydW4gaW4gb3JkZXIgdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSBhdCBsZWFzdCBvbmNlLlxuICAvLyBUaGlzIGlzIHByaW1hcmlseSB0byBzdXBwb3J0IHRoZSB0ZXN0IHJ1bm5lcnMgdXNlIGNhc2Ugd2hlcmUgYW4gZXhwcmVzc2lvblxuICAvLyBpcyByZXR1cm5lZCBmcm9tIHRoZSB0ZXN0IGFuZCB0aGUgcnVubmVyIHdpbGwgYXR0YWNoIGl0c2VsZiBoZXJlLlxuICBpZiAoIXRoaXMuX19kZWZlcnJlZF9fICYmIHRoaXMudmFsdWUgIT09IHRoaXMuX19HVUFSRF9fKSB7XG4gICAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gICAgcmVzb2x2ZXIodGhpcy52YWx1ZSk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmNhdGNoID0gZnVuY3Rpb24gKGViKSB7XG4gIHJldHVybiB0aGlzLnRoZW4obnVsbCwgZWIpO1xufTtcblxuLy8gRGlzcGF0Y2ggZXZlcnlvbmUgd2hvIHdhcyB3YWl0aW5nIHRvIGJlIG5vdGlmaWVkIG9mIHRoZSBvdXRjb21lXG5wcm90by5kaXNwYXRjaFJlc3VsdCA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgcmVzdWx0KSB7XG4gIGlmICgwID09PSB0aGlzLl9fdGhlbnNfXy5sZW5ndGgpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBHZW5lcmF0ZSBhIG5pY2UgZXJyb3IgZm9yIHRoZSBmYWlsdXJlXG4gIHZhciBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgIGFjdHVhbCA9IHRoaXMuYnVpbGRFcnJvcihyZXNvbHZlZCwgcHJvdG8uZGlzcGF0Y2hSZXN1bHQpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgaW1tZWRpYXRlbHkgd2l0aCBhIGZhaWx1cmUgZXJyb3Igb3JcbiAgLy8gcmVzb2x2ZXMgd2l0aCB0aGUgZXhwcmVzc2lvbiBzdWJqZWN0LlxuICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAvLyBDYWxsaW5nIHJlc29sdmUoKSB3aXRoIGEgcHJvbWlzZSB3aWxsIGF0dGFjaCBpdHNlbGYgdG8gdGhlIHByb21pc2VcbiAgICAvLyBpbnN0ZWFkIG9mIHBhc3NpbmcgaXQgYXMgYSBzaW1wbGUgdmFsdWUuIFRvIGF2b2lkIHRoYXQgd2UgZGV0ZWN0IHRoZVxuICAgIC8vIGNhc2UgYW5kIHdyYXAgaXQgaW4gYW4gYXJyYXkuXG4gICAgaWYgKGFjdHVhbCAmJiB0eXBlb2YgYWN0dWFsLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGFjdHVhbCA9IFtcbiAgICAgICAgJ0FzczogVmFsdWUgd3JhcHBlZCBpbiBhbiBhcnJheSBzaW5jZSBpdCBsb29rcyBsaWtlIGEgUHJvbWlzZScsXG4gICAgICAgIGFjdHVhbFxuICAgICAgXTtcbiAgICB9XG5cbiAgICAocmVzdWx0ID8gcmVzb2x2ZSA6IHJlamVjdCkoIGFjdHVhbCApO1xuICB9KTtcblxuICAvLyBBdHRhY2ggYWxsIHRoZSByZWdpc3RlcmVkIHRoZW5zIHRvIHRoZSBwcm9taXNlIHNvIHRoZXkgZ2V0IG5vdGlmaWVkXG4gIF8uZm9yRWFjaCh0aGlzLl9fdGhlbnNfXywgZnVuY3Rpb24gKGNhbGxiYWNrcykge1xuICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4uYXBwbHkocHJvbWlzZSwgY2FsbGJhY2tzKTtcbiAgfSk7XG59O1xuXG5mdW5jdGlvbiBkdW1wQ2hhaW4gKHJlc29sdmVkLCBpbmRlbnQpIHtcbiAgdmFyIHJlc3VsdCA9ICcnO1xuXG4gIGluZGVudCA9IGluZGVudCB8fCAnJztcblxuICByZXNvbHZlZC5mb3JFYWNoKGZ1bmN0aW9uIChleHAsIGlkeCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV4cCkpIHtcbiAgICAgIHJlc3VsdCArPSBkdW1wQ2hhaW4oZXhwLCBpbmRlbnQgKyAnICAnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZXhwLnJlc3VsdCkge1xuICAgICAgcmVzdWx0ICs9IGluZGVudCArICcgXFx1MDAxYlszMm1QYXNzZWQ6XFx1MDAxYlswbSAnICsgZXhwLmRlc2NyaXB0aW9uICsgJ1xcbic7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVzdWx0ICs9IGluZGVudCArICcgXFx1MDAxYlszMW1GYWlsZWQ6XFx1MDAxYlswbSAnICsgZXhwLmRlc2NyaXB0aW9uICsgJ1xcbic7XG4gICAgaWYgKGlkeCA9PT0gcmVzb2x2ZWQubGVuZ3RoIC0gMSkge1xuICAgICAgcmVzdWx0ICs9IGluZGVudCArICcgICAgXFx1MDAxYlszM21CdXQ6XFx1MDAxYlswbSAnICsgZXhwLmZhaWx1cmUgKyAnXFxuJztcbiAgICB9XG5cbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG4vLyBCdWlsZHMgYW4gQXNzRXJyb3IgZm9yIHRoZSBjdXJyZW50IGV4cHJlc3Npb24uIEl0IG1ha2VzIGEgY291cGxlIG9mXG4vLyBhc3N1bXB0aW9ucywgZm9yIGluc3RhbmNlIHRoZSAuX19vZmZzZXRfXyBtdXN0IGJlIHBsYWNlZCBqdXN0IGFmdGVyIHRoZVxuLy8gZXhwZWN0YXRpb24gdGhhdCBwcm9kdWNlZCB0aGUgZmFpbHVyZSBvZiB0aGUgY2hhaW4uXG5wcm90by5idWlsZEVycm9yID0gZnVuY3Rpb24gKHJlc29sdmVkLCBzc2YpIHtcblxuICB2YXIgZXJyb3IgPSB0aGlzLl9fZGVzY3JpcHRpb25fXyArICdcXG5cXG4nO1xuXG4gIGV4cCA9IHJlc29sdmVkWyByZXNvbHZlZC5sZW5ndGggLSAxIF07XG4gIGVycm9yICs9IGR1bXBDaGFpbihyZXNvbHZlZCk7XG5cbiAgaWYgKCF1dGlsLmRvQ29sb3JzKCkpIHtcbiAgICBlcnJvciA9IHV0aWwudW5hbnNpKGVycm9yKTtcbiAgfVxuXG4gIC8vIFRPRE86IHNob3dEaWZmIHNob3VsZCBiZSB1c2VkIG9ubHkgd2hlbiBpdCBtYWtlcyBzZW5zZSBwZXJoYXBzXG4gIC8vICAgICAgIHdlIGNhbiBwYXNzIG51bGwvdW5kZWZpbmVkIGFuZCBsZXQgQXNzRXJyb3IgZGV0ZWN0IHdoZW4gaXRcbiAgLy8gICAgICAgbWFrZXMgc2Vuc2UuXG5cbiAgdmFyIGV4cGVjdGVkID0gZXhwLmV4cGVjdGVkO1xuICAvLyBNb2NoYSB3aWxsIHRyeSB0byBqc29uaWZ5IHRoZSBleHBlY3RlZCB2YWx1ZSwganVzdCBpZ25vcmUgaWYgaXQncyBhIGZ1bmN0aW9uXG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB2YXIgaW5zdCA9IG5ldyBBc3NFcnJvcihlcnJvciwgc3NmIHx8IGFyZ3VtZW50cy5jYWxsZWUgfHwgcHJvdG8uYnVpbGRFcnJvcik7XG4gIGluc3Quc2hvd0RpZmYgPSBmYWxzZTtcbiAgaW5zdC5hY3R1YWwgPSBudWxsO1xuICBpbnN0LmV4cGVjdGVkID0gbnVsbDtcbiAgcmV0dXJuIGluc3Q7XG59O1xuXG4vLyBSZXNvbHZlcyB0aGUgY3VycmVudCBjaGFpbiBmb3IgYSBnaXZlbiB2YWx1ZS4gVGhlIHJlc3VsdCBpcyBhbHdheXMgYVxuLy8gYm9vbGVhbiBpbmRpY2F0aW5nIHRoZSBvdXRjb21lIG9yIGFuIHVuZGVmaW5lZCB0byBzaWduYWwgdGhhdCBpdCByZWFjaGVkXG4vLyBhbiBhc3luY2hyb25vdXMgZmxvdy5cbnByb3RvLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgfVxuXG4gIC8vIFJlc29sdmUgdGhlIGNoYWluIHN0YXJ0aW5nIGZyb20gcm9vdFxuICB2YXIgcmVzb2x2ZXIgPSByZXNvbHZlcnMuYWNxdWlyZSh0aGlzKTtcbiAgdmFyIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8vIFBlcmZvcm1zIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBjaGFpbiBidXQgYWRkaXRpb25hbGx5IHdpbGwgcmFpc2UgYW4gZXJyb3Jcbi8vIGlmIGl0IGZhaWxzIHRvIGNvbXBsZXRlLiBXaGVuIHRoZSBleHByZXNzaW9uIHJlc29sdmVzIGFzIHVuZGVmaW5lZCAoYXN5bmMpXG4vLyBpdCdsbCBiZSBhdXRvbWF0aWNhbGx5IGVuYWJsZSBpdHMgZGVmZXJyZWQgZmxhZy5cbi8vIFRoZSBgc3NmYCBzdGFuZHMgZm9yIFN0YWNrVHJhY2VGdW5jdGlvbiwgYSByZWZlcmVuY2UgdG8gdGhlIGZpcnN0IGZ1bmN0aW9uXG4vLyB0byBzaG93IG9uIHRoZSBzdGFjayB0cmFjZS5cbnByb3RvLmFzc2VydCA9IGZ1bmN0aW9uIChhY3R1YWwsIHNzZikge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBKdXN0IGlnbm9yZSBpZiB0aGUgYWN0dWFsIHZhbHVlIGlzIG5vdCBwcmVzZW50IHlldFxuICAvLyBUT0RPOiBTaGFsbCBpdCBwcm9kdWNlIGFuIGVycm9yP1xuICBpZiAoYWN0dWFsID09PSB0aGlzLl9fR1VBUkRfXykgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIC8vIEl0IGZhaWxlZCBzbyByZXBvcnQgaXQgd2l0aCBhIG5pY2UgZXJyb3JcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICB0aHJvdyB0aGlzLmJ1aWxkRXJyb3IocmVzb2x2ZXIucmVzb2x2ZWQsIHNzZiB8fCB0aGlzLmFzc2VydCk7XG4gIH1cblxuICAvLyBDb252ZXJ0IHRoZSBleHByZXNzaW9uIGludG8gYSBkZWZlcnJlZCBpZiBhbiBhc3luYyBleHBlY3Rpb24gd2FzIGZvdW5kXG4gIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX19kZWZlcnJlZF9fID0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gQXNzZXJ0cyB0aGUgcHJvdmlkZWQgdmFsdWUgYW5kIGlmIHN1Y2Nlc3NmdWwgcmV0dXJucyB0aGUgb3JpZ2luYWxcbi8vIHZhbHVlIGluc3RlYWQgb2YgdGhlIGNoYWluIGluc3RhbmNlLlxucHJvdG8udGhyb3VnaCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgdGhpcy5hc3NlcnQoYWN0dWFsLCBwcm90by50aHJvdWdoKTtcbiAgcmV0dXJuIGFjdHVhbDtcbn07XG5cbi8vIEV2YWx1YXRlcyB0aGUgZXhwcmVzc2lvbiBjaGFpbiByZXBvcnRpbmcgdGhlIGxhc3QgbXV0YXRlZCB2YWx1ZSBzZWVuIGluXG4vLyBpdC4gSWYgdGhlIGV4cHJlc3Npb24gZG9lcyBub3QgY29tcGxldGUgaXQnbGwgcmV0dXJuIHVuZGVmaW5lZC5cbnByb3RvLnJlc3VsdCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgdmFyIHJlc3VsdDtcblxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICB0cnkge1xuICAgIHRoaXMudGFwKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgfSkudGVzdChhY3R1YWwpO1xuICB9IGZpbmFsbHkge1xuICAgIC8vIFJlbW92ZSB0aGUgLnRhcCBmcm9tIHRoZSBjaGFpblxuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfXy5wb3AoKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5DaGFpbi5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudmFsdWU7XG59O1xuXG5DaGFpbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLl9fZGVzY3JpcHRpb25fXykge1xuICAgIHJldHVybiB0aGlzLl9fZGVzY3JpcHRpb25fXztcbiAgfVxuXG4gIHZhciBkZXNjcyA9XG4gICAgdGhpcy5fX2V4cGVjdGF0aW9uc19fXG4gICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5kZXNjcmlwdGlvbjsgfSlcbiAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmRlc2NyaXB0aW9uOyB9KTtcblxuICBpZiAoZGVzY3MubGVuZ3RoID4gMSkge1xuICAgIHJldHVybiAnKCcgKyBkZXNjcy5qb2luKCcsICcpICsgJyknO1xuICB9IGVsc2UgaWYgKGRlc2NzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBkZXNjc1swXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJzxBc3NDaGFpbj4nO1xuICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhaW47XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOWphR0ZwYmk1cWN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU8wRkJRVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVNJc0ltWnBiR1VpT2lKblpXNWxjbUYwWldRdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lkbUZ5SUY4Z1BTQW9kSGx3Wlc5bUlIZHBibVJ2ZHlBaFBUMGdYQ0oxYm1SbFptbHVaV1JjSWlBL0lIZHBibVJ2ZDFzblh5ZGRJRG9nZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JR2RzYjJKaGJGc25YeWRkSURvZ2JuVnNiQ2s3WEc1Y2JuWmhjaUJ5WlhOdmJIWmxjbk1nUFNCeVpYRjFhWEpsS0NjdUwzSmxjMjlzZG1WeWN5Y3BPMXh1ZG1GeUlFRnpjMFZ5Y205eUlEMGdjbVZ4ZFdseVpTZ25MaTlsY25KdmNpY3BPMXh1ZG1GeUlIVjBhV3dnUFNCeVpYRjFhWEpsS0NjdUwzVjBhV3duS1R0Y2JuWmhjaUJRY205dGFYTmxJRDBnZFhScGJDNVFjbTl0YVhObE8xeHVYRzUyWVhJZ1pHVm1VSEp2Y0NBOUlIVjBhV3d1WW1sdVpDaFBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtzSUU5aWFtVmpkQ2s3WEc1Y2JpOHZJRUZ1SUdWNGNHVmpkR0YwYVc5dWN5QmphR0ZwYmlBb1lXdGhJR1Y0Y0hKbGMzTnBiMjRwTENCMGFHVWdZMjl5WlNCdlltcGxZM1FnYjJZZ2RHaGxJR3hwWW5KaGNua3NYRzR2THlCaGJHeHZkM01nZEc4Z2MyVjBkWEFnWVNCelpYUWdiMllnWlhod1pXTjBZWFJwYjI1eklIUnZJR0psSUhKMWJpQmhkQ0JoYm5rZ2NHOXBiblFnWVdkaGFXNXpkQ0JoWEc0dkx5QjJZV3gxWlM1Y2JtWjFibU4wYVc5dUlFTm9ZV2x1SUNoMllXeDFaU2tnZTF4dUlDQnBaaUFvSVVOb1lXbHVMbWx6UTJoaGFXNG9kR2hwY3lrcElIdGNiaUFnSUNCMGFISnZkeUJ1WlhjZ1JYSnliM0lvSjBGemN5QkRhR0ZwYmlCamIyNXpkSEoxWTNSdmNpQmpZV3hzWldRZ2QybDBhRzkxZENCdVpYY2hKeWs3WEc0Z0lIMWNibHh1SUNBdkx5QlVUMFJQT2lCUGJpQnViMjRnYVc1cGRHbGhiR2w2WldRZ1kyaGhhVzV6SUhkbElHTmhiaWQwSUdSdklDNTJZV3gxWlN3Z2FYUWdjMmh2ZFd4a1hHNGdJQzh2SUNBZ0lDQWdJR0psSUdFZ1pYaHdaV04wWVhScGIyNGdkR2hoZENCblpYUnpJSFJvWlNCcGJtbDBhV0ZzSUhaaGJIVmxJR2RwZG1WdUlIZG9aVzVjYmlBZ0x5OGdJQ0FnSUNBZ2NtVnpiMngyYVc1bklDaHpieXdnYVhRZ2MyaHZkV3hrSUdKbElITjBiM0psWkNCdmJpQjBhR1VnY21WemIyeDJaWElwWEc0Z0lIUm9hWE11ZG1Gc2RXVWdQU0JoY21kMWJXVnVkSE11YkdWdVozUm9JRDRnTUNBL0lIWmhiSFZsSURvZ2RHaHBjeTVmWDBkVlFWSkVYMTg3WEc1Y2JpQWdMeThnUTNWemRHOXRJR1JsYzJOeWFYQjBhVzl1WEc0Z0lHUmxabEJ5YjNBb2RHaHBjeXdnSjE5ZlpHVnpZM0pwY0hScGIyNWZYeWNzSUh0Y2JpQWdJQ0IyWVd4MVpUb2dKeWNzWEc0Z0lDQWdaVzUxYldWeVlXSnNaVG9nWm1Gc2MyVXNYRzRnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNCM2NtbDBZV0pzWlRvZ2RISjFaVnh1SUNCOUtUdGNibHh1SUNBdkx5Qk1hWE4wSUc5bUlGc2dSWGh3WldOMFlYUnBiMjRnWFZ4dUlDQmtaV1pRY205d0tIUm9hWE1zSUNkZlgyVjRjR1ZqZEdGMGFXOXVjMTlmSnl3Z2UxeHVJQ0FnSUhaaGJIVmxPaUJiWFN4Y2JpQWdJQ0JsYm5WdFpYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lIZHlhWFJoWW14bE9pQm1ZV3h6WlZ4dUlDQjlLVHRjYmx4dUlDQXZMeUJYYUdWdUlIUnlkV1VnZEdobElHVjRjSEpsYzNOcGIyNGdhWE1nWTI5dWMybGtaWEpsWkNCa1pXWmxjbkpsWkNCaGJtUWdkMjl1SjNSY2JpQWdMeThnZEhKNUlIUnZJR2x0YldWa2FXRjBaV3g1SUdWMllXeDFZWFJsSUdGdWVTQnVaWGRzZVNCamFHRnBibVZrSUdWNGNHVmpkR0YwYVc5dUxseHVJQ0JrWldaUWNtOXdLSFJvYVhNc0lDZGZYMlJsWm1WeWNtVmtYMThuTENCN1hHNGdJQ0FnZG1Gc2RXVTZJSFJvYVhNdWRtRnNkV1VnUFQwOUlIUm9hWE11WDE5SFZVRlNSRjlmTEZ4dUlDQWdJR1Z1ZFcxbGNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nWm1Gc2MyVXNYRzRnSUNBZ2QzSnBkR0ZpYkdVNklIUnlkV1ZjYmlBZ2ZTazdYRzVjYmlBZ0x5OGdTRzlzWkhNZ2RHaGxJR3hwYzNRZ2IyWWdjSEp2YldselpTQmpZV3hzWW1GamEzTWdZWFIwWVdOb1pXUWdkRzhnZEdobElHVjRjSEpsYzNOcGIyNWNiaUFnWkdWbVVISnZjQ2gwYUdsekxDQW5YMTkwYUdWdWMxOWZKeXdnZTF4dUlDQWdJSFpoYkhWbE9pQmJYU3hjYmlBZ0lDQmxiblZ0WlhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUhkeWFYUmhZbXhsT2lCbVlXeHpaVnh1SUNCOUtUdGNibHh1SUNBdkx5QlRaV0ZzSUhSb1pTQmpiMjUwWlhoMElIUnZJSFJvWlNCdFpYUm9iMlJ6SUhOdklIZGxJR05oYmlCallXeHNJSFJvWlcwZ1lYTWdjR3hoYVc0Z1puVnVZM1JwYjI1elhHNGdJSFJvYVhNdWRHVnpkQ0E5SUhWMGFXd3VZbWx1WkNoRGFHRnBiaTV3Y205MGIzUjVjR1V1ZEdWemRDd2dkR2hwY3lrN1hHNGdJSFJvYVhNdVlYTnpaWEowSUQwZ2RYUnBiQzVpYVc1a0tFTm9ZV2x1TG5CeWIzUnZkSGx3WlM1aGMzTmxjblFzSUhSb2FYTXBPMXh1SUNCMGFHbHpMbkpsYzNWc2RDQTlJSFYwYVd3dVltbHVaQ2hEYUdGcGJpNXdjbTkwYjNSNWNHVXVjbVZ6ZFd4MExDQjBhR2x6S1R0Y2JpQWdkR2hwY3k1MGFISnZkV2RvSUQwZ2RYUnBiQzVpYVc1a0tFTm9ZV2x1TG5CeWIzUnZkSGx3WlM1MGFISnZkV2RvTENCMGFHbHpLVHRjYmlBZ2RHaHBjeTRrSUQwZ2RHaHBjeTUwYUhKdmRXZG9PMXh1ZlZ4dVhHNURhR0ZwYmk1cGMwTm9ZV2x1SUQwZ1puVnVZM1JwYjI0Z0tHOWlhaWtnZTF4dUlDQXZMeUJVYUdseklHeHZiMnR6SUdOdmJuUnlhWFpsWkNCaWRYUWdhVzV6ZEdGdVkyVnZaaUJwY3lCcmFXNWtJRzltSUhOc2IzY3RhWE5vWEc0Z0lISmxkSFZ5YmlCdlltb2dKaVlnYjJKcUxtTnZibk4wY25WamRHOXlJRDA5UFNCRGFHRnBianRjYm4wN1hHNWNibHh1ZG1GeUlIQnliM1J2SUQwZ1EyaGhhVzR1Y0hKdmRHOTBlWEJsSUQwZ1QySnFaV04wTG1OeVpXRjBaU2h1ZFd4c0tUdGNibkJ5YjNSdkxtTnZibk4wY25WamRHOXlJRDBnUTJoaGFXNDdYRzVjYmk4dklFZDFZWEprSUhSdmEyVnVJSFJ2SUdSbGRHVmpkQ0IyWVd4MVpXeGxjM01nYldGMFkyaGxjbk5jYm5CeWIzUnZMbDlmUjFWQlVrUmZYeUE5SUh0Y2JpQWdkbUZzZFdWUFpqb2dablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQjBhR2x6TG5SdlUzUnlhVzVuS0NrN1hHNGdJSDBzWEc0Z0lIUnZVM1J5YVc1bk9pQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlDZDdlM1poYkhWbGJHVnpjMzE5Snp0Y2JpQWdmVnh1ZlR0Y2JseHVMeThnVTNWd2NHOXlkSE1nZEdobElIVnpZV2RsT2lCaGMzTXVjM1J5YVc1bkxtaGxiSEJjYm1SbFpsQnliM0FvY0hKdmRHOHNJQ2RvWld4d0p5d2dlMXh1SUNCblpYUTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0F2THlCVVQwUlBPaUJRY205a2RXTjBhWHBsSUhSb2FYTWdZVzVrSUhCbGNtaGhjSE1nYzJodmR5Qm9aV3h3SUdadmNpQjBhR1VnZDJodmJHVWdZMmhoYVc1Y2JpQWdJQ0IyWVhJZ2RHRnBiQ0E5SUY4dWRHRnBiQ2gwYUdsekxsOWZaWGh3WldOMFlYUnBiMjV6WDE4cE8xeHVJQ0FnSUhKbGRIVnliaUIwWVdsc0lEOGdkR0ZwYkM1b1pXeHdJRG9nSjA0dlFTYzdYRzRnSUgxY2JuMHBPMXh1WEc0dkx5QlRkWEJ3YjNKMElIVnpaU0JqWVhObE9pQmhjM01vZG1Gc2RXVXBMbDh1YzI5dFpTNXVkVzFpWlhJdVlXSnZkbVVvTlNrdVgxeHVaR1ZtVUhKdmNDaHdjbTkwYnl3Z0oxOG5MQ0I3WEc0Z0lHZGxkRG9nWm5WdVkzUnBiMjRnWm00b0tTQjdYRzRnSUNBZ2FXWWdLQ0YwYUdsekxsOWZaR1ZtWlhKeVpXUmZYeWtnZTF4dUlDQWdJQ0FnZEdocGN5NWZYMlJsWm1WeWNtVmtYMThnUFNCMGNuVmxPMXh1SUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNCMGFHbHpMbDlmWkdWbVpYSnlaV1JmWHlBOUlHWmhiSE5sTzF4dUlDQWdJQ0FnZEdocGN5NWhjM05sY25Rb2RHaHBjeTUyWVd4MVpTd2dabTRwTzF4dUlDQWdJSDFjYmlBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ2ZWeHVmU2s3WEc1Y2JseHVMeThnUlhod2IzTmxjeUJoSUZCeWIyMXBjMlV2UVNCcGJuUmxjbVpoWTJVZ1ptOXlJSFJvWlNCbGVIQnlaWE56YVc5dUxDQjBhR1VnYVc1MFpXNWtaV1FnZFhObElHbHpJR1p2Y2x4dUx5OGdiMkowWVdsdWFXNW5JSFJvWlNCeVpYTjFiSFFnWm05eUlHRnplVzVqYUhKdmJtOTFjeUJsZUhCeVpYTnphVzl1Y3k1Y2JpOHZJRWhsY21VZ2RHaHZkV2RvSUhkbElHcDFjM1FnWTI5c2JHVmpkQ0IwYUdVZ1kyRnNiR0poWTJ0ekxDQjBhR1VnWVdOMGRXRnNJSEJ5YjIxcGMyVWdjbVZ6YjJ4MWRHbHZibHh1THk4Z2FYTWdaRzl1WlNCcGJpQjBhR1VnY21WemIyeDJaWElnZDJobGJpQnBkQ0J5WldGamFHVnpJR0VnY21WemRXeDBMbHh1Y0hKdmRHOHVkR2hsYmlBOUlHWjFibU4wYVc5dUlDaGpZaXdnWldJcElIdGNiaUFnTHk4Z1VtVm5hWE4wWlhJZ2RHaGxJR05oYkd4aVlXTnJjeUIwYnlCaVpTQjFjMlZrSUhkb1pXNGdjbVZ6YjJ4MlpXUmNiaUFnZEdocGN5NWZYM1JvWlc1elgxOHVjSFZ6YUNoYlkySXNJR1ZpWFNrN1hHNWNiaUFnTHk4Z1YyaGxiaUIwYUdVZ1pYaHdjbVZ6YzJsdmJpQnBjeUJ1YjI0Z1pHVm1aWEp5WldRZ1lXNWtJSGRsSUdoaGRtVWdZU0IyWVd4MVpTQjNaU0JtYjNKalpTQjBhR1ZjYmlBZ0x5OGdjbVZ6YjJ4MlpYSWdkRzhnY25WdUlHbHVJRzl5WkdWeUlIUnZJSEpsYzI5c2RtVWdkR2hsSUhCeWIyMXBjMlVnWVhRZ2JHVmhjM1FnYjI1alpTNWNiaUFnTHk4Z1ZHaHBjeUJwY3lCd2NtbHRZWEpwYkhrZ2RHOGdjM1Z3Y0c5eWRDQjBhR1VnZEdWemRDQnlkVzV1WlhKeklIVnpaU0JqWVhObElIZG9aWEpsSUdGdUlHVjRjSEpsYzNOcGIyNWNiaUFnTHk4Z2FYTWdjbVYwZFhKdVpXUWdabkp2YlNCMGFHVWdkR1Z6ZENCaGJtUWdkR2hsSUhKMWJtNWxjaUIzYVd4c0lHRjBkR0ZqYUNCcGRITmxiR1lnYUdWeVpTNWNiaUFnYVdZZ0tDRjBhR2x6TGw5ZlpHVm1aWEp5WldSZlh5QW1KaUIwYUdsekxuWmhiSFZsSUNFOVBTQjBhR2x6TGw5ZlIxVkJVa1JmWHlrZ2UxeHVJQ0FnSUhaaGNpQnlaWE52YkhabGNpQTlJSEpsYzI5c2RtVnljeTVoWTNGMWFYSmxLSFJvYVhNcE8xeHVJQ0FnSUhKbGMyOXNkbVZ5S0hSb2FYTXVkbUZzZFdVcE8xeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlIUm9hWE03WEc1OU8xeHVYRzV3Y205MGJ5NWpZWFJqYUNBOUlHWjFibU4wYVc5dUlDaGxZaWtnZTF4dUlDQnlaWFIxY200Z2RHaHBjeTUwYUdWdUtHNTFiR3dzSUdWaUtUdGNibjA3WEc1Y2JpOHZJRVJwYzNCaGRHTm9JR1YyWlhKNWIyNWxJSGRvYnlCM1lYTWdkMkZwZEdsdVp5QjBieUJpWlNCdWIzUnBabWxsWkNCdlppQjBhR1VnYjNWMFkyOXRaVnh1Y0hKdmRHOHVaR2x6Y0dGMFkyaFNaWE4xYkhRZ1BTQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpXUXNJSEpsYzNWc2RDa2dlMXh1SUNCcFppQW9NQ0E5UFQwZ2RHaHBjeTVmWDNSb1pXNXpYMTh1YkdWdVozUm9LU0I3WEc0Z0lDQWdjbVYwZFhKdU8xeHVJQ0I5WEc1Y2JpQWdMeThnUjJWdVpYSmhkR1VnWVNCdWFXTmxJR1Z5Y205eUlHWnZjaUIwYUdVZ1ptRnBiSFZ5WlZ4dUlDQjJZWElnWVdOMGRXRnNJRDBnZEdocGN5NTJZV3gxWlR0Y2JpQWdhV1lnS0hKbGMzVnNkQ0E5UFQwZ1ptRnNjMlVwSUh0Y2JpQWdJQ0JoWTNSMVlXd2dQU0IwYUdsekxtSjFhV3hrUlhKeWIzSW9jbVZ6YjJ4MlpXUXNJSEJ5YjNSdkxtUnBjM0JoZEdOb1VtVnpkV3gwS1R0Y2JpQWdmVnh1WEc0Z0lDOHZJRU55WldGMFpTQmhJSEJ5YjIxcGMyVWdkR2hoZENCeVpXcGxZM1J6SUdsdGJXVmthV0YwWld4NUlIZHBkR2dnWVNCbVlXbHNkWEpsSUdWeWNtOXlJRzl5WEc0Z0lDOHZJSEpsYzI5c2RtVnpJSGRwZEdnZ2RHaGxJR1Y0Y0hKbGMzTnBiMjRnYzNWaWFtVmpkQzVjYmlBZ2RtRnlJSEJ5YjIxcGMyVWdQU0J1WlhjZ1VISnZiV2x6WlNobWRXNWpkR2x2YmlBb2NtVnpiMngyWlN3Z2NtVnFaV04wS1NCN1hHNGdJQ0FnTHk4Z1EyRnNiR2x1WnlCeVpYTnZiSFpsS0NrZ2QybDBhQ0JoSUhCeWIyMXBjMlVnZDJsc2JDQmhkSFJoWTJnZ2FYUnpaV3htSUhSdklIUm9aU0J3Y205dGFYTmxYRzRnSUNBZ0x5OGdhVzV6ZEdWaFpDQnZaaUJ3WVhOemFXNW5JR2wwSUdGeklHRWdjMmx0Y0d4bElIWmhiSFZsTGlCVWJ5QmhkbTlwWkNCMGFHRjBJSGRsSUdSbGRHVmpkQ0IwYUdWY2JpQWdJQ0F2THlCallYTmxJR0Z1WkNCM2NtRndJR2wwSUdsdUlHRnVJR0Z5Y21GNUxseHVJQ0FnSUdsbUlDaGhZM1IxWVd3Z0ppWWdkSGx3Wlc5bUlHRmpkSFZoYkM1MGFHVnVJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQmhZM1IxWVd3Z1BTQmJYRzRnSUNBZ0lDQWdJQ2RCYzNNNklGWmhiSFZsSUhkeVlYQndaV1FnYVc0Z1lXNGdZWEp5WVhrZ2MybHVZMlVnYVhRZ2JHOXZhM01nYkdsclpTQmhJRkJ5YjIxcGMyVW5MRnh1SUNBZ0lDQWdJQ0JoWTNSMVlXeGNiaUFnSUNBZ0lGMDdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0tISmxjM1ZzZENBL0lISmxjMjlzZG1VZ09pQnlaV3BsWTNRcEtDQmhZM1IxWVd3Z0tUdGNiaUFnZlNrN1hHNWNiaUFnTHk4Z1FYUjBZV05vSUdGc2JDQjBhR1VnY21WbmFYTjBaWEpsWkNCMGFHVnVjeUIwYnlCMGFHVWdjSEp2YldselpTQnpieUIwYUdWNUlHZGxkQ0J1YjNScFptbGxaRnh1SUNCZkxtWnZja1ZoWTJnb2RHaHBjeTVmWDNSb1pXNXpYMThzSUdaMWJtTjBhVzl1SUNoallXeHNZbUZqYTNNcElIdGNiaUFnSUNCd2NtOXRhWE5sSUQwZ2NISnZiV2x6WlM1MGFHVnVMbUZ3Y0d4NUtIQnliMjFwYzJVc0lHTmhiR3hpWVdOcmN5azdYRzRnSUgwcE8xeHVmVHRjYmx4dVpuVnVZM1JwYjI0Z1pIVnRjRU5vWVdsdUlDaHlaWE52YkhabFpDd2dhVzVrWlc1MEtTQjdYRzRnSUhaaGNpQnlaWE4xYkhRZ1BTQW5KenRjYmx4dUlDQnBibVJsYm5RZ1BTQnBibVJsYm5RZ2ZId2dKeWM3WEc1Y2JpQWdjbVZ6YjJ4MlpXUXVabTl5UldGamFDaG1kVzVqZEdsdmJpQW9aWGh3TENCcFpIZ3BJSHRjYmlBZ0lDQnBaaUFvUVhKeVlYa3VhWE5CY25KaGVTaGxlSEFwS1NCN1hHNGdJQ0FnSUNCeVpYTjFiSFFnS3owZ1pIVnRjRU5vWVdsdUtHVjRjQ3dnYVc1a1pXNTBJQ3NnSnlBZ0p5azdYRzRnSUNBZ0lDQnlaWFIxY200N1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYVdZZ0tHVjRjQzV5WlhOMWJIUXBJSHRjYmlBZ0lDQWdJSEpsYzNWc2RDQXJQU0JwYm1SbGJuUWdLeUFuSUZ4Y2RUQXdNV0piTXpKdFVHRnpjMlZrT2x4Y2RUQXdNV0piTUcwZ0p5QXJJR1Y0Y0M1a1pYTmpjbWx3ZEdsdmJpQXJJQ2RjWEc0bk8xeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dUlDQWdJSDFjYmx4dUlDQWdJSEpsYzNWc2RDQXJQU0JwYm1SbGJuUWdLeUFuSUZ4Y2RUQXdNV0piTXpGdFJtRnBiR1ZrT2x4Y2RUQXdNV0piTUcwZ0p5QXJJR1Y0Y0M1a1pYTmpjbWx3ZEdsdmJpQXJJQ2RjWEc0bk8xeHVJQ0FnSUdsbUlDaHBaSGdnUFQwOUlISmxjMjlzZG1Wa0xteGxibWQwYUNBdElERXBJSHRjYmlBZ0lDQWdJSEpsYzNWc2RDQXJQU0JwYm1SbGJuUWdLeUFuSUNBZ0lGeGNkVEF3TVdKYk16TnRRblYwT2x4Y2RUQXdNV0piTUcwZ0p5QXJJR1Y0Y0M1bVlXbHNkWEpsSUNzZ0oxeGNiaWM3WEc0Z0lDQWdmVnh1WEc0Z0lIMHBPMXh1WEc0Z0lISmxkSFZ5YmlCeVpYTjFiSFE3WEc1OVhHNWNibHh1THk4Z1FuVnBiR1J6SUdGdUlFRnpjMFZ5Y205eUlHWnZjaUIwYUdVZ1kzVnljbVZ1ZENCbGVIQnlaWE56YVc5dUxpQkpkQ0J0WVd0bGN5QmhJR052ZFhCc1pTQnZabHh1THk4Z1lYTnpkVzF3ZEdsdmJuTXNJR1p2Y2lCcGJuTjBZVzVqWlNCMGFHVWdMbDlmYjJabWMyVjBYMThnYlhWemRDQmlaU0J3YkdGalpXUWdhblZ6ZENCaFpuUmxjaUIwYUdWY2JpOHZJR1Y0Y0dWamRHRjBhVzl1SUhSb1lYUWdjSEp2WkhWalpXUWdkR2hsSUdaaGFXeDFjbVVnYjJZZ2RHaGxJR05vWVdsdUxseHVjSEp2ZEc4dVluVnBiR1JGY25KdmNpQTlJR1oxYm1OMGFXOXVJQ2h5WlhOdmJIWmxaQ3dnYzNObUtTQjdYRzVjYmlBZ2RtRnlJR1Z5Y205eUlEMGdkR2hwY3k1ZlgyUmxjMk55YVhCMGFXOXVYMThnS3lBblhGeHVYRnh1Snp0Y2JseHVJQ0JsZUhBZ1BTQnlaWE52YkhabFpGc2djbVZ6YjJ4MlpXUXViR1Z1WjNSb0lDMGdNU0JkTzF4dUlDQmxjbkp2Y2lBclBTQmtkVzF3UTJoaGFXNG9jbVZ6YjJ4MlpXUXBPMXh1WEc0Z0lHbG1JQ2doZFhScGJDNWtiME52Ykc5eWN5Z3BLU0I3WEc0Z0lDQWdaWEp5YjNJZ1BTQjFkR2xzTG5WdVlXNXphU2hsY25KdmNpazdYRzRnSUgxY2JseHVJQ0F2THlCVVQwUlBPaUJ6YUc5M1JHbG1aaUJ6YUc5MWJHUWdZbVVnZFhObFpDQnZibXg1SUhkb1pXNGdhWFFnYldGclpYTWdjMlZ1YzJVZ2NHVnlhR0Z3YzF4dUlDQXZMeUFnSUNBZ0lDQjNaU0JqWVc0Z2NHRnpjeUJ1ZFd4c0wzVnVaR1ZtYVc1bFpDQmhibVFnYkdWMElFRnpjMFZ5Y205eUlHUmxkR1ZqZENCM2FHVnVJR2wwWEc0Z0lDOHZJQ0FnSUNBZ0lHMWhhMlZ6SUhObGJuTmxMbHh1WEc0Z0lIWmhjaUJsZUhCbFkzUmxaQ0E5SUdWNGNDNWxlSEJsWTNSbFpEdGNiaUFnTHk4Z1RXOWphR0VnZDJsc2JDQjBjbmtnZEc4Z2FuTnZibWxtZVNCMGFHVWdaWGh3WldOMFpXUWdkbUZzZFdVc0lHcDFjM1FnYVdkdWIzSmxJR2xtSUdsMEozTWdZU0JtZFc1amRHbHZibHh1SUNCcFppQW9kSGx3Wlc5bUlHVjRjR1ZqZEdWa0lEMDlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnWlhod1pXTjBaV1FnUFNCdWRXeHNPMXh1SUNCOVhHNWNiaUFnZG1GeUlHbHVjM1FnUFNCdVpYY2dRWE56UlhKeWIzSW9aWEp5YjNJc0lITnpaaUI4ZkNCaGNtZDFiV1Z1ZEhNdVkyRnNiR1ZsSUh4OElIQnliM1J2TG1KMWFXeGtSWEp5YjNJcE8xeHVJQ0JwYm5OMExuTm9iM2RFYVdabUlEMGdabUZzYzJVN1hHNGdJR2x1YzNRdVlXTjBkV0ZzSUQwZ2JuVnNiRHRjYmlBZ2FXNXpkQzVsZUhCbFkzUmxaQ0E5SUc1MWJHdzdYRzRnSUhKbGRIVnliaUJwYm5OME8xeHVmVHRjYmx4dUx5OGdVbVZ6YjJ4MlpYTWdkR2hsSUdOMWNuSmxiblFnWTJoaGFXNGdabTl5SUdFZ1oybDJaVzRnZG1Gc2RXVXVJRlJvWlNCeVpYTjFiSFFnYVhNZ1lXeDNZWGx6SUdGY2JpOHZJR0p2YjJ4bFlXNGdhVzVrYVdOaGRHbHVaeUIwYUdVZ2IzVjBZMjl0WlNCdmNpQmhiaUIxYm1SbFptbHVaV1FnZEc4Z2MybG5ibUZzSUhSb1lYUWdhWFFnY21WaFkyaGxaRnh1THk4Z1lXNGdZWE41Ym1Ob2NtOXViM1Z6SUdac2IzY3VYRzV3Y205MGJ5NTBaWE4wSUQwZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0JwWmlBb1lYSm5kVzFsYm5SekxteGxibWQwYUNBOVBUMGdNQ2tnZTF4dUlDQWdJR0ZqZEhWaGJDQTlJSFJvYVhNdWRtRnNkV1U3WEc0Z0lIMWNibHh1SUNBdkx5QlNaWE52YkhabElIUm9aU0JqYUdGcGJpQnpkR0Z5ZEdsdVp5Qm1jbTl0SUhKdmIzUmNiaUFnZG1GeUlISmxjMjlzZG1WeUlEMGdjbVZ6YjJ4MlpYSnpMbUZqY1hWcGNtVW9kR2hwY3lrN1hHNGdJSFpoY2lCeVpYTjFiSFFnUFNCeVpYTnZiSFpsY2loaFkzUjFZV3dwTzF4dVhHNGdJSEpsZEhWeWJpQnlaWE4xYkhRN1hHNTlPMXh1WEc0dkx5QlFaWEptYjNKdGN5QjBhR1VnY21WemIyeDFkR2x2YmlCdlppQjBhR1VnWTJoaGFXNGdZblYwSUdGa1pHbDBhVzl1WVd4c2VTQjNhV3hzSUhKaGFYTmxJR0Z1SUdWeWNtOXlYRzR2THlCcFppQnBkQ0JtWVdsc2N5QjBieUJqYjIxd2JHVjBaUzRnVjJobGJpQjBhR1VnWlhod2NtVnpjMmx2YmlCeVpYTnZiSFpsY3lCaGN5QjFibVJsWm1sdVpXUWdLR0Z6ZVc1aktWeHVMeThnYVhRbmJHd2dZbVVnWVhWMGIyMWhkR2xqWVd4c2VTQmxibUZpYkdVZ2FYUnpJR1JsWm1WeWNtVmtJR1pzWVdjdVhHNHZMeUJVYUdVZ1lITnpabUFnYzNSaGJtUnpJR1p2Y2lCVGRHRmphMVJ5WVdObFJuVnVZM1JwYjI0c0lHRWdjbVZtWlhKbGJtTmxJSFJ2SUhSb1pTQm1hWEp6ZENCbWRXNWpkR2x2Ymx4dUx5OGdkRzhnYzJodmR5QnZiaUIwYUdVZ2MzUmhZMnNnZEhKaFkyVXVYRzV3Y205MGJ5NWhjM05sY25RZ1BTQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQnpjMllwSUh0Y2JpQWdhV1lnS0dGeVozVnRaVzUwY3k1c1pXNW5kR2dnUFQwOUlEQXBJSHRjYmlBZ0lDQmhZM1IxWVd3Z1BTQjBhR2x6TG5aaGJIVmxPMXh1SUNCOVhHNWNiaUFnTHk4Z1NuVnpkQ0JwWjI1dmNtVWdhV1lnZEdobElHRmpkSFZoYkNCMllXeDFaU0JwY3lCdWIzUWdjSEpsYzJWdWRDQjVaWFJjYmlBZ0x5OGdWRTlFVHpvZ1UyaGhiR3dnYVhRZ2NISnZaSFZqWlNCaGJpQmxjbkp2Y2o5Y2JpQWdhV1lnS0dGamRIVmhiQ0E5UFQwZ2RHaHBjeTVmWDBkVlFWSkVYMThwSUhKbGRIVnliaUIwYUdsek8xeHVYRzRnSUhaaGNpQnlaWE52YkhabGNpQTlJSEpsYzI5c2RtVnljeTVoWTNGMWFYSmxLSFJvYVhNcE8xeHVJQ0IyWVhJZ2NtVnpkV3gwSUQwZ2NtVnpiMngyWlhJb1lXTjBkV0ZzS1R0Y2JseHVJQ0F2THlCSmRDQm1ZV2xzWldRZ2MyOGdjbVZ3YjNKMElHbDBJSGRwZEdnZ1lTQnVhV05sSUdWeWNtOXlYRzRnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJR1poYkhObEtTQjdYRzRnSUNBZ2RHaHliM2NnZEdocGN5NWlkV2xzWkVWeWNtOXlLSEpsYzI5c2RtVnlMbkpsYzI5c2RtVmtMQ0J6YzJZZ2ZId2dkR2hwY3k1aGMzTmxjblFwTzF4dUlDQjlYRzVjYmlBZ0x5OGdRMjl1ZG1WeWRDQjBhR1VnWlhod2NtVnpjMmx2YmlCcGJuUnZJR0VnWkdWbVpYSnlaV1FnYVdZZ1lXNGdZWE41Ym1NZ1pYaHdaV04wYVc5dUlIZGhjeUJtYjNWdVpGeHVJQ0JwWmlBb2NtVnpkV3gwSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQjBhR2x6TGw5ZlpHVm1aWEp5WldSZlh5QTlJSFJ5ZFdVN1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2RHaHBjenRjYm4wN1hHNWNiaTh2SUVGemMyVnlkSE1nZEdobElIQnliM1pwWkdWa0lIWmhiSFZsSUdGdVpDQnBaaUJ6ZFdOalpYTnpablZzSUhKbGRIVnlibk1nZEdobElHOXlhV2RwYm1Gc1hHNHZMeUIyWVd4MVpTQnBibk4wWldGa0lHOW1JSFJvWlNCamFHRnBiaUJwYm5OMFlXNWpaUzVjYm5CeWIzUnZMblJvY205MVoyZ2dQU0JtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lIUm9hWE11WVhOelpYSjBLR0ZqZEhWaGJDd2djSEp2ZEc4dWRHaHliM1ZuYUNrN1hHNGdJSEpsZEhWeWJpQmhZM1IxWVd3N1hHNTlPMXh1WEc0dkx5QkZkbUZzZFdGMFpYTWdkR2hsSUdWNGNISmxjM05wYjI0Z1kyaGhhVzRnY21Wd2IzSjBhVzVuSUhSb1pTQnNZWE4wSUcxMWRHRjBaV1FnZG1Gc2RXVWdjMlZsYmlCcGJseHVMeThnYVhRdUlFbG1JSFJvWlNCbGVIQnlaWE56YVc5dUlHUnZaWE1nYm05MElHTnZiWEJzWlhSbElHbDBKMnhzSUhKbGRIVnliaUIxYm1SbFptbHVaV1F1WEc1d2NtOTBieTV5WlhOMWJIUWdQU0JtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lIWmhjaUJ5WlhOMWJIUTdYRzVjYmlBZ2FXWWdLR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dQVDA5SURBcElIdGNiaUFnSUNCaFkzUjFZV3dnUFNCMGFHbHpMblpoYkhWbE8xeHVJQ0I5WEc1Y2JpQWdkSEo1SUh0Y2JpQWdJQ0IwYUdsekxuUmhjQ2htZFc1amRHbHZiaUFvZG1Gc2RXVXBJSHRjYmlBZ0lDQWdJSEpsYzNWc2RDQTlJSFpoYkhWbE8xeHVJQ0FnSUgwcExuUmxjM1FvWVdOMGRXRnNLVHRjYmlBZ2ZTQm1hVzVoYkd4NUlIdGNiaUFnSUNBdkx5QlNaVzF2ZG1VZ2RHaGxJQzUwWVhBZ1puSnZiU0IwYUdVZ1kyaGhhVzVjYmlBZ0lDQjBhR2x6TGw5ZlpYaHdaV04wWVhScGIyNXpYMTh1Y0c5d0tDazdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdjbVZ6ZFd4ME8xeHVmVHRjYmx4dVEyaGhhVzR1Y0hKdmRHOTBlWEJsTG5aaGJIVmxUMllnUFNCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUhKbGRIVnliaUIwYUdsekxuWmhiSFZsTzF4dWZUdGNibHh1UTJoaGFXNHVjSEp2ZEc5MGVYQmxMblJ2VTNSeWFXNW5JRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0JwWmlBb2RHaHBjeTVmWDJSbGMyTnlhWEIwYVc5dVgxOHBJSHRjYmlBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWDJSbGMyTnlhWEIwYVc5dVgxODdYRzRnSUgxY2JseHVJQ0IyWVhJZ1pHVnpZM01nUFZ4dUlDQWdJSFJvYVhNdVgxOWxlSEJsWTNSaGRHbHZibk5mWDF4dUlDQWdJQzVtYVd4MFpYSW9ablZ1WTNScGIyNGdLR01wSUhzZ2NtVjBkWEp1SUdNdVpHVnpZM0pwY0hScGIyNDdJSDBwWEc0Z0lDQWdMbTFoY0NobWRXNWpkR2x2YmlBb1l5a2dleUJ5WlhSMWNtNGdZeTVrWlhOamNtbHdkR2x2YmpzZ2ZTazdYRzVjYmlBZ2FXWWdLR1JsYzJOekxteGxibWQwYUNBK0lERXBJSHRjYmlBZ0lDQnlaWFIxY200Z0p5Z25JQ3NnWkdWelkzTXVhbTlwYmlnbkxDQW5LU0FySUNjcEp6dGNiaUFnZlNCbGJITmxJR2xtSUNoa1pYTmpjeTVzWlc1bmRHZ2dQVDA5SURFcElIdGNiaUFnSUNCeVpYUjFjbTRnWkdWelkzTmJNRjA3WEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnY21WMGRYSnVJQ2M4UVhOelEyaGhhVzQrSnp0Y2JpQWdmVnh1ZlR0Y2JseHVYRzV0YjJSMWJHVXVaWGh3YjNKMGN5QTlJRU5vWVdsdU8xeHVJbDE5IiwiLy8gQVBJIGNvbXBhdGlibGUgd2l0aCBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2Fzc2VydGlvbi1lcnJvci9cbi8vIFRoaXMgc2hvdWxkIG1ha2UgaW50ZWdyYXRpb24gd2l0aCBNb2NoYSB3b3JrLCBpbmNsdWRpbmcgZGlmZmVkXG4vLyBvdXRwdXQuXG5cbnZhciBGYWlsdXJlID0gcmVxdWlyZSgnZmFpbHVyZScpO1xuXG52YXIgdW5hbnNpID0gcmVxdWlyZSgnLi91dGlsJykudW5hbnNpO1xuXG5cbnZhciBBc3NFcnJvciA9IEZhaWx1cmUuY3JlYXRlKCdBc3NFcnJvcicpO1xudmFyIHByb3RvID0gQXNzRXJyb3IucHJvdG90eXBlO1xuXG4vLyBFeHBvc2UgRmFpbHVyZSBpbiBvdXIgY3VzdG9tIEVycm9yIHRvIGhlbHAgd2l0aCBicm93c2VyaWZpZWQgYnVsZHNcbkFzc0Vycm9yLkZhaWx1cmUgPSBGYWlsdXJlO1xuXG5wcm90by5zaG93RGlmZiA9IGZhbHNlO1xucHJvdG8uYWN0dWFsID0gbnVsbDtcbnByb3RvLmV4cGVjdGVkID0gbnVsbDtcblxuZnVuY3Rpb24gZ2V0VGFyZ2V0TGluZSAoZnJhbWVzKSB7XG4gIGZ1bmN0aW9uIGdldFNyYyAoZnJhbWUpIHtcbiAgICB2YXIgZm4gPSBmcmFtZS5nZXRGdW5jdGlvbigpO1xuICAgIHJldHVybiBmbiA/IGZuLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxzKy9nLCAnJykgOiBudWxsO1xuICB9XG5cbiAgaWYgKCFmcmFtZXMubGVuZ3RoKSByZXR1cm4gbnVsbDtcblxuICAvLyBGaXJzdCBmcmFtZSBpcyBub3cgdGhlIHRhcmdldFxuICB2YXIgdGFyZ2V0ID0gZnJhbWVzWzBdO1xuICB2YXIgdGFyZ2V0U3JjID0gZ2V0U3JjKHRhcmdldCk7XG4gIGlmICghdGFyZ2V0U3JjKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBGaWx0ZXIgb3V0IGFsbCBmcmFtZXMgd2hpY2ggYXJlIG5vdCBpbiB0aGUgc2FtZSBmaWxlXG4gIHNhbWVmaWxlID0gZnJhbWVzLmZpbHRlcihmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICByZXR1cm4gZnJhbWUgJiYgZnJhbWUuZ2V0RmlsZU5hbWUoKSA9PT0gdGFyZ2V0LmdldEZpbGVOYW1lKCk7XG4gIH0pO1xuXG4gIC8vIEdldCB0aGUgY2xvc2VzdCBmdW5jdGlvbiBpbiB0aGUgc2FtZSBmaWxlIHRoYXQgd3JhcHMgdGhlIHRhcmdldCBmcmFtZVxuICB2YXIgd3JhcHBlcjtcbiAgZm9yICh2YXIgaT0xOyBpIDwgc2FtZWZpbGUubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc3JjID0gZ2V0U3JjKHNhbWVmaWxlW2ldKTtcbiAgICBpZiAoc3JjICYmIC0xICE9PSBzcmMuaW5kZXhPZih0YXJnZXRTcmMpKSB7XG4gICAgICB3cmFwcGVyID0gc2FtZWZpbGVbaV07XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBXaGVuIGEgd3JhcHBlciBmdW5jdGlvbiBpcyBmb3VuZCB3ZSBjYW4gdXNlIGl0IHRvIG9idGFpbiB0aGUgbGluZSB3ZSB3YW50XG4gIGlmICh3cmFwcGVyKSB7XG4gICAgLy8gR2V0IHJlbGF0aXZlIHBvc2l0aW9uc1xuICAgIHZhciByZWxMbiA9IHRhcmdldC5nZXRMaW5lTnVtYmVyKCkgLSB3cmFwcGVyLmdldExpbmVOdW1iZXIoKTtcbiAgICB2YXIgcmVsQ2wgPSB0YXJnZXQuZ2V0TGluZU51bWJlcigpID09PSB3cmFwcGVyLmdldExpbmVOdW1iZXIoKVxuICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgOiB0YXJnZXQuZ2V0Q29sdW1uTnVtYmVyKCkgLSAxO1xuXG4gICAgdmFyIGxpbmVzID0gdGFyZ2V0LmdldEZ1bmN0aW9uKCkudG9TdHJpbmcoKS5zcGxpdCgvXFxuLyk7XG4gICAgaWYgKGxpbmVzW3JlbExuXSkge1xuICAgICAgcmV0dXJuIGxpbmVzW3JlbExuXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxucHJvdG8udG9KU09OID0gZnVuY3Rpb24gKHN0YWNrKSB7XG4gIHZhciBwcm9wcyA9IHtcbiAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgbWVzc2FnZTogdW5hbnNpKHRoaXMubWVzc2FnZSksXG4gICAgYWN0dWFsOiB0aGlzLmFjdHVhbCxcbiAgICBleHBlY3RlZDogdGhpcy5leHBlY3RlZCxcbiAgICBzaG93RGlmZjogdGhpcy5zaG93RGlmZlxuICB9O1xuXG4gIC8vIGluY2x1ZGUgc3RhY2sgaWYgZXhpc3RzIGFuZCBub3QgdHVybmVkIG9mZlxuICBpZiAoc3RhY2sgJiYgdGhpcy5zdGFjaykge1xuICAgIHByb3BzLnN0YWNrID0gdGhpcy5zdGFjaztcbiAgfVxuXG4gIHJldHVybiBwcm9wcztcbn07XG5cbnByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbXNnID0gRmFpbHVyZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGlzKTtcblxuICB2YXIgbGluZSA9IGdldFRhcmdldExpbmUodGhpcy5mcmFtZXMpO1xuICBpZiAobGluZSkge1xuICAgIG1zZyArPSAnXFxuICA+PiAnICsgbGluZS5yZXBsYWNlKC9eXFxzKy8sICcnKS5zbGljZSgwLCA2MCkgKyAnXFxuJztcbiAgfVxuXG4gIHJldHVybiBtc2c7XG59O1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBBc3NFcnJvcjtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ18nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ18nXSA6IG51bGwpO1xuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG52YXIgTWF0Y2hlciA9IHJlcXVpcmUoJy4vbWF0Y2hlcicpO1xuXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3V0aWwnKS50ZW1wbGF0ZTtcblxuXG4vLyBFeHBlY3RhdGlvbiByZXByZXNlbnRzIGFuIGluc3RhbnRpYXRlZCBNYXRjaGVyIGFscmVhZHkgY29uZmlndXJlZCB3aXRoXG4vLyBhbnkgYWRkaXRpb25hbCBhcmd1bWVudHMuXG5mdW5jdGlvbiBFeHBlY3RhdGlvbiAobWF0Y2hlciwgYXJncykge1xuICAvLyBHZXQgdGhlIG1hdGNoZXIgY29uZmlndXJhdGlvbiBpbnRvIHRoaXMgaW5zdGFuY2VcbiAgbWF0Y2hlci5hc3NpZ24odGhpcyk7XG5cbiAgLy8gU3VwcG9ydCBiZWluZyBnaXZlbiBhbiBgYXJndW1lbnRzYCBvYmplY3RcbiAgdGhpcy5hcmdzID0gXy50b0FycmF5KGFyZ3MpO1xuICB0aGlzLmFjdHVhbCA9IHVuZGVmaW5lZDtcbn1cblxuLy8gSW5oZXJpdCB0aGUgcHJvdG90eXBlIGZyb20gTWF0Y2hlclxudmFyIHByb3RvID0gRXhwZWN0YXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShNYXRjaGVyLnByb3RvdHlwZSk7XG5wcm90by5jb25zdHJ1Y3RvciA9IEV4cGVjdGF0aW9uO1xuXG4vLyBHZW5lcmF0ZSBnZXR0ZXIgZm9yIGAuZXhwZWN0ZWRgIChhbiBhbGlhcyBmb3IgYXJnc1swXSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2V4cGVjdGVkJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hcmdzWzBdO1xuICB9LFxuICAvLyBIYWNrOiBhbGxvdyBpdCB0byBiZSBvdmVycmlkZW4gb24gdGhlIGluc3RhbmNlXG4gIHNldDogZnVuY3Rpb24gKHYpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2V4cGVjdGVkJywge1xuICAgICAgdmFsdWU6IHZcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIEdlbmVyYXRlIGdldHRlcnMgZm9yIHRoZSBmaXJzdCA1IGFyZ3VtZW50cyBhcyBhcmcxLCBhcmcyLCAuLi5cbl8udGltZXMoNSwgZnVuY3Rpb24gKGkpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnYXJnJyArIChpICsgMSksIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmFyZ3NbaV07XG4gICAgfVxuICB9KTtcbn0pO1xuXG4vLyBDb21wdXRlIHRoZSBkZXNjcmlwdGlvbiBtZXNzYWdlIGZvciB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZXhwZWN0YXRpb25cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2Rlc2NyaXB0aW9uJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdGhpcy5kZXNjID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZXNjKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcGxhdGUodGhpcy5kZXNjLCB0aGlzKTtcbiAgfVxufSk7XG5cbi8vIENvbXB1dGUgdGhlIGZhaWx1cmUgbWVzc2FnZSBmb3IgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGV4cGVjdGF0aW9uXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdmYWlsdXJlJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuZmFpbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuZmFpbCh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlKHRoaXMuZmFpbCwgdGhpcyk7XG4gIH1cbn0pO1xuXG4vLyBIZWxwZXIgdG8gbXV0YXRlIHRoZSB2YWx1ZSB1bmRlciB0ZXN0XG5FeHBlY3RhdGlvbi5wcm90b3R5cGUubXV0YXRlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIodmFsdWUpO1xuICB9O1xufTtcblxuLy8gUmVzb2x2aW5nIGNhbiBvdmVycmlkZSB0aGUgZXhwZWN0YXRpb24gc3RhdGUsIGlmIHRoYXQncyBub3QgZGVzaXJhYmxlIG1ha2Vcbi8vIHN1cmUgdGhhdCB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgaW4gYSBuZXcgY29udGV4dC5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncywgcmVzdWx0O1xuXG4gIC8vIEV4ZWN1dGUgdGhlIG1hdGNoZXIgdGVzdCBub3cgdGhhdCBldmVyeXRoaW5nIGlzIHNldFxuICBhcmdzID0gW3RoaXMuYWN0dWFsXS5jb25jYXQodGhpcy5hcmdzKTtcbiAgcmVzdWx0ID0gdGhpcy50ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuXG4gIC8vIFJldHVybmluZyBhIHN0cmluZyBvdmVycmlkZXMgdGhlIG1pc21hdGNoIGRlc2NyaXB0aW9uXG4gIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuZmFpbCA9IHJlc3VsdDtcbiAgICByZXN1bHQgPSBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRlc2NyaXB0aW9uO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cGVjdGF0aW9uO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTlsZUhCbFkzUmhkR2x2Ymk1cWN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU8wRkJRVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVpTENKbWFXeGxJam9pWjJWdVpYSmhkR1ZrTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYkluWmhjaUJmSUQwZ0tIUjVjR1Z2WmlCM2FXNWtiM2NnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCM2FXNWtiM2RiSjE4blhTQTZJSFI1Y0dWdlppQm5iRzlpWVd3Z0lUMDlJRndpZFc1a1pXWnBibVZrWENJZ1B5Qm5iRzlpWVd4YkoxOG5YU0E2SUc1MWJHd3BPMXh1WEc1MllYSWdRMmhoYVc0Z1BTQnlaWEYxYVhKbEtDY3VMMk5vWVdsdUp5azdYRzUyWVhJZ1RXRjBZMmhsY2lBOUlISmxjWFZwY21Vb0p5NHZiV0YwWTJobGNpY3BPMXh1WEc1MllYSWdkR1Z0Y0d4aGRHVWdQU0J5WlhGMWFYSmxLQ2N1TDNWMGFXd25LUzUwWlcxd2JHRjBaVHRjYmx4dVhHNHZMeUJGZUhCbFkzUmhkR2x2YmlCeVpYQnlaWE5sYm5SeklHRnVJR2x1YzNSaGJuUnBZWFJsWkNCTllYUmphR1Z5SUdGc2NtVmhaSGtnWTI5dVptbG5kWEpsWkNCM2FYUm9YRzR2THlCaGJua2dZV1JrYVhScGIyNWhiQ0JoY21kMWJXVnVkSE11WEc1bWRXNWpkR2x2YmlCRmVIQmxZM1JoZEdsdmJpQW9iV0YwWTJobGNpd2dZWEpuY3lrZ2UxeHVJQ0F2THlCSFpYUWdkR2hsSUcxaGRHTm9aWElnWTI5dVptbG5kWEpoZEdsdmJpQnBiblJ2SUhSb2FYTWdhVzV6ZEdGdVkyVmNiaUFnYldGMFkyaGxjaTVoYzNOcFoyNG9kR2hwY3lrN1hHNWNiaUFnTHk4Z1UzVndjRzl5ZENCaVpXbHVaeUJuYVhabGJpQmhiaUJnWVhKbmRXMWxiblJ6WUNCdlltcGxZM1JjYmlBZ2RHaHBjeTVoY21keklEMGdYeTUwYjBGeWNtRjVLR0Z5WjNNcE8xeHVJQ0IwYUdsekxtRmpkSFZoYkNBOUlIVnVaR1ZtYVc1bFpEdGNibjFjYmx4dUx5OGdTVzVvWlhKcGRDQjBhR1VnY0hKdmRHOTBlWEJsSUdaeWIyMGdUV0YwWTJobGNseHVkbUZ5SUhCeWIzUnZJRDBnUlhod1pXTjBZWFJwYjI0dWNISnZkRzkwZVhCbElEMGdUMkpxWldOMExtTnlaV0YwWlNoTllYUmphR1Z5TG5CeWIzUnZkSGx3WlNrN1hHNXdjbTkwYnk1amIyNXpkSEoxWTNSdmNpQTlJRVY0Y0dWamRHRjBhVzl1TzF4dVhHNHZMeUJIWlc1bGNtRjBaU0JuWlhSMFpYSWdabTl5SUdBdVpYaHdaV04wWldSZ0lDaGhiaUJoYkdsaGN5Qm1iM0lnWVhKbmMxc3dYU2xjYms5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaHdjbTkwYnl3Z0oyVjRjR1ZqZEdWa0p5d2dlMXh1SUNCblpYUTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1aGNtZHpXekJkTzF4dUlDQjlMRnh1SUNBdkx5QklZV05yT2lCaGJHeHZkeUJwZENCMGJ5QmlaU0J2ZG1WeWNtbGtaVzRnYjI0Z2RHaGxJR2x1YzNSaGJtTmxYRzRnSUhObGREb2dablZ1WTNScGIyNGdLSFlwSUh0Y2JpQWdJQ0JQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb2RHaHBjeXdnSjJWNGNHVmpkR1ZrSnl3Z2UxeHVJQ0FnSUNBZ2RtRnNkV1U2SUhaY2JpQWdJQ0I5S1R0Y2JpQWdmVnh1ZlNrN1hHNWNiaTh2SUVkbGJtVnlZWFJsSUdkbGRIUmxjbk1nWm05eUlIUm9aU0JtYVhKemRDQTFJR0Z5WjNWdFpXNTBjeUJoY3lCaGNtY3hMQ0JoY21jeUxDQXVMaTVjYmw4dWRHbHRaWE1vTlN3Z1puVnVZM1JwYjI0Z0tHa3BJSHRjYmlBZ1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLSEJ5YjNSdkxDQW5ZWEpuSnlBcklDaHBJQ3NnTVNrc0lIdGNiaUFnSUNCblpYUTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtRnlaM05iYVYwN1hHNGdJQ0FnZlZ4dUlDQjlLVHRjYm4wcE8xeHVYRzR2THlCRGIyMXdkWFJsSUhSb1pTQmtaWE5qY21sd2RHbHZiaUJ0WlhOellXZGxJR1p2Y2lCMGFHVWdZM1Z5Y21WdWRDQnpkR0YwWlNCdlppQjBhR1VnWlhod1pXTjBZWFJwYjI1Y2JrOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBlU2h3Y205MGJ5d2dKMlJsYzJOeWFYQjBhVzl1Snl3Z2UxeHVJQ0JuWlhRNklHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQnBaaUFvSVhSb2FYTXVaR1Z6WXlrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHdzdYRzRnSUNBZ2ZWeHVJQ0FnSUdsbUlDaDBlWEJsYjJZZ2RHaHBjeTVrWlhOaklEMDlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWtaWE5qS0hSb2FYTXBPMXh1SUNBZ0lIMWNiaUFnSUNCeVpYUjFjbTRnZEdWdGNHeGhkR1VvZEdocGN5NWtaWE5qTENCMGFHbHpLVHRjYmlBZ2ZWeHVmU2s3WEc1Y2JpOHZJRU52YlhCMWRHVWdkR2hsSUdaaGFXeDFjbVVnYldWemMyRm5aU0JtYjNJZ2RHaGxJR04xY25KbGJuUWdjM1JoZEdVZ2IyWWdkR2hsSUdWNGNHVmpkR0YwYVc5dVhHNVBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvY0hKdmRHOHNJQ2RtWVdsc2RYSmxKeXdnZTF4dUlDQm5aWFE2SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNCcFppQW9kSGx3Wlc5bUlIUm9hWE11Wm1GcGJDQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVabUZwYkNoMGFHbHpLVHRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUhSbGJYQnNZWFJsS0hSb2FYTXVabUZwYkN3Z2RHaHBjeWs3WEc0Z0lIMWNibjBwTzF4dVhHNHZMeUJJWld4d1pYSWdkRzhnYlhWMFlYUmxJSFJvWlNCMllXeDFaU0IxYm1SbGNpQjBaWE4wWEc1RmVIQmxZM1JoZEdsdmJpNXdjbTkwYjNSNWNHVXViWFYwWVhSbElEMGdablZ1WTNScGIyNGdLSFpoYkhWbEtTQjdYRzRnSUhKbGRIVnliaUJtZFc1amRHbHZiaUFvY21WemIyeDJaWElwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSW9kbUZzZFdVcE8xeHVJQ0I5TzF4dWZUdGNibHh1THk4Z1VtVnpiMngyYVc1bklHTmhiaUJ2ZG1WeWNtbGtaU0IwYUdVZ1pYaHdaV04wWVhScGIyNGdjM1JoZEdVc0lHbG1JSFJvWVhRbmN5QnViM1FnWkdWemFYSmhZbXhsSUcxaGEyVmNiaTh2SUhOMWNtVWdkR2hoZENCMGFHbHpJRzFsZEdodlpDQnBjeUJqWVd4c1pXUWdhVzRnWVNCdVpYY2dZMjl1ZEdWNGRDNWNia1Y0Y0dWamRHRjBhVzl1TG5CeWIzUnZkSGx3WlM1eVpYTnZiSFpsSUQwZ1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNCMllYSWdZWEpuY3l3Z2NtVnpkV3gwTzF4dVhHNGdJQzh2SUVWNFpXTjFkR1VnZEdobElHMWhkR05vWlhJZ2RHVnpkQ0J1YjNjZ2RHaGhkQ0JsZG1WeWVYUm9hVzVuSUdseklITmxkRnh1SUNCaGNtZHpJRDBnVzNSb2FYTXVZV04wZFdGc1hTNWpiMjVqWVhRb2RHaHBjeTVoY21kektUdGNiaUFnY21WemRXeDBJRDBnZEdocGN5NTBaWE4wTG1Gd2NHeDVLSFJvYVhNc0lHRnlaM01wTzF4dVhHNGdJQzh2SUZKbGRIVnlibWx1WnlCaElITjBjbWx1WnlCdmRtVnljbWxrWlhNZ2RHaGxJRzFwYzIxaGRHTm9JR1JsYzJOeWFYQjBhVzl1WEc0Z0lHbG1JQ2gwZVhCbGIyWWdjbVZ6ZFd4MElEMDlQU0FuYzNSeWFXNW5KeWtnZTF4dUlDQWdJSFJvYVhNdVptRnBiQ0E5SUhKbGMzVnNkRHRjYmlBZ0lDQnlaWE4xYkhRZ1BTQm1ZV3h6WlR0Y2JpQWdmVnh1WEc0Z0lISmxkSFZ5YmlCeVpYTjFiSFE3WEc1OU8xeHVYRzVGZUhCbFkzUmhkR2x2Ymk1d2NtOTBiM1I1Y0dVdWRHOVRkSEpwYm1jZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lISmxkSFZ5YmlCMGFHbHpMbVJsYzJOeWFYQjBhVzl1TzF4dWZUdGNibHh1WEc1dGIyUjFiR1V1Wlhod2IzSjBjeUE5SUVWNGNHVmpkR0YwYVc5dU8xeHVJbDE5IiwiLy8gVGhlIE1hdGNoZXIgb2JqZWN0IGlzIGEgZGVzY3JpcHRvciBmb3IgdGhlIG1hdGNoaW5nIGxvZ2ljIGJ1dCBjYW5ub3Rcbi8vIGJlIHVzZWQgZGlyZWN0bHkuIFVzZSBhbiBFeHBlY3RhdGlvbiB0byBnZXQgYW4gaW5pdGlhbGl6ZWQgbWF0Y2hlci5cbmZ1bmN0aW9uIE1hdGNoZXIgKG5hbWUsIGRlc2NyaXB0b3IpIHtcblxuICAvLyBTaG9ydGN1dCBmb3Igc2ltcGxlIHRlc3QgZnVuY3Rpb25zXG4gIGlmICh0eXBlb2YgZGVzY3JpcHRvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGRlc2NyaXB0b3IgPSB7dGVzdDogZGVzY3JpcHRvcn07XG4gIH1cblxuICAvLyBUaGUgZ2VuZXJpYyBuYW1lIG9mIHRoZSBtYXRjaGVyXG4gIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoZGVzY3JpcHRvci5oZWxwKSkge1xuICAgIHRoaXMuaGVscCA9IGRlc2NyaXB0b3IuaGVscC5qb2luKCdcXG4nKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmhlbHAgPSBkZXNjcmlwdG9yLmhlbHAgfHwgJ05vdCBhdmFpbGFibGUnO1xuICB9XG5cbiAgLy8gRWl0aGVyIGEgdGVtcGxhdGUgc3RyaW5nIG9yIGEgZnVuY3Rpb24gdGhhdCB3aWxsIHJlY2VpdmUgYXMgb25seVxuICAvLyBhcmd1bWVudCBhbiBFeHBlY3RhdGlvbiBpbnN0YW5jZSAoY2FsbGVkIGFzIGEgbWV0aG9kIG9mIGl0KS5cbiAgdGhpcy5kZXNjID0gZGVzY3JpcHRvci5kZXNjICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gZGVzY3JpcHRvci5kZXNjXG4gICAgICAgICAgICA6IHRoaXMubmFtZTtcblxuICAvLyBFaXRoZXIgYSB0ZW1wbGF0ZSBzdHJpbmcgb3IgYSBmdW5jdGlvbiB0aGF0IHdpbGwgcmVjZWl2ZSBhcyBvbmx5XG4gIC8vIGFyZ3VtZW50IGFuIEV4cGVjdGF0aW9uIGluc3RhbmNlIChjYWxsZWQgYXMgYSBtZXRob2Qgb2YgaXQpLlxuICB0aGlzLmZhaWwgPSBkZXNjcmlwdG9yLmZhaWwgfHwgJ3dhcyB7eyBhY3R1YWwgfX0nO1xuXG4gIGlmICghZGVzY3JpcHRvci50ZXN0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0ZXN0IGZ1bmN0aW9uIG5vdCBkZWZpbmVkIGZvciB0aGUgbWF0Y2hlcicpO1xuICB9XG4gIHRoaXMudGVzdCA9IGRlc2NyaXB0b3IudGVzdDtcblxuICB0aGlzLmFyaXR5ID0gZGVzY3JpcHRvci5hcml0eSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgPyBkZXNjcmlwdG9yLmFyaXR5XG4gICAgICAgICAgICAgOiB0aGlzLnRlc3QubGVuZ3RoO1xufVxuXG5NYXRjaGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5NYXRjaGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1hdGNoZXI7XG5cbk1hdGNoZXIucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IodGhpcy5uYW1lLCB7XG4gICAgaGVscDogdGhpcy5oZWxwLFxuICAgIGRlc2M6IHRoaXMuZGVzYyxcbiAgICBmYWlsOiB0aGlzLmZhaWwsXG4gICAgdGVzdDogdGhpcy50ZXN0LFxuICAgIGFyaXR5OiB0aGlzLmFyaXR5XG4gIH0pO1xufTtcblxuLy8gQXVnbWVudCBhbm90aGVyIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIG9mIHRoaXMgbWF0Y2hlclxuTWF0Y2hlci5wcm90b3R5cGUuYXNzaWduID0gZnVuY3Rpb24gKG9iaikge1xuICBvYmouaGVscCA9IHRoaXMuaGVscDtcbiAgb2JqLmRlc2MgPSB0aGlzLmRlc2M7XG4gIG9iai5mYWlsID0gdGhpcy5mYWlsO1xuICBvYmoudGVzdCA9IHRoaXMudGVzdDtcbiAgb2JqLmFyaXR5ID0gdGhpcy5hcml0eTtcbn07XG5cbk1hdGNoZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gJzxBc3MuTWF0Y2hlciAnICsgdGhpcy5uYW1lICsgJz4nO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGNoZXI7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xuXG4vLyBHaXZlbiB0aGUgYXJndW1lbnRzIHdpdGggdGhlIGJyYW5jaGVzIG1ha2Ugc3VyZSB0aGV5IGFyZSBhbGwgZXhwcmVzc2lvbnNcbmZ1bmN0aW9uIHdyYXBBcmdzIChhcmdzKSB7XG4gIHJldHVybiBfLnRvQXJyYXkoYXJncykuc2xpY2UoMSkubWFwKGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICByZXR1cm4gYXNzLkNoYWluLmlzQ2hhaW4oYnJhbmNoKSA/IGJyYW5jaCA6IGFzcy5lcWwoYnJhbmNoKTtcbiAgfSk7XG59XG5cbmFzcy5yZWdpc3Rlcih7XG5cbiAgYW5kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgZXhwcmVzc2lvbnMsIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhbGwgdGhlIGV4cHJlc3Npb25zIHRoYXQgZm9ybSBpdCBkbyBpbmRlZWQgc3VjY2VlZC4nLFxuICAgICAgJ05vdGU6IGV2YWx1YXRpb24gd2lsbCBzdG9wIGFzIHNvb24gYXMgb25lIG9mIHRoZSBleHByZXNzaW9ucyBmYWlscy4nXG4gICAgXSxcbiAgICBkZXNjOiAnJHsgYXJncy5qb2luKFwiIEFORCBcIikgfScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IHdyYXBBcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgcmVzdWx0ID0gXy5ldmVyeShicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIGZhbHNlKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIGtlZXAgaXRlcmF0aW5nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhcnRpYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFrZSBjYXJlIG9mIGFueSBleHBlY3RhdGlvbnMgbGF0ZXIgaW4gdGhlIGNoYWluXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICBvcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIGV4cHJlc3Npb25zLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBleHByZXNzaW9ucyBkb2VzLicsXG4gICAgICAnTm90ZTogZXZhbHVhdGlvbiB3aWxsIHN0b3AgYXMgc29vbiBhcyBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIHN1Y2NlZWRzLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgT1IgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSB3cmFwQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBDaGVjayBpZiBhbGwgYnJhbmNoZXMgcGFzcyB0aGUgdGVzdFxuICAgICAgICB2YXIgdW5kZWZzID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IF8uc29tZShicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBrZWVwIGl0ZXJhdGluZ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXJ0aWFsO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRha2UgY2FyZSBvZiBhbnkgZXhwZWN0YXRpb25zIGxhdGVyIGluIHRoZSBjaGFpblxuICAgICAgICBpZiAocmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcbiAgeG9yOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgZXhwcmVzc2lvbnMsIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIGRvZXMgYnV0IG5vdCBhbGwgb2YgdGhlbS4nXG4gICAgXSxcbiAgICBkZXNjOiAnJHsgYXJncy5qb2luKFwiIFhPUiBcIikgfScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IHdyYXBBcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgb2tzID0gMDtcbiAgICAgICAgdmFyIGtvcyA9IDA7XG4gICAgICAgIF8uZm9yRWFjaChicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAoa29zID4gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBva3MgKz0gMTtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsLCBva3MgPiAwICYmIGtvcyA+IDAgPyB1bmRlZmluZWQgOiBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAob2tzID4gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBrb3MgKz0gMTtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsLCBva3MgPiAwICYmIGtvcyA+IDAgPyB1bmRlZmluZWQgOiBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIH0gZWxzZSBpZiAocGFydGlhbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgb2tzICs9IDE7XG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0aWFsID09PSBmYWxzZSkge1xuICAgICAgICAgICAga29zICs9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBva3MgPiAwICYmIGtvcyA+IDAgPyByZXNvbHZlcihhY3R1YWwpIDogZmFsc2U7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG59KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbXhwWWk5dFlYUmphR1Z5Y3k5amIyOXlaR2x1WVhScGIyNHVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFaUxDSm1hV3hsSWpvaVoyVnVaWEpoZEdWa0xtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJblpoY2lCZklEMGdLSFI1Y0dWdlppQjNhVzVrYjNjZ0lUMDlJRndpZFc1a1pXWnBibVZrWENJZ1B5QjNhVzVrYjNkYkoxOG5YU0E2SUhSNWNHVnZaaUJuYkc5aVlXd2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUJuYkc5aVlXeGJKMThuWFNBNklHNTFiR3dwTzF4dVhHNTJZWElnWVhOeklEMGdjbVZ4ZFdseVpTZ25MaTR2WVhOekp5azdYRzVjYmk4dklFZHBkbVZ1SUhSb1pTQmhjbWQxYldWdWRITWdkMmwwYUNCMGFHVWdZbkpoYm1Ob1pYTWdiV0ZyWlNCemRYSmxJSFJvWlhrZ1lYSmxJR0ZzYkNCbGVIQnlaWE56YVc5dWMxeHVablZ1WTNScGIyNGdkM0poY0VGeVozTWdLR0Z5WjNNcElIdGNiaUFnY21WMGRYSnVJRjh1ZEc5QmNuSmhlU2hoY21kektTNXpiR2xqWlNneEtTNXRZWEFvWm5WdVkzUnBiMjRnS0dKeVlXNWphQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQmhjM011UTJoaGFXNHVhWE5EYUdGcGJpaGljbUZ1WTJncElEOGdZbkpoYm1Ob0lEb2dZWE56TG1WeGJDaGljbUZ1WTJncE8xeHVJQ0I5S1R0Y2JuMWNibHh1WVhOekxuSmxaMmx6ZEdWeUtIdGNibHh1SUNCaGJtUTZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblEyOXRjRzl6WlhNZ1lTQnVaWGNnWlhod1pXTjBZWFJwYjI0Z1puSnZiU0IwZDI4Z2IzSWdiVzl5WlNCbGVIQnlaWE56YVc5dWN5d2dkMmhwWTJnZ2QybHNiQ0J2Ym14NUp5eGNiaUFnSUNBZ0lDZHpkV05qWldWa0lHbG1JR0ZzYkNCMGFHVWdaWGh3Y21WemMybHZibk1nZEdoaGRDQm1iM0p0SUdsMElHUnZJR2x1WkdWbFpDQnpkV05qWldWa0xpY3NYRzRnSUNBZ0lDQW5UbTkwWlRvZ1pYWmhiSFZoZEdsdmJpQjNhV3hzSUhOMGIzQWdZWE1nYzI5dmJpQmhjeUJ2Ym1VZ2IyWWdkR2hsSUdWNGNISmxjM05wYjI1eklHWmhhV3h6TGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDY2tleUJoY21kekxtcHZhVzRvWENJZ1FVNUVJRndpS1NCOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdJR0ZqZEhWaGJDQjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z1luSmhibU5vTVN3Z1luSmhibU5vTWlrZ2UxeHVJQ0FnSUNBZ2RtRnlJR0p5WVc1amFHVnpJRDBnZDNKaGNFRnlaM01vWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0FnSUhKbGRIVnliaUJtZFc1amRHbHZiaUFvY21WemIyeDJaWElwSUh0Y2JpQWdJQ0FnSUNBZ0x5OGdRMmhsWTJzZ2FXWWdZV3hzSUdKeVlXNWphR1Z6SUhCaGMzTWdkR2hsSUhSbGMzUmNiaUFnSUNBZ0lDQWdkbUZ5SUhWdVpHVm1jeUE5SURBN1hHNGdJQ0FnSUNBZ0lIWmhjaUJ5WlhOMWJIUWdQU0JmTG1WMlpYSjVLR0p5WVc1amFHVnpMQ0JtZFc1amRHbHZiaUFvWW5KaGJtTm9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ2RtRnlJSEJoY25ScFlXd2dQU0JpY21GdVkyZ3VkR1Z6ZENoaFkzUjFZV3dwTzF4dUlDQWdJQ0FnSUNBZ0lHbG1JQ2h3WVhKMGFXRnNJRDA5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDZ2hjbVZ6YjJ4MlpYSXVjR0YxYzJWa0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxuQmhkWE5sS0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjFibVJsWm5NZ0t6MGdNVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnlZVzVqYUM1MGFHVnVLRjh1YjI1alpTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSFZ1WkdWbWN5QXRQU0F4TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb01DQTlQVDBnZFc1a1pXWnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y21WemRXMWxLR0ZqZEhWaGJDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgwcExDQmZMbTl1WTJVb1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWE52YkhabGNpNXlaWE4xYldVb2JuVnNiQ3dnWm1Gc2MyVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3BPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHNnTHk4Z2EyVmxjQ0JwZEdWeVlYUnBibWRjYmlBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdjR0Z5ZEdsaGJEdGNiaUFnSUNBZ0lDQWdmU2s3WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLSEpsYzI5c2RtVnlMbkJoZFhObFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUIxYm1SbFptbHVaV1E3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQXZMeUJVWVd0bElHTmhjbVVnYjJZZ1lXNTVJR1Y0Y0dWamRHRjBhVzl1Y3lCc1lYUmxjaUJwYmlCMGFHVWdZMmhoYVc1Y2JpQWdJQ0FnSUNBZ2FXWWdLSEpsYzNWc2RDQTlQVDBnZEhKMVpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUhKbGMzVnNkQ0E5SUhKbGMyOXNkbVZ5S0dGamRIVmhiQ2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2NtVnpkV3gwTzF4dUlDQWdJQ0FnZlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUc5eU9pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBOdmJYQnZjMlZ6SUdFZ2JtVjNJR1Y0Y0dWamRHRjBhVzl1SUdaeWIyMGdkSGR2SUc5eUlHMXZjbVVnWlhod2NtVnpjMmx2Ym5Nc0lIZG9hV05vSUhkcGJHd2diMjVzZVNjc1hHNGdJQ0FnSUNBbmMzVmpZMlZsWkNCcFppQmhkQ0JzWldGemRDQnZibVVnYjJZZ2RHaGxJR1Y0Y0hKbGMzTnBiMjV6SUdSdlpYTXVKeXhjYmlBZ0lDQWdJQ2RPYjNSbE9pQmxkbUZzZFdGMGFXOXVJSGRwYkd3Z2MzUnZjQ0JoY3lCemIyOXVJR0Z6SUc5dVpTQnZaaUIwYUdVZ1pYaHdjbVZ6YzJsdmJuTWdjM1ZqWTJWbFpITXVKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nSnlSN0lHRnlaM011YW05cGJpaGNJaUJQVWlCY0lpa2dmU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUI3ZXlCaFkzUjFZV3dnZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR0p5WVc1amFERXNJR0p5WVc1amFESXBJSHRjYmlBZ0lDQWdJSFpoY2lCaWNtRnVZMmhsY3lBOUlIZHlZWEJCY21kektHRnlaM1Z0Wlc1MGN5azdYRzRnSUNBZ0lDQnlaWFIxY200Z1puVnVZM1JwYjI0Z0tISmxjMjlzZG1WeUtTQjdYRzRnSUNBZ0lDQWdJQzh2SUVOb1pXTnJJR2xtSUdGc2JDQmljbUZ1WTJobGN5QndZWE56SUhSb1pTQjBaWE4wWEc0Z0lDQWdJQ0FnSUhaaGNpQjFibVJsWm5NZ1BTQXdPMXh1SUNBZ0lDQWdJQ0IyWVhJZ2NtVnpkV3gwSUQwZ1h5NXpiMjFsS0dKeVlXNWphR1Z6TENCbWRXNWpkR2x2YmlBb1luSmhibU5vS1NCN1hHNGdJQ0FnSUNBZ0lDQWdkbUZ5SUhCaGNuUnBZV3dnUFNCaWNtRnVZMmd1ZEdWemRDaGhZM1IxWVd3cE8xeHVJQ0FnSUNBZ0lDQWdJR2xtSUNod1lYSjBhV0ZzSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doY21WemIyeDJaWEl1Y0dGMWMyVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbkJoZFhObEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0IxYm1SbFpuTWdLejBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WVc1amFDNTBhR1Z1S0Y4dWIyNWpaU2htZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGMyOXNkbVZ5TG5KbGMzVnRaU2hoWTNSMVlXd3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3NJRjh1YjI1alpTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSFZ1WkdWbWN5QXRQU0F4TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb01DQTlQVDBnZFc1a1pXWnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y21WemRXMWxLRzUxYkd3c0lHWmhiSE5sS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdmU2twTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN0lDOHZJR3RsWlhBZ2FYUmxjbUYwYVc1blhHNGdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhCaGNuUnBZV3c3WEc0Z0lDQWdJQ0FnSUgwcE8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTnZiSFpsY2k1d1lYVnpaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa08xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1ZHRnJaU0JqWVhKbElHOW1JR0Z1ZVNCbGVIQmxZM1JoZEdsdmJuTWdiR0YwWlhJZ2FXNGdkR2hsSUdOb1lXbHVYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTjFiSFFnUFQwOUlIUnlkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWE4xYkhRZ1BTQnlaWE52YkhabGNpaGhZM1IxWVd3cE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSEpsYzNWc2REdGNiaUFnSUNBZ0lIMDdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQjRiM0k2SUh0Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5RMjl0Y0c5elpYTWdZU0J1WlhjZ1pYaHdaV04wWVhScGIyNGdabkp2YlNCMGQyOGdiM0lnYlc5eVpTQmxlSEJ5WlhOemFXOXVjeXdnZDJocFkyZ2dkMmxzYkNCdmJteDVKeXhjYmlBZ0lDQWdJQ2R6ZFdOalpXVmtJR2xtSUdGMElHeGxZWE4wSUc5dVpTQnZaaUIwYUdVZ1pYaHdjbVZ6YzJsdmJuTWdaRzlsY3lCaWRYUWdibTkwSUdGc2JDQnZaaUIwYUdWdExpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2NrZXlCaGNtZHpMbXB2YVc0b1hDSWdXRTlTSUZ3aUtTQjlKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJSHQ3SUdGamRIVmhiQ0I5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2dZbkpoYm1Ob01Td2dZbkpoYm1Ob01pa2dlMXh1SUNBZ0lDQWdkbUZ5SUdKeVlXNWphR1Z6SUQwZ2QzSmhjRUZ5WjNNb1lYSm5kVzFsYm5SektUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNBZ0lDQWdMeThnUTJobFkyc2dhV1lnWVd4c0lHSnlZVzVqYUdWeklIQmhjM01nZEdobElIUmxjM1JjYmlBZ0lDQWdJQ0FnZG1GeUlIVnVaR1ZtY3lBOUlEQTdYRzRnSUNBZ0lDQWdJSFpoY2lCdmEzTWdQU0F3TzF4dUlDQWdJQ0FnSUNCMllYSWdhMjl6SUQwZ01EdGNiaUFnSUNBZ0lDQWdYeTVtYjNKRllXTm9LR0p5WVc1amFHVnpMQ0JtZFc1amRHbHZiaUFvWW5KaGJtTm9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ2RtRnlJSEJoY25ScFlXd2dQU0JpY21GdVkyZ3VkR1Z6ZENoaFkzUjFZV3dwTzF4dUlDQWdJQ0FnSUNBZ0lHbG1JQ2h3WVhKMGFXRnNJRDA5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDZ2hjbVZ6YjJ4MlpYSXVjR0YxYzJWa0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxuQmhkWE5sS0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjFibVJsWm5NZ0t6MGdNVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnlZVzVqYUM1MGFHVnVLRjh1YjI1alpTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNocmIzTWdQaUF3S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNtVnpkVzFsS0dGamRIVmhiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lHOXJjeUFyUFNBeE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCMWJtUmxabk1nTFQwZ01UdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLREFnUFQwOUlIVnVaR1ZtY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxuSmxjM1Z0WlNoaFkzUjFZV3dzSUc5cmN5QStJREFnSmlZZ2EyOXpJRDRnTUNBL0lIVnVaR1ZtYVc1bFpDQTZJR1poYkhObEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrc0lGOHViMjVqWlNobWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h2YTNNZ1BpQXdLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y21WemRXMWxLR0ZqZEhWaGJDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUd0dmN5QXJQU0F4TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0IxYm1SbFpuTWdMVDBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tEQWdQVDA5SUhWdVpHVm1jeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGMyOXNkbVZ5TG5KbGMzVnRaU2hoWTNSMVlXd3NJRzlyY3lBK0lEQWdKaVlnYTI5eklENGdNQ0EvSUhWdVpHVm1hVzVsWkNBNklHWmhiSE5sS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdmU2twTzF4dVhHNGdJQ0FnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2h3WVhKMGFXRnNJRDA5UFNCMGNuVmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnZhM01nS3owZ01UdGNiaUFnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0hCaGNuUnBZV3dnUFQwOUlHWmhiSE5sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JyYjNNZ0t6MGdNVHRjYmlBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaHlaWE52YkhabGNpNXdZWFZ6WldRcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc5cmN5QStJREFnSmlZZ2EyOXpJRDRnTUNBL0lISmxjMjlzZG1WeUtHRmpkSFZoYkNrZ09pQm1ZV3h6WlR0Y2JpQWdJQ0FnSUgwN1hHNGdJQ0FnZlZ4dUlDQjlYRzVjYm4wcE8xeHVJbDE5IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snXyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnXyddIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG4vLyBTZXQgb2YgZGVmYXVsdCBtYXRjaGVyc1xuYXNzLnJlZ2lzdGVyKHtcbiAgLy8gVE9ETzogTW92ZSB0aGlzIHRvIHRoZSBDaGFpbiBwcm90b3R5cGVcbiAgZGVzYzoge1xuICAgIGhlbHA6ICdQcm92aWRlIGEgY3VzdG9tIGRlc2NyaXB0aW9uIGZvciByZXBvcnRlZCBmYWlsdXJlcycsXG4gICAgZGVzYzogbnVsbCwgIC8vIFNraXAgaXQgZnJvbSByZXBvcnRzXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZGVzYykge1xuICAgICAgLy8gTm90ZSB0aGF0IHRoZSBkZXNjcmlwdGlvbiB3b24ndCBiZSBzZXQgdW50aWwgdGhlIGNoYWluIGlzIHJlc29sdmVkLFxuICAgICAgLy8gYXQgbGVhc3Qgb25jZSwgcmVhY2hpbmcgdGhpcyBleHBlY3RhdGlvbi5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgcmVzb2x2ZXIuY2hhaW4uX19kZXNjcmlwdGlvbl9fID0gZGVzYztcbiAgICAgICAgcmV0dXJuIHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICAvLyBJZ25vcmVkIG1hdGNoZXJzXG4gIHRvOiB7XG4gICAgYWxpYXNlczogWyAnYScsICdhbicsICdiZScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnSnVzdCBzb21lIHN5bnRheCBzdWdhciB0byBtYWtlIHRoZSBleHBlY3RhdGlvbnMgZWFzaWVyIG9uIHRoZSBleWVzLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIG1hcms6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSW5jcmVhc2VzIHRoZSBnbG9iYWwgYGFzcy5tYXJrc2AgY291bnRlciBldmVyeSB0aW1lIGl0IGdldHMnLFxuICAgICAgJ2V2YWx1YXRlZCBhcyBwYXJ0IG9mIGFuIGV4cHJlc3Npb24uIFVzZSBpdCB0byB2ZXJpZnkgdGhhdCB0aGUnLFxuICAgICAgJ3ByZWNlZGluZyBleHBlY3RhdGlvbnMgYXJlIGFjdHVhbGx5IGJlaW5nIGV4ZWN1dGVkLicsXG4gICAgICAnQW4gZWFzeSB3YXkgdG8gc3VwcG9ydCB0aGlzIHdoZW4gdXNpbmcgYSB0ZXN0IHJ1bm5lciBpcyB0byByZXNldCcsXG4gICAgICAndGhlIGNvdW50ZXIgYnkgY2FsbGluZyBgYXNzLm1hcmtzKClgIG9uIGEgYmVmb3JlRWFjaCBob29rIGFuZCcsXG4gICAgICAndGhlbiB2ZXJpZnkgYXQgdGhlIGVuZCBvZiB0ZXN0IHdpdGggYGFzcy5tYXJrcyhOKWAgKHdoZXJlIE4gaXMnLFxuICAgICAgJ3RoZSBudW1iZXIgb2YgbWFya3MgeW91IGV4cGVjdGVkKS4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGFzcy5tYXJrcy5jb3VudGVyICs9IDE7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gSnVzdCBhbGxvdyBhbnl0aGluZyA6KVxuICBhbnk6IHtcbiAgICBoZWxwOiAnQWxsb3dzIGFueSB2YWx1ZSB3aXRob3V0IHRlc3RpbmcgaXQuJyxcbiAgICBkZXNjOiAnaXMgYW55dGhpbmcnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgLy8gQW55dGhpbmcgdGhhdCBpc24ndCBudWxsIG9yIHVuZGVmaW5lZFxuICBkZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbm90IG51bGwgb3IgdW5kZWZpbmVkLicsXG4gICAgZGVzYzogJ2lzIGRlZmluZWQnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBudWxsICE9IGFjdHVhbDtcbiAgICB9XG4gIH0sXG4gIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBlbXB0eVxuICBlbXB0eToge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGVtcHR5IChvciBoYXMgYSBsZW5ndGggb2YgMCkuJyxcbiAgICBkZXNjOiAnaXMgZW1wdHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBudWxsID09IGFjdHVhbCB8fCBhY3R1YWwubGVuZ3RoID09PSAwO1xuICAgIH1cbiAgfSxcbiAgbmVtcHR5OiB7XG4gICAgYWxpYXNlczogWyAnbm9uRW1wdHknIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbm90IGVtcHR5IChvciBoYXMgYSBsZW5ndGggZ3JlYXRlciB0aGFuIDApLicsXG4gICAgZGVzYzogJ2lzIG5vdCBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIG51bGwgIT0gYWN0dWFsICYmIGFjdHVhbC5sZW5ndGggPiAwO1xuICAgIH1cbiAgfSxcbiAgdHJ1dGh5OiB7XG4gICAgYWxpYXNlczogWyAndHJ1aXNoJyBdLFxuICAgIGhlbHA6ICdUaGUgdmFsdWUgc2hvdWxkIGJlIHRydXRoeSAobm90IHVuZGVmaW5lZCwgbnVsbCwgMCwgXCJcIiBvciBbXSkuJyxcbiAgICBkZXNjOiAnaXMgdHJ1dGh5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWFjdHVhbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwubGVuZ3RoID09PSAnbnVtYmVyJyA/IGFjdHVhbC5sZW5ndGggPiAwIDogdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIGZhbHN5OiB7XG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgZmFsc3kgKHVuZGVmaW5lZCwgbnVsbCwgMCwgXCJcIiBvciBbXSkuJyxcbiAgICBkZXNjOiAnaXMgZmFsc3knLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWFjdHVhbCkgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbC5sZW5ndGggPT09ICdudW1iZXInID8gYWN0dWFsLmxlbmd0aCA9PT0gMCA6IGZhbHNlO1xuICAgIH1cbiAgfSxcblxuICAvLyBOZWdhdGlvblxuICBub3Q6IHtcbiAgICBhbGlhc2VzOiBbICdubycsICdOTycsICdOT1QnIF0sXG4gICAgaGVscDogJ05lZ2F0ZXMgdGhlIHJlc3VsdCBmb3IgdGhlIHJlc3Qgb2YgdGhlIGV4cHJlc3Npb24uJyxcbiAgICBkZXNjOiAnTm90IScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcblxuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlci5maW5hbGl6ZShmdW5jdGlvbiAoZmluYWwpIHtcbiAgICAgICAgICByZXR1cm4gIWZpbmFsO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIGlzOiB7XG4gICAgYWxpYXNlczogWyAnZXF1YWwnLCAnZXF1YWxzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3Mgc3RyaWN0IGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlIGFuZCBpdHMgZXhwZWN0ZWQuJyxcbiAgICAgICdOb3RlOiBpZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBjaGFpbiBleHByZXNzaW9uIGl0XFwnbGwgYmUgdGVzdGVkIGluc3RlYWQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIHN0cmljdGx5IGVxdWFsIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgLy8gdGhpcyBpcyBhIGJpdCBjb250cml2ZWQgYnV0IGl0IG1ha2VzIGZvciBzb21lIG5pY2Ugc3ludGF4IHRvIGJlIGFibGUgdG9cbiAgICAgIC8vIHVzZSAuaXMgZm9yIHBhc3NpbmcgaW4gZXhwZWN0YXRpb25zXG4gICAgICBpZiAoYXNzLkNoYWluLmlzQ2hhaW4oZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY3R1YWwgPT09IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcbiAgZXE6IHtcbiAgICBhbGlhc2VzOiBbICdlcWwnLCAnZXFscycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIGRlZXAgbm9uLXN0cmljdCBlcXVhbGl0eSBiZXR3ZWVuIHRoZSB2YWx1ZSBhbmQgaXRzIGV4cGVjdGVkLicsXG4gICAgICAnSXQgdW5kZXJzdGFuZHMgYXNzIGV4cHJlc3Npb25zIHNvIHlvdSBjYW4gY29tYmluZSB0aGVtIGF0IHdpbGwgaW4gdGhlJyxcbiAgICAgICdleHBlY3RlZCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gZXF1YWwge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gXy5pc0VxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpO1xuICAgIH1cbiAgfSxcblxuICBtYXRjaDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdUcmllcyB0byBtYXRjaCB0aGUgc3ViamVjdCBhZ2FpbnN0IHRoZSBleHBlY3RlZCB2YWx1ZSB3aGljaCBjYW4gYmUgZWl0aGVyJyxcbiAgICAgICdhIGZ1bmN0aW9uLCBhbiBhc3MgZXhwcmVzc2lvbiwgYW4gb2JqZWN0IHdpdGggYSAudGVzdCgpIGZ1bmN0aW9uIChmb3IgJyxcbiAgICAgICdpbnN0YW5jZSBhIFJlZ0V4cCkgb3IgYSBwbGFpbiBvYmplY3QgdG8gcGFydGlhbGx5IG1hdGNoIGFnYWluc3QgdGhlIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBtYXRjaCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcblxuICAgICAgaWYgKHR5cGVvZiBleHBlY3RlZC50ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAhIWV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKF8uaXNQbGFpbk9iamVjdChleHBlY3RlZCkgfHwgXy5pc0FycmF5KGV4cGVjdGVkKSB8fCBfLmlzQXJndW1lbnRzKGV4cGVjdGVkKSkge1xuXG4gICAgICAgIGlmIChudWxsID09IGFjdHVhbCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN1cHBvcnQgcGFzc2luZyBgWywnZm9vJ11gIHRvIG1lYW4gYFthc3MuYW55LCAnZm9vJ11gXG4gICAgICAgIGlmIChfLmlzQXJyYXkoZXhwZWN0ZWQpIHx8IF8uaXNBcmd1bWVudHMoZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgZXhwZWN0ZWQgPSBfLm1hcChleHBlY3RlZCwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdiA9PT0gJ3VuZGVmaW5lZCcgPyBhc3MuYW55IDogdjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IElkZWFsbHkgd2Ugc2hvdWxkIFwiZm9ya1wiIHRoZSByZXNvbHZlciBzbyB3ZSBjYW4gc3VwcG9ydFxuICAgICAgICAvLyAgICAgICBhc3luYyB0ZXN0cyBhbmQgYWxzbyBwcm92aWRlIGJldHRlciBmYWlsdXJlIG1lc3NhZ2VzLlxuICAgICAgICAvLyAgICAgICBVbmZvcnR1bmF0ZWx5IHRoZSBjdXJyZW50IGZvcmtpbmcgbWVjaGFuaXNtIGRvZXNuJ3Qgd29ya1xuICAgICAgICAvLyAgICAgICBmb3IgdGhpcyB1c2UgY2FzZSBzaW5jZSB3ZSBuZWVkIHRvIGNyZWF0ZSBuZXcgY2hhaW5zIGZvclxuICAgICAgICAvLyAgICAgICBlYWNoIGV4cGVjdGVkIGtleS5cbiAgICAgICAgdmFyIGZhaWx1cmUgPSB0cnVlO1xuICAgICAgICBfKGV4cGVjdGVkKS5ldmVyeShmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICAgIGlmICghXy5oYXMoYWN0dWFsLCBrZXkpKSB7XG4gICAgICAgICAgICBmYWlsdXJlID0gJ2tleSBcIicgKyBrZXkgKyAnXCIgbm90IGZvdW5kIGluIHt7YWN0dWFsfX0nO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghXy5pc0VxdWFsKGFjdHVhbFtrZXldLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgIGZhaWx1cmUgPSAna2V5IFwiJyArIGtleSArICdcIiBkb2VzIG5vdCBtYXRjaCB7e2FjdHVhbFtcIicgKyBrZXkgKyAnXCJdfX0nO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmFpbHVyZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBleHBlY3RlZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gJ2V4cGVjdGVkIGlzIG5vdCBhIGZ1bmN0aW9uIGFuZCBkb2VzIG5vdCBoYXZlIGEgLnRlc3QgbWV0aG9kJztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICEhZXhwZWN0ZWQoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG5cbiAgYWJvdmU6IHtcbiAgICBhbGlhc2VzOiBbICdndCcsICdtb3JlVGhhbicsICdncmVhdGVyVGhhbicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBoaWdoZXIgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbW9yZSB0aGFuIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA+IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBiZWxvdzoge1xuICAgIGFsaWFzZXM6IFsgJ2x0JywgJ2xlc3NUaGFuJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGxvd2VyIHRoYSBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbGVzcyB0aGFuIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA8IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBhYm92ZU9yRXF1YWw6IHtcbiAgICBhbGlhc2VzOiBbICdsZWFzdCcsICdhdExlYXN0JywgJ2d0ZScsICdtb3JlVGhhbk9yRXF1YWwnLCAnZ3JlYXRlclRoYW5PckVxdWFsJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGhpZ2hlciBvciBlcXVhbCB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBtb3JlIHRoYW4gb3IgZXF1YWwgdG8gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPj0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGJlbG93T3JFcXVhbDoge1xuICAgIGFsaWFzZXM6IFsgJ21vc3QnLCAnYXRNb3N0JywgJ2x0ZScsICdsZXNzVGhhbk9yRXF1YWwnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbG93ZXIgb3IgZXF1YWwgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvICR7ZXhwZWN0ZWR9JyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPD0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGNsb3NlOiB7XG4gICAgYWxpYXNlczogWyAnY2xvc2VUbycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBjbG9zZSB0byB0aGUgZXhwZWN0ZWQgYmFzZWQgb24gYSBnaXZlbiBkZWx0YS4nLFxuICAgICAgJ1RoZSBkZWZhdWx0IGRlbHRhIGlzIDAuMSBzbyB0aGUgdmFsdWUgMy41NSBpcyBjbG9zZSB0byBhbnkgdmFsdWUgYmV0d2VlbicsXG4gICAgICAnMy40NSBhbmQgMy42NSAoYm90aCBpbmNsdXNpdmUpLicsXG4gICAgICAnU3RyaW5nIHZhbHVlcyBhcmUgYWxzbyBzdXBwb3J0ZWQgYnkgY29tcHV0aW5nIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZW0nLFxuICAgICAgJ3VzaW5nIHRoZSBTaWZ0NCBhbGdvcml0aG0uIEZvciBzdHJpbmcgdmFsdWVzIHRoZSBkZWx0YSBpcyBpbnRlcnByZXRlZCBhcycsXG4gICAgICAnYSBwZXJjZW50YWdlIChpZTogMC4yNSBpcyAyNSUpLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBjbG9zZSB0byB7eyBleHBlY3RlZCB9fScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBkZWx0YSkge1xuICAgICAgZGVsdGEgPSBudWxsID09IGRlbHRhID8gMC4xIDogZGVsdGE7XG5cbiAgICAgIC8vIFN1cHBvcnQgc3RyaW5ncyBieSBjb21wdXRpbmcgdGhlaXIgZGlzdGFuY2VcbiAgICAgIGlmIChfLmlzU3RyaW5nKGFjdHVhbCkgJiYgXy5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICAgICAgdmFyIGRpZmYgPSB1dGlsLnNpZnQ0KGFjdHVhbCwgZXhwZWN0ZWQsIDMpIC8gTWF0aC5tYXgoYWN0dWFsLmxlbmd0aCwgZXhwZWN0ZWQubGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIGRpZmYgPD0gZGVsdGE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY3R1YWwgPj0gZXhwZWN0ZWQgLSBkZWx0YSAmJiBhY3R1YWwgPD0gZXhwZWN0ZWQgKyBkZWx0YTtcbiAgICB9XG4gIH0sXG5cbiAgaW5zdGFuY2VvZjoge1xuICAgIGFsaWFzZXM6IFsgJ2luc3RhbmNlT2YnLCAnaW5zdGFuY2UnLCAnaXNhJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3Rvci4nLFxuICAgICAgJ1doZW4gdGhlIGV4cGVjdGVkIGlzIGEgc3RyaW5nIGl0XFwnbGwgYWN0dWFsbHkgdXNlIGEgYHR5cGVvZmAnLFxuICAgICAgJ2NvbXBhcmlzb24uJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGFuIGluc3RhbmNlIG9mIHt7ZXhwZWN0ZWR9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmIChfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbCA9PT0gZXhwZWN0ZWQgPyB0cnVlIDogJ2hhZCB0eXBlIHt7IHR5cGVvZiBhY3R1YWwgfX0nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICB0eXBlb2Y6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBvZiBhIHNwZWNpZmljIHR5cGUnLFxuICAgIGRlc2M6ICd0byBoYXZlIHR5cGUge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnaGFkICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBfLmlzRXF1YWwodHlwZW9mIGFjdHVhbCwgZXhwZWN0ZWQpO1xuICAgIH1cbiAgfSxcbiAgbnVtYmVyOiB7XG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIG51bWJlciAoZGlmZmVyZW50IG9mIE5hTikuJyxcbiAgICBkZXNjOiAndG8gYmUgYSBudW1iZXInLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzTnVtYmVyKGFjdHVhbCkgJiYgIWlzTmFOKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBib29sOiB7XG4gICAgYWxpYXNlczogWyAnYm9vbGVhbicgXSxcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgYm9vbGVhbi4nLFxuICAgIGRlc2M6ICd0byBiZSBhIGJvb2xlYW4nLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzQm9vbGVhbihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgc3RyaW5nOiB7XG4gICAgYWxpYXNlczogWyAnc3RyJyBdLFxuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBzdHJpbmcuJyxcbiAgICBkZXNjOiAndG8gYmUgYSBzdHJpbmcnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzU3RyaW5nKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBvYmplY3Q6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBvZiB0eXBlIG9iamVjdC4nLFxuICAgIGRlc2M6ICd0byBiZSBhbiBvYmplY3QnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzT2JqZWN0KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBwbGFpbk9iamVjdDoge1xuICAgIGFsaWFzZXM6IFsgJ3BsYWluJywgJ29iaicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIE9iamVjdCBjb25zdHJ1Y3Rvci4nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1BsYWluT2JqZWN0KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBhcnJheToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGFuIEFycmF5LicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIEFycmF5JyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0FycmF5KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBmdW5jdGlvbjoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRnVuY3Rpb24uJyxcbiAgICBkZXNjOiAndG8gYmUgYSBGdW5jdGlvbicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNGdW5jdGlvbihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgcmVnZXhwOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBSZWdFeHAnLFxuICAgIGRlc2M6ICd0byBiZSBhIFJlZ0V4cCcsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNSZWdFeHAoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGRhdGU6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIERhdGUnLFxuICAgIGRlc2M6ICd0byBiZSBhIERhdGUnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRGF0ZShhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZWxlbWVudDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRE9NIGVsZW1lbnQnLFxuICAgIGRlc2M6ICd0byBiZSBhIERPTSBlbGVtZW50JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0VsZW1lbnQoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGVycm9yOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYW4gZXJyb3IgKG9yIGxvb2tzIGxpa2UgaXQpJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gRXJyb3InLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfLmlzT2JqZWN0KGFjdHVhbCkgJiYgXy5pc1N0cmluZyhhY3R1YWwubmFtZSkgJiYgXy5pc1N0cmluZyhhY3R1YWwubWVzc2FnZSk7XG4gICAgfVxuICB9LFxuXG4gIHVuZGVmaW5lZDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHVuZGVmaW5lZC4nLFxuICAgIGRlc2M6ICd0byBiZSB1bmRlZmluZWQnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzVW5kZWZpbmVkKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBudWxsOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgbnVsbC4nLFxuICAgIGRlc2M6ICd0byBiZSBudWxsJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID09PSBudWxsO1xuICAgIH1cbiAgfSxcbiAgTmFOOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgTmFOLicsXG4gICAgZGVzYzogJ3RvIGJlIE5hTicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNOdW1iZXIoYWN0dWFsKSkge1xuICAgICAgICB0aGlzLmZhaWwgPSAnd2FzICR7YWN0dWFsfSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmZhaWwgPSAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHRydWU6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyB0cnVlJyxcbiAgICBkZXNjOiAndG8gYmUgdHJ1ZScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzQm9vbGVhbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiBhY3R1YWwgPyB0cnVlIDogJ3dhcyB7e2FjdHVhbH19JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBmYWxzZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGZhbHNlJyxcbiAgICBkZXNjOiAndG8gYmUgZmFsc2UnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzQm9vbGVhbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAhYWN0dWFsID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICByYWlzZXM6IHtcbiAgICBhbGlhc2VzOiBbICd0aHJvd3MnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyB0aGF0IGV4ZWN1dGluZyB0aGUgdmFsdWUgcmVzdWx0cyBpbiBhbiBleGNlcHRpb24gYmVpbmcgdGhyb3duLicsXG4gICAgICAnVGhlIGNhcHR1cmVkIGV4Y2VwdGlvbiB2YWx1ZSBpcyB1c2VkIHRvIG11dGF0ZSB0aGUgc3ViamVjdCBmb3IgdGhlJyxcbiAgICAgICdmb2xsb3dpbmcgZXhwZWN0YXRpb25zLidcbiAgICBdLFxuICAgIGRlc2M6ICd0aHJvd3MgYW4gZXJyb3InLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNGdW5jdGlvbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgZnVuY3Rpb246IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhY3R1YWwoKTtcbiAgICAgICAgcmV0dXJuICdkaWQgbm90IHRocm93IGFueXRoaW5nJztcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKG51bGwgPT0gZXhwZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihleHBlY3RlZCkgJiYgZSBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzRXF1YWwoZSwgZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVnbWVudCB0aGUgZXhwZWN0YXRpb24gb2JqZWN0IHdpdGggYSBuZXcgdGVtcGxhdGUgdmFyaWFibGVcbiAgICAgICAgdGhpcy5leGNlcHRpb24gPSBlO1xuICAgICAgICByZXR1cm4gJ2dvdCB7eyBleGNlcHRpb24gfX0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBoYXM6IHtcbiAgICBhbGlhc2VzOiBbICdoYXZlJywgJ2NvbnRhaW4nLCAnY29udGFpbnMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgc29tZSBleHBlY3RlZCB2YWx1ZS4gSXQgdW5kZXJzdGFuZHMgZXhwZWN0ZWQnLFxuICAgICAgJ2NoYWluIGV4cHJlc3Npb25zIHNvIHRoaXMgc2VydmVzIGFzIHRoZSBlcXVpdmFsZW50IG9mIC5lcSBmb3IgcGFydGlhbCcsXG4gICAgICAnbWF0Y2hlcy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gY29udGFpbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYXJnMSAvKiwgLi4uICovKSB7XG5cbiAgICAgIC8vIGFsbG93IG11bHRpcGxlIGV4cGVjdGVkIHZhbHVlc1xuICAgICAgdmFyIGV4cGVjdGVkID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQubGVuZ3RoID09PSAxID8gZXhwZWN0ZWRbMF0gOiBleHBlY3RlZDtcblxuICAgICAgaWYgKCFfLmlzU3RyaW5nKGFjdHVhbCkgJiYgIV8uaXNBcnJheShhY3R1YWwpICYmICFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdnb3Qge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBfLmV2ZXJ5KGV4cGVjdGVkLCBmdW5jdGlvbiAoZXhwZWN0ZWQpIHtcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICAgIHJldHVybiAtMSAhPT0gYWN0dWFsLmluZGV4T2YoZXhwZWN0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8uaXNBcnJheShhY3R1YWwpKSB7XG4gICAgICAgICAgLy8gVE9ETzogSXNuJ3QgdGhlcmUgYW4gZWFzaWVyIHdheSB0byB0ZXN0IHRoaXMgdXNpbmcgbG9kYXNoIG9ubHk/XG4gICAgICAgICAgaWYgKCFhc3MuQ2hhaW4uaXNDaGFpbihleHBlY3RlZCkpIHtcbiAgICAgICAgICAgIGV4cGVjdGVkID0gYXNzLmVxKGV4cGVjdGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIC0xICE9PSBfLmZpbmRJbmRleChhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhY2s6IENvbXBhcmUgb2JqZWN0cyB3aXRoIC53aGVyZSBieSBmaWx0ZXJpbmcgYSB3cmFwcGVyIGFycmF5XG4gICAgICAgIHJldHVybiAxID09PSBfLndoZXJlKFthY3R1YWxdLCBleHBlY3RlZCkubGVuZ3RoO1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuICBoYXNPd246IHtcbiAgICBhbGlhc2VzOiBbICdoYXNLZXknLCAnaGFzSW5kZXgnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgb25lIG9yIG1vcmUgb3duIHByb3BlcnRpZXMgYXMgZGVmaW5lZCBieScsXG4gICAgICAndGhlIGdpdmVuIGFyZ3VtZW50cy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gaGF2ZSBvd24gcHJvcGVydHkgJHsgZXhwZWN0ZWQgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnd2FzIHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmZhaWwgPSAnb25seSBoYWQge3sgXy5rZXlzKGFjdHVhbCkgfX0nO1xuXG4gICAgICAvLyBUT0RPOiBPZmZlciBiZXR0ZXIgZmFpbHVyZSBtZXNzYWdlXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIF8uZXZlcnkoYXJncywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIF8uaGFzKGFjdHVhbCwgeCk7IH0pO1xuICAgIH1cbiAgfSxcblxuICBsb2c6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRHVtcHMgdGhlIHJlY2VpdmVkIHZhbHVlIHRvIHRoZSBjb25zb2xlLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgY29uc29sZS5sb2coJ1tBU1NdJywgYWN0dWFsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZHVtcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdEdW1wcyB0aGUgcmVjZWl2ZWQgdmFsdWUgdG8gdGhlIGNvbnNvbGUgYXBwbHlpbmcgdGhlIGdpdmVuIHRlbXBsYXRlLicsXG4gICAgICAnTm90ZTogVXNlICR7dGhpc30gdG8gaW50ZXJwb2xhdGUgdGhlIHdob2xlIHZhbHVlLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyN0ZW1wbGF0ZSdcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgdHBsKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gdXRpbC50ZW1wbGF0ZS5jYWxsKGFjdHVhbCwgdHBsLCBhY3R1YWwpO1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZGVidWdnZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGFsdHMgc2NyaXB0IGV4ZWN1dGlvbiBieSB0cmlnZ2VyaW5nIHRoZSBpbnRlcmFjdGl2ZSBkZWJ1Z2dlci4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIHRhcDoge1xuICAgIGFsaWFzZXM6IFsgJ2ZuJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDYWxscyB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gd2l0aCB0aGUgY3VycmVudCB2YWx1ZSBhcyBhcmd1bWVudC4nLFxuICAgICAgJ0lmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHNvbWV0aGluZyBkaWZmZXJlbnQgdG8gKnVuZGVmaW5lZCogdGhlJyxcbiAgICAgICdleHByZXNzaW9uIHdpbGwgZm9yayB0byBvcGVyYXRlIG9uIHRoZSByZXR1cm5lZCB2YWx1ZS4nLFxuICAgIF0sXG4gICAgZGVzYzogJ2NhbGwge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZm4oYWN0dWFsKTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgbm90aWZ5OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1NpbWlsYXIgdG8gLnRhcCgpIGJ1dCBpdCB3b25cXCd0IHBhc3MgdGhlIGN1cnJlbnQgdmFsdWUgYXMgYXJndW1lbnQsJyxcbiAgICAgICdpbnN0ZWFkIGl0IHdpbGwgYmUgcHJvdmlkZWQgYXMgdGhlIGB0aGlzYCBjb250ZXh0IHdoZW4gcGVyZm9ybWluZyB0aGUnLFxuICAgICAgJ2NhbGwuIFRoaXMgYWxsb3dzIGl0IHRvIGJlIHVzZWQgd2l0aCB0ZXN0IHJ1bm5lcnMgYGRvbmVgIHN0eWxlIGNhbGxiYWNrcy4nLFxuICAgICAgJ05vdGUgdGhhdCBpdCB3aWxsIG5laXRoZXIgbXV0YXRlIHRoZSB2YWx1ZSBldmVuIGlmIGl0IHJldHVybnMgc29tZXRoaW5nLidcbiAgICBdLFxuICAgIGRlc2M6ICdub3RpZnkge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICBmbi5jYWxsKGFjdHVhbCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgc2l6ZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiB0aGUgc2l6ZSBvZiB0aGUgY3VycmVudCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHNpemUnLFxuICAgIGZhaWw6ICdub3QgaGFzIGEgbGVuZ3RoOiB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGFjdHVhbCkgfHwgXy5pc0FycmF5KGFjdHVhbCkgfHwgXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShfLnNpemUoYWN0dWFsKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sXG4gIHByb3A6IHtcbiAgICBhbGlhc2VzOiBbICdrZXknLCAncHJvcGVydHknIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgdmFsdWUgcHJvcGVydGllcy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHByb3BlcnR5IHt7IGFyZzEgfX0nLFxuICAgIGZhaWw6ICd3YXMgbm90IGZvdW5kIG9uIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwga2V5KSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIGlmIChrZXkgaW4gYWN0dWFsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGFjdHVhbFtrZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMua2V5cyA9IFtdO1xuICAgICAgICBfLmZvckluKGFjdHVhbCwgZnVuY3Rpb24gKHYsIGspIHsgdGhpcy5rZXlzLnB1c2goayk7IH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gJ3dhcyBub3QgZm91bmQgaW4ga2V5cyB7eyBrZXlzIH19JztcbiAgICAgIH1cbiAgICAgIHJldHVybiAnZ290IHt7YWN0dWFsfX0nO1xuICAgIH1cbiAgfSxcbiAgYXQ6IHtcbiAgICBhbGlhc2VzOiBbICdpbmRleCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIGluZGV4ZWQgZWxlbWVudHMuIElmJyxcbiAgICAgICdtdWx0aXBsZSBpbmRleGVzIGFyZSBwcm92aWRlZCBhbiBhcnJheSBpcyBjb21wb3NlZCB3aXRoIHRoZW0uJyxcbiAgICAgICdOb3RlOiBJdCBzdXBwb3J0cyBuZWdhdGl2ZSBpbmRleGVzJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBpbmRleCAkeyBhcmdzLmpvaW4oXCIsIFwiKSB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBpbmRleCkge1xuICAgICAgaWYgKCFfLmlzQXJyYXkoYWN0dWFsKSAmJiAhXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnbm90IGFuIGFycmF5IG9yIGEgc3RyaW5nOiAke2FjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW5kZXhlcyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgdmFyIGVsZW1zID0gW107XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaWR4ID0gaW5kZXhlc1tpXTtcblxuICAgICAgICBpZHggPSBpZHggPCAwID8gYWN0dWFsLmxlbmd0aCArIGlkeCA6IGlkeDtcbiAgICAgICAgaWYgKGlkeCA8IDAgfHwgaWR4ID49IGFjdHVhbC5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gaWR4ICsgJyBvdXQgb2YgYm91bmRzIGZvciB7e2FjdHVhbH19JztcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1zLnB1c2goYWN0dWFsW2lkeF0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIGVsZW1zLmxlbmd0aCA9PT0gMSA/IGVsZW1zWzBdIDogZWxlbXNcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGtleXM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBpdHMgbGlzdCBvZiBvd24ga2V5cy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGtleXMnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5rZXlzKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICB2YWx1ZXM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBpdHMgbGlzdCBvZiB2YWx1ZXMnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHZhbHVlcycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnZhbHVlcyhhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzbGljZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdFeHRyYWN0cyBhIHBvcnRpb24gZnJvbSB0aGUgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3NsaWNlKHt7YWN0dWFsfX0sICR7YXJnMSB8fCAwfSknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHN0YXJ0LCBlbmQpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50b0FycmF5KGFjdHVhbCkuc2xpY2Uoc3RhcnQsIGVuZClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGZpbHRlcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIHRoZSBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0bycsXG4gICAgICAnb3BlcmF0ZSBvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCcsXG4gICAgICAndHJ1dGh5IGZvci4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlsdGVyJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5maWx0ZXIoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICByZWplY3Q6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlJyxcbiAgICAgICdvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCBmYWxzeScsXG4gICAgICAnZm9yICh0aGUgb3Bwb3NpdGUgb2YgLmZpbHRlcikuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3JlamVjdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucmVqZWN0KGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICB3aGVyZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdQZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbiBvZiBlYWNoIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uIHRvIHRoZSBnaXZlbicsXG4gICAgICAncHJvcGVydGllcyBvYmplY3QsIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgb2YgYWxsJyxcbiAgICAgICdlbGVtZW50cyB0aGF0IGhhdmUgZXF1aXZhbGVudCBwcm9wZXJ0eSB2YWx1ZXMuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3doZXJlJ1xuICAgIF0sXG4gICAgZGVzYzogJ3doZXJlIHt7YXJnMX19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wcykge1xuICAgICAgaWYgKCFfLmlzUGxhaW5PYmplY3QocHJvcHMpKSB7XG4gICAgICAgIHJldHVybiAncHJvcHMgaXMgbm90IGFuIG9iamVjdCc7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ud2hlcmUoYWN0dWFsLCBwcm9wcylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1hcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXAnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1hcChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWV0aG9kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSByZXN1bHQgb2YgaW52b2tpbmcgdGhlIG5hbWVkJyxcbiAgICAgICdtZXRob2Qgb24gdGhlIHN1YmplY3QgdmFsdWUuJyxcbiAgICBdLFxuICAgIGRlc2M6IFwibWV0aG9kIC4ke2FyZzF9KClcIixcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBtZXRob2QsIGFyZykge1xuICAgICAgaWYgKHR5cGVvZiBhY3R1YWxbbWV0aG9kXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gJyR7YXJnMX0gaXMgbm90IGEgbWV0aG9kIGluIHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDIpO1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBhY3R1YWxbbWV0aG9kXS5hcHBseShhY3R1YWwsIGFyZ3MpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBpbnZva2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIG1ldGhvZCBuYW1lZCBieSB0aGUgYXJndW1lbnQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjaW52b2tlJ1xuICAgIF0sXG4gICAgZGVzYzogXCJpbnZva2UgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZCwgYXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaW52b2tlLmFwcGx5KF8sIGFyZ3VtZW50cylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHBsdWNrOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHRoZSBvbmUgb2YgdGhlIHNwZWNpZmljIHByb3BlcnR5IGZvciBhbGwgZWxlbWVudHMnLFxuICAgICAgJ2luIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3BsdWNrJ1xuICAgIF0sXG4gICAgZGVzYzogJ3BsdWNrKCB7e2FyZzF9fSApJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucGx1Y2soYWN0dWFsLCBwcm9wKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgZmlyc3Q6IHtcbiAgICBhbGlhc2VzOiBbICdoZWFkJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ZpcnN0J1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBmaXJzdCBlbGVtZW50JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaGVhZChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgbGFzdDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2xhc3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubGFzdChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgcmVzdDoge1xuICAgIGFsaWFzZXM6IFsgJ3RhaWwnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50YWlsKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1pbjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSBzdWJqZWN0IHRvIGJlIHRoZSBtaW5pbXVtIHZhbHVlIGZvdW5kIG9uIHRoZSBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtaW4nXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWluKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBtYXg6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgc3ViamVjdCB0byBiZSB0aGUgbWF4aW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWF4J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1heChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzb3J0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHNvcnRlZCBpbiBhc2NlbmRpbmcgb3JkZXIuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3NvcnRCeSdcbiAgICBdLFxuICAgIGRlc2M6ICdzb3J0JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgLy8gQWxsb3cgdGhlIHVzZSBvZiBleHByZXNzaW9ucyBhcyBjYWxsYmFja3NcbiAgICAgIGlmIChjYWxsYmFjayBpbnN0YW5jZW9mIGFzcy5DaGFpbikge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrLnJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnNvcnRCeShhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RvcmU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGVscGVyIHRvIHN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IHZhbHVlIGJlaW5nIGV2YWx1YXRlZCBpbiB0aGUnLFxuICAgICAgJ2V4cHJlc3Npb24gaW4gc29tZSBvdGhlciBvYmplY3QuIEl0IGV4cGVjdHMgYSB0YXJnZXQgb2JqZWN0IGFuZCBvcHRpb25hbGx5JyxcbiAgICAgICd0aGUgbmFtZSBvZiBhIHByb3BlcnR5LiBJZiB0YXJnZXQgaXMgYSBmdW5jdGlvbiBpdFxcJ2xsIHJlY2VpdmUgdGhlIHZhbHVlJyxcbiAgICAgICd1c2luZyBgcHJvcGAgYXMgdGhpcyBjb250ZXh0LiBJZiBgcHJvcGAgaXMgbm90IHByb3ZpZGVkIGFuZCBgdGFyZ2V0YCBpcyBhbicsXG4gICAgICAnYXJyYXkgdGhlIHZhbHVlIHdpbGwgYmUgcHVzaGVkIHRvIGl0LidcbiAgICBdLFxuICAgIGRlc2M6ICdzdG9yZScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgdGFyZ2V0LCBwcm9wKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0LmNhbGwocHJvcCwgYWN0dWFsKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChfLmlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgIHRhcmdldC5wdXNoKGFjdHVhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICdwcm9wIHVuZGVmaW5lZCBhbmQgdGFyZ2V0IGlzIG5vdCBhbiBhcnJheSBvciBhIGZ1bmN0aW9uOiB7e2FyZzF9fSc7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoXy5pc09iamVjdCh0YXJnZXQpKSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IGFjdHVhbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAndGFyZ2V0IGlzIG5vdCBhbiBvYmplY3Q6IHt7YXJnMX19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTl0WVhSamFHVnljeTlqYjNKbExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdYeUE5SUNoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnZDJsdVpHOTNXeWRmSjEwZ09pQjBlWEJsYjJZZ1oyeHZZbUZzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z1oyeHZZbUZzV3lkZkoxMGdPaUJ1ZFd4c0tUdGNibHh1ZG1GeUlHRnpjeUE5SUhKbGNYVnBjbVVvSnk0dUwyRnpjeWNwTzF4dWRtRnlJSFYwYVd3Z1BTQnlaWEYxYVhKbEtDY3VMaTkxZEdsc0p5azdYRzVjYmk4dklGTmxkQ0J2WmlCa1pXWmhkV3gwSUcxaGRHTm9aWEp6WEc1aGMzTXVjbVZuYVhOMFpYSW9lMXh1SUNBdkx5QlVUMFJQT2lCTmIzWmxJSFJvYVhNZ2RHOGdkR2hsSUVOb1lXbHVJSEJ5YjNSdmRIbHdaVnh1SUNCa1pYTmpPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0oxQnliM1pwWkdVZ1lTQmpkWE4wYjIwZ1pHVnpZM0pwY0hScGIyNGdabTl5SUhKbGNHOXlkR1ZrSUdaaGFXeDFjbVZ6Snl4Y2JpQWdJQ0JrWlhOak9pQnVkV3hzTENBZ0x5OGdVMnRwY0NCcGRDQm1jbTl0SUhKbGNHOXlkSE5jYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCa1pYTmpLU0I3WEc0Z0lDQWdJQ0F2THlCT2IzUmxJSFJvWVhRZ2RHaGxJR1JsYzJOeWFYQjBhVzl1SUhkdmJpZDBJR0psSUhObGRDQjFiblJwYkNCMGFHVWdZMmhoYVc0Z2FYTWdjbVZ6YjJ4MlpXUXNYRzRnSUNBZ0lDQXZMeUJoZENCc1pXRnpkQ0J2Ym1ObExDQnlaV0ZqYUdsdVp5QjBhR2x6SUdWNGNHVmpkR0YwYVc5dUxseHVJQ0FnSUNBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNoeVpYTnZiSFpsY2lrZ2UxeHVJQ0FnSUNBZ0lDQnlaWE52YkhabGNpNWphR0ZwYmk1ZlgyUmxjMk55YVhCMGFXOXVYMThnUFNCa1pYTmpPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSW9ZV04wZFdGc0tUdGNiaUFnSUNBZ0lIMDdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJQzh2SUVsbmJtOXlaV1FnYldGMFkyaGxjbk5jYmlBZ2RHODZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RoSnl3Z0oyRnVKeXdnSjJKbEp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkS2RYTjBJSE52YldVZ2MzbHVkR0Y0SUhOMVoyRnlJSFJ2SUcxaGEyVWdkR2hsSUdWNGNHVmpkR0YwYVc5dWN5QmxZWE5wWlhJZ2IyNGdkR2hsSUdWNVpYTXVKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nYm5Wc2JDeGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2JXRnlhem9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEpibU55WldGelpYTWdkR2hsSUdkc2IySmhiQ0JnWVhOekxtMWhjbXR6WUNCamIzVnVkR1Z5SUdWMlpYSjVJSFJwYldVZ2FYUWdaMlYwY3ljc1hHNGdJQ0FnSUNBblpYWmhiSFZoZEdWa0lHRnpJSEJoY25RZ2IyWWdZVzRnWlhod2NtVnpjMmx2Ymk0Z1ZYTmxJR2wwSUhSdklIWmxjbWxtZVNCMGFHRjBJSFJvWlNjc1hHNGdJQ0FnSUNBbmNISmxZMlZrYVc1bklHVjRjR1ZqZEdGMGFXOXVjeUJoY21VZ1lXTjBkV0ZzYkhrZ1ltVnBibWNnWlhobFkzVjBaV1F1Snl4Y2JpQWdJQ0FnSUNkQmJpQmxZWE41SUhkaGVTQjBieUJ6ZFhCd2IzSjBJSFJvYVhNZ2QyaGxiaUIxYzJsdVp5QmhJSFJsYzNRZ2NuVnVibVZ5SUdseklIUnZJSEpsYzJWMEp5eGNiaUFnSUNBZ0lDZDBhR1VnWTI5MWJuUmxjaUJpZVNCallXeHNhVzVuSUdCaGMzTXViV0Z5YTNNb0tXQWdiMjRnWVNCaVpXWnZjbVZGWVdOb0lHaHZiMnNnWVc1a0p5eGNiaUFnSUNBZ0lDZDBhR1Z1SUhabGNtbG1lU0JoZENCMGFHVWdaVzVrSUc5bUlIUmxjM1FnZDJsMGFDQmdZWE56TG0xaGNtdHpLRTRwWUNBb2QyaGxjbVVnVGlCcGN5Y3NYRzRnSUNBZ0lDQW5kR2hsSUc1MWJXSmxjaUJ2WmlCdFlYSnJjeUI1YjNVZ1pYaHdaV04wWldRcExpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJRzUxYkd3c1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdZWE56TG0xaGNtdHpMbU52ZFc1MFpYSWdLejBnTVR0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQXZMeUJLZFhOMElHRnNiRzkzSUdGdWVYUm9hVzVuSURvcFhHNGdJR0Z1ZVRvZ2UxeHVJQ0FnSUdobGJIQTZJQ2RCYkd4dmQzTWdZVzU1SUhaaGJIVmxJSGRwZEdodmRYUWdkR1Z6ZEdsdVp5QnBkQzRuTEZ4dUlDQWdJR1JsYzJNNklDZHBjeUJoYm5sMGFHbHVaeWNzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQXZMeUJCYm5sMGFHbHVaeUIwYUdGMElHbHpiaWQwSUc1MWJHd2diM0lnZFc1a1pXWnBibVZrWEc0Z0lHUmxabWx1WldRNklIdGNiaUFnSUNCb1pXeHdPaUFuUTJobFkydHpJR2xtSUhSb1pTQjJZV3gxWlNCcGN5QnViM1FnYm5Wc2JDQnZjaUIxYm1SbFptbHVaV1F1Snl4Y2JpQWdJQ0JrWlhOak9pQW5hWE1nWkdWbWFXNWxaQ2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUFrZXlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3dnSVQwZ1lXTjBkV0ZzTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnTHk4Z1EyaGxZMnNnYVdZZ2RHaGxJSFpoYkhWbElHbHpJR1Z0Y0hSNVhHNGdJR1Z0Y0hSNU9pQjdYRzRnSUNBZ2FHVnNjRG9nSjBOb1pXTnJjeUJwWmlCMGFHVWdkbUZzZFdVZ2FYTWdaVzF3ZEhrZ0tHOXlJR2hoY3lCaElHeGxibWQwYUNCdlppQXdLUzRuTEZ4dUlDQWdJR1JsYzJNNklDZHBjeUJsYlhCMGVTY3NYRzRnSUNBZ1ptRnBiRG9nSjNkaGN5QWtleUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHd2dQVDBnWVdOMGRXRnNJSHg4SUdGamRIVmhiQzVzWlc1bmRHZ2dQVDA5SURBN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCdVpXMXdkSGs2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkdWIyNUZiWEIwZVNjZ1hTeGNiaUFnSUNCb1pXeHdPaUFuUTJobFkydHpJR2xtSUhSb1pTQjJZV3gxWlNCcGN5QnViM1FnWlcxd2RIa2dLRzl5SUdoaGN5QmhJR3hsYm1kMGFDQm5jbVZoZEdWeUlIUm9ZVzRnTUNrdUp5eGNiaUFnSUNCa1pYTmpPaUFuYVhNZ2JtOTBJR1Z0Y0hSNUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklDUjdJR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnYm5Wc2JDQWhQU0JoWTNSMVlXd2dKaVlnWVdOMGRXRnNMbXhsYm1kMGFDQStJREE3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0IwY25WMGFIazZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2QwY25WcGMyZ25JRjBzWEc0Z0lDQWdhR1ZzY0RvZ0oxUm9aU0IyWVd4MVpTQnphRzkxYkdRZ1ltVWdkSEoxZEdoNUlDaHViM1FnZFc1a1pXWnBibVZrTENCdWRXeHNMQ0F3TENCY0lsd2lJRzl5SUZ0ZEtTNG5MRnh1SUNBZ0lHUmxjMk02SUNkcGN5QjBjblYwYUhrbkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ0pIc2dZV04wZFdGc0lIMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUdsbUlDZ2hZV04wZFdGc0tTQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSGx3Wlc5bUlHRmpkSFZoYkM1c1pXNW5kR2dnUFQwOUlDZHVkVzFpWlhJbklEOGdZV04wZFdGc0xteGxibWQwYUNBK0lEQWdPaUIwY25WbE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ1ptRnNjM2s2SUh0Y2JpQWdJQ0JvWld4d09pQW5WR2hsSUhaaGJIVmxJSE5vYjNWc1pDQmlaU0JtWVd4emVTQW9kVzVrWldacGJtVmtMQ0J1ZFd4c0xDQXdMQ0JjSWx3aUlHOXlJRnRkS1M0bkxGeHVJQ0FnSUdSbGMyTTZJQ2RwY3lCbVlXeHplU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUI3ZXlCaFkzUjFZV3dnZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJR2xtSUNnaFlXTjBkV0ZzS1NCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGVYQmxiMllnWVdOMGRXRnNMbXhsYm1kMGFDQTlQVDBnSjI1MWJXSmxjaWNnUHlCaFkzUjFZV3d1YkdWdVozUm9JRDA5UFNBd0lEb2dabUZzYzJVN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lDOHZJRTVsWjJGMGFXOXVYRzRnSUc1dmREb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMjV2Snl3Z0owNVBKeXdnSjA1UFZDY2dYU3hjYmlBZ0lDQm9aV3h3T2lBblRtVm5ZWFJsY3lCMGFHVWdjbVZ6ZFd4MElHWnZjaUIwYUdVZ2NtVnpkQ0J2WmlCMGFHVWdaWGh3Y21WemMybHZiaTRuTEZ4dUlDQWdJR1JsYzJNNklDZE9iM1FoSnl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N0lHRmpkSFZoYkNCOWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2h5WlhOdmJIWmxjaWtnZTF4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2h5WlhOdmJIWmxjaTVsZUdoaGRYTjBaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxtWnBibUZzYVhwbEtHWjFibU4wYVc5dUlDaG1hVzVoYkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQWhabWx1WVd3N1hHNGdJQ0FnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ5WlhOdmJIWmxjaWhoWTNSMVlXd3BPMXh1SUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnYVhNNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZGxjWFZoYkNjc0lDZGxjWFZoYkhNbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBOb1pXTnJjeUJ6ZEhKcFkzUWdaWEYxWVd4cGRIa2dZbVYwZDJWbGJpQjBhR1VnZG1Gc2RXVWdZVzVrSUdsMGN5QmxlSEJsWTNSbFpDNG5MRnh1SUNBZ0lDQWdKMDV2ZEdVNklHbG1JSFJvWlNCbGVIQmxZM1JsWkNCMllXeDFaU0JwY3lCaElHTm9ZV2x1SUdWNGNISmxjM05wYjI0Z2FYUmNYQ2RzYkNCaVpTQjBaWE4wWldRZ2FXNXpkR1ZoWkM0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5kRzhnYzNSeWFXTjBiSGtnWlhGMVlXd2dlM3RsZUhCbFkzUmxaSDE5Snl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N1lXTjBkV0ZzZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR1Y0Y0dWamRHVmtLU0I3WEc0Z0lDQWdJQ0F2THlCMGFHbHpJR2x6SUdFZ1ltbDBJR052Ym5SeWFYWmxaQ0JpZFhRZ2FYUWdiV0ZyWlhNZ1ptOXlJSE52YldVZ2JtbGpaU0J6ZVc1MFlYZ2dkRzhnWW1VZ1lXSnNaU0IwYjF4dUlDQWdJQ0FnTHk4Z2RYTmxJQzVwY3lCbWIzSWdjR0Z6YzJsdVp5QnBiaUJsZUhCbFkzUmhkR2x2Ym5OY2JpQWdJQ0FnSUdsbUlDaGhjM011UTJoaGFXNHVhWE5EYUdGcGJpaGxlSEJsWTNSbFpDa3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR1Y0Y0dWamRHVmtMblJsYzNRb1lXTjBkV0ZzS1R0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdGamRIVmhiQ0E5UFQwZ1pYaHdaV04wWldRN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCbGNUb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMlZ4YkNjc0lDZGxjV3h6SnlCZExGeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2REYUdWamEzTWdaR1ZsY0NCdWIyNHRjM1J5YVdOMElHVnhkV0ZzYVhSNUlHSmxkSGRsWlc0Z2RHaGxJSFpoYkhWbElHRnVaQ0JwZEhNZ1pYaHdaV04wWldRdUp5eGNiaUFnSUNBZ0lDZEpkQ0IxYm1SbGNuTjBZVzVrY3lCaGMzTWdaWGh3Y21WemMybHZibk1nYzI4Z2VXOTFJR05oYmlCamIyMWlhVzVsSUhSb1pXMGdZWFFnZDJsc2JDQnBiaUIwYUdVbkxGeHVJQ0FnSUNBZ0oyVjRjR1ZqZEdWa0lIWmhiSFZsTGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJsY1hWaGJDQjdlMlY0Y0dWamRHVmtmWDBuTEZ4dUlDQWdJR1poYVd3NklDZDNZWE1nZTN0aFkzUjFZV3g5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2daWGh3WldOMFpXUXBJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmZMbWx6UlhGMVlXd29ZV04wZFdGc0xDQmxlSEJsWTNSbFpDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJRzFoZEdOb09pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjFSeWFXVnpJSFJ2SUcxaGRHTm9JSFJvWlNCemRXSnFaV04wSUdGbllXbHVjM1FnZEdobElHVjRjR1ZqZEdWa0lIWmhiSFZsSUhkb2FXTm9JR05oYmlCaVpTQmxhWFJvWlhJbkxGeHVJQ0FnSUNBZ0oyRWdablZ1WTNScGIyNHNJR0Z1SUdGemN5QmxlSEJ5WlhOemFXOXVMQ0JoYmlCdlltcGxZM1FnZDJsMGFDQmhJQzUwWlhOMEtDa2dablZ1WTNScGIyNGdLR1p2Y2lBbkxGeHVJQ0FnSUNBZ0oybHVjM1JoYm1ObElHRWdVbVZuUlhod0tTQnZjaUJoSUhCc1lXbHVJRzlpYW1WamRDQjBieUJ3WVhKMGFXRnNiSGtnYldGMFkyZ2dZV2RoYVc1emRDQjBhR1VnZG1Gc2RXVXVKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nSjNSdklHMWhkR05vSUh0N1pYaHdaV04wWldSOWZTY3NYRzRnSUNBZ1ptRnBiRG9nSjNkaGN5QjdlMkZqZEhWaGJIMTlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCbGVIQmxZM1JsWkNrZ2UxeHVYRzRnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JR1Y0Y0dWamRHVmtMblJsYzNRZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUNFaFpYaHdaV04wWldRdWRHVnpkQ2hoWTNSMVlXd3BPMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0JwWmlBb1h5NXBjMUJzWVdsdVQySnFaV04wS0dWNGNHVmpkR1ZrS1NCOGZDQmZMbWx6UVhKeVlYa29aWGh3WldOMFpXUXBJSHg4SUY4dWFYTkJjbWQxYldWdWRITW9aWGh3WldOMFpXUXBLU0I3WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLRzUxYkd3Z1BUMGdZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1UzVndjRzl5ZENCd1lYTnphVzVuSUdCYkxDZG1iMjhuWFdBZ2RHOGdiV1ZoYmlCZ1cyRnpjeTVoYm5rc0lDZG1iMjhuWFdCY2JpQWdJQ0FnSUNBZ2FXWWdLRjh1YVhOQmNuSmhlU2hsZUhCbFkzUmxaQ2tnZkh3Z1h5NXBjMEZ5WjNWdFpXNTBjeWhsZUhCbFkzUmxaQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQmxlSEJsWTNSbFpDQTlJRjh1YldGd0tHVjRjR1ZqZEdWa0xDQm1kVzVqZEdsdmJpQW9kaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIUjVjR1Z2WmlCMklEMDlQU0FuZFc1a1pXWnBibVZrSnlBL0lHRnpjeTVoYm5rZ09pQjJPMXh1SUNBZ0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1ZFOUVUem9nU1dSbFlXeHNlU0IzWlNCemFHOTFiR1FnWENKbWIzSnJYQ0lnZEdobElISmxjMjlzZG1WeUlITnZJSGRsSUdOaGJpQnpkWEJ3YjNKMFhHNGdJQ0FnSUNBZ0lDOHZJQ0FnSUNBZ0lHRnplVzVqSUhSbGMzUnpJR0Z1WkNCaGJITnZJSEJ5YjNacFpHVWdZbVYwZEdWeUlHWmhhV3gxY21VZ2JXVnpjMkZuWlhNdVhHNGdJQ0FnSUNBZ0lDOHZJQ0FnSUNBZ0lGVnVabTl5ZEhWdVlYUmxiSGtnZEdobElHTjFjbkpsYm5RZ1ptOXlhMmx1WnlCdFpXTm9ZVzVwYzIwZ1pHOWxjMjRuZENCM2IzSnJYRzRnSUNBZ0lDQWdJQzh2SUNBZ0lDQWdJR1p2Y2lCMGFHbHpJSFZ6WlNCallYTmxJSE5wYm1ObElIZGxJRzVsWldRZ2RHOGdZM0psWVhSbElHNWxkeUJqYUdGcGJuTWdabTl5WEc0Z0lDQWdJQ0FnSUM4dklDQWdJQ0FnSUdWaFkyZ2daWGh3WldOMFpXUWdhMlY1TGx4dUlDQWdJQ0FnSUNCMllYSWdabUZwYkhWeVpTQTlJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lGOG9aWGh3WldOMFpXUXBMbVYyWlhKNUtHWjFibU4wYVc5dUlDaDJZV3gxWlN3Z2EyVjVLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0ZmTG1oaGN5aGhZM1IxWVd3c0lHdGxlU2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1poYVd4MWNtVWdQU0FuYTJWNUlGd2lKeUFySUd0bGVTQXJJQ2RjSWlCdWIzUWdabTkxYm1RZ2FXNGdlM3RoWTNSMVlXeDlmU2M3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tDRmZMbWx6UlhGMVlXd29ZV04wZFdGc1cydGxlVjBzSUhaaGJIVmxLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdabUZwYkhWeVpTQTlJQ2RyWlhrZ1hDSW5JQ3NnYTJWNUlDc2dKMXdpSUdSdlpYTWdibTkwSUcxaGRHTm9JSHQ3WVdOMGRXRnNXMXdpSnlBcklHdGxlU0FySUNkY0lsMTlmU2M3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJtWVdsc2RYSmxPMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdWNGNHVmpkR1ZrSUNFOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFuWlhod1pXTjBaV1FnYVhNZ2JtOTBJR0VnWm5WdVkzUnBiMjRnWVc1a0lHUnZaWE1nYm05MElHaGhkbVVnWVNBdWRHVnpkQ0J0WlhSb2IyUW5PMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdJU0ZsZUhCbFkzUmxaQ2hoWTNSMVlXd3BPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0JoWW05MlpUb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMmQwSnl3Z0oyMXZjbVZVYUdGdUp5d2dKMmR5WldGMFpYSlVhR0Z1SnlCZExGeHVJQ0FnSUdobGJIQTZJQ2REYUdWamEzTWdhV1lnZEdobElIWmhiSFZsSUdseklHaHBaMmhsY2lCMGFHRnVJR2wwY3lCbGVIQmxZM1JsWkM0bkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQnRiM0psSUhSb1lXNGdlM3RsZUhCbFkzUmxaSDE5Snl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N1lXTjBkV0ZzZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR1Y0Y0dWamRHVmtLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZV04wZFdGc0lENGdaWGh3WldOMFpXUTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJR0psYkc5M09pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5iSFFuTENBbmJHVnpjMVJvWVc0bklGMHNYRzRnSUNBZ2FHVnNjRG9nSjBOb1pXTnJjeUJwWmlCMGFHVWdkbUZzZFdVZ2FYTWdiRzkzWlhJZ2RHaGhJR2wwY3lCbGVIQmxZM1JsWkM0bkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQnNaWE56SUhSb1lXNGdlM3RsZUhCbFkzUmxaSDE5Snl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N1lXTjBkV0ZzZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR1Y0Y0dWamRHVmtLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZV04wZFdGc0lEd2daWGh3WldOMFpXUTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJR0ZpYjNabFQzSkZjWFZoYkRvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oyeGxZWE4wSnl3Z0oyRjBUR1ZoYzNRbkxDQW5aM1JsSnl3Z0oyMXZjbVZVYUdGdVQzSkZjWFZoYkNjc0lDZG5jbVZoZEdWeVZHaGhiazl5UlhGMVlXd25JRjBzWEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05yY3lCcFppQjBhR1VnZG1Gc2RXVWdhWE1nYUdsbmFHVnlJRzl5SUdWeGRXRnNJSFJvWVc0Z2FYUnpJR1Y0Y0dWamRHVmtMaWNzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUcxdmNtVWdkR2hoYmlCdmNpQmxjWFZoYkNCMGJ5QWtlMlY0Y0dWamRHVmtmU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUI3ZTJGamRIVmhiSDE5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBK1BTQmxlSEJsWTNSbFpEdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdZbVZzYjNkUGNrVnhkV0ZzT2lCN1hHNGdJQ0FnWVd4cFlYTmxjem9nV3lBbmJXOXpkQ2NzSUNkaGRFMXZjM1FuTENBbmJIUmxKeXdnSjJ4bGMzTlVhR0Z1VDNKRmNYVmhiQ2NnWFN4Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJ0eklHbG1JSFJvWlNCMllXeDFaU0JwY3lCc2IzZGxjaUJ2Y2lCbGNYVmhiQ0IwYUdGdUlHbDBjeUJsZUhCbFkzUmxaQzRuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCc1pYTnpJSFJvWVc0Z2IzSWdaWEYxWVd3Z2RHOGdKSHRsZUhCbFkzUmxaSDBuTEZ4dUlDQWdJR1poYVd3NklDZDNZWE1nSkh0aFkzUjFZV3g5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBOFBTQmxlSEJsWTNSbFpEdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdZMnh2YzJVNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZGpiRzl6WlZSdkp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkRGFHVmphM01nYVdZZ2RHaGxJSFpoYkhWbElHbHpJR05zYjNObElIUnZJSFJvWlNCbGVIQmxZM1JsWkNCaVlYTmxaQ0J2YmlCaElHZHBkbVZ1SUdSbGJIUmhMaWNzWEc0Z0lDQWdJQ0FuVkdobElHUmxabUYxYkhRZ1pHVnNkR0VnYVhNZ01DNHhJSE52SUhSb1pTQjJZV3gxWlNBekxqVTFJR2x6SUdOc2IzTmxJSFJ2SUdGdWVTQjJZV3gxWlNCaVpYUjNaV1Z1Snl4Y2JpQWdJQ0FnSUNjekxqUTFJR0Z1WkNBekxqWTFJQ2hpYjNSb0lHbHVZMngxYzJsMlpTa3VKeXhjYmlBZ0lDQWdJQ2RUZEhKcGJtY2dkbUZzZFdWeklHRnlaU0JoYkhOdklITjFjSEJ2Y25SbFpDQmllU0JqYjIxd2RYUnBibWNnZEdobElHUnBjM1JoYm1ObElHSmxkSGRsWlc0Z2RHaGxiU2NzWEc0Z0lDQWdJQ0FuZFhOcGJtY2dkR2hsSUZOcFpuUTBJR0ZzWjI5eWFYUm9iUzRnUm05eUlITjBjbWx1WnlCMllXeDFaWE1nZEdobElHUmxiSFJoSUdseklHbHVkR1Z5Y0hKbGRHVmtJR0Z6Snl4Y2JpQWdJQ0FnSUNkaElIQmxjbU5sYm5SaFoyVWdLR2xsT2lBd0xqSTFJR2x6SURJMUpTa3VKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJR05zYjNObElIUnZJSHQ3SUdWNGNHVmpkR1ZrSUgxOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdJR0ZqZEhWaGJDQjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z1pYaHdaV04wWldRc0lHUmxiSFJoS1NCN1hHNGdJQ0FnSUNCa1pXeDBZU0E5SUc1MWJHd2dQVDBnWkdWc2RHRWdQeUF3TGpFZ09pQmtaV3gwWVR0Y2JseHVJQ0FnSUNBZ0x5OGdVM1Z3Y0c5eWRDQnpkSEpwYm1keklHSjVJR052YlhCMWRHbHVaeUIwYUdWcGNpQmthWE4wWVc1alpWeHVJQ0FnSUNBZ2FXWWdLRjh1YVhOVGRISnBibWNvWVdOMGRXRnNLU0FtSmlCZkxtbHpVM1J5YVc1bktHVjRjR1ZqZEdWa0tTa2dlMXh1SUNBZ0lDQWdJQ0IyWVhJZ1pHbG1aaUE5SUhWMGFXd3VjMmxtZERRb1lXTjBkV0ZzTENCbGVIQmxZM1JsWkN3Z015a2dMeUJOWVhSb0xtMWhlQ2hoWTNSMVlXd3ViR1Z1WjNSb0xDQmxlSEJsWTNSbFpDNXNaVzVuZEdncE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1pHbG1aaUE4UFNCa1pXeDBZVHRjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnY21WMGRYSnVJR0ZqZEhWaGJDQStQU0JsZUhCbFkzUmxaQ0F0SUdSbGJIUmhJQ1ltSUdGamRIVmhiQ0E4UFNCbGVIQmxZM1JsWkNBcklHUmxiSFJoTzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCcGJuTjBZVzVqWlc5bU9pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5hVzV6ZEdGdVkyVlBaaWNzSUNkcGJuTjBZVzVqWlNjc0lDZHBjMkVuSUYwc1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKME5vWldOcmN5QnBaaUIwYUdVZ2RtRnNkV1VnYVhNZ1lXNGdhVzV6ZEdGdVkyVWdiMllnZEdobElHZHBkbVZ1SUdOdmJuTjBjblZqZEc5eUxpY3NYRzRnSUNBZ0lDQW5WMmhsYmlCMGFHVWdaWGh3WldOMFpXUWdhWE1nWVNCemRISnBibWNnYVhSY1hDZHNiQ0JoWTNSMVlXeHNlU0IxYzJVZ1lTQmdkSGx3Wlc5bVlDY3NYRzRnSUNBZ0lDQW5ZMjl0Y0dGeWFYTnZiaTRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbmRHOGdZbVVnWVc0Z2FXNXpkR0Z1WTJVZ2IyWWdlM3RsZUhCbFkzUmxaSDE5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdhV1lnS0Y4dWFYTlRkSEpwYm1jb1pYaHdaV04wWldRcEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBlWEJsYjJZZ1lXTjBkV0ZzSUQwOVBTQmxlSEJsWTNSbFpDQS9JSFJ5ZFdVZ09pQW5hR0ZrSUhSNWNHVWdlM3NnZEhsd1pXOW1JR0ZqZEhWaGJDQjlmU2M3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZV04wZFdGc0lHbHVjM1JoYm1ObGIyWWdaWGh3WldOMFpXUTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJSFI1Y0dWdlpqb2dlMXh1SUNBZ0lHaGxiSEE2SUNkRGFHVmphM01nYVdZZ2RHaGxJSFpoYkhWbElHbHpJRzltSUdFZ2MzQmxZMmxtYVdNZ2RIbHdaU2NzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR2hoZG1VZ2RIbHdaU0I3ZTJWNGNHVmpkR1ZrZlgwbkxGeHVJQ0FnSUdaaGFXdzZJQ2RvWVdRZ0pIc2dkSGx3Wlc5bUlHRmpkSFZoYkNCOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRjh1YVhORmNYVmhiQ2gwZVhCbGIyWWdZV04wZFdGc0xDQmxlSEJsWTNSbFpDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnVkVzFpWlhJNklIdGNiaUFnSUNCb1pXeHdPaUFuUTJobFkyc2dhV1lnZEdobElIWmhiSFZsSUdseklHRWdiblZ0WW1WeUlDaGthV1ptWlhKbGJuUWdiMllnVG1GT0tTNG5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0JoSUc1MWJXSmxjaWNzWEc0Z0lDQWdabUZwYkRvZ0oyaGhaQ0IwZVhCbElDUjdJSFI1Y0dWdlppQmhZM1IxWVd3Z2ZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRjh1YVhOT2RXMWlaWElvWVdOMGRXRnNLU0FtSmlBaGFYTk9ZVTRvWVdOMGRXRnNLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJR0p2YjJ3NklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZGliMjlzWldGdUp5QmRMRnh1SUNBZ0lHaGxiSEE2SUNkRGFHVmpheUJwWmlCMGFHVWdkbUZzZFdVZ2FYTWdZU0JpYjI5c1pXRnVMaWNzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUdFZ1ltOXZiR1ZoYmljc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTkNiMjlzWldGdUtHRmpkSFZoYkNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCemRISnBibWM2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkemRISW5JRjBzWEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUdsbUlIUm9aU0IyWVd4MVpTQnBjeUJoSUhOMGNtbHVaeTRuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCaElITjBjbWx1Wnljc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTlRkSEpwYm1jb1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUc5aWFtVmpkRG9nZTF4dUlDQWdJR2hsYkhBNklDZERhR1ZqYXlCMGFHRjBJSFpoYkhWbElHbHpJRzltSUhSNWNHVWdiMkpxWldOMExpY3NYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJR0Z1SUc5aWFtVmpkQ2NzWEc0Z0lDQWdabUZwYkRvZ0oyaGhaQ0IwZVhCbElDUjdJSFI1Y0dWdlppQmhZM1IxWVd3Z2ZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRjh1YVhOUFltcGxZM1FvWVdOMGRXRnNLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJSEJzWVdsdVQySnFaV04wT2lCN1hHNGdJQ0FnWVd4cFlYTmxjem9nV3lBbmNHeGhhVzRuTENBbmIySnFKeUJkTEZ4dUlDQWdJR2hsYkhBNklDZERhR1ZqYTNNZ2RHaGhkQ0IyWVd4MVpTQnBjeUJoYmlCdlltcGxZM1FnWTNKbFlYUmxaQ0JpZVNCMGFHVWdUMkpxWldOMElHTnZibk4wY25WamRHOXlMaWNzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUFrZTJGamRIVmhiSDBuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCZkxtbHpVR3hoYVc1UFltcGxZM1FvWVdOMGRXRnNLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJR0Z5Y21GNU9pQjdYRzRnSUNBZ2FHVnNjRG9nSjBOb1pXTnJJSFJvWVhRZ2RtRnNkV1VnYVhNZ1lXNGdRWEp5WVhrdUp5eGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdZVzRnUVhKeVlYa25MRnh1SUNBZ0lHWmhhV3c2SUNkb1lXUWdkSGx3WlNBa2V5QjBlWEJsYjJZZ1lXTjBkV0ZzSUgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmZMbWx6UVhKeVlYa29ZV04wZFdGc0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHWjFibU4wYVc5dU9pQjdYRzRnSUNBZ2FHVnNjRG9nSjBOb1pXTnJJSFJvWVhRZ2RtRnNkV1VnYVhNZ1lTQkdkVzVqZEdsdmJpNG5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0JoSUVaMWJtTjBhVzl1Snl4Y2JpQWdJQ0JtWVdsc09pQW5hR0ZrSUhSNWNHVWdKSHNnZEhsd1pXOW1JR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWHk1cGMwWjFibU4wYVc5dUtHRmpkSFZoYkNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCeVpXZGxlSEE2SUh0Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJzZ2RHaGhkQ0IyWVd4MVpTQnBjeUJoSUZKbFowVjRjQ2NzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUdFZ1VtVm5SWGh3Snl4Y2JpQWdJQ0JtWVdsc09pQW5hR0ZrSUhSNWNHVWdKSHNnZEhsd1pXOW1JR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWHk1cGMxSmxaMFY0Y0NoaFkzUjFZV3dwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnWkdGMFpUb2dlMXh1SUNBZ0lHaGxiSEE2SUNkRGFHVmpheUIwYUdGMElIWmhiSFZsSUdseklHRWdSR0YwWlNjc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHRWdSR0YwWlNjc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTkVZWFJsS0dGamRIVmhiQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0JsYkdWdFpXNTBPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUhSb1lYUWdkbUZzZFdVZ2FYTWdZU0JFVDAwZ1pXeGxiV1Z1ZENjc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHRWdSRTlOSUdWc1pXMWxiblFuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCZkxtbHpSV3hsYldWdWRDaGhZM1IxWVd3cE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ1pYSnliM0k2SUh0Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJzZ2RHaGhkQ0IyWVd4MVpTQnBjeUJoYmlCbGNuSnZjaUFvYjNJZ2JHOXZhM01nYkdsclpTQnBkQ2tuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCaGJpQkZjbkp2Y2ljc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdhV1lnS0dGamRIVmhiQ0JwYm5OMFlXNWpaVzltSUVWeWNtOXlLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTlBZbXBsWTNRb1lXTjBkV0ZzS1NBbUppQmZMbWx6VTNSeWFXNW5LR0ZqZEhWaGJDNXVZVzFsS1NBbUppQmZMbWx6VTNSeWFXNW5LR0ZqZEhWaGJDNXRaWE56WVdkbEtUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdkVzVrWldacGJtVmtPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUhSb1lYUWdkbUZzZFdVZ2FYTWdkVzVrWldacGJtVmtMaWNzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUhWdVpHVm1hVzVsWkNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lBa2V5QmhZM1IxWVd3Z2ZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRjh1YVhOVmJtUmxabWx1WldRb1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUc1MWJHdzZJSHRjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnNnZEdoaGRDQjJZV3gxWlNCcGN5QnVkV3hzTGljc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHNTFiR3duTEZ4dUlDQWdJR1poYVd3NklDZDNZWE1nSkhzZ1lXTjBkV0ZzSUgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmhZM1IxWVd3Z1BUMDlJRzUxYkd3N1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCT1lVNDZJSHRjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnNnZEdoaGRDQjJZV3gxWlNCcGN5Qk9ZVTR1Snl4Y2JpQWdJQ0JrWlhOak9pQW5kRzhnWW1VZ1RtRk9KeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCcFppQW9YeTVwYzA1MWJXSmxjaWhoWTNSMVlXd3BLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVabUZwYkNBOUlDZDNZWE1nSkh0aFkzUjFZV3g5Snp0Y2JpQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVabUZwYkNBOUlDZG9ZV1FnZEhsd1pTQWtlM1I1Y0dWdlppQmhZM1IxWVd4OUp6dGNiaUFnSUNBZ0lIMWNiaUFnSUNBZ0lISmxkSFZ5YmlCcGMwNWhUaWhoWTNSMVlXd3BPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdkSEoxWlRvZ2UxeHVJQ0FnSUdobGJIQTZJQ2REYUdWamF5QjBhR0YwSUhaaGJIVmxJR2x6SUhSeWRXVW5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0IwY25WbEp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdJR0ZqZEhWaGJDQjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2FXWWdLRjh1YVhOQ2IyOXNaV0Z1S0dGamRIVmhiQ2twSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdGamRIVmhiQ0EvSUhSeWRXVWdPaUFuZDJGeklIdDdZV04wZFdGc2ZYMG5PMXh1SUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDZG9ZV1FnZEhsd1pTQWtlM1I1Y0dWdlppQmhZM1IxWVd4OUp6dGNiaUFnSUNBZ0lIMWNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHWmhiSE5sT2lCN1hHNGdJQ0FnYUdWc2NEb2dKME5vWldOcklIUm9ZWFFnZG1Gc2RXVWdhWE1nWm1Gc2MyVW5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0JtWVd4elpTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tGOHVhWE5DYjI5c1pXRnVLR0ZqZEhWaGJDa3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJQ0ZoWTNSMVlXd2dQeUIwY25WbElEb2dKM2RoY3lCN2UyRmpkSFZoYkgxOUp6dGNiaUFnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBbmFHRmtJSFI1Y0dVZ0pIdDBlWEJsYjJZZ1lXTjBkV0ZzZlNjN1hHNGdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lISmhhWE5sY3pvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0ozUm9jbTkzY3ljZ1hTeGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuUTJobFkydHpJSFJvWVhRZ1pYaGxZM1YwYVc1bklIUm9aU0IyWVd4MVpTQnlaWE4xYkhSeklHbHVJR0Z1SUdWNFkyVndkR2x2YmlCaVpXbHVaeUIwYUhKdmQyNHVKeXhjYmlBZ0lDQWdJQ2RVYUdVZ1kyRndkSFZ5WldRZ1pYaGpaWEIwYVc5dUlIWmhiSFZsSUdseklIVnpaV1FnZEc4Z2JYVjBZWFJsSUhSb1pTQnpkV0pxWldOMElHWnZjaUIwYUdVbkxGeHVJQ0FnSUNBZ0oyWnZiR3h2ZDJsdVp5QmxlSEJsWTNSaGRHbHZibk11SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0ozUm9jbTkzY3lCaGJpQmxjbkp2Y2ljc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2daWGh3WldOMFpXUXBJSHRjYmlBZ0lDQWdJR2xtSUNnaFh5NXBjMFoxYm1OMGFXOXVLR0ZqZEhWaGJDa3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJQ2RwY3lCdWIzUWdZU0JtZFc1amRHbHZiam9nZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0FnSUdGamRIVmhiQ2dwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnSjJScFpDQnViM1FnZEdoeWIzY2dZVzU1ZEdocGJtY25PMXh1SUNBZ0lDQWdmU0JqWVhSamFDQW9aU2tnZTF4dUlDQWdJQ0FnSUNCcFppQW9iblZzYkNBOVBTQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNobEtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JwWmlBb1h5NXBjMFoxYm1OMGFXOXVLR1Y0Y0dWamRHVmtLU0FtSmlCbElHbHVjM1JoYm1ObGIyWWdaWGh3WldOMFpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1pTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnYVdZZ0tGOHVhWE5GY1hWaGJDaGxMQ0JsZUhCbFkzUmxaQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9aU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQXZMeUJCZFdkdFpXNTBJSFJvWlNCbGVIQmxZM1JoZEdsdmJpQnZZbXBsWTNRZ2QybDBhQ0JoSUc1bGR5QjBaVzF3YkdGMFpTQjJZWEpwWVdKc1pWeHVJQ0FnSUNBZ0lDQjBhR2x6TG1WNFkyVndkR2x2YmlBOUlHVTdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQW5aMjkwSUh0N0lHVjRZMlZ3ZEdsdmJpQjlmU2M3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUdoaGN6b2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMmhoZG1VbkxDQW5ZMjl1ZEdGcGJpY3NJQ2RqYjI1MFlXbHVjeWNnWFN4Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5RMmhsWTJzZ2FXWWdkR2hsSUhaaGJIVmxJR2hoY3lCemIyMWxJR1Y0Y0dWamRHVmtJSFpoYkhWbExpQkpkQ0IxYm1SbGNuTjBZVzVrY3lCbGVIQmxZM1JsWkNjc1hHNGdJQ0FnSUNBblkyaGhhVzRnWlhod2NtVnpjMmx2Ym5NZ2MyOGdkR2hwY3lCelpYSjJaWE1nWVhNZ2RHaGxJR1Z4ZFdsMllXeGxiblFnYjJZZ0xtVnhJR1p2Y2lCd1lYSjBhV0ZzSnl4Y2JpQWdJQ0FnSUNkdFlYUmphR1Z6TGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJqYjI1MFlXbHVJSHQ3Wlhod1pXTjBaV1I5ZlNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lCN2UyRmpkSFZoYkgxOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JoY21jeElDOHFMQ0F1TGk0Z0tpOHBJSHRjYmx4dUlDQWdJQ0FnTHk4Z1lXeHNiM2NnYlhWc2RHbHdiR1VnWlhod1pXTjBaV1FnZG1Gc2RXVnpYRzRnSUNBZ0lDQjJZWElnWlhod1pXTjBaV1FnUFNCZkxuUnZRWEp5WVhrb1lYSm5kVzFsYm5SektTNXpiR2xqWlNneEtUdGNiaUFnSUNBZ0lIUm9hWE11Wlhod1pXTjBaV1FnUFNCbGVIQmxZM1JsWkM1c1pXNW5kR2dnUFQwOUlERWdQeUJsZUhCbFkzUmxaRnN3WFNBNklHVjRjR1ZqZEdWa08xeHVYRzRnSUNBZ0lDQnBaaUFvSVY4dWFYTlRkSEpwYm1jb1lXTjBkV0ZzS1NBbUppQWhYeTVwYzBGeWNtRjVLR0ZqZEhWaGJDa2dKaVlnSVY4dWFYTlBZbXBsWTNRb1lXTjBkV0ZzS1NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0oyZHZkQ0I3ZTJGamRIVmhiSDE5Snp0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dVpYWmxjbmtvWlhod1pXTjBaV1FzSUdaMWJtTjBhVzl1SUNobGVIQmxZM1JsWkNrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvWHk1cGMxTjBjbWx1WnloaFkzUjFZV3dwSUNZbUlGOHVhWE5UZEhKcGJtY29aWGh3WldOMFpXUXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUMweElDRTlQU0JoWTNSMVlXd3VhVzVrWlhoUFppaGxlSEJsWTNSbFpDazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCcFppQW9YeTVwYzBGeWNtRjVLR0ZqZEhWaGJDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBdkx5QlVUMFJQT2lCSmMyNG5kQ0IwYUdWeVpTQmhiaUJsWVhOcFpYSWdkMkY1SUhSdklIUmxjM1FnZEdocGN5QjFjMmx1WnlCc2IyUmhjMmdnYjI1c2VUOWNiaUFnSUNBZ0lDQWdJQ0JwWmlBb0lXRnpjeTVEYUdGcGJpNXBjME5vWVdsdUtHVjRjR1ZqZEdWa0tTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pYaHdaV04wWldRZ1BTQmhjM011WlhFb1pYaHdaV04wWldRcE8xeHVJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnTFRFZ0lUMDlJRjh1Wm1sdVpFbHVaR1Y0S0dGamRIVmhiQ3dnWlhod1pXTjBaV1FwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdMeThnU0dGamF6b2dRMjl0Y0dGeVpTQnZZbXBsWTNSeklIZHBkR2dnTG5kb1pYSmxJR0o1SUdacGJIUmxjbWx1WnlCaElIZHlZWEJ3WlhJZ1lYSnlZWGxjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJREVnUFQwOUlGOHVkMmhsY21Vb1cyRmpkSFZoYkYwc0lHVjRjR1ZqZEdWa0tTNXNaVzVuZEdnN1hHNGdJQ0FnSUNCOUtUdGNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHaGhjMDkzYmpvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oyaGhjMHRsZVNjc0lDZG9ZWE5KYm1SbGVDY2dYU3hjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblEyaGxZMnNnYVdZZ2RHaGxJSFpoYkhWbElHaGhjeUJ2Ym1VZ2IzSWdiVzl5WlNCdmQyNGdjSEp2Y0dWeWRHbGxjeUJoY3lCa1pXWnBibVZrSUdKNUp5eGNiaUFnSUNBZ0lDZDBhR1VnWjJsMlpXNGdZWEpuZFcxbGJuUnpMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNkMGJ5Qm9ZWFpsSUc5M2JpQndjbTl3WlhKMGVTQWtleUJsZUhCbFkzUmxaQ0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdhV1lnS0NGZkxtbHpUMkpxWldOMEtHRmpkSFZoYkNrcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDZDNZWE1nZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lIUm9hWE11Wm1GcGJDQTlJQ2R2Ym14NUlHaGhaQ0I3ZXlCZkxtdGxlWE1vWVdOMGRXRnNLU0I5ZlNjN1hHNWNiaUFnSUNBZ0lDOHZJRlJQUkU4NklFOW1abVZ5SUdKbGRIUmxjaUJtWVdsc2RYSmxJRzFsYzNOaFoyVmNiaUFnSUNBZ0lIWmhjaUJoY21keklEMGdYeTUwYjBGeWNtRjVLR0Z5WjNWdFpXNTBjeWt1YzJ4cFkyVW9NU2s3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdYeTVsZG1WeWVTaGhjbWR6TENCbWRXNWpkR2x2YmlBb2VDa2dleUJ5WlhSMWNtNGdYeTVvWVhNb1lXTjBkV0ZzTENCNEtUc2dmU2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUd4dlp6b2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkRWRXMXdjeUIwYUdVZ2NtVmpaV2wyWldRZ2RtRnNkV1VnZEc4Z2RHaGxJR052Ym5OdmJHVXVKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nYm5Wc2JDeGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0JqYjI1emIyeGxMbXh2WnlnblcwRlRVMTBuTENCaFkzUjFZV3dwTzF4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCa2RXMXdPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owUjFiWEJ6SUhSb1pTQnlaV05sYVhabFpDQjJZV3gxWlNCMGJ5QjBhR1VnWTI5dWMyOXNaU0JoY0hCc2VXbHVaeUIwYUdVZ1oybDJaVzRnZEdWdGNHeGhkR1V1Snl4Y2JpQWdJQ0FnSUNkT2IzUmxPaUJWYzJVZ0pIdDBhR2x6ZlNCMGJ5QnBiblJsY25CdmJHRjBaU0IwYUdVZ2QyaHZiR1VnZG1Gc2RXVXVKeXhjYmlBZ0lDQWdJQ2RUWldVNklHaDBkSEJ6T2k4dmJHOWtZWE5vTG1OdmJTOWtiMk56STNSbGJYQnNZWFJsSjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ2JuVnNiQ3hjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCMGNHd3BJSHRjYmlBZ0lDQWdJSFpoY2lCeVpYTjFiSFFnUFNCMWRHbHNMblJsYlhCc1lYUmxMbU5oYkd3b1lXTjBkV0ZzTENCMGNHd3NJR0ZqZEhWaGJDazdYRzRnSUNBZ0lDQmpiMjV6YjJ4bExteHZaeWh5WlhOMWJIUXBPMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0JrWldKMVoyZGxjam9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZElZV3gwY3lCelkzSnBjSFFnWlhobFkzVjBhVzl1SUdKNUlIUnlhV2RuWlhKcGJtY2dkR2hsSUdsdWRHVnlZV04wYVhabElHUmxZblZuWjJWeUxpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJRzUxYkd3c1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdaR1ZpZFdkblpYSTdYRzRnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnZEdGd09pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5abTRuSUYwc1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKME5oYkd4eklIUm9aU0J3Y205MmFXUmxaQ0JtZFc1amRHbHZiaUIzYVhSb0lIUm9aU0JqZFhKeVpXNTBJSFpoYkhWbElHRnpJR0Z5WjNWdFpXNTBMaWNzWEc0Z0lDQWdJQ0FuU1dZZ2RHaGxJR1oxYm1OMGFXOXVJSEpsZEhWeWJuTWdjMjl0WlhSb2FXNW5JR1JwWm1abGNtVnVkQ0IwYnlBcWRXNWtaV1pwYm1Wa0tpQjBhR1VuTEZ4dUlDQWdJQ0FnSjJWNGNISmxjM05wYjI0Z2QybHNiQ0JtYjNKcklIUnZJRzl3WlhKaGRHVWdiMjRnZEdobElISmxkSFZ5Ym1Wa0lIWmhiSFZsTGljc1hHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5ZMkZzYkNCN2UyRnlaekY5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2dabTRwSUh0Y2JpQWdJQ0FnSUhaaGNpQnlaWE4xYkhRZ1BTQm1iaWhoWTNSMVlXd3BPMXh1SUNBZ0lDQWdhV1lnS0hSNWNHVnZaaUJ5WlhOMWJIUWdJVDA5SUNkMWJtUmxabWx1WldRbktTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2h5WlhOMWJIUXBPMXh1SUNBZ0lDQWdmVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0J1YjNScFpuazZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblUybHRhV3hoY2lCMGJ5QXVkR0Z3S0NrZ1luVjBJR2wwSUhkdmJseGNKM1FnY0dGemN5QjBhR1VnWTNWeWNtVnVkQ0IyWVd4MVpTQmhjeUJoY21kMWJXVnVkQ3duTEZ4dUlDQWdJQ0FnSjJsdWMzUmxZV1FnYVhRZ2QybHNiQ0JpWlNCd2NtOTJhV1JsWkNCaGN5QjBhR1VnWUhSb2FYTmdJR052Ym5SbGVIUWdkMmhsYmlCd1pYSm1iM0p0YVc1bklIUm9aU2NzWEc0Z0lDQWdJQ0FuWTJGc2JDNGdWR2hwY3lCaGJHeHZkM01nYVhRZ2RHOGdZbVVnZFhObFpDQjNhWFJvSUhSbGMzUWdjblZ1Ym1WeWN5QmdaRzl1WldBZ2MzUjViR1VnWTJGc2JHSmhZMnR6TGljc1hHNGdJQ0FnSUNBblRtOTBaU0IwYUdGMElHbDBJSGRwYkd3Z2JtVnBkR2hsY2lCdGRYUmhkR1VnZEdobElIWmhiSFZsSUdWMlpXNGdhV1lnYVhRZ2NtVjBkWEp1Y3lCemIyMWxkR2hwYm1jdUoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKMjV2ZEdsbWVTQjdlMkZ5WnpGOWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnWm00cElIdGNiaUFnSUNBZ0lHWnVMbU5oYkd3b1lXTjBkV0ZzS1R0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQnphWHBsT2lCN1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMFp2Y210eklIUm9aU0JsZUhCbFkzUmhkR2x2YmlCMGJ5QnZjR1Z5WVhSbElHOXVJSFJvWlNCemFYcGxJRzltSUhSb1pTQmpkWEp5Wlc1MElIWmhiSFZsTGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZG5aWFFnYzJsNlpTY3NYRzRnSUNBZ1ptRnBiRG9nSjI1dmRDQm9ZWE1nWVNCc1pXNW5kR2c2SUh0N0lHRmpkSFZoYkNCOWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tGOHVhWE5QWW1wbFkzUW9ZV04wZFdGc0tTQjhmQ0JmTG1selFYSnlZWGtvWVdOMGRXRnNLU0I4ZkNCZkxtbHpVM1J5YVc1bktHRmpkSFZoYkNrcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLRjh1YzJsNlpTaGhZM1IxWVd3cEtUdGNiaUFnSUNBZ0lIMWNibHh1SUNBZ0lDQWdjbVYwZFhKdUlHWmhiSE5sTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnY0hKdmNEb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMnRsZVNjc0lDZHdjbTl3WlhKMGVTY2dYU3hjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblJtOXlhM01nZEdobElHVjRjR1ZqZEdGMGFXOXVJSFJ2SUc5d1pYSmhkR1VnYjI0Z2IyNWxJRzltSUhSb1pTQjJZV3gxWlNCd2NtOXdaWEowYVdWekxpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2RuWlhRZ2NISnZjR1Z5ZEhrZ2Uzc2dZWEpuTVNCOWZTY3NYRzRnSUNBZ1ptRnBiRG9nSjNkaGN5QnViM1FnWm05MWJtUWdiMjRnZTNzZ1lXTjBkV0ZzSUgxOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JyWlhrcElIdGNiaUFnSUNBZ0lHbG1JQ2hmTG1selQySnFaV04wS0dGamRIVmhiQ2twSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLR3RsZVNCcGJpQmhZM1IxWVd3cElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWVdOMGRXRnNXMnRsZVYwcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnZEdocGN5NXJaWGx6SUQwZ1cxMDdYRzRnSUNBZ0lDQWdJRjh1Wm05eVNXNG9ZV04wZFdGc0xDQm1kVzVqZEdsdmJpQW9kaXdnYXlrZ2V5QjBhR2x6TG10bGVYTXVjSFZ6YUNocktUc2dmU3dnZEdocGN5azdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQW5kMkZ6SUc1dmRDQm1iM1Z1WkNCcGJpQnJaWGx6SUh0N0lHdGxlWE1nZlgwbk8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2NtVjBkWEp1SUNkbmIzUWdlM3RoWTNSMVlXeDlmU2M3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0JoZERvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oybHVaR1Y0SnlCZExGeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2ROZFhSaGRHVnpJSFJvWlNCMllXeDFaU0IwYnlCdmNHVnlZWFJsSUc5dUlHOXVaU0J2WmlCMGFHVWdhVzVrWlhobFpDQmxiR1Z0Wlc1MGN5NGdTV1luTEZ4dUlDQWdJQ0FnSjIxMWJIUnBjR3hsSUdsdVpHVjRaWE1nWVhKbElIQnliM1pwWkdWa0lHRnVJR0Z5Y21GNUlHbHpJR052YlhCdmMyVmtJSGRwZEdnZ2RHaGxiUzRuTEZ4dUlDQWdJQ0FnSjA1dmRHVTZJRWwwSUhOMWNIQnZjblJ6SUc1bFoyRjBhWFpsSUdsdVpHVjRaWE1uWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbloyVjBJR2x1WkdWNElDUjdJR0Z5WjNNdWFtOXBiaWhjSWl3Z1hDSXBJSDBuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lHbHVaR1Y0S1NCN1hHNGdJQ0FnSUNCcFppQW9JVjh1YVhOQmNuSmhlU2hoWTNSMVlXd3BJQ1ltSUNGZkxtbHpVM1J5YVc1bktHRmpkSFZoYkNrcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDZHViM1FnWVc0Z1lYSnlZWGtnYjNJZ1lTQnpkSEpwYm1jNklDUjdZV04wZFdGc2ZTYzdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSFpoY2lCcGJtUmxlR1Z6SUQwZ1h5NTBiMEZ5Y21GNUtHRnlaM1Z0Wlc1MGN5a3VjMnhwWTJVb01TazdYRzRnSUNBZ0lDQjJZWElnWld4bGJYTWdQU0JiWFR0Y2JseHVJQ0FnSUNBZ1ptOXlJQ2gyWVhJZ2FTQTlJREE3SUdrZ1BDQnBibVJsZUdWekxteGxibWQwYURzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUhaaGNpQnBaSGdnUFNCcGJtUmxlR1Z6VzJsZE8xeHVYRzRnSUNBZ0lDQWdJR2xrZUNBOUlHbGtlQ0E4SURBZ1B5QmhZM1IxWVd3dWJHVnVaM1JvSUNzZ2FXUjRJRG9nYVdSNE8xeHVJQ0FnSUNBZ0lDQnBaaUFvYVdSNElEd2dNQ0I4ZkNCcFpIZ2dQajBnWVdOMGRXRnNMbXhsYm1kMGFDa2dlMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJwWkhnZ0t5QW5JRzkxZENCdlppQmliM1Z1WkhNZ1ptOXlJSHQ3WVdOMGRXRnNmWDBuTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdaV3hsYlhNdWNIVnphQ2hoWTNSMVlXeGJhV1I0WFNrN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTExZEdGMFpTaGNiaUFnSUNBZ0lDQWdaV3hsYlhNdWJHVnVaM1JvSUQwOVBTQXhJRDhnWld4bGJYTmJNRjBnT2lCbGJHVnRjMXh1SUNBZ0lDQWdLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnYTJWNWN6b2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkTmRYUmhkR1Z6SUhSb1pTQjJZV3gxWlNCMGJ5QnZjR1Z5WVhSbElHOXVJR2wwY3lCc2FYTjBJRzltSUc5M2JpQnJaWGx6TGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZG5aWFFnYTJWNWN5Y3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJYVjBZWFJsS0Z4dUlDQWdJQ0FnSUNCZkxtdGxlWE1vWVdOMGRXRnNLVnh1SUNBZ0lDQWdLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJSFpoYkhWbGN6b2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkTmRYUmhkR1Z6SUhSb1pTQjJZV3gxWlNCMGJ5QnZjR1Z5WVhSbElHOXVJR2wwY3lCc2FYTjBJRzltSUhaaGJIVmxjeWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNkblpYUWdkbUZzZFdWekp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWRtRnNkV1Z6S0dGamRIVmhiQ2xjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUhOc2FXTmxPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owVjRkSEpoWTNSeklHRWdjRzl5ZEdsdmJpQm1jbTl0SUhSb1pTQjJZV3gxWlM0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5jMnhwWTJVb2UzdGhZM1IxWVd4OWZTd2dKSHRoY21jeElIeDhJREI5S1Njc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2djM1JoY25Rc0lHVnVaQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJYVjBZWFJsS0Z4dUlDQWdJQ0FnSUNCZkxuUnZRWEp5WVhrb1lXTjBkV0ZzS1M1emJHbGpaU2h6ZEdGeWRDd2daVzVrS1Z4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ1ptbHNkR1Z5T2lCN1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMGwwWlhKaGRHVnpJRzkyWlhJZ1pXeGxiV1Z1ZEhNZ2IyWWdkR2hsSUdOdmJHeGxZM1JwYjI0c0lHWnZjbXRwYm1jZ2RHaGxJR1Y0Y0dWamRHRjBhVzl1SUhSdkp5eGNiaUFnSUNBZ0lDZHZjR1Z5WVhSbElHOXVJR0Z1SUdGeWNtRjVJSGRwZEdnZ1lXeHNJSFJvWlNCbGJHVnRaVzUwY3lCbWIzSWdkMmhwWTJnZ2RHaGxJR05oYkd4aVlXTnJJSEpsZEhWeWJtVmtKeXhjYmlBZ0lDQWdJQ2QwY25WMGFIa2dabTl5TGljc1hHNGdJQ0FnSUNBblUyVmxPaUJvZEhSd2N6b3ZMMnh2WkdGemFDNWpiMjB2Wkc5amN5Tm1hV3gwWlhJblhHNGdJQ0FnWFN4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmpZV3hzWW1GamF5d2dkR2hwYzBGeVp5a2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLRnh1SUNBZ0lDQWdJQ0JmTG1acGJIUmxjaWhoWTNSMVlXd3NJR05oYkd4aVlXTnJMQ0IwYUdselFYSm5LVnh1SUNBZ0lDQWdLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJSEpsYW1WamREb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkSmRHVnlZWFJsY3lCdmRtVnlJR1ZzWlcxbGJuUnpJRzltSUdOdmJHeGxZM1JwYjI0c0lHWnZjbXRwYm1jZ2RHaGxJR1Y0Y0dWamRHRjBhVzl1SUhSdklHOXdaWEpoZEdVbkxGeHVJQ0FnSUNBZ0oyOXVJR0Z1SUdGeWNtRjVJSGRwZEdnZ1lXeHNJSFJvWlNCbGJHVnRaVzUwY3lCbWIzSWdkMmhwWTJnZ2RHaGxJR05oYkd4aVlXTnJJSEpsZEhWeWJtVmtJR1poYkhONUp5eGNiaUFnSUNBZ0lDZG1iM0lnS0hSb1pTQnZjSEJ2YzJsMFpTQnZaaUF1Wm1sc2RHVnlLUzRuTEZ4dUlDQWdJQ0FnSjFObFpUb2dhSFIwY0hNNkx5OXNiMlJoYzJndVkyOXRMMlJ2WTNNamNtVnFaV04wSjF4dUlDQWdJRjBzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z1kyRnNiR0poWTJzc0lIUm9hWE5CY21jcElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTExZEdGMFpTaGNiaUFnSUNBZ0lDQWdYeTV5WldwbFkzUW9ZV04wZFdGc0xDQmpZV3hzWW1GamF5d2dkR2hwYzBGeVp5bGNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJSGRvWlhKbE9pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjFCbGNtWnZjbTF6SUdFZ1pHVmxjQ0JqYjIxd1lYSnBjMjl1SUc5bUlHVmhZMmdnWld4bGJXVnVkQ0JwYmlCaElHTnZiR3hsWTNScGIyNGdkRzhnZEdobElHZHBkbVZ1Snl4Y2JpQWdJQ0FnSUNkd2NtOXdaWEowYVdWeklHOWlhbVZqZEN3Z1ptOXlhMmx1WnlCMGFHVWdaWGh3WldOMFlYUnBiMjRnZEc4Z2IzQmxjbUYwWlNCdmJpQmhiaUJoY25KaGVTQnZaaUJoYkd3bkxGeHVJQ0FnSUNBZ0oyVnNaVzFsYm5SeklIUm9ZWFFnYUdGMlpTQmxjWFZwZG1Gc1pXNTBJSEJ5YjNCbGNuUjVJSFpoYkhWbGN5NG5MRnh1SUNBZ0lDQWdKMU5sWlRvZ2FIUjBjSE02THk5c2IyUmhjMmd1WTI5dEwyUnZZM01qZDJobGNtVW5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZDJobGNtVWdlM3RoY21jeGZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUhCeWIzQnpLU0I3WEc0Z0lDQWdJQ0JwWmlBb0lWOHVhWE5RYkdGcGJrOWlhbVZqZENod2NtOXdjeWtwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUNkd2NtOXdjeUJwY3lCdWIzUWdZVzRnYjJKcVpXTjBKenRjYmlBZ0lDQWdJSDFjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2hjYmlBZ0lDQWdJQ0FnWHk1M2FHVnlaU2hoWTNSMVlXd3NJSEJ5YjNCektWeHVJQ0FnSUNBZ0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdiV0Z3T2lCN1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMFp2Y210eklIUm9aU0JsZUhCbFkzUmhkR2x2YmlCMGJ5QnZjR1Z5WVhSbElHOXVJR0Z1SUdGeWNtRjVJR2h2YkdScGJtY2dkR2hsSUhKbGMzVnNkSE1nYjJZbkxGeHVJQ0FnSUNBZ0oybHVkbTlyYVc1bklIUm9aU0JqWVd4c1ltRmpheUJtYjNJZ1pXRmphQ0JsYkdWdFpXNTBJR2x1SUhSb1pTQmpkWEp5Wlc1MElHTnZiR3hsWTNScGIyNHVKeXhjYmlBZ0lDQWdJQ2RUWldVNklHaDBkSEJ6T2k4dmJHOWtZWE5vTG1OdmJTOWtiMk56STIxaGNDZGNiaUFnSUNCZExGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR05oYkd4aVlXTnJMQ0IwYUdselFYSm5LU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWJXRndLR0ZqZEhWaGJDd2dZMkZzYkdKaFkyc3NJSFJvYVhOQmNtY3BYRzRnSUNBZ0lDQXBPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0J0WlhSb2IyUTZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblJtOXlhM01nZEdobElHVjRjR1ZqZEdGMGFXOXVJSFJ2SUc5d1pYSmhkR1VnYjI0Z2RHaGxJSEpsYzNWc2RDQnZaaUJwYm5admEybHVaeUIwYUdVZ2JtRnRaV1FuTEZ4dUlDQWdJQ0FnSjIxbGRHaHZaQ0J2YmlCMGFHVWdjM1ZpYW1WamRDQjJZV3gxWlM0bkxGeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dYQ0p0WlhSb2IyUWdMaVI3WVhKbk1YMG9LVndpTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lHMWxkR2h2WkN3Z1lYSm5LU0I3WEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdGamRIVmhiRnR0WlhSb2IyUmRJQ0U5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQW5KSHRoY21jeGZTQnBjeUJ1YjNRZ1lTQnRaWFJvYjJRZ2FXNGdlM3RoWTNSMVlXeDlmU2M3WEc0Z0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUhaaGNpQmhjbWR6SUQwZ1h5NTBiMEZ5Y21GNUtHRnlaM1Z0Wlc1MGN5a3VjMnhwWTJVb01pazdYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9YRzRnSUNBZ0lDQWdJR0ZqZEhWaGJGdHRaWFJvYjJSZExtRndjR3g1S0dGamRIVmhiQ3dnWVhKbmN5bGNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJR2x1ZG05clpUb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkR2IzSnJjeUIwYUdVZ1pYaHdaV04wWVhScGIyNGdkRzhnYjNCbGNtRjBaU0J2YmlCaGJpQmhjbkpoZVNCb2IyeGthVzVuSUhSb1pTQnlaWE4xYkhSeklHOW1KeXhjYmlBZ0lDQWdJQ2RwYm5admEybHVaeUIwYUdVZ2JXVjBhRzlrSUc1aGJXVmtJR0o1SUhSb1pTQmhjbWQxYldWdWRDQm1iM0lnWldGamFDQmxiR1Z0Wlc1MElHbHVJSFJvWlNjc1hHNGdJQ0FnSUNBblkzVnljbVZ1ZENCamIyeHNaV04wYVc5dUxpY3NYRzRnSUNBZ0lDQW5VMlZsT2lCb2RIUndjem92TDJ4dlpHRnphQzVqYjIwdlpHOWpjeU5wYm5admEyVW5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUJjSW1sdWRtOXJaU0F1Skh0aGNtY3hmU2dwWENJc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2diV1YwYUc5a0xDQmhjbWNwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoY2JpQWdJQ0FnSUNBZ1h5NXBiblp2YTJVdVlYQndiSGtvWHl3Z1lYSm5kVzFsYm5SektWeHVJQ0FnSUNBZ0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdjR3gxWTJzNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuVFhWMFlYUmxjeUIwYUdVZ2RtRnNkV1VnZEc4Z1ltVWdkR2hsSUc5dVpTQnZaaUIwYUdVZ2MzQmxZMmxtYVdNZ2NISnZjR1Z5ZEhrZ1ptOXlJR0ZzYkNCbGJHVnRaVzUwY3ljc1hHNGdJQ0FnSUNBbmFXNGdkR2hsSUdOMWNuSmxiblFnWTI5c2JHVmpkR2x2Ymk0bkxGeHVJQ0FnSUNBZ0oxTmxaVG9nYUhSMGNITTZMeTlzYjJSaGMyZ3VZMjl0TDJSdlkzTWpjR3gxWTJzblhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5jR3gxWTJzb0lIdDdZWEpuTVgxOUlDa25MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUhCeWIzQXBJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2hjYmlBZ0lDQWdJQ0FnWHk1d2JIVmpheWhoWTNSMVlXd3NJSEJ5YjNBcFhHNGdJQ0FnSUNBcE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQm1hWEp6ZERvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oyaGxZV1FuSUYwc1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMVJQUkU4bkxGeHVJQ0FnSUNBZ0oxTmxaVG9nYUhSMGNITTZMeTlzYjJSaGMyZ3VZMjl0TDJSdlkzTWpabWx5YzNRblhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5aMlYwSUdacGNuTjBJR1ZzWlcxbGJuUW5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoY2JpQWdJQ0FnSUNBZ1h5NW9aV0ZrS0dGamRIVmhiQ2xjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0JzWVhOME9pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjFSUFJFOG5MRnh1SUNBZ0lDQWdKMU5sWlRvZ2FIUjBjSE02THk5c2IyUmhjMmd1WTI5dEwyUnZZM01qYkdGemRDZGNiaUFnSUNCZExGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2hjYmlBZ0lDQWdJQ0FnWHk1c1lYTjBLR0ZqZEhWaGJDbGNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnlaWE4wT2lCN1hHNGdJQ0FnWVd4cFlYTmxjem9nV3lBbmRHRnBiQ2NnWFN4Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5WRTlFVHljc1hHNGdJQ0FnSUNBblUyVmxPaUJvZEhSd2N6b3ZMMnh2WkdGemFDNWpiMjB2Wkc5amN5TnlaWE4wSjF4dUlDQWdJRjBzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXViWFYwWVhSbEtGeHVJQ0FnSUNBZ0lDQmZMblJoYVd3b1lXTjBkV0ZzS1Z4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2JXbHVPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owMTFkR0YwWlhNZ2RHaGxJSE4xWW1wbFkzUWdkRzhnWW1VZ2RHaGxJRzFwYm1sdGRXMGdkbUZzZFdVZ1ptOTFibVFnYjI0Z2RHaGxJR052Ykd4bFkzUnBiMjR1Snl4Y2JpQWdJQ0FnSUNkVFpXVTZJR2gwZEhCek9pOHZiRzlrWVhOb0xtTnZiUzlrYjJOekkyMXBiaWRjYmlBZ0lDQmRMRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoY2JpQWdJQ0FnSUNBZ1h5NXRhVzRvWVdOMGRXRnNLVnh1SUNBZ0lDQWdLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJRzFoZURvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2ROZFhSaGRHVnpJSFJvWlNCemRXSnFaV04wSUhSdklHSmxJSFJvWlNCdFlYaHBiWFZ0SUhaaGJIVmxJR1p2ZFc1a0lHOXVJSFJvWlNCamIyeHNaV04wYVc5dUxpY3NYRzRnSUNBZ0lDQW5VMlZsT2lCb2RIUndjem92TDJ4dlpHRnphQzVqYjIwdlpHOWpjeU50WVhnblhHNGdJQ0FnWFN4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9YRzRnSUNBZ0lDQWdJRjh1YldGNEtHRmpkSFZoYkNsY2JpQWdJQ0FnSUNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lITnZjblE2SUh0Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5UWFYwWVhSbGN5QjBhR1VnZG1Gc2RXVWdkRzhnWW1VZ2MyOXlkR1ZrSUdsdUlHRnpZMlZ1WkdsdVp5QnZjbVJsY2k0bkxGeHVJQ0FnSUNBZ0oxTmxaVG9nYUhSMGNITTZMeTlzYjJSaGMyZ3VZMjl0TDJSdlkzTWpjMjl5ZEVKNUoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKM052Y25RbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR05oYkd4aVlXTnJMQ0IwYUdselFYSm5LU0I3WEc0Z0lDQWdJQ0F2THlCQmJHeHZkeUIwYUdVZ2RYTmxJRzltSUdWNGNISmxjM05wYjI1eklHRnpJR05oYkd4aVlXTnJjMXh1SUNBZ0lDQWdhV1lnS0dOaGJHeGlZV05ySUdsdWMzUmhibU5sYjJZZ1lYTnpMa05vWVdsdUtTQjdYRzRnSUNBZ0lDQWdJR05oYkd4aVlXTnJJRDBnWTJGc2JHSmhZMnN1Y21WemRXeDBPMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWMyOXlkRUo1S0dGamRIVmhiQ3dnWTJGc2JHSmhZMnNzSUhSb2FYTkJjbWNwWEc0Z0lDQWdJQ0FwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCemRHOXlaVG9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZElaV3h3WlhJZ2RHOGdjM1J2Y21VZ1lTQnlaV1psY21WdVkyVWdkRzhnZEdobElHTjFjbkpsYm5RZ2RtRnNkV1VnWW1WcGJtY2daWFpoYkhWaGRHVmtJR2x1SUhSb1pTY3NYRzRnSUNBZ0lDQW5aWGh3Y21WemMybHZiaUJwYmlCemIyMWxJRzkwYUdWeUlHOWlhbVZqZEM0Z1NYUWdaWGh3WldOMGN5QmhJSFJoY21kbGRDQnZZbXBsWTNRZ1lXNWtJRzl3ZEdsdmJtRnNiSGtuTEZ4dUlDQWdJQ0FnSjNSb1pTQnVZVzFsSUc5bUlHRWdjSEp2Y0dWeWRIa3VJRWxtSUhSaGNtZGxkQ0JwY3lCaElHWjFibU4wYVc5dUlHbDBYRnduYkd3Z2NtVmpaV2wyWlNCMGFHVWdkbUZzZFdVbkxGeHVJQ0FnSUNBZ0ozVnphVzVuSUdCd2NtOXdZQ0JoY3lCMGFHbHpJR052Ym5SbGVIUXVJRWxtSUdCd2NtOXdZQ0JwY3lCdWIzUWdjSEp2ZG1sa1pXUWdZVzVrSUdCMFlYSm5aWFJnSUdseklHRnVKeXhjYmlBZ0lDQWdJQ2RoY25KaGVTQjBhR1VnZG1Gc2RXVWdkMmxzYkNCaVpTQndkWE5vWldRZ2RHOGdhWFF1SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0ozTjBiM0psSnl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQjBZWEpuWlhRc0lIQnliM0FwSUh0Y2JpQWdJQ0FnSUdsbUlDaGZMbWx6Um5WdVkzUnBiMjRvZEdGeVoyVjBLU2tnZTF4dUlDQWdJQ0FnSUNCMFlYSm5aWFF1WTJGc2JDaHdjbTl3TENCaFkzUjFZV3dwTzF4dUlDQWdJQ0FnZlNCbGJITmxJR2xtSUNod2NtOXdJRDA5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0Y4dWFYTkJjbkpoZVNoMFlYSm5aWFFwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdkR0Z5WjJWMExuQjFjMmdvWVdOMGRXRnNLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnSjNCeWIzQWdkVzVrWldacGJtVmtJR0Z1WkNCMFlYSm5aWFFnYVhNZ2JtOTBJR0Z1SUdGeWNtRjVJRzl5SUdFZ1puVnVZM1JwYjI0NklIdDdZWEpuTVgxOUp6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdmU0JsYkhObElHbG1JQ2hmTG1selQySnFaV04wS0hSaGNtZGxkQ2twSUh0Y2JpQWdJQ0FnSUNBZ2RHRnlaMlYwVzNCeWIzQmRJRDBnWVdOMGRXRnNPMXh1SUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDZDBZWEpuWlhRZ2FYTWdibTkwSUdGdUlHOWlhbVZqZERvZ2UzdGhjbWN4Zlgwbk8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmlBZ0lDQjlYRzRnSUgxY2JseHVmU2s3WEc0aVhYMD0iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xuXG5cbi8vIEhlbHBlciBmYWN0b3J5IGZvciB0aGVuYWJsZSBjYWxsYmFja3NcbmZ1bmN0aW9uIHJlc3VtZSAocmVzb2x2ZXIsIHJlc3VsdCkge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmVzb2x2ZXIucmVzdW1lKHZhbHVlLCByZXN1bHQpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpc1Byb21pc2UgKHZhbHVlKSB7XG4gIHZhciB0aGVuID0gdmFsdWUgJiYgdmFsdWUudGhlbjtcbiAgcmV0dXJuIHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nO1xufVxuXG5cbi8vIFByb21pc2UgcmVsYXRlZCBtYXRjaGVyc1xuYXNzLnJlZ2lzdGVyKHtcblxuICBwcm9taXNlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1ZlcmlmaWVzIHRoYXQgdGhlIHZhbHVlIGlzIGEgcHJvbWlzZSAoUHJvbWlzZS9BKykgYnV0IGRvZXMgbm90IGF0dGFjaCcsXG4gICAgICAndGhlIGV4cHJlc3Npb24gdG8gaXRzIHJlc29sdXRpb24gbGlrZSBgcmVzb2x2ZXNgIG9yIGByZWplY3RzYCwgaW5zdGVhZCcsXG4gICAgICAndGhlIG9yaWdpbmFsIHByb21pc2UgdmFsdWUgaXMga2VwdCBhcyB0aGUgc3ViamVjdCBmb3IgdGhlIGZvbGxvd2luZycsXG4gICAgICAnZXhwZWN0YXRpb25zLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhIHByb21pc2UnLFxuICAgIGZhaWw6ICdnb3QgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBpc1Byb21pc2UoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVzb2x2ZXM6IHtcbiAgICBhbGlhc2VzOiBbICdyZXNvbHZlZCcsICdmdWxmaWxsZWQnLCAnZnVsZmlsbCcsICdldmVudHVhbGx5JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBdHRhY2ggdGhlIG1hdGNoZXIgdG8gYSBwcm9taXNlIHZhbHVlIChQcm9taXNlcy9BKykgdG8gY29udGludWUnLFxuICAgICAgJ2FwcGx5aW5nIHRoZSBjaGFpbiBvZiBtYXRjaGVycyBvbmNlIHRoZSBwcm9taXNlIGhhcyBiZWVuIHJlc29sdmVkLCcsXG4gICAgICAnbXV0YXRpbmcgdGhlIHZhbHVlIHRvIHRoZSByZXNvbHZlZCBvbmUuJyxcbiAgICAgICdJdCB3aWxsIGZhaWwgaWYgdGhlIHZhbHVlIGlzIG5vdCBhIHByb21pc2UgKG5vIC50aGVuIG1ldGhvZCkgb3IgdGhlJyxcbiAgICAgICdwcm9taXNlIGlzIGFjdHVhbGx5IHJlamVjdGVkLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhIHJlc29sdmVkIHByb21pc2UnLFxuICAgIGZhaWw6ICd3YXMgcmVqZWN0ZWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghaXNQcm9taXNlKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBwcm9taXNlOiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBFbnRlciBhc3luYyBtb2RlXG4gICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG5cbiAgICAgICAgLy8gQXR0YWNoIHRvIHRoZSBwcm9taXNlIHNvIHdlIGdldCBub3RpZmllZCB3aGVuIGl0J3MgcmVzb2x2ZWQuXG4gICAgICAgIGFjdHVhbC50aGVuKFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciksXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyLCBmYWxzZSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBSaWdodCBub3cgd2UgZG9uJ3Qga25vdyBpZiB0aGUgZXhwcmVzc2lvbiBpcyB2YWxpZFxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgYmVjb21lOiB7XG4gICAgYWxpYXNlczogWyAnYmVjb21lcycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnV29ya3MgdGhlIHNhbWUgYXMgLnJlc29sdmVzIGJ1dCBhZGRpdGlvbmFsbHkgd2lsbCBkbyBhIGNvbXBhcmlzb24gYmV0d2VlbicsXG4gICAgICAndGhlIHJlc29sdmVkIHZhbHVlIGZyb20gdGhlIHByb21pc2UgYW5kIHRoZSBleHBlY3RlZCBvbmUuIEl0IGNhbiBiZSBzZWVuJyxcbiAgICAgICdhcyBhIHNob3J0Y3V0IGZvciBgLnJlc29sdmVzLmVxKGV4cGVjdGVkKWAuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlY29tZSB7eyBleHBlY3RlZCB9fScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gTWFrZSBpdCBhc3luY1xuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEF0dGFjaCB0byB0aGUgcHJvbWlzZSByZXNvbHV0aW9uXG4gICAgICAgIGFjdHVhbC50aGVuKFxuICAgICAgICAgIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgLy8gV2hlbiB0aGUgZXF1YWxpdHkgc3VjY2VlZHMganVzdCBrZWVwIHJlc29sdmluZ1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IF8uaXNFcXVhbCh2YWx1ZSwgZXhwZWN0ZWQpID8gdW5kZWZpbmVkIDogZmFsc2U7XG4gICAgICAgICAgICByZXNvbHZlci5yZXN1bWUodmFsdWUsIHJlc3VsdCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIsIGZhbHNlKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICByZWplY3RzOiB7XG4gICAgYWxpYXNlczogWyAncmVqZWN0ZWQnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0F0dGFjaCB0aGUgbWF0Y2hlciB0byBhIHByb21pc2UgdmFsdWUgKFByb21pc2VzL0ErKSB0byBjb250aW51ZSBhcHBseWluZycsXG4gICAgICAndGhlIGNoYWluIG9mIG1hdGNoZXJzIG9uY2UgdGhlIHByb21pc2UgaGFzIGJlZW4gcmVqZWN0ZWQsIG11dGF0aW5nIHRoZScsXG4gICAgICAndmFsdWUgdG8gYmVjb21lIHRoZSByZWplY3RlZCBlcnJvci4nLFxuICAgICAgJ0l0IHdpbGwgZmFpbCBpZiB0aGUgdmFsdWUgaXMgbm90IGEgcHJvbWlzZSAobm8gLnRoZW4gbWV0aG9kKSBvciB0aGUnLFxuICAgICAgJ3Byb21pc2UgaXMgYWN0dWFsbHkgZnVsZmlsbGVkLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhIHJlamVjdGVkIHByb21pc2UnLFxuICAgIGZhaWw6ICd3YXMgZnVsZmlsbGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIGFjdHVhbC50aGVuKFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlcilcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBSaWdodCBub3cgd2UgZG9uJ3Qga25vdyBpZiB0aGUgZXhwcmVzc2lvbiBpcyB2YWxpZFxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOXRZWFJqYUdWeWN5OXdjbTl0YVhObExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTSXNJbVpwYkdVaU9pSm5aVzVsY21GMFpXUXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpZG1GeUlGOGdQU0FvZEhsd1pXOW1JSGRwYm1SdmR5QWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JSGRwYm1SdmQxc25YeWRkSURvZ2RIbHdaVzltSUdkc2IySmhiQ0FoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaUEvSUdkc2IySmhiRnNuWHlkZElEb2diblZzYkNrN1hHNWNiblpoY2lCaGMzTWdQU0J5WlhGMWFYSmxLQ2N1TGk5aGMzTW5LVHRjYmx4dVhHNHZMeUJJWld4d1pYSWdabUZqZEc5eWVTQm1iM0lnZEdobGJtRmliR1VnWTJGc2JHSmhZMnR6WEc1bWRXNWpkR2x2YmlCeVpYTjFiV1VnS0hKbGMyOXNkbVZ5TENCeVpYTjFiSFFwSUh0Y2JpQWdjbVYwZFhKdUlHWjFibU4wYVc5dUlDaDJZV3gxWlNrZ2UxeHVJQ0FnSUhKbGMyOXNkbVZ5TG5KbGMzVnRaU2gyWVd4MVpTd2djbVZ6ZFd4MEtUdGNiaUFnZlR0Y2JuMWNibHh1Wm5WdVkzUnBiMjRnYVhOUWNtOXRhWE5sSUNoMllXeDFaU2tnZTF4dUlDQjJZWElnZEdobGJpQTlJSFpoYkhWbElDWW1JSFpoYkhWbExuUm9aVzQ3WEc0Z0lISmxkSFZ5YmlCMGVYQmxiMllnZEdobGJpQTlQVDBnSjJaMWJtTjBhVzl1Snp0Y2JuMWNibHh1WEc0dkx5QlFjbTl0YVhObElISmxiR0YwWldRZ2JXRjBZMmhsY25OY2JtRnpjeTV5WldkcGMzUmxjaWg3WEc1Y2JpQWdjSEp2YldselpUb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkV1pYSnBabWxsY3lCMGFHRjBJSFJvWlNCMllXeDFaU0JwY3lCaElIQnliMjFwYzJVZ0tGQnliMjFwYzJVdlFTc3BJR0oxZENCa2IyVnpJRzV2ZENCaGRIUmhZMmduTEZ4dUlDQWdJQ0FnSjNSb1pTQmxlSEJ5WlhOemFXOXVJSFJ2SUdsMGN5QnlaWE52YkhWMGFXOXVJR3hwYTJVZ1lISmxjMjlzZG1WellDQnZjaUJnY21WcVpXTjBjMkFzSUdsdWMzUmxZV1FuTEZ4dUlDQWdJQ0FnSjNSb1pTQnZjbWxuYVc1aGJDQndjbTl0YVhObElIWmhiSFZsSUdseklHdGxjSFFnWVhNZ2RHaGxJSE4xWW1wbFkzUWdabTl5SUhSb1pTQm1iMnhzYjNkcGJtY25MRnh1SUNBZ0lDQWdKMlY0Y0dWamRHRjBhVzl1Y3k0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5kRzhnWW1VZ1lTQndjbTl0YVhObEp5eGNiaUFnSUNCbVlXbHNPaUFuWjI5MElDUjdJR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnYVhOUWNtOXRhWE5sS0dGamRIVmhiQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUhKbGMyOXNkbVZ6T2lCN1hHNGdJQ0FnWVd4cFlYTmxjem9nV3lBbmNtVnpiMngyWldRbkxDQW5ablZzWm1sc2JHVmtKeXdnSjJaMWJHWnBiR3duTENBblpYWmxiblIxWVd4c2VTY2dYU3hjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblFYUjBZV05vSUhSb1pTQnRZWFJqYUdWeUlIUnZJR0VnY0hKdmJXbHpaU0IyWVd4MVpTQW9VSEp2YldselpYTXZRU3NwSUhSdklHTnZiblJwYm5WbEp5eGNiaUFnSUNBZ0lDZGhjSEJzZVdsdVp5QjBhR1VnWTJoaGFXNGdiMllnYldGMFkyaGxjbk1nYjI1alpTQjBhR1VnY0hKdmJXbHpaU0JvWVhNZ1ltVmxiaUJ5WlhOdmJIWmxaQ3duTEZ4dUlDQWdJQ0FnSjIxMWRHRjBhVzVuSUhSb1pTQjJZV3gxWlNCMGJ5QjBhR1VnY21WemIyeDJaV1FnYjI1bExpY3NYRzRnSUNBZ0lDQW5TWFFnZDJsc2JDQm1ZV2xzSUdsbUlIUm9aU0IyWVd4MVpTQnBjeUJ1YjNRZ1lTQndjbTl0YVhObElDaHVieUF1ZEdobGJpQnRaWFJvYjJRcElHOXlJSFJvWlNjc1hHNGdJQ0FnSUNBbmNISnZiV2x6WlNCcGN5QmhZM1IxWVd4c2VTQnlaV3BsWTNSbFpDNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdZU0J5WlhOdmJIWmxaQ0J3Y205dGFYTmxKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJSEpsYW1WamRHVmtKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCcFppQW9JV2x6VUhKdmJXbHpaU2hoWTNSMVlXd3BLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFuYVhNZ2JtOTBJR0VnY0hKdmJXbHpaVG9nZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNBZ0lDQWdMeThnUlc1MFpYSWdZWE41Ym1NZ2JXOWtaVnh1SUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTV3WVhWelpTZ3BPMXh1WEc0Z0lDQWdJQ0FnSUM4dklFRjBkR0ZqYUNCMGJ5QjBhR1VnY0hKdmJXbHpaU0J6YnlCM1pTQm5aWFFnYm05MGFXWnBaV1FnZDJobGJpQnBkQ2R6SUhKbGMyOXNkbVZrTGx4dUlDQWdJQ0FnSUNCaFkzUjFZV3d1ZEdobGJpaGNiaUFnSUNBZ0lDQWdJQ0J5WlhOMWJXVW9jbVZ6YjJ4MlpYSXBMRnh1SUNBZ0lDQWdJQ0FnSUhKbGMzVnRaU2h5WlhOdmJIWmxjaXdnWm1Gc2MyVXBYRzRnSUNBZ0lDQWdJQ2s3WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdVbWxuYUhRZ2JtOTNJSGRsSUdSdmJpZDBJR3R1YjNjZ2FXWWdkR2hsSUdWNGNISmxjM05wYjI0Z2FYTWdkbUZzYVdSY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWdVpHVm1hVzVsWkR0Y2JpQWdJQ0FnSUgwN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lHSmxZMjl0WlRvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oySmxZMjl0WlhNbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjFkdmNtdHpJSFJvWlNCellXMWxJR0Z6SUM1eVpYTnZiSFpsY3lCaWRYUWdZV1JrYVhScGIyNWhiR3g1SUhkcGJHd2daRzhnWVNCamIyMXdZWEpwYzI5dUlHSmxkSGRsWlc0bkxGeHVJQ0FnSUNBZ0ozUm9aU0J5WlhOdmJIWmxaQ0IyWVd4MVpTQm1jbTl0SUhSb1pTQndjbTl0YVhObElHRnVaQ0IwYUdVZ1pYaHdaV04wWldRZ2IyNWxMaUJKZENCallXNGdZbVVnYzJWbGJpY3NYRzRnSUNBZ0lDQW5ZWE1nWVNCemFHOXlkR04xZENCbWIzSWdZQzV5WlhOdmJIWmxjeTVsY1NobGVIQmxZM1JsWkNsZ0xpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpXTnZiV1VnZTNzZ1pYaHdaV04wWldRZ2ZYMG5MRnh1SUNBZ0lHWmhhV3c2SUNkM1lYTWdlM3NnWVdOMGRXRnNJSDE5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdhV1lnS0NGcGMxQnliMjFwYzJVb1lXTjBkV0ZzS1NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0oybHpJRzV2ZENCaElIQnliMjFwYzJVNklIdDdZV04wZFdGc2ZYMG5PMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdablZ1WTNScGIyNGdLSEpsYzI5c2RtVnlLU0I3WEc0Z0lDQWdJQ0FnSUM4dklFMWhhMlVnYVhRZ1lYTjVibU5jYmlBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y0dGMWMyVW9LVHRjYmx4dUlDQWdJQ0FnSUNBdkx5QkJkSFJoWTJnZ2RHOGdkR2hsSUhCeWIyMXBjMlVnY21WemIyeDFkR2x2Ymx4dUlDQWdJQ0FnSUNCaFkzUjFZV3d1ZEdobGJpaGNiaUFnSUNBZ0lDQWdJQ0JtZFc1amRHbHZiaUFvZG1Gc2RXVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRmRvWlc0Z2RHaGxJR1Z4ZFdGc2FYUjVJSE4xWTJObFpXUnpJR3AxYzNRZ2EyVmxjQ0J5WlhOdmJIWnBibWRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhjaUJ5WlhOMWJIUWdQU0JmTG1selJYRjFZV3dvZG1Gc2RXVXNJR1Y0Y0dWamRHVmtLU0EvSUhWdVpHVm1hVzVsWkNBNklHWmhiSE5sTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVjbVZ6ZFcxbEtIWmhiSFZsTENCeVpYTjFiSFFwTzF4dUlDQWdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQWdJQ0FnY21WemRXMWxLSEpsYzI5c2RtVnlMQ0JtWVd4elpTbGNiaUFnSUNBZ0lDQWdLVHRjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZFc1a1pXWnBibVZrTzF4dUlDQWdJQ0FnZlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2NtVnFaV04wY3pvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0ozSmxhbVZqZEdWa0p5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkQmRIUmhZMmdnZEdobElHMWhkR05vWlhJZ2RHOGdZU0J3Y205dGFYTmxJSFpoYkhWbElDaFFjbTl0YVhObGN5OUJLeWtnZEc4Z1kyOXVkR2x1ZFdVZ1lYQndiSGxwYm1jbkxGeHVJQ0FnSUNBZ0ozUm9aU0JqYUdGcGJpQnZaaUJ0WVhSamFHVnljeUJ2Ym1ObElIUm9aU0J3Y205dGFYTmxJR2hoY3lCaVpXVnVJSEpsYW1WamRHVmtMQ0J0ZFhSaGRHbHVaeUIwYUdVbkxGeHVJQ0FnSUNBZ0ozWmhiSFZsSUhSdklHSmxZMjl0WlNCMGFHVWdjbVZxWldOMFpXUWdaWEp5YjNJdUp5eGNiaUFnSUNBZ0lDZEpkQ0IzYVd4c0lHWmhhV3dnYVdZZ2RHaGxJSFpoYkhWbElHbHpJRzV2ZENCaElIQnliMjFwYzJVZ0tHNXZJQzUwYUdWdUlHMWxkR2h2WkNrZ2IzSWdkR2hsSnl4Y2JpQWdJQ0FnSUNkd2NtOXRhWE5sSUdseklHRmpkSFZoYkd4NUlHWjFiR1pwYkd4bFpDNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdZU0J5WldwbFkzUmxaQ0J3Y205dGFYTmxKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJR1oxYkdacGJHeGxaQ2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2FXWWdLQ0ZwYzFCeWIyMXBjMlVvWVdOMGRXRnNLU2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnSjJseklHNXZkQ0JoSUhCeWIyMXBjMlU2SUh0N1lXTjBkV0ZzZlgwbk8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQnlaWFIxY200Z1puVnVZM1JwYjI0Z0tISmxjMjlzZG1WeUtTQjdYRzRnSUNBZ0lDQWdJQzh2SUVWdWRHVnlJR0Z6ZVc1aklHMXZaR1ZjYmlBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y0dGMWMyVW9LVHRjYmx4dUlDQWdJQ0FnSUNCaFkzUjFZV3d1ZEdobGJpaGNiaUFnSUNBZ0lDQWdJQ0J5WlhOMWJXVW9jbVZ6YjJ4MlpYSXNJR1poYkhObEtTeGNiaUFnSUNBZ0lDQWdJQ0J5WlhOMWJXVW9jbVZ6YjJ4MlpYSXBYRzRnSUNBZ0lDQWdJQ2s3WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdVbWxuYUhRZ2JtOTNJSGRsSUdSdmJpZDBJR3R1YjNjZ2FXWWdkR2hsSUdWNGNISmxjM05wYjI0Z2FYTWdkbUZzYVdSY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWdVpHVm1hVzVsWkR0Y2JpQWdJQ0FnSUgwN1hHNGdJQ0FnZlZ4dUlDQjlYRzVjYm4wcE8xeHVJbDE5IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snXyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnXyddIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gaXRlcmF0ZSBhIHZhbHVlIGNyZWF0aW5nIGZvcmtzIGZvciBlYWNoIGVsZW1lbnQsIGhhbmRsaW5nXG4vLyBhc3luYyBleHBlY3RhdGlvbnMgaWYgbmVlZGVkLlxuZnVuY3Rpb24gZm9ya2VyIChyZXNvbHZlciwgYWN0dWFsLCBpdGVyYXRvciwgc3RvcCkge1xuICB2YXIgYnJhbmNoZXMgPSBfLnNpemUoYWN0dWFsKTtcbiAgdmFyIHJlc3VsdCA9IGl0ZXJhdG9yKGFjdHVhbCwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cbiAgICB2YXIgZm9yayA9IHJlc29sdmVyLmZvcmsoKTtcblxuICAgIHZhciBwYXJ0aWFsID0gZm9yayh2YWx1ZSk7XG5cbiAgICAvLyBTdG9wIGl0ZXJhdGluZyBhcyBzb29uIGFzIHBvc3NpYmxlXG4gICAgaWYgKHBhcnRpYWwgPT09IHN0b3ApIHtcbiAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICByZXR1cm4gc3RvcDtcbiAgICB9XG5cbiAgICBpZiAocGFydGlhbCA9PT0gIXN0b3ApIHtcbiAgICAgIGJyYW5jaGVzIC09IDE7XG4gICAgICBpZiAoMCA9PT0gYnJhbmNoZXMpIHtcbiAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAhc3RvcDtcbiAgICB9XG5cbiAgICAvLyBBc3luYyBzdXBwb3J0XG4gICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIHRoZSBmb3JrJ3MgZmluYWwgcmVzdWx0XG4gICAgZm9yay5maW5hbGl6ZShmdW5jdGlvbiAoZmluYWwpIHtcbiAgICAgIC8vIFdlJ3JlIGRvbmUgdGhlIG1vbWVudCBvbmUgaXMgYSBzdG9wIHJlc3VsdFxuICAgICAgaWYgKGZpbmFsID09PSBzdG9wKSB7XG4gICAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCBzdG9wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyYW5jaGVzIC09IDE7XG4gICAgICAgIGlmICgwID09PSBicmFuY2hlcykge1xuICAgICAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsICFzdG9wKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbmFsO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICFzdG9wOyAgLy8ga2VlcCBpdGVyYXRpbmdcbiAgfSk7XG5cbiAgLy8gV2hlbiB0aGUgZm9ya3MgY29tcGxldGVkIHN5bmNocm9ub3VzbHkganVzdCBmaW5hbGl6ZSB0aGUgcmVzb2x2ZXJcbiAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUocmVzdWx0KTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cblxuLy8gUXVhbnRpZmllcnNcbmFzcy5yZWdpc3Rlcih7XG5cbiAgZXZlcnk6IHtcbiAgICBhbGlhc2VzOiBbICdhbGwnLCAnYWxsT2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ2FsbCBvZiB0aGVtIHN1Y2NlZWQnXG4gICAgXSxcbiAgICBkZXNjOiAnRm9yIGV2ZXJ5IG9uZTonLFxuICAgIGZhaWw6ICdvbmUgZGlkblxcJ3QnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uZXZlcnksIGZhbHNlKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIHNvbWU6IHtcbiAgICBhbGlhc2VzOiBbICdhbnlPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnYXQgbGVhc3Qgb25lIG9mIHRoZW0gc3VjY2VlZHMnXSxcbiAgICBkZXNjOiAnQXQgbGVhc3Qgb25lOicsXG4gICAgZmFpbDogJ25vbmUgZGlkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBzdHVmZiB0byBkb1xuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvcmtlcihyZXNvbHZlciwgYWN0dWFsLCBfLnNvbWUsIHRydWUpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgbm9uZToge1xuICAgIGFsaWFzZXM6IFsgJ25vbmVPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnbm9uZSBvZiB0aGVtIHN1Y2NlZWQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ05vbmUgb2YgdGhlbTonLFxuICAgIGZhaWw6ICdvbmUgZGlkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBzdHVmZiB0byBkb1xuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgYXJlIGdvaW5nIHRvIHVzZSB0aGUgc2FtZSBhbGdvcml0aG0gYXMgZm9yIC5zb21lIGJ1dCB3ZSdsbCBuZWdhdGVcbiAgICAgICAgLy8gaXRzIHJlc3VsdCB1c2luZyBhIGZpbmFsaXplci5cbiAgICAgICAgcmVzb2x2ZXIuZmluYWxpemUoZnVuY3Rpb24gKGZpbmFsKSB7XG4gICAgICAgICAgcmV0dXJuICFmaW5hbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZvcmtlcihyZXNvbHZlciwgYWN0dWFsLCBfLnNvbWUsIHRydWUpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOXRZWFJqYUdWeWN5OXhkV0Z1ZEdsbWFXVnljeTVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pTzBGQlFVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUoyWVhJZ1h5QTlJQ2gwZVhCbGIyWWdkMmx1Wkc5M0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdkMmx1Wkc5M1d5ZGZKMTBnT2lCMGVYQmxiMllnWjJ4dlltRnNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnWjJ4dlltRnNXeWRmSjEwZ09pQnVkV3hzS1R0Y2JseHVkbUZ5SUdGemN5QTlJSEpsY1hWcGNtVW9KeTR1TDJGemN5Y3BPMXh1WEc1Y2JpOHZJRWhsYkhCbGNpQm1kVzVqZEdsdmJpQjBieUJwZEdWeVlYUmxJR0VnZG1Gc2RXVWdZM0psWVhScGJtY2dabTl5YTNNZ1ptOXlJR1ZoWTJnZ1pXeGxiV1Z1ZEN3Z2FHRnVaR3hwYm1kY2JpOHZJR0Z6ZVc1aklHVjRjR1ZqZEdGMGFXOXVjeUJwWmlCdVpXVmtaV1F1WEc1bWRXNWpkR2x2YmlCbWIzSnJaWElnS0hKbGMyOXNkbVZ5TENCaFkzUjFZV3dzSUdsMFpYSmhkRzl5TENCemRHOXdLU0I3WEc0Z0lIWmhjaUJpY21GdVkyaGxjeUE5SUY4dWMybDZaU2hoWTNSMVlXd3BPMXh1SUNCMllYSWdjbVZ6ZFd4MElEMGdhWFJsY21GMGIzSW9ZV04wZFdGc0xDQm1kVzVqZEdsdmJpQW9kbUZzZFdVcElIdGNibHh1SUNBZ0lIWmhjaUJtYjNKcklEMGdjbVZ6YjJ4MlpYSXVabTl5YXlncE8xeHVYRzRnSUNBZ2RtRnlJSEJoY25ScFlXd2dQU0JtYjNKcktIWmhiSFZsS1R0Y2JseHVJQ0FnSUM4dklGTjBiM0FnYVhSbGNtRjBhVzVuSUdGeklITnZiMjRnWVhNZ2NHOXpjMmxpYkdWY2JpQWdJQ0JwWmlBb2NHRnlkR2xoYkNBOVBUMGdjM1J2Y0NrZ2UxeHVJQ0FnSUNBZ2NtVnpiMngyWlhJdWFtOXBiaWhtYjNKcktUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCemRHOXdPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHbG1JQ2h3WVhKMGFXRnNJRDA5UFNBaGMzUnZjQ2tnZTF4dUlDQWdJQ0FnWW5KaGJtTm9aWE1nTFQwZ01UdGNiaUFnSUNBZ0lHbG1JQ2d3SUQwOVBTQmljbUZ1WTJobGN5a2dlMXh1SUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTVxYjJsdUtHWnZjbXNwTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJQ0FnY21WMGRYSnVJQ0Z6ZEc5d08xeHVJQ0FnSUgxY2JseHVJQ0FnSUM4dklFRnplVzVqSUhOMWNIQnZjblJjYmlBZ0lDQnBaaUFvSVhKbGMyOXNkbVZ5TG5CaGRYTmxaQ2tnZTF4dUlDQWdJQ0FnY21WemIyeDJaWEl1Y0dGMWMyVW9LVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZMeUJUZFdKelkzSnBZbVVnZEc4Z2RHaGxJR1p2Y21zbmN5Qm1hVzVoYkNCeVpYTjFiSFJjYmlBZ0lDQm1iM0pyTG1acGJtRnNhWHBsS0daMWJtTjBhVzl1SUNobWFXNWhiQ2tnZTF4dUlDQWdJQ0FnTHk4Z1YyVW5jbVVnWkc5dVpTQjBhR1VnYlc5dFpXNTBJRzl1WlNCcGN5QmhJSE4wYjNBZ2NtVnpkV3gwWEc0Z0lDQWdJQ0JwWmlBb1ptbHVZV3dnUFQwOUlITjBiM0FwSUh0Y2JpQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWFtOXBiaWhtYjNKcktUdGNiaUFnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVjbVZ6ZFcxbEtHNTFiR3dzSUhOMGIzQXBPMXh1SUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdZbkpoYm1Ob1pYTWdMVDBnTVR0Y2JpQWdJQ0FnSUNBZ2FXWWdLREFnUFQwOUlHSnlZVzVqYUdWektTQjdYRzRnSUNBZ0lDQWdJQ0FnY21WemIyeDJaWEl1YW05cGJpaG1iM0pyS1R0Y2JpQWdJQ0FnSUNBZ0lDQnlaWE52YkhabGNpNXlaWE4xYldVb2JuVnNiQ3dnSVhOMGIzQXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0J5WlhSMWNtNGdabWx1WVd3N1hHNGdJQ0FnZlNrN1hHNWNiaUFnSUNCeVpYUjFjbTRnSVhOMGIzQTdJQ0F2THlCclpXVndJR2wwWlhKaGRHbHVaMXh1SUNCOUtUdGNibHh1SUNBdkx5QlhhR1Z1SUhSb1pTQm1iM0pyY3lCamIyMXdiR1YwWldRZ2MzbHVZMmh5YjI1dmRYTnNlU0JxZFhOMElHWnBibUZzYVhwbElIUm9aU0J5WlhOdmJIWmxjbHh1SUNCcFppQW9JWEpsYzI5c2RtVnlMbkJoZFhObFpDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCeVpYTnZiSFpsY2k1bWFXNWhiR2w2WlNoeVpYTjFiSFFwTzF4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUhWdVpHVm1hVzVsWkR0Y2JuMWNibHh1WEc0dkx5QlJkV0Z1ZEdsbWFXVnljMXh1WVhOekxuSmxaMmx6ZEdWeUtIdGNibHh1SUNCbGRtVnllVG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjJGc2JDY3NJQ2RoYkd4UFppY2dYU3hjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblFYQndiR2xsY3lCdFlYUmphR1Z5Y3lCMGJ5QmhiR3dnZEdobElHVnNaVzFsYm5SeklHbHVJR0VnWTI5c2JHVmpkR2x2YmlCbGVIQmxZM1JwYm1jZ2RHaGhkQ2NzWEc0Z0lDQWdJQ0FuWVd4c0lHOW1JSFJvWlcwZ2MzVmpZMlZsWkNkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZEdiM0lnWlhabGNua2diMjVsT2ljc1hHNGdJQ0FnWm1GcGJEb2dKMjl1WlNCa2FXUnVYRnduZENjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHWjFibU4wYVc5dUlDaHlaWE52YkhabGNpa2dlMXh1SUNBZ0lDQWdJQ0F2THlCVGFHOXlkR04xZENCM2FHVnVJSFJvWlhKbElHbHpJRzV2SUcxdmNtVWdjM1IxWm1ZZ2RHOGdaRzljYmlBZ0lDQWdJQ0FnYVdZZ0tISmxjMjlzZG1WeUxtVjRhR0YxYzNSbFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ5WlhOdmJIWmxjaTVtYVc1aGJHbDZaU2gwY25WbEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJtYjNKclpYSW9jbVZ6YjJ4MlpYSXNJR0ZqZEhWaGJDd2dYeTVsZG1WeWVTd2dabUZzYzJVcE8xeHVJQ0FnSUNBZ2ZUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdjMjl0WlRvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oyRnVlVTltSnlCZExGeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RCY0hCc2FXVnpJRzFoZEdOb1pYSnpJSFJ2SUdGc2JDQjBhR1VnWld4bGJXVnVkSE1nYVc0Z1lTQmpiMnhzWldOMGFXOXVJR1Y0Y0dWamRHbHVaeUIwYUdGMEp5eGNiaUFnSUNBZ0lDZGhkQ0JzWldGemRDQnZibVVnYjJZZ2RHaGxiU0J6ZFdOalpXVmtjeWRkTEZ4dUlDQWdJR1JsYzJNNklDZEJkQ0JzWldGemRDQnZibVU2Snl4Y2JpQWdJQ0JtWVdsc09pQW5ibTl1WlNCa2FXUW5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJtZFc1amRHbHZiaUFvY21WemIyeDJaWElwSUh0Y2JpQWdJQ0FnSUNBZ0x5OGdVMmh2Y25SamRYUWdkMmhsYmlCMGFHVnlaU0JwY3lCdWJ5QnRiM0psSUhOMGRXWm1JSFJ2SUdSdlhHNGdJQ0FnSUNBZ0lHbG1JQ2h5WlhOdmJIWmxjaTVsZUdoaGRYTjBaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2NtVnpiMngyWlhJdVptbHVZV3hwZW1Vb2RISjFaU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptOXlhMlZ5S0hKbGMyOXNkbVZ5TENCaFkzUjFZV3dzSUY4dWMyOXRaU3dnZEhKMVpTazdYRzRnSUNBZ0lDQjlPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0J1YjI1bE9pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5ibTl1WlU5bUp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkQmNIQnNhV1Z6SUcxaGRHTm9aWEp6SUhSdklHRnNiQ0IwYUdVZ1pXeGxiV1Z1ZEhNZ2FXNGdZU0JqYjJ4c1pXTjBhVzl1SUdWNGNHVmpkR2x1WnlCMGFHRjBKeXhjYmlBZ0lDQWdJQ2R1YjI1bElHOW1JSFJvWlcwZ2MzVmpZMlZsWkM0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5UbTl1WlNCdlppQjBhR1Z0T2ljc1hHNGdJQ0FnWm1GcGJEb2dKMjl1WlNCa2FXUW5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJtZFc1amRHbHZiaUFvY21WemIyeDJaWElwSUh0Y2JpQWdJQ0FnSUNBZ0x5OGdVMmh2Y25SamRYUWdkMmhsYmlCMGFHVnlaU0JwY3lCdWJ5QnRiM0psSUhOMGRXWm1JSFJ2SUdSdlhHNGdJQ0FnSUNBZ0lHbG1JQ2h5WlhOdmJIWmxjaTVsZUdoaGRYTjBaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2NtVnpiMngyWlhJdVptbHVZV3hwZW1Vb2RISjFaU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQXZMeUJYWlNCaGNtVWdaMjlwYm1jZ2RHOGdkWE5sSUhSb1pTQnpZVzFsSUdGc1oyOXlhWFJvYlNCaGN5Qm1iM0lnTG5OdmJXVWdZblYwSUhkbEoyeHNJRzVsWjJGMFpWeHVJQ0FnSUNBZ0lDQXZMeUJwZEhNZ2NtVnpkV3gwSUhWemFXNW5JR0VnWm1sdVlXeHBlbVZ5TGx4dUlDQWdJQ0FnSUNCeVpYTnZiSFpsY2k1bWFXNWhiR2w2WlNobWRXNWpkR2x2YmlBb1ptbHVZV3dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z0lXWnBibUZzTzF4dUlDQWdJQ0FnSUNCOUtUdGNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdabTl5YTJWeUtISmxjMjlzZG1WeUxDQmhZM1IxWVd3c0lGOHVjMjl0WlN3Z2RISjFaU2s3WEc0Z0lDQWdJQ0I5TzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzU5S1R0Y2JpSmRmUT09IiwidmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuXG52YXIgY2hlY2tDaGFpbiA9IG5ldyBDaGFpbigpO1xuXG5cbmV4cG9ydHMubG9kYXNoID0gZnVuY3Rpb24gKF8pIHtcbiAgLy8gRXhpdCBpZiBhbHJlYWR5IHBhdGNoZWRcbiAgaWYgKF8uY3JlYXRlQ2FsbGJhY2soY2hlY2tDaGFpbikgPT09IGNoZWNrQ2hhaW4udGVzdCkge1xuICAgIHJldHVybiBfO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgbG9kYXNoJ3MgZGVmYXVsdCBjcmVhdGVDYWxsYmFjayBtZWNoYW5pc20gdG8gbWFrZSBpdCB1bmRlcnN0YW5kXG4gIC8vIGFib3V0IG91ciBleHByZXNzaW9uIGNoYWlucy5cbiAgXy5jcmVhdGVDYWxsYmFjayA9IF8ud3JhcChfLmNyZWF0ZUNhbGxiYWNrLCBmdW5jdGlvbihvcmlnLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIGlmIChDaGFpbi5pc0NoYWluKGNhbGxiYWNrKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrLnRlc3Q7XG4gICAgfVxuXG4gICAgLy8gU3VwcG9ydCBfLndoZXJlIHN0eWxlLiBJdCdzIG5vdCBhcyBmYXN0IGFzIHRoZSBvcmlnaW5hbCBvbmUgc2luY2Ugd2VcbiAgICAvLyBoYXZlIHRvIGdvIHZpYSBfLmlzRXF1YWwgaW5zdGVhZCBvZiB1c2luZyB0aGUgaW50ZXJuYWwgZnVuY3Rpb25cbiAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGNhbGxiYWNrKSkge1xuICAgICAgdmFyIHByb3BzID0gXy5rZXlzKGNhbGxiYWNrKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgIGlmIChudWxsID09IG9iamVjdCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB2YXIgcmVzdWx0ID0gZmFsc2UsIGxlbmd0aCA9IHByb3BzLmxlbmd0aCwga2V5O1xuICAgICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgICBrZXkgPSBwcm9wc1tsZW5ndGhdO1xuICAgICAgICAgIC8vIEZhaWwgd2hlbiB0aGUga2V5IGlzIG5vdCBldmVuIHByZXNlbnRcbiAgICAgICAgICBpZiAoIShrZXkgaW4gb2JqZWN0KSkge1xuICAgICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc3VsdCA9IF8uaXNFcXVhbChvYmplY3Rba2V5XSwgY2FsbGJhY2tba2V5XSk7XG4gICAgICAgICAgaWYgKCFyZXN1bHQpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBvcmlnKGNhbGxiYWNrLCB0aGlzQXJnKTtcbiAgfSk7XG5cbiAgLy8gT3ZlcnJpZGUgbG9kYXNoJ3MgZGVmYXVsdCBpc0VxdWFsIGltcGxlbWVudGF0aW9uIHNvIGl0IHVuZGVyc3RhbmRzXG4gIC8vIGFib3V0IGV4cHJlc3Npb24gY2hhaW5zLlxuICBmdW5jdGlvbiBjbXAgKGEsIGIpIHtcbiAgICByZXR1cm4gQ2hhaW4uaXNDaGFpbihhKSA/IGEudGVzdChiKSA6IENoYWluLmlzQ2hhaW4oYikgPyBiLnRlc3QoYSkgOiB1bmRlZmluZWQ7XG4gIH1cbiAgXy5pc0VxdWFsID0gXy53cmFwKF8uaXNFcXVhbCwgZnVuY3Rpb24gKG9yaWcsIGEsIGIsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgdmFyIHJlc3VsdCA9IGNhbGxiYWNrID8gY2FsbGJhY2suY2FsbCh0aGlzQXJnIHx8IHRoaXMsIGEsIGIpIDogdW5kZWZpbmVkO1xuICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVzdWx0ID0gb3JpZyhhLCBiLCBjbXAsIHRoaXNBcmcpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KTtcblxuICByZXR1cm4gXztcbn07XG5cblxuZXhwb3J0cy5zaW5vbiA9IGZ1bmN0aW9uIChzaW5vbikge1xuICAvLyBFeGl0IGlmIGFscmVhZHkgcGF0Y2hlZFxuICBpZiAoc2lub24ubWF0Y2guaXNNYXRjaGVyKGNoZWNrQ2hhaW4pKSB7XG4gICAgcmV0dXJuIHNpbm9uO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgU2lub24ncyAuaXNNYXRjaGVyIGltcGxlbWVudGF0aW9uIHRvIGFsbG93IG91ciBleHByZXNzaW9ucyB0byBiZVxuICAvLyB0cmFuc3BhcmVudGx5IHN1cHBvcnRlZCBieSBpdC5cbiAgdmFyIG9sZElzTWF0Y2hlciA9IHV0aWwuYmluZChzaW5vbi5tYXRjaC5pc01hdGNoZXIsIHNpbm9uLm1hdGNoKTtcbiAgc2lub24ubWF0Y2guaXNNYXRjaGVyID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBDaGFpbi5pc0NoYWluKG9iaikgfHwgb2xkSXNNYXRjaGVyKG9iaik7XG4gIH07XG5cbiAgcmV0dXJuIHNpbm9uO1xufTtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ18nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ18nXSA6IG51bGwpO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vLyBVc2UgYSBjYXBwZWQgcG9vbCwgdGhlIHJlbGVhc2luZyBhbGdvcml0aG0gaXMgcHJldHR5IHNvbGlkIHNvIHdlIHNob3VsZFxuLy8gaGF2ZSBhIGdvb2QgcmUtdXNlIHJhdGlvIHdpdGgganVzdCBhIGZldyBpbiB0aGUgcG9vbC4gVGhlbiBpbiBjYXNlXG4vLyBzb21ldGhpbmcgZ29lcyB3cm9uZyB0aGUgR0Mgd2lsbCB0YWtlIGNhcmUgb2YgaXQgYWZ0ZXIgYSB3aGlsZS5cbnZhciBwb29sID0gdXRpbC5DYXBwZWRQb29sKDEwMCk7XG52YXIgY3JlYXRlZCA9IDA7XG5cblxuLy8gSW5zdGFudGlhdGVzIGEgbmV3IHJlc29sdmVyIGZ1bmN0b3JcbmZ1bmN0aW9uIGZhY3RvcnkgKCkge1xuICAvLyBKdXN0IGZvcndhcmRzIHRoZSBjYWxsIHRvIHRoZSByZXNvbHZlciBieSBzZXR0aW5nIGl0c2VsZiBhcyBjb250ZXh0LlxuICBmdW5jdGlvbiBmbiAodmFsdWUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIuY2FsbChmbiwgdmFsdWUpO1xuICB9XG5cbiAgZm4uaWQgPSArK2NyZWF0ZWQ7XG5cbiAgLy8gVGhlIHN0YXRlIGlzIGF0dGFjaGVkIHRvIHRoZSBmdW5jdGlvbiBvYmplY3Qgc28gaXQncyBhdmFpbGFibGUgdG8gdGhlXG4gIC8vIHN0YXRlLWxlc3MgZnVuY3Rpb25zIHdoZW4gcnVubmluZyB1bmRlciBgdGhpcy5gLlxuICBmbi5jaGFpbiA9IG51bGw7XG4gIGZuLnBhcmVudCA9IG51bGw7XG4gIGZuLnBhdXNlZCA9IGZhbHNlO1xuICBmbi5yZXNvbHZlZCA9IFtdO1xuICBmbi5maW5hbGl6ZXJzID0gW107XG5cbiAgLy8gRXhwb3NlIHRoZSBiZWhhdmlvdXIgaW4gdGhlIGZ1bmN0b3JcbiAgZm4ucGF1c2UgPSBwYXVzZTtcbiAgZm4ucmVzdW1lID0gcmVzdW1lO1xuICBmbi5mb3JrID0gZm9yaztcbiAgZm4uam9pbiA9IGpvaW47XG4gIGZuLmZpbmFsaXplID0gZmluYWxpemU7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZuLCAnZXhoYXVzdGVkJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZWQubGVuZ3RoID49IHRoaXMuY2hhaW4uX19leHBlY3RhdGlvbnNfXy5sZW5ndGg7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZm47XG59XG5cbi8vIFRoaXMgaXMgdGhlIGNvcmUgcmVzb2x1dGlvbiBhbGdvcml0aG0sIGl0IG9wZXJhdGVzIG92ZXIgdGhlIGNoYWluXG4vLyBvZiBleHBlY3RhdGlvbnMgY2hlY2tpbmcgdGhlbSBvbmUgYWZ0ZXIgdGhlIG90aGVyIGFnYWluc3QgYSB2YWx1ZS5cbi8vIElmIGEgZnVuY3Rpb24gaXMgcmV0dXJuZWQgaXQnbGwgYmUgaW1tZWRpYXRlbHkgY2FsbGVkIHVzaW5nIHRoZVxuLy8gZXhwZWN0YXRpb24gaW5zdGFuY2UgYXMgY29udGV4dCBhbmQgcGFzc2luZyBhcyBvbmx5IGFyZ3VtZW50IHRoZVxuLy8gY3VycmVudCByZXNvbHZlIGZ1bmN0aW9uLCB0aGlzIGFsbG93cyBhbiBleHBlY3RhdGlvbiB0byBvdmVycmlkZVxuLy8gdGhlIHZhbHVlIGFuZC9vciBjb250cm9sIHRoZSByZXNvbHV0aW9uIHdpdGhvdXQgZXhwb3NpbmcgdG9vIG1hbnlcbi8vIGludGVybmFsIGRldGFpbHMuXG4vLyBXaGVuIGl0IHJldHVybnMgYHVuZGVmaW5lZGAgaXQganVzdCBtZWFucyB0aGF0IHRoZSByZXNvbHV0aW9uIHdhc1xuLy8gcGF1c2VkIChhc3luYyksIHdlIGNhbiBub3Qgb2J0YWluIGEgZmluYWwgcmVzdWx0IHVzaW5nIGEgc3luY2hyb25vdXNcbi8vIGNhbGwuIFRoaXMgY2FuIGJlIHVzZWQgYnkgbWF0Y2hlcnMgd2hlbiB0YWtpbmcgb3ZlciB0aGUgcmVzb2x1dGlvbiB0b1xuLy8ga25vdyBpZiB0aGV5IG5lZWQgdG8gbWFuZ2xlIHRoZSByZXN1bHRzIG9yIHRoZXkgaGF2ZSB0byByZWdpc3RlciBhXG4vLyBmaW5hbGl6ZXIgdG8gYmUgbm90aWZpZWQgb2YgdGhlIGZpbmFsIHJlc3VsdCBmcm9tIHRoZSBjaGFpbi5cbmZ1bmN0aW9uIHJlc29sdmVyICh2YWx1ZSkge1xuICB2YXIgbGlzdCwgcmVzdWx0LCBleHA7XG5cbiAgbGlzdCA9IHRoaXMuY2hhaW4uX19leHBlY3RhdGlvbnNfXztcbiAgb2Zmc2V0ID0gdGhpcy5yZXNvbHZlZC5sZW5ndGg7XG4gIHJlc3VsdCA9IHRydWU7XG5cbiAgZm9yICh2YXIgaSA9IG9mZnNldDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBDcmVhdGUgYSBuZXcgb2JqZWN0IGluaGVyaXRpbmcgZnJvbSB0aGUgZXhwZWN0YXRpb24gYnV0IHdpdGggdGhlXG4gICAgLy8gY3VycmVudCBhY3R1YWwgdmFsdWUgcHJvdmlzaW9uZWQuIEl0IGFsbG93cyB0aGUgZXhwcmVzc2lvbiB0byBtdXRhdGVcbiAgICAvLyBpdHMgc3RhdGUgZm9yIHRoaXMgZXhlY3V0aW9uIGJ1dCBub3QgYWZmZWN0IG90aGVyIHVzZXMgb2YgaXQuXG4gICAgZXhwID0gdXRpbC5jcmVhdGUobGlzdFtpXSwgeyBhY3R1YWw6IHZhbHVlIH0pO1xuXG4gICAgLy8gS2VlcCB0cmFjayBvZiByZXNvbHZlZCBleHBlY3RhdGlvbnNcbiAgICB0aGlzLnJlc29sdmVkLnB1c2goZXhwKTtcblxuICAgIC8vIEV4ZWN1dGUgdGhlIGV4cGVjdGF0aW9uIHRvIG9idGFpbiBpdHMgcmVzdWx0XG4gICAgcmVzdWx0ID0gZXhwLnJlc3VsdCA9IGV4cC5yZXNvbHZlKCk7XG5cbiAgICAvLyBBbGxvdyBleHBlY3RhdGlvbnMgdG8gdGFrZSBjb250cm9sIGZvciB0aGUgcmVtYWluaW5nIG9mIHRoZSBjaGFpblxuICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBTaW5jZSB0aGUgY29udHJvbCBpcyBkZWxlZ2F0ZWQgdG8gdGhlIGV4cHJlc3Npb24gd2UgZG9uJ3QgaGF2ZSB0b1xuICAgICAgLy8gZG8gYW55dGhpbmcgbW9yZSBoZXJlLlxuICAgICAgZXhwLnJlc3VsdCA9IHJlc3VsdC5jYWxsKGV4cCwgdGhpcyk7XG4gICAgICByZXR1cm4gZXhwLnJlc3VsdDtcbiAgICB9XG5cbiAgICAvLyBTdG9wIG9uIGZpcnN0IGZhaWx1cmVcbiAgICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB3ZSBqdXN0IG5lZWQgdG8gYXBwbHkgYW55IHBlbmRpbmcgZmluYWxpemVyc1xuICByZXR1cm4gdGhpcy5maW5hbGl6ZShyZXN1bHQpO1xufVxuXG5cbi8vIFdoZW4gcmVzb2x2aW5nIGFzeW5jIGZsb3dzIChpLmUuOiBwcm9taXNlcykgdGhpcyB3aWxsIHBhdXNlIHRoZSBnaXZlblxuLy8gcmVzb2x2ZXIgdW50aWwgYSBjYWxsIHRvIC5yZXN1bWUoKSBpcyBtYWRlLlxuZnVuY3Rpb24gcGF1c2UgKCkge1xuICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc29sdmVyIGFscmVhZHkgcGF1c2VkJyk7XG4gIH1cblxuICB0aGlzLnBhdXNlZCA9IHRydWU7XG59XG5cbi8vIE9uY2UgdGhlIGFzeW5jIGZsb3cgaGFzIGNvbXBsZXRlZCB3ZSBjYW4gY29udGludWUgcmVzb2x2aW5nIHdoZXJlIHdlXG4vLyBzdG9wZWQuIFdoZW4gdGhlIG92ZXJyaWRlIHBhcmFtIGlzIG5vdCB1bmRlZmluZWQgd2UnbGwgc2tpcCBjYWxsaW5nIHRoZVxuLy8gcmVzb2x2ZXIgYW5kIGFzc3VtZSB0aGF0IGJvb2wgYXMgdGhlIGZpbmFsIHJlc3VsdC4gVGhpcyBhbGxvd3MgdGhlIGFzeW5jXG4vLyBjb2RlIHRvIHNob3J0Y3V0IHRoZSByZXNvbHZlci5cbmZ1bmN0aW9uIHJlc3VtZSAoYWN0dWFsLCBvdmVycmlkZSkge1xuICBpZiAoIXRoaXMucGF1c2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHZlciBpcyBub3QgY3VycmVudGx5IHBhdXNlZCcpO1xuICB9XG5cbiAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcblxuICAvLyBBIGZpbmFsIHJlc3VsdCB3YXMgcHJvdmlkZWQgc28ganVzdCBmaW5hbGl6ZSB0aGUgcmVzb2x2ZXJcbiAgaWYgKG92ZXJyaWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdGhpcy5maW5hbGl6ZShvdmVycmlkZSk7XG4gIH1cblxuICAvLyBMZXQncyBjb250aW51ZSByZXNvbHZpbmcgd2l0aCB0aGUgbmV3IHZhbHVlXG4gIC8vIE5vdGU6IHRoaXMoKSBsb29rcyB3ZWlyZCBidXQgcmVtZW1iZXIgd2UncmUgdXNpbmcgYSBmdW5jdGlvbiBhcyBjb250ZXh0XG4gIHJldHVybiB0aGlzKGFjdHVhbCk7XG59XG5cbi8vIENsb25lcyB0aGUgY3VycmVudCByZXNvbHZlciBzbyB3ZSBjYW4gZm9yayBhbmQgZGlzY2FyZCBvcGVyYXRpb25zLlxuZnVuY3Rpb24gZm9yayAoKSB7XG4gIHZhciBicmFuY2ggPSBhY3F1aXJlKHRoaXMuY2hhaW4pO1xuICBicmFuY2gucGFyZW50ID0gdGhpcztcbiAgYnJhbmNoLnJlc29sdmVkID0gXy5yZWplY3QodGhpcy5yZXNvbHZlZCwgQXJyYXkuaXNBcnJheSk7XG4gIHJldHVybiBicmFuY2g7XG59XG5cbi8vIEFzc3VtZSB0aGUgcmVzdWx0cyBmcm9tIGEgZm9yayBpbiB0aGUgbWFpbiByZXNvbHZlclxuZnVuY3Rpb24gam9pbiAoZm9yaykge1xuICB2YXIgbGVuID0gXy5yZWplY3QodGhpcy5yZXNvbHZlZCwgQXJyYXkuaXNBcnJheSkubGVuZ3RoO1xuICB0aGlzLnJlc29sdmVkLnB1c2goXG4gICAgZm9yay5yZXNvbHZlZC5zbGljZShsZW4pXG4gICk7XG59XG5cbi8vIFdoZW4gdGhlIGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24gaXQgZ2V0cyByZWdpc3RlcmVkIGFzIGEgZmluYWxpemVyIGZvciB0aGVcbi8vIHJlc3VsdCBvYnRhaW5lZCBvbmNlIHRoZSBleHByZXNzaW9uIGhhcyBiZWVuIGZ1bGx5IHJlc29sdmVkIChpLmUuIGFzeW5jKS5cbi8vIE90aGVyd2lzZSBpdCdsbCBleGVjdXRlIGFueSByZWdpc3RlcmVkIGZ1bmN0aW9ucyBvbiB0aGUgZ2l2ZW4gcmVzdWx0IGFuZFxuLy8gYWxsb3cgdGhlbSB0byBjaGFuZ2UgaXQgYmVmb3JlIHJlbGVhc2luZyB0aGUgcmVzb2x2ZXIgaW50byB0aGUgcG9vbC5cbmZ1bmN0aW9uIGZpbmFsaXplKHJlc3VsdCkge1xuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMuZmluYWxpemVycy5wdXNoKFxuICAgICAgW3Jlc3VsdCwgXy5sYXN0KHRoaXMucmVzb2x2ZWQpXVxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gTm90aGluZyB5ZXQgdG8gZmluYWxpemUgc2luY2UgdGhlIHJlc3VsdCBpcyBzdGlsbCB1bmtub3duXG4gIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBBbGxvdyBmaW5hbGl6ZXJzIHRvIHRvZ2dsZSB0aGUgcmVzdWx0IChMSUZPIG9yZGVyKVxuICB2YXIgZmluYWxpemVyO1xuICB3aGlsZSAodGhpcy5maW5hbGl6ZXJzLmxlbmd0aCA+IDApIHtcbiAgICBmaW5hbGl6ZXIgPSB0aGlzLmZpbmFsaXplcnMucG9wKCk7XG4gICAgcmVzdWx0ID0gZmluYWxpemVyWzBdLmNhbGwoZmluYWxpemVyWzFdLCByZXN1bHQpO1xuICAgIGZpbmFsaXplclsxXS5yZXN1bHQgPSByZXN1bHQ7XG4gIH1cblxuICAvLyBMZXQgdGhlIGNoYWluIGRpc3BhdGNoIHRoZSBmaW5hbCByZXN1bHQgYnV0IG9ubHkgZm9yIG5vbi1mb3JrZWQgcmVzb2x2ZXJzXG4gIGlmICghdGhpcy5wYXJlbnQpIHtcbiAgICB0aGlzLmNoYWluLmRpc3BhdGNoUmVzdWx0KHRoaXMucmVzb2x2ZWQsIHJlc3VsdCk7XG4gIH1cblxuICAvLyBXaGVuIGEgZmluYWwgcmVzdWx0IGhhcyBiZWVuIG9idGFpbmVkIHJlbGVhc2UgdGhlIHJlc29sdmVyIHRvIHRoZSBwb29sXG4gIHBvb2wucHVzaCh0aGlzKTtcbiAgaWYgKHBvb2wubGVuZ3RoID4gY3JlYXRlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUG9vbCBjb3JydXB0ZWQhIENyZWF0ZWQgJyArIGNyZWF0ZWQgKyAnIGJ1dCB0aGVyZSBhcmUgJyArIHBvb2wubGVuZ3RoICsgJyBwb29sZWQnKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEFjcXVpcmVzIGEgcmVzb2x2ZXIgZnVuY3RvciwgaWYgdGhlcmUgaXMgb25lIGluIHRoZSBwb29sIGl0J2xsIGJlIHJlc2V0IGFuZFxuLy8gcmV1c2VkLCBvdGhlcndpc2UgaXQnbGwgY3JlYXRlIGEgbmV3IG9uZS4gV2hlbiB5b3UncmUgZG9uZSB3aXRoIHRoZSByZXNvbHZlclxuLy8geW91IHNob3VkIGdpdmUgaXQgdG8gYHJlbGVhc2UoKWAgc28gaXQgY2FuIGJlIGluY29ycG9yYXRlZCB0byB0aGUgcG9vbC5cbi8vIFRoZSByZWFzb24gZm9yIHVzaW5nIGEgcG9vbCBvZiBvYmplY3RzIGhlcmUgaXMgdGhhdCBldmVyeSB0aW1lIHdlIGV2YWx1YXRlXG4vLyBhbiBleHByZXNzaW9uIHdlJ2xsIG5lZWQgYSByZXNvbHZlciwgd2hlbiB1c2luZyBxdWFudGlmaWVycyBtdWx0aXBsZSBmb3Jrc1xuLy8gd2lsbCBiZSBjcmVhdGVkLCBzbyBpdCdzIGltcG9ydGFudCB0byBpbXByb3ZlIHRoZSBwZXJmb3JtYW5jZS5cbmZ1bmN0aW9uIGFjcXVpcmUgKGNoYWluKSB7XG4gIHZhciByZXNvbHZlciA9IHBvb2wucG9wKCkgfHwgZmFjdG9yeSgpO1xuXG4gIC8vIFJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgcmVzb2x2ZXJcbiAgcmVzb2x2ZXIuY2hhaW4gPSBjaGFpbjtcbiAgcmVzb2x2ZXIucGFyZW50ID0gbnVsbDtcbiAgcmVzb2x2ZXIucGF1c2VkID0gZmFsc2U7XG4gIHdoaWxlIChyZXNvbHZlci5yZXNvbHZlZC5sZW5ndGggPiAwKSB7XG4gICAgcmVzb2x2ZXIucmVzb2x2ZWQucG9wKCk7XG4gIH1cbiAgd2hpbGUgKHJlc29sdmVyLmZpbmFsaXplcnMubGVuZ3RoID4gMCkge1xuICAgIHJlc29sdmVyLmZpbmFsaXplcnMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzb2x2ZXI7XG59XG5cblxuZXhwb3J0cy5hY3F1aXJlID0gYWNxdWlyZTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbXhwWWk5eVpYTnZiSFpsY25NdWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqdEJRVUZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVpTENKbWFXeGxJam9pWjJWdVpYSmhkR1ZrTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYkluWmhjaUJmSUQwZ0tIUjVjR1Z2WmlCM2FXNWtiM2NnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCM2FXNWtiM2RiSjE4blhTQTZJSFI1Y0dWdlppQm5iRzlpWVd3Z0lUMDlJRndpZFc1a1pXWnBibVZrWENJZ1B5Qm5iRzlpWVd4YkoxOG5YU0E2SUc1MWJHd3BPMXh1WEc1MllYSWdkWFJwYkNBOUlISmxjWFZwY21Vb0p5NHZkWFJwYkNjcE8xeHVYRzR2THlCVmMyVWdZU0JqWVhCd1pXUWdjRzl2YkN3Z2RHaGxJSEpsYkdWaGMybHVaeUJoYkdkdmNtbDBhRzBnYVhNZ2NISmxkSFI1SUhOdmJHbGtJSE52SUhkbElITm9iM1ZzWkZ4dUx5OGdhR0YyWlNCaElHZHZiMlFnY21VdGRYTmxJSEpoZEdsdklIZHBkR2dnYW5WemRDQmhJR1psZHlCcGJpQjBhR1VnY0c5dmJDNGdWR2hsYmlCcGJpQmpZWE5sWEc0dkx5QnpiMjFsZEdocGJtY2daMjlsY3lCM2NtOXVaeUIwYUdVZ1IwTWdkMmxzYkNCMFlXdGxJR05oY21VZ2IyWWdhWFFnWVdaMFpYSWdZU0IzYUdsc1pTNWNiblpoY2lCd2IyOXNJRDBnZFhScGJDNURZWEJ3WldSUWIyOXNLREV3TUNrN1hHNTJZWElnWTNKbFlYUmxaQ0E5SURBN1hHNWNibHh1THk4Z1NXNXpkR0Z1ZEdsaGRHVnpJR0VnYm1WM0lISmxjMjlzZG1WeUlHWjFibU4wYjNKY2JtWjFibU4wYVc5dUlHWmhZM1J2Y25rZ0tDa2dlMXh1SUNBdkx5QktkWE4wSUdadmNuZGhjbVJ6SUhSb1pTQmpZV3hzSUhSdklIUm9aU0J5WlhOdmJIWmxjaUJpZVNCelpYUjBhVzVuSUdsMGMyVnNaaUJoY3lCamIyNTBaWGgwTGx4dUlDQm1kVzVqZEdsdmJpQm1iaUFvZG1Gc2RXVXBJSHRjYmlBZ0lDQnlaWFIxY200Z2NtVnpiMngyWlhJdVkyRnNiQ2htYml3Z2RtRnNkV1VwTzF4dUlDQjlYRzVjYmlBZ1ptNHVhV1FnUFNBcksyTnlaV0YwWldRN1hHNWNiaUFnTHk4Z1ZHaGxJSE4wWVhSbElHbHpJR0YwZEdGamFHVmtJSFJ2SUhSb1pTQm1kVzVqZEdsdmJpQnZZbXBsWTNRZ2MyOGdhWFFuY3lCaGRtRnBiR0ZpYkdVZ2RHOGdkR2hsWEc0Z0lDOHZJSE4wWVhSbExXeGxjM01nWm5WdVkzUnBiMjV6SUhkb1pXNGdjblZ1Ym1sdVp5QjFibVJsY2lCZ2RHaHBjeTVnTGx4dUlDQm1iaTVqYUdGcGJpQTlJRzUxYkd3N1hHNGdJR1p1TG5CaGNtVnVkQ0E5SUc1MWJHdzdYRzRnSUdadUxuQmhkWE5sWkNBOUlHWmhiSE5sTzF4dUlDQm1iaTV5WlhOdmJIWmxaQ0E5SUZ0ZE8xeHVJQ0JtYmk1bWFXNWhiR2w2WlhKeklEMGdXMTA3WEc1Y2JpQWdMeThnUlhod2IzTmxJSFJvWlNCaVpXaGhkbWx2ZFhJZ2FXNGdkR2hsSUdaMWJtTjBiM0pjYmlBZ1ptNHVjR0YxYzJVZ1BTQndZWFZ6WlR0Y2JpQWdabTR1Y21WemRXMWxJRDBnY21WemRXMWxPMXh1SUNCbWJpNW1iM0pySUQwZ1ptOXlhenRjYmlBZ1ptNHVhbTlwYmlBOUlHcHZhVzQ3WEc0Z0lHWnVMbVpwYm1Gc2FYcGxJRDBnWm1sdVlXeHBlbVU3WEc1Y2JpQWdUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1S0dadUxDQW5aWGhvWVhWemRHVmtKeXdnZTF4dUlDQWdJR2RsZERvZ1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11Y21WemIyeDJaV1F1YkdWdVozUm9JRDQ5SUhSb2FYTXVZMmhoYVc0dVgxOWxlSEJsWTNSaGRHbHZibk5mWHk1c1pXNW5kR2c3WEc0Z0lDQWdmVnh1SUNCOUtUdGNibHh1SUNCeVpYUjFjbTRnWm00N1hHNTlYRzVjYmk4dklGUm9hWE1nYVhNZ2RHaGxJR052Y21VZ2NtVnpiMngxZEdsdmJpQmhiR2R2Y21sMGFHMHNJR2wwSUc5d1pYSmhkR1Z6SUc5MlpYSWdkR2hsSUdOb1lXbHVYRzR2THlCdlppQmxlSEJsWTNSaGRHbHZibk1nWTJobFkydHBibWNnZEdobGJTQnZibVVnWVdaMFpYSWdkR2hsSUc5MGFHVnlJR0ZuWVdsdWMzUWdZU0IyWVd4MVpTNWNiaTh2SUVsbUlHRWdablZ1WTNScGIyNGdhWE1nY21WMGRYSnVaV1FnYVhRbmJHd2dZbVVnYVcxdFpXUnBZWFJsYkhrZ1kyRnNiR1ZrSUhWemFXNW5JSFJvWlZ4dUx5OGdaWGh3WldOMFlYUnBiMjRnYVc1emRHRnVZMlVnWVhNZ1kyOXVkR1Y0ZENCaGJtUWdjR0Z6YzJsdVp5QmhjeUJ2Ym14NUlHRnlaM1Z0Wlc1MElIUm9aVnh1THk4Z1kzVnljbVZ1ZENCeVpYTnZiSFpsSUdaMWJtTjBhVzl1TENCMGFHbHpJR0ZzYkc5M2N5QmhiaUJsZUhCbFkzUmhkR2x2YmlCMGJ5QnZkbVZ5Y21sa1pWeHVMeThnZEdobElIWmhiSFZsSUdGdVpDOXZjaUJqYjI1MGNtOXNJSFJvWlNCeVpYTnZiSFYwYVc5dUlIZHBkR2h2ZFhRZ1pYaHdiM05wYm1jZ2RHOXZJRzFoYm5sY2JpOHZJR2x1ZEdWeWJtRnNJR1JsZEdGcGJITXVYRzR2THlCWGFHVnVJR2wwSUhKbGRIVnlibk1nWUhWdVpHVm1hVzVsWkdBZ2FYUWdhblZ6ZENCdFpXRnVjeUIwYUdGMElIUm9aU0J5WlhOdmJIVjBhVzl1SUhkaGMxeHVMeThnY0dGMWMyVmtJQ2hoYzNsdVl5a3NJSGRsSUdOaGJpQnViM1FnYjJKMFlXbHVJR0VnWm1sdVlXd2djbVZ6ZFd4MElIVnphVzVuSUdFZ2MzbHVZMmh5YjI1dmRYTmNiaTh2SUdOaGJHd3VJRlJvYVhNZ1kyRnVJR0psSUhWelpXUWdZbmtnYldGMFkyaGxjbk1nZDJobGJpQjBZV3RwYm1jZ2IzWmxjaUIwYUdVZ2NtVnpiMngxZEdsdmJpQjBiMXh1THk4Z2EyNXZkeUJwWmlCMGFHVjVJRzVsWldRZ2RHOGdiV0Z1WjJ4bElIUm9aU0J5WlhOMWJIUnpJRzl5SUhSb1pYa2dhR0YyWlNCMGJ5QnlaV2RwYzNSbGNpQmhYRzR2THlCbWFXNWhiR2w2WlhJZ2RHOGdZbVVnYm05MGFXWnBaV1FnYjJZZ2RHaGxJR1pwYm1Gc0lISmxjM1ZzZENCbWNtOXRJSFJvWlNCamFHRnBiaTVjYm1aMWJtTjBhVzl1SUhKbGMyOXNkbVZ5SUNoMllXeDFaU2tnZTF4dUlDQjJZWElnYkdsemRDd2djbVZ6ZFd4MExDQmxlSEE3WEc1Y2JpQWdiR2x6ZENBOUlIUm9hWE11WTJoaGFXNHVYMTlsZUhCbFkzUmhkR2x2Ym5OZlh6dGNiaUFnYjJabWMyVjBJRDBnZEdocGN5NXlaWE52YkhabFpDNXNaVzVuZEdnN1hHNGdJSEpsYzNWc2RDQTlJSFJ5ZFdVN1hHNWNiaUFnWm05eUlDaDJZWElnYVNBOUlHOW1abk5sZERzZ2FTQThJR3hwYzNRdWJHVnVaM1JvT3lCcEt5c3BJSHRjYmlBZ0lDQXZMeUJEY21WaGRHVWdZU0J1WlhjZ2IySnFaV04wSUdsdWFHVnlhWFJwYm1jZ1puSnZiU0IwYUdVZ1pYaHdaV04wWVhScGIyNGdZblYwSUhkcGRHZ2dkR2hsWEc0Z0lDQWdMeThnWTNWeWNtVnVkQ0JoWTNSMVlXd2dkbUZzZFdVZ2NISnZkbWx6YVc5dVpXUXVJRWwwSUdGc2JHOTNjeUIwYUdVZ1pYaHdjbVZ6YzJsdmJpQjBieUJ0ZFhSaGRHVmNiaUFnSUNBdkx5QnBkSE1nYzNSaGRHVWdabTl5SUhSb2FYTWdaWGhsWTNWMGFXOXVJR0oxZENCdWIzUWdZV1ptWldOMElHOTBhR1Z5SUhWelpYTWdiMllnYVhRdVhHNGdJQ0FnWlhod0lEMGdkWFJwYkM1amNtVmhkR1VvYkdsemRGdHBYU3dnZXlCaFkzUjFZV3c2SUhaaGJIVmxJSDBwTzF4dVhHNGdJQ0FnTHk4Z1MyVmxjQ0IwY21GamF5QnZaaUJ5WlhOdmJIWmxaQ0JsZUhCbFkzUmhkR2x2Ym5OY2JpQWdJQ0IwYUdsekxuSmxjMjlzZG1Wa0xuQjFjMmdvWlhod0tUdGNibHh1SUNBZ0lDOHZJRVY0WldOMWRHVWdkR2hsSUdWNGNHVmpkR0YwYVc5dUlIUnZJRzlpZEdGcGJpQnBkSE1nY21WemRXeDBYRzRnSUNBZ2NtVnpkV3gwSUQwZ1pYaHdMbkpsYzNWc2RDQTlJR1Y0Y0M1eVpYTnZiSFpsS0NrN1hHNWNiaUFnSUNBdkx5QkJiR3h2ZHlCbGVIQmxZM1JoZEdsdmJuTWdkRzhnZEdGclpTQmpiMjUwY205c0lHWnZjaUIwYUdVZ2NtVnRZV2x1YVc1bklHOW1JSFJvWlNCamFHRnBibHh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdjbVZ6ZFd4MElEMDlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnSUNBdkx5QlRhVzVqWlNCMGFHVWdZMjl1ZEhKdmJDQnBjeUJrWld4bFoyRjBaV1FnZEc4Z2RHaGxJR1Y0Y0hKbGMzTnBiMjRnZDJVZ1pHOXVKM1FnYUdGMlpTQjBiMXh1SUNBZ0lDQWdMeThnWkc4Z1lXNTVkR2hwYm1jZ2JXOXlaU0JvWlhKbExseHVJQ0FnSUNBZ1pYaHdMbkpsYzNWc2RDQTlJSEpsYzNWc2RDNWpZV3hzS0dWNGNDd2dkR2hwY3lrN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWlhod0xuSmxjM1ZzZER0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2THlCVGRHOXdJRzl1SUdacGNuTjBJR1poYVd4MWNtVmNiaUFnSUNCcFppQW9jbVZ6ZFd4MElEMDlQU0JtWVd4elpTa2dlMXh1SUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnZlZ4dUlDQjlYRzVjYmlBZ0x5OGdRWFFnZEdocGN5QndiMmx1ZENCM1pTQnFkWE4wSUc1bFpXUWdkRzhnWVhCd2JIa2dZVzU1SUhCbGJtUnBibWNnWm1sdVlXeHBlbVZ5YzF4dUlDQnlaWFIxY200Z2RHaHBjeTVtYVc1aGJHbDZaU2h5WlhOMWJIUXBPMXh1ZlZ4dVhHNWNiaTh2SUZkb1pXNGdjbVZ6YjJ4MmFXNW5JR0Z6ZVc1aklHWnNiM2R6SUNocExtVXVPaUJ3Y205dGFYTmxjeWtnZEdocGN5QjNhV3hzSUhCaGRYTmxJSFJvWlNCbmFYWmxibHh1THk4Z2NtVnpiMngyWlhJZ2RXNTBhV3dnWVNCallXeHNJSFJ2SUM1eVpYTjFiV1VvS1NCcGN5QnRZV1JsTGx4dVpuVnVZM1JwYjI0Z2NHRjFjMlVnS0NrZ2UxeHVJQ0JwWmlBb2RHaHBjeTV3WVhWelpXUXBJSHRjYmlBZ0lDQjBhSEp2ZHlCdVpYY2dSWEp5YjNJb0oxSmxjMjlzZG1WeUlHRnNjbVZoWkhrZ2NHRjFjMlZrSnlrN1hHNGdJSDFjYmx4dUlDQjBhR2x6TG5CaGRYTmxaQ0E5SUhSeWRXVTdYRzU5WEc1Y2JpOHZJRTl1WTJVZ2RHaGxJR0Z6ZVc1aklHWnNiM2NnYUdGeklHTnZiWEJzWlhSbFpDQjNaU0JqWVc0Z1kyOXVkR2x1ZFdVZ2NtVnpiMngyYVc1bklIZG9aWEpsSUhkbFhHNHZMeUJ6ZEc5d1pXUXVJRmRvWlc0Z2RHaGxJRzkyWlhKeWFXUmxJSEJoY21GdElHbHpJRzV2ZENCMWJtUmxabWx1WldRZ2QyVW5iR3dnYzJ0cGNDQmpZV3hzYVc1bklIUm9aVnh1THk4Z2NtVnpiMngyWlhJZ1lXNWtJR0Z6YzNWdFpTQjBhR0YwSUdKdmIyd2dZWE1nZEdobElHWnBibUZzSUhKbGMzVnNkQzRnVkdocGN5QmhiR3h2ZDNNZ2RHaGxJR0Z6ZVc1alhHNHZMeUJqYjJSbElIUnZJSE5vYjNKMFkzVjBJSFJvWlNCeVpYTnZiSFpsY2k1Y2JtWjFibU4wYVc5dUlISmxjM1Z0WlNBb1lXTjBkV0ZzTENCdmRtVnljbWxrWlNrZ2UxeHVJQ0JwWmlBb0lYUm9hWE11Y0dGMWMyVmtLU0I3WEc0Z0lDQWdkR2h5YjNjZ2JtVjNJRVZ5Y205eUtDZFNaWE52YkhabGNpQnBjeUJ1YjNRZ1kzVnljbVZ1ZEd4NUlIQmhkWE5sWkNjcE8xeHVJQ0I5WEc1Y2JpQWdkR2hwY3k1d1lYVnpaV1FnUFNCbVlXeHpaVHRjYmx4dUlDQXZMeUJCSUdacGJtRnNJSEpsYzNWc2RDQjNZWE1nY0hKdmRtbGtaV1FnYzI4Z2FuVnpkQ0JtYVc1aGJHbDZaU0IwYUdVZ2NtVnpiMngyWlhKY2JpQWdhV1lnS0c5MlpYSnlhV1JsSUNFOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQnlaWFIxY200Z2RHaHBjeTVtYVc1aGJHbDZaU2h2ZG1WeWNtbGtaU2s3WEc0Z0lIMWNibHh1SUNBdkx5Qk1aWFFuY3lCamIyNTBhVzUxWlNCeVpYTnZiSFpwYm1jZ2QybDBhQ0IwYUdVZ2JtVjNJSFpoYkhWbFhHNGdJQzh2SUU1dmRHVTZJSFJvYVhNb0tTQnNiMjlyY3lCM1pXbHlaQ0JpZFhRZ2NtVnRaVzFpWlhJZ2QyVW5jbVVnZFhOcGJtY2dZU0JtZFc1amRHbHZiaUJoY3lCamIyNTBaWGgwWEc0Z0lISmxkSFZ5YmlCMGFHbHpLR0ZqZEhWaGJDazdYRzU5WEc1Y2JpOHZJRU5zYjI1bGN5QjBhR1VnWTNWeWNtVnVkQ0J5WlhOdmJIWmxjaUJ6YnlCM1pTQmpZVzRnWm05eWF5QmhibVFnWkdselkyRnlaQ0J2Y0dWeVlYUnBiMjV6TGx4dVpuVnVZM1JwYjI0Z1ptOXlheUFvS1NCN1hHNGdJSFpoY2lCaWNtRnVZMmdnUFNCaFkzRjFhWEpsS0hSb2FYTXVZMmhoYVc0cE8xeHVJQ0JpY21GdVkyZ3VjR0Z5Wlc1MElEMGdkR2hwY3p0Y2JpQWdZbkpoYm1Ob0xuSmxjMjlzZG1Wa0lEMGdYeTV5WldwbFkzUW9kR2hwY3k1eVpYTnZiSFpsWkN3Z1FYSnlZWGt1YVhOQmNuSmhlU2s3WEc0Z0lISmxkSFZ5YmlCaWNtRnVZMmc3WEc1OVhHNWNiaTh2SUVGemMzVnRaU0IwYUdVZ2NtVnpkV3gwY3lCbWNtOXRJR0VnWm05eWF5QnBiaUIwYUdVZ2JXRnBiaUJ5WlhOdmJIWmxjbHh1Wm5WdVkzUnBiMjRnYW05cGJpQW9abTl5YXlrZ2UxeHVJQ0IyWVhJZ2JHVnVJRDBnWHk1eVpXcGxZM1FvZEdocGN5NXlaWE52YkhabFpDd2dRWEp5WVhrdWFYTkJjbkpoZVNrdWJHVnVaM1JvTzF4dUlDQjBhR2x6TG5KbGMyOXNkbVZrTG5CMWMyZ29YRzRnSUNBZ1ptOXlheTV5WlhOdmJIWmxaQzV6YkdsalpTaHNaVzRwWEc0Z0lDazdYRzU5WEc1Y2JpOHZJRmRvWlc0Z2RHaGxJR0Z5WjNWdFpXNTBJR2x6SUdFZ1puVnVZM1JwYjI0Z2FYUWdaMlYwY3lCeVpXZHBjM1JsY21Wa0lHRnpJR0VnWm1sdVlXeHBlbVZ5SUdadmNpQjBhR1ZjYmk4dklISmxjM1ZzZENCdlluUmhhVzVsWkNCdmJtTmxJSFJvWlNCbGVIQnlaWE56YVc5dUlHaGhjeUJpWldWdUlHWjFiR3g1SUhKbGMyOXNkbVZrSUNocExtVXVJR0Z6ZVc1aktTNWNiaTh2SUU5MGFHVnlkMmx6WlNCcGRDZHNiQ0JsZUdWamRYUmxJR0Z1ZVNCeVpXZHBjM1JsY21Wa0lHWjFibU4wYVc5dWN5QnZiaUIwYUdVZ1oybDJaVzRnY21WemRXeDBJR0Z1WkZ4dUx5OGdZV3hzYjNjZ2RHaGxiU0IwYnlCamFHRnVaMlVnYVhRZ1ltVm1iM0psSUhKbGJHVmhjMmx1WnlCMGFHVWdjbVZ6YjJ4MlpYSWdhVzUwYnlCMGFHVWdjRzl2YkM1Y2JtWjFibU4wYVc5dUlHWnBibUZzYVhwbEtISmxjM1ZzZENrZ2UxeHVJQ0JwWmlBb2RIbHdaVzltSUhKbGMzVnNkQ0E5UFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lIUm9hWE11Wm1sdVlXeHBlbVZ5Y3k1d2RYTm9LRnh1SUNBZ0lDQWdXM0psYzNWc2RDd2dYeTVzWVhOMEtIUm9hWE11Y21WemIyeDJaV1FwWFZ4dUlDQWdJQ2s3WEc0Z0lDQWdjbVYwZFhKdU8xeHVJQ0I5WEc1Y2JpQWdMeThnVG05MGFHbHVaeUI1WlhRZ2RHOGdabWx1WVd4cGVtVWdjMmx1WTJVZ2RHaGxJSEpsYzNWc2RDQnBjeUJ6ZEdsc2JDQjFibXR1YjNkdVhHNGdJR2xtSUNoeVpYTjFiSFFnUFQwOUlIVnVaR1ZtYVc1bFpDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMWJtUmxabWx1WldRN1hHNGdJSDFjYmx4dUlDQXZMeUJCYkd4dmR5Qm1hVzVoYkdsNlpYSnpJSFJ2SUhSdloyZHNaU0IwYUdVZ2NtVnpkV3gwSUNoTVNVWlBJRzl5WkdWeUtWeHVJQ0IyWVhJZ1ptbHVZV3hwZW1WeU8xeHVJQ0IzYUdsc1pTQW9kR2hwY3k1bWFXNWhiR2w2WlhKekxteGxibWQwYUNBK0lEQXBJSHRjYmlBZ0lDQm1hVzVoYkdsNlpYSWdQU0IwYUdsekxtWnBibUZzYVhwbGNuTXVjRzl3S0NrN1hHNGdJQ0FnY21WemRXeDBJRDBnWm1sdVlXeHBlbVZ5V3pCZExtTmhiR3dvWm1sdVlXeHBlbVZ5V3pGZExDQnlaWE4xYkhRcE8xeHVJQ0FnSUdacGJtRnNhWHBsY2xzeFhTNXlaWE4xYkhRZ1BTQnlaWE4xYkhRN1hHNGdJSDFjYmx4dUlDQXZMeUJNWlhRZ2RHaGxJR05vWVdsdUlHUnBjM0JoZEdOb0lIUm9aU0JtYVc1aGJDQnlaWE4xYkhRZ1luVjBJRzl1YkhrZ1ptOXlJRzV2YmkxbWIzSnJaV1FnY21WemIyeDJaWEp6WEc0Z0lHbG1JQ2doZEdocGN5NXdZWEpsYm5RcElIdGNiaUFnSUNCMGFHbHpMbU5vWVdsdUxtUnBjM0JoZEdOb1VtVnpkV3gwS0hSb2FYTXVjbVZ6YjJ4MlpXUXNJSEpsYzNWc2RDazdYRzRnSUgxY2JseHVJQ0F2THlCWGFHVnVJR0VnWm1sdVlXd2djbVZ6ZFd4MElHaGhjeUJpWldWdUlHOWlkR0ZwYm1Wa0lISmxiR1ZoYzJVZ2RHaGxJSEpsYzI5c2RtVnlJSFJ2SUhSb1pTQndiMjlzWEc0Z0lIQnZiMnd1Y0hWemFDaDBhR2x6S1R0Y2JpQWdhV1lnS0hCdmIyd3ViR1Z1WjNSb0lENGdZM0psWVhSbFpDa2dlMXh1SUNBZ0lIUm9jbTkzSUc1bGR5QkZjbkp2Y2lnblVHOXZiQ0JqYjNKeWRYQjBaV1FoSUVOeVpXRjBaV1FnSnlBcklHTnlaV0YwWldRZ0t5QW5JR0oxZENCMGFHVnlaU0JoY21VZ0p5QXJJSEJ2YjJ3dWJHVnVaM1JvSUNzZ0p5QndiMjlzWldRbktUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQnlaWE4xYkhRN1hHNTlYRzVjYmk4dklFRmpjWFZwY21WeklHRWdjbVZ6YjJ4MlpYSWdablZ1WTNSdmNpd2dhV1lnZEdobGNtVWdhWE1nYjI1bElHbHVJSFJvWlNCd2IyOXNJR2wwSjJ4c0lHSmxJSEpsYzJWMElHRnVaRnh1THk4Z2NtVjFjMlZrTENCdmRHaGxjbmRwYzJVZ2FYUW5iR3dnWTNKbFlYUmxJR0VnYm1WM0lHOXVaUzRnVjJobGJpQjViM1VuY21VZ1pHOXVaU0IzYVhSb0lIUm9aU0J5WlhOdmJIWmxjbHh1THk4Z2VXOTFJSE5vYjNWa0lHZHBkbVVnYVhRZ2RHOGdZSEpsYkdWaGMyVW9LV0FnYzI4Z2FYUWdZMkZ1SUdKbElHbHVZMjl5Y0c5eVlYUmxaQ0IwYnlCMGFHVWdjRzl2YkM1Y2JpOHZJRlJvWlNCeVpXRnpiMjRnWm05eUlIVnphVzVuSUdFZ2NHOXZiQ0J2WmlCdlltcGxZM1J6SUdobGNtVWdhWE1nZEdoaGRDQmxkbVZ5ZVNCMGFXMWxJSGRsSUdWMllXeDFZWFJsWEc0dkx5QmhiaUJsZUhCeVpYTnphVzl1SUhkbEoyeHNJRzVsWldRZ1lTQnlaWE52YkhabGNpd2dkMmhsYmlCMWMybHVaeUJ4ZFdGdWRHbG1hV1Z5Y3lCdGRXeDBhWEJzWlNCbWIzSnJjMXh1THk4Z2QybHNiQ0JpWlNCamNtVmhkR1ZrTENCemJ5QnBkQ2R6SUdsdGNHOXlkR0Z1ZENCMGJ5QnBiWEJ5YjNabElIUm9aU0J3WlhKbWIzSnRZVzVqWlM1Y2JtWjFibU4wYVc5dUlHRmpjWFZwY21VZ0tHTm9ZV2x1S1NCN1hHNGdJSFpoY2lCeVpYTnZiSFpsY2lBOUlIQnZiMnd1Y0c5d0tDa2dmSHdnWm1GamRHOXllU2dwTzF4dVhHNGdJQzh2SUZKbGMyVjBJSFJvWlNCemRHRjBaU0J2WmlCMGFHVWdjbVZ6YjJ4MlpYSmNiaUFnY21WemIyeDJaWEl1WTJoaGFXNGdQU0JqYUdGcGJqdGNiaUFnY21WemIyeDJaWEl1Y0dGeVpXNTBJRDBnYm5Wc2JEdGNiaUFnY21WemIyeDJaWEl1Y0dGMWMyVmtJRDBnWm1Gc2MyVTdYRzRnSUhkb2FXeGxJQ2h5WlhOdmJIWmxjaTV5WlhOdmJIWmxaQzVzWlc1bmRHZ2dQaUF3S1NCN1hHNGdJQ0FnY21WemIyeDJaWEl1Y21WemIyeDJaV1F1Y0c5d0tDazdYRzRnSUgxY2JpQWdkMmhwYkdVZ0tISmxjMjlzZG1WeUxtWnBibUZzYVhwbGNuTXViR1Z1WjNSb0lENGdNQ2tnZTF4dUlDQWdJSEpsYzI5c2RtVnlMbVpwYm1Gc2FYcGxjbk11Y0c5d0tDazdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSTdYRzU5WEc1Y2JseHVaWGh3YjNKMGN5NWhZM0YxYVhKbElEMGdZV054ZFdseVpUdGNiaUpkZlE9PSIsIi8vIFN1cHBvcnQgZm9yIC5zaG91bGQgc3R5bGUgc3ludGF4LCBub3RpY2UgdGhhdCB3aGlsZSBoZXJlIHJlc2lkZXMgdGhlIGNvcmVcbi8vIGxvZ2ljIGZvciBpdCwgdGhlIGludGVyZmFjZSBpcyBkb25lIGluIGFzcy5qcyBpbiBvcmRlciB0byBtYWtlIGl0IHJldHVyblxuLy8gdGhlIGBhc3NgIGZ1bmN0aW9uIGFuZCBwcm92aWRlIHN1cHBvcnQgZm9yIGl0cyB1c2Ugb24gYmVmb3JlRWFjaC9hZnRlckVhY2guXG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcblxuXG52YXIgREVGQVVMVF9QUk9QID0gJ3Nob3VsZCc7XG5cbi8vIEluc3RhbGxzIHRoZSB0eXBpY2FsIC5zaG91bGQgcHJvcGVydHkgb24gdGhlIHJvb3QgT2JqZWN0IHByb3RvdHlwZS5cbi8vIFlvdSBjYW4gaW5zdGFsbCB1bmRlciBhbnkgbmFtZSBvZiB5b3VyIGNob29zaW5nIGJ5IGdpdmluZyBpdCBhcyBhcmd1bWVudC5cbi8vXG4vLyBCYXNpY2FsbHkgYm9ycm93ZWQgZnJvbSB0aGUgQ2hhaSBwcm9qZWN0OlxuLy8gIENvcHlyaWdodChjKSAyMDExLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4vLyAgaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9jaGFpL2Jsb2IvbWFzdGVyL2xpYi9jaGFpL2ludGVyZmFjZS9zaG91bGQuanNcbmZ1bmN0aW9uIHNob3VsZCAobmFtZSkge1xuICBpZiAobmFtZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBzaG91bGQucmVzdG9yZSgpO1xuICB9XG5cbiAgbmFtZSA9IG5hbWUgfHwgREVGQVVMVF9QUk9QO1xuXG4gIGlmIChuYW1lIGluIE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICBpZiAoIUNoYWluLmlzQ2hhaW4oT2JqZWN0LnByb3RvdHlwZVtuYW1lXSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXNzLnNob3VsZDogT2JqZWN0LnByb3RvdHlwZSBhbHJlYWR5IGhhcyBhIC4nICsgbmFtZSArICcgcHJvcGVydHknKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gbW9kaWZ5IE9iamVjdC5wcm90b3R5cGUgdG8gaGF2ZSBgPG5hbWU+YFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgbmFtZSwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKENoYWluLmlzQ2hhaW4odGhpcykpIHtcbiAgICAgICAgLy8gQWN0dWFsbHkgQ2hhaW4gaW5zdGFuY2VzIGRvbid0IGluaGVyaXQgZnJvbSBPYmplY3QgYnV0IHN0aWxsXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSBlbHNlIGlmICh0aGlzIGluc3RhbmNlb2YgU3RyaW5nIHx8IHRoaXMgaW5zdGFuY2VvZiBOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzLmNvbnN0cnVjdG9yKHRoaXMpKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIEJvb2xlYW4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFpbighIXRoaXMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzKTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBBbGxvdzogZ2xvYmFsLmFzcyA9IHJlcXVpcmUoJ2FzcycpLnNob3VsZCgpXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLCAgLy8gQWxsb3cgcmVzdG9yYXRpb25cbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBFeHBvc2UgaXQgYXMgYSBuby1vcCBvbiBDaGFpbnMgc2luY2UgdGhleSBkb24ndCBpbmhlcml0IGZyb20gT2JqZWN0XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlICAvLyBBbGxvdyByZXN0b3JhdGlvblxuICB9KTtcblxufVxuXG5zaG91bGQucmVzdG9yZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIG5hbWUgPSBuYW1lIHx8IERFRkFVTFRfUFJPUDtcblxuICBpZiAobmFtZSBpbiBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgaWYgKENoYWluLmlzQ2hhaW4oT2JqZWN0LnByb3RvdHlwZVtuYW1lXSkpIHtcbiAgICAgIGRlbGV0ZSBPYmplY3QucHJvdG90eXBlW25hbWVdO1xuICAgICAgZGVsZXRlIENoYWluLnByb3RvdHlwZVtuYW1lXTtcbiAgICB9XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGQ7XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ18nXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ18nXSA6IG51bGwpO1xuXG4vLyBHZXQgdGhlIG5hdGl2ZSBQcm9taXNlIG9yIGEgc2hpbVxuZXhwb3J0cy5Qcm9taXNlID0gZ2xvYmFsLlByb21pc2UgfHwgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ3dpbmRvdyddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnd2luZG93J10gOiBudWxsKS5Qcm9taXNlO1xuXG5cbi8vIENhcHBlZCBwb29sIHRvIGxpbWl0IHRoZSBtYXhpbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IGNhbiBiZVxuLy8gc3RvcmVkICh1bmJvdW5kZWQgYnkgZGVmYXVsdCkuXG5leHBvcnRzLkNhcHBlZFBvb2wgPSBmdW5jdGlvbiAobWF4KSB7XG4gIHZhciBwb29sID0gW107XG5cbiAgbWF4ID0gbWF4IHx8IE51bWJlci5NQVhfVkFMVUU7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHBvb2wsICdwdXNoJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAodikge1xuICAgICAgaWYgKHRoaXMubGVuZ3RoIDwgbWF4KSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwodGhpcywgdik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcG9vbDtcbn07XG5cblxudmFyIGRvQ29sb3JzID0gXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgLy8gTWFzdGVyIG92ZXJyaWRlIHdpdGggb3VyIGN1c3RvbSBlbnYgdmFyaWFibGVcbiAgaWYgKHByb2Nlc3MuZW52LkFTU19DT0xPUlMgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAvdHJ1ZXxvbnx5ZXN8ZW5hYmxlZD98MS9pLnRlc3QocHJvY2Vzcy5lbnYuQVNTX0NPTE9SUyk7XG4gIH1cblxuICAvLyBDaGVjayBpZiBLYXJtYSBpcyBiZWluZyB1c2VkIGFuZCBoYXMgZGVmaW5lZCB0aGUgY29sb3JzXG4gIHZhciBrYXJtYSA9IGdsb2JhbC5fX2thcm1hX187XG4gIGlmIChrYXJtYSAmJiBrYXJtYS5jb25maWcgJiYgdHlwZW9mIGthcm1hLmNvbmZpZy5jb2xvcnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGthcm1hLmNvbmZpZy5jb2xvcnM7XG4gIH1cblxuICAvLyBDaGVjayBpZiBtb2NoYSBpcyBhcm91bmQgYW5kIHZlcmlmeSBhZ2FpbnN0IGl0cyBjb25maWd1cmF0aW9uXG4gIHZhciBNb2NoYSA9IGdsb2JhbC5Nb2NoYTtcbiAgaWYgKE1vY2hhID09PSB1bmRlZmluZWQgJiYgcmVxdWlyZS5yZXNvbHZlICYmIHJlcXVpcmUucmVzb2x2ZSgnbW9jaGEnKSkge1xuICAgIE1vY2hhID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ01vY2hhJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydNb2NoYSddIDogbnVsbCk7XG4gIH1cbiAgaWYgKE1vY2hhICE9PSB1bmRlZmluZWQgJiYgTW9jaGEucmVwb3J0ZXJzICE9PSB1bmRlZmluZWQgJiYgTW9jaGEucmVwb3J0ZXJzLkJhc2UgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBNb2NoYS5yZXBvcnRlcnMuQmFzZS51c2VDb2xvcnM7XG4gIH1cblxuICAvLyBRdWVyeSB0aGUgZW52aXJvbm1lbnQgYW5kIHNlZSBpZiBzb21lIGNvbW1vbiB2YXJpYWJsZXMgYXJlIHNldFxuICBpZiAocHJvY2Vzcy5lbnYuTU9DSEFfQ09MT1JTICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoLy0tY29sb3I9YWx3YXlzLy50ZXN0KHByb2Nlc3MuZW52LkdSRVBfT1BUSU9OUyB8fCAnJykpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIEZpbmFsbHkganVzdCBjaGVjayBpZiB0aGUgZW52aXJvbm1lbnQgaXMgY2FwYWJsZVxuICB2YXIgdHR5ID0gcmVxdWlyZSgndHR5Jyk7XG4gIHJldHVybiB0dHkuaXNhdHR5KDEpICYmIHR0eS5pc2F0dHkoMik7XG59KTtcblxuXG4vLyBSZW1vdmUgQU5TSSBlc2NhcGVzIGZyb20gYSBzdHJpbmdcbmZ1bmN0aW9uIHVuYW5zaSAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXFx4MWJcXFsoXFxkKzs/KStbYS16XS9naSwgJycpO1xufVxuXG5cbi8vIEF2b2lkIHJlcGVhdGVkIGNvbXBpbGF0aW9ucyBieSBtZW1vaXppbmdcbnZhciBjb21waWxlVGVtcGxhdGUgPSBfLm1lbW9pemUoZnVuY3Rpb24gKHRwbCkge1xuICByZXR1cm4gXy50ZW1wbGF0ZSh0cGwsIG51bGwsIHtcbiAgICBlc2NhcGU6IC9cXHtcXHsoW1xcc1xcU10rPylcXH1cXH0vZ1xuICB9KTtcbn0pO1xuXG4vLyBEdW1wcyBhcmJpdHJhcnkgdmFsdWVzIGFzIHN0cmluZ3MgaW4gYSBjb25jaXNlIHdheVxuLy8gVE9ETzogaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9jaGFpL2Jsb2IvbWFzdGVyL2xpYi9jaGFpL3V0aWxzL29iakRpc3BsYXkuanNcbmZ1bmN0aW9uIHZhbHVlRHVtcGVyICh2KSB7XG4gIHZhciB2YWx1ZTtcblxuICBpZiAoXy5pc051bWJlcih2KSB8fCBfLmlzTmFOKHYpIHx8IF8uaXNCb29sZWFuKHYpIHx8IF8uaXNOdWxsKHYpIHx8IF8uaXNVbmRlZmluZWQodikpIHtcbiAgICB2YWx1ZSA9ICc8JyArIHYgKyAnPic7XG4gIH0gZWxzZSBpZiAoXy5pc1JlZ0V4cCh2KSkge1xuICAgIHZhbHVlID0gdi50b1N0cmluZygpO1xuICB9IGVsc2UgaWYgKF8uaXNGdW5jdGlvbih2KSkge1xuICAgIGlmICh2LmRpc3BsYXlOYW1lKSB7XG4gICAgICB2YWx1ZSA9IHYuZGlzcGxheU5hbWUgKyAnKCknO1xuICAgIH0gZWxzZSBpZiAodi5uYW1lKSB7XG4gICAgICB2YWx1ZSA9IHYubmFtZSArICcoKSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gJzxmdW5jdGlvbj4nO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHYpO1xuICB9XG5cbiAgcmV0dXJuICdcXHUwMDFiWzE7MzZtJyArIHZhbHVlICsgJ1xcdTAwMWJbMG0nO1xufVxuXG5cbi8vIEN1c3RvbWl6ZWQgdmVyc2lvbiBvZiBsb2Rhc2ggdGVtcGxhdGVcbmZ1bmN0aW9uIHRlbXBsYXRlICh0cGwsIGNvbnRleHQpIHtcbiAgdmFyIGZuID0gY29tcGlsZVRlbXBsYXRlKHRwbCk7XG4gIGlmIChjb250ZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgb3JpZ0VzY2FwZSA9IF8uZXNjYXBlO1xuICB0cnkge1xuICAgIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IGVzY2FwZSBmdW5jdGlvbiB0byB1c2UgaXQgZm9yIGR1bXBpbmcgZm9ybWF0dGVkIHZhbHVlc1xuICAgIF8uZXNjYXBlID0gdmFsdWVEdW1wZXI7XG5cbiAgICByZXR1cm4gZm4oY29udGV4dCk7XG5cbiAgfSBmaW5hbGx5IHtcbiAgICBfLmVzY2FwZSA9IG9yaWdFc2NhcGU7XG4gIH1cbn1cblxuLy8gQSBzaW1wbGUgZmFzdCBmdW5jdGlvbiBiaW5kaW5nIHByaW1pdGl2ZSBvbmx5IHN1cHBvcnRpbmcgc2V0dGluZyB0aGUgY29udGV4dFxuZnVuY3Rpb24gYmluZChmbiwgdGhpc0FyZykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseSh0aGlzQXJnLCBhcmd1bWVudHMpO1xuICB9O1xufVxuXG4vLyBRdWlja2x5IGNyZWF0ZXMgYSBuZXcgb2JqZWN0IHdpdGggYSBjdXN0b20gcHJvdG90eXBlIGFuZCBzb21lIHZhbHVlXG4vLyBvdmVycmlkZXMuXG5mdW5jdGlvbiBjcmVhdGUocHJvdG8sIHZhbHVlcykge1xuICBpZiAoMCA9PT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gSEFDSzogVXNlIEZ1bmN0aW9uLnByb3RvdHlwZSArIG5ldyBpbnN0ZWFkIG9mIHRoZSBzbG93LWlzaCBPYmplY3QuY3JlYXRlXG4gIGNyZWF0ZS5wcm90b3R5cGUgPSBwcm90bztcbiAgcmV0dXJuIF8uYXNzaWduKG5ldyBjcmVhdGUoKSwgdmFsdWVzIHx8IHt9KTtcbn1cblxuXG4vLyBGcm9tIGh0dHA6Ly9zaWRlcml0ZS5ibG9nc3BvdC5jb20vMjAxNC8xMS9zdXBlci1mYXN0LWFuZC1hY2N1cmF0ZS1zdHJpbmctZGlzdGFuY2UuaHRtbFxuZnVuY3Rpb24gc2lmdDQoczEsIHMyLCBtYXhPZmZzZXQpIHtcbiAgaWYgKCFzMSB8fCAhczEubGVuZ3RoKSB7XG4gICAgaWYgKCFzMikge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiBzMi5sZW5ndGg7XG4gIH1cblxuICBpZiAoIXMyIHx8ICFzMi5sZW5ndGgpIHtcbiAgICByZXR1cm4gczEubGVuZ3RoO1xuICB9XG5cbiAgdmFyIGwxID0gczEubGVuZ3RoO1xuICB2YXIgbDIgPSBzMi5sZW5ndGg7XG5cbiAgdmFyIGMxID0gMDsgIC8vIGN1cnNvciBmb3Igc3RyaW5nIDFcbiAgdmFyIGMyID0gMDsgIC8vIGN1cnNvciBmb3Igc3RyaW5nIDJcbiAgdmFyIGxjc3MgPSAwOyAgLy8gbGFyZ2VzdCBjb21tb24gc3Vic2VxdWVuY2VcbiAgdmFyIGxvY2FsX2NzID0gMDsgLy8gbG9jYWwgY29tbW9uIHN1YnN0cmluZ1xuXG4gIHdoaWxlICgoYzEgPCBsMSkgJiYgKGMyIDwgbDIpKSB7XG4gICAgaWYgKHMxLmNoYXJBdChjMSkgPT0gczIuY2hhckF0KGMyKSkge1xuICAgICAgbG9jYWxfY3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgbGNzcyArPSBsb2NhbF9jcztcbiAgICAgIGxvY2FsX2NzID0gMDtcbiAgICAgIGlmIChjMSAhPSBjMikge1xuICAgICAgICBjMSA9IGMyID0gTWF0aC5tYXgoYzEsYzIpOyAvLyB1c2luZyBtYXggdG8gYnlwYXNzIHRoZSBuZWVkIGZvciBjb21wdXRlciB0cmFuc3Bvc2l0aW9ucyAoJ2FiJyB2cyAnYmEnKVxuICAgICAgfVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXhPZmZzZXQ7IGkrKykge1xuICAgICAgICBpZiAoKGMxICsgaSA8IGwxKSAmJiAoczEuY2hhckF0KGMxICsgaSkgPT09IHMyLmNoYXJBdChjMikpKSB7XG4gICAgICAgICAgYzEgKz0gaTtcbiAgICAgICAgICBsb2NhbF9jcysrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoYzIgKyBpIDwgbDIpICYmIChzMS5jaGFyQXQoYzEpID09PSBzMi5jaGFyQXQoYzIgKyBpKSkpIHtcbiAgICAgICAgICBjMiArPSBpO1xuICAgICAgICAgIGxvY2FsX2NzKys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgYzErKztcbiAgICBjMisrO1xuICB9XG4gIGxjc3MgKz0gbG9jYWxfY3M7XG4gIHJldHVybiBNYXRoLnJvdW5kKE1hdGgubWF4KGwxLCBsMikgLSBsY3NzKTtcbn1cblxuZXhwb3J0cy5iaW5kID0gYmluZDtcbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlO1xuZXhwb3J0cy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuZXhwb3J0cy51bmFuc2kgPSB1bmFuc2k7XG5leHBvcnRzLmRvQ29sb3JzID0gZG9Db2xvcnM7XG5leHBvcnRzLnNpZnQ0ID0gc2lmdDQ7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKCdfcHJvY2VzcycpLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbXhwWWk5MWRHbHNMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdYeUE5SUNoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnZDJsdVpHOTNXeWRmSjEwZ09pQjBlWEJsYjJZZ1oyeHZZbUZzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z1oyeHZZbUZzV3lkZkoxMGdPaUJ1ZFd4c0tUdGNibHh1THk4Z1IyVjBJSFJvWlNCdVlYUnBkbVVnVUhKdmJXbHpaU0J2Y2lCaElITm9hVzFjYm1WNGNHOXlkSE11VUhKdmJXbHpaU0E5SUdkc2IySmhiQzVRY205dGFYTmxJSHg4SUNoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnZDJsdVpHOTNXeWQzYVc1a2IzY25YU0E2SUhSNWNHVnZaaUJuYkc5aVlXd2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUJuYkc5aVlXeGJKM2RwYm1SdmR5ZGRJRG9nYm5Wc2JDa3VVSEp2YldselpUdGNibHh1WEc0dkx5QkRZWEJ3WldRZ2NHOXZiQ0IwYnlCc2FXMXBkQ0IwYUdVZ2JXRjRhVzExYlNCdWRXMWlaWElnYjJZZ1pXeGxiV1Z1ZEhNZ2RHaGhkQ0JqWVc0Z1ltVmNiaTh2SUhOMGIzSmxaQ0FvZFc1aWIzVnVaR1ZrSUdKNUlHUmxabUYxYkhRcExseHVaWGh3YjNKMGN5NURZWEJ3WldSUWIyOXNJRDBnWm5WdVkzUnBiMjRnS0cxaGVDa2dlMXh1SUNCMllYSWdjRzl2YkNBOUlGdGRPMXh1WEc0Z0lHMWhlQ0E5SUcxaGVDQjhmQ0JPZFcxaVpYSXVUVUZZWDFaQlRGVkZPMXh1WEc0Z0lFOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBlU2h3YjI5c0xDQW5jSFZ6YUNjc0lIdGNiaUFnSUNCMllXeDFaVG9nWm5WdVkzUnBiMjRnS0hZcElIdGNiaUFnSUNBZ0lHbG1JQ2gwYUdsekxteGxibWQwYUNBOElHMWhlQ2tnZTF4dUlDQWdJQ0FnSUNCQmNuSmhlUzV3Y205MGIzUjVjR1V1Y0hWemFDNWpZV3hzS0hSb2FYTXNJSFlwTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ2ZTazdYRzVjYmlBZ2NtVjBkWEp1SUhCdmIydzdYRzU5TzF4dVhHNWNiblpoY2lCa2IwTnZiRzl5Y3lBOUlGOHViMjVqWlNobWRXNWpkR2x2YmlBb0tTQjdYRzRnSUM4dklFMWhjM1JsY2lCdmRtVnljbWxrWlNCM2FYUm9JRzkxY2lCamRYTjBiMjBnWlc1MklIWmhjbWxoWW14bFhHNGdJR2xtSUNod2NtOWpaWE56TG1WdWRpNUJVMU5mUTA5TVQxSlRJQ0U5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNCeVpYUjFjbTRnTDNSeWRXVjhiMjU4ZVdWemZHVnVZV0pzWldRL2ZERXZhUzUwWlhOMEtIQnliMk5sYzNNdVpXNTJMa0ZUVTE5RFQweFBVbE1wTzF4dUlDQjlYRzVjYmlBZ0x5OGdRMmhsWTJzZ2FXWWdTMkZ5YldFZ2FYTWdZbVZwYm1jZ2RYTmxaQ0JoYm1RZ2FHRnpJR1JsWm1sdVpXUWdkR2hsSUdOdmJHOXljMXh1SUNCMllYSWdhMkZ5YldFZ1BTQm5iRzlpWVd3dVgxOXJZWEp0WVY5Zk8xeHVJQ0JwWmlBb2EyRnliV0VnSmlZZ2EyRnliV0V1WTI5dVptbG5JQ1ltSUhSNWNHVnZaaUJyWVhKdFlTNWpiMjVtYVdjdVkyOXNiM0p6SUNFOVBTQW5kVzVrWldacGJtVmtKeWtnZTF4dUlDQWdJSEpsZEhWeWJpQnJZWEp0WVM1amIyNW1hV2N1WTI5c2IzSnpPMXh1SUNCOVhHNWNiaUFnTHk4Z1EyaGxZMnNnYVdZZ2JXOWphR0VnYVhNZ1lYSnZkVzVrSUdGdVpDQjJaWEpwWm5rZ1lXZGhhVzV6ZENCcGRITWdZMjl1Wm1sbmRYSmhkR2x2Ymx4dUlDQjJZWElnVFc5amFHRWdQU0JuYkc5aVlXd3VUVzlqYUdFN1hHNGdJR2xtSUNoTmIyTm9ZU0E5UFQwZ2RXNWtaV1pwYm1Wa0lDWW1JSEpsY1hWcGNtVXVjbVZ6YjJ4MlpTQW1KaUJ5WlhGMWFYSmxMbkpsYzI5c2RtVW9KMjF2WTJoaEp5a3BJSHRjYmlBZ0lDQk5iMk5vWVNBOUlDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzV3lkTmIyTm9ZU2RkSURvZ2RIbHdaVzltSUdkc2IySmhiQ0FoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaUEvSUdkc2IySmhiRnNuVFc5amFHRW5YU0E2SUc1MWJHd3BPMXh1SUNCOVhHNGdJR2xtSUNoTmIyTm9ZU0FoUFQwZ2RXNWtaV1pwYm1Wa0lDWW1JRTF2WTJoaExuSmxjRzl5ZEdWeWN5QWhQVDBnZFc1a1pXWnBibVZrSUNZbUlFMXZZMmhoTG5KbGNHOXlkR1Z5Y3k1Q1lYTmxJQ0U5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNCeVpYUjFjbTRnVFc5amFHRXVjbVZ3YjNKMFpYSnpMa0poYzJVdWRYTmxRMjlzYjNKek8xeHVJQ0I5WEc1Y2JpQWdMeThnVVhWbGNua2dkR2hsSUdWdWRtbHliMjV0Wlc1MElHRnVaQ0J6WldVZ2FXWWdjMjl0WlNCamIyMXRiMjRnZG1GeWFXRmliR1Z6SUdGeVpTQnpaWFJjYmlBZ2FXWWdLSEJ5YjJObGMzTXVaVzUyTGsxUFEwaEJYME5QVEU5U1V5QWhQVDBnZFc1a1pXWnBibVZrS1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJSDFjYmlBZ2FXWWdLQzh0TFdOdmJHOXlQV0ZzZDJGNWN5OHVkR1Z6ZENod2NtOWpaWE56TG1WdWRpNUhVa1ZRWDA5UVZFbFBUbE1nZkh3Z0p5Y3BLU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lIMWNibHh1SUNBdkx5QkdhVzVoYkd4NUlHcDFjM1FnWTJobFkyc2dhV1lnZEdobElHVnVkbWx5YjI1dFpXNTBJR2x6SUdOaGNHRmliR1ZjYmlBZ2RtRnlJSFIwZVNBOUlISmxjWFZwY21Vb0ozUjBlU2NwTzF4dUlDQnlaWFIxY200Z2RIUjVMbWx6WVhSMGVTZ3hLU0FtSmlCMGRIa3VhWE5oZEhSNUtESXBPMXh1ZlNrN1hHNWNibHh1THk4Z1VtVnRiM1psSUVGT1Uwa2daWE5qWVhCbGN5Qm1jbTl0SUdFZ2MzUnlhVzVuWEc1bWRXNWpkR2x2YmlCMWJtRnVjMmtnS0hOMGNpa2dlMXh1SUNCeVpYUjFjbTRnYzNSeUxuSmxjR3hoWTJVb0wxeGNlREZpWEZ4YktGeGNaQ3M3UHlrclcyRXRlbDB2WjJrc0lDY25LVHRjYm4xY2JseHVYRzR2THlCQmRtOXBaQ0J5WlhCbFlYUmxaQ0JqYjIxd2FXeGhkR2x2Ym5NZ1lua2diV1Z0YjJsNmFXNW5YRzUyWVhJZ1kyOXRjR2xzWlZSbGJYQnNZWFJsSUQwZ1h5NXRaVzF2YVhwbEtHWjFibU4wYVc5dUlDaDBjR3dwSUh0Y2JpQWdjbVYwZFhKdUlGOHVkR1Z0Y0d4aGRHVW9kSEJzTENCdWRXeHNMQ0I3WEc0Z0lDQWdaWE5qWVhCbE9pQXZYRng3WEZ4N0tGdGNYSE5jWEZOZEt6OHBYRng5WEZ4OUwyZGNiaUFnZlNrN1hHNTlLVHRjYmx4dUx5OGdSSFZ0Y0hNZ1lYSmlhWFJ5WVhKNUlIWmhiSFZsY3lCaGN5QnpkSEpwYm1keklHbHVJR0VnWTI5dVkybHpaU0IzWVhsY2JpOHZJRlJQUkU4NklHaDBkSEJ6T2k4dloybDBhSFZpTG1OdmJTOWphR0ZwYW5NdlkyaGhhUzlpYkc5aUwyMWhjM1JsY2k5c2FXSXZZMmhoYVM5MWRHbHNjeTl2WW1wRWFYTndiR0Y1TG1welhHNW1kVzVqZEdsdmJpQjJZV3gxWlVSMWJYQmxjaUFvZGlrZ2UxeHVJQ0IyWVhJZ2RtRnNkV1U3WEc1Y2JpQWdhV1lnS0Y4dWFYTk9kVzFpWlhJb2Rpa2dmSHdnWHk1cGMwNWhUaWgyS1NCOGZDQmZMbWx6UW05dmJHVmhiaWgyS1NCOGZDQmZMbWx6VG5Wc2JDaDJLU0I4ZkNCZkxtbHpWVzVrWldacGJtVmtLSFlwS1NCN1hHNGdJQ0FnZG1Gc2RXVWdQU0FuUENjZ0t5QjJJQ3NnSno0bk8xeHVJQ0I5SUdWc2MyVWdhV1lnS0Y4dWFYTlNaV2RGZUhBb2Rpa3BJSHRjYmlBZ0lDQjJZV3gxWlNBOUlIWXVkRzlUZEhKcGJtY29LVHRjYmlBZ2ZTQmxiSE5sSUdsbUlDaGZMbWx6Um5WdVkzUnBiMjRvZGlrcElIdGNiaUFnSUNCcFppQW9kaTVrYVhOd2JHRjVUbUZ0WlNrZ2UxeHVJQ0FnSUNBZ2RtRnNkV1VnUFNCMkxtUnBjM0JzWVhsT1lXMWxJQ3NnSnlncEp6dGNiaUFnSUNCOUlHVnNjMlVnYVdZZ0tIWXVibUZ0WlNrZ2UxeHVJQ0FnSUNBZ2RtRnNkV1VnUFNCMkxtNWhiV1VnS3lBbktDa25PMXh1SUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNCMllXeDFaU0E5SUNjOFpuVnVZM1JwYjI0K0p6dGNiaUFnSUNCOVhHNGdJSDBnWld4elpTQjdYRzRnSUNBZ2RtRnNkV1VnUFNCS1UwOU9Mbk4wY21sdVoybG1lU2gyS1R0Y2JpQWdmVnh1WEc0Z0lISmxkSFZ5YmlBblhGeDFNREF4WWxzeE96TTJiU2NnS3lCMllXeDFaU0FySUNkY1hIVXdNREZpV3pCdEp6dGNibjFjYmx4dVhHNHZMeUJEZFhOMGIyMXBlbVZrSUhabGNuTnBiMjRnYjJZZ2JHOWtZWE5vSUhSbGJYQnNZWFJsWEc1bWRXNWpkR2x2YmlCMFpXMXdiR0YwWlNBb2RIQnNMQ0JqYjI1MFpYaDBLU0I3WEc0Z0lIWmhjaUJtYmlBOUlHTnZiWEJwYkdWVVpXMXdiR0YwWlNoMGNHd3BPMXh1SUNCcFppQW9ZMjl1ZEdWNGRDQTlQVDBnZFc1a1pXWnBibVZrS1NCN1hHNGdJQ0FnY21WMGRYSnVJR1p1TzF4dUlDQjlYRzVjYmlBZ2RtRnlJRzl5YVdkRmMyTmhjR1VnUFNCZkxtVnpZMkZ3WlR0Y2JpQWdkSEo1SUh0Y2JpQWdJQ0F2THlCUGRtVnljbWxrWlNCMGFHVWdaR1ZtWVhWc2RDQmxjMk5oY0dVZ1puVnVZM1JwYjI0Z2RHOGdkWE5sSUdsMElHWnZjaUJrZFcxd2FXNW5JR1p2Y20xaGRIUmxaQ0IyWVd4MVpYTmNiaUFnSUNCZkxtVnpZMkZ3WlNBOUlIWmhiSFZsUkhWdGNHVnlPMXh1WEc0Z0lDQWdjbVYwZFhKdUlHWnVLR052Ym5SbGVIUXBPMXh1WEc0Z0lIMGdabWx1WVd4c2VTQjdYRzRnSUNBZ1h5NWxjMk5oY0dVZ1BTQnZjbWxuUlhOallYQmxPMXh1SUNCOVhHNTlYRzVjYmk4dklFRWdjMmx0Y0d4bElHWmhjM1FnWm5WdVkzUnBiMjRnWW1sdVpHbHVaeUJ3Y21sdGFYUnBkbVVnYjI1c2VTQnpkWEJ3YjNKMGFXNW5JSE5sZEhScGJtY2dkR2hsSUdOdmJuUmxlSFJjYm1aMWJtTjBhVzl1SUdKcGJtUW9abTRzSUhSb2FYTkJjbWNwSUh0Y2JpQWdjbVYwZFhKdUlHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQnlaWFIxY200Z1ptNHVZWEJ3Ykhrb2RHaHBjMEZ5Wnl3Z1lYSm5kVzFsYm5SektUdGNiaUFnZlR0Y2JuMWNibHh1THk4Z1VYVnBZMnRzZVNCamNtVmhkR1Z6SUdFZ2JtVjNJRzlpYW1WamRDQjNhWFJvSUdFZ1kzVnpkRzl0SUhCeWIzUnZkSGx3WlNCaGJtUWdjMjl0WlNCMllXeDFaVnh1THk4Z2IzWmxjbkpwWkdWekxseHVablZ1WTNScGIyNGdZM0psWVhSbEtIQnliM1J2TENCMllXeDFaWE1wSUh0Y2JpQWdhV1lnS0RBZ1BUMDlJR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ3BJSHRjYmlBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ2ZWeHVYRzRnSUM4dklFaEJRMHM2SUZWelpTQkdkVzVqZEdsdmJpNXdjbTkwYjNSNWNHVWdLeUJ1WlhjZ2FXNXpkR1ZoWkNCdlppQjBhR1VnYzJ4dmR5MXBjMmdnVDJKcVpXTjBMbU55WldGMFpWeHVJQ0JqY21WaGRHVXVjSEp2ZEc5MGVYQmxJRDBnY0hKdmRHODdYRzRnSUhKbGRIVnliaUJmTG1GemMybG5iaWh1WlhjZ1kzSmxZWFJsS0Nrc0lIWmhiSFZsY3lCOGZDQjdmU2s3WEc1OVhHNWNibHh1THk4Z1JuSnZiU0JvZEhSd09pOHZjMmxrWlhKcGRHVXVZbXh2WjNOd2IzUXVZMjl0THpJd01UUXZNVEV2YzNWd1pYSXRabUZ6ZEMxaGJtUXRZV05qZFhKaGRHVXRjM1J5YVc1bkxXUnBjM1JoYm1ObExtaDBiV3hjYm1aMWJtTjBhVzl1SUhOcFpuUTBLSE14TENCek1pd2diV0Y0VDJabWMyVjBLU0I3WEc0Z0lHbG1JQ2doY3pFZ2ZId2dJWE14TG14bGJtZDBhQ2tnZTF4dUlDQWdJR2xtSUNnaGN6SXBJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQXdPMXh1SUNBZ0lIMWNiaUFnSUNCeVpYUjFjbTRnY3pJdWJHVnVaM1JvTzF4dUlDQjlYRzVjYmlBZ2FXWWdLQ0Z6TWlCOGZDQWhjekl1YkdWdVozUm9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlITXhMbXhsYm1kMGFEdGNiaUFnZlZ4dVhHNGdJSFpoY2lCc01TQTlJSE14TG14bGJtZDBhRHRjYmlBZ2RtRnlJR3d5SUQwZ2N6SXViR1Z1WjNSb08xeHVYRzRnSUhaaGNpQmpNU0E5SURBN0lDQXZMeUJqZFhKemIzSWdabTl5SUhOMGNtbHVaeUF4WEc0Z0lIWmhjaUJqTWlBOUlEQTdJQ0F2THlCamRYSnpiM0lnWm05eUlITjBjbWx1WnlBeVhHNGdJSFpoY2lCc1kzTnpJRDBnTURzZ0lDOHZJR3hoY21kbGMzUWdZMjl0Ylc5dUlITjFZbk5sY1hWbGJtTmxYRzRnSUhaaGNpQnNiMk5oYkY5amN5QTlJREE3SUM4dklHeHZZMkZzSUdOdmJXMXZiaUJ6ZFdKemRISnBibWRjYmx4dUlDQjNhR2xzWlNBb0tHTXhJRHdnYkRFcElDWW1JQ2hqTWlBOElHd3lLU2tnZTF4dUlDQWdJR2xtSUNoek1TNWphR0Z5UVhRb1l6RXBJRDA5SUhNeUxtTm9ZWEpCZENoak1pa3BJSHRjYmlBZ0lDQWdJR3h2WTJGc1gyTnpLeXM3WEc0Z0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lHeGpjM01nS3owZ2JHOWpZV3hmWTNNN1hHNGdJQ0FnSUNCc2IyTmhiRjlqY3lBOUlEQTdYRzRnSUNBZ0lDQnBaaUFvWXpFZ0lUMGdZeklwSUh0Y2JpQWdJQ0FnSUNBZ1l6RWdQU0JqTWlBOUlFMWhkR2d1YldGNEtHTXhMR015S1RzZ0x5OGdkWE5wYm1jZ2JXRjRJSFJ2SUdKNWNHRnpjeUIwYUdVZ2JtVmxaQ0JtYjNJZ1kyOXRjSFYwWlhJZ2RISmhibk53YjNOcGRHbHZibk1nS0NkaFlpY2dkbk1nSjJKaEp5bGNiaUFnSUNBZ0lIMWNiaUFnSUNBZ0lHWnZjaUFvZG1GeUlHa2dQU0F3T3lCcElEd2diV0Y0VDJabWMyVjBPeUJwS3lzcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0Noak1TQXJJR2tnUENCc01Ta2dKaVlnS0hNeExtTm9ZWEpCZENoak1TQXJJR2twSUQwOVBTQnpNaTVqYUdGeVFYUW9ZeklwS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJR014SUNzOUlHazdYRzRnSUNBZ0lDQWdJQ0FnYkc5allXeGZZM01yS3p0Y2JpQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQnBaaUFvS0dNeUlDc2dhU0E4SUd3eUtTQW1KaUFvY3pFdVkyaGhja0YwS0dNeEtTQTlQVDBnY3pJdVkyaGhja0YwS0dNeUlDc2dhU2twS1NCN1hHNGdJQ0FnSUNBZ0lDQWdZeklnS3owZ2FUdGNiaUFnSUNBZ0lDQWdJQ0JzYjJOaGJGOWpjeXNyTzF4dUlDQWdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dUlDQWdJR014S3lzN1hHNGdJQ0FnWXpJckt6dGNiaUFnZlZ4dUlDQnNZM056SUNzOUlHeHZZMkZzWDJOek8xeHVJQ0J5WlhSMWNtNGdUV0YwYUM1eWIzVnVaQ2hOWVhSb0xtMWhlQ2hzTVN3Z2JESXBJQzBnYkdOemN5azdYRzU5WEc1Y2JtVjRjRzl5ZEhNdVltbHVaQ0E5SUdKcGJtUTdYRzVsZUhCdmNuUnpMbU55WldGMFpTQTlJR055WldGMFpUdGNibVY0Y0c5eWRITXVkR1Z0Y0d4aGRHVWdQU0IwWlcxd2JHRjBaVHRjYm1WNGNHOXlkSE11ZFc1aGJuTnBJRDBnZFc1aGJuTnBPMXh1Wlhod2IzSjBjeTVrYjBOdmJHOXljeUE5SUdSdlEyOXNiM0p6TzF4dVpYaHdiM0owY3k1emFXWjBOQ0E5SUhOcFpuUTBPMXh1SWwxOSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBhc3MgPSByZXF1aXJlKCcuL2xpYi9hc3MnKTtcbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vbGliL2NoYWluJyk7XG52YXIgQXNzRXJyb3IgPSByZXF1aXJlKCcuL2xpYi9lcnJvcicpO1xudmFyIHNob3VsZCA9IHJlcXVpcmUoJy4vbGliL3Nob3VsZCcpO1xudmFyIHBhdGNoZXMgPSByZXF1aXJlKCcuL2xpYi9wYXRjaGVzJyk7XG5cbi8vIFJlZ2lzdGVyIHRoZSBkZWZhdWx0IG1hdGNoZXJzXG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9jb3JlJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9jb29yZGluYXRpb24nKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL3F1YW50aWZpZXJzJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9wcm9taXNlJyk7XG5cblxuLy8gQnVuZGxlIHNvbWUgb2YgdGhlIGludGVybmFsIHN0dWZmIHdpdGggdGhlIGFzcyBmdW5jdGlvblxuYXNzLkNoYWluID0gQ2hhaW47XG5hc3MuRXJyb3IgPSBBc3NFcnJvcjtcbmFzcy5wYXRjaGVzID0gcGF0Y2hlcztcblxuLy8gRm9yd2FyZCB0aGUgc2hvdWxkIGluc3RhbGxlclxuLy8gTm90ZTogbWFrZSB0aGVtIGFyaXR5LTAgdG8gYWxsb3cgYmVmb3JlRWFjaChhc3Muc2hvdWxkKSBpbiBNb2NoYVxuYXNzLnNob3VsZCA9IGZ1bmN0aW9uICgvKiBuYW1lICovKSB7XG4gIHNob3VsZChhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IHVuZGVmaW5lZCk7XG4gIHJldHVybiBhc3M7XG59O1xuYXNzLnNob3VsZC5yZXN0b3JlID0gZnVuY3Rpb24gKC8qIG5hbWUgKi8pIHtcbiAgc2hvdWxkLnJlc3RvcmUoYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQpO1xuICByZXR1cm4gYXNzO1xufTtcblxuXG4vLyBQYXRjaCB0aGlyZCBwYXJ0eSBsaWJyYXJpZXMgdG8gdW5kZXJzdGFuZCBhYm91dCBhc3MtZXJ0IGV4cHJlc3Npb25zLiBXZVxuLy8gZGVwZW5kIG9uIHBhdGNoaW5nIGxvZGFzaCBmb3IgdGhlIGxpYnJhcnkgdG8gd29yayBjb3JyZWN0bHksIGhvd2V2ZXIgdGhlXG4vLyByZXN0IGFyZSBvcHRpb25hbC5cbnBhdGNoZXMubG9kYXNoKCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydfJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydfJ10gOiBudWxsKSk7XG5cbmlmIChnbG9iYWwuc2lub24gJiYgZ2xvYmFsLnNpbm9uLm1hdGNoKSB7XG4gIHBhdGNoZXMuc2lub24oZ2xvYmFsLnNpbm9uKTtcbn0gZWxzZSBpZiAocmVxdWlyZS5yZXNvbHZlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHBhdGNoZXMuc2lub24oKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ3Npbm9uJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydzaW5vbiddIDogbnVsbCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gc2lub24gaXMgbm90IGluc3RhbGxlZFxuICAgIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzcztcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbTFoYVc0dWFuTWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqdEJRVUZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVNJc0ltWnBiR1VpT2lKblpXNWxjbUYwWldRdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lkbUZ5SUdGemN5QTlJSEpsY1hWcGNtVW9KeTR2YkdsaUwyRnpjeWNwTzF4dWRtRnlJRU5vWVdsdUlEMGdjbVZ4ZFdseVpTZ25MaTlzYVdJdlkyaGhhVzRuS1R0Y2JuWmhjaUJCYzNORmNuSnZjaUE5SUhKbGNYVnBjbVVvSnk0dmJHbGlMMlZ5Y205eUp5azdYRzUyWVhJZ2MyaHZkV3hrSUQwZ2NtVnhkV2x5WlNnbkxpOXNhV0l2YzJodmRXeGtKeWs3WEc1MllYSWdjR0YwWTJobGN5QTlJSEpsY1hWcGNtVW9KeTR2YkdsaUwzQmhkR05vWlhNbktUdGNibHh1THk4Z1VtVm5hWE4wWlhJZ2RHaGxJR1JsWm1GMWJIUWdiV0YwWTJobGNuTmNibkpsY1hWcGNtVW9KeTR2YkdsaUwyMWhkR05vWlhKekwyTnZjbVVuS1R0Y2JuSmxjWFZwY21Vb0p5NHZiR2xpTDIxaGRHTm9aWEp6TDJOdmIzSmthVzVoZEdsdmJpY3BPMXh1Y21WeGRXbHlaU2duTGk5c2FXSXZiV0YwWTJobGNuTXZjWFZoYm5ScFptbGxjbk1uS1R0Y2JuSmxjWFZwY21Vb0p5NHZiR2xpTDIxaGRHTm9aWEp6TDNCeWIyMXBjMlVuS1R0Y2JseHVYRzR2THlCQ2RXNWtiR1VnYzI5dFpTQnZaaUIwYUdVZ2FXNTBaWEp1WVd3Z2MzUjFabVlnZDJsMGFDQjBhR1VnWVhOeklHWjFibU4wYVc5dVhHNWhjM011UTJoaGFXNGdQU0JEYUdGcGJqdGNibUZ6Y3k1RmNuSnZjaUE5SUVGemMwVnljbTl5TzF4dVlYTnpMbkJoZEdOb1pYTWdQU0J3WVhSamFHVnpPMXh1WEc0dkx5QkdiM0ozWVhKa0lIUm9aU0J6YUc5MWJHUWdhVzV6ZEdGc2JHVnlYRzR2THlCT2IzUmxPaUJ0WVd0bElIUm9aVzBnWVhKcGRIa3RNQ0IwYnlCaGJHeHZkeUJpWldadmNtVkZZV05vS0dGemN5NXphRzkxYkdRcElHbHVJRTF2WTJoaFhHNWhjM011YzJodmRXeGtJRDBnWm5WdVkzUnBiMjRnS0M4cUlHNWhiV1VnS2k4cElIdGNiaUFnYzJodmRXeGtLR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dQaUF3SUQ4Z1lYSm5kVzFsYm5Seld6QmRJRG9nZFc1a1pXWnBibVZrS1R0Y2JpQWdjbVYwZFhKdUlHRnpjenRjYm4wN1hHNWhjM011YzJodmRXeGtMbkpsYzNSdmNtVWdQU0JtZFc1amRHbHZiaUFvTHlvZ2JtRnRaU0FxTHlrZ2UxeHVJQ0J6YUc5MWJHUXVjbVZ6ZEc5eVpTaGhjbWQxYldWdWRITXViR1Z1WjNSb0lENGdNQ0EvSUdGeVozVnRaVzUwYzFzd1hTQTZJSFZ1WkdWbWFXNWxaQ2s3WEc0Z0lISmxkSFZ5YmlCaGMzTTdYRzU5TzF4dVhHNWNiaTh2SUZCaGRHTm9JSFJvYVhKa0lIQmhjblI1SUd4cFluSmhjbWxsY3lCMGJ5QjFibVJsY25OMFlXNWtJR0ZpYjNWMElHRnpjeTFsY25RZ1pYaHdjbVZ6YzJsdmJuTXVJRmRsWEc0dkx5QmtaWEJsYm1RZ2IyNGdjR0YwWTJocGJtY2diRzlrWVhOb0lHWnZjaUIwYUdVZ2JHbGljbUZ5ZVNCMGJ5QjNiM0pySUdOdmNuSmxZM1JzZVN3Z2FHOTNaWFpsY2lCMGFHVmNiaTh2SUhKbGMzUWdZWEpsSUc5d2RHbHZibUZzTGx4dWNHRjBZMmhsY3k1c2IyUmhjMmdvS0hSNWNHVnZaaUIzYVc1a2IzY2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUIzYVc1a2IzZGJKMThuWFNBNklIUjVjR1Z2WmlCbmJHOWlZV3dnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCbmJHOWlZV3hiSjE4blhTQTZJRzUxYkd3cEtUdGNibHh1YVdZZ0tHZHNiMkpoYkM1emFXNXZiaUFtSmlCbmJHOWlZV3d1YzJsdWIyNHViV0YwWTJncElIdGNiaUFnY0dGMFkyaGxjeTV6YVc1dmJpaG5iRzlpWVd3dWMybHViMjRwTzF4dWZTQmxiSE5sSUdsbUlDaHlaWEYxYVhKbExuSmxjMjlzZG1VcElIdGNiaUFnSUNCMGNua2dlMXh1SUNBZ0lDQWdjR0YwWTJobGN5NXphVzV2Ymlnb2RIbHdaVzltSUhkcGJtUnZkeUFoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaUEvSUhkcGJtUnZkMXNuYzJsdWIyNG5YU0E2SUhSNWNHVnZaaUJuYkc5aVlXd2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUJuYkc5aVlXeGJKM05wYm05dUoxMGdPaUJ1ZFd4c0tTazdYRzRnSUNBZ2ZTQmpZWFJqYUNBb1pTa2dlMXh1SUNBZ0lDQWdJQ0F2THlCemFXNXZiaUJwY3lCdWIzUWdhVzV6ZEdGc2JHVmtYRzRnSUNBZ2ZWeHVmVnh1WEc1Y2JtMXZaSFZzWlM1bGVIQnZjblJ6SUQwZ1lYTnpPMXh1SWwxOSIsbnVsbCwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuTXV0YXRpb25PYnNlcnZlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG5cbiAgICBpZiAoY2FuTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICB2YXIgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlTGlzdCA9IHF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcXVldWVMaXN0LmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGhpZGRlbkRpdiwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBoaWRkZW5EaXYuc2V0QXR0cmlidXRlKCd5ZXMnLCAnbm8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIi8vIEVtdWxhdGVzIFY4J3MgQ2FsbFNpdGUgb2JqZWN0IGZyb20gYSBzdGFja3RyYWNlLmpzIGZyYW1lIG9iamVjdFxuXG5mdW5jdGlvbiBDYWxsU2l0ZSAoZnJhbWUpIHtcbiAgdGhpcy5mcmFtZSA9IGZyYW1lO1xufTtcblxuQ2FsbFNpdGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSh7XG4gIGdldExpbmVOdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5mcmFtZS5saW5lTnVtYmVyO1xuICB9LFxuICBnZXRDb2x1bW5OdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5mcmFtZS5jb2x1bW5OdW1iZXI7XG4gIH0sXG4gIGdldEZpbGVOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuZmlsZU5hbWU7XG4gIH0sXG4gIGdldEZ1bmN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuZnVuY3Rpb247XG4gIH0sXG4gIGdldFRoaXM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgZ2V0VHlwZU5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgZ2V0TWV0aG9kTmFtZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmZyYW1lLmZ1bmN0aW9uTmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lLnNwbGl0KCcuJykucG9wKCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9LFxuICBnZXRGdW5jdGlvbk5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5mcmFtZS5mdW5jdGlvbk5hbWU7XG4gIH0sXG4gIGdldEV2YWxPcmlnaW46IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgaXNUb3BsZXZlbDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xuICB9LFxuICBpc0V2YWw6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cbiAgfSxcbiAgaXNOYXRpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cbiAgfSxcbiAgaXNDb25zdHJ1Y3RvcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAvXm5ldyhcXHN8JCkvLnRlc3QodGhpcy5mcmFtZS5mdW5jdGlvbk5hbWUpO1xuICB9LFxuICB0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuICAgIHZhciBuYW1lID0gdGhpcy5nZXRGdW5jdGlvbk5hbWUoKSB8fCAnPGFub255bW91cz4nO1xuICAgIHZhciBsb2MgPSB0aGlzLmdldEZpbGVOYW1lKCkgKyAnOicgKyB0aGlzLmdldExpbmVOdW1iZXIoKSArICc6JyArIHRoaXMuZ2V0Q29sdW1uTnVtYmVyKClcbiAgICByZXR1cm4gbmFtZSArICcgKCcgKyBsb2MgKyAnKSc7XG4gIH1cbn0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ2FsbFNpdGU7XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbnZhciBFcnJvclN0YWNrUGFyc2VyID0gcmVxdWlyZSgnZXJyb3Itc3RhY2stcGFyc2VyJyk7XG52YXIgQ2FsbFNpdGUgPSByZXF1aXJlKCcuL2NhbGwtc2l0ZScpO1xuXG4vLyBLZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBidWlsdGluIGVycm9yIGNvbnN0cnVjdG9yXG52YXIgTmF0aXZlRXJyb3IgPSBFcnJvcjtcblxuLy8gQW5ub3RhdGlvbiBzeW1ib2xzXG52YXIgU1lNQk9MX0ZSQU1FUyA9ICdAQGZhaWx1cmUvZnJhbWVzJztcbnZhciBTWU1CT0xfSUdOT1JFID0gJ0BAZmFpbHVyZS9pZ25vcmUnO1xuXG4vLyBVbmZvcnR1bmF0ZWx5IHdlIGhhdmUgc29tZSBpc3N1ZXMgd2l0aCBJRSBhbmQgZGVmaW5lUHJvcGVydHlcbnZhciBJU19JRSA9ICdBY3RpdmVYT2JqZWN0JyBpbiBnbG9iYWw7XG52YXIgSVNfRURHRSA9IGdsb2JhbC5uYXZpZ2F0b3IgJiYgL0VkZ2UvLnRlc3QoZ2xvYmFsLm5hdmlnYXRvci51c2VyQWdlbnQpO1xudmFyIFVTRV9ERUZfUFJPUCA9ICFJU19JRSAmJiAhSVNfRURHRSAmJiAvXFxbbmF0aXZlIGNvZGVcXF0vLnRlc3QoT2JqZWN0LmRlZmluZVByb3BlcnR5KTtcblxuXG5mdW5jdGlvbiBGYWlsdXJlIChtZXNzYWdlLCBzZmYpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZhaWx1cmUpKSB7XG4gICAgcmV0dXJuIG5ldyBGYWlsdXJlKG1lc3NhZ2UsIHNmZiB8fCBGYWlsdXJlKTtcbiAgfVxuXG4gIHRoaXMuc2ZmID0gc2ZmIHx8IHRoaXMuY29uc3RydWN0b3I7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblxuICAvLyBHZW5lcmF0ZSBhIGdldHRlciBmb3IgdGhlIGZyYW1lcywgdGhpcyBlbnN1cmVzIHRoYXQgd2UgZG8gYXMgbGl0dGxlIHdvcmtcbiAgLy8gYXMgcG9zc2libGUgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBlcnJvciwgZGVmZXJyaW5nIHRoZSBleHBlbnNpdmUgc3RhY2tcbiAgLy8gbWFuZ2xpbmcgb3BlcmF0aW9ucyB1bnRpbCB0aGUgLnN0YWNrIHByb3BlcnR5IGlzIGFjdHVhbGx5IHJlcXVlc3RlZC5cbiAgdGhpcy5fZ2V0RnJhbWVzID0gbWFrZUZyYW1lc0dldHRlcih0aGlzLnNmZik7XG5cbiAgLy8gT24gRVM1IGVuZ2luZXMgd2UgdXNlIG9uZS10aW1lIGdldHRlcnMgdG8gYWN0dWFsbHkgZGVmZXIgdGhlIGV4cGVuc2l2ZVxuICAvLyBvcGVyYXRpb25zIChkZWZpbmVkIGluIHRoZSBwcm90b3R5cGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIHdoaWxlIGxlZ2FjeVxuICAvLyBlbmdpbmVzIHdpbGwgc2ltcGx5IGRvIGFsbCB0aGUgd29yayB1cCBmcm9udC5cbiAgaWYgKCFVU0VfREVGX1BST1ApIHtcbiAgICB0aGlzLmZyYW1lcyA9IHVud2luZCh0aGlzLl9nZXRGcmFtZXMoKSk7XG4gICAgdGhpcy5fZ2V0RnJhbWVzID0gbnVsbDtcbiAgICB0aGlzLnN0YWNrID0gdGhpcy5nZW5lcmF0ZVN0YWNrVHJhY2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufVxuXG4vLyBTZXQgRlJBTUVfRU1QVFkgdG8gbnVsbCB0byBkaXNhYmxlIGFueSBzb3J0IG9mIHNlcGFyYXRvclxuRmFpbHVyZS5GUkFNRV9FTVBUWSA9ICcgIC0tLS0nO1xuRmFpbHVyZS5GUkFNRV9QUkVGSVggPSAnICBhdCAnO1xuXG4vLyBCeSBkZWZhdWx0IHdlIGVuYWJsZSB0cmFja2luZyBmb3IgYXN5bmMgc3RhY2sgdHJhY2VzXG5GYWlsdXJlLlRSQUNLSU5HID0gdHJ1ZTtcblxuXG4vLyBIZWxwZXIgdG8gb2J0YWluIHRoZSBjdXJyZW50IHN0YWNrIHRyYWNlXG52YXIgZ2V0RXJyb3JXaXRoU3RhY2sgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgTmF0aXZlRXJyb3IoKTtcbn07XG4vLyBTb21lIGVuZ2luZXMgZG8gbm90IGdlbmVyYXRlIHRoZSAuc3RhY2sgcHJvcGVydHkgdW50aWwgaXQncyB0aHJvd25cbmlmICghZ2V0RXJyb3JXaXRoU3RhY2soKS5zdGFjaykge1xuICBnZXRFcnJvcldpdGhTdGFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICB0cnkgeyB0aHJvdyBuZXcgTmF0aXZlRXJyb3IoKTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gZTsgfVxuICB9O1xufVxuXG4vLyBUcmltIGZyYW1lcyB1bmRlciB0aGUgcHJvdmlkZWQgc3RhY2sgZmlyc3QgZnVuY3Rpb25cbmZ1bmN0aW9uIHRyaW0oZnJhbWVzLCBzZmYpIHtcbiAgdmFyIGZuLCBuYW1lID0gc2ZmLm5hbWU7XG4gIGlmICghZnJhbWVzKSB7XG4gICAgZ2xvYmFsLmNvbnNvbGUgJiYgY29uc29sZS53YXJuKCdbRmFpbHVyZV0gZXJyb3IgY2FwdHVyaW5nIGZyYW1lcycpO1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBmb3IgKHZhciBpPTA7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBmbiA9IGZyYW1lc1tpXS5nZXRGdW5jdGlvbigpO1xuICAgIGlmIChmbiAmJiBmbiA9PT0gc2ZmIHx8IG5hbWUgJiYgbmFtZSA9PT0gZnJhbWVzW2ldLmdldEZ1bmN0aW9uTmFtZSgpKSB7XG4gICAgICByZXR1cm4gZnJhbWVzLnNsaWNlKGkgKyAxKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZyYW1lcztcbn1cblxuZnVuY3Rpb24gdW53aW5kIChmcmFtZXMpIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gIGZvciAodmFyIGk9MCwgZm47IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBmbiA9IGZyYW1lc1tpXS5nZXRGdW5jdGlvbigpO1xuXG4gICAgaWYgKCFmbiB8fCAhZm5bU1lNQk9MX0lHTk9SRV0pIHtcbiAgICAgIHJlc3VsdC5wdXNoKGZyYW1lc1tpXSk7XG4gICAgfVxuXG4gICAgaWYgKGZuICYmIGZuW1NZTUJPTF9GUkFNRVNdKSB7XG4gICAgICBpZiAoRmFpbHVyZS5GUkFNRV9FTVBUWSkge1xuICAgICAgICByZXN1bHQucHVzaChudWxsKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2FsbCB0aGUgZ2V0dGVyIGFuZCBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSByZXN1bHQgaW4gY2FzZSB3ZSBoYXZlIHRvXG4gICAgICAvLyB1bndpbmQgdGhlIHNhbWUgZnVuY3Rpb24gYW5vdGhlciB0aW1lLlxuICAgICAgLy8gVE9ETzogTWFrZSBzdXJlIGtlZXBpbmcgYSByZWZlcmVuY2UgdG8gdGhlIGZyYW1lcyBkb2Vzbid0IGNyZWF0ZSBsZWFrc1xuICAgICAgaWYgKHR5cGVvZiBmbltTWU1CT0xfRlJBTUVTXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YXIgZ2V0dGVyID0gZm5bU1lNQk9MX0ZSQU1FU107XG4gICAgICAgIGZuW1NZTUJPTF9GUkFNRVNdID0gbnVsbDtcbiAgICAgICAgZm5bU1lNQk9MX0ZSQU1FU10gPSBnZXR0ZXIoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFmbltTWU1CT0xfRlJBTUVTXSkge1xuICAgICAgICBnbG9iYWwuY29uc29sZSAmJiBjb25zb2xlLndhcm4oJ1tGYWlsdXJlXSBFbXB0eSBmcmFtZXMgYW5ub3RhdGlvbicpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCB1bndpbmQoZm5bU1lNQk9MX0ZSQU1FU10pKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIFJlY2VpdmVyIGZvciB0aGUgZnJhbWVzIGluIGEgLnN0YWNrIHByb3BlcnR5IGZyb20gY2FwdHVyZVN0YWNrVHJhY2VcbnZhciBWOEZSQU1FUyA9IHt9O1xuXG4vLyBWOCBjb2RlIHBhdGggZm9yIGdlbmVyYXRpbmcgYSBmcmFtZXMgZ2V0dGVyXG5mdW5jdGlvbiBtYWtlRnJhbWVzR2V0dGVyVjggKHNmZikge1xuICAvLyBUaGlzIHdpbGwgY2FsbCBvdXIgY3VzdG9tIHByZXBhcmVTdGFja1RyYWNlXG4gIE5hdGl2ZUVycm9yLmNhcHR1cmVTdGFja1RyYWNlKFY4RlJBTUVTLCBzZmYgfHwgbWFrZUZyYW1lc0dldHRlclY4KTtcbiAgc2ZmID0gbnVsbDtcbiAgdmFyIGZyYW1lcyA9IFY4RlJBTUVTLnN0YWNrO1xuICBWOEZSQU1FUy5zdGFjayA9IG51bGw7ICAvLyBUaGlzIGlzIG5lZWRlZCB0byBhdm9pZCBsZWFrcyEhIVxuICBWOEZSQU1FUyA9IHt9OyAgLy8gVGhlIG5leHQgY2FsbCByZXF1aXJlcyBhbiBlbXB0eSBvYmplY3RcblxuICByZXR1cm4gZnVuY3Rpb24gKGNsZWFudXApIHtcbiAgICB2YXIgcmVzdWx0ID0gZnJhbWVzO1xuICAgIC8vIENsZWFuIHVwIGNsb3N1cmUgdmFyaWFibGVzIHRvIGhlbHAgR0NcbiAgICBmcmFtZXMgPSBudWxsO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG5cbi8vIG5vbi1WOCBjb2RlIHBhdGggZm9yIGdlbmVyYXRpbmcgYSBmcmFtZXMgZ2V0dGVyXG5mdW5jdGlvbiBtYWtlRnJhbWVzR2V0dGVyQ29tcGF0IChzZmYpIHtcbiAgLy8gT2J0YWluIGEgc3RhY2sgdHJhY2UgYXQgdGhlIGN1cnJlbnQgcG9pbnRcbiAgdmFyIGVycm9yID0gZ2V0RXJyb3JXaXRoU3RhY2soKTtcblxuICAvLyBXYWxrIHRoZSBjYWxsZXIgY2hhaW4gdG8gYW5ub3RhdGUgdGhlIHN0YWNrIHdpdGggZnVuY3Rpb24gcmVmZXJlbmNlc1xuICAvLyBHaXZlbiB0aGUgbGltaXRhdGlvbnMgaW1wb3NlZCBieSBFUzUgXCJzdHJpY3QgbW9kZVwiIGl0J3Mgbm90IHBvc3NpYmxlXG4gIC8vIHRvIG9idGFpbiByZWZlcmVuY2VzIHRvIGZ1bmN0aW9ucyBiZXlvbmQgb25lIHRoYXQgaXMgZGVmaW5lZCBpbiBzdHJpY3RcbiAgLy8gbW9kZS4gQWxzbyBub3RlIHRoYXQgYW55IGtpbmQgb2YgcmVjdXJzaW9uIHdpbGwgbWFrZSB0aGUgd2Fsa2VyIHVuYWJsZVxuICAvLyB0byBnbyBwYXN0IGl0LlxuICB2YXIgY2FsbGVyID0gYXJndW1lbnRzLmNhbGxlZTtcbiAgdmFyIGZ1bmN0aW9ucyA9IFtnZXRFcnJvcldpdGhTdGFja107XG4gIGZvciAodmFyIGk9MDsgY2FsbGVyICYmIGkgPCAxMDsgaSsrKSB7XG4gICAgZnVuY3Rpb25zLnB1c2goY2FsbGVyKTtcbiAgICBpZiAoY2FsbGVyLmNhbGxlciA9PT0gY2FsbGVyKSBicmVhaztcbiAgICBjYWxsZXIgPSBjYWxsZXIuY2FsbGVyO1xuICB9XG4gIGNhbGxlciA9IG51bGw7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChjbGVhbnVwKSB7XG4gICAgdmFyIGZyYW1lcyA9IG51bGw7XG5cbiAgICBpZiAoIWNsZWFudXApIHtcbiAgICAgIC8vIFBhcnNlIHRoZSBzdGFjayB0cmFjZVxuICAgICAgdHJ5IHtcbiAgICAgICAgZnJhbWVzID0gRXJyb3JTdGFja1BhcnNlci5wYXJzZShlcnJvcik7XG5cbiAgICAgICAgLy8gQXR0YWNoIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdG8gdGhlIGZyYW1lcyAoc2tpcHBpbmcgdGhlIG1ha2VyIGZyYW1lcylcbiAgICAgICAgLy8gYW5kIGNyZWF0aW5nIENhbGxTaXRlIG9iamVjdHMgZm9yIGVhY2ggb25lLlxuICAgICAgICBmb3IgKHZhciBpPTI7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmcmFtZXNbaV0uZnVuY3Rpb24gPSBmdW5jdGlvbnNbaV07XG4gICAgICAgICAgZnJhbWVzW2ldID0gbmV3IENhbGxTaXRlKGZyYW1lc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBmcmFtZXMgPSB0cmltKGZyYW1lcy5zbGljZSgyKSwgc2ZmKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gSnVzdCBpZ25vcmUgYW5kIGxldCB0aGUgaGlnaGVyIGxheWVycyBkZWFsIHdpdGggaXRcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgc2ZmID0gZXJyb3IgPSBmdW5jdGlvbnMgPSBudWxsO1xuXG4gICAgcmV0dXJuIGZyYW1lcztcbiAgfTtcbn1cblxuLy8gR2VuZXJhdGVzIGEgZ2V0dGVyIGZvciB0aGUgY2FsbCBzaXRlIGZyYW1lcy4gVGhlIGdldHRlciByZXR1cm5lZCBieVxuLy8gdGhlc2UgZmFjdG9yaWVzIGNhbiBvbmx5IHVzZWQgb25jZSwgc2luY2UgdGhleSBjbGVhbiB1cCB0aGVpciBpbm5lciBzdGF0ZVxuLy8gYWZ0ZXIgdGhleSBhcmUgY2FsbGVkLiBUaGV5IGFjY2VwdCBhbiBvcHRpb25hbCBib29sZWFuIGFyZ3VtZW50IHdoaWNoXG4vLyBpZiB0cnVlIHdpbGwganVzdCBjbGVhbiB1cCB3aXRob3V0IGNvbXB1dGluZyB0aGUgZnJhbWVzLlxuLy9cbi8vIFRPRE86IElmIHdlIG9ic2VydmUgbGVha3Mgd2l0aCBjb21wbGV4IHVzZSBjYXNlcyAoZHVlIHRvIGNsb3N1cmUgc2NvcGVzKVxuLy8gICAgICAgd2UgY2FuIGdlbmVyYXRlIGhlcmUgb3VyIGNvbXBhdCBDYWxsU2l0ZSBvYmplY3RzIHN0b3JpbmcgdGhlIGZ1bmN0aW9uJ3Ncbi8vICAgICAgIHNvdXJjZSBjb2RlIGluc3RlYWQgb2YgYW4gYWN0dWFsIHJlZmVyZW5jZSB0byB0aGVtLCB0aGF0IHNob3VsZCBoZWxwXG4vLyAgICAgICB0aGUgR0Mgc2luY2Ugd2UnbGwgYmUganVzdCBrZWVwaW5nIGxpdGVyYWxzIGFyb3VuZC5cbnZhciBtYWtlRnJhbWVzR2V0dGVyID0gdHlwZW9mIE5hdGl2ZUVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICA/IG1ha2VGcmFtZXNHZXR0ZXJWOFxuICAgICAgICAgICAgICAgICAgICAgOiBtYWtlRnJhbWVzR2V0dGVyQ29tcGF0O1xuXG5cbi8vIE92ZXJyaWRlIFY4IHN0YWNrIHRyYWNlIGJ1aWxkZXIgdG8gaW5qZWN0IG91ciBsb2dpY1xudmFyIG9sZFByZXBhcmVTdGFja1RyYWNlID0gRXJyb3IucHJlcGFyZVN0YWNrVHJhY2U7XG5FcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChlcnJvciwgZnJhbWVzKSB7XG4gIC8vIFdoZW4gY2FsbGVkIGZyb20gbWFrZUZyYW1lc0dldHRlclY4IHdlIGp1c3Qgd2FudCB0byBvYnRhaW4gdGhlIGZyYW1lc1xuICBpZiAoZXJyb3IgPT09IFY4RlJBTUVTKSB7XG4gICAgcmV0dXJuIGZyYW1lcztcbiAgfVxuXG4gIC8vIEZvcndhcmQgdG8gYW55IHByZXZpb3VzbHkgZGVmaW5lZCBiZWhhdmlvdXJcbiAgaWYgKG9sZFByZXBhcmVTdGFja1RyYWNlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBvbGRQcmVwYXJlU3RhY2tUcmFjZS5jYWxsKEVycm9yLCBlcnJvciwgZnJhbWVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBKdXN0IGlnbm9yZSB0aGUgZXJyb3IgKGllOiBrYXJtYS1zb3VyY2UtbWFwLXN1cHBvcnQpXG4gICAgfVxuICB9XG5cbiAgLy8gRW11bGF0ZSBkZWZhdWx0IGJlaGF2aW91ciAod2l0aCBsb25nLXRyYWNlcylcbiAgcmV0dXJuIEZhaWx1cmUucHJvdG90eXBlLnByZXBhcmVTdGFja1RyYWNlLmNhbGwoZXJyb3IsIHVud2luZChmcmFtZXMpKTtcbn07XG5cbi8vIEF0dGFjaCBhIG5ldyBleGNsdXNpb24gcHJlZGljYXRlIGZvciBmcmFtZXNcbmZ1bmN0aW9uIGV4Y2x1ZGUgKGN0b3IsIHByZWRpY2F0ZSkge1xuICB2YXIgZm4gPSBwcmVkaWNhdGU7XG5cbiAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgZm4gPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICAgIHJldHVybiAtMSAhPT0gZnJhbWUuZ2V0RmlsZU5hbWUoKS5pbmRleE9mKHByZWRpY2F0ZSk7XG4gICAgfTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcHJlZGljYXRlLnRlc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICBmbiA9IGZ1bmN0aW9uIChmcmFtZSkge1xuICAgICAgcmV0dXJuIHByZWRpY2F0ZS50ZXN0KGZyYW1lLmdldEZpbGVOYW1lKCkpO1xuICAgIH07XG4gIH1cblxuICBjdG9yLmV4Y2x1ZGVzLnB1c2goZm4pO1xufVxuXG4vLyBFeHBvc2UgdGhlIGZpbHRlciBpbiB0aGUgcm9vdCBGYWlsdXJlIHR5cGVcbkZhaWx1cmUuZXhjbHVkZXMgPSBbXTtcbkZhaWx1cmUuZXhjbHVkZSA9IGV4Y2x1ZGUuYmluZChudWxsLCBGYWlsdXJlKTtcblxuLy8gQXR0YWNoIGEgZnJhbWVzIGdldHRlciB0byB0aGUgZnVuY3Rpb24gc28gd2UgY2FuIHJlLWNvbnN0cnVjdCBhc3luYyBzdGFja3MuXG4vL1xuLy8gTm90ZSB0aGF0IHRoaXMganVzdCBhdWdtZW50cyB0aGUgZnVuY3Rpb24gd2l0aCB0aGUgbmV3IHByb3BlcnR5LCBpdCBkb2Vzbid0XG4vLyBjcmVhdGUgYSB3cmFwcGVyIGV2ZXJ5IHRpbWUgaXQncyBjYWxsZWQsIHNvIHVzaW5nIGl0IG11bHRpcGxlIHRpbWVzIG9uIHRoZVxuLy8gc2FtZSBmdW5jdGlvbiB3aWxsIGluZGVlZCBvdmVyd3JpdGUgdGhlIHByZXZpb3VzIHRyYWNraW5nIGluZm9ybWF0aW9uLiBUaGlzXG4vLyBpcyBpbnRlbmRlZCBzaW5jZSBpdCdzIGZhc3RlciBhbmQgbW9yZSBpbXBvcnRhbnRseSBkb2Vzbid0IGJyZWFrIHNvbWUgQVBJc1xuLy8gdXNpbmcgY2FsbGJhY2sgcmVmZXJlbmNlcyB0byB1bnJlZ2lzdGVyIHRoZW0gZm9yIGluc3RhbmNlLlxuLy8gV2hlbiB5b3Ugd2FudCB0byB1c2UgdGhlIHNhbWUgZnVuY3Rpb24gd2l0aCBkaWZmZXJlbnQgdHJhY2tpbmcgaW5mb3JtYXRpb25cbi8vIGp1c3QgdXNlIEZhaWx1cmUud3JhcCgpLlxuLy9cbi8vIFRoZSB0cmFja2luZyBjYW4gYmUgZ2xvYmFsbHkgZGlzYWJsZWQgYnkgc2V0dGluZyBGYWlsdXJlLlRSQUNLSU5HIHRvIGZhbHNlXG5GYWlsdXJlLnRyYWNrID0gZnVuY3Rpb24gRmFpbHVyZV90cmFjayAoZm4sIHNmZikge1xuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgLy8gQ2xlYW4gdXAgcHJldmlvdXMgZnJhbWVzIHRvIGhlbHAgdGhlIEdDXG4gIGlmICh0eXBlb2YgZm5bU1lNQk9MX0ZSQU1FU10gPT09ICdmdW5jdGlvbicpIHtcbiAgICBmbltTWU1CT0xfRlJBTUVTXSh0cnVlKTtcbiAgfVxuXG4gIGlmIChGYWlsdXJlLlRSQUNLSU5HKSB7XG4gICAgZm5bU1lNQk9MX0ZSQU1FU10gPSBudWxsO1xuICAgIGZuW1NZTUJPTF9GUkFNRVNdID0gbWFrZUZyYW1lc0dldHRlcihzZmYgfHwgRmFpbHVyZV90cmFjayk7XG4gIH1cblxuICByZXR1cm4gZm47XG59O1xuXG4vLyBXcmFwcyB0aGUgZnVuY3Rpb24gYmVmb3JlIGFubm90YXRpbmcgaXQgd2l0aCB0cmFja2luZyBpbmZvcm1hdGlvbiwgdGhpc1xuLy8gYWxsb3dzIHRvIHRyYWNrIG11bHRpcGxlIGNhbGxzIGZvciBhIHNpbmdsZSBmdW5jdGlvbi5cbkZhaWx1cmUud3JhcCA9IGZ1bmN0aW9uIEZhaWx1cmVfd3JhcCAoZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSBGYWlsdXJlLmlnbm9yZShmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuXG4gIHJldHVybiBGYWlsdXJlLnRyYWNrKHdyYXBwZXIsIEZhaWx1cmVfd3JhcCk7XG59O1xuXG4vLyBNYXJrIGEgZnVuY3Rpb24gdG8gYmUgaWdub3JlZCB3aGVuIGdlbmVyYXRpbmcgc3RhY2sgdHJhY2VzXG5GYWlsdXJlLmlnbm9yZSA9IGZ1bmN0aW9uIEZhaWx1cmVfaWdub3JlIChmbikge1xuICBmbltTWU1CT0xfSUdOT1JFXSA9IHRydWU7XG4gIHJldHVybiBmbjtcbn07XG5cbi8vIEhlbHBlciBmb3IgdHJhY2tpbmcgYSBzZXRUaW1lb3V0XG5GYWlsdXJlLnNldFRpbWVvdXQgPSBmdW5jdGlvbiBGYWlsdXJlX3NldFRpbWVvdXQgKCkge1xuICBhcmd1bWVudHNbMF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1swXSwgRmFpbHVyZV9zZXRUaW1lb3V0KTtcbiAgcmV0dXJuIHNldFRpbWVvdXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn07XG5cbi8vIEhlbHBlciBmb3IgdHJhY2tpbmcgYSBuZXh0VGlja1xuRmFpbHVyZS5uZXh0VGljayA9IGZ1bmN0aW9uIEZhaWx1cmVfbmV4dFRpY2sgKCkge1xuICBhcmd1bWVudHNbMF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1swXSwgRmFpbHVyZV9uZXh0VGljayk7XG4gIHJldHVybiBwcm9jZXNzLm5leHRUaWNrLmFwcGx5KHByb2Nlc3MsIGFyZ3VtZW50cyk7XG59O1xuXG4vLyBBbGxvd3MgdG8gZWFzaWx5IHBhdGNoIGEgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIGNhbGxiYWNrXG4vLyB0byBhbGxvdyB0cmFja2luZyB0aGUgYXN5bmMgZmxvd3MuXG4vLyBpZTogRmFpbHVyZS5wYXRoKHdpbmRvdywgJ3NldEludGVydmFsJylcbkZhaWx1cmUucGF0Y2ggPSBmdW5jdGlvbiBGYWlsdXJlX3BhdGNoKG9iaiwgbmFtZSwgaWR4KSB7XG4gIGlmIChvYmogJiYgdHlwZW9mIG9ialtuYW1lXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBcIicgKyBuYW1lICsgJ1wiIG1ldGhvZCcpO1xuICB9XG5cbiAgdmFyIG9yaWdpbmFsID0gb2JqW25hbWVdO1xuXG4gIC8vIFdoZW4gdGhlIGV4YWN0IGFyZ3VtZW50IGluZGV4IGlzIHByb3ZpZGVkIHVzZSBhbiBvcHRpbWl6ZWQgY29kZSBwYXRoXG4gIGlmICh0eXBlb2YgaWR4ID09PSAnbnVtYmVyJykge1xuXG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgYXJndW1lbnRzW2lkeF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1tpZHhdLCBvYmpbbmFtZV0pO1xuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAvLyBPdGhlcndpc2UgZGV0ZWN0IHRoZSBmdW5jdGlvbnMgdG8gdHJhY2sgYXQgaW52b2thdGlvbiB0aW1lXG4gIH0gZWxzZSB7XG5cbiAgICBvYmpbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGFyZ3VtZW50c1tpXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzW2ldLCBvYmpbbmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSB3cmFwcGVyIHdpdGggYW55IHByb3BlcnRpZXMgZnJvbSB0aGUgb3JpZ2luYWxcbiAgZm9yICh2YXIgayBpbiBvcmlnaW5hbCkgaWYgKG9yaWdpbmFsLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgb2JqW25hbWVdW2tdID0gb3JpZ2luYWxba107XG4gIH1cblxuICByZXR1cm4gb2JqW25hbWVdO1xufTtcblxuLy8gSGVscGVyIHRvIGNyZWF0ZSBuZXcgRmFpbHVyZSB0eXBlc1xuRmFpbHVyZS5jcmVhdGUgPSBmdW5jdGlvbiAobmFtZSwgcHJvcHMpIHtcbiAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBGYWlsdXJlKCdFeHBlY3RlZCBhIG5hbWUgYXMgZmlyc3QgYXJndW1lbnQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGN0b3IgKG1lc3NhZ2UsIHNmZikge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGYWlsdXJlKSkge1xuICAgICAgcmV0dXJuIG5ldyBjdG9yKG1lc3NhZ2UsIHNmZik7XG4gICAgfVxuICAgIEZhaWx1cmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIC8vIEF1Z21lbnQgY29uc3RydWN0b3JcbiAgY3Rvci5leGNsdWRlcyA9IFtdO1xuICBjdG9yLmV4Y2x1ZGUgPSBmdW5jdGlvbiAocHJlZGljYXRlKSB7XG4gICAgZXhjbHVkZShjdG9yLCBwcmVkaWNhdGUpO1xuICB9O1xuXG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShGYWlsdXJlLnByb3RvdHlwZSk7XG4gIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvcjtcbiAgY3Rvci5wcm90b3R5cGUubmFtZSA9IG5hbWU7XG4gIGlmICh0eXBlb2YgcHJvcHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjdG9yLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZSA9IHByb3BzO1xuICB9IGVsc2UgaWYgKHByb3BzKSB7XG4gICAgT2JqZWN0LmtleXMocHJvcHMpLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIGN0b3IucHJvdG90eXBlW3Byb3BdID0gcHJvcDtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY3Rvcjtcbn07XG5cbi8vIEJ5IGRlZmF1bHQgb25seSBFcnJvciB3aWxsIGJlIHJlcGxhY2VkXG5GYWlsdXJlLmluc3RhbGwgPSBmdW5jdGlvbiAoLyogLi4uICovKSB7XG4gIHZhciByb290ID0gdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgPyB3aW5kb3cgOiBnbG9iYWw7XG5cbiAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICBpZiAoYXJncy5sZW5ndGggPT09IDApIHtcbiAgICBhcmdzLnB1c2goJ0Vycm9yJyk7XG4gIH1cblxuICBmb3IgKHZhciBpPTA7IGk8YXJncy5sZW5ndGg7IGkrKykge1xuICAgIHJvb3RbYXJnc1tpXV0gPSBGYWlsdXJlLmNyZWF0ZShhcmdzW2ldKTtcbiAgfVxuXG4gIC8vIEFsbG93IHVzYWdlOiB2YXIgRmFpbHVyZSA9IHJlcXVpcmUoJ2ZhaWx1cmUnKS5pbnN0YWxsKClcbiAgcmV0dXJuIEZhaWx1cmU7XG59O1xuXG5cbnZhciBwcm90byA9IEZhaWx1cmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xucHJvdG8uY29uc3RydWN0b3IgPSBGYWlsdXJlO1xuXG5wcm90by5uYW1lID0gJ0ZhaWx1cmUnO1xucHJvdG8ubWVzc2FnZSA9ICcnO1xuXG5pZiAoVVNFX0RFRl9QUk9QKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2ZyYW1lcycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFVzZSB0cmltbWluZyBqdXN0IGluIGNhc2UgdGhlIHNmZiB3YXMgZGVmaW5lZCBhZnRlciBjb25zdHJ1Y3RpbmdcbiAgICAgIHZhciBmcmFtZXMgPSB1bndpbmQodHJpbSh0aGlzLl9nZXRGcmFtZXMoKSwgdGhpcy5zZmYpKTtcblxuICAgICAgLy8gQ2FjaGUgbmV4dCBhY2Nlc3NlcyB0byB0aGUgcHJvcGVydHlcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZnJhbWVzJywge1xuICAgICAgICB2YWx1ZTogZnJhbWVzLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIC8vIENsZWFuIHVwIHRoZSBnZXR0ZXIgY2xvc3VyZVxuICAgICAgdGhpcy5fZ2V0RnJhbWVzID0gbnVsbDtcblxuICAgICAgcmV0dXJuIGZyYW1lcztcbiAgICB9XG4gIH0pO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ3N0YWNrJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHN0YWNrID0gdGhpcy5nZW5lcmF0ZVN0YWNrVHJhY2UoKTtcblxuICAgICAgLy8gQ2FjaGUgbmV4dCBhY2Nlc3NlcyB0byB0aGUgcHJvcGVydHlcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnc3RhY2snLCB7XG4gICAgICAgIHZhbHVlOiBzdGFjayxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gc3RhY2s7XG4gICAgfVxuICB9KTtcbn1cblxucHJvdG8uZ2VuZXJhdGVTdGFja1RyYWNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZXhjbHVkZXMgPSB0aGlzLmNvbnN0cnVjdG9yLmV4Y2x1ZGVzO1xuICB2YXIgaW5jbHVkZSwgZnJhbWVzID0gW107XG5cbiAgLy8gU3BlY2lmaWMgcHJvdG90eXBlcyBpbmhlcml0IHRoZSBleGNsdWRlcyBmcm9tIEZhaWx1cmVcbiAgaWYgKGV4Y2x1ZGVzICE9PSBGYWlsdXJlLmV4Y2x1ZGVzKSB7XG4gICAgZXhjbHVkZXMucHVzaC5hcHBseShleGNsdWRlcywgRmFpbHVyZS5leGNsdWRlcyk7XG4gIH1cblxuICAvLyBBcHBseSBmaWx0ZXJpbmdcbiAgZm9yICh2YXIgaT0wOyBpIDwgdGhpcy5mcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpbmNsdWRlID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5mcmFtZXNbaV0pIHtcbiAgICAgIGZvciAodmFyIGo9MDsgaW5jbHVkZSAmJiBqIDwgZXhjbHVkZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaW5jbHVkZSAmPSAhZXhjbHVkZXNbal0uY2FsbCh0aGlzLCB0aGlzLmZyYW1lc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpbmNsdWRlKSB7XG4gICAgICBmcmFtZXMucHVzaCh0aGlzLmZyYW1lc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gSG9ub3IgYW55IHByZXZpb3VzbHkgZGVmaW5lZCBzdGFja3RyYWNlIGZvcm1hdHRlciBieSBhbGxvd2luZ1xuICAvLyBpdCB0byBmb3JtYXQgdGhlIGZyYW1lcy4gVGhpcyBpcyBuZWVkZWQgd2hlbiB1c2luZ1xuICAvLyBub2RlLXNvdXJjZS1tYXAtc3VwcG9ydCBmb3IgaW5zdGFuY2UuXG4gIC8vIFRPRE86IENhbiB3ZSBtYXAgdGhlIFwibnVsbFwiIGZyYW1lcyB0byBhIENhbGxGcmFtZSBzaGltP1xuICBpZiAob2xkUHJlcGFyZVN0YWNrVHJhY2UpIHtcbiAgICBmcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiAhIXg7IH0pO1xuICAgIHJldHVybiBvbGRQcmVwYXJlU3RhY2tUcmFjZS5jYWxsKEVycm9yLCB0aGlzLCBmcmFtZXMpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMucHJlcGFyZVN0YWNrVHJhY2UoZnJhbWVzKTtcbn07XG5cbnByb3RvLnByZXBhcmVTdGFja1RyYWNlID0gZnVuY3Rpb24gKGZyYW1lcykge1xuICB2YXIgbGluZXMgPSBbdGhpc107XG4gIGZvciAodmFyIGk9MDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBmcmFtZXNbaV0gPyBGYWlsdXJlLkZSQU1FX1BSRUZJWCArIGZyYW1lc1tpXSA6IEZhaWx1cmUuRlJBTUVfRU1QVFlcbiAgICApO1xuICB9XG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBGYWlsdXJlO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OW1ZV2xzZFhKbEwyeHBZaTltWVdsc2RYSmxMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRWlMQ0ptYVd4bElqb2laMlZ1WlhKaGRHVmtMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSW5aaGNpQkZjbkp2Y2xOMFlXTnJVR0Z5YzJWeUlEMGdjbVZ4ZFdseVpTZ25aWEp5YjNJdGMzUmhZMnN0Y0dGeWMyVnlKeWs3WEc1MllYSWdRMkZzYkZOcGRHVWdQU0J5WlhGMWFYSmxLQ2N1TDJOaGJHd3RjMmwwWlNjcE8xeHVYRzR2THlCTFpXVndJR0VnY21WbVpYSmxibU5sSUhSdklIUm9aU0JpZFdsc2RHbHVJR1Z5Y205eUlHTnZibk4wY25WamRHOXlYRzUyWVhJZ1RtRjBhWFpsUlhKeWIzSWdQU0JGY25KdmNqdGNibHh1THk4Z1FXNXViM1JoZEdsdmJpQnplVzFpYjJ4elhHNTJZWElnVTFsTlFrOU1YMFpTUVUxRlV5QTlJQ2RBUUdaaGFXeDFjbVV2Wm5KaGJXVnpKenRjYm5aaGNpQlRXVTFDVDB4ZlNVZE9UMUpGSUQwZ0owQkFabUZwYkhWeVpTOXBaMjV2Y21Vbk8xeHVYRzR2THlCVmJtWnZjblIxYm1GMFpXeDVJSGRsSUdoaGRtVWdjMjl0WlNCcGMzTjFaWE1nZDJsMGFDQkpSU0JoYm1RZ1pHVm1hVzVsVUhKdmNHVnlkSGxjYm5aaGNpQkpVMTlKUlNBOUlDZEJZM1JwZG1WWVQySnFaV04wSnlCcGJpQm5iRzlpWVd3N1hHNTJZWElnU1ZOZlJVUkhSU0E5SUdkc2IySmhiQzV1WVhacFoyRjBiM0lnSmlZZ0wwVmtaMlV2TG5SbGMzUW9aMnh2WW1Gc0xtNWhkbWxuWVhSdmNpNTFjMlZ5UVdkbGJuUXBPMXh1ZG1GeUlGVlRSVjlFUlVaZlVGSlBVQ0E5SUNGSlUxOUpSU0FtSmlBaFNWTmZSVVJIUlNBbUppQXZYRnhiYm1GMGFYWmxJR052WkdWY1hGMHZMblJsYzNRb1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLVHRjYmx4dVhHNW1kVzVqZEdsdmJpQkdZV2xzZFhKbElDaHRaWE56WVdkbExDQnpabVlwSUh0Y2JpQWdhV1lnS0NFb2RHaHBjeUJwYm5OMFlXNWpaVzltSUVaaGFXeDFjbVVwS1NCN1hHNGdJQ0FnY21WMGRYSnVJRzVsZHlCR1lXbHNkWEpsS0cxbGMzTmhaMlVzSUhObVppQjhmQ0JHWVdsc2RYSmxLVHRjYmlBZ2ZWeHVYRzRnSUhSb2FYTXVjMlptSUQwZ2MyWm1JSHg4SUhSb2FYTXVZMjl1YzNSeWRXTjBiM0k3WEc1Y2JpQWdkR2hwY3k1dFpYTnpZV2RsSUQwZ2JXVnpjMkZuWlR0Y2JseHVJQ0F2THlCSFpXNWxjbUYwWlNCaElHZGxkSFJsY2lCbWIzSWdkR2hsSUdaeVlXMWxjeXdnZEdocGN5Qmxibk4xY21WeklIUm9ZWFFnZDJVZ1pHOGdZWE1nYkdsMGRHeGxJSGR2Y210Y2JpQWdMeThnWVhNZ2NHOXpjMmxpYkdVZ2QyaGxiaUJwYm5OMFlXNTBhV0YwYVc1bklIUm9aU0JsY25KdmNpd2daR1ZtWlhKeWFXNW5JSFJvWlNCbGVIQmxibk5wZG1VZ2MzUmhZMnRjYmlBZ0x5OGdiV0Z1WjJ4cGJtY2diM0JsY21GMGFXOXVjeUIxYm5ScGJDQjBhR1VnTG5OMFlXTnJJSEJ5YjNCbGNuUjVJR2x6SUdGamRIVmhiR3g1SUhKbGNYVmxjM1JsWkM1Y2JpQWdkR2hwY3k1ZloyVjBSbkpoYldWeklEMGdiV0ZyWlVaeVlXMWxjMGRsZEhSbGNpaDBhR2x6TG5ObVppazdYRzVjYmlBZ0x5OGdUMjRnUlZNMUlHVnVaMmx1WlhNZ2QyVWdkWE5sSUc5dVpTMTBhVzFsSUdkbGRIUmxjbk1nZEc4Z1lXTjBkV0ZzYkhrZ1pHVm1aWElnZEdobElHVjRjR1Z1YzJsMlpWeHVJQ0F2THlCdmNHVnlZWFJwYjI1eklDaGtaV1pwYm1Wa0lHbHVJSFJvWlNCd2NtOTBiM1I1Y0dVZ1ptOXlJSEJsY21admNtMWhibU5sSUhKbFlYTnZibk1wSUhkb2FXeGxJR3hsWjJGamVWeHVJQ0F2THlCbGJtZHBibVZ6SUhkcGJHd2djMmx0Y0d4NUlHUnZJR0ZzYkNCMGFHVWdkMjl5YXlCMWNDQm1jbTl1ZEM1Y2JpQWdhV1lnS0NGVlUwVmZSRVZHWDFCU1QxQXBJSHRjYmlBZ0lDQjBhR2x6TG1aeVlXMWxjeUE5SUhWdWQybHVaQ2gwYUdsekxsOW5aWFJHY21GdFpYTW9LU2s3WEc0Z0lDQWdkR2hwY3k1ZloyVjBSbkpoYldWeklEMGdiblZzYkR0Y2JpQWdJQ0IwYUdsekxuTjBZV05ySUQwZ2RHaHBjeTVuWlc1bGNtRjBaVk4wWVdOclZISmhZMlVvS1R0Y2JpQWdmVnh1WEc0Z0lISmxkSFZ5YmlCMGFHbHpPMXh1ZlZ4dVhHNHZMeUJUWlhRZ1JsSkJUVVZmUlUxUVZGa2dkRzhnYm5Wc2JDQjBieUJrYVhOaFlteGxJR0Z1ZVNCemIzSjBJRzltSUhObGNHRnlZWFJ2Y2x4dVJtRnBiSFZ5WlM1R1VrRk5SVjlGVFZCVVdTQTlJQ2NnSUMwdExTMG5PMXh1Um1GcGJIVnlaUzVHVWtGTlJWOVFVa1ZHU1ZnZ1BTQW5JQ0JoZENBbk8xeHVYRzR2THlCQ2VTQmtaV1poZFd4MElIZGxJR1Z1WVdKc1pTQjBjbUZqYTJsdVp5Qm1iM0lnWVhONWJtTWdjM1JoWTJzZ2RISmhZMlZ6WEc1R1lXbHNkWEpsTGxSU1FVTkxTVTVISUQwZ2RISjFaVHRjYmx4dVhHNHZMeUJJWld4d1pYSWdkRzhnYjJKMFlXbHVJSFJvWlNCamRYSnlaVzUwSUhOMFlXTnJJSFJ5WVdObFhHNTJZWElnWjJWMFJYSnliM0pYYVhSb1UzUmhZMnNnUFNCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUhKbGRIVnliaUJ1WlhjZ1RtRjBhWFpsUlhKeWIzSW9LVHRjYm4wN1hHNHZMeUJUYjIxbElHVnVaMmx1WlhNZ1pHOGdibTkwSUdkbGJtVnlZWFJsSUhSb1pTQXVjM1JoWTJzZ2NISnZjR1Z5ZEhrZ2RXNTBhV3dnYVhRbmN5QjBhSEp2ZDI1Y2JtbG1JQ2doWjJWMFJYSnliM0pYYVhSb1UzUmhZMnNvS1M1emRHRmpheWtnZTF4dUlDQm5aWFJGY25KdmNsZHBkR2hUZEdGamF5QTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0IwY25rZ2V5QjBhSEp2ZHlCdVpYY2dUbUYwYVhabFJYSnliM0lvS1RzZ2ZTQmpZWFJqYUNBb1pTa2dleUJ5WlhSMWNtNGdaVHNnZlZ4dUlDQjlPMXh1ZlZ4dVhHNHZMeUJVY21sdElHWnlZVzFsY3lCMWJtUmxjaUIwYUdVZ2NISnZkbWxrWldRZ2MzUmhZMnNnWm1seWMzUWdablZ1WTNScGIyNWNibVoxYm1OMGFXOXVJSFJ5YVcwb1puSmhiV1Z6TENCelptWXBJSHRjYmlBZ2RtRnlJR1p1TENCdVlXMWxJRDBnYzJabUxtNWhiV1U3WEc0Z0lHbG1JQ2doWm5KaGJXVnpLU0I3WEc0Z0lDQWdaMnh2WW1Gc0xtTnZibk52YkdVZ0ppWWdZMjl1YzI5c1pTNTNZWEp1S0NkYlJtRnBiSFZ5WlYwZ1pYSnliM0lnWTJGd2RIVnlhVzVuSUdaeVlXMWxjeWNwTzF4dUlDQWdJSEpsZEhWeWJpQmJYVHRjYmlBZ2ZWeHVJQ0JtYjNJZ0tIWmhjaUJwUFRBN0lHa2dQQ0JtY21GdFpYTXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0JtYmlBOUlHWnlZVzFsYzF0cFhTNW5aWFJHZFc1amRHbHZiaWdwTzF4dUlDQWdJR2xtSUNobWJpQW1KaUJtYmlBOVBUMGdjMlptSUh4OElHNWhiV1VnSmlZZ2JtRnRaU0E5UFQwZ1puSmhiV1Z6VzJsZExtZGxkRVoxYm1OMGFXOXVUbUZ0WlNncEtTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z1puSmhiV1Z6TG5Oc2FXTmxLR2tnS3lBeEtUdGNiaUFnSUNCOVhHNGdJSDFjYmlBZ2NtVjBkWEp1SUdaeVlXMWxjenRjYm4xY2JseHVablZ1WTNScGIyNGdkVzUzYVc1a0lDaG1jbUZ0WlhNcElIdGNiaUFnZG1GeUlISmxjM1ZzZENBOUlGdGRPMXh1WEc0Z0lHWnZjaUFvZG1GeUlHazlNQ3dnWm00N0lHa2dQQ0JtY21GdFpYTXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0JtYmlBOUlHWnlZVzFsYzF0cFhTNW5aWFJHZFc1amRHbHZiaWdwTzF4dVhHNGdJQ0FnYVdZZ0tDRm1iaUI4ZkNBaFptNWJVMWxOUWs5TVgwbEhUazlTUlYwcElIdGNiaUFnSUNBZ0lISmxjM1ZzZEM1d2RYTm9LR1p5WVcxbGMxdHBYU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdhV1lnS0dadUlDWW1JR1p1VzFOWlRVSlBURjlHVWtGTlJWTmRLU0I3WEc0Z0lDQWdJQ0JwWmlBb1JtRnBiSFZ5WlM1R1VrRk5SVjlGVFZCVVdTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhOMWJIUXVjSFZ6YUNodWRXeHNLVHRjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnTHk4Z1EyRnNiQ0IwYUdVZ1oyVjBkR1Z5SUdGdVpDQnJaV1Z3SUdFZ2NtVm1aWEpsYm1ObElIUnZJSFJvWlNCeVpYTjFiSFFnYVc0Z1kyRnpaU0IzWlNCb1lYWmxJSFJ2WEc0Z0lDQWdJQ0F2THlCMWJuZHBibVFnZEdobElITmhiV1VnWm5WdVkzUnBiMjRnWVc1dmRHaGxjaUIwYVcxbExseHVJQ0FnSUNBZ0x5OGdWRTlFVHpvZ1RXRnJaU0J6ZFhKbElHdGxaWEJwYm1jZ1lTQnlaV1psY21WdVkyVWdkRzhnZEdobElHWnlZVzFsY3lCa2IyVnpiaWQwSUdOeVpXRjBaU0JzWldGcmMxeHVJQ0FnSUNBZ2FXWWdLSFI1Y0dWdlppQm1ibHRUV1UxQ1QweGZSbEpCVFVWVFhTQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnWjJWMGRHVnlJRDBnWm01YlUxbE5RazlNWDBaU1FVMUZVMTA3WEc0Z0lDQWdJQ0FnSUdadVcxTlpUVUpQVEY5R1VrRk5SVk5kSUQwZ2JuVnNiRHRjYmlBZ0lDQWdJQ0FnWm01YlUxbE5RazlNWDBaU1FVMUZVMTBnUFNCblpYUjBaWElvS1R0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2FXWWdLQ0ZtYmx0VFdVMUNUMHhmUmxKQlRVVlRYU2tnZTF4dUlDQWdJQ0FnSUNCbmJHOWlZV3d1WTI5dWMyOXNaU0FtSmlCamIyNXpiMnhsTG5kaGNtNG9KMXRHWVdsc2RYSmxYU0JGYlhCMGVTQm1jbUZ0WlhNZ1lXNXViM1JoZEdsdmJpY3BPMXh1SUNBZ0lDQWdJQ0JqYjI1MGFXNTFaVHRjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnY21WemRXeDBMbkIxYzJndVlYQndiSGtvY21WemRXeDBMQ0IxYm5kcGJtUW9abTViVTFsTlFrOU1YMFpTUVUxRlUxMHBLVHRjYmlBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lISmxkSFZ5YmlCeVpYTjFiSFE3WEc1OVhHNWNiaTh2SUZKbFkyVnBkbVZ5SUdadmNpQjBhR1VnWm5KaGJXVnpJR2x1SUdFZ0xuTjBZV05ySUhCeWIzQmxjblI1SUdaeWIyMGdZMkZ3ZEhWeVpWTjBZV05yVkhKaFkyVmNiblpoY2lCV09FWlNRVTFGVXlBOUlIdDlPMXh1WEc0dkx5QldPQ0JqYjJSbElIQmhkR2dnWm05eUlHZGxibVZ5WVhScGJtY2dZU0JtY21GdFpYTWdaMlYwZEdWeVhHNW1kVzVqZEdsdmJpQnRZV3RsUm5KaGJXVnpSMlYwZEdWeVZqZ2dLSE5tWmlrZ2UxeHVJQ0F2THlCVWFHbHpJSGRwYkd3Z1kyRnNiQ0J2ZFhJZ1kzVnpkRzl0SUhCeVpYQmhjbVZUZEdGamExUnlZV05sWEc0Z0lFNWhkR2wyWlVWeWNtOXlMbU5oY0hSMWNtVlRkR0ZqYTFSeVlXTmxLRlk0UmxKQlRVVlRMQ0J6Wm1ZZ2ZId2diV0ZyWlVaeVlXMWxjMGRsZEhSbGNsWTRLVHRjYmlBZ2MyWm1JRDBnYm5Wc2JEdGNiaUFnZG1GeUlHWnlZVzFsY3lBOUlGWTRSbEpCVFVWVExuTjBZV05yTzF4dUlDQldPRVpTUVUxRlV5NXpkR0ZqYXlBOUlHNTFiR3c3SUNBdkx5QlVhR2x6SUdseklHNWxaV1JsWkNCMGJ5QmhkbTlwWkNCc1pXRnJjeUVoSVZ4dUlDQldPRVpTUVUxRlV5QTlJSHQ5T3lBZ0x5OGdWR2hsSUc1bGVIUWdZMkZzYkNCeVpYRjFhWEpsY3lCaGJpQmxiWEIwZVNCdlltcGxZM1JjYmx4dUlDQnlaWFIxY200Z1puVnVZM1JwYjI0Z0tHTnNaV0Z1ZFhBcElIdGNiaUFnSUNCMllYSWdjbVZ6ZFd4MElEMGdabkpoYldWek8xeHVJQ0FnSUM4dklFTnNaV0Z1SUhWd0lHTnNiM04xY21VZ2RtRnlhV0ZpYkdWeklIUnZJR2hsYkhBZ1IwTmNiaUFnSUNCbWNtRnRaWE1nUFNCdWRXeHNPMXh1SUNBZ0lISmxkSFZ5YmlCeVpYTjFiSFE3WEc0Z0lIMDdYRzU5WEc1Y2JpOHZJRzV2YmkxV09DQmpiMlJsSUhCaGRHZ2dabTl5SUdkbGJtVnlZWFJwYm1jZ1lTQm1jbUZ0WlhNZ1oyVjBkR1Z5WEc1bWRXNWpkR2x2YmlCdFlXdGxSbkpoYldWelIyVjBkR1Z5UTI5dGNHRjBJQ2h6Wm1ZcElIdGNiaUFnTHk4Z1QySjBZV2x1SUdFZ2MzUmhZMnNnZEhKaFkyVWdZWFFnZEdobElHTjFjbkpsYm5RZ2NHOXBiblJjYmlBZ2RtRnlJR1Z5Y205eUlEMGdaMlYwUlhKeWIzSlhhWFJvVTNSaFkyc29LVHRjYmx4dUlDQXZMeUJYWVd4cklIUm9aU0JqWVd4c1pYSWdZMmhoYVc0Z2RHOGdZVzV1YjNSaGRHVWdkR2hsSUhOMFlXTnJJSGRwZEdnZ1puVnVZM1JwYjI0Z2NtVm1aWEpsYm1ObGMxeHVJQ0F2THlCSGFYWmxiaUIwYUdVZ2JHbHRhWFJoZEdsdmJuTWdhVzF3YjNObFpDQmllU0JGVXpVZ1hDSnpkSEpwWTNRZ2JXOWtaVndpSUdsMEozTWdibTkwSUhCdmMzTnBZbXhsWEc0Z0lDOHZJSFJ2SUc5aWRHRnBiaUJ5WldabGNtVnVZMlZ6SUhSdklHWjFibU4wYVc5dWN5QmlaWGx2Ym1RZ2IyNWxJSFJvWVhRZ2FYTWdaR1ZtYVc1bFpDQnBiaUJ6ZEhKcFkzUmNiaUFnTHk4Z2JXOWtaUzRnUVd4emJ5QnViM1JsSUhSb1lYUWdZVzU1SUd0cGJtUWdiMllnY21WamRYSnphVzl1SUhkcGJHd2diV0ZyWlNCMGFHVWdkMkZzYTJWeUlIVnVZV0pzWlZ4dUlDQXZMeUIwYnlCbmJ5QndZWE4wSUdsMExseHVJQ0IyWVhJZ1kyRnNiR1Z5SUQwZ1lYSm5kVzFsYm5SekxtTmhiR3hsWlR0Y2JpQWdkbUZ5SUdaMWJtTjBhVzl1Y3lBOUlGdG5aWFJGY25KdmNsZHBkR2hUZEdGamExMDdYRzRnSUdadmNpQW9kbUZ5SUdrOU1Ec2dZMkZzYkdWeUlDWW1JR2tnUENBeE1Ec2dhU3NyS1NCN1hHNGdJQ0FnWm5WdVkzUnBiMjV6TG5CMWMyZ29ZMkZzYkdWeUtUdGNiaUFnSUNCcFppQW9ZMkZzYkdWeUxtTmhiR3hsY2lBOVBUMGdZMkZzYkdWeUtTQmljbVZoYXp0Y2JpQWdJQ0JqWVd4c1pYSWdQU0JqWVd4c1pYSXVZMkZzYkdWeU8xeHVJQ0I5WEc0Z0lHTmhiR3hsY2lBOUlHNTFiR3c3WEc1Y2JpQWdjbVYwZFhKdUlHWjFibU4wYVc5dUlDaGpiR1ZoYm5Wd0tTQjdYRzRnSUNBZ2RtRnlJR1p5WVcxbGN5QTlJRzUxYkd3N1hHNWNiaUFnSUNCcFppQW9JV05zWldGdWRYQXBJSHRjYmlBZ0lDQWdJQzh2SUZCaGNuTmxJSFJvWlNCemRHRmpheUIwY21GalpWeHVJQ0FnSUNBZ2RISjVJSHRjYmlBZ0lDQWdJQ0FnWm5KaGJXVnpJRDBnUlhKeWIzSlRkR0ZqYTFCaGNuTmxjaTV3WVhKelpTaGxjbkp2Y2lrN1hHNWNiaUFnSUNBZ0lDQWdMeThnUVhSMFlXTm9JR1oxYm1OMGFXOXVJSEpsWm1WeVpXNWpaWE1nZEc4Z2RHaGxJR1p5WVcxbGN5QW9jMnRwY0hCcGJtY2dkR2hsSUcxaGEyVnlJR1p5WVcxbGN5bGNiaUFnSUNBZ0lDQWdMeThnWVc1a0lHTnlaV0YwYVc1bklFTmhiR3hUYVhSbElHOWlhbVZqZEhNZ1ptOXlJR1ZoWTJnZ2IyNWxMbHh1SUNBZ0lDQWdJQ0JtYjNJZ0tIWmhjaUJwUFRJN0lHa2dQQ0JtY21GdFpYTXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQm1jbUZ0WlhOYmFWMHVablZ1WTNScGIyNGdQU0JtZFc1amRHbHZibk5iYVYwN1hHNGdJQ0FnSUNBZ0lDQWdabkpoYldWelcybGRJRDBnYm1WM0lFTmhiR3hUYVhSbEtHWnlZVzFsYzF0cFhTazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCbWNtRnRaWE1nUFNCMGNtbHRLR1p5WVcxbGN5NXpiR2xqWlNneUtTd2djMlptS1R0Y2JpQWdJQ0FnSUgwZ1kyRjBZMmdnS0dVcElIdGNiaUFnSUNBZ0lDQWdMeThnU25WemRDQnBaMjV2Y21VZ1lXNWtJR3hsZENCMGFHVWdhR2xuYUdWeUlHeGhlV1Z5Y3lCa1pXRnNJSGRwZEdnZ2FYUmNiaUFnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNBdkx5QkRiR1ZoYmlCMWNDQmpiRzl6ZFhKbElIWmhjbWxoWW14bGN5QjBieUJvWld4d0lFZERYRzRnSUNBZ2MyWm1JRDBnWlhKeWIzSWdQU0JtZFc1amRHbHZibk1nUFNCdWRXeHNPMXh1WEc0Z0lDQWdjbVYwZFhKdUlHWnlZVzFsY3p0Y2JpQWdmVHRjYm4xY2JseHVMeThnUjJWdVpYSmhkR1Z6SUdFZ1oyVjBkR1Z5SUdadmNpQjBhR1VnWTJGc2JDQnphWFJsSUdaeVlXMWxjeTRnVkdobElHZGxkSFJsY2lCeVpYUjFjbTVsWkNCaWVWeHVMeThnZEdobGMyVWdabUZqZEc5eWFXVnpJR05oYmlCdmJteDVJSFZ6WldRZ2IyNWpaU3dnYzJsdVkyVWdkR2hsZVNCamJHVmhiaUIxY0NCMGFHVnBjaUJwYm01bGNpQnpkR0YwWlZ4dUx5OGdZV1owWlhJZ2RHaGxlU0JoY21VZ1kyRnNiR1ZrTGlCVWFHVjVJR0ZqWTJWd2RDQmhiaUJ2Y0hScGIyNWhiQ0JpYjI5c1pXRnVJR0Z5WjNWdFpXNTBJSGRvYVdOb1hHNHZMeUJwWmlCMGNuVmxJSGRwYkd3Z2FuVnpkQ0JqYkdWaGJpQjFjQ0IzYVhSb2IzVjBJR052YlhCMWRHbHVaeUIwYUdVZ1puSmhiV1Z6TGx4dUx5OWNiaTh2SUZSUFJFODZJRWxtSUhkbElHOWljMlZ5ZG1VZ2JHVmhhM01nZDJsMGFDQmpiMjF3YkdWNElIVnpaU0JqWVhObGN5QW9aSFZsSUhSdklHTnNiM04xY21VZ2MyTnZjR1Z6S1Z4dUx5OGdJQ0FnSUNBZ2QyVWdZMkZ1SUdkbGJtVnlZWFJsSUdobGNtVWdiM1Z5SUdOdmJYQmhkQ0JEWVd4c1UybDBaU0J2WW1wbFkzUnpJSE4wYjNKcGJtY2dkR2hsSUdaMWJtTjBhVzl1SjNOY2JpOHZJQ0FnSUNBZ0lITnZkWEpqWlNCamIyUmxJR2x1YzNSbFlXUWdiMllnWVc0Z1lXTjBkV0ZzSUhKbFptVnlaVzVqWlNCMGJ5QjBhR1Z0TENCMGFHRjBJSE5vYjNWc1pDQm9aV3h3WEc0dkx5QWdJQ0FnSUNCMGFHVWdSME1nYzJsdVkyVWdkMlVuYkd3Z1ltVWdhblZ6ZENCclpXVndhVzVuSUd4cGRHVnlZV3h6SUdGeWIzVnVaQzVjYm5aaGNpQnRZV3RsUm5KaGJXVnpSMlYwZEdWeUlEMGdkSGx3Wlc5bUlFNWhkR2wyWlVWeWNtOXlMbU5oY0hSMWNtVlRkR0ZqYTFSeVlXTmxJRDA5UFNBblpuVnVZM1JwYjI0blhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0EvSUcxaGEyVkdjbUZ0WlhOSFpYUjBaWEpXT0Z4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdPaUJ0WVd0bFJuSmhiV1Z6UjJWMGRHVnlRMjl0Y0dGME8xeHVYRzVjYmk4dklFOTJaWEp5YVdSbElGWTRJSE4wWVdOcklIUnlZV05sSUdKMWFXeGtaWElnZEc4Z2FXNXFaV04wSUc5MWNpQnNiMmRwWTF4dWRtRnlJRzlzWkZCeVpYQmhjbVZUZEdGamExUnlZV05sSUQwZ1JYSnliM0l1Y0hKbGNHRnlaVk4wWVdOclZISmhZMlU3WEc1RmNuSnZjaTV3Y21Wd1lYSmxVM1JoWTJ0VWNtRmpaU0E5SUdaMWJtTjBhVzl1SUNobGNuSnZjaXdnWm5KaGJXVnpLU0I3WEc0Z0lDOHZJRmRvWlc0Z1kyRnNiR1ZrSUdaeWIyMGdiV0ZyWlVaeVlXMWxjMGRsZEhSbGNsWTRJSGRsSUdwMWMzUWdkMkZ1ZENCMGJ5QnZZblJoYVc0Z2RHaGxJR1p5WVcxbGMxeHVJQ0JwWmlBb1pYSnliM0lnUFQwOUlGWTRSbEpCVFVWVEtTQjdYRzRnSUNBZ2NtVjBkWEp1SUdaeVlXMWxjenRjYmlBZ2ZWeHVYRzRnSUM4dklFWnZjbmRoY21RZ2RHOGdZVzU1SUhCeVpYWnBiM1Z6YkhrZ1pHVm1hVzVsWkNCaVpXaGhkbWx2ZFhKY2JpQWdhV1lnS0c5c1pGQnlaWEJoY21WVGRHRmphMVJ5WVdObEtTQjdYRzRnSUNBZ2RISjVJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQnZiR1JRY21Wd1lYSmxVM1JoWTJ0VWNtRmpaUzVqWVd4c0tFVnljbTl5TENCbGNuSnZjaXdnWm5KaGJXVnpLVHRjYmlBZ0lDQjlJR05oZEdOb0lDaGxLU0I3WEc0Z0lDQWdJQ0F2THlCS2RYTjBJR2xuYm05eVpTQjBhR1VnWlhKeWIzSWdLR2xsT2lCcllYSnRZUzF6YjNWeVkyVXRiV0Z3TFhOMWNIQnZjblFwWEc0Z0lDQWdmVnh1SUNCOVhHNWNiaUFnTHk4Z1JXMTFiR0YwWlNCa1pXWmhkV3gwSUdKbGFHRjJhVzkxY2lBb2QybDBhQ0JzYjI1bkxYUnlZV05sY3lsY2JpQWdjbVYwZFhKdUlFWmhhV3gxY21VdWNISnZkRzkwZVhCbExuQnlaWEJoY21WVGRHRmphMVJ5WVdObExtTmhiR3dvWlhKeWIzSXNJSFZ1ZDJsdVpDaG1jbUZ0WlhNcEtUdGNibjA3WEc1Y2JpOHZJRUYwZEdGamFDQmhJRzVsZHlCbGVHTnNkWE5wYjI0Z2NISmxaR2xqWVhSbElHWnZjaUJtY21GdFpYTmNibVoxYm1OMGFXOXVJR1Y0WTJ4MVpHVWdLR04wYjNJc0lIQnlaV1JwWTJGMFpTa2dlMXh1SUNCMllYSWdabTRnUFNCd2NtVmthV05oZEdVN1hHNWNiaUFnYVdZZ0tIUjVjR1Z2WmlCd2NtVmthV05oZEdVZ1BUMDlJQ2R6ZEhKcGJtY25LU0I3WEc0Z0lDQWdabTRnUFNCbWRXNWpkR2x2YmlBb1puSmhiV1VwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUF0TVNBaFBUMGdabkpoYldVdVoyVjBSbWxzWlU1aGJXVW9LUzVwYm1SbGVFOW1LSEJ5WldScFkyRjBaU2s3WEc0Z0lDQWdmVHRjYmlBZ2ZTQmxiSE5sSUdsbUlDaDBlWEJsYjJZZ2NISmxaR2xqWVhSbExuUmxjM1FnUFQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ0lDQm1iaUE5SUdaMWJtTjBhVzl1SUNobWNtRnRaU2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSEJ5WldScFkyRjBaUzUwWlhOMEtHWnlZVzFsTG1kbGRFWnBiR1ZPWVcxbEtDa3BPMXh1SUNBZ0lIMDdYRzRnSUgxY2JseHVJQ0JqZEc5eUxtVjRZMngxWkdWekxuQjFjMmdvWm00cE8xeHVmVnh1WEc0dkx5QkZlSEJ2YzJVZ2RHaGxJR1pwYkhSbGNpQnBiaUIwYUdVZ2NtOXZkQ0JHWVdsc2RYSmxJSFI1Y0dWY2JrWmhhV3gxY21VdVpYaGpiSFZrWlhNZ1BTQmJYVHRjYmtaaGFXeDFjbVV1WlhoamJIVmtaU0E5SUdWNFkyeDFaR1V1WW1sdVpDaHVkV3hzTENCR1lXbHNkWEpsS1R0Y2JseHVMeThnUVhSMFlXTm9JR0VnWm5KaGJXVnpJR2RsZEhSbGNpQjBieUIwYUdVZ1puVnVZM1JwYjI0Z2MyOGdkMlVnWTJGdUlISmxMV052Ym5OMGNuVmpkQ0JoYzNsdVl5QnpkR0ZqYTNNdVhHNHZMMXh1THk4Z1RtOTBaU0IwYUdGMElIUm9hWE1nYW5WemRDQmhkV2R0Wlc1MGN5QjBhR1VnWm5WdVkzUnBiMjRnZDJsMGFDQjBhR1VnYm1WM0lIQnliM0JsY25SNUxDQnBkQ0JrYjJWemJpZDBYRzR2THlCamNtVmhkR1VnWVNCM2NtRndjR1Z5SUdWMlpYSjVJSFJwYldVZ2FYUW5jeUJqWVd4c1pXUXNJSE52SUhWemFXNW5JR2wwSUcxMWJIUnBjR3hsSUhScGJXVnpJRzl1SUhSb1pWeHVMeThnYzJGdFpTQm1kVzVqZEdsdmJpQjNhV3hzSUdsdVpHVmxaQ0J2ZG1WeWQzSnBkR1VnZEdobElIQnlaWFpwYjNWeklIUnlZV05yYVc1bklHbHVabTl5YldGMGFXOXVMaUJVYUdselhHNHZMeUJwY3lCcGJuUmxibVJsWkNCemFXNWpaU0JwZENkeklHWmhjM1JsY2lCaGJtUWdiVzl5WlNCcGJYQnZjblJoYm5Sc2VTQmtiMlZ6YmlkMElHSnlaV0ZySUhOdmJXVWdRVkJKYzF4dUx5OGdkWE5wYm1jZ1kyRnNiR0poWTJzZ2NtVm1aWEpsYm1ObGN5QjBieUIxYm5KbFoybHpkR1Z5SUhSb1pXMGdabTl5SUdsdWMzUmhibU5sTGx4dUx5OGdWMmhsYmlCNWIzVWdkMkZ1ZENCMGJ5QjFjMlVnZEdobElITmhiV1VnWm5WdVkzUnBiMjRnZDJsMGFDQmthV1ptWlhKbGJuUWdkSEpoWTJ0cGJtY2dhVzVtYjNKdFlYUnBiMjVjYmk4dklHcDFjM1FnZFhObElFWmhhV3gxY21VdWQzSmhjQ2dwTGx4dUx5OWNiaTh2SUZSb1pTQjBjbUZqYTJsdVp5QmpZVzRnWW1VZ1oyeHZZbUZzYkhrZ1pHbHpZV0pzWldRZ1lua2djMlYwZEdsdVp5QkdZV2xzZFhKbExsUlNRVU5MU1U1SElIUnZJR1poYkhObFhHNUdZV2xzZFhKbExuUnlZV05ySUQwZ1puVnVZM1JwYjI0Z1JtRnBiSFZ5WlY5MGNtRmpheUFvWm00c0lITm1aaWtnZTF4dUlDQnBaaUFvZEhsd1pXOW1JR1p1SUNFOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdjbVYwZFhKdUlHWnVPMXh1SUNCOVhHNWNiaUFnTHk4Z1EyeGxZVzRnZFhBZ2NISmxkbWx2ZFhNZ1puSmhiV1Z6SUhSdklHaGxiSEFnZEdobElFZERYRzRnSUdsbUlDaDBlWEJsYjJZZ1ptNWJVMWxOUWs5TVgwWlNRVTFGVTEwZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0JtYmx0VFdVMUNUMHhmUmxKQlRVVlRYU2gwY25WbEtUdGNiaUFnZlZ4dVhHNGdJR2xtSUNoR1lXbHNkWEpsTGxSU1FVTkxTVTVIS1NCN1hHNGdJQ0FnWm01YlUxbE5RazlNWDBaU1FVMUZVMTBnUFNCdWRXeHNPMXh1SUNBZ0lHWnVXMU5aVFVKUFRGOUdVa0ZOUlZOZElEMGdiV0ZyWlVaeVlXMWxjMGRsZEhSbGNpaHpabVlnZkh3Z1JtRnBiSFZ5WlY5MGNtRmpheWs3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnWm00N1hHNTlPMXh1WEc0dkx5QlhjbUZ3Y3lCMGFHVWdablZ1WTNScGIyNGdZbVZtYjNKbElHRnVibTkwWVhScGJtY2dhWFFnZDJsMGFDQjBjbUZqYTJsdVp5QnBibVp2Y20xaGRHbHZiaXdnZEdocGMxeHVMeThnWVd4c2IzZHpJSFJ2SUhSeVlXTnJJRzExYkhScGNHeGxJR05oYkd4eklHWnZjaUJoSUhOcGJtZHNaU0JtZFc1amRHbHZiaTVjYmtaaGFXeDFjbVV1ZDNKaGNDQTlJR1oxYm1OMGFXOXVJRVpoYVd4MWNtVmZkM0poY0NBb1ptNHBJSHRjYmlBZ2RtRnlJSGR5WVhCd1pYSWdQU0JHWVdsc2RYSmxMbWxuYm05eVpTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlHWnVMbUZ3Y0d4NUtIUm9hWE1zSUdGeVozVnRaVzUwY3lrN1hHNGdJSDBwTzF4dVhHNGdJSEpsZEhWeWJpQkdZV2xzZFhKbExuUnlZV05yS0hkeVlYQndaWElzSUVaaGFXeDFjbVZmZDNKaGNDazdYRzU5TzF4dVhHNHZMeUJOWVhKcklHRWdablZ1WTNScGIyNGdkRzhnWW1VZ2FXZHViM0psWkNCM2FHVnVJR2RsYm1WeVlYUnBibWNnYzNSaFkyc2dkSEpoWTJWelhHNUdZV2xzZFhKbExtbG5ibTl5WlNBOUlHWjFibU4wYVc5dUlFWmhhV3gxY21WZmFXZHViM0psSUNobWJpa2dlMXh1SUNCbWJsdFRXVTFDVDB4ZlNVZE9UMUpGWFNBOUlIUnlkV1U3WEc0Z0lISmxkSFZ5YmlCbWJqdGNibjA3WEc1Y2JpOHZJRWhsYkhCbGNpQm1iM0lnZEhKaFkydHBibWNnWVNCelpYUlVhVzFsYjNWMFhHNUdZV2xzZFhKbExuTmxkRlJwYldWdmRYUWdQU0JtZFc1amRHbHZiaUJHWVdsc2RYSmxYM05sZEZScGJXVnZkWFFnS0NrZ2UxeHVJQ0JoY21kMWJXVnVkSE5iTUYwZ1BTQkdZV2xzZFhKbExuUnlZV05yS0dGeVozVnRaVzUwYzFzd1hTd2dSbUZwYkhWeVpWOXpaWFJVYVcxbGIzVjBLVHRjYmlBZ2NtVjBkWEp1SUhObGRGUnBiV1Z2ZFhRdVlYQndiSGtvYm5Wc2JDd2dZWEpuZFcxbGJuUnpLVHRjYm4wN1hHNWNiaTh2SUVobGJIQmxjaUJtYjNJZ2RISmhZMnRwYm1jZ1lTQnVaWGgwVkdsamExeHVSbUZwYkhWeVpTNXVaWGgwVkdsamF5QTlJR1oxYm1OMGFXOXVJRVpoYVd4MWNtVmZibVY0ZEZScFkyc2dLQ2tnZTF4dUlDQmhjbWQxYldWdWRITmJNRjBnUFNCR1lXbHNkWEpsTG5SeVlXTnJLR0Z5WjNWdFpXNTBjMXN3WFN3Z1JtRnBiSFZ5WlY5dVpYaDBWR2xqYXlrN1hHNGdJSEpsZEhWeWJpQndjbTlqWlhOekxtNWxlSFJVYVdOckxtRndjR3g1S0hCeWIyTmxjM01zSUdGeVozVnRaVzUwY3lrN1hHNTlPMXh1WEc0dkx5QkJiR3h2ZDNNZ2RHOGdaV0Z6YVd4NUlIQmhkR05vSUdFZ1puVnVZM1JwYjI0Z2RHaGhkQ0J5WldObGFYWmxjeUJoSUdOaGJHeGlZV05yWEc0dkx5QjBieUJoYkd4dmR5QjBjbUZqYTJsdVp5QjBhR1VnWVhONWJtTWdabXh2ZDNNdVhHNHZMeUJwWlRvZ1JtRnBiSFZ5WlM1d1lYUm9LSGRwYm1SdmR5d2dKM05sZEVsdWRHVnlkbUZzSnlsY2JrWmhhV3gxY21VdWNHRjBZMmdnUFNCbWRXNWpkR2x2YmlCR1lXbHNkWEpsWDNCaGRHTm9LRzlpYWl3Z2JtRnRaU3dnYVdSNEtTQjdYRzRnSUdsbUlDaHZZbW9nSmlZZ2RIbHdaVzltSUc5aWFsdHVZVzFsWFNBaFBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQWdJSFJvY205M0lHNWxkeUJGY25KdmNpZ25UMkpxWldOMElHUnZaWE1nYm05MElHaGhkbVVnWVNCY0lpY2dLeUJ1WVcxbElDc2dKMXdpSUcxbGRHaHZaQ2NwTzF4dUlDQjlYRzVjYmlBZ2RtRnlJRzl5YVdkcGJtRnNJRDBnYjJKcVcyNWhiV1ZkTzF4dVhHNGdJQzh2SUZkb1pXNGdkR2hsSUdWNFlXTjBJR0Z5WjNWdFpXNTBJR2x1WkdWNElHbHpJSEJ5YjNacFpHVmtJSFZ6WlNCaGJpQnZjSFJwYldsNlpXUWdZMjlrWlNCd1lYUm9YRzRnSUdsbUlDaDBlWEJsYjJZZ2FXUjRJRDA5UFNBbmJuVnRZbVZ5SnlrZ2UxeHVYRzRnSUNBZ2IySnFXMjVoYldWZElEMGdablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnWVhKbmRXMWxiblJ6VzJsa2VGMGdQU0JHWVdsc2RYSmxMblJ5WVdOcktHRnlaM1Z0Wlc1MGMxdHBaSGhkTENCdlltcGJibUZ0WlYwcE8xeHVJQ0FnSUNBZ2NtVjBkWEp1SUc5eWFXZHBibUZzTG1Gd2NHeDVLSFJvYVhNc0lHRnlaM1Z0Wlc1MGN5azdYRzRnSUNBZ2ZUdGNibHh1SUNBdkx5QlBkR2hsY25kcGMyVWdaR1YwWldOMElIUm9aU0JtZFc1amRHbHZibk1nZEc4Z2RISmhZMnNnWVhRZ2FXNTJiMnRoZEdsdmJpQjBhVzFsWEc0Z0lIMGdaV3h6WlNCN1hHNWNiaUFnSUNCdlltcGJibUZ0WlYwZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0JtYjNJZ0tIWmhjaUJwSUQwZ01Ec2dhU0E4SUdGeVozVnRaVzUwY3k1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdGeVozVnRaVzUwYzF0cFhTQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUNBZ0lDQWdJR0Z5WjNWdFpXNTBjMXRwWFNBOUlFWmhhV3gxY21VdWRISmhZMnNvWVhKbmRXMWxiblJ6VzJsZExDQnZZbXBiYm1GdFpWMHBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0J5WlhSMWNtNGdiM0pwWjJsdVlXd3VZWEJ3Ykhrb2RHaHBjeXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0I5TzF4dVhHNGdJSDFjYmx4dUlDQXZMeUJCZFdkdFpXNTBJSFJvWlNCM2NtRndjR1Z5SUhkcGRHZ2dZVzU1SUhCeWIzQmxjblJwWlhNZ1puSnZiU0IwYUdVZ2IzSnBaMmx1WVd4Y2JpQWdabTl5SUNoMllYSWdheUJwYmlCdmNtbG5hVzVoYkNrZ2FXWWdLRzl5YVdkcGJtRnNMbWhoYzA5M2JsQnliM0JsY25SNUtHc3BLU0I3WEc0Z0lDQWdiMkpxVzI1aGJXVmRXMnRkSUQwZ2IzSnBaMmx1WVd4YmExMDdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdiMkpxVzI1aGJXVmRPMXh1ZlR0Y2JseHVMeThnU0dWc2NHVnlJSFJ2SUdOeVpXRjBaU0J1WlhjZ1JtRnBiSFZ5WlNCMGVYQmxjMXh1Um1GcGJIVnlaUzVqY21WaGRHVWdQU0JtZFc1amRHbHZiaUFvYm1GdFpTd2djSEp2Y0hNcElIdGNiaUFnYVdZZ0tIUjVjR1Z2WmlCdVlXMWxJQ0U5UFNBbmMzUnlhVzVuSnlrZ2UxeHVJQ0FnSUhSb2NtOTNJRzVsZHlCR1lXbHNkWEpsS0NkRmVIQmxZM1JsWkNCaElHNWhiV1VnWVhNZ1ptbHljM1FnWVhKbmRXMWxiblFuS1R0Y2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlHTjBiM0lnS0cxbGMzTmhaMlVzSUhObVppa2dlMXh1SUNBZ0lHbG1JQ2doS0hSb2FYTWdhVzV6ZEdGdVkyVnZaaUJHWVdsc2RYSmxLU2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRzVsZHlCamRHOXlLRzFsYzNOaFoyVXNJSE5tWmlrN1hHNGdJQ0FnZlZ4dUlDQWdJRVpoYVd4MWNtVXVZWEJ3Ykhrb2RHaHBjeXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdmVnh1WEc0Z0lDOHZJRUYxWjIxbGJuUWdZMjl1YzNSeWRXTjBiM0pjYmlBZ1kzUnZjaTVsZUdOc2RXUmxjeUE5SUZ0ZE8xeHVJQ0JqZEc5eUxtVjRZMngxWkdVZ1BTQm1kVzVqZEdsdmJpQW9jSEpsWkdsallYUmxLU0I3WEc0Z0lDQWdaWGhqYkhWa1pTaGpkRzl5TENCd2NtVmthV05oZEdVcE8xeHVJQ0I5TzF4dVhHNGdJR04wYjNJdWNISnZkRzkwZVhCbElEMGdUMkpxWldOMExtTnlaV0YwWlNoR1lXbHNkWEpsTG5CeWIzUnZkSGx3WlNrN1hHNGdJR04wYjNJdWNISnZkRzkwZVhCbExtTnZibk4wY25WamRHOXlJRDBnWTNSdmNqdGNiaUFnWTNSdmNpNXdjbTkwYjNSNWNHVXVibUZ0WlNBOUlHNWhiV1U3WEc0Z0lHbG1JQ2gwZVhCbGIyWWdjSEp2Y0hNZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0JqZEc5eUxuQnliM1J2ZEhsd1pTNXdjbVZ3WVhKbFUzUmhZMnRVY21GalpTQTlJSEJ5YjNCek8xeHVJQ0I5SUdWc2MyVWdhV1lnS0hCeWIzQnpLU0I3WEc0Z0lDQWdUMkpxWldOMExtdGxlWE1vY0hKdmNITXBMbVp2Y2tWaFkyZ29ablZ1WTNScGIyNGdLSEJ5YjNBcElIdGNiaUFnSUNBZ0lHTjBiM0l1Y0hKdmRHOTBlWEJsVzNCeWIzQmRJRDBnY0hKdmNEdGNiaUFnSUNCOUtUdGNiaUFnZlZ4dUlDQnlaWFIxY200Z1kzUnZjanRjYm4wN1hHNWNiaTh2SUVKNUlHUmxabUYxYkhRZ2IyNXNlU0JGY25KdmNpQjNhV3hzSUdKbElISmxjR3hoWTJWa1hHNUdZV2xzZFhKbExtbHVjM1JoYkd3Z1BTQm1kVzVqZEdsdmJpQW9MeW9nTGk0dUlDb3ZLU0I3WEc0Z0lIWmhjaUJ5YjI5MElEMGdkSGx3Wlc5bUlIZHBibVJ2ZHlBOVBUMGdKMjlpYW1WamRDY2dQeUIzYVc1a2IzY2dPaUJuYkc5aVlXdzdYRzVjYmlBZ2RtRnlJR0Z5WjNNZ1BTQkJjbkpoZVM1d2NtOTBiM1I1Y0dVdWMyeHBZMlV1WTJGc2JDaGhjbWQxYldWdWRITXBPMXh1SUNCcFppQW9ZWEpuY3k1c1pXNW5kR2dnUFQwOUlEQXBJSHRjYmlBZ0lDQmhjbWR6TG5CMWMyZ29KMFZ5Y205eUp5azdYRzRnSUgxY2JseHVJQ0JtYjNJZ0tIWmhjaUJwUFRBN0lHazhZWEpuY3k1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lISnZiM1JiWVhKbmMxdHBYVjBnUFNCR1lXbHNkWEpsTG1OeVpXRjBaU2hoY21kelcybGRLVHRjYmlBZ2ZWeHVYRzRnSUM4dklFRnNiRzkzSUhWellXZGxPaUIyWVhJZ1JtRnBiSFZ5WlNBOUlISmxjWFZwY21Vb0oyWmhhV3gxY21VbktTNXBibk4wWVd4c0tDbGNiaUFnY21WMGRYSnVJRVpoYVd4MWNtVTdYRzU5TzF4dVhHNWNiblpoY2lCd2NtOTBieUE5SUVaaGFXeDFjbVV1Y0hKdmRHOTBlWEJsSUQwZ1QySnFaV04wTG1OeVpXRjBaU2hGY25KdmNpNXdjbTkwYjNSNWNHVXBPMXh1Y0hKdmRHOHVZMjl1YzNSeWRXTjBiM0lnUFNCR1lXbHNkWEpsTzF4dVhHNXdjbTkwYnk1dVlXMWxJRDBnSjBaaGFXeDFjbVVuTzF4dWNISnZkRzh1YldWemMyRm5aU0E5SUNjbk8xeHVYRzVwWmlBb1ZWTkZYMFJGUmw5UVVrOVFLU0I3WEc0Z0lFOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBlU2h3Y205MGJ5d2dKMlp5WVcxbGN5Y3NJSHRjYmlBZ0lDQm5aWFE2SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNBZ0lDOHZJRlZ6WlNCMGNtbHRiV2x1WnlCcWRYTjBJR2x1SUdOaGMyVWdkR2hsSUhObVppQjNZWE1nWkdWbWFXNWxaQ0JoWm5SbGNpQmpiMjV6ZEhKMVkzUnBibWRjYmlBZ0lDQWdJSFpoY2lCbWNtRnRaWE1nUFNCMWJuZHBibVFvZEhKcGJTaDBhR2x6TGw5blpYUkdjbUZ0WlhNb0tTd2dkR2hwY3k1elptWXBLVHRjYmx4dUlDQWdJQ0FnTHk4Z1EyRmphR1VnYm1WNGRDQmhZMk5sYzNObGN5QjBieUIwYUdVZ2NISnZjR1Z5ZEhsY2JpQWdJQ0FnSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaDBhR2x6TENBblpuSmhiV1Z6Snl3Z2UxeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ1puSmhiV1Z6TEZ4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ2RISjFaVnh1SUNBZ0lDQWdmU2s3WEc1Y2JpQWdJQ0FnSUM4dklFTnNaV0Z1SUhWd0lIUm9aU0JuWlhSMFpYSWdZMnh2YzNWeVpWeHVJQ0FnSUNBZ2RHaHBjeTVmWjJWMFJuSmhiV1Z6SUQwZ2JuVnNiRHRjYmx4dUlDQWdJQ0FnY21WMGRYSnVJR1p5WVcxbGN6dGNiaUFnSUNCOVhHNGdJSDBwTzF4dVhHNGdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNod2NtOTBieXdnSjNOMFlXTnJKeXdnZTF4dUlDQWdJR2RsZERvZ1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lDQWdkbUZ5SUhOMFlXTnJJRDBnZEdocGN5NW5aVzVsY21GMFpWTjBZV05yVkhKaFkyVW9LVHRjYmx4dUlDQWdJQ0FnTHk4Z1EyRmphR1VnYm1WNGRDQmhZMk5sYzNObGN5QjBieUIwYUdVZ2NISnZjR1Z5ZEhsY2JpQWdJQ0FnSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaDBhR2x6TENBbmMzUmhZMnNuTENCN1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lCemRHRmpheXhjYmlBZ0lDQWdJQ0FnZDNKcGRHRmliR1U2SUhSeWRXVmNiaUFnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdjM1JoWTJzN1hHNGdJQ0FnZlZ4dUlDQjlLVHRjYm4xY2JseHVjSEp2ZEc4dVoyVnVaWEpoZEdWVGRHRmphMVJ5WVdObElEMGdablZ1WTNScGIyNGdLQ2tnZTF4dUlDQjJZWElnWlhoamJIVmtaWE1nUFNCMGFHbHpMbU52Ym5OMGNuVmpkRzl5TG1WNFkyeDFaR1Z6TzF4dUlDQjJZWElnYVc1amJIVmtaU3dnWm5KaGJXVnpJRDBnVzEwN1hHNWNiaUFnTHk4Z1UzQmxZMmxtYVdNZ2NISnZkRzkwZVhCbGN5QnBibWhsY21sMElIUm9aU0JsZUdOc2RXUmxjeUJtY205dElFWmhhV3gxY21WY2JpQWdhV1lnS0dWNFkyeDFaR1Z6SUNFOVBTQkdZV2xzZFhKbExtVjRZMngxWkdWektTQjdYRzRnSUNBZ1pYaGpiSFZrWlhNdWNIVnphQzVoY0hCc2VTaGxlR05zZFdSbGN5d2dSbUZwYkhWeVpTNWxlR05zZFdSbGN5azdYRzRnSUgxY2JseHVJQ0F2THlCQmNIQnNlU0JtYVd4MFpYSnBibWRjYmlBZ1ptOXlJQ2gyWVhJZ2FUMHdPeUJwSUR3Z2RHaHBjeTVtY21GdFpYTXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0JwYm1Oc2RXUmxJRDBnZEhKMVpUdGNiaUFnSUNCcFppQW9kR2hwY3k1bWNtRnRaWE5iYVYwcElIdGNiaUFnSUNBZ0lHWnZjaUFvZG1GeUlHbzlNRHNnYVc1amJIVmtaU0FtSmlCcUlEd2daWGhqYkhWa1pYTXViR1Z1WjNSb095QnFLeXNwSUh0Y2JpQWdJQ0FnSUNBZ2FXNWpiSFZrWlNBbVBTQWhaWGhqYkhWa1pYTmJhbDB1WTJGc2JDaDBhR2x6TENCMGFHbHpMbVp5WVcxbGMxdHBYU2s3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdmVnh1SUNBZ0lHbG1JQ2hwYm1Oc2RXUmxLU0I3WEc0Z0lDQWdJQ0JtY21GdFpYTXVjSFZ6YUNoMGFHbHpMbVp5WVcxbGMxdHBYU2s3WEc0Z0lDQWdmVnh1SUNCOVhHNWNiaUFnTHk4Z1NHOXViM0lnWVc1NUlIQnlaWFpwYjNWemJIa2daR1ZtYVc1bFpDQnpkR0ZqYTNSeVlXTmxJR1p2Y20xaGRIUmxjaUJpZVNCaGJHeHZkMmx1WjF4dUlDQXZMeUJwZENCMGJ5Qm1iM0p0WVhRZ2RHaGxJR1p5WVcxbGN5NGdWR2hwY3lCcGN5QnVaV1ZrWldRZ2QyaGxiaUIxYzJsdVoxeHVJQ0F2THlCdWIyUmxMWE52ZFhKalpTMXRZWEF0YzNWd2NHOXlkQ0JtYjNJZ2FXNXpkR0Z1WTJVdVhHNGdJQzh2SUZSUFJFODZJRU5oYmlCM1pTQnRZWEFnZEdobElGd2liblZzYkZ3aUlHWnlZVzFsY3lCMGJ5QmhJRU5oYkd4R2NtRnRaU0J6YUdsdFAxeHVJQ0JwWmlBb2IyeGtVSEpsY0dGeVpWTjBZV05yVkhKaFkyVXBJSHRjYmlBZ0lDQm1jbUZ0WlhNZ1BTQm1jbUZ0WlhNdVptbHNkR1Z5S0daMWJtTjBhVzl1SUNoNEtTQjdJSEpsZEhWeWJpQWhJWGc3SUgwcE8xeHVJQ0FnSUhKbGRIVnliaUJ2YkdSUWNtVndZWEpsVTNSaFkydFVjbUZqWlM1allXeHNLRVZ5Y205eUxDQjBhR2x6TENCbWNtRnRaWE1wTzF4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUhSb2FYTXVjSEpsY0dGeVpWTjBZV05yVkhKaFkyVW9abkpoYldWektUdGNibjA3WEc1Y2JuQnliM1J2TG5CeVpYQmhjbVZUZEdGamExUnlZV05sSUQwZ1puVnVZM1JwYjI0Z0tHWnlZVzFsY3lrZ2UxeHVJQ0IyWVhJZ2JHbHVaWE1nUFNCYmRHaHBjMTA3WEc0Z0lHWnZjaUFvZG1GeUlHazlNRHNnYVNBOElHWnlZVzFsY3k1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lHeHBibVZ6TG5CMWMyZ29YRzRnSUNBZ0lDQm1jbUZ0WlhOYmFWMGdQeUJHWVdsc2RYSmxMa1pTUVUxRlgxQlNSVVpKV0NBcklHWnlZVzFsYzF0cFhTQTZJRVpoYVd4MWNtVXVSbEpCVFVWZlJVMVFWRmxjYmlBZ0lDQXBPMXh1SUNCOVhHNGdJSEpsZEhWeWJpQnNhVzVsY3k1cWIybHVLQ2RjWEc0bktUdGNibjA3WEc1Y2JseHViVzlrZFd4bExtVjRjRzl5ZEhNZ1BTQkdZV2xzZFhKbE8xeHVJbDE5IiwidmFyIEZhaWx1cmUgPSByZXF1aXJlKCcuL2xpYi9mYWlsdXJlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmFpbHVyZTtcbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvLyBVbml2ZXJzYWwgTW9kdWxlIERlZmluaXRpb24gKFVNRCkgdG8gc3VwcG9ydCBBTUQsIENvbW1vbkpTL05vZGUuanMsIFJoaW5vLCBhbmQgYnJvd3NlcnMuXG5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKCdlcnJvci1zdGFjay1wYXJzZXInLCBbJ3N0YWNrZnJhbWUnXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3N0YWNrZnJhbWUnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5FcnJvclN0YWNrUGFyc2VyID0gZmFjdG9yeShyb290LlN0YWNrRnJhbWUpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlcihTdGFja0ZyYW1lKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEZJUkVGT1hfU0FGQVJJX1NUQUNLX1JFR0VYUCA9IC8oXnxAKVxcUytcXDpcXGQrLztcbiAgICB2YXIgQ0hST01FX0lFX1NUQUNLX1JFR0VYUCA9IC9cXHMrYXQgLiooXFxTK1xcOlxcZCt8XFwobmF0aXZlXFwpKS87XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogR2l2ZW4gYW4gRXJyb3Igb2JqZWN0LCBleHRyYWN0IHRoZSBtb3N0IGluZm9ybWF0aW9uIGZyb20gaXQuXG4gICAgICAgICAqIEBwYXJhbSBlcnJvciB7RXJyb3J9XG4gICAgICAgICAqIEByZXR1cm4gQXJyYXlbU3RhY2tGcmFtZV1cbiAgICAgICAgICovXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZShlcnJvcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlcnJvci5zdGFja3RyYWNlICE9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgZXJyb3JbJ29wZXJhI3NvdXJjZWxvYyddICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmEoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5zdGFjayAmJiBlcnJvci5zdGFjay5tYXRjaChDSFJPTUVfSUVfU1RBQ0tfUkVHRVhQKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlVjhPcklFKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3Iuc3RhY2sgJiYgZXJyb3Iuc3RhY2subWF0Y2goRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRkZPclNhZmFyaShlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHBhcnNlIGdpdmVuIEVycm9yIG9iamVjdCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXBhcmF0ZSBsaW5lIGFuZCBjb2x1bW4gbnVtYmVycyBmcm9tIGEgVVJMLWxpa2Ugc3RyaW5nLlxuICAgICAgICAgKiBAcGFyYW0gdXJsTGlrZSBTdHJpbmdcbiAgICAgICAgICogQHJldHVybiBBcnJheVtTdHJpbmddXG4gICAgICAgICAqL1xuICAgICAgICBleHRyYWN0TG9jYXRpb246IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJGV4dHJhY3RMb2NhdGlvbih1cmxMaWtlKSB7XG4gICAgICAgICAgICAvLyBGYWlsLWZhc3QgYnV0IHJldHVybiBsb2NhdGlvbnMgbGlrZSBcIihuYXRpdmUpXCJcbiAgICAgICAgICAgIGlmICh1cmxMaWtlLmluZGV4T2YoJzonKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3VybExpa2VdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHVybExpa2UucmVwbGFjZSgvW1xcKFxcKVxcc10vZywgJycpLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB2YXIgbGFzdE51bWJlciA9IGxvY2F0aW9uUGFydHMucG9wKCk7XG4gICAgICAgICAgICB2YXIgcG9zc2libGVOdW1iZXIgPSBsb2NhdGlvblBhcnRzW2xvY2F0aW9uUGFydHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAoIWlzTmFOKHBhcnNlRmxvYXQocG9zc2libGVOdW1iZXIpKSAmJiBpc0Zpbml0ZShwb3NzaWJsZU51bWJlcikpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGluZU51bWJlciA9IGxvY2F0aW9uUGFydHMucG9wKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsb2NhdGlvblBhcnRzLmpvaW4oJzonKSwgbGluZU51bWJlciwgbGFzdE51bWJlcl07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbG9jYXRpb25QYXJ0cy5qb2luKCc6JyksIGxhc3ROdW1iZXIsIHVuZGVmaW5lZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VWOE9ySUU6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlVjhPcklFKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLmZpbHRlcihmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIWxpbmUubWF0Y2goQ0hST01FX0lFX1NUQUNLX1JFR0VYUCk7XG4gICAgICAgICAgICB9LCB0aGlzKS5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5zID0gbGluZS5yZXBsYWNlKC9eXFxzKy8sICcnKS5zcGxpdCgvXFxzKy8pLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdGhpcy5leHRyYWN0TG9jYXRpb24odG9rZW5zLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gKCF0b2tlbnNbMF0gfHwgdG9rZW5zWzBdID09PSAnQW5vbnltb3VzJykgPyB1bmRlZmluZWQgOiB0b2tlbnNbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgdW5kZWZpbmVkLCBsb2NhdGlvblBhcnRzWzBdLCBsb2NhdGlvblBhcnRzWzFdLCBsb2NhdGlvblBhcnRzWzJdLCBsaW5lKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlRkZPclNhZmFyaTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VGRk9yU2FmYXJpKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLmZpbHRlcihmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIWxpbmUubWF0Y2goRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQKTtcbiAgICAgICAgICAgIH0sIHRoaXMpLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBsaW5lLnNwbGl0KCdAJyk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSB0b2tlbnMuc2hpZnQoKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgdW5kZWZpbmVkLCBsb2NhdGlvblBhcnRzWzBdLCBsb2NhdGlvblBhcnRzWzFdLCBsb2NhdGlvblBhcnRzWzJdLCBsaW5lKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlT3BlcmE6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmEoZSkge1xuICAgICAgICAgICAgaWYgKCFlLnN0YWNrdHJhY2UgfHwgKGUubWVzc2FnZS5pbmRleE9mKCdcXG4nKSA+IC0xICYmXG4gICAgICAgICAgICAgICAgZS5tZXNzYWdlLnNwbGl0KCdcXG4nKS5sZW5ndGggPiBlLnN0YWNrdHJhY2Uuc3BsaXQoJ1xcbicpLmxlbmd0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9wZXJhOShlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWUuc3RhY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9wZXJhMTAoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmExMShlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZU9wZXJhOTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYTkoZSkge1xuICAgICAgICAgICAgdmFyIGxpbmVSRSA9IC9MaW5lIChcXGQrKS4qc2NyaXB0ICg/OmluICk/KFxcUyspL2k7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBlLm1lc3NhZ2Uuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMiwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBsaW5lUkUuZXhlYyhsaW5lc1tpXSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBTdGFja0ZyYW1lKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBtYXRjaFsyXSwgbWF0Y2hbMV0sIHVuZGVmaW5lZCwgbGluZXNbaV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VPcGVyYTEwOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhMTAoZSkge1xuICAgICAgICAgICAgdmFyIGxpbmVSRSA9IC9MaW5lIChcXGQrKS4qc2NyaXB0ICg/OmluICk/KFxcUyspKD86OiBJbiBmdW5jdGlvbiAoXFxTKykpPyQvaTtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IGUuc3RhY2t0cmFjZS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBsaW5lcy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMikge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IGxpbmVSRS5leGVjKGxpbmVzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFN0YWNrRnJhbWUobWF0Y2hbM10gfHwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIG1hdGNoWzJdLCBtYXRjaFsxXSwgdW5kZWZpbmVkLCBsaW5lc1tpXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBPcGVyYSAxMC42NSsgRXJyb3Iuc3RhY2sgdmVyeSBzaW1pbGFyIHRvIEZGL1NhZmFyaVxuICAgICAgICBwYXJzZU9wZXJhMTE6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmExMShlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yLnN0YWNrLnNwbGl0KCdcXG4nKS5maWx0ZXIoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISFsaW5lLm1hdGNoKEZJUkVGT1hfU0FGQVJJX1NUQUNLX1JFR0VYUCkgJiZcbiAgICAgICAgICAgICAgICAgICAgIWxpbmUubWF0Y2goL15FcnJvciBjcmVhdGVkIGF0Lyk7XG4gICAgICAgICAgICB9LCB0aGlzKS5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5zID0gbGluZS5zcGxpdCgnQCcpO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdGhpcy5leHRyYWN0TG9jYXRpb24odG9rZW5zLnBvcCgpKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25DYWxsID0gKHRva2Vucy5zaGlmdCgpIHx8ICcnKTtcbiAgICAgICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gZnVuY3Rpb25DYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvPGFub255bW91cyBmdW5jdGlvbig6IChcXHcrKSk/Pi8sICckMicpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwoW15cXCldKlxcKS9nLCAnJykgfHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhciBhcmdzUmF3O1xuICAgICAgICAgICAgICAgIGlmIChmdW5jdGlvbkNhbGwubWF0Y2goL1xcKChbXlxcKV0qKVxcKS8pKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NSYXcgPSBmdW5jdGlvbkNhbGwucmVwbGFjZSgvXlteXFwoXStcXCgoW15cXCldKilcXCkkLywgJyQxJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gKGFyZ3NSYXcgPT09IHVuZGVmaW5lZCB8fCBhcmdzUmF3ID09PSAnW2FyZ3VtZW50cyBub3QgYXZhaWxhYmxlXScpID8gdW5kZWZpbmVkIDogYXJnc1Jhdy5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsIGFyZ3MsIGxvY2F0aW9uUGFydHNbMF0sIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0sIGxpbmUpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xufSkpO1xuXG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgLy8gVW5pdmVyc2FsIE1vZHVsZSBEZWZpbml0aW9uIChVTUQpIHRvIHN1cHBvcnQgQU1ELCBDb21tb25KUy9Ob2RlLmpzLCBSaGlubywgYW5kIGJyb3dzZXJzLlxuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZSgnc3RhY2tmcmFtZScsIFtdLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LlN0YWNrRnJhbWUgPSBmYWN0b3J5KCk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGZ1bmN0aW9uIF9pc051bWJlcihuKSB7XG4gICAgICAgIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChuKSkgJiYgaXNGaW5pdGUobik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gU3RhY2tGcmFtZShmdW5jdGlvbk5hbWUsIGFyZ3MsIGZpbGVOYW1lLCBsaW5lTnVtYmVyLCBjb2x1bW5OdW1iZXIsIHNvdXJjZSkge1xuICAgICAgICBpZiAoZnVuY3Rpb25OYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RnVuY3Rpb25OYW1lKGZ1bmN0aW9uTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRBcmdzKGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWxlTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEZpbGVOYW1lKGZpbGVOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGluZU51bWJlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldExpbmVOdW1iZXIobGluZU51bWJlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbHVtbk51bWJlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldENvbHVtbk51bWJlcihjb2x1bW5OdW1iZXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzb3VyY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTb3VyY2Uoc291cmNlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFN0YWNrRnJhbWUucHJvdG90eXBlID0ge1xuICAgICAgICBnZXRGdW5jdGlvbk5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZ1bmN0aW9uTmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0RnVuY3Rpb25OYW1lOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdGhpcy5mdW5jdGlvbk5hbWUgPSBTdHJpbmcodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0QXJnczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXJncztcbiAgICAgICAgfSxcbiAgICAgICAgc2V0QXJnczogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodikgIT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmdzIG11c3QgYmUgYW4gQXJyYXknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYXJncyA9IHY7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gTk9URTogUHJvcGVydHkgbmFtZSBtYXkgYmUgbWlzbGVhZGluZyBhcyBpdCBpbmNsdWRlcyB0aGUgcGF0aCxcbiAgICAgICAgLy8gYnV0IGl0IHNvbWV3aGF0IG1pcnJvcnMgVjgncyBKYXZhU2NyaXB0U3RhY2tUcmFjZUFwaVxuICAgICAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L3dpa2kvSmF2YVNjcmlwdFN0YWNrVHJhY2VBcGkgYW5kIEdlY2tvJ3NcbiAgICAgICAgLy8gaHR0cDovL214ci5tb3ppbGxhLm9yZy9tb3ppbGxhLWNlbnRyYWwvc291cmNlL3hwY29tL2Jhc2UvbnNJRXhjZXB0aW9uLmlkbCMxNFxuICAgICAgICBnZXRGaWxlTmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsZU5hbWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldEZpbGVOYW1lOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdGhpcy5maWxlTmFtZSA9IFN0cmluZyh2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saW5lTnVtYmVyO1xuICAgICAgICB9LFxuICAgICAgICBzZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKCFfaXNOdW1iZXIodikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdMaW5lIE51bWJlciBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxpbmVOdW1iZXIgPSBOdW1iZXIodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb2x1bW5OdW1iZXI7XG4gICAgICAgIH0sXG4gICAgICAgIHNldENvbHVtbk51bWJlcjogZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmICghX2lzTnVtYmVyKHYpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29sdW1uIE51bWJlciBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbHVtbk51bWJlciA9IE51bWJlcih2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRTb3VyY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNvdXJjZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0U291cmNlOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2UgPSBTdHJpbmcodik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IHRoaXMuZ2V0RnVuY3Rpb25OYW1lKCkgfHwgJ3thbm9ueW1vdXN9JztcbiAgICAgICAgICAgIHZhciBhcmdzID0gJygnICsgKHRoaXMuZ2V0QXJncygpIHx8IFtdKS5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICB2YXIgZmlsZU5hbWUgPSB0aGlzLmdldEZpbGVOYW1lKCkgPyAoJ0AnICsgdGhpcy5nZXRGaWxlTmFtZSgpKSA6ICcnO1xuICAgICAgICAgICAgdmFyIGxpbmVOdW1iZXIgPSBfaXNOdW1iZXIodGhpcy5nZXRMaW5lTnVtYmVyKCkpID8gKCc6JyArIHRoaXMuZ2V0TGluZU51bWJlcigpKSA6ICcnO1xuICAgICAgICAgICAgdmFyIGNvbHVtbk51bWJlciA9IF9pc051bWJlcih0aGlzLmdldENvbHVtbk51bWJlcigpKSA/ICgnOicgKyB0aGlzLmdldENvbHVtbk51bWJlcigpKSA6ICcnO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uTmFtZSArIGFyZ3MgKyBmaWxlTmFtZSArIGxpbmVOdW1iZXIgKyBjb2x1bW5OdW1iZXI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIFN0YWNrRnJhbWU7XG59KSk7XG4iXX0=
