// ═══════════════════════════════════════════════════════════════
// HORIZONTE EMIRATES · Guardián del funnel (vigilancia)
// Google Apps Script · Propulse SLU · Andorra
//
// QUÉ HACE
//   Cada 2 días revisa los avisos de Web3Forms recibidos y comprueba que
//   TODOS los leads acabaron en el CRM. Envía un informe por email con los
//   leads perdidos, los que no se pueden interpretar y los sospechosos.
//
// PRINCIPIO DE DISEÑO: SOLO LECTURA
//   Este archivo NO modifica nada. No guarda leads, no envía correos a
//   leads, no marca como leído, no etiqueta hilos, no toca el motor de
//   emails. Únicamente lee Gmail y el Sheet, y te manda un informe a ti.
//   Vive en su propio archivo: horizonte-emails.gs no se toca.
//
// INSTALACIÓN (una sola vez)
//   1. Apps Script del proyecto → + Archivo → Secuencia de comandos
//   2. Nombrarlo "horizonte-guardian" y pegar este contenido
//   3. Ejecutar guardianProbar()      → informe inmediato, para validar
//   4. Ejecutar guardianCrearTrigger() → programa el informe cada 2 días
//
// DESINSTALACIÓN
//   Ejecutar guardianBorrarTrigger(). El motor de emails no se entera.
// ═══════════════════════════════════════════════════════════════

const GUARDIAN_CFG = {
  // Días de correo que revisa cada ejecución. Debe superar el intervalo
  // entre ejecuciones para que ningún día quede sin mirar.
  DIAS_ANALIZADOS: 5,

  // Cada cuántos días se ejecuta y llega el informe.
  DIAS_ENTRE_INFORMES: 2,

  // Hora de envío del informe (0-23, horario del proyecto).
  HORA_INFORME: 8,

  // Máximo de hilos de Gmail a revisar por ejecución.
  MAX_HILOS: 100,

  // Destinatario del informe. Por defecto, el mismo que recibe los briefings.
  // Para usar otro, poner aquí la dirección entre comillas.
  EMAIL_DESTINO: '',

  // true  → envía informe siempre, aunque esté todo correcto.
  // false → solo escribe en el registro cuando no hay ninguna incidencia.
  ENVIAR_SI_TODO_OK: true,
};

// ── Punto de entrada del trigger ───────────────────────────────
/** Revisión periódica del funnel. Es la función que ejecuta el trigger. */
function guardianRevisarFunnel() {
  try {
    const informe = guardianAnalizar_(GUARDIAN_CFG.DIAS_ANALIZADOS);
    const hayIncidencias = informe.perdidos.length > 0 ||
                           informe.noParseables.length > 0 ||
                           informe.sospechosos.length > 0;

    Logger.log(guardianResumenCorto_(informe));

    if (hayIncidencias || GUARDIAN_CFG.ENVIAR_SI_TODO_OK) {
      guardianEnviarInforme_(informe);
    }
  } catch (e) {
    // Un fallo del guardián nunca puede tumbar nada: se avisa y se sale.
    Logger.log('guardianRevisarFunnel ERROR: ' + e.toString());
    try {
      GmailApp.sendEmail(
        guardianDestino_(),
        '[Guardian HE] Fallo al revisar el funnel',
        'El guardián no pudo completar la revisión.\n\n' +
        'Error: ' + e.toString() + '\n\n' +
        'El motor de emails no está afectado: el guardián solo lee.\n' +
        'Revisa las ejecuciones en Apps Script.'
      );
    } catch (e2) {
      Logger.log('guardianRevisarFunnel: tampoco se pudo avisar: ' + e2.toString());
    }
  }
}

/** Informe inmediato bajo demanda, sin esperar al trigger. */
function guardianProbar() {
  const informe = guardianAnalizar_(GUARDIAN_CFG.DIAS_ANALIZADOS);
  Logger.log(guardianResumenCorto_(informe));
  Logger.log(guardianCuerpoInforme_(informe));
  guardianEnviarInforme_(informe);
}

// ── Análisis (solo lectura) ────────────────────────────────────
/**
 * Clasifica los avisos de Web3Forms de los últimos N días.
 * Categorías:
 *   registrados  → lead correcto y presente en el CRM (todo bien)
 *   perdidos     → es lead, se interpreta, pero NO está en el CRM
 *   noParseables → pasa el detector pero no se le saca email
 *   sospechosos  → el detector lo descarta y aun así parece un lead
 *                  (este es el caso que dejó pasar el fallo de junio)
 *   ignorados    → correos de Web3Forms que no son leads
 */
function guardianAnalizar_(dias) {
  const lookback = Math.max(1, parseInt(dias, 10) || 5);
  const query = 'from:web3forms.com newer_than:' + lookback + 'd';
  const threads = GmailApp.search(query, 0, GUARDIAN_CFG.MAX_HILOS);

  const informe = {
    desde: new Date(Date.now() - lookback * 24 * 60 * 60 * 1000),
    hasta: new Date(),
    dias: lookback,
    totalAvisos: threads.length,
    registrados: [],
    perdidos: [],
    noParseables: [],
    sospechosos: [],
    ignorados: [],
  };

  if (!threads.length) return informe;

  const emailsCrm = guardianEmailsDelCrm_();

  threads.forEach(thread => {
    let msg;
    try {
      msg = getLatestThreadMessage(thread);
    } catch (e) {
      msg = null;
    }
    if (!msg) return;

    const fecha   = msg.getDate();
    const subject = msg.getSubject() || '(sin asunto)';
    let body = '';
    try {
      body = getMessageBodyForLeadParse(msg);
    } catch (e) {
      body = '';
    }

    const esLead = isHorizonteWeb3Lead(subject, body);
    let lead = null;
    try {
      lead = parseLeadFromEmail(body, subject);
    } catch (e) {
      lead = null;
    }

    if (!esLead) {
      // El detector lo descarta. Si aun así se parece a un lead del
      // formulario, es una alarma: el detector puede estar roto.
      if (lead && lead.email && guardianPareceLead_(body, subject)) {
        informe.sospechosos.push({ fecha: fecha, subject: subject, lead: lead });
      } else {
        informe.ignorados.push({ fecha: fecha, subject: subject });
      }
      return;
    }

    if (!lead || !lead.email) {
      informe.noParseables.push({
        fecha: fecha,
        subject: subject,
        extracto: body.substring(0, 300).replace(/\s+/g, ' ').trim(),
      });
      return;
    }

    if (emailsCrm.indexOf(lead.email.toLowerCase()) >= 0) {
      informe.registrados.push({ fecha: fecha, lead: lead });
    } else {
      informe.perdidos.push({ fecha: fecha, subject: subject, lead: lead });
    }
  });

  return informe;
}

/** Emails ya registrados en el CRM, leídos de una sola vez. */
function guardianEmailsDelCrm_() {
  const datos = getSheet('Leads').getDataRange().getValues();
  const out = [];
  for (let i = 1; i < datos.length; i++) {
    const email = (datos[i][2] || '').toString().trim().toLowerCase();
    if (email) out.push(email);
  }
  return out;
}

/**
 * Heurística de respaldo, independiente del detector oficial: un correo de
 * Web3Forms con campos del formulario de cualificación es un lead, aunque
 * el asunto haya cambiado y el detector ya no lo reconozca.
 */
function guardianPareceLead_(body, subject) {
  const texto = ((body || '') + ' ' + (subject || '')).toLowerCase();
  const marcas = ['capital', 'objetivo', 'experiencia', 'plazo', 'pts', 'lead'];
  let encontradas = 0;
  marcas.forEach(s => { if (texto.indexOf(s) >= 0) encontradas++; });
  return encontradas >= 3;
}

// ── Informe por email ──────────────────────────────────────────
function guardianDestino_() {
  if (GUARDIAN_CFG.EMAIL_DESTINO) return GUARDIAN_CFG.EMAIL_DESTINO;
  try {
    if (CONFIG && CONFIG.AGENT_BRIEFING_EMAIL) return CONFIG.AGENT_BRIEFING_EMAIL;
  } catch (e) {}
  return Session.getEffectiveUser().getEmail();
}

function guardianEnviarInforme_(informe) {
  const incidencias = informe.perdidos.length +
                      informe.noParseables.length +
                      informe.sospechosos.length;

  const asunto = incidencias > 0
    ? '[Guardian HE] ' + incidencias + ' incidencia(s) en el funnel'
    : '[Guardian HE] Funnel correcto · ' + informe.registrados.length + ' lead(s) en ' + informe.dias + ' dias';

  GmailApp.sendEmail(guardianDestino_(), asunto, guardianCuerpoInforme_(informe));
}

function guardianCuerpoInforme_(informe) {
  const L = [];
  const f = d => Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

  L.push('GUARDIAN DEL FUNNEL · HORIZONTE EMIRATES');
  L.push('Periodo revisado: ultimos ' + informe.dias + ' dias (hasta ' + f(informe.hasta) + ')');
  L.push('');
  L.push('RESUMEN');
  L.push('  Avisos de Web3Forms revisados : ' + informe.totalAvisos);
  L.push('  Leads correctos en el CRM     : ' + informe.registrados.length);
  L.push('  Leads PERDIDOS (no en CRM)    : ' + informe.perdidos.length);
  L.push('  No interpretables             : ' + informe.noParseables.length);
  L.push('  Sospechosos (detector)        : ' + informe.sospechosos.length);
  L.push('  Descartados (no son leads)    : ' + informe.ignorados.length);
  L.push('');

  if (informe.perdidos.length) {
    L.push('════════════════════════════════════════════');
    L.push('LEADS PERDIDOS: llegaron pero no estan en el CRM');
    L.push('════════════════════════════════════════════');
    informe.perdidos.forEach((p, i) => {
      L.push('');
      L.push((i + 1) + ') ' + f(p.fecha));
      L.push(guardianFichaLead_(p.lead));
      L.push('   Asunto: ' + p.subject);
    });
    L.push('');
    L.push('ACCION: ejecutar recuperarLeadsPerdidos(' + informe.dias + ') en Apps Script.');
    L.push('Los recupera y les lanza la secuencia de bienvenida. Es seguro repetirlo:');
    L.push('los que ya estan en el CRM se saltan.');
    L.push('');
  }

  if (informe.sospechosos.length) {
    L.push('════════════════════════════════════════════');
    L.push('SOSPECHOSOS: parecen leads pero el detector los descarta');
    L.push('════════════════════════════════════════════');
    L.push('Si aparece algo aqui, es probable que el asunto del formulario haya');
    L.push('cambiado y isHorizonteWeb3Lead ya no lo reconozca (caso de junio 2026).');
    L.push('recuperarLeadsPerdidos NO los recupera: usa el mismo detector.');
    informe.sospechosos.forEach((s, i) => {
      L.push('');
      L.push((i + 1) + ') ' + f(s.fecha));
      L.push(guardianFichaLead_(s.lead));
      L.push('   Asunto: ' + s.subject);
    });
    L.push('');
  }

  if (informe.noParseables.length) {
    L.push('════════════════════════════════════════════');
    L.push('NO INTERPRETABLES: son leads pero no se les saca el email');
    L.push('════════════════════════════════════════════');
    informe.noParseables.forEach((n, i) => {
      L.push('');
      L.push((i + 1) + ') ' + f(n.fecha));
      L.push('   Asunto: ' + n.subject);
      L.push('   Extracto: ' + n.extracto);
    });
    L.push('');
  }

  if (informe.registrados.length) {
    L.push('════════════════════════════════════════════');
    L.push('LEADS CORRECTOS');
    L.push('════════════════════════════════════════════');
    informe.registrados.forEach(r => {
      L.push('  ' + f(r.fecha) + ' · ' + (r.lead.nombre || 'Inversor') +
             ' · ' + r.lead.email +
             ' · Tier ' + (r.lead.tier || '?') + ' (' + (r.lead.puntuacion || 0) + ' pts)');
    });
    L.push('');
  }

  if (!informe.perdidos.length && !informe.sospechosos.length && !informe.noParseables.length) {
    L.push('Sin incidencias. Todos los avisos recibidos estan registrados en el CRM.');
    L.push('');
  }

  L.push('--');
  L.push('Guardian del funnel · revision automatica cada ' + GUARDIAN_CFG.DIAS_ENTRE_INFORMES + ' dias.');
  L.push('Este proceso solo lee: no modifica leads, ni correos, ni el motor de emails.');

  return L.join('\n');
}

function guardianFichaLead_(lead) {
  const L = [];
  L.push('   Nombre  : ' + (lead.nombre || '(sin nombre)'));
  L.push('   Email   : ' + (lead.email || '(sin email)'));
  L.push('   Telefono: ' + (lead.telefono || '(no facilitado)'));
  L.push('   Pais    : ' + (lead.pais || '?'));
  L.push('   Tier    : ' + (lead.tier || '?') + ' (' + (lead.puntuacion || 0) + ' pts)');
  L.push('   Capital : ' + (lead.capital || '?'));
  L.push('   Objetivo: ' + (lead.objetivo || '?'));
  L.push('   Plazo   : ' + (lead.plazo || '?'));
  L.push('   Visita  : ' + (lead.viaje || '?'));
  const utm = [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ');
  if (utm) L.push('   Campana : ' + utm);
  if (lead.gclid) L.push('   gclid   : ' + lead.gclid);
  return L.join('\n');
}

function guardianResumenCorto_(informe) {
  return 'Guardian: avisos=' + informe.totalAvisos +
         ' | ok=' + informe.registrados.length +
         ' | perdidos=' + informe.perdidos.length +
         ' | no_parseables=' + informe.noParseables.length +
         ' | sospechosos=' + informe.sospechosos.length +
         ' | ignorados=' + informe.ignorados.length;
}

// ── Gestión del trigger ────────────────────────────────────────
/** Programa la revisión periódica. Ejecutar una sola vez. */
function guardianCrearTrigger() {
  guardianBorrarTrigger();
  ScriptApp.newTrigger('guardianRevisarFunnel')
    .timeBased()
    .everyDays(GUARDIAN_CFG.DIAS_ENTRE_INFORMES)
    .atHour(GUARDIAN_CFG.HORA_INFORME)
    .create();
  Logger.log('Guardian programado cada ' + GUARDIAN_CFG.DIAS_ENTRE_INFORMES +
             ' dias sobre las ' + GUARDIAN_CFG.HORA_INFORME + ':00.');
}

/** Retira la revisión periódica sin tocar el resto de triggers del proyecto. */
function guardianBorrarTrigger() {
  let borrados = 0;
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'guardianRevisarFunnel') {
      ScriptApp.deleteTrigger(t);
      borrados++;
    }
  });
  Logger.log('Triggers del guardian retirados: ' + borrados);
}
