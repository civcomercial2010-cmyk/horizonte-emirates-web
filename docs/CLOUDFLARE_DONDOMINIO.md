# Migrar a Cloudflare con dominio en Dondominio — Horizonte Emirates

Objetivo: poner Cloudflare delante de `horizonteemirates.com` (alojado en GitHub Pages)
para poder enviar las **cabeceras de seguridad HTTP** (HSTS, X-Frame-Options, etc.) que
GitHub Pages no permite. Sin romper el email `hola@horizonteemirates.com`.

> ⚠️ Regla de oro: **no cambies los nameservers en Dondominio hasta confirmar que
> Cloudflare tiene TODOS tus registros DNS** (sobre todo los de email). Si los pierdes,
> dejas el correo sin servicio.

---

## 0. Inventario DNS actual (verificado 2026-06-03)

Estos registros DEBEN existir en Cloudflare antes de cambiar nameservers:

| Tipo | Nombre | Valor | Proxy en Cloudflare |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 🟠 Proxied |
| A | `@` | `185.199.109.153` | 🟠 Proxied |
| A | `@` | `185.199.110.153` | 🟠 Proxied |
| A | `@` | `185.199.111.153` | 🟠 Proxied |
| CNAME | `www` | `civcomercial2010-cmyk.github.io` | 🟠 Proxied |
| MX | `@` | `10 mx01.dondominio.com` | ⚪ DNS only |
| TXT | `@` | `v=spf1 include:spf.dondominio.com` | ⚪ DNS only |
| TXT | `@` | `google-site-verification=OOP58DZbDZK_HrlspIzBKKaIiM51BuYOv6gKgfSV6Cw` | ⚪ DNS only |

⚠️ **Antes de migrar, abre la zona DNS en Dondominio y comprueba si hay además:**
registros **DKIM** (TXT o CNAME con `_domainkey` en el nombre), **DMARC**, otros **MX**,
o subdominios. Si existen, cópialos también a Cloudflare. (Hoy NO hay registro `_dmarc`.)

> Regla de proxy: **web → Proxied (naranja)** para que funcionen las cabeceras.
> **email y verificaciones (MX, TXT, DKIM) → DNS only (gris)**, nunca proxied.

---

## 1. Crear el sitio en Cloudflare

1. Entra en **https://dash.cloudflare.com** (crea cuenta gratis).
2. **Add a site** → `horizonteemirates.com` → plan **Free** → Continue.
3. Cloudflare escanea tu DNS. Espera a que termine.

## 2. Verificar / completar los registros (paso crítico)

1. Compara la lista que muestra Cloudflare con la **tabla del punto 0**.
2. Si falta alguno (sobre todo **MX** y los **TXT**), pulsa **Add record** y créalo con el valor exacto.
3. Ajusta el **proxy** de cada registro según la columna de la tabla:
   - Los 4 `A` y el `CNAME www` → nube **naranja (Proxied)**.
   - `MX` y todos los `TXT` → nube **gris (DNS only)**.
4. (Opcional recomendado) Añade **DMARC** en modo monitor — hoy no tienes:
   - Tipo `TXT`, Nombre `_dmarc`, Valor: `v=DMARC1; p=none; rua=mailto:hola@horizonteemirates.com`

## 3. Cambiar los nameservers en Dondominio

1. Cloudflare te dará **2 nameservers** (p. ej. `lola.ns.cloudflare.com` y `karl.ns.cloudflare.com`). Cópialos.
2. Entra en **Dondominio → Panel de cliente → Mis Dominios →** clic en `horizonteemirates.com`.
3. Busca la sección **"Servidores DNS"** (o "DNS / Nameservers").
4. Elige **"Usar servidores DNS externos / personalizados"**.
5. Borra `ns1.dondominio.com` y `ns2.dondominio.com` y pon los **2 de Cloudflare**.
6. Guarda. (Dondominio puede avisar de que dejará de gestionar tu DNS: es lo esperado;
   el correo sigue funcionando porque el MX está replicado en Cloudflare.)
7. La propagación tarda de minutos a 24 h. Cloudflare te enviará un email cuando el sitio esté **Active**.

## 4. SSL/TLS

1. Cloudflare → **SSL/TLS → Overview** → modo **Full** (¡no "Flexible", causa bucle de redirección con GitHub Pages!).
2. **SSL/TLS → Edge Certificates**:
   - **Always Use HTTPS**: ON
   - **Automatic HTTPS Rewrites**: ON

## 5. Cabeceras de seguridad

**5a. HSTS (la más importante):** SSL/TLS → Edge Certificates → **HTTP Strict Transport Security (HSTS) → Enable**:
- Max Age: **12 meses**
- Include subdomains: ON
- Preload: ON
- No-Sniff header: ON  ← esto ya envía `X-Content-Type-Options: nosniff`

> ⚠️ Activa HSTS solo cuando la web cargue bien por HTTPS (paso 4 hecho). Es difícil de revertir.

**5b. El resto (Transform Rule):** Cloudflare → **Rules → Transform Rules → Modify Response Header → Create rule**:
- Nombre: `Security headers`
- If: **All incoming requests**
- Then → **Set static** (añade una por una):

| Header name | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=(), payment=()` |

- (Si NO activaste "No-Sniff" en 5a, añade también `X-Content-Type-Options: nosniff`.)
- **Deploy**.

## 6. (Opcional) Caché de assets

Cloudflare → **Caching → Cache Rules → Create**:
- If: **URI Path** `starts with` `/assets/`
- Then: **Eligible for cache**, Edge TTL **1 month**.
(GitHub Pages solo envía `max-age=600`; esto acelera imágenes y `consent.js`.)

## 7. Verificación final

```bash
# Cabeceras (deben aparecer todas)
curl -sI https://www.horizonteemirates.com/ | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy"

# La web carga por HTTPS sin bucle
curl -sI https://www.horizonteemirates.com/ | head -1   # -> HTTP/2 200
```

- Audita en **https://securityheaders.com** → objetivo **A / A+**.
- **Prueba el email**: envía y recibe un correo en `hola@horizonteemirates.com`.
- Comprueba que GitHub Pages sigue OK (en GitHub → Settings → Pages, el dominio
  `www.horizonteemirates.com` debe seguir verificado; no borres el archivo `CNAME` del repo).

---

## Resumen de "no romper nada"

- ✅ MX + SPF + verificación de Google replicados en Cloudflare (DNS only) **antes** de cambiar nameservers.
- ✅ SSL en **Full** (no Flexible).
- ✅ Registros web en **Proxied**; email en **DNS only**.
- ✅ No tocar el archivo `CNAME` del repositorio.
