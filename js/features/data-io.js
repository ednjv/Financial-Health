'use strict';
// ============================================================
// DATA I/O — export, import, clear
// Depends on: Store, SK, Debug, App
// ============================================================
var DataIO = {
  exportAll: function() {
    var data = {_meta: {version:'1.2', ts:new Date().toISOString(), app:'SaludFinanciera'}};
    Store.keys().forEach(function(k) { data[k] = Store.get(k); });
    var blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'salud-financiera-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    Debug.info('Data exported');
  },

  importAll: function(evt) {
    var file = evt.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result); var count = 0;
        Object.keys(data).forEach(function(k) { if (k.indexOf('sfv1:') === 0) { Store.set(k, data[k]); count++; } });
        Debug.info('Imported ' + count + ' keys');
        alert('Importados ' + count + ' registros');
        App.init();
      } catch(err) { Debug.err('Import: ' + err.message); alert('Error: ' + err.message); }
    };
    reader.readAsText(file);
  },

  clearAll: function() {
    if (!confirm('Borrar TODOS los datos locales? No se puede deshacer.')) return;
    Store.keys().forEach(function(k) { Store.del(k); });
    Debug.warn('All data cleared');
    location.reload();
  }
};
