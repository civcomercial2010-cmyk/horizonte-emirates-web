# Horizonte Emirates — Tareas Pendientes
_Actualizado: referencias de landing pasadas a index-v6.html (tareas T12–T15)_

---

## BLOQUEADAS (no se pueden ejecutar aún)

| # | Tarea | Motivo bloqueo |
|---|---|---|
| B03 | Firma Referral Agreement con RRS | Esperando respuesta Legal RRS (desde 14/04) |
| B04 | Activar campañas Google Ads + Meta Ads | Conflicto Irán — mercado parado |

---

## ACTIVAS — Por orden de ejecución

### 1. `index.html` → publicar landing V6 + motor emails
**Estado:** ✅ Completada — `index.html` redirige a `index-v6.html` (commit 9fc36b3); script en `automation/horizonte-emails.gs` en repo

---

### 2. Verificar Apps Script en producción (T08)
**Qué hacer:**
- Abrir [script.google.com](https://script.google.com)
- Abrir el proyecto del email engine
- Pegar el código actualizado de `automation/horizonte-emails.gs` (el del repo)
- Ejecutar `diagnoseFormPipeline()` para confirmar que Gmail, Sheets y triggers están activos

---

### 3. Configurar email `hola@horizonteemirates.com` (T10)
**Qué hacer:**
1. En el panel del registrador del dominio → activar reenvío de email: `hola@horizonteemirates.com` → `civcomercial2010@gmail.com`
2. En Gmail → Configuración → Cuentas → "Enviar correo como" → Añadir `hola@horizonteemirates.com` → verificar con el código que llegará a civcomercial
3. **Repo:** `sendEmail()` ya incluye `from: CONFIG.REPLY_TO` (fallará hasta completar pasos 1–2 y verificar la identidad en Gmail).

---

### 4. Verificar Calendly activo (T09)
**Qué hacer:**
- Confirmar que [calendly.com/horizonteemirates](https://calendly.com/horizonteemirates) existe y tiene evento activo (20 min)
- El evento debe llamarse "Llamada estratégica inversión Dubai"
- Preguntas custom en este orden: (1) Capital disponible · (2) Objetivo · (3) Plazo · (4) País
- Hacer una reserva de prueba y confirmar que el briefing llega por email

---

### 5. Instalar Google Analytics 4 en la landing (T12)
**Qué hacer:**
1. Ir a [analytics.google.com](https://analytics.google.com) → crear propiedad "Horizonte Emirates" → dominio `horizonteemirates.com`
2. Copiar el ID de medición (formato `G-XXXXXXXXXX`)
3. Añadir el snippet de GA4 en el `<head>` de `index-v6.html`
4. Añadir eventos en el código JS: `form_submit`, `wa_click`, `calendly_click`
5. Verificar que los eventos llegan en GA4 → DebugView

---

### 6. Crear cuenta Google Ads + campaña en borrador (T13)
**Qué hacer:**
1. Crear cuenta en [ads.google.com](https://ads.google.com) con `civcomercial2010@gmail.com`
2. Vincular con GA4 e importar conversión `form_submit` como "Formulario cualificado"
3. Instalar Google Tag en `index-v6.html`
4. Crear campaña de Búsqueda en **BORRADOR** (no activar):
   - Presupuesto: 15€/día
   - Zona: Madrid, Barcelona, Marbella, Valencia, Sevilla, Bilbao
   - Keywords: "inversión inmobiliaria Dubai", "comprar piso Dubai", "invertir en Dubai España", "inmuebles Dubai español"
   - Negativas: "trabajo", "hotel", "visa", "alquiler vacacional"
5. Dejar la campaña en PAUSA — lista para activar en 1 clic

---

### 7. Instalar Meta Pixel + campaña en borrador (T14)
**Qué hacer:**
1. Crear cuenta en [business.facebook.com](https://business.facebook.com) → Pixel → "Horizonte Emirates"
2. Instalar el código base del Pixel en el `<head>` de `index-v6.html`
3. Añadir `fbq('track', 'Lead')` al submit del formulario
4. Crear campaña en **BORRADOR**: objetivo Leads, público 35–60 años, intereses inversión/bienes raíces, zona España
5. Dejar en PAUSA — lista para activar

---

### 8. Añadir UTM tracking al formulario (T15)
**Qué hacer:**
1. En `index-v6.html`, antes del submit del formulario, capturar parámetros UTM de la URL con JS y rellenar campos ocultos
2. Añadir al formulario Web3Forms: `<input type="hidden" name="utm_source">`, `utm_medium`, `utm_campaign`
3. En `horizonte-emails.gs`, actualizar `parseLeadFromEmail()` para que lea los campos UTM y los guarde en Sheets
4. Añadir columnas UTM a la hoja "Leads" del Google Sheet

---

### 9. Test end-to-end del funnel (T16)
**Qué hacer:**
1. Rellenar el formulario con un email de prueba (no civcomercial)
2. Verificar que en 10 min: llega el aviso de Web3Forms + se etiqueta como `HE-procesado` en Gmail
3. Verificar en el Google Sheet que el lead aparece correctamente en la hoja Leads
4. Verificar en la hoja Cola que la secuencia de emails está programada
5. Confirmar que el primer email (A1/B1/C1) llega en menos de 10 min
6. Revisar el email recibido: nombre personalizado, botones de CTA funcionales, enlace Calendly válido

---

### 10. Verificar landing en mobile (T17)
**Qué hacer:**
- Abrir `horizonteemirates.com` en iPhone y Android
- Verificar: formulario multi-paso, auto-advance, scroll, modal WA, botón flotante sin tapar contenido
- Corregir cualquier problema encontrado

---

### 11. Google Search Console (T18)
**Qué hacer:**
1. Ir a [search.google.com/search-console](https://search.google.com/search-console) → añadir propiedad → Dominio: `horizonteemirates.com`
2. Verificar propiedad añadiendo el registro DNS TXT que te indique (en el panel del registrador del dominio)
3. Enviar sitemap (crear `sitemap.xml` básico si no existe y subir a GitHub Pages)

---

## FUTURAS (cuando haya leads / Fase 3)

| # | Tarea | Cuándo |
|---|---|---|
| F01 | Gestionar primer lead Tier A — handoff a Marc/RRS en <2h | Al llegar el primer lead |
| F02 | Acumular 10 leads + medir CPL → cierre Fase 2 | Tras 10 leads |
| F03 | Activar campañas Google Ads + Meta (borradores ya preparados) | Al resolverse contexto geopolítico |
| F04 | Migrar a ActiveCampaign (secuencias automatizadas) | Tras 10 leads |
| F05 | Gestionar lead cualificado con Marc hasta SPA firmado | Fase 3 |
| F06 | Cobrar primera comisión | Tras SPA + 20% pagado |
| T19 | Canal privado Telegram con invitación automática por formulario | ≥10 leads |

---

_Archivo maestro completo: `G:\Mi unidad\Horizonte Emirates\02_tareas.md`_
