'use strict';
// ============================================================
// INVESTMENTS FEATURE
// Depends on: Store, SK, Debug, Fmt, Charts, MarketData, I18n
// ============================================================
var Investments = {
  _defs: function() {
    var n = null;
    return [
      {id:'fintual',  name:'Fintual',             currency:'CLP', desc:'Fondo mutuo mixto',           ticker:n, isin:n, run_cmf:n, cusip:n, bloomberg_ticker:n, price_source:'none'},
      {id:'itaudin',  name:'FFMM Itau Dinamico',  currency:'CLP', desc:'Fondo Itau Dinámico',         ticker:n, isin:n, run_cmf:n, cusip:n, bloomberg_ticker:n, price_source:'none'},
      {id:'quilter',  name:'Quilter/Utmost',       currency:'USD', desc:'Portafolio internacional',    ticker:n, isin:n, run_cmf:n, cusip:n, bloomberg_ticker:n, price_source:'none'},
      {id:'ib',       name:'Interactive Brokers',  currency:'USD', desc:'Broker internacional',        ticker:n, isin:n, run_cmf:n, cusip:n, bloomberg_ticker:n, price_source:'none'},
      {id:'ml',       name:'MercadoLibre',         currency:'CLP', desc:'Fondo ML',                   ticker:n, isin:n, run_cmf:n, cusip:n, bloomberg_ticker:n, price_source:'none'},
      {id:'scotia',   name:'FM Scotia USA',        currency:'CLP', desc:'FM Scotia Acciones USA',      ticker:n, isin:n, run_cmf:n, cusip:n, bloomberg_ticker:n, price_source:'none'},
      {id:'global66', name:'Global66 USD',         currency:'USD', desc:'Multi-divisa',               ticker:n, isin:n, run_cmf:n, cusip:n, bloomberg_ticker:n, price_source:'none'}
    ];
  },
  _get:      function() { return Store.get(SK.invest, {funds:[], snapshots:[]}); },
  _save:     function(d) { Store.set(SK.invest, d); },
  getFunds:  function() { var d = this._get(); return (d.funds && d.funds.length) ? d.funds : this._defs(); },
  getSnaps:  function() { return (this._get().snapshots) || []; },

  _latestMonth: function() {
    var snaps = this.getSnaps(); if (!snaps.length) return null;
    return snaps.map(function(s) { return s.month; }).sort().pop();
  },

  _updateInvestedLabel: function() {
    var cur = document.getElementById('sn-currency').value || 'CLP';
    var lbl = document.querySelector('label[for="sn-invested"], label[data-i18n="investments.modal.labelInvested"]');
    if (lbl) lbl.textContent = I18n.t('investments.modal.labelInvested') + ' (' + cur + ')';
  },

  // ── Fund identifier helpers ──────────────────────────────────
  _updatePriceSourceOptions: function() {
    var sel = document.getElementById('fn-price-source'); if (!sel) return;
    var t = I18n.t.bind(I18n);
    var ticker  = (document.getElementById('fn-ticker').value  || '').trim();
    var isin    = (document.getElementById('fn-isin').value    || '').trim();
    var runCmf  = (document.getElementById('fn-run-cmf').value || '').trim();
    var cusip   = (document.getElementById('fn-cusip').value   || '').trim();
    var current = sel.value;
    // Build available options in display order
    var order = ['none','cmf_chile','yahoo_finance','alpha_vantage','morningstar','manual'];
    var labels = {
      none:        t('investments.modal.priceSrcNone'),
      cmf_chile:   t('investments.modal.priceSrcCmf'),
      yahoo_finance: t('investments.modal.priceSrcYahoo'),
      alpha_vantage: t('investments.modal.priceSrcAlpha'),
      morningstar: t('investments.modal.priceSrcMorningstar'),
      manual:      t('investments.modal.priceSrcManual')
    };
    var available = {none: true, manual: true};
    if (runCmf)           available.cmf_chile      = true;
    if (ticker)           available.yahoo_finance   = true;
    if (ticker || cusip)  available.alpha_vantage   = true;
    if (isin   || cusip)  available.morningstar     = true;
    sel.innerHTML = order.filter(function(k) { return available[k]; }).map(function(k) {
      return '<option value="' + k + '"' + (k === current ? ' selected' : '') + '>' + labels[k] + '</option>';
    }).join('');
    if (!available[current]) sel.value = 'none';
  },

  _applyTooltips: function() {
    var t = I18n.t.bind(I18n);
    var map = {
      'tip-ticker':       'helpTicker',
      'tip-isin':         'helpIsin',
      'tip-run-cmf':      'helpRunCmf',
      'tip-cusip':        'helpCusip',
      'tip-bloomberg':    'helpBloomberg',
      'tip-price-source': 'helpPriceSource'
    };
    Object.keys(map).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.title = t('investments.modal.' + map[id]);
    });
  },

  openFundEdit: function(id) {
    var fund = this.getFunds().filter(function(f) { return f.id === id; })[0]; if (!fund) return;
    document.getElementById('fn-id').value = fund.id;
    document.getElementById('fn-name').value = fund.name;
    document.getElementById('fn-currency').value = fund.currency || 'CLP';
    document.getElementById('fn-desc').value = fund.desc || '';
    document.getElementById('fn-ticker').value  = fund.ticker           || '';
    document.getElementById('fn-isin').value    = fund.isin             || '';
    document.getElementById('fn-run-cmf').value = fund.run_cmf          || '';
    document.getElementById('fn-cusip').value   = fund.cusip            || '';
    document.getElementById('fn-bloomberg').value = fund.bloomberg_ticker || '';
    this._updatePriceSourceOptions();
    document.getElementById('fn-price-source').value = fund.price_source || 'none';
    var hasIds = !!(fund.ticker || fund.isin || fund.run_cmf || fund.cusip || fund.bloomberg_ticker || (fund.price_source && fund.price_source !== 'none'));
    document.getElementById('fn-market-details').open = hasIds;
    var btn = document.getElementById('fn-save-btn');
    if (btn) { btn.textContent = I18n.t('investments.modal.updateFund'); btn.removeAttribute('data-i18n'); }
    document.getElementById('fn-cancel-edit-btn').style.display = '';
    // Scroll to the form area
    var details = document.getElementById('fn-market-details');
    if (details) setTimeout(function() { details.scrollIntoView({behavior:'smooth', block:'nearest'}); }, 50);
  },

  _cancelFundEdit: function() {
    document.getElementById('fn-id').value = '';
    document.getElementById('fn-name').value = '';
    document.getElementById('fn-desc').value = '';
    document.getElementById('fn-ticker').value = '';
    document.getElementById('fn-isin').value = '';
    document.getElementById('fn-run-cmf').value = '';
    document.getElementById('fn-cusip').value = '';
    document.getElementById('fn-bloomberg').value = '';
    this._updatePriceSourceOptions();
    document.getElementById('fn-market-details').open = false;
    var btn = document.getElementById('fn-save-btn');
    if (btn) { btn.setAttribute('data-i18n', 'investments.modal.saveFund'); btn.textContent = I18n.t('investments.modal.saveFund'); }
    document.getElementById('fn-cancel-edit-btn').style.display = 'none';
  },

  _getLatestSnapForFund: function(fundId, beforeMonth) {
    var snaps = this.getSnaps().filter(function(s) {
      return s.fundId === fundId && s.month < beforeMonth;
    });
    if (!snaps.length) return null;
    return snaps.sort(function(a, b) { return a.month > b.month ? -1 : 1; })[0];
  },

  prevMonth: function() {
    var m = document.getElementById('inv-month').value || new Date().toISOString().slice(0, 7);
    var p = m.split('-'); var d = new Date(+p[0], +p[1] - 1, 1); d.setMonth(d.getMonth() - 1);
    document.getElementById('inv-month').value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    Investments.renderAll();
  },

  nextMonth: function() {
    var m = document.getElementById('inv-month').value || new Date().toISOString().slice(0, 7);
    var p = m.split('-'); var d = new Date(+p[0], +p[1] - 1, 1); d.setMonth(d.getMonth() + 1);
    document.getElementById('inv-month').value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    Investments.renderAll();
  },

  openSnapModal: function(id) {
    var snap = id ? this.getSnaps().filter(function(s) { return s.id === id; })[0] : null;
    var m = document.getElementById('inv-month').value || new Date().toISOString().slice(0, 7);
    document.getElementById('snap-modal-title').textContent = snap
      ? I18n.t('investments.modal.titleEdit')
      : I18n.t('investments.modal.titleAdd');
    document.getElementById('sn-id').value = snap ? snap.id : '';
    document.getElementById('sn-month').value = snap ? snap.month : m;
    document.getElementById('sn-invested').value = snap ? (snap.invested || '') : '';
    var sel = document.getElementById('sn-fund');
    sel.innerHTML = this.getFunds().map(function(f) {
      return '<option value="' + f.id + '">' + f.name + ' (' + f.currency + ')</option>';
    }).join('');
    var curSel = document.getElementById('sn-currency');
    if (snap) {
      sel.value = snap.fundId;
      document.getElementById('sn-prev').value = snap.prevBalance || '';
      document.getElementById('sn-curr').value = snap.currBalance || '';
      curSel.value = snap.currency || 'CLP';
      sel.onchange = null;
      curSel.onchange = function() { Investments._updateInvestedLabel(); Investments.calcRet(); };
    } else {
      var autoFill = function() {
        var fid = document.getElementById('sn-fund').value;
        var curMonth = document.getElementById('sn-month').value || m;
        var latest = Investments._getLatestSnapForFund(fid, curMonth);
        document.getElementById('sn-prev').value = latest ? (latest.currBalance || '') : '';
        document.getElementById('sn-curr').value = '';
        var fund = Investments.getFunds().filter(function(f) { return f.id === fid; })[0];
        if (fund) curSel.value = fund.currency || 'CLP';
        Investments._updateInvestedLabel();
        Investments.calcRet();
      };
      sel.onchange = autoFill;
      curSel.onchange = function() { Investments._updateInvestedLabel(); Investments.calcRet(); };
      autoFill();
    }
    this._updateInvestedLabel();
    this.calcRet();
    openModal('m-snapshot');
  },

  calcRet: function() {
    var prev = parseFloat(document.getElementById('sn-prev').value) || 0;
    var curr = parseFloat(document.getElementById('sn-curr').value) || 0;
    if (prev && curr) {
      var invested = parseFloat(document.getElementById('sn-invested').value) || 0;
      var ret = (curr - prev - invested) / prev * 100; var diff = curr - prev - invested;
      var c = ret >= 0 ? 'var(--green)' : 'var(--red)';
      document.getElementById('sn-preview').innerHTML =
        '<div style="display:flex;gap:16px;font-family:var(--mono)">' +
        '<div><div style="font-size:9px;color:var(--muted)">' + I18n.t('investments.preview.variation') + '</div><div style="font-size:16px;color:' + c + '">' + Fmt.pct(ret) + '</div></div>' +
        '<div><div style="font-size:9px;color:var(--muted)">' + I18n.t('investments.preview.diff') + '</div><div style="font-size:16px;color:' + c + '">' + Fmt.short(diff) + '</div></div>' +
        '</div>';
    } else {
      document.getElementById('sn-preview').innerHTML = '<div style="font-size:12px;color:var(--muted)">' + I18n.t('investments.modal.previewEmpty') + '</div>';
    }
  },

  saveSnap: function() {
    var d = this._get(); if (!d.funds || !d.funds.length) d.funds = this._defs();
    var fid = document.getElementById('sn-fund').value;
    var fund = this.getFunds().filter(function(f) { return f.id === fid; })[0];
    var existingId = document.getElementById('sn-id').value;
    var prev = parseFloat(document.getElementById('sn-prev').value) || 0;
    var curr = parseFloat(document.getElementById('sn-curr').value) || 0;
    var snapMonth = document.getElementById('sn-month').value;
    var invested = parseFloat(document.getElementById('sn-invested').value) || 0;
    var currency = document.getElementById('sn-currency').value;
    var clpRate = MarketData.getRate(currency);
    var snap = {
      id: existingId || uid(),
      month: snapMonth, fundId: fid, fundName: fund ? fund.name : fid,
      currency: currency,
      prevBalance: prev, currBalance: curr,
      invested: invested,
      returnPct: prev ? (curr - prev - invested) / prev * 100 : 0,
      clpRate: clpRate
    };
    d.snapshots = (d.snapshots || []).filter(function(s) {
      if (existingId) return s.id !== existingId;
      return !(s.month === snapMonth && s.fundId === fid);
    });
    d.snapshots.push(snap);
    this._save(d);
    Debug.info('Snapshot saved: ' + snap.month + '/' + snap.fundName);
    closeModal('m-snapshot'); this.renderAll();
  },

  openFundModal: function() {
    this._cancelFundEdit();  // reset form to add-mode
    this._applyTooltips();
    this._renderFundList();
    openModal('m-funds');
  },

  _renderFundList: function() {
    var el = document.getElementById('funds-list'); if (!el) return;
    el.innerHTML = this.getFunds().map(function(f) {
      var ids = [];
      if (f.ticker)          ids.push('<span class="badge bb" title="Ticker" style="margin-left:4px">' + f.ticker + '</span>');
      if (f.run_cmf)         ids.push('<span class="badge bb" title="RUN CMF" style="margin-left:4px">CMF:' + f.run_cmf + '</span>');
      if (f.isin)            ids.push('<span class="badge bb" title="ISIN" style="margin-left:4px">' + f.isin + '</span>');
      if (f.price_source && f.price_source !== 'none')
        ids.push('<span class="badge" style="margin-left:4px;background:rgba(6,182,212,.12);color:var(--cyan)" title="Fuente de precio">' + f.price_source + '</span>');
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">' +
        '<div><span style="font-weight:700;font-size:13px">' + f.name + '</span>' +
        '<span class="badge bb" style="margin-left:6px">' + f.currency + '</span>' +
        ids.join('') +
        '<div style="font-size:11px;color:var(--muted)">' + (f.desc || '') + '</div></div>' +
        '<div style="display:flex;gap:4px">' +
        '<button class="btn btn-ghost" style="padding:3px 8px;font-size:11px" onclick="Investments.openFundEdit(\'' + f.id + '\')">✏</button>' +
        '<button class="btn btn-red" style="padding:3px 8px;font-size:11px" onclick="Investments.deleteFund(\'' + f.id + '\')">×</button>' +
        '</div></div>';
    }).join('');
  },

  saveFund: function() {
    var name = document.getElementById('fn-name').value.trim(); if (!name) return;
    var ticker  = document.getElementById('fn-ticker').value.trim().toUpperCase();
    var isin    = document.getElementById('fn-isin').value.trim().toUpperCase();
    var runCmf  = document.getElementById('fn-run-cmf').value.trim();
    var cusip   = document.getElementById('fn-cusip').value.trim().toUpperCase();
    var bloomberg = document.getElementById('fn-bloomberg').value.trim();
    var priceSource = document.getElementById('fn-price-source').value || 'none';
    // Validate identifiers
    if (ticker && !/^[A-Z0-9]{1,10}$/.test(ticker)) {
      alert('Ticker inválido: máx 10 caracteres alfanuméricos en mayúsculas.\nEj: VOO, SPY, AAPL'); return;
    }
    if (isin && !/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) {
      alert('ISIN inválido: 2 letras + 10 alfanuméricos (12 chars total).\nEj: IE000JIZVX47'); return;
    }
    if (runCmf && !/^\d{4,6}$/.test(runCmf)) {
      alert('RUN CMF inválido: solo dígitos, entre 4 y 6 caracteres.\nEj: 9570, 10517'); return;
    }
    if (priceSource !== 'none' && !ticker && !isin && !runCmf && !cusip && !bloomberg) {
      alert('Si seleccionas una fuente de precio, debes completar al menos un identificador.'); return;
    }
    var d = this._get(); if (!d.funds || !d.funds.length) d.funds = this._defs();
    var editId = document.getElementById('fn-id').value;
    var fundData = {
      name: name,
      currency: document.getElementById('fn-currency').value,
      desc: document.getElementById('fn-desc').value,
      ticker: ticker || null, isin: isin || null, run_cmf: runCmf || null,
      cusip: cusip || null, bloomberg_ticker: bloomberg || null, price_source: priceSource
    };
    if (editId) {
      d.funds = d.funds.map(function(f) {
        return f.id === editId ? Object.assign({}, f, fundData) : f;
      });
      Debug.info('Fund updated: ' + name);
    } else {
      d.funds.push(Object.assign({id: uid()}, fundData));
      Debug.info('Fund added: ' + name);
    }
    this._save(d);
    this._cancelFundEdit();
    this._renderFundList();
  },

  deleteFund: function(id) {
    if (!confirm(I18n.t('investments.confirm.deleteFund'))) return;
    var d = this._get(); d.funds = (d.funds || []).filter(function(f) { return f.id !== id; });
    this._save(d); this._renderFundList();
  },

  renderAll: function() {
    var m = document.getElementById('inv-month').value || new Date().toISOString().slice(0, 7);
    var el = document.getElementById('inv-month-label');
    var months = I18n.months();
    var parts = m.split('-'); var label = parts[1] ? months[parseInt(parts[1]) - 1] + ' ' + parts[0] : m;
    if (el) el.textContent = label;
    this._renderKPIs(m); this._renderSnapTable(m); this._renderCharts();
  },

  _renderKPIs: function(month) {
    var snaps = this.getSnaps().filter(function(s) { return s.month === month; });
    var totalCLP = 0, totalRet = 0, totalInv = 0;
    snaps.forEach(function(s) {
      var rate = MarketData.getRate(s.currency);
      totalCLP += ((s.currBalance || 0) * rate);
      totalRet += (s.returnPct || 0); totalInv += (s.invested || 0) * rate;
    });
    var avgRet = snaps.length ? totalRet / snaps.length : 0;
    var el = document.getElementById('inv-kpis'); if (!el) return;
    var rc = avgRet >= 0 ? 'var(--green)' : 'var(--red)';
    var primaryCur = MarketData.getPrimaryCurrency();
    var portfolioLabel = I18n.t('investments.kpi.portfolio') + ' (' + primaryCur + ')';
    el.innerHTML =
      '<div class="card-sm"><div class="metric-label">' + portfolioLabel + '</div><div class="metric-val" style="color:var(--purple);font-size:17px">' + MarketData.formatShortPrimary(totalCLP) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + I18n.t('investments.kpi.avgReturn') + '</div><div class="metric-val" style="color:' + rc + ';font-size:17px">' + Fmt.pct(avgRet) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + I18n.t('investments.kpi.invested') + '</div><div class="metric-val" style="color:var(--amber);font-size:17px">' + Fmt.short(totalInv) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + I18n.t('investments.kpi.activeFunds') + '</div><div class="metric-val" style="font-size:17px">' + snaps.length + '</div></div>';
  },

  _renderSnapTable: function(month) {
    var snaps = this.getSnaps().filter(function(s) { return s.month === month; });
    var el = document.getElementById('inv-snap-table'); if (!el) return;
    if (!snaps.length) {
      el.innerHTML = '<div style="padding:20px;text-align:center"><p style="font-size:13px;color:var(--muted)">' + I18n.t('investments.empty.noSnaps', {month: month}) + '</p><p style="font-size:12px;color:var(--muted);margin-top:6px">' + I18n.t('investments.empty.hint') + '</p></div>';
      document.getElementById('inv-suggest').innerHTML = '';
      return;
    }
    var totalCLP = 0;
    snaps.forEach(function(s) { totalCLP += (s.currBalance || 0) * MarketData.getRate(s.currency); });
    snaps.sort(function(a, b) { return b.currBalance - a.currBalance; });
    var t = I18n.t.bind(I18n);
    el.innerHTML = '<table><thead><tr><th>' + t('investments.table.fund') + '</th><th>' + t('investments.table.currency') + '</th><th>' + t('investments.table.prev') + '</th><th>' + t('investments.table.curr') + '</th><th>' + t('investments.table.return') + '</th><th>' + t('investments.table.mktGain') + '</th><th>' + t('investments.table.clpEquiv') + '</th><th>' + t('investments.table.portPct') + '</th><th>' + t('investments.table.invested') + '</th><th></th></tr></thead><tbody>' +
      snaps.map(function(s) {
        var clp = (s.currBalance || 0) * MarketData.getRate(s.currency);
        var pct = totalCLP ? clp / totalCLP * 100 : 0;
        var prev  = Fmt.foreign(s.prevBalance, s.currency);
        var curr2 = Fmt.foreign(s.currBalance, s.currency);
        var investedFund = s.clpRate ? (s.invested || 0) / s.clpRate : (s.invested || 0);
        var mktGain = (s.currBalance || 0) - (s.prevBalance || 0) - investedFund;
        var mgColor = mktGain >= 0 ? 'var(--green)' : 'var(--red)';
        return '<tr><td style="font-weight:700">' + s.fundName + '</td>' +
          '<td><span class="badge bb">' + s.currency + '</span></td>' +
          '<td>' + prev + '</td><td>' + curr2 + '</td>' +
          '<td>' + Fmt.delta(s.returnPct) + '</td>' +
          '<td style="color:' + mgColor + '">' + Fmt.foreign(mktGain, s.currency) + '</td>' +
          '<td>' + Fmt.clp(clp) + '</td>' +
          '<td><div style="display:flex;align-items:center;gap:5px"><div class="pw" style="width:50px"><div class="pf" style="width:' + Math.min(pct, 100).toFixed(0) + '%;background:var(--purple)"></div></div><span style="font-size:9px">' + pct.toFixed(0) + '%</span></div></td>' +
          '<td style="color:var(--amber)">' + (s.invested ? Fmt.foreign(s.invested, s.currency) : '--') + '</td>' +
          '<td><div style="display:flex;gap:4px">' +
            '<button class="btn btn-ghost" style="padding:2px 7px;font-size:10px" onclick="Investments.openSnapModal(\'' + s.id + '\')">✏</button>' +
            '<button class="btn btn-red" style="padding:2px 7px;font-size:10px" onclick="Investments.deleteSnap(\'' + s.id + '\')">×</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table>';
    this._renderSuggest(snaps, totalCLP, month);
  },

  _renderSuggest: function(snaps, _totalCLP, month) {
    var el = document.getElementById('inv-suggest'); if (!el) return;
    var cfg = Store.get(SK.config, {}); var salary = parseFloat(cfg.salary) || 0;
    var savPct = 100 - parseFloat(cfg.pctNeeds || 50) - parseFloat(cfg.pctWants || 10);

    var budgetStats = Store.get(SK.budgetStats, {});
    var mStats = budgetStats[month];
    var leftToInvest, savingsTarget, investedThisMonth;

    if (mStats) {
      leftToInvest = parseFloat(mStats.leftToInvest) || 0;
      investedThisMonth = parseFloat(mStats.investedTotal) || 0;
      savingsTarget = (parseFloat(mStats.salary || salary) * savPct / 100);
    } else {
      if (!salary) { el.innerHTML = '<p style="font-size:12px;color:var(--muted)">' + I18n.t('investments.suggest.configSalary') + '</p>'; return; }
      savingsTarget = salary * savPct / 100;
      investedThisMonth = snaps.reduce(function(s, x) { return s + (x.invested || 0) * (x.clpRate || 1); }, 0);
      leftToInvest = savingsTarget - investedThisMonth;
    }

    var t = I18n.t.bind(I18n);
    var clpSnaps = snaps.filter(function(s) { return s.currency === 'CLP'; });
    var totalCLPFunds = clpSnaps.reduce(function(s, x) { return s + x.currBalance; }, 0);
    var c = leftToInvest >= 0 ? 'var(--green)' : 'var(--red)';
    var rows = clpSnaps.map(function(s) {
      var weight = totalCLPFunds > 0 ? s.currBalance / totalCLPFunds : 0;
      var sugCLP = leftToInvest * weight;
      var sc = sugCLP >= 0 ? 'var(--green)' : 'var(--amber)';
      return '<tr><td style="font-weight:700">' + s.fundName + '</td>' +
        '<td style="color:var(--muted)">' + (weight * 100).toFixed(1) + '%</td>' +
        '<td style="color:' + sc + ';font-weight:700">' + Fmt.clp(sugCLP) + '</td></tr>';
    }).join('');

    el.innerHTML = '<div style="background:rgba(139,92,246,.05);border:1px solid rgba(139,92,246,.2);border-radius:8px;padding:14px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<div style="font-size:12px;font-weight:700;color:var(--purple)">' + t('investments.suggest.title') + '</div>' +
        '<div style="font-family:var(--mono);font-size:12px">' +
          t('investments.suggest.savingsTarget') + ' <span style="color:var(--cyan)">' + Fmt.clp(savingsTarget) + '</span>&nbsp;&nbsp;' +
          t('investments.suggest.invested') + ' <span style="color:var(--amber)">' + Fmt.clp(investedThisMonth) + '</span>&nbsp;&nbsp;' +
          t('investments.suggest.available') + ' <span style="color:' + c + ';font-weight:700">' + Fmt.clp(leftToInvest) + '</span>' +
        '</div>' +
      '</div>' +
      (rows ? '<table><thead><tr><th>' + t('investments.suggest.tableClpFund') + '</th><th>' + t('investments.suggest.tableWeight') + '</th><th>' + t('investments.suggest.tableSuggest') + '</th></tr></thead><tbody>' + rows + '</tbody></table>' :
        '<p style="font-size:12px;color:var(--muted)">' + t('investments.suggest.noClpFunds') + '</p>') +
      '</div>';
  },

  deleteSnap: function(id) {
    if (!confirm(I18n.t('investments.confirm.deleteSnap'))) return;
    var d = this._get(); d.snapshots = (d.snapshots || []).filter(function(s) { return s.id !== id; });
    this._save(d); this.renderAll();
  },

  _renderCharts: function() {
    var snaps = this.getSnaps();
    if (!snaps.length) { Charts.destroy('ch-inv-hist'); Charts.destroy('ch-inv-ret'); return; }
    var funds = [], months = [];
    snaps.forEach(function(s) {
      if (funds.indexOf(s.fundName) === -1) funds.push(s.fundName);
      if (months.indexOf(s.month) === -1) months.push(s.month);
    });
    months.sort(); funds = funds.slice(0, 8);
    var histDS = funds.map(function(f, i) {
      return {label:f, borderColor:Charts.C[i % Charts.C.length], backgroundColor:'transparent',
        pointBackgroundColor:Charts.C[i % Charts.C.length], tension:0.3, borderWidth:2, pointRadius:3,
        data:months.map(function(m) { var s = snaps.filter(function(sn) { return sn.month === m && sn.fundName === f; })[0]; return s ? (s.currBalance || 0) * MarketData.getRate(s.currency) : null; })};
    });
    Charts.create('ch-inv-hist', 'line', months, histDS, {legend:true});
    var retDS = funds.map(function(f, i) {
      return {label:f, borderColor:Charts.C[i % Charts.C.length], backgroundColor:'transparent',
        pointBackgroundColor:Charts.C[i % Charts.C.length], tension:0.3, borderWidth:2, pointRadius:3,
        data:months.map(function(m) { var s = snaps.filter(function(sn) { return sn.month === m && sn.fundName === f; })[0]; return s ? s.returnPct : null; })};
    });
    Charts.create('ch-inv-ret', 'line', months, retDS, {pct:true, legend:true});
  }
};
