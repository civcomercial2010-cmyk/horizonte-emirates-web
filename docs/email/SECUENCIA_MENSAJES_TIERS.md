# Secuencia completa de mensajes por tier (Horizonte Emirates)

Fuente: `automation/horizonte-emails.gs` (funcion `getTemplate`).

Variables dinamicas usadas en plantillas:

- `[NOMBRE]`
- `[CAPITAL]`
- `[OBJETIVO]`
- `[PAIS]`
- `[WA]` (WhatsApp)
- `[CALENDLY]`

## Tier A (5 emails)

### A1 - delay 0h

- Asunto: `Su análisis de inversión en Dubai ya está en marcha, [NOMBRE]`
- Texto:
  - Gracias por su solicitud.
  - Ya estamos preparando su análisis para `[CAPITAL]` con foco en `[OBJETIVO]`.
  - En menos de 24 horas le escribiremos con opciones concretas y siguiente paso recomendado.
  - Si quiere avanzar hoy: WhatsApp `[WA]`.

### A2 - delay 5h

- Asunto: `[NOMBRE], 3 activos seleccionados para su perfil inversor`
- Texto:
  - Se han preseleccionado 3 activos para `[CAPITAL]` y `[OBJETIVO]`.
  - Dubai Marina/Business Bay: 7-8% neto.
  - RAK pre-Wynn: +20-30% plusvalia desde 300k.
  - Abu Dhabi Aldar: 5-7% neto, estable.
  - CTA: 20 min por Calendly `[CALENDLY]` o WhatsApp `[WA]`.

### A3 - delay 24h

- Asunto: `Un dato clave para su perfil inversor, [NOMBRE]`
- Texto:
  - Los activos off-plan que encajan con su perfil tienen ventanas de entrada limitadas.
  - No se pide decidir ahora; se propone llamada de 20 min para revisar datos sin presion.
  - CTA: `[CALENDLY]` o WhatsApp `[WA]`.

### A4 - delay 48h

- Asunto: `Antes de decidir, ¿ha valorado visitar Dubai, [NOMBRE]?`
- Texto:
  - La visita presencial reduce incertidumbre y acelera decisiones.
  - Se organiza agenda de visitas y reuniones con promotoras RERA.
  - Servicio sin coste para el inversor (vuelo/alojamiento por su cuenta).
  - CTA: WhatsApp `[WA]` o `[CALENDLY]`.

### A5 - delay 120h

- Asunto: `[NOMBRE], ¿mantiene Dubai como prioridad de inversión?`
- Texto:
  - Mensaje de cierre suave para confirmar prioridad actual.
  - Si sigue interesado, responder email o WhatsApp `[WA]`.
  - Si no es el momento, se pausa seguimiento sin problema.

---

## Tier B (7 emails)

### B1 - delay 0h

- Asunto: `Recibida su consulta, [NOMBRE] — análisis en preparación`
- Texto:
  - Consulta recibida para `[CAPITAL]` y `[OBJETIVO]`.
  - En 24h: activos seleccionados, comparativa de zonas y siguientes pasos.
  - CTA: WhatsApp `[WA]`.

### B2 - delay 24h

- Asunto: `[NOMBRE], ¿agendamos 20 minutos esta semana?`
- Texto:
  - Activos listos para su perfil.
  - Propuesta de llamada breve sin compromiso ni presion.
  - CTA: `[CALENDLY]` o WhatsApp `[WA]`.

### B3 - delay 72h

- Asunto: `Lo esencial antes de invertir en Dubai desde [PAIS]`
- Texto:
  - Resumen de fiscalidad UAE (0%), obligaciones en `[PAIS]`, proceso RERA y capital minimo.
  - Recordatorio legal: no se presta asesoramiento fiscal/juridico.
  - CTA: resolver dudas por WhatsApp `[WA]`.

### B4 - delay 168h

- Asunto: `Lo que cambia cuando ves Dubai en persona, [NOMBRE]`
- Texto:
  - Valor de la visita presencial para acelerar decision.
  - Agenda local con promotoras verificadas y acompañamiento en espanol.
  - CTA: WhatsApp `[WA]` y `[CALENDLY]`.

### B5 - delay 288h

- Asunto: `[NOMBRE], activos disponibles esta semana para su perfil`
- Texto:
  - Actualizacion de mercado por zonas y tipologia.
  - Propuesta de llamada de 20 min con numeros reales.
  - CTA: `[CALENDLY]` o WhatsApp `[WA]`.

### B6 - delay 480h

- Asunto: `[NOMBRE], ¿sigue valorando invertir en Dubai?`
- Texto:
  - Reenganche a 3 semanas.
  - Propuesta de llamada de 15 min sin compromiso.
  - CTA: `[CALENDLY]` o WhatsApp `[WA]`.

### B7 - delay 840h

- Asunto: `[NOMBRE], un último mensaje antes de hacer una pausa`
- Texto:
  - Cierre de seguimiento activo.
  - Puerta abierta para retomar cuando sea buen momento.
  - CTA: WhatsApp `[WA]`.

---

## Tier C (8 emails)

### C1 - delay 0h

- Asunto: `Gracias por su consulta sobre inversión en Dubai, [NOMBRE]`
- Texto:
  - Enfoque educativo y sin presion.
  - Anticipo de contenidos sobre mercado, fiscalidad y comparativas.
  - CTA: WhatsApp `[WA]`.

### C2 - delay 72h

- Asunto: `[NOMBRE], comparativa España vs Dubai`
- Texto:
  - Comparativa de rentabilidad, impuestos y riesgo de ocupacion.
  - Mensaje de contraste de marco inversor.
  - CTA: responder email o WhatsApp `[WA]`.

### C3 - delay 168h

- Asunto: `[NOMBRE], proceso de compra en Dubai (pasos)`
- Texto:
  - Proceso en 5 pasos: seleccion, due diligence RERA, reserva/SPA, pagos, obligaciones en `[PAIS]`.
  - Recordatorio legal fiscal.
  - CTA: WhatsApp `[WA]`.

### C4 - delay 336h

- Asunto: `Caso real: cómo invirtió un perfil español con 200.000€`
- Texto:
  - Caso orientativo con perfil, decision, proyeccion y proceso.
  - Nota de riesgo: rentabilidades no garantizadas.
  - CTA: WhatsApp `[WA]`.

### C5 - delay 504h

- Asunto: `[NOMBRE], nota sobre Ras Al Khaimah y el calendario del mercado`
- Texto:
  - Contexto RAK + Wynn 2027 y posible ventana de apreciacion.
  - Posicionamiento para perfil `[CAPITAL]` / `[OBJETIVO]`.
  - CTA: WhatsApp `[WA]` o `[CALENDLY]`.

### C6 - delay 720h

- Asunto: `[NOMBRE], 20 minutos para decidir con datos si Dubai encaja`
- Texto:
  - Reenganche al mes de la consulta.
  - Propuesta de llamada para validar encaje real sin compromiso.
  - CTA: `[CALENDLY]` o WhatsApp `[WA]`.

### C7 - delay 1080h

- Asunto: `Actualización breve del mercado en Dubai (su perfil)`
- Texto:
  - Actualizacion de mercado y recordatorio de activos disponibles.
  - CTA: responder email o WhatsApp `[WA]`.

### C8 - delay 2160h

- Asunto: `[NOMBRE], ¿sigue en su radar invertir en Dubai?`
- Texto:
  - Reapertura suave a 90 dias.
  - Resumen de evolucion de mercado y pregunta directa de continuidad.
  - CTA: WhatsApp `[WA]`.

---

## Nota operativa

- Esta guia resume la secuencia de copy y timing.
- La version ejecutable y definitiva siempre es la de `automation/horizonte-emails.gs`.

