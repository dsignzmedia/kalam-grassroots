/* Newsletter sign-up — email only, with inline validation and a confirmation state */
(function () {
  var form = document.querySelector('.sub-form'), done = document.getElementById('sub-done');
  if (!form || !done) return;
  var input = document.getElementById('subscribe-email'), err = document.getElementById('sub-error'), field = form.querySelector('.sub-field');
  var ok = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
  function clear() { err.hidden = true; field.classList.remove('is-invalid'); input.removeAttribute('aria-invalid'); }
  input.addEventListener('input', clear);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!ok(v)) { err.hidden = false; field.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
    CFP.send('Newsletter', { email: v });
    document.getElementById('sub-done-email').textContent = v;
    form.hidden = true; done.hidden = false; done.focus();
  });
  done.querySelector('.sub-again').addEventListener('click', function () {
    done.hidden = true; form.hidden = false; input.value = ''; clear(); input.focus();
  });
})();
