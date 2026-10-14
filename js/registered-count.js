/* Live "registered leaders" count — the same number the We The Leaders site shows.
   Any element with [data-registered-count] is refreshed from the public movement counter
   (GET → { "count": 2084247, "generated_at": "…" }, no key needed, CORS open) and written in Indian digit
   grouping (20,84,247). Until the first reply, and whenever the counter cannot be reached, the number already
   in the page stays as the fallback, so the card never shows an empty or broken value. */
(function () {
  'use strict';
  var API = 'https://annacounter-50043253136.development.catalystappsail.in/api/get-counter-v2';
  var POLL_MS = 10000;
  var targets = [].slice.call(document.querySelectorAll('[data-registered-count]'));
  if (!targets.length || !window.fetch) return;

  /* 2084247 -> "20,84,247" (last three digits, then pairs) */
  function indian(n) {
    var s = String(Math.round(n));
    if (s.length <= 3) return s;
    return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
  }

  function refresh() {
    if (document.hidden) return;                       // no polling while the tab is in the background
    fetch(API, { headers: { Accept: 'application/json' } }).then(function (res) {
      if (!res.ok) throw new Error('bad status');
      return res.json();
    }).then(function (data) {
      var count = parseInt(data && data.count, 10);
      if (!count || isNaN(count)) return;
      var text = indian(count);
      targets.forEach(function (el) { if (el.textContent !== text) el.textContent = text; });
    }).catch(function () { /* keep the number already showing */ });
  }

  refresh();
  setInterval(refresh, POLL_MS);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
})();
