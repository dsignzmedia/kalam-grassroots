/* Programmes journey — ONE continuous line, drawn as you scroll.
   It passes every station, draws each illustration itself, weaves through the fifty steps
   and finishes by drawing the portrait of Dr. A.P.J. Abdul Kalam (traced from a pencil drawing by Murali). */
(function () {
  var root = document.querySelector('[data-journey]');
  if (!root) return;
  var svg = root.querySelector('.jr-line'), ghost = svg.querySelector('.jr-ghost'), ink = svg.querySelector('.jr-ink');
  var dot = root.querySelector('.jr-dot'), kalam = root.querySelector('.jr-kalam');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nodeLen = [], samples = [], L = 0, STEP = 5, ticking = false;

  /* Reuse the exact, detailed Kalam portrait at the end of the journey in the loader. */
  (function prepareLoaderPortrait() {
    var loaderPortrait = document.querySelector('.jr-loader-portrait');
    if (!loaderPortrait || !kalam) return;
    var strokes;
    try { strokes = JSON.parse(kalam.getAttribute('data-strokes')); } catch (e) { return; }
    var d = strokes.join('');
    [].slice.call(loaderPortrait.querySelectorAll('path')).forEach(function (path) { path.setAttribute('d', d); });
  })();

  /* ---- one-line illustrations, drawn in a 120 × 120 box ---- */
  function circle(cx, cy, r, a0, n, dir) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var a = (a0 + dir * 360 * i / n) * Math.PI / 180;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return out;
  }
  var ILLO = {
    people: [[6, 106], [9, 92], [16, 82], [25, 74]].concat(circle(30, 56, 12, 90, 12, -1),
            [[37, 75], [46, 77], [54, 70]], circle(60, 44, 17, 90, 14, 1),
            [[67, 69], [75, 77], [84, 75]], circle(90, 56, 12, 90, 12, -1),
            [[96, 75], [105, 82], [111, 92], [114, 106]]),
    sapling: [[60, -46], [60, -24], [60, 0], [60, 16], [60, 28], [67, 22], [78, 17], [92, 13], [106, 12], [102, 22], [92, 30], [78, 35], [66, 36], [60, 37],
              [60, 48], [60, 58], [53, 52], [42, 47], [28, 44], [14, 43], [18, 53], [28, 61], [42, 65], [54, 66], [60, 67],
              [60, 80], [60, 92], [70, 98], [84, 102], [100, 104], [112, 104], [104, 110], [88, 113], [72, 114], [60, 120]],
    book: [[60, 4], [60, 30], [46, 25], [28, 23], [12, 27], [12, 60], [12, 93], [28, 88], [46, 89], [60, 96], [60, 64],
           [60, 33], [74, 25], [92, 23], [108, 27], [108, 60], [108, 93], [92, 88], [74, 89], [60, 96], [60, 120]],
    lab: [[52, 0], [52, 14]].concat(circle(52, 48, 32, -90, 22, 1),
            [[52, 28], [61, 32], [64, 41], [60, 51], [52, 62], [44, 51], [40, 41], [43, 32], [52, 28],
             [62, 46], [70, 62], [76, 72], [92, 88], [104, 100], [112, 116]])
  };

  /* ---- gather every point the pen passes, in page order ---- */
  function collect() {
    var r = root.getBoundingClientRect(), w = r.width, pts = [], anchors = [];
    [].slice.call(root.querySelectorAll('[data-node],[data-illo]')).forEach(function (el) {
      var b = el.getBoundingClientRect(), x0 = b.left - r.left, y0 = b.top - r.top;
      if (el.hasAttribute('data-illo')) {
        var k = ILLO[el.getAttribute('data-illo')]; if (!k || !b.width) return;
        var s = Math.min(b.width, b.height) / 120, ox = x0 + (b.width - 120 * s) / 2, oy = y0 + (b.height - 120 * s) / 2;
        k.forEach(function (p) { pts.push({ x: ox + p[0] * s, y: oy + p[1] * s }); });
        return;
      }
      var p = { x: x0 + b.width / 2, y: y0 + b.height / 2 }, loop = el.getAttribute('data-loop');
      if (loop && w > 700) {                                   /* a hand-drawn curl before each gate */
        var d = loop === 'left' ? -1 : 1, R = Math.min(40, w * .035), cx = p.x + d * R * 2.4, cy = p.y - R * 3;
        circle(cx, cy, R, d > 0 ? 180 : 0, 12, d > 0 ? 1 : -1).slice(0, 12).forEach(function (q) { pts.push({ x: q[0], y: q[1] }); });
        pts.push({ x: cx - d * R * .6, y: cy + R * 1.6 });
      }
      p.node = el; pts.push(p); anchors.push(p);
    });
    return { pts: pts, anchors: anchors, w: w, h: r.height, r: r };
  }

  /* centripetal Catmull–Rom: smooth, no cusps or kinks. Returns the path and a flattened copy of it for measuring. */
  function curve(pts) {
    function dist(a, b) { return Math.sqrt(Math.hypot(b.x - a.x, b.y - a.y)) || 1e-4; }
    var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1), poly = [{ x: pts[0].x, y: pts[0].y }];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var d1 = dist(p0, p1), d2 = dist(p1, p2), d3 = dist(p2, p3);
      var b1x, b1y, b2x, b2y;
      if (p0 === p1) { b1x = p1.x + (p2.x - p1.x) / 3; b1y = p1.y + (p2.y - p1.y) / 3; }
      else { var A = d1 * d1, B = d2 * d2, n1 = 3 * d1 * (d1 + d2);
        b1x = (A * p2.x - B * p0.x + (2 * A + 3 * d1 * d2 + B) * p1.x) / n1; b1y = (A * p2.y - B * p0.y + (2 * A + 3 * d1 * d2 + B) * p1.y) / n1; }
      if (p3 === p2) { b2x = p2.x - (p2.x - p1.x) / 3; b2y = p2.y - (p2.y - p1.y) / 3; }
      else { var C = d3 * d3, D = d2 * d2, n2 = 3 * d3 * (d3 + d2);
        b2x = (C * p1.x - D * p3.x + (2 * C + 3 * d3 * d2 + D) * p2.x) / n2; b2y = (C * p1.y - D * p3.y + (2 * C + 3 * d3 * d2 + D) * p2.y) / n2; }
      d += 'C' + b1x.toFixed(1) + ' ' + b1y.toFixed(1) + ' ' + b2x.toFixed(1) + ' ' + b2y.toFixed(1) + ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
      var n = Math.max(2, Math.min(160, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 6)));
      for (var k = 1; k <= n; k++) {
        var t = k / n, u = 1 - t, w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
        poly.push({ x: w0 * p1.x + w1 * b1x + w2 * b2x + w3 * p2.x, y: w0 * p1.y + w1 * b1y + w2 * b2y + w3 * p2.y });
      }
    }
    return { d: d, poly: poly };
  }
  /* the portrait's straight strokes; a pen lift (M) adds no length, exactly like the drawn path */
  function flat(str, poly) {
    var re = /([ML])\s*(-?[\d.]+)[ ,](-?[\d.]+)/g, m, out = poly.slice();
    while ((m = re.exec(str))) {
      if (m[1] === 'M') out.push({ x: +m[2], y: +m[3], jump: true });
      else out.push({ x: +m[2], y: +m[3] });
    }
    return out;
  }

  /* the portrait: the line arrives at the hair parting and draws every stroke */
  function portrait(g) {
    if (!kalam) return { lead: null, d: '' };
    var strokes; try { strokes = JSON.parse(kalam.getAttribute('data-strokes')); } catch (e) { return { lead: null, d: '' }; }
    var b = kalam.getBoundingClientRect(), s = b.width / 300, ox = b.left - g.r.left, oy = b.top - g.r.top;
    var tf = function (str) {
      return str.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, function (m, x, y) {
        return (ox + x * s).toFixed(1) + ' ' + (oy + y * s).toFixed(1);
      });
    };
    var d = strokes.map(tf).join('');
    var m = d.match(/^M\s*(-?[\d.]+)[ ,](-?[\d.]+)/);                 /* the line arrives where the first stroke starts */
    if (!m) return { lead: null, d: '' };
    return { lead: { x: +m[1], y: +m[2] }, d: d.slice(m[0].length) };
  }

  function build() {
    var g = collect(), pr = portrait(g);
    if (pr.lead) {
      var last = g.pts[g.pts.length - 1], hz = root.querySelector('.jr-horizon'), side = g.w > 700 ? g.w / 2 - 380 : 4;
      if (hz) { var hb = hz.getBoundingClientRect(); g.pts.push({ x: side, y: hb.bottom - g.r.top + 30 }); }   /* swing around the text */
      else g.pts.push({ x: side, y: (last.y + pr.lead.y) / 2 });
      g.pts.push({ x: pr.lead.x - 40, y: pr.lead.y - 60 });
      g.pts.push(pr.lead);
    }
    svg.setAttribute('viewBox', '0 0 ' + g.w + ' ' + g.h);
    svg.setAttribute('width', g.w); svg.setAttribute('height', g.h);
    var cv = curve(g.pts), d = cv.d + pr.d, pl = flat(pr.d, cv.poly);
    ghost.setAttribute('d', d); ink.setAttribute('d', d);
    L = ink.getTotalLength();
    var acc = 0, maxY = -1e9, raw = [];
    for (var i = 0; i < pl.length; i++) {
      if (i && !pl[i].jump) acc += Math.hypot(pl[i].x - pl[i - 1].x, pl[i].y - pl[i - 1].y);
      maxY = Math.max(maxY, pl[i].y); raw.push({ l: acc, x: pl[i].x, y: pl[i].y, m: maxY });
    }
    var k = acc ? L / acc : 1;
    samples = raw.map(function (q) { return { l: q.l * k, x: q.x, y: q.y, m: q.m }; });
    nodeLen = g.anchors.map(function (p) {
      var best = 0, bd = 1e12;
      for (var i = 0; i < samples.length; i++) { var dx = samples[i].x - p.x, dy = samples[i].y - p.y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = samples[i].l; } }
      return { n: p.node, l: best, on: null };
    });
    ink.style.strokeDasharray = L + ' ' + L;
    frame();
  }

  function drawnLength() {
    if (still || !samples.length) return L;
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) return L;
    var target = window.innerHeight * .64 - root.getBoundingClientRect().top;
    if (target <= samples[0].m) return 0;
    var lo = 0, hi = samples.length - 1;
    if (target >= samples[hi].m) return L;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (samples[mid].m >= target) hi = mid; else lo = mid + 1; }
    return samples[lo].l;
  }

  function pointAt(len) {
    var lo = 0, hi = samples.length - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (samples[mid].l >= len) hi = mid; else lo = mid + 1; }
    var b = samples[lo], a = samples[Math.max(0, lo - 1)], span = b.l - a.l;
    var t = span > 0 ? Math.min(1, Math.max(0, (len - a.l) / span)) : 1;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  function frame() {
    ticking = false;
    if (!L) return;
    var len = drawnLength();
    ink.style.strokeDashoffset = (L - len).toFixed(1);
    var q = pointAt(len);
    dot.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px)';
    dot.classList.toggle('is-end', len >= L - 2);
    nodeLen.forEach(function (o) {
      var on = len >= o.l - 2;
      if (o.on === on) return;
      o.on = on; o.n.classList.toggle('is-lit', on);
      var st = o.n.closest('[data-station]'); if (st) st.classList.toggle('is-lit', on);
    });
    if (kalam) kalam.classList.toggle('is-drawn', len >= L - 2);
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  var rt; function later(ms) { clearTimeout(rt); rt = setTimeout(function () { build(); maybeRelease(); }, ms); }

  /* loader: stays until the page, fonts and the line are all ready */
  var html = document.documentElement, loader = document.querySelector('.page-loader'), t0 = performance.now();
  var loaded = document.readyState === 'complete', fontsOk = !(document.fonts && document.fonts.ready), released = false;
  function release() {
    if (released) return; released = true;
    if (loader) { loader.style.setProperty('--p', 1); var pc = loader.querySelector('.pl-pct'); if (pc) pc.textContent = '100'; loader.classList.add('is-leaving'); }
    setTimeout(function () { html.classList.remove('jr-loading'); build(); }, loader ? 800 : 0);
  }
  function maybeRelease() {
    if (released || !html.classList.contains('jr-loading')) return;
    if (loaded && fontsOk && samples.length) setTimeout(release, Math.max(0, 1900 - (performance.now() - t0)));
  }
  if (loader && html.classList.contains('jr-loading')) {
    var pc = loader.querySelector('.pl-pct');
    (function tick() {
      if (released) return;
      var p = Math.min(.92, (performance.now() - t0) / 1400);
      loader.style.setProperty('--p', p.toFixed(3)); if (pc) pc.textContent = Math.round(p * 100);
      requestAnimationFrame(tick);
    })();
    setTimeout(release, 6000);                                   /* never trap the visitor */
  }

  build();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { later(150); });
  window.addEventListener('load', function () { loaded = true; later(0); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fontsOk = true; later(0); });
})();
