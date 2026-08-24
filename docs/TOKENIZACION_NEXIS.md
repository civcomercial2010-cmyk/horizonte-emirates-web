# Tokenización e inversión fraccionada (&lt;150k€): Evaluación Nexis

Documento interno · Horizonte Emirates (Propulse SLU)  
Estado: **pendiente de conversación con Jesús** · no publicar en web hasta acuerdo comercial

---

## 1. Problema detectado

El funnel actual filtra desde **150.000–300.000 €** de capital disponible (`public/index.html`, paso 1 del formulario). La FAQ explica que con ~30.000 € se puede acceder a off-plan (entrada 10–20%), pero:

- Un visitante con **50.000–120.000 €** de capital total no encaja en ningún tramo del formulario.
- El simulador ROI ahora admite precios de activo desde 50.000 €, lo que puede generar expectativas de ticket bajo que el funnel no captura.
- Feedback externo: ofrecer **tokenización / entrada fraccionada** por debajo de 150k y derivar a un partner (Nexis) con atribución.

---

## 2. Propuesta de servicio (borrador)

| Elemento | Descripción |
|----------|-------------|
| **Qué** | Inversión fraccionada en propiedad tokenizada vía plataforma partner (Nexis u equivalente) |
| **Para quién** | Inversores con capital &lt;150k que quieren exposición UAE sin ticket off-plan completo |
| **Cómo** | Enlace de redirección desde horizonteemirates.com → registro en Nexis atribuido a Horizonte Emirates |
| **Valor HE** | Ampliar TAM sin competir con operaciones directas ≥150k; comisión por transacción referida |
| **Posicionamiento** | Complemento, no sustituto: “Para tickets desde 150k operamos inmueble completo; por debajo, fraccionado vía partner regulado” |

---

## 3. Modelo económico (pendiente acuerdo)

Puntos a cerrar con Jesús / Nexis:

1. **Comisión por transacción**, % o fee fijo por operación referida.
2. **Ventana de atribución**, cookie / UTM / código referral, duración (30/90 días).
3. **Productos elegibles**, qué activos/proyectos pueden tokenizarse y si encajan con la narrativa HE (UAE, RERA, etc.).
4. **SPV de gestión**, si el volumen lo justifica, evaluar estructura propia más adelante (feedback: “si hay muchos podría montarse una SPV”).

---

## 4. Opciones futuras en web (no implementadas)

Cuando exista acuerdo firmado:

| Opción | Esfuerzo | Impacto |
|--------|----------|---------|
| **A. Tramo formulario** “Menos de 150.000 €” → flujo alternativo o redirect Nexis | Medio | Captura leads hoy perdidos |
| **B. Sección home** “Inversión fraccionada desde X €” con CTA | Bajo–medio | Educa sin romper posicionamiento premium |
| **C. FAQ ampliada** | Bajo | Coherencia con simulador y capital mínimo |
| **D. Lead scoring tier D** | Medio | Separar nurturing de tickets altos |

Recomendación: empezar por **B + C** (informativo + enlace) antes de modificar el formulario de scoring.

---

## 5. Checklist previo al lanzamiento

- [ ] Acuerdo comercial y legal con Nexis (comisión, atribución, no-circumvention).
- [ ] URL de afiliado / referral definitiva.
- [ ] Tracking: UTM `utm_source=horizonte&utm_medium=referral&utm_campaign=tokenizacion` + evento GA4 `partner_redirect`.
- [ ] Disclaimer regulatorio YMYL (tokenización ≠ compra directa freehold; riesgos específicos).
- [ ] Alineación con RRS / partners actuales (no canal conflictivo).
- [ ] Copy revisado por asesor (Andorra / UAE) si aplica.
- [ ] Actualizar FAQ, formulario y emails solo tras OK comercial.

---

## 6. Referencias en repo

| Archivo | Relación |
|---------|----------|
| `ROADMAP_AUDITORIA.md` | Tarea **M52** |
| `public/index.html` | Tramo capital mínimo 150k; FAQ capital mínimo |
| `public/assets/app.js` | Scoring `SCORES.capital` |
| `automation/matching_engine.gs` | Matching por tier de capital |

---

## 7. Próximo paso

**Conversación con Jesús** para validar viabilidad, condiciones económicas y URL de partner. Sin ese OK, no añadir enlaces públicos a Nexis ni modificar el formulario de captación.
