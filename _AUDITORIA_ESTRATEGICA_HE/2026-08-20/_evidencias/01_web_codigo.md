# Evidencia 01: Código de la web y conversión

**Auditoría estratégica Horizonte Emirates. Fecha de análisis: 20-08-2026.**
**Fuente: repositorio local `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates` (rama main, HEAD 340932d, working tree limpio). Todas las rutas son relativas al repositorio salvo indicación.**
**Modo: solo lectura. Ningún archivo existente fue modificado.**

---

## 0. Contexto verificado en el repositorio

| Dato | Valor | Evidencia |
|---|---|---|
| Hosting | Cloudflare Workers Assets, sirve `./public` | `wrangler.jsonc` líneas 7-19 |
| Home | `public/index.html`, 66.403 bytes, 906 líneas | listado de `public/` |
| Último rediseño del hero | 19-08-2026 (5 commits: cf8e92c, bd2cf3e, 99c7c4a, e637e33, d277773, 340932d) | `git log --date=format` |
| Corrección CSP de medición | 19-08-2026 17:01, commit 8f58b06 | `git show 8f58b06` |
| Correcciones de conversión "12-ago" | commits c4723f3 y 3cf3e0b (más 343d268, 226dd26, 8132e6f, 1009dd1 del 12-08) | `git log` |
| GA4 | G-BK37V83363 | `public/assets/gtag-init.js` líneas 23 |
| Google Ads | AW-586671676 | `public/assets/gtag-init.js` línea 24 y `public/assets/app.js` línea 5 |
| GTM | GTM-NZV6VJDC en todas las páginas medidas | `public/assets/gtm-init.js` línea 22; `<noscript>` en index/proyectos/legal/inversion-fraccionada |
| Meta Pixel | 972040562129072, carga solo con consentimiento de publicidad | `public/assets/consent.js` líneas 20 y 44-50, 63 |
| Formularios | Web3Forms (`https://api.web3forms.com/submit`), access_key visible en cliente | `public/index.html` líneas 454-455; `app.js` líneas 3-4 |
| WhatsApp | +971 55 472 2025 (número de Emiratos) | `app.js` línea 2; `index.html` línea 897; `proyectos.html` línea 447 |

Nota de seguridad: la access_key de Web3Forms (3861d49c-...) es pública por diseño del producto (formularios estáticos), pero cualquiera puede usarla para enviar correos al buzón del proyecto. Existe honeypot `botcheck` (`index.html` línea 460). No se han encontrado contraseñas ni claves privadas en los archivos revisados.

---

## 1. Hero actual (estado a 20-08-2026)

Fuente: `public/index.html` líneas 78-134.

Estructura en orden de aparición:
1. H1: **"Invierta en pisos en Dubai desde 30.000€ de entrada."** (línea 85)
2. Subtítulo: **"Propiedad a su nombre, lista para alquilar, sin salir de España."** (línea 86)
3. **Tres tarjetas de inmuebles** con enlace a `/proyectos.html#ancla`: SAAS Hills desde 242.000€, Binghatti Wraith desde 299.000€, NH Collection desde 399.000€ (líneas 90-115)
4. Línea de pagos: **"El resto se reparte hasta 36 meses después de la entrega."** (línea 116)
5. Nota: "Precios de lista del promotor, convertidos a euros. Ver los 7 inmuebles →" (línea 117)
6. **Captura de un toque**: "¿De cuánto dispone para invertir?" con 5 botones de rango de capital que preseleccionan la respuesta en el formulario real y hacen scroll hasta él (líneas 121-131; lógica en `app.js` líneas 346-401)

En móvil las tarjetas se convierten en carrusel horizontal (tarjetas al 62% del ancho) y la captura pasa a 2 columnas (`public/assets/css/home.css` líneas 1111-1119). El hero completo en móvil es: H1 + subtítulo + carrusel + 2 líneas de texto + caja con 5 botones. La caja de captura queda con alta probabilidad bajo el pliegue en pantallas comunes (inferencia a partir del volumen de elementos; no se ha renderizado).

### 1.1 Incoherencias del mensaje del hero (alto impacto)

| Claim del hero | Realidad verificable en la propia web | Evidencia |
|---|---|---|
| "lista para alquilar" | Los 7 inmuebles publicados son preventa/off-plan con entregas entre dic-2027 y T1-2029. Ninguno está listo para alquilar hoy. La única excepción parcial es W Residences ("en renta desde el primer día" pero entrega dic-2028). | `proyectos.html` líneas 103 (tag "En preventa"), 292 ("entrega en diciembre de 2027"), 339 ("entrega, prevista para diciembre de 2028"), 383-384 ("Entrega en el primer trimestre de 2029") |
| "desde 30.000€ de entrada" | La entrada del 10-20% aplicada al inmueble más barato publicado (SAAS Hills, 242.000€) da 24.200-48.400€. El claim es defendible solo en el extremo bajo del rango. La FAQ dice "Con 30.000€ puede acceder a propiedades desde 150.000€", pero no hay ningún inmueble publicado de 150.000€. | `index.html` líneas 85, 770 (FAQ), 96 (242.000€) |
| "El resto se reparte hasta 36 meses después de la entrega" | La página de proyectos solo detalla planes de pago en 2 de 7 inmuebles (Binghatti "plan 20/80 o 50/50", línea 299; BRABUS "20% de entrada y 1% mensual", línea 389). En ningún proyecto publicado consta un plan post-entrega de 36 meses. El claim no está respaldado en la propia web. | `proyectos.html` líneas 299, 389; commit d277773 (19-08, "plazo de pago hasta 36 meses tras la entrega") |

Clasificación: los textos son **hecho_verificado**; el efecto (clic de pago que rebota al ver precios reales, y desconfianza del perfil informado) es **inferencia**.

---

## 2. Jerarquía de la home y CTAs

Orden de secciones (`index.html`): NAV → HERO → KPI strip → ticker → filtro "Para quién es esto" → España vs Dubai (tabla) → Zonas → Proceso (4 pasos) → Confianza "¿Por qué es gratis?" → Calculadora ROI → **FORMULARIO** (línea 431) → Lead magnet guía fiscal (línea 659) → FAQ → Estrategia por capital → Footer.

CTA dominante: "Solicitar análisis gratuito" con destino `#form`, repetido en nav (línea 64), menú móvil (74), filtro (170), calculadora (424), sticky móvil (900). Todos los `a[href="#form"]` emiten `generate_lead_click` (`app.js` líneas 428-437). Texto unificado (commit bc6ab04). Correcto y coherente.

Observaciones CRO:
- El formulario está en la posición 11 de 15 bloques. La distancia desde el hero es larga, pero los atajos (captura del hero, sticky CTA, nav) lo mitigan.
- El primer elemento clicable tras el H1 son las tarjetas de inmuebles que **sacan al usuario de la home** hacia `/proyectos.html`, una página **sin formulario propio**: allí todos los CTAs vuelven a `index.html#form` (líneas 122, 167, 212, 258, 303, 348, 393, 410, 423 de `proyectos.html`). El camino de "mirar" compite con el de convertir y añade dos saltos de página para volver al formulario. Hecho estructural verificado; el coste en conversión es inferencia.
- El mensaje de escasez "Solo analizamos solicitudes que encajan con los proyectos disponibles" (`index.html` línea 439) más el bloque "Para quién es esto / Seleccionamos inversores" (169) filtran deliberadamente. Coherente con la estrategia declarada, pero es fricción añadida a un funnel que hoy genera 2 leads/mes.

---

## 3. Formulario de captación

Fuente: `index.html` líneas 431-656; lógica en `app.js`.

- **2 pasos** desde el 12-08 (antes 3): Paso 1 = capital (5 rangos) + horizonte de decisión (4) + visita a Dubai (3); Paso 2 = nombre, email, teléfono con prefijo (13 países), país de residencia (11 opciones), canal preferido (WhatsApp/llamada/email), 2 casillas RGPD (obligatoria + marketing opcional).
- Scoring cliente: capital 0-4, plazo 1-4, viaje 0-2; tier A ≥6, B ≥4, C resto, con techo B para "menos150k" (`app.js` líneas 82-102). El tier y el valor (A=300, B=120, C=40 EUR) viajan a GA4/Ads.
- Validaciones: email regex, teléfono normalizado (quita prefijo duplicado, mínimo 6 dígitos), casilla RGPD verificada en el submit con mensaje visible (líneas 465-495). El botón ya no se deshabilita (fix del bug "botón muerto" del 12-08, comentario en líneas 195-202).
- Persistencia del estado en sessionStorage con restauración (líneas 1114-1204). Timeout de 15 s y `keepalive` en el POST (524-526). Auto-avance al paso 2 solo si no se navegó manualmente (166).
- **Tras el envío**: pantalla de éxito inline (div `#success`, no hay página /gracias): mensaje 48 h + botón Calendly precargado con nombre y email + botón WhatsApp con mensaje prefabricado (633-653). El registro de consentimiento (texto literal, versión, fecha) viaja en el payload (325-333). Sin doble opt-in.
- Anti-spam: honeypot `botcheck` únicamente. Sin captcha ni verificación de email. Riesgo de spam moderado con la access_key pública.
- Lead magnet guía fiscal: un solo campo email + casilla, la descarga abre siempre (`app.js` 595-694), el registro entra con asunto "[Descarga guia fiscal]" deliberadamente fuera del patrón de lead para no bloquear un registro posterior por email duplicado (comentario líneas 599-604). El PDF existe: `public/guias/guia-fiscal-dubai-espana.pdf` (206 KB).

Veredicto técnico: el formulario está bien construido tras las correcciones del 12-08. La fricción restante es de diseño (cualificación antes del contacto), no de bugs.

---

## 4. WhatsApp

- **Home**: el flotante NO abre WhatsApp: abre un modal que exige nombre + email + teléfono + casilla RGPD antes de generar el enlace wa.me (`index.html` 844-897; `app.js` 696-797, listener en 1109). El envío del modal registra `generate_lead` tier C y lead en Web3Forms con asunto "[WhatsApp directo]".
- **Proyectos**: el FAB abre WhatsApp **directo, sin captura de ningún dato** (`proyectos.html` líneas 447-450), y los botones "Preguntar por WhatsApp" de cada proyecto también son enlaces directos con mensaje contextual (123, 168, 213, 259, 304, 349). Solo emiten evento `whatsapp_click` vía data-track (`proyectos.js` 11-23).

Inconsistencia verificada: el mismo canal exige un formulario completo en la home (fricción máxima en un canal que el usuario espera instantáneo) y cero datos en proyectos (clic sin lead recuperable si el usuario no escribe). Ninguna de las dos rutas usa la API de WhatsApp Business para registrar la conversación.

---

## 5. Medición y tracking

### 5.1 El hallazgo principal: la CSP bloqueó medición durante TODA la campaña

Commit 8f58b06 (19-08-2026 17:01), mensaje literal resumido: cuatro destinos bloqueados por la CSP de `public/_headers`:
1. `analytics.google.com` (el comodín `https://*.analytics.google.com` no cubre el dominio raíz, que es al que envía GA4): **eventos que salían por ese endpoint se perdían**.
2. `stats.g.doubleclick.net` (Google Signals): audiencias de remarketing sin alimentar.
3. `ad.doubleclick.net` (conversion linker de Ads): atribución de conversiones afectada.
4. `googleads.g.doubleclick.net` ausente de script-src: el script de conversión podía conectar pero no cargarse.

Cronología verificada con `git log -- public/_headers`: la CSP anterior venía del commit 6c62694 (23-06-2026). La campaña de Ads está activa desde el 20-07-2026. Por tanto **del 20-07 al 19-08 (los 30 días exactos del periodo "2 leads") la web midió con GA4 parcialmente bloqueado y el linker de Ads bloqueado**. Consecuencias:
- Las cifras de GA4 del periodo (sesiones, embudo, conversiones) están infrarregistradas en una proporción desconocida.
- Google Ads recibió menos señal de conversión de la real: Smart Bidding optimizó con datos incompletos.
- La "línea base del 12-08" nació con la medición aún rota (la CSP se corrigió el 19-08).
Estado actual: la CSP vigente en `public/_headers` (línea 45) ya incluye los cuatro destinos. **hecho_verificado**.

### 5.2 Conversión de Google Ads: la etiqueta nativa está vacía a propósito

`app.js` línea 6: `const ADS_CONVERSION_LABEL='';` con comentario: vacío = no dispara la conversión nativa, para evitar doble conteo si se importa `generate_lead` desde GA4. `trackAdsLeadConversion()` (líneas 209-234) retorna sin hacer nada si el label está vacío. Conclusión: **el único camino por el que Ads puede ver conversiones es la importación GA4 → Ads**, que no es verificable desde el código (configuración de las cuentas). Si esa importación no existe o se apoyó en los eventos bloqueados por la CSP, Ads estuvo un mes optimizando sin señal. **hecho_verificado** (label vacío) + **dato_no_disponible** (estado de la importación).

### 5.3 Eventos implementados (inventario verificado en `app.js` y `proyectos.js`)

`generate_lead` (formulario, modal WhatsApp y guía, con value/currency/tier), `generate_lead_click`, `lead_submit_attempt`, `lead_submit_validation_error`, `lead_submit_error`, `form_step_view` (paso 1 solo cuando el formulario entra en pantalla, IntersectionObserver), `form_option_select`, `hero_capital_select`, `hero_property_click`, `form_capital_cambiar`, `section_view` (9 secciones), `roi_calculator_interaction`, `lead_magnet_click/submit_attempt/validation_error`, `whatsapp_modal_open`, `whatsapp_lead_submit`, `whatsapp_click`, `consent_decision`; en proyectos: `project_cta`, `cta_click`, `carousel_slide`, `scroll_depth`, `whatsapp_click`. Cobertura de embudo completa y bien diseñada (deduplicación por transaction_id he-{email} para Ads, email solo en SHA-256 y solo con consentimiento; `app.js` 209-234). Enhanced conversions correcto.

### 5.4 Consentimiento

Consent Mode v2 con default denied y `ads_data_redaction` (gtag-init.js líneas 9-21). Banner propio granular (analítica/publicidad), Aceptar y Rechazar simétricos, caducidad 12 meses (`consent.js`). Meta Pixel solo con consentimiento de ads. Cumplimiento sólido. Contrapartida de negocio: con Rechazar, el gclid se elimina de los pings y la conversión llega sin atribución; no existe página de gracias con URL propia como conversión de respaldo (la pantalla de éxito es un div). La tasa de rechazo del banner no es medible desde el código (**dato_no_disponible**; el evento `consent_decision` la mide en GA4).

### 5.5 UTMs y cross-domain

UTM y click-ids (gclid, gbraid, wbraid) se capturan de la URL y persisten en **sessionStorage** (`app.js` 51-71; `proyectos.js` 4-8): sobreviven a la navegación interna pero **no a un cierre de pestaña**; un usuario que vuelve al día siguiente en visita directa envía el lead sin atribución. El enlace a Calendly de la pantalla de éxito lleva nombre y email pero **ni UTM ni linker cross-domain**: las reservas de llamada no son atribuibles a campaña (`app.js` 548-554). **hecho_verificado**.

---

## 6. Confianza e identidad

- **Cero personas**: en ninguna página revisada aparece un nombre propio, una foto de equipo o una firma. La antigua página de equipo está retirada: `public/sobre/` está vacía y `public/_redirects` líneas 13-14 devuelven 301 de `/sobre/equipo.html` a `/`. Los correos manuales firman "Jesús" (memoria del proyecto), pero la web no lo dice.
- **Cero testimonios ni operaciones cerradas**: el commit 8e06182 (19-08) sustituyó testimonios por "prueba social verificable" (sección "¿Por qué es gratis?", `index.html` 350-380): modelo de ingresos, entregable de 48 h, 7 inmuebles públicos y 16 artículos. Es un enfoque honesto, pero la página pide que un inversor confíe 150.000-1.000.000€ a una marca sin caras, sin casos y con sociedad andorrana y WhatsApp de Emiratos como únicos anclajes.
- El "partner regulado por RERA" se menciona sin nombre ni número de licencia (aunque el texto afirma "verificamos el número de registro... antes de trabajar con ninguna", línea 375, no publica el suyo).
- legal.html declara "Hemos suscrito con dicho socio compromisos contractuales de confidencialidad..." (línea 96). Según la memoria interna del proyecto (contrato RRS firmado solo por RRS, no por Propulse), ese claim podría no estar plenamente soportado: **hipotesis** a validar por el área legal, no verificable desde el repo.

Claims de rentabilidad publicados (todos con disclaimers y sección Fuentes, `index.html` 137-145, 205-216, 239-304, 837-838): 6-12% alquiler bruto Dubai, rentabilidad total ~12-18% Dubai y ~12-19% RAK, apreciación 20-35% pre-Wynn, 0% impuestos locales, comparativa España deliberadamente negativa (ocupación, "hasta 45%"). Formalmente cubiertos por disclaimers; en conjunto acercan la página al patrón "demasiado bonito" para un inversor sofisticado y son material sensible para las políticas de claims financieros de Google Ads (**inferencia**).

---

## 7. Velocidad aparente (análisis estático, sin medición real)

Carga inicial de la home (móvil):
- HTML 66 KB + `home.css` 61 KB + `tokens.css` 0,8 KB + `fonts.css` 8 KB + `app.js` 53 KB + `common.js` 1,8 KB + `consent.js` 11 KB.
- 2 scripts síncronos en head (`gtag-init.js`, `gtm-init.js`, necesarios para Consent Mode antes de gtag) + gtag.js y gtm.js externos async.
- Imágenes del primer pantallazo: hero preload (768w = 52 KB, 1280w = 128 KB, 1920w = 257 KB) + SAAS Hills `hero.webp` **236 KB con loading="eager"** (`index.html` línea 92) + 2 tarjetas lazy (151 KB y 189 KB).
- Fuentes auto-alojadas woff2 con preload del H1 (38 KB); buen trabajo previo (commit c2abei/c2abee1).
- Cache correcta por `_headers` (immutable en img/fonts, 24 h + SWR en css/js con querystring de versión `?v=20260819f`).

Estimación: 500-700 KB transferidos antes de interacción en móvil. No es un problema crítico, pero la imagen eager de SAAS Hills (236 KB para una tarjeta de 62% de ancho en móvil) compite con el LCP del hero. **inferencia** (no se ha ejecutado Lighthouse).

---

## 8. Infraestructura de rutas

- `/` se sirve con 200 vía worker (`worker/index.js`) y Pages Function (`functions/index.js`); `_redirects` reescribe `/blog/` correctamente. `404.html` de marca con enlaces a home y proyectos. Sin problemas.
- `inversion-fraccionada-dubai.html`: página oculta (noindex,nofollow, fuera de sitemap y menús), modo educativo, CTAs por mailto. Correcta como está; no participa del funnel.
- Detalle menor: `sitemap.xml` no incluye `/sobre/equipo.html` (bien, ya no existe) y el blog está completo.

---

## 9. Los 10 principales problemas de conversión (ordenados por impacto)

| # | Problema | Tipo | Confianza | Evidencia principal |
|---|---|---|---|---|
| 1 | La CSP bloqueó parte de GA4 y el linker/script de conversión de Ads del 20-07 al 19-08: la campaña completa corrió con medición rota y Smart Bidding con señal incompleta; las cifras del periodo (incluido el diagnóstico "2 leads") están construidas sobre datos infrarregistrados | hecho_verificado | alta | commit 8f58b06; `git log -- public/_headers` (bug presente desde 6c62694, 23-06) |
| 2 | La conversión nativa de Google Ads no dispara (label vacío por diseño); todo depende de una importación GA4→Ads no verificable desde el código, y esa vía GA4 es justo la que estuvo bloqueada | hecho_verificado + dato_no_disponible | alta | `app.js` líneas 6 y 209-213 |
| 3 | Promesa del hero incoherente con el producto: "lista para alquilar" con 7 inmuebles en preventa (entregas 2027-2029), "desde 30.000€" con ticket mínimo publicado de 242.000€, y "hasta 36 meses después de la entrega" sin respaldo en la página de proyectos | hecho_verificado (texto) / inferencia (efecto) | alta | `index.html` 85-86, 116; `proyectos.html` 292, 339, 383, 299, 389 |
| 4 | Cero identidad humana y cero prueba social de resultados: sin nombres, fotos, licencia del partner ni operaciones cerradas; página de equipo retirada (301 a home). Para tickets de 150k-1M es el mayor déficit de confianza de la web | hecho_verificado | alta | `_redirects` 13-14; `public/sobre/` vacía; grep sin nombres propios |
| 5 | El hero empuja el tráfico de pago hacia `/proyectos.html`, página sin formulario donde todo CTA devuelve a `index.html#form`: el camino de mirar compite con el de convertir y añade saltos de página | hecho_verificado (estructura) / inferencia (coste) | media | `index.html` 90-115; `proyectos.html` CTAs |
| 6 | WhatsApp incoherente: en la home exige nombre+email+teléfono+RGPD antes de abrir el chat (fricción máxima); en proyectos es directo y no captura nada (clic sin lead recuperable) | hecho_verificado | alta | `app.js` 716-797; `proyectos.html` 123, 447-450 |
| 7 | Cualificación antes del contacto más mensajes de filtro ("Solo analizamos solicitudes que encajan"): 3 preguntas obligatorias antes de poder dejar el email expulsan al curioso que sería lead C nutrible | hecho_verificado (diseño) / inferencia (efecto) | media | `index.html` 439, 474-541; `app.js` 141-146 |
| 8 | Sin página de gracias con URL propia: la conversión existe solo como evento JS; con consentimiento rechazado (banner simétrico) el gclid se redacta y no queda ninguna vía de conversión de respaldo ni auditoría sencilla | hecho_verificado | alta | `index.html` 632-653; `gtag-init.js` 9-21 |
| 9 | Claims agresivos de rentabilidad y la comparativa España-en-negativo: legalmente cubiertos por disclaimers pero con patrón "demasiado bonito" para el inversor sofisticado y sensibles para las políticas de Google Ads | inferencia | media | `index.html` 140, 205-216, 285, 298-304 |
| 10 | Atribución frágil fuera de la sesión: UTM/gclid en sessionStorage (se pierden al cerrar pestaña) y Calendly sin UTM ni cross-domain: los leads de visita retornada y las llamadas reservadas no son atribuibles | hecho_verificado | alta | `app.js` 51-71, 548-554 |

Hallazgos menores adicionales: imagen eager de 236 KB en el hero móvil (`index.html` 92); em dash residual en `index.html` línea 212 contra la regla de estilo del proyecto; FAQ "propiedades desde 150.000€" sin inventario que lo respalde (línea 770); access_key Web3Forms pública con solo honeypot como defensa; validación de teléfono mínima (6 dígitos).

---

## 10. Qué NO se puede saber desde el código (para otras áreas de la auditoría)

- Si la importación de conversiones GA4 → Google Ads existe y qué evento importa (consola de Ads).
- La tasa de aceptación/rechazo del banner de cookies (GA4, evento `consent_decision`).
- Qué etiquetas viven dentro del contenedor GTM-NZV6VJDC (interfaz de GTM); el código exige no duplicar GA4/Ads allí (`gtm-init.js` 8-11).
- El rendimiento real (Lighthouse/CrUX) y el comportamiento del hero nuevo, en producción solo desde el 19-08.
- Si el plan de pagos "36 meses tras la entrega" existe en algún proyecto real del inventario (material del promotor).

---

## Archivos revisados (19)

1. `public/index.html` (completo, 906 líneas)
2. `public/proyectos.html` (completo)
3. `public/inversion-fraccionada-dubai.html` (completo)
4. `public/legal.html` (completo)
5. `public/404.html` (completo)
6. `public/_headers` (completo)
7. `public/_redirects` (completo)
8. `public/assets/app.js` (completo, 1.205 líneas)
9. `public/assets/consent.js` (completo)
10. `public/assets/gtag-init.js` (completo)
11. `public/assets/gtm-init.js` (completo)
12. `public/assets/common.js` (completo)
13. `public/assets/proyectos.js` (completo)
14. `public/assets/css/home.css` (parcial: reglas de hero, captura y sticky vía grep)
15. `wrangler.jsonc` (completo)
16. `worker/index.js` (completo)
17. `functions/index.js` (completo)
18. `public/robots.txt` (completo)
19. `public/sitemap.xml` (parcial: listado de URLs)

Consultas git: `git log` (25 commits), `git show 8f58b06`, historial de `public/_headers`, fechas de los 12 últimos commits.

## Archivos no abiertos

- `public/assets/css/tokens.css`, `fonts.css`, `proyectos.css`, `legal.css`, `blog.css` (solo tamaños)
- `public/assets/blog.js` y los 18 HTML de `public/blog/` (solo grep de autoría y listado)
- PDFs y HTML de `public/guias/` (solo existencia y tamaño; el PDF enlazado por el lead magnet existe)
- Imágenes (solo pesos y dimensiones declaradas en HTML)
- `automation/`, `scripts/`, `tools/`, `Analytics/`, `database/`, `docs/` (fuera del alcance del área 1)
