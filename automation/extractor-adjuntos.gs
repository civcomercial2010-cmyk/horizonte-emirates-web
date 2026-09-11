// ══════════════════════════════════════════════════════════════════════════════
//  EXTRACTOR DE ADJUNTOS DE GMAIL → DRIVE
//  Jesús Ibáñez · v7.1 — Criba previa: anti-duplicados + Propulse / Personal
// ══════════════════════════════════════════════════════════════════════════════
//
//  QUÉ CAMBIA RESPECTO A v7.0 (v7.1, al traerlo al repositorio)
//  1. etiquetar() crea la etiqueta si no existe. Antes, si el nombre cambiaba en
//     CONFIG y nadie ejecutaba inicializarSistema(), dejaba de etiquetar EN SILENCIO.
//  2. unificarEtiquetasDrive(): consolida las etiquetas que dejaron las versiones
//     anteriores («✅ Subida a Drive», «Archivos adjuntos subidos a drive»,
//     «⚠ Pendiente Drive») sobre las dos actuales. Sin borrar nada por defecto.
//  3. reorganizarHistorico(): SIMULAR vuelve a true, que es lo que su propia
//     documentación dice. Estaba en false: quien la ejecutase movía ficheros de
//     verdad sin haber visto nunca el informe.
//  4. enviarResumen(): los días sin novedad no manda correo. Un aviso diario que
//     dice «0 nuevos» enseña a no abrir los correos de este script, y el día que
//     trae errores tampoco se abre.
//  5. norm(): el rango de acentos se escribe con escapes Unicode (\u0300-\u036f).
//     Estaba con los caracteres combinantes literales, que cualquier copia y pega
//     corrompe sin que se note hasta que la clasificación empieza a fallar.
//
//  REGLA DE LECTURA: este script NUNCA marca un correo como leído ni lo archiva.
//  Solo añade etiquetas. Si un correo con adjunto desaparece de Recibidos, es un
//  filtro de Gmail (Configuración → Filtros), no este código.
//
//  QUÉ TRAÍA v7.0 RESPECTO A v6.0
//  1. Anti-duplicados real por huella de contenido (MD5), no por nombre.
//  2. Clasificación en 3 subcarpetas: Propulse · Personal · ⚠ Revisar.
//  3. Lee dentro de .docx/.xlsx/.pptx/.txt/.csv (nativo, sin cuota ni OCR).
//  4. Estructura plana por año: ya no se crean carpetas de semestre.
//  5. reorganizarHistorico(): clasifica y deduplica lo ya bajado (con simulación).
//
//  USO
//  1. Pega este script en el proyecto (sustituye el Código.gs anterior).
//  2. Servicios: para reorganizarHistorico() activa "Drive API" (identificador
//     Drive). Sin ella funciona igual, pero deduplica por tamaño+nombre en vez
//     de por MD5. El flujo diario NO la necesita.
//  3. Ejecuta inicializarSistema()        → solo la primera vez.
//  4. Ejecuta unificarEtiquetasDrive()    → una vez, para dejar una sola etiqueta
//     de cada tipo. Con unificarEtiquetasDrive(true) borra además las vacías.
//  5. Ejecuta reorganizarHistorico()      → primero con SIMULAR = true, revisa la
//     pestaña "Reorganización" del índice, y luego con SIMULAR = false.
//  6. El trigger diario (08:00) sigue bajando lo nuevo, ya clasificado.
//
// ══════════════════════════════════════════════════════════════════════════════

// ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
var CONFIG = {
  emailResumen: "civcomercial2010@gmail.com",
  carpetaRaiz: "📥 Adjuntos por revisar",
  nombreIndice: "Índice Adjuntos",
  zona: "Europe/Madrid",

  // Etiquetas Gmail
  labelDescargado: "✅ Adjunto en Drive",
  labelPendiente: "⚠️ Pendiente Drive",

  // Etiquetas que dejaron versiones anteriores de este script y que siguen
  // colgando de correos antiguos. No las usa nadie: unificarEtiquetasDrive()
  // las vuelca sobre las dos de arriba para que quede una sola de cada tipo.
  // Ojo con «⚠ Pendiente Drive»: es el mismo texto que labelPendiente pero sin
  // el selector de variación del emoji, y para Gmail son etiquetas distintas.
  labelsLegacyDescargado: ["✅ Subida a Drive", "Archivos adjuntos subidos a drive"],
  labelsLegacyPendiente: ["⚠ Pendiente Drive"],

  // Comportamiento
  incluirImagenesInline: false,
  usarIndice: true,
  enviarResumen: true,
  // Sin descargas, ni duplicados, ni errores: no se manda el resumen diario.
  resumenSoloSiHayNovedades: true,

  // ── Adjuntos que NO son documentos: se obvian (no se descargan) ─────────────
  nombresIgnorar: ["smime.p7s", "winmail.dat"],

  filtrarNoDocumentos: true,
  // Tipos que nunca contienen un documento ni una factura
  extensionesIgnorar: [".ics", ".vcs", ".vcf", ".p7s", ".p7m", ".asc", ".dat"],
  // Imágenes de firma, logos y adornos de plantilla de correo.
  // Estas reglas SOLO se aplican a imágenes: un PDF nunca se descarta por nombre.
  patronesImagenBasura: ["firma", "signature", "logo", "banner", "footer",
                         "encabezado", "cabecera", "icono", "icon-"],
  minBytesImagen: 40 * 1024,           // imagen más pequeña que esto = adorno, no documento

  // Control de ejecución
  tiempoMaximoMs: 300000,              // 5 min de margen sobre el límite de 6
  lotePorBusqueda: 100,

  // Persistencia
  propKeyProcesados: "IDS_PROCESADOS",
  propKeyUltimaRevision: "ULTIMA_REVISION_ISO",

  // ── v7.0 ────────────────────────────────────────────────────────────────────
  subPropulse: "Propulse",
  subPersonal: "Personal",
  subRevisar: "⚠ Revisar",
  subDuplicados: "_Duplicados",
  subBasura: "_Basura",

  hojaAdjuntos: "Adjuntos",
  hojaHashes: "Hashes",
  hojaReorg: "Reorganización",
  hojaHistorico: "Adjuntos (v6)",

  maxBytesHash: 8 * 1024 * 1024,       // por encima: huella tamaño + nombre original
  maxBytesLectura: 3 * 1024 * 1024,    // tamaño máx. para abrir un Office/texto
  maxCharsCuerpo: 6000,                // recorte del cuerpo del email
  maxCharsArchivo: 20000,              // recorte del texto extraído del archivo

  umbralPropulse: 4                    // >=4 Propulse · >0 Revisar · <=0 Personal
};

// ── SEÑALES DE CLASIFICACIÓN ──────────────────────────────────────────────────
// Todo se compara en minúsculas y SIN acentos. Añade términos aquí para afinar.
var SENALES = {

  // Identificador inequívoco de la sociedad → Propulse directo
  fuertes: [
    "propulse",
    "l-719841-w", "l719841w", "l 719841 w"
  ],

  // Proyectos, marcas y clientes del negocio (+4 si aparecen en nombre,
  // asunto, remitente o dentro del archivo)
  negocio: [
    "horizonte emirates", "horizonte_emirates",
    "rnr real estate", "rnr referral",
    "hipopotamo", "hipopotam",
    "hpin", "heur",
    "investment memorandum", "sales offer",
    "gianfranco ferre", "nh collection",
    "comptes anuals", "declaracio igi", "justificant igi", "igi ",
    "impost de societats", "comerç i industria"
  ],

  // Remitentes / proveedores habituales de la sociedad (+4 sobre el remitente)
  remitentesNegocio: [
    "joel da rocha", "gm consultors", "admin comptable",
    "estacio pirineu", "dondominio", "cegid",
    "garceran", "marc nonn", "raul fernandez martinez",
    "immobiliaria victoria", "pedro burgos"
  ],

  // Señales de negocio ambiguas (+2 → suelen acabar en ⚠ Revisar)
  negocioDebil: [
    "nord andorra", "nord andorrà", "feda", "andbank",
    "factura", "fra ", "fra-", "invoice", "rebut", "abonament"
  ],

  // Señales claramente personales (-3 cada una, tope -6)
  personal: [
    "boda", "noces", "nupcial", "luna de miel", "serras andorra",
    "borda del pi", "esdeveniments socials", "rooming list", "proforma jesus",
    "fontblanca", "veterinari", "airbnb", "airporter",
    "testamento", "libro de familia", "certificado de nacimiento",
    "certificat de naixement", "apostilla", "fe de vida", "estado civil",
    "matrimonio", "matrimoni", "dni", "nia ", "pasaporte", "passaport",
    "interactive brokers", "activitystatement",
    "modelo 211", "plusvalia", "irpf", "renta ", "herencia",
    "hipoteca personal", "tax free"
  ]
};

// Extensión por content-type cuando el adjunto no la trae en el nombre
var MAPA_EXT = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp",
  "application/zip": ".zip", "application/x-rar-compressed": ".rar",
  "text/csv": ".csv", "text/plain": ".txt",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"
};

var _proc = null;   // caché de IDs de mensaje procesados
var _idx = null;    // caché del libro índice + mapa de huellas

// ── 1. INICIALIZACIÓN ─────────────────────────────────────────────────────────
function inicializarSistema() {
  Logger.log("🚀 Inicializando extractor de adjuntos v7.1...");
  crearEtiquetas();
  crearSiNoExiste(DriveApp.getRootFolder(), CONFIG.carpetaRaiz);
  idx();
  instalarTriggerDiario();
  Logger.log("✅ Listo. Ejecuta unificarEtiquetasDrive() y luego reorganizarHistorico() (SIMULAR=true).");
}

// ── 2. CARGA DE UN AÑO COMPLETO ───────────────────────────────────────────────
function repasarAnoCompleto() {
  var ANO = 2026; // ← cambia el año y vuelve a ejecutar

  Logger.log("🚀 Cargando adjuntos del año " + ANO + "...");
  Logger.log("📊 Ya procesados previamente: " + verProgreso() + " mensajes");

  var deadline = Date.now() + CONFIG.tiempoMaximoMs;
  var tot = { descargados: 0, saltados: 0, duplicados: 0, errores: 0 };

  for (var mes = 1; mes <= 12; mes++) {
    if (Date.now() > deadline) {
      Logger.log("⏱ Tiempo límite antes del mes " + mes + ". Vuelve a ejecutar para continuar.");
      break;
    }
    var desde = new Date(ANO, mes - 1, 1);
    var hasta = new Date(ANO, mes, 1);
    Logger.log("─── " + Utilities.formatDate(desde, CONFIG.zona, "MMMM yyyy") + " ───");

    var r = procesarPeriodo(desde, hasta, deadline);
    tot.descargados += r.descargados.length;
    tot.saltados += r.saltados;
    tot.duplicados += r.duplicados.length;
    tot.errores += r.errores.length;

    if (r.interrumpido) {
      Logger.log("⏱ Interrumpido dentro de " + Utilities.formatDate(desde, CONFIG.zona, "MMMM yyyy") +
                 ". Vuelve a ejecutar para continuar.");
      break;
    }
  }

  Logger.log("🏁 Año " + ANO + " → Descargados: " + tot.descargados +
             " | Duplicados evitados: " + tot.duplicados +
             " | Saltados: " + tot.saltados + " | Errores: " + tot.errores);
  Logger.log("📌 Total acumulado: " + verProgreso() + " mensajes procesados");
}

// ── 3. REPASO DE UN MES CONCRETO ──────────────────────────────────────────────
function repasarMesConcreto() {
  var MES = 7;      // 1..12
  var ANO = 2026;

  var desde = new Date(ANO, MES - 1, 1);
  var hasta = new Date(ANO, MES, 1);
  Logger.log("🔎 " + Utilities.formatDate(desde, CONFIG.zona, "MMMM yyyy"));

  var r = procesarPeriodo(desde, hasta, Date.now() + CONFIG.tiempoMaximoMs);
  Logger.log("✅ Descargados: " + r.descargados.length +
             " | Duplicados evitados: " + r.duplicados.length +
             " | Saltados: " + r.saltados + " | Errores: " + r.errores.length);
}

// ── 4. REPASO DIARIO AUTOMÁTICO ───────────────────────────────────────────────
function repasoDiario() {
  Logger.log("🔄 Repaso diario automático...");
  var props = PropertiesService.getScriptProperties();
  var ahora = new Date();
  var ultimaISO = props.getProperty(CONFIG.propKeyUltimaRevision);

  var desde = ultimaISO ? new Date(ultimaISO) : new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000);
  var hasta = ahora;
  desde.setSeconds(0, 0);
  hasta.setSeconds(0, 0);

  var res = procesarPeriodo(desde, hasta, Date.now() + CONFIG.tiempoMaximoMs);

  if (res.errores.length === 0 && !res.interrumpido) {
    props.setProperty(CONFIG.propKeyUltimaRevision, hasta.toISOString());
    Logger.log("✅ Última revisión actualizada a: " + hasta.toISOString());
  } else {
    Logger.log("⚠️ Errores o interrupción; no se avanza la marca para reintentar mañana.");
  }

  enviarResumen(res, "📥 Adjuntos " + Utilities.formatDate(ahora, CONFIG.zona, "dd/MM/yyyy") +
                     " — " + res.descargados.length + " nuevos");
  Logger.log("✅ Repaso diario completado.");
}

// ── NÚCLEO ────────────────────────────────────────────────────────────────────
function procesarPeriodo(desde, hasta, deadline) {
  var query = "has:attachment after:" + fFecha(desde) + " before:" + fFecha(hasta);
  var res = { descargados: [], duplicados: [], errores: [], saltados: 0, interrumpido: false };
  var start = 0;

  while (true) {
    if (Date.now() > deadline) { res.interrumpido = true; break; }

    var threads = GmailApp.search(query, start, CONFIG.lotePorBusqueda);
    if (!threads.length) break;

    for (var i = 0; i < threads.length; i++) {
      if (Date.now() > deadline) { res.interrumpido = true; break; }
      procesarThread(threads[i], res);
    }

    if (res.interrumpido) break;
    if (threads.length < CONFIG.lotePorBusqueda) break;
    start += CONFIG.lotePorBusqueda;
  }

  Logger.log("   ✅ Descargados: " + res.descargados.length +
             " | ♻️ Duplicados: " + res.duplicados.length +
             " | Saltados: " + res.saltados +
             " | Errores: " + res.errores.length +
             (res.interrumpido ? " | ⏱ interrumpido" : ""));
  return res;
}

function procesarThread(thread, res) {
  var msgs = thread.getMessages();
  var huboError = false, huboDescarga = false;

  for (var i = 0; i < msgs.length; i++) {
    var msg = msgs[i];
    if (estaProcessado(msg.getId())) { res.saltados++; continue; }

    var r = procesarMensaje(msg, res);
    if (r.error) huboError = true;
    if (r.descarga) huboDescarga = true;
    if (r.ok) marcarProcesado(msg.getId());
  }

  if (huboError) etiquetar(thread, CONFIG.labelPendiente);
  else if (huboDescarga) etiquetar(thread, CONFIG.labelDescargado);
}

function procesarMensaje(msg, res) {
  var adjuntos;
  try {
    adjuntos = msg.getAttachments({
      includeInlineImages: CONFIG.incluirImagenesInline,
      includeAttachments: true
    });
  } catch (e) { adjuntos = []; }

  adjuntos = adjuntos.filter(esAdjuntoValido);
  if (!adjuntos.length) return { ok: true, error: false, descarga: false };

  var ctxMsg = contextoMensaje(msg);
  var todoOk = true, algunaDescarga = false, algunError = false;

  for (var i = 0; i < adjuntos.length; i++) {
    try {
      if (guardarAdjunto(msg, adjuntos[i], res, ctxMsg)) algunaDescarga = true;
    } catch (e) {
      Logger.log("   ❌ " + adjuntos[i].getName() + ": " + e.message);
      res.errores.push({ asunto: msg.getSubject(), archivo: adjuntos[i].getName(), error: e.message });
      todoOk = false; algunError = true;
    }
  }
  return { ok: todoOk, error: algunError, descarga: algunaDescarga };
}

/**
 * Descarga un adjunto aplicando la criba: huella anti-duplicados + ámbito.
 * Devuelve true si realmente se ha creado el archivo en Drive.
 */
function guardarAdjunto(msg, adj, res, ctxMsg) {
  var fecha = msg.getDate();
  var nombreOrig = adj.getName() || "adjunto";
  var tam = 0; try { tam = adj.getSize() || 0; } catch (e) {}

  // El blob solo se materializa si hace falta (hash o lectura interna)
  var blob = null;
  function obtenerBlob() {
    if (!blob) blob = adj.copyBlob();
    return blob;
  }

  // 1) HUELLA ANTI-DUPLICADOS ------------------------------------------------
  var huella = huellaDeAdjunto(nombreOrig, tam, obtenerBlob);
  var yaExiste = buscarHuella(huella);
  if (yaExiste) {
    res.duplicados.push({ fecha: fecha, de: msg.getFrom(), asunto: msg.getSubject(),
                          archivo: nombreOrig, original: yaExiste });
    Logger.log("   ♻️ Duplicado de «" + yaExiste + "»: " + nombreOrig);
    registrarEnIndice({
      msg: msg, nombre: nombreOrig, contentType: adj.getContentType(), fecha: fecha,
      carpeta: "—", ambito: "DUPLICADO", score: "", motivo: "Duplicado de: " + yaExiste,
      huella: huella, estado: "Duplicado"
    });
    return false;
  }

  // 2) CLASIFICACIÓN ----------------------------------------------------------
  var textoArchivo = textoInternoArchivo(nombreOrig, tam, obtenerBlob);
  var cls = clasificarAmbito({
    nombreArchivo: nombreOrig,
    asunto: ctxMsg.asunto,
    from: ctxMsg.from,
    to: ctxMsg.to,
    cuerpo: ctxMsg.cuerpo,
    textoArchivo: textoArchivo
  });

  // 3) DESTINO Y ESCRITURA ----------------------------------------------------
  var carpeta = carpetaDestino(fecha, cls.ambito);
  var nombre = construirNombre(fecha, msg.getFrom(), nombreOrig, adj.getContentType());

  if (carpeta.getFilesByName(nombre).hasNext()) {   // misma fecha, remitente y nombre
    res.saltados++;
    Logger.log("   ⏭ Ya existe: " + nombre);
    registrarHuella(huella, nombre, carpeta.getName());
    return false;
  }

  carpeta.createFile(obtenerBlob().setName(nombre));
  registrarHuella(huella, nombre, carpeta.getName());

  Logger.log("   📎 " + nombre + " → " + cls.ambito + " (" + cls.score + ")");
  res.descargados.push({
    fecha: fecha, de: msg.getFrom(), asunto: msg.getSubject(),
    archivo: nombre, carpeta: carpeta.getName(), ambito: cls.ambito
  });
  registrarEnIndice({
    msg: msg, nombre: nombre, contentType: adj.getContentType(), fecha: fecha,
    carpeta: carpeta.getName(), ambito: cls.ambito, score: cls.score,
    motivo: cls.motivos.join(" · "), huella: huella, estado: "Nuevo"
  });
  return true;
}

function esAdjuntoValido(adj) {
  var tam = 0;
  try { tam = adj.getSize ? adj.getSize() : 0; } catch (e) {}
  return !motivoDescarte(adj.getName(), tam);
}

/**
 * Devuelve "" si el adjunto es un documento aprovechable, o el motivo por el
 * que se obvia. Solo descarta lo que con seguridad no es documento ni factura:
 * invitaciones de calendario, certificados de correo, y las imágenes que son
 * firmas, logos o adornos de plantilla.
 *
 * Nunca descarta por nombre un PDF, un Office ni un comprimido: los .rar/.zip
 * se conservan porque suelen traer facturas dentro.
 */
function motivoDescarte(nombre, tam) {
  var nom = String(nombre || "").toLowerCase();
  if (!nom) return "sin nombre";
  if (tam === 0) return "vacío";

  for (var i = 0; i < CONFIG.nombresIgnorar.length; i++) {
    if (nom.indexOf(CONFIG.nombresIgnorar[i]) !== -1) return "técnico: " + CONFIG.nombresIgnorar[i];
  }
  if (!CONFIG.filtrarNoDocumentos) return "";

  for (var j = 0; j < CONFIG.extensionesIgnorar.length; j++) {
    if (nom.slice(-CONFIG.extensionesIgnorar[j].length) === CONFIG.extensionesIgnorar[j]) {
      return "no es documento (" + CONFIG.extensionesIgnorar[j] + ")";
    }
  }

  var esImagen = /\.(png|jpe?g|gif|bmp|webp|tiff?)$/.test(nom);
  if (esImagen) {
    if (/image\d{3}\./.test(nom)) return "imagen de plantilla de correo";
    var base = norm(nom);
    for (var k = 0; k < CONFIG.patronesImagenBasura.length; k++) {
      if (base.indexOf(CONFIG.patronesImagenBasura[k]) !== -1) {
        return "firma o logo: " + CONFIG.patronesImagenBasura[k];
      }
    }
    if (tam > 0 && tam < CONFIG.minBytesImagen) return "imagen decorativa (<40 KB)";
  }
  return "";
}

// ── CLASIFICACIÓN PROPULSE / PERSONAL / REVISAR ───────────────────────────────
function contextoMensaje(msg) {
  var cuerpo = "";
  try { cuerpo = (msg.getPlainBody() || "").substring(0, CONFIG.maxCharsCuerpo); } catch (e) {}
  return {
    asunto: msg.getSubject() || "",
    from: msg.getFrom() || "",
    to: (msg.getTo ? (msg.getTo() || "") : ""),
    cuerpo: cuerpo
  };
}

/**
 * ctx: {nombreArchivo, asunto, from, to, cuerpo, textoArchivo}
 * Devuelve {ambito, score, motivos[]}
 *
 * Reglas:
 *  · "propulse" o el NRT en nombre, asunto, remitente o DENTRO del archivo → Propulse.
 *  · En el cuerpo del email puntúa poco: la firma del propio usuario contamina.
 *  · Sin ninguna señal de negocio → Personal (regla por defecto).
 *  · Señal de negocio débil → ⚠ Revisar.
 */
function clasificarAmbito(ctx) {
  var fuerte = norm([ctx.nombreArchivo, ctx.textoArchivo].join(" "));
  var meta = norm([ctx.asunto, ctx.from, ctx.to].join(" "));
  var cuerpo = norm(ctx.cuerpo);
  var todo = fuerte + " " + meta;

  var score = 0, motivos = [];

  // Identificador inequívoco en archivo o metadatos → decisión inmediata
  var h = hits(fuerte, SENALES.fuertes);
  if (h.length) return { ambito: "PROPULSE", score: 100, motivos: ["Propulse en archivo: " + h.join(", ")] };

  h = hits(meta, SENALES.fuertes);
  if (h.length) return { ambito: "PROPULSE", score: 100, motivos: ["Propulse en el email: " + h.join(", ")] };

  h = hits(cuerpo, SENALES.fuertes);
  if (h.length) { score += 2; motivos.push("Propulse solo en el cuerpo (posible firma): " + h.join(", ")); }

  // Proyectos / clientes del negocio
  h = hits(todo, SENALES.negocio);
  if (h.length) { score += 4; motivos.push("Negocio: " + h.join(", ")); }

  // Proveedores y gestoría habituales (sobre el remitente)
  h = hits(norm(ctx.from), SENALES.remitentesNegocio);
  if (h.length) { score += 4; motivos.push("Remitente de negocio: " + h.join(", ")); }

  // Señales ambiguas
  h = hits(todo, SENALES.negocioDebil);
  if (h.length) { score += 2; motivos.push("Indicio débil: " + h.join(", ")); }

  // Señales personales
  h = hits(todo, SENALES.personal);
  if (h.length) {
    var penal = Math.min(6, h.length * 3);
    score -= penal;
    motivos.push("Personal (-" + penal + "): " + h.slice(0, 4).join(", "));
  }

  var ambito;
  if (score >= CONFIG.umbralPropulse) ambito = "PROPULSE";
  else if (score > 0) ambito = "REVISAR";
  else ambito = "PERSONAL";

  if (!motivos.length) motivos.push("Sin señales de negocio → Personal por defecto");
  return { ambito: ambito, score: score, motivos: motivos };
}

/**
 * Texto interno de Office y ficheros de texto. Nativo, sin cuota ni OCR.
 * Los PDF no se abren (requerirían conversión con la Drive API).
 */
function textoInternoArchivo(nombre, tam, obtenerBlob) {
  var n = (nombre || "").toLowerCase();
  if (tam > CONFIG.maxBytesLectura) return "";

  try {
    if (/\.(txt|csv|md|json|xml|html?|eml)$/.test(n)) {
      return (obtenerBlob().getDataAsString() || "").substring(0, CONFIG.maxCharsArchivo);
    }

    if (/\.(docx|xlsx|pptx)$/.test(n)) {
      var partes = Utilities.unzip(obtenerBlob().copyBlob().setContentType("application/zip"));
      var out = "";
      for (var i = 0; i < partes.length && out.length < CONFIG.maxCharsArchivo; i++) {
        var pn = partes[i].getName();
        if (!/(word\/document\.xml|word\/(header|footer)\d*\.xml|xl\/sharedStrings\.xml|ppt\/slides\/slide\d+\.xml|docProps\/(core|app)\.xml)$/i.test(pn)) continue;
        out += " " + partes[i].getDataAsString().replace(/<[^>]+>/g, " ");
      }
      return out.substring(0, CONFIG.maxCharsArchivo);
    }
  } catch (e) {
    Logger.log("   ⚠️ No se pudo leer el interior de " + nombre + ": " + e.message);
  }
  return "";
}

/**
 * Busca cada señal en el texto (ya normalizado) de dos formas:
 *  · literal          → "joel da rocha" en "... joel da rocha ..."
 *  · compacta         → "joeldarocha" en "joel.da.rocha@gmconsultors.ad"
 * La variante compacta solo se aplica a señales de 6+ caracteres, para que
 * términos cortos ("igi", "dni", "feda") no generen falsos positivos dentro
 * de otras palabras. Una señal escrita con espacio final ("nia ", "igi ")
 * exige coincidencia de palabra y nunca usa la variante compacta.
 */
function hits(texto, lista) {
  var compacto = texto.replace(/ /g, "");
  var out = [];
  for (var i = 0; i < lista.length; i++) {
    var senal = norm(lista[i]);
    if (!senal) continue;

    if (texto.indexOf(senal) !== -1) { out.push(lista[i].trim()); continue; }

    if (/ $/.test(senal)) continue;                  // exige límite de palabra
    var sc = senal.replace(/ /g, "");
    if (sc.length >= 6 && compacto.indexOf(sc) !== -1) out.push(lista[i].trim());
  }
  return out;
}

// Los acentos se quitan con el rango Unicode escrito con escapes (\u0300-\u036f).
// Escribirlo con los caracteres combinantes literales funciona igual, pero
// cualquier copia y pega entre editores puede corromperlos, y entonces la
// clasificación falla en silencio con todo lo que lleve tilde.
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // quita acentos
    .replace(/[_\-\.\/\\,;:()\[\]{}"'|@]+/g, " ")      // separadores → espacio
    .replace(/\s+/g, " ");
}

// ── ANTI-DUPLICADOS ───────────────────────────────────────────────────────────
/**
 * Huella del contenido:
 *  · ≤ 8 MB  → MD5 real del binario (detecta el mismo fichero con otro nombre).
 *  · > 8 MB  → "sz:<bytes>:<nombre original normalizado>" (evita cargar el blob).
 */
function huellaDeAdjunto(nombreOrig, tam, obtenerBlob) {
  if (tam > 0 && tam <= CONFIG.maxBytesHash) {
    try { return "md5:" + md5Hex(obtenerBlob().getBytes()); } catch (e) {}
  }
  return "sz:" + tam + ":" + norm(nombreOrig.replace(/\.[^/.]+$/, ""));
}

function md5Hex(bytes) {
  var d = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, bytes);
  var s = "";
  for (var i = 0; i < d.length; i++) {
    var b = (d[i] + 256) % 256;
    s += (b < 16 ? "0" : "") + b.toString(16);
  }
  return s;
}

function buscarHuella(huella) {
  return idx().mapaHuellas[huella] || null;
}

function registrarHuella(huella, nombreArchivo, carpetaNombre) {
  var x = idx();
  if (x.mapaHuellas[huella]) return;
  x.mapaHuellas[huella] = nombreArchivo;
  if (x.shHashes) {
    x.shHashes.appendRow([huella, nombreArchivo, carpetaNombre,
                          Utilities.formatDate(new Date(), CONFIG.zona, "dd/MM/yyyy HH:mm")]);
  }
}

// ── DESTINO Y NOMENCLATURA ────────────────────────────────────────────────────
function carpetaDestino(fecha, ambito) {
  var raiz = crearSiNoExiste(DriveApp.getRootFolder(), CONFIG.carpetaRaiz);
  var carpetaAno = crearSiNoExiste(raiz, String(fecha.getFullYear()));
  return crearSiNoExiste(carpetaAno, nombreSubcarpeta(ambito));
}

function nombreSubcarpeta(ambito) {
  if (ambito === "PROPULSE") return CONFIG.subPropulse;
  if (ambito === "REVISAR") return CONFIG.subRevisar;
  return CONFIG.subPersonal;
}

function construirNombre(fecha, from, nombreOrig, contentType) {
  var f = Utilities.formatDate(fecha, CONFIG.zona, "yyyy-MM-dd");
  var rem = tokenRemitente(from);
  var ext = extraerExtension(nombreOrig, contentType);
  var base = limpiar((nombreOrig || "adjunto").replace(/\.[^/.]+$/, "")) || "adjunto";
  return f + "_" + rem + "_" + base.substring(0, 45) + ext;
}

function tokenRemitente(from) {
  from = from || "";
  var nombre = "";
  var m = from.match(/^\s*"?([^"<]+?)"?\s*</);
  if (m) nombre = m[1];
  if (!nombre) {
    var e = from.match(/([a-z0-9._%+\-]+)@/i);
    nombre = e ? e[1] : from;
  }
  return (limpiar(nombre) || "Remitente").substring(0, 25);
}

function extraerExtension(nombre, contentType) {
  var m = (nombre || "").match(/(\.[A-Za-z0-9]{1,6})$/);
  if (m) return m[1].toLowerCase();
  return MAPA_EXT[(contentType || "").toLowerCase()] || ".dat";
}

function limpiar(s) {
  return String(s)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^0-9A-Za-zÁÉÍÓÚáéíóúÑñÀàÜü_\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}

// ── ÍNDICE (GOOGLE SHEETS) ────────────────────────────────────────────────────
var CABECERAS_ADJUNTOS = [
  "Fecha correo", "Remitente", "Asunto", "Archivo en Drive", "Tipo",
  "Año", "Carpeta", "Ámbito", "Score", "Motivo", "Estado", "Huella",
  "Descargado", "ID mensaje"
];

function idx() {
  if (_idx) return _idx;

  var raiz = crearSiNoExiste(DriveApp.getRootFolder(), CONFIG.carpetaRaiz);
  var ss;
  var files = raiz.getFilesByName(CONFIG.nombreIndice);
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(CONFIG.nombreIndice);
    var f = DriveApp.getFileById(ss.getId());
    raiz.addFile(f);
    DriveApp.getRootFolder().removeFile(f);
    Logger.log("📊 Índice creado en " + CONFIG.carpetaRaiz);
  }

  var shAdj = ss.getSheetByName(CONFIG.hojaAdjuntos) || ss.getSheets()[0];

  // Migración desde v6: su cabecera de 10 columnas no encaja con el esquema nuevo.
  // En vez de sobrescribirla (desalinearía los datos), se archiva y se crea la nueva.
  if (esEsquemaAntiguo(shAdj)) {
    shAdj.setName(CONFIG.hojaHistorico);
    Logger.log("🗄 Índice v6 archivado como «" + CONFIG.hojaHistorico + "».");
    shAdj = ss.insertSheet(CONFIG.hojaAdjuntos);
  } else {
    shAdj.setName(CONFIG.hojaAdjuntos);
  }
  asegurarCabeceras(shAdj, CABECERAS_ADJUNTOS);

  var shHash = ss.getSheetByName(CONFIG.hojaHashes);
  if (!shHash) {
    shHash = ss.insertSheet(CONFIG.hojaHashes);
    asegurarCabeceras(shHash, ["Huella", "Archivo", "Carpeta", "Registrado"]);
  }

  // Mapa de huellas en memoria
  var mapa = {};
  var ultima = shHash.getLastRow();
  if (ultima > 1) {
    var vals = shHash.getRange(2, 1, ultima - 1, 2).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (vals[i][0]) mapa[String(vals[i][0])] = String(vals[i][1]);
    }
  }

  _idx = { ss: ss, shAdjuntos: shAdj, shHashes: shHash, mapaHuellas: mapa };
  return _idx;
}

function obtenerOCrearIndice() { return CONFIG.usarIndice ? idx().shAdjuntos : null; }

/** true si la hoja tiene datos con la cabecera de v6 (10 columnas, con "Semestre"). */
function esEsquemaAntiguo(sh) {
  if (sh.getLastRow() < 1 || sh.getLastColumn() < 1) return false;
  var cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].join("|");
  if (cab === CABECERAS_ADJUNTOS.join("|")) return false;
  return cab.indexOf("Semestre") !== -1 || (sh.getLastRow() > 1 && cab.indexOf("Ámbito") === -1);
}

function asegurarCabeceras(sh, cabeceras) {
  var actual = sh.getLastColumn() > 0
    ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].join("|")
    : "";
  if (actual === cabeceras.join("|")) return;

  sh.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras])
    .setBackground("#1A56A0").setFontColor("#ffffff").setFontWeight("bold");
  sh.setFrozenRows(1);
  [90, 200, 240, 300, 140, 55, 110, 90, 55, 380, 90, 290, 130, 180]
    .slice(0, cabeceras.length)
    .forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
}

function registrarEnIndice(d) {
  if (!CONFIG.usarIndice) return;
  var sh = idx().shAdjuntos;
  sh.appendRow([
    Utilities.formatDate(d.fecha, CONFIG.zona, "dd/MM/yyyy"),
    d.msg ? d.msg.getFrom() : "",
    d.msg ? d.msg.getSubject() : "",
    d.nombre,
    d.contentType || "",
    d.fecha.getFullYear(),
    d.carpeta,
    d.ambito,
    d.score,
    d.motivo,
    d.estado,
    d.huella,
    Utilities.formatDate(new Date(), CONFIG.zona, "dd/MM/yyyy HH:mm"),
    d.msg ? d.msg.getId() : ""
  ]);
}

// ── 5. REORGANIZACIÓN DEL HISTÓRICO ───────────────────────────────────────────
/**
 * Clasifica y deduplica lo que YA está bajado, sin borrar nada.
 * Los duplicados se mueven a "_Duplicados" (conserva la copia más antigua).
 *
 * SIMULAR arranca en true a propósito: mueve ficheros de verdad, así que la
 * primera ejecución solo escribe el informe en la pestaña "Reorganización" del
 * índice. Revisa ese informe y solo entonces ponlo en false.
 */
function reorganizarHistorico() {
  var ANO = 2026;
  var SIMULAR = true;    // ← ponlo en false cuando hayas revisado el informe

  var deadline = Date.now() + CONFIG.tiempoMaximoMs;
  var x = idx();
  var raiz = crearSiNoExiste(DriveApp.getRootFolder(), CONFIG.carpetaRaiz);
  var carpetaAno = crearSiNoExiste(raiz, String(ANO));

  Logger.log("🔧 Reorganizando " + ANO + (SIMULAR ? " — MODO SIMULACIÓN (no se mueve nada)" : " — MODO REAL"));

  // Metadatos de los emails, recuperados del índice: archivo → {from, asunto}
  var metaPorArchivo = cargarMetaDelIndice(x.ss);

  // Archivos a tratar: todo lo que cuelgue del año excepto las carpetas nuevas
  var excluidas = [CONFIG.subPropulse, CONFIG.subPersonal, CONFIG.subRevisar, CONFIG.subDuplicados];
  var pendientes = recolectarArchivos(carpetaAno, excluidas);
  Logger.log("📂 Archivos a revisar: " + pendientes.length);

  pendientes.sort(function (a, b) { return a.nombre < b.nombre ? -1 : 1; });  // por fecha del nombre

  var filas = [], cont = { propulse: 0, personal: 0, revisar: 0, duplicados: 0, basura: 0 };
  var vistos = {};   // huella → nombre conservado (arranca con lo ya registrado)
  for (var k in x.mapaHuellas) vistos[k] = x.mapaHuellas[k];

  for (var i = 0; i < pendientes.length; i++) {
    if (Date.now() > deadline) {
      Logger.log("⏱ Tiempo límite. Procesados " + i + " de " + pendientes.length + ". Vuelve a ejecutar.");
      break;
    }
    var it = pendientes[i];
    var file = it.file;
    var tam = file.getSize();
    var nombreOrig = nombreOriginalDesdeDrive(it.nombre);

    // Lo que no es un documento se aparta antes de nada
    var descarte = motivoDescarte(nombreOrig, tam);
    if (descarte) {
      cont.basura++;
      filas.push([it.nombre, it.carpeta, "BASURA", "", "Se obvia: " + descarte, "",
                  SIMULAR ? "simulado → " + CONFIG.subBasura : "movido → " + CONFIG.subBasura]);
      if (!SIMULAR) file.moveTo(crearSiNoExiste(raiz, CONFIG.subBasura));
      continue;
    }

    // Huella: md5 de Drive si la API avanzada está activa; si no, tamaño + nombre
    var md5 = md5DeDrive(file.getId());
    var huella = md5 ? ("md5:" + md5) : ("sz:" + tam + ":" + norm(nombreOrig.replace(/\.[^/.]+$/, "")));

    if (vistos[huella]) {
      cont.duplicados++;
      filas.push([it.nombre, it.carpeta, "DUPLICADO", "", "Duplicado de: " + vistos[huella],
                  huella, SIMULAR ? "simulado" : "movido a " + CONFIG.subDuplicados]);
      if (!SIMULAR) file.moveTo(crearSiNoExiste(raiz, CONFIG.subDuplicados));
      continue;
    }

    var meta = metaPorArchivo[it.nombre] || { from: "", asunto: "" };
    var texto = "";
    if (tam <= CONFIG.maxBytesLectura) {
      texto = textoInternoArchivo(nombreOrig, tam, function () { return file.getBlob(); });
    }

    var cls = clasificarAmbito({
      nombreArchivo: it.nombre,
      asunto: meta.asunto,
      from: meta.from,
      to: "",
      cuerpo: "",
      textoArchivo: texto
    });

    if (cls.ambito === "PROPULSE") cont.propulse++;
    else if (cls.ambito === "REVISAR") cont.revisar++;
    else cont.personal++;

    var destinoNombre = nombreSubcarpeta(cls.ambito);
    filas.push([it.nombre, it.carpeta, cls.ambito, cls.score, cls.motivos.join(" · "),
                huella, SIMULAR ? "simulado → " + destinoNombre : "movido → " + destinoNombre]);

    vistos[huella] = it.nombre;
    if (!SIMULAR) {
      file.moveTo(crearSiNoExiste(carpetaAno, destinoNombre));
      registrarHuella(huella, it.nombre, destinoNombre);
    }
  }

  escribirInformeReorg(x.ss, filas, ANO, SIMULAR);

  Logger.log("🏁 " + (SIMULAR ? "SIMULACIÓN" : "REORGANIZACIÓN") + " " + ANO +
             " → Propulse: " + cont.propulse +
             " | Personal: " + cont.personal +
             " | ⚠ Revisar: " + cont.revisar +
             " | Duplicados: " + cont.duplicados +
             " | Obviados: " + cont.basura);
  Logger.log("📊 Detalle en la pestaña «" + CONFIG.hojaReorg + "» del índice.");
  if (SIMULAR) Logger.log("👉 Revisa el informe y vuelve a ejecutar con SIMULAR = false.");
}

function recolectarArchivos(carpeta, excluidas, acc, ruta) {
  acc = acc || [];
  ruta = ruta || carpeta.getName();

  var files = carpeta.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    if (f.getName() === CONFIG.nombreIndice) continue;
    acc.push({ file: f, nombre: f.getName(), carpeta: ruta });
  }

  var subs = carpeta.getFolders();
  while (subs.hasNext()) {
    var s = subs.next();
    if (excluidas.indexOf(s.getName()) !== -1) continue;
    recolectarArchivos(s, excluidas, acc, ruta + "/" + s.getName());
  }
  return acc;
}

/** Quita el prefijo "AAAA-MM-DD_Remitente_" para recuperar el nombre original. */
function nombreOriginalDesdeDrive(nombre) {
  return String(nombre).replace(/^\d{4}-\d{2}-\d{2}_[^_]*_/, "");
}

/** MD5 sin descargar el fichero. Requiere el servicio avanzado "Drive API". */
function md5DeDrive(fileId) {
  try {
    if (typeof Drive === "undefined" || !Drive.Files) return "";
    var f = Drive.Files.get(fileId, { fields: "md5Checksum" });   // v3
    if (f && f.md5Checksum) return f.md5Checksum;
  } catch (e) {
    try {
      var f2 = Drive.Files.get(fileId);                           // v2
      if (f2 && f2.md5Checksum) return f2.md5Checksum;
    } catch (e2) {}
  }
  return "";
}

/**
 * archivo → {from, asunto}, leído del índice actual y del histórico v6.
 * Las 4 primeras columnas (Fecha, Remitente, Asunto, Archivo) coinciden en ambos.
 */
function cargarMetaDelIndice(ss) {
  var mapa = {};
  [CONFIG.hojaHistorico, CONFIG.hojaAdjuntos].forEach(function (nombre) {
    var sh = ss.getSheetByName(nombre);
    if (!sh) return;
    try {
      var ultima = sh.getLastRow();
      if (ultima < 2) return;
      var vals = sh.getRange(2, 1, ultima - 1, 4).getValues();
      for (var i = 0; i < vals.length; i++) {
        var archivo = String(vals[i][3] || "");
        if (archivo) mapa[archivo] = { from: String(vals[i][1] || ""), asunto: String(vals[i][2] || "") };
      }
    } catch (e) {}
  });
  return mapa;
}

function escribirInformeReorg(ss, filas, ano, simular) {
  var sh = ss.getSheetByName(CONFIG.hojaReorg);
  if (!sh) sh = ss.insertSheet(CONFIG.hojaReorg);
  sh.clear();

  var cab = ["Archivo", "Carpeta origen", "Ámbito", "Score", "Motivo", "Huella", "Acción"];
  sh.getRange(1, 1, 1, cab.length).setValues([cab])
    .setBackground("#1A56A0").setFontColor("#ffffff").setFontWeight("bold");
  sh.setFrozenRows(1);

  if (filas.length) sh.getRange(2, 1, filas.length, cab.length).setValues(filas);
  [340, 200, 110, 60, 420, 300, 220].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });

  sh.getRange(1, cab.length + 2).setValue(
    (simular ? "SIMULACIÓN " : "EJECUTADO ") + ano + " · " +
    Utilities.formatDate(new Date(), CONFIG.zona, "dd/MM/yyyy HH:mm"));
}

// ── EMAIL RESUMEN ─────────────────────────────────────────────────────────────
function enviarResumen(res, titulo) {
  if (!CONFIG.enviarResumen) return;

  // Un correo diario que dice «0 nuevos» enseña a no abrir los correos de este
  // script, y el día que trae errores tampoco se abre. Sin novedades, no se manda.
  var hayNovedades = res.descargados.length || res.duplicados.length || res.errores.length;
  if (CONFIG.resumenSoloSiHayNovedades && !hayNovedades) {
    Logger.log("📭 Sin novedades: no se envía resumen.");
    return;
  }

  var raiz = crearSiNoExiste(DriveApp.getRootFolder(), CONFIG.carpetaRaiz);
  var url = raiz.getUrl();

  var html = '<div style="font-family:Arial,sans-serif;max-width:760px;color:#333">';
  html += '<h2 style="color:#1A56A0">📥 ' + escapar(titulo) + '</h2>';
  html += '<p>Descargados: <b>' + res.descargados.length + '</b> · ♻️ Duplicados evitados: <b>' +
          res.duplicados.length + '</b> · Saltados: ' + res.saltados +
          ' · Errores: ' + res.errores.length + '</p>';
  html += '<p>📁 <a href="' + url + '">Abrir carpeta «' + CONFIG.carpetaRaiz + '»</a></p>';

  if (res.descargados.length) {
    html += '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
            '<tr style="background:#1A56A0;color:#fff">' +
            '<th style="padding:6px 8px;text-align:left">Fecha</th>' +
            '<th style="padding:6px 8px;text-align:left">Ámbito</th>' +
            '<th style="padding:6px 8px;text-align:left">Remitente</th>' +
            '<th style="padding:6px 8px;text-align:left">Archivo</th></tr>';
    res.descargados.slice(0, 60).forEach(function (d, i) {
      html += '<tr style="background:' + (i % 2 ? '#fff' : '#f0f7ff') + '">' +
        '<td style="padding:5px 8px">' + Utilities.formatDate(d.fecha, CONFIG.zona, "dd/MM/yyyy") + '</td>' +
        '<td style="padding:5px 8px"><b>' + escapar(d.ambito) + '</b></td>' +
        '<td style="padding:5px 8px">' + escapar(d.de) + '</td>' +
        '<td style="padding:5px 8px">' + escapar(d.archivo) + '</td></tr>';
    });
    html += '</table>';
    if (res.descargados.length > 60)
      html += '<p style="color:#888">… y ' + (res.descargados.length - 60) + ' más en la carpeta.</p>';
  }

  if (res.duplicados.length) {
    html += '<h3 style="color:#8a6d3b">♻️ Duplicados no descargados</h3><ul>';
    res.duplicados.slice(0, 30).forEach(function (d) {
      html += '<li>' + escapar(d.archivo) + ' — ya estaba como <i>' + escapar(d.original) + '</i></li>';
    });
    html += '</ul>';
  }

  if (res.errores.length) {
    html += '<h3 style="color:#c62828">Errores</h3><ul>';
    res.errores.slice(0, 30).forEach(function (e) {
      html += '<li>' + escapar(e.asunto) + ' — ' + escapar(e.archivo) + ': ' + escapar(e.error) + '</li>';
    });
    html += '</ul>';
  }

  html += '<p style="color:#bbb;font-size:11px">Generado ' +
          Utilities.formatDate(new Date(), CONFIG.zona, "dd/MM/yyyy HH:mm") +
          ' · Extractor de adjuntos v7.1</p></div>';

  GmailApp.sendEmail(CONFIG.emailResumen, titulo, "", { htmlBody: html });
  Logger.log("📧 Resumen enviado.");
}

function escapar(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── ETIQUETAS GMAIL ───────────────────────────────────────────────────────────
function crearEtiquetas() {
  [CONFIG.labelDescargado, CONFIG.labelPendiente].forEach(function (n) {
    try { if (!GmailApp.getUserLabelByName(n)) GmailApp.createLabel(n); } catch (e) {}
  });
}

/**
 * Etiqueta el hilo, creando la etiqueta si no existe. Antes solo la buscaba: si
 * alguien cambiaba el nombre en CONFIG y no ejecutaba inicializarSistema(), el
 * script dejaba de etiquetar sin decir nada y los correos tratados no se
 * distinguían de los pendientes.
 * No toca el estado de leído ni archiva: solo añade la etiqueta.
 */
function etiquetar(thread, nombre) {
  try {
    var l = GmailApp.getUserLabelByName(nombre) || GmailApp.createLabel(nombre);
    if (l) l.addToThread(thread);
  } catch (e) {
    Logger.log("   ⚠️ No se pudo etiquetar con «" + nombre + "»: " + e.message);
  }
}

/**
 * Deja una sola etiqueta de cada tipo. Cada versión del script estrenó nombre
 * («Archivos adjuntos subidos a drive» → «✅ Subida a Drive» → «✅ Adjunto en
 * Drive»), así que en el buzón conviven tres etiquetas para lo mismo y dos
 * «Pendiente Drive» que solo se diferencian en el selector de variación del
 * emoji. Esta función vuelca las antiguas sobre las actuales.
 *
 * Solo mueve etiquetas: no marca leído, no archiva y no borra ningún correo.
 *
 * @param {boolean} [borrarAntiguas] true: borra además la etiqueta ya vacía.
 *   Por defecto false, para poder comprobar el resultado antes de borrar nada.
 */
function unificarEtiquetasDrive(borrarAntiguas) {
  var grupos = [
    { viejas: CONFIG.labelsLegacyDescargado, nueva: CONFIG.labelDescargado },
    { viejas: CONFIG.labelsLegacyPendiente,  nueva: CONFIG.labelPendiente }
  ];

  grupos.forEach(function (grupo) {
    var destino = GmailApp.getUserLabelByName(grupo.nueva) || GmailApp.createLabel(grupo.nueva);

    grupo.viejas.forEach(function (nombre) {
      var vieja = GmailApp.getUserLabelByName(nombre);
      if (!vieja) { Logger.log("· «" + nombre + "»: no existe, nada que hacer."); return; }

      var movidos = 0;
      for (var vuelta = 0; vuelta < 50; vuelta++) {   // tope de seguridad: 5.000 hilos
        var hilos = vieja.getThreads(0, 100);
        if (!hilos.length) break;
        destino.addToThreads(hilos);
        vieja.removeFromThreads(hilos);
        movidos += hilos.length;
        if (hilos.length < 100) break;
      }

      Logger.log("· «" + nombre + "» → «" + grupo.nueva + "»: " + movidos + " hilo(s) movidos.");
      if (borrarAntiguas) {
        try {
          vieja.deleteLabel();
          Logger.log("  🗑 Etiqueta «" + nombre + "» borrada.");
        } catch (e) {
          Logger.log("  ⚠️ No se pudo borrar «" + nombre + "»: " + e.message);
        }
      }
    });
  });

  Logger.log("✅ Unificación terminada" +
             (borrarAntiguas ? "." : ". Repite con unificarEtiquetasDrive(true) para borrar las vacías."));
}

// ── TRIGGER DIARIO ────────────────────────────────────────────────────────────
function instalarTriggerDiario() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === "repasoDiario" || fn === "repasoMensual") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("repasoDiario").timeBased().everyDays(1).atHour(8).create();
  Logger.log("⏰ Trigger diario instalado: todos los días a las 08:00.");
}

// ── CONTROL DE IDs PROCESADOS ─────────────────────────────────────────────────
function _cargarProc() {
  if (_proc) return _proc;
  var props = PropertiesService.getScriptProperties();
  var keys = props.getKeys().filter(function (k) { return k.indexOf(CONFIG.propKeyProcesados) === 0; });
  var map = {}, maxIdx = 0;
  keys.forEach(function (k) {
    try {
      var o = JSON.parse(props.getProperty(k) || "{}");
      for (var id in o) map[id] = o[id];
      var suf = k.substring(CONFIG.propKeyProcesados.length);
      var i = suf ? parseInt(suf.replace("_", ""), 10) : 0;
      if (!isNaN(i) && i > maxIdx) maxIdx = i;
    } catch (e) {}
  });
  var curKey = maxIdx === 0 ? CONFIG.propKeyProcesados : CONFIG.propKeyProcesados + "_" + maxIdx;
  var curObj = {};
  try { curObj = JSON.parse(props.getProperty(curKey) || "{}"); } catch (e) {}
  _proc = { map: map, idx: maxIdx, obj: curObj };
  return _proc;
}

function estaProcessado(id) { return !!_cargarProc().map[id]; }

function marcarProcesado(id) {
  var p = _cargarProc();
  if (p.map[id]) return;
  var iso = new Date().toISOString();
  p.map[id] = iso;
  p.obj[id] = iso;

  var props = PropertiesService.getScriptProperties();
  var s = JSON.stringify(p.obj);
  var curKey = p.idx === 0 ? CONFIG.propKeyProcesados : CONFIG.propKeyProcesados + "_" + p.idx;
  props.setProperty(curKey, s);

  if (s.length > 8000) { p.idx++; p.obj = {}; }
}

function verProgreso() {
  var props = PropertiesService.getScriptProperties();
  var keys = props.getKeys().filter(function (k) { return k.indexOf(CONFIG.propKeyProcesados) === 0; });
  var total = 0;
  keys.forEach(function (k) {
    try { total += Object.keys(JSON.parse(props.getProperty(k) || "{}")).length; } catch (e) {}
  });
  return total;
}

function resetearProgreso() {
  var props = PropertiesService.getScriptProperties();
  props.getKeys()
    .filter(function (k) { return k.indexOf(CONFIG.propKeyProcesados) === 0; })
    .forEach(function (k) { props.deleteProperty(k); });
  _proc = null;
  Logger.log("🗑 Progreso reseteado. Se reprocesará todo (las huellas evitan duplicar archivos).");
}

// ── UTILIDADES ────────────────────────────────────────────────────────────────
function crearSiNoExiste(parent, nombre) {
  var f = parent.getFoldersByName(nombre);
  if (f.hasNext()) return f.next();
  return parent.createFolder(nombre);
}

function fFecha(f) { return Utilities.formatDate(f, "UTC", "yyyy/MM/dd"); }

// ── PRUEBA EN SECO DE LA CLASIFICACIÓN ────────────────────────────────────────
/**
 * Clasifica los últimos correos con adjunto SIN descargar nada.
 * Úsala para afinar las listas de SENALES antes de tocar el histórico.
 */
function probarClasificacion() {
  var DIAS = 30;
  var desde = new Date(Date.now() - DIAS * 24 * 60 * 60 * 1000);
  var threads = GmailApp.search("has:attachment after:" + fFecha(desde), 0, 50);
  var n = 0;

  threads.forEach(function (t) {
    t.getMessages().forEach(function (m) {
      var ctx = contextoMensaje(m);
      m.getAttachments({ includeInlineImages: false, includeAttachments: true })
        .filter(esAdjuntoValido)
        .forEach(function (a) {
          var tam = 0; try { tam = a.getSize(); } catch (e) {}
          var texto = textoInternoArchivo(a.getName(), tam, function () { return a.copyBlob(); });
          var cls = clasificarAmbito({
            nombreArchivo: a.getName(), asunto: ctx.asunto, from: ctx.from,
            to: ctx.to, cuerpo: ctx.cuerpo, textoArchivo: texto
          });
          n++;
          Logger.log(pad(cls.ambito, 9) + " " + pad(String(cls.score), 4) + " " +
                     a.getName() + "   ← " + cls.motivos.join(" · "));
        });
    });
  });
  Logger.log("── " + n + " adjuntos evaluados en los últimos " + DIAS + " días (nada descargado).");
}

function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
