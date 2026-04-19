// ═══════════════════════════════════════════════════════════════
// HORIZONTE EMIRATES — Projects Importer
// Lee el archivo .pipe desde Google Drive y puebla la pestaña
// projects_master en el mismo Spreadsheet del CRM de leads.
//
// SETUP:
//   1. Subir export-propertyfinder-dubai.pipe a Google Drive
//   2. Copiar el ID del archivo en PIPE_FILE_NAME o PIPE_FILE_ID
//   3. Ejecutar initProjectsSheet() una vez
//   4. Ejecutar importProjectsFromDrive() para la carga inicial
//   5. Los proyectos ya estarán disponibles para el matching engine
// ═══════════════════════════════════════════════════════════════

const IMPORT_CONFIG = {
  SPREADSHEET_ID:     '133X4oyXfvAusuhvme7eYISNPfSZ1N0BkIt3oq1WKxXc',
  SHEET_PROJECTS:     'projects_master',
  SHEET_CHANGE_LOG:   'change_log',
  SHEET_REVIEW:       'manual_review',
  PIPE_FILE_NAME:     'export-propertyfinder-dubai.pipe',
  // Alternativa: pega aquí el ID del archivo en Drive (más robusto que buscar por nombre)
  PIPE_FILE_ID:       '',
  ALERT_EMAIL:        'civcomercial2010@gmail.com',
};

// ── DEVELOPER SCORES ───────────────────────────────────────────
const DEVELOPER_SCORES = {
  'Emaar Properties':      { score: 9, segmento: 'luxury' },
  'Nakheel':               { score: 9, segmento: 'luxury' },
  'Meraas Holding':        { score: 9, segmento: 'luxury' },
  'Sobha Realty':          { score: 8, segmento: 'premium' },
  'Damac Properties':      { score: 7, segmento: 'premium' },
  'Ellington':             { score: 7, segmento: 'premium' },
  'Binghatti Developers':  { score: 6, segmento: 'mass' },
  'Azizi Developments':    { score: 5, segmento: 'mass' },
  'Danube Properties':     { score: 7, segmento: 'mass' },
  'Imtiaz Developments':   { score: 5, segmento: 'mass' },
  'Nshama':                { score: 6, segmento: 'mass' },
  'Dubai Properties':      { score: 7, segmento: 'mass' },
  'OCTA Properties':       { score: 4, segmento: 'mass' },
  'Select Group':          { score: 6, segmento: 'premium' },
  'Citi Developers':       { score: 4, segmento: 'mass' },
};

// ── SCORE TABLE POR PERFIL ─────────────────────────────────────
const PERFIL_SCORES = {
  'Alta rentabilidad': { rentabilidad: 10, revalorizacion: 5, lujo: 3, entradaBaja: 4 },
  'Revalorización':    { rentabilidad: 5,  revalorizacion: 10, lujo: 5, entradaBaja: 3 },
  'Lujo':              { rentabilidad: 3,  revalorizacion: 5,  lujo: 10, entradaBaja: 1 },
  'Entrada baja':      { rentabilidad: 5,  revalorizacion: 3,  lujo: 1,  entradaBaja: 10 },
};

// ── INICIALIZAR HOJA ───────────────────────────────────────────
function initProjectsSheet() {
  const ss = SpreadsheetApp.openById(IMPORT_CONFIG.SPREADSHEET_ID);

  _initSheet(ss, IMPORT_CONFIG.SHEET_PROJECTS, [
    'project_id','promotora','nombre_proyecto','zona_principal','sub_zona','ciudad',
    'tipo_unidades','plan_pago_raw','post_handover','handover_raw',
    'handover_trimestre','handover_anyo','launch_status','disponibilidad',
    'perfil_inversor','score_rentabilidad','score_revalorizacion',
    'score_lujo','score_entrada_baja','golden_visa_fit',
    'precio_desde_aed','precio_desde_eur','developer_score',
    'activo_web','destacado_web','fuente','fuente_url','foto_url',
    'ultima_actualizacion','notas_internas',
  ]);

  _initSheet(ss, IMPORT_CONFIG.SHEET_CHANGE_LOG, [
    'fecha','project_id','campo_modificado','valor_anterior','valor_nuevo','fuente','notas',
  ]);

  _initSheet(ss, IMPORT_CONFIG.SHEET_REVIEW, [
    'project_id','nombre_provisional','motivo_revision','fecha_marcado','asignado_a','estado',
  ]);

  Logger.log('✅ Hojas inicializadas correctamente.');
}

function _initSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    Logger.log('Creada pestaña: ' + name);
  } else {
    sheet.clearContents();
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

// ── IMPORTAR DESDE GOOGLE DRIVE ────────────────────────────────
function importProjectsFromDrive() {
  const raw = _readPipeFile();
  if (!raw) {
    Logger.log('❌ No se pudo leer el archivo .pipe. Revisar PIPE_FILE_NAME o PIPE_FILE_ID.');
    Logger.log('→ El script usa la cuenta de Google con la que abriste Apps Script: el .pipe debe estar en ESE Drive o compartido contigo.');
    return;
  }

  const { rows, reviewRows } = _parsePipeData(raw);
  const ss = SpreadsheetApp.openById(IMPORT_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(IMPORT_CONFIG.SHEET_PROJECTS);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log('✅ Importados ' + rows.length + ' proyectos en projects_master.');
  } else {
    Logger.log('❌ 0 filas válidas para projects_master. Ejecuta diagnosticoImportProyectos() y revisa el registro.');
  }

  if (reviewRows.length > 0) {
    const reviewSheet = ss.getSheetByName(IMPORT_CONFIG.SHEET_REVIEW);
    reviewSheet.getRange(2, 1, reviewRows.length, reviewRows[0].length).setValues(reviewRows);
    Logger.log('⚠️ ' + reviewRows.length + ' proyectos enviados a manual_review.');
  }

  _sendImportSummary(rows.length, reviewRows.length);
}

function _readPipeFile() {
  // Opción 1: buscar por ID (más robusto)
  if (IMPORT_CONFIG.PIPE_FILE_ID) {
    try {
      const file = DriveApp.getFileById(IMPORT_CONFIG.PIPE_FILE_ID);
      return file.getBlob().getDataAsString('UTF-8');
    } catch (e) {
      Logger.log('Error leyendo por ID: ' + e.message);
    }
  }

  // Opción 2: buscar por nombre
  const files = DriveApp.getFilesByName(IMPORT_CONFIG.PIPE_FILE_NAME);
  if (files.hasNext()) {
    return files.next().getBlob().getDataAsString('UTF-8');
  }

  return null;
}

/**
 * Ejecutar desde Apps Script → Registro: indica si Drive devuelve el .pipe,
 * cuántas líneas tienen 7+ columnas (separador "|") y cuántas filas pasan el QC.
 */
function diagnosticoImportProyectos() {
  const raw = _readPipeFile();
  if (!raw) {
    Logger.log('❌ DIAG: _readPipeFile() = null. Causas típicas:');
    Logger.log('  · PIPE_FILE_ID mal copiado o archivo no compartido con tu cuenta');
    Logger.log('  · Nombre distinto a "' + IMPORT_CONFIG.PIPE_FILE_NAME + '" y PIPE_FILE_ID vacío');
    Logger.log('  · Archivo en otro Google Workspace sin acceso para esta cuenta');
    return;
  }
  const clean = raw.trim().replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/);
  Logger.log('✅ DIAG: archivo leído, ' + raw.length + ' caracteres, ' + lines.length + ' líneas (incl. cabecera).');
  Logger.log('   Primera línea (120 chars): ' + String(lines[0] || '').substring(0, 120));

  let noParse = 0;
  let parseOk = 0;
  for (let i = 1; i < lines.length; i++) {
    if (_parsePipeLine(lines[i])) parseOk++;
    else noParse++;
  }
  Logger.log('   Líneas parseables (7 campos lógicos, tipos puede llevar |): ' + parseOk);
  Logger.log('   Líneas no parseables (<7 segmentos mínimos): ' + noParse);

  const { rows, reviewRows } = _parsePipeData(raw);
  Logger.log('→ Parse final: ' + rows.length + ' → projects_master, ' + reviewRows.length + ' → manual_review');
}

/**
 * Formato .pipe: promotora | nombre | zona | tipo_unidades | plan | handover | perfil
 * tipo_unidades puede contener "|" (ej. "1, 2, 3 | apartment" o "N/A | N/A") → no usar split fijo en 7.
 */
function _parsePipeLine(line) {
  const parts = line.split('|');
  if (parts.length < 7) return null;
  const perfil = parts.pop().trim();
  const handoverRaw = parts.pop().trim();
  const planPago = parts.pop().trim();
  if (parts.length < 4) return null;
  return {
    promotora: parts[0].trim(),
    nombre: parts[1].trim(),
    zonaRaw: parts[2].trim(),
    tipos: parts.slice(3).join('|').trim(),
    planPago: planPago,
    handoverRaw: handoverRaw,
    perfil: perfil,
  };
}

// ── PARSEO Y NORMALIZACIÓN ─────────────────────────────────────
function _parsePipeData(raw) {
  const lines = raw.trim().replace(/^\uFEFF/, '').split(/\r?\n/);
  const rows = [];
  const reviewRows = [];
  const today = new Date().toISOString().split('T')[0];
  const seenIds = {};

  for (let i = 1; i < lines.length; i++) {
    const parsed = _parsePipeLine(lines[i]);
    if (!parsed) continue;

    const promotora = parsed.promotora;
    const nombre = parsed.nombre;
    const zonaRaw = parsed.zonaRaw;
    const tipos = parsed.tipos;
    const planPago = parsed.planPago;
    const handoverRaw = parsed.handoverRaw;
    const perfil = parsed.perfil;

    // Control de calidad R1–R6
    const qcFail = _qcCheck({ promotora, nombre, zonaRaw, handoverRaw, planPago, perfil });
    if (qcFail) {
      reviewRows.push([
        '', nombre, qcFail, today, 'admin', 'pendiente',
      ]);
      continue;
    }

    const projectId      = _generateProjectId(promotora, nombre, seenIds);
    seenIds[projectId]   = true;
    const handover       = _parseHandover(handoverRaw);
    const scores         = PERFIL_SCORES[perfil] || PERFIL_SCORES['Revalorización'];
    const devInfo        = DEVELOPER_SCORES[promotora] || { score: 5, segmento: 'mass' };
    const ciudad         = _extractCiudad(zonaRaw);
    const postHandover   = _hasPostHandover(planPago);
    const goldenVisa     = _isGoldenVisaFit(handover, perfil, devInfo.segmento);

    rows.push([
      projectId,
      promotora,
      nombre,
      _extractMainZona(zonaRaw),
      _extractSubZona(zonaRaw),
      ciudad,
      tipos,
      planPago,
      postHandover ? 'Sí' : 'No',
      handoverRaw,
      handover.trimestre,
      handover.anyo === 9999 ? '' : handover.anyo,
      'lanzado',
      'disponible',
      perfil,
      scores.rentabilidad,
      scores.revalorizacion,
      scores.lujo,
      scores.entradaBaja,
      goldenVisa,
      '',    // precio_desde_aed — pendiente de enriquecer con datos de RRS
      '',    // precio_desde_eur — pendiente
      devInfo.score,
      'Sí',  // activo_web
      'No',  // destacado_web
      'PropertyFinder',
      '',    // fuente_url — URL página oficial del proyecto (recomendado)
      '',    // foto_url — URL directa .jpg/.png/.webp (ver telegram_oportunidades.gs)
      today,
      '',    // notas_internas
    ]);
  }

  return { rows, reviewRows };
}

function _qcCheck({ promotora, nombre, zonaRaw, handoverRaw, planPago, perfil }) {
  if (!promotora)   return 'R1: promotora vacía';
  if (!nombre)      return 'R2: nombre_proyecto vacío';
  if (!zonaRaw)     return 'R3: zona vacía';
  if (!handoverRaw) return 'R4: handover vacío';
  if (!planPago)    return 'R5: plan_pago vacío';
  const perfilesValidos = ['Alta rentabilidad','Revalorización','Lujo','Entrada baja'];
  if (!perfilesValidos.includes(perfil)) return 'R6: perfil_inversor no reconocido: ' + perfil;
  return null;
}

function _generateProjectId(promotora, nombre, seen) {
  const p = promotora.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const n = nombre.replace(/\s+/g, '').substring(0, 6).toUpperCase();
  let base = p + '_' + n;
  let id = base + '_001';
  let counter = 1;
  while (seen[id]) {
    counter++;
    id = base + '_' + String(counter).padStart(3, '0');
  }
  return id;
}

function _parseHandover(raw) {
  if (!raw || raw === 'N/A') return { trimestre: 'N/A', anyo: 9999 };
  const m = raw.match(/(Q[1-4])\s*(\d{4})/i);
  if (m) return { trimestre: m[1].toUpperCase(), anyo: parseInt(m[2]) };
  const y = raw.match(/(\d{4})/);
  if (y) return { trimestre: 'Q?', anyo: parseInt(y[1]) };
  return { trimestre: 'N/A', anyo: 9999 };
}

function _hasPostHandover(planPago) {
  if (!planPago || planPago === 'N/A') return false;
  // El tercer bloque (post-handover) se detecta cuando hay ≥3 partes y el último > 0
  const parts = planPago.split('/').map(s => parseInt(s.trim()));
  if (parts.length >= 3 && !isNaN(parts[parts.length - 1])) {
    return parts[parts.length - 1] > 0;
  }
  return false;
}

function _isGoldenVisaFit(handover, perfil, segmento) {
  // Golden Visa UAE: inmueble ≥ AED 2M pagado. Aplica bien en lujo y handover ≤ 2028.
  if (segmento === 'luxury' && handover.anyo <= 2028) return 'Sí';
  if (perfil === 'Lujo' && handover.anyo <= 2029) return 'Probable';
  return 'No';
}

function _extractCiudad(zonaRaw) {
  const uae = [
    { key: 'Ras Al Khaimah', label: 'Ras Al Khaimah' },
    { key: 'Abu Dhabi',      label: 'Abu Dhabi' },
    { key: 'Umm Al Quwain',  label: 'Umm Al Quwain' },
    { key: 'Sharjah',        label: 'Sharjah' },
  ];
  for (const { key, label } of uae) {
    if (zonaRaw.includes(key)) return label;
  }
  return 'Dubai';
}

function _extractMainZona(zonaRaw) {
  return (zonaRaw || '').split(',')[0].trim();
}

function _extractSubZona(zonaRaw) {
  const parts = (zonaRaw || '').split(',');
  return parts.length > 1 ? parts[1].trim() : '';
}

function _sendImportSummary(imported, reviewed) {
  const subject = '✅ Horizonte Emirates — Importación proyectos completada';
  const body = [
    'Se ha completado la importación inicial de proyectos.',
    '',
    'Proyectos importados en projects_master: ' + imported,
    'Proyectos en manual_review (requieren revisión): ' + reviewed,
    '',
    'Próximo paso: revisar manual_review y completar los campos pendientes (precio, URL fuente).',
    '',
    'Abre el Spreadsheet: https://docs.google.com/spreadsheets/d/' + IMPORT_CONFIG.SPREADSHEET_ID,
  ].join('\n');

  MailApp.sendEmail(IMPORT_CONFIG.ALERT_EMAIL, subject, body);
}

// ── ACTUALIZACIÓN INCREMENTAL ──────────────────────────────────
// Compara el archivo .pipe actualizado contra projects_master
// y registra solo los cambios (sin borrar lo ya importado).
function updateProjectsIncremental() {
  const raw = _readPipeFile();
  if (!raw) return;

  const { rows } = _parsePipeData(raw);
  const ss = SpreadsheetApp.openById(IMPORT_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(IMPORT_CONFIG.SHEET_PROJECTS);
  const changeLog = ss.getSheetByName(IMPORT_CONFIG.SHEET_CHANGE_LOG);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('project_id');
  const nombreCol = headers.indexOf('nombre_proyecto');

  // Índice de proyectos existentes por nombre (más robusto que por ID)
  const existingByNombre = {};
  for (let r = 1; r < data.length; r++) {
    const nombre = data[r][nombreCol];
    if (nombre) existingByNombre[nombre] = r;
  }

  const today = new Date().toISOString().split('T')[0];
  let updated = 0;
  let newProjects = 0;
  const changeRows = [];

  for (const newRow of rows) {
    const nombre = newRow[2]; // nombre_proyecto en columna C (índice 2)
    if (existingByNombre[nombre] !== undefined) {
      // Comparar campos críticos: handover (col J=9), plan_pago (col H=7), perfil (col O=14)
      const existingRow = data[existingByNombre[nombre]];
      const fieldsToCheck = [
        { col: 7,  name: 'plan_pago_raw' },
        { col: 9,  name: 'handover_raw' },
        { col: 14, name: 'perfil_inversor' },
      ];
      for (const { col, name } of fieldsToCheck) {
        if (existingRow[col] !== newRow[col]) {
          changeRows.push([today, existingRow[idCol], name, existingRow[col], newRow[col], 'auto', '']);
          sheet.getRange(existingByNombre[nombre] + 1, col + 1).setValue(newRow[col]);
          updated++;
        }
      }
    } else {
      // Proyecto nuevo: añadir al final
      sheet.appendRow(newRow);
      newProjects++;
    }
  }

  if (changeRows.length > 0) {
    changeLog.getRange(changeLog.getLastRow() + 1, 1, changeRows.length, changeRows[0].length)
      .setValues(changeRows);
  }

  Logger.log('Actualización incremental: ' + newProjects + ' nuevos, ' + updated + ' campos actualizados.');
}
