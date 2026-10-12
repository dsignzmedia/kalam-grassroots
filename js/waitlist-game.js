/* Waiting list — light gamification: a climb tracker, milestone badges, cheers and a finish celebration.
   No points or scores: it only reflects real progress through the form. */
(function () {
  'use strict';
  var BASE = (document.currentScript && document.currentScript.src ? document.currentScript.src : '').replace(/js\/waitlist-game\.js.*$/, '');
  var form = document.getElementById('waitlist-assessment-form');
  if (!form) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var workspace = form.closest('.wl-workspace') || document.querySelector('.wl-workspace');
  var topbar = document.querySelector('.wl-topbar');
  var rail = document.querySelector('.wl-progress-rail');
  if (!workspace || !topbar) return;

  var STEPS = ['q1', 'q2', 'q3', 'q4', 'q5', 'details'];
  var LEFT = { q1: 8, q2: 7, q3: 6, q4: 5, q5: 4, details: 2 };
  var CHEER = {
    q1: 'Take the first step — there are no wrong answers.',
    q2: 'One step up. Honest answers help us most.',
    q3: 'Two steps up. You’re moving well.',
    q4: 'Past the middle. Keep climbing.',
    q5: 'Last question. The summit is close.',
    details: 'Last stretch. Tell us about you, then the preparation begins.'
  };
  var BADGES = [
    { id: 'first', label: 'First step', after: 'q1', icon: '↑' },
    { id: 'half', label: 'Halfway', after: 'q3', icon: '◐' },
    { id: 'assess', label: 'Assessment done', after: 'q5', icon: '✓' },
    { id: 'list', label: 'On the list', after: 'submit', icon: '★' }
  ];
  var unlocked = {};

  /* ---- The hero: an ordinary person who becomes super-charged, one form step at a time ---- */
  var RANKS = ['Citizen', 'Learner', 'Listener', 'Voice', 'Organiser', 'Candidate-ready', 'Leader in the making', 'Political-ready!'];
  var LEVEL = { welcome: 0, q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, details: 6, complete: 7 };
  var STAGE_COPY = [
    ['Citizen', 'You are here: bringing lived experience and the willingness to serve.', 'Citizen stage: a resident beginning a public leadership journey'],
    ['Learner', 'Build a foundation in civic systems and public responsibility.', 'Learner stage: a participant studying civic fundamentals'],
    ['Listener', 'Understand people and public problems before proposing answers.', 'Listener stage: a participant listening carefully to a resident'],
    ['Voice', 'Communicate clearly and responsibly with a wider audience.', 'Voice stage: a participant speaking at a community forum'],
    ['Organiser', 'Turn shared concerns into coordinated, disciplined action.', 'Organiser stage: a participant coordinating a community team'],
    ['Candidate-ready', 'Use better tools, evidence and processes to prepare responsibly.', 'Candidate-ready stage: a participant reviewing a readiness plan'],
    ['Leader in the making', 'Lead teams, practise judgement and learn from feedback.', 'Leader in the making stage: a participant guiding a working session'],
    ['Political-ready', 'Face public responsibility with proven capability and accountability.', 'Political-ready stage: a prepared participant standing with the community']
  ];
  var AV_SVG =
    '<svg class="wl-av" viewBox="0 0 120 120" role="img" aria-label="Illustration of a person growing into a political leader">' +
    '<g class="av-aura"><circle cx="60" cy="60" r="56" fill="none" stroke="#baf33d" stroke-width="2" stroke-dasharray="3 7"/>' +
      '<path d="M10 34l9-11-3 10 9-2-10 12z M110 40l-9-11 3 10-9-2 10 12z" fill="#baf33d"/>' +
      '<path d="M6 76l7-8-2 8 7-2-8 9z M114 78l-7-8 2 8-7-2 8 9z" fill="#baf33d"/></g>' +
    '<g class="av-spark"><path d="M20 52l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M98 58l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M86 18l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#fff"/></g>' +
    '<path class="av-cape" d="M24 120L20 80C34 64 86 64 100 80L96 120Z" fill="#533afd"/>' +
    '<path class="av-cape" d="M24 120L20 80M96 120L100 80" stroke="#baf33d" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<path d="M28 120C28 90 42 78 60 78C78 78 92 90 92 120Z" fill="#e6e9ef"/>' +
    '<path d="M52 78l8 11 8-11" fill="none" stroke="#c4cad4" stroke-width="2" stroke-linejoin="round"/>' +
    '<path class="av-shawl" d="M36 90C46 80 74 80 84 90L90 106C74 97 46 97 30 106Z" fill="#533afd"/>' +
    '<path class="av-shawl" d="M32 102C48 94 72 94 88 102" fill="none" stroke="#baf33d" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path class="av-sash" d="M38 82L92 116L84 120L32 90Z" fill="#1c1e54"/>' +
    '<path class="av-sash" d="M62 92l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#baf33d"/>' +
    '<rect x="53" y="66" width="14" height="14" rx="6" fill="#b5764f"/>' +
    '<ellipse cx="60" cy="52" rx="16" ry="18" fill="#c98d63"/><circle cx="44" cy="54" r="3" fill="#c98d63"/><circle cx="76" cy="54" r="3" fill="#c98d63"/>' +
    '<path d="M43 50C41 30 79 30 77 50C73 41 66 38 60 38C54 38 47 41 43 50Z" fill="#1c1c22"/>' +
    '<circle cx="53" cy="53" r="1.9" fill="#1c1c22"/><circle cx="67" cy="53" r="1.9" fill="#1c1c22"/>' +
    '<path class="av-flat" d="M55 63Q60 65 65 63" stroke="#1c1c22" stroke-width="1.7" fill="none" stroke-linecap="round"/>' +
    '<path class="av-smile" d="M52 61Q60 70 68 61" stroke="#1c1c22" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
    '<g class="av-notebook"><g transform="rotate(-8 33 105)"><rect x="21" y="92" width="22" height="27" rx="3" fill="#baf33d"/><path d="M26 100h12M26 105h12M26 110h8" stroke="#1c1e54" stroke-width="1.7" stroke-linecap="round"/></g></g>' +
    '<g class="av-mega"><path d="M84 92L104 82V104L84 98Z" fill="#baf33d"/><rect x="77" y="91" width="9" height="9" rx="2" fill="#1c1e54"/><path d="M108 88q5 5 0 10M112 84q8 9 0 18" stroke="#665efd" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>' +
    '</svg>';
  function makeAv() { var d = document.createElement('span'); d.className = 'wl-av-box'; d.innerHTML = AV_SVG; return d; }
  /* Optional realistic portraits: assets/images/journey/stage-0.jpg … stage-7.jpg (see README there).
     Any stage that exists is used; a missing stage shows the previous one; with none, the drawing is used. */
  var photos = {}, avatars = [];
  function photoFor(n) { for (var k = n; k >= 0; k--) if (photos[k]) return photos[k]; return ''; }
  function setLevel(box, n) {
    var svg = box.querySelector('svg');
    for (var i = 1; i <= 7; i++) svg.classList.toggle('l' + i, i <= n);
    box.setAttribute('data-level', n);
    var src = photoFor(n);
    if (src) {
      var img = box.querySelector('.wl-av-photo');
      if (!img) { img = document.createElement('img'); img.className = 'wl-av-photo'; img.alt = ''; box.appendChild(img); }
      if (img.getAttribute('src') !== src) { img.classList.remove('is-in'); img.src = src; img.onload = function () { img.classList.add('is-in'); }; }
      box.classList.add('has-photo');
    }
  }
  function refreshPhotos() { avatars.forEach(function (b) { setLevel(b, Number(b.getAttribute('data-level') || 0)); }); }
  (function probe() {
    if (!BASE) return;
    for (var n = 0; n <= 7; n++) (function (n) {
      var im = new Image();
      im.onload = function () { photos[n] = im.src; refreshPhotos(); };
      im.src = BASE + 'assets/images/journey/stage-' + n + '.jpg';
    })(n);
  })();
  function mountAv(host, n, opts) {
    if (!host) return null;
    var b = makeAv(); if (opts && opts.big) b.classList.add('is-big');
    host.textContent = ''; host.classList.add('has-av'); host.appendChild(b);
    setLevel(b, n); avatars.push(b); return b;
  }

  /* ---- One stage card for the whole form: its picture changes between stages, and it hides two election surprises ---- */
  var HOVER = [
    'Every ward starts with one citizen who cares.',
    'Read the ballot before you cast it.',
    'Two ears, one mouth. Listen first.',
    'Say it plainly. People vote for what they understand.',
    'Booth by booth, street by street.',
    'Nomination papers: checked twice, filed on time.',
    'Show up. Then show up again.',
    'Ready to serve, not just to win.'
  ];
  var card = form.querySelector('[data-stage-card]');
  if (!card) { card = document.createElement('figure'); card.className = 'wl-stage-card'; card.setAttribute('data-stage-card', ''); form.insertBefore(card, form.firstChild); }
  card.innerHTML =
    '<button type="button" class="wl-stage-card-photo" aria-label="Your stage picture. Press for a surprise.">' +
      '<span class="wl-sp is-front" data-level="0"></span><span class="wl-sp" data-level="0"></span>' +
      '<span class="wl-stage-chip" aria-hidden="true">Level up</span>' +
    '</button>' +
    '<figcaption><small></small><strong></strong><span aria-live="polite"></span></figcaption>' +
    '<div class="wl-egg" aria-hidden="true"></div>';
  var photoBtn = card.querySelector('.wl-stage-card-photo'), layers = [].slice.call(card.querySelectorAll('.wl-sp'));
  var capSmall = card.querySelector('small'), capName = card.querySelector('strong'), capLine = card.querySelector('figcaption span'), eggEl = card.querySelector('.wl-egg');
  var front = 0, shown = -1, settle = 0, lineNow = '';

  function setLine(text) {
    lineNow = text;
    if (!card.classList.contains('is-hover')) capLine.textContent = text;
  }
  function showStage(n) {
    var copy = STAGE_COPY[n], up = shown >= 0 && n > shown, first = shown < 0;
    if (n === shown) return;
    clearTimeout(settle);
    layers.forEach(function (l) { l.classList.remove('is-in', 'is-in-back', 'is-out'); });
    var cur = layers[front], next = layers[front ^ 1];
    cur.classList.add('is-front');
    next.setAttribute('data-level', n);
    card.setAttribute('data-level', n);
    photoBtn.setAttribute('aria-label', copy[2] + '. Press for a surprise.');
    capName.textContent = copy[0];
    capSmall.setAttribute('data-stage', 'Stage ' + String(n + 1).padStart(2, '0') + ' of 08');
    if (first || still) {
      cur.setAttribute('data-level', n); next.classList.remove('is-front');
    } else {
      void next.offsetWidth;
      next.classList.add(up ? 'is-in' : 'is-in-back'); cur.classList.add('is-out');
      card.classList.remove('is-changing', 'is-down'); void card.offsetWidth;
      card.classList.add('is-changing'); card.classList.toggle('is-down', !up);
      settle = setTimeout(function () {
        cur.classList.remove('is-front', 'is-out'); cur.setAttribute('data-level', n);
        next.classList.remove('is-in', 'is-in-back'); next.classList.add('is-front');
        front ^= 1; card.classList.remove('is-changing');
      }, 900);
      shown = n; return;
    }
    shown = n;
  }
  /* hover: the stage speaks */
  function hoverOn() { if (!card.classList.contains('is-hover')) { card.classList.add('is-hover'); capLine.textContent = '“' + HOVER[shown < 0 ? 0 : shown] + '”'; } }
  function hoverOff() { card.classList.remove('is-hover'); capLine.textContent = lineNow; }
  photoBtn.addEventListener('mouseenter', hoverOn); photoBtn.addEventListener('mouseleave', hoverOff);
  photoBtn.addEventListener('focus', hoverOn); photoBtn.addEventListener('blur', hoverOff);

  /* click: an election moment, one after another */
  var INK = '<svg viewBox="0 0 60 90" width="44" height="66"><rect x="18" y="8" width="24" height="70" rx="12" fill="#c98d63"/><rect x="18" y="8" width="24" height="26" rx="12" fill="#3b1c86" class="egg-ink"/><rect x="18" y="26" width="24" height="10" fill="#c98d63"/><path d="M18 40v40c0 6 6 10 12 10s12-4 12-10V40" fill="#b5764f"/></svg>';
  var EGGS = [
    { say: 'Every vote is one person who showed up.', html:
      '<svg class="egg-box" viewBox="0 0 120 90" width="96" height="72"><g class="egg-slips"><rect class="s1" x="46" y="-26" width="28" height="18" rx="2" fill="#fff"/><rect class="s2" x="46" y="-26" width="28" height="18" rx="2" fill="#baf33d"/><rect class="s3" x="46" y="-26" width="28" height="18" rx="2" fill="#fff"/></g><rect x="14" y="34" width="92" height="52" rx="6" fill="#533afd"/><rect x="34" y="34" width="52" height="7" rx="2" fill="#0d1524"/><path d="M14 52h92" stroke="#baf33d" stroke-width="3"/><path d="M60 62l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#baf33d"/></svg>' +
      '<p><strong>Drop it in.</strong> Every vote is a person who showed up.</p>', confetti: 1300 },
    { say: 'Show your ink. Show up.', html:
      '<span class="egg-finger">' + INK + '</span><span class="egg-stamp">✓ Voted</span>' +
      '<p><strong>Show your ink.</strong> Then show up for the next one too.</p>' },
    { say: 'Counting day: every mark is a neighbour who turned up.', html:
      '<svg class="egg-tally" viewBox="0 0 150 60" width="128" height="52" fill="none" stroke="#baf33d" stroke-width="4" stroke-linecap="round"><path pathLength="1" d="M10 8v44"/><path pathLength="1" d="M28 8v44"/><path pathLength="1" d="M46 8v44"/><path pathLength="1" d="M64 8v44"/><path pathLength="1" d="M2 40L74 18"/><path pathLength="1" d="M92 8v44"/><path pathLength="1" d="M110 8v44"/><path pathLength="1" d="M128 8v44"/></svg>' +
      '<p><strong>Counting day.</strong> Every mark is a neighbour who turned up.</p>' },
    { say: 'மாறுவோம் மாற்றுவோம் — Let us change. Let us bring change.', html:
      '<svg class="egg-bunting" viewBox="0 0 400 34" preserveAspectRatio="none"><path d="M0 2Q100 20 200 2T400 2" stroke="#e6e9ef" stroke-width="1.2" fill="none"/>' +
      [30, 80, 130, 180, 230, 280, 330, 380].map(function (x, i) { var y = 2 + Math.sin(x / 400 * 6.28) * 0 + (i % 2 ? 6 : 4); return '<path class="f' + (i % 3) + '" d="M' + (x - 11) + ' ' + (y + 3) + 'L' + (x + 11) + ' ' + (y + 3) + 'L' + x + ' ' + (y + 30) + 'Z"/>'; }).join('') + '</svg>' +
      '<p lang="ta"><strong>மாறுவோம் மாற்றுவோம்</strong> <em>Let us change. Let us bring change.</em></p>', confetti: 200 }
  ];
  var eggN = 0, eggBusy = false;
  photoBtn.addEventListener('click', function () {
    if (eggBusy) return;
    var e = EGGS[eggN++ % EGGS.length];
    if (still) { say(e.say, 3800); return; }
    eggBusy = true;
    eggEl.className = 'wl-egg'; eggEl.innerHTML = e.html; void eggEl.offsetWidth;
    eggEl.classList.add('is-on', 'e' + (eggN - 1) % EGGS.length);
    if (e.confetti) setTimeout(confetti, e.confetti);
    say(e.say, 3600);
    setTimeout(function () { eggEl.className = 'wl-egg'; eggEl.textContent = ''; eggBusy = false; }, 3300);
  });
  var stateNote = rail && rail.querySelector('[data-progress-item="state"] small');
  var stateDefault = stateNote ? stateNote.textContent : '';

  /* ---- Toast ---- */
  var toast = document.createElement('div');
  toast.className = 'wl-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
  workspace.appendChild(toast);
  var toastTimer;
  function say(msg, ms) {
    toast.innerHTML = '<span aria-hidden="true">★</span>' + msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, ms || 2600);
  }

  function unlock(when) {
    BADGES.forEach(function (b) {
      if (b.after !== when || unlocked[b.id]) return;
      unlocked[b.id] = true;
      say('Badge unlocked: <strong>' + b.label + '</strong>');
    });
  }

  /* ---- Update the stage card and the rail's sub-label for a screen ---- */
  function place(name) {
    var idx = STEPS.indexOf(name), lvl = LEVEL[name] == null ? 0 : LEVEL[name];
    if (stateNote) stateNote.textContent = idx < 0 ? (name === 'complete' ? '5 answers given' : stateDefault) : (/^details/.test(name) ? '5 answers given' : 'Question ' + (idx + 1) + ' of 5');
    showStage(lvl);
    var stage = card.querySelector('small').getAttribute('data-stage');
    capSmall.textContent = stage + (idx < 0 ? '' : ' · about ' + LEFT[name] + ' min left');
    setLine(idx < 0 ? STAGE_COPY[lvl][1] : (CHEER[name] || ''));
    card.classList.remove('is-cheer'); void card.offsetWidth; card.classList.add('is-cheer');
  }

  /* ---- Confetti ---- */
  function confetti() {
    if (still) return;
    var cv = document.createElement('canvas');
    cv.className = 'wl-confetti'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d'), W = cv.width = innerWidth, H = cv.height = innerHeight;
    var colors = ['#baf33d', '#665efd', '#ffffff', '#c8f56c', '#533afd'];
    var ps = [];
    for (var i = 0; i < 110; i++) ps.push({ x: W / 2 + (Math.random() - .5) * 120, y: H * .38, vx: (Math.random() - .5) * 13, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 3, c: colors[i % colors.length], a: Math.random() * 6, va: (Math.random() - .5) * .3 });
    var t0 = performance.now();
    (function frame(t) {
      var el = t - t0; ctx.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.vy += .34; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.max(0, 1 - el / 2600);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
      });
      if (el < 2600) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  /* ---- Hooks into the form ---- */
  var lastScreen = '';
  function screenNow() { var a = form.querySelector('.wl-screen.is-active'); return a ? a.getAttribute('data-screen') : ''; }
  new MutationObserver(function () {
    var name = screenNow();
    if (name === lastScreen) return;
    lastScreen = name;
    place(name);
    document.body.classList.toggle('wl-on-complete', name === 'complete');
    if (name === 'complete') { showSummary(); confetti(); }
  }).observe(form, { subtree: true, attributes: true, attributeFilter: ['class'] });

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || t.type !== 'radio') return;
    var label = t.closest('label'), scr = screenNow();
    var group = t.closest('.wl-options');
    if (group) [].slice.call(group.querySelectorAll('label')).forEach(function (l) { l.classList.toggle('is-picked', l === label); l.classList.toggle('is-faded', l !== label); });
    unlock(scr);
  });
  form.addEventListener('submit', function () { if (form.checkValidity()) unlock('submit'); });
  window.addEventListener('resize', function () { place(screenNow()); });


  /* ---- Finish screen: summary of badges ---- */
  function showSummary() {
    var scr = form.querySelector('[data-screen="complete"]');
    if (!scr || scr.querySelector('.wl-summit')) return;
    var got = BADGES.filter(function (b) { return unlocked[b.id]; }).length;
    var s = document.createElement('div');
    s.className = 'wl-summit';
    s.innerHTML = '<span>⚑</span><div><strong>Summit reached.</strong><small>You collected ' + got + ' of ' + BADGES.length + ' milestones on the way.</small></div>';
    scr.insertBefore(s, scr.querySelector('.wl-lead') || scr.firstChild);
  }


  /* ---- Easter eggs ---- */
  function surge(msg) {
    var targets = avatars.filter(function (a) { return a.offsetParent !== null; });
    targets.forEach(function (a) { a.classList.remove('is-surge'); void a.offsetWidth; a.classList.add('is-surge'); setTimeout(function () { a.classList.remove('is-surge'); }, 2200); });
    card.classList.remove('is-surge'); void card.offsetWidth; card.classList.add('is-surge'); setTimeout(function () { card.classList.remove('is-surge'); }, 2400);
    say(msg, 4200); confetti();
  }
  // 1) Tap the hero five times for a power surge
  var taps = [];
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.wl-av-box')) return;
    var now = Date.now(); taps = taps.filter(function (t) { return now - t < 3500; }); taps.push(now);
    if (taps.length >= 5) { taps = []; surge('<strong>Power surge!</strong> Ordinary never looked so ready.'); }
  });
  // 2) Type "kalam" anywhere outside a field
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey || !e.key || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed === 'kalam') { typed = ''; surge('“Dream, dream, dream.” — Dr. A.P.J. Abdul Kalam'); }
  });

  place(screenNow());
})();
