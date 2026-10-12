/* Mobile layer (phones, up to 720px). Turns long stacks into swipeable rails, folds long sections into
   accordions, clamps long paragraphs and folds the footer. Desktop is untouched. */
(function () {
  var mq = window.matchMedia('(max-width: 720px)');
  if (!mq.matches || document.body.classList.contains('wl-fit')) return;
  var root = document.documentElement; root.classList.add('is-m');
  var $ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- rails: grids of cards become a horizontal swipe ---------- */
  var RAILS = ['.library-card-grid', '.grid.grid-2', '.grid.grid-3', '.grid.grid-4', '.persona-resource-grid', '.persona-explore-grid',
    '.persona-path-grid', '.gr-cards3', '.gr-fac-grid', '.gr-tiles', '.gr-next-grid', '.ap-pri-grid', '.ap-tiles', '.ap-bands', '.ap-proms',
    '.ev-grid', '.collections-grid', '.toolkit-list', '.about-principle-grid', '.wj-value-grid', '.wj-community-grid', '.ins-idea-grid',
    '.ins-cards', '.akf-path-grid', '.shift-proof', '.doors-grid', '.fac-grid', '.lp-evi', '.programme-outcome-grid', '.pf-ways',
    '.home-akf-simple', '.journey-action-grid', '.gr-join-grid', '.news-list', '.ins-info'].join(',');
  $(RAILS).forEach(function (el) {
    if (el.closest('form, footer, header, .wl-app-shell')) return;
    var kids = [].slice.call(el.children).filter(function (c) { return c.offsetHeight > 40 || c.tagName === 'A' || c.tagName === 'ARTICLE'; });
    if (kids.length < 2) return;
    el.classList.add('m-rail');
    var dots = document.createElement('div'); dots.className = 'm-dots'; dots.setAttribute('aria-hidden', 'true');
    kids.forEach(function (_, i) { var d = document.createElement('i'); if (!i) d.className = 'on'; dots.appendChild(d); });
    el.insertAdjacentElement('afterend', dots);
    var tick = 0;
    el.addEventListener('scroll', function () {
      cancelAnimationFrame(tick);
      tick = requestAnimationFrame(function () {
        var first = kids[0], step = (kids[1].offsetLeft - first.offsetLeft) || first.offsetWidth;
        var idx = Math.max(0, Math.min(kids.length - 1, Math.round(el.scrollLeft / step)));
        [].slice.call(dots.children).forEach(function (d, i) { d.className = i === idx ? 'on' : ''; });
      });
    }, { passive: true });
  });

  /* ---------- accordions ---------- */
  function refresh() { window.dispatchEvent(new Event('resize')); }
  function acc(box, headSel, open) {
    var head = box.querySelector(':scope > ' + headSel); if (!head || box.classList.contains('m-acc')) return;
    box.classList.add('m-acc'); head.classList.add('m-acc-head');
    head.setAttribute('role', 'button'); head.tabIndex = 0; head.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) box.classList.add('is-open');
    function toggle(e) {
      if (e.target.closest('a')) return;
      var on = box.classList.toggle('is-open'); head.setAttribute('aria-expanded', on ? 'true' : 'false');
      setTimeout(refresh, 60);
    }
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e); } });
  }
  $('.ins-pillar').forEach(function (p, i) { acc(p, '.ins-pillar-head', i === 0); });
  $('.gloss-entry').forEach(function (p) { acc(p, 'dt', false); });
  $('.jr-group').forEach(function (p) { acc(p, '.jr-group-head', false); });
  $('.faq-wrap .faq-item').forEach(function () {});
  $('.footer-grid > div').forEach(function (col) { acc(col, 'h4', false); });
  if (location.hash) { var t = document.querySelector(location.hash); if (t && t.classList.contains('gloss-entry')) t.classList.add('is-open'); }

  /* ---------- long paragraphs: three lines, then "Read more" ---------- */
  $('main p').forEach(function (p) {
    if (p.textContent.length < 230) return;
    if (p.closest('.m-acc, .gloss-entry, form, blockquote, .wl-screen, .m-rail, .jr-road, .paper, table, .faq-item, [class*="hero"] .subhead')) return;
    if (p.closest('.section-label')) return;
    p.classList.add('m-clamp');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'm-more'; b.textContent = 'Read more';
    b.addEventListener('click', function () { var on = p.classList.toggle('is-open'); b.textContent = on ? 'Show less' : 'Read more'; setTimeout(refresh, 60); });
    p.insertAdjacentElement('afterend', b);
  });
})();
