/* Marca que el JavaScript esta vivo, antes del primer pintado.
 *
 * Todo el contenido con las clases fade y reveal-stagger nace en opacity:0 y
 * espera a que el IntersectionObserver de app.js (o de blog.js) le anada la
 * clase "in". Sin esa marca, el CSS lo muestra ya: mas vale una pagina sin
 * animacion que una pagina en blanco.
 *
 * Se carga sincrono en el <head>, no con defer, para que la clase este puesta
 * antes de que se pinte nada y no haya parpadeo. Nombre neutro a proposito:
 * si esto viviera dentro de gtag-init.js, un bloqueador de anuncios dejaria la
 * web invisible.
 *
 * Motivo: el 2-sep-2026 se midio que el 68% de la altura de la home quedaba
 * invisible cuando app.js no llegaba a ejecutarse.
 * Ver docs/auditorias/DIAGNOSTICO_DAYVO_2026-09-02.md
 */
(function () {
  var h = document.documentElement;
  h.classList.add('js');

  // Red de seguridad para el caso en que app.js si se descargue pero muera
  // antes de registrar el observer (excepcion, version desincronizada por
  // cache, descarga cortada a medias). Quien registra el observer marca
  // "reveal-ok"; si a los 3 segundos de cargar la pagina nadie lo ha hecho,
  // se retira la marca "js" y el CSS revela todo el contenido.
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (h.classList.contains('reveal-ok')) return;
      // Solo se retira la marca si de verdad hay algo esperando a ser revelado:
      // en una pagina sin fade ni reveal-stagger no habria nada que rescatar y
      // quitar la clase solo confundiria a quien lea el DOM.
      if (document.querySelector('.fade, .reveal-stagger')) h.classList.remove('js');
    }, 3000);
  });
})();
