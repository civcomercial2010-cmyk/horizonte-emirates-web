/* index.html - JS externalizado (M25/M26: retirar unsafe-inline de script-src). */
const WA_URL='https://wa.me/971554722025';
const W3F_KEY='3861d49c-5f0a-4dc3-a9e9-08b1758a110a';
const W3F_EP='https://api.web3forms.com/submit';
const ADS_CONVERSION_ID='AW-586671676';
const ADS_CONVERSION_LABEL=''; // M04 — pega aquí la etiqueta de la conversión nativa de Google Ads (formato AbCdEfGhIjk) SOLO si NO importas generate_lead desde GA4. Vacío = no dispara la nativa (evita doble conteo si usas la vía GA4→Ads).
// M05 — valor económico estimado del lead por tier (para Smart Bidding / ROAS). Ajustable.
const LEAD_VALUE_EUR={A:300,B:120,C:40};
function leadValueEUR(tier){return LEAD_VALUE_EUR[tier]||LEAD_VALUE_EUR.C;}
let savedLead={};
let roiEventTimer=null;
let lastRoiPayload='';
const seenFormSteps=new Set();
const seenSections=new Set();

// ── UTM CAPTURE
function captureUTM(){
  // M11 — persiste UTM/click-ids de la URL en sessionStorage; getTrackingParams() los adjunta al lead en el envío.
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
const SCORES={
  capital:{'150k-300k':1,'300k-600k':2,'600k-1M':3,'mas1M':4},
  objetivo:{'alquiler':3,'revalorizacion':3,'diversificacion':2,'residencia':1},
  plazo:{'ya':4,'6meses':3,'12meses':2,'indefinido':1},
  viaje:{'si':2,'quizas':1,'no':0}
};
let cur=1,sel={capital:null,objetivo:null,plazo:null,viaje:null};
const DELAY=340;

function classify(){
  const s=(SCORES.capital[sel.capital]||0)+(SCORES.objetivo[sel.objetivo]||0)+
          (SCORES.plazo[sel.plazo]||0)+(SCORES.viaje[sel.viaje]||0);
  return{score:s,tier:s>=9?'A':s>=6?'B':'C'};
}

function updProg(step){
  const fill=document.getElementById('form-progress-fill');
  const lab=document.getElementById('form-step-label');
  const pct=step<=1?33.33:step===2?66.66:100;
  if(fill)fill.style.width=pct+'%';
  if(lab)lab.textContent='Paso '+step+' de 3';
  document.getElementById('btn-back').style.display=step>1?'block':'none';
}

function goTo(step){
  document.getElementById('fs'+cur).classList.remove('active');
  cur=step;
  document.getElementById('fs'+cur).classList.add('active');
  updProg(cur);
  trackFormStep(cur);
  const anchor=document.querySelector('.form-progress-wrap');
  if(anchor)anchor.scrollIntoView({behavior:'smooth',block:'start'});
}
function goBack(){if(cur>1)goTo(cur-1);}

document.querySelectorAll('.opt-card').forEach(el=>{
  el.addEventListener('click',function(){
    const dim=this.dataset.dim,v=this.dataset.v;
    if(!dim)return;
    document.querySelectorAll(`.opt-card[data-dim="${dim}"]`).forEach(x=>{x.classList.remove('sel');x.setAttribute('aria-pressed','false');});
    this.classList.add('sel');
    this.setAttribute('aria-pressed','true');
    sel[dim]=v;
    trackGAEvent('form_option_select',{
      event_category:'form',
      event_label:dim+':'+v,
      form_dimension:dim,
      form_value:v
    });
    const map={capital:'h-cap',objetivo:'h-obj',plazo:'h-pla',viaje:'h-via'};
    if(map[dim])document.getElementById(map[dim]).value=v;
    if(cur===1&&sel.capital&&sel.objetivo)setTimeout(()=>goTo(2),DELAY);
    if(cur===2&&sel.plazo&&sel.viaje)setTimeout(()=>goTo(3),DELAY);
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
  const ok=document.getElementById('gdpr-cb').checked;
  const btn=document.getElementById('btn-sub');
  btn.disabled=!ok;
  btn.classList.toggle('ready',ok);
}

function trackGAEvent(eventName, params){
  if(typeof window.gtag!=='function')return;
  window.gtag('event', eventName, params || {});
}

function trackAdsLeadConversion(leadData){
  if(typeof window.gtag!=='function')return;
  if(!ADS_CONVERSION_ID || !ADS_CONVERSION_LABEL)return;
  window.gtag('event','conversion',{
    send_to:`${ADS_CONVERSION_ID}/${ADS_CONVERSION_LABEL}`,
    value:leadValueEUR(leadData?.tier),
    currency:'EUR',
    email:leadData?.email||''
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
  const trackedIds=['hero','para-quien','como','zonas-inversion','roi','form','faq'];
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const sectionId=entry.target.id;
      if(!sectionId||seenSections.has(sectionId))return;
      seenSections.add(sectionId);
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

function buildWeb3LeadPayload(formEl, leadData){
  const fd = new FormData();
  fd.append('access_key', formEl.querySelector('[name="access_key"]')?.value || W3F_KEY);
  fd.append('subject', document.getElementById('f-sub')?.value || 'Nuevo lead · Horizonte Emirates V6');
  fd.append('from_name', formEl.querySelector('[name="from_name"]')?.value || 'Horizonte Emirates');
  fd.append('replyto', document.getElementById('f-reply')?.value || leadData.email || '');
  fd.append('redirect', formEl.querySelector('[name="redirect"]')?.value || '');
  fd.append('botcheck', '');

  // M07 fix — nombres de campo ASCII simples (sin emojis ni '·'): los decorativos
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
  const trackingParams=getTrackingParams();
  Object.entries(trackingParams).forEach(([k,v])=>fd.append(k,v));

  return fd;
}

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

document.getElementById('mainform').addEventListener('submit',function(e){
  e.preventDefault();
  trackGAEvent('lead_submit_attempt',{
    event_category:'form',
    event_label:'mainform_submit_attempt'
  });
  const emailVal=(this.querySelector('[name="email"]')?.value||'').trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)){
    trackGAEvent('lead_submit_validation_error',{
      event_category:'form_error',
      event_label:'invalid_email'
    });
    showStatus('err','Introduce un email válido para continuar.');return;
  }
  const pfx=document.getElementById('phone-pfx').value||'+34';
  const pnum=(document.getElementById('phone-num').value||'').trim();
  if(pnum.replace(/\D/g,'').length<6){
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
  document.getElementById('f-sub').value=`[${tier}|${score}pts] Lead HE V6 · ${pais}`;
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
  fetch(W3F_EP,{method:'POST',body:payload}).then(r=>r.json().catch(()=>({success:false}))).then(d=>{
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
        calBtn.href='https://calendly.com/hola-horizonteemirates/llamada-estrategica-horizonte-emirates-20-minutos?'+cp.toString();
      }
      document.getElementById('success').classList.add('show');
    }else{
      trackGAEvent('lead_submit_error',{
        event_category:'form_error',
        event_label:'web3forms_rejected'
      });
      showStatus('err',d.message||'No se pudo enviar el formulario. Inténtalo de nuevo.');
      btn.disabled=false;btn.textContent='Solicitar análisis personalizado →';
    }
  }).catch(()=>{
    trackGAEvent('lead_submit_error',{
      event_category:'form_error',
      event_label:'network_error'
    });
    showStatus('err','Error de conexión. Revisa tu conexión e inténtalo de nuevo.');
    btn.disabled=false;btn.textContent='Solicitar análisis personalizado →';
  });
});

function showStatus(kind,msg){
  const box=document.getElementById('form-status');
  box.className=`form-status show ${kind}`;box.textContent=msg;
}

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
  fd.append('subject','[WhatsApp directo] '+n+' · Horizonte Emirates V6');
  fd.append('from_name','Horizonte Emirates');
  fd.append('replyto',em);
  fd.append('nombre',n);fd.append('email',em);
  fd.append('telefono',pfx+' '+ph);
  fd.append('origen','Botón WhatsApp flotante');
  const trackingParams=getTrackingParams();
  Object.entries(trackingParams).forEach(([k,v])=>fd.append(k,v));
  fd.append('fecha_registro',new Date().toLocaleString('es-ES',{timeZone:'Europe/Madrid'}));
  fd.append('botcheck','');
  fetch(W3F_EP,{method:'POST',body:fd}).catch(()=>{});
  savedLead={nombre:n,email:em};
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

function initTicker(){
  const inner=document.getElementById('ticker-inner');
  if(!inner||inner.dataset.cloned)return;
  const lines=Array.from(inner.querySelectorAll('.ticker-line'));
  if(!lines.length)return;
  lines.forEach(function(l){inner.appendChild(l.cloneNode(true));});
  inner.dataset.cloned='1';
}

function initMetricsCounter(){
  const root=document.querySelector('.metrics-sect');
  if(!root)return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ran=false;
  function tickNum(el,to,dur){
    const start=performance.now();
    const from=0;
    function frame(t){
      const p=Math.min(1,(t-start)/dur);
      const eased=1-Math.pow(1-p,3);
      el.textContent=Math.round(from+(to-from)*eased);
      if(p<1)requestAnimationFrame(frame);
      else el.textContent=String(to);
    }
    requestAnimationFrame(frame);
  }
  function run(){
    if(ran)return;
    ran=true;
    root.querySelectorAll('.metric-tile').forEach(tile=>{
      const m=tile.getAttribute('data-metric');
      if(m==='num'){
        const tgt=Number(tile.getAttribute('data-target'))||0;
        const numEl=tile.querySelector('.metric-num');
        if(numEl){
          if(reduce)numEl.textContent=String(tgt);
          else tickNum(numEl,tgt,tgt===334?1400:900);
        }
      }else if(m==='dual'){
        const a=Number(tile.getAttribute('data-a'))||0;
        const b=Number(tile.getAttribute('data-b'))||0;
        const elA=tile.querySelector('.m-a');
        const elB=tile.querySelector('.m-b');
        if(reduce){if(elA)elA.textContent=String(a);if(elB)elB.textContent=String(b);return;}
        if(elA)tickNum(elA,a,700);
        if(elB)setTimeout(()=>tickNum(elB,b,700),180);
      }
    });
  }
  if(reduce)run();
  else{
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(!e.isIntersecting)return;
        io.disconnect();
        run();
      });
    },{threshold:0.2,rootMargin:'0px'});
    io.observe(root);
  }
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
})();

// ── KPI +334.000 — rodillos verticales (tragaperras)
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
      const spinRows=54+j*10+Math.floor(Math.random()*8);
      const endRow=spinRows*10+d;
      const startRow=Math.max(0,endRow-(42+j*7+Math.floor(Math.random()*8)));
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
initMetricsCounter();
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
trackFormStep(1);
initSectionTracking();
captureUTM();

// M25/M26 - listeners que sustituyen a los onclick/onchange inline (CSP sin unsafe-inline)
document.querySelectorAll('.canal-o').forEach(function(el){ el.addEventListener('click', function(){ setCanal(this); }); });
(function(){ var g=document.getElementById('gdpr-cb'); if(g) g.addEventListener('change', checkGdpr); })();
(function(){ var b=document.getElementById('btn-back'); if(b) b.addEventListener('click', goBack); })();
(function(){ var w=document.getElementById('wa-success-link'); if(w) w.addEventListener('click', function(e){ e.preventDefault(); openWaDirect(savedLead); }); })();
(function(){ var c=document.querySelector('.wam-close'); if(c) c.addEventListener('click', closeWaModal); })();
(function(){ var f=document.querySelector('.wa-float a'); if(f) f.addEventListener('click', function(e){ e.preventDefault(); openWaModal(null); }); })();
