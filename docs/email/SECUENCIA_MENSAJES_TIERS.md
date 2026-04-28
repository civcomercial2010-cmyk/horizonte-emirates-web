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
- Asunto: `Hola [NOMBRE], ya estamos revisando su consulta sobre Dubai`
- Texto:
  - Hola [NOMBRE],
  - Gracias por contactar con nosotros sobre inversión en Dubai.
  - Estamos preparando un análisis personalizado para [CAPITAL] con enfoque en [OBJETIVO].
  - En las próximas horas le enviaremos algunas opciones concretas y el siguiente paso recomendado.
  - Si tiene alguna pregunta urgente, puede escribirme por WhatsApp: [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### A2 - delay 5h
- Asunto: `[NOMBRE], algunas opciones que podrían interesarle`
- Texto:
  - Hola [NOMBRE],
  - Basándome en su perfil de [CAPITAL] y [OBJETIVO], he seleccionado tres opciones que podrían encajar bien.
  - Dubai Marina/Business Bay: alrededor del 7-8% neto anual.
  - Ras Al Khaimah (antes del Wynn): potencial de plusvalía del 20-30% desde 200.000€.
  - Abu Dhabi (Aldar): 5-7% neto, más estable.
  - Si quiere que hablemos de alguna en detalle, podemos agendar 20 minutos por Calendly [CALENDLY] o por WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### A3 - delay 24h
- Asunto: `Un detalle importante sobre inversiones en Dubai, [NOMBRE]`
- Texto:
  - Hola [NOMBRE],
  - Algo que veo a menudo con perfiles como el suyo es que los mejores activos off-plan tienen plazos limitados para entrar.
  - No es para presionar, solo para que sepa que a veces vale la pena revisar opciones pronto.
  - Si le apetece, podemos charlar 20 minutos sobre esto sin compromiso: Calendly [CALENDLY] o WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### A4 - delay 48h
- Asunto: `¿Ha pensado en visitar Dubai antes de decidir? [NOMBRE]`
- Texto:
  - Hola [NOMBRE],
  - Una cosa que ayuda mucho a la hora de decidir es visitar Dubai en persona.
  - Podemos organizar una agenda con visitas a propiedades y reuniones con promotoras certificadas por RERA.
  - Todo sin coste para usted (viaje y alojamiento por su cuenta, claro).
  - Si le interesa, hablemos por WhatsApp [WA] o agendemos algo por Calendly [CALENDLY].
  - Saludos,
  - Equipo Horizonte Emirates

### A5 - delay 120h
- Asunto: `[NOMBRE], ¿sigue pensando en Dubai?`
- Texto:
  - Hola [NOMBRE],
  - Quería saber si Dubai sigue siendo una opción que está considerando para invertir.
  - Si sí, podemos retomar la conversación cuando le venga bien.
  - Si no es el momento, no hay problema, lo dejamos aquí.
  - Envíeme un mensaje por WhatsApp [WA] si quiere.
  - Saludos,
  - Equipo Horizonte Emirates

---

## Tier B (7 emails)

### B1 - delay 0h
- Asunto: `Hola [NOMBRE], hemos recibido su consulta`
- Texto:
  - Hola [NOMBRE],
  - Gracias por escribirnos sobre inversión en Dubai con [CAPITAL] y [OBJETIVO].
  - Estamos preparando algunas opciones y una comparativa de zonas para usted.
  - Le escribiremos en las próximas 24 horas con más detalles.
  - Si tiene alguna duda ahora, WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### B2 - delay 24h
- Asunto: `[NOMBRE], ¿podemos hablar 20 minutos esta semana?`
- Texto:
  - Hola [NOMBRE],
  - Ya tengo preparadas algunas opciones que podrían interesarle basadas en su perfil.
  - ¿Le vendría bien una llamada breve de 20 minutos para revisarlas sin compromiso?
  - Podemos agendarla por Calendly [CALENDLY] o directamente por WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### B3 - delay 72h
- Asunto: `Aspectos clave antes de invertir en Dubai desde [PAIS]`
- Texto:
  - Hola [NOMBRE],
  - Antes de dar pasos, es útil saber lo básico sobre fiscalidad en UAE (0% en muchos casos), obligaciones en [PAIS], proceso RERA y capital mínimo requerido.
  - Recuerde que no damos asesoramiento fiscal o jurídico, solo información general.
  - Si quiere que aclare alguna duda, WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### B4 - delay 168h
- Asunto: `Lo que cambia al ver Dubai en persona, [NOMBRE]`
- Texto:
  - Hola [NOMBRE],
  - He visto que una visita a Dubai acelera mucho las decisiones de inversión.
  - Podemos organizar una agenda con visitas a propiedades y reuniones con promotoras en español.
  - Todo acompañado y sin coste adicional para usted.
  - Si le interesa, hablemos por WhatsApp [WA] o Calendly [CALENDLY].
  - Saludos,
  - Equipo Horizonte Emirates

### B5 - delay 288h
- Asunto: `[NOMBRE], actualización de mercado para su perfil`
- Texto:
  - Hola [NOMBRE],
  - Hay algunos activos disponibles esta semana que podrían encajar con [CAPITAL] y [OBJETIVO].
  - Si quiere, podemos hablar 20 minutos con números reales.
  - Calendly [CALENDLY] o WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### B6 - delay 480h
- Asunto: `[NOMBRE], ¿sigue valorando Dubai?`
- Texto:
  - Hola [NOMBRE],
  - Hace unas semanas hablamos de inversión en Dubai.
  - ¿Sigue siendo algo que está considerando?
  - Si quiere, podemos hacer una llamada corta de 15 minutos para ver si encaja.
  - Calendly [CALENDLY] o WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### B7 - delay 840h
- Asunto: `[NOMBRE], un último mensaje antes de pausar`
- Texto:
  - Hola [NOMBRE],
  - Llevamos un tiempo en contacto sobre Dubai.
  - Voy a pausar los mensajes para no molestar.
  - Si en algún momento quiere retomar, estoy aquí.
  - WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

---

## Tier C (8 emails)

### C1 - delay 0h
- Asunto: `Gracias por su consulta sobre Dubai, [NOMBRE]`
- Texto:
  - Hola [NOMBRE],
  - Gracias por escribirnos sobre inversión en Dubai.
  - Le enviaremos información útil sobre el mercado, fiscalidad y comparativas en los próximos días.
  - Sin prisa ni presión.
  - Si tiene alguna pregunta, WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### C2 - delay 72h
- Asunto: `[NOMBRE], comparativa España vs Dubai`
- Texto:
  - Hola [NOMBRE],
  - Una comparación rápida entre invertir en España y Dubai.
  - Rentabilidades, impuestos y riesgos de ocupación.
  - Le puede ayudar a ver el panorama general.
  - Si quiere comentarlo, responda este email o WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### C3 - delay 168h
- Asunto: `[NOMBRE], pasos para comprar en Dubai`
- Texto:
  - Hola [NOMBRE],
  - El proceso de compra en Dubai tiene 5 pasos principales: selección, verificación RERA, reserva/SPA, pagos y obligaciones en [PAIS].
  - Recuerde que no asesoramos fiscalmente.
  - Si tiene dudas, WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### C4 - delay 336h
- Asunto: `Ejemplo real de inversión española en Dubai`
- Texto:
  - Hola [NOMBRE],
  - Un caso que veo a menudo: alguien con 200.000€ invirtiendo en Dubai.
  - Perfil, decisión, proyección y proceso.
  - Solo orientativo, rentabilidades no garantizadas.
  - Si quiere más detalles, WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### C5 - delay 504h
- Asunto: `[NOMBRE], nota sobre Ras Al Khaimah`
- Texto:
  - Hola [NOMBRE],
  - Ras Al Khaimah está interesante ahora, con el Wynn 2027 en camino.
  - Podría haber una ventana de apreciación para perfiles como el suyo ([CAPITAL] / [OBJETIVO]).
  - Si quiere hablar de ello, WhatsApp [WA] o Calendly [CALENDLY].
  - Saludos,
  - Equipo Horizonte Emirates

### C6 - delay 720h
- Asunto: `[NOMBRE], 20 minutos para ver si Dubai encaja`
- Texto:
  - Hola [NOMBRE],
  - Hace un mes hablamos de Dubai.
  - ¿Le vendría bien una llamada de 20 minutos para ver con datos si encaja con su situación?
  - Sin compromiso.
  - Calendly [CALENDLY] o WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

### C7 - delay 1080h
- Asunto: `Breve actualización de mercado en Dubai`
- Texto:
  - Hola [NOMBRE],
  - Una actualización rápida del mercado para perfiles como el suyo.
  - Hay opciones disponibles si sigue interesado.
  - Responda este email o WhatsApp [WA] si quiere más info.
  - Saludos,
  - Equipo Horizonte Emirates

### C8 - delay 2160h
- Asunto: `[NOMBRE], ¿Dubai sigue en su radar?`
- Texto:
  - Hola [NOMBRE],
  - Hace tiempo que no hablamos.
  - ¿Sigue considerando Dubai para invertir?
  - El mercado ha evolucionado un poco.
  - Si quiere retomar, WhatsApp [WA].
  - Saludos,
  - Equipo Horizonte Emirates

---

## Nota operativa

- Esta guia resume la secuencia de copy y timing.
- La version ejecutable y definitiva siempre es la de `automation/horizonte-emails.gs`.
