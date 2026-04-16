// ═══════════════════════════════════════════════════════════════
// HORIZONTE EMIRATES — Email Automation
// Google Apps Script
//
// SETUP (ejecutar una sola vez):
//   1. Ir a script.google.com → nuevo proyecto
//   2. Pegar este código en Code.gs
//   3. Crear un Google Sheet vacío y copiar su ID en CONFIG.SPREADSHEET_ID
//   4. Ejecutar initSheets() para crear las hojas y cabeceras
//   5. Ejecutar createTriggers() para activar los automatismos
//   6. Autorizar los permisos que solicite (Gmail + Sheets)
// ═══════════════════════════════════════════════════════════════

// ── CONFIGURACIÓN ──────────────────────────────────────────────
const CONFIG = {
  SPREADSHEET_ID:  'PEGAR_AQUI_EL_ID_DEL_SPREADSHEET',
  ASESOR_NOMBRE:   'Horizonte Emirates',
  REPLY_TO:        'hola@horizonteemirates.com',
  WA_NUMBER:       '+971 554 722 025',
  CALENDLY_URL:    'https://calendly.com/horizonteemirates', // actualizar cuando esté activo
  UNSUBSCRIBE_URL: 'mailto:hola@horizonteemirates.com?subject=BAJA%20COMUNICACIONES',
  LABEL_PROCESADO: 'HE-procesado',
  // Buscar emails de Web3Forms no leídos con el asunto correcto
  POLL_QUERY: 'from:noreply@web3forms.com is:unread "Nuevo lead Horizonte Emirates"',
  TEST_MODE: false, // true = simula sin enviar emails reales (útil para pruebas)
};

// Etiquetas legibles para variables de email
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
// 1. POLL GMAIL — ejecuta cada 10 minutos
// ══════════════════════════════════════════════════════════════
function pollGmail() {
  const threads = GmailApp.search(CONFIG.POLL_QUERY, 0, 20);
  if (!threads.length) return;

  // Obtener o crear la etiqueta de procesado
  let label;
  try {
    label = GmailApp.getUserLabelByName(CONFIG.LABEL_PROCESADO)
         || GmailApp.createLabel(CONFIG.LABEL_PROCESADO);
  } catch(e) {
    label = GmailApp.createLabel(CONFIG.LABEL_PROCESADO);
  }

  threads.forEach(thread => {
    try {
      const msg     = thread.getMessages().pop(); // último mensaje
      const subject = msg.getSubject();
      const body    = msg.getPlainBody();

      const lead = parseLeadFromEmail(body, subject);

      if (!lead || !lead.email) {
        Logger.log('No se pudo parsear lead del email: ' + subject);
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

      const leadId = saveLead(lead);
      scheduleSequence(leadId, lead.tier, new Date());

      thread.addLabel(label);
      msg.markRead();
      Logger.log(`Lead procesado: ${lead.nombre} [Tier ${lead.tier} | ${lead.puntuacion}pts] → ${lead.email}`);

    } catch(e) {
      Logger.log('Error procesando thread: ' + e.toString());
    }
  });
}


// ══════════════════════════════════════════════════════════════
// 2. PARSEAR EMAIL DE WEB3FORMS
// ══════════════════════════════════════════════════════════════
function parseLeadFromEmail(body, subject) {
  const lead = {};

  // Tier desde el subject: "[A|11pts] ..." o "[A] ..."
  const tierMatch = subject.match(/\[([ABC])/);
  lead.tier = tierMatch ? tierMatch[1] : 'C';

  // Puntuación desde el subject: "[A|11pts]"
  const scoreMatch = subject.match(/\|(\d+)pts/);
  lead.puntuacion = scoreMatch ? parseInt(scoreMatch[1]) : 0;

  // Parser de líneas "clave: valor" (formato estándar Web3Forms)
  body.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
    if (!m) return;
    const key = m[1].trim().toLowerCase().replace(/\s+/g, '_');
    const val = m[2].trim();

    switch (key) {
      case 'nombre':          lead.nombre      = val; break;
      case 'email':           lead.email       = val.toLowerCase(); break;
      case 'telefono':        lead.telefono    = val; break;
      case 'pais':            lead.pais        = val; break;
      case 'capital':         lead.capital     = val; break;
      case 'objetivo':        lead.objetivo    = val; break;
      case 'experiencia':     lead.experiencia = val; break;
      case 'plazo':           lead.plazo       = val; break;
      case 'viaje':
      case 'viaje_dubai':     lead.viaje       = val; break;
      case 'canal':
      case 'canal_preferido': lead.canal       = val; break;
      case 'tier':            lead.tier        = val; break;  // sobreescribir si es campo explícito
      case 'puntuacion':      lead.puntuacion  = parseInt(val) || lead.puntuacion; break;
      case 'origen':          lead.origen      = val; break;
    }
  });

  // Valores por defecto
  lead.nombre     = lead.nombre || 'Inversor';
  lead.pais       = lead.pais   || 'España';
  lead.canal      = lead.canal  || 'email';
  lead.origen     = lead.origen || 'Formulario web';

  return lead.email ? lead : null;
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

function saveLead(data) {
  const id  = 'L' + new Date().getTime().toString().slice(-8);
  const now = new Date();
  getSheet('Leads').appendRow([
    id,
    data.nombre,
    data.email,
    data.telefono    || '',
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
    now,           // Fecha creación
    'activo',      // Estado
    '',            // Notas
  ]);
  return id;
}

function scheduleSequence(leadId, tier, createdAt) {
  const sheet    = getSheet('Cola');
  const sequence = SEQUENCES[tier] || SEQUENCES['C'];
  sequence.forEach(item => {
    const scheduledAt = new Date(createdAt.getTime() + item.delay * 3600 * 1000);
    sheet.appendRow([
      leadId,
      item.code,
      scheduledAt,
      'pendiente',
      '',   // Fecha envío real
      '',   // Error
    ]);
  });
}


// ══════════════════════════════════════════════════════════════
// 4. PROCESAR COLA — ejecuta cada hora
// ══════════════════════════════════════════════════════════════
function processQueue() {
  const qSheet = getSheet('Cola');
  const lSheet = getSheet('Leads');
  const now    = new Date();

  const qData  = qSheet.getDataRange().getValues();
  const lData  = lSheet.getDataRange().getValues();

  // Indexar leads por ID para búsqueda rápida
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
    if (!lead) {
      qSheet.getRange(i + 1, 4).setValue('error: lead no encontrado');
      continue;
    }
    if (lead.estado === 'baja' || lead.estado === 'cerrado') {
      qSheet.getRange(i + 1, 4).setValue('cancelado');
      continue;
    }

    try {
      if (!CONFIG.TEST_MODE) {
        sendEmail(emailCode, lead);
      } else {
        Logger.log('[TEST] Simularía envío: ' + emailCode + ' → ' + lead.email);
      }
      qSheet.getRange(i + 1, 4).setValue('enviado');
      qSheet.getRange(i + 1, 5).setValue(now);
      Logger.log('Email enviado: ' + emailCode + ' → ' + lead.email);
    } catch(e) {
      qSheet.getRange(i + 1, 4).setValue('error');
      qSheet.getRange(i + 1, 6).setValue(e.toString());
      Logger.log('Error en ' + emailCode + ': ' + e.toString());
    }
  }
}


// ══════════════════════════════════════════════════════════════
// 5. ENVIAR UN EMAIL
// ══════════════════════════════════════════════════════════════
function sendEmail(code, lead) {
  const tpl = getTemplate(code, lead);
  if (!tpl) throw new Error('Template no encontrado: ' + code);

  GmailApp.sendEmail(lead.email, tpl.subject, tpl.text, {
    name:     CONFIG.ASESOR_NOMBRE,
    htmlBody: tpl.html,
    replyTo:  CONFIG.REPLY_TO,
  });
}


// ══════════════════════════════════════════════════════════════
// 6. TEMPLATES DE EMAIL
// ══════════════════════════════════════════════════════════════
function getTemplate(code, lead) {
  const n   = lead.nombre  || 'inversor';
  const cap = CAPITAL_LABELS[lead.capital]   || lead.capital  || 'su capital disponible';
  const obj = OBJETIVO_LABELS[lead.objetivo] || lead.objetivo || 'su objetivo de inversión';
  const pais = lead.pais || 'España';
  const wa  = CONFIG.WA_NUMBER;
  const cal = CONFIG.CALENDLY_URL;

  // Bloques HTML reutilizables
  const waBtn  = `<br>→ <strong>WhatsApp:</strong> <a href="https://wa.me/${wa.replace(/[\s+]/g,'')}">${wa}</a>`;
  const calBtn = `→ <strong>Reservar llamada:</strong> <a href="${cal}">${cal}</a><br>`;
  const firma  = `
<br><br>Un saludo,<br><strong>${CONFIG.ASESOR_NOMBRE}</strong><br>
<a href="mailto:${CONFIG.REPLY_TO}">${CONFIG.REPLY_TO}</a> · WhatsApp: ${wa}<br>
<a href="https://horizonteemirates.com">horizonteemirates.com</a><br><br>
<small><em>Horizonte Emirates es un servicio de Propulse SLU (Andorra). No prestamos asesoramiento fiscal, jurídico ni financiero. La información facilitada es orientativa.</em></small><br>
<small><a href="${CONFIG.UNSUBSCRIBE_URL}">Darse de baja de estas comunicaciones</a></small>`;

  // ── TIER A ───────────────────────────────────────────────────
  if (code === 'A1') return {
    subject: `Su análisis de inversión en Dubai ya está en preparación, ${n}`,
    html: `<p>Estimado/a ${n},</p>
<p>Hemos recibido su consulta y ya estamos preparando su análisis personalizado.</p>
<p>Con un presupuesto de <strong>${cap}</strong> y el objetivo de <strong>${obj}</strong>, tenemos activos verificados en cartera que se ajustan exactamente a lo que busca.</p>
<p><strong>Recibirá antes de 24 horas:</strong><br>
— Mínimo 3 propiedades seleccionadas para su capital y objetivo<br>
— Rentabilidades netas verificadas por zona (Dubai, RAK, Abu Dhabi)<br>
— Condiciones de entrada y calendario de pagos para cada activo</p>
<p>Si prefiere hablar directamente, puede contactarnos ahora:${waBtn}</p>
<p>Nuestro equipo está disponible en español.${firma}`,
    text: `Estimado/a ${n},\n\nAnálisis en preparación para ${cap} · ${obj}.\nEn 24h: 3 propiedades, rentabilidades verificadas, condiciones de entrada.\n\nContacto: WhatsApp ${wa} / ${CONFIG.REPLY_TO}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'A2') return {
    subject: `${n}, hemos seleccionado 3 activos para su perfil`,
    html: `<p>Estimado/a ${n},</p>
<p>Su análisis ya está completo. Para un perfil como el suyo (<strong>${cap} · ${obj}</strong>):</p>
<p>— <strong>Dubai Marina / Business Bay:</strong> off-plan desde 280.000 €. Rentabilidad estimada 7–8% neto. Promotoras RERA verificadas.<br>
— <strong>Ras Al Khaimah:</strong> ventana pre-apertura Wynn (2027). Proyección +20–30% de plusvalía. Tickets desde 200.000 €.<br>
— <strong>Abu Dhabi (Aldar Properties):</strong> respaldo soberano. Rentabilidad 5–7% neto. Mayor estabilidad.</p>
<p>Para ver las propiedades concretas, solo necesito 20 minutos de llamada. ¿Le va bien hoy o mañana?<br>
${calBtn}${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nAnálisis listo para ${cap} · ${obj}:\n- Dubai Marina/Business Bay: 7–8% neto\n- RAK pre-Wynn: +20-30% plusvalía\n- Abu Dhabi Aldar: 5-7% neto\n\n¿20 min esta semana? ${cal} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'A3') return {
    subject: `Una cosa que no le he dicho sobre su perfil, ${n}`,
    html: `<p>Estimado/a ${n},</p>
<p>Le escribo porque hay algo relevante que quiero compartirle antes de que pase más tiempo.</p>
<p>Los activos off-plan que mejor encajan con un perfil como el suyo (<strong>${cap}</strong>, <strong>${obj}</strong>) tienen ventanas de entrada limitadas. No es un recurso de ventas: es la mecánica real del mercado. Cuando se llena el aforo de una fase, el precio sube o desaparece.</p>
<p>No le pido que decida ahora. Le pido 20 minutos para que tenga toda la información y pueda decidir con criterio.${waBtn}<br>
${calBtn}${firma}`,
    text: `Estimado/a ${n},\n\nLos activos para ${cap} · ${obj} tienen ventanas de entrada limitadas. No pido decisión — pido 20 min.\n\nWhatsApp ${wa} / ${cal}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'A4') return {
    subject: `¿Ha pensado en visitar Dubai antes de decidir?`,
    html: `<p>Estimado/a ${n},</p>
<p>El <strong>45% de los inversores que visitan Dubai en persona</strong> acaban cerrando operación. Los que solo lo estudian desde casa, raramente lo hacen.</p>
<p>Organizamos ese viaje para usted: agenda de visitas, reuniones con promotoras RERA y acompañamiento local en Dubai. <strong>Sin coste para el inversor.</strong> Solo vuelo y alojamiento de su parte.</p>
<p>¿Le interesa saber cómo funciona?${waBtn}<br>
${calBtn}${firma}`,
    text: `Estimado/a ${n},\n\n45% de inversores que visitan Dubai en persona cierran operación.\n\nOrganizamos el viaje: agenda, promotoras, equipo local. Sin coste. Solo vuelo y alojamiento.\n\nWhatsApp ${wa} / ${cal}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'A5') return {
    subject: `${n}, ¿sigue interesado en invertir en Dubai?`,
    html: `<p>Estimado/a ${n},</p>
<p>Le he escrito en varias ocasiones sin recibir respuesta, así que quiero ser directo.</p>
<p><strong>¿Sigue siendo Dubai una prioridad para usted en este momento?</strong></p>
<p>No hay ningún compromiso. Si el momento no es el adecuado, lo entiendo perfectamente. Solo necesito saberlo para no seguirle enviando información que quizás no es relevante ahora.</p>
<p>Si sigue interesado, una respuesta a este email o un mensaje por WhatsApp es suficiente. En 24 horas le tengo todo preparado.${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\n¿Sigue siendo Dubai una prioridad?\n\nSi sigue interesado, responda este email o WhatsApp ${wa}. En 24h lo tengo preparado.\n\nEquipo Horizonte Emirates`,
  };

  // ── TIER B ───────────────────────────────────────────────────
  if (code === 'B1') return {
    subject: `Recibida su consulta, ${n} — le contactamos en 24 horas`,
    html: `<p>Estimado/a ${n},</p>
<p>Gracias por contactar con Horizonte Emirates.</p>
<p>Hemos recibido su consulta y ya estamos preparando un análisis adaptado a su perfil: <strong>${cap}</strong> con el objetivo de <strong>${obj}</strong>.</p>
<p>En menos de 24 horas recibirá:<br>
— Activos seleccionados para su capital y objetivo<br>
— Comparativa de zonas y rentabilidades verificadas<br>
— Próximos pasos si le interesa profundizar</p>
<p>Cualquier pregunta, estamos disponibles en español.${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nConsulta recibida para ${cap} · ${obj}.\n\nEn 24h: activos seleccionados, comparativa zonas, próximos pasos.\n\nWhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B2') return {
    subject: `${n}, ¿cuándo tiene 20 minutos para hablar?`,
    html: `<p>Estimado/a ${n},</p>
<p>Tenemos los activos preparados para su perfil (<strong>${cap} · ${obj}</strong>) y me gustaría presentárselos personalmente. Son 20 minutos donde le explico las opciones concretas, las rentabilidades reales y el proceso completo.</p>
<p>Sin compromiso. Sin presión. Solo información que le permita decidir con criterio.</p>
<p>¿Cuándo le va bien esta semana?<br>
${calBtn}${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nActivos listos para ${cap} · ${obj}. ¿20 minutos esta semana?\n\nSin compromiso. ${cal} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B3') return {
    subject: `La guía que le hubiera gustado tener antes de empezar a mirar Dubai`,
    html: `<p>Estimado/a ${n},</p>
<p><strong>Lo que debe saber antes de invertir en Dubai:</strong></p>
<p><strong>1. Fiscalidad en UAE</strong><br>Cero IRPF. Cero sobre plusvalías. Cero sobre alquileres. El rendimiento es íntegramente suyo.</p>
<p><strong>2. Sus obligaciones en ${pais}</strong><br>Como residente fiscal, deberá declarar el activo en el Modelo 720 (a partir de 50.000 €) y tributar rentas en IRPF. Consulte con su asesor fiscal. <em>Nosotros no prestamos asesoramiento fiscal.</em></p>
<p><strong>3. El proceso de compra</strong><br>RERA regula todas las transacciones. Proceso seguro y trazable. Firmará un SPA y abonará un primer tramo del 10–20%.</p>
<p><strong>4. El capital mínimo real</strong><br>En off-plan, la entrada es del 10–20% del valor. Con 30.000 € puede acceder a activos desde 150.000 €.</p>
<p>Cualquier duda, le respondo directamente.${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nGuía Dubai desde ${pais}:\n1. UAE: sin IRPF, sin tributación plusvalías\n2. ${pais}: Modelo 720 + rentas en IRPF (consulte asesor fiscal)\n3. RERA: protege comprador. SPA + 10-20% entrada\n4. Off-plan: entrada desde 30.000 €\n\nDudas: WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B4') return {
    subject: `Lo que cambia cuando ves Dubai en persona`,
    html: `<p>Estimado/a ${n},</p>
<p>Más del <strong>45% de los inversores que visitan Dubai en persona</strong> acaban cerrando una operación. La mayoría de los que solo lo estudian desde casa, no.</p>
<p>Ver el activo en persona, entender el entorno y hablar directamente con el promotor elimina las dudas que ningún PDF puede resolver.</p>
<p>Por eso organizamos ese viaje para nuestros inversores: agenda de visitas, reuniones con promotoras verificadas y acompañamiento de nuestro equipo local. <strong>Sin coste para el inversor</strong> — solo vuelo y alojamiento.${waBtn}<br>
${calBtn}${firma}`,
    text: `Estimado/a ${n},\n\n45% de inversores que visitan Dubai en persona cierran operación.\n\nOrganizamos el viaje sin coste: agenda, promotoras, equipo local.\n\nWhatsApp ${wa} / ${cal}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B5') return {
    subject: `${n}, esto es lo que tenemos disponible esta semana`,
    html: `<p>Estimado/a ${n},</p>
<p>Actualización del mercado relevante para su perfil (<strong>${cap} · ${obj}</strong>):</p>
<p>— <strong>Residencial off-plan Dubai (Marina/JVC):</strong> entrada desde 15%. Entrega 2026–2027. Rentabilidad estimada 7–8% neto.<br>
— <strong>RAK pre-apertura Wynn:</strong> mejor precio de entrada antes del evento 2027. Ticket desde 200.000 €.<br>
— <strong>Residencial consolidado Abu Dhabi:</strong> rentabilidad inmediata. 5–7% neto, baja volatilidad.</p>
<p>20 minutos para presentarle los números reales de cada uno.${calBtn}${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nDisponible esta semana para ${cap} · ${obj}:\n- Dubai Marina/JVC: 7-8% neto\n- RAK pre-Wynn: máx. apreciación\n- Abu Dhabi: 5-7% neto, estable\n\n20 min. ${cal} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B6') return {
    subject: `¿Sigue pensando en Dubai, ${n}?`,
    html: `<p>Estimado/a ${n},</p>
<p>Han pasado casi tres semanas desde su consulta inicial y no hemos podido hablar.</p>
<p>Le propongo algo sin compromiso: una llamada de 15 minutos donde le cuento exactamente cómo funciona el proceso para alguien con su perfil. Sin presentaciones, sin presión. Solo información.${waBtn}<br>
${calBtn}${firma}`,
    text: `Estimado/a ${n},\n\nTres semanas sin poder hablar. 15 minutos sin compromiso para responder sus dudas.\n\nWhatsApp ${wa} / ${cal}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'B7') return {
    subject: `${n}, un último mensaje antes de pausar`,
    html: `<p>Estimado/a ${n},</p>
<p>Voy a pausar el seguimiento activo, pero quiero dejarle algo antes.</p>
<p>Si en algún momento —en tres meses, en seis, en un año— decide explorar en serio la inversión en Dubai, encontrará nuestro contacto en este email.</p>
<p>El mercado de Dubai no va a desaparecer. Cuando esté listo para hablar, seguiremos aquí.</p>
<p>→ <a href="mailto:${CONFIG.REPLY_TO}">${CONFIG.REPLY_TO}</a> · WhatsApp: ${wa}</p>
<p>Gracias por su tiempo.${firma}`,
    text: `Estimado/a ${n},\n\nPauso el seguimiento. Cuando esté listo, seguiremos aquí.\n\n${CONFIG.REPLY_TO} / WhatsApp ${wa}\n\nGracias. Equipo Horizonte Emirates`,
  };

  // ── TIER C ───────────────────────────────────────────────────
  if (code === 'C1') return {
    subject: `Recibida su consulta sobre inversión en Dubai, ${n}`,
    html: `<p>Estimado/a ${n},</p>
<p>Gracias por contactar con Horizonte Emirates.</p>
<p>Entendemos que en esta etapa lo más valioso es información clara y honesta — no una propuesta comercial precipitada.</p>
<p>En los próximos días le enviaremos contenido que le ayudará a:<br>
— Entender cómo funciona el mercado inmobiliario en UAE<br>
— Conocer las implicaciones fiscales para residentes en ${pais}<br>
— Comparar la rentabilidad real de Dubai frente a mercados europeos</p>
<p>Cuando esté listo/a para dar un paso más, aquí estaremos.${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nConsulta recibida. Le enviaremos contenido claro sobre el mercado UAE, fiscalidad para ${pais} y comparativas de rentabilidad.\n\nSin prisa. Cuando esté listo/a, aquí estaremos.\n\nWhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C2') return {
    subject: `España vs. Dubai: los números que nadie le pone encima de la mesa`,
    html: `<p>Estimado/a ${n},</p>
<p><strong>En España hoy:</strong><br>
Rentabilidad neta del alquiler: 2,5–4% (antes de IRPF, IBI, derramas y vacancias). Inseguridad jurídica creciente: morosos, ocupaciones, intervención del mercado. Tributación de plusvalías en la venta.</p>
<p><strong>En Dubai hoy:</strong><br>
Rentabilidad neta activos Prime: 6–9% (sin IRPF, sin IBI, sin tributación de plusvalías en UAE). Marco RERA: recuperación del inmueble en semanas, no años. 270.000 transacciones solo en 2025.</p>
<p>No estoy diciendo que Dubai sea para todo el mundo. Estoy diciendo que los números merecen ser comparados.</p>
<p>Si quiere la comparativa completa adaptada a su perfil, responda a este email.${firma}`,
    text: `Estimado/a ${n},\n\nEspaña: 2,5-4% neto, inseguridad jurídica, tributación plusvalías.\nDubai: 6-9% neto, RERA protege propietario, sin IBI ni IRPF en UAE.\n\n¿Comparativa completa para su perfil? Responda este email o WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C3') return {
    subject: `Antes de invertir en Dubai desde España, lea esto`,
    html: `<p>Estimado/a ${n},</p>
<p>Uno de los mayores frenos que tienen los inversores españoles es la falta de información práctica sobre el proceso. Hoy quiero resolver eso.</p>
<p><strong>El proceso real, paso a paso:</strong></p>
<p><strong>1.</strong> Selección de activos verificados adaptados a su perfil — no generalidades, oportunidades concretas.<br>
<strong>2.</strong> Due diligence en RERA: verificamos promotor y situación legal del proyecto.<br>
<strong>3.</strong> Reserva con depósito (5.000–10.000 AED) + firma del SPA.<br>
<strong>4.</strong> Pagos escalonados en off-plan (típicamente 30/30/40 hasta entrega).<br>
<strong>5.</strong> Obligaciones en ${pais}: Modelo 720 + tributar rentas en IRPF. <em>Recomendamos asesor fiscal internacional — nosotros no lo prestamos.</em></p>
<p>¿Alguna duda? Responda aquí o WhatsApp ${wa}${firma}`,
    text: `Estimado/a ${n},\n\nProceso de compra en Dubai:\n1. Selección verificada RERA\n2. Depósito + SPA\n3. Pagos escalonados (30/30/40)\n4. ${pais}: Modelo 720 + rentas en IRPF\n\nDudas: WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C4') return {
    subject: `Lo que hizo un inversor español con 200.000 € en Dubai`,
    html: `<p>Estimado/a ${n},</p>
<p><strong>Perfil:</strong> Inversor residente en España, 47 años. Capital: 200.000 €. Objetivo: diversificación + renta pasiva.</p>
<p><strong>Lo que hizo:</strong> Adquirió dos activos off-plan en Dubai (Business Bay + RAK) con entrada combinada de 60.000 € (30% del total). El resto se paga en cuotas hasta la entrega en 2026.</p>
<p><strong>Proyección:</strong><br>
Rentabilidad estimada en alquiler al término: 7,2% neto anual.<br>
Plusvalía proyectada en RAK pre-Wynn: +18–22%.</p>
<p>Proceso completo en 6 semanas. Dos videoconferencias + visita presencial de 3 días. Todo en español, sin coste.</p>
<p>¿Hay opciones similares para su perfil? Responda aquí o WhatsApp ${wa}${firma}<br>
<small><em>Datos orientativos. Las rentabilidades futuras no están garantizadas.</em></small>`,
    text: `Estimado/a ${n},\n\nCaso real: inversor español, 200k€, entrada 60k€ en dos activos off-plan.\nProyección: 7,2% neto alquiler + 18-22% plusvalía RAK.\n6 semanas, todo en español, sin coste.\n\n¿Opciones similares? WhatsApp ${wa}\n\n(Datos orientativos, rentabilidades no garantizadas)\nEquipo Horizonte Emirates`,
  };

  if (code === 'C5') return {
    subject: `La oportunidad que tiene fecha de caducidad: Ras Al Khaimah`,
    html: `<p>Estimado/a ${n},</p>
<p>En 2027 abre en RAK el primer resort-casino de la región MENA, desarrollado por Wynn Resorts. Los activos comprados hoy —antes del evento— tienen proyecciones de apreciación del <strong>20–35%</strong> antes de la apertura.</p>
<p>La ventana de entrada a precios actuales se está cerrando progresivamente.</p>
<p>Para un perfil como el suyo (<strong>${cap}</strong>, <strong>${obj}</strong>), RAK puede ser la pieza de mayor potencial de apreciación en un portfolio UAE.</p>
<p>¿Le interesa ver las opciones actuales?${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nRAK + Wynn 2027: proyección +20-35% antes de la apertura. Ventana de entrada limitada.\n\nPara ${cap} · ${obj}, es la pieza de mayor potencial.\n\nWhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C6') return {
    subject: `Una consulta de 20 minutos puede valer mucho, ${n}`,
    html: `<p>Estimado/a ${n},</p>
<p>Ha pasado un mes desde que nos dejó su consulta. Le propongo 20 minutos donde:<br>
— Le presento opciones actuales para <strong>${cap} · ${obj}</strong><br>
— Resuelvo dudas sobre proceso, fiscalidad o mercado<br>
— Le digo con honestidad si Dubai tiene sentido para usted en este momento</p>
<p>Si concluimos que no es el momento o que no encaja, se lo digo directamente. Sin presión ni seguimiento posterior si no lo desea.${calBtn}${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nUn mes desde su consulta. 20 minutos para presentarle opciones para ${cap} · ${obj} y decirle con honestidad si Dubai tiene sentido ahora.\n\nSin compromiso. ${cal} / WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C7') return {
    subject: `Actualización del mercado inmobiliario en Dubai — abril 2026`,
    html: `<p>Estimado/a ${n},</p>
<p><strong>Resumen del mercado — abril 2026:</strong><br>
— Zonas Prime (Marina, Downtown, Palm): +4–6% en lo que va de 2026.<br>
— RAK: sigue siendo la zona con mayor potencial de apreciación.<br>
— Off-plan: opción más accesible para capital inicial de 150.000–300.000 €.</p>
<p>Para su perfil (<strong>${cap} · ${obj}</strong>), tenemos activos disponibles ahora que encajan con lo que nos indicó.</p>
<p>→ Responda a este email si quiere verlos<br>${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nActualización abril 2026: Zonas Prime +4-6%, RAK máximo potencial, off-plan desde 150k.\n\nActivos disponibles para ${cap} · ${obj}. ¿Le los presento? WhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  if (code === 'C8') return {
    subject: `${n}, hace tres meses nos dejó su consulta`,
    html: `<p>Estimado/a ${n},</p>
<p>Hace tres meses nos dejó su consulta. No sé si el momento fue el adecuado entonces, ni si lo es ahora. Pero el mercado ha cambiado:</p>
<p>— Off-plan en zonas emergentes: +8–12% en 90 días.<br>
— Ventana pre-Wynn en RAK: se sigue reduciendo.<br>
— Demanda de alquiler en Dubai Prime: en máximos.</p>
<p>Si Dubai sigue en su cabeza, aunque sea de fondo, responda a este email con una línea diciéndome si sigue en su radar. Sin presión, sin llamadas si no las quiere.${waBtn}${firma}`,
    text: `Estimado/a ${n},\n\nTres meses desde su consulta. El mercado ha cambiado: off-plan emergente +8-12%, RAK pre-Wynn se acorta, demanda alquiler en máximos.\n\n¿Sigue Dubai en su radar? Solo una línea de respuesta.\n\nWhatsApp ${wa}\n\nEquipo Horizonte Emirates`,
  };

  return null; // código no encontrado
}


// ══════════════════════════════════════════════════════════════
// 7. GESTIÓN DE BAJAS
// ══════════════════════════════════════════════════════════════
function markUnsubscribed(email) {
  const sheet = getSheet('Leads');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if ((data[i][2] || '').toLowerCase() === email.toLowerCase()) {
      sheet.getRange(i + 1, 16).setValue('baja');
      Logger.log('Baja registrada: ' + email);
      return true;
    }
  }
  return false;
}

// Usar manualmente cuando un lead responde solicitando la baja:
// markUnsubscribed('email@ejemplo.com');


// ══════════════════════════════════════════════════════════════
// 8. SETUP INICIAL — ejecutar una sola vez
// ══════════════════════════════════════════════════════════════
function initSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // Hoja Leads
  let sh = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['ID','Nombre','Email','Teléfono','País','Capital','Objetivo',
                  'Experiencia','Plazo','Viaje','Puntuación','Tier','Canal',
                  'Origen','Fecha creación','Estado','Notas']);
    sh.setFrozenRows(1);
    sh.getRange('1:1').setFontWeight('bold');
  }

  // Hoja Cola
  let qsh = ss.getSheetByName('Cola') || ss.insertSheet('Cola');
  if (qsh.getLastRow() === 0) {
    qsh.appendRow(['Lead ID','Email código','Fecha programada','Estado','Fecha envío','Error']);
    qsh.setFrozenRows(1);
    qsh.getRange('1:1').setFontWeight('bold');
  }

  Logger.log('Hojas inicializadas: Leads + Cola');
}

function createTriggers() {
  // Eliminar triggers anteriores de estas funciones (evita duplicados)
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'pollGmail' || fn === 'processQueue') ScriptApp.deleteTrigger(t);
  });

  // pollGmail: cada 10 minutos
  ScriptApp.newTrigger('pollGmail').timeBased().everyMinutes(10).create();
  // processQueue: cada hora
  ScriptApp.newTrigger('processQueue').timeBased().everyHours(1).create();

  Logger.log('Triggers activos: pollGmail cada 10 min · processQueue cada hora');
}


// ══════════════════════════════════════════════════════════════
// 9. FUNCIONES DE PRUEBA — ejecutar manualmente para validar
// ══════════════════════════════════════════════════════════════

// Prueba todos los templates de un tier
function testTemplates(tier) {
  const lead = {
    nombre: 'Ana García', email: 'test@example.com',
    capital: '300k-600k', objetivo: 'alquiler',
    pais: 'España', tier: tier || 'A',
  };
  const seq = SEQUENCES[tier || 'A'];
  seq.forEach(item => {
    const tpl = getTemplate(item.code, lead);
    Logger.log(`\n── ${item.code} ──\nSubject: ${tpl ? tpl.subject : 'NOT FOUND'}`);
  });
}

// Simula un lead completo sin enviar emails (TEST_MODE debe ser true)
function testFullFlow() {
  const fakeBody = `nombre: Test Usuario\nemail: test@example.com\ntelefono: +34 600 123 456\npais: España\ncapital: 300k-600k\nobjetivo: alquiler\nexperiencia: previa\nplazo: ya\nviaje_dubai: si\ncanal_preferido: whatsapp\ntier: A\npuntuacion: 13\norigen: Formulario web`;
  const fakeSubject = '[A|13pts] Nuevo lead Horizonte Emirates · España';

  const lead = parseLeadFromEmail(fakeBody, fakeSubject);
  Logger.log('Parsed lead: ' + JSON.stringify(lead));

  if (lead) {
    const id = saveLead(lead);
    scheduleSequence(id, lead.tier, new Date());
    Logger.log('Lead guardado: ' + id + ' | Secuencia ' + lead.tier + ' programada.');
  }
}
