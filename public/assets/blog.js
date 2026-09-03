/* Blog - JS autocontenido (sin dependencias del app.js de la home).
   Externalizado para cumplir la CSP sin 'unsafe-inline' (M26).
   Maneja: nav scroll, reveals, acordeón FAQ, TOC scroll-spy, WhatsApp,
   y el seguimiento mínimo de eventos hacia GA4 si gtag está disponible. */
(function () {
  'use strict';

  var WA_URL = 'https://wa.me/971554722025';

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  /* ── Reduced motion ── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduce-motion');
  }

  /* ── NAV: transparente arriba, sólida al hacer scroll ── */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('at-top', window.scrollY < 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Reveal animations ── */
  var revealEls = document.querySelectorAll('.fade, .reveal-stagger');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }
  // Avisa a boot.js de que el reveal esta resuelto por cualquiera de las dos
  // vias. Sin esta marca, a los 3 s el CSS muestra todo el contenido.
  document.documentElement.classList.add('reveal-ok');

  /* ── FAQ accordion ── */
  var faqItems = [].slice.call(document.querySelectorAll('.faq-item'));
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    var panel = item.querySelector('.faq-a');
    var inner = panel && panel.querySelector('.faq-a-inner');
    if (!btn || !panel || !inner) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var willOpen = !item.classList.contains('open');
      faqItems.forEach(function (i) {
        i.classList.remove('open');
        var p = i.querySelector('.faq-a');
        var b = i.querySelector('.faq-q');
        if (p) p.style.maxHeight = '0';
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = inner.scrollHeight + 'px';
      }
    });
  });
  window.addEventListener('resize', function () {
    var open = document.querySelector('.faq-item.open .faq-a');
    var inner = open && open.querySelector('.faq-a-inner');
    if (open && inner) open.style.maxHeight = inner.scrollHeight + 'px';
  });

  /* ── TOC scroll-spy ── */
  var tocLinks = [].slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    var headings = tocLinks.map(function (a) {
      var id = a.getAttribute('href').slice(1);
      var h = document.getElementById(id);
      if (h) map[id] = a;
      return h;
    }).filter(Boolean);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.remove('active'); });
        var active = map[e.target.id];
        if (active) active.classList.add('active');
      });
    }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });
    headings.forEach(function (h) { spy.observe(h); });
  }

  /* ── WhatsApp float ── */
  var waLink = document.querySelector('.wa-float a');
  if (waLink) {
    waLink.setAttribute('href', WA_URL + '?text=' + encodeURIComponent('Hola. Vengo del blog de Horizonte Emirates y me interesa recibir informacion sobre inversion inmobiliaria en UAE.'));
    waLink.setAttribute('target', '_blank');
    waLink.setAttribute('rel', 'noopener');
    waLink.addEventListener('click', function () {
      track('whatsapp_click', { event_category: 'contact', event_label: 'blog_whatsapp_float' });
    });
  }

  /* ── CTA tracking (clics que van al formulario de la home) ── */
  [].slice.call(document.querySelectorAll('a[href*="#form"]')).forEach(function (link) {
    link.addEventListener('click', function () {
      var label = (this.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      track('generate_lead_click', { event_category: 'engagement', event_label: label || 'blog_cta_form', link_target: '#form' });
    });
  });

  /* ── Category filter (hub) ── */
  var chips = [].slice.call(document.querySelectorAll('.cat-chip[data-cat]'));
  if (chips.length) {
    var cards = [].slice.call(document.querySelectorAll('.post-card[data-cat]'));
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var cat = this.dataset.cat;
        chips.forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        cards.forEach(function (card) {
          var show = cat === 'all' || card.dataset.cat === cat;
          card.style.display = show ? '' : 'none';
        });
        track('blog_filter', { event_category: 'engagement', event_label: cat });
      });
    });
  }
})();

// Menú móvil (hamburguesa) y nav-auto-ocultable al scroll: movidos a assets/common.js (F6, compartido).
