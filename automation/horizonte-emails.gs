// ═══════════════════════════════════════════════════════════════
// HORIZONTE EMIRATES — Email Automation Engine
// Google Apps Script · Propulse SLU · Andorra
//
// SETUP RÁPIDO:
//   1. Crear Google Sheet vacío → copiar su ID en CONFIG.SPREADSHEET_ID
//   2. script.google.com → nuevo proyecto → pegar este código en Code.gs
//   3. Ejecutar initSheets() una sola vez
//   4. Ejecutar createTriggers() una sola vez
//   5. Autorizar permisos (Gmail + Sheets)
//   → Ver automation/SETUP.md para instrucciones completas
// ═══════════════════════════════════════════════════════════════

// ── CONFIGURACIÓN ──────────────────────────────────────────────
const CONFIG = {
  SPREADSHEET_ID:  '133X4oyXfvAusuhvme7eYISNPfSZ1N0BkIt3oq1WKxXc',
  ASESOR_NOMBRE:   'Horizonte Emirates',
  REPLY_TO:        'hola@horizonteemirates.com',
  AGENT_BRIEFING_EMAIL: 'civcomercial2010@gmail.com',
  WA_NUMBER:       '+971 55 472 2025',
  WA_LINK:         'https://wa.me/971554722025',
  CALENDLY_URL:    'https://calendly.com/horizonteemirates',
  CALENDAR_ID:     'primary', // calendario donde Calendly crea las reuniones
  CALENDLY_EVENT_KEYWORD: 'Llamada estratégica inversión Dubai',
  UNSUBSCRIBE_URL: 'mailto:hola@horizonteemirates.com?subject=BAJA%20COMUNICACIONES',
  LABEL_PROCESADO: 'HE-procesado',
  LABEL_BAJAS:     'HE-bajas-procesado',
  // Busca todos los emails de Web3Forms no leídos (compatible V1, V2, V3)
  // Cualquier remitente @web3forms.com (evita perder avisos si cambian la cuenta de envío)
  POLL_QUERY:          'from:web3forms.com is:unread',
  // Reintento: últimos días sin etiqueta de procesado (útil si el correo se marcó leído antes del trigger)
  POLL_QUERY_FALLBACK: 'from:web3forms.com newer_than:3d -label:HE-procesado',
  // Respuestas de leads que pueden contener solicitud de baja
  UNSUBSCRIBE_QUERY: 'to:hola@horizonteemirates.com is:unread -from:web3forms.com',
  UNSUBSCRIBE_KEYWORDS: [
    'baja', 'darme de baja', 'darse de baja', 'no me escribas', 'no me escriban',
    'no más correos', 'no mas correos', 'cancelar suscripción', 'cancelar suscripcion',
    'stop', 'unsubscribe',
  ],
  // Palabras clave para confirmar que el email es de Horizonte Emirates (además, isHorizonteWeb3Lead detecta «Lead HE Vn» en asunto).
  POLL_KEYWORDS:   ['Horizonte Emirates', 'HE V6', 'HE V5', 'HE V3', 'HE V2'],
  TEST_MODE:       false, // true → simula sin enviar emails reales
  /**
   * Nombre mostrado como remitente (Gmail «De:»). Vacío → se usa ASESOR_NOMBRE.
   * Para tono 1:1 suele ayudar un nombre de persona + marca, p. ej. "Laura · Horizonte Emirates"
   * (requiere que la cuenta de envío sea coherente con vuestro dominio/reputación).
   */
  EMAIL_SENDER_NAME: '',
  /**
   * Secuencia a leads (processQueue): solo envía en ventana laboral. Fuera de ella los ítems siguen «pendiente».
   * false = permitir 24/7 (solo si necesitáis excepción puntual).
   */
  BUSINESS_HOURS_ONLY: true,
  /** Zona horaria IANA para interpretar hora y día laborable (p. ej. Andorra / Madrid). */
  BUSINESS_TIMEZONE: 'Europe/Andorra',
  /** Hora local inclusive (0–23), ej. 9 = desde las 09:00. */
  BUSINESS_HOUR_START: 9,
  /** Hora local exclusiva (0–23), ej. 19 = hasta 18:59 (no envía a partir de las 19:00). */
  BUSINESS_HOUR_END: 19,
  /** Si true, sábado y domingo no hay envíos de secuencia. */
  BUSINESS_WEEKDAYS_ONLY: true,
};

// Etiquetas legibles para variables del email
const CAPITAL_LABELS = {
  '150k-300k': '150.000 – 300.000 €',
  '300k-600k': '300.000 – 600.000 €',
  '600k-1M':   '600.000 – 1.000.000 €',
  'mas1M':     'más de 1.000.000 €',
};
const OBJETIVO_LABELS = {
  'alquiler':       'generar renta pasiva con alquiler',
  'revalorizacion': 'revalorización del capital',
  'diversificacion':'diversificación geográfica del patrimonio',
  'residencia':     'obtener residencia en UAE',
};
// ── DETECCIÓN DE GÉNERO POR NOMBRE ────────────────────────────
// Lista de nombres femeninos comunes en español (España + LATAM).
// Se normalizan sin tilde para comparar.
// Ante la duda → masculino (comportamiento por defecto).
const FEMALE_NAMES = new Set([
  // España — nombres clásicos y frecuentes
  'maria','ana','carmen','isabel','pilar','teresa','dolores','rosa','josefa',
  'francisca','manuela','concepcion','encarnacion','remedios','inmaculada',
  'asuncion','amparo','purificacion','trinidad','angeles','milagros','gloria',
  'esperanza','mercedes','victoria','consuelo','aurora','lourdes','montserrat',
  'fatima','blanca','paloma','paz','luz','mar','sol','fe','maite','itziar',
  // España — frecuentes modernas
  'laura','patricia','elena','cristina','marta','sandra','sara','lucia',
  'alicia','beatriz','raquel','silvia','nuria','irene','paula','andrea',
  'natalia','monica','sofia','claudia','veronica','ines','lorena','rebeca',
  'noelia','alba','lidia','diana','barbara','cecilia','elisa','eva','amelia',
  'emilia','eugenia','celia','estela','esther','laia','noa','emma','carla',
  'ariadna','ainara','leire','ane','olga','tamara','angela','virginia','rita',
  'piedad','graciela','noemi','clara','regina','delia','gema','ainhoa',
  'sheila','almudena','sonia','debora','ruth','magdalena','rosario','margarita',
  'yolanda','marisol','miriam','vanessa','melissa','rocio','susana','julia',
  'araceli','paquita','lola','pepa','charo','encarna','nerea','amaia','nagore',
  'garazi','miren','iratxe','aiora','jaione','itxaso','uxue','onintze','ane',
  // LATAM — frecuentes
  'valentina','camila','isabella','ximena','antonella','florencia','agustina',
  'melina','melisa','romina','micaela','silvina','mariela','brenda','priscila',
  'sabrina','valeria','evelyn','yanira','ingrid','xiomara','karla','giuliana',
  'jimena','fernanda','alejandra','daniela','mariana','catalina','carolina',
  'paola','marcela','viviana','tatiana','adriana','gabriela','lucero','estela',
  'norma','gilda','martha','celeste','anahi','leticia','guadalupe','xiomara',
  // Genéricos reconocibles como femeninos
  'nadia','rakel','leila','layla','fatou','yasmin','jasmine','pamela','jennifer',
  'jessica','ashley','kelly','britney','whitney','madison','savannah','amber',
  'crystal','destiny','tiffany','brittany','holly','heather',
]);

function detectGender(nombre) {
  const first = (nombre || '').split(/\s+/)[0]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quitar tildes para comparar
  return FEMALE_NAMES.has(first) ? 'F' : 'M';
}

// Retorna "Estimada" o "Estimado" según el nombre.
function getSalutation(nombre) {
  return detectGender(nombre) === 'F' ? 'Estimada' : 'Estimado';
}

// Retorna la forma masculina o femenina de un adjetivo/participio.
function gendered(nombre, masc, fem) {
  return detectGender(nombre) === 'F' ? fem : masc;
}

function buildCalendlyUrl(baseUrl, lead, emailCode) {
  if (!baseUrl) return '';

  const params = [];
  const add = (k, v) => {
    if (v === null || v === undefined || String(v).trim() === '') return;
    params.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
  };

  // Prefill nativo de Calendly
  add('name', lead && lead.nombre);
  add('email', lead && lead.email);

  // Respuestas para preguntas custom del evento (a1, a2, ...)
  // Configura en Calendly esas preguntas en este orden.
  add('a1', lead && lead.capital);
  add('a2', lead && lead.objetivo);
  add('a3', lead && lead.plazo);
  add('a4', lead && lead.pais);

  // UTM mínimo (menos parámetros = URL más corta; evita cadena tipo «campaña masiva» en filtros heurísticos).
  add('utm_source', 'horizonte_emirates');
  if (emailCode) add('utm_content', emailCode);

  if (!params.length) return baseUrl;
  return baseUrl + (baseUrl.indexOf('?') >= 0 ? '&' : '?') + params.join('&');
}

function buildLeadBriefingText(lead) {
  if (!lead) return 'Lead no encontrado en CRM.';
  return [
    'Nombre: ' + (lead.nombre || ''),
    'Email: ' + (lead.email || ''),
    'Teléfono: ' + (lead.telefono || ''),
    'País: ' + (lead.pais || ''),
    'Capital: ' + (lead.capital || ''),
    'Objetivo: ' + (lead.objetivo || ''),
    'Experiencia: ' + (lead.experiencia || ''),
    'Plazo: ' + (lead.plazo || ''),
    'Visita Dubai: ' + (lead.viaje || ''),
    'Puntuación: ' + (lead.puntuacion || ''),
    'Tier: ' + (lead.tier || ''),
    'Canal: ' + (lead.canal || ''),
    'Origen: ' + (lead.origen || ''),
    'Estado: ' + (lead.estado || ''),
    'Notas: ' + (lead.notas || ''),
  ].join('\n');
}

function extractMeetingLinkFromEvent(event) {
  const direct = event.getHangoutLink && event.getHangoutLink();
  if (direct) return direct;

  const text = String(event.getDescription() || '');
  const urls = text.match(/https?:\/\/[^\s<>"')]+/g) || [];
  const meet = urls.find(u => /meet\.google\.com/i.test(u));
  return meet || urls[0] || '';
}

function extractLeadEmailFromEvent(event) {
  const agent = String(CONFIG.AGENT_BRIEFING_EMAIL || '').toLowerCase().trim();
  const reply = String(CONFIG.REPLY_TO || '').toLowerCase().trim();
  const guests = event.getGuestList();

  let firstEmail = '';
  let bestEmail = '';
  for (let i = 0; i < guests.length; i++) {
    const mail = String(guests[i].getEmail() || '').toLowerCase().trim();
    if (!mail) continue;
    if (!firstEmail) firstEmail = mail;
    if (mail !== agent && mail !== reply) {
      bestEmail = mail;
      break;
    }
  }

  // Caso normal: invitado distinto a cuenta interna
  if (bestEmail) return bestEmail;

  // Caso test: invitado = mismo email del agente
  if (firstEmail) return firstEmail;

  // Fallback: intentar extraer del cuerpo del evento de Calendly
  const desc = String(event.getDescription() || '');
  const match = desc.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  return match ? match[1].toLowerCase() : '';
}

function notifyCalendlyBookings() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('HE_CALENDLY_NOTIFIED') || '{}';
  const notified = JSON.parse(raw);

  const now = new Date();
  const lookback = new Date(now.getTime() - 6 * 60 * 60 * 1000); // últimas 6h
  const lookahead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // próximos 30 días

  const calendar = CONFIG.CALENDAR_ID === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!calendar) {
    Logger.log('No se encontró el calendario configurado: ' + CONFIG.CALENDAR_ID);
    return;
  }

  const tz = Session.getScriptTimeZone();
  const events = calendar.getEvents(lookback, lookahead);
  let sent = 0;

  events.forEach(event => {
    const title = String(event.getTitle() || '');
    if (!title.includes(CONFIG.CALENDLY_EVENT_KEYWORD)) return;

    const eventId = event.getId();
    if (notified[eventId]) return;

    const leadEmail = extractLeadEmailFromEvent(event);
    if (!leadEmail) return;

    const lead = getLeadByEmail(leadEmail);
    const start = event.getStartTime();
    const end = event.getEndTime();
    const meetingLink = extractMeetingLinkFromEvent(event);

    const subject = '[HE] Nueva reunión agendada: ' + (lead && lead.nombre ? lead.nombre : leadEmail);
    const body = [
      'Se ha agendado una nueva reunión desde Calendly.',
      '',
      'Fecha inicio: ' + Utilities.formatDate(start, tz, 'yyyy-MM-dd HH:mm'),
      'Fecha fin: ' + Utilities.formatDate(end, tz, 'yyyy-MM-dd HH:mm'),
      'Evento: ' + title,
      'Invitado: ' + leadEmail,
      'Enlace reunión/Meet: ' + (meetingLink || 'No detectado'),
      '',
      '=== BRIEFING LEAD ===',
      buildLeadBriefingText(lead),
      '',
      'ID evento calendario: ' + eventId,
    ].join('\n');

    GmailApp.sendEmail(CONFIG.AGENT_BRIEFING_EMAIL, subject, body, {
      name: CONFIG.ASESOR_NOMBRE,
      replyTo: CONFIG.REPLY_TO,
    });

    notified[eventId] = now.toISOString();
    sent++;
  });

  // Limpieza básica del registro para no crecer indefinidamente
  const cutoff = now.getTime() - (45 * 24 * 60 * 60 * 1000);
  Object.keys(notified).forEach(id => {
    const ts = new Date(notified[id]).getTime();
    if (!isNaN(ts) && ts < cutoff) delete notified[id];
  });

  props.setProperty('HE_CALENDLY_NOTIFIED', JSON.stringify(notified));
  Logger.log('notifyCalendlyBookings: briefings enviados=' + sent);
}


// Secuencias por tier — delay en HORAS desde la creación del lead
const SEQUENCES = {
  A: [
    { code: 'A1', delay: 0   },   // inmediato
    { code: 'A2', delay: 5   },   // 5 horas
    { code: 'A3', delay: 24  },   // día 1
    { code: 'A4', delay: 48  },   // día 2
    { code: 'A5', delay: 120 },   // día 5
  ],
  B: [
    { code: 'B1', delay: 0   },
    { code: 'B2', delay: 24  },
    { code: 'B3', delay: 72  },
    { code: 'B4', delay: 168 },   // 7 días
    { code: 'B5', delay: 288 },   // 12 días
    { code: 'B6', delay: 480 },   // 20 días
    { code: 'B7', delay: 840 },   // 35 días
  ],
  C: [
    { code: 'C1', delay: 0    },
    { code: 'C2', delay: 72   },
    { code: 'C3', delay: 168  },
    { code: 'C4', delay: 336  },  // 14 días
    { code: 'C5', delay: 504  },  // 21 días
    { code: 'C6', delay: 720  },  // 30 días
    { code: 'C7', delay: 1080 },  // 45 días
    { code: 'C8', delay: 2160 },  // 90 días
  ],
};


// ══════════════════════════════════════════════════════════════
// 1. POLL GMAIL — trigger cada 10 minutos
// ══════════════════════════════════════════════════════════════
function htmlToPlainForParse(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function getMessageBodyForLeadParse(msg) {
  let body = String(msg.getPlainBody() || '');
  if (body.trim().length < 40) {
    body = htmlToPlainForParse(msg.getBody());
  }
  return body;
}

/** Último mensaje del hilo (sin mutar el array devuelto por getMessages). */
function getLatestThreadMessage(thread) {
  const msgs = thread.getMessages();
  return msgs.length ? msgs[msgs.length - 1] : null;
}

/** Orden descendente por fecha del último mensaje (Gmail no garantiza orden de hilos). */
function sortThreadsByLatestMessage(threads) {
  threads.sort((a, b) => {
    const ma = getLatestThreadMessage(a);
    const mb = getLatestThreadMessage(b);
    const ta = ma ? ma.getDate().getTime() : 0;
    const tb = mb ? mb.getDate().getTime() : 0;
    return tb - ta;
  });
  return threads;
}

function ensureGmailLabel(labelName) {
  try {
    return GmailApp.getUserLabelByName(labelName) || GmailApp.createLabel(labelName);
  } catch (e) {
    return GmailApp.createLabel(labelName);
  }
}

/**
 * true si el aviso Web3Forms corresponde al embudo HE (no correos genéricos de Web3Forms).
 * Incluye asuntos tipo «[A|11pts] Lead HE V6 · País» que no llevan la cadena literal «Horizonte Emirates».
 */
function isHorizonteWeb3Lead(subject, body) {
  const s = String(subject || '');
  const b = String(body || '');
  const blob = s + '\n' + b;
  if (CONFIG.POLL_KEYWORDS.some(kw => s.includes(kw) || b.includes(kw))) return true;
  if (/Horizonte\s+Emirates/i.test(blob)) return true;
  if (/\bLead\s+HE\s+V\d+\b/i.test(s)) return true;
  return false;
}

function pollGmail() {
  let threads = GmailApp.search(CONFIG.POLL_QUERY, 0, 50);
  if (!threads.length && CONFIG.POLL_QUERY_FALLBACK) {
    threads = GmailApp.search(CONFIG.POLL_QUERY_FALLBACK, 0, 50);
  }
  if (!threads.length) {
    Logger.log('pollGmail: sin correos Web3Forms (principal ni fallback)');
    return;
  }

  // Los más recientes primero (Gmail no garantiza orden; si no, el aviso nuevo puede quedar fuera del lote)
  sortThreadsByLatestMessage(threads);

  const label = ensureGmailLabel(CONFIG.LABEL_PROCESADO);

  Logger.log('pollGmail: hilos a revisar=' + threads.length + ' | cuenta=' + Session.getActiveUser().getEmail());

  threads.forEach(thread => {
    try {
      const msg = getLatestThreadMessage(thread);
      if (!msg) return;

      if (thread.getLabels().some(l => l.getName() === CONFIG.LABEL_PROCESADO)) {
        Logger.log('pollGmail: omitido (ya etiquetado HE-procesado): ' + msg.getSubject());
        return;
      }

      const subject = msg.getSubject();
      const body    = getMessageBodyForLeadParse(msg);
      Logger.log('pollGmail: FROM=' + msg.getFrom() + ' | SUBJECT=' + subject);

      // Verificar que es un lead de Horizonte Emirates
      const isHE = isHorizonteWeb3Lead(subject, body);
      if (!isHE) {
        // No es nuestro — marcar leído y saltar sin etiquetar
        Logger.log('pollGmail: descartado (sin keyword HE): ' + subject);
        msg.markRead();
        return;
      }

      const lead = parseLeadFromEmail(body, subject);
      if (!lead || !lead.email) {
        Logger.log('No se pudo parsear lead: ' + subject);
        Logger.log('pollGmail: body snippet=\n' + body.substring(0, 600));
        thread.addLabel(label);
        msg.markRead();
        return;
      }

      if (leadExists(lead.email)) {
        Logger.log('Lead duplicado, ignorando: ' + lead.email);
        thread.addLabel(label);
        msg.markRead();
        return;
      }

      let leadId;
      try {
        leadId = saveLead(lead);
        scheduleSequence(leadId, lead.tier, new Date());
        processQueue({ immediateWelcomeAfterPoll: true });
      } catch (err) {
        Logger.log('pollGmail: ERROR al guardar en Sheets / cola: ' + err.toString());
        throw err;
      }

      thread.addLabel(label);
      msg.markRead();
      Logger.log(`✓ Lead: ${lead.nombre} [Tier ${lead.tier}|${lead.puntuacion}pts] → ${lead.email}`);

    } catch(e) {
      Logger.log('Error procesando thread: ' + e.toString());
    }
  });
}

/** Ejecutar manualmente: muestra cuenta, últimos avisos Web3Forms y si entrarían en HE + parseo. */
function diagnoseFormPipeline() {
  const me = Session.getActiveUser().getEmail();
  Logger.log('=== diagnoseFormPipeline ===');
  Logger.log('Cuenta Apps Script (debe ser la misma que recibe Web3Forms): ' + me);
  Logger.log('SPREADSHEET_ID: ' + CONFIG.SPREADSHEET_ID);

  try {
    const sh = getSheet('Leads');
    Logger.log('Sheets OK, filas Leads (aprox): ' + sh.getLastRow());
  } catch (e) {
    Logger.log('ERROR accediendo a hoja Leads: ' + e.toString());
  }

  const q = 'from:web3forms.com newer_than:3d';
  const threads = GmailApp.search(q, 0, 8);
  Logger.log('Muestra últimos hilos Web3Forms (query=' + q + '): ' + threads.length);

  threads.forEach((thread, idx) => {
    const msg = getLatestThreadMessage(thread);
    if (!msg) return;
    const subject = msg.getSubject();
    const body = getMessageBodyForLeadParse(msg);
    const tagged = thread.getLabels().some(l => l.getName() === CONFIG.LABEL_PROCESADO);
    const isHE = isHorizonteWeb3Lead(subject, body);
    const lead = isHE ? parseLeadFromEmail(body, subject) : null;

    Logger.log('--- #' + idx + ' etiquetado=' + tagged + ' ---');
    Logger.log('FROM: ' + msg.getFrom());
    Logger.log('SUBJECT: ' + subject);
    Logger.log('isHE: ' + isHE);
    Logger.log('PARSED: ' + JSON.stringify(lead));
  });
  Logger.log('=== fin diagnoseFormPipeline ===');
}

// ══════════════════════════════════════════════════════════════
// 2. DETECTAR BAJAS POR RESPUESTA — trigger cada 10 min
// ══════════════════════════════════════════════════════════════
function pollUnsubscribes() {
  const threads = GmailApp.search(CONFIG.UNSUBSCRIBE_QUERY, 0, 30);
  if (!threads.length) return;

  const label = ensureGmailLabel(CONFIG.LABEL_BAJAS);

  threads.forEach(thread => {
    try {
      const msg = getLatestThreadMessage(thread);
      if (!msg) return;
      const from = String(msg.getFrom() || '');
      const emailMatch = from.match(/<([^>]+)>/) || from.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
      const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : '';
      if (!senderEmail) return;

      const subject = String(msg.getSubject() || '').toLowerCase();
      const body = String(msg.getPlainBody() || '').toLowerCase();
      const isUnsubscribe = CONFIG.UNSUBSCRIBE_KEYWORDS.some(kw => subject.includes(kw) || body.includes(kw));

      if (!isUnsubscribe) return;

      const updated = markUnsubscribed(senderEmail);
      if (updated) {
        Logger.log('✓ Baja automática por respuesta: ' + senderEmail);
      } else {
        Logger.log('Solicitud de baja sin lead en CRM: ' + senderEmail);
      }

      thread.addLabel(label);
      msg.markRead();
    } catch(e) {
      Logger.log('Error procesando baja: ' + e.toString());
    }
  });
}


// ══════════════════════════════════════════════════════════════
// 2. PARSEAR EMAIL DE WEB3FORMS
//    Compatible con formulario V1, V2 y V3
// ══════════════════════════════════════════════════════════════
function parseLeadFromEmail(body, subject) {
  const lead = {};

  // Tier y puntuación desde el subject: "[A|11pts] ..."
  const tierMatch  = subject.match(/\[([ABC])/);
  const scoreMatch = subject.match(/\|(\d+)pts/);
  lead.tier       = tierMatch  ? tierMatch[1]       : 'C';
  lead.puntuacion = scoreMatch ? parseInt(scoreMatch[1]) : 0;

  // Parser de líneas "clave: valor" (formato Web3Forms)
  body.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
    if (!m) return;
    const key = m[1].trim().toLowerCase().replace(/[\s_]+/g, '_');
    const val = m[2].trim();

    switch (key) {
      case 'nombre':                        lead.nombre      = val; break;
      case 'apellidos':                     lead.apellidos   = val; break;
      case 'email':
      case 'e-mail':
      case 'e_mail':
      case 'correo':
      case 'correo_electronico':
      case 'correo_electrónico':
      case 'replyto':
      case 'reply_to':                         lead.email       = val.toLowerCase(); break;
      case 'telefono':                      lead.telefono    = val; break;
      case 'pais':                          lead.pais        = val; break;
      case 'capital':                       lead.capital     = val; break;
      case 'objetivo':                      lead.objetivo    = val; break;
      case 'experiencia':                   lead.experiencia = val; break;
      case 'plazo':                         lead.plazo       = val; break;
      // Compatibilidad V1 (viaje_dubai), V3 (visita_dubai) y ambos sin prefijo
      case 'viaje':
      case 'viaje_dubai':
      case 'visita_dubai':                  lead.viaje       = val; break;
      case 'canal':
      case 'canal_preferido':               lead.canal       = val; break;
      case 'tier':                          lead.tier        = val; break;
      case 'puntuacion':
      case 'puntuación':                    lead.puntuacion  = parseInt(val) || lead.puntuacion; break;
      case 'origen':                        lead.origen      = val; break;
    }
  });

  if (lead.apellidos && lead.nombre) {
    lead.nombre = (lead.nombre + ' ' + lead.apellidos).trim();
  }
  delete lead.apellidos;

  if (!lead.email) {
    const hay = (body + '\n' + subject).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    const filtered = hay.map(e => e.toLowerCase()).filter(e =>
      !e.includes('web3forms.com') && !e.startsWith('noreply@') && !e.startsWith('no-reply@')
    );
    if (filtered.length) lead.email = filtered[0];
  }

  lead.nombre = lead.nombre || 'Inversor';
  lead.pais   = lead.pais   || 'España';
  lead.canal  = lead.canal  || 'email';
  lead.origen = lead.origen || 'Formulario web';

  return lead.email ? lead : null;
}


/** Diagnóstico: último correo Web3Forms y parseo (ejecutar manual). */
function debugPollLatestWeb3Lead() {
  const q = 'from:web3forms.com newer_than:3d';
  const threads = GmailApp.search(q, 0, 8);
  if (!threads.length) {
    Logger.log('debugPollLatestWeb3Lead: sin hilos para ' + q);
    return;
  }
  sortThreadsByLatestMessage(threads);
  const th = threads[0];
  const msg = getLatestThreadMessage(th);
  if (!msg) return;
  const subject = msg.getSubject();
  const body = getMessageBodyForLeadParse(msg);
  Logger.log('FROM: ' + msg.getFrom());
  Logger.log('SUBJECT: ' + subject);
  Logger.log('BODY (primeros 900 chars):\n' + body.substring(0, 900));
  const lead = parseLeadFromEmail(body, subject);
  Logger.log('PARSED: ' + JSON.stringify(lead));
}

/**
 * Fuerza reprocesar un lead ya registrado (por si llegó con la versión rota del alias).
 * Uso: reprocesarLeadYaRegistrado('sara.perez7@gmail.com')
 */
function reprocesarLeadYaRegistrado(email) {
  const lead = getLeadByEmail(email);
  if (!lead) {
    Logger.log('reprocesarLeadYaRegistrado: lead no encontrado en Sheets: ' + email);
    return;
  }
  Logger.log('Lead encontrado: ' + JSON.stringify(lead));

  // ¿Hay emails pendientes en Cola?
  const qSheet = getSheet('Cola');
  const qData = qSheet.getDataRange().getValues();
  let pendientes = 0;
  for (let i = 1; i < qData.length; i++) {
    if (qData[i][0] === lead.id && qData[i][3] === 'pendiente') pendientes++;
  }
  Logger.log('Emails pendientes en Cola para este lead: ' + pendientes);

  // Enviar el primer email (A1/B1/C1) de forma inmediata
  const welcomeCode = lead.tier + '1';
  try {
    sendEmail(welcomeCode, lead, { bypassBusinessHours: true });
    Logger.log('✓ Email ' + welcomeCode + ' enviado a: ' + lead.email);

    // Marcar el item de Cola como enviado
    for (let i = 1; i < qData.length; i++) {
      if (qData[i][0] === lead.id && qData[i][1] === welcomeCode && qData[i][3] === 'pendiente') {
        qSheet.getRange(i+1, 4).setValue('enviado');
        qSheet.getRange(i+1, 5).setValue(new Date());
        break;
      }
    }
  } catch(e) {
    Logger.log('✗ Error enviando ' + welcomeCode + ': ' + e.toString());
  }
}

/**
 * Fuerza pollGmail de forma manual (útil si el trigger no disparó).
 * Omite la comprobación de etiqueta → reprocesa aunque ya esté etiquetado.
 */
function forzarPollGmail() {
  Logger.log('forzarPollGmail: ejecutando pollGmail ahora...');
  pollGmail();
  Logger.log('forzarPollGmail: completado. Revisar logs arriba.');
}

// ══════════════════════════════════════════════════════════════
// 3. GOOGLE SHEETS — Leads y Cola
// ══════════════════════════════════════════════════════════════
function getSheet(name) {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(name);
}

function leadExists(email) {
  const data = getSheet('Leads').getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if ((data[i][2] || '').toString().toLowerCase() === email.toLowerCase()) return true;
  }
  return false;
}

/** Compacta el teléfono para Sheets: quita espacios y separadores (+34 600 123 456 → +34600123456). */
function normalizeTelefono(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  s = s.replace(/[\s\u00A0\u200B\uFEFF]/g, '');
  s = s.replace(/[\-\.\(\)]/g, '');
  return s;
}

/** Columna D (Teléfono) como texto forzado para que +376… no se convierta en número ni en fórmula. */
function ensureLeadsTelefonoColumnTextFormat(leadsSheet) {
  const sh = leadsSheet || getSheet('Leads');
  const maxR = sh.getMaxRows();
  sh.getRange(2, 4, maxR, 4).setNumberFormat('@');
}

function saveLead(data) {
  const id    = 'L' + new Date().getTime().toString().slice(-8);
  const now   = new Date();
  const phone = normalizeTelefono(data.telefono) || '';
  const sh    = getSheet('Leads');
  sh.appendRow([
    id,
    data.nombre,
    data.email,
    phone,
    data.pais        || '',
    data.capital     || '',
    data.objetivo    || '',
    data.experiencia || '',
    data.plazo       || '',
    data.viaje       || '',
    data.puntuacion  || '',
    data.tier        || 'C',
    data.canal       || '',
    data.origen      || 'Formulario web',
    now,
    'activo',
    '',
  ]);
  const r = sh.getLastRow();
  sh.getRange(r, 4).setNumberFormat('@');
  sh.getRange(r, 4).setValue(phone);
  return id;
}

function scheduleSequence(leadId, tier, createdAt) {
  const sheet    = getSheet('Cola');
  const sequence = SEQUENCES[tier] || SEQUENCES['C'];
  sequence.forEach(item => {
    const scheduledAt = new Date(createdAt.getTime() + item.delay * 3600 * 1000);
    sheet.appendRow([leadId, item.code, scheduledAt, 'pendiente', '', '']);
  });
}

/** Fin de semana por nombre localizado (respaldo si «u» ISO no está disponible en el runtime). */
function isWeekendByLocaleName(date, tz) {
  const w = Utilities.formatDate(date, tz, 'EEEE')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return w.indexOf('sabado') >= 0 || w.indexOf('saturday') >= 0 || w.indexOf('dissabte') >= 0 ||
    w.indexOf('domingo') >= 0 || w.indexOf('sunday') >= 0 || w.indexOf('diumenge') >= 0;
}

/** true = se permite enviar email de secuencia ahora (hora + día en BUSINESS_TIMEZONE). */
function isWithinBusinessSendWindow(date) {
  if (CONFIG.BUSINESS_HOURS_ONLY === false) return true;
  const tz = CONFIG.BUSINESS_TIMEZONE || Session.getScriptTimeZone();
  const hour = parseInt(Utilities.formatDate(date, tz, 'HH'), 10);
  const start = Number(CONFIG.BUSINESS_HOUR_START);
  const end = Number(CONFIG.BUSINESS_HOUR_END);
  if (isNaN(hour) || isNaN(start) || isNaN(end)) return true;
  if (hour < start || hour >= end) return false;
  if (CONFIG.BUSINESS_WEEKDAYS_ONLY) {
    const isoDay = parseInt(Utilities.formatDate(date, tz, 'u'), 10);
    if (!isNaN(isoDay)) return isoDay >= 1 && isoDay <= 5;
    return !isWeekendByLocaleName(date, tz);
  }
  return true;
}

/** Primer email de cada tier (tras registro en web). Puede enviarse fuera de horario solo cuando processQueue viene de pollGmail. */
function isWelcomeSequenceEmail(code) {
  return code === 'A1' || code === 'B1' || code === 'C1';
}


// ══════════════════════════════════════════════════════════════
// 4. PROCESAR COLA — trigger cada hora; pollGmail pasa { immediateWelcomeAfterPoll: true } para enviar A1/B1/C1 al instante
// ══════════════════════════════════════════════════════════════
/**
 * @param {Object} [opts]
 * @param {boolean} [opts.immediateWelcomeAfterPoll] — true solo desde pollGmail tras nuevo lead: A1/B1/C1 ignoran ventana laboral.
 */
function processQueue(opts) {
  opts = opts || {};
  const qSheet = getSheet('Cola');
  const lSheet = getSheet('Leads');
  const now    = new Date();
  const inWin  = isWithinBusinessSendWindow(now);

  if (CONFIG.BUSINESS_HOURS_ONLY !== false && !inWin && !opts.immediateWelcomeAfterPoll) {
    Logger.log('processQueue: fuera de ventana laboral (' + (CONFIG.BUSINESS_TIMEZONE || Session.getScriptTimeZone()) +
      ' ' + CONFIG.BUSINESS_HOUR_START + '–' + (Number(CONFIG.BUSINESS_HOUR_END) - 1) + 'h' +
      (CONFIG.BUSINESS_WEEKDAYS_ONLY ? ', lun–vie' : '') + '); sin envíos en esta pasada.');
    return;
  }

  const qData = qSheet.getDataRange().getValues();
  const lData = lSheet.getDataRange().getValues();

  const leadsMap = {};
  for (let i = 1; i < lData.length; i++) {
    const r = lData[i];
    leadsMap[r[0]] = {
      id: r[0], nombre: r[1], email: r[2], telefono: r[3],
      pais: r[4], capital: r[5], objetivo: r[6], experiencia: r[7],
      plazo: r[8], viaje: r[9], puntuacion: r[10], tier: r[11],
      canal: r[12], estado: r[15],
    };
  }

  for (let i = 1; i < qData.length; i++) {
    const [leadId, emailCode, scheduledAt, status] = qData[i];
    if (status !== 'pendiente') continue;
    if (new Date(scheduledAt) > now) continue;

    const lead = leadsMap[leadId];
    if (!lead) { qSheet.getRange(i+1,4).setValue('error: lead no encontrado'); continue; }
    if (lead.estado === 'baja' || lead.estado === 'cerrado') {
      qSheet.getRange(i+1,4).setValue('cancelado'); continue;
    }

    const isWelcome = isWelcomeSequenceEmail(emailCode);
    if (CONFIG.BUSINESS_HOURS_ONLY !== false && !inWin && !(opts.immediateWelcomeAfterPoll && isWelcome)) {
      continue;
    }

    try {
      if (!CONFIG.TEST_MODE) {
        const bypassHours = CONFIG.BUSINESS_HOURS_ONLY !== false && !inWin &&
          Boolean(opts.immediateWelcomeAfterPoll) && isWelcome;
        sendEmail(emailCode, lead, { bypassBusinessHours: bypassHours });
      } else {
        Logger.log('[TEST] ' + emailCode + ' → ' + lead.email);
      }
      qSheet.getRange(i+1,4).setValue('enviado');
      qSheet.getRange(i+1,5).setValue(now);
      Logger.log('✓ Enviado: ' + emailCode + ' → ' + lead.email);
    } catch(e) {
      qSheet.getRange(i+1,4).setValue('error');
      qSheet.getRange(i+1,6).setValue(e.toString());
      Logger.log('✗ Error ' + emailCode + ': ' + e.toString());
    }
  }
}


// ══════════════════════════════════════════════════════════════
// 5. ENVIAR EMAIL
// ══════════════════════════════════════════════════════════════
/** Cuerpo texto plano final: plantilla + firma breve y vía de baja (multipart coherente con HTML). */
function buildEmailPlainBody(tplText) {
  const base = String(tplText || '').replace(/\r\n/g, '\n').trimEnd();
  const footer = [
    '',
    '---',
    'Responder: ' + CONFIG.REPLY_TO,
    'Si no desea seguir recibiendo estos correos, responda con la palabra BAJA.',
  ].join('\n');
  return base + footer;
}

/**
 * @param {Object} [opts]
 * @param {boolean} [opts.bypassBusinessHours] — true: prueba manual (simulateLeadEmail) o bienvenida inmediata tras form (pollGmail).
 */
function sendEmail(code, lead, opts) {
  opts = opts || {};
  if (!opts.bypassBusinessHours && CONFIG.BUSINESS_HOURS_ONLY !== false && !isWithinBusinessSendWindow(new Date())) {
    throw new Error('sendEmail fuera de ventana laboral (no debería ocurrir si processQueue filtra antes)');
  }

  const tpl = getTemplate(code, lead);
  if (!tpl) throw new Error('Template no encontrado: ' + code);

  const displayName = (CONFIG.EMAIL_SENDER_NAME && String(CONFIG.EMAIL_SENDER_NAME).trim())
    ? String(CONFIG.EMAIL_SENDER_NAME).trim()
    : CONFIG.ASESOR_NOMBRE;

  const plainBody = buildEmailPlainBody(tpl.text);
  const baseOpts = {
    name:     displayName,
    htmlBody: wrapHtml(tpl.html, tpl.subject),
    replyTo:  CONFIG.REPLY_TO,
  };

  // Intentar con alias hola@... Si no está verificado en Gmail, caer en cuenta principal.
  const aliasEmail = CONFIG.REPLY_TO;
  const accountEmail = Session.getActiveUser().getEmail();
  if (aliasEmail && aliasEmail !== accountEmail) {
    try {
      GmailApp.sendEmail(lead.email, tpl.subject, plainBody,
        Object.assign({}, baseOpts, { from: aliasEmail }));
      return;
    } catch (aliasErr) {
      Logger.log('sendEmail: alias «' + aliasEmail + '» no disponible (¿verificado en Gmail?). ' +
        'Enviando desde cuenta principal. Error: ' + aliasErr.message);
    }
  }
  GmailApp.sendEmail(lead.email, tpl.subject, plainBody, baseOpts);
}


// ══════════════════════════════════════════════════════════════
// 6. WRAPPER HTML — envuelve el contenido en plantilla de marca
// ══════════════════════════════════════════════════════════════
function wrapHtml(bodyHtml, subject) {
  // compose en Gmail (evita mailto en Windows); texto del enlace más neutro que «marketing masivo».
  const replyUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONFIG.REPLY_TO)}`;
  const unsubscribeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONFIG.REPLY_TO)}&su=${encodeURIComponent('BAJA')}&body=${encodeURIComponent('BAJA')}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="format-detection" content="telephone=no"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F0EDE5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
<tr><td align="center" style="padding:32px 16px 0">

  <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%">

    <tr><td style="background:#0D1B2A;padding:20px 32px;border-radius:4px 4px 0 0">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:500;color:#ffffff;letter-spacing:.03em;line-height:1">
        Horizonte <span style="color:#C4942A">Emirates</span>
      </span>
    </td></tr>

    <tr><td style="background:#C4942A;height:2px;font-size:0;line-height:0">&nbsp;</td></tr>

    <tr><td style="background:#ffffff;padding:36px 32px 32px;font-size:16px;color:#1A1A1A;line-height:1.7;
                   border-left:1px solid #E0DBD1;border-right:1px solid #E0DBD1;text-align:left">
      ${bodyHtml}
    </td></tr>

    <tr><td style="background:#07121F;padding:22px 32px 24px;border-radius:0 0 4px 4px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#ffffff;font-family:Georgia,serif;letter-spacing:.02em">
        Horizonte <span style="color:#C4942A">Emirates</span>
      </p>
      <p style="margin:0 0 10px;font-size:12px;color:rgba(255,255,255,.55);line-height:1.6">
        <a href="${replyUrl}" rel="noopener noreferrer" style="color:#C4942A;text-decoration:none">${CONFIG.REPLY_TO}</a>
        <span style="color:rgba(255,255,255,.35)"> | </span>
        <a href="${CONFIG.WA_LINK}" rel="noopener noreferrer" style="color:rgba(255,255,255,.55);text-decoration:none">WhatsApp ${CONFIG.WA_NUMBER}</a>
        <span style="color:rgba(255,255,255,.35)"> | </span>
        <a href="https://horizonteemirates.com" rel="noopener noreferrer" style="color:rgba(255,255,255,.55);text-decoration:none">horizonteemirates.com</a>
      </p>
      <p style="margin:0 0 8px;font-size:10px;color:rgba(255,255,255,.28);line-height:1.6">
        Horizonte Emirates es un servicio de Propulse SLU (Andorra). No prestamos asesoramiento fiscal, jurídico ni financiero. La información facilitada es estrictamente orientativa y no constituye oferta de inversión ni recomendación financiera. La inversión inmobiliaria conlleva riesgos. Consulte a un asesor independiente antes de tomar cualquier decisión.
      </p>
      <p style="margin:0;font-size:11px">
        <a href="${unsubscribeUrl}" rel="noopener noreferrer" style="color:rgba(196,148,42,.7);text-decoration:none">Responder «BAJA» para no recibir más correos</a>
      </p>
    </td></tr>

  </table>

</td></tr>
<tr><td style="height:32px">&nbsp;</td></tr>
</table>
</body>
</html>`;
}


// ══════════════════════════════════════════════════════════════
// 7. TEMPLATES DE EMAIL (20 emails · Tiers A, B, C)
// ══════════════════════════════════════════════════════════════
function getTemplate(code, lead) {
  const n    = lead.nombre  || 'Inversor';
  const g    = detectGender(n);
  const sal  = g === 'F' ? 'Estimada' : 'Estimado';
  const listoOLista = g === 'F' ? 'lista' : 'listo';
  const cap  = CAPITAL_LABELS[lead.capital]   || lead.capital  || 'su capital disponible';
  const obj  = OBJETIVO_LABELS[lead.objetivo] || lead.objetivo || 'su objetivo de inversión';
  const pais = lead.pais || 'España';
  const wa   = CONFIG.WA_NUMBER;
  const waL  = CONFIG.WA_LINK;
  const cal  = CONFIG.CALENDLY_URL;
  const calL = buildCalendlyUrl(cal, lead, code);

  // ── CTAs de email (tabla-based para máxima compatibilidad con clientes de email) ──
  //
  // WA  = botón primario sólido verde  (acción inmediata)
  // CAL = botón secundario contorno dorado (acción alternativa)
  //
  // Diseño: botones separados con jerarquía visual clara.
  // Usar siempre ${waBtn}${calBtn} cuando existan ambas opciones.

  const waBtn = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:24px 0 10px">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td style="background:#1DAA61;border-radius:50px">
            <a href="${waL}" rel="noopener noreferrer"
               style="display:inline-block;padding:14px 38px;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;
                      font-size:14px;font-weight:600;letter-spacing:.02em;text-decoration:none;line-height:1;
                      border-radius:50px">
              Escribir por WhatsApp
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  const calBtn = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 4px">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td style="border:1px solid #C4942A;border-radius:50px">
            <a href="${calL}" rel="noopener noreferrer"
               style="display:inline-block;padding:13px 38px;color:#C4942A;font-family:'Helvetica Neue',Arial,sans-serif;
                      font-size:14px;font-weight:600;letter-spacing:.02em;text-decoration:none;line-height:1;
                      border-radius:50px;background:#ffffff">
              Reservar llamada · 20 min
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  const firma  = `<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #E0DBD1;font-size:14px;color:#646464;line-height:1.6">Un saludo,<br><strong style="color:#1A1A1A">Equipo Horizonte Emirates</strong></p>`;

  // ── TIER A — 5 emails ────────────────────────────────────────

  if (code === 'A1') return {
    subject: `Su análisis de inversión en Dubai ya está en marcha, ${n}`,
    html: `<p>${sal} ${n},</p>
<p>Hemos recibido su consulta y nuestro equipo ya está preparando su análisis personalizado.</p>
<p>Con un presupuesto de <strong>${cap}</strong> y el objetivo de <strong>${obj}</strong>, tenemos activos verificados en cartera que se ajustan a lo que busca.</p>
<p style="margin:20px 0 8px"><strong>Antes de 24 horas recibirá:</strong></p>
<ul style="margin:0;padding-left:20px;color:#3a3a3a;line-height:1.8">
  <li>Mínimo 3 propiedades seleccionadas para su capital y objetivo</li>
  <li>Rentabilidades netas verificadas por zona (Dubai, RAK, Abu Dhabi)</li>
  <li>Condiciones de entrada y calendario de pagos para cada activo</li>
</ul>
<p style="margin-top:20px">Si prefiere hablar directamente, puede contactarnos ahora:</p>
${waBtn}${calBtn}${firma}`,
    text: `${sal} ${n},\n\nYa estamos trabajando su análisis para ${cap} · ${obj}.\nEn menos de 24h recibirá 3 opciones concretas con rentabilidad estimada y condiciones de entrada.\n\nWhatsApp: ${wa} | ${CONFIG.REPLY_TO}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'A2') return {
    subject: `${n}, 3 activos seleccionados para su perfil inversor`,
    html: `<p>${sal} ${n},</p>
<p>Su análisis ya está listo. Para un perfil como el suyo — <strong>${cap}</strong>, objetivo: <strong>${obj}</strong> — estas son las tres opciones mejor posicionadas ahora:</p>
<table width="100%" cellpadding="12" cellspacing="0" border="0" style="margin:20px 0;border-collapse:collapse;font-size:14px">
  <tr style="background:#F8F6F1">
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#0D1B2A;width:38%">Dubai Marina / Business Bay</td>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Off-plan desde 280.000€. Rentabilidad estimada <strong>7–8% neto</strong>. Promotoras RERA verificadas.</td>
  </tr>
  <tr>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#0D1B2A">Ras Al Khaimah</td>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Ventana pre-apertura Wynn (2027). Proyección <strong>+20–30% plusvalía</strong>. Tickets desde 200.000€.</td>
  </tr>
  <tr style="background:#F8F6F1">
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#0D1B2A">Abu Dhabi · Aldar</td>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Respaldo soberano. Rentabilidad <strong>5–7% neto</strong>. Mayor estabilidad y liquidez.</td>
  </tr>
</table>
<p>Para ver las propiedades concretas necesito 20 minutos de llamada. ¿Le va bien hoy o mañana?</p>
${calBtn}${waBtn}${firma}`,
    text: `${sal} ${n},\n\nHemos preseleccionado 3 activos para ${cap} · ${obj}, priorizando equilibrio entre rentabilidad, entrada y riesgo:\n- Dubai Marina/Business Bay: 7-8% neto\n- RAK pre-Wynn: +20-30% plusvalía desde 200k€\n- Abu Dhabi Aldar: 5-7% neto, estable\n\n¿20 min? ${calL} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'A3') return {
    subject: `Un dato clave para su perfil inversor, ${n}`,
    html: `<p>${sal} ${n},</p>
<p>Le escribo porque hay algo que quiero compartirle antes de que pase más tiempo.</p>
<p>Los activos off-plan que mejor encajan con un perfil como el suyo (<strong>${cap}</strong>, <strong>${obj}</strong>) tienen ventanas de entrada limitadas. No es un recurso de ventas: es la mecánica real del mercado. Cuando se llena el aforo de una fase, el precio sube o la oportunidad desaparece.</p>
<p>No le pido que decida ahora. Le pido 20 minutos para que tenga toda la información y pueda decidir con criterio, sin presión.</p>
${calBtn}${waBtn}${firma}`,
    text: `${sal} ${n},\n\nLos activos para ${cap} · ${obj} tienen ventanas de entrada limitadas.\nNo le pido decidir ahora. Solo 20 minutos para revisar datos y decidir con criterio, sin presión.\n\n${calL} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'A4') return {
    subject: `Antes de decidir, ¿ha valorado visitar Dubai, ${n}?`,
    html: `<p>${sal} ${n},</p>
<p>La visita presencial acelera decisiones porque reduce incertidumbre: activo, zona y promotor en primera persona.</p>
<p>La diferencia no es el dinero. Es que ver el activo en persona, hablar con el promotor y entender el entorno elimina las dudas que ningún PDF puede resolver.</p>
<p>Por eso organizamos ese viaje: agenda de visitas, reuniones con promotoras RERA y acompañamiento de nuestro equipo local. <strong>Sin coste para el inversor</strong> — solo vuelo y alojamiento de su parte.</p>
<p>¿Le interesa saber cómo funciona?</p>
${waBtn}${calBtn}${firma}`,
    text: `${sal} ${n},\n\nLa visita presencial acelera decisiones porque reduce incertidumbre: activo, zona y promotor en primera persona.\n\nOrganizamos el viaje (agenda, promotoras y equipo local) sin coste de asesoramiento.\nSolo vuelo y alojamiento por su parte.\n\nWhatsApp ${wa} / ${calL}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'A5') return {
    subject: `${n}, ¿mantiene Dubai como prioridad de inversión?`,
    html: `<p>${sal} ${n},</p>
<p>Le he escrito en varias ocasiones sin recibir respuesta. No me molesta — entiendo que el momento y la prioridad cambian.</p>
<p>Antes de hacer una pausa, quiero preguntarle directamente: <strong>¿sigue siendo Dubai una prioridad para usted en este momento?</strong></p>
<p>No hay ningún compromiso. Si el momento no es el adecuado, lo entiendo perfectamente y cierro el seguimiento. Solo necesito saberlo.</p>
<p>Si sigue interesado, una respuesta a este email o un mensaje por WhatsApp es suficiente. En 24 horas lo tengo todo preparado.</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\n¿Sigue siendo Dubai una prioridad?\n\nSi sigue interesado, responda este email o WhatsApp ${wa}. En 24h lo tengo preparado.\nSi ahora no es el momento, lo dejamos aquí sin problema.\n\nEquipo Horizonte Emirates`,
  };

  // ── TIER B — 7 emails ────────────────────────────────────────

  if (code === 'B1') return {
    subject: `Recibida su consulta, ${n} — análisis en preparación`,
    html: `<p>${sal} ${n},</p>
<p>Gracias por contactar con Horizonte Emirates.</p>
<p>Hemos recibido su consulta y ya estamos preparando un análisis adaptado a su perfil: <strong>${cap}</strong>, objetivo: <strong>${obj}</strong>.</p>
<p style="margin:20px 0 8px"><strong>En menos de 24 horas recibirá:</strong></p>
<ul style="margin:0;padding-left:20px;color:#3a3a3a;line-height:1.8">
  <li>Activos seleccionados para su capital y objetivo</li>
  <li>Comparativa de zonas y rentabilidades verificadas</li>
  <li>Próximos pasos si le interesa profundizar</li>
</ul>
<p style="margin-top:20px">Cualquier pregunta, estamos disponibles en español.</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nConsulta recibida para ${cap} · ${obj}.\nEn 24h: activos seleccionados, comparativa de zonas, próximos pasos.\n\nWhatsApp: ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B2') return {
    subject: `${n}, ¿agendamos 20 minutos esta semana?`,
    html: `<p>${sal} ${n},</p>
<p>Tenemos los activos preparados para su perfil (<strong>${cap} · ${obj}</strong>) y me gustaría presentárselos personalmente.</p>
<p>Son 20 minutos donde le explico las opciones concretas, las rentabilidades reales y el proceso completo. Sin compromiso. Sin presión. Solo información que le permita decidir con criterio.</p>
<p>¿Cuándo le va bien esta semana?</p>
${calBtn}${waBtn}${firma}`,
    text: `${sal} ${n},\n\nActivos listos para ${cap} · ${obj}. ¿20 minutos esta semana?\n\n${calL} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B3') return {
    subject: `Lo esencial antes de invertir en Dubai desde ${pais}`,
    html: `<p>${sal} ${n},</p>
<p>Uno de los mayores frenos que tienen los inversores de ${pais} es la falta de información práctica sobre el proceso real. Hoy quiero resolverlo en cuatro puntos:</p>
<p style="margin:20px 0 4px"><strong>1. Fiscalidad en UAE</strong></p>
<p style="margin:0 0 14px;color:#3a3a3a">Cero IRPF. Cero tributación sobre plusvalías. Cero sobre rentas de alquiler. El rendimiento es íntegramente suyo.</p>
<p style="margin:0 0 4px"><strong>2. Sus obligaciones en ${pais}</strong></p>
<p style="margin:0 0 14px;color:#3a3a3a">Como residente fiscal, deberá declarar el activo en el Modelo 720 (a partir de 50.000€) y tributar rentas en IRPF. <em>Nosotros no prestamos asesoramiento fiscal — recomendamos asesor especializado en fiscalidad internacional.</em></p>
<p style="margin:0 0 4px"><strong>3. El proceso de compra</strong></p>
<p style="margin:0 0 14px;color:#3a3a3a">RERA regula todas las transacciones: proceso seguro y trazable. Firmará un SPA y abonará un primer tramo del 10–20%.</p>
<p style="margin:0 0 4px"><strong>4. Capital mínimo real</strong></p>
<p style="margin:0 0 14px;color:#3a3a3a">En off-plan, la entrada es del 10–20% del valor. Con 30.000€ puede acceder a activos desde 150.000€.</p>
<p>¿Alguna duda? Le respondo directamente.</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nClaves Dubai desde ${pais}:\n1. UAE: sin IRPF, sin tributación sobre plusvalías\n2. ${pais}: Modelo 720 + rentas IRPF\n3. RERA: proceso seguro y trazable. SPA + 10-20% de entrada\n4. Off-plan: acceso desde 30.000€\n\nHorizonte Emirates no presta asesoramiento fiscal.\nConsulte siempre con un asesor especializado en fiscalidad internacional.\n\nDudas: WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B4') return {
    subject: `Lo que cambia cuando ves Dubai en persona, ${n}`,
    html: `<p>${sal} ${n},</p>
<p>Muchos inversores aceleran su decisión tras visitar Dubai en persona.</p>
<p>Ver el activo en persona, entender el entorno y hablar directamente con el promotor elimina las dudas que ningún PDF puede resolver. Es la diferencia entre analizar una oportunidad y comprenderla de verdad.</p>
<p>Por eso organizamos ese viaje para nuestros inversores: agenda de visitas, reuniones con promotoras verificadas y acompañamiento de nuestro equipo local en Dubai. <strong>Sin coste para el inversor</strong> — solo vuelo y alojamiento.</p>
${waBtn}${calBtn}${firma}`,
    text: `${sal} ${n},\n\nMuchos inversores aceleran su decisión tras visitar Dubai en persona.\n\nVer el activo, el entorno y al promotor de primera mano reduce dudas que no se resuelven bien a distancia.\n\nOrganizamos el viaje: agenda, promotoras verificadas y equipo local.\n\nWhatsApp ${wa} / ${calL}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B5') return {
    subject: `${n}, activos disponibles esta semana para su perfil`,
    html: `<p>${sal} ${n},</p>
<p>Actualización de mercado relevante para su perfil (<strong>${cap} · ${obj}</strong>):</p>
<table width="100%" cellpadding="12" cellspacing="0" border="0" style="margin:16px 0;border-collapse:collapse;font-size:14px">
  <tr style="background:#F8F6F1">
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#0D1B2A;width:38%">Dubai Marina / JVC</td>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Entrada desde 15%. Entrega 2026–2027. Rentabilidad estimada <strong>7–8% neto</strong>.</td>
  </tr>
  <tr>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#0D1B2A">RAK pre-apertura Wynn</td>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Mejor precio de entrada antes del evento 2027. Ticket desde 200.000€.</td>
  </tr>
  <tr style="background:#F8F6F1">
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#0D1B2A">Abu Dhabi consolidado</td>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Rentabilidad inmediata. <strong>5–7% neto</strong>. Baja volatilidad.</td>
  </tr>
</table>
<p>¿20 minutos para presentarle los números reales de cada opción?</p>
${calBtn}${waBtn}${firma}`,
    text: `${sal} ${n},\n\nDisponible esta semana para ${cap} · ${obj}:\n- Dubai Marina/JVC: 7-8% neto\n- RAK pre-Wynn: máxima apreciación\n- Abu Dhabi: 5-7% neto, estable\n\n20 min para los números reales. ${cal} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B6') return {
    subject: `${n}, ¿sigue valorando invertir en Dubai?`,
    html: `<p>${sal} ${n},</p>
<p>Han pasado casi tres semanas desde su consulta y no hemos podido hablar todavía.</p>
<p>Le propongo algo sin compromiso: una llamada de 15 minutos donde le cuento exactamente cómo funciona el proceso para alguien con su perfil. Sin presentaciones largas, sin presión. Solo información concreta que le ayude a decidir si Dubai tiene sentido para usted ahora.</p>
${calBtn}${waBtn}${firma}`,
    text: `${sal} ${n},\n\nTres semanas sin poder hablar. 15 minutos sin compromiso para su perfil.\n\n${calL} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B7') return {
    subject: `${n}, un último mensaje antes de hacer una pausa`,
    html: `<p>${sal} ${n},</p>
<p>Voy a pausar el seguimiento activo, pero quiero dejarle algo antes de hacerlo.</p>
<p>Si en algún momento —en tres meses, en seis, en un año— decide explorar en serio la inversión en Dubai, encontrará nuestro contacto en este email. El mercado de Dubai no va a desaparecer. Cuando esté listo para hablar, seguiremos aquí.</p>
<p>Gracias por su tiempo, ${n}.</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nPausamos seguimiento activo. Cuando quiera retomarlo, estaremos encantados de ayudarle.\n\n${CONFIG.REPLY_TO} / WhatsApp ${wa}\n\nGracias.\nEquipo Horizonte Emirates`,
  };

  // ── TIER C — 8 emails ────────────────────────────────────────

  if (code === 'C1') return {
    subject: `Gracias por su consulta sobre inversión en Dubai, ${n}`,
    html: `<p>${sal} ${n},</p>
<p>Gracias por contactar con Horizonte Emirates.</p>
<p>Entendemos que en esta etapa lo más valioso es información clara y honesta — no una propuesta comercial precipitada.</p>
<p>En los próximos días le enviaremos contenido que le ayudará a:</p>
<ul style="margin:12px 0;padding-left:20px;color:#3a3a3a;line-height:1.8">
  <li>Entender cómo funciona el mercado inmobiliario en UAE</li>
  <li>Conocer las implicaciones fiscales para residentes en ${pais}</li>
  <li>Comparar la rentabilidad real de Dubai frente a mercados europeos</li>
</ul>
<p>Sin prisa. Cuando esté ${listoOLista} para dar un paso más, aquí estaremos.</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nConsulta recibida. Le enviaremos contenido claro sobre mercado UAE, fiscalidad para ${pais} y comparativas de rentabilidad.\n\nSin prisa. Cuando esté ${listoOLista}, aquí estaremos.\n\nWhatsApp: ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C2') return {
    subject: `${n}, comparativa España vs Dubai`,
    html: `<p>${sal} ${n},</p>
<table width="100%" cellpadding="14" cellspacing="0" border="0" style="margin:0 0 20px;border-collapse:collapse;font-size:14px">
  <tr>
    <th style="border:1px solid #E0DBD1;background:#F8F6F1;text-align:left;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#646464;font-weight:600;padding:10px 14px">Concepto</th>
    <th style="border:1px solid #E0DBD1;background:#F8F6F1;text-align:left;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#646464;font-weight:600;padding:10px 14px">España</th>
    <th style="border:1px solid #E0DBD1;background:#0D1B2A;text-align:left;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#C4942A;font-weight:600;padding:10px 14px">Dubai</th>
  </tr>
  <tr>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Rentabilidad neta alquiler</td>
    <td style="border:1px solid #E0DBD1;color:#888">2,5 – 4%</td>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#1A1A1A">6 – 9%</td>
  </tr>
  <tr style="background:#F8F6F1">
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Impuesto sobre rentas</td>
    <td style="border:1px solid #E0DBD1;color:#888">Hasta 45% (IRPF)</td>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#1A1A1A">0%</td>
  </tr>
  <tr>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Impuesto sobre plusvalías</td>
    <td style="border:1px solid #E0DBD1;color:#888">19 – 28%</td>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#1A1A1A">0%</td>
  </tr>
  <tr style="background:#F8F6F1">
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Riesgo de ocupación</td>
    <td style="border:1px solid #E0DBD1;color:#888">Alto / lento desahucio</td>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#1A1A1A">Nulo bajo RERA</td>
  </tr>
</table>
<p>No estoy diciendo que Dubai sea para todo el mundo. Estoy diciendo que estos números merecen ser comparados con criterio.</p>
<p>¿Quiere la comparativa completa adaptada a su perfil? Responda a este email.</p>
${firma}`,
    text: `${sal} ${n},\n\nEspaña: 2,5-4% neto · hasta 45% IRPF · riesgo de ocupación alto\nDubai: 6-9% neto · 0% impuestos · RERA protege al propietario\n\n¿Comparativa para su perfil? Responda o WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C3') return {
    subject: `${n}, proceso de compra en Dubai (pasos)`,
    html: `<p>${sal} ${n},</p>
<p>Uno de los mayores frenos es no entender cómo funciona el proceso de compra desde ${pais}. Hoy se lo explico en cinco pasos concretos:</p>
<ol style="margin:16px 0;padding-left:20px;color:#3a3a3a;line-height:2">
  <li><strong>Selección de activos.</strong> Presentamos oportunidades verificadas adaptadas a su perfil — no catálogos genéricos.</li>
  <li><strong>Due diligence en RERA.</strong> Verificamos el promotor y la situación legal de cada proyecto antes de presentarlo.</li>
  <li><strong>Reserva + SPA.</strong> Depósito inicial (5.000–10.000 AED) y firma del Sales Purchase Agreement.</li>
  <li><strong>Pagos escalonados.</strong> En off-plan: típicamente 30/30/40 hasta entrega. Sin inmovilizar capital completo.</li>
  <li><strong>Obligaciones en ${pais}.</strong> Modelo 720 a partir de 50.000€ + tributar rentas en IRPF. <em>Consulte asesor fiscal internacional — nosotros no lo prestamos.</em></li>
</ol>
<p>¿Alguna duda sobre alguno de estos pasos?</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nProceso de compra en Dubai desde ${pais}:\n1. Selección verificada\n2. Due diligence RERA\n3. Depósito + SPA\n4. Pagos escalonados 30/30/40\n5. ${pais}: Modelo 720 + IRPF rentas\n\nPasos orientativos que pueden variar según proyecto y promotor.\n\nDudas: WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C4') return {
    subject: `Caso real: cómo invirtió un perfil español con 200.000€`,
    html: `<p>${sal} ${n},</p>
<p>Le comparto un caso real de un inversor de perfil similar al suyo:</p>
<p style="background:#F8F6F1;border-left:3px solid #C4942A;padding:16px 20px;margin:20px 0;font-size:15px;color:#2a3a4a;line-height:1.7">
  <strong>Perfil:</strong> Residente en España, 47 años. Capital: 200.000€. Objetivo: diversificación + renta pasiva.<br><br>
  <strong>Decisión:</strong> Dos activos off-plan en Dubai (Business Bay + RAK) con entrada combinada de 60.000€ (30%). El resto en cuotas hasta la entrega en 2026.<br><br>
  <strong>Proyección:</strong> 7,2% neto en alquiler · +18–22% plusvalía en RAK pre-Wynn.<br><br>
  <strong>Proceso:</strong> 6 semanas · 2 videoconferencias + visita presencial de 3 días · Todo en español, sin coste.
</p>
<p>¿Hay opciones similares para su perfil? Responda aquí o escríbame por WhatsApp.</p>
<p><em style="font-size:12px;color:#888">Datos orientativos. Las rentabilidades futuras no están garantizadas.</em></p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nCaso real: inversor español, 200k€, entrada 60k€ en dos off-plan.\nProyección: 7,2% neto alquiler + 18-22% plusvalía RAK.\n6 semanas, todo en español.\n\n¿Opciones similares? WhatsApp ${wa}\n(Datos orientativos, no garantizados)\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C5') return {
    subject: `${n}, nota sobre Ras Al Khaimah y el calendario del mercado`,
    html: `<p>${sal} ${n},</p>
<p>En 2027 abre en Ras Al Khaimah el <strong>primer resort-casino de la región MENA</strong>, desarrollado por Wynn Resorts. Los activos comprados hoy —antes del evento— tienen proyecciones de apreciación del <strong>20–35%</strong> antes de la apertura.</p>
<p>La ventana de entrada a precios actuales se está cerrando de forma progresiva e irreversible.</p>
<p>Para un perfil como el suyo (<strong>${cap}</strong>, <strong>${obj}</strong>), RAK puede ser la pieza de mayor potencial de apreciación en un portfolio UAE bien estructurado.</p>
<p>¿Le interesa ver las opciones de entrada que tenemos disponibles ahora?</p>
${waBtn}${calBtn}${firma}`,
    text: `${sal} ${n},\n\nRAK + Wynn 2027: escenarios orientativos de +20-35% antes de la apertura.\nLa ventana de entrada se va cerrando progresivamente.\n\nPara ${cap} · ${obj}: puede ser una pieza de alto potencial en UAE.\n\nWhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C6') return {
    subject: `${n}, 20 minutos para decidir con datos si Dubai encaja`,
    html: `<p>${sal} ${n},</p>
<p>Ha pasado un mes desde que nos dejó su consulta. Le propongo 20 minutos donde:</p>
<ul style="margin:12px 0;padding-left:20px;color:#3a3a3a;line-height:1.8">
  <li>Le presento opciones actuales para <strong>${cap} · ${obj}</strong></li>
  <li>Resuelvo sus dudas sobre proceso, fiscalidad o mercado</li>
  <li>Le digo con honestidad si Dubai tiene sentido para usted en este momento</li>
</ul>
<p>Si concluimos que no es el momento, se lo digo directamente. Sin presión ni seguimiento posterior si no lo desea.</p>
${calBtn}${waBtn}${firma}`,
    text: `${sal} ${n},\n\nUn mes desde su consulta. 20 minutos para ${cap} · ${obj} y decirle con honestidad si Dubai tiene sentido ahora.\n\nSin compromiso. ${calL} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C7') return {
    subject: `Actualización breve del mercado en Dubai (su perfil)`,
    html: `<p>${sal} ${n},</p>
<p>Actualización breve del mercado para su zona de interés:</p>
<ul style="margin:12px 0;padding-left:20px;color:#3a3a3a;line-height:1.8">
  <li>Zonas Prime (Marina, Downtown, Palm): <strong>+4–6%</strong> en lo que va de 2026</li>
  <li>RAK: sigue siendo la zona con mayor potencial de apreciación antes de 2027</li>
  <li>Off-plan: la opción más accesible para capital inicial de 150.000–300.000€</li>
</ul>
<p>Para su perfil (<strong>${cap} · ${obj}</strong>), tenemos activos disponibles que encajan con lo que nos indicó en su consulta.</p>
<p>¿Se los presento? Responda a este email o escríbame por WhatsApp.</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nActualización mercado Dubai: Prime +4-6%, RAK máximo potencial pre-2027, off-plan desde 150k.\n\nActivos disponibles para ${cap} · ${obj}. ¿Se los presento?\n\nWhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C8') return {
    subject: `${n}, ¿sigue en su radar invertir en Dubai?`,
    html: `<p>${sal} ${n},</p>
<p>Hace tres meses nos dejó su consulta. No sé si el momento fue el adecuado entonces, ni si lo es ahora.</p>
<p>Lo que sí sé es que el mercado ha seguido moviéndose:</p>
<ul style="margin:12px 0;padding-left:20px;color:#3a3a3a;line-height:1.8">
  <li>Off-plan en zonas emergentes: <strong>+8–12%</strong> en 90 días</li>
  <li>Ventana pre-Wynn en RAK: reduciéndose</li>
  <li>Demanda de alquiler en Dubai Prime: en máximos históricos</li>
</ul>
<p>Si Dubai sigue en su cabeza, aunque sea de fondo, responda a este email con una línea diciéndome si sigue en su radar. Sin presión, sin llamadas si no las quiere.</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nTres meses desde su consulta. Mercado: off-plan emergente +8-12%, RAK pre-Wynn se acorta, demanda de alquiler en máximos.\n\n¿Sigue Dubai en su radar? Solo una línea de respuesta.\n\nWhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  return null; // código no encontrado
}


// ══════════════════════════════════════════════════════════════
// 8. GESTIÓN DE BAJAS
// ══════════════════════════════════════════════════════════════
/** Columna «Estado» (1-based) en hoja Leads — debe coincidir con initSheets. */
function updateLeadEstadoInSheet(email, estado, logLine) {
  const sheet = getSheet('Leads');
  const data  = sheet.getDataRange().getValues();
  if (!email) return false;
  const needle = email.toLowerCase();
  for (let i = 1; i < data.length; i++) {
    if ((data[i][2] || '').toLowerCase() === needle) {
      sheet.getRange(i + 1, 16).setValue(estado);
      Logger.log(logLine + email);
      return true;
    }
  }
  return false;
}

function markUnsubscribed(email) {
  return updateLeadEstadoInSheet(email, 'baja', 'Baja registrada: ');
}
// Uso manual: markUnsubscribed('email@ejemplo.com')

function markClosed(email) {
  return updateLeadEstadoInSheet(email, 'cerrado', 'Lead cerrado/ganado: ');
}
// Uso manual cuando se cierra una operación: markClosed('email@ejemplo.com')


// ══════════════════════════════════════════════════════════════
// 9. SETUP INICIAL — ejecutar una sola vez
// ══════════════════════════════════════════════════════════════
function initSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  let sh = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['ID','Nombre','Email','Teléfono','País','Capital','Objetivo',
                  'Experiencia','Plazo','Viaje Dubai','Puntuación','Tier','Canal',
                  'Origen','Fecha creación','Estado','Notas']);
    sh.setFrozenRows(1);
    sh.getRange('1:1').setFontWeight('bold').setBackground('#0D1B2A').setFontColor('#ffffff');
    sh.setColumnWidth(1,90);sh.setColumnWidth(2,140);sh.setColumnWidth(3,200);
    sh.setColumnWidth(4,130);sh.setColumnWidth(5,90);sh.setColumnWidth(11,80);
    sh.setColumnWidth(12,50);sh.setColumnWidth(15,140);sh.setColumnWidth(16,80);
  }
  ensureLeadsTelefonoColumnTextFormat(sh);

  let qsh = ss.getSheetByName('Cola') || ss.insertSheet('Cola');
  if (qsh.getLastRow() === 0) {
    qsh.appendRow(['Lead ID','Email código','Fecha programada','Estado','Fecha envío','Error']);
    qsh.setFrozenRows(1);
    qsh.getRange('1:1').setFontWeight('bold').setBackground('#0D1B2A').setFontColor('#ffffff');
  }

  Logger.log('✓ Hojas inicializadas: Leads + Cola');
}

function createTriggers() {
  const timeTriggerHandlers = ['pollGmail', 'pollUnsubscribes', 'processQueue', 'notifyCalendlyBookings'];
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (timeTriggerHandlers.indexOf(fn) !== -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('pollGmail').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('pollUnsubscribes').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('notifyCalendlyBookings').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('processQueue').timeBased().everyHours(1).create();
  Logger.log('✓ Triggers activos: pollGmail + pollUnsubscribes + notifyCalendlyBookings cada 10 min · processQueue cada hora');
}

function getLeadByEmail(email) {
  const lSheet = getSheet('Leads');
  const lData = lSheet.getDataRange().getValues();
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;

  for (let i = 1; i < lData.length; i++) {
    const r = lData[i];
    const rowEmail = String(r[2] || '').trim().toLowerCase();
    if (rowEmail !== normalized) continue;

    return {
      id: r[0], nombre: r[1], email: r[2], telefono: r[3],
      pais: r[4], capital: r[5], objetivo: r[6], experiencia: r[7],
      plazo: r[8], viaje: r[9], puntuacion: r[10], tier: r[11],
      canal: r[12], origen: r[13], createdAt: r[14], estado: r[15], notas: r[16],
    };
  }

  return null;
}

function simulateLeadEmail(leadEmail, emailCode, forceSend) {
  if (leadEmail == null || String(leadEmail).trim() === '') {
    Logger.log('simulateLeadEmail: falta leadEmail (ejecución sin parámetros). Use runSimulationA1() desde el desplegable, o simulateLeadEmail("email@existente-en-hoja-Leads", "A1", false).');
    return;
  }
  const code = emailCode || 'A1';
  const lead = getLeadByEmail(leadEmail);
  if (!lead) {
    Logger.log('Lead no encontrado en hoja Leads (columna Email): ' + leadEmail);
    return;
  }
  if (lead.estado === 'baja' || lead.estado === 'cerrado') {
    Logger.log('Lead con estado no enviable: ' + lead.estado + ' (' + lead.email + ')');
    return;
  }

  const shouldSend = Boolean(forceSend) && !CONFIG.TEST_MODE;
  if (shouldSend) {
    sendEmail(code, lead, { bypassBusinessHours: true });
    Logger.log('✓ Envío real: ' + code + ' → ' + lead.email);
    return;
  }

  const tpl = getTemplate(code, lead);
  if (!tpl) {
    Logger.log('Template no encontrado: ' + code);
    return;
  }
  Logger.log('[SIMULACION] ' + code + ' → ' + lead.email);
  Logger.log('Asunto: ' + tpl.subject);
  const plainOut = buildEmailPlainBody(tpl.text);
  Logger.log('Texto plano (inicio): ' + plainOut.substring(0, 280) + (plainOut.length > 280 ? '...' : ''));
  Logger.log('Para envío real: simulateLeadEmail("' + lead.email + '", "' + code + '", true) con TEST_MODE=false');
}


// ══════════════════════════════════════════════════════════════
// 10. FUNCIONES DE PRUEBA
// ══════════════════════════════════════════════════════════════
function testTemplates(tier) {
  const lead = {
    nombre:'Ana García', email:'test@example.com',
    capital:'300k-600k', objetivo:'alquiler',
    pais:'España', tier: tier || 'A',
  };
  const seq = SEQUENCES[tier || 'A'];
  seq.forEach(item => {
    const tpl = getTemplate(item.code, lead);
    Logger.log(`\n── ${item.code} ──\nAsunto: ${tpl ? tpl.subject : 'NO ENCONTRADO'}`);
  });
}

function testFullFlow() {
  const fakeBody = `nombre: Test Usuario\nemail: test@example.com\ntelefono: +34 600 123 456\npais: España\ncapital: 300k-600k\nobjetivo: alquiler\nplazo: ya\nvisita_dubai: si\ncanal: whatsapp\ntier: A\npuntuacion: 11\norigen: Formulario web V3`;
  const fakeSubject = '[A|11pts] Lead HE V3 · España';
  const lead = parseLeadFromEmail(fakeBody, fakeSubject);
  Logger.log('Lead parseado: ' + JSON.stringify(lead));
  if (lead) {
    const id = saveLead(lead);
    scheduleSequence(id, lead.tier, new Date());
    Logger.log('✓ Lead guardado: ' + id + ' | Secuencia ' + lead.tier);
  }
}

function previewEmail(code) {
  const lead = {
    nombre:'Ana García', email:'ana@ejemplo.com',
    capital:'300k-600k', objetivo:'alquiler',
    pais:'España', tier:'B', puntuacion:8,
    plazo:'6meses', viaje:'quizas',
  };
  const tpl = getTemplate(code || 'A2', lead);
  if (!tpl) { Logger.log('Template no encontrado'); return; }
  const html = wrapHtml(tpl.html, tpl.subject);
  Logger.log('Asunto: ' + tpl.subject + '\n\nHTML length: ' + html.length + ' chars');
  // Para ver el HTML: copiar en un archivo .html y abrir en navegador
}

function auditTemplateCopy() {
  const lead = {
    nombre:'Ana García', email:'ana@ejemplo.com',
    capital:'300k-600k', objetivo:'alquiler',
    pais:'España', tier:'A', puntuacion:10,
    plazo:'6meses', viaje:'si',
  };

  const codes = Object.keys(SEQUENCES)
    .flatMap(tier => SEQUENCES[tier].map(item => item.code));

  const checks = [
    { key: 'LE_LOS', regex: /\ble los\b/i, msg: 'Posible errata: usar "se los"' },
    { key: 'DOBLE_ESPACIO', regex: /[^\n]\s{2,}[^\n]/, msg: 'Posible doble espacio' },
    { key: 'DOBLE_SIGNO_INTERROGACION_CIERRE', regex: /\?\?/g, msg: 'Doble signo de interrogación de cierre' },
    { key: 'DOBLE_SIGNO_EXCLAMACION_CIERRE', regex: /!!/g, msg: 'Doble signo de exclamación de cierre' },
    { key: 'PLACEHOLDER_SIN_RESOLVER', regex: /\$\{[^}]+\}/, msg: 'Placeholder sin resolver en output' },
  ];

  let issues = 0;
  Logger.log('=== AUDITORIA COPY TEMPLATES ===');

  codes.forEach(code => {
    const tpl = getTemplate(code, lead);
    if (!tpl) {
      issues++;
      Logger.log('[' + code + '] ERROR: template no encontrado');
      return;
    }

    const subject = String(tpl.subject || '');
    const text = String(tpl.text || '');
    const html = String(tpl.html || '');

    if (!subject.trim()) { issues++; Logger.log('[' + code + '] Asunto vacío'); }
    if (!text.trim())    { issues++; Logger.log('[' + code + '] Texto plano vacío'); }
    if (!html.trim())    { issues++; Logger.log('[' + code + '] HTML vacío'); }

    checks.forEach(check => {
      if (check.regex.test(subject)) {
        issues++;
        Logger.log('[' + code + '][subject] ' + check.msg);
      }
      if (check.regex.test(text)) {
        issues++;
        Logger.log('[' + code + '][text] ' + check.msg);
      }
      if (check.regex.test(html)) {
        issues++;
        Logger.log('[' + code + '][html] ' + check.msg);
      }
    });
  });

  Logger.log('=== FIN AUDITORIA: ' + codes.length + ' templates revisados · incidencias: ' + issues + ' ===');
}

// Helpers de ejecución manual en Apps Script (desplegable sin parámetros)
function runSimulationA1() {
  simulateLeadEmail('civcomercial2010@gmail.com', 'A1', false);
}

function runRealSendA1() {
  simulateLeadEmail('civcomercial2010@gmail.com', 'A1', true);
}

// HE_EMAILS_GS_EOF — Si no ves esta línea al final de Código.gs, el pegado está truncado (provoca «Unexpected end of input»).
