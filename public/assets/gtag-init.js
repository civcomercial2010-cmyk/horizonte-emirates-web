/*
 * Bootstrap de Consent Mode v2 + Google Analytics 4 / Google Ads.
 * Externalizado (servido con 'self') para poder retirar 'unsafe-inline' de script-src en la CSP.
 * Debe cargarse SIN async/defer, justo después del <script async> de gtag.js, para fijar
 * el consentimiento por defecto (denegado) antes de que se procese ningún evento.
 */
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  personalization_storage: 'denied',
  functionality_storage: 'granted',   // técnica: no requiere consentimiento
  security_storage: 'granted',        // seguridad y antifraude: no requiere consentimiento
  wait_for_update: 500
});
// Sin consentimiento publicitario, Google elimina los identificadores de clic
// de los pings de conversión (no se envía gclid ni dato asociable).
gtag('set', 'ads_data_redaction', true);
gtag('js', new Date());
gtag('config', 'G-BK37V83363');
gtag('config', 'AW-586671676');
