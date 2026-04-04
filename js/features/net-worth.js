'use strict';
// ============================================================
// NET WORTH (PATRIMONIO NETO) FEATURE
// Read-only: aggregates data from Investments, PensionFunds, Properties.
// No localStorage of its own — pure calculation from other modules.
// Depends on: Investments, PensionFunds, Properties, MarketData, Fmt, I18n
// ============================================================
var NetWorth = {

  // ── Asset: latest snapshot balance per investment fund → CLP ──
  _getInvestmentBreakdown: function() {
    var funds = Investments.getFunds();
    var snaps = Investments.getSnaps();
    var items = [];
    var totalCLP = 0;

    funds.forEach(function(fund) {
      var latest = snaps
        .filter(function(s) { return s.fundId === fund.id; })
        .sort(function(a, b) { return b.month.localeCompare(a.month); })[0];

      if (!latest) return;
      var clp = (latest.currBalance || 0) * MarketData.getRate(latest.currency || fund.currency || 'CLP');
      totalCLP += clp;
      items.push({
        name: fund.name,
        balance: latest.currBalance || 0,
        currency: latest.currency || fund.currency || 'CLP',
        clpValue: clp
      });
    });

    return { items: items, totalCLP: totalCLP };
  },

  // ── Asset: pension fund balances → CLP ──
  _getPensionBreakdown: function() {
    var totalCLP = 0;
    var items = PensionFunds.getFunds().map(function(fund) {
      var clp = (fund.amount || 0) * MarketData.getRate(fund.currency || 'CLP');
      totalCLP += clp;
      return {
        name: fund.description,
        balance: fund.amount,
        currency: fund.currency || 'CLP',
        clpValue: clp
      };
    });
    return { items: items, totalCLP: totalCLP };
  },

  // ── Asset: property market value via m² or UF purchase price → CLP ──
  _getPropertyValueBreakdown: function() {
    var props  = Properties.getAll();
    var m2data = Properties.getM2();
    var uf     = MarketData.getUF();
    var totalCLP = 0;
    var items = [];

    props.forEach(function(p) {
      var pm2 = m2data
        .filter(function(m) { return m.propertyId === p.id; })
        .sort(function(a, b) { return b.month.localeCompare(a.month); });

      var clp, source;
      if (pm2.length && p.sqm) {
        clp    = pm2[0].value * p.sqm;   // CLP/m² × m²
        source = 'm2';
      } else if (p.ufPrice) {
        clp    = p.ufPrice * uf;          // purchase price fallback
        source = 'uf';
      } else {
        return;                           // no value data — skip
      }

      totalCLP += clp;
      items.push({ name: p.name, clpValue: clp, source: source });
    });

    return { items: items, totalCLP: totalCLP };
  },

  // ── Rendering ──

  renderAll: function() {
    var inv     = this._getInvestmentBreakdown();
    var pen     = this._getPensionBreakdown();
    var propVal = this._getPropertyValueBreakdown();
    var debt    = Properties.getDebtBreakdown();

    var totalAssets      = inv.totalCLP + pen.totalCLP + propVal.totalCLP;
    var totalLiabilities = debt.totalCLP;
    var netWorth         = totalAssets - totalLiabilities;
    var ratio            = totalLiabilities > 0 ? totalAssets / totalLiabilities : null;

    this._renderKPIs(totalAssets, totalLiabilities, netWorth, ratio);
    this._renderBreakdown(inv, pen, propVal, debt, totalAssets, totalLiabilities, netWorth);
  },

  _renderKPIs: function(assets, liabilities, netWorth, ratio) {
    var t  = I18n.t.bind(I18n);
    var el = document.getElementById('nw-kpis'); if (!el) return;
    var nwColor = netWorth >= 0 ? 'var(--green)' : 'var(--red)';
    el.innerHTML =
      '<div class="card-sm"><div class="metric-label">' + t('networth.kpi.assets') + '</div><div class="metric-val" style="color:var(--green)">' + MarketData.formatShortPrimary(assets) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + t('networth.kpi.liabilities') + '</div><div class="metric-val" style="color:var(--red)">' + MarketData.formatShortPrimary(liabilities) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + t('networth.kpi.netWorth') + '</div><div class="metric-val" style="color:' + nwColor + '">' + MarketData.formatShortPrimary(netWorth) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">' + t('networth.kpi.coverage') + '</div><div class="metric-val">' + (ratio !== null ? ratio.toFixed(2) + 'x' : '—') + '</div></div>';
  },

  _renderBreakdown: function(inv, pen, propVal, debt, totalAssets, totalLiabilities, netWorth) {
    var t = I18n.t.bind(I18n);

    // ── Helpers ──
    var row = function(label, clpVal) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)">' +
        '<span style="font-size:12px;color:var(--muted)">' + label + '</span>' +
        '<span style="font-size:12px;font-family:var(--mono);font-weight:600">' + MarketData.formatPrimary(clpVal) + '</span>' +
        '</div>';
    };

    var sectionHead = function(label, color) {
      return '<div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
             'color:' + color + ';margin:14px 0 6px;padding-bottom:4px;border-bottom:2px solid ' + color + '44">' +
             label + '</div>';
    };

    var subtotalRow = function(label, clpVal, color) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0">' +
        '<span style="font-size:11px;font-weight:700;color:' + color + '">' + label + '</span>' +
        '<span style="font-size:13px;font-family:var(--mono);font-weight:700;color:' + color + '">' + MarketData.formatPrimary(clpVal) + '</span>' +
        '</div>';
    };

    var emptyNote = function(text) {
      return '<div style="font-size:11px;color:var(--muted);padding:6px 0;font-style:italic">' + text + '</div>';
    };

    var totalBar = function(label, clpVal, color) {
      return '<div style="border-top:2px solid ' + color + ';margin-top:12px;padding-top:10px;' +
             'display:flex;justify-content:space-between;align-items:center">' +
             '<span style="font-size:13px;font-weight:800;color:' + color + '">' + label + '</span>' +
             '<span style="font-size:18px;font-family:var(--mono);font-weight:800;color:' + color + '">' + MarketData.formatPrimary(clpVal) + '</span>' +
             '</div>';
    };

    // ── ASSETS CARD ──
    var ah = '<div class="card">';
    ah += '<div class="sh" style="color:var(--green);margin-bottom:0">' + t('networth.assetsSection') + '</div>';

    ah += sectionHead(t('networth.items.investments'), 'var(--cyan)');
    if (inv.items.length === 0) {
      ah += emptyNote(t('networth.notes.investmentsEmpty'));
    } else {
      inv.items.forEach(function(item) { ah += row(item.name + ' (' + item.currency + ')', item.clpValue); });
      if (inv.items.length > 1) ah += subtotalRow(t('networth.items.investments'), inv.totalCLP, 'var(--cyan)');
    }

    ah += sectionHead(t('networth.items.pension'), 'var(--purple)');
    if (pen.items.length === 0) {
      ah += emptyNote(t('networth.notes.pensionEmpty'));
    } else {
      pen.items.forEach(function(item) { ah += row(item.name + ' (' + item.currency + ')', item.clpValue); });
      if (pen.items.length > 1) ah += subtotalRow(t('networth.items.pension'), pen.totalCLP, 'var(--purple)');
    }

    ah += sectionHead(t('networth.items.properties'), 'var(--amber)');
    if (propVal.items.length === 0) {
      ah += emptyNote(t('networth.notes.propertiesEmpty'));
    } else {
      propVal.items.forEach(function(item) {
        ah += row(item.name + ' · ' + t('networth.sources.' + item.source), item.clpValue);
      });
      if (propVal.items.length > 1) ah += subtotalRow(t('networth.items.properties'), propVal.totalCLP, 'var(--amber)');
    }

    ah += totalBar(t('networth.totalAssets'), totalAssets, 'var(--green)');
    ah += '</div>';

    // ── LIABILITIES CARD ──
    var lh = '<div class="card">';
    lh += '<div class="sh" style="color:var(--red);margin-bottom:0">' + t('networth.liabilitiesSection') + '</div>';

    lh += sectionHead(t('networth.items.mortgages'), 'var(--red)');
    if (debt.items.length === 0) {
      lh += emptyNote(t('networth.notes.mortgagesEmpty'));
    } else {
      debt.items.forEach(function(item) {
        lh += row(item.name + ' · ' + Fmt.uf(item.debtUF), item.clpValue);
      });
      if (debt.items.length > 1) lh += subtotalRow(t('networth.items.mortgages'), debt.totalCLP, 'var(--red)');
    }

    lh += totalBar(t('networth.totalLiabilities'), totalLiabilities, 'var(--red)');
    lh += '</div>';

    var bd = document.getElementById('nw-breakdown');
    if (bd) bd.innerHTML = ah + lh;

    // ── NET WORTH TOTAL ──
    var nwColor = netWorth >= 0 ? 'var(--green)' : 'var(--red)';
    var nwEl = document.getElementById('nw-total');
    if (nwEl) {
      nwEl.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
        '<div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + nwColor + ';margin-bottom:6px">' + t('networth.netWorth') + '</div>' +
        '<div style="font-size:12px;color:var(--muted);font-family:var(--mono)">' + t('networth.totalAssets') + ' − ' + t('networth.totalLiabilities') + '</div>' +
        '</div>' +
        '<div style="font-size:32px;font-family:var(--mono);font-weight:800;color:' + nwColor + ';letter-spacing:-1px">' + MarketData.formatPrimary(netWorth) + '</div>' +
        '</div>';
    }
  }
};
