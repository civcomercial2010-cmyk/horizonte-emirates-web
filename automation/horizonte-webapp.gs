// ═══════════════════════════════════════════════════════════════
// HORIZONTE EMIRATES · Web app del generador de correos
// Google Apps Script · Propulse SLU · Andorra
//
// QUÉ HACE
//   Publica el generador de correos como página propia, accesible desde el
//   móvil con la cuenta de Google. Lee los últimos leads del CRM para que la
//   ficha se rellene de un toque, en lugar de teclearla a mano.
//
// PRINCIPIO DE DISEÑO: NO TOCA EL MOTOR
//   Este archivo no envía correos, no encola nada y no lee Gmail. Solo lee la
//   hoja Leads y, si se pulsa el botón, escribe una línea en la columna Notas.
//   Vive en su propio archivo: horizonte-emails.gs no se toca.
//
// INSTALACIÓN (una sola vez)
//   1. Apps Script del proyecto → + Archivo → Secuencia de comandos
//      Nombrarlo "horizonte-webapp" y pegar este contenido.
//   2. + Archivo → HTML. Nombrarlo EXACTAMENTE "generador" (queda generador.html)
//      y pegar dentro tools/generador-mails.appsscript.html completo.
//      OJO: el que lleva DOCTYPE es ese. El archivo .movil.html es para la página
//      publicada y sin DOCTYPE el móvil ignora el viewport.
//   3. Ejecutar webappProbar() una vez, para autorizar el acceso a la hoja.
//   4. Implementar → Nueva implementación → Tipo: Aplicación web
//        Ejecutar como:  Yo
//        Quién tiene acceso:  Solo yo
//      Copiar la URL que devuelve y abrirla en el móvil.
//
// ACTUALIZAR EL GENERADOR
//   Cambiar los copys en tools/generador-mails.html, ejecutar
//   scripts/build_generador_movil.py y volver a pegar el HTML resultante en el
//   archivo "generador". Después: Implementar → Gestionar implementaciones →
//   editar → Versión: Nueva. Sin ese último paso la URL sigue sirviendo lo viejo.
//
// SI LA URL NO SE ABRE EN EL MÓVIL
//   1. Comprobar que la URL termina en /exec y NO en /dev. La que aparece al
//      pulsar «Probar implementación» es /dev y solo funciona en el navegador
//      donde está abierto el editor. La buena está en Implementar → Gestionar
//      implementaciones → «URL de la aplicación web».
//   2. Varias cuentas de Google en el móvil: es la causa más frecuente. La URL
//      abre con la cuenta por defecto del navegador, que puede no ser la dueña
//      del script. Solución: insertar /u/0/ después de macros, así:
//        https://script.google.com/macros/u/0/s/<ID>/exec
//      Si la cuenta buena no es la primera del navegador, probar /u/1/, /u/2/...
//   3. No abrir el enlace desde WhatsApp, Gmail o Telegram: sus navegadores
//      internos no comparten la sesión de Google. Pegarlo en Chrome o Safari.
//   4. Pantalla de error de Google al cargar: suele ser que falta el archivo
//      HTML o está mal nombrado. Ejecutar webappProbar() y mirar el registro.
//   5. Tras cambiar el código o el HTML: Implementar → Gestionar implementaciones
//      → editar (lápiz) → Versión: Nueva → Implementar. Sin eso, la URL sigue
//      sirviendo la versión anterior.
//
// AVISO: una sola función doGet por proyecto de Apps Script. Si algún día se
// añade otra web app, hay que unificarlas aquí.
// ═══════════════════════════════════════════════════════════════

const WEBAPP_CFG = {
  /** Máximo de leads que se listan de una vez (los más recientes primero). */
  MAX_LEADS: 40,
  /** Días que se muestran si la página no pide otro rango. */
  DIAS_POR_DEFECTO: 30,
  /** Nombre del archivo HTML dentro del proyecto de Apps Script. */
  ARCHIVO_HTML: 'generador',
};

// ── Etiquetas legibles (copia local para no depender del motor de correos) ──
const WEBAPP_CAPITAL = {
  'menos150k': 'menos de 150.000 €',
  '150k-300k': '150.000 a 300.000 €',
  '300k-600k': '300.000 a 600.000 €',
  '600k-1M':   '600.000 a 1.000.000 €',
  'mas1M':     'más de 1.000.000 €',
};

/**
 * Página. Se sirve con la cuenta del propietario y acceso restringido a él.
 * El viewport y el charset viajan ya dentro del HTML (generador-mails.appsscript.html),
 * así que aquí no se añaden meta tags: duplicarlos solo genera ruido.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile(WEBAPP_CFG.ARCHIVO_HTML)
    .setTitle('Correos · Horizonte Emirates');
}

/** Hoja del CRM. Lee el ID de las propiedades del proyecto, igual que el motor. */
function webappHojaLeads_() {
  const id = PropertiesService.getScriptProperties().getProperty('HE_SPREADSHEET_ID');
  if (!id) throw new Error('Falta la propiedad HE_SPREADSHEET_ID en la configuración del proyecto.');
  const hoja = SpreadsheetApp.openById(id).getSheetByName('Leads');
  if (!hoja) throw new Error('No existe la hoja «Leads» en el CRM.');
  return hoja;
}

/** «hace 2 h», «ayer», «hace 5 d»: más útil que una fecha en una lista que se ojea. */
function webappHace_(fecha) {
  const ms = Date.now() - fecha.getTime();
  const min = Math.round(ms / 60000);
  if (min < 60) return 'hace ' + Math.max(min, 1) + ' min';
  const horas = Math.round(min / 60);
  if (horas < 24) return 'hace ' + horas + ' h';
  const dias = Math.round(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 30) return 'hace ' + dias + ' d';
  return Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'dd/MM/yy');
}

/**
 * Últimos leads del CRM, del más reciente al más antiguo.
 * Devuelve objetos planos: google.script.run no transporta objetos complejos.
 * @param {number} dias periodo a mostrar.
 */
function webappGetLeads(dias) {
  const periodo = Number(dias) > 0 ? Number(dias) : WEBAPP_CFG.DIAS_POR_DEFECTO;
  const corte = Date.now() - periodo * 24 * 3600 * 1000;
  const datos = webappHojaLeads_().getDataRange().getValues();
  const salida = [];

  for (let i = 1; i < datos.length; i++) {
    const r = datos[i];
    if (!r[0] && !r[2]) continue;                 // fila vacía
    const creado = new Date(r[14]);
    if (isNaN(creado) || creado.getTime() < corte) continue;
    // Estados terminales: no se les vuelve a escribir, así que no estorban en la lista.
    // «descartado» es el que se pone a mano en la columna Estado para las pruebas
    // internas y los leads de la agencia.
    const estado = String(r[15] || '').toLowerCase().trim();
    if (estado === 'baja' || estado === 'cerrado' || estado === 'descartado') continue;

    salida.push({
      id:               String(r[0] || ''),
      nombre:           String(r[1] || ''),
      email:            String(r[2] || ''),
      telefono:         String(r[3] || ''),
      pais:             String(r[4] || ''),
      capital:          String(r[5] || ''),
      capitalTexto:     WEBAPP_CAPITAL[String(r[5] || '')] || String(r[5] || ''),
      objetivo:         String(r[6] || ''),
      plazo:            String(r[8] || ''),
      viaje:            String(r[9] || ''),
      puntuacion:       String(r[10] || ''),
      tier:             String(r[11] || 'C').toUpperCase(),
      canal:            String(r[12] || ''),
      estado:           estado,
      notas:            String(r[16] || ''),
      consentMarketing: String(r[26] || '').toUpperCase() === 'SI' ? 'SI' : 'NO',
      creadoMs:         creado.getTime(),
      hace:             webappHace_(creado),
    });
  }

  salida.sort(function (a, b) { return b.creadoMs - a.creadoMs; });
  return salida.slice(0, WEBAPP_CFG.MAX_LEADS);
}

/**
 * Añade una línea de seguimiento a la columna Notas del lead (columna Q, la 17).
 * Es lo único que este archivo escribe en el CRM, y solo cuando se pulsa el botón.
 * @param {string} leadId id del lead (columna A).
 * @param {string} etiqueta código del correo enviado, por ejemplo «M1» o «M11».
 * @return {string} la nota tal como ha quedado registrada.
 */
function webappAnotarContacto(leadId, etiqueta) {
  const id = String(leadId || '').trim();
  if (!id) throw new Error('Falta el identificador del lead.');

  const hoja = webappHojaLeads_();
  const datos = hoja.getDataRange().getValues();
  const sello = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yy HH:mm');
  const nota = sello + ' · ' + (String(etiqueta || 'contacto').trim() || 'contacto') + ' enviado';

  for (let i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) !== id) continue;
    const previo = String(datos[i][16] || '').trim();
    hoja.getRange(i + 1, 17).setValue(previo ? previo + '\n' + nota : nota);
    return nota;
  }
  throw new Error('No se encontró el lead ' + id + ' en la hoja.');
}

/**
 * Diagnóstico de acceso: dice cuál es la URL real de la implementación activa y con qué
 * cuenta corre el script. Ejecutar y mirar el registro (Ctrl+Enter).
 *
 * Que esta función NO pida permisos es normal: el proyecto ya está autorizado para Sheets
 * y Gmail por el motor de correos, y la web app no usa ningún servicio nuevo.
 */
function webappUrl() {
  Logger.log('=== webappUrl ===');

  let cuenta = '';
  try { cuenta = Session.getEffectiveUser().getEmail(); } catch (e) { cuenta = '(no disponible)'; }
  Logger.log('El script corre como: ' + cuenta);
  Logger.log('Desde el móvil hay que entrar con ESA cuenta, no con otra.');

  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }

  if (!url) {
    Logger.log('');
    Logger.log('NO HAY IMPLEMENTACIÓN WEB ACTIVA.');
    Logger.log('Implementar → Nueva implementación → rueda dentada → Aplicación web');
    Logger.log('   Ejecutar como: Yo · Quién tiene acceso: Solo yo');
    Logger.log('=== fin ===');
    return '';
  }

  Logger.log('');
  Logger.log('URL devuelta por el script: ' + url);

  // Ejecutada desde el editor, getUrl() devuelve SIEMPRE la URL de desarrollo (/dev).
  // Esa no sirve en el móvil: solo funciona en el navegador donde está abierto el editor.
  // Y no se puede convertir en /exec, porque el identificador de la implementación es otro.
  if (url.slice(-4) === '/dev') {
    Logger.log('');
    Logger.log('ATENCIÓN: esa URL termina en /dev y NO funciona en el móvil.');
    Logger.log('Al ejecutar esta función desde el editor, Google devuelve siempre la de');
    Logger.log('desarrollo. La buena hay que copiarla a mano una sola vez:');
    Logger.log('  Implementar → Gestionar implementaciones → «URL de la aplicación web» (/exec)');
    Logger.log('Si ahí no aparece ninguna, es que no hay implementación web creada todavía.');
    Logger.log('=== fin ===');
    return url;
  }

  Logger.log('');
  Logger.log('Si en el móvil hay varias cuentas de Google, usar una de estas:');
  for (let i = 0; i < 3; i++) {
    Logger.log('  u/' + i + ' → ' + url.replace('/macros/s/', '/macros/u/' + i + '/s/'));
  }
  Logger.log('=== fin ===');
  return url;
}

/**
 * Manda el enlace de la web app al correo del asesor, con las variantes por cuenta.
 * Evita el error de copiar la URL a mano o de coger la de prueba (/dev).
 */
function webappEnviarmeElEnlace() {
  const destino = PropertiesService.getScriptProperties().getProperty('HE_AGENT_EMAIL') ||
                  Session.getEffectiveUser().getEmail();
  const url = webappUrl();
  if (!url) throw new Error('No hay implementación web activa. Crea una antes de enviar el enlace.');
  if (url.slice(-4) === '/dev') {
    throw new Error('El script solo puede darme la URL de desarrollo (/dev), que no funciona en el ' +
      'móvil. Copia la de /exec en Implementar → Gestionar implementaciones y pásasela a ' +
      'webappEnviarmeEsteEnlace("<url>").');
  }

  const variantes = [0, 1, 2]
    .map(i => 'Cuenta ' + i + ': ' + url.replace('/macros/s/', '/macros/u/' + i + '/s/'))
    .join('\n');

  const cuerpo = [
    'Generador de correos · acceso desde el móvil',
    '',
    'Enlace principal:',
    url,
    '',
    'Si al abrirlo sale «No se puede abrir el archivo en estos momentos», el navegador está',
    'usando otra cuenta de Google. Probar estas variantes hasta dar con la buena:',
    '',
    variantes,
    '',
    'Consejos:',
    '- Copiar el enlace y pegarlo en Chrome o Safari, no abrirlo desde el correo:',
    '  el navegador interno de las apps no comparte la sesión de Google.',
    '- El script corre como ' + Session.getEffectiveUser().getEmail() + '.',
    '- Cuando funcione, añadirlo a la pantalla de inicio para tenerlo a mano.',
  ].join('\n');

  GmailApp.sendEmail(destino, '[HE] Enlace del generador de correos', cuerpo);
  Logger.log('Enlace enviado a ' + destino);
}

/**
 * Manda al correo una URL concreta con sus variantes por cuenta.
 * Se usa cuando el script solo puede ver la de desarrollo: se pega aquí la /exec buena,
 * copiada de Implementar → Gestionar implementaciones.
 * @param {string} urlExec URL que termina en /exec.
 */
function webappEnviarmeEsteEnlace(urlExec) {
  const url = String(urlExec || '').trim();
  if (url.slice(-5) !== '/exec') {
    throw new Error('Esa URL no termina en /exec. La buena está en Implementar → Gestionar implementaciones.');
  }
  const destino = PropertiesService.getScriptProperties().getProperty('HE_AGENT_EMAIL') ||
                  Session.getEffectiveUser().getEmail();
  const variantes = [0, 1, 2]
    .map(i => 'Cuenta ' + i + ': ' + url.replace('/macros/s/', '/macros/u/' + i + '/s/'))
    .join('\n');

  GmailApp.sendEmail(destino, '[HE] Enlace del generador de correos', [
    'Generador de correos · acceso desde el móvil',
    '',
    'Enlace principal:',
    url,
    '',
    'Si sale «No se puede abrir el archivo en estos momentos», el navegador está usando otra',
    'cuenta de Google. Probar estas variantes hasta dar con la buena:',
    '',
    variantes,
    '',
    'Copiar el enlace y pegarlo en Chrome o Safari: el navegador interno del correo no',
    'comparte la sesión de Google. El script corre como ' + Session.getEffectiveUser().getEmail() + '.',
  ].join('\n'));
  Logger.log('Enlace enviado a ' + destino);
}

/** Diagnóstico: ejecutar a mano para autorizar permisos y comprobar que el CRM responde. */
function webappProbar() {
  const leads = webappGetLeads(90);
  Logger.log('=== webappProbar ===');
  Logger.log('Cuenta: ' + Session.getActiveUser().getEmail());
  Logger.log('Leads en los últimos 90 días: ' + leads.length);
  leads.slice(0, 5).forEach(function (l) {
    Logger.log('  [' + l.tier + '] ' + l.nombre + ' · ' + l.capitalTexto + ' · ' + l.hace +
      ' · marketing=' + l.consentMarketing);
  });
  try {
    HtmlService.createHtmlOutputFromFile(WEBAPP_CFG.ARCHIVO_HTML);
    Logger.log('Archivo HTML «' + WEBAPP_CFG.ARCHIVO_HTML + '»: encontrado');
  } catch (e) {
    Logger.log('FALTA el archivo HTML «' + WEBAPP_CFG.ARCHIVO_HTML + '». Créalo con + Archivo → HTML.');
  }
  Logger.log('=== fin ===');
}
