# Roadmap de Auditoría — Horizonte Emirates

Tablero vivo derivado de la auditoría senior (web + funnel + negocio).
Estado: ✅ hecho · 🟡 en curso · ⬜ pendiente · 🔒 bloqueado (terceros)

_Última actualización: 2026-06-09_

---

## FASE 0 — Blindaje (antes de invertir en tráfico)

| ID | Mejora | H | Estado | Nota |
|---|---|---|---|---|
| M01 | Firmar Referral Agreement con RRS (tail, atribución, no-circumvention, % base) | H01 | 🟡 | Borrador validado; firma prevista semana del 09/06. Ampliación de objeto social ya realizada |
| M02 | Verificar que el Google Sheet de leads es privado | H06 | ✅ | Confirmado: sin acceso en incógnito |
| M03 | Mover `SPREADSHEET_ID` + email del agente a Script Properties | H06 | ✅ | **Cerrada.** Properties `HE_SPREADSHEET_ID`/`HE_AGENT_EMAIL` creadas en "HE Email Automation", código pegado y verificado. Telegram está en proyecto Apps Script aparte → repetir properties allí al activarlo |
| M04 | Activar la conversión de Google Ads | H03 | ✅ | Resuelto por vía A (importación GA4→Ads). `ADS_CONVERSION_LABEL` queda vacío a propósito (no se usa etiqueta nativa, evita doble conteo) |
| M05 | Mapear `value` de `generate_lead` a € por tier | H07 | ✅ | `LEAD_VALUE_EUR={A:300,B:120,C:40}` aplicado a GA4 + Ads + Meta |
| M06 | Vincular GA4 ↔ Ads e importar `generate_lead` | — | ✅ | `generate_lead` (GA4) importado y como conversión **Principal** en Ads (objetivo "Envío de formulario para clientes potenciales"). Pendiente menor: dejar SOLO esa acción como principal |

## FASE 1 — Cierre de fugas y validación E2E
| ID | Mejora | H | Estado |
|---|---|---|---|
| M07 | Prueba end-to-end real del funnel | — | ✅ | Re-test validado: llegan nombre/teléfono/capital/objetivo/plazo/viaje/canal. Bug de parseo (emojis→mojibake) corregido y desplegado. Columnas UTM vacías = correcto (solo se rellenan con tráfico de campañas) |
| M08 | Healthcheck del pipeline (alerta 0 leads/72h) | H04 | ✅ | `healthCheck()` implementado y **activado** (código pegado + forzarPollGmail + createTriggers + probado). Trigger cada hora; alerta ante leads atascados, pollGmail caído o errores de Cola |
| M09 | Reducir fragilidad de captura (anti-SPAM + fallback) | H04 | ⬜ |
| M10 | Unificar taxonomía de eventos GA4 | H19 | ✅ | Taxonomía documentada en `docs/TRACKING_EVENTS.md`. Eventos clave fantasma (`purchase`, `qualify_lead`, `close_convert_lead`, `manual_event_SUBMIT_L`) desmarcados en GA4; solo `generate_lead` como evento clave |
| M11 | Limpiar código muerto `captureUTM()` | H14 | ✅ | Eliminada la escritura a inputs `utm_*` inexistentes; persistencia en sessionStorage intacta. Desplegado (`74de19c`) |
| M12 | Fallback `<noscript>` del formulario | H18 | ✅ | Aviso `<noscript>` con email + WhatsApp si JS está desactivado. Desplegado |
| M13 | Restricción de dominio / anti-abuso Web3Forms | — | ✅ | **Cerrada 2026-06-09 (F2).** Domain Restriction y Turnstile son PRO en Web3Forms; el captcha gratis (hCaptcha) es checkbox visible → fricción no asumible en un funnel de conversión. Decisión: **Spam Protection Level → Strict** (server-side, gratis, sin fricción) + honeypot `botcheck` (ya activo). El form no tiene texto libre (campos estructurados) → riesgo de falso positivo bajo. Validado con healthcheck M08 (alerta 0 leads/72h). hCaptcha / Domain Restriction (PRO) quedan en reserva si aparece spam real |

## FASE 2 — Legal y confianza
| ID | Mejora | H | Estado |
|---|---|---|---|
| M14 | Identificación registral completa en `legal.html` | H10 | ✅ | Propulse SLU + NRT L-719841-W + domicilio (C. Doctor Molines 23, AD500 Andorra la Vella) en política de privacidad y aviso legal. Desplegado |
| M15 | Firmar SCC/DPA con RRS y Web3Forms | H10 | 🔒 |
| M16 | Citar fuente y fecha en cada claim de rentabilidad | H12 | ✅ | Bloque "Fuentes y metodología" (`#fuentes`) en el footer + enlaces desde la nota de la tabla comparativa y una línea bajo los KPI. Atribuye: transacciones → Dubai Land Department; rentabilidades/revalorización → JLL, Knight Frank + portales (Property Finder, Bayut); 0% → marco fiscal UAE. Fecha 2024–2025. El +334.000 precisado como **operaciones totales 2025** con desglose oficial (DLD >270.000 / 215.736 compraventas; ADREC 42.814; emiratos del norte) aportado por el usuario (`4bc4ac4`). El 6–9% se define en Fuentes como **neto de impuestos en origen** (EAU 0% sobre alquiler y plusvalías; el inversor tributa en su país, IRPF/Modelo 720 en España; no descuenta gastos de comunidad/gestión) — `74f2946`. **Cerrada.** |
| M17 | Añadir prueba social verificable | H08 | ⬜ |

## FASE 3 — Captación propia (SEO/CRO)
| ID | Mejora | H | Estado |
|---|---|---|---|
| M18 | Plan editorial SEO (8–12 guías) | H09 | 🟡 | **Blog construido y en working tree** (`public/blog/`): infraestructura completa (`blog.css` + `blog.js` autocontenidos, misma estética que la home, CSP-safe) + hub `/blog/` con filtro por categorías + **3 guías pilar** publicadas: cómo invertir en Dubai, fiscalidad España↔UAE, Golden Visa. Cada artículo con JSON-LD `BlogPosting`+`BreadcrumbList`+`FAQPage`, TOC, bio de autor, fuentes y CTA al funnel. Página EEAT `/sobre/equipo.html`. Estrategia completa (24 clusters + plan 12 meses) en `docs/SEO_ESTRATEGIA.md`. Fuente `.md` editable + manual de escalabilidad en `contenido-blog/`. **DESPLEGADO Y VIVO** (`b4acd69`+`79bb6ac`): todas las URLs en 200; `/blog/` servido vía `public/_redirects` (rewrite 200, porque `html_handling:"none"` no da directory-index). Pendiente: 5-9 guías restantes + alta en Search Console |
| M19 | Lead magnet (guía fiscal) | — | ✅ | **Cerrada 2026-06-09.** Guía maquetada como página premium `public/guias/guia-fiscal-dubai-espana.html` (print-ready, CSP-safe, `noindex`) + PDF real de 7 páginas `guia-fiscal-dubai-espana.pdf` (generado con Chrome headless). Contenido anclado a los artículos fiscales ya vetados (IRPF, Modelo 720, plusvalías, CDI España-EAU, Patrimonio, errores, calendario) con disclaimers YMYL y bloque de Fuentes. **Envío automatizado**: tarjeta con enlace a la guía en los emails de bienvenida A1/B1/C1 (`horizonte-emails.gs`, `CONFIG.GUIDE_URL`), cumpliendo la promesa "te la enviamos al solicitar tu análisis". Caché del PDF en `_headers`. Pendiente menor: el PDF descargable enlazado desde la guía. |
| M20 | JSON-LD `ItemList`/`Residence` + breadcrumb en proyectos | H20 | ✅ | BreadcrumbList + ItemList(Residence) en `proyectos.html`, sin precios. Desplegado (`bf5b6ba`). Validar en Rich Results Test |
| M21 | Política robots de IA + resolver doble `User-agent: *` | H11 | ✅ | **Hecho 2026-06-08.** El `robots.txt` ya no tenía doble `User-agent`. Política de IA declarada explícita: GPTBot/Google-Extended/PerplexityBot/ClaudeBot con `Allow: /` (decisión: permitir para ganar visibilidad en respuestas de IA; reversible con `Disallow`) |
| M22 | Corregir enlazado interno (footer → proyectos; quitar doble "Zonas") | — | ✅ | Footer enlaza a proyectos.html y al formulario; eliminado el doble enlace "Zonas". Desplegado (`bf5b6ba`) |
| M23 | Persistencia de progreso + validación inline del formulario | H16 | ✅ | Estado del formulario en sessionStorage (recarga no borra pasos/datos; se limpia al enviar) + validación inline email/teléfono al salir del campo. Desplegado |
| M24 | Activar Telegram + nurturing con contenido real | — | ⬜ |

## FASE 4 — Hardening (seguridad / performance / accesibilidad)
| ID | Mejora | H | Estado |
|---|---|---|---|
| M25 | Externalizar JS/CSS comunes | H05 | ✅ | JS externalizado en las 3 páginas: `assets/gtag-init.js`, `assets/app.js`, `assets/proyectos.js`; manejadores `onclick`/`onchange` sustituidos por listeners. Sintaxis validada con node. Desplegado |
| M26 | Eliminar `'unsafe-inline'` de `script-src` | H05 | ✅ | Retirado del `<meta>` CSP de las 3 páginas, de `_headers` y del header CSP en Cloudflare (hecho por el usuario). Verificado en consola: 0 errores de inline-script; web funcional. `style-src` mantiene unsafe-inline (a propósito). Añadido `pagead2.googlesyndication.com` a connect-src (Ads). Pendiente menor: desactivar Cloudflare Web Analytics (beacon bloqueado, preexistente) |
| M27 | Resolver Google Fonts render-blocking (self-host/preload) | — | ✅ | **Hecho 2026-06-08.** Las fuentes YA estaban self-hosted (woff2 locales + `font-display:swap`), sin link a Google Fonts (el "render-blocking de Google" no existía). Añadido `preload` de los 2 woff2 de Cormorant latin (normal+italic), la fuente del H1/LCP. Inter no se preloadea (tiene swap, es secundaria, no compite con la imagen hero) |
| M28 | Optimizar animación KPI "tragaperras" (INP) | H13 | ⏸️ | **Evaluado 2026-06-08, no se toca sin medir.** Es scroll-triggered (IntersectionObserver), no interacción → no afecta al INP directamente; solo TBT en el scroll inicial, y ya se optimizó una vez (~5000→~50-85 nodos). Reescribir una animación visualmente central a ciegas = riesgo alto por beneficio marginal. Condicionado a que el profiling (M31/PSI) lo señale |
| M29 | Contraste AA del dorado de marca | H17 | ✅ | `--gold-text:#9A7016` aplicado a texto pequeño sobre fondo claro (eyebrow, proc-tag, s-range/pill, zone-tag, deliver-t, form-scarcity). Dorado de marca intacto en grande/oscuro. Desplegado |
| M30 | `404.html` + HSTS + revisar ACAO | H21 | ✅ | **Cerrada 2026-06-09 (F3).** `404.html` de marca desplegada (`74de19c`). HSTS: Cloudflare sirve `max-age=31536000; includeSubDomains; preload` en todas las respuestas; el dashboard topa en 12 meses, así que se **alineó `_headers` a 31536000** (fin del valor fantasma de 2 años). **Preload NO registrado por decisión del usuario**: hstspreload.org marcó el dominio no elegible (el apex `http://` salta directo a `https://www`, falta el salto intermedio `http://apex→https://apex`); el arreglo exige tocar el routing de Cloudflare y el compromiso es casi irreversible → beneficio marginal (HSTS ya protege a usuarios reales). ACAO `*` no aparece en las cabeceras live |
| M31 | Validar JSON-LD + Lighthouse final ≥90 | — | 🟡 | **JSON-LD validado 2026-06-08**: 57 bloques en 21 páginas, 0 inválidos (BlogPosting×16, BreadcrumbList×19, FAQPage×17, Blog, RealEstateAgent, WebSite, ItemList, AboutPage). **Lighthouse medido en vivo 2026-06-09 (CLI v13.3.0, home `https://www.horizonteemirates.com/`):** **Desktop** Perf **100** / A11y 91 / BP 92 / SEO 92 → todo ≥90 ✅. **Mobile** Perf **67** ❌ / A11y 91 ✅ / BP 92 ✅ / SEO 92 ✅. Lastres mobile de Perf, por orden: (1) **redirect raíz `/`→`/index.html` (301): 816 ms** en 4G simulado → es el problema de **M49/F4**, ya adjudicado "no viable" en Workers Assets; (2) **JS sin usar ~710 ms / 129 KB** = tags de Google (GA4 68 KB + Ads 61 KB), inherente a terceros; (3) **CLS 0.169** por `div.hero-in` (salto del bloque hero) — único fixable barato; LCP 4.9 s (amplificado por el redirect), TBT 310 ms. **Veredicto: ≥90 cumplido en desktop (4/4) y en mobile en A11y/BP/SEO; mobile Performance NO llega a 90 y está gobernado por la decisión M49 (redirect) + JS de terceros.** Próximo paso opcional de bajo coste: reservar espacio del hero para matar el CLS. |

## FASE 5 — Escalabilidad y mejora continua
| ID | Mejora | H | Estado |
|---|---|---|---|
| M32 | Cerrar segundo partner (anti-concentración) | H02 | 🔒 |
| M33 | Migrar captura a webhook directo / ActiveCampaign | H04 | ⬜ |
| M34 | Conversions API server-side (Meta/Google) | — | ⬜ |
| M35 | Dashboard de funnel (CPL, CVR, lead→cierre, € por tier) | — | ⬜ |
| M36 | Higiene de repo (carpeta v2 a rama, robots repo, nombres de imágenes) | H15 | ✅ | **Cerrado 2026-06-08.** Carpeta `v2` en `.gitignore`. Imágenes recomprimidas (M44). Renombrado de espacios/acentos: `Gianfranco Ferré Residence/`→`gianfranco-ferre-residence/` y `PI89_..._Entrance Lobby`→`Entrance-Lobby` vía `git mv`; 21 referencias actualizadas en HTML; validado 0 imágenes rotas (121 comprobadas) |
| M37 | Sesgar inversión a ticket alto (≥300k) | — | ⬜ |

## FASE 6 — Reevaluación auditoría externa (ChatGPT) · 2026-06-08

Contraste de la auditoría de ChatGPT contra el código real. La mayoría de sus "críticos"
ya estaban resueltos (tracking, CSP, consent, schema, sitemap, canonical). Tareas **reales y
nuevas** que sobreviven al contraste:

| ID | Mejora | Sev | Estado | Archivo / Evidencia | Nota |
|---|---|---|---|---|---|
| M40 | Matizar 3 claims absolutos | Alta | ✅ | `index.html:67,156,414`; `proyectos.html:145,155` | **Hecho 2026-06-08.** "sin riesgo de ocupación"→"sin el riesgo de ocupación ilegal propio del mercado español"; "Nulo"→"Muy bajo, dentro del marco regulado"; "Flujo mensual sin ocupas"→"...en un marco regulado"; "siempre hay comprador"→"demanda sostenida...sujeta al ciclo de mercado". "6–9%"→"6–9% estimada" |
| M41 | Microdisclaimer inline en el hero | Media | ✅ | `index.html` (`p.hero-fineprint` tras hero-filter) | **Hecho 2026-06-08.** Nota tenue "Cifras estimadas de mercado (2024–2025), no garantizadas; la fiscalidad depende de su país de residencia" con enlace a #fuentes |
| M43 | `og:image` temática por zona | Media | ✅ | `assets/og/og-abu-dhabi.jpg`, `og-rak.jpg` (1200x630 jpg); `invertir-abu-dhabi.html`, `invertir-ras-al-khaimah.html` | **Hecho 2026-06-08.** 2 og nuevas con foto real (skyline Abu Dhabi; render NH RAK). Los 14 artículos de Dubai/fiscalidad/golden visa mantienen el skyline Dubai genérico (`og-image.jpg` 1200x630, temáticamente correcto; no hay material apaisado de calidad para diferenciar más sin degradar) |
| M44 | Comprimir imágenes de `/projects` | Media | ✅ | `public/assets/projects/*` | **Hecho 2026-06-08.** Recomprimidas a webp q72 (máx 1600px). Galería **4.6 MB → 2.6 MB (−44%)**. fachada 611→202KB, 06_*534→174KB, etc. Cierra la parte de imágenes de M36 |
| M42 | ~~Escalonar fechas del blog~~ | Media | ❌ | 16 artículos `datePublished=2026-06-07` (fecha real) | **No-go 2026-06-08 por integridad.** Inventar fechas pasadas falsea el histórico (contra la disciplina de la casa) y es un riesgo SEO (incoherencia con la fecha de primer rastreo que Google ya registró). Acción honesta: dejar `datePublished` real e ir divergiendo `dateModified` al revisar de verdad cada artículo |
| M39 | Limpiar versión interna "V6/V6.2" de subjects de email | Baja | ✅ | `index.html:372`; `app.js` (3 subjects) | **Hecho 2026-06-08.** "V6.2"/"V6" eliminados de los 4 asuntos de email (lead form + WhatsApp directo) |
| M45 | Ampliar schema: `Organization`+`WebSite` global; valorar `Person` revisor | Baja | ✅ | `index.html` | **Hecho 2026-06-08.** Añadido `WebSite` (con `publisher` Organization → Propulse SLU). Sin `SearchAction` (no hay buscador interno). `Person` no se añade: no hay revisor con nombre real (coherente con M18) |
| M46 | ~~URLs limpias sin `.html`~~ | Baja | ❌ | Arquitectura `.html` deliberada (`html_handling:"none"`) | **Evaluado y descartado 2026-06-08** (ver análisis abajo). 0 ganancia SEO + riesgo sobre un sitio recién indexado + reescritura de 20+ archivos. No es mejora con ROI positivo |
| M47 | ~~Separar consentimiento privacidad/comercial~~ | Media | ❌ | `index.html:534-536` | **Decisión del usuario 2026-06-08: mantener checkbox único** (menos fricción en el form) |
| M48 | Imágenes temáticas del blog (Pexels) | Media | ✅ | `public/assets/blog/*`, `public/assets/og/og-*`, `blog/creditos.html` | **Hecho 2026-06-08.** Pipeline `tools/imgproc/` (sharp + API Pexels): cada uno de los 16 artículos con hero (webp 1280) + og (1200x630) temáticos según su tema (golden visa→pasaporte, fiscalidad→documentos, zonas→skyline). Hub `/blog/` con cards temáticas. Alt text actualizado. Página de créditos `/blog/creditos.html` (atribución Pexels) enlazada desde el footer. og genéricas/huérfanas eliminadas |
| M49 | De-dup de copy en la home | Baja | ✅ | `index.html` | **Hecho 2026-06-08.** 5 redundancias eliminadas (eco "español"/"0€" hero↔badges, "ni al inicio ni al cierre" proceso↔FAQ, dos badges de coste seguidos, ticker = copia de badges, escasez duplicada) + de-dup del hero. Blog NO tocado: su repetición (disclaimer/bio/CTA) es funcional |

**Ya resuelto (ChatGPT lo marcaba como pendiente — verificado en código):** title limpio sin V6.2 ✅ · canonical ✅ · robots.txt+sitemap (21 URLs) ✅ · Consent Mode v2 default `denied`→`granted` ✅ · GA4 `G-BK37V83363`+Ads `AW-586671676`+Meta Pixel (tras consentimiento) ✅ · eventos GA4 completos (`generate_lead`, `form_step_view`, `roi_*`, `whatsapp_*`, `section_view`) ✅ · captura UTM/`gclid`/`gbraid`/`wbraid` ✅ · honeypot `botcheck` ✅ · checkbox RGPD ✅ · `<noscript>` fallback ✅ · CSP sin `unsafe-inline` en script-src + HSTS + X-Frame-Options + Permissions-Policy ✅ · schema `RealEstateAgent`+`FAQPage`+`BlogPosting`+`BreadcrumbList`+`ItemList` ✅ · disclaimers de fuentes (M16) ✅ · hero con `preload`/`fetchpriority`/`srcset`/`width-height` ✅ · skip-link + `lang=es` + ARIA ✅ · ROI con disclaimer ✅ · identificación registral en legal (M14) ✅.

**Falsos positivos de ChatGPT:** "V6.2 en el `<title>`" (no: limpio, solo en subject) · "Google Ads vacío / Meta Pixel ausente" (ambos configurados) · claims "garantiza" (son disclaimers "no garantizado") · "ROI muestra 0€ al cargar" (`calcROI()` se ejecuta al cargar, `app.js:658`).

**Pendientes preexistentes que ChatGPT también señala (ya en el tablero):** M09 (anti-spam/fallback captura) · M13 (restricción dominio Web3Forms) · M17 (prueba social verificable) · M19 (PDF lead magnet) · M21 (robots IA + doble `User-agent`) · M27 (fonts render-blocking) · M28 (INP animación KPI) · M30 (HSTS 2 años + ACAO en Cloudflare) · M31 (Lighthouse ≥90 + validar JSON-LD) · M36 (higiene imágenes).

---

## Registro de actividad (tareas realizadas)

### 2026-06-09 — Auditoría técnica senior (F1–F13) + ejecución F2/F3
- **Auditoría completa** documentada en `AUDITORIA_TECNICA_2026-06-09.md` (hallazgos F1–F13, plan por fases, checklist ejecutable, propuestas de código). Verificación de cabeceras/caché/redirecciones con `curl.exe -sI` contra producción.
- **F3 ✅** — `public/_headers`: línea HSTS alineada de `max-age=63072000` a `max-age=31536000` (lo que realmente sirve Cloudflare; el dashboard topa en 12 meses). Eliminado el valor fantasma de 2 años. **Preload evaluado y NO registrado** (decisión del usuario): hstspreload.org rechaza por orden de redirecciones (apex `http://`→`https://www` en un salto; falta `http://apex→https://apex`). Arreglarlo exige tocar routing de Cloudflare + compromiso casi irreversible → beneficio marginal frente a HSTS ya activo. Ver M30.
- **F2 ✅** — Anti-spam Web3Forms cerrado por decisión: **Spam Protection Level → Strict** (panel, gratis, server-side, sin fricción) + honeypot `botcheck`. Turnstile/Domain Restriction son PRO; hCaptcha (gratis) descartado por fricción de checkbox en el funnel. Sin cambios de código. Validación: test E2E + healthcheck M08. Ver M13.
- **Hallazgo nuevo principal (F1, Alta):** assets estáticos servidos con `Cache-Control: public, max-age=0, must-revalidate` → sin caché de navegador. Pendiente: reglas de caché larga inmutable en `_headers` (propuesta lista en la auditoría).
- **Doc obsoleta detectada (F7):** `docs/SEGURIDAD_CABECERAS.md` describe GitHub Pages y afirma que `_headers` se ignora — falso hoy (Cloudflare Workers lo aplica). `README.md` vacío.
- **Verificación post-ejecución (sesión paralela):** F1 (caché) confirmada **viva** (`curl.exe`: woff2/webp `immutable`, CSS `max-age=86400+SWR`); F5 (labels a11y), F7 (README + doc cabeceras), F9 (twitter), F10 (hreflang), F11 (enlaces wa-float/logo) ✅. F4 (canonical raíz sin 301) **no viable** en Workers Assets (rewrite del root revertido en `b980ca9`) → tradeoff aceptado.
- **F6 ✅** — De-dup de JS: creado `public/assets/common.js` con el menú móvil (hamburguesa) y el nav-auto-ocultable al scroll, que estaban triplicados en `app.js`/`proyectos.js`/`blog.js`. Eliminados de los 3 ficheros y `common.js` añadido (defer, antes del JS de página) a las **20 páginas con nav** (index, proyectos, blog hub + 16 artículos, equipo). Validado: `node --check` OK en los 4 ficheros; `nav-burger` solo aparece ya en `common.js`. Pendiente: deploy.
- **F12 ❌ — descartado por decisión razonada.** Fingerprint + `Cache-Control: immutable` en CSS/JS exige re-estampar un hash/`?v=` en ~22 ficheros en cada cambio; en un sitio **sin build** y de **despliegue frecuente**, olvidarlo deja a los usuarios con CSS/JS viejo hasta 1 año (bug silencioso). El esquema actual (`max-age=86400 + stale-while-revalidate`) es seguro y se auto-actualiza; el ahorro real (evitar algún 304 de ficheros minúsculos) es despreciable. No es mejora con ROI positivo.
- **Fix UX móvil landscape (home) ✅** — Bug reportado: al girar el móvil a horizontal, la home encogía el contenido a media pantalla (proyectos/blog reflowean bien). **Causa raíz** (diagnosticada en navegador con CDP/emulación 844×390): el **ticker** (`.ticker-inner{width:max-content}` ≈ 6368px) está oculto en vertical (`@media max-width:700px`) pero **visible en landscape** (ancho 700–1024px); su ancho ensancha el viewport de layout (html `scrollWidth` 1249 vs `clientWidth` 844) y iOS Safari encoge el contenido al girar. `blog`/`proyectos` no tienen ticker → no sufrían el bug. **Fix**: `html,body{overflow-x:hidden;max-width:100%}` en `home.css`. Verificado en vivo: `documentElement.scrollWidth` 1249→844 y el nav/banner vuelven a caber en el viewport. Sin tocar el ticker (sigue animando dentro de su contenedor).

### 2026-06-08 — Reevaluación auditoría ChatGPT + FASE 6
- **Reevaluación** — Contrastada la auditoría externa de ChatGPT contra el código real. La mayoría de sus "críticos" ya estaban resueltos (tracking GA4+Ads+Meta, Consent Mode v2, CSP sin unsafe-inline, schema, sitemap, canonical, UTM/gclid, honeypot, RGPD, noscript). Falsos positivos: "V6.2 en el title" (limpio), "Ads/Pixel ausentes" (ambos viven), claims "garantiza" (son disclaimers). Tablero FASE 6 con lo que sobrevive.
- **M40 ✅** — Matizados los 3 claims absolutos (5 ubicaciones) en `index.html` y `proyectos.html`. Riesgo legal/credibilidad cerrado. Sin tocar las cifras con fuente (M16).
- **M41 ✅** — Microdisclaimer tenue en el hero con enlace a #fuentes.
- **M44 ✅** — Galería `/projects` recomprimida con sharp (webp q72, máx 1600px): **4.6 MB → 2.6 MB (−44%)**, in-place, mismas dimensiones. Toolchain aislada en `tools/imgproc/` (gitignored).
- **M43 ✅** — 2 og temáticas (Abu Dhabi, RAK) generadas desde foto real a 1200x630 jpg y asignadas (og:image + twitter:image + JSON-LD image). Resto mantiene el skyline Dubai genérico.
- **M42 ❌** — No-go por integridad: no se falsean fechas de publicación hacia atrás (riesgo SEO + disciplina de no inventar).
- **M46 ❌** — URLs limpias evaluadas y descartadas: 0 ganancia SEO, riesgo sobre sitio recién indexado, reescritura masiva. No prioritario.
- **M47 ❌** — Decisión del usuario: mantener checkbox de consentimiento único.
- **Lote B+C (mismo día, segunda tanda):**
  - **M39 ✅** — "V6"/"V6.2" eliminados de los 4 asuntos de email.
  - **M45 ✅** — schema `WebSite` (publisher Organization→Propulse SLU) en index.html. JSON-LD del sitio: 57 bloques, 0 inválidos.
  - **M21 ✅** — política de bots de IA explícita en robots.txt (permitidos GPTBot/Google-Extended/PerplexityBot/ClaudeBot).
  - **M27 ✅** — fonts ya eran self-hosted; añadido preload de Cormorant latin (H1/LCP).
  - **M36 ✅** — renombrado de imágenes con espacios/acentos (`gianfranco-ferre-residence`, PI89 `Entrance-Lobby`); 21 refs actualizadas, 0 rotas.
  - **M28 ⏸️** — evaluada: no tocar sin profiling (scroll-triggered, no afecta INP).
  - **M31 🟡** — JSON-LD validado (57 bloques OK); pendiente PageSpeed Insights en vivo tras deploy.
  - Despliegue en 2 commits (lote A: 8455e39; lote B+C: c3fdeb6).
- **Lote D (imágenes temáticas + copy):**
  - **M48 ✅** — montado pipeline de imágenes con la API de Pexels (`tools/imgproc/pexels-fetch.mjs` + `assign.mjs`, gitignored). Los 16 artículos pasan de reutilizar 3-4 fotos de proyectos a tener cada uno una imagen temática propia (hero + og + card del hub), con alt correcto. Página de créditos para cumplir la atribución de Pexels. Fotos de proyectos quedan en su sitio natural (`proyectos.html`).
  - **M49 ✅** — barrido de redundancias de copy: 5 de-dups en la home (el blog se deja intacto porque su repetición es funcional: disclaimer YMYL, bio de autor, CTAs).
  - Decisiones del usuario: contrato RRS supeditado al registro del objeto social de Propulse (final de junio) → la firma no es acción inmediata; foco en captación orgánica y conversión. Memoria documental (`G:\...`) sincronizada con el repo.
- **Lote E (UX, feedback del usuario):**
  - Fotos hero elegidas por el usuario vía Pexels (como-invertir, comprar-sobre-plano) aplicadas (commit `67e2a67`).
  - **M50 ✅** — títulos de los artículos del blog: ensanchados (`max-width` del h1 20ch→32ch y el `<header>` pasa a usar el ancho completo del contenido, alineado con el hero; antes se veía en columna estrecha).
  - **M51 ✅** — menú móvil en la home: botón hamburguesa con navegación (Por qué/Proceso/Proyectos/Blog/FAQ) + CTA destacado; antes en móvil solo quedaba el logo arriba y el sticky-CTA abajo, sin acceso a Proyectos/Blog. CSP-safe (listener en app.js). El sticky-CTA inferior se mantiene (conversión persistente). Pendiente: replicar el patrón en proyectos.html y blog si se quiere navegación móvil consistente.
  - **Imágenes propias (IA) del usuario aplicadas** (commit `e03272b`): 4 heroes propios (golden-visa = UAE Golden Visa, residencia-fiscal, vivir-en-dubai, invertir-ras-al-khaimah = Wynn sin texto) + 2 imágenes dentro de artículo (mapa de zonas en mejores-zonas; render Wynn con texto en invertir-ras-al-khaimah). Estos 4 salen de la atribución Pexels (son propios); créditos regenerados (12 fotos Pexels). Flujo: archivos en `tools/imgproc/incoming/` → `process-incoming.mjs` (sharp).
  - **Ajustes UX del blog** (`3a40530`+`1999870`+`b2fe14c`): títulos h1+lede y cuerpo (prose) a ancho completo del contenedor; golden-visa con `object-position:left`; etiquetas funnel (Imprescindible/Popular) ocultadas en el hub; fix del bloque "Lo esencial" (el `li` con `display:flex` partía el texto en columnas en móvil → bullet absoluto). Cambios globales en blog.css.
  - **Menú móvil global** (`8c548ef`): hamburguesa replicado en blog (blog.css/blog.js, 18 páginas) y proyectos (proyectos.css/proyectos.js); antes solo en la home. Legal/créditos/404 quedan fuera (secundarias).
  - **Lote UX móvil** (`e96678a`): nav auto-ocultable al scroll (se oculta al bajar, reaparece al subir) + barra a 48px en landscape (home/blog/proyectos, CSS+JS); menú simplificado a Proyectos/Blog (+Inicio en móvil) + CTA, quitados Por qué/Proceso/FAQ; contraste de CTA mejorado (texto `#fff`→navy sobre dorado: 2.7:1→6.3:1, AA) en home/blog/proyectos/legal; proyectos.html sin las 3 tarjetas `project-stats` redundantes por proyecto.

### 2026-06-07
- **M18 🟡 (gran avance)** — Ejecutado el plan editorial SEO sobre el stack actual (HTML estático + Cloudflare, sin migración). Creado:
  - `assets/css/blog.css` y `assets/blog.js` **autocontenidos** (no dependen de `home.css`/`app.js`), replicando nav, footer, botones y tokens de marca. **CSP-safe**: 0 scripts inline ejecutables, 0 handlers `onclick`; solo JSON-LD (data block) y `src` propios/permitidos.
  - Hub `public/blog/index.html` (`/blog/`) con hero de marca, filtro por categorías, artículo destacado y grid; JSON-LD `Blog`+`BreadcrumbList`.
  - **3 guías pilar** (long-form): `como-invertir-inmuebles-dubai.html`, `impuestos-invertir-dubai-espana.html`, `golden-visa-emiratos-guia.html`. Cada una con `BlogPosting`+`BreadcrumbList`+`FAQPage`, TOC con scroll-spy, tablas, callouts, bio de autor, fuentes citadas y disclaimers YMYL. Datos respetando la disciplina de la casa (cifras con fuente; sin inventar precios de promotoras).
  - Página EEAT `public/sobre/equipo.html` (`AboutPage`) — veraz (Propulse SLU + partners RERA), sin inventar personas.
  - Enlazado interno: Blog añadido al **nav y footer** de `index.html` y `proyectos.html`; `sitemap.xml` ampliado a 8 URLs.
  - Validación: 10/10 bloques JSON-LD válidos, imágenes existentes, 0 enlaces internos rotos, etiquetas balanceadas.
  - **Pendiente:** deploy (`wrangler`/push), alta en Google Search Console + envío de sitemap, validar Rich Results, y completar 5-9 guías restantes del calendario. Verificar tras deploy que `/blog/` resuelve a `index.html` (directory index de Workers Assets con `html_handling:"none"`).
- **M19 🟡** — CTA del lead magnet "Guía fiscal Dubai↔España" colocado en el hub y en el artículo de fiscalidad, conectado al funnel. Pendiente: PDF + automatización de envío.

### 2026-06-04
- **M02 ✅** — Verificado que el Google Sheet de leads es privado (sin acceso en incógnito).
- **M03 ✅** — `SPREADSHEET_ID` y email del agente movidos a Script Properties (`HE_SPREADSHEET_ID`, `HE_AGENT_EMAIL`) en `horizonte-emails.gs`, `import_projects.gs`, `matching_engine.gs`, `telegram_oportunidades.gs`; referencias generalizadas en `SETUP.md`. Verificado: 0 ocurrencias del ID/email personal en `automation/`.
- **M05 ✅** — Valor de conversión por tier (`LEAD_VALUE_EUR`) aplicado a `generate_lead` (GA4), conversión de Ads y `fbq Lead`; añadido `lead_score` como parámetro custom.
- **M04 / M06 🟡** — Código preparado para ambas vías; pendiente decisión + acción en plataforma.
- **H01 🟡** — Contrato RRS: borrador validado, firma prevista semana del 09/06; ampliación de objeto social realizada.
- **M03 ✅ CERRADA** — Usuario creó las Script Properties (`HE_SPREADSHEET_ID`, `HE_AGENT_EMAIL`) en "HE Email Automation" + pegó el código. Detectado: `telegram_oportunidades.gs` vive en un proyecto Apps Script distinto (allí está `TG_BOT_TOKEN`) → repetir las dos properties en ese proyecto cuando se active.
- **M04 + M06 ✅** — `generate_lead` (GA4) importado en Ads como conversión principal (vía A). DebugView vacío pero Tiempo Real muestra `generate_lead`=1 → tracking validado. **Atención doble conteo:** el objetivo "Envío de formulario" tiene 2 acciones principales (`generate_lead` GA4 + "Formulario de contacto - Enviar"); dejar solo `generate_lead` como principal. M07 parcial: falta verificar Sheet + email de bienvenida.
- **DEPLOY** — Commit `409fd57` + push a `main`: fix M07 (nombres de campo ASCII) + M05 (valor por tier) desplegados a GitHub Pages. M03 (.gs) versionado. Incluye trabajo previo del usuario (rediseño de publicación de Telegram). Pendiente: re-test E2E cuando propague el deploy.
- **🔴 HALLAZGO CRÍTICO NUEVO (seguridad)** — El token del bot de Telegram (`8358149283:AAF…poX8`) estuvo **hardcodeado y commiteado en el historial público de GitHub** (commits anteriores a `409fd57`). El working tree ya lo movió a `TG_BOT_TOKEN` (Script Properties), pero el token sigue visible en el historial. **ACCIÓN URGENTE (M38): revocar en @BotFather (/revoke) y generar uno nuevo; guardarlo en `TG_BOT_TOKEN` del proyecto Apps Script de Telegram.** El token viejo debe considerarse comprometido.
- **M07 FIX aplicado** — Causa raíz confirmada con `debugPollLatestWeb3Lead`: los campos del email Web3Forms usaban nombres decorativos con emojis/'·' que llegan con mojibake (UTF-8 leído como Latin-1: `Contacto Â· ðŸ‘¤ Nombre`) y rompen `parseLeadFromEmail`. Fix en `index.html` `buildWeb3LeadPayload`: nombres ASCII simples (Nombre, Telefono, Email, Pais, Capital, Objetivo, Plazo, Visita Dubai, Tier, Puntuacion, Canal). El parser existente ya reconoce esas claves → NO hay que tocar el `.gs`. **PENDIENTE: commit+push a GitHub Pages + re-test.** (Menor pendiente: valores con tilde como "España" pueden llegar con mojibake en el valor — cosmético.)
- **M07 (BUG encontrado)** — Prueba E2E: correo llega, lead se guarda en Sheet y sale email de bienvenida ✅. PERO `parseLeadFromEmail` NO extrae los campos del cuerpo: nombre queda "Inversor" (default), y teléfono/capital/objetivo/plazo/viaje vacíos. Solo sobreviven email (regex fallback), país (default "España"), tier/puntuación (del asunto). Causa probable: Web3Forms envía los campos en tabla HTML sin formato "clave: valor" → el parser no hace match. Fix pendiente: ajustar `htmlToPlainForParse`/`parseLeadFromEmail` + simplificar nombres de campos del payload en `index.html`. Instancia real de H04. **Bloquea calidad del dato al CRM (matching, scoring, personalización de emails).**
- **Hallazgo (M06/M10)** — En GA4 hay 4 eventos clave que el sitio NO dispara (`purchase`, `qualify_lead`, `close_convert_lead`, `manual_event_SUBMIT_L`). El evento real de conversión es `generate_lead`, que aún no aparece para importar en Ads porque GA4 no lo ha recibido ni está marcado como evento clave. Acción: crear `generate_lead` como evento clave en GA4 + envío de prueba (M07), luego importar.

---

- **M20 + M22 ✅** — Datos estructurados (BreadcrumbList + ItemList) en proyectos.html y enlazado interno del footer corregido. Commit `bf5b6ba` desplegado.
- **M11 + M30 ✅/🟡** — Código muerto de `captureUTM` eliminado; `404.html` con identidad de marca creada. Commit `74de19c`. Pendiente en Cloudflare: HSTS a 2 años y revisar ACAO. (Verificado en M07: los datos del lead llegan completos; columnas UTM vacías son correctas — solo se rellenan con tráfico de campañas.)
- **M38 ✅** — Token de Telegram revocado en @BotFather y rotado a `TG_BOT_TOKEN`; bot operativo. Token comprometido invalidado.

- **M08 ✅ + M10 ✅** — Healthcheck del pipeline activado (trigger cada hora). Eventos clave fantasma desmarcados en GA4; `generate_lead` única conversión. Cierre de jornada 2026-06-04: 7 commits a producción (`409fd57`, `bf5b6ba`, `74de19c`, `82aeb25`, `af6322d` + roadmap).

## ⚠️ Acciones del usuario requeridas para cerrar lo aplicado hoy

1. **Apps Script — crear Script Properties** (⚙ Configuración del proyecto → Propiedades de la secuencia de comandos), en cada proyecto que contenga estos `.gs`:
   - `HE_SPREADSHEET_ID` = ID del Google Sheet de leads
   - `HE_AGENT_EMAIL` = email donde recibir los briefings
   - Pegar el código actualizado de los `.gs`. **Sin estas propiedades, `SPREADSHEET_ID` será nulo y el sistema fallará.**
   - (El token de Telegram `TG_BOT_TOKEN` ya usaba este mismo mecanismo.)
2. **Google Ads — elegir UNA vía de conversión** para no duplicar:
   - **Recomendada (M06):** Ads → Herramientas → Conversiones → importar el evento `generate_lead` de GA4. Dejar `ADS_CONVERSION_LABEL` **vacío** en el código (ya lo está → no duplica).
   - **Alternativa (M04):** crear conversión nativa en Ads, copiar la etiqueta y pegarla en `ADS_CONVERSION_LABEL`. En ese caso, **no** importar también `generate_lead` desde GA4.
3. **Verificar** el disparo en Tag Assistant / GA4 DebugView con un envío de prueba (encaja con M07).

---

## FASE 7: Auditoría técnica 2026-06-09 (Cursor) · hallazgos F1 a F13

Doc completo en `docs/AUDITORIA_TECNICA_2026-06-09.md`. Veredicto global: estado BUENO a MUY BUENO; mejoras de higiene técnica fina. Lote **aplicado y desplegado** a producción (commits `ec135f2` + `b980ca9`); F1, F5, F9, F10, F11 verificados en vivo:

- **M48 (F1) ✅:** caché larga inmutable para `/assets/*` en `public/_headers` (imágenes/fuentes/logos `immutable` 1 año; og 30 días; css/js 1 día + `stale-while-revalidate`). Reglas antes de `/*`; cabeceras de seguridad acumulativas. Verificar en vivo tras deploy con `curl.exe -sI .../assets/css/home.css`.
- **M49 (F4) ⬜ NO VIABLE en este stack:** se probó el rewrite `/  /index.html  200` pero el router de Workers Assets aplica su 301 de índice del root (`/`→`/index.html`) con precedencia sobre `_redirects` (confirmado en vivo; `/blog` sí funciona por rewrite, `/` no). Evitarlo exigiría cambiar `html_handling`, lo que rompería todos los `.html` (canonical/sitemap/enlaces). Decisión del usuario: mantener canonical `/` y aceptar el 301 (benigno; Google sigue el 301 y respeta el canonical). Regla muerta revertida; nota dejada en `_redirects`.
- **M50 (F5) ✅:** labels `for`/`id` asociados en formularios de `index.html` (home: `f-nombre`, `f-email`, `phone-num`, `f-pais`; modal WA: `wam-n`, `wam-e`, `wam-ph`). Añadido `autocomplete` a nombre/email del home.
- **M51 (F11) ✅:** `href` reales en `index.html`: wa-float a `wa.me/971554722025` (con `target`/`rel`; el JS sigue interceptando para abrir el modal) y logo del footer a `/`.
- **M52 (F9) ✅:** `twitter:title` y `twitter:description` añadidos en 20 páginas (derivados de `og:title`/`og:description`). `legal.html` y `creditos.html` no tienen tarjetas OG/Twitter (páginas internas, fuera de alcance).
- **M53 (F10) ✅:** `hreflang="es"` + `x-default` (apuntando al canonical de cada página) en 22 páginas. `404.html` excluida (noindex, sin canonical).
- **M54 (F7) ✅:** `README.md` reescrito (stack, estructura, deploy, disciplina) y `docs/SEGURIDAD_CABECERAS.md` actualizado al stack real (Cloudflare Workers Assets, `_headers` nativo, tabla de caché). El doc anterior describía GitHub Pages y decía que `_headers` se ignoraba (falso hoy).

### Pendiente de acción manual (dashboard/terceros)
- **F2:** ver **M13** (ya cerrada): Spam Protection → Strict + honeypot `botcheck`. No se hace trabajo de código adicional (decisión del usuario 2026-06-09).
- **M56 (F3) 🟡:** HSTS fijado a `max-age=31536000` (1 año) en `_headers`, máximo del plan free de Cloudflare y alineado con lo que se sirve en vivo (ya no hay desajuste archivo/producción). 1 año cumple el mínimo de la preload list. Pendiente solo: registrar el dominio en hstspreload.org.

### Diferido (Fase 3/4 de la auditoría, mayor esfuerzo)
- **F6 ⬜:** extraer `common.js` (de-dup de menú móvil, nav-auto-hide, UTM, FAQ entre `app.js`/`proyectos.js`/`blog.js`).
- **F12 ⬜:** fingerprint/versionado de assets (habilita subir css/js a `immutable` 1 año).
- **F8 ⬜:** retirar `style-src 'unsafe-inline'` migrando estilos inline a clases.
- **F13 ⬜:** Conversions API server-side (Meta/Google) + dashboard de funnel.

### Limpieza de repo (2026-06-09)
- Eliminadas `scripts/` (vacía) y `Horizonte Emirates v2/` (exploración LangGraph local, sin referencias en el repo salvo `.gitignore`, ya limpiado). Se conservan `tools/imgproc/`, `export-propertyfinder-dubai.pipe` y el Diario de actividad (evidencia AEAT). Doc de auditoría movido a `docs/`.
