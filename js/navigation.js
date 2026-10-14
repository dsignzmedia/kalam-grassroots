/* Site switches. Set to true to show the item again.
   - CFP_SHOW_LANG_SWITCHER: the "தமிழ் / EN" language switcher in the header. While false the site always shows English.
   - CFP_SHOW_LAUNCH_EVENT_LINK: the "View launch event →" button in the top announcement bar.
   - CFP_SHOW_LAUNCH_POPUP: the launch-event pop-up on the home page (js/launch-popup.js). */
window.CFP_SHOW_LANG_SWITCHER = false;
window.CFP_SHOW_LAUNCH_EVENT_LINK = false;
window.CFP_SHOW_LAUNCH_POPUP = false;           // the "Be there when the Centre begins" launch-event pop-up on the home page

(function () {
  var mobileMenu = window.matchMedia('(max-width: 1100px)');
  var siteBase = (document.currentScript && document.currentScript.src ? document.currentScript.src : '').replace(/js\/navigation\.js.*$/, '');

  document.querySelectorAll('.utility-note').forEach(function (note) {
    if (!window.CFP_SHOW_LAUNCH_EVENT_LINK) return;
    if (note.querySelector('.utility-event-link')) return;
    var link = document.createElement('a');
    link.className = 'utility-event-link';
    link.href = siteBase + 'events/centre-for-polity-launch.html';
    link.setAttribute('aria-label', 'View details for the Centre launch event on October 15');
    link.innerHTML = '<span>View launch event</span><b aria-hidden="true">→</b>';
    note.appendChild(link);
  });

  document.querySelectorAll('.site-header').forEach(function (header, index) {
    var row = header.querySelector('.header-row');
    var nav = header.querySelector('.primary-nav');
    var actions = header.querySelector('.header-actions');

    if (!row || !nav) return;

    var navId = nav.id || 'primary-navigation-' + (index + 1);
    nav.id = navId;

    var toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', navId);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.innerHTML = '<span class="nav-toggle-icon" aria-hidden="true">☰</span><span>Menu</span>';
    row.insertBefore(toggle, nav);

    var details = Array.prototype.slice.call(nav.querySelectorAll('details'));

    function closeDropdowns(except) {
      details.forEach(function (item) {
        if (item !== except) item.removeAttribute('open');
      });
    }

    function setMenuOpen(open) {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.querySelector('.nav-toggle-icon').textContent = open ? '×' : '☰';
      if (!open) closeDropdowns();
    }

    details.forEach(function (item) {
      item.removeAttribute('open');
      item.addEventListener('toggle', function () {
        if (item.open) closeDropdowns(item);
      });
    });

    toggle.addEventListener('click', function () {
      setMenuOpen(!header.classList.contains('nav-open'));
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (mobileMenu.matches) setMenuOpen(false);
      });
    });

    document.addEventListener('click', function (event) {
      if (!header.contains(event.target)) {
        closeDropdowns();
        if (mobileMenu.matches) setMenuOpen(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        var wasOpen = header.classList.contains('nav-open');
        closeDropdowns();
        if (wasOpen) {
          setMenuOpen(false);
          toggle.focus();
        }
      }
    });

    function syncLayout() {
      setMenuOpen(false);
    }

    if (mobileMenu.addEventListener) {
      mobileMenu.addEventListener('change', syncLayout);
    } else {
      mobileMenu.addListener(syncLayout);
    }

    header.classList.add('nav-ready');
    if (actions) actions.setAttribute('aria-label', 'Site actions');
  });

  var imageAssets = {
    campus: siteBase + 'assets/images/campus.jpg',
    classroom: siteBase + 'assets/images/classroom.jpg',
    field: siteBase + 'assets/images/field-organising.jpg',
    portrait: siteBase + 'assets/images/community-leader.jpg',
    resources: siteBase + 'assets/images/learning-resources.jpg',
    mentoring: siteBase + 'assets/images/mentoring-circle.jpg',
    convention: siteBase + 'assets/images/public-convention.jpg',
    map: siteBase + 'assets/images/tamil-nadu-map.jpg'
  };

  function imageKeyFor(label, index) {
    var text = label.toLowerCase();
    if (/map|district|network|location|travel/.test(text)) return 'map';
    if (/campus|residential|dining|room|institute/.test(text)) return 'campus';
    if (/library|resource|primer|checklist|template|guide|compliance|video|worksheet|nomination/.test(text)) return 'resources';
    if (/convention|open house|partner|current cohort|previous/.test(text)) return 'convention';
    if (/mentor|case discussion|reflection/.test(text)) return 'mentoring';
    if (/classroom|training|faculty|learning|programme|spokesperson/.test(text)) return 'classroom';
    if (/field|campaign|organising|exercise/.test(text)) return 'field';
    if (/portrait|woman|community leader|leadership/.test(text)) {
      return ['portrait', 'field', 'mentoring'][index % 3];
    }
    return 'classroom';
  }

  document.querySelectorAll('.site-image').forEach(function (frame, index) {
    var label = frame.textContent.trim() || 'Dr. A.P.J. Abdul Kalam Centre for Ethics and Politics learning community';
    var image = document.createElement('img');
    image.src = imageAssets[imageKeyFor(label, index)];
    image.alt = label;
    image.loading = frame.classList.contains('tall') ? 'eager' : 'lazy';
    image.decoding = 'async';
    frame.textContent = '';
    frame.appendChild(image);
  });
})();

/* Language switcher: English / தமிழ். Choice is remembered on this device; Tamil strings live in js/i18n-ta.js. */
(function () {
  /* switcher hidden: stay in English (a Tamil choice saved on this device earlier is ignored) and build nothing */
  if (!window.CFP_SHOW_LANG_SWITCHER) return;
  document.documentElement.classList.add('lang-on');
  var base = (document.currentScript && document.currentScript.src ? document.currentScript.src : '').replace(/js\/navigation\.js.*$/, '');
  var KEY = 'cfp-lang', SKIP = /^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/;
  var stored = null; try { stored = localStorage.getItem(KEY); } catch (e) {}
  var lang = stored === 'ta' ? 'ta' : 'en', dict = null, originals = new WeakMap(), loading = false;

  function norm(t) { return t.replace(/\s+/g, ' ').trim(); }
  function each(fn) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { if (!SKIP.test(n.parentNode.tagName)) fn(n); }
  }
  function translate() {
    if (!dict) return;
    each(function (n) {
      var raw = n.nodeValue, t = norm(raw); if (!t) return;
      var suffix = / ▾$/.test(t) ? ' ▾' : '', key = suffix ? t.slice(0, -2) : t;
      if (dict[key] != null) {
        if (!originals.has(n)) originals.set(n, raw);
        n.nodeValue = raw.replace(t, dict[key] + suffix);
      }
    });
  }
  function restore() { each(function (n) { if (originals.has(n)) { n.nodeValue = originals.get(n); originals.delete(n); } }); }
  function load(cb) {
    if (window.CFP_TA) { dict = window.CFP_TA; return cb(); }
    if (loading) return; loading = true;
    var s = document.createElement('script'); s.src = base + 'js/i18n-ta.js?v=20261140';
    s.onload = function () { dict = window.CFP_TA; cb(); }; document.head.appendChild(s);
  }
  function apply(next, save) {
    lang = next; document.documentElement.lang = next === 'ta' ? 'ta' : 'en';
    if (save) { try { localStorage.setItem(KEY, next); } catch (e) {} }
    if (next === 'ta') load(function () { translate(); mark(); }); else { restore(); mark(); }
    mark();
  }

  var buttons = [].slice.call(document.querySelectorAll('.lang-toggle')), menus = [];
  function mark() {
    menus.forEach(function (m) {
      [].slice.call(m.menu.querySelectorAll('[data-lang]')).forEach(function (o) {
        var on = o.getAttribute('data-lang') === lang; o.setAttribute('aria-checked', String(on));
      });
    });
    buttons.forEach(function (b) { b.classList.toggle('is-ta', lang === 'ta'); });
  }
  function closeAll(except) { menus.forEach(function (m) { if (m.btn !== except) { m.menu.hidden = true; m.btn.setAttribute('aria-expanded', 'false'); } }); }

  buttons.forEach(function (btn) {
    var wrap = document.createElement('div'); wrap.className = 'lang-wrap';
    btn.parentNode.insertBefore(wrap, btn); wrap.appendChild(btn);
    btn.setAttribute('aria-haspopup', 'menu'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Choose language');
    btn.innerHTML = '<span class="lang-ta">தமிழ்</span><span class="lang-sep"> / </span><span class="lang-en">EN</span><span class="lang-caret" aria-hidden="true"> ▾</span>';
    var menu = document.createElement('div'); menu.className = 'lang-menu'; menu.setAttribute('role', 'menu'); menu.hidden = true;
    menu.innerHTML = '<button type="button" role="menuitemradio" data-lang="en" aria-checked="false"><b aria-hidden="true">✓</b>English</button><button type="button" role="menuitemradio" data-lang="ta" aria-checked="false" lang="ta"><b aria-hidden="true">✓</b>தமிழ்</button>';
    wrap.appendChild(menu); menus.push({ btn: btn, menu: menu });
    btn.addEventListener('click', function (e) {
      e.stopPropagation(); var open = menu.hidden; closeAll(btn); menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
      if (open) menu.querySelector('[aria-checked="true"]').focus();
    });
    menu.addEventListener('click', function (e) {
      var o = e.target.closest('[data-lang]'); if (!o) return;
      menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus();
      if (o.getAttribute('data-lang') !== lang) apply(o.getAttribute('data-lang'), true);
    });
    menu.addEventListener('keydown', function (e) {
      var items = [].slice.call(menu.querySelectorAll('[data-lang]')), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
      if (e.key === 'Escape') { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  });
  document.addEventListener('click', function () { closeAll(); });
  mark();
  if (lang === 'ta') apply('ta', false);
})();
