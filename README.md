# horizonte-emirates-web

Web de **Horizonte Emirates**: generación de leads para inversión inmobiliaria en Dubai y
Emiratos Árabes Unidos, dirigida a inversores hispanohablantes. Propiedad de Propulse SLU (Andorra).

Producción: https://www.horizonteemirates.com

## Stack

- Sitio **estático**: HTML + CSS vanilla + JS vanilla. **Sin build, sin framework, sin npm en runtime.**
- Hosting: **Cloudflare Workers (Assets)**. Config en `wrangler.jsonc`
  (`html_handling: "none"`, `not_found_handling: "404-page"`).
- Solo se publica el directorio **`public/`**. El resto del repo es soporte y no se sirve.
- `public/_headers` y `public/_redirects` se aplican de forma nativa por Cloudflare.
- Backend de leads: **Web3Forms → Google Apps Script → Google Sheets** + Calendly + WhatsApp.
- Tracking: GA4 `G-BK37V83363` + Google Ads `AW-586671676` + Meta Pixel (post-consentimiento)
  con **Consent Mode v2** (default `denied`).

## Estructura

```
public/                 # Lo único que se despliega (la web)
  index.html            # Home (formulario multipaso + scoring + ROI + WA modal)
  proyectos.html        # Cartera de proyectos
  legal.html            # Aviso legal y privacidad
  blog/                 # Hub + 16 artículos SEO + créditos
  assets/               # css, js, fonts (self-host), img, projects, blog, logos, og
  _headers              # Cabeceras de seguridad + caché (fuente de verdad)
  _redirects            # Rewrites (raíz 200, hub de blog)
  robots.txt, sitemap.xml, 404.html
worker/index.js         # Shim: sirve / con 200 (sin 301 a index.html)
wrangler.jsonc          # Config de despliegue Cloudflare
ROADMAP_AUDITORIA.md    # Tablero de tareas (M-IDs) y auditorías
contenido-blog/         # Fuentes .md de los artículos (no se publican)
automation/             # Google Apps Script (emails, matching, Telegram) + copys
docs/                   # Documentación técnica (cabeceras, SEO, tracking, auditorías)
database/, Analytics/   # Esquemas y documentación de datos/analítica
tools/                  # optimize_images.py + toolchain local de imágenes (imgproc, gitignored)
```

## Despliegue

Deploy automático desde `push` a `main` (integración Git de Cloudflare).

**Importante (fix `/` sin 301):** el worker `worker/index.js` solo se activa si el build de Cloudflare
ejecuta `npx wrangler deploy` (no basta con publicar solo `public/`). En el dashboard de Cloudflare
→ Workers & Pages → tu proyecto → Settings → Builds: comando de build `npm install && npm run deploy`.
Sin eso, `/` seguirá en 301→`/index.html` aunque el HTML esté actualizado.

Deploy manual (requiere `CLOUDFLARE_API_TOKEN`):

```bash
npm install
npm run deploy
```

## Disciplina del proyecto

- **YMYL**: mantener disclaimers y bloque "Fuentes y metodología"; no inventar cifras sin fuente.
- **CSP**: nada de scripts inline ejecutables; respetar `_headers` y los canonical/sitemap.
- **Sin secretos** en el repo (los IDs de GA4/Ads/Pixel/Web3Forms son públicos por diseño).
- Estilo de contenido: no usar rayas largas; usar comas, paréntesis o dos puntos.

## Verificación rápida

```bash
curl.exe -sI https://www.horizonteemirates.com/                       # cabeceras + HSTS
curl.exe -s -o NUL -w "%{http_code}" https://www.horizonteemirates.com/   # debe ser 200 (sin 301)
```
