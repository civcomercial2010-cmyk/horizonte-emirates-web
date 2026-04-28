# GA4 - Resumen direccion (1 pagina)

## Objetivo

Convertir trafico web en leads cualificados para inversion inmobiliaria en UAE, identificando:

- donde se pierde el usuario en el embudo,
- que fricciones bloquean el envio del formulario,
- y que canal (formulario vs WhatsApp) convierte mejor.

## KPI clave (semanal)

- **Leads generados:** `generate_lead`
- **CTR a analisis:** `generate_lead_click / sesiones`
- **Tasa de exito formulario:** `generate_lead / lead_submit_attempt`
- **Friccion de validacion:** `lead_submit_validation_error / lead_submit_attempt`
- **Error tecnico de envio:** `lead_submit_error / lead_submit_attempt`
- **Uso de WhatsApp:** `(whatsapp_lead_submit + whatsapp_click) / generate_lead_click`
- **Avance de embudo:** `step_1 -> step_2 -> step_3 -> attempt -> lead`

## Semaforo de salud (alertas)

- **Verde**
  - Tasa de exito formulario >= 70%
  - Error tecnico < 3%
  - Caida por paso (step a step) < 25%
- **Amarillo**
  - Tasa de exito 50-69%
  - Error tecnico 3-7%
  - Caida por paso 25-40%
- **Rojo**
  - Tasa de exito < 50%
  - Error tecnico > 7%
  - Caida por paso > 40%

## Lectura rapida para decision

- Si sube `generate_lead_click` y cae `step_2`:
  - problema de continuidad en formulario (mensaje, orden de campos o friccion UX).
- Si sube `lead_submit_attempt` y cae `generate_lead`:
  - revisar primero validacion (`invalid_email`, `invalid_phone`) y despues error tecnico.
- Si sube `whatsapp_modal_open` pero no `whatsapp_lead_submit`:
  - el modal no esta cerrando la accion (campos, copy o confianza).
- Si la seccion `roi` tiene uso alto (`roi_calculator_interaction`) pero no crece `generate_lead`:
  - hay interes analitico, falta puente de conversion (CTA y propuesta de valor inmediata).

## Acciones recomendadas (prioridad)

1. **Reducir friccion de formulario**
   - simplificar copys de error y placeholders de telefono/email.
2. **Optimizar paso con mayor fuga**
   - identificar el salto mas debil entre `step_1/2/3`.
3. **Escalar canal ganador**
   - si WhatsApp convierte mejor, elevar visibilidad y CTA contextual.
4. **A/B test de CTA principal**
   - test de copy en `Solicitar analisis` para elevar `generate_lead_click`.

## Cadencia de gestion

- **Diario (5 min):** Tiempo real + errores tecnicos.
- **Semanal (30 min):** embudo completo, calidad lead (`lead_tier`) y decisiones.
- **Mensual (60 min):** comparativa por fuente/campana y plan de optimizacion.

## Regla operativa

Sin mejora medible en al menos un KPI principal durante 2 semanas consecutivas, no se considera valida ninguna iteracion de marketing o UX.

