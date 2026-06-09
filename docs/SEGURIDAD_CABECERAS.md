# Cabeceras de seguridad y caché: estado actual

> Stack en producción: **Cloudflare Workers (Assets)**. Solo se publica `public/`.
> `public/_headers` y `public/_redirects` se aplican de forma **nativa** (verificado en vivo).

## Fuente de verdad

Toda la configuración de cabeceras vive en **`public/_headers`**. No hay Transform Rules
de Cloudflare para cabeceras (se retiraron para evitar duplicados). La CSP también se sirve
por HTTP desde ese archivo, así que el `<meta http-equiv="Content-Security-Policy">` de las
páginas es redundante (puede retirarse cuando se confirme que no rompe nada).

## Cabeceras aplicadas (bloque `/*`)

| Cabecera | Valor | Propósito |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Fuerza HTTPS, previene downgrade. 1 año (máximo del plan free de Cloudflare), suficiente para la preload list. Objetivo: registrar en hstspreload.org |
| `X-Frame-Options` | `DENY` | Anti-clickjacking |
| `X-Content-Type-Options` | `nosniff` | Evita MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control de referer |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=(), payment=()` | Restringe APIs del navegador |
| `Content-Security-Policy` | ver `_headers` | `script-src` sin `unsafe-inline`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action` restringido; `upgrade-insecure-requests` |

> Pendiente (F8): retirar `style-src 'unsafe-inline'` una vez migrados los `style="..."` inline a clases.

## Caché de assets (F1)

Reglas específicas **antes** del bloque `/*` en `public/_headers`. Cabeceras distintas, así que
las de seguridad de `/*` se aplican de forma acumulativa sobre los assets.

| Patrón | Cache-Control |
|---|---|
| `/assets/fonts/*`, `/assets/img/*`, `/assets/projects/*`, `/assets/blog/*`, `/assets/logos/*` | `public, max-age=31536000, immutable` |
| `/assets/og/*` | `public, max-age=2592000` |
| `/assets/*.css`, `/assets/*.js` | `public, max-age=86400, stale-while-revalidate=604800` |

Imágenes/fuentes/logos en `immutable` porque solo cambian al renombrarse. CSS/JS con TTL menor
hasta tener fingerprint/hash en el nombre (F12); cuando F12 esté hecho, subir CSS/JS a
`max-age=31536000, immutable`.

## HSTS (F3)

`_headers` declara `max-age=31536000` (1 año). Es el máximo que permite el plan free de Cloudflare
y coincide con lo que se sirve en vivo, así que no hay desajuste entre el archivo y producción.
1 año cumple el mínimo de la preload list (>= 31536000). Pendiente: registrar el dominio en
https://hstspreload.org una vez confirmado que toda la propiedad sirve HSTS.

## Verificación

```bash
curl.exe -sI https://www.horizonteemirates.com/ | findstr /I "strict-transport x-frame x-content-type referrer content-security permissions-policy"
curl.exe -sI https://www.horizonteemirates.com/assets/css/home.css | findstr /I "cache-control"
```

Auditar en https://securityheaders.com → objetivo **A / A+**.
