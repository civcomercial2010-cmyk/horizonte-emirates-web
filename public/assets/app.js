/* index.html - JS externalizado (M25/M26: retirar unsafe-inline de script-src). */
const WA_URL='https://wa.me/971554722025';
const W3F_KEY='3861d49c-5f0a-4dc3-a9e9-08b1758a110a';
const W3F_EP='https://api.web3forms.com/submit';
const ADS_CONVERSION_ID='AW-586671676';
const ADS_CONVERSION_LABEL=''; // M04 - pega aquí la etiqueta de la conversión nativa de Google Ads (formato AbCdEfGhIjk) SOLO si NO importas generate_lead desde GA4. Vacío = no dispara la nativa (evita doble conteo si usas la vía GA4→Ads).
// M05 - valor económico estimado del lead por tier (para Smart Bidding / ROAS). Ajustable.
const LEAD_VALUE_EUR={A:300,B:120,C:40};

/* ── PRUEBA DEL CONSENTIMIENTO (art. 7.1 RGPD) ─────────────────────────────
 * El texto literal que acepta el lead viaja en el envío junto a la marca y la
 * fecha, de modo que sea demostrable qué consintió exactamente y cuándo.
 * Si se cambia la redacción de las casillas en index.html, SUBIR la versión:
 * de lo contrario el registro dejaría de corresponderse con lo aceptado.       */
const CONSENT_VERSION='v3-2026-08';
const CONSENT_TEXTS={
  privacidad:'He leído y acepto la política de privacidad y consiento que mis datos se comuniquen al socio de Horizonte Emirates en Emiratos Árabes Unidos para preparar mi análisis de inversión.',
  marketing:'Deseo recibir información comercial sobre oportunidades inmobiliarias en Emiratos por email o WhatsApp.'
};
/* Los textos no deben contener ':' ni saltos de línea: el parser de
   horizonte-emails.gs corta la clave por el primer ':' de cada línea. */

/** Estado del consentimiento de cookies publicitarias (lo escribe consent.js). */
function heAdsConsentGranted(){
  try{
    const raw=JSON.parse(localStorage.getItem('he_consent_v1')||'null');
    if(!raw)return false;
    // Formato granular actual; se mantiene la lectura del formato binario antiguo.
    if(raw.ads)return raw.ads==='granted';
    return raw.state==='granted';
  }catch(e){return false;}
}

/** SHA-256 en hexadecimal del email normalizado (formato exigido por enhanced conversions). */
function sha256Hex(value){
  const norm=String(value||'').trim().toLowerCase();
  if(!norm||!window.crypto||!window.crypto.subtle)return Promise.resolve('');
  return window.crypto.subtle
    .digest('SHA-256',new TextEncoder().encode(norm))
    .then(buf=>Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''))
    .catch(()=>'');
}
function leadValueEUR(tier){return LEAD_VALUE_EUR[tier]||LEAD_VALUE_EUR.C;}
let savedLead={};
let roiEventTimer=null;
let lastRoiPayload='';
const seenFormSteps=new Set();
const seenSections=new Set();

// ── UTM CAPTURE
function captureUTM(){
  // M11 - persiste UTM/click-ids de la URL en sessionStorage; getTrackingParams() los adjunta al lead en el envío.
  // (Se eliminó el código muerto que escribía en inputs name="utm_*" que no existen en el formulario.)
  const urlParams = new URLSearchParams(window.location.search);
  const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid'];
  utmFields.forEach(field => {
    const fromUrl = urlParams.get(field);
    if (fromUrl) sessionStorage.setItem(field, fromUrl);
  });
}

function getTrackingParams(){
  const params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid'];
  const usp = new URLSearchParams(window.location.search);
  const out = {};
  params.forEach(k=>{
    const v=(usp.get(k) || sessionStorage.getItem(k) || '').trim();
    if(v) out[k]=v;
  });
  return out;
}

// ── NAV SCROLL
window.addEventListener('scroll',()=>{
  document.getElementById('nav').classList.toggle('scrolled',window.scrollY>60);
});

// ── FORM STATE
// La pregunta de objetivo se retiró del formulario (12/08): aportaba poco al
// cribado y sumaba fricción en el paso 1. Se pregunta en el primer correo.
// Máximo ahora 10 puntos (antes 15), con los umbrales de tier reescalados.
const SCORES={
  // 'menos150k' puntúa 0 (tier C): un lead C vale 40 EUR; un descarte silencioso, 0.
  capital:{'menos150k':0,'150k-300k':1,'300k-600k':2,'600k-1M':3,'mas1M':4},
  plazo:{'ya':4,'6meses':3,'12meses':2,'indefinido':1},
  viaje:{'si':2,'quizas':1,'no':0}
};
let cur=1,sel={capital:null,plazo:null,viaje:null};
let manualNav=false;
const DELAY=340;

function classify(){
  const s=(SCORES.capital[sel.capital]||0)+(SCORES.plazo[sel.plazo]||0)+(SCORES.viaje[sel.viaje]||0);
  // Umbrales reescalados sobre 10 puntos manteniendo la proporción anterior (60% y 40%).
  let t=s>=6?'A':s>=4?'B':'C';
  // Techo por capital: quien declara menos de 150.000 EUR no puede ser tier A
  // por mucha prisa o disposición a viajar que tenga. Sin esto, menos150k (0) +
  // "operar ya" (4) + "sí a la visita" (2) daba 6 puntos y máxima prioridad,
  // además de mandar 300 EUR de valor a Google Ads.
  if(sel.capital==='menos150k'&&t==='A')t='B';
  return{score:s,tier:t};
}

// El formulario pasó a 2 pasos el 12/08: las tres preguntas de perfil viven en
// la misma pantalla y el paso 2 son ya los datos de contacto.
function updProg(step){
  const fill=document.getElementById('form-progress-fill');
  const lab=document.getElementById('form-step-label');
  const pct=step<=1?50:100;
  if(fill)fill.style.width=pct+'%';
  if(lab)lab.textContent='Paso '+step+' de 2';
  const backBtn=document.getElementById('btn-back');
  if(backBtn)backBtn.style.display=step>1?'block':'none';
}

function goTo(step){
  document.getElementById('fs'+cur).classList.remove('active');
  cur=step;
  document.getElementById('fs'+cur).classList.add('active');
  updProg(cur);
  trackFormStep(cur);
  if(typeof window.heFormSave==='function')window.heFormSave();
  const anchor=document.querySelector('.form-progress-wrap');
  if(anchor)anchor.scrollIntoView({behavior:'smooth',block:'start'});
}
function goBack(){
  if(cur>1){
    manualNav=true;
    goTo(cur-1);
  }
}

// Avance explícito con el botón Continuar (los pasos 1 y 2 ya no dependen
// solo del auto-avance, que era invisible y dejaba sin salida el modo manual).
function showStepHint(step){
  const hint=document.getElementById('step-hint-'+step);
  if(!hint)return;
  hint.classList.add('show');
  setTimeout(()=>hint.classList.remove('show'),3200);
}
function tryAdvance(fromStep){
  if(fromStep===1){
    if(!sel.capital||!sel.plazo||!sel.viaje){showStepHint(1);return;}
    goTo(2);
  }
}

document.querySelectorAll('.opt-card').forEach(el=>{
  el.addEventListener('click',function(){
    const dim=this.dataset.dim,v=this.dataset.v;
    if(!dim)return;
    document.querySelectorAll(`.opt-card[data-dim="${dim}"]`).forEach(x=>{x.classList.remove('sel');x.setAttribute('aria-pressed','false');});
    this.classList.add('sel');
    this.setAttribute('aria-pressed','true');
    sel[dim]=v;
    // manualNav NO se resetea: si el usuario usó "Paso anterior", corregir una
    // respuesta no debe reexpulsarle hacia delante. Avanza con el botón Continuar.
    trackGAEvent('form_option_select',{
      event_category:'form',
      event_label:dim+':'+v,
      form_dimension:dim,
      form_value:v
    });
    const map={capital:'h-cap',plazo:'h-pla',viaje:'h-via'};
    if(map[dim])document.getElementById(map[dim]).value=v;
    if(cur===1&&sel.capital&&sel.plazo&&sel.viaje&&!manualNav)setTimeout(()=>goTo(2),DELAY);
  });
});

// Accesibilidad: opciones del formulario operables por teclado (Enter/Espacio) + ARIA
document.querySelectorAll('.opt-card, .canal-o').forEach(el=>{
  el.setAttribute('tabindex','0');
  el.setAttribute('role','button');
  if(!el.hasAttribute('aria-pressed'))el.setAttribute('aria-pressed',el.classList.contains('sel')?'true':'false');
  el.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();this.click();}
  });
});

document.querySelectorAll('.strategy-card').forEach(card=>{
  card.style.cursor='pointer';
  card.addEventListener('click',()=>{
    const form=document.getElementById('form');
    if(form)form.scrollIntoView({behavior:'smooth',block:'start'});
  });
});

function setCanal(el){
  document.querySelectorAll('.canal-o').forEach(x=>{x.classList.remove('sel');x.setAttribute('aria-pressed','false');});
  el.classList.add('sel');
  el.setAttribute('aria-pressed','true');
  document.getElementById('h-can').value=el.dataset.canal;
}

function checkGdpr(){
  // El botón ya no se deshabilita: un botón muerto no emite clics y dejaba sin
  // disparar lead_submit_attempt y sin mensaje al usuario. La barrera real de
  // consentimiento vive en el submit (validación con aviso explícito).
  const ok=document.getElementById('gdpr-cb').checked;
  const btn=document.getElementById('btn-sub');
  btn.classList.toggle('ready',ok);
}

function trackGAEvent(eventName, params){
  if(typeof window.gtag!=='function')return;
  window.gtag('event', eventName, params || {});
}

function trackAdsLeadConversion(leadData){
  if(typeof window.gtag!=='function')return;
  if(!ADS_CONVERSION_ID || !ADS_CONVERSION_LABEL)return;
  const conv={
    send_to:`${ADS_CONVERSION_ID}/${ADS_CONVERSION_LABEL}`,
    value:leadValueEUR(leadData?.tier),
    currency:'EUR'
  };
  // Deduplicación por persona: hay tres vías de conversión (formulario, modal
  // de WhatsApp y descarga de la guía) y un mismo visitante puede recorrer
  // varias. Con transaction_id, Google Ads cuenta una sola conversión por
  // email en lugar de tres, sin perder la de mayor valor.
  const dedupe=String(leadData?.email||'').trim().toLowerCase();
  if(dedupe)conv.transaction_id='he-'+dedupe;
  // El email NUNCA se envía en claro (dato personal identificable, prohibido además
  // por la política de PII de Google Ads). Enhanced conversions exige SHA-256 en
  // user_data y solo procede si el usuario aceptó las cookies publicitarias.
  if(!heAdsConsentGranted()){
    window.gtag('event','conversion',conv);
    return;
  }
  sha256Hex(leadData?.email).then(hash=>{
    if(hash)window.gtag('set','user_data',{sha256_email_address:hash});
    window.gtag('event','conversion',conv);
  });
}

function trackFormStep(step){
  if(seenFormSteps.has(step))return;
  seenFormSteps.add(step);
  trackGAEvent('form_step_view',{
    event_category:'form',
    event_label:'step_'+step,
    step_number:step
  });
}

function trackROIInteraction(){
  const price=Number(document.getElementById('roi-price')?.value||0);
  const y=Number(document.getElementById('roi-yield')?.value||0);
  const ap=Number(document.getElementById('roi-appr')?.value||0);
  const totalPct=Number((y+ap).toFixed(1));
  const payload=`${price}|${y}|${ap}|${totalPct}`;
  if(payload===lastRoiPayload)return;
  lastRoiPayload=payload;
  trackGAEvent('roi_calculator_interaction',{
    event_category:'analysis_tool',
    event_label:'roi_adjusted',
    roi_price:price,
    roi_yield_pct:y,
    roi_revaluation_pct:ap,
    roi_total_pct:totalPct
  });
}

function initSectionTracking(){
  const trackedIds=['hero','para-quien','como','confianza','zonas-inversion','roi','guia-fiscal','form','faq'];
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const sectionId=entry.target.id;
      if(!sectionId||seenSections.has(sectionId))return;
      seenSections.add(sectionId);
      // form_step_view del paso 1 se emite AQUI, cuando el formulario entra de
      // verdad en pantalla. Antes se disparaba al cargar la página y el dato de
      // GA4 ("54% ve el formulario") era ficticio.
      if(sectionId==='form')trackFormStep(1);
      trackGAEvent('section_view',{
        event_category:'engagement',
        event_label:sectionId,
        section_id:sectionId
      });
    });
  },{threshold:0.35});
  trackedIds.forEach(id=>{
    const el=document.getElementById(id);
    if(el)observer.observe(el);
  });
}

function initLeadMagnetTracking(){
  document.querySelectorAll('[data-he-lead-magnet]').forEach(el=>{
    el.addEventListener('click',()=>{
      trackGAEvent('lead_magnet_click',{
        event_category:'engagement',
        event_label:el.dataset.heLeadMagnet||'unknown',
        lead_magnet:el.dataset.heLeadMagnet||'unknown'
      });
    });
  });
}

function buildWeb3LeadPayload(formEl, leadData){
  const fd = new FormData();
  fd.append('access_key', formEl.querySelector('[name="access_key"]')?.value || W3F_KEY);
  fd.append('subject', document.getElementById('f-sub')?.value || 'Nuevo lead · Horizonte Emirates');
  fd.append('from_name', formEl.querySelector('[name="from_name"]')?.value || 'Horizonte Emirates');
  fd.append('replyto', document.getElementById('f-reply')?.value || leadData.email || '');
  fd.append('redirect', formEl.querySelector('[name="redirect"]')?.value || '');
  fd.append('botcheck', '');

  // M07 fix - nombres de campo ASCII simples (sin emojis ni '·'): los decorativos
  // llegaban con mojibake (UTF-8 leído como Latin-1) y rompían el parser de horizonte-emails.gs.
  // El parser ya reconoce estas claves normalizadas (no requiere tocar el Apps Script).
  fd.append('Nombre', leadData.nombre || '');
  fd.append('Telefono', leadData.telefono || '');
  fd.append('Email', leadData.mail || '');
  fd.append('Pais', leadData.pais || '');
  fd.append('Capital', leadData.capital || '');
  fd.append('Objetivo', leadData.objetivo || '');
  fd.append('Plazo', leadData.plazo || '');
  fd.append('Visita Dubai', leadData.visitaDubai || '');
  fd.append('Tier', leadData.tier || '');
  fd.append('Puntuacion', leadData.puntuacion || '');
  fd.append('Canal', leadData.canal || '');

  // Prueba del consentimiento: qué aceptó, con qué texto y cuándo (art. 7.1 RGPD).
  const okPriv=!!document.getElementById('gdpr-cb')?.checked;
  const okMkt =!!document.getElementById('gdpr-mkt')?.checked;
  fd.append('Consentimiento privacidad', okPriv ? 'SI' : 'NO');
  fd.append('Consentimiento marketing',  okMkt  ? 'SI' : 'NO');
  fd.append('Consentimiento version', CONSENT_VERSION);
  fd.append('Consentimiento fecha', new Date().toISOString());
  fd.append('Consentimiento texto', CONSENT_TEXTS.privacidad);
  if(okMkt) fd.append('Consentimiento texto marketing', CONSENT_TEXTS.marketing);

  const trackingParams=getTrackingParams();
  Object.entries(trackingParams).forEach(([k,v])=>fd.append(k,v));

  return fd;
}

// ── PUENTE HERO -> FORMULARIO ───────────────────────────────
// Las tarjetas de capital del hero no son un formulario aparte: marcan la
// respuesta en el formulario REAL y llevan a él. Así el usuario responde la
// primera pregunta sin teclado y sin scroll, y el resto del embudo (scoring,
// validación, envío) sigue siendo el mismo código.
(function initHeroCapture(){
  const botones=document.querySelectorAll('.hero-cap-o');
  if(!botones.length)return;
  botones.forEach(function(b){
    b.addEventListener('click',function(){
      const v=this.dataset.cap;
      if(!v)return;
      const tarjeta=document.querySelector('.opt-card[data-dim="capital"][data-v="'+v+'"]');
      trackGAEvent('hero_capital_select',{
        event_category:'form',
        event_label:'capital:'+v,
        form_dimension:'capital',
        form_value:v
      });
      // Reutiliza el manejador de la tarjeta real: marca, puntúa y persiste igual.
      if(tarjeta)tarjeta.click();
      // La pregunta ya respondida se colapsa a su respuesta: así el usuario ve
      // confirmado lo que eligió y, justo debajo, la pregunta siguiente entera.
      // Sin colapsar, las otras dos filas la empujaban fuera de la pantalla.
      const rejilla=document.getElementById('opts-cap');
      if(rejilla&&tarjeta){
        rejilla.classList.add('resuelto');
        const pista=rejilla.previousElementSibling;
        if(pista&&pista.classList.contains('fhint'))pista.classList.add('resuelto');
        if(!document.getElementById('cap-cambiar')){
          const cambiar=document.createElement('button');
          cambiar.type='button';
          cambiar.id='cap-cambiar';
          cambiar.className='fq-cambiar';
          cambiar.textContent='Cambiar el importe';
          cambiar.addEventListener('click',function(){
            rejilla.classList.remove('resuelto');
            const p=rejilla.previousElementSibling;
            if(p&&p.classList.contains('fhint'))p.classList.remove('resuelto');
            this.remove();
            rejilla.scrollIntoView({behavior:'smooth',block:'start'});
            trackGAEvent('form_capital_cambiar',{event_category:'form',event_label:'desde_hero'});
          });
          rejilla.insertAdjacentElement('afterend',cambiar);
        }
      }
      // Se aterriza sobre la respuesta recién marcada, no en la cabecera de la
      // sección: el usuario ve confirmado lo que acaba de elegir y justo debajo
      // la pregunta siguiente, sin tener que buscar por dónde continuar.
      const destino=tarjeta||document.getElementById('q-plazo')||document.getElementById('form');
      if(destino)destino.scrollIntoView({behavior:'smooth',block:'start'});
      const caja=document.querySelector('.form-wrap')||destino;
      if(caja){
        caja.classList.remove('form-llega');
        void caja.offsetWidth;
        caja.classList.add('form-llega');
        setTimeout(function(){caja.classList.remove('form-llega');},1300);
      }
    });
  });
})();

// Mientras la captura del hero está en pantalla, el CTA fijo y el flotante de
// WhatsApp se apartan: son el mismo objetivo y le tapaban opciones.
(function initHeroCapVisible(){
  const cap=document.querySelector('.hero-cap');
  if(!cap||!('IntersectionObserver' in window))return;
  new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      document.body.classList.toggle('hero-cap-vista',en.isIntersecting);
    });
  },{threshold:0.15}).observe(cap);
})();

// Mide los clics en los inmuebles del hero (la ruta de "mirar").
(function initHeroProps(){
  document.querySelectorAll('.hprop').forEach(function(a){
    a.addEventListener('click',function(){
      trackGAEvent('hero_property_click',{
        event_category:'engagement',
        event_label:this.dataset.trackProject||'sin_nombre'
      });
    });
  });
})();

// CTA principal: mide clics que llevan al formulario.
document.querySelectorAll('a[href="#form"]').forEach(link=>{
  link.addEventListener('click',function(){
    const label=(this.textContent||'').trim().replace(/\s+/g,' ').slice(0,80);
    trackGAEvent('generate_lead_click',{
      event_category:'engagement',
      event_label:label||'cta_form',
      link_target:'#form'
    });
  });
});

// La validación nativa del navegador (campos required, incluida la casilla RGPD)
// bloquea el submit ANTES de que llegue a dispararse: sin esto, esos intentos
// no dejaban rastro en GA4 y el final del embudo era invisible.
let lastInvalidTs=0;
document.getElementById('mainform').addEventListener('invalid',function(ev){
  const now=Date.now();
  if(now-lastInvalidTs<800)return;
  lastInvalidTs=now;
  trackGAEvent('lead_submit_attempt',{
    event_category:'form',
    event_label:'blocked_by_native_validation'
  });
  trackGAEvent('lead_submit_validation_error',{
    event_category:'form_error',
    event_label:'native:'+(ev.target.name||ev.target.id||'campo')
  });
},true);

document.getElementById('mainform').addEventListener('submit',function(e){
  e.preventDefault();
  trackGAEvent('lead_submit_attempt',{
    event_category:'form',
    event_label:'mainform_submit_attempt'
  });
  // Barrera de consentimiento independiente del botón deshabilitado: sin la casilla
  // obligatoria no se construye ni se envía el payload.
  if(!document.getElementById('gdpr-cb')?.checked){
    trackGAEvent('lead_submit_validation_error',{
      event_category:'form_error',
      event_label:'missing_consent'
    });
    showStatus('err','Debe aceptar la política de privacidad para enviar la solicitud.');return;
  }
  const emailVal=(this.querySelector('[name="email"]')?.value||'').trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)){
    trackGAEvent('lead_submit_validation_error',{
      event_category:'form_error',
      event_label:'invalid_email'
    });
    showStatus('err','Introduce un email válido para continuar.');return;
  }
  const pfx=document.getElementById('phone-pfx').value||'+34';
  // Normaliza el número: el autorrelleno del móvil suele pegar el prefijo dentro
  // del campo y sin esto el lead llegaba como "+34 +34 600..." (no marcable).
  let pnum=(document.getElementById('phone-num').value||'').trim().replace(/[^\d+]/g,'');
  if(pnum.startsWith('+'))pnum=pnum.slice(1);
  else if(pnum.startsWith('00'))pnum=pnum.slice(2);
  pnum=pnum.replace(/\D/g,'');
  const pfxDigits=pfx.replace(/\D/g,'');
  if(pfxDigits&&pnum.startsWith(pfxDigits)&&pnum.length-pfxDigits.length>=6)pnum=pnum.slice(pfxDigits.length);
  if(pnum.length<6){
    trackGAEvent('lead_submit_validation_error',{
      event_category:'form_error',
      event_label:'invalid_phone'
    });
    showStatus('err','Introduce un número de teléfono válido para continuar.');return;
  }
  document.getElementById('h-phone').value=pfx+' '+pnum;
  const{score,tier}=classify();
  document.getElementById('h-tier').value=tier;
  document.getElementById('h-score').value=score;
  const pais=this.querySelector('[name="pais"]').value||'';
  const nombre=(this.querySelector('[name="nombre"]')?.value||'').trim();
  // El asunto debe contener un marcador estable que reconozca isHorizonteWeb3Lead del Apps Script:
  // «[A|Xpts]», «Lead HE» y «Horizonte Emirates». No quitar ninguno sin actualizar el detector (regresión c3fdeb6).
  document.getElementById('f-sub').value=`[${tier}|${score}pts] Lead HE · ${pais} · Horizonte Emirates`;
  document.getElementById('f-reply').value=emailVal;
  const btn=document.getElementById('btn-sub');
  btn.disabled=true;btn.textContent='Enviando...';
  const payload=buildWeb3LeadPayload(this,{
    nombre,
    telefono:document.getElementById('h-phone').value,
    mail:emailVal,
    pais,
    capital:sel.capital||'',
    objetivo:sel.objetivo||'',
    plazo:sel.plazo||'',
    visitaDubai:sel.viaje||'',
    tier,
    puntuacion:String(score),
    canal:document.getElementById('h-can').value||'whatsapp'
  });
  // B5 - timeout explícito: sin señal, un POST que no responde dejaba el botón
  // en "Enviando..." para siempre. keepalive permite que el envío sobreviva si
  // el usuario navega justo después de pulsar.
  const ctrl=('AbortController' in window)?new AbortController():null;
  const tOut=ctrl?setTimeout(()=>ctrl.abort(),15000):null;
  fetch(W3F_EP,{method:'POST',body:payload,keepalive:true,signal:ctrl?ctrl.signal:undefined}).then(r=>r.json().catch(()=>({success:false}))).then(d=>{
    if(tOut)clearTimeout(tOut);
    if(d.success){
      savedLead={
        nombre,
        email:emailVal,
        telefono:document.getElementById('h-phone').value,
        pais,
        capital:sel.capital||'',
        objetivo:sel.objetivo||'',
        plazo:sel.plazo||'',
        viaje:sel.viaje||'',
        tier,
        score
      };
      // B6 - la pantalla de éxito se muestra ANTES del tracking: un fallo en la
      // medición nunca debe enseñar un error a un lead que ya entró.
      document.getElementById('mainform').style.display='none';
      const pw=document.querySelector('.form-progress-wrap');
      if(pw)pw.style.display='none';
      const fhd=document.querySelector('.form-hd');
      if(fhd)fhd.style.display='none';
      const calBtn=document.getElementById('suc-cal-btn');
      if(calBtn){
        const cp=new URLSearchParams();
        if(nombre)cp.set('name',nombre);
        if(emailVal)cp.set('email',emailVal);
        calBtn.href='https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-30-minutos?'+cp.toString();
      }
      document.getElementById('success').classList.add('show');
      try{
        trackGAEvent('generate_lead',{
          form_name:'contact_form',
          lead_source:'website',
          event_category:'form',
          event_label:'mainform_submit_success',
          value:leadValueEUR(tier),
          currency:'EUR',
          lead_tier:tier,
          lead_score:score,
          lead_country:pais || 'sin_pais'
        });
        trackAdsLeadConversion(savedLead);
        if(typeof window.fbq==='function')window.fbq('track','Lead',{value:leadValueEUR(tier),currency:'EUR'});
      }catch(e){/* la medición nunca rompe la experiencia del lead */}
    }else{
      trackGAEvent('lead_submit_error',{
        event_category:'form_error',
        event_label:'web3forms_rejected'
      });
      showStatus('err',d.message||'No se pudo enviar el formulario. Inténtalo de nuevo.');
      btn.disabled=false;btn.textContent='Solicitar análisis gratuito →';
    }
  }).catch(err=>{
    if(tOut)clearTimeout(tOut);
    trackGAEvent('lead_submit_error',{
      event_category:'form_error',
      event_label:(err&&err.name==='AbortError')?'timeout':'network_error'
    });
    showStatus('err','Error de conexión. Revisa tu conexión e inténtalo de nuevo.');
    btn.disabled=false;btn.textContent='Solicitar análisis gratuito →';
  });
});

function showStatus(kind,msg){
  const box=document.getElementById('form-status');
  box.className=`form-status show ${kind}`;box.textContent=msg;
}

// ── LEAD MAGNET: guía fiscal con un solo campo ─────────────────
// La descarga se abre SIEMPRE, aunque el registro falle: el usuario ya ha
// cumplido su parte y retenerle el PDF por un error nuestro no tiene sentido.
//
// IMPORTANTE (el asunto NO debe parecer un lead del funnel): pollGmail descarta
// por email duplicado (leadExists), así que si esta descarga entrase como lead,
// el MISMO usuario ya no podría registrarse después con el formulario completo.
// Perderíamos justo al lead más cualificado: el que primero se informa y luego
// se decide. Por eso el asunto evita «Horizonte Emirates», «Lead HE» y el
// marcador [X|Npts] que reconoce isHorizonteWeb3Lead.
const GUIA_URL='guias/guia-fiscal-dubai-espana.pdf';
// Debe coincidir LITERALMENTE con la etiqueta de la casilla en index.html
// (prueba del consentimiento, art. 7.1 RGPD). Si se cambia una, cambiar la otra.
const CONSENT_TEXT_GUIA='Acepto la política de privacidad y que me envíen la guía por email.';
(function initGuiaForm(){
  const form=document.getElementById('guiaform');
  if(!form)return;
  const status=document.getElementById('guia-status');
  const setStatus=(kind,msg)=>{if(status){status.className='form-status show '+kind;status.textContent=msg;}};
  // El botón nace como type="button" para que, si este script no llega a
  // ejecutarse (caché antigua, fallo de red, error previo), pulsarlo no lance
  // un submit nativo que recargue la página y borre lo escrito. Al enganchar
  // el manejador lo devolvemos a submit, que es lo correcto con JS disponible.
  const btnInit=document.getElementById('guia-btn');
  if(btnInit)btnInit.setAttribute('type','submit');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    const email=(document.getElementById('guia-email').value||'').trim();
    const okGdpr=!!document.getElementById('guia-gdpr').checked;
    trackGAEvent('lead_magnet_submit_attempt',{event_category:'lead_magnet',event_label:'guia_fiscal'});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
      trackGAEvent('lead_magnet_validation_error',{event_category:'form_error',event_label:'invalid_email'});
      setStatus('err','Introduce un email válido para recibir la guía.');return;
    }
    if(!okGdpr){
      trackGAEvent('lead_magnet_validation_error',{event_category:'form_error',event_label:'missing_consent'});
      setStatus('err','Debe aceptar la política de privacidad para descargar la guía.');return;
    }
    const btn=document.getElementById('guia-btn');
    btn.disabled=true;btn.textContent='Preparando...';
    const fd=new FormData();
    fd.append('access_key',W3F_KEY);
    // Asunto deliberadamente fuera del patrón del funnel: ver comentario de arriba.
    fd.append('subject','[Descarga guia fiscal] '+email);
    fd.append('from_name','Descargas web');
    fd.append('replyto',email);
    fd.append('Email',email);
    fd.append('Origen','Descarga guía fiscal');
    fd.append('Canal','email');
    const okMkt=!!(document.getElementById('guia-mkt')||{}).checked;
    fd.append('Consentimiento privacidad','SI');
    fd.append('Consentimiento marketing',okMkt?'SI':'NO');
    fd.append('Consentimiento version',CONSENT_VERSION);
    fd.append('Consentimiento fecha',new Date().toISOString());
    fd.append('Consentimiento texto',CONSENT_TEXT_GUIA);
    if(okMkt)fd.append('Consentimiento texto marketing',CONSENT_TEXTS.marketing);
    Object.entries(getTrackingParams()).forEach(([k,v])=>fd.append(k,v));
    fd.append('botcheck','');
    // La descarga se abre de forma síncrona: si se esperase a la respuesta del
    // registro, el navegador bloquearía la pestaña emergente.
    window.open(GUIA_URL,'_blank','noopener');
    form.querySelector('.guia-row').style.display='none';
    document.querySelectorAll('.guia-gdpr').forEach(el=>{el.style.display='none';});
    // El enlace se muestra SIEMPRE: con 'noopener', window.open devuelve null
    // por especificación aunque la pestaña se haya abierto, así que no hay forma
    // fiable de detectar un bloqueo. Dejar el enlace a mano cubre los dos casos.
    setStatus('ok','Su guía se ha abierto en una pestaña nueva. Si no la ve, ');
    const a=document.createElement('a');
    a.href=GUIA_URL;a.target='_blank';a.rel='noopener';
    a.textContent='ábrala aquí';
    a.style.textDecoration='underline';a.style.fontWeight='600';
    if(status){
      status.appendChild(a);
      status.appendChild(document.createTextNode('. También se la enviamos a '+email+'.'));
    }
    fetch(W3F_EP,{method:'POST',body:fd,keepalive:true})
      .then(r=>r.json().catch(()=>({success:false})))
      .then(d=>{
        if(!d.success){
          trackGAEvent('lead_submit_error',{event_category:'form_error',event_label:'guia_web3forms_rejected'});
          return;
        }
        // La conversión solo se cuenta si el registro llegó de verdad.
        try{
          trackGAEvent('generate_lead',{
            form_name:'lead_magnet_guia',
            lead_source:'website_guia',
            event_category:'lead_magnet',
            event_label:'guia_fiscal_descarga',
            value:leadValueEUR('C'),
            currency:'EUR',
            lead_tier:'C'
          });
          trackAdsLeadConversion({tier:'C',email:email});
          if(typeof window.fbq==='function')window.fbq('track','Lead',{value:leadValueEUR('C'),currency:'EUR'});
        }catch(err){}
      })
      .catch(()=>{trackGAEvent('lead_submit_error',{event_category:'form_error',event_label:'guia_network_error'});});
  });
})();

// ── WA MODAL
function buildWaMsg(data){
  const n=(data?.nombre||'').trim();
  const cap=data?.capital?`\n- Capital: ${data.capital}`:'';
  const obj=data?.objetivo?`\n- Objetivo: ${data.objetivo}`:'';
  const txt=n
    ?`Hola, soy ${n}. Vengo de Horizonte Emirates y he dejado mis datos para recibir acompañamiento gratuito e invertir en Emiratos.${cap}${obj}`
    :'Hola. Vengo de Horizonte Emirates y me interesa recibir información sobre inversión inmobiliaria en UAE.';
  return`${WA_URL}?text=${encodeURIComponent(txt)}`;
}

function openWaDirect(preData){
  trackGAEvent('whatsapp_click',{
    event_category:'contact',
    event_label:'success_screen_whatsapp'
  });
  window.open(buildWaMsg(preData||savedLead),'_blank','noopener');
  return false;
}

function openWaModal(preData){
  trackGAEvent('whatsapp_modal_open',{
    event_category:'contact',
    event_label:'whatsapp_modal_open'
  });
  const ov=document.getElementById('wao');
  if(preData?.nombre)document.getElementById('wam-n').value=preData.nombre;
  if(preData?.email)document.getElementById('wam-e').value=preData.email;
  ov.style.display='flex';
  document.body.style.overflow='hidden';
  setTimeout(()=>{try{document.getElementById('wam-n').focus();}catch(e){}},100);
  return false;
}
function closeWaModal(){
  document.getElementById('wao').style.display='none';
  document.body.style.overflow='';
  document.getElementById('wam-err').classList.remove('show');
}
document.getElementById('wao').addEventListener('click',function(e){if(e.target===this)closeWaModal();});

document.getElementById('waf').addEventListener('submit',function(e){
  e.preventDefault();
  const n=(document.getElementById('wam-n').value||'').trim();
  const em=(document.getElementById('wam-e').value||'').trim();
  const pfx=document.getElementById('wam-pfx').value;
  const ph=(document.getElementById('wam-ph').value||'').trim();
  const err=document.getElementById('wam-err');
  if(!n){err.textContent='Por favor introduce tu nombre.';err.classList.add('show');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){err.textContent='Introduce un email válido.';err.classList.add('show');return;}
  if(ph.replace(/\D/g,'').length<6){err.textContent='Introduce un teléfono válido.';err.classList.add('show');return;}
  if(!document.getElementById('wam-gdpr').checked){err.textContent='Debes aceptar la política de privacidad para continuar.';err.classList.add('show');return;}
  err.classList.remove('show');
  const fd=new FormData();
  fd.append('access_key',W3F_KEY);
  fd.append('subject','[WhatsApp directo] '+n+' · Horizonte Emirates');
  fd.append('from_name','Horizonte Emirates');
  fd.append('replyto',em);
  fd.append('nombre',n);fd.append('email',em);
  fd.append('telefono',pfx+' '+ph);
  fd.append('origen','Botón WhatsApp flotante');
  fd.append('Consentimiento privacidad','SI');
  fd.append('Consentimiento marketing',document.getElementById('wam-mkt')?.checked?'SI':'NO');
  fd.append('Consentimiento version',CONSENT_VERSION);
  fd.append('Consentimiento fecha',new Date().toISOString());
  fd.append('Consentimiento texto',CONSENT_TEXTS.privacidad);
  const trackingParams=getTrackingParams();
  Object.entries(trackingParams).forEach(([k,v])=>fd.append(k,v));
  fd.append('fecha_registro',new Date().toLocaleString('es-ES',{timeZone:'Europe/Madrid'}));
  fd.append('botcheck','');
  // keepalive: el envío sobrevive aunque el usuario salte a WhatsApp al instante.
  // window.open debe seguir siendo síncrono (esperar la respuesta haría que el
  // navegador bloquease la ventana emergente), así que el resultado se registra aparte.
  fetch(W3F_EP,{method:'POST',body:fd,keepalive:true})
    .then(r=>r.json().catch(()=>({success:false})))
    .then(d=>{
      if(!d.success)trackGAEvent('lead_submit_error',{event_category:'form_error',event_label:'whatsapp_web3forms_rejected'});
    })
    .catch(()=>{trackGAEvent('lead_submit_error',{event_category:'form_error',event_label:'whatsapp_network_error'});});
  savedLead={nombre:n,email:em};
  try{
    // Un lead del modal de WhatsApp es un lead real (nombre, email y teléfono
    // capturados): cuenta como generate_lead con valor de tier C. Antes este
    // canal no atribuía ninguna conversión.
    trackGAEvent('generate_lead',{
      form_name:'whatsapp_modal',
      lead_source:'website_whatsapp',
      event_category:'contact',
      event_label:'whatsapp_modal_submit_success',
      value:leadValueEUR('C'),
      currency:'EUR',
      lead_tier:'C'
    });
    trackAdsLeadConversion({tier:'C',email:em});
    if(typeof window.fbq==='function')window.fbq('track','Lead',{value:leadValueEUR('C'),currency:'EUR'});
  }catch(e){}
  trackGAEvent('whatsapp_lead_submit',{
    event_category:'contact',
    event_label:'whatsapp_modal_submit'
  });
  closeWaModal();
  window.open(buildWaMsg(savedLead),'_blank','noopener');
});

// ── FAQ (V6 accordion)
(function initFaqAccordion(){
  const items=[...document.querySelectorAll('.faq-item')];
  items.forEach(item=>{
    const btn=item.querySelector('.faq-q');
    const panel=item.querySelector('.faq-a');
    const inner=panel&&panel.querySelector('.faq-a-inner');
    if(!btn||!panel||!inner)return;
    btn.addEventListener('click',()=>{
      const willOpen=!item.classList.contains('open');
      items.forEach(i=>{
        i.classList.remove('open');
        const p=i.querySelector('.faq-a');
        const b=i.querySelector('.faq-q');
        if(p)p.style.maxHeight='0';
        if(b)b.setAttribute('aria-expanded','false');
      });
      if(willOpen){
        item.classList.add('open');
        btn.setAttribute('aria-expanded','true');
        panel.style.maxHeight=inner.scrollHeight+'px';
      }
    });
  });
  window.addEventListener('resize',()=>{
    const open=document.querySelector('.faq-item.open .faq-a');
    const inner=open&&open.querySelector('.faq-a-inner');
    if(open&&inner)open.style.maxHeight=inner.scrollHeight+'px';
  });
})();

// ── FAQ fiscal tabs (A04)
(function initFaqFiscalTabs(){
  const tabs=[...document.querySelectorAll('.faq-fiscal-tab')];
  if(!tabs.length)return;
  const panels={
    es:document.getElementById('faq-fiscal-es'),
    ad:document.getElementById('faq-fiscal-ad'),
    latam:document.getElementById('faq-fiscal-latam')
  };
  function resizeOpenFaq(){
    const open=document.querySelector('.faq-item.open .faq-a');
    const inner=open&&open.querySelector('.faq-a-inner');
    if(open&&inner)open.style.maxHeight=inner.scrollHeight+'px';
  }
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      const key=tab.dataset.fiscalTab;
      tabs.forEach(t=>{
        const on=t===tab;
        t.classList.toggle('active',on);
        t.setAttribute('aria-selected',on?'true':'false');
      });
      Object.keys(panels).forEach(k=>{
        const p=panels[k];
        if(!p)return;
        const on=k===key;
        p.classList.toggle('active',on);
        p.hidden=!on;
      });
      resizeOpenFaq();
    });
  });
})();

function initTicker(){
  const inner=document.getElementById('ticker-inner');
  if(!inner||inner.dataset.initialized)return;
  const lines=Array.from(inner.querySelectorAll('.ticker-line'));
  if(!lines.length)return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){
    inner.classList.add('ticker-static');
    lines.forEach(function(l,i){l.hidden=i!==0;});
    let idx=0;
    setInterval(function(){
      lines[idx].hidden=true;
      idx=(idx+1)%lines.length;
      lines[idx].hidden=false;
    },4500);
    inner.dataset.initialized='1';
    return;
  }
  lines.forEach(function(l){inner.appendChild(l.cloneNode(true));});
  inner.dataset.initialized='1';
}

function fmtEUR(n){
  return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
}
function fmtPct(x){
  return new Intl.NumberFormat('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1}).format(x)+'%';
}
function calcROI(){
  const priceEl=document.getElementById('roi-price');
  const yEl=document.getElementById('roi-yield');
  const aEl=document.getElementById('roi-appr');
  if(!priceEl||!yEl||!aEl)return;
  const price=Number(priceEl.value)||0;
  const y=Number(yEl.value)||0;
  const ap=Number(aEl.value)||0;
  const rent=price*(y/100);
  const appr=price*(ap/100);
  const total=rent+appr;
  const totalPct=price>0?((total/price)*100):0;
  const esRef=6;
  const aePct=y+ap;
  document.getElementById('roi-price-lbl').textContent=fmtEUR(price);
  document.getElementById('roi-yield-lbl').textContent=fmtPct(y);
  document.getElementById('roi-appr-lbl').textContent=fmtPct(ap);
  document.getElementById('roi-rent-out').textContent=fmtEUR(rent);
  document.getElementById('roi-appr-out').textContent=fmtEUR(appr);
  document.getElementById('roi-total-out').textContent=fmtEUR(total)+' · '+fmtPct(totalPct);
  const max=Math.max(esRef,aePct,0.001);
  document.getElementById('bar-es').style.width=(esRef/max*100)+'%';
  document.getElementById('bar-ae').style.width=(aePct/max*100)+'%';
  document.getElementById('bar-ae-lbl').textContent=fmtPct(y)+' + '+fmtPct(ap)+' = '+fmtPct(aePct);
}

// ── Scroll reveals: easing premium, escalonado (hero sin animación: fijo al cargar)
(function(){
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)document.documentElement.classList.add('reduce-motion');
  const revealEase=(entries,obs)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const t=entry.target;
      t.classList.add('in');
      obs.unobserve(t);
    });
  };
  const io=new IntersectionObserver(revealEase,{
    root:null,
    rootMargin:'0px 0px -11% 0px',
    threshold:[0,0.1],
  });
  document.querySelectorAll('.fade, .reveal-stagger').forEach(el=>io.observe(el));
  // Avisa a boot.js de que el reveal esta en marcha: sin esta marca, a los 3 s
  // de cargar la pagina el CSS muestra todo el contenido sin esperar al scroll.
  document.documentElement.classList.add('reveal-ok');
})();

// ── KPI +334.000 - rodillos verticales (tragaperras)
(function(){
  const strip=document.getElementById('kpi-strip');
  const wrap=document.getElementById('kpi-slot-wrap');
  if(!strip||!wrap)return;
  const target=Number(wrap.getAttribute('data-target'))||334000;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let played=false;

  function run(){
    if(played)return;
    played=true;
    const finalTxt='+'+target.toLocaleString('es-ES');
    if(reduce){
      wrap.textContent=finalTxt;
      return;
    }
    const digits=String(Math.max(0,Math.min(999999,target))).padStart(6,'0').split('').map(Number);
    wrap.textContent='';
    const plus=document.createElement('span');
    plus.className='slot-plus';
    plus.textContent='+';
    wrap.appendChild(plus);

    function makeReel(d,j){
      const reel=document.createElement('span');
      reel.className='slot-reel';
      const track=document.createElement('span');
      track.className='slot-track';
      // INP (H12): el track solo necesita las filas que se recorren visiblemente
      // (startRow→endRow). Antes creaba ~540-1120 celdas/rodillo (~5.000 nodos en total);
      // ahora ~50-85, manteniendo idéntica distancia de giro, dígito final y duración
      // (la velocidad depende de la distancia recorrida, no del nº de filas del track).
      const travel=42+j*7+Math.floor(Math.random()*8);
      const endRow=travel+((d-(travel%10)+10)%10); // alinea el final con el dígito d
      const startRow=Math.max(0,endRow-travel);
      for(let r=0;r<=endRow+3;r++){
        const cell=document.createElement('span');
        cell.className='slot-cell';
        cell.textContent=String(r%10);
        track.appendChild(cell);
      }
      reel.appendChild(track);
      return{reel,track,startRow,endRow,j};
    }

    const reels=[];
    for(let j=0;j<3;j++){
      const r=makeReel(digits[j],j);
      reels.push(r);
      wrap.appendChild(r.reel);
    }
    const dot=document.createElement('span');
    dot.className='slot-dot';
    dot.textContent='.';
    wrap.appendChild(dot);
    for(let j=0;j<3;j++){
      const r=makeReel(digits[3+j],3+j);
      reels.push(r);
      wrap.appendChild(r.reel);
    }

    void wrap.offsetHeight;
    const t0=reels[0].track;
    const c0=t0.children[0];
    const c1=t0.children[1];
    let cellPx=c1?c1.offsetTop-c0.offsetTop:0;
    if(!cellPx||cellPx<4){
      const br=c0.getBoundingClientRect();
      cellPx=Math.ceil(br.height||c0.offsetHeight)+6;
    }else{
      cellPx=Math.ceil(cellPx)+4;
    }
    reels.forEach(({reel,track})=>{
      reel.style.height=cellPx+'px';
      reel.style.lineHeight=cellPx+'px';
      track.querySelectorAll('.slot-cell').forEach(function(cell){
        cell.style.height=cellPx+'px';
        cell.style.minHeight=cellPx+'px';
        cell.style.lineHeight=cellPx+'px';
      });
    });
    void wrap.offsetHeight;
    const step=Math.ceil(t0.children[1].offsetTop-t0.children[0].offsetTop);
    if(step>=4&&step!==cellPx){
      cellPx=step;
      reels.forEach(({reel,track})=>{
        reel.style.height=cellPx+'px';
        reel.style.lineHeight=cellPx+'px';
        track.querySelectorAll('.slot-cell').forEach(function(cell){
          cell.style.height=cellPx+'px';
          cell.style.minHeight=cellPx+'px';
          cell.style.lineHeight=cellPx+'px';
        });
      });
      void wrap.offsetHeight;
    }

    reels.forEach(({track,startRow})=>{
      track.style.transition='none';
      track.style.transform='translate3d(0,-'+(startRow*cellPx)+'px,0)';
    });
    void wrap.offsetHeight;

    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        reels.forEach(({track,startRow,endRow,j})=>{
          const fromRight=5-j;
          const durS=1.12+fromRight*0.36;
          track.style.transitionProperty='transform';
          track.style.transitionDuration=durS+'s';
          track.style.transitionTimingFunction='cubic-bezier(0.12,0.88,0.18,1)';
          track.style.transform='translate3d(0,-'+(endRow*cellPx)+'px,0)';
        });
      });
    });

    reels.forEach(({track})=>{
      track.addEventListener('transitionend',function te(ev){
        if(ev.propertyName!=='transform')return;
        track.removeEventListener('transitionend',te);
        track.style.willChange='auto';
      });
    });
  }

  const counterObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting)return;
      counterObs.disconnect();
      run();
    });
  },{rootMargin:'0px 0px -5% 0px',threshold:0.12});
  counterObs.observe(strip);
})();
initTicker();
['roi-price','roi-yield','roi-appr'].forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('input',()=>{
    calcROI();
    clearTimeout(roiEventTimer);
    roiEventTimer=setTimeout(trackROIInteraction,350);
  });
});
calcROI();
updProg(1);
initSectionTracking();
initLeadMagnetTracking();
captureUTM();
// Estado visual del botón de envío coherente tras recarga o vuelta desde el
// bfcache del móvil (la casilla puede venir marcada del estado restaurado).
checkGdpr();
window.addEventListener('pageshow',function(){checkGdpr();});

// M25/M26 - listeners que sustituyen a los onclick/onchange inline (CSP sin unsafe-inline)
document.querySelectorAll('.canal-o').forEach(function(el){ el.addEventListener('click', function(){ setCanal(this); }); });
(function(){ var g=document.getElementById('gdpr-cb'); if(g) g.addEventListener('change', checkGdpr); })();
(function(){ var b=document.getElementById('btn-back'); if(b) b.addEventListener('click', goBack); })();
(function(){ var n1=document.getElementById('btn-next-1'); if(n1) n1.addEventListener('click', function(){ tryAdvance(1); }); })();
// A9 - el CTA fijo desaparece cuando el formulario está en pantalla: competía
// visualmente con el botón de envío real y tapaba el final del paso 3.
(function(){
  var cta=document.querySelector('.sticky-cta');
  var form=document.getElementById('form');
  if(!cta||!form||!('IntersectionObserver' in window))return;
  new IntersectionObserver(function(entries){
    entries.forEach(function(en){cta.classList.toggle('hidden',en.isIntersecting);});
  },{threshold:0.05}).observe(form);
})();
(function(){ var w=document.getElementById('wa-success-link'); if(w) w.addEventListener('click', function(e){ e.preventDefault(); openWaDirect(savedLead); }); })();
(function(){ var c=document.querySelector('.wam-close'); if(c) c.addEventListener('click', closeWaModal); })();
(function(){ var f=document.querySelector('.wa-float a'); if(f) f.addEventListener('click', function(e){ e.preventDefault(); openWaModal(null); }); })();

// Menú móvil (hamburguesa) y nav-auto-ocultable al scroll: movidos a assets/common.js (F6, compartido).

// ── M23 - Persistencia del formulario + validación inline ──────────────
(function () {
  var KEY = 'he_form_state';
  var form = document.getElementById('mainform');
  if (!form) return;

  function snapshot() {
    return {
      cur: (typeof cur !== 'undefined') ? cur : 1,
      sel: (typeof sel !== 'undefined') ? sel : {},
      nombre: (form.querySelector('[name="nombre"]') || {}).value || '',
      email: (form.querySelector('[name="email"]') || {}).value || '',
      pfx: (document.getElementById('phone-pfx') || {}).value || '',
      tel: (document.getElementById('phone-num') || {}).value || '',
      pais: (form.querySelector('[name="pais"]') || {}).value || '',
      canal: (document.getElementById('h-can') || {}).value || '',
      gdpr: !!(document.getElementById('gdpr-cb') || {}).checked,
      mkt: !!(document.getElementById('gdpr-mkt') || {}).checked
    };
  }
  function save() {
    if (form.style.display === 'none') return;
    try { sessionStorage.setItem(KEY, JSON.stringify(snapshot())); } catch (e) {}
  }
  window.heFormSave = save;
  var t;
  function saveSoon() { clearTimeout(t); t = setTimeout(save, 300); }

  function restore() {
    var raw; try { raw = sessionStorage.getItem(KEY); } catch (e) { return; }
    if (!raw) return;
    var st; try { st = JSON.parse(raw); } catch (e) { return; }
    if (!st) return;
    ['capital', 'plazo', 'viaje'].forEach(function (dim) {
      var v = st.sel && st.sel[dim];
      if (!v) return;
      sel[dim] = v;
      var card = document.querySelector('.opt-card[data-dim="' + dim + '"][data-v="' + v + '"]');
      if (card) { card.classList.add('sel'); card.setAttribute('aria-pressed', 'true'); }
      var map = { capital: 'h-cap', plazo: 'h-pla', viaje: 'h-via' };
      var h = document.getElementById(map[dim]); if (h) h.value = v;
    });
    var setVal = function (q, val) { var el = form.querySelector(q); if (el && val) el.value = val; };
    setVal('[name="nombre"]', st.nombre);
    setVal('[name="email"]', st.email);
    setVal('[name="pais"]', st.pais);
    if (st.pfx) { var pf = document.getElementById('phone-pfx'); if (pf) pf.value = st.pfx; }
    if (st.tel) { var pn = document.getElementById('phone-num'); if (pn) pn.value = st.tel; }
    if (st.canal) {
      // La opción "email" se retiró del selector: un valor guardado en una
      // sesión anterior dejaría el hidden con un canal sin botón visible.
      if (!document.querySelector('.canal-o[data-canal="' + st.canal + '"]')) st.canal = 'whatsapp';
      var hc = document.getElementById('h-can'); if (hc) hc.value = st.canal;
      document.querySelectorAll('.canal-o').forEach(function (c) {
        var on = c.dataset.canal === st.canal;
        c.classList.toggle('sel', on); c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    if (st.gdpr) { var g = document.getElementById('gdpr-cb'); if (g) g.checked = true; }
    if (st.mkt) { var m = document.getElementById('gdpr-mkt'); if (m) m.checked = true; }
    if (typeof checkGdpr === 'function') checkGdpr();
    if (st.cur && st.cur >= 1 && st.cur <= 2) {
      for (var s = 1; s <= 2; s++) {
        var fs = document.getElementById('fs' + s);
        if (fs) fs.classList.toggle('active', s === st.cur);
      }
      cur = st.cur;
      if (typeof updProg === 'function') updProg(cur);
    }
  }

  document.querySelectorAll('.opt-card, .canal-o').forEach(function (el) { el.addEventListener('click', saveSoon); });
  form.querySelectorAll('input, select').forEach(function (el) { el.addEventListener('input', saveSoon); el.addEventListener('change', saveSoon); });

  form.addEventListener('submit', function () {
    var iv = setInterval(function () {
      var ok = document.getElementById('success');
      if (ok && ok.classList.contains('show')) { try { sessionStorage.removeItem(KEY); } catch (e) {} clearInterval(iv); }
    }, 500);
    setTimeout(function () { clearInterval(iv); }, 20000);
  });

  var emailEl = form.querySelector('[name="email"]');
  if (emailEl) emailEl.addEventListener('blur', function () {
    var v = this.value.trim();
    this.style.borderColor = (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) ? '#c43a3a' : '';
  });
  var telEl = document.getElementById('phone-num');
  if (telEl) telEl.addEventListener('blur', function () {
    var d = this.value.replace(/\D/g, '');
    this.style.borderColor = (this.value.trim() && d.length < 6) ? '#c43a3a' : '';
  });

  restore();
})();
