# Auditoría técnica — Horizonte Emirates

> **Fecha:** 2026-06-09
> **Auditor:** Auditoría senior (arquitectura web + SEO + seguridad + performance + CRO)
> **Alcance:** Repositorio `horizonte-emirates-web` + web en vivo `https://www.horizonteemirates.com`
> **Verificación:** Cabeceras, caché, redirecciones, canonicalización y 404 comprobados con peticiones reales (`curl.exe -sI`) contra producción. El resto, por lectura del código.

---

## CÓMO USAR ESTE DOCUMENTO (instrucciones para el agente)

Eres un agente de código trabajando en la raíz del repositorio. Tu tarea es **ejecutar las mejoras** descritas en este archivo.

**Reglas de ejecución:**
1. Trabaja por fases en orden: **Fase 1 (Quick wins) → Fase 2 (Técnica/SEO) → Fase 3 (Refactor) → Fase 4 (Excelencia)**.
2. Cada hallazgo tiene un ID (`F1`…`F13`). Al completarlo, marca su checkbox en la sección **CHECKLIST EJECUTABLE** y anótalo en `ROADMAP_AUDITORIA.md` siguiendo el estilo existente (M-IDs).
3. **No despliegues ni hagas `git push`** salvo que el usuario lo pida explícitamente. Crea commits solo si el usuario lo pide.
4. Verifica cada cambio antes de darlo por cerrado (ver bloque **VERIFICACIÓN** de cada hallazgo).
5. Algunas acciones son de **dashboard/terceros** (Cloudflare, Web3Forms) y **no se resuelven con código**: están marcadas con `[ACCIÓN MANUAL]`. Para esas, deja el código preparado donde aplique y avisa al usuario de la acción exacta.
6. No falsees datos (fechas, cifras sin fuente). Respeta la disciplina YMYL del proyecto: disclaimers y fuentes intactos.
7. Tras editar, comprueba que no rompes la CSP (sin scripts inline ejecutables) ni los canonical/sitemap.

**Contexto del stack (no asumir otra cosa):**
- Sitio **estático** HTML + CSS vanilla + JS vanilla. **Sin build, sin framework, sin npm runtime.**
- Desplegado en **Cloudflare Workers (Assets)** — `wrangler.jsonc` con `html_handling: "none"` y `not_found_handling: "404-page"`.
- `public/_headers` y `public/_redirects` **SÍ se aplican** de forma nativa (verificado en vivo). Solo se publica `public/`.
- Backend de leads: **Web3Forms → Google Apps Script → Google Sheets** + Calendly + WhatsApp.
- Tracking: GA4 `G-BK37V83363` + Google Ads `AW-586671676` + Meta Pixel (post-consentimiento) + Consent Mode v2.

---

## A. RESUMEN EJECUTIVO

**Estado general: BUENO–MUY BUENO.** Sitio estático maduro con un `ROADMAP_AUDITORIA.md` interno que ya cerró la mayoría de problemas habituales (tracking con Consent Mode v2, CSP sin `unsafe-inline` en `script-src`, schema completo y validado, sitemap, canonical, disclaimers YMYL, identificación registral legal, accesibilidad básica, imágenes optimizadas). El margen de mejora está en **higiene técnica fina** que hoy cuesta performance y mantenibilidad.

**Riesgos principales**
1. **Caché de navegador inexistente** en todos los assets (`Cache-Control: max-age=0, must-revalidate` en CSS/JS/fuentes/imágenes). Penaliza Core Web Vitals en visitas recurrentes.
2. **Endpoint de formulario abusable**: `access_key` de Web3Forms pública (inherente) sin allowlist de dominio ni captcha. Único escudo: honeypot `botcheck`.
3. **HSTS por debajo de lo declarado**: en vivo `max-age=31536000` (1 año), no los `63072000` + `preload` de `public/_headers`.

**Oportunidades principales:** caché larga inmutable (win inmediato), consolidar JS duplicado, asociar `label`↔`input`, resolver canonical `/` que redirige.

**Prioridad global:** Media. Nada está "roto" para el usuario; hay optimizaciones de alto ROI y bajo esfuerzo.

---

## B. TABLA DE HALLAZGOS

| ID | Categoría | Severidad | Archivo / URL | Problema | Impacto | Recomendación | Esfuerzo |
|----|-----------|-----------|---------------|----------|---------|---------------|----------|
| F1 | Performance | **Alta** | Live `/assets/**` · `public/_headers` | Assets (css/js/woff2/webp) con `Cache-Control: public, max-age=0, must-revalidate`. Sin caché de navegador. | Revalidación en cada visita; peor LCP/TTFB recurrente; coste de red. | Reglas de caché larga inmutable en `_headers` para `/assets/*`. | Bajo |
| F2 | Seguridad | **Alta** | `public/index.html` (form), `public/assets/app.js:3` | `access_key` Web3Forms pública sin allowlist de dominio ni captcha. | Spam de leads, envenenamiento del CRM, agotar cuota. | Domain restriction + hCaptcha invisible en Web3Forms; mantener honeypot. | Bajo |
| F3 | Seguridad | Media | Live `Strict-Transport-Security` vs `public/_headers` | HSTS live = 1 año; `_headers` declara 2 años + `preload` → no se aplica el del archivo. | M30 incumplido; ventana de downgrade; no apto a preload list. | Unificar fuente HSTS (solo `_headers`) → 2 años + registrar en hstspreload.org. | Bajo |
| F4 | SEO | Media | Live `/` (301→`/index.html`); `index.html` canonical; `sitemap.xml` | Canonical declara `/` pero `/` hace 301 a `/index.html`; sitemap lista la URL que redirige. | Señal canónica "sucia"; hop extra en la URL más importante. | Servir `/` con 200 (sin 301) o alinear canonical/sitemap con la URL servida. | Medio |
| F5 | Accesibilidad | Media | `public/index.html` (form + modal WA) | `<label>` sin `for` e inputs/selects sin `id` asociado (Nombre, Email, Teléfono, País). | WCAG 1.3.1/4.1.2; peor lectores de pantalla y autocompletado. | Asociar `for`/`id` en cada par label/control. | Bajo |
| F6 | Código | Media | `app.js`, `proyectos.js`, `blog.js` | Menú móvil + nav-auto-hide + UTM + FAQ duplicados en 3 ficheros. | Deuda: un bug obliga a tocar 3 sitios. | Extraer a `assets/common.js` compartido. | Medio |
| F7 | Mantenibilidad | Media | `README.md`, `docs/SEGURIDAD_CABECERAS.md` | README vacío; doc de cabeceras obsoleto (habla de GitHub Pages; dice que `_headers` se ignora, falso hoy). | Onboarding nulo; doc induce a error. | Reescribir README (stack/deploy/estructura) y actualizar doc de seguridad. | Bajo |
| F8 | Seguridad | Baja | `public/_headers` (CSP) | CSP mantiene `style-src 'unsafe-inline'` por estilos inline en HTML. | Permite inyección de estilos; CSP no es A+ plena. | Migrar `style="..."` a clases y retirar `unsafe-inline`. | Alto |
| F9 | SEO | Baja | Todas las páginas `<head>` | Faltan `twitter:title` y `twitter:description` (solo `card`+`image`). | Tarjetas X usan fallback; menor control. | Añadir ambas meta por página. | Bajo |
| F10 | SEO/i18n | Baja | Todas las páginas `<head>` | Sin `hreflang` pese a target ES + LatAm; title "desde España". | Ligera pérdida de relevancia geo en LatAm. | `hreflang="es"` + `x-default`; matizar copy España-céntrico. | Bajo |
| F11 | UX | Baja | `index.html` (wa-float, logo footer) | `href="#"` dependiente de JS / salta arriba. | Sin JS = enlace muerto; salto al top. | `href` real a `wa.me/...` y logo footer a `/`. | Bajo |
| F12 | Performance | Baja | `public/assets/**` | Assets sin fingerprint/hash en el nombre. | Al poner caché larga (F1), actualizar requiere cache-busting. | Versionar por query (`?v=`) o hash en build ligero. | Medio |
| F13 | Tracking | Baja | Roadmap M34/M35 | Sin Conversions API server-side ni dashboard de funnel. | Subconteo por bloqueadores; sin visión CPL→cierre. | Planificar CAPI (Meta/Google) y dashboard de funnel. | Alto |

---

## C. PLAN DE ACCIÓN POR FASES

### FASE 1 — Errores críticos y quick wins (< 1 día, alto ROI)
- **F1** Caché larga inmutable en `/assets/*`.
- **F2** Web3Forms: domain restriction + captcha. `[ACCIÓN MANUAL]` en dashboard + ajuste opcional de código.
- **F3** HSTS unificado a 2 años. `[ACCIÓN MANUAL]` en Cloudflare.
- **F5** Asociar labels en formularios.

### FASE 2 — Mejoras técnicas y SEO importantes
- **F4** Canonical `/` sin 301.
- **F7** README + actualizar doc de cabeceras.
- **F9** `twitter:title` / `twitter:description`.
- **F10** `hreflang` (es + x-default) + matizar copy.
- **F11** `href` reales en wa-float / logo footer.

### FASE 3 — Optimización avanzada y escalabilidad
- **F6** Extraer `common.js` (de-dup JS).
- **F12** Fingerprint/versionado de assets.
- **F8** Eliminar `style-src 'unsafe-inline'` (mover estilos a clases).

### FASE 4 — Excelencia (automatización, testing, observabilidad, crecimiento)
- **F13** Conversions API server-side (Meta/Google) + dashboard de funnel (CPL, CVR, lead→cierre, € por tier).
- Testing automatizado mínimo: validador de JSON-LD + linter de HTML/enlaces rotos en CI.
- Observabilidad: alertas de uptime + budget de performance (Lighthouse CI).
- Completar las 5–9 guías SEO restantes (M18) + alta/sitemap en Search Console.

---

## D. PROPUESTAS CONCRETAS DE IMPLEMENTACIÓN

### F1 — Caché de assets (`public/_headers`)
Añadir estas reglas **antes** del bloque `/*` (Cloudflare aplica la primera coincidencia más específica; mantener `/*` con las de seguridad):

```
/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/img/*
  Cache-Control: public, max-age=31536000, immutable

/assets/projects/*
  Cache-Control: public, max-age=31536000, immutable

/assets/blog/*
  Cache-Control: public, max-age=31536000, immutable

/assets/logos/*
  Cache-Control: public, max-age=31536000, immutable

/assets/og/*
  Cache-Control: public, max-age=2592000

/assets/*.css
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/assets/*.js
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
```

> Imágenes/fuentes/logos en `immutable` porque solo cambian al renombrarse. CSS/JS con TTL menor hasta tener fingerprint (F12); cuando F12 esté hecho, subir CSS/JS a `max-age=31536000, immutable`.

**VERIFICACIÓN:** `curl.exe -sI https://www.horizonteemirates.com/assets/css/home.css` debe devolver el nuevo `Cache-Control` (tras deploy; este cambio requiere despliegue para verse en vivo).

---

### F2 — Endurecer el endpoint del formulario `[ACCIÓN MANUAL + código]`
- **Dashboard Web3Forms:** activar **Domain Restriction** (solo `horizonteemirates.com`) y **hCaptcha/Cloudflare Turnstile**.
- **Código (si se añade Turnstile):** incluir el widget en los dos formularios (`#mainform` y `#waf`) y permitir su dominio en la CSP `script-src`/`frame-src`. Mantener el honeypot `botcheck` existente.
- Si se mantiene solo Domain Restriction (sin captcha), no hay cambio de código; basta la config del panel.

**VERIFICACIÓN:** enviar el formulario desde el dominio (debe pasar) y simular envío desde otro origen (debe rechazarse).

---

### F3 — HSTS único a 2 años `[ACCIÓN MANUAL]`
El valor correcto ya está en `public/_headers`:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
Acción real: **desactivar el HSTS gestionado del dashboard de Cloudflare** (SSL/TLS → Edge Certificates → HSTS) que hoy impone `31536000`, dejar que mande `_headers`, verificar y luego registrar el dominio en https://hstspreload.org.

**VERIFICACIÓN:** `curl.exe -sI https://www.horizonteemirates.com/` → `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.

---

### F4 — Canonical sin redirección
Opciones (elegir una; preferible la primera):
- **A (recomendada):** que `/` devuelva **200** sirviendo `index.html` sin 301. Añadir a `public/_redirects` un rewrite del raíz, igual que se hizo con `/blog`:
  ```
  /    /index.html    200
  ```
  Mantener `canonical = https://www.horizonteemirates.com/`. Verificar que no entra en conflicto con `html_handling:"none"`.
- **B (alternativa):** cambiar `canonical` y `sitemap.xml` a `/index.html` (menos elegante).

**VERIFICACIÓN:** `curl.exe -s -o NUL -w "%{http_code}" https://www.horizonteemirates.com/` debe ser `200` (opción A), sin `Location`.

---

### F5 — Labels asociados (formularios)
Patrón a aplicar en `public/index.html` (`#mainform` y modal `#waf`):
```html
<div class="fg">
  <label for="f-nombre">Nombre *</label>
  <input id="f-nombre" type="text" name="nombre" placeholder="Nombre completo" required/>
</div>
```
Aplicar `for`/`id` en: nombre, email, `phone-num` (`<label for="phone-num">`), `pais`, y los del modal WA (`wam-n`, `wam-e`, `wam-ph`). El `phone-pfx` ya tiene `aria-label` (OK).

**VERIFICACIÓN:** auditoría de accesibilidad (Lighthouse a11y) sin errores de "form elements do not have associated labels".

---

### F6 — Estructura de JS sugerida
```
public/assets/
  common.js      # menú móvil, nav-auto-hide, captura UTM, FAQ accordion, helper track()
  app.js         # solo home (form, scoring, ROI, KPI slot, WA modal, persistencia)
  proyectos.js   # solo carrusel + lightbox + scroll-depth
  blog.js        # solo TOC scroll-spy + filtro de categorías
```
Cargar `common.js` con `defer` **antes** del específico en cada página. Migrar funciones duplicadas y eliminar las copias.

**VERIFICACIÓN:** `node --check` sobre cada `.js`; probar manualmente menú móvil, FAQ y nav-hide en home/proyectos/blog.

---

### F9 — Twitter Cards (por página)
```html
<meta name="twitter:title" content="<mismo que og:title de la página>"/>
<meta name="twitter:description" content="<mismo que og:description de la página>"/>
```

### F10 — hreflang (en `<head>` de cada página, con su URL canónica)
```html
<link rel="alternate" hreflang="es" href="https://www.horizonteemirates.com/"/>
<link rel="alternate" hreflang="x-default" href="https://www.horizonteemirates.com/"/>
```

### F11 — Enlaces reales
- `wa-float`: `href="https://wa.me/971554722025"` (JS puede seguir interceptando para abrir modal).
- Logo del footer: `href="/"` en vez de `href="#"`.

### F8 — Retirar `style-src 'unsafe-inline'`
Mover los `style="..."` del HTML a clases en las hojas existentes (`home.css`, `blog.css`, `proyectos.css`, `legal.css`) y, una vez **cero** estilos inline, cambiar en `public/_headers` y en cualquier `<meta>` CSP:
```
style-src 'self';
```
**VERIFICACIÓN:** consola del navegador sin violaciones CSP de estilo; inspección visual sin regresiones.

---

## E. CHECKLIST EJECUTABLE

### Fase 1 — Crítico / Quick wins
- [ ] **F1** Caché larga inmutable en `/assets/*` (`public/_headers`)
- [x] **F2** Web3Forms anti-spam — **cerrada 2026-06-09**: Spam Protection Level → Strict + honeypot (Turnstile/Domain Restriction son PRO; hCaptcha descartado por fricción). Sin código.
- [x] **F3** HSTS — **cerrada 2026-06-09**: `_headers` alineado a `max-age=31536000` (Cloudflare topa en 12 meses). Preload evaluado y **no registrado** por decisión: hstspreload.org rechaza por orden de redirecciones (apex http→https://www directo) y el compromiso es casi irreversible; HSTS ya protege a usuarios reales.
- [ ] **F5** Labels `for`/`id` en formularios (home + modal WA)

### Fase 2 — Técnica / SEO
- [ ] **F4** Canonical `/` sin 301 (o alinear sitemap/canonical)
- [ ] **F7** README real + actualizar `docs/SEGURIDAD_CABECERAS.md`
- [ ] **F9** `twitter:title` / `twitter:description` en todas las páginas
- [ ] **F10** `hreflang` (es + x-default)
- [ ] **F11** `href` reales en wa-float y logo footer

### Fase 3 — Refactor / Escalabilidad
- [x] **F6** Extraer `common.js` (de-dup JS) — **hecho 2026-06-09**: menú móvil + nav-auto-ocultable unificados en `assets/common.js`, retirados de app/proyectos/blog.js, cargado en las 20 páginas con nav. `node --check` OK.
- [~] **F12** Fingerprint/versionado de assets — **descartado 2026-06-09**: en un sitio sin build y de despliegue frecuente, el `immutable` exige re-estampar hash en ~22 ficheros en cada cambio (riesgo de servir CSS/JS viejo). El esquema actual `max-age=86400 + stale-while-revalidate` ya es seguro y auto-actualizable. Sin ROI positivo.
- [ ] **F8** Eliminar `style-src 'unsafe-inline'` (mover estilos a clases)

### Fase 4 — Excelencia
- [ ] **F13** Conversions API server-side + dashboard de funnel
- [ ] Testing en CI: validador JSON-LD + linter de enlaces rotos
- [ ] Lighthouse CI con presupuesto de performance
- [ ] Completar guías SEO restantes (M18) + Search Console

### Verificación post-cambios (global)
- [ ] `curl.exe -sI` confirma caché en assets y HSTS 2 años
- [ ] PageSpeed Insights / Lighthouse ≥ 90 en la URL en vivo
- [ ] Rich Results Test sobre `proyectos.html` y un artículo de blog
- [ ] securityheaders.com → objetivo A/A+
- [ ] Envío de prueba del formulario validando llegada al Google Sheet

---

## F. ESTADO POSITIVO (no tocar / ya resuelto)

Para evitar trabajo redundante, esto **ya está bien** y no debe "arreglarse":

- CSP robusta sin `unsafe-inline` en `script-src`; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action` restringido, `upgrade-insecure-requests` (verificado en vivo).
- X-Frame-Options DENY, `nosniff`, Referrer-Policy, Permissions-Policy (verificado en vivo).
- Canonicalización http→https y non-www→www con 301 correcta.
- JSON-LD completo y validado: `RealEstateAgent`, `WebSite`, `FAQPage`, `BlogPosting`, `BreadcrumbList`, `ItemList`/`Residence`, `AboutPage`.
- `robots.txt` (con política de IA) + `sitemap.xml` (21 URLs) + canonical por página.
- Consent Mode v2 (default `denied`), GA4 + Ads (import, sin doble conteo) + Meta Pixel post-consentimiento; eventos ricos (`generate_lead` con `value` por tier, `form_step_view`, `roi_*`, `section_view`, `whatsapp_*`, `scroll_depth`, `carousel_slide`).
- Hero `webp` + `srcset` + `width/height` + `preload` + `fetchpriority`; fuentes self-host + `font-display: swap` + `preload`; lazy loading below-the-fold.
- Disclaimers YMYL consistentes + bloque "Fuentes y metodología"; claims ya matizados (M40).
- Identificación registral completa en `legal.html` (Propulse SLU, NRT, domicilio). 404 de marca con `noindex`.
- Token de Telegram que estuvo en el historial git: ya **revocado y rotado** (M38). No reintroducir secretos en el repo.

> Nota: los IDs públicos (GA4, Ads, Meta Pixel, `access_key` de Web3Forms) son públicos **por diseño** y no constituyen fuga de secretos.
