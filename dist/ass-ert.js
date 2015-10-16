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
} else if (require.resolve) {
    try {
      patches.sinon((typeof window !== "undefined" ? window.sinon : typeof global !== "undefined" ? global.sinon : null));
    } catch (e) {
        // sinon is not installed
    }
}


module.exports = ass;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGFzcyA9IHJlcXVpcmUoJy4vbGliL2FzcycpO1xudmFyIENoYWluID0gcmVxdWlyZSgnLi9saWIvY2hhaW4nKTtcbnZhciBBc3NFcnJvciA9IHJlcXVpcmUoJy4vbGliL2Vycm9yJyk7XG52YXIgc2hvdWxkID0gcmVxdWlyZSgnLi9saWIvc2hvdWxkJyk7XG52YXIgcGF0Y2hlcyA9IHJlcXVpcmUoJy4vbGliL3BhdGNoZXMnKTtcblxuLy8gUmVnaXN0ZXIgdGhlIGRlZmF1bHQgbWF0Y2hlcnNcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL2NvcmUnKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL2Nvb3JkaW5hdGlvbicpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvcXVhbnRpZmllcnMnKTtcbnJlcXVpcmUoJy4vbGliL21hdGNoZXJzL3Byb21pc2UnKTtcblxuXG4vLyBCdW5kbGUgc29tZSBvZiB0aGUgaW50ZXJuYWwgc3R1ZmYgd2l0aCB0aGUgYXNzIGZ1bmN0aW9uXG5hc3MuQ2hhaW4gPSBDaGFpbjtcbmFzcy5FcnJvciA9IEFzc0Vycm9yO1xuYXNzLnBhdGNoZXMgPSBwYXRjaGVzO1xuXG4vLyBGb3J3YXJkIHRoZSBzaG91bGQgaW5zdGFsbGVyXG4vLyBOb3RlOiBtYWtlIHRoZW0gYXJpdHktMCB0byBhbGxvdyBiZWZvcmVFYWNoKGFzcy5zaG91bGQpIGluIE1vY2hhXG5hc3Muc2hvdWxkID0gZnVuY3Rpb24gKC8qIG5hbWUgKi8pIHtcbiAgc2hvdWxkKGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogdW5kZWZpbmVkKTtcbiAgcmV0dXJuIGFzcztcbn07XG5hc3Muc2hvdWxkLnJlc3RvcmUgPSBmdW5jdGlvbiAoLyogbmFtZSAqLykge1xuICBzaG91bGQucmVzdG9yZShhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IHVuZGVmaW5lZCk7XG4gIHJldHVybiBhc3M7XG59O1xuXG5cbi8vIFBhdGNoIHRoaXJkIHBhcnR5IGxpYnJhcmllcyB0byB1bmRlcnN0YW5kIGFib3V0IGFzcy1lcnQgZXhwcmVzc2lvbnMuIFdlXG4vLyBkZXBlbmQgb24gcGF0Y2hpbmcgbG9kYXNoIGZvciB0aGUgbGlicmFyeSB0byB3b3JrIGNvcnJlY3RseSwgaG93ZXZlciB0aGVcbi8vIHJlc3QgYXJlIG9wdGlvbmFsLlxucGF0Y2hlcy5sb2Rhc2goKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpKTtcblxuaWYgKGdsb2JhbC5zaW5vbiAmJiBnbG9iYWwuc2lub24ubWF0Y2gpIHtcbiAgcGF0Y2hlcy5zaW5vbihnbG9iYWwuc2lub24pO1xufSBlbHNlIGlmIChyZXF1aXJlLnJlc29sdmUpIHtcbiAgICB0cnkge1xuICAgICAgcGF0Y2hlcy5zaW5vbigodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5zaW5vbiA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuc2lub24gOiBudWxsKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBzaW5vbiBpcyBub3QgaW5zdGFsbGVkXG4gICAgfVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gYXNzO1xuIl19
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXNzLmpzIiwibGliL2NoYWluLmpzIiwibGliL2Vycm9yLmpzIiwibGliL2V4cGVjdGF0aW9uLmpzIiwibGliL21hdGNoZXIuanMiLCJsaWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uLmpzIiwibGliL21hdGNoZXJzL2NvcmUuanMiLCJsaWIvbWF0Y2hlcnMvcHJvbWlzZS5qcyIsImxpYi9tYXRjaGVycy9xdWFudGlmaWVycy5qcyIsImxpYi9wYXRjaGVzLmpzIiwibGliL3Jlc29sdmVycy5qcyIsImxpYi9zaG91bGQuanMiLCJsaWIvdXRpbC5qcyIsIm1haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL2xpYi9jYWxsLXNpdGUuanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9saWIvZmFpbHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL21haW4uanMiLCJub2RlX21vZHVsZXMvZmFpbHVyZS9ub2RlX21vZHVsZXMvZXJyb3Itc3RhY2stcGFyc2VyL2Vycm9yLXN0YWNrLXBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9mYWlsdXJlL25vZGVfbW9kdWxlcy9lcnJvci1zdGFjay1wYXJzZXIvbm9kZV9tb2R1bGVzL3N0YWNrZnJhbWUvc3RhY2tmcmFtZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMTVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pjQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2NoYWluJyk7XG52YXIgTWF0Y2hlciA9IHJlcXVpcmUoJy4vbWF0Y2hlcicpO1xudmFyIEV4cGVjdGF0aW9uID0gcmVxdWlyZSgnLi9leHBlY3RhdGlvbicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuXG52YXIgZGVmUHJvcCA9IHV0aWwuYmluZChPYmplY3QuZGVmaW5lUHJvcGVydHksIE9iamVjdCk7XG5cblxuLy8gUHVibGljIGludGVyZmFjZVxuZnVuY3Rpb24gYXNzICh2YWx1ZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQ2hhaW4oKTtcbiAgfVxuICByZXR1cm4gbmV3IENoYWluKHZhbHVlKTtcbn1cblxuLy8gRGVmZXJyZWQgZmFjdG9yeVxuYXNzLl8gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIG5ldyBDaGFpbih2YWx1ZSkuXztcbn07XG5cbi8vIEdsb2JhbCByZWdpc3RyeSBvZiBtYXRjaGVycyAodXNlZCBmb3IgYXNzLmhlbHApXG5hc3MubWF0Y2hlcnMgPSBbXTtcblxuLy8gYXNzLmhlbHAgZHVtcHMgdGhlIGhlbHAgb2YgZWFjaCBtYXRjaGVyIHJlZ2lzdGVyZWRcbmRlZlByb3AoYXNzLCAnaGVscCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHMgPSAnJztcbiAgICBfLmZvckVhY2goYXNzLm1hdGNoZXJzLCBmdW5jdGlvbiAobWF0Y2hlcikge1xuICAgICAgLy8gVE9ETzogVGhpcyBjYW4gYmUgbmljZXJcbiAgICAgIHZhciBmbiA9IG1hdGNoZXIudGVzdC50b1N0cmluZygpO1xuICAgICAgdmFyIGFyZ3MgPSBmbi5yZXBsYWNlKC9eZnVuY3Rpb25cXHMqXFwoKFteXFwpXSopXFwpW1xcU1xcc10qLywgJyQxJyk7XG4gICAgICBhcmdzID0gYXJncy5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAoeCkgeyByZXR1cm4geC50cmltKCk7IH0pO1xuICAgICAgYXJncy5zaGlmdCgpO1xuICAgICAgZm4gPSBhcmdzLmxlbmd0aCA/ICcgKCcgKyBhcmdzLmpvaW4oJywgJykgKyAnKScgOiAnJztcblxuICAgICAgcyArPSAnPiAuJyArIG1hdGNoZXIubmFtZSArIGZuICsgJ1xcblxcbic7XG4gICAgICBzICs9ICcgICcgKyBtYXRjaGVyLmhlbHAucmVwbGFjZSgvXFxuL2csICdcXG4gICcpO1xuICAgICAgcyArPSAnXFxuXFxuJztcbiAgICB9KTtcbiAgICByZXR1cm4gcztcbiAgfVxufSk7XG5cbmFzcy5vayA9IGZ1bmN0aW9uIChjb25kLCBtZXNzYWdlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgbWVzc2FnZSA9ICdleHBlY3RlZCBhIHRydWlzaCB2YWx1ZSc7XG4gIH1cbiAgYXNzLmRlc2MobWVzc2FnZSkudHJ1dGh5LmFzc2VydChjb25kLCBhc3Mub2spO1xuICByZXR1cm4gY29uZDtcbn07XG5cbmFzcy5rbyA9IGZ1bmN0aW9uIChjb25kLCBtZXNzYWdlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgbWVzc2FnZSA9ICdleHBlY3RlZCBhIGZhbHN5IHZhbHVlJztcbiAgfVxuICBhc3MuZGVzYyhtZXNzYWdlKS5mYWxzeS5hc3NlcnQoY29uZCwgYXNzLmtvKTtcbiAgcmV0dXJuIGNvbmQ7XG59O1xuXG4vLyBSZXNldHMgb3IgdmVyaWZpZXMgdGhlIG51bWJlciBvZiBtYXJrcyBzbyBmYXJcbi8vIEZvcmNlZCBhcml0eS0wIHRvIGJlIGNvbXBhdGlibGUgd2l0aDogYmVmb3JlRWFjaChhc3MubWFya3MpXG5hc3MubWFya3MgPSBmdW5jdGlvbiAoLyogZXhwZWN0ZWQsIGRlc2MgKi8pIHtcbiAgdmFyIGV4cGVjdGVkID0gYXJndW1lbnRzWzBdO1xuICB2YXIgZGVzYyA9IGFyZ3VtZW50c1sxXTtcbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBleHBlY3RlZCA9IGFzcy5tYXJrcy5jb3VudGVyO1xuICAgIGFzcy5tYXJrcy5jb3VudGVyID0gMDtcbiAgICByZXR1cm4gZXhwZWN0ZWQ7ICAvLyByZXR1cm4gYmFjayBob3cgbWFueSB0aGVyZSB3ZXJlXG4gIH1cblxuICBhc3MuZGVzYyhkZXNjIHx8ICdhc3MubWFya3MnKS5lcShleHBlY3RlZClcbiAgLmFzc2VydChhc3MubWFya3MuY291bnRlciwgYXNzLm1hcmtzKTtcbn07XG5hc3MubWFya3MuY291bnRlciA9IDA7XG5cblxuLy8gSGVscGVyIHRvIHJlZ2lzdGVyIG5ldyBtYXRjaGVycyBpbiB0aGUgcmVnaXN0cnlcbmFzcy5yZWdpc3RlciA9IGZ1bmN0aW9uIChuYW1lLCBtYXRjaGVyKSB7XG4gIGlmIChuYW1lIGluc3RhbmNlb2YgTWF0Y2hlcikge1xuICAgIG1hdGNoZXIgPSBuYW1lO1xuICAgIG5hbWUgPSBtYXRjaGVyLm5hbWU7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgT2JqZWN0LmtleXMobmFtZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBhc3MucmVnaXN0ZXIoa2V5LCBuYW1lW2tleV0pO1xuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIHsgIC8vIEFzc3VtZSBhIGRlc2NyaXB0b3Igd2FzIGdpdmVuXG4gICAgLy8gQ3JlYXRlIHRoZSBhbGlhc2VzIGZpcnN0XG4gICAgXy5mb3JFYWNoKG1hdGNoZXIuYWxpYXNlcywgZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICBhc3MucmVnaXN0ZXIobmV3IE1hdGNoZXIoYWxpYXMsIG1hdGNoZXIpKTtcbiAgICB9KTtcblxuICAgIG1hdGNoZXIgPSBuZXcgTWF0Y2hlcihuYW1lLCBtYXRjaGVyKTtcbiAgfVxuXG4gIC8vIEtlZXAgdGhlIG1hdGNoZXIgYXJvdW5kIGZvciBhc3MuaGVscFxuICBhc3MubWF0Y2hlcnMucHVzaChtYXRjaGVyKTtcblxuXG4gIC8vIFRPRE86IEFsbG93IG1hdGNoZXJzIHRvIGJlIG92ZXJyaWRkZW4gYW5kIGFsc28gb3ZlcmxvYWRlZFxuICAvLyAgICAgICBpZiB0aGV5IGhhdmUgYW4gXCJvdmVybG9hZFwiIG1ldGhvZCBpdCBjYW4gYmUgdXNlZFxuICAvLyAgICAgICB0byBjaGVjayB3aGljaCBvbmUgc2hvdWxkIGJlIHVzZWQuXG4gIC8vICAgICAgIEJldHRlciBJZGVhIChJIHRoaW5rKSwgaW5zdGVhZCBvZiBvdmVybG9hZGluZyBiYXNlZFxuICAvLyAgICAgICBvbiB0aGUgdmFsdWUgdW5kZXIgdGVzdCwgd2hpY2ggbWF5IHByb2R1Y2UgaXNzdWVzXG4gIC8vICAgICAgIHNpbmNlIHdlIGRvbid0IGtub3cgZm9yIHN1cmUgd2hhdCB0aGF0IHZhbHVlIGlzLFxuICAvLyAgICAgICBhbGxvdyBtYXRjaGVycyB0byBpbnRyb2R1Y2UgYSBuZXcgXCJwcm90b3R5cGVcIiBmb3JcbiAgLy8gICAgICAgdGhlIGNoYWluLCB0aGF0IGlzLCBhIC5kb20gbWF0Y2hlciB3aWxsIGluY2x1ZGVcbiAgLy8gICAgICAgYWxsIHRoZSBjb3JlIGV4cGVjdGF0aW9ucyBidXQgdGhlbiBhbHNvIG92ZXJyaWRlc1xuICAvLyAgICAgICBhbmQgbmV3IG9uZXMgdW50aWwgdGhlIGVuZCBvZiB0aGUgY2hhaW4uXG5cblxuICAvLyBNYXRjaGVyIGZ1bmN0aW9ucyB3aXRoIGEgc2luZ2xlIGFyZ3VtZW50IGFyZSBnZXR0ZXJzXG4gIHZhciBmbktleSA9IG1hdGNoZXIuYXJpdHkgPT09IDEgPyAnZ2V0JyA6ICd2YWx1ZSc7XG4gIHZhciBwcm9wID0ge1xuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9O1xuICBpZiAoZm5LZXkgPT09ICd2YWx1ZScpIHtcbiAgICBwcm9wLndyaXRhYmxlID0gZmFsc2U7XG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSBDaGFpbiBwcm90b3R5cGVcbiAgcHJvcFtmbktleV0gPSBmdW5jdGlvbiBmbiAoKSB7XG4gICAgdmFyIGV4cCA9IG5ldyBFeHBlY3RhdGlvbihtYXRjaGVyLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfXy5wdXNoKGV4cCk7XG4gICAgaWYgKCF0aGlzLl9fZGVmZXJyZWRfXykge1xuICAgICAgdGhpcy5hc3NlcnQodGhpcy52YWx1ZSwgZm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBkZWZQcm9wKENoYWluLnByb3RvdHlwZSwgbmFtZSwgcHJvcCk7XG5cbiAgLy8gQXVnbWVudCB0aGUgc3RhdGljIGludGVyZmFjZVxuICBwcm9wW2ZuS2V5XSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hhaW4gPSBuZXcgQ2hhaW4oKTtcblxuICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgIHJldHVybiBjaGFpbltuYW1lXTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hhaW5bbmFtZV0uYXBwbHkoY2hhaW4sIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgZGVmUHJvcChhc3MsIG5hbWUsIHByb3ApO1xuXG4gIC8vIFBhc3MgdGhyb3VnaCBmb3IgY2hhaW5zXG4gIHByb3BbZm5LZXldID0gZnVuY3Rpb24gcGFzc3Rocm91Z2goKSB7XG4gICAgcmV0dXJuIHRoaXNbbmFtZV0uYXNzZXJ0KHRoaXMudmFsdWUsIHBhc3N0aHJvdWdoKS52YWx1ZU9mKCk7XG4gIH07XG4gIHByb3AuZW51bWVyYWJsZSA9IGZhbHNlO1xuICBkZWZQcm9wKENoYWluLnByb3RvdHlwZSwgJyQnICsgbmFtZSwgcHJvcCk7XG5cbiAgLy8gUGFzcyB0aHJvdWdoIHN0YXRpYyBjb25zdHJ1Y3RvclxuICBkZWZQcm9wKGFzcywgJyQnICsgbmFtZSwge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmIChmbktleSA9PT0gJ2dldCcpIHtcbiAgICAgICAgcmV0dXJuIGFzcyh2YWx1ZSlbJyQnICsgbmFtZV07XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSBhIG5ldyBleHByZXNzaW9uIGZvciB0aGUgZXhwZWN0YXRpb25cbiAgICAgIHZhciBjaGFpbiA9IG5ldyBDaGFpbigpO1xuICAgICAgY2hhaW5bbmFtZV0uYXBwbHkoY2hhaW4sIGFyZ3VtZW50cyk7XG4gICAgICAvLyBSZXR1cm4gYSBjYWxsYWJsZSB0aGF0IGFzc2VydHMgdXBvbiByZWNlaXZpbmcgYSB2YWx1ZVxuICAgICAgcmV0dXJuIGNoYWluLnRocm91Z2g7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcblxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzcztcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbXhwWWk5aGMzTXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdYeUE5SUNoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnZDJsdVpHOTNMbDhnT2lCMGVYQmxiMllnWjJ4dlltRnNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnWjJ4dlltRnNMbDhnT2lCdWRXeHNLVHRjYmx4dWRtRnlJRU5vWVdsdUlEMGdjbVZ4ZFdseVpTZ25MaTlqYUdGcGJpY3BPMXh1ZG1GeUlFMWhkR05vWlhJZ1BTQnlaWEYxYVhKbEtDY3VMMjFoZEdOb1pYSW5LVHRjYm5aaGNpQkZlSEJsWTNSaGRHbHZiaUE5SUhKbGNYVnBjbVVvSnk0dlpYaHdaV04wWVhScGIyNG5LVHRjYm5aaGNpQjFkR2xzSUQwZ2NtVnhkV2x5WlNnbkxpOTFkR2xzSnlrN1hHNWNibHh1ZG1GeUlHUmxabEJ5YjNBZ1BTQjFkR2xzTG1KcGJtUW9UMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1TENCUFltcGxZM1FwTzF4dVhHNWNiaTh2SUZCMVlteHBZeUJwYm5SbGNtWmhZMlZjYm1aMWJtTjBhVzl1SUdGemN5QW9kbUZzZFdVcElIdGNiaUFnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BUMDlJREFwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdibVYzSUVOb1lXbHVLQ2s3WEc0Z0lIMWNiaUFnY21WMGRYSnVJRzVsZHlCRGFHRnBiaWgyWVd4MVpTazdYRzU5WEc1Y2JpOHZJRVJsWm1WeWNtVmtJR1poWTNSdmNubGNibUZ6Y3k1ZklEMGdablZ1WTNScGIyNGdLSFpoYkhWbEtTQjdYRzRnSUhKbGRIVnliaUJ1WlhjZ1EyaGhhVzRvZG1Gc2RXVXBMbDg3WEc1OU8xeHVYRzR2THlCSGJHOWlZV3dnY21WbmFYTjBjbmtnYjJZZ2JXRjBZMmhsY25NZ0tIVnpaV1FnWm05eUlHRnpjeTVvWld4d0tWeHVZWE56TG0xaGRHTm9aWEp6SUQwZ1cxMDdYRzVjYmk4dklHRnpjeTVvWld4d0lHUjFiWEJ6SUhSb1pTQm9aV3h3SUc5bUlHVmhZMmdnYldGMFkyaGxjaUJ5WldkcGMzUmxjbVZrWEc1a1pXWlFjbTl3S0dGemN5d2dKMmhsYkhBbkxDQjdYRzRnSUdkbGREb2dablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJSFpoY2lCeklEMGdKeWM3WEc0Z0lDQWdYeTVtYjNKRllXTm9LR0Z6Y3k1dFlYUmphR1Z5Y3l3Z1puVnVZM1JwYjI0Z0tHMWhkR05vWlhJcElIdGNiaUFnSUNBZ0lDOHZJRlJQUkU4NklGUm9hWE1nWTJGdUlHSmxJRzVwWTJWeVhHNGdJQ0FnSUNCMllYSWdabTRnUFNCdFlYUmphR1Z5TG5SbGMzUXVkRzlUZEhKcGJtY29LVHRjYmlBZ0lDQWdJSFpoY2lCaGNtZHpJRDBnWm00dWNtVndiR0ZqWlNndlhtWjFibU4wYVc5dVhGeHpLbHhjS0NoYlhseGNLVjBxS1Z4Y0tWdGNYRk5jWEhOZEtpOHNJQ2NrTVNjcE8xeHVJQ0FnSUNBZ1lYSm5jeUE5SUdGeVozTXVjM0JzYVhRb0p5d25LUzV0WVhBb1puVnVZM1JwYjI0Z0tIZ3BJSHNnY21WMGRYSnVJSGd1ZEhKcGJTZ3BPeUI5S1R0Y2JpQWdJQ0FnSUdGeVozTXVjMmhwWm5Rb0tUdGNiaUFnSUNBZ0lHWnVJRDBnWVhKbmN5NXNaVzVuZEdnZ1B5QW5JQ2duSUNzZ1lYSm5jeTVxYjJsdUtDY3NJQ2NwSUNzZ0p5a25JRG9nSnljN1hHNWNiaUFnSUNBZ0lITWdLejBnSno0Z0xpY2dLeUJ0WVhSamFHVnlMbTVoYldVZ0t5Qm1iaUFySUNkY1hHNWNYRzRuTzF4dUlDQWdJQ0FnY3lBclBTQW5JQ0FuSUNzZ2JXRjBZMmhsY2k1b1pXeHdMbkpsY0d4aFkyVW9MMXhjYmk5bkxDQW5YRnh1SUNBbktUdGNiaUFnSUNBZ0lITWdLejBnSjF4Y2JseGNiaWM3WEc0Z0lDQWdmU2s3WEc0Z0lDQWdjbVYwZFhKdUlITTdYRzRnSUgxY2JuMHBPMXh1WEc1aGMzTXViMnNnUFNCbWRXNWpkR2x2YmlBb1kyOXVaQ3dnYldWemMyRm5aU2tnZTF4dUlDQnBaaUFvWVhKbmRXMWxiblJ6TG14bGJtZDBhQ0E5UFQwZ01Ta2dlMXh1SUNBZ0lHMWxjM05oWjJVZ1BTQW5aWGh3WldOMFpXUWdZU0IwY25WcGMyZ2dkbUZzZFdVbk8xeHVJQ0I5WEc0Z0lHRnpjeTVrWlhOaktHMWxjM05oWjJVcExuUnlkWFJvZVM1aGMzTmxjblFvWTI5dVpDd2dZWE56TG05cktUdGNiaUFnY21WMGRYSnVJR052Ym1RN1hHNTlPMXh1WEc1aGMzTXVhMjhnUFNCbWRXNWpkR2x2YmlBb1kyOXVaQ3dnYldWemMyRm5aU2tnZTF4dUlDQnBaaUFvWVhKbmRXMWxiblJ6TG14bGJtZDBhQ0E5UFQwZ01Ta2dlMXh1SUNBZ0lHMWxjM05oWjJVZ1BTQW5aWGh3WldOMFpXUWdZU0JtWVd4emVTQjJZV3gxWlNjN1hHNGdJSDFjYmlBZ1lYTnpMbVJsYzJNb2JXVnpjMkZuWlNrdVptRnNjM2t1WVhOelpYSjBLR052Ym1Rc0lHRnpjeTVyYnlrN1hHNGdJSEpsZEhWeWJpQmpiMjVrTzF4dWZUdGNibHh1THk4Z1VtVnpaWFJ6SUc5eUlIWmxjbWxtYVdWeklIUm9aU0J1ZFcxaVpYSWdiMllnYldGeWEzTWdjMjhnWm1GeVhHNHZMeUJHYjNKalpXUWdZWEpwZEhrdE1DQjBieUJpWlNCamIyMXdZWFJwWW14bElIZHBkR2c2SUdKbFptOXlaVVZoWTJnb1lYTnpMbTFoY210ektWeHVZWE56TG0xaGNtdHpJRDBnWm5WdVkzUnBiMjRnS0M4cUlHVjRjR1ZqZEdWa0xDQmtaWE5qSUNvdktTQjdYRzRnSUhaaGNpQmxlSEJsWTNSbFpDQTlJR0Z5WjNWdFpXNTBjMXN3WFR0Y2JpQWdkbUZ5SUdSbGMyTWdQU0JoY21kMWJXVnVkSE5iTVYwN1hHNGdJR2xtSUNoMGVYQmxiMllnWlhod1pXTjBaV1FnUFQwOUlDZDFibVJsWm1sdVpXUW5LU0I3WEc0Z0lDQWdaWGh3WldOMFpXUWdQU0JoYzNNdWJXRnlhM011WTI5MWJuUmxjanRjYmlBZ0lDQmhjM011YldGeWEzTXVZMjkxYm5SbGNpQTlJREE3WEc0Z0lDQWdjbVYwZFhKdUlHVjRjR1ZqZEdWa095QWdMeThnY21WMGRYSnVJR0poWTJzZ2FHOTNJRzFoYm5rZ2RHaGxjbVVnZDJWeVpWeHVJQ0I5WEc1Y2JpQWdZWE56TG1SbGMyTW9aR1Z6WXlCOGZDQW5ZWE56TG0xaGNtdHpKeWt1WlhFb1pYaHdaV04wWldRcFhHNGdJQzVoYzNObGNuUW9ZWE56TG0xaGNtdHpMbU52ZFc1MFpYSXNJR0Z6Y3k1dFlYSnJjeWs3WEc1OU8xeHVZWE56TG0xaGNtdHpMbU52ZFc1MFpYSWdQU0F3TzF4dVhHNWNiaTh2SUVobGJIQmxjaUIwYnlCeVpXZHBjM1JsY2lCdVpYY2diV0YwWTJobGNuTWdhVzRnZEdobElISmxaMmx6ZEhKNVhHNWhjM011Y21WbmFYTjBaWElnUFNCbWRXNWpkR2x2YmlBb2JtRnRaU3dnYldGMFkyaGxjaWtnZTF4dUlDQnBaaUFvYm1GdFpTQnBibk4wWVc1alpXOW1JRTFoZEdOb1pYSXBJSHRjYmlBZ0lDQnRZWFJqYUdWeUlEMGdibUZ0WlR0Y2JpQWdJQ0J1WVcxbElEMGdiV0YwWTJobGNpNXVZVzFsTzF4dUlDQjlJR1ZzYzJVZ2FXWWdLSFI1Y0dWdlppQnVZVzFsSUQwOVBTQW5iMkpxWldOMEp5a2dlMXh1SUNBZ0lFOWlhbVZqZEM1clpYbHpLRzVoYldVcExtWnZja1ZoWTJnb1puVnVZM1JwYjI0Z0tHdGxlU2tnZTF4dUlDQWdJQ0FnWVhOekxuSmxaMmx6ZEdWeUtHdGxlU3dnYm1GdFpWdHJaWGxkS1R0Y2JpQWdJQ0I5S1R0Y2JpQWdJQ0J5WlhSMWNtNDdYRzRnSUgwZ1pXeHpaU0I3SUNBdkx5QkJjM04xYldVZ1lTQmtaWE5qY21sd2RHOXlJSGRoY3lCbmFYWmxibHh1SUNBZ0lDOHZJRU55WldGMFpTQjBhR1VnWVd4cFlYTmxjeUJtYVhKemRGeHVJQ0FnSUY4dVptOXlSV0ZqYUNodFlYUmphR1Z5TG1Gc2FXRnpaWE1zSUdaMWJtTjBhVzl1SUNoaGJHbGhjeWtnZTF4dUlDQWdJQ0FnWVhOekxuSmxaMmx6ZEdWeUtHNWxkeUJOWVhSamFHVnlLR0ZzYVdGekxDQnRZWFJqYUdWeUtTazdYRzRnSUNBZ2ZTazdYRzVjYmlBZ0lDQnRZWFJqYUdWeUlEMGdibVYzSUUxaGRHTm9aWElvYm1GdFpTd2diV0YwWTJobGNpazdYRzRnSUgxY2JseHVJQ0F2THlCTFpXVndJSFJvWlNCdFlYUmphR1Z5SUdGeWIzVnVaQ0JtYjNJZ1lYTnpMbWhsYkhCY2JpQWdZWE56TG0xaGRHTm9aWEp6TG5CMWMyZ29iV0YwWTJobGNpazdYRzVjYmx4dUlDQXZMeUJVVDBSUE9pQkJiR3h2ZHlCdFlYUmphR1Z5Y3lCMGJ5QmlaU0J2ZG1WeWNtbGtaR1Z1SUdGdVpDQmhiSE52SUc5MlpYSnNiMkZrWldSY2JpQWdMeThnSUNBZ0lDQWdhV1lnZEdobGVTQm9ZWFpsSUdGdUlGd2liM1psY214dllXUmNJaUJ0WlhSb2IyUWdhWFFnWTJGdUlHSmxJSFZ6WldSY2JpQWdMeThnSUNBZ0lDQWdkRzhnWTJobFkyc2dkMmhwWTJnZ2IyNWxJSE5vYjNWc1pDQmlaU0IxYzJWa0xseHVJQ0F2THlBZ0lDQWdJQ0JDWlhSMFpYSWdTV1JsWVNBb1NTQjBhR2x1YXlrc0lHbHVjM1JsWVdRZ2IyWWdiM1psY214dllXUnBibWNnWW1GelpXUmNiaUFnTHk4Z0lDQWdJQ0FnYjI0Z2RHaGxJSFpoYkhWbElIVnVaR1Z5SUhSbGMzUXNJSGRvYVdOb0lHMWhlU0J3Y205a2RXTmxJR2x6YzNWbGMxeHVJQ0F2THlBZ0lDQWdJQ0J6YVc1alpTQjNaU0JrYjI0bmRDQnJibTkzSUdadmNpQnpkWEpsSUhkb1lYUWdkR2hoZENCMllXeDFaU0JwY3l4Y2JpQWdMeThnSUNBZ0lDQWdZV3hzYjNjZ2JXRjBZMmhsY25NZ2RHOGdhVzUwY205a2RXTmxJR0VnYm1WM0lGd2ljSEp2ZEc5MGVYQmxYQ0lnWm05eVhHNGdJQzh2SUNBZ0lDQWdJSFJvWlNCamFHRnBiaXdnZEdoaGRDQnBjeXdnWVNBdVpHOXRJRzFoZEdOb1pYSWdkMmxzYkNCcGJtTnNkV1JsWEc0Z0lDOHZJQ0FnSUNBZ0lHRnNiQ0IwYUdVZ1kyOXlaU0JsZUhCbFkzUmhkR2x2Ym5NZ1luVjBJSFJvWlc0Z1lXeHpieUJ2ZG1WeWNtbGtaWE5jYmlBZ0x5OGdJQ0FnSUNBZ1lXNWtJRzVsZHlCdmJtVnpJSFZ1ZEdsc0lIUm9aU0JsYm1RZ2IyWWdkR2hsSUdOb1lXbHVMbHh1WEc1Y2JpQWdMeThnVFdGMFkyaGxjaUJtZFc1amRHbHZibk1nZDJsMGFDQmhJSE5wYm1kc1pTQmhjbWQxYldWdWRDQmhjbVVnWjJWMGRHVnljMXh1SUNCMllYSWdabTVMWlhrZ1BTQnRZWFJqYUdWeUxtRnlhWFI1SUQwOVBTQXhJRDhnSjJkbGRDY2dPaUFuZG1Gc2RXVW5PMXh1SUNCMllYSWdjSEp2Y0NBOUlIdGNiaUFnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUdWdWRXMWxjbUZpYkdVNklIUnlkV1ZjYmlBZ2ZUdGNiaUFnYVdZZ0tHWnVTMlY1SUQwOVBTQW5kbUZzZFdVbktTQjdYRzRnSUNBZ2NISnZjQzUzY21sMFlXSnNaU0E5SUdaaGJITmxPMXh1SUNCOVhHNWNiaUFnTHk4Z1FYVm5iV1Z1ZENCMGFHVWdRMmhoYVc0Z2NISnZkRzkwZVhCbFhHNGdJSEJ5YjNCYlptNUxaWGxkSUQwZ1puVnVZM1JwYjI0Z1ptNGdLQ2tnZTF4dUlDQWdJSFpoY2lCbGVIQWdQU0J1WlhjZ1JYaHdaV04wWVhScGIyNG9iV0YwWTJobGNpd2dZWEpuZFcxbGJuUnpLVHRjYmlBZ0lDQjBhR2x6TGw5ZlpYaHdaV04wWVhScGIyNXpYMTh1Y0hWemFDaGxlSEFwTzF4dUlDQWdJR2xtSUNnaGRHaHBjeTVmWDJSbFptVnljbVZrWDE4cElIdGNiaUFnSUNBZ0lIUm9hWE11WVhOelpYSjBLSFJvYVhNdWRtRnNkV1VzSUdadUtUdGNiaUFnSUNCOVhHNGdJQ0FnY21WMGRYSnVJSFJvYVhNN1hHNGdJSDA3WEc1Y2JpQWdaR1ZtVUhKdmNDaERhR0ZwYmk1d2NtOTBiM1I1Y0dVc0lHNWhiV1VzSUhCeWIzQXBPMXh1WEc0Z0lDOHZJRUYxWjIxbGJuUWdkR2hsSUhOMFlYUnBZeUJwYm5SbGNtWmhZMlZjYmlBZ2NISnZjRnRtYmt0bGVWMGdQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnZG1GeUlHTm9ZV2x1SUQwZ2JtVjNJRU5vWVdsdUtDazdYRzVjYmlBZ0lDQnBaaUFvWm01TFpYa2dQVDA5SUNkblpYUW5LU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZMmhoYVc1YmJtRnRaVjA3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjbVYwZFhKdUlHTm9ZV2x1VzI1aGJXVmRMbUZ3Y0d4NUtHTm9ZV2x1TENCaGNtZDFiV1Z1ZEhNcE8xeHVJQ0I5TzF4dVhHNGdJR1JsWmxCeWIzQW9ZWE56TENCdVlXMWxMQ0J3Y205d0tUdGNibHh1SUNBdkx5QlFZWE56SUhSb2NtOTFaMmdnWm05eUlHTm9ZV2x1YzF4dUlDQndjbTl3VzJadVMyVjVYU0E5SUdaMWJtTjBhVzl1SUhCaGMzTjBhSEp2ZFdkb0tDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpXMjVoYldWZExtRnpjMlZ5ZENoMGFHbHpMblpoYkhWbExDQndZWE56ZEdoeWIzVm5hQ2t1ZG1Gc2RXVlBaaWdwTzF4dUlDQjlPMXh1SUNCd2NtOXdMbVZ1ZFcxbGNtRmliR1VnUFNCbVlXeHpaVHRjYmlBZ1pHVm1VSEp2Y0NoRGFHRnBiaTV3Y205MGIzUjVjR1VzSUNja0p5QXJJRzVoYldVc0lIQnliM0FwTzF4dVhHNGdJQzh2SUZCaGMzTWdkR2h5YjNWbmFDQnpkR0YwYVdNZ1kyOXVjM1J5ZFdOMGIzSmNiaUFnWkdWbVVISnZjQ2hoYzNNc0lDY2tKeUFySUc1aGJXVXNJSHRjYmlBZ0lDQjJZV3gxWlRvZ1puVnVZM1JwYjI0Z0tIWmhiSFZsS1NCN1hHNGdJQ0FnSUNCcFppQW9abTVMWlhrZ1BUMDlJQ2RuWlhRbktTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmhjM01vZG1Gc2RXVXBXeWNrSnlBcklHNWhiV1ZkTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBdkx5QkRjbVZoZEdVZ1lTQnVaWGNnWlhod2NtVnpjMmx2YmlCbWIzSWdkR2hsSUdWNGNHVmpkR0YwYVc5dVhHNGdJQ0FnSUNCMllYSWdZMmhoYVc0Z1BTQnVaWGNnUTJoaGFXNG9LVHRjYmlBZ0lDQWdJR05vWVdsdVcyNWhiV1ZkTG1Gd2NHeDVLR05vWVdsdUxDQmhjbWQxYldWdWRITXBPMXh1SUNBZ0lDQWdMeThnVW1WMGRYSnVJR0VnWTJGc2JHRmliR1VnZEdoaGRDQmhjM05sY25SeklIVndiMjRnY21WalpXbDJhVzVuSUdFZ2RtRnNkV1ZjYmlBZ0lDQWdJSEpsZEhWeWJpQmphR0ZwYmk1MGFISnZkV2RvTzF4dUlDQWdJSDBzWEc0Z0lDQWdaVzUxYldWeVlXSnNaVG9nWm1Gc2MyVmNiaUFnZlNrN1hHNWNibjA3WEc1Y2JseHViVzlrZFd4bExtVjRjRzl5ZEhNZ1BTQmhjM003WEc0aVhYMD0iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIHJlc29sdmVycyA9IHJlcXVpcmUoJy4vcmVzb2x2ZXJzJyk7XG52YXIgQXNzRXJyb3IgPSByZXF1aXJlKCcuL2Vycm9yJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIFByb21pc2UgPSB1dGlsLlByb21pc2U7XG5cbnZhciBkZWZQcm9wID0gdXRpbC5iaW5kKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgT2JqZWN0KTtcblxuLy8gQW4gZXhwZWN0YXRpb25zIGNoYWluIChha2EgZXhwcmVzc2lvbiksIHRoZSBjb3JlIG9iamVjdCBvZiB0aGUgbGlicmFyeSxcbi8vIGFsbG93cyB0byBzZXR1cCBhIHNldCBvZiBleHBlY3RhdGlvbnMgdG8gYmUgcnVuIGF0IGFueSBwb2ludCBhZ2FpbnN0IGFcbi8vIHZhbHVlLlxuZnVuY3Rpb24gQ2hhaW4gKHZhbHVlKSB7XG4gIGlmICghQ2hhaW4uaXNDaGFpbih0aGlzKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQXNzIENoYWluIGNvbnN0cnVjdG9yIGNhbGxlZCB3aXRob3V0IG5ldyEnKTtcbiAgfVxuXG4gIC8vIFRPRE86IE9uIG5vbiBpbml0aWFsaXplZCBjaGFpbnMgd2UgY2FuJ3QgZG8gLnZhbHVlLCBpdCBzaG91bGRcbiAgLy8gICAgICAgYmUgYSBleHBlY3RhdGlvbiB0aGF0IGdldHMgdGhlIGluaXRpYWwgdmFsdWUgZ2l2ZW4gd2hlblxuICAvLyAgICAgICByZXNvbHZpbmcgKHNvLCBpdCBzaG91bGQgYmUgc3RvcmVkIG9uIHRoZSByZXNvbHZlcilcbiAgdGhpcy52YWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAwID8gdmFsdWUgOiB0aGlzLl9fR1VBUkRfXztcblxuICAvLyBDdXN0b20gZGVzY3JpcHRpb25cbiAgZGVmUHJvcCh0aGlzLCAnX19kZXNjcmlwdGlvbl9fJywge1xuICAgIHZhbHVlOiAnJyxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiB0cnVlXG4gIH0pO1xuXG4gIC8vIExpc3Qgb2YgWyBFeHBlY3RhdGlvbiBdXG4gIGRlZlByb3AodGhpcywgJ19fZXhwZWN0YXRpb25zX18nLCB7XG4gICAgdmFsdWU6IFtdLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pO1xuXG4gIC8vIFdoZW4gdHJ1ZSB0aGUgZXhwcmVzc2lvbiBpcyBjb25zaWRlcmVkIGRlZmVycmVkIGFuZCB3b24ndFxuICAvLyB0cnkgdG8gaW1tZWRpYXRlbHkgZXZhbHVhdGUgYW55IG5ld2x5IGNoYWluZWQgZXhwZWN0YXRpb24uXG4gIGRlZlByb3AodGhpcywgJ19fZGVmZXJyZWRfXycsIHtcbiAgICB2YWx1ZTogdGhpcy52YWx1ZSA9PT0gdGhpcy5fX0dVQVJEX18sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KTtcblxuICAvLyBIb2xkcyB0aGUgbGlzdCBvZiBwcm9taXNlIGNhbGxiYWNrcyBhdHRhY2hlZCB0byB0aGUgZXhwcmVzc2lvblxuICBkZWZQcm9wKHRoaXMsICdfX3RoZW5zX18nLCB7XG4gICAgdmFsdWU6IFtdLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pO1xuXG4gIC8vIFNlYWwgdGhlIGNvbnRleHQgdG8gdGhlIG1ldGhvZHMgc28gd2UgY2FuIGNhbGwgdGhlbSBhcyBwbGFpbiBmdW5jdGlvbnNcbiAgdGhpcy50ZXN0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS50ZXN0LCB0aGlzKTtcbiAgdGhpcy5hc3NlcnQgPSB1dGlsLmJpbmQoQ2hhaW4ucHJvdG90eXBlLmFzc2VydCwgdGhpcyk7XG4gIHRoaXMucmVzdWx0ID0gdXRpbC5iaW5kKENoYWluLnByb3RvdHlwZS5yZXN1bHQsIHRoaXMpO1xuICB0aGlzLnRocm91Z2ggPSB1dGlsLmJpbmQoQ2hhaW4ucHJvdG90eXBlLnRocm91Z2gsIHRoaXMpO1xuICB0aGlzLiQgPSB0aGlzLnRocm91Z2g7XG59XG5cbkNoYWluLmlzQ2hhaW4gPSBmdW5jdGlvbiAob2JqKSB7XG4gIC8vIFRoaXMgbG9va3MgY29udHJpdmVkIGJ1dCBpbnN0YW5jZW9mIGlzIGtpbmQgb2Ygc2xvdy1pc2hcbiAgcmV0dXJuIG9iaiAmJiBvYmouY29uc3RydWN0b3IgPT09IENoYWluO1xufTtcblxuXG52YXIgcHJvdG8gPSBDaGFpbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xucHJvdG8uY29uc3RydWN0b3IgPSBDaGFpbjtcblxuLy8gR3VhcmQgdG9rZW4gdG8gZGV0ZWN0IHZhbHVlbGVzcyBtYXRjaGVyc1xucHJvdG8uX19HVUFSRF9fID0ge1xuICB2YWx1ZU9mOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgfSxcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ3t7dmFsdWVsZXNzfX0nO1xuICB9XG59O1xuXG4vLyBTdXBwb3J0cyB0aGUgdXNhZ2U6IGFzcy5zdHJpbmcuaGVscFxuZGVmUHJvcChwcm90bywgJ2hlbHAnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIC8vIFRPRE86IFByb2R1Y3RpemUgdGhpcyBhbmQgcGVyaGFwcyBzaG93IGhlbHAgZm9yIHRoZSB3aG9sZSBjaGFpblxuICAgIHZhciB0YWlsID0gXy50YWlsKHRoaXMuX19leHBlY3RhdGlvbnNfXyk7XG4gICAgcmV0dXJuIHRhaWwgPyB0YWlsLmhlbHAgOiAnTi9BJztcbiAgfVxufSk7XG5cbi8vIFN1cHBvcnQgdXNlIGNhc2U6IGFzcyh2YWx1ZSkuXy5zb21lLm51bWJlci5hYm92ZSg1KS5fXG5kZWZQcm9wKHByb3RvLCAnXycsIHtcbiAgZ2V0OiBmdW5jdGlvbiBmbigpIHtcbiAgICBpZiAoIXRoaXMuX19kZWZlcnJlZF9fKSB7XG4gICAgICB0aGlzLl9fZGVmZXJyZWRfXyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19kZWZlcnJlZF9fID0gZmFsc2U7XG4gICAgICB0aGlzLmFzc2VydCh0aGlzLnZhbHVlLCBmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG59KTtcblxuXG4vLyBFeHBvc2VzIGEgUHJvbWlzZS9BIGludGVyZmFjZSBmb3IgdGhlIGV4cHJlc3Npb24sIHRoZSBpbnRlbmRlZCB1c2UgaXMgZm9yXG4vLyBvYnRhaW5pbmcgdGhlIHJlc3VsdCBmb3IgYXN5bmNocm9ub3VzIGV4cHJlc3Npb25zLlxuLy8gSGVyZSB0aG91Z2ggd2UganVzdCBjb2xsZWN0IHRoZSBjYWxsYmFja3MsIHRoZSBhY3R1YWwgcHJvbWlzZSByZXNvbHV0aW9uXG4vLyBpcyBkb25lIGluIHRoZSByZXNvbHZlciB3aGVuIGl0IHJlYWNoZXMgYSByZXN1bHQuXG5wcm90by50aGVuID0gZnVuY3Rpb24gKGNiLCBlYikge1xuICAvLyBSZWdpc3RlciB0aGUgY2FsbGJhY2tzIHRvIGJlIHVzZWQgd2hlbiByZXNvbHZlZFxuICB0aGlzLl9fdGhlbnNfXy5wdXNoKFtjYiwgZWJdKTtcblxuICAvLyBXaGVuIHRoZSBleHByZXNzaW9uIGlzIG5vbiBkZWZlcnJlZCBhbmQgd2UgaGF2ZSBhIHZhbHVlIHdlIGZvcmNlIHRoZVxuICAvLyByZXNvbHZlciB0byBydW4gaW4gb3JkZXIgdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSBhdCBsZWFzdCBvbmNlLlxuICAvLyBUaGlzIGlzIHByaW1hcmlseSB0byBzdXBwb3J0IHRoZSB0ZXN0IHJ1bm5lcnMgdXNlIGNhc2Ugd2hlcmUgYW4gZXhwcmVzc2lvblxuICAvLyBpcyByZXR1cm5lZCBmcm9tIHRoZSB0ZXN0IGFuZCB0aGUgcnVubmVyIHdpbGwgYXR0YWNoIGl0c2VsZiBoZXJlLlxuICBpZiAoIXRoaXMuX19kZWZlcnJlZF9fICYmIHRoaXMudmFsdWUgIT09IHRoaXMuX19HVUFSRF9fKSB7XG4gICAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gICAgcmVzb2x2ZXIodGhpcy52YWx1ZSk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmNhdGNoID0gZnVuY3Rpb24gKGViKSB7XG4gIHJldHVybiB0aGlzLnRoZW4obnVsbCwgZWIpO1xufTtcblxuLy8gRGlzcGF0Y2ggZXZlcnlvbmUgd2hvIHdhcyB3YWl0aW5nIHRvIGJlIG5vdGlmaWVkIG9mIHRoZSBvdXRjb21lXG5wcm90by5kaXNwYXRjaFJlc3VsdCA9IGZ1bmN0aW9uIChyZXNvbHZlZCwgcmVzdWx0KSB7XG4gIGlmICgwID09PSB0aGlzLl9fdGhlbnNfXy5sZW5ndGgpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBHZW5lcmF0ZSBhIG5pY2UgZXJyb3IgZm9yIHRoZSBmYWlsdXJlXG4gIHZhciBhY3R1YWwgPSB0aGlzLnZhbHVlO1xuICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgIGFjdHVhbCA9IHRoaXMuYnVpbGRFcnJvcihyZXNvbHZlZCwgcHJvdG8uZGlzcGF0Y2hSZXN1bHQpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgaW1tZWRpYXRlbHkgd2l0aCBhIGZhaWx1cmUgZXJyb3Igb3JcbiAgLy8gcmVzb2x2ZXMgd2l0aCB0aGUgZXhwcmVzc2lvbiBzdWJqZWN0LlxuICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAvLyBDYWxsaW5nIHJlc29sdmUoKSB3aXRoIGEgcHJvbWlzZSB3aWxsIGF0dGFjaCBpdHNlbGYgdG8gdGhlIHByb21pc2VcbiAgICAvLyBpbnN0ZWFkIG9mIHBhc3NpbmcgaXQgYXMgYSBzaW1wbGUgdmFsdWUuIFRvIGF2b2lkIHRoYXQgd2UgZGV0ZWN0IHRoZVxuICAgIC8vIGNhc2UgYW5kIHdyYXAgaXQgaW4gYW4gYXJyYXkuXG4gICAgaWYgKGFjdHVhbCAmJiB0eXBlb2YgYWN0dWFsLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGFjdHVhbCA9IFtcbiAgICAgICAgJ0FzczogVmFsdWUgd3JhcHBlZCBpbiBhbiBhcnJheSBzaW5jZSBpdCBsb29rcyBsaWtlIGEgUHJvbWlzZScsXG4gICAgICAgIGFjdHVhbFxuICAgICAgXTtcbiAgICB9XG5cbiAgICAocmVzdWx0ID8gcmVzb2x2ZSA6IHJlamVjdCkoIGFjdHVhbCApO1xuICB9KTtcblxuICAvLyBBdHRhY2ggYWxsIHRoZSByZWdpc3RlcmVkIHRoZW5zIHRvIHRoZSBwcm9taXNlIHNvIHRoZXkgZ2V0IG5vdGlmaWVkXG4gIF8uZm9yRWFjaCh0aGlzLl9fdGhlbnNfXywgZnVuY3Rpb24gKGNhbGxiYWNrcykge1xuICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4uYXBwbHkocHJvbWlzZSwgY2FsbGJhY2tzKTtcbiAgfSk7XG59O1xuXG5mdW5jdGlvbiBkdW1wQ2hhaW4gKHJlc29sdmVkLCBpbmRlbnQpIHtcbiAgdmFyIHJlc3VsdCA9ICcnO1xuXG4gIGluZGVudCA9IGluZGVudCB8fCAnJztcblxuICByZXNvbHZlZC5mb3JFYWNoKGZ1bmN0aW9uIChleHAsIGlkeCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV4cCkpIHtcbiAgICAgIHJlc3VsdCArPSBkdW1wQ2hhaW4oZXhwLCBpbmRlbnQgKyAnICAnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZXhwLnJlc3VsdCkge1xuICAgICAgcmVzdWx0ICs9IGluZGVudCArICcgXFx1MDAxYlszMm1QYXNzZWQ6XFx1MDAxYlswbSAnICsgZXhwLmRlc2NyaXB0aW9uICsgJ1xcbic7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVzdWx0ICs9IGluZGVudCArICcgXFx1MDAxYlszMW1GYWlsZWQ6XFx1MDAxYlswbSAnICsgZXhwLmRlc2NyaXB0aW9uICsgJ1xcbic7XG4gICAgaWYgKGlkeCA9PT0gcmVzb2x2ZWQubGVuZ3RoIC0gMSkge1xuICAgICAgcmVzdWx0ICs9IGluZGVudCArICcgICAgXFx1MDAxYlszM21CdXQ6XFx1MDAxYlswbSAnICsgZXhwLmZhaWx1cmUgKyAnXFxuJztcbiAgICB9XG5cbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG4vLyBCdWlsZHMgYW4gQXNzRXJyb3IgZm9yIHRoZSBjdXJyZW50IGV4cHJlc3Npb24uIEl0IG1ha2VzIGEgY291cGxlIG9mXG4vLyBhc3N1bXB0aW9ucywgZm9yIGluc3RhbmNlIHRoZSAuX19vZmZzZXRfXyBtdXN0IGJlIHBsYWNlZCBqdXN0IGFmdGVyIHRoZVxuLy8gZXhwZWN0YXRpb24gdGhhdCBwcm9kdWNlZCB0aGUgZmFpbHVyZSBvZiB0aGUgY2hhaW4uXG5wcm90by5idWlsZEVycm9yID0gZnVuY3Rpb24gKHJlc29sdmVkLCBzc2YpIHtcblxuICB2YXIgZXJyb3IgPSB0aGlzLl9fZGVzY3JpcHRpb25fXyArICdcXG5cXG4nO1xuXG4gIGV4cCA9IHJlc29sdmVkWyByZXNvbHZlZC5sZW5ndGggLSAxIF07XG4gIGVycm9yICs9IGR1bXBDaGFpbihyZXNvbHZlZCk7XG5cbiAgaWYgKCF1dGlsLmRvQ29sb3JzKCkpIHtcbiAgICBlcnJvciA9IHV0aWwudW5hbnNpKGVycm9yKTtcbiAgfVxuXG4gIC8vIFRPRE86IHNob3dEaWZmIHNob3VsZCBiZSB1c2VkIG9ubHkgd2hlbiBpdCBtYWtlcyBzZW5zZSBwZXJoYXBzXG4gIC8vICAgICAgIHdlIGNhbiBwYXNzIG51bGwvdW5kZWZpbmVkIGFuZCBsZXQgQXNzRXJyb3IgZGV0ZWN0IHdoZW4gaXRcbiAgLy8gICAgICAgbWFrZXMgc2Vuc2UuXG5cbiAgdmFyIGV4cGVjdGVkID0gZXhwLmV4cGVjdGVkO1xuICAvLyBNb2NoYSB3aWxsIHRyeSB0byBqc29uaWZ5IHRoZSBleHBlY3RlZCB2YWx1ZSwganVzdCBpZ25vcmUgaWYgaXQncyBhIGZ1bmN0aW9uXG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB2YXIgaW5zdCA9IG5ldyBBc3NFcnJvcihlcnJvciwgc3NmIHx8IGFyZ3VtZW50cy5jYWxsZWUgfHwgcHJvdG8uYnVpbGRFcnJvcik7XG4gIGluc3Quc2hvd0RpZmYgPSBmYWxzZTtcbiAgaW5zdC5hY3R1YWwgPSBudWxsO1xuICBpbnN0LmV4cGVjdGVkID0gbnVsbDtcbiAgcmV0dXJuIGluc3Q7XG59O1xuXG4vLyBSZXNvbHZlcyB0aGUgY3VycmVudCBjaGFpbiBmb3IgYSBnaXZlbiB2YWx1ZS4gVGhlIHJlc3VsdCBpcyBhbHdheXMgYVxuLy8gYm9vbGVhbiBpbmRpY2F0aW5nIHRoZSBvdXRjb21lIG9yIGFuIHVuZGVmaW5lZCB0byBzaWduYWwgdGhhdCBpdCByZWFjaGVkXG4vLyBhbiBhc3luY2hyb25vdXMgZmxvdy5cbnByb3RvLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgYWN0dWFsID0gdGhpcy52YWx1ZTtcbiAgfVxuXG4gIC8vIFJlc29sdmUgdGhlIGNoYWluIHN0YXJ0aW5nIGZyb20gcm9vdFxuICB2YXIgcmVzb2x2ZXIgPSByZXNvbHZlcnMuYWNxdWlyZSh0aGlzKTtcbiAgdmFyIHJlc3VsdCA9IHJlc29sdmVyKGFjdHVhbCk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8vIFBlcmZvcm1zIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBjaGFpbiBidXQgYWRkaXRpb25hbGx5IHdpbGwgcmFpc2UgYW4gZXJyb3Jcbi8vIGlmIGl0IGZhaWxzIHRvIGNvbXBsZXRlLiBXaGVuIHRoZSBleHByZXNzaW9uIHJlc29sdmVzIGFzIHVuZGVmaW5lZCAoYXN5bmMpXG4vLyBpdCdsbCBiZSBhdXRvbWF0aWNhbGx5IGVuYWJsZSBpdHMgZGVmZXJyZWQgZmxhZy5cbi8vIFRoZSBgc3NmYCBzdGFuZHMgZm9yIFN0YWNrVHJhY2VGdW5jdGlvbiwgYSByZWZlcmVuY2UgdG8gdGhlIGZpcnN0IGZ1bmN0aW9uXG4vLyB0byBzaG93IG9uIHRoZSBzdGFjayB0cmFjZS5cbnByb3RvLmFzc2VydCA9IGZ1bmN0aW9uIChhY3R1YWwsIHNzZikge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICAvLyBKdXN0IGlnbm9yZSBpZiB0aGUgYWN0dWFsIHZhbHVlIGlzIG5vdCBwcmVzZW50IHlldFxuICAvLyBUT0RPOiBTaGFsbCBpdCBwcm9kdWNlIGFuIGVycm9yP1xuICBpZiAoYWN0dWFsID09PSB0aGlzLl9fR1VBUkRfXykgcmV0dXJuIHRoaXM7XG5cbiAgdmFyIHJlc29sdmVyID0gcmVzb2x2ZXJzLmFjcXVpcmUodGhpcyk7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuXG4gIC8vIEl0IGZhaWxlZCBzbyByZXBvcnQgaXQgd2l0aCBhIG5pY2UgZXJyb3JcbiAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICB0aHJvdyB0aGlzLmJ1aWxkRXJyb3IocmVzb2x2ZXIucmVzb2x2ZWQsIHNzZiB8fCB0aGlzLmFzc2VydCk7XG4gIH1cblxuICAvLyBDb252ZXJ0IHRoZSBleHByZXNzaW9uIGludG8gYSBkZWZlcnJlZCBpZiBhbiBhc3luYyBleHBlY3Rpb24gd2FzIGZvdW5kXG4gIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX19kZWZlcnJlZF9fID0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gQXNzZXJ0cyB0aGUgcHJvdmlkZWQgdmFsdWUgYW5kIGlmIHN1Y2Nlc3NmdWwgcmV0dXJucyB0aGUgb3JpZ2luYWxcbi8vIHZhbHVlIGluc3RlYWQgb2YgdGhlIGNoYWluIGluc3RhbmNlLlxucHJvdG8udGhyb3VnaCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgdGhpcy5hc3NlcnQoYWN0dWFsLCBwcm90by50aHJvdWdoKTtcbiAgcmV0dXJuIGFjdHVhbDtcbn07XG5cbi8vIEV2YWx1YXRlcyB0aGUgZXhwcmVzc2lvbiBjaGFpbiByZXBvcnRpbmcgdGhlIGxhc3QgbXV0YXRlZCB2YWx1ZSBzZWVuIGluXG4vLyBpdC4gSWYgdGhlIGV4cHJlc3Npb24gZG9lcyBub3QgY29tcGxldGUgaXQnbGwgcmV0dXJuIHVuZGVmaW5lZC5cbnByb3RvLnJlc3VsdCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgdmFyIHJlc3VsdDtcblxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFjdHVhbCA9IHRoaXMudmFsdWU7XG4gIH1cblxuICB0cnkge1xuICAgIHRoaXMudGFwKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgfSkudGVzdChhY3R1YWwpO1xuICB9IGZpbmFsbHkge1xuICAgIC8vIFJlbW92ZSB0aGUgLnRhcCBmcm9tIHRoZSBjaGFpblxuICAgIHRoaXMuX19leHBlY3RhdGlvbnNfXy5wb3AoKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5DaGFpbi5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudmFsdWU7XG59O1xuXG5DaGFpbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLl9fZGVzY3JpcHRpb25fXykge1xuICAgIHJldHVybiB0aGlzLl9fZGVzY3JpcHRpb25fXztcbiAgfVxuXG4gIHZhciBkZXNjcyA9XG4gICAgdGhpcy5fX2V4cGVjdGF0aW9uc19fXG4gICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5kZXNjcmlwdGlvbiB9KVxuICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZGVzY3JpcHRpb24gfSk7XG5cbiAgaWYgKGRlc2NzLmxlbmd0aCA+IDEpIHtcbiAgICByZXR1cm4gJygnICsgZGVzY3Muam9pbignLCAnKSArICcpJztcbiAgfSBlbHNlIGlmIChkZXNjcy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gZGVzY3NbMF07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICc8QXNzQ2hhaW4+JztcbiAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENoYWluO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklteHBZaTlqYUdGcGJpNXFjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPMEZCUVVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTSXNJbVpwYkdVaU9pSm5aVzVsY21GMFpXUXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpZG1GeUlGOGdQU0FvZEhsd1pXOW1JSGRwYm1SdmR5QWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JSGRwYm1SdmR5NWZJRG9nZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JR2RzYjJKaGJDNWZJRG9nYm5Wc2JDazdYRzVjYm5aaGNpQnlaWE52YkhabGNuTWdQU0J5WlhGMWFYSmxLQ2N1TDNKbGMyOXNkbVZ5Y3ljcE8xeHVkbUZ5SUVGemMwVnljbTl5SUQwZ2NtVnhkV2x5WlNnbkxpOWxjbkp2Y2ljcE8xeHVkbUZ5SUhWMGFXd2dQU0J5WlhGMWFYSmxLQ2N1TDNWMGFXd25LVHRjYm5aaGNpQlFjbTl0YVhObElEMGdkWFJwYkM1UWNtOXRhWE5sTzF4dVhHNTJZWElnWkdWbVVISnZjQ0E5SUhWMGFXd3VZbWx1WkNoUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRIa3NJRTlpYW1WamRDazdYRzVjYmk4dklFRnVJR1Y0Y0dWamRHRjBhVzl1Y3lCamFHRnBiaUFvWVd0aElHVjRjSEpsYzNOcGIyNHBMQ0IwYUdVZ1kyOXlaU0J2WW1wbFkzUWdiMllnZEdobElHeHBZbkpoY25rc1hHNHZMeUJoYkd4dmQzTWdkRzhnYzJWMGRYQWdZU0J6WlhRZ2IyWWdaWGh3WldOMFlYUnBiMjV6SUhSdklHSmxJSEoxYmlCaGRDQmhibmtnY0c5cGJuUWdZV2RoYVc1emRDQmhYRzR2THlCMllXeDFaUzVjYm1aMWJtTjBhVzl1SUVOb1lXbHVJQ2gyWVd4MVpTa2dlMXh1SUNCcFppQW9JVU5vWVdsdUxtbHpRMmhoYVc0b2RHaHBjeWtwSUh0Y2JpQWdJQ0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KMEZ6Y3lCRGFHRnBiaUJqYjI1emRISjFZM1J2Y2lCallXeHNaV1FnZDJsMGFHOTFkQ0J1WlhjaEp5azdYRzRnSUgxY2JseHVJQ0F2THlCVVQwUlBPaUJQYmlCdWIyNGdhVzVwZEdsaGJHbDZaV1FnWTJoaGFXNXpJSGRsSUdOaGJpZDBJR1J2SUM1MllXeDFaU3dnYVhRZ2MyaHZkV3hrWEc0Z0lDOHZJQ0FnSUNBZ0lHSmxJR0VnWlhod1pXTjBZWFJwYjI0Z2RHaGhkQ0JuWlhSeklIUm9aU0JwYm1sMGFXRnNJSFpoYkhWbElHZHBkbVZ1SUhkb1pXNWNiaUFnTHk4Z0lDQWdJQ0FnY21WemIyeDJhVzVuSUNoemJ5d2dhWFFnYzJodmRXeGtJR0psSUhOMGIzSmxaQ0J2YmlCMGFHVWdjbVZ6YjJ4MlpYSXBYRzRnSUhSb2FYTXVkbUZzZFdVZ1BTQmhjbWQxYldWdWRITXViR1Z1WjNSb0lENGdNQ0EvSUhaaGJIVmxJRG9nZEdocGN5NWZYMGRWUVZKRVgxODdYRzVjYmlBZ0x5OGdRM1Z6ZEc5dElHUmxjMk55YVhCMGFXOXVYRzRnSUdSbFpsQnliM0FvZEdocGN5d2dKMTlmWkdWelkzSnBjSFJwYjI1Zlh5Y3NJSHRjYmlBZ0lDQjJZV3gxWlRvZ0p5Y3NYRzRnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dabUZzYzJVc1hHNGdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0IzY21sMFlXSnNaVG9nZEhKMVpWeHVJQ0I5S1R0Y2JseHVJQ0F2THlCTWFYTjBJRzltSUZzZ1JYaHdaV04wWVhScGIyNGdYVnh1SUNCa1pXWlFjbTl3S0hSb2FYTXNJQ2RmWDJWNGNHVmpkR0YwYVc5dWMxOWZKeXdnZTF4dUlDQWdJSFpoYkhWbE9pQmJYU3hjYmlBZ0lDQmxiblZ0WlhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUhkeWFYUmhZbXhsT2lCbVlXeHpaVnh1SUNCOUtUdGNibHh1SUNBdkx5QlhhR1Z1SUhSeWRXVWdkR2hsSUdWNGNISmxjM05wYjI0Z2FYTWdZMjl1YzJsa1pYSmxaQ0JrWldabGNuSmxaQ0JoYm1RZ2QyOXVKM1JjYmlBZ0x5OGdkSEo1SUhSdklHbHRiV1ZrYVdGMFpXeDVJR1YyWVd4MVlYUmxJR0Z1ZVNCdVpYZHNlU0JqYUdGcGJtVmtJR1Y0Y0dWamRHRjBhVzl1TGx4dUlDQmtaV1pRY205d0tIUm9hWE1zSUNkZlgyUmxabVZ5Y21Wa1gxOG5MQ0I3WEc0Z0lDQWdkbUZzZFdVNklIUm9hWE11ZG1Gc2RXVWdQVDA5SUhSb2FYTXVYMTlIVlVGU1JGOWZMRnh1SUNBZ0lHVnVkVzFsY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dabUZzYzJVc1hHNGdJQ0FnZDNKcGRHRmliR1U2SUhSeWRXVmNiaUFnZlNrN1hHNWNiaUFnTHk4Z1NHOXNaSE1nZEdobElHeHBjM1FnYjJZZ2NISnZiV2x6WlNCallXeHNZbUZqYTNNZ1lYUjBZV05vWldRZ2RHOGdkR2hsSUdWNGNISmxjM05wYjI1Y2JpQWdaR1ZtVUhKdmNDaDBhR2x6TENBblgxOTBhR1Z1YzE5Zkp5d2dlMXh1SUNBZ0lIWmhiSFZsT2lCYlhTeGNiaUFnSUNCbGJuVnRaWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklHWmhiSE5sTEZ4dUlDQWdJSGR5YVhSaFlteGxPaUJtWVd4elpWeHVJQ0I5S1R0Y2JseHVJQ0F2THlCVFpXRnNJSFJvWlNCamIyNTBaWGgwSUhSdklIUm9aU0J0WlhSb2IyUnpJSE52SUhkbElHTmhiaUJqWVd4c0lIUm9aVzBnWVhNZ2NHeGhhVzRnWm5WdVkzUnBiMjV6WEc0Z0lIUm9hWE11ZEdWemRDQTlJSFYwYVd3dVltbHVaQ2hEYUdGcGJpNXdjbTkwYjNSNWNHVXVkR1Z6ZEN3Z2RHaHBjeWs3WEc0Z0lIUm9hWE11WVhOelpYSjBJRDBnZFhScGJDNWlhVzVrS0VOb1lXbHVMbkJ5YjNSdmRIbHdaUzVoYzNObGNuUXNJSFJvYVhNcE8xeHVJQ0IwYUdsekxuSmxjM1ZzZENBOUlIVjBhV3d1WW1sdVpDaERhR0ZwYmk1d2NtOTBiM1I1Y0dVdWNtVnpkV3gwTENCMGFHbHpLVHRjYmlBZ2RHaHBjeTUwYUhKdmRXZG9JRDBnZFhScGJDNWlhVzVrS0VOb1lXbHVMbkJ5YjNSdmRIbHdaUzUwYUhKdmRXZG9MQ0IwYUdsektUdGNiaUFnZEdocGN5NGtJRDBnZEdocGN5NTBhSEp2ZFdkb08xeHVmVnh1WEc1RGFHRnBiaTVwYzBOb1lXbHVJRDBnWm5WdVkzUnBiMjRnS0c5aWFpa2dlMXh1SUNBdkx5QlVhR2x6SUd4dmIydHpJR052Ym5SeWFYWmxaQ0JpZFhRZ2FXNXpkR0Z1WTJWdlppQnBjeUJyYVc1a0lHOW1JSE5zYjNjdGFYTm9YRzRnSUhKbGRIVnliaUJ2WW1vZ0ppWWdiMkpxTG1OdmJuTjBjblZqZEc5eUlEMDlQU0JEYUdGcGJqdGNibjA3WEc1Y2JseHVkbUZ5SUhCeWIzUnZJRDBnUTJoaGFXNHVjSEp2ZEc5MGVYQmxJRDBnVDJKcVpXTjBMbU55WldGMFpTaHVkV3hzS1R0Y2JuQnliM1J2TG1OdmJuTjBjblZqZEc5eUlEMGdRMmhoYVc0N1hHNWNiaTh2SUVkMVlYSmtJSFJ2YTJWdUlIUnZJR1JsZEdWamRDQjJZV3gxWld4bGMzTWdiV0YwWTJobGNuTmNibkJ5YjNSdkxsOWZSMVZCVWtSZlh5QTlJSHRjYmlBZ2RtRnNkV1ZQWmpvZ1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpMblJ2VTNSeWFXNW5LQ2s3WEc0Z0lIMHNYRzRnSUhSdlUzUnlhVzVuT2lCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUNkN2UzWmhiSFZsYkdWemMzMTlKenRjYmlBZ2ZWeHVmVHRjYmx4dUx5OGdVM1Z3Y0c5eWRITWdkR2hsSUhWellXZGxPaUJoYzNNdWMzUnlhVzVuTG1obGJIQmNibVJsWmxCeWIzQW9jSEp2ZEc4c0lDZG9aV3h3Snl3Z2UxeHVJQ0JuWlhRNklHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQXZMeUJVVDBSUE9pQlFjbTlrZFdOMGFYcGxJSFJvYVhNZ1lXNWtJSEJsY21oaGNITWdjMmh2ZHlCb1pXeHdJR1p2Y2lCMGFHVWdkMmh2YkdVZ1kyaGhhVzVjYmlBZ0lDQjJZWElnZEdGcGJDQTlJRjh1ZEdGcGJDaDBhR2x6TGw5ZlpYaHdaV04wWVhScGIyNXpYMThwTzF4dUlDQWdJSEpsZEhWeWJpQjBZV2xzSUQ4Z2RHRnBiQzVvWld4d0lEb2dKMDR2UVNjN1hHNGdJSDFjYm4wcE8xeHVYRzR2THlCVGRYQndiM0owSUhWelpTQmpZWE5sT2lCaGMzTW9kbUZzZFdVcExsOHVjMjl0WlM1dWRXMWlaWEl1WVdKdmRtVW9OU2t1WDF4dVpHVm1VSEp2Y0Nod2NtOTBieXdnSjE4bkxDQjdYRzRnSUdkbGREb2dablZ1WTNScGIyNGdabTRvS1NCN1hHNGdJQ0FnYVdZZ0tDRjBhR2x6TGw5ZlpHVm1aWEp5WldSZlh5a2dlMXh1SUNBZ0lDQWdkR2hwY3k1ZlgyUmxabVZ5Y21Wa1gxOGdQU0IwY25WbE8xeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0IwYUdsekxsOWZaR1ZtWlhKeVpXUmZYeUE5SUdaaGJITmxPMXh1SUNBZ0lDQWdkR2hwY3k1aGMzTmxjblFvZEdocGN5NTJZV3gxWlN3Z1ptNHBPMXh1SUNBZ0lIMWNiaUFnSUNCeVpYUjFjbTRnZEdocGN6dGNiaUFnZlZ4dWZTazdYRzVjYmx4dUx5OGdSWGh3YjNObGN5QmhJRkJ5YjIxcGMyVXZRU0JwYm5SbGNtWmhZMlVnWm05eUlIUm9aU0JsZUhCeVpYTnphVzl1TENCMGFHVWdhVzUwWlc1a1pXUWdkWE5sSUdseklHWnZjbHh1THk4Z2IySjBZV2x1YVc1bklIUm9aU0J5WlhOMWJIUWdabTl5SUdGemVXNWphSEp2Ym05MWN5QmxlSEJ5WlhOemFXOXVjeTVjYmk4dklFaGxjbVVnZEdodmRXZG9JSGRsSUdwMWMzUWdZMjlzYkdWamRDQjBhR1VnWTJGc2JHSmhZMnR6TENCMGFHVWdZV04wZFdGc0lIQnliMjFwYzJVZ2NtVnpiMngxZEdsdmJseHVMeThnYVhNZ1pHOXVaU0JwYmlCMGFHVWdjbVZ6YjJ4MlpYSWdkMmhsYmlCcGRDQnlaV0ZqYUdWeklHRWdjbVZ6ZFd4MExseHVjSEp2ZEc4dWRHaGxiaUE5SUdaMWJtTjBhVzl1SUNoallpd2daV0lwSUh0Y2JpQWdMeThnVW1WbmFYTjBaWElnZEdobElHTmhiR3hpWVdOcmN5QjBieUJpWlNCMWMyVmtJSGRvWlc0Z2NtVnpiMngyWldSY2JpQWdkR2hwY3k1ZlgzUm9aVzV6WDE4dWNIVnphQ2hiWTJJc0lHVmlYU2s3WEc1Y2JpQWdMeThnVjJobGJpQjBhR1VnWlhod2NtVnpjMmx2YmlCcGN5QnViMjRnWkdWbVpYSnlaV1FnWVc1a0lIZGxJR2hoZG1VZ1lTQjJZV3gxWlNCM1pTQm1iM0pqWlNCMGFHVmNiaUFnTHk4Z2NtVnpiMngyWlhJZ2RHOGdjblZ1SUdsdUlHOXlaR1Z5SUhSdklISmxjMjlzZG1VZ2RHaGxJSEJ5YjIxcGMyVWdZWFFnYkdWaGMzUWdiMjVqWlM1Y2JpQWdMeThnVkdocGN5QnBjeUJ3Y21sdFlYSnBiSGtnZEc4Z2MzVndjRzl5ZENCMGFHVWdkR1Z6ZENCeWRXNXVaWEp6SUhWelpTQmpZWE5sSUhkb1pYSmxJR0Z1SUdWNGNISmxjM05wYjI1Y2JpQWdMeThnYVhNZ2NtVjBkWEp1WldRZ1puSnZiU0IwYUdVZ2RHVnpkQ0JoYm1RZ2RHaGxJSEoxYm01bGNpQjNhV3hzSUdGMGRHRmphQ0JwZEhObGJHWWdhR1Z5WlM1Y2JpQWdhV1lnS0NGMGFHbHpMbDlmWkdWbVpYSnlaV1JmWHlBbUppQjBhR2x6TG5aaGJIVmxJQ0U5UFNCMGFHbHpMbDlmUjFWQlVrUmZYeWtnZTF4dUlDQWdJSFpoY2lCeVpYTnZiSFpsY2lBOUlISmxjMjlzZG1WeWN5NWhZM0YxYVhKbEtIUm9hWE1wTzF4dUlDQWdJSEpsYzI5c2RtVnlLSFJvYVhNdWRtRnNkV1VwTzF4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUhSb2FYTTdYRzU5TzF4dVhHNXdjbTkwYnk1allYUmphQ0E5SUdaMWJtTjBhVzl1SUNobFlpa2dlMXh1SUNCeVpYUjFjbTRnZEdocGN5NTBhR1Z1S0c1MWJHd3NJR1ZpS1R0Y2JuMDdYRzVjYmk4dklFUnBjM0JoZEdOb0lHVjJaWEo1YjI1bElIZG9ieUIzWVhNZ2QyRnBkR2x1WnlCMGJ5QmlaU0J1YjNScFptbGxaQ0J2WmlCMGFHVWdiM1YwWTI5dFpWeHVjSEp2ZEc4dVpHbHpjR0YwWTJoU1pYTjFiSFFnUFNCbWRXNWpkR2x2YmlBb2NtVnpiMngyWldRc0lISmxjM1ZzZENrZ2UxeHVJQ0JwWmlBb01DQTlQVDBnZEdocGN5NWZYM1JvWlc1elgxOHViR1Z1WjNSb0tTQjdYRzRnSUNBZ2NtVjBkWEp1TzF4dUlDQjlYRzVjYmlBZ0x5OGdSMlZ1WlhKaGRHVWdZU0J1YVdObElHVnljbTl5SUdadmNpQjBhR1VnWm1GcGJIVnlaVnh1SUNCMllYSWdZV04wZFdGc0lEMGdkR2hwY3k1MllXeDFaVHRjYmlBZ2FXWWdLSEpsYzNWc2RDQTlQVDBnWm1Gc2MyVXBJSHRjYmlBZ0lDQmhZM1IxWVd3Z1BTQjBhR2x6TG1KMWFXeGtSWEp5YjNJb2NtVnpiMngyWldRc0lIQnliM1J2TG1ScGMzQmhkR05vVW1WemRXeDBLVHRjYmlBZ2ZWeHVYRzRnSUM4dklFTnlaV0YwWlNCaElIQnliMjFwYzJVZ2RHaGhkQ0J5WldwbFkzUnpJR2x0YldWa2FXRjBaV3g1SUhkcGRHZ2dZU0JtWVdsc2RYSmxJR1Z5Y205eUlHOXlYRzRnSUM4dklISmxjMjlzZG1WeklIZHBkR2dnZEdobElHVjRjSEpsYzNOcGIyNGdjM1ZpYW1WamRDNWNiaUFnZG1GeUlIQnliMjFwYzJVZ1BTQnVaWGNnVUhKdmJXbHpaU2htZFc1amRHbHZiaUFvY21WemIyeDJaU3dnY21WcVpXTjBLU0I3WEc0Z0lDQWdMeThnUTJGc2JHbHVaeUJ5WlhOdmJIWmxLQ2tnZDJsMGFDQmhJSEJ5YjIxcGMyVWdkMmxzYkNCaGRIUmhZMmdnYVhSelpXeG1JSFJ2SUhSb1pTQndjbTl0YVhObFhHNGdJQ0FnTHk4Z2FXNXpkR1ZoWkNCdlppQndZWE56YVc1bklHbDBJR0Z6SUdFZ2MybHRjR3hsSUhaaGJIVmxMaUJVYnlCaGRtOXBaQ0IwYUdGMElIZGxJR1JsZEdWamRDQjBhR1ZjYmlBZ0lDQXZMeUJqWVhObElHRnVaQ0IzY21Gd0lHbDBJR2x1SUdGdUlHRnljbUY1TGx4dUlDQWdJR2xtSUNoaFkzUjFZV3dnSmlZZ2RIbHdaVzltSUdGamRIVmhiQzUwYUdWdUlEMDlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnSUNCaFkzUjFZV3dnUFNCYlhHNGdJQ0FnSUNBZ0lDZEJjM002SUZaaGJIVmxJSGR5WVhCd1pXUWdhVzRnWVc0Z1lYSnlZWGtnYzJsdVkyVWdhWFFnYkc5dmEzTWdiR2xyWlNCaElGQnliMjFwYzJVbkxGeHVJQ0FnSUNBZ0lDQmhZM1IxWVd4Y2JpQWdJQ0FnSUYwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnS0hKbGMzVnNkQ0EvSUhKbGMyOXNkbVVnT2lCeVpXcGxZM1FwS0NCaFkzUjFZV3dnS1R0Y2JpQWdmU2s3WEc1Y2JpQWdMeThnUVhSMFlXTm9JR0ZzYkNCMGFHVWdjbVZuYVhOMFpYSmxaQ0IwYUdWdWN5QjBieUIwYUdVZ2NISnZiV2x6WlNCemJ5QjBhR1Y1SUdkbGRDQnViM1JwWm1sbFpGeHVJQ0JmTG1admNrVmhZMmdvZEdocGN5NWZYM1JvWlc1elgxOHNJR1oxYm1OMGFXOXVJQ2hqWVd4c1ltRmphM01wSUh0Y2JpQWdJQ0J3Y205dGFYTmxJRDBnY0hKdmJXbHpaUzUwYUdWdUxtRndjR3g1S0hCeWIyMXBjMlVzSUdOaGJHeGlZV05yY3lrN1hHNGdJSDBwTzF4dWZUdGNibHh1Wm5WdVkzUnBiMjRnWkhWdGNFTm9ZV2x1SUNoeVpYTnZiSFpsWkN3Z2FXNWtaVzUwS1NCN1hHNGdJSFpoY2lCeVpYTjFiSFFnUFNBbkp6dGNibHh1SUNCcGJtUmxiblFnUFNCcGJtUmxiblFnZkh3Z0p5YzdYRzVjYmlBZ2NtVnpiMngyWldRdVptOXlSV0ZqYUNobWRXNWpkR2x2YmlBb1pYaHdMQ0JwWkhncElIdGNiaUFnSUNCcFppQW9RWEp5WVhrdWFYTkJjbkpoZVNobGVIQXBLU0I3WEc0Z0lDQWdJQ0J5WlhOMWJIUWdLejBnWkhWdGNFTm9ZV2x1S0dWNGNDd2dhVzVrWlc1MElDc2dKeUFnSnlrN1hHNGdJQ0FnSUNCeVpYUjFjbTQ3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdhV1lnS0dWNGNDNXlaWE4xYkhRcElIdGNiaUFnSUNBZ0lISmxjM1ZzZENBclBTQnBibVJsYm5RZ0t5QW5JRnhjZFRBd01XSmJNekp0VUdGemMyVmtPbHhjZFRBd01XSmJNRzBnSnlBcklHVjRjQzVrWlhOamNtbHdkR2x2YmlBcklDZGNYRzRuTzF4dUlDQWdJQ0FnY21WMGRYSnVPMXh1SUNBZ0lIMWNibHh1SUNBZ0lISmxjM1ZzZENBclBTQnBibVJsYm5RZ0t5QW5JRnhjZFRBd01XSmJNekZ0Um1GcGJHVmtPbHhjZFRBd01XSmJNRzBnSnlBcklHVjRjQzVrWlhOamNtbHdkR2x2YmlBcklDZGNYRzRuTzF4dUlDQWdJR2xtSUNocFpIZ2dQVDA5SUhKbGMyOXNkbVZrTG14bGJtZDBhQ0F0SURFcElIdGNiaUFnSUNBZ0lISmxjM1ZzZENBclBTQnBibVJsYm5RZ0t5QW5JQ0FnSUZ4Y2RUQXdNV0piTXpOdFFuVjBPbHhjZFRBd01XSmJNRzBnSnlBcklHVjRjQzVtWVdsc2RYSmxJQ3NnSjF4Y2JpYzdYRzRnSUNBZ2ZWeHVYRzRnSUgwcE8xeHVYRzRnSUhKbGRIVnliaUJ5WlhOMWJIUTdYRzU5WEc1Y2JseHVMeThnUW5WcGJHUnpJR0Z1SUVGemMwVnljbTl5SUdadmNpQjBhR1VnWTNWeWNtVnVkQ0JsZUhCeVpYTnphVzl1TGlCSmRDQnRZV3RsY3lCaElHTnZkWEJzWlNCdlpseHVMeThnWVhOemRXMXdkR2x2Ym5Nc0lHWnZjaUJwYm5OMFlXNWpaU0IwYUdVZ0xsOWZiMlptYzJWMFgxOGdiWFZ6ZENCaVpTQndiR0ZqWldRZ2FuVnpkQ0JoWm5SbGNpQjBhR1ZjYmk4dklHVjRjR1ZqZEdGMGFXOXVJSFJvWVhRZ2NISnZaSFZqWldRZ2RHaGxJR1poYVd4MWNtVWdiMllnZEdobElHTm9ZV2x1TGx4dWNISnZkRzh1WW5WcGJHUkZjbkp2Y2lBOUlHWjFibU4wYVc5dUlDaHlaWE52YkhabFpDd2djM05tS1NCN1hHNWNiaUFnZG1GeUlHVnljbTl5SUQwZ2RHaHBjeTVmWDJSbGMyTnlhWEIwYVc5dVgxOGdLeUFuWEZ4dVhGeHVKenRjYmx4dUlDQmxlSEFnUFNCeVpYTnZiSFpsWkZzZ2NtVnpiMngyWldRdWJHVnVaM1JvSUMwZ01TQmRPMXh1SUNCbGNuSnZjaUFyUFNCa2RXMXdRMmhoYVc0b2NtVnpiMngyWldRcE8xeHVYRzRnSUdsbUlDZ2hkWFJwYkM1a2IwTnZiRzl5Y3lncEtTQjdYRzRnSUNBZ1pYSnliM0lnUFNCMWRHbHNMblZ1WVc1emFTaGxjbkp2Y2lrN1hHNGdJSDFjYmx4dUlDQXZMeUJVVDBSUE9pQnphRzkzUkdsbVppQnphRzkxYkdRZ1ltVWdkWE5sWkNCdmJteDVJSGRvWlc0Z2FYUWdiV0ZyWlhNZ2MyVnVjMlVnY0dWeWFHRndjMXh1SUNBdkx5QWdJQ0FnSUNCM1pTQmpZVzRnY0dGemN5QnVkV3hzTDNWdVpHVm1hVzVsWkNCaGJtUWdiR1YwSUVGemMwVnljbTl5SUdSbGRHVmpkQ0IzYUdWdUlHbDBYRzRnSUM4dklDQWdJQ0FnSUcxaGEyVnpJSE5sYm5ObExseHVYRzRnSUhaaGNpQmxlSEJsWTNSbFpDQTlJR1Y0Y0M1bGVIQmxZM1JsWkR0Y2JpQWdMeThnVFc5amFHRWdkMmxzYkNCMGNua2dkRzhnYW5OdmJtbG1lU0IwYUdVZ1pYaHdaV04wWldRZ2RtRnNkV1VzSUdwMWMzUWdhV2R1YjNKbElHbG1JR2wwSjNNZ1lTQm1kVzVqZEdsdmJseHVJQ0JwWmlBb2RIbHdaVzltSUdWNGNHVmpkR1ZrSUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdaWGh3WldOMFpXUWdQU0J1ZFd4c08xeHVJQ0I5WEc1Y2JpQWdkbUZ5SUdsdWMzUWdQU0J1WlhjZ1FYTnpSWEp5YjNJb1pYSnliM0lzSUhOelppQjhmQ0JoY21kMWJXVnVkSE11WTJGc2JHVmxJSHg4SUhCeWIzUnZMbUoxYVd4a1JYSnliM0lwTzF4dUlDQnBibk4wTG5Ob2IzZEVhV1ptSUQwZ1ptRnNjMlU3WEc0Z0lHbHVjM1F1WVdOMGRXRnNJRDBnYm5Wc2JEdGNiaUFnYVc1emRDNWxlSEJsWTNSbFpDQTlJRzUxYkd3N1hHNGdJSEpsZEhWeWJpQnBibk4wTzF4dWZUdGNibHh1THk4Z1VtVnpiMngyWlhNZ2RHaGxJR04xY25KbGJuUWdZMmhoYVc0Z1ptOXlJR0VnWjJsMlpXNGdkbUZzZFdVdUlGUm9aU0J5WlhOMWJIUWdhWE1nWVd4M1lYbHpJR0ZjYmk4dklHSnZiMnhsWVc0Z2FXNWthV05oZEdsdVp5QjBhR1VnYjNWMFkyOXRaU0J2Y2lCaGJpQjFibVJsWm1sdVpXUWdkRzhnYzJsbmJtRnNJSFJvWVhRZ2FYUWdjbVZoWTJobFpGeHVMeThnWVc0Z1lYTjVibU5vY205dWIzVnpJR1pzYjNjdVhHNXdjbTkwYnk1MFpYTjBJRDBnWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQnBaaUFvWVhKbmRXMWxiblJ6TG14bGJtZDBhQ0E5UFQwZ01Da2dlMXh1SUNBZ0lHRmpkSFZoYkNBOUlIUm9hWE11ZG1Gc2RXVTdYRzRnSUgxY2JseHVJQ0F2THlCU1pYTnZiSFpsSUhSb1pTQmphR0ZwYmlCemRHRnlkR2x1WnlCbWNtOXRJSEp2YjNSY2JpQWdkbUZ5SUhKbGMyOXNkbVZ5SUQwZ2NtVnpiMngyWlhKekxtRmpjWFZwY21Vb2RHaHBjeWs3WEc0Z0lIWmhjaUJ5WlhOMWJIUWdQU0J5WlhOdmJIWmxjaWhoWTNSMVlXd3BPMXh1WEc0Z0lISmxkSFZ5YmlCeVpYTjFiSFE3WEc1OU8xeHVYRzR2THlCUVpYSm1iM0p0Y3lCMGFHVWdjbVZ6YjJ4MWRHbHZiaUJ2WmlCMGFHVWdZMmhoYVc0Z1luVjBJR0ZrWkdsMGFXOXVZV3hzZVNCM2FXeHNJSEpoYVhObElHRnVJR1Z5Y205eVhHNHZMeUJwWmlCcGRDQm1ZV2xzY3lCMGJ5QmpiMjF3YkdWMFpTNGdWMmhsYmlCMGFHVWdaWGh3Y21WemMybHZiaUJ5WlhOdmJIWmxjeUJoY3lCMWJtUmxabWx1WldRZ0tHRnplVzVqS1Z4dUx5OGdhWFFuYkd3Z1ltVWdZWFYwYjIxaGRHbGpZV3hzZVNCbGJtRmliR1VnYVhSeklHUmxabVZ5Y21Wa0lHWnNZV2N1WEc0dkx5QlVhR1VnWUhOelptQWdjM1JoYm1SeklHWnZjaUJUZEdGamExUnlZV05sUm5WdVkzUnBiMjRzSUdFZ2NtVm1aWEpsYm1ObElIUnZJSFJvWlNCbWFYSnpkQ0JtZFc1amRHbHZibHh1THk4Z2RHOGdjMmh2ZHlCdmJpQjBhR1VnYzNSaFkyc2dkSEpoWTJVdVhHNXdjbTkwYnk1aGMzTmxjblFnUFNCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCemMyWXBJSHRjYmlBZ2FXWWdLR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dQVDA5SURBcElIdGNiaUFnSUNCaFkzUjFZV3dnUFNCMGFHbHpMblpoYkhWbE8xeHVJQ0I5WEc1Y2JpQWdMeThnU25WemRDQnBaMjV2Y21VZ2FXWWdkR2hsSUdGamRIVmhiQ0IyWVd4MVpTQnBjeUJ1YjNRZ2NISmxjMlZ1ZENCNVpYUmNiaUFnTHk4Z1ZFOUVUem9nVTJoaGJHd2dhWFFnY0hKdlpIVmpaU0JoYmlCbGNuSnZjajljYmlBZ2FXWWdLR0ZqZEhWaGJDQTlQVDBnZEdocGN5NWZYMGRWUVZKRVgxOHBJSEpsZEhWeWJpQjBhR2x6TzF4dVhHNGdJSFpoY2lCeVpYTnZiSFpsY2lBOUlISmxjMjlzZG1WeWN5NWhZM0YxYVhKbEtIUm9hWE1wTzF4dUlDQjJZWElnY21WemRXeDBJRDBnY21WemIyeDJaWElvWVdOMGRXRnNLVHRjYmx4dUlDQXZMeUJKZENCbVlXbHNaV1FnYzI4Z2NtVndiM0owSUdsMElIZHBkR2dnWVNCdWFXTmxJR1Z5Y205eVhHNGdJR2xtSUNoeVpYTjFiSFFnUFQwOUlHWmhiSE5sS1NCN1hHNGdJQ0FnZEdoeWIzY2dkR2hwY3k1aWRXbHNaRVZ5Y205eUtISmxjMjlzZG1WeUxuSmxjMjlzZG1Wa0xDQnpjMllnZkh3Z2RHaHBjeTVoYzNObGNuUXBPMXh1SUNCOVhHNWNiaUFnTHk4Z1EyOXVkbVZ5ZENCMGFHVWdaWGh3Y21WemMybHZiaUJwYm5SdklHRWdaR1ZtWlhKeVpXUWdhV1lnWVc0Z1lYTjVibU1nWlhod1pXTjBhVzl1SUhkaGN5Qm1iM1Z1WkZ4dUlDQnBaaUFvY21WemRXeDBJRDA5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNCMGFHbHpMbDlmWkdWbVpYSnlaV1JmWHlBOUlIUnlkV1U3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnZEdocGN6dGNibjA3WEc1Y2JpOHZJRUZ6YzJWeWRITWdkR2hsSUhCeWIzWnBaR1ZrSUhaaGJIVmxJR0Z1WkNCcFppQnpkV05qWlhOelpuVnNJSEpsZEhWeWJuTWdkR2hsSUc5eWFXZHBibUZzWEc0dkx5QjJZV3gxWlNCcGJuTjBaV0ZrSUc5bUlIUm9aU0JqYUdGcGJpQnBibk4wWVc1alpTNWNibkJ5YjNSdkxuUm9jbTkxWjJnZ1BTQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUhSb2FYTXVZWE56WlhKMEtHRmpkSFZoYkN3Z2NISnZkRzh1ZEdoeWIzVm5hQ2s3WEc0Z0lISmxkSFZ5YmlCaFkzUjFZV3c3WEc1OU8xeHVYRzR2THlCRmRtRnNkV0YwWlhNZ2RHaGxJR1Y0Y0hKbGMzTnBiMjRnWTJoaGFXNGdjbVZ3YjNKMGFXNW5JSFJvWlNCc1lYTjBJRzExZEdGMFpXUWdkbUZzZFdVZ2MyVmxiaUJwYmx4dUx5OGdhWFF1SUVsbUlIUm9aU0JsZUhCeVpYTnphVzl1SUdSdlpYTWdibTkwSUdOdmJYQnNaWFJsSUdsMEoyeHNJSEpsZEhWeWJpQjFibVJsWm1sdVpXUXVYRzV3Y205MGJ5NXlaWE4xYkhRZ1BTQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUhaaGNpQnlaWE4xYkhRN1hHNWNiaUFnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BUMDlJREFwSUh0Y2JpQWdJQ0JoWTNSMVlXd2dQU0IwYUdsekxuWmhiSFZsTzF4dUlDQjlYRzVjYmlBZ2RISjVJSHRjYmlBZ0lDQjBhR2x6TG5SaGNDaG1kVzVqZEdsdmJpQW9kbUZzZFdVcElIdGNiaUFnSUNBZ0lISmxjM1ZzZENBOUlIWmhiSFZsTzF4dUlDQWdJSDBwTG5SbGMzUW9ZV04wZFdGc0tUdGNiaUFnZlNCbWFXNWhiR3g1SUh0Y2JpQWdJQ0F2THlCU1pXMXZkbVVnZEdobElDNTBZWEFnWm5KdmJTQjBhR1VnWTJoaGFXNWNiaUFnSUNCMGFHbHpMbDlmWlhod1pXTjBZWFJwYjI1elgxOHVjRzl3S0NrN1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2NtVnpkV3gwTzF4dWZUdGNibHh1UTJoaGFXNHVjSEp2ZEc5MGVYQmxMblpoYkhWbFQyWWdQU0JtZFc1amRHbHZiaUFvS1NCN1hHNGdJSEpsZEhWeWJpQjBhR2x6TG5aaGJIVmxPMXh1ZlR0Y2JseHVRMmhoYVc0dWNISnZkRzkwZVhCbExuUnZVM1J5YVc1bklEMGdablZ1WTNScGIyNGdLQ2tnZTF4dUlDQnBaaUFvZEdocGN5NWZYMlJsYzJOeWFYQjBhVzl1WDE4cElIdGNiaUFnSUNCeVpYUjFjbTRnZEdocGN5NWZYMlJsYzJOeWFYQjBhVzl1WDE4N1hHNGdJSDFjYmx4dUlDQjJZWElnWkdWelkzTWdQVnh1SUNBZ0lIUm9hWE11WDE5bGVIQmxZM1JoZEdsdmJuTmZYMXh1SUNBZ0lDNW1hV3gwWlhJb1puVnVZM1JwYjI0Z0tHTXBJSHNnY21WMGRYSnVJR011WkdWelkzSnBjSFJwYjI0Z2ZTbGNiaUFnSUNBdWJXRndLR1oxYm1OMGFXOXVJQ2hqS1NCN0lISmxkSFZ5YmlCakxtUmxjMk55YVhCMGFXOXVJSDBwTzF4dVhHNGdJR2xtSUNoa1pYTmpjeTVzWlc1bmRHZ2dQaUF4S1NCN1hHNGdJQ0FnY21WMGRYSnVJQ2NvSnlBcklHUmxjMk56TG1wdmFXNG9KeXdnSnlrZ0t5QW5LU2M3WEc0Z0lIMGdaV3h6WlNCcFppQW9aR1Z6WTNNdWJHVnVaM1JvSUQwOVBTQXhLU0I3WEc0Z0lDQWdjbVYwZFhKdUlHUmxjMk56V3pCZE8xeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lISmxkSFZ5YmlBblBFRnpjME5vWVdsdVBpYzdYRzRnSUgxY2JuMDdYRzVjYmx4dWJXOWtkV3hsTG1WNGNHOXlkSE1nUFNCRGFHRnBianRjYmlKZGZRPT0iLCIvLyBBUEkgY29tcGF0aWJsZSB3aXRoIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvYXNzZXJ0aW9uLWVycm9yL1xuLy8gVGhpcyBzaG91bGQgbWFrZSBpbnRlZ3JhdGlvbiB3aXRoIE1vY2hhIHdvcmssIGluY2x1ZGluZyBkaWZmZWRcbi8vIG91dHB1dC5cblxudmFyIEZhaWx1cmUgPSByZXF1aXJlKCdmYWlsdXJlJyk7XG5cbnZhciB1bmFuc2kgPSByZXF1aXJlKCcuL3V0aWwnKS51bmFuc2k7XG5cblxudmFyIEFzc0Vycm9yID0gRmFpbHVyZS5jcmVhdGUoJ0Fzc0Vycm9yJyk7XG52YXIgcHJvdG8gPSBBc3NFcnJvci5wcm90b3R5cGU7XG5cbnByb3RvLnNob3dEaWZmID0gZmFsc2U7XG5wcm90by5hY3R1YWwgPSBudWxsO1xucHJvdG8uZXhwZWN0ZWQgPSBudWxsO1xuXG5mdW5jdGlvbiBnZXRUYXJnZXRMaW5lIChmcmFtZXMpIHtcbiAgZnVuY3Rpb24gZ2V0U3JjIChmcmFtZSkge1xuICAgIHZhciBmbiA9IGZyYW1lLmdldEZ1bmN0aW9uKCk7XG4gICAgcmV0dXJuIGZuID8gZm4udG9TdHJpbmcoKS5yZXBsYWNlKC9cXHMrL2csICcnKSA6IG51bGw7XG4gIH1cblxuICBpZiAoIWZyYW1lcy5sZW5ndGgpIHJldHVybiBudWxsO1xuXG4gIC8vIEZpcnN0IGZyYW1lIGlzIG5vdyB0aGUgdGFyZ2V0XG4gIHZhciB0YXJnZXQgPSBmcmFtZXNbMF07XG4gIHZhciB0YXJnZXRTcmMgPSBnZXRTcmModGFyZ2V0KTtcbiAgaWYgKCF0YXJnZXRTcmMpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEZpbHRlciBvdXQgYWxsIGZyYW1lcyB3aGljaCBhcmUgbm90IGluIHRoZSBzYW1lIGZpbGVcbiAgc2FtZWZpbGUgPSBmcmFtZXMuZmlsdGVyKGZ1bmN0aW9uIChmcmFtZSkge1xuICAgIHJldHVybiBmcmFtZSAmJiBmcmFtZS5nZXRGaWxlTmFtZSgpID09PSB0YXJnZXQuZ2V0RmlsZU5hbWUoKTtcbiAgfSk7XG5cbiAgLy8gR2V0IHRoZSBjbG9zZXN0IGZ1bmN0aW9uIGluIHRoZSBzYW1lIGZpbGUgdGhhdCB3cmFwcyB0aGUgdGFyZ2V0IGZyYW1lXG4gIHZhciB3cmFwcGVyO1xuICBmb3IgKHZhciBpPTE7IGkgPCBzYW1lZmlsZS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzcmMgPSBnZXRTcmMoc2FtZWZpbGVbaV0pO1xuICAgIGlmIChzcmMgJiYgLTEgIT09IHNyYy5pbmRleE9mKHRhcmdldFNyYykpIHtcbiAgICAgIHdyYXBwZXIgPSBzYW1lZmlsZVtpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFdoZW4gYSB3cmFwcGVyIGZ1bmN0aW9uIGlzIGZvdW5kIHdlIGNhbiB1c2UgaXQgdG8gb2J0YWluIHRoZSBsaW5lIHdlIHdhbnRcbiAgaWYgKHdyYXBwZXIpIHtcbiAgICAvLyBHZXQgcmVsYXRpdmUgcG9zaXRpb25zXG4gICAgdmFyIHJlbExuID0gdGFyZ2V0LmdldExpbmVOdW1iZXIoKSAtIHdyYXBwZXIuZ2V0TGluZU51bWJlcigpO1xuICAgIHZhciByZWxDbCA9IHRhcmdldC5nZXRMaW5lTnVtYmVyKCkgPT09IHdyYXBwZXIuZ2V0TGluZU51bWJlcigpXG4gICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICA6IHRhcmdldC5nZXRDb2x1bW5OdW1iZXIoKSAtIDE7XG5cbiAgICB2YXIgbGluZXMgPSB0YXJnZXQuZ2V0RnVuY3Rpb24oKS50b1N0cmluZygpLnNwbGl0KC9cXG4vKTtcbiAgICBpZiAobGluZXNbcmVsTG5dKSB7XG4gICAgICByZXR1cm4gbGluZXNbcmVsTG5dO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5wcm90by50b0pTT04gPSBmdW5jdGlvbiAoc3RhY2spIHtcbiAgdmFyIHByb3BzID0ge1xuICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICBtZXNzYWdlOiB1bmFuc2kodGhpcy5tZXNzYWdlKSxcbiAgICBhY3R1YWw6IHRoaXMuYWN0dWFsLFxuICAgIGV4cGVjdGVkOiB0aGlzLmV4cGVjdGVkLFxuICAgIHNob3dEaWZmOiB0aGlzLnNob3dEaWZmXG4gIH07XG5cbiAgLy8gaW5jbHVkZSBzdGFjayBpZiBleGlzdHMgYW5kIG5vdCB0dXJuZWQgb2ZmXG4gIGlmIChzdGFjayAmJiB0aGlzLnN0YWNrKSB7XG4gICAgcHJvcHMuc3RhY2sgPSB0aGlzLnN0YWNrO1xuICB9XG5cbiAgcmV0dXJuIHByb3BzO1xufTtcblxucHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBtc2cgPSBGYWlsdXJlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRoaXMpO1xuXG4gIHZhciBsaW5lID0gZ2V0VGFyZ2V0TGluZSh0aGlzLmZyYW1lcyk7XG4gIGlmIChsaW5lKSB7XG4gICAgbXNnICs9ICdcXG4gID4+ICcgKyBsaW5lLnJlcGxhY2UoL15cXHMrLywgJycpLnNsaWNlKDAsIDYwKSArICdcXG4nO1xuICB9XG5cbiAgcmV0dXJuIG1zZztcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc0Vycm9yO1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciBNYXRjaGVyID0gcmVxdWlyZSgnLi9tYXRjaGVyJyk7XG5cbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdXRpbCcpLnRlbXBsYXRlO1xuXG5cbi8vIEV4cGVjdGF0aW9uIHJlcHJlc2VudHMgYW4gaW5zdGFudGlhdGVkIE1hdGNoZXIgYWxyZWFkeSBjb25maWd1cmVkIHdpdGhcbi8vIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cy5cbmZ1bmN0aW9uIEV4cGVjdGF0aW9uIChtYXRjaGVyLCBhcmdzKSB7XG4gIC8vIEdldCB0aGUgbWF0Y2hlciBjb25maWd1cmF0aW9uIGludG8gdGhpcyBpbnN0YW5jZVxuICBtYXRjaGVyLmFzc2lnbih0aGlzKTtcblxuICAvLyBTdXBwb3J0IGJlaW5nIGdpdmVuIGFuIGBhcmd1bWVudHNgIG9iamVjdFxuICB0aGlzLmFyZ3MgPSBfLnRvQXJyYXkoYXJncyk7XG4gIHRoaXMuYWN0dWFsID0gdW5kZWZpbmVkO1xufVxuXG4vLyBJbmhlcml0IHRoZSBwcm90b3R5cGUgZnJvbSBNYXRjaGVyXG52YXIgcHJvdG8gPSBFeHBlY3RhdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE1hdGNoZXIucHJvdG90eXBlKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gRXhwZWN0YXRpb247XG5cbi8vIEdlbmVyYXRlIGdldHRlciBmb3IgYC5leHBlY3RlZGAgKGFuIGFsaWFzIGZvciBhcmdzWzBdKVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZXhwZWN0ZWQnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmFyZ3NbMF07XG4gIH0sXG4gIC8vIEhhY2s6IGFsbG93IGl0IHRvIGJlIG92ZXJyaWRlbiBvbiB0aGUgaW5zdGFuY2VcbiAgc2V0OiBmdW5jdGlvbiAodikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZXhwZWN0ZWQnLCB7XG4gICAgICB2YWx1ZTogdlxuICAgIH0pO1xuICB9XG59KTtcblxuLy8gR2VuZXJhdGUgZ2V0dGVycyBmb3IgdGhlIGZpcnN0IDUgYXJndW1lbnRzIGFzIGFyZzEsIGFyZzIsIC4uLlxuXy50aW1lcyg1LCBmdW5jdGlvbiAoaSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdhcmcnICsgKGkgKyAxKSwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuYXJnc1tpXTtcbiAgICB9XG4gIH0pO1xufSk7XG5cbi8vIENvbXB1dGUgdGhlIGRlc2NyaXB0aW9uIG1lc3NhZ2UgZm9yIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBleHBlY3RhdGlvblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCAnZGVzY3JpcHRpb24nLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5kZXNjKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzLmRlc2MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0aGlzLmRlc2ModGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB0ZW1wbGF0ZSh0aGlzLmRlc2MsIHRoaXMpO1xuICB9XG59KTtcblxuLy8gQ29tcHV0ZSB0aGUgZmFpbHVyZSBtZXNzYWdlIGZvciB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZXhwZWN0YXRpb25cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgJ2ZhaWx1cmUnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgdGhpcy5mYWlsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdGhpcy5mYWlsKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcGxhdGUodGhpcy5mYWlsLCB0aGlzKTtcbiAgfVxufSk7XG5cbi8vIEhlbHBlciB0byBtdXRhdGUgdGhlIHZhbHVlIHVuZGVyIHRlc3RcbkV4cGVjdGF0aW9uLnByb3RvdHlwZS5tdXRhdGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgIHJldHVybiByZXNvbHZlcih2YWx1ZSk7XG4gIH07XG59O1xuXG4vLyBSZXNvbHZpbmcgY2FuIG92ZXJyaWRlIHRoZSBleHBlY3RhdGlvbiBzdGF0ZSwgaWYgdGhhdCdzIG5vdCBkZXNpcmFibGUgbWFrZVxuLy8gc3VyZSB0aGF0IHRoaXMgbWV0aG9kIGlzIGNhbGxlZCBpbiBhIG5ldyBjb250ZXh0LlxuRXhwZWN0YXRpb24ucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhcmdzLCByZXN1bHQ7XG5cbiAgLy8gRXhlY3V0ZSB0aGUgbWF0Y2hlciB0ZXN0IG5vdyB0aGF0IGV2ZXJ5dGhpbmcgaXMgc2V0XG4gIGFyZ3MgPSBbdGhpcy5hY3R1YWxdLmNvbmNhdCh0aGlzLmFyZ3MpO1xuICByZXN1bHQgPSB0aGlzLnRlc3QuYXBwbHkodGhpcywgYXJncyk7XG5cbiAgLy8gUmV0dXJuaW5nIGEgc3RyaW5nIG92ZXJyaWRlcyB0aGUgbWlzbWF0Y2ggZGVzY3JpcHRpb25cbiAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5mYWlsID0gcmVzdWx0O1xuICAgIHJlc3VsdCA9IGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbkV4cGVjdGF0aW9uLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZGVzY3JpcHRpb247XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gRXhwZWN0YXRpb247XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOWxlSEJsWTNSaGRHbHZiaTVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pTzBGQlFVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRWlMQ0ptYVd4bElqb2laMlZ1WlhKaGRHVmtMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiSW5aaGNpQmZJRDBnS0hSNWNHVnZaaUIzYVc1a2IzY2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUIzYVc1a2IzY3VYeUE2SUhSNWNHVnZaaUJuYkc5aVlXd2dJVDA5SUZ3aWRXNWtaV1pwYm1Wa1hDSWdQeUJuYkc5aVlXd3VYeUE2SUc1MWJHd3BPMXh1WEc1MllYSWdRMmhoYVc0Z1BTQnlaWEYxYVhKbEtDY3VMMk5vWVdsdUp5azdYRzUyWVhJZ1RXRjBZMmhsY2lBOUlISmxjWFZwY21Vb0p5NHZiV0YwWTJobGNpY3BPMXh1WEc1MllYSWdkR1Z0Y0d4aGRHVWdQU0J5WlhGMWFYSmxLQ2N1TDNWMGFXd25LUzUwWlcxd2JHRjBaVHRjYmx4dVhHNHZMeUJGZUhCbFkzUmhkR2x2YmlCeVpYQnlaWE5sYm5SeklHRnVJR2x1YzNSaGJuUnBZWFJsWkNCTllYUmphR1Z5SUdGc2NtVmhaSGtnWTI5dVptbG5kWEpsWkNCM2FYUm9YRzR2THlCaGJua2dZV1JrYVhScGIyNWhiQ0JoY21kMWJXVnVkSE11WEc1bWRXNWpkR2x2YmlCRmVIQmxZM1JoZEdsdmJpQW9iV0YwWTJobGNpd2dZWEpuY3lrZ2UxeHVJQ0F2THlCSFpYUWdkR2hsSUcxaGRHTm9aWElnWTI5dVptbG5kWEpoZEdsdmJpQnBiblJ2SUhSb2FYTWdhVzV6ZEdGdVkyVmNiaUFnYldGMFkyaGxjaTVoYzNOcFoyNG9kR2hwY3lrN1hHNWNiaUFnTHk4Z1UzVndjRzl5ZENCaVpXbHVaeUJuYVhabGJpQmhiaUJnWVhKbmRXMWxiblJ6WUNCdlltcGxZM1JjYmlBZ2RHaHBjeTVoY21keklEMGdYeTUwYjBGeWNtRjVLR0Z5WjNNcE8xeHVJQ0IwYUdsekxtRmpkSFZoYkNBOUlIVnVaR1ZtYVc1bFpEdGNibjFjYmx4dUx5OGdTVzVvWlhKcGRDQjBhR1VnY0hKdmRHOTBlWEJsSUdaeWIyMGdUV0YwWTJobGNseHVkbUZ5SUhCeWIzUnZJRDBnUlhod1pXTjBZWFJwYjI0dWNISnZkRzkwZVhCbElEMGdUMkpxWldOMExtTnlaV0YwWlNoTllYUmphR1Z5TG5CeWIzUnZkSGx3WlNrN1hHNXdjbTkwYnk1amIyNXpkSEoxWTNSdmNpQTlJRVY0Y0dWamRHRjBhVzl1TzF4dVhHNHZMeUJIWlc1bGNtRjBaU0JuWlhSMFpYSWdabTl5SUdBdVpYaHdaV04wWldSZ0lDaGhiaUJoYkdsaGN5Qm1iM0lnWVhKbmMxc3dYU2xjYms5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaHdjbTkwYnl3Z0oyVjRjR1ZqZEdWa0p5d2dlMXh1SUNCblpYUTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1aGNtZHpXekJkTzF4dUlDQjlMRnh1SUNBdkx5QklZV05yT2lCaGJHeHZkeUJwZENCMGJ5QmlaU0J2ZG1WeWNtbGtaVzRnYjI0Z2RHaGxJR2x1YzNSaGJtTmxYRzRnSUhObGREb2dablZ1WTNScGIyNGdLSFlwSUh0Y2JpQWdJQ0JQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb2RHaHBjeXdnSjJWNGNHVmpkR1ZrSnl3Z2UxeHVJQ0FnSUNBZ2RtRnNkV1U2SUhaY2JpQWdJQ0I5S1R0Y2JpQWdmVnh1ZlNrN1hHNWNiaTh2SUVkbGJtVnlZWFJsSUdkbGRIUmxjbk1nWm05eUlIUm9aU0JtYVhKemRDQTFJR0Z5WjNWdFpXNTBjeUJoY3lCaGNtY3hMQ0JoY21jeUxDQXVMaTVjYmw4dWRHbHRaWE1vTlN3Z1puVnVZM1JwYjI0Z0tHa3BJSHRjYmlBZ1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLSEJ5YjNSdkxDQW5ZWEpuSnlBcklDaHBJQ3NnTVNrc0lIdGNiaUFnSUNCblpYUTZJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtRnlaM05iYVYwN1hHNGdJQ0FnZlZ4dUlDQjlLVHRjYm4wcE8xeHVYRzR2THlCRGIyMXdkWFJsSUhSb1pTQmtaWE5qY21sd2RHbHZiaUJ0WlhOellXZGxJR1p2Y2lCMGFHVWdZM1Z5Y21WdWRDQnpkR0YwWlNCdlppQjBhR1VnWlhod1pXTjBZWFJwYjI1Y2JrOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBlU2h3Y205MGJ5d2dKMlJsYzJOeWFYQjBhVzl1Snl3Z2UxeHVJQ0JuWlhRNklHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQnBaaUFvSVhSb2FYTXVaR1Z6WXlrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUc1MWJHdzdYRzRnSUNBZ2ZWeHVJQ0FnSUdsbUlDaDBlWEJsYjJZZ2RHaHBjeTVrWlhOaklEMDlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NWtaWE5qS0hSb2FYTXBPMXh1SUNBZ0lIMWNiaUFnSUNCeVpYUjFjbTRnZEdWdGNHeGhkR1VvZEdocGN5NWtaWE5qTENCMGFHbHpLVHRjYmlBZ2ZWeHVmU2s3WEc1Y2JpOHZJRU52YlhCMWRHVWdkR2hsSUdaaGFXeDFjbVVnYldWemMyRm5aU0JtYjNJZ2RHaGxJR04xY25KbGJuUWdjM1JoZEdVZ2IyWWdkR2hsSUdWNGNHVmpkR0YwYVc5dVhHNVBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvY0hKdmRHOHNJQ2RtWVdsc2RYSmxKeXdnZTF4dUlDQm5aWFE2SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnSUNCcFppQW9kSGx3Wlc5bUlIUm9hWE11Wm1GcGJDQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXVabUZwYkNoMGFHbHpLVHRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUhSbGJYQnNZWFJsS0hSb2FYTXVabUZwYkN3Z2RHaHBjeWs3WEc0Z0lIMWNibjBwTzF4dVhHNHZMeUJJWld4d1pYSWdkRzhnYlhWMFlYUmxJSFJvWlNCMllXeDFaU0IxYm1SbGNpQjBaWE4wWEc1RmVIQmxZM1JoZEdsdmJpNXdjbTkwYjNSNWNHVXViWFYwWVhSbElEMGdablZ1WTNScGIyNGdLSFpoYkhWbEtTQjdYRzRnSUhKbGRIVnliaUJtZFc1amRHbHZiaUFvY21WemIyeDJaWElwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSW9kbUZzZFdVcE8xeHVJQ0I5TzF4dWZUdGNibHh1THk4Z1VtVnpiMngyYVc1bklHTmhiaUJ2ZG1WeWNtbGtaU0IwYUdVZ1pYaHdaV04wWVhScGIyNGdjM1JoZEdVc0lHbG1JSFJvWVhRbmN5QnViM1FnWkdWemFYSmhZbXhsSUcxaGEyVmNiaTh2SUhOMWNtVWdkR2hoZENCMGFHbHpJRzFsZEdodlpDQnBjeUJqWVd4c1pXUWdhVzRnWVNCdVpYY2dZMjl1ZEdWNGRDNWNia1Y0Y0dWamRHRjBhVzl1TG5CeWIzUnZkSGx3WlM1eVpYTnZiSFpsSUQwZ1puVnVZM1JwYjI0Z0tDa2dlMXh1SUNCMllYSWdZWEpuY3l3Z2NtVnpkV3gwTzF4dVhHNGdJQzh2SUVWNFpXTjFkR1VnZEdobElHMWhkR05vWlhJZ2RHVnpkQ0J1YjNjZ2RHaGhkQ0JsZG1WeWVYUm9hVzVuSUdseklITmxkRnh1SUNCaGNtZHpJRDBnVzNSb2FYTXVZV04wZFdGc1hTNWpiMjVqWVhRb2RHaHBjeTVoY21kektUdGNiaUFnY21WemRXeDBJRDBnZEdocGN5NTBaWE4wTG1Gd2NHeDVLSFJvYVhNc0lHRnlaM01wTzF4dVhHNGdJQzh2SUZKbGRIVnlibWx1WnlCaElITjBjbWx1WnlCdmRtVnljbWxrWlhNZ2RHaGxJRzFwYzIxaGRHTm9JR1JsYzJOeWFYQjBhVzl1WEc0Z0lHbG1JQ2gwZVhCbGIyWWdjbVZ6ZFd4MElEMDlQU0FuYzNSeWFXNW5KeWtnZTF4dUlDQWdJSFJvYVhNdVptRnBiQ0E5SUhKbGMzVnNkRHRjYmlBZ0lDQnlaWE4xYkhRZ1BTQm1ZV3h6WlR0Y2JpQWdmVnh1WEc0Z0lISmxkSFZ5YmlCeVpYTjFiSFE3WEc1OU8xeHVYRzVGZUhCbFkzUmhkR2x2Ymk1d2NtOTBiM1I1Y0dVdWRHOVRkSEpwYm1jZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lISmxkSFZ5YmlCMGFHbHpMbVJsYzJOeWFYQjBhVzl1TzF4dWZUdGNibHh1WEc1dGIyUjFiR1V1Wlhod2IzSjBjeUE5SUVWNGNHVmpkR0YwYVc5dU8xeHVJbDE5IiwiLy8gVGhlIE1hdGNoZXIgb2JqZWN0IGlzIGEgZGVzY3JpcHRvciBmb3IgdGhlIG1hdGNoaW5nIGxvZ2ljIGJ1dCBjYW5ub3Rcbi8vIGJlIHVzZWQgZGlyZWN0bHkuIFVzZSBhbiBFeHBlY3RhdGlvbiB0byBnZXQgYW4gaW5pdGlhbGl6ZWQgbWF0Y2hlci5cbmZ1bmN0aW9uIE1hdGNoZXIgKG5hbWUsIGRlc2NyaXB0b3IpIHtcblxuICAvLyBTaG9ydGN1dCBmb3Igc2ltcGxlIHRlc3QgZnVuY3Rpb25zXG4gIGlmICh0eXBlb2YgZGVzY3JpcHRvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGRlc2NyaXB0b3IgPSB7dGVzdDogZGVzY3JpcHRvcn07XG4gIH1cblxuICAvLyBUaGUgZ2VuZXJpYyBuYW1lIG9mIHRoZSBtYXRjaGVyXG4gIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoZGVzY3JpcHRvci5oZWxwKSkge1xuICAgIHRoaXMuaGVscCA9IGRlc2NyaXB0b3IuaGVscC5qb2luKCdcXG4nKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmhlbHAgPSBkZXNjcmlwdG9yLmhlbHAgfHwgJ05vdCBhdmFpbGFibGUnO1xuICB9XG5cbiAgLy8gRWl0aGVyIGEgdGVtcGxhdGUgc3RyaW5nIG9yIGEgZnVuY3Rpb24gdGhhdCB3aWxsIHJlY2VpdmUgYXMgb25seVxuICAvLyBhcmd1bWVudCBhbiBFeHBlY3RhdGlvbiBpbnN0YW5jZSAoY2FsbGVkIGFzIGEgbWV0aG9kIG9mIGl0KS5cbiAgdGhpcy5kZXNjID0gZGVzY3JpcHRvci5kZXNjICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gZGVzY3JpcHRvci5kZXNjXG4gICAgICAgICAgICA6IHRoaXMubmFtZTtcblxuICAvLyBFaXRoZXIgYSB0ZW1wbGF0ZSBzdHJpbmcgb3IgYSBmdW5jdGlvbiB0aGF0IHdpbGwgcmVjZWl2ZSBhcyBvbmx5XG4gIC8vIGFyZ3VtZW50IGFuIEV4cGVjdGF0aW9uIGluc3RhbmNlIChjYWxsZWQgYXMgYSBtZXRob2Qgb2YgaXQpLlxuICB0aGlzLmZhaWwgPSBkZXNjcmlwdG9yLmZhaWwgfHwgJ3dhcyB7eyBhY3R1YWwgfX0nO1xuXG4gIGlmICghZGVzY3JpcHRvci50ZXN0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0ZXN0IGZ1bmN0aW9uIG5vdCBkZWZpbmVkIGZvciB0aGUgbWF0Y2hlcicpO1xuICB9XG4gIHRoaXMudGVzdCA9IGRlc2NyaXB0b3IudGVzdDtcblxuICB0aGlzLmFyaXR5ID0gZGVzY3JpcHRvci5hcml0eSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgPyBkZXNjcmlwdG9yLmFyaXR5XG4gICAgICAgICAgICAgOiB0aGlzLnRlc3QubGVuZ3RoO1xufVxuXG5NYXRjaGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5NYXRjaGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1hdGNoZXI7XG5cbk1hdGNoZXIucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IodGhpcy5uYW1lLCB7XG4gICAgaGVscDogdGhpcy5oZWxwLFxuICAgIGRlc2M6IHRoaXMuZGVzYyxcbiAgICBmYWlsOiB0aGlzLmZhaWwsXG4gICAgdGVzdDogdGhpcy50ZXN0LFxuICAgIGFyaXR5OiB0aGlzLmFyaXR5XG4gIH0pO1xufTtcblxuLy8gQXVnbWVudCBhbm90aGVyIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIG9mIHRoaXMgbWF0Y2hlclxuTWF0Y2hlci5wcm90b3R5cGUuYXNzaWduID0gZnVuY3Rpb24gKG9iaikge1xuICBvYmouaGVscCA9IHRoaXMuaGVscDtcbiAgb2JqLmRlc2MgPSB0aGlzLmRlc2M7XG4gIG9iai5mYWlsID0gdGhpcy5mYWlsO1xuICBvYmoudGVzdCA9IHRoaXMudGVzdDtcbiAgb2JqLmFyaXR5ID0gdGhpcy5hcml0eTtcbn07XG5cbk1hdGNoZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gJzxBc3MuTWF0Y2hlciAnICsgdGhpcy5uYW1lICsgJz4nO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGNoZXI7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIGFzcyA9IHJlcXVpcmUoJy4uL2FzcycpO1xuXG4vLyBHaXZlbiB0aGUgYXJndW1lbnRzIHdpdGggdGhlIGJyYW5jaGVzIG1ha2Ugc3VyZSB0aGV5IGFyZSBhbGwgZXhwcmVzc2lvbnNcbmZ1bmN0aW9uIHdyYXBBcmdzIChhcmdzKSB7XG4gIHJldHVybiBfLnRvQXJyYXkoYXJncykuc2xpY2UoMSkubWFwKGZ1bmN0aW9uIChicmFuY2gpIHtcbiAgICByZXR1cm4gYXNzLkNoYWluLmlzQ2hhaW4oYnJhbmNoKSA/IGJyYW5jaCA6IGFzcy5lcWwoYnJhbmNoKTtcbiAgfSk7XG59XG5cbmFzcy5yZWdpc3Rlcih7XG5cbiAgYW5kOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgZXhwcmVzc2lvbnMsIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhbGwgdGhlIGV4cHJlc3Npb25zIHRoYXQgZm9ybSBpdCBkbyBpbmRlZWQgc3VjY2VlZC4nLFxuICAgICAgJ05vdGU6IGV2YWx1YXRpb24gd2lsbCBzdG9wIGFzIHNvb24gYXMgb25lIG9mIHRoZSBleHByZXNzaW9ucyBmYWlscy4nXG4gICAgXSxcbiAgICBkZXNjOiAnJHsgYXJncy5qb2luKFwiIEFORCBcIikgfScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IHdyYXBBcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgcmVzdWx0ID0gXy5ldmVyeShicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSwgXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsIGZhbHNlKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIGtlZXAgaXRlcmF0aW5nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhcnRpYWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGFrZSBjYXJlIG9mIGFueSBleHBlY3RhdGlvbnMgbGF0ZXIgaW4gdGhlIGNoYWluXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICByZXN1bHQgPSByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuICBvcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdDb21wb3NlcyBhIG5ldyBleHBlY3RhdGlvbiBmcm9tIHR3byBvciBtb3JlIGV4cHJlc3Npb25zLCB3aGljaCB3aWxsIG9ubHknLFxuICAgICAgJ3N1Y2NlZWQgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBleHByZXNzaW9ucyBkb2VzLicsXG4gICAgICAnTm90ZTogZXZhbHVhdGlvbiB3aWxsIHN0b3AgYXMgc29vbiBhcyBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIHN1Y2NlZWRzLidcbiAgICBdLFxuICAgIGRlc2M6ICckeyBhcmdzLmpvaW4oXCIgT1IgXCIpIH0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBicmFuY2gxLCBicmFuY2gyKSB7XG4gICAgICB2YXIgYnJhbmNoZXMgPSB3cmFwQXJncyhhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBDaGVjayBpZiBhbGwgYnJhbmNoZXMgcGFzcyB0aGUgdGVzdFxuICAgICAgICB2YXIgdW5kZWZzID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdCA9IF8uc29tZShicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsKTtcbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICB1bmRlZnMgLT0gMTtcbiAgICAgICAgICAgICAgaWYgKDAgPT09IHVuZGVmcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBrZWVwIGl0ZXJhdGluZ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXJ0aWFsO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRha2UgY2FyZSBvZiBhbnkgZXhwZWN0YXRpb25zIGxhdGVyIGluIHRoZSBjaGFpblxuICAgICAgICBpZiAocmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gcmVzb2x2ZXIoYWN0dWFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcbiAgeG9yOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0NvbXBvc2VzIGEgbmV3IGV4cGVjdGF0aW9uIGZyb20gdHdvIG9yIG1vcmUgZXhwcmVzc2lvbnMsIHdoaWNoIHdpbGwgb25seScsXG4gICAgICAnc3VjY2VlZCBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGV4cHJlc3Npb25zIGRvZXMgYnV0IG5vdCBhbGwgb2YgdGhlbS4nXG4gICAgXSxcbiAgICBkZXNjOiAnJHsgYXJncy5qb2luKFwiIFhPUiBcIikgfScsXG4gICAgZmFpbDogJ3dhcyB7eyBhY3R1YWwgfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGJyYW5jaDEsIGJyYW5jaDIpIHtcbiAgICAgIHZhciBicmFuY2hlcyA9IHdyYXBBcmdzKGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBicmFuY2hlcyBwYXNzIHRoZSB0ZXN0XG4gICAgICAgIHZhciB1bmRlZnMgPSAwO1xuICAgICAgICB2YXIgb2tzID0gMDtcbiAgICAgICAgdmFyIGtvcyA9IDA7XG4gICAgICAgIF8uZm9yRWFjaChicmFuY2hlcywgZnVuY3Rpb24gKGJyYW5jaCkge1xuICAgICAgICAgIHZhciBwYXJ0aWFsID0gYnJhbmNoLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlc29sdmVyLnBhdXNlZCkge1xuICAgICAgICAgICAgICByZXNvbHZlci5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kZWZzICs9IDE7XG4gICAgICAgICAgICBicmFuY2gudGhlbihfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAoa29zID4gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBva3MgKz0gMTtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsLCBva3MgPiAwICYmIGtvcyA+IDAgPyB1bmRlZmluZWQgOiBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLCBfLm9uY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAob2tzID4gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZShhY3R1YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBrb3MgKz0gMTtcbiAgICAgICAgICAgICAgdW5kZWZzIC09IDE7XG4gICAgICAgICAgICAgIGlmICgwID09PSB1bmRlZnMpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlci5yZXN1bWUoYWN0dWFsLCBva3MgPiAwICYmIGtvcyA+IDAgPyB1bmRlZmluZWQgOiBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIH0gZWxzZSBpZiAocGFydGlhbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgb2tzICs9IDE7XG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0aWFsID09PSBmYWxzZSkge1xuICAgICAgICAgICAga29zICs9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZXIucGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBva3MgPiAwICYmIGtvcyA+IDAgPyByZXNvbHZlcihhY3R1YWwpIDogZmFsc2U7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG59KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbXhwWWk5dFlYUmphR1Z5Y3k5amIyOXlaR2x1WVhScGIyNHVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFaUxDSm1hV3hsSWpvaVoyVnVaWEpoZEdWa0xtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJblpoY2lCZklEMGdLSFI1Y0dWdlppQjNhVzVrYjNjZ0lUMDlJRndpZFc1a1pXWnBibVZrWENJZ1B5QjNhVzVrYjNjdVh5QTZJSFI1Y0dWdlppQm5iRzlpWVd3Z0lUMDlJRndpZFc1a1pXWnBibVZrWENJZ1B5Qm5iRzlpWVd3dVh5QTZJRzUxYkd3cE8xeHVYRzUyWVhJZ1lYTnpJRDBnY21WeGRXbHlaU2duTGk0dllYTnpKeWs3WEc1Y2JpOHZJRWRwZG1WdUlIUm9aU0JoY21kMWJXVnVkSE1nZDJsMGFDQjBhR1VnWW5KaGJtTm9aWE1nYldGclpTQnpkWEpsSUhSb1pYa2dZWEpsSUdGc2JDQmxlSEJ5WlhOemFXOXVjMXh1Wm5WdVkzUnBiMjRnZDNKaGNFRnlaM01nS0dGeVozTXBJSHRjYmlBZ2NtVjBkWEp1SUY4dWRHOUJjbkpoZVNoaGNtZHpLUzV6YkdsalpTZ3hLUzV0WVhBb1puVnVZM1JwYjI0Z0tHSnlZVzVqYUNrZ2UxeHVJQ0FnSUhKbGRIVnliaUJoYzNNdVEyaGhhVzR1YVhORGFHRnBiaWhpY21GdVkyZ3BJRDhnWW5KaGJtTm9JRG9nWVhOekxtVnhiQ2hpY21GdVkyZ3BPMXh1SUNCOUtUdGNibjFjYmx4dVlYTnpMbkpsWjJsemRHVnlLSHRjYmx4dUlDQmhibVE2SUh0Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5RMjl0Y0c5elpYTWdZU0J1WlhjZ1pYaHdaV04wWVhScGIyNGdabkp2YlNCMGQyOGdiM0lnYlc5eVpTQmxlSEJ5WlhOemFXOXVjeXdnZDJocFkyZ2dkMmxzYkNCdmJteDVKeXhjYmlBZ0lDQWdJQ2R6ZFdOalpXVmtJR2xtSUdGc2JDQjBhR1VnWlhod2NtVnpjMmx2Ym5NZ2RHaGhkQ0JtYjNKdElHbDBJR1J2SUdsdVpHVmxaQ0J6ZFdOalpXVmtMaWNzWEc0Z0lDQWdJQ0FuVG05MFpUb2daWFpoYkhWaGRHbHZiaUIzYVd4c0lITjBiM0FnWVhNZ2MyOXZiaUJoY3lCdmJtVWdiMllnZEdobElHVjRjSEpsYzNOcGIyNXpJR1poYVd4ekxpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2NrZXlCaGNtZHpMbXB2YVc0b1hDSWdRVTVFSUZ3aUtTQjlKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJSHQ3SUdGamRIVmhiQ0I5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2dZbkpoYm1Ob01Td2dZbkpoYm1Ob01pa2dlMXh1SUNBZ0lDQWdkbUZ5SUdKeVlXNWphR1Z6SUQwZ2QzSmhjRUZ5WjNNb1lYSm5kVzFsYm5SektUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNBZ0lDQWdMeThnUTJobFkyc2dhV1lnWVd4c0lHSnlZVzVqYUdWeklIQmhjM01nZEdobElIUmxjM1JjYmlBZ0lDQWdJQ0FnZG1GeUlIVnVaR1ZtY3lBOUlEQTdYRzRnSUNBZ0lDQWdJSFpoY2lCeVpYTjFiSFFnUFNCZkxtVjJaWEo1S0dKeVlXNWphR1Z6TENCbWRXNWpkR2x2YmlBb1luSmhibU5vS1NCN1hHNGdJQ0FnSUNBZ0lDQWdkbUZ5SUhCaGNuUnBZV3dnUFNCaWNtRnVZMmd1ZEdWemRDaGhZM1IxWVd3cE8xeHVJQ0FnSUNBZ0lDQWdJR2xtSUNod1lYSjBhV0ZzSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doY21WemIyeDJaWEl1Y0dGMWMyVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbkJoZFhObEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0IxYm1SbFpuTWdLejBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WVc1amFDNTBhR1Z1S0Y4dWIyNWpaU2htZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhWdVpHVm1jeUF0UFNBeE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9NQ0E5UFQwZ2RXNWtaV1p6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNtVnpkVzFsS0dGamRIVmhiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMHBMQ0JmTG05dVkyVW9ablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTV5WlhOMWJXVW9iblZzYkN3Z1ptRnNjMlVwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU2twTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlRzZ0x5OGdhMlZsY0NCcGRHVnlZWFJwYm1kY2JpQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnY0dGeWRHbGhiRHRjYmlBZ0lDQWdJQ0FnZlNrN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0hKbGMyOXNkbVZ5TG5CaGRYTmxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMWJtUmxabWx1WldRN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0F2THlCVVlXdGxJR05oY21VZ2IyWWdZVzU1SUdWNGNHVmpkR0YwYVc5dWN5QnNZWFJsY2lCcGJpQjBhR1VnWTJoaGFXNWNiaUFnSUNBZ0lDQWdhV1lnS0hKbGMzVnNkQ0E5UFQwZ2RISjFaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxjM1ZzZENBOUlISmxjMjlzZG1WeUtHRmpkSFZoYkNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbVZ6ZFd4ME8xeHVJQ0FnSUNBZ2ZUdGNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHOXlPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owTnZiWEJ2YzJWeklHRWdibVYzSUdWNGNHVmpkR0YwYVc5dUlHWnliMjBnZEhkdklHOXlJRzF2Y21VZ1pYaHdjbVZ6YzJsdmJuTXNJSGRvYVdOb0lIZHBiR3dnYjI1c2VTY3NYRzRnSUNBZ0lDQW5jM1ZqWTJWbFpDQnBaaUJoZENCc1pXRnpkQ0J2Ym1VZ2IyWWdkR2hsSUdWNGNISmxjM05wYjI1eklHUnZaWE11Snl4Y2JpQWdJQ0FnSUNkT2IzUmxPaUJsZG1Gc2RXRjBhVzl1SUhkcGJHd2djM1J2Y0NCaGN5QnpiMjl1SUdGeklHOXVaU0J2WmlCMGFHVWdaWGh3Y21WemMybHZibk1nYzNWalkyVmxaSE11SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0p5UjdJR0Z5WjNNdWFtOXBiaWhjSWlCUFVpQmNJaWtnZlNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lCN2V5QmhZM1IxWVd3Z2ZYMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdKeVlXNWphREVzSUdKeVlXNWphRElwSUh0Y2JpQWdJQ0FnSUhaaGNpQmljbUZ1WTJobGN5QTlJSGR5WVhCQmNtZHpLR0Z5WjNWdFpXNTBjeWs3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdablZ1WTNScGIyNGdLSEpsYzI5c2RtVnlLU0I3WEc0Z0lDQWdJQ0FnSUM4dklFTm9aV05ySUdsbUlHRnNiQ0JpY21GdVkyaGxjeUJ3WVhOeklIUm9aU0IwWlhOMFhHNGdJQ0FnSUNBZ0lIWmhjaUIxYm1SbFpuTWdQU0F3TzF4dUlDQWdJQ0FnSUNCMllYSWdjbVZ6ZFd4MElEMGdYeTV6YjIxbEtHSnlZVzVqYUdWekxDQm1kVzVqZEdsdmJpQW9ZbkpoYm1Ob0tTQjdYRzRnSUNBZ0lDQWdJQ0FnZG1GeUlIQmhjblJwWVd3Z1BTQmljbUZ1WTJndWRHVnpkQ2hoWTNSMVlXd3BPMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDaHdZWEowYVdGc0lEMDlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaGNtVnpiMngyWlhJdWNHRjFjMlZrS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGMyOXNkbVZ5TG5CaGRYTmxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCMWJtUmxabk1nS3owZ01UdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKeVlXNWphQzUwYUdWdUtGOHViMjVqWlNobWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxuSmxjM1Z0WlNoaFkzUjFZV3dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU2tzSUY4dWIyNWpaU2htZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhWdVpHVm1jeUF0UFNBeE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9NQ0E5UFQwZ2RXNWtaV1p6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNtVnpkVzFsS0c1MWJHd3NJR1poYkhObEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnWm1Gc2MyVTdJQzh2SUd0bFpYQWdhWFJsY21GMGFXNW5YRzRnSUNBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIQmhjblJwWVd3N1hHNGdJQ0FnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaHlaWE52YkhabGNpNXdZWFZ6WldRcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkVzVrWldacGJtVmtPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdWR0ZyWlNCallYSmxJRzltSUdGdWVTQmxlSEJsWTNSaGRHbHZibk1nYkdGMFpYSWdhVzRnZEdobElHTm9ZV2x1WEc0Z0lDQWdJQ0FnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJSFJ5ZFdVcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhOMWJIUWdQU0J5WlhOdmJIWmxjaWhoWTNSMVlXd3BPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhKbGMzVnNkRHRjYmlBZ0lDQWdJSDA3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0I0YjNJNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuUTI5dGNHOXpaWE1nWVNCdVpYY2daWGh3WldOMFlYUnBiMjRnWm5KdmJTQjBkMjhnYjNJZ2JXOXlaU0JsZUhCeVpYTnphVzl1Y3l3Z2QyaHBZMmdnZDJsc2JDQnZibXg1Snl4Y2JpQWdJQ0FnSUNkemRXTmpaV1ZrSUdsbUlHRjBJR3hsWVhOMElHOXVaU0J2WmlCMGFHVWdaWGh3Y21WemMybHZibk1nWkc5bGN5QmlkWFFnYm05MElHRnNiQ0J2WmlCMGFHVnRMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNja2V5QmhjbWR6TG1wdmFXNG9YQ0lnV0U5U0lGd2lLU0I5Snl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N0lHRmpkSFZoYkNCOWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnWW5KaGJtTm9NU3dnWW5KaGJtTm9NaWtnZTF4dUlDQWdJQ0FnZG1GeUlHSnlZVzVqYUdWeklEMGdkM0poY0VGeVozTW9ZWEpuZFcxbGJuUnpLVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQm1kVzVqZEdsdmJpQW9jbVZ6YjJ4MlpYSXBJSHRjYmlBZ0lDQWdJQ0FnTHk4Z1EyaGxZMnNnYVdZZ1lXeHNJR0p5WVc1amFHVnpJSEJoYzNNZ2RHaGxJSFJsYzNSY2JpQWdJQ0FnSUNBZ2RtRnlJSFZ1WkdWbWN5QTlJREE3WEc0Z0lDQWdJQ0FnSUhaaGNpQnZhM01nUFNBd08xeHVJQ0FnSUNBZ0lDQjJZWElnYTI5eklEMGdNRHRjYmlBZ0lDQWdJQ0FnWHk1bWIzSkZZV05vS0dKeVlXNWphR1Z6TENCbWRXNWpkR2x2YmlBb1luSmhibU5vS1NCN1hHNGdJQ0FnSUNBZ0lDQWdkbUZ5SUhCaGNuUnBZV3dnUFNCaWNtRnVZMmd1ZEdWemRDaGhZM1IxWVd3cE8xeHVJQ0FnSUNBZ0lDQWdJR2xtSUNod1lYSjBhV0ZzSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doY21WemIyeDJaWEl1Y0dGMWMyVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbkJoZFhObEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0IxYm1SbFpuTWdLejBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p5WVc1amFDNTBhR1Z1S0Y4dWIyNWpaU2htZFc1amRHbHZiaUFvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaHJiM01nUGlBd0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVjbVZ6ZFcxbEtHRmpkSFZoYkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJRzlyY3lBclBTQXhPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQjFibVJsWm5NZ0xUMGdNVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0RBZ1BUMDlJSFZ1WkdWbWN5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVnlMbkpsYzNWdFpTaGhZM1IxWVd3c0lHOXJjeUErSURBZ0ppWWdhMjl6SUQ0Z01DQS9JSFZ1WkdWbWFXNWxaQ0E2SUdaaGJITmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTa3NJRjh1YjI1alpTaG1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNodmEzTWdQaUF3S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWNtVnpkVzFsS0dGamRIVmhiQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lHdHZjeUFyUFNBeE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCMWJtUmxabk1nTFQwZ01UdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLREFnUFQwOUlIVnVaR1ZtY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxuSmxjM1Z0WlNoaFkzUjFZV3dzSUc5cmN5QStJREFnSmlZZ2EyOXpJRDRnTUNBL0lIVnVaR1ZtYVc1bFpDQTZJR1poYkhObEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNod1lYSjBhV0ZzSUQwOVBTQjBjblZsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J2YTNNZ0t6MGdNVHRjYmlBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tIQmhjblJwWVd3Z1BUMDlJR1poYkhObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcmIzTWdLejBnTVR0Y2JpQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2h5WlhOdmJIWmxjaTV3WVhWelpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZFc1a1pXWnBibVZrTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHOXJjeUErSURBZ0ppWWdhMjl6SUQ0Z01DQS9JSEpsYzI5c2RtVnlLR0ZqZEhWaGJDa2dPaUJtWVd4elpUdGNiaUFnSUNBZ0lIMDdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JuMHBPMXh1SWwxOSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuLy8gU2V0IG9mIGRlZmF1bHQgbWF0Y2hlcnNcbmFzcy5yZWdpc3Rlcih7XG4gIC8vIFRPRE86IE1vdmUgdGhpcyB0byB0aGUgQ2hhaW4gcHJvdG90eXBlXG4gIGRlc2M6IHtcbiAgICBoZWxwOiAnUHJvdmlkZSBhIGN1c3RvbSBkZXNjcmlwdGlvbiBmb3IgcmVwb3J0ZWQgZmFpbHVyZXMnLFxuICAgIGRlc2M6IG51bGwsICAvLyBTa2lwIGl0IGZyb20gcmVwb3J0c1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGRlc2MpIHtcbiAgICAgIC8vIE5vdGUgdGhhdCB0aGUgZGVzY3JpcHRpb24gd29uJ3QgYmUgc2V0IHVudGlsIHRoZSBjaGFpbiBpcyByZXNvbHZlZCxcbiAgICAgIC8vIGF0IGxlYXN0IG9uY2UsIHJlYWNoaW5nIHRoaXMgZXhwZWN0YXRpb24uXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIHJlc29sdmVyLmNoYWluLl9fZGVzY3JpcHRpb25fXyA9IGRlc2M7XG4gICAgICAgIHJldHVybiByZXNvbHZlcihhY3R1YWwpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gSWdub3JlZCBtYXRjaGVyc1xuICB0bzoge1xuICAgIGFsaWFzZXM6IFsgJ2EnLCAnYW4nLCAnYmUnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0p1c3Qgc29tZSBzeW50YXggc3VnYXIgdG8gbWFrZSB0aGUgZXhwZWN0YXRpb25zIGVhc2llciBvbiB0aGUgZXllcy4nXG4gICAgXSxcbiAgICBkZXNjOiBudWxsLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBtYXJrOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0luY3JlYXNlcyB0aGUgZ2xvYmFsIGBhc3MubWFya3NgIGNvdW50ZXIgZXZlcnkgdGltZSBpdCBnZXRzJyxcbiAgICAgICdldmFsdWF0ZWQgYXMgcGFydCBvZiBhbiBleHByZXNzaW9uLiBVc2UgaXQgdG8gdmVyaWZ5IHRoYXQgdGhlJyxcbiAgICAgICdwcmVjZWRpbmcgZXhwZWN0YXRpb25zIGFyZSBhY3R1YWxseSBiZWluZyBleGVjdXRlZC4nLFxuICAgICAgJ0FuIGVhc3kgd2F5IHRvIHN1cHBvcnQgdGhpcyB3aGVuIHVzaW5nIGEgdGVzdCBydW5uZXIgaXMgdG8gcmVzZXQnLFxuICAgICAgJ3RoZSBjb3VudGVyIGJ5IGNhbGxpbmcgYGFzcy5tYXJrcygpYCBvbiBhIGJlZm9yZUVhY2ggaG9vayBhbmQnLFxuICAgICAgJ3RoZW4gdmVyaWZ5IGF0IHRoZSBlbmQgb2YgdGVzdCB3aXRoIGBhc3MubWFya3MoTilgICh3aGVyZSBOIGlzJyxcbiAgICAgICd0aGUgbnVtYmVyIG9mIG1hcmtzIHlvdSBleHBlY3RlZCkuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBhc3MubWFya3MuY291bnRlciArPSAxO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuXG4gIC8vIEp1c3QgYWxsb3cgYW55dGhpbmcgOilcbiAgYW55OiB7XG4gICAgaGVscDogJ0FsbG93cyBhbnkgdmFsdWUgd2l0aG91dCB0ZXN0aW5nIGl0LicsXG4gICAgZGVzYzogJ2lzIGFueXRoaW5nJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIC8vIEFueXRoaW5nIHRoYXQgaXNuJ3QgbnVsbCBvciB1bmRlZmluZWRcbiAgZGVmaW5lZDoge1xuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZC4nLFxuICAgIGRlc2M6ICdpcyBkZWZpbmVkJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsICE9IG51bGw7XG4gICAgfVxuICB9LFxuICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgZW1wdHlcbiAgZW1wdHk6IHtcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBlbXB0eSAob3IgaGFzIGEgbGVuZ3RoIG9mIDApLicsXG4gICAgZGVzYzogJ2lzIGVtcHR5JyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID09IG51bGwgfHwgYWN0dWFsLmxlbmd0aCA9PT0gMDtcbiAgICB9XG4gIH0sXG4gIG5lbXB0eToge1xuICAgIGFsaWFzZXM6IFsgJ25vbkVtcHR5JyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIG5vdCBlbXB0eSAob3IgaGFzIGEgbGVuZ3RoIGdyZWF0ZXIgdGhhbiAwKS4nLFxuICAgIGRlc2M6ICdpcyBub3QgZW1wdHknLFxuICAgIGZhaWw6ICd3YXMgJHsgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgIT0gbnVsbCAmJiBhY3R1YWwubGVuZ3RoID4gMDtcbiAgICB9XG4gIH0sXG4gIHRydXRoeToge1xuICAgIGFsaWFzZXM6IFsgJ3RydWlzaCcgXSxcbiAgICBoZWxwOiAnVGhlIHZhbHVlIHNob3VsZCBiZSB0cnV0aHkgKG5vdCB1bmRlZmluZWQsIG51bGwsIDAsIFwiXCIgb3IgW10pLicsXG4gICAgZGVzYzogJ2lzIHRydXRoeScsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFhY3R1YWwpIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0eXBlb2YgYWN0dWFsLmxlbmd0aCA9PT0gJ251bWJlcicgPyBhY3R1YWwubGVuZ3RoID4gMCA6IHRydWU7XG4gICAgfVxuICB9LFxuICBmYWxzeToge1xuICAgIGhlbHA6ICdUaGUgdmFsdWUgc2hvdWxkIGJlIGZhbHN5ICh1bmRlZmluZWQsIG51bGwsIDAsIFwiXCIgb3IgW10pLicsXG4gICAgZGVzYzogJ2lzIGZhbHN5JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFhY3R1YWwpIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwubGVuZ3RoID09PSAnbnVtYmVyJyA/IGFjdHVhbC5sZW5ndGggPT09IDAgOiBmYWxzZTtcbiAgICB9XG4gIH0sXG5cbiAgLy8gTmVnYXRpb25cbiAgbm90OiB7XG4gICAgYWxpYXNlczogWyAnbm8nLCAnTk8nLCAnTk9UJyBdLFxuICAgIGhlbHA6ICdOZWdhdGVzIHRoZSByZXN1bHQgZm9yIHRoZSByZXN0IG9mIHRoZSBleHByZXNzaW9uLicsXG4gICAgZGVzYzogJ05vdCEnLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG5cbiAgICAgICAgaWYgKHJlc29sdmVyLmV4aGF1c3RlZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZXIuZmluYWxpemUoZnVuY3Rpb24gKGZpbmFsKSB7XG4gICAgICAgICAgcmV0dXJuICFmaW5hbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc29sdmVyKGFjdHVhbCk7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBpczoge1xuICAgIGFsaWFzZXM6IFsgJ2VxdWFsJywgJ2VxdWFscycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIHN0cmljdCBlcXVhbGl0eSBiZXR3ZWVuIHRoZSB2YWx1ZSBhbmQgaXRzIGV4cGVjdGVkLicsXG4gICAgICAnTm90ZTogaWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgY2hhaW4gZXhwcmVzc2lvbiBpdFxcJ2xsIGJlIHRlc3RlZCBpbnN0ZWFkLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBzdHJpY3RseSBlcXVhbCB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIC8vIHRoaXMgaXMgYSBiaXQgY29udHJpdmVkIGJ1dCBpdCBtYWtlcyBmb3Igc29tZSBuaWNlIHN5bnRheCB0byBiZSBhYmxlIHRvXG4gICAgICAvLyB1c2UgLmlzIGZvciBwYXNzaW5nIGluIGV4cGVjdGF0aW9uc1xuICAgICAgaWYgKGFzcy5DaGFpbi5pc0NoYWluKGV4cGVjdGVkKSkge1xuICAgICAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWN0dWFsID09PSBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG4gIGVxOiB7XG4gICAgYWxpYXNlczogWyAnZXFsJywgJ2VxbHMnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBkZWVwIG5vbi1zdHJpY3QgZXF1YWxpdHkgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIGl0cyBleHBlY3RlZC4nLFxuICAgICAgJ0l0IHVuZGVyc3RhbmRzIGFzcyBleHByZXNzaW9ucyBzbyB5b3UgY2FuIGNvbWJpbmUgdGhlbSBhdCB3aWxsIGluIHRoZScsXG4gICAgICAnZXhwZWN0ZWQgdmFsdWUuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGVxdWFsIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIF8uaXNFcXVhbChhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICB9XG4gIH0sXG5cbiAgbWF0Y2g6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnVHJpZXMgdG8gbWF0Y2ggdGhlIHN1YmplY3QgYWdhaW5zdCB0aGUgZXhwZWN0ZWQgdmFsdWUgd2hpY2ggY2FuIGJlIGVpdGhlcicsXG4gICAgICAnYSBmdW5jdGlvbiwgYW4gYXNzIGV4cHJlc3Npb24sIGFuIG9iamVjdCB3aXRoIGEgLnRlc3QoKSBmdW5jdGlvbiAoZm9yICcsXG4gICAgICAnaW5zdGFuY2UgYSBSZWdFeHApIG9yIGEgcGxhaW4gb2JqZWN0IHRvIHBhcnRpYWxseSBtYXRjaCBhZ2FpbnN0IHRoZSB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gbWF0Y2gge3tleHBlY3RlZH19JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG5cbiAgICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQudGVzdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gISFleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChfLmlzUGxhaW5PYmplY3QoZXhwZWN0ZWQpIHx8IF8uaXNBcnJheShleHBlY3RlZCkgfHwgXy5pc0FyZ3VtZW50cyhleHBlY3RlZCkpIHtcblxuICAgICAgICBpZiAoYWN0dWFsID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdXBwb3J0IHBhc3NpbmcgYFssJ2ZvbyddYCB0byBtZWFuIGBbYXNzLmFueSwgJ2ZvbyddYFxuICAgICAgICBpZiAoXy5pc0FycmF5KGV4cGVjdGVkKSB8fCBfLmlzQXJndW1lbnRzKGV4cGVjdGVkKSkge1xuICAgICAgICAgIGV4cGVjdGVkID0gXy5tYXAoZXhwZWN0ZWQsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHYgPT09ICd1bmRlZmluZWQnID8gYXNzLmFueSA6IHY7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiBJZGVhbGx5IHdlIHNob3VsZCBcImZvcmtcIiB0aGUgcmVzb2x2ZXIgc28gd2UgY2FuIHN1cHBvcnRcbiAgICAgICAgLy8gICAgICAgYXN5bmMgdGVzdHMgYW5kIGFsc28gcHJvdmlkZSBiZXR0ZXIgZmFpbHVyZSBtZXNzYWdlcy5cbiAgICAgICAgLy8gICAgICAgVW5mb3J0dW5hdGVseSB0aGUgY3VycmVudCBmb3JraW5nIG1lY2hhbmlzbSBkb2Vzbid0IHdvcmtcbiAgICAgICAgLy8gICAgICAgZm9yIHRoaXMgdXNlIGNhc2Ugc2luY2Ugd2UgbmVlZCB0byBjcmVhdGUgbmV3IGNoYWlucyBmb3JcbiAgICAgICAgLy8gICAgICAgZWFjaCBleHBlY3RlZCBrZXkuXG4gICAgICAgIHZhciBmYWlsdXJlID0gdHJ1ZTtcbiAgICAgICAgXyhleHBlY3RlZCkuZXZlcnkoZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICBpZiAoIV8uaGFzKGFjdHVhbCwga2V5KSkge1xuICAgICAgICAgICAgZmFpbHVyZSA9ICdrZXkgXCInICsga2V5ICsgJ1wiIG5vdCBmb3VuZCBpbiB7e2FjdHVhbH19JztcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIV8uaXNFcXVhbChhY3R1YWxba2V5XSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBmYWlsdXJlID0gJ2tleSBcIicgKyBrZXkgKyAnXCIgZG9lcyBub3QgbWF0Y2gge3thY3R1YWxbXCInICsga2V5ICsgJ1wiXX19JztcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZhaWx1cmU7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuICdleHBlY3RlZCBpcyBub3QgYSBmdW5jdGlvbiBhbmQgZG9lcyBub3QgaGF2ZSBhIC50ZXN0IG1ldGhvZCc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhIWV4cGVjdGVkKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuXG4gIGFib3ZlOiB7XG4gICAgYWxpYXNlczogWyAnZ3QnLCAnbW9yZVRoYW4nLCAnZ3JlYXRlclRoYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgaGlnaGVyIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIG1vcmUgdGhhbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPiBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYmVsb3c6IHtcbiAgICBhbGlhc2VzOiBbICdsdCcsICdsZXNzVGhhbicgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBsb3dlciB0aGEgaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIGxlc3MgdGhhbiB7e2V4cGVjdGVkfX0nLFxuICAgIGZhaWw6ICd3YXMge3thY3R1YWx9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiBhY3R1YWwgPCBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgYWJvdmVPckVxdWFsOiB7XG4gICAgYWxpYXNlczogWyAnbGVhc3QnLCAnYXRMZWFzdCcsICdndGUnLCAnbW9yZVRoYW5PckVxdWFsJywgJ2dyZWF0ZXJUaGFuT3JFcXVhbCcgXSxcbiAgICBoZWxwOiAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBoaWdoZXIgb3IgZXF1YWwgdGhhbiBpdHMgZXhwZWN0ZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgbW9yZSB0aGFuIG9yIGVxdWFsIHRvICR7ZXhwZWN0ZWR9JyxcbiAgICBmYWlsOiAnd2FzIHt7YWN0dWFsfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsID49IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBiZWxvd09yRXF1YWw6IHtcbiAgICBhbGlhc2VzOiBbICdtb3N0JywgJ2F0TW9zdCcsICdsdGUnLCAnbGVzc1RoYW5PckVxdWFsJyBdLFxuICAgIGhlbHA6ICdDaGVja3MgaWYgdGhlIHZhbHVlIGlzIGxvd2VyIG9yIGVxdWFsIHRoYW4gaXRzIGV4cGVjdGVkLicsXG4gICAgZGVzYzogJ3RvIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byAke2V4cGVjdGVkfScsXG4gICAgZmFpbDogJ3dhcyAke2FjdHVhbH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gYWN0dWFsIDw9IGV4cGVjdGVkO1xuICAgIH1cbiAgfSxcblxuICBjbG9zZToge1xuICAgIGFsaWFzZXM6IFsgJ2Nsb3NlVG8nIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgY2xvc2UgdG8gdGhlIGV4cGVjdGVkIGJhc2VkIG9uIGEgZ2l2ZW4gZGVsdGEuJyxcbiAgICAgICdUaGUgZGVmYXVsdCBkZWx0YSBpcyAwLjEgc28gdGhlIHZhbHVlIDMuNTUgaXMgY2xvc2UgdG8gYW55IHZhbHVlIGJldHdlZW4nLFxuICAgICAgJzMuNDUgYW5kIDMuNjUgKGJvdGggaW5jbHVzaXZlKS4nLFxuICAgICAgJ1N0cmluZyB2YWx1ZXMgYXJlIGFsc28gc3VwcG9ydGVkIGJ5IGNvbXB1dGluZyB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGVtJyxcbiAgICAgICd1c2luZyB0aGUgU2lmdDQgYWxnb3JpdGhtLiBGb3Igc3RyaW5nIHZhbHVlcyB0aGUgZGVsdGEgaXMgaW50ZXJwcmV0ZWQgYXMnLFxuICAgICAgJ2EgcGVyY2VudGFnZSAoaWU6IDAuMjUgaXMgMjUlKS4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmUgY2xvc2UgdG8ge3sgZXhwZWN0ZWQgfX0nLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgZGVsdGEpIHtcbiAgICAgIGRlbHRhID0gZGVsdGEgPT0gbnVsbCA/IDAuMSA6IGRlbHRhO1xuXG4gICAgICAvLyBTdXBwb3J0IHN0cmluZ3MgYnkgY29tcHV0aW5nIHRoZWlyIGRpc3RhbmNlXG4gICAgICBpZiAoXy5pc1N0cmluZyhhY3R1YWwpICYmIF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHZhciBkaWZmID0gdXRpbC5zaWZ0NChhY3R1YWwsIGV4cGVjdGVkLCAzKSAvIE1hdGgubWF4KGFjdHVhbC5sZW5ndGgsIGV4cGVjdGVkLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiBkaWZmIDw9IGRlbHRhO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWN0dWFsID49IGV4cGVjdGVkIC0gZGVsdGEgJiYgYWN0dWFsIDw9IGV4cGVjdGVkICsgZGVsdGE7XG4gICAgfVxuICB9LFxuXG4gIGluc3RhbmNlb2Y6IHtcbiAgICBhbGlhc2VzOiBbICdpbnN0YW5jZU9mJywgJ2luc3RhbmNlJywgJ2lzYScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gY29uc3RydWN0b3IuJyxcbiAgICAgICdXaGVuIHRoZSBleHBlY3RlZCBpcyBhIHN0cmluZyBpdFxcJ2xsIGFjdHVhbGx5IHVzZSBhIGB0eXBlb2ZgJyxcbiAgICAgICdjb21wYXJpc29uLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBiZSBhbiBpbnN0YW5jZSBvZiB7e2V4cGVjdGVkfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyhleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBhY3R1YWwgPT09IGV4cGVjdGVkID8gdHJ1ZSA6ICdoYWQgdHlwZSB7eyB0eXBlb2YgYWN0dWFsIH19JztcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZDtcbiAgICB9XG4gIH0sXG5cbiAgdHlwZW9mOiB7XG4gICAgaGVscDogJ0NoZWNrcyBpZiB0aGUgdmFsdWUgaXMgb2YgYSBzcGVjaWZpYyB0eXBlJyxcbiAgICBkZXNjOiAndG8gaGF2ZSB0eXBlIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ2hhZCAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gXy5pc0VxdWFsKHR5cGVvZiBhY3R1YWwsIGV4cGVjdGVkKTtcbiAgICB9XG4gIH0sXG4gIG51bWJlcjoge1xuICAgIGhlbHA6ICdDaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBudW1iZXIgKGRpZmZlcmVudCBvZiBOYU4pLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgbnVtYmVyJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc051bWJlcihhY3R1YWwpICYmICFpc05hTihhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgYm9vbDoge1xuICAgIGFsaWFzZXM6IFsgJ2Jvb2xlYW4nIF0sXG4gICAgaGVscDogJ0NoZWNrIGlmIHRoZSB2YWx1ZSBpcyBhIGJvb2xlYW4uJyxcbiAgICBkZXNjOiAndG8gYmUgYSBib29sZWFuJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0Jvb2xlYW4oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHN0cmluZzoge1xuICAgIGFsaWFzZXM6IFsgJ3N0cicgXSxcbiAgICBoZWxwOiAnQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGEgc3RyaW5nLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgc3RyaW5nJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1N0cmluZyhhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgb2JqZWN0OiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgb2YgdHlwZSBvYmplY3QuJyxcbiAgICBkZXNjOiAndG8gYmUgYW4gb2JqZWN0JyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc09iamVjdChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgcGxhaW5PYmplY3Q6IHtcbiAgICBhbGlhc2VzOiBbICdwbGFpbicsICdvYmonIF0sXG4gICAgaGVscDogJ0NoZWNrcyB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZSBPYmplY3QgY29uc3RydWN0b3IuJyxcbiAgICBmYWlsOiAnd2FzICR7YWN0dWFsfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNQbGFpbk9iamVjdChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgYXJyYXk6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBBcnJheS4nLFxuICAgIGRlc2M6ICd0byBiZSBhbiBBcnJheScsXG4gICAgZmFpbDogJ2hhZCB0eXBlICR7IHR5cGVvZiBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNBcnJheShhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgZnVuY3Rpb246IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIEZ1bmN0aW9uLicsXG4gICAgZGVzYzogJ3RvIGJlIGEgRnVuY3Rpb24nLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzRnVuY3Rpb24oYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIHJlZ2V4cDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGEgUmVnRXhwJyxcbiAgICBkZXNjOiAndG8gYmUgYSBSZWdFeHAnLFxuICAgIGZhaWw6ICdoYWQgdHlwZSAkeyB0eXBlb2YgYWN0dWFsIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBfLmlzUmVnRXhwKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBkYXRlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgYSBEYXRlJyxcbiAgICBkZXNjOiAndG8gYmUgYSBEYXRlJyxcbiAgICBmYWlsOiAnaGFkIHR5cGUgJHsgdHlwZW9mIGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc0RhdGUoYWN0dWFsKTtcbiAgICB9XG4gIH0sXG4gIGVsZW1lbnQ6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhIERPTSBlbGVtZW50JyxcbiAgICBkZXNjOiAndG8gYmUgYSBET00gZWxlbWVudCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIF8uaXNFbGVtZW50KGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICBlcnJvcjoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGFuIGVycm9yIChvciBsb29rcyBsaWtlIGl0KScsXG4gICAgZGVzYzogJ3RvIGJlIGFuIEVycm9yJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoYWN0dWFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gXy5pc09iamVjdChhY3R1YWwpICYmIF8uaXNTdHJpbmcoYWN0dWFsLm5hbWUpICYmIF8uaXNTdHJpbmcoYWN0dWFsLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSxcblxuICB1bmRlZmluZWQ6IHtcbiAgICBoZWxwOiAnQ2hlY2sgdGhhdCB2YWx1ZSBpcyB1bmRlZmluZWQuJyxcbiAgICBkZXNjOiAndG8gYmUgdW5kZWZpbmVkJyxcbiAgICBmYWlsOiAnd2FzICR7IGFjdHVhbCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gXy5pc1VuZGVmaW5lZChhY3R1YWwpO1xuICAgIH1cbiAgfSxcbiAgbnVsbDoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIG51bGwuJyxcbiAgICBkZXNjOiAndG8gYmUgbnVsbCcsXG4gICAgZmFpbDogJ3dhcyAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGFjdHVhbCA9PT0gbnVsbDtcbiAgICB9XG4gIH0sXG4gIE5hTjoge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIE5hTi4nLFxuICAgIGRlc2M6ICd0byBiZSBOYU4nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzTnVtYmVyKGFjdHVhbCkpIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ3dhcyAke2FjdHVhbH0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5mYWlsID0gJ2hhZCB0eXBlICR7dHlwZW9mIGFjdHVhbH0nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGlzTmFOKGFjdHVhbCk7XG4gICAgfVxuICB9LFxuICB0cnVlOiB7XG4gICAgaGVscDogJ0NoZWNrIHRoYXQgdmFsdWUgaXMgdHJ1ZScsXG4gICAgZGVzYzogJ3RvIGJlIHRydWUnLFxuICAgIGZhaWw6ICd3YXMge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4oYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gYWN0dWFsID09IHRydWUgPyB0cnVlIDogJ3dhcyB7e2FjdHVhbH19JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBmYWxzZToge1xuICAgIGhlbHA6ICdDaGVjayB0aGF0IHZhbHVlIGlzIGZhbHNlJyxcbiAgICBkZXNjOiAndG8gYmUgZmFsc2UnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmIChfLmlzQm9vbGVhbihhY3R1YWwpKSB7XG4gICAgICAgIHJldHVybiBhY3R1YWwgPT0gZmFsc2UgPyB0cnVlIDogJ3dhcyB7e2FjdHVhbH19JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnaGFkIHR5cGUgJHt0eXBlb2YgYWN0dWFsfSc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJhaXNlczoge1xuICAgIGFsaWFzZXM6IFsgJ3Rocm93cycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2tzIHRoYXQgZXhlY3V0aW5nIHRoZSB2YWx1ZSByZXN1bHRzIGluIGFuIGV4Y2VwdGlvbiBiZWluZyB0aHJvd24uJyxcbiAgICAgICdUaGUgY2FwdHVyZWQgZXhjZXB0aW9uIHZhbHVlIGlzIHVzZWQgdG8gbXV0YXRlIHRoZSBzdWJqZWN0IGZvciB0aGUnLFxuICAgICAgJ2ZvbGxvd2luZyBleHBlY3RhdGlvbnMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3Rocm93cyBhbiBlcnJvcicsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghXy5pc0Z1bmN0aW9uKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBmdW5jdGlvbjoge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGFjdHVhbCgpO1xuICAgICAgICByZXR1cm4gJ2RpZCBub3QgdGhyb3cgYW55dGhpbmcnO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZXhwZWN0ZWQgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGV4cGVjdGVkKSAmJiBlIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNFcXVhbChlLCBleHBlY3RlZCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdWdtZW50IHRoZSBleHBlY3RhdGlvbiBvYmplY3Qgd2l0aCBhIG5ldyB0ZW1wbGF0ZSB2YXJpYWJsZVxuICAgICAgICB0aGlzLmV4Y2VwdGlvbiA9IGU7XG4gICAgICAgIHJldHVybiAnZ290IHt7IGV4Y2VwdGlvbiB9fSc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGhhczoge1xuICAgIGFsaWFzZXM6IFsgJ2hhdmUnLCAnY29udGFpbicsICdjb250YWlucycgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2sgaWYgdGhlIHZhbHVlIGhhcyBzb21lIGV4cGVjdGVkIHZhbHVlLiBJdCB1bmRlcnN0YW5kcyBleHBlY3RlZCcsXG4gICAgICAnY2hhaW4gZXhwcmVzc2lvbnMgc28gdGhpcyBzZXJ2ZXMgYXMgdGhlIGVxdWl2YWxlbnQgb2YgLmVxIGZvciBwYXJ0aWFsJyxcbiAgICAgICdtYXRjaGVzLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBjb250YWluIHt7ZXhwZWN0ZWR9fScsXG4gICAgZmFpbDogJ3dhcyB7e2FjdHVhbH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBhcmcxIC8qLCAuLi4gKi8pIHtcblxuICAgICAgLy8gYWxsb3cgbXVsdGlwbGUgZXhwZWN0ZWQgdmFsdWVzXG4gICAgICB2YXIgZXhwZWN0ZWQgPSBfLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcbiAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZC5sZW5ndGggPT09IDEgPyBleHBlY3RlZFswXSA6IGV4cGVjdGVkO1xuXG4gICAgICBpZiAoIV8uaXNTdHJpbmcoYWN0dWFsKSAmJiAhXy5pc0FycmF5KGFjdHVhbCkgJiYgIV8uaXNPYmplY3QoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2dvdCB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIF8uZXZlcnkoZXhwZWN0ZWQsIGZ1bmN0aW9uIChleHBlY3RlZCkge1xuICAgICAgICBpZiAoXy5pc1N0cmluZyhhY3R1YWwpICYmIF8uaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgcmV0dXJuIC0xICE9PSBhY3R1YWwuaW5kZXhPZihleHBlY3RlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5pc0FycmF5KGFjdHVhbCkpIHtcbiAgICAgICAgICAvLyBUT0RPOiBJc24ndCB0aGVyZSBhbiBlYXNpZXIgd2F5IHRvIHRlc3QgdGhpcyB1c2luZyBsb2Rhc2ggb25seT9cbiAgICAgICAgICBpZiAoIWFzcy5DaGFpbi5pc0NoYWluKGV4cGVjdGVkKSkge1xuICAgICAgICAgICAgZXhwZWN0ZWQgPSBhc3MuZXEoZXhwZWN0ZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gLTEgIT09IF8uZmluZEluZGV4KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFjazogQ29tcGFyZSBvYmplY3RzIHdpdGggLndoZXJlIGJ5IGZpbHRlcmluZyBhIHdyYXBwZXIgYXJyYXlcbiAgICAgICAgcmV0dXJuIDEgPT09IF8ud2hlcmUoW2FjdHVhbF0sIGV4cGVjdGVkKS5sZW5ndGg7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG4gIGhhc093bjoge1xuICAgIGFsaWFzZXM6IFsgJ2hhc0tleScsICdoYXNJbmRleCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQ2hlY2sgaWYgdGhlIHZhbHVlIGhhcyBvbmUgb3IgbW9yZSBvd24gcHJvcGVydGllcyBhcyBkZWZpbmVkIGJ5JyxcbiAgICAgICd0aGUgZ2l2ZW4gYXJndW1lbnRzLidcbiAgICBdLFxuICAgIGRlc2M6ICd0byBoYXZlIG93biBwcm9wZXJ0eSAkeyBleHBlY3RlZCB9JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgaWYgKCFfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICd3YXMge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZmFpbCA9ICdvbmx5IGhhZCB7eyBfLmtleXMoYWN0dWFsKSB9fSc7XG5cbiAgICAgIC8vIFRPRE86IE9mZmVyIGJldHRlciBmYWlsdXJlIG1lc3NhZ2VcbiAgICAgIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gXy5ldmVyeShhcmdzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4gXy5oYXMoYWN0dWFsLCB4KTsgfSk7XG4gICAgfVxuICB9LFxuXG4gIGxvZzoge1xuICAgIGhlbHA6IFtcbiAgICAgICdEdW1wcyB0aGUgcmVjZWl2ZWQgdmFsdWUgdG8gdGhlIGNvbnNvbGUuJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICBjb25zb2xlLmxvZygnW0FTU10nLCBhY3R1YWwpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBkdW1wOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0R1bXBzIHRoZSByZWNlaXZlZCB2YWx1ZSB0byB0aGUgY29uc29sZSBhcHBseWluZyB0aGUgZ2l2ZW4gdGVtcGxhdGUuJyxcbiAgICAgICdOb3RlOiBVc2UgJHt0aGlzfSB0byBpbnRlcnBvbGF0ZSB0aGUgd2hvbGUgdmFsdWUuJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI3RlbXBsYXRlJ1xuICAgIF0sXG4gICAgZGVzYzogbnVsbCxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCB0cGwpIHtcbiAgICAgIHZhciByZXN1bHQgPSB1dGlsLnRlbXBsYXRlLmNhbGwoYWN0dWFsLCB0cGwsIGFjdHVhbCk7XG4gICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBkZWJ1Z2dlcjoge1xuICAgIGhlbHA6IFtcbiAgICAgICdIYWx0cyBzY3JpcHQgZXhlY3V0aW9uIGJ5IHRyaWdnZXJpbmcgdGhlIGludGVyYWN0aXZlIGRlYnVnZ2VyLidcbiAgICBdLFxuICAgIGRlc2M6IG51bGwsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgZGVidWdnZXI7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG5cbiAgdGFwOiB7XG4gICAgYWxpYXNlczogWyAnZm4nIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0NhbGxzIHRoZSBwcm92aWRlZCBmdW5jdGlvbiB3aXRoIHRoZSBjdXJyZW50IHZhbHVlIGFzIGFyZ3VtZW50LicsXG4gICAgICAnSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgc29tZXRoaW5nIGRpZmZlcmVudCB0byAqdW5kZWZpbmVkKiB0aGUnLFxuICAgICAgJ2V4cHJlc3Npb24gd2lsbCBmb3JrIHRvIG9wZXJhdGUgb24gdGhlIHJldHVybmVkIHZhbHVlLicsXG4gICAgXSxcbiAgICBkZXNjOiAnY2FsbCB7e2FyZzF9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZm4pIHtcbiAgICAgIHZhciByZXN1bHQgPSBmbihhY3R1YWwpO1xuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11dGF0ZShyZXN1bHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICBub3RpZnk6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnU2ltaWxhciB0byAudGFwKCkgYnV0IGl0IHdvblxcJ3QgcGFzcyB0aGUgY3VycmVudCB2YWx1ZSBhcyBhcmd1bWVudCwnLFxuICAgICAgJ2luc3RlYWQgaXQgd2lsbCBiZSBwcm92aWRlZCBhcyB0aGUgYHRoaXNgIGNvbnRleHQgd2hlbiBwZXJmb3JtaW5nIHRoZScsXG4gICAgICAnY2FsbC4gVGhpcyBhbGxvd3MgaXQgdG8gYmUgdXNlZCB3aXRoIHRlc3QgcnVubmVycyBgZG9uZWAgc3R5bGUgY2FsbGJhY2tzLicsXG4gICAgICAnTm90ZSB0aGF0IGl0IHdpbGwgbmVpdGhlciBtdXRhdGUgdGhlIHZhbHVlIGV2ZW4gaWYgaXQgcmV0dXJucyBzb21ldGhpbmcuJ1xuICAgIF0sXG4gICAgZGVzYzogJ25vdGlmeSB7e2FyZzF9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZm4pIHtcbiAgICAgIGZuLmNhbGwoYWN0dWFsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSxcblxuICBzaXplOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIHRoZSBzaXplIG9mIHRoZSBjdXJyZW50IHZhbHVlLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgc2l6ZScsXG4gICAgZmFpbDogJ25vdCBoYXMgYSBsZW5ndGg6IHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKF8uaXNPYmplY3QoYWN0dWFsKSB8fCBfLmlzQXJyYXkoYWN0dWFsKSB8fCBfLmlzU3RyaW5nKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKF8uc2l6ZShhY3R1YWwpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSxcbiAgcHJvcDoge1xuICAgIGFsaWFzZXM6IFsgJ2tleScsICdwcm9wZXJ0eScgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gb25lIG9mIHRoZSB2YWx1ZSBwcm9wZXJ0aWVzLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgcHJvcGVydHkge3sgYXJnMSB9fScsXG4gICAgZmFpbDogJ3dhcyBub3QgZm91bmQgb24ge3sgYWN0dWFsIH19JyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBrZXkpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGFjdHVhbCkpIHtcbiAgICAgICAgaWYgKGtleSBpbiBhY3R1YWwpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tdXRhdGUoYWN0dWFsW2tleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5rZXlzID0gW107XG4gICAgICAgIF8uZm9ySW4oYWN0dWFsLCBmdW5jdGlvbiAodiwgaykgeyB0aGlzLmtleXMucHVzaChrKTsgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiAnd2FzIG5vdCBmb3VuZCBpbiBrZXlzIHt7IGtleXMgfX0nO1xuICAgICAgfVxuICAgICAgcmV0dXJuICdnb3Qge3thY3R1YWx9fSc7XG4gICAgfVxuICB9LFxuICBhdDoge1xuICAgIGFsaWFzZXM6IFsgJ2luZGV4JyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBvcGVyYXRlIG9uIG9uZSBvZiB0aGUgaW5kZXhlZCBlbGVtZW50cy4gSWYnLFxuICAgICAgJ211bHRpcGxlIGluZGV4ZXMgYXJlIHByb3ZpZGVkIGFuIGFycmF5IGlzIGNvbXBvc2VkIHdpdGggdGhlbS4nLFxuICAgICAgJ05vdGU6IEl0IHN1cHBvcnRzIG5lZ2F0aXZlIGluZGV4ZXMnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGluZGV4ICR7IGFyZ3Muam9pbihcIiwgXCIpIH0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGluZGV4KSB7XG4gICAgICBpZiAoIV8uaXNBcnJheShhY3R1YWwpICYmICFfLmlzU3RyaW5nKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdub3QgYW4gYXJyYXkgb3IgYSBzdHJpbmc6ICR7YWN0dWFsfSc7XG4gICAgICB9XG5cbiAgICAgIHZhciBpbmRleGVzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgICB2YXIgZWxlbXMgPSBbXTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbmRleGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBpZHggPSBpbmRleGVzW2ldO1xuXG4gICAgICAgIGlkeCA9IGlkeCA8IDAgPyBhY3R1YWwubGVuZ3RoICsgaWR4IDogaWR4O1xuICAgICAgICBpZiAoaWR4IDwgMCB8fCBpZHggPj0gYWN0dWFsLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBpZHggKyAnIG91dCBvZiBib3VuZHMgZm9yIHt7YWN0dWFsfX0nO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbXMucHVzaChhY3R1YWxbaWR4XSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgZWxlbXMubGVuZ3RoID09PSAxID8gZWxlbXNbMF0gOiBlbGVtc1xuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAga2V5czoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBvcGVyYXRlIG9uIGl0cyBsaXN0IG9mIG93biBrZXlzLidcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQga2V5cycsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmtleXMoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHZhbHVlczoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSB2YWx1ZSB0byBvcGVyYXRlIG9uIGl0cyBsaXN0IG9mIHZhbHVlcydcbiAgICBdLFxuICAgIGRlc2M6ICdnZXQgdmFsdWVzJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8udmFsdWVzKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHNsaWNlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0V4dHJhY3RzIGEgcG9ydGlvbiBmcm9tIHRoZSB2YWx1ZS4nXG4gICAgXSxcbiAgICBkZXNjOiAnc2xpY2Uoe3thY3R1YWx9fSwgJHthcmcxIHx8IDB9KScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgc3RhcnQsIGVuZCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnRvQXJyYXkoYWN0dWFsKS5zbGljZShzdGFydCwgZW5kKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgZmlsdGVyOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0l0ZXJhdGVzIG92ZXIgZWxlbWVudHMgb2YgdGhlIGNvbGxlY3Rpb24sIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvJyxcbiAgICAgICdvcGVyYXRlIG9uIGFuIGFycmF5IHdpdGggYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggdGhlIGNhbGxiYWNrIHJldHVybmVkJyxcbiAgICAgICd0cnV0aHkgZm9yLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNmaWx0ZXInXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLmZpbHRlcihhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIHJlamVjdDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGNvbGxlY3Rpb24sIGZvcmtpbmcgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUnLFxuICAgICAgJ29uIGFuIGFycmF5IHdpdGggYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggdGhlIGNhbGxiYWNrIHJldHVybmVkIGZhbHN5JyxcbiAgICAgICdmb3IgKHRoZSBvcHBvc2l0ZSBvZiAuZmlsdGVyKS4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcmVqZWN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5yZWplY3QoYWN0dWFsLCBjYWxsYmFjaywgdGhpc0FyZylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHdoZXJlOiB7XG4gICAgaGVscDogW1xuICAgICAgJ1BlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIG9mIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24gdG8gdGhlIGdpdmVuJyxcbiAgICAgICdwcm9wZXJ0aWVzIG9iamVjdCwgZm9ya2luZyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBvZiBhbGwnLFxuICAgICAgJ2VsZW1lbnRzIHRoYXQgaGF2ZSBlcXVpdmFsZW50IHByb3BlcnR5IHZhbHVlcy4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3Mjd2hlcmUnXG4gICAgXSxcbiAgICBkZXNjOiAnd2hlcmUge3thcmcxfX0nLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHByb3BzKSB7XG4gICAgICBpZiAoIV8uaXNQbGFpbk9iamVjdChwcm9wcykpIHtcbiAgICAgICAgcmV0dXJuICdwcm9wcyBpcyBub3QgYW4gb2JqZWN0JztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy53aGVyZShhY3R1YWwsIHByb3BzKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWFwOiB7XG4gICAgaGVscDogW1xuICAgICAgJ0ZvcmtzIHRoZSBleHBlY3RhdGlvbiB0byBvcGVyYXRlIG9uIGFuIGFycmF5IGhvbGRpbmcgdGhlIHJlc3VsdHMgb2YnLFxuICAgICAgJ2ludm9raW5nIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI21hcCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWFwKGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBtZXRob2Q6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnRm9ya3MgdGhlIGV4cGVjdGF0aW9uIHRvIG9wZXJhdGUgb24gdGhlIHJlc3VsdCBvZiBpbnZva2luZyB0aGUgbmFtZWQnLFxuICAgICAgJ21ldGhvZCBvbiB0aGUgc3ViamVjdCB2YWx1ZS4nLFxuICAgIF0sXG4gICAgZGVzYzogXCJtZXRob2QgLiR7YXJnMX0oKVwiLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIG1ldGhvZCwgYXJnKSB7XG4gICAgICBpZiAodHlwZW9mIGFjdHVhbFttZXRob2RdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAnJHthcmcxfSBpcyBub3QgYSBtZXRob2QgaW4ge3thY3R1YWx9fSc7XG4gICAgICB9XG5cbiAgICAgIHZhciBhcmdzID0gXy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMik7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIGFjdHVhbFttZXRob2RdLmFwcGx5KGFjdHVhbCwgYXJncylcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGludm9rZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdGb3JrcyB0aGUgZXhwZWN0YXRpb24gdG8gb3BlcmF0ZSBvbiBhbiBhcnJheSBob2xkaW5nIHRoZSByZXN1bHRzIG9mJyxcbiAgICAgICdpbnZva2luZyB0aGUgbWV0aG9kIG5hbWVkIGJ5IHRoZSBhcmd1bWVudCBmb3IgZWFjaCBlbGVtZW50IGluIHRoZScsXG4gICAgICAnY3VycmVudCBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNpbnZva2UnXG4gICAgXSxcbiAgICBkZXNjOiBcImludm9rZSAuJHthcmcxfSgpXCIsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgbWV0aG9kLCBhcmcpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5pbnZva2UuYXBwbHkoXywgYXJndW1lbnRzKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgcGx1Y2s6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gYmUgdGhlIG9uZSBvZiB0aGUgc3BlY2lmaWMgcHJvcGVydHkgZm9yIGFsbCBlbGVtZW50cycsXG4gICAgICAnaW4gdGhlIGN1cnJlbnQgY29sbGVjdGlvbi4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjcGx1Y2snXG4gICAgXSxcbiAgICBkZXNjOiAncGx1Y2soIHt7YXJnMX19ICknLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIHByb3ApIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5wbHVjayhhY3R1YWwsIHByb3ApXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBmaXJzdDoge1xuICAgIGFsaWFzZXM6IFsgJ2hlYWQnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjZmlyc3QnXG4gICAgXSxcbiAgICBkZXNjOiAnZ2V0IGZpcnN0IGVsZW1lbnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5oZWFkKGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBsYXN0OiB7XG4gICAgaGVscDogW1xuICAgICAgJ1RPRE8nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3MjbGFzdCdcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5sYXN0KGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuICByZXN0OiB7XG4gICAgYWxpYXNlczogWyAndGFpbCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnVE9ETycsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNyZXN0J1xuICAgIF0sXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIHRoaXMubXV0YXRlKFxuICAgICAgICBfLnRhaWwoYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgbWluOiB7XG4gICAgaGVscDogW1xuICAgICAgJ011dGF0ZXMgdGhlIHN1YmplY3QgdG8gYmUgdGhlIG1pbmltdW0gdmFsdWUgZm91bmQgb24gdGhlIGNvbGxlY3Rpb24uJyxcbiAgICAgICdTZWU6IGh0dHBzOi8vbG9kYXNoLmNvbS9kb2NzI21pbidcbiAgICBdLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm11dGF0ZShcbiAgICAgICAgXy5taW4oYWN0dWFsKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIG1heDoge1xuICAgIGhlbHA6IFtcbiAgICAgICdNdXRhdGVzIHRoZSBzdWJqZWN0IHRvIGJlIHRoZSBtYXhpbXVtIHZhbHVlIGZvdW5kIG9uIHRoZSBjb2xsZWN0aW9uLicsXG4gICAgICAnU2VlOiBodHRwczovL2xvZGFzaC5jb20vZG9jcyNtYXgnXG4gICAgXSxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8ubWF4KGFjdHVhbClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHNvcnQ6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnTXV0YXRlcyB0aGUgdmFsdWUgdG8gYmUgc29ydGVkIGluIGFzY2VuZGluZyBvcmRlci4nLFxuICAgICAgJ1NlZTogaHR0cHM6Ly9sb2Rhc2guY29tL2RvY3Mjc29ydEJ5J1xuICAgIF0sXG4gICAgZGVzYzogJ3NvcnQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAvLyBBbGxvdyB0aGUgdXNlIG9mIGV4cHJlc3Npb25zIGFzIGNhbGxiYWNrc1xuICAgICAgaWYgKGNhbGxiYWNrIGluc3RhbmNlb2YgYXNzLkNoYWluKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sucmVzdWx0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5tdXRhdGUoXG4gICAgICAgIF8uc29ydEJ5KGFjdHVhbCwgY2FsbGJhY2ssIHRoaXNBcmcpXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzdG9yZToge1xuICAgIGhlbHA6IFtcbiAgICAgICdIZWxwZXIgdG8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgdmFsdWUgYmVpbmcgZXZhbHVhdGVkIGluIHRoZScsXG4gICAgICAnZXhwcmVzc2lvbiBpbiBzb21lIG90aGVyIG9iamVjdC4gSXQgZXhwZWN0cyBhIHRhcmdldCBvYmplY3QgYW5kIG9wdGlvbmFsbHknLFxuICAgICAgJ3RoZSBuYW1lIG9mIGEgcHJvcGVydHkuIElmIHRhcmdldCBpcyBhIGZ1bmN0aW9uIGl0XFwnbGwgcmVjZWl2ZSB0aGUgdmFsdWUnLFxuICAgICAgJ3VzaW5nIGBwcm9wYCBhcyB0aGlzIGNvbnRleHQuIElmIGBwcm9wYCBpcyBub3QgcHJvdmlkZWQgYW5kIGB0YXJnZXRgIGlzIGFuJyxcbiAgICAgICdhcnJheSB0aGUgdmFsdWUgd2lsbCBiZSBwdXNoZWQgdG8gaXQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3N0b3JlJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsLCB0YXJnZXQsIHByb3ApIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24odGFyZ2V0KSkge1xuICAgICAgICB0YXJnZXQuY2FsbChwcm9wLCBhY3R1YWwpO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKF8uaXNBcnJheSh0YXJnZXQpKSB7XG4gICAgICAgICAgdGFyZ2V0LnB1c2goYWN0dWFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJ3Byb3AgdW5kZWZpbmVkIGFuZCB0YXJnZXQgaXMgbm90IGFuIGFycmF5IG9yIGEgZnVuY3Rpb246IHt7YXJnMX19JztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BdID0gYWN0dWFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICd0YXJnZXQgaXMgbm90IGFuIG9iamVjdDoge3thcmcxfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxufSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOXRZWFJqYUdWeWN5OWpiM0psTG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN1FVRkJRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUoyWVhJZ1h5QTlJQ2gwZVhCbGIyWWdkMmx1Wkc5M0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdkMmx1Wkc5M0xsOGdPaUIwZVhCbGIyWWdaMnh2WW1Gc0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdaMnh2WW1Gc0xsOGdPaUJ1ZFd4c0tUdGNibHh1ZG1GeUlHRnpjeUE5SUhKbGNYVnBjbVVvSnk0dUwyRnpjeWNwTzF4dWRtRnlJSFYwYVd3Z1BTQnlaWEYxYVhKbEtDY3VMaTkxZEdsc0p5azdYRzVjYmk4dklGTmxkQ0J2WmlCa1pXWmhkV3gwSUcxaGRHTm9aWEp6WEc1aGMzTXVjbVZuYVhOMFpYSW9lMXh1SUNBdkx5QlVUMFJQT2lCTmIzWmxJSFJvYVhNZ2RHOGdkR2hsSUVOb1lXbHVJSEJ5YjNSdmRIbHdaVnh1SUNCa1pYTmpPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0oxQnliM1pwWkdVZ1lTQmpkWE4wYjIwZ1pHVnpZM0pwY0hScGIyNGdabTl5SUhKbGNHOXlkR1ZrSUdaaGFXeDFjbVZ6Snl4Y2JpQWdJQ0JrWlhOak9pQnVkV3hzTENBZ0x5OGdVMnRwY0NCcGRDQm1jbTl0SUhKbGNHOXlkSE5jYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCa1pYTmpLU0I3WEc0Z0lDQWdJQ0F2THlCT2IzUmxJSFJvWVhRZ2RHaGxJR1JsYzJOeWFYQjBhVzl1SUhkdmJpZDBJR0psSUhObGRDQjFiblJwYkNCMGFHVWdZMmhoYVc0Z2FYTWdjbVZ6YjJ4MlpXUXNYRzRnSUNBZ0lDQXZMeUJoZENCc1pXRnpkQ0J2Ym1ObExDQnlaV0ZqYUdsdVp5QjBhR2x6SUdWNGNHVmpkR0YwYVc5dUxseHVJQ0FnSUNBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNoeVpYTnZiSFpsY2lrZ2UxeHVJQ0FnSUNBZ0lDQnlaWE52YkhabGNpNWphR0ZwYmk1ZlgyUmxjMk55YVhCMGFXOXVYMThnUFNCa1pYTmpPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSW9ZV04wZFdGc0tUdGNiaUFnSUNBZ0lIMDdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJQzh2SUVsbmJtOXlaV1FnYldGMFkyaGxjbk5jYmlBZ2RHODZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2RoSnl3Z0oyRnVKeXdnSjJKbEp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkS2RYTjBJSE52YldVZ2MzbHVkR0Y0SUhOMVoyRnlJSFJ2SUcxaGEyVWdkR2hsSUdWNGNHVmpkR0YwYVc5dWN5QmxZWE5wWlhJZ2IyNGdkR2hsSUdWNVpYTXVKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nYm5Wc2JDeGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2JXRnlhem9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEpibU55WldGelpYTWdkR2hsSUdkc2IySmhiQ0JnWVhOekxtMWhjbXR6WUNCamIzVnVkR1Z5SUdWMlpYSjVJSFJwYldVZ2FYUWdaMlYwY3ljc1hHNGdJQ0FnSUNBblpYWmhiSFZoZEdWa0lHRnpJSEJoY25RZ2IyWWdZVzRnWlhod2NtVnpjMmx2Ymk0Z1ZYTmxJR2wwSUhSdklIWmxjbWxtZVNCMGFHRjBJSFJvWlNjc1hHNGdJQ0FnSUNBbmNISmxZMlZrYVc1bklHVjRjR1ZqZEdGMGFXOXVjeUJoY21VZ1lXTjBkV0ZzYkhrZ1ltVnBibWNnWlhobFkzVjBaV1F1Snl4Y2JpQWdJQ0FnSUNkQmJpQmxZWE41SUhkaGVTQjBieUJ6ZFhCd2IzSjBJSFJvYVhNZ2QyaGxiaUIxYzJsdVp5QmhJSFJsYzNRZ2NuVnVibVZ5SUdseklIUnZJSEpsYzJWMEp5eGNiaUFnSUNBZ0lDZDBhR1VnWTI5MWJuUmxjaUJpZVNCallXeHNhVzVuSUdCaGMzTXViV0Z5YTNNb0tXQWdiMjRnWVNCaVpXWnZjbVZGWVdOb0lHaHZiMnNnWVc1a0p5eGNiaUFnSUNBZ0lDZDBhR1Z1SUhabGNtbG1lU0JoZENCMGFHVWdaVzVrSUc5bUlIUmxjM1FnZDJsMGFDQmdZWE56TG0xaGNtdHpLRTRwWUNBb2QyaGxjbVVnVGlCcGN5Y3NYRzRnSUNBZ0lDQW5kR2hsSUc1MWJXSmxjaUJ2WmlCdFlYSnJjeUI1YjNVZ1pYaHdaV04wWldRcExpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJRzUxYkd3c1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdZWE56TG0xaGNtdHpMbU52ZFc1MFpYSWdLejBnTVR0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQXZMeUJLZFhOMElHRnNiRzkzSUdGdWVYUm9hVzVuSURvcFhHNGdJR0Z1ZVRvZ2UxeHVJQ0FnSUdobGJIQTZJQ2RCYkd4dmQzTWdZVzU1SUhaaGJIVmxJSGRwZEdodmRYUWdkR1Z6ZEdsdVp5QnBkQzRuTEZ4dUlDQWdJR1JsYzJNNklDZHBjeUJoYm5sMGFHbHVaeWNzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQXZMeUJCYm5sMGFHbHVaeUIwYUdGMElHbHpiaWQwSUc1MWJHd2diM0lnZFc1a1pXWnBibVZrWEc0Z0lHUmxabWx1WldRNklIdGNiaUFnSUNCb1pXeHdPaUFuUTJobFkydHpJR2xtSUhSb1pTQjJZV3gxWlNCcGN5QnViM1FnYm5Wc2JDQnZjaUIxYm1SbFptbHVaV1F1Snl4Y2JpQWdJQ0JrWlhOak9pQW5hWE1nWkdWbWFXNWxaQ2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUFrZXlCaFkzUjFZV3dnZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBaFBTQnVkV3hzTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnTHk4Z1EyaGxZMnNnYVdZZ2RHaGxJSFpoYkhWbElHbHpJR1Z0Y0hSNVhHNGdJR1Z0Y0hSNU9pQjdYRzRnSUNBZ2FHVnNjRG9nSjBOb1pXTnJjeUJwWmlCMGFHVWdkbUZzZFdVZ2FYTWdaVzF3ZEhrZ0tHOXlJR2hoY3lCaElHeGxibWQwYUNCdlppQXdLUzRuTEZ4dUlDQWdJR1JsYzJNNklDZHBjeUJsYlhCMGVTY3NYRzRnSUNBZ1ptRnBiRG9nSjNkaGN5QWtleUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUdGamRIVmhiQ0E5UFNCdWRXeHNJSHg4SUdGamRIVmhiQzVzWlc1bmRHZ2dQVDA5SURBN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCdVpXMXdkSGs2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkdWIyNUZiWEIwZVNjZ1hTeGNiaUFnSUNCb1pXeHdPaUFuUTJobFkydHpJR2xtSUhSb1pTQjJZV3gxWlNCcGN5QnViM1FnWlcxd2RIa2dLRzl5SUdoaGN5QmhJR3hsYm1kMGFDQm5jbVZoZEdWeUlIUm9ZVzRnTUNrdUp5eGNiaUFnSUNCa1pYTmpPaUFuYVhNZ2JtOTBJR1Z0Y0hSNUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklDUjdJR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWVdOMGRXRnNJQ0U5SUc1MWJHd2dKaVlnWVdOMGRXRnNMbXhsYm1kMGFDQStJREE3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0IwY25WMGFIazZJSHRjYmlBZ0lDQmhiR2xoYzJWek9pQmJJQ2QwY25WcGMyZ25JRjBzWEc0Z0lDQWdhR1ZzY0RvZ0oxUm9aU0IyWVd4MVpTQnphRzkxYkdRZ1ltVWdkSEoxZEdoNUlDaHViM1FnZFc1a1pXWnBibVZrTENCdWRXeHNMQ0F3TENCY0lsd2lJRzl5SUZ0ZEtTNG5MRnh1SUNBZ0lHUmxjMk02SUNkcGN5QjBjblYwYUhrbkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ0pIc2dZV04wZFdGc0lIMG5MRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUdsbUlDZ2hZV04wZFdGc0tTQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSGx3Wlc5bUlHRmpkSFZoYkM1c1pXNW5kR2dnUFQwOUlDZHVkVzFpWlhJbklEOGdZV04wZFdGc0xteGxibWQwYUNBK0lEQWdPaUIwY25WbE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ1ptRnNjM2s2SUh0Y2JpQWdJQ0JvWld4d09pQW5WR2hsSUhaaGJIVmxJSE5vYjNWc1pDQmlaU0JtWVd4emVTQW9kVzVrWldacGJtVmtMQ0J1ZFd4c0xDQXdMQ0JjSWx3aUlHOXlJRnRkS1M0bkxGeHVJQ0FnSUdSbGMyTTZJQ2RwY3lCbVlXeHplU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUI3ZXlCaFkzUjFZV3dnZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJR2xtSUNnaFlXTjBkV0ZzS1NCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGVYQmxiMllnWVdOMGRXRnNMbXhsYm1kMGFDQTlQVDBnSjI1MWJXSmxjaWNnUHlCaFkzUjFZV3d1YkdWdVozUm9JRDA5UFNBd0lEb2dabUZzYzJVN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lDOHZJRTVsWjJGMGFXOXVYRzRnSUc1dmREb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMjV2Snl3Z0owNVBKeXdnSjA1UFZDY2dYU3hjYmlBZ0lDQm9aV3h3T2lBblRtVm5ZWFJsY3lCMGFHVWdjbVZ6ZFd4MElHWnZjaUIwYUdVZ2NtVnpkQ0J2WmlCMGFHVWdaWGh3Y21WemMybHZiaTRuTEZ4dUlDQWdJR1JsYzJNNklDZE9iM1FoSnl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N0lHRmpkSFZoYkNCOWZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2h5WlhOdmJIWmxjaWtnZTF4dVhHNGdJQ0FnSUNBZ0lHbG1JQ2h5WlhOdmJIWmxjaTVsZUdoaGRYTjBaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lISmxjMjlzZG1WeUxtWnBibUZzYVhwbEtHWjFibU4wYVc5dUlDaG1hVzVoYkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQWhabWx1WVd3N1hHNGdJQ0FnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ5WlhOdmJIWmxjaWhoWTNSMVlXd3BPMXh1SUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnYVhNNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZGxjWFZoYkNjc0lDZGxjWFZoYkhNbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBOb1pXTnJjeUJ6ZEhKcFkzUWdaWEYxWVd4cGRIa2dZbVYwZDJWbGJpQjBhR1VnZG1Gc2RXVWdZVzVrSUdsMGN5QmxlSEJsWTNSbFpDNG5MRnh1SUNBZ0lDQWdKMDV2ZEdVNklHbG1JSFJvWlNCbGVIQmxZM1JsWkNCMllXeDFaU0JwY3lCaElHTm9ZV2x1SUdWNGNISmxjM05wYjI0Z2FYUmNYQ2RzYkNCaVpTQjBaWE4wWldRZ2FXNXpkR1ZoWkM0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5kRzhnYzNSeWFXTjBiSGtnWlhGMVlXd2dlM3RsZUhCbFkzUmxaSDE5Snl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N1lXTjBkV0ZzZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR1Y0Y0dWamRHVmtLU0I3WEc0Z0lDQWdJQ0F2THlCMGFHbHpJR2x6SUdFZ1ltbDBJR052Ym5SeWFYWmxaQ0JpZFhRZ2FYUWdiV0ZyWlhNZ1ptOXlJSE52YldVZ2JtbGpaU0J6ZVc1MFlYZ2dkRzhnWW1VZ1lXSnNaU0IwYjF4dUlDQWdJQ0FnTHk4Z2RYTmxJQzVwY3lCbWIzSWdjR0Z6YzJsdVp5QnBiaUJsZUhCbFkzUmhkR2x2Ym5OY2JpQWdJQ0FnSUdsbUlDaGhjM011UTJoaGFXNHVhWE5EYUdGcGJpaGxlSEJsWTNSbFpDa3BJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR1Y0Y0dWamRHVmtMblJsYzNRb1lXTjBkV0ZzS1R0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdGamRIVmhiQ0E5UFQwZ1pYaHdaV04wWldRN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCbGNUb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMlZ4YkNjc0lDZGxjV3h6SnlCZExGeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2REYUdWamEzTWdaR1ZsY0NCdWIyNHRjM1J5YVdOMElHVnhkV0ZzYVhSNUlHSmxkSGRsWlc0Z2RHaGxJSFpoYkhWbElHRnVaQ0JwZEhNZ1pYaHdaV04wWldRdUp5eGNiaUFnSUNBZ0lDZEpkQ0IxYm1SbGNuTjBZVzVrY3lCaGMzTWdaWGh3Y21WemMybHZibk1nYzI4Z2VXOTFJR05oYmlCamIyMWlhVzVsSUhSb1pXMGdZWFFnZDJsc2JDQnBiaUIwYUdVbkxGeHVJQ0FnSUNBZ0oyVjRjR1ZqZEdWa0lIWmhiSFZsTGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJsY1hWaGJDQjdlMlY0Y0dWamRHVmtmWDBuTEZ4dUlDQWdJR1poYVd3NklDZDNZWE1nZTN0aFkzUjFZV3g5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2daWGh3WldOMFpXUXBJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmZMbWx6UlhGMVlXd29ZV04wZFdGc0xDQmxlSEJsWTNSbFpDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJRzFoZEdOb09pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjFSeWFXVnpJSFJ2SUcxaGRHTm9JSFJvWlNCemRXSnFaV04wSUdGbllXbHVjM1FnZEdobElHVjRjR1ZqZEdWa0lIWmhiSFZsSUhkb2FXTm9JR05oYmlCaVpTQmxhWFJvWlhJbkxGeHVJQ0FnSUNBZ0oyRWdablZ1WTNScGIyNHNJR0Z1SUdGemN5QmxlSEJ5WlhOemFXOXVMQ0JoYmlCdlltcGxZM1FnZDJsMGFDQmhJQzUwWlhOMEtDa2dablZ1WTNScGIyNGdLR1p2Y2lBbkxGeHVJQ0FnSUNBZ0oybHVjM1JoYm1ObElHRWdVbVZuUlhod0tTQnZjaUJoSUhCc1lXbHVJRzlpYW1WamRDQjBieUJ3WVhKMGFXRnNiSGtnYldGMFkyZ2dZV2RoYVc1emRDQjBhR1VnZG1Gc2RXVXVKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nSjNSdklHMWhkR05vSUh0N1pYaHdaV04wWldSOWZTY3NYRzRnSUNBZ1ptRnBiRG9nSjNkaGN5QjdlMkZqZEhWaGJIMTlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCbGVIQmxZM1JsWkNrZ2UxeHVYRzRnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JR1Y0Y0dWamRHVmtMblJsYzNRZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUNFaFpYaHdaV04wWldRdWRHVnpkQ2hoWTNSMVlXd3BPMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0JwWmlBb1h5NXBjMUJzWVdsdVQySnFaV04wS0dWNGNHVmpkR1ZrS1NCOGZDQmZMbWx6UVhKeVlYa29aWGh3WldOMFpXUXBJSHg4SUY4dWFYTkJjbWQxYldWdWRITW9aWGh3WldOMFpXUXBLU0I3WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLR0ZqZEhWaGJDQTlQU0J1ZFd4c0tTQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1UzVndjRzl5ZENCd1lYTnphVzVuSUdCYkxDZG1iMjhuWFdBZ2RHOGdiV1ZoYmlCZ1cyRnpjeTVoYm5rc0lDZG1iMjhuWFdCY2JpQWdJQ0FnSUNBZ2FXWWdLRjh1YVhOQmNuSmhlU2hsZUhCbFkzUmxaQ2tnZkh3Z1h5NXBjMEZ5WjNWdFpXNTBjeWhsZUhCbFkzUmxaQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQmxlSEJsWTNSbFpDQTlJRjh1YldGd0tHVjRjR1ZqZEdWa0xDQm1kVzVqZEdsdmJpQW9kaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIUjVjR1Z2WmlCMklEMDlQU0FuZFc1a1pXWnBibVZrSnlBL0lHRnpjeTVoYm5rZ09pQjJPMXh1SUNBZ0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnTHk4Z1ZFOUVUem9nU1dSbFlXeHNlU0IzWlNCemFHOTFiR1FnWENKbWIzSnJYQ0lnZEdobElISmxjMjlzZG1WeUlITnZJSGRsSUdOaGJpQnpkWEJ3YjNKMFhHNGdJQ0FnSUNBZ0lDOHZJQ0FnSUNBZ0lHRnplVzVqSUhSbGMzUnpJR0Z1WkNCaGJITnZJSEJ5YjNacFpHVWdZbVYwZEdWeUlHWmhhV3gxY21VZ2JXVnpjMkZuWlhNdVhHNGdJQ0FnSUNBZ0lDOHZJQ0FnSUNBZ0lGVnVabTl5ZEhWdVlYUmxiSGtnZEdobElHTjFjbkpsYm5RZ1ptOXlhMmx1WnlCdFpXTm9ZVzVwYzIwZ1pHOWxjMjRuZENCM2IzSnJYRzRnSUNBZ0lDQWdJQzh2SUNBZ0lDQWdJR1p2Y2lCMGFHbHpJSFZ6WlNCallYTmxJSE5wYm1ObElIZGxJRzVsWldRZ2RHOGdZM0psWVhSbElHNWxkeUJqYUdGcGJuTWdabTl5WEc0Z0lDQWdJQ0FnSUM4dklDQWdJQ0FnSUdWaFkyZ2daWGh3WldOMFpXUWdhMlY1TGx4dUlDQWdJQ0FnSUNCMllYSWdabUZwYkhWeVpTQTlJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lGOG9aWGh3WldOMFpXUXBMbVYyWlhKNUtHWjFibU4wYVc5dUlDaDJZV3gxWlN3Z2EyVjVLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0ZmTG1oaGN5aGhZM1IxWVd3c0lHdGxlU2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1poYVd4MWNtVWdQU0FuYTJWNUlGd2lKeUFySUd0bGVTQXJJQ2RjSWlCdWIzUWdabTkxYm1RZ2FXNGdlM3RoWTNSMVlXeDlmU2M3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tDRmZMbWx6UlhGMVlXd29ZV04wZFdGc1cydGxlVjBzSUhaaGJIVmxLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdabUZwYkhWeVpTQTlJQ2RyWlhrZ1hDSW5JQ3NnYTJWNUlDc2dKMXdpSUdSdlpYTWdibTkwSUcxaGRHTm9JSHQ3WVdOMGRXRnNXMXdpSnlBcklHdGxlU0FySUNkY0lsMTlmU2M3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJtWVdsc2RYSmxPMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdWNGNHVmpkR1ZrSUNFOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFuWlhod1pXTjBaV1FnYVhNZ2JtOTBJR0VnWm5WdVkzUnBiMjRnWVc1a0lHUnZaWE1nYm05MElHaGhkbVVnWVNBdWRHVnpkQ0J0WlhSb2IyUW5PMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdJU0ZsZUhCbFkzUmxaQ2hoWTNSMVlXd3BPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0JoWW05MlpUb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMmQwSnl3Z0oyMXZjbVZVYUdGdUp5d2dKMmR5WldGMFpYSlVhR0Z1SnlCZExGeHVJQ0FnSUdobGJIQTZJQ2REYUdWamEzTWdhV1lnZEdobElIWmhiSFZsSUdseklHaHBaMmhsY2lCMGFHRnVJR2wwY3lCbGVIQmxZM1JsWkM0bkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQnRiM0psSUhSb1lXNGdlM3RsZUhCbFkzUmxaSDE5Snl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N1lXTjBkV0ZzZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR1Y0Y0dWamRHVmtLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZV04wZFdGc0lENGdaWGh3WldOMFpXUTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJR0psYkc5M09pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5iSFFuTENBbmJHVnpjMVJvWVc0bklGMHNYRzRnSUNBZ2FHVnNjRG9nSjBOb1pXTnJjeUJwWmlCMGFHVWdkbUZzZFdVZ2FYTWdiRzkzWlhJZ2RHaGhJR2wwY3lCbGVIQmxZM1JsWkM0bkxGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpTQnNaWE56SUhSb1lXNGdlM3RsZUhCbFkzUmxaSDE5Snl4Y2JpQWdJQ0JtWVdsc09pQW5kMkZ6SUh0N1lXTjBkV0ZzZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR1Y0Y0dWamRHVmtLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZV04wZFdGc0lEd2daWGh3WldOMFpXUTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJR0ZpYjNabFQzSkZjWFZoYkRvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oyeGxZWE4wSnl3Z0oyRjBUR1ZoYzNRbkxDQW5aM1JsSnl3Z0oyMXZjbVZVYUdGdVQzSkZjWFZoYkNjc0lDZG5jbVZoZEdWeVZHaGhiazl5UlhGMVlXd25JRjBzWEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05yY3lCcFppQjBhR1VnZG1Gc2RXVWdhWE1nYUdsbmFHVnlJRzl5SUdWeGRXRnNJSFJvWVc0Z2FYUnpJR1Y0Y0dWamRHVmtMaWNzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUcxdmNtVWdkR2hoYmlCdmNpQmxjWFZoYkNCMGJ5QWtlMlY0Y0dWamRHVmtmU2NzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUI3ZTJGamRIVmhiSDE5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBK1BTQmxlSEJsWTNSbFpEdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdZbVZzYjNkUGNrVnhkV0ZzT2lCN1hHNGdJQ0FnWVd4cFlYTmxjem9nV3lBbmJXOXpkQ2NzSUNkaGRFMXZjM1FuTENBbmJIUmxKeXdnSjJ4bGMzTlVhR0Z1VDNKRmNYVmhiQ2NnWFN4Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJ0eklHbG1JSFJvWlNCMllXeDFaU0JwY3lCc2IzZGxjaUJ2Y2lCbGNYVmhiQ0IwYUdGdUlHbDBjeUJsZUhCbFkzUmxaQzRuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCc1pYTnpJSFJvWVc0Z2IzSWdaWEYxWVd3Z2RHOGdKSHRsZUhCbFkzUmxaSDBuTEZ4dUlDQWdJR1poYVd3NklDZDNZWE1nSkh0aFkzUjFZV3g5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlHRmpkSFZoYkNBOFBTQmxlSEJsWTNSbFpEdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdZMnh2YzJVNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZGpiRzl6WlZSdkp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkRGFHVmphM01nYVdZZ2RHaGxJSFpoYkhWbElHbHpJR05zYjNObElIUnZJSFJvWlNCbGVIQmxZM1JsWkNCaVlYTmxaQ0J2YmlCaElHZHBkbVZ1SUdSbGJIUmhMaWNzWEc0Z0lDQWdJQ0FuVkdobElHUmxabUYxYkhRZ1pHVnNkR0VnYVhNZ01DNHhJSE52SUhSb1pTQjJZV3gxWlNBekxqVTFJR2x6SUdOc2IzTmxJSFJ2SUdGdWVTQjJZV3gxWlNCaVpYUjNaV1Z1Snl4Y2JpQWdJQ0FnSUNjekxqUTFJR0Z1WkNBekxqWTFJQ2hpYjNSb0lHbHVZMngxYzJsMlpTa3VKeXhjYmlBZ0lDQWdJQ2RUZEhKcGJtY2dkbUZzZFdWeklHRnlaU0JoYkhOdklITjFjSEJ2Y25SbFpDQmllU0JqYjIxd2RYUnBibWNnZEdobElHUnBjM1JoYm1ObElHSmxkSGRsWlc0Z2RHaGxiU2NzWEc0Z0lDQWdJQ0FuZFhOcGJtY2dkR2hsSUZOcFpuUTBJR0ZzWjI5eWFYUm9iUzRnUm05eUlITjBjbWx1WnlCMllXeDFaWE1nZEdobElHUmxiSFJoSUdseklHbHVkR1Z5Y0hKbGRHVmtJR0Z6Snl4Y2JpQWdJQ0FnSUNkaElIQmxjbU5sYm5SaFoyVWdLR2xsT2lBd0xqSTFJR2x6SURJMUpTa3VKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJR05zYjNObElIUnZJSHQ3SUdWNGNHVmpkR1ZrSUgxOUp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdJR0ZqZEhWaGJDQjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z1pYaHdaV04wWldRc0lHUmxiSFJoS1NCN1hHNGdJQ0FnSUNCa1pXeDBZU0E5SUdSbGJIUmhJRDA5SUc1MWJHd2dQeUF3TGpFZ09pQmtaV3gwWVR0Y2JseHVJQ0FnSUNBZ0x5OGdVM1Z3Y0c5eWRDQnpkSEpwYm1keklHSjVJR052YlhCMWRHbHVaeUIwYUdWcGNpQmthWE4wWVc1alpWeHVJQ0FnSUNBZ2FXWWdLRjh1YVhOVGRISnBibWNvWVdOMGRXRnNLU0FtSmlCZkxtbHpVM1J5YVc1bktHVjRjR1ZqZEdWa0tTa2dlMXh1SUNBZ0lDQWdJQ0IyWVhJZ1pHbG1aaUE5SUhWMGFXd3VjMmxtZERRb1lXTjBkV0ZzTENCbGVIQmxZM1JsWkN3Z015a2dMeUJOWVhSb0xtMWhlQ2hoWTNSMVlXd3ViR1Z1WjNSb0xDQmxlSEJsWTNSbFpDNXNaVzVuZEdncE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1pHbG1aaUE4UFNCa1pXeDBZVHRjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnY21WMGRYSnVJR0ZqZEhWaGJDQStQU0JsZUhCbFkzUmxaQ0F0SUdSbGJIUmhJQ1ltSUdGamRIVmhiQ0E4UFNCbGVIQmxZM1JsWkNBcklHUmxiSFJoTzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCcGJuTjBZVzVqWlc5bU9pQjdYRzRnSUNBZ1lXeHBZWE5sY3pvZ1d5QW5hVzV6ZEdGdVkyVlBaaWNzSUNkcGJuTjBZVzVqWlNjc0lDZHBjMkVuSUYwc1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKME5vWldOcmN5QnBaaUIwYUdVZ2RtRnNkV1VnYVhNZ1lXNGdhVzV6ZEdGdVkyVWdiMllnZEdobElHZHBkbVZ1SUdOdmJuTjBjblZqZEc5eUxpY3NYRzRnSUNBZ0lDQW5WMmhsYmlCMGFHVWdaWGh3WldOMFpXUWdhWE1nWVNCemRISnBibWNnYVhSY1hDZHNiQ0JoWTNSMVlXeHNlU0IxYzJVZ1lTQmdkSGx3Wlc5bVlDY3NYRzRnSUNBZ0lDQW5ZMjl0Y0dGeWFYTnZiaTRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbmRHOGdZbVVnWVc0Z2FXNXpkR0Z1WTJVZ2IyWWdlM3RsZUhCbFkzUmxaSDE5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdhV1lnS0Y4dWFYTlRkSEpwYm1jb1pYaHdaV04wWldRcEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBlWEJsYjJZZ1lXTjBkV0ZzSUQwOVBTQmxlSEJsWTNSbFpDQS9JSFJ5ZFdVZ09pQW5hR0ZrSUhSNWNHVWdlM3NnZEhsd1pXOW1JR0ZqZEhWaGJDQjlmU2M3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZV04wZFdGc0lHbHVjM1JoYm1ObGIyWWdaWGh3WldOMFpXUTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJSFI1Y0dWdlpqb2dlMXh1SUNBZ0lHaGxiSEE2SUNkRGFHVmphM01nYVdZZ2RHaGxJSFpoYkhWbElHbHpJRzltSUdFZ2MzQmxZMmxtYVdNZ2RIbHdaU2NzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR2hoZG1VZ2RIbHdaU0I3ZTJWNGNHVmpkR1ZrZlgwbkxGeHVJQ0FnSUdaaGFXdzZJQ2RvWVdRZ0pIc2dkSGx3Wlc5bUlHRmpkSFZoYkNCOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0JsZUhCbFkzUmxaQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRjh1YVhORmNYVmhiQ2gwZVhCbGIyWWdZV04wZFdGc0xDQmxlSEJsWTNSbFpDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnVkVzFpWlhJNklIdGNiaUFnSUNCb1pXeHdPaUFuUTJobFkyc2dhV1lnZEdobElIWmhiSFZsSUdseklHRWdiblZ0WW1WeUlDaGthV1ptWlhKbGJuUWdiMllnVG1GT0tTNG5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0JoSUc1MWJXSmxjaWNzWEc0Z0lDQWdabUZwYkRvZ0oyaGhaQ0IwZVhCbElDUjdJSFI1Y0dWdlppQmhZM1IxWVd3Z2ZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRjh1YVhOT2RXMWlaWElvWVdOMGRXRnNLU0FtSmlBaGFYTk9ZVTRvWVdOMGRXRnNLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJR0p2YjJ3NklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZGliMjlzWldGdUp5QmRMRnh1SUNBZ0lHaGxiSEE2SUNkRGFHVmpheUJwWmlCMGFHVWdkbUZzZFdVZ2FYTWdZU0JpYjI5c1pXRnVMaWNzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUdFZ1ltOXZiR1ZoYmljc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTkNiMjlzWldGdUtHRmpkSFZoYkNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCemRISnBibWM2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkemRISW5JRjBzWEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUdsbUlIUm9aU0IyWVd4MVpTQnBjeUJoSUhOMGNtbHVaeTRuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCaElITjBjbWx1Wnljc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTlRkSEpwYm1jb1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUc5aWFtVmpkRG9nZTF4dUlDQWdJR2hsYkhBNklDZERhR1ZqYXlCMGFHRjBJSFpoYkhWbElHbHpJRzltSUhSNWNHVWdiMkpxWldOMExpY3NYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJR0Z1SUc5aWFtVmpkQ2NzWEc0Z0lDQWdabUZwYkRvZ0oyaGhaQ0IwZVhCbElDUjdJSFI1Y0dWdlppQmhZM1IxWVd3Z2ZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRjh1YVhOUFltcGxZM1FvWVdOMGRXRnNLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJSEJzWVdsdVQySnFaV04wT2lCN1hHNGdJQ0FnWVd4cFlYTmxjem9nV3lBbmNHeGhhVzRuTENBbmIySnFKeUJkTEZ4dUlDQWdJR2hsYkhBNklDZERhR1ZqYTNNZ2RHaGhkQ0IyWVd4MVpTQnBjeUJoYmlCdlltcGxZM1FnWTNKbFlYUmxaQ0JpZVNCMGFHVWdUMkpxWldOMElHTnZibk4wY25WamRHOXlMaWNzWEc0Z0lDQWdabUZwYkRvZ0ozZGhjeUFrZTJGamRIVmhiSDBuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCZkxtbHpVR3hoYVc1UFltcGxZM1FvWVdOMGRXRnNLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJR0Z5Y21GNU9pQjdYRzRnSUNBZ2FHVnNjRG9nSjBOb1pXTnJJSFJvWVhRZ2RtRnNkV1VnYVhNZ1lXNGdRWEp5WVhrdUp5eGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdZVzRnUVhKeVlYa25MRnh1SUNBZ0lHWmhhV3c2SUNkb1lXUWdkSGx3WlNBa2V5QjBlWEJsYjJZZ1lXTjBkV0ZzSUgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmZMbWx6UVhKeVlYa29ZV04wZFdGc0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc0Z0lHWjFibU4wYVc5dU9pQjdYRzRnSUNBZ2FHVnNjRG9nSjBOb1pXTnJJSFJvWVhRZ2RtRnNkV1VnYVhNZ1lTQkdkVzVqZEdsdmJpNG5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0JoSUVaMWJtTjBhVzl1Snl4Y2JpQWdJQ0JtWVdsc09pQW5hR0ZrSUhSNWNHVWdKSHNnZEhsd1pXOW1JR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWHk1cGMwWjFibU4wYVc5dUtHRmpkSFZoYkNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCeVpXZGxlSEE2SUh0Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJzZ2RHaGhkQ0IyWVd4MVpTQnBjeUJoSUZKbFowVjRjQ2NzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUdFZ1VtVm5SWGh3Snl4Y2JpQWdJQ0JtWVdsc09pQW5hR0ZrSUhSNWNHVWdKSHNnZEhsd1pXOW1JR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWHk1cGMxSmxaMFY0Y0NoaFkzUjFZV3dwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnWkdGMFpUb2dlMXh1SUNBZ0lHaGxiSEE2SUNkRGFHVmpheUIwYUdGMElIWmhiSFZsSUdseklHRWdSR0YwWlNjc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHRWdSR0YwWlNjc1hHNGdJQ0FnWm1GcGJEb2dKMmhoWkNCMGVYQmxJQ1I3SUhSNWNHVnZaaUJoWTNSMVlXd2dmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTkVZWFJsS0dGamRIVmhiQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVJQ0JsYkdWdFpXNTBPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUhSb1lYUWdkbUZzZFdVZ2FYTWdZU0JFVDAwZ1pXeGxiV1Z1ZENjc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHRWdSRTlOSUdWc1pXMWxiblFuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCZkxtbHpSV3hsYldWdWRDaGhZM1IxWVd3cE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ1pYSnliM0k2SUh0Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJzZ2RHaGhkQ0IyWVd4MVpTQnBjeUJoYmlCbGNuSnZjaUFvYjNJZ2JHOXZhM01nYkdsclpTQnBkQ2tuTEZ4dUlDQWdJR1JsYzJNNklDZDBieUJpWlNCaGJpQkZjbkp2Y2ljc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdhV1lnS0dGamRIVmhiQ0JwYm5OMFlXNWpaVzltSUVWeWNtOXlLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2NtVjBkWEp1SUY4dWFYTlBZbXBsWTNRb1lXTjBkV0ZzS1NBbUppQmZMbWx6VTNSeWFXNW5LR0ZqZEhWaGJDNXVZVzFsS1NBbUppQmZMbWx6VTNSeWFXNW5LR0ZqZEhWaGJDNXRaWE56WVdkbEtUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdkVzVrWldacGJtVmtPaUI3WEc0Z0lDQWdhR1ZzY0RvZ0owTm9aV05ySUhSb1lYUWdkbUZzZFdVZ2FYTWdkVzVrWldacGJtVmtMaWNzWEc0Z0lDQWdaR1Z6WXpvZ0ozUnZJR0psSUhWdVpHVm1hVzVsWkNjc1hHNGdJQ0FnWm1GcGJEb2dKM2RoY3lBa2V5QmhZM1IxWVd3Z2ZTY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRjh1YVhOVmJtUmxabWx1WldRb1lXTjBkV0ZzS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzRnSUc1MWJHdzZJSHRjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnNnZEdoaGRDQjJZV3gxWlNCcGN5QnVkV3hzTGljc1hHNGdJQ0FnWkdWell6b2dKM1J2SUdKbElHNTFiR3duTEZ4dUlDQWdJR1poYVd3NklDZDNZWE1nSkhzZ1lXTjBkV0ZzSUgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmhZM1IxWVd3Z1BUMDlJRzUxYkd3N1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCT1lVNDZJSHRjYmlBZ0lDQm9aV3h3T2lBblEyaGxZMnNnZEdoaGRDQjJZV3gxWlNCcGN5Qk9ZVTR1Snl4Y2JpQWdJQ0JrWlhOak9pQW5kRzhnWW1VZ1RtRk9KeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCcFppQW9YeTVwYzA1MWJXSmxjaWhoWTNSMVlXd3BLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVabUZwYkNBOUlDZDNZWE1nSkh0aFkzUjFZV3g5Snp0Y2JpQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVabUZwYkNBOUlDZG9ZV1FnZEhsd1pTQWtlM1I1Y0dWdlppQmhZM1IxWVd4OUp6dGNiaUFnSUNBZ0lIMWNiaUFnSUNBZ0lISmxkSFZ5YmlCcGMwNWhUaWhoWTNSMVlXd3BPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdkSEoxWlRvZ2UxeHVJQ0FnSUdobGJIQTZJQ2REYUdWamF5QjBhR0YwSUhaaGJIVmxJR2x6SUhSeWRXVW5MRnh1SUNBZ0lHUmxjMk02SUNkMGJ5QmlaU0IwY25WbEp5eGNiaUFnSUNCbVlXbHNPaUFuZDJGeklIdDdJR0ZqZEhWaGJDQjlmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2FXWWdLRjh1YVhOQ2IyOXNaV0Z1S0dGamRIVmhiQ2twSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdGamRIVmhiQ0E5UFNCMGNuVmxJRDhnZEhKMVpTQTZJQ2QzWVhNZ2UzdGhZM1IxWVd4OWZTYzdYRzRnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0oyaGhaQ0IwZVhCbElDUjdkSGx3Wlc5bUlHRmpkSFZoYkgwbk8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ1ptRnNjMlU2SUh0Y2JpQWdJQ0JvWld4d09pQW5RMmhsWTJzZ2RHaGhkQ0IyWVd4MVpTQnBjeUJtWVd4elpTY3NYRzRnSUNBZ1pHVnpZem9nSjNSdklHSmxJR1poYkhObEp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0JwWmlBb1h5NXBjMEp2YjJ4bFlXNG9ZV04wZFdGc0tTa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZV04wZFdGc0lEMDlJR1poYkhObElEOGdkSEoxWlNBNklDZDNZWE1nZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnSjJoaFpDQjBlWEJsSUNSN2RIbHdaVzltSUdGamRIVmhiSDBuTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCeVlXbHpaWE02SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkMGFISnZkM01uSUYwc1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKME5vWldOcmN5QjBhR0YwSUdWNFpXTjFkR2x1WnlCMGFHVWdkbUZzZFdVZ2NtVnpkV3gwY3lCcGJpQmhiaUJsZUdObGNIUnBiMjRnWW1WcGJtY2dkR2h5YjNkdUxpY3NYRzRnSUNBZ0lDQW5WR2hsSUdOaGNIUjFjbVZrSUdWNFkyVndkR2x2YmlCMllXeDFaU0JwY3lCMWMyVmtJSFJ2SUcxMWRHRjBaU0IwYUdVZ2MzVmlhbVZqZENCbWIzSWdkR2hsSnl4Y2JpQWdJQ0FnSUNkbWIyeHNiM2RwYm1jZ1pYaHdaV04wWVhScGIyNXpMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNkMGFISnZkM01nWVc0Z1pYSnliM0luTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lHVjRjR1ZqZEdWa0tTQjdYRzRnSUNBZ0lDQnBaaUFvSVY4dWFYTkdkVzVqZEdsdmJpaGhZM1IxWVd3cEtTQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQW5hWE1nYm05MElHRWdablZ1WTNScGIyNDZJSHQ3WVdOMGRXRnNmWDBuTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCMGNua2dlMXh1SUNBZ0lDQWdJQ0JoWTNSMVlXd29LVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJQ2RrYVdRZ2JtOTBJSFJvY205M0lHRnVlWFJvYVc1bkp6dGNiaUFnSUNBZ0lIMGdZMkYwWTJnZ0tHVXBJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHVjRjR1ZqZEdWa0lEMDlJRzUxYkd3cElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdhV1lnS0Y4dWFYTkdkVzVqZEdsdmJpaGxlSEJsWTNSbFpDa2dKaVlnWlNCcGJuTjBZVzVqWlc5bUlHVjRjR1ZqZEdWa0tTQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWJYVjBZWFJsS0dVcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR2xtSUNoZkxtbHpSWEYxWVd3b1pTd2daWGh3WldOMFpXUXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXViWFYwWVhSbEtHVXBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdRWFZuYldWdWRDQjBhR1VnWlhod1pXTjBZWFJwYjI0Z2IySnFaV04wSUhkcGRHZ2dZU0J1WlhjZ2RHVnRjR3hoZEdVZ2RtRnlhV0ZpYkdWY2JpQWdJQ0FnSUNBZ2RHaHBjeTVsZUdObGNIUnBiMjRnUFNCbE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0oyZHZkQ0I3ZXlCbGVHTmxjSFJwYjI0Z2ZYMG5PMXh1SUNBZ0lDQWdmVnh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0JvWVhNNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZG9ZWFpsSnl3Z0oyTnZiblJoYVc0bkxDQW5ZMjl1ZEdGcGJuTW5JRjBzWEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owTm9aV05ySUdsbUlIUm9aU0IyWVd4MVpTQm9ZWE1nYzI5dFpTQmxlSEJsWTNSbFpDQjJZV3gxWlM0Z1NYUWdkVzVrWlhKemRHRnVaSE1nWlhod1pXTjBaV1FuTEZ4dUlDQWdJQ0FnSjJOb1lXbHVJR1Y0Y0hKbGMzTnBiMjV6SUhOdklIUm9hWE1nYzJWeWRtVnpJR0Z6SUhSb1pTQmxjWFZwZG1Gc1pXNTBJRzltSUM1bGNTQm1iM0lnY0dGeWRHbGhiQ2NzWEc0Z0lDQWdJQ0FuYldGMFkyaGxjeTRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbmRHOGdZMjl1ZEdGcGJpQjdlMlY0Y0dWamRHVmtmWDBuTEZ4dUlDQWdJR1poYVd3NklDZDNZWE1nZTN0aFkzUjFZV3g5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2dZWEpuTVNBdktpd2dMaTR1SUNvdktTQjdYRzVjYmlBZ0lDQWdJQzh2SUdGc2JHOTNJRzExYkhScGNHeGxJR1Y0Y0dWamRHVmtJSFpoYkhWbGMxeHVJQ0FnSUNBZ2RtRnlJR1Y0Y0dWamRHVmtJRDBnWHk1MGIwRnljbUY1S0dGeVozVnRaVzUwY3lrdWMyeHBZMlVvTVNrN1hHNGdJQ0FnSUNCMGFHbHpMbVY0Y0dWamRHVmtJRDBnWlhod1pXTjBaV1F1YkdWdVozUm9JRDA5UFNBeElEOGdaWGh3WldOMFpXUmJNRjBnT2lCbGVIQmxZM1JsWkR0Y2JseHVJQ0FnSUNBZ2FXWWdLQ0ZmTG1selUzUnlhVzVuS0dGamRIVmhiQ2tnSmlZZ0lWOHVhWE5CY25KaGVTaGhZM1IxWVd3cElDWW1JQ0ZmTG1selQySnFaV04wS0dGamRIVmhiQ2twSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUNkbmIzUWdlM3RoWTNSMVlXeDlmU2M3WEc0Z0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUhKbGRIVnliaUJmTG1WMlpYSjVLR1Y0Y0dWamRHVmtMQ0JtZFc1amRHbHZiaUFvWlhod1pXTjBaV1FwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLRjh1YVhOVGRISnBibWNvWVdOMGRXRnNLU0FtSmlCZkxtbHpVM1J5YVc1bktHVjRjR1ZqZEdWa0tTa2dlMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUF0TVNBaFBUMGdZV04wZFdGc0xtbHVaR1Y0VDJZb1pYaHdaV04wWldRcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tGOHVhWE5CY25KaGVTaGhZM1IxWVd3cEtTQjdYRzRnSUNBZ0lDQWdJQ0FnTHk4Z1ZFOUVUem9nU1hOdUozUWdkR2hsY21VZ1lXNGdaV0Z6YVdWeUlIZGhlU0IwYnlCMFpYTjBJSFJvYVhNZ2RYTnBibWNnYkc5a1lYTm9JRzl1YkhrL1hHNGdJQ0FnSUNBZ0lDQWdhV1lnS0NGaGMzTXVRMmhoYVc0dWFYTkRhR0ZwYmlobGVIQmxZM1JsWkNrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdWNGNHVmpkR1ZrSUQwZ1lYTnpMbVZ4S0dWNGNHVmpkR1ZrS1R0Y2JpQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJQzB4SUNFOVBTQmZMbVpwYm1SSmJtUmxlQ2hoWTNSMVlXd3NJR1Y0Y0dWamRHVmtLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDOHZJRWhoWTJzNklFTnZiWEJoY21VZ2IySnFaV04wY3lCM2FYUm9JQzUzYUdWeVpTQmllU0JtYVd4MFpYSnBibWNnWVNCM2NtRndjR1Z5SUdGeWNtRjVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQXhJRDA5UFNCZkxuZG9aWEpsS0Z0aFkzUjFZV3hkTENCbGVIQmxZM1JsWkNrdWJHVnVaM1JvTzF4dUlDQWdJQ0FnZlNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1SUNCb1lYTlBkMjQ2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkb1lYTkxaWGtuTENBbmFHRnpTVzVrWlhnbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBOb1pXTnJJR2xtSUhSb1pTQjJZV3gxWlNCb1lYTWdiMjVsSUc5eUlHMXZjbVVnYjNkdUlIQnliM0JsY25ScFpYTWdZWE1nWkdWbWFXNWxaQ0JpZVNjc1hHNGdJQ0FnSUNBbmRHaGxJR2RwZG1WdUlHRnlaM1Z0Wlc1MGN5NG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZEc4Z2FHRjJaU0J2ZDI0Z2NISnZjR1Z5ZEhrZ0pIc2daWGh3WldOMFpXUWdmU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z1pYaHdaV04wWldRcElIdGNiaUFnSUNBZ0lHbG1JQ2doWHk1cGMwOWlhbVZqZENoaFkzUjFZV3dwS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBbmQyRnpJSHQ3WVdOMGRXRnNmWDBuTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCMGFHbHpMbVpoYVd3Z1BTQW5iMjVzZVNCb1lXUWdlM3NnWHk1clpYbHpLR0ZqZEhWaGJDa2dmWDBuTzF4dVhHNGdJQ0FnSUNBdkx5QlVUMFJQT2lCUFptWmxjaUJpWlhSMFpYSWdabUZwYkhWeVpTQnRaWE56WVdkbFhHNGdJQ0FnSUNCMllYSWdZWEpuY3lBOUlGOHVkRzlCY25KaGVTaGhjbWQxYldWdWRITXBMbk5zYVdObEtERXBPMXh1SUNBZ0lDQWdjbVYwZFhKdUlGOHVaWFpsY25rb1lYSm5jeXdnWm5WdVkzUnBiMjRnS0hncElIc2djbVYwZFhKdUlGOHVhR0Z6S0dGamRIVmhiQ3dnZUNrN0lIMHBPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0JzYjJjNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuUkhWdGNITWdkR2hsSUhKbFkyVnBkbVZrSUhaaGJIVmxJSFJ2SUhSb1pTQmpiMjV6YjJ4bExpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJRzUxYkd3c1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdZMjl1YzI5c1pTNXNiMmNvSjF0QlUxTmRKeXdnWVdOMGRXRnNLVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dUlDQWdJSDFjYmlBZ2ZTeGNiaUFnWkhWdGNEb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkRWRXMXdjeUIwYUdVZ2NtVmpaV2wyWldRZ2RtRnNkV1VnZEc4Z2RHaGxJR052Ym5OdmJHVWdZWEJ3YkhscGJtY2dkR2hsSUdkcGRtVnVJSFJsYlhCc1lYUmxMaWNzWEc0Z0lDQWdJQ0FuVG05MFpUb2dWWE5sSUNSN2RHaHBjMzBnZEc4Z2FXNTBaWEp3YjJ4aGRHVWdkR2hsSUhkb2IyeGxJSFpoYkhWbExpY3NYRzRnSUNBZ0lDQW5VMlZsT2lCb2RIUndjem92TDJ4dlpHRnphQzVqYjIwdlpHOWpjeU4wWlcxd2JHRjBaU2RjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUc1MWJHd3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ3dnZEhCc0tTQjdYRzRnSUNBZ0lDQjJZWElnY21WemRXeDBJRDBnZFhScGJDNTBaVzF3YkdGMFpTNWpZV3hzS0dGamRIVmhiQ3dnZEhCc0xDQmhZM1IxWVd3cE8xeHVJQ0FnSUNBZ1kyOXVjMjlzWlM1c2IyY29jbVZ6ZFd4MEtUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdaR1ZpZFdkblpYSTZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblNHRnNkSE1nYzJOeWFYQjBJR1Y0WldOMWRHbHZiaUJpZVNCMGNtbG5aMlZ5YVc1bklIUm9aU0JwYm5SbGNtRmpkR2wyWlNCa1pXSjFaMmRsY2k0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQnVkV3hzTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lHUmxZblZuWjJWeU8xeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJSFJoY0RvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oyWnVKeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZERZV3hzY3lCMGFHVWdjSEp2ZG1sa1pXUWdablZ1WTNScGIyNGdkMmwwYUNCMGFHVWdZM1Z5Y21WdWRDQjJZV3gxWlNCaGN5QmhjbWQxYldWdWRDNG5MRnh1SUNBZ0lDQWdKMGxtSUhSb1pTQm1kVzVqZEdsdmJpQnlaWFIxY201eklITnZiV1YwYUdsdVp5QmthV1ptWlhKbGJuUWdkRzhnS25WdVpHVm1hVzVsWkNvZ2RHaGxKeXhjYmlBZ0lDQWdJQ2RsZUhCeVpYTnphVzl1SUhkcGJHd2dabTl5YXlCMGJ5QnZjR1Z5WVhSbElHOXVJSFJvWlNCeVpYUjFjbTVsWkNCMllXeDFaUzRuTEZ4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0oyTmhiR3dnZTN0aGNtY3hmWDBuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lHWnVLU0I3WEc0Z0lDQWdJQ0IyWVhJZ2NtVnpkV3gwSUQwZ1ptNG9ZV04wZFdGc0tUdGNiaUFnSUNBZ0lHbG1JQ2gwZVhCbGIyWWdjbVZ6ZFd4MElDRTlQU0FuZFc1a1pXWnBibVZrSnlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9jbVZ6ZFd4MEtUdGNiaUFnSUNBZ0lIMWNiaUFnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdibTkwYVdaNU9pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjFOcGJXbHNZWElnZEc4Z0xuUmhjQ2dwSUdKMWRDQnBkQ0IzYjI1Y1hDZDBJSEJoYzNNZ2RHaGxJR04xY25KbGJuUWdkbUZzZFdVZ1lYTWdZWEpuZFcxbGJuUXNKeXhjYmlBZ0lDQWdJQ2RwYm5OMFpXRmtJR2wwSUhkcGJHd2dZbVVnY0hKdmRtbGtaV1FnWVhNZ2RHaGxJR0IwYUdsellDQmpiMjUwWlhoMElIZG9aVzRnY0dWeVptOXliV2x1WnlCMGFHVW5MRnh1SUNBZ0lDQWdKMk5oYkd3dUlGUm9hWE1nWVd4c2IzZHpJR2wwSUhSdklHSmxJSFZ6WldRZ2QybDBhQ0IwWlhOMElISjFibTVsY25NZ1lHUnZibVZnSUhOMGVXeGxJR05oYkd4aVlXTnJjeTRuTEZ4dUlDQWdJQ0FnSjA1dmRHVWdkR2hoZENCcGRDQjNhV3hzSUc1bGFYUm9aWElnYlhWMFlYUmxJSFJvWlNCMllXeDFaU0JsZG1WdUlHbG1JR2wwSUhKbGRIVnlibk1nYzI5dFpYUm9hVzVuTGlkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZHViM1JwWm5rZ2UzdGhjbWN4ZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3NJR1p1S1NCN1hHNGdJQ0FnSUNCbWJpNWpZV3hzS0dGamRIVmhiQ2s3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2MybDZaVG9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEdiM0pyY3lCMGFHVWdaWGh3WldOMFlYUnBiMjRnZEc4Z2IzQmxjbUYwWlNCdmJpQjBhR1VnYzJsNlpTQnZaaUIwYUdVZ1kzVnljbVZ1ZENCMllXeDFaUzRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbloyVjBJSE5wZW1VbkxGeHVJQ0FnSUdaaGFXdzZJQ2R1YjNRZ2FHRnpJR0VnYkdWdVozUm9PaUI3ZXlCaFkzUjFZV3dnZlgwbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJR2xtSUNoZkxtbHpUMkpxWldOMEtHRmpkSFZoYkNrZ2ZId2dYeTVwYzBGeWNtRjVLR0ZqZEhWaGJDa2dmSHdnWHk1cGMxTjBjbWx1WnloaFkzUjFZV3dwS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTExZEdGMFpTaGZMbk5wZW1Vb1lXTjBkV0ZzS1NrN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNGdJSEJ5YjNBNklIdGNiaUFnSUNCaGJHbGhjMlZ6T2lCYklDZHJaWGtuTENBbmNISnZjR1Z5ZEhrbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBadmNtdHpJSFJvWlNCbGVIQmxZM1JoZEdsdmJpQjBieUJ2Y0dWeVlYUmxJRzl1SUc5dVpTQnZaaUIwYUdVZ2RtRnNkV1VnY0hKdmNHVnlkR2xsY3k0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5aMlYwSUhCeWIzQmxjblI1SUh0N0lHRnlaekVnZlgwbkxGeHVJQ0FnSUdaaGFXdzZJQ2QzWVhNZ2JtOTBJR1p2ZFc1a0lHOXVJSHQ3SUdGamRIVmhiQ0I5ZlNjc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDd2dhMlY1S1NCN1hHNGdJQ0FnSUNCcFppQW9YeTVwYzA5aWFtVmpkQ2hoWTNSMVlXd3BLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaHJaWGtnYVc0Z1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLR0ZqZEhWaGJGdHJaWGxkS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSFJvYVhNdWEyVjVjeUE5SUZ0ZE8xeHVJQ0FnSUNBZ0lDQmZMbVp2Y2tsdUtHRmpkSFZoYkN3Z1puVnVZM1JwYjI0Z0tIWXNJR3NwSUhzZ2RHaHBjeTVyWlhsekxuQjFjMmdvYXlrN0lIMHNJSFJvYVhNcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0ozZGhjeUJ1YjNRZ1ptOTFibVFnYVc0Z2EyVjVjeUI3ZXlCclpYbHpJSDE5Snp0Y2JpQWdJQ0FnSUgxY2JpQWdJQ0FnSUhKbGRIVnliaUFuWjI5MElIdDdZV04wZFdGc2ZYMG5PMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdZWFE2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkcGJtUmxlQ2NnWFN4Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5UWFYwWVhSbGN5QjBhR1VnZG1Gc2RXVWdkRzhnYjNCbGNtRjBaU0J2YmlCdmJtVWdiMllnZEdobElHbHVaR1Y0WldRZ1pXeGxiV1Z1ZEhNdUlFbG1KeXhjYmlBZ0lDQWdJQ2R0ZFd4MGFYQnNaU0JwYm1SbGVHVnpJR0Z5WlNCd2NtOTJhV1JsWkNCaGJpQmhjbkpoZVNCcGN5QmpiMjF3YjNObFpDQjNhWFJvSUhSb1pXMHVKeXhjYmlBZ0lDQWdJQ2RPYjNSbE9pQkpkQ0J6ZFhCd2IzSjBjeUJ1WldkaGRHbDJaU0JwYm1SbGVHVnpKMXh1SUNBZ0lGMHNYRzRnSUNBZ1pHVnpZem9nSjJkbGRDQnBibVJsZUNBa2V5QmhjbWR6TG1wdmFXNG9YQ0lzSUZ3aUtTQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCcGJtUmxlQ2tnZTF4dUlDQWdJQ0FnYVdZZ0tDRmZMbWx6UVhKeVlYa29ZV04wZFdGc0tTQW1KaUFoWHk1cGMxTjBjbWx1WnloaFkzUjFZV3dwS1NCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBbmJtOTBJR0Z1SUdGeWNtRjVJRzl5SUdFZ2MzUnlhVzVuT2lBa2UyRmpkSFZoYkgwbk8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQjJZWElnYVc1a1pYaGxjeUE5SUY4dWRHOUJjbkpoZVNoaGNtZDFiV1Z1ZEhNcExuTnNhV05sS0RFcE8xeHVJQ0FnSUNBZ2RtRnlJR1ZzWlcxeklEMGdXMTA3WEc1Y2JpQWdJQ0FnSUdadmNpQW9kbUZ5SUdrZ1BTQXdPeUJwSUR3Z2FXNWtaWGhsY3k1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0IyWVhJZ2FXUjRJRDBnYVc1a1pYaGxjMXRwWFR0Y2JseHVJQ0FnSUNBZ0lDQnBaSGdnUFNCcFpIZ2dQQ0F3SUQ4Z1lXTjBkV0ZzTG14bGJtZDBhQ0FySUdsa2VDQTZJR2xrZUR0Y2JpQWdJQ0FnSUNBZ2FXWWdLR2xrZUNBOElEQWdmSHdnYVdSNElENDlJR0ZqZEhWaGJDNXNaVzVuZEdncElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdhV1I0SUNzZ0p5QnZkWFFnYjJZZ1ltOTFibVJ6SUdadmNpQjdlMkZqZEhWaGJIMTlKenRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHVnNaVzF6TG5CMWMyZ29ZV04wZFdGc1cybGtlRjBwTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1hHNGdJQ0FnSUNBZ0lHVnNaVzF6TG14bGJtZDBhQ0E5UFQwZ01TQS9JR1ZzWlcxeld6QmRJRG9nWld4bGJYTmNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dVhHNGdJR3RsZVhNNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuVFhWMFlYUmxjeUIwYUdVZ2RtRnNkV1VnZEc4Z2IzQmxjbUYwWlNCdmJpQnBkSE1nYkdsemRDQnZaaUJ2ZDI0Z2EyVjVjeTRuWEc0Z0lDQWdYU3hjYmlBZ0lDQmtaWE5qT2lBbloyVjBJR3RsZVhNbkxGeHVJQ0FnSUhSbGMzUTZJR1oxYm1OMGFXOXVJQ2hoWTNSMVlXd3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2hjYmlBZ0lDQWdJQ0FnWHk1clpYbHpLR0ZqZEhWaGJDbGNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQjJZV3gxWlhNNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuVFhWMFlYUmxjeUIwYUdVZ2RtRnNkV1VnZEc4Z2IzQmxjbUYwWlNCdmJpQnBkSE1nYkdsemRDQnZaaUIyWVd4MVpYTW5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuWjJWMElIWmhiSFZsY3ljc1hHNGdJQ0FnZEdWemREb2dablZ1WTNScGIyNGdLR0ZqZEhWaGJDa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLRnh1SUNBZ0lDQWdJQ0JmTG5aaGJIVmxjeWhoWTNSMVlXd3BYRzRnSUNBZ0lDQXBPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JseHVJQ0J6YkdsalpUb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkRmVIUnlZV04wY3lCaElIQnZjblJwYjI0Z1puSnZiU0IwYUdVZ2RtRnNkV1V1SjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0ozTnNhV05sS0h0N1lXTjBkV0ZzZlgwc0lDUjdZWEpuTVNCOGZDQXdmU2tuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lITjBZWEowTENCbGJtUXBJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG0xMWRHRjBaU2hjYmlBZ0lDQWdJQ0FnWHk1MGIwRnljbUY1S0dGamRIVmhiQ2t1YzJ4cFkyVW9jM1JoY25Rc0lHVnVaQ2xjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUdacGJIUmxjam9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEpkR1Z5WVhSbGN5QnZkbVZ5SUdWc1pXMWxiblJ6SUc5bUlIUm9aU0JqYjJ4c1pXTjBhVzl1TENCbWIzSnJhVzVuSUhSb1pTQmxlSEJsWTNSaGRHbHZiaUIwYnljc1hHNGdJQ0FnSUNBbmIzQmxjbUYwWlNCdmJpQmhiaUJoY25KaGVTQjNhWFJvSUdGc2JDQjBhR1VnWld4bGJXVnVkSE1nWm05eUlIZG9hV05vSUhSb1pTQmpZV3hzWW1GamF5QnlaWFIxY201bFpDY3NYRzRnSUNBZ0lDQW5kSEoxZEdoNUlHWnZjaTRuTEZ4dUlDQWdJQ0FnSjFObFpUb2dhSFIwY0hNNkx5OXNiMlJoYzJndVkyOXRMMlJ2WTNNalptbHNkR1Z5SjF4dUlDQWdJRjBzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z1kyRnNiR0poWTJzc0lIUm9hWE5CY21jcElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTExZEdGMFpTaGNiaUFnSUNBZ0lDQWdYeTVtYVd4MFpYSW9ZV04wZFdGc0xDQmpZV3hzWW1GamF5d2dkR2hwYzBGeVp5bGNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnlaV3BsWTNRNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuU1hSbGNtRjBaWE1nYjNabGNpQmxiR1Z0Wlc1MGN5QnZaaUJqYjJ4c1pXTjBhVzl1TENCbWIzSnJhVzVuSUhSb1pTQmxlSEJsWTNSaGRHbHZiaUIwYnlCdmNHVnlZWFJsSnl4Y2JpQWdJQ0FnSUNkdmJpQmhiaUJoY25KaGVTQjNhWFJvSUdGc2JDQjBhR1VnWld4bGJXVnVkSE1nWm05eUlIZG9hV05vSUhSb1pTQmpZV3hzWW1GamF5QnlaWFIxY201bFpDQm1ZV3h6ZVNjc1hHNGdJQ0FnSUNBblptOXlJQ2gwYUdVZ2IzQndiM05wZEdVZ2IyWWdMbVpwYkhSbGNpa3VKeXhjYmlBZ0lDQWdJQ2RUWldVNklHaDBkSEJ6T2k4dmJHOWtZWE5vTG1OdmJTOWtiMk56STNKbGFtVmpkQ2RjYmlBZ0lDQmRMRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dzSUdOaGJHeGlZV05yTENCMGFHbHpRWEpuS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN5NXRkWFJoZEdVb1hHNGdJQ0FnSUNBZ0lGOHVjbVZxWldOMEtHRmpkSFZoYkN3Z1kyRnNiR0poWTJzc0lIUm9hWE5CY21jcFhHNGdJQ0FnSUNBcE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQjNhR1Z5WlRvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RRWlhKbWIzSnRjeUJoSUdSbFpYQWdZMjl0Y0dGeWFYTnZiaUJ2WmlCbFlXTm9JR1ZzWlcxbGJuUWdhVzRnWVNCamIyeHNaV04wYVc5dUlIUnZJSFJvWlNCbmFYWmxiaWNzWEc0Z0lDQWdJQ0FuY0hKdmNHVnlkR2xsY3lCdlltcGxZM1FzSUdadmNtdHBibWNnZEdobElHVjRjR1ZqZEdGMGFXOXVJSFJ2SUc5d1pYSmhkR1VnYjI0Z1lXNGdZWEp5WVhrZ2IyWWdZV3hzSnl4Y2JpQWdJQ0FnSUNkbGJHVnRaVzUwY3lCMGFHRjBJR2hoZG1VZ1pYRjFhWFpoYkdWdWRDQndjbTl3WlhKMGVTQjJZV3gxWlhNdUp5eGNiaUFnSUNBZ0lDZFRaV1U2SUdoMGRIQnpPaTh2Ykc5a1lYTm9MbU52YlM5a2IyTnpJM2RvWlhKbEoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dKM2RvWlhKbElIdDdZWEpuTVgxOUp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0J3Y205d2N5a2dlMXh1SUNBZ0lDQWdhV1lnS0NGZkxtbHpVR3hoYVc1UFltcGxZM1FvY0hKdmNITXBLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFuY0hKdmNITWdhWE1nYm05MElHRnVJRzlpYW1WamRDYzdYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9YRzRnSUNBZ0lDQWdJRjh1ZDJobGNtVW9ZV04wZFdGc0xDQndjbTl3Y3lsY2JpQWdJQ0FnSUNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lHMWhjRG9nZTF4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEdiM0pyY3lCMGFHVWdaWGh3WldOMFlYUnBiMjRnZEc4Z2IzQmxjbUYwWlNCdmJpQmhiaUJoY25KaGVTQm9iMnhrYVc1bklIUm9aU0J5WlhOMWJIUnpJRzltSnl4Y2JpQWdJQ0FnSUNkcGJuWnZhMmx1WnlCMGFHVWdZMkZzYkdKaFkyc2dabTl5SUdWaFkyZ2daV3hsYldWdWRDQnBiaUIwYUdVZ1kzVnljbVZ1ZENCamIyeHNaV04wYVc5dUxpY3NYRzRnSUNBZ0lDQW5VMlZsT2lCb2RIUndjem92TDJ4dlpHRnphQzVqYjIwdlpHOWpjeU50WVhBblhHNGdJQ0FnWFN4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmpZV3hzWW1GamF5d2dkR2hwYzBGeVp5a2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLRnh1SUNBZ0lDQWdJQ0JmTG0xaGNDaGhZM1IxWVd3c0lHTmhiR3hpWVdOckxDQjBhR2x6UVhKbktWeHVJQ0FnSUNBZ0tUdGNiaUFnSUNCOVhHNGdJSDBzWEc1Y2JpQWdiV1YwYUc5a09pQjdYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjBadmNtdHpJSFJvWlNCbGVIQmxZM1JoZEdsdmJpQjBieUJ2Y0dWeVlYUmxJRzl1SUhSb1pTQnlaWE4xYkhRZ2IyWWdhVzUyYjJ0cGJtY2dkR2hsSUc1aGJXVmtKeXhjYmlBZ0lDQWdJQ2R0WlhSb2IyUWdiMjRnZEdobElITjFZbXBsWTNRZ2RtRnNkV1V1Snl4Y2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklGd2liV1YwYUc5a0lDNGtlMkZ5WnpGOUtDbGNJaXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzTENCdFpYUm9iMlFzSUdGeVp5a2dlMXh1SUNBZ0lDQWdhV1lnS0hSNWNHVnZaaUJoWTNSMVlXeGJiV1YwYUc5a1hTQWhQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0p5UjdZWEpuTVgwZ2FYTWdibTkwSUdFZ2JXVjBhRzlrSUdsdUlIdDdZV04wZFdGc2ZYMG5PMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0IyWVhJZ1lYSm5jeUE5SUY4dWRHOUJjbkpoZVNoaGNtZDFiV1Z1ZEhNcExuTnNhV05sS0RJcE8xeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXViWFYwWVhSbEtGeHVJQ0FnSUNBZ0lDQmhZM1IxWVd4YmJXVjBhRzlrWFM1aGNIQnNlU2hoWTNSMVlXd3NJR0Z5WjNNcFhHNGdJQ0FnSUNBcE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmx4dUlDQnBiblp2YTJVNklIdGNiaUFnSUNCb1pXeHdPaUJiWEc0Z0lDQWdJQ0FuUm05eWEzTWdkR2hsSUdWNGNHVmpkR0YwYVc5dUlIUnZJRzl3WlhKaGRHVWdiMjRnWVc0Z1lYSnlZWGtnYUc5c1pHbHVaeUIwYUdVZ2NtVnpkV3gwY3lCdlppY3NYRzRnSUNBZ0lDQW5hVzUyYjJ0cGJtY2dkR2hsSUcxbGRHaHZaQ0J1WVcxbFpDQmllU0IwYUdVZ1lYSm5kVzFsYm5RZ1ptOXlJR1ZoWTJnZ1pXeGxiV1Z1ZENCcGJpQjBhR1VuTEZ4dUlDQWdJQ0FnSjJOMWNuSmxiblFnWTI5c2JHVmpkR2x2Ymk0bkxGeHVJQ0FnSUNBZ0oxTmxaVG9nYUhSMGNITTZMeTlzYjJSaGMyZ3VZMjl0TDJSdlkzTWphVzUyYjJ0bEoxeHVJQ0FnSUYwc1hHNGdJQ0FnWkdWell6b2dYQ0pwYm5admEyVWdMaVI3WVhKbk1YMG9LVndpTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3c0lHMWxkR2h2WkN3Z1lYSm5LU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWFXNTJiMnRsTG1Gd2NHeDVLRjhzSUdGeVozVnRaVzUwY3lsY2JpQWdJQ0FnSUNrN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lIQnNkV05yT2lCN1hHNGdJQ0FnYUdWc2NEb2dXMXh1SUNBZ0lDQWdKMDExZEdGMFpYTWdkR2hsSUhaaGJIVmxJSFJ2SUdKbElIUm9aU0J2Ym1VZ2IyWWdkR2hsSUhOd1pXTnBabWxqSUhCeWIzQmxjblI1SUdadmNpQmhiR3dnWld4bGJXVnVkSE1uTEZ4dUlDQWdJQ0FnSjJsdUlIUm9aU0JqZFhKeVpXNTBJR052Ykd4bFkzUnBiMjR1Snl4Y2JpQWdJQ0FnSUNkVFpXVTZJR2gwZEhCek9pOHZiRzlrWVhOb0xtTnZiUzlrYjJOekkzQnNkV05ySjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0ozQnNkV05yS0NCN2UyRnlaekY5ZlNBcEp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNMQ0J3Y205d0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9YRzRnSUNBZ0lDQWdJRjh1Y0d4MVkyc29ZV04wZFdGc0xDQndjbTl3S1Z4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ1ptbHljM1E2SUh0Y2JpQWdJQ0JoYkdsaGMyVnpPaUJiSUNkb1pXRmtKeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZFVUMFJQSnl4Y2JpQWdJQ0FnSUNkVFpXVTZJR2gwZEhCek9pOHZiRzlrWVhOb0xtTnZiUzlrYjJOekkyWnBjbk4wSjF4dUlDQWdJRjBzWEc0Z0lDQWdaR1Z6WXpvZ0oyZGxkQ0JtYVhKemRDQmxiR1Z0Wlc1MEp5eGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWFHVmhaQ2hoWTNSMVlXd3BYRzRnSUNBZ0lDQXBPMXh1SUNBZ0lIMWNiaUFnZlN4Y2JpQWdiR0Z6ZERvZ2UxeHVJQ0FnSUdobGJIQTZJRnRjYmlBZ0lDQWdJQ2RVVDBSUEp5eGNiaUFnSUNBZ0lDZFRaV1U2SUdoMGRIQnpPaTh2Ykc5a1lYTm9MbU52YlM5a2IyTnpJMnhoYzNRblhHNGdJQ0FnWFN4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0tTQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjeTV0ZFhSaGRHVW9YRzRnSUNBZ0lDQWdJRjh1YkdGemRDaGhZM1IxWVd3cFhHNGdJQ0FnSUNBcE8xeHVJQ0FnSUgxY2JpQWdmU3hjYmlBZ2NtVnpkRG9nZTF4dUlDQWdJR0ZzYVdGelpYTTZJRnNnSjNSaGFXd25JRjBzWEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0oxUlBSRThuTEZ4dUlDQWdJQ0FnSjFObFpUb2dhSFIwY0hNNkx5OXNiMlJoYzJndVkyOXRMMlJ2WTNNamNtVnpkQ2RjYmlBZ0lDQmRMRnh1SUNBZ0lIUmxjM1E2SUdaMWJtTjBhVzl1SUNoaFkzUjFZV3dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtMTFkR0YwWlNoY2JpQWdJQ0FnSUNBZ1h5NTBZV2xzS0dGamRIVmhiQ2xjYmlBZ0lDQWdJQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUcxcGJqb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkTmRYUmhkR1Z6SUhSb1pTQnpkV0pxWldOMElIUnZJR0psSUhSb1pTQnRhVzVwYlhWdElIWmhiSFZsSUdadmRXNWtJRzl1SUhSb1pTQmpiMnhzWldOMGFXOXVMaWNzWEc0Z0lDQWdJQ0FuVTJWbE9pQm9kSFJ3Y3pvdkwyeHZaR0Z6YUM1amIyMHZaRzlqY3lOdGFXNG5YRzRnSUNBZ1hTeGNiaUFnSUNCMFpYTjBPaUJtZFc1amRHbHZiaUFvWVdOMGRXRnNLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3k1dGRYUmhkR1VvWEc0Z0lDQWdJQ0FnSUY4dWJXbHVLR0ZqZEhWaGJDbGNiaUFnSUNBZ0lDazdYRzRnSUNBZ2ZWeHVJQ0I5TEZ4dUlDQnRZWGc2SUh0Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5UWFYwWVhSbGN5QjBhR1VnYzNWaWFtVmpkQ0IwYnlCaVpTQjBhR1VnYldGNGFXMTFiU0IyWVd4MVpTQm1iM1Z1WkNCdmJpQjBhR1VnWTI5c2JHVmpkR2x2Ymk0bkxGeHVJQ0FnSUNBZ0oxTmxaVG9nYUhSMGNITTZMeTlzYjJSaGMyZ3VZMjl0TDJSdlkzTWpiV0Y0SjF4dUlDQWdJRjBzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTXViWFYwWVhSbEtGeHVJQ0FnSUNBZ0lDQmZMbTFoZUNoaFkzUjFZV3dwWEc0Z0lDQWdJQ0FwTzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCemIzSjBPaUI3WEc0Z0lDQWdhR1ZzY0RvZ1cxeHVJQ0FnSUNBZ0owMTFkR0YwWlhNZ2RHaGxJSFpoYkhWbElIUnZJR0psSUhOdmNuUmxaQ0JwYmlCaGMyTmxibVJwYm1jZ2IzSmtaWEl1Snl4Y2JpQWdJQ0FnSUNkVFpXVTZJR2gwZEhCek9pOHZiRzlrWVhOb0xtTnZiUzlrYjJOekkzTnZjblJDZVNkY2JpQWdJQ0JkTEZ4dUlDQWdJR1JsYzJNNklDZHpiM0owSnl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmpZV3hzWW1GamF5d2dkR2hwYzBGeVp5a2dlMXh1SUNBZ0lDQWdMeThnUVd4c2IzY2dkR2hsSUhWelpTQnZaaUJsZUhCeVpYTnphVzl1Y3lCaGN5QmpZV3hzWW1GamEzTmNiaUFnSUNBZ0lHbG1JQ2hqWVd4c1ltRmpheUJwYm5OMFlXNWpaVzltSUdGemN5NURhR0ZwYmlrZ2UxeHVJQ0FnSUNBZ0lDQmpZV3hzWW1GamF5QTlJR05oYkd4aVlXTnJMbkpsYzNWc2REdGNiaUFnSUNBZ0lIMWNibHh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE11YlhWMFlYUmxLRnh1SUNBZ0lDQWdJQ0JmTG5OdmNuUkNlU2hoWTNSMVlXd3NJR05oYkd4aVlXTnJMQ0IwYUdselFYSm5LVnh1SUNBZ0lDQWdLVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnYzNSdmNtVTZJSHRjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblNHVnNjR1Z5SUhSdklITjBiM0psSUdFZ2NtVm1aWEpsYm1ObElIUnZJSFJvWlNCamRYSnlaVzUwSUhaaGJIVmxJR0psYVc1bklHVjJZV3gxWVhSbFpDQnBiaUIwYUdVbkxGeHVJQ0FnSUNBZ0oyVjRjSEpsYzNOcGIyNGdhVzRnYzI5dFpTQnZkR2hsY2lCdlltcGxZM1F1SUVsMElHVjRjR1ZqZEhNZ1lTQjBZWEpuWlhRZ2IySnFaV04wSUdGdVpDQnZjSFJwYjI1aGJHeDVKeXhjYmlBZ0lDQWdJQ2QwYUdVZ2JtRnRaU0J2WmlCaElIQnliM0JsY25SNUxpQkpaaUIwWVhKblpYUWdhWE1nWVNCbWRXNWpkR2x2YmlCcGRGeGNKMnhzSUhKbFkyVnBkbVVnZEdobElIWmhiSFZsSnl4Y2JpQWdJQ0FnSUNkMWMybHVaeUJnY0hKdmNHQWdZWE1nZEdocGN5QmpiMjUwWlhoMExpQkpaaUJnY0hKdmNHQWdhWE1nYm05MElIQnliM1pwWkdWa0lHRnVaQ0JnZEdGeVoyVjBZQ0JwY3lCaGJpY3NYRzRnSUNBZ0lDQW5ZWEp5WVhrZ2RHaGxJSFpoYkhWbElIZHBiR3dnWW1VZ2NIVnphR1ZrSUhSdklHbDBMaWRjYmlBZ0lDQmRMRnh1SUNBZ0lHUmxjMk02SUNkemRHOXlaU2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkN3Z2RHRnlaMlYwTENCd2NtOXdLU0I3WEc0Z0lDQWdJQ0JwWmlBb1h5NXBjMFoxYm1OMGFXOXVLSFJoY21kbGRDa3BJSHRjYmlBZ0lDQWdJQ0FnZEdGeVoyVjBMbU5oYkd3b2NISnZjQ3dnWVdOMGRXRnNLVHRjYmlBZ0lDQWdJSDBnWld4elpTQnBaaUFvY0hKdmNDQTlQVDBnZFc1a1pXWnBibVZrS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hmTG1selFYSnlZWGtvZEdGeVoyVjBLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lIUmhjbWRsZEM1d2RYTm9LR0ZqZEhWaGJDazdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJQ2R3Y205d0lIVnVaR1ZtYVc1bFpDQmhibVFnZEdGeVoyVjBJR2x6SUc1dmRDQmhiaUJoY25KaGVTQnZjaUJoSUdaMWJtTjBhVzl1T2lCN2UyRnlaekY5ZlNjN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lIMGdaV3h6WlNCcFppQW9YeTVwYzA5aWFtVmpkQ2gwWVhKblpYUXBLU0I3WEc0Z0lDQWdJQ0FnSUhSaGNtZGxkRnR3Y205d1hTQTlJR0ZqZEhWaGJEdGNiaUFnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBbmRHRnlaMlYwSUdseklHNXZkQ0JoYmlCdlltcGxZM1E2SUh0N1lYSm5NWDE5Snp0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JuMHBPMXh1SWwxOSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG52YXIgYXNzID0gcmVxdWlyZSgnLi4vYXNzJyk7XG5cblxuLy8gSGVscGVyIGZhY3RvcnkgZm9yIHRoZW5hYmxlIGNhbGxiYWNrc1xuZnVuY3Rpb24gcmVzdW1lIChyZXNvbHZlciwgcmVzdWx0KSB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXNvbHZlci5yZXN1bWUodmFsdWUsIHJlc3VsdCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzUHJvbWlzZSAodmFsdWUpIHtcbiAgdmFyIHRoZW4gPSB2YWx1ZSAmJiB2YWx1ZS50aGVuO1xuICByZXR1cm4gdHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5cblxuLy8gUHJvbWlzZSByZWxhdGVkIG1hdGNoZXJzXG5hc3MucmVnaXN0ZXIoe1xuXG4gIHByb21pc2U6IHtcbiAgICBoZWxwOiBbXG4gICAgICAnVmVyaWZpZXMgdGhhdCB0aGUgdmFsdWUgaXMgYSBwcm9taXNlIChQcm9taXNlL0ErKSBidXQgZG9lcyBub3QgYXR0YWNoJyxcbiAgICAgICd0aGUgZXhwcmVzc2lvbiB0byBpdHMgcmVzb2x1dGlvbiBsaWtlIGByZXNvbHZlc2Agb3IgYHJlamVjdHNgLCBpbnN0ZWFkJyxcbiAgICAgICd0aGUgb3JpZ2luYWwgcHJvbWlzZSB2YWx1ZSBpcyBrZXB0IGFzIHRoZSBzdWJqZWN0IGZvciB0aGUgZm9sbG93aW5nJyxcbiAgICAgICdleHBlY3RhdGlvbnMuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGEgcHJvbWlzZScsXG4gICAgZmFpbDogJ2dvdCAkeyBhY3R1YWwgfScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgcmV0dXJuIGlzUHJvbWlzZShhY3R1YWwpO1xuICAgIH1cbiAgfSxcblxuICByZXNvbHZlczoge1xuICAgIGFsaWFzZXM6IFsgJ3Jlc29sdmVkJywgJ2Z1bGZpbGxlZCcsICdmdWxmaWxsJywgJ2V2ZW50dWFsbHknIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0F0dGFjaCB0aGUgbWF0Y2hlciB0byBhIHByb21pc2UgdmFsdWUgKFByb21pc2VzL0ErKSB0byBjb250aW51ZScsXG4gICAgICAnYXBwbHlpbmcgdGhlIGNoYWluIG9mIG1hdGNoZXJzIG9uY2UgdGhlIHByb21pc2UgaGFzIGJlZW4gcmVzb2x2ZWQsJyxcbiAgICAgICdtdXRhdGluZyB0aGUgdmFsdWUgdG8gdGhlIHJlc29sdmVkIG9uZS4nLFxuICAgICAgJ0l0IHdpbGwgZmFpbCBpZiB0aGUgdmFsdWUgaXMgbm90IGEgcHJvbWlzZSAobm8gLnRoZW4gbWV0aG9kKSBvciB0aGUnLFxuICAgICAgJ3Byb21pc2UgaXMgYWN0dWFsbHkgcmVqZWN0ZWQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGEgcmVzb2x2ZWQgcHJvbWlzZScsXG4gICAgZmFpbDogJ3dhcyByZWplY3RlZCcsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgaWYgKCFpc1Byb21pc2UoYWN0dWFsKSkge1xuICAgICAgICByZXR1cm4gJ2lzIG5vdCBhIHByb21pc2U6IHt7YWN0dWFsfX0nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIEVudGVyIGFzeW5jIG1vZGVcbiAgICAgICAgcmVzb2x2ZXIucGF1c2UoKTtcblxuICAgICAgICAvLyBBdHRhY2ggdG8gdGhlIHByb21pc2Ugc28gd2UgZ2V0IG5vdGlmaWVkIHdoZW4gaXQncyByZXNvbHZlZC5cbiAgICAgICAgYWN0dWFsLnRoZW4oXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyKSxcbiAgICAgICAgICByZXN1bWUocmVzb2x2ZXIsIGZhbHNlKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFJpZ2h0IG5vdyB3ZSBkb24ndCBrbm93IGlmIHRoZSBleHByZXNzaW9uIGlzIHZhbGlkXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9O1xuICAgIH1cbiAgfSxcblxuICBiZWNvbWU6IHtcbiAgICBhbGlhc2VzOiBbICdiZWNvbWVzJyBdLFxuICAgIGhlbHA6IFtcbiAgICAgICdXb3JrcyB0aGUgc2FtZSBhcyAucmVzb2x2ZXMgYnV0IGFkZGl0aW9uYWxseSB3aWxsIGRvIGEgY29tcGFyaXNvbiBiZXR3ZWVuJyxcbiAgICAgICd0aGUgcmVzb2x2ZWQgdmFsdWUgZnJvbSB0aGUgcHJvbWlzZSBhbmQgdGhlIGV4cGVjdGVkIG9uZS4gSXQgY2FuIGJlIHNlZW4nLFxuICAgICAgJ2FzIGEgc2hvcnRjdXQgZm9yIGAucmVzb2x2ZXMuZXEoZXhwZWN0ZWQpYC4nXG4gICAgXSxcbiAgICBkZXNjOiAndG8gYmVjb21lIHt7IGV4cGVjdGVkIH19JyxcbiAgICBmYWlsOiAnd2FzIHt7IGFjdHVhbCB9fScsXG4gICAgdGVzdDogZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgIGlmICghaXNQcm9taXNlKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBwcm9taXNlOiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBNYWtlIGl0IGFzeW5jXG4gICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG5cbiAgICAgICAgLy8gQXR0YWNoIHRvIHRoZSBwcm9taXNlIHJlc29sdXRpb25cbiAgICAgICAgYWN0dWFsLnRoZW4oXG4gICAgICAgICAgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBlcXVhbGl0eSBzdWNjZWVkcyBqdXN0IGtlZXAgcmVzb2x2aW5nXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gXy5pc0VxdWFsKHZhbHVlLCBleHBlY3RlZCkgPyB1bmRlZmluZWQgOiBmYWxzZTtcbiAgICAgICAgICAgIHJlc29sdmVyLnJlc3VtZSh2YWx1ZSwgcmVzdWx0KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc3VtZShyZXNvbHZlciwgZmFsc2UpXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIHJlamVjdHM6IHtcbiAgICBhbGlhc2VzOiBbICdyZWplY3RlZCcgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXR0YWNoIHRoZSBtYXRjaGVyIHRvIGEgcHJvbWlzZSB2YWx1ZSAoUHJvbWlzZXMvQSspIHRvIGNvbnRpbnVlIGFwcGx5aW5nJyxcbiAgICAgICd0aGUgY2hhaW4gb2YgbWF0Y2hlcnMgb25jZSB0aGUgcHJvbWlzZSBoYXMgYmVlbiByZWplY3RlZCwgbXV0YXRpbmcgdGhlJyxcbiAgICAgICd2YWx1ZSB0byBiZWNvbWUgdGhlIHJlamVjdGVkIGVycm9yLicsXG4gICAgICAnSXQgd2lsbCBmYWlsIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBwcm9taXNlIChubyAudGhlbiBtZXRob2QpIG9yIHRoZScsXG4gICAgICAncHJvbWlzZSBpcyBhY3R1YWxseSBmdWxmaWxsZWQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ3RvIGJlIGEgcmVqZWN0ZWQgcHJvbWlzZScsXG4gICAgZmFpbDogJ3dhcyBmdWxmaWxsZWQnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIGlmICghaXNQcm9taXNlKGFjdHVhbCkpIHtcbiAgICAgICAgcmV0dXJuICdpcyBub3QgYSBwcm9taXNlOiB7e2FjdHVhbH19JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgICAvLyBFbnRlciBhc3luYyBtb2RlXG4gICAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG5cbiAgICAgICAgYWN0dWFsLnRoZW4oXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyLCBmYWxzZSksXG4gICAgICAgICAgcmVzdW1lKHJlc29sdmVyKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFJpZ2h0IG5vdyB3ZSBkb24ndCBrbm93IGlmIHRoZSBleHByZXNzaW9uIGlzIHZhbGlkXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG59KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbXhwWWk5dFlYUmphR1Z5Y3k5d2NtOXRhWE5sTG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN1FVRkJRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVNJc0ltWnBiR1VpT2lKblpXNWxjbUYwWldRdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lkbUZ5SUY4Z1BTQW9kSGx3Wlc5bUlIZHBibVJ2ZHlBaFBUMGdYQ0oxYm1SbFptbHVaV1JjSWlBL0lIZHBibVJ2ZHk1ZklEb2dkSGx3Wlc5bUlHZHNiMkpoYkNBaFBUMGdYQ0oxYm1SbFptbHVaV1JjSWlBL0lHZHNiMkpoYkM1ZklEb2diblZzYkNrN1hHNWNiblpoY2lCaGMzTWdQU0J5WlhGMWFYSmxLQ2N1TGk5aGMzTW5LVHRjYmx4dVhHNHZMeUJJWld4d1pYSWdabUZqZEc5eWVTQm1iM0lnZEdobGJtRmliR1VnWTJGc2JHSmhZMnR6WEc1bWRXNWpkR2x2YmlCeVpYTjFiV1VnS0hKbGMyOXNkbVZ5TENCeVpYTjFiSFFwSUh0Y2JpQWdjbVYwZFhKdUlHWjFibU4wYVc5dUlDaDJZV3gxWlNrZ2UxeHVJQ0FnSUhKbGMyOXNkbVZ5TG5KbGMzVnRaU2gyWVd4MVpTd2djbVZ6ZFd4MEtUdGNiaUFnZlR0Y2JuMWNibHh1Wm5WdVkzUnBiMjRnYVhOUWNtOXRhWE5sSUNoMllXeDFaU2tnZTF4dUlDQjJZWElnZEdobGJpQTlJSFpoYkhWbElDWW1JSFpoYkhWbExuUm9aVzQ3WEc0Z0lISmxkSFZ5YmlCMGVYQmxiMllnZEdobGJpQTlQVDBnSjJaMWJtTjBhVzl1Snp0Y2JuMWNibHh1WEc0dkx5QlFjbTl0YVhObElISmxiR0YwWldRZ2JXRjBZMmhsY25OY2JtRnpjeTV5WldkcGMzUmxjaWg3WEc1Y2JpQWdjSEp2YldselpUb2dlMXh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkV1pYSnBabWxsY3lCMGFHRjBJSFJvWlNCMllXeDFaU0JwY3lCaElIQnliMjFwYzJVZ0tGQnliMjFwYzJVdlFTc3BJR0oxZENCa2IyVnpJRzV2ZENCaGRIUmhZMmduTEZ4dUlDQWdJQ0FnSjNSb1pTQmxlSEJ5WlhOemFXOXVJSFJ2SUdsMGN5QnlaWE52YkhWMGFXOXVJR3hwYTJVZ1lISmxjMjlzZG1WellDQnZjaUJnY21WcVpXTjBjMkFzSUdsdWMzUmxZV1FuTEZ4dUlDQWdJQ0FnSjNSb1pTQnZjbWxuYVc1aGJDQndjbTl0YVhObElIWmhiSFZsSUdseklHdGxjSFFnWVhNZ2RHaGxJSE4xWW1wbFkzUWdabTl5SUhSb1pTQm1iMnhzYjNkcGJtY25MRnh1SUNBZ0lDQWdKMlY0Y0dWamRHRjBhVzl1Y3k0blhHNGdJQ0FnWFN4Y2JpQWdJQ0JrWlhOak9pQW5kRzhnWW1VZ1lTQndjbTl0YVhObEp5eGNiaUFnSUNCbVlXbHNPaUFuWjI5MElDUjdJR0ZqZEhWaGJDQjlKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnYVhOUWNtOXRhWE5sS0dGamRIVmhiQ2s3WEc0Z0lDQWdmVnh1SUNCOUxGeHVYRzRnSUhKbGMyOXNkbVZ6T2lCN1hHNGdJQ0FnWVd4cFlYTmxjem9nV3lBbmNtVnpiMngyWldRbkxDQW5ablZzWm1sc2JHVmtKeXdnSjJaMWJHWnBiR3duTENBblpYWmxiblIxWVd4c2VTY2dYU3hjYmlBZ0lDQm9aV3h3T2lCYlhHNGdJQ0FnSUNBblFYUjBZV05vSUhSb1pTQnRZWFJqYUdWeUlIUnZJR0VnY0hKdmJXbHpaU0IyWVd4MVpTQW9VSEp2YldselpYTXZRU3NwSUhSdklHTnZiblJwYm5WbEp5eGNiaUFnSUNBZ0lDZGhjSEJzZVdsdVp5QjBhR1VnWTJoaGFXNGdiMllnYldGMFkyaGxjbk1nYjI1alpTQjBhR1VnY0hKdmJXbHpaU0JvWVhNZ1ltVmxiaUJ5WlhOdmJIWmxaQ3duTEZ4dUlDQWdJQ0FnSjIxMWRHRjBhVzVuSUhSb1pTQjJZV3gxWlNCMGJ5QjBhR1VnY21WemIyeDJaV1FnYjI1bExpY3NYRzRnSUNBZ0lDQW5TWFFnZDJsc2JDQm1ZV2xzSUdsbUlIUm9aU0IyWVd4MVpTQnBjeUJ1YjNRZ1lTQndjbTl0YVhObElDaHVieUF1ZEdobGJpQnRaWFJvYjJRcElHOXlJSFJvWlNjc1hHNGdJQ0FnSUNBbmNISnZiV2x6WlNCcGN5QmhZM1IxWVd4c2VTQnlaV3BsWTNSbFpDNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdZU0J5WlhOdmJIWmxaQ0J3Y205dGFYTmxKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJSEpsYW1WamRHVmtKeXhjYmlBZ0lDQjBaWE4wT2lCbWRXNWpkR2x2YmlBb1lXTjBkV0ZzS1NCN1hHNGdJQ0FnSUNCcFppQW9JV2x6VUhKdmJXbHpaU2hoWTNSMVlXd3BLU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFuYVhNZ2JtOTBJR0VnY0hKdmJXbHpaVG9nZTN0aFkzUjFZV3g5ZlNjN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNBZ0lDQWdMeThnUlc1MFpYSWdZWE41Ym1NZ2JXOWtaVnh1SUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTV3WVhWelpTZ3BPMXh1WEc0Z0lDQWdJQ0FnSUM4dklFRjBkR0ZqYUNCMGJ5QjBhR1VnY0hKdmJXbHpaU0J6YnlCM1pTQm5aWFFnYm05MGFXWnBaV1FnZDJobGJpQnBkQ2R6SUhKbGMyOXNkbVZrTGx4dUlDQWdJQ0FnSUNCaFkzUjFZV3d1ZEdobGJpaGNiaUFnSUNBZ0lDQWdJQ0J5WlhOMWJXVW9jbVZ6YjJ4MlpYSXBMRnh1SUNBZ0lDQWdJQ0FnSUhKbGMzVnRaU2h5WlhOdmJIWmxjaXdnWm1Gc2MyVXBYRzRnSUNBZ0lDQWdJQ2s3WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdVbWxuYUhRZ2JtOTNJSGRsSUdSdmJpZDBJR3R1YjNjZ2FXWWdkR2hsSUdWNGNISmxjM05wYjI0Z2FYTWdkbUZzYVdSY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWdVpHVm1hVzVsWkR0Y2JpQWdJQ0FnSUgwN1hHNGdJQ0FnZlZ4dUlDQjlMRnh1WEc0Z0lHSmxZMjl0WlRvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oySmxZMjl0WlhNbklGMHNYRzRnSUNBZ2FHVnNjRG9nVzF4dUlDQWdJQ0FnSjFkdmNtdHpJSFJvWlNCellXMWxJR0Z6SUM1eVpYTnZiSFpsY3lCaWRYUWdZV1JrYVhScGIyNWhiR3g1SUhkcGJHd2daRzhnWVNCamIyMXdZWEpwYzI5dUlHSmxkSGRsWlc0bkxGeHVJQ0FnSUNBZ0ozUm9aU0J5WlhOdmJIWmxaQ0IyWVd4MVpTQm1jbTl0SUhSb1pTQndjbTl0YVhObElHRnVaQ0IwYUdVZ1pYaHdaV04wWldRZ2IyNWxMaUJKZENCallXNGdZbVVnYzJWbGJpY3NYRzRnSUNBZ0lDQW5ZWE1nWVNCemFHOXlkR04xZENCbWIzSWdZQzV5WlhOdmJIWmxjeTVsY1NobGVIQmxZM1JsWkNsZ0xpZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2QwYnlCaVpXTnZiV1VnZTNzZ1pYaHdaV04wWldRZ2ZYMG5MRnh1SUNBZ0lHWmhhV3c2SUNkM1lYTWdlM3NnWVdOMGRXRnNJSDE5Snl4Y2JpQWdJQ0IwWlhOME9pQm1kVzVqZEdsdmJpQW9ZV04wZFdGc0xDQmxlSEJsWTNSbFpDa2dlMXh1SUNBZ0lDQWdhV1lnS0NGcGMxQnliMjFwYzJVb1lXTjBkV0ZzS1NrZ2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0oybHpJRzV2ZENCaElIQnliMjFwYzJVNklIdDdZV04wZFdGc2ZYMG5PMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdablZ1WTNScGIyNGdLSEpsYzI5c2RtVnlLU0I3WEc0Z0lDQWdJQ0FnSUM4dklFMWhhMlVnYVhRZ1lYTjVibU5jYmlBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y0dGMWMyVW9LVHRjYmx4dUlDQWdJQ0FnSUNBdkx5QkJkSFJoWTJnZ2RHOGdkR2hsSUhCeWIyMXBjMlVnY21WemIyeDFkR2x2Ymx4dUlDQWdJQ0FnSUNCaFkzUjFZV3d1ZEdobGJpaGNiaUFnSUNBZ0lDQWdJQ0JtZFc1amRHbHZiaUFvZG1Gc2RXVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRmRvWlc0Z2RHaGxJR1Z4ZFdGc2FYUjVJSE4xWTJObFpXUnpJR3AxYzNRZ2EyVmxjQ0J5WlhOdmJIWnBibWRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhjaUJ5WlhOMWJIUWdQU0JmTG1selJYRjFZV3dvZG1Gc2RXVXNJR1Y0Y0dWamRHVmtLU0EvSUhWdVpHVm1hVzVsWkNBNklHWmhiSE5sTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVjbVZ6ZFcxbEtIWmhiSFZsTENCeVpYTjFiSFFwTzF4dUlDQWdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQWdJQ0FnY21WemRXMWxLSEpsYzI5c2RtVnlMQ0JtWVd4elpTbGNiaUFnSUNBZ0lDQWdLVHRjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZFc1a1pXWnBibVZrTzF4dUlDQWdJQ0FnZlR0Y2JpQWdJQ0I5WEc0Z0lIMHNYRzVjYmlBZ2NtVnFaV04wY3pvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0ozSmxhbVZqZEdWa0p5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkQmRIUmhZMmdnZEdobElHMWhkR05vWlhJZ2RHOGdZU0J3Y205dGFYTmxJSFpoYkhWbElDaFFjbTl0YVhObGN5OUJLeWtnZEc4Z1kyOXVkR2x1ZFdVZ1lYQndiSGxwYm1jbkxGeHVJQ0FnSUNBZ0ozUm9aU0JqYUdGcGJpQnZaaUJ0WVhSamFHVnljeUJ2Ym1ObElIUm9aU0J3Y205dGFYTmxJR2hoY3lCaVpXVnVJSEpsYW1WamRHVmtMQ0J0ZFhSaGRHbHVaeUIwYUdVbkxGeHVJQ0FnSUNBZ0ozWmhiSFZsSUhSdklHSmxZMjl0WlNCMGFHVWdjbVZxWldOMFpXUWdaWEp5YjNJdUp5eGNiaUFnSUNBZ0lDZEpkQ0IzYVd4c0lHWmhhV3dnYVdZZ2RHaGxJSFpoYkhWbElHbHpJRzV2ZENCaElIQnliMjFwYzJVZ0tHNXZJQzUwYUdWdUlHMWxkR2h2WkNrZ2IzSWdkR2hsSnl4Y2JpQWdJQ0FnSUNkd2NtOXRhWE5sSUdseklHRmpkSFZoYkd4NUlHWjFiR1pwYkd4bFpDNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuZEc4Z1ltVWdZU0J5WldwbFkzUmxaQ0J3Y205dGFYTmxKeXhjYmlBZ0lDQm1ZV2xzT2lBbmQyRnpJR1oxYkdacGJHeGxaQ2NzWEc0Z0lDQWdkR1Z6ZERvZ1puVnVZM1JwYjI0Z0tHRmpkSFZoYkNrZ2UxeHVJQ0FnSUNBZ2FXWWdLQ0ZwYzFCeWIyMXBjMlVvWVdOMGRXRnNLU2tnZTF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnSjJseklHNXZkQ0JoSUhCeWIyMXBjMlU2SUh0N1lXTjBkV0ZzZlgwbk8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQnlaWFIxY200Z1puVnVZM1JwYjI0Z0tISmxjMjlzZG1WeUtTQjdYRzRnSUNBZ0lDQWdJQzh2SUVWdWRHVnlJR0Z6ZVc1aklHMXZaR1ZjYmlBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y0dGMWMyVW9LVHRjYmx4dUlDQWdJQ0FnSUNCaFkzUjFZV3d1ZEdobGJpaGNiaUFnSUNBZ0lDQWdJQ0J5WlhOMWJXVW9jbVZ6YjJ4MlpYSXNJR1poYkhObEtTeGNiaUFnSUNBZ0lDQWdJQ0J5WlhOMWJXVW9jbVZ6YjJ4MlpYSXBYRzRnSUNBZ0lDQWdJQ2s3WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdVbWxuYUhRZ2JtOTNJSGRsSUdSdmJpZDBJR3R1YjNjZ2FXWWdkR2hsSUdWNGNISmxjM05wYjI0Z2FYTWdkbUZzYVdSY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWdVpHVm1hVzVsWkR0Y2JpQWdJQ0FnSUgwN1hHNGdJQ0FnZlZ4dUlDQjlYRzVjYm4wcE8xeHVJbDE5IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIF8gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCk7XG5cbnZhciBhc3MgPSByZXF1aXJlKCcuLi9hc3MnKTtcblxuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gaXRlcmF0ZSBhIHZhbHVlIGNyZWF0aW5nIGZvcmtzIGZvciBlYWNoIGVsZW1lbnQsIGhhbmRsaW5nXG4vLyBhc3luYyBleHBlY3RhdGlvbnMgaWYgbmVlZGVkLlxuZnVuY3Rpb24gZm9ya2VyIChyZXNvbHZlciwgYWN0dWFsLCBpdGVyYXRvciwgc3RvcCkge1xuICB2YXIgYnJhbmNoZXMgPSBfLnNpemUoYWN0dWFsKTtcbiAgdmFyIHJlc3VsdCA9IGl0ZXJhdG9yKGFjdHVhbCwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cbiAgICB2YXIgZm9yayA9IHJlc29sdmVyLmZvcmsoKTtcblxuICAgIHZhciBwYXJ0aWFsID0gZm9yayh2YWx1ZSk7XG5cbiAgICAvLyBTdG9wIGl0ZXJhdGluZyBhcyBzb29uIGFzIHBvc3NpYmxlXG4gICAgaWYgKHBhcnRpYWwgPT09IHN0b3ApIHtcbiAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICByZXR1cm4gc3RvcDtcbiAgICB9XG5cbiAgICBpZiAocGFydGlhbCA9PT0gIXN0b3ApIHtcbiAgICAgIGJyYW5jaGVzIC09IDE7XG4gICAgICBpZiAoMCA9PT0gYnJhbmNoZXMpIHtcbiAgICAgICAgcmVzb2x2ZXIuam9pbihmb3JrKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAhc3RvcDtcbiAgICB9XG5cbiAgICAvLyBBc3luYyBzdXBwb3J0XG4gICAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICAgIHJlc29sdmVyLnBhdXNlKCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIHRoZSBmb3JrJ3MgZmluYWwgcmVzdWx0XG4gICAgZm9yay5maW5hbGl6ZShmdW5jdGlvbiAoZmluYWwpIHtcbiAgICAgIC8vIFdlJ3JlIGRvbmUgdGhlIG1vbWVudCBvbmUgaXMgYSBzdG9wIHJlc3VsdFxuICAgICAgaWYgKGZpbmFsID09PSBzdG9wKSB7XG4gICAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICAgIHJlc29sdmVyLnJlc3VtZShudWxsLCBzdG9wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyYW5jaGVzIC09IDE7XG4gICAgICAgIGlmICgwID09PSBicmFuY2hlcykge1xuICAgICAgICAgIHJlc29sdmVyLmpvaW4oZm9yayk7XG4gICAgICAgICAgcmVzb2x2ZXIucmVzdW1lKG51bGwsICFzdG9wKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbmFsO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICFzdG9wOyAgLy8ga2VlcCBpdGVyYXRpbmdcbiAgfSk7XG5cbiAgLy8gV2hlbiB0aGUgZm9ya3MgY29tcGxldGVkIHN5bmNocm9ub3VzbHkganVzdCBmaW5hbGl6ZSB0aGUgcmVzb2x2ZXJcbiAgaWYgKCFyZXNvbHZlci5wYXVzZWQpIHtcbiAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUocmVzdWx0KTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cblxuLy8gUXVhbnRpZmllcnNcbmFzcy5yZWdpc3Rlcih7XG5cbiAgZXZlcnk6IHtcbiAgICBhbGlhc2VzOiBbICdhbGwnLCAnYWxsT2YnIF0sXG4gICAgaGVscDogW1xuICAgICAgJ0FwcGxpZXMgbWF0Y2hlcnMgdG8gYWxsIHRoZSBlbGVtZW50cyBpbiBhIGNvbGxlY3Rpb24gZXhwZWN0aW5nIHRoYXQnLFxuICAgICAgJ2FsbCBvZiB0aGVtIHN1Y2NlZWQnXG4gICAgXSxcbiAgICBkZXNjOiAnRm9yIGV2ZXJ5IG9uZTonLFxuICAgIGZhaWw6ICdvbmUgZGlkblxcJ3QnLFxuICAgIHRlc3Q6IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgd2hlbiB0aGVyZSBpcyBubyBtb3JlIHN0dWZmIHRvIGRvXG4gICAgICAgIGlmIChyZXNvbHZlci5leGhhdXN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZXIuZmluYWxpemUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZm9ya2VyKHJlc29sdmVyLCBhY3R1YWwsIF8uZXZlcnksIGZhbHNlKTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIHNvbWU6IHtcbiAgICBhbGlhc2VzOiBbICdhbnlPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnYXQgbGVhc3Qgb25lIG9mIHRoZW0gc3VjY2VlZHMnXSxcbiAgICBkZXNjOiAnQXQgbGVhc3Qgb25lOicsXG4gICAgZmFpbDogJ25vbmUgZGlkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBzdHVmZiB0byBkb1xuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZvcmtlcihyZXNvbHZlciwgYWN0dWFsLCBfLnNvbWUsIHRydWUpO1xuICAgICAgfTtcbiAgICB9XG4gIH0sXG5cbiAgbm9uZToge1xuICAgIGFsaWFzZXM6IFsgJ25vbmVPZicgXSxcbiAgICBoZWxwOiBbXG4gICAgICAnQXBwbGllcyBtYXRjaGVycyB0byBhbGwgdGhlIGVsZW1lbnRzIGluIGEgY29sbGVjdGlvbiBleHBlY3RpbmcgdGhhdCcsXG4gICAgICAnbm9uZSBvZiB0aGVtIHN1Y2NlZWQuJ1xuICAgIF0sXG4gICAgZGVzYzogJ05vbmUgb2YgdGhlbTonLFxuICAgIGZhaWw6ICdvbmUgZGlkJyxcbiAgICB0ZXN0OiBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBzdHVmZiB0byBkb1xuICAgICAgICBpZiAocmVzb2x2ZXIuZXhoYXVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc29sdmVyLmZpbmFsaXplKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgYXJlIGdvaW5nIHRvIHVzZSB0aGUgc2FtZSBhbGdvcml0aG0gYXMgZm9yIC5zb21lIGJ1dCB3ZSdsbCBuZWdhdGVcbiAgICAgICAgLy8gaXRzIHJlc3VsdCB1c2luZyBhIGZpbmFsaXplci5cbiAgICAgICAgcmVzb2x2ZXIuZmluYWxpemUoZnVuY3Rpb24gKGZpbmFsKSB7XG4gICAgICAgICAgcmV0dXJuICFmaW5hbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZvcmtlcihyZXNvbHZlciwgYWN0dWFsLCBfLnNvbWUsIHRydWUpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxufSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOXRZWFJqYUdWeWN5OXhkV0Z1ZEdsbWFXVnljeTVxY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pTzBGQlFVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUoyWVhJZ1h5QTlJQ2gwZVhCbGIyWWdkMmx1Wkc5M0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdkMmx1Wkc5M0xsOGdPaUIwZVhCbGIyWWdaMnh2WW1Gc0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdaMnh2WW1Gc0xsOGdPaUJ1ZFd4c0tUdGNibHh1ZG1GeUlHRnpjeUE5SUhKbGNYVnBjbVVvSnk0dUwyRnpjeWNwTzF4dVhHNWNiaTh2SUVobGJIQmxjaUJtZFc1amRHbHZiaUIwYnlCcGRHVnlZWFJsSUdFZ2RtRnNkV1VnWTNKbFlYUnBibWNnWm05eWEzTWdabTl5SUdWaFkyZ2daV3hsYldWdWRDd2dhR0Z1Wkd4cGJtZGNiaTh2SUdGemVXNWpJR1Y0Y0dWamRHRjBhVzl1Y3lCcFppQnVaV1ZrWldRdVhHNW1kVzVqZEdsdmJpQm1iM0pyWlhJZ0tISmxjMjlzZG1WeUxDQmhZM1IxWVd3c0lHbDBaWEpoZEc5eUxDQnpkRzl3S1NCN1hHNGdJSFpoY2lCaWNtRnVZMmhsY3lBOUlGOHVjMmw2WlNoaFkzUjFZV3dwTzF4dUlDQjJZWElnY21WemRXeDBJRDBnYVhSbGNtRjBiM0lvWVdOMGRXRnNMQ0JtZFc1amRHbHZiaUFvZG1Gc2RXVXBJSHRjYmx4dUlDQWdJSFpoY2lCbWIzSnJJRDBnY21WemIyeDJaWEl1Wm05eWF5Z3BPMXh1WEc0Z0lDQWdkbUZ5SUhCaGNuUnBZV3dnUFNCbWIzSnJLSFpoYkhWbEtUdGNibHh1SUNBZ0lDOHZJRk4wYjNBZ2FYUmxjbUYwYVc1bklHRnpJSE52YjI0Z1lYTWdjRzl6YzJsaWJHVmNiaUFnSUNCcFppQW9jR0Z5ZEdsaGJDQTlQVDBnYzNSdmNDa2dlMXh1SUNBZ0lDQWdjbVZ6YjJ4MlpYSXVhbTlwYmlobWIzSnJLVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQnpkRzl3TzF4dUlDQWdJSDFjYmx4dUlDQWdJR2xtSUNod1lYSjBhV0ZzSUQwOVBTQWhjM1J2Y0NrZ2UxeHVJQ0FnSUNBZ1luSmhibU5vWlhNZ0xUMGdNVHRjYmlBZ0lDQWdJR2xtSUNnd0lEMDlQU0JpY21GdVkyaGxjeWtnZTF4dUlDQWdJQ0FnSUNCeVpYTnZiSFpsY2k1cWIybHVLR1p2Y21zcE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2NtVjBkWEp1SUNGemRHOXdPMXh1SUNBZ0lIMWNibHh1SUNBZ0lDOHZJRUZ6ZVc1aklITjFjSEJ2Y25SY2JpQWdJQ0JwWmlBb0lYSmxjMjlzZG1WeUxuQmhkWE5sWkNrZ2UxeHVJQ0FnSUNBZ2NtVnpiMngyWlhJdWNHRjFjMlVvS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2THlCVGRXSnpZM0pwWW1VZ2RHOGdkR2hsSUdadmNtc25jeUJtYVc1aGJDQnlaWE4xYkhSY2JpQWdJQ0JtYjNKckxtWnBibUZzYVhwbEtHWjFibU4wYVc5dUlDaG1hVzVoYkNrZ2UxeHVJQ0FnSUNBZ0x5OGdWMlVuY21VZ1pHOXVaU0IwYUdVZ2JXOXRaVzUwSUc5dVpTQnBjeUJoSUhOMGIzQWdjbVZ6ZFd4MFhHNGdJQ0FnSUNCcFppQW9abWx1WVd3Z1BUMDlJSE4wYjNBcElIdGNiaUFnSUNBZ0lDQWdjbVZ6YjJ4MlpYSXVhbTlwYmlobWIzSnJLVHRjYmlBZ0lDQWdJQ0FnY21WemIyeDJaWEl1Y21WemRXMWxLRzUxYkd3c0lITjBiM0FwTzF4dUlDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnWW5KaGJtTm9aWE1nTFQwZ01UdGNiaUFnSUNBZ0lDQWdhV1lnS0RBZ1BUMDlJR0p5WVc1amFHVnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlhJdWFtOXBiaWhtYjNKcktUdGNiaUFnSUNBZ0lDQWdJQ0J5WlhOdmJIWmxjaTV5WlhOMWJXVW9iblZzYkN3Z0lYTjBiM0FwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNCOVhHNGdJQ0FnSUNCeVpYUjFjbTRnWm1sdVlXdzdYRzRnSUNBZ2ZTazdYRzVjYmlBZ0lDQnlaWFIxY200Z0lYTjBiM0E3SUNBdkx5QnJaV1Z3SUdsMFpYSmhkR2x1WjF4dUlDQjlLVHRjYmx4dUlDQXZMeUJYYUdWdUlIUm9aU0JtYjNKcmN5QmpiMjF3YkdWMFpXUWdjM2x1WTJoeWIyNXZkWE5zZVNCcWRYTjBJR1pwYm1Gc2FYcGxJSFJvWlNCeVpYTnZiSFpsY2x4dUlDQnBaaUFvSVhKbGMyOXNkbVZ5TG5CaGRYTmxaQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQnlaWE52YkhabGNpNW1hVzVoYkdsNlpTaHlaWE4xYkhRcE8xeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlIVnVaR1ZtYVc1bFpEdGNibjFjYmx4dVhHNHZMeUJSZFdGdWRHbG1hV1Z5YzF4dVlYTnpMbkpsWjJsemRHVnlLSHRjYmx4dUlDQmxkbVZ5ZVRvZ2UxeHVJQ0FnSUdGc2FXRnpaWE02SUZzZ0oyRnNiQ2NzSUNkaGJHeFBaaWNnWFN4Y2JpQWdJQ0JvWld4d09pQmJYRzRnSUNBZ0lDQW5RWEJ3YkdsbGN5QnRZWFJqYUdWeWN5QjBieUJoYkd3Z2RHaGxJR1ZzWlcxbGJuUnpJR2x1SUdFZ1kyOXNiR1ZqZEdsdmJpQmxlSEJsWTNScGJtY2dkR2hoZENjc1hHNGdJQ0FnSUNBbllXeHNJRzltSUhSb1pXMGdjM1ZqWTJWbFpDZGNiaUFnSUNCZExGeHVJQ0FnSUdSbGMyTTZJQ2RHYjNJZ1pYWmxjbmtnYjI1bE9pY3NYRzRnSUNBZ1ptRnBiRG9nSjI5dVpTQmthV1J1WEZ3bmRDY3NYRzRnSUNBZ2RHVnpkRG9nWm5WdVkzUnBiMjRnS0dGamRIVmhiQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2h5WlhOdmJIWmxjaWtnZTF4dUlDQWdJQ0FnSUNBdkx5QlRhRzl5ZEdOMWRDQjNhR1Z1SUhSb1pYSmxJR2x6SUc1dklHMXZjbVVnYzNSMVptWWdkRzhnWkc5Y2JpQWdJQ0FnSUNBZ2FXWWdLSEpsYzI5c2RtVnlMbVY0YUdGMWMzUmxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCeVpYTnZiSFpsY2k1bWFXNWhiR2w2WlNoMGNuVmxLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCbWIzSnJaWElvY21WemIyeDJaWElzSUdGamRIVmhiQ3dnWHk1bGRtVnllU3dnWm1Gc2MyVXBPMXh1SUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzRnSUgwc1hHNWNiaUFnYzI5dFpUb2dlMXh1SUNBZ0lHRnNhV0Z6WlhNNklGc2dKMkZ1ZVU5bUp5QmRMRnh1SUNBZ0lHaGxiSEE2SUZ0Y2JpQWdJQ0FnSUNkQmNIQnNhV1Z6SUcxaGRHTm9aWEp6SUhSdklHRnNiQ0IwYUdVZ1pXeGxiV1Z1ZEhNZ2FXNGdZU0JqYjJ4c1pXTjBhVzl1SUdWNGNHVmpkR2x1WnlCMGFHRjBKeXhjYmlBZ0lDQWdJQ2RoZENCc1pXRnpkQ0J2Ym1VZ2IyWWdkR2hsYlNCemRXTmpaV1ZrY3lkZExGeHVJQ0FnSUdSbGMyTTZJQ2RCZENCc1pXRnpkQ0J2Ym1VNkp5eGNiaUFnSUNCbVlXbHNPaUFuYm05dVpTQmthV1FuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNBZ0lDQWdMeThnVTJodmNuUmpkWFFnZDJobGJpQjBhR1Z5WlNCcGN5QnVieUJ0YjNKbElITjBkV1ptSUhSdklHUnZYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTnZiSFpsY2k1bGVHaGhkWE4wWldRcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSXVabWx1WVd4cGVtVW9kSEoxWlNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdabTl5YTJWeUtISmxjMjlzZG1WeUxDQmhZM1IxWVd3c0lGOHVjMjl0WlN3Z2RISjFaU2s3WEc0Z0lDQWdJQ0I5TzF4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCdWIyNWxPaUI3WEc0Z0lDQWdZV3hwWVhObGN6b2dXeUFuYm05dVpVOW1KeUJkTEZ4dUlDQWdJR2hsYkhBNklGdGNiaUFnSUNBZ0lDZEJjSEJzYVdWeklHMWhkR05vWlhKeklIUnZJR0ZzYkNCMGFHVWdaV3hsYldWdWRITWdhVzRnWVNCamIyeHNaV04wYVc5dUlHVjRjR1ZqZEdsdVp5QjBhR0YwSnl4Y2JpQWdJQ0FnSUNkdWIyNWxJRzltSUhSb1pXMGdjM1ZqWTJWbFpDNG5YRzRnSUNBZ1hTeGNiaUFnSUNCa1pYTmpPaUFuVG05dVpTQnZaaUIwYUdWdE9pY3NYRzRnSUNBZ1ptRnBiRG9nSjI5dVpTQmthV1FuTEZ4dUlDQWdJSFJsYzNRNklHWjFibU4wYVc5dUlDaGhZM1IxWVd3cElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCbWRXNWpkR2x2YmlBb2NtVnpiMngyWlhJcElIdGNiaUFnSUNBZ0lDQWdMeThnVTJodmNuUmpkWFFnZDJobGJpQjBhR1Z5WlNCcGN5QnVieUJ0YjNKbElITjBkV1ptSUhSdklHUnZYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTnZiSFpsY2k1bGVHaGhkWE4wWldRcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpYSXVabWx1WVd4cGVtVW9kSEoxWlNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0F2THlCWFpTQmhjbVVnWjI5cGJtY2dkRzhnZFhObElIUm9aU0J6WVcxbElHRnNaMjl5YVhSb2JTQmhjeUJtYjNJZ0xuTnZiV1VnWW5WMElIZGxKMnhzSUc1bFoyRjBaVnh1SUNBZ0lDQWdJQ0F2THlCcGRITWdjbVZ6ZFd4MElIVnphVzVuSUdFZ1ptbHVZV3hwZW1WeUxseHVJQ0FnSUNBZ0lDQnlaWE52YkhabGNpNW1hVzVoYkdsNlpTaG1kVzVqZEdsdmJpQW9abWx1WVd3cElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdJV1pwYm1Gc08xeHVJQ0FnSUNBZ0lDQjlLVHRjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWm05eWEyVnlLSEpsYzI5c2RtVnlMQ0JoWTNSMVlXd3NJRjh1YzI5dFpTd2dkSEoxWlNrN1hHNGdJQ0FnSUNCOU8xeHVJQ0FnSUgxY2JpQWdmVnh1WEc1OUtUdGNiaUpkZlE9PSIsInZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cblxudmFyIGNoZWNrQ2hhaW4gPSBuZXcgQ2hhaW4oKTtcblxuXG5leHBvcnRzLmxvZGFzaCA9IGZ1bmN0aW9uIChfKSB7XG4gIC8vIEV4aXQgaWYgYWxyZWFkeSBwYXRjaGVkXG4gIGlmIChfLmNyZWF0ZUNhbGxiYWNrKGNoZWNrQ2hhaW4pID09PSBjaGVja0NoYWluLnRlc3QpIHtcbiAgICByZXR1cm4gXztcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIGxvZGFzaCdzIGRlZmF1bHQgY3JlYXRlQ2FsbGJhY2sgbWVjaGFuaXNtIHRvIG1ha2UgaXQgdW5kZXJzdGFuZFxuICAvLyBhYm91dCBvdXIgZXhwcmVzc2lvbiBjaGFpbnMuXG4gIF8uY3JlYXRlQ2FsbGJhY2sgPSBfLndyYXAoXy5jcmVhdGVDYWxsYmFjaywgZnVuY3Rpb24ob3JpZywgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICBpZiAoQ2hhaW4uaXNDaGFpbihjYWxsYmFjaykpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjay50ZXN0O1xuICAgIH1cblxuICAgIC8vIFN1cHBvcnQgXy53aGVyZSBzdHlsZS4gSXQncyBub3QgYXMgZmFzdCBhcyB0aGUgb3JpZ2luYWwgb25lIHNpbmNlIHdlXG4gICAgLy8gaGF2ZSB0byBnbyB2aWEgXy5pc0VxdWFsIGluc3RlYWQgb2YgdXNpbmcgdGhlIGludGVybmFsIGZ1bmN0aW9uXG4gICAgaWYgKF8uaXNQbGFpbk9iamVjdChjYWxsYmFjaykpIHtcbiAgICAgIHZhciBwcm9wcyA9IF8ua2V5cyhjYWxsYmFjayk7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlLCBsZW5ndGggPSBwcm9wcy5sZW5ndGgsIGtleTtcbiAgICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgICAga2V5ID0gcHJvcHNbbGVuZ3RoXTtcbiAgICAgICAgICAvLyBGYWlsIHdoZW4gdGhlIGtleSBpcyBub3QgZXZlbiBwcmVzZW50XG4gICAgICAgICAgaWYgKCEoa2V5IGluIG9iamVjdCkpIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXN1bHQgPSBfLmlzRXF1YWwob2JqZWN0W2tleV0sIGNhbGxiYWNrW2tleV0pO1xuICAgICAgICAgIGlmICghcmVzdWx0KSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3JpZyhjYWxsYmFjaywgdGhpc0FyZyk7XG4gIH0pO1xuXG4gIC8vIE92ZXJyaWRlIGxvZGFzaCdzIGRlZmF1bHQgaXNFcXVhbCBpbXBsZW1lbnRhdGlvbiBzbyBpdCB1bmRlcnN0YW5kc1xuICAvLyBhYm91dCBleHByZXNzaW9uIGNoYWlucy5cbiAgZnVuY3Rpb24gY21wIChhLCBiKSB7XG4gICAgcmV0dXJuIENoYWluLmlzQ2hhaW4oYSkgPyBhLnRlc3QoYikgOiBDaGFpbi5pc0NoYWluKGIpID8gYi50ZXN0KGEpIDogdW5kZWZpbmVkO1xuICB9XG4gIF8uaXNFcXVhbCA9IF8ud3JhcChfLmlzRXF1YWwsIGZ1bmN0aW9uIChvcmlnLCBhLCBiLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHZhciByZXN1bHQgPSBjYWxsYmFjayA/IGNhbGxiYWNrLmNhbGwodGhpc0FyZyB8fCB0aGlzLCBhLCBiKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJlc3VsdCA9IG9yaWcoYSwgYiwgY21wLCB0aGlzQXJnKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG5cbiAgcmV0dXJuIF87XG59O1xuXG5cbmV4cG9ydHMuc2lub24gPSBmdW5jdGlvbiAoc2lub24pIHtcbiAgLy8gRXhpdCBpZiBhbHJlYWR5IHBhdGNoZWRcbiAgaWYgKHNpbm9uLm1hdGNoLmlzTWF0Y2hlcihjaGVja0NoYWluKSkge1xuICAgIHJldHVybiBzaW5vbjtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIFNpbm9uJ3MgLmlzTWF0Y2hlciBpbXBsZW1lbnRhdGlvbiB0byBhbGxvdyBvdXIgZXhwcmVzc2lvbnMgdG8gYmVcbiAgLy8gdHJhbnNwYXJlbnRseSBzdXBwb3J0ZWQgYnkgaXQuXG4gIHZhciBvbGRJc01hdGNoZXIgPSB1dGlsLmJpbmQoc2lub24ubWF0Y2guaXNNYXRjaGVyLCBzaW5vbi5tYXRjaCk7XG4gIHNpbm9uLm1hdGNoLmlzTWF0Y2hlciA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gQ2hhaW4uaXNDaGFpbihvYmopIHx8IG9sZElzTWF0Y2hlcihvYmopO1xuICB9O1xuXG4gIHJldHVybiBzaW5vbjtcbn07XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgXyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Ll8gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLl8gOiBudWxsKTtcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLy8gVXNlIGEgY2FwcGVkIHBvb2wsIHRoZSByZWxlYXNpbmcgYWxnb3JpdGhtIGlzIHByZXR0eSBzb2xpZCBzbyB3ZSBzaG91bGRcbi8vIGhhdmUgYSBnb29kIHJlLXVzZSByYXRpbyB3aXRoIGp1c3QgYSBmZXcgaW4gdGhlIHBvb2wuIFRoZW4gaW4gY2FzZVxuLy8gc29tZXRoaW5nIGdvZXMgd3JvbmcgdGhlIEdDIHdpbGwgdGFrZSBjYXJlIG9mIGl0IGFmdGVyIGEgd2hpbGUuXG52YXIgcG9vbCA9IHV0aWwuQ2FwcGVkUG9vbCgxMDApO1xudmFyIGNyZWF0ZWQgPSAwO1xuXG5cbi8vIEluc3RhbnRpYXRlcyBhIG5ldyByZXNvbHZlciBmdW5jdG9yXG5mdW5jdGlvbiBmYWN0b3J5ICgpIHtcbiAgLy8gSnVzdCBmb3J3YXJkcyB0aGUgY2FsbCB0byB0aGUgcmVzb2x2ZXIgYnkgc2V0dGluZyBpdHNlbGYgYXMgY29udGV4dC5cbiAgZnVuY3Rpb24gZm4gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHJlc29sdmVyLmNhbGwoZm4sIHZhbHVlKTtcbiAgfVxuXG4gIGZuLmlkID0gKytjcmVhdGVkO1xuXG4gIC8vIFRoZSBzdGF0ZSBpcyBhdHRhY2hlZCB0byB0aGUgZnVuY3Rpb24gb2JqZWN0IHNvIGl0J3MgYXZhaWxhYmxlIHRvIHRoZVxuICAvLyBzdGF0ZS1sZXNzIGZ1bmN0aW9ucyB3aGVuIHJ1bm5pbmcgdW5kZXIgYHRoaXMuYC5cbiAgZm4uY2hhaW4gPSBudWxsO1xuICBmbi5wYXJlbnQgPSBudWxsO1xuICBmbi5wYXVzZWQgPSBmYWxzZTtcbiAgZm4ucmVzb2x2ZWQgPSBbXTtcbiAgZm4uZmluYWxpemVycyA9IFtdO1xuXG4gIC8vIEV4cG9zZSB0aGUgYmVoYXZpb3VyIGluIHRoZSBmdW5jdG9yXG4gIGZuLnBhdXNlID0gcGF1c2U7XG4gIGZuLnJlc3VtZSA9IHJlc3VtZTtcbiAgZm4uZm9yayA9IGZvcms7XG4gIGZuLmpvaW4gPSBqb2luO1xuICBmbi5maW5hbGl6ZSA9IGZpbmFsaXplO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwgJ2V4aGF1c3RlZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlc29sdmVkLmxlbmd0aCA+PSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX18ubGVuZ3RoO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGZuO1xufVxuXG4vLyBUaGlzIGlzIHRoZSBjb3JlIHJlc29sdXRpb24gYWxnb3JpdGhtLCBpdCBvcGVyYXRlcyBvdmVyIHRoZSBjaGFpblxuLy8gb2YgZXhwZWN0YXRpb25zIGNoZWNraW5nIHRoZW0gb25lIGFmdGVyIHRoZSBvdGhlciBhZ2FpbnN0IGEgdmFsdWUuXG4vLyBJZiBhIGZ1bmN0aW9uIGlzIHJldHVybmVkIGl0J2xsIGJlIGltbWVkaWF0ZWx5IGNhbGxlZCB1c2luZyB0aGVcbi8vIGV4cGVjdGF0aW9uIGluc3RhbmNlIGFzIGNvbnRleHQgYW5kIHBhc3NpbmcgYXMgb25seSBhcmd1bWVudCB0aGVcbi8vIGN1cnJlbnQgcmVzb2x2ZSBmdW5jdGlvbiwgdGhpcyBhbGxvd3MgYW4gZXhwZWN0YXRpb24gdG8gb3ZlcnJpZGVcbi8vIHRoZSB2YWx1ZSBhbmQvb3IgY29udHJvbCB0aGUgcmVzb2x1dGlvbiB3aXRob3V0IGV4cG9zaW5nIHRvbyBtYW55XG4vLyBpbnRlcm5hbCBkZXRhaWxzLlxuLy8gV2hlbiBpdCByZXR1cm5zIGB1bmRlZmluZWRgIGl0IGp1c3QgbWVhbnMgdGhhdCB0aGUgcmVzb2x1dGlvbiB3YXNcbi8vIHBhdXNlZCAoYXN5bmMpLCB3ZSBjYW4gbm90IG9idGFpbiBhIGZpbmFsIHJlc3VsdCB1c2luZyBhIHN5bmNocm9ub3VzXG4vLyBjYWxsLiBUaGlzIGNhbiBiZSB1c2VkIGJ5IG1hdGNoZXJzIHdoZW4gdGFraW5nIG92ZXIgdGhlIHJlc29sdXRpb24gdG9cbi8vIGtub3cgaWYgdGhleSBuZWVkIHRvIG1hbmdsZSB0aGUgcmVzdWx0cyBvciB0aGV5IGhhdmUgdG8gcmVnaXN0ZXIgYVxuLy8gZmluYWxpemVyIHRvIGJlIG5vdGlmaWVkIG9mIHRoZSBmaW5hbCByZXN1bHQgZnJvbSB0aGUgY2hhaW4uXG5mdW5jdGlvbiByZXNvbHZlciAodmFsdWUpIHtcbiAgdmFyIGxpc3QsIHJlc3VsdCwgZXhwO1xuXG4gIGxpc3QgPSB0aGlzLmNoYWluLl9fZXhwZWN0YXRpb25zX187XG4gIG9mZnNldCA9IHRoaXMucmVzb2x2ZWQubGVuZ3RoO1xuICByZXN1bHQgPSB0cnVlO1xuXG4gIGZvciAodmFyIGkgPSBvZmZzZXQ7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gQ3JlYXRlIGEgbmV3IG9iamVjdCBpbmhlcml0aW5nIGZyb20gdGhlIGV4cGVjdGF0aW9uIGJ1dCB3aXRoIHRoZVxuICAgIC8vIGN1cnJlbnQgYWN0dWFsIHZhbHVlIHByb3Zpc2lvbmVkLiBJdCBhbGxvd3MgdGhlIGV4cHJlc3Npb24gdG8gbXV0YXRlXG4gICAgLy8gaXRzIHN0YXRlIGZvciB0aGlzIGV4ZWN1dGlvbiBidXQgbm90IGFmZmVjdCBvdGhlciB1c2VzIG9mIGl0LlxuICAgIGV4cCA9IHV0aWwuY3JlYXRlKGxpc3RbaV0sIHsgYWN0dWFsOiB2YWx1ZSB9KTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgcmVzb2x2ZWQgZXhwZWN0YXRpb25zXG4gICAgdGhpcy5yZXNvbHZlZC5wdXNoKGV4cCk7XG5cbiAgICAvLyBFeGVjdXRlIHRoZSBleHBlY3RhdGlvbiB0byBvYnRhaW4gaXRzIHJlc3VsdFxuICAgIHJlc3VsdCA9IGV4cC5yZXN1bHQgPSBleHAucmVzb2x2ZSgpO1xuXG4gICAgLy8gQWxsb3cgZXhwZWN0YXRpb25zIHRvIHRha2UgY29udHJvbCBmb3IgdGhlIHJlbWFpbmluZyBvZiB0aGUgY2hhaW5cbiAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gU2luY2UgdGhlIGNvbnRyb2wgaXMgZGVsZWdhdGVkIHRvIHRoZSBleHByZXNzaW9uIHdlIGRvbid0IGhhdmUgdG9cbiAgICAgIC8vIGRvIGFueXRoaW5nIG1vcmUgaGVyZS5cbiAgICAgIHJldHVybiBleHAucmVzdWx0ID0gcmVzdWx0LmNhbGwoZXhwLCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBTdG9wIG9uIGZpcnN0IGZhaWx1cmVcbiAgICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB3ZSBqdXN0IG5lZWQgdG8gYXBwbHkgYW55IHBlbmRpbmcgZmluYWxpemVyc1xuICByZXR1cm4gdGhpcy5maW5hbGl6ZShyZXN1bHQpO1xufVxuXG5cbi8vIFdoZW4gcmVzb2x2aW5nIGFzeW5jIGZsb3dzIChpLmUuOiBwcm9taXNlcykgdGhpcyB3aWxsIHBhdXNlIHRoZSBnaXZlblxuLy8gcmVzb2x2ZXIgdW50aWwgYSBjYWxsIHRvIC5yZXN1bWUoKSBpcyBtYWRlLlxuZnVuY3Rpb24gcGF1c2UgKCkge1xuICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc29sdmVyIGFscmVhZHkgcGF1c2VkJyk7XG4gIH1cblxuICB0aGlzLnBhdXNlZCA9IHRydWU7XG59XG5cbi8vIE9uY2UgdGhlIGFzeW5jIGZsb3cgaGFzIGNvbXBsZXRlZCB3ZSBjYW4gY29udGludWUgcmVzb2x2aW5nIHdoZXJlIHdlXG4vLyBzdG9wZWQuIFdoZW4gdGhlIG92ZXJyaWRlIHBhcmFtIGlzIG5vdCB1bmRlZmluZWQgd2UnbGwgc2tpcCBjYWxsaW5nIHRoZVxuLy8gcmVzb2x2ZXIgYW5kIGFzc3VtZSB0aGF0IGJvb2wgYXMgdGhlIGZpbmFsIHJlc3VsdC4gVGhpcyBhbGxvd3MgdGhlIGFzeW5jXG4vLyBjb2RlIHRvIHNob3J0Y3V0IHRoZSByZXNvbHZlci5cbmZ1bmN0aW9uIHJlc3VtZSAoYWN0dWFsLCBvdmVycmlkZSkge1xuICBpZiAoIXRoaXMucGF1c2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvbHZlciBpcyBub3QgY3VycmVudGx5IHBhdXNlZCcpO1xuICB9XG5cbiAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcblxuICAvLyBBIGZpbmFsIHJlc3VsdCB3YXMgcHJvdmlkZWQgc28ganVzdCBmaW5hbGl6ZSB0aGUgcmVzb2x2ZXJcbiAgaWYgKG92ZXJyaWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdGhpcy5maW5hbGl6ZShvdmVycmlkZSk7XG4gIH1cblxuICAvLyBMZXQncyBjb250aW51ZSByZXNvbHZpbmcgd2l0aCB0aGUgbmV3IHZhbHVlXG4gIC8vIE5vdGU6IHRoaXMoKSBsb29rcyB3ZWlyZCBidXQgcmVtZW1iZXIgd2UncmUgdXNpbmcgYSBmdW5jdGlvbiBhcyBjb250ZXh0XG4gIHJldHVybiB0aGlzKGFjdHVhbCk7XG59XG5cbi8vIENsb25lcyB0aGUgY3VycmVudCByZXNvbHZlciBzbyB3ZSBjYW4gZm9yayBhbmQgZGlzY2FyZCBvcGVyYXRpb25zLlxuZnVuY3Rpb24gZm9yayAoKSB7XG4gIHZhciBmb3JrID0gYWNxdWlyZSh0aGlzLmNoYWluKTtcbiAgZm9yay5wYXJlbnQgPSB0aGlzO1xuICBmb3JrLnJlc29sdmVkID0gXy5yZWplY3QodGhpcy5yZXNvbHZlZCwgQXJyYXkuaXNBcnJheSk7XG4gIHJldHVybiBmb3JrO1xufVxuXG4vLyBBc3N1bWUgdGhlIHJlc3VsdHMgZnJvbSBhIGZvcmsgaW4gdGhlIG1haW4gcmVzb2x2ZXJcbmZ1bmN0aW9uIGpvaW4gKGZvcmspIHtcbiAgdmFyIGxlbiA9IF8ucmVqZWN0KHRoaXMucmVzb2x2ZWQsIEFycmF5LmlzQXJyYXkpLmxlbmd0aDtcbiAgdGhpcy5yZXNvbHZlZC5wdXNoKFxuICAgIGZvcmsucmVzb2x2ZWQuc2xpY2UobGVuKVxuICApO1xufVxuXG4vLyBXaGVuIHRoZSBhcmd1bWVudCBpcyBhIGZ1bmN0aW9uIGl0IGdldHMgcmVnaXN0ZXJlZCBhcyBhIGZpbmFsaXplciBmb3IgdGhlXG4vLyByZXN1bHQgb2J0YWluZWQgb25jZSB0aGUgZXhwcmVzc2lvbiBoYXMgYmVlbiBmdWxseSByZXNvbHZlZCAoaS5lLiBhc3luYykuXG4vLyBPdGhlcndpc2UgaXQnbGwgZXhlY3V0ZSBhbnkgcmVnaXN0ZXJlZCBmdW5jdGlvbnMgb24gdGhlIGdpdmVuIHJlc3VsdCBhbmRcbi8vIGFsbG93IHRoZW0gdG8gY2hhbmdlIGl0IGJlZm9yZSByZWxlYXNpbmcgdGhlIHJlc29sdmVyIGludG8gdGhlIHBvb2wuXG5mdW5jdGlvbiBmaW5hbGl6ZShyZXN1bHQpIHtcbiAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLmZpbmFsaXplcnMucHVzaChcbiAgICAgIFtyZXN1bHQsIF8ubGFzdCh0aGlzLnJlc29sdmVkKV1cbiAgICApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIE5vdGhpbmcgeWV0IHRvIGZpbmFsaXplIHNpbmNlIHRoZSByZXN1bHQgaXMgc3RpbGwgdW5rbm93blxuICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gQWxsb3cgZmluYWxpemVycyB0byB0b2dnbGUgdGhlIHJlc3VsdCAoTElGTyBvcmRlcilcbiAgdmFyIGZpbmFsaXplcjtcbiAgd2hpbGUgKHRoaXMuZmluYWxpemVycy5sZW5ndGggPiAwKSB7XG4gICAgZmluYWxpemVyID0gdGhpcy5maW5hbGl6ZXJzLnBvcCgpO1xuICAgIHJlc3VsdCA9IGZpbmFsaXplclswXS5jYWxsKGZpbmFsaXplclsxXSwgcmVzdWx0KTtcbiAgICBmaW5hbGl6ZXJbMV0ucmVzdWx0ID0gcmVzdWx0O1xuICB9XG5cbiAgLy8gTGV0IHRoZSBjaGFpbiBkaXNwYXRjaCB0aGUgZmluYWwgcmVzdWx0IGJ1dCBvbmx5IGZvciBub24tZm9ya2VkIHJlc29sdmVyc1xuICBpZiAoIXRoaXMucGFyZW50KSB7XG4gICAgdGhpcy5jaGFpbi5kaXNwYXRjaFJlc3VsdCh0aGlzLnJlc29sdmVkLCByZXN1bHQpO1xuICB9XG5cbiAgLy8gV2hlbiBhIGZpbmFsIHJlc3VsdCBoYXMgYmVlbiBvYnRhaW5lZCByZWxlYXNlIHRoZSByZXNvbHZlciB0byB0aGUgcG9vbFxuICBwb29sLnB1c2godGhpcyk7XG4gIGlmIChwb29sLmxlbmd0aCA+IGNyZWF0ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bvb2wgY29ycnVwdGVkISBDcmVhdGVkICcgKyBjcmVhdGVkICsgJyBidXQgdGhlcmUgYXJlICcgKyBwb29sLmxlbmd0aCArICcgcG9vbGVkJyk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBBY3F1aXJlcyBhIHJlc29sdmVyIGZ1bmN0b3IsIGlmIHRoZXJlIGlzIG9uZSBpbiB0aGUgcG9vbCBpdCdsbCBiZSByZXNldCBhbmRcbi8vIHJldXNlZCwgb3RoZXJ3aXNlIGl0J2xsIGNyZWF0ZSBhIG5ldyBvbmUuIFdoZW4geW91J3JlIGRvbmUgd2l0aCB0aGUgcmVzb2x2ZXJcbi8vIHlvdSBzaG91ZCBnaXZlIGl0IHRvIGByZWxlYXNlKClgIHNvIGl0IGNhbiBiZSBpbmNvcnBvcmF0ZWQgdG8gdGhlIHBvb2wuXG4vLyBUaGUgcmVhc29uIGZvciB1c2luZyBhIHBvb2wgb2Ygb2JqZWN0cyBoZXJlIGlzIHRoYXQgZXZlcnkgdGltZSB3ZSBldmFsdWF0ZVxuLy8gYW4gZXhwcmVzc2lvbiB3ZSdsbCBuZWVkIGEgcmVzb2x2ZXIsIHdoZW4gdXNpbmcgcXVhbnRpZmllcnMgbXVsdGlwbGUgZm9ya3Ncbi8vIHdpbGwgYmUgY3JlYXRlZCwgc28gaXQncyBpbXBvcnRhbnQgdG8gaW1wcm92ZSB0aGUgcGVyZm9ybWFuY2UuXG5mdW5jdGlvbiBhY3F1aXJlIChjaGFpbikge1xuICB2YXIgcmVzb2x2ZXIgPSBwb29sLnBvcCgpIHx8IGZhY3RvcnkoKTtcblxuICAvLyBSZXNldCB0aGUgc3RhdGUgb2YgdGhlIHJlc29sdmVyXG4gIHJlc29sdmVyLmNoYWluID0gY2hhaW47XG4gIHJlc29sdmVyLnBhcmVudCA9IG51bGw7XG4gIHJlc29sdmVyLnBhdXNlZCA9IGZhbHNlO1xuICB3aGlsZSAocmVzb2x2ZXIucmVzb2x2ZWQubGVuZ3RoID4gMCkge1xuICAgIHJlc29sdmVyLnJlc29sdmVkLnBvcCgpO1xuICB9XG4gIHdoaWxlIChyZXNvbHZlci5maW5hbGl6ZXJzLmxlbmd0aCA+IDApIHtcbiAgICByZXNvbHZlci5maW5hbGl6ZXJzLnBvcCgpO1xuICB9XG5cbiAgcmV0dXJuIHJlc29sdmVyO1xufVxuXG5cbmV4cG9ydHMuYWNxdWlyZSA9IGFjcXVpcmU7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOXlaWE52YkhabGNuTXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdYeUE5SUNoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnZDJsdVpHOTNMbDhnT2lCMGVYQmxiMllnWjJ4dlltRnNJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lJRDhnWjJ4dlltRnNMbDhnT2lCdWRXeHNLVHRjYmx4dWRtRnlJSFYwYVd3Z1BTQnlaWEYxYVhKbEtDY3VMM1YwYVd3bktUdGNibHh1THk4Z1ZYTmxJR0VnWTJGd2NHVmtJSEJ2YjJ3c0lIUm9aU0J5Wld4bFlYTnBibWNnWVd4bmIzSnBkR2h0SUdseklIQnlaWFIwZVNCemIyeHBaQ0J6YnlCM1pTQnphRzkxYkdSY2JpOHZJR2hoZG1VZ1lTQm5iMjlrSUhKbExYVnpaU0J5WVhScGJ5QjNhWFJvSUdwMWMzUWdZU0JtWlhjZ2FXNGdkR2hsSUhCdmIyd3VJRlJvWlc0Z2FXNGdZMkZ6WlZ4dUx5OGdjMjl0WlhSb2FXNW5JR2R2WlhNZ2QzSnZibWNnZEdobElFZERJSGRwYkd3Z2RHRnJaU0JqWVhKbElHOW1JR2wwSUdGbWRHVnlJR0VnZDJocGJHVXVYRzUyWVhJZ2NHOXZiQ0E5SUhWMGFXd3VRMkZ3Y0dWa1VHOXZiQ2d4TURBcE8xeHVkbUZ5SUdOeVpXRjBaV1FnUFNBd08xeHVYRzVjYmk4dklFbHVjM1JoYm5ScFlYUmxjeUJoSUc1bGR5QnlaWE52YkhabGNpQm1kVzVqZEc5eVhHNW1kVzVqZEdsdmJpQm1ZV04wYjNKNUlDZ3BJSHRjYmlBZ0x5OGdTblZ6ZENCbWIzSjNZWEprY3lCMGFHVWdZMkZzYkNCMGJ5QjBhR1VnY21WemIyeDJaWElnWW5rZ2MyVjBkR2x1WnlCcGRITmxiR1lnWVhNZ1kyOXVkR1Y0ZEM1Y2JpQWdablZ1WTNScGIyNGdabTRnS0haaGJIVmxLU0I3WEc0Z0lDQWdjbVYwZFhKdUlISmxjMjlzZG1WeUxtTmhiR3dvWm00c0lIWmhiSFZsS1R0Y2JpQWdmVnh1WEc0Z0lHWnVMbWxrSUQwZ0t5dGpjbVZoZEdWa08xeHVYRzRnSUM4dklGUm9aU0J6ZEdGMFpTQnBjeUJoZEhSaFkyaGxaQ0IwYnlCMGFHVWdablZ1WTNScGIyNGdiMkpxWldOMElITnZJR2wwSjNNZ1lYWmhhV3hoWW14bElIUnZJSFJvWlZ4dUlDQXZMeUJ6ZEdGMFpTMXNaWE56SUdaMWJtTjBhVzl1Y3lCM2FHVnVJSEoxYm01cGJtY2dkVzVrWlhJZ1lIUm9hWE11WUM1Y2JpQWdabTR1WTJoaGFXNGdQU0J1ZFd4c08xeHVJQ0JtYmk1d1lYSmxiblFnUFNCdWRXeHNPMXh1SUNCbWJpNXdZWFZ6WldRZ1BTQm1ZV3h6WlR0Y2JpQWdabTR1Y21WemIyeDJaV1FnUFNCYlhUdGNiaUFnWm00dVptbHVZV3hwZW1WeWN5QTlJRnRkTzF4dVhHNGdJQzh2SUVWNGNHOXpaU0IwYUdVZ1ltVm9ZWFpwYjNWeUlHbHVJSFJvWlNCbWRXNWpkRzl5WEc0Z0lHWnVMbkJoZFhObElEMGdjR0YxYzJVN1hHNGdJR1p1TG5KbGMzVnRaU0E5SUhKbGMzVnRaVHRjYmlBZ1ptNHVabTl5YXlBOUlHWnZjbXM3WEc0Z0lHWnVMbXB2YVc0Z1BTQnFiMmx1TzF4dUlDQm1iaTVtYVc1aGJHbDZaU0E5SUdacGJtRnNhWHBsTzF4dVhHNGdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNobWJpd2dKMlY0YUdGMWMzUmxaQ2NzSUh0Y2JpQWdJQ0JuWlhRNklHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG5KbGMyOXNkbVZrTG14bGJtZDBhQ0ErUFNCMGFHbHpMbU5vWVdsdUxsOWZaWGh3WldOMFlYUnBiMjV6WDE4dWJHVnVaM1JvTzF4dUlDQWdJSDFjYmlBZ2ZTazdYRzVjYmlBZ2NtVjBkWEp1SUdadU8xeHVmVnh1WEc0dkx5QlVhR2x6SUdseklIUm9aU0JqYjNKbElISmxjMjlzZFhScGIyNGdZV3huYjNKcGRHaHRMQ0JwZENCdmNHVnlZWFJsY3lCdmRtVnlJSFJvWlNCamFHRnBibHh1THk4Z2IyWWdaWGh3WldOMFlYUnBiMjV6SUdOb1pXTnJhVzVuSUhSb1pXMGdiMjVsSUdGbWRHVnlJSFJvWlNCdmRHaGxjaUJoWjJGcGJuTjBJR0VnZG1Gc2RXVXVYRzR2THlCSlppQmhJR1oxYm1OMGFXOXVJR2x6SUhKbGRIVnlibVZrSUdsMEoyeHNJR0psSUdsdGJXVmthV0YwWld4NUlHTmhiR3hsWkNCMWMybHVaeUIwYUdWY2JpOHZJR1Y0Y0dWamRHRjBhVzl1SUdsdWMzUmhibU5sSUdGeklHTnZiblJsZUhRZ1lXNWtJSEJoYzNOcGJtY2dZWE1nYjI1c2VTQmhjbWQxYldWdWRDQjBhR1ZjYmk4dklHTjFjbkpsYm5RZ2NtVnpiMngyWlNCbWRXNWpkR2x2Yml3Z2RHaHBjeUJoYkd4dmQzTWdZVzRnWlhod1pXTjBZWFJwYjI0Z2RHOGdiM1psY25KcFpHVmNiaTh2SUhSb1pTQjJZV3gxWlNCaGJtUXZiM0lnWTI5dWRISnZiQ0IwYUdVZ2NtVnpiMngxZEdsdmJpQjNhWFJvYjNWMElHVjRjRzl6YVc1bklIUnZieUJ0WVc1NVhHNHZMeUJwYm5SbGNtNWhiQ0JrWlhSaGFXeHpMbHh1THk4Z1YyaGxiaUJwZENCeVpYUjFjbTV6SUdCMWJtUmxabWx1WldSZ0lHbDBJR3AxYzNRZ2JXVmhibk1nZEdoaGRDQjBhR1VnY21WemIyeDFkR2x2YmlCM1lYTmNiaTh2SUhCaGRYTmxaQ0FvWVhONWJtTXBMQ0IzWlNCallXNGdibTkwSUc5aWRHRnBiaUJoSUdacGJtRnNJSEpsYzNWc2RDQjFjMmx1WnlCaElITjVibU5vY205dWIzVnpYRzR2THlCallXeHNMaUJVYUdseklHTmhiaUJpWlNCMWMyVmtJR0o1SUcxaGRHTm9aWEp6SUhkb1pXNGdkR0ZyYVc1bklHOTJaWElnZEdobElISmxjMjlzZFhScGIyNGdkRzljYmk4dklHdHViM2NnYVdZZ2RHaGxlU0J1WldWa0lIUnZJRzFoYm1kc1pTQjBhR1VnY21WemRXeDBjeUJ2Y2lCMGFHVjVJR2hoZG1VZ2RHOGdjbVZuYVhOMFpYSWdZVnh1THk4Z1ptbHVZV3hwZW1WeUlIUnZJR0psSUc1dmRHbG1hV1ZrSUc5bUlIUm9aU0JtYVc1aGJDQnlaWE4xYkhRZ1puSnZiU0IwYUdVZ1kyaGhhVzR1WEc1bWRXNWpkR2x2YmlCeVpYTnZiSFpsY2lBb2RtRnNkV1VwSUh0Y2JpQWdkbUZ5SUd4cGMzUXNJSEpsYzNWc2RDd2daWGh3TzF4dVhHNGdJR3hwYzNRZ1BTQjBhR2x6TG1Ob1lXbHVMbDlmWlhod1pXTjBZWFJwYjI1elgxODdYRzRnSUc5bVpuTmxkQ0E5SUhSb2FYTXVjbVZ6YjJ4MlpXUXViR1Z1WjNSb08xeHVJQ0J5WlhOMWJIUWdQU0IwY25WbE8xeHVYRzRnSUdadmNpQW9kbUZ5SUdrZ1BTQnZabVp6WlhRN0lHa2dQQ0JzYVhOMExteGxibWQwYURzZ2FTc3JLU0I3WEc0Z0lDQWdMeThnUTNKbFlYUmxJR0VnYm1WM0lHOWlhbVZqZENCcGJtaGxjbWwwYVc1bklHWnliMjBnZEdobElHVjRjR1ZqZEdGMGFXOXVJR0oxZENCM2FYUm9JSFJvWlZ4dUlDQWdJQzh2SUdOMWNuSmxiblFnWVdOMGRXRnNJSFpoYkhWbElIQnliM1pwYzJsdmJtVmtMaUJKZENCaGJHeHZkM01nZEdobElHVjRjSEpsYzNOcGIyNGdkRzhnYlhWMFlYUmxYRzRnSUNBZ0x5OGdhWFJ6SUhOMFlYUmxJR1p2Y2lCMGFHbHpJR1Y0WldOMWRHbHZiaUJpZFhRZ2JtOTBJR0ZtWm1WamRDQnZkR2hsY2lCMWMyVnpJRzltSUdsMExseHVJQ0FnSUdWNGNDQTlJSFYwYVd3dVkzSmxZWFJsS0d4cGMzUmJhVjBzSUhzZ1lXTjBkV0ZzT2lCMllXeDFaU0I5S1R0Y2JseHVJQ0FnSUM4dklFdGxaWEFnZEhKaFkyc2diMllnY21WemIyeDJaV1FnWlhod1pXTjBZWFJwYjI1elhHNGdJQ0FnZEdocGN5NXlaWE52YkhabFpDNXdkWE5vS0dWNGNDazdYRzVjYmlBZ0lDQXZMeUJGZUdWamRYUmxJSFJvWlNCbGVIQmxZM1JoZEdsdmJpQjBieUJ2WW5SaGFXNGdhWFJ6SUhKbGMzVnNkRnh1SUNBZ0lISmxjM1ZzZENBOUlHVjRjQzV5WlhOMWJIUWdQU0JsZUhBdWNtVnpiMngyWlNncE8xeHVYRzRnSUNBZ0x5OGdRV3hzYjNjZ1pYaHdaV04wWVhScGIyNXpJSFJ2SUhSaGEyVWdZMjl1ZEhKdmJDQm1iM0lnZEdobElISmxiV0ZwYm1sdVp5QnZaaUIwYUdVZ1kyaGhhVzVjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JSEpsYzNWc2RDQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUNBZ0x5OGdVMmx1WTJVZ2RHaGxJR052Ym5SeWIyd2dhWE1nWkdWc1pXZGhkR1ZrSUhSdklIUm9aU0JsZUhCeVpYTnphVzl1SUhkbElHUnZiaWQwSUdoaGRtVWdkRzljYmlBZ0lDQWdJQzh2SUdSdklHRnVlWFJvYVc1bklHMXZjbVVnYUdWeVpTNWNiaUFnSUNBZ0lISmxkSFZ5YmlCbGVIQXVjbVZ6ZFd4MElEMGdjbVZ6ZFd4MExtTmhiR3dvWlhod0xDQjBhR2x6S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2THlCVGRHOXdJRzl1SUdacGNuTjBJR1poYVd4MWNtVmNiaUFnSUNCcFppQW9jbVZ6ZFd4MElEMDlQU0JtWVd4elpTa2dlMXh1SUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnZlZ4dUlDQjlYRzVjYmlBZ0x5OGdRWFFnZEdocGN5QndiMmx1ZENCM1pTQnFkWE4wSUc1bFpXUWdkRzhnWVhCd2JIa2dZVzU1SUhCbGJtUnBibWNnWm1sdVlXeHBlbVZ5YzF4dUlDQnlaWFIxY200Z2RHaHBjeTVtYVc1aGJHbDZaU2h5WlhOMWJIUXBPMXh1ZlZ4dVhHNWNiaTh2SUZkb1pXNGdjbVZ6YjJ4MmFXNW5JR0Z6ZVc1aklHWnNiM2R6SUNocExtVXVPaUJ3Y205dGFYTmxjeWtnZEdocGN5QjNhV3hzSUhCaGRYTmxJSFJvWlNCbmFYWmxibHh1THk4Z2NtVnpiMngyWlhJZ2RXNTBhV3dnWVNCallXeHNJSFJ2SUM1eVpYTjFiV1VvS1NCcGN5QnRZV1JsTGx4dVpuVnVZM1JwYjI0Z2NHRjFjMlVnS0NrZ2UxeHVJQ0JwWmlBb2RHaHBjeTV3WVhWelpXUXBJSHRjYmlBZ0lDQjBhSEp2ZHlCdVpYY2dSWEp5YjNJb0oxSmxjMjlzZG1WeUlHRnNjbVZoWkhrZ2NHRjFjMlZrSnlrN1hHNGdJSDFjYmx4dUlDQjBhR2x6TG5CaGRYTmxaQ0E5SUhSeWRXVTdYRzU5WEc1Y2JpOHZJRTl1WTJVZ2RHaGxJR0Z6ZVc1aklHWnNiM2NnYUdGeklHTnZiWEJzWlhSbFpDQjNaU0JqWVc0Z1kyOXVkR2x1ZFdVZ2NtVnpiMngyYVc1bklIZG9aWEpsSUhkbFhHNHZMeUJ6ZEc5d1pXUXVJRmRvWlc0Z2RHaGxJRzkyWlhKeWFXUmxJSEJoY21GdElHbHpJRzV2ZENCMWJtUmxabWx1WldRZ2QyVW5iR3dnYzJ0cGNDQmpZV3hzYVc1bklIUm9aVnh1THk4Z2NtVnpiMngyWlhJZ1lXNWtJR0Z6YzNWdFpTQjBhR0YwSUdKdmIyd2dZWE1nZEdobElHWnBibUZzSUhKbGMzVnNkQzRnVkdocGN5QmhiR3h2ZDNNZ2RHaGxJR0Z6ZVc1alhHNHZMeUJqYjJSbElIUnZJSE5vYjNKMFkzVjBJSFJvWlNCeVpYTnZiSFpsY2k1Y2JtWjFibU4wYVc5dUlISmxjM1Z0WlNBb1lXTjBkV0ZzTENCdmRtVnljbWxrWlNrZ2UxeHVJQ0JwWmlBb0lYUm9hWE11Y0dGMWMyVmtLU0I3WEc0Z0lDQWdkR2h5YjNjZ2JtVjNJRVZ5Y205eUtDZFNaWE52YkhabGNpQnBjeUJ1YjNRZ1kzVnljbVZ1ZEd4NUlIQmhkWE5sWkNjcE8xeHVJQ0I5WEc1Y2JpQWdkR2hwY3k1d1lYVnpaV1FnUFNCbVlXeHpaVHRjYmx4dUlDQXZMeUJCSUdacGJtRnNJSEpsYzNWc2RDQjNZWE1nY0hKdmRtbGtaV1FnYzI4Z2FuVnpkQ0JtYVc1aGJHbDZaU0IwYUdVZ2NtVnpiMngyWlhKY2JpQWdhV1lnS0c5MlpYSnlhV1JsSUNFOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQnlaWFIxY200Z2RHaHBjeTVtYVc1aGJHbDZaU2h2ZG1WeWNtbGtaU2s3WEc0Z0lIMWNibHh1SUNBdkx5Qk1aWFFuY3lCamIyNTBhVzUxWlNCeVpYTnZiSFpwYm1jZ2QybDBhQ0IwYUdVZ2JtVjNJSFpoYkhWbFhHNGdJQzh2SUU1dmRHVTZJSFJvYVhNb0tTQnNiMjlyY3lCM1pXbHlaQ0JpZFhRZ2NtVnRaVzFpWlhJZ2QyVW5jbVVnZFhOcGJtY2dZU0JtZFc1amRHbHZiaUJoY3lCamIyNTBaWGgwWEc0Z0lISmxkSFZ5YmlCMGFHbHpLR0ZqZEhWaGJDazdYRzU5WEc1Y2JpOHZJRU5zYjI1bGN5QjBhR1VnWTNWeWNtVnVkQ0J5WlhOdmJIWmxjaUJ6YnlCM1pTQmpZVzRnWm05eWF5QmhibVFnWkdselkyRnlaQ0J2Y0dWeVlYUnBiMjV6TGx4dVpuVnVZM1JwYjI0Z1ptOXlheUFvS1NCN1hHNGdJSFpoY2lCbWIzSnJJRDBnWVdOeGRXbHlaU2gwYUdsekxtTm9ZV2x1S1R0Y2JpQWdabTl5YXk1d1lYSmxiblFnUFNCMGFHbHpPMXh1SUNCbWIzSnJMbkpsYzI5c2RtVmtJRDBnWHk1eVpXcGxZM1FvZEdocGN5NXlaWE52YkhabFpDd2dRWEp5WVhrdWFYTkJjbkpoZVNrN1hHNGdJSEpsZEhWeWJpQm1iM0pyTzF4dWZWeHVYRzR2THlCQmMzTjFiV1VnZEdobElISmxjM1ZzZEhNZ1puSnZiU0JoSUdadmNtc2dhVzRnZEdobElHMWhhVzRnY21WemIyeDJaWEpjYm1aMWJtTjBhVzl1SUdwdmFXNGdLR1p2Y21zcElIdGNiaUFnZG1GeUlHeGxiaUE5SUY4dWNtVnFaV04wS0hSb2FYTXVjbVZ6YjJ4MlpXUXNJRUZ5Y21GNUxtbHpRWEp5WVhrcExteGxibWQwYUR0Y2JpQWdkR2hwY3k1eVpYTnZiSFpsWkM1d2RYTm9LRnh1SUNBZ0lHWnZjbXN1Y21WemIyeDJaV1F1YzJ4cFkyVW9iR1Z1S1Z4dUlDQXBPMXh1ZlZ4dVhHNHZMeUJYYUdWdUlIUm9aU0JoY21kMWJXVnVkQ0JwY3lCaElHWjFibU4wYVc5dUlHbDBJR2RsZEhNZ2NtVm5hWE4wWlhKbFpDQmhjeUJoSUdacGJtRnNhWHBsY2lCbWIzSWdkR2hsWEc0dkx5QnlaWE4xYkhRZ2IySjBZV2x1WldRZ2IyNWpaU0IwYUdVZ1pYaHdjbVZ6YzJsdmJpQm9ZWE1nWW1WbGJpQm1kV3hzZVNCeVpYTnZiSFpsWkNBb2FTNWxMaUJoYzNsdVl5a3VYRzR2THlCUGRHaGxjbmRwYzJVZ2FYUW5iR3dnWlhobFkzVjBaU0JoYm5rZ2NtVm5hWE4wWlhKbFpDQm1kVzVqZEdsdmJuTWdiMjRnZEdobElHZHBkbVZ1SUhKbGMzVnNkQ0JoYm1SY2JpOHZJR0ZzYkc5M0lIUm9aVzBnZEc4Z1kyaGhibWRsSUdsMElHSmxabTl5WlNCeVpXeGxZWE5wYm1jZ2RHaGxJSEpsYzI5c2RtVnlJR2x1ZEc4Z2RHaGxJSEJ2YjJ3dVhHNW1kVzVqZEdsdmJpQm1hVzVoYkdsNlpTaHlaWE4xYkhRcElIdGNiaUFnYVdZZ0tIUjVjR1Z2WmlCeVpYTjFiSFFnUFQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ0lDQjBhR2x6TG1acGJtRnNhWHBsY25NdWNIVnphQ2hjYmlBZ0lDQWdJRnR5WlhOMWJIUXNJRjh1YkdGemRDaDBhR2x6TG5KbGMyOXNkbVZrS1YxY2JpQWdJQ0FwTzF4dUlDQWdJSEpsZEhWeWJqdGNiaUFnZlZ4dVhHNGdJQzh2SUU1dmRHaHBibWNnZVdWMElIUnZJR1pwYm1Gc2FYcGxJSE5wYm1ObElIUm9aU0J5WlhOMWJIUWdhWE1nYzNScGJHd2dkVzVyYm05M2JseHVJQ0JwWmlBb2NtVnpkV3gwSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa08xeHVJQ0I5WEc1Y2JpQWdMeThnUVd4c2IzY2dabWx1WVd4cGVtVnljeUIwYnlCMGIyZG5iR1VnZEdobElISmxjM1ZzZENBb1RFbEdUeUJ2Y21SbGNpbGNiaUFnZG1GeUlHWnBibUZzYVhwbGNqdGNiaUFnZDJocGJHVWdLSFJvYVhNdVptbHVZV3hwZW1WeWN5NXNaVzVuZEdnZ1BpQXdLU0I3WEc0Z0lDQWdabWx1WVd4cGVtVnlJRDBnZEdocGN5NW1hVzVoYkdsNlpYSnpMbkJ2Y0NncE8xeHVJQ0FnSUhKbGMzVnNkQ0E5SUdacGJtRnNhWHBsY2xzd1hTNWpZV3hzS0dacGJtRnNhWHBsY2xzeFhTd2djbVZ6ZFd4MEtUdGNiaUFnSUNCbWFXNWhiR2w2WlhKYk1WMHVjbVZ6ZFd4MElEMGdjbVZ6ZFd4ME8xeHVJQ0I5WEc1Y2JpQWdMeThnVEdWMElIUm9aU0JqYUdGcGJpQmthWE53WVhSamFDQjBhR1VnWm1sdVlXd2djbVZ6ZFd4MElHSjFkQ0J2Ym14NUlHWnZjaUJ1YjI0dFptOXlhMlZrSUhKbGMyOXNkbVZ5YzF4dUlDQnBaaUFvSVhSb2FYTXVjR0Z5Wlc1MEtTQjdYRzRnSUNBZ2RHaHBjeTVqYUdGcGJpNWthWE53WVhSamFGSmxjM1ZzZENoMGFHbHpMbkpsYzI5c2RtVmtMQ0J5WlhOMWJIUXBPMXh1SUNCOVhHNWNiaUFnTHk4Z1YyaGxiaUJoSUdacGJtRnNJSEpsYzNWc2RDQm9ZWE1nWW1WbGJpQnZZblJoYVc1bFpDQnlaV3hsWVhObElIUm9aU0J5WlhOdmJIWmxjaUIwYnlCMGFHVWdjRzl2YkZ4dUlDQndiMjlzTG5CMWMyZ29kR2hwY3lrN1hHNGdJR2xtSUNod2IyOXNMbXhsYm1kMGFDQStJR055WldGMFpXUXBJSHRjYmlBZ0lDQjBhSEp2ZHlCdVpYY2dSWEp5YjNJb0oxQnZiMndnWTI5eWNuVndkR1ZrSVNCRGNtVmhkR1ZrSUNjZ0t5QmpjbVZoZEdWa0lDc2dKeUJpZFhRZ2RHaGxjbVVnWVhKbElDY2dLeUJ3YjI5c0xteGxibWQwYUNBcklDY2djRzl2YkdWa0p5azdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdjbVZ6ZFd4ME8xeHVmVnh1WEc0dkx5QkJZM0YxYVhKbGN5QmhJSEpsYzI5c2RtVnlJR1oxYm1OMGIzSXNJR2xtSUhSb1pYSmxJR2x6SUc5dVpTQnBiaUIwYUdVZ2NHOXZiQ0JwZENkc2JDQmlaU0J5WlhObGRDQmhibVJjYmk4dklISmxkWE5sWkN3Z2IzUm9aWEozYVhObElHbDBKMnhzSUdOeVpXRjBaU0JoSUc1bGR5QnZibVV1SUZkb1pXNGdlVzkxSjNKbElHUnZibVVnZDJsMGFDQjBhR1VnY21WemIyeDJaWEpjYmk4dklIbHZkU0J6YUc5MVpDQm5hWFpsSUdsMElIUnZJR0J5Wld4bFlYTmxLQ2xnSUhOdklHbDBJR05oYmlCaVpTQnBibU52Y25CdmNtRjBaV1FnZEc4Z2RHaGxJSEJ2YjJ3dVhHNHZMeUJVYUdVZ2NtVmhjMjl1SUdadmNpQjFjMmx1WnlCaElIQnZiMndnYjJZZ2IySnFaV04wY3lCb1pYSmxJR2x6SUhSb1lYUWdaWFpsY25rZ2RHbHRaU0IzWlNCbGRtRnNkV0YwWlZ4dUx5OGdZVzRnWlhod2NtVnpjMmx2YmlCM1pTZHNiQ0J1WldWa0lHRWdjbVZ6YjJ4MlpYSXNJSGRvWlc0Z2RYTnBibWNnY1hWaGJuUnBabWxsY25NZ2JYVnNkR2x3YkdVZ1ptOXlhM05jYmk4dklIZHBiR3dnWW1VZ1kzSmxZWFJsWkN3Z2MyOGdhWFFuY3lCcGJYQnZjblJoYm5RZ2RHOGdhVzF3Y205MlpTQjBhR1VnY0dWeVptOXliV0Z1WTJVdVhHNW1kVzVqZEdsdmJpQmhZM0YxYVhKbElDaGphR0ZwYmlrZ2UxeHVJQ0IyWVhJZ2NtVnpiMngyWlhJZ1BTQndiMjlzTG5CdmNDZ3BJSHg4SUdaaFkzUnZjbmtvS1R0Y2JseHVJQ0F2THlCU1pYTmxkQ0IwYUdVZ2MzUmhkR1VnYjJZZ2RHaGxJSEpsYzI5c2RtVnlYRzRnSUhKbGMyOXNkbVZ5TG1Ob1lXbHVJRDBnWTJoaGFXNDdYRzRnSUhKbGMyOXNkbVZ5TG5CaGNtVnVkQ0E5SUc1MWJHdzdYRzRnSUhKbGMyOXNkbVZ5TG5CaGRYTmxaQ0E5SUdaaGJITmxPMXh1SUNCM2FHbHNaU0FvY21WemIyeDJaWEl1Y21WemIyeDJaV1F1YkdWdVozUm9JRDRnTUNrZ2UxeHVJQ0FnSUhKbGMyOXNkbVZ5TG5KbGMyOXNkbVZrTG5CdmNDZ3BPMXh1SUNCOVhHNGdJSGRvYVd4bElDaHlaWE52YkhabGNpNW1hVzVoYkdsNlpYSnpMbXhsYm1kMGFDQStJREFwSUh0Y2JpQWdJQ0J5WlhOdmJIWmxjaTVtYVc1aGJHbDZaWEp6TG5CdmNDZ3BPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJSEpsYzI5c2RtVnlPMXh1ZlZ4dVhHNWNibVY0Y0c5eWRITXVZV054ZFdseVpTQTlJR0ZqY1hWcGNtVTdYRzRpWFgwPSIsIi8vIFN1cHBvcnQgZm9yIC5zaG91bGQgc3R5bGUgc3ludGF4LCBub3RpY2UgdGhhdCB3aGlsZSBoZXJlIHJlc2lkZXMgdGhlIGNvcmVcbi8vIGxvZ2ljIGZvciBpdCwgdGhlIGludGVyZmFjZSBpcyBkb25lIGluIGFzcy5qcyBpbiBvcmRlciB0byBtYWtlIGl0IHJldHVyblxuLy8gdGhlIGBhc3NgIGZ1bmN0aW9uIGFuZCBwcm92aWRlIHN1cHBvcnQgZm9yIGl0cyB1c2Ugb24gYmVmb3JlRWFjaC9hZnRlckVhY2guXG5cbnZhciBDaGFpbiA9IHJlcXVpcmUoJy4vY2hhaW4nKTtcblxuXG52YXIgREVGQVVMVF9QUk9QID0gJ3Nob3VsZCc7XG5cbi8vIEluc3RhbGxzIHRoZSB0eXBpY2FsIC5zaG91bGQgcHJvcGVydHkgb24gdGhlIHJvb3QgT2JqZWN0IHByb3RvdHlwZS5cbi8vIFlvdSBjYW4gaW5zdGFsbCB1bmRlciBhbnkgbmFtZSBvZiB5b3VyIGNob29zaW5nIGJ5IGdpdmluZyBpdCBhcyBhcmd1bWVudC5cbi8vXG4vLyBCYXNpY2FsbHkgYm9ycm93ZWQgZnJvbSB0aGUgQ2hhaSBwcm9qZWN0OlxuLy8gIENvcHlyaWdodChjKSAyMDExLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4vLyAgaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9jaGFpL2Jsb2IvbWFzdGVyL2xpYi9jaGFpL2ludGVyZmFjZS9zaG91bGQuanNcbmZ1bmN0aW9uIHNob3VsZCAobmFtZSkge1xuICBpZiAobmFtZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBzaG91bGQucmVzdG9yZSgpO1xuICB9XG5cbiAgbmFtZSA9IG5hbWUgfHwgREVGQVVMVF9QUk9QO1xuXG4gIGlmIChuYW1lIGluIE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICBpZiAoIUNoYWluLmlzQ2hhaW4oT2JqZWN0LnByb3RvdHlwZVtuYW1lXSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXNzLnNob3VsZDogT2JqZWN0LnByb3RvdHlwZSBhbHJlYWR5IGhhcyBhIC4nICsgbmFtZSArICcgcHJvcGVydHknKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gbW9kaWZ5IE9iamVjdC5wcm90b3R5cGUgdG8gaGF2ZSBgPG5hbWU+YFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgbmFtZSwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKENoYWluLmlzQ2hhaW4odGhpcykpIHtcbiAgICAgICAgLy8gQWN0dWFsbHkgQ2hhaW4gaW5zdGFuY2VzIGRvbid0IGluaGVyaXQgZnJvbSBPYmplY3QgYnV0IHN0aWxsXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSBlbHNlIGlmICh0aGlzIGluc3RhbmNlb2YgU3RyaW5nIHx8IHRoaXMgaW5zdGFuY2VvZiBOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzLmNvbnN0cnVjdG9yKHRoaXMpKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIEJvb2xlYW4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzID09IHRydWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBDaGFpbih0aGlzKTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBBbGxvdzogZ2xvYmFsLmFzcyA9IHJlcXVpcmUoJ2FzcycpLnNob3VsZCgpXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLCAgLy8gQWxsb3cgcmVzdG9yYXRpb25cbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICB9KTtcblxuICAvLyBFeHBvc2UgaXQgYXMgYSBuby1vcCBvbiBDaGFpbnMgc2luY2UgdGhleSBkb24ndCBpbmhlcml0IGZyb20gT2JqZWN0XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDaGFpbi5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlICAvLyBBbGxvdyByZXN0b3JhdGlvblxuICB9KTtcblxufVxuXG5zaG91bGQucmVzdG9yZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIG5hbWUgPSBuYW1lIHx8IERFRkFVTFRfUFJPUDtcblxuICBpZiAobmFtZSBpbiBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgaWYgKENoYWluLmlzQ2hhaW4oT2JqZWN0LnByb3RvdHlwZVtuYW1lXSkpIHtcbiAgICAgIGRlbGV0ZSBPYmplY3QucHJvdG90eXBlW25hbWVdO1xuICAgICAgZGVsZXRlIENoYWluLnByb3RvdHlwZVtuYW1lXTtcbiAgICB9XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGQ7XG4iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbnZhciBfID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuXyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuXyA6IG51bGwpO1xuXG4vLyBHZXQgdGhlIG5hdGl2ZSBQcm9taXNlIG9yIGEgc2hpbVxuZXhwb3J0cy5Qcm9taXNlID0gZ2xvYmFsLlByb21pc2UgfHwgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cud2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC53aW5kb3cgOiBudWxsKS5Qcm9taXNlO1xuXG5cbi8vIENhcHBlZCBwb29sIHRvIGxpbWl0IHRoZSBtYXhpbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IGNhbiBiZVxuLy8gc3RvcmVkICh1bmJvdW5kZWQgYnkgZGVmYXVsdCkuXG5leHBvcnRzLkNhcHBlZFBvb2wgPSBmdW5jdGlvbiAobWF4KSB7XG4gIHZhciBwb29sID0gW107XG5cbiAgbWF4ID0gbWF4IHx8IE51bWJlci5NQVhfVkFMVUU7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHBvb2wsICdwdXNoJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAodikge1xuICAgICAgaWYgKHRoaXMubGVuZ3RoIDwgbWF4KSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwodGhpcywgdik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcG9vbDtcbn07XG5cblxudmFyIGRvQ29sb3JzID0gXy5vbmNlKGZ1bmN0aW9uICgpIHtcbiAgLy8gTWFzdGVyIG92ZXJyaWRlIHdpdGggb3VyIGN1c3RvbSBlbnYgdmFyaWFibGVcbiAgaWYgKHByb2Nlc3MuZW52LkFTU19DT0xPUlMgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAvdHJ1ZXxvbnx5ZXN8ZW5hYmxlZD98MS9pLnRlc3QocHJvY2Vzcy5lbnYuQVNTX0NPTE9SUyk7XG4gIH1cblxuICAvLyBDaGVjayBpZiBLYXJtYSBpcyBiZWluZyB1c2VkIGFuZCBoYXMgZGVmaW5lZCB0aGUgY29sb3JzXG4gIHZhciBrYXJtYSA9IGdsb2JhbC5fX2thcm1hX187XG4gIGlmIChrYXJtYSAmJiBrYXJtYS5jb25maWcgJiYgdHlwZW9mIGthcm1hLmNvbmZpZy5jb2xvcnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGthcm1hLmNvbmZpZy5jb2xvcnM7XG4gIH1cblxuICAvLyBDaGVjayBpZiBtb2NoYSBpcyBhcm91bmQgYW5kIHZlcmlmeSBhZ2FpbnN0IGl0cyBjb25maWd1cmF0aW9uXG4gIHZhciBNb2NoYSA9IGdsb2JhbC5Nb2NoYTtcbiAgaWYgKE1vY2hhID09PSB1bmRlZmluZWQgJiYgcmVxdWlyZS5yZXNvbHZlICYmIHJlcXVpcmUucmVzb2x2ZSgnbW9jaGEnKSkge1xuICAgIE1vY2hhID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuTW9jaGEgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLk1vY2hhIDogbnVsbCk7XG4gIH1cbiAgaWYgKE1vY2hhICE9PSB1bmRlZmluZWQgJiYgTW9jaGEucmVwb3J0ZXJzICE9PSB1bmRlZmluZWQgJiYgTW9jaGEucmVwb3J0ZXJzLkJhc2UgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBNb2NoYS5yZXBvcnRlcnMuQmFzZS51c2VDb2xvcnM7XG4gIH1cblxuICAvLyBRdWVyeSB0aGUgZW52aXJvbm1lbnQgYW5kIHNlZSBpZiBzb21lIGNvbW1vbiB2YXJpYWJsZXMgYXJlIHNldFxuICBpZiAocHJvY2Vzcy5lbnYuTU9DSEFfQ09MT1JTICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoLy0tY29sb3I9YWx3YXlzLy50ZXN0KHByb2Nlc3MuZW52LkdSRVBfT1BUSU9OUyB8fCAnJykpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIEZpbmFsbHkganVzdCBjaGVjayBpZiB0aGUgZW52aXJvbm1lbnQgaXMgY2FwYWJsZVxuICB2YXIgdHR5ID0gcmVxdWlyZSgndHR5Jyk7XG4gIHJldHVybiB0dHkuaXNhdHR5KDEpICYmIHR0eS5pc2F0dHkoMik7XG59KTtcblxuXG4vLyBSZW1vdmUgQU5TSSBlc2NhcGVzIGZyb20gYSBzdHJpbmdcbmZ1bmN0aW9uIHVuYW5zaSAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXFx4MWJcXFsoXFxkKzs/KStbYS16XS9naSwgJycpO1xufVxuXG5cbi8vIEF2b2lkIHJlcGVhdGVkIGNvbXBpbGF0aW9ucyBieSBtZW1vaXppbmdcbnZhciBjb21waWxlVGVtcGxhdGUgPSBfLm1lbW9pemUoZnVuY3Rpb24gKHRwbCkge1xuICByZXR1cm4gXy50ZW1wbGF0ZSh0cGwsIG51bGwsIHtcbiAgICBlc2NhcGU6IC9cXHtcXHsoW1xcc1xcU10rPylcXH1cXH0vZ1xuICB9KTtcbn0pO1xuXG4vLyBEdW1wcyBhcmJpdHJhcnkgdmFsdWVzIGFzIHN0cmluZ3MgaW4gYSBjb25jaXNlIHdheVxuLy8gVE9ETzogaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9jaGFpL2Jsb2IvbWFzdGVyL2xpYi9jaGFpL3V0aWxzL29iakRpc3BsYXkuanNcbmZ1bmN0aW9uIHZhbHVlRHVtcGVyICh2KSB7XG4gIHZhciB2YWx1ZTtcblxuICBpZiAoXy5pc051bWJlcih2KSB8fCBfLmlzTmFOKHYpIHx8IF8uaXNCb29sZWFuKHYpIHx8IF8uaXNOdWxsKHYpIHx8IF8uaXNVbmRlZmluZWQodikpIHtcbiAgICB2YWx1ZSA9ICc8JyArIHYgKyAnPic7XG4gIH0gZWxzZSBpZiAoXy5pc1JlZ0V4cCh2KSkge1xuICAgIHZhbHVlID0gdi50b1N0cmluZygpO1xuICB9IGVsc2UgaWYgKF8uaXNGdW5jdGlvbih2KSkge1xuICAgIGlmICh2LmRpc3BsYXlOYW1lKSB7XG4gICAgICB2YWx1ZSA9IHYuZGlzcGxheU5hbWUgKyAnKCknO1xuICAgIH0gZWxzZSBpZiAodi5uYW1lKSB7XG4gICAgICB2YWx1ZSA9IHYubmFtZSArICcoKSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gJzxmdW5jdGlvbj4nO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHYpO1xuICB9XG5cbiAgcmV0dXJuICdcXHUwMDFiWzE7MzZtJyArIHZhbHVlICsgJ1xcdTAwMWJbMG0nO1xufVxuXG5cbi8vIEN1c3RvbWl6ZWQgdmVyc2lvbiBvZiBsb2Rhc2ggdGVtcGxhdGVcbmZ1bmN0aW9uIHRlbXBsYXRlICh0cGwsIGNvbnRleHQpIHtcbiAgdmFyIGZuID0gY29tcGlsZVRlbXBsYXRlKHRwbCk7XG4gIGlmIChjb250ZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgb3JpZ0VzY2FwZSA9IF8uZXNjYXBlO1xuICB0cnkge1xuICAgIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IGVzY2FwZSBmdW5jdGlvbiB0byB1c2UgaXQgZm9yIGR1bXBpbmcgZm9ybWF0dGVkIHZhbHVlc1xuICAgIF8uZXNjYXBlID0gdmFsdWVEdW1wZXI7XG5cbiAgICByZXR1cm4gZm4oY29udGV4dCk7XG5cbiAgfSBmaW5hbGx5IHtcbiAgICBfLmVzY2FwZSA9IG9yaWdFc2NhcGU7XG4gIH1cbn1cblxuLy8gQSBzaW1wbGUgZmFzdCBmdW5jdGlvbiBiaW5kaW5nIHByaW1pdGl2ZSBvbmx5IHN1cHBvcnRpbmcgc2V0dGluZyB0aGUgY29udGV4dFxuZnVuY3Rpb24gYmluZChmbiwgdGhpc0FyZykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseSh0aGlzQXJnLCBhcmd1bWVudHMpO1xuICB9O1xufVxuXG4vLyBRdWlja2x5IGNyZWF0ZXMgYSBuZXcgb2JqZWN0IHdpdGggYSBjdXN0b20gcHJvdG90eXBlIGFuZCBzb21lIHZhbHVlXG4vLyBvdmVycmlkZXMuXG5mdW5jdGlvbiBjcmVhdGUocHJvdG8sIHZhbHVlcykge1xuICBpZiAoMCA9PT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gSEFDSzogVXNlIEZ1bmN0aW9uLnByb3RvdHlwZSArIG5ldyBpbnN0ZWFkIG9mIHRoZSBzbG93LWlzaCBPYmplY3QuY3JlYXRlXG4gIGNyZWF0ZS5wcm90b3R5cGUgPSBwcm90bztcbiAgcmV0dXJuIF8uYXNzaWduKG5ldyBjcmVhdGUsIHZhbHVlcyB8fCB7fSk7XG59XG5cblxuLy8gRnJvbSBodHRwOi8vc2lkZXJpdGUuYmxvZ3Nwb3QuY29tLzIwMTQvMTEvc3VwZXItZmFzdC1hbmQtYWNjdXJhdGUtc3RyaW5nLWRpc3RhbmNlLmh0bWxcbmZ1bmN0aW9uIHNpZnQ0KHMxLCBzMiwgbWF4T2Zmc2V0KSB7XG4gIGlmICghczEgfHwgIXMxLmxlbmd0aCkge1xuICAgIGlmICghczIpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gczIubGVuZ3RoO1xuICB9XG5cbiAgaWYgKCFzMiB8fCAhczIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHMxLmxlbmd0aDtcbiAgfVxuXG4gIHZhciBsMSA9IHMxLmxlbmd0aDtcbiAgdmFyIGwyID0gczIubGVuZ3RoO1xuXG4gIHZhciBjMSA9IDA7ICAvLyBjdXJzb3IgZm9yIHN0cmluZyAxXG4gIHZhciBjMiA9IDA7ICAvLyBjdXJzb3IgZm9yIHN0cmluZyAyXG4gIHZhciBsY3NzID0gMDsgIC8vIGxhcmdlc3QgY29tbW9uIHN1YnNlcXVlbmNlXG4gIHZhciBsb2NhbF9jcyA9IDA7IC8vIGxvY2FsIGNvbW1vbiBzdWJzdHJpbmdcblxuICB3aGlsZSAoKGMxIDwgbDEpICYmIChjMiA8IGwyKSkge1xuICAgIGlmIChzMS5jaGFyQXQoYzEpID09IHMyLmNoYXJBdChjMikpIHtcbiAgICAgIGxvY2FsX2NzKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxjc3MgKz0gbG9jYWxfY3M7XG4gICAgICBsb2NhbF9jcyA9IDA7XG4gICAgICBpZiAoYzEgIT0gYzIpIHtcbiAgICAgICAgYzEgPSBjMiA9IE1hdGgubWF4KGMxLGMyKTsgLy8gdXNpbmcgbWF4IHRvIGJ5cGFzcyB0aGUgbmVlZCBmb3IgY29tcHV0ZXIgdHJhbnNwb3NpdGlvbnMgKCdhYicgdnMgJ2JhJylcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF4T2Zmc2V0OyBpKyspIHtcbiAgICAgICAgaWYgKChjMSArIGkgPCBsMSkgJiYgKHMxLmNoYXJBdChjMSArIGkpID09PSBzMi5jaGFyQXQoYzIpKSkge1xuICAgICAgICAgIGMxICs9IGk7XG4gICAgICAgICAgbG9jYWxfY3MrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGMyICsgaSA8IGwyKSAmJiAoczEuY2hhckF0KGMxKSA9PT0gczIuY2hhckF0KGMyICsgaSkpKSB7XG4gICAgICAgICAgYzIgKz0gaTtcbiAgICAgICAgICBsb2NhbF9jcysrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGMxKys7XG4gICAgYzIrKztcbiAgfVxuICBsY3NzICs9IGxvY2FsX2NzO1xuICByZXR1cm4gTWF0aC5yb3VuZChNYXRoLm1heChsMSwgbDIpIC0gbGNzcyk7XG59XG5cbmV4cG9ydHMuYmluZCA9IGJpbmQ7XG5leHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZTtcbmV4cG9ydHMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbmV4cG9ydHMudW5hbnNpID0gdW5hbnNpO1xuZXhwb3J0cy5kb0NvbG9ycyA9IGRvQ29sb3JzO1xuZXhwb3J0cy5zaWZ0NCA9IHNpZnQ0O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW14cFlpOTFkR2xzTG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN1FVRkJRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SjJZWElnWHlBOUlDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzTGw4Z09pQjBlWEJsYjJZZ1oyeHZZbUZzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z1oyeHZZbUZzTGw4Z09pQnVkV3hzS1R0Y2JseHVMeThnUjJWMElIUm9aU0J1WVhScGRtVWdVSEp2YldselpTQnZjaUJoSUhOb2FXMWNibVY0Y0c5eWRITXVVSEp2YldselpTQTlJR2RzYjJKaGJDNVFjbTl0YVhObElIeDhJQ2gwZVhCbGIyWWdkMmx1Wkc5M0lDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUlEOGdkMmx1Wkc5M0xuZHBibVJ2ZHlBNklIUjVjR1Z2WmlCbmJHOWlZV3dnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCbmJHOWlZV3d1ZDJsdVpHOTNJRG9nYm5Wc2JDa3VVSEp2YldselpUdGNibHh1WEc0dkx5QkRZWEJ3WldRZ2NHOXZiQ0IwYnlCc2FXMXBkQ0IwYUdVZ2JXRjRhVzExYlNCdWRXMWlaWElnYjJZZ1pXeGxiV1Z1ZEhNZ2RHaGhkQ0JqWVc0Z1ltVmNiaTh2SUhOMGIzSmxaQ0FvZFc1aWIzVnVaR1ZrSUdKNUlHUmxabUYxYkhRcExseHVaWGh3YjNKMGN5NURZWEJ3WldSUWIyOXNJRDBnWm5WdVkzUnBiMjRnS0cxaGVDa2dlMXh1SUNCMllYSWdjRzl2YkNBOUlGdGRPMXh1WEc0Z0lHMWhlQ0E5SUcxaGVDQjhmQ0JPZFcxaVpYSXVUVUZZWDFaQlRGVkZPMXh1WEc0Z0lFOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBlU2h3YjI5c0xDQW5jSFZ6YUNjc0lIdGNiaUFnSUNCMllXeDFaVG9nWm5WdVkzUnBiMjRnS0hZcElIdGNiaUFnSUNBZ0lHbG1JQ2gwYUdsekxteGxibWQwYUNBOElHMWhlQ2tnZTF4dUlDQWdJQ0FnSUNCQmNuSmhlUzV3Y205MGIzUjVjR1V1Y0hWemFDNWpZV3hzS0hSb2FYTXNJSFlwTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ2ZTazdYRzVjYmlBZ2NtVjBkWEp1SUhCdmIydzdYRzU5TzF4dVhHNWNiblpoY2lCa2IwTnZiRzl5Y3lBOUlGOHViMjVqWlNobWRXNWpkR2x2YmlBb0tTQjdYRzRnSUM4dklFMWhjM1JsY2lCdmRtVnljbWxrWlNCM2FYUm9JRzkxY2lCamRYTjBiMjBnWlc1MklIWmhjbWxoWW14bFhHNGdJR2xtSUNod2NtOWpaWE56TG1WdWRpNUJVMU5mUTA5TVQxSlRJQ0U5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNCeVpYUjFjbTRnTDNSeWRXVjhiMjU4ZVdWemZHVnVZV0pzWldRL2ZERXZhUzUwWlhOMEtIQnliMk5sYzNNdVpXNTJMa0ZUVTE5RFQweFBVbE1wTzF4dUlDQjlYRzVjYmlBZ0x5OGdRMmhsWTJzZ2FXWWdTMkZ5YldFZ2FYTWdZbVZwYm1jZ2RYTmxaQ0JoYm1RZ2FHRnpJR1JsWm1sdVpXUWdkR2hsSUdOdmJHOXljMXh1SUNCMllYSWdhMkZ5YldFZ1BTQm5iRzlpWVd3dVgxOXJZWEp0WVY5Zk8xeHVJQ0JwWmlBb2EyRnliV0VnSmlZZ2EyRnliV0V1WTI5dVptbG5JQ1ltSUhSNWNHVnZaaUJyWVhKdFlTNWpiMjVtYVdjdVkyOXNiM0p6SUNFOVBTQW5kVzVrWldacGJtVmtKeWtnZTF4dUlDQWdJSEpsZEhWeWJpQnJZWEp0WVM1amIyNW1hV2N1WTI5c2IzSnpPMXh1SUNCOVhHNWNiaUFnTHk4Z1EyaGxZMnNnYVdZZ2JXOWphR0VnYVhNZ1lYSnZkVzVrSUdGdVpDQjJaWEpwWm5rZ1lXZGhhVzV6ZENCcGRITWdZMjl1Wm1sbmRYSmhkR2x2Ymx4dUlDQjJZWElnVFc5amFHRWdQU0JuYkc5aVlXd3VUVzlqYUdFN1hHNGdJR2xtSUNoTmIyTm9ZU0E5UFQwZ2RXNWtaV1pwYm1Wa0lDWW1JSEpsY1hWcGNtVXVjbVZ6YjJ4MlpTQW1KaUJ5WlhGMWFYSmxMbkpsYzI5c2RtVW9KMjF2WTJoaEp5a3BJSHRjYmlBZ0lDQk5iMk5vWVNBOUlDaDBlWEJsYjJZZ2QybHVaRzkzSUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpSUQ4Z2QybHVaRzkzTGsxdlkyaGhJRG9nZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JR2RzYjJKaGJDNU5iMk5vWVNBNklHNTFiR3dwTzF4dUlDQjlYRzRnSUdsbUlDaE5iMk5vWVNBaFBUMGdkVzVrWldacGJtVmtJQ1ltSUUxdlkyaGhMbkpsY0c5eWRHVnljeUFoUFQwZ2RXNWtaV1pwYm1Wa0lDWW1JRTF2WTJoaExuSmxjRzl5ZEdWeWN5NUNZWE5sSUNFOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQnlaWFIxY200Z1RXOWphR0V1Y21Wd2IzSjBaWEp6TGtKaGMyVXVkWE5sUTI5c2IzSnpPMXh1SUNCOVhHNWNiaUFnTHk4Z1VYVmxjbmtnZEdobElHVnVkbWx5YjI1dFpXNTBJR0Z1WkNCelpXVWdhV1lnYzI5dFpTQmpiMjF0YjI0Z2RtRnlhV0ZpYkdWeklHRnlaU0J6WlhSY2JpQWdhV1lnS0hCeWIyTmxjM011Wlc1MkxrMVBRMGhCWDBOUFRFOVNVeUFoUFQwZ2RXNWtaV1pwYm1Wa0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUgxY2JpQWdhV1lnS0M4dExXTnZiRzl5UFdGc2QyRjVjeTh1ZEdWemRDaHdjbTlqWlhOekxtVnVkaTVIVWtWUVgwOVFWRWxQVGxNZ2ZId2dKeWNwS1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJSDFjYmx4dUlDQXZMeUJHYVc1aGJHeDVJR3AxYzNRZ1kyaGxZMnNnYVdZZ2RHaGxJR1Z1ZG1seWIyNXRaVzUwSUdseklHTmhjR0ZpYkdWY2JpQWdkbUZ5SUhSMGVTQTlJSEpsY1hWcGNtVW9KM1IwZVNjcE8xeHVJQ0J5WlhSMWNtNGdkSFI1TG1sellYUjBlU2d4S1NBbUppQjBkSGt1YVhOaGRIUjVLRElwTzF4dWZTazdYRzVjYmx4dUx5OGdVbVZ0YjNabElFRk9VMGtnWlhOallYQmxjeUJtY205dElHRWdjM1J5YVc1blhHNW1kVzVqZEdsdmJpQjFibUZ1YzJrZ0tITjBjaWtnZTF4dUlDQnlaWFIxY200Z2MzUnlMbkpsY0d4aFkyVW9MMXhjZURGaVhGeGJLRnhjWkNzN1B5a3JXMkV0ZWwwdloya3NJQ2NuS1R0Y2JuMWNibHh1WEc0dkx5QkJkbTlwWkNCeVpYQmxZWFJsWkNCamIyMXdhV3hoZEdsdmJuTWdZbmtnYldWdGIybDZhVzVuWEc1MllYSWdZMjl0Y0dsc1pWUmxiWEJzWVhSbElEMGdYeTV0WlcxdmFYcGxLR1oxYm1OMGFXOXVJQ2gwY0d3cElIdGNiaUFnY21WMGRYSnVJRjh1ZEdWdGNHeGhkR1VvZEhCc0xDQnVkV3hzTENCN1hHNGdJQ0FnWlhOallYQmxPaUF2WEZ4N1hGeDdLRnRjWEhOY1hGTmRLejhwWEZ4OVhGeDlMMmRjYmlBZ2ZTazdYRzU5S1R0Y2JseHVMeThnUkhWdGNITWdZWEppYVhSeVlYSjVJSFpoYkhWbGN5QmhjeUJ6ZEhKcGJtZHpJR2x1SUdFZ1kyOXVZMmx6WlNCM1lYbGNiaTh2SUZSUFJFODZJR2gwZEhCek9pOHZaMmwwYUhWaUxtTnZiUzlqYUdGcGFuTXZZMmhoYVM5aWJHOWlMMjFoYzNSbGNpOXNhV0l2WTJoaGFTOTFkR2xzY3k5dlltcEVhWE53YkdGNUxtcHpYRzVtZFc1amRHbHZiaUIyWVd4MVpVUjFiWEJsY2lBb2Rpa2dlMXh1SUNCMllYSWdkbUZzZFdVN1hHNWNiaUFnYVdZZ0tGOHVhWE5PZFcxaVpYSW9kaWtnZkh3Z1h5NXBjMDVoVGloMktTQjhmQ0JmTG1selFtOXZiR1ZoYmloMktTQjhmQ0JmTG1selRuVnNiQ2gyS1NCOGZDQmZMbWx6Vlc1a1pXWnBibVZrS0hZcEtTQjdYRzRnSUNBZ2RtRnNkV1VnUFNBblBDY2dLeUIySUNzZ0p6NG5PMXh1SUNCOUlHVnNjMlVnYVdZZ0tGOHVhWE5TWldkRmVIQW9kaWtwSUh0Y2JpQWdJQ0IyWVd4MVpTQTlJSFl1ZEc5VGRISnBibWNvS1R0Y2JpQWdmU0JsYkhObElHbG1JQ2hmTG1selJuVnVZM1JwYjI0b2Rpa3BJSHRjYmlBZ0lDQnBaaUFvZGk1a2FYTndiR0Y1VG1GdFpTa2dlMXh1SUNBZ0lDQWdkbUZzZFdVZ1BTQjJMbVJwYzNCc1lYbE9ZVzFsSUNzZ0p5Z3BKenRjYmlBZ0lDQjlJR1ZzYzJVZ2FXWWdLSFl1Ym1GdFpTa2dlMXh1SUNBZ0lDQWdkbUZzZFdVZ1BTQjJMbTVoYldVZ0t5QW5LQ2tuTzF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQjJZV3gxWlNBOUlDYzhablZ1WTNScGIyNCtKenRjYmlBZ0lDQjlYRzRnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdkbUZzZFdVZ1BTQktVMDlPTG5OMGNtbHVaMmxtZVNoMktUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQW5YRngxTURBeFlsc3hPek0yYlNjZ0t5QjJZV3gxWlNBcklDZGNYSFV3TURGaVd6QnRKenRjYm4xY2JseHVYRzR2THlCRGRYTjBiMjFwZW1Wa0lIWmxjbk5wYjI0Z2IyWWdiRzlrWVhOb0lIUmxiWEJzWVhSbFhHNW1kVzVqZEdsdmJpQjBaVzF3YkdGMFpTQW9kSEJzTENCamIyNTBaWGgwS1NCN1hHNGdJSFpoY2lCbWJpQTlJR052YlhCcGJHVlVaVzF3YkdGMFpTaDBjR3dwTzF4dUlDQnBaaUFvWTI5dWRHVjRkQ0E5UFQwZ2RXNWtaV1pwYm1Wa0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUdadU8xeHVJQ0I5WEc1Y2JpQWdkbUZ5SUc5eWFXZEZjMk5oY0dVZ1BTQmZMbVZ6WTJGd1pUdGNiaUFnZEhKNUlIdGNiaUFnSUNBdkx5QlBkbVZ5Y21sa1pTQjBhR1VnWkdWbVlYVnNkQ0JsYzJOaGNHVWdablZ1WTNScGIyNGdkRzhnZFhObElHbDBJR1p2Y2lCa2RXMXdhVzVuSUdadmNtMWhkSFJsWkNCMllXeDFaWE5jYmlBZ0lDQmZMbVZ6WTJGd1pTQTlJSFpoYkhWbFJIVnRjR1Z5TzF4dVhHNGdJQ0FnY21WMGRYSnVJR1p1S0dOdmJuUmxlSFFwTzF4dVhHNGdJSDBnWm1sdVlXeHNlU0I3WEc0Z0lDQWdYeTVsYzJOaGNHVWdQU0J2Y21sblJYTmpZWEJsTzF4dUlDQjlYRzU5WEc1Y2JpOHZJRUVnYzJsdGNHeGxJR1poYzNRZ1puVnVZM1JwYjI0Z1ltbHVaR2x1WnlCd2NtbHRhWFJwZG1VZ2IyNXNlU0J6ZFhCd2IzSjBhVzVuSUhObGRIUnBibWNnZEdobElHTnZiblJsZUhSY2JtWjFibU4wYVc5dUlHSnBibVFvWm00c0lIUm9hWE5CY21jcElIdGNiaUFnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdabTR1WVhCd2JIa29kR2hwYzBGeVp5d2dZWEpuZFcxbGJuUnpLVHRjYmlBZ2ZUdGNibjFjYmx4dUx5OGdVWFZwWTJ0c2VTQmpjbVZoZEdWeklHRWdibVYzSUc5aWFtVmpkQ0IzYVhSb0lHRWdZM1Z6ZEc5dElIQnliM1J2ZEhsd1pTQmhibVFnYzI5dFpTQjJZV3gxWlZ4dUx5OGdiM1psY25KcFpHVnpMbHh1Wm5WdVkzUnBiMjRnWTNKbFlYUmxLSEJ5YjNSdkxDQjJZV3gxWlhNcElIdGNiaUFnYVdZZ0tEQWdQVDA5SUdGeVozVnRaVzUwY3k1c1pXNW5kR2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3p0Y2JpQWdmVnh1WEc0Z0lDOHZJRWhCUTBzNklGVnpaU0JHZFc1amRHbHZiaTV3Y205MGIzUjVjR1VnS3lCdVpYY2dhVzV6ZEdWaFpDQnZaaUIwYUdVZ2MyeHZkeTFwYzJnZ1QySnFaV04wTG1OeVpXRjBaVnh1SUNCamNtVmhkR1V1Y0hKdmRHOTBlWEJsSUQwZ2NISnZkRzg3WEc0Z0lISmxkSFZ5YmlCZkxtRnpjMmxuYmlodVpYY2dZM0psWVhSbExDQjJZV3gxWlhNZ2ZId2dlMzBwTzF4dWZWeHVYRzVjYmk4dklFWnliMjBnYUhSMGNEb3ZMM05wWkdWeWFYUmxMbUpzYjJkemNHOTBMbU52YlM4eU1ERTBMekV4TDNOMWNHVnlMV1poYzNRdFlXNWtMV0ZqWTNWeVlYUmxMWE4wY21sdVp5MWthWE4wWVc1alpTNW9kRzFzWEc1bWRXNWpkR2x2YmlCemFXWjBOQ2h6TVN3Z2N6SXNJRzFoZUU5bVpuTmxkQ2tnZTF4dUlDQnBaaUFvSVhNeElIeDhJQ0Z6TVM1c1pXNW5kR2dwSUh0Y2JpQWdJQ0JwWmlBb0lYTXlLU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdNRHRjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUhNeUxteGxibWQwYUR0Y2JpQWdmVnh1WEc0Z0lHbG1JQ2doY3pJZ2ZId2dJWE15TG14bGJtZDBhQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQnpNUzVzWlc1bmRHZzdYRzRnSUgxY2JseHVJQ0IyWVhJZ2JERWdQU0J6TVM1c1pXNW5kR2c3WEc0Z0lIWmhjaUJzTWlBOUlITXlMbXhsYm1kMGFEdGNibHh1SUNCMllYSWdZekVnUFNBd095QWdMeThnWTNWeWMyOXlJR1p2Y2lCemRISnBibWNnTVZ4dUlDQjJZWElnWXpJZ1BTQXdPeUFnTHk4Z1kzVnljMjl5SUdadmNpQnpkSEpwYm1jZ01seHVJQ0IyWVhJZ2JHTnpjeUE5SURBN0lDQXZMeUJzWVhKblpYTjBJR052YlcxdmJpQnpkV0p6WlhGMVpXNWpaVnh1SUNCMllYSWdiRzlqWVd4ZlkzTWdQU0F3T3lBdkx5QnNiMk5oYkNCamIyMXRiMjRnYzNWaWMzUnlhVzVuWEc1Y2JpQWdkMmhwYkdVZ0tDaGpNU0E4SUd3eEtTQW1KaUFvWXpJZ1BDQnNNaWtwSUh0Y2JpQWdJQ0JwWmlBb2N6RXVZMmhoY2tGMEtHTXhLU0E5UFNCek1pNWphR0Z5UVhRb1l6SXBLU0I3WEc0Z0lDQWdJQ0JzYjJOaGJGOWpjeXNyTzF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQnNZM056SUNzOUlHeHZZMkZzWDJOek8xeHVJQ0FnSUNBZ2JHOWpZV3hmWTNNZ1BTQXdPMXh1SUNBZ0lDQWdhV1lnS0dNeElDRTlJR015S1NCN1hHNGdJQ0FnSUNBZ0lHTXhJRDBnWXpJZ1BTQk5ZWFJvTG0xaGVDaGpNU3hqTWlrN0lDOHZJSFZ6YVc1bklHMWhlQ0IwYnlCaWVYQmhjM01nZEdobElHNWxaV1FnWm05eUlHTnZiWEIxZEdWeUlIUnlZVzV6Y0c5emFYUnBiMjV6SUNnbllXSW5JSFp6SUNkaVlTY3BYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJRzFoZUU5bVpuTmxkRHNnYVNzcktTQjdYRzRnSUNBZ0lDQWdJR2xtSUNnb1l6RWdLeUJwSUR3Z2JERXBJQ1ltSUNoek1TNWphR0Z5UVhRb1l6RWdLeUJwS1NBOVBUMGdjekl1WTJoaGNrRjBLR015S1NrcElIdGNiaUFnSUNBZ0lDQWdJQ0JqTVNBclBTQnBPMXh1SUNBZ0lDQWdJQ0FnSUd4dlkyRnNYMk56S3lzN1hHNGdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdhV1lnS0Noak1pQXJJR2tnUENCc01pa2dKaVlnS0hNeExtTm9ZWEpCZENoak1Ta2dQVDA5SUhNeUxtTm9ZWEpCZENoak1pQXJJR2twS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJR015SUNzOUlHazdYRzRnSUNBZ0lDQWdJQ0FnYkc5allXeGZZM01yS3p0Y2JpQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdJQ0JqTVNzck8xeHVJQ0FnSUdNeUt5czdYRzRnSUgxY2JpQWdiR056Y3lBclBTQnNiMk5oYkY5amN6dGNiaUFnY21WMGRYSnVJRTFoZEdndWNtOTFibVFvVFdGMGFDNXRZWGdvYkRFc0lHd3lLU0F0SUd4amMzTXBPMXh1ZlZ4dVhHNWxlSEJ2Y25SekxtSnBibVFnUFNCaWFXNWtPMXh1Wlhod2IzSjBjeTVqY21WaGRHVWdQU0JqY21WaGRHVTdYRzVsZUhCdmNuUnpMblJsYlhCc1lYUmxJRDBnZEdWdGNHeGhkR1U3WEc1bGVIQnZjblJ6TG5WdVlXNXphU0E5SUhWdVlXNXphVHRjYm1WNGNHOXlkSE11Wkc5RGIyeHZjbk1nUFNCa2IwTnZiRzl5Y3p0Y2JtVjRjRzl5ZEhNdWMybG1kRFFnUFNCemFXWjBORHRjYmlKZGZRPT0iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgYXNzID0gcmVxdWlyZSgnLi9saWIvYXNzJyk7XG52YXIgQ2hhaW4gPSByZXF1aXJlKCcuL2xpYi9jaGFpbicpO1xudmFyIEFzc0Vycm9yID0gcmVxdWlyZSgnLi9saWIvZXJyb3InKTtcbnZhciBzaG91bGQgPSByZXF1aXJlKCcuL2xpYi9zaG91bGQnKTtcbnZhciBwYXRjaGVzID0gcmVxdWlyZSgnLi9saWIvcGF0Y2hlcycpO1xuXG4vLyBSZWdpc3RlciB0aGUgZGVmYXVsdCBtYXRjaGVyc1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvY29yZScpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvY29vcmRpbmF0aW9uJyk7XG5yZXF1aXJlKCcuL2xpYi9tYXRjaGVycy9xdWFudGlmaWVycycpO1xucmVxdWlyZSgnLi9saWIvbWF0Y2hlcnMvcHJvbWlzZScpO1xuXG5cbi8vIEJ1bmRsZSBzb21lIG9mIHRoZSBpbnRlcm5hbCBzdHVmZiB3aXRoIHRoZSBhc3MgZnVuY3Rpb25cbmFzcy5DaGFpbiA9IENoYWluO1xuYXNzLkVycm9yID0gQXNzRXJyb3I7XG5hc3MucGF0Y2hlcyA9IHBhdGNoZXM7XG5cbi8vIEZvcndhcmQgdGhlIHNob3VsZCBpbnN0YWxsZXJcbi8vIE5vdGU6IG1ha2UgdGhlbSBhcml0eS0wIHRvIGFsbG93IGJlZm9yZUVhY2goYXNzLnNob3VsZCkgaW4gTW9jaGFcbmFzcy5zaG91bGQgPSBmdW5jdGlvbiAoLyogbmFtZSAqLykge1xuICBzaG91bGQoYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQpO1xuICByZXR1cm4gYXNzO1xufTtcbmFzcy5zaG91bGQucmVzdG9yZSA9IGZ1bmN0aW9uICgvKiBuYW1lICovKSB7XG4gIHNob3VsZC5yZXN0b3JlKGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogdW5kZWZpbmVkKTtcbiAgcmV0dXJuIGFzcztcbn07XG5cblxuLy8gUGF0Y2ggdGhpcmQgcGFydHkgbGlicmFyaWVzIHRvIHVuZGVyc3RhbmQgYWJvdXQgYXNzLWVydCBleHByZXNzaW9ucy4gV2Vcbi8vIGRlcGVuZCBvbiBwYXRjaGluZyBsb2Rhc2ggZm9yIHRoZSBsaWJyYXJ5IHRvIHdvcmsgY29ycmVjdGx5LCBob3dldmVyIHRoZVxuLy8gcmVzdCBhcmUgb3B0aW9uYWwuXG5wYXRjaGVzLmxvZGFzaCgodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5fIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5fIDogbnVsbCkpO1xuXG5pZiAoZ2xvYmFsLnNpbm9uICYmIGdsb2JhbC5zaW5vbi5tYXRjaCkge1xuICBwYXRjaGVzLnNpbm9uKGdsb2JhbC5zaW5vbik7XG59IGVsc2UgaWYgKHJlcXVpcmUucmVzb2x2ZSkge1xuICAgIHRyeSB7XG4gICAgICBwYXRjaGVzLnNpbm9uKCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LnNpbm9uIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5zaW5vbiA6IG51bGwpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIHNpbm9uIGlzIG5vdCBpbnN0YWxsZWRcbiAgICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBhc3M7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW0xaGFXNHVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTSXNJbVpwYkdVaU9pSm5aVzVsY21GMFpXUXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpZG1GeUlHRnpjeUE5SUhKbGNYVnBjbVVvSnk0dmJHbGlMMkZ6Y3ljcE8xeHVkbUZ5SUVOb1lXbHVJRDBnY21WeGRXbHlaU2duTGk5c2FXSXZZMmhoYVc0bktUdGNiblpoY2lCQmMzTkZjbkp2Y2lBOUlISmxjWFZwY21Vb0p5NHZiR2xpTDJWeWNtOXlKeWs3WEc1MllYSWdjMmh2ZFd4a0lEMGdjbVZ4ZFdseVpTZ25MaTlzYVdJdmMyaHZkV3hrSnlrN1hHNTJZWElnY0dGMFkyaGxjeUE5SUhKbGNYVnBjbVVvSnk0dmJHbGlMM0JoZEdOb1pYTW5LVHRjYmx4dUx5OGdVbVZuYVhOMFpYSWdkR2hsSUdSbFptRjFiSFFnYldGMFkyaGxjbk5jYm5KbGNYVnBjbVVvSnk0dmJHbGlMMjFoZEdOb1pYSnpMMk52Y21VbktUdGNibkpsY1hWcGNtVW9KeTR2YkdsaUwyMWhkR05vWlhKekwyTnZiM0prYVc1aGRHbHZiaWNwTzF4dWNtVnhkV2x5WlNnbkxpOXNhV0l2YldGMFkyaGxjbk12Y1hWaGJuUnBabWxsY25NbktUdGNibkpsY1hWcGNtVW9KeTR2YkdsaUwyMWhkR05vWlhKekwzQnliMjFwYzJVbktUdGNibHh1WEc0dkx5QkNkVzVrYkdVZ2MyOXRaU0J2WmlCMGFHVWdhVzUwWlhKdVlXd2djM1IxWm1ZZ2QybDBhQ0IwYUdVZ1lYTnpJR1oxYm1OMGFXOXVYRzVoYzNNdVEyaGhhVzRnUFNCRGFHRnBianRjYm1GemN5NUZjbkp2Y2lBOUlFRnpjMFZ5Y205eU8xeHVZWE56TG5CaGRHTm9aWE1nUFNCd1lYUmphR1Z6TzF4dVhHNHZMeUJHYjNKM1lYSmtJSFJvWlNCemFHOTFiR1FnYVc1emRHRnNiR1Z5WEc0dkx5Qk9iM1JsT2lCdFlXdGxJSFJvWlcwZ1lYSnBkSGt0TUNCMGJ5QmhiR3h2ZHlCaVpXWnZjbVZGWVdOb0tHRnpjeTV6YUc5MWJHUXBJR2x1SUUxdlkyaGhYRzVoYzNNdWMyaHZkV3hrSUQwZ1puVnVZM1JwYjI0Z0tDOHFJRzVoYldVZ0tpOHBJSHRjYmlBZ2MyaHZkV3hrS0dGeVozVnRaVzUwY3k1c1pXNW5kR2dnUGlBd0lEOGdZWEpuZFcxbGJuUnpXekJkSURvZ2RXNWtaV1pwYm1Wa0tUdGNiaUFnY21WMGRYSnVJR0Z6Y3p0Y2JuMDdYRzVoYzNNdWMyaHZkV3hrTG5KbGMzUnZjbVVnUFNCbWRXNWpkR2x2YmlBb0x5b2dibUZ0WlNBcUx5a2dlMXh1SUNCemFHOTFiR1F1Y21WemRHOXlaU2hoY21kMWJXVnVkSE11YkdWdVozUm9JRDRnTUNBL0lHRnlaM1Z0Wlc1MGMxc3dYU0E2SUhWdVpHVm1hVzVsWkNrN1hHNGdJSEpsZEhWeWJpQmhjM003WEc1OU8xeHVYRzVjYmk4dklGQmhkR05vSUhSb2FYSmtJSEJoY25SNUlHeHBZbkpoY21sbGN5QjBieUIxYm1SbGNuTjBZVzVrSUdGaWIzVjBJR0Z6Y3kxbGNuUWdaWGh3Y21WemMybHZibk11SUZkbFhHNHZMeUJrWlhCbGJtUWdiMjRnY0dGMFkyaHBibWNnYkc5a1lYTm9JR1p2Y2lCMGFHVWdiR2xpY21GeWVTQjBieUIzYjNKcklHTnZjbkpsWTNSc2VTd2dhRzkzWlhabGNpQjBhR1ZjYmk4dklISmxjM1FnWVhKbElHOXdkR2x2Ym1Gc0xseHVjR0YwWTJobGN5NXNiMlJoYzJnb0tIUjVjR1Z2WmlCM2FXNWtiM2NnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCM2FXNWtiM2N1WHlBNklIUjVjR1Z2WmlCbmJHOWlZV3dnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCbmJHOWlZV3d1WHlBNklHNTFiR3dwS1R0Y2JseHVhV1lnS0dkc2IySmhiQzV6YVc1dmJpQW1KaUJuYkc5aVlXd3VjMmx1YjI0dWJXRjBZMmdwSUh0Y2JpQWdjR0YwWTJobGN5NXphVzV2YmlobmJHOWlZV3d1YzJsdWIyNHBPMXh1ZlNCbGJITmxJR2xtSUNoeVpYRjFhWEpsTG5KbGMyOXNkbVVwSUh0Y2JpQWdJQ0IwY25rZ2UxeHVJQ0FnSUNBZ2NHRjBZMmhsY3k1emFXNXZiaWdvZEhsd1pXOW1JSGRwYm1SdmR5QWhQVDBnWENKMWJtUmxabWx1WldSY0lpQS9JSGRwYm1SdmR5NXphVzV2YmlBNklIUjVjR1Z2WmlCbmJHOWlZV3dnSVQwOUlGd2lkVzVrWldacGJtVmtYQ0lnUHlCbmJHOWlZV3d1YzJsdWIyNGdPaUJ1ZFd4c0tTazdYRzRnSUNBZ2ZTQmpZWFJqYUNBb1pTa2dlMXh1SUNBZ0lDQWdJQ0F2THlCemFXNXZiaUJwY3lCdWIzUWdhVzV6ZEdGc2JHVmtYRzRnSUNBZ2ZWeHVmVnh1WEc1Y2JtMXZaSFZzWlM1bGVIQnZjblJ6SUQwZ1lYTnpPMXh1SWwxOSIsbnVsbCwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuTXV0YXRpb25PYnNlcnZlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG5cbiAgICBpZiAoY2FuTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICB2YXIgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlTGlzdCA9IHF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcXVldWVMaXN0LmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGhpZGRlbkRpdiwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBoaWRkZW5EaXYuc2V0QXR0cmlidXRlKCd5ZXMnLCAnbm8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIi8vIEVtdWxhdGVzIFY4J3MgQ2FsbFNpdGUgb2JqZWN0IGZyb20gYSBzdGFja3RyYWNlLmpzIGZyYW1lIG9iamVjdFxuXG5mdW5jdGlvbiBDYWxsU2l0ZSAoZnJhbWUpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENhbGxTaXRlKSkge1xuICAgIHJldHVybiBuZXcgQ2FsbFNpdGUoZnJhbWUpO1xuICB9XG4gIHRoaXMuZnJhbWUgPSBmcmFtZTtcbn07XG5cbkNhbGxTaXRlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoe1xuICBnZXRMaW5lTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUubGluZU51bWJlcjtcbiAgfSxcbiAgZ2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuY29sdW1uTnVtYmVyO1xuICB9LFxuICBnZXRGaWxlTmFtZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmZpbGVOYW1lO1xuICB9LFxuICBnZXRGdW5jdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmZyYW1lLmZ1bmN0aW9uO1xuICB9LFxuICBnZXRUaGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGdldFR5cGVOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGdldE1ldGhvZE5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5mcmFtZS5mdW5jdGlvbk5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmZyYW1lLmZ1bmN0aW9uTmFtZS5zcGxpdCgnLicpLnBvcCgpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcbiAgZ2V0RnVuY3Rpb25OYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lO1xuICB9LFxuICBnZXRFdmFsT3JpZ2luOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGlzVG9wbGV2ZWw6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cbiAgfSxcbiAgaXNFdmFsOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXG4gIH0sXG4gIGlzTmF0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXG4gIH0sXG4gIGlzQ29uc3RydWN0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gL15uZXcoXFxzfCQpLy50ZXN0KHRoaXMuZnJhbWUuZnVuY3Rpb25OYW1lKTtcbiAgfSxcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbmFtZSA9IHRoaXMuZ2V0RnVuY3Rpb25OYW1lKCkgfHwgJzxhbm9ueW1vdXM+JztcbiAgICB2YXIgbG9jID0gdGhpcy5nZXRGaWxlTmFtZSgpICsgJzonICsgdGhpcy5nZXRMaW5lTnVtYmVyKCkgKyAnOicgKyB0aGlzLmdldENvbHVtbk51bWJlcigpXG4gICAgcmV0dXJuIG5hbWUgKyAnICgnICsgbG9jICsgJyknO1xuICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENhbGxTaXRlO1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG52YXIgRXJyb3JTdGFja1BhcnNlciA9IHJlcXVpcmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicpO1xudmFyIENhbGxTaXRlID0gcmVxdWlyZSgnLi9jYWxsLXNpdGUnKTtcblxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgYnVpbHRpbiBlcnJvciBjb25zdHJ1Y3RvclxudmFyIE5hdGl2ZUVycm9yID0gRXJyb3I7XG5cbi8vIEFubm90YXRpb24gc3ltYm9sc1xudmFyIFNZTUJPTF9GUkFNRVMgPSAnQEBmYWlsdXJlL2ZyYW1lcyc7XG52YXIgU1lNQk9MX0lHTk9SRSA9ICdAQGZhaWx1cmUvaWdub3JlJztcblxuXG5mdW5jdGlvbiBGYWlsdXJlIChtZXNzYWdlLCBzZmYpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZhaWx1cmUpKSB7XG4gICAgcmV0dXJuIG5ldyBGYWlsdXJlKG1lc3NhZ2UsIHNmZiB8fCBGYWlsdXJlKTtcbiAgfVxuXG4gIHRoaXMuc2ZmID0gc2ZmIHx8IHRoaXMuY29uc3RydWN0b3I7XG5cbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblxuICAvLyBHZW5lcmF0ZSBhIGdldHRlciBmb3IgdGhlIGZyYW1lcywgdGhpcyBlbnN1cmVzIHRoYXQgd2UgZG8gYXMgbGl0dGxlIHdvcmtcbiAgLy8gYXMgcG9zc2libGUgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBlcnJvciwgZGVmZXJyaW5nIHRoZSBleHBlbnNpdmUgc3RhY2tcbiAgLy8gbWFuZ2xpbmcgb3BlcmF0aW9ucyB1bnRpbCB0aGUgLnN0YWNrIHByb3BlcnR5IGlzIGFjdHVhbGx5IHJlcXVlc3RlZC5cbiAgdGhpcy5fZ2V0RnJhbWVzID0gbWFrZUZyYW1lc0dldHRlcih0aGlzLnNmZik7XG5cbiAgLy8gT24gRVM1IGVuZ2luZXMgd2UgdXNlIG9uZS10aW1lIGdldHRlcnMgdG8gYWN0dWFsbHkgZGVmZXIgdGhlIGV4cGVuc2l2ZVxuICAvLyBvcGVyYXRpb25zIChkZWZpbmVkIGluIHRoZSBwcm90b3R5cGUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIHdoaWxlIGxlZ2FjeVxuICAvLyBlbmdpbmVzIHdpbGwgc2ltcGx5IGRvIGFsbCB0aGUgd29yayB1cCBmcm9udC5cbiAgaWYgKHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLmZyYW1lcyA9IHVud2luZCh0aGlzLl9nZXRGcmFtZXMoKSk7XG4gICAgdGhpcy5fZ2V0RnJhbWVzKHRydWUpO1xuICAgIHRoaXMuX2dldEZyYW1lcyA9IG51bGw7XG4gICAgdGhpcy5zdGFjayA9IHRoaXMuZ2VuZXJhdGVTdGFja1RyYWNlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn1cblxuLy8gU2V0IEZSQU1FX0VNUFRZIHRvIG51bGwgdG8gZGlzYWJsZSBhbnkgc29ydCBvZiBzZXBhcmF0b3JcbkZhaWx1cmUuRlJBTUVfRU1QVFkgPSAnICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJztcbkZhaWx1cmUuRlJBTUVfUFJFRklYID0gJyAgYXQgJztcblxuLy8gQnkgZGVmYXVsdCB3ZSBlbmFibGUgdHJhY2tpbmcgZm9yIGFzeW5jIHN0YWNrIHRyYWNlc1xuRmFpbHVyZS5UUkFDSyA9IHRydWU7XG5cblxuLy8gSGVscGVyIHRvIG9idGFpbiB0aGUgY3VycmVudCBzdGFjayB0cmFjZVxudmFyIGdldEVycm9yV2l0aFN0YWNrID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IE5hdGl2ZUVycm9yKCk7XG59O1xuLy8gU29tZSBlbmdpbmVzIGRvIG5vdCBnZW5lcmF0ZSB0aGUgLnN0YWNrIHByb3BlcnR5IHVudGlsIGl0J3MgdGhyb3duXG5pZiAoIWdldEVycm9yV2l0aFN0YWNrKCkuc3RhY2spIHtcbiAgZ2V0RXJyb3JXaXRoU3RhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHsgdGhyb3cgbmV3IE5hdGl2ZUVycm9yKCk7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGU7IH1cbiAgfTtcbn1cblxuLy8gVHJpbSBmcmFtZXMgdW5kZXIgdGhlIHByb3ZpZGVkIHN0YWNrIGZpcnN0IGZ1bmN0aW9uXG5mdW5jdGlvbiB0cmltKGZyYW1lcywgc2ZmKSB7XG4gIHZhciBmbiwgbmFtZSA9IHNmZi5uYW1lO1xuICBpZiAoIWZyYW1lcykge1xuICAgIGNvbnNvbGUud2FybignW0ZhaWx1cmVdIGVycm9yIGNhcHR1cmluZyBmcmFtZXMnKTtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgZm9yICh2YXIgaT0wOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4gPSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb24oKTtcbiAgICBpZiAoZm4gJiYgZm4gPT09IHNmZiB8fCBuYW1lICYmIG5hbWUgPT09IGZyYW1lc1tpXS5nZXRGdW5jdGlvbk5hbWUoKSkge1xuICAgICAgcmV0dXJuIGZyYW1lcy5zbGljZShpICsgMSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBmcmFtZXM7XG59XG5cbmZ1bmN0aW9uIHVud2luZCAoZnJhbWVzKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcblxuICBmb3IgKHZhciBpPTAsIGZuOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4gPSBmcmFtZXNbaV0uZ2V0RnVuY3Rpb24oKTtcblxuICAgIGlmICghZm4gfHwgIWZuW1NZTUJPTF9JR05PUkVdKSB7XG4gICAgICByZXN1bHQucHVzaChmcmFtZXNbaV0pO1xuICAgIH1cblxuICAgIGlmIChmbiAmJiBmbltTWU1CT0xfRlJBTUVTXSkge1xuICAgICAgaWYgKEZhaWx1cmUuRlJBTUVfRU1QVFkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENhbGwgdGhlIGdldHRlciBhbmQga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgcmVzdWx0IGluIGNhc2Ugd2UgaGF2ZSB0b1xuICAgICAgLy8gdW53aW5kIHRoZSBzYW1lIGZ1bmN0aW9uIGFub3RoZXIgdGltZS5cbiAgICAgIC8vIFRPRE86IE1ha2Ugc3VyZSBrZWVwaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBmcmFtZXMgZG9lc24ndCBjcmVhdGUgbGVha3NcbiAgICAgIGlmICh0eXBlb2YgZm5bU1lNQk9MX0ZSQU1FU10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFyIGdldHRlciA9IGZuW1NZTUJPTF9GUkFNRVNdO1xuICAgICAgICBmbltTWU1CT0xfRlJBTUVTXSA9IG51bGw7XG4gICAgICAgIGZuW1NZTUJPTF9GUkFNRVNdID0gZ2V0dGVyKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZm5bU1lNQk9MX0ZSQU1FU10pIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbRmFpbHVyZV0gRW1wdHkgZnJhbWVzIGFubm90YXRpb24nKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgdW53aW5kKGZuW1NZTUJPTF9GUkFNRVNdKSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBSZWNlaXZlciBmb3IgdGhlIGZyYW1lcyBpbiBhIC5zdGFjayBwcm9wZXJ0eSBmcm9tIGNhcHR1cmVTdGFja1RyYWNlXG52YXIgVjhGUkFNRVMgPSB7fTtcblxuLy8gVjggY29kZSBwYXRoIGZvciBnZW5lcmF0aW5nIGEgZnJhbWVzIGdldHRlclxuZnVuY3Rpb24gbWFrZUZyYW1lc0dldHRlclY4IChzZmYpIHtcbiAgTmF0aXZlRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoVjhGUkFNRVMsIHNmZiB8fCBtYWtlRnJhbWVzR2V0dGVyVjgpO1xuICBzZmYgPSBudWxsO1xuICB2YXIgZnJhbWVzID0gVjhGUkFNRVMuc3RhY2s7XG4gIFY4RlJBTUVTLnN0YWNrID0gbnVsbDsgIC8vIElNUE9SVEFOVDogVGhpcyBpcyBuZWVkZWQgdG8gYXZvaWQgbGVha3MhISFcbiAgcmV0dXJuIGZ1bmN0aW9uIChjbGVhbnVwKSB7XG4gICAgdmFyIHJlc3VsdCA9IGZyYW1lcztcbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgZnJhbWVzID0gbnVsbDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG4vLyBub24tVjggY29kZSBwYXRoIGZvciBnZW5lcmF0aW5nIGEgZnJhbWVzIGdldHRlclxuZnVuY3Rpb24gbWFrZUZyYW1lc0dldHRlckNvbXBhdCAoc2ZmKSB7XG4gIC8vIE9idGFpbiBhIHN0YWNrIHRyYWNlIGF0IHRoZSBjdXJyZW50IHBvaW50XG4gIHZhciBlcnJvciA9IGdldEVycm9yV2l0aFN0YWNrKCk7XG5cbiAgLy8gV2FsayB0aGUgY2FsbGVyIGNoYWluIHRvIGFubm90YXRlIHRoZSBzdGFjayB3aXRoIGZ1bmN0aW9uIHJlZmVyZW5jZXNcbiAgLy8gR2l2ZW4gdGhlIGxpbWl0YXRpb25zIGltcG9zZWQgYnkgRVM1IFwic3RyaWN0IG1vZGVcIiBpdCdzIG5vdCBwb3NzaWJsZVxuICAvLyB0byBvYnRhaW4gcmVmZXJlbmNlcyB0byBmdW5jdGlvbnMgYmV5b25kIG9uZSB0aGF0IGlzIGRlZmluZWQgaW4gc3RyaWN0XG4gIC8vIG1vZGUuIEFsc28gbm90ZSB0aGF0IGFueSBraW5kIG9mIHJlY3Vyc2lvbiB3aWxsIG1ha2UgdGhlIHdhbGtlciB1bmFibGVcbiAgLy8gdG8gZ28gcGFzdCBpdC5cbiAgdmFyIGNhbGxlciA9IGFyZ3VtZW50cy5jYWxsZWU7XG4gIHZhciBmdW5jdGlvbnMgPSBbZ2V0RXJyb3JXaXRoU3RhY2tdO1xuICBmb3IgKHZhciBpPTA7IGNhbGxlciAmJiBpIDwgMTA7IGkrKykge1xuICAgIGZ1bmN0aW9ucy5wdXNoKGNhbGxlcik7XG4gICAgaWYgKGNhbGxlci5jYWxsZXIgPT09IGNhbGxlcikgYnJlYWs7XG4gICAgY2FsbGVyID0gY2FsbGVyLmNhbGxlcjtcbiAgfVxuICBjYWxsZXIgPSBudWxsO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoY2xlYW51cCkge1xuICAgIHZhciBmcmFtZXMgPSBudWxsO1xuXG4gICAgaWYgKCFjbGVhbnVwKSB7XG4gICAgICAvLyBQYXJzZSB0aGUgc3RhY2sgdHJhY2VcbiAgICAgIGZyYW1lcyA9IEVycm9yU3RhY2tQYXJzZXIucGFyc2UoZXJyb3IpO1xuICAgICAgLy8gQXR0YWNoIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdG8gdGhlIGZyYW1lcyAoc2tpcHBpbmcgdGhlIG1ha2VyIGZyYW1lcylcbiAgICAgIC8vIGFuZCBjcmVhdGluZyBDYWxsU2l0ZSBvYmplY3RzIGZvciBlYWNoIG9uZS5cbiAgICAgIGZvciAodmFyIGk9MjsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmcmFtZXNbaV0uZnVuY3Rpb24gPSBmdW5jdGlvbnNbaV07XG4gICAgICAgIGZyYW1lc1tpXSA9IG5ldyBDYWxsU2l0ZShmcmFtZXNbaV0pO1xuICAgICAgfVxuXG4gICAgICBmcmFtZXMgPSB0cmltKGZyYW1lcy5zbGljZSgyKSwgc2ZmKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCBjbG9zdXJlIHZhcmlhYmxlcyB0byBoZWxwIEdDXG4gICAgc2ZmID0gbnVsbDtcbiAgICBlcnJvciA9IG51bGw7XG4gICAgZnVuY3Rpb25zID0gbnVsbDtcblxuICAgIHJldHVybiBmcmFtZXM7XG4gIH07XG59XG5cbi8vIEdlbmVyYXRlcyBhIGdldHRlciBmb3IgdGhlIGNhbGwgc2l0ZSBmcmFtZXNcbi8vIFRPRE86IElmIHdlIG9ic2VydmUgbGVha3Mgd2l0aCBjb21wbGV4IHVzZSBjYXNlcyAoZHVlIHRvIGNsb3N1cmUgc2NvcGVzKVxuLy8gICAgICAgd2UgY2FuIGdlbmVyYXRlIGhlcmUgb3VyIGNvbXBhdCBDYWxsU2l0ZSBvYmplY3RzIHN0b3JpbmcgdGhlIGZ1bmN0aW9uJ3Ncbi8vICAgICAgIHNvdXJjZSBjb2RlIGluc3RlYWQgb2YgYW4gYWN0dWFsIHJlZmVyZW5jZSB0byB0aGVtLCB0aGF0IHNob3VsZCBoZWxwXG4vLyAgICAgICB0aGUgR0Mgc2luY2Ugd2UnbGwgYmUganVzdCBrZWVwaW5nIGxpdGVyYWxzIGFyb3VuZC5cbnZhciBtYWtlRnJhbWVzR2V0dGVyID0gdHlwZW9mIE5hdGl2ZUVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICA/IG1ha2VGcmFtZXNHZXR0ZXJWOFxuICAgICAgICAgICAgICAgICAgICAgOiBtYWtlRnJhbWVzR2V0dGVyQ29tcGF0O1xuXG5cbi8vIE92ZXJyaWRlIFY4IHN0YWNrIHRyYWNlIGJ1aWxkZXIgdG8gaW5qZWN0IG91ciBsb2dpY1xudmFyIG9sZFByZXBhcmVTdGFja1RyYWNlID0gRXJyb3IucHJlcGFyZVN0YWNrVHJhY2U7XG5FcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIChlcnJvciwgZnJhbWVzKSB7XG4gIC8vIFdoZW4gY2FsbGVkIGZyb20gbWFrZUZyYW1lc0dldHRlciB3ZSBqdXN0IHdhbnQgdG8gb2J0YWluIHRoZSBmcmFtZXNcbiAgaWYgKGVycm9yID09PSBWOEZSQU1FUykge1xuICAgIHJldHVybiBmcmFtZXM7XG4gIH1cblxuICAvLyBGb3J3YXJkIHRvIGFueSBwcmV2aW91c2x5IGRlZmluZWQgYmVoYXZpb3VyXG4gIGlmIChvbGRQcmVwYXJlU3RhY2tUcmFjZSkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gb2xkUHJlcGFyZVN0YWNrVHJhY2UuY2FsbChFcnJvciwgZXJyb3IsIGZyYW1lcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gSnVzdCBpZ25vcmUgdGhlIGVycm9yIChpZToga2FybWEtc291cmNlLW1hcC1zdXBwb3J0KVxuICAgIH1cbiAgfVxuXG4gIC8vIEVtdWxhdGUgZGVmYXVsdCBiZWhhdmlvdXIgKHdpdGggbG9uZy10cmFjZXMpXG4gIHJldHVybiBGYWlsdXJlLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZS5jYWxsKGVycm9yLCB1bndpbmQoZnJhbWVzKSk7XG59O1xuXG4vLyBBdHRhY2ggYSBuZXcgZXhjbHVzaW9uIHByZWRpY2F0ZSBmb3IgZnJhbWVzXG5mdW5jdGlvbiBleGNsdWRlIChjdG9yLCBwcmVkaWNhdGUpIHtcbiAgdmFyIGZuID0gcHJlZGljYXRlO1xuXG4gIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgIGZuID0gZnVuY3Rpb24gKGZyYW1lKSB7XG4gICAgICByZXR1cm4gLTEgIT09IGZyYW1lLmdldEZpbGVOYW1lKCkuaW5kZXhPZihwcmVkaWNhdGUpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByZWRpY2F0ZS50ZXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZm4gPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICAgIHJldHVybiBwcmVkaWNhdGUudGVzdChmcmFtZS5nZXRGaWxlTmFtZSgpKTtcbiAgICB9O1xuICB9XG5cbiAgY3Rvci5leGNsdWRlcy5wdXNoKGZuKTtcbn1cblxuLy8gRXhwb3NlIHRoZSBmaWx0ZXIgaW4gdGhlIHJvb3QgRmFpbHVyZSB0eXBlXG5GYWlsdXJlLmV4Y2x1ZGVzID0gW107XG5GYWlsdXJlLmV4Y2x1ZGUgPSBmdW5jdGlvbiBGYWlsdXJlX2V4Y2x1ZGUgKHByZWRpY2F0ZSkge1xuICBleGNsdWRlKEZhaWx1cmUsIHByZWRpY2F0ZSk7XG59O1xuXG4vLyBBdHRhY2ggYSBmcmFtZXMgZ2V0dGVyIHRvIHRoZSBmdW5jdGlvbiBzbyB3ZSBjYW4gcmUtY29uc3RydWN0IGFzeW5jIHN0YWNrcy5cbi8vXG4vLyBOb3RlIHRoYXQgdGhpcyBqdXN0IGF1Z21lbnRzIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBuZXcgcHJvcGVydHksIGl0IGRvZXNuJ3Rcbi8vIGNyZWF0ZSBhIHdyYXBwZXIgZXZlcnkgdGltZSBpdCdzIGNhbGxlZCwgc28gdXNpbmcgaXQgbXVsdGlwbGUgdGltZXMgb24gdGhlXG4vLyBzYW1lIGZ1bmN0aW9uIHdpbGwgaW5kZWVkIG92ZXJ3cml0ZSB0aGUgcHJldmlvdXMgdHJhY2tpbmcgaW5mb3JtYXRpb24uIFRoaXNcbi8vIGlzIGludGVuZGVkIHNpbmNlIGl0J3MgZmFzdGVyIGFuZCBtb3JlIGltcG9ydGFudGx5IGRvZXNuJ3QgYnJlYWsgc29tZSBBUElzXG4vLyB1c2luZyBjYWxsYmFjayByZWZlcmVuY2VzIHRvIHVucmVnaXN0ZXIgdGhlbSBmb3IgaW5zdGFuY2UuXG4vLyBXaGVuIHlvdSB3YW50IHRvIHVzZSB0aGUgc2FtZSBmdW5jdGlvbiB3aXRoIGRpZmZlcmVudCB0cmFja2luZyBpbmZvcm1hdGlvblxuLy8ganVzdCB1c2UgRmFpbHVyZS53cmFwKCkuXG4vL1xuLy8gVGhlIHRyYWNraW5nIGNhbiBiZSBnbG9iYWxseSBkaXNhYmxlZCBieSBzZXR0aW5nIEZhaWx1cmUuVFJBQ0sgdG8gZmFsc2VcbkZhaWx1cmUudHJhY2sgPSBmdW5jdGlvbiBGYWlsdXJlX3RyYWNrIChmbiwgc2ZmKSB7XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICAvLyBDbGVhbiB1cCBwcmV2aW91cyBmcmFtZXMgdG8gaGVscCB0aGUgR0NcbiAgaWYgKHR5cGVvZiBmbltTWU1CT0xfRlJBTUVTXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGZuW1NZTUJPTF9GUkFNRVNdKHRydWUpO1xuICB9XG5cbiAgaWYgKEZhaWx1cmUuVFJBQ0spIHtcbiAgICBmbltTWU1CT0xfRlJBTUVTXSA9IG51bGw7XG4gICAgZm5bU1lNQk9MX0ZSQU1FU10gPSBtYWtlRnJhbWVzR2V0dGVyKHNmZiB8fCBGYWlsdXJlX3RyYWNrKTtcbiAgfVxuXG4gIHJldHVybiBmbjtcbn07XG5cbi8vIFdyYXBzIHRoZSBmdW5jdGlvbiBiZWZvcmUgYW5ub3RhdGluZyBpdCB3aXRoIHRyYWNraW5nIGluZm9ybWF0aW9uLCB0aGlzXG4vLyBhbGxvd3MgdG8gdHJhY2sgbXVsdGlwbGUgc2NoZWR1bGxpbmdzIG9mIGEgc2luZ2xlIGZ1bmN0aW9uLlxuRmFpbHVyZS53cmFwID0gZnVuY3Rpb24gRmFpbHVyZV93cmFwIChmbikge1xuICB2YXIgd3JhcHBlciA9IEZhaWx1cmUuaWdub3JlKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIEZhaWx1cmUudHJhY2sod3JhcHBlciwgRmFpbHVyZV93cmFwKTtcbn07XG5cbi8vIE1hcmsgYSBmdW5jdGlvbiB0byBiZSBpZ25vcmVkIHdoZW4gZ2VuZXJhdGluZyBzdGFjayB0cmFjZXNcbkZhaWx1cmUuaWdub3JlID0gZnVuY3Rpb24gRmFpbHVyZV9pZ25vcmUgKGZuKSB7XG4gIGZuW1NZTUJPTF9JR05PUkVdID0gdHJ1ZTtcbiAgcmV0dXJuIGZuO1xufTtcblxuRmFpbHVyZS5zZXRUaW1lb3V0ID0gZnVuY3Rpb24gRmFpbHVyZV9zZXRUaW1lb3V0ICgpIHtcbiAgYXJndW1lbnRzWzBdID0gRmFpbHVyZS50cmFjayhhcmd1bWVudHNbMF0sIEZhaWx1cmVfc2V0VGltZW91dCk7XG4gIHJldHVybiBzZXRUaW1lb3V0LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG5GYWlsdXJlLm5leHRUaWNrID0gZnVuY3Rpb24gRmFpbHVyZV9uZXh0VGljayAoKSB7XG4gIGFyZ3VtZW50c1swXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzWzBdLCBGYWlsdXJlX25leHRUaWNrKTtcbiAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2suYXBwbHkocHJvY2VzcywgYXJndW1lbnRzKTtcbn07XG5cbkZhaWx1cmUucGF0Y2ggPSBmdW5jdGlvbiBGYWlsdXJlX3BhdGNoKG9iaiwgbmFtZSwgaWR4KSB7XG4gIGlmIChvYmogJiYgdHlwZW9mIG9ialtuYW1lXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBcIicgKyBuYW1lICsgJ1wiIG1ldGhvZCcpO1xuICB9XG5cbiAgdmFyIG9yaWdpbmFsID0gb2JqW25hbWVdO1xuXG4gIC8vIFdoZW4gdGhlIGV4YWN0IGFyZ3VtZW50IGluZGV4IGlzIHByb3ZpZGVkIHVzZSBhbiBvcHRpbWl6ZWQgY29kZSBwYXRoXG4gIGlmICh0eXBlb2YgaWR4ID09PSAnbnVtYmVyJykge1xuXG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgYXJndW1lbnRzW2lkeF0gPSBGYWlsdXJlLnRyYWNrKGFyZ3VtZW50c1tpZHhdLCBvYmpbbmFtZV0pO1xuICAgICAgcmV0dXJuIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAvLyBPdGhlcndpc2UgZGV0ZWN0IHRoZSBmdW5jdGlvbnMgdG8gdHJhY2sgYXQgaW52b2thdGlvbiB0aW1lXG4gIH0gZWxzZSB7XG5cbiAgICBvYmpbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGFyZ3VtZW50c1tpXSA9IEZhaWx1cmUudHJhY2soYXJndW1lbnRzW2ldLCBvYmpbbmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gIH1cblxuICAvLyBBdWdtZW50IHRoZSB3cmFwcGVyIHdpdGggYW55IHByb3BlcnRpZXMgZnJvbSB0aGUgb3JpZ2luYWxcbiAgZm9yICh2YXIgayBpbiBvcmlnaW5hbCkgaWYgKG9yaWdpbmFsLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgb2JqW25hbWVdW2tdID0gb3JpZ2luYWxba107XG4gIH1cblxuICByZXR1cm4gb2JqW25hbWVdO1xufTtcblxuLy8gSGVscGVyIHRvIGNyZWF0ZSBuZXcgRmFpbHVyZSB0eXBlc1xuRmFpbHVyZS5jcmVhdGUgPSBmdW5jdGlvbiAobmFtZSwgcHJvcHMpIHtcbiAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBGYWlsdXJlKCdFeHBlY3RlZCBhIG5hbWUgYXMgZmlyc3QgYXJndW1lbnQnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGN0b3IgKG1lc3NhZ2UsIHNmZikge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGYWlsdXJlKSkge1xuICAgICAgcmV0dXJuIG5ldyBjdG9yKG1lc3NhZ2UsIHNmZik7XG4gICAgfVxuICAgIEZhaWx1cmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIC8vIEF1Z21lbnQgY29uc3RydWN0b3JcbiAgY3Rvci5leGNsdWRlcyA9IFtdO1xuICBjdG9yLmV4Y2x1ZGUgPSBmdW5jdGlvbiAocHJlZGljYXRlKSB7XG4gICAgZXhjbHVkZShjdG9yLCBwcmVkaWNhdGUpO1xuICB9O1xuXG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShGYWlsdXJlLnByb3RvdHlwZSk7XG4gIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvcjtcbiAgY3Rvci5wcm90b3R5cGUubmFtZSA9IG5hbWU7XG4gIGlmICh0eXBlb2YgcHJvcHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjdG9yLnByb3RvdHlwZS5wcmVwYXJlU3RhY2tUcmFjZSA9IHByb3BzO1xuICB9IGVsc2UgaWYgKHByb3BzKSB7XG4gICAgT2JqZWN0LmtleXMocHJvcHMpLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIGN0b3IucHJvdG90eXBlW3Byb3BdID0gcHJvcDtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY3Rvcjtcbn07XG5cbnZhciBidWlsdGluRXJyb3JUeXBlcyA9IFtcbiAgJ0Vycm9yJywgJ1R5cGVFcnJvcicsICdSYW5nZUVycm9yJywgJ1JlZmVyZW5jZUVycm9yJywgJ1N5bnRheEVycm9yJyxcbiAgJ0V2YWxFcnJvcicsICdVUklFcnJvcicsICdJbnRlcm5hbEVycm9yJ1xuXTtcbnZhciBidWlsdGluRXJyb3JzID0ge307XG5cbkZhaWx1cmUuaW5zdGFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyA/IHdpbmRvdyA6IGdsb2JhbDtcblxuICBidWlsdGluRXJyb3JUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgaWYgKHJvb3RbdHlwZV0gJiYgIWJ1aWx0aW5FcnJvcnNbdHlwZV0pIHtcbiAgICAgIGJ1aWx0aW5FcnJvcnNbdHlwZV0gPSByb290W3R5cGVdO1xuICAgICAgcm9vdFt0eXBlXSA9IEZhaWx1cmUuY3JlYXRlKHR5cGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQWxsb3cgdXNhZ2U6IHZhciBGYWlsdXJlID0gcmVxdWlyZSgnZmFpbHVyZScpLmluc3RhbGwoKVxuICByZXR1cm4gRmFpbHVyZTtcbn07XG5cbkZhaWx1cmUudW5pbnN0YWxsID0gZnVuY3Rpb24gKCkge1xuICBidWlsdGluRXJyb3JUeXBlcy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgcm9vdFt0eXBlXSA9IGJ1aWx0aW5FcnJvcnNbdHlwZV0gfHwgcm9vdFt0eXBlXTtcbiAgfSk7XG59O1xuXG5cbnZhciBwcm90byA9IEZhaWx1cmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xucHJvdG8uY29uc3RydWN0b3IgPSBGYWlsdXJlO1xuXG5wcm90by5uYW1lID0gJ0ZhaWx1cmUnO1xucHJvdG8ubWVzc2FnZSA9ICcnO1xuXG5pZiAodHlwZW9mIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdmcmFtZXMnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBVc2UgdHJpbW1pbmcganVzdCBpbiBjYXNlIHRoZSBzZmYgd2FzIGRlZmluZWQgYWZ0ZXIgY29uc3RydWN0aW5nXG4gICAgICB2YXIgZnJhbWVzID0gdW53aW5kKHRyaW0odGhpcy5fZ2V0RnJhbWVzKCksIHRoaXMuc2ZmKSk7XG5cbiAgICAgIC8vIENhY2hlIG5leHQgYWNjZXNzZXMgdG8gdGhlIHByb3BlcnR5XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2ZyYW1lcycsIHtcbiAgICAgICAgdmFsdWU6IGZyYW1lcyxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICAvLyBDbGVhbiB1cCB0aGUgZ2V0dGVyIGNsb3N1cmVcbiAgICAgIHRoaXMuX2dldEZyYW1lcyA9IG51bGw7XG5cbiAgICAgIHJldHVybiBmcmFtZXM7XG4gICAgfVxuICB9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sICdzdGFjaycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlU3RhY2tUcmFjZSgpO1xuICAgIH1cbiAgfSk7XG59XG5cbnByb3RvLmdlbmVyYXRlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGV4Y2x1ZGVzID0gdGhpcy5jb25zdHJ1Y3Rvci5leGNsdWRlcztcbiAgdmFyIGluY2x1ZGUsIGZyYW1lcyA9IFtdO1xuXG4gIC8vIFNwZWNpZmljIHByb3RvdHlwZXMgaW5oZXJpdCB0aGUgZXhjbHVkZXMgZnJvbSBGYWlsdXJlXG4gIGlmIChleGNsdWRlcyAhPT0gRmFpbHVyZS5leGNsdWRlcykge1xuICAgIGV4Y2x1ZGVzLnB1c2guYXBwbHkoZXhjbHVkZXMsIEZhaWx1cmUuZXhjbHVkZXMpO1xuICB9XG5cbiAgLy8gQXBwbHkgZmlsdGVyaW5nXG4gIGZvciAodmFyIGk9MDsgaSA8IHRoaXMuZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaW5jbHVkZSA9IHRydWU7XG4gICAgaWYgKHRoaXMuZnJhbWVzW2ldKSB7XG4gICAgICBmb3IgKHZhciBqPTA7IGluY2x1ZGUgJiYgaiA8IGV4Y2x1ZGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGluY2x1ZGUgJj0gIWV4Y2x1ZGVzW2pdLmNhbGwodGhpcywgdGhpcy5mcmFtZXNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaW5jbHVkZSkge1xuICAgICAgZnJhbWVzLnB1c2godGhpcy5mcmFtZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIEhvbm9yIGFueSBwcmV2aW91c2x5IGRlZmluZWQgc3RhY2t0cmFjZSBmb3JtYXR0ZXIgYnlcbiAgLy8gYWxsb3dpbmcgaXQgZmluYWxseSBmb3JtYXQgdGhlIGZyYW1lcy4gVGhpcyBpcyBuZWVkZWRcbiAgLy8gd2hlbiB1c2luZyBub2RlLXNvdXJjZS1tYXAtc3VwcG9ydCBmb3IgaW5zdGFuY2UuXG4gIC8vIFRPRE86IENhbiB3ZSBtYXAgdGhlIFwibnVsbFwiIGZyYW1lcyB0byBhIENhbGxGcmFtZSBzaGltP1xuICBpZiAob2xkUHJlcGFyZVN0YWNrVHJhY2UpIHtcbiAgICBmcmFtZXMgPSBmcmFtZXMuZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiAhIXg7IH0pO1xuICAgIHJldHVybiBvbGRQcmVwYXJlU3RhY2tUcmFjZS5jYWxsKEVycm9yLCB0aGlzLCBmcmFtZXMpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMucHJlcGFyZVN0YWNrVHJhY2UoZnJhbWVzKTtcbn07XG5cbnByb3RvLnByZXBhcmVTdGFja1RyYWNlID0gZnVuY3Rpb24gKGZyYW1lcykge1xuICB2YXIgbGluZXMgPSBbdGhpc107XG4gIGZvciAodmFyIGk9MDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBmcmFtZXNbaV0gPyBGYWlsdXJlLkZSQU1FX1BSRUZJWCArIGZyYW1lc1tpXSA6IEZhaWx1cmUuRlJBTUVfRU1QVFlcbiAgICApO1xuICB9XG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBGYWlsdXJlO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OW1ZV2xzZFhKbEwyeHBZaTltWVdsc2RYSmxMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKMllYSWdSWEp5YjNKVGRHRmphMUJoY25ObGNpQTlJSEpsY1hWcGNtVW9KMlZ5Y205eUxYTjBZV05yTFhCaGNuTmxjaWNwTzF4dWRtRnlJRU5oYkd4VGFYUmxJRDBnY21WeGRXbHlaU2duTGk5allXeHNMWE5wZEdVbktUdGNibHh1THk4Z1MyVmxjQ0JoSUhKbFptVnlaVzVqWlNCMGJ5QjBhR1VnWW5WcGJIUnBiaUJsY25KdmNpQmpiMjV6ZEhKMVkzUnZjbHh1ZG1GeUlFNWhkR2wyWlVWeWNtOXlJRDBnUlhKeWIzSTdYRzVjYmk4dklFRnVibTkwWVhScGIyNGdjM2x0WW05c2MxeHVkbUZ5SUZOWlRVSlBURjlHVWtGTlJWTWdQU0FuUUVCbVlXbHNkWEpsTDJaeVlXMWxjeWM3WEc1MllYSWdVMWxOUWs5TVgwbEhUazlTUlNBOUlDZEFRR1poYVd4MWNtVXZhV2R1YjNKbEp6dGNibHh1WEc1bWRXNWpkR2x2YmlCR1lXbHNkWEpsSUNodFpYTnpZV2RsTENCelptWXBJSHRjYmlBZ2FXWWdLQ0VvZEdocGN5QnBibk4wWVc1alpXOW1JRVpoYVd4MWNtVXBLU0I3WEc0Z0lDQWdjbVYwZFhKdUlHNWxkeUJHWVdsc2RYSmxLRzFsYzNOaFoyVXNJSE5tWmlCOGZDQkdZV2xzZFhKbEtUdGNiaUFnZlZ4dVhHNGdJSFJvYVhNdWMyWm1JRDBnYzJabUlIeDhJSFJvYVhNdVkyOXVjM1J5ZFdOMGIzSTdYRzVjYmlBZ2RHaHBjeTV0WlhOellXZGxJRDBnYldWemMyRm5aVHRjYmx4dUlDQXZMeUJIWlc1bGNtRjBaU0JoSUdkbGRIUmxjaUJtYjNJZ2RHaGxJR1p5WVcxbGN5d2dkR2hwY3lCbGJuTjFjbVZ6SUhSb1lYUWdkMlVnWkc4Z1lYTWdiR2wwZEd4bElIZHZjbXRjYmlBZ0x5OGdZWE1nY0c5emMybGliR1VnZDJobGJpQnBibk4wWVc1MGFXRjBhVzVuSUhSb1pTQmxjbkp2Y2l3Z1pHVm1aWEp5YVc1bklIUm9aU0JsZUhCbGJuTnBkbVVnYzNSaFkydGNiaUFnTHk4Z2JXRnVaMnhwYm1jZ2IzQmxjbUYwYVc5dWN5QjFiblJwYkNCMGFHVWdMbk4wWVdOcklIQnliM0JsY25SNUlHbHpJR0ZqZEhWaGJHeDVJSEpsY1hWbGMzUmxaQzVjYmlBZ2RHaHBjeTVmWjJWMFJuSmhiV1Z6SUQwZ2JXRnJaVVp5WVcxbGMwZGxkSFJsY2loMGFHbHpMbk5tWmlrN1hHNWNiaUFnTHk4Z1QyNGdSVk0xSUdWdVoybHVaWE1nZDJVZ2RYTmxJRzl1WlMxMGFXMWxJR2RsZEhSbGNuTWdkRzhnWVdOMGRXRnNiSGtnWkdWbVpYSWdkR2hsSUdWNGNHVnVjMmwyWlZ4dUlDQXZMeUJ2Y0dWeVlYUnBiMjV6SUNoa1pXWnBibVZrSUdsdUlIUm9aU0J3Y205MGIzUjVjR1VnWm05eUlIQmxjbVp2Y20xaGJtTmxJSEpsWVhOdmJuTXBJSGRvYVd4bElHeGxaMkZqZVZ4dUlDQXZMeUJsYm1kcGJtVnpJSGRwYkd3Z2MybHRjR3g1SUdSdklHRnNiQ0IwYUdVZ2QyOXlheUIxY0NCbWNtOXVkQzVjYmlBZ2FXWWdLSFI1Y0dWdlppQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtnSVQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ0lDQjBhR2x6TG1aeVlXMWxjeUE5SUhWdWQybHVaQ2gwYUdsekxsOW5aWFJHY21GdFpYTW9LU2s3WEc0Z0lDQWdkR2hwY3k1ZloyVjBSbkpoYldWektIUnlkV1VwTzF4dUlDQWdJSFJvYVhNdVgyZGxkRVp5WVcxbGN5QTlJRzUxYkd3N1hHNGdJQ0FnZEdocGN5NXpkR0ZqYXlBOUlIUm9hWE11WjJWdVpYSmhkR1ZUZEdGamExUnlZV05sS0NrN1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2RHaHBjenRjYm4xY2JseHVMeThnVTJWMElFWlNRVTFGWDBWTlVGUlpJSFJ2SUc1MWJHd2dkRzhnWkdsellXSnNaU0JoYm5rZ2MyOXlkQ0J2WmlCelpYQmhjbUYwYjNKY2JrWmhhV3gxY21VdVJsSkJUVVZmUlUxUVZGa2dQU0FuSUNBdExTMHRMUzB0TFMwdExTMHRMUzB0TFMwdExTMHRMUzB0TFMwdExTMHRMUzB0TFMwdExTMHRKenRjYmtaaGFXeDFjbVV1UmxKQlRVVmZVRkpGUmtsWUlEMGdKeUFnWVhRZ0p6dGNibHh1THk4Z1Fua2daR1ZtWVhWc2RDQjNaU0JsYm1GaWJHVWdkSEpoWTJ0cGJtY2dabTl5SUdGemVXNWpJSE4wWVdOcklIUnlZV05sYzF4dVJtRnBiSFZ5WlM1VVVrRkRTeUE5SUhSeWRXVTdYRzVjYmx4dUx5OGdTR1ZzY0dWeUlIUnZJRzlpZEdGcGJpQjBhR1VnWTNWeWNtVnVkQ0J6ZEdGamF5QjBjbUZqWlZ4dWRtRnlJR2RsZEVWeWNtOXlWMmwwYUZOMFlXTnJJRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0J5WlhSMWNtNGdibVYzSUU1aGRHbDJaVVZ5Y205eUtDazdYRzU5TzF4dUx5OGdVMjl0WlNCbGJtZHBibVZ6SUdSdklHNXZkQ0JuWlc1bGNtRjBaU0IwYUdVZ0xuTjBZV05ySUhCeWIzQmxjblI1SUhWdWRHbHNJR2wwSjNNZ2RHaHliM2R1WEc1cFppQW9JV2RsZEVWeWNtOXlWMmwwYUZOMFlXTnJLQ2t1YzNSaFkyc3BJSHRjYmlBZ1oyVjBSWEp5YjNKWGFYUm9VM1JoWTJzZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdkSEo1SUhzZ2RHaHliM2NnYm1WM0lFNWhkR2wyWlVWeWNtOXlLQ2s3SUgwZ1kyRjBZMmdnS0dVcElIc2djbVYwZFhKdUlHVTdJSDFjYmlBZ2ZUdGNibjFjYmx4dUx5OGdWSEpwYlNCbWNtRnRaWE1nZFc1a1pYSWdkR2hsSUhCeWIzWnBaR1ZrSUhOMFlXTnJJR1pwY25OMElHWjFibU4wYVc5dVhHNW1kVzVqZEdsdmJpQjBjbWx0S0daeVlXMWxjeXdnYzJabUtTQjdYRzRnSUhaaGNpQm1iaXdnYm1GdFpTQTlJSE5tWmk1dVlXMWxPMXh1SUNCcFppQW9JV1p5WVcxbGN5a2dlMXh1SUNBZ0lHTnZibk52YkdVdWQyRnliaWduVzBaaGFXeDFjbVZkSUdWeWNtOXlJR05oY0hSMWNtbHVaeUJtY21GdFpYTW5LVHRjYmlBZ0lDQnlaWFIxY200Z1cxMDdYRzRnSUgxY2JpQWdabTl5SUNoMllYSWdhVDB3T3lCcElEd2dabkpoYldWekxteGxibWQwYURzZ2FTc3JLU0I3WEc0Z0lDQWdabTRnUFNCbWNtRnRaWE5iYVYwdVoyVjBSblZ1WTNScGIyNG9LVHRjYmlBZ0lDQnBaaUFvWm00Z0ppWWdabTRnUFQwOUlITm1aaUI4ZkNCdVlXMWxJQ1ltSUc1aGJXVWdQVDA5SUdaeVlXMWxjMXRwWFM1blpYUkdkVzVqZEdsdmJrNWhiV1VvS1NrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUdaeVlXMWxjeTV6YkdsalpTaHBJQ3NnTVNrN1hHNGdJQ0FnZlZ4dUlDQjlYRzRnSUhKbGRIVnliaUJtY21GdFpYTTdYRzU5WEc1Y2JtWjFibU4wYVc5dUlIVnVkMmx1WkNBb1puSmhiV1Z6S1NCN1hHNGdJSFpoY2lCeVpYTjFiSFFnUFNCYlhUdGNibHh1SUNCbWIzSWdLSFpoY2lCcFBUQXNJR1p1T3lCcElEd2dabkpoYldWekxteGxibWQwYURzZ2FTc3JLU0I3WEc0Z0lDQWdabTRnUFNCbWNtRnRaWE5iYVYwdVoyVjBSblZ1WTNScGIyNG9LVHRjYmx4dUlDQWdJR2xtSUNnaFptNGdmSHdnSVdadVcxTlpUVUpQVEY5SlIwNVBVa1ZkS1NCN1hHNGdJQ0FnSUNCeVpYTjFiSFF1Y0hWemFDaG1jbUZ0WlhOYmFWMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHbG1JQ2htYmlBbUppQm1ibHRUV1UxQ1QweGZSbEpCVFVWVFhTa2dlMXh1SUNBZ0lDQWdhV1lnS0VaaGFXeDFjbVV1UmxKQlRVVmZSVTFRVkZrcElIdGNiaUFnSUNBZ0lDQWdjbVZ6ZFd4MExuQjFjMmdvYm5Wc2JDazdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQzh2SUVOaGJHd2dkR2hsSUdkbGRIUmxjaUJoYm1RZ2EyVmxjQ0JoSUhKbFptVnlaVzVqWlNCMGJ5QjBhR1VnY21WemRXeDBJR2x1SUdOaGMyVWdkMlVnYUdGMlpTQjBiMXh1SUNBZ0lDQWdMeThnZFc1M2FXNWtJSFJvWlNCellXMWxJR1oxYm1OMGFXOXVJR0Z1YjNSb1pYSWdkR2x0WlM1Y2JpQWdJQ0FnSUM4dklGUlBSRTg2SUUxaGEyVWdjM1Z5WlNCclpXVndhVzVuSUdFZ2NtVm1aWEpsYm1ObElIUnZJSFJvWlNCbWNtRnRaWE1nWkc5bGMyNG5kQ0JqY21WaGRHVWdiR1ZoYTNOY2JpQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ1ptNWJVMWxOUWs5TVgwWlNRVTFGVTEwZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0FnSUNBZ2RtRnlJR2RsZEhSbGNpQTlJR1p1VzFOWlRVSlBURjlHVWtGTlJWTmRPMXh1SUNBZ0lDQWdJQ0JtYmx0VFdVMUNUMHhmUmxKQlRVVlRYU0E5SUc1MWJHdzdYRzRnSUNBZ0lDQWdJR1p1VzFOWlRVSlBURjlHVWtGTlJWTmRJRDBnWjJWMGRHVnlLQ2s3WEc0Z0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUdsbUlDZ2habTViVTFsTlFrOU1YMFpTUVUxRlUxMHBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMyOXNaUzUzWVhKdUtDZGJSbUZwYkhWeVpWMGdSVzF3ZEhrZ1puSmhiV1Z6SUdGdWJtOTBZWFJwYjI0bktUdGNiaUFnSUNBZ0lDQWdZMjl1ZEdsdWRXVTdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSEpsYzNWc2RDNXdkWE5vTG1Gd2NHeDVLSEpsYzNWc2RDd2dkVzUzYVc1a0tHWnVXMU5aVFVKUFRGOUdVa0ZOUlZOZEtTazdYRzRnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnY21WemRXeDBPMXh1ZlZ4dVhHNHZMeUJTWldObGFYWmxjaUJtYjNJZ2RHaGxJR1p5WVcxbGN5QnBiaUJoSUM1emRHRmpheUJ3Y205d1pYSjBlU0JtY205dElHTmhjSFIxY21WVGRHRmphMVJ5WVdObFhHNTJZWElnVmpoR1VrRk5SVk1nUFNCN2ZUdGNibHh1THk4Z1ZqZ2dZMjlrWlNCd1lYUm9JR1p2Y2lCblpXNWxjbUYwYVc1bklHRWdabkpoYldWeklHZGxkSFJsY2x4dVpuVnVZM1JwYjI0Z2JXRnJaVVp5WVcxbGMwZGxkSFJsY2xZNElDaHpabVlwSUh0Y2JpQWdUbUYwYVhabFJYSnliM0l1WTJGd2RIVnlaVk4wWVdOclZISmhZMlVvVmpoR1VrRk5SVk1zSUhObVppQjhmQ0J0WVd0bFJuSmhiV1Z6UjJWMGRHVnlWamdwTzF4dUlDQnpabVlnUFNCdWRXeHNPMXh1SUNCMllYSWdabkpoYldWeklEMGdWamhHVWtGTlJWTXVjM1JoWTJzN1hHNGdJRlk0UmxKQlRVVlRMbk4wWVdOcklEMGdiblZzYkRzZ0lDOHZJRWxOVUU5U1ZFRk9WRG9nVkdocGN5QnBjeUJ1WldWa1pXUWdkRzhnWVhadmFXUWdiR1ZoYTNNaElTRmNiaUFnY21WMGRYSnVJR1oxYm1OMGFXOXVJQ2hqYkdWaGJuVndLU0I3WEc0Z0lDQWdkbUZ5SUhKbGMzVnNkQ0E5SUdaeVlXMWxjenRjYmlBZ0lDQXZMeUJEYkdWaGJpQjFjQ0JqYkc5emRYSmxJSFpoY21saFlteGxjeUIwYnlCb1pXeHdJRWREWEc0Z0lDQWdabkpoYldWeklEMGdiblZzYkR0Y2JpQWdJQ0J5WlhSMWNtNGdjbVZ6ZFd4ME8xeHVJQ0I5TzF4dWZWeHVYRzR2THlCdWIyNHRWamdnWTI5a1pTQndZWFJvSUdadmNpQm5aVzVsY21GMGFXNW5JR0VnWm5KaGJXVnpJR2RsZEhSbGNseHVablZ1WTNScGIyNGdiV0ZyWlVaeVlXMWxjMGRsZEhSbGNrTnZiWEJoZENBb2MyWm1LU0I3WEc0Z0lDOHZJRTlpZEdGcGJpQmhJSE4wWVdOcklIUnlZV05sSUdGMElIUm9aU0JqZFhKeVpXNTBJSEJ2YVc1MFhHNGdJSFpoY2lCbGNuSnZjaUE5SUdkbGRFVnljbTl5VjJsMGFGTjBZV05yS0NrN1hHNWNiaUFnTHk4Z1YyRnNheUIwYUdVZ1kyRnNiR1Z5SUdOb1lXbHVJSFJ2SUdGdWJtOTBZWFJsSUhSb1pTQnpkR0ZqYXlCM2FYUm9JR1oxYm1OMGFXOXVJSEpsWm1WeVpXNWpaWE5jYmlBZ0x5OGdSMmwyWlc0Z2RHaGxJR3hwYldsMFlYUnBiMjV6SUdsdGNHOXpaV1FnWW5rZ1JWTTFJRndpYzNSeWFXTjBJRzF2WkdWY0lpQnBkQ2R6SUc1dmRDQndiM056YVdKc1pWeHVJQ0F2THlCMGJ5QnZZblJoYVc0Z2NtVm1aWEpsYm1ObGN5QjBieUJtZFc1amRHbHZibk1nWW1WNWIyNWtJRzl1WlNCMGFHRjBJR2x6SUdSbFptbHVaV1FnYVc0Z2MzUnlhV04wWEc0Z0lDOHZJRzF2WkdVdUlFRnNjMjhnYm05MFpTQjBhR0YwSUdGdWVTQnJhVzVrSUc5bUlISmxZM1Z5YzJsdmJpQjNhV3hzSUcxaGEyVWdkR2hsSUhkaGJHdGxjaUIxYm1GaWJHVmNiaUFnTHk4Z2RHOGdaMjhnY0dGemRDQnBkQzVjYmlBZ2RtRnlJR05oYkd4bGNpQTlJR0Z5WjNWdFpXNTBjeTVqWVd4c1pXVTdYRzRnSUhaaGNpQm1kVzVqZEdsdmJuTWdQU0JiWjJWMFJYSnliM0pYYVhSb1UzUmhZMnRkTzF4dUlDQm1iM0lnS0haaGNpQnBQVEE3SUdOaGJHeGxjaUFtSmlCcElEd2dNVEE3SUdrckt5a2dlMXh1SUNBZ0lHWjFibU4wYVc5dWN5NXdkWE5vS0dOaGJHeGxjaWs3WEc0Z0lDQWdhV1lnS0dOaGJHeGxjaTVqWVd4c1pYSWdQVDA5SUdOaGJHeGxjaWtnWW5KbFlXczdYRzRnSUNBZ1kyRnNiR1Z5SUQwZ1kyRnNiR1Z5TG1OaGJHeGxjanRjYmlBZ2ZWeHVJQ0JqWVd4c1pYSWdQU0J1ZFd4c08xeHVYRzRnSUhKbGRIVnliaUJtZFc1amRHbHZiaUFvWTJ4bFlXNTFjQ2tnZTF4dUlDQWdJSFpoY2lCbWNtRnRaWE1nUFNCdWRXeHNPMXh1WEc0Z0lDQWdhV1lnS0NGamJHVmhiblZ3S1NCN1hHNGdJQ0FnSUNBdkx5QlFZWEp6WlNCMGFHVWdjM1JoWTJzZ2RISmhZMlZjYmlBZ0lDQWdJR1p5WVcxbGN5QTlJRVZ5Y205eVUzUmhZMnRRWVhKelpYSXVjR0Z5YzJVb1pYSnliM0lwTzF4dUlDQWdJQ0FnTHk4Z1FYUjBZV05vSUdaMWJtTjBhVzl1SUhKbFptVnlaVzVqWlhNZ2RHOGdkR2hsSUdaeVlXMWxjeUFvYzJ0cGNIQnBibWNnZEdobElHMWhhMlZ5SUdaeVlXMWxjeWxjYmlBZ0lDQWdJQzh2SUdGdVpDQmpjbVZoZEdsdVp5QkRZV3hzVTJsMFpTQnZZbXBsWTNSeklHWnZjaUJsWVdOb0lHOXVaUzVjYmlBZ0lDQWdJR1p2Y2lBb2RtRnlJR2s5TWpzZ2FTQThJR1p5WVcxbGN5NXNaVzVuZEdnN0lHa3JLeWtnZTF4dUlDQWdJQ0FnSUNCbWNtRnRaWE5iYVYwdVpuVnVZM1JwYjI0Z1BTQm1kVzVqZEdsdmJuTmJhVjA3WEc0Z0lDQWdJQ0FnSUdaeVlXMWxjMXRwWFNBOUlHNWxkeUJEWVd4c1UybDBaU2htY21GdFpYTmJhVjBwTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCbWNtRnRaWE1nUFNCMGNtbHRLR1p5WVcxbGN5NXpiR2xqWlNneUtTd2djMlptS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2THlCRGJHVmhiaUIxY0NCamJHOXpkWEpsSUhaaGNtbGhZbXhsY3lCMGJ5Qm9aV3h3SUVkRFhHNGdJQ0FnYzJabUlEMGdiblZzYkR0Y2JpQWdJQ0JsY25KdmNpQTlJRzUxYkd3N1hHNGdJQ0FnWm5WdVkzUnBiMjV6SUQwZ2JuVnNiRHRjYmx4dUlDQWdJSEpsZEhWeWJpQm1jbUZ0WlhNN1hHNGdJSDA3WEc1OVhHNWNiaTh2SUVkbGJtVnlZWFJsY3lCaElHZGxkSFJsY2lCbWIzSWdkR2hsSUdOaGJHd2djMmwwWlNCbWNtRnRaWE5jYmk4dklGUlBSRTg2SUVsbUlIZGxJRzlpYzJWeWRtVWdiR1ZoYTNNZ2QybDBhQ0JqYjIxd2JHVjRJSFZ6WlNCallYTmxjeUFvWkhWbElIUnZJR05zYjNOMWNtVWdjMk52Y0dWektWeHVMeThnSUNBZ0lDQWdkMlVnWTJGdUlHZGxibVZ5WVhSbElHaGxjbVVnYjNWeUlHTnZiWEJoZENCRFlXeHNVMmwwWlNCdlltcGxZM1J6SUhOMGIzSnBibWNnZEdobElHWjFibU4wYVc5dUozTmNiaTh2SUNBZ0lDQWdJSE52ZFhKalpTQmpiMlJsSUdsdWMzUmxZV1FnYjJZZ1lXNGdZV04wZFdGc0lISmxabVZ5Wlc1alpTQjBieUIwYUdWdExDQjBhR0YwSUhOb2IzVnNaQ0JvWld4d1hHNHZMeUFnSUNBZ0lDQjBhR1VnUjBNZ2MybHVZMlVnZDJVbmJHd2dZbVVnYW5WemRDQnJaV1Z3YVc1bklHeHBkR1Z5WVd4eklHRnliM1Z1WkM1Y2JuWmhjaUJ0WVd0bFJuSmhiV1Z6UjJWMGRHVnlJRDBnZEhsd1pXOW1JRTVoZEdsMlpVVnljbTl5TG1OaGNIUjFjbVZUZEdGamExUnlZV05sSUQwOVBTQW5ablZ1WTNScGIyNG5YRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBL0lHMWhhMlZHY21GdFpYTkhaWFIwWlhKV09GeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnT2lCdFlXdGxSbkpoYldWelIyVjBkR1Z5UTI5dGNHRjBPMXh1WEc1Y2JpOHZJRTkyWlhKeWFXUmxJRlk0SUhOMFlXTnJJSFJ5WVdObElHSjFhV3hrWlhJZ2RHOGdhVzVxWldOMElHOTFjaUJzYjJkcFkxeHVkbUZ5SUc5c1pGQnlaWEJoY21WVGRHRmphMVJ5WVdObElEMGdSWEp5YjNJdWNISmxjR0Z5WlZOMFlXTnJWSEpoWTJVN1hHNUZjbkp2Y2k1d2NtVndZWEpsVTNSaFkydFVjbUZqWlNBOUlHWjFibU4wYVc5dUlDaGxjbkp2Y2l3Z1puSmhiV1Z6S1NCN1hHNGdJQzh2SUZkb1pXNGdZMkZzYkdWa0lHWnliMjBnYldGclpVWnlZVzFsYzBkbGRIUmxjaUIzWlNCcWRYTjBJSGRoYm5RZ2RHOGdiMkowWVdsdUlIUm9aU0JtY21GdFpYTmNiaUFnYVdZZ0tHVnljbTl5SUQwOVBTQldPRVpTUVUxRlV5a2dlMXh1SUNBZ0lISmxkSFZ5YmlCbWNtRnRaWE03WEc0Z0lIMWNibHh1SUNBdkx5QkdiM0ozWVhKa0lIUnZJR0Z1ZVNCd2NtVjJhVzkxYzJ4NUlHUmxabWx1WldRZ1ltVm9ZWFpwYjNWeVhHNGdJR2xtSUNodmJHUlFjbVZ3WVhKbFUzUmhZMnRVY21GalpTa2dlMXh1SUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdiMnhrVUhKbGNHRnlaVk4wWVdOclZISmhZMlV1WTJGc2JDaEZjbkp2Y2l3Z1pYSnliM0lzSUdaeVlXMWxjeWs3WEc0Z0lDQWdmU0JqWVhSamFDQW9aU2tnZTF4dUlDQWdJQ0FnTHk4Z1NuVnpkQ0JwWjI1dmNtVWdkR2hsSUdWeWNtOXlJQ2hwWlRvZ2EyRnliV0V0YzI5MWNtTmxMVzFoY0MxemRYQndiM0owS1Z4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUM4dklFVnRkV3hoZEdVZ1pHVm1ZWFZzZENCaVpXaGhkbWx2ZFhJZ0tIZHBkR2dnYkc5dVp5MTBjbUZqWlhNcFhHNGdJSEpsZEhWeWJpQkdZV2xzZFhKbExuQnliM1J2ZEhsd1pTNXdjbVZ3WVhKbFUzUmhZMnRVY21GalpTNWpZV3hzS0dWeWNtOXlMQ0IxYm5kcGJtUW9abkpoYldWektTazdYRzU5TzF4dVhHNHZMeUJCZEhSaFkyZ2dZU0J1WlhjZ1pYaGpiSFZ6YVc5dUlIQnlaV1JwWTJGMFpTQm1iM0lnWm5KaGJXVnpYRzVtZFc1amRHbHZiaUJsZUdOc2RXUmxJQ2hqZEc5eUxDQndjbVZrYVdOaGRHVXBJSHRjYmlBZ2RtRnlJR1p1SUQwZ2NISmxaR2xqWVhSbE8xeHVYRzRnSUdsbUlDaDBlWEJsYjJZZ2NISmxaR2xqWVhSbElEMDlQU0FuYzNSeWFXNW5KeWtnZTF4dUlDQWdJR1p1SUQwZ1puVnVZM1JwYjI0Z0tHWnlZVzFsS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnTFRFZ0lUMDlJR1p5WVcxbExtZGxkRVpwYkdWT1lXMWxLQ2t1YVc1a1pYaFBaaWh3Y21Wa2FXTmhkR1VwTzF4dUlDQWdJSDA3WEc0Z0lIMGdaV3h6WlNCcFppQW9kSGx3Wlc5bUlIQnlaV1JwWTJGMFpTNTBaWE4wSUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdabTRnUFNCbWRXNWpkR2x2YmlBb1puSmhiV1VwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUJ3Y21Wa2FXTmhkR1V1ZEdWemRDaG1jbUZ0WlM1blpYUkdhV3hsVG1GdFpTZ3BLVHRjYmlBZ0lDQjlPMXh1SUNCOVhHNWNiaUFnWTNSdmNpNWxlR05zZFdSbGN5NXdkWE5vS0dadUtUdGNibjFjYmx4dUx5OGdSWGh3YjNObElIUm9aU0JtYVd4MFpYSWdhVzRnZEdobElISnZiM1FnUm1GcGJIVnlaU0IwZVhCbFhHNUdZV2xzZFhKbExtVjRZMngxWkdWeklEMGdXMTA3WEc1R1lXbHNkWEpsTG1WNFkyeDFaR1VnUFNCbWRXNWpkR2x2YmlCR1lXbHNkWEpsWDJWNFkyeDFaR1VnS0hCeVpXUnBZMkYwWlNrZ2UxeHVJQ0JsZUdOc2RXUmxLRVpoYVd4MWNtVXNJSEJ5WldScFkyRjBaU2s3WEc1OU8xeHVYRzR2THlCQmRIUmhZMmdnWVNCbWNtRnRaWE1nWjJWMGRHVnlJSFJ2SUhSb1pTQm1kVzVqZEdsdmJpQnpieUIzWlNCallXNGdjbVV0WTI5dWMzUnlkV04wSUdGemVXNWpJSE4wWVdOcmN5NWNiaTh2WEc0dkx5Qk9iM1JsSUhSb1lYUWdkR2hwY3lCcWRYTjBJR0YxWjIxbGJuUnpJSFJvWlNCbWRXNWpkR2x2YmlCM2FYUm9JSFJvWlNCdVpYY2djSEp2Y0dWeWRIa3NJR2wwSUdSdlpYTnVKM1JjYmk4dklHTnlaV0YwWlNCaElIZHlZWEJ3WlhJZ1pYWmxjbmtnZEdsdFpTQnBkQ2R6SUdOaGJHeGxaQ3dnYzI4Z2RYTnBibWNnYVhRZ2JYVnNkR2x3YkdVZ2RHbHRaWE1nYjI0Z2RHaGxYRzR2THlCellXMWxJR1oxYm1OMGFXOXVJSGRwYkd3Z2FXNWtaV1ZrSUc5MlpYSjNjbWwwWlNCMGFHVWdjSEpsZG1sdmRYTWdkSEpoWTJ0cGJtY2dhVzVtYjNKdFlYUnBiMjR1SUZSb2FYTmNiaTh2SUdseklHbHVkR1Z1WkdWa0lITnBibU5sSUdsMEozTWdabUZ6ZEdWeUlHRnVaQ0J0YjNKbElHbHRjRzl5ZEdGdWRHeDVJR1J2WlhOdUozUWdZbkpsWVdzZ2MyOXRaU0JCVUVselhHNHZMeUIxYzJsdVp5QmpZV3hzWW1GamF5QnlaV1psY21WdVkyVnpJSFJ2SUhWdWNtVm5hWE4wWlhJZ2RHaGxiU0JtYjNJZ2FXNXpkR0Z1WTJVdVhHNHZMeUJYYUdWdUlIbHZkU0IzWVc1MElIUnZJSFZ6WlNCMGFHVWdjMkZ0WlNCbWRXNWpkR2x2YmlCM2FYUm9JR1JwWm1abGNtVnVkQ0IwY21GamEybHVaeUJwYm1admNtMWhkR2x2Ymx4dUx5OGdhblZ6ZENCMWMyVWdSbUZwYkhWeVpTNTNjbUZ3S0NrdVhHNHZMMXh1THk4Z1ZHaGxJSFJ5WVdOcmFXNW5JR05oYmlCaVpTQm5iRzlpWVd4c2VTQmthWE5oWW14bFpDQmllU0J6WlhSMGFXNW5JRVpoYVd4MWNtVXVWRkpCUTBzZ2RHOGdabUZzYzJWY2JrWmhhV3gxY21VdWRISmhZMnNnUFNCbWRXNWpkR2x2YmlCR1lXbHNkWEpsWDNSeVlXTnJJQ2htYml3Z2MyWm1LU0I3WEc0Z0lHbG1JQ2gwZVhCbGIyWWdabTRnSVQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ0lDQnlaWFIxY200Z1ptNDdYRzRnSUgxY2JseHVJQ0F2THlCRGJHVmhiaUIxY0NCd2NtVjJhVzkxY3lCbWNtRnRaWE1nZEc4Z2FHVnNjQ0IwYUdVZ1IwTmNiaUFnYVdZZ0tIUjVjR1Z2WmlCbWJsdFRXVTFDVDB4ZlJsSkJUVVZUWFNBOVBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQWdJR1p1VzFOWlRVSlBURjlHVWtGTlJWTmRLSFJ5ZFdVcE8xeHVJQ0I5WEc1Y2JpQWdhV1lnS0VaaGFXeDFjbVV1VkZKQlEwc3BJSHRjYmlBZ0lDQm1ibHRUV1UxQ1QweGZSbEpCVFVWVFhTQTlJRzUxYkd3N1hHNGdJQ0FnWm01YlUxbE5RazlNWDBaU1FVMUZVMTBnUFNCdFlXdGxSbkpoYldWelIyVjBkR1Z5S0hObVppQjhmQ0JHWVdsc2RYSmxYM1J5WVdOcktUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQm1ianRjYm4wN1hHNWNiaTh2SUZkeVlYQnpJSFJvWlNCbWRXNWpkR2x2YmlCaVpXWnZjbVVnWVc1dWIzUmhkR2x1WnlCcGRDQjNhWFJvSUhSeVlXTnJhVzVuSUdsdVptOXliV0YwYVc5dUxDQjBhR2x6WEc0dkx5QmhiR3h2ZDNNZ2RHOGdkSEpoWTJzZ2JYVnNkR2x3YkdVZ2MyTm9aV1IxYkd4cGJtZHpJRzltSUdFZ2MybHVaMnhsSUdaMWJtTjBhVzl1TGx4dVJtRnBiSFZ5WlM1M2NtRndJRDBnWm5WdVkzUnBiMjRnUm1GcGJIVnlaVjkzY21Gd0lDaG1iaWtnZTF4dUlDQjJZWElnZDNKaGNIQmxjaUE5SUVaaGFXeDFjbVV1YVdkdWIzSmxLR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdabTR1WVhCd2JIa29kR2hwY3l3Z1lYSm5kVzFsYm5SektUdGNiaUFnZlNrN1hHNWNiaUFnY21WMGRYSnVJRVpoYVd4MWNtVXVkSEpoWTJzb2QzSmhjSEJsY2l3Z1JtRnBiSFZ5WlY5M2NtRndLVHRjYm4wN1hHNWNiaTh2SUUxaGNtc2dZU0JtZFc1amRHbHZiaUIwYnlCaVpTQnBaMjV2Y21Wa0lIZG9aVzRnWjJWdVpYSmhkR2x1WnlCemRHRmpheUIwY21GalpYTmNia1poYVd4MWNtVXVhV2R1YjNKbElEMGdablZ1WTNScGIyNGdSbUZwYkhWeVpWOXBaMjV2Y21VZ0tHWnVLU0I3WEc0Z0lHWnVXMU5aVFVKUFRGOUpSMDVQVWtWZElEMGdkSEoxWlR0Y2JpQWdjbVYwZFhKdUlHWnVPMXh1ZlR0Y2JseHVSbUZwYkhWeVpTNXpaWFJVYVcxbGIzVjBJRDBnWm5WdVkzUnBiMjRnUm1GcGJIVnlaVjl6WlhSVWFXMWxiM1YwSUNncElIdGNiaUFnWVhKbmRXMWxiblJ6V3pCZElEMGdSbUZwYkhWeVpTNTBjbUZqYXloaGNtZDFiV1Z1ZEhOYk1GMHNJRVpoYVd4MWNtVmZjMlYwVkdsdFpXOTFkQ2s3WEc0Z0lISmxkSFZ5YmlCelpYUlVhVzFsYjNWMExtRndjR3g1S0c1MWJHd3NJR0Z5WjNWdFpXNTBjeWs3WEc1OU8xeHVYRzVHWVdsc2RYSmxMbTVsZUhSVWFXTnJJRDBnWm5WdVkzUnBiMjRnUm1GcGJIVnlaVjl1WlhoMFZHbGpheUFvS1NCN1hHNGdJR0Z5WjNWdFpXNTBjMXN3WFNBOUlFWmhhV3gxY21VdWRISmhZMnNvWVhKbmRXMWxiblJ6V3pCZExDQkdZV2xzZFhKbFgyNWxlSFJVYVdOcktUdGNiaUFnY21WMGRYSnVJSEJ5YjJObGMzTXVibVY0ZEZScFkyc3VZWEJ3Ykhrb2NISnZZMlZ6Y3l3Z1lYSm5kVzFsYm5SektUdGNibjA3WEc1Y2JrWmhhV3gxY21VdWNHRjBZMmdnUFNCbWRXNWpkR2x2YmlCR1lXbHNkWEpsWDNCaGRHTm9LRzlpYWl3Z2JtRnRaU3dnYVdSNEtTQjdYRzRnSUdsbUlDaHZZbW9nSmlZZ2RIbHdaVzltSUc5aWFsdHVZVzFsWFNBaFBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQWdJSFJvY205M0lHNWxkeUJGY25KdmNpZ25UMkpxWldOMElHUnZaWE1nYm05MElHaGhkbVVnWVNCY0lpY2dLeUJ1WVcxbElDc2dKMXdpSUcxbGRHaHZaQ2NwTzF4dUlDQjlYRzVjYmlBZ2RtRnlJRzl5YVdkcGJtRnNJRDBnYjJKcVcyNWhiV1ZkTzF4dVhHNGdJQzh2SUZkb1pXNGdkR2hsSUdWNFlXTjBJR0Z5WjNWdFpXNTBJR2x1WkdWNElHbHpJSEJ5YjNacFpHVmtJSFZ6WlNCaGJpQnZjSFJwYldsNlpXUWdZMjlrWlNCd1lYUm9YRzRnSUdsbUlDaDBlWEJsYjJZZ2FXUjRJRDA5UFNBbmJuVnRZbVZ5SnlrZ2UxeHVYRzRnSUNBZ2IySnFXMjVoYldWZElEMGdablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnWVhKbmRXMWxiblJ6VzJsa2VGMGdQU0JHWVdsc2RYSmxMblJ5WVdOcktHRnlaM1Z0Wlc1MGMxdHBaSGhkTENCdlltcGJibUZ0WlYwcE8xeHVJQ0FnSUNBZ2NtVjBkWEp1SUc5eWFXZHBibUZzTG1Gd2NHeDVLSFJvYVhNc0lHRnlaM1Z0Wlc1MGN5azdYRzRnSUNBZ2ZUdGNibHh1SUNBdkx5QlBkR2hsY25kcGMyVWdaR1YwWldOMElIUm9aU0JtZFc1amRHbHZibk1nZEc4Z2RISmhZMnNnWVhRZ2FXNTJiMnRoZEdsdmJpQjBhVzFsWEc0Z0lIMGdaV3h6WlNCN1hHNWNiaUFnSUNCdlltcGJibUZ0WlYwZ1BTQm1kVzVqZEdsdmJpQW9LU0I3WEc0Z0lDQWdJQ0JtYjNJZ0tIWmhjaUJwSUQwZ01Ec2dhU0E4SUdGeVozVnRaVzUwY3k1c1pXNW5kR2c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdGeVozVnRaVzUwYzF0cFhTQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUNBZ0lDQWdJR0Z5WjNWdFpXNTBjMXRwWFNBOUlFWmhhV3gxY21VdWRISmhZMnNvWVhKbmRXMWxiblJ6VzJsZExDQnZZbXBiYm1GdFpWMHBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdJQ0J5WlhSMWNtNGdiM0pwWjJsdVlXd3VZWEJ3Ykhrb2RHaHBjeXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdJQ0I5TzF4dVhHNGdJSDFjYmx4dUlDQXZMeUJCZFdkdFpXNTBJSFJvWlNCM2NtRndjR1Z5SUhkcGRHZ2dZVzU1SUhCeWIzQmxjblJwWlhNZ1puSnZiU0IwYUdVZ2IzSnBaMmx1WVd4Y2JpQWdabTl5SUNoMllYSWdheUJwYmlCdmNtbG5hVzVoYkNrZ2FXWWdLRzl5YVdkcGJtRnNMbWhoYzA5M2JsQnliM0JsY25SNUtHc3BLU0I3WEc0Z0lDQWdiMkpxVzI1aGJXVmRXMnRkSUQwZ2IzSnBaMmx1WVd4YmExMDdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdiMkpxVzI1aGJXVmRPMXh1ZlR0Y2JseHVMeThnU0dWc2NHVnlJSFJ2SUdOeVpXRjBaU0J1WlhjZ1JtRnBiSFZ5WlNCMGVYQmxjMXh1Um1GcGJIVnlaUzVqY21WaGRHVWdQU0JtZFc1amRHbHZiaUFvYm1GdFpTd2djSEp2Y0hNcElIdGNiaUFnYVdZZ0tIUjVjR1Z2WmlCdVlXMWxJQ0U5UFNBbmMzUnlhVzVuSnlrZ2UxeHVJQ0FnSUhSb2NtOTNJRzVsZHlCR1lXbHNkWEpsS0NkRmVIQmxZM1JsWkNCaElHNWhiV1VnWVhNZ1ptbHljM1FnWVhKbmRXMWxiblFuS1R0Y2JpQWdmVnh1WEc0Z0lHWjFibU4wYVc5dUlHTjBiM0lnS0cxbGMzTmhaMlVzSUhObVppa2dlMXh1SUNBZ0lHbG1JQ2doS0hSb2FYTWdhVzV6ZEdGdVkyVnZaaUJHWVdsc2RYSmxLU2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRzVsZHlCamRHOXlLRzFsYzNOaFoyVXNJSE5tWmlrN1hHNGdJQ0FnZlZ4dUlDQWdJRVpoYVd4MWNtVXVZWEJ3Ykhrb2RHaHBjeXdnWVhKbmRXMWxiblJ6S1R0Y2JpQWdmVnh1WEc0Z0lDOHZJRUYxWjIxbGJuUWdZMjl1YzNSeWRXTjBiM0pjYmlBZ1kzUnZjaTVsZUdOc2RXUmxjeUE5SUZ0ZE8xeHVJQ0JqZEc5eUxtVjRZMngxWkdVZ1BTQm1kVzVqZEdsdmJpQW9jSEpsWkdsallYUmxLU0I3WEc0Z0lDQWdaWGhqYkhWa1pTaGpkRzl5TENCd2NtVmthV05oZEdVcE8xeHVJQ0I5TzF4dVhHNGdJR04wYjNJdWNISnZkRzkwZVhCbElEMGdUMkpxWldOMExtTnlaV0YwWlNoR1lXbHNkWEpsTG5CeWIzUnZkSGx3WlNrN1hHNGdJR04wYjNJdWNISnZkRzkwZVhCbExtTnZibk4wY25WamRHOXlJRDBnWTNSdmNqdGNiaUFnWTNSdmNpNXdjbTkwYjNSNWNHVXVibUZ0WlNBOUlHNWhiV1U3WEc0Z0lHbG1JQ2gwZVhCbGIyWWdjSEp2Y0hNZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0JqZEc5eUxuQnliM1J2ZEhsd1pTNXdjbVZ3WVhKbFUzUmhZMnRVY21GalpTQTlJSEJ5YjNCek8xeHVJQ0I5SUdWc2MyVWdhV1lnS0hCeWIzQnpLU0I3WEc0Z0lDQWdUMkpxWldOMExtdGxlWE1vY0hKdmNITXBMbVp2Y2tWaFkyZ29ablZ1WTNScGIyNGdLSEJ5YjNBcElIdGNiaUFnSUNBZ0lHTjBiM0l1Y0hKdmRHOTBlWEJsVzNCeWIzQmRJRDBnY0hKdmNEdGNiaUFnSUNCOUtUdGNiaUFnZlZ4dUlDQnlaWFIxY200Z1kzUnZjanRjYm4wN1hHNWNiblpoY2lCaWRXbHNkR2x1UlhKeWIzSlVlWEJsY3lBOUlGdGNiaUFnSjBWeWNtOXlKeXdnSjFSNWNHVkZjbkp2Y2ljc0lDZFNZVzVuWlVWeWNtOXlKeXdnSjFKbFptVnlaVzVqWlVWeWNtOXlKeXdnSjFONWJuUmhlRVZ5Y205eUp5eGNiaUFnSjBWMllXeEZjbkp2Y2ljc0lDZFZVa2xGY25KdmNpY3NJQ2RKYm5SbGNtNWhiRVZ5Y205eUoxeHVYVHRjYm5aaGNpQmlkV2xzZEdsdVJYSnliM0p6SUQwZ2UzMDdYRzVjYmtaaGFXeDFjbVV1YVc1emRHRnNiQ0E5SUdaMWJtTjBhVzl1SUNncElIdGNiaUFnZG1GeUlISnZiM1FnUFNCMGVYQmxiMllnZDJsdVpHOTNJRDA5UFNBbmIySnFaV04wSnlBL0lIZHBibVJ2ZHlBNklHZHNiMkpoYkR0Y2JseHVJQ0JpZFdsc2RHbHVSWEp5YjNKVWVYQmxjeTVtYjNKRllXTm9LR1oxYm1OMGFXOXVJQ2gwZVhCbEtTQjdYRzRnSUNBZ2FXWWdLSEp2YjNSYmRIbHdaVjBnSmlZZ0lXSjFhV3gwYVc1RmNuSnZjbk5iZEhsd1pWMHBJSHRjYmlBZ0lDQWdJR0oxYVd4MGFXNUZjbkp2Y25OYmRIbHdaVjBnUFNCeWIyOTBXM1I1Y0dWZE8xeHVJQ0FnSUNBZ2NtOXZkRnQwZVhCbFhTQTlJRVpoYVd4MWNtVXVZM0psWVhSbEtIUjVjR1VwTzF4dUlDQWdJSDFjYmlBZ2ZTazdYRzVjYmlBZ0x5OGdRV3hzYjNjZ2RYTmhaMlU2SUhaaGNpQkdZV2xzZFhKbElEMGdjbVZ4ZFdseVpTZ25abUZwYkhWeVpTY3BMbWx1YzNSaGJHd29LVnh1SUNCeVpYUjFjbTRnUm1GcGJIVnlaVHRjYm4wN1hHNWNia1poYVd4MWNtVXVkVzVwYm5OMFlXeHNJRDBnWm5WdVkzUnBiMjRnS0NrZ2UxeHVJQ0JpZFdsc2RHbHVSWEp5YjNKVWVYQmxjeTVtYjNKRllXTm9LR1oxYm1OMGFXOXVJQ2gwZVhCbEtTQjdYRzRnSUNBZ2NtOXZkRnQwZVhCbFhTQTlJR0oxYVd4MGFXNUZjbkp2Y25OYmRIbHdaVjBnZkh3Z2NtOXZkRnQwZVhCbFhUdGNiaUFnZlNrN1hHNTlPMXh1WEc1Y2JuWmhjaUJ3Y205MGJ5QTlJRVpoYVd4MWNtVXVjSEp2ZEc5MGVYQmxJRDBnVDJKcVpXTjBMbU55WldGMFpTaEZjbkp2Y2k1d2NtOTBiM1I1Y0dVcE8xeHVjSEp2ZEc4dVkyOXVjM1J5ZFdOMGIzSWdQU0JHWVdsc2RYSmxPMXh1WEc1d2NtOTBieTV1WVcxbElEMGdKMFpoYVd4MWNtVW5PMXh1Y0hKdmRHOHViV1Z6YzJGblpTQTlJQ2NuTzF4dVhHNXBaaUFvZEhsd1pXOW1JRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowZVNBOVBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvY0hKdmRHOHNJQ2RtY21GdFpYTW5MQ0I3WEc0Z0lDQWdaMlYwT2lCbWRXNWpkR2x2YmlBb0tTQjdYRzRnSUNBZ0lDQXZMeUJWYzJVZ2RISnBiVzFwYm1jZ2FuVnpkQ0JwYmlCallYTmxJSFJvWlNCelptWWdkMkZ6SUdSbFptbHVaV1FnWVdaMFpYSWdZMjl1YzNSeWRXTjBhVzVuWEc0Z0lDQWdJQ0IyWVhJZ1puSmhiV1Z6SUQwZ2RXNTNhVzVrS0hSeWFXMG9kR2hwY3k1ZloyVjBSbkpoYldWektDa3NJSFJvYVhNdWMyWm1LU2s3WEc1Y2JpQWdJQ0FnSUM4dklFTmhZMmhsSUc1bGVIUWdZV05qWlhOelpYTWdkRzhnZEdobElIQnliM0JsY25SNVhHNGdJQ0FnSUNCUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRIa29kR2hwY3l3Z0oyWnlZVzFsY3ljc0lIdGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklHWnlZVzFsY3l4Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklIUnlkV1ZjYmlBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBdkx5QkRiR1ZoYmlCMWNDQjBhR1VnWjJWMGRHVnlJR05zYjNOMWNtVmNiaUFnSUNBZ0lIUm9hWE11WDJkbGRFWnlZVzFsY3lBOUlHNTFiR3c3WEc1Y2JpQWdJQ0FnSUhKbGRIVnliaUJtY21GdFpYTTdYRzRnSUNBZ2ZWeHVJQ0I5S1R0Y2JseHVJQ0JQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb2NISnZkRzhzSUNkemRHRmpheWNzSUh0Y2JpQWdJQ0JuWlhRNklHWjFibU4wYVc5dUlDZ3BJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG1kbGJtVnlZWFJsVTNSaFkydFVjbUZqWlNncE8xeHVJQ0FnSUgxY2JpQWdmU2s3WEc1OVhHNWNibkJ5YjNSdkxtZGxibVZ5WVhSbFUzUmhZMnRVY21GalpTQTlJR1oxYm1OMGFXOXVJQ2dwSUh0Y2JpQWdkbUZ5SUdWNFkyeDFaR1Z6SUQwZ2RHaHBjeTVqYjI1emRISjFZM1J2Y2k1bGVHTnNkV1JsY3p0Y2JpQWdkbUZ5SUdsdVkyeDFaR1VzSUdaeVlXMWxjeUE5SUZ0ZE8xeHVYRzRnSUM4dklGTndaV05wWm1saklIQnliM1J2ZEhsd1pYTWdhVzVvWlhKcGRDQjBhR1VnWlhoamJIVmtaWE1nWm5KdmJTQkdZV2xzZFhKbFhHNGdJR2xtSUNobGVHTnNkV1JsY3lBaFBUMGdSbUZwYkhWeVpTNWxlR05zZFdSbGN5a2dlMXh1SUNBZ0lHVjRZMngxWkdWekxuQjFjMmd1WVhCd2JIa29aWGhqYkhWa1pYTXNJRVpoYVd4MWNtVXVaWGhqYkhWa1pYTXBPMXh1SUNCOVhHNWNiaUFnTHk4Z1FYQndiSGtnWm1sc2RHVnlhVzVuWEc0Z0lHWnZjaUFvZG1GeUlHazlNRHNnYVNBOElIUm9hWE11Wm5KaGJXVnpMbXhsYm1kMGFEc2dhU3NyS1NCN1hHNGdJQ0FnYVc1amJIVmtaU0E5SUhSeWRXVTdYRzRnSUNBZ2FXWWdLSFJvYVhNdVpuSmhiV1Z6VzJsZEtTQjdYRzRnSUNBZ0lDQm1iM0lnS0haaGNpQnFQVEE3SUdsdVkyeDFaR1VnSmlZZ2FpQThJR1Y0WTJ4MVpHVnpMbXhsYm1kMGFEc2dhaXNyS1NCN1hHNGdJQ0FnSUNBZ0lHbHVZMngxWkdVZ0pqMGdJV1Y0WTJ4MVpHVnpXMnBkTG1OaGJHd29kR2hwY3l3Z2RHaHBjeTVtY21GdFpYTmJhVjBwTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ0lDQnBaaUFvYVc1amJIVmtaU2tnZTF4dUlDQWdJQ0FnWm5KaGJXVnpMbkIxYzJnb2RHaHBjeTVtY21GdFpYTmJhVjBwTzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUM4dklFaHZibTl5SUdGdWVTQndjbVYyYVc5MWMyeDVJR1JsWm1sdVpXUWdjM1JoWTJ0MGNtRmpaU0JtYjNKdFlYUjBaWElnWW5sY2JpQWdMeThnWVd4c2IzZHBibWNnYVhRZ1ptbHVZV3hzZVNCbWIzSnRZWFFnZEdobElHWnlZVzFsY3k0Z1ZHaHBjeUJwY3lCdVpXVmtaV1JjYmlBZ0x5OGdkMmhsYmlCMWMybHVaeUJ1YjJSbExYTnZkWEpqWlMxdFlYQXRjM1Z3Y0c5eWRDQm1iM0lnYVc1emRHRnVZMlV1WEc0Z0lDOHZJRlJQUkU4NklFTmhiaUIzWlNCdFlYQWdkR2hsSUZ3aWJuVnNiRndpSUdaeVlXMWxjeUIwYnlCaElFTmhiR3hHY21GdFpTQnphR2x0UDF4dUlDQnBaaUFvYjJ4a1VISmxjR0Z5WlZOMFlXTnJWSEpoWTJVcElIdGNiaUFnSUNCbWNtRnRaWE1nUFNCbWNtRnRaWE11Wm1sc2RHVnlLR1oxYm1OMGFXOXVJQ2g0S1NCN0lISmxkSFZ5YmlBaElYZzdJSDBwTzF4dUlDQWdJSEpsZEhWeWJpQnZiR1JRY21Wd1lYSmxVM1JoWTJ0VWNtRmpaUzVqWVd4c0tFVnljbTl5TENCMGFHbHpMQ0JtY21GdFpYTXBPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJSFJvYVhNdWNISmxjR0Z5WlZOMFlXTnJWSEpoWTJVb1puSmhiV1Z6S1R0Y2JuMDdYRzVjYm5CeWIzUnZMbkJ5WlhCaGNtVlRkR0ZqYTFSeVlXTmxJRDBnWm5WdVkzUnBiMjRnS0daeVlXMWxjeWtnZTF4dUlDQjJZWElnYkdsdVpYTWdQU0JiZEdocGMxMDdYRzRnSUdadmNpQW9kbUZ5SUdrOU1Ec2dhU0E4SUdaeVlXMWxjeTVzWlc1bmRHZzdJR2tyS3lrZ2UxeHVJQ0FnSUd4cGJtVnpMbkIxYzJnb1hHNGdJQ0FnSUNCbWNtRnRaWE5iYVYwZ1B5QkdZV2xzZFhKbExrWlNRVTFGWDFCU1JVWkpXQ0FySUdaeVlXMWxjMXRwWFNBNklFWmhhV3gxY21VdVJsSkJUVVZmUlUxUVZGbGNiaUFnSUNBcE8xeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCc2FXNWxjeTVxYjJsdUtDZGNYRzRuS1R0Y2JuMDdYRzVjYmx4dWJXOWtkV3hsTG1WNGNHOXlkSE1nUFNCR1lXbHNkWEpsTzF4dUlsMTkiLCJ2YXIgRmFpbHVyZSA9IHJlcXVpcmUoJy4vbGliL2ZhaWx1cmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGYWlsdXJlO1xuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcywgUmhpbm8sIGFuZCBicm93c2Vycy5cblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoJ2Vycm9yLXN0YWNrLXBhcnNlcicsIFsnc3RhY2tmcmFtZSddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnc3RhY2tmcmFtZScpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LkVycm9yU3RhY2tQYXJzZXIgPSBmYWN0b3J5KHJvb3QuU3RhY2tGcmFtZSk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyKFN0YWNrRnJhbWUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQID0gLyhefEApXFxTK1xcOlxcZCsvO1xuICAgIHZhciBDSFJPTUVfSUVfU1RBQ0tfUkVHRVhQID0gL1xccythdCAuKihcXFMrXFw6XFxkK3xcXChuYXRpdmVcXCkpLztcblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHaXZlbiBhbiBFcnJvciBvYmplY3QsIGV4dHJhY3QgdGhlIG1vc3QgaW5mb3JtYXRpb24gZnJvbSBpdC5cbiAgICAgICAgICogQHBhcmFtIGVycm9yIHtFcnJvcn1cbiAgICAgICAgICogQHJldHVybiBBcnJheVtTdGFja0ZyYW1lXVxuICAgICAgICAgKi9cbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVycm9yLnN0YWNrdHJhY2UgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBlcnJvclsnb3BlcmEjc291cmNlbG9jJ10gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYShlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yLnN0YWNrICYmIGVycm9yLnN0YWNrLm1hdGNoKENIUk9NRV9JRV9TVEFDS19SRUdFWFApKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VWOE9ySUUoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5zdGFjayAmJiBlcnJvci5zdGFjay5tYXRjaChGSVJFRk9YX1NBRkFSSV9TVEFDS19SRUdFWFApKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VGRk9yU2FmYXJpKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcGFyc2UgZ2l2ZW4gRXJyb3Igb2JqZWN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlcGFyYXRlIGxpbmUgYW5kIGNvbHVtbiBudW1iZXJzIGZyb20gYSBVUkwtbGlrZSBzdHJpbmcuXG4gICAgICAgICAqIEBwYXJhbSB1cmxMaWtlIFN0cmluZ1xuICAgICAgICAgKiBAcmV0dXJuIEFycmF5W1N0cmluZ11cbiAgICAgICAgICovXG4gICAgICAgIGV4dHJhY3RMb2NhdGlvbjogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkZXh0cmFjdExvY2F0aW9uKHVybExpa2UpIHtcbiAgICAgICAgICAgIC8vIEZhaWwtZmFzdCBidXQgcmV0dXJuIGxvY2F0aW9ucyBsaWtlIFwiKG5hdGl2ZSlcIlxuICAgICAgICAgICAgaWYgKHVybExpa2UuaW5kZXhPZignOicpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbdXJsTGlrZV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBsb2NhdGlvblBhcnRzID0gdXJsTGlrZS5yZXBsYWNlKC9bXFwoXFwpXFxzXS9nLCAnJykuc3BsaXQoJzonKTtcbiAgICAgICAgICAgIHZhciBsYXN0TnVtYmVyID0gbG9jYXRpb25QYXJ0cy5wb3AoKTtcbiAgICAgICAgICAgIHZhciBwb3NzaWJsZU51bWJlciA9IGxvY2F0aW9uUGFydHNbbG9jYXRpb25QYXJ0cy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICghaXNOYU4ocGFyc2VGbG9hdChwb3NzaWJsZU51bWJlcikpICYmIGlzRmluaXRlKHBvc3NpYmxlTnVtYmVyKSkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lTnVtYmVyID0gbG9jYXRpb25QYXJ0cy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2xvY2F0aW9uUGFydHMuam9pbignOicpLCBsaW5lTnVtYmVyLCBsYXN0TnVtYmVyXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsb2NhdGlvblBhcnRzLmpvaW4oJzonKSwgbGFzdE51bWJlciwgdW5kZWZpbmVkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZVY4T3JJRTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VWOE9ySUUoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci5zdGFjay5zcGxpdCgnXFxuJykuZmlsdGVyKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhbGluZS5tYXRjaChDSFJPTUVfSUVfU1RBQ0tfUkVHRVhQKTtcbiAgICAgICAgICAgIH0sIHRoaXMpLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBsaW5lLnJlcGxhY2UoL15cXHMrLywgJycpLnNwbGl0KC9cXHMrLykuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSAoIXRva2Vuc1swXSB8fCB0b2tlbnNbMF0gPT09ICdBbm9ueW1vdXMnKSA/IHVuZGVmaW5lZCA6IHRva2Vuc1swXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN0YWNrRnJhbWUoZnVuY3Rpb25OYW1lLCB1bmRlZmluZWQsIGxvY2F0aW9uUGFydHNbMF0sIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0sIGxpbmUpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VGRk9yU2FmYXJpOiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZUZGT3JTYWZhcmkoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvci5zdGFjay5zcGxpdCgnXFxuJykuZmlsdGVyKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhbGluZS5tYXRjaChGSVJFRk9YX1NBRkFSSV9TVEFDS19SRUdFWFApO1xuICAgICAgICAgICAgfSwgdGhpcykubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VucyA9IGxpbmUuc3BsaXQoJ0AnKTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb25QYXJ0cyA9IHRoaXMuZXh0cmFjdExvY2F0aW9uKHRva2Vucy5wb3AoKSk7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uTmFtZSA9IHRva2Vucy5zaGlmdCgpIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN0YWNrRnJhbWUoZnVuY3Rpb25OYW1lLCB1bmRlZmluZWQsIGxvY2F0aW9uUGFydHNbMF0sIGxvY2F0aW9uUGFydHNbMV0sIGxvY2F0aW9uUGFydHNbMl0sIGxpbmUpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VPcGVyYTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYShlKSB7XG4gICAgICAgICAgICBpZiAoIWUuc3RhY2t0cmFjZSB8fCAoZS5tZXNzYWdlLmluZGV4T2YoJ1xcbicpID4gLTEgJiZcbiAgICAgICAgICAgICAgICBlLm1lc3NhZ2Uuc3BsaXQoJ1xcbicpLmxlbmd0aCA+IGUuc3RhY2t0cmFjZS5zcGxpdCgnXFxuJykubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmE5KGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghZS5zdGFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT3BlcmExMChlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPcGVyYTExKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlT3BlcmE5OiBmdW5jdGlvbiBFcnJvclN0YWNrUGFyc2VyJCRwYXJzZU9wZXJhOShlKSB7XG4gICAgICAgICAgICB2YXIgbGluZVJFID0gL0xpbmUgKFxcZCspLipzY3JpcHQgKD86aW4gKT8oXFxTKykvaTtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IGUubWVzc2FnZS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAyLCBsZW4gPSBsaW5lcy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMikge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IGxpbmVSRS5leGVjKGxpbmVzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFN0YWNrRnJhbWUodW5kZWZpbmVkLCB1bmRlZmluZWQsIG1hdGNoWzJdLCBtYXRjaFsxXSwgdW5kZWZpbmVkLCBsaW5lc1tpXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZU9wZXJhMTA6IGZ1bmN0aW9uIEVycm9yU3RhY2tQYXJzZXIkJHBhcnNlT3BlcmExMChlKSB7XG4gICAgICAgICAgICB2YXIgbGluZVJFID0gL0xpbmUgKFxcZCspLipzY3JpcHQgKD86aW4gKT8oXFxTKykoPzo6IEluIGZ1bmN0aW9uIChcXFMrKSk/JC9pO1xuICAgICAgICAgICAgdmFyIGxpbmVzID0gZS5zdGFja3RyYWNlLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxpbmVzLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbGluZVJFLmV4ZWMobGluZXNbaV0pO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgU3RhY2tGcmFtZShtYXRjaFszXSB8fCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgbWF0Y2hbMl0sIG1hdGNoWzFdLCB1bmRlZmluZWQsIGxpbmVzW2ldKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIE9wZXJhIDEwLjY1KyBFcnJvci5zdGFjayB2ZXJ5IHNpbWlsYXIgdG8gRkYvU2FmYXJpXG4gICAgICAgIHBhcnNlT3BlcmExMTogZnVuY3Rpb24gRXJyb3JTdGFja1BhcnNlciQkcGFyc2VPcGVyYTExKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3Iuc3RhY2suc3BsaXQoJ1xcbicpLmZpbHRlcihmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIWxpbmUubWF0Y2goRklSRUZPWF9TQUZBUklfU1RBQ0tfUkVHRVhQKSAmJlxuICAgICAgICAgICAgICAgICAgICAhbGluZS5tYXRjaCgvXkVycm9yIGNyZWF0ZWQgYXQvKTtcbiAgICAgICAgICAgIH0sIHRoaXMpLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBsaW5lLnNwbGl0KCdAJyk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uUGFydHMgPSB0aGlzLmV4dHJhY3RMb2NhdGlvbih0b2tlbnMucG9wKCkpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbkNhbGwgPSAodG9rZW5zLnNoaWZ0KCkgfHwgJycpO1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSBmdW5jdGlvbkNhbGxcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC88YW5vbnltb3VzIGZ1bmN0aW9uKDogKFxcdyspKT8+LywgJyQyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXChbXlxcKV0qXFwpL2csICcnKSB8fCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3NSYXc7XG4gICAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uQ2FsbC5tYXRjaCgvXFwoKFteXFwpXSopXFwpLykpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1JhdyA9IGZ1bmN0aW9uQ2FsbC5yZXBsYWNlKC9eW15cXChdK1xcKChbXlxcKV0qKVxcKSQvLCAnJDEnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSAoYXJnc1JhdyA9PT0gdW5kZWZpbmVkIHx8IGFyZ3NSYXcgPT09ICdbYXJndW1lbnRzIG5vdCBhdmFpbGFibGVdJykgPyB1bmRlZmluZWQgOiBhcmdzUmF3LnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgYXJncywgbG9jYXRpb25QYXJ0c1swXSwgbG9jYXRpb25QYXJ0c1sxXSwgbG9jYXRpb25QYXJ0c1syXSwgbGluZSk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH07XG59KSk7XG5cbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICAvLyBVbml2ZXJzYWwgTW9kdWxlIERlZmluaXRpb24gKFVNRCkgdG8gc3VwcG9ydCBBTUQsIENvbW1vbkpTL05vZGUuanMsIFJoaW5vLCBhbmQgYnJvd3NlcnMuXG5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKCdzdGFja2ZyYW1lJywgW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QuU3RhY2tGcmFtZSA9IGZhY3RvcnkoKTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgZnVuY3Rpb24gX2lzTnVtYmVyKG4pIHtcbiAgICAgICAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBTdGFja0ZyYW1lKGZ1bmN0aW9uTmFtZSwgYXJncywgZmlsZU5hbWUsIGxpbmVOdW1iZXIsIGNvbHVtbk51bWJlciwgc291cmNlKSB7XG4gICAgICAgIGlmIChmdW5jdGlvbk5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRGdW5jdGlvbk5hbWUoZnVuY3Rpb25OYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEFyZ3MoYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbGVOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RmlsZU5hbWUoZmlsZU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaW5lTnVtYmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TGluZU51bWJlcihsaW5lTnVtYmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sdW1uTnVtYmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0Q29sdW1uTnVtYmVyKGNvbHVtbk51bWJlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNvdXJjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldFNvdXJjZShzb3VyY2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgU3RhY2tGcmFtZS5wcm90b3R5cGUgPSB7XG4gICAgICAgIGdldEZ1bmN0aW9uTmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnVuY3Rpb25OYW1lO1xuICAgICAgICB9LFxuICAgICAgICBzZXRGdW5jdGlvbk5hbWU6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB0aGlzLmZ1bmN0aW9uTmFtZSA9IFN0cmluZyh2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRBcmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcmdzO1xuICAgICAgICB9LFxuICAgICAgICBzZXRBcmdzOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2KSAhPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3MgbXVzdCBiZSBhbiBBcnJheScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hcmdzID0gdjtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBOT1RFOiBQcm9wZXJ0eSBuYW1lIG1heSBiZSBtaXNsZWFkaW5nIGFzIGl0IGluY2x1ZGVzIHRoZSBwYXRoLFxuICAgICAgICAvLyBidXQgaXQgc29tZXdoYXQgbWlycm9ycyBWOCdzIEphdmFTY3JpcHRTdGFja1RyYWNlQXBpXG4gICAgICAgIC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3Avdjgvd2lraS9KYXZhU2NyaXB0U3RhY2tUcmFjZUFwaSBhbmQgR2Vja28nc1xuICAgICAgICAvLyBodHRwOi8vbXhyLm1vemlsbGEub3JnL21vemlsbGEtY2VudHJhbC9zb3VyY2UveHBjb20vYmFzZS9uc0lFeGNlcHRpb24uaWRsIzE0XG4gICAgICAgIGdldEZpbGVOYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWxlTmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0RmlsZU5hbWU6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVOYW1lID0gU3RyaW5nKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldExpbmVOdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpbmVOdW1iZXI7XG4gICAgICAgIH0sXG4gICAgICAgIHNldExpbmVOdW1iZXI6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAoIV9pc051bWJlcih2KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0xpbmUgTnVtYmVyIG11c3QgYmUgYSBOdW1iZXInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubGluZU51bWJlciA9IE51bWJlcih2KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDb2x1bW5OdW1iZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbHVtbk51bWJlcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0Q29sdW1uTnVtYmVyOiBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgaWYgKCFfaXNOdW1iZXIodikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb2x1bW4gTnVtYmVyIG11c3QgYmUgYSBOdW1iZXInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY29sdW1uTnVtYmVyID0gTnVtYmVyKHYpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFNvdXJjZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc291cmNlO1xuICAgICAgICB9LFxuICAgICAgICBzZXRTb3VyY2U6IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZSA9IFN0cmluZyh2KTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gdGhpcy5nZXRGdW5jdGlvbk5hbWUoKSB8fCAne2Fub255bW91c30nO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSAnKCcgKyAodGhpcy5nZXRBcmdzKCkgfHwgW10pLmpvaW4oJywnKSArICcpJztcbiAgICAgICAgICAgIHZhciBmaWxlTmFtZSA9IHRoaXMuZ2V0RmlsZU5hbWUoKSA/ICgnQCcgKyB0aGlzLmdldEZpbGVOYW1lKCkpIDogJyc7XG4gICAgICAgICAgICB2YXIgbGluZU51bWJlciA9IF9pc051bWJlcih0aGlzLmdldExpbmVOdW1iZXIoKSkgPyAoJzonICsgdGhpcy5nZXRMaW5lTnVtYmVyKCkpIDogJyc7XG4gICAgICAgICAgICB2YXIgY29sdW1uTnVtYmVyID0gX2lzTnVtYmVyKHRoaXMuZ2V0Q29sdW1uTnVtYmVyKCkpID8gKCc6JyArIHRoaXMuZ2V0Q29sdW1uTnVtYmVyKCkpIDogJyc7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb25OYW1lICsgYXJncyArIGZpbGVOYW1lICsgbGluZU51bWJlciArIGNvbHVtbk51bWJlcjtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gU3RhY2tGcmFtZTtcbn0pKTtcbiJdfQ==
