'use strict';
// ============================================================
// SETTINGS FEATURE
// Depends on: Store, SK, Debug
// ============================================================
var Settings = {
  getPrimaryCurrency: function() {
    return Store.get(SK.config, {}).primaryCurrency || 'CLP';
  },

  load: function() {
    var cfg = Store.get(SK.config, {});
    var sv = function(id, v) { var e = document.getElementById(id); if (e) e.value = v || ''; };
    sv('cfg-salary',     cfg.salary || '');
    sv('cfg-needs',      cfg.pctNeeds     != null ? cfg.pctNeeds     : 50);
    sv('cfg-wants',      cfg.pctWants     != null ? cfg.pctWants     : 10);
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
    var stats = document.getElementById('cfg-storage-stats');
    if (stats) stats.textContent = I18n.t('settings.storageUsed') + ' ' + Store.size() + ' | ' + I18n.t('settings.storageKeys') + ' ' + Store.keys().length;
  },

  save: function() {
    Store.set(SK.config, {
      salary:          parseFloat(document.getElementById('cfg-salary').value) || 0,
      pctNeeds:        parseFloat(document.getElementById('cfg-needs').value)  || 50,
      pctWants:        parseFloat(document.getElementById('cfg-wants').value)  || 10,
      propCommission:  parseFloat(document.getElementById('cfg-commission').value) || 10,
      primaryCurrency: document.getElementById('cfg-primary-currency').value || 'CLP'
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
