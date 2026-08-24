# 00 · Inventario y evidencias

**Auditoría integral Horizonte Emirates · 20-08-2026**
Carpeta de trabajo: `_AUDITORIA_ESTRATEGICA_HE\2026-08-20\`
Modo de trabajo: solo lectura sobre todo el contenido existente. Los únicos archivos creados son los de esta carpeta.

---

## 1. Perímetro auditado

| Fuente | Contenido | Estado |
|---|---|---|
| Repositorio local `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates` | 226 archivos relevantes (excluidos node_modules, .git, .wrangler) | Inventariado completo en `_evidencias\inventario_repo.csv` (ruta, KB, fecha) |
| Drive `G:\Mi unidad\Horizonte Emirates\` | Estado del proyecto (01 a 09c), diario, contratos, LEGAL, packs, LinkedIn, Blog, CRM | Inventariado y leído lo relevante (detalle por área) |
| Google Sheets "HE CRM - Leads" | CRM real del proyecto (hojas Leads y Cola) | Leído en vivo el 20-08 |
| Gmail (hola@horizonteemirates.com / civcomercial2010@gmail.com) | Avisos Web3Forms, hilos con los 2 leads, hilos con Dayvo, hilos con RRS, informes del guardián | Consultado en vivo el 20-08 (solo lectura) |
| Web en producción https://www.horizonteemirates.com | Home, proyectos, blog, legal, robots, sitemap, guía PDF, assets JS | Descargada el 20-08; copias en `_evidencias\web_capturas\` |
| Internet (competencia) | Barrido de 20+ webs del sector en español | Perfiles en `_evidencias\competidores\` |

## 2. Composición del repositorio (226 archivos)

| Carpeta | Archivos | Naturaleza |
|---|---|---|
| public\ | 145 | Web completa: 34 HTML (home, proyectos, 18 de blog, 6 guías, legal, 404), assets JS/CSS, 57 webp, fuentes |
| tools\ | 20 | Generadores de correos manuales (3 variantes) y copys |
| contenido-blog\ | 19 | Fuentes .md de los 16 artículos + README editorial |
| automation\ | 11 | 6 .gs de Apps Script (funnel, guardián, matching, Telegram) + kit de mails manuales |
| docs\ | 9 | SEO, tracking, seguridad, deliverability, auditorías técnicas |
| scripts\ | 4 | Build del generador móvil, favicons, PDF de la guía |
| Analytics\ | 2 | Documentación GA4 |
| Raíz | varios | ROADMAP_AUDITORIA.md, AUDITORIA_INTEGRAL_2026-06-12.md, README, wrangler.jsonc |

## 3. Mapa de evidencias de esta auditoría

Cada área tiene un archivo de evidencia autosuficiente en `_evidencias\` con hallazgos clasificados (hecho_verificado / inferencia / hipotesis / dato_no_disponible), confianza e impacto, y la lista de archivos revisados y no abiertos:

| Evidencia | Área | Fuentes principales |
|---|---|---|
| 01_web_codigo.md | Código de la web y conversión | public\ completo, _headers, _redirects, wrangler, historial git |
| 02_automatizacion_funnel.md | Automatización, funnel y proceso comercial | automation\ completo (2.219 líneas del motor), tools\, SETUP, MAILS-MANUALES |
| 03_estrategia_estado.md | Estrategia, modelo de negocio, estado | business plan, 01 a 05 y 08 de Drive, ROADMAP, auditoría 12-06 |
| 04_ads_analitica.md | Google Ads, GA4, medición | 04_metricas, 05_funnel, Analytics\, TRACKING_EVENTS, código de medición, git |
| 05_diario_cronologia.md | Cronología y esfuerzo | 07_diario.md íntegro (1.920 líneas, 50 entradas) |
| 06_contratos_legal.md | Contratos y protección | 06_contrato_rrs, Referral refundido, Anexos I y II, LEGAL\, Gmail |
| 07_oferta_inmobiliaria.md | Oferta y material comercial | 12 carpetas de promotor (3,8 GB), 8 Datos.xlsx de packs, motor generar_deck.py, proyectos.html |
| 08_seo_contenido.md | SEO, contenido, LinkedIn, autoridad | SEO_ESTRATEGIA, 16 artículos, guías, 09/09b/09c LinkedIn, secuencias email |
| 09_web_en_vivo.md | Web en producción | 13 URLs consultadas en vivo con copias archivadas |
| 10_crm_leads_gmail.md | CRM real, leads y Ads en vivo | Sheet del CRM, Gmail (leads, Dayvo, guardián) |
| competidores\ | Benchmark | Perfiles individuales con URLs y fechas |
| web_capturas\ | Copias de la web servida el 20-08 | 12 archivos |

## 4. Estado de revisión: qué se leyó y qué no

**Leído íntegro o en profundidad:** toda la web pública (código y producción), los 6 .gs de automatización, el kit de mails manuales, el business plan, los 8 archivos de estado de Drive (01 a 08), el diario completo, el contrato RRS y sus anexos (incluidos los PDF firmados de LEGAL\), los 8 Datos.xlsx de los packs, el motor de generación de packs, la estrategia SEO, 4 artículos de muestra más el inventario de los 16, los 3 documentos de LinkedIn (por índice y secciones clave), el CRM en vivo y los hilos de Gmail relevantes (leads, Dayvo, RRS, guardián).

**No abierto o no verificable (consolidado; detalle en cada evidencia y en 06_DATOS_FALTANTES.md):**

1. Proyecto real de Google Apps Script (código pegado y triggers): el despliegue es por copia-pega, el repo no garantiza lo que corre en producción.
2. Interfaces de Google Ads, GA4, GTM y Search Console: sin acceso; `ads-export\` de Drive está VACÍA (0 archivos).
3. Adjuntos PDF de Gmail (contrato contrafirmado del 27-07): el conector no descarga adjuntos; es el documento más importante sin verificar.
4. PDFs de promotor y los 10 PDF de memorándum generados (contenido reconstruido desde sus fuentes de datos).
5. `Blog\24 artículos completos con toda la documentación SEO.gdoc` (formato .gdoc no legible en local).
6. `.docx` de los anexos (se asume idéntico al PDF), panel de Web3Forms, estado real de la cuenta de LinkedIn.
7. Copias históricas del diario en `_ARCHIVO\` (redundantes por diseño).
8. Renders y vídeos de promotor (inventariados por nombre y tamaño, no abiertos).

## 5. Duplicados, contradicciones y documentos obsoletos detectados

| # | Contradicción o problema documental | Dónde |
|---|---|---|
| 1 | El business plan sigue proponiendo 4% con trigger SPA, marcas descartadas y Webflow: obsoleto y nunca reconciliado con la realidad (3%, un proyecto, trigger tardío) | business-plan-horizonte-dubai.html vs 06_contrato_rrs.md |
| 2 | `02_tareas.md` (12-08) trata la contrafirma del contrato como pendiente cuando el buzón demuestra que se envió el 27-07: la fuente de verdad interna está desincronizada con la realidad | Evidencia 06, sección 1 |
| 3 | Tres escalas de scoring conviven: web (10 pts, A≥6), generadores de correos (13 pts, A≥9) y documentación (obsoleta) | Evidencia 02, hallazgo 5.6 |
| 4 | ROADMAP da M06 (conversión única en Ads) por cerrada el 21-07; 04_metricas.md del 09-08 atribuye el doble conteo a "M06 sin cerrar" | Evidencia 04, sección 4.3 |
| 5 | `02_tareas.md` da el guardián por no pegado en Apps Script; los informes reales en Gmail demuestran que corre cada 2 días desde el 22-07 | Evidencias 02 y 10 |
| 6 | M15-CONSENT figura como pendiente cuando la casilla de cesión está en producción desde el 27-07 | Evidencia 06, sección 6 |
| 7 | El mismo inmueble tiene 2 precios "de lista" (web vs pack) por usar tipos de cambio distintos | Evidencia 07, sección 5.4 |
| 8 | La guía fiscal se entrega en la home con solo un email y el blog promete entregarla "al solicitar tu análisis" con el formulario completo | Evidencia 09, sección 4 |
| 9 | El diario (registro de sustancia económica) está parado desde el 30-07: las 3 semanas más críticas del proyecto no tienen registro | Evidencia 05, sección 2 |
| 10 | robots.txt contradictorio: el bloque gestionado de Cloudflare bloquea los rastreadores de IA que el bloque propio del sitio declara permitir | Evidencia 09, sección 6 |
| 11 | Guía fiscal v2 (completa y ejecutiva) generadas y sin usar: se sigue entregando la v1 | Evidencia 08, sección 9 |
| 12 | Plantillas automáticas de email pausadas con cifras no conformes ("7-8% neto") frente a la regla vigente (6-12% bruto, nunca neto) | Evidencia 02, hallazgo 5.9 |

## 6. Datos sensibles detectados (no reproducidos en los entregables)

- Datos bancarios de Propulse SLU (IBAN/BIC de Wise) transcritos en `06_contrato_rrs.md` y en el Referral refundido.
- Firma manuscrita en `LEGAL\Envio RRS 2026-07-27\ANNEX II - Data Protection.pdf`.
- Nombre, email y teléfono de un lead real en `04_metricas.md` (líneas 150-151).
- Access key pública de Web3Forms en el HTML (pública por diseño del proveedor).
- Token de Telegram: no está en el repo (Script Properties); un token antiguo expuesto fue rotado el 04-06 según el diario.

## 7. Advertencia metodológica

Los 3 regímenes de medición del periodo auditado (eventos de embudo falsos hasta el 12-08, CSP bloqueando parte de GA4/Ads hasta el 19-08 a las 17:01, todo corregido después) obligan a tratar CUALQUIER métrica web del 20-07 al 19-08 como infraestimada en proporción desconocida. Los recuentos de leads NO se ven afectados: proceden de Gmail y del CRM, verificados en vivo. Detalle completo en `_evidencias\04_ads_analitica.md`.
