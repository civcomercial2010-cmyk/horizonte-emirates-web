# Área 4: Google Ads, GA4, medición y atribución

Auditoría estratégica Horizonte Emirates. Fecha de trabajo: 20-08-2026. Modo solo lectura.
Auditor: subagente Área 4. Toda ruta es literal; todo commit está fechado con `git show`.

---

## 0. Conclusión ejecutiva (para el lector con prisa)

1. **Los 2 leads en 30 días se explican por una combinación de tres factores simultáneos, no por uno solo:** techo estructural de demanda de búsqueda en España (hecho verificado), conversión web gravemente dañada por fallos técnicos hasta el 12-08 (hecho verificado) y un periodo con la medición parcialmente rota durante TODA la campaña (hecho verificado: la CSP defectuosa se corrigió el 19-08-2026 a las 17:01, ayer).
2. **La medición es hoy el problema instrumental dominante para decidir:** el 56% de los clics pagados no aparece en GA4, el tramo medio del embudo fue ficticio hasta el 12-08 y las conversiones de Ads están infladas 2,5x. Con estos datos NO se puede separar con precisión "calidad de tráfico" de "conversión web".
3. **La "nueva línea base del 12-08" ya está contaminada:** el 19-08 se corrigió la CSP de medición y además se rediseñó el hero (5 commits entre las 15:48 y las 19:44). La primera ventana de medición limpia y comparable empieza en la práctica el 19/20-08-2026. A fecha de hoy no existe ni un solo dato registrado posterior al 12-08 en ningún archivo del proyecto.
4. **El recuento de leads reales (2) es fiable:** procede de Gmail + Sheets CRM, no de Ads ni de GA4, y uno de los dos leads llegó con `gclid` capturado en el propio envío del formulario. La atribución a nivel de lead existe y es independiente de la telemetría rota.

---

## 1. Fuentes y verificabilidad

| Fuente | Ruta exacta | Estado |
|---|---|---|
| Métricas del funnel | `G:\Mi unidad\Horizonte Emirates\04_metricas.md` (última revisión 09-08-2026) | Leída completa |
| Estado del funnel | `G:\Mi unidad\Horizonte Emirates\05_funnel.md` (actualizado 09-08-2026) | Leída completa |
| Estado del proyecto | `G:\Mi unidad\Horizonte Emirates\01_estado_proyecto.md` (09-08-2026) | Leída completa |
| Tareas (contiene el embudo GA4 del 15-07 al 11-08) | `G:\Mi unidad\Horizonte Emirates\02_tareas.md` (12-08-2026), cabecera y líneas 5-9 | Leídas secciones relevantes |
| Decisiones | `G:\Mi unidad\Horizonte Emirates\03_decisiones.md`, líneas 49-51 | Leídas vía grep |
| Exportaciones de Ads | `G:\Mi unidad\Horizonte Emirates\ads-export\` | **VACÍA** (verificado con listado el 20-08-2026: 0 archivos) |
| Doc GA4 implementación | `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\Analytics\GA4_IMPLEMENTACION_E_INTERPRETACION.md` | Leída completa |
| Doc GA4 dirección | `...\Analytics\GA4_RESUMEN_DIRECCION.md` | Leída completa |
| Taxonomía de eventos | `...\docs\TRACKING_EVENTS.md` | Leída completa |
| Código de medición | `...\public\assets\gtag-init.js`, `gtm-init.js`, `consent.js`, `app.js`, `public\index.html`, `public\_headers` | Leídos (app.js en las secciones de tracking: líneas 5-6, 50-71, 195-234, 540-590, 660-694, 760-797) |
| Roadmap técnico | `...\ROADMAP_AUDITORIA.md` (líneas 24, 26, 190-217) y `...\AUDITORIA_INTEGRAL_2026-06-12.md` (línea 120) | Leídas vía grep |
| Historial git | Repo `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates` (rama main) | `git log` y `git show` sobre commits de medición |
| Diario de actividad | `G:\Mi unidad\Horizonte Emirates\07_diario.md` | Índice de entradas revisado: la última entrada es del 30-07-2026 |

Nota metodológica: no hay acceso a las interfaces de Google Ads ni de GA4. Todo lo que solo vive en esas plataformas (acciones de conversión configuradas, eventos clave marcados, vínculo GA4-Ads, modelo de atribución, tasa de aceptación de cookies) se clasifica como dato_no_disponible.

---

## 2. Cronología verificada de la medición (fechada con git)

| Fecha | Hecho | Evidencia |
|---|---|---|
| 03-06-2026 11:48 | Se instala el consentimiento (Consent Mode v2) y la primera CSP. La CSP nace ya con el defecto: `https://*.analytics.google.com` en connect-src SIN el dominio raíz `analytics.google.com` | commit `59a3088`, verificado con `git show 59a3088:_headers` |
| 03-06-2026 13:10 | Se añade el tag de Google Ads `AW-586671676` con Consent Mode | commit `2e4b37a` |
| 04-06-2026 | Meta Pixel `972040562129072` condicionado a consentimiento | commit `71d51b4` |
| 23-06-2026 16:57 | Se instala GTM `GTM-NZV6VJDC` en las páginas medidas (loader externo `gtm-init.js`). La CSP mantiene el defecto (verificado: `git show 6c62694:public/_headers`) | commit `6c62694` |
| 21-07-2026 | Según `ROADMAP_AUDITORIA.md` línea 26, M06 se cierra: `generate_lead` (GA4) queda como ÚNICA conversión principal en Ads y se retira la acción duplicada "Formulario de contacto - Enviar" | `ROADMAP_AUDITORIA.md` línea 26 |
| 20-07-2026 | Campaña de Búsqueda ACTIVA, 20 EUR/día (gestión Dayvo) | `04_metricas.md` línea 5 |
| 27-07-2026 16:02 | RGPD bloque A: prueba del consentimiento, fin del PII a Ads, cookies granulares | commit `cf51fdb` |
| 05-08-2026 | Campaña Display activa con 2 EUR/día (Búsqueda baja a 18) | `04_metricas.md` línea 20 |
| 09-08-2026 | Informe de términos de búsqueda exportado de Google Ads Editor (1.072 términos). Corrección del diagnóstico del 30-07. Este informe NO está archivado en `ads-export` | `04_metricas.md` líneas 16 y 37-80 |
| 12-08-2026 10:41 y 11:12 | Bloques A y B de conversión: botón de envío vivo (antes nacía `disabled`, no emitía clics y `lead_submit_attempt` era inalcanzable), modal WhatsApp reparado (ROTO desde el 27-07), banner compacto, `form_step_view` pasa a medir de verdad. Se declara "nueva línea base desde el 12-08" | commits `c4723f3` y `3cf3e0b`; `02_tareas.md` líneas 5-9 |
| 19-08-2026 17:01 | **Se corrige la CSP que bloqueaba parte de la medición de Ads y GA4** (detalle en sección 6). La medición estuvo parcialmente bloqueada desde el 03-06 hasta este momento, es decir, durante TODA la campaña | commit `8f58b06`, `git show` con diff de `public/_headers` |
| 19-08-2026 15:48 a 19:44 | Rediseño del hero, precios y prueba social (5 commits) | commits `8e06182`, `cf8e92c`, `bd2cf3e`, `99c7c4a`, `e637e33`, `d277773`, `340932d` |

Lectura crítica: la campaña (20-07 en adelante) ha convivido SIEMPRE con al menos uno de estos dos defectos: eventos de embudo falsos o inalcanzables (hasta el 12-08) y CSP bloqueando endpoints de medición (hasta el 19-08). No ha existido todavía ni un día completo de campaña con la medición íntegra, porque la CSP se arregló ayer a las 17:01.

---

## 3. Reconstrucción del funnel con los datos que existen

### 3.1 Dos fotos disponibles (no son el mismo periodo ni el mismo perímetro)

| Etapa | Foto A: Búsqueda, 20-07 al 08-08 | Foto B: hasta el 11-08 (total) | Fuente |
|---|---|---|---|
| Impresiones | 2.419 | 4.698 | A: `04_metricas.md` línea 14; B: `02_tareas.md` línea 5 |
| Clics | 252 (CTR 10,42%) | 476 | ídem |
| Coste | 253,23 EUR | ~490 EUR | ídem |
| Usuarios GA4 | dato_no_disponible para este corte | 210 usuarios (ventana GA4 15-07 al 11-08) | `02_tareas.md` línea 9 |
| Clics pagados SIN sesión en GA4 | dato_no_disponible | **266 de 476 (56%)** | `02_tareas.md` línea 9 |
| Clic en CTA hacia formulario (`generate_lead_click`) | dato_no_disponible | 13 | ídem |
| "Veían el formulario" (`form_step_view`) | ficticio | 114, **dato ficticio: se disparaba al cargar la página** | ídem |
| Inicios reales de formulario | no medible (evento falso) | ~5 (estimación propia del proyecto) | ídem |
| Intentos de envío (`lead_submit_attempt`) | **inalcanzable en el código** hasta el 12-08 | ídem | `02_tareas.md` línea 5; comentario en `public\assets\app.js` líneas 195-198 |
| Envíos con éxito (`generate_lead` del form principal) | 2 | 2 | `04_metricas.md` líneas 150-153 |
| Leads válidos en CRM (Gmail + Sheets) | 2 | 2 | ídem |
| Conversión clic a lead | 0,79% | **0,42%** | cálculo directo; el 0,42% consta en `03_decisiones.md` línea 51 |
| CPL | 126,61 EUR | ~245 EUR | `04_metricas.md` línea 14; `02_tareas.md` línea 5 |

### 3.2 Ratios intermedios calculables (solo Foto B, con las salvedades dichas)

| Tramo | Ratio | Lectura |
|---|---|---|
| Clic pagado a usuario GA4 | 210/476 = 44% | El 56% del tráfico pagado es invisible para GA4. Causas candidatas en sección 5.2 |
| Usuario a clic en CTA | 13/210 = 6,2% | Bajo, pero el CTA estuvo tapado por el banner de cookies en cada primera visita móvil hasta el 12-08 (`02_tareas.md` línea 5, hallazgo 3) |
| CTA a inicio real | ~5/13 = ~38% | Estimación, no medición |
| Inicio a envío | 2/5 = 40% | Estimación sobre estimación |
| Clic a lead (fin a fin) | 2/476 = 0,42% | Contra el 2-5% que el propio proyecto cita como estándar (`05_funnel.md` línea 41) |

### 3.3 Anomalía entre las dos fotos: los 3 días del 08-08 al 11-08

Entre la Foto A y la Foto B hay 3 días de diferencia y el delta es: +2.279 impresiones, +224 clics, +~237 EUR y 0 leads. Un delta de ~237 EUR en 3 días es incompatible con un presupuesto de 20 EUR/día (máximo teórico razonable: 60-120 EUR). Explicaciones posibles, no verificables sin exportación de Ads:

1. Los 253,23 EUR de la Foto A salen de **sumar el informe de términos de búsqueda**, que por umbrales de privacidad de Google omite términos de bajo volumen. Con 1.072 términos a 2,3 impresiones de media, la cola omitida puede ser grande. En ese caso los 253,23 EUR y el CPL de 126,61 EUR estarían INFRAESTIMADOS de origen (el gasto real de Búsqueda a 08-08 sería mayor). Clasificación: inferencia, confianza media.
2. La Foto B (~490 EUR) incluye Display y el perímetro completo de la cuenta; la Foto A solo Búsqueda vía informe de términos. Compatible con la nota de `04_metricas.md` línea 20 ("su gasto NO está en la tabla").
3. Los 224 clics nuevos en 3 días con 0 leads apuntan a **clics de Display de bajísimo coste y nula calidad** (el commit `8f58b06` afirma: "el grueso sigue siendo el tráfico de Display que no llega a la web"). Clasificación: hipótesis del propio proyecto, confianza media.

Consecuencia dura: **el CPL "oficial" de 126,61 EUR no es un dato sólido.** Es un cociente entre un numerador fiable (2 leads del CRM) y un denominador dudoso (gasto reconstruido desde un informe que no cubre todo). El CPL real a 11-08 era ~245 EUR, por encima del umbral de 150 fijado en `04_metricas.md` línea 161.

---

## 4. Configuración de conversiones: qué está bien y qué está inflado

### 4.1 Arquitectura (hecho verificado, en código)

- **Vía elegida: importación GA4 a Ads.** `generate_lead` es el único evento clave documentado y se importa a Ads como conversión principal (`docs\TRACKING_EVENTS.md` línea 13; `ROADMAP_AUDITORIA.md` líneas 24 y 26; `AUDITORIA_INTEGRAL_2026-06-12.md` línea 120).
- **El tag nativo de Ads NO dispara, a propósito:** `public\assets\app.js` línea 6 tiene `ADS_CONVERSION_LABEL=''` y la línea 211 (`if(!ADS_CONVERSION_ID || !ADS_CONVERSION_LABEL)return;`) hace que `trackAdsLeadConversion()` retorne siempre sin enviar. Esto evita el doble conteo GA4+nativo. Correcto como diseño.
- Consecuencia: la deduplicación por `transaction_id` con hash del email (app.js líneas 217-222) y las enhanced conversions con SHA-256 (líneas 230-233) son **código muerto** mientras la etiqueta esté vacía. La vía GA4 importada NO tiene esa deduplicación.

### 4.2 Tres disparadores de `generate_lead` (hecho verificado, en código)

| Disparador | Ubicación en `public\assets\app.js` | `form_name` | Valor |
|---|---|---|---|
| Formulario principal enviado con éxito | línea 557 | `contact_form` | por tier (A 300, B 120, C 40 EUR) |
| Descarga de la guía fiscal (lead magnet) | línea 679 | `lead_magnet_guia` | 40 EUR (tier C) |
| Mini formulario del modal de WhatsApp | línea 779 (atribución añadida el 12-08, Bloque B, `02_tareas.md` línea 7) | `whatsapp_modal` | 40 EUR (tier C) |

Implicación: una "conversión" en Ads ya NO equivale a un lead del formulario principal. Una descarga de guía o un envío del modal WA cuentan igual que un lead cualificado, y la misma persona puede generar 2 o 3 eventos `generate_lead` en una sesión (guía + formulario). La vía GA4 importada no deduplica entre formularios.

### 4.3 La inflación observada: 5 conversiones en Ads frente a 2 leads reales (factor 2,5x)

- Hecho documentado en `04_metricas.md` línea 22 y `05_funnel.md` línea 40 (corte 09-08).
- Detalle sospechoso: "pisos dubai" figura con 4 clics y 4 conversiones (`04_metricas.md` línea 28). Una conversión por clic es un patrón de evento que dispara casi siempre, no de un lead real. Solo 1 de los 2 leads reales tiene `gclid` documentado (`04_metricas.md` línea 151).
- Causas candidatas de las 3 conversiones sobrantes (ninguna verificable sin acceso a Ads/GA4):
  1. Eventos clave "fantasma" en GA4 que el sitio no dispara pero siguen marcados: `purchase`, `qualify_lead`, `close_convert_lead`, `manual_event_SUBMIT_L` (`docs\TRACKING_EVENTS.md` líneas 61-72, sección "a ELIMINAR"). Si alguno está también importado en Ads, infla el contador. Clasificación: hipótesis, confianza media.
  2. Conversiones de guía o WhatsApp contadas como leads (sección 4.2). Hipótesis, confianza media.
  3. Recuento "una por evento" en vez de "una por clic" en la acción importada. Hipótesis, confianza baja.
- **Contradicción documental sin resolver:** `ROADMAP_AUDITORIA.md` línea 26 da M06 por CERRADA el 21-07 (única conversión principal, duplicado retirado), pero `04_metricas.md` línea 22 (del 09-08) atribuye el doble conteo a "M06 sin cerrar". Ambos no pueden ser ciertos a la vez. O el cierre del 21-07 no se ejecutó de verdad en la plataforma, o el doble conteo del 09-08 tiene otra causa. Dato_no_disponible sin entrar en la interfaz de Ads.
- Decisión vigente del usuario (09-08, `04_metricas.md` línea 22): no corregirlo porque la puja es "Maximizar clics" y no usa conversiones. Es defendible A CORTO PLAZO, pero deja dos minas: (a) cualquier lectura de "conversiones" en Ads o en el informe de términos es 2,5x optimista, y ya contaminó la tabla "términos que convierten"; (b) el paso a puja por conversiones (el camino natural del canal) exige resolverlo antes.

---

## 5. Huecos de medición: lo que HOY no se puede saber y por qué

| # | Hueco | Por qué no se puede saber | Clasificación |
|---|---|---|---|
| H1 | Datos brutos de la cuenta de Ads (campañas, grupos, keywords, geo, dispositivo, horas, Display) | `G:\Mi unidad\Horizonte Emirates\ads-export\` está VACÍA (verificado 20-08). El informe de términos del 09-08 citado en `04_metricas.md` no está archivado en el proyecto | dato_no_disponible |
| H2 | Gasto y clics reales de Búsqueda | La única fuente es la suma del informe de términos, que omite términos bajo umbral de privacidad | dato_no_disponible (magnitud del sesgo desconocida) |
| H3 | Métricas de la campaña Display (activa desde el 05-08) | Excluida por diseño del informe de términos; solo hay una estimación de gasto "6 a 8 EUR" en `04_metricas.md` línea 20, incompatible con los deltas de la sección 3.3 | dato_no_disponible |
| H4 | Descomposición del 56% de clics sin sesión GA4 (consent denegado vs CSP vs Display que no carga vs rebote pre-tag) | Requeriría comparar clics por campaña con sesiones por fuente en GA4, y no hay exportaciones de ninguna de las dos plataformas | dato_no_disponible |
| H5 | Tasa de aceptación del banner de cookies | El evento `consent_decision` existe en el código (`consent.js` líneas 197-203) desde el 27-07, pero no hay ningún volcado de sus datos | dato_no_disponible |
| H6 | Embudo intermedio real ANTERIOR al 12-08 (`form_step_view` disparaba al cargar; `lead_submit_attempt` inalcanzable) | Defecto de instrumentación, corregido el 12-08 (`02_tareas.md` líneas 5 y 9). Los datos históricos son irrecuperables | dato_no_disponible (permanente) |
| H7 | Cualquier métrica POSTERIOR al 12-08 (la "nueva línea base") | Nadie la ha registrado: `04_metricas.md` se actualizó por última vez el 09-08, el diario termina el 30-07 y `ads-export` está vacía. A 20-08 la nueva línea base tiene 0 datos anotados | dato_no_disponible |
| H8 | Configuración real dentro de GA4 (eventos clave marcados, vínculo con Ads, modelo de atribución, retención de datos) | Sin exportación ni captura de la interfaz. `TRACKING_EVENTS.md` documenta 4 eventos clave fantasma pendientes de desmarcar, sin confirmación de que se hiciera | dato_no_disponible |
| H9 | Contenido del contenedor GTM `GTM-NZV6VJDC` (si alguien añadió tags GA4/Ads duplicados dentro) | El contenedor vive en la plataforma GTM, no en el repo. El código carga gtag directo (G y AW en `gtag-init.js` líneas 23-24) MÁS el contenedor GTM en paralelo (`index.html` líneas 45-48): si el contenedor duplicara la config, habría doble medición y no sería visible desde el repo | dato_no_disponible |
| H10 | Si la "expansión de URL final / AI Max" desvía clics pagados al blog | Tarea ADS-AUTOMATISMOS abierta y marcada "Sin verificar" (`02_tareas.md` línea 35) | dato_no_disponible |
| H11 | Cuota de impresiones y presión competitiva del mercado ES | No hay ningún informe de subastas archivado | dato_no_disponible |
| H12 | Volumen perdido por la CSP (sección 6): cuántos eventos GA4 fueron al endpoint bloqueado | Los hits bloqueados por CSP no dejan rastro en servidor; solo la consola del navegador los mostraba | dato_no_disponible (permanente) |

---

## 6. El periodo con la CSP bloqueando la medición (hecho verificado)

**Commit `8f58b06`, fechado con `git show`: 19-08-2026 17:01:52 +0200.** Un solo archivo cambiado: `public\_headers`. El mensaje del commit (verificable en el repo) documenta 4 destinos bloqueados hasta ese momento:

| Destino bloqueado | Función | Efecto del bloqueo |
|---|---|---|
| `analytics.google.com` (raíz) en connect-src | Endpoint de recogida de GA4; la política tenía `https://*.analytics.google.com` y el comodín NO cubre el dominio raíz | Los eventos GA4 que salían por ese endpoint se PERDÍAN |
| `stats.g.doubleclick.net` | Recolector de Google Signals | Las audiencias de remarketing no se alimentaban |
| `ad.doubleclick.net` | Conversion linker de Google Ads | Atribución de conversiones degradada |
| `googleads.g.doubleclick.net` en script-src | Script de conversión de Ads (estaba permitido para conectar pero no para cargarse) | Parte del circuito de conversión de Ads sin cargar |

Antigüedad del defecto, verificada commit a commit: presente ya en la primera CSP del **03-06-2026** (`git show 59a3088:_headers`) y en la del 23-06 (`git show 6c62694:public/_headers`, solo `https://*.analytics.google.com`, sin la raíz). **Toda la campaña (20-07 a 19-08) corrió con este defecto.**

Alcance real del daño: PARCIAL, no total. El grueso de los hits de GA4 sale por `*.google-analytics.com`, que SÍ estaba permitido; por eso GA4 registró 210 usuarios y 2 `generate_lead`. Lo perdido: la fracción de hits al endpoint raíz (no cuantificable, H12), las audiencias de Signals durante 2,5 meses (el pool de remarketing planificado como palanca está más vacío de lo que se cree) y precisión de atribución del linker. El propio commit estima que la CSP explica "parte" del hueco clics-sesiones y atribuye "el grueso" a Display. Clasificación del reparto: hipótesis del proyecto, confianza media.

Implicación operativa: **cualquier comparación antes/después del 12-08 usando GA4 mezcla tres regímenes de medición distintos** (eventos falsos hasta el 12-08; eventos buenos con CSP rota del 12 al 19-08; todo corregido desde el 19-08 a las 17:01). La ventana limpia empieza el 19/20-08.

---

## 7. Efecto del Consent Mode sobre los datos (hecho verificado en código, efecto inferido)

Configuración verificada:

- `public\assets\gtag-init.js` líneas 9-21: default TODO denegado (`ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`), `wait_for_update: 500`, y `ads_data_redaction: true` (sin consentimiento publicitario, Google elimina el `gclid` de los pings de conversión).
- `public\assets\consent.js`: banner granular en primera visita (analítica y publicidad por separado), decisión guardada 12 meses, `gtag('consent','update')` al decidir. No existe `url_passthrough` en la configuración (verificado en `gtag-init.js`: no aparece).

Efectos sobre los números (inferencia, confianza alta en el mecanismo, media en la magnitud):

1. **Usuarios que rechazan o no deciden son casi invisibles en GA4.** Con `analytics_storage` denegado solo salen pings sin cookie. El modelado de comportamiento y de conversiones de Google exige umbrales de volumen (del orden de 1.000+ usuarios diarios con consentimiento) que esta propiedad, con 210 usuarios en 28 días, no roza. Conclusión: aquí el Consent Mode NO recupera nada por modelado; lo denegado se pierde del todo. Este es probablemente el mayor contribuyente al 56% de clics sin sesión, junto con Display.
2. **Conversiones de Ads de usuarios sin consentimiento publicitario pierden el `gclid`** (por `ads_data_redaction`), así que Ads no puede atribuirlas a la campaña. Las 5 conversiones que Ads sí muestra provienen de usuarios que aceptaron.
3. **El CRM es inmune al consentimiento:** `app.js` líneas 51-71 capturan `gclid/gbraid/wbraid/utm_*` de la URL a sessionStorage y los adjuntan al envío de Web3Forms. Por eso el lead de Jose Diaz (29-07) consta con `gclid` (`04_metricas.md` línea 151) aunque la telemetría estuviera coja. La verdad de atribución a nivel de lead vive en el CRM, no en Ads ni en GA4. (Nota de cumplimiento, fuera del alcance de esta área: esa captura opera antes de la decisión de cookies; se apoya en sessionStorage, no en cookies, pero conviene que lo revise el área RGPD.)
4. Efecto colateral positivo ya corregido: hasta el 12-08 el banner además TAPABA el CTA y el botón de WhatsApp en la primera visita móvil (hallazgo 3 del 12-08, `02_tareas.md` línea 5), con el 85,1% de los clics llegando por móvil (`04_metricas.md` línea 129). El banner no solo sesgaba la medición: suprimía la conversión.

---

## 8. Respuesta a la pregunta de la auditoría: ¿tráfico, calidad, conversión web o medición?

Respuesta corta: **no hay un único culpable; hay un techo de tráfico real, una conversión web que estuvo rota durante casi todo el periodo medido, y una medición que impide hoy repartir culpas con precisión entre las dos anteriores.** Por dimensión:

| Dimensión | Veredicto | Evidencia y confianza |
|---|---|---|
| **Tráfico (volumen)** | ES un límite estructural real. "invertir dubai" obtuvo 13 impresiones en 8 días; el volumen total es de ~121 impresiones/día; 1.072 términos para 2.419 impresiones (2,3 por término). Con búsqueda en España y 20 EUR/día, el techo realista que el propio proyecto estima es de 2-3 leads/mes, no 10 | hecho_verificado (los números, `04_metricas.md` líneas 68, 77, 123) + inferencia (el techo), **confianza alta** |
| **Calidad de tráfico** | Mixta y PEOR desde el 05-08. La Búsqueda convierte (2 leads, incluso desde keywords residenciales, `04_metricas.md` líneas 52-54), pero los 224 clics en 3 días sin un solo lead tras activar Display, y la afirmación del commit `8f58b06` de que el grueso del hueco clics-sesiones es "tráfico de Display que no llega a la web", apuntan a que Display compra clics basura. Además: lista de exclusión de emplazamientos asignada a 0 campañas (`04_metricas.md` línea 79) | inferencia sobre Display, **confianza media** (sin exportación de Display no es demostrable, H3) |
| **Conversión web** | FUE el problema dominante del periodo medido. 0,42% fin a fin contra un 2-5% estándar, con tres fallos técnicos demostrados y activos casi toda la campaña: botón de envío nacido `disabled` que no emitía nada, modal de WhatsApp ROTO desde el 27-07 (un canal entero muerto durante 16 días de campaña) y banner tapando el CTA en cada primera visita móvil (85% del tráfico). Corregidos el 12-08 | hecho_verificado (fallos y fechas: `02_tareas.md` línea 5, commits `c4723f3`/`3cf3e0b`), **confianza alta**. Si la corrección funcionó: dato_no_disponible (H7, nadie ha registrado datos posteriores) |
| **Medición** | Es el problema INSTRUMENTAL dominante hoy. No causa la falta de leads (los 2 leads reales se cuentan por Gmail/CRM y eso es fiable), pero: 56% de clics invisibles en GA4, embudo intermedio ficticio hasta el 12-08, conversiones Ads infladas 2,5x, CSP rota hasta AYER, carpeta de exportaciones vacía y línea base nueva sin un solo dato anotado. Con esto no se puede responder con rigor "cuánto es calidad y cuánto es landing", que es exactamente la decisión que el proyecto necesita tomar | hecho_verificado en cada componente, **confianza alta** |

Síntesis final orientada a decisión: los 2 leads en 30 días son el producto de (volumen bajo real) x (conversión suprimida por fallos técnicos durante el 75% del periodo) x (un canal Display que probablemente diluye los clics sin aportar nada). La medición no quitó leads, pero ha impedido ver esto a tiempo y sigue impidiendo evaluar si el arreglo del 12-08 funcionó. La primera semana de datos limpios posible es la que empieza el 19/20-08, y solo si alguien archiva los datos: hoy el proyecto no tiene proceso que persista exportaciones (H1, H7).

---

## 9. Riesgos de decisión inmediatos derivados de esta área

1. **No pasar a puja por conversiones sin cerrar antes la limpieza de conversiones** (duplicados 2,5x + eventos fantasma de GA4 + tres disparadores de `generate_lead` con valor idéntico para guía y WA). Smart Bidding optimizaría hacia descargas de guía de 40 EUR en vez de leads A de 300 EUR.
2. **No juzgar el Bloque A/B del 12-08 con datos del 12 al 19-08:** ese tramo aún tenía la CSP rota y el 19-08 se volvió a cambiar el hero. Ventana de evaluación honesta: desde el 20-08.
3. **Recalcular el CPL con el gasto real de la cuenta,** no con la suma del informe de términos. El CPL "oficial" de 126,61 EUR probablemente infraestima el gasto y a 11-08 el CPL real era ~245 EUR, por encima del umbral de 150.
4. **Auditar o pausar Display:** 2 EUR/día nominales que, según los indicios (sección 3.3), generan cientos de clics que no llegan a la web y contaminan todas las tasas.
5. **Instaurar el archivado semanal en `ads-export`** (ya previsto en `04_metricas.md` línea 35 como "datos a pedir a Dayvo cada semana"): a día de hoy esa carpeta lleva vacía desde su creación (28-07 según fecha del directorio) y ninguna afirmación sobre Ads es re-verificable.

---

## 10. Archivos revisados

1. `G:\Mi unidad\Horizonte Emirates\04_metricas.md` (completo)
2. `G:\Mi unidad\Horizonte Emirates\05_funnel.md` (completo)
3. `G:\Mi unidad\Horizonte Emirates\01_estado_proyecto.md` (completo)
4. `G:\Mi unidad\Horizonte Emirates\02_tareas.md` (líneas 1-40)
5. `G:\Mi unidad\Horizonte Emirates\03_decisiones.md` (líneas 49-51, vía grep)
6. `G:\Mi unidad\Horizonte Emirates\ads-export\` (listado: VACÍA)
7. `G:\Mi unidad\Horizonte Emirates\07_diario.md` (índice de entradas; última: 30-07-2026)
8. `C:\...\Horizonte Emirates\Analytics\GA4_IMPLEMENTACION_E_INTERPRETACION.md` (completo)
9. `C:\...\Horizonte Emirates\Analytics\GA4_RESUMEN_DIRECCION.md` (completo)
10. `C:\...\Horizonte Emirates\docs\TRACKING_EVENTS.md` (completo)
11. `C:\...\Horizonte Emirates\public\assets\gtag-init.js` (completo)
12. `C:\...\Horizonte Emirates\public\assets\gtm-init.js` (vía grep, cabecera)
13. `C:\...\Horizonte Emirates\public\assets\consent.js` (completo)
14. `C:\...\Horizonte Emirates\public\assets\app.js` (secciones de tracking: líneas 5-6, 50-89, 190-249, 540-604, 660-694, 760-797)
15. `C:\...\Horizonte Emirates\public\index.html` (líneas 40-59) y grep de IDs sobre todo `public\` (21 páginas con G-BK37V83363 + GTM-NZV6VJDC)
16. `C:\...\Horizonte Emirates\public\_headers` (versiones actual, `6c62694` y `59a3088` vía git)
17. `C:\...\Horizonte Emirates\ROADMAP_AUDITORIA.md` (líneas 24, 26, 190-217, vía grep)
18. `C:\...\Horizonte Emirates\AUDITORIA_INTEGRAL_2026-06-12.md` (línea 120, vía grep)
19. Historial git del repo: `git log` de `_headers`, `gtm-init.js`, `consent.js` y commits desde el 10-08; `git show` de `8f58b06`, `59a3088`, `2e4b37a`, `6c62694`, `cf51fdb`, `c4723f3`, `3cf3e0b`

## 11. Archivos o fuentes NO disponibles

1. `G:\Mi unidad\Horizonte Emirates\ads-export\*`: carpeta vacía, no hay ninguna exportación de Google Ads archivada.
2. Interfaz de Google Ads (acciones de conversión, campañas, Display, subastas): sin acceso.
3. Interfaz de GA4 `G-BK37V83363` (eventos clave marcados, vínculo con Ads, informes): sin acceso.
4. Contenedor GTM `GTM-NZV6VJDC` (su contenido no vive en el repo): sin acceso.
5. Informe de términos de búsqueda del 09-08 (1.072 términos) citado en `04_metricas.md`: no archivado en el proyecto.
6. Datos de la tasa de aceptación de cookies (`consent_decision`): sin volcado en ninguna parte.
