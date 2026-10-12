/* Waiting list — WTL ID first. Enter the ID, we fetch the registered details and lock them.
   HOW TO CONNECT THE REAL SERVICE: set window.CFP_WTL_API = 'https://…/wtl/' before this file loads.
   It is called as GET <api><ID> and should return JSON { name, mobile, state, constituency, district } or 404.
   Until then, the three DEMO records below are used so the flow can be tried. */
(function () {
  'use strict';
  var box = document.querySelector('[data-wtl]');
  if (!box) return;
  var form = document.getElementById('waitlist-assessment-form');
  var input = document.getElementById('wl-wtl'), btn = box.querySelector('[data-wtl-find]'), msg = box.querySelector('[data-wtl-msg]');
  var found = box.querySelector('[data-wtl-found]'), after = form.querySelector('[data-wtl-after]'), submit = form.querySelector('[data-wtl-submit]');
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
  function mask(m) { var d = String(m).replace(/\D/g, '').slice(-10); return d ? '+91 ' + d.slice(0, 2) + '••• ••' + d.slice(-3) : ''; }   /* never show the whole number on screen */
  function say(text, kind) { msg.textContent = text || ''; msg.className = 'wl-wtl-msg' + (kind ? ' is-' + kind : ''); }
  function lookup(id) {
    if (api) return fetch(api + encodeURIComponent(id), { headers: { Accept: 'application/json' } }).then(function (r) { return r.ok ? r.json() : null; });
    return new Promise(function (res) { setTimeout(function () { res(DEMO[id] || null); }, 650); });
  }
  function setVerified(rec) {
    verified = true; document.getElementById('wl-wtl-full').value = PREFIX + norm(input.value);
    Object.keys(F).forEach(function (k) { var el = document.getElementById(F[k]); el.value = k === 'mobile' ? mask(rec.mobile) : (rec[k] || ''); });
    realMobile.value = String(rec.mobile || '').replace(/\D/g, '').slice(-10);
    input.readOnly = true; btn.hidden = true;
    found.hidden = false; after.hidden = false; submit.disabled = false;
    say('', ''); box.classList.add('is-verified');
    var first = (rec.name || '').split(/\s+/)[0];
    say(first ? 'Welcome, ' + first + '.' : 'Found.', 'ok');
    setTimeout(function () { var em = document.getElementById('wl-email'); if (em) em.focus({ preventScroll: true }); found.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' }); }, 120);
  }
  function reset() {
    verified = false; document.getElementById('wl-wtl-full').value = ''; input.readOnly = false; btn.hidden = false; box.classList.remove('is-verified');
    Object.keys(F).forEach(function (k) { document.getElementById(F[k]).value = ''; }); realMobile.value = '';
    found.hidden = true; after.hidden = true; submit.disabled = true; say('', ''); input.focus();
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
  form.addEventListener('submit', function (e) { if (!verified) { e.preventDefault(); e.stopImmediatePropagation(); say('Enter your WTL ID and choose “Find my details” first.', 'err'); input.focus(); } }, true);
  if (!api) { var hint = document.createElement('p'); hint.className = 'wl-wtl-hint'; hint.textContent = 'Prototype: try 100234, 100567 or 100890.'; msg.insertAdjacentElement('afterend', hint); }
})();
