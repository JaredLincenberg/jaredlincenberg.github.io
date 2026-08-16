(function () {
  var body = document.querySelector('.article-body');
  var control = document.querySelector('.text-size-control');
  if (!body || !control) return;

  var steps = [60, 80, 100, 120, 140, 160, 180, 200];
  var base = 17;
  var dec = control.querySelector('[data-dir="-1"]');
  var inc = control.querySelector('[data-dir="1"]');
  var value = control.querySelector('.text-size-value');

  var stored = null;
  try { stored = parseInt(localStorage.getItem('article-text-size-pct'), 10); } catch (e) {}
  var idx = steps.indexOf(stored);
  if (idx === -1) idx = steps.indexOf(100);

  function render() {
    var pct = steps[idx];
    var px = Math.round(base * pct / 100);
    value.textContent = pct + '%';
    body.style.setProperty('--article-font-size', px + 'px');
    dec.disabled = idx === 0;
    inc.disabled = idx === steps.length - 1;
  }

  function persist() {
    try { localStorage.setItem('article-text-size-pct', steps[idx]); } catch (e) {}
  }

  render();

  dec.addEventListener('click', function () {
    if (idx > 0) { idx--; render(); persist(); }
  });
  inc.addEventListener('click', function () {
    if (idx < steps.length - 1) { idx++; render(); persist(); }
  });
})();
