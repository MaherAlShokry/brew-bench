/* ---------- Advent calendars: a box of numbered coffees, one door a day ---------- */
// A calendar is the box: its name, roaster, year, how many doors and how much coffee is behind each, and your review of
// the whole box. Each door you open is an ordinary coffee in your gallery (with cal:{id,d}), so it has its own photo,
// rating, notes and diary, counts in the passport and can go in your top 5. The doors are read back from the gallery.
const okCal=c=>{if(!c||typeof c!=='object'||typeof c.id!=='string'||!BID.test(c.id))return null;
  const y=Math.round(+c.year)||new Date().getFullYear();
  return{id:c.id,name:str(c.name,60),roaster:str(c.roaster,50),year:clamp(y,2000,2100),n:Math.round(clamp(+c.n||24,1,31)),g:Math.round(clamp(+c.g||50,1,500)),
    img:!!c.img,notes:str(c.notes,600),ts:+c.ts||Date.now()}};
let CALS=load('bb-advent',[]);CALS=Array.isArray(CALS)?CALS.map(okCal).filter(Boolean):[];
const saveCals=()=>{BREV++;save('bb-advent',CALS)};
const calById=id=>CALS.find(c=>c.id===id);
const calName=c=>c.name||(c.roaster?c.roaster+' advent calendar':'Advent calendar');
// Door number → its coffee. Two coffees on one door: the newer wins.
function calDoors(c){const m=new Map();for(const b of BEANS)if(b.cal&&b.cal.id===c.id&&b.cal.d<=c.n){const o=m.get(b.cal.d);if(!o||b.ts>o.ts)m.set(b.cal.d,b)}return m}
// Today's door, in December of the calendar's year. Doors open in any order, so there's no "next" otherwise.
const calToday=c=>calLive(c)?new Date().getDate():0;
// December of the calendar's year: the doors follow the date.
const calLive=c=>{const t=new Date();return t.getFullYear()===c.year&&t.getMonth()===11&&t.getDate()<=c.n};
// The day a door belongs to: 1 December onwards, or today if that day hasn't come yet.
const calDay=(c,d)=>{const iso=c.year+'-12-'+String(d).padStart(2,'0');return iso<=todayISO()?iso:todayISO()};
function calStats(c){const doors=calDoors(c),bs=[...doors.values()],rated=bs.filter(b=>b.rating);
  return{doors,open:bs.length,rated:rated.length,avg:rated.length?rated.reduce((s,b)=>s+b.rating,0)/rated.length:0,origins:new Set(bs.map(b=>b.origin).filter(Boolean)).size,
    best:rated.slice().sort((a,b)=>b.rating-a.rating||a.cal.d-b.cal.d).slice(0,3)}}
// The calendar's total rating: the average of the coffees you've rated from it.
function calScore(c,st){const s=st||calStats(c);return{v:s.avg?Math.round(s.avg*10)/10:0,n:s.rated}}
// Your calendars side by side, best first: how each box (and roastery) did against the others.
function calRanked(){return CALS.map(c=>({c,sc:calScore(c)})).filter(x=>x.sc.v).sort((a,b)=>b.sc.v-a.sc.v||b.c.year-a.c.year)}
let ADVFROM=null,ADVRET=null;$('vd').addEventListener('close',()=>{ADVFROM=null;ADVRET=null;VD_BACK=null});
// A door's coffee again (after editing it), with back still leading to its calendar.
function calBackTo(b){ADVFROM=b.cal.id;openBean(b.id);VD_BACK=()=>openCal(b.cal.id,{back:b.cal.d})}
// Into a door and back out: the door swings open (and shut again on the way back), and the page slides across.
// Back (the gesture or the button) from a door's coffee or its editor returns to the calendar, not out of it.
function calSlide(dir){const v=$('vd-in');if(RM())return;v.classList.remove('adv-fwd','adv-bwd');void v.offsetWidth;v.classList.add(dir>0?'adv-fwd':'adv-bwd')}
function calEnter(c,n,go){const r=document.querySelector('.adv-door[data-door="'+n+'"]'),run=()=>{go();VD_BACK=()=>openCal(c.id,{back:n});calSlide(1)};
  if(RM()||!r){run();return}r.insertAdjacentHTML('beforeend','<i class="adv-flap" aria-hidden="true"><b>'+n+'</b></i>');r.classList.add('opening');setTimeout(run,330)}

// On the Coffees page: your calendars, each a little box of doors. With none yet, an invitation in the season.
function advHTML(){const m=new Date().getMonth();
  if(!CALS.length)return m>=9||m===0?'<button type="button" class="adv-invite" data-advnew><span class="adv-ii" aria-hidden="true">'+advBoxSVG+'</span><span><b>Got an advent calendar?</b><small>Add the box and review each numbered coffee as you open it.</small></span><span class="adv-plus" aria-hidden="true">+</span></button>':'';
  const list=CALS.slice().sort((a,b)=>b.year-a.year||b.ts-a.ts),rk=calRanked();
  return '<div class="rhead adv-h"><h3 class="rh">Advent calendars</h3><button type="button" class="sh-mini ic" data-advnew aria-label="Add an advent calendar" title="Add">'+lIc('plus')+'</button></div>'+
    '<div class="adv-list">'+list.map(c=>{const s=calStats(c),t=calToday(c),sc=calScore(c,s);
      return '<button type="button" class="adv-card" data-adv="'+c.id+'">'+(c.img?'<span class="bpic adv-thumb" data-bimg="'+c.id+'"><span class="bph">'+advBoxSVG+'</span></span>':
        '<span class="adv-mini">'+Array.from({length:c.n},(_,i)=>'<i class="'+(s.doors.has(i+1)?'on':i+1===t?'now':'')+'"></i>').join('')+'</span>')+
        '<span class="adv-ct"><b>'+esc(calName(c))+'</b><small>'+esc([c.roaster&&c.name?c.roaster:'',String(c.year)].filter(Boolean).join(' · '))+'</small>'+
        '<span class="adv-cm"><span>'+s.open+'/'+c.n+' opened</span>'+(sc.v?'<span class="adv-r">'+beanSVG+sc.v.toFixed(1)+'</span>':'')+'</span></span></button>'}).join('')+'</div>'+
    // Two or more rated: ranked, so boxes from different roasteries (and years) can be compared at a glance.
    (rk.length>1?'<div class="adv-rank"><b class="adv-rkh">Your calendars ranked</b>'+rk.map((x,i)=>'<button type="button" class="adv-rr" data-adv="'+x.c.id+'"><span class="adv-rn">'+(i+1)+'</span><span class="adv-rt"><b>'+esc(x.c.roaster||calName(x.c))+'</b><small>'+esc([x.c.roaster&&x.c.name?x.c.name:'',String(x.c.year)].filter(Boolean).join(' · '))+'</small></span><span class="adv-r">'+beanSVG+x.sc.v.toFixed(1)+'</span></button>').join('')+'</div>':'')}
const advBoxSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M3.5 14.8h17M9.2 4v16M14.8 4v16"/></svg>';

// A calendar's page: the box at a glance, your review of it, every door, and the best of what was inside.
function openCal(id,o){const c=calById(id);if(!c)return;ADVFROM=id;VD_BACK=null;const d=$('vd'),s=calStats(c),t=calToday(c),sc=calScore(c,s),rk=calRanked(),pos=rk.findIndex(x=>x.c.id===c.id),back=o&&o.back;
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button>'+
    '<span class="vd-tools"><button type="button" class="vd-tool" id="adv-share" aria-label="Share this calendar" title="Share">'+lIc('share')+'</button><button type="button" class="vd-tool" id="adv-edit" aria-label="Edit this calendar" title="Edit">'+lIc('edit')+'</button></span>'+
    '<span class="pill"><i style="background:var(--cherry)"></i>Advent '+c.year+'</span><h2 id="vd-title">'+esc(calName(c))+'</h2><p class="vd-sub">'+esc([c.name?c.roaster:'',c.n+' doors · '+c.g+' g each'].filter(Boolean).join(' · '))+'</p></div>'+
    '<div class="vd-body">'+(c.img?'<div class="bd-hero"><span class="bpic hero adv-hero" data-bimg="'+c.id+'"><span class="bph">'+advBoxSVG+'</span></span></div>':'')+
    // The total rating: the average of the coffees you've rated from the box, and where it ranks among your calendars.
    '<div class="adv-score"><div class="adv-sh"><span class="adv-big">'+(sc.v?sc.v.toFixed(1):'–')+'<small>/5</small></span><span class="adv-sl"><b>Total rating</b><small>'+advSub(c,s,sc,rk,pos)+'</small></span></div></div>'+
    '<div class="adv-prog"><div class="adv-ph"><b>'+s.open+' of '+c.n+' opened</b><span>'+(s.open===c.n?'All done':s.origins?s.origins+' origin'+(s.origins===1?'':'s'):'')+'</span></div><span class="bagm"><i style="width:'+(s.open/c.n*100).toFixed(0)+'%"></i></span></div>'+
    '<h3>The doors</h3><div class="adv-grid">'+Array.from({length:c.n},(_,i)=>{const n=i+1,b=s.doors.get(n);
      return b?'<button type="button" class="adv-door on" data-door="'+n+'" aria-label="Door '+n+': '+esc(beanTitle(b))+'">'+beanPic(b,'adv')+'<span class="adv-n">'+n+'</span>'+(b.rating?'<span class="adv-dr">'+String(b.rating).replace('.5','½')+'</span>':'')+'</button>'
        :'<button type="button" class="adv-door'+(n===t?' now':'')+'" data-door="'+n+'" aria-label="Door '+n+': add its coffee"><span class="adv-n">'+n+'</span>'+(n===t?'<small>Today</small>':'')+'</button>'}).join('')+'</div>'+
    '<p class="hint adv-tip">Open the doors in any order: add the coffee behind each, then rate it. The total rating is the average of the ones you’ve rated.</p>'+
    (s.best.length>1?'<h3>Best of the box</h3><div class="clist">'+s.best.map((b,i)=>coffeeRow(b,false,i)).join('')+'</div>':'')+
    '<h3>Your review of the box</h3><div class="adv-rev"><textarea id="adv-notes" rows="3" maxlength="600" placeholder="The box as a whole: the range of coffees, the surprises, would you get it again?">'+esc(c.notes)+'</textarea></div>'+
    '<button type="button" class="linkbtn danger" id="adv-del">Remove the calendar</button></div>';
  hydrateImgs($('vd-in'));
  let nt=0;$('adv-notes').oninput=e=>{clearTimeout(nt);nt=setTimeout(()=>{c.notes=str(e.target.value,600);saveCals()},400)};
  $('adv-notes').onchange=e=>{clearTimeout(nt);c.notes=str(e.target.value,600);saveCals()};
  $('adv-edit').onclick=()=>openCalEditor(c);
  $('adv-share').onclick=()=>{d.close();openShare(calDoc(c))};
  $('adv-del').onclick=()=>askSheet({title:'Remove this calendar?',text:'Its coffees stay in your gallery.',ok:'Remove',danger:true}).then(ok=>{if(!ok)return;
    for(const b of BEANS)if(b.cal&&b.cal.id===c.id)delete b.cal;saveBeans();if(c.img)BIMG.del(c.id);CALS=CALS.filter(x=>x.id!==c.id);saveCals();d.close();renderBeans();toast('Calendar removed')});
  $('vd-in').onclick=e=>{const r=e.target.closest('[data-door]');
    if(r){if(r.classList.contains('opening'))return;const n=+r.dataset.door,b=s.doors.get(n);
      calEnter(c,n,b?()=>{ADVFROM=c.id;openBean(b.id)}:()=>{ADVRET=c.id;openBeanEditor(null,{roaster:c.roaster,bag:c.g,shelf:false,tried:calDay(c,n),cal:{id:c.id,d:n}})});return}
    const bb=e.target.closest('[data-bean]');if(bb){const b=beanById(bb.dataset.bean);if(b&&b.cal){ADVFROM=c.id;openBean(b.id);VD_BACK=()=>openCal(c.id,{back:b.cal.d});calSlide(1)}}};
  showDlg(d);$('vd-x').onclick=()=>d.close();
  // Back from a door: the page slides back, and that door swings shut.
  if(back){calSlide(-1);const r=document.querySelector('.adv-door[data-door="'+back+'"]');if(r){r.scrollIntoView({block:'center'});
      if(!RM()){r.insertAdjacentHTML('beforeend','<i class="adv-flap shut" aria-hidden="true"><b>'+back+'</b></i>');setTimeout(()=>r.querySelector('.adv-flap')?.remove(),900)}}}
  else d.scrollTop=0}

// Under the total: whose number it is and its place among your calendars.
function advSub(c,s,sc,rk,pos){return [sc.n?'Average of the '+sc.n+' coffee'+(sc.n===1?'':'s')+' you’ve rated':'Rate the coffees behind the doors to see it',
  rk.length>1&&pos>=0?'#'+(pos+1)+' of your '+rk.length+' calendars':''].filter(Boolean).join(' · ')}
// Adding or editing the box itself.
function openCalEditor(c){const d=$('vd'),isNew=!c,C=c||{name:'',roaster:'',year:new Date().getMonth()<6?new Date().getFullYear()-1:new Date().getFullYear(),n:24,g:50};
  const roasters=[...new Set(BEANS.map(x=>x.roaster).filter(Boolean))].sort();
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Advent calendar</span><h2 id="vd-title">'+(isNew?'Add an advent calendar':'Edit '+esc(calName(C)))+'</h2></div>'+
    '<div class="vd-body beform"><div class="be-photo" id="ac-photo"><span class="bph">'+advBoxSVG+'<small>Add a photo of the box</small></span></div>'+
    '<div class="actions two-up"><button type="button" class="btn ghost" id="ac-cam">Take a photo</button><button type="button" class="btn ghost" id="ac-pick">Choose a photo</button></div>'+
    '<input type="file" id="ac-camf" accept="image/*" capture="environment" hidden><input type="file" id="ac-file" accept="image/*" hidden>'+
    '<div class="field"><label for="ac-name">Calendar name</label><input id="ac-name" maxlength="60" value="'+esc(C.name)+'" placeholder="Coffee Advent 2026" autocomplete="off"></div>'+
    '<div class="field"><label for="ac-roaster">Roastery</label><div class="acw"><input id="ac-roaster" maxlength="50" value="'+esc(C.roaster)+'" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="ac-rsug"><div class="acl" id="ac-rsug" role="listbox" aria-label="Roasteries you’ve had" hidden></div></div></div>'+
    '<div class="adv-3"><div class="field"><label for="ac-year">Year</label><input id="ac-year" type="number" inputmode="numeric" min="2000" max="2100" value="'+C.year+'"></div>'+
    '<div class="field"><label for="ac-n">Doors</label><input id="ac-n" type="number" inputmode="numeric" min="1" max="31" value="'+C.n+'"></div>'+
    '<div class="field"><label for="ac-g">Each <span class="hint">grams</span></label><input id="ac-g" type="number" inputmode="numeric" min="1" max="500" value="'+C.g+'"></div></div>'+
    '<p class="hint">Each door you open becomes a coffee in your gallery, with its own rating, notes and diary.</p>'+
    '<div class="actions"><button class="btn" id="ac-save">'+(isNew?'Add the calendar':'Save changes')+'</button><button class="btn ghost" id="ac-cancel">Cancel</button></div></div>';
  autoList($('ac-roaster'),$('ac-rsug'),roasters);
  let photo=null,changed=false;
  const show=u=>{const p=$('ac-photo');p.classList.toggle('has',!!u);p.querySelector('img')?.remove();if(u){const i=new Image();i.alt='Photo of the calendar';i.src=u;p.prepend(i)}
    let rm=$('ac-rm');if(u&&!rm){p.insertAdjacentHTML('beforeend','<button type="button" class="be-rm" id="ac-rm" aria-label="Remove the photo">✕</button>');$('ac-rm').onclick=e=>{e.stopPropagation();photo=null;changed=true;show(null)}}else if(!u&&rm)rm.remove()};
  if(c&&c.img)BIMG.get(c.id).then(u=>{if(u&&!changed){photo=u;show(u)}});
  const take=async f=>{if(!f)return;try{photo=await shrinkPhoto(await fileURL(f),900);changed=true;show(photo)}catch(e){toast('Couldn’t open that photo')}};
  $('ac-cam').onclick=()=>$('ac-camf').click();$('ac-pick').onclick=$('ac-photo').onclick=e=>{if(e.target.closest('#ac-rm'))return;$('ac-file').click()};
  $('ac-camf').onchange=$('ac-file').onchange=e=>{const f=e.target.files[0];e.target.value='';take(f)};
  $('ac-cancel').onclick=()=>{if(c)openCal(c.id);else d.close()};
  $('ac-save').onclick=async()=>{const n=okCal({...(c||{}),id:c?c.id:uid().replace(/[^a-z0-9]/g,'').slice(0,20),name:$('ac-name').value,roaster:$('ac-roaster').value,year:$('ac-year').value,n:$('ac-n').value,g:$('ac-g').value,img:changed?!!photo:!!(c&&c.img),ts:c?c.ts:Date.now()});
    if(!n.name&&!n.roaster){toast('Add a name or the roastery first');$('ac-name').focus();return}
    if(changed){if(photo){if(!await BIMG.put(n.id,photo)){n.img=false;toast('The photo couldn’t be saved on this device')}}else BIMG.del(n.id)}
    const i=CALS.findIndex(x=>x.id===n.id);if(i>=0)CALS[i]=n;else CALS.unshift(n);saveCals();
    // The roaster of a new box fills in for doors still without one.
    if(c&&c.roaster!==n.roaster){for(const b of BEANS)if(b.cal&&b.cal.id===n.id&&(!b.roaster||b.roaster===c.roaster))b.roaster=n.roaster;saveBeans()}
    renderBeans();openCal(n.id);toast(isNew?'Calendar added: tap a door to add its coffee':'Saved')};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}

// Shared as text and a PDF: the box, your review, and every door you've opened, in order.
function calDoc(c){const s=calStats(c),doors=[...s.doors.entries()].sort((a,b)=>a[0]-b[0]);
  const sc=calScore(c,s);
  return{title:calName(c),sub:s.open+' of '+c.n+' doors opened'+(sc.v?' · rated '+sc.v.toFixed(1)+' of 5':''),file:'advent-'+c.year,
    blocks:[{kv:[['Roastery',c.roaster||'-'],['Year',String(c.year)],['Doors',c.n+' × '+c.g+' g'],['Total rating',sc.v?sc.v.toFixed(1)+' of 5 (average of '+sc.n+' rated)':'-']]},...(c.notes?[{h:'My review',p:c.notes}]:[]),
      {h:'The doors',list:doors.map(([n,b])=>'Day '+n+': '+beanTitle(b)+([b.roaster!==c.roaster?b.roaster:'',b.origin?originName(b.origin):''].filter(Boolean).length?' ('+[b.roaster!==c.roaster?b.roaster:'',b.origin?originName(b.origin):''].filter(Boolean).join(', ')+')':'')+(b.rating?' · '+b.rating+' of 5':''))}]}}
