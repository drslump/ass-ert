!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ass=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hc3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIE1hdGNoZXIgPSByZXF1aXJlKCcuL21hdGNoZXInKTtcbnZhciBFeHBlY3RhdGlvbiA9IHJlcXVpcmUoJy4vZXhwZWN0YXRpb24nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cblxudmFyIGRlZlByb3AgPSB1dGlsLmJpbmQoT2JqZWN0LmRlZmluZVByb3BlcnR5LCBPYmplY3QpO1xuXG5cbi8vIFB1YmxpYyBpbnRlcmZhY2VcbmZ1bmN0aW9uIGFzcyAodmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IENoYWluKCk7XG4gIH1cbiAgcmV0dXJuIG5ldyBDaGFpbih2YWx1ZSk7XG59XG5cbi8vIERlZmVycmVkIGZhY3RvcnlcbmFzcy5fID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpLl87XG59O1xuXG4vLyBHbG9iYWwgcmVnaXN0cnkgb2YgbWF0Y2hlcnMgKHVzZWQgZm9yIGFzcy5oZWxwKVxuYXNzLm1hdGNoZXJzID0gW107XG5cbi8vIGFzcy5oZWxwIGR1bXBzIHRoZSBoZWxwIG9mIGVhY2ggbWF0Y2hlciByZWdpc3RlcmVkXG5kZWZQcm9wKGFzcywgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gJyc7XG4gICAgXy5mb3JFYWNoKGFzcy5tYXRjaGVycywgZnVuY3Rpb24gKG1hdGNoZXIpIHtcbiAgICAgIC8vIFRPRE86IFRoaXMgY2FuIGJlIG5pY2VyXG4gICAgICB2YXIgZm4gPSBtYXRjaGVyLnRlc3QudG9TdHJpbmcoKTtcbiAgICAgIHZhciBhcmdzID0gZm4ucmVwbGFjZSgvXmZ1bmN0aW9uXFxzKlxcKChbXlxcKV0qKVxcKVtcXFNcXHNdKi8sICckMScpO1xuICAgICAgYXJncyA9IGFyZ3Muc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgudHJpbSgpOyB9KTtcbiAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgIGZuID0gYXJncy5sZW5ndGggPyAnICgnICsgYXJncy5qb2luKCcsICcpICsgJyknIDogJyc7XG5cbiAgICAgIHMgKz0gJz4gLicgKyBtYXRjaGVyLm5hbWUgKyBmbiArICdcXG5cXG4nO1xuICAgICAgcyArPSAnICAnICsgbWF0Y2hlci5oZWxwLnJlcGxhY2UoL1xcbi9nLCAnXFxuICAnKTtcbiAgICAgIHMgKz0gJ1xcblxcbic7XG4gICAgfSk7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn0pO1xuXG5hc3Mub2sgPSBmdW5jdGlvbiAoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSB0cnVpc2ggdmFsdWUnO1xuICB9XG4gIGFzcy5kZXNjKG1lc3NhZ2UpLnRydXRoeS5hc3NlcnQoY29uZCwgYXNzLm9rKTtcbiAgcmV0dXJuIGNvbmQ7XG59O1xuXG5hc3Mua28gPSBmdW5jdGlvbiAoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSBmYWxzeSB2YWx1ZSc7XG4gIH1cbiAgYXNzLmRlc2MobWVzc2FnZSkuZmFsc3kuYXNzZXJ0KGNvbmQsIGFzcy5rbyk7XG4gIHJldHVybiBjb25kO1xufTtcblxuLy8gUmVzZXRzIG9yIHZlcmlmaWVzIHRoZSBudW1iZXIgb2YgbWFya3Mgc28gZmFyXG4vLyBGb3JjZWQgYXJpdHktMCB0byBiZSBjb21wYXRpYmxlIHdpdGg6IGJlZm9yZUVhY2goYXNzLm1hcmtzKVxuYXNzLm1hcmtzID0gZnVuY3Rpb24gKC8qIGV4cGVjdGVkLCBkZXNjICovKSB7XG4gIHZhciBleHBlY3RlZCA9IGFyZ3VtZW50c1swXTtcbiAgdmFyIGRlc2MgPSBhcmd1bWVudHNbMV07XG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgZXhwZWN0ZWQgPSBhc3MubWFya3MuY291bnRlcjtcbiAgICBhc3MubWFya3MuY291bnRlciA9IDA7XG4gICAgcmV0dXJuIGV4cGVjdGVkOyAgLy8gcmV0dXJuIGJhY2sgaG93IG1hbnkgdGhlcmUgd2VyZVxuICB9XG5cbiAgYXNzLmRlc2MoZGVzYyB8fCAnYXNzLm1hcmtzJykuZXEoZXhwZWN0ZWQpXG4gIC5hc3NlcnQoYXNzLm1hcmtzLmNvdW50ZXIsIGFzcy5tYXJrcyk7XG59O1xuYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuXG5cbi8vIEhlbHBlciB0byByZWdpc3RlciBuZXcgbWF0Y2hlcnMgaW4gdGhlIHJlZ2lzdHJ5XG5hc3MucmVnaXN0ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWF0Y2hlcikge1xuICBpZiAobmFtZSBpbnN0YW5jZW9mIE1hdGNoZXIpIHtcbiAgICBtYXRjaGVyID0gbmFtZTtcbiAgICBuYW1lID0gbWF0Y2hlci5uYW1lO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgIE9iamVjdC5rZXlzKG5hbWUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgYXNzLnJlZ2lzdGVyKGtleSwgbmFtZVtrZXldKTtcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSB7ICAvLyBBc3N1bWUgYSBkZXNjcmlwdG9yIHdhcyBnaXZlblxuICAgIC8vIENyZWF0ZSB0aGUgYWxpYXNlcyBmaXJzdFxuICAgIF8uZm9yRWFjaChtYXRjaGVyLmFsaWFzZXMsIGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgYXNzLnJlZ2lzdGVyKG5ldyBNYXRjaGVyKGFsaWFzLCBtYXRjaGVyKSk7XG4gICAgfSk7XG5cbiAgICBtYXRjaGVyID0gbmV3IE1hdGNoZXIobmFtZSwgbWF0Y2hlcik7XG4gIH1cblxuICAvLyBLZWVwIHRoZSBtYXRjaGVyIGFyb3VuZCBmb3IgYXNzLmhlbHBcbiAgYXNzLm1hdGNoZXJzLnB1c2gobWF0Y2hlcik7XG5cblxuICAvLyBUT0RPOiBBbGxvdyBtYXRjaGVycyB0byBiZSBvdmVycmlkZGVuIGFuZCBhbHNvIG92ZXJsb2FkZWRcbiAgLy8gICAgICAgaWYgdGhleSBoYXZlIGFuIFwib3ZlcmxvYWRcIiBtZXRob2QgaXQgY2FuIGJlIHVzZWRcbiAgLy8gICAgICAgdG8gY2hlY2sgd2hpY2ggb25lIHNob3VsZCBiZSB1c2VkLlxuICAvLyAgICAgICBCZXR0ZXIgSWRlYSAoSSB0aGluayksIGluc3RlYWQgb2Ygb3ZlcmxvYWRpbmcgYmFzZWRcbiAgLy8gICAgICAgb24gdGhlIHZhbHVlIHVuZGVyIHRlc3QsIHdoaWNoIG1heSBwcm9kdWNlIGlzc3Vlc1xuICAvLyAgICAgICBzaW5jZSB3ZSBkb24ndCBrbm93IGZvciBzdXJlIHdoYXQgdGhhdCB2YWx1ZSBpcyxcbiAgLy8gICAgICAgYWxsb3cgbWF0Y2hlcnMgdG8gaW50cm9kdWNlIGEgbmV3IFwicHJvdG90eXBlXCIgZm9yXG4gIC8vICAgICAgIHRoZSBjaGFpbiwgdGhhdCBpcywgYSAuZG9tIG1hdGNoZXIgd2lsbCBpbmNsdWRlXG4gIC8vICAgICAgIGFsbCB0aGUgY29yZSBleHBlY3RhdGlvbnMgYnV0IHRoZW4gYWxzbyBvdmVycmlkZXNcbiAgLy8gICAgICAgYW5kIG5ldyBvbmVzIHVudGlsIHRoZSBlbmQgb2YgdGhlIGNoYWluLlxuXG5cbiAgLy8gTWF0Y2hlciBmdW5jdGlvbnMgd2l0aCBhIHNpbmdsZSBhcmd1bWVudCBhcmUgZ2V0dGVyc1xuICB2YXIgZm5LZXkgPSBtYXRjaGVyLmFyaXR5ID09PSAxID8gJ2dldCcgOiAndmFsdWUnO1xuICB2YXIgcHJvcCA9IHtcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfTtcbiAgaWYgKGZuS2V5ID09PSAndmFsdWUnKSB7XG4gICAgcHJvcC53cml0YWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgLy8gQXVnbWVudCB0aGUgQ2hhaW4gcHJvdG90eXBlXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gZm4gKCkge1xuICAgIHZhciBleHAgPSBuZXcgRXhwZWN0YXRpb24obWF0Y2hlciwgYXJndW1lbnRzKTtcbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucHVzaChleHApO1xuICAgIGlmICghdGhpcy5fX2RlZmVycmVkX18pIHtcbiAgICAgIHRoaXMuYXNzZXJ0KHRoaXMudmFsdWUsIGZuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHByb3ApO1xuXG4gIC8vIEF1Z21lbnQgdGhlIHN0YXRpYyBpbnRlcmZhY2VcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoYWluID0gbmV3IENoYWluKCk7XG5cbiAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICByZXR1cm4gY2hhaW5bbmFtZV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYWluW25hbWVdLmFwcGx5KGNoYWluLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIGRlZlByb3AoYXNzLCBuYW1lLCBwcm9wKTtcblxuICAvLyBQYXNzIHRocm91Z2ggZm9yIGNoYWluc1xuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uIHBhc3N0aHJvdWdoKCkge1xuICAgIHJldHVybiB0aGlzW25hbWVdLmFzc2VydCh0aGlzLnZhbHVlLCBwYXNzdGhyb3VnaCkudmFsdWVPZigpO1xuICB9O1xuICBwcm9wLmVudW1lcmFibGUgPSBmYWxzZTtcbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsICckJyArIG5hbWUsIHByb3ApO1xuXG4gIC8vIFBhc3MgdGhyb3VnaCBzdGF0aWMgY29uc3RydWN0b3JcbiAgZGVmUHJvcChhc3MsICckJyArIG5hbWUsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICAgIHJldHVybiBhc3ModmFsdWUpWyckJyArIG5hbWVdO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgZXhwcmVzc2lvbiBmb3IgdGhlIGV4cGVjdGF0aW9uXG4gICAgICB2YXIgY2hhaW4gPSBuZXcgQ2hhaW4oKTtcbiAgICAgIGNoYWluW25hbWVdLmFwcGx5KGNoYWluLCBhcmd1bWVudHMpO1xuICAgICAgLy8gUmV0dXJuIGEgY2FsbGFibGUgdGhhdCBhc3NlcnRzIHVwb24gcmVjZWl2aW5nIGEgdmFsdWVcbiAgICAgIHJldHVybiBjaGFpbi50aHJvdWdoO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBhc3M7XG4iXX0=
},{"./chain":2,"./expectation":4,"./matcher":5,"./util":13}],2:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
    .filter(function (c) { return c.description })
    .map(function (c) { return c.description });

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9jaGFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciByZXNvbHZlcnMgPSByZXF1aXJlKCcuL3Jlc29sdmVycycpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBQcm9taXNlID0gdXRpbC5Qcm9taXNlO1xuXG52YXIgZGVmUHJvcCA9IHV0aWwuYmluZChPYmplY3QuZGVmaW5lUHJvcGVydHksIE9iamVjdCk7XG5cbi8vIEFuIGV4cGVjdGF0aW9ucyBjaGFpbiAoYWthIGV4cHJlc3Npb24pLCB0aGUgY29yZSBvYmplY3Qgb2YgdGhlIGxpYnJhcnksXG4vLyBhbGxvd3MgdG8gc2V0dXAgYSBzZXQgb2YgZXhwZWN0YXRpb25zIHRvIGJlIHJ1biBhdCBhbnkgcG9pbnQgYWdhaW5zdCBhXG4vLyB2YWx1ZS5cbmZ1bmN0aW9uIENoYWluICh2YWx1ZSkge1xuICBpZiAoIUNoYWluLmlzQ2hhaW4odGhpcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FzcyBDaGFpbiBjb25zdHJ1Y3RvciBjYWxsZWQgd2l0aG91dCBuZXchJyk7XG4gIH1cblxuICAvLyBUT0RPOiBPbiBub24gaW5pdGlhbGl6ZWQgY2hhaW5zIHdlIGNhbid0IGRvIC52YWx1ZSwgaXQgc2hvdWxkXG4gIC8vICAgICAgIGJlIGEgZXhwZWN0YXRpb24gdGhhdCBnZXRzIHRoZSBpbml0aWFsIHZhbHVlIGdpdmVuIHdoZW5cbiAgLy8gICAgICAgcmVzb2x2aW5nIChzbywgaXQgc2hvdWxkIGJlIHN0b3JlZCBvbiB0aGUgcmVzb2x2ZXIpXG4gIHRoaXMudmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IHZhbHVlIDogdGhpcy5fX0dVQVJEX187XG5cbiAgLy8gQ3VzdG9tIGRlc2NyaXB0aW9uXG4gIGRlZlByb3AodGhpcywgJ19fZGVzY3JpcHRpb25fXycsIHtcbiAgICB2YWx1ZTogJycsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBMaXN0IG9mIFsgRXhwZWN0YXRpb24gXVxuICBkZWZQcm9wKHRoaXMsICdfX2V4cGVjdGF0aW9uc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBXaGVuIHRydWUgdGhlIGV4cHJlc3Npb24gaXMgY29uc2lkZXJlZCBkZWZlcnJlZCBhbmQgd29uJ3RcbiAgLy8gdHJ5IHRvIGltbWVkaWF0ZWx5IGV2YWx1YXRlIGFueSBuZXdseSBjaGFpbmVkIGV4cGVjdGF0aW9uLlxuICBkZWZQcm9wKHRoaXMsICdfX2RlZmVycmVkX18nLCB7XG4gICAgdmFsdWU6IHRoaXMudmFsdWUgPT09IHRoaXMuX19HVUFSRF9fLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gSG9sZHMgdGhlIGxpc3Qgb2YgcHJvbWlzZSBjYWxsYmFja3MgYXR0YWNoZWQgdG8gdGhlIGV4cHJlc3Npb25cbiAgZGVmUHJvcCh0aGlzLCAnX190aGVuc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBTZWFsIHRoZSBjb250ZXh0IHRvIHRoZSBtZXRob2RzIHNvIHdlIGNhbiBjYWxsIHRoZW0gYXMgcGxhaW4gZnVuY3Rpb25zXG4gIHRoaXMudGVzdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUudGVzdCwgdGhpcyk7XG4gIHRoaXMuYXNzZXJ0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS5hc3NlcnQsIHRoaXMpO1xuICB0aGlzLnJlc3VsdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUucmVzdWx0LCB0aGlzKTtcbiAgdGhpcy50aHJvdWdoID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS50aHJvdWdoLCB0aGlzKTtcbiAgdGhpcy4kID0gdGhpcy50aHJvdWdoO1xufVxuXG5DaGFpbi5pc0NoYWluID0gZnVuY3Rpb24gKG9iaikge1xuICAvLyBUaGlzIGxvb2tzIGNvbnRyaXZlZCBidXQgaW5zdGFuY2VvZiBpcyBraW5kIG9mIHNsb3ctaXNoXG4gIHJldHVybiBvYmogJiYgb2JqLmNvbnN0cnVjdG9yID09PSBDaGFpbjtcbn07XG5cblxudmFyIHByb3RvID0gQ2hhaW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gQ2hhaW47XG5cbi8vIEd1YXJkIHRva2VuIHRvIGRldGVjdCB2YWx1ZWxlc3MgbWF0Y2hlcnNcbnByb3RvLl9fR1VBUkRfXyA9IHtcbiAgdmFsdWVPZjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd7e3ZhbHVlbGVzc319JztcbiAgfVxufTtcblxuLy8gU3VwcG9ydHMgdGhlIHVzYWdlOiBhc3Muc3RyaW5nLmhlbHBcbmRlZlByb3AocHJvdG8sICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPOiBQcm9kdWN0aXplIHRoaXMgYW5kIHBlcmhhcHMgc2hvdyBoZWxwIGZvciB0aGUgd2hvbGUgY2hhaW5cbiAgICB2YXIgdGFpbCA9IF8udGFpbCh0aGlzLl9fZXhwZWN0YXRpb25zX18pO1xuICAgIHJldHVybiB0YWlsID8gdGFpbC5oZWxwIDogJ04vQSc7XG4gIH1cbn0pO1xuXG4vLyBTdXBwb3J0IHVzZSBjYXNlOiBhc3ModmFsdWUpLl8uc29tZS5udW1iZXIuYWJvdmUoNSkuX1xuZGVmUHJvcChwcm90bywgJ18nLCB7XG4gIGdldDogZnVuY3Rpb24gZm4oKSB7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5fX2RlZmVycmVkX18gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IGZhbHNlO1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufSk7XG5cblxuLy8gRXhwb3NlcyBhIFByb21pc2UvQSBpbnRlcmZhY2UgZm9yIHRoZSBleHByZXNzaW9uLCB0aGUgaW50ZW5kZWQgdXNlIGlzIGZvclxuLy8gb2J0YWluaW5nIHRoZSByZXN1bHQgZm9yIGFzeW5jaHJvbm91cyBleHByZXNzaW9ucy5cbi8vIEhlcmUgdGhvdWdoIHdlIGp1c3QgY29sbGVjdCB0aGUgY2FsbGJhY2tzLCB0aGUgYWN0dWFsIHByb21pc2UgcmVzb2x1dGlvblxuLy8gaXMgZG9uZSBpbiB0aGUgcmVzb2x2ZXIgd2hlbiBpdCByZWFjaGVzIGEgcmVzdWx0LlxucHJvdG8udGhlbiA9IGZ1bmN0aW9uIChjYiwgZWIpIHtcbiAgLy8gUmVnaXN0ZXIgdGhlIGNhbGxiYWNrcyB0byBiZSB1c2VkIHdoZW4gcmVzb2x2ZWRcbiAgdGhpcy5fX3RoZW5zX18ucHVzaChbY2IsIGViXSk7XG5cbiAgLy8gV2hlbiB0aGUgZXhwcmVzc2lvbiBpcyBub24gZGVmZXJyZWQgYW5kIHdlIGhhdmUgYSB2YWx1ZSB3ZSBmb3JjZSB0aGVcbiAgLy8gcmVzb2x2ZXIgdG8gcnVuIGluIG9yZGVyIHRvIHJlc29sdmUgdGhlIHByb21pc2UgYXQgbGVhc3Qgb25jZS5cbiAgLy8gVGhpcyBpcyBwcmltYXJpbHkgdG8gc3VwcG9ydCB0aGUgdGVzdCBydW5uZXJzIHVzZSBjYXNlIHdoZXJlIGFuIGV4cHJlc3Npb25cbiAgLy8gaXMgcmV0dXJuZWQgZnJvbSB0aGUgdGVzdCBhbmQgdGhlIHJ1bm5lciB3aWxsIGF0dGFjaCBpdHNlbGYgaGVyZS5cbiAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXyAmJiB0aGlzLnZhbHVlICE9PSB0aGlzLl9fR1VBUkRfXykge1xuICAgIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICAgIHJlc29sdmVyKHRoaXMudmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5jYXRjaCA9IGZ1bmN0aW9uIChlYikge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIGViKTtcbn07XG5cbi8vIERpc3BhdGNoIGV2ZXJ5b25lIHdobyB3YXMgd2FpdGluZyB0byBiZSBub3RpZmllZCBvZiB0aGUgb3V0Y29tZVxucHJvdG8uZGlzcGF0Y2hSZXN1bHQgPSBmdW5jdGlvbiAocmVzb2x2ZWQsIHJlc3VsdCkge1xuICBpZiAoMCA9PT0gdGhpcy5fX3RoZW5zX18ubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR2VuZXJhdGUgYSBuaWNlIGVycm9yIGZvciB0aGUgZmFpbHVyZVxuICB2YXIgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICBhY3R1YWwgPSB0aGlzLmJ1aWxkRXJyb3IocmVzb2x2ZWQsIHByb3RvLmRpc3BhdGNoUmVzdWx0KTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb21pc2UgdGhhdCByZWplY3RzIGltbWVkaWF0ZWx5IHdpdGggYSBmYWlsdXJlIGVycm9yIG9yXG4gIC8vIHJlc29sdmVzIHdpdGggdGhlIGV4cHJlc3Npb24gc3ViamVjdC5cbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gQ2FsbGluZyByZXNvbHZlKCkgd2l0aCBhIHByb21pc2Ugd2lsbCBhdHRhY2ggaXRzZWxmIHRvIHRoZSBwcm9taXNlXG4gICAgLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGl0IGFzIGEgc2ltcGxlIHZhbHVlLiBUbyBhdm9pZCB0aGF0IHdlIGRldGVjdCB0aGVcbiAgICAvLyBjYXNlIGFuZCB3cmFwIGl0IGluIGFuIGFycmF5LlxuICAgIGlmIChhY3R1YWwgJiYgdHlwZW9mIGFjdHVhbC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhY3R1YWwgPSBbXG4gICAgICAgICdBc3M6IFZhbHVlIHdyYXBwZWQgaW4gYW4gYXJyYXkgc2luY2UgaXQgbG9va3MgbGlrZSBhIFByb21pc2UnLFxuICAgICAgICBhY3R1YWxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgKHJlc3VsdCA/IHJlc29sdmUgOiByZWplY3QpKCBhY3R1YWwgKTtcbiAgfSk7XG5cbiAgLy8gQXR0YWNoIGFsbCB0aGUgcmVnaXN0ZXJlZCB0aGVucyB0byB0aGUgcHJvbWlzZSBzbyB0aGV5IGdldCBub3RpZmllZFxuICBfLmZvckVhY2godGhpcy5fX3RoZW5zX18sIGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuLmFwcGx5KHByb21pc2UsIGNhbGxiYWNrcyk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZHVtcENoYWluIChyZXNvbHZlZCwgaW5kZW50KSB7XG4gIHZhciByZXN1bHQgPSAnJztcblxuICBpbmRlbnQgPSBpbmRlbnQgfHwgJyc7XG5cbiAgcmVzb2x2ZWQuZm9yRWFjaChmdW5jdGlvbiAoZXhwLCBpZHgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShleHApKSB7XG4gICAgICByZXN1bHQgKz0gZHVtcENoYWluKGV4cCwgaW5kZW50ICsgJyAgJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV4cC5yZXN1bHQpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzJtUGFzc2VkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzFtRmFpbGVkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgIGlmIChpZHggPT09IHJlc29sdmVkLmxlbmd0aCAtIDEpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMG0gJyArIGV4cC5mYWlsdXJlICsgJ1xcbic7XG4gICAgfVxuXG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuLy8gQnVpbGRzIGFuIEFzc0Vycm9yIGZvciB0aGUgY3VycmVudCBleHByZXNzaW9uLiBJdCBtYWtlcyBhIGNvdXBsZSBvZlxuLy8gYXNzdW1wdGlvbnMsIGZvciBpbnN0YW5jZSB0aGUgLl9fb2Zmc2V0X18gbXVzdCBiZSBwbGFjZWQganVzdCBhZnRlciB0aGVcbi8vIGV4cGVjdGF0aW9uIHRoYXQgcHJvZHVjZWQgdGhlIGZhaWx1cmUgb2YgdGhlIGNoYWluLlxucHJvdG8uYnVpbGRFcnJvciA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgc3NmKSB7XG5cbiAgdmFyIGVycm9yID0gdGhpcy5fX2Rlc2NyaXB0aW9uX18gKyAnXFxuXFxuJztcblxuICBleHAgPSByZXNvbHZlZFsgcmVzb2x2ZWQubGVuZ3RoIC0gMSBdO1xuICBlcnJvciArPSBkdW1wQ2hhaW4ocmVzb2x2ZWQpO1xuXG4gIGlmICghdXRpbC5kb0NvbG9ycygpKSB7XG4gICAgZXJyb3IgPSB1dGlsLnVuYW5zaShlcnJvcik7XG4gIH1cblxuICAvLyBUT0RPOiBzaG93RGlmZiBzaG91bGQgYmUgdXNlZCBvbmx5IHdoZW4gaXQgbWFrZXMgc2Vuc2UgcGVyaGFwc1xuICAvLyAgICAgICB3ZSBjYW4gcGFzcyBudWxsL3VuZGVmaW5lZCBhbmQgbGV0IEFzc0Vycm9yIGRldGVjdCB3aGVuIGl0XG4gIC8vICAgICAgIG1ha2VzIHNlbnNlLlxuXG4gIHZhciBleHBlY3RlZCA9IGV4cC5leHBlY3RlZDtcbiAgLy8gTW9jaGEgd2lsbCB0cnkgdG8ganNvbmlmeSB0aGUgZXhwZWN0ZWQgdmFsdWUsIGp1c3QgaWdub3JlIGlmIGl0J3MgYSBmdW5jdGlvblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdmFyIGluc3QgPSBuZXcgQXNzRXJyb3IoZXJyb3IsIHNzZiB8fCBhcmd1bWVudHMuY2FsbGVlIHx8IHByb3RvLmJ1aWxkRXJyb3IpO1xuICBpbnN0LnNob3dEaWZmID0gZmFsc2U7XG4gIGluc3QuYWN0dWFsID0gbnVsbDtcbiAgaW5zdC5leHBlY3RlZCA9IG51bGw7XG4gIHJldHVybiBpbnN0O1xufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIFRoZSByZXN1bHQgaXMgYWx3YXlzIGFcbi8vIGJvb2xlYW4gaW5kaWNhdGluZyB0aGUgb3V0Y29tZSBvciBhbiB1bmRlZmluZWQgdG8gc2lnbmFsIHRoYXQgaXQgcmVhY2hlZFxuLy8gYW4gYXN5bmNocm9ub3VzIGZsb3cuXG5wcm90by50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBSZXNvbHZlIHRoZSBjaGFpbiBzdGFydGluZyBmcm9tIHJvb3RcbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyBQZXJmb3JtcyB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhaW4gYnV0IGFkZGl0aW9uYWxseSB3aWxsIHJhaXNlIGFuIGVycm9yXG4vLyBpZiBpdCBmYWlscyB0byBjb21wbGV0ZS4gV2hlbiB0aGUgZXhwcmVzc2lvbiByZXNvbHZlcyBhcyB1bmRlZmluZWQgKGFzeW5jKVxuLy8gaXQnbGwgYmUgYXV0b21hdGljYWxseSBlbmFibGUgaXRzIGRlZmVycmVkIGZsYWcuXG4vLyBUaGUgYHNzZmAgc3RhbmRzIGZvciBTdGFja1RyYWNlRnVuY3Rpb24sIGEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBmdW5jdGlvblxuLy8gdG8gc2hvdyBvbiB0aGUgc3RhY2sgdHJhY2UuXG5wcm90by5hc3NlcnQgPSBmdW5jdGlvbiAoYWN0dWFsLCBzc2YpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgLy8gSnVzdCBpZ25vcmUgaWYgdGhlIGFjdHVhbCB2YWx1ZSBpcyBub3QgcHJlc2VudCB5ZXRcbiAgLy8gVE9ETzogU2hhbGwgaXQgcHJvZHVjZSBhbiBlcnJvcj9cbiAgaWYgKGFjdHVhbCA9PT0gdGhpcy5fX0dVQVJEX18pIHJldHVybiB0aGlzO1xuXG4gIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICB2YXIgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcblxuICAvLyBJdCBmYWlsZWQgc28gcmVwb3J0IGl0IHdpdGggYSBuaWNlIGVycm9yXG4gIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgdGhpcy5idWlsZEVycm9yKHJlc29sdmVyLnJlc29sdmVkLCBzc2YgfHwgdGhpcy5hc3NlcnQpO1xuICB9XG5cbiAgLy8gQ29udmVydCB0aGUgZXhwcmVzc2lvbiBpbnRvIGEgZGVmZXJyZWQgaWYgYW4gYXN5bmMgZXhwZWN0aW9uIHdhcyBmb3VuZFxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIEFzc2VydHMgdGhlIHByb3ZpZGVkIHZhbHVlIGFuZCBpZiBzdWNjZXNzZnVsIHJldHVybnMgdGhlIG9yaWdpbmFsXG4vLyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBjaGFpbiBpbnN0YW5jZS5cbnByb3RvLnRocm91Z2ggPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHRoaXMuYXNzZXJ0KGFjdHVhbCwgcHJvdG8udGhyb3VnaCk7XG4gIHJldHVybiBhY3R1YWw7XG59O1xuXG4vLyBFdmFsdWF0ZXMgdGhlIGV4cHJlc3Npb24gY2hhaW4gcmVwb3J0aW5nIHRoZSBsYXN0IG11dGF0ZWQgdmFsdWUgc2VlbiBpblxuLy8gaXQuIElmIHRoZSBleHByZXNzaW9uIGRvZXMgbm90IGNvbXBsZXRlIGl0J2xsIHJldHVybiB1bmRlZmluZWQuXG5wcm90by5yZXN1bHQgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHZhciByZXN1bHQ7XG5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB0aGlzLnRhcChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgIH0pLnRlc3QoYWN0dWFsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBSZW1vdmUgdGhlIC50YXAgZnJvbSB0aGUgY2hhaW5cbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fX2Rlc2NyaXB0aW9uX18pIHtcbiAgICByZXR1cm4gdGhpcy5fX2Rlc2NyaXB0aW9uX187XG4gIH1cblxuICB2YXIgZGVzY3MgPVxuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfX1xuICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZGVzY3JpcHRpb24gfSlcbiAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmRlc2NyaXB0aW9uIH0pO1xuXG4gIGlmIChkZXNjcy5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuICcoJyArIGRlc2NzLmpvaW4oJywgJykgKyAnKSc7XG4gIH0gZWxzZSBpZiAoZGVzY3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGRlc2NzWzBdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnPEFzc0NoYWluPic7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDaGFpbjtcbiJdfQ==
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
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9leHBlY3RhdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG52YXIgTWF0Y2hlciA9IHJlcXVpcmUoJy4vbWF0Y2hlcicpO1xuXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3V0aWwnKS50ZW1wbGF0ZTtcblxuXG4vLyBFeHBlY3RhdGlvbiByZXByZXNlbnRzIGFuIGluc3RhbnRpYXRlZCBNYXRjaGVyIGFscmVhZHkgY29uZmlndXJlZCB3aXRoXG4vLyBhbnkgYWRkaXRpb25hbCBhcmd1bWVudHMuXG5mdW5jdGlvbiBFeHBlY3RhdGlvbiAobWF0Y2hlciwgYXJncykge1xuICAvLyBHZXQgdGhlIG1hdGNoZXIgY29uZmlndXJhdGlvbiBpbnRvIHRoaXMgaW5zdGFuY2VcbiAgbWF0Y2hlci5hc3NpZ24odGhpcyk7XG5cbiAgLy8gU3VwcG9ydCBiZWluZyBnaXZlbiBhbiBgYXJndW1lbnRzYCBvYmplY3RcbiAgdGhpcy5hcmdzID0gXy50b0FycmF5KGFyZ3MpO1xuICB0aGlzLmFjdHVhbCA9IHVuZGVmaW5lZDtcbn1cblxuLy8gSW5oZXJpdCB0aGUgcHJvdG90eXBlIGZyb20gTWF0Y2hlclxudmFyIHByb3RvID0gRXhwZWN0YXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShNYXRjaGVyLnByb3RvdHlwZSk7XG5wcm90by5jb25zdHJ1Y3RvciA9IEV4cGVjdGF0aW9uO1xuXG4vLyBHZW5lcmF0ZSBnZXR0ZXIgZm9yIGAuZXhwZWN0ZWRgIChhbiBhbGlhcyBmb3IgYXJnc1swXSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2V4cGVjdGVkJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hcmdzWzBdO1xuICB9LFxuICAvLyBIYWNrOiBhbGxvdyBpdCB0byBiZSBvdmVycmlkZW4gb24gdGhlIGluc3RhbmNlXG4gIHNldDogZnVuY3Rpb24gKHYpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2V4cGVjdGVkJywge1xuICAgICAgdmFsdWU6IHZcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIEdlbmVyYXRlIGdldHRlcnMgZm9yIHRoZSBmaXJzdCA1IGFyZ3VtZW50cyBhcyBhcmcxLCBhcmcyLCAuLi5cbl8udGltZXMoNSwgZnVuY3Rpb24gKGkpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnYXJnJyArIChpICsgMSksIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmFyZ3NbaV07XG4gICAgfVxuICB9KTtcbn0pO1xuXG4vLyBDb21wdXRlIHRoZSBkZXNjcmlwdGlvbiBtZXNzYWdlIGZvciB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZXhwZWN0YXRpb25cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2Rlc2NyaXB0aW9uJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdGhpcy5kZXNjID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZXNjKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcGxhdGUodGhpcy5kZXNjLCB0aGlzKTtcbiAgfVxufSk7XG5cbi8vIENvbXB1dGUgdGhlIGZhaWx1cmUgbWVzc2FnZSBmb3IgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGV4cGVjdGF0aW9uXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdmYWlsdXJlJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuZmFpbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuZmFpbCh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlKHRoaXMuZmFpbCwgdGhpcyk7XG4gIH1cbn0pO1xuXG4vLyBIZWxwZXIgdG8gbXV0YXRlIHRoZSB2YWx1ZSB1bmRlciB0ZXN0XG5FeHBlY3RhdGlvbi5wcm90b3R5cGUubXV0YXRlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIodmFsdWUpO1xuICB9O1xufTtcblxuLy8gUmVzb2x2aW5nIGNhbiBvdmVycmlkZSB0aGUgZXhwZWN0YXRpb24gc3RhdGUsIGlmIHRoYXQncyBub3QgZGVzaXJhYmxlIG1ha2Vcbi8vIHN1cmUgdGhhdCB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgaW4gYSBuZXcgY29udGV4dC5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncywgcmVzdWx0O1xuXG4gIC8vIEV4ZWN1dGUgdGhlIG1hdGNoZXIgdGVzdCBub3cgdGhhdCBldmVyeXRoaW5nIGlzIHNldFxuICBhcmdzID0gW3RoaXMuYWN0dWFsXS5jb25jYXQodGhpcy5hcmdzKTtcbiAgcmVzdWx0ID0gdGhpcy50ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuXG4gIC8vIFJldHVybmluZyBhIHN0cmluZyBvdmVycmlkZXMgdGhlIG1pc21hdGNoIGRlc2NyaXB0aW9uXG4gIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuZmFpbCA9IHJlc3VsdDtcbiAgICByZXN1bHQgPSBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRlc2NyaXB0aW9uO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cGVjdGF0aW9uO1xuIl19
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
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tYXRjaGVycy9jb29yZGluYXRpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cbi8vIEdpdmVuIHRoZSBhcmd1bWVudHMgd2l0aCB0aGUgYnJhbmNoZXMgbWFrZSBzdXJlIHRoZXkgYXJlIGFsbCBleHByZXNzaW9uc1xuZnVuY3Rpb24gd3JhcEFyZ3MgKGFyZ3MpIHtcbiAgcmV0dXJuIF8udG9BcnJheShhcmdzKS5zbGljZSgxKS5tYXAoZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgIHJldHVybiBhc3MuQ2hhaW4uaXNDaGFpbihicmFuY2gpID8gYnJhbmNoIDogYXNzLmVxbChicmFuY2gpO1xuICB9KTtcbn1cblxuYXNzLnJlZ2lzdGVyKHtcblxuICBhbmQ6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgZXhwZWN0YXRpb24gZnJvbSB0d28gb3IgbW9yZSBleHByZXNzaW9ucywgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGFsbCB0aGUgZXhwcmVzc2lvbnMgdGhhdCBmb3JtIGl0IGRvIGluZGVlZCBzdWNjZWVkLicsXG4gICAgICAnTm90ZTogZXZhbHVhdGlvbiB3aWxsIHN0b3AgYXMgc29vbiBhcyBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIGZhaWxzLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgQU5EIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gd3JhcEFyZ3MoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciByZXN1bHQgPSBfLmV2ZXJ5KGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8ga2VlcCBpdGVyYXRpbmdcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGFydGlhbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGV4cGVjdGF0aW9ucyBsYXRlciBpbiB0aGUgY2hhaW5cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIG9yOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgZXhwcmVzc2lvbnMsIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIGRvZXMuJyxcbiAgICAgICdOb3RlOiBldmFsdWF0aW9uIHdpbGwgc3RvcCBhcyBzb29uIGFzIG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgc3VjY2VlZHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBPUiBcIikgfScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IHdyYXBBcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgcmVzdWx0ID0gXy5zb21lKGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgfSksIF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIGtlZXAgaXRlcmF0aW5nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhcnRpYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFrZSBjYXJlIG9mIGFueSBleHBlY3RhdGlvbnMgbGF0ZXIgaW4gdGhlIGNoYWluXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICB4b3I6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgZXhwZWN0YXRpb24gZnJvbSB0d28gb3IgbW9yZSBleHByZXNzaW9ucywgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgZG9lcyBidXQgbm90IGFsbCBvZiB0aGVtLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgWE9SIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gd3JhcEFyZ3MoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciBva3MgPSAwO1xuICAgICAgICB2YXIga29zID0gMDtcbiAgICAgICAgXy5mb3JFYWNoKGJyYW5jaGVzLCBmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgICAgICAgdmFyIHBhcnRpYWwgPSBicmFuY2gudGVzdChhY3R1YWwpO1xuICAgICAgICAgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1bmRlZnMgKz0gMTtcbiAgICAgICAgICAgIGJyYW5jaC50aGVuKF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChrb3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG9rcyArPSAxO1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwsIG9rcyA+IDAgJiYga29zID4gMCA/IHVuZGVmaW5lZCA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksIF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChva3MgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGtvcyArPSAxO1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwsIG9rcyA+IDAgJiYga29zID4gMCA/IHVuZGVmaW5lZCA6IGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0aWFsID09PSB0cnVlKSB7XG4gICAgICAgICAgICBva3MgKz0gMTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRpYWwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBrb3MgKz0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9rcyA+IDAgJiYga29zID4gMCA/IHJlc29sdmVyKGFjdHVhbCkgOiBmYWxzZTtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuIl19
},{"../ass":1}],7:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
      return actual != null;
    }
  },
  // Check if the value is empty
  empty: {
    help: 'Checks if the value is empty (or has a length of 0).',
    desc: 'is empty',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual == null || actual.length === 0;
    }
  },
  nempty: {
    aliases: [ 'nonEmpty' ],
    help: 'Checks if the value is not empty (or has a length greater than 0).',
    desc: 'is not empty',
    fail: 'was ${ actual }',
    test: function (actual) {
      return actual != null && actual.length > 0;
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

        if (actual == null) {
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
      delta = delta == null ? 0.1 : delta;

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
        return actual == true ? true : 'was {{actual}}';
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
        return actual == false ? true : 'was {{actual}}';
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
        if (expected == null) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tYXRjaGVycy9jb3JlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8vIFNldCBvZiBkZWZhdWx0IG1hdGNoZXJzXG5hc3MucmVnaXN0ZXIoe1xuICAvLyBUT0RPOiBNb3ZlIHRoaXMgdG8gdGhlIENoYWluIHByb3RvdHlwZVxuICBkZXNjOiB7XG4gICAgaGVscDogJ1Byb3ZpZGUgYSBjdXN0b20gZGVzY3JpcHRpb24gZm9yIHJlcG9ydGVkIGZhaWx1cmVzJyxcbiAgICBkZXNjOiBudWxsLCAgLy8gU2tpcCBpdCBmcm9tIHJlcG9ydHNcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBkZXNjKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgdGhlIGRlc2NyaXB0aW9uIHdvbid0IGJlIHNldCB1bnRpbCB0aGUgY2hhaW4gaXMgcmVzb2x2ZWQsXG4gICAgICAvLyBhdCBsZWFzdCBvbmNlLCByZWFjaGluZyB0aGlzIGV4cGVjdGF0aW9uLlxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXNvbHZlci5jaGFpbi5fX2Rlc2NyaXB0aW9uX18gPSBkZXNjO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIC8vIElnbm9yZWQgbWF0Y2hlcnNcbiAgdG86IHtcbiAgICBhbGlhc2VzOiBbICdhJywgJ2FuJywgJ2JlJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdKdXN0IHNvbWUgc3ludGF4IHN1Z2FyIHRvIG1ha2UgdGhlIGV4cGVjdGF0aW9ucyBlYXNpZXIgb24gdGhlIGV5ZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgbWFyazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJbmNyZWFzZXMgdGhlIGdsb2JhbCBgYXNzLm1hcmtzYCBjb3VudGVyIGV2ZXJ5IHRpbWUgaXQgZ2V0cycsXG4gICAgICAnZXZhbHVhdGVkIGFzIHBhcnQgb2YgYW4gZXhwcmVzc2lvbi4gVXNlIGl0IHRvIHZlcmlmeSB0aGF0IHRoZScsXG4gICAgICAncHJlY2VkaW5nIGV4cGVjdGF0aW9ucyBhcmUgYWN0dWFsbHkgYmVpbmcgZXhlY3V0ZWQuJyxcbiAgICAgICdBbiBlYXN5IHdheSB0byBzdXBwb3J0IHRoaXMgd2hlbiB1c2luZyBhIHRlc3QgcnVubmVyIGlzIHRvIHJlc2V0JyxcbiAgICAgICd0aGUgY291bnRlciBieSBjYWxsaW5nIGBhc3MubWFya3MoKWAgb24gYSBiZWZvcmVFYWNoIGhvb2sgYW5kJyxcbiAgICAgICd0aGVuIHZlcmlmeSBhdCB0aGUgZW5kIG9mIHRlc3Qgd2l0aCBgYXNzLm1hcmtzKE4pYCAod2hlcmUgTiBpcycsXG4gICAgICAndGhlIG51bWJlciBvZiBtYXJrcyB5b3UgZXhwZWN0ZWQpLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgYXNzLm1hcmtzLmNvdW50ZXIgKz0gMTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICAvLyBKdXN0IGFsbG93IGFueXRoaW5nIDopXG4gIGFueToge1xuICAgIGhlbHA6ICdBbGxvd3MgYW55IHZhbHVlIHdpdGhvdXQgdGVzdGluZyBpdC4nLFxuICAgIGRlc2M6ICdpcyBhbnl0aGluZycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICAvLyBBbnl0aGluZyB0aGF0IGlzbid0IG51bGwgb3IgdW5kZWZpbmVkXG4gIGRlZmluZWQ6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgbnVsbCBvciB1bmRlZmluZWQuJyxcbiAgICBkZXNjOiAnaXMgZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAhPSBudWxsO1xuICAgIH1cbiAgfSxcbiAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGVtcHR5XG4gIGVtcHR5OiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgZW1wdHkgKG9yIGhhcyBhIGxlbmd0aCBvZiAwKS4nLFxuICAgIGRlc2M6ICdpcyBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA9PSBudWxsIHx8IGFjdHVhbC5sZW5ndGggPT09IDA7XG4gICAgfVxuICB9LFxuICBuZW1wdHk6IHtcbiAgICBhbGlhc2VzOiBbICdub25FbXB0eScgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgZW1wdHkgKG9yIGhhcyBhIGxlbmd0aCBncmVhdGVyIHRoYW4gMCkuJyxcbiAgICBkZXNjOiAnaXMgbm90IGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9IG51bGwgJiYgYWN0dWFsLmxlbmd0aCA+IDA7XG4gICAgfVxuICB9LFxuICB0cnV0aHk6IHtcbiAgICBhbGlhc2VzOiBbICd0cnVpc2gnIF0sXG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgdHJ1dGh5IChub3QgdW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyB0cnV0aHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbC5sZW5ndGggPT09ICdudW1iZXInID8gYWN0dWFsLmxlbmd0aCA+IDAgOiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZmFsc3k6IHtcbiAgICBoZWxwOiAnVGhlIHZhbHVlIHNob3VsZCBiZSBmYWxzeSAodW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyBmYWxzeScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwubGVuZ3RoID09PSAwIDogZmFsc2U7XG4gICAgfVxuICB9LFxuXG4gIC8vIE5lZ2F0aW9uXG4gIG5vdDoge1xuICAgIGFsaWFzZXM6IFsgJ25vJywgJ05PJywgJ05PVCcgXSxcbiAgICBoZWxwOiAnTmVnYXRlcyB0aGUgcmVzdWx0IGZvciB0aGUgcmVzdCBvZiB0aGUgZXhwcmVzc2lvbi4nLFxuICAgIGRlc2M6ICdOb3QhJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmVyLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgICAgIHJldHVybiAhZmluYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgaXM6IHtcbiAgICBhbGlhc2VzOiBbICdlcXVhbCcsICdlcXVhbHMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBzdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgICAgJ05vdGU6IGlmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIGNoYWluIGV4cHJlc3Npb24gaXRcXCdsbCBiZSB0ZXN0ZWQgaW5zdGVhZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gc3RyaWN0bHkgZXF1YWwge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAvLyB0aGlzIGlzIGEgYml0IGNvbnRyaXZlZCBidXQgaXQgbWFrZXMgZm9yIHNvbWUgbmljZSBzeW50YXggdG8gYmUgYWJsZSB0b1xuICAgICAgLy8gdXNlIC5pcyBmb3IgcGFzc2luZyBpbiBleHBlY3RhdGlvbnNcbiAgICAgIGlmIChhc3MuQ2hhaW4uaXNDaGFpbihleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjdHVhbCA9PT0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuICBlcToge1xuICAgIGFsaWFzZXM6IFsgJ2VxbCcsICdlcWxzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgZGVlcCBub24tc3RyaWN0IGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlIGFuZCBpdHMgZXhwZWN0ZWQuJyxcbiAgICAgICdJdCB1bmRlcnN0YW5kcyBhc3MgZXhwcmVzc2lvbnMgc28geW91IGNhbiBjb21iaW5lIHRoZW0gYXQgd2lsbCBpbiB0aGUnLFxuICAgICAgJ2V4cGVjdGVkIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBlcXVhbCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBfLmlzRXF1YWwoYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuXG4gIG1hdGNoOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1RyaWVzIHRvIG1hdGNoIHRoZSBzdWJqZWN0IGFnYWluc3QgdGhlIGV4cGVjdGVkIHZhbHVlIHdoaWNoIGNhbiBiZSBlaXRoZXInLFxuICAgICAgJ2EgZnVuY3Rpb24sIGFuIGFzcyBleHByZXNzaW9uLCBhbiBvYmplY3Qgd2l0aCBhIC50ZXN0KCkgZnVuY3Rpb24gKGZvciAnLFxuICAgICAgJ2luc3RhbmNlIGEgUmVnRXhwKSBvciBhIHBsYWluIG9iamVjdCB0byBwYXJ0aWFsbHkgbWF0Y2ggYWdhaW5zdCB0aGUgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIG1hdGNoIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuXG4gICAgICBpZiAodHlwZW9mIGV4cGVjdGVkLnRlc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICEhZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGV4cGVjdGVkKSB8fCBfLmlzQXJyYXkoZXhwZWN0ZWQpIHx8IF8uaXNBcmd1bWVudHMoZXhwZWN0ZWQpKSB7XG5cbiAgICAgICAgaWYgKGFjdHVhbCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3VwcG9ydCBwYXNzaW5nIGBbLCdmb28nXWAgdG8gbWVhbiBgW2Fzcy5hbnksICdmb28nXWBcbiAgICAgICAgaWYgKF8uaXNBcnJheShleHBlY3RlZCkgfHwgXy5pc0FyZ3VtZW50cyhleHBlY3RlZCkpIHtcbiAgICAgICAgICBleHBlY3RlZCA9IF8ubWFwKGV4cGVjdGVkLCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2ID09PSAndW5kZWZpbmVkJyA/IGFzcy5hbnkgOiB2O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogSWRlYWxseSB3ZSBzaG91bGQgXCJmb3JrXCIgdGhlIHJlc29sdmVyIHNvIHdlIGNhbiBzdXBwb3J0XG4gICAgICAgIC8vICAgICAgIGFzeW5jIHRlc3RzIGFuZCBhbHNvIHByb3ZpZGUgYmV0dGVyIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgICAgIC8vICAgICAgIFVuZm9ydHVuYXRlbHkgdGhlIGN1cnJlbnQgZm9ya2luZyBtZWNoYW5pc20gZG9lc24ndCB3b3JrXG4gICAgICAgIC8vICAgICAgIGZvciB0aGlzIHVzZSBjYXNlIHNpbmNlIHdlIG5lZWQgdG8gY3JlYXRlIG5ldyBjaGFpbnMgZm9yXG4gICAgICAgIC8vICAgICAgIGVhY2ggZXhwZWN0ZWQga2V5LlxuICAgICAgICB2YXIgZmFpbHVyZSA9IHRydWU7XG4gICAgICAgIF8oZXhwZWN0ZWQpLmV2ZXJ5KGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgaWYgKCFfLmhhcyhhY3R1YWwsIGtleSkpIHtcbiAgICAgICAgICAgIGZhaWx1cmUgPSAna2V5IFwiJyArIGtleSArICdcIiBub3QgZm91bmQgaW4ge3thY3R1YWx9fSc7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFfLmlzRXF1YWwoYWN0dWFsW2tleV0sIHZhbHVlKSkge1xuICAgICAgICAgICAgZmFpbHVyZSA9ICdrZXkgXCInICsga2V5ICsgJ1wiIGRvZXMgbm90IG1hdGNoIHt7YWN0dWFsW1wiJyArIGtleSArICdcIl19fSc7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmYWlsdXJlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAnZXhwZWN0ZWQgaXMgbm90IGEgZnVuY3Rpb24gYW5kIGRvZXMgbm90IGhhdmUgYSAudGVzdCBtZXRob2QnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gISFleHBlY3RlZChhY3R1YWwpO1xuICAgIH1cbiAgfSxcblxuICBhYm92ZToge1xuICAgIGFsaWFzZXM6IFsgJ2d0JywgJ21vcmVUaGFuJywgJ2dyZWF0ZXJUaGFuJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGhpZ2hlciB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBtb3JlIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID4gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGJlbG93OiB7XG4gICAgYWxpYXNlczogWyAnbHQnLCAnbGVzc1RoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbG93ZXIgdGhhIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDwgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlT3JFcXVhbDoge1xuICAgIGFsaWFzZXM6IFsgJ2xlYXN0JywgJ2F0TGVhc3QnLCAnZ3RlJywgJ21vcmVUaGFuT3JFcXVhbCcsICdncmVhdGVyVGhhbk9yRXF1YWwnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3dPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnbW9zdCcsICdhdE1vc3QnLCAnbHRlJywgJ2xlc3NUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciBvciBlcXVhbCB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA8PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgY2xvc2U6IHtcbiAgICBhbGlhc2VzOiBbICdjbG9zZVRvJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGNsb3NlIHRvIHRoZSBleHBlY3RlZCBiYXNlZCBvbiBhIGdpdmVuIGRlbHRhLicsXG4gICAgICAnVGhlIGRlZmF1bHQgZGVsdGEgaXMgMC4xIHNvIHRoZSB2YWx1ZSAzLjU1IGlzIGNsb3NlIHRvIGFueSB2YWx1ZSBiZXR3ZWVuJyxcbiAgICAgICczLjQ1IGFuZCAzLjY1IChib3RoIGluY2x1c2l2ZSkuJyxcbiAgICAgICdTdHJpbmcgdmFsdWVzIGFyZSBhbHNvIHN1cHBvcnRlZCBieSBjb21wdXRpbmcgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlbScsXG4gICAgICAndXNpbmcgdGhlIFNpZnQ0IGFsZ29yaXRobS4gRm9yIHN0cmluZyB2YWx1ZXMgdGhlIGRlbHRhIGlzIGludGVycHJldGVkIGFzJyxcbiAgICAgICdhIHBlcmNlbnRhZ2UgKGllOiAwLjI1IGlzIDI1JSkuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGNsb3NlIHRvIHt7IGV4cGVjdGVkIH19JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIGRlbHRhKSB7XG4gICAgICBkZWx0YSA9IGRlbHRhID09IG51bGwgPyAwLjEgOiBkZWx0YTtcblxuICAgICAgLy8gU3VwcG9ydCBzdHJpbmdzIGJ5IGNvbXB1dGluZyB0aGVpciBkaXN0YW5jZVxuICAgICAgaWYgKF8uaXNTdHJpbmcoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICB2YXIgZGlmZiA9IHV0aWwuc2lmdDQoYWN0dWFsLCBleHBlY3RlZCwgMykgLyBNYXRoLm1heChhY3R1YWwubGVuZ3RoLCBleHBlY3RlZC5sZW5ndGgpO1xuICAgICAgICByZXR1cm4gZGlmZiA8PSBkZWx0YTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZCAtIGRlbHRhICYmIGFjdHVhbCA8PSBleHBlY3RlZCArIGRlbHRhO1xuICAgIH1cbiAgfSxcblxuICBpbnN0YW5jZW9mOiB7XG4gICAgYWxpYXNlczogWyAnaW5zdGFuY2VPZicsICdpbnN0YW5jZScsICdpc2EnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yLicsXG4gICAgICAnV2hlbiB0aGUgZXhwZWN0ZWQgaXMgYSBzdHJpbmcgaXRcXCdsbCBhY3R1YWxseSB1c2UgYSBgdHlwZW9mYCcsXG4gICAgICAnY29tcGFyaXNvbi4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYW4gaW5zdGFuY2Ugb2Yge3tleHBlY3RlZH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsID09PSBleHBlY3RlZCA/IHRydWUgOiAnaGFkIHR5cGUge3sgdHlwZW9mIGFjdHVhbCB9fSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIHR5cGVvZjoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG9mIGEgc3BlY2lmaWMgdHlwZScsXG4gICAgZGVzYzogJ3RvIGhhdmUgdHlwZSB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICdoYWQgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIF8uaXNFcXVhbCh0eXBlb2YgYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuICBudW1iZXI6IHtcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgbnVtYmVyIChkaWZmZXJlbnQgb2YgTmFOKS4nLFxuICAgIGRlc2M6ICd0byBiZSBhIG51bWJlcicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNOdW1iZXIoYWN0dWFsKSAmJiAhaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGJvb2w6IHtcbiAgICBhbGlhc2VzOiBbICdib29sZWFuJyBdLFxuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBib29sZWFuLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgYm9vbGVhbicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNCb29sZWFuKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBzdHJpbmc6IHtcbiAgICBhbGlhc2VzOiBbICdzdHInIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZy4nLFxuICAgIGRlc2M6ICd0byBiZSBhIHN0cmluZycsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNTdHJpbmcoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG9iamVjdDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIG9mIHR5cGUgb2JqZWN0LicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIG9iamVjdCcsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHBsYWluT2JqZWN0OiB7XG4gICAgYWxpYXNlczogWyAncGxhaW4nLCAnb2JqJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGUgT2JqZWN0IGNvbnN0cnVjdG9yLicsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUGxhaW5PYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGFycmF5OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYW4gQXJyYXkuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gQXJyYXknLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzQXJyYXkoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGZ1bmN0aW9uOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBGdW5jdGlvbi4nLFxuICAgIGRlc2M6ICd0byBiZSBhIEZ1bmN0aW9uJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICByZWdleHA6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIFJlZ0V4cCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgUmVnRXhwJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1JlZ0V4cChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZGF0ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRGF0ZScsXG4gICAgZGVzYzogJ3RvIGJlIGEgRGF0ZScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNEYXRlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBlbGVtZW50OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBET00gZWxlbWVudCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgRE9NIGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRWxlbWVudChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZXJyb3I6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBlcnJvciAob3IgbG9va3MgbGlrZSBpdCknLFxuICAgIGRlc2M6ICd0byBiZSBhbiBFcnJvcicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5uYW1lKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5tZXNzYWdlKTtcbiAgICB9XG4gIH0sXG5cbiAgdW5kZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgdW5kZWZpbmVkLicsXG4gICAgZGVzYzogJ3RvIGJlIHVuZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNVbmRlZmluZWQoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG51bGw6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBudWxsLicsXG4gICAgZGVzYzogJ3RvIGJlIG51bGwnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPT09IG51bGw7XG4gICAgfVxuICB9LFxuICBOYU46IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBOYU4uJyxcbiAgICBkZXNjOiAndG8gYmUgTmFOJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc051bWJlcihhY3R1YWwpKSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgdHJ1ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHRydWUnLFxuICAgIGRlc2M6ICd0byBiZSB0cnVlJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbCA9PSB0cnVlID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZmFsc2U6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBmYWxzZScsXG4gICAgZGVzYzogJ3RvIGJlIGZhbHNlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gYWN0dWFsID09IGZhbHNlID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICByYWlzZXM6IHtcbiAgICBhbGlhc2VzOiBbICd0aHJvd3MnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyB0aGF0IGV4ZWN1dGluZyB0aGUgdmFsdWUgcmVzdWx0cyBpbiBhbiBleGNlcHRpb24gYmVpbmcgdGhyb3duLicsXG4gICAgICAnVGhlIGNhcHR1cmVkIGV4Y2VwdGlvbiB2YWx1ZSBpcyB1c2VkIHRvIG11dGF0ZSB0aGUgc3ViamVjdCBmb3IgdGhlJyxcbiAgICAgICdmb2xsb3dpbmcgZXhwZWN0YXRpb25zLidcbiAgICBdLFxuICAgIGRlc2M6ICd0aHJvd3MgYW4gZXJyb3InLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNGdW5jdGlvbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgZnVuY3Rpb246IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhY3R1YWwoKTtcbiAgICAgICAgcmV0dXJuICdkaWQgbm90IHRocm93IGFueXRoaW5nJztcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGV4cGVjdGVkID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihleHBlY3RlZCkgJiYgZSBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzRXF1YWwoZSwgZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVnbWVudCB0aGUgZXhwZWN0YXRpb24gb2JqZWN0IHdpdGggYSBuZXcgdGVtcGxhdGUgdmFyaWFibGVcbiAgICAgICAgdGhpcy5leGNlcHRpb24gPSBlO1xuICAgICAgICByZXR1cm4gJ2dvdCB7eyBleGNlcHRpb24gfX0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBoYXM6IHtcbiAgICBhbGlhc2VzOiBbICdoYXZlJywgJ2NvbnRhaW4nLCAnY29udGFpbnMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgc29tZSBleHBlY3RlZCB2YWx1ZS4gSXQgdW5kZXJzdGFuZHMgZXhwZWN0ZWQnLFxuICAgICAgJ2NoYWluIGV4cHJlc3Npb25zIHNvIHRoaXMgc2VydmVzIGFzIHRoZSBlcXVpdmFsZW50IG9mIC5lcSBmb3IgcGFydGlhbCcsXG4gICAgICAnbWF0Y2hlcy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gY29udGFpbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYXJnMSAvKiwgLi4uICovKSB7XG5cbiAgICAgIC8vIGFsbG93IG11bHRpcGxlIGV4cGVjdGVkIHZhbHVlc1xuICAgICAgdmFyIGV4cGVjdGVkID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQubGVuZ3RoID09PSAxID8gZXhwZWN0ZWRbMF0gOiBleHBlY3RlZDtcblxuICAgICAgaWYgKCFfLmlzU3RyaW5nKGFjdHVhbCkgJiYgIV8uaXNBcnJheShhY3R1YWwpICYmICFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdnb3Qge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBfLmV2ZXJ5KGV4cGVjdGVkLCBmdW5jdGlvbiAoZXhwZWN0ZWQpIHtcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICAgIHJldHVybiAtMSAhPT0gYWN0dWFsLmluZGV4T2YoZXhwZWN0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8uaXNBcnJheShhY3R1YWwpKSB7XG4gICAgICAgICAgLy8gVE9ETzogSXNuJ3QgdGhlcmUgYW4gZWFzaWVyIHdheSB0byB0ZXN0IHRoaXMgdXNpbmcgbG9kYXNoIG9ubHk/XG4gICAgICAgICAgaWYgKCFhc3MuQ2hhaW4uaXNDaGFpbihleHBlY3RlZCkpIHtcbiAgICAgICAgICAgIGV4cGVjdGVkID0gYXNzLmVxKGV4cGVjdGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIC0xICE9PSBfLmZpbmRJbmRleChhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhY2s6IENvbXBhcmUgb2JqZWN0cyB3aXRoIC53aGVyZSBieSBmaWx0ZXJpbmcgYSB3cmFwcGVyIGFycmF5XG4gICAgICAgIHJldHVybiAxID09PSBfLndoZXJlKFthY3R1YWxdLCBleHBlY3RlZCkubGVuZ3RoO1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuICBoYXNPd246IHtcbiAgICBhbGlhc2VzOiBbICdoYXNLZXknLCAnaGFzSW5kZXgnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgb25lIG9yIG1vcmUgb3duIHByb3BlcnRpZXMgYXMgZGVmaW5lZCBieScsXG4gICAgICAndGhlIGdpdmVuIGFyZ3VtZW50cy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gaGF2ZSBvd24gcHJvcGVydHkgJHsgZXhwZWN0ZWQgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnd2FzIHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmZhaWwgPSAnb25seSBoYWQge3sgXy5rZXlzKGFjdHVhbCkgfX0nO1xuXG4gICAgICAvLyBUT0RPOiBPZmZlciBiZXR0ZXIgZmFpbHVyZSBtZXNzYWdlXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIF8uZXZlcnkoYXJncywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIF8uaGFzKGFjdHVhbCwgeCk7IH0pO1xuICAgIH1cbiAgfSxcblxuICBsb2c6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRHVtcHMgdGhlIHJlY2VpdmVkIHZhbHVlIHRvIHRoZSBjb25zb2xlLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgY29uc29sZS5sb2coJ1tBU1NdJywgYWN0dWFsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZHVtcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdEdW1wcyB0aGUgcmVjZWl2ZWQgdmFsdWUgdG8gdGhlIGNvbnNvbGUgYXBwbHlpbmcgdGhlIGdpdmVuIHRlbXBsYXRlLicsXG4gICAgICAnTm90ZTogVXNlICR7dGhpc30gdG8gaW50ZXJwb2xhdGUgdGhlIHdob2xlIHZhbHVlLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyN0ZW1wbGF0ZSdcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgdHBsKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gdXRpbC50ZW1wbGF0ZS5jYWxsKGFjdHVhbCwgdHBsLCBhY3R1YWwpO1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZGVidWdnZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGFsdHMgc2NyaXB0IGV4ZWN1dGlvbiBieSB0cmlnZ2VyaW5nIHRoZSBpbnRlcmFjdGl2ZSBkZWJ1Z2dlci4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIHRhcDoge1xuICAgIGFsaWFzZXM6IFsgJ2ZuJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDYWxscyB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gd2l0aCB0aGUgY3VycmVudCB2YWx1ZSBhcyBhcmd1bWVudC4nLFxuICAgICAgJ0lmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHNvbWV0aGluZyBkaWZmZXJlbnQgdG8gKnVuZGVmaW5lZCogdGhlJyxcbiAgICAgICdleHByZXNzaW9uIHdpbGwgZm9yayB0byBvcGVyYXRlIG9uIHRoZSByZXR1cm5lZCB2YWx1ZS4nLFxuICAgIF0sXG4gICAgZGVzYzogJ2NhbGwge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZm4oYWN0dWFsKTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgbm90aWZ5OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1NpbWlsYXIgdG8gLnRhcCgpIGJ1dCBpdCB3b25cXCd0IHBhc3MgdGhlIGN1cnJlbnQgdmFsdWUgYXMgYXJndW1lbnQsJyxcbiAgICAgICdpbnN0ZWFkIGl0IHdpbGwgYmUgcHJvdmlkZWQgYXMgdGhlIGB0aGlzYCBjb250ZXh0IHdoZW4gcGVyZm9ybWluZyB0aGUnLFxuICAgICAgJ2NhbGwuIFRoaXMgYWxsb3dzIGl0IHRvIGJlIHVzZWQgd2l0aCB0ZXN0IHJ1bm5lcnMgYGRvbmVgIHN0eWxlIGNhbGxiYWNrcy4nLFxuICAgICAgJ05vdGUgdGhhdCBpdCB3aWxsIG5laXRoZXIgbXV0YXRlIHRoZSB2YWx1ZSBldmVuIGlmIGl0IHJldHVybnMgc29tZXRoaW5nLidcbiAgICBdLFxuICAgIGRlc2M6ICdub3RpZnkge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICBmbi5jYWxsKGFjdHVhbCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgc2l6ZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiB0aGUgc2l6ZSBvZiB0aGUgY3VycmVudCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHNpemUnLFxuICAgIGZhaWw6ICdub3QgaGFzIGEgbGVuZ3RoOiB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGFjdHVhbCkgfHwgXy5pc0FycmF5KGFjdHVhbCkgfHwgXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShfLnNpemUoYWN0dWFsKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sXG4gIHByb3A6IHtcbiAgICBhbGlhc2VzOiBbICdrZXknLCAncHJvcGVydHknIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgdmFsdWUgcHJvcGVydGllcy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHByb3BlcnR5IHt7IGFyZzEgfX0nLFxuICAgIGZhaWw6ICd3YXMgbm90IGZvdW5kIG9uIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwga2V5KSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIGlmIChrZXkgaW4gYWN0dWFsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGFjdHVhbFtrZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMua2V5cyA9IFtdO1xuICAgICAgICBfLmZvckluKGFjdHVhbCwgZnVuY3Rpb24gKHYsIGspIHsgdGhpcy5rZXlzLnB1c2goayk7IH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gJ3dhcyBub3QgZm91bmQgaW4ga2V5cyB7eyBrZXlzIH19JztcbiAgICAgIH1cbiAgICAgIHJldHVybiAnZ290IHt7YWN0dWFsfX0nO1xuICAgIH1cbiAgfSxcbiAgYXQ6IHtcbiAgICBhbGlhc2VzOiBbICdpbmRleCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIGluZGV4ZWQgZWxlbWVudHMuIElmJyxcbiAgICAgICdtdWx0aXBsZSBpbmRleGVzIGFyZSBwcm92aWRlZCBhbiBhcnJheSBpcyBjb21wb3NlZCB3aXRoIHRoZW0uJyxcbiAgICAgICdOb3RlOiBJdCBzdXBwb3J0cyBuZWdhdGl2ZSBpbmRleGVzJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBpbmRleCAkeyBhcmdzLmpvaW4oXCIsIFwiKSB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBpbmRleCkge1xuICAgICAgaWYgKCFfLmlzQXJyYXkoYWN0dWFsKSAmJiAhXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnbm90IGFuIGFycmF5IG9yIGEgc3RyaW5nOiAke2FjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW5kZXhlcyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgdmFyIGVsZW1zID0gW107XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaWR4ID0gaW5kZXhlc1tpXTtcblxuICAgICAgICBpZHggPSBpZHggPCAwID8gYWN0dWFsLmxlbmd0aCArIGlkeCA6IGlkeDtcbiAgICAgICAgaWYgKGlkeCA8IDAgfHwgaWR4ID49IGFjdHVhbC5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gaWR4ICsgJyBvdXQgb2YgYm91bmRzIGZvciB7e2FjdHVhbH19JztcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1zLnB1c2goYWN0dWFsW2lkeF0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIGVsZW1zLmxlbmd0aCA9PT0gMSA/IGVsZW1zWzBdIDogZWxlbXNcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGtleXM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBpdHMgbGlzdCBvZiBvd24ga2V5cy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGtleXMnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5rZXlzKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICB2YWx1ZXM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBpdHMgbGlzdCBvZiB2YWx1ZXMnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHZhbHVlcycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnZhbHVlcyhhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzbGljZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdFeHRyYWN0cyBhIHBvcnRpb24gZnJvbSB0aGUgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3NsaWNlKHt7YWN0dWFsfX0sICR7YXJnMSB8fCAwfSknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHN0YXJ0LCBlbmQpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50b0FycmF5KGFjdHVhbCkuc2xpY2Uoc3RhcnQsIGVuZClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGZpbHRlcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIHRoZSBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0bycsXG4gICAgICAnb3BlcmF0ZSBvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCcsXG4gICAgICAndHJ1dGh5IGZvci4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlsdGVyJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5maWx0ZXIoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICByZWplY3Q6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlJyxcbiAgICAgICdvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCBmYWxzeScsXG4gICAgICAnZm9yICh0aGUgb3Bwb3NpdGUgb2YgLmZpbHRlcikuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3JlamVjdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucmVqZWN0KGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICB3aGVyZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdQZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbiBvZiBlYWNoIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uIHRvIHRoZSBnaXZlbicsXG4gICAgICAncHJvcGVydGllcyBvYmplY3QsIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgb2YgYWxsJyxcbiAgICAgICdlbGVtZW50cyB0aGF0IGhhdmUgZXF1aXZhbGVudCBwcm9wZXJ0eSB2YWx1ZXMuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3doZXJlJ1xuICAgIF0sXG4gICAgZGVzYzogJ3doZXJlIHt7YXJnMX19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wcykge1xuICAgICAgaWYgKCFfLmlzUGxhaW5PYmplY3QocHJvcHMpKSB7XG4gICAgICAgIHJldHVybiAncHJvcHMgaXMgbm90IGFuIG9iamVjdCc7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ud2hlcmUoYWN0dWFsLCBwcm9wcylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1hcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXAnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1hcChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWV0aG9kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSByZXN1bHQgb2YgaW52b2tpbmcgdGhlIG5hbWVkJyxcbiAgICAgICdtZXRob2Qgb24gdGhlIHN1YmplY3QgdmFsdWUuJyxcbiAgICBdLFxuICAgIGRlc2M6IFwibWV0aG9kIC4ke2FyZzF9KClcIixcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBtZXRob2QsIGFyZykge1xuICAgICAgaWYgKHR5cGVvZiBhY3R1YWxbbWV0aG9kXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gJyR7YXJnMX0gaXMgbm90IGEgbWV0aG9kIGluIHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDIpO1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBhY3R1YWxbbWV0aG9kXS5hcHBseShhY3R1YWwsIGFyZ3MpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBpbnZva2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIG1ldGhvZCBuYW1lZCBieSB0aGUgYXJndW1lbnQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjaW52b2tlJ1xuICAgIF0sXG4gICAgZGVzYzogXCJpbnZva2UgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZCwgYXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaW52b2tlLmFwcGx5KF8sIGFyZ3VtZW50cylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHBsdWNrOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHRoZSBvbmUgb2YgdGhlIHNwZWNpZmljIHByb3BlcnR5IGZvciBhbGwgZWxlbWVudHMnLFxuICAgICAgJ2luIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3BsdWNrJ1xuICAgIF0sXG4gICAgZGVzYzogJ3BsdWNrKCB7e2FyZzF9fSApJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucGx1Y2soYWN0dWFsLCBwcm9wKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgZmlyc3Q6IHtcbiAgICBhbGlhc2VzOiBbICdoZWFkJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ZpcnN0J1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBmaXJzdCBlbGVtZW50JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaGVhZChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgbGFzdDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2xhc3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubGFzdChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgcmVzdDoge1xuICAgIGFsaWFzZXM6IFsgJ3RhaWwnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50YWlsKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1pbjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSBzdWJqZWN0IHRvIGJlIHRoZSBtaW5pbXVtIHZhbHVlIGZvdW5kIG9uIHRoZSBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtaW4nXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWluKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBtYXg6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgc3ViamVjdCB0byBiZSB0aGUgbWF4aW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWF4J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1heChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzb3J0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHNvcnRlZCBpbiBhc2NlbmRpbmcgb3JkZXIuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3NvcnRCeSdcbiAgICBdLFxuICAgIGRlc2M6ICdzb3J0JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgLy8gQWxsb3cgdGhlIHVzZSBvZiBleHByZXNzaW9ucyBhcyBjYWxsYmFja3NcbiAgICAgIGlmIChjYWxsYmFjayBpbnN0YW5jZW9mIGFzcy5DaGFpbikge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrLnJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnNvcnRCeShhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RvcmU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGVscGVyIHRvIHN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IHZhbHVlIGJlaW5nIGV2YWx1YXRlZCBpbiB0aGUnLFxuICAgICAgJ2V4cHJlc3Npb24gaW4gc29tZSBvdGhlciBvYmplY3QuIEl0IGV4cGVjdHMgYSB0YXJnZXQgb2JqZWN0IGFuZCBvcHRpb25hbGx5JyxcbiAgICAgICd0aGUgbmFtZSBvZiBhIHByb3BlcnR5LiBJZiB0YXJnZXQgaXMgYSBmdW5jdGlvbiBpdFxcJ2xsIHJlY2VpdmUgdGhlIHZhbHVlJyxcbiAgICAgICd1c2luZyBgcHJvcGAgYXMgdGhpcyBjb250ZXh0LiBJZiBgcHJvcGAgaXMgbm90IHByb3ZpZGVkIGFuZCBgdGFyZ2V0YCBpcyBhbicsXG4gICAgICAnYXJyYXkgdGhlIHZhbHVlIHdpbGwgYmUgcHVzaGVkIHRvIGl0LidcbiAgICBdLFxuICAgIGRlc2M6ICdzdG9yZScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgdGFyZ2V0LCBwcm9wKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0LmNhbGwocHJvcCwgYWN0dWFsKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChfLmlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgIHRhcmdldC5wdXNoKGFjdHVhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICdwcm9wIHVuZGVmaW5lZCBhbmQgdGFyZ2V0IGlzIG5vdCBhbiBhcnJheSBvciBhIGZ1bmN0aW9uOiB7e2FyZzF9fSc7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoXy5pc09iamVjdCh0YXJnZXQpKSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IGFjdHVhbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAndGFyZ2V0IGlzIG5vdCBhbiBvYmplY3Q6IHt7YXJnMX19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn0pO1xuIl19
},{"../ass":1,"../util":13}],8:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tYXRjaGVycy9wcm9taXNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG4vLyBIZWxwZXIgZmFjdG9yeSBmb3IgdGhlbmFibGUgY2FsbGJhY2tzXG5mdW5jdGlvbiByZXN1bWUgKHJlc29sdmVyLCByZXN1bHQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJlc29sdmVyLnJlc3VtZSh2YWx1ZSwgcmVzdWx0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNQcm9taXNlICh2YWx1ZSkge1xuICB2YXIgdGhlbiA9IHZhbHVlICYmIHZhbHVlLnRoZW47XG4gIHJldHVybiB0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuXG4vLyBQcm9taXNlIHJlbGF0ZWQgbWF0Y2hlcnNcbmFzcy5yZWdpc3Rlcih7XG5cbiAgcHJvbWlzZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdWZXJpZmllcyB0aGF0IHRoZSB2YWx1ZSBpcyBhIHByb21pc2UgKFByb21pc2UvQSspIGJ1dCBkb2VzIG5vdCBhdHRhY2gnLFxuICAgICAgJ3RoZSBleHByZXNzaW9uIHRvIGl0cyByZXNvbHV0aW9uIGxpa2UgYHJlc29sdmVzYCBvciBgcmVqZWN0c2AsIGluc3RlYWQnLFxuICAgICAgJ3RoZSBvcmlnaW5hbCBwcm9taXNlIHZhbHVlIGlzIGtlcHQgYXMgdGhlIHN1YmplY3QgZm9yIHRoZSBmb2xsb3dpbmcnLFxuICAgICAgJ2V4cGVjdGF0aW9ucy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSBwcm9taXNlJyxcbiAgICBmYWlsOiAnZ290ICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gaXNQcm9taXNlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuXG4gIHJlc29sdmVzOiB7XG4gICAgYWxpYXNlczogWyAncmVzb2x2ZWQnLCAnZnVsZmlsbGVkJywgJ2Z1bGZpbGwnLCAnZXZlbnR1YWxseScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlJyxcbiAgICAgICdhcHBseWluZyB0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZXNvbHZlZCwnLFxuICAgICAgJ211dGF0aW5nIHRoZSB2YWx1ZSB0byB0aGUgcmVzb2x2ZWQgb25lLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZScsXG4gICAgICAncHJvbWlzZSBpcyBhY3R1YWxseSByZWplY3RlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZXNvbHZlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIHJlamVjdGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEF0dGFjaCB0byB0aGUgcHJvbWlzZSBzbyB3ZSBnZXQgbm90aWZpZWQgd2hlbiBpdCdzIHJlc29sdmVkLlxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIGJlY29tZToge1xuICAgIGFsaWFzZXM6IFsgJ2JlY29tZXMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1dvcmtzIHRoZSBzYW1lIGFzIC5yZXNvbHZlcyBidXQgYWRkaXRpb25hbGx5IHdpbGwgZG8gYSBjb21wYXJpc29uIGJldHdlZW4nLFxuICAgICAgJ3RoZSByZXNvbHZlZCB2YWx1ZSBmcm9tIHRoZSBwcm9taXNlIGFuZCB0aGUgZXhwZWN0ZWQgb25lLiBJdCBjYW4gYmUgc2VlbicsXG4gICAgICAnYXMgYSBzaG9ydGN1dCBmb3IgYC5yZXNvbHZlcy5lcShleHBlY3RlZClgLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZWNvbWUge3sgZXhwZWN0ZWQgfX0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIE1ha2UgaXQgYXN5bmNcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICAvLyBBdHRhY2ggdG8gdGhlIHByb21pc2UgcmVzb2x1dGlvblxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGVxdWFsaXR5IHN1Y2NlZWRzIGp1c3Qga2VlcCByZXNvbHZpbmdcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBfLmlzRXF1YWwodmFsdWUsIGV4cGVjdGVkKSA/IHVuZGVmaW5lZCA6IGZhbHNlO1xuICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKHZhbHVlLCByZXN1bHQpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyLCBmYWxzZSlcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgcmVqZWN0czoge1xuICAgIGFsaWFzZXM6IFsgJ3JlamVjdGVkJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBdHRhY2ggdGhlIG1hdGNoZXIgdG8gYSBwcm9taXNlIHZhbHVlIChQcm9taXNlcy9BKykgdG8gY29udGludWUgYXBwbHlpbmcnLFxuICAgICAgJ3RoZSBjaGFpbiBvZiBtYXRjaGVycyBvbmNlIHRoZSBwcm9taXNlIGhhcyBiZWVuIHJlamVjdGVkLCBtdXRhdGluZyB0aGUnLFxuICAgICAgJ3ZhbHVlIHRvIGJlY29tZSB0aGUgcmVqZWN0ZWQgZXJyb3IuJyxcbiAgICAgICdJdCB3aWxsIGZhaWwgaWYgdGhlIHZhbHVlIGlzIG5vdCBhIHByb21pc2UgKG5vIC50aGVuIG1ldGhvZCkgb3IgdGhlJyxcbiAgICAgICdwcm9taXNlIGlzIGFjdHVhbGx5IGZ1bGZpbGxlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYSByZWplY3RlZCBwcm9taXNlJyxcbiAgICBmYWlsOiAnd2FzIGZ1bGZpbGxlZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIEVudGVyIGFzeW5jIG1vZGVcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICBhY3R1YWwudGhlbihcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIsIGZhbHNlKSxcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmlnaHQgbm93IHdlIGRvbid0IGtub3cgaWYgdGhlIGV4cHJlc3Npb24gaXMgdmFsaWRcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuIl19
},{"../ass":1}],9:[function(require,module,exports){
(function (global){
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xuXG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBpdGVyYXRlIGEgdmFsdWUgY3JlYXRpbmcgZm9ya3MgZm9yIGVhY2ggZWxlbWVudCwgaGFuZGxpbmdcbi8vIGFzeW5jIGV4cGVjdGF0aW9ucyBpZiBuZWVkZWQuXG5mdW5jdGlvbiBmb3JrZXIgKHJlc29sdmVyLCBhY3R1YWwsIGl0ZXJhdG9yLCBzdG9wKSB7XG4gIHZhciBicmFuY2hlcyA9IF8uc2l6ZShhY3R1YWwpO1xuICB2YXIgcmVzdWx0ID0gaXRlcmF0b3IoYWN0dWFsLCBmdW5jdGlvbiAodmFsdWUpIHtcblxuICAgIHZhciBmb3JrID0gcmVzb2x2ZXIuZm9yaygpO1xuXG4gICAgdmFyIHBhcnRpYWwgPSBmb3JrKHZhbHVlKTtcblxuICAgIC8vIFN0b3AgaXRlcmF0aW5nIGFzIHNvb24gYXMgcG9zc2libGVcbiAgICBpZiAocGFydGlhbCA9PT0gc3RvcCkge1xuICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgIHJldHVybiBzdG9wO1xuICAgIH1cblxuICAgIGlmIChwYXJ0aWFsID09PSAhc3RvcCkge1xuICAgICAgYnJhbmNoZXMgLT0gMTtcbiAgICAgIGlmICgwID09PSBicmFuY2hlcykge1xuICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgfVxuICAgICAgcmV0dXJuICFzdG9wO1xuICAgIH1cblxuICAgIC8vIEFzeW5jIHN1cHBvcnRcbiAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIGZvcmsncyBmaW5hbCByZXN1bHRcbiAgICBmb3JrLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgLy8gV2UncmUgZG9uZSB0aGUgbW9tZW50IG9uZSBpcyBhIHN0b3AgcmVzdWx0XG4gICAgICBpZiAoZmluYWwgPT09IHN0b3ApIHtcbiAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIHN0b3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJhbmNoZXMgLT0gMTtcbiAgICAgICAgaWYgKDAgPT09IGJyYW5jaGVzKSB7XG4gICAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgIXN0b3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmluYWw7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gIXN0b3A7ICAvLyBrZWVwIGl0ZXJhdGluZ1xuICB9KTtcblxuICAvLyBXaGVuIHRoZSBmb3JrcyBjb21wbGV0ZWQgc3luY2hyb25vdXNseSBqdXN0IGZpbmFsaXplIHRoZSByZXNvbHZlclxuICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZShyZXN1bHQpO1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuXG4vLyBRdWFudGlmaWVyc1xuYXNzLnJlZ2lzdGVyKHtcblxuICBldmVyeToge1xuICAgIGFsaWFzZXM6IFsgJ2FsbCcsICdhbGxPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnYWxsIG9mIHRoZW0gc3VjY2VlZCdcbiAgICBdLFxuICAgIGRlc2M6ICdGb3IgZXZlcnkgb25lOicsXG4gICAgZmFpbDogJ29uZSBkaWRuXFwndCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5ldmVyeSwgZmFsc2UpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgc29tZToge1xuICAgIGFsaWFzZXM6IFsgJ2FueU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdhdCBsZWFzdCBvbmUgb2YgdGhlbSBzdWNjZWVkcyddLFxuICAgIGRlc2M6ICdBdCBsZWFzdCBvbmU6JyxcbiAgICBmYWlsOiAnbm9uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uc29tZSwgdHJ1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBub25lOiB7XG4gICAgYWxpYXNlczogWyAnbm9uZU9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdub25lIG9mIHRoZW0gc3VjY2VlZC4nXG4gICAgXSxcbiAgICBkZXNjOiAnTm9uZSBvZiB0aGVtOicsXG4gICAgZmFpbDogJ29uZSBkaWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhcmUgZ29pbmcgdG8gdXNlIHRoZSBzYW1lIGFsZ29yaXRobSBhcyBmb3IgLnNvbWUgYnV0IHdlJ2xsIG5lZ2F0ZVxuICAgICAgICAvLyBpdHMgcmVzdWx0IHVzaW5nIGEgZmluYWxpemVyLlxuICAgICAgICByZXNvbHZlci5maW5hbGl6ZShmdW5jdGlvbiAoZmluYWwpIHtcbiAgICAgICAgICByZXR1cm4gIWZpbmFsO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uc29tZSwgdHJ1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG59KTtcbiJdfQ==
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
        if (object == null) return false;
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
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
      return exp.result = result.call(exp, this);
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
  var fork = acquire(this.chain);
  fork.parent = this;
  fork.resolved = _.reject(this.resolved, Array.isArray);
  return fork;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9yZXNvbHZlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLy8gVXNlIGEgY2FwcGVkIHBvb2wsIHRoZSByZWxlYXNpbmcgYWxnb3JpdGhtIGlzIHByZXR0eSBzb2xpZCBzbyB3ZSBzaG91bGRcbi8vIGhhdmUgYSBnb29kIHJlLXVzZSByYXRpbyB3aXRoIGp1c3QgYSBmZXcgaW4gdGhlIHBvb2wuIFRoZW4gaW4gY2FzZVxuLy8gc29tZXRoaW5nIGdvZXMgd3JvbmcgdGhlIEdDIHdpbGwgdGFrZSBjYXJlIG9mIGl0IGFmdGVyIGEgd2hpbGUuXG52YXIgcG9vbCA9IHV0aWwuQ2FwcGVkUG9vbCgxMDApO1xudmFyIGNyZWF0ZWQgPSAwO1xuXG5cbi8vIEluc3RhbnRpYXRlcyBhIG5ldyByZXNvbHZlciBmdW5jdG9yXG5mdW5jdGlvbiBmYWN0b3J5ICgpIHtcbiAgLy8gSnVzdCBmb3J3YXJkcyB0aGUgY2FsbCB0byB0aGUgcmVzb2x2ZXIgYnkgc2V0dGluZyBpdHNlbGYgYXMgY29udGV4dC5cbiAgZnVuY3Rpb24gZm4gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyLmNhbGwoZm4sIHZhbHVlKTtcbiAgfVxuXG4gIGZuLmlkID0gKytjcmVhdGVkO1xuXG4gIC8vIFRoZSBzdGF0ZSBpcyBhdHRhY2hlZCB0byB0aGUgZnVuY3Rpb24gb2JqZWN0IHNvIGl0J3MgYXZhaWxhYmxlIHRvIHRoZVxuICAvLyBzdGF0ZS1sZXNzIGZ1bmN0aW9ucyB3aGVuIHJ1bm5pbmcgdW5kZXIgYHRoaXMuYC5cbiAgZm4uY2hhaW4gPSBudWxsO1xuICBmbi5wYXJlbnQgPSBudWxsO1xuICBmbi5wYXVzZWQgPSBmYWxzZTtcbiAgZm4ucmVzb2x2ZWQgPSBbXTtcbiAgZm4uZmluYWxpemVycyA9IFtdO1xuXG4gIC8vIEV4cG9zZSB0aGUgYmVoYXZpb3VyIGluIHRoZSBmdW5jdG9yXG4gIGZuLnBhdXNlID0gcGF1c2U7XG4gIGZuLnJlc3VtZSA9IHJlc3VtZTtcbiAgZm4uZm9yayA9IGZvcms7XG4gIGZuLmpvaW4gPSBqb2luO1xuICBmbi5maW5hbGl6ZSA9IGZpbmFsaXplO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwgJ2V4aGF1c3RlZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlc29sdmVkLmxlbmd0aCA+PSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX18ubGVuZ3RoO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGZuO1xufVxuXG4vLyBUaGlzIGlzIHRoZSBjb3JlIHJlc29sdXRpb24gYWxnb3JpdGhtLCBpdCBvcGVyYXRlcyBvdmVyIHRoZSBjaGFpblxuLy8gb2YgZXhwZWN0YXRpb25zIGNoZWNraW5nIHRoZW0gb25lIGFmdGVyIHRoZSBvdGhlciBhZ2FpbnN0IGEgdmFsdWUuXG4vLyBJZiBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGl0J2xsIGJlIGltbWVkaWF0ZWx5IGNhbGxlZCB1c2luZyB0aGVcbi8vIGV4cGVjdGF0aW9uIGluc3RhbmNlIGFzIGNvbnRleHQgYW5kIHBhc3NpbmcgYXMgb25seSBhcmd1bWVudCB0aGVcbi8vIGN1cnJlbnQgcmVzb2x2ZSBmdW5jdGlvbiwgdGhpcyBhbGxvd3MgYW4gZXhwZWN0YXRpb24gdG8gb3ZlcnJpZGVcbi8vIHRoZSB2YWx1ZSBhbmQvb3IgY29udHJvbCB0aGUgcmVzb2x1dGlvbiB3aXRob3V0IGV4cG9zaW5nIHRvbyBtYW55XG4vLyBpbnRlcm5hbCBkZXRhaWxzLlxuLy8gV2hlbiBpdCByZXR1cm5zIGB1bmRlZmluZWRgIGl0IGp1c3QgbWVhbnMgdGhhdCB0aGUgcmVzb2x1dGlvbiB3YXNcbi8vIHBhdXNlZCAoYXN5bmMpLCB3ZSBjYW4gbm90IG9idGFpbiBhIGZpbmFsIHJlc3VsdCB1c2luZyBhIHN5bmNocm9ub3VzXG4vLyBjYWxsLiBUaGlzIGNhbiBiZSB1c2VkIGJ5IG1hdGNoZXJzIHdoZW4gdGFraW5nIG92ZXIgdGhlIHJlc29sdXRpb24gdG9cbi8vIGtub3cgaWYgdGhleSBuZWVkIHRvIG1hbmdsZSB0aGUgcmVzdWx0cyBvciB0aGV5IGhhdmUgdG8gcmVnaXN0ZXIgYVxuLy8gZmluYWxpemVyIHRvIGJlIG5vdGlmaWVkIG9mIHRoZSBmaW5hbCByZXN1bHQgZnJvbSB0aGUgY2hhaW4uXG5mdW5jdGlvbiByZXNvbHZlciAodmFsdWUpIHtcbiAgdmFyIGxpc3QsIHJlc3VsdCwgZXhwO1xuXG4gIGxpc3QgPSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX187XG4gIG9mZnNldCA9IHRoaXMucmVzb2x2ZWQubGVuZ3RoO1xuICByZXN1bHQgPSB0cnVlO1xuXG4gIGZvciAodmFyIGkgPSBvZmZzZXQ7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gQ3JlYXRlIGEgbmV3IG9iamVjdCBpbmhlcml0aW5nIGZyb20gdGhlIGV4cGVjdGF0aW9uIGJ1dCB3aXRoIHRoZVxuICAgIC8vIGN1cnJlbnQgYWN0dWFsIHZhbHVlIHByb3Zpc2lvbmVkLiBJdCBhbGxvd3MgdGhlIGV4cHJlc3Npb24gdG8gbXV0YXRlXG4gICAgLy8gaXRzIHN0YXRlIGZvciB0aGlzIGV4ZWN1dGlvbiBidXQgbm90IGFmZmVjdCBvdGhlciB1c2VzIG9mIGl0LlxuICAgIGV4cCA9IHV0aWwuY3JlYXRlKGxpc3RbaV0sIHsgYWN0dWFsOiB2YWx1ZSB9KTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgcmVzb2x2ZWQgZXhwZWN0YXRpb25zXG4gICAgdGhpcy5yZXNvbHZlZC5wdXNoKGV4cCk7XG5cbiAgICAvLyBFeGVjdXRlIHRoZSBleHBlY3RhdGlvbiB0byBvYnRhaW4gaXRzIHJlc3VsdFxuICAgIHJlc3VsdCA9IGV4cC5yZXN1bHQgPSBleHAucmVzb2x2ZSgpO1xuXG4gICAgLy8gQWxsb3cgZXhwZWN0YXRpb25zIHRvIHRha2UgY29udHJvbCBmb3IgdGhlIHJlbWFpbmluZyBvZiB0aGUgY2hhaW5cbiAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gU2luY2UgdGhlIGNvbnRyb2wgaXMgZGVsZWdhdGVkIHRvIHRoZSBleHByZXNzaW9uIHdlIGRvbid0IGhhdmUgdG9cbiAgICAgIC8vIGRvIGFueXRoaW5nIG1vcmUgaGVyZS5cbiAgICAgIHJldHVybiBleHAucmVzdWx0ID0gcmVzdWx0LmNhbGwoZXhwLCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBTdG9wIG9uIGZpcnN0IGZhaWx1cmVcbiAgICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB3ZSBqdXN0IG5lZWQgdG8gYXBwbHkgYW55IHBlbmRpbmcgZmluYWxpemVyc1xuICByZXR1cm4gdGhpcy5maW5hbGl6ZShyZXN1bHQpO1xufVxuXG5cbi8vIFdoZW4gcmVzb2x2aW5nIGFzeW5jIGZsb3dzIChpLmUuOiBwcm9taXNlcykgdGhpcyB3aWxsIHBhdXNlIHRoZSBnaXZlblxuLy8gcmVzb2x2ZXIgdW50aWwgYSBjYWxsIHRvIC5yZXN1bWUoKSBpcyBtYWRlLlxuZnVuY3Rpb24gcGF1c2UgKCkge1xuICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc29sdmVyIGFscmVhZHkgcGF1c2VkJyk7XG4gIH1cblxuICB0aGlzLnBhdXNlZCA9IHRydWU7XG59XG5cbi8vIE9uY2UgdGhlIGFzeW5jIGZsb3cgaGFzIGNvbXBsZXRlZCB3ZSBjYW4gY29udGludWUgcmVzb2x2aW5nIHdoZXJlIHdlXG4vLyBzdG9wZWQuIFdoZW4gdGhlIG92ZXJyaWRlIHBhcmFtIGlzIG5vdCB1bmRlZmluZWQgd2UnbGwgc2tpcCBjYWxsaW5nIHRoZVxuLy8gcmVzb2x2ZXIgYW5kIGFzc3VtZSB0aGF0IGJvb2wgYXMgdGhlIGZpbmFsIHJlc3VsdC4gVGhpcyBhbGxvd3MgdGhlIGFzeW5jXG4vLyBjb2RlIHRvIHNob3J0Y3V0IHRoZSByZXNvbHZlci5cbmZ1bmN0aW9uIHJlc3VtZSAoYWN0dWFsLCBvdmVycmlkZSkge1xuICBpZiAoIXRoaXMucGF1c2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHZlciBpcyBub3QgY3VycmVudGx5IHBhdXNlZCcpO1xuICB9XG5cbiAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcblxuICAvLyBBIGZpbmFsIHJlc3VsdCB3YXMgcHJvdmlkZWQgc28ganVzdCBmaW5hbGl6ZSB0aGUgcmVzb2x2ZXJcbiAgaWYgKG92ZXJyaWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdGhpcy5maW5hbGl6ZShvdmVycmlkZSk7XG4gIH1cblxuICAvLyBMZXQncyBjb250aW51ZSByZXNvbHZpbmcgd2l0aCB0aGUgbmV3IHZhbHVlXG4gIC8vIE5vdGU6IHRoaXMoKSBsb29rcyB3ZWlyZCBidXQgcmVtZW1iZXIgd2UncmUgdXNpbmcgYSBmdW5jdGlvbiBhcyBjb250ZXh0XG4gIHJldHVybiB0aGlzKGFjdHVhbCk7XG59XG5cbi8vIENsb25lcyB0aGUgY3VycmVudCByZXNvbHZlciBzbyB3ZSBjYW4gZm9yayBhbmQgZGlzY2FyZCBvcGVyYXRpb25zLlxuZnVuY3Rpb24gZm9yayAoKSB7XG4gIHZhciBmb3JrID0gYWNxdWlyZSh0aGlzLmNoYWluKTtcbiAgZm9yay5wYXJlbnQgPSB0aGlzO1xuICBmb3JrLnJlc29sdmVkID0gXy5yZWplY3QodGhpcy5yZXNvbHZlZCwgQXJyYXkuaXNBcnJheSk7XG4gIHJldHVybiBmb3JrO1xufVxuXG4vLyBBc3N1bWUgdGhlIHJlc3VsdHMgZnJvbSBhIGZvcmsgaW4gdGhlIG1haW4gcmVzb2x2ZXJcbmZ1bmN0aW9uIGpvaW4gKGZvcmspIHtcbiAgdmFyIGxlbiA9IF8ucmVqZWN0KHRoaXMucmVzb2x2ZWQsIEFycmF5LmlzQXJyYXkpLmxlbmd0aDtcbiAgdGhpcy5yZXNvbHZlZC5wdXNoKFxuICAgIGZvcmsucmVzb2x2ZWQuc2xpY2UobGVuKVxuICApO1xufVxuXG4vLyBXaGVuIHRoZSBhcmd1bWVudCBpcyBhIGZ1bmN0aW9uIGl0IGdldHMgcmVnaXN0ZXJlZCBhcyBhIGZpbmFsaXplciBmb3IgdGhlXG4vLyByZXN1bHQgb2J0YWluZWQgb25jZSB0aGUgZXhwcmVzc2lvbiBoYXMgYmVlbiBmdWxseSByZXNvbHZlZCAoaS5lLiBhc3luYykuXG4vLyBPdGhlcndpc2UgaXQnbGwgZXhlY3V0ZSBhbnkgcmVnaXN0ZXJlZCBmdW5jdGlvbnMgb24gdGhlIGdpdmVuIHJlc3VsdCBhbmRcbi8vIGFsbG93IHRoZW0gdG8gY2hhbmdlIGl0IGJlZm9yZSByZWxlYXNpbmcgdGhlIHJlc29sdmVyIGludG8gdGhlIHBvb2wuXG5mdW5jdGlvbiBmaW5hbGl6ZShyZXN1bHQpIHtcbiAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLmZpbmFsaXplcnMucHVzaChcbiAgICAgIFtyZXN1bHQsIF8ubGFzdCh0aGlzLnJlc29sdmVkKV1cbiAgICApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIE5vdGhpbmcgeWV0IHRvIGZpbmFsaXplIHNpbmNlIHRoZSByZXN1bHQgaXMgc3RpbGwgdW5rbm93blxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gQWxsb3cgZmluYWxpemVycyB0byB0b2dnbGUgdGhlIHJlc3VsdCAoTElGTyBvcmRlcilcbiAgdmFyIGZpbmFsaXplcjtcbiAgd2hpbGUgKHRoaXMuZmluYWxpemVycy5sZW5ndGggPiAwKSB7XG4gICAgZmluYWxpemVyID0gdGhpcy5maW5hbGl6ZXJzLnBvcCgpO1xuICAgIHJlc3VsdCA9IGZpbmFsaXplclswXS5jYWxsKGZpbmFsaXplclsxXSwgcmVzdWx0KTtcbiAgICBmaW5hbGl6ZXJbMV0ucmVzdWx0ID0gcmVzdWx0O1xuICB9XG5cbiAgLy8gTGV0IHRoZSBjaGFpbiBkaXNwYXRjaCB0aGUgZmluYWwgcmVzdWx0IGJ1dCBvbmx5IGZvciBub24tZm9ya2VkIHJlc29sdmVyc1xuICBpZiAoIXRoaXMucGFyZW50KSB7XG4gICAgdGhpcy5jaGFpbi5kaXNwYXRjaFJlc3VsdCh0aGlzLnJlc29sdmVkLCByZXN1bHQpO1xuICB9XG5cbiAgLy8gV2hlbiBhIGZpbmFsIHJlc3VsdCBoYXMgYmVlbiBvYnRhaW5lZCByZWxlYXNlIHRoZSByZXNvbHZlciB0byB0aGUgcG9vbFxuICBwb29sLnB1c2godGhpcyk7XG4gIGlmIChwb29sLmxlbmd0aCA+IGNyZWF0ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bvb2wgY29ycnVwdGVkISBDcmVhdGVkICcgKyBjcmVhdGVkICsgJyBidXQgdGhlcmUgYXJlICcgKyBwb29sLmxlbmd0aCArICcgcG9vbGVkJyk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBBY3F1aXJlcyBhIHJlc29sdmVyIGZ1bmN0b3IsIGlmIHRoZXJlIGlzIG9uZSBpbiB0aGUgcG9vbCBpdCdsbCBiZSByZXNldCBhbmRcbi8vIHJldXNlZCwgb3RoZXJ3aXNlIGl0J2xsIGNyZWF0ZSBhIG5ldyBvbmUuIFdoZW4geW91J3JlIGRvbmUgd2l0aCB0aGUgcmVzb2x2ZXJcbi8vIHlvdSBzaG91ZCBnaXZlIGl0IHRvIGByZWxlYXNlKClgIHNvIGl0IGNhbiBiZSBpbmNvcnBvcmF0ZWQgdG8gdGhlIHBvb2wuXG4vLyBUaGUgcmVhc29uIGZvciB1c2luZyBhIHBvb2wgb2Ygb2JqZWN0cyBoZXJlIGlzIHRoYXQgZXZlcnkgdGltZSB3ZSBldmFsdWF0ZVxuLy8gYW4gZXhwcmVzc2lvbiB3ZSdsbCBuZWVkIGEgcmVzb2x2ZXIsIHdoZW4gdXNpbmcgcXVhbnRpZmllcnMgbXVsdGlwbGUgZm9ya3Ncbi8vIHdpbGwgYmUgY3JlYXRlZCwgc28gaXQncyBpbXBvcnRhbnQgdG8gaW1wcm92ZSB0aGUgcGVyZm9ybWFuY2UuXG5mdW5jdGlvbiBhY3F1aXJlIChjaGFpbikge1xuICB2YXIgcmVzb2x2ZXIgPSBwb29sLnBvcCgpIHx8IGZhY3RvcnkoKTtcblxuICAvLyBSZXNldCB0aGUgc3RhdGUgb2YgdGhlIHJlc29sdmVyXG4gIHJlc29sdmVyLmNoYWluID0gY2hhaW47XG4gIHJlc29sdmVyLnBhcmVudCA9IG51bGw7XG4gIHJlc29sdmVyLnBhdXNlZCA9IGZhbHNlO1xuICB3aGlsZSAocmVzb2x2ZXIucmVzb2x2ZWQubGVuZ3RoID4gMCkge1xuICAgIHJlc29sdmVyLnJlc29sdmVkLnBvcCgpO1xuICB9XG4gIHdoaWxlIChyZXNvbHZlci5maW5hbGl6ZXJzLmxlbmd0aCA+IDApIHtcbiAgICByZXNvbHZlci5maW5hbGl6ZXJzLnBvcCgpO1xuICB9XG5cbiAgcmV0dXJuIHJlc29sdmVyO1xufVxuXG5cbmV4cG9ydHMuYWNxdWlyZSA9IGFjcXVpcmU7XG4iXX0=
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
        return new Chain(this == true);
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
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

// Get the native Promise or a shim
exports.Promise = global.Promise || (typeof window !== "undefined" ? window.window : typeof global !== "undefined" ? global.window : null).Promise;


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
    Mocha = (typeof window !== "undefined" ? window.Mocha : typeof global !== "undefined" ? global.Mocha : null);
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
  return _.assign(new create, values || {});
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxuLy8gR2V0IHRoZSBuYXRpdmUgUHJvbWlzZSBvciBhIHNoaW1cbmV4cG9ydHMuUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlIHx8ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LndpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwud2luZG93IDogbnVsbCkuUHJvbWlzZTtcblxuXG4vLyBDYXBwZWQgcG9vbCB0byBsaW1pdCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBjYW4gYmVcbi8vIHN0b3JlZCAodW5ib3VuZGVkIGJ5IGRlZmF1bHQpLlxuZXhwb3J0cy5DYXBwZWRQb29sID0gZnVuY3Rpb24gKG1heCkge1xuICB2YXIgcG9vbCA9IFtdO1xuXG4gIG1heCA9IG1heCB8fCBOdW1iZXIuTUFYX1ZBTFVFO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwb29sLCAncHVzaCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA8IG1heCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKHRoaXMsIHYpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHBvb2w7XG59O1xuXG5cbnZhciBkb0NvbG9ycyA9IF8ub25jZShmdW5jdGlvbiAoKSB7XG4gIC8vIE1hc3RlciBvdmVycmlkZSB3aXRoIG91ciBjdXN0b20gZW52IHZhcmlhYmxlXG4gIGlmIChwcm9jZXNzLmVudi5BU1NfQ09MT1JTICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gL3RydWV8b258eWVzfGVuYWJsZWQ/fDEvaS50ZXN0KHByb2Nlc3MuZW52LkFTU19DT0xPUlMpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgS2FybWEgaXMgYmVpbmcgdXNlZCBhbmQgaGFzIGRlZmluZWQgdGhlIGNvbG9yc1xuICB2YXIga2FybWEgPSBnbG9iYWwuX19rYXJtYV9fO1xuICBpZiAoa2FybWEgJiYga2FybWEuY29uZmlnICYmIHR5cGVvZiBrYXJtYS5jb25maWcuY29sb3JzICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBrYXJtYS5jb25maWcuY29sb3JzO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgbW9jaGEgaXMgYXJvdW5kIGFuZCB2ZXJpZnkgYWdhaW5zdCBpdHMgY29uZmlndXJhdGlvblxuICB2YXIgTW9jaGEgPSBnbG9iYWwuTW9jaGE7XG4gIGlmIChNb2NoYSA9PT0gdW5kZWZpbmVkICYmIHJlcXVpcmUucmVzb2x2ZSAmJiByZXF1aXJlLnJlc29sdmUoJ21vY2hhJykpIHtcbiAgICBNb2NoYSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Lk1vY2hhIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5Nb2NoYSA6IG51bGwpO1xuICB9XG4gIGlmIChNb2NoYSAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycyAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycy5CYXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gTW9jaGEucmVwb3J0ZXJzLkJhc2UudXNlQ29sb3JzO1xuICB9XG5cbiAgLy8gUXVlcnkgdGhlIGVudmlyb25tZW50IGFuZCBzZWUgaWYgc29tZSBjb21tb24gdmFyaWFibGVzIGFyZSBzZXRcbiAgaWYgKHByb2Nlc3MuZW52Lk1PQ0hBX0NPTE9SUyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKC8tLWNvbG9yPWFsd2F5cy8udGVzdChwcm9jZXNzLmVudi5HUkVQX09QVElPTlMgfHwgJycpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBGaW5hbGx5IGp1c3QgY2hlY2sgaWYgdGhlIGVudmlyb25tZW50IGlzIGNhcGFibGVcbiAgdmFyIHR0eSA9IHJlcXVpcmUoJ3R0eScpO1xuICByZXR1cm4gdHR5LmlzYXR0eSgxKSAmJiB0dHkuaXNhdHR5KDIpO1xufSk7XG5cblxuLy8gUmVtb3ZlIEFOU0kgZXNjYXBlcyBmcm9tIGEgc3RyaW5nXG5mdW5jdGlvbiB1bmFuc2kgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xceDFiXFxbKFxcZCs7PykrW2Etel0vZ2ksICcnKTtcbn1cblxuXG4vLyBBdm9pZCByZXBlYXRlZCBjb21waWxhdGlvbnMgYnkgbWVtb2l6aW5nXG52YXIgY29tcGlsZVRlbXBsYXRlID0gXy5tZW1vaXplKGZ1bmN0aW9uICh0cGwpIHtcbiAgcmV0dXJuIF8udGVtcGxhdGUodHBsLCBudWxsLCB7XG4gICAgZXNjYXBlOiAvXFx7XFx7KFtcXHNcXFNdKz8pXFx9XFx9L2dcbiAgfSk7XG59KTtcblxuLy8gRHVtcHMgYXJiaXRyYXJ5IHZhbHVlcyBhcyBzdHJpbmdzIGluIGEgY29uY2lzZSB3YXlcbi8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS91dGlscy9vYmpEaXNwbGF5LmpzXG5mdW5jdGlvbiB2YWx1ZUR1bXBlciAodikge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKF8uaXNOdW1iZXIodikgfHwgXy5pc05hTih2KSB8fCBfLmlzQm9vbGVhbih2KSB8fCBfLmlzTnVsbCh2KSB8fCBfLmlzVW5kZWZpbmVkKHYpKSB7XG4gICAgdmFsdWUgPSAnPCcgKyB2ICsgJz4nO1xuICB9IGVsc2UgaWYgKF8uaXNSZWdFeHAodikpIHtcbiAgICB2YWx1ZSA9IHYudG9TdHJpbmcoKTtcbiAgfSBlbHNlIGlmIChfLmlzRnVuY3Rpb24odikpIHtcbiAgICBpZiAodi5kaXNwbGF5TmFtZSkge1xuICAgICAgdmFsdWUgPSB2LmRpc3BsYXlOYW1lICsgJygpJztcbiAgICB9IGVsc2UgaWYgKHYubmFtZSkge1xuICAgICAgdmFsdWUgPSB2Lm5hbWUgKyAnKCknO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9ICc8ZnVuY3Rpb24+JztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfVxuXG4gIHJldHVybiAnXFx1MDAxYlsxOzM2bScgKyB2YWx1ZSArICdcXHUwMDFiWzBtJztcbn1cblxuXG4vLyBDdXN0b21pemVkIHZlcnNpb24gb2YgbG9kYXNoIHRlbXBsYXRlXG5mdW5jdGlvbiB0ZW1wbGF0ZSAodHBsLCBjb250ZXh0KSB7XG4gIHZhciBmbiA9IGNvbXBpbGVUZW1wbGF0ZSh0cGwpO1xuICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIG9yaWdFc2NhcGUgPSBfLmVzY2FwZTtcbiAgdHJ5IHtcbiAgICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBlc2NhcGUgZnVuY3Rpb24gdG8gdXNlIGl0IGZvciBkdW1waW5nIGZvcm1hdHRlZCB2YWx1ZXNcbiAgICBfLmVzY2FwZSA9IHZhbHVlRHVtcGVyO1xuXG4gICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuXG4gIH0gZmluYWxseSB7XG4gICAgXy5lc2NhcGUgPSBvcmlnRXNjYXBlO1xuICB9XG59XG5cbi8vIEEgc2ltcGxlIGZhc3QgZnVuY3Rpb24gYmluZGluZyBwcmltaXRpdmUgb25seSBzdXBwb3J0aW5nIHNldHRpbmcgdGhlIGNvbnRleHRcbmZ1bmN0aW9uIGJpbmQoZm4sIHRoaXNBcmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxuLy8gUXVpY2tseSBjcmVhdGVzIGEgbmV3IG9iamVjdCB3aXRoIGEgY3VzdG9tIHByb3RvdHlwZSBhbmQgc29tZSB2YWx1ZVxuLy8gb3ZlcnJpZGVzLlxuZnVuY3Rpb24gY3JlYXRlKHByb3RvLCB2YWx1ZXMpIHtcbiAgaWYgKDAgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEhBQ0s6IFVzZSBGdW5jdGlvbi5wcm90b3R5cGUgKyBuZXcgaW5zdGVhZCBvZiB0aGUgc2xvdy1pc2ggT2JqZWN0LmNyZWF0ZVxuICBjcmVhdGUucHJvdG90eXBlID0gcHJvdG87XG4gIHJldHVybiBfLmFzc2lnbihuZXcgY3JlYXRlLCB2YWx1ZXMgfHwge30pO1xufVxuXG5cbi8vIEZyb20gaHR0cDovL3NpZGVyaXRlLmJsb2dzcG90LmNvbS8yMDE0LzExL3N1cGVyLWZhc3QtYW5kLWFjY3VyYXRlLXN0cmluZy1kaXN0YW5jZS5odG1sXG5mdW5jdGlvbiBzaWZ0NChzMSwgczIsIG1heE9mZnNldCkge1xuICBpZiAoIXMxIHx8ICFzMS5sZW5ndGgpIHtcbiAgICBpZiAoIXMyKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHMyLmxlbmd0aDtcbiAgfVxuXG4gIGlmICghczIgfHwgIXMyLmxlbmd0aCkge1xuICAgIHJldHVybiBzMS5sZW5ndGg7XG4gIH1cblxuICB2YXIgbDEgPSBzMS5sZW5ndGg7XG4gIHZhciBsMiA9IHMyLmxlbmd0aDtcblxuICB2YXIgYzEgPSAwOyAgLy8gY3Vyc29yIGZvciBzdHJpbmcgMVxuICB2YXIgYzIgPSAwOyAgLy8gY3Vyc29yIGZvciBzdHJpbmcgMlxuICB2YXIgbGNzcyA9IDA7ICAvLyBsYXJnZXN0IGNvbW1vbiBzdWJzZXF1ZW5jZVxuICB2YXIgbG9jYWxfY3MgPSAwOyAvLyBsb2NhbCBjb21tb24gc3Vic3RyaW5nXG5cbiAgd2hpbGUgKChjMSA8IGwxKSAmJiAoYzIgPCBsMikpIHtcbiAgICBpZiAoczEuY2hhckF0KGMxKSA9PSBzMi5jaGFyQXQoYzIpKSB7XG4gICAgICBsb2NhbF9jcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBsY3NzICs9IGxvY2FsX2NzO1xuICAgICAgbG9jYWxfY3MgPSAwO1xuICAgICAgaWYgKGMxICE9IGMyKSB7XG4gICAgICAgIGMxID0gYzIgPSBNYXRoLm1heChjMSxjMik7IC8vIHVzaW5nIG1heCB0byBieXBhc3MgdGhlIG5lZWQgZm9yIGNvbXB1dGVyIHRyYW5zcG9zaXRpb25zICgnYWInIHZzICdiYScpXG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1heE9mZnNldDsgaSsrKSB7XG4gICAgICAgIGlmICgoYzEgKyBpIDwgbDEpICYmIChzMS5jaGFyQXQoYzEgKyBpKSA9PT0gczIuY2hhckF0KGMyKSkpIHtcbiAgICAgICAgICBjMSArPSBpO1xuICAgICAgICAgIGxvY2FsX2NzKys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChjMiArIGkgPCBsMikgJiYgKHMxLmNoYXJBdChjMSkgPT09IHMyLmNoYXJBdChjMiArIGkpKSkge1xuICAgICAgICAgIGMyICs9IGk7XG4gICAgICAgICAgbG9jYWxfY3MrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjMSsrO1xuICAgIGMyKys7XG4gIH1cbiAgbGNzcyArPSBsb2NhbF9jcztcbiAgcmV0dXJuIE1hdGgucm91bmQoTWF0aC5tYXgobDEsIGwyKSAtIGxjc3MpO1xufVxuXG5leHBvcnRzLmJpbmQgPSBiaW5kO1xuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGU7XG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG5leHBvcnRzLnVuYW5zaSA9IHVuYW5zaTtcbmV4cG9ydHMuZG9Db2xvcnMgPSBkb0NvbG9ycztcbmV4cG9ydHMuc2lmdDQgPSBzaWZ0NDtcbiJdfQ==
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
patches.lodash((typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null));

if (global.sinon && global.sinon.match) {
  patches.sinon(global.sinon);
} else if (require.resolve && require.resolve('sinon')) {
  patches.sinon((typeof window !== "undefined" ? window.sinon : typeof global !== "undefined" ? global.sinon : null));
}


module.exports = ass;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBhc3MgPSByZXF1aXJlKCcuL2xpYi9hc3MnKTtcbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vbGliL2NoYWluJyk7XG52YXIgQXNzRXJyb3IgPSByZXF1aXJlKCcuL2xpYi9lcnJvcicpO1xudmFyIHNob3VsZCA9IHJlcXVpcmUoJy4vbGliL3Nob3VsZCcpO1xudmFyIHBhdGNoZXMgPSByZXF1aXJlKCcuL2xpYi9wYXRjaGVzJyk7XG5cbi8vIFJlZ2lzdGVyIHRoZSBkZWZhdWx0IG1hdGNoZXJzXG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9jb3JlJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9jb29yZGluYXRpb24nKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL3F1YW50aWZpZXJzJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9wcm9taXNlJyk7XG5cblxuLy8gQnVuZGxlIHNvbWUgb2YgdGhlIGludGVybmFsIHN0dWZmIHdpdGggdGhlIGFzcyBmdW5jdGlvblxuYXNzLkNoYWluID0gQ2hhaW47XG5hc3MuRXJyb3IgPSBBc3NFcnJvcjtcbmFzcy5wYXRjaGVzID0gcGF0Y2hlcztcblxuLy8gRm9yd2FyZCB0aGUgc2hvdWxkIGluc3RhbGxlclxuLy8gTm90ZTogbWFrZSB0aGVtIGFyaXR5LTAgdG8gYWxsb3cgYmVmb3JlRWFjaChhc3Muc2hvdWxkKSBpbiBNb2NoYVxuYXNzLnNob3VsZCA9IGZ1bmN0aW9uICgvKiBuYW1lICovKSB7XG4gIHNob3VsZChhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IHVuZGVmaW5lZCk7XG4gIHJldHVybiBhc3M7XG59O1xuYXNzLnNob3VsZC5yZXN0b3JlID0gZnVuY3Rpb24gKC8qIG5hbWUgKi8pIHtcbiAgc2hvdWxkLnJlc3RvcmUoYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQpO1xuICByZXR1cm4gYXNzO1xufTtcblxuXG4vLyBQYXRjaCB0aGlyZCBwYXJ0eSBsaWJyYXJpZXMgdG8gdW5kZXJzdGFuZCBhYm91dCBhc3MtZXJ0IGV4cHJlc3Npb25zLiBXZVxuLy8gZGVwZW5kIG9uIHBhdGNoaW5nIGxvZGFzaCBmb3IgdGhlIGxpYnJhcnkgdG8gd29yayBjb3JyZWN0bHksIGhvd2V2ZXIgdGhlXG4vLyByZXN0IGFyZSBvcHRpb25hbC5cbnBhdGNoZXMubG9kYXNoKCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKSk7XG5cbmlmIChnbG9iYWwuc2lub24gJiYgZ2xvYmFsLnNpbm9uLm1hdGNoKSB7XG4gIHBhdGNoZXMuc2lub24oZ2xvYmFsLnNpbm9uKTtcbn0gZWxzZSBpZiAocmVxdWlyZS5yZXNvbHZlICYmIHJlcXVpcmUucmVzb2x2ZSgnc2lub24nKSkge1xuICBwYXRjaGVzLnNpbm9uKCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LnNpbm9uIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5zaW5vbiA6IG51bGwpKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzcztcbiJdfQ==
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
  if (!(this instanceof CallSite)) {
    return new CallSite(frame);
  }
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
  if (typeof Object.defineProperty !== 'function') {
    this.frames = unwind(this._getFrames());
    this._getFrames(true);
    this._getFrames = null;
    this.stack = this.generateStackTrace();
  }

  return this;
}

// Set FRAME_EMPTY to null to disable any sort of separator
Failure.FRAME_EMPTY = '  ----------------------------------------';
Failure.FRAME_PREFIX = '  at ';

// By default we enable tracking for async stack traces
Failure.TRACK = true;


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
  NativeError.captureStackTrace(V8FRAMES, sff || makeFramesGetterV8);
  sff = null;
  var frames = V8FRAMES.stack;
  V8FRAMES.stack = null;  // IMPORTANT: This is needed to avoid leaks!!!
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
    sff = null;
    error = null;
    functions = null;

    return frames;
  };
}

// Generates a getter for the call site frames
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
  // When called from makeFramesGetter we just want to obtain the frames
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
Failure.exclude = function Failure_exclude (predicate) {
  exclude(Failure, predicate);
};

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
// The tracking can be globally disabled by setting Failure.TRACK to false
Failure.track = function Failure_track (fn, sff) {
  if (typeof fn !== 'function') {
    return fn;
  }

  // Clean up previous frames to help the GC
  if (typeof fn[SYMBOL_FRAMES] === 'function') {
    fn[SYMBOL_FRAMES](true);
  }

  if (Failure.TRACK) {
    fn[SYMBOL_FRAMES] = null;
    fn[SYMBOL_FRAMES] = makeFramesGetter(sff || Failure_track);
  }

  return fn;
};

// Wraps the function before annotating it with tracking information, this
// allows to track multiple schedullings of a single function.
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

Failure.setTimeout = function Failure_setTimeout () {
  arguments[0] = Failure.track(arguments[0], Failure_setTimeout);
  return setTimeout.apply(null, arguments);
};

Failure.nextTick = function Failure_nextTick () {
  arguments[0] = Failure.track(arguments[0], Failure_nextTick);
  return process.nextTick.apply(process, arguments);
};

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
      return this.generateStackTrace();
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

  // Honor any previously defined stacktrace formatter by
  // allowing it finally format the frames. This is needed
  // when using node-source-map-support for instance.
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9mYWlsdXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgRXJyb3JTdGFja1BhcnNlciA9IHJlcXVpcmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicpO1xudmFyIENhbGxTaXRlID0gcmVxdWlyZSgnLi9jYWxsLXNpdGUnKTtcblxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgYnVpbHRpbiBlcnJvciBjb25zdHJ1Y3RvclxudmFyIE5hdGl2ZUVycm9yID0gRXJyb3I7XG5cbi8vIEFubm90YXRpb24gc3ltYm9sc1xudmFyIFNZTUJPTF9GUkFNRVMgPSAnQEBmYWlsdXJlL2ZyYW1lcyc7XG52YXIgU1lNQk9MX0lHTk9SRSA9ICdAQGZhaWx1cmUvaWdub3JlJztcblxuXG5mdW5jdGlvbiBGYWlsdXJlIChtZXNzYWdlLCBzZmYpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZhaWx1cmUpKSB7XG4gICAgcmV0dXJuIG5ldyBGYWlsdXJlKG1lc3NhZ2UsIHNmZiB8fCBGYWlsdXJlKTtcbiAgfVxuXG4gIHRoaXMuc2ZmID0gc2ZmIHx8IHRoaXMuY29uc3RydWN0b3I7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblxuICAvLyBHZW5lcmF0ZSBhIGdldHRlciBmb3IgdGhlIGZyYW1lcywgdGhpcyBlbnN1cmVzIHRoYXQgd2UgZG8gYXMgbGl0dGxlIHdvcmtcbiAgLy8gYXMgcG9zc2libGUgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBlcnJvciwgZGVmZXJyaW5nIHRoZSBleHBlbnNpdmUgc3RhY2tcbiAgLy8gbWFuZ2xpbmcgb3BlcmF0aW9ucyB1bnRpbCB0aGUgLnN0YWNrIHByb3BlcnR5IGlzIGFjdHVhbGx5IHJlcXVlc3RlZC5cbiAgdGhpcy5fZ2V0RnJhbWVzID0gbWFrZUZyYW1lc0dldHRlcih0aGlzLnNmZik7XG5cbiAgLy8gT24gRVM1IGVuZ2luZXMgd2UgdXNlIG9uZS10aW1lIGdldHRlcnMgdG8gYWN0dWFsbHkgZGVmZXIgdGhlIGV4cGVuc2l2ZVxuICAvLyBvcGVyYXRpb25zIChkZWZpbmVkIGluIHRoZSBwcm90b3R5cGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIHdoaWxlIGxlZ2FjeVxuICAvLyBlbmdpbmVzIHdpbGwgc2ltcGx5IGRvIGFsbCB0aGUgd29yayB1cCBmcm9udC5cbiAgaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLmZyYW1lcyA9IHVud2luZCh0aGlzLl9nZXRGcmFtZXMoKSk7XG4gICAgdGhpcy5fZ2V0RnJhbWVzKHRydWUpO1xuICAgIHRoaXMuX2dldEZyYW1lcyA9IG51bGw7XG4gICAgdGhpcy5zdGFjayA9IHRoaXMuZ2VuZXJhdGVTdGFja1RyYWNlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn1cblxuLy8gU2V0IEZSQU1FX0VNUFRZIHRvIG51bGwgdG8gZGlzYWJsZSBhbnkgc29ydCBvZiBzZXBhcmF0b3JcbkZhaWx1cmUuRlJBTUVfRU1QVFkgPSAnICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJztcbkZhaWx1cmUuRlJBTUVfUFJFRklYID0gJyAgYXQgJztcblxuLy8gQnkgZGVmYXVsdCB3ZSBlbmFibGUgdHJhY2tpbmcgZm9yIGFzeW5jIHN0YWNrIHRyYWNlc1xuRmFpbHVyZS5UUkFDSyA9IHRydWU7XG5cblxuLy8gSGVscGVyIHRvIG9idGFpbiB0aGUgY3VycmVudCBzdGFjayB0cmFjZVxudmFyIGdldEVycm9yV2l0aFN0YWNrID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IE5hdGl2ZUVycm9yKCk7XG59O1xuLy8gU29tZSBlbmdpbmVzIGRvIG5vdCBnZW5lcmF0ZSB0aGUgLnN0YWNrIHByb3BlcnR5IHVudGlsIGl0J3MgdGhyb3duXG5pZiAoIWdldEVycm9yV2l0aFN0YWNrKCkuc3RhY2spIHtcbiAgZ2V0RXJyb3JXaXRoU3RhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHsgdGhyb3cgbmV3IE5hdGl2ZUVycm9yKCk7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGU7IH1cbiAgfTtcbn1cblxuLy8gVHJpbSBmcmFtZXMgdW5kZXIgdGhlIHByb3ZpZGVkIHN0YWNrIGZpcnN0IGZ1bmN0aW9uXG5mdW5jdGlvbiB0cmltKGZyYW1lcywgc2ZmKSB7XG4gIHZhciBmbiwgbmFtZSA9IHNmZi5uYW1lO1xuICBpZiAoIWZyYW1lcykge1xuICAgIGNvbnNvbGUud2FybignW0ZhaWx1cmVdIGVycm9yIGNhcHR1cmluZyBmcmFtZXMnKTtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgZm9yICh2YXIgaT0wOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4gPSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb24oKTtcbiAgICBpZiAoZm4gJiYgZm4gPT09IHNmZiB8fCBuYW1lICYmIG5hbWUgPT09IGZyYW1lc1tpXS5nZXRGdW5jdGlvbk5hbWUoKSkge1xuICAgICAgcmV0dXJuIGZyYW1lcy5zbGljZShpICsgMSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBmcmFtZXM7XG59XG5cbmZ1bmN0aW9uIHVud2luZCAoZnJhbWVzKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcblxuICBmb3IgKHZhciBpPTAsIGZuOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4gPSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb24oKTtcblxuICAgIGlmICghZm4gfHwgIWZuW1NZTUJPTF9JR05PUkVdKSB7XG4gICAgICByZXN1bHQucHVzaChmcmFtZXNbaV0pO1xuICAgIH1cblxuICAgIGlmIChmbiAmJiBmbltTWU1CT0xfRlJBTUVTXSkge1xuICAgICAgaWYgKEZhaWx1cmUuRlJBTUVfRU1QVFkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENhbGwgdGhlIGdldHRlciBhbmQga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgcmVzdWx0IGluIGNhc2Ugd2UgaGF2ZSB0b1xuICAgICAgLy8gdW53aW5kIHRoZSBzYW1lIGZ1bmN0aW9uIGFub3RoZXIgdGltZS5cbiAgICAgIC8vIFRPRE86IE1ha2Ugc3VyZSBrZWVwaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBmcmFtZXMgZG9lc24ndCBjcmVhdGUgbGVha3NcbiAgICAgIGlmICh0eXBlb2YgZm5bU1lNQk9MX0ZSQU1FU10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFyIGdldHRlciA9IGZuW1NZTUJPTF9GUkFNRVNdO1xuICAgICAgICBmbltTWU1CT0xfRlJBTUVTXSA9IG51bGw7XG4gICAgICAgIGZuW1NZTUJPTF9GUkFNRVNdID0gZ2V0dGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZm5bU1lNQk9MX0ZSQU1FU10pIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbRmFpbHVyZV0gRW1wdHkgZnJhbWVzIGFubm90YXRpb24nKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgdW53aW5kKGZuW1NZTUJPTF9GUkFNRVNdKSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBSZWNlaXZlciBmb3IgdGhlIGZyYW1lcyBpbiBhIC5zdGFjayBwcm9wZXJ0eSBmcm9tIGNhcHR1cmVTdGFja1RyYWNlXG52YXIgVjhGUkFNRVMgPSB7fTtcblxuLy8gVjggY29kZSBwYXRoIGZvciBnZW5lcmF0aW5nIGEgZnJhbWVzIGdldHRlclxuZnVuY3Rpb24gbWFrZUZyYW1lc0dldHRlclY4IChzZmYpIHtcbiAgTmF0aXZlRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoVjhGUkFNRVMsIHNmZiB8fCBtYWtlRnJhbWVzR2V0dGVyVjgpO1xuICBzZmYgPSBudWxsO1xuICB2YXIgZnJhbWVzID0gVjhGUkFNRVMuc3RhY2s7XG4gIFY4RlJBTUVTLnN0YWNrID0gbnVsbDsgIC8vIElNUE9SVEFOVDogVGhpcyBpcyBuZWVkZWQgdG8gYXZvaWQgbGVha3MhISFcbiAgcmV0dXJuIGZ1bmN0aW9uIChjbGVhbnVwKSB7XG4gICAgdmFyIHJlc3VsdCA9IGZyYW1lcztcbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgZnJhbWVzID0gbnVsbDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG4vLyBub24tVjggY29kZSBwYXRoIGZvciBnZW5lcmF0aW5nIGEgZnJhbWVzIGdldHRlclxuZnVuY3Rpb24gbWFrZUZyYW1lc0dldHRlckNvbXBhdCAoc2ZmKSB7XG4gIC8vIE9idGFpbiBhIHN0YWNrIHRyYWNlIGF0IHRoZSBjdXJyZW50IHBvaW50XG4gIHZhciBlcnJvciA9IGdldEVycm9yV2l0aFN0YWNrKCk7XG5cbiAgLy8gV2FsayB0aGUgY2FsbGVyIGNoYWluIHRvIGFubm90YXRlIHRoZSBzdGFjayB3aXRoIGZ1bmN0aW9uIHJlZmVyZW5jZXNcbiAgLy8gR2l2ZW4gdGhlIGxpbWl0YXRpb25zIGltcG9zZWQgYnkgRVM1IFwic3RyaWN0IG1vZGVcIiBpdCdzIG5vdCBwb3NzaWJsZVxuICAvLyB0byBvYnRhaW4gcmVmZXJlbmNlcyB0byBmdW5jdGlvbnMgYmV5b25kIG9uZSB0aGF0IGlzIGRlZmluZWQgaW4gc3RyaWN0XG4gIC8vIG1vZGUuIEFsc28gbm90ZSB0aGF0IGFueSBraW5kIG9mIHJlY3Vyc2lvbiB3aWxsIG1ha2UgdGhlIHdhbGtlciB1bmFibGVcbiAgLy8gdG8gZ28gcGFzdCBpdC5cbiAgdmFyIGNhbGxlciA9IGFyZ3VtZW50cy5jYWxsZWU7XG4gIHZhciBmdW5jdGlvbnMgPSBbZ2V0RXJyb3JXaXRoU3RhY2tdO1xuICBmb3IgKHZhciBpPTA7IGNhbGxlciAmJiBpIDwgMTA7IGkrKykge1xuICAgIGZ1bmN0aW9ucy5wdXNoKGNhbGxlcik7XG4gICAgaWYgKGNhbGxlci5jYWxsZXIgPT09IGNhbGxlcikgYnJlYWs7XG4gICAgY2FsbGVyID0gY2FsbGVyLmNhbGxlcjtcbiAgfVxuICBjYWxsZXIgPSBudWxsO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoY2xlYW51cCkge1xuICAgIHZhciBmcmFtZXMgPSBudWxsO1xuXG4gICAgaWYgKCFjbGVhbnVwKSB7XG4gICAgICAvLyBQYXJzZSB0aGUgc3RhY2sgdHJhY2VcbiAgICAgIGZyYW1lcyA9IEVycm9yU3RhY2tQYXJzZXIucGFyc2UoZXJyb3IpO1xuICAgICAgLy8gQXR0YWNoIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdG8gdGhlIGZyYW1lcyAoc2tpcHBpbmcgdGhlIG1ha2VyIGZyYW1lcylcbiAgICAgIC8vIGFuZCBjcmVhdGluZyBDYWxsU2l0ZSBvYmplY3RzIGZvciBlYWNoIG9uZS5cbiAgICAgIGZvciAodmFyIGk9MjsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmcmFtZXNbaV0uZnVuY3Rpb24gPSBmdW5jdGlvbnNbaV07XG4gICAgICAgIGZyYW1lc1tpXSA9IG5ldyBDYWxsU2l0ZShmcmFtZXNbaV0pO1xuICAgICAgfVxuXG4gICAgICBmcmFtZXMgPSB0cmltKGZyYW1lcy5zbGljZSgyKSwgc2ZmKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgc2ZmID0gbnVsbDtcbiAgICBlcnJvciA9IG51bGw7XG4gICAgZnVuY3Rpb25zID0gbnVsbDtcblxuICAgIHJldHVybiBmcmFtZXM7XG4gIH07XG59XG5cbi8vIEdlbmVyYXRlcyBhIGdldHRlciBmb3IgdGhlIGNhbGwgc2l0ZSBmcmFtZXNcbi8vIFRPRE86IElmIHdlIG9ic2VydmUgbGVha3Mgd2l0aCBjb21wbGV4IHVzZSBjYXNlcyAoZHVlIHRvIGNsb3N1cmUgc2NvcGVzKVxuLy8gICAgICAgd2UgY2FuIGdlbmVyYXRlIGhlcmUgb3VyIGNvbXBhdCBDYWxsU2l0ZSBvYmplY3RzIHN0b3JpbmcgdGhlIGZ1bmN0aW9uJ3Ncbi8vICAgICAgIHNvdXJjZSBjb2RlIGluc3RlYWQgb2YgYW4gYWN0dWFsIHJlZmVyZW5jZSB0byB0aGVtLCB0aGF0IHNob3VsZCBoZWxwXG4vLyAgICAgICB0aGUgR0Mgc2luY2Ugd2UnbGwgYmUganVzdCBrZWVwaW5nIGxpdGVyYWxzIGFyb3VuZC5cbnZhciBtYWtlRnJhbWVzR2V0dGVyID0gdHlwZW9mIE5hdGl2ZUVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICA/IG1ha2VGcmFtZXNHZXR0ZXJWOFxuICAgICAgICAgICAgICAgICAgICAgOiBtYWtlRnJhbWVzR2V0dGVyQ29tcGF0O1xuXG5cbi8vIE92ZXJyaWRlIFY4IHN0YWNrIHRyYWNlIGJ1aWxkZXIgdG8gaW5qZWN0IG91ciBsb2dpY1xudmFyIG9sZFByZXBhcmVTdGFja1RyYWNlID0gRXJyb3IucHJlcGFyZVN0YWNrVHJhY2U7XG5FcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChlcnJvciwgZnJhbWVzKSB7XG4gIC8vIFdoZW4gY2FsbGVkIGZyb20gbWFrZUZyYW1lc0dldHRlciB3ZSBqdXN0IHdhbnQgdG8gb2J0YWluIHRoZSBmcmFtZXNcbiAgaWYgKGVycm9yID09PSBWOEZSQU1FUykge1xuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICAvLyBGb3J3YXJkIHRvIGFueSBwcmV2aW91c2x5IGRlZmluZWQgYmVoYXZpb3VyXG4gIGlmIChvbGRQcmVwYXJlU3RhY2tUcmFjZSkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gb2xkUHJlcGFyZVN0YWNrVHJhY2UuY2FsbChFcnJvciwgZXJyb3IsIGZyYW1lcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gSnVzdCBpZ25vcmUgdGhlIGVycm9yIChpZToga2FybWEtc291cmNlLW1hcC1zdXBwb3J0KVxuICAgIH1cbiAgfVxuXG4gIC8vIEVtdWxhdGUgZGVmYXVsdCBiZWhhdmlvdXIgKHdpdGggbG9uZy10cmFjZXMpXG4gIHJldHVybiBGYWlsdXJlLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZS5jYWxsKGVycm9yLCB1bndpbmQoZnJhbWVzKSk7XG59O1xuXG4vLyBBdHRhY2ggYSBuZXcgZXhjbHVzaW9uIHByZWRpY2F0ZSBmb3IgZnJhbWVzXG5mdW5jdGlvbiBleGNsdWRlIChjdG9yLCBwcmVkaWNhdGUpIHtcbiAgdmFyIGZuID0gcHJlZGljYXRlO1xuXG4gIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgIGZuID0gZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgICByZXR1cm4gLTEgIT09IGZyYW1lLmdldEZpbGVOYW1lKCkuaW5kZXhPZihwcmVkaWNhdGUpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByZWRpY2F0ZS50ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm4gPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICAgIHJldHVybiBwcmVkaWNhdGUudGVzdChmcmFtZS5nZXRGaWxlTmFtZSgpKTtcbiAgICB9O1xuICB9XG5cbiAgY3Rvci5leGNsdWRlcy5wdXNoKGZuKTtcbn1cblxuLy8gRXhwb3NlIHRoZSBmaWx0ZXIgaW4gdGhlIHJvb3QgRmFpbHVyZSB0eXBlXG5GYWlsdXJlLmV4Y2x1ZGVzID0gW107XG5GYWlsdXJlLmV4Y2x1ZGUgPSBmdW5jdGlvbiBGYWlsdXJlX2V4Y2x1ZGUgKHByZWRpY2F0ZSkge1xuICBleGNsdWRlKEZhaWx1cmUsIHByZWRpY2F0ZSk7XG59O1xuXG4vLyBBdHRhY2ggYSBmcmFtZXMgZ2V0dGVyIHRvIHRoZSBmdW5jdGlvbiBzbyB3ZSBjYW4gcmUtY29uc3RydWN0IGFzeW5jIHN0YWNrcy5cbi8vXG4vLyBOb3RlIHRoYXQgdGhpcyBqdXN0IGF1Z21lbnRzIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBuZXcgcHJvcGVydHksIGl0IGRvZXNuJ3Rcbi8vIGNyZWF0ZSBhIHdyYXBwZXIgZXZlcnkgdGltZSBpdCdzIGNhbGxlZCwgc28gdXNpbmcgaXQgbXVsdGlwbGUgdGltZXMgb24gdGhlXG4vLyBzYW1lIGZ1bmN0aW9uIHdpbGwgaW5kZWVkIG92ZXJ3cml0ZSB0aGUgcHJldmlvdXMgdHJhY2tpbmcgaW5mb3JtYXRpb24uIFRoaXNcbi8vIGlzIGludGVuZGVkIHNpbmNlIGl0J3MgZmFzdGVyIGFuZCBtb3JlIGltcG9ydGFudGx5IGRvZXNuJ3QgYnJlYWsgc29tZSBBUElzXG4vLyB1c2luZyBjYWxsYmFjayByZWZlcmVuY2VzIHRvIHVucmVnaXN0ZXIgdGhlbSBmb3IgaW5zdGFuY2UuXG4vLyBXaGVuIHlvdSB3YW50IHRvIHVzZSB0aGUgc2FtZSBmdW5jdGlvbiB3aXRoIGRpZmZlcmVudCB0cmFja2luZyBpbmZvcm1hdGlvblxuLy8ganVzdCB1c2UgRmFpbHVyZS53cmFwKCkuXG4vL1xuLy8gVGhlIHRyYWNraW5nIGNhbiBiZSBnbG9iYWxseSBkaXNhYmxlZCBieSBzZXR0aW5nIEZhaWx1cmUuVFJBQ0sgdG8gZmFsc2VcbkZhaWx1cmUudHJhY2sgPSBmdW5jdGlvbiBGYWlsdXJlX3RyYWNrIChmbiwgc2ZmKSB7XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICAvLyBDbGVhbiB1cCBwcmV2aW91cyBmcmFtZXMgdG8gaGVscCB0aGUgR0NcbiAgaWYgKHR5cGVvZiBmbltTWU1CT0xfRlJBTUVTXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGZuW1NZTUJPTF9GUkFNRVNdKHRydWUpO1xuICB9XG5cbiAgaWYgKEZhaWx1cmUuVFJBQ0spIHtcbiAgICBmbltTWU1CT0xfRlJBTUVTXSA9IG51bGw7XG4gICAgZm5bU1lNQk9MX0ZSQU1FU10gPSBtYWtlRnJhbWVzR2V0dGVyKHNmZiB8fCBGYWlsdXJlX3RyYWNrKTtcbiAgfVxuXG4gIHJldHVybiBmbjtcbn07XG5cbi8vIFdyYXBzIHRoZSBmdW5jdGlvbiBiZWZvcmUgYW5ub3RhdGluZyBpdCB3aXRoIHRyYWNraW5nIGluZm9ybWF0aW9uLCB0aGlzXG4vLyBhbGxvd3MgdG8gdHJhY2sgbXVsdGlwbGUgc2NoZWR1bGxpbmdzIG9mIGEgc2luZ2xlIGZ1bmN0aW9uLlxuRmFpbHVyZS53cmFwID0gZnVuY3Rpb24gRmFpbHVyZV93cmFwIChmbikge1xuICB2YXIgd3JhcHBlciA9IEZhaWx1cmUuaWdub3JlKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIEZhaWx1cmUudHJhY2sod3JhcHBlciwgRmFpbHVyZV93cmFwKTtcbn07XG5cbi8vIE1hcmsgYSBmdW5jdGlvbiB0byBiZSBpZ25vcmVkIHdoZW4gZ2VuZXJhdGluZyBzdGFjayB0cmFjZXNcbkZhaWx1cmUuaWdub3JlID0gZnVuY3Rpb24gRmFpbHVyZV9pZ25vcmUgKGZuKSB7XG4gIGZuW1NZTUJPTF9JR05PUkVdID0gdHJ1ZTtcbiAgcmV0dXJuIGZuO1xufTtcblxuRmFpbHVyZS5zZXRUaW1lb3V0ID0gZnVuY3Rpb24gRmFpbHVyZV9zZXRUaW1lb3V0ICgpIHtcbiAgYXJndW1lbnRzWzBdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbMF0sIEZhaWx1cmVfc2V0VGltZW91dCk7XG4gIHJldHVybiBzZXRUaW1lb3V0LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG5GYWlsdXJlLm5leHRUaWNrID0gZnVuY3Rpb24gRmFpbHVyZV9uZXh0VGljayAoKSB7XG4gIGFyZ3VtZW50c1swXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzWzBdLCBGYWlsdXJlX25leHRUaWNrKTtcbiAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2suYXBwbHkocHJvY2VzcywgYXJndW1lbnRzKTtcbn07XG5cbkZhaWx1cmUucGF0Y2ggPSBmdW5jdGlvbiBGYWlsdXJlX3BhdGNoKG9iaiwgbmFtZSwgaWR4KSB7XG4gIGlmIChvYmogJiYgdHlwZW9mIG9ialtuYW1lXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBcIicgKyBuYW1lICsgJ1wiIG1ldGhvZCcpO1xuICB9XG5cbiAgdmFyIG9yaWdpbmFsID0gb2JqW25hbWVdO1xuXG4gIC8vIFdoZW4gdGhlIGV4YWN0IGFyZ3VtZW50IGluZGV4IGlzIHByb3ZpZGVkIHVzZSBhbiBvcHRpbWl6ZWQgY29kZSBwYXRoXG4gIGlmICh0eXBlb2YgaWR4ID09PSAnbnVtYmVyJykge1xuXG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgYXJndW1lbnRzW2lkeF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1tpZHhdLCBvYmpbbmFtZV0pO1xuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAvLyBPdGhlcndpc2UgZGV0ZWN0IHRoZSBmdW5jdGlvbnMgdG8gdHJhY2sgYXQgaW52b2thdGlvbiB0aW1lXG4gIH0gZWxzZSB7XG5cbiAgICBvYmpbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGFyZ3VtZW50c1tpXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzW2ldLCBvYmpbbmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSB3cmFwcGVyIHdpdGggYW55IHByb3BlcnRpZXMgZnJvbSB0aGUgb3JpZ2luYWxcbiAgZm9yICh2YXIgayBpbiBvcmlnaW5hbCkgaWYgKG9yaWdpbmFsLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgb2JqW25hbWVdW2tdID0gb3JpZ2luYWxba107XG4gIH1cblxuICByZXR1cm4gb2JqW25hbWVdO1xufTtcblxuLy8gSGVscGVyIHRvIGNyZWF0ZSBuZXcgRmFpbHVyZSB0eXBlc1xuRmFpbHVyZS5jcmVhdGUgPSBmdW5jdGlvbiAobmFtZSwgcHJvcHMpIHtcbiAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBGYWlsdXJlKCdFeHBlY3RlZCBhIG5hbWUgYXMgZmlyc3QgYXJndW1lbnQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGN0b3IgKG1lc3NhZ2UsIHNmZikge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGYWlsdXJlKSkge1xuICAgICAgcmV0dXJuIG5ldyBjdG9yKG1lc3NhZ2UsIHNmZik7XG4gICAgfVxuICAgIEZhaWx1cmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIC8vIEF1Z21lbnQgY29uc3RydWN0b3JcbiAgY3Rvci5leGNsdWRlcyA9IFtdO1xuICBjdG9yLmV4Y2x1ZGUgPSBmdW5jdGlvbiAocHJlZGljYXRlKSB7XG4gICAgZXhjbHVkZShjdG9yLCBwcmVkaWNhdGUpO1xuICB9O1xuXG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShGYWlsdXJlLnByb3RvdHlwZSk7XG4gIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvcjtcbiAgY3Rvci5wcm90b3R5cGUubmFtZSA9IG5hbWU7XG4gIGlmICh0eXBlb2YgcHJvcHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjdG9yLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZSA9IHByb3BzO1xuICB9IGVsc2UgaWYgKHByb3BzKSB7XG4gICAgT2JqZWN0LmtleXMocHJvcHMpLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIGN0b3IucHJvdG90eXBlW3Byb3BdID0gcHJvcDtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY3Rvcjtcbn07XG5cbnZhciBidWlsdGluRXJyb3JUeXBlcyA9IFtcbiAgJ0Vycm9yJywgJ1R5cGVFcnJvcicsICdSYW5nZUVycm9yJywgJ1JlZmVyZW5jZUVycm9yJywgJ1N5bnRheEVycm9yJyxcbiAgJ0V2YWxFcnJvcicsICdVUklFcnJvcicsICdJbnRlcm5hbEVycm9yJ1xuXTtcbnZhciBidWlsdGluRXJyb3JzID0ge307XG5cbkZhaWx1cmUuaW5zdGFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyA/IHdpbmRvdyA6IGdsb2JhbDtcblxuICBidWlsdGluRXJyb3JUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgaWYgKHJvb3RbdHlwZV0gJiYgIWJ1aWx0aW5FcnJvcnNbdHlwZV0pIHtcbiAgICAgIGJ1aWx0aW5FcnJvcnNbdHlwZV0gPSByb290W3R5cGVdO1xuICAgICAgcm9vdFt0eXBlXSA9IEZhaWx1cmUuY3JlYXRlKHR5cGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQWxsb3cgdXNhZ2U6IHZhciBGYWlsdXJlID0gcmVxdWlyZSgnZmFpbHVyZScpLmluc3RhbGwoKVxuICByZXR1cm4gRmFpbHVyZTtcbn07XG5cbkZhaWx1cmUudW5pbnN0YWxsID0gZnVuY3Rpb24gKCkge1xuICBidWlsdGluRXJyb3JUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgcm9vdFt0eXBlXSA9IGJ1aWx0aW5FcnJvcnNbdHlwZV0gfHwgcm9vdFt0eXBlXTtcbiAgfSk7XG59O1xuXG5cbnZhciBwcm90byA9IEZhaWx1cmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xucHJvdG8uY29uc3RydWN0b3IgPSBGYWlsdXJlO1xuXG5wcm90by5uYW1lID0gJ0ZhaWx1cmUnO1xucHJvdG8ubWVzc2FnZSA9ICcnO1xuXG5pZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdmcmFtZXMnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBVc2UgdHJpbW1pbmcganVzdCBpbiBjYXNlIHRoZSBzZmYgd2FzIGRlZmluZWQgYWZ0ZXIgY29uc3RydWN0aW5nXG4gICAgICB2YXIgZnJhbWVzID0gdW53aW5kKHRyaW0odGhpcy5fZ2V0RnJhbWVzKCksIHRoaXMuc2ZmKSk7XG5cbiAgICAgIC8vIENhY2hlIG5leHQgYWNjZXNzZXMgdG8gdGhlIHByb3BlcnR5XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2ZyYW1lcycsIHtcbiAgICAgICAgdmFsdWU6IGZyYW1lcyxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICAvLyBDbGVhbiB1cCB0aGUgZ2V0dGVyIGNsb3N1cmVcbiAgICAgIHRoaXMuX2dldEZyYW1lcyA9IG51bGw7XG5cbiAgICAgIHJldHVybiBmcmFtZXM7XG4gICAgfVxuICB9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdzdGFjaycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlU3RhY2tUcmFjZSgpO1xuICAgIH1cbiAgfSk7XG59XG5cbnByb3RvLmdlbmVyYXRlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGV4Y2x1ZGVzID0gdGhpcy5jb25zdHJ1Y3Rvci5leGNsdWRlcztcbiAgdmFyIGluY2x1ZGUsIGZyYW1lcyA9IFtdO1xuXG4gIC8vIFNwZWNpZmljIHByb3RvdHlwZXMgaW5oZXJpdCB0aGUgZXhjbHVkZXMgZnJvbSBGYWlsdXJlXG4gIGlmIChleGNsdWRlcyAhPT0gRmFpbHVyZS5leGNsdWRlcykge1xuICAgIGV4Y2x1ZGVzLnB1c2guYXBwbHkoZXhjbHVkZXMsIEZhaWx1cmUuZXhjbHVkZXMpO1xuICB9XG5cbiAgLy8gQXBwbHkgZmlsdGVyaW5nXG4gIGZvciAodmFyIGk9MDsgaSA8IHRoaXMuZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaW5jbHVkZSA9IHRydWU7XG4gICAgaWYgKHRoaXMuZnJhbWVzW2ldKSB7XG4gICAgICBmb3IgKHZhciBqPTA7IGluY2x1ZGUgJiYgaiA8IGV4Y2x1ZGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGluY2x1ZGUgJj0gIWV4Y2x1ZGVzW2pdLmNhbGwodGhpcywgdGhpcy5mcmFtZXNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaW5jbHVkZSkge1xuICAgICAgZnJhbWVzLnB1c2godGhpcy5mcmFtZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIEhvbm9yIGFueSBwcmV2aW91c2x5IGRlZmluZWQgc3RhY2t0cmFjZSBmb3JtYXR0ZXIgYnlcbiAgLy8gYWxsb3dpbmcgaXQgZmluYWxseSBmb3JtYXQgdGhlIGZyYW1lcy4gVGhpcyBpcyBuZWVkZWRcbiAgLy8gd2hlbiB1c2luZyBub2RlLXNvdXJjZS1tYXAtc3VwcG9ydCBmb3IgaW5zdGFuY2UuXG4gIC8vIFRPRE86IENhbiB3ZSBtYXAgdGhlIFwibnVsbFwiIGZyYW1lcyB0byBhIENhbGxGcmFtZSBzaGltP1xuICBpZiAob2xkUHJlcGFyZVN0YWNrVHJhY2UpIHtcbiAgICBmcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiAhIXg7IH0pO1xuICAgIHJldHVybiBvbGRQcmVwYXJlU3RhY2tUcmFjZS5jYWxsKEVycm9yLCB0aGlzLCBmcmFtZXMpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMucHJlcGFyZVN0YWNrVHJhY2UoZnJhbWVzKTtcbn07XG5cbnByb3RvLnByZXBhcmVTdGFja1RyYWNlID0gZnVuY3Rpb24gKGZyYW1lcykge1xuICB2YXIgbGluZXMgPSBbdGhpc107XG4gIGZvciAodmFyIGk9MDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBmcmFtZXNbaV0gPyBGYWlsdXJlLkZSQU1FX1BSRUZJWCArIGZyYW1lc1tpXSA6IEZhaWx1cmUuRlJBTUVfRU1QVFlcbiAgICApO1xuICB9XG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBGYWlsdXJlO1xuIl19
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2Vycm9yLmpzIiwibGliL2V4cGVjdGF0aW9uLmpzIiwibGliL21hdGNoZXIuanMiLCJsaWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uLmpzIiwibGliL21hdGNoZXJzL2NvcmUuanMiLCJsaWIvbWF0Y2hlcnMvcHJvbWlzZS5qcyIsImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyIsImxpYi9wYXRjaGVzLmpzIiwibGliL3Jlc29sdmVycy5qcyIsImxpYi9zaG91bGQuanMiLCJsaWIvdXRpbC5qcyIsIm1haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9jYWxsLXNpdGUuanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9saWIvZmFpbHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL21haW4uanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9ub2RlX21vZHVsZXMvZXJyb3Itc3RhY2stcGFyc2VyL2Vycm9yLXN0YWNrLXBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL25vZGVfbW9kdWxlcy9lcnJvci1zdGFjay1wYXJzZXIvbm9kZV9tb2R1bGVzL3N0YWNrZnJhbWUvc3RhY2tmcmFtZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMTVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Y0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIENoYWluID0gcmVxdWlyZSgnLi9jaGFpbicpO1xudmFyIE1hdGNoZXIgPSByZXF1aXJlKCcuL21hdGNoZXInKTtcbnZhciBFeHBlY3RhdGlvbiA9IHJlcXVpcmUoJy4vZXhwZWN0YXRpb24nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cblxudmFyIGRlZlByb3AgPSB1dGlsLmJpbmQoT2JqZWN0LmRlZmluZVByb3BlcnR5LCBPYmplY3QpO1xuXG5cbi8vIFB1YmxpYyBpbnRlcmZhY2VcbmZ1bmN0aW9uIGFzcyAodmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IENoYWluKCk7XG4gIH1cbiAgcmV0dXJuIG5ldyBDaGFpbih2YWx1ZSk7XG59XG5cbi8vIERlZmVycmVkIGZhY3RvcnlcbmFzcy5fID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgQ2hhaW4odmFsdWUpLl87XG59O1xuXG4vLyBHbG9iYWwgcmVnaXN0cnkgb2YgbWF0Y2hlcnMgKHVzZWQgZm9yIGFzcy5oZWxwKVxuYXNzLm1hdGNoZXJzID0gW107XG5cbi8vIGFzcy5oZWxwIGR1bXBzIHRoZSBoZWxwIG9mIGVhY2ggbWF0Y2hlciByZWdpc3RlcmVkXG5kZWZQcm9wKGFzcywgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gJyc7XG4gICAgXy5mb3JFYWNoKGFzcy5tYXRjaGVycywgZnVuY3Rpb24gKG1hdGNoZXIpIHtcbiAgICAgIC8vIFRPRE86IFRoaXMgY2FuIGJlIG5pY2VyXG4gICAgICB2YXIgZm4gPSBtYXRjaGVyLnRlc3QudG9TdHJpbmcoKTtcbiAgICAgIHZhciBhcmdzID0gZm4ucmVwbGFjZSgvXmZ1bmN0aW9uXFxzKlxcKChbXlxcKV0qKVxcKVtcXFNcXHNdKi8sICckMScpO1xuICAgICAgYXJncyA9IGFyZ3Muc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgudHJpbSgpOyB9KTtcbiAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgIGZuID0gYXJncy5sZW5ndGggPyAnICgnICsgYXJncy5qb2luKCcsICcpICsgJyknIDogJyc7XG5cbiAgICAgIHMgKz0gJz4gLicgKyBtYXRjaGVyLm5hbWUgKyBmbiArICdcXG5cXG4nO1xuICAgICAgcyArPSAnICAnICsgbWF0Y2hlci5oZWxwLnJlcGxhY2UoL1xcbi9nLCAnXFxuICAnKTtcbiAgICAgIHMgKz0gJ1xcblxcbic7XG4gICAgfSk7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn0pO1xuXG5hc3Mub2sgPSBmdW5jdGlvbiAoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSB0cnVpc2ggdmFsdWUnO1xuICB9XG4gIGFzcy5kZXNjKG1lc3NhZ2UpLnRydXRoeS5hc3NlcnQoY29uZCwgYXNzLm9rKTtcbiAgcmV0dXJuIGNvbmQ7XG59O1xuXG5hc3Mua28gPSBmdW5jdGlvbiAoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIG1lc3NhZ2UgPSAnZXhwZWN0ZWQgYSBmYWxzeSB2YWx1ZSc7XG4gIH1cbiAgYXNzLmRlc2MobWVzc2FnZSkuZmFsc3kuYXNzZXJ0KGNvbmQsIGFzcy5rbyk7XG4gIHJldHVybiBjb25kO1xufTtcblxuLy8gUmVzZXRzIG9yIHZlcmlmaWVzIHRoZSBudW1iZXIgb2YgbWFya3Mgc28gZmFyXG4vLyBGb3JjZWQgYXJpdHktMCB0byBiZSBjb21wYXRpYmxlIHdpdGg6IGJlZm9yZUVhY2goYXNzLm1hcmtzKVxuYXNzLm1hcmtzID0gZnVuY3Rpb24gKC8qIGV4cGVjdGVkLCBkZXNjICovKSB7XG4gIHZhciBleHBlY3RlZCA9IGFyZ3VtZW50c1swXTtcbiAgdmFyIGRlc2MgPSBhcmd1bWVudHNbMV07XG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgZXhwZWN0ZWQgPSBhc3MubWFya3MuY291bnRlcjtcbiAgICBhc3MubWFya3MuY291bnRlciA9IDA7XG4gICAgcmV0dXJuIGV4cGVjdGVkOyAgLy8gcmV0dXJuIGJhY2sgaG93IG1hbnkgdGhlcmUgd2VyZVxuICB9XG5cbiAgYXNzLmRlc2MoZGVzYyB8fCAnYXNzLm1hcmtzJykuZXEoZXhwZWN0ZWQpXG4gIC5hc3NlcnQoYXNzLm1hcmtzLmNvdW50ZXIsIGFzcy5tYXJrcyk7XG59O1xuYXNzLm1hcmtzLmNvdW50ZXIgPSAwO1xuXG5cbi8vIEhlbHBlciB0byByZWdpc3RlciBuZXcgbWF0Y2hlcnMgaW4gdGhlIHJlZ2lzdHJ5XG5hc3MucmVnaXN0ZXIgPSBmdW5jdGlvbiAobmFtZSwgbWF0Y2hlcikge1xuICBpZiAobmFtZSBpbnN0YW5jZW9mIE1hdGNoZXIpIHtcbiAgICBtYXRjaGVyID0gbmFtZTtcbiAgICBuYW1lID0gbWF0Y2hlci5uYW1lO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgIE9iamVjdC5rZXlzKG5hbWUpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgYXNzLnJlZ2lzdGVyKGtleSwgbmFtZVtrZXldKTtcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSB7ICAvLyBBc3N1bWUgYSBkZXNjcmlwdG9yIHdhcyBnaXZlblxuICAgIC8vIENyZWF0ZSB0aGUgYWxpYXNlcyBmaXJzdFxuICAgIF8uZm9yRWFjaChtYXRjaGVyLmFsaWFzZXMsIGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgYXNzLnJlZ2lzdGVyKG5ldyBNYXRjaGVyKGFsaWFzLCBtYXRjaGVyKSk7XG4gICAgfSk7XG5cbiAgICBtYXRjaGVyID0gbmV3IE1hdGNoZXIobmFtZSwgbWF0Y2hlcik7XG4gIH1cblxuICAvLyBLZWVwIHRoZSBtYXRjaGVyIGFyb3VuZCBmb3IgYXNzLmhlbHBcbiAgYXNzLm1hdGNoZXJzLnB1c2gobWF0Y2hlcik7XG5cblxuICAvLyBUT0RPOiBBbGxvdyBtYXRjaGVycyB0byBiZSBvdmVycmlkZGVuIGFuZCBhbHNvIG92ZXJsb2FkZWRcbiAgLy8gICAgICAgaWYgdGhleSBoYXZlIGFuIFwib3ZlcmxvYWRcIiBtZXRob2QgaXQgY2FuIGJlIHVzZWRcbiAgLy8gICAgICAgdG8gY2hlY2sgd2hpY2ggb25lIHNob3VsZCBiZSB1c2VkLlxuICAvLyAgICAgICBCZXR0ZXIgSWRlYSAoSSB0aGluayksIGluc3RlYWQgb2Ygb3ZlcmxvYWRpbmcgYmFzZWRcbiAgLy8gICAgICAgb24gdGhlIHZhbHVlIHVuZGVyIHRlc3QsIHdoaWNoIG1heSBwcm9kdWNlIGlzc3Vlc1xuICAvLyAgICAgICBzaW5jZSB3ZSBkb24ndCBrbm93IGZvciBzdXJlIHdoYXQgdGhhdCB2YWx1ZSBpcyxcbiAgLy8gICAgICAgYWxsb3cgbWF0Y2hlcnMgdG8gaW50cm9kdWNlIGEgbmV3IFwicHJvdG90eXBlXCIgZm9yXG4gIC8vICAgICAgIHRoZSBjaGFpbiwgdGhhdCBpcywgYSAuZG9tIG1hdGNoZXIgd2lsbCBpbmNsdWRlXG4gIC8vICAgICAgIGFsbCB0aGUgY29yZSBleHBlY3RhdGlvbnMgYnV0IHRoZW4gYWxzbyBvdmVycmlkZXNcbiAgLy8gICAgICAgYW5kIG5ldyBvbmVzIHVudGlsIHRoZSBlbmQgb2YgdGhlIGNoYWluLlxuXG5cbiAgLy8gTWF0Y2hlciBmdW5jdGlvbnMgd2l0aCBhIHNpbmdsZSBhcmd1bWVudCBhcmUgZ2V0dGVyc1xuICB2YXIgZm5LZXkgPSBtYXRjaGVyLmFyaXR5ID09PSAxID8gJ2dldCcgOiAndmFsdWUnO1xuICB2YXIgcHJvcCA9IHtcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfTtcbiAgaWYgKGZuS2V5ID09PSAndmFsdWUnKSB7XG4gICAgcHJvcC53cml0YWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgLy8gQXVnbWVudCB0aGUgQ2hhaW4gcHJvdG90eXBlXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gZm4gKCkge1xuICAgIHZhciBleHAgPSBuZXcgRXhwZWN0YXRpb24obWF0Y2hlciwgYXJndW1lbnRzKTtcbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucHVzaChleHApO1xuICAgIGlmICghdGhpcy5fX2RlZmVycmVkX18pIHtcbiAgICAgIHRoaXMuYXNzZXJ0KHRoaXMudmFsdWUsIGZuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHByb3ApO1xuXG4gIC8vIEF1Z21lbnQgdGhlIHN0YXRpYyBpbnRlcmZhY2VcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoYWluID0gbmV3IENoYWluKCk7XG5cbiAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICByZXR1cm4gY2hhaW5bbmFtZV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYWluW25hbWVdLmFwcGx5KGNoYWluLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIGRlZlByb3AoYXNzLCBuYW1lLCBwcm9wKTtcblxuICAvLyBQYXNzIHRocm91Z2ggZm9yIGNoYWluc1xuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uIHBhc3N0aHJvdWdoKCkge1xuICAgIHJldHVybiB0aGlzW25hbWVdLmFzc2VydCh0aGlzLnZhbHVlLCBwYXNzdGhyb3VnaCkudmFsdWVPZigpO1xuICB9O1xuICBwcm9wLmVudW1lcmFibGUgPSBmYWxzZTtcbiAgZGVmUHJvcChDaGFpbi5wcm90b3R5cGUsICckJyArIG5hbWUsIHByb3ApO1xuXG4gIC8vIFBhc3MgdGhyb3VnaCBzdGF0aWMgY29uc3RydWN0b3JcbiAgZGVmUHJvcChhc3MsICckJyArIG5hbWUsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoZm5LZXkgPT09ICdnZXQnKSB7XG4gICAgICAgIHJldHVybiBhc3ModmFsdWUpWyckJyArIG5hbWVdO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgZXhwcmVzc2lvbiBmb3IgdGhlIGV4cGVjdGF0aW9uXG4gICAgICB2YXIgY2hhaW4gPSBuZXcgQ2hhaW4oKTtcbiAgICAgIGNoYWluW25hbWVdLmFwcGx5KGNoYWluLCBhcmd1bWVudHMpO1xuICAgICAgLy8gUmV0dXJuIGEgY2FsbGFibGUgdGhhdCBhc3NlcnRzIHVwb24gcmVjZWl2aW5nIGEgdmFsdWVcbiAgICAgIHJldHVybiBjaGFpbi50aHJvdWdoO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBhc3M7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOWhjM011YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SjJZWElnWHlBOUlDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzTGw4Z09pQjBlWEJsYjJZZ1oyeHZZbUZzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z1oyeHZZbUZzTGw4Z09pQnVkV3hzS1R0Y2JseHVkbUZ5SUVOb1lXbHVJRDBnY21WeGRXbHlaU2duTGk5amFHRnBiaWNwTzF4dWRtRnlJRTFoZEdOb1pYSWdQU0J5WlhGMWFYSmxLQ2N1TDIxaGRHTm9aWEluS1R0Y2JuWmhjaUJGZUhCbFkzUmhkR2x2YmlBOUlISmxjWFZwY21Vb0p5NHZaWGh3WldOMFlYUnBiMjRuS1R0Y2JuWmhjaUIxZEdsc0lEMGdjbVZ4ZFdseVpTZ25MaTkxZEdsc0p5azdYRzVjYmx4dWRtRnlJR1JsWmxCeWIzQWdQU0IxZEdsc0xtSnBibVFvVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUxDQlBZbXBsWTNRcE8xeHVYRzVjYmk4dklGQjFZbXhwWXlCcGJuUmxjbVpoWTJWY2JtWjFibU4wYVc5dUlHRnpjeUFvZG1Gc2RXVXBJSHRjYmlBZ2FXWWdLR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dQVDA5SURBcElIdGNiaUFnSUNCeVpYUjFjbTRnYm1WM0lFTm9ZV2x1S0NrN1hHNGdJSDFjYmlBZ2NtVjBkWEp1SUc1bGR5QkRhR0ZwYmloMllXeDFaU2s3WEc1OVhHNWNiaTh2SUVSbFptVnljbVZrSUdaaFkzUnZjbmxjYm1GemN5NWZJRDBnWm5WdVkzUnBiMjRnS0haaGJIVmxLU0I3WEc0Z0lISmxkSFZ5YmlCdVpYY2dRMmhoYVc0b2RtRnNkV1VwTGw4N1hHNTlPMXh1WEc0dkx5QkhiRzlpWVd3Z2NtVm5hWE4wY25rZ2IyWWdiV0YwWTJobGNuTWdLSFZ6WldRZ1ptOXlJR0Z6Y3k1b1pXeHdLVnh1WVhOekxtMWhkR05vWlhKeklEMGdXMTA3WEc1Y2JpOHZJR0Z6Y3k1b1pXeHdJR1IxYlhCeklIUm9aU0JvWld4d0lHOW1JR1ZoWTJnZ2JXRjBZMmhsY2lCeVpXZHBjM1JsY21Wa1hHNWtaV1pRY205d0tHRnpjeXdnSjJobGJIQW5MQ0I3WEc0Z0lHZGxkRG9nWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUhaaGNpQnpJRDBnSnljN1hHNGdJQ0FnWHk1bWIzSkZZV05vS0dGemN5NXRZWFJqYUdWeWN5d2dablZ1WTNScGIyNGdLRzFoZEdOb1pYSXBJSHRjYmlBZ0lDQWdJQzh2SUZSUFJFODZJRlJvYVhNZ1kyRnVJR0psSUc1cFkyVnlYRzRnSUNBZ0lDQjJZWElnWm00Z1BTQnRZWFJqYUdWeUxuUmxjM1F1ZEc5VGRISnBibWNvS1R0Y2JpQWdJQ0FnSUhaaGNpQmhjbWR6SUQwZ1ptNHVjbVZ3YkdGalpTZ3ZYbVoxYm1OMGFXOXVYRnh6S2x4Y0tDaGJYbHhjS1YwcUtWeGNLVnRjWEZOY1hITmRLaThzSUNja01TY3BPMXh1SUNBZ0lDQWdZWEpuY3lBOUlHRnlaM011YzNCc2FYUW9KeXduS1M1dFlYQW9ablZ1WTNScGIyNGdLSGdwSUhzZ2NtVjBkWEp1SUhndWRISnBiU2dwT3lCOUtUdGNiaUFnSUNBZ0lHRnlaM011YzJocFpuUW9LVHRjYmlBZ0lDQWdJR1p1SUQwZ1lYSm5jeTVzWlc1bmRHZ2dQeUFuSUNnbklDc2dZWEpuY3k1cWIybHVLQ2NzSUNjcElDc2dKeWtuSURvZ0p5YzdYRzVjYmlBZ0lDQWdJSE1nS3owZ0p6NGdMaWNnS3lCdFlYUmphR1Z5TG01aGJXVWdLeUJtYmlBcklDZGNYRzVjWEc0bk8xeHVJQ0FnSUNBZ2N5QXJQU0FuSUNBbklDc2diV0YwWTJobGNpNW9aV3h3TG5KbGNHeGhZMlVvTDF4Y2JpOW5MQ0FuWEZ4dUlDQW5LVHRjYmlBZ0lDQWdJSE1nS3owZ0oxeGNibHhjYmljN1hHNGdJQ0FnZlNrN1hHNGdJQ0FnY21WMGRYSnVJSE03WEc0Z0lIMWNibjBwTzF4dVhHNWhjM011YjJzZ1BTQm1kVzVqZEdsdmJpQW9ZMjl1WkN3Z2JXVnpjMkZuWlNrZ2UxeHVJQ0JwWmlBb1lYSm5kVzFsYm5SekxteGxibWQwYUNBOVBUMGdNU2tnZTF4dUlDQWdJRzFsYzNOaFoyVWdQU0FuWlhod1pXTjBaV1FnWVNCMGNuVnBjMmdnZG1Gc2RXVW5PMXh1SUNCOVhHNGdJR0Z6Y3k1a1pYTmpLRzFsYzNOaFoyVXBMblJ5ZFhSb2VTNWhjM05sY25Rb1kyOXVaQ3dnWVhOekxtOXJLVHRjYmlBZ2NtVjBkWEp1SUdOdmJtUTdYRzU5TzF4dVhHNWhjM011YTI4Z1BTQm1kVzVqZEdsdmJpQW9ZMjl1WkN3Z2JXVnpjMkZuWlNrZ2UxeHVJQ0JwWmlBb1lYSm5kVzFsYm5SekxteGxibWQwYUNBOVBUMGdNU2tnZTF4dUlDQWdJRzFsYzNOaFoyVWdQU0FuWlhod1pXTjBaV1FnWVNCbVlXeHplU0IyWVd4MVpTYzdYRzRnSUgxY2JpQWdZWE56TG1SbGMyTW9iV1Z6YzJGblpTa3VabUZzYzNrdVlYTnpaWEowS0dOdmJtUXNJR0Z6Y3k1cmJ5azdYRzRnSUhKbGRIVnliaUJqYjI1a08xeHVmVHRjYmx4dUx5OGdVbVZ6WlhSeklHOXlJSFpsY21sbWFXVnpJSFJvWlNCdWRXMWlaWElnYjJZZ2JXRnlhM01nYzI4Z1ptRnlYRzR2THlCR2IzSmpaV1FnWVhKcGRIa3RNQ0IwYnlCaVpTQmpiMjF3WVhScFlteGxJSGRwZEdnNklHSmxabTl5WlVWaFkyZ29ZWE56TG0xaGNtdHpLVnh1WVhOekxtMWhjbXR6SUQwZ1puVnVZM1JwYjI0Z0tDOHFJR1Y0Y0dWamRHVmtMQ0JrWlhOaklDb3ZLU0I3WEc0Z0lIWmhjaUJsZUhCbFkzUmxaQ0E5SUdGeVozVnRaVzUwYzFzd1hUdGNiaUFnZG1GeUlHUmxjMk1nUFNCaGNtZDFiV1Z1ZEhOYk1WMDdYRzRnSUdsbUlDaDBlWEJsYjJZZ1pYaHdaV04wWldRZ1BUMDlJQ2QxYm1SbFptbHVaV1FuS1NCN1hHNGdJQ0FnWlhod1pXTjBaV1FnUFNCaGMzTXViV0Z5YTNNdVkyOTFiblJsY2p0Y2JpQWdJQ0JoYzNNdWJXRnlhM011WTI5MWJuUmxjaUE5SURBN1hHNGdJQ0FnY21WMGRYSnVJR1Y0Y0dWamRHVmtPeUFnTHk4Z2NtVjBkWEp1SUdKaFkyc2dhRzkzSUcxaGJua2dkR2hsY21VZ2QyVnlaVnh1SUNCOVhHNWNiaUFnWVhOekxtUmxjMk1vWkdWell5QjhmQ0FuWVhOekxtMWhjbXR6SnlrdVpYRW9aWGh3WldOMFpXUXBYRzRnSUM1aGMzTmxjblFvWVhOekxtMWhjbXR6TG1OdmRXNTBaWElzSUdGemN5NXRZWEpyY3lrN1hHNTlPMXh1WVhOekxtMWhjbXR6TG1OdmRXNTBaWElnUFNBd08xeHVYRzVjYmk4dklFaGxiSEJsY2lCMGJ5QnlaV2RwYzNSbGNpQnVaWGNnYldGMFkyaGxjbk1nYVc0Z2RHaGxJSEpsWjJsemRISjVYRzVoYzNNdWNtVm5hWE4wWlhJZ1BTQm1kVzVqZEdsdmJpQW9ibUZ0WlN3Z2JXRjBZMmhsY2lrZ2UxeHVJQ0JwWmlBb2JtRnRaU0JwYm5OMFlXNWpaVzltSUUxaGRHTm9aWElwSUh0Y2JpQWdJQ0J0WVhSamFHVnlJRDBnYm1GdFpUdGNiaUFnSUNCdVlXMWxJRDBnYldGMFkyaGxjaTV1WVcxbE8xeHVJQ0I5SUdWc2MyVWdhV1lnS0hSNWNHVnZaaUJ1WVcxbElEMDlQU0FuYjJKcVpXTjBKeWtnZTF4dUlDQWdJRTlpYW1WamRDNXJaWGx6S0c1aGJXVXBMbVp2Y2tWaFkyZ29ablZ1WTNScGIyNGdLR3RsZVNrZ2UxeHVJQ0FnSUNBZ1lYTnpMbkpsWjJsemRHVnlLR3RsZVN3Z2JtRnRaVnRyWlhsZEtUdGNiaUFnSUNCOUtUdGNiaUFnSUNCeVpYUjFjbTQ3WEc0Z0lIMGdaV3h6WlNCN0lDQXZMeUJCYzNOMWJXVWdZU0JrWlhOamNtbHdkRzl5SUhkaGN5Qm5hWFpsYmx4dUlDQWdJQzh2SUVOeVpXRjBaU0IwYUdVZ1lXeHBZWE5sY3lCbWFYSnpkRnh1SUNBZ0lGOHVabTl5UldGamFDaHRZWFJqYUdWeUxtRnNhV0Z6WlhNc0lHWjFibU4wYVc5dUlDaGhiR2xoY3lrZ2UxeHVJQ0FnSUNBZ1lYTnpMbkpsWjJsemRHVnlLRzVsZHlCTllYUmphR1Z5S0dGc2FXRnpMQ0J0WVhSamFHVnlLU2s3WEc0Z0lDQWdmU2s3WEc1Y2JpQWdJQ0J0WVhSamFHVnlJRDBnYm1WM0lFMWhkR05vWlhJb2JtRnRaU3dnYldGMFkyaGxjaWs3WEc0Z0lIMWNibHh1SUNBdkx5QkxaV1Z3SUhSb1pTQnRZWFJqYUdWeUlHRnliM1Z1WkNCbWIzSWdZWE56TG1obGJIQmNiaUFnWVhOekxtMWhkR05vWlhKekxuQjFjMmdvYldGMFkyaGxjaWs3WEc1Y2JseHVJQ0F2THlCVVQwUlBPaUJCYkd4dmR5QnRZWFJqYUdWeWN5QjBieUJpWlNCdmRtVnljbWxrWkdWdUlHRnVaQ0JoYkhOdklHOTJaWEpzYjJGa1pXUmNiaUFnTHk4Z0lDQWdJQ0FnYVdZZ2RHaGxlU0JvWVhabElHRnVJRndpYjNabGNteHZZV1JjSWlCdFpYUm9iMlFnYVhRZ1kyRnVJR0psSUhWelpXUmNiaUFnTHk4Z0lDQWdJQ0FnZEc4Z1kyaGxZMnNnZDJocFkyZ2diMjVsSUhOb2IzVnNaQ0JpWlNCMWMyVmtMbHh1SUNBdkx5QWdJQ0FnSUNCQ1pYUjBaWElnU1dSbFlTQW9TU0IwYUdsdWF5a3NJR2x1YzNSbFlXUWdiMllnYjNabGNteHZZV1JwYm1jZ1ltRnpaV1JjYmlBZ0x5OGdJQ0FnSUNBZ2IyNGdkR2hsSUhaaGJIVmxJSFZ1WkdWeUlIUmxjM1FzSUhkb2FXTm9JRzFoZVNCd2NtOWtkV05sSUdsemMzVmxjMXh1SUNBdkx5QWdJQ0FnSUNCemFXNWpaU0IzWlNCa2IyNG5kQ0JyYm05M0lHWnZjaUJ6ZFhKbElIZG9ZWFFnZEdoaGRDQjJZV3gxWlNCcGN5eGNiaUFnTHk4Z0lDQWdJQ0FnWVd4c2IzY2diV0YwWTJobGNuTWdkRzhnYVc1MGNtOWtkV05sSUdFZ2JtVjNJRndpY0hKdmRHOTBlWEJsWENJZ1ptOXlYRzRnSUM4dklDQWdJQ0FnSUhSb1pTQmphR0ZwYml3Z2RHaGhkQ0JwY3l3Z1lTQXVaRzl0SUcxaGRHTm9aWElnZDJsc2JDQnBibU5zZFdSbFhHNGdJQzh2SUNBZ0lDQWdJR0ZzYkNCMGFHVWdZMjl5WlNCbGVIQmxZM1JoZEdsdmJuTWdZblYwSUhSb1pXNGdZV3h6YnlCdmRtVnljbWxrWlhOY2JpQWdMeThnSUNBZ0lDQWdZVzVrSUc1bGR5QnZibVZ6SUhWdWRHbHNJSFJvWlNCbGJtUWdiMllnZEdobElHTm9ZV2x1TGx4dVhHNWNiaUFnTHk4Z1RXRjBZMmhsY2lCbWRXNWpkR2x2Ym5NZ2QybDBhQ0JoSUhOcGJtZHNaU0JoY21kMWJXVnVkQ0JoY21VZ1oyVjBkR1Z5YzF4dUlDQjJZWElnWm01TFpYa2dQU0J0WVhSamFHVnlMbUZ5YVhSNUlEMDlQU0F4SUQ4Z0oyZGxkQ2NnT2lBbmRtRnNkV1VuTzF4dUlDQjJZWElnY0hKdmNDQTlJSHRjYmlBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lHVnVkVzFsY21GaWJHVTZJSFJ5ZFdWY2JpQWdmVHRjYmlBZ2FXWWdLR1p1UzJWNUlEMDlQU0FuZG1Gc2RXVW5LU0I3WEc0Z0lDQWdjSEp2Y0M1M2NtbDBZV0pzWlNBOUlHWmhiSE5sTzF4dUlDQjlYRzVjYmlBZ0x5OGdRWFZuYldWdWRDQjBhR1VnUTJoaGFXNGdjSEp2ZEc5MGVYQmxYRzRnSUhCeWIzQmJabTVMWlhsZElEMGdablZ1WTNScGIyNGdabTRnS0NrZ2UxeHVJQ0FnSUhaaGNpQmxlSEFnUFNCdVpYY2dSWGh3WldOMFlYUnBiMjRvYldGMFkyaGxjaXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0IwYUdsekxsOWZaWGh3WldOMFlYUnBiMjV6WDE4dWNIVnphQ2hsZUhBcE8xeHVJQ0FnSUdsbUlDZ2hkR2hwY3k1ZlgyUmxabVZ5Y21Wa1gxOHBJSHRjYmlBZ0lDQWdJSFJvYVhNdVlYTnpaWEowS0hSb2FYTXVkbUZzZFdVc0lHWnVLVHRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTTdYRzRnSUgwN1hHNWNiaUFnWkdWbVVISnZjQ2hEYUdGcGJpNXdjbTkwYjNSNWNHVXNJRzVoYldVc0lIQnliM0FwTzF4dVhHNGdJQzh2SUVGMVoyMWxiblFnZEdobElITjBZWFJwWXlCcGJuUmxjbVpoWTJWY2JpQWdjSEp2Y0Z0bWJrdGxlVjBnUFNCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ2RtRnlJR05vWVdsdUlEMGdibVYzSUVOb1lXbHVLQ2s3WEc1Y2JpQWdJQ0JwWmlBb1ptNUxaWGtnUFQwOUlDZG5aWFFuS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWTJoaGFXNWJibUZ0WlYwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJR05vWVdsdVcyNWhiV1ZkTG1Gd2NHeDVLR05vWVdsdUxDQmhjbWQxYldWdWRITXBPMXh1SUNCOU8xeHVYRzRnSUdSbFpsQnliM0FvWVhOekxDQnVZVzFsTENCd2NtOXdLVHRjYmx4dUlDQXZMeUJRWVhOeklIUm9jbTkxWjJnZ1ptOXlJR05vWVdsdWMxeHVJQ0J3Y205d1cyWnVTMlY1WFNBOUlHWjFibU4wYVc5dUlIQmhjM04wYUhKdmRXZG9LQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQjBhR2x6VzI1aGJXVmRMbUZ6YzJWeWRDaDBhR2x6TG5aaGJIVmxMQ0J3WVhOemRHaHliM1ZuYUNrdWRtRnNkV1ZQWmlncE8xeHVJQ0I5TzF4dUlDQndjbTl3TG1WdWRXMWxjbUZpYkdVZ1BTQm1ZV3h6WlR0Y2JpQWdaR1ZtVUhKdmNDaERhR0ZwYmk1d2NtOTBiM1I1Y0dVc0lDY2tKeUFySUc1aGJXVXNJSEJ5YjNBcE8xeHVYRzRnSUM4dklGQmhjM01nZEdoeWIzVm5hQ0J6ZEdGMGFXTWdZMjl1YzNSeWRXTjBiM0pjYmlBZ1pHVm1VSEp2Y0NoaGMzTXNJQ2NrSnlBcklHNWhiV1VzSUh0Y2JpQWdJQ0IyWVd4MVpUb2dablZ1WTNScGIyNGdLSFpoYkhWbEtTQjdYRzRnSUNBZ0lDQnBaaUFvWm01TFpYa2dQVDA5SUNkblpYUW5LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJoYzNNb2RtRnNkV1VwV3lja0p5QXJJRzVoYldWZE8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQXZMeUJEY21WaGRHVWdZU0J1WlhjZ1pYaHdjbVZ6YzJsdmJpQm1iM0lnZEdobElHVjRjR1ZqZEdGMGFXOXVYRzRnSUNBZ0lDQjJZWElnWTJoaGFXNGdQU0J1WlhjZ1EyaGhhVzRvS1R0Y2JpQWdJQ0FnSUdOb1lXbHVXMjVoYldWZExtRndjR3g1S0dOb1lXbHVMQ0JoY21kMWJXVnVkSE1wTzF4dUlDQWdJQ0FnTHk4Z1VtVjBkWEp1SUdFZ1kyRnNiR0ZpYkdVZ2RHaGhkQ0JoYzNObGNuUnpJSFZ3YjI0Z2NtVmpaV2wyYVc1bklHRWdkbUZzZFdWY2JpQWdJQ0FnSUhKbGRIVnliaUJqYUdGcGJpNTBhSEp2ZFdkb08xeHVJQ0FnSUgwc1hHNGdJQ0FnWlc1MWJXVnlZV0pzWlRvZ1ptRnNjMlZjYmlBZ2ZTazdYRzVjYm4wN1hHNWNibHh1Ylc5a2RXeGxMbVY0Y0c5eWRITWdQU0JoYzNNN1hHNGlYWDA9IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciByZXNvbHZlcnMgPSByZXF1aXJlKCcuL3Jlc29sdmVycycpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9lcnJvcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBQcm9taXNlID0gdXRpbC5Qcm9taXNlO1xuXG52YXIgZGVmUHJvcCA9IHV0aWwuYmluZChPYmplY3QuZGVmaW5lUHJvcGVydHksIE9iamVjdCk7XG5cbi8vIEFuIGV4cGVjdGF0aW9ucyBjaGFpbiAoYWthIGV4cHJlc3Npb24pLCB0aGUgY29yZSBvYmplY3Qgb2YgdGhlIGxpYnJhcnksXG4vLyBhbGxvd3MgdG8gc2V0dXAgYSBzZXQgb2YgZXhwZWN0YXRpb25zIHRvIGJlIHJ1biBhdCBhbnkgcG9pbnQgYWdhaW5zdCBhXG4vLyB2YWx1ZS5cbmZ1bmN0aW9uIENoYWluICh2YWx1ZSkge1xuICBpZiAoIUNoYWluLmlzQ2hhaW4odGhpcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FzcyBDaGFpbiBjb25zdHJ1Y3RvciBjYWxsZWQgd2l0aG91dCBuZXchJyk7XG4gIH1cblxuICAvLyBUT0RPOiBPbiBub24gaW5pdGlhbGl6ZWQgY2hhaW5zIHdlIGNhbid0IGRvIC52YWx1ZSwgaXQgc2hvdWxkXG4gIC8vICAgICAgIGJlIGEgZXhwZWN0YXRpb24gdGhhdCBnZXRzIHRoZSBpbml0aWFsIHZhbHVlIGdpdmVuIHdoZW5cbiAgLy8gICAgICAgcmVzb2x2aW5nIChzbywgaXQgc2hvdWxkIGJlIHN0b3JlZCBvbiB0aGUgcmVzb2x2ZXIpXG4gIHRoaXMudmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IHZhbHVlIDogdGhpcy5fX0dVQVJEX187XG5cbiAgLy8gQ3VzdG9tIGRlc2NyaXB0aW9uXG4gIGRlZlByb3AodGhpcywgJ19fZGVzY3JpcHRpb25fXycsIHtcbiAgICB2YWx1ZTogJycsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBMaXN0IG9mIFsgRXhwZWN0YXRpb24gXVxuICBkZWZQcm9wKHRoaXMsICdfX2V4cGVjdGF0aW9uc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBXaGVuIHRydWUgdGhlIGV4cHJlc3Npb24gaXMgY29uc2lkZXJlZCBkZWZlcnJlZCBhbmQgd29uJ3RcbiAgLy8gdHJ5IHRvIGltbWVkaWF0ZWx5IGV2YWx1YXRlIGFueSBuZXdseSBjaGFpbmVkIGV4cGVjdGF0aW9uLlxuICBkZWZQcm9wKHRoaXMsICdfX2RlZmVycmVkX18nLCB7XG4gICAgdmFsdWU6IHRoaXMudmFsdWUgPT09IHRoaXMuX19HVUFSRF9fLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWVcbiAgfSk7XG5cbiAgLy8gSG9sZHMgdGhlIGxpc3Qgb2YgcHJvbWlzZSBjYWxsYmFja3MgYXR0YWNoZWQgdG8gdGhlIGV4cHJlc3Npb25cbiAgZGVmUHJvcCh0aGlzLCAnX190aGVuc19fJywge1xuICAgIHZhbHVlOiBbXSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBTZWFsIHRoZSBjb250ZXh0IHRvIHRoZSBtZXRob2RzIHNvIHdlIGNhbiBjYWxsIHRoZW0gYXMgcGxhaW4gZnVuY3Rpb25zXG4gIHRoaXMudGVzdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUudGVzdCwgdGhpcyk7XG4gIHRoaXMuYXNzZXJ0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS5hc3NlcnQsIHRoaXMpO1xuICB0aGlzLnJlc3VsdCA9IHV0aWwuYmluZChDaGFpbi5wcm90b3R5cGUucmVzdWx0LCB0aGlzKTtcbiAgdGhpcy50aHJvdWdoID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS50aHJvdWdoLCB0aGlzKTtcbiAgdGhpcy4kID0gdGhpcy50aHJvdWdoO1xufVxuXG5DaGFpbi5pc0NoYWluID0gZnVuY3Rpb24gKG9iaikge1xuICAvLyBUaGlzIGxvb2tzIGNvbnRyaXZlZCBidXQgaW5zdGFuY2VvZiBpcyBraW5kIG9mIHNsb3ctaXNoXG4gIHJldHVybiBvYmogJiYgb2JqLmNvbnN0cnVjdG9yID09PSBDaGFpbjtcbn07XG5cblxudmFyIHByb3RvID0gQ2hhaW4ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gQ2hhaW47XG5cbi8vIEd1YXJkIHRva2VuIHRvIGRldGVjdCB2YWx1ZWxlc3MgbWF0Y2hlcnNcbnByb3RvLl9fR1VBUkRfXyA9IHtcbiAgdmFsdWVPZjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gIH0sXG4gIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd7e3ZhbHVlbGVzc319JztcbiAgfVxufTtcblxuLy8gU3VwcG9ydHMgdGhlIHVzYWdlOiBhc3Muc3RyaW5nLmhlbHBcbmRlZlByb3AocHJvdG8sICdoZWxwJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPOiBQcm9kdWN0aXplIHRoaXMgYW5kIHBlcmhhcHMgc2hvdyBoZWxwIGZvciB0aGUgd2hvbGUgY2hhaW5cbiAgICB2YXIgdGFpbCA9IF8udGFpbCh0aGlzLl9fZXhwZWN0YXRpb25zX18pO1xuICAgIHJldHVybiB0YWlsID8gdGFpbC5oZWxwIDogJ04vQSc7XG4gIH1cbn0pO1xuXG4vLyBTdXBwb3J0IHVzZSBjYXNlOiBhc3ModmFsdWUpLl8uc29tZS5udW1iZXIuYWJvdmUoNSkuX1xuZGVmUHJvcChwcm90bywgJ18nLCB7XG4gIGdldDogZnVuY3Rpb24gZm4oKSB7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5fX2RlZmVycmVkX18gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IGZhbHNlO1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufSk7XG5cblxuLy8gRXhwb3NlcyBhIFByb21pc2UvQSBpbnRlcmZhY2UgZm9yIHRoZSBleHByZXNzaW9uLCB0aGUgaW50ZW5kZWQgdXNlIGlzIGZvclxuLy8gb2J0YWluaW5nIHRoZSByZXN1bHQgZm9yIGFzeW5jaHJvbm91cyBleHByZXNzaW9ucy5cbi8vIEhlcmUgdGhvdWdoIHdlIGp1c3QgY29sbGVjdCB0aGUgY2FsbGJhY2tzLCB0aGUgYWN0dWFsIHByb21pc2UgcmVzb2x1dGlvblxuLy8gaXMgZG9uZSBpbiB0aGUgcmVzb2x2ZXIgd2hlbiBpdCByZWFjaGVzIGEgcmVzdWx0LlxucHJvdG8udGhlbiA9IGZ1bmN0aW9uIChjYiwgZWIpIHtcbiAgLy8gUmVnaXN0ZXIgdGhlIGNhbGxiYWNrcyB0byBiZSB1c2VkIHdoZW4gcmVzb2x2ZWRcbiAgdGhpcy5fX3RoZW5zX18ucHVzaChbY2IsIGViXSk7XG5cbiAgLy8gV2hlbiB0aGUgZXhwcmVzc2lvbiBpcyBub24gZGVmZXJyZWQgYW5kIHdlIGhhdmUgYSB2YWx1ZSB3ZSBmb3JjZSB0aGVcbiAgLy8gcmVzb2x2ZXIgdG8gcnVuIGluIG9yZGVyIHRvIHJlc29sdmUgdGhlIHByb21pc2UgYXQgbGVhc3Qgb25jZS5cbiAgLy8gVGhpcyBpcyBwcmltYXJpbHkgdG8gc3VwcG9ydCB0aGUgdGVzdCBydW5uZXJzIHVzZSBjYXNlIHdoZXJlIGFuIGV4cHJlc3Npb25cbiAgLy8gaXMgcmV0dXJuZWQgZnJvbSB0aGUgdGVzdCBhbmQgdGhlIHJ1bm5lciB3aWxsIGF0dGFjaCBpdHNlbGYgaGVyZS5cbiAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXyAmJiB0aGlzLnZhbHVlICE9PSB0aGlzLl9fR1VBUkRfXykge1xuICAgIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICAgIHJlc29sdmVyKHRoaXMudmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5jYXRjaCA9IGZ1bmN0aW9uIChlYikge1xuICByZXR1cm4gdGhpcy50aGVuKG51bGwsIGViKTtcbn07XG5cbi8vIERpc3BhdGNoIGV2ZXJ5b25lIHdobyB3YXMgd2FpdGluZyB0byBiZSBub3RpZmllZCBvZiB0aGUgb3V0Y29tZVxucHJvdG8uZGlzcGF0Y2hSZXN1bHQgPSBmdW5jdGlvbiAocmVzb2x2ZWQsIHJlc3VsdCkge1xuICBpZiAoMCA9PT0gdGhpcy5fX3RoZW5zX18ubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR2VuZXJhdGUgYSBuaWNlIGVycm9yIGZvciB0aGUgZmFpbHVyZVxuICB2YXIgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICBhY3R1YWwgPSB0aGlzLmJ1aWxkRXJyb3IocmVzb2x2ZWQsIHByb3RvLmRpc3BhdGNoUmVzdWx0KTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHByb21pc2UgdGhhdCByZWplY3RzIGltbWVkaWF0ZWx5IHdpdGggYSBmYWlsdXJlIGVycm9yIG9yXG4gIC8vIHJlc29sdmVzIHdpdGggdGhlIGV4cHJlc3Npb24gc3ViamVjdC5cbiAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgLy8gQ2FsbGluZyByZXNvbHZlKCkgd2l0aCBhIHByb21pc2Ugd2lsbCBhdHRhY2ggaXRzZWxmIHRvIHRoZSBwcm9taXNlXG4gICAgLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGl0IGFzIGEgc2ltcGxlIHZhbHVlLiBUbyBhdm9pZCB0aGF0IHdlIGRldGVjdCB0aGVcbiAgICAvLyBjYXNlIGFuZCB3cmFwIGl0IGluIGFuIGFycmF5LlxuICAgIGlmIChhY3R1YWwgJiYgdHlwZW9mIGFjdHVhbC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhY3R1YWwgPSBbXG4gICAgICAgICdBc3M6IFZhbHVlIHdyYXBwZWQgaW4gYW4gYXJyYXkgc2luY2UgaXQgbG9va3MgbGlrZSBhIFByb21pc2UnLFxuICAgICAgICBhY3R1YWxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgKHJlc3VsdCA/IHJlc29sdmUgOiByZWplY3QpKCBhY3R1YWwgKTtcbiAgfSk7XG5cbiAgLy8gQXR0YWNoIGFsbCB0aGUgcmVnaXN0ZXJlZCB0aGVucyB0byB0aGUgcHJvbWlzZSBzbyB0aGV5IGdldCBub3RpZmllZFxuICBfLmZvckVhY2godGhpcy5fX3RoZW5zX18sIGZ1bmN0aW9uIChjYWxsYmFja3MpIHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuLmFwcGx5KHByb21pc2UsIGNhbGxiYWNrcyk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZHVtcENoYWluIChyZXNvbHZlZCwgaW5kZW50KSB7XG4gIHZhciByZXN1bHQgPSAnJztcblxuICBpbmRlbnQgPSBpbmRlbnQgfHwgJyc7XG5cbiAgcmVzb2x2ZWQuZm9yRWFjaChmdW5jdGlvbiAoZXhwLCBpZHgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShleHApKSB7XG4gICAgICByZXN1bHQgKz0gZHVtcENoYWluKGV4cCwgaW5kZW50ICsgJyAgJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV4cC5yZXN1bHQpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzJtUGFzc2VkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnIFxcdTAwMWJbMzFtRmFpbGVkOlxcdTAwMWJbMG0gJyArIGV4cC5kZXNjcmlwdGlvbiArICdcXG4nO1xuICAgIGlmIChpZHggPT09IHJlc29sdmVkLmxlbmd0aCAtIDEpIHtcbiAgICAgIHJlc3VsdCArPSBpbmRlbnQgKyAnICAgIFxcdTAwMWJbMzNtQnV0OlxcdTAwMWJbMG0gJyArIGV4cC5mYWlsdXJlICsgJ1xcbic7XG4gICAgfVxuXG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuLy8gQnVpbGRzIGFuIEFzc0Vycm9yIGZvciB0aGUgY3VycmVudCBleHByZXNzaW9uLiBJdCBtYWtlcyBhIGNvdXBsZSBvZlxuLy8gYXNzdW1wdGlvbnMsIGZvciBpbnN0YW5jZSB0aGUgLl9fb2Zmc2V0X18gbXVzdCBiZSBwbGFjZWQganVzdCBhZnRlciB0aGVcbi8vIGV4cGVjdGF0aW9uIHRoYXQgcHJvZHVjZWQgdGhlIGZhaWx1cmUgb2YgdGhlIGNoYWluLlxucHJvdG8uYnVpbGRFcnJvciA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgc3NmKSB7XG5cbiAgdmFyIGVycm9yID0gdGhpcy5fX2Rlc2NyaXB0aW9uX18gKyAnXFxuXFxuJztcblxuICBleHAgPSByZXNvbHZlZFsgcmVzb2x2ZWQubGVuZ3RoIC0gMSBdO1xuICBlcnJvciArPSBkdW1wQ2hhaW4ocmVzb2x2ZWQpO1xuXG4gIGlmICghdXRpbC5kb0NvbG9ycygpKSB7XG4gICAgZXJyb3IgPSB1dGlsLnVuYW5zaShlcnJvcik7XG4gIH1cblxuICAvLyBUT0RPOiBzaG93RGlmZiBzaG91bGQgYmUgdXNlZCBvbmx5IHdoZW4gaXQgbWFrZXMgc2Vuc2UgcGVyaGFwc1xuICAvLyAgICAgICB3ZSBjYW4gcGFzcyBudWxsL3VuZGVmaW5lZCBhbmQgbGV0IEFzc0Vycm9yIGRldGVjdCB3aGVuIGl0XG4gIC8vICAgICAgIG1ha2VzIHNlbnNlLlxuXG4gIHZhciBleHBlY3RlZCA9IGV4cC5leHBlY3RlZDtcbiAgLy8gTW9jaGEgd2lsbCB0cnkgdG8ganNvbmlmeSB0aGUgZXhwZWN0ZWQgdmFsdWUsIGp1c3QgaWdub3JlIGlmIGl0J3MgYSBmdW5jdGlvblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdmFyIGluc3QgPSBuZXcgQXNzRXJyb3IoZXJyb3IsIHNzZiB8fCBhcmd1bWVudHMuY2FsbGVlIHx8IHByb3RvLmJ1aWxkRXJyb3IpO1xuICBpbnN0LnNob3dEaWZmID0gZmFsc2U7XG4gIGluc3QuYWN0dWFsID0gbnVsbDtcbiAgaW5zdC5leHBlY3RlZCA9IG51bGw7XG4gIHJldHVybiBpbnN0O1xufTtcblxuLy8gUmVzb2x2ZXMgdGhlIGN1cnJlbnQgY2hhaW4gZm9yIGEgZ2l2ZW4gdmFsdWUuIFRoZSByZXN1bHQgaXMgYWx3YXlzIGFcbi8vIGJvb2xlYW4gaW5kaWNhdGluZyB0aGUgb3V0Y29tZSBvciBhbiB1bmRlZmluZWQgdG8gc2lnbmFsIHRoYXQgaXQgcmVhY2hlZFxuLy8gYW4gYXN5bmNocm9ub3VzIGZsb3cuXG5wcm90by50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBSZXNvbHZlIHRoZSBjaGFpbiBzdGFydGluZyBmcm9tIHJvb3RcbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyBQZXJmb3JtcyB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgY2hhaW4gYnV0IGFkZGl0aW9uYWxseSB3aWxsIHJhaXNlIGFuIGVycm9yXG4vLyBpZiBpdCBmYWlscyB0byBjb21wbGV0ZS4gV2hlbiB0aGUgZXhwcmVzc2lvbiByZXNvbHZlcyBhcyB1bmRlZmluZWQgKGFzeW5jKVxuLy8gaXQnbGwgYmUgYXV0b21hdGljYWxseSBlbmFibGUgaXRzIGRlZmVycmVkIGZsYWcuXG4vLyBUaGUgYHNzZmAgc3RhbmRzIGZvciBTdGFja1RyYWNlRnVuY3Rpb24sIGEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBmdW5jdGlvblxuLy8gdG8gc2hvdyBvbiB0aGUgc3RhY2sgdHJhY2UuXG5wcm90by5hc3NlcnQgPSBmdW5jdGlvbiAoYWN0dWFsLCBzc2YpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgLy8gSnVzdCBpZ25vcmUgaWYgdGhlIGFjdHVhbCB2YWx1ZSBpcyBub3QgcHJlc2VudCB5ZXRcbiAgLy8gVE9ETzogU2hhbGwgaXQgcHJvZHVjZSBhbiBlcnJvcj9cbiAgaWYgKGFjdHVhbCA9PT0gdGhpcy5fX0dVQVJEX18pIHJldHVybiB0aGlzO1xuXG4gIHZhciByZXNvbHZlciA9IHJlc29sdmVycy5hY3F1aXJlKHRoaXMpO1xuICB2YXIgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcblxuICAvLyBJdCBmYWlsZWQgc28gcmVwb3J0IGl0IHdpdGggYSBuaWNlIGVycm9yXG4gIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgdGhyb3cgdGhpcy5idWlsZEVycm9yKHJlc29sdmVyLnJlc29sdmVkLCBzc2YgfHwgdGhpcy5hc3NlcnQpO1xuICB9XG5cbiAgLy8gQ29udmVydCB0aGUgZXhwcmVzc2lvbiBpbnRvIGEgZGVmZXJyZWQgaWYgYW4gYXN5bmMgZXhwZWN0aW9uIHdhcyBmb3VuZFxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIEFzc2VydHMgdGhlIHByb3ZpZGVkIHZhbHVlIGFuZCBpZiBzdWNjZXNzZnVsIHJldHVybnMgdGhlIG9yaWdpbmFsXG4vLyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBjaGFpbiBpbnN0YW5jZS5cbnByb3RvLnRocm91Z2ggPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHRoaXMuYXNzZXJ0KGFjdHVhbCwgcHJvdG8udGhyb3VnaCk7XG4gIHJldHVybiBhY3R1YWw7XG59O1xuXG4vLyBFdmFsdWF0ZXMgdGhlIGV4cHJlc3Npb24gY2hhaW4gcmVwb3J0aW5nIHRoZSBsYXN0IG11dGF0ZWQgdmFsdWUgc2VlbiBpblxuLy8gaXQuIElmIHRoZSBleHByZXNzaW9uIGRvZXMgbm90IGNvbXBsZXRlIGl0J2xsIHJldHVybiB1bmRlZmluZWQuXG5wcm90by5yZXN1bHQgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIHZhciByZXN1bHQ7XG5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICB0aGlzLnRhcChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgIH0pLnRlc3QoYWN0dWFsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBSZW1vdmUgdGhlIC50YXAgZnJvbSB0aGUgY2hhaW5cbiAgICB0aGlzLl9fZXhwZWN0YXRpb25zX18ucG9wKCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlO1xufTtcblxuQ2hhaW4ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fX2Rlc2NyaXB0aW9uX18pIHtcbiAgICByZXR1cm4gdGhpcy5fX2Rlc2NyaXB0aW9uX187XG4gIH1cblxuICB2YXIgZGVzY3MgPVxuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfX1xuICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZGVzY3JpcHRpb24gfSlcbiAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmRlc2NyaXB0aW9uIH0pO1xuXG4gIGlmIChkZXNjcy5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuICcoJyArIGRlc2NzLmpvaW4oJywgJykgKyAnKSc7XG4gIH0gZWxzZSBpZiAoZGVzY3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGRlc2NzWzBdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnPEFzc0NoYWluPic7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDaGFpbjtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbXhwWWk5amFHRnBiaTVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pTzBGQlFVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU0lzSW1acGJHVWlPaUpuWlc1bGNtRjBaV1F1YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaWRtRnlJRjhnUFNBb2RIbHdaVzltSUhkcGJtUnZkeUFoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaUEvSUhkcGJtUnZkeTVmSURvZ2RIbHdaVzltSUdkc2IySmhiQ0FoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaUEvSUdkc2IySmhiQzVmSURvZ2JuVnNiQ2s3WEc1Y2JuWmhjaUJ5WlhOdmJIWmxjbk1nUFNCeVpYRjFhWEpsS0NjdUwzSmxjMjlzZG1WeWN5Y3BPMXh1ZG1GeUlFRnpjMFZ5Y205eUlEMGdjbVZ4ZFdseVpTZ25MaTlsY25KdmNpY3BPMXh1ZG1GeUlIVjBhV3dnUFNCeVpYRjFhWEpsS0NjdUwzVjBhV3duS1R0Y2JuWmhjaUJRY205dGFYTmxJRDBnZFhScGJDNVFjbTl0YVhObE8xeHVYRzUyWVhJZ1pHVm1VSEp2Y0NBOUlIVjBhV3d1WW1sdVpDaFBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtzSUU5aWFtVmpkQ2s3WEc1Y2JpOHZJRUZ1SUdWNGNHVmpkR0YwYVc5dWN5QmphR0ZwYmlBb1lXdGhJR1Y0Y0hKbGMzTnBiMjRwTENCMGFHVWdZMjl5WlNCdlltcGxZM1FnYjJZZ2RHaGxJR3hwWW5KaGNua3NYRzR2THlCaGJHeHZkM01nZEc4Z2MyVjBkWEFnWVNCelpYUWdiMllnWlhod1pXTjBZWFJwYjI1eklIUnZJR0psSUhKMWJpQmhkQ0JoYm5rZ2NHOXBiblFnWVdkaGFXNXpkQ0JoWEc0dkx5QjJZV3gxWlM1Y2JtWjFibU4wYVc5dUlFTm9ZV2x1SUNoMllXeDFaU2tnZTF4dUlDQnBaaUFvSVVOb1lXbHVMbWx6UTJoaGFXNG9kR2hwY3lrcElIdGNiaUFnSUNCMGFISnZkeUJ1WlhjZ1JYSnliM0lvSjBGemN5QkRhR0ZwYmlCamIyNXpkSEoxWTNSdmNpQmpZV3hzWldRZ2QybDBhRzkxZENCdVpYY2hKeWs3WEc0Z0lIMWNibHh1SUNBdkx5QlVUMFJQT2lCUGJpQnViMjRnYVc1cGRHbGhiR2w2WldRZ1kyaGhhVzV6SUhkbElHTmhiaWQwSUdSdklDNTJZV3gxWlN3Z2FYUWdjMmh2ZFd4a1hHNGdJQzh2SUNBZ0lDQWdJR0psSUdFZ1pYaHdaV04wWVhScGIyNGdkR2hoZENCblpYUnpJSFJvWlNCcGJtbDBhV0ZzSUhaaGJIVmxJR2RwZG1WdUlIZG9aVzVjYmlBZ0x5OGdJQ0FnSUNBZ2NtVnpiMngyYVc1bklDaHpieXdnYVhRZ2MyaHZkV3hrSUdKbElITjBiM0psWkNCdmJpQjBhR1VnY21WemIyeDJaWElwWEc0Z0lIUm9hWE11ZG1Gc2RXVWdQU0JoY21kMWJXVnVkSE11YkdWdVozUm9JRDRnTUNBL0lIWmhiSFZsSURvZ2RHaHBjeTVmWDBkVlFWSkVYMTg3WEc1Y2JpQWdMeThnUTNWemRHOXRJR1JsYzJOeWFYQjBhVzl1WEc0Z0lHUmxabEJ5YjNBb2RHaHBjeXdnSjE5ZlpHVnpZM0pwY0hScGIyNWZYeWNzSUh0Y2JpQWdJQ0IyWVd4MVpUb2dKeWNzWEc0Z0lDQWdaVzUxYldWeVlXSnNaVG9nWm1Gc2MyVXNYRzRnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNCM2NtbDBZV0pzWlRvZ2RISjFaVnh1SUNCOUtUdGNibHh1SUNBdkx5Qk1hWE4wSUc5bUlGc2dSWGh3WldOMFlYUnBiMjRnWFZ4dUlDQmtaV1pRY205d0tIUm9hWE1zSUNkZlgyVjRjR1ZqZEdGMGFXOXVjMTlmSnl3Z2UxeHVJQ0FnSUhaaGJIVmxPaUJiWFN4Y2JpQWdJQ0JsYm5WdFpYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lIZHlhWFJoWW14bE9pQm1ZV3h6WlZ4dUlDQjlLVHRjYmx4dUlDQXZMeUJYYUdWdUlIUnlkV1VnZEdobElHVjRjSEpsYzNOcGIyNGdhWE1nWTI5dWMybGtaWEpsWkNCa1pXWmxjbkpsWkNCaGJtUWdkMjl1SjNSY2JpQWdMeThnZEhKNUlIUnZJR2x0YldWa2FXRjBaV3g1SUdWMllXeDFZWFJsSUdGdWVTQnVaWGRzZVNCamFHRnBibVZrSUdWNGNHVmpkR0YwYVc5dUxseHVJQ0JrWldaUWNtOXdLSFJvYVhNc0lDZGZYMlJsWm1WeWNtVmtYMThuTENCN1hHNGdJQ0FnZG1Gc2RXVTZJSFJvYVhNdWRtRnNkV1VnUFQwOUlIUm9hWE11WDE5SFZVRlNSRjlmTEZ4dUlDQWdJR1Z1ZFcxbGNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nWm1Gc2MyVXNYRzRnSUNBZ2QzSnBkR0ZpYkdVNklIUnlkV1ZjYmlBZ2ZTazdYRzVjYmlBZ0x5OGdTRzlzWkhNZ2RHaGxJR3hwYzNRZ2IyWWdjSEp2YldselpTQmpZV3hzWW1GamEzTWdZWFIwWVdOb1pXUWdkRzhnZEdobElHVjRjSEpsYzNOcGIyNWNiaUFnWkdWbVVISnZjQ2gwYUdsekxDQW5YMTkwYUdWdWMxOWZKeXdnZTF4dUlDQWdJSFpoYkhWbE9pQmJYU3hjYmlBZ0lDQmxiblZ0WlhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUhkeWFYUmhZbXhsT2lCbVlXeHpaVnh1SUNCOUtUdGNibHh1SUNBdkx5QlRaV0ZzSUhSb1pTQmpiMjUwWlhoMElIUnZJSFJvWlNCdFpYUm9iMlJ6SUhOdklIZGxJR05oYmlCallXeHNJSFJvWlcwZ1lYTWdjR3hoYVc0Z1puVnVZM1JwYjI1elhHNGdJSFJvYVhNdWRHVnpkQ0E5SUhWMGFXd3VZbWx1WkNoRGFHRnBiaTV3Y205MGIzUjVjR1V1ZEdWemRDd2dkR2hwY3lrN1hHNGdJSFJvYVhNdVlYTnpaWEowSUQwZ2RYUnBiQzVpYVc1a0tFTm9ZV2x1TG5CeWIzUnZkSGx3WlM1aGMzTmxjblFzSUhSb2FYTXBPMXh1SUNCMGFHbHpMbkpsYzNWc2RDQTlJSFYwYVd3dVltbHVaQ2hEYUdGcGJpNXdjbTkwYjNSNWNHVXVjbVZ6ZFd4MExDQjBhR2x6S1R0Y2JpQWdkR2hwY3k1MGFISnZkV2RvSUQwZ2RYUnBiQzVpYVc1a0tFTm9ZV2x1TG5CeWIzUnZkSGx3WlM1MGFISnZkV2RvTENCMGFHbHpLVHRjYmlBZ2RHaHBjeTRrSUQwZ2RHaHBjeTUwYUhKdmRXZG9PMXh1ZlZ4dVhHNURhR0ZwYmk1cGMwTm9ZV2x1SUQwZ1puVnVZM1JwYjI0Z0tHOWlhaWtnZTF4dUlDQXZMeUJVYUdseklHeHZiMnR6SUdOdmJuUnlhWFpsWkNCaWRYUWdhVzV6ZEdGdVkyVnZaaUJwY3lCcmFXNWtJRzltSUhOc2IzY3RhWE5vWEc0Z0lISmxkSFZ5YmlCdlltb2dKaVlnYjJKcUxtTnZibk4wY25WamRHOXlJRDA5UFNCRGFHRnBianRjYm4wN1hHNWNibHh1ZG1GeUlIQnliM1J2SUQwZ1EyaGhhVzR1Y0hKdmRHOTBlWEJsSUQwZ1QySnFaV04wTG1OeVpXRjBaU2h1ZFd4c0tUdGNibkJ5YjNSdkxtTnZibk4wY25WamRHOXlJRDBnUTJoaGFXNDdYRzVjYmk4dklFZDFZWEprSUhSdmEyVnVJSFJ2SUdSbGRHVmpkQ0IyWVd4MVpXeGxjM01nYldGMFkyaGxjbk5jYm5CeWIzUnZMbDlmUjFWQlVrUmZYeUE5SUh0Y2JpQWdkbUZzZFdWUFpqb2dablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQjBhR2x6TG5SdlUzUnlhVzVuS0NrN1hHNGdJSDBzWEc0Z0lIUnZVM1J5YVc1bk9pQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlDZDdlM1poYkhWbGJHVnpjMzE5Snp0Y2JpQWdmVnh1ZlR0Y2JseHVMeThnVTNWd2NHOXlkSE1nZEdobElIVnpZV2RsT2lCaGMzTXVjM1J5YVc1bkxtaGxiSEJjYm1SbFpsQnliM0FvY0hKdmRHOHNJQ2RvWld4d0p5d2dlMXh1SUNCblpYUTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0F2THlCVVQwUlBPaUJRY205a2RXTjBhWHBsSUhSb2FYTWdZVzVrSUhCbGNtaGhjSE1nYzJodmR5Qm9aV3h3SUdadmNpQjBhR1VnZDJodmJHVWdZMmhoYVc1Y2JpQWdJQ0IyWVhJZ2RHRnBiQ0E5SUY4dWRHRnBiQ2gwYUdsekxsOWZaWGh3WldOMFlYUnBiMjV6WDE4cE8xeHVJQ0FnSUhKbGRIVnliaUIwWVdsc0lEOGdkR0ZwYkM1b1pXeHdJRG9nSjA0dlFTYzdYRzRnSUgxY2JuMHBPMXh1WEc0dkx5QlRkWEJ3YjNKMElIVnpaU0JqWVhObE9pQmhjM01vZG1Gc2RXVXBMbDh1YzI5dFpTNXVkVzFpWlhJdVlXSnZkbVVvTlNrdVgxeHVaR1ZtVUhKdmNDaHdjbTkwYnl3Z0oxOG5MQ0I3WEc0Z0lHZGxkRG9nWm5WdVkzUnBiMjRnWm00b0tTQjdYRzRnSUNBZ2FXWWdLQ0YwYUdsekxsOWZaR1ZtWlhKeVpXUmZYeWtnZTF4dUlDQWdJQ0FnZEdocGN5NWZYMlJsWm1WeWNtVmtYMThnUFNCMGNuVmxPMXh1SUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNCMGFHbHpMbDlmWkdWbVpYSnlaV1JmWHlBOUlHWmhiSE5sTzF4dUlDQWdJQ0FnZEdocGN5NWhjM05sY25Rb2RHaHBjeTUyWVd4MVpTd2dabTRwTzF4dUlDQWdJSDFjYmlBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ2ZWeHVmU2s3WEc1Y2JseHVMeThnUlhod2IzTmxjeUJoSUZCeWIyMXBjMlV2UVNCcGJuUmxjbVpoWTJVZ1ptOXlJSFJvWlNCbGVIQnlaWE56YVc5dUxDQjBhR1VnYVc1MFpXNWtaV1FnZFhObElHbHpJR1p2Y2x4dUx5OGdiMkowWVdsdWFXNW5JSFJvWlNCeVpYTjFiSFFnWm05eUlHRnplVzVqYUhKdmJtOTFjeUJsZUhCeVpYTnphVzl1Y3k1Y2JpOHZJRWhsY21VZ2RHaHZkV2RvSUhkbElHcDFjM1FnWTI5c2JHVmpkQ0IwYUdVZ1kyRnNiR0poWTJ0ekxDQjBhR1VnWVdOMGRXRnNJSEJ5YjIxcGMyVWdjbVZ6YjJ4MWRHbHZibHh1THk4Z2FYTWdaRzl1WlNCcGJpQjBhR1VnY21WemIyeDJaWElnZDJobGJpQnBkQ0J5WldGamFHVnpJR0VnY21WemRXeDBMbHh1Y0hKdmRHOHVkR2hsYmlBOUlHWjFibU4wYVc5dUlDaGpZaXdnWldJcElIdGNiaUFnTHk4Z1VtVm5hWE4wWlhJZ2RHaGxJR05oYkd4aVlXTnJjeUIwYnlCaVpTQjFjMlZrSUhkb1pXNGdjbVZ6YjJ4MlpXUmNiaUFnZEdocGN5NWZYM1JvWlc1elgxOHVjSFZ6YUNoYlkySXNJR1ZpWFNrN1hHNWNiaUFnTHk4Z1YyaGxiaUIwYUdVZ1pYaHdjbVZ6YzJsdmJpQnBjeUJ1YjI0Z1pHVm1aWEp5WldRZ1lXNWtJSGRsSUdoaGRtVWdZU0IyWVd4MVpTQjNaU0JtYjNKalpTQjBhR1ZjYmlBZ0x5OGdjbVZ6YjJ4MlpYSWdkRzhnY25WdUlHbHVJRzl5WkdWeUlIUnZJSEpsYzI5c2RtVWdkR2hsSUhCeWIyMXBjMlVnWVhRZ2JHVmhjM1FnYjI1alpTNWNiaUFnTHk4Z1ZHaHBjeUJwY3lCd2NtbHRZWEpwYkhrZ2RHOGdjM1Z3Y0c5eWRDQjBhR1VnZEdWemRDQnlkVzV1WlhKeklIVnpaU0JqWVhObElIZG9aWEpsSUdGdUlHVjRjSEpsYzNOcGIyNWNiaUFnTHk4Z2FYTWdjbVYwZFhKdVpXUWdabkp2YlNCMGFHVWdkR1Z6ZENCaGJtUWdkR2hsSUhKMWJtNWxjaUIzYVd4c0lHRjBkR0ZqYUNCcGRITmxiR1lnYUdWeVpTNWNiaUFnYVdZZ0tDRjBhR2x6TGw5ZlpHVm1aWEp5WldSZlh5QW1KaUIwYUdsekxuWmhiSFZsSUNFOVBTQjBhR2x6TGw5ZlIxVkJVa1JmWHlrZ2UxeHVJQ0FnSUhaaGNpQnlaWE52YkhabGNpQTlJSEpsYzI5c2RtVnljeTVoWTNGMWFYSmxLSFJvYVhNcE8xeHVJQ0FnSUhKbGMyOXNkbVZ5S0hSb2FYTXVkbUZzZFdVcE8xeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlIUm9hWE03WEc1OU8xeHVYRzV3Y205MGJ5NWpZWFJqYUNBOUlHWjFibU4wYVc5dUlDaGxZaWtnZTF4dUlDQnlaWFIxY200Z2RHaHBjeTUwYUdWdUtHNTFiR3dzSUdWaUtUdGNibjA3WEc1Y2JpOHZJRVJwYzNCaGRHTm9JR1YyWlhKNWIyNWxJSGRvYnlCM1lYTWdkMkZwZEdsdVp5QjBieUJpWlNCdWIzUnBabWxsWkNCdlppQjBhR1VnYjNWMFkyOXRaVnh1Y0hKdmRHOHVaR2x6Y0dGMFkyaFNaWE4xYkhRZ1BTQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpXUXNJSEpsYzNWc2RDa2dlMXh1SUNCcFppQW9NQ0E5UFQwZ2RHaHBjeTVmWDNSb1pXNXpYMTh1YkdWdVozUm9LU0I3WEc0Z0lDQWdjbVYwZFhKdU8xeHVJQ0I5WEc1Y2JpQWdMeThnUjJWdVpYSmhkR1VnWVNCdWFXTmxJR1Z5Y205eUlHWnZjaUIwYUdVZ1ptRnBiSFZ5WlZ4dUlDQjJZWElnWVdOMGRXRnNJRDBnZEdocGN5NTJZV3gxWlR0Y2JpQWdhV1lnS0hKbGMzVnNkQ0E5UFQwZ1ptRnNjMlVwSUh0Y2JpQWdJQ0JoWTNSMVlXd2dQU0IwYUdsekxtSjFhV3hrUlhKeWIzSW9jbVZ6YjJ4MlpXUXNJSEJ5YjNSdkxtUnBjM0JoZEdOb1VtVnpkV3gwS1R0Y2JpQWdmVnh1WEc0Z0lDOHZJRU55WldGMFpTQmhJSEJ5YjIxcGMyVWdkR2hoZENCeVpXcGxZM1J6SUdsdGJXVmthV0YwWld4NUlIZHBkR2dnWVNCbVlXbHNkWEpsSUdWeWNtOXlJRzl5WEc0Z0lDOHZJSEpsYzI5c2RtVnpJSGRwZEdnZ2RHaGxJR1Y0Y0hKbGMzTnBiMjRnYzNWaWFtVmpkQzVjYmlBZ2RtRnlJSEJ5YjIxcGMyVWdQU0J1WlhjZ1VISnZiV2x6WlNobWRXNWpkR2x2YmlBb2NtVnpiMngyWlN3Z2NtVnFaV04wS1NCN1hHNGdJQ0FnTHk4Z1EyRnNiR2x1WnlCeVpYTnZiSFpsS0NrZ2QybDBhQ0JoSUhCeWIyMXBjMlVnZDJsc2JDQmhkSFJoWTJnZ2FYUnpaV3htSUhSdklIUm9aU0J3Y205dGFYTmxYRzRnSUNBZ0x5OGdhVzV6ZEdWaFpDQnZaaUJ3WVhOemFXNW5JR2wwSUdGeklHRWdjMmx0Y0d4bElIWmhiSFZsTGlCVWJ5QmhkbTlwWkNCMGFHRjBJSGRsSUdSbGRHVmpkQ0IwYUdWY2JpQWdJQ0F2THlCallYTmxJR0Z1WkNCM2NtRndJR2wwSUdsdUlHRnVJR0Z5Y21GNUxseHVJQ0FnSUdsbUlDaGhZM1IxWVd3Z0ppWWdkSGx3Wlc5bUlHRmpkSFZoYkM1MGFHVnVJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQmhZM1IxWVd3Z1BTQmJYRzRnSUNBZ0lDQWdJQ2RCYzNNNklGWmhiSFZsSUhkeVlYQndaV1FnYVc0Z1lXNGdZWEp5WVhrZ2MybHVZMlVnYVhRZ2JHOXZhM01nYkdsclpTQmhJRkJ5YjIxcGMyVW5MRnh1SUNBZ0lDQWdJQ0JoWTNSMVlXeGNiaUFnSUNBZ0lGMDdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ0tISmxjM1ZzZENBL0lISmxjMjlzZG1VZ09pQnlaV3BsWTNRcEtDQmhZM1IxWVd3Z0tUdGNiaUFnZlNrN1hHNWNiaUFnTHk4Z1FYUjBZV05vSUdGc2JDQjBhR1VnY21WbmFYTjBaWEpsWkNCMGFHVnVjeUIwYnlCMGFHVWdjSEp2YldselpTQnpieUIwYUdWNUlHZGxkQ0J1YjNScFptbGxaRnh1SUNCZkxtWnZja1ZoWTJnb2RHaHBjeTVmWDNSb1pXNXpYMThzSUdaMWJtTjBhVzl1SUNoallXeHNZbUZqYTNNcElIdGNiaUFnSUNCd2NtOXRhWE5sSUQwZ2NISnZiV2x6WlM1MGFHVnVMbUZ3Y0d4NUtIQnliMjFwYzJVc0lHTmhiR3hpWVdOcmN5azdYRzRnSUgwcE8xeHVmVHRjYmx4dVpuVnVZM1JwYjI0Z1pIVnRjRU5vWVdsdUlDaHlaWE52YkhabFpDd2dhVzVrWlc1MEtTQjdYRzRnSUhaaGNpQnlaWE4xYkhRZ1BTQW5KenRjYmx4dUlDQnBibVJsYm5RZ1BTQnBibVJsYm5RZ2ZId2dKeWM3WEc1Y2JpQWdjbVZ6YjJ4MlpXUXVabTl5UldGamFDaG1kVzVqZEdsdmJpQW9aWGh3TENCcFpIZ3BJSHRjYmlBZ0lDQnBaaUFvUVhKeVlYa3VhWE5CY25KaGVTaGxlSEFwS1NCN1hHNGdJQ0FnSUNCeVpYTjFiSFFnS3owZ1pIVnRjRU5vWVdsdUtHVjRjQ3dnYVc1a1pXNTBJQ3NnSnlBZ0p5azdYRzRnSUNBZ0lDQnlaWFIxY200N1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYVdZZ0tHVjRjQzV5WlhOMWJIUXBJSHRjYmlBZ0lDQWdJSEpsYzNWc2RDQXJQU0JwYm1SbGJuUWdLeUFuSUZ4Y2RUQXdNV0piTXpKdFVHRnpjMlZrT2x4Y2RUQXdNV0piTUcwZ0p5QXJJR1Y0Y0M1a1pYTmpjbWx3ZEdsdmJpQXJJQ2RjWEc0bk8xeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dUlDQWdJSDFjYmx4dUlDQWdJSEpsYzNWc2RDQXJQU0JwYm1SbGJuUWdLeUFuSUZ4Y2RUQXdNV0piTXpGdFJtRnBiR1ZrT2x4Y2RUQXdNV0piTUcwZ0p5QXJJR1Y0Y0M1a1pYTmpjbWx3ZEdsdmJpQXJJQ2RjWEc0bk8xeHVJQ0FnSUdsbUlDaHBaSGdnUFQwOUlISmxjMjlzZG1Wa0xteGxibWQwYUNBdElERXBJSHRjYmlBZ0lDQWdJSEpsYzNWc2RDQXJQU0JwYm1SbGJuUWdLeUFuSUNBZ0lGeGNkVEF3TVdKYk16TnRRblYwT2x4Y2RUQXdNV0piTUcwZ0p5QXJJR1Y0Y0M1bVlXbHNkWEpsSUNzZ0oxeGNiaWM3WEc0Z0lDQWdmVnh1WEc0Z0lIMHBPMXh1WEc0Z0lISmxkSFZ5YmlCeVpYTjFiSFE3WEc1OVhHNWNibHh1THk4Z1FuVnBiR1J6SUdGdUlFRnpjMFZ5Y205eUlHWnZjaUIwYUdVZ1kzVnljbVZ1ZENCbGVIQnlaWE56YVc5dUxpQkpkQ0J0WVd0bGN5QmhJR052ZFhCc1pTQnZabHh1THk4Z1lYTnpkVzF3ZEdsdmJuTXNJR1p2Y2lCcGJuTjBZVzVqWlNCMGFHVWdMbDlmYjJabWMyVjBYMThnYlhWemRDQmlaU0J3YkdGalpXUWdhblZ6ZENCaFpuUmxjaUIwYUdWY2JpOHZJR1Y0Y0dWamRHRjBhVzl1SUhSb1lYUWdjSEp2WkhWalpXUWdkR2hsSUdaaGFXeDFjbVVnYjJZZ2RHaGxJR05vWVdsdUxseHVjSEp2ZEc4dVluVnBiR1JGY25KdmNpQTlJR1oxYm1OMGFXOXVJQ2h5WlhOdmJIWmxaQ3dnYzNObUtTQjdYRzVjYmlBZ2RtRnlJR1Z5Y205eUlEMGdkR2hwY3k1ZlgyUmxjMk55YVhCMGFXOXVYMThnS3lBblhGeHVYRnh1Snp0Y2JseHVJQ0JsZUhBZ1BTQnlaWE52YkhabFpGc2djbVZ6YjJ4MlpXUXViR1Z1WjNSb0lDMGdNU0JkTzF4dUlDQmxjbkp2Y2lBclBTQmtkVzF3UTJoaGFXNG9jbVZ6YjJ4MlpXUXBPMXh1WEc0Z0lHbG1JQ2doZFhScGJDNWtiME52Ykc5eWN5Z3BLU0I3WEc0Z0lDQWdaWEp5YjNJZ1BTQjFkR2xzTG5WdVlXNXphU2hsY25KdmNpazdYRzRnSUgxY2JseHVJQ0F2THlCVVQwUlBPaUJ6YUc5M1JHbG1aaUJ6YUc5MWJHUWdZbVVnZFhObFpDQnZibXg1SUhkb1pXNGdhWFFnYldGclpYTWdjMlZ1YzJVZ2NHVnlhR0Z3YzF4dUlDQXZMeUFnSUNBZ0lDQjNaU0JqWVc0Z2NHRnpjeUJ1ZFd4c0wzVnVaR1ZtYVc1bFpDQmhibVFnYkdWMElFRnpjMFZ5Y205eUlHUmxkR1ZqZENCM2FHVnVJR2wwWEc0Z0lDOHZJQ0FnSUNBZ0lHMWhhMlZ6SUhObGJuTmxMbHh1WEc0Z0lIWmhjaUJsZUhCbFkzUmxaQ0E5SUdWNGNDNWxlSEJsWTNSbFpEdGNiaUFnTHk4Z1RXOWphR0VnZDJsc2JDQjBjbmtnZEc4Z2FuTnZibWxtZVNCMGFHVWdaWGh3WldOMFpXUWdkbUZzZFdVc0lHcDFjM1FnYVdkdWIzSmxJR2xtSUdsMEozTWdZU0JtZFc1amRHbHZibHh1SUNCcFppQW9kSGx3Wlc5bUlHVjRjR1ZqZEdWa0lEMDlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnWlhod1pXTjBaV1FnUFNCdWRXeHNPMXh1SUNCOVhHNWNiaUFnZG1GeUlHbHVjM1FnUFNCdVpYY2dRWE56UlhKeWIzSW9aWEp5YjNJc0lITnpaaUI4ZkNCaGNtZDFiV1Z1ZEhNdVkyRnNiR1ZsSUh4OElIQnliM1J2TG1KMWFXeGtSWEp5YjNJcE8xeHVJQ0JwYm5OMExuTm9iM2RFYVdabUlEMGdabUZzYzJVN1hHNGdJR2x1YzNRdVlXTjBkV0ZzSUQwZ2JuVnNiRHRjYmlBZ2FXNXpkQzVsZUhCbFkzUmxaQ0E5SUc1MWJHdzdYRzRnSUhKbGRIVnliaUJwYm5OME8xeHVmVHRjYmx4dUx5OGdVbVZ6YjJ4MlpYTWdkR2hsSUdOMWNuSmxiblFnWTJoaGFXNGdabTl5SUdFZ1oybDJaVzRnZG1Gc2RXVXVJRlJvWlNCeVpYTjFiSFFnYVhNZ1lXeDNZWGx6SUdGY2JpOHZJR0p2YjJ4bFlXNGdhVzVrYVdOaGRHbHVaeUIwYUdVZ2IzVjBZMjl0WlNCdmNpQmhiaUIxYm1SbFptbHVaV1FnZEc4Z2MybG5ibUZzSUhSb1lYUWdhWFFnY21WaFkyaGxaRnh1THk4Z1lXNGdZWE41Ym1Ob2NtOXViM1Z6SUdac2IzY3VYRzV3Y205MGJ5NTBaWE4wSUQwZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0JwWmlBb1lYSm5kVzFsYm5SekxteGxibWQwYUNBOVBUMGdNQ2tnZTF4dUlDQWdJR0ZqZEhWaGJDQTlJSFJvYVhNdWRtRnNkV1U3WEc0Z0lIMWNibHh1SUNBdkx5QlNaWE52YkhabElIUm9aU0JqYUdGcGJpQnpkR0Z5ZEdsdVp5Qm1jbTl0SUhKdmIzUmNiaUFnZG1GeUlISmxjMjlzZG1WeUlEMGdjbVZ6YjJ4MlpYSnpMbUZqY1hWcGNtVW9kR2hwY3lrN1hHNGdJSFpoY2lCeVpYTjFiSFFnUFNCeVpYTnZiSFpsY2loaFkzUjFZV3dwTzF4dVhHNGdJSEpsZEhWeWJpQnlaWE4xYkhRN1hHNTlPMXh1WEc0dkx5QlFaWEptYjNKdGN5QjBhR1VnY21WemIyeDFkR2x2YmlCdlppQjBhR1VnWTJoaGFXNGdZblYwSUdGa1pHbDBhVzl1WVd4c2VTQjNhV3hzSUhKaGFYTmxJR0Z1SUdWeWNtOXlYRzR2THlCcFppQnBkQ0JtWVdsc2N5QjBieUJqYjIxd2JHVjBaUzRnVjJobGJpQjBhR1VnWlhod2NtVnpjMmx2YmlCeVpYTnZiSFpsY3lCaGN5QjFibVJsWm1sdVpXUWdLR0Z6ZVc1aktWeHVMeThnYVhRbmJHd2dZbVVnWVhWMGIyMWhkR2xqWVd4c2VTQmxibUZpYkdVZ2FYUnpJR1JsWm1WeWNtVmtJR1pzWVdjdVhHNHZMeUJVYUdVZ1lITnpabUFnYzNSaGJtUnpJR1p2Y2lCVGRHRmphMVJ5WVdObFJuVnVZM1JwYjI0c0lHRWdjbVZtWlhKbGJtTmxJSFJ2SUhSb1pTQm1hWEp6ZENCbWRXNWpkR2x2Ymx4dUx5OGdkRzhnYzJodmR5QnZiaUIwYUdVZ2MzUmhZMnNnZEhKaFkyVXVYRzV3Y205MGJ5NWhjM05sY25RZ1BTQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQnpjMllwSUh0Y2JpQWdhV1lnS0dGeVozVnRaVzUwY3k1c1pXNW5kR2dnUFQwOUlEQXBJSHRjYmlBZ0lDQmhZM1IxWVd3Z1BTQjBhR2x6TG5aaGJIVmxPMXh1SUNCOVhHNWNiaUFnTHk4Z1NuVnpkQ0JwWjI1dmNtVWdhV1lnZEdobElHRmpkSFZoYkNCMllXeDFaU0JwY3lCdWIzUWdjSEpsYzJWdWRDQjVaWFJjYmlBZ0x5OGdWRTlFVHpvZ1UyaGhiR3dnYVhRZ2NISnZaSFZqWlNCaGJpQmxjbkp2Y2o5Y2JpQWdhV1lnS0dGamRIVmhiQ0E5UFQwZ2RHaHBjeTVmWDBkVlFWSkVYMThwSUhKbGRIVnliaUIwYUdsek8xeHVYRzRnSUhaaGNpQnlaWE52YkhabGNpQTlJSEpsYzI5c2RtVnljeTVoWTNGMWFYSmxLSFJvYVhNcE8xeHVJQ0IyWVhJZ2NtVnpkV3gwSUQwZ2NtVnpiMngyWlhJb1lXTjBkV0ZzS1R0Y2JseHVJQ0F2THlCSmRDQm1ZV2xzWldRZ2MyOGdjbVZ3YjNKMElHbDBJSGRwZEdnZ1lTQnVhV05sSUdWeWNtOXlYRzRnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJR1poYkhObEtTQjdYRzRnSUNBZ2RHaHliM2NnZEdocGN5NWlkV2xzWkVWeWNtOXlLSEpsYzI5c2RtVnlMbkpsYzI5c2RtVmtMQ0J6YzJZZ2ZId2dkR2hwY3k1aGMzTmxjblFwTzF4dUlDQjlYRzVjYmlBZ0x5OGdRMjl1ZG1WeWRDQjBhR1VnWlhod2NtVnpjMmx2YmlCcGJuUnZJR0VnWkdWbVpYSnlaV1FnYVdZZ1lXNGdZWE41Ym1NZ1pYaHdaV04wYVc5dUlIZGhjeUJtYjNWdVpGeHVJQ0JwWmlBb2NtVnpkV3gwSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQjBhR2x6TGw5ZlpHVm1aWEp5WldSZlh5QTlJSFJ5ZFdVN1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2RHaHBjenRjYm4wN1hHNWNiaTh2SUVGemMyVnlkSE1nZEdobElIQnliM1pwWkdWa0lIWmhiSFZsSUdGdVpDQnBaaUJ6ZFdOalpYTnpablZzSUhKbGRIVnlibk1nZEdobElHOXlhV2RwYm1Gc1hHNHZMeUIyWVd4MVpTQnBibk4wWldGa0lHOW1JSFJvWlNCamFHRnBiaUJwYm5OMFlXNWpaUzVjYm5CeWIzUnZMblJvY205MVoyZ2dQU0JtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lIUm9hWE11WVhOelpYSjBLR0ZqZEhWaGJDd2djSEp2ZEc4dWRHaHliM1ZuYUNrN1hHNGdJSEpsZEhWeWJpQmhZM1IxWVd3N1hHNTlPMXh1WEc0dkx5QkZkbUZzZFdGMFpYTWdkR2hsSUdWNGNISmxjM05wYjI0Z1kyaGhhVzRnY21Wd2IzSjBhVzVuSUhSb1pTQnNZWE4wSUcxMWRHRjBaV1FnZG1Gc2RXVWdjMlZsYmlCcGJseHVMeThnYVhRdUlFbG1JSFJvWlNCbGVIQnlaWE56YVc5dUlHUnZaWE1nYm05MElHTnZiWEJzWlhSbElHbDBKMnhzSUhKbGRIVnliaUIxYm1SbFptbHVaV1F1WEc1d2NtOTBieTV5WlhOMWJIUWdQU0JtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lIWmhjaUJ5WlhOMWJIUTdYRzVjYmlBZ2FXWWdLR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dQVDA5SURBcElIdGNiaUFnSUNCaFkzUjFZV3dnUFNCMGFHbHpMblpoYkhWbE8xeHVJQ0I5WEc1Y2JpQWdkSEo1SUh0Y2JpQWdJQ0IwYUdsekxuUmhjQ2htZFc1amRHbHZiaUFvZG1Gc2RXVXBJSHRjYmlBZ0lDQWdJSEpsYzNWc2RDQTlJSFpoYkhWbE8xeHVJQ0FnSUgwcExuUmxjM1FvWVdOMGRXRnNLVHRjYmlBZ2ZTQm1hVzVoYkd4NUlIdGNiaUFnSUNBdkx5QlNaVzF2ZG1VZ2RHaGxJQzUwWVhBZ1puSnZiU0IwYUdVZ1kyaGhhVzVjYmlBZ0lDQjBhR2x6TGw5ZlpYaHdaV04wWVhScGIyNXpYMTh1Y0c5d0tDazdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdjbVZ6ZFd4ME8xeHVmVHRjYmx4dVEyaGhhVzR1Y0hKdmRHOTBlWEJsTG5aaGJIVmxUMllnUFNCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUhKbGRIVnliaUIwYUdsekxuWmhiSFZsTzF4dWZUdGNibHh1UTJoaGFXNHVjSEp2ZEc5MGVYQmxMblJ2VTNSeWFXNW5JRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0JwWmlBb2RHaHBjeTVmWDJSbGMyTnlhWEIwYVc5dVgxOHBJSHRjYmlBZ0lDQnlaWFIxY200Z2RHaHBjeTVmWDJSbGMyTnlhWEIwYVc5dVgxODdYRzRnSUgxY2JseHVJQ0IyWVhJZ1pHVnpZM01nUFZ4dUlDQWdJSFJvYVhNdVgxOWxlSEJsWTNSaGRHbHZibk5mWDF4dUlDQWdJQzVtYVd4MFpYSW9ablZ1WTNScGIyNGdLR01wSUhzZ2NtVjBkWEp1SUdNdVpHVnpZM0pwY0hScGIyNGdmU2xjYmlBZ0lDQXViV0Z3S0daMWJtTjBhVzl1SUNoaktTQjdJSEpsZEhWeWJpQmpMbVJsYzJOeWFYQjBhVzl1SUgwcE8xeHVYRzRnSUdsbUlDaGtaWE5qY3k1c1pXNW5kR2dnUGlBeEtTQjdYRzRnSUNBZ2NtVjBkWEp1SUNjb0p5QXJJR1JsYzJOekxtcHZhVzRvSnl3Z0p5a2dLeUFuS1NjN1hHNGdJSDBnWld4elpTQnBaaUFvWkdWelkzTXViR1Z1WjNSb0lEMDlQU0F4S1NCN1hHNGdJQ0FnY21WMGRYSnVJR1JsYzJOeld6QmRPMXh1SUNCOUlHVnNjMlVnZTF4dUlDQWdJSEpsZEhWeWJpQW5QRUZ6YzBOb1lXbHVQaWM3WEc0Z0lIMWNibjA3WEc1Y2JseHViVzlrZFd4bExtVjRjRzl5ZEhNZ1BTQkRhR0ZwYmp0Y2JpSmRmUT09IiwiLy8gQVBJIGNvbXBhdGlibGUgd2l0aCBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2Fzc2VydGlvbi1lcnJvci9cbi8vIFRoaXMgc2hvdWxkIG1ha2UgaW50ZWdyYXRpb24gd2l0aCBNb2NoYSB3b3JrLCBpbmNsdWRpbmcgZGlmZmVkXG4vLyBvdXRwdXQuXG5cbnZhciBGYWlsdXJlID0gcmVxdWlyZSgnZmFpbHVyZScpO1xuXG52YXIgdW5hbnNpID0gcmVxdWlyZSgnLi91dGlsJykudW5hbnNpO1xuXG5cbnZhciBBc3NFcnJvciA9IEZhaWx1cmUuY3JlYXRlKCdBc3NFcnJvcicpO1xudmFyIHByb3RvID0gQXNzRXJyb3IucHJvdG90eXBlO1xuXG5wcm90by5zaG93RGlmZiA9IGZhbHNlO1xucHJvdG8uYWN0dWFsID0gbnVsbDtcbnByb3RvLmV4cGVjdGVkID0gbnVsbDtcblxuZnVuY3Rpb24gZ2V0VGFyZ2V0TGluZSAoZnJhbWVzKSB7XG4gIGZ1bmN0aW9uIGdldFNyYyAoZnJhbWUpIHtcbiAgICB2YXIgZm4gPSBmcmFtZS5nZXRGdW5jdGlvbigpO1xuICAgIHJldHVybiBmbiA/IGZuLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxzKy9nLCAnJykgOiBudWxsO1xuICB9XG5cbiAgaWYgKCFmcmFtZXMubGVuZ3RoKSByZXR1cm4gbnVsbDtcblxuICAvLyBGaXJzdCBmcmFtZSBpcyBub3cgdGhlIHRhcmdldFxuICB2YXIgdGFyZ2V0ID0gZnJhbWVzWzBdO1xuICB2YXIgdGFyZ2V0U3JjID0gZ2V0U3JjKHRhcmdldCk7XG4gIGlmICghdGFyZ2V0U3JjKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBGaWx0ZXIgb3V0IGFsbCBmcmFtZXMgd2hpY2ggYXJlIG5vdCBpbiB0aGUgc2FtZSBmaWxlXG4gIHNhbWVmaWxlID0gZnJhbWVzLmZpbHRlcihmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICByZXR1cm4gZnJhbWUgJiYgZnJhbWUuZ2V0RmlsZU5hbWUoKSA9PT0gdGFyZ2V0LmdldEZpbGVOYW1lKCk7XG4gIH0pO1xuXG4gIC8vIEdldCB0aGUgY2xvc2VzdCBmdW5jdGlvbiBpbiB0aGUgc2FtZSBmaWxlIHRoYXQgd3JhcHMgdGhlIHRhcmdldCBmcmFtZVxuICB2YXIgd3JhcHBlcjtcbiAgZm9yICh2YXIgaT0xOyBpIDwgc2FtZWZpbGUubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc3JjID0gZ2V0U3JjKHNhbWVmaWxlW2ldKTtcbiAgICBpZiAoc3JjICYmIC0xICE9PSBzcmMuaW5kZXhPZih0YXJnZXRTcmMpKSB7XG4gICAgICB3cmFwcGVyID0gc2FtZWZpbGVbaV07XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBXaGVuIGEgd3JhcHBlciBmdW5jdGlvbiBpcyBmb3VuZCB3ZSBjYW4gdXNlIGl0IHRvIG9idGFpbiB0aGUgbGluZSB3ZSB3YW50XG4gIGlmICh3cmFwcGVyKSB7XG4gICAgLy8gR2V0IHJlbGF0aXZlIHBvc2l0aW9uc1xuICAgIHZhciByZWxMbiA9IHRhcmdldC5nZXRMaW5lTnVtYmVyKCkgLSB3cmFwcGVyLmdldExpbmVOdW1iZXIoKTtcbiAgICB2YXIgcmVsQ2wgPSB0YXJnZXQuZ2V0TGluZU51bWJlcigpID09PSB3cmFwcGVyLmdldExpbmVOdW1iZXIoKVxuICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgOiB0YXJnZXQuZ2V0Q29sdW1uTnVtYmVyKCkgLSAxO1xuXG4gICAgdmFyIGxpbmVzID0gdGFyZ2V0LmdldEZ1bmN0aW9uKCkudG9TdHJpbmcoKS5zcGxpdCgvXFxuLyk7XG4gICAgaWYgKGxpbmVzW3JlbExuXSkge1xuICAgICAgcmV0dXJuIGxpbmVzW3JlbExuXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxucHJvdG8udG9KU09OID0gZnVuY3Rpb24gKHN0YWNrKSB7XG4gIHZhciBwcm9wcyA9IHtcbiAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgbWVzc2FnZTogdW5hbnNpKHRoaXMubWVzc2FnZSksXG4gICAgYWN0dWFsOiB0aGlzLmFjdHVhbCxcbiAgICBleHBlY3RlZDogdGhpcy5leHBlY3RlZCxcbiAgICBzaG93RGlmZjogdGhpcy5zaG93RGlmZlxuICB9O1xuXG4gIC8vIGluY2x1ZGUgc3RhY2sgaWYgZXhpc3RzIGFuZCBub3QgdHVybmVkIG9mZlxuICBpZiAoc3RhY2sgJiYgdGhpcy5zdGFjaykge1xuICAgIHByb3BzLnN0YWNrID0gdGhpcy5zdGFjaztcbiAgfVxuXG4gIHJldHVybiBwcm9wcztcbn07XG5cbnByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbXNnID0gRmFpbHVyZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGlzKTtcblxuICB2YXIgbGluZSA9IGdldFRhcmdldExpbmUodGhpcy5mcmFtZXMpO1xuICBpZiAobGluZSkge1xuICAgIG1zZyArPSAnXFxuICA+PiAnICsgbGluZS5yZXBsYWNlKC9eXFxzKy8sICcnKS5zbGljZSgwLCA2MCkgKyAnXFxuJztcbiAgfVxuXG4gIHJldHVybiBtc2c7XG59O1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBBc3NFcnJvcjtcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG52YXIgTWF0Y2hlciA9IHJlcXVpcmUoJy4vbWF0Y2hlcicpO1xuXG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3V0aWwnKS50ZW1wbGF0ZTtcblxuXG4vLyBFeHBlY3RhdGlvbiByZXByZXNlbnRzIGFuIGluc3RhbnRpYXRlZCBNYXRjaGVyIGFscmVhZHkgY29uZmlndXJlZCB3aXRoXG4vLyBhbnkgYWRkaXRpb25hbCBhcmd1bWVudHMuXG5mdW5jdGlvbiBFeHBlY3RhdGlvbiAobWF0Y2hlciwgYXJncykge1xuICAvLyBHZXQgdGhlIG1hdGNoZXIgY29uZmlndXJhdGlvbiBpbnRvIHRoaXMgaW5zdGFuY2VcbiAgbWF0Y2hlci5hc3NpZ24odGhpcyk7XG5cbiAgLy8gU3VwcG9ydCBiZWluZyBnaXZlbiBhbiBgYXJndW1lbnRzYCBvYmplY3RcbiAgdGhpcy5hcmdzID0gXy50b0FycmF5KGFyZ3MpO1xuICB0aGlzLmFjdHVhbCA9IHVuZGVmaW5lZDtcbn1cblxuLy8gSW5oZXJpdCB0aGUgcHJvdG90eXBlIGZyb20gTWF0Y2hlclxudmFyIHByb3RvID0gRXhwZWN0YXRpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShNYXRjaGVyLnByb3RvdHlwZSk7XG5wcm90by5jb25zdHJ1Y3RvciA9IEV4cGVjdGF0aW9uO1xuXG4vLyBHZW5lcmF0ZSBnZXR0ZXIgZm9yIGAuZXhwZWN0ZWRgIChhbiBhbGlhcyBmb3IgYXJnc1swXSlcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2V4cGVjdGVkJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hcmdzWzBdO1xuICB9LFxuICAvLyBIYWNrOiBhbGxvdyBpdCB0byBiZSBvdmVycmlkZW4gb24gdGhlIGluc3RhbmNlXG4gIHNldDogZnVuY3Rpb24gKHYpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2V4cGVjdGVkJywge1xuICAgICAgdmFsdWU6IHZcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIEdlbmVyYXRlIGdldHRlcnMgZm9yIHRoZSBmaXJzdCA1IGFyZ3VtZW50cyBhcyBhcmcxLCBhcmcyLCAuLi5cbl8udGltZXMoNSwgZnVuY3Rpb24gKGkpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnYXJnJyArIChpICsgMSksIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmFyZ3NbaV07XG4gICAgfVxuICB9KTtcbn0pO1xuXG4vLyBDb21wdXRlIHRoZSBkZXNjcmlwdGlvbiBtZXNzYWdlIGZvciB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZXhwZWN0YXRpb25cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2Rlc2NyaXB0aW9uJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZGVzYykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdGhpcy5kZXNjID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5kZXNjKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcGxhdGUodGhpcy5kZXNjLCB0aGlzKTtcbiAgfVxufSk7XG5cbi8vIENvbXB1dGUgdGhlIGZhaWx1cmUgbWVzc2FnZSBmb3IgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGV4cGVjdGF0aW9uXG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdmYWlsdXJlJywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuZmFpbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuZmFpbCh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlKHRoaXMuZmFpbCwgdGhpcyk7XG4gIH1cbn0pO1xuXG4vLyBIZWxwZXIgdG8gbXV0YXRlIHRoZSB2YWx1ZSB1bmRlciB0ZXN0XG5FeHBlY3RhdGlvbi5wcm90b3R5cGUubXV0YXRlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIodmFsdWUpO1xuICB9O1xufTtcblxuLy8gUmVzb2x2aW5nIGNhbiBvdmVycmlkZSB0aGUgZXhwZWN0YXRpb24gc3RhdGUsIGlmIHRoYXQncyBub3QgZGVzaXJhYmxlIG1ha2Vcbi8vIHN1cmUgdGhhdCB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgaW4gYSBuZXcgY29udGV4dC5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncywgcmVzdWx0O1xuXG4gIC8vIEV4ZWN1dGUgdGhlIG1hdGNoZXIgdGVzdCBub3cgdGhhdCBldmVyeXRoaW5nIGlzIHNldFxuICBhcmdzID0gW3RoaXMuYWN0dWFsXS5jb25jYXQodGhpcy5hcmdzKTtcbiAgcmVzdWx0ID0gdGhpcy50ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuXG4gIC8vIFJldHVybmluZyBhIHN0cmluZyBvdmVycmlkZXMgdGhlIG1pc21hdGNoIGRlc2NyaXB0aW9uXG4gIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuZmFpbCA9IHJlc3VsdDtcbiAgICByZXN1bHQgPSBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5FeHBlY3RhdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRlc2NyaXB0aW9uO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cGVjdGF0aW9uO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTlsZUhCbFkzUmhkR2x2Ymk1cWN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU8wRkJRVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVpTENKbWFXeGxJam9pWjJWdVpYSmhkR1ZrTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYkluWmhjaUJmSUQwZ0tIUjVjR1Z2WmlCM2FXNWtiM2NnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCM2FXNWtiM2N1WHlBNklIUjVjR1Z2WmlCbmJHOWlZV3dnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCbmJHOWlZV3d1WHlBNklHNTFiR3dwTzF4dVhHNTJZWElnUTJoaGFXNGdQU0J5WlhGMWFYSmxLQ2N1TDJOb1lXbHVKeWs3WEc1MllYSWdUV0YwWTJobGNpQTlJSEpsY1hWcGNtVW9KeTR2YldGMFkyaGxjaWNwTzF4dVhHNTJZWElnZEdWdGNHeGhkR1VnUFNCeVpYRjFhWEpsS0NjdUwzVjBhV3duS1M1MFpXMXdiR0YwWlR0Y2JseHVYRzR2THlCRmVIQmxZM1JoZEdsdmJpQnlaWEJ5WlhObGJuUnpJR0Z1SUdsdWMzUmhiblJwWVhSbFpDQk5ZWFJqYUdWeUlHRnNjbVZoWkhrZ1kyOXVabWxuZFhKbFpDQjNhWFJvWEc0dkx5QmhibmtnWVdSa2FYUnBiMjVoYkNCaGNtZDFiV1Z1ZEhNdVhHNW1kVzVqZEdsdmJpQkZlSEJsWTNSaGRHbHZiaUFvYldGMFkyaGxjaXdnWVhKbmN5a2dlMXh1SUNBdkx5QkhaWFFnZEdobElHMWhkR05vWlhJZ1kyOXVabWxuZFhKaGRHbHZiaUJwYm5SdklIUm9hWE1nYVc1emRHRnVZMlZjYmlBZ2JXRjBZMmhsY2k1aGMzTnBaMjRvZEdocGN5azdYRzVjYmlBZ0x5OGdVM1Z3Y0c5eWRDQmlaV2x1WnlCbmFYWmxiaUJoYmlCZ1lYSm5kVzFsYm5SellDQnZZbXBsWTNSY2JpQWdkR2hwY3k1aGNtZHpJRDBnWHk1MGIwRnljbUY1S0dGeVozTXBPMXh1SUNCMGFHbHpMbUZqZEhWaGJDQTlJSFZ1WkdWbWFXNWxaRHRjYm4xY2JseHVMeThnU1c1b1pYSnBkQ0IwYUdVZ2NISnZkRzkwZVhCbElHWnliMjBnVFdGMFkyaGxjbHh1ZG1GeUlIQnliM1J2SUQwZ1JYaHdaV04wWVhScGIyNHVjSEp2ZEc5MGVYQmxJRDBnVDJKcVpXTjBMbU55WldGMFpTaE5ZWFJqYUdWeUxuQnliM1J2ZEhsd1pTazdYRzV3Y205MGJ5NWpiMjV6ZEhKMVkzUnZjaUE5SUVWNGNHVmpkR0YwYVc5dU8xeHVYRzR2THlCSFpXNWxjbUYwWlNCblpYUjBaWElnWm05eUlHQXVaWGh3WldOMFpXUmdJQ2hoYmlCaGJHbGhjeUJtYjNJZ1lYSm5jMXN3WFNsY2JrOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBlU2h3Y205MGJ5d2dKMlY0Y0dWamRHVmtKeXdnZTF4dUlDQm5aWFE2SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNCeVpYUjFjbTRnZEdocGN5NWhjbWR6V3pCZE8xeHVJQ0I5TEZ4dUlDQXZMeUJJWVdOck9pQmhiR3h2ZHlCcGRDQjBieUJpWlNCdmRtVnljbWxrWlc0Z2IyNGdkR2hsSUdsdWMzUmhibU5sWEc0Z0lITmxkRG9nWm5WdVkzUnBiMjRnS0hZcElIdGNiaUFnSUNCUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRIa29kR2hwY3l3Z0oyVjRjR1ZqZEdWa0p5d2dlMXh1SUNBZ0lDQWdkbUZzZFdVNklIWmNiaUFnSUNCOUtUdGNiaUFnZlZ4dWZTazdYRzVjYmk4dklFZGxibVZ5WVhSbElHZGxkSFJsY25NZ1ptOXlJSFJvWlNCbWFYSnpkQ0ExSUdGeVozVnRaVzUwY3lCaGN5QmhjbWN4TENCaGNtY3lMQ0F1TGk1Y2JsOHVkR2x0WlhNb05Td2dablZ1WTNScGIyNGdLR2twSUh0Y2JpQWdUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1S0hCeWIzUnZMQ0FuWVhKbkp5QXJJQ2hwSUNzZ01Ta3NJSHRjYmlBZ0lDQm5aWFE2SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbUZ5WjNOYmFWMDdYRzRnSUNBZ2ZWeHVJQ0I5S1R0Y2JuMHBPMXh1WEc0dkx5QkRiMjF3ZFhSbElIUm9aU0JrWlhOamNtbHdkR2x2YmlCdFpYTnpZV2RsSUdadmNpQjBhR1VnWTNWeWNtVnVkQ0J6ZEdGMFpTQnZaaUIwYUdVZ1pYaHdaV04wWVhScGIyNWNiazlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNod2NtOTBieXdnSjJSbGMyTnlhWEIwYVc5dUp5d2dlMXh1SUNCblpYUTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0JwWmlBb0lYUm9hWE11WkdWell5a2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHNTFiR3c3WEc0Z0lDQWdmVnh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdkR2hwY3k1a1pYTmpJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTVrWlhOaktIUm9hWE1wTzF4dUlDQWdJSDFjYmlBZ0lDQnlaWFIxY200Z2RHVnRjR3hoZEdVb2RHaHBjeTVrWlhOakxDQjBhR2x6S1R0Y2JpQWdmVnh1ZlNrN1hHNWNiaTh2SUVOdmJYQjFkR1VnZEdobElHWmhhV3gxY21VZ2JXVnpjMkZuWlNCbWIzSWdkR2hsSUdOMWNuSmxiblFnYzNSaGRHVWdiMllnZEdobElHVjRjR1ZqZEdGMGFXOXVYRzVQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb2NISnZkRzhzSUNkbVlXbHNkWEpsSnl3Z2UxeHVJQ0JuWlhRNklHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JSFJvYVhNdVptRnBiQ0E5UFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11Wm1GcGJDaDBhR2x6S1R0Y2JpQWdJQ0I5WEc0Z0lDQWdjbVYwZFhKdUlIUmxiWEJzWVhSbEtIUm9hWE11Wm1GcGJDd2dkR2hwY3lrN1hHNGdJSDFjYm4wcE8xeHVYRzR2THlCSVpXeHdaWElnZEc4Z2JYVjBZWFJsSUhSb1pTQjJZV3gxWlNCMWJtUmxjaUIwWlhOMFhHNUZlSEJsWTNSaGRHbHZiaTV3Y205MGIzUjVjR1V1YlhWMFlYUmxJRDBnWm5WdVkzUnBiMjRnS0haaGJIVmxLU0I3WEc0Z0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNCeVpYUjFjbTRnY21WemIyeDJaWElvZG1Gc2RXVXBPMXh1SUNCOU8xeHVmVHRjYmx4dUx5OGdVbVZ6YjJ4MmFXNW5JR05oYmlCdmRtVnljbWxrWlNCMGFHVWdaWGh3WldOMFlYUnBiMjRnYzNSaGRHVXNJR2xtSUhSb1lYUW5jeUJ1YjNRZ1pHVnphWEpoWW14bElHMWhhMlZjYmk4dklITjFjbVVnZEdoaGRDQjBhR2x6SUcxbGRHaHZaQ0JwY3lCallXeHNaV1FnYVc0Z1lTQnVaWGNnWTI5dWRHVjRkQzVjYmtWNGNHVmpkR0YwYVc5dUxuQnliM1J2ZEhsd1pTNXlaWE52YkhabElEMGdablZ1WTNScGIyNGdLQ2tnZTF4dUlDQjJZWElnWVhKbmN5d2djbVZ6ZFd4ME8xeHVYRzRnSUM4dklFVjRaV04xZEdVZ2RHaGxJRzFoZEdOb1pYSWdkR1Z6ZENCdWIzY2dkR2hoZENCbGRtVnllWFJvYVc1bklHbHpJSE5sZEZ4dUlDQmhjbWR6SUQwZ1czUm9hWE11WVdOMGRXRnNYUzVqYjI1allYUW9kR2hwY3k1aGNtZHpLVHRjYmlBZ2NtVnpkV3gwSUQwZ2RHaHBjeTUwWlhOMExtRndjR3g1S0hSb2FYTXNJR0Z5WjNNcE8xeHVYRzRnSUM4dklGSmxkSFZ5Ym1sdVp5QmhJSE4wY21sdVp5QnZkbVZ5Y21sa1pYTWdkR2hsSUcxcGMyMWhkR05vSUdSbGMyTnlhWEIwYVc5dVhHNGdJR2xtSUNoMGVYQmxiMllnY21WemRXeDBJRDA5UFNBbmMzUnlhVzVuSnlrZ2UxeHVJQ0FnSUhSb2FYTXVabUZwYkNBOUlISmxjM1ZzZER0Y2JpQWdJQ0J5WlhOMWJIUWdQU0JtWVd4elpUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQnlaWE4xYkhRN1hHNTlPMXh1WEc1RmVIQmxZM1JoZEdsdmJpNXdjbTkwYjNSNWNHVXVkRzlUZEhKcGJtY2dQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJSEpsZEhWeWJpQjBhR2x6TG1SbGMyTnlhWEIwYVc5dU8xeHVmVHRjYmx4dVhHNXRiMlIxYkdVdVpYaHdiM0owY3lBOUlFVjRjR1ZqZEdGMGFXOXVPMXh1SWwxOSIsIi8vIFRoZSBNYXRjaGVyIG9iamVjdCBpcyBhIGRlc2NyaXB0b3IgZm9yIHRoZSBtYXRjaGluZyBsb2dpYyBidXQgY2Fubm90XG4vLyBiZSB1c2VkIGRpcmVjdGx5LiBVc2UgYW4gRXhwZWN0YXRpb24gdG8gZ2V0IGFuIGluaXRpYWxpemVkIG1hdGNoZXIuXG5mdW5jdGlvbiBNYXRjaGVyIChuYW1lLCBkZXNjcmlwdG9yKSB7XG5cbiAgLy8gU2hvcnRjdXQgZm9yIHNpbXBsZSB0ZXN0IGZ1bmN0aW9uc1xuICBpZiAodHlwZW9mIGRlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkZXNjcmlwdG9yID0ge3Rlc3Q6IGRlc2NyaXB0b3J9O1xuICB9XG5cbiAgLy8gVGhlIGdlbmVyaWMgbmFtZSBvZiB0aGUgbWF0Y2hlclxuICB0aGlzLm5hbWUgPSBuYW1lO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGRlc2NyaXB0b3IuaGVscCkpIHtcbiAgICB0aGlzLmhlbHAgPSBkZXNjcmlwdG9yLmhlbHAuam9pbignXFxuJyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5oZWxwID0gZGVzY3JpcHRvci5oZWxwIHx8ICdOb3QgYXZhaWxhYmxlJztcbiAgfVxuXG4gIC8vIEVpdGhlciBhIHRlbXBsYXRlIHN0cmluZyBvciBhIGZ1bmN0aW9uIHRoYXQgd2lsbCByZWNlaXZlIGFzIG9ubHlcbiAgLy8gYXJndW1lbnQgYW4gRXhwZWN0YXRpb24gaW5zdGFuY2UgKGNhbGxlZCBhcyBhIG1ldGhvZCBvZiBpdCkuXG4gIHRoaXMuZGVzYyA9IGRlc2NyaXB0b3IuZGVzYyAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IGRlc2NyaXB0b3IuZGVzY1xuICAgICAgICAgICAgOiB0aGlzLm5hbWU7XG5cbiAgLy8gRWl0aGVyIGEgdGVtcGxhdGUgc3RyaW5nIG9yIGEgZnVuY3Rpb24gdGhhdCB3aWxsIHJlY2VpdmUgYXMgb25seVxuICAvLyBhcmd1bWVudCBhbiBFeHBlY3RhdGlvbiBpbnN0YW5jZSAoY2FsbGVkIGFzIGEgbWV0aG9kIG9mIGl0KS5cbiAgdGhpcy5mYWlsID0gZGVzY3JpcHRvci5mYWlsIHx8ICd3YXMge3sgYWN0dWFsIH19JztcblxuICBpZiAoIWRlc2NyaXB0b3IudGVzdCkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGVzdCBmdW5jdGlvbiBub3QgZGVmaW5lZCBmb3IgdGhlIG1hdGNoZXInKTtcbiAgfVxuICB0aGlzLnRlc3QgPSBkZXNjcmlwdG9yLnRlc3Q7XG5cbiAgdGhpcy5hcml0eSA9IGRlc2NyaXB0b3IuYXJpdHkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgID8gZGVzY3JpcHRvci5hcml0eVxuICAgICAgICAgICAgIDogdGhpcy50ZXN0Lmxlbmd0aDtcbn1cblxuTWF0Y2hlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuTWF0Y2hlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNYXRjaGVyO1xuXG5NYXRjaGVyLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMubmFtZSwge1xuICAgIGhlbHA6IHRoaXMuaGVscCxcbiAgICBkZXNjOiB0aGlzLmRlc2MsXG4gICAgZmFpbDogdGhpcy5mYWlsLFxuICAgIHRlc3Q6IHRoaXMudGVzdCxcbiAgICBhcml0eTogdGhpcy5hcml0eVxuICB9KTtcbn07XG5cbi8vIEF1Z21lbnQgYW5vdGhlciBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBvZiB0aGlzIG1hdGNoZXJcbk1hdGNoZXIucHJvdG90eXBlLmFzc2lnbiA9IGZ1bmN0aW9uIChvYmopIHtcbiAgb2JqLmhlbHAgPSB0aGlzLmhlbHA7XG4gIG9iai5kZXNjID0gdGhpcy5kZXNjO1xuICBvYmouZmFpbCA9IHRoaXMuZmFpbDtcbiAgb2JqLnRlc3QgPSB0aGlzLnRlc3Q7XG4gIG9iai5hcml0eSA9IHRoaXMuYXJpdHk7XG59O1xuXG5NYXRjaGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICc8QXNzLk1hdGNoZXIgJyArIHRoaXMubmFtZSArICc+Jztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNYXRjaGVyO1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuLy8gR2l2ZW4gdGhlIGFyZ3VtZW50cyB3aXRoIHRoZSBicmFuY2hlcyBtYWtlIHN1cmUgdGhleSBhcmUgYWxsIGV4cHJlc3Npb25zXG5mdW5jdGlvbiB3cmFwQXJncyAoYXJncykge1xuICByZXR1cm4gXy50b0FycmF5KGFyZ3MpLnNsaWNlKDEpLm1hcChmdW5jdGlvbiAoYnJhbmNoKSB7XG4gICAgcmV0dXJuIGFzcy5DaGFpbi5pc0NoYWluKGJyYW5jaCkgPyBicmFuY2ggOiBhc3MuZXFsKGJyYW5jaCk7XG4gIH0pO1xufVxuXG5hc3MucmVnaXN0ZXIoe1xuXG4gIGFuZDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIGV4cHJlc3Npb25zLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYWxsIHRoZSBleHByZXNzaW9ucyB0aGF0IGZvcm0gaXQgZG8gaW5kZWVkIHN1Y2NlZWQuJyxcbiAgICAgICdOb3RlOiBldmFsdWF0aW9uIHdpbGwgc3RvcCBhcyBzb29uIGFzIG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgZmFpbHMuJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBBTkQgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSB3cmFwQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBDaGVjayBpZiBhbGwgYnJhbmNoZXMgcGFzcyB0aGUgdGVzdFxuICAgICAgICB2YXIgdW5kZWZzID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IF8uZXZlcnkoYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICB2YXIgcGFydGlhbCA9IGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgICAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuZGVmcyArPSAxO1xuICAgICAgICAgICAgYnJhbmNoLnRoZW4oXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksIF8ub25jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBrZWVwIGl0ZXJhdGluZ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXJ0aWFsO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRha2UgY2FyZSBvZiBhbnkgZXhwZWN0YXRpb25zIGxhdGVyIGluIHRoZSBjaGFpblxuICAgICAgICBpZiAocmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcbiAgb3I6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnQ29tcG9zZXMgYSBuZXcgZXhwZWN0YXRpb24gZnJvbSB0d28gb3IgbW9yZSBleHByZXNzaW9ucywgd2hpY2ggd2lsbCBvbmx5JyxcbiAgICAgICdzdWNjZWVkIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZXhwcmVzc2lvbnMgZG9lcy4nLFxuICAgICAgJ05vdGU6IGV2YWx1YXRpb24gd2lsbCBzdG9wIGFzIHNvb24gYXMgb25lIG9mIHRoZSBleHByZXNzaW9ucyBzdWNjZWVkcy4nXG4gICAgXSxcbiAgICBkZXNjOiAnJHsgYXJncy5qb2luKFwiIE9SIFwiKSB9JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYnJhbmNoMSwgYnJhbmNoMikge1xuICAgICAgdmFyIGJyYW5jaGVzID0gd3JhcEFyZ3MoYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGJyYW5jaGVzIHBhc3MgdGhlIHRlc3RcbiAgICAgICAgdmFyIHVuZGVmcyA9IDA7XG4gICAgICAgIHZhciByZXN1bHQgPSBfLnNvbWUoYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICB2YXIgcGFydGlhbCA9IGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgICAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuZGVmcyArPSAxO1xuICAgICAgICAgICAgYnJhbmNoLnRoZW4oXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCk7XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8ga2VlcCBpdGVyYXRpbmdcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGFydGlhbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGV4cGVjdGF0aW9ucyBsYXRlciBpbiB0aGUgY2hhaW5cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIHhvcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIGV4cHJlc3Npb25zLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBleHByZXNzaW9ucyBkb2VzIGJ1dCBub3QgYWxsIG9mIHRoZW0uJ1xuICAgIF0sXG4gICAgZGVzYzogJyR7IGFyZ3Muam9pbihcIiBYT1IgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSB3cmFwQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBDaGVjayBpZiBhbGwgYnJhbmNoZXMgcGFzcyB0aGUgdGVzdFxuICAgICAgICB2YXIgdW5kZWZzID0gMDtcbiAgICAgICAgdmFyIG9rcyA9IDA7XG4gICAgICAgIHZhciBrb3MgPSAwO1xuICAgICAgICBfLmZvckVhY2goYnJhbmNoZXMsIGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICAgICAgICB2YXIgcGFydGlhbCA9IGJyYW5jaC50ZXN0KGFjdHVhbCk7XG4gICAgICAgICAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuZGVmcyArPSAxO1xuICAgICAgICAgICAgYnJhbmNoLnRoZW4oXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKGtvcyA+IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgb2tzICs9IDE7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCwgb2tzID4gMCAmJiBrb3MgPiAwID8gdW5kZWZpbmVkIDogZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKG9rcyA+IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAga29zICs9IDE7XG4gICAgICAgICAgICAgIHVuZGVmcyAtPSAxO1xuICAgICAgICAgICAgICBpZiAoMCA9PT0gdW5kZWZzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKGFjdHVhbCwgb2tzID4gMCAmJiBrb3MgPiAwID8gdW5kZWZpbmVkIDogZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRpYWwgPT09IHRydWUpIHtcbiAgICAgICAgICAgIG9rcyArPSAxO1xuICAgICAgICAgIH0gZWxzZSBpZiAocGFydGlhbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGtvcyArPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2tzID4gMCAmJiBrb3MgPiAwID8gcmVzb2x2ZXIoYWN0dWFsKSA6IGZhbHNlO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOXRZWFJqYUdWeWN5OWpiMjl5WkdsdVlYUnBiMjR1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRWlMQ0ptYVd4bElqb2laMlZ1WlhKaGRHVmtMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSW5aaGNpQmZJRDBnS0hSNWNHVnZaaUIzYVc1a2IzY2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUIzYVc1a2IzY3VYeUE2SUhSNWNHVnZaaUJuYkc5aVlXd2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUJuYkc5aVlXd3VYeUE2SUc1MWJHd3BPMXh1WEc1MllYSWdZWE56SUQwZ2NtVnhkV2x5WlNnbkxpNHZZWE56SnlrN1hHNWNiaTh2SUVkcGRtVnVJSFJvWlNCaGNtZDFiV1Z1ZEhNZ2QybDBhQ0IwYUdVZ1luSmhibU5vWlhNZ2JXRnJaU0J6ZFhKbElIUm9aWGtnWVhKbElHRnNiQ0JsZUhCeVpYTnphVzl1YzF4dVpuVnVZM1JwYjI0Z2QzSmhjRUZ5WjNNZ0tHRnlaM01wSUh0Y2JpQWdjbVYwZFhKdUlGOHVkRzlCY25KaGVTaGhjbWR6S1M1emJHbGpaU2d4S1M1dFlYQW9ablZ1WTNScGIyNGdLR0p5WVc1amFDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCaGMzTXVRMmhoYVc0dWFYTkRhR0ZwYmloaWNtRnVZMmdwSUQ4Z1luSmhibU5vSURvZ1lYTnpMbVZ4YkNoaWNtRnVZMmdwTzF4dUlDQjlLVHRjYm4xY2JseHVZWE56TG5KbFoybHpkR1Z5S0h0Y2JseHVJQ0JoYm1RNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuUTI5dGNHOXpaWE1nWVNCdVpYY2daWGh3WldOMFlYUnBiMjRnWm5KdmJTQjBkMjhnYjNJZ2JXOXlaU0JsZUhCeVpYTnphVzl1Y3l3Z2QyaHBZMmdnZDJsc2JDQnZibXg1Snl4Y2JpQWdJQ0FnSUNkemRXTmpaV1ZrSUdsbUlHRnNiQ0IwYUdVZ1pYaHdjbVZ6YzJsdmJuTWdkR2hoZENCbWIzSnRJR2wwSUdSdklHbHVaR1ZsWkNCemRXTmpaV1ZrTGljc1hHNGdJQ0FnSUNBblRtOTBaVG9nWlhaaGJIVmhkR2x2YmlCM2FXeHNJSE4wYjNBZ1lYTWdjMjl2YmlCaGN5QnZibVVnYjJZZ2RHaGxJR1Y0Y0hKbGMzTnBiMjV6SUdaaGFXeHpMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNja2V5QmhjbWR6TG1wdmFXNG9YQ0lnUVU1RUlGd2lLU0I5Snl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N0lHRmpkSFZoYkNCOWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnWW5KaGJtTm9NU3dnWW5KaGJtTm9NaWtnZTF4dUlDQWdJQ0FnZG1GeUlHSnlZVzVqYUdWeklEMGdkM0poY0VGeVozTW9ZWEpuZFcxbGJuUnpLVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpYSXBJSHRjYmlBZ0lDQWdJQ0FnTHk4Z1EyaGxZMnNnYVdZZ1lXeHNJR0p5WVc1amFHVnpJSEJoYzNNZ2RHaGxJSFJsYzNSY2JpQWdJQ0FnSUNBZ2RtRnlJSFZ1WkdWbWN5QTlJREE3WEc0Z0lDQWdJQ0FnSUhaaGNpQnlaWE4xYkhRZ1BTQmZMbVYyWlhKNUtHSnlZVzVqYUdWekxDQm1kVzVqZEdsdmJpQW9ZbkpoYm1Ob0tTQjdYRzRnSUNBZ0lDQWdJQ0FnZG1GeUlIQmhjblJwWVd3Z1BTQmljbUZ1WTJndWRHVnpkQ2hoWTNSMVlXd3BPMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDaHdZWEowYVdGc0lEMDlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaGNtVnpiMngyWlhJdWNHRjFjMlZrS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGMyOXNkbVZ5TG5CaGRYTmxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCMWJtUmxabk1nS3owZ01UdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVlXNWphQzUwYUdWdUtGOHViMjVqWlNobWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lIVnVaR1ZtY3lBdFBTQXhPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvTUNBOVBUMGdkVzVrWldaektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVjbVZ6ZFcxbEtHRmpkSFZoYkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDBwTENCZkxtOXVZMlVvWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYTnZiSFpsY2k1eVpYTjFiV1VvYm5Wc2JDd2dabUZzYzJVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUc2dMeThnYTJWbGNDQnBkR1Z5WVhScGJtZGNiaUFnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2NHRnlkR2xoYkR0Y2JpQWdJQ0FnSUNBZ2ZTazdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tISmxjMjlzZG1WeUxuQmhkWE5sWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQjFibVJsWm1sdVpXUTdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNBdkx5QlVZV3RsSUdOaGNtVWdiMllnWVc1NUlHVjRjR1ZqZEdGMGFXOXVjeUJzWVhSbGNpQnBiaUIwYUdVZ1kyaGhhVzVjYmlBZ0lDQWdJQ0FnYVdZZ0tISmxjM1ZzZENBOVBUMGdkSEoxWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJSEpsYzNWc2RDQTlJSEpsYzI5c2RtVnlLR0ZqZEhWaGJDazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnY21WemRXeDBPMXh1SUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJRzl5T2lCN1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKME52YlhCdmMyVnpJR0VnYm1WM0lHVjRjR1ZqZEdGMGFXOXVJR1p5YjIwZ2RIZHZJRzl5SUcxdmNtVWdaWGh3Y21WemMybHZibk1zSUhkb2FXTm9JSGRwYkd3Z2IyNXNlU2NzWEc0Z0lDQWdJQ0FuYzNWalkyVmxaQ0JwWmlCaGRDQnNaV0Z6ZENCdmJtVWdiMllnZEdobElHVjRjSEpsYzNOcGIyNXpJR1J2WlhNdUp5eGNiaUFnSUNBZ0lDZE9iM1JsT2lCbGRtRnNkV0YwYVc5dUlIZHBiR3dnYzNSdmNDQmhjeUJ6YjI5dUlHRnpJRzl1WlNCdlppQjBhR1VnWlhod2NtVnpjMmx2Ym5NZ2MzVmpZMlZsWkhNdUoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKeVI3SUdGeVozTXVhbTlwYmloY0lpQlBVaUJjSWlrZ2ZTY3NYRzRnSUNBZ1ptRnBiRG9nSjNkaGN5QjdleUJoWTNSMVlXd2dmWDBuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lHSnlZVzVqYURFc0lHSnlZVzVqYURJcElIdGNiaUFnSUNBZ0lIWmhjaUJpY21GdVkyaGxjeUE5SUhkeVlYQkJjbWR6S0dGeVozVnRaVzUwY3lrN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWm5WdVkzUnBiMjRnS0hKbGMyOXNkbVZ5S1NCN1hHNGdJQ0FnSUNBZ0lDOHZJRU5vWldOcklHbG1JR0ZzYkNCaWNtRnVZMmhsY3lCd1lYTnpJSFJvWlNCMFpYTjBYRzRnSUNBZ0lDQWdJSFpoY2lCMWJtUmxabk1nUFNBd08xeHVJQ0FnSUNBZ0lDQjJZWElnY21WemRXeDBJRDBnWHk1emIyMWxLR0p5WVc1amFHVnpMQ0JtZFc1amRHbHZiaUFvWW5KaGJtTm9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ2RtRnlJSEJoY25ScFlXd2dQU0JpY21GdVkyZ3VkR1Z6ZENoaFkzUjFZV3dwTzF4dUlDQWdJQ0FnSUNBZ0lHbG1JQ2h3WVhKMGFXRnNJRDA5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDZ2hjbVZ6YjJ4MlpYSXVjR0YxYzJWa0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxuQmhkWE5sS0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjFibVJsWm5NZ0t6MGdNVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnlZVzVqYUM1MGFHVnVLRjh1YjI1alpTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbkpsYzNWdFpTaGhZM1IxWVd3cE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrc0lGOHViMjVqWlNobWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lIVnVaR1ZtY3lBdFBTQXhPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvTUNBOVBUMGdkVzVrWldaektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVjbVZ6ZFcxbEtHNTFiR3dzSUdaaGJITmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3BPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3SUM4dklHdGxaWEFnYVhSbGNtRjBhVzVuWEc0Z0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSEJoY25ScFlXdzdYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2h5WlhOdmJIWmxjaTV3WVhWelpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZFc1a1pXWnBibVZrTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdMeThnVkdGclpTQmpZWEpsSUc5bUlHRnVlU0JsZUhCbFkzUmhkR2x2Ym5NZ2JHRjBaWElnYVc0Z2RHaGxJR05vWVdsdVhHNGdJQ0FnSUNBZ0lHbG1JQ2h5WlhOMWJIUWdQVDA5SUhSeWRXVXBJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYTjFiSFFnUFNCeVpYTnZiSFpsY2loaFkzUjFZV3dwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlISmxjM1ZzZER0Y2JpQWdJQ0FnSUgwN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCNGIzSTZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblEyOXRjRzl6WlhNZ1lTQnVaWGNnWlhod1pXTjBZWFJwYjI0Z1puSnZiU0IwZDI4Z2IzSWdiVzl5WlNCbGVIQnlaWE56YVc5dWN5d2dkMmhwWTJnZ2QybHNiQ0J2Ym14NUp5eGNiaUFnSUNBZ0lDZHpkV05qWldWa0lHbG1JR0YwSUd4bFlYTjBJRzl1WlNCdlppQjBhR1VnWlhod2NtVnpjMmx2Ym5NZ1pHOWxjeUJpZFhRZ2JtOTBJR0ZzYkNCdlppQjBhR1Z0TGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDY2tleUJoY21kekxtcHZhVzRvWENJZ1dFOVNJRndpS1NCOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdJR0ZqZEhWaGJDQjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z1luSmhibU5vTVN3Z1luSmhibU5vTWlrZ2UxeHVJQ0FnSUNBZ2RtRnlJR0p5WVc1amFHVnpJRDBnZDNKaGNFRnlaM01vWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0FnSUhKbGRIVnliaUJtZFc1amRHbHZiaUFvY21WemIyeDJaWElwSUh0Y2JpQWdJQ0FnSUNBZ0x5OGdRMmhsWTJzZ2FXWWdZV3hzSUdKeVlXNWphR1Z6SUhCaGMzTWdkR2hsSUhSbGMzUmNiaUFnSUNBZ0lDQWdkbUZ5SUhWdVpHVm1jeUE5SURBN1hHNGdJQ0FnSUNBZ0lIWmhjaUJ2YTNNZ1BTQXdPMXh1SUNBZ0lDQWdJQ0IyWVhJZ2EyOXpJRDBnTUR0Y2JpQWdJQ0FnSUNBZ1h5NW1iM0pGWVdOb0tHSnlZVzVqYUdWekxDQm1kVzVqZEdsdmJpQW9ZbkpoYm1Ob0tTQjdYRzRnSUNBZ0lDQWdJQ0FnZG1GeUlIQmhjblJwWVd3Z1BTQmljbUZ1WTJndWRHVnpkQ2hoWTNSMVlXd3BPMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDaHdZWEowYVdGc0lEMDlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaGNtVnpiMngyWlhJdWNHRjFjMlZrS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGMyOXNkbVZ5TG5CaGRYTmxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCMWJtUmxabk1nS3owZ01UdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVlXNWphQzUwYUdWdUtGOHViMjVqWlNobWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hyYjNNZ1BpQXdLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y21WemRXMWxLR0ZqZEhWaGJDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUc5cmN5QXJQU0F4TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0IxYm1SbFpuTWdMVDBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tEQWdQVDA5SUhWdVpHVm1jeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGMyOXNkbVZ5TG5KbGMzVnRaU2hoWTNSMVlXd3NJRzlyY3lBK0lEQWdKaVlnYTI5eklENGdNQ0EvSUhWdVpHVm1hVzVsWkNBNklHWmhiSE5sS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdmU2tzSUY4dWIyNWpaU2htZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaHZhM01nUGlBd0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVjbVZ6ZFcxbEtHRmpkSFZoYkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJR3R2Y3lBclBTQXhPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQjFibVJsWm5NZ0xUMGdNVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0RBZ1BUMDlJSFZ1WkdWbWN5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbkpsYzNWdFpTaGhZM1IxWVd3c0lHOXJjeUErSURBZ0ppWWdhMjl6SUQ0Z01DQS9JSFZ1WkdWbWFXNWxaQ0E2SUdaaGJITmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3BPMXh1WEc0Z0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaHdZWEowYVdGc0lEMDlQU0IwY25WbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCdmEzTWdLejBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLSEJoY25ScFlXd2dQVDA5SUdaaGJITmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnJiM01nS3owZ01UdGNiaUFnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwcE8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTnZiSFpsY2k1d1lYVnpaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa08xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzlyY3lBK0lEQWdKaVlnYTI5eklENGdNQ0EvSUhKbGMyOXNkbVZ5S0dGamRIVmhiQ2tnT2lCbVlXeHpaVHRjYmlBZ0lDQWdJSDA3WEc0Z0lDQWdmVnh1SUNCOVhHNWNibjBwTzF4dUlsMTkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8vIFNldCBvZiBkZWZhdWx0IG1hdGNoZXJzXG5hc3MucmVnaXN0ZXIoe1xuICAvLyBUT0RPOiBNb3ZlIHRoaXMgdG8gdGhlIENoYWluIHByb3RvdHlwZVxuICBkZXNjOiB7XG4gICAgaGVscDogJ1Byb3ZpZGUgYSBjdXN0b20gZGVzY3JpcHRpb24gZm9yIHJlcG9ydGVkIGZhaWx1cmVzJyxcbiAgICBkZXNjOiBudWxsLCAgLy8gU2tpcCBpdCBmcm9tIHJlcG9ydHNcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBkZXNjKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgdGhlIGRlc2NyaXB0aW9uIHdvbid0IGJlIHNldCB1bnRpbCB0aGUgY2hhaW4gaXMgcmVzb2x2ZWQsXG4gICAgICAvLyBhdCBsZWFzdCBvbmNlLCByZWFjaGluZyB0aGlzIGV4cGVjdGF0aW9uLlxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICByZXNvbHZlci5jaGFpbi5fX2Rlc2NyaXB0aW9uX18gPSBkZXNjO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIC8vIElnbm9yZWQgbWF0Y2hlcnNcbiAgdG86IHtcbiAgICBhbGlhc2VzOiBbICdhJywgJ2FuJywgJ2JlJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdKdXN0IHNvbWUgc3ludGF4IHN1Z2FyIHRvIG1ha2UgdGhlIGV4cGVjdGF0aW9ucyBlYXNpZXIgb24gdGhlIGV5ZXMuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgbWFyazoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJbmNyZWFzZXMgdGhlIGdsb2JhbCBgYXNzLm1hcmtzYCBjb3VudGVyIGV2ZXJ5IHRpbWUgaXQgZ2V0cycsXG4gICAgICAnZXZhbHVhdGVkIGFzIHBhcnQgb2YgYW4gZXhwcmVzc2lvbi4gVXNlIGl0IHRvIHZlcmlmeSB0aGF0IHRoZScsXG4gICAgICAncHJlY2VkaW5nIGV4cGVjdGF0aW9ucyBhcmUgYWN0dWFsbHkgYmVpbmcgZXhlY3V0ZWQuJyxcbiAgICAgICdBbiBlYXN5IHdheSB0byBzdXBwb3J0IHRoaXMgd2hlbiB1c2luZyBhIHRlc3QgcnVubmVyIGlzIHRvIHJlc2V0JyxcbiAgICAgICd0aGUgY291bnRlciBieSBjYWxsaW5nIGBhc3MubWFya3MoKWAgb24gYSBiZWZvcmVFYWNoIGhvb2sgYW5kJyxcbiAgICAgICd0aGVuIHZlcmlmeSBhdCB0aGUgZW5kIG9mIHRlc3Qgd2l0aCBgYXNzLm1hcmtzKE4pYCAod2hlcmUgTiBpcycsXG4gICAgICAndGhlIG51bWJlciBvZiBtYXJrcyB5b3UgZXhwZWN0ZWQpLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgYXNzLm1hcmtzLmNvdW50ZXIgKz0gMTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICAvLyBKdXN0IGFsbG93IGFueXRoaW5nIDopXG4gIGFueToge1xuICAgIGhlbHA6ICdBbGxvd3MgYW55IHZhbHVlIHdpdGhvdXQgdGVzdGluZyBpdC4nLFxuICAgIGRlc2M6ICdpcyBhbnl0aGluZycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICAvLyBBbnl0aGluZyB0aGF0IGlzbid0IG51bGwgb3IgdW5kZWZpbmVkXG4gIGRlZmluZWQ6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgbnVsbCBvciB1bmRlZmluZWQuJyxcbiAgICBkZXNjOiAnaXMgZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCAhPSBudWxsO1xuICAgIH1cbiAgfSxcbiAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGVtcHR5XG4gIGVtcHR5OiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgZW1wdHkgKG9yIGhhcyBhIGxlbmd0aCBvZiAwKS4nLFxuICAgIGRlc2M6ICdpcyBlbXB0eScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA9PSBudWxsIHx8IGFjdHVhbC5sZW5ndGggPT09IDA7XG4gICAgfVxuICB9LFxuICBuZW1wdHk6IHtcbiAgICBhbGlhc2VzOiBbICdub25FbXB0eScgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBub3QgZW1wdHkgKG9yIGhhcyBhIGxlbmd0aCBncmVhdGVyIHRoYW4gMCkuJyxcbiAgICBkZXNjOiAnaXMgbm90IGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9IG51bGwgJiYgYWN0dWFsLmxlbmd0aCA+IDA7XG4gICAgfVxuICB9LFxuICB0cnV0aHk6IHtcbiAgICBhbGlhc2VzOiBbICd0cnVpc2gnIF0sXG4gICAgaGVscDogJ1RoZSB2YWx1ZSBzaG91bGQgYmUgdHJ1dGh5IChub3QgdW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyB0cnV0aHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHlwZW9mIGFjdHVhbC5sZW5ndGggPT09ICdudW1iZXInID8gYWN0dWFsLmxlbmd0aCA+IDAgOiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZmFsc3k6IHtcbiAgICBoZWxwOiAnVGhlIHZhbHVlIHNob3VsZCBiZSBmYWxzeSAodW5kZWZpbmVkLCBudWxsLCAwLCBcIlwiIG9yIFtdKS4nLFxuICAgIGRlc2M6ICdpcyBmYWxzeScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghYWN0dWFsKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwubGVuZ3RoID09PSAwIDogZmFsc2U7XG4gICAgfVxuICB9LFxuXG4gIC8vIE5lZ2F0aW9uXG4gIG5vdDoge1xuICAgIGFsaWFzZXM6IFsgJ25vJywgJ05PJywgJ05PVCcgXSxcbiAgICBoZWxwOiAnTmVnYXRlcyB0aGUgcmVzdWx0IGZvciB0aGUgcmVzdCBvZiB0aGUgZXhwcmVzc2lvbi4nLFxuICAgIGRlc2M6ICdOb3QhJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmVyLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgICAgIHJldHVybiAhZmluYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgaXM6IHtcbiAgICBhbGlhc2VzOiBbICdlcXVhbCcsICdlcXVhbHMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBzdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgICAgJ05vdGU6IGlmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIGNoYWluIGV4cHJlc3Npb24gaXRcXCdsbCBiZSB0ZXN0ZWQgaW5zdGVhZC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gc3RyaWN0bHkgZXF1YWwge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAvLyB0aGlzIGlzIGEgYml0IGNvbnRyaXZlZCBidXQgaXQgbWFrZXMgZm9yIHNvbWUgbmljZSBzeW50YXggdG8gYmUgYWJsZSB0b1xuICAgICAgLy8gdXNlIC5pcyBmb3IgcGFzc2luZyBpbiBleHBlY3RhdGlvbnNcbiAgICAgIGlmIChhc3MuQ2hhaW4uaXNDaGFpbihleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjdHVhbCA9PT0gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuICBlcToge1xuICAgIGFsaWFzZXM6IFsgJ2VxbCcsICdlcWxzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgZGVlcCBub24tc3RyaWN0IGVxdWFsaXR5IGJldHdlZW4gdGhlIHZhbHVlIGFuZCBpdHMgZXhwZWN0ZWQuJyxcbiAgICAgICdJdCB1bmRlcnN0YW5kcyBhc3MgZXhwcmVzc2lvbnMgc28geW91IGNhbiBjb21iaW5lIHRoZW0gYXQgd2lsbCBpbiB0aGUnLFxuICAgICAgJ2V4cGVjdGVkIHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBlcXVhbCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBfLmlzRXF1YWwoYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuXG4gIG1hdGNoOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1RyaWVzIHRvIG1hdGNoIHRoZSBzdWJqZWN0IGFnYWluc3QgdGhlIGV4cGVjdGVkIHZhbHVlIHdoaWNoIGNhbiBiZSBlaXRoZXInLFxuICAgICAgJ2EgZnVuY3Rpb24sIGFuIGFzcyBleHByZXNzaW9uLCBhbiBvYmplY3Qgd2l0aCBhIC50ZXN0KCkgZnVuY3Rpb24gKGZvciAnLFxuICAgICAgJ2luc3RhbmNlIGEgUmVnRXhwKSBvciBhIHBsYWluIG9iamVjdCB0byBwYXJ0aWFsbHkgbWF0Y2ggYWdhaW5zdCB0aGUgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIG1hdGNoIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuXG4gICAgICBpZiAodHlwZW9mIGV4cGVjdGVkLnRlc3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICEhZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoXy5pc1BsYWluT2JqZWN0KGV4cGVjdGVkKSB8fCBfLmlzQXJyYXkoZXhwZWN0ZWQpIHx8IF8uaXNBcmd1bWVudHMoZXhwZWN0ZWQpKSB7XG5cbiAgICAgICAgaWYgKGFjdHVhbCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3VwcG9ydCBwYXNzaW5nIGBbLCdmb28nXWAgdG8gbWVhbiBgW2Fzcy5hbnksICdmb28nXWBcbiAgICAgICAgaWYgKF8uaXNBcnJheShleHBlY3RlZCkgfHwgXy5pc0FyZ3VtZW50cyhleHBlY3RlZCkpIHtcbiAgICAgICAgICBleHBlY3RlZCA9IF8ubWFwKGV4cGVjdGVkLCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2ID09PSAndW5kZWZpbmVkJyA/IGFzcy5hbnkgOiB2O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogSWRlYWxseSB3ZSBzaG91bGQgXCJmb3JrXCIgdGhlIHJlc29sdmVyIHNvIHdlIGNhbiBzdXBwb3J0XG4gICAgICAgIC8vICAgICAgIGFzeW5jIHRlc3RzIGFuZCBhbHNvIHByb3ZpZGUgYmV0dGVyIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgICAgIC8vICAgICAgIFVuZm9ydHVuYXRlbHkgdGhlIGN1cnJlbnQgZm9ya2luZyBtZWNoYW5pc20gZG9lc24ndCB3b3JrXG4gICAgICAgIC8vICAgICAgIGZvciB0aGlzIHVzZSBjYXNlIHNpbmNlIHdlIG5lZWQgdG8gY3JlYXRlIG5ldyBjaGFpbnMgZm9yXG4gICAgICAgIC8vICAgICAgIGVhY2ggZXhwZWN0ZWQga2V5LlxuICAgICAgICB2YXIgZmFpbHVyZSA9IHRydWU7XG4gICAgICAgIF8oZXhwZWN0ZWQpLmV2ZXJ5KGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgaWYgKCFfLmhhcyhhY3R1YWwsIGtleSkpIHtcbiAgICAgICAgICAgIGZhaWx1cmUgPSAna2V5IFwiJyArIGtleSArICdcIiBub3QgZm91bmQgaW4ge3thY3R1YWx9fSc7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFfLmlzRXF1YWwoYWN0dWFsW2tleV0sIHZhbHVlKSkge1xuICAgICAgICAgICAgZmFpbHVyZSA9ICdrZXkgXCInICsga2V5ICsgJ1wiIGRvZXMgbm90IG1hdGNoIHt7YWN0dWFsW1wiJyArIGtleSArICdcIl19fSc7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmYWlsdXJlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAnZXhwZWN0ZWQgaXMgbm90IGEgZnVuY3Rpb24gYW5kIGRvZXMgbm90IGhhdmUgYSAudGVzdCBtZXRob2QnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gISFleHBlY3RlZChhY3R1YWwpO1xuICAgIH1cbiAgfSxcblxuICBhYm92ZToge1xuICAgIGFsaWFzZXM6IFsgJ2d0JywgJ21vcmVUaGFuJywgJ2dyZWF0ZXJUaGFuJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGhpZ2hlciB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBtb3JlIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID4gZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGJlbG93OiB7XG4gICAgYWxpYXNlczogWyAnbHQnLCAnbGVzc1RoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgbG93ZXIgdGhhIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4ge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDwgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlT3JFcXVhbDoge1xuICAgIGFsaWFzZXM6IFsgJ2xlYXN0JywgJ2F0TGVhc3QnLCAnZ3RlJywgJ21vcmVUaGFuT3JFcXVhbCcsICdncmVhdGVyVGhhbk9yRXF1YWwnIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3dPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnbW9zdCcsICdhdE1vc3QnLCAnbHRlJywgJ2xlc3NUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciBvciBlcXVhbCB0aGFuIGl0cyBleHBlY3RlZC4nLFxuICAgIGRlc2M6ICd0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gJHtleHBlY3RlZH0nLFxuICAgIGZhaWw6ICd3YXMgJHthY3R1YWx9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA8PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgY2xvc2U6IHtcbiAgICBhbGlhc2VzOiBbICdjbG9zZVRvJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGNsb3NlIHRvIHRoZSBleHBlY3RlZCBiYXNlZCBvbiBhIGdpdmVuIGRlbHRhLicsXG4gICAgICAnVGhlIGRlZmF1bHQgZGVsdGEgaXMgMC4xIHNvIHRoZSB2YWx1ZSAzLjU1IGlzIGNsb3NlIHRvIGFueSB2YWx1ZSBiZXR3ZWVuJyxcbiAgICAgICczLjQ1IGFuZCAzLjY1IChib3RoIGluY2x1c2l2ZSkuJyxcbiAgICAgICdTdHJpbmcgdmFsdWVzIGFyZSBhbHNvIHN1cHBvcnRlZCBieSBjb21wdXRpbmcgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlbScsXG4gICAgICAndXNpbmcgdGhlIFNpZnQ0IGFsZ29yaXRobS4gRm9yIHN0cmluZyB2YWx1ZXMgdGhlIGRlbHRhIGlzIGludGVycHJldGVkIGFzJyxcbiAgICAgICdhIHBlcmNlbnRhZ2UgKGllOiAwLjI1IGlzIDI1JSkuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGNsb3NlIHRvIHt7IGV4cGVjdGVkIH19JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIGRlbHRhKSB7XG4gICAgICBkZWx0YSA9IGRlbHRhID09IG51bGwgPyAwLjEgOiBkZWx0YTtcblxuICAgICAgLy8gU3VwcG9ydCBzdHJpbmdzIGJ5IGNvbXB1dGluZyB0aGVpciBkaXN0YW5jZVxuICAgICAgaWYgKF8uaXNTdHJpbmcoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICB2YXIgZGlmZiA9IHV0aWwuc2lmdDQoYWN0dWFsLCBleHBlY3RlZCwgMykgLyBNYXRoLm1heChhY3R1YWwubGVuZ3RoLCBleHBlY3RlZC5sZW5ndGgpO1xuICAgICAgICByZXR1cm4gZGlmZiA8PSBkZWx0YTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjdHVhbCA+PSBleHBlY3RlZCAtIGRlbHRhICYmIGFjdHVhbCA8PSBleHBlY3RlZCArIGRlbHRhO1xuICAgIH1cbiAgfSxcblxuICBpbnN0YW5jZW9mOiB7XG4gICAgYWxpYXNlczogWyAnaW5zdGFuY2VPZicsICdpbnN0YW5jZScsICdpc2EnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yLicsXG4gICAgICAnV2hlbiB0aGUgZXhwZWN0ZWQgaXMgYSBzdHJpbmcgaXRcXCdsbCBhY3R1YWxseSB1c2UgYSBgdHlwZW9mYCcsXG4gICAgICAnY29tcGFyaXNvbi4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgYW4gaW5zdGFuY2Ugb2Yge3tleHBlY3RlZH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsID09PSBleHBlY3RlZCA/IHRydWUgOiAnaGFkIHR5cGUge3sgdHlwZW9mIGFjdHVhbCB9fSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQ7XG4gICAgfVxuICB9LFxuXG4gIHR5cGVvZjoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG9mIGEgc3BlY2lmaWMgdHlwZScsXG4gICAgZGVzYzogJ3RvIGhhdmUgdHlwZSB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICdoYWQgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIF8uaXNFcXVhbCh0eXBlb2YgYWN0dWFsLCBleHBlY3RlZCk7XG4gICAgfVxuICB9LFxuICBudW1iZXI6IHtcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgbnVtYmVyIChkaWZmZXJlbnQgb2YgTmFOKS4nLFxuICAgIGRlc2M6ICd0byBiZSBhIG51bWJlcicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNOdW1iZXIoYWN0dWFsKSAmJiAhaXNOYU4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGJvb2w6IHtcbiAgICBhbGlhc2VzOiBbICdib29sZWFuJyBdLFxuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBib29sZWFuLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgYm9vbGVhbicsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNCb29sZWFuKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBzdHJpbmc6IHtcbiAgICBhbGlhc2VzOiBbICdzdHInIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIHN0cmluZy4nLFxuICAgIGRlc2M6ICd0byBiZSBhIHN0cmluZycsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNTdHJpbmcoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG9iamVjdDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIG9mIHR5cGUgb2JqZWN0LicsXG4gICAgZGVzYzogJ3RvIGJlIGFuIG9iamVjdCcsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHBsYWluT2JqZWN0OiB7XG4gICAgYWxpYXNlczogWyAncGxhaW4nLCAnb2JqJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGUgT2JqZWN0IGNvbnN0cnVjdG9yLicsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUGxhaW5PYmplY3QoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGFycmF5OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYW4gQXJyYXkuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gQXJyYXknLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzQXJyYXkoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGZ1bmN0aW9uOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBGdW5jdGlvbi4nLFxuICAgIGRlc2M6ICd0byBiZSBhIEZ1bmN0aW9uJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICByZWdleHA6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIFJlZ0V4cCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgUmVnRXhwJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1JlZ0V4cChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZGF0ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgRGF0ZScsXG4gICAgZGVzYzogJ3RvIGJlIGEgRGF0ZScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNEYXRlKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBlbGVtZW50OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBET00gZWxlbWVudCcsXG4gICAgZGVzYzogJ3RvIGJlIGEgRE9NIGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRWxlbWVudChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZXJyb3I6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBlcnJvciAob3IgbG9va3MgbGlrZSBpdCknLFxuICAgIGRlc2M6ICd0byBiZSBhbiBFcnJvcicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uaXNPYmplY3QoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5uYW1lKSAmJiBfLmlzU3RyaW5nKGFjdHVhbC5tZXNzYWdlKTtcbiAgICB9XG4gIH0sXG5cbiAgdW5kZWZpbmVkOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgdW5kZWZpbmVkLicsXG4gICAgZGVzYzogJ3RvIGJlIHVuZGVmaW5lZCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNVbmRlZmluZWQoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIG51bGw6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBudWxsLicsXG4gICAgZGVzYzogJ3RvIGJlIG51bGwnLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPT09IG51bGw7XG4gICAgfVxuICB9LFxuICBOYU46IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBOYU4uJyxcbiAgICBkZXNjOiAndG8gYmUgTmFOJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc051bWJlcihhY3R1YWwpKSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICd3YXMgJHthY3R1YWx9JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZmFpbCA9ICdoYWQgdHlwZSAke3R5cGVvZiBhY3R1YWx9JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgdHJ1ZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIHRydWUnLFxuICAgIGRlc2M6ICd0byBiZSB0cnVlJyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbCA9PSB0cnVlID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZmFsc2U6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBmYWxzZScsXG4gICAgZGVzYzogJ3RvIGJlIGZhbHNlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gYWN0dWFsID09IGZhbHNlID8gdHJ1ZSA6ICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICByYWlzZXM6IHtcbiAgICBhbGlhc2VzOiBbICd0aHJvd3MnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyB0aGF0IGV4ZWN1dGluZyB0aGUgdmFsdWUgcmVzdWx0cyBpbiBhbiBleGNlcHRpb24gYmVpbmcgdGhyb3duLicsXG4gICAgICAnVGhlIGNhcHR1cmVkIGV4Y2VwdGlvbiB2YWx1ZSBpcyB1c2VkIHRvIG11dGF0ZSB0aGUgc3ViamVjdCBmb3IgdGhlJyxcbiAgICAgICdmb2xsb3dpbmcgZXhwZWN0YXRpb25zLidcbiAgICBdLFxuICAgIGRlc2M6ICd0aHJvd3MgYW4gZXJyb3InLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIV8uaXNGdW5jdGlvbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgZnVuY3Rpb246IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhY3R1YWwoKTtcbiAgICAgICAgcmV0dXJuICdkaWQgbm90IHRocm93IGFueXRoaW5nJztcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGV4cGVjdGVkID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihleHBlY3RlZCkgJiYgZSBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzRXF1YWwoZSwgZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVnbWVudCB0aGUgZXhwZWN0YXRpb24gb2JqZWN0IHdpdGggYSBuZXcgdGVtcGxhdGUgdmFyaWFibGVcbiAgICAgICAgdGhpcy5leGNlcHRpb24gPSBlO1xuICAgICAgICByZXR1cm4gJ2dvdCB7eyBleGNlcHRpb24gfX0nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBoYXM6IHtcbiAgICBhbGlhc2VzOiBbICdoYXZlJywgJ2NvbnRhaW4nLCAnY29udGFpbnMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgc29tZSBleHBlY3RlZCB2YWx1ZS4gSXQgdW5kZXJzdGFuZHMgZXhwZWN0ZWQnLFxuICAgICAgJ2NoYWluIGV4cHJlc3Npb25zIHNvIHRoaXMgc2VydmVzIGFzIHRoZSBlcXVpdmFsZW50IG9mIC5lcSBmb3IgcGFydGlhbCcsXG4gICAgICAnbWF0Y2hlcy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gY29udGFpbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgYXJnMSAvKiwgLi4uICovKSB7XG5cbiAgICAgIC8vIGFsbG93IG11bHRpcGxlIGV4cGVjdGVkIHZhbHVlc1xuICAgICAgdmFyIGV4cGVjdGVkID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQubGVuZ3RoID09PSAxID8gZXhwZWN0ZWRbMF0gOiBleHBlY3RlZDtcblxuICAgICAgaWYgKCFfLmlzU3RyaW5nKGFjdHVhbCkgJiYgIV8uaXNBcnJheShhY3R1YWwpICYmICFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdnb3Qge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBfLmV2ZXJ5KGV4cGVjdGVkLCBmdW5jdGlvbiAoZXhwZWN0ZWQpIHtcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcoYWN0dWFsKSAmJiBfLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgICAgICAgIHJldHVybiAtMSAhPT0gYWN0dWFsLmluZGV4T2YoZXhwZWN0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8uaXNBcnJheShhY3R1YWwpKSB7XG4gICAgICAgICAgLy8gVE9ETzogSXNuJ3QgdGhlcmUgYW4gZWFzaWVyIHdheSB0byB0ZXN0IHRoaXMgdXNpbmcgbG9kYXNoIG9ubHk/XG4gICAgICAgICAgaWYgKCFhc3MuQ2hhaW4uaXNDaGFpbihleHBlY3RlZCkpIHtcbiAgICAgICAgICAgIGV4cGVjdGVkID0gYXNzLmVxKGV4cGVjdGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIC0xICE9PSBfLmZpbmRJbmRleChhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhY2s6IENvbXBhcmUgb2JqZWN0cyB3aXRoIC53aGVyZSBieSBmaWx0ZXJpbmcgYSB3cmFwcGVyIGFycmF5XG4gICAgICAgIHJldHVybiAxID09PSBfLndoZXJlKFthY3R1YWxdLCBleHBlY3RlZCkubGVuZ3RoO1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuICBoYXNPd246IHtcbiAgICBhbGlhc2VzOiBbICdoYXNLZXknLCAnaGFzSW5kZXgnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrIGlmIHRoZSB2YWx1ZSBoYXMgb25lIG9yIG1vcmUgb3duIHByb3BlcnRpZXMgYXMgZGVmaW5lZCBieScsXG4gICAgICAndGhlIGdpdmVuIGFyZ3VtZW50cy4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gaGF2ZSBvd24gcHJvcGVydHkgJHsgZXhwZWN0ZWQgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnd2FzIHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmZhaWwgPSAnb25seSBoYWQge3sgXy5rZXlzKGFjdHVhbCkgfX0nO1xuXG4gICAgICAvLyBUT0RPOiBPZmZlciBiZXR0ZXIgZmFpbHVyZSBtZXNzYWdlXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIF8uZXZlcnkoYXJncywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIF8uaGFzKGFjdHVhbCwgeCk7IH0pO1xuICAgIH1cbiAgfSxcblxuICBsb2c6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRHVtcHMgdGhlIHJlY2VpdmVkIHZhbHVlIHRvIHRoZSBjb25zb2xlLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgY29uc29sZS5sb2coJ1tBU1NdJywgYWN0dWFsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZHVtcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdEdW1wcyB0aGUgcmVjZWl2ZWQgdmFsdWUgdG8gdGhlIGNvbnNvbGUgYXBwbHlpbmcgdGhlIGdpdmVuIHRlbXBsYXRlLicsXG4gICAgICAnTm90ZTogVXNlICR7dGhpc30gdG8gaW50ZXJwb2xhdGUgdGhlIHdob2xlIHZhbHVlLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyN0ZW1wbGF0ZSdcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgdHBsKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gdXRpbC50ZW1wbGF0ZS5jYWxsKGFjdHVhbCwgdHBsLCBhY3R1YWwpO1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgZGVidWdnZXI6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGFsdHMgc2NyaXB0IGV4ZWN1dGlvbiBieSB0cmlnZ2VyaW5nIHRoZSBpbnRlcmFjdGl2ZSBkZWJ1Z2dlci4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIHRhcDoge1xuICAgIGFsaWFzZXM6IFsgJ2ZuJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdDYWxscyB0aGUgcHJvdmlkZWQgZnVuY3Rpb24gd2l0aCB0aGUgY3VycmVudCB2YWx1ZSBhcyBhcmd1bWVudC4nLFxuICAgICAgJ0lmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHNvbWV0aGluZyBkaWZmZXJlbnQgdG8gKnVuZGVmaW5lZCogdGhlJyxcbiAgICAgICdleHByZXNzaW9uIHdpbGwgZm9yayB0byBvcGVyYXRlIG9uIHRoZSByZXR1cm5lZCB2YWx1ZS4nLFxuICAgIF0sXG4gICAgZGVzYzogJ2NhbGwge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gZm4oYWN0dWFsKTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUocmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcbiAgbm90aWZ5OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1NpbWlsYXIgdG8gLnRhcCgpIGJ1dCBpdCB3b25cXCd0IHBhc3MgdGhlIGN1cnJlbnQgdmFsdWUgYXMgYXJndW1lbnQsJyxcbiAgICAgICdpbnN0ZWFkIGl0IHdpbGwgYmUgcHJvdmlkZWQgYXMgdGhlIGB0aGlzYCBjb250ZXh0IHdoZW4gcGVyZm9ybWluZyB0aGUnLFxuICAgICAgJ2NhbGwuIFRoaXMgYWxsb3dzIGl0IHRvIGJlIHVzZWQgd2l0aCB0ZXN0IHJ1bm5lcnMgYGRvbmVgIHN0eWxlIGNhbGxiYWNrcy4nLFxuICAgICAgJ05vdGUgdGhhdCBpdCB3aWxsIG5laXRoZXIgbXV0YXRlIHRoZSB2YWx1ZSBldmVuIGlmIGl0IHJldHVybnMgc29tZXRoaW5nLidcbiAgICBdLFxuICAgIGRlc2M6ICdub3RpZnkge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGZuKSB7XG4gICAgICBmbi5jYWxsKGFjdHVhbCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgc2l6ZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiB0aGUgc2l6ZSBvZiB0aGUgY3VycmVudCB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHNpemUnLFxuICAgIGZhaWw6ICdub3QgaGFzIGEgbGVuZ3RoOiB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGFjdHVhbCkgfHwgXy5pc0FycmF5KGFjdHVhbCkgfHwgXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShfLnNpemUoYWN0dWFsKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0sXG4gIHByb3A6IHtcbiAgICBhbGlhc2VzOiBbICdrZXknLCAncHJvcGVydHknIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgdmFsdWUgcHJvcGVydGllcy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHByb3BlcnR5IHt7IGFyZzEgfX0nLFxuICAgIGZhaWw6ICd3YXMgbm90IGZvdW5kIG9uIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwga2V5KSB7XG4gICAgICBpZiAoXy5pc09iamVjdChhY3R1YWwpKSB7XG4gICAgICAgIGlmIChrZXkgaW4gYWN0dWFsKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKGFjdHVhbFtrZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMua2V5cyA9IFtdO1xuICAgICAgICBfLmZvckluKGFjdHVhbCwgZnVuY3Rpb24gKHYsIGspIHsgdGhpcy5rZXlzLnB1c2goayk7IH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gJ3dhcyBub3QgZm91bmQgaW4ga2V5cyB7eyBrZXlzIH19JztcbiAgICAgIH1cbiAgICAgIHJldHVybiAnZ290IHt7YWN0dWFsfX0nO1xuICAgIH1cbiAgfSxcbiAgYXQ6IHtcbiAgICBhbGlhc2VzOiBbICdpbmRleCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBvbmUgb2YgdGhlIGluZGV4ZWQgZWxlbWVudHMuIElmJyxcbiAgICAgICdtdWx0aXBsZSBpbmRleGVzIGFyZSBwcm92aWRlZCBhbiBhcnJheSBpcyBjb21wb3NlZCB3aXRoIHRoZW0uJyxcbiAgICAgICdOb3RlOiBJdCBzdXBwb3J0cyBuZWdhdGl2ZSBpbmRleGVzJ1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBpbmRleCAkeyBhcmdzLmpvaW4oXCIsIFwiKSB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBpbmRleCkge1xuICAgICAgaWYgKCFfLmlzQXJyYXkoYWN0dWFsKSAmJiAhXy5pc1N0cmluZyhhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnbm90IGFuIGFycmF5IG9yIGEgc3RyaW5nOiAke2FjdHVhbH0nO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW5kZXhlcyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuICAgICAgdmFyIGVsZW1zID0gW107XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaWR4ID0gaW5kZXhlc1tpXTtcblxuICAgICAgICBpZHggPSBpZHggPCAwID8gYWN0dWFsLmxlbmd0aCArIGlkeCA6IGlkeDtcbiAgICAgICAgaWYgKGlkeCA8IDAgfHwgaWR4ID49IGFjdHVhbC5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gaWR4ICsgJyBvdXQgb2YgYm91bmRzIGZvciB7e2FjdHVhbH19JztcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1zLnB1c2goYWN0dWFsW2lkeF0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIGVsZW1zLmxlbmd0aCA9PT0gMSA/IGVsZW1zWzBdIDogZWxlbXNcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGtleXM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBpdHMgbGlzdCBvZiBvd24ga2V5cy4nXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGtleXMnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5rZXlzKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICB2YWx1ZXM6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gb3BlcmF0ZSBvbiBpdHMgbGlzdCBvZiB2YWx1ZXMnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IHZhbHVlcycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnZhbHVlcyhhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzbGljZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdFeHRyYWN0cyBhIHBvcnRpb24gZnJvbSB0aGUgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3NsaWNlKHt7YWN0dWFsfX0sICR7YXJnMSB8fCAwfSknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHN0YXJ0LCBlbmQpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50b0FycmF5KGFjdHVhbCkuc2xpY2Uoc3RhcnQsIGVuZClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGZpbHRlcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIHRoZSBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0bycsXG4gICAgICAnb3BlcmF0ZSBvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCcsXG4gICAgICAndHJ1dGh5IGZvci4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlsdGVyJ1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5maWx0ZXIoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICByZWplY3Q6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSXRlcmF0ZXMgb3ZlciBlbGVtZW50cyBvZiBjb2xsZWN0aW9uLCBmb3JraW5nIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlJyxcbiAgICAgICdvbiBhbiBhcnJheSB3aXRoIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIHRoZSBjYWxsYmFjayByZXR1cm5lZCBmYWxzeScsXG4gICAgICAnZm9yICh0aGUgb3Bwb3NpdGUgb2YgLmZpbHRlcikuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3JlamVjdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucmVqZWN0KGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICB3aGVyZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdQZXJmb3JtcyBhIGRlZXAgY29tcGFyaXNvbiBvZiBlYWNoIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uIHRvIHRoZSBnaXZlbicsXG4gICAgICAncHJvcGVydGllcyBvYmplY3QsIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgb2YgYWxsJyxcbiAgICAgICdlbGVtZW50cyB0aGF0IGhhdmUgZXF1aXZhbGVudCBwcm9wZXJ0eSB2YWx1ZXMuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3doZXJlJ1xuICAgIF0sXG4gICAgZGVzYzogJ3doZXJlIHt7YXJnMX19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wcykge1xuICAgICAgaWYgKCFfLmlzUGxhaW5PYmplY3QocHJvcHMpKSB7XG4gICAgICAgIHJldHVybiAncHJvcHMgaXMgbm90IGFuIG9iamVjdCc7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ud2hlcmUoYWN0dWFsLCBwcm9wcylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1hcDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXAnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1hcChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWV0aG9kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSByZXN1bHQgb2YgaW52b2tpbmcgdGhlIG5hbWVkJyxcbiAgICAgICdtZXRob2Qgb24gdGhlIHN1YmplY3QgdmFsdWUuJyxcbiAgICBdLFxuICAgIGRlc2M6IFwibWV0aG9kIC4ke2FyZzF9KClcIixcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBtZXRob2QsIGFyZykge1xuICAgICAgaWYgKHR5cGVvZiBhY3R1YWxbbWV0aG9kXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gJyR7YXJnMX0gaXMgbm90IGEgbWV0aG9kIGluIHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDIpO1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBhY3R1YWxbbWV0aG9kXS5hcHBseShhY3R1YWwsIGFyZ3MpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBpbnZva2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gYW4gYXJyYXkgaG9sZGluZyB0aGUgcmVzdWx0cyBvZicsXG4gICAgICAnaW52b2tpbmcgdGhlIG1ldGhvZCBuYW1lZCBieSB0aGUgYXJndW1lbnQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUnLFxuICAgICAgJ2N1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjaW52b2tlJ1xuICAgIF0sXG4gICAgZGVzYzogXCJpbnZva2UgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZCwgYXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaW52b2tlLmFwcGx5KF8sIGFyZ3VtZW50cylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHBsdWNrOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHRoZSBvbmUgb2YgdGhlIHNwZWNpZmljIHByb3BlcnR5IGZvciBhbGwgZWxlbWVudHMnLFxuICAgICAgJ2luIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3BsdWNrJ1xuICAgIF0sXG4gICAgZGVzYzogJ3BsdWNrKCB7e2FyZzF9fSApJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBwcm9wKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ucGx1Y2soYWN0dWFsLCBwcm9wKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgZmlyc3Q6IHtcbiAgICBhbGlhc2VzOiBbICdoZWFkJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2ZpcnN0J1xuICAgIF0sXG4gICAgZGVzYzogJ2dldCBmaXJzdCBlbGVtZW50JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uaGVhZChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgbGFzdDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdUT0RPJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI2xhc3QnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubGFzdChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcbiAgcmVzdDoge1xuICAgIGFsaWFzZXM6IFsgJ3RhaWwnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy50YWlsKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIG1pbjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSBzdWJqZWN0IHRvIGJlIHRoZSBtaW5pbXVtIHZhbHVlIGZvdW5kIG9uIHRoZSBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtaW4nXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWluKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBtYXg6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgc3ViamVjdCB0byBiZSB0aGUgbWF4aW11bSB2YWx1ZSBmb3VuZCBvbiB0aGUgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbWF4J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLm1heChhY3R1YWwpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzb3J0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHZhbHVlIHRvIGJlIHNvcnRlZCBpbiBhc2NlbmRpbmcgb3JkZXIuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3NvcnRCeSdcbiAgICBdLFxuICAgIGRlc2M6ICdzb3J0JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgLy8gQWxsb3cgdGhlIHVzZSBvZiBleHByZXNzaW9ucyBhcyBjYWxsYmFja3NcbiAgICAgIGlmIChjYWxsYmFjayBpbnN0YW5jZW9mIGFzcy5DaGFpbikge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrLnJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnNvcnRCeShhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RvcmU6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnSGVscGVyIHRvIHN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IHZhbHVlIGJlaW5nIGV2YWx1YXRlZCBpbiB0aGUnLFxuICAgICAgJ2V4cHJlc3Npb24gaW4gc29tZSBvdGhlciBvYmplY3QuIEl0IGV4cGVjdHMgYSB0YXJnZXQgb2JqZWN0IGFuZCBvcHRpb25hbGx5JyxcbiAgICAgICd0aGUgbmFtZSBvZiBhIHByb3BlcnR5LiBJZiB0YXJnZXQgaXMgYSBmdW5jdGlvbiBpdFxcJ2xsIHJlY2VpdmUgdGhlIHZhbHVlJyxcbiAgICAgICd1c2luZyBgcHJvcGAgYXMgdGhpcyBjb250ZXh0LiBJZiBgcHJvcGAgaXMgbm90IHByb3ZpZGVkIGFuZCBgdGFyZ2V0YCBpcyBhbicsXG4gICAgICAnYXJyYXkgdGhlIHZhbHVlIHdpbGwgYmUgcHVzaGVkIHRvIGl0LidcbiAgICBdLFxuICAgIGRlc2M6ICdzdG9yZScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgdGFyZ2V0LCBwcm9wKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0LmNhbGwocHJvcCwgYWN0dWFsKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChfLmlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgIHRhcmdldC5wdXNoKGFjdHVhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICdwcm9wIHVuZGVmaW5lZCBhbmQgdGFyZ2V0IGlzIG5vdCBhbiBhcnJheSBvciBhIGZ1bmN0aW9uOiB7e2FyZzF9fSc7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoXy5pc09iamVjdCh0YXJnZXQpKSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IGFjdHVhbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAndGFyZ2V0IGlzIG5vdCBhbiBvYmplY3Q6IHt7YXJnMX19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbn0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTl0WVhSamFHVnljeTlqYjNKbExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdYeUE5SUNoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnZDJsdVpHOTNMbDhnT2lCMGVYQmxiMllnWjJ4dlltRnNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnWjJ4dlltRnNMbDhnT2lCdWRXeHNLVHRjYmx4dWRtRnlJR0Z6Y3lBOUlISmxjWFZwY21Vb0p5NHVMMkZ6Y3ljcE8xeHVkbUZ5SUhWMGFXd2dQU0J5WlhGMWFYSmxLQ2N1TGk5MWRHbHNKeWs3WEc1Y2JpOHZJRk5sZENCdlppQmtaV1poZFd4MElHMWhkR05vWlhKelhHNWhjM011Y21WbmFYTjBaWElvZTF4dUlDQXZMeUJVVDBSUE9pQk5iM1psSUhSb2FYTWdkRzhnZEdobElFTm9ZV2x1SUhCeWIzUnZkSGx3WlZ4dUlDQmtaWE5qT2lCN1hHNGdJQ0FnYUdWc2NEb2dKMUJ5YjNacFpHVWdZU0JqZFhOMGIyMGdaR1Z6WTNKcGNIUnBiMjRnWm05eUlISmxjRzl5ZEdWa0lHWmhhV3gxY21Wekp5eGNiaUFnSUNCa1pYTmpPaUJ1ZFd4c0xDQWdMeThnVTJ0cGNDQnBkQ0JtY205dElISmxjRzl5ZEhOY2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmtaWE5qS1NCN1hHNGdJQ0FnSUNBdkx5Qk9iM1JsSUhSb1lYUWdkR2hsSUdSbGMyTnlhWEIwYVc5dUlIZHZiaWQwSUdKbElITmxkQ0IxYm5ScGJDQjBhR1VnWTJoaGFXNGdhWE1nY21WemIyeDJaV1FzWEc0Z0lDQWdJQ0F2THlCaGRDQnNaV0Z6ZENCdmJtTmxMQ0J5WldGamFHbHVaeUIwYUdseklHVjRjR1ZqZEdGMGFXOXVMbHh1SUNBZ0lDQWdjbVYwZFhKdUlHWjFibU4wYVc5dUlDaHlaWE52YkhabGNpa2dlMXh1SUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTVqYUdGcGJpNWZYMlJsYzJOeWFYQjBhVzl1WDE4Z1BTQmtaWE5qTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnY21WemIyeDJaWElvWVdOMGRXRnNLVHRjYmlBZ0lDQWdJSDA3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUM4dklFbG5ibTl5WldRZ2JXRjBZMmhsY25OY2JpQWdkRzg2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkaEp5d2dKMkZ1Snl3Z0oySmxKeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEtkWE4wSUhOdmJXVWdjM2x1ZEdGNElITjFaMkZ5SUhSdklHMWhhMlVnZEdobElHVjRjR1ZqZEdGMGFXOXVjeUJsWVhOcFpYSWdiMjRnZEdobElHVjVaWE11SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ2JuVnNiQ3hjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdiV0Z5YXpvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RKYm1OeVpXRnpaWE1nZEdobElHZHNiMkpoYkNCZ1lYTnpMbTFoY210ellDQmpiM1Z1ZEdWeUlHVjJaWEo1SUhScGJXVWdhWFFnWjJWMGN5Y3NYRzRnSUNBZ0lDQW5aWFpoYkhWaGRHVmtJR0Z6SUhCaGNuUWdiMllnWVc0Z1pYaHdjbVZ6YzJsdmJpNGdWWE5sSUdsMElIUnZJSFpsY21sbWVTQjBhR0YwSUhSb1pTY3NYRzRnSUNBZ0lDQW5jSEpsWTJWa2FXNW5JR1Y0Y0dWamRHRjBhVzl1Y3lCaGNtVWdZV04wZFdGc2JIa2dZbVZwYm1jZ1pYaGxZM1YwWldRdUp5eGNiaUFnSUNBZ0lDZEJiaUJsWVhONUlIZGhlU0IwYnlCemRYQndiM0owSUhSb2FYTWdkMmhsYmlCMWMybHVaeUJoSUhSbGMzUWdjblZ1Ym1WeUlHbHpJSFJ2SUhKbGMyVjBKeXhjYmlBZ0lDQWdJQ2QwYUdVZ1kyOTFiblJsY2lCaWVTQmpZV3hzYVc1bklHQmhjM011YldGeWEzTW9LV0FnYjI0Z1lTQmlaV1p2Y21WRllXTm9JR2h2YjJzZ1lXNWtKeXhjYmlBZ0lDQWdJQ2QwYUdWdUlIWmxjbWxtZVNCaGRDQjBhR1VnWlc1a0lHOW1JSFJsYzNRZ2QybDBhQ0JnWVhOekxtMWhjbXR6S0U0cFlDQW9kMmhsY21VZ1RpQnBjeWNzWEc0Z0lDQWdJQ0FuZEdobElHNTFiV0psY2lCdlppQnRZWEpyY3lCNWIzVWdaWGh3WldOMFpXUXBMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUc1MWJHd3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnWVhOekxtMWhjbXR6TG1OdmRXNTBaWElnS3owZ01UdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0F2THlCS2RYTjBJR0ZzYkc5M0lHRnVlWFJvYVc1bklEb3BYRzRnSUdGdWVUb2dlMXh1SUNBZ0lHaGxiSEE2SUNkQmJHeHZkM01nWVc1NUlIWmhiSFZsSUhkcGRHaHZkWFFnZEdWemRHbHVaeUJwZEM0bkxGeHVJQ0FnSUdSbGMyTTZJQ2RwY3lCaGJubDBhR2x1Wnljc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0F2THlCQmJubDBhR2x1WnlCMGFHRjBJR2x6YmlkMElHNTFiR3dnYjNJZ2RXNWtaV1pwYm1Wa1hHNGdJR1JsWm1sdVpXUTZJSHRjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnR6SUdsbUlIUm9aU0IyWVd4MVpTQnBjeUJ1YjNRZ2JuVnNiQ0J2Y2lCMWJtUmxabWx1WldRdUp5eGNiaUFnSUNCa1pYTmpPaUFuYVhNZ1pHVm1hVzVsWkNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lBa2V5QmhZM1IxWVd3Z2ZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR0ZqZEhWaGJDQWhQU0J1ZFd4c08xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ0x5OGdRMmhsWTJzZ2FXWWdkR2hsSUhaaGJIVmxJR2x6SUdWdGNIUjVYRzRnSUdWdGNIUjVPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05yY3lCcFppQjBhR1VnZG1Gc2RXVWdhWE1nWlcxd2RIa2dLRzl5SUdoaGN5QmhJR3hsYm1kMGFDQnZaaUF3S1M0bkxGeHVJQ0FnSUdSbGMyTTZJQ2RwY3lCbGJYQjBlU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUFrZXlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBOVBTQnVkV3hzSUh4OElHRmpkSFZoYkM1c1pXNW5kR2dnUFQwOUlEQTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnVaVzF3ZEhrNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZHViMjVGYlhCMGVTY2dYU3hjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnR6SUdsbUlIUm9aU0IyWVd4MVpTQnBjeUJ1YjNRZ1pXMXdkSGtnS0c5eUlHaGhjeUJoSUd4bGJtZDBhQ0JuY21WaGRHVnlJSFJvWVc0Z01Da3VKeXhjYmlBZ0lDQmtaWE5qT2lBbmFYTWdibTkwSUdWdGNIUjVKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJQ1I3SUdGamRIVmhiQ0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z1lXTjBkV0ZzSUNFOUlHNTFiR3dnSmlZZ1lXTjBkV0ZzTG14bGJtZDBhQ0ErSURBN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCMGNuVjBhSGs2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkMGNuVnBjMmduSUYwc1hHNGdJQ0FnYUdWc2NEb2dKMVJvWlNCMllXeDFaU0J6YUc5MWJHUWdZbVVnZEhKMWRHaDVJQ2h1YjNRZ2RXNWtaV1pwYm1Wa0xDQnVkV3hzTENBd0xDQmNJbHdpSUc5eUlGdGRLUzRuTEZ4dUlDQWdJR1JsYzJNNklDZHBjeUIwY25WMGFIa25MRnh1SUNBZ0lHWmhhV3c2SUNkM1lYTWdKSHNnWVdOMGRXRnNJSDBuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lHbG1JQ2doWVdOMGRXRnNLU0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEhsd1pXOW1JR0ZqZEhWaGJDNXNaVzVuZEdnZ1BUMDlJQ2R1ZFcxaVpYSW5JRDhnWVdOMGRXRnNMbXhsYm1kMGFDQStJREFnT2lCMGNuVmxPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdabUZzYzNrNklIdGNiaUFnSUNCb1pXeHdPaUFuVkdobElIWmhiSFZsSUhOb2IzVnNaQ0JpWlNCbVlXeHplU0FvZFc1a1pXWnBibVZrTENCdWRXeHNMQ0F3TENCY0lsd2lJRzl5SUZ0ZEtTNG5MRnh1SUNBZ0lHUmxjMk02SUNkcGN5Qm1ZV3h6ZVNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lCN2V5QmhZM1IxWVd3Z2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUdsbUlDZ2hZV04wZFdGc0tTQnlaWFIxY200Z2RISjFaVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBlWEJsYjJZZ1lXTjBkV0ZzTG14bGJtZDBhQ0E5UFQwZ0oyNTFiV0psY2ljZ1B5QmhZM1IxWVd3dWJHVnVaM1JvSUQwOVBTQXdJRG9nWm1Gc2MyVTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJQzh2SUU1bFoyRjBhVzl1WEc0Z0lHNXZkRG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjI1dkp5d2dKMDVQSnl3Z0owNVBWQ2NnWFN4Y2JpQWdJQ0JvWld4d09pQW5UbVZuWVhSbGN5QjBhR1VnY21WemRXeDBJR1p2Y2lCMGFHVWdjbVZ6ZENCdlppQjBhR1VnWlhod2NtVnpjMmx2Ymk0bkxGeHVJQ0FnSUdSbGMyTTZJQ2RPYjNRaEp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdJR0ZqZEhWaGJDQjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNoeVpYTnZiSFpsY2lrZ2UxeHVYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTnZiSFpsY2k1bGVHaGhkWE4wWldRcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbVpwYm1Gc2FYcGxLR1oxYm1OMGFXOXVJQ2htYVc1aGJDa2dlMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUFoWm1sdVlXdzdYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCeVpYTnZiSFpsY2loaFkzUjFZV3dwTzF4dUlDQWdJQ0FnZlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2FYTTZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RsY1hWaGJDY3NJQ2RsY1hWaGJITW5JRjBzWEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owTm9aV05yY3lCemRISnBZM1FnWlhGMVlXeHBkSGtnWW1WMGQyVmxiaUIwYUdVZ2RtRnNkV1VnWVc1a0lHbDBjeUJsZUhCbFkzUmxaQzRuTEZ4dUlDQWdJQ0FnSjA1dmRHVTZJR2xtSUhSb1pTQmxlSEJsWTNSbFpDQjJZV3gxWlNCcGN5QmhJR05vWVdsdUlHVjRjSEpsYzNOcGIyNGdhWFJjWENkc2JDQmlaU0IwWlhOMFpXUWdhVzV6ZEdWaFpDNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZEc4Z2MzUnlhV04wYkhrZ1pYRjFZV3dnZTN0bGVIQmxZM1JsWkgxOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdZV04wZFdGc2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdWNGNHVmpkR1ZrS1NCN1hHNGdJQ0FnSUNBdkx5QjBhR2x6SUdseklHRWdZbWwwSUdOdmJuUnlhWFpsWkNCaWRYUWdhWFFnYldGclpYTWdabTl5SUhOdmJXVWdibWxqWlNCemVXNTBZWGdnZEc4Z1ltVWdZV0pzWlNCMGIxeHVJQ0FnSUNBZ0x5OGdkWE5sSUM1cGN5Qm1iM0lnY0dGemMybHVaeUJwYmlCbGVIQmxZM1JoZEdsdmJuTmNiaUFnSUNBZ0lHbG1JQ2hoYzNNdVEyaGhhVzR1YVhORGFHRnBiaWhsZUhCbFkzUmxaQ2twSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdWNGNHVmpkR1ZrTG5SbGMzUW9ZV04wZFdGc0tUdGNiaUFnSUNBZ0lIMWNibHh1SUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBOVBUMGdaWGh3WldOMFpXUTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQmxjVG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjJWeGJDY3NJQ2RsY1d4ekp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkRGFHVmphM01nWkdWbGNDQnViMjR0YzNSeWFXTjBJR1Z4ZFdGc2FYUjVJR0psZEhkbFpXNGdkR2hsSUhaaGJIVmxJR0Z1WkNCcGRITWdaWGh3WldOMFpXUXVKeXhjYmlBZ0lDQWdJQ2RKZENCMWJtUmxjbk4wWVc1a2N5QmhjM01nWlhod2NtVnpjMmx2Ym5NZ2MyOGdlVzkxSUdOaGJpQmpiMjFpYVc1bElIUm9aVzBnWVhRZ2QybHNiQ0JwYmlCMGFHVW5MRnh1SUNBZ0lDQWdKMlY0Y0dWamRHVmtJSFpoYkhWbExpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCbGNYVmhiQ0I3ZTJWNGNHVmpkR1ZrZlgwbkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ2UzdGhZM1IxWVd4OWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnWlhod1pXTjBaV1FwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJmTG1selJYRjFZV3dvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUcxaGRHTm9PaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0oxUnlhV1Z6SUhSdklHMWhkR05vSUhSb1pTQnpkV0pxWldOMElHRm5ZV2x1YzNRZ2RHaGxJR1Y0Y0dWamRHVmtJSFpoYkhWbElIZG9hV05vSUdOaGJpQmlaU0JsYVhSb1pYSW5MRnh1SUNBZ0lDQWdKMkVnWm5WdVkzUnBiMjRzSUdGdUlHRnpjeUJsZUhCeVpYTnphVzl1TENCaGJpQnZZbXBsWTNRZ2QybDBhQ0JoSUM1MFpYTjBLQ2tnWm5WdVkzUnBiMjRnS0dadmNpQW5MRnh1SUNBZ0lDQWdKMmx1YzNSaGJtTmxJR0VnVW1WblJYaHdLU0J2Y2lCaElIQnNZV2x1SUc5aWFtVmpkQ0IwYnlCd1lYSjBhV0ZzYkhrZ2JXRjBZMmdnWVdkaGFXNXpkQ0IwYUdVZ2RtRnNkV1V1SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJRzFoZEdOb0lIdDdaWGh3WldOMFpXUjlmU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUI3ZTJGamRIVmhiSDE5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1WEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdWNGNHVmpkR1ZrTG5SbGMzUWdQVDA5SUNkbWRXNWpkR2x2YmljcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDRWhaWGh3WldOMFpXUXVkR1Z6ZENoaFkzUjFZV3dwTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCcFppQW9YeTVwYzFCc1lXbHVUMkpxWldOMEtHVjRjR1ZqZEdWa0tTQjhmQ0JmTG1selFYSnlZWGtvWlhod1pXTjBaV1FwSUh4OElGOHVhWE5CY21kMWJXVnVkSE1vWlhod1pXTjBaV1FwS1NCN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0dGamRIVmhiQ0E5UFNCdWRXeHNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdVM1Z3Y0c5eWRDQndZWE56YVc1bklHQmJMQ2RtYjI4blhXQWdkRzhnYldWaGJpQmdXMkZ6Y3k1aGJua3NJQ2RtYjI4blhXQmNiaUFnSUNBZ0lDQWdhV1lnS0Y4dWFYTkJjbkpoZVNobGVIQmxZM1JsWkNrZ2ZId2dYeTVwYzBGeVozVnRaVzUwY3lobGVIQmxZM1JsWkNrcElIdGNiaUFnSUNBZ0lDQWdJQ0JsZUhCbFkzUmxaQ0E5SUY4dWJXRndLR1Y0Y0dWamRHVmtMQ0JtZFc1amRHbHZiaUFvZGlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFI1Y0dWdlppQjJJRDA5UFNBbmRXNWtaV1pwYm1Wa0p5QS9JR0Z6Y3k1aGJua2dPaUIyTzF4dUlDQWdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdWRTlFVHpvZ1NXUmxZV3hzZVNCM1pTQnphRzkxYkdRZ1hDSm1iM0pyWENJZ2RHaGxJSEpsYzI5c2RtVnlJSE52SUhkbElHTmhiaUJ6ZFhCd2IzSjBYRzRnSUNBZ0lDQWdJQzh2SUNBZ0lDQWdJR0Z6ZVc1aklIUmxjM1J6SUdGdVpDQmhiSE52SUhCeWIzWnBaR1VnWW1WMGRHVnlJR1poYVd4MWNtVWdiV1Z6YzJGblpYTXVYRzRnSUNBZ0lDQWdJQzh2SUNBZ0lDQWdJRlZ1Wm05eWRIVnVZWFJsYkhrZ2RHaGxJR04xY25KbGJuUWdabTl5YTJsdVp5QnRaV05vWVc1cGMyMGdaRzlsYzI0bmRDQjNiM0pyWEc0Z0lDQWdJQ0FnSUM4dklDQWdJQ0FnSUdadmNpQjBhR2x6SUhWelpTQmpZWE5sSUhOcGJtTmxJSGRsSUc1bFpXUWdkRzhnWTNKbFlYUmxJRzVsZHlCamFHRnBibk1nWm05eVhHNGdJQ0FnSUNBZ0lDOHZJQ0FnSUNBZ0lHVmhZMmdnWlhod1pXTjBaV1FnYTJWNUxseHVJQ0FnSUNBZ0lDQjJZWElnWm1GcGJIVnlaU0E5SUhSeWRXVTdYRzRnSUNBZ0lDQWdJRjhvWlhod1pXTjBaV1FwTG1WMlpYSjVLR1oxYm1OMGFXOXVJQ2gyWVd4MVpTd2dhMlY1S1NCN1hHNGdJQ0FnSUNBZ0lDQWdhV1lnS0NGZkxtaGhjeWhoWTNSMVlXd3NJR3RsZVNrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdaaGFXeDFjbVVnUFNBbmEyVjVJRndpSnlBcklHdGxlU0FySUNkY0lpQnViM1FnWm05MWJtUWdhVzRnZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0ZmTG1selJYRjFZV3dvWVdOMGRXRnNXMnRsZVYwc0lIWmhiSFZsS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWm1GcGJIVnlaU0E5SUNkclpYa2dYQ0luSUNzZ2EyVjVJQ3NnSjF3aUlHUnZaWE1nYm05MElHMWhkR05vSUh0N1lXTjBkV0ZzVzF3aUp5QXJJR3RsZVNBcklDZGNJbDE5ZlNjN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCbVlXbHNkWEpsTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCcFppQW9kSGx3Wlc5bUlHVjRjR1ZqZEdWa0lDRTlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBblpYaHdaV04wWldRZ2FYTWdibTkwSUdFZ1puVnVZM1JwYjI0Z1lXNWtJR1J2WlhNZ2JtOTBJR2hoZG1VZ1lTQXVkR1Z6ZENCdFpYUm9iMlFuTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCeVpYUjFjbTRnSVNGbGVIQmxZM1JsWkNoaFkzUjFZV3dwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCaFltOTJaVG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjJkMEp5d2dKMjF2Y21WVWFHRnVKeXdnSjJkeVpXRjBaWEpVYUdGdUp5QmRMRnh1SUNBZ0lHaGxiSEE2SUNkRGFHVmphM01nYVdZZ2RHaGxJSFpoYkhWbElHbHpJR2hwWjJobGNpQjBhR0Z1SUdsMGN5QmxlSEJsWTNSbFpDNG5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0J0YjNKbElIUm9ZVzRnZTN0bGVIQmxZM1JsWkgxOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdZV04wZFdGc2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdWNGNHVmpkR1ZrS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWVdOMGRXRnNJRDRnWlhod1pXTjBaV1E3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUdKbGJHOTNPaUI3WEc0Z0lDQWdZV3hwWVhObGN6b2dXeUFuYkhRbkxDQW5iR1Z6YzFSb1lXNG5JRjBzWEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05yY3lCcFppQjBhR1VnZG1Gc2RXVWdhWE1nYkc5M1pYSWdkR2hoSUdsMGN5QmxlSEJsWTNSbFpDNG5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0JzWlhOeklIUm9ZVzRnZTN0bGVIQmxZM1JsWkgxOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdZV04wZFdGc2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdWNGNHVmpkR1ZrS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWVdOMGRXRnNJRHdnWlhod1pXTjBaV1E3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUdGaWIzWmxUM0pGY1hWaGJEb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMnhsWVhOMEp5d2dKMkYwVEdWaGMzUW5MQ0FuWjNSbEp5d2dKMjF2Y21WVWFHRnVUM0pGY1hWaGJDY3NJQ2RuY21WaGRHVnlWR2hoYms5eVJYRjFZV3duSUYwc1hHNGdJQ0FnYUdWc2NEb2dKME5vWldOcmN5QnBaaUIwYUdVZ2RtRnNkV1VnYVhNZ2FHbG5hR1Z5SUc5eUlHVnhkV0ZzSUhSb1lXNGdhWFJ6SUdWNGNHVmpkR1ZrTGljc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHMXZjbVVnZEdoaGJpQnZjaUJsY1hWaGJDQjBieUFrZTJWNGNHVmpkR1ZrZlNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lCN2UyRmpkSFZoYkgxOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR0ZqZEhWaGJDQStQU0JsZUhCbFkzUmxaRHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnWW1Wc2IzZFBja1Z4ZFdGc09pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5iVzl6ZENjc0lDZGhkRTF2YzNRbkxDQW5iSFJsSnl3Z0oyeGxjM05VYUdGdVQzSkZjWFZoYkNjZ1hTeGNiaUFnSUNCb1pXeHdPaUFuUTJobFkydHpJR2xtSUhSb1pTQjJZV3gxWlNCcGN5QnNiM2RsY2lCdmNpQmxjWFZoYkNCMGFHRnVJR2wwY3lCbGVIQmxZM1JsWkM0bkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQnNaWE56SUhSb1lXNGdiM0lnWlhGMVlXd2dkRzhnSkh0bGVIQmxZM1JsWkgwbkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ0pIdGhZM1IxWVd4OUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR0ZqZEhWaGJDQThQU0JsZUhCbFkzUmxaRHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnWTJ4dmMyVTZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RqYkc5elpWUnZKeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZERhR1ZqYTNNZ2FXWWdkR2hsSUhaaGJIVmxJR2x6SUdOc2IzTmxJSFJ2SUhSb1pTQmxlSEJsWTNSbFpDQmlZWE5sWkNCdmJpQmhJR2RwZG1WdUlHUmxiSFJoTGljc1hHNGdJQ0FnSUNBblZHaGxJR1JsWm1GMWJIUWdaR1ZzZEdFZ2FYTWdNQzR4SUhOdklIUm9aU0IyWVd4MVpTQXpMalUxSUdseklHTnNiM05sSUhSdklHRnVlU0IyWVd4MVpTQmlaWFIzWldWdUp5eGNiaUFnSUNBZ0lDY3pMalExSUdGdVpDQXpMalkxSUNoaWIzUm9JR2x1WTJ4MWMybDJaU2t1Snl4Y2JpQWdJQ0FnSUNkVGRISnBibWNnZG1Gc2RXVnpJR0Z5WlNCaGJITnZJSE4xY0hCdmNuUmxaQ0JpZVNCamIyMXdkWFJwYm1jZ2RHaGxJR1JwYzNSaGJtTmxJR0psZEhkbFpXNGdkR2hsYlNjc1hHNGdJQ0FnSUNBbmRYTnBibWNnZEdobElGTnBablEwSUdGc1oyOXlhWFJvYlM0Z1JtOXlJSE4wY21sdVp5QjJZV3gxWlhNZ2RHaGxJR1JsYkhSaElHbHpJR2x1ZEdWeWNISmxkR1ZrSUdGekp5eGNiaUFnSUNBZ0lDZGhJSEJsY21ObGJuUmhaMlVnS0dsbE9pQXdMakkxSUdseklESTFKU2t1SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUdOc2IzTmxJSFJ2SUh0N0lHVjRjR1ZqZEdWa0lIMTlKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJSHQ3SUdGamRIVmhiQ0I5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2daWGh3WldOMFpXUXNJR1JsYkhSaEtTQjdYRzRnSUNBZ0lDQmtaV3gwWVNBOUlHUmxiSFJoSUQwOUlHNTFiR3dnUHlBd0xqRWdPaUJrWld4MFlUdGNibHh1SUNBZ0lDQWdMeThnVTNWd2NHOXlkQ0J6ZEhKcGJtZHpJR0o1SUdOdmJYQjFkR2x1WnlCMGFHVnBjaUJrYVhOMFlXNWpaVnh1SUNBZ0lDQWdhV1lnS0Y4dWFYTlRkSEpwYm1jb1lXTjBkV0ZzS1NBbUppQmZMbWx6VTNSeWFXNW5LR1Y0Y0dWamRHVmtLU2tnZTF4dUlDQWdJQ0FnSUNCMllYSWdaR2xtWmlBOUlIVjBhV3d1YzJsbWREUW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDd2dNeWtnTHlCTllYUm9MbTFoZUNoaFkzUjFZV3d1YkdWdVozUm9MQ0JsZUhCbFkzUmxaQzVzWlc1bmRHZ3BPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdaR2xtWmlBOFBTQmtaV3gwWVR0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdGamRIVmhiQ0ErUFNCbGVIQmxZM1JsWkNBdElHUmxiSFJoSUNZbUlHRmpkSFZoYkNBOFBTQmxlSEJsWTNSbFpDQXJJR1JsYkhSaE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQnBibk4wWVc1alpXOW1PaUI3WEc0Z0lDQWdZV3hwWVhObGN6b2dXeUFuYVc1emRHRnVZMlZQWmljc0lDZHBibk4wWVc1alpTY3NJQ2RwYzJFbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBOb1pXTnJjeUJwWmlCMGFHVWdkbUZzZFdVZ2FYTWdZVzRnYVc1emRHRnVZMlVnYjJZZ2RHaGxJR2RwZG1WdUlHTnZibk4wY25WamRHOXlMaWNzWEc0Z0lDQWdJQ0FuVjJobGJpQjBhR1VnWlhod1pXTjBaV1FnYVhNZ1lTQnpkSEpwYm1jZ2FYUmNYQ2RzYkNCaFkzUjFZV3hzZVNCMWMyVWdZU0JnZEhsd1pXOW1ZQ2NzWEc0Z0lDQWdJQ0FuWTI5dGNHRnlhWE52Ymk0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5kRzhnWW1VZ1lXNGdhVzV6ZEdGdVkyVWdiMllnZTN0bGVIQmxZM1JsWkgxOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tGOHVhWE5UZEhKcGJtY29aWGh3WldOMFpXUXBLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwZVhCbGIyWWdZV04wZFdGc0lEMDlQU0JsZUhCbFkzUmxaQ0EvSUhSeWRXVWdPaUFuYUdGa0lIUjVjR1VnZTNzZ2RIbHdaVzltSUdGamRIVmhiQ0I5ZlNjN1hHNGdJQ0FnSUNCOVhHNGdJQ0FnSUNCeVpYUjFjbTRnWVdOMGRXRnNJR2x1YzNSaGJtTmxiMllnWlhod1pXTjBaV1E3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUhSNWNHVnZaam9nZTF4dUlDQWdJR2hsYkhBNklDZERhR1ZqYTNNZ2FXWWdkR2hsSUhaaGJIVmxJR2x6SUc5bUlHRWdjM0JsWTJsbWFXTWdkSGx3WlNjc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdoaGRtVWdkSGx3WlNCN2UyVjRjR1ZqZEdWa2ZYMG5MRnh1SUNBZ0lHWmhhV3c2SUNkb1lXUWdKSHNnZEhsd1pXOW1JR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCbGVIQmxZM1JsWkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTkZjWFZoYkNoMGVYQmxiMllnWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0J1ZFcxaVpYSTZJSHRjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnNnYVdZZ2RHaGxJSFpoYkhWbElHbHpJR0VnYm5WdFltVnlJQ2hrYVdabVpYSmxiblFnYjJZZ1RtRk9LUzRuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCaElHNTFiV0psY2ljc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTk9kVzFpWlhJb1lXTjBkV0ZzS1NBbUppQWhhWE5PWVU0b1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUdKdmIydzZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RpYjI5c1pXRnVKeUJkTEZ4dUlDQWdJR2hsYkhBNklDZERhR1ZqYXlCcFppQjBhR1VnZG1Gc2RXVWdhWE1nWVNCaWIyOXNaV0Z1TGljc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHRWdZbTl2YkdWaGJpY3NYRzRnSUNBZ1ptRnBiRG9nSjJoaFpDQjBlWEJsSUNSN0lIUjVjR1Z2WmlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVhWE5DYjI5c1pXRnVLR0ZqZEhWaGJDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnpkSEpwYm1jNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZHpkSEluSUYwc1hHNGdJQ0FnYUdWc2NEb2dKME5vWldOcklHbG1JSFJvWlNCMllXeDFaU0JwY3lCaElITjBjbWx1Wnk0bkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQmhJSE4wY21sdVp5Y3NYRzRnSUNBZ1ptRnBiRG9nSjJoaFpDQjBlWEJsSUNSN0lIUjVjR1Z2WmlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVhWE5UZEhKcGJtY29ZV04wZFdGc0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHOWlhbVZqZERvZ2UxeHVJQ0FnSUdobGJIQTZJQ2REYUdWamF5QjBhR0YwSUhaaGJIVmxJR2x6SUc5bUlIUjVjR1VnYjJKcVpXTjBMaWNzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUdGdUlHOWlhbVZqZENjc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTlBZbXBsWTNRb1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUhCc1lXbHVUMkpxWldOME9pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5jR3hoYVc0bkxDQW5iMkpxSnlCZExGeHVJQ0FnSUdobGJIQTZJQ2REYUdWamEzTWdkR2hoZENCMllXeDFaU0JwY3lCaGJpQnZZbXBsWTNRZ1kzSmxZWFJsWkNCaWVTQjBhR1VnVDJKcVpXTjBJR052Ym5OMGNuVmpkRzl5TGljc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lBa2UyRmpkSFZoYkgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmZMbWx6VUd4aGFXNVBZbXBsWTNRb1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUdGeWNtRjVPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUhSb1lYUWdkbUZzZFdVZ2FYTWdZVzRnUVhKeVlYa3VKeXhjYmlBZ0lDQmtaWE5qT2lBbmRHOGdZbVVnWVc0Z1FYSnlZWGtuTEZ4dUlDQWdJR1poYVd3NklDZG9ZV1FnZEhsd1pTQWtleUIwZVhCbGIyWWdZV04wZFdGc0lIMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJmTG1selFYSnlZWGtvWVdOMGRXRnNLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJR1oxYm1OMGFXOXVPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUhSb1lYUWdkbUZzZFdVZ2FYTWdZU0JHZFc1amRHbHZiaTRuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCaElFWjFibU4wYVc5dUp5eGNiaUFnSUNCbVlXbHNPaUFuYUdGa0lIUjVjR1VnSkhzZ2RIbHdaVzltSUdGamRIVmhiQ0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z1h5NXBjMFoxYm1OMGFXOXVLR0ZqZEhWaGJDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnlaV2RsZUhBNklIdGNiaUFnSUNCb1pXeHdPaUFuUTJobFkyc2dkR2hoZENCMllXeDFaU0JwY3lCaElGSmxaMFY0Y0Njc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHRWdVbVZuUlhod0p5eGNiaUFnSUNCbVlXbHNPaUFuYUdGa0lIUjVjR1VnSkhzZ2RIbHdaVzltSUdGamRIVmhiQ0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z1h5NXBjMUpsWjBWNGNDaGhZM1IxWVd3cE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ1pHRjBaVG9nZTF4dUlDQWdJR2hsYkhBNklDZERhR1ZqYXlCMGFHRjBJSFpoYkhWbElHbHpJR0VnUkdGMFpTY3NYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJR0VnUkdGMFpTY3NYRzRnSUNBZ1ptRnBiRG9nSjJoaFpDQjBlWEJsSUNSN0lIUjVjR1Z2WmlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVhWE5FWVhSbEtHRmpkSFZoYkNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCbGJHVnRaVzUwT2lCN1hHNGdJQ0FnYUdWc2NEb2dKME5vWldOcklIUm9ZWFFnZG1Gc2RXVWdhWE1nWVNCRVQwMGdaV3hsYldWdWRDY3NYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJR0VnUkU5TklHVnNaVzFsYm5RbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmZMbWx6Uld4bGJXVnVkQ2hoWTNSMVlXd3BPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdaWEp5YjNJNklIdGNiaUFnSUNCb1pXeHdPaUFuUTJobFkyc2dkR2hoZENCMllXeDFaU0JwY3lCaGJpQmxjbkp2Y2lBb2IzSWdiRzl2YTNNZ2JHbHJaU0JwZENrbkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQmhiaUJGY25KdmNpY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tHRmpkSFZoYkNCcGJuTjBZVzVqWlc5bUlFVnljbTl5S1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lDQWdmVnh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVhWE5QWW1wbFkzUW9ZV04wZFdGc0tTQW1KaUJmTG1selUzUnlhVzVuS0dGamRIVmhiQzV1WVcxbEtTQW1KaUJmTG1selUzUnlhVzVuS0dGamRIVmhiQzV0WlhOellXZGxLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnZFc1a1pXWnBibVZrT2lCN1hHNGdJQ0FnYUdWc2NEb2dKME5vWldOcklIUm9ZWFFnZG1Gc2RXVWdhWE1nZFc1a1pXWnBibVZrTGljc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElIVnVaR1ZtYVc1bFpDY3NYRzRnSUNBZ1ptRnBiRG9nSjNkaGN5QWtleUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTlZibVJsWm1sdVpXUW9ZV04wZFdGc0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHNTFiR3c2SUh0Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJzZ2RHaGhkQ0IyWVd4MVpTQnBjeUJ1ZFd4c0xpY3NYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJRzUxYkd3bkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ0pIc2dZV04wZFdGc0lIMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJoWTNSMVlXd2dQVDA5SUc1MWJHdzdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQk9ZVTQ2SUh0Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJzZ2RHaGhkQ0IyWVd4MVpTQnBjeUJPWVU0dUp5eGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdUbUZPSnl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnBaaUFvWHk1cGMwNTFiV0psY2loaFkzUjFZV3dwS1NCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Wm1GcGJDQTlJQ2QzWVhNZ0pIdGhZM1IxWVd4OUp6dGNiaUFnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Wm1GcGJDQTlJQ2RvWVdRZ2RIbHdaU0FrZTNSNWNHVnZaaUJoWTNSMVlXeDlKenRjYmlBZ0lDQWdJSDFjYmlBZ0lDQWdJSEpsZEhWeWJpQnBjMDVoVGloaFkzUjFZV3dwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnZEhKMVpUb2dlMXh1SUNBZ0lHaGxiSEE2SUNkRGFHVmpheUIwYUdGMElIWmhiSFZsSUdseklIUnlkV1VuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCMGNuVmxKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJSHQ3SUdGamRIVmhiQ0I5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdhV1lnS0Y4dWFYTkNiMjlzWldGdUtHRmpkSFZoYkNrcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBOVBTQjBjblZsSUQ4Z2RISjFaU0E2SUNkM1lYTWdlM3RoWTNSMVlXeDlmU2M3WEc0Z0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdKMmhoWkNCMGVYQmxJQ1I3ZEhsd1pXOW1JR0ZqZEhWaGJIMG5PMXh1SUNBZ0lDQWdmVnh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdabUZzYzJVNklIdGNiaUFnSUNCb1pXeHdPaUFuUTJobFkyc2dkR2hoZENCMllXeDFaU0JwY3lCbVlXeHpaU2NzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUdaaGJITmxKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCcFppQW9YeTVwYzBKdmIyeGxZVzRvWVdOMGRXRnNLU2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWVdOMGRXRnNJRDA5SUdaaGJITmxJRDhnZEhKMVpTQTZJQ2QzWVhNZ2UzdGhZM1IxWVd4OWZTYzdYRzRnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0oyaGhaQ0IwZVhCbElDUjdkSGx3Wlc5bUlHRmpkSFZoYkgwbk8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQnlZV2x6WlhNNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZDBhSEp2ZDNNbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBOb1pXTnJjeUIwYUdGMElHVjRaV04xZEdsdVp5QjBhR1VnZG1Gc2RXVWdjbVZ6ZFd4MGN5QnBiaUJoYmlCbGVHTmxjSFJwYjI0Z1ltVnBibWNnZEdoeWIzZHVMaWNzWEc0Z0lDQWdJQ0FuVkdobElHTmhjSFIxY21Wa0lHVjRZMlZ3ZEdsdmJpQjJZV3gxWlNCcGN5QjFjMlZrSUhSdklHMTFkR0YwWlNCMGFHVWdjM1ZpYW1WamRDQm1iM0lnZEdobEp5eGNiaUFnSUNBZ0lDZG1iMnhzYjNkcGJtY2daWGh3WldOMFlYUnBiMjV6TGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZDBhSEp2ZDNNZ1lXNGdaWEp5YjNJbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR1Y0Y0dWamRHVmtLU0I3WEc0Z0lDQWdJQ0JwWmlBb0lWOHVhWE5HZFc1amRHbHZiaWhoWTNSMVlXd3BLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFuYVhNZ2JtOTBJR0VnWm5WdVkzUnBiMjQ2SUh0N1lXTjBkV0ZzZlgwbk8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQjBjbmtnZTF4dUlDQWdJQ0FnSUNCaFkzUjFZV3dvS1R0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUNka2FXUWdibTkwSUhSb2NtOTNJR0Z1ZVhSb2FXNW5KenRjYmlBZ0lDQWdJSDBnWTJGMFkyZ2dLR1VwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLR1Y0Y0dWamRHVmtJRDA5SUc1MWJHd3BJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1pTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnYVdZZ0tGOHVhWE5HZFc1amRHbHZiaWhsZUhCbFkzUmxaQ2tnSmlZZ1pTQnBibk4wWVc1alpXOW1JR1Y0Y0dWamRHVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXViWFYwWVhSbEtHVXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdsbUlDaGZMbWx6UlhGMVlXd29aU3dnWlhod1pXTjBaV1FwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLR1VwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdMeThnUVhWbmJXVnVkQ0IwYUdVZ1pYaHdaV04wWVhScGIyNGdiMkpxWldOMElIZHBkR2dnWVNCdVpYY2dkR1Z0Y0d4aGRHVWdkbUZ5YVdGaWJHVmNiaUFnSUNBZ0lDQWdkR2hwY3k1bGVHTmxjSFJwYjI0Z1BTQmxPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdKMmR2ZENCN2V5QmxlR05sY0hScGIyNGdmWDBuTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCb1lYTTZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RvWVhabEp5d2dKMk52Ym5SaGFXNG5MQ0FuWTI5dWRHRnBibk1uSUYwc1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKME5vWldOcklHbG1JSFJvWlNCMllXeDFaU0JvWVhNZ2MyOXRaU0JsZUhCbFkzUmxaQ0IyWVd4MVpTNGdTWFFnZFc1a1pYSnpkR0Z1WkhNZ1pYaHdaV04wWldRbkxGeHVJQ0FnSUNBZ0oyTm9ZV2x1SUdWNGNISmxjM05wYjI1eklITnZJSFJvYVhNZ2MyVnlkbVZ6SUdGeklIUm9aU0JsY1hWcGRtRnNaVzUwSUc5bUlDNWxjU0JtYjNJZ2NHRnlkR2xoYkNjc1hHNGdJQ0FnSUNBbmJXRjBZMmhsY3k0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5kRzhnWTI5dWRHRnBiaUI3ZTJWNGNHVmpkR1ZrZlgwbkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ2UzdGhZM1IxWVd4OWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnWVhKbk1TQXZLaXdnTGk0dUlDb3ZLU0I3WEc1Y2JpQWdJQ0FnSUM4dklHRnNiRzkzSUcxMWJIUnBjR3hsSUdWNGNHVmpkR1ZrSUhaaGJIVmxjMXh1SUNBZ0lDQWdkbUZ5SUdWNGNHVmpkR1ZrSUQwZ1h5NTBiMEZ5Y21GNUtHRnlaM1Z0Wlc1MGN5a3VjMnhwWTJVb01TazdYRzRnSUNBZ0lDQjBhR2x6TG1WNGNHVmpkR1ZrSUQwZ1pYaHdaV04wWldRdWJHVnVaM1JvSUQwOVBTQXhJRDhnWlhod1pXTjBaV1JiTUYwZ09pQmxlSEJsWTNSbFpEdGNibHh1SUNBZ0lDQWdhV1lnS0NGZkxtbHpVM1J5YVc1bktHRmpkSFZoYkNrZ0ppWWdJVjh1YVhOQmNuSmhlU2hoWTNSMVlXd3BJQ1ltSUNGZkxtbHpUMkpxWldOMEtHRmpkSFZoYkNrcElIdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlDZG5iM1FnZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCZkxtVjJaWEo1S0dWNGNHVmpkR1ZrTENCbWRXNWpkR2x2YmlBb1pYaHdaV04wWldRcElIdGNiaUFnSUNBZ0lDQWdhV1lnS0Y4dWFYTlRkSEpwYm1jb1lXTjBkV0ZzS1NBbUppQmZMbWx6VTNSeWFXNW5LR1Y0Y0dWamRHVmtLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlBdE1TQWhQVDBnWVdOMGRXRnNMbWx1WkdWNFQyWW9aWGh3WldOMFpXUXBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLRjh1YVhOQmNuSmhlU2hoWTNSMVlXd3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0x5OGdWRTlFVHpvZ1NYTnVKM1FnZEdobGNtVWdZVzRnWldGemFXVnlJSGRoZVNCMGJ5QjBaWE4wSUhSb2FYTWdkWE5wYm1jZ2JHOWtZWE5vSUc5dWJIay9YRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tDRmhjM011UTJoaGFXNHVhWE5EYUdGcGJpaGxlSEJsWTNSbFpDa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVjRjR1ZqZEdWa0lEMGdZWE56TG1WeEtHVjRjR1ZqZEdWa0tUdGNiaUFnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUMweElDRTlQU0JmTG1acGJtUkpibVJsZUNoaFkzUjFZV3dzSUdWNGNHVmpkR1ZrS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQzh2SUVoaFkyczZJRU52YlhCaGNtVWdiMkpxWldOMGN5QjNhWFJvSUM1M2FHVnlaU0JpZVNCbWFXeDBaWEpwYm1jZ1lTQjNjbUZ3Y0dWeUlHRnljbUY1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUF4SUQwOVBTQmZMbmRvWlhKbEtGdGhZM1IxWVd4ZExDQmxlSEJsWTNSbFpDa3ViR1Z1WjNSb08xeHVJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQm9ZWE5QZDI0NklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZG9ZWE5MWlhrbkxDQW5hR0Z6U1c1a1pYZ25JRjBzWEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owTm9aV05ySUdsbUlIUm9aU0IyWVd4MVpTQm9ZWE1nYjI1bElHOXlJRzF2Y21VZ2IzZHVJSEJ5YjNCbGNuUnBaWE1nWVhNZ1pHVm1hVzVsWkNCaWVTY3NYRzRnSUNBZ0lDQW5kR2hsSUdkcGRtVnVJR0Z5WjNWdFpXNTBjeTRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbmRHOGdhR0YyWlNCdmQyNGdjSEp2Y0dWeWRIa2dKSHNnWlhod1pXTjBaV1FnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2daWGh3WldOMFpXUXBJSHRjYmlBZ0lDQWdJR2xtSUNnaFh5NXBjMDlpYW1WamRDaGhZM1IxWVd3cEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQW5kMkZ6SUh0N1lXTjBkV0ZzZlgwbk8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQjBhR2x6TG1aaGFXd2dQU0FuYjI1c2VTQm9ZV1FnZTNzZ1h5NXJaWGx6S0dGamRIVmhiQ2tnZlgwbk8xeHVYRzRnSUNBZ0lDQXZMeUJVVDBSUE9pQlBabVpsY2lCaVpYUjBaWElnWm1GcGJIVnlaU0J0WlhOellXZGxYRzRnSUNBZ0lDQjJZWElnWVhKbmN5QTlJRjh1ZEc5QmNuSmhlU2hoY21kMWJXVnVkSE1wTG5Oc2FXTmxLREVwTzF4dUlDQWdJQ0FnY21WMGRYSnVJRjh1WlhabGNua29ZWEpuY3l3Z1puVnVZM1JwYjI0Z0tIZ3BJSHNnY21WMGRYSnVJRjh1YUdGektHRmpkSFZoYkN3Z2VDazdJSDBwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCc2IyYzZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblJIVnRjSE1nZEdobElISmxZMlZwZG1Wa0lIWmhiSFZsSUhSdklIUm9aU0JqYjI1emIyeGxMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUc1MWJHd3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnWTI5dWMyOXNaUzVzYjJjb0oxdEJVMU5kSnl3Z1lXTjBkV0ZzS1R0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ1pIVnRjRG9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEVkVzF3Y3lCMGFHVWdjbVZqWldsMlpXUWdkbUZzZFdVZ2RHOGdkR2hsSUdOdmJuTnZiR1VnWVhCd2JIbHBibWNnZEdobElHZHBkbVZ1SUhSbGJYQnNZWFJsTGljc1hHNGdJQ0FnSUNBblRtOTBaVG9nVlhObElDUjdkR2hwYzMwZ2RHOGdhVzUwWlhKd2IyeGhkR1VnZEdobElIZG9iMnhsSUhaaGJIVmxMaWNzWEc0Z0lDQWdJQ0FuVTJWbE9pQm9kSFJ3Y3pvdkwyeHZaR0Z6YUM1amIyMHZaRzlqY3lOMFpXMXdiR0YwWlNkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklHNTFiR3dzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z2RIQnNLU0I3WEc0Z0lDQWdJQ0IyWVhJZ2NtVnpkV3gwSUQwZ2RYUnBiQzUwWlcxd2JHRjBaUzVqWVd4c0tHRmpkSFZoYkN3Z2RIQnNMQ0JoWTNSMVlXd3BPMXh1SUNBZ0lDQWdZMjl1YzI5c1pTNXNiMmNvY21WemRXeDBLVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnWkdWaWRXZG5aWEk2SUh0Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5TR0ZzZEhNZ2MyTnlhWEIwSUdWNFpXTjFkR2x2YmlCaWVTQjBjbWxuWjJWeWFXNW5JSFJvWlNCcGJuUmxjbUZqZEdsMlpTQmtaV0oxWjJkbGNpNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUJ1ZFd4c0xGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJR1JsWW5WbloyVnlPMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUhSaGNEb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMlp1SnlCZExGeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2REWVd4c2N5QjBhR1VnY0hKdmRtbGtaV1FnWm5WdVkzUnBiMjRnZDJsMGFDQjBhR1VnWTNWeWNtVnVkQ0IyWVd4MVpTQmhjeUJoY21kMWJXVnVkQzRuTEZ4dUlDQWdJQ0FnSjBsbUlIUm9aU0JtZFc1amRHbHZiaUJ5WlhSMWNtNXpJSE52YldWMGFHbHVaeUJrYVdabVpYSmxiblFnZEc4Z0tuVnVaR1ZtYVc1bFpDb2dkR2hsSnl4Y2JpQWdJQ0FnSUNkbGVIQnlaWE56YVc5dUlIZHBiR3dnWm05eWF5QjBieUJ2Y0dWeVlYUmxJRzl1SUhSb1pTQnlaWFIxY201bFpDQjJZV3gxWlM0bkxGeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKMk5oYkd3Z2UzdGhjbWN4ZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR1p1S1NCN1hHNGdJQ0FnSUNCMllYSWdjbVZ6ZFd4MElEMGdabTRvWVdOMGRXRnNLVHRjYmlBZ0lDQWdJR2xtSUNoMGVYQmxiMllnY21WemRXeDBJQ0U5UFNBbmRXNWtaV1pwYm1Wa0p5a2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvY21WemRXeDBLVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnYm05MGFXWjVPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0oxTnBiV2xzWVhJZ2RHOGdMblJoY0NncElHSjFkQ0JwZENCM2IyNWNYQ2QwSUhCaGMzTWdkR2hsSUdOMWNuSmxiblFnZG1Gc2RXVWdZWE1nWVhKbmRXMWxiblFzSnl4Y2JpQWdJQ0FnSUNkcGJuTjBaV0ZrSUdsMElIZHBiR3dnWW1VZ2NISnZkbWxrWldRZ1lYTWdkR2hsSUdCMGFHbHpZQ0JqYjI1MFpYaDBJSGRvWlc0Z2NHVnlabTl5YldsdVp5QjBhR1VuTEZ4dUlDQWdJQ0FnSjJOaGJHd3VJRlJvYVhNZ1lXeHNiM2R6SUdsMElIUnZJR0psSUhWelpXUWdkMmwwYUNCMFpYTjBJSEoxYm01bGNuTWdZR1J2Ym1WZ0lITjBlV3hsSUdOaGJHeGlZV05yY3k0bkxGeHVJQ0FnSUNBZ0owNXZkR1VnZEdoaGRDQnBkQ0IzYVd4c0lHNWxhWFJvWlhJZ2JYVjBZWFJsSUhSb1pTQjJZV3gxWlNCbGRtVnVJR2xtSUdsMElISmxkSFZ5Ym5NZ2MyOXRaWFJvYVc1bkxpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2R1YjNScFpua2dlM3RoY21jeGZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdadUtTQjdYRzRnSUNBZ0lDQm1iaTVqWVd4c0tHRmpkSFZoYkNrN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdjMmw2WlRvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RHYjNKcmN5QjBhR1VnWlhod1pXTjBZWFJwYjI0Z2RHOGdiM0JsY21GMFpTQnZiaUIwYUdVZ2MybDZaU0J2WmlCMGFHVWdZM1Z5Y21WdWRDQjJZV3gxWlM0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5aMlYwSUhOcGVtVW5MRnh1SUNBZ0lHWmhhV3c2SUNkdWIzUWdhR0Z6SUdFZ2JHVnVaM1JvT2lCN2V5QmhZM1IxWVd3Z2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUdsbUlDaGZMbWx6VDJKcVpXTjBLR0ZqZEhWaGJDa2dmSHdnWHk1cGMwRnljbUY1S0dGamRIVmhiQ2tnZkh3Z1h5NXBjMU4wY21sdVp5aGhZM1IxWVd3cEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2hmTG5OcGVtVW9ZV04wZFdGc0tTazdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUhCeWIzQTZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RyWlhrbkxDQW5jSEp2Y0dWeWRIa25JRjBzWEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owWnZjbXR6SUhSb1pTQmxlSEJsWTNSaGRHbHZiaUIwYnlCdmNHVnlZWFJsSUc5dUlHOXVaU0J2WmlCMGFHVWdkbUZzZFdVZ2NISnZjR1Z5ZEdsbGN5NG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuWjJWMElIQnliM0JsY25SNUlIdDdJR0Z5WnpFZ2ZYMG5MRnh1SUNBZ0lHWmhhV3c2SUNkM1lYTWdibTkwSUdadmRXNWtJRzl1SUh0N0lHRmpkSFZoYkNCOWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnYTJWNUtTQjdYRzRnSUNBZ0lDQnBaaUFvWHk1cGMwOWlhbVZqZENoaFkzUjFZV3dwS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hyWlhrZ2FXNGdZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJYVjBZWFJsS0dGamRIVmhiRnRyWlhsZEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhSb2FYTXVhMlY1Y3lBOUlGdGRPMXh1SUNBZ0lDQWdJQ0JmTG1admNrbHVLR0ZqZEhWaGJDd2dablZ1WTNScGIyNGdLSFlzSUdzcElIc2dkR2hwY3k1clpYbHpMbkIxYzJnb2F5azdJSDBzSUhSb2FYTXBPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdKM2RoY3lCdWIzUWdabTkxYm1RZ2FXNGdhMlY1Y3lCN2V5QnJaWGx6SUgxOUp6dGNiaUFnSUNBZ0lIMWNiaUFnSUNBZ0lISmxkSFZ5YmlBbloyOTBJSHQ3WVdOMGRXRnNmWDBuTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnWVhRNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZHBibVJsZUNjZ1hTeGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuVFhWMFlYUmxjeUIwYUdVZ2RtRnNkV1VnZEc4Z2IzQmxjbUYwWlNCdmJpQnZibVVnYjJZZ2RHaGxJR2x1WkdWNFpXUWdaV3hsYldWdWRITXVJRWxtSnl4Y2JpQWdJQ0FnSUNkdGRXeDBhWEJzWlNCcGJtUmxlR1Z6SUdGeVpTQndjbTkyYVdSbFpDQmhiaUJoY25KaGVTQnBjeUJqYjIxd2IzTmxaQ0IzYVhSb0lIUm9aVzB1Snl4Y2JpQWdJQ0FnSUNkT2IzUmxPaUJKZENCemRYQndiM0owY3lCdVpXZGhkR2wyWlNCcGJtUmxlR1Z6SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0oyZGxkQ0JwYm1SbGVDQWtleUJoY21kekxtcHZhVzRvWENJc0lGd2lLU0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQnBibVJsZUNrZ2UxeHVJQ0FnSUNBZ2FXWWdLQ0ZmTG1selFYSnlZWGtvWVdOMGRXRnNLU0FtSmlBaFh5NXBjMU4wY21sdVp5aGhZM1IxWVd3cEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQW5ibTkwSUdGdUlHRnljbUY1SUc5eUlHRWdjM1J5YVc1bk9pQWtlMkZqZEhWaGJIMG5PMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0IyWVhJZ2FXNWtaWGhsY3lBOUlGOHVkRzlCY25KaGVTaGhjbWQxYldWdWRITXBMbk5zYVdObEtERXBPMXh1SUNBZ0lDQWdkbUZ5SUdWc1pXMXpJRDBnVzEwN1hHNWNiaUFnSUNBZ0lHWnZjaUFvZG1GeUlHa2dQU0F3T3lCcElEd2dhVzVrWlhobGN5NXNaVzVuZEdnN0lHa3JLeWtnZTF4dUlDQWdJQ0FnSUNCMllYSWdhV1I0SUQwZ2FXNWtaWGhsYzF0cFhUdGNibHh1SUNBZ0lDQWdJQ0JwWkhnZ1BTQnBaSGdnUENBd0lEOGdZV04wZFdGc0xteGxibWQwYUNBcklHbGtlQ0E2SUdsa2VEdGNiaUFnSUNBZ0lDQWdhV1lnS0dsa2VDQThJREFnZkh3Z2FXUjRJRDQ5SUdGamRIVmhiQzVzWlc1bmRHZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnYVdSNElDc2dKeUJ2ZFhRZ2IyWWdZbTkxYm1SeklHWnZjaUI3ZTJGamRIVmhiSDE5Snp0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR1ZzWlcxekxuQjFjMmdvWVdOMGRXRnNXMmxrZUYwcE8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9YRzRnSUNBZ0lDQWdJR1ZzWlcxekxteGxibWQwYUNBOVBUMGdNU0EvSUdWc1pXMXpXekJkSURvZ1pXeGxiWE5jYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUd0bGVYTTZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblRYVjBZWFJsY3lCMGFHVWdkbUZzZFdVZ2RHOGdiM0JsY21GMFpTQnZiaUJwZEhNZ2JHbHpkQ0J2WmlCdmQyNGdhMlY1Y3k0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5aMlYwSUd0bGVYTW5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoY2JpQWdJQ0FnSUNBZ1h5NXJaWGx6S0dGamRIVmhiQ2xjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0IyWVd4MVpYTTZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblRYVjBZWFJsY3lCMGFHVWdkbUZzZFdVZ2RHOGdiM0JsY21GMFpTQnZiaUJwZEhNZ2JHbHpkQ0J2WmlCMllXeDFaWE1uWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbloyVjBJSFpoYkhWbGN5Y3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJYVjBZWFJsS0Z4dUlDQWdJQ0FnSUNCZkxuWmhiSFZsY3loaFkzUjFZV3dwWEc0Z0lDQWdJQ0FwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCemJHbGpaVG9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEZlSFJ5WVdOMGN5QmhJSEJ2Y25ScGIyNGdabkp2YlNCMGFHVWdkbUZzZFdVdUoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKM05zYVdObEtIdDdZV04wZFdGc2ZYMHNJQ1I3WVhKbk1TQjhmQ0F3ZlNrbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJSE4wWVhKMExDQmxibVFwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoY2JpQWdJQ0FnSUNBZ1h5NTBiMEZ5Y21GNUtHRmpkSFZoYkNrdWMyeHBZMlVvYzNSaGNuUXNJR1Z1WkNsY2JpQWdJQ0FnSUNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lHWnBiSFJsY2pvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RKZEdWeVlYUmxjeUJ2ZG1WeUlHVnNaVzFsYm5SeklHOW1JSFJvWlNCamIyeHNaV04wYVc5dUxDQm1iM0pyYVc1bklIUm9aU0JsZUhCbFkzUmhkR2x2YmlCMGJ5Y3NYRzRnSUNBZ0lDQW5iM0JsY21GMFpTQnZiaUJoYmlCaGNuSmhlU0IzYVhSb0lHRnNiQ0IwYUdVZ1pXeGxiV1Z1ZEhNZ1ptOXlJSGRvYVdOb0lIUm9aU0JqWVd4c1ltRmpheUJ5WlhSMWNtNWxaQ2NzWEc0Z0lDQWdJQ0FuZEhKMWRHaDVJR1p2Y2k0bkxGeHVJQ0FnSUNBZ0oxTmxaVG9nYUhSMGNITTZMeTlzYjJSaGMyZ3VZMjl0TDJSdlkzTWpabWxzZEdWeUoxeHVJQ0FnSUYwc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2dZMkZzYkdKaFkyc3NJSFJvYVhOQmNtY3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2hjYmlBZ0lDQWdJQ0FnWHk1bWFXeDBaWElvWVdOMGRXRnNMQ0JqWVd4c1ltRmpheXdnZEdocGMwRnlaeWxjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0J5WldwbFkzUTZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblNYUmxjbUYwWlhNZ2IzWmxjaUJsYkdWdFpXNTBjeUJ2WmlCamIyeHNaV04wYVc5dUxDQm1iM0pyYVc1bklIUm9aU0JsZUhCbFkzUmhkR2x2YmlCMGJ5QnZjR1Z5WVhSbEp5eGNiaUFnSUNBZ0lDZHZiaUJoYmlCaGNuSmhlU0IzYVhSb0lHRnNiQ0IwYUdVZ1pXeGxiV1Z1ZEhNZ1ptOXlJSGRvYVdOb0lIUm9aU0JqWVd4c1ltRmpheUJ5WlhSMWNtNWxaQ0JtWVd4emVTY3NYRzRnSUNBZ0lDQW5abTl5SUNoMGFHVWdiM0J3YjNOcGRHVWdiMllnTG1acGJIUmxjaWt1Snl4Y2JpQWdJQ0FnSUNkVFpXVTZJR2gwZEhCek9pOHZiRzlrWVhOb0xtTnZiUzlrYjJOekkzSmxhbVZqZENkY2JpQWdJQ0JkTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lHTmhiR3hpWVdOckxDQjBhR2x6UVhKbktTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9YRzRnSUNBZ0lDQWdJRjh1Y21WcVpXTjBLR0ZqZEhWaGJDd2dZMkZzYkdKaFkyc3NJSFJvYVhOQmNtY3BYRzRnSUNBZ0lDQXBPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0IzYUdWeVpUb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkUVpYSm1iM0p0Y3lCaElHUmxaWEFnWTI5dGNHRnlhWE52YmlCdlppQmxZV05vSUdWc1pXMWxiblFnYVc0Z1lTQmpiMnhzWldOMGFXOXVJSFJ2SUhSb1pTQm5hWFpsYmljc1hHNGdJQ0FnSUNBbmNISnZjR1Z5ZEdsbGN5QnZZbXBsWTNRc0lHWnZjbXRwYm1jZ2RHaGxJR1Y0Y0dWamRHRjBhVzl1SUhSdklHOXdaWEpoZEdVZ2IyNGdZVzRnWVhKeVlYa2diMllnWVd4c0p5eGNiaUFnSUNBZ0lDZGxiR1Z0Wlc1MGN5QjBhR0YwSUdoaGRtVWdaWEYxYVhaaGJHVnVkQ0J3Y205d1pYSjBlU0IyWVd4MVpYTXVKeXhjYmlBZ0lDQWdJQ2RUWldVNklHaDBkSEJ6T2k4dmJHOWtZWE5vTG1OdmJTOWtiMk56STNkb1pYSmxKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nSjNkb1pYSmxJSHQ3WVhKbk1YMTlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCd2NtOXdjeWtnZTF4dUlDQWdJQ0FnYVdZZ0tDRmZMbWx6VUd4aGFXNVBZbXBsWTNRb2NISnZjSE1wS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBbmNISnZjSE1nYVhNZ2JtOTBJR0Z1SUc5aWFtVmpkQ2M3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWQyaGxjbVVvWVdOMGRXRnNMQ0J3Y205d2N5bGNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJRzFoY0RvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RHYjNKcmN5QjBhR1VnWlhod1pXTjBZWFJwYjI0Z2RHOGdiM0JsY21GMFpTQnZiaUJoYmlCaGNuSmhlU0JvYjJ4a2FXNW5JSFJvWlNCeVpYTjFiSFJ6SUc5bUp5eGNiaUFnSUNBZ0lDZHBiblp2YTJsdVp5QjBhR1VnWTJGc2JHSmhZMnNnWm05eUlHVmhZMmdnWld4bGJXVnVkQ0JwYmlCMGFHVWdZM1Z5Y21WdWRDQmpiMnhzWldOMGFXOXVMaWNzWEc0Z0lDQWdJQ0FuVTJWbE9pQm9kSFJ3Y3pvdkwyeHZaR0Z6YUM1amIyMHZaRzlqY3lOdFlYQW5YRzRnSUNBZ1hTeGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JqWVd4c1ltRmpheXdnZEdocGMwRnlaeWtnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJYVjBZWFJsS0Z4dUlDQWdJQ0FnSUNCZkxtMWhjQ2hoWTNSMVlXd3NJR05oYkd4aVlXTnJMQ0IwYUdselFYSm5LVnh1SUNBZ0lDQWdLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnYldWMGFHOWtPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owWnZjbXR6SUhSb1pTQmxlSEJsWTNSaGRHbHZiaUIwYnlCdmNHVnlZWFJsSUc5dUlIUm9aU0J5WlhOMWJIUWdiMllnYVc1MmIydHBibWNnZEdobElHNWhiV1ZrSnl4Y2JpQWdJQ0FnSUNkdFpYUm9iMlFnYjI0Z2RHaGxJSE4xWW1wbFkzUWdkbUZzZFdVdUp5eGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJRndpYldWMGFHOWtJQzRrZTJGeVp6RjlLQ2xjSWl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQnRaWFJvYjJRc0lHRnlaeWtnZTF4dUlDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCaFkzUjFZV3hiYldWMGFHOWtYU0FoUFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdKeVI3WVhKbk1YMGdhWE1nYm05MElHRWdiV1YwYUc5a0lHbHVJSHQ3WVdOMGRXRnNmWDBuTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCMllYSWdZWEpuY3lBOUlGOHVkRzlCY25KaGVTaGhjbWQxYldWdWRITXBMbk5zYVdObEtESXBPMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLRnh1SUNBZ0lDQWdJQ0JoWTNSMVlXeGJiV1YwYUc5a1hTNWhjSEJzZVNoaFkzUjFZV3dzSUdGeVozTXBYRzRnSUNBZ0lDQXBPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0JwYm5admEyVTZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblJtOXlhM01nZEdobElHVjRjR1ZqZEdGMGFXOXVJSFJ2SUc5d1pYSmhkR1VnYjI0Z1lXNGdZWEp5WVhrZ2FHOXNaR2x1WnlCMGFHVWdjbVZ6ZFd4MGN5QnZaaWNzWEc0Z0lDQWdJQ0FuYVc1MmIydHBibWNnZEdobElHMWxkR2h2WkNCdVlXMWxaQ0JpZVNCMGFHVWdZWEpuZFcxbGJuUWdabTl5SUdWaFkyZ2daV3hsYldWdWRDQnBiaUIwYUdVbkxGeHVJQ0FnSUNBZ0oyTjFjbkpsYm5RZ1kyOXNiR1ZqZEdsdmJpNG5MRnh1SUNBZ0lDQWdKMU5sWlRvZ2FIUjBjSE02THk5c2IyUmhjMmd1WTI5dEwyUnZZM01qYVc1MmIydGxKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nWENKcGJuWnZhMlVnTGlSN1lYSm5NWDBvS1Z3aUxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJRzFsZEdodlpDd2dZWEpuS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1hHNGdJQ0FnSUNBZ0lGOHVhVzUyYjJ0bExtRndjR3g1S0Y4c0lHRnlaM1Z0Wlc1MGN5bGNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJSEJzZFdOck9pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjAxMWRHRjBaWE1nZEdobElIWmhiSFZsSUhSdklHSmxJSFJvWlNCdmJtVWdiMllnZEdobElITndaV05wWm1saklIQnliM0JsY25SNUlHWnZjaUJoYkd3Z1pXeGxiV1Z1ZEhNbkxGeHVJQ0FnSUNBZ0oybHVJSFJvWlNCamRYSnlaVzUwSUdOdmJHeGxZM1JwYjI0dUp5eGNiaUFnSUNBZ0lDZFRaV1U2SUdoMGRIQnpPaTh2Ykc5a1lYTm9MbU52YlM5a2IyTnpJM0JzZFdOckoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKM0JzZFdOcktDQjdlMkZ5WnpGOWZTQXBKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCd2NtOXdLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWNHeDFZMnNvWVdOMGRXRnNMQ0J3Y205d0tWeHVJQ0FnSUNBZ0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdabWx5YzNRNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZG9aV0ZrSnlCZExGeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RVVDBSUEp5eGNiaUFnSUNBZ0lDZFRaV1U2SUdoMGRIQnpPaTh2Ykc5a1lYTm9MbU52YlM5a2IyTnpJMlpwY25OMEoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKMmRsZENCbWFYSnpkQ0JsYkdWdFpXNTBKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1hHNGdJQ0FnSUNBZ0lGOHVhR1ZoWkNoaFkzUjFZV3dwWEc0Z0lDQWdJQ0FwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnYkdGemREb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkVVQwUlBKeXhjYmlBZ0lDQWdJQ2RUWldVNklHaDBkSEJ6T2k4dmJHOWtZWE5vTG1OdmJTOWtiMk56STJ4aGMzUW5YRzRnSUNBZ1hTeGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWJHRnpkQ2hoWTNSMVlXd3BYRzRnSUNBZ0lDQXBPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdjbVZ6ZERvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0ozUmhhV3duSUYwc1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMVJQUkU4bkxGeHVJQ0FnSUNBZ0oxTmxaVG9nYUhSMGNITTZMeTlzYjJSaGMyZ3VZMjl0TDJSdlkzTWpjbVZ6ZENkY2JpQWdJQ0JkTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTExZEdGMFpTaGNiaUFnSUNBZ0lDQWdYeTUwWVdsc0tHRmpkSFZoYkNsY2JpQWdJQ0FnSUNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lHMXBiam9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZE5kWFJoZEdWeklIUm9aU0J6ZFdKcVpXTjBJSFJ2SUdKbElIUm9aU0J0YVc1cGJYVnRJSFpoYkhWbElHWnZkVzVrSUc5dUlIUm9aU0JqYjJ4c1pXTjBhVzl1TGljc1hHNGdJQ0FnSUNBblUyVmxPaUJvZEhSd2N6b3ZMMnh2WkdGemFDNWpiMjB2Wkc5amN5TnRhVzRuWEc0Z0lDQWdYU3hjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1hHNGdJQ0FnSUNBZ0lGOHViV2x1S0dGamRIVmhiQ2xjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0J0WVhnNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuVFhWMFlYUmxjeUIwYUdVZ2MzVmlhbVZqZENCMGJ5QmlaU0IwYUdVZ2JXRjRhVzExYlNCMllXeDFaU0JtYjNWdVpDQnZiaUIwYUdVZ1kyOXNiR1ZqZEdsdmJpNG5MRnh1SUNBZ0lDQWdKMU5sWlRvZ2FIUjBjSE02THk5c2IyUmhjMmd1WTI5dEwyUnZZM01qYldGNEoxeHVJQ0FnSUYwc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLRnh1SUNBZ0lDQWdJQ0JmTG0xaGVDaGhZM1IxWVd3cFhHNGdJQ0FnSUNBcE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQnpiM0owT2lCN1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMDExZEdGMFpYTWdkR2hsSUhaaGJIVmxJSFJ2SUdKbElITnZjblJsWkNCcGJpQmhjMk5sYm1ScGJtY2diM0prWlhJdUp5eGNiaUFnSUNBZ0lDZFRaV1U2SUdoMGRIQnpPaTh2Ykc5a1lYTm9MbU52YlM5a2IyTnpJM052Y25SQ2VTZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2R6YjNKMEp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JqWVd4c1ltRmpheXdnZEdocGMwRnlaeWtnZTF4dUlDQWdJQ0FnTHk4Z1FXeHNiM2NnZEdobElIVnpaU0J2WmlCbGVIQnlaWE56YVc5dWN5QmhjeUJqWVd4c1ltRmphM05jYmlBZ0lDQWdJR2xtSUNoallXeHNZbUZqYXlCcGJuTjBZVzVqWlc5bUlHRnpjeTVEYUdGcGJpa2dlMXh1SUNBZ0lDQWdJQ0JqWVd4c1ltRmpheUE5SUdOaGJHeGlZV05yTG5KbGMzVnNkRHRjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJYVjBZWFJsS0Z4dUlDQWdJQ0FnSUNCZkxuTnZjblJDZVNoaFkzUjFZV3dzSUdOaGJHeGlZV05yTENCMGFHbHpRWEpuS1Z4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2MzUnZjbVU2SUh0Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5TR1ZzY0dWeUlIUnZJSE4wYjNKbElHRWdjbVZtWlhKbGJtTmxJSFJ2SUhSb1pTQmpkWEp5Wlc1MElIWmhiSFZsSUdKbGFXNW5JR1YyWVd4MVlYUmxaQ0JwYmlCMGFHVW5MRnh1SUNBZ0lDQWdKMlY0Y0hKbGMzTnBiMjRnYVc0Z2MyOXRaU0J2ZEdobGNpQnZZbXBsWTNRdUlFbDBJR1Y0Y0dWamRITWdZU0IwWVhKblpYUWdiMkpxWldOMElHRnVaQ0J2Y0hScGIyNWhiR3g1Snl4Y2JpQWdJQ0FnSUNkMGFHVWdibUZ0WlNCdlppQmhJSEJ5YjNCbGNuUjVMaUJKWmlCMFlYSm5aWFFnYVhNZ1lTQm1kVzVqZEdsdmJpQnBkRnhjSjJ4c0lISmxZMlZwZG1VZ2RHaGxJSFpoYkhWbEp5eGNiaUFnSUNBZ0lDZDFjMmx1WnlCZ2NISnZjR0FnWVhNZ2RHaHBjeUJqYjI1MFpYaDBMaUJKWmlCZ2NISnZjR0FnYVhNZ2JtOTBJSEJ5YjNacFpHVmtJR0Z1WkNCZ2RHRnlaMlYwWUNCcGN5QmhiaWNzWEc0Z0lDQWdJQ0FuWVhKeVlYa2dkR2hsSUhaaGJIVmxJSGRwYkd3Z1ltVWdjSFZ6YUdWa0lIUnZJR2wwTGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZHpkRzl5WlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2dkR0Z5WjJWMExDQndjbTl3S1NCN1hHNGdJQ0FnSUNCcFppQW9YeTVwYzBaMWJtTjBhVzl1S0hSaGNtZGxkQ2twSUh0Y2JpQWdJQ0FnSUNBZ2RHRnlaMlYwTG1OaGJHd29jSEp2Y0N3Z1lXTjBkV0ZzS1R0Y2JpQWdJQ0FnSUgwZ1pXeHpaU0JwWmlBb2NISnZjQ0E5UFQwZ2RXNWtaV1pwYm1Wa0tTQjdYRzRnSUNBZ0lDQWdJR2xtSUNoZkxtbHpRWEp5WVhrb2RHRnlaMlYwS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJSFJoY21kbGRDNXdkWE5vS0dGamRIVmhiQ2s3WEc0Z0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUNkd2NtOXdJSFZ1WkdWbWFXNWxaQ0JoYm1RZ2RHRnlaMlYwSUdseklHNXZkQ0JoYmlCaGNuSmhlU0J2Y2lCaElHWjFibU4wYVc5dU9pQjdlMkZ5WnpGOWZTYzdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJSDBnWld4elpTQnBaaUFvWHk1cGMwOWlhbVZqZENoMFlYSm5aWFFwS1NCN1hHNGdJQ0FnSUNBZ0lIUmhjbWRsZEZ0d2NtOXdYU0E5SUdGamRIVmhiRHRjYmlBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQW5kR0Z5WjJWMElHbHpJRzV2ZENCaGJpQnZZbXBsWTNRNklIdDdZWEpuTVgxOUp6dGNiaUFnSUNBZ0lIMWNibHh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lDQWdmVnh1SUNCOVhHNWNibjBwTzF4dUlsMTkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xuXG5cbi8vIEhlbHBlciBmYWN0b3J5IGZvciB0aGVuYWJsZSBjYWxsYmFja3NcbmZ1bmN0aW9uIHJlc3VtZSAocmVzb2x2ZXIsIHJlc3VsdCkge1xuICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmVzb2x2ZXIucmVzdW1lKHZhbHVlLCByZXN1bHQpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpc1Byb21pc2UgKHZhbHVlKSB7XG4gIHZhciB0aGVuID0gdmFsdWUgJiYgdmFsdWUudGhlbjtcbiAgcmV0dXJuIHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nO1xufVxuXG5cbi8vIFByb21pc2UgcmVsYXRlZCBtYXRjaGVyc1xuYXNzLnJlZ2lzdGVyKHtcblxuICBwcm9taXNlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1ZlcmlmaWVzIHRoYXQgdGhlIHZhbHVlIGlzIGEgcHJvbWlzZSAoUHJvbWlzZS9BKykgYnV0IGRvZXMgbm90IGF0dGFjaCcsXG4gICAgICAndGhlIGV4cHJlc3Npb24gdG8gaXRzIHJlc29sdXRpb24gbGlrZSBgcmVzb2x2ZXNgIG9yIGByZWplY3RzYCwgaW5zdGVhZCcsXG4gICAgICAndGhlIG9yaWdpbmFsIHByb21pc2UgdmFsdWUgaXMga2VwdCBhcyB0aGUgc3ViamVjdCBmb3IgdGhlIGZvbGxvd2luZycsXG4gICAgICAnZXhwZWN0YXRpb25zLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhIHByb21pc2UnLFxuICAgIGZhaWw6ICdnb3QgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBpc1Byb21pc2UoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVzb2x2ZXM6IHtcbiAgICBhbGlhc2VzOiBbICdyZXNvbHZlZCcsICdmdWxmaWxsZWQnLCAnZnVsZmlsbCcsICdldmVudHVhbGx5JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBdHRhY2ggdGhlIG1hdGNoZXIgdG8gYSBwcm9taXNlIHZhbHVlIChQcm9taXNlcy9BKykgdG8gY29udGludWUnLFxuICAgICAgJ2FwcGx5aW5nIHRoZSBjaGFpbiBvZiBtYXRjaGVycyBvbmNlIHRoZSBwcm9taXNlIGhhcyBiZWVuIHJlc29sdmVkLCcsXG4gICAgICAnbXV0YXRpbmcgdGhlIHZhbHVlIHRvIHRoZSByZXNvbHZlZCBvbmUuJyxcbiAgICAgICdJdCB3aWxsIGZhaWwgaWYgdGhlIHZhbHVlIGlzIG5vdCBhIHByb21pc2UgKG5vIC50aGVuIG1ldGhvZCkgb3IgdGhlJyxcbiAgICAgICdwcm9taXNlIGlzIGFjdHVhbGx5IHJlamVjdGVkLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhIHJlc29sdmVkIHByb21pc2UnLFxuICAgIGZhaWw6ICd3YXMgcmVqZWN0ZWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghaXNQcm9taXNlKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBwcm9taXNlOiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBFbnRlciBhc3luYyBtb2RlXG4gICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG5cbiAgICAgICAgLy8gQXR0YWNoIHRvIHRoZSBwcm9taXNlIHNvIHdlIGdldCBub3RpZmllZCB3aGVuIGl0J3MgcmVzb2x2ZWQuXG4gICAgICAgIGFjdHVhbC50aGVuKFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciksXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyLCBmYWxzZSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBSaWdodCBub3cgd2UgZG9uJ3Qga25vdyBpZiB0aGUgZXhwcmVzc2lvbiBpcyB2YWxpZFxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgYmVjb21lOiB7XG4gICAgYWxpYXNlczogWyAnYmVjb21lcycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnV29ya3MgdGhlIHNhbWUgYXMgLnJlc29sdmVzIGJ1dCBhZGRpdGlvbmFsbHkgd2lsbCBkbyBhIGNvbXBhcmlzb24gYmV0d2VlbicsXG4gICAgICAndGhlIHJlc29sdmVkIHZhbHVlIGZyb20gdGhlIHByb21pc2UgYW5kIHRoZSBleHBlY3RlZCBvbmUuIEl0IGNhbiBiZSBzZWVuJyxcbiAgICAgICdhcyBhIHNob3J0Y3V0IGZvciBgLnJlc29sdmVzLmVxKGV4cGVjdGVkKWAuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlY29tZSB7eyBleHBlY3RlZCB9fScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gTWFrZSBpdCBhc3luY1xuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIC8vIEF0dGFjaCB0byB0aGUgcHJvbWlzZSByZXNvbHV0aW9uXG4gICAgICAgIGFjdHVhbC50aGVuKFxuICAgICAgICAgIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgLy8gV2hlbiB0aGUgZXF1YWxpdHkgc3VjY2VlZHMganVzdCBrZWVwIHJlc29sdmluZ1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IF8uaXNFcXVhbCh2YWx1ZSwgZXhwZWN0ZWQpID8gdW5kZWZpbmVkIDogZmFsc2U7XG4gICAgICAgICAgICByZXNvbHZlci5yZXN1bWUodmFsdWUsIHJlc3VsdCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIsIGZhbHNlKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICByZWplY3RzOiB7XG4gICAgYWxpYXNlczogWyAncmVqZWN0ZWQnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0F0dGFjaCB0aGUgbWF0Y2hlciB0byBhIHByb21pc2UgdmFsdWUgKFByb21pc2VzL0ErKSB0byBjb250aW51ZSBhcHBseWluZycsXG4gICAgICAndGhlIGNoYWluIG9mIG1hdGNoZXJzIG9uY2UgdGhlIHByb21pc2UgaGFzIGJlZW4gcmVqZWN0ZWQsIG11dGF0aW5nIHRoZScsXG4gICAgICAndmFsdWUgdG8gYmVjb21lIHRoZSByZWplY3RlZCBlcnJvci4nLFxuICAgICAgJ0l0IHdpbGwgZmFpbCBpZiB0aGUgdmFsdWUgaXMgbm90IGEgcHJvbWlzZSAobm8gLnRoZW4gbWV0aG9kKSBvciB0aGUnLFxuICAgICAgJ3Byb21pc2UgaXMgYWN0dWFsbHkgZnVsZmlsbGVkLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhIHJlamVjdGVkIHByb21pc2UnLFxuICAgIGZhaWw6ICd3YXMgZnVsZmlsbGVkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoIWlzUHJvbWlzZShhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiAnaXMgbm90IGEgcHJvbWlzZToge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gRW50ZXIgYXN5bmMgbW9kZVxuICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuXG4gICAgICAgIGFjdHVhbC50aGVuKFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpLFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlcilcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBSaWdodCBub3cgd2UgZG9uJ3Qga25vdyBpZiB0aGUgZXhwcmVzc2lvbiBpcyB2YWxpZFxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOXRZWFJqYUdWeWN5OXdjbTl0YVhObExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTSXNJbVpwYkdVaU9pSm5aVzVsY21GMFpXUXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpZG1GeUlGOGdQU0FvZEhsd1pXOW1JSGRwYm1SdmR5QWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JSGRwYm1SdmR5NWZJRG9nZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JR2RzYjJKaGJDNWZJRG9nYm5Wc2JDazdYRzVjYm5aaGNpQmhjM01nUFNCeVpYRjFhWEpsS0NjdUxpOWhjM01uS1R0Y2JseHVYRzR2THlCSVpXeHdaWElnWm1GamRHOXllU0JtYjNJZ2RHaGxibUZpYkdVZ1kyRnNiR0poWTJ0elhHNW1kVzVqZEdsdmJpQnlaWE4xYldVZ0tISmxjMjlzZG1WeUxDQnlaWE4xYkhRcElIdGNiaUFnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2gyWVd4MVpTa2dlMXh1SUNBZ0lISmxjMjlzZG1WeUxuSmxjM1Z0WlNoMllXeDFaU3dnY21WemRXeDBLVHRjYmlBZ2ZUdGNibjFjYmx4dVpuVnVZM1JwYjI0Z2FYTlFjbTl0YVhObElDaDJZV3gxWlNrZ2UxeHVJQ0IyWVhJZ2RHaGxiaUE5SUhaaGJIVmxJQ1ltSUhaaGJIVmxMblJvWlc0N1hHNGdJSEpsZEhWeWJpQjBlWEJsYjJZZ2RHaGxiaUE5UFQwZ0oyWjFibU4wYVc5dUp6dGNibjFjYmx4dVhHNHZMeUJRY205dGFYTmxJSEpsYkdGMFpXUWdiV0YwWTJobGNuTmNibUZ6Y3k1eVpXZHBjM1JsY2loN1hHNWNiaUFnY0hKdmJXbHpaVG9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZFdaWEpwWm1sbGN5QjBhR0YwSUhSb1pTQjJZV3gxWlNCcGN5QmhJSEJ5YjIxcGMyVWdLRkJ5YjIxcGMyVXZRU3NwSUdKMWRDQmtiMlZ6SUc1dmRDQmhkSFJoWTJnbkxGeHVJQ0FnSUNBZ0ozUm9aU0JsZUhCeVpYTnphVzl1SUhSdklHbDBjeUJ5WlhOdmJIVjBhVzl1SUd4cGEyVWdZSEpsYzI5c2RtVnpZQ0J2Y2lCZ2NtVnFaV04wYzJBc0lHbHVjM1JsWVdRbkxGeHVJQ0FnSUNBZ0ozUm9aU0J2Y21sbmFXNWhiQ0J3Y205dGFYTmxJSFpoYkhWbElHbHpJR3RsY0hRZ1lYTWdkR2hsSUhOMVltcGxZM1FnWm05eUlIUm9aU0JtYjJ4c2IzZHBibWNuTEZ4dUlDQWdJQ0FnSjJWNGNHVmpkR0YwYVc5dWN5NG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdZU0J3Y205dGFYTmxKeXhjYmlBZ0lDQm1ZV2xzT2lBbloyOTBJQ1I3SUdGamRIVmhiQ0I5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2FYTlFjbTl0YVhObEtHRmpkSFZoYkNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lISmxjMjlzZG1Wek9pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5jbVZ6YjJ4MlpXUW5MQ0FuWm5Wc1ptbHNiR1ZrSnl3Z0oyWjFiR1pwYkd3bkxDQW5aWFpsYm5SMVlXeHNlU2NnWFN4Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5RWFIwWVdOb0lIUm9aU0J0WVhSamFHVnlJSFJ2SUdFZ2NISnZiV2x6WlNCMllXeDFaU0FvVUhKdmJXbHpaWE12UVNzcElIUnZJR052Ym5ScGJuVmxKeXhjYmlBZ0lDQWdJQ2RoY0hCc2VXbHVaeUIwYUdVZ1kyaGhhVzRnYjJZZ2JXRjBZMmhsY25NZ2IyNWpaU0IwYUdVZ2NISnZiV2x6WlNCb1lYTWdZbVZsYmlCeVpYTnZiSFpsWkN3bkxGeHVJQ0FnSUNBZ0oyMTFkR0YwYVc1bklIUm9aU0IyWVd4MVpTQjBieUIwYUdVZ2NtVnpiMngyWldRZ2IyNWxMaWNzWEc0Z0lDQWdJQ0FuU1hRZ2QybHNiQ0JtWVdsc0lHbG1JSFJvWlNCMllXeDFaU0JwY3lCdWIzUWdZU0J3Y205dGFYTmxJQ2h1YnlBdWRHaGxiaUJ0WlhSb2IyUXBJRzl5SUhSb1pTY3NYRzRnSUNBZ0lDQW5jSEp2YldselpTQnBjeUJoWTNSMVlXeHNlU0J5WldwbFkzUmxaQzRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbmRHOGdZbVVnWVNCeVpYTnZiSFpsWkNCd2NtOXRhWE5sSnl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUhKbGFtVmpkR1ZrSnl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnBaaUFvSVdselVISnZiV2x6WlNoaFkzUjFZV3dwS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBbmFYTWdibTkwSUdFZ2NISnZiV2x6WlRvZ2UzdGhZM1IxWVd4OWZTYzdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSEpsZEhWeWJpQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpYSXBJSHRjYmlBZ0lDQWdJQ0FnTHk4Z1JXNTBaWElnWVhONWJtTWdiVzlrWlZ4dUlDQWdJQ0FnSUNCeVpYTnZiSFpsY2k1d1lYVnpaU2dwTzF4dVhHNGdJQ0FnSUNBZ0lDOHZJRUYwZEdGamFDQjBieUIwYUdVZ2NISnZiV2x6WlNCemJ5QjNaU0JuWlhRZ2JtOTBhV1pwWldRZ2QyaGxiaUJwZENkeklISmxjMjlzZG1Wa0xseHVJQ0FnSUNBZ0lDQmhZM1IxWVd3dWRHaGxiaWhjYmlBZ0lDQWdJQ0FnSUNCeVpYTjFiV1VvY21WemIyeDJaWElwTEZ4dUlDQWdJQ0FnSUNBZ0lISmxjM1Z0WlNoeVpYTnZiSFpsY2l3Z1ptRnNjMlVwWEc0Z0lDQWdJQ0FnSUNrN1hHNWNiaUFnSUNBZ0lDQWdMeThnVW1sbmFIUWdibTkzSUhkbElHUnZiaWQwSUd0dWIzY2dhV1lnZEdobElHVjRjSEpsYzNOcGIyNGdhWE1nZG1Gc2FXUmNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpEdGNiaUFnSUNBZ0lIMDdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJR0psWTI5dFpUb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMkpsWTI5dFpYTW5JRjBzWEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0oxZHZjbXR6SUhSb1pTQnpZVzFsSUdGeklDNXlaWE52YkhabGN5QmlkWFFnWVdSa2FYUnBiMjVoYkd4NUlIZHBiR3dnWkc4Z1lTQmpiMjF3WVhKcGMyOXVJR0psZEhkbFpXNG5MRnh1SUNBZ0lDQWdKM1JvWlNCeVpYTnZiSFpsWkNCMllXeDFaU0JtY205dElIUm9aU0J3Y205dGFYTmxJR0Z1WkNCMGFHVWdaWGh3WldOMFpXUWdiMjVsTGlCSmRDQmpZVzRnWW1VZ2MyVmxiaWNzWEc0Z0lDQWdJQ0FuWVhNZ1lTQnphRzl5ZEdOMWRDQm1iM0lnWUM1eVpYTnZiSFpsY3k1bGNTaGxlSEJsWTNSbFpDbGdMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaV052YldVZ2Uzc2daWGh3WldOMFpXUWdmWDBuTEZ4dUlDQWdJR1poYVd3NklDZDNZWE1nZTNzZ1lXTjBkV0ZzSUgxOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tDRnBjMUJ5YjIxcGMyVW9ZV04wZFdGc0tTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdKMmx6SUc1dmRDQmhJSEJ5YjIxcGMyVTZJSHQ3WVdOMGRXRnNmWDBuTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCeVpYUjFjbTRnWm5WdVkzUnBiMjRnS0hKbGMyOXNkbVZ5S1NCN1hHNGdJQ0FnSUNBZ0lDOHZJRTFoYTJVZ2FYUWdZWE41Ym1OY2JpQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNHRjFjMlVvS1R0Y2JseHVJQ0FnSUNBZ0lDQXZMeUJCZEhSaFkyZ2dkRzhnZEdobElIQnliMjFwYzJVZ2NtVnpiMngxZEdsdmJseHVJQ0FnSUNBZ0lDQmhZM1IxWVd3dWRHaGxiaWhjYmlBZ0lDQWdJQ0FnSUNCbWRXNWpkR2x2YmlBb2RtRnNkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUZkb1pXNGdkR2hsSUdWeGRXRnNhWFI1SUhOMVkyTmxaV1J6SUdwMWMzUWdhMlZsY0NCeVpYTnZiSFpwYm1kY2JpQWdJQ0FnSUNBZ0lDQWdJSFpoY2lCeVpYTjFiSFFnUFNCZkxtbHpSWEYxWVd3b2RtRnNkV1VzSUdWNGNHVmpkR1ZrS1NBL0lIVnVaR1ZtYVc1bFpDQTZJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y21WemRXMWxLSFpoYkhWbExDQnlaWE4xYkhRcE8xeHVJQ0FnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUNBZ2NtVnpkVzFsS0hKbGMyOXNkbVZ5TENCbVlXeHpaU2xjYmlBZ0lDQWdJQ0FnS1R0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa08xeHVJQ0FnSUNBZ2ZUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdjbVZxWldOMGN6b2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKM0psYW1WamRHVmtKeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEJkSFJoWTJnZ2RHaGxJRzFoZEdOb1pYSWdkRzhnWVNCd2NtOXRhWE5sSUhaaGJIVmxJQ2hRY205dGFYTmxjeTlCS3lrZ2RHOGdZMjl1ZEdsdWRXVWdZWEJ3YkhscGJtY25MRnh1SUNBZ0lDQWdKM1JvWlNCamFHRnBiaUJ2WmlCdFlYUmphR1Z5Y3lCdmJtTmxJSFJvWlNCd2NtOXRhWE5sSUdoaGN5QmlaV1Z1SUhKbGFtVmpkR1ZrTENCdGRYUmhkR2x1WnlCMGFHVW5MRnh1SUNBZ0lDQWdKM1poYkhWbElIUnZJR0psWTI5dFpTQjBhR1VnY21WcVpXTjBaV1FnWlhKeWIzSXVKeXhjYmlBZ0lDQWdJQ2RKZENCM2FXeHNJR1poYVd3Z2FXWWdkR2hsSUhaaGJIVmxJR2x6SUc1dmRDQmhJSEJ5YjIxcGMyVWdLRzV2SUM1MGFHVnVJRzFsZEdodlpDa2diM0lnZEdobEp5eGNiaUFnSUNBZ0lDZHdjbTl0YVhObElHbHpJR0ZqZEhWaGJHeDVJR1oxYkdacGJHeGxaQzRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbmRHOGdZbVVnWVNCeVpXcGxZM1JsWkNCd2NtOXRhWE5sSnl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUdaMWJHWnBiR3hsWkNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdhV1lnS0NGcGMxQnliMjFwYzJVb1lXTjBkV0ZzS1NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0oybHpJRzV2ZENCaElIQnliMjFwYzJVNklIdDdZV04wZFdGc2ZYMG5PMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdablZ1WTNScGIyNGdLSEpsYzI5c2RtVnlLU0I3WEc0Z0lDQWdJQ0FnSUM4dklFVnVkR1Z5SUdGemVXNWpJRzF2WkdWY2JpQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNHRjFjMlVvS1R0Y2JseHVJQ0FnSUNBZ0lDQmhZM1IxWVd3dWRHaGxiaWhjYmlBZ0lDQWdJQ0FnSUNCeVpYTjFiV1VvY21WemIyeDJaWElzSUdaaGJITmxLU3hjYmlBZ0lDQWdJQ0FnSUNCeVpYTjFiV1VvY21WemIyeDJaWElwWEc0Z0lDQWdJQ0FnSUNrN1hHNWNiaUFnSUNBZ0lDQWdMeThnVW1sbmFIUWdibTkzSUhkbElHUnZiaWQwSUd0dWIzY2dhV1lnZEdobElHVjRjSEpsYzNOcGIyNGdhWE1nZG1Gc2FXUmNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpEdGNiaUFnSUNBZ0lIMDdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JuMHBPMXh1SWwxOSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgYSB2YWx1ZSBjcmVhdGluZyBmb3JrcyBmb3IgZWFjaCBlbGVtZW50LCBoYW5kbGluZ1xuLy8gYXN5bmMgZXhwZWN0YXRpb25zIGlmIG5lZWRlZC5cbmZ1bmN0aW9uIGZvcmtlciAocmVzb2x2ZXIsIGFjdHVhbCwgaXRlcmF0b3IsIHN0b3ApIHtcbiAgdmFyIGJyYW5jaGVzID0gXy5zaXplKGFjdHVhbCk7XG4gIHZhciByZXN1bHQgPSBpdGVyYXRvcihhY3R1YWwsIGZ1bmN0aW9uICh2YWx1ZSkge1xuXG4gICAgdmFyIGZvcmsgPSByZXNvbHZlci5mb3JrKCk7XG5cbiAgICB2YXIgcGFydGlhbCA9IGZvcmsodmFsdWUpO1xuXG4gICAgLy8gU3RvcCBpdGVyYXRpbmcgYXMgc29vbiBhcyBwb3NzaWJsZVxuICAgIGlmIChwYXJ0aWFsID09PSBzdG9wKSB7XG4gICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgcmV0dXJuIHN0b3A7XG4gICAgfVxuXG4gICAgaWYgKHBhcnRpYWwgPT09ICFzdG9wKSB7XG4gICAgICBicmFuY2hlcyAtPSAxO1xuICAgICAgaWYgKDAgPT09IGJyYW5jaGVzKSB7XG4gICAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICB9XG4gICAgICByZXR1cm4gIXN0b3A7XG4gICAgfVxuXG4gICAgLy8gQXN5bmMgc3VwcG9ydFxuICAgIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmliZSB0byB0aGUgZm9yaydzIGZpbmFsIHJlc3VsdFxuICAgIGZvcmsuZmluYWxpemUoZnVuY3Rpb24gKGZpbmFsKSB7XG4gICAgICAvLyBXZSdyZSBkb25lIHRoZSBtb21lbnQgb25lIGlzIGEgc3RvcCByZXN1bHRcbiAgICAgIGlmIChmaW5hbCA9PT0gc3RvcCkge1xuICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgICByZXNvbHZlci5yZXN1bWUobnVsbCwgc3RvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmFuY2hlcyAtPSAxO1xuICAgICAgICBpZiAoMCA9PT0gYnJhbmNoZXMpIHtcbiAgICAgICAgICByZXNvbHZlci5qb2luKGZvcmspO1xuICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCAhc3RvcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmaW5hbDtcbiAgICB9KTtcblxuICAgIHJldHVybiAhc3RvcDsgIC8vIGtlZXAgaXRlcmF0aW5nXG4gIH0pO1xuXG4gIC8vIFdoZW4gdGhlIGZvcmtzIGNvbXBsZXRlZCBzeW5jaHJvbm91c2x5IGp1c3QgZmluYWxpemUgdGhlIHJlc29sdmVyXG4gIGlmICghcmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHJlc3VsdCk7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5cbi8vIFF1YW50aWZpZXJzXG5hc3MucmVnaXN0ZXIoe1xuXG4gIGV2ZXJ5OiB7XG4gICAgYWxpYXNlczogWyAnYWxsJywgJ2FsbE9mJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdBcHBsaWVzIG1hdGNoZXJzIHRvIGFsbCB0aGUgZWxlbWVudHMgaW4gYSBjb2xsZWN0aW9uIGV4cGVjdGluZyB0aGF0JyxcbiAgICAgICdhbGwgb2YgdGhlbSBzdWNjZWVkJ1xuICAgIF0sXG4gICAgZGVzYzogJ0ZvciBldmVyeSBvbmU6JyxcbiAgICBmYWlsOiAnb25lIGRpZG5cXCd0JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBzdHVmZiB0byBkb1xuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvcmtlcihyZXNvbHZlciwgYWN0dWFsLCBfLmV2ZXJ5LCBmYWxzZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBzb21lOiB7XG4gICAgYWxpYXNlczogWyAnYW55T2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ2F0IGxlYXN0IG9uZSBvZiB0aGVtIHN1Y2NlZWRzJ10sXG4gICAgZGVzYzogJ0F0IGxlYXN0IG9uZTonLFxuICAgIGZhaWw6ICdub25lIGRpZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5zb21lLCB0cnVlKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIG5vbmU6IHtcbiAgICBhbGlhc2VzOiBbICdub25lT2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ25vbmUgb2YgdGhlbSBzdWNjZWVkLidcbiAgICBdLFxuICAgIGRlc2M6ICdOb25lIG9mIHRoZW06JyxcbiAgICBmYWlsOiAnb25lIGRpZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBTaG9ydGN1dCB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgc3R1ZmYgdG8gZG9cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlci5maW5hbGl6ZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGFyZSBnb2luZyB0byB1c2UgdGhlIHNhbWUgYWxnb3JpdGhtIGFzIGZvciAuc29tZSBidXQgd2UnbGwgbmVnYXRlXG4gICAgICAgIC8vIGl0cyByZXN1bHQgdXNpbmcgYSBmaW5hbGl6ZXIuXG4gICAgICAgIHJlc29sdmVyLmZpbmFsaXplKGZ1bmN0aW9uIChmaW5hbCkge1xuICAgICAgICAgIHJldHVybiAhZmluYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmb3JrZXIocmVzb2x2ZXIsIGFjdHVhbCwgXy5zb21lLCB0cnVlKTtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbn0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTl0WVhSamFHVnljeTl4ZFdGdWRHbG1hV1Z5Y3k1cWN5SmRMQ0p1WVcxbGN5STZXMTBzSW0xaGNIQnBibWR6SWpvaU8wRkJRVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdYeUE5SUNoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnZDJsdVpHOTNMbDhnT2lCMGVYQmxiMllnWjJ4dlltRnNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnWjJ4dlltRnNMbDhnT2lCdWRXeHNLVHRjYmx4dWRtRnlJR0Z6Y3lBOUlISmxjWFZwY21Vb0p5NHVMMkZ6Y3ljcE8xeHVYRzVjYmk4dklFaGxiSEJsY2lCbWRXNWpkR2x2YmlCMGJ5QnBkR1Z5WVhSbElHRWdkbUZzZFdVZ1kzSmxZWFJwYm1jZ1ptOXlhM01nWm05eUlHVmhZMmdnWld4bGJXVnVkQ3dnYUdGdVpHeHBibWRjYmk4dklHRnplVzVqSUdWNGNHVmpkR0YwYVc5dWN5QnBaaUJ1WldWa1pXUXVYRzVtZFc1amRHbHZiaUJtYjNKclpYSWdLSEpsYzI5c2RtVnlMQ0JoWTNSMVlXd3NJR2wwWlhKaGRHOXlMQ0J6ZEc5d0tTQjdYRzRnSUhaaGNpQmljbUZ1WTJobGN5QTlJRjh1YzJsNlpTaGhZM1IxWVd3cE8xeHVJQ0IyWVhJZ2NtVnpkV3gwSUQwZ2FYUmxjbUYwYjNJb1lXTjBkV0ZzTENCbWRXNWpkR2x2YmlBb2RtRnNkV1VwSUh0Y2JseHVJQ0FnSUhaaGNpQm1iM0pySUQwZ2NtVnpiMngyWlhJdVptOXlheWdwTzF4dVhHNGdJQ0FnZG1GeUlIQmhjblJwWVd3Z1BTQm1iM0pyS0haaGJIVmxLVHRjYmx4dUlDQWdJQzh2SUZOMGIzQWdhWFJsY21GMGFXNW5JR0Z6SUhOdmIyNGdZWE1nY0c5emMybGliR1ZjYmlBZ0lDQnBaaUFvY0dGeWRHbGhiQ0E5UFQwZ2MzUnZjQ2tnZTF4dUlDQWdJQ0FnY21WemIyeDJaWEl1YW05cGJpaG1iM0pyS1R0Y2JpQWdJQ0FnSUhKbGRIVnliaUJ6ZEc5d08xeHVJQ0FnSUgxY2JseHVJQ0FnSUdsbUlDaHdZWEowYVdGc0lEMDlQU0FoYzNSdmNDa2dlMXh1SUNBZ0lDQWdZbkpoYm1Ob1pYTWdMVDBnTVR0Y2JpQWdJQ0FnSUdsbUlDZ3dJRDA5UFNCaWNtRnVZMmhsY3lrZ2UxeHVJQ0FnSUNBZ0lDQnlaWE52YkhabGNpNXFiMmx1S0dadmNtc3BPMXh1SUNBZ0lDQWdmVnh1SUNBZ0lDQWdjbVYwZFhKdUlDRnpkRzl3TzF4dUlDQWdJSDFjYmx4dUlDQWdJQzh2SUVGemVXNWpJSE4xY0hCdmNuUmNiaUFnSUNCcFppQW9JWEpsYzI5c2RtVnlMbkJoZFhObFpDa2dlMXh1SUNBZ0lDQWdjbVZ6YjJ4MlpYSXVjR0YxYzJVb0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdkx5QlRkV0p6WTNKcFltVWdkRzhnZEdobElHWnZjbXNuY3lCbWFXNWhiQ0J5WlhOMWJIUmNiaUFnSUNCbWIzSnJMbVpwYm1Gc2FYcGxLR1oxYm1OMGFXOXVJQ2htYVc1aGJDa2dlMXh1SUNBZ0lDQWdMeThnVjJVbmNtVWdaRzl1WlNCMGFHVWdiVzl0Wlc1MElHOXVaU0JwY3lCaElITjBiM0FnY21WemRXeDBYRzRnSUNBZ0lDQnBaaUFvWm1sdVlXd2dQVDA5SUhOMGIzQXBJSHRjYmlBZ0lDQWdJQ0FnY21WemIyeDJaWEl1YW05cGJpaG1iM0pyS1R0Y2JpQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNtVnpkVzFsS0c1MWJHd3NJSE4wYjNBcE8xeHVJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ1luSmhibU5vWlhNZ0xUMGdNVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tEQWdQVDA5SUdKeVlXNWphR1Z6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVhbTlwYmlobWIzSnJLVHRjYmlBZ0lDQWdJQ0FnSUNCeVpYTnZiSFpsY2k1eVpYTjFiV1VvYm5Wc2JDd2dJWE4wYjNBcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQnlaWFIxY200Z1ptbHVZV3c3WEc0Z0lDQWdmU2s3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdJWE4wYjNBN0lDQXZMeUJyWldWd0lHbDBaWEpoZEdsdVoxeHVJQ0I5S1R0Y2JseHVJQ0F2THlCWGFHVnVJSFJvWlNCbWIzSnJjeUJqYjIxd2JHVjBaV1FnYzNsdVkyaHliMjV2ZFhOc2VTQnFkWE4wSUdacGJtRnNhWHBsSUhSb1pTQnlaWE52YkhabGNseHVJQ0JwWmlBb0lYSmxjMjlzZG1WeUxuQmhkWE5sWkNrZ2UxeHVJQ0FnSUhKbGRIVnliaUJ5WlhOdmJIWmxjaTVtYVc1aGJHbDZaU2h5WlhOMWJIUXBPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJSFZ1WkdWbWFXNWxaRHRjYm4xY2JseHVYRzR2THlCUmRXRnVkR2xtYVdWeWMxeHVZWE56TG5KbFoybHpkR1Z5S0h0Y2JseHVJQ0JsZG1WeWVUb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMkZzYkNjc0lDZGhiR3hQWmljZ1hTeGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuUVhCd2JHbGxjeUJ0WVhSamFHVnljeUIwYnlCaGJHd2dkR2hsSUdWc1pXMWxiblJ6SUdsdUlHRWdZMjlzYkdWamRHbHZiaUJsZUhCbFkzUnBibWNnZEdoaGRDY3NYRzRnSUNBZ0lDQW5ZV3hzSUc5bUlIUm9aVzBnYzNWalkyVmxaQ2RjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNkR2IzSWdaWFpsY25rZ2IyNWxPaWNzWEc0Z0lDQWdabUZwYkRvZ0oyOXVaU0JrYVdSdVhGd25kQ2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNoeVpYTnZiSFpsY2lrZ2UxeHVJQ0FnSUNBZ0lDQXZMeUJUYUc5eWRHTjFkQ0IzYUdWdUlIUm9aWEpsSUdseklHNXZJRzF2Y21VZ2MzUjFabVlnZEc4Z1pHOWNiaUFnSUNBZ0lDQWdhV1lnS0hKbGMyOXNkbVZ5TG1WNGFHRjFjM1JsWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQnlaWE52YkhabGNpNW1hVzVoYkdsNlpTaDBjblZsS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQm1iM0pyWlhJb2NtVnpiMngyWlhJc0lHRmpkSFZoYkN3Z1h5NWxkbVZ5ZVN3Z1ptRnNjMlVwTzF4dUlDQWdJQ0FnZlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2MyOXRaVG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjJGdWVVOW1KeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEJjSEJzYVdWeklHMWhkR05vWlhKeklIUnZJR0ZzYkNCMGFHVWdaV3hsYldWdWRITWdhVzRnWVNCamIyeHNaV04wYVc5dUlHVjRjR1ZqZEdsdVp5QjBhR0YwSnl4Y2JpQWdJQ0FnSUNkaGRDQnNaV0Z6ZENCdmJtVWdiMllnZEdobGJTQnpkV05qWldWa2N5ZGRMRnh1SUNBZ0lHUmxjMk02SUNkQmRDQnNaV0Z6ZENCdmJtVTZKeXhjYmlBZ0lDQm1ZV2xzT2lBbmJtOXVaU0JrYVdRbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpYSXBJSHRjYmlBZ0lDQWdJQ0FnTHk4Z1UyaHZjblJqZFhRZ2QyaGxiaUIwYUdWeVpTQnBjeUJ1YnlCdGIzSmxJSE4wZFdabUlIUnZJR1J2WEc0Z0lDQWdJQ0FnSUdsbUlDaHlaWE52YkhabGNpNWxlR2hoZFhOMFpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnY21WemIyeDJaWEl1Wm1sdVlXeHBlbVVvZEhKMVpTazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWm05eWEyVnlLSEpsYzI5c2RtVnlMQ0JoWTNSMVlXd3NJRjh1YzI5dFpTd2dkSEoxWlNrN1hHNGdJQ0FnSUNCOU8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQnViMjVsT2lCN1hHNGdJQ0FnWVd4cFlYTmxjem9nV3lBbmJtOXVaVTltSnlCZExGeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RCY0hCc2FXVnpJRzFoZEdOb1pYSnpJSFJ2SUdGc2JDQjBhR1VnWld4bGJXVnVkSE1nYVc0Z1lTQmpiMnhzWldOMGFXOXVJR1Y0Y0dWamRHbHVaeUIwYUdGMEp5eGNiaUFnSUNBZ0lDZHViMjVsSUc5bUlIUm9aVzBnYzNWalkyVmxaQzRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBblRtOXVaU0J2WmlCMGFHVnRPaWNzWEc0Z0lDQWdabUZwYkRvZ0oyOXVaU0JrYVdRbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpYSXBJSHRjYmlBZ0lDQWdJQ0FnTHk4Z1UyaHZjblJqZFhRZ2QyaGxiaUIwYUdWeVpTQnBjeUJ1YnlCdGIzSmxJSE4wZFdabUlIUnZJR1J2WEc0Z0lDQWdJQ0FnSUdsbUlDaHlaWE52YkhabGNpNWxlR2hoZFhOMFpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnY21WemIyeDJaWEl1Wm1sdVlXeHBlbVVvZEhKMVpTazdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNBdkx5QlhaU0JoY21VZ1oyOXBibWNnZEc4Z2RYTmxJSFJvWlNCellXMWxJR0ZzWjI5eWFYUm9iU0JoY3lCbWIzSWdMbk52YldVZ1luVjBJSGRsSjJ4c0lHNWxaMkYwWlZ4dUlDQWdJQ0FnSUNBdkx5QnBkSE1nY21WemRXeDBJSFZ6YVc1bklHRWdabWx1WVd4cGVtVnlMbHh1SUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTVtYVc1aGJHbDZaU2htZFc1amRHbHZiaUFvWm1sdVlXd3BJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnSVdacGJtRnNPMXh1SUNBZ0lDQWdJQ0I5S1R0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptOXlhMlZ5S0hKbGMyOXNkbVZ5TENCaFkzUjFZV3dzSUY4dWMyOXRaU3dnZEhKMVpTazdYRzRnSUNBZ0lDQjlPMXh1SUNBZ0lIMWNiaUFnZlZ4dVhHNTlLVHRjYmlKZGZRPT0iLCJ2YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5cbnZhciBjaGVja0NoYWluID0gbmV3IENoYWluKCk7XG5cblxuZXhwb3J0cy5sb2Rhc2ggPSBmdW5jdGlvbiAoXykge1xuICAvLyBFeGl0IGlmIGFscmVhZHkgcGF0Y2hlZFxuICBpZiAoXy5jcmVhdGVDYWxsYmFjayhjaGVja0NoYWluKSA9PT0gY2hlY2tDaGFpbi50ZXN0KSB7XG4gICAgcmV0dXJuIF87XG4gIH1cblxuICAvLyBPdmVycmlkZSBsb2Rhc2gncyBkZWZhdWx0IGNyZWF0ZUNhbGxiYWNrIG1lY2hhbmlzbSB0byBtYWtlIGl0IHVuZGVyc3RhbmRcbiAgLy8gYWJvdXQgb3VyIGV4cHJlc3Npb24gY2hhaW5zLlxuICBfLmNyZWF0ZUNhbGxiYWNrID0gXy53cmFwKF8uY3JlYXRlQ2FsbGJhY2ssIGZ1bmN0aW9uKG9yaWcsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgaWYgKENoYWluLmlzQ2hhaW4oY2FsbGJhY2spKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sudGVzdDtcbiAgICB9XG5cbiAgICAvLyBTdXBwb3J0IF8ud2hlcmUgc3R5bGUuIEl0J3Mgbm90IGFzIGZhc3QgYXMgdGhlIG9yaWdpbmFsIG9uZSBzaW5jZSB3ZVxuICAgIC8vIGhhdmUgdG8gZ28gdmlhIF8uaXNFcXVhbCBpbnN0ZWFkIG9mIHVzaW5nIHRoZSBpbnRlcm5hbCBmdW5jdGlvblxuICAgIGlmIChfLmlzUGxhaW5PYmplY3QoY2FsbGJhY2spKSB7XG4gICAgICB2YXIgcHJvcHMgPSBfLmtleXMoY2FsbGJhY2spO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHZhciByZXN1bHQgPSBmYWxzZSwgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLCBrZXk7XG4gICAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICAgIGtleSA9IHByb3BzW2xlbmd0aF07XG4gICAgICAgICAgLy8gRmFpbCB3aGVuIHRoZSBrZXkgaXMgbm90IGV2ZW4gcHJlc2VudFxuICAgICAgICAgIGlmICghKGtleSBpbiBvYmplY3QpKSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzdWx0ID0gXy5pc0VxdWFsKG9iamVjdFtrZXldLCBjYWxsYmFja1trZXldKTtcbiAgICAgICAgICBpZiAoIXJlc3VsdCkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG9yaWcoY2FsbGJhY2ssIHRoaXNBcmcpO1xuICB9KTtcblxuICAvLyBPdmVycmlkZSBsb2Rhc2gncyBkZWZhdWx0IGlzRXF1YWwgaW1wbGVtZW50YXRpb24gc28gaXQgdW5kZXJzdGFuZHNcbiAgLy8gYWJvdXQgZXhwcmVzc2lvbiBjaGFpbnMuXG4gIGZ1bmN0aW9uIGNtcCAoYSwgYikge1xuICAgIHJldHVybiBDaGFpbi5pc0NoYWluKGEpID8gYS50ZXN0KGIpIDogQ2hhaW4uaXNDaGFpbihiKSA/IGIudGVzdChhKSA6IHVuZGVmaW5lZDtcbiAgfVxuICBfLmlzRXF1YWwgPSBfLndyYXAoXy5pc0VxdWFsLCBmdW5jdGlvbiAob3JpZywgYSwgYiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICB2YXIgcmVzdWx0ID0gY2FsbGJhY2sgPyBjYWxsYmFjay5jYWxsKHRoaXNBcmcgfHwgdGhpcywgYSwgYikgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXN1bHQgPSBvcmlnKGEsIGIsIGNtcCwgdGhpc0FyZyk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0pO1xuXG4gIHJldHVybiBfO1xufTtcblxuXG5leHBvcnRzLnNpbm9uID0gZnVuY3Rpb24gKHNpbm9uKSB7XG4gIC8vIEV4aXQgaWYgYWxyZWFkeSBwYXRjaGVkXG4gIGlmIChzaW5vbi5tYXRjaC5pc01hdGNoZXIoY2hlY2tDaGFpbikpIHtcbiAgICByZXR1cm4gc2lub247XG4gIH1cblxuICAvLyBPdmVycmlkZSBTaW5vbidzIC5pc01hdGNoZXIgaW1wbGVtZW50YXRpb24gdG8gYWxsb3cgb3VyIGV4cHJlc3Npb25zIHRvIGJlXG4gIC8vIHRyYW5zcGFyZW50bHkgc3VwcG9ydGVkIGJ5IGl0LlxuICB2YXIgb2xkSXNNYXRjaGVyID0gdXRpbC5iaW5kKHNpbm9uLm1hdGNoLmlzTWF0Y2hlciwgc2lub24ubWF0Y2gpO1xuICBzaW5vbi5tYXRjaC5pc01hdGNoZXIgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIENoYWluLmlzQ2hhaW4ob2JqKSB8fCBvbGRJc01hdGNoZXIob2JqKTtcbiAgfTtcblxuICByZXR1cm4gc2lub247XG59O1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8vIFVzZSBhIGNhcHBlZCBwb29sLCB0aGUgcmVsZWFzaW5nIGFsZ29yaXRobSBpcyBwcmV0dHkgc29saWQgc28gd2Ugc2hvdWxkXG4vLyBoYXZlIGEgZ29vZCByZS11c2UgcmF0aW8gd2l0aCBqdXN0IGEgZmV3IGluIHRoZSBwb29sLiBUaGVuIGluIGNhc2Vcbi8vIHNvbWV0aGluZyBnb2VzIHdyb25nIHRoZSBHQyB3aWxsIHRha2UgY2FyZSBvZiBpdCBhZnRlciBhIHdoaWxlLlxudmFyIHBvb2wgPSB1dGlsLkNhcHBlZFBvb2woMTAwKTtcbnZhciBjcmVhdGVkID0gMDtcblxuXG4vLyBJbnN0YW50aWF0ZXMgYSBuZXcgcmVzb2x2ZXIgZnVuY3RvclxuZnVuY3Rpb24gZmFjdG9yeSAoKSB7XG4gIC8vIEp1c3QgZm9yd2FyZHMgdGhlIGNhbGwgdG8gdGhlIHJlc29sdmVyIGJ5IHNldHRpbmcgaXRzZWxmIGFzIGNvbnRleHQuXG4gIGZ1bmN0aW9uIGZuICh2YWx1ZSkge1xuICAgIHJldHVybiByZXNvbHZlci5jYWxsKGZuLCB2YWx1ZSk7XG4gIH1cblxuICBmbi5pZCA9ICsrY3JlYXRlZDtcblxuICAvLyBUaGUgc3RhdGUgaXMgYXR0YWNoZWQgdG8gdGhlIGZ1bmN0aW9uIG9iamVjdCBzbyBpdCdzIGF2YWlsYWJsZSB0byB0aGVcbiAgLy8gc3RhdGUtbGVzcyBmdW5jdGlvbnMgd2hlbiBydW5uaW5nIHVuZGVyIGB0aGlzLmAuXG4gIGZuLmNoYWluID0gbnVsbDtcbiAgZm4ucGFyZW50ID0gbnVsbDtcbiAgZm4ucGF1c2VkID0gZmFsc2U7XG4gIGZuLnJlc29sdmVkID0gW107XG4gIGZuLmZpbmFsaXplcnMgPSBbXTtcblxuICAvLyBFeHBvc2UgdGhlIGJlaGF2aW91ciBpbiB0aGUgZnVuY3RvclxuICBmbi5wYXVzZSA9IHBhdXNlO1xuICBmbi5yZXN1bWUgPSByZXN1bWU7XG4gIGZuLmZvcmsgPSBmb3JrO1xuICBmbi5qb2luID0gam9pbjtcbiAgZm4uZmluYWxpemUgPSBmaW5hbGl6ZTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZm4sICdleGhhdXN0ZWQnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXNvbHZlZC5sZW5ndGggPj0gdGhpcy5jaGFpbi5fX2V4cGVjdGF0aW9uc19fLmxlbmd0aDtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBmbjtcbn1cblxuLy8gVGhpcyBpcyB0aGUgY29yZSByZXNvbHV0aW9uIGFsZ29yaXRobSwgaXQgb3BlcmF0ZXMgb3ZlciB0aGUgY2hhaW5cbi8vIG9mIGV4cGVjdGF0aW9ucyBjaGVja2luZyB0aGVtIG9uZSBhZnRlciB0aGUgb3RoZXIgYWdhaW5zdCBhIHZhbHVlLlxuLy8gSWYgYSBmdW5jdGlvbiBpcyByZXR1cm5lZCBpdCdsbCBiZSBpbW1lZGlhdGVseSBjYWxsZWQgdXNpbmcgdGhlXG4vLyBleHBlY3RhdGlvbiBpbnN0YW5jZSBhcyBjb250ZXh0IGFuZCBwYXNzaW5nIGFzIG9ubHkgYXJndW1lbnQgdGhlXG4vLyBjdXJyZW50IHJlc29sdmUgZnVuY3Rpb24sIHRoaXMgYWxsb3dzIGFuIGV4cGVjdGF0aW9uIHRvIG92ZXJyaWRlXG4vLyB0aGUgdmFsdWUgYW5kL29yIGNvbnRyb2wgdGhlIHJlc29sdXRpb24gd2l0aG91dCBleHBvc2luZyB0b28gbWFueVxuLy8gaW50ZXJuYWwgZGV0YWlscy5cbi8vIFdoZW4gaXQgcmV0dXJucyBgdW5kZWZpbmVkYCBpdCBqdXN0IG1lYW5zIHRoYXQgdGhlIHJlc29sdXRpb24gd2FzXG4vLyBwYXVzZWQgKGFzeW5jKSwgd2UgY2FuIG5vdCBvYnRhaW4gYSBmaW5hbCByZXN1bHQgdXNpbmcgYSBzeW5jaHJvbm91c1xuLy8gY2FsbC4gVGhpcyBjYW4gYmUgdXNlZCBieSBtYXRjaGVycyB3aGVuIHRha2luZyBvdmVyIHRoZSByZXNvbHV0aW9uIHRvXG4vLyBrbm93IGlmIHRoZXkgbmVlZCB0byBtYW5nbGUgdGhlIHJlc3VsdHMgb3IgdGhleSBoYXZlIHRvIHJlZ2lzdGVyIGFcbi8vIGZpbmFsaXplciB0byBiZSBub3RpZmllZCBvZiB0aGUgZmluYWwgcmVzdWx0IGZyb20gdGhlIGNoYWluLlxuZnVuY3Rpb24gcmVzb2x2ZXIgKHZhbHVlKSB7XG4gIHZhciBsaXN0LCByZXN1bHQsIGV4cDtcblxuICBsaXN0ID0gdGhpcy5jaGFpbi5fX2V4cGVjdGF0aW9uc19fO1xuICBvZmZzZXQgPSB0aGlzLnJlc29sdmVkLmxlbmd0aDtcbiAgcmVzdWx0ID0gdHJ1ZTtcblxuICBmb3IgKHZhciBpID0gb2Zmc2V0OyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIC8vIENyZWF0ZSBhIG5ldyBvYmplY3QgaW5oZXJpdGluZyBmcm9tIHRoZSBleHBlY3RhdGlvbiBidXQgd2l0aCB0aGVcbiAgICAvLyBjdXJyZW50IGFjdHVhbCB2YWx1ZSBwcm92aXNpb25lZC4gSXQgYWxsb3dzIHRoZSBleHByZXNzaW9uIHRvIG11dGF0ZVxuICAgIC8vIGl0cyBzdGF0ZSBmb3IgdGhpcyBleGVjdXRpb24gYnV0IG5vdCBhZmZlY3Qgb3RoZXIgdXNlcyBvZiBpdC5cbiAgICBleHAgPSB1dGlsLmNyZWF0ZShsaXN0W2ldLCB7IGFjdHVhbDogdmFsdWUgfSk7XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIHJlc29sdmVkIGV4cGVjdGF0aW9uc1xuICAgIHRoaXMucmVzb2x2ZWQucHVzaChleHApO1xuXG4gICAgLy8gRXhlY3V0ZSB0aGUgZXhwZWN0YXRpb24gdG8gb2J0YWluIGl0cyByZXN1bHRcbiAgICByZXN1bHQgPSBleHAucmVzdWx0ID0gZXhwLnJlc29sdmUoKTtcblxuICAgIC8vIEFsbG93IGV4cGVjdGF0aW9ucyB0byB0YWtlIGNvbnRyb2wgZm9yIHRoZSByZW1haW5pbmcgb2YgdGhlIGNoYWluXG4gICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIFNpbmNlIHRoZSBjb250cm9sIGlzIGRlbGVnYXRlZCB0byB0aGUgZXhwcmVzc2lvbiB3ZSBkb24ndCBoYXZlIHRvXG4gICAgICAvLyBkbyBhbnl0aGluZyBtb3JlIGhlcmUuXG4gICAgICByZXR1cm4gZXhwLnJlc3VsdCA9IHJlc3VsdC5jYWxsKGV4cCwgdGhpcyk7XG4gICAgfVxuXG4gICAgLy8gU3RvcCBvbiBmaXJzdCBmYWlsdXJlXG4gICAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgd2UganVzdCBuZWVkIHRvIGFwcGx5IGFueSBwZW5kaW5nIGZpbmFsaXplcnNcbiAgcmV0dXJuIHRoaXMuZmluYWxpemUocmVzdWx0KTtcbn1cblxuXG4vLyBXaGVuIHJlc29sdmluZyBhc3luYyBmbG93cyAoaS5lLjogcHJvbWlzZXMpIHRoaXMgd2lsbCBwYXVzZSB0aGUgZ2l2ZW5cbi8vIHJlc29sdmVyIHVudGlsIGEgY2FsbCB0byAucmVzdW1lKCkgaXMgbWFkZS5cbmZ1bmN0aW9uIHBhdXNlICgpIHtcbiAgaWYgKHRoaXMucGF1c2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHZlciBhbHJlYWR5IHBhdXNlZCcpO1xuICB9XG5cbiAgdGhpcy5wYXVzZWQgPSB0cnVlO1xufVxuXG4vLyBPbmNlIHRoZSBhc3luYyBmbG93IGhhcyBjb21wbGV0ZWQgd2UgY2FuIGNvbnRpbnVlIHJlc29sdmluZyB3aGVyZSB3ZVxuLy8gc3RvcGVkLiBXaGVuIHRoZSBvdmVycmlkZSBwYXJhbSBpcyBub3QgdW5kZWZpbmVkIHdlJ2xsIHNraXAgY2FsbGluZyB0aGVcbi8vIHJlc29sdmVyIGFuZCBhc3N1bWUgdGhhdCBib29sIGFzIHRoZSBmaW5hbCByZXN1bHQuIFRoaXMgYWxsb3dzIHRoZSBhc3luY1xuLy8gY29kZSB0byBzaG9ydGN1dCB0aGUgcmVzb2x2ZXIuXG5mdW5jdGlvbiByZXN1bWUgKGFjdHVhbCwgb3ZlcnJpZGUpIHtcbiAgaWYgKCF0aGlzLnBhdXNlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVzb2x2ZXIgaXMgbm90IGN1cnJlbnRseSBwYXVzZWQnKTtcbiAgfVxuXG4gIHRoaXMucGF1c2VkID0gZmFsc2U7XG5cbiAgLy8gQSBmaW5hbCByZXN1bHQgd2FzIHByb3ZpZGVkIHNvIGp1c3QgZmluYWxpemUgdGhlIHJlc29sdmVyXG4gIGlmIChvdmVycmlkZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuZmluYWxpemUob3ZlcnJpZGUpO1xuICB9XG5cbiAgLy8gTGV0J3MgY29udGludWUgcmVzb2x2aW5nIHdpdGggdGhlIG5ldyB2YWx1ZVxuICAvLyBOb3RlOiB0aGlzKCkgbG9va3Mgd2VpcmQgYnV0IHJlbWVtYmVyIHdlJ3JlIHVzaW5nIGEgZnVuY3Rpb24gYXMgY29udGV4dFxuICByZXR1cm4gdGhpcyhhY3R1YWwpO1xufVxuXG4vLyBDbG9uZXMgdGhlIGN1cnJlbnQgcmVzb2x2ZXIgc28gd2UgY2FuIGZvcmsgYW5kIGRpc2NhcmQgb3BlcmF0aW9ucy5cbmZ1bmN0aW9uIGZvcmsgKCkge1xuICB2YXIgZm9yayA9IGFjcXVpcmUodGhpcy5jaGFpbik7XG4gIGZvcmsucGFyZW50ID0gdGhpcztcbiAgZm9yay5yZXNvbHZlZCA9IF8ucmVqZWN0KHRoaXMucmVzb2x2ZWQsIEFycmF5LmlzQXJyYXkpO1xuICByZXR1cm4gZm9yaztcbn1cblxuLy8gQXNzdW1lIHRoZSByZXN1bHRzIGZyb20gYSBmb3JrIGluIHRoZSBtYWluIHJlc29sdmVyXG5mdW5jdGlvbiBqb2luIChmb3JrKSB7XG4gIHZhciBsZW4gPSBfLnJlamVjdCh0aGlzLnJlc29sdmVkLCBBcnJheS5pc0FycmF5KS5sZW5ndGg7XG4gIHRoaXMucmVzb2x2ZWQucHVzaChcbiAgICBmb3JrLnJlc29sdmVkLnNsaWNlKGxlbilcbiAgKTtcbn1cblxuLy8gV2hlbiB0aGUgYXJndW1lbnQgaXMgYSBmdW5jdGlvbiBpdCBnZXRzIHJlZ2lzdGVyZWQgYXMgYSBmaW5hbGl6ZXIgZm9yIHRoZVxuLy8gcmVzdWx0IG9idGFpbmVkIG9uY2UgdGhlIGV4cHJlc3Npb24gaGFzIGJlZW4gZnVsbHkgcmVzb2x2ZWQgKGkuZS4gYXN5bmMpLlxuLy8gT3RoZXJ3aXNlIGl0J2xsIGV4ZWN1dGUgYW55IHJlZ2lzdGVyZWQgZnVuY3Rpb25zIG9uIHRoZSBnaXZlbiByZXN1bHQgYW5kXG4vLyBhbGxvdyB0aGVtIHRvIGNoYW5nZSBpdCBiZWZvcmUgcmVsZWFzaW5nIHRoZSByZXNvbHZlciBpbnRvIHRoZSBwb29sLlxuZnVuY3Rpb24gZmluYWxpemUocmVzdWx0KSB7XG4gIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5maW5hbGl6ZXJzLnB1c2goXG4gICAgICBbcmVzdWx0LCBfLmxhc3QodGhpcy5yZXNvbHZlZCldXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBOb3RoaW5nIHlldCB0byBmaW5hbGl6ZSBzaW5jZSB0aGUgcmVzdWx0IGlzIHN0aWxsIHVua25vd25cbiAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vIEFsbG93IGZpbmFsaXplcnMgdG8gdG9nZ2xlIHRoZSByZXN1bHQgKExJRk8gb3JkZXIpXG4gIHZhciBmaW5hbGl6ZXI7XG4gIHdoaWxlICh0aGlzLmZpbmFsaXplcnMubGVuZ3RoID4gMCkge1xuICAgIGZpbmFsaXplciA9IHRoaXMuZmluYWxpemVycy5wb3AoKTtcbiAgICByZXN1bHQgPSBmaW5hbGl6ZXJbMF0uY2FsbChmaW5hbGl6ZXJbMV0sIHJlc3VsdCk7XG4gICAgZmluYWxpemVyWzFdLnJlc3VsdCA9IHJlc3VsdDtcbiAgfVxuXG4gIC8vIExldCB0aGUgY2hhaW4gZGlzcGF0Y2ggdGhlIGZpbmFsIHJlc3VsdCBidXQgb25seSBmb3Igbm9uLWZvcmtlZCByZXNvbHZlcnNcbiAgaWYgKCF0aGlzLnBhcmVudCkge1xuICAgIHRoaXMuY2hhaW4uZGlzcGF0Y2hSZXN1bHQodGhpcy5yZXNvbHZlZCwgcmVzdWx0KTtcbiAgfVxuXG4gIC8vIFdoZW4gYSBmaW5hbCByZXN1bHQgaGFzIGJlZW4gb2J0YWluZWQgcmVsZWFzZSB0aGUgcmVzb2x2ZXIgdG8gdGhlIHBvb2xcbiAgcG9vbC5wdXNoKHRoaXMpO1xuICBpZiAocG9vbC5sZW5ndGggPiBjcmVhdGVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQb29sIGNvcnJ1cHRlZCEgQ3JlYXRlZCAnICsgY3JlYXRlZCArICcgYnV0IHRoZXJlIGFyZSAnICsgcG9vbC5sZW5ndGggKyAnIHBvb2xlZCcpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gQWNxdWlyZXMgYSByZXNvbHZlciBmdW5jdG9yLCBpZiB0aGVyZSBpcyBvbmUgaW4gdGhlIHBvb2wgaXQnbGwgYmUgcmVzZXQgYW5kXG4vLyByZXVzZWQsIG90aGVyd2lzZSBpdCdsbCBjcmVhdGUgYSBuZXcgb25lLiBXaGVuIHlvdSdyZSBkb25lIHdpdGggdGhlIHJlc29sdmVyXG4vLyB5b3Ugc2hvdWQgZ2l2ZSBpdCB0byBgcmVsZWFzZSgpYCBzbyBpdCBjYW4gYmUgaW5jb3Jwb3JhdGVkIHRvIHRoZSBwb29sLlxuLy8gVGhlIHJlYXNvbiBmb3IgdXNpbmcgYSBwb29sIG9mIG9iamVjdHMgaGVyZSBpcyB0aGF0IGV2ZXJ5IHRpbWUgd2UgZXZhbHVhdGVcbi8vIGFuIGV4cHJlc3Npb24gd2UnbGwgbmVlZCBhIHJlc29sdmVyLCB3aGVuIHVzaW5nIHF1YW50aWZpZXJzIG11bHRpcGxlIGZvcmtzXG4vLyB3aWxsIGJlIGNyZWF0ZWQsIHNvIGl0J3MgaW1wb3J0YW50IHRvIGltcHJvdmUgdGhlIHBlcmZvcm1hbmNlLlxuZnVuY3Rpb24gYWNxdWlyZSAoY2hhaW4pIHtcbiAgdmFyIHJlc29sdmVyID0gcG9vbC5wb3AoKSB8fCBmYWN0b3J5KCk7XG5cbiAgLy8gUmVzZXQgdGhlIHN0YXRlIG9mIHRoZSByZXNvbHZlclxuICByZXNvbHZlci5jaGFpbiA9IGNoYWluO1xuICByZXNvbHZlci5wYXJlbnQgPSBudWxsO1xuICByZXNvbHZlci5wYXVzZWQgPSBmYWxzZTtcbiAgd2hpbGUgKHJlc29sdmVyLnJlc29sdmVkLmxlbmd0aCA+IDApIHtcbiAgICByZXNvbHZlci5yZXNvbHZlZC5wb3AoKTtcbiAgfVxuICB3aGlsZSAocmVzb2x2ZXIuZmluYWxpemVycy5sZW5ndGggPiAwKSB7XG4gICAgcmVzb2x2ZXIuZmluYWxpemVycy5wb3AoKTtcbiAgfVxuXG4gIHJldHVybiByZXNvbHZlcjtcbn1cblxuXG5leHBvcnRzLmFjcXVpcmUgPSBhY3F1aXJlO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTl5WlhOdmJIWmxjbk11YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SjJZWElnWHlBOUlDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzTGw4Z09pQjBlWEJsYjJZZ1oyeHZZbUZzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z1oyeHZZbUZzTGw4Z09pQnVkV3hzS1R0Y2JseHVkbUZ5SUhWMGFXd2dQU0J5WlhGMWFYSmxLQ2N1TDNWMGFXd25LVHRjYmx4dUx5OGdWWE5sSUdFZ1kyRndjR1ZrSUhCdmIyd3NJSFJvWlNCeVpXeGxZWE5wYm1jZ1lXeG5iM0pwZEdodElHbHpJSEJ5WlhSMGVTQnpiMnhwWkNCemJ5QjNaU0J6YUc5MWJHUmNiaTh2SUdoaGRtVWdZU0JuYjI5a0lISmxMWFZ6WlNCeVlYUnBieUIzYVhSb0lHcDFjM1FnWVNCbVpYY2dhVzRnZEdobElIQnZiMnd1SUZSb1pXNGdhVzRnWTJGelpWeHVMeThnYzI5dFpYUm9hVzVuSUdkdlpYTWdkM0p2Ym1jZ2RHaGxJRWRESUhkcGJHd2dkR0ZyWlNCallYSmxJRzltSUdsMElHRm1kR1Z5SUdFZ2QyaHBiR1V1WEc1MllYSWdjRzl2YkNBOUlIVjBhV3d1UTJGd2NHVmtVRzl2YkNneE1EQXBPMXh1ZG1GeUlHTnlaV0YwWldRZ1BTQXdPMXh1WEc1Y2JpOHZJRWx1YzNSaGJuUnBZWFJsY3lCaElHNWxkeUJ5WlhOdmJIWmxjaUJtZFc1amRHOXlYRzVtZFc1amRHbHZiaUJtWVdOMGIzSjVJQ2dwSUh0Y2JpQWdMeThnU25WemRDQm1iM0ozWVhKa2N5QjBhR1VnWTJGc2JDQjBieUIwYUdVZ2NtVnpiMngyWlhJZ1lua2djMlYwZEdsdVp5QnBkSE5sYkdZZ1lYTWdZMjl1ZEdWNGRDNWNiaUFnWm5WdVkzUnBiMjRnWm00Z0tIWmhiSFZsS1NCN1hHNGdJQ0FnY21WMGRYSnVJSEpsYzI5c2RtVnlMbU5oYkd3b1ptNHNJSFpoYkhWbEtUdGNiaUFnZlZ4dVhHNGdJR1p1TG1sa0lEMGdLeXRqY21WaGRHVmtPMXh1WEc0Z0lDOHZJRlJvWlNCemRHRjBaU0JwY3lCaGRIUmhZMmhsWkNCMGJ5QjBhR1VnWm5WdVkzUnBiMjRnYjJKcVpXTjBJSE52SUdsMEozTWdZWFpoYVd4aFlteGxJSFJ2SUhSb1pWeHVJQ0F2THlCemRHRjBaUzFzWlhOeklHWjFibU4wYVc5dWN5QjNhR1Z1SUhKMWJtNXBibWNnZFc1a1pYSWdZSFJvYVhNdVlDNWNiaUFnWm00dVkyaGhhVzRnUFNCdWRXeHNPMXh1SUNCbWJpNXdZWEpsYm5RZ1BTQnVkV3hzTzF4dUlDQm1iaTV3WVhWelpXUWdQU0JtWVd4elpUdGNiaUFnWm00dWNtVnpiMngyWldRZ1BTQmJYVHRjYmlBZ1ptNHVabWx1WVd4cGVtVnljeUE5SUZ0ZE8xeHVYRzRnSUM4dklFVjRjRzl6WlNCMGFHVWdZbVZvWVhacGIzVnlJR2x1SUhSb1pTQm1kVzVqZEc5eVhHNGdJR1p1TG5CaGRYTmxJRDBnY0dGMWMyVTdYRzRnSUdadUxuSmxjM1Z0WlNBOUlISmxjM1Z0WlR0Y2JpQWdabTR1Wm05eWF5QTlJR1p2Y21zN1hHNGdJR1p1TG1wdmFXNGdQU0JxYjJsdU8xeHVJQ0JtYmk1bWFXNWhiR2w2WlNBOUlHWnBibUZzYVhwbE8xeHVYRzRnSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaG1iaXdnSjJWNGFHRjFjM1JsWkNjc0lIdGNiaUFnSUNCblpYUTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxuSmxjMjlzZG1Wa0xteGxibWQwYUNBK1BTQjBhR2x6TG1Ob1lXbHVMbDlmWlhod1pXTjBZWFJwYjI1elgxOHViR1Z1WjNSb08xeHVJQ0FnSUgxY2JpQWdmU2s3WEc1Y2JpQWdjbVYwZFhKdUlHWnVPMXh1ZlZ4dVhHNHZMeUJVYUdseklHbHpJSFJvWlNCamIzSmxJSEpsYzI5c2RYUnBiMjRnWVd4bmIzSnBkR2h0TENCcGRDQnZjR1Z5WVhSbGN5QnZkbVZ5SUhSb1pTQmphR0ZwYmx4dUx5OGdiMllnWlhod1pXTjBZWFJwYjI1eklHTm9aV05yYVc1bklIUm9aVzBnYjI1bElHRm1kR1Z5SUhSb1pTQnZkR2hsY2lCaFoyRnBibk4wSUdFZ2RtRnNkV1V1WEc0dkx5QkpaaUJoSUdaMWJtTjBhVzl1SUdseklISmxkSFZ5Ym1Wa0lHbDBKMnhzSUdKbElHbHRiV1ZrYVdGMFpXeDVJR05oYkd4bFpDQjFjMmx1WnlCMGFHVmNiaTh2SUdWNGNHVmpkR0YwYVc5dUlHbHVjM1JoYm1ObElHRnpJR052Ym5SbGVIUWdZVzVrSUhCaGMzTnBibWNnWVhNZ2IyNXNlU0JoY21kMWJXVnVkQ0IwYUdWY2JpOHZJR04xY25KbGJuUWdjbVZ6YjJ4MlpTQm1kVzVqZEdsdmJpd2dkR2hwY3lCaGJHeHZkM01nWVc0Z1pYaHdaV04wWVhScGIyNGdkRzhnYjNabGNuSnBaR1ZjYmk4dklIUm9aU0IyWVd4MVpTQmhibVF2YjNJZ1kyOXVkSEp2YkNCMGFHVWdjbVZ6YjJ4MWRHbHZiaUIzYVhSb2IzVjBJR1Y0Y0c5emFXNW5JSFJ2YnlCdFlXNTVYRzR2THlCcGJuUmxjbTVoYkNCa1pYUmhhV3h6TGx4dUx5OGdWMmhsYmlCcGRDQnlaWFIxY201eklHQjFibVJsWm1sdVpXUmdJR2wwSUdwMWMzUWdiV1ZoYm5NZ2RHaGhkQ0IwYUdVZ2NtVnpiMngxZEdsdmJpQjNZWE5jYmk4dklIQmhkWE5sWkNBb1lYTjVibU1wTENCM1pTQmpZVzRnYm05MElHOWlkR0ZwYmlCaElHWnBibUZzSUhKbGMzVnNkQ0IxYzJsdVp5QmhJSE41Ym1Ob2NtOXViM1Z6WEc0dkx5QmpZV3hzTGlCVWFHbHpJR05oYmlCaVpTQjFjMlZrSUdKNUlHMWhkR05vWlhKeklIZG9aVzRnZEdGcmFXNW5JRzkyWlhJZ2RHaGxJSEpsYzI5c2RYUnBiMjRnZEc5Y2JpOHZJR3R1YjNjZ2FXWWdkR2hsZVNCdVpXVmtJSFJ2SUcxaGJtZHNaU0IwYUdVZ2NtVnpkV3gwY3lCdmNpQjBhR1Y1SUdoaGRtVWdkRzhnY21WbmFYTjBaWElnWVZ4dUx5OGdabWx1WVd4cGVtVnlJSFJ2SUdKbElHNXZkR2xtYVdWa0lHOW1JSFJvWlNCbWFXNWhiQ0J5WlhOMWJIUWdabkp2YlNCMGFHVWdZMmhoYVc0dVhHNW1kVzVqZEdsdmJpQnlaWE52YkhabGNpQW9kbUZzZFdVcElIdGNiaUFnZG1GeUlHeHBjM1FzSUhKbGMzVnNkQ3dnWlhod08xeHVYRzRnSUd4cGMzUWdQU0IwYUdsekxtTm9ZV2x1TGw5ZlpYaHdaV04wWVhScGIyNXpYMTg3WEc0Z0lHOW1abk5sZENBOUlIUm9hWE11Y21WemIyeDJaV1F1YkdWdVozUm9PMXh1SUNCeVpYTjFiSFFnUFNCMGNuVmxPMXh1WEc0Z0lHWnZjaUFvZG1GeUlHa2dQU0J2Wm1aelpYUTdJR2tnUENCc2FYTjBMbXhsYm1kMGFEc2dhU3NyS1NCN1hHNGdJQ0FnTHk4Z1EzSmxZWFJsSUdFZ2JtVjNJRzlpYW1WamRDQnBibWhsY21sMGFXNW5JR1p5YjIwZ2RHaGxJR1Y0Y0dWamRHRjBhVzl1SUdKMWRDQjNhWFJvSUhSb1pWeHVJQ0FnSUM4dklHTjFjbkpsYm5RZ1lXTjBkV0ZzSUhaaGJIVmxJSEJ5YjNacGMybHZibVZrTGlCSmRDQmhiR3h2ZDNNZ2RHaGxJR1Y0Y0hKbGMzTnBiMjRnZEc4Z2JYVjBZWFJsWEc0Z0lDQWdMeThnYVhSeklITjBZWFJsSUdadmNpQjBhR2x6SUdWNFpXTjFkR2x2YmlCaWRYUWdibTkwSUdGbVptVmpkQ0J2ZEdobGNpQjFjMlZ6SUc5bUlHbDBMbHh1SUNBZ0lHVjRjQ0E5SUhWMGFXd3VZM0psWVhSbEtHeHBjM1JiYVYwc0lIc2dZV04wZFdGc09pQjJZV3gxWlNCOUtUdGNibHh1SUNBZ0lDOHZJRXRsWlhBZ2RISmhZMnNnYjJZZ2NtVnpiMngyWldRZ1pYaHdaV04wWVhScGIyNXpYRzRnSUNBZ2RHaHBjeTV5WlhOdmJIWmxaQzV3ZFhOb0tHVjRjQ2s3WEc1Y2JpQWdJQ0F2THlCRmVHVmpkWFJsSUhSb1pTQmxlSEJsWTNSaGRHbHZiaUIwYnlCdlluUmhhVzRnYVhSeklISmxjM1ZzZEZ4dUlDQWdJSEpsYzNWc2RDQTlJR1Y0Y0M1eVpYTjFiSFFnUFNCbGVIQXVjbVZ6YjJ4MlpTZ3BPMXh1WEc0Z0lDQWdMeThnUVd4c2IzY2daWGh3WldOMFlYUnBiMjV6SUhSdklIUmhhMlVnWTI5dWRISnZiQ0JtYjNJZ2RHaGxJSEpsYldGcGJtbHVaeUJ2WmlCMGFHVWdZMmhoYVc1Y2JpQWdJQ0JwWmlBb2RIbHdaVzltSUhKbGMzVnNkQ0E5UFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lDQWdMeThnVTJsdVkyVWdkR2hsSUdOdmJuUnliMndnYVhNZ1pHVnNaV2RoZEdWa0lIUnZJSFJvWlNCbGVIQnlaWE56YVc5dUlIZGxJR1J2YmlkMElHaGhkbVVnZEc5Y2JpQWdJQ0FnSUM4dklHUnZJR0Z1ZVhSb2FXNW5JRzF2Y21VZ2FHVnlaUzVjYmlBZ0lDQWdJSEpsZEhWeWJpQmxlSEF1Y21WemRXeDBJRDBnY21WemRXeDBMbU5oYkd3b1pYaHdMQ0IwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdkx5QlRkRzl3SUc5dUlHWnBjbk4wSUdaaGFXeDFjbVZjYmlBZ0lDQnBaaUFvY21WemRXeDBJRDA5UFNCbVlXeHpaU2tnZTF4dUlDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JpQWdMeThnUVhRZ2RHaHBjeUJ3YjJsdWRDQjNaU0JxZFhOMElHNWxaV1FnZEc4Z1lYQndiSGtnWVc1NUlIQmxibVJwYm1jZ1ptbHVZV3hwZW1WeWMxeHVJQ0J5WlhSMWNtNGdkR2hwY3k1bWFXNWhiR2w2WlNoeVpYTjFiSFFwTzF4dWZWeHVYRzVjYmk4dklGZG9aVzRnY21WemIyeDJhVzVuSUdGemVXNWpJR1pzYjNkeklDaHBMbVV1T2lCd2NtOXRhWE5sY3lrZ2RHaHBjeUIzYVd4c0lIQmhkWE5sSUhSb1pTQm5hWFpsYmx4dUx5OGdjbVZ6YjJ4MlpYSWdkVzUwYVd3Z1lTQmpZV3hzSUhSdklDNXlaWE4xYldVb0tTQnBjeUJ0WVdSbExseHVablZ1WTNScGIyNGdjR0YxYzJVZ0tDa2dlMXh1SUNCcFppQW9kR2hwY3k1d1lYVnpaV1FwSUh0Y2JpQWdJQ0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KMUpsYzI5c2RtVnlJR0ZzY21WaFpIa2djR0YxYzJWa0p5azdYRzRnSUgxY2JseHVJQ0IwYUdsekxuQmhkWE5sWkNBOUlIUnlkV1U3WEc1OVhHNWNiaTh2SUU5dVkyVWdkR2hsSUdGemVXNWpJR1pzYjNjZ2FHRnpJR052YlhCc1pYUmxaQ0IzWlNCallXNGdZMjl1ZEdsdWRXVWdjbVZ6YjJ4MmFXNW5JSGRvWlhKbElIZGxYRzR2THlCemRHOXdaV1F1SUZkb1pXNGdkR2hsSUc5MlpYSnlhV1JsSUhCaGNtRnRJR2x6SUc1dmRDQjFibVJsWm1sdVpXUWdkMlVuYkd3Z2MydHBjQ0JqWVd4c2FXNW5JSFJvWlZ4dUx5OGdjbVZ6YjJ4MlpYSWdZVzVrSUdGemMzVnRaU0IwYUdGMElHSnZiMndnWVhNZ2RHaGxJR1pwYm1Gc0lISmxjM1ZzZEM0Z1ZHaHBjeUJoYkd4dmQzTWdkR2hsSUdGemVXNWpYRzR2THlCamIyUmxJSFJ2SUhOb2IzSjBZM1YwSUhSb1pTQnlaWE52YkhabGNpNWNibVoxYm1OMGFXOXVJSEpsYzNWdFpTQW9ZV04wZFdGc0xDQnZkbVZ5Y21sa1pTa2dlMXh1SUNCcFppQW9JWFJvYVhNdWNHRjFjMlZrS1NCN1hHNGdJQ0FnZEdoeWIzY2dibVYzSUVWeWNtOXlLQ2RTWlhOdmJIWmxjaUJwY3lCdWIzUWdZM1Z5Y21WdWRHeDVJSEJoZFhObFpDY3BPMXh1SUNCOVhHNWNiaUFnZEdocGN5NXdZWFZ6WldRZ1BTQm1ZV3h6WlR0Y2JseHVJQ0F2THlCQklHWnBibUZzSUhKbGMzVnNkQ0IzWVhNZ2NISnZkbWxrWldRZ2MyOGdhblZ6ZENCbWFXNWhiR2w2WlNCMGFHVWdjbVZ6YjJ4MlpYSmNiaUFnYVdZZ0tHOTJaWEp5YVdSbElDRTlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1bWFXNWhiR2w2WlNodmRtVnljbWxrWlNrN1hHNGdJSDFjYmx4dUlDQXZMeUJNWlhRbmN5QmpiMjUwYVc1MVpTQnlaWE52YkhacGJtY2dkMmwwYUNCMGFHVWdibVYzSUhaaGJIVmxYRzRnSUM4dklFNXZkR1U2SUhSb2FYTW9LU0JzYjI5cmN5QjNaV2x5WkNCaWRYUWdjbVZ0WlcxaVpYSWdkMlVuY21VZ2RYTnBibWNnWVNCbWRXNWpkR2x2YmlCaGN5QmpiMjUwWlhoMFhHNGdJSEpsZEhWeWJpQjBhR2x6S0dGamRIVmhiQ2s3WEc1OVhHNWNiaTh2SUVOc2IyNWxjeUIwYUdVZ1kzVnljbVZ1ZENCeVpYTnZiSFpsY2lCemJ5QjNaU0JqWVc0Z1ptOXlheUJoYm1RZ1pHbHpZMkZ5WkNCdmNHVnlZWFJwYjI1ekxseHVablZ1WTNScGIyNGdabTl5YXlBb0tTQjdYRzRnSUhaaGNpQm1iM0pySUQwZ1lXTnhkV2x5WlNoMGFHbHpMbU5vWVdsdUtUdGNiaUFnWm05eWF5NXdZWEpsYm5RZ1BTQjBhR2x6TzF4dUlDQm1iM0pyTG5KbGMyOXNkbVZrSUQwZ1h5NXlaV3BsWTNRb2RHaHBjeTV5WlhOdmJIWmxaQ3dnUVhKeVlYa3VhWE5CY25KaGVTazdYRzRnSUhKbGRIVnliaUJtYjNKck8xeHVmVnh1WEc0dkx5QkJjM04xYldVZ2RHaGxJSEpsYzNWc2RITWdabkp2YlNCaElHWnZjbXNnYVc0Z2RHaGxJRzFoYVc0Z2NtVnpiMngyWlhKY2JtWjFibU4wYVc5dUlHcHZhVzRnS0dadmNtc3BJSHRjYmlBZ2RtRnlJR3hsYmlBOUlGOHVjbVZxWldOMEtIUm9hWE11Y21WemIyeDJaV1FzSUVGeWNtRjVMbWx6UVhKeVlYa3BMbXhsYm1kMGFEdGNiaUFnZEdocGN5NXlaWE52YkhabFpDNXdkWE5vS0Z4dUlDQWdJR1p2Y21zdWNtVnpiMngyWldRdWMyeHBZMlVvYkdWdUtWeHVJQ0FwTzF4dWZWeHVYRzR2THlCWGFHVnVJSFJvWlNCaGNtZDFiV1Z1ZENCcGN5QmhJR1oxYm1OMGFXOXVJR2wwSUdkbGRITWdjbVZuYVhOMFpYSmxaQ0JoY3lCaElHWnBibUZzYVhwbGNpQm1iM0lnZEdobFhHNHZMeUJ5WlhOMWJIUWdiMkowWVdsdVpXUWdiMjVqWlNCMGFHVWdaWGh3Y21WemMybHZiaUJvWVhNZ1ltVmxiaUJtZFd4c2VTQnlaWE52YkhabFpDQW9hUzVsTGlCaGMzbHVZeWt1WEc0dkx5QlBkR2hsY25kcGMyVWdhWFFuYkd3Z1pYaGxZM1YwWlNCaGJua2djbVZuYVhOMFpYSmxaQ0JtZFc1amRHbHZibk1nYjI0Z2RHaGxJR2RwZG1WdUlISmxjM1ZzZENCaGJtUmNiaTh2SUdGc2JHOTNJSFJvWlcwZ2RHOGdZMmhoYm1kbElHbDBJR0psWm05eVpTQnlaV3hsWVhOcGJtY2dkR2hsSUhKbGMyOXNkbVZ5SUdsdWRHOGdkR2hsSUhCdmIyd3VYRzVtZFc1amRHbHZiaUJtYVc1aGJHbDZaU2h5WlhOMWJIUXBJSHRjYmlBZ2FXWWdLSFI1Y0dWdlppQnlaWE4xYkhRZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0IwYUdsekxtWnBibUZzYVhwbGNuTXVjSFZ6YUNoY2JpQWdJQ0FnSUZ0eVpYTjFiSFFzSUY4dWJHRnpkQ2gwYUdsekxuSmxjMjlzZG1Wa0tWMWNiaUFnSUNBcE8xeHVJQ0FnSUhKbGRIVnlianRjYmlBZ2ZWeHVYRzRnSUM4dklFNXZkR2hwYm1jZ2VXVjBJSFJ2SUdacGJtRnNhWHBsSUhOcGJtTmxJSFJvWlNCeVpYTjFiSFFnYVhNZ2MzUnBiR3dnZFc1cmJtOTNibHh1SUNCcFppQW9jbVZ6ZFd4MElEMDlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtPMXh1SUNCOVhHNWNiaUFnTHk4Z1FXeHNiM2NnWm1sdVlXeHBlbVZ5Y3lCMGJ5QjBiMmRuYkdVZ2RHaGxJSEpsYzNWc2RDQW9URWxHVHlCdmNtUmxjaWxjYmlBZ2RtRnlJR1pwYm1Gc2FYcGxjanRjYmlBZ2QyaHBiR1VnS0hSb2FYTXVabWx1WVd4cGVtVnljeTVzWlc1bmRHZ2dQaUF3S1NCN1hHNGdJQ0FnWm1sdVlXeHBlbVZ5SUQwZ2RHaHBjeTVtYVc1aGJHbDZaWEp6TG5CdmNDZ3BPMXh1SUNBZ0lISmxjM1ZzZENBOUlHWnBibUZzYVhwbGNsc3dYUzVqWVd4c0tHWnBibUZzYVhwbGNsc3hYU3dnY21WemRXeDBLVHRjYmlBZ0lDQm1hVzVoYkdsNlpYSmJNVjB1Y21WemRXeDBJRDBnY21WemRXeDBPMXh1SUNCOVhHNWNiaUFnTHk4Z1RHVjBJSFJvWlNCamFHRnBiaUJrYVhOd1lYUmphQ0IwYUdVZ1ptbHVZV3dnY21WemRXeDBJR0oxZENCdmJteDVJR1p2Y2lCdWIyNHRabTl5YTJWa0lISmxjMjlzZG1WeWMxeHVJQ0JwWmlBb0lYUm9hWE11Y0dGeVpXNTBLU0I3WEc0Z0lDQWdkR2hwY3k1amFHRnBiaTVrYVhOd1lYUmphRkpsYzNWc2RDaDBhR2x6TG5KbGMyOXNkbVZrTENCeVpYTjFiSFFwTzF4dUlDQjlYRzVjYmlBZ0x5OGdWMmhsYmlCaElHWnBibUZzSUhKbGMzVnNkQ0JvWVhNZ1ltVmxiaUJ2WW5SaGFXNWxaQ0J5Wld4bFlYTmxJSFJvWlNCeVpYTnZiSFpsY2lCMGJ5QjBhR1VnY0c5dmJGeHVJQ0J3YjI5c0xuQjFjMmdvZEdocGN5azdYRzRnSUdsbUlDaHdiMjlzTG14bGJtZDBhQ0ErSUdOeVpXRjBaV1FwSUh0Y2JpQWdJQ0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KMUJ2YjJ3Z1kyOXljblZ3ZEdWa0lTQkRjbVZoZEdWa0lDY2dLeUJqY21WaGRHVmtJQ3NnSnlCaWRYUWdkR2hsY21VZ1lYSmxJQ2NnS3lCd2IyOXNMbXhsYm1kMGFDQXJJQ2NnY0c5dmJHVmtKeWs3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnY21WemRXeDBPMXh1ZlZ4dVhHNHZMeUJCWTNGMWFYSmxjeUJoSUhKbGMyOXNkbVZ5SUdaMWJtTjBiM0lzSUdsbUlIUm9aWEpsSUdseklHOXVaU0JwYmlCMGFHVWdjRzl2YkNCcGRDZHNiQ0JpWlNCeVpYTmxkQ0JoYm1SY2JpOHZJSEpsZFhObFpDd2diM1JvWlhKM2FYTmxJR2wwSjJ4c0lHTnlaV0YwWlNCaElHNWxkeUJ2Ym1VdUlGZG9aVzRnZVc5MUozSmxJR1J2Ym1VZ2QybDBhQ0IwYUdVZ2NtVnpiMngyWlhKY2JpOHZJSGx2ZFNCemFHOTFaQ0JuYVhabElHbDBJSFJ2SUdCeVpXeGxZWE5sS0NsZ0lITnZJR2wwSUdOaGJpQmlaU0JwYm1OdmNuQnZjbUYwWldRZ2RHOGdkR2hsSUhCdmIyd3VYRzR2THlCVWFHVWdjbVZoYzI5dUlHWnZjaUIxYzJsdVp5QmhJSEJ2YjJ3Z2IyWWdiMkpxWldOMGN5Qm9aWEpsSUdseklIUm9ZWFFnWlhabGNua2dkR2x0WlNCM1pTQmxkbUZzZFdGMFpWeHVMeThnWVc0Z1pYaHdjbVZ6YzJsdmJpQjNaU2RzYkNCdVpXVmtJR0VnY21WemIyeDJaWElzSUhkb1pXNGdkWE5wYm1jZ2NYVmhiblJwWm1sbGNuTWdiWFZzZEdsd2JHVWdabTl5YTNOY2JpOHZJSGRwYkd3Z1ltVWdZM0psWVhSbFpDd2djMjhnYVhRbmN5QnBiWEJ2Y25SaGJuUWdkRzhnYVcxd2NtOTJaU0IwYUdVZ2NHVnlabTl5YldGdVkyVXVYRzVtZFc1amRHbHZiaUJoWTNGMWFYSmxJQ2hqYUdGcGJpa2dlMXh1SUNCMllYSWdjbVZ6YjJ4MlpYSWdQU0J3YjI5c0xuQnZjQ2dwSUh4OElHWmhZM1J2Y25rb0tUdGNibHh1SUNBdkx5QlNaWE5sZENCMGFHVWdjM1JoZEdVZ2IyWWdkR2hsSUhKbGMyOXNkbVZ5WEc0Z0lISmxjMjlzZG1WeUxtTm9ZV2x1SUQwZ1kyaGhhVzQ3WEc0Z0lISmxjMjlzZG1WeUxuQmhjbVZ1ZENBOUlHNTFiR3c3WEc0Z0lISmxjMjlzZG1WeUxuQmhkWE5sWkNBOUlHWmhiSE5sTzF4dUlDQjNhR2xzWlNBb2NtVnpiMngyWlhJdWNtVnpiMngyWldRdWJHVnVaM1JvSUQ0Z01Da2dlMXh1SUNBZ0lISmxjMjlzZG1WeUxuSmxjMjlzZG1Wa0xuQnZjQ2dwTzF4dUlDQjlYRzRnSUhkb2FXeGxJQ2h5WlhOdmJIWmxjaTVtYVc1aGJHbDZaWEp6TG14bGJtZDBhQ0ErSURBcElIdGNiaUFnSUNCeVpYTnZiSFpsY2k1bWFXNWhiR2w2WlhKekxuQnZjQ2dwTzF4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUhKbGMyOXNkbVZ5TzF4dWZWeHVYRzVjYm1WNGNHOXlkSE11WVdOeGRXbHlaU0E5SUdGamNYVnBjbVU3WEc0aVhYMD0iLCIvLyBTdXBwb3J0IGZvciAuc2hvdWxkIHN0eWxlIHN5bnRheCwgbm90aWNlIHRoYXQgd2hpbGUgaGVyZSByZXNpZGVzIHRoZSBjb3JlXG4vLyBsb2dpYyBmb3IgaXQsIHRoZSBpbnRlcmZhY2UgaXMgZG9uZSBpbiBhc3MuanMgaW4gb3JkZXIgdG8gbWFrZSBpdCByZXR1cm5cbi8vIHRoZSBgYXNzYCBmdW5jdGlvbiBhbmQgcHJvdmlkZSBzdXBwb3J0IGZvciBpdHMgdXNlIG9uIGJlZm9yZUVhY2gvYWZ0ZXJFYWNoLlxuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG5cblxudmFyIERFRkFVTFRfUFJPUCA9ICdzaG91bGQnO1xuXG4vLyBJbnN0YWxscyB0aGUgdHlwaWNhbCAuc2hvdWxkIHByb3BlcnR5IG9uIHRoZSByb290IE9iamVjdCBwcm90b3R5cGUuXG4vLyBZb3UgY2FuIGluc3RhbGwgdW5kZXIgYW55IG5hbWUgb2YgeW91ciBjaG9vc2luZyBieSBnaXZpbmcgaXQgYXMgYXJndW1lbnQuXG4vL1xuLy8gQmFzaWNhbGx5IGJvcnJvd2VkIGZyb20gdGhlIENoYWkgcHJvamVjdDpcbi8vICBDb3B5cmlnaHQoYykgMjAxMS0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS9pbnRlcmZhY2Uvc2hvdWxkLmpzXG5mdW5jdGlvbiBzaG91bGQgKG5hbWUpIHtcbiAgaWYgKG5hbWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gc2hvdWxkLnJlc3RvcmUoKTtcbiAgfVxuXG4gIG5hbWUgPSBuYW1lIHx8IERFRkFVTFRfUFJPUDtcblxuICBpZiAobmFtZSBpbiBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgaWYgKCFDaGFpbi5pc0NoYWluKE9iamVjdC5wcm90b3R5cGVbbmFtZV0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Fzcy5zaG91bGQ6IE9iamVjdC5wcm90b3R5cGUgYWxyZWFkeSBoYXMgYSAuJyArIG5hbWUgKyAnIHByb3BlcnR5Jyk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIG1vZGlmeSBPYmplY3QucHJvdG90eXBlIHRvIGhhdmUgYDxuYW1lPmBcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChDaGFpbi5pc0NoYWluKHRoaXMpKSB7XG4gICAgICAgIC8vIEFjdHVhbGx5IENoYWluIGluc3RhbmNlcyBkb24ndCBpbmhlcml0IGZyb20gT2JqZWN0IGJ1dCBzdGlsbFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0gZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIFN0cmluZyB8fCB0aGlzIGluc3RhbmNlb2YgTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcy5jb25zdHJ1Y3Rvcih0aGlzKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMgaW5zdGFuY2VvZiBCb29sZWFuKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyA9PSB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ2hhaW4odGhpcyk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gQWxsb3c6IGdsb2JhbC5hc3MgPSByZXF1aXJlKCdhc3MnKS5zaG91bGQoKVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgIC8vIEFsbG93IHJlc3RvcmF0aW9uXG4gICAgZW51bWVyYWJsZTogZmFsc2VcbiAgfSk7XG5cbiAgLy8gRXhwb3NlIGl0IGFzIGEgbm8tb3Agb24gQ2hhaW5zIHNpbmNlIHRoZXkgZG9uJ3QgaW5oZXJpdCBmcm9tIE9iamVjdFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ2hhaW4ucHJvdG90eXBlLCBuYW1lLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSAgLy8gQWxsb3cgcmVzdG9yYXRpb25cbiAgfSk7XG5cbn1cblxuc2hvdWxkLnJlc3RvcmUgPSBmdW5jdGlvbiAobmFtZSkge1xuICBuYW1lID0gbmFtZSB8fCBERUZBVUxUX1BST1A7XG5cbiAgaWYgKG5hbWUgaW4gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIGlmIChDaGFpbi5pc0NoYWluKE9iamVjdC5wcm90b3R5cGVbbmFtZV0pKSB7XG4gICAgICBkZWxldGUgT2JqZWN0LnByb3RvdHlwZVtuYW1lXTtcbiAgICAgIGRlbGV0ZSBDaGFpbi5wcm90b3R5cGVbbmFtZV07XG4gICAgfVxuICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdWxkO1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxuLy8gR2V0IHRoZSBuYXRpdmUgUHJvbWlzZSBvciBhIHNoaW1cbmV4cG9ydHMuUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlIHx8ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LndpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwud2luZG93IDogbnVsbCkuUHJvbWlzZTtcblxuXG4vLyBDYXBwZWQgcG9vbCB0byBsaW1pdCB0aGUgbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBjYW4gYmVcbi8vIHN0b3JlZCAodW5ib3VuZGVkIGJ5IGRlZmF1bHQpLlxuZXhwb3J0cy5DYXBwZWRQb29sID0gZnVuY3Rpb24gKG1heCkge1xuICB2YXIgcG9vbCA9IFtdO1xuXG4gIG1heCA9IG1heCB8fCBOdW1iZXIuTUFYX1ZBTFVFO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwb29sLCAncHVzaCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA8IG1heCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKHRoaXMsIHYpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHBvb2w7XG59O1xuXG5cbnZhciBkb0NvbG9ycyA9IF8ub25jZShmdW5jdGlvbiAoKSB7XG4gIC8vIE1hc3RlciBvdmVycmlkZSB3aXRoIG91ciBjdXN0b20gZW52IHZhcmlhYmxlXG4gIGlmIChwcm9jZXNzLmVudi5BU1NfQ09MT1JTICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gL3RydWV8b258eWVzfGVuYWJsZWQ/fDEvaS50ZXN0KHByb2Nlc3MuZW52LkFTU19DT0xPUlMpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgS2FybWEgaXMgYmVpbmcgdXNlZCBhbmQgaGFzIGRlZmluZWQgdGhlIGNvbG9yc1xuICB2YXIga2FybWEgPSBnbG9iYWwuX19rYXJtYV9fO1xuICBpZiAoa2FybWEgJiYga2FybWEuY29uZmlnICYmIHR5cGVvZiBrYXJtYS5jb25maWcuY29sb3JzICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBrYXJtYS5jb25maWcuY29sb3JzO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgbW9jaGEgaXMgYXJvdW5kIGFuZCB2ZXJpZnkgYWdhaW5zdCBpdHMgY29uZmlndXJhdGlvblxuICB2YXIgTW9jaGEgPSBnbG9iYWwuTW9jaGE7XG4gIGlmIChNb2NoYSA9PT0gdW5kZWZpbmVkICYmIHJlcXVpcmUucmVzb2x2ZSAmJiByZXF1aXJlLnJlc29sdmUoJ21vY2hhJykpIHtcbiAgICBNb2NoYSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Lk1vY2hhIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5Nb2NoYSA6IG51bGwpO1xuICB9XG4gIGlmIChNb2NoYSAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycyAhPT0gdW5kZWZpbmVkICYmIE1vY2hhLnJlcG9ydGVycy5CYXNlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gTW9jaGEucmVwb3J0ZXJzLkJhc2UudXNlQ29sb3JzO1xuICB9XG5cbiAgLy8gUXVlcnkgdGhlIGVudmlyb25tZW50IGFuZCBzZWUgaWYgc29tZSBjb21tb24gdmFyaWFibGVzIGFyZSBzZXRcbiAgaWYgKHByb2Nlc3MuZW52Lk1PQ0hBX0NPTE9SUyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKC8tLWNvbG9yPWFsd2F5cy8udGVzdChwcm9jZXNzLmVudi5HUkVQX09QVElPTlMgfHwgJycpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBGaW5hbGx5IGp1c3QgY2hlY2sgaWYgdGhlIGVudmlyb25tZW50IGlzIGNhcGFibGVcbiAgdmFyIHR0eSA9IHJlcXVpcmUoJ3R0eScpO1xuICByZXR1cm4gdHR5LmlzYXR0eSgxKSAmJiB0dHkuaXNhdHR5KDIpO1xufSk7XG5cblxuLy8gUmVtb3ZlIEFOU0kgZXNjYXBlcyBmcm9tIGEgc3RyaW5nXG5mdW5jdGlvbiB1bmFuc2kgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xceDFiXFxbKFxcZCs7PykrW2Etel0vZ2ksICcnKTtcbn1cblxuXG4vLyBBdm9pZCByZXBlYXRlZCBjb21waWxhdGlvbnMgYnkgbWVtb2l6aW5nXG52YXIgY29tcGlsZVRlbXBsYXRlID0gXy5tZW1vaXplKGZ1bmN0aW9uICh0cGwpIHtcbiAgcmV0dXJuIF8udGVtcGxhdGUodHBsLCBudWxsLCB7XG4gICAgZXNjYXBlOiAvXFx7XFx7KFtcXHNcXFNdKz8pXFx9XFx9L2dcbiAgfSk7XG59KTtcblxuLy8gRHVtcHMgYXJiaXRyYXJ5IHZhbHVlcyBhcyBzdHJpbmdzIGluIGEgY29uY2lzZSB3YXlcbi8vIFRPRE86IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvY2hhaS9ibG9iL21hc3Rlci9saWIvY2hhaS91dGlscy9vYmpEaXNwbGF5LmpzXG5mdW5jdGlvbiB2YWx1ZUR1bXBlciAodikge1xuICB2YXIgdmFsdWU7XG5cbiAgaWYgKF8uaXNOdW1iZXIodikgfHwgXy5pc05hTih2KSB8fCBfLmlzQm9vbGVhbih2KSB8fCBfLmlzTnVsbCh2KSB8fCBfLmlzVW5kZWZpbmVkKHYpKSB7XG4gICAgdmFsdWUgPSAnPCcgKyB2ICsgJz4nO1xuICB9IGVsc2UgaWYgKF8uaXNSZWdFeHAodikpIHtcbiAgICB2YWx1ZSA9IHYudG9TdHJpbmcoKTtcbiAgfSBlbHNlIGlmIChfLmlzRnVuY3Rpb24odikpIHtcbiAgICBpZiAodi5kaXNwbGF5TmFtZSkge1xuICAgICAgdmFsdWUgPSB2LmRpc3BsYXlOYW1lICsgJygpJztcbiAgICB9IGVsc2UgaWYgKHYubmFtZSkge1xuICAgICAgdmFsdWUgPSB2Lm5hbWUgKyAnKCknO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9ICc8ZnVuY3Rpb24+JztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfVxuXG4gIHJldHVybiAnXFx1MDAxYlsxOzM2bScgKyB2YWx1ZSArICdcXHUwMDFiWzBtJztcbn1cblxuXG4vLyBDdXN0b21pemVkIHZlcnNpb24gb2YgbG9kYXNoIHRlbXBsYXRlXG5mdW5jdGlvbiB0ZW1wbGF0ZSAodHBsLCBjb250ZXh0KSB7XG4gIHZhciBmbiA9IGNvbXBpbGVUZW1wbGF0ZSh0cGwpO1xuICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIG9yaWdFc2NhcGUgPSBfLmVzY2FwZTtcbiAgdHJ5IHtcbiAgICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBlc2NhcGUgZnVuY3Rpb24gdG8gdXNlIGl0IGZvciBkdW1waW5nIGZvcm1hdHRlZCB2YWx1ZXNcbiAgICBfLmVzY2FwZSA9IHZhbHVlRHVtcGVyO1xuXG4gICAgcmV0dXJuIGZuKGNvbnRleHQpO1xuXG4gIH0gZmluYWxseSB7XG4gICAgXy5lc2NhcGUgPSBvcmlnRXNjYXBlO1xuICB9XG59XG5cbi8vIEEgc2ltcGxlIGZhc3QgZnVuY3Rpb24gYmluZGluZyBwcmltaXRpdmUgb25seSBzdXBwb3J0aW5nIHNldHRpbmcgdGhlIGNvbnRleHRcbmZ1bmN0aW9uIGJpbmQoZm4sIHRoaXNBcmcpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpc0FyZywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxuLy8gUXVpY2tseSBjcmVhdGVzIGEgbmV3IG9iamVjdCB3aXRoIGEgY3VzdG9tIHByb3RvdHlwZSBhbmQgc29tZSB2YWx1ZVxuLy8gb3ZlcnJpZGVzLlxuZnVuY3Rpb24gY3JlYXRlKHByb3RvLCB2YWx1ZXMpIHtcbiAgaWYgKDAgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEhBQ0s6IFVzZSBGdW5jdGlvbi5wcm90b3R5cGUgKyBuZXcgaW5zdGVhZCBvZiB0aGUgc2xvdy1pc2ggT2JqZWN0LmNyZWF0ZVxuICBjcmVhdGUucHJvdG90eXBlID0gcHJvdG87XG4gIHJldHVybiBfLmFzc2lnbihuZXcgY3JlYXRlLCB2YWx1ZXMgfHwge30pO1xufVxuXG5cbi8vIEZyb20gaHR0cDovL3NpZGVyaXRlLmJsb2dzcG90LmNvbS8yMDE0LzExL3N1cGVyLWZhc3QtYW5kLWFjY3VyYXRlLXN0cmluZy1kaXN0YW5jZS5odG1sXG5mdW5jdGlvbiBzaWZ0NChzMSwgczIsIG1heE9mZnNldCkge1xuICBpZiAoIXMxIHx8ICFzMS5sZW5ndGgpIHtcbiAgICBpZiAoIXMyKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHMyLmxlbmd0aDtcbiAgfVxuXG4gIGlmICghczIgfHwgIXMyLmxlbmd0aCkge1xuICAgIHJldHVybiBzMS5sZW5ndGg7XG4gIH1cblxuICB2YXIgbDEgPSBzMS5sZW5ndGg7XG4gIHZhciBsMiA9IHMyLmxlbmd0aDtcblxuICB2YXIgYzEgPSAwOyAgLy8gY3Vyc29yIGZvciBzdHJpbmcgMVxuICB2YXIgYzIgPSAwOyAgLy8gY3Vyc29yIGZvciBzdHJpbmcgMlxuICB2YXIgbGNzcyA9IDA7ICAvLyBsYXJnZXN0IGNvbW1vbiBzdWJzZXF1ZW5jZVxuICB2YXIgbG9jYWxfY3MgPSAwOyAvLyBsb2NhbCBjb21tb24gc3Vic3RyaW5nXG5cbiAgd2hpbGUgKChjMSA8IGwxKSAmJiAoYzIgPCBsMikpIHtcbiAgICBpZiAoczEuY2hhckF0KGMxKSA9PSBzMi5jaGFyQXQoYzIpKSB7XG4gICAgICBsb2NhbF9jcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBsY3NzICs9IGxvY2FsX2NzO1xuICAgICAgbG9jYWxfY3MgPSAwO1xuICAgICAgaWYgKGMxICE9IGMyKSB7XG4gICAgICAgIGMxID0gYzIgPSBNYXRoLm1heChjMSxjMik7IC8vIHVzaW5nIG1heCB0byBieXBhc3MgdGhlIG5lZWQgZm9yIGNvbXB1dGVyIHRyYW5zcG9zaXRpb25zICgnYWInIHZzICdiYScpXG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1heE9mZnNldDsgaSsrKSB7XG4gICAgICAgIGlmICgoYzEgKyBpIDwgbDEpICYmIChzMS5jaGFyQXQoYzEgKyBpKSA9PT0gczIuY2hhckF0KGMyKSkpIHtcbiAgICAgICAgICBjMSArPSBpO1xuICAgICAgICAgIGxvY2FsX2NzKys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChjMiArIGkgPCBsMikgJiYgKHMxLmNoYXJBdChjMSkgPT09IHMyLmNoYXJBdChjMiArIGkpKSkge1xuICAgICAgICAgIGMyICs9IGk7XG4gICAgICAgICAgbG9jYWxfY3MrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjMSsrO1xuICAgIGMyKys7XG4gIH1cbiAgbGNzcyArPSBsb2NhbF9jcztcbiAgcmV0dXJuIE1hdGgucm91bmQoTWF0aC5tYXgobDEsIGwyKSAtIGxjc3MpO1xufVxuXG5leHBvcnRzLmJpbmQgPSBiaW5kO1xuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGU7XG5leHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG5leHBvcnRzLnVuYW5zaSA9IHVuYW5zaTtcbmV4cG9ydHMuZG9Db2xvcnMgPSBkb0NvbG9ycztcbmV4cG9ydHMuc2lmdDQgPSBzaWZ0NDtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoJ19wcm9jZXNzJyksdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTkxZEdsc0xtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUoyWVhJZ1h5QTlJQ2gwZVhCbGIyWWdkMmx1Wkc5M0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdkMmx1Wkc5M0xsOGdPaUIwZVhCbGIyWWdaMnh2WW1Gc0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdaMnh2WW1Gc0xsOGdPaUJ1ZFd4c0tUdGNibHh1THk4Z1IyVjBJSFJvWlNCdVlYUnBkbVVnVUhKdmJXbHpaU0J2Y2lCaElITm9hVzFjYm1WNGNHOXlkSE11VUhKdmJXbHpaU0E5SUdkc2IySmhiQzVRY205dGFYTmxJSHg4SUNoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnZDJsdVpHOTNMbmRwYm1SdmR5QTZJSFI1Y0dWdlppQm5iRzlpWVd3Z0lUMDlJRndpZFc1a1pXWnBibVZrWENJZ1B5Qm5iRzlpWVd3dWQybHVaRzkzSURvZ2JuVnNiQ2t1VUhKdmJXbHpaVHRjYmx4dVhHNHZMeUJEWVhCd1pXUWdjRzl2YkNCMGJ5QnNhVzFwZENCMGFHVWdiV0Y0YVcxMWJTQnVkVzFpWlhJZ2IyWWdaV3hsYldWdWRITWdkR2hoZENCallXNGdZbVZjYmk4dklITjBiM0psWkNBb2RXNWliM1Z1WkdWa0lHSjVJR1JsWm1GMWJIUXBMbHh1Wlhod2IzSjBjeTVEWVhCd1pXUlFiMjlzSUQwZ1puVnVZM1JwYjI0Z0tHMWhlQ2tnZTF4dUlDQjJZWElnY0c5dmJDQTlJRnRkTzF4dVhHNGdJRzFoZUNBOUlHMWhlQ0I4ZkNCT2RXMWlaWEl1VFVGWVgxWkJURlZGTzF4dVhHNGdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNod2IyOXNMQ0FuY0hWemFDY3NJSHRjYmlBZ0lDQjJZV3gxWlRvZ1puVnVZM1JwYjI0Z0tIWXBJSHRjYmlBZ0lDQWdJR2xtSUNoMGFHbHpMbXhsYm1kMGFDQThJRzFoZUNrZ2UxeHVJQ0FnSUNBZ0lDQkJjbkpoZVM1d2NtOTBiM1I1Y0dVdWNIVnphQzVqWVd4c0tIUm9hWE1zSUhZcE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdmU2s3WEc1Y2JpQWdjbVYwZFhKdUlIQnZiMnc3WEc1OU8xeHVYRzVjYm5aaGNpQmtiME52Ykc5eWN5QTlJRjh1YjI1alpTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDOHZJRTFoYzNSbGNpQnZkbVZ5Y21sa1pTQjNhWFJvSUc5MWNpQmpkWE4wYjIwZ1pXNTJJSFpoY21saFlteGxYRzRnSUdsbUlDaHdjbTlqWlhOekxtVnVkaTVCVTFOZlEwOU1UMUpUSUNFOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQnlaWFIxY200Z0wzUnlkV1Y4YjI1OGVXVnpmR1Z1WVdKc1pXUS9mREV2YVM1MFpYTjBLSEJ5YjJObGMzTXVaVzUyTGtGVFUxOURUMHhQVWxNcE8xeHVJQ0I5WEc1Y2JpQWdMeThnUTJobFkyc2dhV1lnUzJGeWJXRWdhWE1nWW1WcGJtY2dkWE5sWkNCaGJtUWdhR0Z6SUdSbFptbHVaV1FnZEdobElHTnZiRzl5YzF4dUlDQjJZWElnYTJGeWJXRWdQU0JuYkc5aVlXd3VYMTlyWVhKdFlWOWZPMXh1SUNCcFppQW9hMkZ5YldFZ0ppWWdhMkZ5YldFdVkyOXVabWxuSUNZbUlIUjVjR1Z2WmlCcllYSnRZUzVqYjI1bWFXY3VZMjlzYjNKeklDRTlQU0FuZFc1a1pXWnBibVZrSnlrZ2UxeHVJQ0FnSUhKbGRIVnliaUJyWVhKdFlTNWpiMjVtYVdjdVkyOXNiM0p6TzF4dUlDQjlYRzVjYmlBZ0x5OGdRMmhsWTJzZ2FXWWdiVzlqYUdFZ2FYTWdZWEp2ZFc1a0lHRnVaQ0IyWlhKcFpua2dZV2RoYVc1emRDQnBkSE1nWTI5dVptbG5kWEpoZEdsdmJseHVJQ0IyWVhJZ1RXOWphR0VnUFNCbmJHOWlZV3d1VFc5amFHRTdYRzRnSUdsbUlDaE5iMk5vWVNBOVBUMGdkVzVrWldacGJtVmtJQ1ltSUhKbGNYVnBjbVV1Y21WemIyeDJaU0FtSmlCeVpYRjFhWEpsTG5KbGMyOXNkbVVvSjIxdlkyaGhKeWtwSUh0Y2JpQWdJQ0JOYjJOb1lTQTlJQ2gwZVhCbGIyWWdkMmx1Wkc5M0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdkMmx1Wkc5M0xrMXZZMmhoSURvZ2RIbHdaVzltSUdkc2IySmhiQ0FoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaUEvSUdkc2IySmhiQzVOYjJOb1lTQTZJRzUxYkd3cE8xeHVJQ0I5WEc0Z0lHbG1JQ2hOYjJOb1lTQWhQVDBnZFc1a1pXWnBibVZrSUNZbUlFMXZZMmhoTG5KbGNHOXlkR1Z5Y3lBaFBUMGdkVzVrWldacGJtVmtJQ1ltSUUxdlkyaGhMbkpsY0c5eWRHVnljeTVDWVhObElDRTlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdUVzlqYUdFdWNtVndiM0owWlhKekxrSmhjMlV1ZFhObFEyOXNiM0p6TzF4dUlDQjlYRzVjYmlBZ0x5OGdVWFZsY25rZ2RHaGxJR1Z1ZG1seWIyNXRaVzUwSUdGdVpDQnpaV1VnYVdZZ2MyOXRaU0JqYjIxdGIyNGdkbUZ5YVdGaWJHVnpJR0Z5WlNCelpYUmNiaUFnYVdZZ0tIQnliMk5sYzNNdVpXNTJMazFQUTBoQlgwTlBURTlTVXlBaFBUMGdkVzVrWldacGJtVmtLU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lIMWNiaUFnYVdZZ0tDOHRMV052Ykc5eVBXRnNkMkY1Y3k4dWRHVnpkQ2h3Y205alpYTnpMbVZ1ZGk1SFVrVlFYMDlRVkVsUFRsTWdmSHdnSnljcEtTQjdYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUgxY2JseHVJQ0F2THlCR2FXNWhiR3g1SUdwMWMzUWdZMmhsWTJzZ2FXWWdkR2hsSUdWdWRtbHliMjV0Wlc1MElHbHpJR05oY0dGaWJHVmNiaUFnZG1GeUlIUjBlU0E5SUhKbGNYVnBjbVVvSjNSMGVTY3BPMXh1SUNCeVpYUjFjbTRnZEhSNUxtbHpZWFIwZVNneEtTQW1KaUIwZEhrdWFYTmhkSFI1S0RJcE8xeHVmU2s3WEc1Y2JseHVMeThnVW1WdGIzWmxJRUZPVTBrZ1pYTmpZWEJsY3lCbWNtOXRJR0VnYzNSeWFXNW5YRzVtZFc1amRHbHZiaUIxYm1GdWMya2dLSE4wY2lrZ2UxeHVJQ0J5WlhSMWNtNGdjM1J5TG5KbGNHeGhZMlVvTDF4Y2VERmlYRnhiS0Z4Y1pDczdQeWtyVzJFdGVsMHZaMmtzSUNjbktUdGNibjFjYmx4dVhHNHZMeUJCZG05cFpDQnlaWEJsWVhSbFpDQmpiMjF3YVd4aGRHbHZibk1nWW5rZ2JXVnRiMmw2YVc1blhHNTJZWElnWTI5dGNHbHNaVlJsYlhCc1lYUmxJRDBnWHk1dFpXMXZhWHBsS0daMWJtTjBhVzl1SUNoMGNHd3BJSHRjYmlBZ2NtVjBkWEp1SUY4dWRHVnRjR3hoZEdVb2RIQnNMQ0J1ZFd4c0xDQjdYRzRnSUNBZ1pYTmpZWEJsT2lBdlhGeDdYRng3S0Z0Y1hITmNYRk5kS3o4cFhGeDlYRng5TDJkY2JpQWdmU2s3WEc1OUtUdGNibHh1THk4Z1JIVnRjSE1nWVhKaWFYUnlZWEo1SUhaaGJIVmxjeUJoY3lCemRISnBibWR6SUdsdUlHRWdZMjl1WTJselpTQjNZWGxjYmk4dklGUlBSRTg2SUdoMGRIQnpPaTh2WjJsMGFIVmlMbU52YlM5amFHRnBhbk12WTJoaGFTOWliRzlpTDIxaGMzUmxjaTlzYVdJdlkyaGhhUzkxZEdsc2N5OXZZbXBFYVhOd2JHRjVMbXB6WEc1bWRXNWpkR2x2YmlCMllXeDFaVVIxYlhCbGNpQW9kaWtnZTF4dUlDQjJZWElnZG1Gc2RXVTdYRzVjYmlBZ2FXWWdLRjh1YVhOT2RXMWlaWElvZGlrZ2ZId2dYeTVwYzA1aFRpaDJLU0I4ZkNCZkxtbHpRbTl2YkdWaGJpaDJLU0I4ZkNCZkxtbHpUblZzYkNoMktTQjhmQ0JmTG1selZXNWtaV1pwYm1Wa0tIWXBLU0I3WEc0Z0lDQWdkbUZzZFdVZ1BTQW5QQ2NnS3lCMklDc2dKejRuTzF4dUlDQjlJR1ZzYzJVZ2FXWWdLRjh1YVhOU1pXZEZlSEFvZGlrcElIdGNiaUFnSUNCMllXeDFaU0E5SUhZdWRHOVRkSEpwYm1jb0tUdGNiaUFnZlNCbGJITmxJR2xtSUNoZkxtbHpSblZ1WTNScGIyNG9kaWtwSUh0Y2JpQWdJQ0JwWmlBb2RpNWthWE53YkdGNVRtRnRaU2tnZTF4dUlDQWdJQ0FnZG1Gc2RXVWdQU0IyTG1ScGMzQnNZWGxPWVcxbElDc2dKeWdwSnp0Y2JpQWdJQ0I5SUdWc2MyVWdhV1lnS0hZdWJtRnRaU2tnZTF4dUlDQWdJQ0FnZG1Gc2RXVWdQU0IyTG01aGJXVWdLeUFuS0Nrbk8xeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0IyWVd4MVpTQTlJQ2M4Wm5WdVkzUnBiMjQrSnp0Y2JpQWdJQ0I5WEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnZG1Gc2RXVWdQU0JLVTA5T0xuTjBjbWx1WjJsbWVTaDJLVHRjYmlBZ2ZWeHVYRzRnSUhKbGRIVnliaUFuWEZ4MU1EQXhZbHN4T3pNMmJTY2dLeUIyWVd4MVpTQXJJQ2RjWEhVd01ERmlXekJ0Snp0Y2JuMWNibHh1WEc0dkx5QkRkWE4wYjIxcGVtVmtJSFpsY25OcGIyNGdiMllnYkc5a1lYTm9JSFJsYlhCc1lYUmxYRzVtZFc1amRHbHZiaUIwWlcxd2JHRjBaU0FvZEhCc0xDQmpiMjUwWlhoMEtTQjdYRzRnSUhaaGNpQm1iaUE5SUdOdmJYQnBiR1ZVWlcxd2JHRjBaU2gwY0d3cE8xeHVJQ0JwWmlBb1kyOXVkR1Y0ZENBOVBUMGdkVzVrWldacGJtVmtLU0I3WEc0Z0lDQWdjbVYwZFhKdUlHWnVPMXh1SUNCOVhHNWNiaUFnZG1GeUlHOXlhV2RGYzJOaGNHVWdQU0JmTG1WelkyRndaVHRjYmlBZ2RISjVJSHRjYmlBZ0lDQXZMeUJQZG1WeWNtbGtaU0IwYUdVZ1pHVm1ZWFZzZENCbGMyTmhjR1VnWm5WdVkzUnBiMjRnZEc4Z2RYTmxJR2wwSUdadmNpQmtkVzF3YVc1bklHWnZjbTFoZEhSbFpDQjJZV3gxWlhOY2JpQWdJQ0JmTG1WelkyRndaU0E5SUhaaGJIVmxSSFZ0Y0dWeU8xeHVYRzRnSUNBZ2NtVjBkWEp1SUdadUtHTnZiblJsZUhRcE8xeHVYRzRnSUgwZ1ptbHVZV3hzZVNCN1hHNGdJQ0FnWHk1bGMyTmhjR1VnUFNCdmNtbG5SWE5qWVhCbE8xeHVJQ0I5WEc1OVhHNWNiaTh2SUVFZ2MybHRjR3hsSUdaaGMzUWdablZ1WTNScGIyNGdZbWx1WkdsdVp5QndjbWx0YVhScGRtVWdiMjVzZVNCemRYQndiM0owYVc1bklITmxkSFJwYm1jZ2RHaGxJR052Ym5SbGVIUmNibVoxYm1OMGFXOXVJR0pwYm1Rb1ptNHNJSFJvYVhOQmNtY3BJSHRjYmlBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNCeVpYUjFjbTRnWm00dVlYQndiSGtvZEdocGMwRnlaeXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdmVHRjYm4xY2JseHVMeThnVVhWcFkydHNlU0JqY21WaGRHVnpJR0VnYm1WM0lHOWlhbVZqZENCM2FYUm9JR0VnWTNWemRHOXRJSEJ5YjNSdmRIbHdaU0JoYm1RZ2MyOXRaU0IyWVd4MVpWeHVMeThnYjNabGNuSnBaR1Z6TGx4dVpuVnVZM1JwYjI0Z1kzSmxZWFJsS0hCeWIzUnZMQ0IyWVd4MVpYTXBJSHRjYmlBZ2FXWWdLREFnUFQwOUlHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdncElIdGNiaUFnSUNCeVpYUjFjbTRnZEdocGN6dGNiaUFnZlZ4dVhHNGdJQzh2SUVoQlEwczZJRlZ6WlNCR2RXNWpkR2x2Ymk1d2NtOTBiM1I1Y0dVZ0t5QnVaWGNnYVc1emRHVmhaQ0J2WmlCMGFHVWdjMnh2ZHkxcGMyZ2dUMkpxWldOMExtTnlaV0YwWlZ4dUlDQmpjbVZoZEdVdWNISnZkRzkwZVhCbElEMGdjSEp2ZEc4N1hHNGdJSEpsZEhWeWJpQmZMbUZ6YzJsbmJpaHVaWGNnWTNKbFlYUmxMQ0IyWVd4MVpYTWdmSHdnZTMwcE8xeHVmVnh1WEc1Y2JpOHZJRVp5YjIwZ2FIUjBjRG92TDNOcFpHVnlhWFJsTG1Kc2IyZHpjRzkwTG1OdmJTOHlNREUwTHpFeEwzTjFjR1Z5TFdaaGMzUXRZVzVrTFdGalkzVnlZWFJsTFhOMGNtbHVaeTFrYVhOMFlXNWpaUzVvZEcxc1hHNW1kVzVqZEdsdmJpQnphV1owTkNoek1Td2djeklzSUcxaGVFOW1abk5sZENrZ2UxeHVJQ0JwWmlBb0lYTXhJSHg4SUNGek1TNXNaVzVuZEdncElIdGNiaUFnSUNCcFppQW9JWE15S1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnTUR0Y2JpQWdJQ0I5WEc0Z0lDQWdjbVYwZFhKdUlITXlMbXhsYm1kMGFEdGNiaUFnZlZ4dVhHNGdJR2xtSUNnaGN6SWdmSHdnSVhNeUxteGxibWQwYUNrZ2UxeHVJQ0FnSUhKbGRIVnliaUJ6TVM1c1pXNW5kR2c3WEc0Z0lIMWNibHh1SUNCMllYSWdiREVnUFNCek1TNXNaVzVuZEdnN1hHNGdJSFpoY2lCc01pQTlJSE15TG14bGJtZDBhRHRjYmx4dUlDQjJZWElnWXpFZ1BTQXdPeUFnTHk4Z1kzVnljMjl5SUdadmNpQnpkSEpwYm1jZ01WeHVJQ0IyWVhJZ1l6SWdQU0F3T3lBZ0x5OGdZM1Z5YzI5eUlHWnZjaUJ6ZEhKcGJtY2dNbHh1SUNCMllYSWdiR056Y3lBOUlEQTdJQ0F2THlCc1lYSm5aWE4wSUdOdmJXMXZiaUJ6ZFdKelpYRjFaVzVqWlZ4dUlDQjJZWElnYkc5allXeGZZM01nUFNBd095QXZMeUJzYjJOaGJDQmpiMjF0YjI0Z2MzVmljM1J5YVc1blhHNWNiaUFnZDJocGJHVWdLQ2hqTVNBOElHd3hLU0FtSmlBb1l6SWdQQ0JzTWlrcElIdGNiaUFnSUNCcFppQW9jekV1WTJoaGNrRjBLR014S1NBOVBTQnpNaTVqYUdGeVFYUW9ZeklwS1NCN1hHNGdJQ0FnSUNCc2IyTmhiRjlqY3lzck8xeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0JzWTNOeklDczlJR3h2WTJGc1gyTnpPMXh1SUNBZ0lDQWdiRzlqWVd4ZlkzTWdQU0F3TzF4dUlDQWdJQ0FnYVdZZ0tHTXhJQ0U5SUdNeUtTQjdYRzRnSUNBZ0lDQWdJR014SUQwZ1l6SWdQU0JOWVhSb0xtMWhlQ2hqTVN4ak1pazdJQzh2SUhWemFXNW5JRzFoZUNCMGJ5QmllWEJoYzNNZ2RHaGxJRzVsWldRZ1ptOXlJR052YlhCMWRHVnlJSFJ5WVc1emNHOXphWFJwYjI1eklDZ25ZV0luSUhaeklDZGlZU2NwWEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0JtYjNJZ0tIWmhjaUJwSUQwZ01Ec2dhU0E4SUcxaGVFOW1abk5sZERzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ29ZekVnS3lCcElEd2diREVwSUNZbUlDaHpNUzVqYUdGeVFYUW9ZekVnS3lCcEtTQTlQVDBnY3pJdVkyaGhja0YwS0dNeUtTa3BJSHRjYmlBZ0lDQWdJQ0FnSUNCak1TQXJQU0JwTzF4dUlDQWdJQ0FnSUNBZ0lHeHZZMkZzWDJOekt5czdYRzRnSUNBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnYVdZZ0tDaGpNaUFySUdrZ1BDQnNNaWtnSmlZZ0tITXhMbU5vWVhKQmRDaGpNU2tnUFQwOUlITXlMbU5vWVhKQmRDaGpNaUFySUdrcEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUdNeUlDczlJR2s3WEc0Z0lDQWdJQ0FnSUNBZ2JHOWpZV3hmWTNNckt6dGNiaUFnSUNBZ0lDQWdJQ0JpY21WaGF6dGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdmVnh1SUNBZ0lIMWNiaUFnSUNCak1Tc3JPMXh1SUNBZ0lHTXlLeXM3WEc0Z0lIMWNiaUFnYkdOemN5QXJQU0JzYjJOaGJGOWpjenRjYmlBZ2NtVjBkWEp1SUUxaGRHZ3VjbTkxYm1Rb1RXRjBhQzV0WVhnb2JERXNJR3d5S1NBdElHeGpjM01wTzF4dWZWeHVYRzVsZUhCdmNuUnpMbUpwYm1RZ1BTQmlhVzVrTzF4dVpYaHdiM0owY3k1amNtVmhkR1VnUFNCamNtVmhkR1U3WEc1bGVIQnZjblJ6TG5SbGJYQnNZWFJsSUQwZ2RHVnRjR3hoZEdVN1hHNWxlSEJ2Y25SekxuVnVZVzV6YVNBOUlIVnVZVzV6YVR0Y2JtVjRjRzl5ZEhNdVpHOURiMnh2Y25NZ1BTQmtiME52Ykc5eWN6dGNibVY0Y0c5eWRITXVjMmxtZERRZ1BTQnphV1owTkR0Y2JpSmRmUT09IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIGFzcyA9IHJlcXVpcmUoJy4vbGliL2FzcycpO1xudmFyIENoYWluID0gcmVxdWlyZSgnLi9saWIvY2hhaW4nKTtcbnZhciBBc3NFcnJvciA9IHJlcXVpcmUoJy4vbGliL2Vycm9yJyk7XG52YXIgc2hvdWxkID0gcmVxdWlyZSgnLi9saWIvc2hvdWxkJyk7XG52YXIgcGF0Y2hlcyA9IHJlcXVpcmUoJy4vbGliL3BhdGNoZXMnKTtcblxuLy8gUmVnaXN0ZXIgdGhlIGRlZmF1bHQgbWF0Y2hlcnNcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL2NvcmUnKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL2Nvb3JkaW5hdGlvbicpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvcXVhbnRpZmllcnMnKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL3Byb21pc2UnKTtcblxuXG4vLyBCdW5kbGUgc29tZSBvZiB0aGUgaW50ZXJuYWwgc3R1ZmYgd2l0aCB0aGUgYXNzIGZ1bmN0aW9uXG5hc3MuQ2hhaW4gPSBDaGFpbjtcbmFzcy5FcnJvciA9IEFzc0Vycm9yO1xuYXNzLnBhdGNoZXMgPSBwYXRjaGVzO1xuXG4vLyBGb3J3YXJkIHRoZSBzaG91bGQgaW5zdGFsbGVyXG4vLyBOb3RlOiBtYWtlIHRoZW0gYXJpdHktMCB0byBhbGxvdyBiZWZvcmVFYWNoKGFzcy5zaG91bGQpIGluIE1vY2hhXG5hc3Muc2hvdWxkID0gZnVuY3Rpb24gKC8qIG5hbWUgKi8pIHtcbiAgc2hvdWxkKGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogdW5kZWZpbmVkKTtcbiAgcmV0dXJuIGFzcztcbn07XG5hc3Muc2hvdWxkLnJlc3RvcmUgPSBmdW5jdGlvbiAoLyogbmFtZSAqLykge1xuICBzaG91bGQucmVzdG9yZShhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IHVuZGVmaW5lZCk7XG4gIHJldHVybiBhc3M7XG59O1xuXG5cbi8vIFBhdGNoIHRoaXJkIHBhcnR5IGxpYnJhcmllcyB0byB1bmRlcnN0YW5kIGFib3V0IGFzcy1lcnQgZXhwcmVzc2lvbnMuIFdlXG4vLyBkZXBlbmQgb24gcGF0Y2hpbmcgbG9kYXNoIGZvciB0aGUgbGlicmFyeSB0byB3b3JrIGNvcnJlY3RseSwgaG93ZXZlciB0aGVcbi8vIHJlc3QgYXJlIG9wdGlvbmFsLlxucGF0Y2hlcy5sb2Rhc2goKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpKTtcblxuaWYgKGdsb2JhbC5zaW5vbiAmJiBnbG9iYWwuc2lub24ubWF0Y2gpIHtcbiAgcGF0Y2hlcy5zaW5vbihnbG9iYWwuc2lub24pO1xufSBlbHNlIGlmIChyZXF1aXJlLnJlc29sdmUgJiYgcmVxdWlyZS5yZXNvbHZlKCdzaW5vbicpKSB7XG4gIHBhdGNoZXMuc2lub24oKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuc2lub24gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLnNpbm9uIDogbnVsbCkpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gYXNzO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltMWhhVzR1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRWlMQ0ptYVd4bElqb2laMlZ1WlhKaGRHVmtMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSW5aaGNpQmhjM01nUFNCeVpYRjFhWEpsS0NjdUwyeHBZaTloYzNNbktUdGNiblpoY2lCRGFHRnBiaUE5SUhKbGNYVnBjbVVvSnk0dmJHbGlMMk5vWVdsdUp5azdYRzUyWVhJZ1FYTnpSWEp5YjNJZ1BTQnlaWEYxYVhKbEtDY3VMMnhwWWk5bGNuSnZjaWNwTzF4dWRtRnlJSE5vYjNWc1pDQTlJSEpsY1hWcGNtVW9KeTR2YkdsaUwzTm9iM1ZzWkNjcE8xeHVkbUZ5SUhCaGRHTm9aWE1nUFNCeVpYRjFhWEpsS0NjdUwyeHBZaTl3WVhSamFHVnpKeWs3WEc1Y2JpOHZJRkpsWjJsemRHVnlJSFJvWlNCa1pXWmhkV3gwSUcxaGRHTm9aWEp6WEc1eVpYRjFhWEpsS0NjdUwyeHBZaTl0WVhSamFHVnljeTlqYjNKbEp5azdYRzV5WlhGMWFYSmxLQ2N1TDJ4cFlpOXRZWFJqYUdWeWN5OWpiMjl5WkdsdVlYUnBiMjRuS1R0Y2JuSmxjWFZwY21Vb0p5NHZiR2xpTDIxaGRHTm9aWEp6TDNGMVlXNTBhV1pwWlhKekp5azdYRzV5WlhGMWFYSmxLQ2N1TDJ4cFlpOXRZWFJqYUdWeWN5OXdjbTl0YVhObEp5azdYRzVjYmx4dUx5OGdRblZ1Wkd4bElITnZiV1VnYjJZZ2RHaGxJR2x1ZEdWeWJtRnNJSE4wZFdabUlIZHBkR2dnZEdobElHRnpjeUJtZFc1amRHbHZibHh1WVhOekxrTm9ZV2x1SUQwZ1EyaGhhVzQ3WEc1aGMzTXVSWEp5YjNJZ1BTQkJjM05GY25KdmNqdGNibUZ6Y3k1d1lYUmphR1Z6SUQwZ2NHRjBZMmhsY3p0Y2JseHVMeThnUm05eWQyRnlaQ0IwYUdVZ2MyaHZkV3hrSUdsdWMzUmhiR3hsY2x4dUx5OGdUbTkwWlRvZ2JXRnJaU0IwYUdWdElHRnlhWFI1TFRBZ2RHOGdZV3hzYjNjZ1ltVm1iM0psUldGamFDaGhjM011YzJodmRXeGtLU0JwYmlCTmIyTm9ZVnh1WVhOekxuTm9iM1ZzWkNBOUlHWjFibU4wYVc5dUlDZ3ZLaUJ1WVcxbElDb3ZLU0I3WEc0Z0lITm9iM1ZzWkNoaGNtZDFiV1Z1ZEhNdWJHVnVaM1JvSUQ0Z01DQS9JR0Z5WjNWdFpXNTBjMXN3WFNBNklIVnVaR1ZtYVc1bFpDazdYRzRnSUhKbGRIVnliaUJoYzNNN1hHNTlPMXh1WVhOekxuTm9iM1ZzWkM1eVpYTjBiM0psSUQwZ1puVnVZM1JwYjI0Z0tDOHFJRzVoYldVZ0tpOHBJSHRjYmlBZ2MyaHZkV3hrTG5KbGMzUnZjbVVvWVhKbmRXMWxiblJ6TG14bGJtZDBhQ0ErSURBZ1B5QmhjbWQxYldWdWRITmJNRjBnT2lCMWJtUmxabWx1WldRcE8xeHVJQ0J5WlhSMWNtNGdZWE56TzF4dWZUdGNibHh1WEc0dkx5QlFZWFJqYUNCMGFHbHlaQ0J3WVhKMGVTQnNhV0p5WVhKcFpYTWdkRzhnZFc1a1pYSnpkR0Z1WkNCaFltOTFkQ0JoYzNNdFpYSjBJR1Y0Y0hKbGMzTnBiMjV6TGlCWFpWeHVMeThnWkdWd1pXNWtJRzl1SUhCaGRHTm9hVzVuSUd4dlpHRnphQ0JtYjNJZ2RHaGxJR3hwWW5KaGNua2dkRzhnZDI5eWF5QmpiM0p5WldOMGJIa3NJR2h2ZDJWMlpYSWdkR2hsWEc0dkx5QnlaWE4wSUdGeVpTQnZjSFJwYjI1aGJDNWNibkJoZEdOb1pYTXViRzlrWVhOb0tDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzTGw4Z09pQjBlWEJsYjJZZ1oyeHZZbUZzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z1oyeHZZbUZzTGw4Z09pQnVkV3hzS1NrN1hHNWNibWxtSUNobmJHOWlZV3d1YzJsdWIyNGdKaVlnWjJ4dlltRnNMbk5wYm05dUxtMWhkR05vS1NCN1hHNGdJSEJoZEdOb1pYTXVjMmx1YjI0b1oyeHZZbUZzTG5OcGJtOXVLVHRjYm4wZ1pXeHpaU0JwWmlBb2NtVnhkV2x5WlM1eVpYTnZiSFpsSUNZbUlISmxjWFZwY21VdWNtVnpiMngyWlNnbmMybHViMjRuS1NrZ2UxeHVJQ0J3WVhSamFHVnpMbk5wYm05dUtDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzTG5OcGJtOXVJRG9nZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JR2RzYjJKaGJDNXphVzV2YmlBNklHNTFiR3dwS1R0Y2JuMWNibHh1WEc1dGIyUjFiR1V1Wlhod2IzSjBjeUE5SUdGemN6dGNiaUpkZlE9PSIsbnVsbCwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuTXV0YXRpb25PYnNlcnZlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG5cbiAgICBpZiAoY2FuTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICB2YXIgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlTGlzdCA9IHF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcXVldWVMaXN0LmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGhpZGRlbkRpdiwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBoaWRkZW5EaXYuc2V0QXR0cmlidXRlKCd5ZXMnLCAnbm8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIi8vIEVtdWxhdGVzIFY4J3MgQ2FsbFNpdGUgb2JqZWN0IGZyb20gYSBzdGFja3RyYWNlLmpzIGZyYW1lIG9iamVjdFxuXG5mdW5jdGlvbiBDYWxsU2l0ZSAoZnJhbWUpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENhbGxTaXRlKSkge1xuICAgIHJldHVybiBuZXcgQ2FsbFNpdGUoZnJhbWUpO1xuICB9XG4gIHRoaXMuZnJhbWUgPSBmcmFtZTtcbn07XG5cbkNhbGxTaXRlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoe1xuICBnZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUubGluZU51bWJlcjtcbiAgfSxcbiAgZ2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuY29sdW1uTnVtYmVyO1xuICB9LFxuICBnZXRGaWxlTmFtZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmZpbGVOYW1lO1xuICB9LFxuICBnZXRGdW5jdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmZ1bmN0aW9uO1xuICB9LFxuICBnZXRUaGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGdldFR5cGVOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGdldE1ldGhvZE5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5mcmFtZS5mdW5jdGlvbk5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmZyYW1lLmZ1bmN0aW9uTmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgZ2V0RnVuY3Rpb25OYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lO1xuICB9LFxuICBnZXRFdmFsT3JpZ2luOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGlzVG9wbGV2ZWw6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cbiAgfSxcbiAgaXNFdmFsOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXG4gIH0sXG4gIGlzTmF0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXG4gIH0sXG4gIGlzQ29uc3RydWN0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gL15uZXcoXFxzfCQpLy50ZXN0KHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lKTtcbiAgfSxcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbmFtZSA9IHRoaXMuZ2V0RnVuY3Rpb25OYW1lKCkgfHwgJzxhbm9ueW1vdXM+JztcbiAgICB2YXIgbG9jID0gdGhpcy5nZXRGaWxlTmFtZSgpICsgJzonICsgdGhpcy5nZXRMaW5lTnVtYmVyKCkgKyAnOicgKyB0aGlzLmdldENvbHVtbk51bWJlcigpXG4gICAgcmV0dXJuIG5hbWUgKyAnICgnICsgbG9jICsgJyknO1xuICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENhbGxTaXRlO1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG52YXIgRXJyb3JTdGFja1BhcnNlciA9IHJlcXVpcmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicpO1xudmFyIENhbGxTaXRlID0gcmVxdWlyZSgnLi9jYWxsLXNpdGUnKTtcblxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgYnVpbHRpbiBlcnJvciBjb25zdHJ1Y3RvclxudmFyIE5hdGl2ZUVycm9yID0gRXJyb3I7XG5cbi8vIEFubm90YXRpb24gc3ltYm9sc1xudmFyIFNZTUJPTF9GUkFNRVMgPSAnQEBmYWlsdXJlL2ZyYW1lcyc7XG52YXIgU1lNQk9MX0lHTk9SRSA9ICdAQGZhaWx1cmUvaWdub3JlJztcblxuXG5mdW5jdGlvbiBGYWlsdXJlIChtZXNzYWdlLCBzZmYpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZhaWx1cmUpKSB7XG4gICAgcmV0dXJuIG5ldyBGYWlsdXJlKG1lc3NhZ2UsIHNmZiB8fCBGYWlsdXJlKTtcbiAgfVxuXG4gIHRoaXMuc2ZmID0gc2ZmIHx8IHRoaXMuY29uc3RydWN0b3I7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblxuICAvLyBHZW5lcmF0ZSBhIGdldHRlciBmb3IgdGhlIGZyYW1lcywgdGhpcyBlbnN1cmVzIHRoYXQgd2UgZG8gYXMgbGl0dGxlIHdvcmtcbiAgLy8gYXMgcG9zc2libGUgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBlcnJvciwgZGVmZXJyaW5nIHRoZSBleHBlbnNpdmUgc3RhY2tcbiAgLy8gbWFuZ2xpbmcgb3BlcmF0aW9ucyB1bnRpbCB0aGUgLnN0YWNrIHByb3BlcnR5IGlzIGFjdHVhbGx5IHJlcXVlc3RlZC5cbiAgdGhpcy5fZ2V0RnJhbWVzID0gbWFrZUZyYW1lc0dldHRlcih0aGlzLnNmZik7XG5cbiAgLy8gT24gRVM1IGVuZ2luZXMgd2UgdXNlIG9uZS10aW1lIGdldHRlcnMgdG8gYWN0dWFsbHkgZGVmZXIgdGhlIGV4cGVuc2l2ZVxuICAvLyBvcGVyYXRpb25zIChkZWZpbmVkIGluIHRoZSBwcm90b3R5cGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIHdoaWxlIGxlZ2FjeVxuICAvLyBlbmdpbmVzIHdpbGwgc2ltcGx5IGRvIGFsbCB0aGUgd29yayB1cCBmcm9udC5cbiAgaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLmZyYW1lcyA9IHVud2luZCh0aGlzLl9nZXRGcmFtZXMoKSk7XG4gICAgdGhpcy5fZ2V0RnJhbWVzKHRydWUpO1xuICAgIHRoaXMuX2dldEZyYW1lcyA9IG51bGw7XG4gICAgdGhpcy5zdGFjayA9IHRoaXMuZ2VuZXJhdGVTdGFja1RyYWNlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn1cblxuLy8gU2V0IEZSQU1FX0VNUFRZIHRvIG51bGwgdG8gZGlzYWJsZSBhbnkgc29ydCBvZiBzZXBhcmF0b3JcbkZhaWx1cmUuRlJBTUVfRU1QVFkgPSAnICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJztcbkZhaWx1cmUuRlJBTUVfUFJFRklYID0gJyAgYXQgJztcblxuLy8gQnkgZGVmYXVsdCB3ZSBlbmFibGUgdHJhY2tpbmcgZm9yIGFzeW5jIHN0YWNrIHRyYWNlc1xuRmFpbHVyZS5UUkFDSyA9IHRydWU7XG5cblxuLy8gSGVscGVyIHRvIG9idGFpbiB0aGUgY3VycmVudCBzdGFjayB0cmFjZVxudmFyIGdldEVycm9yV2l0aFN0YWNrID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IE5hdGl2ZUVycm9yKCk7XG59O1xuLy8gU29tZSBlbmdpbmVzIGRvIG5vdCBnZW5lcmF0ZSB0aGUgLnN0YWNrIHByb3BlcnR5IHVudGlsIGl0J3MgdGhyb3duXG5pZiAoIWdldEVycm9yV2l0aFN0YWNrKCkuc3RhY2spIHtcbiAgZ2V0RXJyb3JXaXRoU3RhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHsgdGhyb3cgbmV3IE5hdGl2ZUVycm9yKCk7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGU7IH1cbiAgfTtcbn1cblxuLy8gVHJpbSBmcmFtZXMgdW5kZXIgdGhlIHByb3ZpZGVkIHN0YWNrIGZpcnN0IGZ1bmN0aW9uXG5mdW5jdGlvbiB0cmltKGZyYW1lcywgc2ZmKSB7XG4gIHZhciBmbiwgbmFtZSA9IHNmZi5uYW1lO1xuICBpZiAoIWZyYW1lcykge1xuICAgIGNvbnNvbGUud2FybignW0ZhaWx1cmVdIGVycm9yIGNhcHR1cmluZyBmcmFtZXMnKTtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgZm9yICh2YXIgaT0wOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4gPSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb24oKTtcbiAgICBpZiAoZm4gJiYgZm4gPT09IHNmZiB8fCBuYW1lICYmIG5hbWUgPT09IGZyYW1lc1tpXS5nZXRGdW5jdGlvbk5hbWUoKSkge1xuICAgICAgcmV0dXJuIGZyYW1lcy5zbGljZShpICsgMSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBmcmFtZXM7XG59XG5cbmZ1bmN0aW9uIHVud2luZCAoZnJhbWVzKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcblxuICBmb3IgKHZhciBpPTAsIGZuOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4gPSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb24oKTtcblxuICAgIGlmICghZm4gfHwgIWZuW1NZTUJPTF9JR05PUkVdKSB7XG4gICAgICByZXN1bHQucHVzaChmcmFtZXNbaV0pO1xuICAgIH1cblxuICAgIGlmIChmbiAmJiBmbltTWU1CT0xfRlJBTUVTXSkge1xuICAgICAgaWYgKEZhaWx1cmUuRlJBTUVfRU1QVFkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENhbGwgdGhlIGdldHRlciBhbmQga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgcmVzdWx0IGluIGNhc2Ugd2UgaGF2ZSB0b1xuICAgICAgLy8gdW53aW5kIHRoZSBzYW1lIGZ1bmN0aW9uIGFub3RoZXIgdGltZS5cbiAgICAgIC8vIFRPRE86IE1ha2Ugc3VyZSBrZWVwaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBmcmFtZXMgZG9lc24ndCBjcmVhdGUgbGVha3NcbiAgICAgIGlmICh0eXBlb2YgZm5bU1lNQk9MX0ZSQU1FU10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFyIGdldHRlciA9IGZuW1NZTUJPTF9GUkFNRVNdO1xuICAgICAgICBmbltTWU1CT0xfRlJBTUVTXSA9IG51bGw7XG4gICAgICAgIGZuW1NZTUJPTF9GUkFNRVNdID0gZ2V0dGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZm5bU1lNQk9MX0ZSQU1FU10pIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbRmFpbHVyZV0gRW1wdHkgZnJhbWVzIGFubm90YXRpb24nKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgdW53aW5kKGZuW1NZTUJPTF9GUkFNRVNdKSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBSZWNlaXZlciBmb3IgdGhlIGZyYW1lcyBpbiBhIC5zdGFjayBwcm9wZXJ0eSBmcm9tIGNhcHR1cmVTdGFja1RyYWNlXG52YXIgVjhGUkFNRVMgPSB7fTtcblxuLy8gVjggY29kZSBwYXRoIGZvciBnZW5lcmF0aW5nIGEgZnJhbWVzIGdldHRlclxuZnVuY3Rpb24gbWFrZUZyYW1lc0dldHRlclY4IChzZmYpIHtcbiAgTmF0aXZlRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoVjhGUkFNRVMsIHNmZiB8fCBtYWtlRnJhbWVzR2V0dGVyVjgpO1xuICBzZmYgPSBudWxsO1xuICB2YXIgZnJhbWVzID0gVjhGUkFNRVMuc3RhY2s7XG4gIFY4RlJBTUVTLnN0YWNrID0gbnVsbDsgIC8vIElNUE9SVEFOVDogVGhpcyBpcyBuZWVkZWQgdG8gYXZvaWQgbGVha3MhISFcbiAgcmV0dXJuIGZ1bmN0aW9uIChjbGVhbnVwKSB7XG4gICAgdmFyIHJlc3VsdCA9IGZyYW1lcztcbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgZnJhbWVzID0gbnVsbDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG4vLyBub24tVjggY29kZSBwYXRoIGZvciBnZW5lcmF0aW5nIGEgZnJhbWVzIGdldHRlclxuZnVuY3Rpb24gbWFrZUZyYW1lc0dldHRlckNvbXBhdCAoc2ZmKSB7XG4gIC8vIE9idGFpbiBhIHN0YWNrIHRyYWNlIGF0IHRoZSBjdXJyZW50IHBvaW50XG4gIHZhciBlcnJvciA9IGdldEVycm9yV2l0aFN0YWNrKCk7XG5cbiAgLy8gV2FsayB0aGUgY2FsbGVyIGNoYWluIHRvIGFubm90YXRlIHRoZSBzdGFjayB3aXRoIGZ1bmN0aW9uIHJlZmVyZW5jZXNcbiAgLy8gR2l2ZW4gdGhlIGxpbWl0YXRpb25zIGltcG9zZWQgYnkgRVM1IFwic3RyaWN0IG1vZGVcIiBpdCdzIG5vdCBwb3NzaWJsZVxuICAvLyB0byBvYnRhaW4gcmVmZXJlbmNlcyB0byBmdW5jdGlvbnMgYmV5b25kIG9uZSB0aGF0IGlzIGRlZmluZWQgaW4gc3RyaWN0XG4gIC8vIG1vZGUuIEFsc28gbm90ZSB0aGF0IGFueSBraW5kIG9mIHJlY3Vyc2lvbiB3aWxsIG1ha2UgdGhlIHdhbGtlciB1bmFibGVcbiAgLy8gdG8gZ28gcGFzdCBpdC5cbiAgdmFyIGNhbGxlciA9IGFyZ3VtZW50cy5jYWxsZWU7XG4gIHZhciBmdW5jdGlvbnMgPSBbZ2V0RXJyb3JXaXRoU3RhY2tdO1xuICBmb3IgKHZhciBpPTA7IGNhbGxlciAmJiBpIDwgMTA7IGkrKykge1xuICAgIGZ1bmN0aW9ucy5wdXNoKGNhbGxlcik7XG4gICAgaWYgKGNhbGxlci5jYWxsZXIgPT09IGNhbGxlcikgYnJlYWs7XG4gICAgY2FsbGVyID0gY2FsbGVyLmNhbGxlcjtcbiAgfVxuICBjYWxsZXIgPSBudWxsO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoY2xlYW51cCkge1xuICAgIHZhciBmcmFtZXMgPSBudWxsO1xuXG4gICAgaWYgKCFjbGVhbnVwKSB7XG4gICAgICAvLyBQYXJzZSB0aGUgc3RhY2sgdHJhY2VcbiAgICAgIGZyYW1lcyA9IEVycm9yU3RhY2tQYXJzZXIucGFyc2UoZXJyb3IpO1xuICAgICAgLy8gQXR0YWNoIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdG8gdGhlIGZyYW1lcyAoc2tpcHBpbmcgdGhlIG1ha2VyIGZyYW1lcylcbiAgICAgIC8vIGFuZCBjcmVhdGluZyBDYWxsU2l0ZSBvYmplY3RzIGZvciBlYWNoIG9uZS5cbiAgICAgIGZvciAodmFyIGk9MjsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmcmFtZXNbaV0uZnVuY3Rpb24gPSBmdW5jdGlvbnNbaV07XG4gICAgICAgIGZyYW1lc1tpXSA9IG5ldyBDYWxsU2l0ZShmcmFtZXNbaV0pO1xuICAgICAgfVxuXG4gICAgICBmcmFtZXMgPSB0cmltKGZyYW1lcy5zbGljZSgyKSwgc2ZmKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgc2ZmID0gbnVsbDtcbiAgICBlcnJvciA9IG51bGw7XG4gICAgZnVuY3Rpb25zID0gbnVsbDtcblxuICAgIHJldHVybiBmcmFtZXM7XG4gIH07XG59XG5cbi8vIEdlbmVyYXRlcyBhIGdldHRlciBmb3IgdGhlIGNhbGwgc2l0ZSBmcmFtZXNcbi8vIFRPRE86IElmIHdlIG9ic2VydmUgbGVha3Mgd2l0aCBjb21wbGV4IHVzZSBjYXNlcyAoZHVlIHRvIGNsb3N1cmUgc2NvcGVzKVxuLy8gICAgICAgd2UgY2FuIGdlbmVyYXRlIGhlcmUgb3VyIGNvbXBhdCBDYWxsU2l0ZSBvYmplY3RzIHN0b3JpbmcgdGhlIGZ1bmN0aW9uJ3Ncbi8vICAgICAgIHNvdXJjZSBjb2RlIGluc3RlYWQgb2YgYW4gYWN0dWFsIHJlZmVyZW5jZSB0byB0aGVtLCB0aGF0IHNob3VsZCBoZWxwXG4vLyAgICAgICB0aGUgR0Mgc2luY2Ugd2UnbGwgYmUganVzdCBrZWVwaW5nIGxpdGVyYWxzIGFyb3VuZC5cbnZhciBtYWtlRnJhbWVzR2V0dGVyID0gdHlwZW9mIE5hdGl2ZUVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICA/IG1ha2VGcmFtZXNHZXR0ZXJWOFxuICAgICAgICAgICAgICAgICAgICAgOiBtYWtlRnJhbWVzR2V0dGVyQ29tcGF0O1xuXG5cbi8vIE92ZXJyaWRlIFY4IHN0YWNrIHRyYWNlIGJ1aWxkZXIgdG8gaW5qZWN0IG91ciBsb2dpY1xudmFyIG9sZFByZXBhcmVTdGFja1RyYWNlID0gRXJyb3IucHJlcGFyZVN0YWNrVHJhY2U7XG5FcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChlcnJvciwgZnJhbWVzKSB7XG4gIC8vIFdoZW4gY2FsbGVkIGZyb20gbWFrZUZyYW1lc0dldHRlciB3ZSBqdXN0IHdhbnQgdG8gb2J0YWluIHRoZSBmcmFtZXNcbiAgaWYgKGVycm9yID09PSBWOEZSQU1FUykge1xuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICAvLyBGb3J3YXJkIHRvIGFueSBwcmV2aW91c2x5IGRlZmluZWQgYmVoYXZpb3VyXG4gIGlmIChvbGRQcmVwYXJlU3RhY2tUcmFjZSkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gb2xkUHJlcGFyZVN0YWNrVHJhY2UuY2FsbChFcnJvciwgZXJyb3IsIGZyYW1lcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gSnVzdCBpZ25vcmUgdGhlIGVycm9yIChpZToga2FybWEtc291cmNlLW1hcC1zdXBwb3J0KVxuICAgIH1cbiAgfVxuXG4gIC8vIEVtdWxhdGUgZGVmYXVsdCBiZWhhdmlvdXIgKHdpdGggbG9uZy10cmFjZXMpXG4gIHJldHVybiBGYWlsdXJlLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZS5jYWxsKGVycm9yLCB1bndpbmQoZnJhbWVzKSk7XG59O1xuXG4vLyBBdHRhY2ggYSBuZXcgZXhjbHVzaW9uIHByZWRpY2F0ZSBmb3IgZnJhbWVzXG5mdW5jdGlvbiBleGNsdWRlIChjdG9yLCBwcmVkaWNhdGUpIHtcbiAgdmFyIGZuID0gcHJlZGljYXRlO1xuXG4gIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgIGZuID0gZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgICByZXR1cm4gLTEgIT09IGZyYW1lLmdldEZpbGVOYW1lKCkuaW5kZXhPZihwcmVkaWNhdGUpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByZWRpY2F0ZS50ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm4gPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICAgIHJldHVybiBwcmVkaWNhdGUudGVzdChmcmFtZS5nZXRGaWxlTmFtZSgpKTtcbiAgICB9O1xuICB9XG5cbiAgY3Rvci5leGNsdWRlcy5wdXNoKGZuKTtcbn1cblxuLy8gRXhwb3NlIHRoZSBmaWx0ZXIgaW4gdGhlIHJvb3QgRmFpbHVyZSB0eXBlXG5GYWlsdXJlLmV4Y2x1ZGVzID0gW107XG5GYWlsdXJlLmV4Y2x1ZGUgPSBmdW5jdGlvbiBGYWlsdXJlX2V4Y2x1ZGUgKHByZWRpY2F0ZSkge1xuICBleGNsdWRlKEZhaWx1cmUsIHByZWRpY2F0ZSk7XG59O1xuXG4vLyBBdHRhY2ggYSBmcmFtZXMgZ2V0dGVyIHRvIHRoZSBmdW5jdGlvbiBzbyB3ZSBjYW4gcmUtY29uc3RydWN0IGFzeW5jIHN0YWNrcy5cbi8vXG4vLyBOb3RlIHRoYXQgdGhpcyBqdXN0IGF1Z21lbnRzIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBuZXcgcHJvcGVydHksIGl0IGRvZXNuJ3Rcbi8vIGNyZWF0ZSBhIHdyYXBwZXIgZXZlcnkgdGltZSBpdCdzIGNhbGxlZCwgc28gdXNpbmcgaXQgbXVsdGlwbGUgdGltZXMgb24gdGhlXG4vLyBzYW1lIGZ1bmN0aW9uIHdpbGwgaW5kZWVkIG92ZXJ3cml0ZSB0aGUgcHJldmlvdXMgdHJhY2tpbmcgaW5mb3JtYXRpb24uIFRoaXNcbi8vIGlzIGludGVuZGVkIHNpbmNlIGl0J3MgZmFzdGVyIGFuZCBtb3JlIGltcG9ydGFudGx5IGRvZXNuJ3QgYnJlYWsgc29tZSBBUElzXG4vLyB1c2luZyBjYWxsYmFjayByZWZlcmVuY2VzIHRvIHVucmVnaXN0ZXIgdGhlbSBmb3IgaW5zdGFuY2UuXG4vLyBXaGVuIHlvdSB3YW50IHRvIHVzZSB0aGUgc2FtZSBmdW5jdGlvbiB3aXRoIGRpZmZlcmVudCB0cmFja2luZyBpbmZvcm1hdGlvblxuLy8ganVzdCB1c2UgRmFpbHVyZS53cmFwKCkuXG4vL1xuLy8gVGhlIHRyYWNraW5nIGNhbiBiZSBnbG9iYWxseSBkaXNhYmxlZCBieSBzZXR0aW5nIEZhaWx1cmUuVFJBQ0sgdG8gZmFsc2VcbkZhaWx1cmUudHJhY2sgPSBmdW5jdGlvbiBGYWlsdXJlX3RyYWNrIChmbiwgc2ZmKSB7XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICAvLyBDbGVhbiB1cCBwcmV2aW91cyBmcmFtZXMgdG8gaGVscCB0aGUgR0NcbiAgaWYgKHR5cGVvZiBmbltTWU1CT0xfRlJBTUVTXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGZuW1NZTUJPTF9GUkFNRVNdKHRydWUpO1xuICB9XG5cbiAgaWYgKEZhaWx1cmUuVFJBQ0spIHtcbiAgICBmbltTWU1CT0xfRlJBTUVTXSA9IG51bGw7XG4gICAgZm5bU1lNQk9MX0ZSQU1FU10gPSBtYWtlRnJhbWVzR2V0dGVyKHNmZiB8fCBGYWlsdXJlX3RyYWNrKTtcbiAgfVxuXG4gIHJldHVybiBmbjtcbn07XG5cbi8vIFdyYXBzIHRoZSBmdW5jdGlvbiBiZWZvcmUgYW5ub3RhdGluZyBpdCB3aXRoIHRyYWNraW5nIGluZm9ybWF0aW9uLCB0aGlzXG4vLyBhbGxvd3MgdG8gdHJhY2sgbXVsdGlwbGUgc2NoZWR1bGxpbmdzIG9mIGEgc2luZ2xlIGZ1bmN0aW9uLlxuRmFpbHVyZS53cmFwID0gZnVuY3Rpb24gRmFpbHVyZV93cmFwIChmbikge1xuICB2YXIgd3JhcHBlciA9IEZhaWx1cmUuaWdub3JlKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIEZhaWx1cmUudHJhY2sod3JhcHBlciwgRmFpbHVyZV93cmFwKTtcbn07XG5cbi8vIE1hcmsgYSBmdW5jdGlvbiB0byBiZSBpZ25vcmVkIHdoZW4gZ2VuZXJhdGluZyBzdGFjayB0cmFjZXNcbkZhaWx1cmUuaWdub3JlID0gZnVuY3Rpb24gRmFpbHVyZV9pZ25vcmUgKGZuKSB7XG4gIGZuW1NZTUJPTF9JR05PUkVdID0gdHJ1ZTtcbiAgcmV0dXJuIGZuO1xufTtcblxuRmFpbHVyZS5zZXRUaW1lb3V0ID0gZnVuY3Rpb24gRmFpbHVyZV9zZXRUaW1lb3V0ICgpIHtcbiAgYXJndW1lbnRzWzBdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbMF0sIEZhaWx1cmVfc2V0VGltZW91dCk7XG4gIHJldHVybiBzZXRUaW1lb3V0LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG5GYWlsdXJlLm5leHRUaWNrID0gZnVuY3Rpb24gRmFpbHVyZV9uZXh0VGljayAoKSB7XG4gIGFyZ3VtZW50c1swXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzWzBdLCBGYWlsdXJlX25leHRUaWNrKTtcbiAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2suYXBwbHkocHJvY2VzcywgYXJndW1lbnRzKTtcbn07XG5cbkZhaWx1cmUucGF0Y2ggPSBmdW5jdGlvbiBGYWlsdXJlX3BhdGNoKG9iaiwgbmFtZSwgaWR4KSB7XG4gIGlmIChvYmogJiYgdHlwZW9mIG9ialtuYW1lXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBcIicgKyBuYW1lICsgJ1wiIG1ldGhvZCcpO1xuICB9XG5cbiAgdmFyIG9yaWdpbmFsID0gb2JqW25hbWVdO1xuXG4gIC8vIFdoZW4gdGhlIGV4YWN0IGFyZ3VtZW50IGluZGV4IGlzIHByb3ZpZGVkIHVzZSBhbiBvcHRpbWl6ZWQgY29kZSBwYXRoXG4gIGlmICh0eXBlb2YgaWR4ID09PSAnbnVtYmVyJykge1xuXG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgYXJndW1lbnRzW2lkeF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1tpZHhdLCBvYmpbbmFtZV0pO1xuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAvLyBPdGhlcndpc2UgZGV0ZWN0IHRoZSBmdW5jdGlvbnMgdG8gdHJhY2sgYXQgaW52b2thdGlvbiB0aW1lXG4gIH0gZWxzZSB7XG5cbiAgICBvYmpbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGFyZ3VtZW50c1tpXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzW2ldLCBvYmpbbmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSB3cmFwcGVyIHdpdGggYW55IHByb3BlcnRpZXMgZnJvbSB0aGUgb3JpZ2luYWxcbiAgZm9yICh2YXIgayBpbiBvcmlnaW5hbCkgaWYgKG9yaWdpbmFsLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgb2JqW25hbWVdW2tdID0gb3JpZ2luYWxba107XG4gIH1cblxuICByZXR1cm4gb2JqW25hbWVdO1xufTtcblxuLy8gSGVscGVyIHRvIGNyZWF0ZSBuZXcgRmFpbHVyZSB0eXBlc1xuRmFpbHVyZS5jcmVhdGUgPSBmdW5jdGlvbiAobmFtZSwgcHJvcHMpIHtcbiAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBGYWlsdXJlKCdFeHBlY3RlZCBhIG5hbWUgYXMgZmlyc3QgYXJndW1lbnQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGN0b3IgKG1lc3NhZ2UsIHNmZikge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGYWlsdXJlKSkge1xuICAgICAgcmV0dXJuIG5ldyBjdG9yKG1lc3NhZ2UsIHNmZik7XG4gICAgfVxuICAgIEZhaWx1cmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIC8vIEF1Z21lbnQgY29uc3RydWN0b3JcbiAgY3Rvci5leGNsdWRlcyA9IFtdO1xuICBjdG9yLmV4Y2x1ZGUgPSBmdW5jdGlvbiAocHJlZGljYXRlKSB7XG4gICAgZXhjbHVkZShjdG9yLCBwcmVkaWNhdGUpO1xuICB9O1xuXG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShGYWlsdXJlLnByb3RvdHlwZSk7XG4gIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvcjtcbiAgY3Rvci5wcm90b3R5cGUubmFtZSA9IG5hbWU7XG4gIGlmICh0eXBlb2YgcHJvcHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjdG9yLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZSA9IHByb3BzO1xuICB9IGVsc2UgaWYgKHByb3BzKSB7XG4gICAgT2JqZWN0LmtleXMocHJvcHMpLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIGN0b3IucHJvdG90eXBlW3Byb3BdID0gcHJvcDtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY3Rvcjtcbn07XG5cbnZhciBidWlsdGluRXJyb3JUeXBlcyA9IFtcbiAgJ0Vycm9yJywgJ1R5cGVFcnJvcicsICdSYW5nZUVycm9yJywgJ1JlZmVyZW5jZUVycm9yJywgJ1N5bnRheEVycm9yJyxcbiAgJ0V2YWxFcnJvcicsICdVUklFcnJvcicsICdJbnRlcm5hbEVycm9yJ1xuXTtcbnZhciBidWlsdGluRXJyb3JzID0ge307XG5cbkZhaWx1cmUuaW5zdGFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyA/IHdpbmRvdyA6IGdsb2JhbDtcblxuICBidWlsdGluRXJyb3JUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgaWYgKHJvb3RbdHlwZV0gJiYgIWJ1aWx0aW5FcnJvcnNbdHlwZV0pIHtcbiAgICAgIGJ1aWx0aW5FcnJvcnNbdHlwZV0gPSByb290W3R5cGVdO1xuICAgICAgcm9vdFt0eXBlXSA9IEZhaWx1cmUuY3JlYXRlKHR5cGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQWxsb3cgdXNhZ2U6IHZhciBGYWlsdXJlID0gcmVxdWlyZSgnZmFpbHVyZScpLmluc3RhbGwoKVxuICByZXR1cm4gRmFpbHVyZTtcbn07XG5cbkZhaWx1cmUudW5pbnN0YWxsID0gZnVuY3Rpb24gKCkge1xuICBidWlsdGluRXJyb3JUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgcm9vdFt0eXBlXSA9IGJ1aWx0aW5FcnJvcnNbdHlwZV0gfHwgcm9vdFt0eXBlXTtcbiAgfSk7XG59O1xuXG5cbnZhciBwcm90byA9IEZhaWx1cmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xucHJvdG8uY29uc3RydWN0b3IgPSBGYWlsdXJlO1xuXG5wcm90by5uYW1lID0gJ0ZhaWx1cmUnO1xucHJvdG8ubWVzc2FnZSA9ICcnO1xuXG5pZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdmcmFtZXMnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBVc2UgdHJpbW1pbmcganVzdCBpbiBjYXNlIHRoZSBzZmYgd2FzIGRlZmluZWQgYWZ0ZXIgY29uc3RydWN0aW5nXG4gICAgICB2YXIgZnJhbWVzID0gdW53aW5kKHRyaW0odGhpcy5fZ2V0RnJhbWVzKCksIHRoaXMuc2ZmKSk7XG5cbiAgICAgIC8vIENhY2hlIG5leHQgYWNjZXNzZXMgdG8gdGhlIHByb3BlcnR5XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2ZyYW1lcycsIHtcbiAgICAgICAgdmFsdWU6IGZyYW1lcyxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICAvLyBDbGVhbiB1cCB0aGUgZ2V0dGVyIGNsb3N1cmVcbiAgICAgIHRoaXMuX2dldEZyYW1lcyA9IG51bGw7XG5cbiAgICAgIHJldHVybiBmcmFtZXM7XG4gICAgfVxuICB9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdzdGFjaycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlU3RhY2tUcmFjZSgpO1xuICAgIH1cbiAgfSk7XG59XG5cbnByb3RvLmdlbmVyYXRlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGV4Y2x1ZGVzID0gdGhpcy5jb25zdHJ1Y3Rvci5leGNsdWRlcztcbiAgdmFyIGluY2x1ZGUsIGZyYW1lcyA9IFtdO1xuXG4gIC8vIFNwZWNpZmljIHByb3RvdHlwZXMgaW5oZXJpdCB0aGUgZXhjbHVkZXMgZnJvbSBGYWlsdXJlXG4gIGlmIChleGNsdWRlcyAhPT0gRmFpbHVyZS5leGNsdWRlcykge1xuICAgIGV4Y2x1ZGVzLnB1c2guYXBwbHkoZXhjbHVkZXMsIEZhaWx1cmUuZXhjbHVkZXMpO1xuICB9XG5cbiAgLy8gQXBwbHkgZmlsdGVyaW5nXG4gIGZvciAodmFyIGk9MDsgaSA8IHRoaXMuZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaW5jbHVkZSA9IHRydWU7XG4gICAgaWYgKHRoaXMuZnJhbWVzW2ldKSB7XG4gICAgICBmb3IgKHZhciBqPTA7IGluY2x1ZGUgJiYgaiA8IGV4Y2x1ZGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGluY2x1ZGUgJj0gIWV4Y2x1ZGVzW2pdLmNhbGwodGhpcywgdGhpcy5mcmFtZXNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaW5jbHVkZSkge1xuICAgICAgZnJhbWVzLnB1c2godGhpcy5mcmFtZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIEhvbm9yIGFueSBwcmV2aW91c2x5IGRlZmluZWQgc3RhY2t0cmFjZSBmb3JtYXR0ZXIgYnlcbiAgLy8gYWxsb3dpbmcgaXQgZmluYWxseSBmb3JtYXQgdGhlIGZyYW1lcy4gVGhpcyBpcyBuZWVkZWRcbiAgLy8gd2hlbiB1c2luZyBub2RlLXNvdXJjZS1tYXAtc3VwcG9ydCBmb3IgaW5zdGFuY2UuXG4gIC8vIFRPRE86IENhbiB3ZSBtYXAgdGhlIFwibnVsbFwiIGZyYW1lcyB0byBhIENhbGxGcmFtZSBzaGltP1xuICBpZiAob2xkUHJlcGFyZVN0YWNrVHJhY2UpIHtcbiAgICBmcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiAhIXg7IH0pO1xuICAgIHJldHVybiBvbGRQcmVwYXJlU3RhY2tUcmFjZS5jYWxsKEVycm9yLCB0aGlzLCBmcmFtZXMpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMucHJlcGFyZVN0YWNrVHJhY2UoZnJhbWVzKTtcbn07XG5cbnByb3RvLnByZXBhcmVTdGFja1RyYWNlID0gZnVuY3Rpb24gKGZyYW1lcykge1xuICB2YXIgbGluZXMgPSBbdGhpc107XG4gIGZvciAodmFyIGk9MDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBmcmFtZXNbaV0gPyBGYWlsdXJlLkZSQU1FX1BSRUZJWCArIGZyYW1lc1tpXSA6IEZhaWx1cmUuRlJBTUVfRU1QVFlcbiAgICApO1xuICB9XG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBGYWlsdXJlO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OW1ZV2xzZFhKbEwyeHBZaTltWVdsc2RYSmxMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdSWEp5YjNKVGRHRmphMUJoY25ObGNpQTlJSEpsY1hWcGNtVW9KMlZ5Y205eUxYTjBZV05yTFhCaGNuTmxjaWNwTzF4dWRtRnlJRU5oYkd4VGFYUmxJRDBnY21WeGRXbHlaU2duTGk5allXeHNMWE5wZEdVbktUdGNibHh1THk4Z1MyVmxjQ0JoSUhKbFptVnlaVzVqWlNCMGJ5QjBhR1VnWW5WcGJIUnBiaUJsY25KdmNpQmpiMjV6ZEhKMVkzUnZjbHh1ZG1GeUlFNWhkR2wyWlVWeWNtOXlJRDBnUlhKeWIzSTdYRzVjYmk4dklFRnVibTkwWVhScGIyNGdjM2x0WW05c2MxeHVkbUZ5SUZOWlRVSlBURjlHVWtGTlJWTWdQU0FuUUVCbVlXbHNkWEpsTDJaeVlXMWxjeWM3WEc1MllYSWdVMWxOUWs5TVgwbEhUazlTUlNBOUlDZEFRR1poYVd4MWNtVXZhV2R1YjNKbEp6dGNibHh1WEc1bWRXNWpkR2x2YmlCR1lXbHNkWEpsSUNodFpYTnpZV2RsTENCelptWXBJSHRjYmlBZ2FXWWdLQ0VvZEdocGN5QnBibk4wWVc1alpXOW1JRVpoYVd4MWNtVXBLU0I3WEc0Z0lDQWdjbVYwZFhKdUlHNWxkeUJHWVdsc2RYSmxLRzFsYzNOaFoyVXNJSE5tWmlCOGZDQkdZV2xzZFhKbEtUdGNiaUFnZlZ4dVhHNGdJSFJvYVhNdWMyWm1JRDBnYzJabUlIeDhJSFJvYVhNdVkyOXVjM1J5ZFdOMGIzSTdYRzVjYmlBZ2RHaHBjeTV0WlhOellXZGxJRDBnYldWemMyRm5aVHRjYmx4dUlDQXZMeUJIWlc1bGNtRjBaU0JoSUdkbGRIUmxjaUJtYjNJZ2RHaGxJR1p5WVcxbGN5d2dkR2hwY3lCbGJuTjFjbVZ6SUhSb1lYUWdkMlVnWkc4Z1lYTWdiR2wwZEd4bElIZHZjbXRjYmlBZ0x5OGdZWE1nY0c5emMybGliR1VnZDJobGJpQnBibk4wWVc1MGFXRjBhVzVuSUhSb1pTQmxjbkp2Y2l3Z1pHVm1aWEp5YVc1bklIUm9aU0JsZUhCbGJuTnBkbVVnYzNSaFkydGNiaUFnTHk4Z2JXRnVaMnhwYm1jZ2IzQmxjbUYwYVc5dWN5QjFiblJwYkNCMGFHVWdMbk4wWVdOcklIQnliM0JsY25SNUlHbHpJR0ZqZEhWaGJHeDVJSEpsY1hWbGMzUmxaQzVjYmlBZ2RHaHBjeTVmWjJWMFJuSmhiV1Z6SUQwZ2JXRnJaVVp5WVcxbGMwZGxkSFJsY2loMGFHbHpMbk5tWmlrN1hHNWNiaUFnTHk4Z1QyNGdSVk0xSUdWdVoybHVaWE1nZDJVZ2RYTmxJRzl1WlMxMGFXMWxJR2RsZEhSbGNuTWdkRzhnWVdOMGRXRnNiSGtnWkdWbVpYSWdkR2hsSUdWNGNHVnVjMmwyWlZ4dUlDQXZMeUJ2Y0dWeVlYUnBiMjV6SUNoa1pXWnBibVZrSUdsdUlIUm9aU0J3Y205MGIzUjVjR1VnWm05eUlIQmxjbVp2Y20xaGJtTmxJSEpsWVhOdmJuTXBJSGRvYVd4bElHeGxaMkZqZVZ4dUlDQXZMeUJsYm1kcGJtVnpJSGRwYkd3Z2MybHRjR3g1SUdSdklHRnNiQ0IwYUdVZ2QyOXlheUIxY0NCbWNtOXVkQzVjYmlBZ2FXWWdLSFI1Y0dWdlppQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtnSVQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ0lDQjBhR2x6TG1aeVlXMWxjeUE5SUhWdWQybHVaQ2gwYUdsekxsOW5aWFJHY21GdFpYTW9LU2s3WEc0Z0lDQWdkR2hwY3k1ZloyVjBSbkpoYldWektIUnlkV1VwTzF4dUlDQWdJSFJvYVhNdVgyZGxkRVp5WVcxbGN5QTlJRzUxYkd3N1hHNGdJQ0FnZEdocGN5NXpkR0ZqYXlBOUlIUm9hWE11WjJWdVpYSmhkR1ZUZEdGamExUnlZV05sS0NrN1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2RHaHBjenRjYm4xY2JseHVMeThnVTJWMElFWlNRVTFGWDBWTlVGUlpJSFJ2SUc1MWJHd2dkRzhnWkdsellXSnNaU0JoYm5rZ2MyOXlkQ0J2WmlCelpYQmhjbUYwYjNKY2JrWmhhV3gxY21VdVJsSkJUVVZmUlUxUVZGa2dQU0FuSUNBdExTMHRMUzB0TFMwdExTMHRMUzB0TFMwdExTMHRMUzB0TFMwdExTMHRMUzB0TFMwdExTMHRKenRjYmtaaGFXeDFjbVV1UmxKQlRVVmZVRkpGUmtsWUlEMGdKeUFnWVhRZ0p6dGNibHh1THk4Z1Fua2daR1ZtWVhWc2RDQjNaU0JsYm1GaWJHVWdkSEpoWTJ0cGJtY2dabTl5SUdGemVXNWpJSE4wWVdOcklIUnlZV05sYzF4dVJtRnBiSFZ5WlM1VVVrRkRTeUE5SUhSeWRXVTdYRzVjYmx4dUx5OGdTR1ZzY0dWeUlIUnZJRzlpZEdGcGJpQjBhR1VnWTNWeWNtVnVkQ0J6ZEdGamF5QjBjbUZqWlZ4dWRtRnlJR2RsZEVWeWNtOXlWMmwwYUZOMFlXTnJJRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0J5WlhSMWNtNGdibVYzSUU1aGRHbDJaVVZ5Y205eUtDazdYRzU5TzF4dUx5OGdVMjl0WlNCbGJtZHBibVZ6SUdSdklHNXZkQ0JuWlc1bGNtRjBaU0IwYUdVZ0xuTjBZV05ySUhCeWIzQmxjblI1SUhWdWRHbHNJR2wwSjNNZ2RHaHliM2R1WEc1cFppQW9JV2RsZEVWeWNtOXlWMmwwYUZOMFlXTnJLQ2t1YzNSaFkyc3BJSHRjYmlBZ1oyVjBSWEp5YjNKWGFYUm9VM1JoWTJzZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdkSEo1SUhzZ2RHaHliM2NnYm1WM0lFNWhkR2wyWlVWeWNtOXlLQ2s3SUgwZ1kyRjBZMmdnS0dVcElIc2djbVYwZFhKdUlHVTdJSDFjYmlBZ2ZUdGNibjFjYmx4dUx5OGdWSEpwYlNCbWNtRnRaWE1nZFc1a1pYSWdkR2hsSUhCeWIzWnBaR1ZrSUhOMFlXTnJJR1pwY25OMElHWjFibU4wYVc5dVhHNW1kVzVqZEdsdmJpQjBjbWx0S0daeVlXMWxjeXdnYzJabUtTQjdYRzRnSUhaaGNpQm1iaXdnYm1GdFpTQTlJSE5tWmk1dVlXMWxPMXh1SUNCcFppQW9JV1p5WVcxbGN5a2dlMXh1SUNBZ0lHTnZibk52YkdVdWQyRnliaWduVzBaaGFXeDFjbVZkSUdWeWNtOXlJR05oY0hSMWNtbHVaeUJtY21GdFpYTW5LVHRjYmlBZ0lDQnlaWFIxY200Z1cxMDdYRzRnSUgxY2JpQWdabTl5SUNoMllYSWdhVDB3T3lCcElEd2dabkpoYldWekxteGxibWQwYURzZ2FTc3JLU0I3WEc0Z0lDQWdabTRnUFNCbWNtRnRaWE5iYVYwdVoyVjBSblZ1WTNScGIyNG9LVHRjYmlBZ0lDQnBaaUFvWm00Z0ppWWdabTRnUFQwOUlITm1aaUI4ZkNCdVlXMWxJQ1ltSUc1aGJXVWdQVDA5SUdaeVlXMWxjMXRwWFM1blpYUkdkVzVqZEdsdmJrNWhiV1VvS1NrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUdaeVlXMWxjeTV6YkdsalpTaHBJQ3NnTVNrN1hHNGdJQ0FnZlZ4dUlDQjlYRzRnSUhKbGRIVnliaUJtY21GdFpYTTdYRzU5WEc1Y2JtWjFibU4wYVc5dUlIVnVkMmx1WkNBb1puSmhiV1Z6S1NCN1hHNGdJSFpoY2lCeVpYTjFiSFFnUFNCYlhUdGNibHh1SUNCbWIzSWdLSFpoY2lCcFBUQXNJR1p1T3lCcElEd2dabkpoYldWekxteGxibWQwYURzZ2FTc3JLU0I3WEc0Z0lDQWdabTRnUFNCbWNtRnRaWE5iYVYwdVoyVjBSblZ1WTNScGIyNG9LVHRjYmx4dUlDQWdJR2xtSUNnaFptNGdmSHdnSVdadVcxTlpUVUpQVEY5SlIwNVBVa1ZkS1NCN1hHNGdJQ0FnSUNCeVpYTjFiSFF1Y0hWemFDaG1jbUZ0WlhOYmFWMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHbG1JQ2htYmlBbUppQm1ibHRUV1UxQ1QweGZSbEpCVFVWVFhTa2dlMXh1SUNBZ0lDQWdhV1lnS0VaaGFXeDFjbVV1UmxKQlRVVmZSVTFRVkZrcElIdGNiaUFnSUNBZ0lDQWdjbVZ6ZFd4MExuQjFjMmdvYm5Wc2JDazdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQzh2SUVOaGJHd2dkR2hsSUdkbGRIUmxjaUJoYm1RZ2EyVmxjQ0JoSUhKbFptVnlaVzVqWlNCMGJ5QjBhR1VnY21WemRXeDBJR2x1SUdOaGMyVWdkMlVnYUdGMlpTQjBiMXh1SUNBZ0lDQWdMeThnZFc1M2FXNWtJSFJvWlNCellXMWxJR1oxYm1OMGFXOXVJR0Z1YjNSb1pYSWdkR2x0WlM1Y2JpQWdJQ0FnSUM4dklGUlBSRTg2SUUxaGEyVWdjM1Z5WlNCclpXVndhVzVuSUdFZ2NtVm1aWEpsYm1ObElIUnZJSFJvWlNCbWNtRnRaWE1nWkc5bGMyNG5kQ0JqY21WaGRHVWdiR1ZoYTNOY2JpQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ1ptNWJVMWxOUWs5TVgwWlNRVTFGVTEwZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0FnSUNBZ2RtRnlJR2RsZEhSbGNpQTlJR1p1VzFOWlRVSlBURjlHVWtGTlJWTmRPMXh1SUNBZ0lDQWdJQ0JtYmx0VFdVMUNUMHhmUmxKQlRVVlRYU0E5SUc1MWJHdzdYRzRnSUNBZ0lDQWdJR1p1VzFOWlRVSlBURjlHVWtGTlJWTmRJRDBnWjJWMGRHVnlLQ2s3WEc0Z0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUdsbUlDZ2habTViVTFsTlFrOU1YMFpTUVUxRlUxMHBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMyOXNaUzUzWVhKdUtDZGJSbUZwYkhWeVpWMGdSVzF3ZEhrZ1puSmhiV1Z6SUdGdWJtOTBZWFJwYjI0bktUdGNiaUFnSUNBZ0lDQWdZMjl1ZEdsdWRXVTdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSEpsYzNWc2RDNXdkWE5vTG1Gd2NHeDVLSEpsYzNWc2RDd2dkVzUzYVc1a0tHWnVXMU5aVFVKUFRGOUdVa0ZOUlZOZEtTazdYRzRnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnY21WemRXeDBPMXh1ZlZ4dVhHNHZMeUJTWldObGFYWmxjaUJtYjNJZ2RHaGxJR1p5WVcxbGN5QnBiaUJoSUM1emRHRmpheUJ3Y205d1pYSjBlU0JtY205dElHTmhjSFIxY21WVGRHRmphMVJ5WVdObFhHNTJZWElnVmpoR1VrRk5SVk1nUFNCN2ZUdGNibHh1THk4Z1ZqZ2dZMjlrWlNCd1lYUm9JR1p2Y2lCblpXNWxjbUYwYVc1bklHRWdabkpoYldWeklHZGxkSFJsY2x4dVpuVnVZM1JwYjI0Z2JXRnJaVVp5WVcxbGMwZGxkSFJsY2xZNElDaHpabVlwSUh0Y2JpQWdUbUYwYVhabFJYSnliM0l1WTJGd2RIVnlaVk4wWVdOclZISmhZMlVvVmpoR1VrRk5SVk1zSUhObVppQjhmQ0J0WVd0bFJuSmhiV1Z6UjJWMGRHVnlWamdwTzF4dUlDQnpabVlnUFNCdWRXeHNPMXh1SUNCMllYSWdabkpoYldWeklEMGdWamhHVWtGTlJWTXVjM1JoWTJzN1hHNGdJRlk0UmxKQlRVVlRMbk4wWVdOcklEMGdiblZzYkRzZ0lDOHZJRWxOVUU5U1ZFRk9WRG9nVkdocGN5QnBjeUJ1WldWa1pXUWdkRzhnWVhadmFXUWdiR1ZoYTNNaElTRmNiaUFnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2hqYkdWaGJuVndLU0I3WEc0Z0lDQWdkbUZ5SUhKbGMzVnNkQ0E5SUdaeVlXMWxjenRjYmlBZ0lDQXZMeUJEYkdWaGJpQjFjQ0JqYkc5emRYSmxJSFpoY21saFlteGxjeUIwYnlCb1pXeHdJRWREWEc0Z0lDQWdabkpoYldWeklEMGdiblZzYkR0Y2JpQWdJQ0J5WlhSMWNtNGdjbVZ6ZFd4ME8xeHVJQ0I5TzF4dWZWeHVYRzR2THlCdWIyNHRWamdnWTI5a1pTQndZWFJvSUdadmNpQm5aVzVsY21GMGFXNW5JR0VnWm5KaGJXVnpJR2RsZEhSbGNseHVablZ1WTNScGIyNGdiV0ZyWlVaeVlXMWxjMGRsZEhSbGNrTnZiWEJoZENBb2MyWm1LU0I3WEc0Z0lDOHZJRTlpZEdGcGJpQmhJSE4wWVdOcklIUnlZV05sSUdGMElIUm9aU0JqZFhKeVpXNTBJSEJ2YVc1MFhHNGdJSFpoY2lCbGNuSnZjaUE5SUdkbGRFVnljbTl5VjJsMGFGTjBZV05yS0NrN1hHNWNiaUFnTHk4Z1YyRnNheUIwYUdVZ1kyRnNiR1Z5SUdOb1lXbHVJSFJ2SUdGdWJtOTBZWFJsSUhSb1pTQnpkR0ZqYXlCM2FYUm9JR1oxYm1OMGFXOXVJSEpsWm1WeVpXNWpaWE5jYmlBZ0x5OGdSMmwyWlc0Z2RHaGxJR3hwYldsMFlYUnBiMjV6SUdsdGNHOXpaV1FnWW5rZ1JWTTFJRndpYzNSeWFXTjBJRzF2WkdWY0lpQnBkQ2R6SUc1dmRDQndiM056YVdKc1pWeHVJQ0F2THlCMGJ5QnZZblJoYVc0Z2NtVm1aWEpsYm1ObGN5QjBieUJtZFc1amRHbHZibk1nWW1WNWIyNWtJRzl1WlNCMGFHRjBJR2x6SUdSbFptbHVaV1FnYVc0Z2MzUnlhV04wWEc0Z0lDOHZJRzF2WkdVdUlFRnNjMjhnYm05MFpTQjBhR0YwSUdGdWVTQnJhVzVrSUc5bUlISmxZM1Z5YzJsdmJpQjNhV3hzSUcxaGEyVWdkR2hsSUhkaGJHdGxjaUIxYm1GaWJHVmNiaUFnTHk4Z2RHOGdaMjhnY0dGemRDQnBkQzVjYmlBZ2RtRnlJR05oYkd4bGNpQTlJR0Z5WjNWdFpXNTBjeTVqWVd4c1pXVTdYRzRnSUhaaGNpQm1kVzVqZEdsdmJuTWdQU0JiWjJWMFJYSnliM0pYYVhSb1UzUmhZMnRkTzF4dUlDQm1iM0lnS0haaGNpQnBQVEE3SUdOaGJHeGxjaUFtSmlCcElEd2dNVEE3SUdrckt5a2dlMXh1SUNBZ0lHWjFibU4wYVc5dWN5NXdkWE5vS0dOaGJHeGxjaWs3WEc0Z0lDQWdhV1lnS0dOaGJHeGxjaTVqWVd4c1pYSWdQVDA5SUdOaGJHeGxjaWtnWW5KbFlXczdYRzRnSUNBZ1kyRnNiR1Z5SUQwZ1kyRnNiR1Z5TG1OaGJHeGxjanRjYmlBZ2ZWeHVJQ0JqWVd4c1pYSWdQU0J1ZFd4c08xeHVYRzRnSUhKbGRIVnliaUJtZFc1amRHbHZiaUFvWTJ4bFlXNTFjQ2tnZTF4dUlDQWdJSFpoY2lCbWNtRnRaWE1nUFNCdWRXeHNPMXh1WEc0Z0lDQWdhV1lnS0NGamJHVmhiblZ3S1NCN1hHNGdJQ0FnSUNBdkx5QlFZWEp6WlNCMGFHVWdjM1JoWTJzZ2RISmhZMlZjYmlBZ0lDQWdJR1p5WVcxbGN5QTlJRVZ5Y205eVUzUmhZMnRRWVhKelpYSXVjR0Z5YzJVb1pYSnliM0lwTzF4dUlDQWdJQ0FnTHk4Z1FYUjBZV05vSUdaMWJtTjBhVzl1SUhKbFptVnlaVzVqWlhNZ2RHOGdkR2hsSUdaeVlXMWxjeUFvYzJ0cGNIQnBibWNnZEdobElHMWhhMlZ5SUdaeVlXMWxjeWxjYmlBZ0lDQWdJQzh2SUdGdVpDQmpjbVZoZEdsdVp5QkRZV3hzVTJsMFpTQnZZbXBsWTNSeklHWnZjaUJsWVdOb0lHOXVaUzVjYmlBZ0lDQWdJR1p2Y2lBb2RtRnlJR2s5TWpzZ2FTQThJR1p5WVcxbGN5NXNaVzVuZEdnN0lHa3JLeWtnZTF4dUlDQWdJQ0FnSUNCbWNtRnRaWE5iYVYwdVpuVnVZM1JwYjI0Z1BTQm1kVzVqZEdsdmJuTmJhVjA3WEc0Z0lDQWdJQ0FnSUdaeVlXMWxjMXRwWFNBOUlHNWxkeUJEWVd4c1UybDBaU2htY21GdFpYTmJhVjBwTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCbWNtRnRaWE1nUFNCMGNtbHRLR1p5WVcxbGN5NXpiR2xqWlNneUtTd2djMlptS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2THlCRGJHVmhiaUIxY0NCamJHOXpkWEpsSUhaaGNtbGhZbXhsY3lCMGJ5Qm9aV3h3SUVkRFhHNGdJQ0FnYzJabUlEMGdiblZzYkR0Y2JpQWdJQ0JsY25KdmNpQTlJRzUxYkd3N1hHNGdJQ0FnWm5WdVkzUnBiMjV6SUQwZ2JuVnNiRHRjYmx4dUlDQWdJSEpsZEhWeWJpQm1jbUZ0WlhNN1hHNGdJSDA3WEc1OVhHNWNiaTh2SUVkbGJtVnlZWFJsY3lCaElHZGxkSFJsY2lCbWIzSWdkR2hsSUdOaGJHd2djMmwwWlNCbWNtRnRaWE5jYmk4dklGUlBSRTg2SUVsbUlIZGxJRzlpYzJWeWRtVWdiR1ZoYTNNZ2QybDBhQ0JqYjIxd2JHVjRJSFZ6WlNCallYTmxjeUFvWkhWbElIUnZJR05zYjNOMWNtVWdjMk52Y0dWektWeHVMeThnSUNBZ0lDQWdkMlVnWTJGdUlHZGxibVZ5WVhSbElHaGxjbVVnYjNWeUlHTnZiWEJoZENCRFlXeHNVMmwwWlNCdlltcGxZM1J6SUhOMGIzSnBibWNnZEdobElHWjFibU4wYVc5dUozTmNiaTh2SUNBZ0lDQWdJSE52ZFhKalpTQmpiMlJsSUdsdWMzUmxZV1FnYjJZZ1lXNGdZV04wZFdGc0lISmxabVZ5Wlc1alpTQjBieUIwYUdWdExDQjBhR0YwSUhOb2IzVnNaQ0JvWld4d1hHNHZMeUFnSUNBZ0lDQjBhR1VnUjBNZ2MybHVZMlVnZDJVbmJHd2dZbVVnYW5WemRDQnJaV1Z3YVc1bklHeHBkR1Z5WVd4eklHRnliM1Z1WkM1Y2JuWmhjaUJ0WVd0bFJuSmhiV1Z6UjJWMGRHVnlJRDBnZEhsd1pXOW1JRTVoZEdsMlpVVnljbTl5TG1OaGNIUjFjbVZUZEdGamExUnlZV05sSUQwOVBTQW5ablZ1WTNScGIyNG5YRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBL0lHMWhhMlZHY21GdFpYTkhaWFIwWlhKV09GeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnT2lCdFlXdGxSbkpoYldWelIyVjBkR1Z5UTI5dGNHRjBPMXh1WEc1Y2JpOHZJRTkyWlhKeWFXUmxJRlk0SUhOMFlXTnJJSFJ5WVdObElHSjFhV3hrWlhJZ2RHOGdhVzVxWldOMElHOTFjaUJzYjJkcFkxeHVkbUZ5SUc5c1pGQnlaWEJoY21WVGRHRmphMVJ5WVdObElEMGdSWEp5YjNJdWNISmxjR0Z5WlZOMFlXTnJWSEpoWTJVN1hHNUZjbkp2Y2k1d2NtVndZWEpsVTNSaFkydFVjbUZqWlNBOUlHWjFibU4wYVc5dUlDaGxjbkp2Y2l3Z1puSmhiV1Z6S1NCN1hHNGdJQzh2SUZkb1pXNGdZMkZzYkdWa0lHWnliMjBnYldGclpVWnlZVzFsYzBkbGRIUmxjaUIzWlNCcWRYTjBJSGRoYm5RZ2RHOGdiMkowWVdsdUlIUm9aU0JtY21GdFpYTmNiaUFnYVdZZ0tHVnljbTl5SUQwOVBTQldPRVpTUVUxRlV5a2dlMXh1SUNBZ0lISmxkSFZ5YmlCbWNtRnRaWE03WEc0Z0lIMWNibHh1SUNBdkx5QkdiM0ozWVhKa0lIUnZJR0Z1ZVNCd2NtVjJhVzkxYzJ4NUlHUmxabWx1WldRZ1ltVm9ZWFpwYjNWeVhHNGdJR2xtSUNodmJHUlFjbVZ3WVhKbFUzUmhZMnRVY21GalpTa2dlMXh1SUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdiMnhrVUhKbGNHRnlaVk4wWVdOclZISmhZMlV1WTJGc2JDaEZjbkp2Y2l3Z1pYSnliM0lzSUdaeVlXMWxjeWs3WEc0Z0lDQWdmU0JqWVhSamFDQW9aU2tnZTF4dUlDQWdJQ0FnTHk4Z1NuVnpkQ0JwWjI1dmNtVWdkR2hsSUdWeWNtOXlJQ2hwWlRvZ2EyRnliV0V0YzI5MWNtTmxMVzFoY0MxemRYQndiM0owS1Z4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUM4dklFVnRkV3hoZEdVZ1pHVm1ZWFZzZENCaVpXaGhkbWx2ZFhJZ0tIZHBkR2dnYkc5dVp5MTBjbUZqWlhNcFhHNGdJSEpsZEhWeWJpQkdZV2xzZFhKbExuQnliM1J2ZEhsd1pTNXdjbVZ3WVhKbFUzUmhZMnRVY21GalpTNWpZV3hzS0dWeWNtOXlMQ0IxYm5kcGJtUW9abkpoYldWektTazdYRzU5TzF4dVhHNHZMeUJCZEhSaFkyZ2dZU0J1WlhjZ1pYaGpiSFZ6YVc5dUlIQnlaV1JwWTJGMFpTQm1iM0lnWm5KaGJXVnpYRzVtZFc1amRHbHZiaUJsZUdOc2RXUmxJQ2hqZEc5eUxDQndjbVZrYVdOaGRHVXBJSHRjYmlBZ2RtRnlJR1p1SUQwZ2NISmxaR2xqWVhSbE8xeHVYRzRnSUdsbUlDaDBlWEJsYjJZZ2NISmxaR2xqWVhSbElEMDlQU0FuYzNSeWFXNW5KeWtnZTF4dUlDQWdJR1p1SUQwZ1puVnVZM1JwYjI0Z0tHWnlZVzFsS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnTFRFZ0lUMDlJR1p5WVcxbExtZGxkRVpwYkdWT1lXMWxLQ2t1YVc1a1pYaFBaaWh3Y21Wa2FXTmhkR1VwTzF4dUlDQWdJSDA3WEc0Z0lIMGdaV3h6WlNCcFppQW9kSGx3Wlc5bUlIQnlaV1JwWTJGMFpTNTBaWE4wSUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdabTRnUFNCbWRXNWpkR2x2YmlBb1puSmhiV1VwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJ3Y21Wa2FXTmhkR1V1ZEdWemRDaG1jbUZ0WlM1blpYUkdhV3hsVG1GdFpTZ3BLVHRjYmlBZ0lDQjlPMXh1SUNCOVhHNWNiaUFnWTNSdmNpNWxlR05zZFdSbGN5NXdkWE5vS0dadUtUdGNibjFjYmx4dUx5OGdSWGh3YjNObElIUm9aU0JtYVd4MFpYSWdhVzRnZEdobElISnZiM1FnUm1GcGJIVnlaU0IwZVhCbFhHNUdZV2xzZFhKbExtVjRZMngxWkdWeklEMGdXMTA3WEc1R1lXbHNkWEpsTG1WNFkyeDFaR1VnUFNCbWRXNWpkR2x2YmlCR1lXbHNkWEpsWDJWNFkyeDFaR1VnS0hCeVpXUnBZMkYwWlNrZ2UxeHVJQ0JsZUdOc2RXUmxLRVpoYVd4MWNtVXNJSEJ5WldScFkyRjBaU2s3WEc1OU8xeHVYRzR2THlCQmRIUmhZMmdnWVNCbWNtRnRaWE1nWjJWMGRHVnlJSFJ2SUhSb1pTQm1kVzVqZEdsdmJpQnpieUIzWlNCallXNGdjbVV0WTI5dWMzUnlkV04wSUdGemVXNWpJSE4wWVdOcmN5NWNiaTh2WEc0dkx5Qk9iM1JsSUhSb1lYUWdkR2hwY3lCcWRYTjBJR0YxWjIxbGJuUnpJSFJvWlNCbWRXNWpkR2x2YmlCM2FYUm9JSFJvWlNCdVpYY2djSEp2Y0dWeWRIa3NJR2wwSUdSdlpYTnVKM1JjYmk4dklHTnlaV0YwWlNCaElIZHlZWEJ3WlhJZ1pYWmxjbmtnZEdsdFpTQnBkQ2R6SUdOaGJHeGxaQ3dnYzI4Z2RYTnBibWNnYVhRZ2JYVnNkR2x3YkdVZ2RHbHRaWE1nYjI0Z2RHaGxYRzR2THlCellXMWxJR1oxYm1OMGFXOXVJSGRwYkd3Z2FXNWtaV1ZrSUc5MlpYSjNjbWwwWlNCMGFHVWdjSEpsZG1sdmRYTWdkSEpoWTJ0cGJtY2dhVzVtYjNKdFlYUnBiMjR1SUZSb2FYTmNiaTh2SUdseklHbHVkR1Z1WkdWa0lITnBibU5sSUdsMEozTWdabUZ6ZEdWeUlHRnVaQ0J0YjNKbElHbHRjRzl5ZEdGdWRHeDVJR1J2WlhOdUozUWdZbkpsWVdzZ2MyOXRaU0JCVUVselhHNHZMeUIxYzJsdVp5QmpZV3hzWW1GamF5QnlaV1psY21WdVkyVnpJSFJ2SUhWdWNtVm5hWE4wWlhJZ2RHaGxiU0JtYjNJZ2FXNXpkR0Z1WTJVdVhHNHZMeUJYYUdWdUlIbHZkU0IzWVc1MElIUnZJSFZ6WlNCMGFHVWdjMkZ0WlNCbWRXNWpkR2x2YmlCM2FYUm9JR1JwWm1abGNtVnVkQ0IwY21GamEybHVaeUJwYm1admNtMWhkR2x2Ymx4dUx5OGdhblZ6ZENCMWMyVWdSbUZwYkhWeVpTNTNjbUZ3S0NrdVhHNHZMMXh1THk4Z1ZHaGxJSFJ5WVdOcmFXNW5JR05oYmlCaVpTQm5iRzlpWVd4c2VTQmthWE5oWW14bFpDQmllU0J6WlhSMGFXNW5JRVpoYVd4MWNtVXVWRkpCUTBzZ2RHOGdabUZzYzJWY2JrWmhhV3gxY21VdWRISmhZMnNnUFNCbWRXNWpkR2x2YmlCR1lXbHNkWEpsWDNSeVlXTnJJQ2htYml3Z2MyWm1LU0I3WEc0Z0lHbG1JQ2gwZVhCbGIyWWdabTRnSVQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ0lDQnlaWFIxY200Z1ptNDdYRzRnSUgxY2JseHVJQ0F2THlCRGJHVmhiaUIxY0NCd2NtVjJhVzkxY3lCbWNtRnRaWE1nZEc4Z2FHVnNjQ0IwYUdVZ1IwTmNiaUFnYVdZZ0tIUjVjR1Z2WmlCbWJsdFRXVTFDVDB4ZlJsSkJUVVZUWFNBOVBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQWdJR1p1VzFOWlRVSlBURjlHVWtGTlJWTmRLSFJ5ZFdVcE8xeHVJQ0I5WEc1Y2JpQWdhV1lnS0VaaGFXeDFjbVV1VkZKQlEwc3BJSHRjYmlBZ0lDQm1ibHRUV1UxQ1QweGZSbEpCVFVWVFhTQTlJRzUxYkd3N1hHNGdJQ0FnWm01YlUxbE5RazlNWDBaU1FVMUZVMTBnUFNCdFlXdGxSbkpoYldWelIyVjBkR1Z5S0hObVppQjhmQ0JHWVdsc2RYSmxYM1J5WVdOcktUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQm1ianRjYm4wN1hHNWNiaTh2SUZkeVlYQnpJSFJvWlNCbWRXNWpkR2x2YmlCaVpXWnZjbVVnWVc1dWIzUmhkR2x1WnlCcGRDQjNhWFJvSUhSeVlXTnJhVzVuSUdsdVptOXliV0YwYVc5dUxDQjBhR2x6WEc0dkx5QmhiR3h2ZDNNZ2RHOGdkSEpoWTJzZ2JYVnNkR2x3YkdVZ2MyTm9aV1IxYkd4cGJtZHpJRzltSUdFZ2MybHVaMnhsSUdaMWJtTjBhVzl1TGx4dVJtRnBiSFZ5WlM1M2NtRndJRDBnWm5WdVkzUnBiMjRnUm1GcGJIVnlaVjkzY21Gd0lDaG1iaWtnZTF4dUlDQjJZWElnZDNKaGNIQmxjaUE5SUVaaGFXeDFjbVV1YVdkdWIzSmxLR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdabTR1WVhCd2JIa29kR2hwY3l3Z1lYSm5kVzFsYm5SektUdGNiaUFnZlNrN1hHNWNiaUFnY21WMGRYSnVJRVpoYVd4MWNtVXVkSEpoWTJzb2QzSmhjSEJsY2l3Z1JtRnBiSFZ5WlY5M2NtRndLVHRjYm4wN1hHNWNiaTh2SUUxaGNtc2dZU0JtZFc1amRHbHZiaUIwYnlCaVpTQnBaMjV2Y21Wa0lIZG9aVzRnWjJWdVpYSmhkR2x1WnlCemRHRmpheUIwY21GalpYTmNia1poYVd4MWNtVXVhV2R1YjNKbElEMGdablZ1WTNScGIyNGdSbUZwYkhWeVpWOXBaMjV2Y21VZ0tHWnVLU0I3WEc0Z0lHWnVXMU5aVFVKUFRGOUpSMDVQVWtWZElEMGdkSEoxWlR0Y2JpQWdjbVYwZFhKdUlHWnVPMXh1ZlR0Y2JseHVSbUZwYkhWeVpTNXpaWFJVYVcxbGIzVjBJRDBnWm5WdVkzUnBiMjRnUm1GcGJIVnlaVjl6WlhSVWFXMWxiM1YwSUNncElIdGNiaUFnWVhKbmRXMWxiblJ6V3pCZElEMGdSbUZwYkhWeVpTNTBjbUZqYXloaGNtZDFiV1Z1ZEhOYk1GMHNJRVpoYVd4MWNtVmZjMlYwVkdsdFpXOTFkQ2s3WEc0Z0lISmxkSFZ5YmlCelpYUlVhVzFsYjNWMExtRndjR3g1S0c1MWJHd3NJR0Z5WjNWdFpXNTBjeWs3WEc1OU8xeHVYRzVHWVdsc2RYSmxMbTVsZUhSVWFXTnJJRDBnWm5WdVkzUnBiMjRnUm1GcGJIVnlaVjl1WlhoMFZHbGpheUFvS1NCN1hHNGdJR0Z5WjNWdFpXNTBjMXN3WFNBOUlFWmhhV3gxY21VdWRISmhZMnNvWVhKbmRXMWxiblJ6V3pCZExDQkdZV2xzZFhKbFgyNWxlSFJVYVdOcktUdGNiaUFnY21WMGRYSnVJSEJ5YjJObGMzTXVibVY0ZEZScFkyc3VZWEJ3Ykhrb2NISnZZMlZ6Y3l3Z1lYSm5kVzFsYm5SektUdGNibjA3WEc1Y2JrWmhhV3gxY21VdWNHRjBZMmdnUFNCbWRXNWpkR2x2YmlCR1lXbHNkWEpsWDNCaGRHTm9LRzlpYWl3Z2JtRnRaU3dnYVdSNEtTQjdYRzRnSUdsbUlDaHZZbW9nSmlZZ2RIbHdaVzltSUc5aWFsdHVZVzFsWFNBaFBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQWdJSFJvY205M0lHNWxkeUJGY25KdmNpZ25UMkpxWldOMElHUnZaWE1nYm05MElHaGhkbVVnWVNCY0lpY2dLeUJ1WVcxbElDc2dKMXdpSUcxbGRHaHZaQ2NwTzF4dUlDQjlYRzVjYmlBZ2RtRnlJRzl5YVdkcGJtRnNJRDBnYjJKcVcyNWhiV1ZkTzF4dVhHNGdJQzh2SUZkb1pXNGdkR2hsSUdWNFlXTjBJR0Z5WjNWdFpXNTBJR2x1WkdWNElHbHpJSEJ5YjNacFpHVmtJSFZ6WlNCaGJpQnZjSFJwYldsNlpXUWdZMjlrWlNCd1lYUm9YRzRnSUdsbUlDaDBlWEJsYjJZZ2FXUjRJRDA5UFNBbmJuVnRZbVZ5SnlrZ2UxeHVYRzRnSUNBZ2IySnFXMjVoYldWZElEMGdablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnWVhKbmRXMWxiblJ6VzJsa2VGMGdQU0JHWVdsc2RYSmxMblJ5WVdOcktHRnlaM1Z0Wlc1MGMxdHBaSGhkTENCdlltcGJibUZ0WlYwcE8xeHVJQ0FnSUNBZ2NtVjBkWEp1SUc5eWFXZHBibUZzTG1Gd2NHeDVLSFJvYVhNc0lHRnlaM1Z0Wlc1MGN5azdYRzRnSUNBZ2ZUdGNibHh1SUNBdkx5QlBkR2hsY25kcGMyVWdaR1YwWldOMElIUm9aU0JtZFc1amRHbHZibk1nZEc4Z2RISmhZMnNnWVhRZ2FXNTJiMnRoZEdsdmJpQjBhVzFsWEc0Z0lIMGdaV3h6WlNCN1hHNWNiaUFnSUNCdlltcGJibUZ0WlYwZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0JtYjNJZ0tIWmhjaUJwSUQwZ01Ec2dhU0E4SUdGeVozVnRaVzUwY3k1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdGeVozVnRaVzUwYzF0cFhTQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUNBZ0lDQWdJR0Z5WjNWdFpXNTBjMXRwWFNBOUlFWmhhV3gxY21VdWRISmhZMnNvWVhKbmRXMWxiblJ6VzJsZExDQnZZbXBiYm1GdFpWMHBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0J5WlhSMWNtNGdiM0pwWjJsdVlXd3VZWEJ3Ykhrb2RHaHBjeXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0I5TzF4dVhHNGdJSDFjYmx4dUlDQXZMeUJCZFdkdFpXNTBJSFJvWlNCM2NtRndjR1Z5SUhkcGRHZ2dZVzU1SUhCeWIzQmxjblJwWlhNZ1puSnZiU0IwYUdVZ2IzSnBaMmx1WVd4Y2JpQWdabTl5SUNoMllYSWdheUJwYmlCdmNtbG5hVzVoYkNrZ2FXWWdLRzl5YVdkcGJtRnNMbWhoYzA5M2JsQnliM0JsY25SNUtHc3BLU0I3WEc0Z0lDQWdiMkpxVzI1aGJXVmRXMnRkSUQwZ2IzSnBaMmx1WVd4YmExMDdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdiMkpxVzI1aGJXVmRPMXh1ZlR0Y2JseHVMeThnU0dWc2NHVnlJSFJ2SUdOeVpXRjBaU0J1WlhjZ1JtRnBiSFZ5WlNCMGVYQmxjMXh1Um1GcGJIVnlaUzVqY21WaGRHVWdQU0JtZFc1amRHbHZiaUFvYm1GdFpTd2djSEp2Y0hNcElIdGNiaUFnYVdZZ0tIUjVjR1Z2WmlCdVlXMWxJQ0U5UFNBbmMzUnlhVzVuSnlrZ2UxeHVJQ0FnSUhSb2NtOTNJRzVsZHlCR1lXbHNkWEpsS0NkRmVIQmxZM1JsWkNCaElHNWhiV1VnWVhNZ1ptbHljM1FnWVhKbmRXMWxiblFuS1R0Y2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlHTjBiM0lnS0cxbGMzTmhaMlVzSUhObVppa2dlMXh1SUNBZ0lHbG1JQ2doS0hSb2FYTWdhVzV6ZEdGdVkyVnZaaUJHWVdsc2RYSmxLU2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRzVsZHlCamRHOXlLRzFsYzNOaFoyVXNJSE5tWmlrN1hHNGdJQ0FnZlZ4dUlDQWdJRVpoYVd4MWNtVXVZWEJ3Ykhrb2RHaHBjeXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdmVnh1WEc0Z0lDOHZJRUYxWjIxbGJuUWdZMjl1YzNSeWRXTjBiM0pjYmlBZ1kzUnZjaTVsZUdOc2RXUmxjeUE5SUZ0ZE8xeHVJQ0JqZEc5eUxtVjRZMngxWkdVZ1BTQm1kVzVqZEdsdmJpQW9jSEpsWkdsallYUmxLU0I3WEc0Z0lDQWdaWGhqYkhWa1pTaGpkRzl5TENCd2NtVmthV05oZEdVcE8xeHVJQ0I5TzF4dVhHNGdJR04wYjNJdWNISnZkRzkwZVhCbElEMGdUMkpxWldOMExtTnlaV0YwWlNoR1lXbHNkWEpsTG5CeWIzUnZkSGx3WlNrN1hHNGdJR04wYjNJdWNISnZkRzkwZVhCbExtTnZibk4wY25WamRHOXlJRDBnWTNSdmNqdGNiaUFnWTNSdmNpNXdjbTkwYjNSNWNHVXVibUZ0WlNBOUlHNWhiV1U3WEc0Z0lHbG1JQ2gwZVhCbGIyWWdjSEp2Y0hNZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0JqZEc5eUxuQnliM1J2ZEhsd1pTNXdjbVZ3WVhKbFUzUmhZMnRVY21GalpTQTlJSEJ5YjNCek8xeHVJQ0I5SUdWc2MyVWdhV1lnS0hCeWIzQnpLU0I3WEc0Z0lDQWdUMkpxWldOMExtdGxlWE1vY0hKdmNITXBMbVp2Y2tWaFkyZ29ablZ1WTNScGIyNGdLSEJ5YjNBcElIdGNiaUFnSUNBZ0lHTjBiM0l1Y0hKdmRHOTBlWEJsVzNCeWIzQmRJRDBnY0hKdmNEdGNiaUFnSUNCOUtUdGNiaUFnZlZ4dUlDQnlaWFIxY200Z1kzUnZjanRjYm4wN1hHNWNiblpoY2lCaWRXbHNkR2x1UlhKeWIzSlVlWEJsY3lBOUlGdGNiaUFnSjBWeWNtOXlKeXdnSjFSNWNHVkZjbkp2Y2ljc0lDZFNZVzVuWlVWeWNtOXlKeXdnSjFKbFptVnlaVzVqWlVWeWNtOXlKeXdnSjFONWJuUmhlRVZ5Y205eUp5eGNiaUFnSjBWMllXeEZjbkp2Y2ljc0lDZFZVa2xGY25KdmNpY3NJQ2RKYm5SbGNtNWhiRVZ5Y205eUoxeHVYVHRjYm5aaGNpQmlkV2xzZEdsdVJYSnliM0p6SUQwZ2UzMDdYRzVjYmtaaGFXeDFjbVV1YVc1emRHRnNiQ0E5SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnZG1GeUlISnZiM1FnUFNCMGVYQmxiMllnZDJsdVpHOTNJRDA5UFNBbmIySnFaV04wSnlBL0lIZHBibVJ2ZHlBNklHZHNiMkpoYkR0Y2JseHVJQ0JpZFdsc2RHbHVSWEp5YjNKVWVYQmxjeTVtYjNKRllXTm9LR1oxYm1OMGFXOXVJQ2gwZVhCbEtTQjdYRzRnSUNBZ2FXWWdLSEp2YjNSYmRIbHdaVjBnSmlZZ0lXSjFhV3gwYVc1RmNuSnZjbk5iZEhsd1pWMHBJSHRjYmlBZ0lDQWdJR0oxYVd4MGFXNUZjbkp2Y25OYmRIbHdaVjBnUFNCeWIyOTBXM1I1Y0dWZE8xeHVJQ0FnSUNBZ2NtOXZkRnQwZVhCbFhTQTlJRVpoYVd4MWNtVXVZM0psWVhSbEtIUjVjR1VwTzF4dUlDQWdJSDFjYmlBZ2ZTazdYRzVjYmlBZ0x5OGdRV3hzYjNjZ2RYTmhaMlU2SUhaaGNpQkdZV2xzZFhKbElEMGdjbVZ4ZFdseVpTZ25abUZwYkhWeVpTY3BMbWx1YzNSaGJHd29LVnh1SUNCeVpYUjFjbTRnUm1GcGJIVnlaVHRjYm4wN1hHNWNia1poYVd4MWNtVXVkVzVwYm5OMFlXeHNJRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0JpZFdsc2RHbHVSWEp5YjNKVWVYQmxjeTVtYjNKRllXTm9LR1oxYm1OMGFXOXVJQ2gwZVhCbEtTQjdYRzRnSUNBZ2NtOXZkRnQwZVhCbFhTQTlJR0oxYVd4MGFXNUZjbkp2Y25OYmRIbHdaVjBnZkh3Z2NtOXZkRnQwZVhCbFhUdGNiaUFnZlNrN1hHNTlPMXh1WEc1Y2JuWmhjaUJ3Y205MGJ5QTlJRVpoYVd4MWNtVXVjSEp2ZEc5MGVYQmxJRDBnVDJKcVpXTjBMbU55WldGMFpTaEZjbkp2Y2k1d2NtOTBiM1I1Y0dVcE8xeHVjSEp2ZEc4dVkyOXVjM1J5ZFdOMGIzSWdQU0JHWVdsc2RYSmxPMXh1WEc1d2NtOTBieTV1WVcxbElEMGdKMFpoYVd4MWNtVW5PMXh1Y0hKdmRHOHViV1Z6YzJGblpTQTlJQ2NuTzF4dVhHNXBaaUFvZEhsd1pXOW1JRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNBOVBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvY0hKdmRHOHNJQ2RtY21GdFpYTW5MQ0I3WEc0Z0lDQWdaMlYwT2lCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQXZMeUJWYzJVZ2RISnBiVzFwYm1jZ2FuVnpkQ0JwYmlCallYTmxJSFJvWlNCelptWWdkMkZ6SUdSbFptbHVaV1FnWVdaMFpYSWdZMjl1YzNSeWRXTjBhVzVuWEc0Z0lDQWdJQ0IyWVhJZ1puSmhiV1Z6SUQwZ2RXNTNhVzVrS0hSeWFXMG9kR2hwY3k1ZloyVjBSbkpoYldWektDa3NJSFJvYVhNdWMyWm1LU2s3WEc1Y2JpQWdJQ0FnSUM4dklFTmhZMmhsSUc1bGVIUWdZV05qWlhOelpYTWdkRzhnZEdobElIQnliM0JsY25SNVhHNGdJQ0FnSUNCUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRIa29kR2hwY3l3Z0oyWnlZVzFsY3ljc0lIdGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklHWnlZVzFsY3l4Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklIUnlkV1ZjYmlBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBdkx5QkRiR1ZoYmlCMWNDQjBhR1VnWjJWMGRHVnlJR05zYjNOMWNtVmNiaUFnSUNBZ0lIUm9hWE11WDJkbGRFWnlZVzFsY3lBOUlHNTFiR3c3WEc1Y2JpQWdJQ0FnSUhKbGRIVnliaUJtY21GdFpYTTdYRzRnSUNBZ2ZWeHVJQ0I5S1R0Y2JseHVJQ0JQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb2NISnZkRzhzSUNkemRHRmpheWNzSUh0Y2JpQWdJQ0JuWlhRNklHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG1kbGJtVnlZWFJsVTNSaFkydFVjbUZqWlNncE8xeHVJQ0FnSUgxY2JpQWdmU2s3WEc1OVhHNWNibkJ5YjNSdkxtZGxibVZ5WVhSbFUzUmhZMnRVY21GalpTQTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdkbUZ5SUdWNFkyeDFaR1Z6SUQwZ2RHaHBjeTVqYjI1emRISjFZM1J2Y2k1bGVHTnNkV1JsY3p0Y2JpQWdkbUZ5SUdsdVkyeDFaR1VzSUdaeVlXMWxjeUE5SUZ0ZE8xeHVYRzRnSUM4dklGTndaV05wWm1saklIQnliM1J2ZEhsd1pYTWdhVzVvWlhKcGRDQjBhR1VnWlhoamJIVmtaWE1nWm5KdmJTQkdZV2xzZFhKbFhHNGdJR2xtSUNobGVHTnNkV1JsY3lBaFBUMGdSbUZwYkhWeVpTNWxlR05zZFdSbGN5a2dlMXh1SUNBZ0lHVjRZMngxWkdWekxuQjFjMmd1WVhCd2JIa29aWGhqYkhWa1pYTXNJRVpoYVd4MWNtVXVaWGhqYkhWa1pYTXBPMXh1SUNCOVhHNWNiaUFnTHk4Z1FYQndiSGtnWm1sc2RHVnlhVzVuWEc0Z0lHWnZjaUFvZG1GeUlHazlNRHNnYVNBOElIUm9hWE11Wm5KaGJXVnpMbXhsYm1kMGFEc2dhU3NyS1NCN1hHNGdJQ0FnYVc1amJIVmtaU0E5SUhSeWRXVTdYRzRnSUNBZ2FXWWdLSFJvYVhNdVpuSmhiV1Z6VzJsZEtTQjdYRzRnSUNBZ0lDQm1iM0lnS0haaGNpQnFQVEE3SUdsdVkyeDFaR1VnSmlZZ2FpQThJR1Y0WTJ4MVpHVnpMbXhsYm1kMGFEc2dhaXNyS1NCN1hHNGdJQ0FnSUNBZ0lHbHVZMngxWkdVZ0pqMGdJV1Y0WTJ4MVpHVnpXMnBkTG1OaGJHd29kR2hwY3l3Z2RHaHBjeTVtY21GdFpYTmJhVjBwTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ0lDQnBaaUFvYVc1amJIVmtaU2tnZTF4dUlDQWdJQ0FnWm5KaGJXVnpMbkIxYzJnb2RHaHBjeTVtY21GdFpYTmJhVjBwTzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUM4dklFaHZibTl5SUdGdWVTQndjbVYyYVc5MWMyeDVJR1JsWm1sdVpXUWdjM1JoWTJ0MGNtRmpaU0JtYjNKdFlYUjBaWElnWW5sY2JpQWdMeThnWVd4c2IzZHBibWNnYVhRZ1ptbHVZV3hzZVNCbWIzSnRZWFFnZEdobElHWnlZVzFsY3k0Z1ZHaHBjeUJwY3lCdVpXVmtaV1JjYmlBZ0x5OGdkMmhsYmlCMWMybHVaeUJ1YjJSbExYTnZkWEpqWlMxdFlYQXRjM1Z3Y0c5eWRDQm1iM0lnYVc1emRHRnVZMlV1WEc0Z0lDOHZJRlJQUkU4NklFTmhiaUIzWlNCdFlYQWdkR2hsSUZ3aWJuVnNiRndpSUdaeVlXMWxjeUIwYnlCaElFTmhiR3hHY21GdFpTQnphR2x0UDF4dUlDQnBaaUFvYjJ4a1VISmxjR0Z5WlZOMFlXTnJWSEpoWTJVcElIdGNiaUFnSUNCbWNtRnRaWE1nUFNCbWNtRnRaWE11Wm1sc2RHVnlLR1oxYm1OMGFXOXVJQ2g0S1NCN0lISmxkSFZ5YmlBaElYZzdJSDBwTzF4dUlDQWdJSEpsZEhWeWJpQnZiR1JRY21Wd1lYSmxVM1JoWTJ0VWNtRmpaUzVqWVd4c0tFVnljbTl5TENCMGFHbHpMQ0JtY21GdFpYTXBPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJSFJvYVhNdWNISmxjR0Z5WlZOMFlXTnJWSEpoWTJVb1puSmhiV1Z6S1R0Y2JuMDdYRzVjYm5CeWIzUnZMbkJ5WlhCaGNtVlRkR0ZqYTFSeVlXTmxJRDBnWm5WdVkzUnBiMjRnS0daeVlXMWxjeWtnZTF4dUlDQjJZWElnYkdsdVpYTWdQU0JiZEdocGMxMDdYRzRnSUdadmNpQW9kbUZ5SUdrOU1Ec2dhU0E4SUdaeVlXMWxjeTVzWlc1bmRHZzdJR2tyS3lrZ2UxeHVJQ0FnSUd4cGJtVnpMbkIxYzJnb1hHNGdJQ0FnSUNCbWNtRnRaWE5iYVYwZ1B5QkdZV2xzZFhKbExrWlNRVTFGWDFCU1JVWkpXQ0FySUdaeVlXMWxjMXRwWFNBNklFWmhhV3gxY21VdVJsSkJUVVZmUlUxUVZGbGNiaUFnSUNBcE8xeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCc2FXNWxjeTVxYjJsdUtDZGNYRzRuS1R0Y2JuMDdYRzVjYmx4dWJXOWtkV3hsTG1WNGNHOXlkSE1nUFNCR1lXbHNkWEpsTzF4dUlsMTkiLCJ2YXIgRmFpbHVyZSA9IHJlcXVpcmUoJy4vbGliL2ZhaWx1cmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGYWlsdXJlO1xuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcywgUmhpbm8sIGFuZCBicm93c2Vycy5cblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicsIFsnc3RhY2tmcmFtZSddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnc3RhY2tmcmFtZScpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LkVycm9yU3RhY2tQYXJzZXIgPSBmYWN0b3J5KHJvb3QuU3RhY2tGcmFtZSk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyKFN0YWNrRnJhbWUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQID0gLyhefEApXFxTK1xcOlxcZCsvO1xuICAgIHZhciBDSFJPTUVfSUVfU1RBQ0tfUkVHRVhQID0gL1xccythdCAuKihcXFMrXFw6XFxkK3xcXChuYXRpdmVcXCkpLztcblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHaXZlbiBhbiBFcnJvciBvYmplY3QsIGV4dHJhY3QgdGhlIG1vc3QgaW5mb3JtYXRpb24gZnJvbSBpdC5cbiAgICAgICAgICogQHBhcmFtIGVycm9yIHtFcnJvcn1cbiAgICAgICAgICogQHJldHVybiBBcnJheVtTdGFja0ZyYW1lXVxuICAgICAgICAgKi9cbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVycm9yLnN0YWNrdHJhY2UgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBlcnJvclsnb3BlcmEjc291cmNlbG9jJ10gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYShlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yLnN0YWNrICYmIGVycm9yLnN0YWNrLm1hdGNoKENIUk9NRV9JRV9TVEFDS19SRUdFWFApKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VWOE9ySUUoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5zdGFjayAmJiBlcnJvci5zdGFjay5tYXRjaChGSVJFRk9YX1NBRkFSSV9TVEFDS19SRUdFWFApKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VGRk9yU2FmYXJpKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcGFyc2UgZ2l2ZW4gRXJyb3Igb2JqZWN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlcGFyYXRlIGxpbmUgYW5kIGNvbHVtbiBudW1iZXJzIGZyb20gYSBVUkwtbGlrZSBzdHJpbmcuXG4gICAgICAgICAqIEBwYXJhbSB1cmxMaWtlIFN0cmluZ1xuICAgICAgICAgKiBAcmV0dXJuIEFycmF5W1N0cmluZ11cbiAgICAgICAgICovXG4gICAgICAgIGV4dHJhY3RMb2NhdGlvbjogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkZXh0cmFjdExvY2F0aW9uKHVybExpa2UpIHtcbiAgICAgICAgICAgIC8vIEZhaWwtZmFzdCBidXQgcmV0dXJuIGxvY2F0aW9ucyBsaWtlIFwiKG5hdGl2ZSlcIlxuICAgICAgICAgICAgaWYgKHVybExpa2UuaW5kZXhPZignOicpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbdXJsTGlrZV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdXJsTGlrZS5yZXBsYWNlKC9bXFwoXFwpXFxzXS9nLCAnJykuc3BsaXQoJzonKTtcbiAgICAgICAgICAgIHZhciBsYXN0TnVtYmVyID0gbG9jYXRpb25QYXJ0cy5wb3AoKTtcbiAgICAgICAgICAgIHZhciBwb3NzaWJsZU51bWJlciA9IGxvY2F0aW9uUGFydHNbbG9jYXRpb25QYXJ0cy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICghaXNOYU4ocGFyc2VGbG9hdChwb3NzaWJsZU51bWJlcikpICYmIGlzRmluaXRlKHBvc3NpYmxlTnVtYmVyKSkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lTnVtYmVyID0gbG9jYXRpb25QYXJ0cy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2xvY2F0aW9uUGFydHMuam9pbignOicpLCBsaW5lTnVtYmVyLCBsYXN0TnVtYmVyXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsb2NhdGlvblBhcnRzLmpvaW4oJzonKSwgbGFzdE51bWJlciwgdW5kZWZpbmVkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZVY4T3JJRTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VWOE9ySUUoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci5zdGFjay5zcGxpdCgnXFxuJykuZmlsdGVyKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhbGluZS5tYXRjaChDSFJPTUVfSUVfU1RBQ0tfUkVHRVhQKTtcbiAgICAgICAgICAgIH0sIHRoaXMpLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBsaW5lLnJlcGxhY2UoL15cXHMrLywgJycpLnNwbGl0KC9cXHMrLykuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSAoIXRva2Vuc1swXSB8fCB0b2tlbnNbMF0gPT09ICdBbm9ueW1vdXMnKSA/IHVuZGVmaW5lZCA6IHRva2Vuc1swXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN0YWNrRnJhbWUoZnVuY3Rpb25OYW1lLCB1bmRlZmluZWQsIGxvY2F0aW9uUGFydHNbMF0sIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0sIGxpbmUpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VGRk9yU2FmYXJpOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZUZGT3JTYWZhcmkoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci5zdGFjay5zcGxpdCgnXFxuJykuZmlsdGVyKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhbGluZS5tYXRjaChGSVJFRk9YX1NBRkFSSV9TVEFDS19SRUdFWFApO1xuICAgICAgICAgICAgfSwgdGhpcykubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VucyA9IGxpbmUuc3BsaXQoJ0AnKTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHRoaXMuZXh0cmFjdExvY2F0aW9uKHRva2Vucy5wb3AoKSk7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IHRva2Vucy5zaGlmdCgpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN0YWNrRnJhbWUoZnVuY3Rpb25OYW1lLCB1bmRlZmluZWQsIGxvY2F0aW9uUGFydHNbMF0sIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0sIGxpbmUpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VPcGVyYTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYShlKSB7XG4gICAgICAgICAgICBpZiAoIWUuc3RhY2t0cmFjZSB8fCAoZS5tZXNzYWdlLmluZGV4T2YoJ1xcbicpID4gLTEgJiZcbiAgICAgICAgICAgICAgICBlLm1lc3NhZ2Uuc3BsaXQoJ1xcbicpLmxlbmd0aCA+IGUuc3RhY2t0cmFjZS5zcGxpdCgnXFxuJykubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmE5KGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghZS5zdGFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmExMChlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYTExKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlT3BlcmE5OiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhOShlKSB7XG4gICAgICAgICAgICB2YXIgbGluZVJFID0gL0xpbmUgKFxcZCspLipzY3JpcHQgKD86aW4gKT8oXFxTKykvaTtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IGUubWVzc2FnZS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAyLCBsZW4gPSBsaW5lcy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMikge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IGxpbmVSRS5leGVjKGxpbmVzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFN0YWNrRnJhbWUodW5kZWZpbmVkLCB1bmRlZmluZWQsIG1hdGNoWzJdLCBtYXRjaFsxXSwgdW5kZWZpbmVkLCBsaW5lc1tpXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZU9wZXJhMTA6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmExMChlKSB7XG4gICAgICAgICAgICB2YXIgbGluZVJFID0gL0xpbmUgKFxcZCspLipzY3JpcHQgKD86aW4gKT8oXFxTKykoPzo6IEluIGZ1bmN0aW9uIChcXFMrKSk/JC9pO1xuICAgICAgICAgICAgdmFyIGxpbmVzID0gZS5zdGFja3RyYWNlLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxpbmVzLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbGluZVJFLmV4ZWMobGluZXNbaV0pO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgU3RhY2tGcmFtZShtYXRjaFszXSB8fCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgbWF0Y2hbMl0sIG1hdGNoWzFdLCB1bmRlZmluZWQsIGxpbmVzW2ldKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIE9wZXJhIDEwLjY1KyBFcnJvci5zdGFjayB2ZXJ5IHNpbWlsYXIgdG8gRkYvU2FmYXJpXG4gICAgICAgIHBhcnNlT3BlcmExMTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYTExKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLmZpbHRlcihmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIWxpbmUubWF0Y2goRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQKSAmJlxuICAgICAgICAgICAgICAgICAgICAhbGluZS5tYXRjaCgvXkVycm9yIGNyZWF0ZWQgYXQvKTtcbiAgICAgICAgICAgIH0sIHRoaXMpLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBsaW5lLnNwbGl0KCdAJyk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbkNhbGwgPSAodG9rZW5zLnNoaWZ0KCkgfHwgJycpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSBmdW5jdGlvbkNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC88YW5vbnltb3VzIGZ1bmN0aW9uKDogKFxcdyspKT8+LywgJyQyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXChbXlxcKV0qXFwpL2csICcnKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3NSYXc7XG4gICAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uQ2FsbC5tYXRjaCgvXFwoKFteXFwpXSopXFwpLykpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1JhdyA9IGZ1bmN0aW9uQ2FsbC5yZXBsYWNlKC9eW15cXChdK1xcKChbXlxcKV0qKVxcKSQvLCAnJDEnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSAoYXJnc1JhdyA9PT0gdW5kZWZpbmVkIHx8IGFyZ3NSYXcgPT09ICdbYXJndW1lbnRzIG5vdCBhdmFpbGFibGVdJykgPyB1bmRlZmluZWQgOiBhcmdzUmF3LnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgYXJncywgbG9jYXRpb25QYXJ0c1swXSwgbG9jYXRpb25QYXJ0c1sxXSwgbG9jYXRpb25QYXJ0c1syXSwgbGluZSk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH07XG59KSk7XG5cbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvLyBVbml2ZXJzYWwgTW9kdWxlIERlZmluaXRpb24gKFVNRCkgdG8gc3VwcG9ydCBBTUQsIENvbW1vbkpTL05vZGUuanMsIFJoaW5vLCBhbmQgYnJvd3NlcnMuXG5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKCdzdGFja2ZyYW1lJywgW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QuU3RhY2tGcmFtZSA9IGZhY3RvcnkoKTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgZnVuY3Rpb24gX2lzTnVtYmVyKG4pIHtcbiAgICAgICAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgYXJncywgZmlsZU5hbWUsIGxpbmVOdW1iZXIsIGNvbHVtbk51bWJlciwgc291cmNlKSB7XG4gICAgICAgIGlmIChmdW5jdGlvbk5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRGdW5jdGlvbk5hbWUoZnVuY3Rpb25OYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEFyZ3MoYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbGVOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RmlsZU5hbWUoZmlsZU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaW5lTnVtYmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TGluZU51bWJlcihsaW5lTnVtYmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sdW1uTnVtYmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0Q29sdW1uTnVtYmVyKGNvbHVtbk51bWJlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNvdXJjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldFNvdXJjZShzb3VyY2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgU3RhY2tGcmFtZS5wcm90b3R5cGUgPSB7XG4gICAgICAgIGdldEZ1bmN0aW9uTmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnVuY3Rpb25OYW1lO1xuICAgICAgICB9LFxuICAgICAgICBzZXRGdW5jdGlvbk5hbWU6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB0aGlzLmZ1bmN0aW9uTmFtZSA9IFN0cmluZyh2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRBcmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcmdzO1xuICAgICAgICB9LFxuICAgICAgICBzZXRBcmdzOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2KSAhPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3MgbXVzdCBiZSBhbiBBcnJheScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hcmdzID0gdjtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBOT1RFOiBQcm9wZXJ0eSBuYW1lIG1heSBiZSBtaXNsZWFkaW5nIGFzIGl0IGluY2x1ZGVzIHRoZSBwYXRoLFxuICAgICAgICAvLyBidXQgaXQgc29tZXdoYXQgbWlycm9ycyBWOCdzIEphdmFTY3JpcHRTdGFja1RyYWNlQXBpXG4gICAgICAgIC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3Avdjgvd2lraS9KYXZhU2NyaXB0U3RhY2tUcmFjZUFwaSBhbmQgR2Vja28nc1xuICAgICAgICAvLyBodHRwOi8vbXhyLm1vemlsbGEub3JnL21vemlsbGEtY2VudHJhbC9zb3VyY2UveHBjb20vYmFzZS9uc0lFeGNlcHRpb24uaWRsIzE0XG4gICAgICAgIGdldEZpbGVOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWxlTmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0RmlsZU5hbWU6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVOYW1lID0gU3RyaW5nKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldExpbmVOdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpbmVOdW1iZXI7XG4gICAgICAgIH0sXG4gICAgICAgIHNldExpbmVOdW1iZXI6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAoIV9pc051bWJlcih2KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0xpbmUgTnVtYmVyIG11c3QgYmUgYSBOdW1iZXInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubGluZU51bWJlciA9IE51bWJlcih2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDb2x1bW5OdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbHVtbk51bWJlcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKCFfaXNOdW1iZXIodikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb2x1bW4gTnVtYmVyIG11c3QgYmUgYSBOdW1iZXInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY29sdW1uTnVtYmVyID0gTnVtYmVyKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFNvdXJjZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc291cmNlO1xuICAgICAgICB9LFxuICAgICAgICBzZXRTb3VyY2U6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZSA9IFN0cmluZyh2KTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gdGhpcy5nZXRGdW5jdGlvbk5hbWUoKSB8fCAne2Fub255bW91c30nO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSAnKCcgKyAodGhpcy5nZXRBcmdzKCkgfHwgW10pLmpvaW4oJywnKSArICcpJztcbiAgICAgICAgICAgIHZhciBmaWxlTmFtZSA9IHRoaXMuZ2V0RmlsZU5hbWUoKSA/ICgnQCcgKyB0aGlzLmdldEZpbGVOYW1lKCkpIDogJyc7XG4gICAgICAgICAgICB2YXIgbGluZU51bWJlciA9IF9pc051bWJlcih0aGlzLmdldExpbmVOdW1iZXIoKSkgPyAoJzonICsgdGhpcy5nZXRMaW5lTnVtYmVyKCkpIDogJyc7XG4gICAgICAgICAgICB2YXIgY29sdW1uTnVtYmVyID0gX2lzTnVtYmVyKHRoaXMuZ2V0Q29sdW1uTnVtYmVyKCkpID8gKCc6JyArIHRoaXMuZ2V0Q29sdW1uTnVtYmVyKCkpIDogJyc7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb25OYW1lICsgYXJncyArIGZpbGVOYW1lICsgbGluZU51bWJlciArIGNvbHVtbk51bWJlcjtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gU3RhY2tGcmFtZTtcbn0pKTtcbiJdfQ==
