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

## Arquitectura del sistema

```
[Lead rellena formulario V3]
        ↓
[Web3Forms → envía email a civcomercial2010@gmail.com]
        ↓
[GAS: pollGmail() cada 10 min]
  → Detecta email de Web3Forms
  → Parsea datos del lead (nombre, email, capital, objetivo, plazo, viaje, tier, score)
  → Guarda en Google Sheet "Leads"
  → Programa secuencia en hoja "Cola" según tier (A/B/C)
        ↓
[GAS: processQueue() cada hora]
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

1. Ir a [sheets.google.com](https://sheets.google.com) con la cuenta `civcomercial2010@gmail.com`
2. Crear una hoja de cálculo vacía → nombrarla **"HE CRM — Leads"**
3. Copiar el **ID** de la URL: `https://docs.google.com/spreadsheets/d/`**ESTE-ES-EL-ID**`/edit`
4. Pegar ese ID en `CONFIG.SPREADSHEET_ID` del archivo `horizonte-emails.gs`

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

Comprobar que los formularios (V3 y botón WA) envían los datos a `civcomercial2010@gmail.com`. Verificar en Web3Forms dashboard que:
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
| Plazo | Cuanto antes | 4 |
| Plazo | < 6 meses | 3 |
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
