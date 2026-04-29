# GA4 - Implementacion e interpretacion (Horizonte Emirates)

Este documento explica que se ha implementado en GA4 para `www.horizonteemirates.com`, como leer cada evento y como usarlo para tomar decisiones de negocio.

## 1) Estado actual de tracking

- Propiedad GA4 activa con ID de medicion `G-BK37V83363`.
- Snippet GA4 insertado en `index.html` (archivo que sirve produccion).
- Eventos de conversion, friccion de formulario, WhatsApp, embudo por pasos, interaccion ROI y consumo por secciones implementados en frontend.

## 2) Eventos implementados y significado

- `generate_lead_click`
  - **Cuando dispara:** clic en CTA que apunta a `#form`.
  - **Uso:** medir interes inicial en analisis.
  - **Params clave:** `event_label` (texto CTA), `link_target`.

- `form_step_view`
  - **Cuando dispara:** al entrar en pasos 1, 2 o 3 del formulario.
  - **Uso:** ver fuga entre pasos del embudo.
  - **Params clave:** `step_number`, `event_label` (`step_1`, `step_2`, `step_3`).

- `form_option_select`
  - **Cuando dispara:** al seleccionar opcion de `capital`, `objetivo`, `plazo`, `viaje`.
  - **Uso:** entender perfil de demanda real.
  - **Params clave:** `form_dimension`, `form_value`.

- `lead_submit_attempt`
  - **Cuando dispara:** cada intento de envio del formulario principal.
  - **Uso:** base para ratio de exito real.

- `lead_submit_validation_error`
  - **Cuando dispara:** error de validacion en email o telefono.
  - **Uso:** detectar friccion de UX.
  - **Params clave:** `event_label` (`invalid_email`, `invalid_phone`).

- `lead_submit_error`
  - **Cuando dispara:** error de backend/red al enviar.
  - **Uso:** detectar incidencias tecnicas.
  - **Params clave:** `event_label` (`web3forms_rejected`, `network_error`).

- `generate_lead`
  - **Cuando dispara:** envio correcto del formulario principal.
  - **Uso:** conversion principal de marketing.
  - **Params clave:** `lead_tier`, `lead_country`, `value` (score del lead).

- `whatsapp_modal_open`
  - **Cuando dispara:** apertura del modal WhatsApp.
  - **Uso:** medir preferencia por canal conversacional.

- `whatsapp_lead_submit`
  - **Cuando dispara:** envio del mini formulario del modal WhatsApp.
  - **Uso:** leads captados por canal WhatsApp.

- `whatsapp_click`
  - **Cuando dispara:** clic en WhatsApp desde pantalla de exito.
  - **Uso:** medir activacion post-conversion.

- `roi_calculator_interaction`
  - **Cuando dispara:** ajuste de sliders ROI (con debounce).
  - **Uso:** medir engagement con herramienta analitica.
  - **Params clave:** `roi_price`, `roi_yield_pct`, `roi_revaluation_pct`, `roi_total_pct`.

- `section_view`
  - **Cuando dispara:** primera visualizacion de secciones clave (`hero`, `para-quien`, `como`, `zonas-inversion`, `roi`, `form`, `faq`).
  - **Uso:** mapa de consumo de contenido y perdida de atencion.
  - **Params clave:** `section_id`.

## 3) KPI recomendados (operativos)

- **CTR a formulario:** `generate_lead_click / sesiones`.
- **Avance de embudo:** `step_1 -> step_2 -> step_3 -> lead_submit_attempt -> generate_lead`.
- **Tasa de validacion fallida:** `lead_submit_validation_error / lead_submit_attempt`.
- **Tasa de error tecnico:** `lead_submit_error / lead_submit_attempt`.
- **Tasa de exito formulario:** `generate_lead / lead_submit_attempt`.
- **Peso WhatsApp:** `(whatsapp_lead_submit + whatsapp_click) / generate_lead_click`.
- **Interes analitico:** `roi_calculator_interaction / sesiones`.

## 4) Como interpretar correctamente

- Si sube `generate_lead_click` pero no sube `step_2`, el problema es de continuidad de formulario (UX o mensaje).
- Si sube `lead_submit_attempt` y bajan conversiones, revisa `lead_submit_validation_error` y `lead_submit_error`.
- Si sube `whatsapp_modal_open` pero no `whatsapp_lead_submit`, el modal no esta cerrando bien la accion.
- Si `section_view` cae fuerte en `como` o `zonas-inversion`, probablemente hay sobrecarga de contenido antes de CTA.
- Si sube `roi_calculator_interaction` y no sube `generate_lead`, la calculadora interesa pero no transfiere confianza al cierre.

## 5) Configuracion recomendada en GA4 (UI)

1. En **Administrador > Eventos**, marcar `generate_lead` como **conversion**.
2. Crear dimensiones personalizadas de evento:
   - `lead_tier`
   - `lead_country`
   - `form_dimension`
   - `form_value`
   - `section_id`
3. Crear exploracion de embudo:
   - `generate_lead_click`
   - `form_step_view` (step_1)
   - `form_step_view` (step_2)
   - `form_step_view` (step_3)
   - `lead_submit_attempt`
   - `generate_lead`
4. Crear comparaciones por dispositivo, pais y fuente de trafico.

## 6) Rutina semanal recomendada

- Revisar conversion principal (`generate_lead`) y tendencia semanal.
- Revisar perdidas por paso del formulario.
- Revisar top errores de validacion y tecnicos.
- Revisar adopcion WhatsApp vs formulario principal.
- Revisar consumo de secciones para detectar bloques de friccion.

## 7) Archivo tecnico relacionado

- Implementacion principal en `index.html`.
- Eventos enviados con `gtag('event', ...)` dentro del script principal del sitio.

