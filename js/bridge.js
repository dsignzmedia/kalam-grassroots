/* Home — the bridge: draws itself once, then the four steps light up in order. */
(function () {
  var box = document.querySelector('.bridge-journey');
  if (!box) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  [].slice.call(box.querySelectorAll('.bridge-art path')).forEach(function (p) {
    if (p.closest('.bridge-foundations')) return;
    p.setAttribute('pathLength', '1');
  });
  if (still) { box.classList.add('is-in', 'is-still'); return; }
  box.classList.add('is-ready');
  var target = box.querySelector('.bridge-crossing') || box, done = false;
  function go() { if (done) return; done = true; box.classList.add('is-in'); window.removeEventListener('scroll', check); window.removeEventListener('resize', check); }
  function check() {
    var r = target.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.82 && r.bottom > window.innerHeight * 0.12) go();
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (l) { if (l[0].isIntersecting) go(); }, { threshold: .25 }).observe(target);
  }
  setTimeout(check, 300);
  setTimeout(go, 12000);   /* never leave the section hidden */
})();
