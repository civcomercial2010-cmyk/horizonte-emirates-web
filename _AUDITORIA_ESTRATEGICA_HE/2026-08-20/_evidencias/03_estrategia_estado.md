# Área 3: Estrategia, modelo de negocio y estado del proyecto

Auditoría estratégica Horizonte Emirates. Fecha de la revisión: 20 de agosto de 2026.
Autor: agente de auditoría (área 3). Modo solo lectura sobre el contenido existente.

**Convención de clasificación de cada hallazgo:** `hecho_verificado` (consta en un archivo con ruta citada), `inferencia` (deducción a partir de hechos verificados), `hipotesis` (explicación plausible sin prueba directa), `dato_no_disponible` (el dato no existe en las fuentes revisadas). Confianza: alta / media / baja.

---

## 1. Resumen ejecutivo

El proyecto tiene una ejecución técnica muy por encima de su ejecución comercial. Se diseñó como un portal de afiliación pura (captar leads hispanohablantes y derivarlos a un partner en Dubái a cambio de una comisión del 4% con trigger en la firma del SPA), con un escenario base de 248.000 EUR de beneficio neto en el año 1. Diecisiete meses después de arrancar (marzo 2026), la realidad es: 2 leads reales, 0 operaciones, 0 EUR de comisiones, un contrato firmado solo por la otra parte que cubre el 3% de un único proyecto con trigger en "venta completada y registrada", y una inversión comprometida de al menos 2.400 EUR entre agencia SEM y publicidad. El proyecto incumplió sus propias reglas de activación (el plan exigía 15 leads orgánicos y contrato firmado antes de pagar tráfico; se activó Ads con 0 leads orgánicos y sin contrafirma), congeló el SEM 93 días por una decisión geopolítica mientras construía infraestructura, y descubrió el 12/08 que el final del embudo llevaba semanas técnicamente roto. La causa de los 2 leads en 30 días no es una sola: es la suma de una demanda de búsqueda casi inexistente en España para la intención inversora, un presupuesto de 20 EUR/día en un solo país, una landing con fallos graves de conversión hasta el 12/08 y una capa de confianza (equipo anónimo, partner sin nombre público, 0 prueba social) impropia de un ticket de 150.000 a 1.000.000 EUR. El modelo de ingresos real está además sin asegurar: se paga tráfico hacia 7 proyectos publicados cuando solo 1 tiene comisión pactada por escrito. El negocio es hoy una apuesta concentrada en una persona (Jesús, que hace todo a mano) y un partner (RRS/Marc) con el que el acuerdo económico está a medio cerrar.

---

## 2. Qué se pretendía conseguir (el plan original)

Fuente principal: `G:\Mi unidad\Horizonte Emirates\business-plan-horizonte-dubai.html` (documento "Business Plan 2025-2026", nombre de trabajo "Horizonte Dubai").

| Elemento del plan | Valor proyectado | Evidencia (sección del HTML) |
|---|---|---|
| Modelo | Portal de afiliación pura: capta leads, RRS cierra, se cobra por resultado | Bloque 1, "Definición del Negocio" (cards "Qué es", "Rol de Jesús", "Rol de RRS") |
| Comisión | **4% por cierre**, comisión media 12.000 EUR | Cabecera (header-meta) y bloque 3 |
| Trigger de cobro | Firma del SPA + primer pago al escrow, calificado de "condición no negociable"; "si no ceden: buscar alternativa" | Sección "rrs", tabla "Las 5 cláusulas del contrato" |
| Inversión inicial | 3.270 EUR (contrato 1.500 + GDPR 300 + objeto social 300 + dominio/hosting 200 + colchón 600) | Bloque 3, highlight "Inversión inicial real" |
| Beneficio neto año 1 | Conservador 73.000 / Base 248.000 / Tracción 570.000 EUR | Bloque 3, scenario-grid |
| Supuesto de leads | 15 a 75 leads/mes con conversión del 3 al 8% | Bloque 3, scenario-rows |
| Dedicación | 10-12 h semanales en crucero; "Jesús no atiende leads", invisible ante el lead | Resumen ejecutivo (kpi-box) y bloque 1 |
| Canal | Orgánico primero (SEO, LinkedIn, grupos); paid solo en mes 4+ | Bloque 4, tabla de canales |
| Regla de activación del paid | "15+ leads cualificados orgánicos AND 3+ en conversación con RRS AND contrato firmado. Sin las tres condiciones, no se activa" | Bloque 4, highlight azul; repetida en bloque 8, "Escala 1" |
| Segmentos | 3 perfiles por motivación: B Rentabilidad (primario, 150-400k), C Relocalizador, A Patrimonialista (diferido a mes 4+) | Bloque 2, cards de segmentos |
| Mercados | España y México primarios; Colombia/Argentina/Chile secundarios | Bloque 1, "Países objetivo" |

- **Hallazgo 2.1 (hecho_verificado, confianza alta, impacto alto).** El plan aprobado proyectaba 248.000 EUR de beneficio neto en el año 1 con 35 leads/mes. El resultado real a 09/08/2026 es 2 leads totales, 0 ventas y 0 EUR de comisiones (`04_metricas.md`, "Métricas acumuladas"). La desviación frente al escenario conservador (73.000 EUR, 15 leads/mes) también es total.
- **Hallazgo 2.2 (hecho_verificado, confianza alta, impacto medio).** El business plan está desactualizado y nadie lo ha revisado: mantiene el nombre "Horizonte Dubai", recomienda las marcas Aurus/Meridian/Levante, propone Webflow y conserva el 4% con trigger SPA. Ninguno de esos cuatro elementos sobrevivió (nombre distinto, HTML estático, 3% con otro trigger). El plan operativo real vive de facto en `01_estado_proyecto.md` (fases 0-2), sin que exista un documento que reconcilie proyección económica y realidad.

---

## 3. Qué estrategia se diseñó y cómo mutó (cronología con fechas)

Fuentes: `G:\Mi unidad\Horizonte Emirates\03_decisiones.md` (tabla completa de decisiones), `01_estado_proyecto.md` (hitos), `02_tareas.md`.

| Fecha | Decisión / hito | Estado |
|---|---|---|
| 26/03/2026 | Operar bajo Propulse SLU como línea de negocio; ampliar objeto social | Ejecutada |
| 28/03/2026 | Estructura del acuerdo RRS: fee 4%, trigger SPA + 20% pagado, tail 24 meses, SLA 4h | El contrato final NO respetó estos términos (ver sección 6) |
| 14/04/2026 | Pivot tecnológico: abandono de Webflow, HTML estático + GitHub Pages | Ejecutada |
| 16/04/2026 | Fase 1 completa: landing, scoring A/B/C 5 dimensiones, playbook de 20 emails | Ejecutada |
| 18/04/2026 | **Congelar el SEM indefinidamente por el conflicto de Irán**; captación orgánica como sustituto | Ejecutada; el SEM estuvo parado 93 días (18/04 a 20/07, `02_tareas.md` nota de cierre B04/F03) |
| 13/05/2026 | Externalizar el SEM a Dayvo Sistemas SLU: plan Google Ads Pro, 6 meses, **1.891,26 EUR** | Ejecutada (firmado 13/05) |
| 05/06/2026 | Migración de hosting a Cloudflare Workers | Ejecutada |
| 07/06/2026 | Blog SEO: 16 artículos, 5 clusters | Ejecutada |
| 12/06/2026 | Vertical de inversión fraccionada (sub-150k) en modo educativo, bloqueada por due diligence | Diseñada, no encendida (`02_tareas.md`, bloque TF1-TF7) |
| 13/07/2026 | RRS firma el Referral Agreement (efectivo 01/07), sin reabrir términos | Firmado a medias: **sin contrafirma de Propulse** a día de hoy |
| 20/07/2026 | Arranque de Google Ads a 20 EUR/día + sistema de Investment Packs (6 packs) | Ejecutada |
| 28-30/07/2026 | Canal LinkedIn diseñado (playbook completo); arranque bloqueado por antigüedad de la cuenta | Escrito, no publicado (`02_tareas.md`, bloque LI-*) |
| 30/07/2026 | Diagnóstico de campaña: "el canal no funciona"; reconocer que Search España no puede ser canal principal | Parcialmente desmentido el 09/08 |
| 05/08/2026 | Display 2 EUR/día (Búsqueda baja a 18) | Ejecutada |
| 09/08/2026 | Corrección del diagnóstico con datos reales: el canal convierte, CPL 126,61 EUR; congelar presupuesto hasta 5-6 leads | Ejecutada |
| 12/08/2026 | Auditoría de conversión: botón de envío muerto, modal WhatsApp roto desde 27/07, banner tapando el CTA. Bloques A y B desplegados el mismo día; cartera pública de 3 a 7 inmuebles; nueva línea base de medición | Ejecutada (commits c4723f3 y 3cf3e0b, `02_tareas.md` cabecera) |

- **Hallazgo 3.1 (hecho_verificado, confianza alta, impacto alto).** La regla de activación del canal de pago del propio plan se incumplió: el business plan exigía 15+ leads orgánicos, 3+ en conversación y contrato firmado antes de activar paid (`business-plan-horizonte-dubai.html`, bloque 4). El 20/07 se activó Google Ads con 0 leads orgánicos registrados (`04_metricas.md`: los 3 envíos del 18-21/07 eran pruebas) y con el contrato sin contrafirma de Propulse (`02_tareas.md`, RA-FIRMA).
- **Hallazgo 3.2 (hecho_verificado, confianza alta, impacto alto).** Entre el 18/04 y el 20/07 (93 días) no hubo ningún canal de captación activo con presupuesto: la decisión de congelar el SEM (`03_decisiones.md`, 18/04) se cubrió con "captación orgánica" que en la práctica fue construcción de infraestructura y SEO cuya maduración se estimaba en 6-9 meses (`docs\SEO_ESTRATEGIA.md`, sección 1 y 9-bis). Es el patrón actividad-sin-resultados: auditorías técnicas de junio impecables (ROADMAP_AUDITORIA.md, fases 0-7) con 0 leads en paralelo.
- **Hallazgo 3.3 (hecho_verificado, confianza alta, impacto alto).** El fallo de conversión de la web estuvo activo durante la campaña de pago: botón de envío que nacía deshabilitado y evento `lead_submit_attempt` inalcanzable, modal de WhatsApp roto desde el 27/07, banner de cookies de 249 px tapando CTA y WhatsApp (`02_tareas.md`, cabecera del 12/08). Es decir, entre el 20/07 y el 12/08 se pagó tráfico hacia una landing con el final del embudo dañado. Los 2 leads se lograron a pesar de ello.
- **Hallazgo 3.4 (inferencia, confianza alta, impacto alto).** Por qué solo 2 leads en 30 días: concurren (1) demanda de búsqueda inversora casi inexistente en España ("invertir dubai": 13 impresiones en 8 días, `04_metricas.md`, sección "Techo estructural"); (2) campaña limitada a España con 20 EUR/día (unos 22 clics/día); (3) landing con los fallos del 12/08 durante todo el periodo; (4) déficit de confianza estructural para un ticket de 150k+ (equipo anónimo, partner sin nombre, 0 prueba social, `AUDITORIA_INTEGRAL_2026-06-12.md`, hallazgos A01-A03). Ninguna de las cuatro causas por sí sola explica el resultado; juntas sí.
- **Hallazgo 3.5 (inferencia, confianza alta, impacto medio).** Declarar el "canal de pago validado" con n=2 (`01_estado_proyecto.md`, línea 3) es prematuro. Con 2 conversiones, el intervalo de confianza del CPL real es enorme; el propio equipo lo reconoce implícitamente al congelar el presupuesto hasta 5-6 leads (`03_decisiones.md`, 09/08). Además `02_tareas.md` (cabecera del 12/08) registra que a 11/08 el CPL se había deteriorado a ~245 EUR, por encima del umbral de 150. La frase "canal validado" del estado del proyecto convive con un CPL que ya lo desmentía tres días después.

---

## 4. Qué se aprobó, qué se ejecutó de verdad y qué sigue pendiente

### 4.1 Ejecutado y verificable

- Landing + formulario 3 pasos con scoring A/B/C y 5 dimensiones (`03_decisiones.md` 16/04; `public\index.html`).
- Infraestructura técnica completa: Cloudflare, CSP, GA4 + Ads + Meta Pixel + Consent Mode v2, GTM, blog de 16 artículos, guía fiscal como lead magnet, healthcheck del pipeline (`ROADMAP_AUDITORIA.md`, M01-M59 y fases 6-7; `01_estado_proyecto.md`, "Infraestructura desplegada").
- Campaña Google Ads activa desde 20/07 gestionada por Dayvo; Display desde 05/08 (`04_metricas.md`).
- Sistema de Investment Packs: motor de generación + 6 packs producidos (`01_estado_proyecto.md`, hito 20/07; `03_decisiones.md`, 20/07).
- Auditoría de conversión del 12/08 con Bloques A y B desplegados el mismo día; cartera pública de 7 inmuebles (`02_tareas.md`, cabecera).
- Pipeline de leads: Web3Forms → Gmail → Apps Script → Sheets CRM, con envío de correos EN MANUAL: `automation\horizonte-emails.gs` línea 61 (`AUTO_SEND_LEADS: false`) y `automation\SETUP.md` línea 34. Cada lead lo atiende Jesús a mano con el kit `automation\MAILS-MANUALES.md`.

### 4.2 Aprobado pero NO ejecutado (a 20/08 según las fuentes)

| Pendiente | Aprobado desde | Evidencia | Gravedad |
|---|---|---|---|
| Contrafirma del Referral Agreement por Propulse | 21/07 (detectado) | `02_tareas.md` RA-FIRMA, prioridad "Crítica" | Sin acuerdo cerrado, todo el modelo de ingresos pende de la buena fe del partner |
| Anexo de comisiones por proyecto (el 3% solo cubre NH Collection) | 21/07 | `02_tareas.md` RA-ANEXO; `05_funnel.md`, "Cierre" | Se paga tráfico hacia 6 de 7 proyectos sin comisión pactada |
| Validar volumen de búsqueda en México (10 min, coste 0) y abrir LATAM | 30/07 | `02_tareas.md` ADS-GEO; la campaña "sigue configurada solo en España" | Es la palanca de volumen declarada número 1 y lleva 3 semanas sin ejecutarse |
| Segundo canal (Meta retargeting sobre los clics ya pagados) | 30/07 | `02_tareas.md` CANAL-2 | Los clics pagados caducan sin recuperación |
| Test real del formulario en móvil (85,1% de los clics son móvil) | Abierta desde 18/04 (T17), reforzada 30/07 | `02_tareas.md` MOBILE-TEST | La versión mayoritaria del funnel nunca se validó a mano |
| Guardián del funnel (código escrito y probado el 21/07, sin pegar en Apps Script) | 21/07 | `02_tareas.md` FUNNEL-AUTO | Nota: la memoria del proyecto lo da por instalado; el archivo de tareas lo mantiene abierto. Discrepancia documental menor |
| Canal LinkedIn (playbook completo escrito) | 28-30/07 | `02_tareas.md`, bloque LI-*, bloqueado por antigüedad de cuenta | Canal de credibilidad inexistente mientras se pide confianza de ticket alto |
| Prueba social verificable (M17) | 08/06 | `ROADMAP_AUDITORIA.md` M17 ⬜; `AUDITORIA_INTEGRAL_2026-06-12.md` A03 | Señalada como el punto de mayor ROI y sigue abierta |
| Protocolo de derivación de la cláusula 2.a y SLA | 21/07 | `02_tareas.md` RA-PROTOCOLO | Si mañana entra un Tier A, el circuito contractual de derivación no está montado |
| Consentimiento explícito de cesión de datos a RRS (Anexo II del contrato) | Diferida por el usuario el 30/07 | `02_tareas.md` M15-CONSENT | Riesgo RGPD al derivar leads reales |

- **Hallazgo 4.1 (hecho_verificado, confianza alta, impacto alto).** Las dos tareas marcadas "Crítica" más antiguas del negocio (RA-FIRMA y RA-ANEXO, abiertas el 21/07) siguen abiertas un mes después, mientras el gasto publicitario continúa. La propia lectura estratégica interna lo dice: "se paga tráfico hacia proyectos sin comisión pactada" (`02_tareas.md`, lectura COO del 09/08).
- **Hallazgo 4.2 (inferencia, confianza media, impacto medio).** Existe un patrón sistemático: las tareas técnicas (auditorías, hardening, SEO) se cierran en días; las tareas comerciales y legales (contrafirma, anexo, México, Meta, prueba social) llevan semanas o meses abiertas. El cuello de botella del proyecto no es capacidad de ejecución, es priorización hacia lo que da control frente a lo que da ingresos.

---

## 5. Inversión económica realizada

| Concepto | Importe | Periodo | Clasificación | Evidencia |
|---|---|---|---|---|
| Gestión SEM Dayvo Sistemas SLU (Google Ads Pro) | **1.891,26 EUR** (315,21 EUR/mes) | 6 meses desde 13/05/2026 | hecho_verificado, alta | `03_decisiones.md` 13/05; `01_estado_proyecto.md` hito 13/05; `04_metricas.md` "Métricas acumuladas" |
| Google Ads Búsqueda | **253,23 EUR** | 20/07 a 08/08 | hecho_verificado, alta | `04_metricas.md`, tabla semanal |
| Google Ads Display | 6 a 8 EUR estimados | desde 05/08 | hecho_verificado (estimación propia del equipo), media | `04_metricas.md`, nota Display |
| Gasto Ads acumulado a 11/08 | ~490 EUR (4.698 impresiones, 476 clics) | 20/07 a 11/08 | hecho_verificado, alta | `02_tareas.md`, cabecera del 12/08 |
| Presupuesto Ads corriente | 20 EUR/día (~600 EUR/mes), congelado hasta 5-6 leads | desde 20/07 | hecho_verificado, alta | `03_decisiones.md` 20/07 y 09/08 |
| Costes de arranque (contrato 1.500, GDPR 300, objeto social 300, dominio/hosting 200, colchón 600) | 3.270 EUR **proyectados** | 2026 | dato_no_disponible como gasto real ejecutado | Solo constan como presupuesto en `business-plan-horizonte-dubai.html`, bloque 3. La ampliación de objeto social y el dominio sí se ejecutaron (`03_decisiones.md` 26/03 y 30/03) pero su coste real no está registrado en los archivos revisados |
| Total desembolso real consolidado del proyecto | **No existe** | | dato_no_disponible | Ningún archivo revisado consolida la inversión total (no hay P&L del proyecto). Mínimo verificable comprometido: 1.891,26 + ~490 = **~2.381 EUR**, sin contar notaría, dominio, herramientas ni horas propias |

**Resultados contra esa inversión:** 2 leads reales, 1 de ellos cualificado Tier B (8 puntos), 0 operaciones, 0 EUR de comisión (`04_metricas.md`, "Métricas acumuladas" y "Leads reales identificados"). El coste por lead a 08/08 era 126,61 EUR; a 11/08, ~245 EUR (`02_tareas.md`). La ficha del primer lead en `04_metricas.md` (líneas 150-151) contiene nombre, email y teléfono de una persona física: existe y no se reproduce aquí. La ficha del segundo lead está "pendiente de volcar" (mismo archivo): dato_no_disponible.

- **Hallazgo 5.1 (hecho_verificado, confianza alta, impacto alto).** El coste fijo de gestión (315,21 EUR/mes de Dayvo) es hoy superior al presupuesto que gestiona algunas semanas y representa más del 50% del coste total del canal. Con 2 leads, el coste completo del canal de pago (medios + gestión desde el 13/05) supera los 1.400 EUR por lead si se imputa la gestión devengada. Ese número no aparece calculado en ningún archivo del proyecto: las métricas internas solo computan el CPL de medios.
- **Hallazgo 5.2 (inferencia, confianza alta, impacto medio).** La relación riesgo-retorno declarada (comisión potencial de 15.000 a 25.000 EUR por operación, `01_estado_proyecto.md`) hace tolerable el CPL, pero ese cálculo asume una comisión que contractualmente solo existe para NH Collection y a un trigger mucho más tardío que el planificado. El unit economics real pactado por escrito hoy es: 3% de un solo proyecto, cobrable a los 10 días de una venta "completada y registrada" (`05_funnel.md`, "Cierre").

---

## 6. La deriva del contrato: del plan a la firma

Comparación entre lo que el plan definió como innegociable y lo que se firmó. Fuentes: `business-plan-horizonte-dubai.html` (sección "rrs" y bloque 1), `03_decisiones.md` (28/03, 13/04, 13/07), `05_funnel.md` ("Cierre"), `02_tareas.md` (RA-*).

| Término | Plan (mar-abr 2026) | Contrato real (13/07/2026) |
|---|---|---|
| Comisión | 4% (luego 2-3% en Fase 0, `01_estado_proyecto.md`) | **3%, solo NH Collection Al Marjan Island**; el resto exige confirmación escrita proyecto a proyecto |
| Trigger de cobro | Firma del SPA + primer pago al escrow ("condición no negociable"; "si no ceden: buscar alternativa") | **Venta completada y REGISTRADA**, pago a 10 días naturales del SPA y del pago inicial (`05_funnel.md`: "No es SPA + 20% como se asumía") |
| Tail | 18 meses (mínimo aceptable 12) | 36 meses de protección del lead (mejor que el plan; único término que salió reforzado) |
| Firmas | Contrato firmado antes de lanzar la web (acción obligatoria pre-lanzamiento, bloque 6 del BP) | RRS firmó el 13/07; **Propulse no ha contrafirmado** a 20/08 |
| Contraparte | RRS con licencia RERA | Firma RRS International Development FZ-LLC (RAK, fuera de RERA); las derivaciones van a RNR International Real Estate (RERA/ORN 16084), entidad distinta del mismo grupo, sin mención en el contrato (`02_tareas.md`, RRS-ENTIDAD, RERA cerrada) |

- **Hallazgo 6.1 (hecho_verificado, confianza alta, impacto alto).** El proyecto cruzó sus propias líneas rojas contractuales sin dejar constancia de una renegociación consciente: el trigger que el plan calificaba de "no negociable" se cedió, la comisión bajó del 4% a un 3% de alcance mínimo, y la decisión del 13/07 fue firmar "sin reabrir la negociación de términos" para no alargar un bloqueo de 90 días (`03_decisiones.md`, 13/07). Es una decisión defendible por coste de oportunidad, pero deja el modelo de ingresos en su versión más débil: un proyecto, trigger tardío, sin contrafirma.
- **Hallazgo 6.2 (hecho_verificado, confianza alta, impacto alto).** Dependencia extrema del partner: derivación obligatoria por email a dos direcciones del grupo Mirchandani con copia de pasaporte del lead, 5 días hábiles para aceptar o rechazar, silencio = aceptación (`05_funnel.md`, "Cierre"). El segundo partner (M32) está bloqueado (`02_tareas.md`, "Bloqueadas"). No existe plan B comercial: si RRS no responde, no hay negocio.
- **Hallazgo 6.3 (hecho_verificado, confianza media, impacto medio).** Riesgo de cobro señalado y sin cerrar: falta la trade licence de la free zone y la prueba de cuenta escrow registrada del proyecto NH Collection (`02_tareas.md`, RRS-DOCS). Con el trigger en "completed and registered", una escrow no registrada eleva el riesgo de no llegar nunca al evento de cobro.

---

## 7. Evaluación del modelo de negocio

### 7.1 Claridad y posicionamiento

- **Hallazgo 7.1 (hecho_verificado, confianza alta, impacto alto).** El posicionamiento declarado (portal especializado en español, "gap de mercado confirmado", `01_estado_proyecto.md`, Fase 0) es claro sobre el papel, pero la web no lo sustancia en la capa que más pesa en ticket alto: quién está detrás. La auditoría interna del 12/06 lo dice textualmente: "Se pide a un inversor que deje datos para una operación de 150.000 a 1.000.000+ EUR sin ver una sola persona, nombre, cara, credencial ni el nombre/licencia del partner RERA" (`AUDITORIA_INTEGRAL_2026-06-12.md`, sección A, riesgo 1; hallazgos A01-A03). Dos meses después, M17 sigue abierta (`02_tareas.md`).
- **Hallazgo 7.2 (hecho_verificado, confianza alta, impacto medio).** Incoherencia de mensaje multipaís: el discurso es España-céntrico (Modelo 720, IRPF, "lo que España ya no puede ofrecerte") mientras el formulario capta 11 países y la palanca de crecimiento declarada es México/LATAM (`AUDITORIA_INTEGRAL_2026-06-12.md`, A04; `02_tareas.md`, ADS-GEO). Al mexicano le mueven divisa y seguridad, no la comparativa fiscal española.
- **Hallazgo 7.3 (hecho_verificado, confianza alta, impacto medio).** El claim central de rentabilidad está desalineado en cuatro superficies: la web dice 6-12% desde el 24/07, el anuncio de Búsqueda dice 6-9%, el playbook de emails promete 7-8% neto "verificado" y el business plan usaba 6-8% (`02_tareas.md` ADS-CLAIM; `08_emails_playbook.md` A2/B5; `business-plan-horizonte-dubai.html`, prompt del hero). En un sector YMYL, esta dispersión es riesgo legal y de credibilidad a la vez.

### 7.2 Diferenciación real frente a la competencia

Evaluación del auditor (inferencia, confianza media, impacto alto), a partir de los activos verificados en el repo y las fuentes:

| Competidor | Su ventaja | Diferenciación real de Horizonte Emirates hoy |
|---|---|---|
| Agencias españolas especializadas en Dubái | Marca, equipo visible, casos publicados, oficina | **Ninguna visible.** Sin equipo público ni casos, Horizonte parece la opción menos fiable de la comparación |
| Brókeres en Emiratos con equipo hispano | Inventario real, presencia física, cierre directo | El acompañamiento en español lo dan igual; Horizonte solo aporta el filtro previo |
| Promotores en directo (Emaar, Damac, Binghatti) | Precio de lista idéntico, marca potente, sin intermediario aparente | El criterio independiente y la comparativa multi-promotor: es la única diferenciación estructural defendible, y los Investment Packs con material oficial (`03_decisiones.md`, 20/07 y 12/08) son su embrión |
| Portales (Property Finder, Bayut) | Volumen de inventario e indexación masiva | Horizonte no compite en inventario; compite en curación. Correcto no intentarlo |
| Asesores patrimoniales | Relación de confianza previa con el cliente | Ninguna hoy; el canal LinkedIn diseñado ("el criterio, no el catálogo") apunta ahí pero no está publicado |

La diferenciación defendible existe en potencia (curación documentada + fiscalidad España-UAE explicada con fuentes + transparencia de comisiones) pero no está hoy en la superficie pública de forma creíble porque le falta la capa humana y la prueba.

### 7.3 Segmentación: los 4 tramos de capital

- **Hallazgo 7.4 (hecho_verificado + inferencia, confianza alta, impacto medio).** Los 4 tramos (150-300k, 300-600k, 600k-1M, +1M) existen en el formulario (`public\index.html`, líneas 478-494, con la quinta opción sub-150k añadida el 12/08) y ordenan el encargo de Investment Packs (2 por franja, memoria del proyecto). **Veredicto: útiles como variable de scoring y de matching de producto, artificiales como segmentación de marketing.** No hay mensajes, canales, journeys ni ofertas distintas por tramo: los emails solo distinguen 3 tiers de temperatura (`08_emails_playbook.md`) y la web habla a todos igual. La segmentación accionable era la del business plan original, por motivación (rentabilidad / relocalización / patrimonialista, bloque 2), que quedó abandonada de facto: define canal, mensaje y ciclo de decisión, cosas que un rango de capital no define. El único lead cualificado real (Tier B, 150-300k, objetivo alquiler, `04_metricas.md`) encaja exactamente en el "Segmento B Rentabilidad" del plan original.

### 7.4 Modelo de ingresos

- Ya evaluado en la sección 6: la promesa de ingresos (15.000-25.000 EUR por operación) descansa sobre un contrato a medio firmar que cubre un solo proyecto con trigger tardío. Riesgo de concentración (partner único) reconocido en el propio roadmap (M32) y sin resolver.
- **Hallazgo 7.5 (inferencia, confianza alta, impacto alto).** Existe una desproporción estructural entre ambición y músculo: se persigue un negocio proyectado en cientos de miles de euros con ~600 EUR/mes de medios en un solo país y un solo canal activo. Incluso con la conversión del sector (2-5%), 22 clics/día dan 0,4 a 1,1 leads/día en el mejor de los casos; el problema de volumen estaba aritméticamente garantizado desde el diseño de la campaña.

### 7.5 Credibilidad de las promesas (playbook de emails)

- **Hallazgo 7.6 (hecho_verificado, confianza alta, impacto alto).** El playbook de emails (`08_emails_playbook.md`, fechado 16/04/2026 y no revisado desde entonces) contiene afirmaciones no sustanciadas que contradicen la disciplina YMYL aplicada a la web desde el 08/06 (M40, claims matizados):
  - "El 45% de quienes visitan Dubai en persona cierran operación" (emails A4 y B4, y asunto del A4). No hay fuente en ningún archivo del proyecto.
  - "Caso real: inversor español con 200.000 EUR" con proyecciones concretas (7,2% neto, +18-22%) (email C4). El proyecto tiene 0 operaciones cerradas: no puede existir ese caso propio. El disclaimer final ("datos orientativos") no salva que el asunto diga "caso real".
  - "Rentabilidades netas verificadas", "activos verificados en cartera", "tenemos disponibilidad confirmada esta semana" (A1, A2, B5) sin inventario propio ni verificación documentada.
  - "Recibirá antes de 24 horas: mínimo 3 propiedades seleccionadas" (A1): promesa de SLA que depende de una operación manual de una sola persona.
  - Estos textos son los que reciben los leads reales hoy (envío manual con este kit, `automation\MAILS-MANUALES.md`). La web se endureció (M40) y los emails no: la cara privada del funnel quedó fuera de la disciplina de claims.

### 7.6 Capacidad operativa real

- **Hallazgo 7.7 (hecho_verificado, confianza alta, impacto alto).** El plan decía "Jesús no atiende leads" e "invisible ante el lead" con 10-12 h semanales (`business-plan-horizonte-dubai.html`, resumen ejecutivo). La realidad es la contraria: las secuencias automáticas están cortadas (`automation\horizonte-emails.gs`, línea 61, `AUTO_SEND_LEADS: false`) y cada lead lo contacta Jesús a mano (`04_metricas.md`: "Ambos contactados a mano según el kit de correos manuales"). La atención comercial del negocio es una persona, en manual, con un partner cuyo protocolo de derivación (RA-PROTOCOLO) aún no está montado. Horas reales dedicadas: dato_no_disponible en los archivos de esta área (el diario de actividad las documentaría; fuera del alcance de este bloque).
- **Hallazgo 7.8 (hecho_verificado, confianza media, impacto medio).** El propio proyecto reconoce que "con leads reales entrando, el tiempo de respuesta pasa a pesar tanto como la captación" (`01_estado_proyecto.md`, lectura COO) y fija compromisos de SLA (<2h Tier A en `08_emails_playbook.md`; <4h en el playbook de LinkedIn) que nadie puede garantizar hoy en modo manual unipersonal.

---

## 8. Síntesis final orientada a decisión

### Cliente ideal prioritario (inferencia, confianza alta)
Residente fiscal en España, 35-55 años, con 150.000-400.000 EUR de capital, motivado por rentabilidad de alquiler y hartazgo del marco español (el "Segmento B" del plan original). Es el segmento con el que el canal ya ha demostrado resonancia: el único lead cualificado real es exactamente ese perfil (Tier B, 150-300k, objetivo alquiler, `04_metricas.md`), y los términos de búsqueda que convierten son residenciales de ese rango ("pisos dubai", "comprar piso en dubai"). México/LATAM es la apuesta de volumen razonable pero aún sin validar (ADS-GEO abierta): tratarlo como hipótesis, no como segundo segmento consolidado.

### Problema principal
Del cliente: "quiero invertir en Dubái desde España y no me fío de nadie ni sé por dónde empezar en mi idioma". Del negocio: no le llega volumen (demanda de búsqueda mínima en España + un solo canal + un solo país) y, cuando le llega, pide un acto de fe (dejar datos de patrimonio a una web sin personas visibles ni casos).

### Propuesta de valor recomendada
"Análisis documentado y acompañamiento en español para invertir en inmuebles de Emiratos: te entregamos una comparativa con datos oficiales del promotor, te explicamos tu fiscalidad España-UAE con fuentes, y no te cobramos nada porque cobramos del promotor, y te lo decimos". Los tres ingredientes ya existen (Investment Packs, guía fiscal, modelo de comisión); falta empaquetarlos como promesa central y ponerles cara.

### Razones para creer (las reales, sin inventar)
1. Grupo partner licenciado y verificable: RERA/ORN 16084, verificado en Property Finder y Bayut (`02_tareas.md`, tarea RERA cerrada el 21/07). Publicarlo.
2. Investment Packs con material oficial del promotor y disciplina de "sin material oficial no se publica" (`03_decisiones.md`, 12/08).
3. Identificación registral completa de Propulse SLU en la web (M14 cerrada, `ROADMAP_AUDITORIA.md`).
4. Guía fiscal propia con fuentes y disclaimers (M19 cerrada).
5. Transparencia del modelo de cobro (el bloque "cómo ganamos dinero" propuesto en `AUDITORIA_INTEGRAL_2026-06-12.md`, sección E, aún sin publicar).
Lo que NO es hoy una razón para creer y no debe usarse: cierres, casos propios, testimonios (no existen).

### Diferenciación defendible
Curación independiente documentada (packs multi-promotor con datos oficiales) + puente fiscal España-UAE en español con fuentes + estructura europea identificable (Propulse SLU, RGPD, consentimiento). Es defendible porque exige un trabajo documental que ni el bróker ni el promotor hacen en español. No es defendible: "acceso" (no hay inventario propio), "rentabilidades verificadas" (no hay verificación), velocidad (operación manual unipersonal).

### Mensajes que deberían eliminarse (con ubicación exacta)
1. "Más del 45% de quienes visitan Dubai cierran operación": `08_emails_playbook.md`, emails A4 (asunto B y cuerpo) y B4. Sin fuente.
2. "Caso real" C4 completo: `08_emails_playbook.md`. No existe ninguna operación propia; reescribir como escenario hipotético o eliminar.
3. "Rentabilidades netas verificadas" y "activos verificados en cartera": `08_emails_playbook.md`, A1 y A2.
4. "Tenemos disponibilidad confirmada esta semana" y "los mejores activos se mueven en días": `08_emails_playbook.md`, B5 y A3 (urgencia sin inventario real).
5. "Recibirá antes de 24 horas mínimo 3 propiedades": `08_emails_playbook.md`, A1; sustituir por un plazo que la operación manual pueda cumplir.
6. La rentabilidad "6-9%" del anuncio frente al 6-12% de la web: `02_tareas.md`, ADS-CLAIM; unificar a una sola cifra con fuente en todas las superficies (web, anuncios, emails, packs).
7. "Ventana de apreciación 20-35% antes del Wynn" como certeza: `08_emails_playbook.md` C5 y web (A10 en `AUDITORIA_INTEGRAL_2026-06-12.md`); expresar como escenario con fuente.
8. El tono absoluto "España limita, Dubai lo resuelve" (A09 de la auditoría integral) si se quiere posicionamiento premium institucional.

### La decisión que esta área eleva al comité
El proyecto no tiene un problema de ejecución técnica ni de coste por lead; tiene tres huecos de negocio que ninguna optimización de campaña resuelve: (1) contrato sin cerrar que deja el 86% del catálogo sin comisión pactada, (2) volumen estructuralmente insuficiente con un solo canal y un solo país, y (3) déficit de confianza pública para el ticket que pide. Las tres soluciones están ya identificadas y aprobadas internamente (RA-FIRMA/RA-ANEXO, ADS-GEO/CANAL-2, M17/A01-A03) desde hace semanas. La auditoría no necesita proponer acciones nuevas: necesita que se ejecuten las que llevan más de 30 días aprobadas.

---

## 9. Archivos revisados

Todos abiertos y leídos íntegramente salvo indicación:

1. `G:\Mi unidad\Horizonte Emirates\01_estado_proyecto.md` (última actualización 09/08/2026)
2. `G:\Mi unidad\Horizonte Emirates\02_tareas.md` (última actualización 12/08/2026)
3. `G:\Mi unidad\Horizonte Emirates\03_decisiones.md` (hasta el 12/08/2026)
4. `G:\Mi unidad\Horizonte Emirates\04_metricas.md` (última revisión 09/08/2026)
5. `G:\Mi unidad\Horizonte Emirates\05_funnel.md` (actualizado 09/08/2026)
6. `G:\Mi unidad\Horizonte Emirates\08_emails_playbook.md` (16/04/2026)
7. `G:\Mi unidad\Horizonte Emirates\business-plan-horizonte-dubai.html` (1.279 líneas, leído completo)
8. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\README.md`
9. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\ROADMAP_AUDITORIA.md` (última actualización 21/07/2026)
10. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\AUDITORIA_INTEGRAL_2026-06-12.md`
11. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\docs\SEO_ESTRATEGIA.md` (parte estratégica, secciones 1-3, 5-10)
12. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\database\projects_master_schema.md`
13. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\public\index.html` (solo verificación puntual de los tramos de capital, líneas 478-494)
14. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\automation\horizonte-emails.gs`, `automation\SETUP.md`, `automation\MAILS-MANUALES.md` (solo verificación puntual de `AUTO_SEND_LEADS`)

## 10. Archivos NO abiertos (relevantes para contrastar, fuera del alcance asignado)

- `G:\Mi unidad\Horizonte Emirates\06_contrato_rrs.md` (los términos del contrato se citan aquí a través de 01/02/05; el detalle primario no se ha leído)
- `G:\Mi unidad\Horizonte Emirates\07_diario.md` (horas y sustancia de actividad)
- `G:\Mi unidad\Horizonte Emirates\09_linkedin_estrategia.md`, `09b`, `09c` y `LinkedIn\GUIA_ARRANQUE.md`
- El PDF del Referral Agreement firmado
- Paneles en vivo de Google Ads / GA4 (los datos usados son los volcados en `04_metricas.md` y `02_tareas.md`)
- Datos personales: la ficha del lead 1 en `04_metricas.md` (líneas 150-151) contiene nombre, email y teléfono; se deja constancia de su existencia y ubicación sin reproducirlos.
