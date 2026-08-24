# 01 · Diagnóstico ejecutivo

**Auditoría integral Horizonte Emirates · 20-08-2026**
Detalle y evidencia: `02_AUDITORIA_COMPLETA.md` y `_evidencias\`. Plan: `04_PLAN_RECUPERACION_90_DIAS.md` y `05_MATRIZ_ACCIONES.csv`.

---

## Veredicto general

Horizonte Emirates no tiene un problema de calidad de ejecución técnica: tiene un problema de **dirección del esfuerzo y de caudal**. El proyecto ha construido en 5 meses una infraestructura (web, funnel, packs, contenidos, automatización, cumplimiento) muy por encima de lo que su fase comercial justifica, y la ha puesto a trabajar sobre un canal único (Búsqueda en España a 20 EUR/día) cuyo techo físico son 5-8 leads/mes en el mejor de los casos, con una landing que estuvo averiada el 75% del periodo de campaña, una medición rota durante toda ella, y una capa de confianza (cero caras, cero licencia publicada, cero casos) impropia del ticket de 150.000 a 1.000.000 EUR que se pide. Los "2 leads en 30 días" no son una anomalía: son la salida esperable de ese sistema. Y son, además, los 2 únicos leads reales de pago de toda la historia del proyecto, con 16 días consecutivos a cero desde el 04-08, coincidiendo con la dilución del presupuesto en una campaña de Display que compra clics accidentales en aplicaciones móviles y que sigue activa hoy.

La buena noticia, igual de respaldada por la evidencia: el canal convierte (2 leads con gclid a CPL asumible incluso con todo roto), la materia prima comercial es abundante y de calidad (12 proyectos con material oficial, 10 memorándums generados), el sistema de captura es robusto, y casi todas las correcciones necesarias ya están identificadas y aprobadas en los propios documentos del proyecto. Lo que falta no es análisis: es ejecutar lo comercial con la misma disciplina con la que se ha ejecutado lo técnico.

## Los 10 hallazgos más importantes

| # | Hallazgo | Tipo · Confianza |
|---|---|---|
| H1 | **Techo estructural de volumen**: 2.419 impresiones en 20 días de Búsqueda (~120/día), 60,57% de impresiones perdidas por ranking, campaña "limitada por presupuesto" en un solo país y canal. El business plan asumía 35 leads/mes sin ninguna fuente que pudiera producirlos | HV · alta |
| H2 | **La campaña pagó tráfico hacia un funnel averiado**: botón de envío muerto en móvil (85% del tráfico), modal de WhatsApp roto desde el 27-07 y banner tapando el CTA, del 20-07 al 12-08. Conversión medida: 0,42% frente al 2-5% estándar | HV · alta |
| H3 | **La medición estuvo rota durante TODA la campaña**: la CSP bloqueó el endpoint raíz de GA4 y el conversion linker de Ads desde antes del arranque hasta el 19-08 a las 17:01; el embudo intermedio fue ficticio hasta el 12-08; las conversiones de Ads están infladas 2,5x. No existe todavía ni un día registrado con medición sana: la primera ventana limpia empieza el 20-08 | HV · alta |
| H4 | **Display quema el presupuesto desde el 06-08**: 2.700 clics a 0,05 EUR y solo 76 sesiones (clics accidentales en apps, confirmado por Dayvo), 143 EUR en una semana, 0 leads desde su activación. Dayvo retiró las apps pero se negó a pausarla y sigue activa | HV · alta |
| H5 | **Cero identidad y cero prueba social** en toda la web: sin nombres, fotos, licencia RERA del partner (verificada internamente y no publicada) ni operaciones; la página de equipo redirige a la home. Es el mayor freno de conversión para el ticket pedido | HV · alta |
| H6 | **El único lead caliente se perdió sin registro**: Jose Diaz pidió videollamada el 01-08, se traspasó al WhatsApp de Marc y figura "baja" sin motivo; el otro lead real (Sergio) lleva 13 días sin contacto con su secuencia pausada a mano. Tras el acuse automático no hay ninguna red de seguimiento | HV · alta |
| H7 | **Se paga tráfico hacia 7 proyectos de los que 6 no tienen comisión pactada por escrito**; la contrafirma del contrato se envió el 27-07 por una vía frágil y RRS lleva 24 días sin responder; las derivaciones reales incumplen la cláusula que protege el derecho a cobrar | HV · alta |
| H8 | **El hero promete lo que la cartera no tiene**: "lista para alquilar" (todo es preventa 2027-2029), "desde 30.000€ de entrada" (mínimo real 242.000€ de precio, sin nada a 150k) y "36 meses tras la entrega" sin respaldo. Y los memorándums (el mejor material de conversión) son invisibles en la web | HV · alta |
| H9 | **71% del esfuerzo registrado (256,5 h) fue construcción; 0 horas de venta activa con leads**; el diario se detuvo el 30-07 justo cuando empezó lo crítico; la alerta de sequía de leads está apagada; el CRM está contaminado con 6 pruebas internas y las simulaciones de los packs son inconsistentes entre sí (dos contradicen su propio texto) | HV · alta |
| H10 | **Activos valiosos parados**: playbook de LinkedIn completo sin ejecutar (bloqueado en el paso 2 desde el 30-07), 16 artículos congelados sin medición de orgánico, guía fiscal cuyas descargas nadie trabaja, retargeting Meta aprobado el 30-07 y sin montar, México sin validar (10 minutos de Planificador) desde el 30-07 | HV · alta |

## Las 3 causas raíz

1. **CR-1 · Volumen imposible por diseño**: un solo canal, un solo país, 20 EUR/día contra una demanda de búsqueda mínima. Ninguna optimización de landing arregla que solo entren ~120 impresiones al día.
2. **CR-2 · Confianza insuficiente para el ticket**: anonimato total más claims agresivos más producto opaco (4 de 7 sin precio). El poco tráfico que llega no tiene razones verificables para dejar sus datos.
3. **CR-3 · El sistema optimiza la fábrica y no la venta**: la energía va a construir y auditar lo controlable; lo incierto (contrato, seguimiento, segundo canal, prueba social) se aplaza. La medición rota impidió además ver el problema a tiempo.

## 5 decisiones que deben tomarse (esta semana)

| # | Decisión | Criterio |
|---|---|---|
| D1 | **Pausar Display hoy** y devolver el 100% del presupuesto a Búsqueda. Si Dayvo insiste en mantenerla, imponerla como cliente: el dato ya existe (2.700 clics, 76 sesiones, 0 leads) | El coste de esperar es seguro; el beneficio de esperar es una hipótesis de la agencia |
| D2 | **Congelar la web 14 días** (hero incluido) para tener la primera ventana de medición limpia de la historia del proyecto (20-08 a 03-09), con las excepciones de la fase 72 h (identidad y coherencia del hero, un solo despliegue) | Sin ventana limpia, la decisión de canal del día 30 volverá a tomarse a ciegas |
| D3 | **Cerrar el papel con RRS o dejar de invertir en su catálogo**: reenvío formal por el canal contractual, acuse de la contrafirma, Anexo I (comisiones de los 6 proyectos) y Anexo II (datos), y derivaciones formales desde ya. Fecha límite interna: 05-09 | No se escala captación hacia productos sin comisión pactada |
| D4 | **Publicar identidad**: nombres y fotos de Jesús y Marc, licencia RERA/ORN 16084 enlazada al registro público, y un memorándum de muestra visible. Es reversible y ataca el freno número 1 de conversión | La página existió y se retiró; la licencia está verificada desde el 21-07 |
| D5 | **Abrir la segunda fuente de volumen en 14 días**: validar México en el Planificador (10 minutos, pendiente desde el 30-07) y montar el retargeting de Meta sobre los clics ya pagados. Decidir con datos el día 30 si Search España sigue siendo canal principal o pasa a ser uno de tres | CR-1 no se arregla optimizando el canal actual |

## 5 acciones inmediatas (72 horas, detalle en el plan)

1. **A-101**: Pausar la campaña de Display (D1) y pedir a Dayvo el informe de emplazamientos y la exportación semanal a `ads-export\`.
2. **A-102**: Verificar en la consola de Ads la importación de conversiones GA4 (es el único camino de conversión y nunca se ha verificado) y desmarcar los eventos fantasma.
3. **A-103**: Rescatar a los leads vivos: reactivar a Sergio (toque 3 hoy), averiguar y registrar el desenlace de Jose Diaz con Marc, y trabajar la lista de descargas de la guía.
4. **A-104**: Encender la alerta de sequía (EXPECT_TRAFFIC=true), corregir el detector de bajas por subcadena ("trabaja" = baja) y repegar el .gs en Apps Script.
5. **A-105**: Coherencia mínima del hero (quitar "lista para alquilar" y "desde 30.000€") y publicar el bloque de identidad y licencia (D4). Un solo despliegue, y después congelación (D2).

## Qué detener, mantener y reconstruir

- **Detener:** campaña de Display; cambios diarios de hero y copy; producción de nuevos packs y de infraestructura nueva (matching, Telegram, más automatización) hasta tener 10 leads/mes; el envío de los emails con cifras no conformes si se reactivara el automatismo.
- **Mantener:** campaña de Búsqueda (estructura post 13-08) sin subir presupuesto; el kit manual de correos (con vigilancia); el guardián; el lead magnet fiscal (con validación profesional); el motor de packs (corrigiendo simulaciones); el cumplimiento RGPD.
- **Reconstruir:** la capa de confianza de la web (identidad, licencia, memorándum de muestra); el proceso de seguimiento comercial (estados, SLA vigilado, motivos de pérdida); el gobierno de datos del canal (exportaciones archivadas, una sola fuente de verdad de conversiones); la relación contractual con RRS (papel completo o renegociación).

## Objetivo realista

- **30 días (20-09):** primera ventana limpia medida y archivada; Display pausada; 6-10 leads en el mes con Búsqueda a pleno presupuesto más retargeting Meta y, si el Planificador lo avala, test de México; 2 leads vivos rescatados con desenlace registrado; contrato con acuse y anexos en firma o decisión de renegociar; identidad publicada. Conversión web objetivo: ≥1,5% clic a lead en la ventana limpia.
- **90 días (20-11):** 15-25 leads/mes con 2-3 fuentes activas; 4-8 videollamadas/mes celebradas y registradas; 1-2 reservas en curso; CPL de Búsqueda ≤80 EUR; pipeline con estados y motivos de pérdida operativo; primera decisión de escala (subir a 30-40 EUR/día) tomada con datos limpios.

Si en el día 45 no hay al menos 8 leads/mes de ritmo y 2 videollamadas celebradas, el problema ya no será el sistema sino el mercado del canal, y tocará replantear el mix (LinkedIn outbound, webinar, partnerships) antes de gastar un euro más en Search España.

## Nivel de confianza global del análisis

**Alto en el diagnóstico** (los hechos centrales están verificados en fuentes primarias: CRM en vivo, Gmail, código, git, contratos y PDFs firmados; las 10 evidencias citan ruta y línea). **Medio en las estimaciones prospectivas** (techos de volumen y objetivos: dependen de datos que el proyecto aún no archiva, D-01 a D-10). La principal reserva: ninguna métrica web del periodo es fiable por los 3 regímenes de medición, así que las tasas de conversión históricas son cotas inferiores, no valores exactos.
