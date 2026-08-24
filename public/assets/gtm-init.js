/*
 * Google Tag Manager: loader del contenedor GTM-NZV6VJDC.
 * Externalizado (servido con 'self') para cumplir la CSP sin 'unsafe-inline' en script-src,
 * igual que gtag-init.js. Debe cargarse DESPUES de gtag-init.js, que fija el Consent Mode v2
 * (denegado por defecto), de modo que las etiquetas gestionadas dentro de GTM hereden el
 * consentimiento. Comparte window.dataLayer con gtag.js (la misma cola de eventos).
 *
 * NOTA para la agencia SEM: este contenedor convive con la medicion directa por gtag.js
 * (GA4 G-BK37V83363 y Ads AW-586671676). No volver a declarar esos mismos IDs dentro de
 * GTM o se duplicarian eventos. Cualquier pixel/etiqueta de terceros que se anada en GTM
 * (LinkedIn, TikTok, Meta, Hotjar, etc.) debe sumarse tambien a la CSP en public/_headers.
 */
(function (w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var f = d.getElementsByTagName(s)[0],
    j = d.createElement(s),
    dl = l != 'dataLayer' ? '&l=' + l : '';
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-NZV6VJDC');
