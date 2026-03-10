'use strict';
// ============================================================
// PROPERTIES FEATURE
// Depends on: Store, SK, Debug, Fmt, MarketData, uid, openModal, closeModal, I18n
// ============================================================
var Properties = {
  getAll:   function() { return Store.get(SK.properties, []); },
  getRents: function() { return Store.get(SK.rents, []); },
  getM2:    function() { return Store.get(SK.m2, []); },

  _defaults: function() {
    return [
      {id:'prop1', name:'Punta Arenas', address:'Av. Punta Arenas 6600', commune:'La Florida', unit:'#103 piso 1', sqm:69, bedrooms:2, bathrooms:2, layout:'2D2B', parking:'#233', storage:'#3', ufPrice:2641.45, ufFee:11.1331, totalInstallments:360, paidInstallments:63, bank:'Scotiabank', annualRate:3.77, creditType:'Semivariable 5y', notes:'Edif. #1 CP #8260090'},
      {id:'prop2', name:'Llanquihue #104', address:'Llanquihue 6290', commune:'La Florida', unit:'#104 piso 1', sqm:null, bedrooms:1, bathrooms:1, layout:'1D1B', parking:'#261', storage:'N/A', ufPrice:3406.67, ufFee:13.6038, totalInstallments:300, paidInstallments:21, bank:'Itau', annualRate:4.22, creditType:'Tasa fija', notes:'Edif. Mirador Activa A'},
      {id:'prop3', name:'Llanquihue #405', address:'Llanquihue 6290', commune:'La Florida', unit:'#405 piso 4', sqm:null, bedrooms:1, bathrooms:1, layout:'1D1B', parking:'N/A', storage:'#141', ufPrice:3385.56, ufFee:14.2966, totalInstallments:360, paidInstallments:23, bank:'BCI', annualRate:4.76, creditType:'Tasa fija', notes:'Edif. Mirador Activa B'}
    ];
  },

  _ensure: function() {
    if (!this.getAll().length) Store.set(SK.properties, this._defaults());
  },

  openModal: function(id) {
    this._ensure();
    var p = id ? this.getAll().filter(function(x) { return x.id === id; })[0] : null;
    document.getElementById('prop-modal-title').textContent = id
      ? I18n.t('properties.modal.titleEdit')
      : I18n.t('properties.modal.titleAdd');
    var map = [
      ['pr-id','id'],['pr-name','name'],['pr-addr','address'],['pr-commune','commune'],['pr-unit','unit'],
      ['pr-sqm','sqm'],['pr-beds','bedrooms'],['pr-baths','bathrooms'],['pr-layout','layout'],
      ['pr-parking','parking'],['pr-storage','storage'],['pr-ufprice','ufPrice'],['pr-uffee','ufFee'],
      ['pr-total','totalInstallments'],['pr-paid','paidInstallments'],['pr-bank','bank'],
      ['pr-rate','annualRate'],['pr-ctype','creditType'],['pr-notes','notes'],['pr-extra-comm','defaultExtraCommission']
    ];
    map.forEach(function(pair) {
      var e = document.getElementById(pair[0]);
      if (e) e.value = p ? (p[pair[1]] != null ? p[pair[1]] : '') : '';
    });
    openModal('m-property');
  },

  save: function() {
    var id = document.getElementById('pr-id').value || uid();
    var fv = function(sel) { return parseFloat(document.getElementById(sel).value) || null; };
    var iv = function(sel) { return parseInt(document.getElementById(sel).value) || null; };
    var sv = function(sel) { return document.getElementById(sel).value; };
    var p = {
      id:id, name:sv('pr-name'), address:sv('pr-addr'), commune:sv('pr-commune'), unit:sv('pr-unit'),
      sqm:fv('pr-sqm'), bedrooms:iv('pr-beds'), bathrooms:iv('pr-baths'), layout:sv('pr-layout'),
      parking:sv('pr-parking'), storage:sv('pr-storage'), ufPrice:fv('pr-ufprice'), ufFee:fv('pr-uffee'),
      totalInstallments:iv('pr-total'), paidInstallments:iv('pr-paid'), bank:sv('pr-bank'),
      annualRate:fv('pr-rate'), creditType:sv('pr-ctype'), notes:sv('pr-notes'),
      defaultExtraCommission:fv('pr-extra-comm') || 0
    };
    var all = this.getAll().filter(function(x) { return x.id !== id; }); all.push(p);
    Store.set(SK.properties, all);
    closeModal('m-property'); this.renderAll();
  },

  delete: function(id) {
    if (!confirm(I18n.t('properties.confirm.deleteProperty'))) return;
    Store.set(SK.properties, this.getAll().filter(function(p) { return p.id !== id; }));
    this.renderAll();
  },

  _commissionPct: 0,
  _editingRentId: null,
  _editingM2Id: null,

  openRentModal: function(id) {
    this._ensure();
    this._commissionPct = (Store.get(SK.config, {}).propCommission || 10);
    var lbl = document.getElementById('rn-commission-label');
    if (lbl) lbl.textContent = I18n.t('properties.modal.labelCommission') + ' (' + this._commissionPct + '%)';
    var sel = document.getElementById('rn-prop');
    sel.innerHTML = this.getAll().map(function(p) { return '<option value="' + p.id + '">' + p.name + ' ' + p.unit + '</option>'; }).join('');
    var title = document.querySelector('#m-rent .mtitle');
    if (id) {
      var r = this.getRents().filter(function(x) { return x.id === id; })[0];
      if (!r) return;
      this._editingRentId = id;
      if (title) title.textContent = I18n.t('properties.modal.titleEditRent');
      sel.value = r.propertyId;
      document.getElementById('rn-month').value = r.month;
      document.getElementById('rn-amount').value = r.amount || '';
      document.getElementById('rn-dividend').value = r.dividend || '';
      document.getElementById('rn-commission').value = r.commission || '';
      document.getElementById('rn-extra').value = r.extraCommission || '';
      document.getElementById('rn-income').value = r.additionalIncome || '';
      document.getElementById('rn-net').value = r.net || '';
      document.getElementById('rn-notes').value = r.notes || '';
    } else {
      this._editingRentId = null;
      if (title) title.textContent = I18n.t('properties.modal.titleAddRent');
      document.getElementById('rn-month').value = new Date().toISOString().slice(0, 7);
      ['rn-amount','rn-income','rn-dividend','rn-commission','rn-net','rn-notes'].forEach(function(eid) { document.getElementById(eid).value = ''; });
      var defProp = this.getAll().filter(function(x) { return x.id === sel.value; })[0];
      document.getElementById('rn-extra').value = defProp && defProp.defaultExtraCommission ? defProp.defaultExtraCommission : '';
    }
    openModal('m-rent');
  },

  onPropChange: function() {
    if (this._editingRentId) return;
    var sel = document.getElementById('rn-prop');
    var prop = this.getAll().filter(function(x) { return x.id === sel.value; })[0];
    document.getElementById('rn-extra').value = prop && prop.defaultExtraCommission ? prop.defaultExtraCommission : '';
    this.calcNet();
  },

  calcCommission: function() {
    var a = parseFloat(document.getElementById('rn-amount').value) || 0;
    document.getElementById('rn-commission').value = a ? Math.round(a * this._commissionPct / 100) : '';
    this.calcNet();
  },

  calcNet: function() {
    var a = parseFloat(document.getElementById('rn-amount').value) || 0;
    var i = parseFloat(document.getElementById('rn-income').value) || 0;
    var d = parseFloat(document.getElementById('rn-dividend').value) || 0;
    var c = parseFloat(document.getElementById('rn-commission').value) || 0;
    var e = parseFloat(document.getElementById('rn-extra').value) || 0;
    document.getElementById('rn-net').value = a + i - d - c - e;
  },

  saveRent: function() {
    var sel = document.getElementById('rn-prop');
    var r = {
      id: this._editingRentId || uid(), propertyId: sel.value,
      propertyName: sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '',
      month: document.getElementById('rn-month').value,
      amount: parseFloat(document.getElementById('rn-amount').value) || 0,
      dividend: parseFloat(document.getElementById('rn-dividend').value) || 0,
      commission: parseFloat(document.getElementById('rn-commission').value) || 0,
      extraCommission: parseFloat(document.getElementById('rn-extra').value) || 0,
      additionalIncome: parseFloat(document.getElementById('rn-income').value) || 0,
      net: parseFloat(document.getElementById('rn-net').value) || 0,
      notes: document.getElementById('rn-notes').value
    };
    var rents = this.getRents().filter(function(x) { return x.id !== r.id; }); rents.push(r);
    Store.set(SK.rents, rents);
    this._editingRentId = null;
    closeModal('m-rent'); this.renderAll();
  },

  openM2Modal: function(id) {
    this._ensure();
    var title = document.querySelector('#m-m2 .mtitle');
    var sel = document.getElementById('m2-prop');
    sel.innerHTML = this.getAll().map(function(p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('');
    if (id) {
      var m = this.getM2().filter(function(x) { return x.id === id; })[0];
      if (!m) return;
      this._editingM2Id = id;
      if (title) title.textContent = I18n.t('properties.modal.titleEditM2');
      sel.value = m.propertyId;
      document.getElementById('m2-month').value = m.month;
      document.getElementById('m2-val').value = m.value || '';
    } else {
      this._editingM2Id = null;
      if (title) title.textContent = I18n.t('properties.modal.titleAddM2');
      document.getElementById('m2-month').value = new Date().toISOString().slice(0, 7);
      document.getElementById('m2-val').value = '';
    }
    this._renderM2(); openModal('m-m2');
  },

  saveM2: function() {
    var data = this.getM2();
    var m = {
      id: this._editingM2Id || uid(),
      propertyId: document.getElementById('m2-prop').value,
      month: document.getElementById('m2-month').value,
      value: parseFloat(document.getElementById('m2-val').value) || 0
    };
    data = data.filter(function(x) { return x.id !== m.id; });
    data.push(m);
    Store.set(SK.m2, data);
    this._editingM2Id = null;
    closeModal('m-m2'); this._renderM2(); this.renderAll();
  },

  deleteM2: function(id) {
    if (!confirm(I18n.t('properties.confirm.deleteM2'))) return;
    Store.set(SK.m2, this.getM2().filter(function(m) { return m.id !== id; }));
    this._renderM2(); this.renderAll();
  },

  _renderM2: function() {
    var data = this.getM2().slice().sort(function(a, b) { return new Date(b.month + '-01') - new Date(a.month + '-01'); });
    var props = this.getAll(); var el = document.getElementById('m2-history'); if (!el) return;
    var t = I18n.t.bind(I18n);
    el.innerHTML = data.length ?
      '<table><thead><tr><th>' + t('properties.m2Table.property') + '</th><th>' + t('properties.m2Table.month') + '</th><th>' + t('properties.m2Table.value') + '</th><th></th></tr></thead><tbody>' +
      data.map(function(d) {
        var p = props.filter(function(x) { return x.id === d.propertyId; })[0];
        return '<tr><td>' + (p ? p.name : d.propertyId) + '</td><td>' + d.month + '</td><td>' + Fmt.clp(d.value) + '</td><td style="white-space:nowrap">' +
          '<button class="btn btn-ghost" style="padding:2px 7px;font-size:10px;margin-right:3px" onclick="Properties.openM2Modal(\'' + d.id + '\')">✎</button>' +
          '<button class="btn btn-red" style="padding:2px 7px;font-size:10px" onclick="Properties.deleteM2(\'' + d.id + '\')">×</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table>' :
      '<p style="font-size:12px;color:var(--muted)">' + t('properties.m2Table.noRecords') + '</p>';
  },

  deleteRent: function(id) {
    if (!confirm(I18n.t('properties.confirm.deleteRent'))) return;
    Store.set(SK.rents, this.getRents().filter(function(r) { return r.id !== id; }));
    this.renderAll();
  },

  calcTotalMortgageDebt: function() {
    var uf = MarketData.getUF(); var total = 0;
    this.getAll().forEach(function(p) {
      var rem = (p.totalInstallments || 0) - (p.paidInstallments || 0);
      total += p.ufFee && rem ? p.ufFee * rem * uf : 0;
    });
    return total;
  },

  renderAll: function() {
    this._ensure();
    var props = this.getAll(); var rents = this.getRents(); var uf = MarketData.getUF();
    var t = I18n.t.bind(I18n);
    var totalDebtUF = 0;
    props.forEach(function(p) {
      var rem = (p.totalInstallments || 0) - (p.paidInstallments || 0);
      totalDebtUF += p.ufFee && rem ? p.ufFee * rem : 0;
    });
    var yearPrefix = new Date().getFullYear() + '-01';
    var yearRents  = rents.filter(function(r) { return r.month >= yearPrefix; });
    var netYear    = yearRents.reduce(function(s, r) { return s + (r.net || 0); }, 0);
    var monthsWithData = new Set(yearRents.map(function(r) { return r.month; })).size;
    var netMonth   = monthsWithData > 0 ? netYear / monthsWithData : 0;

    document.getElementById('prop-kpis').innerHTML =
      '<div class="card-sm"><div class="metric-label">' + t('properties.kpi.count') + '</div><div class="metric-val" style="font-size:18px">' + props.length + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + t('properties.kpi.debtUF') + '</div><div class="metric-val" style="color:var(--red);font-size:17px">' + Fmt.uf(totalDebtUF) + '</div><div style="font-size:11px;color:var(--muted)">' + MarketData.formatShortPrimary(totalDebtUF * uf) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + t('properties.kpi.netMonth') + '</div><div class="metric-val" style="color:' + (netMonth >= 0 ? 'var(--green)' : 'var(--red)') + ';font-size:17px">' + MarketData.formatPrimary(netMonth) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + t('properties.kpi.netYear') + '</div><div class="metric-val" style="color:var(--amber);font-size:17px">' + MarketData.formatPrimary(netYear) + '</div></div>';

    var m2data = this.getM2();
    document.getElementById('prop-cards').innerHTML = props.map(function(p) {
      var rem = (p.totalInstallments || 0) - (p.paidInstallments || 0);
      var debtUF = p.ufFee && rem ? p.ufFee * rem : 0;
      var progress = p.totalInstallments ? (p.paidInstallments || 0) / p.totalInstallments * 100 : 0;
      var pRents = rents.filter(function(r) { return r.propertyId === p.id; }).sort(function(a, b) { return new Date(b.month + '-01') - new Date(a.month + '-01'); }).slice(0, 3);
      var pm2 = m2data.filter(function(m) { return m.propertyId === p.id; }).sort(function(a, b) { return new Date(b.month + '-01') - new Date(a.month + '-01'); });
      var lm2 = pm2[0]; var pvm2 = pm2[1]; var plus = (lm2 && pvm2) ? (lm2.value - pvm2.value) / pvm2.value * 100 : null;
      return '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">' +
          '<div><div style="font-size:15px;font-weight:800">' + p.name + '</div>' +
          '<div style="font-size:11px;color:var(--muted)">' + (p.address || '') + ' — ' + (p.unit || '') + '</div>' +
          '<div style="font-size:11px;color:var(--muted)">' + (p.commune || '') + '</div></div>' +
          '<div><span class="badge bb">' + (p.layout || '') + '</span>' + (p.sqm ? '<span class="badge bp" style="margin-left:4px">' + p.sqm + 'm²</span>' : '') + '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">' +
          '<div class="card-sm" style="padding:6px;text-align:center"><div style="font-size:9px;color:var(--muted)">' + t('properties.card.beds') + '</div><div style="font-weight:700">' + (p.bedrooms || '--') + '</div></div>' +
          '<div class="card-sm" style="padding:6px;text-align:center"><div style="font-size:9px;color:var(--muted)">' + t('properties.card.baths') + '</div><div style="font-weight:700">' + (p.bathrooms || '--') + '</div></div>' +
          '<div class="card-sm" style="padding:6px;text-align:center"><div style="font-size:9px;color:var(--muted)">' + t('properties.card.parking') + '</div><div style="font-weight:700;font-size:10px">' + (p.parking || '--') + '</div></div>' +
        '</div>' +
        '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="color:var(--muted)">' + t('properties.card.mortgage') + '</span><span>' + (p.paidInstallments || 0) + '/' + (p.totalInstallments || '?') + ' (' + progress.toFixed(0) + '%)</span></div><div class="pw"><div class="pf" style="width:' + progress.toFixed(0) + '%;background:var(--cyan)"></div></div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;font-family:var(--mono);margin-bottom:8px">' +
          '<div><span style="color:var(--muted)">' + t('properties.card.bank') + ' </span>' + (p.bank || '--') + '</div>' +
          '<div><span style="color:var(--muted)">' + t('properties.card.rate') + ' </span>' + (p.annualRate || '--') + '%</div>' +
          '<div><span style="color:var(--muted)">' + t('properties.card.fee') + ' </span>' + Fmt.uf(p.ufFee) + '</div>' +
          '<div><span style="color:var(--muted)">' + t('properties.card.clp') + ' </span>' + (p.ufFee ? Fmt.clp(p.ufFee * uf) : '--') + '</div>' +
          (debtUF ? '<div style="grid-column:1/-1"><span style="color:var(--muted)">' + t('properties.card.estDebt') + ' </span><span style="color:var(--red)">' + Fmt.uf(debtUF) + ' = ' + Fmt.clp(debtUF * uf) + '</span></div>' : '') +
          (lm2 && p.sqm ? '<div style="grid-column:1/-1"><span style="color:var(--muted)">' + t('properties.card.appreciation') + ' </span><span style="color:var(--green)">' + Fmt.clp(lm2.value * p.sqm) + '</span>' + (plus !== null ? ' <span style="color:' + (plus >= 0 ? 'var(--green)' : 'var(--red)') + '">' + Fmt.pct(plus) + '</span>' : '') + '</div>' : '') +
        '</div>' +
        (pRents.length ? '<div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:4px">' + t('properties.card.recentRents') + '</div>' +
          pRents.map(function(r) { return '<div style="display:flex;justify-content:space-between;font-size:11px;font-family:var(--mono);padding:2px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted)">' + r.month + '</span><span style="color:' + (r.net >= 0 ? 'var(--green)' : 'var(--red)') + '">' + Fmt.clp(r.net) + '</span></div>'; }).join('') : '') +
        (p.notes ? '<div style="font-size:11px;color:var(--muted);margin-top:8px">' + p.notes + '</div>' : '') +
        '<div style="display:flex;gap:6px;margin-top:10px">' +
          '<button class="btn btn-ghost" style="padding:3px 8px;font-size:11px" onclick="Properties.openModal(\'' + p.id + '\')">' + t('properties.card.edit') + '</button>' +
          '<button class="btn btn-red" style="padding:3px 8px;font-size:11px" onclick="Properties.delete(\'' + p.id + '\')">×</button>' +
        '</div>' +
        '</div>';
    }).join('');

    var sr = rents.slice().sort(function(a, b) { return new Date(b.month + '-01') - new Date(a.month + '-01'); });
    document.getElementById('prop-rents').innerHTML = sr.length ?
      '<table><thead><tr><th>' + t('properties.rentTable.property') + '</th><th>' + t('properties.rentTable.month') + '</th><th>' + t('properties.rentTable.rent') + '</th><th>' + t('properties.rentTable.additionalIncome') + '</th><th>' + t('properties.rentTable.dividend') + '</th><th>' + t('properties.rentTable.commission') + '</th><th>' + t('properties.rentTable.otherExpenses') + '</th><th>' + t('properties.rentTable.netFlow') + '</th><th>' + t('properties.rentTable.notes') + '</th><th></th></tr></thead><tbody>' +
      sr.map(function(r) {
        return '<tr><td>' + (r.propertyName || r.propertyId) + '</td>' +
          '<td style="color:var(--muted)">' + r.month + '</td>' +
          '<td>' + Fmt.clp(r.amount) + '</td>' +
          '<td style="color:var(--cyan)">' + (r.additionalIncome ? Fmt.clp(r.additionalIncome) : '<span style="color:var(--muted)">—</span>') + '</td>' +
          '<td style="color:var(--red)">' + Fmt.clp(r.dividend) + '</td>' +
          '<td style="color:var(--amber)">' + Fmt.clp(r.commission) + '</td>' +
          '<td style="color:var(--amber)">' + (r.extraCommission ? Fmt.clp(r.extraCommission) : '<span style="color:var(--muted)">—</span>') + '</td>' +
          '<td style="color:' + (r.net >= 0 ? 'var(--green)' : 'var(--red)') + '"><strong>' + Fmt.clp(r.net) + '</strong></td>' +
          '<td style="font-size:11px;color:var(--muted)">' + (r.notes || '') + '</td>' +
          '<td style="white-space:nowrap">' +
            '<button class="btn btn-ghost" style="padding:2px 7px;font-size:10px;margin-right:3px" onclick="Properties.openRentModal(\'' + r.id + '\')">✎</button>' +
            '<button class="btn btn-red" style="padding:2px 7px;font-size:10px" onclick="Properties.deleteRent(\'' + r.id + '\')">×</button>' +
          '</td></tr>';
      }).join('') + '</tbody></table>' :
      '<p style="font-size:13px;color:var(--muted);padding:16px">' + t('properties.rentTable.noRents') + '</p>';
  }
};
