/* proyectos.html - JS externalizado (para retirar 'unsafe-inline' de script-src). */

// ── UTM capture (persistente en sessionStorage, igual que la home)
(function () {
  var p = new URLSearchParams(window.location.search);
  var fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid'];
  fields.forEach(function (f) { var v = p.get(f); if (v) sessionStorage.setItem(f, v); });
})();

// ── Tracking por atributos data-track (sustituye onclick="gtag(...)")
(function () {
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el || typeof window.gtag !== 'function') return;
    var p = {};
    if (el.dataset.trackButton) p.button_text = el.dataset.trackButton;
    if (el.dataset.trackSection) p.section = el.dataset.trackSection;
    if (el.dataset.trackProject) p.project = el.dataset.trackProject;
    if (el.dataset.trackAction) p.action = el.dataset.trackAction;
    if (el.dataset.trackContext) p.context = el.dataset.trackContext;
    window.gtag('event', el.getAttribute('data-track'), p);
  });
})();

// ── Carrusel (dots dinámicos + lightbox + botones prev/next por listener)
var carouselState = {};
function initCarousel(id) {
  var track = document.getElementById('track-' + id);
  var dotsWrap = document.getElementById('dots-' + id);
  if (!track || !dotsWrap) return;
  var imgs = [].slice.call(track.querySelectorAll('img'));
  var count = imgs.length;
  carouselState[id] = 0;
  var c = document.getElementById('carousel-' + id);

  if (count <= 1) {
    dotsWrap.style.display = 'none';
    c.querySelectorAll('.carousel-btn').forEach(function (b) { b.style.display = 'none'; });
  } else {
    for (var i = 0; i < count; i++) {
      var b = document.createElement('button');
      b.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ir a imagen ' + (i + 1));
      (function (idx) { b.addEventListener('click', function () { goSlide(id, idx); }); })(i);
      dotsWrap.appendChild(b);
    }
    var prevBtn = c.querySelector('.carousel-btn.prev');
    var nextBtn = c.querySelector('.carousel-btn.next');
    if (prevBtn) prevBtn.addEventListener('click', function () { prevSlide(id); });
    if (nextBtn) nextBtn.addEventListener('click', function () { nextSlide(id); });
  }

  var set = imgs.map(function (im) { return { src: im.src, alt: im.alt }; });
  imgs.forEach(function (im, i) { im.addEventListener('click', function () { openLightbox(set, i); }); });
}
['1', '2', '3'].forEach(initCarousel);

function goSlide(id, idx) {
  var track = document.getElementById('track-' + id);
  var dots = document.querySelectorAll('#dots-' + id + ' .carousel-dot');
  var count = track.children.length;
  carouselState[id] = (idx + count) % count;
  track.style.transform = 'translateX(-' + (carouselState[id] * 100) + '%)';
  dots.forEach(function (d, i) { d.classList.toggle('active', i === carouselState[id]); });
  var project = document.getElementById('carousel-' + id).dataset.project;
  if (typeof window.gtag === 'function') window.gtag('event', 'carousel_slide', { project: project, slide: carouselState[id] });
}
function nextSlide(id) { goSlide(id, carouselState[id] + 1); }
function prevSlide(id) { goSlide(id, carouselState[id] - 1); }

// ── Lightbox
(function () {
  var box = document.getElementById('lightbox');
  var img = document.getElementById('lb-img');
  var closeBtn = document.getElementById('lb-close');
  var prevBtn = document.getElementById('lb-prev');
  var nextBtn = document.getElementById('lb-next');
  var images = [], index = 0;

  function render() {
    var cur = images[index];
    if (!cur) return;
    img.src = cur.src; img.alt = cur.alt || 'Imagen ampliada del proyecto';
    var show = images.length > 1;
    prevBtn.style.display = show ? 'flex' : 'none';
    nextBtn.style.display = show ? 'flex' : 'none';
  }
  window.openLightbox = function (imgs, start) {
    images = imgs; index = start || 0; render();
    box.classList.add('open'); box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  function close() {
    box.classList.remove('open'); box.setAttribute('aria-hidden', 'true');
    img.src = ''; document.body.style.overflow = '';
  }
  closeBtn.addEventListener('click', close);
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  prevBtn.addEventListener('click', function () { index = (index - 1 + images.length) % images.length; render(); });
  nextBtn.addEventListener('click', function () { index = (index + 1) % images.length; render(); });
  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });
})();

// ── Scroll depth tracking
(function () {
  var marks = [25, 50, 75, 100]; var fired = {};
  window.addEventListener('scroll', function () {
    var denom = document.body.scrollHeight - window.innerHeight;
    if (denom <= 0) return;
    var pct = Math.round((window.scrollY / denom) * 100);
    marks.forEach(function (m) {
      if (pct >= m && !fired[m]) {
        fired[m] = 1;
        if (typeof window.gtag === 'function') window.gtag('event', 'scroll_depth', { percentage: m, page: 'proyectos' });
      }
    });
  }, { passive: true });
})();

// ── Header con fondo al hacer scroll (coherencia con home)
window.addEventListener('scroll', function () {
  document.querySelector('.header').style.background = window.scrollY > 24 ? 'rgba(13,27,42,.98)' : 'rgba(13,27,42,.96)';
}, { passive: true });

// ── Menú móvil (hamburguesa)
(function () {
  var b = document.getElementById('nav-burger'), m = document.getElementById('mobile-nav');
  if (!b || !m) return;
  function set(open) {
    m.classList.toggle('open', open); b.classList.toggle('open', open);
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    m.setAttribute('aria-hidden', open ? 'false' : 'true');
    b.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  b.addEventListener('click', function () { set(!m.classList.contains('open')); });
  m.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
})();

// Nav que se oculta al bajar y reaparece al subir (maximiza el espacio de lectura en móvil)
(function () {
  var nav = document.querySelector('.header');
  if (!nav) return;
  var last = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY || window.pageYOffset;
    var mob = document.getElementById('mobile-nav');
    if (mob && mob.classList.contains('open')) { nav.classList.remove('nav-hidden'); last = y; return; }
    if (y > 140 && y > last + 4) { nav.classList.add('nav-hidden'); }
    else if (y < last - 4 || y < 140) { nav.classList.remove('nav-hidden'); }
    last = y;
  }, { passive: true });
})();
