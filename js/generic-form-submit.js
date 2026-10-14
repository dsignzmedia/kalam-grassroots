/* Auto-wires any <form data-sheet-form="..."> on the page that has no bespoke
   handler already. Submits the form's fields to the Google Apps Script backend
   via CFP.send (see js/sheet-submit.js) and shows a simple "done" message. */
(function () {
  'use strict';
  document.querySelectorAll('form[data-sheet-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var btn = form.querySelector('[type="submit"]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      CFP.collectFormData(form).then(function (data) {
        return CFP.send(form.getAttribute('data-sheet-form'), data);
      }).catch(function () {}).then(function () {
        var done = document.createElement('p');
        done.className = 'sheet-done-msg';
        done.setAttribute('role', 'status');
        done.setAttribute('tabindex', '-1');
        done.textContent = form.getAttribute('data-sheet-done') || 'Thank you — we have received your submission.';
        form.hidden = true;
        form.insertAdjacentElement('afterend', done);
        done.focus();
      });
    });
  });
})();
