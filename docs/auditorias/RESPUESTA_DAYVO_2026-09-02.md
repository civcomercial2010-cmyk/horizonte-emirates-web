# Borrador de respuesta a Dayvo

Listo para copiar y pegar. Respaldo técnico en
`DIAGNOSTICO_DAYVO_2026-09-02.md` (mismo directorio).

---

Hola Raúl,

He medido las dos cosas contra producción y te paso lo que sale, porque hay un
hallazgo que afecta directamente al cambio de puja que acabas de hacer.

**1. La discrepancia de clics no viene del consentimiento**

Lo he comprobado en la web: el primer hit sale con `gcs=G100`, es decir, consent mode
avanzado con analytics_storage denegado por defecto. GA4 sí recibe ese ping, así que la
visita no se pierde del todo, aunque con nuestro volumen Google no llega al umbral para
modelarla y no aparece en informes. O sea que el consentimiento resta, pero poco.

Lo que sí explica la diferencia son otras dos cosas, con datos de GA4 de los últimos
30 días:

- **Display.** La campaña "Inversión Dubai - Display" ha generado 16 sesiones en GA4 en
  30 días. Cuando en agosto miramos la cuenta por API, el 74% de sus clics venían de
  Tinder y el 100% de sus 5.490 clics procedían de emplazamientos con cero conversiones.
  La pérdida ahí es superior al 99%: el usuario hace clic dentro del navegador embebido
  de la app y cierra antes de que la página se registre.
- **Atribución perdida.** Tenemos 28 sesiones de "Safari (in-app)" clasificadas como
  tráfico directo, con cero sesiones con interacción, y 29 entradas a `/index.html`
  como directo con un 96,6% de rebote. Son clics de anuncio que GA4 sí contó, pero el
  navegador embebido se comió los parámetros de campaña y quedaron fuera de Paid. Eso
  ensancha la diferencia por los dos lados: faltan en Ads y sobran en Directo.

El argumento que a mí me cierra el asunto: el banner de cookies es exactamente el mismo
para Search y para Display. Search convierte clic en sesión a una tasa decenas de veces
mayor. Si la causa fuera el consentimiento, ambas perderían un porcentaje parecido.

**2. Hay dos cuentas de Ads y dos propiedades de GA4 midiendo a la vez**

Esto es lo importante. He interceptado las peticiones de red de la home y disparan
cuatro destinos donde debería haber dos:

| Destino | De dónde sale |
|---|---|
| `G-BK37V83363` (GA4) | de nuestro código, correcto |
| `AW-586671676` (Ads) | de nuestro código, correcto |
| `G-X6LMX9VR0Y` (GA4) | del contenedor GTM |
| `AW-18286678153` (Ads) | del contenedor GTM |

Los dos últimos no los tengo documentados por ninguna parte. Y `G-X6LMX9VR0Y` no solo
mide: envía a `google.com/measurement/conversion`, o sea que tiene conversiones
vinculadas a Ads. Esto encaja con lo que vimos en agosto, cuando la cuenta marcaba 5
conversiones y los leads reales eran 3.

¿Puedes revisar el contenedor y decirme qué son esos dos, y si podemos retirarlos?

**3. Sobre el cambio a maximizar conversiones**

Estoy de acuerdo con la dirección, y también con que el ticket alto alarga el ciclo de
decisión. Mi única reserva es de secuencia, no de criterio: ahora mismo el algoritmo va
a aprender de una señal duplicada por el punto 2, y además el volumen es muy corto
(GA4 registra 3 envíos de formulario en 30 días, y 0 en los últimos 7). Google pide del
orden de 30 conversiones al mes para que las pujas inteligentes tengan referencia.

Mi propuesta es limpiar primero los duplicados y luego dar margen al cambio, con un
plazo y un criterio de reversión acordados de antemano. Nuestro umbral sigue siendo un
CPL por debajo de 150 €. Si te parece, fijamos la ventana de evaluación y la revisamos
con esa referencia.

**4. Las páginas en blanco: buen aviso, y es un fallo real**

Lo he reproducido y localizado. El 68% de la altura de la home (11.336 px de 16.602)
está oculto por CSS hasta que un script nuestro lo hace visible al hacer scroll. Si ese
script no llega a ejecutarse, la página queda literalmente en blanco de la mitad hacia
abajo.

El detonante es de caché: el HTML se revalida en cada carga, pero el CSS y el
JavaScript se sirven hasta 24 horas desde la caché del navegador, y estamos
desplegando cambios sin cambiar el número de versión del fichero. Resultado: HTML nuevo
con script viejo. Por eso F5 no lo arregla y Ctrl+F5 sí.

Lo corregimos por nuestro lado esta semana, en dos frentes: que la página sea legible
aunque el script falle, y versionar bien los assets en cada despliegue. Gracias por
detectarlo, porque llevaba tiempo ahí y no lo habíamos visto.

Un saludo,
Jesús
