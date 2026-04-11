'use strict';
// ============================================================
// SETTINGS FEATURE
// Depends on: Store, SK, Debug
// ============================================================
var Settings = {
  getPrimaryCurrency: function() {
    return Store.get(SK.config, {}).primaryCurrency || 'CLP';
  },

  // Defaults for fund price fetching — kept in sync with FundPrices._cfg()
  _FP_DEFAULTS: { ttlShort: 15, ttlLong: 240, stagger: 300, timeout: 12,
                  proxy1: 'corsproxy.io', proxy2: 'allorigins.win',
                  cmfFormat: 'JSON' },

  // Defaults for market data fetching — kept in sync with MarketData._cfg()
  _MD_DEFAULTS: { timeout: 8 },

  load: function() {
    var cfg = Store.get(SK.config, {});
    var sv  = function(id, v) { var e = document.getElementById(id); if (e) e.value = v != null ? v : ''; };
    var sc  = function(id, v) { var e = document.getElementById(id); if (e) e.checked = !!v; };
    sv('cfg-salary',     cfg.salary || '');
    sv('cfg-needs',      cfg.pctNeeds      != null ? cfg.pctNeeds      : 50);
    sv('cfg-wants',      cfg.pctWants      != null ? cfg.pctWants      : 10);
    sv('cfg-commission', cfg.propCommission != null ? cfg.propCommission : 10);
    this.calcSavings();
    var psel = document.getElementById('cfg-primary-currency');
    if (psel && !psel.options.length) {
      CURRENCIES.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.code + ' — ' + c.name;
        psel.appendChild(opt);
      });
    }
    if (psel) psel.value = cfg.primaryCurrency || 'CLP';

    // Fund-price tuning params
    var d = this._FP_DEFAULTS;
    sv('cfg-fp-ttl-short', cfg.fundPricesTtlShort != null ? cfg.fundPricesTtlShort : d.ttlShort);
    sv('cfg-fp-ttl-long',  cfg.fundPricesTtlLong  != null ? cfg.fundPricesTtlLong  : d.ttlLong);
    sv('cfg-fp-stagger',   cfg.fundPricesStagger   != null ? cfg.fundPricesStagger  : d.stagger);
    sv('cfg-fp-timeout',   cfg.fundPricesTimeout   != null ? cfg.fundPricesTimeout  : d.timeout);
    var svSel = function(id, v) { var e = document.getElementById(id); if (e) e.value = v; };
    svSel('cfg-fp-proxy1', cfg.fundPricesProxy1 || d.proxy1);
    svSel('cfg-fp-proxy2', cfg.fundPricesProxy2 || d.proxy2);

    // API sources config
    var fp = typeof FundPrices !== 'undefined' ? FundPrices : {};
    sv('cfg-fp-cmf-url',     cfg.fundPricesCmfUrl     || (fp._CMF_URL_DEFAULT    || ''));
    sv('cfg-fp-yahoo-url',   cfg.fundPricesYahooUrl   || (fp._YAHOO_URL_DEFAULT  || ''));
    sv('cfg-fp-fintual-url', cfg.fundPricesFintualUrl || (fp._FINTUAL_URL_DEFAULT || ''));
    // CMF GET params
    sv('cfg-fp-cmf-apikey', cfg.fundPricesCmfApiKey  != null ? cfg.fundPricesCmfApiKey : '');
    svSel('cfg-fp-cmf-formato', cfg.fundPricesCmfFormat || d.cmfFormat);
    // Enabled toggles (all default true when not yet stored)
    sc('cfg-fp-cmf-enabled',     cfg.fundPricesCmfEnabled     !== false);
    sc('cfg-fp-yahoo-enabled',   cfg.fundPricesYahooEnabled   !== false);
    sc('cfg-fp-fintual-enabled', cfg.fundPricesFintualEnabled !== false);

    // Market data sources config
    var md = typeof MarketData !== 'undefined' ? MarketData : {};
    var mdd = this._MD_DEFAULTS;
    sv('cfg-md-timeout',         cfg.marketTimeout != null ? cfg.marketTimeout : mdd.timeout);
    sv('cfg-md-mindicador-url',  cfg.marketMindicadorUrl   || (md._MINDICADOR_URL_DEFAULT   || ''));
    sv('cfg-md-exchangerate-url',cfg.marketExchangeRateUrl || (md._EXCHANGERATE_URL_DEFAULT || ''));
    sv('cfg-md-coingecko-url',   cfg.marketCoinGeckoUrl    || (md._COINGECKO_URL_DEFAULT    || ''));
    sc('cfg-md-mindicador-enabled',   cfg.marketMindicadorEnabled   !== false);
    sc('cfg-md-exchangerate-enabled', cfg.marketExchangeRateEnabled !== false);
    sc('cfg-md-coingecko-enabled',    cfg.marketCoinGeckoEnabled    !== false);

    var tips = {
      'tip-fp-ttl-short':    'fpHintTtlShort',  'tip-fp-ttl-long':    'fpHintTtlLong',
      'tip-fp-stagger':      'fpHintStagger',    'tip-fp-timeout':     'fpHintTimeout',
      'tip-fp-proxy1':       'fpHintProxy',      'tip-fp-proxy2':      'fpHintProxy',
      'tip-fp-cmf-url':      'fpHintCmfUrl',     'tip-fp-yahoo-url':   'fpHintYahooUrl',
      'tip-fp-fintual-url':  'fpHintFintualUrl',
      'tip-fp-cmf-apikey':   'fpHintCmfApiKey',  'tip-fp-cmf-formato': 'fpHintCmfFormato'
    };
    Object.keys(tips).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.title = I18n.t('settings.' + tips[id]);
    });

    var stats = document.getElementById('cfg-storage-stats');
    if (stats) stats.textContent = I18n.t('settings.storageUsed') + ' ' + Store.size() + ' | ' + I18n.t('settings.storageKeys') + ' ' + Store.keys().length;
  },

  save: function() {
    var d   = this._FP_DEFAULTS;
    var fpa = typeof FundPrices !== 'undefined' ? FundPrices : {};
    var num = function(id, def) { var v = parseFloat(document.getElementById(id).value); return isNaN(v) ? def : v; };
    var str = function(id, def) { var e = document.getElementById(id); return e ? (e.value.trim() || def) : def; };
    var chk = function(id)      { var e = document.getElementById(id); return e ? e.checked : true; };
    Store.set(SK.config, {
      salary:                   parseFloat(document.getElementById('cfg-salary').value) || 0,
      pctNeeds:                 parseFloat(document.getElementById('cfg-needs').value)  || 50,
      pctWants:                 parseFloat(document.getElementById('cfg-wants').value)  || 10,
      propCommission:           parseFloat(document.getElementById('cfg-commission').value) || 10,
      primaryCurrency:          document.getElementById('cfg-primary-currency').value || 'CLP',
      fundPricesTtlShort:       num('cfg-fp-ttl-short', d.ttlShort),
      fundPricesTtlLong:        num('cfg-fp-ttl-long',  d.ttlLong),
      fundPricesStagger:        num('cfg-fp-stagger',   d.stagger),
      fundPricesTimeout:        num('cfg-fp-timeout',   d.timeout),
      fundPricesProxy1:         document.getElementById('cfg-fp-proxy1').value || d.proxy1,
      fundPricesProxy2:         document.getElementById('cfg-fp-proxy2').value || d.proxy2,
      // API source URLs
      fundPricesCmfUrl:         str('cfg-fp-cmf-url',     fpa._CMF_URL_DEFAULT    || ''),
      fundPricesYahooUrl:       str('cfg-fp-yahoo-url',   fpa._YAHOO_URL_DEFAULT  || ''),
      fundPricesFintualUrl:     str('cfg-fp-fintual-url', fpa._FINTUAL_URL_DEFAULT || ''),
      // CMF GET params
      fundPricesCmfApiKey:      (function(){ var e = document.getElementById('cfg-fp-cmf-apikey');  return e ? e.value.trim() : ''; })(),
      fundPricesCmfFormat:      str('cfg-fp-cmf-formato', d.cmfFormat),
      // Enabled flags
      fundPricesCmfEnabled:     chk('cfg-fp-cmf-enabled'),
      fundPricesYahooEnabled:   chk('cfg-fp-yahoo-enabled'),
      fundPricesFintualEnabled: chk('cfg-fp-fintual-enabled'),
      // Market data sources
      marketTimeout:              num('cfg-md-timeout', this._MD_DEFAULTS.timeout),
      marketMindicadorUrl:        str('cfg-md-mindicador-url',   (typeof MarketData !== 'undefined' ? MarketData._MINDICADOR_URL_DEFAULT   : '')),
      marketExchangeRateUrl:      str('cfg-md-exchangerate-url', (typeof MarketData !== 'undefined' ? MarketData._EXCHANGERATE_URL_DEFAULT : '')),
      marketCoinGeckoUrl:         str('cfg-md-coingecko-url',    (typeof MarketData !== 'undefined' ? MarketData._COINGECKO_URL_DEFAULT    : '')),
      marketMindicadorEnabled:    chk('cfg-md-mindicador-enabled'),
      marketExchangeRateEnabled:  chk('cfg-md-exchangerate-enabled'),
      marketCoinGeckoEnabled:     chk('cfg-md-coingecko-enabled')
    });
    Debug.info('Settings saved');
    alert(I18n.t('settings.savedAlert'));
  },

  calcSavings: function() {
    var n = parseFloat(document.getElementById('cfg-needs').value) || 50;
    var w = parseFloat(document.getElementById('cfg-wants').value) || 10;
    var el = document.getElementById('cfg-savings'); if (el) el.textContent = Math.max(0, 100 - n - w);
  }
};
