/* common.js - Lógica de navegación compartida por todas las páginas con nav.
   Externalizado para no triplicar el mismo código en app.js / proyectos.js / blog.js (F6).
   CSP-safe (sin inline) y sin dependencias. Se carga con defer antes del JS de cada página. */
(function () {
  'use strict';

  // Menú móvil (hamburguesa): abre/cierra el panel y sincroniza ARIA.
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

  // Nav que se oculta al bajar y reaparece al subir (maximiza el espacio de lectura en móvil).
  // Soporta <nav id="nav"> (home/blog) y <header class="header"> (proyectos).
  (function () {
    var nav = document.getElementById('nav') || document.querySelector('.header');
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
})();
