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
  // Mismo contenido en PDF: es lo que abre el formulario de la home (app.js, GUIA_URL),
  // y lo que espera encontrar en el correo quien descargó y cerró la pestaña sin guardarlo.
  GUIDE_PDF_URL:   'https://www.horizonteemirates.com/guias/guia-fiscal-dubai-espana.pdf',
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
  // Reintento: respuestas recientes sin etiqueta de baja procesada, LEÍDAS incluidas.
  // Sin esto, una baja que usted abriera antes de la pasada del trigger no se procesaba
  // nunca (la consulta principal exige is:unread) y esa persona seguía en la secuencia.
  UNSUBSCRIBE_QUERY_FALLBACK: 'to:hola@horizonteemirates.com newer_than:7d -from:web3forms.com -label:HE-bajas-procesado',
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
  /**
   * ACUSE DE RECIBO DE LAS DESCARGAS DE LA GUÍA (código W0D), interruptor propio.
   * El formulario de la home solo pide el email, así que quien descarga no deja teléfono
   * ni ningún otro dato: si no se le escribe, no hay forma de contactarle y el contacto
   * se pierde entero. Además la web le promete por escrito que se la enviamos («También
   * se la enviamos a su-email», app.js) y la casilla que marca dice literalmente «que me
   * envíen la guía por email», que es la base legal de este correo (art. 6.1.b/f RGPD).
   * No vende: entrega la guía, abre la puerta a responder y ofrece la llamada como salida.
   * Los tres correos de nurturing D1-D3 se siguen escribiendo a mano (MAILS-MANUALES.md).
   * false → la descarga solo se registra en la hoja Descargas y se avisa al asesor.
   */
  AUTO_SEND_WELCOME_DESCARGA: true,
  /**
   * CAPA DE NURTURING AUTOMÁTICO (2026-09-07), independiente del interruptor anterior.
   * Motivo: Marc contacta por WhatsApp y muchos leads no contestan; no hay integración
   * con WATI (pendiente) para saber si hubo respuesta, así que no hay señal que consultar.
   * En su lugar, este interruptor reactiva SOLO la parte de la cola que no es primer
   * contacto (nunca A1/B1/C1: esos duplicarían el M1 que ya se escribe a mano) para
   * leads con Consent marketing: SI. El kit manual M1-M11 sigue exactamente igual.
   * false = como ahora: nada sale solo salvo W0.
   * true  = tras activarlo, ejecutar UNA vez activarNurtureAutomatico() (ver más abajo,
   *         cerca de reanudarEnvioAutomatico). Sin eso, el interruptor no hace nada:
   *         la cola sigue en «pausado-manual» hasta que esa función la reactiva.
   */
  AUTO_SEND_NURTURE: false,
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
  /**
   * REGLA DE LECTURA de toda la automatización (ver cerrarHiloProcesado).
   * true  = NADA se marca como leído. Los avisos que exigen acción (lead nuevo y descarga
   *         de la guía) se dejan además destacados e importantes; el resto de correos que
   *         toca el script (Web3Forms ajeno al embudo, duplicados, bajas) se quedan
   *         exactamente como estaban. Lo que evita reprocesar un hilo es la etiqueta
   *         HE-procesado, nunca el estado de leído.
   * false = comportamiento antiguo: el script marca leído todo lo que procesa.
   */
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
  /**
   * REMARKETING A LEADS QUE NO CONTESTARON (secuencias R1-R4 / RE1-RE2).
   * A quién se le manda NO lo decide el código: lo marca usted a mano en la hoja Leads,
   * en la columna «Remarketing» (casilla). La marca manda en los dos sentidos: se
   * programa al marcarla y la secuencia SE PARA si la desmarca, aunque queden correos
   * en cola. Ver programarRemarketing().
   */
  REMARKETING_COL: 'Remarketing',
  /**
   * Interruptor del remarketing, independiente de los otros dos a propósito.
   * El orden del embudo es: W0 automático → TODO pausado para trabajar el lead a mano →
   * si no contesta, usted lo marca y empiezan los correos periódicos. Para que eso
   * funcione, apagar el nurturing por tier (AUTO_SEND_NURTURE) no puede apagar también
   * el remarketing, y por eso tiene su propia llave.
   * false → la cola de remarketing se queda quieta, sin enviar nada.
   */
  AUTO_SEND_REMARKETING: true,
  /**
   * MISMO TRATO PARA TODOS LOS MARCADOS (decisión del negocio, 14-sep-2026).
   * true  = quien usted marque recibe la secuencia completa R1-R8 + R9, haya marcado
   *         o no la casilla de marketing en el formulario. Quien no lo quiera, responde
   *         BAJA y sale al instante (pollUnsubscribes lo procesa cada 10 minutos).
   * false = dos vías según el consentimiento: R1-R8 a quien lo dio y RE1-RE2, sin
   *         contenido comercial, a quien no.
   * Con true, a un lead sin «Consent marketing: SI» le llega contenido comercial: es
   * una decisión de negocio consciente, no un descuido, y la exposición es de Propulse.
   * Las plantillas RE1-RE2 se conservan para poder volver atrás cambiando esta línea.
   */
  REMARKETING_MISMO_TRATO: true,
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

/**
 * A-103/A-209: avisa de una descarga nueva de la guía fiscal. Antes de esto, la única
 * forma de enterarse era leer a mano el correo «[Descarga guia fiscal] ...» en Gmail.
 * El acuse de recibo con la guía (W0D) lo envía sendWelcomeDescarga antes de este aviso;
 * aquí solo se informa de si salió. El nurturing D1-D3 (automation/MAILS-MANUALES.md)
 * se sigue escribiendo a mano tras leer este correo.
 * @param {Object} d descarga registrada.
 * @param {boolean} [bienvenidaEnviada] true si el W0D salió en esta misma pasada.
 */
function notifyAgentNewDownload(d, bienvenidaEnviada) {
  if (!CONFIG.NOTIFY_AGENT_ON_NEW_LEAD) return;
  if (!d || !d.email) return;

  const subject = '📄 Nueva descarga guía fiscal · ' + d.email;
  const acuse = bienvenidaEnviada
    ? 'Acuse automático (W0D) con la guía: ENVIADO. Ya tiene la guía y sabe que puede responder.'
    : 'Acuse automático (W0D) con la guía: NO ENVIADO (repetido, desactivado o con error). ' +
      'Revisar el registro y, si procede, ejecutar enviarBienvenidasDescargasPendientes().';
  const body = [
    'Email: ' + d.email,
    'Fecha: ' + new Date().toLocaleString('es-ES'),
    'Origen: guía fiscal (home, formulario de 1 campo)',
    '',
    acuse,
    '',
    'Siguiente paso (A-103/A-209): enviar D1 (email de nurturing 1) en 24-48h',
    '(plantillas D1-D3 en automation/MAILS-MANUALES.md).',
    'Marcar el estado en la hoja «Descargas» tras enviarlo.',
  ].join('\n');

  GmailApp.sendEmail(CONFIG.AGENT_BRIEFING_EMAIL, subject, body, {
    name:    CONFIG.ASESOR_NOMBRE,
    replyTo: CONFIG.REPLY_TO,
  });

  // Gmail marca como leído todo lo que envía la propia cuenta, así que este aviso aterrizaba
  // en Recibidos sin negrita: justo lo que hace que una descarga pase inadvertida. El email
  // del que descarga es único y está en el asunto, así que sirve de token de búsqueda.
  // De paso alcanza también el aviso de Web3Forms del mismo email («[Descarga guia fiscal] …»),
  // que es igual de deseable: los dos correos de esa descarga quedan en negrita y destacados.
  forceUnreadBySubjectToken(d.email);
  Logger.log('notifyAgentNewDownload: aviso enviado (' + d.email + ')');
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
    // Las celdas también cortan línea: el aviso de Web3Forms es una tabla
    // «etiqueta | valor», y sin esto ambas quedaban pegadas en la misma línea
    // y el parser de «clave: valor» no reconocía ni un solo campo.
    .replace(/<\/(td|th)>/gi, '\n')
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

/** Remitentes del proveedor del formulario (notify@web3forms.com y cualquier subdominio). */
const WEB3FORMS_FROM_RE = /@(?:[a-z0-9.-]+\.)?web3forms\.com\b/i;

/**
 * Mensaje del hilo que contiene DE VERDAD el aviso del formulario: el más reciente
 * enviado por Web3Forms, no el último del hilo.
 *
 * Por qué no vale el último (incidente del 18-sep-2026, lead YOANA SENA): el aviso se
 * reenvió a mano al asesor 74 segundos después de entrar, y ese reenvío pasó a ser el
 * último mensaje del hilo. En un reenvío Gmail aplana la tabla del aviso (la etiqueta
 * y su valor quedan en líneas distintas, sin «:»), así que el parser no sacaba ni un
 * campo y caía al rescate por expresión regular, que se quedaba con el primer email
 * del cuerpo: el nuestro, el de la cabecera «To: hola@horizonteemirates.com». El lead
 * se guardó con nuestro propio correo y el acuse de recibo se lo mandamos a nosotros.
 *
 * Con esto, reenviar o responder un aviso deja de afectar a lo que se registra.
 */
function getAvisoWeb3Forms(thread) {
  const msgs = thread.getMessages();
  for (let i = msgs.length - 1; i >= 0; i--) {
    try {
      if (WEB3FORMS_FROM_RE.test(String(msgs[i].getFrom() || ''))) return msgs[i];
    } catch (e) { /* un mensaje ilegible no puede tumbar la pasada */ }
  }
  return msgs.length ? msgs[msgs.length - 1] : null;
}

/**
 * true si la dirección es nuestra o del proveedor del formulario, nunca la de un lead.
 * Solo se usa en el RESCATE por expresión regular de parseLeadFromEmail: si el aviso
 * trae el campo «Email» explícito, se respeta tal cual (una prueba hecha con nuestra
 * propia dirección debe seguir funcionando).
 */
function esEmailInterno(email) {
  const e = String(email || '').toLowerCase().trim();
  if (!e) return true;
  if (WEB3FORMS_FROM_RE.test('@' + e.split('@')[1])) return true;
  if (/^(?:no-?reply|noreply|notify|mailer-daemon|postmaster|bounce)[^@]*@/.test(e)) return true;
  if (/@(?:[a-z0-9.-]+\.)?horizonteemirates\.com$/.test(e)) return true;
  const propias = [CONFIG.REPLY_TO, CONFIG.AGENT_BRIEFING_EMAIL];
  try { propias.push(Session.getActiveUser().getEmail()); } catch (err) { /* sin permiso: se ignora */ }
  return propias.some(p => String(p || '').toLowerCase().trim() === e);
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

/**
 * true si el aviso corresponde a una descarga de la guía fiscal (formulario de 1 solo
 * campo en #guia-fiscal, ver app.js). Deliberadamente NO coincide con isHorizonteWeb3Lead:
 * así el mismo email puede completar después el formulario largo sin chocar con
 * leadExists(), que solo mira la hoja Leads (comentario de app.js sobre por qué el
 * asunto evita el patrón «[X|Npts]»/«Lead HE»).
 */
function isGuiaDownload(subject) {
  return /^\[Descarga guia fiscal\]/i.test(String(subject || '').trim());
}

/**
 * Cierra el tratamiento de un hilo por parte de la automatización: le pone su etiqueta
 * y decide el estado de lectura. REGLA ÚNICA, y la única que hay que recordar:
 * esta automatización NUNCA marca como leído un correo. Lo que evita reprocesar un
 * hilo es la etiqueta, no el estado de leído (las dos consultas de pollGmail excluyen
 * «-label:HE-procesado»), así que marcar leído no aportaba nada y escondía avisos.
 *
 * Tres comportamientos, en un solo sitio en vez de repartidos por cada rama:
 *   destacar:true  → no leído + destacado + importante. Para lo que exige acción
 *                    (lead nuevo, descarga de la guía): tiene que saltar a la vista.
 *   por defecto    → se etiqueta y NO se toca el estado de lectura. Ni se marca leído
 *                    ni se fuerza a no leído: el correo se queda como usted lo dejó.
 *   KEEP_LEAD_MAIL_UNREAD=false → vuelve el comportamiento antiguo (marcar leído).
 *
 * @param {GmailThread} thread hilo a etiquetar.
 * @param {GmailMessage} msg mensaje más reciente del hilo.
 * @param {Object} [opts]
 * @param {GmailLabel} [opts.label] etiqueta a aplicar (por defecto, HE-procesado).
 * @param {boolean} [opts.destacar] true para dejarlo en negrita, destacado e importante.
 */
function cerrarHiloProcesado(thread, msg, opts) {
  opts = opts || {};
  const label = opts.label || ensureGmailLabel(CONFIG.LABEL_PROCESADO);
  try {
    thread.addLabel(label);
  } catch (e) {
    Logger.log('cerrarHiloProcesado: no se pudo etiquetar «' + msg.getSubject() + '»: ' + e.message);
  }

  if (CONFIG.KEEP_LEAD_MAIL_UNREAD === false) {
    msg.markRead();
    return;
  }
  if (opts.destacar) {
    msg.markUnread();
    msg.star();
    thread.markImportant();
  }
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
      const msg = getAvisoWeb3Forms(thread);
      if (!msg) return;

      if (thread.getLabels().some(l => l.getName() === CONFIG.LABEL_PROCESADO)) {
        Logger.log('pollGmail: omitido (ya etiquetado HE-procesado): ' + msg.getSubject());
        return;
      }

      const subject = msg.getSubject();
      const body    = getMessageBodyForLeadParse(msg);
      Logger.log('pollGmail: FROM=' + msg.getFrom() + ' | SUBJECT=' + subject);

      // A-209 (parte 1/3): las descargas de la guía fiscal no son leads del funnel
      // principal (ver isGuiaDownload). Se registran en su propia hoja «Descargas»
      // para dejar de perderse, sin tocar isHorizonteWeb3Lead ni leadExists().
      if (isGuiaDownload(subject)) {
        // Se destaca lo que pide una mirada: una descarga nueva, o un aviso del que no se
        // pudo sacar el email (ahí se ha perdido un contacto y hay que verlo). Una descarga
        // repetida no exige nada, y destacar lo que no requiere acción acaba enseñando a
        // ignorar lo destacado, que es como se pierde el siguiente lead de verdad.
        let destacarDescarga = true;
        const descarga = parseLeadFromEmail(body, subject);
        if (descarga && descarga.email) {
          if (!descargaExists(descarga.email)) {
            saveDescarga(descarga);
            // El acuse con la guía va primero: es lo único que esa persona espera, y su email
            // es el único dato que ha dejado. Si falla, la descarga ya está registrada y el
            // aviso al asesor sale igualmente (dice que el correo no ha salido).
            let bienvenidaEnviada = false;
            try {
              bienvenidaEnviada = sendWelcomeDescarga(descarga);
            } catch (wErr) {
              Logger.log('pollGmail: fallo al enviar el acuse W0D a ' + descarga.email + ': ' + wErr.toString());
            }
            // La descarga también se incorpora al CRM: si no, esa persona no aparece en
            // la lista de leads y no hay forma de marcarla para remarketing, aunque haya
            // entrado por un clic de pago. Un fallo aquí no debe tumbar la pasada.
            try { promoverDescargaALead(descarga); } catch (pErr) {
              Logger.log('pollGmail: no se pudo incorporar al CRM ' + descarga.email + ': ' + pErr.toString());
            }
            try { notifyAgentNewDownload(descarga, bienvenidaEnviada); } catch (nErr) {
              Logger.log('pollGmail: fallo al avisar de la descarga de ' + descarga.email + ': ' + nErr.toString());
            }
            Logger.log('✓ descarga guía fiscal: ' + descarga.email);
          } else {
            destacarDescarga = false;
            Logger.log('= descarga guía fiscal repetida: ' + descarga.email);
          }
        } else {
          Logger.log('pollGmail: descarga de guía sin email parseable: ' + subject);
        }
        // Mismo trato que el aviso de un lead: la descarga se queda en negrita y en
        // Recibidos hasta que alguien la abre.
        cerrarHiloProcesado(thread, msg, { label: label, destacar: destacarDescarga });
        return;
      }

      // Verificar que es un lead de Horizonte Emirates
      const isHE = isHorizonteWeb3Lead(subject, body);
      if (!isHE) {
        // No es del embudo: se etiqueta (para que no vuelva a entrar en el lote de cada
        // pasada) y se deja tal cual estaba. Antes se marcaba leído, que es justo lo que
        // no debe hacer un proceso automático con un correo que usted no ha abierto.
        Logger.log('pollGmail: descartado (sin keyword HE): ' + subject);
        cerrarHiloProcesado(thread, msg, { label: label });
        return;
      }

      const lead = parseLeadFromEmail(body, subject);
      if (!lead || !lead.email) {
        Logger.log('No se pudo parsear lead: ' + subject);
        Logger.log('pollGmail: body snippet=\n' + body.substring(0, 600));
        // Aquí se ha perdido un lead de verdad: el aviso es del embudo y no se le ha
        // podido sacar el email. Se deja en negrita y destacado para que salte a la vista
        // (mismo criterio que una descarga sin email parseable), en vez de etiquetarlo
        // en silencio y que nadie se entere hasta el informe del guardián.
        cerrarHiloProcesado(thread, msg, { label: label, destacar: true });
        return;
      }

      let leadId;
      let fichaCompletada = false;
      if (leadExists(lead.email)) {
        // Puede ser un duplicado de verdad o la ficha que se creó al descargar la guía,
        // que solo tiene el email. En el segundo caso se completa en vez de descartarse.
        leadId = completarLeadDesdeFormulario(lead);
        if (!leadId) {
          Logger.log('Lead duplicado, ignorando: ' + lead.email);
          cerrarHiloProcesado(thread, msg, { label: label });
          return;
        }
        fichaCompletada = true;
      }

      try {
        if (!fichaCompletada) leadId = saveLead(lead);
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

      // El aviso se queda en negrita y destacado en Recibidos: el lead no se pasa por alto.
      // El guard de etiqueta del principio del bucle evita que se reprocese.
      cerrarHiloProcesado(thread, msg, { label: label, destacar: true });
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
    const msg = getAvisoWeb3Forms(thread);
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
/**
 * ¿Pide la baja este texto? Compara por PALABRA COMPLETA, no por subcadena.
 * Antes bastaba con que el cuerpo contuviera «baja» en cualquier posición, y eso
 * daba de baja a quien escribiera «mi mujer trabaja en Dubai» o «stopover en Dubai»:
 * el lead se marcaba como baja, se le cancelaba la cola y nadie se enteraba.
 * Se normaliza sin acentos y se exige que la palabra no esté pegada a otras letras.
 */
function pideBaja(texto) {
  const t = String(texto || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CONFIG.UNSUBSCRIBE_KEYWORDS.some(kw => {
    const k = String(kw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (!k) return false;
    const escapada = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z0-9])' + escapada + '([^a-z0-9]|$)').test(t);
  });
}

function pollUnsubscribes() {
  let threads = GmailApp.search(CONFIG.UNSUBSCRIBE_QUERY, 0, 30);
  if (CONFIG.UNSUBSCRIBE_QUERY_FALLBACK) {
    const vistos = {};
    threads.forEach(t => { vistos[t.getId()] = true; });
    GmailApp.search(CONFIG.UNSUBSCRIBE_QUERY_FALLBACK, 0, 30).forEach(t => {
      if (!vistos[t.getId()]) { vistos[t.getId()] = true; threads.push(t); }
    });
  }
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

      if (thread.getLabels().some(l => l.getName() === CONFIG.LABEL_BAJAS)) return;

      const isUnsubscribe = pideBaja(msg.getSubject()) || pideBaja(msg.getPlainBody());
      if (!isUnsubscribe) return;

      const updated = markUnsubscribed(senderEmail);
      // Quien pide la baja puede no estar en Leads: si solo descargó la guía, su rastro
      // está en Descargas, y sin tocarlo ahí seguiría recibiendo el nurturing D1-D3.
      const enDescargas = markUnsubscribedDescarga(senderEmail);
      if (updated || enDescargas) {
        Logger.log('✓ Baja automática por respuesta: ' + senderEmail +
          (updated ? ' [Leads]' : '') + (enDescargas ? ' [Descargas]' : ''));
      } else {
        Logger.log('Solicitud de baja de alguien que no está ni en Leads ni en Descargas: ' + senderEmail);
      }

      // Una solicitud de baja se registra en el CRM, pero el correo se queda como esté:
      // es la respuesta de una persona y le toca a usted decidir si la contesta.
      cerrarHiloProcesado(thread, msg, { label: label });
    } catch(e) {
      Logger.log('Error procesando baja: ' + e.toString());
    }
  });
}


// ══════════════════════════════════════════════════════════════
// 2. PARSEAR EMAIL DE WEB3FORMS
//    Compatible con formulario V1, V2 y V3
// ══════════════════════════════════════════════════════════════
/**
 * Claves reconocidas del aviso del formulario → campo del lead, en un solo sitio.
 * `multilinea: true` para los textos largos (la prueba del consentimiento), que en un
 * aviso reenviado llegan partidos en varias líneas.
 * Ver parseLeadFromEmail: esta tabla la usan sus dos pasadas.
 */
const LEAD_CAMPOS = {
  nombre:       { set: (l, v) => { l.nombre = v; } },
  apellidos:    { set: (l, v) => { l.apellidos = v; } },
  email:        { set: (l, v) => { l.email = v.toLowerCase(); } },
  mail:         { set: (l, v) => { l.email = v.toLowerCase(); } },
  e_mail:       { set: (l, v) => { l.email = v.toLowerCase(); } },
  correo:       { set: (l, v) => { l.email = v.toLowerCase(); } },
  correo_electronico: { set: (l, v) => { l.email = v.toLowerCase(); } },
  replyto:      { set: (l, v) => { l.email = v.toLowerCase(); } },
  reply_to:     { set: (l, v) => { l.email = v.toLowerCase(); } },
  telefono:     { set: (l, v) => { l.telefono = v; } },
  pais:         { set: (l, v) => { l.pais = v; } },
  capital:      { set: (l, v) => { l.capital = v; } },
  objetivo:     { set: (l, v) => { l.objetivo = v; } },
  experiencia:  { set: (l, v) => { l.experiencia = v; } },
  plazo:        { set: (l, v) => { l.plazo = v; } },
  // Compatibilidad V1 (viaje_dubai), V3 (visita_dubai) y ambos sin prefijo
  viaje:        { set: (l, v) => { l.viaje = v; } },
  viaje_dubai:  { set: (l, v) => { l.viaje = v; } },
  visita_dubai: { set: (l, v) => { l.viaje = v; } },
  canal:            { set: (l, v) => { l.canal = v; } },
  canal_preferido:  { set: (l, v) => { l.canal = v; } },
  tier:         { set: (l, v) => { l.tier = v; } },
  puntuacion:   { set: (l, v) => { l.puntuacion = parseInt(v) || l.puntuacion; } },
  origen:       { set: (l, v) => { l.origen = v; } },
  utm_source:   { set: (l, v) => { l.utm_source = v; } },
  utm_medium:   { set: (l, v) => { l.utm_medium = v; } },
  utm_campaign: { set: (l, v) => { l.utm_campaign = v; } },
  utm_content:  { set: (l, v) => { l.utm_content = v; } },
  utm_term:     { set: (l, v) => { l.utm_term = v; } },
  gclid:        { set: (l, v) => { l.gclid = v; } },
  gbraid:       { set: (l, v) => { l.gbraid = v; } },
  wbraid:       { set: (l, v) => { l.wbraid = v; } },
  // Prueba del consentimiento (art. 7.1 RGPD). Los envía app.js en cada formulario.
  consentimiento_privacidad: { set: (l, v) => { l.cons_privacidad = v; } },
  consentimiento_marketing:  { set: (l, v) => { l.cons_marketing = v; } },
  consentimiento_version:    { set: (l, v) => { l.cons_version = v; } },
  consentimiento_fecha:      { set: (l, v) => { l.cons_fecha = v; } },
  consentimiento_texto:      { set: (l, v) => { l.cons_texto = v; }, multilinea: true },
  // No se guarda en la hoja, pero tiene que estar reconocida: si no, la pasada 2 la toma
  // como continuación del texto de privacidad y los dos consentimientos quedan mezclados.
  consentimiento_texto_marketing: { set: (l, v) => { l.cons_texto_marketing = v; }, multilinea: true },
};

/** Normaliza una etiqueta del aviso a la clave de LEAD_CAMPOS («👤 Nombre» → «nombre»). */
function normalizaClaveLead(raw) {
  return String(raw || '').trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Limpia iconos y signos para soportar etiquetas visuales (ej. "👤 Nombre").
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    // Soporta agrupación visual en etiquetas del form (ej. "Contacto · Nombre").
    .replace(/^(contacto|inversion)_+/, '');
}

function parseLeadFromEmail(body, subject) {
  const lead = {};

  // Tier y puntuación desde el subject: "[A|11pts] ..."
  const tierMatch  = subject.match(/\[([ABC])/);
  const scoreMatch = subject.match(/\|(\d+)pts/);
  lead.tier       = tierMatch  ? tierMatch[1]       : 'C';
  lead.puntuacion = scoreMatch ? parseInt(scoreMatch[1]) : 0;

  const lineas = body.split(/\r?\n/);

  // PASADA 1 · formato normal del aviso de Web3Forms: «clave: valor» en la misma línea.
  lineas.forEach(line => {
    const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
    if (!m) return;
    const campo = LEAD_CAMPOS[normalizaClaveLead(m[1])];
    if (campo) campo.set(lead, m[2].trim());
  });

  // PASADA 2 · etiqueta y valor en líneas distintas. Así llega un aviso REENVIADO:
  // Gmail aplana la tabla HTML y desaparecen los «:», de modo que la pasada 1 no
  // encuentra nada. Solo entra si no se ha sacado el email (el dato sin el cual el
  // lead no sirve) y nunca pisa lo que ya se haya leído: es un rescate, no la vía normal.
  if (!lead.email) {
    for (let i = 0; i < lineas.length - 1; i++) {
      const clave = normalizaClaveLead(lineas[i]);
      const campo = LEAD_CAMPOS[clave];
      if (!campo) continue;
      // Etiqueta seguida de otra etiqueta = campo vacío en el formulario (p. ej.
      // «Objetivo» sin responder). Se salta sin consumir la siguiente.
      const partes = [];
      let j = i + 1;
      while (j < lineas.length) {
        const val = lineas[j].trim();
        if (!val || LEAD_CAMPOS[normalizaClaveLead(val)]) break;
        partes.push(val);
        j++;
        if (!campo.multilinea) break;
      }
      if (!partes.length) continue;
      campo.set(lead, partes.join(' '));
      i = j - 1;
    }
  }

  if (lead.apellidos && lead.nombre) {
    lead.nombre = (lead.nombre + ' ' + lead.apellidos).trim();
  }
  delete lead.apellidos;

  // ÚLTIMO RECURSO: ningún campo «Email» reconocible. Se busca cualquier dirección en el
  // cuerpo, descartando SIEMPRE las internas (ver esEmailInterno). Antes no se filtraban
  // y un aviso reenviado colaba «hola@horizonteemirates.com» como si fuera el lead:
  // la ficha quedaba con nuestro correo y el acuse de recibo se lo mandábamos a nosotros
  // mismos, mientras el lead real no recibía nada (incidente YOANA SENA, 18-sep-2026).
  if (!lead.email) {
    const hay = (body + '\n' + subject).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    const filtered = hay.map(e => e.toLowerCase()).filter(e => !esEmailInterno(e));
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
  const msg = getAvisoWeb3Forms(th);
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
    const msg = getAvisoWeb3Forms(thread);
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
      cerrarHiloProcesado(thread, msg, { label: label });
      yaExistian++;
      return;
    }

    try {
      const leadId = saveLead(lead);
      scheduleSequence(leadId, lead.tier, new Date());
      processQueue({ immediateWelcomeAfterPoll: true });
      cerrarHiloProcesado(thread, msg, { label: label, destacar: true });
      Logger.log('✓ recuperado: ' + lead.nombre + ' [Tier ' + lead.tier + '|' + lead.puntuacion + 'pts] → ' + lead.email);
      guardados++;
    } catch(e) {
      Logger.log('✗ error guardando ' + lead.email + ': ' + e.toString());
    }
  });

  Logger.log('recuperarLeadsPerdidos RESUMEN → guardados=' + guardados +
    ' | ya existían=' + yaExistian + ' | saltados=' + saltados);
}

/**
 * REPARA las fichas que se guardaron con una dirección NUESTRA en vez de la del lead.
 *
 * Es el arreglo del incidente del 18-sep-2026 (lead YOANA SENA): el aviso del formulario
 * se reenvió a mano antes de que corriera el trigger, pollGmail leyó el reenvío en vez del
 * aviso original y, al no encontrar ningún campo, se quedó con el primer email del cuerpo
 * («hola@horizonteemirates.com», de la cabecera del reenvío). Resultado: ficha con nuestro
 * correo, sin nombre ni teléfono, y el acuse de recibo enviado a nosotros mismos.
 *
 * Qué hace con cada aviso de Web3Forms de los últimos N días:
 *   · lo vuelve a parsear con el parser ya corregido (email bueno, nombre, teléfono);
 *   · si ese email ya está en el CRM, no toca nada;
 *   · si no está, busca una ficha creada en la misma franja horaria (±60 min) cuyo email
 *     sea uno de los nuestros (esEmailInterno) y la reescribe entera, conservando su ID
 *     para no romper la Cola;
 *   · marca en la Cola el W0 que salió a la dirección equivocada y manda el acuse de
 *     verdad al lead, que hasta ahora no había recibido nada;
 *   · vuelve a avisar al asesor con la ficha ya correcta.
 *
 * Solo toca filas cuyo email es interno: una ficha legítima no puede verse afectada.
 * Uso desde el editor de Apps Script: repararLeadsConEmailInterno(7)
 *
 * @param {number} [dias=7] días hacia atrás de avisos a revisar.
 */
function repararLeadsConEmailInterno(dias) {
  const lookback = Math.max(1, parseInt(dias, 10) || 7);
  const VENTANA_MS = 60 * 60 * 1000;   // margen entre el aviso y la fila que creó
  const threads = GmailApp.search('from:web3forms.com newer_than:' + lookback + 'd', 0, 100);
  if (!threads.length) {
    Logger.log('repararLeadsConEmailInterno: sin avisos de Web3Forms en ' + lookback + ' días');
    return;
  }
  sortThreadsByLatestMessage(threads);

  const sh = getSheet('Leads');
  const data = sh.getDataRange().getValues();
  const filasUsadas = {};
  let reparados = 0, correctos = 0, sinFicha = 0, saltados = 0;

  threads.forEach(thread => {
    const msg = getAvisoWeb3Forms(thread);
    if (!msg) return;

    const subject = msg.getSubject();
    const body    = getMessageBodyForLeadParse(msg);
    if (!isHorizonteWeb3Lead(subject, body) || isGuiaDownload(subject)) { saltados++; return; }

    const lead = parseLeadFromEmail(body, subject);
    if (!lead || !lead.email) {
      Logger.log('repararLeadsConEmailInterno: sigue sin parsearse · ' + subject);
      saltados++;
      return;
    }
    if (esEmailInterno(lead.email)) {
      Logger.log('repararLeadsConEmailInterno: el aviso solo trae direcciones internas · ' + subject);
      saltados++;
      return;
    }
    if (leadExists(lead.email)) { correctos++; return; }

    // La ficha rota: creada casi a la vez que el aviso y con un email nuestro.
    const tAviso = msg.getDate().getTime();
    let fila = 0;
    for (let i = 1; i < data.length; i++) {
      if (filasUsadas[i]) continue;
      const emailFila = String(data[i][2] || '').trim().toLowerCase();
      if (!emailFila || !esEmailInterno(emailFila)) continue;
      const creada = data[i][14];
      if (!(creada instanceof Date)) continue;
      if (Math.abs(creada.getTime() - tAviso) > VENTANA_MS) continue;
      fila = i + 1;
      filasUsadas[i] = true;
      break;
    }

    if (!fila) {
      // No hay ficha rota que corregir: ese lead sencillamente no llegó al CRM.
      sinFicha++;
      Logger.log('repararLeadsConEmailInterno: ' + lead.email + ' no está en el CRM y no hay ' +
        'ficha con email interno de esa hora. Ejecute recuperarLeadsPerdidos(' + lookback + ').');
      return;
    }

    const emailViejo = String(data[fila - 1][2] || '');
    const id = String(data[fila - 1][0] || '').trim() || ('L' + new Date().getTime().toString().slice(-8));

    sh.getRange(fila, 1).setValue(id);
    sh.getRange(fila, 2).setValue(lead.nombre || '');
    sh.getRange(fila, 3).setValue(lead.email);
    sh.getRange(fila, 4).setNumberFormat('@');
    sh.getRange(fila, 4).setValue(normalizeTelefono(lead.telefono) || '');
    [[5, lead.pais], [6, lead.capital], [7, lead.objetivo], [8, lead.experiencia],
     [9, lead.plazo], [10, lead.viaje], [11, lead.puntuacion], [12, lead.tier],
     [13, lead.canal], [14, lead.origen],
     [18, lead.utm_source], [19, lead.utm_medium], [20, lead.utm_campaign],
     [21, lead.utm_content], [22, lead.utm_term], [23, lead.gclid],
     [24, lead.gbraid], [25, lead.wbraid],
     [26, lead.cons_privacidad], [27, lead.cons_marketing], [28, lead.cons_version],
     [29, lead.cons_fecha], [30, lead.cons_texto]].forEach(par => {
      if (par[1] !== undefined && par[1] !== '') sh.getRange(fila, par[0]).setValue(par[1]);
    });
    const notaPrevia = String(data[fila - 1][16] || '').trim();
    sh.getRange(fila, 17).setValue((notaPrevia ? notaPrevia + '\n' : '') +
      'Ficha corregida el ' + new Date().toLocaleString('es-ES') + ': se había guardado con ' +
      emailViejo + ' (aviso reenviado antes de procesarlo). Datos releídos del aviso original.');

    // El W0 que salió a la dirección equivocada queda marcado, y el bueno sale ahora.
    try {
      const qSh = getSheet('Cola');
      const q = qSh.getDataRange().getValues();
      for (let i = 1; i < q.length; i++) {
        if (String(q[i][0]) === String(id) && String(q[i][1]) === 'W0' && String(q[i][3]) === 'enviado') {
          qSh.getRange(i + 1, 4).setValue('enviado-a-email-erroneo');
          qSh.getRange(i + 1, 6).setValue('Salió a ' + emailViejo + ' por el fallo del reenvío; reenviado al lead al reparar la ficha.');
          break;
        }
      }
    } catch (e) {
      Logger.log('repararLeadsConEmailInterno: no se pudo anotar la Cola de ' + id + ': ' + e.message);
    }

    try {
      sendWelcomeEmail(id, lead, { forzar: true });
    } catch (wErr) {
      Logger.log('repararLeadsConEmailInterno: fallo al enviar el W0 a ' + lead.email + ': ' + wErr.toString());
    }
    try {
      notifyAgentNewLead(id, Object.assign({}, lead, { id: id }));
    } catch (nErr) {
      Logger.log('repararLeadsConEmailInterno: fallo al avisar al asesor de ' + id + ': ' + nErr.toString());
    }

    reparados++;
    Logger.log('✓ ficha reparada ' + id + ': ' + emailViejo + ' → ' + lead.email + ' (' + lead.nombre + ')');
  });

  Logger.log('repararLeadsConEmailInterno RESUMEN → reparados=' + reparados +
    ' | ya correctos=' + correctos + ' | sin ficha que reparar=' + sinFicha +
    ' | saltados=' + saltados);
}

/**
 * A-209: backfill de descargas de la guía fiscal que pollGmail() venía descartando
 * como «saltados» antes de existir la rama isGuiaDownload. Ejecutar UNA vez a mano
 * desde el editor de Apps Script con un lookback que cubra el 12-ago-2026 (fecha del
 * cambio a formulario de 1 campo con entrega inmediata).
 * Ej.: recuperarDescargasPerdidas(30)
 */
function recuperarDescargasPerdidas(days) {
  const lookback = Math.max(1, parseInt(days, 10) || 30);
  const threads = GmailApp.search('from:web3forms.com newer_than:' + lookback + 'd', 0, 100);
  sortThreadsByLatestMessage(threads);

  const label = ensureGmailLabel(CONFIG.LABEL_PROCESADO);
  let guardadas = 0, yaExistian = 0, saltados = 0;

  threads.forEach(thread => {
    const msg = getAvisoWeb3Forms(thread);
    if (!msg) return;

    const subject = msg.getSubject();
    if (!isGuiaDownload(subject)) { saltados++; return; }

    const body    = getMessageBodyForLeadParse(msg);
    const descarga = parseLeadFromEmail(body, subject);
    if (!descarga || !descarga.email) {
      Logger.log('recuperarDescargasPerdidas: no parseable · ' + subject);
      saltados++;
      return;
    }

    if (descargaExists(descarga.email)) {
      cerrarHiloProcesado(thread, msg, { label: label });
      yaExistian++;
      return;
    }

    saveDescarga(descarga);
    cerrarHiloProcesado(thread, msg, { label: label, destacar: true });
    guardadas++;
    Logger.log('✓ descarga recuperada: ' + descarga.email);
  });

  Logger.log('recuperarDescargasPerdidas RESUMEN → guardadas=' + guardadas +
    ' | ya existían=' + yaExistian + ' | saltados=' + saltados);
  // Esta función solo recupera el registro. El acuse con la guía (W0D) de las descargas
  // recuperadas lo envía enviarBienvenidasDescargasPendientes(), que aplica su propia
  // ventana de días para no escribir a quien descargó hace semanas.
  if (guardadas > 0) {
    Logger.log('recuperarDescargasPerdidas: ejecutar enviarBienvenidasDescargasPendientes() ' +
      'para enviar la guía a las descargas recién recuperadas.');
  }
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

/**
 * A-209 (parte 2/3): hoja «Descargas», independiente de «Leads». leadExists() no la
 * consulta, así que un email que ya descargó la guía puede completar después el
 * formulario largo sin quedar bloqueado por duplicado.
 * No asume que initSheets() ya se ejecutó: si la pestaña no existe todavía, la crea
 * aquí mismo (mismo formato que initSheets, para no depender del orden de ejecución).
 */
// A-209: cabeceras de la hoja Descargas en un solo sitio (las usan getOrCreateDescargasSheet
// y ensureDescargasBienvenidaColumn). «Bienvenida» es la última y guarda la fecha del W0D.
const DESCARGAS_COL_BIENVENIDA = 'Bienvenida';
// Ventana de recuperación del acuse W0D: días hacia atrás en los que todavía tiene sentido
// escribir a una descarga que se quedó sin correo. Más allá, ni se envía ni se alerta:
// un acuse que llega semanas después confunde más de lo que aporta.
const DESCARGAS_ACUSE_DIAS = 30;
const DESCARGAS_HEADERS = ['Email','Fecha','Origen','Estado nurturing','Nota',
                           'UTM Source','UTM Medium','UTM Campaign','Consent marketing',
                           DESCARGAS_COL_BIENVENIDA];

function getOrCreateDescargasSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sh = ss.getSheetByName('Descargas');
  if (!sh) {
    sh = ss.insertSheet('Descargas');
    sh.appendRow(DESCARGAS_HEADERS.slice());
    sh.setFrozenRows(1);
    sh.getRange('1:1').setFontWeight('bold').setBackground('#0D1B2A').setFontColor('#ffffff');
  }
  return sh;
}

/**
 * Índice (1-based) de la columna «Bienvenida», creándola si la hoja es anterior al
 * acuse de recibo automático de descargas. Ahí se sella la fecha de envío del W0D:
 * es la prueba de que a ese email se le escribió, y lo que hace idempotente el envío.
 * Idempotente: si la columna ya existe, no toca nada.
 */
function ensureDescargasBienvenidaColumn(sheet) {
  const sh = sheet || getOrCreateDescargasSheet();
  const lastCol = Math.max(1, sh.getLastColumn());
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  const idx = headers.indexOf(DESCARGAS_COL_BIENVENIDA);
  if (idx !== -1) return idx + 1;

  const col = lastCol + 1;
  sh.getRange(1, col).setValue(DESCARGAS_COL_BIENVENIDA)
    .setFontWeight('bold').setBackground('#0D1B2A').setFontColor('#ffffff');
  sh.setColumnWidth(col, 150);
  Logger.log('ensureDescargasBienvenidaColumn: columna «' + DESCARGAS_COL_BIENVENIDA + '» añadida en la posición ' + col);
  return col;
}

/** Fila (1-based) de un email en la hoja Descargas, o 0 si no está. */
function findDescargaRow(sheet, email) {
  const target = String(email || '').trim().toLowerCase();
  if (!target) return 0;
  const data = (sheet || getOrCreateDescargasSheet()).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === target) return i + 1;
  }
  return 0;
}

function descargaExists(email) {
  const data = getOrCreateDescargasSheet().getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if ((data[i][0] || '').toString().toLowerCase() === String(email || '').toLowerCase()) return true;
  }
  return false;
}

/**
 * Sube una descarga de la guía a la hoja Leads, para que exista en el CRM y se pueda
 * marcar para remarketing como cualquier otro contacto. Antes vivía solo en «Descargas»
 * y quedaba fuera de todo: ni aparecía en la lista de leads ni había forma de incluirla
 * en una secuencia, aunque hubiera entrado por un clic de pago.
 *
 * Solo rellena lo que se sabe (email, consentimientos, UTMs): un contacto de la guía no
 * ha dado nombre ni teléfono, y los correos están escritos para funcionar sin ellos.
 * Si ese email ya está en Leads no hace nada, salvo asignarle un ID si le faltaba
 * (las filas añadidas a mano suelen quedarse sin él, y sin ID no se puede programar nada).
 *
 * @return {string} ID del lead, nuevo o existente, o '' si no se pudo.
 */
function promoverDescargaALead(d) {
  const email = String((d && d.email) || '').trim();
  if (!email) return '';

  const sh = getSheet('Leads');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2] || '').trim().toLowerCase() !== email.toLowerCase()) continue;

    // Fila que ya existe. Puede ser una ficha normal o una añadida a mano, a la que
    // suelen faltarle el ID y las columnas de control. Se rellena SOLO lo que esté
    // vacío: nunca se pisa nada escrito, que puede ser una corrección deliberada.
    const fila = i + 1;
    const completar = [];
    let id = String(data[i][0] || '').trim();
    if (!id) {
      id = 'L' + new Date().getTime().toString().slice(-8);
      sh.getRange(fila, 1).setValue(id);
      completar.push('ID ' + id);
    }
    if (!String(data[i][11] || '').trim()) { sh.getRange(fila, 12).setValue('C'); completar.push('tier C'); }
    if (!String(data[i][13] || '').trim()) { sh.getRange(fila, 14).setValue('Descarga guía fiscal'); completar.push('origen'); }
    if (!String(data[i][14] || '').trim()) { sh.getRange(fila, 15).setValue(new Date()); completar.push('fecha'); }
    if (!String(data[i][15] || '').trim()) { sh.getRange(fila, 16).setValue('activo'); completar.push('estado activo'); }
    [[26, d.cons_privacidad], [27, d.cons_marketing], [28, d.cons_version],
     [29, d.cons_fecha], [30, d.cons_texto]].forEach(par => {
      if (par[1] && !String(data[i][par[0] - 1] || '').trim()) sh.getRange(fila, par[0]).setValue(par[1]);
    });

    if (completar.length) {
      Logger.log('promoverDescargaALead: ficha de ' + email + ' completada (' + completar.join(', ') + ').');
    }
    return id;
  }

  const id = saveLead({
    nombre: '',
    email: email,
    tier: 'C',
    canal: 'email',
    origen: 'Descarga guía fiscal',
    utm_source: d.utm_source, utm_medium: d.utm_medium, utm_campaign: d.utm_campaign,
    utm_content: d.utm_content, utm_term: d.utm_term,
    gclid: d.gclid, gbraid: d.gbraid, wbraid: d.wbraid,
    cons_privacidad: d.cons_privacidad, cons_marketing: d.cons_marketing,
    cons_version: d.cons_version, cons_fecha: d.cons_fecha, cons_texto: d.cons_texto,
  });
  Logger.log('✓ descarga incorporada al CRM: ' + email + ' → ' + id);
  return id;
}

/**
 * Sube al CRM las descargas que se quedaron fuera (las anteriores a esta versión).
 * Ejecutar a mano una vez. Es idempotente: las que ya estén en Leads no se duplican.
 */
function promoverDescargasALeads() {
  const data = getOrCreateDescargasSheet().getDataRange().getValues();
  let nuevas = 0, yaEstaban = 0;
  for (let i = 1; i < data.length; i++) {
    const email = String(data[i][0] || '').trim();
    if (!email) continue;
    const existia = leadExists(email);
    promoverDescargaALead({ email: email, cons_marketing: data[i][8], cons_privacidad: 'SI',
                            utm_source: data[i][5], utm_medium: data[i][6], utm_campaign: data[i][7] });
    if (existia) yaEstaban++; else nuevas++;
  }
  Logger.log('promoverDescargasALeads → incorporadas=' + nuevas + ' · ya estaban=' + yaEstaban);
}

/**
 * Completa con los datos del formulario largo una ficha que entró por la descarga de la
 * guía (solo email). Sin esto, pollGmail veía el email repetido y descartaba el lead
 * bueno: se perdía justo al más cualificado, el que primero se informa y luego se decide.
 * No toca fichas que ya tengan teléfono: eso es un envío duplicado de verdad.
 * @return {string} ID del lead actualizado, o '' si no procedía.
 */
function completarLeadDesdeFormulario(lead) {
  const email = String((lead && lead.email) || '').trim().toLowerCase();
  if (!email) return '';
  const sh = getSheet('Leads');
  const data = sh.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2] || '').trim().toLowerCase() !== email) continue;

    const tieneTelefono = String(data[i][3] || '').trim() !== '';
    const origen = String(data[i][13] || '');
    if (tieneTelefono || !/descarga/i.test(origen)) return '';   // duplicado real

    const id = String(data[i][0] || '').trim() || ('L' + new Date().getTime().toString().slice(-8));
    const fila = i + 1;
    sh.getRange(fila, 1).setValue(id);
    sh.getRange(fila, 2).setValue(lead.nombre || '');
    sh.getRange(fila, 4).setNumberFormat('@');
    sh.getRange(fila, 4).setValue(normalizeTelefono(lead.telefono) || '');
    [[5, lead.pais], [6, lead.capital], [7, lead.objetivo], [8, lead.experiencia],
     [9, lead.plazo], [10, lead.viaje], [11, lead.puntuacion], [12, lead.tier],
     [13, lead.canal]].forEach(par => { if (par[1]) sh.getRange(fila, par[0]).setValue(par[1]); });
    sh.getRange(fila, 14).setValue('Formulario web (antes descargó la guía)');
    const notaPrevia = String(data[i][16] || '').trim();
    sh.getRange(fila, 17).setValue((notaPrevia ? notaPrevia + '\n' : '') +
      'Ficha completada con el formulario largo el ' + new Date().toLocaleString('es-ES') + '.');
    // La prueba del consentimiento se actualiza: el formulario largo trae la versión buena.
    [[26, lead.cons_privacidad], [27, lead.cons_marketing], [28, lead.cons_version],
     [29, lead.cons_fecha], [30, lead.cons_texto]].forEach(par => {
      if (par[1]) sh.getRange(fila, par[0]).setValue(par[1]);
    });
    Logger.log('✓ ficha de descarga completada con el formulario largo: ' + email + ' → ' + id);
    return id;
  }
  return '';
}

function saveDescarga(d) {
  getOrCreateDescargasSheet().appendRow([
    d.email,
    new Date(),
    'Guía fiscal (home)',
    'pendiente-email-1',
    '',
    d.utm_source   || '',
    d.utm_medium   || '',
    d.utm_campaign || '',
    d.cons_marketing || '',
  ]);
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
  // A-209 (parte 3/3): contexto no bloqueante para el guion de venta. No afecta a
  // leadExists() (que solo mira «Leads»), así que no reintroduce el bloqueo de duplicados
  // que motivó excluir las descargas del pipeline principal.
  const notaDescarga = descargaExists(data.email) ? 'Ya descargó la guía fiscal antes de este formulario.' : '';
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
    notaDescarga,
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

/**
 * Secuencias de remarketing para leads que en su día no contestaron. Dos vías, y la
 * diferencia no es de tono sino de base legal:
 *
 *   consentido   → el lead marcó «Consent marketing: SI». Se le puede mandar contenido
 *                  comercial periódico: mercado, proyectos, la visita a Emiratos.
 *   sinConsentir → no lo marcó. Solo caben dos toques que retoman LA SOLICITUD QUE ÉL
 *                  HIZO y que se quedó sin respuesta (interés legítimo, art. 6.1.f
 *                  RGPD, el mismo encaje que ya se documenta para D1-D3): sin ofertas
 *                  de proyectos, sin contenido comercial, y con final explícito.
 *
 * Los retardos van en horas, como SEQUENCES.
 */
const SEQUENCES_REMARKETING = {
  consentido: [
    { code: 'R1', delay: 0    },   // al marcarlo
    { code: 'R2', delay: 168  },   // 7 días
    { code: 'R3', delay: 504  },   // 21 días
    { code: 'R4', delay: 1080 },   // 45 días
    { code: 'R5', delay: 1800 },   // 75 días
    { code: 'R6', delay: 2640 },   // 110 días
    { code: 'R7', delay: 3600 },   // 150 días
    { code: 'R8', delay: 4800 },   // 200 días · pregunta si seguimos
  ],
  // Sin consentimiento de marketing NO se alarga. Estos dos no son publicidad: son la
  // continuación de la solicitud que esa persona hizo, y eso se agota en dos toques.
  // Para escribirle más, lo que hace falta es su consentimiento, no más correos.
  sinConsentir: [
    { code: 'RE1', delay: 0   },
    { code: 'RE2', delay: 240 },   // 10 días
  ],
};

/** Toque recurrente indefinido, una vez agotada la escalera. 90 días entre correos. */
const REMARKETING_RECURRENTE = { code: 'R9', delayDias: 90 };

/** true si el código pertenece a una secuencia de remarketing (R1-R4 o RE1-RE2). */
function esCodigoRemarketing(code) {
  return /^RE?\d+$/.test(String(code || '').trim());
}

/** Índice (1-based) de una columna por su cabecera, o 0 si no está. */
function indiceColumnaPorCabecera(cabeceras, nombre) {
  const objetivo = String(nombre || '').trim().toLowerCase();
  for (let i = 0; i < cabeceras.length; i++) {
    if (String(cabeceras[i] || '').trim().toLowerCase() === objetivo) return i + 1;
  }
  return 0;
}

/**
 * ¿Está marcada la casilla de remarketing? Acepta la casilla de verificación (true) y
 * también texto escrito a mano («SI», «Sí», «X»), porque la hoja se toca desde el móvil
 * y no siempre es cómodo pulsar la casilla exacta.
 */
function marcaRemarketingActiva(valor) {
  if (valor === true) return true;
  const v = String(valor || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return v === 'si' || v === 'x' || v === 'true';
}

/**
 * Columna «Remarketing» de la hoja Leads, creándola con casillas si no existe.
 * Se busca por cabecera y no por posición fija a propósito: la hoja lleva columnas
 * añadidas a mano después del esquema original, y una posición fija acabaría
 * escribiendo encima de una de ellas.
 */
function ensureRemarketingColumn(sheet) {
  const sh = sheet || getSheet('Leads');
  const lastCol = Math.max(1, sh.getLastColumn());
  const cabeceras = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const existente = indiceColumnaPorCabecera(cabeceras, CONFIG.REMARKETING_COL);
  if (existente) return existente;

  const col = lastCol + 1;
  sh.getRange(1, col).setValue(CONFIG.REMARKETING_COL)
    .setFontWeight('bold').setBackground('#0D1B2A').setFontColor('#ffffff')
    .setNote('Marque aquí a los leads que no contestaron y quiere reenganchar.\n' +
             'Al marcar: se programa la secuencia con programarRemarketing().\n' +
             'Al desmarcar: la secuencia se para, aunque queden correos en cola.');
  sh.setColumnWidth(col, 110);

  const filas = sh.getLastRow() - 1;
  if (filas > 0) sh.getRange(2, col, filas, 1).insertCheckboxes();
  Logger.log('ensureRemarketingColumn: columna «' + CONFIG.REMARKETING_COL + '» creada en la posición ' + col);
  return col;
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
/**
 * Programa la secuencia de remarketing de los leads que USTED haya marcado en la
 * columna «Remarketing» de la hoja Leads. No decide nada por su cuenta: sin marca,
 * no hay correos.
 *
 * Qué hace con cada lead marcado:
 *   · estado «baja» o «cerrado» → lo salta (una baja no se reengancha nunca).
 *   · «Consent marketing: SI»   → secuencia completa R1-R4 (mercado, proyectos, visita).
 *   · sin ese consentimiento    → solo RE1-RE2, que retoman su propia solicitud sin
 *                                 contenido comercial. Ver SEQUENCES_REMARKETING.
 *   · ya tenía correos de remarketing en la cola → lo salta, no duplica.
 *
 * Por defecto SIMULA: escribe en el registro qué haría y no toca la cola. Para
 * programarlo de verdad, ejecutar programarRemarketingDeVerdad().
 *
 * @param {boolean} [simular=true] false para escribir realmente en la hoja Cola.
 */
function programarRemarketing(simular) {
  const enSerio = simular === false;
  const lSh = getSheet('Leads');
  const qSh = getSheet('Cola');
  const colMarca = ensureRemarketingColumn(lSh);
  const lData = lSh.getDataRange().getValues();
  const qData = qSh.getDataRange().getValues();

  // Leads que ya tienen remarketing en cola: no se les vuelve a sembrar.
  const yaEnCola = {};
  for (let i = 1; i < qData.length; i++) {
    if (esCodigoRemarketing(qData[i][1])) yaEnCola[qData[i][0]] = true;
  }

  const ahora = new Date();
  const plan = [];
  let saltadosSinMarca = 0, saltadosBaja = 0, saltadosYaProgramados = 0;

  for (let i = 1; i < lData.length; i++) {
    const fila = lData[i];
    const leadId = String(fila[0] || '').trim();
    const email  = String(fila[2] || '').trim();
    if (!leadId || !email) continue;

    if (!marcaRemarketingActiva(fila[colMarca - 1])) { saltadosSinMarca++; continue; }

    const estado = String(fila[15] || '').trim().toLowerCase();
    if (estado === 'baja' || estado === 'cerrado') {
      saltadosBaja++;
      Logger.log('· ' + leadId + ' (' + email + '): marcado, pero está en «' + estado + '». No se reengancha.');
      continue;
    }
    if (yaEnCola[leadId]) {
      saltadosYaProgramados++;
      Logger.log('· ' + leadId + ' (' + email + '): ya tiene remarketing en la cola. Sin cambios.');
      continue;
    }

    // Columna 27 = «Consent marketing». Se accede por posición y no por cabecera
    // porque en la hoja viva esas cabeceras están en blanco (ver migrarColumnasConsentimiento).
    const consentido = String(fila[26] || '').trim().toUpperCase() === 'SI';
    const via = (CONFIG.REMARKETING_MISMO_TRATO === true || consentido) ? 'consentido' : 'sinConsentir';
    const secuencia = SEQUENCES_REMARKETING[via];

    secuencia.forEach(item => {
      const cuando = new Date(ahora.getTime() + item.delay * 3600 * 1000);
      plan.push({ leadId: leadId, email: email, code: item.code, cuando: cuando, via: via });
    });
  }

  Logger.log('=== programarRemarketing ' + (enSerio ? '(REAL)' : '(SIMULACIÓN, no se escribe nada)') + ' ===');
  plan.forEach(p => {
    Logger.log('  ' + p.code + '  ' + Utilities.formatDate(p.cuando, CONFIG.BUSINESS_TIMEZONE || Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') +
      '  ' + p.email + '  [' + p.via + ']');
    if (enSerio) qSh.appendRow([p.leadId, p.code, p.cuando, 'pendiente', '', '']);
  });

  const leadsPlanificados = {};
  plan.forEach(p => { leadsPlanificados[p.leadId] = true; });
  Logger.log('RESUMEN → leads a reenganchar=' + Object.keys(leadsPlanificados).length +
    ' · correos programados=' + plan.length +
    ' | sin marca=' + saltadosSinMarca +
    ' · baja/cerrado=' + saltadosBaja +
    ' · ya programados=' + saltadosYaProgramados);

  if (!enSerio) {
    Logger.log('Esto era una simulación. Para programarlo de verdad: programarRemarketingDeVerdad()');
  } else if (CONFIG.AUTO_SEND_NURTURE !== true) {
    Logger.log('AVISO: CONFIG.AUTO_SEND_NURTURE está en false, así que processQueue no enviará ' +
      'estos correos. Ponlo en true para que salgan.');
  }
}

/**
 * Mantiene vivo el remarketing de quien sigue marcado: cuando a un lead se le acaban los
 * toques programados, le siembra el siguiente recurrente (R9, cada 90 días). Así la
 * cadencia no depende de acordarse de volver a ejecutar nada; depende solo de la casilla.
 * La llama processQueue() en cada pasada.
 *
 * No renueva nunca la vía sin consentimiento (RE1-RE2): esos dos toques se agotan y ahí
 * termina. Tampoco renueva a quien esté en baja o cerrado.
 * @return {number} correos sembrados en esta pasada.
 */
function renovarRemarketingAgotados() {
  const lSh = getSheet('Leads');
  const qSh = getSheet('Cola');
  const lData = lSh.getDataRange().getValues();
  const colMarca = indiceColumnaPorCabecera(lData[0] || [], CONFIG.REMARKETING_COL);
  if (!colMarca) return 0;   // aún no se ha creado la columna: no hay nada que renovar

  const qData = qSh.getDataRange().getValues();
  const estadoCola = {};   // leadId → {pendientes, enviados, ultimoEnvio}
  for (let i = 1; i < qData.length; i++) {
    const code = qData[i][1];
    if (!esCodigoRemarketing(code)) continue;
    const id = qData[i][0];
    const e = estadoCola[id] || (estadoCola[id] = { pendientes: 0, enviados: 0, ultimo: 0 });
    const estado = String(qData[i][3] || '');
    if (estado === 'pendiente') e.pendientes++;
    if (estado === 'enviado') {
      e.enviados++;
      const f = new Date(qData[i][4] || qData[i][2]);
      if (!isNaN(f)) e.ultimo = Math.max(e.ultimo, f.getTime());
    }
  }

  const ahora = Date.now();
  let sembrados = 0;
  for (let i = 1; i < lData.length; i++) {
    const fila = lData[i];
    const leadId = String(fila[0] || '').trim();
    if (!leadId) continue;
    if (!marcaRemarketingActiva(fila[colMarca - 1])) continue;

    const estado = String(fila[15] || '').trim().toLowerCase();
    if (estado === 'baja' || estado === 'cerrado') continue;
    // Con REMARKETING_MISMO_TRATO todos siguen la vía larga, así que todos se renuevan.
    if (CONFIG.REMARKETING_MISMO_TRATO !== true &&
        String(fila[26] || '').trim().toUpperCase() !== 'SI') continue;  // vía RE: no se renueva

    const e = estadoCola[leadId];
    if (!e || e.enviados === 0 || e.pendientes > 0) continue;

    // Desde el último envío, nunca hacia atrás: si la escalera terminó hace meses,
    // el siguiente toque sale ya, no con fecha vencida.
    const cuando = new Date(Math.max(ahora, e.ultimo + REMARKETING_RECURRENTE.delayDias * 24 * 3600 * 1000));
    qSh.appendRow([leadId, REMARKETING_RECURRENTE.code, cuando, 'pendiente', '', '']);
    sembrados++;
    Logger.log('renovarRemarketingAgotados: ' + leadId + ' → ' + REMARKETING_RECURRENTE.code +
      ' el ' + Utilities.formatDate(cuando, CONFIG.BUSINESS_TIMEZONE || Session.getScriptTimeZone(), 'dd/MM/yyyy'));
  }
  return sembrados;
}

/**
 * Inverso de activarNurtureAutomatico(): devuelve a «pausado-manual» los toques por tier
 * que estén pendientes, sin tocar el remarketing. Es lo que hay que ejecutar al volver al
 * orden previsto del embudo (W0 automático → todo pausado → trabajo manual → marca).
 */
function pausarNurtureAutomatico() {
  const qSh = getSheet('Cola');
  const qData = qSh.getDataRange().getValues();
  let pausados = 0;
  for (let i = 1; i < qData.length; i++) {
    if (String(qData[i][3] || '') !== 'pendiente') continue;
    if (esCodigoRemarketing(qData[i][1])) continue;   // el remarketing no se toca
    qSh.getRange(i + 1, 4).setValue('pausado-manual');
    pausados++;
  }
  Logger.log('pausarNurtureAutomatico: toques por tier devueltos a pausado-manual = ' + pausados +
    '. El remarketing (R/RE) sigue igual.');
}

/** Ejecuta programarRemarketing() escribiendo de verdad en la cola (sin parámetros, para el desplegable). */
function programarRemarketingDeVerdad() {
  programarRemarketing(false);
}

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

/**
 * Activa SOLO la capa de nurturing automático (CONFIG.AUTO_SEND_NURTURE), sin tocar
 * el kit manual M1-M11 ni reactivar A1/B1/C1 (el primer contacto sigue siendo manual).
 * Pasos: 1) poner CONFIG.AUTO_SEND_NURTURE = true en CONFIG  2) ejecutar esta función
 * una sola vez. Para volver a pausar: CONFIG.AUTO_SEND_NURTURE = false (processQueue
 * deja de enviar nada de esta capa al instante, aunque queden ítems en «pendiente»).
 *
 * Qué hace, ítem por ítem de la hoja Cola:
 *   - Si es A1/B1/C1 (primer contacto): se ignora siempre. Sigue en «pausado-manual».
 *   - Si el lead no tiene «Consent marketing: SI»: se ignora (RGPD, MAILS-MANUALES §1).
 *     Sigue en «pausado-manual», visible para retomarlo a mano si hace falta.
 *   - Si ya venció su fecha (el lead lleva tiempo sembrado en la cola, antes de activar
 *     esto): se cancela en vez de mandarlo de golpe, mismo criterio que
 *     reanudarEnvioAutomatico().
 *   - Si no: pasa a «pendiente» y processQueue() lo envía en su próxima pasada horaria.
 */
function activarNurtureAutomatico() {
  if (CONFIG.AUTO_SEND_NURTURE !== true) {
    Logger.log('activarNurtureAutomatico: CONFIG.AUTO_SEND_NURTURE sigue en false. Cámbialo a true y vuelve a ejecutar.');
    return;
  }
  const qSh = getSheet('Cola');
  const lSh = getSheet('Leads');
  const qData = qSh.getDataRange().getValues();
  const lData = lSh.getDataRange().getValues();

  // Columna 27 (índice 26) = «Consent marketing», ver initSheets().
  const consentByLead = {};
  for (let i = 1; i < lData.length; i++) consentByLead[lData[i][0]] = lData[i][26];

  const now = new Date();
  let reactivados = 0, sinConsentimiento = 0, cancelados = 0;
  for (let i = 1; i < qData.length; i++) {
    const [leadId, emailCode, scheduledAt, status] = qData[i];
    if (status !== 'pausado-manual') continue;
    if (isWelcomeSequenceEmail(emailCode)) continue; // A1/B1/C1: nunca por esta capa

    if (consentByLead[leadId] !== 'SI') { sinConsentimiento++; continue; }

    const when = new Date(scheduledAt);
    if (!isNaN(when) && when > now) {
      qSh.getRange(i + 1, 4).setValue('pendiente');
      reactivados++;
    } else {
      qSh.getRange(i + 1, 4).setValue('cancelado (nurture, vencido)');
      cancelados++;
    }
  }
  Logger.log('activarNurtureAutomatico: reactivados=' + reactivados +
    ' · sin consentimiento (siguen pausados)=' + sinConsentimiento +
    ' · cancelados por vencidos=' + cancelados);
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
/**
 * @param {string} leadId ID de la ficha en la hoja Leads.
 * @param {Object} lead datos del lead (al menos {email}).
 * @param {Object} [opts]
 * @param {boolean} [opts.forzar] true para saltarse la idempotencia. Solo lo usa
 *        repararLeadsConEmailInterno: allí el W0 que consta en la Cola se envió a una
 *        dirección equivocada, así que el lead real sigue sin haber recibido nada.
 */
function sendWelcomeEmail(leadId, lead, opts) {
  opts = opts || {};
  if (CONFIG.AUTO_SEND_WELCOME === false) {
    Logger.log('sendWelcomeEmail: desactivado (AUTO_SEND_WELCOME=false)');
    return false;
  }
  if (!lead || !lead.email) return false;

  // Idempotencia: si ya consta un W0 enviado para este lead, no se repite.
  if (!opts.forzar) {
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

/**
 * Acuse de recibo de una descarga de la guía fiscal (W0D). Se envía en la misma pasada
 * que detecta la descarga, sin esperar ventana laboral: quien acaba de pedir la guía en
 * la web está delante del ordenador, y la propia web le acaba de prometer que se la
 * enviamos por email.
 *
 * Por qué existe: el formulario de la home pide un solo campo. Si a ese email no se le
 * escribe, no queda ninguna otra vía de contacto (no hay nombre ni teléfono) y el
 * contacto se pierde entero. No sustituye a D1-D3, que se siguen escribiendo a mano.
 *
 * Idempotencia: la columna «Bienvenida» de la hoja Descargas guarda la fecha de envío.
 * Con valor, no se repite. Un fallo aquí nunca debe impedir el registro de la descarga
 * ni el aviso al asesor (quien llama envuelve en try/catch).
 *
 * @param {Object} d descarga con al menos {email}.
 * @return {boolean} true solo si el correo ha salido en esta llamada.
 */
function sendWelcomeDescarga(d) {
  if (CONFIG.AUTO_SEND_WELCOME_DESCARGA === false) {
    Logger.log('sendWelcomeDescarga: desactivado (AUTO_SEND_WELCOME_DESCARGA=false)');
    return false;
  }
  if (!d || !d.email) return false;

  const sh  = getOrCreateDescargasSheet();
  const col = ensureDescargasBienvenidaColumn(sh);
  const row = findDescargaRow(sh, d.email);

  if (row && String(sh.getRange(row, col).getValue() || '').trim() !== '') {
    Logger.log('sendWelcomeDescarga: ya enviado antes a ' + d.email + ', omitido');
    return false;
  }

  if (CONFIG.TEST_MODE) {
    Logger.log('[TEST] W0D → ' + d.email);
    return false;
  }

  sendEmail('W0D', { email: d.email }, { welcomeDescarga: true, bypassBusinessHours: true });

  if (row) {
    sh.getRange(row, col).setValue(new Date());
  } else {
    // No debería ocurrir (saveDescarga escribe la fila antes), pero el correo ya ha salido:
    // dejarlo sin registrar sería peor que registrarlo sin fila propia.
    Logger.log('sendWelcomeDescarga: enviado a ' + d.email + ' pero no se encontró su fila en Descargas');
  }
  Logger.log('✓ W0D (guía + acuse de recibo) → ' + d.email);
  return true;
}

/**
 * Envía el W0D a las descargas ya registradas que se quedaron sin correo: las anteriores
 * a esta automatización y cualquiera que fallase en su momento. Ejecutar a mano desde
 * Apps Script.
 * OJO: escribe a TODAS las filas sin sello dentro de la ventana, incluidas las que se
 * atendieron a mano (no hay forma de distinguirlas mirando la hoja). Si alguna ya está
 * resuelta, séllala antes con marcarDescargasSinAcuse() y esta función la saltará.
 * @param {number} [dias] ventana hacia atrás (por defecto DESCARGAS_ACUSE_DIAS). Más allá
 *   no se escribe: un acuse que llega semanas después de la descarga confunde más que aporta.
 */
function enviarBienvenidasDescargasPendientes(dias) {
  const lookback = Math.max(1, parseInt(dias, 10) || DESCARGAS_ACUSE_DIAS);
  const desde = new Date(Date.now() - lookback * 24 * 3600 * 1000);
  const sh   = getOrCreateDescargasSheet();
  const col  = ensureDescargasBienvenidaColumn(sh);
  const data = sh.getDataRange().getValues();

  let enviados = 0, yaTenian = 0, fueraDeVentana = 0, errores = 0;

  for (let i = 1; i < data.length; i++) {
    const email = String(data[i][0] || '').trim();
    if (!email) continue;
    if (String(data[i][col - 1] || '').trim() !== '') { yaTenian++; continue; }

    const fecha = new Date(data[i][1]);
    if (!isNaN(fecha) && fecha < desde) { fueraDeVentana++; continue; }

    try {
      if (sendWelcomeDescarga({ email: email })) enviados++;
    } catch (e) {
      errores++;
      Logger.log('enviarBienvenidasDescargasPendientes: ERROR con ' + email + ': ' + e.toString());
    }
  }

  Logger.log('enviarBienvenidasDescargasPendientes RESUMEN (últimos ' + lookback + ' días) → enviados=' +
    enviados + ' | ya tenían=' + yaTenian + ' | fuera de ventana=' + fueraDeVentana + ' | errores=' + errores);
}

/**
 * Sella la columna «Bienvenida» de las descargas que no tienen acuse, SIN ENVIAR NADA.
 * Para las que ya se atendieron por otra vía (un correo escrito a mano) o son anteriores
 * al W0D y no se les va a escribir: deja constancia de que están cerradas y, sobre todo,
 * impide que enviarBienvenidasDescargasPendientes() les escriba más adelante, que es
 * como alguien acabaría recibiendo la guía dos veces.
 * Ejecutar a mano desde Apps Script. Es idempotente: solo toca filas sin sello.
 * OJO: sella TODAS las filas sin acuse en ese momento, así que una descarga recién
 * llegada que todavía espera su W0D también quedaría cerrada en falso. Ejecutarla
 * cuando no haya descargas de las últimas horas pendientes (el registro dice a cuáles
 * ha afectado, y el healthcheck deja de vigilar las que se sellan).
 * @param {string} [nota] texto a escribir en la columna. Por defecto, el motivo genérico.
 */
function marcarDescargasSinAcuse(nota) {
  const texto = String(nota || '').trim() || 'Sin acuse automático (atendida a mano o anterior al W0D)';
  const sh   = getOrCreateDescargasSheet();
  const col  = ensureDescargasBienvenidaColumn(sh);
  const data = sh.getDataRange().getValues();
  const emails = [];

  for (let i = 1; i < data.length; i++) {
    const email = String(data[i][0] || '').trim();
    if (!email) continue;
    if (String(data[i][col - 1] || '').trim() !== '') continue;
    sh.getRange(i + 1, col).setValue(texto);
    emails.push(email);
  }

  Logger.log('marcarDescargasSinAcuse → filas marcadas=' + emails.length +
    (emails.length ? ' · ' + emails.join(', ') : ''));
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
  // Dos interruptores independientes: AUTO_SEND_LEADS (kit completo, A1 incluido) y
  // AUTO_SEND_NURTURE (solo A2+/B2+/C2+, ver activarNurtureAutomatico). Si los dos
  // están apagados, no sale nada por aquí y todo se escribe a mano.
  if (CONFIG.AUTO_SEND_LEADS !== true && CONFIG.AUTO_SEND_NURTURE !== true &&
      CONFIG.AUTO_SEND_REMARKETING !== true) {
    Logger.log('processQueue: envío automático desactivado (AUTO_SEND_LEADS, AUTO_SEND_NURTURE y AUTO_SEND_REMARKETING en false). Los correos se envían a mano.');
    return;
  }

  // Mientras un lead siga marcado, el remarketing no se acaba: cuando se le agotan los
  // toques programados se le siembra el siguiente. Es lo que hace que «tenernos
  // presentes» no dependa de acordarse de volver a ejecutar nada.
  try { renovarRemarketingAgotados(); } catch (e) {
    Logger.log('processQueue: no se pudo renovar el remarketing: ' + e.message);
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
  // La columna «Remarketing» la rellena el asesor a mano y puede estar en cualquier
  // posición (la hoja lleva columnas añadidas después del esquema original).
  const colMarca = indiceColumnaPorCabecera(lData[0] || [], CONFIG.REMARKETING_COL);
  for (let i = 1; i < lData.length; i++) {
    const r = lData[i];
    leadsMap[r[0]] = {
      id: r[0], nombre: r[1], email: r[2], telefono: r[3],
      pais: r[4], capital: r[5], objetivo: r[6], experiencia: r[7],
      plazo: r[8], viaje: r[9], puntuacion: r[10], tier: r[11],
      canal: r[12], estado: r[15],
      remarketing: colMarca ? r[colMarca - 1] : '',
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

    const esRemk = esCodigoRemarketing(emailCode);

    // La marca de la hoja manda en los dos sentidos: si el asesor la quita (porque el
    // lead contestó, o porque ya no procede), la secuencia se para aquí mismo, aunque
    // queden correos en cola. Es lo que hace que la casilla sea un control de verdad
    // y no solo un disparador.
    if (esRemk && !marcaRemarketingActiva(lead.remarketing)) {
      qSheet.getRange(i + 1, 4).setValue('cancelado (sin marca de remarketing)');
      Logger.log('· ' + emailCode + ' cancelado para ' + lead.email + ': la casilla de remarketing ya no está marcada.');
      continue;
    }
    // Cada capa tiene su llave. Con el remarketing encendido y el resto apagado, por
    // aquí solo pasan R/RE: los toques por tier se quedan esperando, que es justo el
    // comportamiento que se busca (primero se trabaja el lead a mano).
    if (esRemk && CONFIG.AUTO_SEND_REMARKETING !== true) continue;
    if (!esRemk && CONFIG.AUTO_SEND_LEADS !== true && CONFIG.AUTO_SEND_NURTURE !== true) continue;

    const isWelcome = isWelcomeSequenceEmail(emailCode);
    if (CONFIG.BUSINESS_HOURS_ONLY !== false && !inWin && !(opts.immediateWelcomeAfterPoll && isWelcome)) {
      continue;
    }

    try {
      if (!CONFIG.TEST_MODE) {
        const bypassHours = CONFIG.BUSINESS_HOURS_ONLY !== false && !inWin &&
          Boolean(opts.immediateWelcomeAfterPoll) && isWelcome;
        // nurture:true solo importa cuando AUTO_SEND_LEADS está en false (caso de hoy):
        // es lo que permite que la capa de nurturing envíe sin reactivar el kit completo.
        sendEmail(emailCode, lead, {
          bypassBusinessHours: bypassHours,
          nurture: !esRemk,
          remarketing: esRemk,
        });
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
 * @param {boolean} [opts.welcomeDescarga]: true: acuse de recibo W0D de una descarga de la guía,
 *   permitido por CONFIG.AUTO_SEND_WELCOME_DESCARGA.
 * @param {boolean} [opts.nurture]: true: envío de la capa de nurturing (A2+/B2+/C2+),
 *   permitido por CONFIG.AUTO_SEND_NURTURE aunque AUTO_SEND_LEADS siga en false.
 * @param {boolean} [opts.remarketing]: true: toque R/RE de un lead marcado a mano,
 *   permitido por CONFIG.AUTO_SEND_REMARKETING.
 */
function sendEmail(code, lead, opts) {
  opts = opts || {};
  const allowed = opts.manual ||
    (opts.welcome && CONFIG.AUTO_SEND_WELCOME !== false) ||
    (opts.welcomeDescarga && CONFIG.AUTO_SEND_WELCOME_DESCARGA !== false) ||
    (opts.nurture && CONFIG.AUTO_SEND_NURTURE === true) ||
    (opts.remarketing && CONFIG.AUTO_SEND_REMARKETING === true);
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

  // ── W0D: ACUSE DE RECIBO DE UNA DESCARGA DE LA GUÍA ─────────
  // Quien descarga la guía en la home deja SOLO su email: sin este correo no hay
  // ninguna otra vía para contactarle, y la web ya le ha prometido por escrito que
  // se la enviamos («También se la enviamos a su-email», app.js). Reglas del texto:
  //   1. Entrega la guía (página y PDF) y nada más: es lo que ha pedido.
  //   2. No hay nombre ni perfil, así que no se finge cercanía: «Hola,» a secas.
  //   3. Admite que es automático y abre la puerta a responder («lo leo yo»):
  //      convertir la descarga en conversación es todo el objetivo del correo.
  //   4. La llamada se ofrece como salida opcional, nunca como la petición principal:
  //      es un contacto en frío que ni siquiera ha dicho su nombre.
  //   5. Recuerda por qué recibe el correo (casilla marcada al descargar): el correo
  //      se sostiene sobre lo que esa persona pidió, no sobre marketing.
  if (code === 'W0D') {
    const firma   = CONFIG.ASESOR_FIRMA || CONFIG.ASESOR_NOMBRE;
    const pdfUrl  = CONFIG.GUIDE_PDF_URL || guiaUrl;
    const guiaCardDescarga = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:22px 0 6px">
  <tr>
    <td style="background:#F8F6F1;border:1px solid #E0DBD1;border-radius:10px;padding:20px 22px">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#C4942A;font-weight:700">Su descarga</p>
      <p style="margin:0 0 14px;font-size:15px;color:#1A1A1A;line-height:1.5"><strong>Guía fiscal del inversor: Dubai &harr; España.</strong> IRPF, Modelo 720, plusvalías, convenio de doble imposición y los errores que salen caros.</p>
      <a href="${pdfUrl}" rel="noopener noreferrer" style="display:inline-block;background:#0D1B2A;color:#E9D9B0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;font-weight:700;letter-spacing:.02em;text-decoration:none;padding:11px 26px;border-radius:50px">Descargar el PDF &rarr;</a>
      <p style="margin:12px 0 0;font-size:13px;color:#646464;line-height:1.6">O leerla en el navegador: <a href="${guiaUrl}" rel="noopener noreferrer" style="color:#C4942A;text-decoration:none">versión web de la guía</a></p>
    </td>
  </tr>
</table>`;

    return {
      subject: 'Su guía fiscal Dubai y España, como le prometimos',
      html: `<p>Hola,</p>
<p>Acaba de descargar nuestra guía fiscal en horizonteemirates.com. Se la dejamos aquí también, para que la tenga a mano cuando la necesite y no dependa de la pestaña que se le abrió:</p>
${guiaCardDescarga}
<p>Es lo que más dudas resuelve al principio: qué se declara en España cuando se compra en Dubai, en qué plazos y qué errores se pagan caros cuando se descubren tarde.</p>
<p>Este correo es automático, para que la guía no se le pierda. No le vamos a llenar el buzón. Ahora bien, si al leerla le surge una duda concreta sobre su caso, <strong>puede responder directamente a este correo: lo leo yo</strong> y le contesto sin compromiso.</p>
<p>Y si prefiere resolverlo hablando, Marc, nuestro socio en Dubai, atiende llamadas de treinta minutos sin ningún compromiso:</p>
${calBtn}
<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #E0DBD1;font-size:14px;color:#646464;line-height:1.6">Un saludo,<br><strong style="color:#1A1A1A">${firma}</strong><br>Horizonte Emirates<br><span style="font-size:13px">Recibe este correo porque pidió la guía en nuestra web y aceptó que se la enviásemos por email.</span></p>`,
      text: `Hola,\n\nAcaba de descargar nuestra guía fiscal en horizonteemirates.com. Se la dejamos aquí también, para que la tenga a mano cuando la necesite y no dependa de la pestaña que se le abrió.\n\nDescargar el PDF:\n${pdfUrl}\n\nO leerla en el navegador:\n${guiaUrl}\n\nEs lo que más dudas resuelve al principio: qué se declara en España cuando se compra en Dubai (IRPF, modelo 720, plusvalías), cómo funciona el convenio de doble imposición y qué errores se pagan caros cuando se descubren tarde.\n\nEste correo es automático, para que la guía no se le pierda. No le vamos a llenar el buzón. Ahora bien, si al leerla le surge una duda concreta sobre su caso, puede responder directamente a este correo: lo leo yo y le contesto sin compromiso.\n\nY si prefiere resolverlo hablando, Marc, nuestro socio en Dubai, atiende llamadas de treinta minutos sin ningún compromiso:\n${calL}\n\nUn saludo,\n${firma}\nHorizonte Emirates\nRecibe este correo porque pidió la guía en nuestra web y aceptó que se la enviásemos por email.`,
    };
  }

  // ── R1-R4 · REMARKETING A QUIEN NO CONTESTÓ (con consentimiento de marketing) ──
  // Se programan solo si el asesor marca la casilla «Remarketing» en la hoja Leads,
  // y se paran solos si la desmarca. Reglas del texto:
  //   1. Se admite el tiempo transcurrido sin excusas largas ni disculpas repetidas.
  //   2. Cada correo aporta algo por sí mismo: quien no conteste ninguno habrá leído
  //      igualmente cuatro cosas útiles. Insistir sin aportar es lo que quema una lista.
  //   3. Ninguna cifra nueva de rentabilidad: los números concretos son de la llamada,
  //      donde se pueden explicar con su contexto.
  //   4. El último dice explícitamente que es el último. Cerrar bien deja la puerta
  //      abierta de verdad; desaparecer sin decirlo, no.
  if (esCodigoRemarketing(code)) {
    // Un contacto que entró por la descarga de la guía solo dejó su email: estos correos
    // tienen que funcionar igual sin nombre, y «Hola Inversor» delata la plantilla.
    const tieneNombre = String(lead.nombre || '').trim() !== '';
    const pila = tieneNombre ? firstName(lead.nombre) : '';
    const saludo = tieneNombre ? `Hola ${pila},` : 'Hola,';
    const sufNombre = tieneNombre ? `, ${pila}` : '';
    const firmaR = CONFIG.ASESOR_FIRMA || CONFIG.ASESOR_NOMBRE;
    const cierreR = `<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #E0DBD1;font-size:14px;color:#646464;line-height:1.6">Un saludo,<br><strong style="color:#1A1A1A">${firmaR}</strong><br>Horizonte Emirates<br><span style="font-size:13px">Puede responder a este correo: lo leo yo.</span></p>`;
    const cierreRTxt = `\n\nUn saludo,\n${firmaR}\nHorizonte Emirates\nPuede responder a este correo: lo leo yo.`;
    // El perfil solo se menciona si consta: recordarle datos que nunca dio delata la plantilla.
    const perfil = lead.capital
      ? (lead.objetivo ? `${cap} con enfoque en ${obj}` : `${cap}`)
      : (lead.objetivo ? `${obj}` : '');

    if (code === 'R1') return {
      subject: `${tieneNombre ? pila + ', r' : 'R'}etomamos su consulta sobre Dubai`,
      html: `<p>${saludo}</p>
<p>Hace un tiempo nos pidió información para invertir en Dubai${perfil ? ` (${perfil})` : ''} y la conversación se quedó a medias. La culpa de eso es nuestra, no suya.</p>
<p>Le escribo por si sigue en el radar. No hace falta que decida nada: si me responde con dos líneas sobre en qué punto está, le digo con franqueza si hoy le compensa o no, y si no le compensa, se lo digo igual.</p>
<p>Mientras tanto, la guía fiscal sigue disponible:</p>
${guiaCard}
<p>Y si prefiere hablarlo directamente, Marc, nuestro socio en Dubai, atiende llamadas de treinta minutos:</p>
${calBtn}${cierreR}`,
      text: `${saludo}\n\nHace un tiempo nos pidió información para invertir en Dubai${perfil ? ` (${perfil})` : ''} y la conversación se quedó a medias. La culpa de eso es nuestra, no suya.\n\nLe escribo por si sigue en el radar. No hace falta que decida nada: si me responde con dos líneas sobre en qué punto está, le digo con franqueza si hoy le compensa o no, y si no le compensa, se lo digo igual.\n\nMientras tanto, la guía fiscal sigue disponible:\n${guiaUrl}\n\nY si prefiere hablarlo directamente, Marc, nuestro socio en Dubai, atiende llamadas de treinta minutos:\n${calL}${cierreRTxt}`,
    };

    if (code === 'R2') return {
      subject: `Lo que separa una zona buena de una zona cara en Dubai`,
      html: `<p>${saludo}</p>
<p>Una cosa que no se ve desde fuera: en Dubai la pregunta no es «qué zona es mejor», sino qué busca usted de la inversión. Son decisiones distintas.</p>
<p>Si lo que quiere es <strong>renta por alquiler</strong>, manda la demanda estable y la gestión: zonas consolidadas, con inquilino y comunidad ya formada.</p>
<p>Si lo que quiere es <strong>revalorización</strong>, manda lo contrario: entrar donde todavía se está construyendo el entorno, asumiendo el plazo y el riesgo que eso trae.</p>
<p>Mezclar los dos objetivos en un mismo inmueble es el error más común, y es el que hace que alguien acabe con un activo que no le sirve para lo que quería.</p>
<p>Los números concretos de cada opción se los damos en la llamada, donde se pueden explicar con su contexto en vez de en una tabla suelta:</p>
${calBtn}${cierreR}`,
      text: `${saludo}\n\nUna cosa que no se ve desde fuera: en Dubai la pregunta no es «qué zona es mejor», sino qué busca usted de la inversión. Son decisiones distintas.\n\nSi quiere renta por alquiler, manda la demanda estable y la gestión: zonas consolidadas, con inquilino y comunidad ya formada.\n\nSi quiere revalorización, manda lo contrario: entrar donde todavía se está construyendo el entorno, asumiendo el plazo y el riesgo que eso trae.\n\nMezclar los dos objetivos en un mismo inmueble es el error más común, y el que hace que alguien acabe con un activo que no le sirve para lo que quería.\n\nLos números concretos se los damos en la llamada, donde se pueden explicar con su contexto en vez de en una tabla suelta:\n${calL}${cierreRTxt}`,
    };

    if (code === 'R3') return {
      subject: `Ver los proyectos en persona${sufNombre}`,
      html: `<p>${saludo}</p>
<p>Hay una parte de esto que por correo no se resuelve, y es ver dónde está el inmueble y quién lo construye.</p>
<p>Si en algún momento quiere ir, le montamos nosotros la agenda completa en Emiratos: visitas a las promotoras, los proyectos que encajen con lo que busca y una reunión en nuestras oficinas de Dubai. Usted pone el viaje; la agenda la preparamos nosotros, en español.</p>
<p>No hay que decidir nada allí. De hecho, lo normal es volver con criterio y decidir semanas después, ya con calma.</p>
<p>Si quiere que le contemos cómo se organiza, media hora basta:</p>
${calBtn}${cierreR}`,
      text: `${saludo}\n\nHay una parte de esto que por correo no se resuelve, y es ver dónde está el inmueble y quién lo construye.\n\nSi en algún momento quiere ir, le montamos nosotros la agenda completa en Emiratos: visitas a las promotoras, los proyectos que encajen con lo que busca y una reunión en nuestras oficinas de Dubai. Usted pone el viaje; la agenda la preparamos nosotros, en español.\n\nNo hay que decidir nada allí. Lo normal es volver con criterio y decidir semanas después, ya con calma.\n\nSi quiere que le contemos cómo se organiza, media hora basta:\n${calL}${cierreRTxt}`,
    };

    if (code === 'R4') return {
      subject: `Sobre plano o entregado: no es lo mismo${sufNombre}`,
      html: `<p>${saludo}</p>
<p>Es la decisión que más condiciona todo lo demás, y la que menos se explica.</p>
<p><strong>Sobre plano</strong>: se paga a plazos durante la construcción, así que el desembolso inicial es menor y el capital entra repartido. A cambio hay que esperar a la entrega para tener rentas, y se asume el riesgo de plazo.</p>
<p><strong>Entregado</strong>: se paga de una vez, pero puede alquilarse desde el primer mes. Menos sorpresas y menos recorrido.</p>
<p>No hay una respuesta buena en abstracto: depende de si le sobra el dinero ahora o lo necesita rindiendo ya. Si me dice en cuál de los dos casos está, le digo qué tiene sentido mirar.</p>
${calBtn}${cierreR}`,
      text: `${saludo}\n\nEs la decisión que más condiciona todo lo demás, y la que menos se explica.\n\nSobre plano: se paga a plazos durante la construcción, así que el desembolso inicial es menor y el capital entra repartido. A cambio hay que esperar a la entrega para tener rentas, y se asume el riesgo de plazo.\n\nEntregado: se paga de una vez, pero puede alquilarse desde el primer mes. Menos sorpresas y menos recorrido.\n\nNo hay una respuesta buena en abstracto: depende de si le sobra el dinero ahora o lo necesita rindiendo ya. Si me dice en cuál de los dos casos está, le digo qué tiene sentido mirar.\n\n${calL}${cierreRTxt}`,
    };

    if (code === 'R5') return {
      subject: `Lo que Hacienda espera de usted si compra en Dubai`,
      html: `<p>${saludo}</p>
<p>Comprar fuera no le saca de la declaración en España. Siendo residente fiscal aquí, tributa por su renta mundial, y eso incluye lo que genere un inmueble en Emiratos.</p>
<p>En la práctica son tres frentes: el IRPF por los rendimientos, el modelo 720 si el valor supera el umbral, y las plusvalías el día que venda. El convenio de doble imposición evita pagar dos veces, pero rara vez lo compensa todo.</p>
<p>Está desarrollado, con los plazos y los umbrales, en nuestra guía:</p>
${guiaCard}
<p>Y si quiere verlo aplicado a su caso concreto, que es donde cambian las cosas, media hora basta:</p>
${calBtn}${cierreR}`,
      text: `${saludo}\n\nComprar fuera no le saca de la declaración en España. Siendo residente fiscal aquí, tributa por su renta mundial, y eso incluye lo que genere un inmueble en Emiratos.\n\nEn la práctica son tres frentes: el IRPF por los rendimientos, el modelo 720 si el valor supera el umbral, y las plusvalías el día que venda. El convenio de doble imposición evita pagar dos veces, pero rara vez lo compensa todo.\n\nEstá desarrollado, con los plazos y los umbrales, en nuestra guía:\n${guiaUrl}\n\nY si quiere verlo aplicado a su caso concreto, que es donde cambian las cosas, media hora basta:\n${calL}${cierreRTxt}`,
    };

    if (code === 'R6') return {
      subject: `El gasto que casi nadie mira antes de comprar`,
      html: `<p>${saludo}</p>
<p>Cuando alguien compara dos inmuebles suele mirar precio y rentabilidad estimada. El que decide de verdad si la operación sale bien es otro: <strong>los gastos recurrentes</strong>.</p>
<p>En Emiratos, la comunidad se paga por metro construido y varía mucho entre un edificio con piscina, gimnasio y conserjería y otro sin ellos. Súmele la gestión del alquiler y los periodos sin inquilino, y la rentabilidad neta puede quedar bastante lejos de la bruta que aparece en los anuncios.</p>
<p>No es un motivo para no comprar: es un motivo para comparar con el número correcto. Cuando le pasemos opciones, se las pasaremos con ese cálculo hecho.</p>
${calBtn}${cierreR}`,
      text: `${saludo}\n\nCuando alguien compara dos inmuebles suele mirar precio y rentabilidad estimada. El que decide de verdad si la operación sale bien es otro: los gastos recurrentes.\n\nEn Emiratos, la comunidad se paga por metro construido y varía mucho entre un edificio con piscina, gimnasio y conserjería y otro sin ellos. Súmele la gestión del alquiler y los periodos sin inquilino, y la rentabilidad neta puede quedar bastante lejos de la bruta que aparece en los anuncios.\n\nNo es un motivo para no comprar: es un motivo para comparar con el número correcto. Cuando le pasemos opciones, se las pasaremos con ese cálculo hecho.\n\n${calL}${cierreRTxt}`,
    };

    if (code === 'R7') return {
      subject: `¿Y quién gestiona el alquiler estando usted aquí?`,
      html: `<p>${saludo}</p>
<p>Es la pregunta que más veces nos hacen cuando la inversión ya se ve viable, y es razonable: el inmueble está a seis mil kilómetros.</p>
<p>Se gestiona con una empresa local que se encarga de buscar inquilino, cobrar, y responder a las incidencias del día a día. Usted no trata con nadie sobre el terreno. Esa gestión tiene un coste, y es parte del cálculo del correo anterior.</p>
<p>Si quiere que le contemos cómo funciona en la práctica, y qué se firma exactamente, se lo explicamos sin compromiso:</p>
${calBtn}${cierreR}`,
      text: `${saludo}\n\nEs la pregunta que más veces nos hacen cuando la inversión ya se ve viable, y es razonable: el inmueble está a seis mil kilómetros.\n\nSe gestiona con una empresa local que se encarga de buscar inquilino, cobrar, y responder a las incidencias del día a día. Usted no trata con nadie sobre el terreno. Esa gestión tiene un coste, y es parte del cálculo del correo anterior.\n\nSi quiere que le contemos cómo funciona en la práctica, y qué se firma exactamente, se lo explicamos sin compromiso:\n${calL}${cierreRTxt}`,
    };

    if (code === 'R8') return {
      subject: tieneNombre ? `${pila}, ¿le sigo escribiendo?` : '¿Le sigo escribiendo?',
      html: `<p>${saludo}</p>
<p>Llevo unos meses mandándole cosas sobre invertir en Emiratos y no he sabido de usted. No pasa nada: no todo el mundo tiene que contestar, y estos correos están pensados para leerse sin responder.</p>
<p>Se lo pregunto igualmente, porque prefiero escribir a quien le sirve:</p>
<p><strong>Si no me dice nada</strong>, le seguiré escribiendo de vez en cuando, más o menos una vez cada tres meses, cuando haya algo que merezca la pena contar.</p>
<p><strong>Si prefiere que pare</strong>, respóndame con la palabra BAJA y dejo de escribirle hoy mismo. Sin preguntas.</p>
<p>Y si lo que pasa es que ahora sí es buen momento, con dos líneas retomamos donde lo dejamos.</p>${cierreR}`,
      text: `${saludo}\n\nLlevo unos meses mandándole cosas sobre invertir en Emiratos y no he sabido de usted. No pasa nada: no todo el mundo tiene que contestar, y estos correos están pensados para leerse sin responder.\n\nSe lo pregunto igualmente, porque prefiero escribir a quien le sirve:\n\nSi no me dice nada, le seguiré escribiendo de vez en cuando, más o menos una vez cada tres meses, cuando haya algo que merezca la pena contar.\n\nSi prefiere que pare, respóndame con la palabra BAJA y dejo de escribirle hoy mismo. Sin preguntas.\n\nY si lo que pasa es que ahora sí es buen momento, con dos líneas retomamos donde lo dejamos.${cierreRTxt}`,
    };

    // R9: el toque recurrente, cada 90 días mientras la casilla siga marcada. Cambia de
    // enfoque según el trimestre para no ser cuatro veces el mismo correo al año; no
    // inventa novedades de mercado, que es lo que convierte un recordatorio en ruido.
    if (code === 'R9') {
      const aperturas = [
        { gancho: 'Emiratos sigue entregando proyecto tras proyecto, y el mapa de lo que interesa cambia más rápido de lo que parece.',
          cuerpo: 'Si en algún momento quiere una foto actual de dónde tiene sentido entrar hoy y dónde ya no, se la damos sin compromiso.' },
        { gancho: 'Cada cierto tiempo le escribo por si su situación ha cambiado, que suele ser lo que mueve estas decisiones, no el mercado.',
          cuerpo: 'Si ahora le encaja mirarlo con calma, dígamelo y lo retomamos desde donde lo dejamos.' },
        { gancho: 'Sigo aquí, por si alguna vez le viene bien retomar lo de Emiratos.',
          cuerpo: 'No hace falta que decida nada: con saber en qué punto está me basta para decirle si merece la pena mirarlo ahora o esperar.' },
        { gancho: 'Le escribo poco y a propósito: prefiero que cuando llegue un correo mío tenga algo dentro.',
          cuerpo: 'Si quiere que revisemos su caso con los datos de hoy, media hora basta para salir de dudas.' },
      ];
      const a = aperturas[new Date().getMonth() % aperturas.length];
      return {
        subject: tieneNombre ? `${pila}, ¿sigue en el radar lo de Emiratos?` : '¿Sigue en el radar lo de Emiratos?',
        html: `<p>${saludo}</p>
<p>${a.gancho}</p>
<p>${a.cuerpo}</p>
${calBtn}
<p style="font-size:14px;color:#646464">Si prefiere que deje de escribirle, respóndame con la palabra BAJA y listo.</p>${cierreR}`,
        text: `${saludo}\n\n${a.gancho}\n\n${a.cuerpo}\n\n${calL}\n\nSi prefiere que deje de escribirle, respóndame con la palabra BAJA y listo.${cierreRTxt}`,
      };
    }

    // ── RE1-RE2 · Sin consentimiento de marketing ───────────────────────────
    // Estos dos NO son publicidad y no deben parecerlo: se limitan a retomar la
    // solicitud que esa persona hizo y que quedó sin respuesta, que es lo que
    // sostiene el interés legítimo. Nada de proyectos, zonas ni oportunidades.
    if (code === 'RE1') return {
      subject: `Su solicitud quedó sin respuesta${sufNombre}`,
      html: `<p>${saludo}</p>
<p>Hace un tiempo pidió información en nuestra web para invertir en Emiratos${perfil ? ` (${perfil})` : ''} y no llegamos a darle una respuesta completa. Es un fallo nuestro y quería reconocerlo.</p>
<p>Si todavía le interesa, retomamos su solicitud donde se quedó: dígame en qué punto está y le preparamos el análisis que pidió.</p>
<p>Si prefiere hablarlo, aquí puede coger media hora con Marc, nuestro socio en Dubai:</p>
${calBtn}
<p>Y si ya no le interesa, no tiene que hacer nada: no le vamos a escribir por ningún otro motivo que no sea este.</p>${cierreR}`,
      text: `${saludo}\n\nHace un tiempo pidió información en nuestra web para invertir en Emiratos${perfil ? ` (${perfil})` : ''} y no llegamos a darle una respuesta completa. Es un fallo nuestro y quería reconocerlo.\n\nSi todavía le interesa, retomamos su solicitud donde se quedó: dígame en qué punto está y le preparamos el análisis que pidió.\n\nSi prefiere hablarlo, aquí puede coger media hora con Marc, nuestro socio en Dubai:\n${calL}\n\nY si ya no le interesa, no tiene que hacer nada: no le vamos a escribir por ningún otro motivo que no sea este.${cierreRTxt}`,
    };

    return {
      subject: `Cierro su solicitud${sufNombre}`,
      html: `<p>${saludo}</p>
<p>Le escribí hace unos días para retomar la solicitud que dejó en nuestra web y no he sabido nada, así que la cierro por mi parte. <strong>Es el último correo que le mando.</strong></p>
<p>Sus datos siguen en nuestro sistema por si algún día vuelve a plantearlo; si prefiere que los borremos, respóndame con la palabra BAJA y se eliminan.</p>
<p>Y si lo retoma en el futuro, escríbanos sin más: no hace falta volver a rellenar nada.</p>${cierreR}`,
      text: `${saludo}\n\nLe escribí hace unos días para retomar la solicitud que dejó en nuestra web y no he sabido nada, así que la cierro por mi parte. Es el último correo que le mando.\n\nSus datos siguen en nuestro sistema por si algún día vuelve a plantearlo; si prefiere que los borremos, respóndame con la palabra BAJA y se eliminan.\n\nY si lo retoma en el futuro, escríbanos sin más: no hace falta volver a rellenar nada.${cierreRTxt}`,
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
<p>Dubai Marina/Business Bay: alrededor del 7-8% bruto anual.</p>
<p>Ras Al Khaimah (antes del Wynn): escenario orientativo de plusvalía del 20-30% desde 200.000€, sin resultados garantizados.</p>
<p>Abu Dhabi (Aldar): 5-7% bruto, más estable.</p>
<p>Si quiere que hablemos de alguna en detalle, podemos agendar 30 minutos por Calendly ${calL} o por WhatsApp.</p>
${waBtn}${firma}`,
    text: `Hola ${n},\n\nBasándome en su perfil de ${cap} y ${obj}, he seleccionado tres opciones que podrían encajar bien.\n\nDubai Marina/Business Bay: alrededor del 7-8% bruto anual.\nRas Al Khaimah (antes del Wynn): escenario orientativo de plusvalía del 20-30% desde 200.000€, sin resultados garantizados.\nAbu Dhabi (Aldar): 5-7% bruto, más estable.\n\nSi quiere que hablemos de alguna en detalle, podemos agendar 30 minutos por Calendly ${calL} o por WhatsApp ${wa}.\n\nSaludos,\nEquipo Horizonte Emirates`,
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
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Entrada desde 15%. Entrega 2026-2027. Rentabilidad estimada <strong>7-8% bruto</strong>.</td>
  </tr>
  <tr>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#0D1B2A">RAK pre-apertura Wynn</td>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Mejor precio de entrada antes del evento 2027. Ticket desde 200.000€. Escenario orientativo, sin resultados garantizados.</td>
  </tr>
  <tr style="background:#F8F6F1">
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#0D1B2A">Abu Dhabi consolidado</td>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Rentabilidad inmediata. <strong>5-7% bruto</strong>. Baja volatilidad.</td>
  </tr>
</table>
<p>¿30 minutos para presentarle los números reales de cada opción?</p>
${calBtn}${waBtn}${firma}`,
    text: `${sal} ${n},\n\nDisponible esta semana para ${cap} · ${obj}:\n- Dubai Marina/JVC: 7-8% bruto\n- RAK pre-Wynn: máxima apreciación (escenario orientativo, sin garantía)\n- Abu Dhabi: 5-7% bruto, estable\n\n30 min para los números reales. ${cal} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
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
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Rentabilidad bruta alquiler</td>
    <td style="border:1px solid #E0DBD1;color:#888">3-5%</td>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#1A1A1A">6-12%</td>
  </tr>
  <tr style="background:#F8F6F1">
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Impuesto sobre rentas</td>
    <td style="border:1px solid #E0DBD1;color:#888">Hasta 45% (IRPF)</td>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#1A1A1A">0%</td>
  </tr>
  <tr>
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Impuesto sobre plusvalías</td>
    <td style="border:1px solid #E0DBD1;color:#888">19-28%</td>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#1A1A1A">0%</td>
  </tr>
  <tr style="background:#F8F6F1">
    <td style="border:1px solid #E0DBD1;color:#3a3a3a">Riesgo de ocupación ilegal</td>
    <td style="border:1px solid #E0DBD1;color:#888">Alto, procesos lentos</td>
    <td style="border:1px solid #E0DBD1;font-weight:700;color:#1A1A1A">Muy bajo, marco RERA</td>
  </tr>
</table>
<p style="font-size:12px;color:#888">Cifras orientativas de mercado (JLL, Knight Frank, DLD). La fiscalidad depende de su situación personal.</p>
<p>No estoy diciendo que Dubai sea para todo el mundo. Estoy diciendo que estos números merecen ser comparados con criterio.</p>
<p>¿Quiere la comparativa completa adaptada a su perfil? Responda a este email.</p>
${firma}`,
    text: `${sal} ${n},\n\nEspaña: 3-5% bruto · hasta 45% IRPF · riesgo de ocupación ilegal alto\nDubai: 6-12% bruto · 0% impuestos · RERA protege al propietario\n\nCifras orientativas de mercado (JLL, Knight Frank, DLD). La fiscalidad depende de su situación personal.\n\n¿Comparativa para su perfil? Responda o WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C3') return {
    subject: `${n}, proceso de compra en Dubai (pasos)`,
    html: `<p>${sal} ${n},</p>
<p>Uno de los mayores frenos es no entender cómo funciona el proceso de compra desde ${pais}. Hoy se lo explico en cinco pasos concretos:</p>
<ol style="margin:16px 0;padding-left:20px;color:#3a3a3a;line-height:2">
  <li><strong>Selección de activos.</strong> Presentamos oportunidades verificadas adaptadas a su perfil, no catálogos genéricos.</li>
  <li><strong>Due diligence en RERA.</strong> Verificamos el promotor y la situación legal de cada proyecto antes de presentarlo.</li>
  <li><strong>Reserva + SPA.</strong> Depósito inicial (5.000-10.000 AED) y firma del Sales Purchase Agreement.</li>
  <li><strong>Pagos escalonados.</strong> En off-plan: típicamente 30/30/40 hasta entrega. Sin inmovilizar capital completo.</li>
  <li><strong>Obligaciones en ${pais}.</strong> Modelo 720 a partir de 50.000€ + tributar rentas en IRPF. <em>Consulte asesor fiscal internacional, nosotros no lo prestamos.</em></li>
</ol>
<p style="font-size:12px;color:#888">Pasos orientativos que pueden variar según proyecto y promotor.</p>
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
  <strong>Proyección:</strong> 7,2% bruto en alquiler · +18-22% plusvalía en RAK pre-Wynn.<br><br>
  <strong>Proceso:</strong> 6 semanas · 2 videoconferencias + visita presencial de 3 días · Todo en español, sin coste.
</p>
<p>¿Hay opciones similares para su perfil? Responda aquí o escríbame por WhatsApp.</p>
<p><em style="font-size:12px;color:#888">Datos orientativos. Las rentabilidades futuras no están garantizadas.</em></p>
${waBtn}${firma}`,
    text: `${sal} ${n},\n\nCaso real: inversor español, 200k€, entrada 60k€ en dos off-plan.\nProyección: 7,2% bruto alquiler + 18-22% plusvalía RAK.\n6 semanas, todo en español.\n\n¿Opciones similares? WhatsApp ${wa}\n(Datos orientativos, no garantizados)\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C5') return {
    subject: `${n}, nota sobre Ras Al Khaimah y el calendario del mercado`,
    html: `<p>${sal} ${n},</p>
<p>En 2027 abre en Ras Al Khaimah el <strong>primer resort-casino de la región MENA</strong>, desarrollado por Wynn Resorts. Los activos comprados hoy (antes del evento) tienen proyecciones de apreciación del <strong>20-35%</strong> antes de la apertura, un escenario orientativo y sin resultados garantizados.</p>
<p>La ventana de entrada a precios actuales se está cerrando de forma progresiva.</p>
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
  <li>Zonas Prime (Marina, Downtown, Palm): <strong>+4-6%</strong> en lo que va de 2026</li>
  <li>RAK: sigue siendo la zona con mayor potencial de apreciación antes de 2027</li>
  <li>Off-plan: la opción más accesible para capital inicial de 150.000-300.000€</li>
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
  <li>Off-plan en zonas emergentes: <strong>+8-12%</strong> en 90 días</li>
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

/**
 * Marca la baja en la hoja Descargas (quien solo descargó la guía no está en Leads).
 * Escribe «baja» en «Estado nurturing», que es lo que mira el kit manual D1-D3.
 */
function markUnsubscribedDescarga(email) {
  const needle = String(email || '').trim().toLowerCase();
  if (!needle) return false;
  try {
    const sh = getOrCreateDescargasSheet();
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || '').trim().toLowerCase() === needle) {
        sh.getRange(i + 1, 4).setValue('baja');
        return true;
      }
    }
  } catch (e) {
    Logger.log('markUnsubscribedDescarga: no se pudo marcar ' + email + ': ' + e.message);
  }
  return false;
}

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

  // A-209: descargas de la guía fiscal (formulario de 1 campo), separadas de Leads
  // a propósito. Ver isGuiaDownload/descargaExists/saveDescarga. La creación real vive
  // en getOrCreateDescargasSheet(), que también se autoinvoca si initSheets() no se
  // ha ejecutado todavía (no depender del orden de ejecución).
  getOrCreateDescargasSheet();

  Logger.log('✓ Hojas inicializadas: Leads + Cola + Descargas');
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
      const msg = getAvisoWeb3Forms(t);
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

  // 4 bis. Descargas de la guía registradas y sin acuse (W0D) pasadas 2 h. Es exactamente
  // el fallo silencioso que hubo que descubrir a mano: la descarga entra, se registra y
  // esa persona (de la que solo se tiene el email) no recibe nada.
  if (CONFIG.AUTO_SEND_WELCOME_DESCARGA !== false) {
    try {
      const sh   = getOrCreateDescargasSheet();
      const col  = ensureDescargasBienvenidaColumn(sh);
      const dData = sh.getDataRange().getValues();
      const limite = new Date(Date.now() - 2 * 3600 * 1000);
      // Línea base: la hoja ya tenía descargas anteriores al W0D, atendidas a mano o no
      // atendidas, y ninguna lleva sello en la columna «Bienvenida». Sin esta marca, el
      // healthcheck avisaría de todas ellas en cada pasada: una alerta que nadie puede
      // cerrar y que acabaría enseñando a ignorar el healthcheck entero. La primera
      // ejecución tras desplegar el código sella «desde aquí cuento», así que no hay que
      // preparar la hoja a mano. Para dejar constancia en las filas viejas, hay una
      // función aparte: marcarDescargasSinAcuse().
      let desde = Number(props.getProperty('HE_W0D_DESDE') || 0);
      if (!desde) {
        desde = Date.now();
        props.setProperty('HE_W0D_DESDE', String(desde));
        Logger.log('healthCheck: línea base del acuse W0D fijada en ' + new Date(desde) +
          '. Las descargas anteriores no generan alerta.');
      }
      let sinAcuse = 0;
      for (let i = 1; i < dData.length; i++) {
        if (!String(dData[i][0] || '').trim()) continue;
        if (String(dData[i][col - 1] || '').trim() !== '') continue;
        const f = new Date(dData[i][1]);
        if (!isNaN(f) && f < limite && f.getTime() > desde) sinAcuse++;
      }
      if (sinAcuse > 0) {
        problems.push(sinAcuse + ' descarga(s) de la guía sin acuse W0D pasadas 2 h. ' +
          'Ejecutar enviarBienvenidasDescargasPendientes() en Apps Script.');
      }
    } catch (e) { problems.push('No se pudo revisar la hoja Descargas: ' + e.message); }
  }

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

/** Vista previa del acuse de la descarga de la guía (W0D), sin enviar nada. */
function previewWelcomeDescarga() {
  const tpl = getTemplate('W0D', { email: 'ejemplo@ejemplo.com' });
  Logger.log('=== W0D · acuse de descarga de la guía ===');
  Logger.log('Asunto: ' + tpl.subject);
  Logger.log('\n' + buildEmailPlainBody(tpl.text));
}

/** Envío real del W0D a la dirección del asesor, para verlo tal cual llega. */
function testWelcomeDescargaToSelf() {
  sendEmail('W0D', { email: CONFIG.AGENT_BRIEFING_EMAIL },
    { welcomeDescarga: true, bypassBusinessHours: true });
  Logger.log('✓ W0D de prueba enviado a ' + CONFIG.AGENT_BRIEFING_EMAIL);
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
