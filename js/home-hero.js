/* Home hero — word-by-word headline, rotating photo pill, gentle pointer parallax */
(function () {
  var hero = document.querySelector('.hero-home');
  var h1 = hero && hero.querySelector('.hero-statement');
  if (!h1) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (still) { root.classList.remove('hh-js'); return; }

  /* Split text into words that rise into place */
  var n = 0;
  (function split(node) {
    [].slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'), i = document.createElement('span');
          w.className = 'hw'; i.className = 'hw-i'; i.textContent = p;
          i.style.setProperty('--i', n++); w.appendChild(i); frag.appendChild(w);
        });
        node.replaceChild(frag, c);
      } else if (c.nodeType === 1 && !c.classList.contains('hero-photo') && !c.classList.contains('hero-icon') && !c.classList.contains('hero-roll') && c.tagName !== 'BR') {
        split(c);
      } else if (c.classList && (c.classList.contains('hero-photo') || c.classList.contains('hero-icon') || c.classList.contains('hero-roll'))) {
        c.style.setProperty('--i', n++);
      }
    });
  })(h1);
  hero.style.setProperty('--hh-total', n);
  var loader = document.querySelector('.page-loader');
  function ready() { requestAnimationFrame(function () { root.classList.add('hh-ready'); }); }
  if (loader && root.classList.contains('hh-loading')) {
    var pct = loader.querySelector('.pl-pct'), t0 = performance.now(), MIN = 1700, loaded = document.readyState === 'complete', done = false;
    window.addEventListener('load', function () { loaded = true; });
    var finish = function () {
      if (done) return; done = true;
      loader.style.setProperty('--p', 1); pct.textContent = '100';
      loader.classList.add('is-leaving');
      setTimeout(ready, 420);
      setTimeout(function () {
        root.classList.remove('hh-loading');
        try { sessionStorage.setItem('cfp-intro', '1'); } catch (e) {}
      }, 1200);
    };
    (function tick() {
      var el = performance.now() - t0, p = Math.min(1, el / MIN);
      if (!loaded) p = Math.min(p, 0.9);
      loader.style.setProperty('--p', p.toFixed(3)); pct.textContent = Math.round(p * 100);
      if ((p >= 1 && loaded) || el > 4500) finish(); else requestAnimationFrame(tick);
    })();
  } else ready();

  /* Rotating photo inside the pill */
  var imgs = [].slice.call(hero.querySelectorAll('.hero-photo img'));
  if (imgs.length > 1) {
    var cur = 0;
    setInterval(function () {
      imgs[cur].classList.remove('is-on');
      cur = (cur + 1) % imgs.length;
      imgs[cur].classList.add('is-on');
    }, 3800);
  }

  /* Scrolling word: rolls through the audiences, resizing smoothly */
  var roll = hero.querySelector('.hero-roll'), list = roll && roll.querySelector('.hero-roll-list');
  if (roll && list) {
    var items = [].slice.call(list.children), k = 0;
    var fit = function () {
      var w = items[k].getBoundingClientRect().width;
      roll.style.width = Math.ceil(w) + 'px';
      list.style.transform = 'translateY(' + (-k * 100 / items.length) + '%)';
      items.forEach(function (it, i) { it.classList.toggle('is-on', i === k); });
    };
    var start = function () {
      items.forEach(function (it) { it.style.display = 'block'; });
      fit();
      requestAnimationFrame(function () {
        roll.classList.add('is-live');
        setInterval(function () { k = (k + 1) % items.length; fit(); }, 2600);
      });
      window.addEventListener('resize', fit);
    };
    setTimeout(start, 3200);
  }

  /* Pointer parallax (fine pointers only) */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var raf = 0, tx = 0, ty = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0; hero.style.setProperty('--mx', tx.toFixed(3)); hero.style.setProperty('--my', ty.toFixed(3));
      });
    });
    hero.addEventListener('pointerleave', function () { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
  }
})();
