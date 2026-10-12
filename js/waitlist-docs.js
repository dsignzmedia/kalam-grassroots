/* Waiting list — resume / cover-letter uploads (checked in the browser) and the sample viewer. */
(function () {
  'use strict';
  var MAX = 5 * 1024 * 1024, OK = /\.(pdf|docx?|jpe?g|png)$/i;
  [].slice.call(document.querySelectorAll('[data-file]')).forEach(function (box) {
    var input = box.querySelector('input[type=file]'), name = box.querySelector('[data-file-name]'), err = box.querySelector('[data-file-err]');
    input.addEventListener('change', function () {
      var f = input.files && input.files[0]; err.textContent = ''; box.classList.remove('is-set');
      if (!f) { name.textContent = 'Choose a file'; return; }
      if (!OK.test(f.name)) { err.textContent = 'Please choose a PDF, Word, JPG or PNG file.'; input.value = ''; name.textContent = 'Choose a file'; return; }
      if (f.size > MAX) { err.textContent = 'That file is over 5 MB. A smaller photo or PDF is fine.'; input.value = ''; name.textContent = 'Choose a file'; return; }
      name.textContent = f.name; box.classList.add('is-set');
    });
  });

  var dlg = document.getElementById('wl-sample');
  if (!dlg) return;
  var tabs = [].slice.call(dlg.querySelectorAll('[data-tab]')), panes = [].slice.call(dlg.querySelectorAll('[data-pane]'));
  function tab(k) {
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === k)); });
    panes.forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== k; });
    dlg.querySelector('.wl-sample-body').scrollTop = 0;
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { tab(t.getAttribute('data-tab')); }); });
  [].slice.call(document.querySelectorAll('[data-sample]')).forEach(function (b) {
    b.addEventListener('click', function () { tab(b.getAttribute('data-sample')); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
  });
  dlg.querySelector('[data-sample-close]').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
})();
