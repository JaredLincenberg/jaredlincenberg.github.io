(function () {
  var dialog = document.getElementById('photo-lightbox');
  if (!dialog) return;

  var frames = Array.prototype.slice.call(document.querySelectorAll('.photo-grid .photo-frame'));
  if (!frames.length) return;

  var img = document.getElementById('lightbox-image');
  var locationEl = document.getElementById('lightbox-location');
  var dateEl = document.getElementById('lightbox-date');
  var captionEl = document.getElementById('lightbox-caption');
  var observationEl = document.getElementById('lightbox-observation');
  var closeBtn = dialog.querySelector('.lightbox-close');
  var prevBtn = dialog.querySelector('.lightbox-prev');
  var nextBtn = dialog.querySelector('.lightbox-next');

  var currentIndex = 0;
  var triggerEl = null;

  function isSingleColumn(frame) {
    var grid = frame.closest('.photo-grid');
    if (!grid) return true;
    var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean);
    return cols.length <= 1;
  }

  function render(index) {
    var frame = frames[index];
    var frameImg = frame.querySelector('img');
    img.src = frame.getAttribute('href');
    img.alt = frameImg ? frameImg.alt : '';
    locationEl.textContent = frame.getAttribute('data-location') || '';
    dateEl.textContent = frame.getAttribute('data-date') || '';
    var caption = frame.getAttribute('data-caption') || '';
    captionEl.textContent = caption;
    captionEl.style.display = caption ? '' : 'none';
    var observation = frame.getAttribute('data-observation') || '';
    if (observation) {
      observationEl.href = observation;
      observationEl.style.display = '';
    } else {
      observationEl.style.display = 'none';
    }
  }

  function open(index, trigger) {
    currentIndex = index;
    triggerEl = trigger;
    render(currentIndex);
    dialog.showModal();
    closeBtn.focus();
  }

  function go(delta) {
    currentIndex = (currentIndex + delta + frames.length) % frames.length;
    render(currentIndex);
  }

  frames.forEach(function (frame, index) {
    frame.addEventListener('click', function (event) {
      // On a single-column layout the thumbnail already spans ~the full
      // width, so there's no lightbox benefit — fall through to the
      // anchor's default behavior (opens the raw image).
      if (isSingleColumn(frame)) return;
      event.preventDefault();
      open(index, frame);
    });
  });

  closeBtn.addEventListener('click', function () { dialog.close(); });
  prevBtn.addEventListener('click', function () { go(-1); });
  nextBtn.addEventListener('click', function () { go(1); });

  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', function () {
    if (triggerEl) triggerEl.focus();
    triggerEl = null;
  });

  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
      go(-1);
    } else if (event.key === 'ArrowRight') {
      go(1);
    } else if (event.key === 'Tab') {
      // <dialog> doesn't trap focus on its own, so wrap Tab/Shift+Tab
      // between the dialog's own focusable controls.
      var focusable = Array.prototype.slice.call(dialog.querySelectorAll('button, a[href]'))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  var touchStartX = null;
  dialog.addEventListener('touchstart', function (event) {
    touchStartX = event.changedTouches[0].clientX;
  });
  dialog.addEventListener('touchend', function (event) {
    if (touchStartX === null) return;
    var delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    touchStartX = null;
  });
})();
