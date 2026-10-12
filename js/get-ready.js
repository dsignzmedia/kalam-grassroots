/* Get Ready — scroll reveals, the process line, and a gentle parallax on the hero photos. */
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = [].slice.call(document.querySelectorAll('[data-rv],[data-path]'));
  if (still || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); }
  else {
    document.documentElement.classList.add('gr-anim');
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e, i) { e.style.setProperty('--d', (i % 4) * 70 + 'ms'); io.observe(e); });
  }
  var media = document.querySelector('.gr-hero-media'), ticking = false;
  if (media && !still) {
    var onScroll = function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var r = media.getBoundingClientRect(), p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
        media.style.setProperty('--p', p.toFixed(3)); ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
})();
