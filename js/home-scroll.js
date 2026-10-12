/* Home — scroll animation: reveals, ladder build, count-up, hero parallax, progress bar */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var root = document.documentElement, main = document.getElementById('main');
  if (!main) return;

  /* [selector, variant, stagger among siblings] — the hero animates itself */
  var groups = [
    ['.section-label', '', 0],
    ['.doors-heading-row', '', 0], ['.door-card', '', 1],
    ['.ladder-intro>*:not(.ladder-facts)', '', 1], ['.ladder-facts>div', '', 1], ['.ladder-step', '', 1],
    ['.shift-head>*', '', 1], ['.shift-step', 'sr-scale', 1], ['.shift-proof-head', '', 0], ['.shift-card', '', 1], ['.shift-quote', 'sr-scale', 0], ['.shift-cta', '', 0],
    ['.reading-header', '', 0], ['.lesson-card', 'sr-scale', 1], ['.reading-footer', '', 0],
    ['.upcoming-heading-row', '', 0], ['.home-event-grid .ev-card', 'sr-scale', 1],
    ['.one-line-band .wrap', 'sr-scale', 0],
    ['main>section:nth-of-type(8) .wrap>*', '', 1]
  ];
  var seen = new Set(), els = [];
  groups.forEach(function (g) {
    [].slice.call(main.querySelectorAll(g[0])).forEach(function (el, i) {
      if (el.closest('.hero-home') || seen.has(el)) return;
      seen.add(el);
      el.classList.add('sr'); if (g[1]) el.classList.add(g[1]);
      el.style.setProperty('--sd', g[2] ? Math.min(i, 6) : 0);
      els.push(el);
    });
  });
  root.classList.add('sr-on');

  /* Restore the element's own transitions once revealed */
  function settle(el) {
    setTimeout(function () {
      el.classList.remove('sr', 'sr-scale', 'sr-left', 'sr-right', 'sr-step', 'is-in');
      el.style.removeProperty('--sd');
    }, 1700);
  }
  function countUp(el) {
    var m = el.textContent.match(/^(\d+)(.*)$/); if (!m) return;
    var end = +m[1], suffix = m[2], t0 = performance.now(), dur = 1300;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; io.unobserve(el);
      if (el.classList.contains('ladder-steps')) {   /* clipped children can't be observed: reveal them via their container */
        [].slice.call(el.children).forEach(function (c) { c.classList.add('is-in'); settle(c); });
        return;
      }
      el.classList.add('is-in'); settle(el);
      var s = el.matches('.ladder-facts>div') && el.querySelector('strong'); if (s) setTimeout(function () { countUp(s); }, 250);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (el) { io.observe(el.classList.contains('sr-step') ? el.parentElement : el); });

  /* Progress bar + hero parallax */
  var bar = document.createElement('div'); bar.className = 'sr-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  var hero = document.querySelector('.hero-home'), copy = hero && hero.querySelector('.hero-copy'), ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    if (hero && copy) {
      var h = hero.offsetHeight;
      if (y < h * 1.2) {
        copy.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
        copy.style.opacity = Math.max(0, 1 - y / (h * 0.85)).toFixed(3);
        hero.style.setProperty('--hero-shift', (y * 0.3).toFixed(1) + 'px');
      }
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener('resize', frame);
  frame();
})();
