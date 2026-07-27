/*
 * Horizonte Emirates - Gestor de consentimiento de cookies (RGPD / LSSI-CE)
 * Integrado con Google Consent Mode v2.
 *
 * El estado por defecto (denied) se fija en gtag-init.js ANTES de gtag('config'),
 * de modo que GA4 no escribe cookies ni envía datos identificables hasta el consentimiento.
 * Este script pinta el banner, persiste la decisión y emite gtag('consent','update').
 *
 * Granularidad: dos finalidades independientes (analitica y publicidad), exigidas por la
 * guía de cookies de la AEPD. La primera capa mantiene Aceptar / Rechazar simétricos.
 * Caducidad: la decisión se renueva a los 12 meses (la AEPD admite 24 como máximo).
 *
 * API pública: window.heOpenConsent()   → reabre el panel para cambiar la decisión.
 *              window.heConsentState()  → {analytics, ads} o null si aún no ha decidido.
 */
(function () {
  "use strict";
  var STORE_KEY = "he_consent_v1";
  var POLICY_URL = "legal.html#cookies";
  var META_PIXEL_ID = "972040562129072";
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;   // 12 meses

  function readDecision() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); }
    catch (e) { return null; }
    if (!raw) return null;
    // Caducada: se vuelve a preguntar.
    if (!raw.ts || (Date.now() - raw.ts) > MAX_AGE_MS) return null;
    // Formato binario antiguo ({state:'granted'|'denied'}): se traduce al granular.
    if (!raw.analytics && raw.state) {
      return { analytics: raw.state, ads: raw.state, ts: raw.ts };
    }
    if (raw.analytics && raw.ads) return raw;
    return null;
  }
  function writeDecision(d) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        analytics: d.analytics, ads: d.ads, v: 2, ts: Date.now()
      }));
    } catch (e) { /* almacenamiento no disponible: la decisión vale solo para esta carga */ }
  }
  function loadMetaPixel() {
    if (window._heMetaPixelLoaded || !META_PIXEL_ID) return;
    window._heMetaPixelLoaded = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }
  function applyConsent(d) {
    var an = d.analytics === "granted" ? "granted" : "denied";
    var ad = d.ads === "granted" ? "granted" : "denied";
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: an,
        ad_storage: ad,
        ad_user_data: ad,
        ad_personalization: ad,
        personalization_storage: ad
      });
    }
    if (ad === "granted") loadMetaPixel();
  }

  window.heConsentState = function () {
    var d = readDecision();
    return d ? { analytics: d.analytics, ads: d.ads } : null;
  };

  function injectStyles() {
    if (document.getElementById("he-consent-styles")) return;
    var css = ""
      + "#he-consent{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;"
      + "background:#0D1B2A;color:#F8F6F1;border-top:1px solid rgba(196,148,42,.45);"
      + "box-shadow:0 -8px 30px rgba(7,18,31,.35);font-family:'Inter',system-ui,sans-serif;"
      + "transform:translateY(100%);transition:transform .35s cubic-bezier(.22,1,.36,1);"
      + "max-height:88vh;overflow-y:auto}"
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
      + "#he-consent .he-c-reject,#he-consent .he-c-prefs{background:transparent;color:rgba(248,246,241,.85);border-color:rgba(248,246,241,.35)}"
      + "#he-consent .he-c-reject:hover,#he-consent .he-c-prefs:hover{border-color:rgba(248,246,241,.7);color:#fff}"
      // Panel granular
      + "#he-consent .he-c-panel{display:none;max-width:1100px;margin:0 auto;padding:0 24px 20px}"
      + "#he-consent.prefs .he-c-panel{display:block}"
      + "#he-consent .he-c-cat{display:flex;gap:14px;align-items:flex-start;padding:14px 0;"
      + "border-top:1px solid rgba(248,246,241,.14)}"
      + "#he-consent .he-c-cat input[type=checkbox]{width:17px;height:17px;margin-top:2px;"
      + "accent-color:#C4942A;flex-shrink:0;cursor:pointer}"
      + "#he-consent .he-c-cat label{font-size:13px;line-height:1.55;color:rgba(248,246,241,.82);cursor:pointer}"
      + "#he-consent .he-c-cat label b{display:block;color:#F8F6F1;font-weight:600;margin-bottom:2px}"
      + "#he-consent .he-c-cat.fixed label{opacity:.6}"
      + "#he-consent .he-c-save{margin-top:14px}"
      + "@media(max-width:640px){#he-consent .he-c-inner{padding:16px 20px}"
      + "#he-consent .he-c-panel{padding:0 20px 18px}"
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
        'Puede aceptarlas, rechazarlas o elegir por finalidad. Consulte nuestra <a href="' + POLICY_URL + '">política de cookies</a>.</div>' +
        '<div class="he-c-actions">' +
          '<button type="button" class="he-c-reject">Rechazar</button>' +
          '<button type="button" class="he-c-prefs" aria-expanded="false">Configurar</button>' +
          '<button type="button" class="he-c-accept">Aceptar</button>' +
        '</div>' +
      '</div>' +
      '<div class="he-c-panel">' +
        '<div class="he-c-cat fixed">' +
          '<input type="checkbox" id="he-c-tech" checked disabled/>' +
          '<label for="he-c-tech"><b>Técnicas (siempre activas)</b>' +
          'Necesarias para que el sitio funcione y para recordar su decisión sobre cookies. No requieren consentimiento.</label>' +
        '</div>' +
        '<div class="he-c-cat">' +
          '<input type="checkbox" id="he-c-an"/>' +
          '<label for="he-c-an"><b>Analíticas</b>' +
          'Google Analytics 4. Nos permiten medir de forma agregada qué páginas se visitan y mejorar el sitio.</label>' +
        '</div>' +
        '<div class="he-c-cat">' +
          '<input type="checkbox" id="he-c-ad"/>' +
          '<label for="he-c-ad"><b>Publicidad</b>' +
          'Google Ads y Meta Pixel. Miden el resultado de nuestras campañas y permiten mostrarle anuncios relevantes. ' +
          'Implican comunicar datos a proveedores en EE. UU.</label>' +
        '</div>' +
        '<button type="button" class="he-c-accept he-c-save">Guardar preferencias</button>' +
      '</div>';
    document.body.appendChild(bar);

    bar.querySelector(".he-c-accept").addEventListener("click", function () {
      decide({ analytics: "granted", ads: "granted" });
    });
    bar.querySelector(".he-c-reject").addEventListener("click", function () {
      decide({ analytics: "denied", ads: "denied" });
    });
    bar.querySelector(".he-c-prefs").addEventListener("click", function () {
      var open = bar.classList.toggle("prefs");
      this.setAttribute("aria-expanded", open ? "true" : "false");
    });
    bar.querySelector(".he-c-save").addEventListener("click", function () {
      decide({
        analytics: bar.querySelector("#he-c-an").checked ? "granted" : "denied",
        ads: bar.querySelector("#he-c-ad").checked ? "granted" : "denied"
      });
    });
    requestAnimationFrame(function () { bar.classList.add("open"); });
    return bar;
  }

  function getBanner() { return document.getElementById("he-consent"); }
  function showBanner() {
    injectStyles();
    var bar = getBanner() || buildBanner();
    // Al reabrir desde "Configurar cookies", precargar la decisión vigente.
    var prev = readDecision();
    if (prev) {
      bar.querySelector("#he-c-an").checked = prev.analytics === "granted";
      bar.querySelector("#he-c-ad").checked = prev.ads === "granted";
    }
    requestAnimationFrame(function () { bar.classList.add("open"); });
  }
  function hideBanner() {
    var bar = getBanner();
    if (bar) { bar.classList.remove("open"); bar.classList.remove("prefs"); }
  }
  function decide(d) {
    writeDecision(d);
    applyConsent(d);
    hideBanner();
    if (window.gtag) {
      window.gtag("event", "consent_decision", {
        decision: (d.analytics === "granted" || d.ads === "granted") ? "granted" : "denied",
        consent_analytics: d.analytics,
        consent_ads: d.ads
      });
    }
  }

  // Permite reabrir el panel desde un enlace "Configurar cookies"
  window.heOpenConsent = function () { showBanner(); };

  function init() {
    // Botones "Configurar cookies" sin manejador inline (necesario para CSP sin 'unsafe-inline').
    Array.prototype.forEach.call(document.querySelectorAll("[data-he-open-consent]"), function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); showBanner(); });
    });
    var prev = readDecision();
    if (prev) {
      applyConsent(prev);                // re-emite la decisión vigente en cada carga
    } else {
      injectStyles();
      buildBanner();                     // primera visita o decisión caducada: preguntar
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
