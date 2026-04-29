// ═══════════════════════════════════════════════════════════════
// HORIZONTE EMIRATES — Telegram Oportunidades v2
// Canal privado de oportunidades inmobiliarias en Dubai.
//
// Programación: día sí / día no (una publicación cada 2 días civil en SCHEDULE_TIMEZONE).
// Hora de envío: alterna DENTRO de la ventana laboral (BUSINESS_HOUR_* + SEND_HOUR_SLOTS + TG_THEME_INDEX).
// Trigger: cada hora; solo ejecuta envío en “día sí”, ventana laboral y cuando la hora actual = slot de esa ronda.
// Cada envío: 2 proyectos; perfil rota con TG_THEME_INDEX (mismo índice que elige la hora del slot).
// Estructura de cada publicación:
//   Un solo sendMessage HTML: cabecera + 2 proyectos + CTA Calendly y WhatsApp.
//   Enlaces wa.me con ?text= precargado: uno por proyecto y otro genérico en el cierre
//   (texto corto, sin paréntesis raros, para que el popup de Telegram sea legible).
//
// Columnas en projects_master (foto estilo “Dubai Club”):
//   foto_url       → URL HTTPS de la IMAGEN (archivo .jpg/.png/.webp o CDN), no la página HTML.
//                    Cómo obtenerla: web promotora → proyecto → clic derecho en render / hero →
//                    “Abrir imagen en nueva pestaña” → copiar URL (debe cargar solo la imagen).
//                    Telegram descarga esa URL con sendPhoto; si la web bloquea bots, puede fallar.
//   fuente_url     → URL de la página oficial del proyecto (enlace en el pie del caption).
//   notas_internas → solo uso interno / web; no se publica en Telegram (canal sin fechas ni notas internas).
//   precio_desde_aed → número (ej: 850000)
//
// SETUP:
//   Valores por defecto en TG_CONFIG (Apps Script: copiar tal cual o ajustar).
//   1. initProjectsSheet() + importProjectsFromDrive() deben haberse ejecutado ya
//   2. testTelegramConnection() — un mensaje corto al canal
//   3. testWeeklyMessagePreview() — solo Logger (sin Telegram): textos del próximo envío
//   4. createTelegramTrigger() — cada hora (zona del proyecto = SCHEDULE_TIMEZONE)
//
// PRUEBAS EN CANAL (mensajes reales):
//   • sendOportunidadesForzado() — envío completo ya mismo; ignora calendario/ventana/duplicado.
//     Avanza TG_THEME_INDEX (igual que un envío real).
//   • sendOportunidadesPruebaSinRotar() — mismo envío forzado pero NO incrementa TG_THEME_INDEX
//     (repite tema y slot de hora de la próxima ronda programada; útil para testear muchas veces).
//   • sendProjectAlert('project_id') — un solo proyecto + CTA (desde hoja projects_master).
//   • testSendPhoto(url) — probar sendPhoto con URL fija o fake caption.
//
// ÍNDICE DE FUNCIONES (todas se usan salvo las marcadas “solo diagnóstico”):
//   Programación: _oportunidades*, _isAlternatingSendDay, _get/_advance Theme*, _currentHourInTz,
//                 _sendHourSlots, _targetSendHourForCurrentRound, _isWithinBusinessHour,
//                 _shouldRunScheduledSendNow, sendWeeklyOportunidades, sendOportunidadesForzado,
//                 sendOportunidadesPruebaSinRotar, createTelegramTrigger
//   Contenido:    _build*, _sendProjectCard, _format*, _loadActiveProjects, _findProjectById,
//                 _selectProjectsForTheme, _shuffleArray
//   Telegram:     _sendTelegramMessage(To), _sendTelegramPhoto, _telegramPost, _telegramToken/ChannelId
//   Otros envíos: sendProjectAlert, sendInternalLeadsSummary (requiere hoja Leads + chatId)
//   Diagnóstico:  testTelegramConnection, testWeeklyMessagePreview, testSendPhoto, debugTelegramGetUpdates
// ═══════════════════════════════════════════════════════════════

const TG_CONFIG = {
  // Si el repo es compartido o público, revoca el token en @BotFather (/revoke) y sustituye aquí.
  BOT_TOKEN:       '8358149283:AAFtPW2jru2nyx6_Kq4nB5EU8ObA7q1poX8',
  CHANNEL_ID:      '-1003931276651',
  SPREADSHEET_ID:  '133X4oyXfvAusuhvme7eYISNPfSZ1N0BkIt3oq1WKxXc',
  SHEET_PROJECTS:  'projects_master',
  CALENDLY_URL:    'https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-20-minutos',
  WA_LINK:         'https://wa.me/971554722025',
  NUM_PROYECTOS:   2,
  /** Zona horaria para “día sí / día no” y “ya enviado hoy” (calendario civil) */
  SCHEDULE_TIMEZONE: 'Europe/Andorra',
  /** Inicio ventana laboral (hora local SCHEDULE_TIMEZONE). Fuera de esto no se envía. */
  BUSINESS_HOUR_START: 9,
  /** Fin ventana inclusive (ej. 18 = hasta las 18:00). */
  BUSINESS_HOUR_END:   18,
  /**
   * Horas candidatas dentro de la ventana; en cada envío se usa SEND_HOUR_SLOTS[ TG_THEME_INDEX % length ].
   * Así la hora varía entre publicaciones sin salir del horario laboral.
   */
  SEND_HOUR_SLOTS:     [9, 11, 13, 15, 17],
  /** 0 o 1: desplaza un día la serie si quieres que “hoy” pase a ser día de envío */
  SEND_DAY_OFFSET:   0,
  /** Reservado (no hay envío de email en este script; se puede usar desde otro .gs) */
  ALERT_EMAIL:     'civcomercial2010@gmail.com',
  EUR_PER_AED:     0.25,   // tasa de conversión AED → EUR (actualizar si cambia)
};

const TG_PROPS = {
  LAST_SEND_YMD: 'TG_LAST_OPORTUNIDADES_YMD',
  THEME_INDEX:   'TG_THEME_INDEX',
};

// ── Perfiles (orden de rotación en cada envío) ───────────────
const MESSAGE_THEMES = [
  { id: 'entrada_baja',      label: 'Entrada baja',                 perfil: 'Entrada baja' },
  { id: 'alta_rentabilidad', label: 'Alta rentabilidad',             perfil: 'Alta rentabilidad' },
  { id: 'revalorizacion',    label: 'Revalorización',                 perfil: 'Revalorización' },
  { id: 'lujo',              label: 'Segmento lujo y exclusividad', perfil: 'Lujo' },
];

function _oportunidadesYmdToday(tz) {
  return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
}

function _oportunidadesAlreadySentToday(tz) {
  const ymd = PropertiesService.getScriptProperties().getProperty(TG_PROPS.LAST_SEND_YMD);
  return ymd === _oportunidadesYmdToday(tz);
}

function _markOportunidadesSentToday(tz) {
  PropertiesService.getScriptProperties().setProperty(TG_PROPS.LAST_SEND_YMD, _oportunidadesYmdToday(tz));
}

/** Día “sí”: (índice del día civil + offset) paridad par; día “no”: impar */
function _isAlternatingSendDay(date, tz) {
  const s = Utilities.formatDate(date, tz, 'yyyy-MM-dd').split('-').map(function (x) { return parseInt(x, 10); });
  const dayIdx = Math.floor(Date.UTC(s[0], s[1] - 1, s[2]) / 86400000);
  const off = (Number(TG_CONFIG.SEND_DAY_OFFSET) || 0) & 1;
  return ((dayIdx + off) % 2) === 0;
}

function _getThemeIndexForNextSend() {
  const raw = PropertiesService.getScriptProperties().getProperty(TG_PROPS.THEME_INDEX);
  const n = parseInt(raw, 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

function _advanceThemeIndexAfterSend() {
  const p = PropertiesService.getScriptProperties();
  const n = _getThemeIndexForNextSend() + 1;
  p.setProperty(TG_PROPS.THEME_INDEX, String(n));
}

/** Hora local 0–23 en `tz` */
function _currentHourInTz(date, tz) {
  return parseInt(Utilities.formatDate(date, tz, 'H'), 10);
}

function _sendHourSlots() {
  const raw = TG_CONFIG.SEND_HOUR_SLOTS;
  const slots = Array.isArray(raw) ? raw : [9, 12, 15];
  const out = [];
  for (let i = 0; i < slots.length; i++) {
    const h = Math.floor(Number(slots[i]));
    if (!isNaN(h) && h >= 0 && h <= 23) out.push(h);
  }
  return out.length ? out : [9, 12, 15];
}

/** Hora objetivo de esta ronda (alineada con el índice de tema / ronda) */
function _targetSendHourForCurrentRound() {
  const slots = _sendHourSlots();
  const idx = _getThemeIndexForNextSend() % slots.length;
  return slots[idx];
}

function _isWithinBusinessHour(h) {
  const a = Number(TG_CONFIG.BUSINESS_HOUR_START);
  const b = Number(TG_CONFIG.BUSINESS_HOUR_END);
  const lo = isNaN(a) ? 9 : a;
  const hi = isNaN(b) ? 18 : b;
  return h >= lo && h <= hi;
}

/** true si hoy toca enviar a esta hora (día sí, no duplicado, ventana laboral, hora = slot) */
function _shouldRunScheduledSendNow(date, tz) {
  if (!_isAlternatingSendDay(date, tz)) return false;
  if (_oportunidadesAlreadySentToday(tz)) return false;
  const h = _currentHourInTz(date, tz);
  if (!_isWithinBusinessHour(h)) return false;
  return h === _targetSendHourForCurrentRound();
}

// ══════════════════════════════════════════════════════════════
// ENVÍO PROGRAMADO (día sí / día no, 2 proyectos, tema rotativo)
// @param {boolean} [forzar] — true: ignora calendario y “ya enviado hoy” (uso manual)
// @param {boolean} [pruebaSinAvanzarTema] — solo si forzar=true: no incrementa TG_THEME_INDEX
// ══════════════════════════════════════════════════════════════
function sendWeeklyOportunidades(forzar, pruebaSinAvanzarTema) {
  const force = forzar === true;
  const noAdvanceTheme = force && pruebaSinAvanzarTema === true;

  if (!_telegramToken() || !_telegramChannelId()) {
    Logger.log('❌ BOT_TOKEN o CHANNEL_ID no configurados en TG_CONFIG.');
    return;
  }

  const tz = TG_CONFIG.SCHEDULE_TIMEZONE || Session.getScriptTimeZone() || 'Europe/Andorra';
  const now = new Date();

  if (!force) {
    if (!_shouldRunScheduledSendNow(now, tz)) return;
  }

  const projects = _loadActiveProjects();
  if (projects.length === 0) {
    Logger.log('⚠️ No hay proyectos activos en projects_master.');
    return;
  }

  const themeRound = _getThemeIndexForNextSend();
  const theme      = MESSAGE_THEMES[themeRound % MESSAGE_THEMES.length];
  let selected     = _selectProjectsForTheme(projects, theme);

  if (selected.length === 0) {
    Logger.log('⚠️ Sin proyectos para el tema: ' + theme.label + '. Usando aleatorios.');
    selected = _shuffleArray(projects).slice(0, TG_CONFIG.NUM_PROYECTOS);
  }

  const unified = _buildUnifiedOportunidadesPost(theme, themeRound + 1, selected);
  const sent    = _sendTelegramMessage(unified, 'HTML');
  if (!sent.ok) {
    Logger.log('❌ Fallo envío Telegram unificado: ' + JSON.stringify(sent));
    return;
  }

  if (!force) {
    _markOportunidadesSentToday(tz);
  }
  if (!noAdvanceTheme) {
    _advanceThemeIndexAfterSend();
  }

  Logger.log('✅ Envío completado: ' + selected.length + ' proyectos. Tema: ' + theme.id +
    (noAdvanceTheme ? ' (forzado, prueba sin rotar tema)' : force ? ' (forzado)' : ''));
}

/** Ignora día sí/no y duplicado del mismo día — solo uso manual desde el editor */
function sendOportunidadesForzado() {
  sendWeeklyOportunidades(true, false);
}

/** Forzado como el anterior, pero no cambia TG_THEME_INDEX (ni el slot de hora de la siguiente ronda). */
function sendOportunidadesPruebaSinRotar() {
  sendWeeklyOportunidades(true, true);
}

// ══════════════════════════════════════════════════════════════
// ALERTA PUNTUAL — un proyecto concreto
// Uso: sendProjectAlert('EMAAR_GOLFHI_001')
// ══════════════════════════════════════════════════════════════
function sendProjectAlert(projectId) {
  const project = _findProjectById(projectId);
  if (!project) {
    Logger.log('❌ Proyecto no encontrado: ' + projectId);
    return;
  }
  const html = [
    '🚨 <b>ALERTA OPORTUNIDAD — Horizonte Emirates</b>',
    '',
    '────────────',
    _buildProjectBlockHtml(project),
    '',
    _buildCtaMessage(),
  ].join('\n');
  const sent = _sendTelegramMessage(_truncateTelegramHtml(html, 4090), 'HTML');
  if (!sent.ok) Logger.log('❌ Fallo alerta Telegram: ' + JSON.stringify(sent));
}

// ══════════════════════════════════════════════════════════════
// RESUMEN INTERNO DE LEADS (para tu chat privado)
// Uso: sendInternalLeadsSummary('TU_CHAT_ID')
// ══════════════════════════════════════════════════════════════
function sendInternalLeadsSummary(chatId) {
  const target  = chatId || _telegramChannelId();
  const ss      = SpreadsheetApp.openById(TG_CONFIG.SPREADSHEET_ID);
  const sheet   = ss.getSheetByName('Leads');
  if (!sheet) return;

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const leads   = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.toLowerCase()] = row[i]; });
    return obj;
  });

  const hoy    = new Date();
  const semana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nuevos = leads.filter(l => l.fecha && new Date(l.fecha) >= semana);
  const tierA  = nuevos.filter(l => l.tier === 'A').length;
  const tierB  = nuevos.filter(l => l.tier === 'B').length;
  const tierC  = nuevos.filter(l => l.tier === 'C').length;

  const msg = [
    '📊 <b>Resumen semanal — Horizonte Emirates</b>',
    '',
    '🔔 Leads captados esta semana: <b>' + nuevos.length + '</b>',
    '  • Tier A: ' + tierA + '  • Tier B: ' + tierB + '  • Tier C: ' + tierC,
    'Total acumulado: <b>' + leads.length + '</b> leads',
    '',
    '🔗 <a href="https://docs.google.com/spreadsheets/d/' + TG_CONFIG.SPREADSHEET_ID + '">Abrir CRM</a>',
  ].join('\n');

  _sendTelegramMessageTo(target, msg, 'HTML');
}

// ══════════════════════════════════════════════════════════════
// CONSTRUCTORES DE MENSAJES
// ══════════════════════════════════════════════════════════════

/** Escapa texto que viene de Sheets para meterlo dentro de etiquetas HTML de Telegram */
function _escapeHtmlText(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Enlaces en atributo href (p. ej. & de query strings) */
function _hrefForTelegramHtml(url) {
  return String(url || '').replace(/&/g, '&amp;');
}

/** Nombre para el texto precargado de WhatsApp */
function _projectNameForWa(project) {
  const n = _investorDisplay(project.nombre_proyecto, false);
  if (n && n !== '—') return n.length <= 100 ? n : n.substring(0, 99) + '…';
  return 'el proyecto de este mensaje';
}

/** wa.me con saludo y pedido de dossier del proyecto concreto — texto breve para el aviso de Telegram */
function _waPrefillHrefForProject(project) {
  const nombre = _projectNameForWa(project);
  const body = [
    'Hola,',
    '',
    'Os escribo desde el canal Horizonte Emirates en Telegram.',
    '',
    'Quiero información y el dossier de este proyecto:',
    nombre,
    '',
    'Gracias.',
  ].join('\n');
  return TG_CONFIG.WA_LINK + '?text=' + encodeURIComponent(body);
}

/** wa.me para el CTA general del pie — sin proyecto concreto */
function _waPrefillHrefTeamGeneral() {
  const body = [
    'Hola,',
    '',
    'Os escribo desde el canal Horizonte Emirates – Oportunidades.',
    'Quiero hablar con el equipo para orientación general.',
    '',
    'Gracias.',
  ].join('\n');
  return TG_CONFIG.WA_LINK + '?text=' + encodeURIComponent(body);
}

/**
 * Cabecera de la entrega fusionada con la 1ª ficha (o compacta si va en caption de foto).
 * @param {boolean} compact — menos líneas para caber en caption 1024 junto al proyecto
 */
function _buildIssueLeadIn(theme, publicacionNum, compact) {
  const INTRO_BY_THEME = {
    'entrada_baja':      'Esta semana nos centramos en proyectos con entrada accesible — los que permiten entrar al mercado de Dubai con menos capital inicial sin renunciar a calidad de promotora.',
    'alta_rentabilidad': 'Esta semana, proyectos con mayor potencial de rentabilidad por alquiler. Zonas con demanda real, promotoras fiables y planes de pago que encajan con un perfil de renta pasiva.',
    'revalorizacion':    'Esta semana priorizamos proyectos en zonas con fuerte recorrido de revalorización. Off-plan en áreas de expansión donde el precio de compra todavía tiene margen.',
    'lujo':              'Esta semana, producto premium. Proyectos de promotoras de primer nivel, en ubicaciones consolidadas, para perfiles que buscan activos de alta gama en Dubai.',
  };
  const intro = _escapeHtmlText(INTRO_BY_THEME[theme.id] || 'Dos proyectos seleccionados esta semana para inversores hispanohablantes en Dubai y UAE.');

  if (compact) {
    return [
      '🏙️ <b>Horizonte Emirates</b>',
      '<i>' + _escapeHtmlText(theme.label) + '</i>',
      '────────────',
    ].join('\n');
  }
  return [
    '🏙️ <b>Horizonte Emirates</b>',
    '',
    intro,
    '',
    '────────────',
  ].join('\n');
}

function _buildCtaMessage() {
  return [
    '────────────',
    '¿Alguno encaja con lo que buscas?',
    '',
    'Cuéntanos tu presupuesto y objetivo — te preparamos una selección personalizada y te explicamos las condiciones reales. Sin compromiso.',
    '',
    '📞 <a href="' + _hrefForTelegramHtml(TG_CONFIG.CALENDLY_URL) + '">Reservar llamada con el equipo</a>',
    '💬 <a href="' + _hrefForTelegramHtml(_waPrefillHrefTeamGeneral()) + '">Escribirnos por WhatsApp</a>',
  ].join('\n');
}

function _truncateTelegramHtml(html, maxLen) {
  if (!html || html.length <= maxLen) return html || '';
  return html.substring(0, maxLen - 1) + '…';
}

// Tarjeta de proyecto: foto + caption si hay foto_url, si no texto.
// issueContext: solo en el 1er proyecto del envío programado — fusiona cabecera de la entrega.
function _sendProjectCard(project, rank, issueContext) {
  const rawFoto = project.foto_url;
  const fotoUrl = (_isSheetDate(rawFoto) ? '' : String(rawFoto || '').trim());
  const fotoOk  = /^https?:\/\//i.test(fotoUrl);
  const leadIn  = issueContext
    ? _buildIssueLeadIn(issueContext.theme, issueContext.publicacionNum, fotoOk)
    : '';
  const caption = _buildProjectCaption(project, rank, leadIn);

  if (fotoOk) {
    const result = _sendTelegramPhoto(fotoUrl, caption);
    if (!result.ok) {
      Logger.log('⚠️ Foto fallida para ' + project.nombre_proyecto + ': ' + JSON.stringify(result) + '. Enviando como texto.');
      _sendTelegramMessage(_buildProjectText(project, rank, leadIn), 'HTML');
    }
  } else {
    _sendTelegramMessage(_buildProjectText(project, rank, leadIn), 'HTML');
  }
}

/** Una línea que explica por qué este proyecto está en la selección */
function _buildWhyLine(project) {
  const perfil    = String(project.perfil_inversor || '');
  const promotora = String(project.promotora || '');
  const postHO    = project.post_handover === 'Sí';
  const gv        = project.golden_visa_fit === 'Sí';
  const devScore  = parseInt(project.developer_score) || 5;
  const isPremium = devScore >= 8;

  if (perfil === 'Alta rentabilidad') {
    if (isPremium) return 'Zona con alta demanda de alquiler y promotora con historial sólido de entrega.';
    if (postHO)    return 'Buena rentabilidad estimada por alquiler con pago post-entrega que facilita la operación.';
    return 'Zona con demanda real de alquiler — encaja bien con estrategia de renta pasiva.';
  }
  if (perfil === 'Revalorización') {
    if (isPremium) return 'Promotora de primer nivel en zona con fuerte recorrido de revalorización a medio plazo.';
    return 'Zona en expansión con precio de entrada todavía competitivo y buen potencial de revalorización.';
  }
  if (perfil === 'Lujo') {
    if (gv)       return 'Producto premium con perfil óptimo para Golden Visa UAE y activo de alta gama en Dubai.';
    if (isPremium) return 'Producto de alta gama de una de las promotoras más reconocidas del mercado de Dubai.';
    return 'Segmento lujo con buena ubicación y acabados que sostienen el valor a largo plazo.';
  }
  if (perfil === 'Entrada baja') {
    if (postHO) return 'Acceso al mercado de Dubai con entrada reducida y pago post-entrega — menor exposición inicial.';
    return 'Precio de entrada competitivo con promotora activa — buen punto de inicio para diversificar.';
  }
  return 'Seleccionado por su equilibrio entre zona, promotora y condiciones de pago.';
}

/** Bloque HTML de un proyecto — post unificado, alerta y pruebas */
function _buildProjectBlockHtml(project) {
  const precio = _formatPrice(project);
  const lines  = [];

  lines.push('<b>' + _investorDisplay(project.nombre_proyecto, true) + '</b>');
  lines.push('🏢 ' + _investorDisplay(project.promotora, true));
  lines.push('📍 ' + _formatZona(project));
  lines.push('🔑 ' + _formatTipos(project.tipo_unidades));
  if (precio) lines.push('💰 Desde <b>' + precio + '</b>');
  lines.push('💳 Plan de pago: <code>' + _investorDisplay(project.plan_pago_raw, true) + '</code>');
  if (project.post_handover === 'Sí') lines.push('✅ Pago post-entrega disponible');
  if (project.golden_visa_fit === 'Sí') lines.push('🛂 Perfil Golden Visa UAE');
  lines.push('');
  lines.push('<i>' + _escapeHtmlText(_buildWhyLine(project)) + '</i>');
  lines.push('');
  const rawFoto = project.foto_url;
  if (!_isSheetDate(rawFoto) && /^https?:\/\//i.test(String(rawFoto || '').trim())) {
    lines.push('🖼 <a href="' + _hrefForTelegramHtml(String(rawFoto).trim()) + '">Imagen del proyecto</a>');
  }
  const ficha = _safeUrl(project.fuente_url);
  if (ficha) lines.push('🔗 <a href="' + _hrefForTelegramHtml(ficha) + '">Proyecto oficial</a>');
  lines.push('📄 <a href="' + _hrefForTelegramHtml(_waPrefillHrefForProject(project)) + '">Solicitar dossier completo por WhatsApp</a>');
  return lines.join('\n');
}

/** Un solo mensaje: intro + N proyectos + CTA (máx. ~4096 Telegram) */
function _buildUnifiedOportunidadesPost(theme, publicacionNum, projects) {
  const chunks = [];
  chunks.push(_buildIssueLeadIn(theme, publicacionNum, false));
  chunks.push('');
  chunks.push('📌 <b>Selección #' + publicacionNum + '</b> · foco <i>' + _escapeHtmlText(theme.label) + '</i>.');
  chunks.push('');
  const n = Math.min(projects.length, TG_CONFIG.NUM_PROYECTOS);
  for (let i = 0; i < n; i++) {
    chunks.push('────────────');
    chunks.push('🔹 <b>Oportunidad ' + (i + 1) + ' de ' + n + '</b>');
    chunks.push('');
    chunks.push(_buildProjectBlockHtml(projects[i]));
    if (i < n - 1) chunks.push('');
  }
  chunks.push('');
  chunks.push(_buildCtaMessage());
  return _truncateTelegramHtml(chunks.join('\n'), 4090);
}

// Caption sendPhoto (Telegram máx. 1024 caracteres HTML)
function _buildProjectCaption(project, rank, leadIn) {
  leadIn = leadIn || '';
  const precio = _formatPrice(project);
  const lines  = [];

  lines.push('<b>' + _investorDisplay(project.nombre_proyecto, true) + '</b>');
  lines.push('🏢 ' + _investorDisplay(project.promotora, true) + ' · 📍 ' + _formatZona(project));
  lines.push('🔑 ' + _formatTipos(project.tipo_unidades));
  if (precio) lines.push('💰 Desde ' + precio);
  lines.push('💳 Plan de pago: <code>' + _investorDisplay(project.plan_pago_raw, true) + '</code>');
  if (project.post_handover === 'Sí') lines.push('✅ Pago post-entrega');
  if (project.golden_visa_fit === 'Sí') lines.push('🛂 Perfil Golden Visa UAE');
  lines.push('');
  lines.push('<i>' + _escapeHtmlText(_buildWhyLine(project)) + '</i>');
  const ficha = _safeUrl(project.fuente_url);
  if (ficha) lines.push('🔗 <a href="' + _hrefForTelegramHtml(ficha) + '">Proyecto oficial</a>');
  lines.push('📄 <a href="' + _hrefForTelegramHtml(_waPrefillHrefForProject(project)) + '">Solicitar dossier completo por WhatsApp</a>');

  const body = lines.join('\n');
  const merged = leadIn ? (leadIn + '\n\n' + body) : body;
  return _truncateTelegramHtml(merged, 1024);
}

// sendMessage (hasta ~4096)
function _buildProjectText(project, rank, leadIn) {
  leadIn = leadIn || '';
  const precio = _formatPrice(project);
  const lines  = [];

  lines.push('<b>' + _investorDisplay(project.nombre_proyecto, true) + '</b>');
  lines.push('🏢 ' + _investorDisplay(project.promotora, true));
  lines.push('📍 ' + _formatZona(project));
  lines.push('🔑 ' + _formatTipos(project.tipo_unidades));
  if (precio) lines.push('💰 Desde <b>' + precio + '</b>');
  lines.push('💳 Plan de pago: <code>' + _investorDisplay(project.plan_pago_raw, true) + '</code>');
  if (project.post_handover === 'Sí') lines.push('✅ Pago post-entrega disponible');
  if (project.golden_visa_fit === 'Sí') lines.push('🛂 Perfil Golden Visa UAE');
  lines.push('');
  lines.push('<i>' + _escapeHtmlText(_buildWhyLine(project)) + '</i>');
  lines.push('');
  const ficha = _safeUrl(project.fuente_url);
  if (ficha) lines.push('🔗 <a href="' + _hrefForTelegramHtml(ficha) + '">Proyecto oficial</a>');
  lines.push('📄 <a href="' + _hrefForTelegramHtml(_waPrefillHrefForProject(project)) + '">Solicitar dossier completo por WhatsApp</a>');

  const body = lines.join('\n');
  const merged = leadIn ? (leadIn + '\n\n' + body) : body;
  return _truncateTelegramHtml(merged, 4000);
}

// ══════════════════════════════════════════════════════════════
// HELPERS DE FORMATO
// ══════════════════════════════════════════════════════════════

/** true si Sheets devolvió un Date (getValues) */
function _isSheetDate(value) {
  return Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime());
}

/**
 * Texto para el canal: sin fechas ni horas visibles.
 * Valores Date de Sheets o dumps tipo "Sun Apr … GMT" → no se publican (— o vacío).
 */
function _investorDisplay(value, useDashIfEmpty) {
  if (value === null || value === undefined || value === '') {
    return useDashIfEmpty ? '—' : '';
  }
  if (_isSheetDate(value)) {
    return useDashIfEmpty ? '—' : '';
  }
  const s = String(value).trim();
  if (/GMT[+-]\d{4}|Central European|Coordinated Universal|Daylight Time/i.test(s)) {
    return useDashIfEmpty ? '—' : '';
  }
  return s;
}

function _safeUrl(value) {
  if (value === null || value === undefined || value === '') return '';
  if (_isSheetDate(value)) return '';
  const s = String(value).trim().replace(/^['"`]+|['"`]+$/g, '');
  if (!/^https?:\/\//i.test(s)) return '';
  return s;
}

function _formatPrice(project) {
  const aed = parseInt(project.precio_desde_aed);
  if (!aed || isNaN(aed)) return '';
  const eur = Math.round(aed * TG_CONFIG.EUR_PER_AED / 1000) * 1000;
  return _numFmt(aed) + ' AED (~' + _numFmt(eur) + ' €)';
}

function _numFmt(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function _formatZona(project) {
  let z = _investorDisplay(project.zona_principal, true);
  const city = _investorDisplay(project.ciudad, false);
  if (city && city !== 'Dubai') z += ', ' + city;
  return z;
}

function _formatTipos(tipos) {
  const cell = _investorDisplay(tipos, false);
  if (!cell) return '—';
  const parts = cell.split('|');
  const beds  = (parts[0] || '').trim().split(',').map(b => {
    const n = b.trim();
    return n === '0' ? 'Studio' : n + 'BR';
  });
  const tipo = (parts[1] || '').trim();
  return beds.join(', ') + (tipo ? ' (' + tipo + ')' : '');
}

// ══════════════════════════════════════════════════════════════
// HELPERS DE DATOS
// ══════════════════════════════════════════════════════════════

function _loadActiveProjects() {
  const ss    = SpreadsheetApp.openById(TG_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TG_CONFIG.SHEET_PROJECTS);
  if (!sheet) return [];
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    })
    .filter(p => p.activo_web === 'Sí' && p.nombre_proyecto);
}

function _findProjectById(projectId) {
  const projects = _loadActiveProjects();
  return projects.find(p => p.project_id === projectId) || null;
}

function _selectProjectsForTheme(projects, theme) {
  // Prioriza proyectos con foto y/o precio
  const filtered = projects.filter(p => p.perfil_inversor === theme.perfil);
  const conFoto   = filtered.filter(p => String(p.foto_url || '').trim());
  const sinFoto   = filtered.filter(p => !String(p.foto_url || '').trim());
  const pool      = [..._shuffleArray(conFoto), ..._shuffleArray(sinFoto)];
  return pool.slice(0, TG_CONFIG.NUM_PROYECTOS);
}

function _shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════
// API TELEGRAM
// ══════════════════════════════════════════════════════════════

function _sendTelegramMessage(text, parseMode) {
  return _sendTelegramMessageTo(_telegramChannelId(), text, parseMode);
}

function _sendTelegramMessageTo(chatId, text, parseMode) {
  const url     = 'https://api.telegram.org/bot' + _telegramToken() + '/sendMessage';
  const payload = {
    chat_id:                  String(chatId),
    text:                     text,
    parse_mode:               parseMode || 'HTML',
    // Sin tarjetas de preview (evita foto/perfil al enlazar wa.me u otras URLs)
    disable_web_page_preview: true,
  };
  return _telegramPost(url, payload);
}

function _sendTelegramPhoto(photoUrl, caption) {
  const url     = 'https://api.telegram.org/bot' + _telegramToken() + '/sendPhoto';
  const payload = {
    chat_id:    _telegramChannelId(),
    photo:      photoUrl,
    caption:    caption || '',
    parse_mode: 'HTML',
  };
  return _telegramPost(url, payload);
}

function _telegramPost(url, payload) {
  try {
    const response = UrlFetchApp.fetch(url, {
      method:             'post',
      contentType:        'application/json',
      payload:            JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log('Error Telegram API: ' + e.message);
    return { ok: false, error: e.message };
  }
}

function _telegramToken()    { return String(TG_CONFIG.BOT_TOKEN   || '').trim(); }
function _telegramChannelId(){ return String(TG_CONFIG.CHANNEL_ID  || '').trim().replace(/^['"`]+|['"`]+$/g, ''); }

// ══════════════════════════════════════════════════════════════
// TRIGGER
// ══════════════════════════════════════════════════════════════
function createTelegramTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendWeeklyOportunidades') ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('sendWeeklyOportunidades')
    .timeBased()
    .everyHours(1)
    .create();

  const scriptTz = Session.getScriptTimeZone();
  const schedTz  = TG_CONFIG.SCHEDULE_TIMEZONE || scriptTz;
  const slots    = _sendHourSlots().join(', ');
  Logger.log('✅ Trigger Telegram: cada HORA. El envío solo ocurre en día “sí”, entre ' +
    TG_CONFIG.BUSINESS_HOUR_START + '–' + TG_CONFIG.BUSINESS_HOUR_END + 'h (' + schedTz + '), ' +
    'cuando la hora coincida con uno de los slots: [' + slots + '] (rotan con TG_THEME_INDEX).');
  if (scriptTz !== schedTz) {
    Logger.log('⚠️ Zona del proyecto Apps Script <' + scriptTz + '> ≠ SCHEDULE_TIMEZONE <' + schedTz +
      '>. Igualalas: la hora del reloj del trigger y la del filtro deben coincidir.');
  }
}

// ══════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════
function testTelegramConnection() {
  if (!_telegramToken() || !_telegramChannelId()) {
    Logger.log('❌ Configura BOT_TOKEN y CHANNEL_ID antes de testear.');
    return;
  }
  const result = _sendTelegramMessage(
    '🔧 <b>Test de conexión — Horizonte Emirates</b>\nSistema activo. Precio y fotos habilitados en v2.',
    'HTML'
  );
  Logger.log(result.ok ? '✅ Conexión OK.' : '❌ Error: ' + JSON.stringify(result));
}

function testWeeklyMessagePreview() {
  const projects = _loadActiveProjects();
  if (projects.length === 0) {
    Logger.log('⚠️ Sin proyectos. Ejecuta importProjectsFromDrive() primero.');
    return;
  }
  const themeRound = _getThemeIndexForNextSend();
  const theme      = MESSAGE_THEMES[themeRound % MESSAGE_THEMES.length];
  const selected   = _selectProjectsForTheme(projects, theme);

  Logger.log('=== PREVIEW — MENSAJE ÚNICO (HTML) · TG_THEME_INDEX=' + themeRound + ' ===');
  Logger.log(_buildUnifiedOportunidadesPost(theme, themeRound + 1, selected));
}

// Probar foto con una URL concreta sin tocar el Sheet
function testSendPhoto(photoUrl) {
  const fakeProject = {
    nombre_proyecto: 'Test Foto',
    promotora:       'Test Developer',
    zona_principal:  'Downtown Dubai',
    ciudad:          'Dubai',
    tipo_unidades:   '1, 2 | apartment',
    precio_desde_aed: 850000,
    plan_pago_raw:   '10/70/20',
    handover_raw:    'Q2 2028',
    post_handover:   'No',
    golden_visa_fit: 'No',
    perfil_inversor: 'Revalorización',
    notas_internas:  '',
  };
  const caption = _buildProjectCaption(fakeProject, 1, '');
  const result  = _sendTelegramPhoto(photoUrl || 'https://via.placeholder.com/800x500.jpg', caption);
  Logger.log(result.ok ? '✅ Foto enviada OK.' : '❌ Error foto: ' + JSON.stringify(result));
}

function debugTelegramGetUpdates() {
  const url = 'https://api.telegram.org/bot' + _telegramToken() + '/getUpdates?limit=30';
  const r   = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log(r.getContentText());
}
