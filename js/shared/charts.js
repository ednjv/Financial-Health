'use strict';
// ============================================================
// CHART.JS WRAPPER
// Depends on: Chart.js (CDN), Fmt
// ============================================================
var Charts = {
  _inst: {},
  C: ['#00d4ff','#8b5cf6','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#a855f7'],

  destroy: function(id) {
    if (this._inst[id]) { try { this._inst[id].destroy(); } catch(e) {} delete this._inst[id]; }
  },

  create: function(id, type, labels, datasets, opts) {
    this.destroy(id);
    var ctx = document.getElementById(id); if (!ctx) return;
    var isPie = type === 'pie' || type === 'doughnut';
    var baseOpts = {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {display:isPie, position:'bottom', labels:{color:'#94a3b8', font:{family:"'JetBrains Mono',monospace", size:9}, boxWidth:8}},
        tooltip: {
          backgroundColor:'#161b27', borderColor:'rgba(255,255,255,0.1)', borderWidth:1,
          titleColor:'#edf2f7', bodyColor:'#94a3b8',
          titleFont:{family:"'Inter',sans-serif", weight:'700', size:11},
          bodyFont:{family:"'JetBrains Mono',monospace", size:10},
          callbacks: {label: function(c) { return ' ' + Fmt.clp(c.raw); }}
        }
      },
      scales: isPie ? {} : {
        x: {grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{family:"'JetBrains Mono',monospace", size:9}}},
        y: {grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{family:"'JetBrains Mono',monospace", size:9}, callback:function(v){return Fmt.short(v);}}}
      }
    };
    if (opts) {
      if (opts.indexAxis)  baseOpts.indexAxis = opts.indexAxis;
      if (opts.legendRight) { baseOpts.plugins.legend.display = true; baseOpts.plugins.legend.position = 'right'; }
      if (opts.noLegend)   baseOpts.plugins.legend.display = false;
      if (opts.pct)        baseOpts.plugins.tooltip.callbacks.label = function(c) { return ' ' + (c.raw != null ? c.raw.toFixed(2) + '%' : '--'); };
    }
    this._inst[id] = new Chart(ctx, {type:type, data:{labels:labels, datasets:datasets}, options:baseOpts});
    return this._inst[id];
  }
};
