(function () {
  'use strict';

  // Compatibility entry point for tabs that cached the earlier page markup.
  // Keep this lightweight loader until those cached documents have expired.
  var script = document.createElement('script');
  script.src = (document.currentScript && document.currentScript.src ? document.currentScript.src : 'js/waitlist.js').replace(/waitlist\.js.*$/, 'waitlist-assessment.js?v=20260923');
  document.head.appendChild(script);
}());
