/* Launch event pop-up — shown once per visit, on the home page */
(function () {
  var script = document.currentScript, base = script && script.src ? script.src.replace(/js\/launch-popup\.js.*$/, '') : '';
  if (!base || !document.createElement('dialog').showModal) return;
  if (!document.querySelector('.hero-home')) return;   /* home page only */
  var KEY = 'cfp-launch-popup';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}

  function daysToGo() {
    var now = new Date(), y = now.getFullYear(), t = new Date(y, 9, 15);
    if (new Date(y, 9, 15, 23, 59) < now) t = new Date(y + 1, 9, 15);
    return Math.ceil((t - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  }
  function build() {
    var left = '15-10-2026';
    var dlg = document.createElement('dialog');
    dlg.className = 'launch-pop'; dlg.setAttribute('aria-labelledby', 'launch-pop-title');
    dlg.innerHTML = '<div class="lp-card">' +
      '<div class="lp-media" style="background-image:url(\'' + base + 'assets/images/public-convention.jpg\')"><span class="lp-date"><small>Oct</small><strong>15</strong></span></div>' +
      '<div class="lp-body">' +
        '<p class="lp-eyebrow"><i></i>Launch event · ' + left + '</p>' +
        '<h2 id="launch-pop-title">Be there when the Centre begins.</h2>' +
        '<p class="lp-text">We launch on <strong>October 15</strong>, the birthday of Dr. A.P.J. Abdul Kalam — and members of his family will be joining us for the launch.</p>' +
        '<p class="lp-meta">Venue and time: NH 47 Bypass to Kulathur Road, Neelambur, Coimbatore and 10:32AM · Free to attend</p>' +
        '<div class="lp-actions"><a class="btn" href="' + base + 'events/centre-for-polity-launch.html">See launch details →</a><button type="button" class="lp-later">Maybe later</button></div>' +
      '</div></div>' +
      '<button type="button" class="lp-close" aria-label="Close">✕</button>';
    document.body.appendChild(dlg);
    var close = function () { dlg.close(); };
    dlg.querySelector('.lp-close').addEventListener('click', close);
    dlg.querySelector('.lp-later').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('close', function () { dlg.remove(); });
    dlg.showModal();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  }
  // On the home page, wait for the intro to finish first
  var tries = 0;
  (function wait() {
    if (document.documentElement.classList.contains('hh-loading') && tries++ < 60) return setTimeout(wait, 250);
    setTimeout(build, document.documentElement.classList.contains('hh-js') ? 2600 : 1200);
  })();
})();
