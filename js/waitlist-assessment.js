(function () {
  'use strict';

  var form = document.getElementById('waitlist-assessment-form');
  if (!form) return;

  var screens = Array.prototype.slice.call(form.querySelectorAll('.wl-screen'));
  var saveStatus = document.getElementById('wl-save-status');
  var currentScreen = 'welcome';

  var progressOrder = ['start', 'state', 'details', 'prepare'];

  function screenByName(name) {
    return form.querySelector('[data-screen="' + name + '"]');
  }

  function setProgress(progress) {
    var activeIndex = progressOrder.indexOf(progress);
    document.querySelectorAll('[data-progress-item]').forEach(function (item) {
      var itemIndex = progressOrder.indexOf(item.getAttribute('data-progress-item'));
      item.classList.toggle('is-active', itemIndex === activeIndex);
      item.classList.toggle('is-complete', itemIndex < activeIndex);
      if (itemIndex === activeIndex) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }

  function showScreen(name) {
    currentScreen = name;
    screens.forEach(function (screen) {
      var active = screen.getAttribute('data-screen') === name;
      screen.classList.toggle('is-active', active);
      screen.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    var activeScreen = screenByName(name);
    setProgress(activeScreen.getAttribute('data-progress'));
    var heading = activeScreen.querySelector('h1, h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    document.querySelector('.wl-assessment-stage').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    saveDraft();
  }

  function saveDraft() {
    try {
      var data = {};
      new FormData(form).forEach(function (value, key) { if (typeof value === 'string') data[key] = value; });
      sessionStorage.setItem('cfp_waitlist_draft', JSON.stringify(data));
      saveStatus.textContent = 'Draft saved on this device';
    } catch (error) {
      saveStatus.textContent = 'Your answers stay on this page';
    }
  }

  function previousScreen() {
    var sequence = ['welcome', 'q1', 'q2', 'q3', 'q4', 'q5', 'details'];
    var index = sequence.indexOf(currentScreen);
    if (index > 0) showScreen(sequence[index - 1]);
  }

  form.querySelectorAll('[data-next]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (currentScreen === 'welcome') showScreen('q1');
    });
  });

  form.querySelectorAll('[data-goto]').forEach(function (button) {
    button.addEventListener('click', function () {
      var fields = [].slice.call(screenByName(currentScreen).querySelectorAll('input, select, textarea'));
      for (var i = 0; i < fields.length; i++) { if (!fields[i].checkValidity()) { fields[i].reportValidity(); return; } }
      showScreen(button.getAttribute('data-goto'));
    });
  });

  form.querySelectorAll('[data-back]').forEach(function (button) {
    button.addEventListener('click', previousScreen);
  });

  form.querySelectorAll('.wl-options input[type="radio"]').forEach(function (input) {
    input.addEventListener('change', function () {
      saveDraft();
      var question = Number(currentScreen.replace('q', ''));
      window.setTimeout(function () {
        if (question < 5) showScreen('q' + (question + 1));
        else showScreen('details');
      }, 620);
    });
  });

  form.addEventListener('input', saveDraft);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var consent = document.getElementById('wl-consent');
    if (!consent.checked) { consent.setCustomValidity('Please tick this box to continue.'); consent.reportValidity(); consent.addEventListener('change', function () { consent.setCustomValidity(''); }, { once: true }); return; }
    var btn = form.querySelector('[data-wtl-submit]'), label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    CFP.collectFormData(form).then(function (data) { data.consent = 'Agreed'; return CFP.sendChecked('Waitlist Assessment', data); })
      .then(function () {
        var firstName = (document.getElementById('wl-name').value || '').trim().split(/\s+/)[0];
        document.getElementById('wl-complete-name').textContent = firstName ? 'Thank you, ' + firstName : 'Thank you';
        try { sessionStorage.removeItem('cfp_waitlist_draft'); } catch (error) {}
        showScreen('complete');
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        saveStatus.textContent = 'We could not send your answers. Please check your connection and try again.';
      });
  });

  document.addEventListener('keydown', function (event) {
    if (!/^\d$/.test(event.key) || !currentScreen.match(/^q[1-5]$/)) return;
    var options = screenByName(currentScreen).querySelectorAll('.wl-options input[type="radio"]');
    var index = Number(event.key) - 1;
    if (options[index]) { options[index].checked = true; options[index].dispatchEvent(new Event('change', { bubbles: true })); }
  });

  screens.forEach(function (screen) { screen.setAttribute('aria-hidden', screen.classList.contains('is-active') ? 'false' : 'true'); });
})();
