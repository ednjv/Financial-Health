'use strict';
// ============================================================
// MONTH PICKER — custom month/year selector
// Replaces <input type="month"> with a styled picker popover
// Usage: MonthPicker.attach('input-id') after DOM ready
// Depends on: I18n
// ============================================================
var MonthPicker = (function() {
  var _orig = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  var _instances = {};

  function attach(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;

    // ── 1. Wrap input in container ──────────────────────────
    var wrap = document.createElement('div');
    wrap.className = 'mp-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.style.display = 'none';

    // ── 2. Trigger button ───────────────────────────────────
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mp-btn';
    wrap.insertBefore(btn, input);

    // ── 3. Popover ──────────────────────────────────────────
    var pop = document.createElement('div');
    pop.className = 'mp-pop';
    pop.innerHTML =
      '<div class="mp-yr-row">' +
        '<button type="button" class="mp-yr-btn mp-py">&#9664;</button>' +
        '<span class="mp-yr-num"></span>' +
        '<button type="button" class="mp-yr-btn mp-ny">&#9654;</button>' +
      '</div>' +
      '<div class="mp-grid"></div>';
    wrap.appendChild(pop);

    var ynEl  = pop.querySelector('.mp-yr-num');
    var grid  = pop.querySelector('.mp-grid');
    var pyBtn = pop.querySelector('.mp-py');
    var nyBtn = pop.querySelector('.mp-ny');

    var displayYear = null; // null = follow input value

    // ── Helpers ─────────────────────────────────────────────
    function getRaw()  { return _orig.get.call(input); }
    function getVal()  { return getRaw() || new Date().toISOString().slice(0, 7); }
    function getYear() { return displayYear !== null ? displayYear : parseInt(getVal().split('-')[0]); }

    function renderBtn() {
      var v = getVal();
      var p = v.split('-');
      var months = I18n.months();
      btn.textContent = months[parseInt(p[1]) - 1].slice(0, 3) + ' ' + p[0];
    }

    function renderGrid() {
      var v      = getVal();
      var selYr  = parseInt(v.split('-')[0]);
      var selMo  = parseInt(v.split('-')[1]);
      var yr     = getYear();
      var months = I18n.months();

      ynEl.textContent = yr;
      grid.innerHTML = months.map(function(name, i) {
        var sel = (yr === selYr && i + 1 === selMo) ? ' sel' : '';
        return '<button type="button" class="mp-m' + sel + '" data-m="' + (i + 1) + '">' +
               name.slice(0, 3) + '</button>';
      }).join('');

      grid.querySelectorAll('.mp-m').forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          var newVal = String(getYear()) + '-' + String(parseInt(this.dataset.m)).padStart(2, '0');
          _orig.set.call(input, newVal);
          displayYear = null;
          closePop();
          renderBtn();
          input.dispatchEvent(new Event('change'));
        });
      });
    }

    function openPop() {
      displayYear = null;
      renderGrid();
      pop.classList.add('open');
      btn.classList.add('open');
    }

    function closePop() {
      pop.classList.remove('open');
      btn.classList.remove('open');
    }

    // ── Intercept .value setter so button stays in sync ─────
    Object.defineProperty(input, 'value', {
      get: function() { return _orig.get.call(this); },
      set: function(v) {
        _orig.set.call(this, v);
        renderBtn();
      },
      configurable: true
    });

    // ── Events ───────────────────────────────────────────────
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      pop.classList.contains('open') ? closePop() : openPop();
    });

    pyBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      displayYear = getYear() - 1;
      renderGrid();
    });

    nyBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      displayYear = getYear() + 1;
      renderGrid();
    });

    document.addEventListener('click', function(e) {
      if (!wrap.contains(e.target)) closePop();
    });

    renderBtn();

    _instances[inputId] = { renderBtn: renderBtn };
  }

  function refreshAll() {
    Object.keys(_instances).forEach(function(id) {
      _instances[id].renderBtn();
    });
  }

  return { attach: attach, refreshAll: refreshAll };
})();
