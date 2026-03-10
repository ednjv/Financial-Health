'use strict';
// ============================================================
// APP — bootstrap / entry point
// Depends on: all modules
// ============================================================
var App = {
  init: function() {
    I18n.applyAll();
    Debug.info('App.init() v1.2 [' + I18n.locale + ']');
    var today = new Date();

    // Attach custom month pickers (before setting values so interceptor is ready)
    ['inv-month', 'sn-month', 'rn-month', 'm2-month'].forEach(function(id) {
      MonthPicker.attach(id);
    });

    // Default investments month to latest with data
    var latestMonth = Investments._latestMonth();
    var inv = document.getElementById('inv-month');
    if (inv) inv.value = latestMonth || today.toISOString().slice(0, 7);

    // Load market data from cache for instant render
    var mkt = Store.get(SK.cMarket, {});
    if (mkt.usd) {
      MarketData.usd = mkt.usd; MarketData.uf = mkt.uf;
      MarketData.btc = mkt.btc; MarketData.eur = mkt.eur;
      if (mkt.rates) MarketData._rates = mkt.rates;
      MarketData._render();
    }

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
