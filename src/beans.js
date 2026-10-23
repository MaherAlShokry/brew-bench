/* ================= BEAN GALLERY ================= */
// Every coffee you've had, with a photo and a rating in beans. Each year you can crown a top 3, and past years stay
// as your history. It is the Beans tab, with Scan as a page inside it: scanning is how most beans arrive.

// Photos are too big for localStorage, so they live in IndexedDB, keyed by the bean's id. A small cache keeps
// scrolling the gallery from reading the same photo twice.
const BIMG=(()=>{let dbp=null;const cache=new Map();
  const db=()=>dbp||(dbp=new Promise((ok,no)=>{try{const r=indexedDB.open('bb-images',1);r.onupgradeneeded=()=>r.result.createObjectStore('img');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}}));
  const tx=(mode,fn)=>db().then(d=>new Promise((ok,no)=>{const t=d.transaction('img',mode),r=fn(t.objectStore('img'));t.oncomplete=()=>ok(r&&r.result);t.onerror=t.onabort=()=>no(t.error)}));
  return{peek:id=>cache.get(id),get:id=>cache.has(id)?Promise.resolve(cache.get(id)):tx('readonly',s=>s.get(id)).then(v=>{if(typeof v==='string')cache.set(id,v);return v||null}).catch(()=>null),
    put:(id,v)=>{cache.set(id,v);return tx('readwrite',s=>s.put(v,id)).then(()=>true).catch(()=>false)},
    del:id=>{cache.delete(id);return tx('readwrite',s=>s.delete(id)).then(()=>true).catch(()=>false)},
    // Every photo, for the backup file.
    all:()=>db().then(d=>new Promise(ok=>{const t=d.transaction('img','readonly'),s=t.objectStore('img'),k=s.getAllKeys(),v=s.getAll();
      t.oncomplete=()=>ok(Object.fromEntries(k.result.map((x,i)=>[x,v.result[i]]).filter(([,u])=>typeof u==='string')));t.onerror=()=>ok({})})).catch(()=>({})),
    clear:()=>{cache.clear();return tx('readwrite',s=>s.clear()).catch(()=>{})}}})();

const ISO_D=/^\d{4}-\d{2}-\d{2}$/;
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
// Saved beans are checked on the way in: a backup or an old version can't put anything odd on the page.
const BID=/^[a-z0-9]{4,24}$/;
// Days from an ISO date to today (negative for a date still to come).
const daysAgo=iso=>Math.round((Date.parse(todayISO()+'T12:00')-Date.parse(iso+'T12:00'))/864e5);
// Diary moments: what kind of entry it is, with its mark and a prompt to start from.
const MOMENTS={opened:['Opened the bag','📦','First impressions: the smell of the bag, the dry grounds…'],note:['Note','✍️','What did you notice in the cup today?'],
  dial:['Dialled in','🎯','The recipe and grind that finally clicked…'],best:['Best cup','🏆','What made this one special?'],shared:['Shared it','🤝','Who did you brew it for, and what did they think?'],
  last:['Last cup','🏁','How it ended, and would you buy it again?']};
const okEntry=e=>{if(!e||typeof e!=='object')return null;const k=MOMENTS[e.k]?e.k:'note',t=str(e.t,600);if(!t&&k==='note')return null;
  return{id:typeof e.id==='string'&&BID.test(e.id)?e.id:uid().replace(/[^a-z0-9]/g,'').slice(0,20),d:ISO_D.test(e.d)?e.d:todayISO(),k,t}};
const gramsOrNull=v=>v==null||v===''||!isFinite(+v)?null:Math.round(clamp(+v,0,5000));
function okBean(b){if(!b||typeof b!=='object'||typeof b.id!=='string'||!BID.test(b.id))return null;
  const r=Math.round(clamp(+b.rating||0,0,5)*2)/2,tried=ISO_D.test(b.tried)?b.tried:todayISO();
  return{id:b.id,name:str(b.name,60),roaster:str(b.roaster,50),origin:okOrigin(b.origin),process:PROCESSES[b.process]?b.process:'',
    variety:VBY[String(b.variety||'').split(':')[0]]?String(b.variety):'',roast:['light','medium','dark'].includes(b.roast)?b.roast:'',
    roastDate:ISO_D.test(b.roastDate)?b.roastDate:'',tried,rating:r,flavours:str(b.flavours,160),notes:str(b.notes,600),
    img:!!b.img,scan:typeof b.scan==='string'&&BID.test(b.scan)?b.scan:'',ts:+b.ts||Date.now(),
    // On the shelf: a bag you're drinking now. Coffees saved before shelves existed are on it if tried in the last month.
    shelf:typeof b.shelf==='boolean'?b.shelf:daysAgo(tried)<=30,
    // The bag: its size, and what was left when you last said so (brews logged since then are taken off).
    bag:gramsOrNull(b.bag)||0,left:gramsOrNull(b.left),leftAt:+b.leftAt||0,again:b.again==='yes'||b.again==='no'?b.again:'',
    diary:(Array.isArray(b.diary)?b.diary:[]).map(okEntry).filter(Boolean).sort((x,y)=>y.d.localeCompare(x.d)).slice(0,80)}}
let BEANS=load('bb-beans',[]);BEANS=Array.isArray(BEANS)?BEANS.map(okBean).filter(Boolean):[];
// Top 3 per year: three places (gold, silver, bronze), each a bean id or '' while open, plus a snapshot so a podium
// survives the bean being deleted later.
let TOP3=(t=>{const o={};if(t&&typeof t==='object')for(const [y,v] of Object.entries(t))if(/^\d{4}$/.test(y)&&v&&Array.isArray(v.ids)){
  const ids=[0,1,2].map(i=>typeof v.ids[i]==='string'&&BID.test(v.ids[i])?v.ids[i]:'');if(!ids.some(Boolean))continue;
  o[y]={ids,snap:(Array.isArray(v.snap)?v.snap:[]).filter(s=>s&&BID.test(s.id)).slice(0,3).map(s=>({id:s.id,name:str(s&&s.name,60),roaster:str(s&&s.roaster,50),origin:okOrigin(s&&s.origin),rating:clamp(+(s&&s.rating)||0,0,5)})),at:+v.at||0}}return o})(load('bb-top3',{}));
const t3has=t=>!!t&&t.ids.some(Boolean);
let BQ='',BSORT='recent',BYEAR='all',BPOD=null,BVIEW='coffees';
// Cards slide in the first time you see them, not every time the list is sorted or searched.
const BSEEN=new Set();
function saveBeans(){try{localStorage.setItem('bb-beans',JSON.stringify(BEANS));reschedule();return true}catch(e){toast('Couldn’t save: this device’s storage is full');return false}}
const saveTop3=()=>save('bb-top3',TOP3);
const beanYear=b=>+b.tried.slice(0,4);
const beanById=id=>BEANS.find(b=>b.id===id);
const beanTitle=b=>b.name||(b.origin?originName(b.origin)+(b.variety?' '+vName(b.variety):''):'Unnamed coffee');
const flagOf=k=>(oInfo(k)||{}).flag||'';
// The place a bean holds in its year's top 3 (1, 2 or 3), or 0.
const beanRank=b=>{const t=TOP3[beanYear(b)];return t?t.ids.indexOf(b.id)+1:0};
const inAnyTop=id=>Object.values(TOP3).some(t=>t.ids.includes(id));
const MEDAL=['','#C9964A','#A49C92','#A8673F'],MEDALN=['','Gold','Silver','Bronze'];

/* ---------- On the shelf: freshness and what's left in the bag ---------- */
// The brews you logged from the dial-in with this coffee picked (yours only, in a shared log).
const beanBrews=b=>LOG.filter(l=>l&&l.snap&&l.snap.bean&&l.snap.bean.id===b.id&&(!l.by||l.by===ME));
// Grams left: what you last said was left (or the full bag), less every brew logged since. null when the bag size isn't known.
function gramsLeft(b){const base=b.left!=null?b.left:b.bag;if(!base&&b.left==null)return null;const since=b.left!=null?b.leftAt:b.ts;
  return Math.max(0,Math.round(base-beanBrews(b).filter(l=>(+l.ts||0)>since).reduce((s,l)=>s+(+l.snap.dose||0),0)))}
const beanDose=b=>{const d=beanBrews(b).map(l=>+l.snap.dose).filter(v=>v>0);return d.length?d.reduce((a,v)=>a+v,0)/d.length:(+S.dose||15)};
const cupsLeft=b=>{const g=gramsLeft(b);return g==null?null:Math.floor(g/beanDose(b))};
// Where a bag is in its life, from the roast date: resting (still degassing), at its peak, still lovely, then fading.
const FRESH={rest:['Resting','Give it a few more days: fresh coffee is gassy and brews uneven.'],peak:['At its peak','Brew it now: these are its best weeks.'],
  good:['Still lovely','Past its peak but still sweet. A touch finer if it tastes flat.'],fade:['Fading','Getting tired: grind finer and brew a little hotter to wake it up.']};
function fresh(b){if(!b.roastDate)return null;const d=daysAgo(b.roastDate);if(d<0)return null;const k=d<4?'rest':d<=21?'peak':d<=45?'good':'fade';return{d,k,label:FRESH[k][0],tip:FRESH[k][1]}}
// The freshness line: 0 to 60 days, its four stretches coloured, a marker on today.
const freshBar=f=>'<span class="fbar" role="img" aria-label="Day '+f.d+' off roast: '+f.label+'"><i class="fz1"></i><i class="fz2"></i><i class="fz3"></i><i class="fz4"></i><b style="left:'+Math.min(100,f.d/60*100).toFixed(1)+'%"></b></span>';
const freshPill=f=>'<span class="fpill f-'+f.k+'">'+f.label+' · day '+f.d+'</span>';
const bagLine=b=>{const g=gramsLeft(b);if(g==null)return '';const c=cupsLeft(b),pct=b.bag?clamp(g/b.bag*100,0,100):null;
  return '<span class="bagl">'+(pct!=null?'<span class="bagm"><i style="width:'+pct.toFixed(0)+'%"></i></span>':'')+'<small>'+(g?g+' g left'+(c!=null?' · about '+c+' cup'+(c===1?'':'s'):''):'Bag empty')+'</small></span>'};
// Mark the bag's contents as they are now: brews logged after this are taken off again.
function setLeft(b,g){b.left=gramsOrNull(g);b.leftAt=Date.now()}

/* ---------- The diary ---------- */
// A coffee's story: your entries and the brews you logged with it, newest first.
function beanTimeline(b){const fmt=s=>new Date(s+'T12:00');
  return [...b.diary.map(e=>({kind:'entry',d:e.d,t:fmt(e.d).getTime(),e})),
    ...beanBrews(b).map(l=>({kind:'brew',d:'',t:+l.ts||0,l}))].sort((x,y)=>y.t-x.t)}
const dfmt=t=>new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
function timelineHTML(items,withBean){if(!items.length)return '';
  return '<ol class="tline">'+items.map(it=>{const b=it.bean,head=withBean&&b?'<button type="button" class="tl-bean" data-bean="'+b.id+'">'+beanPic(b,'xs')+'<b>'+esc(beanTitle(b))+'</b></button>':'';
    if(it.kind==='entry'){const [n,ic]=MOMENTS[it.e.k];return '<li class="tl-e k-'+it.e.k+'"><span class="tl-ic" aria-hidden="true">'+ic+'</span><div class="tl-b">'+head+'<div class="tl-h"><b>'+n+'</b><time>'+dfmt(it.t)+'</time>'+
      (withBean?'':'<button type="button" class="tl-x" data-deldiary="'+it.e.id+'" aria-label="Delete this entry">✕</button>')+'</div>'+(it.e.t?'<p>'+esc(it.e.t)+'</p>':'')+'</div></li>'}
    const l=it.l,B=BREWERS[l.snap.b],st=+l.stars||0;
    return '<li class="tl-e k-brew"><span class="tl-ic" aria-hidden="true">☕</span><div class="tl-b">'+head+'<div class="tl-h"><b>Brewed'+(B?' on '+esc(B.name):'')+'</b><time>'+dfmt(it.t)+'</time></div>'+
      '<p class="tl-meta">'+[l.snap.dose?gfmt(l.snap.dose)+' g':'',l.snap.rec||'',st?'★'.repeat(st)+'☆'.repeat(5-st):''].filter(Boolean).map(esc).join(' · ')+'</p>'+(l.notes?'<p>'+esc(l.notes)+'</p>':'')+'</div></li>'}).join('')+'</ol>'}

/* ---------- Trophies ---------- */
// Earned from the cabinet as it is: each has a goal and counts towards it. The day one is first earned is kept.
const WILD=['anaerobic','anaerobicnatural','anaerobicwashed','carbonic','lactic','yeast','koji','extended','thermalshock','mossto','coferment','infused','barrelaged'];
function cabStats(){const o=new Set(BEANS.map(b=>b.origin).filter(Boolean));
  return{n:BEANS.length,o,regs:new Set([...o].map(k=>(oInfo(k)||{}).reg).filter(Boolean)),procs:new Set(BEANS.map(b=>b.process).filter(Boolean)),
    roasters:new Set(BEANS.map(b=>b.roaster.toLowerCase()).filter(Boolean)),diary:BEANS.reduce((a,b)=>a+b.diary.length,0),done:BEANS.filter(b=>!b.shelf).length,
    crowned:Object.values(TOP3).some(t=>t.ids.every(Boolean)),perfect:BEANS.some(b=>b.rating===5),wild:BEANS.some(b=>WILD.includes(b.process)),
    geisha:BEANS.some(b=>/^geisha/.test(b.variety)),arabia:BEANS.some(b=>['yemen','saudi','oman','uae'].includes(b.origin)),eth:o.has('ethiopia')}}
const TROPHIES=[
  ['first','First bag','Add your first coffee to the cabinet','☕',s=>[s.n,1]],['ten','Ten bags','Ten coffees in the cabinet','🛍️',s=>[s.n,10]],['fifty','The collector','Fifty coffees in the cabinet','🏛️',s=>[s.n,50]],
  ['birth','Where it began','A coffee from Ethiopia, the birthplace of Arabica','🐐',s=>[+s.eth,1]],['mocha','The Mocha road','A coffee from the Arabian Peninsula','⛵',s=>[+s.arabia,1]],
  ['pass5','Stamped passport','Coffees from five origins','🛂',s=>[s.o.size,5]],['pass15','Globetrotter','Coffees from fifteen origins','🌍',s=>[s.o.size,15]],['regions','All five regions','A coffee from every coffee region','🧭',s=>[s.regs.size,5]],
  ['procs','Process explorer','Five different processes','🧪',s=>[s.procs.size,5]],['wild','Wild side','An anaerobic, carbonic or co-fermented coffee','🍷',s=>[+s.wild,1]],['geisha','Geisha club','A Geisha in the cabinet','🌸',s=>[+s.geisha,1]],
  ['roasters','Roastery hopper','Coffees from five roasteries','🔥',s=>[s.roasters.size,5]],['diary','Diarist','Ten diary entries','📖',s=>[s.diary,10]],['done','Clean plate','Finish ten bags','🏁',s=>[s.done,10]],
  ['perfect','Perfect five','Rate a coffee five beans','✨',s=>[+s.perfect,1]],['crowned','Crowned','A full top 3 for a year','👑',s=>[+s.crowned,1]]];
let TGOT=load('bb-trophies',null);
// New trophies are announced; the first time this runs, the ones already earned are noted quietly.
function checkTrophies(){const st=cabStats(),first=!TGOT||typeof TGOT!=='object';if(first)TGOT={};const news=[];
  for(const [id,n,,ic,f] of TROPHIES){const [h,need]=f(st);if(h>=need&&!TGOT[id]){TGOT[id]=todayISO();news.push(ic+' '+n)}}
  save('bb-trophies',TGOT);if(!first&&news.length)setTimeout(()=>toast('Trophy unlocked: '+news.join(', ')),600)}

/* ---------- From your cabinet: one coffee a day ---------- */
// Like the word of the day: a coffee from your cabinet, chosen for the date. A bag that needs you comes first (just at
// its peak, nearly empty, or fading), then one you tried on this day in an earlier year, then a memory from your diary
// or a favourite worth another look.
function cabinetDay(when){const day=when||new Date(),iso=day.getFullYear()+'-'+String(day.getMonth()+1).padStart(2,'0')+'-'+String(day.getDate()).padStart(2,'0');
  const seed=Math.floor(Date.parse(iso+'T12:00')/864e5),pick=l=>l[((seed%l.length)+l.length)%l.length],at=t=>Math.round((Date.parse(iso+'T12:00')-Date.parse(t+'T12:00'))/864e5);
  if(!BEANS.length)return null;const shelf=BEANS.filter(b=>b.shelf),need=[];
  for(const b of shelf){const d=b.roastDate?at(b.roastDate):null,c=cupsLeft(b);
    // Each nudge comes on a few days, not every day: the peak on days 4 and 5, fading once a week, running low every third day.
    if(d!=null&&d>=4&&d<=5)need.push({b,k:'peak',title:beanTitle(b)+' is at its peak',text:'Day '+d+' off roast: its best weeks start now. Brew it today.'});
    else if(c!=null&&c<=2&&seed%3===0)need.push({b,k:'low',title:c?'About '+c+' cup'+(c===1?'':'s')+' of '+beanTitle(b)+' left':beanTitle(b)+' is empty',text:c?'Make the last of it count, or note how it ended in its diary.':'Finish the bag in its page to move it into the cabinet.'});
    else if(d!=null&&d>45&&d<=75&&(d-46)%7===0)need.push({b,k:'fade',title:beanTitle(b)+' is fading',text:'Day '+d+' off roast. Brew it soon: a little finer and hotter brings it back.'})}
  if(need.length)return pick(need);
  const md=iso.slice(5),ago=BEANS.filter(b=>b.tried.slice(5)===md&&b.tried<iso);
  if(ago.length){const b=pick(ago),y=+iso.slice(0,4)-+b.tried.slice(0,4);return{b,k:'ago',title:(y===1?'A year':y+' years')+' ago today',text:'You tried '+beanTitle(b)+(b.roaster?' from '+b.roaster:'')+(b.rating?' and gave it '+String(b.rating).replace('.5','½')+' beans.':'.')}}
  const mem=[];for(const b of BEANS)for(const e of b.diary)if(e.t&&at(e.d)>=14)mem.push({b,e});
  const fav=BEANS.filter(b=>b.rating>=3.5);
  if(mem.length&&(seed%2||!fav.length)){const {b,e}=pick(mem);return{b,k:'mem',title:'From your diary',text:'“'+(e.t.length>140?e.t.slice(0,137).replace(/\s+\S*$/,'')+'…':e.t)+'”  '+beanTitle(b)+', '+dfmt(Date.parse(e.d+'T12:00'))}}
  const b=pick(fav.length?fav:BEANS);return{b,k:'fav',title:beanTitle(b),text:[b.roaster,b.origin?originName(b.origin):'',b.rating?String(b.rating).replace('.5','½')+' beans':''].filter(Boolean).join(' · ')+(b.flavours?'. You tasted '+b.flavours.split(/\s*[,;·]\s*/).slice(0,3).join(', ')+'.':'.')}}
const DAYK={peak:'At its peak',low:'Running low',fade:'Brew it soon',ago:'On this day',mem:'A memory',fav:'From your cabinet'};
/* ---------- The daily reminder on the phone ---------- */
// In the Android app, the coffee of the day can also arrive as a notification at a time you choose. The next two weeks
// are scheduled ahead, each with that day's coffee, and scheduled again whenever the app opens or the cabinet changes.
let REMIND=(v=>({on:!!(v&&v.on),t:v&&/^\d\d:\d\d$/.test(v.t)?v.t:'09:00'}))(load('bb-remind',null));
const LN=()=>plugin('LocalNotifications'),RIDS=[...Array(14)].map((_,i)=>7101+i);
async function scheduleReminders(){const ln=LN();if(!ln)return false;
  try{await ln.cancel({notifications:RIDS.map(id=>({id}))})}catch(e){}
  if(!REMIND.on)return true;const [h,m]=REMIND.t.split(':').map(Number),now=new Date(),list=[];
  for(let i=0;i<14;i++){const at=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,h,m);if(at<=now)continue;const c=cabinetDay(at);
    list.push({id:RIDS[i],title:'☕ '+(c?DAYK[c.k]:'Time for a good cup'),body:c?(c.k==='fav'?c.title+': ':c.title+'. ')+c.text:'Add the bag you’re drinking to your cabinet and keep its story.',schedule:{at,allowWhileIdle:true},extra:c?{bean:c.b.id}:{}})}
  try{if(list.length)await ln.schedule({notifications:list});return true}catch(e){return false}}
let RST=0;function reschedule(){if(!REMIND.on||!LN())return;clearTimeout(RST);RST=setTimeout(scheduleReminders,1200)}
// Turning it on asks Android for permission to notify, the first time.
async function setReminder(on,t){const ln=LN();if(t)REMIND.t=t;
  if(on&&!REMIND.on){if(!ln){toast('Phone reminders work in the Android app');return false}
    try{let p=await ln.checkPermissions();if(p.display!=='granted')p=await ln.requestPermissions();if(p.display!=='granted'){toast('Allow notifications for Brew Bench in your phone’s settings first');return false}}catch(e){toast('Couldn’t turn on reminders');return false}}
  REMIND.on=on;save('bb-remind',REMIND);await scheduleReminders();if(on)toast('Your coffee of the day arrives at '+REMIND.t);return true}
// Tapping the notification opens that coffee.
(()=>{const ln=LN();if(!ln)return;try{ln.addListener('localNotificationActionPerformed',a=>{const id=a&&a.notification&&a.notification.extra&&a.notification.extra.bean;if(id&&beanById(id)){showTab('beans');openBean(id)}})}catch(e){}
  if(REMIND.on)setTimeout(scheduleReminders,3000)})();
function cabinetDayHTML(){const c=cabinetDay();if(!c)return '';
  return '<button type="button" class="cday k-'+c.k+'" data-bean="'+c.b.id+'">'+beanPic(c.b,'cd')+'<span class="cd-tx"><small>'+(c.k==='fav'?'From your cabinet':'From your cabinet · '+DAYK[c.k])+'</small><b>'+esc(c.title)+'</b><span>'+esc(c.text)+'</span></span></button>'}

/* Ratings are drawn as coffee beans: a filled bean, half a bean, or an empty one. */
const BEAN_G='<g transform="rotate(30 12 12)"><path class="bo" d="M12 2.6c4.1 0 6.6 4.3 6.6 9.4s-2.5 9.4-6.6 9.4-6.6-4.3-6.6-9.4 2.5-9.4 6.6-9.4z"/><path class="bc" d="M12.7 3.2c-2.4 2.6-.4 5.6-1.3 8.8s1.3 5.9-.6 8.8"/></g>';
const beanSVG='<svg viewBox="0 0 24 24" aria-hidden="true">'+BEAN_G+'</svg>';
const RATEW=['Not rated','Not for me','Okay','Good','Great','Outstanding'];
const rateWord=r=>RATEW[Math.floor(r)]||RATEW[0];
function beanRow(r,cls){let h='';for(let i=1;i<=5;i++){const f=r>=i?100:r>=i-0.5?50:0;h+='<span class="rb">'+beanSVG+'<span class="rbf" style="width:'+f+'%">'+beanSVG+'</span></span>'}
  return '<span class="beans-r'+(cls?' '+cls:'')+'" role="img" aria-label="'+(r?r+' out of 5 beans':'Not rated')+'">'+h+'</span>'}
// The rating input: tap the left half of a bean for a half, the right half for a whole one; arrow keys step by halves.
function beanRateInput(id,get,set){const el=$(id);
  const draw=()=>{const r=get();el.innerHTML=beanRow(r,'big')+'<span class="br-w">'+(r?r.toString().replace('.5','½')+' · ':'')+rateWord(r)+'</span>';el.setAttribute('aria-valuenow',r);el.setAttribute('aria-valuetext',r?r+' beans, '+rateWord(r):'Not rated')};
  el.setAttribute('role','slider');el.tabIndex=0;el.setAttribute('aria-valuemin','0');el.setAttribute('aria-valuemax','5');el.setAttribute('aria-label','Your rating');
  el.onclick=e=>{const rb=e.target.closest('.rb');if(!rb)return;const i=[...el.querySelectorAll('.beans-r>.rb')].indexOf(rb)+1,box=rb.getBoundingClientRect();
    let v=e.clientX-box.left<box.width/2?i-0.5:i;if(v===get())v=v===i?i-0.5:0;set(v);draw()};
  el.onkeydown=e=>{const k=e.key,r=get();let v=null;if(k==='ArrowRight'||k==='ArrowUp')v=Math.min(5,r+0.5);else if(k==='ArrowLeft'||k==='ArrowDown')v=Math.max(0,r-0.5);
    else if(k==='Home')v=0;else if(k==='End')v=5;else if(/^[0-5]$/.test(k))v=+k;if(v==null)return;e.preventDefault();set(v);draw()};
  draw()}

/* Photos are shrunk to fit 900px and saved as JPEG: sharp on a phone, small enough to keep hundreds. */
function shrinkPhoto(src,max){return new Promise((ok,no)=>{const img=new Image();img.onload=()=>{const s=Math.min(1,(max||900)/Math.max(img.width,img.height)),c=document.createElement('canvas');
  c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);try{ok(c.toDataURL('image/jpeg',0.8))}catch(e){no(e)}};
  img.onerror=()=>no(new Error('image'));img.src=src})}
const fileURL=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(f)});
// Fill in the photos once the cards are on the page. Photos already read show at once, with no fade, so sorting and
// searching don't flicker.
// Photos not yet read load as they come near the screen, so a long gallery (or a view you haven't opened) costs nothing.
function loadImg(el){const id=el.dataset.bimg;if(!id)return;el.removeAttribute('data-bimg');
  const put=(u,now)=>{const i=new Image();i.alt='';i.decoding='async';i.src=u;if(now){i.className='now';el.classList.add('has');el.prepend(i)}else i.onload=()=>{el.classList.add('has');el.prepend(i)}};
  const c=BIMG.peek(id);if(c){put(c,true);return}BIMG.get(id).then(u=>{if(u)put(u,false)})}
const BIO='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){BIO.unobserve(e.target);loadImg(e.target)}}),{rootMargin:'400px 0px'}):null;
function hydrateImgs(root){root.querySelectorAll('[data-bimg]').forEach(el=>{if(BIMG.peek(el.dataset.bimg)||!BIO||root.closest&&root.closest('dialog'))loadImg(el);else BIO.observe(el)})}
// The photo area: a placeholder in the origin's flag and coffee tones until the photo loads (or when there isn't one).
// Without a photo, a coffee gets a tile in its origin region's colour (the map's colours) with a large bean.
const regCol=k=>{const o=oInfo(k);return o&&REG[o.reg]?REG[o.reg].color:'var(--cherry)'};
const beanPic=(b,cls)=>'<span class="bpic'+(cls?' '+cls:'')+'" style="--rc:'+regCol(b.origin)+'"'+(b.img?' data-bimg="'+b.id+'"':'')+'><span class="bph">'+beanSVG+(b.origin?'<span class="bfl">'+flagOf(b.origin)+'</span>':'')+'</span></span>';
const glassRate=r=>'<span class="bglass">'+beanSVG+(r?r.toString().replace('.5','½'):'–')+'</span>';
const CROWN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>';

/* ---------- The Beans page ---------- */
function beanList(){const q=BQ.trim().toLowerCase();
  let l=BEANS.filter(b=>(BYEAR==='all'||beanYear(b)===+BYEAR)&&(!q||[b.name,b.roaster,originName(b.origin),b.process&&PROCESSES[b.process].name,b.variety&&vName(b.variety),b.flavours,b.notes].join(' ').toLowerCase().includes(q)));
  const by={recent:(a,b)=>b.tried.localeCompare(a.tried)||b.ts-a.ts,rated:(a,b)=>b.rating-a.rating||b.tried.localeCompare(a.tried),
    roaster:(a,b)=>(a.roaster||'~').localeCompare(b.roaster||'~')||b.rating-a.rating,origin:(a,b)=>(originName(a.origin)||'~').localeCompare(originName(b.origin)||'~')||b.rating-a.rating};
  return l.sort(by[BSORT])}
// Cards are grouped the way they're sorted: by year, roastery or origin. Top rated is one ranked list.
function beanGroups(l){if(BSORT==='rated')return [['',l]];const g=new Map();
  for(const b of l){const k=BSORT==='recent'?String(beanYear(b)):BSORT==='roaster'?(b.roaster||'Roastery not set'):(b.origin?flagOf(b.origin)+' '+originName(b.origin):'Origin not set');if(!g.has(k))g.set(k,[]);g.get(k).push(b)}
  return [...g]}
// A photo card: the bag fills it, the name sits on a soft shade at the bottom, the rating on a glass pill.
function beanCard(b,i){const rk=beanRank(b),proc=b.process?PROCESSES[b.process].name:'',fresh=!BSEEN.has(b.id);BSEEN.add(b.id);
  return '<button type="button" class="bcard'+(fresh?' enter':'')+'" data-bean="'+b.id+'" style="--i:'+Math.min(i||0,10)+'">'+beanPic(b)+
    (rk?'<span class="bmedal" style="--m:'+MEDAL[rk]+'" title="'+MEDALN[rk]+', top 3 of '+beanYear(b)+'">'+CROWN+rk+'</span>':'')+glassRate(b.rating)+
    '<span class="bc-body"><b>'+esc(beanTitle(b))+'</b><small>'+esc([b.roaster,b.origin?flagOf(b.origin)+' '+originName(b.origin):'',proc].filter(Boolean).join(' · ')||' ')+'</small></span></button>'}
const beanYears=()=>[...new Set([...BEANS.map(beanYear),...Object.keys(TOP3).filter(y=>t3has(TOP3[y])).map(Number)])].sort((a,b)=>b-a);
const t3name=(t,id)=>{const b=beanById(id),s=(t.snap||[]).find(x=>x.id===id)||{};return b?beanTitle(b):s.name||'A coffee'};
// The year's top 3 as a showcase: three tall photo cards, the winner raised in the middle with a gold sheen.
// An open place is a button: tap it to choose the coffee for that place.
function podiumHTML(y,years){const t=TOP3[y],n=BEANS.filter(b=>beanYear(b)===y).length,cy=new Date().getFullYear(),has=t3has(t);
  const slot=i=>{const id=t&&t.ids[i];
    if(!id)return '<button type="button" class="pm pm'+(i+1)+' empty" style="--m:'+MEDAL[i+1]+'"'+(n?' data-top3="'+y+'" data-slot="'+i+'"':' disabled')+'><span class="pm-card"><span class="pm-ph">'+CROWN+(n?'<small>Tap to crown</small>':'')+'</span></span><span class="pm-rk">'+(i+1)+'</span><b>'+MEDALN[i+1]+'</b><small>Open</small></button>';
    const b=beanById(id),s=(t.snap||[]).find(x=>x.id===id)||{},v=b||Object.assign({id,img:true,origin:''},s);
    return '<button type="button" class="pm pm'+(i+1)+'" style="--m:'+MEDAL[i+1]+'"'+(b?' data-bean="'+id+'"':' data-top3="'+y+'" data-slot="'+i+'"')+'><span class="pm-card">'+beanPic(Object.assign({},v,{img:b?b.img:true}))+(i===0?'<span class="pm-sheen"></span>':'')+'</span>'+
      '<span class="pm-rk">'+(i===0?CROWN:'')+(i+1)+'</span><b>'+esc(t3name(t,id))+'</b><small>'+esc((b?b.roaster:s.roaster)||'')+'</small></button>'};
  const yrs=[...new Set([cy,...years])].sort((a,b)=>b-a);
  return '<div class="crown-h"><div><span class="crown-k">'+(y===cy?'This year’s favourites':'Your history')+'</span><h3>Top 3 of '+y+'</h3></div>'+
    (n?'<button type="button" class="crown-btn" data-top3="'+y+'" data-slot="0">'+(has?'Change':'Pick')+'</button>':'')+'</div>'+
    (yrs.length>1?'<div class="crown-yrs" role="group" aria-label="Year">'+yrs.map(x=>'<button type="button" data-py="'+x+'" aria-pressed="'+(x===y)+'">'+x+'</button>').join('')+'</div>':'')+
    '<div class="podium">'+[1,0,2].map(slot).join('')+'</div>'+
    (has?'':'<p class="crown-empty">'+(n?'Tap a place to crown a coffee of '+y+'. Your picks stay in your history after the year ends.':'Add the coffees you drink in '+y+', then crown your favourites here.')+'</p>')}
const SCAN_ICO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2 M16 4h2a2 2 0 0 1 2 2v2 M20 16v2a2 2 0 0 1-2 2h-2 M8 20H6a2 2 0 0 1-2-2v-2 M12 8.5c2 0 3.5 1.6 3.5 3.5S14 15.5 12 15.5 8.5 14 8.5 12 10 8.5 12 8.5z"/></svg>',
  PLUS_ICO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
// The view switch sticks just under the app bar, whose height follows the text size.
function setAbBottom(){const a=$('appbar');if(!a)return;const top=parseFloat(getComputedStyle(a).top)||0;document.documentElement.style.setProperty('--ab-b',Math.round(top+a.offsetHeight)+'px')}
addEventListener('resize',setAbBottom);
// The page: a compact hero with the two ways in, then one of three views (your coffees, the top 3, your scans).
function renderBeans(){const el=$('beans-in');if(!el)return;setAbBottom();
  if(!el.firstChild)el.innerHTML='<div id="bg-hero"></div><div id="bg-day"></div><div class="seg bviews scrollrow" id="bg-views" role="group" aria-label="Show"></div>'+
    '<div class="bview" id="bv-coffees" aria-label="Your cabinet"></div><div class="bview" id="bv-diary" aria-label="Your coffee diary"></div><div class="bview" id="bv-passport" aria-label="Your coffee passport"></div>'+
    '<div class="bview" id="bv-top3" aria-label="Top 3"></div><div class="bview" id="bv-scans" aria-label="Your scans"></div>';
  $('bg-day').innerHTML=cabinetDayHTML();hydrateImgs($('bg-day'));
  renderBeanHero();renderBeanViews();renderCoffees();renderDiaryView();renderPassport();renderTop3View();renderBeanScans()}
function renderBeanHero(){const cy=new Date().getFullYear(),N=BEANS.length,rated=BEANS.filter(b=>b.rating),avg=rated.length?rated.reduce((s,b)=>s+b.rating,0)/rated.length:0,
    roasters=new Set(BEANS.map(b=>b.roaster.toLowerCase()).filter(Boolean)).size,origins=new Set(BEANS.map(b=>b.origin).filter(Boolean)).size,
    last=[...BEANS].sort((a,b)=>b.tried.localeCompare(a.tried)||b.ts-a.ts).slice(0,3);
  const h=$('bg-hero');h.className='bg-hero'+(N?'':' empty');
  h.innerHTML='<div class="bgh-tx"><span class="bgh-k">Your coffee journal</span>'+
      (N?'<h3>'+N+' coffee'+(N===1?'':'s')+(origins?' <em>· '+origins+' origin'+(origins===1?'':'s')+'</em>':'')+'</h3>'+
        '<div class="bgh-stats"><span><b>'+roasters+'</b>'+(roasters===1?'roastery':'roasteries')+'</span><span><b>'+(avg?avg.toFixed(1):'–')+beanSVG+'</b>average</span><span><b>'+BEANS.filter(b=>beanYear(b)===cy).length+'</b>in '+cy+'</span></div>'
        :'<h3>Start your <em>coffee journal</em></h3><p>Scan a bag or add one by hand, then rate it in beans.</p>')+
      '</div><div class="bgh-fan" aria-hidden="true">'+(last.length?last.map(b=>beanPic(b)).join(''):'<span class="bpic"><span class="bph">'+beanSVG+'</span></span>')+'</div>'+
    '<div class="bgh-acts"><button type="button" class="bgh-btn main" id="bg-scan">'+SCAN_ICO+'Scan a bag</button><button type="button" class="bgh-btn" id="bg-add">'+PLUS_ICO+'Add a coffee</button></div>';
  hydrateImgs(h)}
function renderBeanViews(){const cy=new Date().getFullYear();
  const cnt=n=>n?' <i>'+(n>999?'999+':n)+'</i>':'';
  seg('bg-views',[['coffees','Cabinet'+cnt(BEANS.length)],['diary','Diary'],['passport','Passport'],['top3','Top 3'],['scans','Scans'+cnt(SCANS.length)]],()=>BVIEW,v=>{if(v===BVIEW)return;BVIEW=v;renderBeanViews()});
  if(BVIEW==='passport')renderPassport();
  for(const v of ['coffees','diary','passport','top3','scans']){const p=$('bv-'+v),on=v===BVIEW;if(p.hidden===!on)continue;p.hidden=!on;if(on&&!RM()){p.classList.remove('bv-in');void p.offsetWidth;p.classList.add('bv-in')}}}
function renderCoffees(){const p=$('bv-coffees'),years=beanYears();if(BYEAR!=='all'&&!years.includes(+BYEAR))BYEAR='all';
  if(!BEANS.length){p.innerHTML='<div class="bg-empty">'+beanSVG+'<b>No coffees yet</b><p>Scan a bag or add one by hand. Your earlier scans are under <button type="button" class="linkbtn" data-view="scans">Scans</button>, ready to add.</p></div>';return}
  p.innerHTML=shelfHTML()+trophyRowHTML()+'<h3 class="rh cab-h">The cabinet</h3><div class="bg-tools"><input type="search" id="bg-q" placeholder="Search coffees, roasters, origins, notes" aria-label="Search your coffees" value="'+esc(BQ)+'">'+
    '<div class="seg filters scrollrow" id="bg-sort" role="group" aria-label="Sort"></div>'+(years.length>1?'<div class="seg filters scrollrow" id="bg-year" role="group" aria-label="Show year"></div>':'')+'</div><div id="bg-grid"></div>';
  seg('bg-sort',[['recent','Recent'],['rated','Top rated'],['roaster','Roastery'],['origin','Origin']],()=>BSORT,v=>{BSORT=v;renderBeanSort()});
  if(years.length>1)seg('bg-year',[['all','All years'],...years.map(y=>[String(y),String(y)])],()=>BYEAR,v=>{BYEAR=v;renderBeanSort()});
  renderGrid()}
// Sorting and filtering redraw only the cards and the chips' state, so the page doesn't jump.
function renderBeanSort(){for(const [id,v] of [['bg-sort',BSORT],['bg-year',BYEAR]]){const s=$(id);if(s)s.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v))}renderGrid()}
function renderGrid(){const g=$('bg-grid');if(!g)return;const list=beanList();let n=0;
  // Each coffee stands on a shelf: the slots' ledges meet across a row, so every row reads as one shelf of the cabinet.
  g.className=list.length?'cabinet':'';
  g.innerHTML=list.length?beanGroups(list).map(([h,l])=>(h?'<div class="bg-gh"><b>'+esc(h)+'</b><span>'+l.length+'</span></div>':'')+'<div class="bgrid">'+l.map(b=>'<div class="cslot">'+beanCard(b,n++)+'</div>').join('')+'</div>').join(''):'<p class="hint">No coffees match that search.</p>';
  hydrateImgs(g)}
// The bags you're drinking now, each with its freshness and what's left.
function shelfHTML(){const sh=BEANS.filter(b=>b.shelf).sort((a,b)=>b.tried.localeCompare(a.tried)||b.ts-a.ts);
  return '<div class="shelf-h"><b>On the shelf</b><span>'+(sh.length?sh.length+' open bag'+(sh.length===1?'':'s'):'')+'</span></div>'+
    (sh.length?'<div class="shelf scrollrow">'+sh.map(b=>{const f=fresh(b);return '<button type="button" class="scard" data-bean="'+b.id+'">'+beanPic(b,'sc')+
      '<span class="sc-tx"><b>'+esc(beanTitle(b))+'</b><small>'+esc(b.roaster||(b.origin?originName(b.origin):'')||' ')+'</small>'+(f?freshPill(f):'')+bagLine(b)+'</span></button>'}).join('')+'</div>'
     :'<p class="shelf-empty">The bags you’re drinking now sit here, with how fresh they are and what’s left. Put a coffee on the shelf from its page.</p>')}
// The trophies you've earned, along the top of the cabinet.
function trophyRowHTML(){const got=TROPHIES.filter(t=>TGOT&&TGOT[t[0]]);
  return '<button type="button" class="tshelf" data-view="passport" aria-label="Trophies: '+got.length+' of '+TROPHIES.length+'. Open your passport"><span class="ts-k">Trophies</span><span class="ts-row">'+
    (got.length?got.map(t=>'<i title="'+esc(t[1])+'">'+t[3]+'</i>').join(''):'<em>Your first comes with your first coffee</em>')+'</span><b>'+got.length+'<small>/'+TROPHIES.length+'</small></b></button>'}
function renderTop3View(){const p=$('bv-top3'),years=beanYears(),cy=new Date().getFullYear();if(BPOD==null||!(years.includes(BPOD)||BPOD===cy))BPOD=cy;
  const hist=Object.keys(TOP3).map(Number).filter(y=>y!==BPOD&&t3has(TOP3[y])).sort((a,b)=>b-a);
  p.innerHTML='<div class="crown">'+podiumHTML(BPOD,years)+'</div>'+
    (hist.length?'<h3 class="rh">Your top 3 history</h3><div class="t3hist">'+hist.map(y=>{const t=TOP3[y],ids=t.ids.filter(Boolean);return '<button type="button" class="t3tile" data-py="'+y+'"><span class="t3y">'+y+'</span><span class="t3av">'+
      ids.map(id=>{const b=beanById(id),s=(t.snap||[]).find(x=>x.id===id)||{};return beanPic(b||Object.assign({id,img:true,origin:''},s),'av')}).join('')+'</span><small>'+CROWN+esc(t3name(t,ids[0]))+'</small></button>'}).join('')+'</div>':'');
  hydrateImgs(p)}
/* ---------- The diary: every coffee's story in one timeline ---------- */
function renderDiaryView(){const p=$('bv-diary');if(!p)return;const items=[];
  for(const b of BEANS)for(const it of beanTimeline(b))items.push(Object.assign(it,{bean:b}));items.sort((x,y)=>y.t-x.t);
  const n=items.filter(i=>i.kind==='entry').length,months=new Map();
  for(const it of items.slice(0,150)){const m=new Date(it.t).toLocaleDateString(undefined,{month:'long',year:'numeric'});if(!months.has(m))months.set(m,[]);months.get(m).push(it)}
  p.innerHTML='<div class="diary-h"><div><span class="crown-k">Your coffee diary</span><h3>'+(n?n+' entr'+(n===1?'y':'ies')+' <em>· '+(items.length-n)+' brews</em>':'Every bag has a story')+'</h3>'+
      '<p>'+(BEANS.length?'Opening a bag, the cup that clicked, the last one. Your logged brews join in on their own.':'Add a coffee to the cabinet, then keep its story here.')+'</p></div>'+
      (BEANS.length?'<button type="button" class="crown-btn" id="dy-write">Write</button>':'')+'</div>'+
    (items.length?[...months].map(([m,l])=>'<h4 class="dy-m">'+esc(m)+'</h4>'+timelineHTML(l,true)).join(''):'<div class="bg-empty">'+beanSVG+'<b>Nothing written yet</b><p>Open a coffee and tap <b>Write in its diary</b>, or log a brew with the coffee picked on the dial-in.</p></div>');
  hydrateImgs(p)}
// Write: choose the coffee (open bags first), then its page opens at the diary.
function openDiaryPick(){const d=$('vd'),list=[...BEANS].sort((a,c)=>(c.shelf-a.shelf)||c.tried.localeCompare(a.tried));
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Your diary</span><h2 id="vd-title">Which coffee is this about?</h2></div>'+
    '<div class="vd-body"><div class="t3list">'+list.map(b=>'<button type="button" class="t3opt" data-dypick="'+b.id+'" style="--m:var(--cherry)">'+beanPic(b,'xs')+'<span class="t3o-tx"><b>'+esc(beanTitle(b))+'</b><small>'+esc([b.shelf?'On the shelf':'',b.roaster].filter(Boolean).join(' · '))+'</small></span></button>').join('')+'</div></div>';
  hydrateImgs($('vd-in'));$('vd-in').querySelector('.t3list').onclick=e=>{const o=e.target.closest('[data-dypick]');if(o)openBean(o.dataset.dypick,true)};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}

/* ---------- The passport: a stamp for every origin you've had ---------- */
// Stamps are drawn once with the card's stamp, inked in the origin's colours as on a light card, and kept.
const STAMPS=new Map();
function stampURL(k){if(STAMPS.has(k))return STAMPS.get(k);let u='';
  try{const c=document.createElement('canvas');c.width=c.height=240;const x=c.getContext('2d');BC.F=getComputedStyle(document.body).fontFamily;
    bcStamp(x,120,120,cardStyle(originTheme(k),{mode:'light',col:'origin'}));u=c.toDataURL('image/png')}catch(e){}
  if(u)STAMPS.set(k,u);return u}
function renderPassport(){const p=$('bv-passport');if(!p||BVIEW!=='passport')return;const st=cabStats(),total=Object.keys(ALLO()).length,by={};
  for(const b of BEANS)if(b.origin)(by[b.origin]=by[b.origin]||[]).push(b);
  const first=k=>by[k].map(b=>b.tried).sort()[0],got=Object.keys(by).sort((a,b)=>first(a).localeCompare(first(b)));
  const mon=iso=>new Date(iso+'T12:00').toLocaleDateString(undefined,{month:'short',year:'numeric'});
  const regs=Object.entries(REG).map(([rk,r])=>{const all=Object.keys(ALLO()).filter(k=>ALLO()[k].reg===rk),have=got.filter(k=>(oInfo(k)||{}).reg===rk).length;
    return '<span class="pp-reg"><small>'+esc(r.name.replace(' and Caribbean','').replace(' and Pacific',''))+'</small><span class="pp-rb"><i style="width:'+Math.min(100,have/all.length*100).toFixed(0)+'%;background:'+r.color+'"></i></span><b>'+have+'</b></span>'}).join('');
  // A few origins still to collect, different each day.
  const todo=Object.keys(ALLO()).filter(k=>!by[k]),seed=Math.floor(Date.now()/864e5),next=[];for(let i=0;i<Math.min(6,todo.length);i++)next.push(todo[(seed*7+i*11)%todo.length]);
  const T=TGOT||{},earned=TROPHIES.filter(t=>T[t[0]]).length;
  p.innerHTML='<div class="passport"><div class="pp-h"><span class="pp-k">Coffee passport</span><h3>'+got.length+' <em>of '+total+' origins</em></h3><div class="pp-regs">'+regs+'</div></div>'+
    (got.length?'<div class="pp-grid">'+got.map((k,i)=>'<button type="button" class="pp-st" data-ppo="'+k+'" style="--r:'+(((i*37)%15)-7)+'deg"><img alt="" src="'+stampURL(k)+'"><b>'+esc(originName(k))+'</b><small>'+by[k].length+' bag'+(by[k].length===1?'':'s')+' · since '+mon(first(k))+'</small></button>').join('')+'</div>'
      :'<p class="pp-empty">Your first stamp arrives with your first coffee.</p>')+
    (next.length?'<div class="pp-next"><b>Still to discover</b><div class="chips">'+[...new Set(next)].map(k=>'<button type="button" class="chip" data-o="'+k+'">'+(ALLO()[k].flag||'')+' '+esc(originName(k))+'</button>').join('')+'</div></div>':'')+'</div>'+
    '<h3 class="rh">Trophies <span class="hint">'+earned+' of '+TROPHIES.length+'</span></h3><div class="trophies">'+[...TROPHIES].sort((a,b)=>(!!T[b[0]])-(!!T[a[0]])).map(([id,n,desc,ic,f])=>{const [h,need]=f(st),on=!!T[id];
      return '<div class="tro'+(on?' on':'')+'"><span class="tro-ic" aria-hidden="true">'+ic+'</span><span class="tro-tx"><b>'+n+'</b><small>'+(on?'Earned '+dfmt(Date.parse(T[id]+'T12:00')):esc(desc))+'</small>'+
        (on?'':'<span class="tro-p" aria-label="'+Math.min(h,need)+' of '+need+'"><i style="width:'+Math.min(100,h/need*100).toFixed(0)+'%"></i></span>')+'</span>'+(on?'':'<span class="tro-n">'+Math.min(h,need)+'/'+need+'</span>')+'</div>'}).join('')+'</div>'}

/* Your scans, each one a tap away from the gallery. A scan counts as added when a gallery coffee came from it or has
   the same name and roastery. */
const scanBean=s=>{const n=scanTitle(s.sc,s.info).toLowerCase(),r=(scRoaster(s)||'').toLowerCase();return BEANS.find(b=>b.scan&&b.scan===s.id)||BEANS.find(b=>beanTitle(b).toLowerCase()===n&&(b.roaster||'').toLowerCase()===r)};
function renderBeanScans(){const p=$('bv-scans');if(!p)return;
  p.innerHTML='<div class="scan-cta"><span class="scan-cta-ic">'+SCAN_ICO+'</span><span><b>Scan a bag</b><small>The label is read on your phone and turned into a brew plan.</small></span><button type="button" class="btn" id="bg-scan2">Scan</button></div>'+
    (SCANS.length?'<div class="srows">'+SCANS.map((s,i)=>{const b=scanBean(s);return '<div class="srow"><button type="button" class="srow-main" data-scan="'+i+'" aria-label="Open this scan"><span class="srow-pic">'+(s.t?'<img src="'+s.t+'" alt="">':beanSVG)+'</span>'+
      '<span class="srow-tx"><b>'+esc(scanTitle(s.sc,s.info))+'</b><small>'+esc([scRoaster(s),s.when].filter(Boolean).join(' · '))+'</small></span></button>'+
      (b?'<button type="button" class="srow-in" data-bean="'+b.id+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>In gallery</button>':'<button type="button" class="srow-add" data-scanadd="'+i+'">'+PLUS_ICO+'Add to gallery</button>')+'</div>'}).join('')+'</div>'
     :'<p class="hint" style="margin-top:14px">Bags you scan appear here, ready to add to your gallery.</p>')}
// A saved scan opens the gallery editor with its details and photo (the full photo when kept, else its thumbnail).
async function addScanToGallery(i){const s=SCANS[i];if(!s)return;const inf=s.info,full=await BIMG.get(s.id),photo=full||s.t||null;
  openBeanEditor(null,{name:scanTitle(s.sc,inf),roaster:scRoaster(s)||'',origin:s.sc.origin,process:s.sc.process,variety:s.sc.variety,roast:s.sc.roast,roastDate:s.sc.date||'',
    flavours:inf&&Array.isArray(inf.tasting_notes)?inf.tasting_notes.join(', ').slice(0,160):'',photo,scan:s.id,lowres:!full&&!!s.t})}
$('beans-in').addEventListener('input',e=>{if(e.target.id!=='bg-q')return;BQ=e.target.value;renderGrid()});
$('beans-in').addEventListener('click',e=>{if(e.target.closest('#bg-add')){openBeanEditor();return}if(e.target.closest('#bg-scan,#bg-scan2')){showTab('scan');openCamera();return}
  const v=e.target.closest('[data-view]');if(v){BVIEW=v.dataset.view;renderBeanViews();if(v.classList.contains('tshelf'))$('bg-views').scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'});return}
  if(e.target.closest('#dy-write')){openDiaryPick();return}
  const po=e.target.closest('[data-ppo]');if(po){BQ=originName(po.dataset.ppo);BVIEW='coffees';renderBeanViews();renderCoffees();return}
  const oo=e.target.closest('[data-o]');if(oo){showTab('map');selectOrigin(oo.dataset.o,true);return}
  const py=e.target.closest('[data-py]');if(py){BPOD=+py.dataset.py;renderTop3View();if(py.classList.contains('t3tile'))$('bv-top3').scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'});return}
  const t=e.target.closest('[data-top3]');if(t){openTop3(+t.dataset.top3,+(t.dataset.slot||0));return}
  const sa=e.target.closest('[data-scanadd]');if(sa){addScanToGallery(+sa.dataset.scanadd);return}
  const sc=e.target.closest('[data-scan]');if(sc){openSavedScan(+sc.dataset.scan);return}
  const b=e.target.closest('[data-bean]');if(b)openBean(b.dataset.bean)});

/* ---------- One coffee ---------- */
function beanLogStats(b){const n=b.name.toLowerCase();if(n.length<3)return null;const l=LOG.filter(x=>(x.coffee||'').toLowerCase().includes(n));if(!l.length)return null;
  const r=l.filter(x=>x.rating);return{n:l.length,avg:r.length?r.reduce((s,x)=>s+x.rating,0)/r.length:0}}
// A coffee's page. write: open it at the diary, ready to write.
function openBean(id,write){const b=beanById(id);if(!b)return;const d=$('vd'),rk=beanRank(b),P=b.process&&PROCESSES[b.process],ls=beanLogStats(b),f=b.shelf&&fresh(b);
  const fmt=s=>s?new Date(s+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';
  const kv=[['Origin',b.origin?flagOf(b.origin)+' '+originName(b.origin):''],['Process',P?P.name:''],['Variety',b.variety?vName(b.variety):''],['Roast',b.roast?b.roast[0].toUpperCase()+b.roast.slice(1):''],['Roasted',fmt(b.roastDate)],['Tried',fmt(b.tried)]].filter(x=>x[1]);
  let mom='note';const g=gramsLeft(b),dose=Math.round(beanDose(b));
  $('vd-in').innerHTML='<div class="vd-head" style="--c:'+(rk?MEDAL[rk]:'var(--cherry)')+'"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:'+(rk?MEDAL[rk]:'var(--cherry)')+'"></i>'+(rk?MEDALN[rk]+' · top 3 of '+beanYear(b):b.shelf?'On the shelf':'In the cabinet')+'</span><h2 id="vd-title">'+esc(beanTitle(b))+'</h2>'+(b.roaster?'<p class="vd-sub">'+esc(b.roaster)+'</p>':'')+'</div>'+
    '<div class="vd-body"><div class="bd-hero">'+beanPic(b,'hero')+glassRate(b.rating)+'</div>'+'<div class="bd-rate">'+beanRow(b.rating,'big')+'<span>'+(b.rating?b.rating.toString().replace('.5','½')+' · ':'')+rateWord(b.rating)+'</span></div>'+
    // The bag now: how fresh it is, what's left, and finishing it.
    (b.shelf?'<div class="bd-shelf">'+(f?'<div class="bd-f"><div class="bd-fh"><b>'+f.label+'</b><span>Day '+f.d+' off roast</span></div>'+freshBar(f)+'<p>'+f.tip+'</p></div>':'<p class="hint" style="margin:0">Add the roast date to see how fresh it is.</p>')+
      (g!=null?'<div class="bd-bag">'+bagLine(b)+'<div class="bd-bagb"><button type="button" class="chip" id="bd-cup">Brewed a cup · −'+dose+' g</button><button type="button" class="chip" id="bd-left">Set what’s left</button></div></div>'
        :'<p class="hint" style="margin:8px 0 0">Add the bag size in Edit to see what’s left as you log brews.</p>')+
      '<button type="button" class="btn ghost bd-done" id="bd-done">🏁 Finish the bag</button></div>'
     :'<button type="button" class="linkbtn" id="bd-shelf">Put it back on the shelf</button>')+
    (kv.length?'<div class="specs">'+kv.map(([k,v])=>'<div><b>'+k+'</b><span class="bd-v">'+esc(v)+'</span></div>').join('')+'</div>':'')+
    (b.flavours?'<h3>Tasting notes</h3><div class="chips">'+b.flavours.split(/\s*[,;·]\s*/).filter(Boolean).map(f=>'<span class="chip">'+esc(f)+'</span>').join('')+'</div>':'')+
    (b.notes?'<h3>Your notes</h3><p>'+esc(b.notes)+'</p>':'')+
    '<div class="bd-again"><span>Would you buy it again?</span><div class="seg" id="bd-again"></div></div>'+
    (ls?'<p class="hint">In your brew log: '+ls.n+' brew'+(ls.n===1?'':'s')+(ls.avg?', rated '+ls.avg.toFixed(1)+' on average':'')+'.</p>':'')+
    '<div class="actions"><button class="btn" id="bd-brew">Brew it in the dial-in</button><button class="btn ghost" id="bd-edit">Edit</button><button class="btn ghost" id="bd-share">Share</button></div>'+
    // Its diary: a moment, a few words, the day.
    '<h3 id="bd-dh">Diary</h3><div class="dwrite" id="bd-write"><div class="dmoms" role="group" aria-label="What kind of moment">'+Object.entries(MOMENTS).map(([k,[n,ic]])=>'<button type="button" data-mom="'+k+'" aria-pressed="'+(k===mom)+'"><span aria-hidden="true">'+ic+'</span>'+n+'</button>').join('')+'</div>'+
      '<textarea id="bd-dt" rows="3" maxlength="600" aria-label="Diary entry" placeholder="'+esc(MOMENTS[mom][2])+'"></textarea><div class="dw-row"><input type="date" id="bd-dd" class="dateinp" value="'+todayISO()+'" aria-label="Date"><button type="button" class="btn" id="bd-dadd">Add to the diary</button></div></div>'+
    '<div id="bd-tl">'+timelineHTML(beanTimeline(b),false)+'</div>'+
    '<button type="button" class="linkbtn danger" id="bd-del">Remove from the gallery</button></div>';
  hydrateImgs($('vd-in'));
  const refresh=(msg)=>{saveBeans();checkTrophies();renderBeans();openBean(b.id);if(msg)toast(msg)};
  $('bd-edit').onclick=()=>openBeanEditor(b);
  $('bd-share').onclick=()=>{d.close();openShare(beanDoc(b))};
  $('bd-brew').onclick=()=>{useBean(b);d.close();showTab('dial');
    if(!dialRec()){const t=techList(S.brewer)[0];if(t)S.rec=t[1]}if(dialRec())tune('Tuned for '+beanTitle(b));else{render();toast('Set up for '+beanTitle(b))}};
  // Tapping the chosen answer again clears it.
  const again=()=>seg('bd-again',[['yes','Yes'],['no','No']],()=>b.again,v=>{b.again=b.again===v?'':v;saveBeans();again()});again();
  if($('bd-cup'))$('bd-cup').onclick=()=>{setLeft(b,Math.max(0,(gramsLeft(b)||0)-dose));refresh('Marked a '+dose+' g cup')};
  if($('bd-left'))$('bd-left').onclick=()=>{const v=prompt('How many grams are left in the bag?',String(gramsLeft(b)||''));if(v==null)return;const n=parseFloat(v);if(!isFinite(n)||n<0){toast('Enter the grams left, like 120');return}setLeft(b,n);refresh('Updated')};
  if($('bd-done'))$('bd-done').onclick=()=>{b.shelf=false;if(!b.diary.some(e=>e.k==='last'))b.diary.unshift(okEntry({k:'last',d:todayISO(),t:''}));refresh('Finished: it’s in the cabinet now. Add how it ended in its diary')};
  if($('bd-shelf'))$('bd-shelf').onclick=()=>{b.shelf=true;refresh('Back on the shelf')};
  $('bd-write').onclick=e=>{const m=e.target.closest('[data-mom]');if(!m)return;mom=m.dataset.mom;$('bd-write').querySelectorAll('[data-mom]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.mom===mom));$('bd-dt').placeholder=MOMENTS[mom][2];$('bd-dt').focus()};
  $('bd-dadd').onclick=()=>{const t=$('bd-dt').value.trim();if(!t&&mom==='note'){toast('Write a few words first');$('bd-dt').focus();return}
    const en=okEntry({k:mom,d:$('bd-dd').value||todayISO(),t});b.diary.unshift(en);b.diary.sort((x,y)=>y.d.localeCompare(x.d));
    if(mom==='last')b.shelf=false;if(mom==='opened'&&!b.shelf)b.shelf=true;refresh('Added to the diary');setTimeout(()=>{const h=$('bd-dh');if(h)h.scrollIntoView({block:'start'})},50)};
  $('bd-tl').onclick=e=>{const x=e.target.closest('[data-deldiary]');if(!x||!confirm('Delete this diary entry?'))return;b.diary=b.diary.filter(en=>en.id!==x.dataset.deldiary);refresh('Entry deleted')};
  $('bd-del').onclick=()=>{const inTop=inAnyTop(b.id);
    if(!confirm('Remove “'+beanTitle(b)+'” from your gallery?'+(inTop?' It stays in your top 3 history.':'')))return;
    BEANS=BEANS.filter(x=>x.id!==b.id);saveBeans();if(!inTop)BIMG.del(b.id);d.close();renderBeans();toast('Removed from your gallery')};
  showDlg(d);$('vd-x').onclick=()=>d.close();
  if(write)setTimeout(()=>{const h=$('bd-dh');if(h){h.scrollIntoView({block:'start'});$('bd-dt').focus({preventScroll:true})}},80);else d.scrollTop=0}
function beanDoc(b){const P=b.process&&PROCESSES[b.process];
  return{title:beanTitle(b),sub:(b.roaster?b.roaster+' | ':'')+'Rated '+(b.rating||'–')+' of 5',file:'coffee-'+beanTitle(b),
    card:()=>beanCardImg(b),cardTheme:()=>originTheme(b.origin),cardName:'coffee-card',cardTitle:'Coffee card',cardSub:'This coffee as one image: the bag, your rating in beans, where it’s from and what you tasted.',
    blocks:[{kv:[['Origin',b.origin?originName(b.origin):'-'],['Process',P?P.name:'-'],['Variety',b.variety?vName(b.variety):'-'],['Roast',b.roast||'-']]},...(b.flavours?[{h:'Tasting notes',p:b.flavours}]:[]),...(b.notes?[{h:'Notes',p:b.notes}]:[])]}}

// Brewing a gallery coffee: the dial-in takes its process, variety, roast and age, and remembers which coffee it is.
function useBean(b){S.bean=okSBean({name:beanTitle(b),roaster:b.roaster,origin:b.origin,id:b.id});if(b.process)S.process=b.process;if(b.variety)S.variety=b.variety;if(b.roast)S.roast=b.roast;if(b.roastDate)S.age=daysSince(b.roastDate)}
// Pick the beans for the dial-in from the gallery, most recent first.
function openBeanPick(){const d=$('vd'),list=[...BEANS].sort((a,c)=>c.tried.localeCompare(a.tried)||c.ts-a.ts);
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Your beans</span><h2 id="vd-title">Which coffee are you brewing?</h2><p class="vd-sub">Its process, variety and roast tune the recipe, and it shows on your brew cards.</p></div>'+
    '<div class="vd-body"><div class="t3list">'+list.map(b=>'<button type="button" class="t3opt'+(S.bean&&S.bean.id===b.id?' on':'')+'" data-usebean="'+b.id+'" style="--m:var(--cherry)">'+beanPic(b,'xs')+'<span class="t3o-tx"><b>'+esc(beanTitle(b))+'</b><small>'+esc([b.roaster,b.origin?originName(b.origin):''].filter(Boolean).join(' · '))+'</small>'+beanRow(b.rating,'sm')+'</span></button>').join('')+'</div></div>';
  hydrateImgs($('vd-in'));$('vd-in').querySelector('.t3list').onclick=e=>{const o=e.target.closest('[data-usebean]');if(!o)return;const b=beanById(o.dataset.usebean);if(!b)return;useBean(b);d.close();
    if(dialRec())tune('Brewing '+beanTitle(b));else{render();toast('Brewing '+beanTitle(b))}};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}
document.addEventListener('click',e=>{if(e.target.closest('#d-bean [data-dbpick]')){openBeanPick();return}if(e.target.closest('#d-bean [data-dbclear]')){S.bean=null;render()}});

/* ---------- Adding and editing ---------- */
// pre: details to start from (a scan); its photo comes as a data URL in pre.photo.
function openBeanEditor(b,pre){const isNew=!b;const B=Object.assign({name:'',roaster:'',origin:'',process:'',variety:'',roast:'',roastDate:'',tried:todayISO(),rating:0,flavours:'',notes:'',img:false,shelf:true,bag:0},b||{},pre||{});
  let photo=null,photoChanged=false,rating=B.rating;const d=$('vd');
  const opt=(h,none)=>'<option value="">'+none+'</option>'+h;
  const roasters=[...new Set([...BEANS.map(x=>x.roaster),...SCANS.map(scRoaster)].filter(Boolean))].sort();
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Bean gallery</span><h2 id="vd-title">'+(isNew?'Add a coffee':'Edit '+esc(beanTitle(B)))+'</h2></div>'+
   '<div class="vd-body beform"><div class="be-photo" id="be-photo"><span class="bph">'+beanSVG+'<small>Add a photo of the bag</small></span></div>'+
   '<div class="actions two-up"><button type="button" class="btn ghost" id="be-cam">Take a photo</button><button type="button" class="btn ghost" id="be-pick">Choose a photo</button></div>'+
   '<input type="file" id="be-camf" accept="image/*" capture="environment" hidden><input type="file" id="be-file" accept="image/*" hidden>'+
   '<div class="field"><div class="lbl">Your rating</div><div class="beanrate" id="be-rate"></div></div>'+
   '<div class="two stackm"><div class="field"><label for="be-name">Coffee name</label><input id="be-name" maxlength="60" value="'+esc(B.name)+'" placeholder="e.g. El Diviso Pink Bourbon" autocomplete="off"></div>'+
   '<div class="field"><label for="be-roaster">Roastery</label><input id="be-roaster" maxlength="50" value="'+esc(B.roaster)+'" list="be-roasters" placeholder="e.g. Archers" autocomplete="off"><datalist id="be-roasters">'+roasters.map(r=>'<option value="'+esc(r)+'">').join('')+'</datalist></div></div>'+
   '<div class="field"><label for="be-origin">Origin</label><select id="be-origin">'+opt(originOptions(),'Not sure')+'</select></div>'+
   '<div class="two stackm"><div class="field"><label for="be-process">Process</label><select id="be-process">'+opt(processOptions(),'Not sure')+'</select></div>'+
   '<div class="field"><label for="be-variety">Variety</label><select id="be-variety">'+opt(varietyOptions(),'Not sure')+'</select></div></div>'+
   '<div class="field"><div class="lbl">Roast</div><div class="seg" id="be-roast"></div></div>'+
   '<div class="two"><div class="field"><label for="be-rdate">Roasted on</label><input type="date" id="be-rdate" class="dateinp" value="'+B.roastDate+'"></div><div class="field"><label for="be-tried">Tried on</label><input type="date" id="be-tried" class="dateinp" value="'+B.tried+'"></div></div>'+
   '<div class="two"><div class="field"><label for="be-bag">Bag size <span class="hint">grams</span></label><input id="be-bag" type="number" inputmode="numeric" min="0" max="5000" step="1" value="'+(B.bag||'')+'" placeholder="e.g. 250"></div>'+
   '<div class="field"><div class="lbl">On the shelf</div><div class="seg" id="be-shelf"></div></div></div>'+
   '<div class="field"><label for="be-fl">Tasting notes <span class="hint">separate with commas</span></label><input id="be-fl" maxlength="160" value="'+esc(B.flavours)+'" placeholder="e.g. jasmine, peach, honey"></div>'+
   '<div class="field"><label for="be-notes">Your notes</label><textarea id="be-notes" rows="3" maxlength="600" placeholder="How you brewed it, what you loved, would you buy it again?">'+esc(B.notes)+'</textarea></div>'+
   '<div class="actions"><button class="btn" id="be-save">'+(isNew?'Add to the gallery':'Save changes')+'</button><button class="btn ghost" id="be-cancel">Cancel</button></div></div>';
  for(const [id,k] of [['be-origin','origin'],['be-process','process'],['be-variety','variety']])$(id).value=B[k];
  // Tapping the chosen roast again clears it: not every bag says.
  const roastSeg=()=>seg('be-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>B.roast,v=>{B.roast=B.roast===v?'':v;roastSeg()});roastSeg();
  beanRateInput('be-rate',()=>rating,v=>rating=v);
  // On the shelf: a bag you're drinking now. Off it, the coffee is finished and lives in the cabinet.
  const shelfSeg=()=>seg('be-shelf',[['1','Drinking it'],['0','Finished']],()=>B.shelf?'1':'0',v=>{B.shelf=v==='1';shelfSeg()});shelfSeg();
  const showPhoto=u=>{const p=$('be-photo');p.classList.toggle('has',!!u);p.querySelector('img')?.remove();if(u){const i=new Image();i.alt='Photo of the coffee';i.src=u;p.prepend(i)}
    let rm=$('be-rm');if(u&&!rm){p.insertAdjacentHTML('beforeend','<button type="button" class="be-rm" id="be-rm" aria-label="Remove the photo">✕</button>');$('be-rm').onclick=e=>{e.stopPropagation();photo=null;photoChanged=true;showPhoto(null)}}else if(!u&&rm)rm.remove()};
  if(pre&&pre.photo){photo=pre.photo;photoChanged=true;showPhoto(photo);
    // Scans from before photos were kept only have a small thumbnail.
    if(pre.lowres)$('be-photo').insertAdjacentHTML('afterend','<p class="hint be-low">This older scan kept only a small photo. Take or choose a new one for a sharper card.</p>')}else if(B.img&&b)BIMG.get(b.id).then(u=>{if(u&&!photoChanged){photo=u;showPhoto(u)}});
  const take=async f=>{if(!f)return;try{photo=await shrinkPhoto(await fileURL(f),900);photoChanged=true;showPhoto(photo);document.querySelector('.be-low')?.remove()}catch(e){toast('Couldn’t open that photo')}};
  $('be-cam').onclick=()=>$('be-camf').click();$('be-pick').onclick=$('be-photo').onclick=e=>{if(e.target.closest('#be-rm'))return;$('be-file').click()};
  $('be-camf').onchange=$('be-file').onchange=e=>{const f=e.target.files[0];e.target.value='';take(f)};
  $('be-cancel').onclick=()=>d.close();
  $('be-save').onclick=async()=>{const n=okBean({id:b?b.id:uid().replace(/[^a-z0-9]/g,'').slice(0,20),name:$('be-name').value,roaster:$('be-roaster').value,origin:$('be-origin').value,process:$('be-process').value,variety:$('be-variety').value,
      roast:B.roast,roastDate:$('be-rdate').value,tried:$('be-tried').value||todayISO(),rating,flavours:$('be-fl').value,notes:$('be-notes').value,img:photoChanged?!!photo:B.img,scan:B.scan||'',ts:b?b.ts:Date.now(),
      shelf:B.shelf,bag:$('be-bag').value,left:b?b.left:null,leftAt:b?b.leftAt:0,again:b?b.again:'',diary:b?b.diary:[]});
    if(!n.name&&!n.origin&&!photo){toast('Add a name, an origin or a photo first');$('be-name').focus();return}
    let note='';if(photoChanged){if(photo){if(!await BIMG.put(n.id,photo)){n.img=false;note=', but the photo couldn’t be saved on this device'}}else if(!inAnyTop(n.id))BIMG.del(n.id)}
    // Moved to another year: it leaves the old year's top 3, where it no longer belongs.
    if(b&&beanYear(b)!==beanYear(n)){const t=TOP3[beanYear(b)],k=t?t.ids.indexOf(n.id):-1;if(k>=0){t.ids[k]='';t.snap=(t.snap||[]).filter(x=>x.id!==n.id);if(!t3has(t))delete TOP3[beanYear(b)];note+='. It left the top 3 of '+beanYear(b)}}
    const i=BEANS.findIndex(x=>x.id===n.id);if(i>=0)BEANS[i]=n;else BEANS.unshift(n);if(!saveBeans())return;
    // A crowned coffee keeps its podium snapshot up to date.
    for(const t of Object.values(TOP3)){const s=(t.snap||[]).find(x=>x.id===n.id);if(s)Object.assign(s,{name:beanTitle(n),roaster:n.roaster,origin:n.origin,rating:n.rating})}saveTop3();
    d.close();if(isNew)BVIEW='coffees';if(!$('beans').classList.contains('on'))showTab('beans');checkTrophies();renderBeans();toast((isNew?'Added to your gallery':'Saved')+note)};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}

/* ---------- Top 3 of the year ---------- */
// Three places across the top: pick a place, then the coffee for it. A coffee already on the podium swaps places.
function openTop3(y,start){const d=$('vd'),pool=BEANS.filter(b=>beanYear(b)===y).sort((a,b)=>b.rating-a.rating||b.tried.localeCompare(a.tried));
  const was=TOP3[y]?TOP3[y].ids:['','',''];let slots=was.map(id=>pool.some(b=>b.id===id)?id:''),act=start>=0&&start<3?start:0;
  const nextOpen=from=>{for(let k=1;k<=3;k++){const j=(from+k)%3;if(!slots[j])return j}return from};
  const draw=()=>{$('t3-slots').innerHTML=[0,1,2].map(i=>{const b=slots[i]&&beanById(slots[i]);return '<div class="t3slot'+(i===act?' act':'')+(b?' full':'')+'" style="--m:'+MEDAL[i+1]+'"><button type="button" class="t3s-main" data-sl="'+i+'" aria-pressed="'+(i===act)+'">'+
      '<span class="t3s-pic">'+(b?beanPic(b,'xs'):'<span class="t3s-n">'+(i+1)+'</span>')+'</span><span class="t3s-tx"><small>'+MEDALN[i+1]+'</small><b>'+(b?esc(beanTitle(b)):'Open')+'</b></span></button>'+(b?'<button type="button" class="t3s-x" data-unset="'+i+'" aria-label="Clear '+MEDALN[i+1]+'">✕</button>':'')+'</div>'}).join('');
    $('t3-list').innerHTML=pool.map(b=>{const r=slots.indexOf(b.id)+1;return '<button type="button" class="t3opt'+(r?' on':'')+'" data-t3="'+b.id+'" aria-pressed="'+!!r+'" style="--m:'+(MEDAL[r]||'var(--line)')+'">'+beanPic(b,'xs')+
      '<span class="t3o-tx"><b>'+esc(beanTitle(b))+'</b><small>'+esc(b.roaster||'')+'</small>'+beanRow(b.rating,'sm')+'</span><span class="t3o-r">'+(r?r:'')+'</span></button>'}).join('');
    $('t3-msg').innerHTML='Choose your <b style="color:'+MEDAL[act+1]+'">'+MEDALN[act+1].toLowerCase()+'</b> coffee'+(slots[act]?', or tap it again to clear the place.':'.');
    hydrateImgs($('t3-slots'));hydrateImgs($('t3-list'))};
  $('vd-in').innerHTML='<div class="vd-head" style="--c:'+MEDAL[1]+'"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:'+MEDAL[1]+'"></i>Top 3 of '+y+'</span><h2 id="vd-title">Crown your favourites</h2>'+
    '<div class="t3slots" id="t3-slots"></div><p class="vd-sub" id="t3-msg"></p></div>'+
    '<div class="vd-body"><div class="t3list" id="t3-list"></div><div class="actions"><button class="btn" id="t3-save">Save my top 3</button><button class="btn ghost" id="t3-clear">Clear all</button></div></div>';
  $('t3-slots').onclick=e=>{const x=e.target.closest('[data-unset]');if(x){slots[+x.dataset.unset]='';act=+x.dataset.unset;draw();return}const s=e.target.closest('[data-sl]');if(s){act=+s.dataset.sl;draw()}};
  $('t3-list').onclick=e=>{const o=e.target.closest('[data-t3]');if(!o)return;const id=o.dataset.t3,at=slots.indexOf(id);
    if(at===act)slots[act]='';else{if(at>=0)slots[at]=slots[act];slots[act]=id;act=nextOpen(act)}draw()};
  $('t3-clear').onclick=()=>{slots=['','',''];act=0;draw()};
  $('t3-save').onclick=()=>{if(slots.some(Boolean))TOP3[y]={ids:slots.slice(),snap:slots.filter(Boolean).map(id=>{const b=beanById(id);return{id,name:beanTitle(b),roaster:b.roaster,origin:b.origin,rating:b.rating}}),at:Date.now()};else delete TOP3[y];
    saveTop3();d.close();BPOD=y;BVIEW='top3';checkTrophies();renderBeans();toast(slots.some(Boolean)?'Top 3 of '+y+' saved':'Top 3 of '+y+' cleared')};
  draw();showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}
// The app may have opened on the Beans page before this part loaded.
window.BEANS_OK=1;checkTrophies();renderDBean();if($('beans').classList.contains('on'))renderBeans();
