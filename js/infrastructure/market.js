'use strict';
// ============================================================
// MARKET DATA — mindicador.cl + exchangerate-api + CoinGecko
// Depends on: Store, SK, Debug, Fmt
// ============================================================
var MarketData = {
  usd: null, uf: null, btc: null, eur: null,
  _rates: {},   // CLP per 1 unit of each currency

  _MINDICADOR_URL_DEFAULT:   'https://mindicador.cl/api',
  _EXCHANGERATE_URL_DEFAULT: 'https://api.exchangerate-api.com/v4/latest/USD',
  _COINGECKO_URL_DEFAULT:    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=clp',

  _cfg: function() {
    var c = Store.get(SK.config, {});
    return {
      timeout:              (c.marketTimeout != null ? +c.marketTimeout : 8) * 1000,
      mindicadorUrl:        c.marketMindicadorUrl    || this._MINDICADOR_URL_DEFAULT,
      exchangeRateUrl:      c.marketExchangeRateUrl  || this._EXCHANGERATE_URL_DEFAULT,
      coinGeckoUrl:         c.marketCoinGeckoUrl     || this._COINGECKO_URL_DEFAULT,
      mindicadorEnabled:    c.marketMindicadorEnabled    !== false,
      exchangeRateEnabled:  c.marketExchangeRateEnabled  !== false,
      coinGeckoEnabled:     c.marketCoinGeckoEnabled     !== false
    };
  },

  fetch: async function() {
    var cfg = this._cfg();

    // ── 1. mindicador.cl — USD, EUR, UF ──
    if (cfg.mindicadorEnabled) {
      Debug.req('MarketData: mindicador.cl');
      try {
        var r = await fetch(cfg.mindicadorUrl, {signal: AbortSignal.timeout(cfg.timeout)});
        var d = await r.json();
        this.usd = d.dolar && d.dolar.valor;
        this.uf  = d.uf  && d.uf.valor;
        this.eur = d.euro && d.euro.valor;
        Debug.res('mindicador OK — USD=' + this.usd + ' UF=' + this.uf + ' EUR=' + this.eur);
      } catch(e) { Debug.err('mindicador: ' + e.message); }
    } else { Debug.info('MarketData: mindicador deshabilitado'); }

    // ── 2. exchangerate-api — cross rates relative to USD ──
    // Response: { rates: { EUR: 0.92, JPY: 150, GBP: 0.78, CLP: 950, ... } }
    // CLP per 1 X = (CLP per USD) / (X per USD from api)
    if (cfg.exchangeRateEnabled && this.usd) {
      Debug.req('MarketData: exchangerate-api');
      try {
        var r3 = await fetch(cfg.exchangeRateUrl, {signal: AbortSignal.timeout(cfg.timeout)});
        var d3 = await r3.json();
        if (d3 && d3.rates) {
          var clp = this.usd;
          var er  = d3.rates;
          this._rates = {
            CLP: 1,
            USD: clp,
            EUR: this.eur || (er.EUR ? clp / er.EUR : null),
            JPY: er.JPY ? clp / er.JPY : null,
            GBP: er.GBP ? clp / er.GBP : null,
            AUD: er.AUD ? clp / er.AUD : null,
            CAD: er.CAD ? clp / er.CAD : null,
            CHF: er.CHF ? clp / er.CHF : null,
            CNY: er.CNY ? clp / er.CNY : null,
            BRL: er.BRL ? clp / er.BRL : null
          };
          // Prefer mindicador EUR if available (more accurate for CLP)
          if (this.eur) this._rates.EUR = this.eur;
          Debug.res('Cross rates loaded: ' + CURRENCIES.map(function(c) {
            return c.code + '=' + (MarketData._rates[c.code] ? Math.round(MarketData._rates[c.code]) : '?');
          }).join(' '));
        }
      } catch(e) { Debug.warn('exchangerate-api: ' + e.message); }
    } else if (!cfg.exchangeRateEnabled) { Debug.info('MarketData: exchangerate-api deshabilitado'); }

    // ── 3. CoinGecko — BTC ──
    if (cfg.coinGeckoEnabled) {
      try {
        var r2 = await fetch(cfg.coinGeckoUrl, {signal: AbortSignal.timeout(cfg.timeout)});
        var d2 = await r2.json();
        this.btc = d2 && d2.bitcoin && d2.bitcoin.clp;
      } catch(e) { Debug.warn('CoinGecko: ' + e.message); }
    } else { Debug.info('MarketData: CoinGecko deshabilitado'); }

    // ── Fallback to cache if live fetches failed ──
    var c = Store.get(SK.cMarket, {});
    if (!this.usd  && c.usd)   this.usd  = c.usd;
    if (!this.uf   && c.uf)    this.uf   = c.uf;
    if (!this.btc  && c.btc)   this.btc  = c.btc;
    if (!this.eur  && c.eur)   this.eur  = c.eur;
    if (!Object.keys(this._rates).length && c.rates) this._rates = c.rates;
    // Always ensure CLP=1 and USD matches live data
    this._rates.CLP = 1;
    if (this.usd) this._rates.USD = this.usd;
    if (this.eur) this._rates.EUR = this.eur;

    Store.set(SK.cMarket, {usd:this.usd, uf:this.uf, btc:this.btc, eur:this.eur, rates:this._rates, ts:Date.now()});
    this._render();
  },

  _render: function() {
    var f  = function(v) { return v ? '$' + new Intl.NumberFormat('es-CL', {maximumFractionDigits:0}).format(v) : '--'; };
    var si = function(id, v) { var e = document.getElementById(id); if (e) e.textContent = f(v); };
    si('t-usd', this.usd);
    si('t-eur', this.eur);
    si('t-uf',  this.uf);
    si('t-btc', this.btc);
    var el = document.getElementById('market-time');
    if (el) el.textContent = new Date().toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
  },

  getUSD: function() { return this.usd || (Store.get(SK.cMarket, {}).usd) || 950; },
  getUF:  function() { return this.uf  || (Store.get(SK.cMarket, {}).uf)  || 39800; },

  // Returns CLP per 1 unit of the given currency code.
  // Falls back to cached rates, then to USD rate for unknown currencies.
  getRate: function(currency) {
    if (!currency || currency === 'CLP') return 1;
    if (Object.keys(this._rates).length && this._rates[currency] != null) return this._rates[currency];
    var cached = Store.get(SK.cMarket, {});
    if (cached.rates && cached.rates[currency] != null) return cached.rates[currency];
    // Last resort: USD
    return this.getUSD();
  },

  // Returns the user-configured primary display currency (defaults to CLP).
  getPrimaryCurrency: function() {
    return Store.get(SK.config, {}).primaryCurrency || 'CLP';
  },

  // Convert a CLP amount to the primary currency and format it.
  formatPrimary: function(clpValue) {
    if (clpValue == null) return '--';
    var cur = this.getPrimaryCurrency();
    if (cur === 'CLP') return Fmt.clp(clpValue);
    return Fmt.foreign(clpValue / this.getRate(cur), cur);
  },

  // Like Fmt.short but in the primary currency.
  formatShortPrimary: function(clpValue) {
    if (clpValue == null) return '--';
    var cur = this.getPrimaryCurrency();
    if (cur === 'CLP') return Fmt.short(clpValue);
    var converted = clpValue / this.getRate(cur);
    var sym = cur;
    for (var i = 0; i < CURRENCIES.length; i++) {
      if (CURRENCIES[i].code === cur) { sym = CURRENCIES[i].symbol; break; }
    }
    var a = Math.abs(converted);
    if (a >= 1e9) return sym + (converted / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return sym + (converted / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return sym + (converted / 1e3).toFixed(0) + 'K';
    return sym + Math.round(converted);
  }
};
