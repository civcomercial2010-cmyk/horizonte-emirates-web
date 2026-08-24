# Área 6: Contratos, colaboradores y protección del negocio

**Auditoría estratégica Horizonte Emirates. Fecha de la evidencia: 20-08-2026.**
**Auditor: agente Área 6 (modo solo lectura). Fuentes: Drive `G:\Mi unidad\Horizonte Emirates\`, repositorio local `public/`, buzón Gmail del usuario (consultado el 20-08-2026 vía conector, solo lectura).**

---

## 0. Veredicto en una frase

El negocio está operando y pagando publicidad sobre un contrato que solo garantiza comisión en 1 de los 7 proyectos que la propia web publica, con los dos anexos que arreglarían el problema enviados el 27-07-2026 a una única dirección de correo y **sin respuesta de RRS en 24 días**, sin seguimiento documentado, y con el procedimiento de derivación de leads incumpliendo la cláusula que protege el derecho a cobrar.

---

## 1. Verificación del contexto previo

El contexto que se me pidió verificar ("RRS firmó el 13-jul, Propulse NO firmó, el 3% solo cubre NH Collection") era cierto a 21-07-2026 pero está **parcialmente desactualizado**. Lo verificado hoy:

| Afirmación del contexto | Estado real verificado el 20-08-2026 | Evidencia |
|---|---|---|
| RRS firmó el 13-07 | CONFIRMADO. Email de marc@rnr-realestate.com del 13-07-2026 08:06 UTC, asunto "Contrato Colaboración firmado": "Aquí tienes el contrato firmado por Rakesh. Quedo pendiente de recibirlo de vuelta con la mayor urgencia posible" | Gmail, hilo `19f5a83de168afc7` |
| Propulse NO firmó | **DESACTUALIZADO.** El 27-07-2026 15:26 UTC Propulse envió por email un adjunto llamado "Contrato RRS Referral firmado (1).pdf" con el texto "I'm also returning the signed Reference Contract". El cuerpo del email afirma la contrafirma. **No he podido abrir el PDF adjunto para verificar que la firma consta dentro** (las herramientas del conector Gmail no descargan adjuntos), y esa copia contrafirmada **no está archivada en ninguna carpeta de Drive** (búsqueda `find` por "referral", "firmado", "contrato": solo aparecen los dos .md) | Gmail, hilo `19fa3fbc921b3e36`, mensaje `19fa42f7d2c5f223`; búsqueda de archivos en `G:\Mi unidad\Horizonte Emirates\` |
| El 3% solo cubre NH Collection, el resto caso a caso | CONFIRMADO. Cláusula 3 del contrato: 3% del Net Sale Price "referred only to the NH Collection Al Marjan Island" y nota: resto de comisiones "case-by-case... subject to prior written confirmation by the Company for each project" | `G:\Mi unidad\Horizonte Emirates\06_contrato_rrs.md`, tabla "Términos EJECUTADOS", filas Fee y Resto de proyectos |

Incoherencia interna detectada: los archivos de estado del proyecto, actualizados el 09-08 y el 12-08, siguen tratando la contrafirma como pendiente (`02_tareas.md`, tarea RA-FIRMA "Crítica", y nota estratégica COO del 09-08: "contrafirma del contrato, que sigue crítica"), cuando el envío de la contrafirma se produjo el 27-07. O los archivos de estado no se actualizaron, o el propio usuario no da por buena la contrafirma enviada. En cualquier caso, **la fuente de verdad interna del proyecto está desincronizada con la realidad del buzón**.

---

## 2. El hallazgo central: el envío del 27-07 existe, pero está cojo y sin respuesta

### 2.1 Qué se envió (hecho verificado en Gmail)

Email enviado el **27-07-2026 15:26 UTC** desde hola@horizonteemirates.com, asunto **"Referral Agreement"**, con tres adjuntos:

1. `Contrato RRS Referral firmado (1).pdf` (el contrato contrafirmado, según el cuerpo del mensaje)
2. `ANNEX II - Data Protection.pdf`
3. `ANNEX I - Commission Schedule(1).pdf`

Evidencia: Gmail, hilo `19fa3fbc921b3e36`, mensaje `19fa42f7d2c5f223` (carpeta Enviados).

### 2.2 Las cuatro debilidades del envío (hechos verificados)

| # | Debilidad | Detalle | Evidencia |
|---|---|---|---|
| 1 | **Destinatario único y distinto del planificado** | El plan (`EMAIL_MARC_ANEXOS.md` y `LEGAL\Envio RRS 2026-07-27\EMAIL a Marc.txt`) era enviar a marc@rnr-realestate.com con CC a rakesh@rnr-realestate.com. El email real fue **solo** a marc@rrsinternationaldevelopment.com, sin CC a nadie. Un envío de documentos contractuales a una sola persona, en una dirección distinta de las designadas en la cláusula 2.a, es frágil: si Marc no lo procesa, nadie más en RRS lo ha visto | Gmail `19fa42f7d2c5f223` (toRecipients) frente a `EMAIL a Marc.txt` líneas 1-2 |
| 2 | **Sin respuesta de RRS en 24 días y sin seguimiento** | El hilo tiene un único mensaje. No existe respuesta, acuse de recibo ni reenvío posterior. Búsqueda en todo el buzón (in:anywhere, dominios rnr-realestate.com y rrsinternationaldevelopment.com, después del 25-07): ningún mensaje de RRS sobre el contrato o los anexos | Gmail, hilo `19fa3fbc921b3e36` (1 mensaje); búsqueda del 20-08-2026 |
| 3 | **El email no vende el Anexo I** | El borrador preparado dedicaba la mitad del correo a argumentar el anexo de comisiones (el que protege el dinero). El email real lo despacha en una frase ("I need to supplement that point with a better-drafted Annex (I)") y dedica casi todo el cuerpo al anexo de protección de datos. No pide fecha de firma ni fija plazo | Comparar `EMAIL_MARC_ANEXOS.md` (líneas 20-37) con el cuerpo de `19fa42f7d2c5f223` |
| 4 | **Enviado sin la revisión legal que los propios documentos exigían** | Los tres .md internos repiten "Revisión de un abogado antes de enviarlo" y "es material transfronterizo". Los anexos se redactaron el 27-07 y se enviaron el mismo 27-07. No hay rastro en Drive ni en Gmail de una revisión por abogado | `ANEXO_I_COMISIONES.md` línea 6, `ANEXO_II_PROTECCION_DATOS.md` línea 10, `EMAIL_MARC_ANEXOS.md` línea 89; diario `07_diario.md`, entrada del 27-07 (redacción y envío el mismo día). Clasificación: inferencia, confianza alta |

### 2.3 Estado de firma de cada documento a 20-08-2026

| Documento | Firma RRS | Firma Propulse | Estado efectivo |
|---|---|---|---|
| Referral Agreement (efectivo 01-07-2026) | Rakesh Mirchandani, 13-07. El bloque del segundo CEO (Sanjay Dhawan) quedó en blanco también en la copia de RRS | Enviada el 27-07 como adjunto (contenido del PDF no verificable con mis herramientas); no archivada en Drive | Probablemente ejecutado, pero sin copia completa archivada ni acuse de RRS |
| Anexo I (comisiones: plazo 5 días + suelo 2% por defecto) | **NO firmado** | La copia archivada en `LEGAL\Envio RRS 2026-07-27\ANNEX I - Commission Schedule.pdf` tiene la **fecha escrita (27/07/2026) pero la línea de firma de Jesús Ibáñez en blanco**; la variante "(1)" enviada por email no es verificable | **Sin valor jurídico. Es una propuesta sin respuesta** |
| Anexo II (protección de datos, CCT UE 2021/914 Módulo 1) | **NO firmado** | Firmada y fechada 27/07/2026 (firma manuscrita visible en la página 3 del PDF archivado) | **Sin valor jurídico hasta la firma de RRS. Es una propuesta sin respuesta** |

Evidencia: `G:\Mi unidad\Horizonte Emirates\LEGAL\Envio RRS 2026-07-27\ANNEX I - Commission Schedule.pdf` (página 2) y `ANNEX II - Data Protection.pdf` (página 3), leídos el 20-08-2026.

---

## 3. Respuesta a la pregunta de la auditoría: ¿si mañana un lead de 500k compra un Binghatti en Dubái, Propulse cobra?

**No, no con papel firmado.** Cadena de razonamiento sobre el contrato ejecutado:

1. Binghatti Wraith es un proyecto de promotor tercero (Binghatti), no de RRS. La cláusula 3 (nota) lo somete a "prior written confirmation by the Company for each project". Evidencia: `06_contrato_rrs.md`, tabla de términos, fila "Resto de proyectos".
2. **No existe ninguna confirmación escrita de comisión para Binghatti ni para ningún otro proyecto distinto de NH Collection.** Búsqueda en Gmail (asuntos con "annex", "Referral", "contrato", "anexo" desde el 01-07): solo el envío del 27-07 y el contrato del 13-07. Ninguna confirmación de porcentajes. Clasificación: hecho verificado (ausencia comprobada en buzón y en Drive).
3. El Anexo I, que crearía el suelo del 2% por defecto, **no está firmado por RRS** (sección 2.3).
4. Resultado: la comisión de esa venta dependería íntegramente de la buena voluntad de RRS. El propio análisis interno lo reconoce: "Si un lead compra un proyecto sin confirmación previa, la comisión sigue dependiendo de la buena voluntad de la contraparte" (`06_contrato_rrs.md`, sección "El anexo propuesto el 21/07 NO resuelve el problema").

Y el agravante comercial: desde el 12-08 la web publica **7 inmuebles con precio** (NH Collection, Bentley, Gianfranco Ferré, SAAS Hills, Binghatti, W Residences, BRABUS; decisión del 12-08 en `03_decisiones.md`, fila "Publicar la cartera de 7 inmuebles"). La campaña de 20 EUR/día empuja tráfico hacia un escaparate en el que **6 de 7 productos no tienen comisión pactada**. Es la definición literal del riesgo de trabajar gratis.

Para NH Collection (el único cubierto): el 3% es exigible en principio, pero con dos condicionantes: el trigger es venta "completed and registered" (cláusula 3) mientras el pago se fija a 10 días del SPA más pago inicial (cláusula 4), una incoherencia que el propio refundido documenta (`Referral_Agreement_REFUNDIDO.md`, nota final); y no se ha obtenido de RRS ni la trade licence ni la prueba de cuenta escrow del proyecto (tarea RRS-DOCS abierta desde el 21-07 en `02_tareas.md`, línea 55).

---

## 4. Trazabilidad de comisiones y protección del lead: el procedimiento de derivación se está incumpliendo

La cláusula 2.a exige derivar cada lead **por email a marc@rnr-realestate.com Y rakesh@rnr-realestate.com** con nombre completo, contacto, nacionalidad, copia de pasaporte o Emirates ID, proyecto y número de unidad, y fecha (Referral Date). La única defensa contra la cláusula 9.c (sin comisión si el lead "ya era conocido por la Company") es esa derivación con timestamp más la aceptación (o silencio de 5 días) de la cláusula 2.b. El propio archivo interno lo dice: "Toda derivación debe enviarse por email a marc@ y rakesh@... y conservarse con timestamp" (`06_contrato_rrs.md`, "Otros puntos abiertos").

**La práctica real verificada en Gmail incumple ese procedimiento:**

| Lead | Fecha | Cómo se derivó realmente | Desviaciones respecto a la cláusula 2.a |
|---|---|---|---|
| Cliente "Ikaverticales" | 23-07-2026 | Fwd de las propuestas comerciales a marc@rnr-realestate.com | Sin rakesh@ en copia; sin nacionalidad, sin unidad estructurada, sin formato de referral |
| José Díaz | 30-07 a 01-08-2026 | Emails al lead con **BCC** a marc@rrsinternationaldevelopment.com | Dominio distinto del designado; sin rakesh@; BCC no es una derivación formal ni genera constancia frente a la contraparte |
| Sergio | 05-08 y 07-08-2026 | Fwd y BCC a marc@rrsinternationaldevelopment.com | Ídem |

Evidencia: Gmail, hilos `19f902f39aae3ada`, `19f9000c1fbb8129`, `19fb37c920908c26`, `19fce97d90d1cc7f` (consultados el 20-08-2026).

Consecuencias:

- **No existe ni una sola aceptación escrita de lead por parte de RRS** en el buzón. Toda la protección de 36 meses descansa en el silencio positivo de la cláusula 2.b, que a su vez presupone una derivación válida por el canal designado. Derivar por BCC a una dirección no designada da a RRS un argumento para negar que la derivación ocurriera. Clasificación: hecho verificado (la práctica), inferencia (la consecuencia jurídica), confianza alta.
- La tarea RA-PROTOCOLO ("montar el circuito de derivación que exige la cláusula 2.a" con contador de 5 días) está abierta desde el 21-07 sin ejecutar (`02_tareas.md`, línea 52).
- Matiz a favor: hay evidencia de que RRS actúa sobre esos leads ("Me consta que Marc le contactó por whatsapp", email a José Díaz del 01-08, hilo `19fb37c920908c26`), lo que dificultaría a RRS negar la recepción. Pero es una defensa de hechos, no de papel.

**Protección frente al promotor: inexistente.** El contrato solo vincula a RRS. Si un lead captado por la web contacta directamente con Binghatti, Dar Global (W), o cualquier promotor, o compra a través de otro bróker, Propulse no tiene ningún derecho frente a nadie. La web publica ahora nombres de proyecto y precios (decisión del 12-08), lo que facilita exactamente ese bypass. Clasificación: inferencia, confianza alta.

**Firmas con una entidad y derivas a otra.** El contrato es con RRS International Development FZ-LLC (promotora, RAK) pero las direcciones de derivación son de RNR International Real Estate (bróker del grupo, licencia RERA 16084). El contrato no menciona a RNR en ninguna parte; el punto 5 del Anexo II lo resolvería, pero está sin firmar. Tarea RRS-ENTIDAD abierta desde el 21-07 (`02_tareas.md`, línea 56; `06_contrato_rrs.md`, sección "Verificación de licencias").

---

## 5. Exclusividad y dependencia de Marc

- **No hay exclusividad en ningún sentido** (cláusula 6). RRS puede usar otros referrers y nada impide a RNR atacar directamente el mercado hispanohablante que Horizonte Emirates está educando con su blog y su inversión publicitaria. No existe protección de territorio ni de canal. Evidencia: `06_contrato_rrs.md`, fila Exclusividad; `Referral_Agreement_REFUNDIDO.md`, cláusula 6. Hecho verificado.
- **Marc es un cuello de botella de persona única.** Todas las derivaciones de agosto van solo a Marc; Marc hace el WhatsApp y la videollamada con el lead (kit de correos: "presentación de Marc como el socio en Dubái que hace la videollamada", diario 30-07); el envío contractual del 27-07 fue solo a Marc. Además Marc ha usado al menos tres direcciones (marc@rnr-realestate.com, marc@rrsinternationaldevelopment.com, y una tercera errónea que rebotó en febrero), lo que degrada la trazabilidad. Si Marc deja el grupo o se satura, el canal comercial y el contractual se caen a la vez. Clasificación: hecho verificado (el patrón de correos), inferencia (el riesgo), confianza alta.
- **Comportamiento conocido de la contraparte: lentitud y desorden administrativo.** En la esfera personal del usuario (compra de la unidad 916 de NH Collection, que menciono solo como evidencia de conducta de la contraparte, sin detallar importes): incoherencias en facturas y recibos detectadas en marzo que tardaron de abril a mediados de mayo en corregirse, con disculpas expresas por el retraso. Evidencia: Gmail, hilo `19d1e4c8d13cc776`. El criterio interno coincide: "RRS es lento en las gestiones" (`ANEXO_II_PROTECCION_DATOS.md`, sección "Criterio de diseño"). Con esa contraparte, un anexo sin perseguir no se firma solo.

---

## 6. RGPD del traspaso de leads

| Elemento | Estado a 20-08-2026 | Evidencia | Clasificación |
|---|---|---|---|
| CCT (SCC) con RRS, Módulo 1 controller a controller | **Redactadas, firmadas solo por Propulse, enviadas el 27-07, SIN firma de RRS.** La transferencia continua de leads a UAE sigue sin ampararse en el art. 46 | `LEGAL\...\ANNEX II - Data Protection.pdf`; Gmail `19fa42f7d2c5f223` | Hecho verificado, confianza alta |
| Base legal actual de la transferencia | Consentimiento explícito art. 49.1.a más medidas precontractuales art. 49.1.b, recogido con doble casilla y prueba (versión, texto, fecha). El propio análisis interno califica esta vía de "excepcional y precaria para un flujo continuo de leads" | `public\legal.html` línea 96; `public\index.html` líneas 612-623 y 875-884; `ANEXO_II_PROTECCION_DATOS.md`, sección final | Hecho verificado |
| Transferencias reales ejecutándose | Sí: datos de leads (nombre, email, perfil inversor) reenviados a UAE el 23-07, 30-07, 01-08, 05-08 y 07-08 | Hilos Gmail citados en la sección 4 | Hecho verificado |
| DPA Web3Forms (art. 28) | HECHO: archivado el 22-07 en `LEGAL\Proteccion de datos\Web3form\Data Processing Agreement - Web3Forms...pdf` (existencia verificada; contenido no revisado en esta pasada) | Listado de carpeta del 20-08-2026 | Hecho verificado (existencia) |
| Representante UE art. 27 (Propulse es andorrana y capta residentes en España) | **PENDIENTE, sin avance documentado** | `ANEXO_II_PROTECCION_DATOS.md`, "Pendiente real que queda"; diario 27-07, Problemas Detectados | Hecho verificado (pendiente) |
| Registro de Actividades de Tratamiento | **PENDIENTE** | Ídem | Hecho verificado (pendiente) |
| Coherencia de la política de privacidad | La política afirma: "Hemos suscrito con dicho socio compromisos contractuales de confidencialidad, limitación de finalidad y medidas técnicas y organizativas de protección de los datos". La confidencialidad sí está en la cláusula 8 del contrato, pero la limitación de finalidad y las medidas técnicas están en el **Anexo II sin firmar**. La afirmación es parcialmente inexacta hoy, y el propio diario lo reconocía el 27-07 | `public\legal.html` línea 96; `07_diario.md` 27-07, Problemas Detectados | Hecho verificado, impacto medio |
| Nota de descoordinación interna | `02_tareas.md` línea 53 (M15-CONSENT, "el checkbox actual no la cubre", diferida el 30-07) contradice la realidad del código: la casilla obligatoria de cesión a Emiratos SÍ está en producción desde el commit cf51fdb del 27-07 | `public\index.html` líneas 618-619 frente a `02_tareas.md` línea 53 | Hecho verificado (contradicción documental) |

Lectura de riesgo: enviar leads de residentes españoles a Emiratos con consentimiento explícito documentado es defendible hoy como vía del art. 49, pero es la vía excepcional. Si la captación escala (que es el objetivo declarado de toda la auditoría), un flujo continuo y estructural sobre el art. 49.1.a se vuelve difícilmente defendible ante la AEPD. La firma del Anexo II no es un trámite: es lo que convierte la operativa en sostenible, como dice el propio archivo interno.

---

## 7. Riesgo de trabajar gratis: síntesis

1. **6 de 7 proyectos publicitados sin comisión pactada** (solo NH Collection al 3%). El gasto de Ads (unos 20 EUR/día desde el 20-07) compra tráfico cuya monetización no está asegurada contractualmente. Hecho verificado.
2. **Derivaciones que no siguen la cláusula 2.a**: debilitan la única defensa frente a la exclusión 9.c ("lead ya conocido") y frente a disputas de atribución dentro de los 36 meses de protección. Hecho verificado (práctica) más inferencia (riesgo).
3. **Cobro condicionado a "venta completada y registrada"** sin haber verificado la cuenta escrow del proyecto, y con jurisdicción exclusiva en los tribunales del DIFC: para una SLU andorrana, litigar en DIFC por una comisión de 15.000 a 25.000 EUR es económicamente inviable, así que el contrato protege por disuasión, no por ejecutabilidad práctica. Inferencia, confianza alta.
4. **Sin exclusividad ni protección de territorio**: la inversión en educar al mercado hispanohablante (blog de 16 artículos, packs, campaña) es apropiable por la contraparte o por terceros. Inferencia, confianza alta.

---

## 8. Lista priorizada de riesgos contractuales y qué firmar o renegociar antes de escalar la captación

| Prioridad | Riesgo | Acción concreta | Papel a conseguir |
|---|---|---|---|
| 1 | Comisión no pactada en 6 de 7 proyectos que ya se publicitan con dinero | **Reactivar HOY el hilo del 27-07** (`19fa3fbc921b3e36`): reenviar a marc@rnr-realestate.com Y rakesh@rnr-realestate.com (las direcciones contractuales), pedir acuse de recibo del contrato contrafirmado y fecha de firma de los anexos, y proponer llamada con fecha. En paralelo, invocar ya la mecánica del futuro Anexo I: **solicitar por escrito la confirmación de porcentaje para los 6 proyectos publicados**, aunque el anexo no esté firmado; cada silencio queda documentado y refuerza la negociación | Anexo I firmado por Rakesh (y Sanjay), o como mínimo un email de RRS confirmando porcentaje por cada proyecto (el punto 4 del anexo da valor contractual al email) |
| 2 | Transferencia internacional de datos sobre base precaria (art. 49.1.a) mientras se escala | Mismo email de la prioridad 1: la firma del Anexo II va en el mismo empujón. Si en 10 días no hay firma, decidir conscientemente si se sigue derivando solo con consentimiento y documentar esa decisión | Anexo II (CCT Módulo 1) firmado por RRS |
| 3 | El acuerdo marco puede discutirse como no perfeccionado: contrafirma enviada sin acuse, no archivada, y bloque de Sanjay Dhawan en blanco en ambas direcciones | Pedir a RRS la copia completamente ejecutada (ambos CEO) y **archivarla en `LEGAL\`**; hoy el contrato firmado no existe en Drive, solo como adjuntos dispersos en Gmail | Copia única del Referral Agreement con las 3 firmas, archivada |
| 4 | Derivaciones que no generan protección (canal y contenido fuera de la cláusula 2.a, sin contador de aceptación) | Ejecutar RA-PROTOCOLO: plantilla de referral a marc@ y rakesh@rnr-realestate.com con nombre, contacto, nacionalidad, proyecto y unidad más Referral Date, y registro del vencimiento de los 5 días hábiles. **Regularizar retroactivamente** los leads ya derivados (Ikaverticales, José Díaz, Sergio) reenviándolos por el canal formal | Ningún documento nuevo: cumplimiento del que ya está firmado |
| 5 | Ambigüedad RRS y RNR (firmas con la promotora, derivas al bróker) | Se resuelve con el punto 5 del Anexo II; si el Anexo II se atasca, pedir un email simple de RRS reconociendo que las direcciones @rnr-realestate.com valen como entrega a la Company | Anexo II o email de reconocimiento |
| 6 | Trigger de cobro sin verificar (escrow) y contraparte sin acreditar documentalmente | Ejecutar RRS-DOCS: trade licence de la free zone y prueba de cuenta escrow del NH Collection ante la autoridad de RAK | Dos documentos informativos, sin firma |
| 7 | Cumplimiento RGPD estructural propio | Designar representante UE (art. 27) y montar el Registro de Actividades de Tratamiento; corregir o matizar la frase de la política de privacidad sobre "compromisos contractuales suscritos" mientras el Anexo II no esté firmado | Contrato de representación art. 27 |
| 8 | Dependencia de Marc como persona única | Pactar por escrito un segundo interlocutor operativo en RRS/RNR para leads (rakesh@ ya es destinatario contractual: usarlo siempre) y dejar de usar BCC como mecanismo de derivación | Ninguno: disciplina operativa |

**Regla de decisión que se desprende de todo lo anterior:** no subir el presupuesto de captación (decisión pendiente hacia el 23-08 según `02_tareas.md`, ADS-DECISION) sin tener como mínimo las prioridades 1 y 4 cerradas. Escalar tráfico hacia proyectos sin comisión pactada y con derivaciones que no generan protección es escalar el riesgo de trabajar gratis, no el negocio.

---

## 9. Datos sensibles detectados (no reproducidos)

- Datos bancarios completos de Propulse SLU (cuenta Wise, IBAN y BIC) constan en la cláusula 4.b del contrato, transcritos en `06_contrato_rrs.md` y `Referral_Agreement_REFUNDIDO.md`. No se reproducen aquí.
- Firma manuscrita de Jesús Ibáñez visible en `LEGAL\Envio RRS 2026-07-27\ANNEX II - Data Protection.pdf`, página 3.
- Nombres y correos de leads reales (particulares) en los hilos de Gmail citados; se referencian por identificador de hilo, no por datos completos.
- Información de una operación personal del usuario (unidad 916) usada únicamente como evidencia de conducta de la contraparte, sin importes.

---

## 10. Archivos y fuentes revisados

**Abiertos y leídos (14 archivos):**

1. `G:\Mi unidad\Horizonte Emirates\06_contrato_rrs.md` (completo)
2. `G:\Mi unidad\Horizonte Emirates\Referral_Agreement_REFUNDIDO.md` (completo)
3. `G:\Mi unidad\Horizonte Emirates\ANEXO_I_COMISIONES.md` (completo)
4. `G:\Mi unidad\Horizonte Emirates\ANEXO_II_PROTECCION_DATOS.md` (completo)
5. `G:\Mi unidad\Horizonte Emirates\EMAIL_MARC_ANEXOS.md` (completo)
6. `G:\Mi unidad\Horizonte Emirates\LEGAL\Envio RRS 2026-07-27\EMAIL a Marc.txt` (completo)
7. `G:\Mi unidad\Horizonte Emirates\LEGAL\Envio RRS 2026-07-27\ANNEX I - Commission Schedule.pdf` (completo, 2 páginas)
8. `G:\Mi unidad\Horizonte Emirates\LEGAL\Envio RRS 2026-07-27\ANNEX II - Data Protection.pdf` (completo, 3 páginas)
9. `G:\Mi unidad\Horizonte Emirates\01_estado_proyecto.md` (secciones sobre RRS, vía grep)
10. `G:\Mi unidad\Horizonte Emirates\02_tareas.md` (líneas 15-59 y grep completo)
11. `G:\Mi unidad\Horizonte Emirates\03_decisiones.md` (líneas 35-56 y grep completo)
12. `G:\Mi unidad\Horizonte Emirates\07_diario.md` (entradas del 27-07, 28-07 y 30-07 completas)
13. `public\index.html` del repositorio (bloques de consentimiento, vía grep y lectura parcial)
14. `public\legal.html` del repositorio (sección 6, transferencias internacionales)

**Consultas Gmail (20-08-2026, solo lectura):** búsquedas por remitente/destinatario en rnr-realestate.com y rrsinternationaldevelopment.com, por asunto (annex, Referral Agreement, contrato, anexo) y por fecha (después del 25-07). Hilos citados: `19fa3fbc921b3e36`, `19f5a83de168afc7`, `19fb37c920908c26`, `19fce97d90d1cc7f`, `19f902f39aae3ada`, `19f9000c1fbb8129`, `19d1e4c8d13cc776`, `1a0139b39cbe4606`.

**No abiertos (listado y motivo):**

- `LEGAL\Envio RRS 2026-07-27\ANNEX I - Commission Schedule.docx` y `ANNEX II - Data Protection.docx`: formato Word; se asume idéntico al PDF correspondiente, no verificado.
- `LEGAL\Proteccion de datos\Web3form\Data Processing Agreement - Web3Forms. Proteccion datos web3form.pdf`: existencia verificada, contenido no revisado (fuera del foco RRS).
- `LEGAL\Proteccion de datos\Web3form\Panel control web3form.jpg`: no revisado.
- Adjunto de Gmail `Contrato RRS Referral firmado (1).pdf` (mensaje `19fa42f7d2c5f223`): **no descargable con las herramientas disponibles**. Es el documento más importante que queda sin verificar: sin abrirlo no se puede confirmar que la contrafirma de Propulse consta dentro del PDF enviado.
- Adjunto de Gmail del contrato firmado por Rakesh (hilo `19f5a83de168afc7`, 13-07): mismo motivo.
