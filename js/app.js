'use strict';
// ============================================================
// APP — bootstrap / entry point
// Depends on: all modules
// ============================================================
var App = {
  init: function() {
    Debug.info('App.init() v1.2');
    var today = new Date();

    // Default investments month to latest with data
    var latestMonth = Investments._latestMonth();
    var inv = document.getElementById('inv-month');
    if (inv) inv.value = latestMonth || today.toISOString().slice(0, 7);

    // Load market data from cache for instant render
    var mkt = Store.get(SK.cMarket, {});
    if (mkt.usd) { MarketData.usd = mkt.usd; MarketData.uf = mkt.uf; MarketData.btc = mkt.btc; MarketData._render(); }

    // Render default active view
    Investments.renderAll();

    // Fetch live market data async
    MarketData.fetch();
    Debug.info('App.init() done');
  }
};

// Global error handlers
window.onerror = function(msg, src, line, col, err) { Debug.err('GLOBAL: ' + msg + ' (line ' + line + ')'); return false; };
window.onunhandledrejection = function(e) { Debug.err('PROMISE: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason))); };

App.init();
