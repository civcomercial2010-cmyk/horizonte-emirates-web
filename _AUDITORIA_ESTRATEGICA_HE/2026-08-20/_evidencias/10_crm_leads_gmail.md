# Evidencia 10: CRM de leads, Gmail y conversaciones con Dayvo

Fecha de la verificación: 20-08-2026. Fuentes primarias consultadas en vivo: hoja de cálculo "HE CRM - Leads" (el nombre real del archivo lleva guion largo) (Google Sheets, id 133X4oyXfvAusuhvme7eYISNPfSZ1N0BkIt3oq1WKxXc, modificada por última vez el 12-08-2026), buzón hola@horizonteemirates.com / civcomercial2010@gmail.com (búsquedas de Gmail) e hilos de correo con Dayvo. Todo lo que sigue es hecho verificado salvo indicación contraria.

## 1. El CRM completo: 9 registros históricos, de los que solo 2 o 3 son leads reales

Contenido íntegro de la hoja "Leads" a 20-08-2026:

| ID | Nombre | Fecha | Capital | Tier | Estado | ¿Real? |
|---|---|---|---|---|---|---|
| L72234884 | jesus prueba auditoria (jesus@propulse.ad) | 06-06-2026 | +1M | A | activo | NO, prueba del propio Jesús |
| L75768485 | Marc Nonn Sav (mnonnsav@gmail.com, tel +971...) | 28-06-2026 | 300k-600k | A | activo | NO, es Marc del socio RRS probando (mismo teléfono que el registro siguiente) |
| L76473593 | Marc Nonn (marc@rnr-realestate.com) | 28-06-2026 | 150k-300k | A | activo | NO, correo corporativo del socio RRS |
| L59475583 | Sara (hotmail, tel +376 de Andorra) | 18-07-2026 | 150k-300k | B | activo | Dudoso: teléfono andorrano, entorno cercano probable. Sin gclid |
| L16558980 | Raul Dayvo (r.fernandezm@dayvo.com) | 21-07-2026 | 150k-300k | A | activo | NO, es el gestor de la agencia SEM probando |
| L21874911 | Jose Diaz mellado (gmail, España) | 29-07-2026 | 150k-300k | B | baja | SÍ. Con gclid de Google Ads, utm v2-2026-07 |
| L13673836 | Raul (r.fernandezmdayvo@gmail.com) | 30-07-2026 | 150k-300k | A | activo | NO, segunda prueba de Dayvo con gmail personal |
| L77479987 | Sergio (gmail, España) | 04-08-2026 | 150k-300k | B | activo | SÍ. Con gclid de Google Ads, utm v2-2026-07 |
| L33875141 | Jesus prueba whasap | 12-08-2026 | (sin perfil) | C | activo | NO, prueba del propio Jesús tras las correcciones del 12-08 |

Lecturas directas:

- **Leads reales de pago en toda la historia del proyecto: 2** (Jose Diaz, 29-jul; Sergio, 4-ago). Ambos del tramo mínimo (150-300k), objetivo alquiler/revalorización, tier B.
- **Ni un solo formulario real desde el 4 de agosto** (16 días a fecha de auditoría), incluidos los 8 días posteriores a las correcciones de conversión del 12-08. Verificado doblemente: búsqueda en Gmail de avisos de Web3Forms posteriores al 05-08 (solo aparecen las 2 pruebas internas del 12-08) y los informes del guardián (ver punto 4).
- Las pruebas internas (Jesús, Marc, Dayvo) figuran como "activo" tier A y contaminan el CRM: cualquier métrica agregada sobre esa hoja sobreestima el rendimiento.
- Los estados solo distinguen "activo" y "baja". El lead perdido (Jose Diaz) no tiene motivo de pérdida registrado. No hay campos de reunión, propuesta ni etapa de pipeline.

## 2. Seguimiento comercial real de los 2 leads verdaderos (hilos de Gmail)

### Jose Diaz (llegó el 29-07 a las 12:44)

| Fecha | Qué pasó |
|---|---|
| 29-07 12:44 | Acuse automático "hemos recibido su consulta" (secuencia B1) |
| 30-07 14:59 | Correo personal de Jesús con el planteamiento (con copia oculta a Marc de RRS) |
| 01-08 08:07 | Correo de Jesús: "me consta que Marc le contactó por whatsapp", pide aclarar objetivos |
| 01-08 09:02 | **El lead responde: "dime hora y día de la semana que viene y hacemos la videollamada"** |
| 01-08 11:34 | Jesús: "le escribe Marc por whatsapp y coordinan agendas. Intentaré estar" |
| 01-08 11:36 | El lead: "Ok!!" |
| Después | **Nada más en el correo. En el CRM figura "baja" sin motivo.** |

Es decir: el único lead caliente del proyecto (pidió expresamente una videollamada) se traspasó a WhatsApp de Marc y desapareció del sistema. No hay registro de si la videollamada se celebró, de qué se habló ni de por qué se dio de baja. Hecho verificado en el correo; el desenlace exacto es dato no disponible (pudo perderse en WhatsApp, fuera de toda trazabilidad).

### Sergio (llegó el 04-08 a las 23:04)

| Fecha | Qué pasó |
|---|---|
| 04-08 23:04 | Acuse automático (W0) |
| 05-08 07:23 | Correo personal de Jesús (bcc a Marc): planteamiento de trabajo |
| 07-08 06:48 | Segundo correo de Jesús proponiendo huecos concretos (lunes 10 o miércoles 12) |
| Después | **Sin respuesta del lead y sin ningún contacto posterior. 13 días de silencio a fecha de auditoría.** |

Su secuencia automática (B1 a B7) está entera en "pausado-manual" en la hoja Cola. El corte de los envíos automáticos del 30-07 (AUTO_SEND_LEADS=false) dejó a este lead sin los toques 3, 4, 5, 6 y 7 y nadie los ha sustituido a mano. La cadencia comprometida al cortar el automatismo (kit de mails manuales) no se está ejecutando.

### La cola de seguimiento en general

La hoja "Cola" muestra: secuencias completas enviadas a las pruebas internas de junio y julio (cuando el automatismo estaba activo), y todo "pausado-manual" desde el 30-07. Sara (lead dudoso del 18-07) tiene B6 y B7 en "pendiente" desde el 07-08: tampoco se enviaron.

## 3. Google Ads: números reales y cronología de la campaña (hilos con Dayvo)

### Balance escrito por Jesús a Dayvo el 09-08 (hilo "Estado proyecto")

Del 20-07 al 08-08 (campaña de Búsqueda, unos 20 EUR/día):

| Métrica | Valor |
|---|---|
| Impresiones | 2.419 |
| Clics | 252 |
| CTR | 10,42% |
| CPC medio | 1,00 EUR |
| Inversión | 253,23 EUR |
| Leads reales | 2 |
| CPL | 126,61 EUR |

Datos adicionales del mismo hilo (hechos verificados, escritos por las dos partes):

- Las 2 conversiones vinieron de los términos "pisos dubai" y "altamira dubai".
- La cuenta tenía **25 keywords en un único grupo de anuncios** mezclando intención de compra e intención de inversión (hasta el 13-08, en que se separó en 2 grupos).
- **Experiencia de página de destino "por debajo de la media" en casi todas las keywords** (salvo "inversion inmobiliaria en dubai").
- Expansión de URL final, AI Max y personalización de texto estaban activas; el 96% de los clics aterrizaba en la home.
- Enlaces de sitio al formulario: /index.html#form 1.473 impresiones y 0 clics; /#form 1.254 impresiones y 0 clics.
- Un anuncio estuvo rechazado por política entre el 01-08 y el 04-08 (de solo 2 anuncios activos).
- Un anuncio publicaba "rentabilidad bruta por alquiler estimada del 6-9% anual" desalineado con la web (6-12%); corregido hacia el 13-08.

### Display: decisión del 05-08 y resultado (hilo "Display mal")

- 05-08: Jesús aprueba crear campaña de Display ("Ok, perfecto. Ejecuta el display"); Dayvo la publica el 06-08 repartiendo el presupuesto existente; empieza a servir de verdad hacia el 10/13-08.
- Datos del 10-08 al 16-08 escritos por Jesús con capturas: **Google Ads 2.700 clics, 31.000 impresiones, CPC 0,05 EUR, 143 EUR; Analytics solo 76 sesiones de google/cpc; leads 0**. El propio Jesús diagnostica clics accidentales en aplicaciones móviles que se cobran pero no cargan la página.
- 19-08, respuesta de Dayvo: confirma que "una parte importante de la inversión de Display se ha destinado a aplicaciones móviles"; retira las apps como emplazamiento pero **se niega a pausar Display** y a subir presupuesto. Aporta dos datos clave de Búsqueda: **pérdida de impresiones por presupuesto 11,13% y pérdida por clasificación (ranking) 60,57%**; Quality Score aproximado 7/10 en el grupo de inversión y 5/10 en el de pisos, con la relevancia del anuncio y la experiencia de landing como puntos débiles.
- A fecha de auditoría (20-08) **Display sigue activa** y la decisión de pausarla está sin cerrar.

### Lectura del auditor (inferencias, confianza alta)

1. El mercado de búsqueda activo en España para estas keywords es minúsculo con esta configuración: unas 120 impresiones diarias servidas, y aun ganando el 60% de impresiones perdidas por ranking hablaríamos de unas 300 al día. El techo físico de leads con solo esta campaña es de 5 a 8 al mes en el mejor de los casos.
2. Durante las 3 primeras semanas de campaña (20-07 a 12-08) el tráfico pagado aterrizó en una web con el botón de envío móvil roto y conversión medida del 0,42%. La campaña pagó por un funnel averiado durante el 75% de su vida.
3. Desde el 06-08 el presupuesto se diluyó en Display basura justo cuando Búsqueda seguía limitada por presupuesto: resultado, cero leads desde el 04-08.
4. El CPL de 126,61 EUR de Búsqueda es asumible para el ticket; el problema no es el precio del lead sino el volumen y la fiabilidad del sistema que lo recibe.

## 4. El guardián del funnel funciona y confirma el silencio

Informes automáticos cada 2 días ([Guardian HE], remitente el propio Gmail, verificados del 22-07 al 20-08): el del 20-08 dice "Avisos de Web3Forms revisados: 0, Leads correctos en el CRM: 0, Leads PERDIDOS: 0" en los últimos 5 días. Serie completa de agosto: 02-08 (2 leads en 5 días), 04-08 (1), 06-08 (1), 08-08 (1), 10-08 (0), 12-08 (0), 14-08 (1, es la prueba interna), 16-08 (1, prueba), 18-08 (0), 20-08 (0). El sistema técnico de captura está sano; lo que no llega es caudal.

## 5. Implicaciones directas para el diagnóstico

- La cifra "2 leads en 30 días" es correcta y además generosa: son 2 leads reales en TODA la vida del proyecto por vía de pago, y 0 en los últimos 16 días.
- No hay evidencia de leads perdidos por fallo técnico en este periodo (guardián en verde). El cuello de botella ya no es la captura: es el caudal de tráfico cualificado y, aguas abajo, la continuidad comercial (lead caliente perdido sin motivo registrado, lead tibio abandonado a los 2 toques, secuencias pausadas sin sustituto manual).
- Existe una discrepancia de medición pendiente de resolver en GA4/Ads por el tráfico fantasma de Display (2.700 clics frente a 76 sesiones), que contaminará cualquier lectura de agosto si no se anota o excluye.
