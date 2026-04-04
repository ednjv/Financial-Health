'use strict';
// ============================================================
// STORAGE KEYS
// ============================================================
var SK = {
  config:      'sfv1:config',
  invest:      'sfv1:investments',
  properties:  'sfv1:properties',
  rents:       'sfv1:rents',
  m2:          'sfv1:m2',
  cMarket:     'sfv1:cache:market',
  budgetStats: 'sfv1:budgetStats',
  emergency:   'sfv1:emergency',
  pension:     'sfv1:pension'
};

// ============================================================
// STORE — localStorage wrapper with sfv1: namespace
// ============================================================
var Store = {
  get: function(k, d) {
    try {
      var v = localStorage.getItem(k);
      return v ? JSON.parse(v) : (d !== undefined ? d : null);
    } catch(e) {
      return d !== undefined ? d : null;
    }
  },
  set: function(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch(e) {
      Debug.err('Store ' + k + ': ' + e.message);
    }
  },
  del:  function(k) { localStorage.removeItem(k); },
  size: function() {
    var t = 0;
    for (var k in localStorage) {
      if (k.indexOf('sfv1:') === 0) t += (localStorage[k] || '').length * 2;
    }
    return (t / 1024).toFixed(1) + ' KB';
  },
  keys: function() {
    var r = [];
    for (var k in localStorage) {
      if (k.indexOf('sfv1:') === 0) r.push(k);
    }
    return r;
  }
};
