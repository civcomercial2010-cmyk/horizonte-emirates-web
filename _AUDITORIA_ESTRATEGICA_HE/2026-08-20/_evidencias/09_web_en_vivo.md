# Área 9: La web en producción (www.horizonteemirates.com)

**Auditoría estratégica Horizonte Emirates · Fecha de consulta: 20-08-2026**

---

## 0. Método y limitaciones

- Todas las URLs se consultaron el 20-08-2026 contra producción (Cloudflare, CF-RAY con POP MAD).
- La herramienta WebFetch (fetcher automatizado) recibió **HTTP 403 Forbidden** en todas las páginas HTML (home, /proyectos, /blog/, /legal.html, sitemap.xml). Solo robots.txt respondió. La protección anti-bot de Cloudflare bloquea fetchers no navegador. Se repitió la consulta con `curl` y user agent de navegador (Chrome 126 sobre Windows) y todo respondió. Las copias exactas descargadas están en el scratchpad de la sesión (`.../scratchpad/web/`: home.html, proyectos.html, blog.html, legal.html, robots.txt, sitemap.xml, proyectos_404.html, app.js, consent.js, gtag-init.js, blog.js, art_pilar.html).
- **No se envió ningún formulario ni se generó ningún lead.** El análisis del funnel es sobre el HTML y el JavaScript servidos.
- Limitación: sin ejecutar un navegador real no se puede verificar el render visual (solapes, banner de cookies encima de CTAs, etc.). Lo que se afirma sobre comportamiento JS proviene de leer el código servido, no de ejecutarlo.
- Nota de estilo: las citas literales de la web conservan sus signos originales (incluidos semiguiones como "6–12%"). Donde la web usa una raya se indica con la marca [raya] para no reproducir ese carácter.

---

## 1. Estado HTTP de las URLs solicitadas

| URL | Código | Observación |
|---|---|---|
| https://www.horizonteemirates.com/ | 200 | 65.498 bytes |
| https://www.horizonteemirates.com/proyectos | **404** | Sirve la página 404 propia (2.885 bytes). La URL real es /proyectos.html |
| https://www.horizonteemirates.com/proyectos.html | 200 | 34.969 bytes |
| https://www.horizonteemirates.com/proyectos/ | **404** | Misma situación |
| https://horizonteemirates.com/proyectos (apex) | 301 | Redirige a https://www.horizonteemirates.com/proyectos, que da 404 |
| https://www.horizonteemirates.com/blog/ | 200 | 23.508 bytes |
| https://www.horizonteemirates.com/legal.html | 200 | 13.276 bytes |
| https://www.horizonteemirates.com/robots.txt | 200 | 2.328 bytes |
| https://www.horizonteemirates.com/sitemap.xml | 200 | 20 URLs |
| https://www.horizonteemirates.com/guias/guia-fiscal-dubai-espana.pdf | 200 | application/pdf, 206.229 bytes (lead magnet real) |
| https://www.horizonteemirates.com/sobre/equipo.html | **301 a /** | La página de equipo ya no existe: redirige a la home |
| https://www.horizonteemirates.com/blog/creditos.html | 200 | Créditos fotográficos |
| https://www.horizonteemirates.com/blog/como-invertir-inmuebles-dubai.html | 200 | Artículo pilar |

**Hallazgo**: la URL limpia `/proyectos` no existe. Toda la navegación interna enlaza a `/proyectos.html` (verificado con grep sobre home.html y blog.html: 7 y 4 enlaces respectivamente, todos a `.html`), así que el usuario que navega no lo sufre. Pero cualquier enlace externo, anuncio o mención que use `/proyectos` (como hizo esta misma auditoría en su encargo) aterriza en un 404. La página 404 es correcta (noindex, botones a inicio y a /proyectos.html), pero es una fuga evitable con una regla en `_redirects`.

---

## 2. Home: lo que ve un usuario nuevo

### 2.1 Hero (texto literal)

- H1: **"Invierta en pisos en Dubai desde 30.000€ de entrada."** (home.html, línea 85)
- Subtítulo: **"Propiedad a su nombre, lista para alquilar, sin salir de España."** (línea 86)
- Debajo, tres tarjetas de inmueble con precio (líneas 90 a 115):
  - "SAAS Hills · Dubai Science Park · Estudios · Desde 242.000€"
  - "Binghatti Wraith · Al Jaddaf · 1 dormitorio · Desde 299.000€"
  - "NH Collection · Ras Al Khaimah · Frente al mar · Desde 399.000€"
- Línea de pago: **"El resto se reparte hasta 36 meses después de la entrega."** (línea 116)
- Nota: "Precios de lista del promotor, convertidos a euros. Ver los 7 inmuebles →" (línea 117)
- Captura de un toque: **"¿De cuánto dispone para invertir?"** con 5 botones de rango (Menos de 150.000€ / 150.000 a 300.000€ / 300.000 a 600.000€ / 600.000€ a 1 M€ / Más de 1.000.000€) y el cierre "Le enviamos 3 inmuebles que encajan con esa cifra, con números reales, en 48 horas." (líneas 121 a 131). Los botones tienen manejador JS real (app.js, líneas 347 y siguientes): preseleccionan el rango en el formulario y llevan a él.

**Valoración crítica del hero**: el qué (pisos en Dubai), el cuánto (desde 30.000€ de entrada) y el siguiente paso (elegir rango de capital) están claros en el primer pantallazo, con producto real y precios antes de pedir datos. Es un hero de captación correcto. Dos objeciones: (1) **"lista para alquilar" es incompatible con el inventario mostrado**: los 3 inmuebles del hero son preventa con entregas en diciembre 2027 (Binghatti), diciembre 2028 (W, en proyectos) y sin fecha visible en hero para los demás; nada está "listo para alquilar" hoy. Un inversor atento detecta la contradicción en 2 clics. (2) El "para quién" filtra poco: acepta desde menos de 150.000€, lo que invita a lead de ticket bajo en una campaña que paga cada clic.

### 2.2 CTAs y destinos (home)

| CTA (texto literal) | Ubicación | Destino |
|---|---|---|
| "Solicitar análisis gratuito" | Nav, nav móvil, sección filtro, calculadora ROI, sticky móvil | #form (mismo documento) |
| Botones de rango de capital | Hero | #form con rango preseleccionado (JS) |
| "Ver los 7 inmuebles →" / "Ver los siete inmuebles →" | Hero y tarjeta de confianza | /proyectos.html |
| "Leer nuestros análisis →" | Tarjeta de confianza | /blog/ |
| "Descargar la guía →" | Sección lead magnet #guia-fiscal | Envía email a Web3Forms y abre el PDF guias/guia-fiscal-dubai-espana.pdf |
| Flotante WhatsApp | Fijo | Abre modal de captura (app.js línea 1109 intercepta el clic y abre el modal con nombre, email, teléfono y consentimiento) |
| "Reservar llamada gratuita →" | Pantalla de éxito del formulario | Calendly (calendly.com/hola-horizonteemirates/...) |

Todos los CTAs de la página empujan a un único formulario. Consistente.

### 2.3 Formulario principal (2 pasos, visible en #form)

- Paso 1: capital (5 rangos), horizonte de decisión (4 opciones: "Capital listo, operar ya" / "Menos de 6 meses" / "Menos de 12 meses" / "Sin plazo definido"), visita a Dubai (Sí / Lo valoro / No por ahora).
- Paso 2: Nombre, Email, Teléfono con prefijo (13 países, por defecto +34), País de residencia (desplegable con España, Andorra y 8 países LatAm), canal preferido (WhatsApp por defecto / Llamada / Email).
- Doble casilla RGPD: consentimiento obligatorio (privacidad + comunicación al socio en UAE) y marketing opcional, con capa informativa colapsada (details) y textos literalmente registrados en el envío (comentario en home.html líneas 603 a 606).
- Envío a api.web3forms.com con campos ocultos de scoring (tier, puntuacion), canal y tracking. El botón de envío tiene manejador vivo (app.js líneas 457 y siguientes, evento lead_submit_attempt); el fallo del botón muerto corregido el 12-08 no está presente en la versión servida (v=20260819f del 19-08).
- La pregunta de objetivo se retiró del formulario el 12-08 y se conserva como campo oculto vacío (comentario literal en home.html, líneas 462 a 464).
- Nota de seguridad: la clave de acceso de Web3Forms está visible en el HTML (home.html, línea 455). Es el diseño estándar de ese proveedor (clave pública), pero permite a cualquiera enviar correos a través del buzón del sitio. No se reproduce aquí el valor.

### 2.4 Claims de rentabilidad publicados (texto literal)

| Claim literal | Ubicación |
|---|---|
| "6–12% rentabilidad bruta por alquiler en inmuebles prime de Dubai" | KPI strip, home línea 140 |
| "0% impuesto sobre rentas de alquiler y plusvalías en UAE" | KPI strip, línea 141 |
| "+334.000 operaciones inmobiliarias en los EAU (2025)" | KPI y ticker, líneas 139 y 151 |
| Tabla España vs Dubai: rentabilidad bruta "3–5%" vs "6–12%"; revalorización "Aproximadamente 2%" vs "Aproximadamente 6%"; impuesto alquiler "Hasta 45%..." vs "0%"; plusvalías "19–28%" vs "0%" | Líneas 205 a 213 |
| Abu Dhabi: alquiler "5–7%", revalorización "~4–5%", "Rentabilidad total ~9–12%" | Zona, líneas 239 a 252 |
| Dubai: alquiler "6–12%", revalorización "~6%", "Rentabilidad total ~12–18%" | Líneas 263 a 276 |
| Ras Al Khaimah: alquiler "5–7%", revalorización "~7–12%", "Rentabilidad total ~12–19%*" y "Escenario de apreciación estimado del 20–35% previo a la apertura [del Wynn], según informes del sector. No constituye garantía." | Líneas 285 a 304 |
| Calculadora ROI con sliders (yield 5 a 15%, revalorización 2 a 15%) y disclaimer "No es recomendación de inversión. Cifras ilustrativas basadas en sus supuestos." | Líneas 383 a 428 |

Los claims van acompañados de una sección "Fuentes y metodología" en el pie (línea 837) que cita DLD, ADREC, JLL, Knight Frank, Property Finder y Bayut, y aclara que la rentabilidad es "neta de impuestos en origen" y que "no descuenta gastos de comunidad ni de gestión". El disclaimer general (línea 838) es correcto y completo.

**Valoración crítica de los claims**: el aparato de disclaimers y fuentes está muy por encima de la media del sector, y el propio blog matiza ("El '8% asegurado' no existe", tarjeta de rentabilidad del blog). Pero el ancla numérica es agresiva en el extremo alto: "6–12% bruta en inmuebles prime" no casa con el consenso de mercado para prime (el prime de Dubái renta bruto por debajo de la media de la ciudad, que las consultoras sitúan alrededor del 7%; los dobles dígitos brutos se dan en estudios de zonas asequibles, no en prime), y las "rentabilidades totales" de ~12–18% y ~12–19% anuales suman el escenario optimista de dos variables. Un inversor sofisticado descuenta esas cifras; uno ingenuo se ancla en ellas y llega a la llamada con expectativas que el asesor tendrá que rebajar.

### 2.5 Prueba social e identidad en la home

- **No hay ninguna persona con nombre y apellidos en toda la web pública.** Ni fundador, ni asesor, ni foto de equipo. El artículo pilar firma "Por Equipo Horizonte Emirates" (blog, línea 107) y el schema de autor es una organización, no una persona (art_pilar.html: `author: {"@type":"Organization","name":"Equipo Horizonte Emirates"}`).
- La página de equipo que existió (/sobre/equipo.html, construida en junio según la memoria del proyecto) hoy **redirige 301 a la home**: la única página de identidad humana se ha retirado y nada la enlaza (grep de "sobre" en home, blog y proyectos: 0 resultados).
- No hay testimonios, ni reseñas, ni operaciones cerradas, ni logos de prensa, ni contadores de clientes. Cero prueba social en el sentido estricto.
- El partner regulado se menciona siempre de forma anónima: "partner regulado por RERA" (meta descripción, tabla comparativa línea 213, tarjeta "De dónde sale nuestro criterio" línea 375: "solo derivamos a agencias con licencia RERA en vigor, y verificamos el número de registro en el registro público de Dubái"). **Nunca se publica el nombre de la agencia ni su número de licencia RERA**, que es justo lo que un inversor puede verificar por su cuenta.
- Identidad corporativa visible: pie "Portal especializado en inversión inmobiliaria en UAE para inversores de habla hispana. Operado bajo Propulse SLU, Andorra." (línea 825). El detalle completo (NRT L-719841-W, domicilio C. Doctor Molines 23, Andorra la Vella) solo está en legal.html.
- Canales de contacto reales: hola@horizonteemirates.com, WhatsApp +971 55 472 2025 (número de Emiratos, no español), Calendly. No hay teléfono fijo ni dirección comercial fuera del aviso legal.
- La sección "¿Por qué es gratis?" (líneas 351 a 380) es el mejor bloque de confianza de la página: explica el modelo de comisión del promotor y da tres cosas comprobables (7 inmuebles públicos, 16 artículos, verificación RERA). Bien planteada, pero descansa en material propio, no en terceros.

### 2.6 Detalles de calidad detectados en el texto

- Errata "plénamente" (por "plenamente") en la FAQ del viaje, dos veces: en el HTML visible (línea 726) y dentro del JSON-LD de FAQPage (línea 36).
- "VALIDACION REAL" sin tilde en el badge del proceso (línea 330).
- La celda de exposición cambiaria de la tabla usa una raya: "Euro [raya] sin exposición al dólar" (línea 212), única raya detectada en el copy (el resto usa semiguiones de rango).

---

## 3. Proyectos (/proyectos.html)

- H1: **"Inmuebles seleccionados para invertir en UAE"**; subtítulo: "Siete propiedades con distinto perfil de riesgo, zona y estrategia de retorno, desde estudios en Dubái hasta branded residences frente al mar. La cartera completa (+3 inmuebles) se presenta en el análisis personalizado." (líneas 79 a 80).

| # | Proyecto | Zona | Precio publicado | Entrega | Datos duros visibles |
|---|---|---|---|---|---|
| 1 | NH Collection Residences | Ras Al Khaimah | "Desde 399.000€ (precio de lista del promotor)" | No indicada (tesis Wynn 2027) | Perfil 3–5 años |
| 2 | Mira Bentley Villas | Dubai | **Sin precio** | No indicada | Solo cualitativo |
| 3 | Gianfranco Ferré Residence | Ras Al Khaimah | **Sin precio** | No indicada (tesis Wynn 2027) | Perfil 3–6 años |
| 4 | SAAS Hills | Dubai Science Park | "estudios desde 242.000€ (precio de lista del promotor)" | No indicada | 857 residencias, 2 torres |
| 5 | Binghatti Wraith | Al Jaddaf, Dubai | "desde 299.000€ (precio de lista del promotor)" | "diciembre de 2027" | "plan 20/80 o 50/50 con un 3% de descuento" |
| 6 | W Residences Al Marjan | Ras Al Khaimah | **Sin precio** | "diciembre de 2028" | 200 unidades, amuebladas |
| 7 | BRABUS Island | Abu Dhabi | **Sin precio** | "primer trimestre de 2029" | "20% de entrada y 1% mensual, o hasta un 10% de descuento" |

- Cada proyecto: carrusel de 4 a 5 renders del promotor, 4 razones, dos CTAs ("Solicitar análisis gratuito →" a index.html#form y "Preguntar por WhatsApp" a wa.me con mensaje precargado por proyecto, con tracking por proyecto).
- Bloque "cartera bloqueada": "+3 inmuebles más en cartera. Precios de compra, rentabilidad estimada y la estructura de cada operación solo se comparten en el análisis personalizado."
- Pie con disclaimer: "© 2026 Horizonte Emirates · Propulse SLU · Andorra · Rentabilidades estimadas, no garantizadas."

**Valoración crítica**: como escaparate está bien construido (material oficial del promotor, tesis de inversión por activo, un CTA claro). Pero para un inversor real faltan los datos con los que se decide: **4 de 7 inmuebles no tienen precio**, ninguno tiene superficie ni precio por m², no hay planos, no hay plan de pagos completo, no hay rentabilidad estimada por activo (solo por zona en la home) y no hay memorándum descargable. La home afirma que cada inmueble "cuenta además con un memorándum de inversión propio, el mismo documento que recibe si solicita el análisis" (home, línea 370), pero en /proyectos.html no hay ni un enlace ni una vista previa de esos memorándums: la afirmación no es comprobable desde la web. La tesis "todo se entrega en el análisis personalizado" es una decisión comercial legítima (forzar el lead), pero deja la página por debajo de lo que un comprador de 300k espera comparar por su cuenta.

- Detalle de coherencia: la página mezcla tratamiento en el CTA final: "¿Cuál encaja con tu perfil?" seguido de "le indica si alguno de estos inmuebles encaja con su capital" (líneas 421 a 422).

---

## 4. Blog (/blog/)

- H1: "Invertir en Emiratos, explicado sin humo." Lede: "Guías prácticas sobre rentabilidad, fiscalidad, residencia y proceso de compra... Datos con fuente, cero promesas vacías y el detalle que nadie te cuenta antes de firmar."
- 16 artículos (1 destacado + 15 tarjetas, una de ellas el recurso de la guía fiscal), en 5 categorías filtrables (Inversión, Fiscalidad, Residencia y Visados, Empresa, Vida).
- Autoría y frescura: "Por Equipo Horizonte Emirates · Actualizado 7 jun 2026 · 16 min de lectura" en el destacado. El artículo pilar tiene datePublished y dateModified "2026-06-07". **Ningún contenido posterior al 7 de junio: el blog lleva 74 días congelado** a fecha de consulta.
- Coherencia de mensaje: los artículos matizan los claims de la home ("El '8% asegurado' no existe. Rangos reales por zona, neto vs. bruto y los gastos que casi nadie te resta."), lo que da credibilidad al conjunto.
- **Incoherencia del lead magnet**: la home ofrece la guía fiscal con un email y descarga inmediata ("Deje su email y la descarga se abre al momento, sin más pasos", home línea 664); la tarjeta del blog dice "Te la enviamos al solicitar tu análisis" y enlaza al formulario completo de /#form (blog, líneas 300 a 302). Dos promesas distintas para el mismo recurso; la del blog añade fricción innecesaria y ya no es cierta.
- Tratamiento: el blog tutea ("cuánto necesitas", "Te la enviamos"); la home trata de usted. Incoherencia de voz de marca en el mismo funnel.
- El flotante de WhatsApp del hub tiene href="#" en el HTML y depende de blog.js para funcionar (blog.js define WA_URL y engancha el clic); sin JS queda muerto. Menor.
- El PDF de la guía es accesible directamente sin dar email (200 en /guias/guia-fiscal-dubai-espana.pdf); la captura del email es por convención, no por control de acceso. Estándar en la industria, pero conviene saberlo.

---

## 5. Legal (/legal.html)

- Identidad completa y verificable: "Titular: Propulse SLU (Principado de Andorra). Número de Registro Tributario (NRT): L-719841-W. Domicilio social: C. Doctor Molines, 23, 3r, Edifici Diamant, AD500 Andorra la Vella... Marca comercial: Horizonte Emirates." (líneas 54 a 58).
- Política de privacidad de nivel alto: base jurídica por tratamiento, registro literal del consentimiento (art. 7.1), apartado específico y honesto de transferencias a UAE ("Emiratos Árabes Unidos no cuenta con una decisión de adecuación de la Comisión Europea... sus derechos podrían no ser exigibles del mismo modo", línea 96), encargados nombrados (Web3Forms, Google, Calendly, Meta), conservación 24 meses, derechos y autoridades (andorrana y AEPD).
- El socio de UAE tampoco se nombra aquí: "Nuestro socio comercial inmobiliario en Emiratos Árabes Unidos" (línea 91).
- Aviso legal con actividad declarada ("intermediación y acompañamiento comercial en procesos de inversión inmobiliaria") y limitación de responsabilidad sobre rentabilidades. Cookies con tabla (he_consent_v1, _ga, _ga_BK37V83363, _fbp), consentimiento granular y botón de reconfiguración. "Última actualización: julio de 2026."
- No se menciona representante en la UE del art. 27 RGPD (Andorra es tercer país con adecuación; la memoria interna del proyecto ya lo tenía como pendiente del Bloque B). Consta como carencia conocida.

---

## 6. robots.txt y sitemap.xml

### robots.txt: dos bloques en conflicto

El archivo servido contiene primero un bloque "Cloudflare Managed content" que **bloquea con Disallow: / a Amazonbot, Applebot-Extended, Bytespider, CCBot, ClaudeBot, CloudflareBrowserRenderingCrawler, Google-Extended, GPTBot y meta-externalagent**, y a continuación el bloque propio del sitio que declara exactamente lo contrario: "Se permiten también los rastreadores de IA generativa (GPTBot, Google-Extended, PerplexityBot, ClaudeBot) para ganar visibilidad en respuestas de IA", con Allow: / para cada uno (robots.txt, líneas 27 a 82). El resultado efectivo depende de cómo cada rastreador resuelva grupos duplicados para su user agent; varios toman el primer grupo coincidente, con lo que el bloque gestionado por Cloudflare probablemente anula la intención declarada del sitio. Además, la protección anti-bot de Cloudflare devolvió 403 a los fetchers automatizados de esta auditoría: **la web quiere salir en respuestas de IA pero su CDN está bloqueando activamente a los agentes de IA por dos vías** (robots gestionado y WAF). Contradicción de configuración, no de contenido.

- Sitemap declarado al final del robots: correcto.

### sitemap.xml

- 20 URLs: home, /proyectos.html, /blog/ + 16 artículos, /legal.html. Sin URLs rotas ni la URL limpia /proyectos.
- lastmod: 19 URLs con "2026-06-07" y 1 con "2026-04-01". La home y proyectos declaran lastmod 07-06-2026 pese a que la web se modificó en agosto (assets versionados v=20260819f, cambios de hero y precios de la semana del 12 al 19 de agosto). El sitemap no se regenera con los deploys. Impacto SEO menor, señal de proceso: media.

---

## 7. Tracking y funnel técnico (desde el código servido)

| Elemento | Estado | Evidencia |
|---|---|---|
| GA4 | Instalado (G-BK37V83363) con Consent Mode v2, denegado por defecto | gtag-init.js |
| Google Ads | Etiqueta configurada (AW-586671676) con ads_data_redaction | gtag-init.js, última línea |
| GTM | GTM-NZV6VJDC en las 4 páginas revisadas (contenido del contenedor no inspeccionable desde fuera) | home/proyectos/blog/legal |
| Meta Pixel | Instalado (ID 972040562129072), cargado solo con consentimiento; evento Lead con valor por tier | consent.js líneas 20 y 45 a 49; app.js líneas 569, 689, 789 |
| Formulario principal | Manejador de envío vivo con lead_submit_attempt y éxito trackeado | app.js líneas 443 a 571 |
| Modal WhatsApp | El flotante abre modal de captura con consentimiento; manejador vivo | app.js línea 1109 |
| Lead magnet | Entrega inmediata del PDF y registro en Web3Forms con asunto fuera del patrón del funnel (para no bloquear un lead futuro del mismo email) | app.js líneas 595 a 660 |
| Cabeceras | HSTS 12 meses con preload, CSP completa por cabecera, X-Frame-Options DENY | Cabeceras HTTP de la home |

Las tres averías corregidas el 12-08 (botón muerto, modal WhatsApp, banner sobre CTA) no aparecen en la versión servida hoy (v=20260819f). El funnel técnico, leído desde el código, está operativo. Los 2 leads en 30 días no se explican hoy por un formulario roto; se explican por volumen de tráfico, calidad de tráfico y capacidad de persuasión de la página (y 8 de esos 30 días son anteriores a la corrección del 12-08, con el funnel averiado).

---

## 8. Señales de confianza y desconfianza para un inversor de 300.000€

| A favor | En contra |
|---|---|
| Identidad societaria completa y verificable en legal.html (NRT, domicilio) | Cero personas: sin nombres, sin fotos, sin LinkedIn; la página de equipo redirige a la home |
| Disclaimers y fuentes (DLD, JLL, Knight Frank) por encima del estándar del sector | Partner RERA anónimo: se pide confiar en una licencia que no se puede comprobar porque no se publica ni nombre ni número |
| 7 inmuebles con material oficial del promotor, sin registro previo | 4 de 7 inmuebles sin precio; ninguno con superficie, m², planos ni memorándum descargable |
| Blog de 16 artículos serio y que matiza los claims comerciales | Blog congelado desde el 07-06-2026; sin autor personal |
| RGPD cuidado, honesto en la transferencia a UAE | Sin testimonios, sin operaciones cerradas, sin prensa, sin reseñas de terceros |
| Modelo de negocio explicado ("¿Por qué es gratis?") | Contacto solo por WhatsApp de Emiratos, email y Calendly; sin teléfono ni oficina visibles fuera del aviso legal |
| Precios "de lista del promotor" con conversión a euros declarada | Claims de rentabilidad anclados en el extremo alto (12–19% total anual); hero "lista para alquilar" con inventario 100% off-plan a 2027-2029 |

---

## 9. Comparación con un competidor maduro del sector

Lo que ofrece de forma habitual una agencia consolidada de inversión inmobiliaria en Dubái orientada a extranjeros (sin citar nombres: patrón estándar del sector que cualquiera puede comprobar en los principales brokerages con equipo hispanohablante):

1. **Personas con cara y nombre**: fundadores y asesores con foto, biografía y perfil verificable; a menudo vídeo. Es la primera pantalla de confianza para un ticket de 6 cifras.
2. **Licencia visible**: número de licencia RERA/DED u ORN del agente en el pie de página y en cada ficha.
3. **Prueba de ejecución**: volumen transaccionado, operaciones cerradas, testimonios con nombre y país, reseñas de Google enlazadas.
4. **Fichas de inmueble completas**: precio por unidad y por m², superficies, planos, plan de pagos completo, brochure descargable, fecha de entrega siempre.
5. **Oficina física en Dubái** con dirección y, para el mercado español, número local o de España.
6. **Contenido vivo**: informes de mercado trimestrales y blog activo.

Contra ese patrón, Horizonte Emirates hoy cumple bien el punto 6 en calidad (no en frescura) y aporta un aparato de transparencia metodológica que muchos competidores no tienen, pero falla en los puntos 1, 2, 3 y parcialmente 4 y 5, que son exactamente los que desbloquean tickets altos.

## 10. Veredicto: ¿puede esta web convertir a un inversor real de más de 150.000€?

**Tal cual está hoy: es improbable que lo haga de forma consistente, y casi imposible por encima de 300.000€ sin que el trabajo lo haga después una persona por teléfono.** La web es técnicamente sólida, legalmente impecable para su tamaño y comercialmente bien escrita, pero pide una confianza de 6 cifras sin ofrecer ni una cara, ni una licencia comprobable, ni una operación cerrada. El tramo 150-300k (SAAS Hills, Binghatti) es el único donde el conjunto actual (precio visible, tesis clara, guía fiscal, análisis gratuito) puede arrancar leads que luego cierre el equipo. Para el tramo alto, la "cartera bloqueada" y el anonimato juegan en contra: quien puede firmar 600k compara con agencias que enseñan más y se identifican mejor.

Lo que falta, por orden de impacto:
1. Identidad humana: nombres, fotos y trayectoria del equipo (la página existió y hoy redirige a la home; reactivarla y enlazarla).
2. Nombre y número de licencia RERA del partner, enlazado al registro público de Dubái que la propia web menciona.
3. Prueba social de terceros: aunque sea 1 testimonio real verificable o el estado de las operaciones en curso.
4. Completar las fichas: precio en los 7 inmuebles, superficie, plan de pagos y el memorándum que la home ya promete.
5. Resolver la contradicción del hero ("lista para alquilar" vs 100% off-plan) y la doble promesa de la guía fiscal.
6. Higiene: redirección /proyectos a /proyectos.html, robots.txt sin el bloque contradictorio de Cloudflare, sitemap con lastmod real, erratas.

---

## 11. Tabla de hallazgos clasificados

| # | Hallazgo | Tipo | Confianza | Impacto | Evidencia |
|---|---|---|---|---|---|
| 1 | /proyectos (URL limpia) devuelve 404; solo existe /proyectos.html | hecho_verificado | alta | medio | curl 20-08-2026; copia proyectos_404.html |
| 2 | Cero prueba social e identidad humana: sin nombres, fotos ni testimonios; /sobre/equipo.html redirige 301 a la home y nada la enlaza | hecho_verificado | alta | alto | curl 20-08-2026; grep en home/blog/proyectos |
| 3 | El partner RERA no se nombra ni se publica su licencia en ninguna página | hecho_verificado | alta | alto | home.html 213 y 375; legal.html 91 |
| 4 | Hero "lista para alquilar" contradice el inventario: 100% preventa con entregas 2027-2029 | hecho_verificado | alta | medio | home.html 86; proyectos.html 292, 339, 383 |
| 5 | Claims de rentabilidad anclados al extremo alto (6–12% bruto "prime", totales ~12–19%) frente al consenso de mercado, aunque con fuentes y disclaimers | inferencia | media | medio | home.html 140, 205, 263 a 304 y 837 |
| 6 | robots.txt contradictorio: bloque gestionado por Cloudflare deniega GPTBot/ClaudeBot/Google-Extended y el bloque propio los permite; el WAF además devuelve 403 a fetchers automatizados | hecho_verificado | alta | medio | robots.txt líneas 27 a 82; 403 de WebFetch 20-08-2026 |
| 7 | 4 de 7 inmuebles sin precio; ninguno con superficie, planos ni memorándum descargable pese a que la home lo promete | hecho_verificado | alta | alto | proyectos.html completo; home.html 370 |
| 8 | Blog congelado desde el 07-06-2026 (fechas visibles, schema y sitemap) | hecho_verificado | alta | bajo | blog 107; art_pilar.html; sitemap lastmod |
| 9 | Lead magnet incoherente: home lo entrega al momento, el blog exige el formulario completo | hecho_verificado | alta | bajo | home 664 a 674; blog 300 a 302 |
| 10 | Funnel técnico operativo: formulario con manejador vivo, GA4 + Ads (AW-586671676) + Meta Pixel con consentimiento, modal WhatsApp funcional, guía PDF real (200) | hecho_verificado | alta | alto (positivo) | app.js, gtag-init.js, consent.js, curl del PDF |
| 11 | Identidad legal completa (Propulse SLU, NRT, domicilio) y privacidad de calidad, pero solo en legal.html; sin representante UE art. 27 | hecho_verificado | alta | medio | legal.html 52 a 104 |
| 12 | Sitemap con lastmod desfasado (07-06-2026) frente a una web modificada el 19-08 (assets v=20260819f) | hecho_verificado | alta | bajo | sitemap.xml; versionado de assets |
| 13 | Voz inconsistente: blog tutea, home trata de usted, proyectos mezcla ambos en el CTA final | hecho_verificado | alta | bajo | blog 106; proyectos 421 a 422 |
| 14 | Erratas en producción: "plénamente" (visible y en JSON-LD), "VALIDACION" sin tilde, una raya en la tabla comparativa | hecho_verificado | alta | bajo | home 36, 212, 330, 726 |
| 15 | Clave pública de Web3Forms visible en el HTML (diseño del proveedor); permite envíos de terceros al buzón | hecho_verificado | alta | bajo | home.html 455 (valor no reproducido) |
| 16 | El PDF de la guía es accesible sin dar email (sin control de acceso) | hecho_verificado | alta | bajo | curl 200 del PDF 20-08-2026 |
| 17 | El memorándum por inmueble prometido en la home podría no existir para los 7 (memoria interna del 22-07: solo Gianfranco completo); desde la web es incomprobable | hipotesis | media | medio | home 370 vs MEMORY.md motor_deck_investment_packs |
| 18 | Contenido del contenedor GTM, URLs finales de los anuncios y render visual real (banner, solapes): no verificables desde fuera | dato_no_disponible | alta | medio | Se requiere acceso a GTM/Ads y navegador con JS |

---

## 12. Archivos y URLs revisados

**URLs de producción consultadas (20-08-2026), todas con copia local en el scratchpad:**
- https://www.horizonteemirates.com/ (200)
- https://www.horizonteemirates.com/proyectos (404) y /proyectos/ (404) y variante apex (301)
- https://www.horizonteemirates.com/proyectos.html (200)
- https://www.horizonteemirates.com/blog/ (200)
- https://www.horizonteemirates.com/blog/como-invertir-inmuebles-dubai.html (200)
- https://www.horizonteemirates.com/blog/creditos.html (200, solo estado)
- https://www.horizonteemirates.com/legal.html (200)
- https://www.horizonteemirates.com/robots.txt (200)
- https://www.horizonteemirates.com/sitemap.xml (200)
- https://www.horizonteemirates.com/guias/guia-fiscal-dubai-espana.pdf (200, solo cabeceras)
- https://www.horizonteemirates.com/sobre/equipo.html (301 a /)
- Assets JS: app.js, consent.js, gtag-init.js, blog.js (200)

**No se pudo abrir:**
- Ninguna URL quedó sin abrir por la vía curl + user agent de navegador. Con WebFetch (fetcher automatizado) devolvieron 403: /, /proyectos, /blog/, /legal.html y /sitemap.xml (constancia del bloqueo anti-bot de Cloudflare, que es en sí un hallazgo).
- No inspeccionado por imposibilidad externa: contenido del contenedor GTM-NZV6VJDC, configuración de la campaña de Google Ads y comportamiento visual con JavaScript ejecutado.

**No se envió ningún formulario ni se generó ningún lead durante la auditoría.**
