# Auditoría integral - Horizonte Emirates (web pública + código)

_Fecha: 2026-06-12 · Alcance: `public/` completo (home, proyectos, blog hub + 16 artículos, equipo, legal, 404, guías), `_headers`, `_redirects`, `sitemap.xml`, `robots.txt`, JS (`app.js`, `consent.js`, `gtag-init.js`, `common.js`, `proyectos.js`, `blog.js`), `wrangler.jsonc`._

> **Nota metodológica.** Esta auditoría parte de un sitio **maduro**. La base técnica (CSP sin unsafe-inline en script, Consent Mode v2, GA4+Ads+Meta, schema completo, sitemap, canonical, HSTS, caché inmutable, blog con BlogPosting/FAQ/Breadcrumb, formulario con scoring y persistencia) **ya está resuelta** en el `ROADMAP_AUDITORIA.md` (M01-M58). Para no reproponer lo cerrado, los hallazgos se centran en lo que **sigue abierto o no se había detectado**. Cada hallazgo indica si es nuevo o si mapea a un ID del roadmap.

---

## A. Resumen ejecutivo

**Estado general:** sólido a nivel técnico, de tracking y de compliance básico. La web es rápida en desktop, segura, indexable y con un funnel bien instrumentado. El cuello de botella ya **no es técnico**: es de **confianza** (quién está detrás), de **segmentación** (habla solo a España mientras capta 11 países) y de **performance móvil** (Perf 67).

**Madurez:** ~8/10 técnico · ~5/10 confianza/autoridad · ~5/10 internacionalización · ~6/10 CRO de contenido.

**Riesgos principales (negocio):**
1. **Identidad anónima del equipo y del partner.** Se pide a un inversor que deje datos para una operación de 150.000 a 1.000.000+ € sin ver una sola persona, nombre, cara, credencial ni el nombre/licencia del partner RERA "verificable". Es el mayor freno de conversión y de calidad de lead.
2. **Discurso España-céntrico sobre una captación multipaís.** "Lo que España ya no puede ofrecerte", Modelo 720, IRPF... pero el formulario ofrece México, Argentina, Colombia, Chile, Perú, etc. El visitante LatAm ni se ve reflejado ni recibe fiscalidad que le aplique (riesgo de conversión **y** de claim fiscal incorrecto por país).
3. **Performance móvil (Perf 67).** CLS 0.169 por font-swap del hero + redirect histórico. Lastre directo de SEO y de conversión en el canal mayoritario.

**Oportunidades principales:**
- Convertir "0€ de coste" + "lo paga el promotor" en un bloque explícito **"Cómo ganamos dinero"** (el activo de confianza más barato y de mayor ROI que falta).
- Capa de **prueba social verificable** (operaciones, promotoras, partner identificado) → sube CVR y ticket.
- **Segmentación por país de residencia fiscal** (mínimo España / Andorra / LatAm) en copy y en una o dos landings.

**Qué cambiaría primero, segundo y tercero:**
1. **Confianza:** identidad real del equipo + identificación del partner + bloque "cómo ganamos dinero" + 1-3 pruebas sociales (aunque sean anonimizadas y verificables).
2. **Performance móvil:** desbloquear el fix de CLS del hero (reservar altura en vez de mover el anclaje) y confirmar el 200 en `/` tras deploy.
3. **Segmentación:** matizar el copy España-céntrico y abrir el mensaje a residente fiscal en Andorra y LatAm (al menos a nivel de copy + FAQ por país).

---

## B. Tabla de hallazgos

Severidad: Crítica / Alta / Media / Baja · Prioridad: P0 (ya) / P1 (este sprint) / P2 (siguiente) / P3 (backlog) · Esfuerzo: B/M/A.

| ID | Categoría | Sev | Prio | Esf | Zona | Problema | Recomendación | Estado roadmap |
|----|-----------|-----|------|-----|------|----------|---------------|----------------|
| A01 | Confianza | Alta | P0 | M | `sobre/equipo.html` | Equipo con avatares "HE/RE/CO", cargos genéricos, sin nombre, foto, LinkedIn ni credencial | Persona(s) real(es) con nombre, foto y rol; o, si se prefiere reserva, fundador identificado + foto de equipo real | M17 abierto (ampliado) |
| A02 | Confianza | Alta | P1 | B | Home FAQ, equipo, proyectos | "Partner con licencia RERA activa, verificable" pero sin nombre del partner ni nº de licencia ni enlace al registro | Nombrar al partner y/o publicar nº de licencia RERA con enlace al portal oficial DLD/RERA | M17 / M01 (RRS) |
| A03 | Confianza | Alta | P1 | M | Toda la web | Cero prueba social: sin testimonios, casos, nº de operaciones, logos de promotoras | 2-4 pruebas verificables (operación anonimizada con cifras, logos de promotoras con permiso, nº de inversores acompañados) | M17 abierto |
| A04 | Internacionalización / Copy | Alta | P1 | M | `index.html` (hero, pain, FAQ) | Mensaje 100% España (Modelo 720, IRPF, "España limita") con form de 11 países | Separar "marco fiscal según residencia"; FAQ con pestañas España / Andorra / LatAm; no afirmar fiscalidad española como universal | Nuevo |
| A05 | SEO / Arquitectura | Media | P2 | A | Estructura | No hay páginas comerciales por intención/país (solo blog informacional + proyectos) | Landings: `/invertir-en-dubai-desde-andorra`, `/golden-visa-emiratos-inversion`, etc., orientadas a conversión y a campañas | Nuevo |
| A06 | Performance | Alta | P1 | M | `home.css` `#hero`, `_redirects` | Mobile Perf 67; CLS 0.169 por font-swap del hero anclado abajo; redirect `/` | Reservar altura del bloque hero (min-height/clamp) para no mover el anclaje, en vez de cambiar a flex-start; confirmar `curl -I /` = 200 | M31 abierto |
| A07 | Copy / Legal | Alta | P1 | B | Hero, KPI strip, tabla | "Rentabilidad **neta** por alquiler 6-9%": el footnote aclara "neta de impuestos en origen" pero no de gastos | Cambiar titulares a "rentabilidad bruta por alquiler (sin impuestos locales)" o "neta de impuestos locales, antes de gastos" | Nuevo (matiza M16/M53) |
| A08 | Copy / Legal | Media | P2 | B | `index.html` proceso paso 2 | "due diligence **legal**" choca con "no prestamos asesoramiento jurídico" | "Revisión documental con el partner regulado" o acotar el alcance del término | Nuevo |
| A09 | Marca / Tono | Media | P2 | B | Hero, sección pain | "Lo que España ya no puede ofrecerte" / "España limita, Dubai lo resuelve": tono absoluto y alarmista para marca premium | Suavizar a comparativa factual ("España vs Dubai en cifras") manteniendo el gancho | Decisión usuario |
| A10 | Copy / Legal | Media | P2 | B | Zonas (RAK) | "Ventana de apreciación 20-35% antes del Wynn": claim especulativo alto | Reforzar fuente y disclaimer; expresar como escenario, no como ventana cierta | Matiza M16 |
| A11 | CRO / Contenido | Alta | P1 | M | Home | Faltan bloques que cierran objeciones: "Cómo ganamos dinero", "Qué incluye el análisis", "Para quién NO", "Qué riesgos revisamos" | Añadir 2-3 bloques (ver sección E) | Nuevo |
| A12 | CRO | Media | P2 | M | Home | Único camino de captura es el form de 3 pasos; sin captura "soft" para el no-listo | CTA de descarga de la guía fiscal (M19) como lead magnet visible en home, no solo post-lead | Apoya M19 |
| A13 | Tracking | Media | P2 | A | Server-side | Meta Pixel solo con consent → pérdida de señal; sin CAPI ni Enhanced Conversions server-side | Conversions API (Meta) + Enhanced Conversions (Google) cuando escale paid | M34 abierto |
| A14 | Analítica / Negocio | Media | P2 | M | Reporting | Sin dashboard de funnel (CPL, CVR, lead→cierre, € por tier) | Looker Studio sobre GA4 + Sheet de leads (tier/score ya se capturan) | M35 abierto |
| A15 | SEO | Baja | P3 | B | `sitemap.xml` | `lastmod` fijo 2026-06-07; `/blog/creditos.html` fuera del sitemap (ok); guías noindex (ok) | Automatizar `lastmod` o actualizar al publicar | Nuevo (menor) |
| A16 | SEO contenidos | Media | P2 | M | Blog | Solapamiento de intención: `residencia-en-dubai` vs `residencia-fiscal-emiratos-espanoles` vs `vivir-en-dubai-espanol` | Definir intención única por URL + interlinking jerárquico (pilar→satélite) y canonical entre solapados si procede | Nuevo |
| A17 | UX / Copy | Baja | P3 | B | `404.html` | "Le redirigimos a un punto seguro" pero no hay redirección | Quitar la frase o añadir links (ya hay) sin prometer redirección | Nuevo |
| A18 | Consistencia | Baja | P3 | B | Footers | `index` usa `<h2>` en footer, `equipo` usa `<h4>`, `proyectos` sin heading; enlaces a `proyectos.html` relativos en home / absolutos en equipo | Unificar jerarquía y rutas | Parcial (M31 tocó index) |
| A19 | Accesibilidad / Robustez | Baja | P3 | B | `equipo.html` | WA-float con `href="#"` hasta que `blog.js` lo reescribe (link roto si el JS falla) | href real en el HTML como en home/proyectos | Nuevo |
| A20 | Legal / UX | Baja | P3 | B | Footer global | "Configurar cookies" solo en `legal.html`; no hay re-acceso al consentimiento desde el footer del resto | Enlace `data-he-open-consent` en el footer de todas las páginas | Nuevo |
| A21 | Seguridad | Baja | P3 | M | `_headers` CSP | `img-src https:` (cualquier origen) y `style-src 'unsafe-inline'` | Endurecer a futuro (whitelist de orígenes de imagen; nonces o clases para inline styles) | Aceptado (no crítico) |
| A22 | Captación | Baja | P3 | B | `app.js`, Web3Forms | `access_key` pública en cliente; sin captcha (descartado por fricción) | Vigilar spam con healthcheck M08; Turnstile en reserva | M13 cerrado / M09 abierto |

---

## C. Auditoría detallada por áreas

### 1. Arquitectura
- **Sólido:** estructura clara (home, `/proyectos.html`, `/blog/`, `/sobre/equipo.html`, `/legal.html`), 404 de marca con `noindex,follow`, Workers Assets con `html_handling:"none"` coherente con canonicals y sitemap. Profundidad de clic baja (todo a 1-2 clics).
- **URLs con `.html`:** evaluado y descartado conscientemente (M46). Correcto: 0 ganancia SEO sobre sitio recién indexado. No reabrir.
- **Hallazgo nuevo (A18):** inconsistencia de rutas internas: la home enlaza `proyectos.html` (relativa) y `equipo.html` enlaza `/proyectos.html` (absoluta). Unificar a absolutas para evitar sorpresas si alguna página cambia de profundidad.
- **Falta capa comercial (A05):** la arquitectura cubre informacional (blog) + catálogo (proyectos) pero **no** páginas de aterrizaje por intención/país que son las que rinden en campañas de pago.

### 2. SEO técnico
- **Sólido:** titles limpios (sin "V6"), canonical + hreflang es/x-default en todas, OG/Twitter completos, JSON-LD `RealEstateAgent`+`WebSite`+`FAQPage` (home), `BlogPosting`+`FAQPage`+`BreadcrumbList` (artículos), `ItemList`/`Residence`+`Breadcrumb` (proyectos), robots.txt con política de IA, sitemap con 21 URLs, guías `noindex` correctas.
- **Mejoras:** `sitemap.lastmod` estático (A15); falta `og:image:width/height` (menor, mejora el render del share); `Organization` sin `sameAs` (redes) ni teléfono (refuerza el Knowledge Panel cuando existan).
- **Verificado limpio:** 0 `console.log`/`TODO`/`FIXME`/`debugger` en producción; 0 `target="_blank"` sin `rel`; `innerHTML` solo en `consent.js` con string estático (no XSS).

### 3. SEO de contenidos / blog
- **Sólido:** 16 artículos con clusters (Inversión, Fiscalidad, Visados, Empresa, Vida), TOC con scroll-spy, autor (Organization), fecha, FAQ, interlinking (6-11 enlaces internos por artículo), imágenes temáticas con alt + créditos Pexels.
- **Hallazgo (A16):** riesgo de canibalización/solape de intención en el cluster residencia/vida: `residencia-en-dubai`, `residencia-fiscal-emiratos-espanoles`, `vivir-en-dubai-espanol` y, en fiscalidad, `impuestos-invertir-dubai-espana` vs `modelo-720-declarar-inmueble-dubai` vs `residencia-fiscal`. Asignar **una intención por URL**, jerarquizar pilar→satélite y enlazar de forma consistente; usar canonical solo si dos URLs compiten por la misma query.
- `datePublished=dateModified` en los 16 (M42 decidió no falsear fechas). Correcto; ir divergiendo `dateModified` al revisar de verdad.

### 4. Copywriting y mensaje comercial
- **Sólido:** disclaimers de fuentes (M16), claims absolutos ya matizados (M40), microdisclaimer en hero (M41), simulador con disclaimer.
- **Abierto (A07, crítico de matiz):** "rentabilidad **neta** por alquiler 6-9%" en hero, KPI y ticker. El footer define "neta" como **neta de impuestos en origen, no de gastos**. Un titular que dice "neta" mientras el rendimiento real descuenta comunidad/gestión/vacíos es el típico claim que un regulador o un competidor puede tachar de engañoso. Recomendado: **"rentabilidad bruta por alquiler (sin impuestos locales)"** en titulares, dejando la explicación de "neto de impuestos en origen" en el detalle.
- **A08:** "due diligence **legal**" en el proceso vs "no prestamos asesoramiento jurídico" en disclaimers. Coherencia: "revisión documental con el partner regulado".
- **A09 (marca):** "Lo que España ya no puede ofrecerte" / "España limita, Dubai lo resuelve" funciona como gancho pero es absoluto y algo alarmista para una marca que busca parecer premium e institucional. Alternativa que conserva tensión sin sobrepromesa: comparativa factual.
- **A10:** RAK "20-35% antes del Wynn": expresar como escenario con fuente, no como ventana asegurada.

### 5. UX/UI y usabilidad
- **Sólido:** hero con jerarquía clara, KPI, ticker, comparativa, estrategia por capital, proceso, zonas con yields separados (M55), simulador, form de 3 pasos con barra de progreso, FAQ acordeón accesible, sticky CTA móvil, menú hamburguesa (M51), nav auto-ocultable.
- **Se entiende en <5s** qué ofrece y para quién (inversor hispanohablante en UAE). **No se entiende** igual de rápido **quién** lo ofrece ni **cómo gana dinero** la empresa (objeciones sin resolver → A01, A11).
- **Densidad:** la home es larga y con mucha cifra; en móvil el peso recae en el sticky CTA. Aceptable.

### 6. Conversión y CRO
- **Sólido:** form multistep con scoring (tier A/B/C, € por tier), persistencia en sessionStorage (M23), validación inline, success con Calendly prefill + WhatsApp, captura UTM/gclid/gbraid/wbraid, eventos GA4 ricos (form_step, section_view, roi, generate_lead).
- **Abierto:** falta **captura soft** (A12): el no-listo no tiene más opción que el form largo o WhatsApp. La guía fiscal (M19) debería ser un lead magnet **visible en home**, no solo entrega post-lead.
- Faltan **bloques de cierre de objeciones** (A11): "cómo ganamos dinero", "qué incluye el análisis exactamente", "para quién NO", "qué riesgos revisamos". Reducen la fricción antes del form mejor que cualquier cambio estético.

### 7. Formularios e integraciones
- **Sólido:** honeypot `botcheck`, validación email/teléfono, noscript fallback (M12), GDPR checkbox, no se envía PII a GA4 (solo país/tier/score), Web3Forms con Spam Protection Strict (M13).
- **Riesgo residual (A22):** `access_key` pública (por diseño de Web3Forms) + sin captcha (descartado por fricción, decisión válida). Mitigación viva: healthcheck de 0 leads/72h (M08). Turnstile queda en reserva si aparece spam real.
- **A19:** en `equipo.html` el WA-float depende de `blog.js` para construir el `href` (queda `#` si el JS falla). Poner href real en el HTML.
- **Arquitectura futura (M33/M34):** webhook propio o ActiveCampaign + CAPI server-side cuando escale (hoy va directo a Web3Forms, suficiente para el volumen actual).

### 8. Seguridad
- **Sólido:** CSP completa en `_headers` (script-src **sin** unsafe-inline), HSTS 1 año, X-Frame-Options DENY + frame-ancestors none, nosniff, Referrer-Policy, Permissions-Policy, form-action whitelist. Sin secretos reales en cliente (Web3Forms key, GA/Ads/Pixel IDs y facebook-domain-verification son públicos por diseño). Sin sourcemaps, sin console, sin innerHTML peligroso.
- **Endurecible a futuro (A21, no crítico):** `img-src https:` admite imágenes de cualquier origen; `style-src 'unsafe-inline'` por los muchos `style=""` inline. Migrar estilos inline a clases permitiría retirar unsafe-inline de estilos también.
- HSTS preload: evaluado y descartado (dominio no elegible por orden de redirecciones). No reabrir (M30).

### 9. Performance y Core Web Vitals
- **Sólido:** hero con preload + fetchpriority + srcset + width/height; fuentes self-hosted woff2 con `font-display:swap` + preload de Cormorant latin (LCP); caché inmutable de assets (F1); galería de proyectos recomprimida -44% (M44).
- **Lastre #1 (A06, M31):** **Mobile Perf 67**. Causas confirmadas: (a) **CLS 0.169** por font-swap del hero anclado abajo (`#hero justify-content:flex-end`); (b) redirect `/`→`/index.html` (816 ms, fix en `_redirects` pendiente de verificar 200 tras deploy).
  - **Recomendación concreta para desbloquear sin sacrificar el diseño:** en vez de mover el texto a `flex-start` (cambio estético que está frenando la decisión), **reservar la altura del bloque de texto del hero** (`min-height` en `.hero-in` o en el `h1`, calculado para el peor caso de salto de fuente) y/o aplicar `size-adjust`/métricas de fuente fallback (`@font-face` con `ascent-override`/`size-adjust`) para que Cormorant e Inter no cambien la altura al cargar. Así el anclaje abajo se mantiene y el CLS baja sin tocar la composición.
- Animación KPI "tragaperras": ya optimizada (~5000→~85 nodos) y es scroll-triggered, no afecta INP (M28). No tocar sin profiling.

### 10. Accesibilidad
- **Sólido:** `lang="es"`, skip-link, ARIA en burger/FAQ/form, labels en inputs, contraste de dorado corregido a AA en texto pequeño (M29), `prefers-reduced-motion`, opciones del form operables por teclado.
- **Menores:** jerarquía de headings inconsistente entre footers (A18); `equipo.html` salta `<h2>`→`<h4>`; revisar contraste del fineprint blanco a baja opacidad sobre la imagen del hero (rgba .45-.5 sobre foto puede no llegar a AA según la zona).

### 11. Tracking y analítica
- **Sólido:** GA4 `G-BK37V83363` + Ads `AW-586671676` + Meta Pixel `972040562129072` (solo tras consentimiento), Consent Mode v2 default denied→granted, eventos completos, no se manda PII a GA4. Conversión de Ads vía importación GA4→Ads (M04/M06), con `ADS_CONVERSION_LABEL` vacío **a propósito** (evita doble conteo). **Correcto, no reabrir.**
- **Abierto (A13/M34):** sin server-side. Meta sin CAPI y Google sin Enhanced Conversions server-side → con consent obligatorio se pierde señal de los que rechazan + iOS/adblock. Relevante al escalar paid (mejora ROAS y reatribución).
- **Abierto (A14/M35):** sin dashboard de funnel. Ya se capturan tier/score/país/€ por tier: montar Looker Studio es bajo esfuerzo y da visibilidad CPL/CVR.

### 12. Legal / compliance
- **Sólido:** privacidad + aviso legal + cookies completos, responsable identificado (Propulse SLU, NRT, domicilio andorrano), encargados listados (Web3Forms, Google, Calendly, Meta, partner UAE), transferencias internacionales con garantías, derechos y autoridades de control, banner aceptar/rechazar **equilibrado** (buena práctica), cookies analíticas off por defecto. Disclaimers YMYL en footer, FAQ y simulador.
- **Abierto:**
  - **A04 (fiscal por país):** la FAQ y los claims fiscales asumen España (Modelo 720, IRPF) mientras se capta LatAm/Andorra. Riesgo de inducir a error fiscal a no-residentes en España. Separar por residencia fiscal.
  - **A20:** re-acceso al consentimiento ("Configurar cookies") solo existe en `legal.html`. Añadir trigger en footer global.
  - **A11 (disclaimer bajo form):** hay checkbox GDPR pero no un micro-disclaimer fiscal ("la fiscalidad depende de tu país de residencia; no es asesoramiento") justo bajo el botón.

### 13. Marca, confianza y autoridad
- **El punto más débil y de mayor ROI.** La empresa está legalmente identificada, pero la **capa humana y de prueba** no existe:
  - **A01:** equipo anónimo (avatares "HE/RE/CO", cargos sin nombre, sin foto, sin LinkedIn).
  - **A02:** partner RERA "verificable" sin nombre ni nº de licencia ni enlace.
  - **A03:** 0 testimonios / casos / métricas de operaciones / logos de promotoras.
- Para ticket alto, esto es lo que separa "dejo mis datos" de "me voy". Es M17 (abierto) pero conviene tratarlo como **prioridad 0**.

### 14. Internacionalización y segmentación
- **Form** ya captura país (11 opciones) y prefijos LatAm/UE. **Pero el mensaje no acompaña:** todo el copy de valor (hero, pain, FAQ, fiscalidad) habla a un residente en España. Un mexicano o un residente en Andorra que llega no se ve reflejado y recibe fiscalidad que no le aplica.
- **Recomendado:** (1) neutralizar el copy de valor para que sirva a cualquier hispanohablante; (2) FAQ fiscal con conmutador España / Andorra / LatAm; (3) al menos una landing por segmento de alto valor (Andorra, que es donde está la sociedad, y "desde España").

### 15. Escalabilidad futura
- Stack estático + Cloudflare es **adecuado** y barato para este volumen. Para escalar:
  - **Contenido:** sistema editorial (ya hay `contenido-blog/` en `.md`) → seguir produciendo cluster por cluster.
  - **Datos:** webhook/CRM (M33) + CAPI (M34) + dashboard (M35) cuando entre paid serio.
  - **Anti-concentración de partner (M32):** segundo partner para no depender de uno (riesgo de negocio, no de web).

---

## D. Plan de acción por fases

### Fase 1 - Confianza + performance (este sprint)
1. **A01** Identidad real del equipo (mínimo: fundador con nombre + foto; idealmente 2-3 personas).
2. **A02** Identificar al partner (nombre o nº licencia RERA + enlace al registro).
3. **A03/M17** 1-3 pruebas sociales verificables (operación anonimizada con cifras, logos con permiso, nº de inversores).
4. **A11** Bloque "Cómo ganamos dinero" + "Qué incluye tu análisis".
5. **A06/M31** Desbloquear CLS del hero (reservar altura / métricas de fuente) y confirmar `/` = 200.
6. **A07** Corregir "neta" → "bruta / sin impuestos locales" en titulares.

### Fase 2 - Segmentación + CRO + SEO comercial
7. **A04** Neutralizar copy España-céntrico + FAQ fiscal por residencia.
8. **A12** Guía fiscal como lead magnet visible en home.
9. **A05** 1-2 landings por intención/país (Andorra, "desde España", Golden Visa).
10. **A16** Reasignar intención por URL en el cluster residencia/fiscalidad + interlinking.
11. **A08/A09/A10** Ajustes finos de claims y tono.

### Fase 3 - Escalabilidad y medición
12. **A14/M35** Dashboard de funnel (Looker Studio).
13. **A13/M34** CAPI Meta + Enhanced Conversions (al escalar paid).
14. **M33** Webhook/CRM (ActiveCampaign) + M24 nurturing/Telegram.
15. **A15/A18/A19/A20/A17** Pulido (sitemap, footers, WA href, configurar-cookies global, copy 404).

### Fase 4 - Excelencia
16. A/B testing de hero y CTA; CAPI con deduplicación; endurecer CSP (A21); auditoría trimestral; SEO programático controlado por zona/proyecto.

---

## E. Propuestas concretas de implementación

### Hero (A07/A09) - variante que matiza sin perder fuerza
> **H1:** Inmuebles en Dubai, con acompañamiento en español.
> **Sub:** Rentabilidad por alquiler de mercado del 6-9% bruto (sin impuestos locales sobre alquiler ni plusvalías en UAE) y menor exposición al riesgo de ocupación que en España. Cifras de mercado estimadas, no garantizadas; tu fiscalidad depende de tu país de residencia.

### Bloque nuevo "Cómo ganamos dinero" (A11)
> **Cómo ganamos dinero (y por qué es gratis para ti).** Cobramos honorarios del promotor, no del inversor, igual que un bróker inmobiliario. Eso significa: 0€ para ti en análisis, acompañamiento y cierre. Y también que solo ganamos si tú compras algo que de verdad encaja, porque nuestra reputación depende de que repitas y nos recomiendes. No vendemos un producto propio: filtramos el mercado por ti.

### Bloque "Qué incluye tu análisis / qué riesgos revisamos" (A11)
> Antes de recomendarte un activo revisamos: registro del proyecto en RERA, solvencia y track record del promotor, condiciones de pago y penalizaciones, supuestos de rentabilidad (ocupación, gestión, gastos) y liquidez de salida estimada. Te entregamos 3-5 inmuebles con su lógica, no un PDF genérico.

### FAQ fiscal por residencia (A04) - patrón
> **¿Qué impuestos pago?** *Depende de tu país de residencia fiscal.* 
> · **España:** Modelo 720 (>50.000€), IRPF sobre rentas y plusvalías, CDI España-EAU. 
> · **Andorra:** [tratamiento andorrano]. 
> · **Otros (México, Argentina...):** consulta con tu asesor local; te señalamos qué revisar. 
> En todos los casos, en UAE no hay imposición local sobre alquiler ni plusvalías de persona física.

### Identificación del equipo (A01) - mínimo viable
> Tarjeta con foto real, nombre, rol y una línea de credenciales por persona. Si por reserva no se quiere exponer al partner, al menos: "Partner: [nombre comercial], licencia RERA nº XXXXX (verificable en [enlace DLD])".

### Performance hero (A06) - dirección técnica
> `@font-face` con `size-adjust` / `ascent-override` / `descent-override` para Cormorant e Inter calibrados a la fuente de fallback, **o** `min-height` calculado en `.hero-in`, de modo que el swap no cambie la altura del bloque y el anclaje `flex-end` se mantenga. Objetivo: CLS < 0.05 sin mover el texto.

### Eventos GA4 ya presentes (referencia, no rehacer)
`generate_lead`, `generate_lead_click`, `form_step_view`, `form_option_select`, `roi_calculator_interaction`, `section_view`, `whatsapp_*`, `lead_submit_*`. Falta documentar/medir `lead_magnet_request` cuando A12 se implemente.

---

## F. Backlog priorizado

| Tarea | Impacto | Esf | Prio | Área | Criterio de aceptación | Riesgo de no hacerlo |
|-------|---------|-----|------|------|------------------------|----------------------|
| Identidad real del equipo (A01) | Alto | M | P0 | Confianza | Página equipo con ≥1 persona real (nombre+foto+rol) | Leads fríos, baja CVR, baja calidad |
| Identificar partner RERA (A02) | Alto | B | P1 | Confianza | Nombre o nº licencia + enlace verificable | Claim "verificable" no sustanciado |
| Prueba social (A03/M17) | Alto | M | P1 | Confianza | ≥2 pruebas verificables publicadas | Falta de credibilidad en ticket alto |
| Copy multipaís + FAQ fiscal (A04) | Alto | M | P1 | i18n/Legal | Copy de valor sin "España" como universal; FAQ por residencia | Conversión LatAm baja + error fiscal |
| Desbloquear CLS hero (A06/M31) | Alto | M | P1 | Perf | CLS<0.05 mobile sin mover el hero; `/`=200 | Perf 67 lastra SEO + conversión |
| "Neta"→"bruta/sin impuestos" (A07) | Medio | B | P1 | Copy/Legal | Titulares sin "neta" ambigua | Claim potencialmente engañoso |
| Bloque "Cómo ganamos dinero" (A11) | Alto | B | P1 | CRO | Bloque publicado en home | Objeción no resuelta antes del form |
| Lead magnet visible (A12) | Medio | B | P2 | CRO | Guía descargable con captura en home | Se pierde el no-listo |
| Landings intención/país (A05) | Medio | A | P2 | SEO | ≥1 landing comercial publicada | Sin destino óptimo para campañas |
| Intención única por URL blog (A16) | Medio | M | P2 | SEO | Mapa pilar→satélite sin solape | Canibalización, dilución |
| Dashboard funnel (A14/M35) | Medio | M | P2 | Negocio | Looker con CPL/CVR/€ por tier | Sin visibilidad de unit economics |
| CAPI + Enhanced Conv (A13/M34) | Medio | A | P3 | Tracking | Eventos server-side con dedup | Señal/ROAS degradados en paid |
| Pulido (A17-A20) | Bajo | B | P3 | Varios | Footers/WA/cookies/404 corregidos | Roce de calidad percibida |

---

## G. Checklist final

**Confianza**
- [ ] Equipo con ≥1 persona real (nombre, foto, rol, credenciales) - A01
- [ ] Partner identificado (nombre o nº RERA + enlace) - A02
- [ ] ≥2 pruebas sociales verificables - A03
- [ ] Bloque "Cómo ganamos dinero" - A11
- [ ] Bloque "Qué incluye tu análisis / qué riesgos revisamos" - A11

**Internacionalización**
- [ ] Copy de valor neutralizado (no asume residencia en España) - A04
- [ ] FAQ fiscal por residencia (España / Andorra / LatAm) - A04
- [ ] Micro-disclaimer fiscal bajo el formulario - A11
- [ ] ≥1 landing por intención/país - A05

**Performance**
- [ ] CLS hero < 0.05 en móvil sin mover el anclaje - A06
- [ ] `curl -I https://www.horizonteemirates.com/` = 200 (no 301) - A06
- [ ] Re-medir Lighthouse mobile ≥ 90 - M31

**Copy / legal**
- [ ] "neta" → "bruta / sin impuestos locales" en titulares - A07
- [ ] "due diligence legal" acotado - A08
- [ ] Tono España vs Dubai suavizado (opcional) - A09
- [ ] RAK 20-35% como escenario con fuente - A10
- [ ] "Configurar cookies" en footer global - A20

**CRO / SEO**
- [ ] Lead magnet visible en home - A12
- [ ] Intención única por URL en cluster residencia/fiscalidad - A16
- [ ] Interlinking pilar→satélite revisado - A16

**Medición**
- [ ] Dashboard de funnel (Looker) - A14
- [ ] CAPI Meta + Enhanced Conversions (al escalar paid) - A13

**Pulido**
- [ ] WA-float `href` real en equipo.html - A19
- [ ] Footers con jerarquía y rutas unificadas - A18
- [ ] Copy del 404 sin "le redirigimos" - A17
- [ ] `sitemap.lastmod` actualizado/automatizado - A15

---

_Hallazgos confirmados sobre código real. Lo no verificable desde el repo (configuración de GA4/Ads en plataforma, entregabilidad de Web3Forms, licencia real del partner, volumen de spam) queda señalado como pendiente de validación interna. No se ha implementado ningún cambio: este documento solo audita, documenta y prioriza._
