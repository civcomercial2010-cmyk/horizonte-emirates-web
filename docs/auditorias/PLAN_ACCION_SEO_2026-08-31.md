# Plan de acción SEO: horizonteemirates.com

**Fecha:** 31 de agosto de 2026
**Base:** `AUDITORIA_SEO_2026-08-31.md` (Health Score 68,4 / 100, nota C)
**Estado:** aprobado y aplicado en parte el 31-ago-2026.

| Estado | Acciones |
|---|---|
| **Hecho** | P0.2, P1.3, P1.4, P2.1, P2.4, P2.7, B3, B10, y la mitad de código de P0.1 |
| **Bloqueado en el panel** | P0.1: desactivar el `robots.txt` gestionado de Cloudflare |
| **Espera decisión de negocio** | P1.1 (qué credenciales se publican), P1.2 (encadena con P2.2) |
| **Sin empezar** | P2.2, P2.3, P2.5 parcial, P2.6, P2.8, todo P3 |

Score: 68,4 (C) el 31-ago por la mañana, **77,4 (B)** tras aplicar. Detalle en
`AUDITORIA_SEO_2026-08-31.md` sección 0.

---

## Cómo leer este plan

Cada acción lleva evidencia (por qué), impacto, esfuerzo, riesgo y quién la
ejecuta. La columna **Ejecuta** distingue lo que Claude puede hacer en el
repositorio de lo que exige una decisión o un acceso externo.

Prioridades: **P0** inmediato · **P1** esta semana · **P2** este mes · **P3** backlog.

---

## P0: inmediato

### P0.1 · Desbloquear los rastreadores de IA en Cloudflare

| | |
|---|---|
| **Evidencia** | `curl -s https://www.horizonteemirates.com/robots.txt` devuelve 2.327 bytes con `Disallow: /` para GPTBot, ClaudeBot, Google-Extended, CCBot y 5 bots más. El archivo del repositorio (491 bytes) dice `Allow: /` para los mismos. Producción sirve las dos reglas contradictorias |
| **Impacto** | Alto. Toda la estrategia GEO depende de esto. El contenido ya está en formato citable (resumen de 30 s, tablas, FAQ en 16/16 artículos) y ese trabajo puede no estar sirviendo para nada |
| **Esfuerzo** | 10 minutos |
| **Riesgo de actuar** | Bajo. Permitir el rastreo de IA expone contenido ya público |
| **Riesgo de no actuar** | Alto. Invisibilidad en ChatGPT, Perplexity, Claude y AI Overviews, con el trabajo de citabilidad ya pagado |
| **Ejecuta** | **Usuario.** Panel de Cloudflare, no código |

**Pasos:** Cloudflare > `horizonteemirates.com` > **AI Crawl Control** (o *Bots >
Manage AI crawlers*) > desactivar el `robots.txt` gestionado o ajustar la
política. Verificar después:

```bash
curl -s https://www.horizonteemirates.com/robots.txt | head -5
```

**Decisión previa que hay que tomar:** la señal `ai-train=no` que Cloudflare
inyecta es una reserva de derechos bajo la Directiva europea 2019/790. Ahora
mismo está activa por defecto, no por decisión del proyecto. Hay tres posturas
razonables:

1. Permitir rastreo y entrenamiento (`search=yes, ai-input=yes, ai-train=yes`):
   máxima visibilidad en IA.
2. Permitir rastreo pero no entrenamiento (`ai-input=yes, ai-train=no`):
   citación sí, entrenamiento no. **Es la opción recomendada**: aparecer en
   respuestas generativas sin ceder el corpus.
3. Mantener el bloqueo actual: coherente solo si se abandona la estrategia GEO,
   en cuyo caso hay que corregir `robots.txt` y `SEO_ESTRATEGIA.md` para que
   dejen de decir lo contrario.

**En cualquiera de los tres casos**, el `robots.txt` del repositorio debe quedar
alineado con lo que Cloudflare sirva. Hoy el sitio se contradice a sí mismo.

---

### P0.2 · Dimensiones en las imágenes de `proyectos.html`: HECHO

> Aplicado el 31-ago-2026: 33 imágenes con `width`/`height` reales leídos del
> WebP (la 34.ª es el lightbox, con `src` vacío por diseño). Layout verificado
> con Playwright: 0 px de diferencia en desktop y móvil. Ojo: el CSS ya fijaba
> `height: 380px`, así que el CLS real era menor de lo que decía la auditoría.

| | |
|---|---|
| **Evidencia** | Las 34 `<img>` de la página comercial llevan `loading="lazy"` sin `width` ni `height`. El resto del sitio sí las declara |
| **Impacto** | Alto. CLS en la única página transaccional del sitio |
| **Esfuerzo** | 30 minutos (leer dimensiones reales de cada WebP y escribirlas) |
| **Riesgo** | Bajo. Con la relación de aspecto correcta no cambia nada visualmente. Se verifica con captura antes/después |
| **Ejecuta** | Claude, con aprobación |

---

## P1: esta semana

### P1.1 · Autoría real en contenido YMYL

| | |
|---|---|
| **Evidencia** | Los 16 artículos firman `{"@type":"Organization","name":"Equipo Horizonte Emirates"}`. Cero `sameAs` en todo el sitio |
| **Impacto** | Alto. Es la palanca E-E-A-T de mayor recorrido en un sitio de inversión y fiscalidad |
| **Esfuerzo** | 3 a 4 horas |
| **Riesgo** | Bajo en lo técnico. Exige decisión de negocio: exponer nombre y credenciales |
| **Ejecuta** | Claude implementa; **el usuario decide qué credenciales se publican** |

**Alcance propuesto:**

1. `author` pasa a `Person` (Jesús Ibáñez Martínez) con `sameAs` a LinkedIn y
   `jobTitle`, sustituyendo a `Organization` en los 16 `BlogPosting`.
2. Bloque de autor visible al final del artículo, con foto, cargo y una línea de
   experiencia verificable.
3. Página `/sobre` con la ficha del fundador y del partner de cierre (Marc Nonn,
   RRS International Development, licencia RERA en Dubái), con `Person` +
   `Organization` en JSON-LD y enlace a la verificación pública de la licencia.
4. `sameAs` en el `RealEstateAgent` de la home, más `telephone` y `address`.

**Nota:** la ruta `/sobre/equipo.html` se retiró en junio de 2026 y tiene un 301
a `/` en `_redirects` (documentado en `.claude/napkin.md`). Si se recupera una
página de equipo hay que retirar ese redirect, no ignorarlo.

---

### P1.2 · Enlazar las fuentes que el contenido ya cita

| | |
|---|---|
| **Evidencia** | 66 menciones a RERA, 15 a Dubai Land Department, 9 a Knight Frank, 12 al Convenio de Doble Imposición. **0 enlaces salientes de autoridad en todo el blog** |
| **Impacto** | Alto. E-E-A-T en YMYL y citabilidad por modelos de IA, que necesitan trazar la fuente |
| **Esfuerzo** | 4 horas para los 16 artículos |
| **Riesgo** | Bajo |
| **Ejecuta** | Claude, con aprobación |

**Prioridad dentro de la acción**, por riesgo de dato no verificable:

1. `modelo-720-declarar-inmueble-dubai` → sede electrónica de la AEAT y orden del modelo.
2. `impuestos-invertir-dubai-espana` → Convenio de Doble Imposición España-EAU en el BOE.
3. `rentabilidad-inmobiliaria-dubai` → fuente de los yields (DLD, Property Monitor o Bayut) **con fecha del dato**.
4. `golden-visa-emiratos-guia` → portal oficial u.ae / ICP para los umbrales.
5. Resto de artículos.

Añadir `citation` al `BlogPosting` de los artículos que citen normativa.

> Aplica la regla del proyecto: ningún dato fiscal o de rentabilidad se publica
> sin confirmar contra la fuente. Si al enlazar aparece que un dato está
> desactualizado, se corrige el dato, no se enlaza y se deja.

---

### P1.3 · Enlaces contextuales del blog a `/proyectos.html`: HECHO

> Aplicado el 31-ago-2026: párrafo de cierre a medida en los 16 artículos, antes
> de las FAQ, más el botón secundario del CTA final. Los 4 artículos huérfanos
> pasan de 0 a 2 enlaces contextuales entrantes.

| | |
|---|---|
| **Evidencia** | 16 artículos, 16 enlaces contextuales a `/`, **0 a `/proyectos.html`**. Cuatro artículos sin enlaces entrantes: `invertir-abu-dhabi`, `espana-vs-dubai-invertir`, `comprar-propiedad-dubai-no-residente`, `vivir-en-dubai-espanol` |
| **Impacto** | Alto. Autoridad interna hacia la página transaccional y camino de conversión desde el contenido |
| **Esfuerzo** | 2 horas |
| **Riesgo** | Bajo |
| **Ejecuta** | Claude, con aprobación |

**Reglas:** un enlace contextual a `/proyectos.html` por artículo, anclado en
texto natural, colocado donde el lector ya está pensando en inmuebles concretos.
Enlaces por zona: `mejores-zonas-invertir-dubai` y `invertir-ras-al-khaimah`
apuntan a las anclas de proyecto correspondientes (`#nh-collection`,
`#mira-bentley`). Y dar 2 o 3 enlaces entrantes a los cuatro artículos
huérfanos, priorizando los dos de intención comercial.

---

### P1.4 · Recortar los titles a 60 caracteres: HECHO

> Aplicado el 31-ago-2026: 20 titles entre 44 y 60, 20 meta descriptions entre
> 115 y 141. No se tocaron `og:title` ni `twitter:title`: en redes sociales la
> marca sí cabe y suma.

| | |
|---|---|
| **Evidencia** | 19 de 20 indexables superan 60. Máximo: 92 en `/proyectos.html` |
| **Impacto** | Medio-alto. CTR en SERP y control del mensaje |
| **Esfuerzo** | 1 hora |
| **Riesgo** | Bajo |
| **Ejecuta** | Claude, con aprobación |

Retirar el sufijo `| Horizonte Emirates` de las páginas donde el title ya llega
al límite: Google muestra el nombre del sitio a partir del dominio. Mantenerlo
solo en la home y en `/blog/`, que caben.

Ejemplos:

| Actual | Propuesto |
|---|---|
| `Pisos y apartamentos para invertir en Dubai, Abu Dhabi y Ras Al Khaimah \| Horizonte Emirates` (92) | `Pisos para invertir en Dubai, Abu Dhabi y Ras Al Khaimah` (55) |
| `Comprar sobre plano en Dubai: cómo funciona y qué riesgos tiene (2026) \| Horizonte Emirates` (91) | `Comprar sobre plano en Dubai: cómo funciona y riesgos` (52) |
| `Rentabilidad inmobiliaria en Dubai: yields reales por zona (2026) \| Horizonte Emirates` (86) | `Rentabilidad inmobiliaria en Dubai: yields por zona 2026` (55) |

En la misma pasada, recortar las 19 meta descriptions a 150-155 caracteres.

---

## P2: este mes

### P2.1 · Sitemap generado, no escrito a mano: HECHO

> `scripts/generar-sitemap.py`. Admite `--check` para usarlo antes de desplegar.

`lastmod` sigue en 2026-06-07 para páginas tocadas el 24 de agosto.
`SEO_ESTRATEGIA.md` ya avisó de que el sitemap estático se desactualizaría.

Script en `scripts/` que recorra `public/`, excluya lo que esté en `noindex` y
tome `lastmod` de la fecha del último commit que tocó cada archivo. Ejecutar
antes de cada despliegue.
**Esfuerzo:** 2 h · **Riesgo:** bajo · **Ejecuta:** Claude.

### P2.2 · Refrescar los 16 artículos y actualizar `dateModified`

Tres meses sin tocar, con «(2026)» en los titles y datos de mercado que
envejecen. Revisar cifras contra fuente (encadena con P1.2), actualizar lo que
haya cambiado y mover `dateModified`.
**Regla dura:** solo se mueve `dateModified` si el contenido cambió de verdad.
**Esfuerzo:** 6 h · **Riesgo:** medio (datos YMYL) · **Ejecuta:** Claude propone, usuario valida los datos.

### P2.3 · Estructura semántica en las fichas de `proyectos.html`

9 `h2` y 0 `h3` para 8 proyectos y 34 imágenes. Dar un `h3` con el nombre de
cada proyecto y su ubicación.
**Esfuerzo:** 1 h · **Riesgo:** bajo · **Ejecuta:** Claude.

### P2.4 · `llms.txt`: HECHO (a la espera de P0.1)

> `scripts/generar-llms-txt.py`. Sirve de poco mientras Cloudflare siga
> bloqueando a los rastreadores de IA.

Devuelve 404. Índice legible por máquina con qué es el sitio, qué cubre y las
URLs principales.
**Depende de P0.1:** sin desbloquear los crawlers de IA no sirve de nada.
**Esfuerzo:** 30 min · **Riesgo:** ninguno · **Ejecuta:** Claude.

### P2.5 · Comprimir las 12 imágenes por encima de 200 KB

Empezando por el mapa de zonas (409 KB). Reencodar WebP con calidad 80-82 y
recortar al ancho máximo real de presentación.
**Esfuerzo:** 1 h · **Riesgo:** bajo (verificar calidad visual) · **Ejecuta:** Claude.

### P2.6 · `defer` en `gtag-init.js` y `gtm-init.js`

Están en `<head>` sin `defer` ni `async` y bloquean el parseo.
**Riesgo: medio.** Tocar el orden de carga del tracking puede romper la medición,
y la línea base limpia arranca el 20-ago-2026. Verificar cada evento
(`generate_lead`, `lead_submit_attempt`, `whatsapp_click`) en tiempo real antes
de dar por bueno el cambio.
**Esfuerzo:** 1 h + verificación · **Ejecuta:** Claude, con validación del usuario en GA4.

### P2.7 · Cerrar el agujero del check de guiones largos: HECHO

> 119 de 121 sustituidos por guion corto. Los 2 restantes son viñetas
> `content:"-"` de CSS en una página `noindex`: diseño, no puntuación. El
> comando corregido está documentado en el `CLAUDE.md` del proyecto.

`CLAUDE.md §6` verifica con `grep -c "—"`, que solo detecta em-dash. Quedan 121
en-dash (`–`) en el HTML: 31 en `index.html`, 28 en `preview-zonas-inversion`.

Actualizar el comando documentado para que cubra `—`, `–`, `―` y `‒`, y limpiar
las apariciones en páginas publicadas (muchas son rangos numéricos tipo
«6–12%», que en español van con «de 6 a 12%» o guion corto).

> Los guiones largos de este apartado son deliberados: se citan como el
> objeto del hallazgo, no como puntuación. El resto del documento no lleva.
**Esfuerzo:** 1 h · **Riesgo:** ninguno · **Ejecuta:** Claude.

### P2.8 · Medir Core Web Vitals de verdad

La API de PageSpeed agotó cuota y no hay Lighthouse en el entorno. Sin
medición no se puede afirmar nada sobre LCP, INP ni CLS.

Medir `/`, `/proyectos.html` y un artículo. Repetir después de P0.2 para
cuantificar la mejora de CLS.
**Esfuerzo:** 30 min · **Ejecuta:** Claude (cuando haya cuota) o usuario desde Search Console.

---

## P3: backlog

| # | Acción | Nota |
|---|---|---|
| P3.1 | **Páginas de servicio por ciudad**: `/invertir-en-dubai`, `/invertir-en-abu-dhabi`, `/invertir-en-ras-al-khaimah` | 3 páginas, no 30. El aviso de calidad de la skill salta a partir de 30 páginas de ubicación programáticas y para en 50. Aquí no aplica: son 3 páginas editoriales, no programáticas |
| P3.2 | **URL propia por proyecto** en lugar de anclas en `proyectos.html` | 8 URLs indexables nuevas con schema `Residence` completo. Es la vía más rápida para ampliar superficie con contenido que ya existe |
| P3.3 | Retomar los 24 clusters de `SEO_ESTRATEGIA.md` | 5 de 24 cubiertos. Es el camino de 20 a 80-120 URLs |
| ~~P3.4~~ | ~~Open Graph en `legal.html`~~ | HECHO el 31-ago-2026 |
| P3.5 | Fingerprint en el nombre de los assets (F12 de `_headers`) | Sustituye el `?v=` actual |
| P3.6 | Sacar las 3 maquetas `preview-*.html` de `public/` | Están en `noindex`, pero son borradores en producción |
| P3.7 | Enriquecer `RealEstateAgent` y `BlogPosting` | `telephone`, `address`, `about`, `wordCount` |
| ~~P3.8~~ | ~~Corregir «plénamente»~~ | HECHO el 31-ago-2026, incluida la copia del JSON-LD |

---

## Recorrido esperado del Health Score

Recalculado el 31-ago-2026 sobre los 67 checks reales, no estimado a ojo.

| Hito | Score | Nota | Qué falta para llegar |
|---|---:|:---:|---|
| Partida, 31-ago por la mañana | 68,4 | C | |
| **Estado actual** | **77,4** | **B** | ya aplicado |
| Tras P0.1 | 82,0 | B | un ajuste en el panel de Cloudflare, 10 minutos |
| Tras P0.1 + P1.1 + P1.2 | 90,0 | A | autoría identificable y fuentes enlazadas |
| Tras P2 completo | 96,5 | A | refresco de contenido y limpieza técnica |
| Tras P3 | 98,3 | A | superficie de contenido de 20 a 80-120 URLs |

Dos lecturas de esta tabla:

- **P0.1 son 4,6 puntos por diez minutos de panel.** Es la mejor relación
  esfuerzo/resultado que queda, y es la única acción que desbloquea GEO.
- **P3 solo suma 1,8 puntos y aun así es lo más importante.** El score mide
  calidad de lo publicado, no cantidad. Con 20 URLs se puede sacar un 98 y seguir
  sin tráfico suficiente. La superficie de contenido es el cuello de botella
  identificado en junio y confirmado hoy, y no se arregla puntuando mejor.

---

## Añadido al backlog el 31-ago-2026

| # | Acción | Origen |
|---|---|---|
| P2.9 | `legal.html` desborda 142 px en móvil: envolver la tabla en un contenedor con `overflow-x: auto` (el CSS del blog ya tiene `table-wrap`) | Detectado al renderizar con Playwright. Preexistente, verificado contra producción |
| P3.9 | Borrar `assets/projects/mira-bentley-villas-dubai/fc5abbf2…_432cdae6da.jpg`: 263 KB, 2680x1496, no lo referencia nada | Detectado al comprimir imágenes |

Sobre **P2.5**: de las 12 imágenes por encima de 200 KB, solo 2 admitían mejora
sin redimensionar ni cambiar de formato, y el ahorro fue de 58 KB. Los WebP ya
estaban bien codificados. Bajar más exige redimensionar, y eso obliga a revisar
antes cada `srcset`: dos intentos de atajo fallaron y hubo que revertirlos
(redimensionar `hero-dubai-1920.webp`, que declara 1920w en el `imagesrcset`; y
guardar contenido WebP dentro de un `.jpg`, que con `nosniff` activo rompe la
imagen). Queda como trabajo con cuidado, no como limpieza rápida.

---

## Qué necesito para empezar

1. **P0.1 depende del usuario**, no de Claude: es el panel de Cloudflare y una
   decisión sobre la política de entrenamiento con IA.
2. **P1.1 necesita una decisión de negocio**: qué credenciales del fundador y del
   partner se publican.
3. El resto lo puede aplicar Claude por incrementos, uno a uno, con verificación
   después de cada cambio y sin tocar diseño ni funcionalidad, según
   `references/18-plan-implementacion.md`.

**Ninguna acción se ejecuta hasta que se apruebe explícitamente cuál.**
