# Evidencia de auditoría · Área 2: Automatización, funnel de leads y proceso comercial

- **Fecha de la revisión:** 20-08-2026
- **Auditor:** subagente de auditoría estratégica (revisión de código y documentación, solo lectura)
- **Repositorio:** `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates` (rama main, HEAD 340932d)
- **Alcance:** carpeta `automation/`, carpeta `tools/`, las partes de `public/assets/app.js` y `public/index.html` que alimentan el funnel, historial git y diario de actividad (`G:\Mi unidad\Horizonte Emirates\07_diario.md`).
- **Límite estructural de esta revisión:** el código de Apps Script se despliega pegándolo a mano en script.google.com (procedimiento en `automation/SETUP.md`, Paso 2, líneas 103-109; marcador anti-truncado `HE_EMAILS_GS_EOF` en `automation/horizonte-emails.gs` línea 2218). Por tanto esta auditoría verifica lo que hay en el repositorio, no lo que corre en producción: el estado real de los triggers, del código pegado, de las hojas Leads/Cola y de los informes del guardián NO es verificable desde aquí y se marca como dato no disponible.

---

## 1. Inventario del sistema

| Pieza | Archivo | Tamaño | Última modif. | Estado operativo (según repo) |
|---|---|---|---|---|
| Motor principal (captación, CRM, W0, avisos, healthcheck) | `automation/horizonte-emails.gs` | 112 KB | 12-08-2026 | Activo, con secuencias comerciales CORTADAS |
| Guardián del funnel (vigilancia cada 2 días) | `automation/horizonte-guardian.gs` | 15 KB | 12-08-2026 | Instalado según memoria del 21-07 (commit 02090ee) |
| Web app móvil del generador (lee CRM) | `automation/horizonte-webapp.gs` | 15 KB | 12-08-2026 | Documentada como operativa |
| Motor de matching lead-proyecto (0-100 pts) | `automation/matching_engine.gs` | 18 KB | 12-08-2026 | Sin integración con el flujo del lead (ver 6.5) |
| Importador de proyectos (.pipe de PropertyFinder) | `automation/import_projects.gs` | 16 KB | 04-06-2026 | Prerequisito del matching y de Telegram |
| Canal Telegram de oportunidades | `automation/telegram_oportunidades.gs` | 39 KB | 06-06-2026 | Estado del trigger no verificable |
| Guía de setup y arquitectura | `automation/SETUP.md` | 12 KB | 12-08-2026 | Parcialmente OBSOLETA (scoring, ver 5.6) |
| Kit de correos manuales (fuente de verdad del texto) | `automation/MAILS-MANUALES.md` | 41 KB | 12-08-2026 | Activo desde 30-07; tabla de tiers OBSOLETA (ver 5.6) |
| Copys de las plantillas automáticas (3 documentos) | `automation/COPYS-MAILS*.md` | 22 KB | 17-04-2026 | Obsoletos, cifras no conformes (ver 5.9) |
| Generador de correos (escritorio) | `tools/generador-mails.html` | 40 KB | 12-08-2026 | Activo; scoring desalineado con la web (ver 5.6) |
| Generador (variante Apps Script y móvil, generadas) | `tools/generador-mails.appsscript.html`, `tools/generador-mails.movil.html` | 108 KB | 12-08-2026 | Mismo desalineamiento (líneas 906 y 898) |
| Maqueta móvil (plantilla del build) | `tools/_plantilla-movil.html` | 23 KB | 12-08-2026 | Correcta (solo estilos y shell) |

Hitos de fecha verificados en git:
- **30-07-2026, commit 89f2fe4** «Corta el envío automático y añade el kit de correos manuales»: nacimiento del modo manual.
- **12-08-2026, commits eed5d7e y 8132e6f**: acuse de recibo W0 corregido, retirada de la pregunta de objetivo del formulario, techo de tier por capital, corrección del asunto de la guía fiscal.

---

## 2. Recorrido completo de un lead (reconstruido del código)

### 2.1 Envío del formulario (frontend)

1. El lead completa el formulario principal de `public/index.html`. `public/assets/app.js` puntúa en cliente con `SCORES` (líneas 82-87): capital 0-4, plazo 1-4, visita 0-2. **Máximo 10 puntos; A si >= 6, B si >= 4, C resto**, con techo: `menos150k` nunca es A (función `classify`, líneas 92-102). La pregunta de objetivo se retiró del formulario el 12-08 (comentario en app.js líneas 79-81: «Se pregunta en el primer correo»).
2. El asunto del email se construye con los tres marcadores estables: `[${tier}|${score}pts] Lead HE · ${pais} · Horizonte Emirates` (app.js línea 504, con comentario explícito de no quitar ninguno sin actualizar el detector, referencia a la regresión c3fdeb6 de junio).
3. El POST va a Web3Forms (`W3F_EP`, app.js línea 4) con timeout de 15 s y `keepalive` (líneas 524-526). Web3Forms reenvía el aviso por email a la cuenta Gmail del proyecto.
4. Entradas alternativas: modal de WhatsApp (asunto `[WhatsApp directo] Nombre · Horizonte Emirates`, app.js línea 750) y descarga de la guía fiscal (asunto `[Descarga guia fiscal] email`, línea 638, deliberadamente FUERA del patrón del detector para no bloquear un registro posterior del mismo email; comentario en app.js líneas 599-604 y commit 8132e6f).

### 2.2 Detección e ingesta (Apps Script, cada 10 minutos)

5. `pollGmail()` (horizonte-emails.gs líneas 602-703) busca `from:web3forms.com is:unread -label:HE-procesado` y une SIEMPRE un fallback de 3 días sin etiqueta aunque estén leídos (M09, líneas 605-614). Trigger: cada 10 minutos (`createTriggers`, líneas 2005-2017).
6. `isHorizonteWeb3Lead()` (líneas 587-600) acepta por cualquiera de: keywords (`Horizonte Emirates`, `HE V2/V3/V5/V6`), regex `[A|11pts]`, o `\bLead HE\b`. Es la corrección robusta posterior al incidente de jun-2026 (el commit c3fdeb6 quitó «V6» del asunto y el detector, que exigía `Lead HE V\d+`, descartó leads del 08 al 28-jun; corregido en f381e70 del 28-06).
7. `parseLeadFromEmail()` (líneas 785-872) extrae tier y puntuación del asunto y los campos del cuerpo (clave: valor), incluidos UTM, gclid y las 5 evidencias de consentimiento RGPD. Sin marcador de tier (caso modal WhatsApp), el lead entra como **tier C, 0 puntos** (líneas 789-792).
8. **Deduplicación:** `leadExists()` (líneas 1013-1019) compara el email contra TODO el histórico de la hoja Leads. Si existe, el aviso se etiqueta como procesado, se marca leído y se ignora sin avisar a nadie (pollGmail líneas 659-664). Ver hallazgo 5.4.

### 2.3 Registro, acuse y aviso (lo que sigue vivo)

9. `saveLead()` (líneas 1037-1080) añade la fila a la hoja Leads (30 columnas, estado inicial `activo`).
10. `scheduleSequence()` (líneas 1082-1092) siembra la cola del tier en la hoja Cola **con estado `pausado-manual`** (línea 1087): sirve de agenda pasiva, nunca se envía.
11. **W0, acuse de recibo automático:** `sendWelcomeEmail()` (líneas 1150-1183), única excepción al corte (`AUTO_SEND_WELCOME: true`, línea 69). Sale en segundos, también de noche y en fin de semana, con idempotencia por hoja Cola. Promete respuesta del asesor «en las próximas 48 horas» (`WELCOME_PROMISE`, línea 79). Un fallo del W0 no impide el registro ni el aviso (try/catch en pollGmail líneas 673-677).
12. **Aviso al asesor:** `notifyAgentNewLead()` (líneas 303-376). Asunto `[LEAD A|11pts] Nombre · País · Capital · Lxxxxxxxx`, con ficha completa, guion recomendado por tier (`playbookForLead`, líneas 276-296: tier A en menos de 1 hora, B hoy mismo, C en menos de 24 h), botón de WhatsApp con mensaje precargado y enlace al CRM. Se fuerza no-leído + destacado + importante (`forceUnreadBySubjectToken`, líneas 252-268). **Este correo es el ÚNICO disparador de acción comercial.**

### 2.4 Lo que está CORTADO (verificado en código)

13. `CONFIG.AUTO_SEND_LEADS: false` (línea 61, con comentario fechado 2026-07-30). Consecuencias verificadas:
    - `processQueue()` retorna en su primera línea útil (líneas 1198-1204): ninguna secuencia A1-A5 / B1-B7 / C1-C8 sale jamás.
    - `sendEmail()` lanza excepción salvo `manual:true` o `welcome` (líneas 1288-1296).
    - Las 20 plantillas de `getTemplate()` (líneas 1396 en adelante) quedan como código muerto en espera.
14. Todo contacto comercial posterior al W0 es manual: kit `automation/MAILS-MANUALES.md` (W0 automático + M1 a M11 manuales) montado con `tools/generador-mails.html` (escritorio), la página móvil publicada o la web app de Apps Script que lee el CRM (`horizonte-webapp.gs`).

### 2.5 Procesos satélite

15. `pollUnsubscribes()` cada 10 min: detecta bajas por palabras clave en respuestas a hola@ (líneas 744-778). Ver hallazgo CRÍTICO 5.1.
16. `notifyCalendlyBookings()` cada 10 min (líneas 426-501): detecta reuniones de Calendly en el calendario y envía un briefing del lead al asesor. NO escribe nada en el CRM (solo la propiedad `HE_CALENDLY_NOTIFIED` para no repetir).
17. `healthCheck()` cada hora (líneas 1935-2003): leads atascados sin procesar >30 min, heartbeat de pollGmail, errores en Cola, y (desactivada) la alerta de sequía de leads. Ver hallazgo 5.5.
18. **Guardián** (`horizonte-guardian.gs`), cada 2 días a las 8:00: recorre los avisos de Web3Forms de los últimos 5 días y los clasifica en registrados / perdidos / no interpretables / sospechosos / ignorados (líneas 100-175). La categoría «sospechosos» usa una heurística independiente del detector (`guardianPareceLead_`, líneas 193-199: 3 o más marcas entre capital, objetivo, experiencia, plazo, pts, lead), diseñada específicamente para cazar una repetición del incidente de junio. Solo lectura, no toca nada.

---

## 3. Hallazgos

### Tabla resumen

| # | Hallazgo | Tipo | Confianza | Impacto |
|---|---|---|---|---|
| 5.1 | Bajas automáticas por subcadena: «trabaja», «rebaja» o «bajada» en una respuesta marcan al lead como baja | hecho_verificado | alta | alto |
| 5.2 | No existe seguimiento sistemático post-W0: sin recordatorios, sin SLA medido, sin escalado | hecho_verificado | alta | alto |
| 5.3 | Cero registro estructurado de llamadas, reuniones y motivos de pérdida; sin métricas lead a videollamada | hecho_verificado | alta | alto |
| 5.4 | Un lead que reenvía el formulario se descarta en silencio para siempre (dedupe sobre todo el histórico) | hecho_verificado | alta | medio |
| 5.5 | La alerta de «sin leads en 72 h» está apagada (EXPECT_TRAFFIC=false) con Ads activo desde el 20-07 | hecho_verificado | alta | medio |
| 5.6 | Tres escalas de scoring conviven: web (10 pts, A>=6), generadores (13 pts, A>=9) y documentación (obsoleta) | hecho_verificado | alta | medio |
| 5.7 | recuperarLeadsPerdidos en modo manual no envía W0 ni avisa al asesor, al contrario de lo que promete el guardián | hecho_verificado | alta | medio |
| 5.8 | Lead del modal de WhatsApp entra como tier C 0 pts: el que pide conversación inmediata recibe la prioridad mínima | hecho_verificado | alta | medio |
| 5.9 | Plantillas automáticas pausadas con cifras no conformes («7-8 % neto»): riesgo latente si se reactivan | hecho_verificado | alta | bajo |
| 5.10 | Fallo puntual del aviso al asesor deja al lead registrado pero invisible, sin reintento y sin alerta | inferencia | alta | medio |
| 5.11 | Despliegue por copia-pega: no hay garantía de que el código en producción sea el del repo | hecho_verificado | alta | medio |
| 5.12 | Sistema sobredimensionado para 2 leads/mes; matching engine además roto por contrato de datos del plazo | hecho_verificado + inferencia | alta | medio |
| 5.13 | Respuesta real a los 2 leads de los últimos 30 días: sin evidencia en repo ni diario (que se detiene el 30-07) | dato_no_disponible | alta | alto |

### 5.1 CRÍTICO · Bajas automáticas por coincidencia de subcadena

- **Evidencia:** `automation/horizonte-emails.gs`, líneas 43-47 (`UNSUBSCRIBE_KEYWORDS` incluye `'baja'` y `'stop'`) y líneas 744-778 (`pollUnsubscribes`). La comprobación de la línea 761 es `subject.includes(kw) || body.includes(kw)` sobre el texto en minúsculas: coincidencia de SUBCADENA, sin límite de palabra.
- **Mecánica del fallo:** cualquier correo NO leído dirigido a hola@horizonteemirates.com cuyo cuerpo o asunto contenga la secuencia «baja» dispara `markUnsubscribed(email)`. En español eso incluye «trabaja», «trabajan», «trabajar», «rebaja», «bajada», «abajo» no, pero «me interesa saber cómo se trabaja el alquiler» sí. El lead pasa a estado `baja` en el CRM (línea 1844), el hilo se marca LEÍDO (línea 773, la respuesta pierde la negrita y puede pasar desapercibida) y además desaparece de la lista de la web app móvil (horizonte-webapp.gs líneas 125-126 filtran `baja`). Las reglas del kit (`MAILS-MANUALES.md` línea 56) ordenan no volver a escribir a una baja.
- **Escenario concreto:** un lead tier A responde al W0: «Gracias, me interesa saber con qué promotoras trabajan». En menos de 10 minutos queda de baja, su respuesta marcada como leída, y fuera de la lista de trabajo. Con 2 leads al mes, un solo falso positivo destruye el 50 % del pipeline del mes sin que nadie lo vea.
- **Frecuencia real:** no verificable desde el repo (haría falta revisar la etiqueta `HE-bajas-procesado` en Gmail y la columna Estado del CRM). El mecanismo es un hecho; la ocurrencia, hipótesis.
- **Corrección obvia:** exigir límite de palabra y contexto (p. ej. regex `\b(dar(me|se)? de baja|baja
  por favor|unsubscribe|no .*correos)\b`), o degradar la función a «proponer baja» con confirmación manual, coherente con la filosofía manual del resto del funnel.

### 5.2 ALTO · No hay seguimiento sistemático: el funnel termina en el aviso

- **Evidencia:** `processQueue` desactivado (líneas 1198-1204); la cola sembrada `pausado-manual` no la lee nadie (ningún proceso consume esos estados: verificado por búsqueda de `pausado-manual` en el repo, solo aparece en scheduleSequence, reanudarEnvioAutomatico y documentación); el guardián solo vigila la INGESTA (avisos vs CRM), no la respuesta; `healthCheck` solo cuenta estados `error` de la Cola (línea 1967).
- **Consecuencia:** después del W0 (máquina) y del aviso (buzón), no existe NINGÚN mecanismo que recuerde el M2 a las 48 h, el M11, el toque 3 o el cierre M10. La secuencia de seguimiento definida en `MAILS-MANUALES.md` (M2 a M11, hasta 4 toques en 10 días para tier A) depende al 100 % de la memoria y disciplina de una persona. No hay lista de «leads sin contactar», ni de «prometido 48 h y vencido», ni tablero de toques pendientes. La única anotación posible es texto libre en la columna Notas (checklist línea 997 y `webappAnotarContacto`, horizonte-webapp.gs líneas 161-177, que añade «M1 enviado»).
- **SLA:** el W0 promete 48 h al lead (línea 79) y el playbook interno exige menos de 1 h en tier A (líneas 281-285). **Nada mide el cumplimiento de ninguna de las dos promesas.** Un incumplimiento del compromiso de 48 h escrito al lead sería invisible para el sistema.
- **Clasificación:** hecho_verificado (ausencia de mecanismo), confianza alta, impacto alto: en un funnel de 2 leads/mes el coste de captación por lead es enorme (CPL 126,61 EUR solo en Ads) y la conversión depende por entero de la fase que no tiene ninguna red.

### 5.3 ALTO · Sin registro comercial: llamadas, reuniones, resultados y motivos de pérdida

- **Evidencia:** columnas del CRM en `initSheets()` (líneas 1862-1867): identificación, cualificación, UTM y consentimiento. Estados usados en el código: `activo`, `baja`, `cerrado`, `pausado`, `descartado` (saveLead línea 1058; updateLeadEstadoInSheet líneas 1843-1850; webapp líneas 125-126). No existe ningún estado ni columna para: contactado, llamada agendada, llamada realizada, no-show, propuesta enviada, perdido (con motivo). `notifyCalendlyBookings` avisa de la reunión pero no la registra en el CRM (líneas 426-501). La hoja `lead_matches` del matching engine tiene columnas de tracking (`enviado_lead`, `email_abierto`, `clic_proyecto`, `llamada_reservada`, `feedback`, matching_engine.gs líneas 309-317) que se inicializan a `No` y ningún proceso actualiza.
- **Consecuencia:** es imposible responder con datos a las preguntas comerciales básicas: cuántos leads llegaron a videollamada, cuánto se tardó en contactar, por qué se pierden. La tesis del 30-07 («trabajar a mano maximiza el paso a videollamada», diario línea 1892) es hoy infalsable: no se está midiendo.
- **Clasificación:** hecho_verificado, confianza alta, impacto alto.

### 5.4 MEDIO · El lead que vuelve se descarta en silencio y para siempre

- **Evidencia:** `pollGmail` líneas 659-664: si `leadExists(lead.email)` el aviso se etiqueta, se marca leído y se ignora. `leadExists` (líneas 1013-1019) compara contra TODO el histórico sin ventana temporal. No hay aviso al asesor, no hay W0, no hay anotación en el lead existente.
- **Escenario:** un lead de abril que en agosto vuelve a rellenar el formulario (señal de compra fortísima: volvió solo) recibe el silencio absoluto, exactamente el comportamiento que el propio equipo calificó de CRÍTICO cuando lo detectó en la variante de la guía fiscal (mensaje del commit 8132e6f: «perdíamos justo al lead más cualificado, el que primero se informa y luego se decide»). Aquella corrección arregló el asunto de la guía; el reenvío del formulario principal sigue cayendo en el mismo pozo.
- **Corrección obvia:** en caso de duplicado, no crear fila nueva pero SÍ anotar el re-contacto en Notas y disparar `notifyAgentNewLead` con marca «LEAD REINCIDENTE».
- **Clasificación:** hecho_verificado (comportamiento del código), confianza alta, impacto medio (probabilidad baja, coste por ocurrencia muy alto).

### 5.5 MEDIO · La alerta de sequía de leads está apagada en plena campaña

- **Evidencia:** `CONFIG.EXPECT_TRAFFIC: false` (línea 104), con comentario literal «pon true cuando haya campañas/tráfico activo». Google Ads está activa desde el 20-07-2026 con unos 20 EUR/día. Con `true`, `healthCheck` avisaría tras 72 h sin leads nuevos (líneas 1972-1982).
- **Consecuencia:** el sistema tiene construida exactamente la alarma que necesita el problema que motiva esta auditoría (pocos leads con gasto activo) y está desconectada. Un fallo silencioso del formulario, de Web3Forms o del parser entre dos informes del guardián solo se notaría mirando a mano.
- **Matiz:** el valor en el Apps Script real podría diferir del repo (ver 5.11); en el repo está en `false` a 20-08-2026.
- **Clasificación:** hecho_verificado (repo), confianza alta, impacto medio.

### 5.6 MEDIO · Tres escalas de puntuación conviven y se contradicen

- **Evidencia:**
  1. **Web (la que manda, desde el 12-08):** `public/assets/app.js` líneas 78-102: máximo 10 pts (sin objetivo), A >= 6, B >= 4, techo por capital.
  2. **Generadores de correos:** `tools/generador-mails.html` líneas 224 y 688-694 (idéntico en `generador-mails.appsscript.html` línea 906 y `generador-mails.movil.html` línea 898): mantienen la pregunta de objetivo (0-3 pts, máximo 13) y los umbrales ANTIGUOS A >= 9, B >= 6. En modo «auto» el generador elige la plantilla M1 según SU tier: un lead que el aviso marca `[A|7pts]` (A legítimo en la escala nueva) sale del generador como M1-B si el objetivo marcado no suma 2 o más. El commit 8132e6f del 12-08 actualizó los valores de capital de los generadores pero dejó los umbrales y el objetivo antiguos.
  3. **Documentación:** `automation/SETUP.md` líneas 174-197 (tabla de scoring con objetivo, máximo 13, A >= 9) y `automation/MAILS-MANUALES.md` líneas 27-31 (tabla de ritmo: «A 9 a 13, B 6 a 8, C 0 a 5»): ambas describen la escala retirada el 12-08. Además la sección 5.1 del kit sigue diciendo «lo que marcó en la pregunta 2» cuando esa pregunta ya no existe en el formulario; el objetivo llega siempre vacío (`app.js` línea 515 con `sel` sin objetivo, y aviso al asesor mostrando «sin dato»).
- **Consecuencia:** confusión operativa en el paso más delicado (elegir el M1 y la urgencia del primer contacto) y documentación que un operador nuevo seguiría al pie de la letra en la dirección equivocada.
- **Clasificación:** hecho_verificado, confianza alta, impacto medio.

### 5.7 MEDIO · La recuperación de leads perdidos quedó incoherente con el modo manual

- **Evidencia:** `recuperarLeadsPerdidos()` (horizonte-emails.gs líneas 952-1004) guarda el lead y llama a `processQueue({immediateWelcomeAfterPoll:true})` (línea 992), que con `AUTO_SEND_LEADS=false` retorna sin hacer nada (líneas 1201-1204). No llama ni a `sendWelcomeEmail` ni a `notifyAgentNewLead`. El informe del guardián, sin embargo, instruye: «ejecutar recuperarLeadsPerdidos… Los recupera y les lanza la secuencia de bienvenida» (horizonte-guardian.gs líneas 268-270; también SETUP.md línea 273).
- **Consecuencia:** un lead recuperado tras una incidencia entra en el CRM sin acuse de recibo al lead y sin briefing al asesor: queda registrado y mudo, y la promesa de la web («respuesta en menos de 48 horas») se incumple sin que nadie lo sepa. La función es anterior al corte del 30-07 y no se adaptó.
- **Clasificación:** hecho_verificado, confianza alta, impacto medio (solo se usa tras incidencias, que es justo cuando más importa).

### 5.8 MEDIO · El lead del modal de WhatsApp recibe la prioridad mínima

- **Evidencia:** el modal envía asunto `[WhatsApp directo] Nombre · Horizonte Emirates` sin marcador de tier (app.js línea 750); `parseLeadFromEmail` asigna por defecto tier C y 0 puntos (horizonte-emails.gs líneas 789-792); `playbookForLead` prescribe para C «contactar en menos de 24 horas… tono educativo y sin presión» (líneas 291-296).
- **Consecuencia:** la persona que pulsa «hablar por WhatsApp ahora» (máxima intención de conversación inmediata) es tratada por el playbook como el perfil más frío. El canal declarado tampoco se envía desde el modal (no hay campo `canal` en el FormData, líneas 748-764), así que el CRM registra el canal por defecto `email`.
- **Clasificación:** hecho_verificado (mecánica) e inferencia (impacto en la conversión), confianza alta, impacto medio.

### 5.9 BAJO hoy, MEDIO si se reactiva · Plantillas automáticas con cifras no conformes

- **Evidencia:** `getTemplate()` conserva «7-8% neto anual», «5-7% neto», «6-9% neto», «7,2% neto» (horizonte-emails.gs líneas 1550-1556, 1642, 1650-1655, 1730, 1756-1762). La regla vigente del kit manual es «6 a 12 % bruto anual estimado. Nunca "neto", nunca garantizado» (MAILS-MANUALES.md líneas 37-43). Los tres documentos `COPYS-MAILS*.md` (17-04-2026) documentan esas mismas cifras antiguas. SETUP.md ya lo advierte (líneas 60-62): revisar el copy antes de reactivar.
- **Riesgo:** basta poner `AUTO_SEND_LEADS=true` y ejecutar `reanudarEnvioAutomatico()` sin la revisión pendiente para volver a enviar a leads cifras que la propia casa considera indefendibles (y con posible relevancia regulatoria: promesas de rentabilidad neta no sostenidas).
- **Clasificación:** hecho_verificado, confianza alta, impacto bajo mientras el interruptor siga en false.

### 5.10 MEDIO · Punto único de fallo en el aviso al asesor

- **Evidencia de la mecánica:** en `pollGmail`, si `notifyAgentNewLead` lanza excepción DESPUÉS de `saveLead` (líneas 666-685), el hilo no llega a etiquetarse; en la siguiente pasada el lead ya existe y cae en la rama de duplicado (líneas 659-664): etiquetado y silencio. Resultado: lead en el CRM sin briefing y sin reintento. El guardián lo clasificaría «registrado» (está en el CRM) y no alertaría; `healthCheck` tampoco cubre «lead en CRM sin contactar».
- **Además:** el aviso es un email al mismo buzón. No hay canal de escalado alternativo (push, Telegram interno, SMS) pese a existir un bot de Telegram en el proyecto; `sendInternalLeadsSummary` existe en telegram_oportunidades.gs pero requiere configuración adicional y no consta instalada.
- **Clasificación:** inferencia (escenario) sobre mecánica verificada, confianza alta en la mecánica, probabilidad baja, impacto medio.

### 5.11 MEDIO · El repo no es la producción: despliegue por copia-pega

- **Evidencia:** SETUP.md Paso 2 (pegar `horizonte-emails.gs` en Code.gs a mano); marcador EOF anti-truncado (línea 2218); el historial obliga a «repegar el .gs en Apps Script» tras cada corrección (incidente jun-2026 y nota de memoria del proyecto). No hay clasp, CI ni verificación de versión desplegada.
- **Consecuencia para esta auditoría y para la operación:** nadie puede afirmar qué versión corre hoy en producción, ni si los triggers (pollGmail 10 min, processQueue 1 h, healthCheck 1 h, guardián 2 días) siguen activos. Todas las conclusiones de este informe sobre comportamiento en vivo heredan esa incertidumbre.
- **Clasificación:** hecho_verificado (el procedimiento), confianza alta; el estado desplegado es dato_no_disponible.

### 5.12 MEDIO · Sobredimensionamiento y piezas muertas

- **Evidencia del tamaño:** 6 ficheros .gs (unos 217 KB de código), 21 plantillas automáticas pausadas, motor de matching con 3 hojas auxiliares y trigger propuesto cada 6 h, canal Telegram con rotación de 4 temas cada 2 días, importador de proyectos, 3 variantes del generador HTML y una web app móvil. Todo ello al servicio de un caudal real de unos 2 leads en 30 días.
- **Matching engine, además, roto para leads reales:** `_timingScore` espera plazos `'3-6'`, `'6-12'`, `'12-24'`, `'mas24'` (matching_engine.gs líneas 82-88) pero el formulario envía `'ya'`, `'6meses'`, `'12meses'`, `'indefinido'` (app.js línea 85): el mapa nunca coincide y todo lead real recibe el horizonte por defecto de 2 años, es decir, 25 de los 100 puntos se calculan siempre con un dato inventado. El propio motor no está invocado desde el flujo del lead: el comentario de cabecera dice «puede llamarse desde processNewLead()», función que no existe en horizonte-emails.gs (verificado por búsqueda global). Su utilidad hoy es, como mucho, manual.
- **Juicio:** el diario del 30-07 formuló el criterio correcto («con volumen bajo, la automatización es prematura», línea 1907). El código lo aplica a medias: se cortó el envío, pero se mantiene y se sigue puliendo una infraestructura pensada para decenas de leads/mes, mientras la fase que sí decide el resultado (respuesta y seguimiento humanos) opera sin ninguna instrumentación. El esfuerzo de ingeniería está invertido en el lado del embudo que no es el cuello de botella.
- **Clasificación:** bug del matching hecho_verificado (confianza alta, impacto bajo mientras no se use); sobredimensionamiento inferencia (confianza alta, impacto medio como coste de oportunidad).

### 5.13 ALTO · No hay evidencia de cómo se trabajaron los 2 leads del periodo

- **Evidencia:** el diario de actividad (`G:\Mi unidad\Horizonte Emirates\07_diario.md`) tiene su última entrada el 30-07-2026 (línea 1869); no existe ninguna entrada de agosto que documente el trabajo de los leads. En el repositorio no hay registro alguno de contactos (por diseño: el registro vive en la columna Notas del Sheet, no accesible desde aquí).
- **Consecuencia:** la pregunta central del área («¿el proceso comercial responde bien a los pocos leads que llegan?») NO se puede responder con la evidencia disponible. Los tiempos de respuesta reales, los toques realizados y el resultado de los 2 leads son dato_no_disponible. Para cerrarla hace falta abrir la hoja Leads/Cola del CRM y el buzón (etiquetas HE-procesado, avisos [LEAD ...], hilos con los leads).
- **Clasificación:** dato_no_disponible, confianza alta en la ausencia, impacto alto porque es exactamente el eslabón del que depende la conversión.

---

## 4. Fortalezas verificadas (para no repetir trabajo hecho)

1. **Detección de ingesta robusta y con doble red.** Tras el incidente de jun-2026, el detector acepta tres marcadores independientes (líneas 587-600) y el asunto del formulario emite los tres (app.js línea 504). El guardián añade una heurística ajena al detector (sospechosos) que cazaría una nueva regresión. El fallback M09 de pollGmail cubre avisos marcados leídos. El riesgo de perder un lead EN LA CAPTACIÓN es hoy razonablemente bajo; el riesgo vivo está en la fase humana (5.1, 5.2, 5.13).
2. **W0 bien planteado.** Inmediato, idempotente, honesto sobre su naturaleza automática, entrega la guía prometida, siembra la visita y da salida por Calendly; construye la ficha solo con los datos que existen (comentario líneas 1484-1489, corregido el 12-08).
3. **Aviso al asesor de calidad.** Ficha completa, urgencia y plantilla recomendadas por tier, WhatsApp precargado, truco de forzar no-leído para que Gmail no lo entierre.
4. **Cumplimiento RGPD serio en la ingesta:** 5 columnas de prueba de consentimiento (art. 7.1) con migración idempotente y reglas de uso por consentimiento en el kit manual (M8-E y M9 vetados sin consentimiento de marketing).
5. **El kit manual es un playbook comercial completo y de nivel:** primeros contactos por tier, bloques modulares por respuesta del formulario, objeciones, no-show, reactivación, cierre y guiones de WhatsApp con reglas de estilo y legales. El problema no es la calidad del manual, es que nada vigila su ejecución (5.2).

---

## 5. Respuestas directas a las preguntas del encargo

| Pregunta | Respuesta corta |
|---|---|
| ¿Dónde se recibe el lead? | Web3Forms reenvía por email a la cuenta Gmail del proyecto; pollGmail lo lee cada 10 min (con fallback de 3 días). |
| ¿Cómo se detecta? | `isHorizonteWeb3Lead` con 3 marcadores redundantes; robusto tras el incidente del asunto V6 (jun-2026). |
| ¿Cómo se puntúa? | En el NAVEGADOR (app.js): 10 pts máx, A>=6, B>=4, techo menos150k. El backend solo lee el asunto. Los generadores y la documentación mantienen la escala vieja (hallazgo 5.6). |
| ¿Dónde se guarda? | Google Sheet «Leads» (30 columnas) + cola por tier en «Cola» con estado `pausado-manual`. |
| ¿Qué correos salen? | Solo el W0 (acuse, en segundos). Verificado: `AUTO_SEND_LEADS:false` línea 61, `processQueue` retorna, `sendEmail` lanza excepción. |
| ¿Qué está cortado? | Las 20 plantillas de secuencia A/B/C desde el 30-07 (commit 89f2fe4). |
| ¿Notificaciones? | Aviso [LEAD ...] al asesor por lead nuevo, briefing por reunión Calendly, healthcheck horario, informe del guardián cada 2 días. Todas por email al mismo buzón. |
| ¿Qué hace el guardián? | Cada 2 días cruza avisos Web3Forms de 5 días contra el CRM y reporta perdidos, no interpretables y sospechosos. Solo lectura. |
| ¿Pasos manuales? | Todo lo comercial tras el W0: elegir M1, montarlo con el generador, enviar desde Gmail, WhatsApp complementario, seguimientos M2-M11, anotar en Notas, marcar bajas y cierres con funciones de Apps Script. |
| ¿Tiempo de respuesta esperable? | W0: 0-10 min garantizados. Humano: objetivo interno <1 h (A) / mismo día (B) / <24 h (C), promesa al lead 48 h; cumplimiento NO medido por nada (5.2). |
| ¿Riesgo de leads perdidos? | En ingesta: bajo (doble red). En fase humana: alto y sin vigilancia (5.1 bajas por subcadena, 5.2 sin seguimiento, 5.4 reincidentes silenciados, 5.10 aviso sin reintento). |
| ¿Duplicados? | Bloqueo total por email histórico; el coste es el silencio ante re-contactos (5.4). |
| ¿Secuencia de seguimiento real? | Definida en papel (M2-M11), sin ningún mecanismo que la dispare o recuerde. Solo primera respuesta garantizada (W0, automática). |
| ¿Registro de llamadas/motivos de pérdida? | No existe (5.3). |
| ¿SLA? | Prometido (48 h al lead) y prescrito (tier), pero no instrumentado. |
| ¿Apropiado para 2 leads/mes o sobredimensionado? | Sobredimensionado en automatización de envío/matching/Telegram e infradimensionado exactamente donde duele: instrumentación del trabajo humano (5.12). |

---

## 6. Recomendaciones priorizadas (orden de impacto por hora invertida)

1. **Arreglar `pollUnsubscribes` (5.1):** límite de palabra + confirmación manual de bajas. Es un cambio de 10 líneas que elimina el riesgo más grave del sistema actual.
2. **Encender `EXPECT_TRAFFIC=true` (5.5)** mientras haya campaña activa, y repegar el .gs en Apps Script.
3. **Instrumentar la fase humana (5.2, 5.3):** añadir al guardián (que ya corre cada 2 días) dos comprobaciones baratas: leads con estado `activo` sin nota de contacto en la columna Notas a las 24/48 h de su fecha de creación, y toques `pausado-manual` vencidos sin nota posterior. Con eso el SLA prometido pasa a estar vigilado sin montar ningún CRM nuevo.
4. **Duplicados con aviso (5.4):** en la rama de duplicado, anotar el re-contacto en Notas y disparar el aviso «LEAD REINCIDENTE».
5. **Adaptar `recuperarLeadsPerdidos` al modo manual (5.7):** que envíe W0 y aviso al asesor como pollGmail.
6. **Unificar el scoring (5.6):** alinear los 3 generadores y las 2 tablas de documentación con la escala de 10 pts del 12-08, o hacer que el generador acepte el tier del aviso en vez de recalcularlo.
7. **Decisión de cartera (5.12):** congelar formalmente matching engine, importador y Telegram (o borrarlos del repo con tag) hasta que el volumen los justifique; corregir PLAZO_MAP si se conservan.
8. **Registrar el trabajo comercial de agosto (5.13):** retomar el diario o, como mínimo, exigir la anotación en Notas por cada toque (la checklist del kit ya lo pide, línea 997; falta que algo lo verifique, ver punto 3).

---

## 7. Archivos revisados

| Archivo | Profundidad |
|---|---|
| `automation/horizonte-emails.gs` | Completa (2.219 líneas: config, poll, parse, CRM, cola, envío, plantillas clave, healthcheck, triggers, utilidades) |
| `automation/horizonte-guardian.gs` | Completa (377 líneas) |
| `automation/horizonte-webapp.gs` | Completa (325 líneas) |
| `automation/matching_engine.gs` | Amplia (config, scoring, matchNewLeads, escritura, triggers) |
| `automation/import_projects.gs` | Parcial (cabecera, config, scores; suficiente para el rol que cumple) |
| `automation/telegram_oportunidades.gs` | Parcial (cabecera, config, programación; no procesa leads) |
| `automation/SETUP.md` | Completa |
| `automation/MAILS-MANUALES.md` | Completa (1.030 líneas) |
| `automation/COPYS-MAILS.md` | Parcial (verificación de cifras y vigencia) |
| `automation/COPYS-MAILS-APROBADOS-CONTENIDO.md` | Parcial (ídem) |
| `automation/COPYS-MAILS-WORKBOOK.md` | Parcial (naturaleza y vigencia) |
| `tools/generador-mails.html` | Amplia (estructura, classify, build, copys) |
| `tools/generador-mails.appsscript.html` | Dirigida (verificación del classify, línea 906) |
| `tools/generador-mails.movil.html` | Dirigida (verificación del classify, línea 898) |
| `tools/_plantilla-movil.html` | Parcial (confirmación de que es solo maqueta) |
| `public/assets/app.js` | Dirigida (scoring, envío del formulario, guía, modal WhatsApp) |
| `public/index.html` | Dirigida (búsqueda de valores del formulario) |
| `G:\Mi unidad\Horizonte Emirates\07_diario.md` | Dirigida (índice de entradas y entrada del 30-07 completa) |
| Historial git | `git log` de automation/ y tools/; `git show` de 89f2f e4 y 8132e6f |

## 8. No abiertos / no verificables desde esta auditoría

- **Proyecto real de Google Apps Script** (código pegado, triggers activos, propiedades HE_SPREADSHEET_ID, HE_AGENT_EMAIL, TG_BOT_TOKEN): inaccesible desde el repositorio.
- **Google Sheet del CRM** (hojas Leads, Cola, projects_master, lead_matches): contenido real, número de leads, estados y notas no verificados.
- **Buzón de Gmail** (avisos Web3Forms, etiquetas HE-procesado y HE-bajas-procesado, informes del guardián y del healthcheck, hilos con los 2 leads del periodo).
- **Panel de Web3Forms** (entregas, rechazos, spam).
- **Página móvil privada del generador** (artefacto publicado, URL en MAILS-MANUALES.md línea 1011): no abierta; el HTML fuente sí se revisó.
- **`scripts/build_generador_movil.py`:** existencia confirmada, contenido no revisado (fuera del camino crítico del lead).

Nota sobre credenciales: `automation/SETUP.md` (línea 134) y `public/assets/app.js` contienen la access key pública de Web3Forms (es de publicación en cliente por diseño de ese servicio); `telegram_oportunidades.gs` referencia el token del bot vía Script Properties (no está en el repo) y expone el ID del canal privado en claro (línea 53). No se han encontrado contraseñas ni claves privadas en los archivos revisados.
