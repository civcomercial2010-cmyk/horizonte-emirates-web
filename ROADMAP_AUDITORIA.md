# Roadmap de Auditoría — Horizonte Emirates

Tablero vivo derivado de la auditoría senior (web + funnel + negocio).
Estado: ✅ hecho · 🟡 en curso · ⬜ pendiente · 🔒 bloqueado (terceros)

_Última actualización: 2026-06-04_

---

## FASE 0 — Blindaje (antes de invertir en tráfico)

| ID | Mejora | H | Estado | Nota |
|---|---|---|---|---|
| M01 | Firmar Referral Agreement con RRS (tail, atribución, no-circumvention, % base) | H01 | 🟡 | Borrador validado; firma prevista semana del 09/06. Ampliación de objeto social ya realizada |
| M02 | Verificar que el Google Sheet de leads es privado | H06 | ✅ | Confirmado: sin acceso en incógnito |
| M03 | Mover `SPREADSHEET_ID` + email del agente a Script Properties | H06 | ✅ | **Cerrada.** Properties `HE_SPREADSHEET_ID`/`HE_AGENT_EMAIL` creadas en "HE Email Automation", código pegado y verificado. Telegram está en proyecto Apps Script aparte → repetir properties allí al activarlo |
| M04 | Activar la conversión de Google Ads | H03 | ✅ | Resuelto por vía A (importación GA4→Ads). `ADS_CONVERSION_LABEL` queda vacío a propósito (no se usa etiqueta nativa, evita doble conteo) |
| M05 | Mapear `value` de `generate_lead` a € por tier | H07 | ✅ | `LEAD_VALUE_EUR={A:300,B:120,C:40}` aplicado a GA4 + Ads + Meta |
| M06 | Vincular GA4 ↔ Ads e importar `generate_lead` | — | ✅ | `generate_lead` (GA4) importado y como conversión **Principal** en Ads (objetivo "Envío de formulario para clientes potenciales"). Pendiente menor: dejar SOLO esa acción como principal |

## FASE 1 — Cierre de fugas y validación E2E
| ID | Mejora | H | Estado |
|---|---|---|---|
| M07 | Prueba end-to-end real del funnel | — | ✅ | Re-test validado: llegan nombre/teléfono/capital/objetivo/plazo/viaje/canal. Bug de parseo (emojis→mojibake) corregido y desplegado. Columnas UTM vacías = correcto (solo se rellenan con tráfico de campañas) |
| M08 | Healthcheck del pipeline (alerta 0 leads/72h) | H04 | ✅ | `healthCheck()` implementado y **activado** (código pegado + forzarPollGmail + createTriggers + probado). Trigger cada hora; alerta ante leads atascados, pollGmail caído o errores de Cola |
| M09 | Reducir fragilidad de captura (anti-SPAM + fallback) | H04 | ⬜ |
| M10 | Unificar taxonomía de eventos GA4 | H19 | ✅ | Taxonomía documentada en `docs/TRACKING_EVENTS.md`. Eventos clave fantasma (`purchase`, `qualify_lead`, `close_convert_lead`, `manual_event_SUBMIT_L`) desmarcados en GA4; solo `generate_lead` como evento clave |
| M11 | Limpiar código muerto `captureUTM()` | H14 | ✅ | Eliminada la escritura a inputs `utm_*` inexistentes; persistencia en sessionStorage intacta. Desplegado (`74de19c`) |
| M12 | Fallback `<noscript>` del formulario | H18 | ✅ | Aviso `<noscript>` con email + WhatsApp si JS está desactivado. Desplegado |
| M13 | Restricción de dominio / anti-abuso Web3Forms | — | ⬜ |

## FASE 2 — Legal y confianza
| ID | Mejora | H | Estado |
|---|---|---|---|
| M14 | Identificación registral completa en `legal.html` | H10 | ✅ | Propulse SLU + NRT L-719841-W + domicilio (C. Doctor Molines 23, AD500 Andorra la Vella) en política de privacidad y aviso legal. Desplegado |
| M15 | Firmar SCC/DPA con RRS y Web3Forms | H10 | 🔒 |
| M16 | Citar fuente y fecha en cada claim de rentabilidad | H12 | ✅ | Bloque "Fuentes y metodología" (`#fuentes`) en el footer + enlaces desde la nota de la tabla comparativa y una línea bajo los KPI. Atribuye: transacciones → Dubai Land Department; rentabilidades/revalorización → JLL, Knight Frank + portales (Property Finder, Bayut); 0% → marco fiscal UAE. Fecha 2024–2025. Desplegado (`6bbd333`). PENDIENTE de confirmación del usuario: cifras exactas (el "334.000 UAE 2025" y si el 6–9% es neto o bruto) para, si procede, citar informe/año concretos |
| M17 | Añadir prueba social verificable | H08 | ⬜ |

## FASE 3 — Captación propia (SEO/CRO)
| ID | Mejora | H | Estado |
|---|---|---|---|
| M18 | Plan editorial SEO (8–12 guías) | H09 | ⬜ |
| M19 | Lead magnet (guía fiscal) | — | ⬜ |
| M20 | JSON-LD `ItemList`/`Residence` + breadcrumb en proyectos | H20 | ✅ | BreadcrumbList + ItemList(Residence) en `proyectos.html`, sin precios. Desplegado (`bf5b6ba`). Validar en Rich Results Test |
| M21 | Política robots de IA + resolver doble `User-agent: *` | H11 | ⬜ |
| M22 | Corregir enlazado interno (footer → proyectos; quitar doble "Zonas") | — | ✅ | Footer enlaza a proyectos.html y al formulario; eliminado el doble enlace "Zonas". Desplegado (`bf5b6ba`) |
| M23 | Persistencia de progreso + validación inline del formulario | H16 | ✅ | Estado del formulario en sessionStorage (recarga no borra pasos/datos; se limpia al enviar) + validación inline email/teléfono al salir del campo. Desplegado |
| M24 | Activar Telegram + nurturing con contenido real | — | ⬜ |

## FASE 4 — Hardening (seguridad / performance / accesibilidad)
| ID | Mejora | H | Estado |
|---|---|---|---|
| M25 | Externalizar JS/CSS comunes | H05 | ✅ | JS externalizado en las 3 páginas: `assets/gtag-init.js`, `assets/app.js`, `assets/proyectos.js`; manejadores `onclick`/`onchange` sustituidos por listeners. Sintaxis validada con node. Desplegado |
| M26 | Eliminar `'unsafe-inline'` de `script-src` | H05 | ✅ | Retirado del `<meta>` CSP de las 3 páginas, de `_headers` y del header CSP en Cloudflare (hecho por el usuario). Verificado en consola: 0 errores de inline-script; web funcional. `style-src` mantiene unsafe-inline (a propósito). Añadido `pagead2.googlesyndication.com` a connect-src (Ads). Pendiente menor: desactivar Cloudflare Web Analytics (beacon bloqueado, preexistente) |
| M27 | Resolver Google Fonts render-blocking (self-host/preload) | — | ⬜ |
| M28 | Optimizar animación KPI "tragaperras" (INP) | H13 | ⬜ |
| M29 | Contraste AA del dorado de marca | H17 | ✅ | `--gold-text:#9A7016` aplicado a texto pequeño sobre fondo claro (eyebrow, proc-tag, s-range/pill, zone-tag, deliver-t, form-scarcity). Dorado de marca intacto en grande/oscuro. Desplegado |
| M30 | `404.html` + HSTS 2 años + revisar ACAO | H21 | 🟡 | `404.html` con identidad de marca creada y desplegada (`74de19c`). Pendiente en Cloudflare: subir HSTS a 2 años y revisar `Access-Control-Allow-Origin: *` |
| M31 | Validar JSON-LD + Lighthouse final ≥90 | — | ⬜ |

## FASE 5 — Escalabilidad y mejora continua
| ID | Mejora | H | Estado |
|---|---|---|---|
| M32 | Cerrar segundo partner (anti-concentración) | H02 | 🔒 |
| M33 | Migrar captura a webhook directo / ActiveCampaign | H04 | ⬜ |
| M34 | Conversions API server-side (Meta/Google) | — | ⬜ |
| M35 | Dashboard de funnel (CPL, CVR, lead→cierre, € por tier) | — | ⬜ |
| M36 | Higiene de repo (carpeta v2 a rama, robots repo, nombres de imágenes) | H15 | 🟡 | Carpeta `v2` añadida a `.gitignore` (deja de figurar como pendiente). Renombrado de imágenes con espacios/acentos: pendiente (las URLs codificadas funcionan; cosmético) |
| M37 | Sesgar inversión a ticket alto (≥300k) | — | ⬜ |

---

## Registro de actividad (tareas realizadas)

### 2026-06-04
- **M02 ✅** — Verificado que el Google Sheet de leads es privado (sin acceso en incógnito).
- **M03 ✅** — `SPREADSHEET_ID` y email del agente movidos a Script Properties (`HE_SPREADSHEET_ID`, `HE_AGENT_EMAIL`) en `horizonte-emails.gs`, `import_projects.gs`, `matching_engine.gs`, `telegram_oportunidades.gs`; referencias generalizadas en `SETUP.md`. Verificado: 0 ocurrencias del ID/email personal en `automation/`.
- **M05 ✅** — Valor de conversión por tier (`LEAD_VALUE_EUR`) aplicado a `generate_lead` (GA4), conversión de Ads y `fbq Lead`; añadido `lead_score` como parámetro custom.
- **M04 / M06 🟡** — Código preparado para ambas vías; pendiente decisión + acción en plataforma.
- **H01 🟡** — Contrato RRS: borrador validado, firma prevista semana del 09/06; ampliación de objeto social realizada.
- **M03 ✅ CERRADA** — Usuario creó las Script Properties (`HE_SPREADSHEET_ID`, `HE_AGENT_EMAIL`) en "HE Email Automation" + pegó el código. Detectado: `telegram_oportunidades.gs` vive en un proyecto Apps Script distinto (allí está `TG_BOT_TOKEN`) → repetir las dos properties en ese proyecto cuando se active.
- **M04 + M06 ✅** — `generate_lead` (GA4) importado en Ads como conversión principal (vía A). DebugView vacío pero Tiempo Real muestra `generate_lead`=1 → tracking validado. **Atención doble conteo:** el objetivo "Envío de formulario" tiene 2 acciones principales (`generate_lead` GA4 + "Formulario de contacto - Enviar"); dejar solo `generate_lead` como principal. M07 parcial: falta verificar Sheet + email de bienvenida.
- **DEPLOY** — Commit `409fd57` + push a `main`: fix M07 (nombres de campo ASCII) + M05 (valor por tier) desplegados a GitHub Pages. M03 (.gs) versionado. Incluye trabajo previo del usuario (rediseño de publicación de Telegram). Pendiente: re-test E2E cuando propague el deploy.
- **🔴 HALLAZGO CRÍTICO NUEVO (seguridad)** — El token del bot de Telegram (`8358149283:AAF…poX8`) estuvo **hardcodeado y commiteado en el historial público de GitHub** (commits anteriores a `409fd57`). El working tree ya lo movió a `TG_BOT_TOKEN` (Script Properties), pero el token sigue visible en el historial. **ACCIÓN URGENTE (M38): revocar en @BotFather (/revoke) y generar uno nuevo; guardarlo en `TG_BOT_TOKEN` del proyecto Apps Script de Telegram.** El token viejo debe considerarse comprometido.
- **M07 FIX aplicado** — Causa raíz confirmada con `debugPollLatestWeb3Lead`: los campos del email Web3Forms usaban nombres decorativos con emojis/'·' que llegan con mojibake (UTF-8 leído como Latin-1: `Contacto Â· ðŸ‘¤ Nombre`) y rompen `parseLeadFromEmail`. Fix en `index.html` `buildWeb3LeadPayload`: nombres ASCII simples (Nombre, Telefono, Email, Pais, Capital, Objetivo, Plazo, Visita Dubai, Tier, Puntuacion, Canal). El parser existente ya reconoce esas claves → NO hay que tocar el `.gs`. **PENDIENTE: commit+push a GitHub Pages + re-test.** (Menor pendiente: valores con tilde como "España" pueden llegar con mojibake en el valor — cosmético.)
- **M07 (BUG encontrado)** — Prueba E2E: correo llega, lead se guarda en Sheet y sale email de bienvenida ✅. PERO `parseLeadFromEmail` NO extrae los campos del cuerpo: nombre queda "Inversor" (default), y teléfono/capital/objetivo/plazo/viaje vacíos. Solo sobreviven email (regex fallback), país (default "España"), tier/puntuación (del asunto). Causa probable: Web3Forms envía los campos en tabla HTML sin formato "clave: valor" → el parser no hace match. Fix pendiente: ajustar `htmlToPlainForParse`/`parseLeadFromEmail` + simplificar nombres de campos del payload en `index.html`. Instancia real de H04. **Bloquea calidad del dato al CRM (matching, scoring, personalización de emails).**
- **Hallazgo (M06/M10)** — En GA4 hay 4 eventos clave que el sitio NO dispara (`purchase`, `qualify_lead`, `close_convert_lead`, `manual_event_SUBMIT_L`). El evento real de conversión es `generate_lead`, que aún no aparece para importar en Ads porque GA4 no lo ha recibido ni está marcado como evento clave. Acción: crear `generate_lead` como evento clave en GA4 + envío de prueba (M07), luego importar.

---

- **M20 + M22 ✅** — Datos estructurados (BreadcrumbList + ItemList) en proyectos.html y enlazado interno del footer corregido. Commit `bf5b6ba` desplegado.
- **M11 + M30 ✅/🟡** — Código muerto de `captureUTM` eliminado; `404.html` con identidad de marca creada. Commit `74de19c`. Pendiente en Cloudflare: HSTS a 2 años y revisar ACAO. (Verificado en M07: los datos del lead llegan completos; columnas UTM vacías son correctas — solo se rellenan con tráfico de campañas.)
- **M38 ✅** — Token de Telegram revocado en @BotFather y rotado a `TG_BOT_TOKEN`; bot operativo. Token comprometido invalidado.

- **M08 ✅ + M10 ✅** — Healthcheck del pipeline activado (trigger cada hora). Eventos clave fantasma desmarcados en GA4; `generate_lead` única conversión. Cierre de jornada 2026-06-04: 7 commits a producción (`409fd57`, `bf5b6ba`, `74de19c`, `82aeb25`, `af6322d` + roadmap).

## ⚠️ Acciones del usuario requeridas para cerrar lo aplicado hoy

1. **Apps Script — crear Script Properties** (⚙ Configuración del proyecto → Propiedades de la secuencia de comandos), en cada proyecto que contenga estos `.gs`:
   - `HE_SPREADSHEET_ID` = ID del Google Sheet de leads
   - `HE_AGENT_EMAIL` = email donde recibir los briefings
   - Pegar el código actualizado de los `.gs`. **Sin estas propiedades, `SPREADSHEET_ID` será nulo y el sistema fallará.**
   - (El token de Telegram `TG_BOT_TOKEN` ya usaba este mismo mecanismo.)
2. **Google Ads — elegir UNA vía de conversión** para no duplicar:
   - **Recomendada (M06):** Ads → Herramientas → Conversiones → importar el evento `generate_lead` de GA4. Dejar `ADS_CONVERSION_LABEL` **vacío** en el código (ya lo está → no duplica).
   - **Alternativa (M04):** crear conversión nativa en Ads, copiar la etiqueta y pegarla en `ADS_CONVERSION_LABEL`. En ese caso, **no** importar también `generate_lead` desde GA4.
3. **Verificar** el disparo en Tag Assistant / GA4 DebugView con un envío de prueba (encaja con M07).
