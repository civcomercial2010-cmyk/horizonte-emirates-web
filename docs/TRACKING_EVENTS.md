# Taxonomía de eventos — Horizonte Emirates (GA4 G-BK37V83363)

Fuente de verdad de los eventos que **realmente** dispara el sitio. Antes de crear un
evento clave, una audiencia o una conversión en GA4/Ads, consultar esta lista.
Regla: **no inventar nombres nuevos** para algo ya cubierto aquí; reutilizar el existente.

---

## ⭐ Conversión (único evento clave)

| Evento | Cuándo | Parámetros | Notas |
|---|---|---|---|
| `generate_lead` | Envío del formulario **con éxito** (respuesta OK de Web3Forms) | `value` (€ por tier: A=300/B=120/C=40), `currency`=EUR, `lead_tier`, `lead_score`, `lead_country`, `form_name`, `lead_source` | **Es el ÚNICO evento clave.** Importado a Google Ads como conversión principal. |

---

## Eventos de funnel / formulario (index.html)

| Evento | Cuándo | Parámetros clave |
|---|---|---|
| `generate_lead_click` | Clic en cualquier CTA que lleva a `#form` | `event_label` (texto del CTA), `link_target` |
| `form_step_view` | Se muestra un paso del formulario (1/2/3) | `step_number` |
| `form_option_select` | Se selecciona una opción (capital/objetivo/plazo/viaje) | `form_dimension`, `form_value` |
| `lead_submit_attempt` | Pulsa "Enviar" | — |
| `lead_submit_validation_error` | Email o teléfono inválido | `event_label` (invalid_email / invalid_phone) |
| `lead_submit_error` | Web3Forms rechaza o error de red | `event_label` (web3forms_rejected / network_error) |

## Eventos de contacto (index.html)

| Evento | Cuándo | Parámetros |
|---|---|---|
| `whatsapp_click` | Clic en WhatsApp de la pantalla de éxito | `event_label` |
| `whatsapp_modal_open` | Se abre el modal de WhatsApp | `event_label` |
| `whatsapp_lead_submit` | Envío del formulario del modal de WhatsApp | `event_label` |

## Eventos de engagement (index.html)

| Evento | Cuándo | Parámetros |
|---|---|---|
| `section_view` | Una sección entra en viewport (hero, para-quien, como, zonas, roi, form, faq) | `section_id` |
| `roi_calculator_interaction` | Se ajusta la calculadora ROI | `roi_price`, `roi_yield_pct`, `roi_revaluation_pct`, `roi_total_pct` |

## Eventos de la página de proyectos (proyectos.html)

| Evento | Cuándo | Parámetros |
|---|---|---|
| `cta_click` | Clic en CTA de nav / cartera bloqueada / CTA final | `button_text`, `section` |
| `project_cta` | Clic en "Solicitar análisis" de una ficha de proyecto | `project`, `action` |
| `whatsapp_click` | Clic en WhatsApp (ficha o botón flotante) | `context` |
| `carousel_slide` | Cambio de imagen en un carrusel | `project`, `slide` |
| `scroll_depth` | Hitos de scroll (25/50/75/100%) | `percentage`, `page` |

## Consentimiento (assets/consent.js)

| Evento | Cuándo | Parámetros |
|---|---|---|
| `consent_decision` | El usuario acepta o rechaza cookies | `decision` (granted / denied) |

---

## ⚠️ Eventos clave "fantasma" a ELIMINAR en GA4

Estos están marcados como evento clave en GA4 pero **el sitio NO los dispara**
(provienen de configuraciones/arquitectura previas). Mantenerlos como evento clave
distorsiona las conversiones y la optimización de Ads. **Desmarcarlos en GA4:**

- `purchase`
- `qualify_lead`
- `close_convert_lead`
- `manual_event_SUBMIT_L`

> El único evento clave correcto es `generate_lead`.

---

## Notas de coherencia (deuda menor, no urgente)

- `whatsapp_click` usa `event_label` en index.html y `context` en proyectos.html.
  Para análisis unificado, futuro: estandarizar a un solo parámetro.
- Los eventos de proyectos.html no llevan `event_category`; los de index.html sí.
  Aditivo y opcional: añadir `event_category` para agrupar mejor en informes.
- No renombrar eventos ya en producción sin migrar antes los informes/audiencias que los usen.
