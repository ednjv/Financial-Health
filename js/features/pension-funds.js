'use strict';
// ============================================================
// PENSION FUNDS FEATURE
// Depends on: Store, SK, Debug, MarketData, CURRENCIES, I18n, Fmt, uid
// ============================================================
var PensionFunds = {

  // ========== DATA ACCESS ==========

  _defs: function() {
    return { funds: [] };
  },

  _get: function() {
    return Store.get(SK.pension, this._defs());
  },

  _save: function(d) {
    Store.set(SK.pension, d);
  },

  getFunds: function() {
    return this._get().funds || [];
  },

  // ========== HELPERS ==========

  // Convert a fund amount (in its own currency) to CLP
  _toCLP: function(amount, currency) {
    return (parseFloat(amount) || 0) * MarketData.getRate(currency || 'CLP');
  },

  _populateCurrencySelect: function(selectedCode) {
    var select = document.getElementById('pfm-currency');
    if (!select) return;
    var def = selectedCode || MarketData.getPrimaryCurrency();
    select.innerHTML = CURRENCIES.map(function(c) {
      return '<option value="' + c.code + '"' + (c.code === def ? ' selected' : '') + '>' +
             c.code + ' — ' + c.name + '</option>';
    }).join('');
  },

  // ========== MODAL OPERATIONS ==========

  openAddModal: function() {
    document.getElementById('pfm-id').value    = '';
    document.getElementById('pfm-desc').value  = '';
    document.getElementById('pfm-amount').value = '';
    this._populateCurrencySelect();
    document.getElementById('pf-modal-title').textContent = I18n.t('pension.modal.titleAdd');
    openModal('m-pension-fund');
  },

  openEditModal: function(fundId) {
    var fund = this.getFunds().filter(function(f) { return f.id === fundId; })[0];
    if (!fund) return;
    document.getElementById('pfm-id').value     = fund.id;
    document.getElementById('pfm-desc').value   = fund.description || '';
    document.getElementById('pfm-amount').value = fund.amount || '';
    this._populateCurrencySelect(fund.currency);
    document.getElementById('pf-modal-title').textContent = I18n.t('pension.modal.titleEdit');
    openModal('m-pension-fund');
  },

  saveFund: function() {
    var id       = document.getElementById('pfm-id').value;
    var desc     = (document.getElementById('pfm-desc').value || '').trim();
    var amount   = parseFloat(document.getElementById('pfm-amount').value) || 0;
    var currency = document.getElementById('pfm-currency').value || 'CLP';

    if (!desc)      { Debug.warn('La descripción del fondo es requerida'); return; }
    if (amount <= 0) { Debug.warn('El saldo debe ser mayor a 0');          return; }

    var data = this._get();
    var existing = id ? data.funds.filter(function(f) { return f.id === id; })[0] : null;

    var fund = {
      id:          id || uid(),
      description: desc,
      amount:      amount,
      currency:    currency,
      createdAt:   existing ? existing.createdAt : new Date().toISOString()
    };

    if (id) {
      data.funds = data.funds.map(function(f) { return f.id === id ? fund : f; });
    } else {
      data.funds.push(fund);
    }

    this._save(data);
    Debug.info('Fondo de pensión guardado: ' + desc);
    closeModal('m-pension-fund');
    this.renderAll();
  },

  deleteFund: function(fundId) {
    if (!confirm(I18n.t('pension.confirm.deleteFund'))) return;
    var data = this._get();
    data.funds = data.funds.filter(function(f) { return f.id !== fundId; });
    this._save(data);
    Debug.info('Fondo de pensión eliminado');
    this.renderAll();
  },

  // ========== RENDERING ==========

  renderAll: function() {
    this.renderKPIs();
    this.renderFunds();
  },

  renderKPIs: function() {
    var funds      = this.getFunds();
    var self       = this;
    var t          = I18n.t.bind(I18n);
    var primaryCur = MarketData.getPrimaryCurrency();

    var totalCLP = 0;
    var maxCLP   = 0;
    var curMap   = {};

    funds.forEach(function(fund) {
      var clp   = self._toCLP(fund.amount, fund.currency);
      totalCLP += clp;
      if (clp > maxCLP) maxCLP = clp;
      curMap[fund.currency] = true;
    });

    var uniqueCurrencies = Object.keys(curMap).length;

    var el = document.getElementById('pf-kpis'); if (!el) return;
    el.innerHTML =
      '<div class="card-sm"><div class="metric-label">' + t('pension.kpi.count') + '</div><div class="metric-val">' + funds.length + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + t('pension.kpi.total') + ' (' + primaryCur + ')</div><div class="metric-val" style="color:var(--green)">' + MarketData.formatShortPrimary(totalCLP) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + t('pension.kpi.largest') + '</div><div class="metric-val" style="color:var(--cyan)">' + (maxCLP > 0 ? MarketData.formatShortPrimary(maxCLP) : '--') + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + t('pension.kpi.currencies') + '</div><div class="metric-val">' + (uniqueCurrencies || '--') + '</div></div>';
  },

  renderFunds: function() {
    var funds      = this.getFunds();
    var self       = this;
    var t          = I18n.t.bind(I18n);
    var primaryCur = MarketData.getPrimaryCurrency();

    var html = '';

    if (funds.length === 0) {
      html =
        '<div style="text-align:center;padding:40px;color:var(--muted)">' +
        '<div style="font-size:14px">' + t('pension.empty.title') + '</div>' +
        '<div style="font-size:12px;margin-top:8px">' + t('pension.empty.hint') + '</div>' +
        '</div>';
    } else {
      html = funds.map(function(fund) {
        var clpValue        = self._toCLP(fund.amount, fund.currency);
        var amountFormatted = Fmt.foreign(fund.amount, fund.currency);
        var primaryFormatted = MarketData.formatPrimary(clpValue);
        var showPrimary     = fund.currency !== primaryCur;

        return '<div class="card" style="margin-bottom:14px">' +
          '<div style="display:flex;justify-content:space-between;align-items:start">' +
          '<div>' +
          '<div style="font-weight:700;font-size:15px">' + fund.description + '</div>' +
          '<div style="color:var(--muted);font-size:11px;margin-top:4px">' + fund.currency + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px">' +
          '<button class="btn btn-ghost" style="padding:3px 8px;font-size:11px" onclick="PensionFunds.openEditModal(\'' + fund.id + '\')">' + t('pension.card.edit') + '</button>' +
          '<button class="btn btn-red" style="padding:3px 8px;font-size:11px" onclick="PensionFunds.deleteFund(\'' + fund.id + '\')">×</button>' +
          '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr' + (showPrimary ? ' 1fr' : '') + ';gap:12px;font-size:12px;font-family:var(--mono);margin-top:12px">' +
          '<div><div style="color:var(--muted);font-size:10px">' + t('pension.card.balance') + ' (' + fund.currency + ')</div>' +
          '<div style="font-size:18px;font-weight:700;color:var(--green)">' + amountFormatted + '</div></div>' +
          (showPrimary
            ? '<div><div style="color:var(--muted);font-size:10px">' + t('pension.card.equivalent') + ' (' + primaryCur + ')</div>' +
              '<div style="font-size:18px;font-weight:700;color:var(--cyan)">' + primaryFormatted + '</div></div>'
            : '') +
          '</div>' +
          '</div>';
      }).join('');
    }

    var container = document.getElementById('pf-funds');
    if (container) container.innerHTML = html;
  }
};
