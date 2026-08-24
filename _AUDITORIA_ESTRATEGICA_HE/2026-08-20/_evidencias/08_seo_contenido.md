# Evidencia 08: SEO, contenido, LinkedIn y autoridad

**Auditoría estratégica Horizonte Emirates · 20-08-2026**
**Área:** SEO, contenido, LinkedIn y autoridad
**Modo:** solo lectura. Ningún archivo existente modificado.
**Pregunta central de la auditoría:** por qué solo 2 leads en 30 días, y qué aporta (o no aporta) esta área a la demanda.

---

## 1. Resumen ejecutivo

Esta área es el caso más claro de todo el proyecto de **activo construido sin distribución**. Existe un blog de 16 artículos técnicamente impecable, una guía fiscal descargable con captura de email funcionando, un playbook de LinkedIn de más de 220 KB con 20 posts redactados, y secuencias de email por tier completas. La contribución de todo ello a la demanda de los últimos 30 días es, con la evidencia disponible, **cero o próxima a cero**:

- El blog se publicó íntegro el 07-06-2026 y **no ha recibido ni un artículo nuevo desde entonces** (el plan preveía 4 al mes). Ataca keywords casi exclusivamente informacionales en un dominio joven y sector YMYL; la propia estrategia interna fija 6 a 9 meses para tracción. A 20-08 lleva 2,5 meses.
- **El tráfico orgánico no está medido en ningún registro del proyecto.** No existe una sola cifra de impresiones, clics o sesiones orgánicas en los archivos de métricas.
- El canal LinkedIn **no existe**: está bloqueado en el paso 2 de 7 desde el 30-07 (LinkedIn no permite crear la página por antigüedad de la cuenta) y no hay registro de avance posterior.
- El lead magnet fiscal funciona en la home, pero sus descargas quedan **deliberadamente fuera del funnel** (sin scoring, sin nurturing) y el documento circula **sin la validación de asesor fiscal** que el propio proyecto declaró requisito.
- No existe ni un vídeo, ni un webinar, ni un testimonio. La página de equipo se retiró el 12-06 y el autor de todo el contenido es un anónimo "Equipo Horizonte Emirates". No hay evidencia de que el fundador haya pisado Emiratos.

Conclusión directa: **nada de esta área puede explicar leads en 30 días, y nada de esta área va a generar demanda en los próximos 30 días tal y como está.** Es autoridad a medio plazo en el mejor de los casos, y activo muerto en varios puntos concretos.

---

## 2. SEO y blog

### 2.1 Inventario verificado (hecho)

| Activo | Estado | Evidencia |
|---|---|---|
| Blog publicado | 16 artículos + hub + créditos en `public/blog/` (18 HTML) | Listado de `public/blog/` (20-08-2026) |
| Fuentes editables | 16 `.md` con front-matter SEO en `contenido-blog/articulos/` + README manual | `contenido-blog/README.md` |
| Estrategia | `docs/SEO_ESTRATEGIA.md` (36 KB): 24 clusters, plan 12 meses, 12 lead magnets | Documento fechado 07-06-2026 |
| Sitemap | 17 URLs de blog incluidas, todas con `lastmod` 2026-06-07 | `public/sitemap.xml` |
| Search Console | Verificado por DNS + sitemap enviado (07-06) | `G:\Mi unidad\Horizonte Emirates\02_tareas.md`, tarea T18, línea 202 |
| Páginas de servicio transaccionales | **NO existen** (`public/servicios/` no existe) | Listado de `public/` (20-08-2026) |
| Página de equipo (EEAT) | **Retirada**: `public/sobre/` vacío, redirect 301 a home | Commit `46d5717` (12-06-2026, "retiro página equipo") y `public/_redirects` línea 13 |

### 2.2 Intención de búsqueda de los 16 artículos

Muestras leídas en profundidad: `como-invertir-inmuebles-dubai.md`, `impuestos-invertir-dubai-espana.md`, `golden-visa-emiratos-guia.md`, `invertir-ras-al-khaimah.md` (todas en `contenido-blog/articulos/`). Clasificación por front-matter (`funnel`, `keyword_principal`) y recuento de palabras del HTML publicado (texto sin etiquetas, calculado el 20-08-2026):

| Artículo | Keyword principal | Funnel declarado | Intención real | Palabras |
|---|---|---|---|---|
| como-invertir-inmuebles-dubai (pilar) | invertir en inmuebles en Dubai | MOFU | Informacional con intención comercial | 2.268 |
| impuestos-invertir-dubai-espana (pilar) | impuestos invertir Dubai España | BOFU | Informacional (resuelve objeción) | 1.624 |
| golden-visa-emiratos-guia (pilar) | golden visa Emiratos | MOFU | Informacional | 1.366 |
| rentabilidad-inmobiliaria-dubai | rentabilidad inmobiliaria Dubai | MOFU | Informacional | 1.271 |
| comprar-sobre-plano-dubai | comprar sobre plano Dubai | MOFU | Informacional | 1.189 |
| invertir-ras-al-khaimah | invertir en Ras Al Khaimah | MOFU | Informacional | 1.153 |
| mejores-zonas-invertir-dubai | mejores zonas invertir Dubai | MOFU | Informacional | 1.112 |
| espana-vs-dubai-invertir | España vs Dubai invertir | MOFU | Informacional (comparativa) | 1.127 |
| residencia-fiscal-emiratos-espanoles | residencia fiscal Dubai | BOFU | Informacional | 1.349 |
| crear-empresa-en-dubai (pilar) | crear empresa en Dubai | MOFU | Informacional (demanda adyacente) | 1.203 |
| free-zones-emiratos-comparadas | free zones Emiratos | MOFU | Informacional (adyacente) | 1.005 |
| modelo-720-declarar-inmueble-dubai | Modelo 720 Dubai | BOFU | Informacional | 1.054 |
| residencia-en-dubai | residencia en Dubai | MOFU | Informacional | 1.046 |
| comprar-propiedad-dubai-no-residente | comprar Dubai no residente | MOFU | Informacional | 1.049 |
| invertir-abu-dhabi | invertir Abu Dhabi | MOFU | Informacional | 946 |
| vivir-en-dubai-espanol | vivir en Dubai español | TOFU | Informacional | 1.035 |

**Lectura crítica (inferencia, confianza alta):**

1. **Los 16 artículos son informacionales.** Ninguno es una página transaccional de servicio. El propio plan (SEO_ESTRATEGIA.md, §5.1 y T1 pieza 9) preveía "página de servicio: análisis de inversión inmobiliaria en Dubai" y nunca se construyó. El blog educa; no captura demanda con intención de contratar.
2. **La selección de keywords es correcta según el propio plan** (los 12 títulos del T1 están casi todos ejecutados), pero choca con un dato duro de otra área: la demanda de búsqueda cualificada en español es mínima. `04_metricas.md` (diagnóstico 30-07): "invertir dubai" obtuvo **13 impresiones en 8 días** en Ads. Si la keyword de pago apenas tiene impresiones, la versión orgánica de esa misma demanda tampoco tiene volumen que capturar a corto plazo.
3. **Profundidad modesta para YMYL:** 13 de 16 piezas están entre 946 y 1.400 palabras. No es thin content penalizable, pero es la mitad o un tercio de lo que suele posicionar en fiscalidad e inversión internacional. El pilar core (2.268 palabras) es el único con profundidad competitiva.

### 2.3 ¿Posibilidad realista de tráfico orgánico a corto plazo? No

- La propia estrategia interna lo dice: "*Ranking* competitivo en 6-9 meses para informacional, 9-12 meses para transaccional" en dominio joven YMYL (`docs/SEO_ESTRATEGIA.md`, §4, línea 130) y "Google exige EEAT alto y paciencia (6-9 meses para tracción real)" (§1, línea 23). El blog tiene 2,5 meses de vida (publicado 07-06-2026).
- Los factores que la estrategia declara condición necesaria para rankear YMYL están **incumplidos hoy**: autor real con credenciales (no hay: autor anónimo, ver 2.5), casos de éxito y testimonios (no existen, tarea M17 abierta), backlinks/digital PR (sin evidencia de una sola acción ejecutada).
- **Clasificación: inferencia, confianza alta.** El blog no puede aportar tráfico material antes de fin de 2026, y solo si se retoman cadencia, EEAT y enlaces.

### 2.4 Medición del tráfico orgánico: no existe registro (dato no disponible)

- `G:\Mi unidad\Horizonte Emirates\04_metricas.md` (última revisión 09-08) contiene **exclusivamente métricas de Google Ads**. Ni una fila de tráfico orgánico, impresiones de Search Console o sesiones por canal.
- Search Console está verificado y el sitemap enviado desde el 07-06 (02_tareas.md, T18). La única revisión registrada es del diario del **29-06-2026**: "Revisé las métricas del mes (tráfico, cobertura de indexación de los artículos...)" (`07_diario.md`, línea 1488), **sin ninguna cifra anotada**.
- Consecuencia: **no se puede saber ni siquiera si los 16 artículos están indexados hoy, ni si reciben clics.** El proyecto invirtió semanas en construir el activo y cero disciplina en medir su rendimiento.
- **Clasificación: dato_no_disponible (el tráfico), hecho_verificado (la ausencia de registro).**

### 2.5 EEAT debilitado por decisiones propias (hecho verificado)

- El autor de los 16 artículos es `"author":{"@type":"Organization","name":"Equipo Horizonte Emirates"}` (verificado en `public/blog/impuestos-invertir-dubai-espana.html`, línea 33, y bloque visible en líneas 244-247). No hay ninguna persona con nombre, cargo ni credenciales.
- La página de equipo `/sobre/equipo.html` (construida el 07-06 como pieza EEAT) fue **retirada el 12-06-2026** (commit `46d5717`) y hoy redirige 301 a la home (`public/_redirects`, línea 13). `public/sobre/` está vacío.
- La propia estrategia calificaba el bloque de autor como "**Crítico para EEAT en YMYL**" (`docs/SEO_ESTRATEGIA.md`, §4, tabla de elementos del blog).
- Resultado: contenido fiscal y de inversión (máxima exigencia EEAT de Google) firmado por nadie, sin página de equipo, sin testimonios y sin backlinks. Es la combinación exacta que la estrategia advirtió que no rankea.

### 2.6 Cadencia editorial: parada total desde el lanzamiento (hecho verificado)

- Los 16 artículos se publicaron **en un solo lote el 07-06-2026** (todos los `lastmod` del sitemap y todos los `published`/`modified` del front-matter son 2026-06-07).
- Desde entonces, los únicos commits sobre `public/blog/` son del **24-07-2026** y no añaden contenido: unificación de CTA (`bc6ab04`) y alineación de rentabilidades a 6-12% (`3feb6c5`).
- El plan fijaba "Cadencia objetivo: **4 piezas/mes**" (`docs/SEO_ESTRATEGIA.md`, §6). Piezas siguientes ya identificadas y sin arrancar: planes de pago, convenio de doble imposición, hipoteca para extranjeros, errores al invertir (`contenido-blog/README.md`, mapa de clusters, filas con estado pendiente).
- En Drive existe además un Google Doc "24 artículos completos con toda la documentación SEO.gdoc" (`G:\Mi unidad\Horizonte Emirates\Blog\`) que no se pudo abrir en local (formato .gdoc). Si contiene artículos redactados sin publicar, hay inventario muerto adicional.

### 2.7 Interacción perversa con Google Ads (hecho verificado, impacto en conversión)

- Tarea **ADS-AUTOMATISMOS, prioridad "Crítica"** en `02_tareas.md` (línea 35, fechada 09-08): la expansión de URL final, AI Max y personalización de texto están activadas en la campaña de Búsqueda, y "con 16 artículos de blog publicados, puede estar desviando clics pagados fuera de la home con formulario". Sin verificar y **sin ejecutar a 20-08**.
- Es decir: hoy el principal riesgo del blog para la generación de leads no es lo que no atrae, sino que **puede estar absorbiendo clics de pago** hacia páginas cuyo camino de conversión es más largo (los artículos convierten solo vía enlace a `/#form`).

---

## 3. Lead magnet fiscal

### 3.1 Qué existe y cómo convierte (hecho verificado)

- Sección `#guia-fiscal` en la home (`public/index.html`, líneas 659-688): captura de **un solo campo de email** + doble casilla RGPD, con descarga inmediata. El comentario del código (líneas 665-666) confirma que se corrigió el **12-08**: antes el botón llevaba al formulario de 3 pasos y "no era una descarga".
- Circuito técnico completo en `public/assets/app.js` (líneas 605-692): evento GA4 `lead_magnet_submit_attempt`, envío a Web3Forms con consentimientos y tracking, apertura del PDF, evento `generate_lead` con `lead_source:'website_guia'`.
- Tres PDFs en `public/guias/`: v1 (206 KB), v2 completa (294 KB) y v2 ejecutiva (158 KB), generados el 09-06-2026. La que se entrega es la v1 (`GUIA_URL='guias/guia-fiscal-dubai-espana.pdf'`, app.js línea 605).
- **Valoración:** tras el arreglo del 12-08 es un mecanismo de conversión correcto y de fricción mínima. Es de lo poco de esta área que puede producir algo en 30 días, porque se apoya en el tráfico de pago ya existente.

### 3.2 Publicada sin validación profesional (inferencia, confianza alta; riesgo YMYL y reputacional)

- El propio proyecto declaró la validación de un asesor fiscal como **requisito previo a distribuir** el material fiscal: tarea **LI-05** ("Es la dependencia externa más lenta y bloquea el 20 % del contenido y el lead magnet principal", `02_tareas.md`, línea 135) y requisito expreso de LM-1: "`[VALIDACIÓN FISCAL]` sobre el documento completo antes de distribuirlo" (`09c_linkedin_operacion.md`, sección 17).
- LI-05 sigue **pendiente** (el borrador del correo al asesor está sin enviar en `LinkedIn\GUIA_ARRANQUE.md`, paso 5). Mientras tanto, la guía fiscal **lleva publicada y descargable desde junio** en la web.
- Los artículos llevan disclaimer ("no presta asesoramiento fiscal...", verificado en `impuestos-invertir-dubai-espana.md`), lo que mitiga pero no elimina el riesgo: se está distribuyendo contenido fiscal España-UAE sin que ningún profesional responda de su exactitud.

### 3.3 Las descargas quedan fuera del funnel: lista que nadie trabaja (hecho verificado)

- El asunto del email de registro de descarga está "**deliberadamente fuera del patrón del funnel**" (comentario literal en `app.js`, línea 637; asunto `[Descarga guia fiscal] email`). El detector de leads de la automatización (`isHorizonteWeb3Lead`, `automation/horizonte-emails.gs`, líneas 587-595) procesa los leads del formulario, no estas descargas como secuencia propia.
- No existe ninguna secuencia de nurturing para quien descarga la guía (la guía sí se adjunta en el email de bienvenida A1/B1/C1 de los leads del formulario, `horizonte-emails.gs` líneas 27 y 1459, pero eso es el flujo inverso). El plan de LM-1 preveía un correo de entrega más un correo de clasificación a los 3 días: **no implementado**.
- Consecuencia: cada email captado por la guía es un contacto que consintió recibir información y al que hoy no le llega nada salvo trabajo manual no registrado.
- Nota menor: el PDF es accesible por URL directa sin pasar por la captura (no está en sitemap, pero la URL es adivinable y pública).

### 3.4 Visibilidad del lead magnet (hecho verificado)

- La guía solo se ofrece en la home. **Ningún artículo del blog enlaza a la sección de descarga ni a `/guias/`**: en el artículo fiscal BOFU el CTA es "Solicitar análisis y recibir la guía" apuntando a `/#form` (verificado en `public/blog/impuestos-invertir-dubai-espana.html`, líneas 183-187; cero coincidencias de `guia-fiscal` o `/guias/` como enlace). El diario del 24-07 registra además: "Retiré el botón del blog del recurso gratuito" (`07_diario.md`, línea 1748).
- El plan original preveía la guía como CTA de todo el cluster fiscal (SEO_ESTRATEGIA §7). La ejecución la dejó como pieza aislada de la home.

---

## 4. LinkedIn

### 4.1 Lo diseñado (hecho verificado): un playbook sobredimensionado respecto a la capacidad de ejecución

- Tres documentos en Drive fechados 28-07-2026: `09_linkedin_estrategia.md` (101 KB), `09b_linkedin_contenidos.md` (59 KB, **20 posts completos + 4 carruseles + 6 publicaciones de conversión**), `09c_linkedin_operacion.md` (66 KB, 5 lead magnets, 8 plantillas de DM, protocolo de community management, cuadro de mando). Más `LinkedIn\GUIA_ARRANQUE.md` (10 KB, 30-07) con activos gráficos ya producidos (portada, avatar).
- Posicionamiento (resumen ejecutivo del doc 1): "el activo que puede exhibir no son sus resultados, es su criterio", dirigido a empresario/directivo con liquidez, ticket 500-900k, sin replicar el público de Ads. El propio documento reconoce sin rodeos: cero cierres, cero reseñas, cero testimonios.
- Decisión del 30-07 (diario, líneas 1879-1889 de `07_diario.md`): **versión mínima**, sin exposición personal, prohibidos LinkedIn Ads y Sales Navigator. El doc 1 cuantifica el coste de esa decisión: una página de empresa alcanza "aproximadamente una décima parte" de un perfil personal y el horizonte de resultados pasa "de 90 días a entre 5 y 7 meses".

### 4.2 Estado real (hecho verificado): el canal no existe

- `GUIA_ARRANQUE.md`, cabecera (30-07): "**ESTADO ACTUAL: BLOQUEADO EN EL PASO 2.** LinkedIn no permite crear la página de empresa porque la cuenta personal es de creación reciente".
- `02_tareas.md`, bloque LI-* (línea 111): "Estado 30/07/2026: ARRANQUE BLOQUEADO POR ANTIGÜEDAD DE CUENTA". Ninguna tarea LI-01 a LI-12 figura como completada.
- Las tres tareas que **sí se podían hacer sin LinkedIn** (LI-05 correo al asesor fiscal, LI-07 lista de 50 perfiles, LI-01 perfil sobrio) siguen sin evidencia de ejecución. El diario no tiene ninguna entrada posterior al 30-07-2026 (última entrada verificada en `07_diario.md`), así que no hay registro de ningún avance en las 3 semanas siguientes.
- **Conclusión: LinkedIn aporta hoy cero credibilidad, cero conversaciones y cero leads.** Es el activo muerto más caro en horas de diseño de todo el proyecto: unas 250 KB de playbook con cero ejecución en plataforma.

### 4.3 Valoración crítica (inferencia, confianza alta)

- El objetivo comercial del doc 1 (8-12 leads cualificados en 90 días) fue calibrado para el canal de marca con outbound manual diario de 45 minutos. Sin cuenta madurada, sin página, sin lista de prospección y sin nadie ejecutando outbound, ese objetivo es papel.
- El bloqueo real no es LinkedIn: es que las tareas desbloqueadas (madurar la cuenta con 15-20 contactos, enviar un correo ya redactado al asesor fiscal, montar una hoja con 50 perfiles) llevan 3 semanas sin ejecutarse. El patrón es el mismo del blog: diseño exhaustivo, ejecución interrumpida en el primer paso operativo.

---

## 5. Email marketing (hecho verificado)

- Secuencias completas por tier diseñadas e implementadas: Tier A 5 emails, Tier B 7, Tier C 8, con delays y copy (`docs/email/SECUENCIA_MENSAJES_TIERS.md`; versión ejecutable en `automation/horizonte-emails.gs`).
- **Cortadas desde el 30-07**: `AUTO_SEND_LEADS: false` (`horizonte-emails.gs`, línea 61). Solo queda el acuse de recibo automático; el resto se trabaja a mano con el kit `automation/MAILS-MANUALES.md` + generador. Decisión razonada en el diario del 30-07: con 1 lead a la semana, el trato manual convierte más.
- Valoración: la decisión es defendible con 2 leads/mes, pero deja al proyecto **sin ningún mecanismo de nurturing para contactos que no son leads del formulario** (descargas de la guía, futuros contactos LinkedIn). No hay newsletter, no hay lista activa, no hay ActiveCampaign operativo pese a figurar en el plan SEO (§7 y §9).
- Nota de datos personales: `04_metricas.md` contiene la ficha de un lead real con nombre, email y teléfono (sección "Leads reales identificados"). No se reproduce aquí; consta su existencia y ubicación a efectos de RGPD.

## 6. Vídeo, webinars y testimonios (hecho verificado): no existen

- Búsqueda en todo `public/` de `testimonio|webinar|youtube|vimeo|<video`: **cero resultados** (20-08-2026).
- El doc de LinkedIn confirma la causa raíz: "ningún cierre, ninguna reseña, ningún testimonio" (resumen ejecutivo de `09_linkedin_estrategia.md`). La tarea de prueba social (M17) sigue abierta desde junio.
- Existe una pieza diseñada de "Sesión informativa en directo" (CONV-4, `09b_linkedin_contenidos.md`), pero depende de un canal que no existe.
- En un sector con "fama de fraude" (palabras del propio doc de estrategia), la ausencia total de cara, voz y prueba social es un freno de conversión directo, no solo de SEO.

## 7. Autoridad del fundador y experiencia sobre el terreno

- **Exposición personal: renunciada por decisión expresa** (30-07): el perfil de Jesús se configura sobrio, "no publica nunca" (`GUIA_ARRANQUE.md`, paso 1), y la voz pública es solo la marca. La cara en Dubái se delega en Marc/RRS (doc 1, sección 8.5).
- **Visitas al terreno del fundador: sin evidencia.** Las 44+ entradas del diario (`07_diario.md`, hasta 30-07) registran todas como lugar Andorra (Edifici Teiers de Llorts). Las menciones a "viaje a Dubai" son un **servicio para clientes** (asistencia en destino con RRS), no viajes propios. Clasificación: dato_no_disponible; si existieran visitas, no están documentadas donde el proyecto documenta todo lo demás.
- Consecuencia estratégica: toda la experiencia real en Emiratos del proyecto está subcontratada al partner (RRS/Marc). La marca no puede exhibir ni una foto propia, ni una visita de obra, ni un "estuvimos allí". Para EEAT (Experience) y para la conversión de un inversor de ticket alto, es una carencia estructural que ningún volumen de contenido escrito compensa.

---

## 8. Qué puede generar demanda en 30 días vs autoridad a medio plazo

| Activo | ¿Demanda en 30 días? | ¿Autoridad a medio plazo? | Condición |
|---|---|---|---|
| Lead magnet fiscal en home | **Sí (única palanca real del área)**: convierte tráfico de pago ya comprado en emails | Sí | Trabajar las descargas (hoy nadie las procesa) y validar el contenido con el asesor (LI-05) |
| Blog 16 artículos | No (dominio joven, YMYL, 2,5 meses, sin EEAT ni enlaces) | Sí, en 6-12 meses | Retomar cadencia, autor con nombre, casos, enlaces; medir en Search Console |
| Enlace de artículos al lead magnet | Marginal pero inmediato (recuperar la captura en el cluster fiscal) | Sí | 1-2 horas de trabajo |
| LinkedIn | No (el canal no existe; horizonte propio declarado de 5-7 meses en versión de marca) | Posible | Ejecutar LI-01/01b/05/07, que llevan 3 semanas paradas |
| Outbound manual LinkedIn (DMs) | Sería la única vía rápida del playbook, pero exige perfil operativo y lista LI-07 | Sí | Decisión y ejecución diaria |
| Secuencias email | No aplican (2 leads/mes, trato manual correcto) | Neutral | Reactivar solo con volumen |
| Vídeo/webinar/testimonios | No existen | Imprescindibles para cerrar ticket alto | Requiere cierres o, al menos, presencia física en Emiratos |

## 9. Activos muertos hoy (construidos y sin distribución o sin uso)

1. **Playbook LinkedIn completo** (3 docs, 20 posts, 4 carruseles, 8 DMs, activos gráficos): cero publicaciones, cero cuenta operativa.
2. **Blog de 16 artículos**: publicado, congelado desde el 07-06, sin medición de rendimiento y sin una sola pieza nueva; ninguna keyword nueva atacada.
3. **Secuencias de email por tier** (20 emails de copy): desactivadas (decisión defendible, pero es inventario parado).
4. **Guía fiscal v2** (completa y ejecutiva, 09-06): generadas y no son la versión que se entrega (se entrega la v1).
5. **Emails de descargas de la guía**: capturados y no trabajados por ningún flujo.
6. **Google Doc "24 artículos completos con toda la documentación SEO"** en Drive\Blog: sin publicar (contenido sin verificar, no se pudo abrir).
7. **Página de equipo**: construida el 07-06, retirada el 12-06, hoy un directorio vacío y un 301.

## 10. Tabla consolidada de hallazgos

| # | Hallazgo | Tipo | Confianza | Impacto | Evidencia principal |
|---|---|---|---|---|---|
| 1 | Blog completo (16 artículos) publicado en un lote el 07-06 y congelado desde entonces; plan de 4 piezas/mes incumplido | hecho_verificado | alta | medio | git log `public/blog/`; `public/sitemap.xml` lastmod; `contenido-blog/README.md` |
| 2 | Los 16 artículos atacan keywords informacionales; no existe ninguna página transaccional de servicio | hecho_verificado | alta | medio | Front-matter de `contenido-blog/articulos/*.md`; ausencia de `public/servicios/` |
| 3 | Sin posibilidad realista de tráfico orgánico material a corto plazo (dominio joven, YMYL, 6-9 meses según la propia estrategia) | inferencia | alta | alto | `docs/SEO_ESTRATEGIA.md` §1 línea 23 y §4 línea 130 |
| 4 | El tráfico orgánico no está medido ni registrado en ningún archivo del proyecto | dato_no_disponible | alta | alto | `04_metricas.md` (solo Ads); única mención sin cifras en `07_diario.md` línea 1488 |
| 5 | EEAT autodebilitado: autor anónimo y página de equipo retirada el 12-06 | hecho_verificado | alta | medio | Commit `46d5717`; `public/_redirects` línea 13; JSON-LD de los artículos |
| 6 | Expansión de URL final de Ads puede estar desviando clics pagados al blog; tarea crítica sin ejecutar | hecho_verificado | alta | alto | `02_tareas.md` línea 35 (ADS-AUTOMATISMOS, 09-08) |
| 7 | Lead magnet fiscal operativo con captura de 1 campo desde el 12-08 (antes no era una descarga) | hecho_verificado | alta | medio | `public/index.html` líneas 659-688; `app.js` 605-692 |
| 8 | La guía fiscal se distribuye sin la validación de asesor fiscal que el propio proyecto fijó como requisito (LI-05 pendiente) | inferencia | alta | medio | `02_tareas.md` línea 135; `09c_linkedin_operacion.md` §17; `GUIA_ARRANQUE.md` paso 5 |
| 9 | Las descargas de la guía quedan deliberadamente fuera del funnel: sin scoring ni nurturing | hecho_verificado | alta | medio | `app.js` línea 637; `horizonte-emails.gs` líneas 587-595 |
| 10 | Ningún artículo del blog enlaza a la descarga de la guía; el botón se retiró el 24-07 | hecho_verificado | alta | bajo | grep en `public/blog/*.html`; `07_diario.md` línea 1748 |
| 11 | Canal LinkedIn inexistente: bloqueado en paso 2 desde el 30-07, tareas desbloqueadas (LI-01/05/07) sin ejecutar, sin registro de avance en 3 semanas | hecho_verificado | alta | alto | `GUIA_ARRANQUE.md` cabecera; `02_tareas.md` líneas 109-142; `07_diario.md` (última entrada 30-07) |
| 12 | La versión mínima de LinkedIn tiene horizonte propio declarado de 5-7 meses: no es palanca de 30 días | hecho_verificado | alta | medio | `09_linkedin_estrategia.md`, resumen ejecutivo |
| 13 | Secuencias de email diseñadas (20 mensajes) y cortadas desde el 30-07; solo acuse de recibo automático | hecho_verificado | alta | bajo | `horizonte-emails.gs` línea 61; `docs/email/SECUENCIA_MENSAJES_TIERS.md` |
| 14 | Cero vídeo, cero webinars, cero testimonios en toda la web | hecho_verificado | alta | alto | grep en `public/` (20-08-2026); `09_linkedin_estrategia.md` resumen |
| 15 | Sin evidencia de visitas del fundador a Emiratos; experiencia en terreno delegada por completo en el partner | dato_no_disponible | media | medio | `07_diario.md` (todas las entradas desde Andorra); menciones de viaje son servicio a clientes |
| 16 | Datos personales de un lead en `04_metricas.md` (existencia señalada, no reproducidos) | hecho_verificado | alta | bajo | `G:\Mi unidad\Horizonte Emirates\04_metricas.md`, sección "Leads reales identificados" |

---

## 11. Archivos revisados

Repositorio (`C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\`):

1. `docs/SEO_ESTRATEGIA.md` (completo)
2. `docs/email/SECUENCIA_MENSAJES_TIERS.md` (completo)
3. `contenido-blog/README.md` (completo)
4. `contenido-blog/articulos/como-invertir-inmuebles-dubai.md` (muestra)
5. `contenido-blog/articulos/impuestos-invertir-dubai-espana.md` (muestra, completo)
6. `contenido-blog/articulos/golden-visa-emiratos-guia.md` (muestra)
7. `contenido-blog/articulos/invertir-ras-al-khaimah.md` (muestra, completo)
8. `public/blog/` (inventario completo, 18 HTML; recuento de palabras de los 16 artículos; lectura parcial de `impuestos-invertir-dubai-espana.html`)
9. `public/guias/` (inventario: 3 PDF + 6 HTML, fechas y tamaños)
10. `public/index.html` (sección lead magnet, nav y footer)
11. `public/assets/app.js` (bloque lead magnet, líneas 605-692)
12. `public/sitemap.xml`, `public/_redirects` (grep dirigido)
13. `automation/horizonte-emails.gs` (grep dirigido: AUTO_SEND_LEADS, detector de leads, lead magnet)
14. Historial git de `public/blog/`, `public/guias/` y `public/sobre/`

Drive (`G:\Mi unidad\Horizonte Emirates\`):

15. `09_linkedin_estrategia.md` (índice completo + resumen ejecutivo)
16. `09b_linkedin_contenidos.md` (índice completo)
17. `09c_linkedin_operacion.md` (índice completo + sección 17, LM-1)
18. `LinkedIn/GUIA_ARRANQUE.md` (completo)
19. `04_metricas.md` (completo)
20. `02_tareas.md` (grep dirigido: bloque LI-*, tareas SEO/blog)
21. `01_estado_proyecto.md` (grep dirigido)
22. `07_diario.md` (entradas del 29-06, 24-07, 28-07 y 30-07; verificación de última entrada; grep de LinkedIn, blog y viajes)
23. `Blog/` (inventario de carpeta)

## 12. Archivos no abiertos y limitaciones

- `G:\Mi unidad\Horizonte Emirates\Blog\24 artículos completos con toda la documentación SEO.gdoc`: formato .gdoc (puntero de Google Docs), no legible en local. Contenido sin verificar.
- `09_linkedin_estrategia.md` secciones 9-13 y `09b`/`09c` cuerpo completo: leídos por índice y muestras, no línea a línea (más de 220 KB en conjunto); las afirmaciones citadas provienen de las secciones sí leídas.
- Google Search Console y GA4 (interfaces online): no accesibles desde esta auditoría; por eso el tráfico orgánico real se clasifica como dato no disponible, no como cero.
- No se pudo verificar el estado actual de la cuenta de LinkedIn en la plataforma (solo la documentación interna a 30-07).
