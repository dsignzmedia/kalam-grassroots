/* The Institute — scroll reveals, foundations scrollspy, parallax and gallery lightbox */
(function () {
  var root = document.documentElement;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* Reveal on scroll */
  var reveals = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if (!still && 'IntersectionObserver' in window) {
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* Foundations scrollspy + parallax */
  var links = [].slice.call(document.querySelectorAll('.ins-found-nav a')),
      pillars = [].slice.call(document.querySelectorAll('.ins-pillar')),
      par = [].slice.call(document.querySelectorAll('[data-parallax]')),
      ticking = false;
  if (links.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    pillars.forEach(function (p) { spy.observe(p); });
    links[0].classList.add('is-active');
  }

  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    if (!still) par.forEach(function (el) {
      var b = el.parentNode.getBoundingClientRect();
      if (b.bottom < -100 || b.top > vh + 100) return;
      var d = ((b.top + b.height / 2) - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (d * -(parseFloat(el.dataset.parallax) || 40)).toFixed(1) + 'px,0) scale(1.14)';
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* Gallery lightbox */
  var box = document.getElementById('ins-lightbox');
  var tiles = [].slice.call(document.querySelectorAll('.ins-tile'));
  if (box && box.showModal && tiles.length) {
    var img = box.querySelector('img'), cap = box.querySelector('figcaption span'), count = box.querySelector('.ins-lb-count'), cur = 0;
    function show(i) {
      cur = (i + tiles.length) % tiles.length;
      var t = tiles[cur];
      img.src = t.dataset.full; img.alt = t.dataset.alt || '';
      cap.textContent = t.dataset.caption || '';
      count.textContent = (cur + 1) + ' / ' + tiles.length;
    }
    tiles.forEach(function (t, i) { t.addEventListener('click', function () { show(i); box.showModal(); }); });
    box.querySelector('.ins-lb-prev').addEventListener('click', function () { show(cur - 1); });
    box.querySelector('.ins-lb-next').addEventListener('click', function () { show(cur + 1); });
    box.querySelector('.ins-lb-close').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }
})();
