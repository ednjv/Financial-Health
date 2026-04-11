'use strict';
// ============================================================
// FUND PRICES — live price & 1-day performance fetching
// Sources: CMF Chile (fondos mutuos), Yahoo Finance (ETFs/stocks)
// CORS bypass: allorigins.win proxy → cors-anywhere fallback
// Depends on: Store, SK, Debug, Fmt
// ============================================================
var FundPrices = {
  // ── Runtime config (reads SK.config so values are always current) ──────────
  // Defaults:  ttlShort=15min  ttlLong=240min  stagger=300ms  timeout=12s
  // All four are editable in Settings → Precios de Mercado.
  _cfg: function() {
    var c = Store.get(SK.config, {});
    return {
      ttlShort: (c.fundPricesTtlShort != null ? +c.fundPricesTtlShort : 15)  * 60 * 1000,
      ttlLong:  (c.fundPricesTtlLong  != null ? +c.fundPricesTtlLong  : 240) * 60 * 1000,
      stagger:  (c.fundPricesStagger  != null ? +c.fundPricesStagger  : 300),
      timeout:  (c.fundPricesTimeout  != null ? +c.fundPricesTimeout  : 12)  * 1000
    };
  },

  // ── Cache helpers ──────────────────────────────────────────
  _getCache: function() { return Store.get(SK.cFundPrices, {}); },
  _setCache: function(d) { Store.set(SK.cFundPrices, d); },

  _ttlFor: function(source) {
    var cfg = this._cfg();
    return source === 'cmf_chile' ? cfg.ttlLong : cfg.ttlShort;
  },

  _isFresh: function(entry) {
    if (!entry || !entry.last_updated) return false;
    return (Date.now() - new Date(entry.last_updated).getTime()) < this._ttlFor(entry.source);
  },

  // ── CORS proxy fetch ───────────────────────────────────────
  // Primary:  allorigins.win wraps response in { contents: "<json_string>" }
  // Fallback: cors-anywhere passes response through directly
  _proxyFetch: async function(url) {
    var ms = this._cfg().timeout;
    Debug.req('FundPrices → ' + url.slice(0, 70) + '… (timeout ' + (ms / 1000) + 's)');
    try {
      var r = await fetch(
        'https://api.allorigins.win/get?url=' + encodeURIComponent(url),
        {signal: AbortSignal.timeout(ms)}
      );
      if (!r.ok) throw new Error('allorigins HTTP ' + r.status);
      var wrapper = await r.json();
      if (!wrapper || !wrapper.contents) throw new Error('allorigins: empty contents');
      var parsed = JSON.parse(wrapper.contents);
      Debug.res('allorigins OK');
      return parsed;
    } catch(e1) {
      Debug.warn('allorigins failed (' + e1.message + '), trying cors-anywhere');
      var r2 = await fetch(
        'https://cors-anywhere.herokuapp.com/' + url,
        {signal: AbortSignal.timeout(ms)}
      );
      if (!r2.ok) throw new Error('cors-anywhere HTTP ' + r2.status);
      return await r2.json();
    }
  },

  // ── Source: CMF Chile ──────────────────────────────────────
  // Endpoint: /fondos-mutuos/{run}/series/valores-cuota
  // Response: array of { fecha, valor_cuota } — Chilean decimal (comma)
  _fetchCmf: async function(runCmf) {
    var url = 'https://api.cmfchile.cl/api-sbifv3/recursos/fondos-mutuos/' +
              runCmf + '/series/valores-cuota';
    var raw = await this._proxyFetch(url);

    // Normalize: response may be a bare array or wrapped { valores_cuota: [...] }
    var rows = Array.isArray(raw)
      ? raw
      : (Array.isArray(raw.valores_cuota) ? raw.valores_cuota
        : (Array.isArray(raw.data) ? raw.data : null));
    if (!rows || !rows.length) throw new Error('CMF: no rows for RUN ' + runCmf);

    // Sort descending by fecha (handles both DD/MM/YYYY and YYYY-MM-DD)
    rows = rows.slice().sort(function(a, b) {
      return String(a.fecha) < String(b.fecha) ? 1 : -1;
    });

    // Chilean decimal: "1.234,56" → strip thousands dot → replace comma → float
    var parse = function(v) {
      return parseFloat(String(v).replace(/\./g, '').replace(',', '.'));
    };

    var latest = rows[0];
    var prev   = rows[1];
    var price  = parse(latest.valor_cuota);
    var change1d = null, change1d_pct = null;
    if (prev) {
      var prevPrice = parse(prev.valor_cuota);
      if (prevPrice) {
        change1d     = price - prevPrice;
        change1d_pct = change1d / prevPrice * 100;
      }
    }
    Debug.res('CMF RUN ' + runCmf + ' → ' + price + ' CLP (rows:' + rows.length + ')');
    return {
      price: price, currency: 'CLP',
      change1d: change1d, change1d_pct: change1d_pct,
      last_updated: new Date().toISOString(), source: 'cmf_chile'
    };
  },

  // ── Source: Yahoo Finance ──────────────────────────────────
  // Endpoint: /v8/finance/chart/{ticker}?interval=1d&range=5d
  // Extracts regularMarketPrice + 1-day return from close series
  _fetchYahoo: async function(ticker) {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
              ticker + '?interval=1d&range=5d';
    var raw = await this._proxyFetch(url);

    var result = raw.chart && raw.chart.result && raw.chart.result[0];
    if (!result) throw new Error('Yahoo: no result for ' + ticker);

    var meta     = result.meta || {};
    var price    = meta.regularMarketPrice;
    var currency = meta.currency || 'USD';

    // Build change from close series (last two non-null values)
    var closes  = (result.indicators &&
                   result.indicators.quote &&
                   result.indicators.quote[0] &&
                   result.indicators.quote[0].close) || [];
    var valid   = closes.filter(function(c) { return c != null; });
    var change1d = null, change1d_pct = null;
    if (valid.length >= 2) {
      var last = valid[valid.length - 1];
      var prev = valid[valid.length - 2];
      if (prev) { change1d = last - prev; change1d_pct = change1d / prev * 100; }
    }
    Debug.res('Yahoo ' + ticker + ' → ' + price + ' ' + currency);
    return {
      price: price, currency: currency,
      change1d: change1d, change1d_pct: change1d_pct,
      last_updated: new Date().toISOString(), source: 'yahoo_finance'
    };
  },

  // ── Public API ─────────────────────────────────────────────

  // Fetch live price for a single fund.
  // Returns MarketData object or null if unavailable.
  // { price, currency, change1d, change1d_pct, last_updated (ISO), source }
  fetchFundPrice: async function(fund) {
    if (!fund || !fund.price_source || fund.price_source === 'none' ||
        fund.price_source === 'manual') return null;

    var cache = this._getCache();
    var entry = cache[fund.id];
    if (this._isFresh(entry)) {
      Debug.info('FundPrices cache hit: ' + fund.name);
      return entry;
    }

    var result = null;
    try {
      if (fund.price_source === 'cmf_chile' && fund.run_cmf) {
        result = await this._fetchCmf(fund.run_cmf);
      } else if (fund.price_source === 'yahoo_finance' && fund.ticker) {
        result = await this._fetchYahoo(fund.ticker);
      } else if (fund.price_source === 'alpha_vantage' && fund.ticker) {
        // Alpha Vantage requires API key; fall back to Yahoo for public use
        result = await this._fetchYahoo(fund.ticker);
      } else if (fund.price_source === 'morningstar') {
        // No free public API — use Yahoo if ticker available
        if (fund.ticker) result = await this._fetchYahoo(fund.ticker);
        else throw new Error('morningstar: no free public API, add a ticker to use Yahoo fallback');
      }

      if (result) {
        cache[fund.id] = result;
        this._setCache(cache);
        return result;
      }
    } catch(e) {
      Debug.err('FundPrices(' + fund.name + '): ' + e.message);
      // Return stale cache entry on error so UI stays populated
      if (entry) {
        Debug.warn('FundPrices: serving stale cache for ' + fund.name);
        return entry;
      }
    }
    return null;
  },

  // Fetch all eligible funds in parallel (staggered starts to respect rate limit).
  // onEach(fundId, result) called as each resolves — use for progressive rendering.
  // Uses Promise.allSettled so one failure does not cancel others.
  fetchAll: async function(funds, onEach) {
    var self = this;
    var stagger = this._cfg().stagger; // read config once for the whole batch
    var eligible = funds.filter(function(f) {
      return f.price_source && f.price_source !== 'none' && f.price_source !== 'manual';
    });
    if (!eligible.length) return {};

    var promises = eligible.map(function(fund, i) {
      // Stagger: fund i starts after i × stagger ms
      return new Promise(function(resolve) { setTimeout(resolve, i * stagger); })
        .then(function() { return self.fetchFundPrice(fund); })
        .then(function(r) { if (onEach) onEach(fund.id, r); return r; });
    });

    var settled = await Promise.allSettled(promises);
    var results = {};
    settled.forEach(function(r, i) {
      results[eligible[i].id] = r.status === 'fulfilled' ? r.value : null;
    });
    return results;
  },

  // Expose cache for rendering without fetch
  getCache: function() { return this._getCache(); }
};
