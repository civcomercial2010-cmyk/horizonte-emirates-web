# Auditoría — Guía fiscal Dubai ↔ España (M19)

**Fecha:** 9 junio 2026  
**Documento auditado:** `public/guias/guia-fiscal-dubai-espana.html` + PDF generado  
**Referencia estratégica:** `docs/SEO_ESTRATEGIA.md` §7 (lead magnet #1: PDF 15–20 pág.)

---

## Veredicto ejecutivo

| Dimensión | Nota | Comentario |
|---|---|---|
| **Contenido** | 5/10 | Estructura correcta pero demasiado condensada; varias secciones son un párrafo. No justifica el valor percibido de un lead magnet exclusivo. |
| **Estética** | 6/10 | Limpia pero genérica (Helvetica/Georgia del sistema). No usa tipografía de marca ni identidad visual del blog/home. |
| **Cumplimiento YMYL** | 8/10 | Disclaimers, fuentes y tono prudente bien resueltos. |
| **Diferenciación vs blog** | 4/10 | ~90% del texto es reciclado del artículo pilar sin aportar profundidad extra. |
| **Formato PDF** | 6/10 | 7 páginas (objetivo: 15–20). Mucho espacio en blanco al final de secciones cortas. |
| **Conversión** | 7/10 | CTA final correcto; falta checklist imprimible y “lleva esto a tu asesor” más desarrollado. |

**Conclusión:** Funcional como MVP de M19, pero **no cumple la promesa de valor** del lead magnet ni el brief de 15–20 páginas. Recomendable sustituir por una versión enriquecida antes de escalar ads.

---

## Problemas de contenido detectados

### 1. Secciones demasiado breves (sub-desarrolladas)

| Sección | Estado actual | Qué falta |
|---|---|---|
| IRPF alquiler | 2 párrafos | Gastos deducibles, diferencia base general vs actividad, impacto en rentabilidad neta real |
| Patrimonio | 1 párrafo | Mínimos exentos orientativos, variación por CCAA, cuándo declarar aunque no pagues |
| CDI España-EAU | 1 párrafo | Artículos relevantes, crédito fiscal (por qué no aplica en la práctica), residencia fiscal mixta |
| Residencia fiscal | 1 párrafo genérico | Criterios 183 días, Golden Visa ≠ residencia fiscal, certificado TRC, planificación de salida de España |
| Compra en UAE | Solo mencionada en calendario | Tabla de costes (DLD ~4%, admin, service charge) — ya existe en el blog |

### 2. Ausencias respecto al cluster fiscal del blog

- No hay **ejemplo numérico ilustrativo** (alquiler anual → IRPF orientativo).
- No hay **FAQ** (4 preguntas del artículo pilar).
- No hay **checklist imprimible** con casillas.
- No distingue **Golden Visa vs residencia fiscal** (error frecuente del target).
- No incluye el artículo específico de **Modelo 720** como profundización (plazos, redeclaración, documentación Dubai).

### 3. Duplicación sin valor añadido

El lead magnet debe ser **más profundo que el blog**, no un resumen del blog. Hoy el inversor que leyó el artículo pilar no recibe nada nuevo al descargar la guía → riesgo de decepción post-conversión.

### 4. Brecha vs brief SEO (15–20 páginas)

- Actual: ~7 páginas PDF.
- Objetivo estrategia: 15–20 páginas con valor percibido alto.
- Gap: ~8–13 páginas de contenido accionable (ejemplos, tablas, checklists, FAQ, anexos).

---

## Problemas estéticos detectados

1. **Tipografía:** Helvetica Neue / Georgia genéricas. La web usa **Cormorant Garamond + Inter** (self-hosted).
2. **Portada:** Texto-only; sin logo SVG ni imagen de marca. El blog tiene hero visual en cada artículo.
3. **Jerarquía visual:** Todas las secciones se ven iguales; faltan **stat cards** (4%, 50.000€, 183 días) y diagrama origen/destino.
4. **Densidad:** Mucho texto corrido; faltan tablas comparativas, callouts tipados (aviso / práctica / clave).
5. **Print/PDF:** Sin saltos de página estratégicos, sin numeración, sin cabecera/pie en impresión.
6. **Checklist:** Lista con ✓ pero sin formato “documento de trabajo” (casillas vacías para marcar).

---

## Lo que sí funciona (mantener)

- Estructura de 10 capítulos lógica y alineada con el cluster.
- Bloque “En una frase” / takeaways.
- Tabla de obligaciones y calendario fiscal.
- Tabla de tramos base del ahorro (plusvalías).
- Disclaimers YMYL bien redactados.
- `noindex` correcto (no compite con blog).
- Toolbar con descarga PDF + CTA final al funnel.
- Integración email (`CONFIG.GUIDE_URL` en `horizonte-emails.gs`).

---

## Versiones propuestas para aprobación

| Versión | Archivo | Páginas est. | Perfil | Cuándo usar |
|---|---|---|---|---|
| **v1 (actual)** | `guia-fiscal-dubai-espana.html` | ~7 | MVP mínimo | Referencia; no recomendada como definitiva |
| **v2 Completa** | `guia-fiscal-dubai-espana-v2-completa.html` | ~14–16 | Lead magnet definitivo | Producción + email + ads |
| **v2 Ejecutiva** | `guia-fiscal-dubai-espana-v2-ejecutiva.html` | ~8–10 | Resumen accionable | Si preferís PDF corto de alto impacto |

**Preview comparativo:** `public/guias/preview-guia-fiscal.html`

---

## Checklist de aprobación (para el equipo)

- [ ] ¿La profundidad de v2 Completa justifica el lead magnet frente al artículo de blog?
- [ ] ¿El tono YMYL es suficientemente prudente en ejemplos numéricos?
- [ ] ¿Preferís v2 Completa o v2 Ejecutiva como PDF descargable?
- [ ] ¿Actualizamos `CONFIG.GUIDE_URL` y regeneramos PDF al aprobar?
- [ ] ¿Revisión por asesor fiscal externo antes de escalar tráfico de pago?

---

## Próximos pasos tras aprobación

1. Renombrar la versión elegida → `guia-fiscal-dubai-espana.html` (o actualizar URL en emails).
2. Regenerar PDF con `scripts/generate-guia-fiscal-pdf.ps1`.
3. Actualizar ROADMAP M19 con versión definitiva.
4. Opcional: A/B en email (tarjeta “Guía ampliada 2026” vs actual).
