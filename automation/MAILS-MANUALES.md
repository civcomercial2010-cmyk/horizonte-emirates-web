# Kit de correos manuales · Horizonte Emirates

**Estado:** activo desde el 30-jul-2026. Sustituye al envío automático de secuencias.
**Motivo:** volumen bajo de leads. Cada uno se trabaja a mano, 1:1, con el objetivo único de
conseguir una videollamada de 20 a 30 minutos con Marc.

El motor `horizonte-emails.gs` sigue haciendo su trabajo silencioso: registra el lead en el CRM,
puntúa el tier y avisa al asesor. Lo que ya no hace es escribir al lead. Eso se hace desde aquí.

- Interruptor: `CONFIG.AUTO_SEND_LEADS = false` en `automation/horizonte-emails.gs`.
- Para reactivar la automatización algún día: ponerlo en `true` y ejecutar `reanudarEnvioAutomatico()`.

---

## 0. Cómo se usa (4 pasos, 6 minutos por lead)

1. **Llega el aviso** `[LEAD A|11pts] Nombre · País · Capital · L12345678` al correo, en negrita y destacado.
   Trae la ficha completa, el guion recomendado y un botón de WhatsApp con el mensaje ya escrito.
2. **Se elige el M1** según el tier del asunto: A, B o C (apartado 4).
3. **Se insertan los bloques** que correspondan a lo que el lead marcó en el formulario (apartado 5).
   Cada correo M1 lleva señalado dónde va cada bloque.
4. **Se envía desde Gmail** con `hola@horizonteemirates.com`, en texto normal, sin plantilla de marca.
   Si el lead pidió WhatsApp o llamada, se manda además la línea corta del apartado 8, nunca antes del correo.

**Ritmo por tier** (lo indica también el aviso):

| Tier | Puntos | Primer contacto | Canal | Insistencia |
|---|---|---|---|---|
| A | 9 a 13 | Menos de 1 hora | Correo M1-A y WhatsApp inmediatamente después | Hasta 4 toques en 10 días |
| B | 6 a 8 | Mismo día | Correo M1-B, WhatsApp solo si no responde en 24 h | Hasta 3 toques en 15 días |
| C | 0 a 5 | Menos de 24 horas | Solo correo M1-C | 2 toques y a reactivación trimestral |

---

## 1. Reglas que no se rompen

**Cifras y promesas**

- Rentabilidad por alquiler: **6 a 12 % bruto anual estimado**. Nunca "neto", nunca garantizado.
  Es el rango que sostiene la web con fuentes (JLL, Knight Frank, DLD). No inventar porcentajes por proyecto.
- Comparativa España: 3 a 5 % bruto. Es la cifra publicada en la home.
- Plusvalías y proyectos concretos (RAK, Wynn, off-plan): siempre "escenarios orientativos" y
  "sin resultados garantizados". Jamás un número cerrado sin esa coletilla.
- Fiscalidad: los EAU no gravan las rentas de alquiler ni las plusvalías de personas físicas.
  La tributación final depende del país de residencia del inversor. Nada más.
- Cierre obligatorio en cualquier correo que mencione fiscalidad o rentabilidad:
  *"Horizonte Emirates no presta asesoramiento fiscal ni jurídico. La información es orientativa."*

**RGPD**

- El aviso de lead indica `Consent. marketing: SI/NO`.
- Con **NO**: solo se puede escribir para atender lo que pidió (su análisis, su llamada, su seguimiento).
  Prohibido enviarle contenido comercial genérico, newsletters, novedades de proyectos o reactivaciones frías.
  En la práctica: se usan M1 a M7 y el M10. No se usan M8-E ni M9.
- Con **SI**: se puede usar todo el kit.
- Si responde pidiendo la baja: ejecutar `markUnsubscribed(email)` en Apps Script y no volver a escribir.

**Estilo**

- Tratamiento de **usted** siempre, en todos los países. La cercanía se consigue con el ritmo y el
  contenido, no con el tuteo.
- Firma: **Jesús Ibáñez** en el primer contacto (presentación y firma completa), y **Jesús** a secas
  en los seguimientos dentro del hilo. Marc aparece siempre como el especialista que hace la
  videollamada, nunca como el remitente.
- Sin rayas largas. Comas, paréntesis o dos puntos.
- Frases cortas. Un solo asunto por correo. Una sola pregunta al final.
- Nada de "no dude en contactarnos", "quedamos a su entera disposición", "esperamos su respuesta".
- Máximo unas 300 palabras de texto en el primer contacto, sin contar firma, enlaces ni descargo.
  Un correo largo se lee como un folleto.
  Orden de prioridad de los bloques cuando hay que recortar: **visita** y **objetivo** se quedan
  siempre, **plazo** y **canal** son baratos (dos o tres líneas), y **capital** es el primero que
  se cae. El rango ya aparece en la primera frase del correo.
- Enviar como texto normal de Gmail, sin logos ni botones. Un correo de persona, no una campaña.
- Cada correo pide una sola cosa: la videollamada. La guía, la comparativa y las fichas son el medio.

---

## 2. Datos fijos

| Dato | Valor |
|---|---|
| Remitente | hola@horizonteemirates.com |
| WhatsApp | +971 55 472 2025 |
| Calendly (30 min) | https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-30-minutos |
| Guía fiscal Dubai y España | https://www.horizonteemirates.com/guias/guia-fiscal-dubai-espana.html |
| Comparador España vs Dubai | https://www.horizonteemirates.com/#comparativa |
| Proyectos | https://www.horizonteemirates.com/proyectos.html |

**Variables que se sustituyen en cada correo**

`[Nombre]` nombre de pila del lead · `[Capital]` rango en euros · `[Objetivo]` lo que marcó ·
`[País]` país de residencia · `[Plazo]` horizonte declarado

---

## 3. Mapa de correos

| Código | Cuándo se envía | Qué busca |
|---|---|---|
| **W0** | **Automático, en segundos tras el formulario** | **Que el lead sepa que ha llegado. No se escribe a mano** |
| M1-A / M1-B / M1-C | Primer contacto | La videollamada con Marc |
| M2 | 48 h sin respuesta al M1 | Rebajar el compromiso: dos horarios concretos |
| M3 | Cuando ya hay selección de inmuebles | Que la llamada tenga material delante |
| M4 | Llamada agendada | Confirmar y preparar (evita el no-show) |
| M5 | 24 h antes de la llamada | Recordatorio corto |
| M6 | No se presentó | Reagendar sin culpa |
| M7 | Después de la llamada | Resumen y siguiente paso concreto |
| M8-A a M8-E | Cuando aparece una objeción | Desactivarla y volver a la llamada |
| M9 | 45 a 90 días de silencio (solo con consentimiento de marketing) | Reabrir con una razón real |
| M10 | Cuarto toque sin respuesta | Cerrar con elegancia y dejar la puerta abierta |
| **M11** | **Segundo o tercer toque, o cuando pide más documentación** | **La visita a Emiratos: es la palanca más fuerte** |

---

## 3 bis. W0 · El acuse de recibo automático (no se escribe a mano)

Es el único correo que sale solo, en la misma pasada que detecta el lead, incluso de noche y en fin
de semana. Vive en `getTemplate('W0', lead)` dentro de `horizonte-emails.gs`, no aquí, porque lo
envía la máquina. Interruptor propio: `CONFIG.AUTO_SEND_WELCOME`.

**Qué hace y por qué está escrito así:**

1. **Confirma con el eco del perfil** (capital, objetivo, residencia). El lead comprueba de un
   vistazo que sus datos llegaron bien, y eso solo se consigue devolviéndoselos.
2. **Admite que es automático.** «Este correo es automático, para que sepa que no se ha perdido
   nada. El siguiente lo escribo yo.» Fingir que lo ha escrito una persona a las 2 de la mañana no
   engaña a nadie; decir la verdad y anunciar el correo humano genera expectativa y hace que el
   suyo se abra.
3. **Entrega la guía fiscal en el momento**, que es el recurso que la web promete.
4. **Siembra la visita a Emiratos en una línea** y remata con «se lo cuento con calma en el próximo
   correo». Deja el tema abierto para el M1 o el M11.
5. **Da salida al lead impaciente** con el enlace de Calendly, sin convertirlo en la petición
   principal. Quien quiere hablar ya, puede.
6. **Promete 48 horas, siempre.** Está en `CONFIG.WELCOME_PROMISE` y es lo mismo que dice la web,
   así que el lead lee el mismo compromiso en los dos sitios. Es un techo, no un objetivo: se
   promete holgado y se cumple mucho antes. Un tier A que pide 48 horas y recibe respuesta en una
   se lleva una impresión que ninguna frase de marketing consigue. Al revés no funciona.

**Consecuencia para los correos manuales:** cuando usted escribe, el lead ya tiene su nombre y ya
sabe que le va a escribir. Por eso los tres M1 arrancan encadenando («soy el que firmaba el correo
de confirmación») en lugar de presentarse otra vez y volver a dar las gracias por la solicitud.

**Las 48 horas son el límite, no el plan.** El ritmo real sigue siendo el de la tabla de tiers:
menos de una hora en A, mismo día en B, menos de 24 horas en C. Lo único que cambia es que el
lead no ha leído esa exigencia, así que un retraso puntual no le deja a usted en evidencia.

**Para verlo antes de que lo reciba un lead:** ejecutar `previewWelcome()` en Apps Script (lo
escribe en el registro, sin enviar nada) o `testWelcomeToSelf()` (lo envía a su propio buzón tal
como llega, con la plantilla de marca).

---

## 4. M1 · Primer contacto

### M1-A · Tier A (capital listo, plazo corto)

En tier A no va la guía fiscal: distrae del único objetivo, que es la cita. Quien tiene el capital
listo no necesita leer, necesita hablar. Si la pide, se le manda al momento.

**Asunto:** `Su análisis de Dubai, [Nombre]: una pregunta antes de enviárselo`

```text
Hola [Nombre],

Soy Jesús Ibáñez, el que firmaba el correo de confirmación de hace un rato. Ahora ya en
persona y con su solicitud delante.

Antes de mandarle inmuebles quiero afinar una cosa, porque para [Capital] con [Objetivo]
hay dos caminos bastante distintos y el que le convenga cambia toda la selección.

[BLOQUE OBJETIVO]

Quien lo revisa con usted es Marc, nuestro socio en Dubai. Es quien negocia con las
promotoras y quien puede decirle, sin rodeos, si lo que busca encaja hoy con el mercado
o si conviene replantearlo.

[BLOQUE PLAZO]

[BLOQUE VISITA · versión corta, la variante que marcó]

[BLOQUE CANAL]

Le he reservado dos huecos esta semana:
- [día] a las [hora]
- [día] a las [hora]

¿Cuál le viene mejor? Si prefiere elegir usted:
https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-30-minutos

Un saludo,
Jesús Ibáñez
Horizonte Emirates
hola@horizonteemirates.com · WhatsApp +971 55 472 2025

Horizonte Emirates no presta asesoramiento fiscal ni jurídico. La información es orientativa.
```

### M1-B · Tier B (interés real, plazo medio)

**Asunto:** `[Nombre], su análisis de inversión en Dubai`

```text
Hola [Nombre],

Soy Jesús Ibáñez, el que firmaba el correo de confirmación. Ya he mirado su solicitud con
calma.

Le cuento cómo lo hacemos, porque no es lo habitual: primero hablamos 20 minutos y
después le enviamos inmuebles. Al revés no funciona. Mandar fichas en PDF a alguien de
quien no sabemos si busca renta, plusvalía o cobertura de patrimonio es hacerle perder
el tiempo.

[BLOQUE OBJETIVO]

La videollamada la hace Marc, que está en Dubai y trata directamente con las promotoras.
Son 20 o 30 minutos, sin coste y sin compromiso. Si al terminar la conclusión es que
Dubai no encaja con lo que busca, se lo diremos igual.

[BLOQUE VISITA · versión corta, la variante que marcó]

[BLOQUE CANAL]

Puede elegir el hueco que quiera aquí:
https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-30-minutos

Y mientras, la guía fiscal Dubai y España, con lo que hay que saber desde [País]:
https://www.horizonteemirates.com/guias/guia-fiscal-dubai-espana.html

Un saludo,
Jesús Ibáñez
Horizonte Emirates
hola@horizonteemirates.com · WhatsApp +971 55 472 2025

Horizonte Emirates no presta asesoramiento fiscal ni jurídico. La información es orientativa.
```

### M1-C · Tier C (explorando, sin plazo)

**Asunto:** `Su guía fiscal de Dubai, [Nombre] (y una idea para cuando le encaje)`

```text
Hola [Nombre],

Soy Jesús Ibáñez, el que firmaba el correo de confirmación. Le escribo yo ahora.

Por lo que ha marcado, entiendo que está en fase de mirar y entender, no de comprar.
Perfecto: es exactamente el momento en el que conviene informarse bien y sin prisa.

Le dejo la guía fiscal Dubai y España, que es lo más útil en su punto. Explica qué se
declara en [País], cómo funciona el convenio de doble imposición y los errores que más
caros salen:
https://www.horizonteemirates.com/guias/guia-fiscal-dubai-espana.html

Y también el comparador: mete su precio de compra y ve el retorno estimado en Dubai
frente a España, con sus propios supuestos:
https://www.horizonteemirates.com/#comparativa

[BLOQUE PAÍS]

[BLOQUE VISITA · versión corta, la variante que marcó]

[BLOQUE CANAL]

Cuando quiera pasar de leer a ver números concretos, mi socio Marc está en Dubai y hace
videollamadas de 20 minutos con inversores en su situación. Sin coste y sin compromiso.
Lo digo por si le sirve más adelante, no hay ninguna prisa:
https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-30-minutos

Un saludo,
Jesús Ibáñez
Horizonte Emirates
hola@horizonteemirates.com · WhatsApp +971 55 472 2025

Horizonte Emirates no presta asesoramiento fiscal ni jurídico. La información es orientativa.
```

---

## 5. Bloques modulares

Se insertan donde el M1 lo indica. Un bloque por dimensión, nunca más de tres bloques en un correo:
el primer contacto tiene que respirar.

### 5.1 BLOQUE OBJETIVO (lo que marcó en la pregunta 2)

**Renta pasiva (`alquiler`)**

```text
Usted busca renta. Ahí lo que manda no es el precio de entrada, es quién gestiona el
alquiler y qué ocupación real tiene la zona. Un 8 % sobre el papel con tres meses vacío
al año es un 6 %. En la llamada verá las cifras de ocupación por zona, no solo la
rentabilidad bruta estimada del 6 al 12 % que se publica.
```

**Apreciación del capital (`revalorizacion`)**

```text
Usted busca plusvalía. Eso significa entrar antes de que el precio recoja lo que va a
pasar en la zona, y eso obliga a hablar de plazos de entrega y de solvencia del promotor
más que de rentabilidad. Son escenarios orientativos, sin resultados garantizados: por
eso conviene verlos con Marc y no en una ficha.
```

**Diversificación geográfica (`diversificacion`)**

```text
Su objetivo no es maximizar el rendimiento, es sacar una parte del patrimonio del euro
y de un único marco regulatorio. Cambia bastante la selección: se priorizan activos
líquidos, en zonas consolidadas y con salida fácil, aunque rentabilidad no sea la mayor.
```

**Residencia en UAE (`residencia`)**

```text
Le interesa la residencia. Aquí el orden importa: el inmueble tiene que cumplir los
requisitos de importe y de titularidad para la visa, así que primero se define eso y
luego se busca la mejor opción dentro de ese filtro. Hacerlo al revés suele acabar en
una compra que no sirve para el objetivo.
```

### 5.2 BLOQUE CAPITAL (pregunta 1)

**150.000 a 300.000 €**

```text
Con su rango se trabaja bien en off-plan premium y en residencial consolidado de Dubai.
La clave está en el plan de pagos: hay proyectos donde se entra con el 20 % y el resto
se escalona hasta la entrega, y eso cambia por completo el capital que necesita hoy.
```

**300.000 a 600.000 €**

```text
Su rango permite algo que abajo no se puede: repartir en dos activos con lógicas
distintas, uno de renta y otro de apreciación. La mayoría lo descubre en la llamada
y es la decisión que más les cambia el resultado.
```

**600.000 a 1.000.000 €**

```text
En su rango entra el prime real (Marina, Downtown, Palm) y también la opción de un solo
activo grande frente a una cartera de tres. No hay respuesta buena en abstracto: depende
de si quiere gestionar poco o rendir más.
```

**Más de 1.000.000 €**

```text
A partir de ese volumen se negocia de otra forma: descuentos por compra en bloque,
condiciones de pago fuera de catálogo y acceso a lanzamientos antes de la salida pública.
Eso se habla directamente con Marc y con el promotor, no por correo.
```

### 5.3 BLOQUE PLAZO (pregunta 3)

**Capital listo, operar ya (`ya`)**

```text
Como tiene el capital disponible, la conversación es distinta: se trata de ver qué hay
abierto ahora mismo y con qué condiciones, no de teoría de mercado. Por eso le propongo
hablar esta misma semana.
```

**Menos de 6 meses (`6meses`)**

```text
Con un horizonte de seis meses hay tiempo de hacerlo bien: ver opciones, comparar y
decidir con calma. Lo que no conviene es dejar la parte fiscal para el final, porque
es lo que más suele retrasar una operación.
```

**Menos de 12 meses (`12meses`)**

```text
Doce meses dan margen para lo más valioso: ver cómo evoluciona lo que hoy está sobre
plano y entrar con criterio. La llamada de ahora sirve para saber qué mirar durante
ese año.
```

**Sin plazo definido (`indefinido`)**

```text
Sin plazo definido no hay ninguna prisa, y así lo trataremos. La llamada le sirve para
saber si esto tiene sentido para usted antes de invertir tiempo en analizar proyectos
concretos.
```

### 5.4 BLOQUE VISITA (pregunta 4)

La visita a Emiratos es la palanca más fuerte del argumentario, y por una razón: es lo único
que demuestra, sin que haya que prometer nada, que hay un equipo y unas oficinas reales detrás.
Cualquiera manda un PDF; poner una agenda de dos días en pie cuesta dinero y trabajo.

**Regla de uso:** la visita **no compite con la videollamada, la justifica.** El mensaje siempre
es el mismo: la llamada con Marc sirve para decidir qué merece la pena que vea en persona. Nunca
se ofrece la visita como alternativa a la llamada, porque entonces el lead aparca las dos.

En el primer contacto va la **versión corta**. La versión desarrollada es el correo M11.

#### Versión corta (para el M1)

**Sí, me interesa (`si`)**

```text
Ha marcado que le interesa verlo en persona, y me alegra: es la mejor decisión que puede
tomar antes de firmar nada. La agenda la montamos nosotros de principio a fin (los
proyectos, nuestras oficinas de Dubai y las reuniones con los promotores). En la llamada
con Marc decidimos qué merece la pena que vea.
```

**Lo valoro (`quizas`)**

```text
Sobre venir a Emiratos: no hace falta decidirlo hoy, pero quiero que sepa que la puerta
está abierta y que la agenda la montamos nosotros (los proyectos, nuestras oficinas de
Dubai y las reuniones con los promotores). En la llamada con Marc verá si en su caso
merece la pena el viaje.
```

**No por ahora (`no`)**

```text
Ha indicado que prefiere gestión remota, y es perfectamente viable: se compra a distancia,
con poder notarial y con nuestro equipo verificando cada paso en Dubai. Y si algún día
quiere verlo con sus propios ojos, la invitación queda hecha y la agenda la montamos
nosotros.
```

#### Versión desarrollada (para el M11 o cuando el lead pregunte)

**Sí, me interesa (`si`)**

```text
Ha marcado que le interesa verlo en persona. Es la mejor decisión que puede tomar antes
de firmar nada, y le explico cómo lo hacemos.

Cuando un inversor viaja con nosotros no viene a hacer turismo inmobiliario. Le montamos
la agenda completa: visitas a los proyectos que encajan con su perfil, reunión en nuestras
oficinas de Dubai con el equipo que llevaría su operación, y encuentros cara a cara con
los promotores, que es donde se ven las condiciones que no aparecen en ningún catálogo.

De todo eso nos ocupamos nosotros, y sin coste de asesoramiento para usted. Usted pone el
vuelo y el hotel.

En la videollamada con Marc decidimos qué merece la pena que vea, porque una agenda de dos
días bien elegida vale más que una semana viendo inmuebles al azar.
```

**Lo valoro (`quizas`)**

```text
Sobre venir a Emiratos: no hace falta decidirlo hoy, pero quiero que sepa exactamente qué
hay detrás de esa invitación, porque no es una frase de cortesía.

Cuando un inversor viaja con nosotros le preparamos la agenda entera: los proyectos que de
verdad encajan con su perfil, una reunión en nuestras oficinas de Dubai con el equipo que
llevaría su operación, y las promotoras directamente, sin intermediarios por el camino.
Sin coste de asesoramiento: usted pone vuelo y hotel, del resto nos ocupamos nosotros.

Lo menciono ahora porque cambia el orden de las cosas: en la videollamada con Marc no solo
verá opciones, decidirán juntos qué valdría la pena que viera en persona si al final se
anima a venir.
```

**No por ahora (`no`)**

```text
Ha indicado que prefiere gestión remota, y es perfectamente viable: la compra se puede
hacer entera a distancia, con poder notarial y con nuestro equipo verificando cada paso en
Dubai. Buena parte de nuestros inversores opera así y funciona.

Dicho eso, dejo la invitación hecha por si en algún momento cambia de opinión. Si quiere
ver el activo, nuestras oficinas de Dubai y a los promotores en persona, la agenda la
montamos nosotros y no le cuesta más que el vuelo y el hotel. Sin ningún compromiso de
compra por venir, faltaría más.
```

### 5.4 bis BLOQUE AGENDA (qué incluye el viaje)

Se usa dentro del M11 y cada vez que el lead pregunta en qué consiste exactamente. Es la parte
que hay que contar con detalle: el detalle es lo que hace creíble la oferta.

```text
- Visitas a los proyectos preseleccionados para su perfil, en obra y ya terminados
- Reunión en nuestras oficinas de Dubai con el equipo que llevaría su operación
- Encuentros cara a cara con los promotores, donde se habla de condiciones que no
  aparecen en ningún catálogo
- Recorrido por las zonas: quién vive allí, qué se está construyendo al lado y cómo
  está el alquiler en la práctica
- Todo en español, con alguien de nuestro equipo acompañándole en cada reunión
```

**Antes de usarlo, comprobar:** que las fechas propuestas cuadran con la disponibilidad real del
equipo en Dubai, y que los promotores que se van a mencionar están efectivamente confirmados. La
promesa de agenda hay que poder cumplirla el día que el lead diga que se sube al avión.

**Lo que nunca se dice:** que el viaje es gratis. Es "sin coste de asesoramiento": el vuelo y el
alojamiento son del inversor. Tampoco se promete un promotor concreto ni una unidad reservada
hasta que esté confirmado por escrito.

### 5.5 BLOQUE PAÍS (para el M1-C y para cualquier correo que toque fiscalidad)

**España**

```text
Desde España hay tres cosas que conviene tener claras antes de nada: las rentas del
alquiler tributan en el IRPF, el inmueble se declara en el modelo 720 si supera el
umbral, y el convenio de doble imposición con los EAU evita pagar dos veces. La guía
lo explica con detalle.
```

**Andorra**

```text
Desde Andorra el tratamiento es distinto al español y bastante más simple, pero depende
de su situación concreta de residencia. Es de las primeras cosas que conviene revisar
con su asesor, y en la llamada le decimos qué preguntarle exactamente.
```

**LatAm y otros**

```text
Desde [País] lo que más pesa no suele ser la rentabilidad, es tener parte del patrimonio
en una divisa estable y en una jurisdicción previsible. La fiscalidad depende de su
país, y ahí siempre recomendamos contrastar con un asesor local antes de decidir.
```

### 5.6 BLOQUE CANAL (cierre del correo según lo que eligió en el formulario)

**WhatsApp**

```text
Ha indicado WhatsApp como canal preferido, así que le escribo también por ahí para que
lo tenga a mano. Si prefiere que hablemos solo por correo, dígamelo y así lo hacemos.
```

**Llamada**

```text
Ha indicado que prefiere que le llamemos. Dígame qué franja le viene bien y le llamamos
cuando usted diga: no llamamos a nadie sin avisar antes.
```

**Email**

```text
Ha indicado el correo como canal preferido, así que por aquí seguimos. Si en algún
momento prefiere WhatsApp, mi número está abajo.
```

---

## 6. Seguimiento

### M2 · 48 h sin respuesta (rebajar el compromiso)

**Asunto:** `Re: [asunto del M1]` (responder al mismo hilo, no abrir uno nuevo)

```text
Hola [Nombre],

Le escribo por si el correo anterior quedó enterrado, que pasa constantemente.

No hace falta que decida nada ahora. Solo dígame si le viene mejor:
- [día] a las [hora]
- [día] a las [hora]
- o ninguna de las dos, y le propongo otras

Son 20 minutos con Marc y salen de ahí dos cosas concretas: si su planteamiento para
[Capital] encaja hoy con el mercado, y qué haría él en su lugar.

Un saludo,
Jesús
```

### M3 · Con la selección preparada

**Asunto:** `[Nombre], tengo tres opciones para su perfil (le explico en 20 min)`

```text
Hola [Nombre],

Ya tengo preparada la selección para [Capital] con [Objetivo]: tres inmuebles, cada uno
con una lógica distinta, y la comparativa por zona entre Dubai, Ras Al Khaimah y Abu Dhabi.

No se lo envío en PDF a secas y por una razón: los números importantes no son la
rentabilidad bruta estimada, son la ocupación real, el plan de pagos y el historial del
promotor. Eso se entiende hablando, en veinte minutos, y no leyendo una ficha.

Marc se lo pasa por pantalla y lo repasan juntos. Elija hueco aquí:
https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-30-minutos

Si después de la llamada quiere las fichas, se las envío ese mismo día.

Un saludo,
Jesús

Horizonte Emirates no presta asesoramiento fiscal ni jurídico. Las rentabilidades son
estimaciones de mercado y no garantizan resultados.
```

### M11 · La visita a Emiratos (el correo más potente del kit)

**Cuándo:** como segundo o tercer toque cuando el lead se ha quedado tibio, como respuesta a
"mándeme más información", y como siguiente paso natural después de la videollamada. Con un lead
que marcó "Sí, me interesa" en la visita, se puede usar ya en el segundo correo.

**Por qué funciona:** no promete rentabilidades, demuestra estructura. Un inversor que duda de si
hay alguien real al otro lado deja de dudar cuando le ofreces enseñarle la oficina, el activo y al
promotor. Y la lista de la agenda hace el trabajo: el detalle es lo que separa una invitación de
verdad de un "cuando quiera se pasa por Dubai".

**Asunto:** `[Nombre], le propongo que lo vea con sus propios ojos`
**Alternativo:** `Le montamos la agenda en Dubai, [Nombre]`

```text
Hola [Nombre],

Le voy a proponer algo distinto de lo que suele hacer una agencia.

En lugar de mandarle más documentación, le propongo que venga a Emiratos y lo vea usted
mismo. De la agenda nos ocupamos nosotros, de principio a fin:

[BLOQUE AGENDA]

No tiene coste de asesoramiento: usted pone el vuelo y el hotel, y no adquiere ningún
compromiso de compra por venir.

Lo hacemos porque es lo que convierte más rápido una duda razonable en una decisión
tranquila, y da igual en qué sentido. Hay inversores que vienen, lo ven y deciden que no
es para ellos. También nos vale: preferimos eso a que alguien firme sin estar seguro.

Y hay algo que a distancia no se consigue: sentarse delante del promotor. Ahí se habla de
plazos reales, de planes de pago y de condiciones que no están en ningún catálogo, y se
ve con quién se está tratando.

El paso previo son 20 minutos con Marc por videollamada, para elegir qué merece la pena
que vea. Una agenda de dos días bien montada vale más que una semana viendo inmuebles al
azar.

- [día] a las [hora]
- [día] a las [hora]

¿Le encaja alguno? Si prefiere elegir usted:
https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-30-minutos

Un saludo,
Jesús Ibáñez
Horizonte Emirates
hola@horizonteemirates.com · WhatsApp +971 55 472 2025
```

**Variante para quien marcó "No por ahora" en la visita:** cambiar el arranque por la versión
desarrollada del bloque visita (`no`), que reconoce primero que la compra remota es viable y solo
después deja la invitación abierta. A quien ha dicho que no quiere viajar no se le empieza un
correo proponiéndole un viaje.

### M4 · Confirmación de llamada agendada

**Asunto:** `Confirmado: [día] a las [hora] con Marc`

```text
Hola [Nombre],

Confirmado para el [día] a las [hora] ([zona horaria]). Le llegará el enlace de la
videollamada con la invitación.

Marc llega con esto preparado:
- Tres inmuebles para [Capital] con [Objetivo]
- Rentabilidad estimada, plan de pagos y plazo de entrega de cada uno
- Comparativa entre Dubai, Ras Al Khaimah y Abu Dhabi
- Los puntos fiscales que le afectan desde [País]
- Cómo sería la agenda si quiere venir a verlo en persona, con fechas posibles

Solo le pido una cosa: traiga sus dudas incómodas. Las de "¿y si no se alquila?",
"¿qué pasa si el promotor se retrasa?" o "¿cómo saco el dinero de ahí?". Son las que
de verdad sirven y las que Marc responde mejor.

Si le surge algo y necesita moverla, dígamelo con confianza.

Un saludo,
Jesús
```

### M5 · Recordatorio 24 h antes

**Asunto:** `Mañana a las [hora], [Nombre]`

```text
Hola [Nombre],

Un recordatorio rápido: mañana [día] a las [hora] con Marc, 20 o 30 minutos por
videollamada. Aquí tiene el enlace: [enlace]

Si le ha surgido algo, dígamelo y la movemos sin problema. Es mejor cambiarla que
hacerla con prisa.

Un saludo,
Jesús
```

### M6 · No se presentó

**Asunto:** `Se nos ha cruzado la hora, [Nombre]`

```text
Hola [Nombre],

Hoy no hemos coincidido en la llamada. Sin ningún problema: cuando uno tiene la agenda
llena, es lo normal.

Marc tiene su selección preparada y sigue disponible. ¿Le busco hueco para [día] o
prefiere la semana que viene?

Y si simplemente ha decidido dejarlo, dígamelo con total libertad y dejo de escribirle.
Prefiero saberlo a insistir sin sentido.

Un saludo,
Jesús
```

### M7 · Después de la llamada

**Asunto:** `Lo que hablamos hoy, [Nombre], y el siguiente paso`

```text
Hola [Nombre],

Le resumo lo que salió de la llamada con Marc:

1. [Conclusión sobre su objetivo, en una línea]
2. [Opción recomendada y por qué]
3. [Lo que hay que verificar o decidir antes de avanzar]

Le adjunto las fichas de los inmuebles que vio, con los números que comentamos.

El siguiente paso es [paso concreto: revisar la documentación, reservar la unidad,
hablar con su asesor fiscal, fijar la fecha del viaje]. Si le encaja, lo preparo y le
digo qué necesito de su parte.

Y si de esta conversación ha salido que no es el momento, también es una conclusión
válida. Se lo digo en serio.

Un saludo,
Jesús

Horizonte Emirates no presta asesoramiento fiscal ni jurídico. Las cifras son
estimaciones y no garantizan resultados.
```

---

## 7. Objeciones

Se responden en el hilo, cortas, sin defenderse. La estructura es siempre la misma:
darle la razón en lo que la tiene, aportar el dato, volver a la llamada.

### M8-A · "Dubai me parece una burbuja"

```text
Hola [Nombre],

Es la duda más razonable que se puede tener, y quien no se la hace es el que debería
preocuparme.

Lo que le puedo decir con datos: en 2025 se registraron más de 270.000 operaciones
inmobiliarias en Dubai según el Dubai Land Department, con una base de demanda que ya
no es especulativa sino residencial, sostenida por llegada de población. No es 2008,
cuando el mercado se movía por reventas sobre plano sin comprador final.

Dicho eso: hay zonas donde yo no compraría y proyectos que no le enseñaríamos. Esa
distinción es justo lo que le aporta hablar con Marc veinte minutos.

¿Le busco hueco esta semana?

Un saludo,
Jesús
```

### M8-B · "Está muy lejos, no puedo controlarlo"

```text
Hola [Nombre],

Tiene toda la razón en que un inmueble a 5.000 kilómetros no se gestiona igual que uno
en su ciudad. Por eso la pregunta correcta no es cómo lo va a controlar usted, es quién
lo gestiona y qué responde si algo va mal.

En la práctica: gestión profesional del alquiler, nuestro equipo en Dubai como
interlocutor suyo, y el marco RERA, que obliga a que los pagos del off-plan vayan a
cuentas de garantía supervisadas y no al bolsillo del promotor.

Es exactamente lo que conviene que le explique Marc, que es quien está allí.
¿Veinte minutos esta semana?

Un saludo,
Jesús
```

### M8-C · "Tengo que hablarlo con mi asesor fiscal"

```text
Hola [Nombre],

Me parece lo correcto, y de hecho es lo que recomendamos siempre: nosotros no somos
asesores fiscales y no vamos a comportarnos como si lo fuéramos.

Para que esa conversación con su asesor sea útil, le mando la guía fiscal Dubai y
España, que es la que suelen agradecer porque ordena el asunto (IRPF, modelo 720,
convenio de doble imposición):
https://www.horizonteemirates.com/guias/guia-fiscal-dubai-espana.html

Una idea: si hacemos primero la llamada con Marc, irá a su asesor con un caso concreto
en la mano en lugar de con una pregunta abierta. Suele ahorrar dos o tres vueltas.

Un saludo,
Jesús

Horizonte Emirates no presta asesoramiento fiscal ni jurídico.
```

### M8-D · "Mándeme la información por correo y ya le digo"

```text
Hola [Nombre],

Se lo mando encantado, pero antes le explico por qué insisto en la llamada, y luego
usted decide.

Si le envío tres fichas ahora, voy a acertar por casualidad. No sé si prioriza cobrar
renta desde el primer mes o entrar barato y esperar, ni si quiere gestionar poco o
rendir más. Con esos datos, la selección es otra.

Veinte minutos con Marc y le llega una propuesta que sí es suya. Si aun así prefiere
las fichas primero, dígamelo y se las envío hoy sin más.

Y le adelanto por dónde acaba esto normalmente: con el inversor viniendo a Emiratos a
verlo. Le montamos nosotros la agenda entera (proyectos, nuestras oficinas de Dubai y
reuniones con los promotores) y usted solo pone el vuelo y el hotel. Ninguna ficha en PDF
compite con eso.

Un saludo,
Jesús
```

### M8-E · "Ahora no es el momento" (requiere consentimiento de marketing para el seguimiento)

```text
Hola [Nombre],

Entendido, y gracias por decírmelo claramente. Se agradece más que un silencio.

Dos cosas y le dejo tranquilo:

Si quiere, le escribo dentro de [tres o seis] meses para ver cómo está el mercado y si
entonces le encaja. Si prefiere que no, dígamelo y no vuelvo a escribirle.

Y si en cualquier momento le surge una duda concreta, mi número está abajo. Responder
preguntas no nos cuesta nada y no implica ningún compromiso.

Un saludo,
Jesús
```

### M9 · Reactivación a los 45 a 90 días (solo con consentimiento de marketing)

**Asunto:** `[Nombre], una novedad que sí afecta a lo que buscaba`

```text
Hola [Nombre],

Hablamos hace unos meses sobre [Capital] con [Objetivo] y quedó en que no era el momento.

Le escribo porque ha cambiado algo que le afecta directamente: [novedad real y concreta:
un lanzamiento en su rango, un cambio de precios en la zona que miraba, un plan de pagos
nuevo]. No es una novedad genérica de mercado, es de lo suyo.

¿Le interesa que se lo cuente en quince minutos, o lo dejamos definitivamente aparcado?
Las dos respuestas me sirven.

Un saludo,
Jesús
```

### M10 · Cierre elegante (cuarto toque sin respuesta)

**Asunto:** `Dejo de escribirle, [Nombre]`

```text
Hola [Nombre],

Le he escrito varias veces sin respuesta, así que dejo de hacerlo. No quiero ser una
molestia en su bandeja de entrada.

Su solicitud queda registrada. Si algún día quiere retomarlo, escríbame una línea a
hola@horizonteemirates.com y lo recupero al momento, sin tener que empezar de cero.

Gracias por haber confiado en nosotros para preguntar.

Un saludo,
Jesús
```

---

## 8. WhatsApp complementario

Se envía **después** del correo, nunca antes, y solo si el lead marcó WhatsApp o llamada.
Corto, sin enlaces largos y sin parecer un envío automático.

### Marc valida la entregabilidad (el más útil de todos)

Lo manda **Marc**, no Jesús, entre 30 y 60 minutos después del correo. Funciona por tres razones:
el número +971 demuestra que hay alguien en Dubai de verdad, la excusa es real (los correos se van
a spam), y la pregunta final se contesta con un monosílabo, que es lo que hace que la gente
conteste. No pide la llamada: eso ya lo hace el correo. Aquí solo se abre la conversación.

```text
Hola [Nombre], soy Marc, de Horizonte Emirates. Le escribo desde Dubai, de ahí el
prefijo +971.

Jesús le ha mandado hace un rato un correo con el detalle de su solicitud. Le escribo
solo por una cosa: estos correos acaban en spam más a menudo de lo que parece.

¿Le ha llegado bien?

Si prefiere que sigamos solo por email, dígamelo y no le escribo más por aquí.
```

**Cuando responde que sí le llegó** (ahí ya hay conversación abierta, y solo entonces se pide la
llamada):

```text
Perfecto, gracias por confirmarlo.

Cuando lo lea con calma me dice. Si le encaja, reservamos 20 minutos y le cuento cómo
está hoy el mercado para lo que busca, sin compromiso. Y si le surge cualquier duda
antes, pregúnteme por aquí sin problema.
```

**Si no responde en 24 o 48 horas** (uno solo, y después se para):

```text
Hola [Nombre], no quiero insistir. Solo saber si le llegó el correo de Jesús. Si le
llegó y prefiere leerlo con calma, perfecto, quedo a la espera.
```

**Cuándo mandarlo:** entre las 10:00 y las 20:00 hora de España, que en Dubai son dos horas más.
Nunca antes que el correo: el mensaje pierde todo el sentido si no hay nada que confirmar.

**Cobertura legal:** el formulario recoge el consentimiento de marketing "por email o WhatsApp",
así que con `Consent. marketing: SI` el mensaje está cubierto. Con `NO`, se puede escribir igual
para atender su solicitud, pero sin nada comercial y respetando la baja a la primera.

**Tras el M1 (tier A)**

```text
Hola [Nombre], soy Jesús Ibáñez de Horizonte Emirates. Le acabo de escribir al correo con su
solicitud de análisis de Dubai. Le he propuesto dos huecos para hablar con Marc, mi socio
allí. ¿Le va bien alguno o le busco otro?
```

**Tras el M1 (tier B)**

```text
Hola [Nombre], soy Jesús Ibáñez de Horizonte Emirates. Le he mandado un correo con el detalle de
su solicitud. Si le resulta más cómodo por aquí, dígame y seguimos por WhatsApp.
```

**Recordatorio de llamada**

```text
Hola [Nombre], mañana a las [hora] tiene la videollamada con Marc. Si le ha surgido algo,
avíseme y la movemos sin problema.
```

**Tras un no-show**

```text
Hola [Nombre], hoy no hemos coincidido en la llamada. Sin problema. ¿Le busco hueco para
[día] o prefiere la semana que viene?
```

---

## 9. Antes de pulsar enviar

- [ ] El nombre del lead está bien escrito y es el de pila, no el completo.
- [ ] No queda ningún `[corchete]` sin sustituir.
- [ ] Los rangos de fecha y hora tienen zona horaria si el lead no está en España.
- [ ] Hay una sola pregunta al final del correo.
- [ ] Si se mencionan rentabilidades o fiscalidad, está el descargo al pie.
- [ ] Si `Consent. marketing: NO`, el correo se limita a atender su solicitud.
- [ ] Se envía desde `hola@horizonteemirates.com`, en texto normal, sin plantilla de marca.
- [ ] Si es un seguimiento, va en el mismo hilo (responder), no en un correo nuevo.
- [ ] La respuesta del lead se anota en la columna Notas del CRM, con la fecha del último toque.

---

## 10. Herramientas

Se marcan las opciones del lead (capital, objetivo, plazo, visita, país, canal), y sale el correo
completo con los bloques ya insertados y listo para copiar. Es la misma biblioteca de este
documento, sin el trabajo de montarlo a mano. **Este archivo sigue siendo la fuente de verdad del
texto:** si un copy cambia, se cambia aquí y en el generador.

| Dónde | Qué es | Leads del CRM |
|---|---|---|
| Ordenador | `tools/generador-mails.html`, doble clic | No, se teclean a mano |
| Móvil, rápido | Página privada: https://claude.ai/code/artifact/d94d3eaf-9f5c-4714-8450-3122fcf83370 | No, se teclean a mano |
| Móvil, con CRM | Web app de Apps Script (`automation/horizonte-webapp.gs`) | **Sí**, lista los últimos leads y rellena la ficha de un toque |

La web app es el mismo HTML: detecta si se está ejecutando dentro de Apps Script y solo entonces
muestra el panel de leads. Fuera de ahí queda oculto y no molesta. Instalación y despliegue: la
cabecera de `automation/horizonte-webapp.gs` lo explica paso a paso.

**La versión móvil se genera, no se edita.** Los copys viven en `tools/generador-mails.html` y se
inyectan en la maqueta `tools/_plantilla-movil.html`:

```
python scripts/build_generador_movil.py
```

Eso escribe `tools/generador-mails.movil.html`, que es lo que se republica. Editar el archivo
`.movil.html` a mano no sirve de nada: el siguiente build lo pisa.

Ninguno de los dos toca la web: `tools/` queda fuera de `public/`, que es lo único que sirve el
worker de Cloudflare.
