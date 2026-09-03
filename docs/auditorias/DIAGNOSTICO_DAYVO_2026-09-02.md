# Respuesta a Dayvo: discrepancia Ads/GA4 y página en blanco

**Fecha:** 2 de septiembre de 2026
**Origen:** correo de Dayvo con dos asuntos (discrepancia de clics frente a sesiones,
y páginas en blanco al recargar) más el cambio de estrategia de puja.
**Método:** medición directa contra producción (Playwright sobre
`https://www.horizonteemirates.com`) y consulta a la API de GA4 (propiedad 530364550).
La API de Google Ads no se pudo consultar: el refresh token está caducado.

---

## 1. Discrepancia entre clics de Ads y sesiones de GA4

**La hipótesis del consentimiento es real pero de segundo orden.** Explica una parte
pequeña, y no explica la magnitud de la diferencia. Las causas, por peso medido:

### 1.1 El tráfico de Display no llega a cargar la web (causa dominante)

GA4, últimos 30 días, sesiones por campaña:

| Campaña | Sesiones en GA4 | Sesiones con interacción |
|---|---:|---:|
| Inversión inmobiliaria (Search) | 249 | 142 |
| Inversión Dubai - Display | 16 | 7 |
| (not set) cpc | 5 | 0 |

La medición por API del 24 de agosto ya estableció que el 74% de los clics de Display
procedían de Tinder y que el 100% de sus 5.490 clics venían de emplazamientos con cero
conversiones. Frente a esos volúmenes, 16 sesiones en 30 días implica una pérdida
superior al 99% en Display.

**El argumento que descarta el consentimiento como causa principal:** el banner de
cookies es el mismo para Search y para Display, en la misma web y con la misma
configuración. Si la pérdida viniera del consentimiento, ambas campañas perderían un
porcentaje parecido. La diferencia observada es de dos órdenes de magnitud. Lo que
distingue a Display no es el consentimiento: es que el clic se produce dentro de un
navegador embebido de una app de citas y el usuario cierra antes de que la página
llegue a registrarse.

### 1.2 Parte del tráfico sí se registra, pero no se atribuye a Ads

GA4, últimos 30 días:

| Segmento | Sesiones | Con interacción | Rebote |
|---|---:|---:|---:|
| Safari (in-app), medio `(none)` | 28 | **0** | ~100% |
| Entrada en `/index.html`, medio `(none)` | 29 | 1 | 96,6% |

Son clics de anuncio que GA4 **sí contó**, pero el navegador embebido perdió los
parámetros de campaña y quedaron clasificados como Directo. Esto ensancha la
discrepancia por los dos lados a la vez: faltan en Paid y sobran en Direct. No es que
Analytics se invente ni pierda la visita, es que la coloca en el canal equivocado.

### 1.3 Qué aporta realmente el consentimiento

Comprobado en producción: el primer hit sale con `gcs=G100`, es decir, modo de
consentimiento avanzado con `analytics_storage` y `ad_storage` denegados por defecto.
GA4 **sí recibe** ese ping, sin cookies. Google lo suple con modelado de conversiones,
pero el modelado exige un umbral mínimo de volumen que esta propiedad no alcanza (341
`session_start` en 30 días). Resultado: esas visitas no aparecen en los informes
estándar. El efecto existe, es transversal a todos los canales y es menor que los dos
anteriores.

---

## 2. Cuatro destinos de medición donde debería haber dos

Inventario de lo que dispara de verdad en la home, capturado en el navegador:

| Destino | Origen | ¿Documentado? |
|---|---|---|
| `G-BK37V83363` (GA4) | `assets/gtag-init.js`, gtag directo | Sí |
| `AW-586671676` (Ads) | `assets/app.js`, gtag directo | Sí |
| `G-X6LMX9VR0Y` (GA4) | contenedor `GTM-NZV6VJDC` | **No** |
| `AW-18286678153` (Ads) | contenedor `GTM-NZV6VJDC` | **No** |

`G-X6LMX9VR0Y` no se limita a medir: envía a
`https://www.google.com/measurement/conversion` y a `/measurement/1p-conversion/`, o
sea que tiene conversiones vinculadas a Google Ads. Sumado a `AW-18286678153`, esto
confirma y explica el hallazgo del 24 de agosto: **5 conversiones registradas frente a
3 leads reales.**

Es el punto más urgente del correo, porque llega justo cuando se cambia la puja a
maximizar conversiones: el algoritmo se va a entrenar con una señal duplicada.

---

## 3. Cambio de estrategia de puja: qué vigilar

El cambio de maximizar clics a maximizar conversiones es defendible, pero parte de una
base frágil que conviene poner por escrito antes de darle margen:

- **Volumen de señal insuficiente.** GA4, últimos 30 días: `form_submit` 3,
  `lead_submit_attempt` 3. Últimos 7 días: 0 conversiones. Las pujas inteligentes de
  Google piden del orden de 30 conversiones en 30 días para tener referencia. Con 3, el
  algoritmo optimiza sobre ruido.
- **Señal contaminada.** Mientras convivan las dos cuentas de Ads y las dos propiedades
  de GA4 (punto 2), el número de conversiones que ve el algoritmo no es el real.
- **Consecuencia esperable:** CPC más alto y menos alcance, que es lo que Dayvo ya
  anticipa, pero sin la mejora de calidad que lo justificaría, porque la señal sobre la
  que se optimiza está inflada.

**Orden correcto:** limpiar los duplicados de medición primero, y solo después dar
margen al cambio de puja. Fijar de antemano el plazo de evaluación y el criterio de
reversión (umbral de CPL de 150 €, línea base de medición limpia del 20 de agosto).

---

## 4. Página en blanco al recargar: de dónde viene

### 4.1 El mecanismo, medido

La home tiene **21 bloques** con las clases `fade` y `reveal-stagger`. Todos nacen en
`opacity:0` por CSS (`assets/css/home.css:81` y `:110`) y solo se vuelven visibles
cuando `assets/app.js:930` les añade la clase `in` desde un `IntersectionObserver`.

No hay respaldo: ni `<noscript>`, ni regla CSS que los muestre si el script no corre.
(`blog.js:39` sí tiene un respaldo para el caso de que falte `IntersectionObserver`;
`app.js` no lo tiene.)

Medición con `app.js` bloqueado, contra producción:

```
altura de la página:        16.602 px
altura invisible:           11.336 px
porcentaje invisible:       68%
```

**Si `app.js` no llega a ejecutarse, el 68% de la página queda en blanco.** El hero se
ve (no lleva `fade`); todo lo demás desaparece. Es exactamente la descripción del
correo. Páginas afectadas: home (21 bloques) y artículos del blog (5 o 6 cada uno).
`proyectos.html` y `legal.html` no usan estas clases y no se ven afectadas.

### 4.2 Por qué falla en un F5 y se arregla con Ctrl+F5

Cabeceras reales de producción:

| Recurso | Cache-Control |
|---|---|
| HTML | `public, max-age=0, must-revalidate` |
| `/assets/*.js` y `*.css` | `public, max-age=86400, stale-while-revalidate=604800` |
| `/assets/img/*` | `public, max-age=31536000, immutable` |

El HTML se revalida siempre; el JS y el CSS no se piden durante 24 horas, y hasta 7 días
se puede servir una copia caducada mientras revalida por detrás. Un F5 refresca el
documento y deja los assets como están. Un Ctrl+F5 fuerza a bajarlo todo. Esa es
exactamente la firma descrita.

Ese desfase sería inofensivo si el nombre de los ficheros cambiara en cada despliegue.
**No cambia:**

- `index.html` pide `assets/app.js?v=20260819f` y `assets/css/home.css?v=20260819f`.
- Ambos ficheros se modificaron el 24 de agosto (commits `d8015dc` y `e4c2cb4`) **sin
  tocar el token**.
- Hay ahora mismo cambios sin desplegar en `home.css` y `consent.js` que repetirán el
  desfase.

Con el 68% de la página dependiendo de que `app.js` corra entero y sin errores,
cualquier incoherencia entre HTML nuevo y script viejo no se ve como un fallo menor: se
ve como una página en blanco.

### 4.3 Riesgo añadido: imágenes con un año de caché

Las tres imágenes del hero (`hero-dubai-768/1280/1920.webp`) y cinco de proyectos
estaban modificadas y sin desplegar. Se sirven con `immutable` y un año de caché, así
que con el mismo nombre ningún visitante recurrente vería la versión nueva.

**Comprobado antes de decidir:** son recompresiones, no cambios de contenido. Mismas
dimensiones exactas (1920x1280, 1280x853, 768x512) y entre un 5% y un 36% menos de
peso. Quien conserve la copia antigua ve la misma foto, solo que unos KB más pesada.

**Decisión: no se renombran.** Renombrar ocho ficheros y sus treinta y tantas
referencias en HTML y CSS añadiría riesgo de enlaces rotos a cambio de nada visible
para el usuario. La regla queda escrita en el `CLAUDE.md` del proyecto para el caso
que sí importa: **cambiar el contenido de una imagen obliga a renombrarla.**

### 4.4 Hallazgo menor

La CSP bloquea `https://static.cloudflareinsights.com/beacon.min.js`, que Cloudflare
inyecta por su cuenta (Web Analytics / RUM). No afecta a la web, pero significa que esa
medición de Cloudflare no está funcionando. Es el mismo patrón que ya documentamos con
el `robots.txt`: Cloudflare inyecta, el repositorio no se entera.

---

## 5. Correcciones

### Aplicadas el 3 de septiembre de 2026

**1. La web ya es legible sin JavaScript.** Se añade `public/assets/boot.js`, síncrono
en el `<head>` de las 21 páginas que cargan `home.css` o `blog.css`:

- Pone `<html class="js">` antes del primer pintado, así que no hay parpadeo
  (verificado en red lenta: la marca está puesta antes de que el primer bloque `fade`
  exista en el DOM).
- `home.css` y `blog.css` ocultan solo bajo esa marca:
  `html:not(.js) .fade{opacity:1!important}` y equivalentes, siguiendo el patrón que
  ya existía para `html.reduce-motion`.
- `app.js` y `blog.js` añaden `reveal-ok` al registrar el observer. Si 3 segundos
  después de `load` nadie lo ha marcado y hay algo que revelar, `boot.js` retira la
  marca `js` y el contenido aparece. Esto cubre también el caso en que el script sí se
  descarga pero muere antes de llegar al observer.
- Nombre de fichero neutro a propósito: dentro de `gtag-init.js`, un bloqueador de
  anuncios habría dejado la web invisible.

Resultado medido en local, con `app.js` y `blog.js` bloqueados en red:

| Página | Antes | Después |
|---|---:|---:|
| `index.html` | 11.336 px invisibles de 16.602 (68%) | **0 px (0%)** |
| `blog/rentabilidad-inmobiliaria-dubai.html` | 427 px invisibles | **0 px (0%)** |

Con JavaScript funcionando, el comportamiento es idéntico al anterior: `html` queda en
`js reveal-ok` y los bloques se revelan al hacer scroll.

**2. Versionado de assets unificado.** Token nuevo `?v=20260903a` en las **198**
referencias de las **29** páginas. Antes convivían `20260819f`, `20260824a` y los 18
ficheros del blog sin versionar ninguna referencia. Verificado que las 29 páginas
cargan sin errores de JavaScript ni recursos rotos.

**3. Imágenes:** no se renombran, ver §4.3. La regla queda en el `CLAUDE.md` del
proyecto.

### Pendientes, requieren decisión de terceros

| # | Acción | Dónde |
|---|---|---|
| 4 | Auditar el contenedor GTM y retirar `G-X6LMX9VR0Y` y `AW-18286678153` | panel de GTM, lo controla Dayvo |
| 5 | Fijar plazo y criterio de reversión del cambio de puja | acuerdo con Dayvo |
| 6 | Renovar el refresh token de la API de Google Ads | requiere el navegador del usuario, `.claude/CREDENCIALES.md` paso B4 |

---

## Anexo: comprobaciones ejecutadas

- Reproducción con Playwright en Chromium, móvil y escritorio: carga inicial, F5 con
  scroll restaurado, tres recargas encadenadas, vuelta atrás (bfcache), llegada con
  `gclid`. En red buena y caché limpia **no falla**: el observer se recupera. El fallo
  necesita el desfase de caché o un corte en la descarga de `app.js`.
- `app.js` bloqueado en red: 68% de la página invisible (capturas de pantalla tomadas).
- Inventario de destinos de medición interceptando peticiones de red.
- GA4 API: sesiones por origen, campaña, canal, dispositivo, navegador y página de
  entrada; eventos de 30 días.
- Cabeceras HTTP de producción para HTML, CSS, JS e imágenes.
