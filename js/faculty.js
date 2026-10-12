/* Faculty — course filter and profile pop-up */
(function () {
  var grid = document.querySelector('[data-faculty]');
  if (!grid) return;
  var cards = [].slice.call(grid.querySelectorAll('.fac-card')),
      chips = [].slice.call(document.querySelectorAll('[data-prog]')),
      count = document.getElementById('fac-count'),
      empty = document.getElementById('fac-empty'),
      prog = 'all';

  function apply() {
    var n = 0;
    cards.forEach(function (c) {
      var ok = prog === 'all' || c.dataset.progs.split(' ').indexOf(prog) > -1;
      c.hidden = !ok; if (ok) n++;
    });
    count.textContent = n + (n === 1 ? ' faculty profile' : ' faculty profiles');
    empty.hidden = n !== 0;
  }
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      prog = ch.dataset.prog;
      chips.forEach(function (o) { o.setAttribute('aria-pressed', o === ch ? 'true' : 'false'); });
      apply();
    });
  });
  var modal = document.getElementById('fac-modal');
  if (!modal) return;
  var nativeDialog = typeof modal.showModal === 'function';
  var inner = modal.querySelector('.fac-m-inner'), counter = modal.querySelector('.fac-m-count'), cur = null;
  function openModal() {
    if (nativeDialog) modal.showModal();
    else { modal.setAttribute('open', ''); modal.classList.add('is-fallback-open'); document.documentElement.classList.add('fac-modal-open'); }
  }
  function closeModal() {
    if (nativeDialog) modal.close();
    else { modal.removeAttribute('open'); modal.classList.remove('is-fallback-open'); document.documentElement.classList.remove('fac-modal-open'); }
  }
  function visible() { return cards.filter(function (c) { return !c.hidden; }); }
  function show(card) {
    cur = card;
    inner.innerHTML = card.querySelector('.fac-detail').outerHTML;
    var list = visible(), i = list.indexOf(card);
    counter.textContent = (i + 1) + ' of ' + list.length;
    inner.scrollTop = 0;
  }
  cards.forEach(function (c) {
    c.querySelector('.fac-open').addEventListener('click', function () { show(c); openModal(); });
  });
  modal.querySelectorAll('.fac-m-nav').forEach(function (b) {
    b.addEventListener('click', function () {
      var list = visible(), i = list.indexOf(cur), d = Number(b.dataset.dir);
      show(list[(i + d + list.length) % list.length]);
    });
  });
  modal.querySelector('.fac-m-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !nativeDialog) closeModal();
    if (e.key === 'ArrowLeft') modal.querySelector('[data-dir="-1"]').click();
    if (e.key === 'ArrowRight') modal.querySelector('[data-dir="1"]').click();
  });
})();
