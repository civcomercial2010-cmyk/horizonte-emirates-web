# Cabeceras de seguridad — estado y plan

## Situación actual (GitHub Pages)

El sitio se sirve desde **GitHub Pages**, que **no permite configurar cabeceras HTTP personalizadas**.
El archivo `_headers` de la raíz **es ignorado** (es una funcionalidad de Netlify / Cloudflare Pages, no de GitHub Pages).

### Lo que SÍ está aplicado hoy (vía `<meta>` en cada página)

| Protección | Mecanismo | Estado |
|---|---|---|
| Content-Security-Policy | `<meta http-equiv="Content-Security-Policy">` | ✅ Activo |
| Referrer-Policy | `<meta name="referrer">` | ✅ Activo |
| Forzar HTTPS en subrecursos | `upgrade-insecure-requests` en la CSP | ✅ Activo |

### Lo que NO se puede activar solo con `<meta>` (requiere cabecera HTTP)

| Cabecera | Por qué importa | Cómo activarla |
|---|---|---|
| `Strict-Transport-Security` (HSTS) | Fuerza HTTPS y previene downgrade | Cloudflare / activar "Enforce HTTPS" en Pages |
| `X-Frame-Options` / `frame-ancestors` | Anti-clickjacking (evita que embeban el sitio) | Cloudflare |
| `X-Content-Type-Options: nosniff` | Evita MIME sniffing | Cloudflare |
| `Permissions-Policy` | Restringe APIs del navegador | Cloudflare |

> Nota mínima sin Cloudflare: en **GitHub → Settings → Pages**, activar **"Enforce HTTPS"**.

## Plan recomendado: Cloudflare delante del dominio

1. Crear cuenta en Cloudflare y añadir el dominio `horizonteemirates.com`.
2. Cambiar los **nameservers** del dominio a los de Cloudflare (en el registrador).
3. En DNS, mantener el `CNAME`/registros que apuntan a GitHub Pages, con el proxy (nube naranja) **activado**.
4. SSL/TLS → modo **Full**.
5. **Rules → Transform Rules → Modify Response Header** → "Set static" para cada cabecera:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
```

6. (Opcional) Mover la CSP completa a Cloudflare (incluida `frame-ancestors 'none'`) y retirar la de `<meta>`.
   La CSP de referencia está en el archivo `_headers` de la raíz.
7. Caché: crear una regla para `*/assets/*` con caché larga (Edge TTL alto), ya que GitHub Pages solo envía `max-age=600`.

## Verificación

Tras configurar Cloudflare, comprobar:

```bash
curl -sI https://www.horizonteemirates.com/ | grep -iE "strict-transport|x-frame|x-content-type|referrer|content-security|permissions-policy"
```

Y auditar en https://securityheaders.com → objetivo **A / A+**.
