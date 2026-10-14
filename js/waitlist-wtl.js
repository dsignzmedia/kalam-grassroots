/* Waiting list — WTL ID first. Enter the ID, we check it through POST /api/verify-memberid (worker.js → Catalyst) and lock the returned details. */
(function () {
  'use strict';
  var box = document.querySelector('[data-wtl]');
  if (!box) return;
  var form = document.getElementById('waitlist-assessment-form');
  var input = document.getElementById('wl-wtl'), btn = box.querySelector('[data-wtl-find]'), msg = box.querySelector('[data-wtl-msg]');
  var found = box.querySelector('[data-wtl-found]'), after = form.querySelector('[data-wtl-after]'), submit = form.querySelector('[data-wtl-submit]');
  var change = box.querySelector('[data-wtl-change]'), realMobile = document.getElementById('wl-mobile-real');
  var F = { name: 'wl-name', mobile: 'wl-mobile', state: 'wl-state', constituency: 'wl-constituency', district: 'wl-district' };
  var verified = false, busy = false, api = window.CFP_WTL_API || '/api/verify-memberid';


  var PREFIX = 'WTL-26-';
  /* the field holds only the part after WTL-26-; a pasted full ID is trimmed to match */
  function norm(v) { return String(v || '').toUpperCase().replace(/\s+/g, '').replace(/^WTL-?(26)?-?/, '').replace(/\D/g, ''); }
  function mask(m) { var d = String(m).replace(/\D/g, '').slice(-10); return d ? '+91 ' + d.slice(0, 2) + '••• ••' + d.slice(-3) : ''; }   /* never show the whole number on screen */
  function setLock(el, locked) {
    var wrap = el.parentNode;
    if (locked) { el.readOnly = true; el.setAttribute('aria-readonly', 'true'); el.tabIndex = -1; el.placeholder = ''; if (wrap) wrap.classList.add('wl-lock'); }
    else { el.readOnly = false; el.removeAttribute('aria-readonly'); el.removeAttribute('tabindex'); el.placeholder = 'Enter here'; if (wrap) wrap.classList.remove('wl-lock'); }
  }
  function say(text, kind) { msg.textContent = text || ''; msg.className = 'wl-wtl-msg' + (kind ? ' is-' + kind : ''); }
  /* Real check: POST /api/verify-memberid (worker.js → Catalyst), same as the We The Leaders site.
     Resolves to { name, mobile, state, constituency, district } or null when the ID is unknown. */
  function lookup(id) {
    return fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ member_id: id.replace(/\D/g, '') }) })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (d) { if (!d || r.status >= 500 || r.status === 401 || r.status === 403 || r.status === 429) throw new Error('service'); return d; }); })
      .then(function (d) {
        if (!d.success) return null;
        var m = d.data || d;
        return {
          name: d.display_name || m.display_name || m.name || '',
          mobile: m.mobile || m.phone || '',
          masked: m.masked_mobile || '',
          state: m.state || m.state_name || '',
          constituency: m.constituency || m.constituency_name || '',
          district: m.district || m.district_name || ''
        };
      });
  }
  function setVerified(rec) {
    verified = true; document.getElementById('wl-wtl-full').value = PREFIX + norm(input.value);
    /* The WTL service returns only the name and a masked mobile. Anything it does not return
       (state / constituency / district) is left open for the person to fill in. */
    Object.keys(F).forEach(function (k) {
      var el = document.getElementById(F[k]);
      if (k === 'mobile') { el.value = rec.mobile ? mask(rec.mobile) : (rec.masked ? '+91 ' + rec.masked : ''); return; }
      el.value = rec[k] || '';
      if (!rec[k] && k !== 'name') setLock(el, false);
    });
    realMobile.value = rec.mobile ? String(rec.mobile).replace(/\D/g, '').slice(-10) : (rec.masked || '');
    input.readOnly = true; btn.hidden = true;
    found.hidden = false; after.hidden = false; submit.disabled = false;
    say('', ''); box.classList.add('is-verified');
    var first = (rec.name || '').split(/\s+/)[0];
    say(first ? 'Welcome, ' + first + '.' : 'Found.', 'ok');
    setTimeout(function () { var em = document.getElementById('wl-email'); if (em) em.focus({ preventScroll: true }); found.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' }); }, 120);
  }
  function reset() {
    verified = false; document.getElementById('wl-wtl-full').value = ''; input.readOnly = false; btn.hidden = false; box.classList.remove('is-verified');
    Object.keys(F).forEach(function (k) { var el = document.getElementById(F[k]); el.value = ''; setLock(el, true); }); realMobile.value = '';
    found.hidden = true; after.hidden = true; submit.disabled = true; say('', ''); input.focus();
  }
  function find() {
    if (busy || verified) return;
    var suffix = norm(input.value); input.value = suffix; var id = PREFIX + suffix;
    if (!/^\d{4,12}$/.test(suffix)) { say('Please enter the rest of your WTL ID, for example 100234.', 'err'); input.focus(); return; }
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
})();
