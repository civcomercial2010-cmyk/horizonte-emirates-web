# Horizonte Emirates - Copys de Emails (Tiers A/B/C)

Este documento extrae el copy de `getTemplate(code, lead)` en `horizonte-emails.gs`,
regenerado directamente desde el código el 7-sep-2026 (la versión anterior de este
documento estaba desactualizada: describía un A1 que ya no existía en el código real).

**Estado: código muerto desde el 30-jul-2026.** `CONFIG.AUTO_SEND_LEADS = false` apaga
el envío automático de estas secuencias; el trabajo real de primer contacto y seguimiento
lo hace el kit manual de `automation/MAILS-MANUALES.md` (M1-M11, D1-D3). Estas plantillas
A1-C8 se mantienen revisadas y alineadas con las reglas de estilo vigentes por si algún
día se reactiva la automatización (ver `reanudarEnvioAutomatico()`), pero **hoy no le
llega ni un correo a ningún lead desde aquí**. Los dos únicos correos que sí salen solos
son **W0** (acuse de recibo del formulario) y **W0D** (entrega de la guía a quien la descarga
en la home); el copy de los dos está en `getTemplate()` y se documenta en
`automation/MAILS-MANUALES.md`.

## Variables dinámicas usadas en los copys

- `${n}`: nombre del lead tal cual llega del formulario (nombre completo)
- `${pila}`: solo el nombre de pila, con inicial en mayúscula (usado en W0)
- `${sal}`: "Estimado" o "Estimada" según detección de género por el nombre (usado en B4-C8)
- `${cap}`: capital (label legible, ej. "150.000 a 300.000 €")
- `${obj}`: objetivo (label legible, ej. "generar renta pasiva con alquiler")
- `${pais}`: país del lead
- `${wa}`: teléfono WhatsApp en formato legible
- `${cal}` / `${calL}`: enlace Calendly (`calL` lleva el prefill de nombre/email/UTM)
- `${guiaUrl}`: `CONFIG.GUIDE_URL`, hoy `guia-fiscal-dubai-espana.html` (v2 completa)
- `${CONFIG.REPLY_TO}`: email de respuesta

El `html` de cada email usa además `${waBtn}`, `${calBtn}`, `${guiaCard}` y `${firma}`:
botones y tarjetas con estilo de marca definidos al principio de `getTemplate()`. Este
documento solo recoge `subject` y `text` (versión texto plano) para revisión rápida del
copy; el `html` completo está en el código.

---

## W0 · Acuse de recibo (único correo automático activo)

No forma parte de las secuencias A/B/C: sale solo, en segundos, para todos los tiers.
Interruptor propio: `CONFIG.AUTO_SEND_WELCOME`. Detalle completo de por qué está escrito
así en `automation/MAILS-MANUALES.md` §3 bis.

- **Subject:** `Hemos recibido su solicitud, ${pila}`
- **Text:**
```text
Hola ${pila},

[Su solicitud ha llegado correctamente. Esto es lo que hemos registrado: / Su solicitud
ha llegado correctamente y ya la tenemos en cola.]
[Capital: ${cap} / Objetivo: ${obj} / Teléfono: ${lead.telefono} / Residencia: ${pais}
 — solo las filas con dato real]

Este correo es automático, para que sepa que no se ha perdido nada. El siguiente lo
escribo yo, ${cuando} (24 horas), y ahí entramos en lo concreto: qué encaja con lo que
busca y qué no.

Mientras tanto le dejo la guía fiscal Dubai y España, que es lo que más dudas resuelve
al principio (IRPF, modelo 720, plusvalías y convenio de doble imposición):
${guiaUrl}

Y una cosa que suele sorprender: si en algún momento quiere ver los proyectos en
persona, le montamos nosotros la agenda completa en Emiratos, incluidas las visitas a
las promotoras y la reunión en nuestras oficinas de Dubai. Se lo cuento con calma en el
próximo correo.

Si prefiere adelantar y hablar directamente con Marc, nuestro socio en Dubai, puede
coger hueco aquí:
${calL}

Un saludo,
${firma}
Horizonte Emirates
Puede responder a este correo: lo leo yo.
```

---

## Tier A (A1-A5)

En tier A no va la guía fiscal en las plantillas A2-A5 (solo A1 la ofrece de entrada):
quien tiene el capital listo necesita hablar, no leer. Coherente con la regla del kit
manual ("en tier A no va la guía fiscal: distrae del único objetivo, que es la cita").

### A1
- **Subject:** `Hola ${n}, ya estamos revisando su consulta sobre Dubai`
- **Text:**
```text
Hola ${n},

Gracias por contactar con nosotros sobre inversión en Dubai.
Estamos preparando un análisis personalizado para ${cap} con enfoque en ${obj}.

En las próximas horas le enviaremos algunas opciones concretas y el siguiente paso
recomendado.

Mientras tanto, le dejamos nuestra guía fiscal Dubai-España (IRPF, Modelo 720,
plusvalías): ${guiaUrl}

Si tiene alguna pregunta urgente, puede escribirme por WhatsApp: ${wa}

Saludos,
Equipo Horizonte Emirates
```

### A2
- **Subject:** `${n}, algunas opciones que podrían interesarle`
- **Text:**
```text
Hola ${n},

Basándome en su perfil de ${cap} y ${obj}, he seleccionado tres opciones que podrían
encajar bien.

Dubai Marina/Business Bay: alrededor del 7-8% bruto anual.
Ras Al Khaimah (antes del Wynn): escenario orientativo de plusvalía del 20-30% desde
200.000€, sin resultados garantizados.
Abu Dhabi (Aldar): 5-7% bruto, más estable.

Si quiere que hablemos de alguna en detalle, podemos agendar 30 minutos por Calendly
${calL} o por WhatsApp ${wa}.

Saludos,
Equipo Horizonte Emirates
```

### A3
- **Subject:** `Un detalle importante sobre inversiones en Dubai, ${n}`
- **Text:**
```text
Hola ${n},

Algo que veo a menudo con perfiles como el suyo es que los mejores activos off-plan
tienen plazos limitados para entrar.

No es para presionar, solo para que sepa que a veces vale la pena revisar opciones
pronto.

Si le apetece, podemos charlar 30 minutos sobre esto sin compromiso: Calendly ${calL}
o WhatsApp ${wa}.

Saludos,
Equipo Horizonte Emirates
```

### A4
- **Subject:** `¿Ha pensado en visitar Dubai antes de decidir? ${n}`
- **Text:**
```text
Hola ${n},

Una cosa que ayuda mucho a la hora de decidir es visitar Dubai en persona.

Podemos organizar una agenda con visitas a propiedades y reuniones con promotoras en
español.

Todo sin coste para usted (viaje y alojamiento por su cuenta, claro).

Si le interesa, hablemos por WhatsApp ${wa} o agendemos algo por Calendly ${calL}.

Saludos,
Equipo Horizonte Emirates
```

### A5
- **Subject:** `${n}, ¿sigue pensando en Dubai?`
- **Text:**
```text
Hola ${n},

Quería saber si Dubai sigue siendo una opción que está considerando para invertir.

Si sí, podemos retomar la conversación cuando le venga bien.
Si no es el momento, no hay problema, lo dejamos aquí.

Envíeme un mensaje por WhatsApp ${wa} si quiere.

Saludos,
Equipo Horizonte Emirates
```

---

## Tier B (B1-B7)

### B1
- **Subject:** `Hola ${n}, hemos recibido su consulta`
- **Text:**
```text
Hola ${n},

Gracias por escribirnos sobre inversión en Dubai con ${cap} y ${obj}.

Estamos preparando algunas opciones y una comparativa de zonas para usted.

Le escribiremos en las próximas 24 horas con más detalles.

Mientras tanto, le dejamos nuestra guía fiscal Dubai-España (IRPF, Modelo 720,
plusvalías): ${guiaUrl}

Si tiene alguna duda ahora, WhatsApp ${wa}.

Saludos,
Equipo Horizonte Emirates
```

### B2
- **Subject:** `${n}, ¿podemos hablar 30 minutos esta semana?`
- **Text:**
```text
Hola ${n},

Ya tengo preparadas algunas opciones que podrían interesarle basadas en su perfil.

¿Le vendría bien una llamada breve de 30 minutos para revisarlas sin compromiso?

Podemos agendarla por Calendly ${calL} o directamente por WhatsApp ${wa}.

Saludos,
Equipo Horizonte Emirates
```

### B3
- **Subject:** `Aspectos clave antes de invertir en Dubai desde ${pais}`
- **Text:**
```text
Hola ${n},

Antes de dar pasos, es útil saber lo básico sobre fiscalidad en UAE (0% en muchos
casos), obligaciones en ${pais}, proceso RERA y capital mínimo requerido.

Recuerde que no damos asesoramiento fiscal o jurídico, solo información general.

Si quiere que aclare alguna duda, WhatsApp ${wa}.

Saludos,
Equipo Horizonte Emirates
```

### B4
- **Subject:** `Lo que cambia cuando ves Dubai en persona, ${n}`
- **Text:**
```text
${sal} ${n},

Muchos inversores aceleran su decisión tras visitar Dubai en persona.

Ver el activo, el entorno y al promotor de primera mano reduce dudas que no se
resuelven bien a distancia.

Organizamos el viaje: agenda, promotoras verificadas y equipo local.

WhatsApp ${wa} / ${calL}

Equipo Horizonte Emirates
```

### B5
- **Subject:** `${n}, activos disponibles esta semana para su perfil`
- **Text:**
```text
${sal} ${n},

Disponible esta semana para ${cap} · ${obj}:
- Dubai Marina/JVC: 7-8% bruto
- RAK pre-Wynn: máxima apreciación (escenario orientativo, sin garantía)
- Abu Dhabi: 5-7% bruto, estable

30 min para los números reales. ${cal} / WhatsApp ${wa}

Equipo Horizonte Emirates
```

### B6
- **Subject:** `${n}, ¿sigue valorando invertir en Dubai?`
- **Text:**
```text
${sal} ${n},

Tres semanas sin poder hablar. 15 minutos sin compromiso para su perfil.

${calL} / WhatsApp ${wa}

Equipo Horizonte Emirates
```

### B7
- **Subject:** `${n}, un último mensaje antes de hacer una pausa`
- **Text:**
```text
${sal} ${n},

Pausamos seguimiento activo. Cuando quiera retomarlo, estaremos encantados de
ayudarle.

${CONFIG.REPLY_TO} / WhatsApp ${wa}

Gracias.
Equipo Horizonte Emirates
```

---

## Tier C (C1-C8)

### C1
- **Subject:** `Gracias por su consulta sobre inversión en Dubai, ${n}`
- **Text:**
```text
${sal} ${n},

Consulta recibida. Le enviaremos contenido claro sobre mercado UAE, fiscalidad para
${pais} y comparativas de rentabilidad.

Para empezar, aquí tiene nuestra guía fiscal Dubai-España (IRPF, Modelo 720,
plusvalías): ${guiaUrl}

Sin prisa. Cuando esté listo/a, aquí estaremos.

WhatsApp: ${wa}

Equipo Horizonte Emirates
```

### C2
- **Subject:** `${n}, comparativa España vs Dubai`
- **Text:**
```text
${sal} ${n},

España: 3-5% bruto · hasta 45% IRPF · riesgo de ocupación ilegal alto
Dubai: 6-12% bruto · 0% impuestos · RERA protege al propietario

Cifras orientativas de mercado (JLL, Knight Frank, DLD). La fiscalidad depende de su
situación personal.

¿Comparativa para su perfil? Responda o WhatsApp ${wa}

Equipo Horizonte Emirates
```

Nota: los cuatro renglones de la tabla (rentabilidad, impuesto sobre rentas, impuesto
sobre plusvalías, riesgo de ocupación) están alineados con la tabla comparativa real
de la home (`public/index.html`, sección `.compare-table`). Si esa tabla cambia, esta
plantilla se desalinea y hay que revisarla.

### C3
- **Subject:** `${n}, proceso de compra en Dubai (pasos)`
- **Text:**
```text
${sal} ${n},

Proceso de compra en Dubai desde ${pais}:
1. Selección verificada
2. Due diligence RERA
3. Depósito + SPA
4. Pagos escalonados 30/30/40
5. ${pais}: Modelo 720 + IRPF rentas

Pasos orientativos que pueden variar según proyecto y promotor.

Dudas: WhatsApp ${wa}

Equipo Horizonte Emirates
```

### C4
- **Subject:** `Caso real: cómo invirtió un perfil español con 200.000€`
- **Text:**
```text
${sal} ${n},

Caso real: inversor español, 200k€, entrada 60k€ en dos off-plan.
Proyección: 7,2% bruto alquiler + 18-22% plusvalía RAK.
6 semanas, todo en español.

¿Opciones similares? WhatsApp ${wa}
(Datos orientativos, no garantizados)

Equipo Horizonte Emirates
```

### C5
- **Subject:** `${n}, nota sobre Ras Al Khaimah y el calendario del mercado`
- **Text:**
```text
${sal} ${n},

RAK + Wynn 2027: escenarios orientativos de +20-35% antes de la apertura.
La ventana de entrada se va cerrando progresivamente.

Para ${cap} · ${obj}: puede ser una pieza de alto potencial en UAE.

WhatsApp ${wa}

Equipo Horizonte Emirates
```

### C6
- **Subject:** `${n}, 30 minutos para decidir con datos si Dubai encaja`
- **Text:**
```text
${sal} ${n},

Un mes desde su consulta. 30 minutos para ${cap} · ${obj} y decirle con honestidad si
Dubai tiene sentido ahora.

Sin compromiso. ${calL} / WhatsApp ${wa}

Equipo Horizonte Emirates
```

### C7
- **Subject:** `Actualización breve del mercado en Dubai (su perfil)`
- **Text:**
```text
${sal} ${n},

Actualización mercado Dubai: Prime +4-6%, RAK máximo potencial pre-2027, off-plan
desde 150k.

Activos disponibles para ${cap} · ${obj}. ¿Se los presento?

WhatsApp ${wa}

Equipo Horizonte Emirates
```

### C8
- **Subject:** `${n}, ¿sigue en su radar invertir en Dubai?`
- **Text:**
```text
${sal} ${n},

Tres meses desde su consulta. Mercado: off-plan emergente +8-12%, RAK pre-Wynn se
acorta, demanda de alquiler en máximos.

¿Sigue Dubai en su radar? Solo una línea de respuesta.

WhatsApp ${wa}

Equipo Horizonte Emirates
```

---

## Auditoría del 7-sep-2026: qué se corrigió

Al regenerar este documento desde `getTemplate()` se encontraron y corrigieron en el
código estos fallos frente a las reglas de estilo vigentes (`horizonte-emirates/CLAUDE.md`
§6 y `automation/MAILS-MANUALES.md` §1):

| Plantilla | Fallo | Corrección |
|---|---|---|
| A2, B5, C2, C4 | Rentabilidad de alquiler etiquetada "neto" | "bruto", como exige la regla de la casa |
| B5, C2, C3, C4, C5, C7, C8 | Rayas medias (–) en rangos numéricos | Guion simple (-) |
| C2 | Tabla España vs Dubai con cifras propias (2,5-4% / 6-9%) que no coincidían con la home | Alineada a la tabla real de `index.html` (3-5% / 6-12%) |
| A2, B5, C5 | Proyecciones de plusvalía sin la coletilla "escenario orientativo, sin garantía" | Añadida, coherente con C4 (que sí la llevaba) |
| C3 | El HTML no llevaba el descargo "pasos orientativos" que sí llevaba el texto plano | Añadido al HTML |
