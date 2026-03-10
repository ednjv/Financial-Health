'use strict';
// ============================================================
// FORMATTING UTILITIES
// ============================================================
var Fmt = {
  clp: function(v) {
    if (v == null) return '--';
    return new Intl.NumberFormat('es-CL', {style:'currency', currency:'CLP', maximumFractionDigits:0}).format(v);
  },
  num: function(v, d) {
    d = d != null ? d : 2;
    return v == null ? '--' : new Intl.NumberFormat('es-CL', {maximumFractionDigits:d}).format(v);
  },
  pct: function(v) {
    return v == null ? '--' : (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
  },
  short: function(v) {
    if (v == null) return '--';
    var a = Math.abs(v);
    if (a >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
    return '$' + Math.round(v);
  },
  delta: function(v) {
    if (v == null) return '--';
    var c = v >= 0 ? 'var(--green)' : 'var(--red)';
    return '<span style="color:' + c + '">' + Fmt.pct(v) + '</span>';
  },
  uf: function(v) {
    return v == null ? '--' : Fmt.num(v, 2) + ' UF';
  },
  // Format a non-CLP foreign currency amount using native symbol
  foreign: function(v, code) {
    if (v == null) return '--';
    if (code === 'CLP') return Fmt.clp(v);
    try {
      return new Intl.NumberFormat('en-US', {style:'currency', currency:code, maximumFractionDigits:2}).format(v);
    } catch(e) { return code + '\u00a0' + v.toFixed(2); }
  }
};
