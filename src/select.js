/* ================= DROPDOWNS ================= */
// Every <select> keeps doing its job (value, change events, labels), but its list opens in the app's own design: a sheet
// that slides up on phones and a card under the field on larger screens, with groups, a tick on the current choice and
// search for long lists. Each select sits in a wrapper that takes the tap, so the phone's own picker never appears.
const SEL_SEARCH_AT=12;
// The label's own words, without any button inside it (Variety's "about this variety").
function selLabel(s){const l=s.id&&document.querySelector('label[for="'+s.id+'"]');let t='';if(l)for(const n of l.childNodes)if(n.nodeType===3||!n.matches('button,a,.num,.hint'))t+=n.textContent;
  return(l?t:s.getAttribute('aria-label')||'Choose').replace(/\s+/g,' ').trim()}
function enhanceSelect(s){if(s.dataset.ui||s.multiple||s.size>1||s.closest('#selsheet'))return;s.dataset.ui=1;
  const w=document.createElement('span');w.className='selw';s.parentNode.insertBefore(w,s);w.appendChild(s);
  s.tabIndex=0;
  w.addEventListener('click',e=>{if(s.disabled)return;e.preventDefault();openSelect(s)});
  s.addEventListener('keydown',e=>{if(['Enter',' ','ArrowDown','ArrowUp'].includes(e.key)||(e.altKey&&e.key==='ArrowDown')){e.preventDefault();openSelect(s)}});
  // Some browsers still open their list on mouse down; stop it here.
  s.addEventListener('mousedown',e=>{e.preventDefault();s.focus()})}
function openSelect(s){const d=$('selsheet'),opts=[...s.options],long=opts.length>=SEL_SEARCH_AT,cur=s.value;
  const row=o=>'<button type="button" role="option" class="selopt" data-v="'+esc(o.value)+'" aria-selected="'+(o.value===cur&&o.selected)+'"'+(o.disabled?' disabled':'')+'><span>'+esc(o.textContent)+'</span><i aria-hidden="true">✓</i></button>';
  let body='';for(const k of s.children){if(k.tagName==='OPTGROUP'){const kids=[...k.children].filter(o=>o.tagName==='OPTION');if(kids.length)body+='<div class="selgrp" role="group" aria-label="'+esc(k.label)+'"><h4><span>'+esc(k.label)+'</span><small>'+kids.length+'</small></h4>'+kids.map(row).join('')+'</div>'}else if(k.tagName==='OPTION')body+=row(k)}
  $('sel-in').innerHTML='<div class="selhead"><div class="grab"></div><h3 id="sel-title">'+esc(selLabel(s))+'</h3><button type="button" class="vd-close" id="sel-x" aria-label="Close">✕</button></div>'+
    (long?'<input type="search" id="sel-q" placeholder="Search" aria-label="Search the list" autocomplete="off">':'')+'<div class="sellist" role="listbox" aria-labelledby="sel-title">'+body+'</div><p class="hint selnone" hidden>Nothing matches.</p>';
  const narrow=matchMedia('(max-width:759px)').matches;d.classList.toggle('pop',!narrow);
  if(!narrow){const r=s.getBoundingClientRect(),W=Math.max(r.width,260),below=innerHeight-r.bottom,up=below<320&&r.top>below;
    Object.assign(d.style,{left:Math.min(Math.max(8,r.left),innerWidth-W-8)+'px',width:W+'px',top:up?'auto':(r.bottom+6)+'px',bottom:up?(innerHeight-r.top+6)+'px':'auto',maxHeight:Math.max(220,(up?r.top:below)-24)+'px'})}
  else Object.assign(d.style,{left:'',width:'',top:'',bottom:'',maxHeight:''});
  const pick=v=>{if(s.value!==v){s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))}d.close();setTimeout(()=>s.focus({preventScroll:true}),0)};
  d.querySelector('.sellist').onclick=e=>{const b=e.target.closest('.selopt');if(b&&!b.disabled)pick(b.dataset.v)};
  $('sel-x').onclick=()=>d.close();
  const q=$('sel-q');if(q)q.oninput=()=>{const t=fold(q.value.trim());let n=0;d.querySelectorAll('.selopt').forEach(b=>{const hit=!t||fold(b.textContent).includes(t);b.hidden=!hit;if(hit)n++});
    d.querySelectorAll('.selgrp').forEach(g=>g.hidden=![...g.querySelectorAll('.selopt')].some(b=>!b.hidden));d.querySelector('.selnone').hidden=n>0};
  // Arrow keys move through the choices; typing jumps to the search.
  d.onkeydown=e=>{const all=[...d.querySelectorAll('.selopt:not([hidden]):not([disabled])')],i=all.indexOf(document.activeElement);
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=all[Math.max(0,Math.min(all.length-1,i<0?0:i+(e.key==='ArrowDown'?1:-1)))];if(n)n.focus()}
    else if(e.key==='Enter'&&document.activeElement===q){const f=all[0];if(f){e.preventDefault();pick(f.dataset.v)}}
    else if(q&&e.key.length===1&&document.activeElement!==q&&!e.ctrlKey&&!e.metaKey){q.focus()}};
  showDlg(d);const on=d.querySelector('.selopt[aria-selected="true"]')||d.querySelector('.selopt');
  if(on)on.scrollIntoView({block:'center'});
  // Keyboard users land on the current choice; on a phone nothing gets a focus ring until you use it.
  if(on&&!narrow)on.focus({preventScroll:true});else{const c=$('sel-in');c.tabIndex=-1;c.focus({preventScroll:true})}}
// Selects already on the page, and any drawn later.
document.querySelectorAll('select').forEach(enhanceSelect);
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1){if(n.tagName==='SELECT')enhanceSelect(n);else n.querySelectorAll&&n.querySelectorAll('select').forEach(enhanceSelect)}}).observe(document.body,{childList:true,subtree:true});

/* ================= DATES ================= */
// Every date field keeps its <input type="date"> (its value, events, min and max), but shows the date in the app's own
// words and opens the app's own calendar, in the same sheet as the dropdowns, so the phone's picker never appears.
const CAL_RE=/^\d{4}-\d{2}-\d{2}$/;
const calIso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const calDate=v=>{const [y,m,d]=v.split('-').map(Number);return new Date(y,m-1,d,12)};
const calWords=v=>CAL_RE.test(v)?calDate(v).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';
// Weeks start on Sunday where that's the custom (US, Canada, Japan, Israel, Brazil...), on Monday elsewhere.
const CAL_SUN=/^(en-(US|CA|PH)|ja|he|pt-BR|ko|zh-TW|ar-SA)/i.test(navigator.language||'');
const CAL_ICO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14v13H5z M5 10h14 M9 3v4 M15 3v4"/></svg>';
function calLabel(inp){const l=inp.id&&document.querySelector('label[for="'+inp.id+'"]');return((l&&l.textContent)||inp.getAttribute('aria-label')||'Date').replace(/\s+/g,' ').trim()}
function enhanceDate(inp){if(inp.dataset.ui)return;inp.dataset.ui=1;
  const w=document.createElement('span');w.className='datew';w.tabIndex=0;w.setAttribute('role','button');
  inp.parentNode.insertBefore(w,inp);w.appendChild(inp);w.insertAdjacentHTML('beforeend','<span class="dw-t"></span>'+CAL_ICO);
  inp.tabIndex=-1;inp.setAttribute('aria-hidden','true');inp.inert=true;
  const paint=()=>{const t=calWords(inp.value);w.querySelector('.dw-t').textContent=t||'Choose a date';w.classList.toggle('empty',!t);
    w.setAttribute('aria-label',calLabel(inp)+': '+(t||'not set')+'. Choose a date')};
  // Code that sets the value (a scan filling in its roast date) updates the words too.
  const D=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  Object.defineProperty(inp,'value',{configurable:true,get(){return D.get.call(inp)},set(v){D.set.call(inp,v);paint()}});
  paint();
  const open=e=>{if(inp.disabled)return;e&&e.preventDefault();openDate(inp,w)};
  w.addEventListener('click',open);w.addEventListener('keydown',e=>{if(['Enter',' ','ArrowDown'].includes(e.key))open(e)});
  inp.addEventListener('focus',()=>w.focus());inp.addEventListener('mousedown',e=>e.preventDefault());
  const l=inp.id&&document.querySelector('label[for="'+inp.id+'"]');if(l)l.addEventListener('click',e=>{e.preventDefault();w.focus()})}
function openDate(inp,w){const d=$('selsheet'),min=CAL_RE.test(inp.min)?inp.min:'',max=CAL_RE.test(inp.max)?inp.max:'',today=calIso(new Date());
  let cur=CAL_RE.test(inp.value)?inp.value:'',view=calDate(cur||(max&&today>max?max:today)),mode='days';
  const ok=v=>(!min||v>=min)&&(!max||v<=max);
  const pick=v=>{if(inp.value!==v){inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}d.close();setTimeout(()=>w.focus({preventScroll:true}),0)};
  const yest=calIso(new Date(Date.now()-864e5));
  const draw=()=>{const y=view.getFullYear(),m=view.getMonth();let body;
    if(mode==='days'){const first=new Date(y,m,1),lead=(first.getDay()-(CAL_SUN?0:1)+7)%7,n=new Date(y,m+1,0).getDate();
      const wd=[...Array(7)].map((_,i)=>new Date(2024,0,(CAL_SUN?7:1)+i).toLocaleDateString(undefined,{weekday:'narrow'}));
      let cells='';for(let i=0;i<lead;i++)cells+='<span></span>';
      for(let k=1;k<=n;k++){const v=calIso(new Date(y,m,k));cells+='<button type="button" class="cd'+(v===today?' today':'')+'" data-d="'+v+'" aria-pressed="'+(v===cur)+'"'+(ok(v)?'':' disabled')+' aria-label="'+esc(new Date(y,m,k).toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))+'">'+k+'</button>'}
      body='<div class="calwk" aria-hidden="true">'+wd.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div><div class="calgrid">'+cells+'</div>'}
    else{body='<div class="calmonths">'+[...Array(12)].map((_,k)=>{const a=calIso(new Date(y,k,1)),z=calIso(new Date(y,k+1,0)),can=(!max||a<=max)&&(!min||z>=min);
      return '<button type="button" class="cm" data-m="'+k+'" aria-pressed="'+(k===m)+'"'+(can?'':' disabled')+'>'+esc(new Date(y,k,1).toLocaleDateString(undefined,{month:'short'}))+'</button>'}).join('')+'</div>'}
    const title=mode==='days'?view.toLocaleDateString(undefined,{month:'long',year:'numeric'}):String(y);
    const prevOk=mode==='days'?(!min||calIso(new Date(y,m,0))>=min):(!min||String(y-1)>=min.slice(0,4)),nextOk=mode==='days'?(!max||calIso(new Date(y,m+1,1))<=max):(!max||String(y+1)<=max.slice(0,4));
    $('sel-in').innerHTML='<div class="selhead"><div class="grab"></div><h3 id="sel-title">'+esc(calLabel(inp))+'</h3><button type="button" class="vd-close" id="sel-x" aria-label="Close">✕</button></div>'+
      '<div class="cal"><div class="calnav"><button type="button" class="cn-b" id="cal-p" aria-label="'+(mode==='days'?'Previous month':'Previous year')+'"'+(prevOk?'':' disabled')+'><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>'+
      '<button type="button" class="cal-t" id="cal-t" aria-label="'+esc(title)+(mode==='days'?', choose a month':', back to the days')+'">'+esc(title)+'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg></button>'+
      '<button type="button" class="cn-b" id="cal-n" aria-label="'+(mode==='days'?'Next month':'Next year')+'"'+(nextOk?'':' disabled')+'><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div>'+body+
      '<div class="calq">'+(ok(today)?'<button type="button" class="chip" data-d="'+today+'">Today</button>':'')+(ok(yest)?'<button type="button" class="chip" data-d="'+yest+'">Yesterday</button>':'')+
      (inp.required?'':'<button type="button" class="chip calclear" data-clear="1"'+(cur?'':' disabled')+'>Clear</button>')+'</div></div>';
    $('sel-x').onclick=()=>d.close();
    $('cal-p').onclick=()=>{view=mode==='days'?new Date(y,m-1,1):new Date(y-1,m,1);draw()};$('cal-n').onclick=()=>{view=mode==='days'?new Date(y,m+1,1):new Date(y+1,m,1);draw()};
    $('cal-t').onclick=()=>{mode=mode==='days'?'months':'days';draw()};
    d.querySelector('.cal').onclick=e=>{const b=e.target.closest('[data-d],[data-m],[data-clear]');if(!b||b.disabled)return;
      if(b.dataset.m){view=new Date(y,+b.dataset.m,1);mode='days';draw();return}if(b.dataset.clear){pick('');return}pick(b.dataset.d)}};
  draw();
  const narrow=matchMedia('(max-width:759px)').matches;d.classList.toggle('pop',!narrow);d.classList.add('dates');
  if(!narrow){const r=w.getBoundingClientRect(),W=320,below=innerHeight-r.bottom,up=below<420&&r.top>below;
    Object.assign(d.style,{left:Math.min(Math.max(8,r.left),innerWidth-W-8)+'px',width:W+'px',top:up?'auto':(r.bottom+6)+'px',bottom:up?(innerHeight-r.top+6)+'px':'auto',maxHeight:Math.max(300,(up?r.top:below)-24)+'px'})}
  else Object.assign(d.style,{left:'',width:'',top:'',bottom:'',maxHeight:''});
  d.onkeydown=e=>{const a=document.activeElement;if(!a||!a.classList||!a.classList.contains('cd'))return;const st={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];if(!st)return;e.preventDefault();
    const t=calDate(a.dataset.d);t.setDate(t.getDate()+st);const v=calIso(t);if(!ok(v))return;if(t.getMonth()!==view.getMonth()){view=new Date(t.getFullYear(),t.getMonth(),1);draw()}const nb=d.querySelector('.cd[data-d="'+v+'"]');if(nb)nb.focus()};
  d.addEventListener('close',()=>d.classList.remove('dates'),{once:true});
  showDlg(d);const on=d.querySelector('.cd[aria-pressed="true"]')||d.querySelector('.cd.today')||d.querySelector('.cd:not([disabled])');
  if(on&&!narrow)on.focus({preventScroll:true});else{const c=$('sel-in');c.tabIndex=-1;c.focus({preventScroll:true})}}
document.querySelectorAll('input[type=date]').forEach(enhanceDate);
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1){if(n.matches&&n.matches('input[type=date]'))enhanceDate(n);else n.querySelectorAll&&n.querySelectorAll('input[type=date]').forEach(enhanceDate)}}).observe(document.body,{childList:true,subtree:true});

/* ================= SLIDERS ================= */
// Every slider gets a filled track and a bigger thumb, and, where its value is shown in the label, a − and + at the
// ends of the track for one exact step (hold to keep going). The fill follows the value whether you drag it or the
// app sets it, and Android gives a light tick on each step.
const RNG_VAL=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
function rngFill(i){const mn=+i.min||0,mx=i.max===''?100:+i.max,f=(+RNG_VAL.get.call(i)-mn)/((mx-mn)||1);i.style.setProperty('--p',Math.max(0,Math.min(1,f)).toFixed(4))}
let RNG_BUZZ=0;
// A step from − or + gives the thumb and the value a small pop, so the change is felt as well as seen.
function rngPop(i){const lab=i.id&&document.querySelector('label[for="'+i.id+'"]'),n=lab&&lab.querySelector('.num');
  for(const e of [i,n])if(e){replay(e,'pop');clearTimeout(e._pop);e._pop=setTimeout(()=>e.classList.remove('pop'),300)}}
function rngBuzz(){const t=Date.now();if(t-RNG_BUZZ<40)return;RNG_BUZZ=t;try{navigator.vibrate&&navigator.vibrate(4)}catch(e){}}
function rngStep(i,dir){if(i.disabled)return;const before=i.value;try{dir>0?i.stepUp():i.stepDown()}catch(e){return}
  if(i.value===before)return;rngFill(i);rngBuzz();rngPop(i);i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}
function rngButton(i,dir){const b=document.createElement('button');b.type='button';b.className='rng-b';b.setAttribute('aria-label',(dir>0?'Increase ':'Decrease ')+((i.labels&&i.labels[0]&&i.labels[0].firstChild&&i.labels[0].firstChild.textContent.trim())||'value'));
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(dir>0?'M12 6v12M6 12h12':'M6 12h12')+'"/></svg>';
  let t1=0,t2=0;const stop=()=>{clearTimeout(t1);clearInterval(t2)};
  b.addEventListener('pointerdown',e=>{if(e.button)return;e.preventDefault();rngStep(i,dir);t1=setTimeout(()=>{t2=setInterval(()=>rngStep(i,dir),85)},380)});
  ['pointerup','pointerleave','pointercancel'].forEach(k=>b.addEventListener(k,stop));
  b.addEventListener('click',e=>{if(e.detail===0)rngStep(i,dir)});// keyboard
  b.addEventListener('contextmenu',e=>e.preventDefault());return b}
function rngEnhance(i){if(i.dataset.rng)return;i.dataset.rng='1';
  Object.defineProperty(i,'value',{configurable:true,get(){return RNG_VAL.get.call(this)},set(v){RNG_VAL.set.call(this,v);rngFill(this)}});
  i.addEventListener('input',()=>{rngFill(i);rngBuzz()});rngFill(i);
  // The − and + sit at the two ends of the track, so the label row keeps just the name and the value.
  const lab=i.id&&document.querySelector('label[for="'+i.id+'"]');
  if(lab&&lab.querySelector('.num')&&!i.parentElement.classList.contains('rng-row')){const w=document.createElement('div');w.className='rng-row';i.before(w);w.append(rngButton(i,-1),i,rngButton(i,1));const f=w.closest('.field');if(f){f.classList.add('rng-f');const t=f.parentElement;if(t&&t.classList.contains('two'))t.classList.add('rng-two')}}}

/* ================= SELECTION CONTROLS ================= */
// Segmented controls (roast, agitation, light or dark…) get one highlight that glides to the option you pick, styled
// like that control's own highlight, instead of jumping. It picks up where it was even when the options are redrawn.
// Highlights are placed in batches: every strip is read first, then every highlight is written, so a page with many
// strips (Settings redraws them all) is laid out about once instead of once per strip.
function segBatch(list){const items=[];
  for(const el of new Set(list)){if(!el||!el.isConnected)continue;const on=el.querySelector(':scope>button[aria-pressed="true"]');items.push({el,on,ind:el.querySelector(':scope>.seg-ind')})}
  if(!items.length)return;
  // Reads, part 1: which strips are shown, and which need a positioned parent for their highlight.
  for(const it of items){it.ok=!!(it.on&&it.on.offsetWidth);if(it.ok&&!it.el.classList.contains('ind-rel'))it.stat=getComputedStyle(it.el).position==='static'}
  for(const it of items)if(it.stat)it.el.classList.add('ind-rel');
  // Reads, part 2: the picked option's own look (data-peek lets it show for a moment) and where it sits.
  const live=items.filter(it=>it.ok);live.forEach(it=>it.on.setAttribute('data-peek',''));
  for(const it of live){const cs=getComputedStyle(it.on),on=it.on;it.look={background:cs.backgroundColor,backgroundImage:cs.backgroundImage,boxShadow:cs.boxShadow,borderRadius:cs.borderRadius};
    it.pos={left:'0px',top:'0px',transform:'translate3d('+on.offsetLeft+'px,'+on.offsetTop+'px,0)',width:on.offsetWidth+'px',height:on.offsetHeight+'px'}}
  live.forEach(it=>it.on.removeAttribute('data-peek'));
  // Writes. A strip that was redrawn (Settings redraws on every pick) starts from where its highlight last was, so it
  // still glides: all the new highlights are put there first, with one layout for the lot.
  let fresh=false;
  for(const it of items){if(!it.ok){if(it.ind)it.ind.style.opacity='0';continue}
    if(!it.ind){const ind=it.ind=document.createElement('span');ind.className='seg-ind';ind.setAttribute('aria-hidden','true');it.el.append(ind);
      const ip=it.el._ip||(it.el.id&&SEG_IP.get(it.el.id));if(ip){ind.style.transition='none';Object.assign(ind.style,ip);fresh=true;it.reset=true}}}
  if(fresh)document.body.offsetWidth;
  const rm=RM();
  for(const it of live){const el=it.el,ind=it.ind;if(it.reset)ind.style.transition='';el.classList.add('has-ind');
    // Moved with a transform (the compositor animates it without laying the page out again); only the size changes width.
    if(rm)ind.style.transition='none';Object.assign(ind.style,it.look,it.pos,{opacity:'1'});el._ip=it.pos;if(el.id)SEG_IP.set(el.id,it.pos)}
  for(const it of items)if(SEG_RO&&!it.el._ro){it.el._ro=1;SEG_RO.observe(it.el)}}
function segUpdate(el){segBatch([el])}
// One watcher for every control's size (a tab coming into view, the phone turning); controls that have left the page are dropped.
const SEG_RO=window.ResizeObserver?new ResizeObserver(es=>es.forEach(e=>{if(e.target.isConnected)segQueue(e.target);else SEG_RO.unobserve(e.target)})):null;
const SEG_Q=new Set(),SEG_IP=new Map();let SEG_RAF=0;
function segQueue(el){SEG_Q.add(el);if(!SEG_RAF)SEG_RAF=requestAnimationFrame(()=>{SEG_RAF=0;const l=[...SEG_Q];SEG_Q.clear();segBatch(l)})}
// Every one-line strip glides, the Gear tabs included; wrapping filter chips can't, so they get the plain pick instead.
const SEG_SEL='.seg:not(.filters),.seg.gtabs';
// Strips redrawn in one go are collected here and placed together when the scan is done.
let SEG_NOW=null;
function uiScan(root){if(!root.querySelectorAll)return;const own=!SEG_NOW;if(own)SEG_NOW=[];
  if(root.matches&&root.matches('input[type=range]'))rngEnhance(root);root.querySelectorAll('input[type=range]:not([data-rng])').forEach(rngEnhance);
  // A redrawn strip is placed at once (before the page paints), so it never shows a frame without its highlight.
  const go=x=>x.id&&SEG_IP.has(x.id)?SEG_NOW.push(x):segQueue(x);if(root.matches&&root.matches(SEG_SEL))go(root);root.querySelectorAll(SEG_SEL).forEach(go);
  if(own){const l=SEG_NOW;SEG_NOW=null;segBatch(l)}}
// Chip choices that wrap onto several lines (target cup, filters, the recipe maker's picks) can't glide, so the newly
// picked chip pops in instead: on a pressed change, or when the row is redrawn with a different one picked.
function chipCheck(box){if(!box||box.matches(SEG_SEL))return;const on=box.querySelector(':scope>button[aria-pressed="true"]');const key=on?(on.dataset.v||on.dataset.mk||on.textContent):'';
  if(box._onk!==undefined&&key&&key!==box._onk&&!RM()){replay(on,'chip-on');setTimeout(()=>on.classList.remove('chip-on'),400)}box._onk=key}
// Only what changed is looked at: new nodes, and the control whose options were swapped or picked. A timer ticking in
// a big page doesn't make every control on it measure itself again.
new MutationObserver(ms=>{SEG_NOW=[];try{for(const m of ms){const t=m.type==='attributes'?m.target.parentElement:m.target,s=t&&t.closest&&t.closest(SEG_SEL);if(s)segQueue(s);
  if(t&&t.querySelector&&t.querySelector(':scope>button[aria-pressed]'))chipCheck(t);
  if(m.type==='childList')m.addedNodes.forEach(n=>n.nodeType===1&&uiScan(n));else if(m.removedNodes)for(const n of m.removedNodes)if(n._ro&&SEG_RO)SEG_RO.unobserve(n)}}finally{const l=SEG_NOW;SEG_NOW=null;segBatch(l)}})
  .observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed']});
uiScan(document.body);
// A change of look (light/dark, following the phone, a vibe or an accent): every highlight takes its colours again
// (they're copied from the picked option, so they'd otherwise stay in the old look), and so does the cup-fit badge.
{const reTheme=()=>{document.querySelectorAll('.seg').forEach(s=>segQueue(s));try{if($('settings-in'))settingsSync()}catch(e){}try{if($('g-fit'))renderFit()}catch(e){}};
  new MutationObserver(reTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-vibe','data-accent']});
  try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',reTheme)}catch(e){}}
