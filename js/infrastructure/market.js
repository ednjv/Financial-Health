'use strict';
// ============================================================
// MARKET DATA — mindicador.cl + CoinGecko
// Depends on: Store, SK, Debug, Fmt
// ============================================================
var MarketData = {
  usd: null, uf: null, btc: null,

  fetch: async function() {
    Debug.req('MarketData: mindicador.cl');
    try {
      var r = await fetch('https://mindicador.cl/api', {signal: AbortSignal.timeout(8000)});
      var d = await r.json();
      this.usd = d.dolar && d.dolar.valor;
      this.uf  = d.uf && d.uf.valor;
      Debug.res('mindicador OK — USD=' + this.usd + ' UF=' + this.uf);
    } catch(e) { Debug.err('mindicador: ' + e.message); }

    try {
      var r2 = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=clp', {signal: AbortSignal.timeout(8000)});
      var d2 = await r2.json();
      this.btc = d2 && d2.bitcoin && d2.bitcoin.clp;
    } catch(e) { Debug.warn('CoinGecko: ' + e.message); }

    // Fallback to cache if live fetch failed
    var c = Store.get(SK.cMarket, {});
    if (!this.usd && c.usd) this.usd = c.usd;
    if (!this.uf  && c.uf)  this.uf  = c.uf;
    if (!this.btc && c.btc) this.btc = c.btc;

    Store.set(SK.cMarket, {usd:this.usd, uf:this.uf, btc:this.btc, ts:Date.now()});
    this._render();
  },

  _render: function() {
    var f = function(v) { return v ? '$' + new Intl.NumberFormat('es-CL', {maximumFractionDigits:0}).format(v) : '--'; };
    var si = function(id, v) { var e = document.getElementById(id); if (e) e.textContent = f(v); };
    si('t-usd', this.usd); si('t-uf', this.uf); si('t-btc', this.btc);
    var el = document.getElementById('market-time');
    if (el) el.textContent = new Date().toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
  },

  getUSD: function() { return this.usd || (Store.get(SK.cMarket, {}).usd) || 950; },
  getUF:  function() { return this.uf  || (Store.get(SK.cMarket, {}).uf)  || 39800; }
};
