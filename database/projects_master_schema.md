# Base de Datos Maestra — Horizonte Emirates
# Google Sheets Schema · v1.0 · Abril 2026

**Spreadsheet ID:** `133X4oyXfvAusuhvme7eYISNPfSZ1N0BkIt3oq1WKxXc`
(misma hoja que el CRM de leads — añadir las nuevas pestañas aquí)

---

## Arquitectura de pestañas

| Pestaña | Filas aprox. | Descripción |
|---|---|---|
| `projects_master` | 200–500 | Un proyecto por fila. Base principal del catálogo. |
| `project_units` | 500–2000 | Una tipología por fila dentro de un proyecto. |
| `developers` | 20–50 | Una fila por promotora. |
| `leads` | existente | CRM de leads ya activo. No modificar estructura. |
| `lead_matches` | generada | Matches generados por el motor de recomendación. |
| `sources` | 10–20 | URLs fuente para actualización automática. |
| `change_log` | acumulativa | Registro de cambios de valor en proyectos. |
| `manual_review` | variable | Proyectos marcados para revisión manual. |
| `dashboard` | — | Pestaña de fórmulas y gráficas para el panel interno. |

---

## Pestaña: `projects_master`

Fuente inicial: `export-propertyfinder-dubai.pipe` (PropertyFinder, abril 2026)

| # | Columna | Tipo | Descripción | Valores posibles |
|---|---|---|---|---|
| A | `project_id` | string | ID único generado: `PROMOTORA3_NOMBRE5_###` | `EMM_GOLFH_001` |
| B | `promotora` | string | Nombre exacto de la promotora | `Emaar Properties` |
| C | `nombre_proyecto` | string | Nombre del proyecto | `Golf Hillside` |
| D | `zona_principal` | string | Zona principal de Dubai / UAE | `Dubai Hills Estate` |
| E | `sub_zona` | string | Sub-zona o nombre del master-plan | `Golf Hillside` |
| F | `ciudad` | string | Ciudad principal | `Dubai`, `Ras Al Khaimah`, `Abu Dhabi`, `UAQ` |
| G | `tipo_unidades` | string | Tipologías disponibles | `0, 1, 2, 3 \| apartment` |
| H | `plan_pago_raw` | string | Plan de pago tal como figura en fuente | `10/70/20` |
| I | `post_handover` | string | ¿Tiene pago post-handover? | `Sí` / `No` |
| J | `handover_raw` | string | Handover tal como figura en fuente | `Q4 2028` |
| K | `handover_trimestre` | string | Trimestre extraído | `Q4` |
| L | `handover_anyo` | integer | Año extraído | `2028` |
| M | `launch_status` | string | Estado de lanzamiento | `lanzado` / `preventa` / `agotado` |
| N | `disponibilidad` | string | Disponibilidad de unidades | `disponible` / `limitado` / `agotado` |
| O | `perfil_inversor` | string | Perfil primario (del scraping) | `Alta rentabilidad` / `Revalorización` / `Lujo` / `Entrada baja` |
| P | `score_rentabilidad` | integer (1–10) | Score de potencial de renta | `8` |
| Q | `score_revalorizacion` | integer (1–10) | Score de potencial de revalorización | `7` |
| R | `score_lujo` | integer (1–10) | Score de posicionamiento lujo | `4` |
| S | `score_entrada_baja` | integer (1–10) | Score de accesibilidad de entrada | `9` |
| T | `golden_visa_fit` | string | ¿Aplica bien para Golden Visa UAE? | `Sí` / `No` / `Probable` |
| U | `precio_desde_aed` | integer | Precio mínimo conocido en AED | `850000` |
| V | `precio_desde_eur` | integer | Precio mínimo aprox. en EUR (AED × 0.25) | `212500` |
| W | `developer_score` | integer (1–10) | Solidez y reputación de la promotora | `9` |
| X | `activo_web` | string | ¿Mostrar en horizonteemirates.com? | `Sí` / `No` |
| Y | `destacado_web` | string | ¿Mostrar como "destacado"? | `Sí` / `No` |
| Z | `fuente` | string | Fuente del dato | `PropertyFinder` / `Bayut` / `manual` |
| AA | `fuente_url` | string | URL página oficial del proyecto (enlace en Telegram) | `https://...` |
| AB | `foto_url` | string | URL **directa** de imagen (`.jpg`/`.png`/`.webp` o CDN); no uses la URL de la página HTML | ver `telegram_oportunidades.gs` |
| AC | `ultima_actualizacion` | date | Fecha de última actualización | `2026-04-19` |
| AD | `notas_internas` | string | Notas equipo; si hay `foto_url`, puede ser HTML largo enviado como 2.º mensaje tras la foto | texto / HTML |

### Valores normalizados para `perfil_inversor`

| Valor | Descripción operativa |
|---|---|
| `Alta rentabilidad` | Yield esperado >6% bruto. Apto para alquiler a corto o largo plazo. |
| `Revalorización` | Capital appreciation como driver principal. Off-plan en zonas en expansión. |
| `Lujo` | Producto premium/branded. Ticket alto. Marca fuerte del developer. |
| `Entrada baja` | Precio de entrada competitivo. Accesible con capital desde 150k€. |

### Escala `developer_score` (1–10)

| Score | Promotoras de referencia |
|---|---|
| 9–10 | Emaar, Nakheel, Meraas |
| 7–8 | Damac, Sobha, Ellington |
| 5–6 | Binghatti, Azizi, Danube, Imtiaz |
| 3–4 | OCTA, Citi Developers, Select Group |
| 1–2 | Promotoras sin track record conocido |

---

## Pestaña: `project_units`

Una fila por cada combinación tipología + proyecto. Para matching de alta precisión.

| # | Columna | Tipo | Descripción |
|---|---|---|---|
| A | `unit_id` | string | `project_id` + `_` + tipo (`EMM_GOLFH_001_1BR`) |
| B | `project_id` | string | FK → `projects_master.project_id` |
| C | `unit_type` | string | Studio / 1BR / 2BR / 3BR / Villa / Penthouse |
| D | `bedrooms` | integer | Número de dormitorios (0 = Studio) |
| E | `size_sqft_from` | integer | Tamaño mínimo en sq ft |
| F | `price_from_aed` | integer | Precio desde en AED |
| G | `price_from_eur` | integer | Precio desde en EUR (AED × 0.25) |
| H | `plan_pago` | string | Plan de pago específico de esta tipología |
| I | `post_handover` | string | Sí / No |
| J | `disponibilidad` | string | disponible / limitado / agotado |
| K | `yield_estimado` | decimal | Yield bruto estimado (ej. 0.065 = 6.5%) |
| L | `perfil_inversor` | string | Perfil específico de esta tipología |

---

## Pestaña: `developers`

Una fila por promotora. Enriquece el scoring y las recomendaciones.

| # | Columna | Tipo | Descripción |
|---|---|---|---|
| A | `developer_id` | string | Código corto: `EMAAR`, `DAMAC`, `NAKHL` |
| B | `developer_name` | string | Nombre oficial completo |
| C | `segmento` | string | `mass` / `premium` / `luxury` / `branded` |
| D | `zonas_principales` | string | Zonas de mayor actividad |
| E | `fiabilidad_handover` | integer (1–10) | Historial de cumplimiento de plazos |
| F | `brand_strength_score` | integer (1–10) | Reconocimiento de marca |
| G | `notas` | string | Observaciones relevantes |

### Datos de promotoras activas en catálogo

| developer_id | developer_name | segmento | fiabilidad_handover | brand_strength |
|---|---|---|---|---|
| EMAAR | Emaar Properties | luxury | 9 | 10 |
| NAKHL | Nakheel | luxury | 8 | 9 |
| MERAAS | Meraas Holding | luxury | 8 | 9 |
| SOBHA | Sobha Realty | premium | 7 | 8 |
| DAMAC | Damac Properties | premium | 6 | 8 |
| ELLING | Ellington | premium | 7 | 7 |
| BINGHA | Binghatti Developers | mass | 6 | 6 |
| AZIZI | Azizi Developments | mass | 5 | 6 |
| DANUBE | Danube Properties | mass | 7 | 7 |
| IMTIAZ | Imtiaz Developments | mass | 5 | 5 |
| NSHAMA | Nshama | mass | 6 | 5 |
| DUBPRO | Dubai Properties | mass | 7 | 7 |
| OCTA | OCTA Properties | mass | 4 | 4 |
| SELECT | Select Group | premium | 6 | 6 |
| CITI | Citi Developers | mass | 4 | 4 |

---

## Pestaña: `lead_matches`

Generada automáticamente por `matching_engine.gs`. Una fila por recomendación.

| # | Columna | Tipo | Descripción |
|---|---|---|---|
| A | `match_id` | string | `LEAD_ID` + `_` + `PROJECT_ID` |
| B | `lead_id` | string | FK → leads.lead_id |
| C | `project_id` | string | FK → projects_master.project_id |
| D | `match_score` | integer (0–100) | Puntuación total del matching |
| E | `score_capital` | integer (0–30) | Sub-score capital vs perfil |
| F | `score_objetivo` | integer (0–30) | Sub-score objetivo vs perfil |
| G | `score_timing` | integer (0–25) | Sub-score plazo vs handover |
| H | `score_developer` | integer (0–15) | Sub-score solidez promotora |
| I | `razon_1` | string | Primera razón de la recomendación |
| J | `razon_2` | string | Segunda razón |
| K | `razon_3` | string | Tercera razón (puede estar vacía) |
| L | `rank` | integer | Posición en el ranking (1 = mejor match) |
| M | `enviado_lead` | string | Sí / No — si se ha enviado al lead |
| N | `fecha_envio` | date | Fecha de envío |
| O | `email_abierto` | string | Sí / No |
| P | `clic_proyecto` | string | Sí / No |
| Q | `llamada_reservada` | string | Sí / No |
| R | `feedback` | string | Notas de feedback del lead |

---

## Pestaña: `sources`

Lista de URLs para actualización automática vía scraping/revisión.

| # | Columna | Descripción |
|---|---|---|
| A | `source_id` | ID interno |
| B | `source_name` | Nombre descriptivo |
| C | `source_type` | `propertyfinder` / `bayut` / `developer_web` / `manual` |
| D | `developer` | Promotora asociada (o vacío si es agregador) |
| E | `url` | URL a monitorizar |
| F | `activo` | Sí / No |
| G | `prioridad` | 1 (alta) / 2 (media) / 3 (baja) |
| H | `frecuencia` | `diaria` / `semanal` / `mensual` |
| I | `ultima_revision` | Fecha de última revisión |

---

## Pestaña: `change_log`

Registro inmutable de cambios. Útil para detectar variaciones de precio, handover o plan de pago.

| # | Columna | Descripción |
|---|---|---|
| A | `fecha` | Fecha del cambio (ISO 8601) |
| B | `project_id` | Proyecto afectado |
| C | `campo_modificado` | Nombre de la columna que cambió |
| D | `valor_anterior` | Valor que tenía |
| E | `valor_nuevo` | Valor actualizado |
| F | `fuente` | `auto` / `manual` |
| G | `notas` | Contexto adicional |

---

## Pestaña: `manual_review`

Proyectos que no superan el control de calidad automático y requieren revisión manual.

| # | Columna | Descripción |
|---|---|---|
| A | `project_id` | ID del proyecto (o provisional si no existe) |
| B | `nombre_provisional` | Nombre tal como vino de la fuente |
| C | `motivo_revision` | Campo que falta o es inválido |
| D | `fecha_marcado` | Cuándo se marcó para revisión |
| E | `asignado_a` | Quién debe revisar |
| F | `estado` | `pendiente` / `resuelto` |

---

## Control de calidad — reglas de entrada

Un proyecto pasa a `projects_master` solo si cumple todas estas reglas.
Si falla alguna, va a `manual_review` con el motivo.

| Regla | Campo requerido | Validación |
|---|---|---|
| R1 | `promotora` | No vacío |
| R2 | `nombre_proyecto` | No vacío, único en la tabla |
| R3 | `zona_principal` | No vacío |
| R4 | `handover_raw` | No vacío, formato Q# YYYY o N/A con justificación |
| R5 | `plan_pago_raw` | No vacío, o N/A con anotación |
| R6 | `perfil_inversor` | Uno de los 4 valores normalizados |
| R7 | `fuente` | No vacío |

---

## Flujo de actualización semanal

```
1. Scheduler (lunes 08:00 CET)
2. → updateProjectsFromSources() lee pestaña 'sources'
3. → Para cada URL activa: extrae datos (scraping o revisión manual)
4. → compararConMaster(): detecta proyectos nuevos y campos modificados
5. → Si proyecto nuevo → control de calidad (R1–R7) → projects_master o manual_review
6. → Si campo modificado → actualiza projects_master + escribe en change_log
7. → alertaCambios(): email resumen a civcomercial2010@gmail.com
```

---

## Notas de implementación

- **Fase actual (Abril 2026):** Usar el script `import_projects.gs` para la carga inicial desde el archivo `.pipe`.
- **Fase 3:** Añadir columnas `precio_desde_aed` y `precio_desde_eur` cuando se tenga acceso a precios reales via RRS/Marc.
- **Fase 4 (escala):** Migrar a Supabase manteniendo el mismo esquema de columnas para compatibilidad cero-fricción.
- **Golden Visa fit:** Se marca `Sí` si `handover_anyo ≤ 2027` y el ticket estimado supera AED 2M. Revisar manualmente proyectos de lujo.
- **Compatibilidad con el sistema de emails:** El campo `lead_id` en `lead_matches` es el mismo `lead_id` que usa `horizonte-emails.gs` en la pestaña `Leads`.
