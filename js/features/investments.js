'use strict';
// ============================================================
// INVESTMENTS FEATURE
// Depends on: Store, SK, Debug, Fmt, Charts, MarketData, I18n
// ============================================================
var Investments = {
  _defs: function() {
    return [
      {id:'fintual',  name:'Fintual',             currency:'CLP', desc:'Fondo mutuo mixto'},
      {id:'itaudin',  name:'FFMM Itau Dinamico',  currency:'CLP', desc:'Fondo Itau Dinámico'},
      {id:'quilter',  name:'Quilter/Utmost',       currency:'USD', desc:'Portafolio internacional'},
      {id:'ib',       name:'Interactive Brokers',  currency:'USD', desc:'Broker internacional'},
      {id:'ml',       name:'MercadoLibre',         currency:'CLP', desc:'Fondo ML'},
      {id:'scotia',   name:'FM Scotia USA',        currency:'CLP', desc:'FM Scotia Acciones USA'},
      {id:'global66', name:'Global66 USD',         currency:'USD', desc:'Multi-divisa'}
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

  prevMonth: function() {
    var m = document.getElementById('inv-month').value || new Date().toISOString().slice(0, 7);
    var d = new Date(m + '-01'); d.setMonth(d.getMonth() - 1);
    document.getElementById('inv-month').value = d.toISOString().slice(0, 7);
    Investments.renderAll();
  },

  nextMonth: function() {
    var m = document.getElementById('inv-month').value || new Date().toISOString().slice(0, 7);
    var d = new Date(m + '-01'); d.setMonth(d.getMonth() + 1);
    document.getElementById('inv-month').value = d.toISOString().slice(0, 7);
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
    if (snap) {
      sel.value = snap.fundId;
      document.getElementById('sn-prev').value = snap.prevBalance || '';
      document.getElementById('sn-curr').value = snap.currBalance || '';
      document.getElementById('sn-currency').value = snap.currency || 'CLP';
    } else {
      document.getElementById('sn-prev').value = '';
      document.getElementById('sn-curr').value = '';
    }
    this.calcRet();
    openModal('m-snapshot');
  },

  calcRet: function() {
    var prev = parseFloat(document.getElementById('sn-prev').value) || 0;
    var curr = parseFloat(document.getElementById('sn-curr').value) || 0;
    if (prev && curr) {
      var ret = (curr - prev) / prev * 100; var diff = curr - prev;
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
    var snap = {
      id: existingId || uid(),
      month: snapMonth, fundId: fid, fundName: fund ? fund.name : fid,
      currency: document.getElementById('sn-currency').value,
      prevBalance: prev, currBalance: curr,
      invested: parseFloat(document.getElementById('sn-invested').value) || 0,
      returnPct: prev ? (curr - prev) / prev * 100 : 0,
      clpRate: MarketData.getRate(document.getElementById('sn-currency').value)
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

  openFundModal: function() { this._renderFundList(); openModal('m-funds'); },

  _renderFundList: function() {
    var el = document.getElementById('funds-list'); if (!el) return;
    el.innerHTML = this.getFunds().map(function(f) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">' +
        '<div><span style="font-weight:700;font-size:13px">' + f.name + '</span>' +
        '<span class="badge bb" style="margin-left:6px">' + f.currency + '</span>' +
        '<div style="font-size:11px;color:var(--muted)">' + (f.desc || '') + '</div></div>' +
        '<button class="btn btn-red" style="padding:3px 8px;font-size:11px" onclick="Investments.deleteFund(\'' + f.id + '\')">×</button></div>';
    }).join('');
  },

  saveFund: function() {
    var name = document.getElementById('fn-name').value.trim(); if (!name) return;
    var d = this._get(); if (!d.funds || !d.funds.length) d.funds = this._defs();
    d.funds.push({id:uid(), name:name, currency:document.getElementById('fn-currency').value, desc:document.getElementById('fn-desc').value});
    this._save(d);
    document.getElementById('fn-name').value = ''; document.getElementById('fn-desc').value = '';
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
      totalCLP += ((s.currBalance || 0) * MarketData.getRate(s.currency));
      totalRet += (s.returnPct || 0); totalInv += (s.invested || 0);
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
    el.innerHTML = '<table><thead><tr><th>' + t('investments.table.fund') + '</th><th>' + t('investments.table.currency') + '</th><th>' + t('investments.table.prev') + '</th><th>' + t('investments.table.curr') + '</th><th>' + t('investments.table.return') + '</th><th>' + t('investments.table.clpEquiv') + '</th><th>' + t('investments.table.portPct') + '</th><th>' + t('investments.table.invested') + '</th><th></th></tr></thead><tbody>' +
      snaps.map(function(s) {
        var clp = (s.currBalance || 0) * MarketData.getRate(s.currency);
        var pct = totalCLP ? clp / totalCLP * 100 : 0;
        var prev  = Fmt.foreign(s.prevBalance, s.currency);
        var curr2 = Fmt.foreign(s.currBalance, s.currency);
        return '<tr><td style="font-weight:700">' + s.fundName + '</td>' +
          '<td><span class="badge bb">' + s.currency + '</span></td>' +
          '<td>' + prev + '</td><td>' + curr2 + '</td>' +
          '<td>' + Fmt.delta(s.returnPct) + '</td>' +
          '<td>' + Fmt.clp(clp) + '</td>' +
          '<td><div style="display:flex;align-items:center;gap:5px"><div class="pw" style="width:50px"><div class="pf" style="width:' + Math.min(pct, 100).toFixed(0) + '%;background:var(--purple)"></div></div><span style="font-size:9px">' + pct.toFixed(0) + '%</span></div></td>' +
          '<td style="color:var(--amber)">' + (s.invested ? Fmt.clp(s.invested) : '--') + '</td>' +
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
      investedThisMonth = snaps.reduce(function(s, x) { return s + (x.invested || 0); }, 0);
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
