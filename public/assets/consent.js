/*
 * Horizonte Emirates - Gestor de consentimiento de cookies (RGPD / LSSI-CE)
 * Integrado con Google Consent Mode v2.
 *
 * El estado por defecto (denied) se fija inline en cada página ANTES de gtag('config'),
 * de modo que GA4 no escribe cookies ni envía datos identificables hasta el consentimiento.
 * Este script pinta el banner, persiste la decisión y emite gtag('consent','update').
 *
 * API pública: window.heOpenConsent()  → reabre el panel para cambiar la decisión.
 */
(function () {
  "use strict";
  var STORE_KEY = "he_consent_v1";
  var POLICY_URL = "legal.html#cookies";
  var META_PIXEL_ID = "972040562129072";

  function readDecision() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); }
    catch (e) { return null; }
  }
  function writeDecision(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ state: state, ts: Date.now() })); }
    catch (e) { /* almacenamiento no disponible: la decisión vale solo para esta carga */ }
  }
  function loadMetaPixel() {
    if (window._heMetaPixelLoaded || !META_PIXEL_ID) return;
    window._heMetaPixelLoaded = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }
  function applyConsent(state) {
    var g = state === "granted" ? "granted" : "denied";
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: g,
        ad_storage: g,
        ad_user_data: g,
        ad_personalization: g
      });
    }
    if (state === "granted") loadMetaPixel();
  }

  function injectStyles() {
    if (document.getElementById("he-consent-styles")) return;
    var css = ""
      + "#he-consent{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;"
      + "background:#0D1B2A;color:#F8F6F1;border-top:1px solid rgba(196,148,42,.45);"
      + "box-shadow:0 -8px 30px rgba(7,18,31,.35);font-family:'Inter',system-ui,sans-serif;"
      + "transform:translateY(100%);transition:transform .35s cubic-bezier(.22,1,.36,1)}"
      + "#he-consent.open{transform:translateY(0)}"
      + "#he-consent .he-c-inner{max-width:1100px;margin:0 auto;padding:18px 24px;"
      + "display:flex;align-items:center;gap:20px;flex-wrap:wrap}"
      + "#he-consent .he-c-txt{flex:1;min-width:260px;font-size:13.5px;line-height:1.6;color:rgba(248,246,241,.82)}"
      + "#he-consent .he-c-txt strong{color:#F8F6F1;font-weight:600}"
      + "#he-consent .he-c-txt a{color:#C4942A;text-decoration:underline}"
      + "#he-consent .he-c-actions{display:flex;gap:10px;flex-wrap:wrap}"
      + "#he-consent button{font-family:inherit;font-size:12px;font-weight:600;letter-spacing:.06em;"
      + "text-transform:uppercase;padding:11px 22px;border-radius:2px;cursor:pointer;border:1px solid transparent;transition:.2s}"
      + "#he-consent .he-c-accept{background:#C4942A;color:#07121F}"
      + "#he-consent .he-c-accept:hover{filter:brightness(1.08)}"
      + "#he-consent .he-c-reject{background:transparent;color:rgba(248,246,241,.85);border-color:rgba(248,246,241,.35)}"
      + "#he-consent .he-c-reject:hover{border-color:rgba(248,246,241,.7);color:#fff}"
      + "@media(max-width:640px){#he-consent .he-c-inner{padding:16px 20px}"
      + "#he-consent .he-c-actions{width:100%}#he-consent .he-c-actions button{flex:1}}"
      + "@media(prefers-reduced-motion:reduce){#he-consent{transition:none}}";
    var st = document.createElement("style");
    st.id = "he-consent-styles";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function buildBanner() {
    var bar = document.createElement("div");
    bar.id = "he-consent";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Aviso de cookies");
    bar.setAttribute("aria-live", "polite");
    bar.innerHTML =
      '<div class="he-c-inner">' +
        '<div class="he-c-txt"><strong>Usamos cookies.</strong> ' +
        'Utilizamos cookies de análisis y de publicidad (Google y Meta) para medir el uso del sitio y nuestras campañas. ' +
        'Puede aceptarlas o rechazarlas. Consulte nuestra <a href="' + POLICY_URL + '">política de cookies</a>.</div>' +
        '<div class="he-c-actions">' +
          '<button type="button" class="he-c-reject">Rechazar</button>' +
          '<button type="button" class="he-c-accept">Aceptar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);
    bar.querySelector(".he-c-accept").addEventListener("click", function () { decide("granted"); });
    bar.querySelector(".he-c-reject").addEventListener("click", function () { decide("denied"); });
    requestAnimationFrame(function () { bar.classList.add("open"); });
    return bar;
  }

  function getBanner() { return document.getElementById("he-consent"); }
  function showBanner() {
    injectStyles();
    var bar = getBanner() || buildBanner();
    requestAnimationFrame(function () { bar.classList.add("open"); });
  }
  function hideBanner() {
    var bar = getBanner();
    if (bar) bar.classList.remove("open");
  }
  function decide(state) {
    writeDecision(state);
    applyConsent(state);
    hideBanner();
    if (window.gtag) window.gtag("event", "consent_decision", { decision: state });
  }

  // Permite reabrir el panel desde un enlace "Configurar cookies"
  window.heOpenConsent = function () { showBanner(); };

  function init() {
    // Botones "Configurar cookies" sin manejador inline (necesario para CSP sin 'unsafe-inline').
    Array.prototype.forEach.call(document.querySelectorAll("[data-he-open-consent]"), function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); showBanner(); });
    });
    var prev = readDecision();
    if (prev && (prev.state === "granted" || prev.state === "denied")) {
      applyConsent(prev.state);          // re-emite la decisión previa en cada carga
    } else {
      injectStyles();
      buildBanner();                     // primera visita: pedir consentimiento
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
