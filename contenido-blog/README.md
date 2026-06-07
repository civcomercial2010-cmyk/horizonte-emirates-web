# Contenido del blog: fuente editable y manual de escalabilidad

Esta carpeta es el **centro de mando del contenido**. NO se publica (vive fuera de `public/`), pero es la fuente de verdad editable de cada artículo y el manual para escalar el blog con nuevas temáticas sin romper nada.

> Web publicada = los `.html` de `public/blog/`. Borrador/fuente editable = los `.md` de esta carpeta. Mantén ambos sincronizados al editar.

---

## Estructura

```
contenido-blog/
├── README.md                      ← este manual
├── _PLANTILLA-articulo.html       ← plantilla HTML lista para copiar (placeholders {{...}})
├── articulos/                     ← fuente en Markdown de cada artículo publicado
│   ├── como-invertir-inmuebles-dubai.md
│   ├── impuestos-invertir-dubai-espana.md
│   └── golden-visa-emiratos-guia.md
└── paginas/                       ← fuente de hub y páginas fijas
    ├── blog-index.md
    └── sobre-equipo.md
```

Cada `.md` lleva **front-matter YAML** con los metadatos SEO. Ese front-matter es la base de la escalabilidad: si algún día se adopta un generador estático (Eleventy/Astro), estos `.md` se consumen tal cual sin reescribir nada. Mientras tanto, sirven de borrador y de registro.

---

## Cómo añadir una nueva temática / artículo (paso a paso)

1. **Elige el cluster y la keyword.** Mira el mapa de clusters abajo y `docs/SEO_ESTRATEGIA.md` (24 clusters + plan 12 meses). Un artículo = una keyword principal. No dupliques intención entre artículos del mismo cluster (canibalización).
2. **Crea el borrador en Markdown.** Copia `articulos/_modelo` mental (usa uno existente como referencia) en `articulos/<slug>.md`. Rellena el front-matter completo.
3. **Genera el HTML.** Copia `_PLANTILLA-articulo.html` a `public/blog/<slug>.html` y sustituye todos los `{{placeholders}}`. Vuelca el cuerpo en `<article class="prose">`. Mantén la estructura (breadcrumb, TOC, bio, fuentes, disclaimer, related, CTA band).
4. **JSON-LD.** Rellena los 3 bloques: `BlogPosting`, `BreadcrumbList` y (si hay FAQ) `FAQPage`. El contenido del `FAQPage` debe coincidir con las preguntas visibles del artículo.
5. **Enlazado interno (obligatorio).**
   - El artículo enlaza a su **pilar**, a **2-3 hermanos** del cluster y a la **página de conversión** (`/#form` o un lead magnet).
   - Añade el artículo al **grid del hub** (`public/blog/index.html`) con su `data-cat`.
   - Añade una tarjeta en el bloque "Sigue leyendo" de 1-2 artículos relacionados.
6. **Sitemap.** Añade la URL a `public/sitemap.xml` (`<priority>0.8` artículos, `0.9` pilares) con `<lastmod>` de hoy.
7. **Imágenes.** Usa WebP en `public/assets/img/` (o `assets/blog/`). Siempre con `width`/`height` (anti-CLS) y `alt` descriptivo. La primera imagen del artículo: `loading="eager" fetchpriority="high"`; el resto `loading="lazy"`.
8. **Verifica antes de desplegar** (ver checklist).
9. **Deploy:** `git add -A && git commit && git push` (y `npx wrangler deploy` si no hay auto-deploy).

---

## Checklist SEO por artículo (no publicar sin esto)

- [ ] `title` único < 60 car. con la keyword principal
- [ ] `meta description` 150-160 car. con keyword + gancho
- [ ] `canonical` absoluto correcto (`https://www.horizonteemirates.com/blog/<slug>.html`)
- [ ] OG + Twitter completos
- [ ] JSON-LD `BlogPosting` + `BreadcrumbList` (+ `FAQPage` si aplica): **validar en Rich Results Test**
- [ ] 1 solo `<h1>`; jerarquía `h2`/`h3` coherente con keywords secundarias
- [ ] TOC con anclas que coinciden con los `id` de los `h2`
- [ ] Bloque de autor + fecha (`datePublished`/`dateModified`)
- [ ] Fuentes citadas + disclaimer YMYL (fiscal/legal) cuando toque
- [ ] Enlazado interno: pilar + hermanos + conversión
- [ ] Añadido al hub, al sitemap y a "Sigue leyendo"
- [ ] Imágenes WebP con `width`/`height`/`alt`
- [ ] **CSP-safe:** 0 `<script>` inline ejecutable, 0 `onclick`/`onchange` (solo JSON-LD y `src` propios)
- [ ] CTA al funnel presente (mínimo 1 `cta-inline` + 1 `cta-band`)
- [ ] **SIN rayas (—).** Prohibido el guion largo (raya, em dash U+2014) como recurso estilístico. Usar **comas** (aposiciones), **paréntesis** (incisos) o **dos puntos** (enumeraciones). Verificar antes de publicar: `grep -c "—" public/blog/<slug>.html` debe dar 0. Las semirayas (–) solo se permiten en rangos numéricos (6–9%).

---

## Reglas de oro del stack (no romper)

- **Estático puro.** Nada de contenido indexable detrás de JavaScript. El HTML servido ya es el resultado final.
- **SIN rayas (—) en el texto.** El guion largo está prohibido en toda la web. Comas, paréntesis o dos puntos en su lugar.
- **CSS/JS autocontenidos del blog.** Las páginas del blog cargan `tokens.css` + `fonts.css` + `blog.css` y `blog.js`. **NUNCA** cargar `app.js` ni `home.css` (crashean: `app.js` referencia `#mainform`, ROI, KPI que no existen en el blog).
- **CSP estricta** (`public/_headers`): sin `unsafe-inline` en `script-src`. JSON-LD sí está permitido (es un *data block*, no se ejecuta).
- **URLs con `.html`** para artículos (coherencia con `html_handling:"none"`); el hub es `/blog/` (directory index).
- **Datos con fuente.** Cifras de mercado siempre atribuidas y fechadas. Nunca inventar precios de promotoras (ver `[[v2_datos_no_verificados]]`).

---

## Mapa de clusters (de `docs/SEO_ESTRATEGIA.md`)

| Cluster | Artículo | Estado |
|---|---|---|
| Inversión (core) | Cómo invertir en inmuebles en Dubai *(pilar)* | ✅ publicado |
| Fiscalidad | Impuestos al invertir en Dubai desde España *(pilar)* | ✅ publicado |
| Residencia & Visados | Golden Visa de Emiratos *(pilar)* | ✅ publicado |
| Inversión | Rentabilidad inmobiliaria en Dubai (yields por zona) | ✅ publicado |
| Inversión | Mejores zonas para invertir en Dubai | ✅ publicado |
| Inversión | Comprar sobre plano (off-plan) en Dubai | ✅ publicado |
| Fiscalidad | Residencia fiscal en Emiratos para españoles | ✅ publicado |
| Inversión / RAK | Invertir en Ras Al Khaimah (efecto Wynn) | ✅ publicado |
| Empresa | Crear una empresa en Dubai *(pilar)* | ✅ publicado |
| Empresa | Free zones de Emiratos comparadas | ✅ publicado |
| Fiscalidad | Modelo 720: declarar tu inmueble de Dubai | ✅ publicado |
| Decisión | España vs. Dubai para invertir | ✅ publicado |
| Residencia | Cómo conseguir la residencia en Dubai | ✅ publicado |
| Inversión | Comprar propiedad siendo no residente | ✅ publicado |
| Inversión | Invertir en Abu Dhabi | ✅ publicado |
| Vida | Vivir en Dubai siendo español | ✅ publicado |
| Off-plan | Planes de pago en Dubai (detalle) | ⬜ siguiente |
| Fiscalidad | Convenio doble imposición España-EAU | ⬜ |
| Inversión | Hipoteca en Dubai para extranjeros | ⬜ |
| Decisión | Errores al invertir en Dubai | ⬜ |

**Total publicado: 16 artículos + hub + página de equipo (5 clusters: Inversión, Fiscalidad, Residencia & Visados, Empresa, Vida).**

Lista completa de 24 clusters y calendario de 12 meses: `docs/SEO_ESTRATEGIA.md`.

---

## Categorías del hub (`data-cat`)

`inversion` · `fiscalidad` · `visados`: añade nuevas con su chip en `cat-filter` y el `data-cat` en cada `post-card`.

---

## Evolución opcional (cuando haya >15 artículos)

Mantener HTML a mano deja de escalar. La evolución natural (**sin cambiar el hosting**) es un generador estático (Eleventy/Astro) que consuma estos `.md` con front-matter y emita el HTML a `public/`. Cloudflare seguiría sirviendo estático igual. No es urgente: con 3-15 piezas, el flujo manual + plantilla es suficiente.
