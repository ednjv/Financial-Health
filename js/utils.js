'use strict';
// ============================================================
// APP UTILITIES — navigation, modals, uid
// Depends on: Debug, Investments, Goals, Properties, Settings
// ============================================================

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function openModal(id) {
  var e = document.getElementById(id); if (e) e.className = 'modal-bg open';
}

function closeModal(id) {
  var e = document.getElementById(id); if (e) e.className = 'modal-bg';
}

function nav(view) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var v = document.getElementById('view-' + view); if (v) v.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n) {
    if ((n.getAttribute('onclick') || '').indexOf("'" + view + "'") !== -1) n.classList.add('active');
  });
  Debug.info('nav → ' + view);
  if (view === 'investments') Investments.renderAll();
  if (view === 'goals')       Goals.renderAll();
  if (view === 'properties')  Properties.renderAll();
  if (view === 'settings')    Settings.load();
}

// Close modal on backdrop click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-bg')) e.target.className = 'modal-bg';
});
