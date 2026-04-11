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
                  cmfHeaderName: 'apikey', cmfHeaderVal: '' },

  load: function() {
    var cfg = Store.get(SK.config, {});
    var sv = function(id, v) { var e = document.getElementById(id); if (e) e.value = v || ''; };
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
    // Apply tooltips from i18n (rendered after locale is applied)
    var svSel = function(id, v) { var e = document.getElementById(id); if (e) e.value = v; };
    svSel('cfg-fp-proxy1', cfg.fundPricesProxy1 || d.proxy1);
    svSel('cfg-fp-proxy2', cfg.fundPricesProxy2 || d.proxy2);
    // API sources config
    var fp = typeof FundPrices !== 'undefined' ? FundPrices : {};
    sv('cfg-fp-cmf-url',         cfg.fundPricesCmfUrl   || (fp._CMF_URL_DEFAULT   || ''));
    sv('cfg-fp-yahoo-url',       cfg.fundPricesYahooUrl || (fp._YAHOO_URL_DEFAULT  || ''));
    sv('cfg-fp-cmf-header-name', cfg.fundPricesCmfHeaderName != null ? cfg.fundPricesCmfHeaderName : d.cmfHeaderName);
    sv('cfg-fp-cmf-header-val',  cfg.fundPricesCmfHeaderVal  != null ? cfg.fundPricesCmfHeaderVal  : d.cmfHeaderVal);
    var tips = {
      'tip-fp-ttl-short':      'fpHintTtlShort',   'tip-fp-ttl-long':         'fpHintTtlLong',
      'tip-fp-stagger':        'fpHintStagger',     'tip-fp-timeout':          'fpHintTimeout',
      'tip-fp-proxy1':         'fpHintProxy',       'tip-fp-proxy2':           'fpHintProxy',
      'tip-fp-cmf-url':        'fpHintCmfUrl',      'tip-fp-yahoo-url':        'fpHintYahooUrl',
      'tip-fp-cmf-header':     'fpHintCmfHeader',   'tip-fp-cmf-header-val':   'fpHintCmfHeaderVal'
    };
    Object.keys(tips).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.title = I18n.t('settings.' + tips[id]);
    });
    var stats = document.getElementById('cfg-storage-stats');
    if (stats) stats.textContent = I18n.t('settings.storageUsed') + ' ' + Store.size() + ' | ' + I18n.t('settings.storageKeys') + ' ' + Store.keys().length;
  },

  save: function() {
    var d = this._FP_DEFAULTS;
    var fpa = typeof FundPrices !== 'undefined' ? FundPrices : {};
    var num = function(id, def) { var v = parseFloat(document.getElementById(id).value); return isNaN(v) ? def : v; };
    var str = function(id, def) { var e = document.getElementById(id); return e ? (e.value.trim() || def) : def; };
    Store.set(SK.config, {
      salary:                    parseFloat(document.getElementById('cfg-salary').value) || 0,
      pctNeeds:                  parseFloat(document.getElementById('cfg-needs').value)  || 50,
      pctWants:                  parseFloat(document.getElementById('cfg-wants').value)  || 10,
      propCommission:            parseFloat(document.getElementById('cfg-commission').value) || 10,
      primaryCurrency:           document.getElementById('cfg-primary-currency').value || 'CLP',
      fundPricesTtlShort:        num('cfg-fp-ttl-short', d.ttlShort),
      fundPricesTtlLong:         num('cfg-fp-ttl-long',  d.ttlLong),
      fundPricesStagger:         num('cfg-fp-stagger',   d.stagger),
      fundPricesTimeout:         num('cfg-fp-timeout',   d.timeout),
      fundPricesProxy1:          document.getElementById('cfg-fp-proxy1').value || d.proxy1,
      fundPricesProxy2:          document.getElementById('cfg-fp-proxy2').value || d.proxy2,
      fundPricesCmfUrl:          str('cfg-fp-cmf-url',         fpa._CMF_URL_DEFAULT   || ''),
      fundPricesYahooUrl:        str('cfg-fp-yahoo-url',       fpa._YAHOO_URL_DEFAULT || ''),
      fundPricesCmfHeaderName:   (function(){ var e = document.getElementById('cfg-fp-cmf-header-name'); return e ? e.value.trim() : d.cmfHeaderName; })(),
      fundPricesCmfHeaderVal:    (function(){ var e = document.getElementById('cfg-fp-cmf-header-val');  return e ? e.value.trim() : d.cmfHeaderVal;  })()
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
