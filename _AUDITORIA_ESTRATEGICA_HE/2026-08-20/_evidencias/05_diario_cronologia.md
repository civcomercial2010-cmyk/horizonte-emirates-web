# Evidencia 05: Cronología del proyecto y esfuerzo invertido

**Auditoría estratégica Horizonte Emirates. Área 5.**
Fecha de la revisión: 20 de agosto de 2026.
Fuente principal: `G:\Mi unidad\Horizonte Emirates\07_diario.md` (leído íntegro, 1.920 líneas, 50 entradas).
Fuentes complementarias: `G:\Mi unidad\Horizonte Emirates\Diario actividad proyecto\LEEME.txt`, `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\Diario actividad proyecto\Horizonte Emirates – Diario 2026.md`, listado de `G:\Mi unidad\Horizonte Emirates\_ARCHIVO\`.

Convención de citas: cada entrada del diario se identifica por su fecha y por la línea donde empieza su encabezado `## Fecha:` en `07_diario.md` (por ejemplo, "entrada 30-jul, L1869").

---

## 1. Datos básicos del diario

| Dato | Valor | Clasificación |
|---|---|---|
| Entradas totales | 50 (verificado con grep sobre `## Fecha:`) | hecho_verificado |
| Primera entrada | 26 de marzo de 2026 (L7) | hecho_verificado |
| Última entrada | 30 de julio de 2026 (L1869) | hecho_verificado |
| Horas totales declaradas | 256,5 horas (suma de los campos "Tiempo dedicado") | hecho_verificado |
| Media por jornada | 5,1 horas | hecho_verificado |
| Lugar declarado en las 50 entradas | Edifici Teiers de Llorts, Llorts (Andorra) | hecho_verificado |
| Entradas en agosto de 2026 | 0 | hecho_verificado |

El diario es el registro único y acumulativo del proyecto desde la consolidación del 22-jul-2026 (cabecera del archivo, L1-L3, y `LEEME.txt` de la carpeta antigua). Las entradas del 28, 29 y 30 de abril proceden de una copia local desincronizada y se fusionaron el 7-jun-2026 (cabecera de `Horizonte Emirates – Diario 2026.md` local, líneas 3-10); su estilo es notablemente más genérico que el resto.

---

## 2. Horas y entradas por mes

| Mes | Entradas | Horas | Comentario |
|---|---|---|---|
| Marzo 2026 | 4 | 23,5 | Arranque: viabilidad, naming, primera reunión con RRS |
| Abril 2026 | 15 | 56 | Construcción del funnel completo y congelación de Ads (18-abr) |
| Mayo 2026 | 1 | 4 | Solo la firma de Dayvo (13-may). Mes casi vacío en el registro |
| Junio 2026 | 21 | 113 | Mes pico: auditorías, blog, seguridad, medición |
| Julio 2026 | 9 | 60 | Firma RRS, arranque Ads, sistema de packs, replanteamiento |
| Agosto 2026 | 0 | 0 | Sin ninguna entrada hasta hoy (20-ago) |
| **Total** | **50** | **256,5** | |

**Huecos de registro relevantes** (hecho_verificado, por las fechas de los encabezados):

- 18-abr a 24-abr: 6 días sin entrada (coincide con la congelación decidida el 18-abr).
- 30-abr a 13-may: 12 días sin entrada.
- 13-may a 2-jun: 19 días sin entrada. Mayo tiene una sola jornada registrada.
- 29-jun a 13-jul: 13 días sin entrada.
- 13-jul a 20-jul: 6 días sin entrada.
- **30-jul a 20-ago (hoy): 21 días sin ninguna entrada.** Es el hueco más grave: en ese periodo ocurrieron los hechos centrales de esta auditoría (entrada de los 2 leads del periodo, revisión del diagnóstico de Ads del 9-ago y corrección de los fallos de conversión del 12-ago, documentados en la memoria del proyecto `C:\Users\User\.claude\projects\c--Users-User-Desktop-Propulse-IA-Repositorio-Proyectos-Horizonte-Emirates\memory\MEMORY.md` y en los commits del repositorio, no en el diario). Un diario cuyo propósito declarado es acreditar sustancia económica ante la AEAT (skill `horizonte-emirates-diario`) lleva tres semanas sin escribirse justo en el tramo con más actividad crítica.

---

## 3. Cronología de hitos por mes

### Marzo 2026 (fundación)
- 26-mar (L7): análisis de viabilidad; decisión de operar bajo Propulse SLU y ampliar el objeto social.
- 27-mar (L50): naming; "horizonteemirates.com" identificado como candidato.
- 28-mar (L83): primera videollamada con Marc Nonn (RRS, Dubái); interés confirmado; términos base (fee 4%, trigger, tail 24 meses).
- 30-mar (L125): dominio registrado; se detecta empresa UAE homónima; se abre el bloqueo de naming.

### Abril 2026 (construcción del funnel y primera congelación)
- 1-abr a 9-abr: dificultades con Webflow, business plan, borrador del Referral Agreement, objeto social en notaría.
- 14-abr (L325): naming confirmado tras 15 días de bloqueo (coste de oportunidad admitido en la propia entrada, L346); borrador del contrato enviado a Legal de RRS.
- 15-abr (L363): portal lanzado en versión provisional.
- 16-abr (L402): "Fase 1 cerrada": rewrite CRO, scoring de 5 dimensiones, modal WhatsApp, playbook de 20 emails. Se detecta que el presupuesto de Google Ads "bloquea el inicio real de la captación" (L425).
- 17-abr (L450): motor completo de emails en Apps Script (20 plantillas, detección de género, Calendly).
- 18-abr (L493): **congelación de la inversión publicitaria por contexto geopolítico, sin fecha de reactivación**; el foco pivota a infraestructura.
- 24-abr a 30-abr: depuración del pipeline (bug del alias de envío), CRO móvil, validación de 3 proyectos con Marc (27-abr), UTM, primer test end-to-end.

### Mayo 2026 (mes casi en blanco)
- 13-may (L751): firma con Dayvo Sistemas SLU (Google Ads Pro, 6 meses, 1.891,26 EUR). Única entrada del mes. El saldo publicitario sigue sin definir (L772).

### Junio 2026 (mes pico: 113 horas de consolidación técnica)
- 2-jun a 4-jun: dos auditorías técnicas propias y una "auditoría senior integral" con roadmap de 37 mejoras; RGPD, Cloudflare, rotación de un token expuesto, fallo de codificación que vaciaba los leads.
- 6-jun (L926): se descubre que el repositorio era público y servía documentos internos en el dominio; migración de hosting a Cloudflare; otro fallo del funnel (polling solo de no leídos).
- 7-jun (L976): estrategia SEO y **16 artículos de blog construidos y publicados en un solo día**.
- 8-jun (L1018): contraste de una auditoría externa "en su mayoría obsoleta"; navegación móvil rehecha.
- 9-jun a 23-jun: lead magnet fiscal automatizado, identidad visual, accesibilidad, GTM instalado en 21 páginas.
- 24-jun (L1379): encargo de Marc: 8 dosieres de inversión; se construye el sistema de plantillas (Word + Excel).
- 25-jun (L1416): incidencia grave: **el funnel descartó los leads del formulario principal del 8 al 28 de junio** por un cambio cosmético en el asunto; 1 lead perdido, recuperado el 26-jun.
- 29-jun (L1481): cierre de mes; se declara terminada la consolidación técnica: "seguir invirtiendo jornadas en mejoras técnicas tendría rendimiento decreciente" (L1493) y "el coste de oportunidad ya no está en lo que falta por construir sino en el tiempo que el activo permanece sin tráfico" (L1502).

### Julio 2026 (firma, arranque de Ads y replanteamiento)
- 13-jul (L1517): **firma del Referral Agreement con RRS**, 90 días después del envío a Legal (14-abr). Quedan pendientes RERA y acuerdo de datos "desde marzo" (L1536).
- 20-jul (L1555): **arranque de Google Ads con 20 EUR/día** (116 días después del inicio del proyecto) y motor de Investment Packs con 6 packs producidos.
- 21-jul (L1599): cambio de formato de los packs a memorándum 16:9; motor reprogramado; guardián del funnel instalado.
- 22-jul (L1644): sistema Word eliminado; 7 memorándums regenerados; se detecta que 4 proyectos llevan supuestos financieros distintos de los acordados el día anterior.
- 23-jul (L1698): nuevo cambio de criterio: memorándums anclados a la Sales Offer de unidad concreta, no a la tipología.
- 24-jul (L1739): coherencia de mensaje en la web (CTA única, rangos de rentabilidad homogéneos).
- 27-jul (L1778): bloque A de RGPD desplegado; anexos I y II enviados a Marc (Anexo II sin firmar a cierre del diario).
- 28-jul (L1822): canal LinkedIn diseñado completo (20 posts redactados).
- 30-jul (L1869): auditoría de la campaña (143 EUR, 0 leads en la primera semana; conversiones inactivas; keywords residenciales definidas por la agencia); **entra el primer lead atribuible a campaña**; se cortan las secuencias automáticas de email y se pasa a trabajo manual; LinkedIn se recorta a versión mínima 2 días después de diseñarlo.

### Agosto 2026
- Sin entradas. Según la memoria del proyecto (`MEMORY.md`), el 9-ago se revisó el diagnóstico de Ads (tres conclusiones del 30-jul resultaron falsas), el 12-ago se corrigieron fallos graves de conversión (botón de envío muerto, modal WhatsApp roto desde el 27-jul, banner tapando el CTA) y se fijó nueva línea base. Nada de esto consta en el diario (dato_no_disponible en la fuente auditada).

---

## 4. Reparto del esfuerzo por tipo de trabajo

Método: cada entrada se asignó a su actividad dominante según el propio texto de "Actividad Realizada"; las entradas mixtas se asignaron por la actividad mayoritaria. Margen de error estimado: ±5-8 puntos porcentuales (varias jornadas mezclan web con contrato o con packs). Clasificación: inferencia sobre horas verificadas, confianza alta.

| Tipo de trabajo | Horas | % | Entradas principales |
|---|---|---|---|
| Web / técnico (desarrollo, auditorías, seguridad, tracking, QA, hosting) | 136 | 53,0% | 1-abr a 30-abr (parcial), 2-jun a 26-jun casi íntegro |
| Packs / material comercial interno | 33 | 12,9% | 24-jun, 20-jul (parcial), 21-jul, 22-jul, 23-jul |
| Contenido / SEO | 13 | 5,1% | 7-jun (blog), 24-jul (coherencia de copy) |
| Estrategia y planificación | 21,5 | 8,4% | 26-mar, 27-mar, 2-abr, 18-abr, 29-jun |
| Comercial con el partner (RRS/Marc, contrato) | 25 | 9,7% | 28-mar, 30-mar, 9-abr, 13-abr, 14-abr, 13-jul |
| Ads / SEM (proveedor y campaña) | 15 | 5,8% | 13-may, 20-jul (parcial), 30-jul |
| LinkedIn (diseño del canal) | 7 | 2,7% | 28-jul |
| Legal / RGPD | 6 | 2,3% | 27-jul |
| **Contacto directo con leads inversores** | **0** | **0%** | Ninguna entrada |
| **Total** | **256,5** | **100%** | |

**Lectura ejecutiva:**

- **Construcción del activo (web + contenido + packs): 182 horas, el 71% del esfuerzo total registrado.**
- **Captación activa en sentido amplio (gestión de Ads + LinkedIn + trabajo de leads): 22 horas, el 8,6%.** De ellas, 0 horas de conversación real con un lead final.
- Incluso sumando toda la actividad comercial con el partner RRS (25 h), el bloque "captación y venta" queda en torno al 18% frente al 71% de construcción.

### Menciones de contacto real con leads

- Entradas que documentan una conversación efectiva (llamada, email cruzado, videollamada) con un lead inversor final: **0 de 50** (hecho_verificado: revisadas las 50 secciones "Interacciones y Contactos" y "Actividad Realizada").
- Entradas que mencionan leads reales de alguna forma: 3.
  - 25-jun (L1416): detección del lead perdido del periodo 8-28 de junio.
  - 26-jun (L1451): lead recuperado e incorporado "al circuito comercial" mediante secuencia automática, no mediante contacto personal.
  - 30-jul (L1869): registro del primer lead atribuible a campaña; contactarlo queda como "acción prioritaria mañana" (L1917) y el diario termina ahí, sin constancia de que se hiciera.
- Las interacciones comerciales registradas son siempre con el lado oferta (Marc/RRS, unas 11 entradas) o con proveedores (Dayvo, agencia inicial, gestor andorrano, asesor fiscal), nunca con el lado demanda.

---

## 5. Proveedores y colaboradores

| Actor | Rol | Apariciones y fricción documentada |
|---|---|---|
| Marc Nonn / RRS International Development (Dubái) | Partner comercial, único canal de cierre | 28-mar, 30-mar, 9/13/14-abr, 27-abr, 4-jun, 24-jun, 13-jul, 20-jul, 27-jul. Fricción crónica: Legal de RRS sin responder desde el 14-abr (90 días hasta la firma del 13-jul); firma prevista "semana del 9 de junio" (4-jun, L897) que no se cumplió; RERA y acuerdo de datos "pendientes desde marzo" aún abiertos el 13-jul (L1536); Anexo II sin firmar (27-jul, L1800); material oficial y Sales Offers reclamados repetidamente (24-jun, 23-jul, 24-jul, 28-jul) |
| Agencia de marketing inicial (sin nombre en el diario) | Propuesta de web/SEO | Contactada 30-mar; propuesta prometida para el 7-abr, llegó el 15-abr "no alineada con el modelo" (L381); el hilo desaparece del diario sin cierre explícito |
| Dayvo Sistemas SLU (León) | Agencia SEM | Firmada 13-may (1.891,26 EUR / 6 meses). El 30-jul el diario le atribuye la configuración fallida: "las palabras clave y las exclusiones de la campaña las definió la agencia, y son de intención residencial" (L1896) y el seguimiento de conversiones inactivo |
| Gestor andorrano / notario | Objeto social de Propulse | 26-mar (necesidad detectada), 9-abr (en trámite), 4-jun (ejecutado). El 13-jul se reconoce que el tramo final del bloqueo del contrato fue este trámite interno, no RRS (L1535) |
| Asesor fiscal externo | Validación del lead magnet | 28-jul: bloquea el pilar fiscal de LinkedIn (L1845); sin resolución a cierre del diario |
| Persona externa anónima | Feedback de portada | 10-jun (L1090) |

---

## 6. Decisiones tomadas y luego revertidas

| # | Decisión | Se tomó | Se revirtió | Coste visible |
|---|---|---|---|---|
| 1 | Naming "Horizonte Emirates" (preseleccionado 27-mar, dominio comprado 30-mar) | 27/30-mar | Bloqueado 30-mar a 14-abr por conflicto con empresa homónima; confirmado sin cambios | 15 días de bloqueo; la propia entrada lo admite como coste de oportunidad (L346) |
| 2 | Email manual "hasta 10 leads" (16-abr, L421) | 16-abr | Al día siguiente (17-abr) se construyó el motor automático completo de 20 plantillas; el 30-jul se cortó y se volvió al trabajo manual | Decenas de horas de construcción y depuración (abril-junio) de un sistema desactivado con 1 lead/semana; el 30-jul se reconoce: "es el mismo criterio que se aplicó al email en abril, ahora confirmado con datos" (L1903) |
| 3 | Sistema de dosieres Word + Excel (24-jun) y 6 packs en formato dosier (20-jul) | 24-jun / 20-jul | 21-jul: cambio a memorándum 16:9; 22-jul: sistema Word eliminado y los 7 proyectos regenerados | 2 reprogramaciones del motor en 72 horas; los 6 packs del 20-jul se rehicieron al día siguiente |
| 4 | Packs por tipología de proyecto | 20/22-jul | 23-jul: cambio a memorándum por unidad concreta anclado a Sales Offer | Tercer cambio de criterio en 4 días |
| 5 | Canal LinkedIn completo con exposición personal, 20 posts redactados | 28-jul | 30-jul: recortado a versión mínima sin exposición personal, publicidad de LinkedIn prohibida | 7 horas de diseño recortadas a las 48 horas |
| 6 | Página de equipo publicada para autoridad EEAT | 7-jun | 11-jun: decisión de retirarla; 12-jun: retirada | Construida y eliminada en 5 días |
| 7 | Google Search España como canal principal | Implícita desde abril; activada 20-jul | 30-jul: "deja de ser el canal principal por techo estructural de demanda" (L1879). Según `MEMORY.md`, el 9-ago tres conclusiones de ese diagnóstico se declararon a su vez falsas (el canal sí convierte) | Diagnóstico y contradiagnóstico en 10 días; el diario no registra la segunda revisión |
| 8 | Exploración de arquitectura multiagente (mayo) | Mayo | 9-jun: carpeta eliminada por "investigación sin recorrido" (L1069) | Trabajo de mayo descartado |
| 9 | Congelación de Ads "sin fecha" (18-abr) | 18-abr | Reactivación el 20-jul | 93 días sin tráfico de pago con el funnel terminado desde abril |

Clasificación de la tabla: hecho_verificado en las filas 1-6, 8 y 9 (todo consta en el diario); la fila 7 combina hecho (diario) e inferencia (memoria del proyecto para el 9-ago).

---

## 7. Señales de sobreconstrucción y de parálisis por análisis

### Sobreconstrucción (inferencia, confianza alta; cada indicio con su evidencia)

1. **16 artículos de blog publicados en un solo día** (7-jun, L976) con tráfico orgánico reconocidamente insuficiente para medir nada (15-jun, L1195: "el volumen de tráfico orgánico todavía es bajo para extraer conclusiones").
2. **Al menos 5 auditorías del mismo activo en 6 semanas**: 2-jun (técnica integral), 4-jun ("senior integral", roadmap de 37 mejoras), 6-jun (segunda técnica integral), 8-jun (contraste de auditoría externa), 19-jun (auditoría de medición). La del 8-jun concluyó que la auditoría externa evaluaba "una versión desactualizada" del portal: el activo se auditaba más rápido de lo que ningún tercero podía seguirlo.
3. **Motor de packs industrializado y reescrito dos veces en 72 horas** (20, 21 y 22-jul) más un cambio de criterio el 23-jul: unas 26 horas en 4 días dedicadas a material comercial cuando no existía ningún lead cualificado que lo hubiera pedido.
4. **Motor de emails con 20 plantillas, detección de género y Calendly prefill** (17-abr) construido para un volumen que nunca llegó y desactivado el 30-jul.
5. Contradicción interna explícita: el 29-jun se declara cerrada la consolidación técnica por rendimiento decreciente (L1493) y aun así julio contiene unas 41 horas más de construcción (packs y motor) frente a 4 horas del hito comercial real del mes (firma RRS).

### Parálisis por análisis (inferencia, confianza alta)

1. **El presupuesto de Ads se identifica como el único bloqueo de la captación el 16-abr** (L425) y no se resuelve hasta el 20-jul: **95 días**. La congelación geopolítica del 18-abr se decidió "sin fecha de reactivación" y sin criterio de salida definido.
2. **116 días desde el inicio del proyecto (26-mar) hasta el primer euro de inversión publicitaria (20-jul).** El primer lead de campaña llegó el 30-jul, día 126.
3. Cadena de precondiciones autoimpuestas para lanzar campañas (28-abr, 29-abr, 30-abr, 15-jun, 19-jun): cada validación completada engendró la siguiente, con el resultado de que el dato estructural clave del negocio ("la demanda de búsqueda cualificada en España es casi inexistente", 30-jul, L1877) solo se obtuvo tras 4 meses, cuando 143 EUR de gasto real lo revelaron en una semana.
4. Bloqueo de naming de 15 días reconocido como evitable en el propio diario (14-abr, L346).

### Matiz a favor (para equilibrio del juicio)

- Parte de la construcción evitó pérdidas reales: 4 incidencias de pérdida silenciosa de leads se detectaron y corrigieron antes de escalar gasto (alias de envío, 24-abr, L568; codificación de campos, 4-jun, L901; polling de no leídos, 6-jun, L953; detector de asunto, 25-jun, L1433, con 20 días de leads descartados y 1 lead perdido). El problema no es que ese trabajo careciera de valor, sino su proporción frente a la ausencia total de motor comercial activo.

---

## 8. Respuestas directas a las preguntas del encargo

1. **¿Qué porcentaje del esfuerzo fue a construcción técnica frente a captación y venta activa?** Aproximadamente **71% a construcción** (182 de 256,5 h: web/técnico 53%, packs 13%, contenido 5%) frente a **8,6% a captación activa** (22 h: Ads 15 h, LinkedIn 7 h) y **0% a venta activa con leads finales**. Sumando la gestión del partner RRS, el bloque comercial completo llega al 18%.
2. **¿Cuántas entradas mencionan contacto real con leads?** 0 de 50 documentan una conversación efectiva con un lead inversor. 3 de 50 mencionan leads (25-jun, 26-jun, 30-jul), siempre como registro pasivo o como intención de contacto. La actividad "comercial" registrada es en su totalidad con el partner y proveedores.
3. **¿Qué decisiones se revirtieron?** Nueve casos documentados (tabla de la sección 6). Los más caros: motor de emails construido y desactivado, sistema de packs con tres cambios de formato/criterio en 4 días, y congelación de Ads de 93 días.
4. **¿Hay parálisis por análisis o sobreconstrucción?** Sí, ambas, con evidencia interna del propio diario (sección 7). El patrón dominante es: construir y auditar en bucle lo controlable (la web) y aplazar lo incierto (gastar en tráfico y hablar con inversores). El diario incluso lo diagnostica dos veces (29-jun y 30-jul) sin que el reparto de horas posterior cambie de forma sustancial.

**Conexión con el problema de los 2 leads en 30 días:** la cronología explica el resultado. El proyecto acumuló 256,5 horas en 4 meses, de las cuales el mercado solo "vio" tráfico de pago a partir del día 116, con una campaña mal configurada la primera semana, y no existe todavía ninguna hora registrada de venta activa. Con ese reparto, 2 leads no es una anomalía del canal: es la salida esperable de un sistema que ha optimizado la fábrica y no la distribución. Además, la interrupción del diario el 30-jul deja sin evidencia interna el único periodo con datos de conversión reales, lo que debilita tanto la gestión como el expediente de sustancia económica.

---

## 9. Riesgos documentales detectados

- **Diario detenido 21 días** (30-jul a 20-ago) en el periodo más crítico. Impacto doble: gestión sin registro y expediente AEAT con hueco (hecho_verificado).
- **Mayo casi en blanco** (1 entrada, 4 h). No es posible saber desde el diario si en mayo no se trabajó o no se registró (dato_no_disponible).
- Las entradas del 28-30 de abril proceden de una copia paralela fusionada a posteriori (hecho_verificado, cabecera del archivo local del Desktop) y su redacción es notablemente más genérica; como evidencia de actividad son más débiles que el resto.
- No se encontraron contraseñas ni datos personales sensibles en el diario. Se menciona la existencia pasada de un token de Telegram expuesto en el historial del repositorio, ya rotado (entrada 4-jun, L881); el diario no reproduce el token.

---

## 10. Archivos revisados y no abiertos

**Revisados (completos):**
1. `G:\Mi unidad\Horizonte Emirates\07_diario.md` (1.920 líneas, íntegro, en 4 lecturas paginadas + grep de verificación de encabezados).
2. `G:\Mi unidad\Horizonte Emirates\Diario actividad proyecto\LEEME.txt`.
3. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\Diario actividad proyecto\Horizonte Emirates – Diario 2026.md` (aviso de archivo no oficial, 11 líneas).

**Listados pero no abiertos** (copias previas a la consolidación del 22-jul, redundantes por diseño según `LEEME.txt`; no se abrieron para no duplicar trabajo, aunque un auditor que quiera verificar la fusión del 22-jul debería contrastarlas):
- `G:\Mi unidad\Horizonte Emirates\_ARCHIVO\Horizonte Emirates - Diario 2026 (ORIGINAL previo a consolidacion 2026-07-22).md`
- `G:\Mi unidad\Horizonte Emirates\_ARCHIVO\07_diario_LOG_SESIONES_hasta_2026-06-12.md`

**Fuente de contexto adicional citada:** `C:\Users\User\.claude\projects\c--Users-User-Desktop-Propulse-IA-Repositorio-Proyectos-Horizonte-Emirates\memory\MEMORY.md` (índice de memoria del proyecto), usada únicamente para contrastar el periodo de agosto ausente del diario.
