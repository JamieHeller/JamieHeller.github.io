// How to use keybindings:
// d3.select('body').onKey('left', function(d,i) {debugger;})
(function() {
  "use strict";
  d3.selection.prototype.onKey = function(keyString, cb) {
    var keybinding = d3.keybinding.apply(this);
    return this.call(keybinding.on(keyString, cb));
  };
})();

/*
 * This code is licensed under the MIT license.
 *
 * Copyright © 2013, iD authors.
 *
 * Portions copyright © 2011, Keith Cirkel
 * See https://github.com/keithamus/jwerty
 *
 */
d3.keybinding = function(namespace) {
  "use strict";
  this.bindings = this.bindings || [];
  var bindings = this.bindings;

  function matches(binding, event) {
    for (var p in binding.event) {
      if (event[p] != binding.event[p])
        {return false}
    }

    return ( (! binding.capture) === (event.eventPhase !== Event.CAPTURING_PHASE) );
  }

  function capture() {
    for (var i = 0; i < bindings.length; i++) {
      var binding = bindings[i];
      if (matches(binding, d3.event)) {
        binding.callback();
      }
    }
  }

  function bubble() {
    var tagName = d3.select(d3.event.target).node().tagName;
    if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
      return;
    }
    capture();
  }

  function keybinding(selection) {
    selection = selection || d3.select(document);
    selection.on('keydown.capture' + namespace, capture, true);
    selection.on('keydown.bubble' + namespace, bubble, false);
    return keybinding;
  }

  keybinding.off = function(selection) {
    selection = selection || d3.select(document);
    selection.on('keydown.capture' + namespace, null);
    selection.on('keydown.bubble' + namespace, null);
    return keybinding;
  };

  keybinding.on = function(code, callback, capture) {
    var codes = code.toLowerCase().split('/');

    codes.forEach(function(code) {
      var binding = {
        event: {
          keyCode: 0,
          shiftKey: false,
          ctrlKey: false,
          altKey: false,
          metaKey: false
        },
        capture: capture,
        callback: callback
      };

      code = code.match(/(?:(?:[^+])+|\+\+|^\+$)/g);

      for (var i = 0; i < code.length; i++) {
        // Normalise matching errors
        if (code[i] === '++') {code[i] = '+'}

        if (code[i] in d3.keybinding.modifierCodes) {
          binding.event[d3.keybinding.modifierProperties[d3.keybinding.modifierCodes[code[i]]]] = true;
        } else if (code[i] in d3.keybinding.keyCodes) {
          binding.event.keyCode = d3.keybinding.keyCodes[code[i]];
        }
      }

      bindings.push(binding);
    });

    return keybinding;
  };

  return keybinding;
};

(function () {
  "use strict";

  d3.keybinding.modifierCodes = {
    shift: 16,
    ctrl: 17,
    alt: 18, option: 18,
    meta: 91, cmd: 91, 'super': 91, win: 91
  };

  d3.keybinding.modifierProperties = {
    16: 'shiftKey',
    17: 'ctrlKey',
    18: 'altKey',
    91: 'metaKey'
  };

  d3.keybinding.keyCodes = {
    backspace: 8,
    tab: 9,
    'return': 13, enter: 13,
    'pause': 19, 'pause-break': 19,
    caps: 20, 'caps-lock': 20,
    esc: 27, escape: 27, 
    space: 32,
    pgup: 33, 'page-up': 33,
    pgdown: 34, 'page-down': 34,
    end: 35,
    home: 36,
    ins: 45, insert: 45,
    del: 46, 'delete': 46,
    left: 37, 'arrow-left': 37,
    up: 38, 'arrow-up': 38,
    right: 39, 'arrow-right': 39,
    down: 40, 'arrow-down': 40,
    '*': 106, star: 106, asterisk: 106, multiply: 106,
    '+': 107, 'plus': 107,
    '-': 109, minus: 109, subtract: 109,
    ';': 186, semicolon:186,
    '=': 187, 'equals': 187,
    ',': 188, comma: 188,
    '.': 190, period: 190, 'full-stop': 190,
    '/': 191, slash: 191, 'forward-slash': 191,
    '`': 192, tick: 192, 'back-quote': 192,
    '[': 219, 'open-bracket': 219,
    '\\': 220, 'back-slash': 220,
    ']': 221, 'close-bracket': 221,
    '\'': 222, quote: 222, apostrophe: 222
  };

  // NUMPAD 0-9
  var i = 95, n = 0;
  while (++i < 106) {
    d3.keybinding.keyCodes['num-' + n] = i;
    ++n;
  }

  // 0-9
  i = 47; n = 0;
  while (++i < 58) {
    d3.keybinding.keyCodes[n] = i;
    ++n;
  }

  // F1-F25
  i = 111; n = 1;
  while (++i < 136) {
    d3.keybinding.keyCodes['f' + n] = i;
    ++n;
  }

  // a-z
  i = 64;
  while (++i < 91) {
    d3.keybinding.keyCodes[String.fromCharCode(i).toLowerCase()] = i;
  }
})();

