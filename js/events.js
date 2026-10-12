/* Events — listing filters and detail-page share */
(function () {
  var list = document.querySelector('[data-events]');
  if (list) {
    var cards = [].slice.call(list.querySelectorAll('.ev-card')),
        chips = [].slice.call(document.querySelectorAll('.ev-chip')),
        search = document.getElementById('ev-search'),
        count = document.getElementById('ev-count'),
        empty = document.getElementById('ev-empty'),
        cat = 'all';
    function apply() {
      var q = (search && search.value || '').trim().toLowerCase(), n = 0;
      cards.forEach(function (c) {
        var ok = (cat === 'all' || c.dataset.cat === cat) && (!q || c.textContent.toLowerCase().indexOf(q) > -1);
        c.hidden = !ok; if (ok) n++;
      });
      count.textContent = n + (n === 1 ? ' event' : ' events');
      empty.hidden = n !== 0;
    }
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        cat = ch.dataset.cat;
        chips.forEach(function (o) { o.setAttribute('aria-pressed', o === ch ? 'true' : 'false'); });
        apply();
      });
    });
    if (search) search.addEventListener('input', apply);
    apply();
  }
  var share = document.querySelector('[data-share]');
  if (share) share.addEventListener('click', function () {
    var data = { title: document.title, url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () {
      var t = share.textContent; share.textContent = 'Link copied'; setTimeout(function () { share.textContent = t; }, 1800);
    });
  });
})();
