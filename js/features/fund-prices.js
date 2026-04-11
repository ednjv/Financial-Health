'use strict';
// ============================================================
// FUND PRICES — live price & 1-day performance fetching
// Sources: CMF Chile (fondos mutuos), Yahoo Finance (ETFs/stocks)
// CORS bypass: allorigins.win proxy → cors-anywhere fallback
// Depends on: Store, SK, Debug, Fmt
// ============================================================
var FundPrices = {
  // ── Runtime config (reads SK.config so values are always current) ──────────
  // Defaults and proxy names are editable in Settings → Precios de Mercado.
  _CMF_URL_DEFAULT:    'https://api.cmfchile.cl/api-sbifv3/recursos/fondos-mutuos/{run}/series/valores-cuota',
  _YAHOO_URL_DEFAULT:  'https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=5d',
  _FINTUAL_URL_DEFAULT:'https://fintual.cl/api/real_assets/{id}/days',

  _cfg: function() {
    var c = Store.get(SK.config, {});
    return {
      ttlShort:      (c.fundPricesTtlShort != null ? +c.fundPricesTtlShort : 15)  * 60 * 1000,
      ttlLong:       (c.fundPricesTtlLong  != null ? +c.fundPricesTtlLong  : 240) * 60 * 1000,
      stagger:       (c.fundPricesStagger  != null ? +c.fundPricesStagger  : 300),
      timeout:       (c.fundPricesTimeout  != null ? +c.fundPricesTimeout  : 12)  * 1000,
      proxy1:        c.fundPricesProxy1        || 'corsproxy.io',
      proxy2:        c.fundPricesProxy2        || 'allorigins.win',
      cmfUrl:        c.fundPricesCmfUrl     || this._CMF_URL_DEFAULT,
      yahooUrl:      c.fundPricesYahooUrl   || this._YAHOO_URL_DEFAULT,
      fintualUrl:    c.fundPricesFintualUrl || this._FINTUAL_URL_DEFAULT,
      cmfApiKey:     c.fundPricesCmfApiKey  || '',
      cmfFormat:     c.fundPricesCmfFormat  || 'JSON',
      // Enabled flags — all on by default; turn off to suppress fetching from that source
      cmfEnabled:     c.fundPricesCmfEnabled     !== false,
      yahooEnabled:   c.fundPricesYahooEnabled   !== false,
      fintualEnabled: c.fundPricesFintualEnabled  !== false
    };
  },

  // ── CORS proxy adapters ────────────────────────────────────
  // Each adapter is (url, timeoutMs, headers?) → Promise<parsedJSON>.
  // Response formats differ per proxy; adapters handle that internally.
  // The optional `headers` object is forwarded to the upstream API where supported.
  _PROXIES: {
    // corsproxy.io — passes response through directly; forwards custom headers
    'corsproxy.io': async function(url, ms, headers) {
      var opts = {signal: AbortSignal.timeout(ms)};
      if (headers && Object.keys(headers).length) opts.headers = headers;
      var r = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(url), opts);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    },
    // allorigins.win — wraps response: { contents: "<json_string>", status: {...} }
    // Note: custom headers are not forwarded by this proxy.
    'allorigins.win': async function(url, ms) {
      var r = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(url),
                          {signal: AbortSignal.timeout(ms)});
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var w = await r.json();
      if (!w || !w.contents) throw new Error('empty contents');
      return JSON.parse(w.contents);
    },
    // cors-anywhere — prepends its base URL; forwards custom headers
    'cors-anywhere': async function(url, ms, headers) {
      var opts = {signal: AbortSignal.timeout(ms)};
      if (headers && Object.keys(headers).length) opts.headers = headers;
      var r = await fetch('https://cors-anywhere.herokuapp.com/' + url, opts);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }
  },

  // Returns true if the given price source is enabled in config.
  _isSourceEnabled: function(source) {
    var cfg = this._cfg();
    if (source === 'cmf_chile')    return cfg.cmfEnabled;
    if (source === 'yahoo_finance' || source === 'alpha_vantage' || source === 'morningstar')
                                   return cfg.yahooEnabled;
    if (source === 'fintual')      return cfg.fintualEnabled;
    return true;
  },

  // ── Cache helpers ──────────────────────────────────────────
  _getCache: function() { return Store.get(SK.cFundPrices, {}); },
  _setCache: function(d) { Store.set(SK.cFundPrices, d); },

  _ttlFor: function(source) {
    var cfg = this._cfg();
    // CMF and Fintual publish prices once per day — use long TTL
    return (source === 'cmf_chile' || source === 'fintual') ? cfg.ttlLong : cfg.ttlShort;
  },

  _isFresh: function(entry) {
    if (!entry || !entry.last_updated) return false;
    return (Date.now() - new Date(entry.last_updated).getTime()) < this._ttlFor(entry.source);
  },

  // ── CORS proxy fetch ───────────────────────────────────────
  // Tries proxy1; on failure falls back to proxy2 (if different).
  // Optional `headers` object is forwarded to the upstream API where the proxy supports it.
  _proxyFetch: async function(url, headers) {
    var cfg  = this._cfg();
    var ms   = cfg.timeout;
    var p1   = this._PROXIES[cfg.proxy1];
    var p2   = this._PROXIES[cfg.proxy2];
    if (!p1) throw new Error('Unknown proxy: ' + cfg.proxy1);
    Debug.req('FundPrices [' + cfg.proxy1 + '] → ' + url.slice(0, 60) + '… (timeout ' + (ms / 1000) + 's)');
    try {
      var result = await p1(url, ms, headers);
      Debug.res(cfg.proxy1 + ' OK');
      return result;
    } catch(e1) {
      if (!p2 || cfg.proxy1 === cfg.proxy2) throw e1;
      Debug.warn(cfg.proxy1 + ' failed (' + e1.message + '), trying ' + cfg.proxy2);
      var result2 = await p2(url, ms, headers);
      Debug.res(cfg.proxy2 + ' OK');
      return result2;
    }
  },

  // ── Source: CMF Chile ──────────────────────────────────────
  // Endpoint: configurable via fundPricesCmfUrl; uses {run} as placeholder.
  // Auth and format are sent as GET query params (?apikey=...&formato=...).
  // Response: array of { fecha, valor_cuota } — Chilean decimal (comma)
  _fetchCmf: async function(runCmf) {
    var cfg    = this._cfg();
    var url    = cfg.cmfUrl.replace('{run}', encodeURIComponent(runCmf));
    var params = [];
    if (cfg.cmfApiKey) params.push('apikey=' + encodeURIComponent(cfg.cmfApiKey));
    if (cfg.cmfFormat) params.push('formato=' + encodeURIComponent(cfg.cmfFormat));
    if (params.length) url += (url.indexOf('?') >= 0 ? '&' : '?') + params.join('&');
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
  // Endpoint: configurable via fundPricesYahooUrl; uses {ticker} as placeholder.
  // Extracts regularMarketPrice + 1-day return from close series
  _fetchYahoo: async function(ticker) {
    var cfg = this._cfg();
    var url = cfg.yahooUrl.replace('{ticker}', encodeURIComponent(ticker));
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

  // ── Source: Fintual ───────────────────────────────────────
  // Endpoint: configurable via fundPricesFintualUrl; uses {id} as placeholder.
  // Fetches last 7 calendar days to ensure ≥2 trading-day rows.
  // Response: { data: [{ attributes: { date, price } }] } — price in CLP
  _fetchFintual: async function(fintualId) {
    var cfg     = this._cfg();
    var today   = new Date();
    var toDate  = today.toISOString().slice(0, 10);
    var fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    var base    = cfg.fintualUrl.replace('{id}', encodeURIComponent(fintualId));
    var url     = base + '?from_date=' + fromDate + '&to_date=' + toDate;
    var raw     = await this._proxyFetch(url);

    var rows = raw && raw.data;
    if (!rows || !rows.length) throw new Error('Fintual: no data for id ' + fintualId);

    // Sort descending by date
    rows = rows.slice().sort(function(a, b) {
      var da = (a.attributes && a.attributes.date) || '';
      var db = (b.attributes && b.attributes.date) || '';
      return da < db ? 1 : -1;
    });

    var latest = rows[0] && rows[0].attributes;
    var prev   = rows[1] && rows[1].attributes;
    if (!latest || latest.price == null) throw new Error('Fintual: invalid response for id ' + fintualId);

    var price    = parseFloat(latest.price);
    var change1d = null, change1d_pct = null;
    if (prev && prev.price != null) {
      var prevPrice = parseFloat(prev.price);
      if (prevPrice) {
        change1d     = price - prevPrice;
        change1d_pct = change1d / prevPrice * 100;
      }
    }
    Debug.res('Fintual id:' + fintualId + ' → ' + price + ' CLP (rows:' + rows.length + ')');
    return {
      price: price, currency: 'CLP',
      change1d: change1d, change1d_pct: change1d_pct,
      last_updated: new Date().toISOString(), source: 'fintual'
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

    // If the source is disabled, return stale cache or null without fetching
    if (!this._isSourceEnabled(fund.price_source)) {
      Debug.info('FundPrices: source "' + fund.price_source + '" disabled, skipping ' + fund.name);
      return entry || null;
    }

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
      } else if (fund.price_source === 'fintual' && fund.fintual_id) {
        result = await this._fetchFintual(fund.fintual_id);
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
