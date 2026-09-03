# Auditoría SEO integral: horizonteemirates.com

**Fecha:** 31 de agosto de 2026
**Alcance:** 29 páginas HTML en `web/public/`, de las cuales 20 indexables
**Método:** skill `seo-web-specialist` (auditoría completa, solo lectura)
**Commit auditado:** `e4c2cb4` (`main`, sincronizado con `origin`)
**Verificación en producción:** sí, contrastado con peticiones HTTP reales

> **No se ha modificado ningún archivo de `web/public/`.** Esta auditoría es de
> solo lectura. Los cambios propuestos están en `PLAN_ACCION_SEO_2026-08-31.md`
> y requieren aprobación explícita antes de aplicarse.

---

## 0. Estado tras la intervención del 31-ago-2026

Este informe se escribió con el sitio en su estado original. Ese mismo día se
aplicaron 8 de las acciones del plan. **El diagnóstico de las secciones 1 a 9 es
el de partida**; esta sección dice qué queda vivo.

| | Auditoría | Tras aplicar |
|---|---:|---:|
| Health Score | 68,4 | **77,4** |
| Nota | C | **B** |
| Fallos críticos | 2 | 2 (dependen del panel de Cloudflare) |
| Fallos altos | 7 | 4 |
| PASS / WARNING / FAIL | 36 / 14 / 16 | 44 / 12 / 11 |

| Categoría | Antes | Después |
|---|---:|---:|
| SEO técnico | 86,8 | 89,6 |
| Contenido | 52,1 | 61,0 |
| On-page | 65,0 | 84,8 |
| Schema | 78,8 | 78,8 |
| Performance | 83,3 | 83,3 |
| Imágenes | 61,8 | 90,0 |
| AI Search (GEO) | 27,3 | 40,9 |

### Aplicado

| Acción | Resultado verificado |
|---|---|
| P0.2 Dimensiones de imagen | 33 imágenes de `proyectos.html` con `width`/`height` reales leídos del WebP. Layout comprobado con Playwright: 0 px de diferencia en desktop y móvil |
| P1.3 Enlazado interno | Enlace contextual a `/proyectos.html` en los 16 artículos, más el CTA final. Ningún artículo queda ya sin enlaces contextuales entrantes |
| P1.4 Titles y metas | 20 titles de 44 a 60 caracteres, 20 meta descriptions de 115 a 141 |
| P2.1 Sitemap | `scripts/generar-sitemap.py`: recorre `public/`, excluye `noindex` y toma `lastmod` del último commit de cada archivo |
| P2.4 llms.txt | `scripts/generar-llms-txt.py`: se construye desde los `title` y `description` reales, con la política de uso declarada |
| P2.7 Guiones largos | 119 sustituidos por guion corto. Quedan 2, que son viñetas `content:"-"` de CSS en una página `noindex`: son diseño, no puntuación |
| B3 Open Graph | `legal.html` era la única indexable sin OG ni Twitter Card |
| B10 Errata | «plénamente» corregido en `index.html`, incluida su copia dentro del JSON-LD |
| P0.1 (mitad de código) | `robots.txt` reescrito con la política aprobada y `scripts/verificar-robots.py`, que falla mientras Cloudflare siga inyectando |

### Lo que sigue abierto y por qué

1. **Los 2 críticos** siguen exactamente igual: se resuelven en el panel de
   Cloudflare, no en el repositorio. El `robots.txt` del repo ya declara la
   política correcta, pero producción sigue sirviendo el bloque inyectado.
   `python scripts/verificar-robots.py` devuelve 3 fallos y seguirá haciéndolo
   hasta que se desactive.
2. **Autoría y fuentes** (A1, A2) esperan la decisión de negocio sobre qué
   credenciales del fundador y del partner se publican.
3. **Superficie de contenido** (A3) es el trabajo de fondo, no una corrección.

### Correcciones a este informe

Tres cosas que la auditoría estática no vio bien y que se comprobaron al aplicar
los cambios:

- **A6 estaba sobrevalorado.** Se clasificó como riesgo alto de CLS, pero el CSS
  ya fijaba `height: 380px` (260 px en móvil) con `object-fit: cover`, así que el
  espacio estaba reservado desde el primer render. Añadir `width`/`height` sigue
  mereciendo la pena (quita el aviso de Lighthouse y da robustez si el CSS
  tarda), pero el CLS real era menor. Reclasificado a severidad media.
- **A2 era más matizado.** Los 16 artículos sí tienen un bloque «Fuentes y
  metodología» que nombra a JLL, Knight Frank, Property Finder y Bayut. Lo que
  falta es el enlace, no la declaración de la fuente. El hallazgo sigue en pie,
  pero el punto de partida es mejor de lo que decía la sección 3.
- **A4 se enuncia con más precisión.** Había 3 enlaces a `/proyectos.html` desde
  cada artículo, pero todos sitewide: dos en el nav y uno en el footer. Lo que no
  existía era ni un solo enlace contextual desde el cuerpo.

### Hallazgos nuevos, encontrados al renderizar

- **`legal.html` desborda 142 px en móvil** (viewport de 390 px): una tabla de
  473 px sin contenedor con `overflow-x: auto`. Es preexistente, verificado
  contra producción, y no se ha tocado porque queda fuera de lo aprobado. El CSS
  del blog ya tiene la clase `table-wrap` que lo resolvería.
- **Archivo huérfano de 263 KB**:
  `assets/projects/mira-bentley-villas-dubai/fc5abbf2…_432cdae6da.jpg`, de
  2680x1496, no lo referencia ningún HTML, CSS ni JS. No se ha borrado: eliminar
  archivos excede lo aprobado.
- **La compresión de imágenes rinde poco.** De las 12 por encima de 200 KB, solo
  2 admitían mejora sin redimensionar ni cambiar de formato (58 KB en total).
  Los WebP ya estaban bien codificados. Para bajar de verdad habría que
  redimensionar, y eso exige revisar antes cada `srcset`.

---

## 1. Veredicto

| | |
|---|---|
| **SEO Health Score** | **68,4 / 100** |
| **Nota** | **C** (60-74) |
| Checks evaluados | 66 (36 PASS, 14 WARNING, 16 FAIL) |
| Fallos críticos | 2 |
| Fallos altos | 7 |

### Puntuación por categoría

| Categoría | Peso | Nota | Aporta | Lectura |
|---|---:|---:|---:|---|
| SEO técnico | 25% | 86,8 | 21,7 | Sólido, con un fallo grave ajeno al código |
| Calidad de contenido | 25% | 52,1 | 13,0 | **El cuello de botella real** |
| On-page | 20% | 65,0 | 13,0 | Metadatos sistemáticamente sobredimensionados |
| Schema | 10% | 78,8 | 7,9 | Bien construido, falta autoría |
| Performance | 10% | 83,3 | 8,3 | Buena base, detalles pendientes |
| Imágenes | 5% | 61,8 | 3,1 | Alt perfecto, dimensiones ausentes |
| AI Search (GEO) | 5% | 27,3 | 1,4 | **Bloqueado en origen sin saberlo** |

### Confirmación del diagnóstico previo

La auditoría estratégica del 20-ago-2026 concluyó que el stack **no** es un
cuello de botella para SEO y que el problema es superficie de contenido.
**Sigue siendo cierto.** El técnico puntúa 86,8 y el contenido 52,1. La brecha
está donde ya se dijo, y este informe la cuantifica: 20 URLs indexables frente
al objetivo de 80-120 fijado en `SEO_ESTRATEGIA.md`.

La única corrección al diagnóstico previo es el hallazgo C1: apareció un
problema técnico que **no existía en junio ni en agosto** porque no lo introdujo
el proyecto, sino la plataforma.

---

## 2. Hallazgos críticos

### C1. Cloudflare bloquea los rastreadores de IA, contradiciendo el robots.txt del repositorio

**Severidad: crítico · Categorías: técnico + GEO · Esfuerzo: 10 minutos**

El `robots.txt` que sirve producción **no es el del repositorio**. Cloudflare
inyecta un bloque gestionado por delante:

```
# BEGIN Cloudflare Managed content
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /

User-agent: ClaudeBot
Disallow: /
User-agent: GPTBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: Applebot-Extended
Disallow: /
User-agent: Amazonbot
Disallow: /
User-agent: Bytespider
Disallow: /
User-agent: meta-externalagent
Disallow: /
User-agent: CloudflareBrowserRenderingCrawler
Disallow: /
# END Cloudflare Managed Content
```

Y **debajo** aparece el archivo del repositorio, que dice justo lo contrario:

```
# Se permiten también los rastreadores de IA generativa
# (GPTBot, Google-Extended, PerplexityBot, ClaudeBot) para ganar visibilidad
# en respuestas de IA.
User-agent: GPTBot
Allow: /
```

Evidencia reproducible: `curl -s https://www.horizonteemirates.com/robots.txt`
devuelve 2.327 bytes; `web/public/robots.txt` en disco pesa 491 bytes.

**Por qué es crítico.** Es una contradicción declarada dentro del mismo archivo.
Aunque la RFC 9309 obliga a fusionar los grupos con el mismo `User-agent` y
Google resuelve el empate a favor de la regla menos restrictiva, **los
rastreadores de OpenAI, Anthropic y Perplexity usan parsers propios y el
comportamiento no está garantizado**. La estrategia GEO del proyecto, que es
explícita y está documentada, depende de un archivo que ahora mismo dice dos
cosas incompatibles.

Añadido: la señal `ai-train=no` es una reserva de derechos bajo el artículo 4 de
la Directiva europea 2019/790 que **el proyecto no ha decidido**. Viene del
ajuste por defecto de Cloudflare. Puede ser la decisión correcta, pero debe
tomarse conscientemente, no heredarse.

**Corrección:** en el panel de Cloudflare, dominio `horizonteemirates.com`, ir a
**AI Crawl Control** (o *Bots > Manage AI crawlers*) y desactivar el
`robots.txt` gestionado, o ajustar la política de crawlers de IA y de
`Content-Signal` a lo que el proyecto quiere de verdad. Verificar después con
`curl -s https://www.horizonteemirates.com/robots.txt | head -5`.

**Decisión del usuario, no ejecutable por Claude:** el cambio es en el panel de
Cloudflare, no en el código. Además exige tomar postura sobre si se permite el
entrenamiento de modelos con el contenido del sitio.

---

### C2. La política de crawlers de IA no coincide con la estrategia declarada

**Severidad: crítico · Categoría: GEO · Es la cara estratégica de C1**

`SEO_ESTRATEGIA.md` y el propio `robots.txt` apuestan por ganar visibilidad en
respuestas generativas. El contenido está preparado para ello y bien preparado:
los 16 artículos tienen bloque «Lo esencial en 30 segundos», tablas
comparativas, FAQ visible, índice y breadcrumbs. Es exactamente el formato que
los modelos citan.

Ese trabajo está hecho y ahora mismo puede no estar sirviendo para nada, porque
el sitio dice a los rastreadores de IA que no pasen.

---

## 3. Hallazgos de prioridad alta

### A1. Autoría genérica en contenido YMYL

Los 16 artículos firman como `Equipo Horizonte Emirates`, tipado como
`Organization` en el JSON-LD:

```json
"author": {"@type": "Organization", "name": "Equipo Horizonte Emirates"}
```

Este es un sitio de inversión y fiscalidad internacional: el estándar YMYL más
alto. Google evalúa experiencia y autoridad **de personas**, no de cajas.

Lo llamativo es que el proyecto **tiene los activos de autoridad y no los usa**:
Jesús Ibáñez Martínez como fundador y firma, y Marc Nonn (RRS International
Development, licencia RERA en Dubái) como partner de cierre. Son credenciales
reales, verificables y diferenciales frente a los competidores del benchmark.
Están fuera del sitio.

### A2. Cero enlaces salientes a las fuentes que el contenido cita

Los artículos mencionan Dubai Land Department (15 veces), RERA (66), Knight
Frank (9), Property Finder (6), Bayut (6) y el Convenio de Doble Imposición
(12). **No enlazan a ninguna.**

En todo el blog hay 0 enlaces salientes de autoridad. Los únicos enlaces
externos del sitio son 25 a Pexels (créditos de imagen), 11 a `wa.me`, 1 a
Calendly y 1 a `dubailand.gov.ae` desde la home.

Para YMYL esto es una carencia de primer orden: se afirman yields, umbrales
fiscales y marcos legales sin ruta de verificación. Para GEO es peor: un modelo
que no puede trazar la fuente no cita el contenido.

### A3. Superficie de contenido en 20 URLs

Objetivo de `SEO_ESTRATEGIA.md`: 80-120 URLs indexables. Estado real: 20. Los 24
clusters temáticos planificados están cubiertos en 5. No hay páginas de servicio
por ciudad (`/dubai`, `/abu-dhabi`, `/ras-al-khaimah`), y la segmentación
geográfica vive dentro de `proyectos.html` y de artículos sueltos.

Este hallazgo ya estaba diagnosticado en junio y en agosto. Se confirma vigente
y sin avance: los 16 artículos siguen con `datePublished` y `dateModified` en
2026-06-07, es decir, **casi tres meses sin publicar ni actualizar nada**.

### A4. La página comercial no recibe un solo enlace desde el blog

`/proyectos.html` es la única página transaccional del sitio. Los 16 artículos
enlazan entre sí y a la home (16 enlaces contextuales a `/`), pero **ninguno
enlaza a `/proyectos.html`**.

Se pierden dos cosas a la vez: autoridad interna hacia la página que debe
posicionar por consultas comerciales, y el camino natural del lector desde
«mejores zonas para invertir en Dubai» hasta los inmuebles reales de esas zonas.

Cuatro artículos quedan además sin enlaces contextuales entrantes:
`invertir-abu-dhabi`, `espana-vs-dubai-invertir`,
`comprar-propiedad-dubai-no-residente` y `vivir-en-dubai-espanol`. Los dos
primeros son de intención comercial alta.

### A5. Titles fuera de rango en 19 de las 20 páginas indexables

| Longitud | Página |
|---:|---|
| 92 | `/proyectos.html` |
| 91 | `/blog/comprar-sobre-plano-dubai.html` |
| 91 | `/blog/crear-empresa-en-dubai.html` |
| 89 | `/blog/invertir-abu-dhabi.html` |
| 88 | `/blog/vivir-en-dubai-espanol.html` |

El sufijo `| Horizonte Emirates` consume 21 caracteres de un presupuesto de ~60.
Google los truncará y en muchos casos reescribirá el title por su cuenta, con lo
que se pierde el control del mensaje en SERP. Añadido: Google ya muestra el
nombre del sitio a partir del dominio, así que el sufijo es redundante.

Solo `/index.html` (64) y `/blog/` (66) se acercan al rango.

### A6. Las 34 imágenes de `proyectos.html` sin `width`/`height`

```html
<img src="assets/projects/nh-collection-rak/c01.webp" alt="..." loading="lazy" />
```

Sin dimensiones declaradas el navegador no puede reservar el espacio, y con
`loading="lazy"` el desplazamiento acumulado es mayor. Es la causa más probable
de un CLS malo en la página comercial del sitio.

El resto del sitio no tiene este problema: las imágenes de blog y home sí
declaran dimensiones.

---

## 4. Lo que está bien y no hay que tocar

Conviene dejarlo escrito para que ninguna auditoría futura lo reabra:

| Área | Estado |
|---|---|
| Seguridad HTTP | HSTS 1 año con preload, CSP completa, XFO DENY, nosniff, Referrer-Policy, Permissions-Policy. Todo por `_headers`, fuente única |
| Entrega | Brotli, HTTP/3, `CF-Cache-Status: HIT`, cache immutable de un año en assets, `must-revalidate` en HTML |
| Canonicalización | Apex a www con 301, canonical correcto en las 20 indexables, sin enlaces rotos |
| Sitemap | Cobertura 20/20 exacta: ni sobra ni falta una URL |
| Alt text | 100% de las imágenes con alt descriptivo. 0 sin alt, 0 vacíos |
| JSON-LD | 0 errores de parseo en 29 páginas. BlogPosting, BreadcrumbList, RealEstateAgent, WebSite, ItemList con Residence |
| Estructura de contenido | H1 único en todas, jerarquía sin saltos, TOC, resumen de 30 s, tablas y FAQ en 16/16 artículos |
| LCP | Preload del hero con `srcset` de 3 anchos y `fetchpriority=high`, preload de la fuente del H1, `font-display: swap` en las 18 `@font-face` |
| Renderizado | HTML estático, sin dependencia de JS para el contenido |

### `noindex` intencionales verificados (no son hallazgos)

- `inversion-fraccionada-dubai.html`: `noindex,nofollow` a la espera de due
  diligence legal.
- `guias/guia-fiscal-*.html` (3 archivos): `noindex,follow` para no canibalizar
  el artículo pilar de fiscalidad.
- `guias/preview-*.html` (3 archivos): maquetas internas de aprobación.
- `blog/creditos.html` y `404.html`.

### Hreflang

`es` + `x-default` autorreferencial en las 18 páginas que lo llevan. Es
coherente con un sitio monolingüe. **No es una implementación incompleta** y no
debe «completarse» con idiomas que no existen.

---

## 5. Hallazgos de prioridad media

| # | Hallazgo | Evidencia |
|---|---|---|
| M1 | `sitemap.xml` con `lastmod` obsoleto | Todo en 2026-06-07 (y `legal.html` en 2026-04-01) cuando `index.html` y `proyectos.html` se tocaron el 2026-08-24. Ya avisado en `SEO_ESTRATEGIA.md`: el sitemap es estático y se desactualiza |
| M2 | `dateModified` congelado | Los 16 artículos en 2026-06-07, varios con «(2026)» en el title y datos de mercado que envejecen |
| M3 | Meta descriptions largas | 19 de 20 superan 160 caracteres; la de `residencia-fiscal-emiratos-espanoles.html` llega a 210 |
| M4 | Sin `sameAs` en ninguna página | 0 en todo el sitio. Ninguna vinculación a perfiles externos que valide la entidad |
| M5 | Sin `llms.txt` | Devuelve 404 |
| M6 | Scripts bloqueantes en `<head>` | `gtag-init.js` y `gtm-init.js` sin `defer` ni `async`. Son pequeños (1,1 y 1,2 KB) pero bloquean el parseo |
| M7 | CSS render-blocking sin minificar | 3 hojas, 69 KB en la home (`home.css` son 60 KB) |
| M8 | 12 imágenes por encima de 200 KB | El mapa de `mejores-zonas-invertir-dubai` pesa 409 KB |
| M9 | `proyectos.html` sin encabezados de ficha | 9 `h2` y 0 `h3` para 34 imágenes y 8 proyectos: las fichas no tienen estructura semántica propia |

---

## 6. Hallazgos de prioridad baja

| # | Hallazgo |
|---|---|
| B1 | 121 guiones largos tipo en-dash (`–`) en el HTML publicado: 31 en `index.html`, 28 en `preview-zonas-inversion.html`. El commit `e4c2cb4` eliminó los em-dash (`—`), pero el check documentado en `CLAUDE.md §6` es `grep -c "—"`, que **no detecta el en-dash**. La verificación tiene un agujero. Los guiones que aparecen en este informe y en el plan de acción son deliberados: se citan como el objeto del hallazgo, no como puntuación |
| B2 | `/index.html` y `/blog/index.html` responden 200 además de `/` y `/blog/`. El canonical lo resuelve, pero son URLs duplicadas accesibles |
| B3 | `legal.html` sin Open Graph ni Twitter Card (única indexable sin ellos) |
| B4 | `RealEstateAgent` sin `telephone`, `address` propio ni `sameAs` |
| B5 | `BlogPosting` sin `about`, `citation` ni `wordCount` |
| B6 | Assets versionados con querystring (`?v=20260819f`) en vez de fingerprint en el nombre. Ya identificado como F12 en `_headers` |
| B7 | Mezcla de rutas relativas (`blog/`) y absolutas (`/proyectos.html`) en el enlazado interno |
| B8 | Tres maquetas `preview-*.html` publicadas en producción. Están en `noindex,nofollow`, pero son borradores accesibles |
| B9 | `FAQPage` en 17 páginas: sin rich results desde agosto de 2023 fuera de sitios gubernamentales y sanitarios. **No perjudica** y sigue siendo útil para citación por IA. No retirar, solo no esperar resultados enriquecidos de ahí |
| B10 | Errata «plénamente» por «plenamente» en `index.html`, presente además dentro del JSON-LD de FAQPage |

---

## 7. Core Web Vitals: no medidos

**No hay datos.** La API de PageSpeed Insights devolvió cuota diaria agotada y
no hay Lighthouse instalado en el entorno. No hay datos de campo (CrUX)
disponibles sin clave de API.

Lo que sí se puede afirmar por análisis de código y de cabeceras:

- **LCP:** bien preparado. Preload con `srcset`, `fetchpriority=high`, fuente del
  H1 precargada, Brotli, CDN. HTML de la home en 16,5 KB comprimido.
- **CLS:** riesgo concreto y localizado en `proyectos.html` (hallazgo A6). El
  resto del sitio declara dimensiones.
- **INP:** `app.js` son 52 KB sin minificar pero con `defer`. Sin medición real
  no se puede concluir nada.

**Siguiente paso para cerrar esto:** medir con PageSpeed Insights mañana (la
cuota se renueva a diario) sobre `/`, `/proyectos.html` y un artículo, o
habilitar el informe de Core Web Vitals de Search Console si hay datos de campo
suficientes.

---

## 8. Metodología y trazabilidad

- **Rastreo:** análisis estático de los 29 HTML de `web/public/` con BeautifulSoup
  + lxml, más 14 peticiones HTTP reales a producción para contrastar códigos de
  estado, redirecciones y cabeceras.
- **Scoring:** cada check puntúa PASS 1,0 / WARNING 0,5 / FAIL 0,0, multiplicado
  por severidad (crítico ×5, alto ×2,5, medio ×1,5, bajo ×0,5) y por el peso de
  su categoría. Los 66 checks y sus veredictos son reproducibles.
- **Sin datos inventados:** no se reportan volúmenes de búsqueda, posiciones,
  backlinks ni tráfico. Los CWV se declaran no medidos en lugar de estimarse.
- **Guardrails aplicados:** `noindex` intencionales y hreflang monolingüe
  verificados contra `references/20-horizonte-emirates.md` y no reportados como
  errores.

## 9. Documentos relacionados

- `PLAN_ACCION_SEO_2026-08-31.md`: plan priorizado con esfuerzo y responsable
- `INVENTARIO_URLS_2026-08-31.csv`: las 29 URLs clasificadas por tipo,
  intención, etapa de funnel, keyword objetivo y acción recomendada
- `../SEO_ESTRATEGIA.md`: los 24 clusters y el plan de contenidos a 12 meses
- `../../_AUDITORIA_ESTRATEGICA_HE/2026-08-20/`: auditoría estratégica y
  benchmark de 8 competidores
