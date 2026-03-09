'use strict';
// ============================================================
// GOALS FEATURE
// Depends on: Store, SK, Fmt, uid, openModal, closeModal
// ============================================================
var Goals = {
  getAll: function() { return Store.get(SK.goals, []); },

  openModal: function(id) {
    var g = id ? this.getAll().filter(function(x) { return x.id === id; })[0] : null;
    document.getElementById('go-id').value = id || '';
    document.getElementById('go-name').value = g ? g.name : '';
    document.getElementById('go-type').value = g ? g.type : 'months';
    document.getElementById('go-months').value = g ? (g.months || 6) : 6;
    document.getElementById('go-spend').value = g ? (g.monthlySpend || 0) : 0;
    document.getElementById('go-target').value = g ? (g.target || 0) : 0;
    document.getElementById('go-current').value = g ? (g.current || 0) : 0;
    document.getElementById('go-monthly').value = g ? (g.monthly || 0) : 0;
    document.getElementById('go-fund').value = g ? (g.linkedFund || '') : '';
    this.toggleType();
    openModal('m-goal');
  },

  toggleType: function() {
    var t = document.getElementById('go-type').value;
    document.getElementById('go-months-sec').style.display = t === 'fixed' ? 'none' : 'block';
    document.getElementById('go-fixed-sec').style.display  = t === 'fixed' ? 'block' : 'none';
  },

  save: function() {
    var type = document.getElementById('go-type').value;
    var months = parseFloat(document.getElementById('go-months').value) || 6;
    var ms = parseFloat(document.getElementById('go-spend').value) || 0;
    var target = type === 'fixed' ? parseFloat(document.getElementById('go-target').value) || 0 : months * ms;
    var g = {
      id: document.getElementById('go-id').value || uid(),
      name: document.getElementById('go-name').value,
      type: type, months: months, monthlySpend: ms, target: target,
      current: parseFloat(document.getElementById('go-current').value) || 0,
      monthly: parseFloat(document.getElementById('go-monthly').value) || 0,
      linkedFund: document.getElementById('go-fund').value
    };
    var all = this.getAll().filter(function(x) { return x.id !== g.id; });
    all.push(g); Store.set(SK.goals, all);
    closeModal('m-goal'); this.renderAll();
  },

  delete: function(id) {
    if (!confirm('Eliminar?')) return;
    Store.set(SK.goals, this.getAll().filter(function(g) { return g.id !== id; }));
    this.renderAll();
  },

  renderAll: function() {
    var goals = this.getAll(); var el = document.getElementById('goals-grid'); if (!el) return;
    if (!goals.length) {
      el.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;padding:32px"><p style="color:var(--muted)">Sin metas configuradas.</p></div>';
      return;
    }
    var tc = {months:'var(--green)', property:'var(--amber)', fixed:'var(--purple)'};
    el.innerHTML = goals.map(function(g) {
      var target = g.target || 1; var current = g.current || 0; var pct = Math.min(current / target * 100, 100);
      var miss = Math.max(target - current, 0); var mgo = g.monthly && miss ? Math.ceil(miss / g.monthly) : null;
      var color = tc[g.type] || 'var(--cyan)';
      var sclass = pct >= 100 ? 'bg' : pct >= 50 ? 'ba' : 'br';
      var stxt   = pct >= 100 ? 'META' : pct >= 50 ? 'EN PROG.' : 'PENDIENTE';
      return '<div class="card" style="border-color:' + color + '30">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">' +
          '<div style="font-size:14px;font-weight:800">' + g.name + '</div>' +
          '<span class="badge ' + sclass + '">' + stxt + '</span>' +
        '</div>' +
        (g.linkedFund ? '<div style="font-size:11px;color:var(--muted);margin-bottom:6px">via ' + g.linkedFund + '</div>' : '') +
        '<div class="pw" style="margin-bottom:6px"><div class="pf" style="width:' + pct.toFixed(0) + '%;background:' + color + '"></div></div>' +
        '<div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;margin-bottom:8px">' +
          '<span style="color:' + color + '">' + Fmt.short(current) + '</span>' +
          '<span style="color:var(--muted)">' + pct.toFixed(0) + '%</span>' +
          '<span style="color:var(--muted)">' + Fmt.short(target) + '</span>' +
        '</div>' +
        (miss > 0 ? '<div style="font-size:11px;color:var(--muted)">Faltante: <span style="color:var(--text)">' + Fmt.clp(miss) + '</span></div>' : '') +
        (mgo ? '<div style="font-size:11px;color:var(--muted)">~' + mgo + ' meses</div>' : '') +
        (g.type === 'months' && g.monthlySpend ? '<div style="font-size:11px;color:var(--muted)">Cubre ' + (current / g.monthlySpend).toFixed(1) + ' / ' + g.months + ' meses</div>' : '') +
        '<div style="display:flex;gap:6px;margin-top:10px">' +
          '<button class="btn btn-ghost" style="padding:3px 9px;font-size:11px" onclick="Goals.openModal(\'' + g.id + '\')">Editar</button>' +
          '<button class="btn btn-red" style="padding:3px 9px;font-size:11px" onclick="Goals.delete(\'' + g.id + '\')">×</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }
};
