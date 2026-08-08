(function () {
  var toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  var labels = document.querySelectorAll('.theme-toggle-label');

  function syncLabels(theme) {
    labels.forEach(function (label) {
      label.classList.toggle('active', label.getAttribute('data-theme-label') === theme);
    });
  }

  syncLabels(document.documentElement.getAttribute('data-theme'));

  toggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    syncLabels(next);
  });
})();
