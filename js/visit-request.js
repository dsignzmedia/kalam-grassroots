/* Request a visit — WTL ID first (details come from the registration and are locked), then the visit itself.
   Connect the real services: window.CFP_WTL_API (GET <api><ID> → {name,mobile,state,constituency,district}) and
   window.CFP_VISIT_API (POST the form as JSON). Until then the WTL lookup uses 3 DEMO records and nothing is sent. */
(function () {
  'use strict';
  var form = document.getElementById('visit-form');
  if (!form) return;
  var box = form.querySelector('[data-wtl]'), input = document.getElementById('wl-wtl'), btn = box.querySelector('[data-wtl-find]');
  var msg = box.querySelector('[data-wtl-msg]'), found = box.querySelector('[data-wtl-found]'), after = form.querySelector('[data-wtl-after]');
  var change = box.querySelector('[data-wtl-change]'), realMobile = document.getElementById('wl-mobile-real');
  var F = { name: 'wl-name', mobile: 'wl-mobile', state: 'wl-state', constituency: 'wl-constituency', district: 'wl-district' };
  var verified = false, busy = false, api = window.CFP_WTL_API || '';
  var DEMO = {
    'WTL-26-100234': { name: 'Anitha Selvaraj', mobile: '9894012345', state: 'Tamil Nadu', constituency: 'Sulur', district: 'Coimbatore' },
    'WTL-26-100567': { name: 'Murugan Palanisamy', mobile: '9791056789', state: 'Tamil Nadu', constituency: 'Avinashi', district: 'Tiruppur' },
    'WTL-26-100890': { name: 'Fathima Begum', mobile: '9600078901', state: 'Tamil Nadu', constituency: 'Coimbatore South', district: 'Coimbatore' }
  };
  var PREFIX = 'WTL-26-';
  /* the field holds only the part after WTL-26-; a pasted full ID is trimmed to match */
  function norm(v) { return String(v || '').toUpperCase().replace(/\s+/g, '').replace(/^WTL-?(26)?-?/, '').replace(/[^A-Z0-9]/g, ''); }
  function mask(m) { var d = String(m).replace(/\D/g, '').slice(-10); return d ? '+91 ' + d.slice(0, 2) + '••• ••' + d.slice(-3) : ''; }
  function say(t, k) { msg.textContent = t || ''; msg.className = 'wl-wtl-msg' + (k ? ' is-' + k : ''); }
  function lookup(id) {
    if (api) return fetch(api + encodeURIComponent(id), { headers: { Accept: 'application/json' } }).then(function (r) { return r.ok ? r.json() : null; });
    return new Promise(function (res) { setTimeout(function () { res(DEMO[id] || null); }, 600); });
  }
  function setVerified(rec) {
    verified = true; document.getElementById('wl-wtl-full').value = PREFIX + norm(input.value);
    Object.keys(F).forEach(function (k) { document.getElementById(F[k]).value = k === 'mobile' ? mask(rec.mobile) : (rec[k] || ''); });
    realMobile.value = String(rec.mobile || '').replace(/\D/g, '').slice(-10);
    input.readOnly = true; btn.hidden = true; found.hidden = false; after.hidden = false; box.classList.add('is-verified');
    var first = (rec.name || '').split(/\s+/)[0]; say(first ? 'Welcome, ' + first + '.' : 'Found.', 'ok');
    setTimeout(function () { document.getElementById('vr-email').focus({ preventScroll: true }); }, 120);
  }
  function reset() {
    verified = false; document.getElementById('wl-wtl-full').value = ''; input.readOnly = false; btn.hidden = false; box.classList.remove('is-verified');
    Object.keys(F).forEach(function (k) { document.getElementById(F[k]).value = ''; }); realMobile.value = '';
    found.hidden = true; after.hidden = true; say('', ''); input.focus();
  }
  function find() {
    if (busy || verified) return;
    var suffix = norm(input.value); input.value = suffix; var id = PREFIX + suffix;
    if (!/^[A-Z0-9]{4,16}$/.test(suffix)) { say('Please enter the rest of your WTL ID, for example 100234.', 'err'); input.focus(); return; }
    busy = true; btn.disabled = true; btn.textContent = 'Finding…'; say('', '');
    lookup(id).then(function (rec) {
      if (rec) setVerified(rec); else { say('We couldn’t find that WTL ID. Check it and try again, or write to hello@centreforpolity.org.', 'err'); input.focus(); }
    }).catch(function () { say('We couldn’t reach the registration service. Please try again in a moment.', 'err'); })
      .then(function () { busy = false; btn.disabled = false; btn.textContent = 'Find my details'; });
  }
  btn.addEventListener('click', find);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); find(); } });
  input.addEventListener('input', function () { if (msg.classList.contains('is-err')) say('', ''); });
  change.addEventListener('click', reset);

  /* date: no past dates */
  var date = document.getElementById('vr-date'), t = new Date(); t.setDate(t.getDate() + 1);
  date.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');

  /* urgent: the reason becomes required */
  var urgent = document.getElementById('vr-urgent'), ubox = document.getElementById('vr-urgent-box'), why = document.getElementById('vr-urgent-why');
  urgent.addEventListener('change', function () {
    ubox.hidden = !urgent.checked; why.required = urgent.checked;
    if (urgent.checked) why.focus(); else why.setCustomValidity('');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault(); why.setCustomValidity('');
    if (!verified) { say('Enter your WTL ID and choose “Find my details” first.', 'err'); input.focus(); return; }
    if (urgent.checked && !why.value.trim()) { why.setCustomValidity('Please tell us why this is urgent.'); why.reportValidity(); why.addEventListener('input', function () { why.setCustomValidity(''); }, { once: true }); return; }
    if (!form.reportValidity()) return;
    var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
    var done = document.getElementById('vr-done'), txt = document.getElementById('vr-done-text'), email = document.getElementById('vr-email').value;
    var go = function () {
      txt.textContent = (urgent.checked ? 'We have marked this as urgent. ' : '') + 'We will book a slot for you based on availability and reply to ' + email + '.';
      form.hidden = true; document.querySelector('.vr-notice').hidden = true; done.hidden = false; done.focus(); done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    if (window.CFP_VISIT_API) fetch(window.CFP_VISIT_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(go).catch(function () { say('We could not send your request. Please try again.', 'err'); });
    else go();
  });
})();
