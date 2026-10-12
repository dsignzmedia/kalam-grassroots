/* Persona capability mind map — pins the canvas and grows it with scroll.
   Falls back to a vertical, reveal-on-view layout on small screens or reduced motion. */
(function () {
  var W = 1200, H = 820, TOP = 84;
  var live = window.matchMedia('(min-width:1000px) and (min-height:560px)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  document.querySelectorAll('[data-mm]').forEach(function (track) {
    var sticky = track.querySelector('.mm-sticky'),
        view = track.querySelector('.mm-viewport'),
        canvas = track.querySelector('.mm-canvas'),
        items = [].slice.call(track.querySelectorAll('[data-at]')),
        nodes = [].slice.call(track.querySelectorAll('.mm-node')),
        stages = [].slice.call(track.querySelectorAll('.mm-stage')),
        steps = [].slice.call(track.querySelectorAll('.mm-steps button')),
        hint = track.querySelector('.mm-hint'),
        bar = track.querySelector('.mm-progress i'),
        io = null, ticking = false;

    function fit() {
      if (!track.classList.contains('mm-live')) return;
      var avail = window.innerHeight - TOP - 12;
      var s = Math.min(track.clientWidth / W, (avail - 64) / H, 1.08);
      canvas.style.transform = 'scale(' + s + ')';
      view.style.width = W * s + 'px';
      view.style.height = H * s + 'px';
      sticky.style.height = Math.round(H * s + 84) + 'px';   /* hug the map so no blank band is left below it */
    }

    function progress() {
      var r = track.getBoundingClientRect();
      var span = r.height - sticky.offsetHeight;
      return span > 0 ? clamp((TOP - r.top) / span, 0, 1) : 0;
    }

    function update() {
      ticking = false;
      if (!track.classList.contains('mm-live')) return;
      var p = progress(), cur = -1;
      items.forEach(function (el) { el.classList.toggle('is-on', p >= parseFloat(el.dataset.at)); });
      stages.forEach(function (st, i) { if (p >= parseFloat(st.dataset.at)) cur = i; });
      stages.forEach(function (st, i) { st.classList.toggle('is-current', i === cur); });
      steps.forEach(function (b, i) { b.classList.toggle('is-current', i === cur); b.classList.toggle('is-done', i < cur); });
      if (hint) hint.classList.toggle('is-gone', p > 0.03);
      if (bar) bar.style.transform = 'scaleX(' + p + ')';
    }

    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    function mode() {
      var on = live.matches && !still.matches;
      track.classList.toggle('mm-live', on);
      track.classList.toggle('mm-fx', !on && !still.matches && 'IntersectionObserver' in window);
      if (io) { io.disconnect(); io = null; }
      if (on) {
        canvas.style.transform = ''; fit(); update();
      } else {
        canvas.style.transform = ''; view.style.width = view.style.height = ''; sticky.style.height = '';
        items.forEach(function (el) { el.classList.remove('is-dim'); });
        if (track.classList.contains('mm-fx')) {
          nodes.forEach(function (el) { el.classList.remove('is-on'); });
          io = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-on'); io.unobserve(e.target); } });
          }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
          nodes.forEach(function (el) { io.observe(el); });
        }
      }
    }

    // Hover / focus a stage: dim everything outside its branch
    function focus(g) {
      if (!track.classList.contains('mm-live')) return;
      items.forEach(function (el) {
        var keep = g == null || el.classList.contains('mm-hub') || el.dataset.g === g;
        el.classList.toggle('is-dim', !keep);
      });
    }
    nodes.forEach(function (n) {
      if (n.classList.contains('mm-hub')) return;
      n.addEventListener('mouseenter', function () { focus(n.dataset.g); });
      n.addEventListener('mouseleave', function () { focus(null); });
    });

    steps.forEach(function (b, i) {
      b.addEventListener('click', function () {
        var r = track.getBoundingClientRect(), span = r.height - sticky.offsetHeight;
        var at = parseFloat(stages[i].dataset.at) + 0.13;
        window.scrollTo({ top: window.scrollY + r.top - TOP + span * at, behavior: 'smooth' });
      });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { mode(); });
    live.addEventListener && live.addEventListener('change', mode);
    still.addEventListener && still.addEventListener('change', mode);
    mode();
  });
})();
