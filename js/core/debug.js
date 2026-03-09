'use strict';
// ============================================================
// DEBUG CONSOLE
// ============================================================
var Debug = {
  _e: [], _rc: 0, _ec: 0, _open: false,

  _log: function(cls, pfx, msg, data) {
    var ts = new Date().toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    var e = {ts:ts, cls:cls, pfx:pfx, msg:msg, data:data};
    this._e.push(e);
    this._render(e);
    if (cls === 'dl-req') { this._rc++; var el = document.getElementById('dbg-req-count'); if (el) el.textContent = this._rc + ' req'; }
    if (cls === 'dl-err') { this._ec++; var el2 = document.getElementById('dbg-err-count'); if (el2) el2.textContent = this._ec + ' err'; }
  },

  _render: function(e) {
    var el = document.getElementById('debug-log'); if (!el) return;
    var f = document.getElementById('debug-filter'); var fv = f ? f.value : '';
    var txt = e.ts + ' [' + e.pfx + '] ' + e.msg;
    if (fv && txt.toLowerCase().indexOf(fv.toLowerCase()) === -1) return;
    var d = document.createElement('div'); d.className = e.cls; d.textContent = txt;
    if (e.data) {
      var p = document.createElement('div'); p.className = 'dl-data';
      var s = ''; try { s = JSON.stringify(e.data, null, 2); } catch(x) { s = String(e.data); }
      p.textContent = s.length > 1200 ? s.slice(0, 1200) + '...[trunc]' : s;
      d.appendChild(p);
    }
    el.appendChild(d); el.scrollTop = el.scrollHeight;
  },

  info:  function(m, d) { this._log('dl-info', 'INFO', m, d); },
  req:   function(m, d) { this._log('dl-req',  'REQ',  m, d); },
  res:   function(m, d) { this._log('dl-res',  'RES',  m, d); },
  err:   function(m, d) { this._log('dl-err',  'ERR',  m, d); },
  warn:  function(m, d) { this._log('dl-warn', 'WARN', m, d); },

  toggle: function() {
    this._open = !this._open;
    document.getElementById('debug-panel').className = this._open ? 'open' : '';
    document.getElementById('main').style.paddingBottom = this._open ? '225px' : '';
  },

  clear: function() {
    this._e = []; this._rc = 0; this._ec = 0;
    document.getElementById('debug-log').innerHTML = '';
    document.getElementById('dbg-req-count').textContent = '0 req';
    document.getElementById('dbg-err-count').textContent = '0 err';
    this.info('Console cleared');
  },

  applyFilter: function() {
    var el = document.getElementById('debug-log'); el.innerHTML = '';
    var fv = (document.getElementById('debug-filter') || {}).value || '';
    for (var i = 0; i < this._e.length; i++) {
      var e = this._e[i];
      var t = e.ts + ' [' + e.pfx + '] ' + e.msg;
      if (!fv || t.toLowerCase().indexOf(fv.toLowerCase()) !== -1) this._render(e);
    }
  },

  copyAll: function() {
    var lines = this._e.map(function(e) {
      var s = e.ts + ' [' + e.pfx + '] ' + e.msg;
      if (e.data) { try { s += '\n' + JSON.stringify(e.data, null, 2); } catch(x) {} }
      return s;
    }).join('\n');
    navigator.clipboard.writeText(lines).then(function() { alert('Copiado'); });
  }
};
