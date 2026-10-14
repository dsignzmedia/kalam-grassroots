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
        return CFP.sendChecked(form.getAttribute('data-sheet-form'), data);
      }).then(function () {
        var old = form.parentNode.querySelector('.sheet-error-msg'); if (old) old.remove();
        var done = document.createElement('p');
        done.className = 'sheet-done-msg';
        done.setAttribute('role', 'status');
        done.setAttribute('tabindex', '-1');
        done.textContent = form.getAttribute('data-sheet-done') || 'Thank you — we have received your submission.';
        form.hidden = true;
        form.insertAdjacentElement('afterend', done);
        done.focus();
      }).catch(function () {
        /* not saved: keep the form and what was typed, let the person try again */
        if (btn) { btn.disabled = false; btn.textContent = label; }
        var err = form.parentNode.querySelector('.sheet-error-msg');
        if (!err) {
          err = document.createElement('p');
          err.className = 'sheet-error-msg';
          err.setAttribute('role', 'alert');
          err.style.cssText = 'color:#b42318;margin:12px 0 0;font-size:14px';
          form.insertAdjacentElement('beforeend', err);
        }
        err.textContent = 'We could not send this just now. Please check your connection and try again.';
      });
    });
  });
})();
