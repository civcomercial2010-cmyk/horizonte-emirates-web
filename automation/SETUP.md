# Horizonte Emirates — Sistema de Email Automation
## Guía de Setup y Decisiones de Plataforma

---

## Decisión de plataforma

### Fase 1–2 (ahora → primeros 50 leads): Gmail + Google Apps Script
**Por qué:**
- Coste cero. Gmail ya está activo, GAS es gratuito hasta 100 emails/día.
- Emails salen desde la cuenta Gmail de Horizonte Emirates — no desde un dominio extraño para el receptor.
- Control total: lógica de scoring, tiers, cola de envíos y CRM en un solo archivo.
- Sin contratos, sin configuración de dominio adicional, sin curva de aprendizaje.

**Límite real de Gmail (plan gratuito):** 100 emails/día. Con el volumen esperado en Fase 1–2, más que suficiente.

### Fase 3 (>50 leads/mes activos): Migrar a ActiveCampaign
**Cuándo migrar exactamente:**
- Cuando la cola supere 80 emails/día de forma consistente (riesgo de límite Gmail).
- Cuando se quiera A/B testing de subject lines o análisis de aperturas/clics por secuencia.
- Cuando el volumen justifique los ~49€/mes de ActiveCampaign.

**Cómo migrar:** Los 20 templates del GAS se importan a ActiveCampaign como automations. El Spreadsheet de Leads se exporta como CSV y se importa como lista. El scoring ya está definido — solo hay que replicar los tiers A/B/C como listas o tags.

---

## MODO ACTUAL: envío manual (desde el 30-jul-2026)

El envío automático de secuencias está **desactivado** a propósito. Con el volumen actual de
leads, cada uno se trabaja a mano para maximizar la conversión a videollamada.

| Qué | Dónde | Estado |
|---|---|---|
| Interruptor maestro | `CONFIG.AUTO_SEND_LEADS` en `horizonte-emails.gs` | `false` |
| Acuse de recibo inmediato (W0) | `CONFIG.AUTO_SEND_WELCOME` | `true`, única excepción al interruptor |
| Aviso de lead nuevo al asesor | `notifyAgentNewLead()` | activo, llega como no leído y destacado |
| Aviso de Web3Forms | `CONFIG.KEEP_LEAD_MAIL_UNREAD` | se queda no leído, destacado e importante |
| Plantillas para escribir a mano | `automation/MAILS-MANUALES.md` | fuente de verdad del texto |
| Herramienta de montaje | `tools/generador-mails.html` | se abre en el navegador |
| La misma desde el móvil, con los leads del CRM | `automation/horizonte-webapp.gs` + archivo HTML `generador` | web app aparte, solo lectura salvo la nota de seguimiento |
| Cola de la hoja Cola | estado `pausado-manual` | sembrada como agenda, nunca se envía |

**Qué sigue funcionando solo:** registro del lead en el CRM, scoring, briefing al asesor,
detección de bajas, aviso de reuniones de Calendly, healthCheck y **el acuse de recibo W0**
(sale en segundos, también de noche y en fin de semana; queda registrado en la hoja Cola con
código `W0` para no repetirse).
**Qué ya no ocurre:** ninguna secuencia comercial sale hacia el lead sin que alguien la escriba.

Comprobar el acuse de recibo sin gastar un lead real: `previewWelcome()` lo escribe en el registro
y `testWelcomeToSelf()` lo envía al buzón del asesor.

### Reactivar la automatización

1. Poner `CONFIG.AUTO_SEND_LEADS = true` en `horizonte-emails.gs` y guardar.
2. Ejecutar `reanudarEnvioAutomatico()`: los toques `pausado-manual` con fecha futura vuelven a
   `pendiente` y los ya vencidos se cancelan (así no sale una ráfaga de correos atrasados).
3. Comprobar en la hoja Cola que no queda nada vencido en `pendiente` antes de la siguiente
   pasada de `processQueue()`.

Antes de reactivar conviene revisar el copy de `getTemplate()`: sus cifras de rentabilidad
(7-8 % neto, 5-7 % neto) son anteriores a la alineación de la web al 6-12 % bruto estimado.

---

## Arquitectura del sistema

```
[Lead rellena formulario V3]
        ↓
[Web3Forms → envía email a la cuenta Gmail del proyecto]
        ↓
[GAS: pollGmail() cada 10 min]
  → Detecta email de Web3Forms
  → Parsea datos del lead (nombre, email, capital, objetivo, plazo, viaje, tier, score)
  → Guarda en Google Sheet "Leads"
  → Programa secuencia en hoja "Cola" según tier (A/B/C)
  → Deja el aviso de Web3Forms NO leído, destacado e importante
  → AUTO_SEND_LEADS=false: avisa al asesor y para aquí (nada sale hacia el lead)
        ↓
[GAS: processQueue() cada hora]  ← inactivo mientras AUTO_SEND_LEADS=false
  → Lee cola de emails pendientes
  → Si la fecha programada ha llegado → envía email
  → Marca como "enviado" en la cola
  → Respeta estado del lead (baja/cerrado → cancela)
        ↓
[Lead recibe secuencia personalizada según su tier]
  Tier A (score ≥9): 5 emails en 5 días — urgencia alta
  Tier B (score ≥6): 7 emails en 35 días — nurturing medio
  Tier C (score <6): 8 emails en 90 días — educación + reactivación
```

---

## Setup paso a paso

### Paso 1 — Crear el Google Sheet CRM

1. Ir a [sheets.google.com](https://sheets.google.com) con la cuenta `la cuenta Gmail del proyecto`
2. Crear una hoja de cálculo vacía → nombrarla **"HE CRM — Leads"**
3. Copiar el **ID** de la URL: `https://docs.google.com/spreadsheets/d/`**ESTE-ES-EL-ID**`/edit`
4. Guardar ese ID en **Apps Script → ⚙ Configuración del proyecto → Propiedades de la secuencia de comandos** como `HE_SPREADSHEET_ID` (ya **no** se pega en el código — M03). Añadir también `HE_AGENT_EMAIL` = email donde recibir los briefings de leads.

### Paso 2 — Crear el proyecto en Google Apps Script

1. Ir a [script.google.com](https://script.google.com)
2. Nuevo proyecto → nombrar **"HE Email Automation"**
3. En el editor, borrar el contenido de `Code.gs`
4. Pegar el contenido completo de `automation/horizonte-emails.gs`
5. Guardar (Ctrl+S)

### Paso 3 — Inicializar las hojas del Spreadsheet

1. En el editor de Apps Script, seleccionar la función `initSheets` en el desplegable
2. Hacer clic en **Ejecutar**
3. Autorizar los permisos que solicite (Gmail + Sheets + Ejecutar como tú)
4. Verificar que en el Spreadsheet se crearon dos hojas: **Leads** y **Cola**

### Paso 4 — Activar los triggers automáticos

1. En el editor, seleccionar la función `createTriggers`
2. Hacer clic en **Ejecutar**
3. Verificar en **Triggers** (icono del reloj en el menú lateral):
   - `pollGmail` → cada 10 minutos
   - `processQueue` → cada hora

### Paso 5 — Crear la etiqueta en Gmail

El script crea automáticamente la etiqueta `HE-procesado` la primera vez que procesa un email. No es necesario crearla manualmente.

### Paso 6 — Verificar el email de notificación de Web3Forms

Comprobar que los formularios (V3 y botón WA) envían los datos a `la cuenta Gmail del proyecto`. Verificar en Web3Forms dashboard que:
- Access key: `3861d49c-5f0a-4dc3-a9e9-08b1758a110a`
- El subject del formulario incluye `[A|Xpts]` o `[B|Xpts]` o `[C|Xpts]`

---

## Estructura de secuencias

### Tier A — Lead caliente (score ≥ 9 puntos)
| Email | Delay | Asunto / Objetivo |
|---|---|---|
| A1 | Inmediato | Confirmación + análisis en preparación |
| A2 | +5 horas | 3 activos concretos con rentabilidades |
| A3 | +24 horas | Urgencia real: ventanas de entrada limitadas |
| A4 | +48 horas | Visita Dubai — el argumento de conversión presencial |
| A5 | +5 días | Pregunta directa: ¿sigue siendo una prioridad? |

### Tier B — Lead cualificado (score ≥ 6 puntos)
| Email | Delay | Asunto / Objetivo |
|---|---|---|
| B1 | Inmediato | Confirmación + análisis en preparación |
| B2 | +24 horas | Propuesta de llamada de 20 minutos |
| B3 | +3 días | Guía fiscalidad Dubai / España |
| B4 | +7 días | Argumento visita en persona |
| B5 | +12 días | Actualización de activos disponibles |
| B6 | +20 días | Check-in + propuesta sin compromiso |
| B7 | +35 días | Cierre del seguimiento activo |

### Tier C — Lead en exploración (score < 6 puntos)
| Email | Delay | Asunto / Objetivo |
|---|---|---|
| C1 | Inmediato | Bienvenida + contenido educativo |
| C2 | +3 días | Comparativa España vs Dubai (tabla) |
| C3 | +7 días | Proceso de compra paso a paso |
| C4 | +14 días | Caso real: inversor español 200k€ |
| C5 | +21 días | Oportunidad RAK + Wynn 2027 |
| C6 | +30 días | Propuesta 20 minutos + honestidad total |
| C7 | +45 días | Actualización de mercado |
| C8 | +90 días | Reactivación a 3 meses |

---

## Sistema de scoring (formulario V3)

| Dimensión | Valor | Puntos |
|---|---|---|
| Capital | >1M€ | 4 |
| Capital | 600k–1M€ | 3 |
| Capital | 300k–600k€ | 2 |
| Capital | 150k–300k€ | 1 |
| Objetivo | Alquiler o revalorización | 3 |
| Objetivo | Diversificación | 2 |
| Objetivo | Residencia | 1 |
| Plazo | Capital listo — operar ya | 4 |
| Plazo | Capital en menos de 6 meses | 3 |
| Plazo | Decisión activa (< 6 meses) | 3 |
| Plazo | < 12 meses | 2 |
| Plazo | Sin definir | 1 |
| Visita Dubai | Sí, me interesa | 2 |
| Visita Dubai | Lo valoro | 1 |
| Visita Dubai | No por ahora | 0 |

**Máximo: 13 puntos**
- **Tier A** ≥ 9 pts
- **Tier B** ≥ 6 pts
- **Tier C** < 6 pts

---

## Gestión manual de leads

### Marcar una baja
```javascript
// En Apps Script → ejecutar con el email del lead
markUnsubscribed('email@ejemplo.com')
```

### Marcar lead como cerrado (operación firmada)
```javascript
markClosed('email@ejemplo.com')
```
Esto detiene el envío de todos los emails pendientes en la cola.

### Pausar un lead temporalmente
En el Spreadsheet, hoja **Leads**, cambiar el campo **Estado** a `pausado`. El sistema ignorará sus emails pendientes hasta que se cambie a `activo`.

---

## Pruebas antes de activar en producción

### 1. Probar todos los templates de un tier
En Apps Script → seleccionar `testTemplates` → ejecutar. Revisa los subjects en el log.

### 2. Simular un flujo completo
1. Activar `CONFIG.TEST_MODE = true` en el archivo
2. Ejecutar `testFullFlow()`
3. Verificar que en el Spreadsheet aparece el lead y la cola programada
4. Volver a `TEST_MODE = false`

### 3. Enviar email de prueba real
En Apps Script, editar `previewEmail('A1')` y luego usar `sendEmail('A1', leadDePrueba)` con un email real tuyo para verificar el diseño.

---

## Mantenimiento

| Frecuencia | Acción |
|---|---|
| Semanal | Revisar hoja Cola — emails con estado "error" |
| Semanal | Revisar hoja Leads — leads nuevos, tiers, estados |
| Mensual | Comprobar cuota de Gmail (Configuración → About) |
| Al migrar a AC | Exportar Leads como CSV, importar como lista |

---

## Cuándo revisar este documento

- Cuando se migre a ActiveCampaign (actualizar arquitectura)
- Cuando se añada un nuevo canal de captación (actualizar POLL_QUERY si cambia el formato del subject)
- Cuando se modifiquen los tiers o el scoring (actualizar tabla de scoring y secuencias)

---

## Guardián del funnel (`horizonte-guardian.gs`)

Archivo independiente que vigila que ningún lead se pierda. **No modifica nada**: solo lee Gmail y el Sheet, y envía un informe. `horizonte-emails.gs` no se toca, así que instalarlo o retirarlo no puede romper el motor de emails.

### Instalación (una sola vez)

1. Apps Script del proyecto → `+` junto a Archivos → Secuencia de comandos → nombrarlo `horizonte-guardian`.
2. Pegar el contenido de `automation/horizonte-guardian.gs` y guardar.
3. Ejecutar `guardianProbar()` → llega un informe inmediato. Sirve para validar que todo funciona antes de programarlo.
4. Ejecutar `guardianCrearTrigger()` → queda programado cada 2 días a las 8:00.

Para retirarlo: `guardianBorrarTrigger()`. Solo borra su propio trigger, no toca los del motor.

### Qué contiene el informe

| Categoría | Significado | Acción |
|---|---|---|
| Leads correctos | Aviso recibido y lead en el CRM | Ninguna |
| Leads perdidos | Es lead, se interpreta, pero no está en el CRM | Ejecutar `recuperarLeadsPerdidos(5)` |
| Sospechosos | El detector lo descarta pero parece un lead | Revisar `isHorizonteWeb3Lead`: `recuperarLeadsPerdidos` NO los recupera |
| No interpretables | Pasa el detector pero no se le saca el email | Revisar el formato del aviso |
| Descartados | Correos de Web3Forms que no son leads | Ninguna |

La categoría **Sospechosos** es la que cubre el agujero de la regresión de junio de 2026: usa una heurística propia (presencia de campos del formulario) en lugar del detector oficial, de modo que si el detector vuelve a romperse, el guardián sí lo ve.

### Ajustes

Todo en la constante `GUARDIAN_CFG` al principio del archivo: días analizados (5), días entre informes (2), hora de envío (8), destinatario (por defecto el de los briefings) y si debe avisar también cuando todo está correcto (sí).
