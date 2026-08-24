# Estrategia SEO & Contenidos: Horizonte Emirates

> Informe de consultoría · SEO Lead / Content Strategist / Technical SEO Architect
> Fecha: 2026-06-07 · Stack analizado: HTML estático + Cloudflare Workers Assets
> Objetivo: generación de leads orgánicos cualificados (inversión inmobiliaria UAE, mercado hispanohablante)

---

## 1. Resumen ejecutivo

**El stack actual es óptimo para SEO. No requiere ninguna migración.** Un sitio HTML estático servido por Cloudflare Workers Assets es, técnicamente, el mejor escenario posible para indexación: cero problemas de renderizado, cero JavaScript bloqueante para el crawler, contenido 100% presente en el HTML servido, TTFB de red edge y Core Web Vitals ya cuidados. Google interpreta esta arquitectura como contenido inmediatamente disponible (no necesita el "render budget" de la segunda ola de indexación que penaliza a las SPA).

El problema de Horizonte Emirates **no es técnico, es de superficie de contenido**. Hoy el sitio compite por menos de 10 keywords (home transaccional + página de proyectos). Con 3 URLs indexables, el techo de tráfico orgánico es bajísimo. El activo está infrautilizado: tiene autoridad de marca, EEAT incipiente (partner RERA, identificación registral, fuentes citadas) y una máquina de conversión ya montada (funnel + GA4 + scoring por tier), pero **no tiene contenido que capte demanda informacional**, que es donde está el 90% del volumen de búsqueda del sector.

**Tesis central:** crear una capa de contenido SEO (blog + páginas de servicio + lead magnets) sobre el mismo stack estático. Esto multiplica las URLs indexables de 3 a 80-120 en 12 meses, captura demanda en todas las fases del funnel y alimenta el funnel de leads ya existente.

**Las 3 decisiones que mueven la aguja (en orden de impacto):**

1. **Crear estructura de blog + 4 páginas de servicio transaccionales** → desbloquea la captación orgánica (hoy inexistente).
2. **Producir 8-10 guías pilar y un lead magnet potente (guía fiscal España↔UAE)** → captura demanda y convierte tráfico en leads con email.
3. **Construir autoridad temática (topic clusters + EEAT + enlazado interno)** → es lo que hace que Google posicione contenido YMYL (dinero, fiscalidad) de un dominio joven.

Riesgo principal a gestionar: el sector es **YMYL** (Your Money Your Life) + el dominio es **nuevo**. Google exige EEAT alto y paciencia (6-9 meses para tracción real). La estrategia está diseñada en torno a esto.

---

## 2. Diagnóstico técnico SEO

Análisis por factor. Niveles de riesgo evaluados sobre el estado **actual verificado en el código**.

| Factor | Riesgo | Estado actual (verificado) | Impacto SEO | Acción (sin cambiar stack) |
|---|---|---|---|---|
| **Renderizado** | 🟢 Bajo | HTML estático servido tal cual. Contenido en el HTML inicial. | Óptimo. Google indexa al instante, sin coste de render. | Mantener. No introducir frameworks que muevan contenido a JS. |
| **JavaScript** | 🟢 Bajo | JS mínimo (`app.js`, `proyectos.js`, `gtag-init`, `consent`), solo UI/analytics. Ningún contenido depende de JS. | Nulo riesgo. El crawler ve todo sin ejecutar JS. | Mantener la regla de oro: **nada indexable detrás de JS**. |
| **SSR / SSG / ISR / Hydration** | 🟢 Bajo | No aplica: no hay framework. El "HTML pre-renderizado" ya es el resultado final. | El estático es funcionalmente equivalente a SSG, sin los riesgos de hydration mismatch. | No introducir SSR/ISR. Si se escala el blog, usar un **SSG que genere a `public/`** (build-time), no runtime. |
| **Metadata** | 🟢 Bajo | title/description únicos por página, OG, Twitter Card, robots meta, canonical correctos. | Bien resuelto en las 3 páginas. | Plantilla de metadata para cada nuevo artículo (ver §4). Vigilar duplicados al escalar. |
| **Sitemap** | 🟡 Medio | `sitemap.xml` correcto pero **estático con 3 URLs**. Se desactualizará al crecer. | Medio: sin proceso, los artículos nuevos tardan en descubrirse. | Automatizar generación del sitemap (script Node en build/CI). Añadir `<lastmod>` real por artículo. |
| **Robots** | 🟢 Bajo | `robots.txt` limpio, un solo `User-agent: *`, `Allow: /`, sitemap declarado. (M21 ya resuelto). | Correcto. | Opcional: añadir directivas para bots de IA (decisión de negocio, ver §9). |
| **Canonicals** | 🟢 Bajo | Canonical absoluto y correcto en cada página, coherente con `html_handling:"none"` (URLs con `.html`). | Bien. Coherencia canonical ↔ sitemap ↔ enlazado interno. | Mantener el patrón. Cada artículo con su canonical absoluto. |
| **Structured Data** | 🟢 Bajo | JSON-LD `RealEstateAgent`, `FAQPage`, `BreadcrumbList`, `ItemList/Residence`. (M20 hecho). | Ventaja competitiva ya activa. | Validar en Rich Results Test. Añadir `Article`/`BlogPosting` + `Person`(autor) + `Organization` al blog (ver §4). |
| **Core Web Vitals** | 🟢 Bajo | WebP, `preload` del hero con `imagesrcset`, fonts self-host con `font-display:swap`, JS `defer/async`, dimensiones de imagen (anti-CLS). | Muy bueno. Pendiente menor: INP de la animación KPI (M28). | Optimizar animación "tragaperras" KPI (INP). Mantener disciplina en plantillas de artículo. |
| **Crawl Budget** | 🟢 Bajo | Sitio diminúsculo, edge rápido. El crawl budget no es un problema a esta escala. | Irrelevante hoy; gestionable al crecer. | A escala de blog: sitemap limpio + enlazado interno + evitar parámetros/duplicados. No es preocupación real <1.000 URLs. |
| **Indexación** | 🟡 Medio | 3 URLs. El problema no es *poder* indexar (puede), es que **hay muy poco que indexar**. | Alto en oportunidad: techo de tráfico actual = bajísimo. | Aumentar superficie de contenido (blog + servicios). Google Search Console para monitorizar cobertura. |

**Veredicto técnico:** **0 limitaciones técnicas críticas para SEO.** El stack no es un cuello de botella; es una ventaja. Todo lo que falta es contenido y un proceso para publicarlo.

---

## 3. Viabilidad SEO del stack

**¿Puede este stack posicionar correctamente en Google? Sí, sin reservas.**

- **Cómo lo interpreta Google:** como un sitio de HTML plano, contenido inmediato, sin necesidad de renderizado diferido. Es la arquitectura que Google indexa de forma más fiable y rápida. No hay "ola de render" (la que perjudica a React/Vue sin SSR).
- **Ventajas estructurales frente a un CMS/SPA:**
  - Sin riesgo de hydration ni contenido inyectado por JS que el crawler pueda perderse.
  - TTFB de red edge global (Cloudflare) → CWV favorables → señal de ranking.
  - Sin plugins, sin superficie de ataque, sin deuda de actualizaciones (WordPress).
  - Cabeceras de seguridad ya servidas por HTTP (`_headers`): HTTPS + HSTS son señales positivas.
- **Única limitación real (de mantenibilidad, no de SEO):** escribir cada artículo a mano en HTML no escala más allá de ~15-20 piezas. **Esto NO obliga a cambiar de hosting.** Se resuelve con una capa de *build* (SSG) que genera HTML estático a `public/`, manteniendo Cloudflare Workers Assets intacto como runtime. Ver §4.

**Conclusión:** el stack se mantiene. La recomendación es construir encima, no migrar.

---

## 4. Viabilidad del blog

**Viable y recomendado.** Es la palanca #1 de captación orgánica.

### ¿Google rastreará e indexará los artículos?
Sí, sin fricción, siempre que cada artículo se publique como HTML estático en `public/blog/` (igual que las páginas actuales) y se enlace desde el sitemap y el enlazado interno. Nivel de indexación esperado: **alto (90-100% de URLs indexadas)** dado que el contenido es estático, original y enlazado. El factor limitante de *ranking* (no de indexación) será EEAT/autoridad, no la técnica.

### Arquitectura de URLs recomendada
Coherente con el patrón actual (`html_handling:"none"`, URLs con `.html`):

```
/blog/                                         → índice del blog (hub)
/blog/crear-empresa-en-dubai.html              → artículos (slug plano, kebab-case, keyword)
/blog/golden-visa-emiratos-guia.html
/blog/residencia-fiscal-uae-espanoles.html
/guias/comprar-inmueble-dubai-espanol.html     → lead magnets / pilares descargables
/servicios/crear-empresa-dubai.html            → páginas transaccionales de servicio
```

Decisiones de arquitectura:
- **Slug plano `/blog/articulo.html`** (no `/blog/categoria/articulo`). Evita reorganizaciones de URL si un artículo cambia de categoría → cero redirects, cero pérdida de equity. Categorías se expresan vía breadcrumb + enlazado, no vía ruta.
- **Mantener `.html`** por coherencia total con canonical/sitemap/`html_handling:"none"` ya configurado. No mezclar URLs con y sin extensión (evita duplicados).
- Slugs en **español, con la keyword principal**, sin stopwords innecesarias, sin fechas (evita que el contenido "caduque" visualmente).

### Cómo generar páginas optimizadas (recomendación técnica)
Dos rutas, ambas respetan el stack de hosting:

| Opción | Cuándo | Coste | Recomendación |
|---|---|---|---|
| **A. HTML manual** (plantilla copiable) | Volumen bajo (primeras 5-10 piezas) | Cero infra | Empezar aquí para no bloquearse |
| **B. SSG → genera a `public/`** (Eleventy/Astro en build, contenido en Markdown) | Volumen medio/alto (>15 piezas) | Build en GitHub Actions; runtime sin cambios | Adoptar cuando el volumen lo justifique |

> Importante: la opción B **no es una migración de stack**. Cloudflare Workers Assets sigue sirviendo HTML estático desde `public/`. El SSG solo es una herramienta de *autoría* que produce ese HTML en tiempo de build. El runtime, el hosting, las cabeceras y el dominio no cambian. Recomendado: **Eleventy** (output HTML limpio, sin JS runtime, alineado con la filosofía estática actual) o **Astro** (si se quiere componetización con "zero-JS by default"). Herramienta de build encaja con el stack del usuario (GitHub + GitHub Actions).

### Elementos a implementar en el blog

| Elemento | Implementación en stático |
|---|---|
| **Categorías** | Páginas hub estáticas (`/blog/categoria-fiscalidad.html`) que listan artículos. Expresan topic cluster. |
| **Tags** | Opcional y con moderación. Si se usan, `noindex` a las páginas de tag para evitar thin content. Mejor enlazado contextual que tags. |
| **Autor** | Bloque de autor visible en cada artículo + `Organization` en JSON-LD + identificación en `legal.html`. **Crítico para EEAT en YMYL.** |
| **Fecha** | `datePublished` + `dateModified` en JSON-LD y visible. Actualizar `dateModified` al revisar (señal de frescura). |
| **Breadcrumbs** | Visibles + `BreadcrumbList` JSON-LD (ya domináis el patrón en `proyectos.html`). |
| **Schema** | `BlogPosting`/`Article` + `author`(Person) + `publisher`(Organization) + `FAQPage` cuando aplique. |
| **Enlazado interno** | Cada artículo enlaza a su pilar, a 2-3 hermanos del cluster y a la página de conversión (servicio/lead magnet). Ver §6. |

### Plantilla `<head>` por artículo (copiable)
```html
<title>Keyword principal | Horizonte Emirates</title>
<meta name="description" content="150-160 car. con keyword + propuesta de valor + CTA implícito."/>
<meta name="robots" content="index,follow"/>
<link rel="canonical" href="https://www.horizonteemirates.com/blog/slug.html"/>
<!-- OG + Twitter (mismo patrón que index.html) -->
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BlogPosting",
 "headline":"...","datePublished":"2026-...","dateModified":"2026-...",
 "author":{"@type":"Organization","name":"Horizonte Emirates","url":"https://www.horizonteemirates.com/"},
 "publisher":{"@type":"Organization","name":"Horizonte Emirates","logo":{"@type":"ImageObject","url":".../assets/logos/..."}},
 "mainEntityOfPage":".../blog/slug.html","image":".../assets/blog/slug.webp"}
</script>
```

### Riesgos, requisitos mínimos y nivel de indexación esperado
- **Riesgos:** (1) thin content si se publica volumen sin profundidad → penaliza el dominio entero (Helpful Content). (2) Páginas de tag duplicadas. (3) Contenido YMYL sin EEAT no rankea aunque esté indexado. (4) Canibalización entre artículos del mismo cluster sin jerarquía clara.
- **Requisitos mínimos:** sitemap actualizado por artículo, JSON-LD `BlogPosting`+autor, enlazado interno desde el día 1, plantilla CWV-segura, autor real con credenciales, fuentes citadas (ya es práctica de la casa, ver `#fuentes`).
- **Nivel de indexación esperado:** 90-100% indexado (técnica impecable). *Ranking* competitivo en 6-9 meses para informacional, 9-12 meses para transaccional de alta competencia.

---

## 5. Estrategia SEO

### 5.1 SEO Transaccional (BOFU/MOFU: alta intención comercial)

> Nota: la oferta core actual es **inversión inmobiliaria UAE**. Las keywords de "crear empresa/residencia/golden visa" son demanda adyacente con altísimo valor de lead y solapamiento de buyer persona (el inversor inmobiliario suele plantearse también residencia/empresa). Se recomienda capturarlas como **clusters informacionales que nutren el lead core**, y como páginas de servicio **solo si el negocio decide ofrecer ese servicio** (ver §9, riesgo de relevancia). Tipo de página por defecto: página de servicio si hay oferta, guía pilar si es captación de demanda adyacente.

| Cluster | Keyword principal | Keywords secundarias | Intención | Tipo de página | Prioridad |
|---|---|---|---|---|---|
| **Invertir en Dubai** (core) | invertir en inmuebles en Dubai | comprar piso en Dubai siendo español, invertir en Dubai desde España, rentabilidad inmobiliaria Dubai | Transaccional | Home + landing pilar | 🔴 Máxima |
| **Comprar sobre plano** | comprar sobre plano en Dubai | off-plan Dubai, propiedades en construcción Dubai, pagos a plazos Dubai | Transaccional | Guía pilar + CTA | 🔴 Alta |
| **Inmuebles RAK** | invertir en Ras Al Khaimah | propiedades Ras Al Khaimah, Wynn Al Marjan inversión, NH Collection RAK | Transaccional | Página proyectos/zona | 🔴 Alta |
| **Crear empresa Dubai** | crear empresa en Dubai | abrir empresa en Dubai, montar negocio en Dubai, coste crear empresa Dubai | Transaccional | Guía pilar (→ servicio si aplica) | 🟠 Media-alta |
| **Free Zones** | free zones Emiratos | mejores free zones Dubai, IFZA, DMCC, free zone vs mainland | Comercial/investigación | Guía pilar comparativa | 🟠 Media-alta |
| **Golden Visa** | golden visa Emiratos | golden visa Dubai requisitos, golden visa por inversión inmobiliaria, visado de oro UAE | Transaccional | Guía pilar + lead magnet | 🔴 Alta |
| **Residencia UAE** | residencia en Emiratos | residencia Dubai para españoles, cómo conseguir residencia UAE, visado residencia Dubai | Transaccional | Guía pilar | 🟠 Media-alta |
| **Residencia fiscal** | residencia fiscal en Dubai | tax residency UAE, certificado residencia fiscal Emiratos, tributar en Dubai | Transaccional (alto valor) | Guía pilar + lead magnet | 🔴 Alta |
| **Corporate services** | corporate services Dubai | constitución sociedades UAE, servicios corporativos Emiratos | Transaccional | Página de servicio (si aplica) | 🟢 Media |
| **Fiscalidad inversor** | impuestos inversión Dubai España | Modelo 720 Dubai, declarar inmueble Dubai en España, doble imposición UAE España | Transaccional (intención de lead) | Guía pilar + lead magnet | 🔴 Alta |

### 5.2 SEO Informacional: 24 clusters temáticos

Cada cluster = 1 pillar page + N artículos de soporte. Estructura de contenidos sugerida por cluster: *costes reales · pasos · tiempos · errores frecuentes · comparativas · casos reales · FAQ*.

**Bloque A: Inversión inmobiliaria (core)**
1. **Cómo invertir en inmuebles en Dubai** (PILAR) → costes reales, proceso paso a paso, plazos, errores, comparativa España vs Dubai, casos.
2. **Rentabilidad inmobiliaria en Dubai** → yields por zona, neto vs bruto, gastos ocultos, comparativa con España/Europa.
3. **Comprar sobre plano (off-plan) en Dubai** → cómo funciona, planes de pago, riesgos, garantías RERA/escrow, hitos.
4. **Mejores zonas para invertir en Dubai** → Marina, Downtown, JVC, Business Bay; perfil de cada zona, ticket, yield.
5. **Invertir en Ras Al Khaimah** → efecto Wynn Al Marjan, por qué RAK ahora, comparativa con Dubai.
6. **Invertir en Abu Dhabi** → mercado, zonas inversión extranjera, diferencias con Dubai.
7. **Comprar propiedad en Dubai siendo no residente** → legalidad, proceso remoto, poder notarial, freehold vs leasehold.
8. **Financiación/hipoteca para comprar en Dubai** → opciones para extranjeros, LTV, requisitos.

**Bloque B: Fiscalidad y residencia (alto valor de lead)**
9. **Residencia fiscal en Emiratos para españoles** (PILAR) → cómo se obtiene, 183 días, certificado, ventajas, errores.
10. **Impuestos al invertir en Dubai desde España** → 0% en origen, IRPF, plusvalías, Modelo 720, convenio doble imposición.
11. **Modelo 720 y bienes en el extranjero** → qué declarar, umbrales, sanciones, cómo cumplir.
12. **Golden Visa de Emiratos** (PILAR) → requisitos, vías (inmueble 2M AED), proceso, ventajas, renovación.
13. **Cómo conseguir la residencia en Dubai** → vías (inversión, empresa, empleo), pasos, coste, tiempos.
14. **Salir de la residencia fiscal española** → implicaciones, exit tax, errores frecuentes (contenido de captación, sin asesorar).

**Bloque C: Empresa y negocio**
15. **Crear una empresa en Dubai** (PILAR) → mainland vs free zone, costes reales, pasos, tiempos, errores.
16. **Free zones de Emiratos comparadas** → IFZA, DMCC, Meydan, RAKEZ; cuál según actividad/coste.
17. **Free zone vs mainland** → diferencias, propiedad 100%, restricciones, cuál elegir.
18. **Coste real de montar una empresa en Dubai** → desglose, ocultos, mantenimiento anual.

**Bloque D: Vida, comparativas y decisión**
19. **Vivir en Dubai siendo español** → coste de vida, sanidad, educación, comunidad hispana.
20. **España vs Dubai para invertir/vivir** (comparativa pilar) → fiscalidad, rentabilidad, seguridad jurídica, calidad de vida.
21. **Mitos sobre invertir en Dubai** → desmonta objeciones (burbuja, opacidad, seguridad) con datos.
22. **Errores al invertir en inmuebles en Dubai** → top 10 errores y cómo evitarlos.
23. **Cómo elegir promotor/proyecto en Dubai** → due diligence, RERA, escrow, track record.
24. **Glosario del inversor inmobiliario en UAE** → RERA, DLD, freehold, off-plan, service charge, escrow… (captura long-tail + enlazado interno masivo).

---

## 6. Plan de contenidos SEO (12 meses)

Cadencia objetivo: **4 piezas/mes** (mix de pilares y soporte). Prioriza pilares de clusters de mayor valor de lead primero. Potenciales en escala relativa (Alto/Medio/Bajo) por falta de datos de volumen verificados, validar con Search Console/Keyword Planner antes de ejecutar.

> Leyenda: **Funnel** TOFU (atrae) · MOFU (considera) · BOFU (decide). **Tráfico/Lead** = potencial estimado.

### Trimestre 1 (mes 1-3): Cimientos: pilares de alto valor + páginas de servicio

| # | Título SEO | Keyword principal | Objetivo | Funnel | Tráfico | Lead | CTA |
|---|---|---|---|---|---|---|---|
| 1 | Cómo invertir en inmuebles en Dubai desde España (guía 2026) | invertir en inmuebles en Dubai | Pilar core | MOFU | Alto | Alto | Análisis personalizado 48h |
| 2 | Impuestos al invertir en Dubai desde España: lo que debes saber | impuestos inversión Dubai España | Captar lead fiscal | BOFU | Medio | Alto | Descarga guía fiscal |
| 3 | Golden Visa de Emiratos: requisitos y cómo obtenerla por inversión | golden visa Emiratos | Pilar visa | MOFU | Alto | Alto | Descarga roadmap visa |
| 4 | Rentabilidad inmobiliaria en Dubai: yields reales por zona | rentabilidad inmobiliaria Dubai | Demostrar oportunidad | MOFU | Alto | Medio | Calculadora ROI |
| 5 | Comprar sobre plano en Dubai: cómo funciona y qué riesgos tiene | comprar sobre plano Dubai | Educar off-plan | MOFU | Alto | Alto | Análisis personalizado |
| 6 | Residencia fiscal en Emiratos para españoles | residencia fiscal Dubai | Captar lead premium | BOFU | Medio | Alto | Descarga checklist |
| 7 | Mejores zonas para invertir en Dubai en 2026 | mejores zonas invertir Dubai | Capturar investigación | MOFU | Alto | Medio | Comparativa de zonas |
| 8 | Invertir en Ras Al Khaimah: el efecto Wynn Al Marjan | invertir Ras Al Khaimah | Diferenciación RAK | MOFU | Medio | Alto | Ver proyectos RAK |
| 9 | Servicio: análisis de inversión inmobiliaria en Dubai (página servicio) | análisis inversión Dubai | Página transaccional | BOFU | Medio | Alto | Solicitar análisis |
| 10 | Modelo 720: cómo declarar tu inmueble en Dubai | Modelo 720 Dubai | Resolver fricción legal | BOFU | Medio | Alto | Descarga guía fiscal |
| 11 | Comprar propiedad en Dubai siendo no residente | comprar Dubai no residente | Resolver objeción | MOFU | Alto | Alto | Análisis personalizado |
| 12 | España vs Dubai: dónde conviene invertir en 2026 | España vs Dubai invertir | Comparativa decisión | MOFU | Alto | Medio | Calculadora ROI |

### Trimestre 2 (mes 4-6): Profundidad: empresa, residencia, free zones

| # | Título SEO | Keyword principal | Funnel | Tráfico | Lead | CTA |
|---|---|---|---|---|---|---|
| 13 | Crear una empresa en Dubai: guía completa 2026 (pilar) | crear empresa en Dubai | MOFU | Alto | Medio | Consulta / guía |
| 14 | Free zones de Emiratos comparadas: cuál elegir | free zones Emiratos | MOFU | Alto | Medio | Comparativa PDF |
| 15 | Cómo conseguir la residencia en Dubai (todas las vías) | residencia en Dubai | MOFU | Alto | Alto | Roadmap expatriación |
| 16 | Coste real de montar una empresa en Dubai | coste crear empresa Dubai | BOFU | Medio | Medio | Consulta |
| 17 | Free zone vs mainland: diferencias clave | free zone vs mainland | MOFU | Medio | Bajo | Guía empresa |
| 18 | Financiación e hipoteca para comprar en Dubai | hipoteca Dubai extranjeros | MOFU | Medio | Alto | Análisis personalizado |
| 19 | Errores frecuentes al invertir en inmuebles en Dubai | errores invertir Dubai | TOFU | Alto | Medio | Checklist due diligence |
| 20 | Mitos sobre invertir en Dubai (y qué dicen los datos) | mitos invertir Dubai | TOFU | Alto | Bajo | Guía inversión |
| 21 | Cómo elegir promotor y proyecto en Dubai (due diligence) | elegir promotor Dubai | MOFU | Medio | Alto | Análisis personalizado |
| 22 | Invertir en Abu Dhabi: mercado y zonas | invertir Abu Dhabi | MOFU | Medio | Medio | Ver proyectos |
| 23 | Vivir en Dubai siendo español: coste de vida y calidad | vivir en Dubai español | TOFU | Alto | Bajo | Roadmap expatriación |
| 24 | Glosario del inversor inmobiliario en UAE | glosario inversión Dubai | TOFU | Medio | Bajo | (enlazado interno) |

### Trimestre 3 (mes 7-9): Long-tail, casos y refresco

Foco: artículos de soporte de cada cluster (long-tail), **casos de éxito/estudios propios** (EEAT), y actualización (`dateModified`) de los pilares del T1 con nuevos datos.

| Temas | Funnel | Propósito |
|---|---|---|
| Casos reales: cómo un inversor español compró en RAK (anonimizado) | MOFU | Prueba social + EEAT (resuelve M17) |
| Estudio propio: rentabilidad por zona Q2 2026 (dato original) | TOFU/MOFU | Linkable asset, autoridad, citaciones |
| Sub-artículos off-plan: planes de pago, escrow, garantías RERA | BOFU | Captura long-tail de alta intención |
| Sub-artículos fiscalidad: convenio doble imposición España-UAE | BOFU | Lead premium |
| Salir de la residencia fiscal española (sin asesorar, captación) | BOFU | Lead premium |
| Comparativas zona a zona (Marina vs Downtown vs JVC) | MOFU | Decisión + enlazado |

### Trimestre 4 (mes 10-12): Escala, autoridad y conversión

Foco: completar clusters, doblar producción si hay tracción, **herramienta gratuita** (calculadora ROI / coste de empresa como activo SEO + lead magnet), guest posting / digital PR para backlinks, y optimización CRO de los artículos top por tráfico (mejorar CTA, A/B de lead magnets).

**Prioridad de ejecución global:** T1 completo > lead magnet fiscal > páginas de servicio > clusters empresa/residencia (T2) > casos/estudios propios (T3) > herramientas + linkbuilding (T4).

---

## 7. Lead magnets orgánicos

Cada lead magnet alimenta el funnel ya existente (formulario → GA4 `generate_lead` → scoring por tier → CRM). Recomendación: capturar email con un mini-formulario, entregar PDF, y secuenciar nurturing (ActiveCampaign, ya en el stack).

| # | Título | Problema que resuelve | Formato | Público | CTA | Página de captación |
|---|---|---|---|---|---|---|
| 1 | **Guía fiscal del inversor: Dubai ↔ España** | "¿Cuánto pago de impuestos y qué declaro?" | PDF 15-20 pág. | Inversor con dudas fiscales | "Descarga la guía fiscal" | Artículos cluster fiscal + `/guias/fiscalidad.html` (resuelve M19) |
| 2 | **Checklist de residencia fiscal en Emiratos** | "¿Qué pasos y requisitos para ser residente fiscal?" | PDF checklist | Quien valora trasladarse | "Descarga el checklist" | Cluster residencia/fiscal |
| 3 | **Calculadora de rentabilidad (ROI) de inversión en Dubai** | "¿Cuánto ganaría realmente?" | Herramienta web interactiva | Inversor evaluando | "Calcula tu ROI" | Home + artículos rentabilidad |
| 4 | **Comparativa de Free Zones de Emiratos** | "¿Qué free zone me conviene?" | PDF tabla comparativa | Emprendedor/empresa | "Descarga la comparativa" | Cluster empresa/free zones |
| 5 | **Roadmap de expatriación a Dubai (90 días)** | "¿Por dónde empiezo y en qué orden?" | PDF infografía/timeline | Quien quiere mudarse | "Descarga el roadmap" | Cluster residencia/vivir |
| 6 | **Guía: comprar sobre plano sin riesgos (RERA/escrow)** | "¿Cómo me protejo en off-plan?" | PDF 10-12 pág. | Inversor cauto | "Descarga la guía off-plan" | Cluster off-plan |
| 7 | **Guía Golden Visa por inversión inmobiliaria** | "¿Cómo consigo el visado de oro?" | PDF paso a paso | Inversor que busca residencia | "Descarga la guía Golden Visa" | Cluster golden visa |
| 8 | **Calculadora de coste de crear empresa en Dubai** | "¿Cuánto me cuesta montar la empresa?" | Herramienta web | Emprendedor | "Calcula el coste" | Cluster empresa |
| 9 | **Dossier de mercado UAE 2026 (datos y zonas)** | "¿Está el mercado bien? ¿Dónde?" | PDF informe trimestral | Inversor analítico | "Descarga el informe" | Home + cluster zonas (linkable asset) |
| 10 | **Checklist de due diligence del promotor** | "¿Cómo sé que el proyecto es fiable?" | PDF checklist | Inversor en fase decisión | "Descarga el checklist" | Cluster elegir promotor + proyectos |
| 11 | **Guía Modelo 720 para bienes en Dubai** | "¿Cómo declaro sin sancionarme?" | PDF | Inversor que ya compró/va a comprar | "Descarga la guía 720" | Cluster fiscal |
| 12 | **Comparador España vs Dubai (PDF + calculadora)** | "¿Realmente compensa frente a España?" | PDF + tool | Inversor indeciso | "Compara tu caso" | Comparativa España vs Dubai |

> Priorizar **#1 (guía fiscal)** y **#3 (calculadora ROI)**: máximo valor percibido, máximo encaje con el lead core, y la calculadora es además un activo SEO (URL indexable + linkable).

---

## 8. Estrategia de autoridad temática (EEAT)

En un sector YMYL con dominio joven, la autoridad temática **es la condición necesaria para rankear**, no un extra.

### Topic Clusters + Pillar Pages
Modelo hub-and-spoke. Cada pilar es la URL canónica del tema; los artículos de soporte enlazan hacia arriba al pilar y lateralmente entre sí.

| Pillar Page | Supporting content (ejemplos) |
|---|---|
| **Invertir en inmuebles en Dubai** | rentabilidad, zonas, off-plan, no residente, financiación, errores, elegir promotor |
| **Residencia fiscal en Emiratos** | impuestos España, Modelo 720, doble imposición, salir residencia española |
| **Golden Visa de Emiratos** | requisitos, vía inmobiliaria, residencia Dubai, renovación |
| **Crear una empresa en Dubai** | free zones, free zone vs mainland, costes, corporate services |

### Internal Linking (reglas)
- Todo artículo de soporte → enlaza a su **pilar** (anchor con keyword del pilar).
- Pilar → enlaza a **todos** sus artículos de soporte (lo convierte en mapa del tema).
- Cada artículo → 2-3 enlaces **laterales** a hermanos del cluster.
- Cada artículo → 1 enlace a la **página de conversión** relevante (servicio o lead magnet).
- Usar el **glosario** (#24) como nodo de enlazado interno masivo hacia pilares.

### EEAT: palancas concretas
- **Experience:** casos reales anonimizados, "cómo lo hacemos", fotos propias de proyectos (ya tenéis assets en `/assets/projects/`).
- **Expertise:** bloque de autor en artículos + identificación registral en `legal.html` + bloque confianza en home.
- **Authoritativeness:** estudios/datos propios (dossier de mercado trimestral) → genera citaciones y backlinks; digital PR en medios hispanos de expatriación/inversión.
- **Trust:** ya tenéis identificación registral (`legal.html`, Propulse SLU + NRT), partner RERA verificable, fuentes citadas (`#fuentes`), HTTPS/HSTS. **Falta prueba social verificable (M17)** → añadir testimonios con nombre/foto/resultado y casos de éxito.

### Activos diferenciales a construir
- **Casos de éxito** (resuelve M17 + EEAT Experience).
- **Testimonios** verificables (con `Review`/`AggregateRating` JSON-LD cuando sean reales).
- **Estudios propios** (dato original = imán de enlaces).
- **Herramientas gratuitas** (calculadora ROI, calculadora coste empresa) = activos SEO + lead magnets + linkables.

---

## 9. Estrategia de generación de leads desde contenidos (embudo completo)

Mapa contenido → CTA → lead magnet → automatización → siguiente paso. Todo se conecta al funnel existente (formulario web → `generate_lead` GA4 → scoring tier A/B/C → CRM/email).

| Tipo de contenido | CTA recomendado | Lead magnet asociado | Automatización sugerida | Siguiente paso del usuario |
|---|---|---|---|---|
| **TOFU** (mitos, vivir en Dubai, glosario) | "Descarga la guía/roadmap" (soft) | Roadmap expatriación / Guía inversión | Email capturado → secuencia educativa (nurturing) ActiveCampaign | Recibe valor, entra en lista, se calienta |
| **MOFU** (rentabilidad, zonas, off-plan, comparativas) | "Calcula tu ROI" / "Comparativa" | Calculadora ROI / Dossier mercado | Tag por interés → secuencia de consideración + retargeting (Meta Pixel ya activo) | Evalúa, vuelve, se acerca a la decisión |
| **BOFU** (impuestos, residencia fiscal, due diligence, servicio) | "Solicita tu análisis personalizado 48h" | Guía fiscal / Checklist due diligence | Lead → scoring tier → alerta a comercial (ya existe healthCheck/pipeline) | Solicita análisis, agenda llamada |
| **Páginas de servicio** | "Solicitar análisis" (formulario actual) |: (conversión directa) | Lead directo al pipeline + scoring | Conversión a oportunidad |

**Embudo completo:**
```
Búsqueda Google → Artículo (TOFU/MOFU/BOFU)
   → CTA contextual al funnel del artículo
      → Lead magnet (captura email) ──► ActiveCampaign (nurturing por tag/interés)
      → o Análisis personalizado (formulario actual) ──► GA4 generate_lead + scoring tier
                                                          ──► CRM / alerta comercial
   → Retargeting (Meta Pixel) a los que no convirtieron
   → Email nurturing calienta TOFU/MOFU hasta BOFU → solicitud de análisis
```

Decisión de negocio (no técnica): definir si "crear empresa / corporate services / golden visa" son **servicios ofrecidos** (→ páginas de servicio + leads de ese tipo) o solo **captación de demanda adyacente** que se reconduce al lead inmobiliario. De ello depende el CTA de esos clusters.

---

## 10. Quick Wins (priorizado)

### Impacto alto / esfuerzo bajo (hacer ya)
1. **Dar de alta el sitio en Google Search Console** y enviar el sitemap (si no está). Base de toda medición SEO.
2. **Crear la estructura `/blog/` con índice + publicar las 2 primeras guías pilar** (HTML manual, plantilla §4). Desbloquea captación.
3. **Validar el JSON-LD existente** en Rich Results Test (M31 parcial), ya tenéis `FAQPage`/`ItemList`, asegurad rich snippets.
4. **Mantener bloque de autor** en artículos y bloque confianza en home (palanca EEAT; sin página de equipo dedicada).
5. **Lead magnet #1 (guía fiscal) en PDF + captura** conectado al funnel (resuelve M19).
6. **Optimizar INP de la animación KPI** (M28), último CWV pendiente.
7. **Internal linking desde home y proyectos hacia los nuevos artículos** en cuanto existan.

### Impacto alto / esfuerzo medio
8. **Completar los 8 pilares del T1** (§6).
9. **Páginas de servicio transaccionales** (análisis de inversión, + empresa/residencia si aplica).
10. **Calculadora ROI** (activo SEO + lead magnet + linkable).
11. **Casos de éxito + testimonios verificables** (resuelve M17, EEAT).
12. **Automatizar la generación de `sitemap.xml`** (script en build/CI) para que escale con el blog.

### Estratégico / largo plazo
13. **Adoptar SSG (Eleventy/Astro) → genera a `public/`** cuando se superen ~15 artículos (autoría escalable, mismo hosting).
14. **Estudios/dossier de mercado propios** trimestrales (autoridad + backlinks).
15. **Digital PR / guest posting** en medios hispanos de expatriación e inversión (backlinks de calidad).
16. **Nurturing avanzado por tag/interés** en ActiveCampaign + Conversions API server-side (M34) para atribución robusta.

---

## Roadmap de implementación

| Horizonte | Foco | Entregables clave |
|---|---|---|
| **30 días** | Cimientos técnicos + primeros pilares | Search Console activo · estructura `/blog/` + índice · 2-3 pilares (invertir Dubai, impuestos, golden visa) · bloque autor + página equipo · validación JSON-LD · INP KPI optimizado |
| **60 días** | Lead capture + más pilares | Lead magnet #1 (guía fiscal) + captura conectada al funnel · 4 pilares más · calculadora ROI (v1) · sitemap automatizado · primeros casos/testimonios |
| **90 días** | Completar T1 + servicios | 8 pilares del T1 publicados · páginas de servicio · enlazado interno completo del cluster core · 2-3 lead magnets activos con nurturing |
| **6 meses** | Profundidad + autoridad | Clusters empresa/residencia/free zones (T2) · SSG adoptado si >15 piezas · casos de éxito · primer estudio propio · arranque linkbuilding |
| **12 meses** | Escala + dominio del tema | 24 clusters cubiertos (80-120 URLs) · herramientas gratuitas · dossier trimestral · digital PR sostenido · CRO de top artículos · Conversions API server-side |

---

## 9-bis. Riesgos y mitigación

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| **YMYL + dominio joven → ranking lento** | Alta | Alto | EEAT desde el día 1 (autor, fuentes, casos), expectativa realista (6-9 meses), empezar por informacional de menor competencia |
| **Thin content / Helpful Content** | Media | Alto | Profundidad real por pieza, no publicar por publicar, una pieza buena > tres mediocres |
| **Disclaimers fiscales/legales** | Media | Medio-alto | Mantener el disclaimer ya presente ("no presta asesoramiento fiscal/jurídico") en todo el contenido fiscal; contenido informativo, no asesor |
| **Mantenibilidad del blog en HTML manual** | Media | Medio | Migrar a SSG (genera a `public/`) al superar ~15 piezas; no es cambio de hosting |
| **Canibalización entre artículos del cluster** | Media | Medio | Jerarquía pilar/soporte clara, una keyword principal por URL, enlazado consistente |
| **Dependencia de un solo partner (concentración)** | - | Alto (negocio) | Fuera de SEO, ya en roadmap (M32). El contenido no debe sobre-prometer disponibilidad |
| **Sitemap desactualizado al escalar** | Media | Medio | Automatizar generación en build/CI |
| **Datos de mercado sin verificar en artículos** | Media | Alto (EEAT/confianza) | Mantener disciplina de fuentes citadas (ya es práctica de la casa, `#fuentes`) |

---

## 10-bis. Conclusión final

El stack actual de Horizonte Emirates **no es un obstáculo para el SEO: es una ventaja**. HTML estático sobre Cloudflare es la arquitectura que Google indexa de forma más limpia y rápida, y ya tenéis resuelto lo difícil de la base técnica (metadata, JSON-LD, CWV, sitemap, robots, canonicals, seguridad). **No procede ninguna migración.**

El crecimiento orgánico está bloqueado por una sola causa: **falta de superficie de contenido**. Con 3 URLs no hay techo de tráfico. La estrategia es construir encima del stack (blog estático, páginas de servicio, lead magnets y autoridad temática) para pasar de 3 a 80-120 URLs indexables en 12 meses, capturando demanda en todo el funnel y alimentando la máquina de conversión que **ya existe y funciona**.

**El cuello de botella no es la tecnología. Es la producción de contenido con EEAT.** Ahí es donde debe ir el esfuerzo. La acción de mayor impacto inmediato: **lanzar `/blog/` con los 3 primeros pilares (invertir en Dubai, fiscalidad, golden visa) + la guía fiscal como lead magnet, en los próximos 30 días.**

> Trazabilidad con el roadmap existente: este plan ejecuta y amplía M18 (plan editorial), M19 (lead magnet), y refuerza M17 (prueba social), M20/M31 (structured data/validación), M28 (INP). M21/M27 ya verificados como resueltos en el código.
