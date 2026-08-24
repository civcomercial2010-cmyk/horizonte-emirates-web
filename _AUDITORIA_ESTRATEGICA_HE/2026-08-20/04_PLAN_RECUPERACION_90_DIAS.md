# 04 · Plan de recuperación 90 días

**Auditoría integral Horizonte Emirates · 20-08-2026**
Numeración: A-1xx (72 horas), A-2xx (días 4-14), A-3xx (días 15-30), A-4xx (días 31-60), A-5xx (días 61-90). La matriz completa con todos los campos (dependencias, coste, horas, KPI, valores objetivo a 14/30/60/90 días, confianza y regla de decisión) está en `05_MATRIZ_ACCIONES.csv`; aquí se presenta lo ejecutivo. Responsables: Jesús (J), Dayvo (D), Marc/RRS (M), asesor fiscal externo (F).

**Presupuesto del plan:** sin subir el gasto de medios actual (~600 EUR/mes) hasta el día 30; a partir de ahí, según reglas de decisión. Casi todo el plan es horas propias, no dinero.

---

## FASE 0 · Primeras 72 horas (20 a 23-08) · Solo desbloqueos críticos

| ID | P | Acción exacta | Evidencia que la justifica | Entregable | Resp. | Horas |
|---|---|---|---|---|---|---|
| A-101 | P0 | **Pausar la campaña de Display** y devolver el 100% del presupuesto a Búsqueda. Pedir a Dayvo: informe "Dónde se han mostrado los anuncios" (% del gasto en apps) y exportación semanal de la cuenta a `ads-export\` | 2.700 clics a 0,05 EUR, 76 sesiones, 0 leads; apps confirmadas por Dayvo; Búsqueda "limitada por presupuesto" (evidencias 04 y 10) | Display en pausa + primer CSV archivado | J+D | 1 |
| A-102 | P0 | **Verificar en la consola de Ads la importación de conversiones GA4** (única vía de conversión: la etiqueta nativa está vacía por diseño). Dejar `generate_lead` del formulario como ÚNICA conversión principal; guía y WhatsApp como secundarias; desmarcar en GA4 los eventos fantasma (purchase, qualify_lead, close_convert_lead, manual_event_SUBMIT_L) | Conversiones infladas 2,5x (5 vs 2); contradicción M06; D-01 (evidencia 04, sección 4) | Captura de la configuración + nota en 04_metricas.md | J+D | 1,5 |
| A-103 | P0 | **Rescatar los leads vivos**: (1) Sergio: toque 3 hoy (WhatsApp + email M-cierre con hueco concreto), lleva 13 días en silencio; (2) Jose Diaz: preguntar a Marc el desenlace de la videollamada pedida el 01-08 y registrar el motivo de pérdida; (3) descargas de la guía: primer email de nurturing manual | Evidencia 10, sección 2: el 100% del pipeline real está sin trabajar | 3 contactos hechos + notas en el CRM | J (+M) | 2 |
| A-104 | P0 | **Apps Script**: poner `EXPECT_TRAFFIC=true` (alerta de sequía 72 h), corregir `pollUnsubscribes` (límite de palabra + confirmación manual: hoy "trabaja" da de baja), repegar el .gs y verificar los 4 triggers | Evidencia 02, hallazgos 5.1 y 5.5 | .gs desplegado + captura de triggers | J | 2 |
| A-105 | P0 | **Web, UN solo despliegue y congelación 14 días**: (1) quitar del hero "lista para alquilar", "desde 30.000€ de entrada" y "36 meses tras la entrega" (o respaldarlos con producto real); (2) publicar bloque de identidad: Jesús y Marc con foto y 3 líneas + "derivamos a RNR International Real Estate, licencia RERA/ORN 16084" enlazada al registro público de Dubái | P1, P2 del top 10 de conversión; la licencia está verificada desde el 21-07 y no publicada | Deploy único + congelación hasta el 03-09 | J | 4 |
| A-106 | P0 | **Contrato**: reenviar el contrato contrafirmado y los Anexos I y II a marc@rnr-realestate.com Y rakesh@rnr-realestate.com (direcciones contractuales) pidiendo acuse y fecha de firma; **re-derivar formalmente** a Ikaverticales, Jose Diaz y Sergio con el formato de la cláusula 2.a; descargar y archivar el PDF contrafirmado en `LEGAL\` | Evidencia 06: 24 días sin respuesta, derivaciones por BCC sin valor probatorio, 6 de 7 proyectos sin comisión | Email enviado + 3 derivaciones formales + PDF archivado | J | 2 |
| A-107 | P0 | **Higiene del CRM**: marcar las 6 pruebas internas como descartado-test; añadir motivo de pérdida a Jose Diaz; los estados dejan de mezclar pruebas con leads | Evidencia 10, sección 1 | CRM limpio | J | 0,5 |
| A-108 | P0 | **Instaurar el registro semanal**: plantilla fija en 04_metricas.md (gasto, impresiones, clics, sesiones, leads, CPL por campaña) + captura de GA4 del evento consent_decision (tasa de aceptación de cookies, D-06) | H7 y D-02: la "nueva línea base" lleva 8 días sin un solo dato anotado | Primera fila de la serie + dato de consentimiento | J | 1 |

**Total fase 0: ~14 horas, 0 EUR adicionales.**

## FASE 1 · Días 4-14 (24-08 a 03-09) · Confianza, seguimiento y preparación de volumen

| ID | P | Acción exacta | Entregable | Resp. | Horas |
|---|---|---|---|---|---|
| A-201 | P0 | **Guardián v2 (instrumentar la fase humana)**: añadir al guardián dos comprobaciones: leads `activo` sin nota de contacto a las 24/48 h de crearse, y toques de la Cola vencidos sin nota posterior. Alerta por email | Guardián desplegado vigilando el SLA | J | 4 |
| A-202 | P1 | **Página /gracias.html** con URL propia (conversión de respaldo auditable) + enlace Calendly con UTM; medir en GA4 como page_view de conversión | Página en producción (se despliega el 03-09 con el fin de la congelación) | J | 3 |
| A-203 | P1 | **WhatsApp coherente**: en la home, sustituir el modal por enlace directo wa.me con tracking (como en proyectos); el lead de WhatsApp pasa a tier B por defecto (hoy entra como C 0 puntos) | Canal unificado | J | 2 |
| A-204 | P0 | **Validar México y LATAM en el Planificador de Google Ads** (pendiente desde el 30-07, 10 minutos) y decidir con Dayvo el test de la fase 2 | Nota de decisión con volúmenes | J+D | 1 |
| A-205 | P1 | **Montar retargeting de Meta** (el pixel ya está instalado y con Consent Mode): audiencia de visitantes 30-90 días, 5 EUR/día, creativo del memorándum de muestra | Campaña lista para activar el día 15 | J | 4 |
| A-206 | P0 | **Corregir las simulaciones de los packs**: gastos reales en Binghatti (15%) y SAAS (30%), base estandarizada (un tipo de cambio, gastos por tipo de producto, revalorización con fuente o sin página de trayectoria), rebajar NH (21,6% "prudente") y GF (+56%) a supuestos defendibles, y regenerar los PDF | 7 packs coherentes y comparables | J | 6 |
| A-207 | P1 | **Publicar el memorándum de muestra** (el mejor, ya corregido) en proyectos.html + completar precio en los 7 inmuebles (los 4 que faltan) | Página de proyectos con prueba de nivel | J (+M para precios) | 3 |
| A-208 | P2 | **Unificar el scoring** en los 3 generadores y la documentación (escala de 10 puntos del 12-08) | Generadores alineados | J | 2 |
| A-209 | P1 | **Enviar el correo al asesor fiscal** (LI-05, redactado desde julio) para validar la guía; montar el mini flujo de nurturing de descargas (2 correos) y enlazar la descarga desde los 4 artículos fiscales del blog | Guía validada en curso + descargas dentro del funnel | J+F | 3 |
| A-210 | P1 | **Ajustes de Búsqueda con Dayvo**: nuevas negativas, sitelinks reescritos (0 clics en 2.727 impresiones), y test de anuncio con precio real ("preventas desde 242.000€") para cualificar el clic | Cambios aplicados | D | 2 |
| A-211 | P2 | **Higiene técnica**: redirect /proyectos → /proyectos.html, resolver el bloqueo de robots.txt gestionado por Cloudflare, sitemap con lastmod real, erratas ("plénamente") | Deploy del 03-09 | J | 2 |
| A-212 | P1 | **Retomar el diario** y reconstruir agosto desde git, Gmail y esta auditoría (expediente de sustancia económica con 21 días de hueco) | Diario al día | J | 3 |
| A-213 | P0 | **Solicitar por escrito a RRS la confirmación de comisión de los 6 proyectos publicados** (aunque el Anexo I no esté firmado, cada respuesta o silencio queda documentado). Fecha límite interna: 05-09; si no hay respuesta, escalar a Rakesh y activar la búsqueda del segundo partner (M32) | 6 confirmaciones o constancia de silencio | J | 1 |

**Total fase 1: ~36 horas, ~50 EUR (preparación Meta).**

## FASE 2 · Días 15-30 (04-09 a 19-09) · Experimentos controlados

| ID | P | Acción exacta | Regla de decisión | Resp. |
|---|---|---|---|---|
| A-301 | P0 | **Landing dedicada para Ads** (variante de la home sin navegación, formulario en el hero, identidad y memorándum visibles) y dirigir a ella el grupo "inversión". La home sigue para el grupo "pisos" como control | Si conversión landing ≥1,5x home con ≥100 clics por rama: migrar todo. Si no, mantener home | J+D |
| A-302 | P1 | **Activar el retargeting de Meta** (A-205): 5 EUR/día, 14 días | CPL ≤60 EUR o ≥2 leads: mantener y subir a 10 EUR/día. 0 leads con 70 EUR: pausar | J |
| A-303 | P1 | **Test de México en Búsqueda** (si A-204 avala): campaña separada, 10 EUR/día, keywords de inversión, landing con divisa y seguridad como motivadores (no fiscalidad española) | ≥2 leads con CPL ≤80 en 14 días: consolidar. Si no, pausar y documentar | J+D |
| A-304 | P1 | **Primer webinar** "Invertir en Emiratos desde España: los números de verdad" (Google Meet, quincenal): invitación a los 9 contactos del CRM + descargas de guía + nuevos leads | ≥8 inscritos y ≥1 videollamada derivada: repetir quincenal. <4 inscritos dos ediciones: sustituir por vídeo grabado | J |
| A-305 | P2 | **Lead magnet perecedero** "Top 5 oportunidades Q4-2026" (desde los packs corregidos), gated, promocionado en blog y retargeting | ≥15 descargas/mes: renovar trimestral | J |
| A-306 | P1 | **LinkedIn versión mínima**: madurar la cuenta (15-20 contactos), crear la página cuando LinkedIn lo permita, lista de 50 perfiles (LI-07); 2 publicaciones/semana del playbook ya escrito | Página creada + 8 publicaciones en el mes | J |
| A-307 | P0 | **Decisión de canal del día 30** con la primera ventana limpia (20-08 a 19-09): CPL real por campaña, conversión web, calidad de leads. Regla de escalado: Búsqueda ES sube a 30 EUR/día SOLO si CPL ≤80 y ≥6 leads en el mes | Documento de decisión en 03_decisiones.md | J |
| A-308 | P1 | **Pipeline comercial en el CRM**: estados nuevos (contactado, conversación, reunión, propuesta, reserva, perdido con motivo), columna de motivo de pérdida (lista cerrada), registro de reuniones de Calendly | CRM con etapas + primer informe semanal | J |

## FASE 3 · Días 31-60 (20-09 a 19-10) · Escalado de lo que funciona y autoridad

| ID | P | Acción exacta | Regla |
|---|---|---|---|
| A-401 | P0 | **Escalar según A-307**: subir Búsqueda ES a 30-40 EUR/día y/o consolidar México y Meta según CPL. Presupuesto total máximo fase 3: 1.200 EUR/mes | Revisión quincenal; si el CPL de un canal supera 150 EUR dos semanas seguidas, se recorta |
| A-402 | P2 | **Canal de difusión de WhatsApp** para nurturing de leads fríos (2 envíos/semana con criterio, no catálogo) | ≥30 suscriptores en 30 días o se para |
| A-403 | P1 | **PR**: proponer entrevista o artículo a elcorreo.ae y a 1 medio económico español o andorrano (autoridad verificable que ningún activo actual da) | 1 aparición publicada en 60 días |
| A-404 | P1 | **4 artículos SEO de larga cola** (fiscalidad práctica: 720/721, doble imposición; y RAK: "invertir en Al Marjan") con autor con nombre y enlace al lead magnet; reanudar cadencia 2/mes | Publicados y con autor real |
| A-405 | P1 | **Outbound LinkedIn**: 10 contactos/día de la lista de 50 con el guion del playbook (versión sobria) | ≥5 conversaciones/mes o revisar guion |
| A-406 | P2 | **Cubrir tramos de cartera**: activar Mondrian y/o Sobha City (material ya en Drive) para tener producto AD de ticket medio y 4º proyecto RAK; retirar de la web el tramo "menos de 150k" si no hay producto | 2 fichas nuevas con pack |
| A-407 | P0 | **Decisión de partner**: si a 20-09 RRS no ha devuelto acuse + Anexo I, abrir conversación formal con un segundo partner (M32) y comunicar a RRS que la exclusividad de facto termina | Segundo partner en due diligence o anexos firmados |

## FASE 4 · Días 61-90 (20-10 a 19-11) · Consolidación y diversificación

| ID | P | Acción exacta |
|---|---|---|
| A-501 | P1 | Consolidar el mix: presupuesto Q4 por canal según CPL y calidad (revisión con la serie completa de 8 semanas limpias) |
| A-502 | P1 | **Dashboard semanal de dirección** automatizado (ver sección Materiales): Sheets alimentado por el guardián + exportaciones, revisado cada lunes |
| A-503 | P2 | **Sistema de referidos y colaboraciones**: acuerdo tipo con 2-3 asesores patrimoniales o gestores españoles (fee compartido documentado en el Anexo I) |
| A-504 | P2 | **Reactivar secuencias automáticas SOLO si** el volumen supera 15 leads/mes, previa reescritura de las plantillas con cifras no conformes (7-8% neto) |
| A-505 | P1 | **Presencia sobre el terreno**: viaje de Jesús a Dubái/RAK con contenido propio (visitas de obra, fotos, vídeo con Marc) si hay ≥3 oportunidades en pipeline; es la única forma de sustanciar "visitas reales al terreno" como diferencial |
| A-506 | P2 | Al primer cierre: perfil de Trustpilot + caso real documentado (con permiso del cliente) + actualización de toda la prueba social |

---

## Backlog de experimentos priorizado (ICE: Impacto x Confianza x Facilidad, 1-10)

| # | Experimento | Hipótesis | Canal | Coste | Duración | Muestra mín. | Métrica principal | Métrica de protección | Escalar si | Parar si | ICE |
|---|---|---|---|---|---|---|---|---|---|---|---|
| E-01 (=A-101) | Pausar Display | El presupuesto devuelto a Búsqueda produce ≥1 lead/semana que Display no producía | Ads | 0 | 7 días | n/a | Leads/semana | Impresiones de Búsqueda | Siempre (es corrección, no test) | n/a | 10,0 |
| E-02 (=A-105) | Identidad + licencia publicadas | La conversión clic a lead sube ≥50% al ver caras y licencia | Web | 0 | 14 días | ~200 clics | Conversión clic a lead (hoy ~0,4-0,8%) | Calidad del lead (tier) | ≥1,2% | <0,6% tras 300 clics | 8,6 |
| E-03 (=A-301) | Landing dedicada Ads | Formulario en hero sin distracciones convierte ≥1,5x la home | Ads | 0 | 14 días | 100 clics/rama | Conversión por rama | CPL | ≥1,5x | <1x | 8,0 |
| E-04 (=A-302) | Retargeting Meta | Los ~500 clics ya pagados convierten a CPL <60 al reimpactarlos | Meta | 70-150 EUR | 14 días | audiencia ≥300 | CPL | Frecuencia <4 | CPL ≤60 | 0 leads con 70 EUR | 7,7 |
| E-05 (=A-303) | Búsqueda México | Existe demanda hispana con CPL ≤80 | Ads | 140 EUR | 14 días | ≥50 clics | CPL y nº leads | % leads basura | ≥2 leads CPL ≤80 | 0 leads con 100 EUR | 7,2 |
| E-06 (=A-203) | WhatsApp directo en home | Quitar el modal multiplica ≥3x los inicios de conversación | Web | 0 | 14 días | ~30 clics WA | Conversaciones iniciadas | Leads con datos (los que escriban dejan el dato en el chat) | ≥3x clics del modal actual | Spam inmanejable | 7,0 |
| E-07 (=A-304) | Webinar quincenal | Un evento en directo convierte leads fríos en videollamadas | Meet | 0 | 2 ediciones | 8 inscritos | Videollamadas derivadas | Horas invertidas | ≥1 videollamada/edición | <4 inscritos x2 | 6,3 |
| E-08 (=A-303 var) | Formulario invertido | Contacto primero (nombre+WhatsApp) sube el total de leads sin hundir la calidad | Web | 0 | 14 días | ~100 inicios | Leads totales | % tier A+B | +30% leads y ≥50% B+ | Calidad se hunde (<30% B+) | 6,3 |
| E-09 (=A-305) | Top 5 Q4 perecedero | La caducidad sube la descarga y el email capturado | Web/Meta | 0 | 30 días | n/a | Descargas/mes | % emails válidos | ≥15/mes | <5/mes | 5,8 |
| E-10 (=A-210) | Anuncio con precio | Publicar "desde 242.000€" cualifica el clic (menos clics, más leads) | Ads | 0 | 14 días | ≥100 clics | Conversión clic a lead | CTR (caerá: aceptable hasta -40%) | Conversión ≥1,5x | CTR cae >60% sin subir conversión | 5,5 |
| E-11 (=A-405) | Outbound LinkedIn 10/día | El playbook escrito genera ≥5 conversaciones/mes con perfil 300k+ | LinkedIn | 0 | 30 días | 200 contactos | Conversaciones | % respuestas negativas | ≥5/mes | <2/mes | 5,0 |
| E-12 (=A-402) | Canal difusión WhatsApp | Leads fríos aceptan nurturing one-to-many | WhatsApp | 0 | 30 días | n/a | Suscriptores | Bajas | ≥30 | <10 | 4,2 |

## Escenarios económicos (mensuales, en régimen, con supuestos explícitos)

Supuestos comunes: ticket medio 300k EUR, comisión 3% (9.000 EUR por operación, SOLO si el papel de A-106/A-213 se cierra), conversión lead a videollamada 25-40% (rango del sector para lead cualificado bien seguido), videollamada a reserva 10-20%, ciclo de venta 30-90 días. Toda cifra de leads usa el CPL de Búsqueda observado (60-127 EUR) y sus rangos; cambiarán con D-02 (gasto real).

| Variable | Conservador | Base recomendado | Acelerado |
|---|---|---|---|
| Inversión medios/mes | 600 EUR (solo Búsqueda ES) | 900-1.200 EUR (ES + MX + Meta) | 2.000-2.500 EUR (+ LinkedIn Ads NO: prohibido; + webinar promocionado) |
| Gestión agencia | 315 EUR | 315 EUR | 315 EUR (renegociar si no aporta) |
| Tráfico pagado/mes | 500-700 clics | 900-1.400 clics | 1.800-2.600 clics |
| Conversión web (con A-105/A-301) | 1,0-1,5% | 1,2-2,0% | 1,2-2,0% |
| **Leads/mes** | **5-9** | **12-20** | **22-40** |
| Leads cualificados (B+) | 2-4 | 5-9 | 9-16 |
| Videollamadas/mes | 1-2 | 2-5 | 4-8 |
| Operaciones potenciales | 0-1 por trimestre | 1 cada 1-2 meses | 1-2 al mes (a partir del mes 3) |
| CPL (medios) | 70-120 EUR | 50-90 EUR | 55-100 EUR |
| Coste por lead cualificado | 150-300 EUR | 100-220 EUR | 130-250 EUR |
| CAC potencial por operación (medios+gestión) | 2.700-5.500 EUR | 1.200-3.000 EUR | 1.400-3.200 EUR |
| Horas comerciales/semana necesarias | 4-6 | 8-12 | 15-20 (requiere apoyo o priorización dura) |

Qué cambiaría cada estimación: el CPL real de la cuenta (D-02) mueve todos los rangos; la tasa de aceptación de cookies (D-06) corrige la conversión web medible; la confirmación de comisiones (A-213) decide si una operación vale 9.000 EUR o 0; la conversión videollamada a reserva es el dato más incierto (n=0 hoy) y solo la práctica lo fijará.

**Recomendación:** escenario Base desde el día 30 si la ventana limpia confirma CPL ≤80 y conversión ≥1,2%. El Acelerado solo tras la primera reserva o con los anexos firmados.

---

## Materiales concretos listos para usar

### Propuesta de valor y hero
Ver `02_AUDITORIA_COMPLETA.md`, secciones 3.2 y 3.3 (arquitectura móvil completa, H1, subtítulo, CTA principal y secundario).

### Concepto de landing para Google Ads (A-301)
Una sola columna móvil: H1 "Inmuebles seleccionados en Dubái y Ras Al Khaimah, con números que se pueden defender" → 3 tarjetas con precio y entrega → bloque identidad (Jesús + Marc + licencia RERA 16084 enlazada) → imagen del memorándum ("esto es lo que recibirá en 48 h") → formulario 2 pasos (contacto primero) → FAQ de 5 objeciones (seguridad, gastos totales, fiscalidad, plazos, proceso) → footer legal. Sin navegación, sin blog, sin calculadora.

### Lead magnet recomendado
Principal: **memorándum de muestra real** (SAAS Hills o NH corregido) visible sin gate como prueba de nivel + **"Top 5 oportunidades Q4-2026"** gated con fecha de caducidad (A-305). La guía fiscal se mantiene tras la validación del asesor (A-209).

### Tres enfoques de anuncios (Búsqueda, grupo inversión)
1. **Números honestos:** "Invertir en Dubái desde España | Preventas desde 242.000€ | Análisis con gastos reales y escenarios, sin promesas del 20%. Respuesta en 24 h."
2. **Fiscalidad:** "¿Invertir en Dubái tributando en España? | Le explicamos el modelo 720, la doble imposición y los gastos reales antes de que compre. Guía y análisis gratuitos."
3. **RAK / momento Wynn:** "Al Marjan Island, antes del Wynn | Residencias de marca desde 399.000€ con plan de pagos del promotor. Análisis independiente en español."

### Primer mensaje de WhatsApp (lead nuevo)
"Hola [Nombre], soy Jesús Ibáñez, de Horizonte Emirates. He recibido su solicitud (capital [rango], objetivo [X]). Antes de enviarle nada quiero hacerle 2 preguntas de 1 minuto para no mandarle inmuebles que no encajan. ¿Le viene bien por aquí o prefiere que le llame? Le adelanto: el análisis con 3 inmuebles y números completos lo tendrá en 48 h, como le prometimos."

### Guion de cualificación (videollamada de 20 min)
1. Contexto (3'): situación, por qué Dubái ahora, experiencia previa invirtiendo.
2. Capital y estructura (4'): rango confirmado, financiación o contado, persona física o sociedad, residencia fiscal.
3. Objetivo (4'): renta vs plusvalía vs uso; horizonte; expectativa de rentabilidad (ESCUCHAR el número que tiene en la cabeza y recalibrar con el método propio).
4. Proceso (5'): cómo trabajamos, qué es RRS/RNR (licencia), cómo cobramos, qué pasa después de comprar.
5. Cierre (4'): acordar los 2-3 inmuebles del memorándum, fecha de envío y fecha de la siguiente llamada ANTES de colgar. Registrar todo en el CRM.

### Secuencia de seguimiento (tier A/B, sustituye a la cadencia rota)
D0 W0 automático + WhatsApp personal · D1 email personal con planteamiento · D2 llamada (si hay teléfono) · D4 WhatsApp con un dato de valor (no presión) · D7 email con memorándum · D10 llamada de cierre de reunión · D14 email de cierre o paso a nurturing (webinar + Top 5 trimestral). Cada toque anotado; el guardián v2 (A-201) avisa de vencidos.

### Estructura del investment pack (ajustes al motor actual)
Mantener las 13-14 páginas actuales con: base de simulación única (gastos por tipo de producto, un tipo de cambio, revalorización con fuente o sin trayectoria), página nueva de "gastos totales de la operación en EUR" (compra + anuales + salida), TIR orientativa además del "retorno total", y fecha de validez del precio en portada.

### Calendario inicial de contenidos (60 días)
Semanas 1-2: artículo "Cuánto cuesta DE VERDAD comprar en Dubái (todos los gastos en EUR)" + publicación LinkedIn de apertura. Semanas 3-4: "Modelo 720 y su piso en Dubái: guía práctica" + vídeo corto con teaser de GF (material ya en Drive). Semanas 5-6: "Al Marjan Island: qué hay detrás del Wynn" + webinar 1. Semanas 7-8: "Cómo verificar a su intermediario en Dubái (licencias RERA)" + webinar 2. Todo firmado con nombre y foto, todo enlazando al lead magnet.

### Webinar (A-304)
45 min quincenal: 15' mercado con datos con fuente, 15' un caso de análisis real con el memorándum en pantalla (gastos y escenarios incluidos), 10' fiscalidad España-UAE, 5' Q&A. CTA única: reservar análisis personal (Calendly). Grabación como contenido evergreen.

### Sistema de referidos
Acuerdo simple a 2 niveles: (1) referidor profesional (asesor patrimonial, gestor): 20-25% de la comisión de HE por operación cerrada, con anexo escrito; (2) cliente que refiere: regalo fijo (no porcentaje) para evitar conflicto regulatorio. Ambos supeditados a tener el Anexo I firmado (A-213).

### Dashboard semanal de dirección (A-502)
Una fila por semana: gasto por canal · impresiones · clics · sesiones · tasa de consentimiento · leads por origen · % contactados <24 h · conversaciones · videollamadas agendadas/celebradas · propuestas (memorándums enviados) · reservas · CPL por canal · coste por lead cualificado · motivos de pérdida de la semana · horas comerciales invertidas. Fuentes: exportación de Ads (D-02), GA4, CRM. Revisión: lunes, 30 minutos, con las reglas de decisión de A-307/A-401.

---

## Reglas globales del plan

1. **Nada de subir presupuesto antes del día 30** (decisión A-307 con la ventana limpia).
2. **Ningún cambio de web fuera de los deploys pactados** (03-09 y día 30): la medición limpia es un activo tan valioso como los leads.
3. **Ninguna acción de escalado sobre proyectos sin comisión confirmada** (A-213 manda).
4. **Todo dato que se recabe se archiva** (ads-export, 04_metricas, diario): la auditoría no volverá a encontrarse una carpeta vacía.
5. **Cada viernes**: 30 minutos de revisión del plan contra la matriz (05_MATRIZ_ACCIONES.csv) marcando estado de cada acción.
