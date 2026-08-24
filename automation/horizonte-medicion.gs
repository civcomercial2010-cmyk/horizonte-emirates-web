/**
 * horizonte-medicion.gs: Medición de leads del lado del servidor
 * Horizonte Emirates / Propulse SLU
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ---------------------------
 * El 22-ago-2026 entró un lead real (con gclid de Google Ads, scoring B y prueba
 * de consentimiento correcta) que GA4 no registró en absoluto: ni generate_lead,
 * ni form_start, ni siquiera page_view. El JavaScript de la web se ejecutó entero,
 * pero `gtag` no estaba disponible en ese navegador (bloqueador o protección de
 * rastreo), y trackGAEvent() sale en silencio cuando eso pasa.
 *
 * Consecuencia: 1 de cada 4 leads era invisible para GA4, y como Google Ads recibe
 * las conversiones importadas desde GA4 (ADS_CONVERSION_LABEL está vacío en app.js),
 * el algoritmo de puja optimizaba con el 75% de las señales.
 *
 * Este archivo mide desde el servidor, leyendo el CRM que ya alimenta pollGmail.
 * Es inmune a bloqueadores, a consentimiento denegado y a fallos de JavaScript.
 *
 * ARCHIVO APARTE A PROPÓSITO: no toca horizonte-emails.gs. Solo lee el Sheet y
 * escribe en dos columnas propias (31 y 32) para no reenviar lo ya enviado.
 *
 * ORDEN DE PUESTA EN MARCHA
 *   1. Rellenar las propiedades de secuencia de comandos (ver PROPIEDADES).
 *   2. medicionProbar()        → no envía nada, enseña qué haría.
 *   3. Poner DRY_RUN en false.
 *   4. medicionProcesar()      → envío real.
 *   5. medicionCrearTrigger()  → cada hora, automático.
 *
 * PROPIEDADES (Apps Script → ⚙ Configuración → Propiedades de la secuencia de comandos)
 *   HE_SPREADSHEET_ID              ya existe, la usa horizonte-emails.gs
 *   HE_GA4_MEASUREMENT_ID          G-BK37V83363
 *   HE_GA4_API_SECRET              GA4 → Administrar → Flujos de datos → Measurement Protocol
 *   HE_ADS_CUSTOMER_ID             10 dígitos, sin guiones, cuenta de Horizonte Emirates
 *   HE_ADS_LOGIN_CUSTOMER_ID       DEJAR VACIA. La cuenta 9036779703 se accede en
 *                                  directo; declarar el MCC 9377266839 devuelve
 *                                  403 USER_PERMISSION_DENIED (verificado 24-ago-2026).
 *   HE_ADS_DEVELOPER_TOKEN         token de desarrollador de Google Ads
 *   HE_ADS_CLIENT_ID               del google-ads.yaml
 *   HE_ADS_CLIENT_SECRET           del google-ads.yaml
 *   HE_ADS_REFRESH_TOKEN           del google-ads.yaml
 *   HE_ADS_CONVERSION_ACTION_ID    ID numérico de la acción de conversión de importación
 *   HE_ADS_API_VERSION             opcional, por defecto v25. Vivas a 24-ago-2026:
 *                                  v22 a v25. De v21 hacia atras dan 404.
 */

// ── CONFIGURACIÓN ──────────────────────────────────────────────
const MED_CFG = {
  /**
   * INTERRUPTOR DE SEGURIDAD. true = no envía nada a ningún sitio, solo registra
   * en el log lo que haría. Se deja en true hasta haber visto una pasada limpia.
   */
  DRY_RUN: false,

  /**
   * Interruptores por canal. Permiten activar uno sin el otro.
   *
   * ENVIAR_ADS está en false a propósito (24-ago-2026): la cuenta tiene tres
   * acciones de conversión marcadas como principales (evento GA4 generate_lead,
   * etiqueta web del formulario y clic de WhatsApp flotante), de modo que un
   * mismo lead ya se cuenta dos y hasta tres veces. Subir además las nuestras
   * agravaría el problema en lugar de arreglarlo.
   *
   * Ponerlo en true SOLO cuando la agencia haya dejado «Lead HE servidor»
   * (7731869219) como única principal y las otras tres como secundarias.
   * Después, ejecutar medicionBackfill() para recuperar el histórico.
   */
  ENVIAR_GA4: true,
  ENVIAR_ADS: false,

  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('HE_SPREADSHEET_ID'),
  SHEET_LEADS: 'Leads',

  /** Mismos importes que app.js (LEAD_VALUE_EUR). Si cambian allí, cambiar aquí. */
  LEAD_VALUE_EUR: { A: 300, B: 120, C: 40 },

  /**
   * Antigüedad máxima para enviar a GA4. El Measurement Protocol descarta
   * eventos de más de 72 horas, así que no tiene sentido intentarlo.
   */
  GA4_MAX_HORAS: 71,

  /**
   * Antigüedad máxima para subir a Google Ads. El límite oficial del gclid es
   * de 90 días; se deja margen para no jugársela con la zona horaria.
   */
  ADS_MAX_DIAS: 88,

  /** Columnas del Sheet «Leads» (1-indexadas), tal y como las escribe saveLead(). */
  COL: {
    ID: 1, NOMBRE: 2, EMAIL: 3, PAIS: 5, CAPITAL: 6, PLAZO: 9,
    PUNTUACION: 11, TIER: 12, CANAL: 13, ORIGEN: 14, FECHA: 15, ESTADO: 16,
    UTM_SOURCE: 18, UTM_MEDIUM: 19, UTM_CAMPAIGN: 20,
    GCLID: 23, GBRAID: 24, WBRAID: 25,
    // Columnas propias de este archivo. No las escribe saveLead().
    MED_GA4: 31,
    MED_ADS: 32,
  },
  TZ: 'Europe/Madrid',
};

function medProp_(clave, porDefecto) {
  return PropertiesService.getScriptProperties().getProperty(clave) || porDefecto || '';
}

function medValorLead_(tier) {
  return MED_CFG.LEAD_VALUE_EUR[String(tier || 'C').toUpperCase()] || MED_CFG.LEAD_VALUE_EUR.C;
}


// ── PUNTOS DE ENTRADA ──────────────────────────────────────────

/**
 * Pasada normal. Envía a GA4 y a Google Ads los leads pendientes.
 * Es la función del trigger horario.
 */
function medicionProcesar() {
  return medicionEjecutar_({ dias: 90, forzar: false });
}

/**
 * Ensayo: no envía nada, escribe en el log qué haría con cada lead.
 * Ejecutar SIEMPRE esto antes de poner DRY_RUN en false.
 */
function medicionProbar() {
  const previo = MED_CFG.DRY_RUN;
  MED_CFG.DRY_RUN = true;
  try {
    const r = medicionEjecutar_({ dias: 90, forzar: false });
    Logger.log('ENSAYO terminado. Nada se ha enviado.');
    return r;
  } finally {
    MED_CFG.DRY_RUN = previo;
  }
}

/**
 * Recuperación del histórico. Sube a Google Ads los leads ya registrados que
 * nunca llegaron a la cuenta. GA4 rechazará los de más de 72 horas: es una
 * limitación del Measurement Protocol, no un fallo, y el resumen lo indica.
 *
 * @param {number} dias Ventana hacia atrás. Por defecto 88.
 */
function medicionBackfill(dias) {
  return medicionEjecutar_({ dias: dias || MED_CFG.ADS_MAX_DIAS, forzar: false });
}


// ── MOTOR ──────────────────────────────────────────────────────

function medicionEjecutar_(opts) {
  const bloqueo = LockService.getScriptLock();
  if (!bloqueo.tryLock(30000)) {
    Logger.log('Otra ejecución en curso. Se cancela esta pasada.');
    return null;
  }

  try {
    const hoja = medicionHoja_();
    medicionAsegurarCabeceras_(hoja);

    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) {
      Logger.log('No hay leads en el CRM.');
      return { ga4: 0, ads: 0, omitidos: 0 };
    }

    const ancho = Math.max(hoja.getLastColumn(), MED_CFG.COL.MED_ADS);
    const filas = hoja.getRange(2, 1, ultimaFila - 1, ancho).getValues();
    const ahora = new Date();
    const limite = new Date(ahora.getTime() - (opts.dias * 24 * 60 * 60 * 1000));

    const pendientesGa4 = [];
    const pendientesAds = [];
    const resumen = { total: 0, ga4: 0, ads: 0, sinClickId: 0, viejosGa4: 0, yaEnviados: 0 };

    filas.forEach((fila, i) => {
      const numeroFila = i + 2;
      const lead = medicionLeerFila_(fila, numeroFila);
      if (!lead.email) return;

      const fecha = lead.fecha instanceof Date ? lead.fecha : new Date(lead.fecha);
      if (isNaN(fecha.getTime()) || fecha < limite) return;

      resumen.total++;

      const horas = (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60);

      // GA4
      if (lead.medGa4) {
        resumen.yaEnviados++;
      } else if (horas > MED_CFG.GA4_MAX_HORAS) {
        resumen.viejosGa4++;
      } else {
        pendientesGa4.push(lead);
      }

      // Google Ads: hace falta uno de los tres identificadores de clic.
      if (!lead.medAds) {
        if (lead.gclid || lead.gbraid || lead.wbraid) {
          pendientesAds.push(lead);
        } else {
          resumen.sinClickId++;
        }
      }
    });

    Logger.log('Leads en ventana: %s | pendientes GA4: %s | pendientes Ads: %s',
      resumen.total, pendientesGa4.length, pendientesAds.length);

    // ── GA4
    if (!MED_CFG.ENVIAR_GA4 && pendientesGa4.length) {
      Logger.log('Canal GA4 DESACTIVADO: %s leads quedan en espera.', pendientesGa4.length);
      pendientesGa4.length = 0;
    }
    pendientesGa4.forEach(lead => {
      const ok = medicionEnviarGA4_(lead);
      if (ok) {
        resumen.ga4++;
        if (!MED_CFG.DRY_RUN) hoja.getRange(lead.fila, MED_CFG.COL.MED_GA4).setValue(new Date());
      }
    });

    // ── Google Ads (una sola llamada con todas las conversiones)
    if (!MED_CFG.ENVIAR_ADS && pendientesAds.length) {
      Logger.log('Canal Ads DESACTIVADO: %s conversiones quedan en espera.', pendientesAds.length);
      pendientesAds.length = 0;
    }
    if (pendientesAds.length) {
      const subidos = medicionSubirAds_(pendientesAds);
      subidos.forEach(lead => {
        resumen.ads++;
        if (!MED_CFG.DRY_RUN) hoja.getRange(lead.fila, MED_CFG.COL.MED_ADS).setValue(new Date());
      });
    }

    Logger.log('RESUMEN%s → GA4: %s | Ads: %s | sin click id: %s | fuera de plazo GA4: %s',
      MED_CFG.DRY_RUN ? ' (ENSAYO, nada enviado)' : '',
      resumen.ga4, resumen.ads, resumen.sinClickId, resumen.viejosGa4);

    return resumen;

  } finally {
    bloqueo.releaseLock();
  }
}

function medicionHoja_() {
  if (!MED_CFG.SPREADSHEET_ID) {
    throw new Error('Falta la propiedad HE_SPREADSHEET_ID.');
  }
  const hoja = SpreadsheetApp.openById(MED_CFG.SPREADSHEET_ID).getSheetByName(MED_CFG.SHEET_LEADS);
  if (!hoja) throw new Error('No existe la hoja «' + MED_CFG.SHEET_LEADS + '».');
  return hoja;
}

/** Escribe las cabeceras de las columnas 31 y 32 si aún no están. */
function medicionAsegurarCabeceras_(hoja) {
  const celdaGa4 = hoja.getRange(1, MED_CFG.COL.MED_GA4);
  const celdaAds = hoja.getRange(1, MED_CFG.COL.MED_ADS);
  if (!celdaGa4.getValue()) celdaGa4.setValue('Medicion GA4');
  if (!celdaAds.getValue()) celdaAds.setValue('Medicion Ads');
}

function medicionLeerFila_(fila, numeroFila) {
  const v = c => fila[c - 1];
  return {
    fila:       numeroFila,
    id:         String(v(MED_CFG.COL.ID) || ''),
    nombre:     String(v(MED_CFG.COL.NOMBRE) || ''),
    email:      String(v(MED_CFG.COL.EMAIL) || '').trim().toLowerCase(),
    pais:       String(v(MED_CFG.COL.PAIS) || ''),
    capital:    String(v(MED_CFG.COL.CAPITAL) || ''),
    tier:       String(v(MED_CFG.COL.TIER) || 'C').toUpperCase(),
    puntuacion: v(MED_CFG.COL.PUNTUACION) || 0,
    origen:     String(v(MED_CFG.COL.ORIGEN) || ''),
    fecha:      v(MED_CFG.COL.FECHA),
    utmSource:  String(v(MED_CFG.COL.UTM_SOURCE) || ''),
    utmMedium:  String(v(MED_CFG.COL.UTM_MEDIUM) || ''),
    utmCampaign:String(v(MED_CFG.COL.UTM_CAMPAIGN) || ''),
    gclid:      String(v(MED_CFG.COL.GCLID) || '').trim(),
    gbraid:     String(v(MED_CFG.COL.GBRAID) || '').trim(),
    wbraid:     String(v(MED_CFG.COL.WBRAID) || '').trim(),
    medGa4:     v(MED_CFG.COL.MED_GA4),
    medAds:     v(MED_CFG.COL.MED_ADS),
  };
}


// ── GA4: MEASUREMENT PROTOCOL ──────────────────────────────────

/**
 * client_id determinista derivado del email.
 *
 * AVISO IMPORTANTE: no es el client_id real del navegador del visitante, porque
 * cuando gtag está bloqueado no hay ninguno que capturar. El evento entrará en
 * GA4 sin unirse a la sesión original, así que aparecerá sin canal de adquisición
 * (Direct / not set). Es una pérdida de atribución asumida a conciencia: vale más
 * un lead contado sin canal que un lead invisible. La atribución de campaña se
 * recupera por el otro lado, subiendo el gclid a Google Ads.
 *
 * Al ser determinista, un mismo lead no genera usuarios distintos si se reprocesa.
 */
function medicionClientId_(email) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email || 'anonimo');
  let a = 0, b = 0;
  for (let i = 0; i < 5; i++)  a = (a * 256 + (bytes[i] & 0xff)) % 4294967295;
  for (let i = 5; i < 10; i++) b = (b * 256 + (bytes[i] & 0xff)) % 2147483647;
  return a + '.' + b;
}

function medicionEnviarGA4_(lead) {
  const measurementId = medProp_('HE_GA4_MEASUREMENT_ID');
  const apiSecret     = medProp_('HE_GA4_API_SECRET');

  if (!measurementId || !apiSecret) {
    Logger.log('GA4 sin configurar (faltan HE_GA4_MEASUREMENT_ID o HE_GA4_API_SECRET).');
    return false;
  }

  const fecha = lead.fecha instanceof Date ? lead.fecha : new Date(lead.fecha);
  const carga = {
    client_id: medicionClientId_(lead.email),
    timestamp_micros: String(fecha.getTime() * 1000),
    non_personalized_ads: false,
    events: [{
      name: 'generate_lead',
      params: {
        // engagement_time_msec y session_id son necesarios para que GA4 no
        // descarte el evento por considerarlo fuera de sesión.
        engagement_time_msec: 1,
        session_id: String(Math.floor(fecha.getTime() / 1000)),
        value: medValorLead_(lead.tier),
        currency: 'EUR',
        form_name: 'servidor_crm',
        lead_source: 'measurement_protocol',
        event_category: 'form',
        event_label: 'crm_server_side',
        lead_tier: lead.tier,
        lead_score: lead.puntuacion,
        lead_country: lead.pais || 'sin_pais',
        lead_capital: lead.capital || 'sin_dato',
      },
    }],
  };

  if (MED_CFG.DRY_RUN) {
    Logger.log('[ENSAYO GA4] fila %s · %s · tier %s · %s EUR',
      lead.fila, lead.email, lead.tier, medValorLead_(lead.tier));
    return true;
  }

  const url = 'https://www.google-analytics.com/mp/collect'
    + '?measurement_id=' + encodeURIComponent(measurementId)
    + '&api_secret=' + encodeURIComponent(apiSecret);

  try {
    const resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(carga),
      muteHttpExceptions: true,
    });
    const codigo = resp.getResponseCode();
    // El Measurement Protocol devuelve 204 sin cuerpo cuando acepta el evento.
    // Ojo: acepta casi todo sin validar. Para depurar de verdad hay que usar
    // el endpoint /debug/mp/collect (ver medicionDepurarGA4).
    if (codigo === 204 || codigo === 200) return true;
    Logger.log('GA4 respondió %s: %s', codigo, resp.getContentText());
    return false;
  } catch (e) {
    Logger.log('Error enviando a GA4 (fila %s): %s', lead.fila, e.message);
    return false;
  }
}

/**
 * Validador oficial de GA4. Envía el último lead al endpoint de depuración, que
 * SÍ valida el formato y devuelve los errores. Ejecutar a mano una vez.
 */
function medicionDepurarGA4() {
  const hoja = medicionHoja_();
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) { Logger.log('No hay leads.'); return; }

  const ancho = Math.max(hoja.getLastColumn(), MED_CFG.COL.MED_ADS);
  const lead = medicionLeerFila_(hoja.getRange(ultimaFila, 1, 1, ancho).getValues()[0], ultimaFila);

  const url = 'https://www.google-analytics.com/debug/mp/collect'
    + '?measurement_id=' + encodeURIComponent(medProp_('HE_GA4_MEASUREMENT_ID'))
    + '&api_secret=' + encodeURIComponent(medProp_('HE_GA4_API_SECRET'));

  const fecha = lead.fecha instanceof Date ? lead.fecha : new Date(lead.fecha);
  const carga = {
    client_id: medicionClientId_(lead.email),
    timestamp_micros: String(fecha.getTime() * 1000),
    events: [{
      name: 'generate_lead',
      params: {
        engagement_time_msec: 1,
        session_id: String(Math.floor(fecha.getTime() / 1000)),
        value: medValorLead_(lead.tier),
        currency: 'EUR',
        lead_tier: lead.tier,
      },
    }],
  };

  const resp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(carga),
    muteHttpExceptions: true,
  });
  Logger.log('Validación GA4 (vacío en validationMessages = correcto):');
  Logger.log(resp.getContentText());
}


// ── GOOGLE ADS: CONVERSIONES OFFLINE ───────────────────────────

function medicionAdsAccessToken_() {
  const resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      grant_type:    'refresh_token',
      client_id:     medProp_('HE_ADS_CLIENT_ID'),
      client_secret: medProp_('HE_ADS_CLIENT_SECRET'),
      refresh_token: medProp_('HE_ADS_REFRESH_TOKEN'),
    },
    muteHttpExceptions: true,
  });

  const cuerpo = JSON.parse(resp.getContentText());
  if (!cuerpo.access_token) {
    throw new Error('No se pudo renovar el token de Google Ads: ' + resp.getContentText());
  }
  return cuerpo.access_token;
}

/** Formato exigido por la API: «yyyy-MM-dd HH:mm:ss+HH:mm». El offset es obligatorio. */
function medicionFechaAds_(fecha) {
  return Utilities.formatDate(fecha, MED_CFG.TZ, "yyyy-MM-dd HH:mm:ssXXX");
}

/**
 * Sube las conversiones a Google Ads. Devuelve el subconjunto de leads aceptados,
 * para marcar solo esos como enviados.
 */
function medicionSubirAds_(leads) {
  const customerId = medProp_('HE_ADS_CUSTOMER_ID').replace(/[^0-9]/g, '');
  const actionId   = medProp_('HE_ADS_CONVERSION_ACTION_ID').replace(/[^0-9]/g, '');
  const version    = medProp_('HE_ADS_API_VERSION', 'v25');

  if (!customerId || !actionId) {
    Logger.log('Google Ads sin configurar (faltan HE_ADS_CUSTOMER_ID o HE_ADS_CONVERSION_ACTION_ID).');
    return [];
  }

  const conversionAction = 'customers/' + customerId + '/conversionActions/' + actionId;

  const conversiones = leads.map(lead => {
    const fecha = lead.fecha instanceof Date ? lead.fecha : new Date(lead.fecha);
    const conv = {
      conversionAction: conversionAction,
      conversionDateTime: medicionFechaAds_(fecha),
      conversionValue: medValorLead_(lead.tier),
      currencyCode: 'EUR',
      // orderId evita el doble conteo si una pasada se repite: Google deduplica
      // por este identificador dentro de la misma acción de conversión.
      orderId: lead.id || ('HE-' + lead.fila),
    };
    // Solo uno de los tres identificadores, y en su campo propio.
    if (lead.gclid)       conv.gclid  = lead.gclid;
    else if (lead.gbraid) conv.gbraid = lead.gbraid;
    else if (lead.wbraid) conv.wbraid = lead.wbraid;
    return conv;
  });

  if (MED_CFG.DRY_RUN) {
    conversiones.forEach((c, i) => {
      Logger.log('[ENSAYO ADS] fila %s · %s · %s EUR · %s · %s',
        leads[i].fila, leads[i].email, c.conversionValue, c.conversionDateTime,
        c.gclid ? 'gclid' : (c.gbraid ? 'gbraid' : 'wbraid'));
    });
    return leads;
  }

  const url = 'https://googleads.googleapis.com/' + version
    + '/customers/' + customerId + ':uploadClickConversions';

  const cabeceras = {
    'Authorization':    'Bearer ' + medicionAdsAccessToken_(),
    'developer-token':  medProp_('HE_ADS_DEVELOPER_TOKEN'),
  };
  const loginId = medProp_('HE_ADS_LOGIN_CUSTOMER_ID').replace(/[^0-9]/g, '');
  if (loginId) cabeceras['login-customer-id'] = loginId;

  try {
    const resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: cabeceras,
      // partialFailure: si una conversión es inválida (gclid caducado, por ejemplo),
      // las demás se suben igual en vez de caerse el lote entero.
      payload: JSON.stringify({ conversions: conversiones, partialFailure: true }),
      muteHttpExceptions: true,
    });

    const codigo = resp.getResponseCode();
    const cuerpo = resp.getContentText();

    if (codigo !== 200) {
      Logger.log('Google Ads respondió %s: %s', codigo, cuerpo);
      return [];
    }

    const datos = JSON.parse(cuerpo);
    const aceptados = [];
    const resultados = datos.results || [];

    // Con partialFailure, los índices que fallaron vienen en partialFailureError.
    const fallidos = medicionIndicesFallidos_(datos);

    leads.forEach((lead, i) => {
      if (fallidos.indexOf(i) !== -1) {
        Logger.log('Ads rechazó la fila %s (%s).', lead.fila, lead.email);
        return;
      }
      // Un resultado vacío también indica rechazo silencioso.
      if (resultados[i] && !resultados[i].gclid && !resultados[i].gbraid && !resultados[i].wbraid) {
        Logger.log('Ads devolvió resultado vacío para la fila %s.', lead.fila);
        return;
      }
      aceptados.push(lead);
    });

    if (datos.partialFailureError) {
      Logger.log('Errores parciales de Ads: %s', JSON.stringify(datos.partialFailureError.message || ''));
    }
    Logger.log('Google Ads aceptó %s de %s conversiones.', aceptados.length, leads.length);
    return aceptados;

  } catch (e) {
    Logger.log('Error subiendo a Google Ads: %s', e.message);
    return [];
  }
}

/** Extrae de partialFailureError los índices del lote que Google rechazó. */
function medicionIndicesFallidos_(datos) {
  const fallidos = [];
  const err = datos.partialFailureError;
  if (!err || !err.details) return fallidos;

  err.details.forEach(detalle => {
    (detalle.errors || []).forEach(e => {
      (e.location && e.location.fieldPathElements || []).forEach(campo => {
        if (campo.fieldName === 'conversions' && typeof campo.index === 'number') {
          fallidos.push(campo.index);
        }
      });
    });
  });
  return fallidos;
}

/** Comprueba que las credenciales de Ads funcionan, sin subir nada. */
function medicionProbarAds() {
  try {
    const token = medicionAdsAccessToken_();
    Logger.log('Token de Google Ads renovado correctamente (%s caracteres).', token.length);

    const customerId = medProp_('HE_ADS_CUSTOMER_ID').replace(/[^0-9]/g, '');
    const version    = medProp_('HE_ADS_API_VERSION', 'v25');
    const cabeceras  = {
      'Authorization':   'Bearer ' + token,
      'developer-token': medProp_('HE_ADS_DEVELOPER_TOKEN'),
    };
    const loginId = medProp_('HE_ADS_LOGIN_CUSTOMER_ID').replace(/[^0-9]/g, '');
    if (loginId) cabeceras['login-customer-id'] = loginId;

    // Lista las acciones de conversión: confirma versión de API, permisos y
    // devuelve el ID que hay que poner en HE_ADS_CONVERSION_ACTION_ID.
    const resp = UrlFetchApp.fetch(
      'https://googleads.googleapis.com/' + version + '/customers/' + customerId + '/googleAds:search',
      {
        method: 'post',
        contentType: 'application/json',
        headers: cabeceras,
        payload: JSON.stringify({
          query: 'SELECT conversion_action.id, conversion_action.name, conversion_action.type, '
               + 'conversion_action.status, conversion_action.primary_for_goal '
               + 'FROM conversion_action ORDER BY conversion_action.id',
        }),
        muteHttpExceptions: true,
      }
    );

    Logger.log('Respuesta %s', resp.getResponseCode());
    Logger.log(resp.getContentText());
  } catch (e) {
    Logger.log('Fallo: %s', e.message);
  }
}


// ── TRIGGER ────────────────────────────────────────────────────

function medicionCrearTrigger() {
  medicionBorrarTrigger();
  ScriptApp.newTrigger('medicionProcesar').timeBased().everyHours(1).create();
  Logger.log('Trigger creado: medicionProcesar cada hora.');
}

function medicionBorrarTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'medicionProcesar') ScriptApp.deleteTrigger(t);
  });
}


// ── CONTROL SEMANAL ────────────────────────────────────────────

/**
 * Informe de vigilancia. Contrasta los leads que hay en el CRM con los que
 * llegaron de verdad a GA4 y a Google Ads.
 *
 * Sentido de esto: el 22-ago-2026 la divergencia entre el correo y GA4 pasó
 * inadvertida casi tres días. Con este aviso se ve el mismo lunes.
 *
 * Ejecutar con medicionCrearTriggerInforme() o llamarlo desde el guardián.
 */
function medicionInforme() {
  const hoja = medicionHoja_();
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return;

  const ancho = Math.max(hoja.getLastColumn(), MED_CFG.COL.MED_ADS);
  const filas = hoja.getRange(2, 1, ultimaFila - 1, ancho).getValues();
  const desde = new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000));

  const r = { total: 0, ga4: 0, ads: 0, sinClickId: 0, pendientes: [] };

  filas.forEach((fila, i) => {
    const lead = medicionLeerFila_(fila, i + 2);
    if (!lead.email) return;
    const fecha = lead.fecha instanceof Date ? lead.fecha : new Date(lead.fecha);
    if (isNaN(fecha.getTime()) || fecha < desde) return;

    r.total++;
    if (lead.medGa4) r.ga4++;
    if (lead.medAds) r.ads++;
    else if (!lead.gclid && !lead.gbraid && !lead.wbraid) r.sinClickId++;

    if (!lead.medGa4 || (!lead.medAds && (lead.gclid || lead.gbraid || lead.wbraid))) {
      r.pendientes.push(lead.email + ' (fila ' + lead.fila + ')');
    }
  });

  if (!r.total) {
    Logger.log('Sin leads en los últimos 7 días. No se envía informe.');
    return r;
  }

  const alerta = r.pendientes.length > 0;
  const lineas = [
    'Leads en el CRM (7 días): ' + r.total,
    'Enviados a GA4: ' + r.ga4 + ' de ' + r.total,
    'Subidos a Google Ads: ' + r.ads + ' de ' + (r.total - r.sinClickId) + ' con click id',
    'Sin click id (tráfico no pagado): ' + r.sinClickId,
  ];
  if (alerta) {
    lineas.push('');
    lineas.push('PENDIENTES DE ENVIAR:');
    r.pendientes.forEach(p => lineas.push('  · ' + p));
    lineas.push('');
    lineas.push('Revisar el registro de ejecuciones de medicionProcesar en Apps Script.');
  }

  MailApp.sendEmail({
    to: medProp_('HE_AGENT_EMAIL', 'hola@horizonteemirates.com'),
    subject: (alerta ? '[REVISAR] ' : '[OK] ') + 'Medición de leads · ' + r.total + ' en 7 días',
    body: lineas.join('\n'),
  });

  Logger.log(lineas.join('\n'));
  return r;
}

/**
 * Diagnóstico: vuelca fila a fila el estado del CRM con sus marcas de medición.
 * Sirve para saber qué celda hay que tocar cuando las filas se han renumerado
 * (borrar filas del Sheet desplaza todo lo que hay debajo).
 */
function medicionEstado() {
  const hoja = medicionHoja_();
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) { Logger.log('CRM vacío.'); return; }

  const ancho = Math.max(hoja.getLastColumn(), MED_CFG.COL.MED_ADS);
  const filas = hoja.getRange(2, 1, ultimaFila - 1, ancho).getValues();
  const ahora = new Date();

  Logger.log('FILA | CELDA_GA4 | EMAIL | FECHA | HORAS | GA4 | ADS | CLICKID');
  Logger.log('-------------------------------------------------------------------');

  filas.forEach((fila, i) => {
    const lead = medicionLeerFila_(fila, i + 2);
    if (!lead.email) return;
    const fecha = lead.fecha instanceof Date ? lead.fecha : new Date(lead.fecha);
    const horas = Math.round((ahora.getTime() - fecha.getTime()) / 3600000);
    Logger.log('%s | AE%s | %s | %s | %sh | %s | %s | %s',
      lead.fila,
      lead.fila,
      lead.email,
      Utilities.formatDate(fecha, MED_CFG.TZ, 'dd-MM-yyyy HH:mm'),
      horas,
      lead.medGa4 ? 'MARCADO' : 'pendiente',
      lead.medAds ? 'MARCADO' : 'pendiente',
      (lead.gclid || lead.gbraid || lead.wbraid) ? 'si' : 'NO');
  });

  Logger.log('-------------------------------------------------------------------');
  Logger.log('MARCADO = no se volverá a enviar. Para reenviar, vaciar esa celda.');
  Logger.log('GA4 solo admite eventos de menos de %s horas.', MED_CFG.GA4_MAX_HORAS);
}


function medicionCrearTriggerInforme() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'medicionInforme') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('medicionInforme')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  Logger.log('Trigger creado: medicionInforme los lunes a las 8:00.');
}
