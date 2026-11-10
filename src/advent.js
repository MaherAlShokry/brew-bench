/* ---------- Advent calendars: a box of numbered coffees, one door a day ---------- */
// A calendar is the box: its name, roaster, year, how many doors and how much coffee is behind each, and your review of
// the whole box. Each door you open is an ordinary coffee in your gallery (with cal:{id,d}), so it has its own photo,
// rating, notes and diary, counts in the passport and can go in your top 5. The doors are read back from the gallery.
const okCal=c=>{if(!c||typeof c!=='object'||typeof c.id!=='string'||!BID.test(c.id))return null;
  const y=Math.round(+c.year)||new Date().getFullYear();
  return{id:c.id,name:str(c.name,60),roaster:str(c.roaster,50),year:clamp(y,2000,2100),n:Math.round(clamp(+c.n||24,1,31)),g:Math.round(clamp(+c.g||50,1,500)),
    rating:Math.round(clamp(+c.rating||0,0,5)*2)/2,notes:str(c.notes,600),ts:+c.ts||Date.now()}};
let CALS=load('bb-advent',[]);CALS=Array.isArray(CALS)?CALS.map(okCal).filter(Boolean):[];
const saveCals=()=>{BREV++;save('bb-advent',CALS)};
const calById=id=>CALS.find(c=>c.id===id);
const calName=c=>c.name||(c.roaster?c.roaster+' advent calendar':'Advent calendar');
// Door number → its coffee. Two coffees on one door: the newer wins.
function calDoors(c){const m=new Map();for(const b of BEANS)if(b.cal&&b.cal.id===c.id&&b.cal.d<=c.n){const o=m.get(b.cal.d);if(!o||b.ts>o.ts)m.set(b.cal.d,b)}return m}
// The door for today: in December of the calendar's year, today's date; otherwise the first one still closed.
function calToday(c,doors){if(calLive(c))return new Date().getDate();
  for(let i=1;i<=c.n;i++)if(!doors.has(i))return i;return 0}
// December of the calendar's year: the doors follow the date.
const calLive=c=>{const t=new Date();return t.getFullYear()===c.year&&t.getMonth()===11&&t.getDate()<=c.n};
// The day a door belongs to: 1 December onwards, or today if that day hasn't come yet.
const calDay=(c,d)=>{const iso=c.year+'-12-'+String(d).padStart(2,'0');return iso<=todayISO()?iso:todayISO()};
function calStats(c){const doors=calDoors(c),bs=[...doors.values()],rated=bs.filter(b=>b.rating);
  return{doors,open:bs.length,avg:rated.length?rated.reduce((s,b)=>s+b.rating,0)/rated.length:0,origins:new Set(bs.map(b=>b.origin).filter(Boolean)).size,
    best:rated.slice().sort((a,b)=>b.rating-a.rating||a.cal.d-b.cal.d).slice(0,3)}}
let ADVFROM=null,ADVRET=null;$('vd').addEventListener('close',()=>{ADVFROM=null;ADVRET=null});

// On the Coffees page: your calendars, each a little box of doors. With none yet, an invitation in the season.
function advHTML(){const m=new Date().getMonth();
  if(!CALS.length)return m>=9||m===0?'<button type="button" class="adv-invite" data-advnew><span class="adv-ii" aria-hidden="true">'+advBoxSVG+'</span><span><b>Got an advent calendar?</b><small>Add the box and review each numbered coffee as you open it.</small></span><span class="adv-plus" aria-hidden="true">+</span></button>':'';
  const list=CALS.slice().sort((a,b)=>b.year-a.year||b.ts-a.ts);
  return '<div class="rhead adv-h"><h3 class="rh">Advent calendars</h3><button type="button" class="sh-mini ic" data-advnew aria-label="Add an advent calendar" title="Add">'+lIc('plus')+'</button></div>'+
    '<div class="adv-list">'+list.map(c=>{const s=calStats(c),t=calToday(c,s.doors);
      return '<button type="button" class="adv-card" data-adv="'+c.id+'"><span class="adv-mini" style="--n:'+Math.min(c.n,24)+'">'+Array.from({length:c.n},(_,i)=>'<i class="'+(s.doors.has(i+1)?'on':i+1===t?'now':'')+'"></i>').join('')+'</span>'+
        '<span class="adv-ct"><b>'+esc(calName(c))+'</b><small>'+esc([c.roaster&&c.name?c.roaster:'',String(c.year)].filter(Boolean).join(' · '))+'</small>'+
        '<span class="adv-cm"><span>'+s.open+'/'+c.n+' opened</span>'+(c.rating||s.avg?'<span class="adv-r">'+beanSVG+String(c.rating||Math.round(s.avg*10)/10).replace('.5','½')+'</span>':'')+'</span></span></button>'}).join('')+'</div>'}
const advBoxSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M3.5 14.8h17M9.2 4v16M14.8 4v16"/></svg>';

// A calendar's page: the box at a glance, your review of it, every door, and the best of what was inside.
function openCal(id){const c=calById(id);if(!c)return;ADVFROM=id;const d=$('vd'),s=calStats(c),t=calToday(c,s.doors);
  const stat=(v,l)=>'<div><b>'+l+'</b><span class="bd-v">'+v+'</span></div>';
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button>'+
    '<span class="vd-tools"><button type="button" class="vd-tool" id="adv-share" aria-label="Share this calendar" title="Share">'+lIc('share')+'</button><button type="button" class="vd-tool" id="adv-edit" aria-label="Edit this calendar" title="Edit">'+lIc('edit')+'</button></span>'+
    '<span class="pill"><i style="background:var(--cherry)"></i>Advent calendar · '+c.year+'</span><h2 id="vd-title">'+esc(calName(c))+'</h2><p class="vd-sub">'+esc([c.name?c.roaster:'',c.n+' doors · '+c.g+' g each'].filter(Boolean).join(' · '))+'</p></div>'+
    '<div class="vd-body">'+
    '<div class="adv-prog"><div class="adv-ph"><b>'+s.open+' of '+c.n+' opened</b><span>'+(s.open===c.n?'All done':t?'Next: door '+t:'')+'</span></div><span class="bagm"><i style="width:'+(s.open/c.n*100).toFixed(0)+'%"></i></span></div>'+
    '<div class="specs">'+stat(s.avg?s.avg.toFixed(1).replace('.0','')+' of 5':'–','Average of the doors')+stat(s.origins||'–',s.origins===1?'Origin':'Origins')+'</div>'+
    '<h3>The doors</h3><div class="adv-grid">'+Array.from({length:c.n},(_,i)=>{const n=i+1,b=s.doors.get(n);
      return b?'<button type="button" class="adv-door on" data-door="'+n+'" aria-label="Door '+n+': '+esc(beanTitle(b))+'">'+beanPic(b,'adv')+'<span class="adv-n">'+n+'</span>'+(b.rating?'<span class="adv-dr">'+String(b.rating).replace('.5','½')+'</span>':'')+'</button>'
        :'<button type="button" class="adv-door'+(n===t?' now':'')+'" data-door="'+n+'" aria-label="Door '+n+': add its coffee"><span class="adv-n">'+n+'</span>'+(n===t?'<small>'+(calLive(c)?'Today':'Next')+'</small>':'')+'</button>'}).join('')+'</div>'+
    '<p class="hint adv-tip">Tap a door to add the coffee behind it, then rate it and note what you taste. Opened doors open that coffee.</p>'+
    (s.best.length>1?'<h3>Best of the box</h3><div class="clist">'+s.best.map((b,i)=>coffeeRow(b,false,i)).join('')+'</div>':'')+
    '<h3>Your review of the box</h3><div class="adv-rev"><div class="beanrate" id="adv-rate"></div><textarea id="adv-notes" rows="3" maxlength="600" placeholder="The box as a whole: the range of coffees, the surprises, would you get it again?">'+esc(c.notes)+'</textarea></div>'+
    '<button type="button" class="linkbtn danger" id="adv-del">Remove the calendar</button></div>';
  hydrateImgs($('vd-in'));
  beanRateInput('adv-rate',()=>c.rating,v=>{c.rating=v;saveCals();renderBeans()});
  let nt=0;$('adv-notes').oninput=e=>{clearTimeout(nt);nt=setTimeout(()=>{c.notes=str(e.target.value,600);saveCals()},400)};
  $('adv-notes').onchange=e=>{clearTimeout(nt);c.notes=str(e.target.value,600);saveCals()};
  $('adv-edit').onclick=()=>openCalEditor(c);
  $('adv-share').onclick=()=>{d.close();openShare(calDoc(c))};
  $('adv-del').onclick=()=>askSheet({title:'Remove this calendar?',text:'Its coffees stay in your gallery.',ok:'Remove',danger:true}).then(ok=>{if(!ok)return;
    for(const b of BEANS)if(b.cal&&b.cal.id===c.id)delete b.cal;saveBeans();CALS=CALS.filter(x=>x.id!==c.id);saveCals();d.close();renderBeans();toast('Calendar removed')});
  $('vd-in').onclick=e=>{const r=e.target.closest('[data-door]');
    if(r){const n=+r.dataset.door,b=s.doors.get(n);if(b){ADVFROM=c.id;openBean(b.id)}else{ADVRET=c.id;openBeanEditor(null,{roaster:c.roaster,bag:c.g,shelf:false,tried:calDay(c,n),cal:{id:c.id,d:n}})}return}
    const bb=e.target.closest('[data-bean]');if(bb){ADVFROM=c.id;openBean(bb.dataset.bean)}};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}

// Adding or editing the box itself.
function openCalEditor(c){const d=$('vd'),isNew=!c,C=c||{name:'',roaster:'',year:new Date().getMonth()<6?new Date().getFullYear()-1:new Date().getFullYear(),n:24,g:50};
  const roasters=[...new Set(BEANS.map(x=>x.roaster).filter(Boolean))].sort();
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Advent calendar</span><h2 id="vd-title">'+(isNew?'Add an advent calendar':'Edit '+esc(calName(C)))+'</h2></div>'+
    '<div class="vd-body beform">'+
    '<div class="field"><label for="ac-name">Calendar name</label><input id="ac-name" maxlength="60" value="'+esc(C.name)+'" placeholder="Coffee Advent 2026" autocomplete="off"></div>'+
    '<div class="field"><label for="ac-roaster">Roastery</label><div class="acw"><input id="ac-roaster" maxlength="50" value="'+esc(C.roaster)+'" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="ac-rsug"><div class="acl" id="ac-rsug" role="listbox" aria-label="Roasteries you’ve had" hidden></div></div></div>'+
    '<div class="adv-3"><div class="field"><label for="ac-year">Year</label><input id="ac-year" type="number" inputmode="numeric" min="2000" max="2100" value="'+C.year+'"></div>'+
    '<div class="field"><label for="ac-n">Doors</label><input id="ac-n" type="number" inputmode="numeric" min="1" max="31" value="'+C.n+'"></div>'+
    '<div class="field"><label for="ac-g">Each <span class="hint">grams</span></label><input id="ac-g" type="number" inputmode="numeric" min="1" max="500" value="'+C.g+'"></div></div>'+
    '<p class="hint">Each door you open becomes a coffee in your gallery, with its own rating, notes and diary.</p>'+
    '<div class="actions"><button class="btn" id="ac-save">'+(isNew?'Add the calendar':'Save changes')+'</button><button class="btn ghost" id="ac-cancel">Cancel</button></div></div>';
  autoList($('ac-roaster'),$('ac-rsug'),roasters);
  $('ac-cancel').onclick=()=>{if(c)openCal(c.id);else d.close()};
  $('ac-save').onclick=()=>{const n=okCal({...(c||{}),id:c?c.id:uid().replace(/[^a-z0-9]/g,'').slice(0,20),name:$('ac-name').value,roaster:$('ac-roaster').value,year:$('ac-year').value,n:$('ac-n').value,g:$('ac-g').value,ts:c?c.ts:Date.now()});
    if(!n.name&&!n.roaster){toast('Add a name or the roastery first');$('ac-name').focus();return}
    const i=CALS.findIndex(x=>x.id===n.id);if(i>=0)CALS[i]=n;else CALS.unshift(n);saveCals();
    // The roaster of a new box fills in for doors still without one.
    if(c&&c.roaster!==n.roaster){for(const b of BEANS)if(b.cal&&b.cal.id===n.id&&(!b.roaster||b.roaster===c.roaster))b.roaster=n.roaster;saveBeans()}
    renderBeans();openCal(n.id);toast(isNew?'Calendar added: tap a door to add its coffee':'Saved')};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}

// Shared as text and a PDF: the box, your review, and every door you've opened, in order.
function calDoc(c){const s=calStats(c),doors=[...s.doors.entries()].sort((a,b)=>a[0]-b[0]);
  return{title:calName(c),sub:s.open+' of '+c.n+' doors opened'+(c.rating?' · rated '+c.rating+' of 5':''),file:'advent-'+c.year,
    blocks:[{kv:[['Roastery',c.roaster||'-'],['Year',String(c.year)],['Doors',c.n+' × '+c.g+' g'],['Average',s.avg?s.avg.toFixed(1)+' of 5':'-']]},...(c.notes?[{h:'My review',p:c.notes}]:[]),
      {h:'The doors',list:doors.map(([n,b])=>'Day '+n+': '+beanTitle(b)+([b.roaster!==c.roaster?b.roaster:'',b.origin?originName(b.origin):''].filter(Boolean).length?' ('+[b.roaster!==c.roaster?b.roaster:'',b.origin?originName(b.origin):''].filter(Boolean).join(', ')+')':'')+(b.rating?' · '+b.rating+' of 5':''))}]}}
