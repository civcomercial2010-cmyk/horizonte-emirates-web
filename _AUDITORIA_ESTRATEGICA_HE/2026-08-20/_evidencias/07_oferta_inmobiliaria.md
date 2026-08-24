# Área 7: Oferta inmobiliaria y material comercial

**Auditoría estratégica Horizonte Emirates · 20-08-2026**
**Auditor:** subagente Área 7 (experto inversión inmobiliaria UAE + dirección comercial)
**Modo:** solo lectura. Los .xlsx de datos se leyeron con openpyxl sin modificarlos.

---

## 0. Resumen ejecutivo

La oferta es real, el material de promotor es abundante (unos 3,8 GB de 12 proyectos) y el motor de Investment Packs es de calidad profesional. El problema no es la materia prima: es que **(1)** la cartera pública está casi vacía en el tramo de entrada que la propia web promete (un solo producto por debajo de 300.000 EUR, ninguno cerca de 150.000 EUR, cero producto terminado), **(2)** las simulaciones de rentabilidad no siguen la base estandarizada del 21-jul (gastos 30%, escenarios -20%/+40%): cada pack usa supuestos distintos (gastos anuales del 1% al 39%, revalorización del 5% al 10%) y dos packs (Binghatti y SAAS) contradicen en cifras lo que su propio texto dice al cliente, **(3)** hay claims de rentabilidad muy agresivos sin fuente (NH Collection: 19,4% de yield bruta y 21,6% de retorno total anual; Gianfranco Ferré: +25/30% hasta la entrega y +56% a 2031), y **(4)** una parte sustancial del activo comercial está sin explotar: Mondrian (469 MB y 3 sales offers de julio), Sobha City, Mercedes-Benz Places, y sobre todo los 10 PDF de memorandum ya generados que no aparecen por ningún sitio en la web como prueba de calidad o lead magnet. Un visitante de la web NO puede entender la oportunidad sin reunión: 4 de los 7 inmuebles no muestran precio y no hay ni un solo dato de rentabilidad, gastos o fiscalidad en proyectos.html. En un funnel que solo ha producido 2 leads en 30 días, esta opacidad deliberada es un coste, no una estrategia.

---

## 1. Inventario del material de promotor (Drive)

Fuente: `G:\Mi unidad\Horizonte Emirates\Proyectos Horizonte Emirates Jesus - Marc\`. Inventario por carpeta (no se abrieron renders ni vídeos, por instrucción). Consulta: 20-08-2026.

| Emirato | Proyecto (carpeta) | Archivos | Tamaño | Contenido destacado (por nombre de archivo) |
|---|---|---|---|---|
| Dubai | Mira - Bentley Villas | 2 | 0,6 MB | Un PDF "2026.pdf" (0,4 MB) y un screenshot. **Material mínimo** |
| Dubai | Mira - Richmond Apartments Al Furjan | 2 | 91,8 MB | FactSheet 91,7 MB + screenshot |
| Dubai | Artistry One - Select Group | 1 | 25,4 MB | Brochure |
| Dubai | Select Group - Peninsula Four | 1 | 11,6 MB | Brochure |
| Dubai | Mercedes Benz (Places) | 1 | 49,6 MB | Brochure digital |
| Dubai | Binghatti Wraith | 2 | 15,2 MB | E-brochure + floorplans (8-jun-2026) |
| Abu Dhabi | Sobha City | 6 | 147,7 MB | Factbook, 3 brochures, foto, vídeo |
| Abu Dhabi | Reportage | 0 | 0,0 MB | **Carpeta vacía** |
| RAK | NH Collection | 33 | 445,4 MB | Fact sheet, deck RRS 78,5 MB, 9 renders c0x, floorplans nivel a nivel |
| RAK | Gianfranco Ferré - AGENTS PACK | 89 | 730,8 MB | Brochure 110 MB, floorplans, payment plan, logos, 4 vídeos (115 MB), GF BUlk.xlsx |
| RAK | W by Marriott | 30 | 1.777,5 MB | Brochure, factsheet, floorplans, availability 01-jul, **3 vídeos = 1,06 GB** |
| RAK | Mondrian by Elevate | 42 | 469,2 MB | Factsheet, broker deck 77 MB, **3 sales offers de unidades concretas (23-jul-2026)**, 37 renders |

**Total: 12 proyectos, unos 3,77 GB.** Mezcla del material disponible: 6 Dubai, 2 Abu Dhabi (una vacía), 4 RAK. El peso en GB está en RAK (3,4 GB de 3,8).

---

## 2. Inventario de Investment Packs y su motor

Fuente: `G:\Mi unidad\Horizonte Emirates\Proyectos Horizonte Emirates Jesus - Marc\Investment packs\`.

### 2.1 El motor (_Sistema)

- `_Sistema\generar_deck.py` (leído íntegro, 603 líneas, 22-jul-2026): genera el PDF 16:9 desde el `Datos.xlsx` de cada carpeta de pack con Playwright/Chromium.
- `_Sistema\plantilla_deck.html` (verificado por grep): contiene el disclaimer legal en la línea 667 ("Documento informativo, no constituye oferta ni asesoramiento financiero... Rentabilidades estimadas, no garantizadas") y "Proyección ilustrativa · no garantizada" en la línea 546.
- **El Excel de datos NO está en _Sistema: hay un `Datos.xlsx` por carpeta de pack** (8 en total, todos localizados y leídos, ver 2.2). En `_Sistema` solo hay el .py, la plantilla y `__pycache__`.
- Calidad del motor (hecho verificado, líneas citadas de generar_deck.py):
  - Campos vacíos quedan vacíos y las páginas sin datos no se dibujan (líneas 10-17 y 407-425). Sin precio no hay rentabilidad "en cero" (líneas 237-240).
  - **Saneado legal automático** (líneas 510-543): elimina toda mención de que "Horizonte Emirates analiza/asesora" y protege la cláusula que NIEGA el asesoramiento. Los Config de NH, W, Brabus, Binghatti, Tilal y SAAS aún llevan `sello_portada = "Oportunidad analizada por Horizonte Emirates"`, pero el patrón SANEO de la línea 519 lo elimina en el HTML final. Control bien diseñado; el dato sucio sigue en origen.
  - Auditor de solapes de texto en el PDF (líneas 471-483).

### 2.2 Packs generados

| Pack (carpeta) | Datos.xlsx | PDF generado | Fecha PDF | Estado |
|---|---|---|---|---|
| Al Marjan (RAK)\Gianfranco Ferre Residences | Sí (22-jul) | Investment_Memorandum_Gianfranco_Ferre.pdf | 22-jul | Completo |
| Al Marjan (RAK)\Gianfranco Ferre Residences - Unidad 420 | Sí (23-jul) | ..._Unidad_420.pdf | 23-jul | Completo (unidad concreta) |
| Al Marjan (RAK)\NH Collection | Sí (22-jul) | 2 PDF (proyecto + Unidad 604) | 22 y 23-jul | Completo |
| Al Marjan (RAK)\W by Marriot | Sí (22-jul) | ..._W_Residences_Al_Marjan_Island.pdf | 22-jul | Completo |
| Abu Dhabi\Brabus | Sí (22-jul) | ..._BRABUS_Island_Abu_Dhabi.pdf | 22-jul | Completo |
| Dubai\Binghatti Wraith Al Jaddaf | Sí (22-jul) | ..._Binghatti_Wraith.pdf | 22-jul | Completo |
| Dubai\Tilal binghatti | Sí (22-jul) | ..._Tilal_Binghatti.pdf | 22-jul | **Sin precios, sin plan de pagos, sin simulación** (hojas vacías; comparables "[añadir]") |
| Dubai\SAAS Hills | Sí (30-jul) | 2 PDF (uno _NUEVO 30-jul) | 22 y 30-jul | Completo, pero plan de pagos "Pendiente" |
| Dubai\D villas by Dar Global | **No** | No | n/a | Solo brochure (23,6 MB) + screenshot |

Total: 10 PDF de memorandum sobre 8 proyectos. Ninguno enlazado ni mostrado en la web (verificado: proyectos.html no contiene ningún enlace a memorandum ni PDF).

---

## 3. Cobertura por tramo de presupuesto

Precios de lista en EUR según los `Datos.xlsx` (tipo de cambio 4,288 salvo indicación). El encargo original de Marc era 2 packs por tramo (memoria del proyecto, 24-jun).

| Tramo | Producto disponible (pack) | Veredicto |
|---|---|---|
| 150-300k EUR | **Solo SAAS Hills estudio: 236.862 EUR** | **Tramo casi vacío. 1 producto. Nada entre 150k y 236k** |
| 300-600k EUR | Binghatti 1BR 305.970 · GF estudio 373.134 · SAAS 1BR 392.278 · NH habitación 401.038 · Binghatti 2BR 489.739 · GF 1 dorm 583.022 | Bien cubierto (6 opciones) |
| 600k-1M EUR | SAAS 2BR 715.186 · NH suite 823.812 · BRABUS 2BR ~858.000 · GF 2 dorm 886.194 · W 1BR 946.828 · SAAS 3BR 970.484 | Bien cubierto |
| +1M EUR | GF dúplex (1,0-3,3M) · W 2BR a dúplex 4 (1,5-7,3M) · BRABUS townhouse/villas (2,7-5,5M) · SAAS sky villas 1,65M · NH planta 5 completa 9,5M · Bentley y Tilal **sin precio en ningún documento interno** | Cubierto en papel; Bentley y Tilal sin lista de precios |

**Lectura de director comercial:** la web promete en el hero "Invierta en pisos en Dubai desde 30.000€ de entrada" y la FAQ dice "con 30.000€ puede acceder a propiedades desde 150.000€" (public\index.html líneas 85 y 770), y el formulario ofrece las casillas "Menos de 150.000€" y "150.000 a 300.000€" (líneas 124-125). **No existe ningún producto en cartera a 150.000 EUR, ni en la web ni en los packs**; el más barato es el estudio SAAS a 237k (entrada 10-20% = 24-47k). El tramo que con más probabilidad llega por Google Ads (ticket bajo) aterriza en una cartera que no tiene producto para él. Esto degrada la calidad percibida y puede explicar parte de la no conversión: el lead de 150k rellena el formulario y no hay nada que ofrecerle salvo subirle el ticket.

---

## 4. La cartera pública (proyectos.html) frente a la cartera interna

Fuente: `c:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\public\proyectos.html` (leído íntegro, 435 líneas).

| # | Proyecto web | Zona | Precio mostrado | Plan de pagos mostrado | Pack interno |
|---|---|---|---|---|---|
| 1 | NH Collection Residences | RAK | Desde 399.000€ (línea 116) | No | Sí |
| 2 | Mira Bentley Villas | Dubai | **No** | No | No (material interno: 0,6 MB) |
| 3 | Gianfranco Ferré Residence | RAK | **No** | No | Sí (2 packs) |
| 4 | SAAS Hills | Dubai | desde 242.000€ (línea 252) | No | Sí |
| 5 | Binghatti Wraith | Dubai | desde 299.000€ (líneas 292 y 298) | Sí: "plan 20/80 o 50/50 con un 3% de descuento" (línea 299) | Sí |
| 6 | W Residences Al Marjan | RAK | **No** | No | Sí |
| 7 | BRABUS Island | Abu Dhabi | **No** | Parcial: "20% de entrada y 1% mensual, o hasta un 10% de descuento" (línea 389) | Sí |

Hechos verificados sobre la página:

- **4 de 7 inmuebles sin precio.** La sección "Cartera bloqueada" (líneas 401-415) declara que "Precios de compra, rentabilidad estimada y la estructura de cada operación solo se comparten en el análisis personalizado", pero 3 proyectos sí muestran precio: el criterio es incoherente a ojos del visitante.
- **Cero datos de rentabilidad, gastos, fiscalidad o proceso de compra en la página.** El único texto sobre rentabilidad es el disclaimer del footer ("Rentabilidades estimadas, no garantizadas", línea 442). La fiscalidad España-UAE existe en la web pero en guías y blog (p. ej. `public\guias\guia-fiscal-dubai-espana.html`), no enlazadas desde proyectos.html.
- **100% off-plan, entregas dic-2027 a Q1-2029.** No hay ni un inmueble terminado (secondary) en la cartera pública ni en los packs, pese a que la FAQ del index y el blog ofrecen "mercado secundario desde 150.000€" (index.html línea 770; blog\como-invertir-inmuebles-dubai.html línea 174). Oferta y promesa no casan.
- **Concentración de tesis:** 3 de 7 proyectos (43%) están en la misma isla (Al Marjan, RAK) y dependen del mismo catalizador único: la apertura del casino Wynn en 2027. Si el Wynn se retrasa o decepciona, casi media cartera pública comparte el golpe. La propia hoja Zona de W lo admite ("muy ligado a un único proyecto de referencia").
- **Coherencia interna de la web: correcta.** Los 3 precios del hero del index (242k, 299k, 399k, index.html líneas 96-112) coinciden con proyectos.html (commit 340932d "Un solo precio por inmueble en toda la web").

**¿Puede un cliente entender la oportunidad sin reunión previa?** Con la web sola, no: sin precio en 4 de 7, sin yields, sin gastos, sin plan de pagos completo, sin fiscalidad enlazada. Con el pack sí, en gran medida: 13-14 páginas con precio, plan de pagos, proceso de compra paso a paso, riesgos y una franja pedagógica "En claro" por página. Pero el pack solo llega tras contacto y envío manual (los envíos automáticos están cortados desde el 30-jul: AUTO_SEND_LEADS=false, según memoria del proyecto). El puente entre ambos mundos no existe.

---

## 5. Calidad y honestidad de las simulaciones

Fuente: hoja `Simulacion`, `Escenarios`, `Riesgos` y `Deck` de cada `Datos.xlsx` (leídas con openpyxl el 20-08-2026), cruzadas con `generar_deck.py` (cálculo: renta neta = alquiler x (1 - gastos anuales) / precio EUR; retorno total = renta neta + revalorización anual; líneas 224-241 del .py) y con `plantilla_deck.html` (línea 590 imprime "gastos anuales {{gastos_pct}} %" en el PDF).

### 5.1 La "base fijada el 21-jul (gastos 30%, escenarios -20%/+40%)" NO está aplicada de forma uniforme

| Pack | % gastos anuales (Simulacion) | Ajuste conserv./optim. | Revalorización anual | Nota de Escenarios en el Excel |
|---|---|---|---|---|
| GF Residences (principal) | **35%** | -10% / +30% | 10% | Dice "conservador -15% / optimista +10%" (desfasada) |
| GF Unidad 420 | **30%** | **-20% / +40%** | 7% | Dice "-20% / +40%" (única que cumple la base) |
| NH Collection | **39%** | -20% / +30% | 10% | n/a |
| W by Marriott | **20%** | -10% / +40% | 10% | Dice "-15% / +10%" (desfasada) |
| BRABUS | **15%** | -10% / +40% (villas +20%) | 6% | n/a |
| Binghatti Wraith | **1%** | -10% / +25% | 5-6% | n/a |
| SAAS Hills | **2%** | -20% / +40% | 7% | n/a |
| Tilal Binghatti | (vacía) | n/a | n/a | Correcto: "Sin lista de precios oficial no publicamos estimación" (hoja Riesgos) |

**Veredicto: la base del 21-jul solo la cumple 1 de 8 packs.** Los supuestos varían pack a pack sin justificación documentada, lo que rompe la comparabilidad (ver 5.4).

### 5.2 Dos packs contradicen en cifras su propio texto al cliente (hecho verificado)

- **Binghatti Wraith:** la Simulacion usa **1% de gastos anuales**, así que el PDF imprime "gastos anuales 1 %" y una renta neta de ~8,1% (25.000 x 0,99 / 305.970). Pero el `claro_7` del mismo Excel (hoja Deck) dice al cliente: "De cada 100 € de alquiler, unos **15 €** se van en comunidad, gestión y meses sin inquilino". Con el 15% real que declara el texto, la renta neta sería ~6,9%. **El número del PDF infla la renta neta ~1,2 puntos frente a su propia narrativa.**
- **SAAS Hills:** Simulacion usa **2% de gastos**, mientras el `claro_7` dice "unos **30 €** de cada 100" y la hoja Riesgos afirma "Estimaciones prudentes: **30 % de gastos anuales**". Con el 30% declarado, la renta neta del estudio sería ~5,2%, no el ~7,3% que imprime el PDF. **La contradicción convive dentro del mismo documento entregable** (la página de rentabilidad muestra 2% y la página de riesgos habla de 30%).
- En cambio W (20% en cifra y en texto) y BRABUS (15% y 15) son coherentes, y GF/NH usan gastos duros (35-39%).

### 5.3 Claims de rentabilidad agresivos y sin fuente

- **NH Collection:** alquiler estimado de **78.000 EUR/año para una habitación de hotel de 40 m² comprada por 401.038 EUR = 19,4% de yield bruta**, neta 11,4% tras el 39% de gastos, y "Total anualizado" del **21,6%** al sumar un 10% de revalorización anual. La hoja Riesgos lo describe como "estimaciones deliberadamente prudentes". Un 19,4% bruto en una llave de hotel de un destino aún sin abrir no es prudente bajo ningún estándar del sector (los hotel keys maduros en UAE rondan el 7-10% bruto). No consta ninguna fuente (el claro_7 remite al "plan de explotación hotelera" del promotor, no adjunto). **Riesgo reputacional alto.**
- **Gianfranco Ferré:** hoja Deck, campos `reval_entrega = 25`, `reval_entrega_txt = "+25 a 30 %"`, `reval_horizonte = 56`: el deck dibuja una trayectoria de 373.134 EUR a ~466k en la entrega (Q1-2028) y ~582k en 2031, **+56% en 5 años presentado con cifras concretas y sin fuente** (la nota al pie solo alude a subidas 2024-2025 en Al Marjan). Además el alquiler estimado del estudio (50.000 EUR sobre 373k = 13,4% bruto) casi triplica la referencia del mercado residencial de RAK. Llama la atención que el pack de la Unidad 420 (un día después) usa 33.000 EUR para el mismo tipo de estudio: **el mismo activo cambia un 34% de renta estimada entre dos documentos.**
- **W by Marriott:** los KPI de zona afirman "Ocupación hotelera del 90%, la más alta entre los grandes destinos de juego" y "7.000 habitaciones que faltan cada noche" (hoja Zona y DeckListas). Cifras de material del promotor presentadas como hechos, sin fuente citada.
- **Metodología del "Retorno total":** es la suma simple de yield neta + revalorización anual (generar_deck.py línea 237: `total = y_neta + reval`). No es una TIR: ignora que en off-plan no hay renta hasta la entrega (2027-2029), ignora el calendario de pagos y los costes de salida. Presentar "21,6% anual" (NH) o "18,4% anual" (GF) como "Retorno anual estimado" (plantilla, líneas 370 y 605) sobreestima de forma estructural el retorno realmente anualizable de una compra sobre plano.
- **Errores de datos cruzados:** en W, la fila "3 dorm. dúplex" de Simulacion usa el precio 7.366.000 AED, que es el del dúplex de Gianfranco Ferré (el de W cuesta 19.420.000 AED según su propia hoja Precios): resto de un copy-paste entre packs. En GF, la hoja Precios lista el 1 dormitorio a 2.500.000 AED pero la Simulacion usa 2.399.000. Ninguno rompe el PDF (protagonizan otras unidades), pero revelan que los Excel no pasan control cruzado.
- **Contrapeso positivo (verificado):** disclaimer legal en cada PDF (plantilla línea 667), "Proyección ilustrativa · no garantizada" en la trayectoria (línea 546), saneado automático de claims de asesoramiento (generar_deck.py líneas 510-543), la web usa "precio de lista del promotor" y el footer "Rentabilidades estimadas, no garantizadas", y el claim de liquidez de Bentley está matizado "(sujeta al ciclo de mercado)" (proyectos.html línea 163). Tilal rehúsa publicar rentabilidad sin precios oficiales. La cultura de saneado existe; la disciplina numérica, no.

### 5.4 Comparabilidad entre proyectos: rota

Un lead que reciba dos packs no puede compararlos en igualdad de condiciones:

- **Tipo de cambio:** 4,288 en 7 packs, 4,19 en GF Unidad 420, y la web implica ~4,20 (SAAS 242k = 1.015.663/4,20) y ~4,39 (Binghatti 299k = 1.311.999/4,39). **El mismo inmueble tiene 2 precios "de lista": Binghatti 299.000 en web vs 305.970 en pack; SAAS 242.000 en web vs 236.862 en pack (portada del pack: "Desde 236.900 €").** Diferencias del 2%, todas etiquetadas "precio de lista del promotor".
- **Revalorización anual asumida:** 10% (GF, NH, W), 7% (SAAS, GF-420), 6% (BRABUS), 5-6% (Binghatti). Sin metodología documentada en ningún archivo. El "Total anualizado" que ve el cliente depende más del supuesto que del activo: NH 21,6% vs Binghatti 13,1% no es una comparación de activos, es una comparación de optimismos.
- **Comparables:** hojas con placeholders sin resolver en packs ya entregables: W ("[Otra branded residence de Al Marjan] [pendiente]"), BRABUS ("[ Comparable de zona - pendiente ]"), Binghatti ("[ Comparable de zona - añadir ]"), SAAS ("[ Comparable de zona pendiente de contrastar ]"), Tilal (los 3 vacíos).
- **Gastos de compra:** 4% uniforme en todas las Simulaciones, aunque la propia hoja Riesgos de BRABUS dice que en Abu Dhabi la tasa municipal es el 2% y que el precio no incluye el parking (AED 100.000). El 4% homogéneo no refleja las diferencias reales Dubai (4% DLD) / RAK / Abu Dhabi (2%).

### 5.5 Transparencia sobre comisiones: inexistente

Ni la web ni ningún pack mencionan cómo cobra Horizonte Emirates ni RnR Real Estate. El claro_8 de todos los packs ("Si un proyecto no supera este análisis/filtro, no te lo presentamos") sugiere un rol de filtro independiente, cuando el modelo real es comisión de promotor y, según la memoria del proyecto (contrato RRS, 13-jul), **el 3% pactado solo cubre NH Collection y el resto de proyectos exige confirmación escrita caso a caso que no consta**. Cobrar por comisión es estándar en UAE y no exige publicar el porcentaje, pero presentarse como filtro sin declarar el conflicto de interés es un riesgo reputacional, y comercializar packs de proyectos sin acuerdo de comisión confirmado es un riesgo de negocio directo (trabajo a resultado cero).

### 5.6 Frescura de los datos

A 20-08-2026, las listas de disponibilidad más recientes en las carpetas tienen entre 4 y 8 semanas: NH 18-jul, SAAS 15-jul, W 01-jul, BRABUS 25-jun, Mondrian (sales offers) 23-jul. En off-plan de venta rápida, precios y unidades citados en packs y web pueden estar ya caducos; ningún documento indica fecha de validez del precio salvo el disclaimer genérico "a julio de 2026" de la plantilla.

---

## 6. Activos valiosos infrautilizados

| Activo | Evidencia | Situación |
|---|---|---|
| **10 PDF de Investment Memorandum ya generados** | Carpetas de Investment packs (sección 2.2) | No están en la web ni como muestra ni como lead magnet gated. Es el mejor material de conversión del proyecto y el visitante no sabe que existe |
| **Mondrian by Elevate (RAK)** | Rak\Mondrian by elevate: 42 archivos, 469 MB, broker deck, factsheet y 3 sales offers de unidades concretas (23-jul) | Sin pack, sin presencia web. Es el 4º proyecto RAK y diversificaría la tesis Wynn con otro operador (Ennismore/Accor) |
| **Sobha City (Abu Dhabi)** | Abu Dhabi\Sobha city: 147,7 MB | Sin pack, sin web. Abu Dhabi solo tiene BRABUS público (ticket 850k+); Sobha daría producto AD de ticket medio |
| **Mercedes-Benz Places, Artistry One, Peninsula Four, Richmond** | Carpetas Dubai (sección 1) | 178 MB de material de marca sin explotar en ningún canal |
| **Vídeos de promotor** | W: 1,06 GB (brand film, CGI); GF: teasers horizontales y verticales (115 MB) | Sin canal de vídeo ni uso en web/RRSS. El teaser vertical de GF es contenido listo para Reels/Shorts |
| **D Villas by Dar Global** | Investment packs\Dubai\D villas: brochure 23,6 MB, sin Datos.xlsx | Pack empezado (carpeta creada 18-jul) y abandonado |
| **Pack Tilal Binghatti** | PDF de 3,7 MB generado sin precios ni plan de pagos | Semiproducto: no entregable a cliente |
| **Base de datos maestra projects_master** | `database\projects_master_schema.md` (esquema v1.0 abril 2026: 200-500 proyectos, scoring, matching engine, flujo semanal) | Diseño completo y sofisticado; no hay evidencia en el repo de que esté poblada ni operativa (el Sheets no es accesible desde esta auditoría). El catálogo real opera con 7-12 proyectos gestionados a mano |
| **Carpeta Reportage (Abu Dhabi)** | 0 archivos | Vacía: o se pide material o se elimina |

---

## 7. Claims sin justificar y riesgos reputacionales (lista consolidada)

| # | Claim | Dónde | Gravedad |
|---|---|---|---|
| 1 | Yield bruta 19,4% y retorno total 21,6% anual calificados de "deliberadamente prudentes" | NH Datos.xlsx, hojas Simulacion y Riesgos | Alta |
| 2 | Revalorización GF "+25 a 30%" hasta Q1-2028 y +56% a 2031, con cifras en EUR dibujadas en el deck | GF Datos.xlsx, hoja Deck (reval_entrega, reval_horizonte) | Alta |
| 3 | PDF que imprime "gastos anuales 1%" (Binghatti) y "2%" (SAAS) contradiciendo el 15%/30% de su propio texto | Datos.xlsx de ambos + plantilla línea 590 | Alta (coherencia del documento) |
| 4 | "Retorno anual estimado" = yield + revalorización, sin TIR ni calendario de pagos, en compras que no rentan hasta 2027-2029 | generar_deck.py línea 237 + plantilla líneas 370/605 | Media-alta |
| 5 | "antes de que la apertura del Wynn empuje los precios al alza" y "El precio del m² todavía no refleja el potencial de la zona" presentados como certezas | proyectos.html líneas 110-112 y 208 | Media |
| 6 | "Ocupación hotelera del 90%... faltan 7.000 habitaciones cada noche" sin fuente | W Datos.xlsx, hojas Zona y DeckListas | Media |
| 7 | "vistas que no se pueden tapar con nueva construcción" (claim absoluto) | proyectos.html líneas 293-294 | Baja |
| 8 | Hero "desde 30.000€ de entrada" y FAQ "propiedades desde 150.000€" sin ningún producto a ese precio en cartera | index.html líneas 85 y 770 | Media-alta (promesa sin producto) |
| 9 | Rol de "filtro/análisis" (claro_8) sin declarar el modelo de comisión, con acuerdos de comisión sin confirmar por escrito salvo NH | Todos los Datos.xlsx, hoja Deck, claro_8 + memoria contrato RRS | Media (reputacional) y alta (negocio) |
| 10 | Comercializar públicamente Mira Bentley Villas con 0,6 MB de material interno y sin precio ni pack | proyectos.html líneas 130-173 + carpeta Dubai\Mira - Bentley Villas | Media |

---

## 8. Decisiones recomendadas (orientadas a las 2 conversiones/30 días)

1. **Corregir Binghatti y SAAS hoy:** poner el % de gastos real (15% y 30%) en la hoja Simulacion y regenerar los PDF. Es la incoherencia más fácil de detectar por un cliente informado y la más barata de arreglar (2 celdas + 2 comandos).
2. **Estandarizar de verdad la base de simulación** (un solo tipo de cambio, gastos por tipo de producto: residencial larga estancia / holiday home / hotel key, revalorización con fuente o sin página de trayectoria) y regenerar los 7 packs. Sin esto, no enviar dos packs al mismo lead.
3. **Rebajar NH y GF a supuestos defendibles** (o adjuntar el plan de explotación del promotor como anexo citado). Un 21,6% anual "prudente" es indefendible ante cualquier inversor con experiencia y ante un regulador.
4. **Publicar un memorandum de muestra** (el de mejor calidad, con datos ya validados) como prueba de nivel en proyectos.html o como lead magnet gated. Es el activo de conversión más valioso y está invisible.
5. **Cubrir el tramo 150-300k o dejar de prometerlo:** activar Mondrian y/o Sobha City (material ya disponible) si tienen tickets de entrada, o eliminar "desde 150.000€" y la casilla "Menos de 150.000€" del funnel.
6. **Cerrar por escrito la comisión de cada proyecto activo antes de seguir invirtiendo horas en packs** (hoy solo NH está cubierto).
7. Decisión de cartera (para el usuario): diversificar la tesis pública (3 de 7 dependen del Wynn) o asumir explícitamente la concentración como apuesta y comunicarla como tal.

---

## 9. Archivos revisados

Leídos íntegros o parseados campo a campo:

1. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\public\proyectos.html` (435 líneas)
2. `C:\Users\User\Desktop\Propulse IA Repositorio Proyectos\Horizonte Emirates\database\projects_master_schema.md` (253 líneas)
3. `G:\...\Investment packs\_Sistema\generar_deck.py` (603 líneas)
4. `G:\...\Investment packs\_Sistema\plantilla_deck.html` (por grep dirigido: disclaimers y campos de rentabilidad)
5. `G:\...\Investment packs\Al Marjan (RAK)\Gianfranco Ferre Residences\Datos.xlsx` (13 hojas, openpyxl solo lectura)
6. `G:\...\Investment packs\Al Marjan (RAK)\Gianfranco Ferre Residences - Unidad 420\Datos.xlsx`
7. `G:\...\Investment packs\Al Marjan (RAK)\NH Collection\Datos.xlsx`
8. `G:\...\Investment packs\Al Marjan (RAK)\W by Marriot\Datos.xlsx`
9. `G:\...\Investment packs\Abu Dhabi\Brabus\Datos.xlsx`
10. `G:\...\Investment packs\Dubai\Binghatti Wraith Al Jaddaf\Datos.xlsx`
11. `G:\...\Investment packs\Dubai\Tilal binghatti\Datos.xlsx`
12. `G:\...\Investment packs\Dubai\SAAS Hills\Datos.xlsx`
13. `C:\...\public\index.html` (parcial, por grep: hero, capitales, FAQ)

Inventariados sin abrir (por instrucción o formato): los 12 proyectos de material de promotor de `G:\Mi unidad\Horizonte Emirates\Proyectos Horizonte Emirates Jesus - Marc\` (Dubai, Abu Dhabi, Rak: listados con nombre, tamaño y fecha), todos los renders, vídeos y brochures PDF de promotor, y los 10 PDF de Investment Memorandum generados (su contenido se infirió del Datos.xlsx + plantilla + motor, no del PDF renderizado).

## 10. No pude abrir / datos no disponibles

- Los PDF de promotor y los PDF de memorandum generados (no abiertos: fuera de alcance de esta pasada; el contenido de los memorandums se reconstruyó desde sus fuentes de datos).
- `NH Collection - Available Units - 18 July 2026.xlsx`, `UAE BRABUS PROJECTS Availability_25 JUNE 2026.xlsx`, `GF BUlk.xlsx`: localizados, no parseados (disponibilidad puntual, no crítica para el veredicto).
- La base de datos maestra en Google Sheets (ID en `projects_master_schema.md`): no accesible desde esta sesión; **no puedo verificar si projects_master está poblada u operativa**.
- Precio de lista de Mira Bentley Villas y Tilal Binghatti: no consta en ningún archivo revisado.
- Fuente original de los claims "ocupación 90%", "7.000 habitaciones", "+15-20% off-plan RAK": presumiblemente factsheets del promotor no auditadas.
