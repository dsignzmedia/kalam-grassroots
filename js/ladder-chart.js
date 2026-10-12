/* Progressive reveal for the leadership journey chart. */
(function () {
  var chart = document.querySelector('.akf-journey-chart');
  if (!chart) return;
  chart.classList.add('akf-chart-animate');
  [].slice.call(chart.querySelectorAll('.akf-chart-programmes article')).forEach(function (item, i) { item.style.setProperty('--delay', (.12 + i * .13) + 's'); });
  [].slice.call(chart.querySelectorAll('.akf-milestones li')).forEach(function (item, i) { item.style.setProperty('--delay', (.65 + i * .075) + 's'); });
  var phases = chart.nextElementSibling;
  if (phases && phases.classList.contains('akf-phases')) [].slice.call(phases.children).forEach(function (item, i) { item.style.setProperty('--delay', (1.38 + i * .1) + 's'); });
  function reveal() { chart.classList.add('is-ready'); }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { reveal(); return; }
  var observer = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    reveal(); observer.disconnect();
  }, { threshold: .18 });
  observer.observe(chart);
})();
