'use strict';
// ============================================================
// EMERGENCY FUNDS FEATURE
// Depends on: Store, SK, Debug, Investments, Properties, Settings
// ============================================================
var EmergencyFunds = {
  // ========== DATA ACCESS ==========
  _defs: function() {
    return {
      funds: []  // Empty by default
    };
  },

  _get: function() {
    return Store.get(SK.emergency, this._defs());
  },

  _save: function(d) {
    Store.set(SK.emergency, d);
  },

  getFunds: function() {
    return this._get().funds || [];
  },

  // ========== CALCULATIONS ==========

  /**
   * Calcula el monto de la meta en CLP
   * @param {Object} fund - Fund object con goalType, goalValue
   * @param {number} salary - Sueldo actual en CLP (de Settings)
   * @param {number} monthlyDividends - Dividendos mensuales en CLP
   * @returns {number} Monto de la meta en CLP
   */
  calculateGoalAmount: function(fund, salary, monthlyDividends) {
    if (!fund) return 0;
    
    switch(fund.goalType) {
      case 'salary_months':
        return (salary || 0) * (fund.goalValue || 0);
      case 'dividend_months':
        return (monthlyDividends || 0) * (fund.goalValue || 0);
      case 'fixed_amount':
        return fund.goalValue || 0;
      default:
        return 0;
    }
  },

  /**
   * Obtiene el balance actual del fondo basado en la inversión
   * @param {string} investmentId - ID de la inversión
   * @returns {number} Balance actual en CLP o USD (según inversión)
   */
  calculateCurrentBalance: function(investmentId) {
    if (!investmentId) return 0;
    
    var snaps = Investments.getSnaps();
    var currentMonth = new Date().toISOString().slice(0, 7);
    
    // Busca el snapshot más reciente para esta inversión
    var relevantSnaps = snaps
      .filter(function(s) { return s.fundId === investmentId; })
      .sort(function(a, b) { return (b.month || '').localeCompare(a.month || ''); });
    
    if (relevantSnaps.length > 0) {
      return relevantSnaps[0].currBalance || 0;
    }
    return 0;
  },

  /**
   * Calcula el progreso hacia la meta
   * @param {number} currentBalance - Balance actual
   * @param {number} goalAmount - Monto de la meta
   * @returns {Object} {percentage, shortfall, met}
   */
  calculateProgress: function(currentBalance, goalAmount) {
    if (goalAmount <= 0) {
      return { percentage: 0, shortfall: goalAmount, met: false };
    }
    
    var percentage = Math.min(100, (currentBalance / goalAmount) * 100);
    var shortfall = Math.max(0, goalAmount - currentBalance);
    var met = currentBalance >= goalAmount;
    
    return { percentage: percentage, shortfall: shortfall, met: met };
  },

  /**
   * Obtiene la suma de dividendos mensuales de todas las propiedades
   * @returns {number} Suma de dividendos en CLP
   */
  getMonthlyDividends: function() {
    // La meta de "dividend_months" debe basarse en el costo mensual de
    // dividendos del último mes registrado, sumando todos los dividendos
    // de ese mes para todas las propiedades.
    var rents = Properties.getRents() || [];
    if (!rents.length) return 0;

    // encontrar el mes más reciente que tenga un dividend > 0
    var latestMonth = null;
    rents.forEach(function(r) {
      var d = parseFloat(r.dividend) || 0;
      if (d > 0) {
        if (!latestMonth || (r.month || '') > latestMonth) {
          latestMonth = r.month;
        }
      }
    });

    if (!latestMonth) return 0;

    // sumar todos los dividendos de ese mes
    var total = rents
      .filter(function(r) { return r.month === latestMonth; })
      .reduce(function(sum, r) { return sum + (parseFloat(r.dividend) || 0); }, 0);

    return total;
  },

  // ========== MODAL OPERATIONS ==========

  openAddModal: function() {
    // Limpiar formulario
    document.getElementById('emf-id').value = '';
    document.getElementById('emf-name').value = '';
    document.getElementById('emf-desc').value = '';
    document.getElementById('emf-notes').value = '';
    document.querySelector('input[name="emf-goal-type"][value="salary_months"]').checked = true;
    document.getElementById('emf-goal-value').value = '';
    document.getElementById('emf-investment').value = '';
    
    document.getElementById('emf-modal-title').textContent = 'Crear Fondo de Emergencia';
    this._populateInvestmentsList();
    this._updatePreview();
    openModal('m-emergency-fund');
  },

  openEditModal: function(fundId) {
    var fund = this.getFunds().filter(function(f) { return f.id === fundId; })[0];
    if (!fund) return;
    
    this._populateInvestmentsList();
    
    document.getElementById('emf-id').value = fund.id;
    document.getElementById('emf-name').value = fund.name || '';
    document.getElementById('emf-desc').value = fund.description || '';
    document.getElementById('emf-notes').value = fund.notes || '';
    
    // Set radio button
    var goalType = fund.goalType || 'salary_months';
    document.querySelector('input[name="emf-goal-type"][value="' + goalType + '"]').checked = true;
    
    document.getElementById('emf-goal-value').value = fund.goalValue || '';
    document.getElementById('emf-investment').value = fund.investmentId || '';
    
    document.getElementById('emf-modal-title').textContent = 'Editar Fondo de Emergencia';
    this._updatePreview();
    openModal('m-emergency-fund');
  },

  closeModal: function() {
    closeModal('m-emergency-fund');
  },

  _populateInvestmentsList: function() {
    var select = document.getElementById('emf-investment');
    var funds = Investments.getFunds();
    select.innerHTML = '<option value="">-- Selecciona una inversión --</option>' +
      funds.map(function(f) {
        return '<option value="' + f.id + '">' + f.name + ' (' + f.currency + ')</option>';
      }).join('');
  },

  _updatePreview: function() {
    var goalType = document.querySelector('input[name="emf-goal-type"]:checked').value;
    var goalValue = parseFloat(document.getElementById('emf-goal-value').value) || 0;
    var investmentId = document.getElementById('emf-investment').value;
    
    var salary = (Store.get(SK.config, {}) || {}).salary || 0;
    var monthlyDividends = this.getMonthlyDividends();
    var currentBalance = this.calculateCurrentBalance(investmentId);
    
    var goal = this.calculateGoalAmount(
      { goalType: goalType, goalValue: goalValue },
      salary,
      monthlyDividends
    );
    
    var progress = this.calculateProgress(currentBalance, goal);
    
    var preview = document.getElementById('emf-preview');
    if (goal > 0) {
      preview.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-family:var(--mono);font-size:12px">' +
        '<div><div style="color:var(--muted)">META</div><div style="font-size:14px">' + Fmt.short(goal) + '</div></div>' +
        '<div><div style="color:var(--muted)">BALANCE</div><div style="font-size:14px">' + Fmt.short(currentBalance) + '</div></div>' +
        '<div><div style="color:var(--muted)">FALTANTE</div><div style="font-size:14px;color:' + (progress.shortfall > 0 ? 'var(--amber)' : 'var(--green)') + '">' + Fmt.short(progress.shortfall) + '</div></div>' +
        '<div><div style="color:var(--muted)">AVANCE</div><div style="font-size:14px;color:' + (progress.percentage >= 100 ? 'var(--green)' : 'var(--cyan)') + '">' + Fmt.pct(progress.percentage) + '</div></div>' +
        '</div>';
    } else {
      preview.innerHTML = '<div style="font-size:12px;color:var(--muted)">Completa los campos para ver preview</div>';
    }
  },

  saveFund: function() {
    var id = document.getElementById('emf-id').value;
    var name = document.getElementById('emf-name').value || '';
    var desc = document.getElementById('emf-desc').value || '';
    var notes = document.getElementById('emf-notes').value || '';
    var goalType = document.querySelector('input[name="emf-goal-type"]:checked').value;
    var goalValue = parseFloat(document.getElementById('emf-goal-value').value) || 0;
    var investmentId = document.getElementById('emf-investment').value;
    
    // Validations
    if (!name.trim()) {
      Debug.warn('El nombre del fondo es requerido');
      return;
    }
    if (!investmentId) {
      Debug.warn('Debes seleccionar una inversión');
      return;
    }
    if (goalValue <= 0) {
      Debug.warn('El valor de la meta debe ser mayor a 0');
      return;
    }
    
    var data = this._get();
    var fund = {
      id: id || uid(),
      name: name,
      description: desc,
      notes: notes,
      goalType: goalType,
      goalValue: goalValue,
      investmentId: investmentId,
      createdAt: id ? (this.getFunds().filter(function(f) { return f.id === id; })[0] || {}).createdAt : new Date().toISOString()
    };
    
    if (id) {
      // Update existing
      data.funds = data.funds.map(function(f) { return f.id === id ? fund : f; });
    } else {
      // Add new
      data.funds.push(fund);
    }
    
    this._save(data);
    Debug.info('Fondo guardado: ' + name);
    this.closeModal();
    this.renderAll();
  },

  deleteFund: function(fundId) {
    if (!confirm('¿Eliminar este fondo de emergencia?')) return;
    
    var data = this._get();
    data.funds = data.funds.filter(function(f) { return f.id !== fundId; });
    this._save(data);
    Debug.info('Fondo eliminado');
    this.renderAll();
  },

  // ========== RENDERING ==========

  renderAll: function() {
    this.renderKPIs();
    this.renderFunds();
  },

  renderKPIs: function() {
    var funds = this.getFunds();
    var salary = (Store.get(SK.config, {}) || {}).salary || 0;
    var monthlyDividends = this.getMonthlyDividends();
    
    var totalGoal = 0;
    var totalBalance = 0;
    var avgProgress = 0;
    var fundCount = funds.length;
    
    funds.forEach(function(fund) {
      var goal = EmergencyFunds.calculateGoalAmount(fund, salary, monthlyDividends);
      var balance = EmergencyFunds.calculateCurrentBalance(fund.investmentId);
      var progress = EmergencyFunds.calculateProgress(balance, goal);
      
      totalGoal += goal;
      totalBalance += balance;
      avgProgress += progress.percentage;
    });
    
    if (fundCount > 0) avgProgress = avgProgress / fundCount;
    var totalShortfall = Math.max(0, totalGoal - totalBalance);
    
    var el = document.getElementById('emf-kpis'); if (!el) return;
    el.innerHTML =
      '<div class="card-sm"><div class="metric-label">Meta Total</div><div class="metric-val">' + Fmt.short(totalGoal) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">Balance Total</div><div class="metric-val" style="color:var(--green)">' + Fmt.short(totalBalance) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">Faltante</div><div class="metric-val" style="color:var(--amber)">' + Fmt.short(totalShortfall) + '</div></div>' +
      '<div class="card-sm"><div class="metric-label">Avance Promedio</div><div class="metric-val" style="color:' + (avgProgress >= 100 ? 'var(--green)' : 'var(--cyan)') + '">' + Fmt.pct(avgProgress) + '</div></div>';
  },

  renderFunds: function() {
    var funds = this.getFunds();
    var salary = (Store.get(SK.config, {}) || {}).salary || 0;
    var monthlyDividends = this.getMonthlyDividends();
    
    var html = '';
    
    if (funds.length === 0) {
      html = '<div style="text-align:center;padding:40px;color:var(--muted)">' +
             '<div style="font-size:14px">Aún no hay fondos de emergencia</div>' +
             '<div style="font-size:12px;margin-top:8px">Crea uno para comenzar a rastrear tus metas</div>' +
             '</div>';
    } else {
      var self = this;
      html = funds.map(function(fund) {
        var goal = EmergencyFunds.calculateGoalAmount(fund, salary, monthlyDividends);
        var balance = EmergencyFunds.calculateCurrentBalance(fund.investmentId);
        var progress = EmergencyFunds.calculateProgress(balance, goal);
        
        // Find investment name
        var invName = Investments.getFunds()
          .filter(function(f) { return f.id === fund.investmentId; })[0];
        invName = invName ? invName.name : 'Inversión desconocida';
        
        var goalLabel = '';
        if (fund.goalType === 'salary_months') {
          goalLabel = fund.goalValue + ' meses de sueldo';
        } else if (fund.goalType === 'dividend_months') {
          goalLabel = fund.goalValue + ' meses de dividendos';
        } else if (fund.goalType === 'fixed_amount') {
          goalLabel = Fmt.short(fund.goalValue) + ' fijo';
        }
        
        return '<div class="card" style="margin-bottom:14px">' +
               '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">' +
               '<div>' +
               '<div style="font-weight:700;font-size:15px">' + fund.name + '</div>' +
               '<div style="color:var(--muted);font-size:11px;margin-top:4px">' + fund.description + '</div>' +
               '<div style="color:var(--muted);font-size:11px;margin-top:6px">' + invName + ' · ' + goalLabel + '</div>' +
               (fund.notes ? '<div style="color:var(--muted);font-size:11px;margin-top:4px;font-style:italic">' + fund.notes + '</div>' : '') +
               '</div>' +
               '<div style="display:flex;gap:6px">' +
               '<button class="btn btn-ghost" style="padding:3px 8px;font-size:11px" onclick="EmergencyFunds.openEditModal(\'' + fund.id + '\')">Editar</button>' +
               '<button class="btn btn-red" style="padding:3px 8px;font-size:11px" onclick="EmergencyFunds.deleteFund(\'' + fund.id + '\')">×</button>' +
               '</div>' +
               '</div>' +
               
               '<div style="margin-bottom:12px">' +
               '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">' +
               '<span style="color:var(--muted)">Progreso</span>' +
               '<span style="font-weight:600;color:' + (progress.met ? 'var(--green)' : 'var(--cyan)') + '">' + Fmt.pct(progress.percentage) + '</span>' +
               '</div>' +
               self._renderProgressBar(progress.percentage) +
               '</div>' +
               
               '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:12px;font-family:var(--mono)">' +
               '<div><div style="color:var(--muted);font-size:10px">BALANCE</div><div style="font-size:14px;font-weight:600">' + Fmt.short(balance) + '</div></div>' +
               '<div><div style="color:var(--muted);font-size:10px">META</div><div style="font-size:14px;font-weight:600">' + Fmt.short(goal) + '</div></div>' +
               '<div><div style="color:var(--muted);font-size:10px">FALTANTE</div><div style="font-size:14px;font-weight:600;color:' + (progress.shortfall > 0 ? 'var(--amber)' : 'var(--green)') + '">' + Fmt.short(progress.shortfall) + '</div></div>' +
               '</div>' +
               
               '</div>';
      }).join('');
    }
    
    var container = document.getElementById('emf-funds');
    if (container) container.innerHTML = html;
  },

  _renderProgressBar: function(percentage) {
    var pct = Math.min(100, percentage).toFixed(0);
    var color = percentage >= 100 ? 'var(--green)' : 'var(--cyan)';
    return '<div class="pw"><div class="pf" style="width:' + pct + '%;background:' + color + '"></div></div>';
  }
};
