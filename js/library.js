(function () {
  'use strict';

  var search = document.getElementById('lib-search');
  var form = document.querySelector('.lib-filter-bar');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.library-card-grid .resource-card'));
  var meta = document.querySelector('.lib-filter-meta');
  var empty = document.querySelector('.lib-empty');
  var pagination = document.querySelector('.pagination');

  if (!search || !form || !cards.length) return;

  var controls = {
    track: document.getElementById('f-track'),
    phase: document.getElementById('f-phase'),
    format: document.getElementById('f-format'),
    theme: document.getElementById('f-theme')
  };

  function normalise(value) {
    return String(value || '').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function selectedValue(control, allLabel) {
    if (!control || control.value === allLabel) return '';
    return control.value;
  }

  function applyFilters() {
    var query = normalise(search.value);
    var track = selectedValue(controls.track, 'All tracks');
    var phaseValue = selectedValue(controls.phase, 'All phases');
    var phase = phaseValue ? phaseValue.slice(0, 2) : '';
    var format = selectedValue(controls.format, 'All formats');
    var theme = selectedValue(controls.theme, 'All themes');
    var visible = 0;

    cards.forEach(function (card) {
      var matches = (!query || normalise(card.textContent).indexOf(query) !== -1) &&
        (!track || card.dataset.track === track) &&
        (!phase || card.dataset.phase === phase) &&
        (!format || card.dataset.format === format) &&
        (!theme || card.dataset.theme === theme);

      card.hidden = !matches;
      if (matches) visible += 1;
    });

    if (meta) meta.textContent = visible + (visible === 1 ? ' resource shown' : ' resources shown');
    if (empty) empty.hidden = visible !== 0;
    if (pagination) pagination.hidden = query !== '' || !!track || !!phase || !!format || !!theme;
  }

  search.addEventListener('input', applyFilters);
  form.addEventListener('change', applyFilters);
  form.addEventListener('reset', function () {
    window.setTimeout(applyFilters, 0);
  });

  applyFilters();
}());
