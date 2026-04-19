// ═══════════════════════════════════════════════════════════════
// HORIZONTE EMIRATES — Matching Engine
// Motor de recomendación lead → proyectos con scoring 0–100 pts.
//
// Integración con horizonte-emails.gs:
//   - Lee leads de la pestaña 'Leads' (misma hoja CRM)
//   - Lee proyectos de 'projects_master'
//   - Escribe resultados en 'lead_matches'
//   - Puede llamarse desde processNewLead() en horizonte-emails.gs
//
// USO DIRECTO:
//   matchNewLeads()       → procesa todos los leads sin match previo
//   matchSingleLead(id)   → procesa un lead concreto por su lead_id
//   testMatching()        → prueba con un lead ficticio y muestra resultados
// ═══════════════════════════════════════════════════════════════

const ME_CONFIG = {
  SPREADSHEET_ID:   '133X4oyXfvAusuhvme7eYISNPfSZ1N0BkIt3oq1WKxXc',
  SHEET_LEADS:      'Leads',
  SHEET_PROJECTS:   'projects_master',
  SHEET_MATCHES:    'lead_matches',
  TOP_N_PROJECTS:   5,    // cuántos proyectos recomendar por lead
  MIN_SCORE:        30,   // score mínimo para incluir en resultados
  ALERT_EMAIL:      'civcomercial2010@gmail.com',
};

// ── SCORING WEIGHTS (total = 100) ──────────────────────────────
const WEIGHTS = {
  capital:    30,   // Capital del lead vs perfil del proyecto
  objetivo:   30,   // Objetivo de inversión vs perfil del proyecto
  timing:     25,   // Plazo de decisión vs handover del proyecto
  developer:  15,   // Solidez y reputación de la promotora
};

// ── MATRIZ CAPITAL → PERFIL PROYECTO ──────────────────────────
// Cuántos puntos (de 30) suma cada combinación capital/perfil
const CAPITAL_PERFIL_SCORE = {
  '150k-300k': { 'Entrada baja': 30, 'Alta rentabilidad': 18, 'Revalorización': 10, 'Lujo': 0 },
  '300k-600k': { 'Alta rentabilidad': 30, 'Revalorización': 25, 'Entrada baja': 15, 'Lujo': 8 },
  '600k-1M':   { 'Revalorización': 30, 'Alta rentabilidad': 22, 'Lujo': 18, 'Entrada baja': 5 },
  'mas1M':     { 'Lujo': 30, 'Revalorización': 22, 'Alta rentabilidad': 15, 'Entrada baja': 0 },
};

// ── MATRIZ OBJETIVO → PERFIL PROYECTO ─────────────────────────
const OBJETIVO_PERFIL_SCORE = {
  'alquiler':       { 'Alta rentabilidad': 30, 'Revalorización': 15, 'Entrada baja': 12, 'Lujo': 5 },
  'revalorizacion': { 'Revalorización': 30, 'Alta rentabilidad': 18, 'Lujo': 18, 'Entrada baja': 10 },
  'diversificacion':{ 'Revalorización': 22, 'Alta rentabilidad': 22, 'Lujo': 16, 'Entrada baja': 16 },
  'residencia':     { 'Lujo': 30, 'Revalorización': 20, 'Alta rentabilidad': 10, 'Entrada baja': 5 },
};

// ── DEVELOPER SCORE LOOKUP ─────────────────────────────────────
const DEV_SCORE_LOOKUP = {
  'Emaar Properties':      15,
  'Nakheel':               15,
  'Meraas Holding':        15,
  'Sobha Realty':          12,
  'Damac Properties':      11,
  'Ellington':             11,
  'Danube Properties':     9,
  'Binghatti Developers':  8,
  'Azizi Developments':    7,
  'Imtiaz Developments':   6,
  'Nshama':                7,
  'Dubai Properties':      8,
  'Select Group':          8,
  'OCTA Properties':       5,
  'Citi Developers':       5,
};

// ── TIMING MATRIX: PLAZO LEAD → HANDOVER ──────────────────────
// Retorna puntuación (de 25) según la proximidad entre plazo del lead y handover
function _timingScore(plazoLead, handoverAnyo) {
  if (!handoverAnyo || handoverAnyo === 9999) return 5; // handover desconocido = penalización

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQ    = Math.ceil((now.getMonth() + 1) / 3);

  // Convertir plazo a horizonte en años
  const PLAZO_MAP = {
    '3-6':   0.5,
    '6-12':  1,
    '12-24': 2,
    'mas24': 3.5,
  };
  const horizonte = PLAZO_MAP[plazoLead] || 2;

  // Años hasta el handover desde hoy
  const anyosHastaHandover = handoverAnyo - currentYear;

  const diff = Math.abs(anyosHastaHandover - horizonte);
  if (diff <= 0.5) return 25;
  if (diff <= 1)   return 20;
  if (diff <= 1.5) return 15;
  if (diff <= 2)   return 10;
  if (diff <= 3)   return 5;
  return 2;
}

// ── RAZONES DE RECOMENDACIÓN ───────────────────────────────────
function _buildReasons(lead, project, scoreCapital, scoreObjetivo, scoreTiming, scoreDev) {
  const reasons = [];

  // Razón por objetivo
  if (scoreObjetivo >= 25) {
    const objetivoTexts = {
      'alquiler':        'Plan de pago alineado con estrategia de renta pasiva desde entrega',
      'revalorizacion':  'Zona con fuerte narrativa de revalorización a medio plazo',
      'diversificacion': 'Excelente diversificación geográfica y de activo',
      'residencia':      'Producto prime con perfil óptimo para Golden Visa UAE',
    };
    reasons.push(objetivoTexts[lead.objetivo] || 'Perfil de proyecto alineado con objetivo declarado');
  }

  // Razón por capital
  if (scoreCapital >= 22) {
    reasons.push('Entrada inicial competitiva dentro del rango de capital disponible');
  } else if (scoreCapital >= 15) {
    reasons.push('Plan de pago permite entrada gradual sin comprometer liquidez');
  }

  // Razón por promotora
  if (scoreDev >= 13) {
    reasons.push('Promotora top-tier con historial de entregas sólido');
  } else if (scoreDev >= 10) {
    reasons.push('Promotora consolidada con producto diferenciado en la zona');
  }

  // Razón por timing
  if (scoreTiming >= 20) {
    reasons.push('Handover alineado con el horizonte temporal de inversión');
  }

  // Post-handover
  if (project.post_handover === 'Sí') {
    reasons.push('Plan de pago post-entrega: menor presión de liquidez inicial');
  }

  // Golden Visa
  if (project.golden_visa_fit === 'Sí' && lead.objetivo === 'residencia') {
    reasons.push('Elegible para Golden Visa UAE — residencia de 10 años');
  }

  return reasons.slice(0, 3);
}

// ── SCORE PRINCIPAL ────────────────────────────────────────────
function _scoreLeadVsProject(lead, project) {
  const capitalTable  = CAPITAL_PERFIL_SCORE[lead.capital]   || {};
  const objetivoTable = OBJETIVO_PERFIL_SCORE[lead.objetivo] || {};
  const perfil        = project.perfil_inversor || '';

  const scoreCapital  = capitalTable[perfil]   || 0;
  const scoreObjetivo = objetivoTable[perfil]  || 0;
  const scoreTiming   = _timingScore(lead.plazo, parseInt(project.handover_anyo));
  const scoreDev      = DEV_SCORE_LOOKUP[project.promotora] || 5;

  const total = scoreCapital + scoreObjetivo + scoreTiming + scoreDev;

  const reasons = _buildReasons(lead, project, scoreCapital, scoreObjetivo, scoreTiming, scoreDev);

  return {
    total,
    scoreCapital,
    scoreObjetivo,
    scoreTiming,
    scoreDev,
    reasons,
  };
}

// ── CARGA DE DATOS DESDE SHEET ─────────────────────────────────
function _loadProjects(ss) {
  const sheet = ss.getSheetByName(ME_CONFIG.SHEET_PROJECTS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  }).filter(p => p.activo_web === 'Sí' && String(p.project_id || '').trim() !== '');
}

function _loadLeads(ss) {
  const sheet = ss.getSheetByName(ME_CONFIG.SHEET_LEADS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 }; // 1-indexed, +1 for header
    headers.forEach((h, j) => { obj[h.toLowerCase().replace(/\s+/g, '_')] = row[j]; });
    return obj;
  });
}

function _loadExistingMatches(ss) {
  const sheet = ss.getSheetByName(ME_CONFIG.SHEET_MATCHES);
  if (!sheet) return new Set();
  const data = sheet.getDataRange().getValues();
  const matched = new Set();
  // match_id está en columna A
  for (let r = 1; r < data.length; r++) {
    const mid = String(data[r][0]);
    const leadId = mid.split('_')[0];
    if (leadId) matched.add(leadId);
  }
  return matched;
}

// ── FUNCIÓN PRINCIPAL ──────────────────────────────────────────
function matchNewLeads() {
  const ss = SpreadsheetApp.openById(ME_CONFIG.SPREADSHEET_ID);
  const projects = _loadProjects(ss);
  const leads    = _loadLeads(ss);
  const matched  = _loadExistingMatches(ss);

  if (projects.length === 0) {
    Logger.log('❌ No hay proyectos en projects_master. Ejecutar importProjectsFromDrive() primero.');
    return;
  }

  const pendingLeads = leads.filter(l => {
    const id = l.lead_id || l.id || '';
    return id && !matched.has(String(id));
  });

  Logger.log('Leads pendientes de matching: ' + pendingLeads.length);

  const allMatchRows = [];
  for (const lead of pendingLeads) {
    const matchRows = _computeMatchesForLead(lead, projects);
    allMatchRows.push(...matchRows);
  }

  if (allMatchRows.length > 0) {
    _writeMatchesToSheet(ss, allMatchRows);
    Logger.log('✅ Escritos ' + allMatchRows.length + ' matches en lead_matches.');
  }
}

function matchSingleLead(leadId) {
  const ss = SpreadsheetApp.openById(ME_CONFIG.SPREADSHEET_ID);
  const projects = _loadProjects(ss);
  const leads    = _loadLeads(ss);

  const lead = leads.find(l => String(l.lead_id || l.id || '') === String(leadId));
  if (!lead) {
    Logger.log('❌ Lead no encontrado: ' + leadId);
    return [];
  }

  const matchRows = _computeMatchesForLead(lead, projects);
  if (matchRows.length > 0) {
    _writeMatchesToSheet(ss, matchRows);
  }
  return matchRows;
}

function _computeMatchesForLead(lead, projects) {
  const leadId = String(lead.lead_id || lead.id || '');
  if (!leadId) return [];

  const scored = projects.map(p => {
    const result = _scoreLeadVsProject(lead, p);
    return { project: p, ...result };
  });

  // Ordenar por score descendente y tomar top N por encima del mínimo
  const topProjects = scored
    .filter(r => r.total >= ME_CONFIG.MIN_SCORE)
    .sort((a, b) => b.total - a.total)
    .slice(0, ME_CONFIG.TOP_N_PROJECTS);

  const today = new Date().toISOString().split('T')[0];

  return topProjects.map((r, idx) => {
    const projectId = r.project.project_id || '';
    const matchId   = leadId + '_' + projectId;
    return [
      matchId,
      leadId,
      projectId,
      r.total,
      r.scoreCapital,
      r.scoreObjetivo,
      r.scoreTiming,
      r.scoreDev,
      r.reasons[0] || '',
      r.reasons[1] || '',
      r.reasons[2] || '',
      idx + 1,    // rank
      'No',       // enviado_lead
      '',         // fecha_envio
      'No',       // email_abierto
      'No',       // clic_proyecto
      'No',       // llamada_reservada
      '',         // feedback
    ];
  });
}

function _writeMatchesToSheet(ss, rows) {
  let sheet = ss.getSheetByName(ME_CONFIG.SHEET_MATCHES);
  if (!sheet) {
    sheet = ss.insertSheet(ME_CONFIG.SHEET_MATCHES);
    const headers = [
      'match_id','lead_id','project_id','match_score',
      'score_capital','score_objetivo','score_timing','score_developer',
      'razon_1','razon_2','razon_3','rank',
      'enviado_lead','fecha_envio','email_abierto','clic_proyecto',
      'llamada_reservada','feedback',
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold');
  }
  const lastRow = Math.max(sheet.getLastRow(), 1);
  sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
}

// ── OBTENER TOP MATCHES DE UN LEAD (para email) ────────────────
// Retorna array de objetos con project + match info.
// Llamar desde horizonte-emails.gs para personalizar emails.
function getTopMatchesForLead(leadId) {
  const ss = SpreadsheetApp.openById(ME_CONFIG.SPREADSHEET_ID);

  const matchSheet = ss.getSheetByName(ME_CONFIG.SHEET_MATCHES);
  if (!matchSheet) return [];

  const matchData = matchSheet.getDataRange().getValues();
  const mHeaders  = matchData[0];
  const allMatches = matchData.slice(1)
    .map(row => {
      const obj = {};
      mHeaders.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    })
    .filter(m => String(m.lead_id) === String(leadId))
    .sort((a, b) => (a.rank || 99) - (b.rank || 99));

  if (allMatches.length === 0) return [];

  // Enriquecer con datos del proyecto
  const projSheet = ss.getSheetByName(ME_CONFIG.SHEET_PROJECTS);
  const projData  = projSheet.getDataRange().getValues();
  const pHeaders  = projData[0];
  const projById  = {};
  projData.slice(1).forEach(row => {
    const obj = {};
    pHeaders.forEach((h, i) => { obj[h] = row[i]; });
    projById[obj.project_id] = obj;
  });

  return allMatches.map(m => ({
    rank:          m.rank,
    match_score:   m.match_score,
    razon_1:       m.razon_1,
    razon_2:       m.razon_2,
    razon_3:       m.razon_3,
    project:       projById[m.project_id] || {},
  }));
}

// ── CONSTRUIR BLOQUE HTML DE PROYECTOS PARA EMAIL ──────────────
// Retorna string HTML listo para insertar en plantillas de email.
function buildProjectsHtmlBlock(leadId, maxProjects) {
  const matches = getTopMatchesForLead(leadId);
  const top = matches.slice(0, maxProjects || 3);
  if (top.length === 0) return '';

  let html = '<table style="width:100%;border-collapse:collapse;margin:16px 0;">';

  top.forEach((m, i) => {
    const p = m.project;
    const nombre     = p.nombre_proyecto || '—';
    const promotora  = p.promotora       || '—';
    const zona       = p.zona_principal  || '—';
    const handover   = p.handover_raw    || '—';
    const plan       = p.plan_pago_raw   || '—';
    const perfil     = p.perfil_inversor || '—';
    const razon      = m.razon_1         || '';

    html += `
    <tr>
      <td style="padding:12px;border:1px solid #e0e0e0;vertical-align:top;background:#f9fafb;">
        <strong style="font-size:14px;color:#1a73e8;">${i + 1}. ${nombre}</strong>
        <span style="font-size:12px;color:#555;margin-left:8px;">${promotora}</span>
        <br>
        <span style="font-size:12px;color:#333;">📍 ${zona}</span>
        &nbsp;&nbsp;
        <span style="font-size:12px;color:#333;">🏗️ Entrega: ${handover}</span>
        &nbsp;&nbsp;
        <span style="font-size:12px;color:#333;">💳 ${plan}</span>
        <br>
        <span style="font-size:12px;color:#0d8243;font-style:italic;">✓ ${razon}</span>
      </td>
    </tr>`;
  });

  html += '</table>';
  return html;
}

// ── TEST ───────────────────────────────────────────────────────
function testMatching() {
  const testLead = {
    lead_id:    'TEST_001',
    capital:    '300k-600k',
    objetivo:   'revalorizacion',
    plazo:      '12-24',
    pais:       'España',
    tier:       'A',
  };

  const ss = SpreadsheetApp.openById(ME_CONFIG.SPREADSHEET_ID);
  const projects = _loadProjects(ss);

  if (projects.length === 0) {
    Logger.log('⚠️ No hay proyectos cargados. Ejecuta importProjectsFromDrive() primero.');
    return;
  }

  Logger.log('=== TEST MATCHING ===');
  Logger.log('Lead: capital=' + testLead.capital + ' | objetivo=' + testLead.objetivo + ' | plazo=' + testLead.plazo);
  Logger.log('Proyectos activos cargados: ' + projects.length);

  const scored = projects.map(p => {
    const r = _scoreLeadVsProject(testLead, p);
    return { nombre: p.nombre_proyecto, promotora: p.promotora, perfil: p.perfil_inversor, ...r };
  }).sort((a, b) => b.total - a.total).slice(0, 5);

  scored.forEach((r, i) => {
    Logger.log((i + 1) + '. [' + r.total + ' pts] ' + r.nombre + ' (' + r.promotora + ') — ' + r.perfil);
    Logger.log('   Capital:' + r.scoreCapital + ' Objetivo:' + r.scoreObjetivo + ' Timing:' + r.scoreTiming + ' Dev:' + r.scoreDev);
    Logger.log('   → ' + r.reasons.join(' | '));
  });
}

// ── TRIGGER: CONFIGURAR EJECUCIÓN CADA 6H ─────────────────────
function createMatchingTrigger() {
  // Eliminar triggers previos de matchNewLeads
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'matchNewLeads') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('matchNewLeads')
    .timeBased()
    .everyHours(6)
    .create();
  Logger.log('✅ Trigger matchNewLeads creado: cada 6 horas.');
}
