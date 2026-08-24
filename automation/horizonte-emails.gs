// ═══════════════════════════════════════════════════════════════
// HORIZONTE EMIRATES: Email Automation Engine
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
  // M03: ID del CRM y email del agente fuera del repo público.
  // Apps Script → ⚙ Configuración del proyecto → Propiedades de la secuencia de comandos:
  //   HE_SPREADSHEET_ID = <ID del Google Sheet de leads>
  //   HE_AGENT_EMAIL    = <email donde recibir los briefings de leads>
  SPREADSHEET_ID:  PropertiesService.getScriptProperties().getProperty('HE_SPREADSHEET_ID'),
  ASESOR_NOMBRE:   'Horizonte Emirates',
  REPLY_TO:        'hola@horizonteemirates.com',
  AGENT_BRIEFING_EMAIL: PropertiesService.getScriptProperties().getProperty('HE_AGENT_EMAIL') || 'hola@horizonteemirates.com',
  WA_NUMBER:       '+971 55 472 2025',
  WA_LINK:         'https://wa.me/971554722025',
  CALENDLY_URL:    'https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-30-minutos',
  // M19: Lead magnet: guía fiscal entregada en el email de bienvenida (A1/B1/C1).
  GUIDE_URL:       'https://www.horizonteemirates.com/guias/guia-fiscal-dubai-espana.html',
  CALENDAR_ID:     'primary', // calendario donde Calendly crea las reuniones
  CALENDLY_EVENT_KEYWORD: 'Llamada estratégica Horizonte Emirates',
  UNSUBSCRIBE_URL: 'mailto:hola@horizonteemirates.com?subject=BAJA%20COMUNICACIONES',
  LABEL_PROCESADO: 'HE-procesado',
  LABEL_BAJAS:     'HE-bajas-procesado',
  // Busca todos los emails de Web3Forms no leídos (compatible V1, V2, V3)
  // Cualquier remitente @web3forms.com (evita perder avisos si cambian la cuenta de envío)
  // Excluye los ya etiquetados: con KEEP_LEAD_MAIL_UNREAD los avisos procesados siguen «no leídos»
  // a propósito, y sin este filtro volverían a ocupar el lote de 50 hilos en cada pasada.
  POLL_QUERY:          'from:web3forms.com is:unread -label:HE-procesado',
  // Reintento: últimos días sin etiqueta de procesado (útil si el correo se marcó leído antes del trigger)
  POLL_QUERY_FALLBACK: 'from:web3forms.com newer_than:3d -label:HE-procesado',
  // Respuestas de leads que pueden contener solicitud de baja
  UNSUBSCRIBE_QUERY: 'to:hola@horizonteemirates.com is:unread -from:web3forms.com',
  UNSUBSCRIBE_KEYWORDS: [
    'baja', 'darme de baja', 'darse de baja', 'no me escribas', 'no me escriban',
    'no más correos', 'no mas correos', 'cancelar suscripción', 'cancelar suscripcion',
    'stop', 'unsubscribe',
  ],
  // Palabras clave para confirmar que el email es de Horizonte Emirates. Además, isHorizonteWeb3Lead
  // detecta el marcador de scoring del asunto «[A|11pts]» y «Lead HE» (con o sin versión Vn), que son
  // los identificadores estables del embudo aunque cambie el texto del asunto del formulario.
  POLL_KEYWORDS:   ['Horizonte Emirates', 'HE V6', 'HE V5', 'HE V3', 'HE V2'],
  TEST_MODE:       false, // true → simula sin enviar emails reales
  /**
   * INTERRUPTOR MAESTRO del envío automático al lead (2026-07-30).
   * false = ningún correo sale solo. El lead se registra en el CRM, se avisa al asesor
   *         y los correos se escriben a mano con automation/MAILS-MANUALES.md.
   *         Motivo: volumen bajo de leads, atención 1:1 y máxima personalización.
   * true  = vuelve la secuencia automática por tier (SEQUENCES). Antes de activarlo,
   *         leer reanudarEnvioAutomatico(): la cola acumula ítems «pausado-manual».
   */
  AUTO_SEND_LEADS: false,
  /**
   * ÚNICA EXCEPCIÓN al interruptor anterior: el acuse de recibo inmediato (código W0).
   * Sale en segundos tras el formulario, incluso de noche y en fin de semana, porque un lead que
   * rellena un formulario y no recibe nada da por hecho que se ha perdido. No vende: confirma,
   * entrega la guía fiscal prometida y anuncia el correo personal del asesor.
   * false → tampoco sale este y el lead no recibe absolutamente nada hasta que se le escriba.
   */
  AUTO_SEND_WELCOME: true,
  /** Persona que firma los correos (el acuse de recibo va en su nombre). */
  ASESOR_FIRMA: 'Jesús Ibáñez',
  /**
   * Plazo que promete el acuse de recibo para el correo personal del asesor.
   * 24 horas es lo que ya promete la web ("respuesta en menos de 24 horas"), así que el lead
   * lee lo mismo en los dos sitios. Se promete holgado y se cumple antes: el ritmo real de
   * trabajo (menos de 1 hora en tier A) está en automation/MAILS-MANUALES.md.
   * Si algún día se quiere prometer más rápido, se cambia solo esta línea.
   */
  WELCOME_PROMISE: 'en las próximas 24 horas',
  /** Con envío manual: avisar al asesor de cada lead nuevo con su ficha y el guion sugerido. */
  NOTIFY_AGENT_ON_NEW_LEAD: true,
  /** No marcar como leído el aviso de Web3Forms de un lead válido (para que se vea en negrita). */
  KEEP_LEAD_MAIL_UNREAD: true,
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
  /** M08: pon true cuando haya campañas/tráfico activo: habilita la alerta de "sin leads en N horas". */
  EXPECT_TRAFFIC: false,
  /** M08: horas sin nuevos leads que disparan alerta (solo si EXPECT_TRAFFIC=true). */
  NO_LEAD_ALERT_HOURS: 72,
};

// Etiquetas legibles para variables del email
const CAPITAL_LABELS = {
  'menos150k': 'menos de 150.000 €',
  '150k-300k': '150.000 a 300.000 €',
  '300k-600k': '300.000 a 600.000 €',
  '600k-1M':   '600.000 a 1.000.000 €',
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
  // España: nombres clásicos y frecuentes
  'maria','ana','carmen','isabel','pilar','teresa','dolores','rosa','josefa',
  'francisca','manuela','concepcion','encarnacion','remedios','inmaculada',
  'asuncion','amparo','purificacion','trinidad','angeles','milagros','gloria',
  'esperanza','mercedes','victoria','consuelo','aurora','lourdes','montserrat',
  'fatima','blanca','paloma','paz','luz','mar','sol','fe','maite','itziar',
  // España: frecuentes modernas
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
  // LATAM: frecuentes
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

/**
 * Nombre de pila con la inicial en mayúscula, para el saludo.
 * El formulario recoge lo que el lead escribe («jose diaz mellado»), y saludar con el nombre
 * completo tal cual delata el envío automático. «Hola Jose» siempre suena a persona.
 */
function firstName(nombre) {
  const first = String(nombre || '').trim().split(/\s+/)[0] || 'Inversor';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

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
    'Consent privacidad: ' + (lead.cons_privacidad || 'sin registro'),
    'Consent marketing: ' + (lead.cons_marketing || 'sin registro'),
    'Consent fecha: ' + (lead.cons_fecha || ''),
  ].join('\n');
}

// ══════════════════════════════════════════════════════════════
// AVISO AL ASESOR DE LEAD NUEVO (modo envío manual)
// Con AUTO_SEND_LEADS=false este correo es el único disparador de acción:
// llega con la ficha del lead, el guion recomendado y accesos directos.
// ══════════════════════════════════════════════════════════════

/**
 * Fuerza «no leído» + destacado + importante en el aviso interno que acaba de enviarse.
 * Gmail marca como leído todo lo que envía la propia cuenta, así que un aviso a uno mismo
 * aterriza en Recibidos sin negrita y pasa desapercibido. Se localiza por un token único
 * del asunto (ID de lead, ID de evento) y se revierte el estado.
 * @param {string} token cadena única presente en el asunto del aviso.
 */
function forceUnreadBySubjectToken(token) {
  const t = String(token || '').trim();
  if (!t) return;
  try {
    Utilities.sleep(1500); // el hilo tarda un instante en indexarse en Gmail
    const threads = GmailApp.search('subject:"' + t + '" newer_than:1d', 0, 5);
    threads.forEach(th => {
      th.markUnread();
      th.markImportant();
      const msgs = th.getMessages();
      if (msgs.length) msgs[msgs.length - 1].star();
    });
    if (!threads.length) Logger.log('forceUnreadBySubjectToken: sin hilo para «' + t + '» (¿indexación lenta?)');
  } catch (e) {
    Logger.log('forceUnreadBySubjectToken: fallo con «' + t + '»: ' + e.message);
  }
}

/** Teléfono en formato wa.me (solo dígitos, sin «+» ni separadores). */
function phoneForWhatsApp(raw) {
  return String(raw || '').replace(/\D/g, '');
}

/** Guion recomendado según tier y plazo declarado. Devuelve {urgencia, accion, plantilla}. */
function playbookForLead(lead) {
  const tier  = String((lead && lead.tier) || 'C').toUpperCase();
  const plazo = String((lead && lead.plazo) || '').toLowerCase();
  const yaVa  = plazo === 'ya' || plazo === '6meses';

  if (tier === 'A') return {
    urgencia:  'Contactar en menos de 1 hora (horario laboral) o a primera hora del día siguiente.',
    accion:    'WhatsApp primero, y a continuación el correo M1-A. No esperar respuesta al correo para escribir por WhatsApp.',
    plantilla: 'M1-A (primer contacto, perfil caliente)',
  };
  if (tier === 'B') return {
    urgencia:  yaVa ? 'Contactar hoy mismo, antes de 4 horas.' : 'Contactar hoy mismo.',
    accion:    'Correo M1-B con los bloques de su objetivo y su plazo. WhatsApp solo si no responde en 24 h.',
    plantilla: 'M1-B (primer contacto, perfil a validar)',
  };
  return {
    urgencia:  'Contactar en menos de 24 horas.',
    accion:    'Correo M1-C, tono educativo y sin presión. La llamada se propone como opción, no como paso obligado.',
    plantilla: 'M1-C (primer contacto, perfil exploratorio)',
  };
}

/**
 * Avisa al asesor de un lead nuevo. El correo llega como NO LEÍDO y destacado:
 * Gmail marca leídos los mensajes que envía la propia cuenta, así que se fuerza markUnread()
 * buscando el hilo por el ID del lead (identificador único en el asunto).
 */
function notifyAgentNewLead(leadId, lead) {
  if (!CONFIG.NOTIFY_AGENT_ON_NEW_LEAD) return;
  if (!lead) return;

  const pb      = playbookForLead(lead);
  const cap     = CAPITAL_LABELS[lead.capital]   || lead.capital  || 'sin dato';
  const obj     = OBJETIVO_LABELS[lead.objetivo] || lead.objetivo || 'sin dato';
  const tier    = String(lead.tier || 'C').toUpperCase();
  const waDigits= phoneForWhatsApp(lead.telefono);
  const waText  = 'Hola ' + String(lead.nombre || '').split(/\s+/)[0] +
    ', soy Marc de Horizonte Emirates. Acabo de recibir su solicitud de análisis de inversión en Dubai. ' +
    '¿Le va bien que le llame hoy o prefiere que le proponga un par de horarios?';
  const waUrl   = waDigits ? 'https://wa.me/' + waDigits + '?text=' + encodeURIComponent(waText) : '';
  const mailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(lead.email || '');
  const sheetUrl= CONFIG.SPREADSHEET_ID ? 'https://docs.google.com/spreadsheets/d/' + CONFIG.SPREADSHEET_ID + '/edit' : '';

  const subject = '[LEAD ' + tier + '|' + (lead.puntuacion || 0) + 'pts] ' +
    (lead.nombre || 'Inversor') + ' · ' + (lead.pais || '') + ' · ' + cap + ' · ' + leadId;

  const row = (k, v) => '<tr><td style="padding:6px 12px 6px 0;color:#646464;font-size:13px;white-space:nowrap">' + k +
    '</td><td style="padding:6px 0;color:#1A1A1A;font-size:13px"><strong>' + (v || 'sin dato') + '</strong></td></tr>';

  const html = [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px">',
    '<p style="margin:0 0 4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#C4942A;font-weight:700">Lead nuevo · envío automático desactivado</p>',
    '<h2 style="margin:0 0 14px;font-size:20px;color:#0D1B2A">' + (lead.nombre || 'Inversor') + ' · Tier ' + tier + ' (' + (lead.puntuacion || 0) + ' pts)</h2>',
    '<p style="margin:0 0 16px;padding:12px 14px;background:#FDF6E7;border-left:3px solid #C4942A;font-size:14px;color:#1A1A1A;line-height:1.55">',
    '<strong>' + pb.urgencia + '</strong><br>' + pb.accion + '<br>Plantilla: <strong>' + pb.plantilla + '</strong> (automation/MAILS-MANUALES.md)',
    '</p>',
    CONFIG.AUTO_SEND_WELCOME !== false
      ? '<p style="margin:0 0 16px;padding:12px 14px;background:#EEF2F6;border-left:3px solid #3E5A75;font-size:13.5px;color:#1A1A1A;line-height:1.55">' +
        'El lead ya ha recibido el acuse de recibo automático con su ficha y la guía fiscal, y ahí se le dice que ' +
        '<strong>usted le escribe ' + (CONFIG.WELCOME_PROMISE || 'en las próximas 24 horas') + '</strong>. Ese es el plazo máximo que ha leído el lead, no el objetivo: el ritmo de trabajo lo marca el tier. Su correo no debe repetir el saludo.</p>'
      : '',
    '<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 18px">',
    row('Email', lead.email),
    row('Teléfono', lead.telefono),
    row('País', lead.pais),
    row('Capital', cap),
    row('Objetivo', obj),
    row('Plazo', lead.plazo),
    row('Visita Dubai', lead.viaje),
    row('Canal preferido', lead.canal),
    row('Origen', lead.origen),
    row('Consent. marketing', lead.cons_marketing || 'NO'),
    '</table>',
    waUrl ? '<p style="margin:0 0 10px"><a href="' + waUrl + '" style="display:inline-block;background:#1DAA61;color:#fff;text-decoration:none;padding:12px 26px;border-radius:50px;font-size:14px;font-weight:600">Abrir WhatsApp con mensaje listo</a></p>' : '',
    '<p style="margin:0 0 10px"><a href="' + mailUrl + '" style="display:inline-block;border:1px solid #C4942A;color:#C4942A;text-decoration:none;padding:11px 26px;border-radius:50px;font-size:14px;font-weight:600">Redactar correo al lead</a></p>',
    sheetUrl ? '<p style="margin:0 0 10px;font-size:13px"><a href="' + sheetUrl + '" style="color:#0D1B2A">Abrir el CRM en Sheets</a></p>' : '',
    '<p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #E0DBD1;font-size:12px;color:#8a8a8a;line-height:1.5">La secuencia automática está en pausa (CONFIG.AUTO_SEND_LEADS = false). Este lead no recibirá ningún correo hasta que usted lo escriba.</p>',
    '</div>',
  ].join('\n');

  const plain = [
    'LEAD NUEVO · envío automático desactivado',
    '',
    pb.urgencia,
    pb.accion,
    'Plantilla: ' + pb.plantilla,
    '',
    buildLeadBriefingText(lead),
    '',
    waUrl ? 'WhatsApp listo: ' + waUrl : '',
  ].join('\n');

  GmailApp.sendEmail(CONFIG.AGENT_BRIEFING_EMAIL, subject, plain, {
    name:     CONFIG.ASESOR_NOMBRE,
    replyTo:  CONFIG.REPLY_TO,
    htmlBody: html,
  });

  forceUnreadBySubjectToken(leadId); // el ID del lead va en el asunto y es único
  Logger.log('notifyAgentNewLead: aviso enviado para ' + leadId + ' (' + lead.email + ')');
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

function isLikelyCalendlyEvent(event, title, desc) {
  const keyword = String(CONFIG.CALENDLY_EVENT_KEYWORD || '').trim();
  const location = String(event.getLocation() || '');
  const blob = (String(title || '') + '\n' + String(desc || '') + '\n' + location).toLowerCase();
  if (keyword && (title.indexOf(keyword) >= 0 || desc.indexOf(keyword) >= 0)) return true;
  // Fallback robusto: si Calendly cambia naming del evento, seguir detectando por marcadores típicos.
  return /calendly|invitee|invitado|rescheduled|reprogramad/i.test(blob);
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
    const desc  = String(event.getDescription() || '');
    if (!isLikelyCalendlyEvent(event, title, desc)) return;

    const eventId = event.getId();
    if (notified[eventId]) return;

    const leadEmail = extractLeadEmailFromEvent(event);
    if (!leadEmail) return;

    const lead = getLeadByEmail(leadEmail);
    if (!lead) return;
    const start = event.getStartTime();
    const end = event.getEndTime();
    const meetingLink = extractMeetingLinkFromEvent(event);

    // Token único del evento en el asunto: permite forzar «no leído» sobre este aviso concreto.
    const evToken = 'EV' + String(eventId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const subject = '[HE] Nueva reunión agendada: ' + (lead && lead.nombre ? lead.nombre : leadEmail) + ' · ' + evToken;
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
    forceUnreadBySubjectToken(evToken);

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


// Secuencias por tier: delay en HORAS desde la creación del lead
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
// 1. POLL GMAIL: trigger cada 10 minutos
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
  // Marcador de scoring del embudo en el asunto: «[A|11pts]», «[B|7pts]», «[C|3pts]».
  // Es el identificador más estable del funnel: no depende de la versión (Vn) ni del país,
  // así que un retoque del asunto del formulario no vuelve a romper la captación (regresión c3fdeb6).
  if (/\[\s*[ABC]\s*\|\s*\d+\s*pts\s*\]/i.test(s)) return true;
  // «Lead HE» con o sin versión: cubre asuntos nuevos «Lead HE · País» y antiguos «Lead HE Vn».
  if (/\bLead\s+HE\b/i.test(s)) return true;
  return false;
}

function pollGmail() {
  PropertiesService.getScriptProperties().setProperty('HE_LAST_POLL_TS', String(Date.now())); // M08, heartbeat para healthCheck
  let threads = GmailApp.search(CONFIG.POLL_QUERY, 0, 50);
  if (CONFIG.POLL_QUERY_FALLBACK) {
    // M09: unir SIEMPRE el fallback (Web3Forms recientes sin etiqueta de procesado,
    // aunque estén marcados como leídos). Evita perder leads cuyo aviso se abrió/leyó
    // antes de que corriera el trigger (el guard de etiqueta dentro del bucle evita reprocesos).
    const seen = {};
    threads.forEach(t => { seen[t.getId()] = true; });
    GmailApp.search(CONFIG.POLL_QUERY_FALLBACK, 0, 50).forEach(t => {
      if (!seen[t.getId()]) { seen[t.getId()] = true; threads.push(t); }
    });
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
        // No es nuestro: marcar leído y saltar sin etiquetar
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
        if (CONFIG.AUTO_SEND_LEADS === false) {
          // El acuse de recibo va primero: es lo único que el lead espera de inmediato.
          // Si falla, el lead ya está guardado y el aviso al asesor sale igualmente.
          try {
            sendWelcomeEmail(leadId, lead);
          } catch (wErr) {
            Logger.log('pollGmail: fallo al enviar el acuse de recibo W0 a ' + lead.email + ': ' + wErr.toString());
          }
          notifyAgentNewLead(leadId, Object.assign({}, lead, { id: leadId }));
        } else {
          processQueue({ immediateWelcomeAfterPoll: true });
        }
      } catch (err) {
        Logger.log('pollGmail: ERROR al guardar en Sheets / cola: ' + err.toString());
        throw err;
      }

      thread.addLabel(label);
      if (CONFIG.KEEP_LEAD_MAIL_UNREAD) {
        // El aviso se queda en negrita y destacado en Recibidos: el lead no se pasa por alto.
        // El guard de etiqueta de arriba evita que se reprocese en las siguientes pasadas.
        msg.markUnread();
        msg.star();
        thread.markImportant();
      } else {
        msg.markRead();
      }
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
// 2. DETECTAR BAJAS POR RESPUESTA: trigger cada 10 min
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
    const key = m[1].trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Limpia iconos y signos para soportar etiquetas visuales (ej. "👤 Nombre").
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      // Soporta agrupación visual en etiquetas del form (ej. "Contacto · Nombre").
      .replace(/^(contacto|inversion)_+/, '');
    const val = m[2].trim();

    switch (key) {
      case 'nombre':                        lead.nombre      = val; break;
      case 'apellidos':                     lead.apellidos   = val; break;
      case 'email':
      case 'mail':
      case 'e-mail':
      case 'e_mail':
      case 'correo':
      case 'correo_electronico':
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
                                          lead.puntuacion  = parseInt(val) || lead.puntuacion; break;
      case 'origen':                        lead.origen      = val; break;
      case 'utm_source':                    lead.utm_source  = val; break;
      case 'utm_medium':                    lead.utm_medium  = val; break;
      case 'utm_campaign':                  lead.utm_campaign= val; break;
      case 'utm_content':                   lead.utm_content = val; break;
      case 'utm_term':                      lead.utm_term    = val; break;
      case 'gclid':                         lead.gclid       = val; break;
      case 'gbraid':                        lead.gbraid      = val; break;
      case 'wbraid':                        lead.wbraid      = val; break;
      // Prueba del consentimiento (art. 7.1 RGPD). Los envía app.js en cada formulario.
      case 'consentimiento_privacidad':     lead.cons_privacidad = val; break;
      case 'consentimiento_marketing':      lead.cons_marketing  = val; break;
      case 'consentimiento_version':        lead.cons_version    = val; break;
      case 'consentimiento_fecha':          lead.cons_fecha      = val; break;
      case 'consentimiento_texto':          lead.cons_texto      = val; break;
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
  lead.canal  = lead.canal  || 'whatsapp';
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
 */
function forzarPollGmail() {
  Logger.log('forzarPollGmail: ejecutando pollGmail ahora...');
  pollGmail();
  Logger.log('forzarPollGmail: completado. Revisar logs arriba.');
}

/**
 * RECUPERACIÓN: procesa TODOS los threads Web3Forms recientes, incluyendo los ya
 * etiquetados y los marcados como leídos. Guarda en Sheets cualquier lead que no exista aún
 * y dispara su email de bienvenida. Usar después de actualizar el script en Apps Script.
 * @param {number} [days=30]: ventana de búsqueda hacia atrás. Por defecto 30 días para cubrir
 *   la regresión c3fdeb6 (asunto sin «V6» → detección rota desde 2026-06-08). Ej.: recuperarLeadsPerdidos(45).
 */
function recuperarLeadsPerdidos(days) {
  const lookback = Math.max(1, parseInt(days, 10) || 30);
  const q = 'from:web3forms.com newer_than:' + lookback + 'd';
  let threads = GmailApp.search(q, 0, 100);
  if (!threads.length) {
    Logger.log('recuperarLeadsPerdidos: sin hilos Web3Forms en los últimos ' + lookback + ' días');
    return;
  }
  sortThreadsByLatestMessage(threads);

  const label = ensureGmailLabel(CONFIG.LABEL_PROCESADO);
  let guardados = 0, yaExistian = 0, saltados = 0;

  threads.forEach((thread, idx) => {
    const msg = getLatestThreadMessage(thread);
    if (!msg) return;

    const subject = msg.getSubject();
    const body    = getMessageBodyForLeadParse(msg);

    if (!isHorizonteWeb3Lead(subject, body)) { saltados++; return; }

    const lead = parseLeadFromEmail(body, subject);
    if (!lead || !lead.email) {
      Logger.log('recuperarLeadsPerdidos: no parseable hilo #' + idx + ' · ' + subject);
      saltados++;
      return;
    }

    if (leadExists(lead.email)) {
      Logger.log('recuperarLeadsPerdidos: ya existe → ' + lead.email);
      thread.addLabel(label);
      msg.markRead();
      yaExistian++;
      return;
    }

    try {
      const leadId = saveLead(lead);
      scheduleSequence(leadId, lead.tier, new Date());
      processQueue({ immediateWelcomeAfterPoll: true });
      thread.addLabel(label);
      msg.markRead();
      Logger.log('✓ recuperado: ' + lead.nombre + ' [Tier ' + lead.tier + '|' + lead.puntuacion + 'pts] → ' + lead.email);
      guardados++;
    } catch(e) {
      Logger.log('✗ error guardando ' + lead.email + ': ' + e.toString());
    }
  });

  Logger.log('recuperarLeadsPerdidos RESUMEN → guardados=' + guardados +
    ' | ya existían=' + yaExistian + ' | saltados=' + saltados);
}

// ══════════════════════════════════════════════════════════════
// 3. GOOGLE SHEETS: Leads y Cola
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
    data.utm_source  || '',
    data.utm_medium  || '',
    data.utm_campaign|| '',
    data.utm_content || '',
    data.utm_term    || '',
    data.gclid       || '',
    data.gbraid      || '',
    data.wbraid      || '',
    // Columnas 26-30: prueba del consentimiento. No borrar ni reordenar: son la
    // evidencia frente a una reclamación (art. 7.1 RGPD).
    data.cons_privacidad || '',
    data.cons_marketing  || '',
    data.cons_version    || '',
    data.cons_fecha      || '',
    data.cons_texto      || '',
  ]);
  const r = sh.getLastRow();
  sh.getRange(r, 4).setNumberFormat('@');
  sh.getRange(r, 4).setValue(phone);
  return id;
}

function scheduleSequence(leadId, tier, createdAt) {
  const sheet    = getSheet('Cola');
  const sequence = SEQUENCES[tier] || SEQUENCES['C'];
  // Con envío manual la cola se siembra en «pausado-manual»: sirve de agenda de seguimiento
  // (qué toque tocaría y cuándo) sin que processQueue la envíe nunca.
  const estado = CONFIG.AUTO_SEND_LEADS === false ? 'pausado-manual' : 'pendiente';
  sequence.forEach(item => {
    const scheduledAt = new Date(createdAt.getTime() + item.delay * 3600 * 1000);
    sheet.appendRow([leadId, item.code, scheduledAt, estado, '', '']);
  });
}

/**
 * Reactiva la secuencia automática sin disparar de golpe los toques atrasados.
 * Pasos: 1) poner CONFIG.AUTO_SEND_LEADS = true  2) ejecutar esta función.
 * Los ítems «pausado-manual» con fecha futura vuelven a «pendiente»; los ya vencidos
 * se cancelan (enviarlos ahora sería una ráfaga de correos viejos al lead).
 */
function reanudarEnvioAutomatico() {
  if (CONFIG.AUTO_SEND_LEADS !== true) {
    Logger.log('reanudarEnvioAutomatico: CONFIG.AUTO_SEND_LEADS sigue en false. Cámbialo a true y vuelve a ejecutar.');
    return;
  }
  const sh = getSheet('Cola');
  const data = sh.getDataRange().getValues();
  const now = new Date();
  let reactivados = 0, cancelados = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][3] || '') !== 'pausado-manual') continue;
    const when = new Date(data[i][2]);
    if (!isNaN(when) && when > now) { sh.getRange(i + 1, 4).setValue('pendiente'); reactivados++; }
    else { sh.getRange(i + 1, 4).setValue('cancelado (pausa manual)'); cancelados++; }
  }
  Logger.log('reanudarEnvioAutomatico: reactivados=' + reactivados + ' · cancelados por vencidos=' + cancelados);
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

/**
 * Acuse de recibo inmediato (W0). Se envía en la misma pasada que detecta el lead,
 * sin esperar ventana laboral, y queda registrado en la hoja Cola para no repetirlo.
 * Un fallo aquí nunca debe impedir el registro del lead ni el aviso al asesor.
 */
function sendWelcomeEmail(leadId, lead) {
  if (CONFIG.AUTO_SEND_WELCOME === false) {
    Logger.log('sendWelcomeEmail: desactivado (AUTO_SEND_WELCOME=false)');
    return false;
  }
  if (!lead || !lead.email) return false;

  // Idempotencia: si ya consta un W0 enviado para este lead, no se repite.
  try {
    const q = getSheet('Cola').getDataRange().getValues();
    for (let i = 1; i < q.length; i++) {
      if (String(q[i][0]) === String(leadId) && String(q[i][1]) === 'W0') {
        Logger.log('sendWelcomeEmail: ya enviado antes para ' + leadId + ', omitido');
        return false;
      }
    }
  } catch (e) {
    Logger.log('sendWelcomeEmail: no se pudo comprobar la Cola (' + e.message + '), se continúa');
  }

  if (CONFIG.TEST_MODE) {
    Logger.log('[TEST] W0 → ' + lead.email);
    return false;
  }

  sendEmail('W0', lead, { welcome: true, bypassBusinessHours: true });
  try {
    getSheet('Cola').appendRow([leadId, 'W0', new Date(), 'enviado', new Date(), 'acuse de recibo automático']);
  } catch (e) {
    Logger.log('sendWelcomeEmail: enviado pero no registrado en Cola: ' + e.message);
  }
  Logger.log('✓ W0 (acuse de recibo) → ' + lead.email);
  return true;
}

/** Primer email de cada tier (tras registro en web). Puede enviarse fuera de horario solo cuando processQueue viene de pollGmail. */
function isWelcomeSequenceEmail(code) {
  return code === 'A1' || code === 'B1' || code === 'C1';
}


// ══════════════════════════════════════════════════════════════
// 4. PROCESAR COLA: trigger cada hora; pollGmail pasa { immediateWelcomeAfterPoll: true } para enviar A1/B1/C1 al instante
// ══════════════════════════════════════════════════════════════
/**
 * @param {Object} [opts]
 * @param {boolean} [opts.immediateWelcomeAfterPoll]: true solo desde pollGmail tras nuevo lead: A1/B1/C1 ignoran ventana laboral.
 */
function processQueue(opts) {
  opts = opts || {};
  // Interruptor maestro: con envío manual no sale ningún correo, ni el de bienvenida.
  if (CONFIG.AUTO_SEND_LEADS === false) {
    Logger.log('processQueue: envío automático desactivado (CONFIG.AUTO_SEND_LEADS=false). Los correos se envían a mano.');
    return;
  }
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
 * @param {boolean} [opts.bypassBusinessHours]: true: prueba manual (simulateLeadEmail) o bienvenida inmediata tras form (pollGmail).
 * @param {boolean} [opts.manual]: true: envío pedido a mano por el asesor (simulateLeadEmail).
 * @param {boolean} [opts.welcome]: true: acuse de recibo W0, permitido por CONFIG.AUTO_SEND_WELCOME.
 */
function sendEmail(code, lead, opts) {
  opts = opts || {};
  const allowed = opts.manual || (opts.welcome && CONFIG.AUTO_SEND_WELCOME !== false);
  if (CONFIG.AUTO_SEND_LEADS === false && !allowed) {
    throw new Error('Envío automático desactivado (CONFIG.AUTO_SEND_LEADS=false). Usa las plantillas de automation/MAILS-MANUALES.md.');
  }
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
// 6. WRAPPER HTML: envuelve el contenido en plantilla de marca
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
              Reservar llamada · 30 min
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  const firma  = `<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #E0DBD1;font-size:14px;color:#646464;line-height:1.6">Un saludo,<br><strong style="color:#1A1A1A">Equipo Horizonte Emirates</strong></p>`;

  // ── Lead magnet (M19): tarjeta con la guía fiscal prometida en la web ──
  // Se incluye en los emails de bienvenida (A1/B1/C1) para cumplir "te la enviamos al solicitar tu análisis".
  const guiaUrl  = CONFIG.GUIDE_URL;
  const guiaCard = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:22px 0 6px">
  <tr>
    <td style="background:#F8F6F1;border:1px solid #E0DBD1;border-radius:10px;padding:20px 22px">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#C4942A;font-weight:700">Recurso para usted</p>
      <p style="margin:0 0 12px;font-size:15px;color:#1A1A1A;line-height:1.5"><strong>Guía fiscal del inversor: Dubai ↔ España.</strong> Obligaciones en España (IRPF, Modelo 720, plusvalías), convenio de doble imposición y errores frecuentes.</p>
      <a href="${guiaUrl}" rel="noopener noreferrer" style="display:inline-block;background:#0D1B2A;color:#E9D9B0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;font-weight:700;letter-spacing:.02em;text-decoration:none;padding:11px 26px;border-radius:50px">Abrir la guía fiscal →</a>
    </td>
  </tr>
</table>`;

  // ── W0: ACUSE DE RECIBO INMEDIATO ───────────────────────────
  // Único correo automático activo. Reglas de este texto:
  //   1. No vende. Confirma lo recibido y devuelve el eco del perfil (prueba de que llegó bien).
  //   2. Dice la verdad sobre su naturaleza: es automático, y el siguiente lo escribe una persona.
  //      La transparencia genera más confianza que fingir que lo ha escrito alguien a mano.
  //   3. Entrega la guía fiscal en el momento: es el recurso que la web promete.
  //   4. Siembra la visita a Emiratos en una línea, sin desarrollarla (eso es el M11 manual).
  //   5. Da salida al lead impaciente con Calendly, sin convertirlo en la petición principal.
  if (code === 'W0') {
    const firma  = CONFIG.ASESOR_FIRMA || CONFIG.ASESOR_NOMBRE;
    const cuando = CONFIG.WELCOME_PROMISE || 'en las próximas 24 horas';
    const pila   = firstName(lead.nombre); // solo el nombre de pila: «Hola Jose», no «Hola Jose Diaz mellado»
    // El lead que entra por el modal de WhatsApp solo deja nombre, email y teléfono:
    // no tiene capital, objetivo ni país. La ficha se construye SOLO con lo que existe,
    // porque imprimir «su capital disponible» como si fuera un dato registrado deja el
    // correo con aspecto de plantilla a medio rellenar justo en el primer contacto.
    const fichaFilas = [];
    const filaFicha = (k, v) => `
  <tr>
    <td style="padding:7px 16px 7px 0;font-size:14px;color:#646464;white-space:nowrap">${k}</td>
    <td style="padding:7px 0;font-size:14px;color:#1A1A1A"><strong>${v}</strong></td>
  </tr>`;
    if (lead.capital)  fichaFilas.push(filaFicha('Capital', cap));
    if (lead.objetivo) fichaFilas.push(filaFicha('Objetivo', obj));
    if (lead.telefono) fichaFilas.push(filaFicha('Teléfono', lead.telefono));
    if (lead.pais)     fichaFilas.push(filaFicha('Residencia', lead.pais));
    const tieneFicha = fichaFilas.length > 0;
    const ficha = tieneFicha
      ? `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:18px 0 6px;border-collapse:collapse">${fichaFilas.join('')}
</table>`
      : '';
    const introFicha = tieneFicha
      ? 'Su solicitud ha llegado correctamente. Esto es lo que hemos registrado:'
      : 'Su solicitud ha llegado correctamente y ya la tenemos en cola.';
    const fichaTxt = [
      lead.capital  ? 'Capital: ' + cap : '',
      lead.objetivo ? 'Objetivo: ' + obj : '',
      lead.telefono ? 'Teléfono: ' + lead.telefono : '',
      lead.pais     ? 'Residencia: ' + lead.pais : '',
    ].filter(Boolean).join('\n');

    return {
      subject: `Hemos recibido su solicitud, ${pila}`,
      html: `<p>Hola ${pila},</p>
<p>${introFicha}</p>
${ficha}
<p>Este correo es automático, para que sepa que no se ha perdido nada. <strong>El siguiente lo escribo yo, ${cuando}</strong>, y ahí entramos en lo concreto: qué encaja con lo que busca y qué no.</p>
<p>Mientras tanto le dejo la guía fiscal, que es lo que más dudas resuelve al principio:</p>
${guiaCard}
<p>Y una cosa que suele sorprender: si en algún momento quiere ver los proyectos en persona, le montamos nosotros la agenda completa en Emiratos, incluidas las visitas a las promotoras y la reunión en nuestras oficinas de Dubai. Se lo cuento con calma en el próximo correo.</p>
<p>Si prefiere adelantar y hablar directamente con Marc, nuestro socio en Dubai, puede coger hueco aquí:</p>
${calBtn}
<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #E0DBD1;font-size:14px;color:#646464;line-height:1.6">Un saludo,<br><strong style="color:#1A1A1A">${firma}</strong><br>Horizonte Emirates<br><span style="font-size:13px">Puede responder a este correo: lo leo yo.</span></p>`,
      text: `Hola ${pila},\n\n${introFicha}\n${fichaTxt ? '\n' + fichaTxt + '\n' : ''}\nEste correo es automático, para que sepa que no se ha perdido nada. El siguiente lo escribo yo, ${cuando}, y ahí entramos en lo concreto: qué encaja con lo que busca y qué no.\n\nMientras tanto le dejo la guía fiscal Dubai y España, que es lo que más dudas resuelve al principio (IRPF, modelo 720, plusvalías y convenio de doble imposición):\n${guiaUrl}\n\nY una cosa que suele sorprender: si en algún momento quiere ver los proyectos en persona, le montamos nosotros la agenda completa en Emiratos, incluidas las visitas a las promotoras y la reunión en nuestras oficinas de Dubai. Se lo cuento con calma en el próximo correo.\n\nSi prefiere adelantar y hablar directamente con Marc, nuestro socio en Dubai, puede coger hueco aquí:\n${calL}\n\nUn saludo,\n${firma}\nHorizonte Emirates\nPuede responder a este correo: lo leo yo.`,
    };
  }

  // ── TIER A: 5 emails ────────────────────────────────────────

  if (code === 'A1') return {
    subject: `Hola ${n}, ya estamos revisando su consulta sobre Dubai`,
    html: `<p>Hola ${n},</p>
<p>Gracias por contactar con nosotros sobre inversión en Dubai.</p>
<p>Estamos preparando un análisis personalizado para <strong>${cap}</strong> con enfoque en <strong>${obj}</strong>.</p>
<p>En las próximas horas le enviaremos algunas opciones concretas y el siguiente paso recomendado.</p>
<p>Mientras tanto, le dejamos una guía práctica que resuelve muchas de las dudas habituales:</p>
${guiaCard}
<p>Si tiene alguna pregunta urgente, puede escribirme por WhatsApp:</p>
${waBtn}${firma}`,
    text: `Hola ${n},\n\nGracias por contactar con nosotros sobre inversión en Dubai.\nEstamos preparando un análisis personalizado para ${cap} con enfoque en ${obj}.\n\nEn las próximas horas le enviaremos algunas opciones concretas y el siguiente paso recomendado.\n\nMientras tanto, le dejamos nuestra guía fiscal Dubai-España (IRPF, Modelo 720, plusvalías): ${guiaUrl}\n\nSi tiene alguna pregunta urgente, puede escribirme por WhatsApp: ${wa}\n\nSaludos,\nEquipo Horizonte Emirates`,
  };

  if (code === 'A2') return {
    subject: `${n}, algunas opciones que podrían interesarle`,
    html: `<p>Hola ${n},</p>
<p>Basándome en su perfil de <strong>${cap}</strong> y <strong>${obj}</strong>, he seleccionado tres opciones que podrían encajar bien.</p>
<p>Dubai Marina/Business Bay: alrededor del 7-8% neto anual.</p>
<p>Ras Al Khaimah (antes del Wynn): potencial de plusvalía del 20-30% desde 200.000€.</p>
<p>Abu Dhabi (Aldar): 5-7% neto, más estable.</p>
<p>Si quiere que hablemos de alguna en detalle, podemos agendar 30 minutos por Calendly ${calL} o por WhatsApp.</p>
${waBtn}${firma}`,
    text: `Hola ${n},\n\nBasándome en su perfil de ${cap} y ${obj}, he seleccionado tres opciones que podrían encajar bien.\n\nDubai Marina/Business Bay: alrededor del 7-8% neto anual.\nRas Al Khaimah (antes del Wynn): potencial de plusvalía del 20-30% desde 200.000€.\nAbu Dhabi (Aldar): 5-7% neto, más estable.\n\nSi quiere que hablemos de alguna en detalle, podemos agendar 30 minutos por Calendly ${calL} o por WhatsApp ${wa}.\n\nSaludos,\nEquipo Horizonte Emirates`,
  };

  if (code === 'A3') return {
    subject: `Un detalle importante sobre inversiones en Dubai, ${n}`,
    html: `<p>Hola ${n},</p>
<p>Algo que veo a menudo con perfiles como el suyo es que los mejores activos off-plan tienen plazos limitados para entrar.</p>
<p>No es para presionar, solo para que sepa que a veces vale la pena revisar opciones pronto.</p>
<p>Si le apetece, podemos charlar 30 minutos sobre esto sin compromiso: Calendly ${calL} o WhatsApp.</p>
${waBtn}${firma}`,
    text: `Hola ${n},\n\nAlgo que veo a menudo con perfiles como el suyo es que los mejores activos off-plan tienen plazos limitados para entrar.\n\nNo es para presionar, solo para que sepa que a veces vale la pena revisar opciones pronto.\n\nSi le apetece, podemos charlar 30 minutos sobre esto sin compromiso: Calendly ${calL} o WhatsApp ${wa}.\n\nSaludos,\nEquipo Horizonte Emirates`,
  };

  if (code === 'A4') return {
    subject: `¿Ha pensado en visitar Dubai antes de decidir? ${n}`,
    html: `<p>Hola ${n},</p>
<p>Una cosa que ayuda mucho a la hora de decidir es visitar Dubai en persona.</p>
<p>Podemos organizar una agenda con visitas a propiedades y reuniones con promotoras en español.</p>
<p>Todo sin coste para usted (viaje y alojamiento por su cuenta, claro).</p>
<p>Si le interesa, hablemos por WhatsApp o agendemos algo por Calendly ${calL}.</p>
${waBtn}${firma}`,
    text: `Hola ${n},\n\nUna cosa que ayuda mucho a la hora de decidir es visitar Dubai en persona.\n\nPodemos organizar una agenda con visitas a propiedades y reuniones con promotoras en español.\n\nTodo sin coste para usted (viaje y alojamiento por su cuenta, claro).\n\nSi le interesa, hablemos por WhatsApp ${wa} o agendemos algo por Calendly ${calL}.\n\nSaludos,\nEquipo Horizonte Emirates`,
  };

  if (code === 'A5') return {
    subject: `${n}, ¿sigue pensando en Dubai?`,
    html: `<p>Hola ${n},</p>
<p>Quería saber si Dubai sigue siendo una opción que está considerando para invertir.</p>
<p>Si sí, podemos retomar la conversación cuando le venga bien.</p>
<p>Si no es el momento, no hay problema, lo dejamos aquí.</p>
<p>Envíeme un mensaje por WhatsApp si quiere.</p>
${waBtn}${firma}`,
    text: `Hola ${n},\n\nQuería saber si Dubai sigue siendo una opción que está considerando para invertir.\n\nSi sí, podemos retomar la conversación cuando le venga bien.\nSi no es el momento, no hay problema, lo dejamos aquí.\n\nEnvíeme un mensaje por WhatsApp ${wa} si quiere.\n\nSaludos,\nEquipo Horizonte Emirates`,
  };

  // ── TIER B: 7 emails ────────────────────────────────────────

  if (code === 'B1') return {
    subject: `Hola ${n}, hemos recibido su consulta`,
    html: `<p>Hola ${n},</p>
<p>Gracias por escribirnos sobre inversión en Dubai con <strong>${cap}</strong> y <strong>${obj}</strong>.</p>
<p>Estamos preparando algunas opciones y una comparativa de zonas para usted.</p>
<p>Le escribiremos en las próximas 24 horas con más detalles.</p>
<p>Mientras tanto, aquí tiene una guía práctica sobre la fiscalidad de la operación:</p>
${guiaCard}
<p>Si tiene alguna duda ahora, WhatsApp.</p>
${waBtn}${firma}`,
    text: `Hola ${n},\n\nGracias por escribirnos sobre inversión en Dubai con ${cap} y ${obj}.\n\nEstamos preparando algunas opciones y una comparativa de zonas para usted.\n\nLe escribiremos en las próximas 24 horas con más detalles.\n\nMientras tanto, le dejamos nuestra guía fiscal Dubai-España (IRPF, Modelo 720, plusvalías): ${guiaUrl}\n\nSi tiene alguna duda ahora, WhatsApp ${wa}.\n\nSaludos,\nEquipo Horizonte Emirates`,
  };

  if (code === 'B2') return {
    subject: `${n}, ¿podemos hablar 30 minutos esta semana?`,
    html: `<p>Hola ${n},</p>
<p>Ya tengo preparadas algunas opciones que podrían interesarle basadas en su perfil.</p>
<p>¿Le vendría bien una llamada breve de 30 minutos para revisarlas sin compromiso?</p>
<p>Podemos agendarla por Calendly ${calL} o directamente por WhatsApp.</p>
${waBtn}${firma}`,
    text: `Hola ${n},\n\nYa tengo preparadas algunas opciones que podrían interesarle basadas en su perfil.\n\n¿Le vendría bien una llamada breve de 30 minutos para revisarlas sin compromiso?\n\nPodemos agendarla por Calendly ${calL} o directamente por WhatsApp ${wa}.\n\nSaludos,\nEquipo Horizonte Emirates`,
  };

  if (code === 'B3') return {
    subject: `Aspectos clave antes de invertir en Dubai desde ${pais}`,
    html: `<p>Hola ${n},</p>
<p>Antes de dar pasos, es útil saber lo básico sobre fiscalidad en UAE (0% en muchos casos), obligaciones en ${pais}, proceso RERA y capital mínimo requerido.</p>
<p>Recuerde que no damos asesoramiento fiscal o jurídico, solo información general.</p>
<p>Si quiere que aclare alguna duda, WhatsApp.</p>
${waBtn}${firma}`,
    text: `Hola ${n},\n\nAntes de dar pasos, es útil saber lo básico sobre fiscalidad en UAE (0% en muchos casos), obligaciones en ${pais}, proceso RERA y capital mínimo requerido.\n\nRecuerde que no damos asesoramiento fiscal o jurídico, solo información general.\n\nSi quiere que aclare alguna duda, WhatsApp ${wa}.\n\nSaludos,\nEquipo Horizonte Emirates`,
  };

  if (code === 'B4') return {
    subject: `Lo que cambia cuando ves Dubai en persona, ${n}`,
    html: `<p>${sal} ${n},</p>
<p>Muchos inversores aceleran su decisión tras visitar Dubai en persona.</p>
<p>Ver el activo en persona, entender el entorno y hablar directamente con el promotor elimina las dudas que ningún PDF puede resolver. Es la diferencia entre analizar una oportunidad y comprenderla de verdad.</p>
<p>Por eso organizamos ese viaje para nuestros inversores: agenda de visitas, reuniones con promotoras verificadas y acompañamiento de nuestro equipo local en Dubai. <strong>Sin coste para el inversor</strong>, solo vuelo y alojamiento.</p>
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
<p>¿30 minutos para presentarle los números reales de cada opción?</p>
${calBtn}${waBtn}${firma}`,
    text: `${sal} ${n},\n\nDisponible esta semana para ${cap} · ${obj}:\n- Dubai Marina/JVC: 7-8% neto\n- RAK pre-Wynn: máxima apreciación\n- Abu Dhabi: 5-7% neto, estable\n\n30 min para los números reales. ${cal} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
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
<p>Si en algún momento (en tres meses, en seis, en un año) decide explorar en serio la inversión en Dubai, encontrará nuestro contacto en este email. El mercado de Dubai no va a desaparecer. Cuando esté listo para hablar, seguiremos aquí.</p>
<p>Gracias por su tiempo, ${n}.</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nPausamos seguimiento activo. Cuando quiera retomarlo, estaremos encantados de ayudarle.\n\n${CONFIG.REPLY_TO} / WhatsApp ${wa}\n\nGracias.\nEquipo Horizonte Emirates`,
  };

  // ── TIER C: 8 emails ────────────────────────────────────────

  if (code === 'C1') return {
    subject: `Gracias por su consulta sobre inversión en Dubai, ${n}`,
    html: `<p>${sal} ${n},</p>
<p>Gracias por contactar con Horizonte Emirates.</p>
<p>Entendemos que en esta etapa lo más valioso es información clara y honesta, no una propuesta comercial precipitada.</p>
<p>En los próximos días le enviaremos contenido que le ayudará a:</p>
<ul style="margin:12px 0;padding-left:20px;color:#3a3a3a;line-height:1.8">
  <li>Entender cómo funciona el mercado inmobiliario en UAE</li>
  <li>Conocer las implicaciones fiscales para residentes en ${pais}</li>
  <li>Comparar la rentabilidad real de Dubai frente a mercados europeos</li>
</ul>
<p>Para empezar, le dejamos nuestra guía fiscal: es justo el tipo de información clara que necesita en esta etapa.</p>
${guiaCard}
<p>Sin prisa. Cuando esté ${listoOLista} para dar un paso más, aquí estaremos.</p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nConsulta recibida. Le enviaremos contenido claro sobre mercado UAE, fiscalidad para ${pais} y comparativas de rentabilidad.\n\nPara empezar, aquí tiene nuestra guía fiscal Dubai-España (IRPF, Modelo 720, plusvalías): ${guiaUrl}\n\nSin prisa. Cuando esté ${listoOLista}, aquí estaremos.\n\nWhatsApp: ${wa}\n\nEquipo Horizonte Emirates`,
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
  <li><strong>Selección de activos.</strong> Presentamos oportunidades verificadas adaptadas a su perfil, no catálogos genéricos.</li>
  <li><strong>Due diligence en RERA.</strong> Verificamos el promotor y la situación legal de cada proyecto antes de presentarlo.</li>
  <li><strong>Reserva + SPA.</strong> Depósito inicial (5.000–10.000 AED) y firma del Sales Purchase Agreement.</li>
  <li><strong>Pagos escalonados.</strong> En off-plan: típicamente 30/30/40 hasta entrega. Sin inmovilizar capital completo.</li>
  <li><strong>Obligaciones en ${pais}.</strong> Modelo 720 a partir de 50.000€ + tributar rentas en IRPF. <em>Consulte asesor fiscal internacional, nosotros no lo prestamos.</em></li>
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
<p>En 2027 abre en Ras Al Khaimah el <strong>primer resort-casino de la región MENA</strong>, desarrollado por Wynn Resorts. Los activos comprados hoy (antes del evento) tienen proyecciones de apreciación del <strong>20–35%</strong> antes de la apertura.</p>
<p>La ventana de entrada a precios actuales se está cerrando de forma progresiva e irreversible.</p>
<p>Para un perfil como el suyo (<strong>${cap}</strong>, <strong>${obj}</strong>), RAK puede ser la pieza de mayor potencial de apreciación en un portfolio UAE bien estructurado.</p>
<p>¿Le interesa ver las opciones de entrada que tenemos disponibles ahora?</p>
${waBtn}${calBtn}${firma}`,
    text: `${sal} ${n},\n\nRAK + Wynn 2027: escenarios orientativos de +20-35% antes de la apertura.\nLa ventana de entrada se va cerrando progresivamente.\n\nPara ${cap} · ${obj}: puede ser una pieza de alto potencial en UAE.\n\nWhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C6') return {
    subject: `${n}, 30 minutos para decidir con datos si Dubai encaja`,
    html: `<p>${sal} ${n},</p>
<p>Ha pasado un mes desde que nos dejó su consulta. Le propongo 30 minutos donde:</p>
<ul style="margin:12px 0;padding-left:20px;color:#3a3a3a;line-height:1.8">
  <li>Le presento opciones actuales para <strong>${cap} · ${obj}</strong></li>
  <li>Resuelvo sus dudas sobre proceso, fiscalidad o mercado</li>
  <li>Le digo con honestidad si Dubai tiene sentido para usted en este momento</li>
</ul>
<p>Si concluimos que no es el momento, se lo digo directamente. Sin presión ni seguimiento posterior si no lo desea.</p>
${calBtn}${waBtn}${firma}`,
    text: `${sal} ${n},\n\nUn mes desde su consulta. 30 minutos para ${cap} · ${obj} y decirle con honestidad si Dubai tiene sentido ahora.\n\nSin compromiso. ${calL} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
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
/** Columna «Estado» (1-based) en hoja Leads: debe coincidir con initSheets. */
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
// 9. SETUP INICIAL: ejecutar una sola vez
// ══════════════════════════════════════════════════════════════
function initSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  let sh = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['ID','Nombre','Email','Teléfono','País','Capital','Objetivo',
                  'Experiencia','Plazo','Viaje Dubai','Puntuación','Tier','Canal',
                  'Origen','Fecha creación','Estado','Notas','UTM Source','UTM Medium',
                  'UTM Campaign','UTM Content','UTM Term','GCLID','GBRAID','WBRAID',
                  'Consent privacidad','Consent marketing','Consent versión',
                  'Consent fecha','Consent texto']);
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

/**
 * Migración de la hoja Leads ya existente: añade las 5 columnas de prueba del
 * consentimiento (26-30) si aún no están. Ejecutar UNA vez tras desplegar el
 * formulario con consentimiento separado. Es idempotente.
 */
function migrarColumnasConsentimiento() {
  const NUEVAS = ['Consent privacidad','Consent marketing','Consent versión',
                  'Consent fecha','Consent texto'];
  const sh = getSheet('Leads');
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());

  if (headers.indexOf(NUEVAS[0]) !== -1) {
    Logger.log('migrarColumnasConsentimiento: ya migrada, no se toca nada.');
    return;
  }
  if (lastCol < 25) {
    Logger.log('migrarColumnasConsentimiento: ABORTADA. La hoja tiene ' + lastCol +
               ' columnas y se esperaban 25 (hasta WBRAID). Revisar antes de continuar.');
    return;
  }

  sh.getRange(1, 26, 1, NUEVAS.length).setValues([NUEVAS]);
  sh.getRange(1, 26, 1, NUEVAS.length)
    .setFontWeight('bold').setBackground('#0D1B2A').setFontColor('#ffffff');
  sh.setColumnWidth(26, 110);
  sh.setColumnWidth(27, 110);
  sh.setColumnWidth(28, 100);
  sh.setColumnWidth(29, 150);
  sh.setColumnWidth(30, 320);

  // Los leads anteriores a esta versión no tienen prueba registrable: se marcan
  // como tales en lugar de dejarlos en blanco, para poder distinguirlos.
  const filas = sh.getLastRow() - 1;
  if (filas > 0) {
    const marca = [];
    for (let i = 0; i < filas; i++) {
      marca.push(['SIN REGISTRO', 'SIN REGISTRO', 'pre-v2', '', 'Lead anterior al registro de consentimiento (jul-2026). Casilla marcada en el formulario, sin evidencia almacenada.']);
    }
    sh.getRange(2, 26, filas, NUEVAS.length).setValues(marca);
  }
  Logger.log('✓ Columnas de consentimiento añadidas. Filas marcadas como pre-v2: ' + filas);
}

// ══════════════════════════════════════════════════════════════
// 9b. HEALTHCHECK DEL PIPELINE (M08): trigger cada hora
//     Detecta fallos silenciosos: leads atascados, pollGmail caído,
//     errores en la Cola y (opcional) inactividad de leads.
// ══════════════════════════════════════════════════════════════
function healthCheck() {
  const props = PropertiesService.getScriptProperties();
  const problems = [];

  // 1. Leads Web3Forms atascados: correo de lead HE recibido hace >30 min y aún sin etiqueta de procesado.
  const STUCK_MIN = 30;
  const cutoff = new Date(Date.now() - STUCK_MIN * 60 * 1000);
  try {
    const threads = GmailApp.search('from:web3forms.com newer_than:2d -label:' + CONFIG.LABEL_PROCESADO, 0, 30);
    let stuck = 0;
    threads.forEach(t => {
      const msg = getLatestThreadMessage(t);
      if (!msg) return;
      if (!isHorizonteWeb3Lead(msg.getSubject(), getMessageBodyForLeadParse(msg))) return;
      if (msg.getDate() < cutoff) stuck++;
    });
    if (stuck > 0) problems.push(stuck + ' correo(s) de lead Web3Forms sin procesar (>' + STUCK_MIN + ' min). Posible fallo de pollGmail o de parseo.');
  } catch (e) { problems.push('No se pudo revisar Gmail: ' + e.message); }

  // 2. Heartbeat de pollGmail: ¿se ejecutó en los últimos ~35 min?
  const lastPoll = props.getProperty('HE_LAST_POLL_TS');
  if (!lastPoll) {
    problems.push('Sin registro de ejecución de pollGmail. Ejecuta pollGmail y revisa los triggers.');
  } else {
    const ageMin = (Date.now() - Number(lastPoll)) / 60000;
    if (ageMin > 35) problems.push('pollGmail no se ejecuta desde hace ' + Math.round(ageMin) + ' min. ¿Trigger desactivado o sin permisos?');
  }

  // 3. Errores en la hoja Cola.
  try {
    const q = getSheet('Cola').getDataRange().getValues();
    let errs = 0;
    for (let i = 1; i < q.length; i++) { if (String(q[i][3] || '').indexOf('error') >= 0) errs++; }
    if (errs > 0) problems.push(errs + ' email(s) en la Cola con estado de error.');
  } catch (e) { problems.push('No se pudo leer la hoja Cola: ' + e.message); }

  // 4. (Opcional) Inactividad de leads: solo si se espera tráfico activo.
  if (CONFIG.EXPECT_TRAFFIC) {
    const maxH = Number(CONFIG.NO_LEAD_ALERT_HOURS || 72);
    try {
      const L = getSheet('Leads').getDataRange().getValues();
      let lastTs = 0;
      for (let i = 1; i < L.length; i++) { const d = new Date(L[i][14]); if (!isNaN(d)) lastTs = Math.max(lastTs, d.getTime()); }
      if (lastTs === 0 || (Date.now() - lastTs) / 3600000 > maxH) {
        problems.push('Sin nuevos leads en >' + maxH + 'h (EXPECT_TRAFFIC activo). Revisa campañas y formulario.');
      }
    } catch (e) { /* hoja Leads ya cubierta arriba */ }
  }

  if (!problems.length) { Logger.log('healthCheck OK'); return; }

  // Anti-spam: no repetir la misma alerta en menos de 6 h.
  const sig = problems.join(' | ');
  const sameRecently = sig === (props.getProperty('HE_LAST_HEALTH_ALERT') || '') &&
    (Date.now() - Number(props.getProperty('HE_LAST_HEALTH_ALERT_TS') || 0)) / 3600000 < 6;
  if (sameRecently) { Logger.log('healthCheck: misma alerta reciente, omitida'); return; }

  GmailApp.sendEmail(
    CONFIG.AGENT_BRIEFING_EMAIL,
    '[HE] ⚠ Healthcheck del funnel: ' + problems.length + ' incidencia(s)',
    'El healthcheck ha detectado:\n\n- ' + problems.join('\n- ') +
      '\n\nRevisar en Apps Script: pollGmail, triggers y las hojas Leads/Cola.',
    { name: CONFIG.ASESOR_NOMBRE, replyTo: CONFIG.REPLY_TO }
  );
  forceUnreadBySubjectToken('Healthcheck del funnel');
  props.setProperty('HE_LAST_HEALTH_ALERT', sig);
  props.setProperty('HE_LAST_HEALTH_ALERT_TS', String(Date.now()));
  Logger.log('healthCheck: alerta enviada, ' + sig);
}

function createTriggers() {
  const timeTriggerHandlers = ['pollGmail', 'pollUnsubscribes', 'processQueue', 'notifyCalendlyBookings', 'healthCheck'];
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (timeTriggerHandlers.indexOf(fn) !== -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('pollGmail').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('pollUnsubscribes').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('notifyCalendlyBookings').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('processQueue').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('healthCheck').timeBased().everyHours(1).create(); // M08
  Logger.log('✓ Triggers activos: pollGmail + pollUnsubscribes + notifyCalendlyBookings cada 10 min · processQueue + healthCheck cada hora');
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
      utm_source: r[17], utm_medium: r[18], utm_campaign: r[19], utm_content: r[20], utm_term: r[21],
      gclid: r[22], gbraid: r[23], wbraid: r[24],
      cons_privacidad: r[25], cons_marketing: r[26], cons_version: r[27],
      cons_fecha: r[28], cons_texto: r[29],
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
    // manual:true = excepción explícita del asesor al interruptor AUTO_SEND_LEADS.
    sendEmail(code, lead, { bypassBusinessHours: true, manual: true });
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

/**
 * Vista previa del acuse de recibo sin enviar nada: escribe asunto y texto en el registro.
 * Ejecutar desde el desplegable de Apps Script para revisar el copy y la frase de plazo.
 */
function previewWelcome() {
  const lead = {
    nombre: 'Jose Diaz', email: 'ejemplo@ejemplo.com',
    capital: '150k-300k', objetivo: 'alquiler', plazo: '6meses',
    pais: 'España', viaje: 'quizas', canal: 'email', tier: 'B', puntuacion: 8,
  };
  const tpl = getTemplate('W0', lead);
  Logger.log('=== W0 · acuse de recibo ===');
  Logger.log('Plazo prometido (CONFIG.WELCOME_PROMISE): ' + CONFIG.WELCOME_PROMISE);
  Logger.log('Asunto: ' + tpl.subject);
  Logger.log('\n' + buildEmailPlainBody(tpl.text));
}

/** Envío real del acuse de recibo a la dirección del asesor, para verlo en el buzón tal cual llega. */
function testWelcomeToSelf() {
  const lead = {
    nombre: 'Prueba Interna', email: CONFIG.AGENT_BRIEFING_EMAIL,
    capital: '300k-600k', objetivo: 'revalorizacion', plazo: 'ya',
    pais: 'España', viaje: 'si', canal: 'whatsapp', tier: 'A', puntuacion: 11,
  };
  sendEmail('W0', lead, { welcome: true, bypassBusinessHours: true });
  Logger.log('✓ W0 de prueba enviado a ' + lead.email);
}

// Helpers de ejecución manual en Apps Script (desplegable sin parámetros)
function runSimulationA1() {
  simulateLeadEmail(CONFIG.AGENT_BRIEFING_EMAIL, 'A1', false);
}

function runRealSendA1() {
  simulateLeadEmail(CONFIG.AGENT_BRIEFING_EMAIL, 'A1', true);
}

// HE_EMAILS_GS_EOF: Si no ves esta línea al final de Código.gs, el pegado está truncado (provoca «Unexpected end of input»).
