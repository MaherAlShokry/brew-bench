/* ================= BEAN GALLERY ================= */
// Every coffee you've had, with a photo and a rating in beans. Each year you can crown a top 3, and past years stay
// as your history. It is the Beans tab, with Scan as a page inside it: scanning is how most beans arrive.

// Photos are too big for localStorage, so they live in IndexedDB, keyed by the bean's id. A small cache keeps
// scrolling the gallery from reading the same photo twice.
const BIMG=(()=>{let dbp=null;const cache=new Map();
  const db=()=>dbp||(dbp=new Promise((ok,no)=>{try{const r=indexedDB.open('bb-images',1);r.onupgradeneeded=()=>r.result.createObjectStore('img');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}}));
  const tx=(mode,fn)=>db().then(d=>new Promise((ok,no)=>{const t=d.transaction('img',mode),r=fn(t.objectStore('img'));t.oncomplete=()=>ok(r&&r.result);t.onerror=t.onabort=()=>no(t.error)}));
  const get=id=>cache.has(id)?Promise.resolve(cache.get(id)):tx('readonly',s=>s.get(id)).then(v=>{if(typeof v==='string')cache.set(id,v);return v||null}).catch(()=>null);
  // Lists show a small copy (360px) of each photo, made once from the full one and kept beside it: decoding a full
  // photo for every row is what made long lists slow on a phone.
  const T=id=>id+'#t';
  const thumb=id=>{const k=T(id);if(cache.has(k))return Promise.resolve(cache.get(k));
    return get(k).then(v=>v||get(id).then(full=>full?shrinkPhoto(full,360).then(t=>{cache.set(k,t);tx('readwrite',s=>s.put(t,k)).catch(()=>{});return t}).catch(()=>full):null))};
  return{peek:id=>cache.get(id),peekThumb:id=>cache.get(T(id)),get,thumb,
    put:(id,v)=>{cache.set(id,v);cache.delete(T(id));return tx('readwrite',s=>{s.delete(T(id));return s.put(v,id)}).then(()=>true).catch(()=>false)},
    del:id=>{cache.delete(id);cache.delete(T(id));return tx('readwrite',s=>{s.delete(T(id));return s.delete(id)}).then(()=>true).catch(()=>false)},
    // Every photo, for the backup file.
    all:()=>db().then(d=>new Promise(ok=>{const t=d.transaction('img','readonly'),s=t.objectStore('img'),k=s.getAllKeys(),v=s.getAll();
      t.oncomplete=()=>ok(Object.fromEntries(k.result.map((x,i)=>[x,v.result[i]]).filter(([x,u])=>typeof u==='string'&&!/#t$/.test(x))));t.onerror=()=>ok({})})).catch(()=>({})),
    clear:()=>{cache.clear();return tx('readwrite',s=>s.clear()).catch(()=>{})}}})();

const ISO_D=/^\d{4}-\d{2}-\d{2}$/;
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
// Saved beans are checked on the way in: a backup or an old version can't put anything odd on the page.
const BID=/^[a-z0-9]{4,24}$/;
// Days from an ISO date to today (negative for a date still to come).
// The day a coffee joined the gallery, from its timestamp.
const tsISO=t=>{const d=new Date(+t||Date.now());return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
// A coffee's place in time: the day you tried it or, for a bag you haven't opened yet, the day you added it.
const beanDay=b=>b.tried||tsISO(b.ts);
const daysAgo=iso=>Math.round((Date.parse(todayISO()+'T12:00')-Date.parse(iso+'T12:00'))/864e5);
// Diary moments: what kind of entry it is, with its mark and a prompt to start from.
const MOMENTS={opened:['Opened the bag','📦','First impressions: the smell of the bag, the dry grounds…'],note:['Note','✍️','What did you notice in the cup today?'],
  dial:['Dialled in','🎯','The recipe and grind that finally clicked…'],best:['Best cup','🏆','What made this one special?'],shared:['Shared it','🤝','Who did you brew it for, and what did they think?'],
  last:['Last cup','🏁','How it ended, and would you buy it again?']};
const okEntry=e=>{if(!e||typeof e!=='object')return null;const k=MOMENTS[e.k]?e.k:'note',t=str(e.t,600),ph=e.ph===true;if(!t&&k==='note'&&!ph)return null;
  return{id:typeof e.id==='string'&&BID.test(e.id)?e.id:uid().replace(/[^a-z0-9]/g,'').slice(0,20),d:ISO_D.test(e.d)?e.d:todayISO(),k,t,...(ph?{ph}:{})}};
const gramsOrNull=v=>v==null||v===''||!isFinite(+v)?null:Math.round(clamp(+v,0,5000));
const okVar=v=>VBY[String(v||'').split(':')[0]]?String(v):'';
// A coffee's varieties: the first, then up to three more for a blend or a mixed lot. Duplicates and unknowns drop out.
const okVars=b=>{const l=[...new Set([okVar(b.variety),...(Array.isArray(b.vars)?b.vars.map(okVar):[])].filter(Boolean))];return l.slice(0,4)};
function okBean(b){if(!b||typeof b!=='object'||typeof b.id!=='string'||!BID.test(b.id))return null;
  const vl=okVars(b),r=Math.round(clamp(+b.rating||0,0,5)*2)/2,tried=ISO_D.test(b.tried)?b.tried:'',ts=+b.ts||Date.now();
  return{id:b.id,name:str(b.name,60),roaster:str(b.roaster,50),origin:okOrigin(b.origin),...(b.origin==='blend'?{blend:okBlend(b.blend)}:{}),process:PROCESSES[b.process]?b.process:'',
    variety:vl[0]||'',...(vl.length>1?{vars:vl.slice(1)}:{}),roast:['light','medium','dark'].includes(b.roast)?b.roast:'',
    roastDate:ISO_D.test(b.roastDate)?b.roastDate:'',tried,rating:r,flavours:str(b.flavours,300),notes:str(b.notes,600),
    img:!!b.img,scan:typeof b.scan==='string'&&BID.test(b.scan)?b.scan:'',ts,
    // On the shelf: a bag you're drinking now. Coffees saved before shelves existed are on it if tried in the last month.
    shelf:typeof b.shelf==='boolean'?b.shelf:daysAgo(tried||tsISO(ts))<=30,
    // The bag: its size, and what was left when you last said so (brews logged since then are taken off).
    bag:gramsOrNull(b.bag)||0,left:gramsOrNull(b.left),leftAt:+b.leftAt||0,again:b.again==='yes'||b.again==='no'?b.again:'',
    diary:(Array.isArray(b.diary)?b.diary:[]).map(okEntry).filter(Boolean).sort((x,y)=>y.d.localeCompare(x.d)).slice(0,80),
    // Cups brewed with the dial-in's timer: each comes off the bag, unless a logged brew already counts it.
    cups:(Array.isArray(b.cups)?b.cups:[]).filter(c=>c&&typeof c.id==='string'&&BID.test(c.id)&&+c.ts>0&&+c.g>0&&+c.g<=200).map(c=>({id:c.id,ts:+c.ts,g:+c.g})).slice(-60),
    // Earlier bags of the same coffee, kept when you buy it again: roast date, size, and when it was opened and finished.
    // Bags bought before the app, so the count of times you've bought it can start where it really is.
    prior:Math.max(0,Math.min(99,Math.round(+b.prior||0))),
    // A door of an advent calendar: which box, and which day.
    ...(b.cal&&typeof b.cal.id==='string'&&BID.test(b.cal.id)&&+b.cal.d>=1&&+b.cal.d<=31?{cal:{id:b.cal.id,d:Math.round(+b.cal.d)}}:{}),
    bags:(Array.isArray(b.bags)?b.bags:[]).filter(x=>x&&typeof x.id==='string'&&BID.test(x.id)).map(x=>({id:x.id,rd:ISO_D.test(x.rd)?x.rd:'',g:gramsOrNull(x.g)||0,on:ISO_D.test(x.on)?x.on:'',off:ISO_D.test(x.off)?x.off:''})).slice(-40)}}
// How many times you've bought a coffee: this bag and every earlier one.
const buys=b=>1+((b&&b.bags)||[]).length+((b&&b.prior)||0);
// The first day you had this coffee: earlier bags count too.
const beanFirst=b=>[beanDay(b),...((b&&b.bags)||[]).map(x=>x.on)].filter(Boolean).sort()[0];
// Bought it again (a "last" entry from an earlier bag doesn't close this one): the bag you finished goes into the coffee's history, and the new one starts fresh on the shelf with
// its own roast date and size. Ratings, notes, the diary and every brew stay as they are.
function rebuyBean(b,rd,g){const opened=b.diary.find(e=>e.k==='opened'),last=b.diary.find(e=>e.k==='last');
  b.bags=[...(b.bags||[]),{id:uid(),rd:b.roastDate||'',g:b.bag||0,on:opened?opened.d:(b.tried||tsISO(b.ts)),off:last&&(!opened||last.d>=opened.d)?last.d:todayISO()}].slice(-40);
  b.roastDate=rd||'';if(g>0)b.bag=g;setLeft(b,b.bag||null);b.shelf=true;b.again='yes';
  b.diary.unshift(okEntry({k:'opened',d:todayISO(),t:'Bought it again'+(buys(b)>2?' ('+ordinal(buys(b))+' bag)':'')}));saveBeans()}
const fmtD=s=>s?new Date(s+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';
const ordinal=n=>n+(n%100>10&&n%100<14?'th':['th','st','nd','rd'][n%10]||'th');
let BEANS=load('bb-beans',[]);BEANS=Array.isArray(BEANS)?BEANS.map(okBean).filter(Boolean):[];
// Top 3 per year: three places (gold, silver, bronze), each a bean id or '' while open, plus a snapshot so a podium
// survives the bean being deleted later.
let TOP3=(t=>{const o={};if(t&&typeof t==='object')for(const [y,v] of Object.entries(t))if(/^\d{4}$/.test(y)&&v&&Array.isArray(v.ids)){
  // Five places (a podium of three, then 4th and 5th) and up to ten honourable mentions. Older saves had three places.
  const ids=[0,1,2,3,4].map(i=>typeof v.ids[i]==='string'&&BID.test(v.ids[i])&&v.ids.indexOf(v.ids[i])===i?v.ids[i]:'');
  const hm=[...new Set((Array.isArray(v.hm)?v.hm:[]).filter(id=>typeof id==='string'&&BID.test(id)&&!ids.includes(id)))].slice(0,10);if(!ids.some(Boolean)&&!hm.length)continue;
  o[y]={ids,hm,snap:(Array.isArray(v.snap)?v.snap:[]).filter(s=>s&&BID.test(s.id)).slice(0,15).map(s=>({id:s.id,name:str(s&&s.name,60),roaster:str(s&&s.roaster,50),origin:okOrigin(s&&s.origin),rating:clamp(+(s&&s.rating)||0,0,5)})),at:+v.at||0}}return o})(load('bb-top3',{}));
const t3has=t=>!!t&&(t.ids.some(Boolean)||(t.hm||[]).length>0);
let BQ='',BSORT=vwGet('bsort','recent',v=>['recent','rated','roaster','origin'].includes(v)),BYEAR=vwGet('byear',[],vwStrs).map(String),BF=vwGet('bf',[],vwStrs),BPOD=null,BVIEW='coffees';
// A coffee shows when it fits any of the picked filters and any of the picked years (none picked: all).
const bfAny=b=>!BF.length||BF.some(f=>bfKeep(b,f));
// Cards slide in the first time you see them, not every time the list is sorted or searched.
const BSEEN=new Set();
function saveBeans(){try{localStorage.setItem('bb-beans',JSON.stringify(BEANS));BREV++;reschedule();return true}catch(e){toast('Couldn’t save: this device’s storage is full');return false}}
const saveTop3=()=>{BREV++;save('bb-top3',TOP3)};
// Changes to the gallery, the log or the scans; opening the tab again with none of them redraws nothing.
let BREV=0,BSIG='';
// What the Beans page shows depends on: your coffees, every change to the brew log (not just new brews), scans, the
// day, trophies and who you are (your brews are the ones under your name).
const beansSig=()=>[BREV,LOGV,LOG.length,SCANS.length,todayISO(),Object.keys(TGOT||{}).length,typeof ME==='string'?ME:''].join('|');
// Every cup you made: brews in your log, plus cups finished with the dial-in's timer that weren't logged. `year` keeps
// it to one year. Each comes with its grams of coffee.
function myCups(year){const inY=ts=>!year||new Date(ts).getFullYear()===year;const used=new Set(LOG.map(l=>l&&l.cup).filter(Boolean));
  const out=LOG.filter(l=>isMine(l)&&inY(brewTs(l))).map(l=>({ts:brewTs(l),g:brewDose(l),log:l}));
  for(const b of BEANS)for(const c of (b.cups||[]))if(!used.has(c.id)&&inY(c.ts))out.push({ts:c.ts,g:c.g,bean:b});return out}
function renderBeansIfChanged(){const s=beansSig();if(s===BSIG&&$('beans-in').firstChild)return;renderBeans()}
const beanYear=b=>+beanDay(b).slice(0,4);
const beanById=id=>BEANS.find(b=>b.id===id);
// Every variety of a coffee, and their names read as a list ("Bourbon & Typica", "Caturra, Castillo & Colombia").
const beanVars=b=>[b.variety,...(b.vars||[])].filter(Boolean);
const varsName=b=>{const n=beanVars(b).map(v=>shortName(vName(v)));return n.length<3?n.join(' & '):n.slice(0,-1).join(', ')+' & '+n[n.length-1]};
const beanTitle=b=>b.name||(b.origin?originName(b.origin)+(b.variety?' '+vName(b.variety):''):'Unnamed coffee');
const flagOf=k=>(oInfo(k)||{}).flag||'';
// Blends: the parts, their flags side by side (or the globe when the parts aren't known), and the origin as words.
const isBlend=b=>!!b&&b.origin==='blend';
const blendParts=b=>isBlend(b)&&Array.isArray(b.blend)?b.blend:[];
const beanFlags=b=>{const p=blendParts(b);return p.length?[...new Set(p.map(x=>flagOf(x.o)))].join(''):flagOf(b&&b.origin)};
// Short: "Blend" or "Ethiopia". Long: "Brazil (Cerrado), Ethiopia (Guji)" for a blend's parts.
const beanOrigin=(b,long)=>{const p=blendParts(b);if(long&&p.length)return p.map(x=>originName(x.o)+(x.r?' ('+x.r+')':'')).join(', ');return b&&b.origin?originName(b.origin):''};
// The place a bean holds in its year's top 3 (1, 2 or 3), or 0.
const beanRank=b=>{const t=TOP3[beanYear(b)];return t?t.ids.indexOf(b.id)+1:0};
// Up to three honourable mentions a year. A year saved with more (from before the limit) keeps them, but shows its first three.
const HM_MAX=3,hmOf=t=>(t&&t.hm||[]).slice(0,HM_MAX);
const beanMention=b=>{const t=TOP3[beanYear(b)];return !!t&&hmOf(t).includes(b.id)};
const inAnyTop=id=>Object.values(TOP3).some(t=>t.ids.includes(id)||(t.hm||[]).includes(id));
const SH_ICO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 12v8h14v-8"/></svg>';
const MEDAL=['','#C9964A','#A49C92','#A8673F','#7F8E97','#8C7B6B'],MEDALN=['','Gold','Silver','Bronze','4th','5th'];
// How a place reads: "Gold · top 3 of 2026", "4th · top 5 of 2026".
const placeLine=(rk,y)=>MEDALN[rk]+' · top '+(rk<=3?3:5)+' of '+y;

/* ---------- On the shelf: freshness and what's left in the bag ---------- */
// The brews you logged from the dial-in with this coffee picked (yours only, in a shared log).
const beanBrews=b=>LOG.filter(l=>l&&((l.snap&&l.snap.bean&&l.snap.bean.id===b.id)||l.beanId===b.id)&&isMine(l));
// Grams left: what you last said was left (or the full bag), less every brew logged since. null when the bag size isn't known.
// The coffee a brew used: from the dial-in's snapshot, or read from the settings line of a brew logged by hand.
function brewDose(l){const d=l&&l.snap&&+l.snap.dose;if(d>0)return d;const q=typeof parseSettings==='function'?parseSettings(l&&l.settings||''):{};return q.dose>0?q.dose:0}
function gramsLeft(b){const base=b.left!=null?b.left:b.bag;if(!base&&b.left==null)return null;const since=b.left!=null?b.leftAt:b.ts;
  const logged=beanBrews(b).filter(l=>(+l.ts||0)>since),used=new Set(LOG.map(l=>l&&l.cup).filter(Boolean));
  return Math.max(0,Math.round(base-logged.reduce((s,l)=>s+brewDose(l),0)-(b.cups||[]).filter(c=>c.ts>since&&!used.has(c.id)).reduce((s,c)=>s+c.g,0)))}
// A cup brewed with the timer, from the dial-in with this coffee picked: taken off the bag now. Returns its id, so a
// brew logged straight after can say it is the same cup and the bag isn't charged twice.
function takeCup(b,g){if(!b||!(g>0))return null;const c={id:uid(),ts:Date.now(),g:Math.round(g*10)/10};b.cups=[...(b.cups||[]),c].slice(-60);saveBeans();return c.id}
function untakeCup(b,id){if(!b)return;b.cups=(b.cups||[]).filter(c=>c.id!==id);saveBeans()}
const beanDose=b=>{const d=beanBrews(b).map(brewDose).filter(v=>v>0);return d.length?d[0]:(+S.dose||15)};
const cupsLeft=b=>{const g=gramsLeft(b);return g==null?null:Math.floor(g/beanDose(b))};
// Where a bag is in its life, from the roast date: resting (still degassing), at its peak, still lovely, then fading.
const FRESH={rest:['Resting','Give it a few more days: fresh coffee is gassy and brews uneven.'],peak:['At its peak','Brew it now: these are its best weeks.'],
  good:['Still lovely','Past its peak but still sweet. A touch finer if it tastes flat.'],fade:['Fading','Getting tired: grind finer and brew a little hotter to wake it up.']};
// The stretches follow the roast. A light roast is dense and lets its gas out slowly: it tastes muted in its first
// week, is at its best from about day 7 to 30 and stays good for two months. A dark roast is ready in two or three
// days and fades after about a month. A medium roast sits between: resting to day 3, at its peak 4 to 21, still lovely
// to 45. Each is [peak from, peak to, still lovely to]. A bag whose roast isn't set is treated as light, as most
// specialty coffee is.
const FWIN={light:[7,30,60],medium:[4,21,45],dark:[3,14,30]};
// Then the bean itself moves the window by a few days. Dense beans (grown high, or a dense variety such as Geisha,
// the SL types or Ethiopian and Yemeni landraces) let their gas out more slowly: a longer rest and a longer peak. Soft,
// low-grown or large beans (Maragogype, Pacamara) are ready sooner and tire sooner. Naturals, honeys and fermented
// coffees keep their fruit for less long; decaf stales fastest. Brewed mostly as espresso, a coffee wants about five
// more days of rest. And once the bag is open (an "Opened the bag" diary entry) it ages faster: its peak and its
// still-lovely stretch end a few weeks after opening, whatever the roast date says.
const F_DENSE_V=new Set(['geisha','sl28','sl34','sl14','landrace','jarc','kurume','dega','wolisho','wushwush','yemenia','udaini','dawairi','tufahi','jaadi','mokka']),
  F_SOFT_V=new Set(['maragogype','pacamara','maracaturra']),
  F_FRUIT_P=new Set(['natural','pulpednatural','honey','redhoney','blackhoney','hydrohoney','anaerobic','anaerobicnatural','anaerobicwashed','anaerobichoney','doubleanaerobic','carbonic','alchemy','lactic','yeast','koji','extended','thermalshock','mossto','supernatural','coldferment','nitro','raisin','coferment','infused','barrelaged']),
  F_DECAF_P=new Set(['swisswater','sugarcane','mountainwater','mcdecaf']),F_OPEN={light:[21,35],medium:[14,28],dark:[10,21]};
// How high the origin grows: the middle of its altitude range ("1,500 to 2,300 m"), or 0 when it isn't given in metres.
const altOf=k=>{const o=k&&oInfo(k),a=o&&o.alt;if(!a)return 0;if(/low/i.test(a))return 900;const n=(a.match(/\d[\d,]*/g)||[]).map(x=>+x.replace(/,/g,'')).filter(x=>x>=100);return n.length?(Math.min(...n)+Math.max(...n))/2:0};
const vBase=v=>String(v||'').split(':')[0];
function freshWin(b){const w=(FWIN[b&&b.roast]||FWIN.light).slice(),why=[];if(!b)return{w,why};
  const vs=[b.variety,...(b.vars||[])].map(vBase).filter(Boolean),alt=isBlend(b)?(a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0)(blendParts(b).map(x=>altOf(x.o)).filter(Boolean)):altOf(b.origin);
  const dense=vs.some(v=>F_DENSE_V.has(v))||alt>=1700,soft=!dense&&(vs.some(v=>F_SOFT_V.has(v))||(alt&&alt<1200));
  if(dense){w[0]+=2;w[1]+=3;w[2]+=5;why.push(vs.some(v=>F_DENSE_V.has(v))?'dense bean':'high-grown')}
  else if(soft){w[0]=Math.max(2,w[0]-1);w[1]-=3;w[2]-=5;why.push(alt&&alt<1200?'low-grown':'large, soft bean')}
  if(F_DECAF_P.has(b.process)){w[0]=Math.max(2,w[0]-1);w[1]=Math.round(w[1]*.75);w[2]=Math.round(w[2]*.7);why.push('decaf')}
  else if(F_FRUIT_P.has(b.process)){w[1]=Math.round(w[1]*.9);w[2]=Math.round(w[2]*.8);why.push(/honey/.test(b.process)?'honey':b.process==='natural'||b.process==='pulpednatural'?'natural':'fermented')}
  // Brewed mostly as espresso (half the brews or more, of at least two): espresso wants a longer rest.
  const br=typeof LOG!=='undefined'?beanBrews(b):[],esp=br.filter(l=>CANONB((l.snap&&l.snap.b)||l.brewer||'')==='espresso').length;
  if(br.length>=2&&esp*2>=br.length){w[0]+=5;w[1]+=5;w[2]+=5;why.push('espresso')}
  // Opened: the bag's clock runs faster from then on.
  const op=b.roastDate&&(b.diary||[]).filter(e=>e.k==='opened'&&e.d>=b.roastDate).map(e=>e.d).sort().pop();
  if(op){const od=Math.round((Date.parse(op+'T12:00')-Date.parse(b.roastDate+'T12:00'))/864e5),cap=F_OPEN[b.roast]||F_OPEN.light;
    const p2=Math.min(w[1],od+cap[0]),g2=Math.min(w[2],od+cap[1]);if(p2<w[1]||g2<w[2]){w[1]=p2;w[2]=g2;why.push('opened '+fmtD(op).replace(/,? \d{4}$/,''))}}
  // Always in order: a peak at least a few days long, and still lovely after it.
  w[1]=Math.max(w[1],w[0]+2);w[2]=Math.max(w[2],w[1]+3);return{w,why}}
function fresh(b){if(!b.roastDate)return null;const d=daysAgo(b.roastDate);if(d<0)return null;const {w,why}=freshWin(b),k=d<w[0]?'rest':d<=w[1]?'peak':d<=w[2]?'good':'fade';
  return{d,k,w,why,roast:b.roast||'',label:FRESH[k][0],tip:FRESH[k][1]}}
// The bag's window in words, under the line, with what shaped it: so the label isn't a mystery, and a missing roast
// can be set.
const freshWinLine=f=>{const by=[f.roast?f.roast[0].toUpperCase()+f.roast.slice(1)+' roast':'',...f.why].filter(Boolean),lead=by.length?by.join(', ').replace(/^./,c=>c.toUpperCase())+': best':'Best';
  return (f.roast?'':'Taken as light roast. ')+lead+' from day '+f.w[0]+' to '+f.w[1]+', still lovely to day '+f.w[2]};
// The freshness line: its four stretches coloured in proportion (with a little room past "still lovely"), a marker on today.
const freshBar=f=>{const [a,b,c]=f.w,S=c+15,pc=n=>(n/S*100).toFixed(1)+'%';
  return '<span class="fbar" role="img" aria-label="Day '+f.d+' off roast: '+f.label+'"><i class="fz1" style="width:'+pc(a)+'"></i><i class="fz2" style="width:'+pc(b-a+1)+'"></i><i class="fz3" style="width:'+pc(c-b)+'"></i><i class="fz4"></i><b style="left:'+Math.min(100,f.d/S*100).toFixed(1)+'%"></b></span>'};
const freshPill=f=>'<span class="fpill f-'+f.k+'">'+f.label+' · day '+f.d+'</span>';
const bagLine=b=>{const g=gramsLeft(b);if(g==null)return '';const pct=b.bag?clamp(g/b.bag*100,0,100):null;
  return '<span class="bagl">'+(pct!=null?'<span class="bagm"><i style="width:'+pct.toFixed(0)+'%"></i></span>':'')+'<small>'+(g?g+' g left'+(b.bag?' of '+b.bag+' g':''):'Bag empty')+'</small></span>'};
// Mark the bag's contents as they are now: brews logged after this are taken off again.
function setLeft(b,g){b.left=gramsOrNull(g);b.leftAt=Date.now()}

/* ---------- Tasting notes in the editor ---------- */
// Notes are kept as words ("Jasmine, Peach"), so a scan, a backup or an older save reads the same. A word on the
// flavour wheel takes its family's colour; anything else (a roaster's "Turkish delight") is kept as you wrote it.
const TN_MAX=12,TN_LEN=300;
const tnFams=()=>FW.roots.filter(r=>r.n!=='Other');
// Words bags use that the wheel doesn't have, each with the wheel note whose colour and family it takes.
const TN_X={Caramel:'Caramelized','Brown sugar':'Molasses','Cane sugar':'Panela',Sugarcane:'Panela',Cocoa:'Cocoa nib',Cacao:'Cocoa nib',Butterscotch:'Toffee',Fudge:'Brownie',
  Citrus:'Orange',Tangerine:'Mandarin',Clementine:'Mandarin','Blood orange':'Orange','Orange zest':'Orange','Lemon zest':'Lemon','Red apple':'Apple','Green apple':'Apple',
  'Stone fruit':'Peach',Nectarine:'Peach','Red fruit':'Raspberry','Red currant':'Blackcurrant','Black cherry':'Cherry','Tropical fruit':'Mango',Papaya:'Mango',Guava:'Passion fruit',
  Kiwi:'Lime',Watermelon:'Melon',Tamarind:'Date','Dried fruit':'Raisin',
  'Tea-like':'Black tea',Floral:'Jasmine',Lemongrass:'Herb-like',Mint:'Herb-like',Butter:'Custard',Cream:'Custard',Creamy:'Custard',
  Nougat:'Almond',Marzipan:'Almond',Praline:'Hazelnut',Cashew:'Macadamia',Nutty:'Hazelnut','Brown spice':'Cinnamon',Wine:'Winey',Liqueur:'Rum',
  Champagne:'Sparkling wine',Prosecco:'Sparkling wine','Rose wine':'Rosé',Riesling:'White wine','Sauvignon blanc':'White wine','Peach tea':'Peach iced tea','Lemon tea':'Lemon iced tea',
  'Orange flower':'Orange blossom','Coffee flower':'Coffee blossom','Lily of the valley':'Lily','Rose water':'Rose',Florals:'Jasmine','White flowers':'Jasmine','Wildflowers':'Chamomile',
  'Hibiscus tea':'Hibiscus','Pink lemonade':'Lemonade','Yellow peach':'Peach','White peach':'Peach','Ginger beer':'Ginger ale',Soda:'Cream soda',
  'Dr Pepper':'Cola','Lime juice':'Lemonade','Apple juice':'Apple','Cherry pie':'Cherry','Lemon tart':'Lemon','Strawberry jam':'Jam','Candied orange':'Marmalade',Tiramisu:'Brownie',Pastry:'Apple pie'};
// Every note you can pick: the wheel's (bar the defects) and the words above. {n, c, id: the wheel note, g: its group}.
let TN_ALL=null;
const tnNotes=()=>TN_ALL||(TN_ALL=(()=>{const base=FW.leaves.filter(n=>n.cat.n!=='Other'),by=Object.fromEntries(base.map(n=>[n.n,n]));
  return[...base.map(n=>({n:n.n,c:n.c,id:n.id,g:n.parent?n.parent.n:''})),...Object.entries(TN_X).filter(([x,w])=>by[w]&&!by[x]).map(([x,w])=>({n:x,c:by[w].c,id:by[w].id,g:by[w].parent?by[w].parent.n:''}))]})());
const tnLeaves=()=>FW.leaves.filter(n=>n.cat.n!=='Other');
const tnLeaf=w=>{const f=fold(String(w).trim());return f?tnNotes().find(n=>fold(n.n)===f)||null:null};
const tnSplit=s=>{const seen=new Set();return String(s||'').split(/\s*[,;·]\s*/).map(x=>x.trim()).filter(x=>x&&!seen.has(fold(x))&&seen.add(fold(x)))};
const tnEsc=w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Notes a coffee is known for: the words in its varieties' and origin's cup descriptions, then the notes the wheel
// links to its process and varieties.
function tnSuggest(o){const base=v=>String(v).split(':')[0];
  const text=fold([...o.vars.map(v=>(VBY[base(v)]||{}).cup),...(o.origins||[o.origin]).map(k=>(oInfo(k)||{}).cup)].filter(Boolean).join(' '));
  const sc2=new Map(),put=(n,v)=>sc2.set(n.n,[n,((sc2.get(n.n)||[])[1]||0)+v]);
  for(const n of tnNotes()){const w=fold(n.n),L=FW.byId[n.id].l||[];if(text&&w.length>2&&new RegExp('\\b'+tnEsc(w)+'\\b').test(text))put(n,3);
    if(TN_X[n.n])continue;for(const l of L){if(o.process&&l==='p:'+o.process)put(n,2);if(o.vars.some(v=>l==='v:'+base(v)))put(n,2)}}
  return[...sc2.values()].sort((a,b)=>b[1]-a[1]).map(x=>x[0])}
// The tasting notes field: the notes as chips, a box to find or type one, notes this coffee is known for, and the
// flavour wheel's families to browse. Returns {val, suggest}.
function tasteInput(host,init,ctx){let L=tnSplit(init),fam=null,at=-1,opts=[];
  host.className='tn-box';
  host.innerHTML='<div class="tn-sel" id="tn-sel"></div>'+
    '<div class="acw tn-find"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input id="tn-q" maxlength="40" autocomplete="off" enterkeyhint="done" placeholder="Find or type a note" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="tn-list"><div class="acl" id="tn-list" role="listbox" aria-label="Notes" hidden></div></div>'+
    '<div class="tn-sug" id="tn-sug"></div>'+
    '<div class="tn-lbl">Browse the flavour wheel</div><div class="tn-fams" id="tn-fams">'+tnFams().map(r=>'<button type="button" class="tn-f" data-fam="'+r.id+'" aria-expanded="false" style="--fc:'+r.c+'"><i></i>'+esc(r.n)+'</button>').join('')+'</div>'+
    '<div class="tn-fam" id="tn-fam" hidden></div>';
  const q=$('tn-q'),box=$('tn-list'),has=w=>L.some(x=>fold(x)===fold(w));
  const chip=(n,on)=>'<button type="button" class="tn-c'+(on?' on':'')+'" data-add="'+esc(n.n)+'" aria-pressed="'+on+'" style="--fc:'+n.c+'"><i></i>'+esc(n.n)+'</button>';
  const drawSel=()=>{const wl=L.map(tnLeaf);
    $('tn-sel').innerHTML=(L.length?'<div class="tn-chips">'+L.map((w,i)=>{const n=wl[i];return'<span class="tn-x" style="--fc:'+(n?n.c:'var(--muted)')+'"><i></i>'+esc(n?n.n:w)+'<button type="button" data-rm="'+i+'" aria-label="Remove '+esc(w)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg></button></span>'}).join('')+'</div>':
      '<p class="tn-empty">What does the bag say, or what do you taste? Pick from below or type your own.</p>')+
      (wl.filter(Boolean).length>1?flBar(wl.filter(Boolean).map(n=>[n.id,2])):'');
    $('tn-n').textContent=L.length?L.length+' of '+TN_MAX:'';drawSug();drawFam()};
  const drawSug=()=>{const s=tnSuggest(ctx()).filter(n=>!has(n.n)).slice(0,8);
    $('tn-sug').innerHTML=s.length?'<div class="tn-lbl">Known in this coffee</div><div class="tn-cs">'+s.map(n=>chip(n,false)).join('')+'</div>':''};
  const drawFam=()=>{const f=fam&&FW.byId[fam];$('tn-fam').hidden=!f;document.querySelectorAll('#tn-fams [data-fam]').forEach(b=>{const on=b.dataset.fam===fam;b.setAttribute('aria-expanded',on);b.classList.toggle('on',on)});
    if(!f)return;$('tn-fam').style.setProperty('--fc',f.c);
    $('tn-fam').innerHTML='<p class="tn-fd">'+esc(f.d)+'</p>'+f.kids.map(g=>{const ls=g.leaf?[g]:g.kids.flatMap(k=>k.leaf?[k]:k.kids);return'<div class="tn-g"><small>'+esc(g.n)+'</small><div class="tn-cs">'+ls.map(n=>chip(n,has(n.n))).join('')+'</div></div>'}).join('')};
  const add=w=>{w=String(w).trim().replace(/\s+/g,' ');if(!w)return false;const n=tnLeaf(w);if(n)w=n.n;else w=w[0].toUpperCase()+w.slice(1);
    if(has(w)){L=L.filter(x=>fold(x)!==fold(w));drawSel();return true}
    if(L.length>=TN_MAX){toast('That’s '+TN_MAX+' notes, plenty for one bag');return false}
    if([...L,w].join(', ').length>TN_LEN){toast('That’s as many notes as fit');return false}
    L.push(w);drawSel();return true};
  const close=()=>{box.hidden=true;at=-1;q.setAttribute('aria-expanded','false');q.removeAttribute('aria-activedescendant')};
  const hl=()=>box.querySelectorAll('[role=option]').forEach((o,i)=>{o.setAttribute('aria-selected',i===at);if(i===at){q.setAttribute('aria-activedescendant',o.id);o.scrollIntoView({block:'nearest'})}});
  const draw=()=>{const t=q.value.trim(),f=fold(t);at=-1;if(!f||document.activeElement!==q){close();return}
    const m=tnNotes().filter(n=>fold(n.n).includes(f)).sort((a,b)=>fold(a.n).indexOf(f)-fold(b.n).indexOf(f)||a.n.length-b.n.length).slice(0,6);
    opts=m.map(n=>({w:n.n,h:'<i class="dot" style="background:'+n.c+'"></i><span class="tn-on">'+esc(n.n)+'</span>'+(has(n.n)?'<em>Added</em>':'<small>'+esc(n.g)+'</small>')}));
    if(!m.some(n=>fold(n.n)===f))opts.push({w:t,h:'<span class="tn-new" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></span><span class="tn-on">Add “'+esc(t)+'”</span>'});
    box.innerHTML=opts.map((o,i)=>'<div role="option" class="aco tn-o" id="tn-o'+i+'" data-i="'+i+'" aria-selected="false">'+o.h+'</div>').join('');box.hidden=false;q.setAttribute('aria-expanded','true');
    // The closest note on the wheel is ready for Enter; your own words are one step down.
    if(m.length){at=0;hl()}};
  const take=w=>{if(add(w)){q.value='';close()}};
  q.addEventListener('input',draw);q.addEventListener('focus',draw);q.addEventListener('blur',()=>setTimeout(close,120));
  q.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(box.hidden)return;e.preventDefault();at=(at+(e.key==='ArrowDown'?1:-1)+opts.length)%opts.length;hl()}
    else if(e.key==='Enter'||e.key===','){if(!q.value.trim())return;e.preventDefault();take(at>=0&&!box.hidden?opts[at].w:q.value)}
    else if(e.key==='Escape'&&!box.hidden){e.preventDefault();e.stopPropagation();close()}
    else if(e.key==='Backspace'&&!q.value&&L.length){L.pop();drawSel()}});
  // A pasted list ("cherry, cocoa, honey") becomes its notes.
  q.addEventListener('paste',e=>{const t=(e.clipboardData||{}).getData?.('text')||'';if(/[,;·\n]/.test(t)){e.preventDefault();t.split(/\s*[,;·\n]\s*/).forEach(w=>w.trim()&&!has(w)&&add(w));close()}});
  box.addEventListener('pointerdown',e=>e.preventDefault());box.addEventListener('click',e=>{const o=e.target.closest('[data-i]');if(o)take(opts[+o.dataset.i].w)});
  host.addEventListener('click',e=>{const a=e.target.closest('[data-add]'),r=e.target.closest('[data-rm]'),f=e.target.closest('[data-fam]');
    if(a){add(a.dataset.add);return}if(r){L.splice(+r.dataset.rm,1);drawSel();return}
    if(f){fam=fam===f.dataset.fam?null:f.dataset.fam;drawFam();if(fam)$('tn-fam').scrollIntoView({block:'nearest',behavior:'smooth'})}});
  drawSel();
  // Whatever is still in the box when you save counts too.
  return{val:()=>{const t=q.value.trim();if(t&&!has(t))add(t);return L.join(', ')},suggest:drawSug}}

/* ---------- The diary ---------- */
// A coffee's story: your entries and the brews you logged with it, newest first.
function beanTimeline(b){const fmt=s=>new Date(s+'T12:00');
  return [...b.diary.map(e=>({kind:'entry',d:e.d,t:fmt(e.d).getTime(),e})),
    ...beanBrews(b).map(l=>({kind:'brew',d:'',t:+l.ts||0,l}))].sort((x,y)=>y.t-x.t)}
const dfmt=t=>new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
function timelineHTML(items,withBean){if(!items.length)return '';
  return '<ol class="tline">'+items.map(it=>{const b=it.bean,head=withBean&&b?'<button type="button" class="tl-bean" data-bean="'+b.id+'">'+beanPic(b,'xs')+'<b>'+esc(beanTitle(b))+'</b></button>':'';
    if(it.kind==='entry'){const [n,ic]=MOMENTS[it.e.k];return '<li class="tl-e k-'+it.e.k+'"><span class="tl-ic" aria-hidden="true">'+ic+'</span><div class="tl-b">'+head+'<div class="tl-h"><b>'+n+'</b><time>'+dfmt(it.t)+'</time>'+
      (withBean?'':'<button type="button" class="tl-x" data-deldiary="'+it.e.id+'" aria-label="Delete this entry">✕</button>')+'</div>'+(it.e.t?'<p>'+esc(it.e.t)+'</p>':'')+
      (it.e.ph?'<button type="button" class="tl-ph" data-dyph="'+it.e.id+'" aria-label="Open the photo"><span class="tl-pic" data-bimg="'+DPH(it.e.id)+'"></span></button>':'')+'</div></li>'}
    const l=it.l,sn=l.snap||{},B=BREWERS[sn.b||l.brewer],st=+l.stars||0,dz=brewDose(l);
    return '<li class="tl-e k-brew"><span class="tl-ic" aria-hidden="true">☕</span><div class="tl-b">'+head+'<div class="tl-h"><b>Brewed'+(B?' on '+esc(B.name):'')+'</b><time>'+dfmt(it.t)+'</time></div>'+
      '<p class="tl-meta">'+[dz?gfmt(dz)+' g':'',sn.rec||''].filter(Boolean).map(esc).join(' · ')+(st?'<span role="img" aria-label="'+st+' of 5 beans">'+beanRate(st,'sm')+'</span>':'')+'</p>'+(l.notes?'<p>'+esc(l.notes)+'</p>':'')+'</div></li>'}).join('')+'</ol>'}

// A diary photo is kept with the coffee photos, under its entry's id.
const DPH=id=>'dy:'+id;
// A photo full screen; a tap anywhere closes it.
function openPhoto(key){let d=$('phv');if(!d){d=document.createElement('dialog');d.id='phv';d.className='phv';d.setAttribute('aria-label','Photo');document.body.appendChild(d);d.onclick=()=>d.close()}
  d.innerHTML='<button type="button" class="phv-x" aria-label="Close">✕</button>';const c=BIMG.peek(key)||BIMG.peekThumb(key);
  const add=u=>{d.querySelectorAll('img').forEach(x=>x.remove());const i=new Image();i.alt='';i.src=u;d.appendChild(i)};if(c)add(c);BIMG.get(key).then(u=>{if(u&&u!==c&&d.open)add(u)});d.showModal()}
document.addEventListener('click',e=>{const x=e.target.closest('[data-dyph]');if(x)openPhoto(DPH(x.dataset.dyph))});
// The diary's composer, on a coffee's page (bd) and in the Diary view (dy): the moment, a few words, the day and a photo.
// st keeps what's chosen so far, so a redraw doesn't lose it.
const CAM_ICO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.6"/></svg>';
function dwriteHTML(p,st,top){return '<div class="dwrite" id="'+p+'-write">'+(top?'<p class="dw-lab">Coffee</p>'+top+'<p class="dw-lab">Moment</p>':'')+'<div class="dmoms" role="group" aria-label="What kind of moment">'+
    Object.entries(MOMENTS).map(([k,[n,ic]])=>'<button type="button" data-mom="'+k+'" aria-pressed="'+(k===st.mom)+'"><span aria-hidden="true">'+ic+'</span>'+n+'</button>').join('')+'</div>'+
    '<textarea id="'+p+'-dt" rows="3" maxlength="600" aria-label="Diary entry" placeholder="'+esc(MOMENTS[st.mom][2])+'">'+esc(st.t||'')+'</textarea><div class="dw-ph" id="'+p+'-phv"'+(st.ph?'':' hidden')+'>'+dwPh(st)+'</div>'+
    '<div class="dw-row"><input type="date" id="'+p+'-dd" class="dateinp" value="'+(st.d||todayISO())+'" max="'+todayISO()+'" aria-label="Date" required><input type="file" accept="image/*" id="'+p+'-ph" hidden>'+
      '<button type="button" class="btn ghost dw-cam" id="'+p+'-cam">'+CAM_ICO+(st.ph?'Change photo':'Photo')+'</button><button type="button" class="btn" id="'+p+'-dadd">Add to the diary</button></div></div>'}
const dwPh=st=>st.ph?'<img src="'+st.ph+'" alt="The photo for this entry"><button type="button" class="dw-phx" aria-label="Remove the photo">✕</button>':'';
// bean(): the coffee it's about. done(b): save and redraw.
function wireDwrite(p,st,bean,done){const w=$(p+'-write');if(!w)return;
  const ph=()=>{const v=$(p+'-phv');v.hidden=!st.ph;v.innerHTML=dwPh(st);$(p+'-cam').lastChild.textContent=st.ph?'Change photo':'Photo'};
  w.onclick=e=>{const m=e.target.closest('[data-mom]');
    if(m){st.mom=m.dataset.mom;w.querySelectorAll('[data-mom]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.mom===st.mom));$(p+'-dt').placeholder=MOMENTS[st.mom][2];$(p+'-dt').focus();return}
    if(e.target.closest('.dw-phx')){st.ph=null;ph();return}
    if(e.target.closest('.dw-cam'))$(p+'-ph').click()};
  $(p+'-dt').oninput=e=>{st.t=e.target.value};$(p+'-dd').onchange=e=>{st.d=e.target.value};
  $(p+'-ph').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
    try{st.ph=await shrinkPhoto(await fileURL(f),1400);ph()}catch(_){toast('That photo couldn’t be read')}};
  $(p+'-dadd').onclick=async()=>{const b=bean();if(!b){toast('Choose the coffee first');return}const t=$(p+'-dt').value.trim();
    if(!t&&st.mom==='note'&&!st.ph){toast('Write a few words first');$(p+'-dt').focus();return}
    const en=okEntry({k:st.mom,d:$(p+'-dd').value||todayISO(),t,ph:!!st.ph});let msg='Added to the diary';
    if(en.ph&&!await BIMG.put(DPH(en.id),st.ph)){delete en.ph;msg='Added, but the photo couldn’t be saved on this device';if(!t&&en.k==='note'){toast('The photo couldn’t be saved on this device');return}}
    b.diary.unshift(en);b.diary.sort((x,y)=>y.d.localeCompare(x.d));if(en.k==='last')b.shelf=false;if(en.k==='opened'&&!b.shelf)b.shelf=true;
    Object.assign(st,{mom:'note',ph:null,t:'',d:''});done(b,msg)}}
const dropDiaryPhotos=l=>l.forEach(e=>{if(e.ph)BIMG.del(DPH(e.id))});

// Your brews: your own, in a shared log too (logged under the name you joined with, or your profile's name).
const isMine=l=>l&&(!l.by||l.by===ME||(window.PROFILE_OK&&PROFILE&&PROFILE.nick&&l.by===PROFILE.nick));
// Your own brews: trophies and streaks count these, not a teammate's in a shared log.
const MYLOG=()=>LOG.filter(isMine);
const brewTs=l=>+l.ts||Date.parse(l.date)||0;
// Your taste, worked out from the coffees you buy and how you rate them, and from what you brew and taste. A coffee
// you rated 4 or more counts double towards what you like; every bag counts once towards what you buy.
// Rated best: the highest average rating, among keys with at least two rated coffees (one lucky bag can't win); with
// none rated twice, any rated one. Ties go to the one rated more often.
function best(items,f){const m=new Map();for(const b of items){const k=f(b);if(!k||!b.rating)continue;const e=m.get(k)||{k,sum:0,n:0};e.sum+=b.rating;e.n++;m.set(k,e)}
  const all=[...m.values()],pool=all.some(e=>e.n>=2)?all.filter(e=>e.n>=2):all;
  const r=pool.sort((a,c)=>c.sum/c.n-a.sum/a.n||c.n-a.n)[0];return r?{k:r.k,n:r.n,avg:r.sum/r.n}:null}
function tasteOf(bs,ls){const top=(items,f,w)=>{const m=new Map();for(const x of items){const ks=[].concat(f(x)).filter(Boolean),wt=w?w(x):1;for(const k of ks)m.set(k,(m.get(k)||0)+wt)}
    let best=null,n=0;for(const [k,v] of m)if(v>n){best=k;n=v}return best?{k:best,n}:null};
  const like=b=>b.rating>=4?2:b.rating&&b.rating<3?0.5:1;
  const t={origin:top(bs,b=>b.origin,buys),region:top(bs,b=>{const o=b.origin&&b.origin!=='blend'&&oInfo(b.origin);return o&&o.reg},buys),variety:top(bs,b=>beanVars(b).map(v=>v.split(':')[0]),buys),
    process:top(bs,b=>b.process,buys),roast:top(bs,b=>b.roast,buys),roaster:top(bs,b=>b.roaster&&b.roaster.trim(),buys),
    likedOrigin:best(bs,b=>b.origin),likedProcess:best(bs,b=>b.process),
    brewer:top(ls,l=>{const b=(l.snap&&l.snap.b)||l.brewer;return b&&CANONB(b)}),regionOrigin:null,recipe:top(ls,l=>l.snap&&l.snap.rec),goal:top(ls,l=>l.snap&&l.snap.goal)};
  // Flavours: the families of the notes on the bags you liked and of what you tasted in your brews.
  const fam=new Map(),note=new Map();
  for(const b of bs){const w=like(b);for(const wd of tnSplit(b.flavours)){const n=tnLeaf(wd),leaf=n&&FW.byId[n.id];if(!leaf)continue;fam.set(leaf.cat.id,(fam.get(leaf.cat.id)||0)+w);note.set(leaf.id,(note.get(leaf.id)||0)+w)}}
  for(const l of ls){const w=(+l.stars||3)>=4?2:1;for(const [id,v] of flOf(l)){const leaf=FW.byId[id];if(!leaf)continue;fam.set(leaf.cat.id,(fam.get(leaf.cat.id)||0)+w*v/2);note.set(id,(note.get(id)||0)+w*v/2)}}
  t.families=[...fam].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id])=>FW.byId[id]);t.notes=[...note].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id])=>FW.byId[id]);
  // The origin you buy most within your favourite region (so the region and its country always agree).
  if(t.region)t.regionOrigin=top(bs.filter(b=>{const o=b.origin&&oInfo(b.origin);return o&&o.reg===t.region.k}),b=>b.origin);
  const rated=bs.filter(b=>b.rating);t.avg=rated.length?rated.reduce((a,b)=>a+b.rating,0)/rated.length:0;t.best=[...rated].sort((a,b)=>b.rating-a.rating||(b.ts||0)-(a.ts||0))[0]||null;
  // Your regular: the coffee you've bought the most times (only once you've bought one again).
  t.regular=[...bs].filter(b=>buys(b)>1).sort((a,b)=>buys(b)-buys(a)||b.rating-a.rating)[0]||null;
  return t}
// One line that sums it up: "Washed Ethiopian heirlooms, light roast, floral and fruity, on a Hario V60."
// Your taste in one sentence of plain statements, each true on its own: the roast and the flavours you like, where your
// coffees mostly come from, and what you brew on ("Light roasts that taste fruity and sweet, mostly from Yemen, brewed
// on a Hario V60"). The top variety and process are listed separately: strung together they read like one coffee.
function tasteLine(t){const o=t.origin&&oInfo(t.origin.k),B=t.brewer&&BREWERS[t.brewer.k],fam=t.families.slice(0,2).map(f=>f.n.toLowerCase().replace(/\//g,' and ')).join(' and ');
  const rs=t.roast?t.roast.k.charAt(0).toUpperCase()+t.roast.k.slice(1)+' roasts':'';
  const head=rs&&fam?rs+' that taste '+fam:rs?'Mostly '+rs.toLowerCase():fam?'Coffees that taste '+fam:'';
  const bits=[head,o?(head?'mostly from ':'Mostly from ')+o.name:'',B?(head||o?'brewed on ':'Brewed on ')+art(B.name)+' '+B.name:''].filter(Boolean);
  return bits.length?bits.join(', ')+'.':''}
// This year in coffee: the counts, then what you bought most (origin, region, variety, process, roast, roastery), how you
// brewed, and the notes you came back to.
// Kept until your coffees, your brews or the day change, so redrawing the page doesn't work it all out again.
let YIC_MEMO={k:'',h:''};
function yearInCoffeeHTML(){const k=beansSig();if(YIC_MEMO.k===k)return YIC_MEMO.h;const h=yearInCoffeeHTML0();YIC_MEMO={k,h};return h}
// Bags opened in a year: earlier bags by the day they were opened, and each coffee's current bag by its latest
// "opened" entry (or the day it was added). Bags bought before the app have no date and stay out of a year's count.
const bagOn=b=>{const e=b.diary.find(x=>x.k==='opened');return (e&&e.d)||beanDay(b)};
const bagsIn=y=>{const k=String(y);return BEANS.reduce((a,b)=>a+(b.bags||[]).filter(x=>(x.on||'').slice(0,4)===k).length+(String(bagOn(b)).slice(0,4)===k?1:0),0)};
function yearInCoffeeHTML0(){const cy=new Date().getFullYear(),bs=BEANS.filter(b=>beanYear(b)===cy),ls=LOG.filter(l=>isMine(l)&&new Date(brewTs(l)).getFullYear()===cy);
  // The counts are this year's: coffees first tried or added this year (and the bags of them, when some were bought
  // again), every cup made (logged brews and timer cups), and the coffee those cups used.
  const cups=myCups(cy);if(!bs.length&&!cups.length)return '';const g=Math.round(cups.reduce((s,c)=>s+(c.g||0),0)),t=tasteOf(bs,ls),origins=new Set(bs.map(b=>b.origin).filter(Boolean)).size,bags=bagsIn(cy);
  const big=[[bs.length,(bs.length===1?'coffee':'coffees')+(bags>bs.length?' · '+bags+' bags':'')],[cups.length,cups.length===1?'cup brewed':'cups brewed'],g?[g>=1000?(g/1000).toFixed(g>=10000?0:1)+' kg':g+' g','of coffee']:[origins,origins===1?'origin':'origins']];
  const o=t.origin&&oInfo(t.origin.k),R=t.region&&REG[t.region.k],v=t.variety&&VBY[t.variety.k],pr=t.process&&PROCESSES[t.process.k],B=t.brewer&&BREWERS[t.brewer.k];
  // The facts, without counts: short ones as tiles two to a row, then the coffees (your regular, the best of the year)
  // full width, each opening its coffee. An odd tile out at the end of the short ones spans the row too.
  const half=[o&&['<span class="yic-fl">'+flagOf(t.origin.k)+'</span>','Mostly from',o.name],R&&['🗺️','Favourite region',R.name+(t.regionOrigin&&t.regionOrigin.k!==(t.origin&&t.origin.k)?' · mostly '+oInfo(t.regionOrigin.k).name:'')],
    v&&['🌱','Top variety',shortName(v.name)],pr&&['🧪','Top process',pr.name.replace(/\s*\(.*\)$/,'')],t.roast&&['🔥','Usual roast',t.roast.k.charAt(0).toUpperCase()+t.roast.k.slice(1)],
    t.roaster&&['🏷️','Roastery most often',t.roaster.k],B&&['☕','Brewed most on',B.name]].filter(Boolean);
  const wide=[t.regular&&['🔁','Your regular',beanTitle(t.regular),t.regular.id],t.best&&['🏆','Best of the year',beanTitle(t.best),t.best.id]].filter(Boolean);
  const tile=([ic,k,vv,id],w)=>(id?'<button type="button" class="yic-t w" data-bean="'+id+'">':'<div class="yic-t'+(w?' w':'')+'">')+'<i aria-hidden="true">'+ic+'</i><span><small>'+k+'</small><b>'+esc(vv)+'</b></span>'+(id?'<svg class="yic-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>':'</div>');
  return '<div class="yic" role="region" aria-label="'+cy+' in coffee"><div class="yic-h"><h3>'+cy+' in coffee</h3></div>'+(bs.length>1?'<p class="yic-line">'+esc(tasteLine(t))+'</p>':'')+
    '<div class="yic-big">'+big.map(([n,l])=>'<span><b>'+esc(String(n))+'</b><small>'+esc(l)+'</small></span>').join('')+'</div>'+
    (half.length||wide.length?'<div class="yic-grid">'+half.map((f,i)=>tile(f,half.length%2===1&&i===half.length-1)).join('')+wide.map(f=>tile(f,true)).join('')+'</div>':'')+
    (t.notes.length?'<div class="yic-notes"><small>Notes you keep coming back to</small><div class="chips">'+t.notes.map(n=>'<span class="chip"><i class="dot" style="background:'+n.c+'"></i>'+esc(n.n)+'</span>').join('')+'</div></div>':'')+'</div>'}

/* ================= FOR YOU ================= */
// Which way your taste leans: fruity and floral → brighter and clearer; chocolate, nutty and sweet → sweeter, more body.
const FY_LEAN=t=>{const f=new Set((t.families||[]).map(x=>x.n.toLowerCase()));const bright=['fruity','floral','sour','sour/fermented'].some(k=>f.has(k)),round=['sweet','nutty/cocoa','nutty','cocoa','spices'].some(k=>f.has(k));
  return bright&&!round?'bright':round&&!bright?'round':'balanced'};

// A new recipe for one of your coffees, made around it and your taste. With an AI model at hand (the app running
// inside Claude), the model writes it from your coffee, taste and gear; otherwise it's built here from the same rules
// the dial-in uses: the roast and process set the water and grind, your taste sets the ratio and the pours.
const MK_GOALS=[['balanced','Balanced'],['sweet','Sweeter'],['bright','Brighter'],['clear','Clearer'],['body','More body']];
const MK_TYPES=['Cone dripper','Flat-bottom dripper','Valve and hybrid','Immersion and pressure'];
const mmssF=s=>Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');
function makeRecipe(bean,bk,goal,seed){const B=BREWERS[bk],t=tasteOf(BEANS,LOG.filter(isMine)),rnd=(k=>()=>(k=(k*9301+49297)%233280)/233280)(seed||1);
  const doses=LOG.filter(l=>isMine(l)&&l.snap&&(BREWERS[l.snap.b]||{}).of===(B.of||bk)||isMine(l)&&l.snap&&l.snap.b===bk).map(l=>+l.snap.dose).filter(v=>v>0).sort((a,b)=>a-b);
  const imm=B.type==='Immersion and pressure',valve=B.type==='Valve and hybrid',aero=/aeropress/i.test(B.name);
  const dose=Math.min(doses.length?doses[doses.length>>1]:imm&&!aero?18:15,aero?16:99);
  const fer=/natural|anaerobic|honey|carbonic|alchemy|ferment|thermal|yeast|koji/i.test(bean.process||''),roast=bean.roast||'medium',fresh=bean.roastDate&&daysAgo(bean.roastDate)<10;
  const ratio=clamp(({balanced:16,sweet:15.5,bright:16.5,clear:17,body:14.5})[goal]-(roast==='dark'?.5:0)+(rnd()-.5)*.4,13,18);
  const water=Math.min(Math.round(dose*ratio/5)*5,aero?230:3000);
  let temp=({light:95,medium:92,dark:89})[roast]||92;if(fer)temp-=2;if(goal==='bright')temp-=1;if(goal==='sweet'||goal==='clear')temp+=1;temp=clamp(Math.round(temp),86,97);
  const off=clamp((roast==='dark'?.5:roast==='light'?-.5:0)+(goal==='clear'?.5:goal==='body'?-.5:0)+(imm?1:0),-2,2);
  const bloomG=Math.round(dose*(fer?2.5:3)/5)*5,bloomT=fresh?45:fer?40:35,steps=[];let why=[],kind='pulse',style='';
  if(aero){kind='aero';const steep=({balanced:90,sweet:105,bright:75,clear:75,body:120})[goal];
    steps.push('0:00 pour '+water+'g and stir 10 seconds.');steps.push(mmssF(steep-30)+' put the plunger in to hold the brew.');steps.push(mmssF(steep)+' press slowly for about 30 seconds.');steps.push(mmssF(steep+30)+' done: stop at the hiss.');
    style='press';why.push('A '+steep+'-second steep and a slow press'+(goal==='body'?' for a fuller cup':goal==='bright'?', kept short for a lively cup':' for a clean, sweet cup')+'.')}
  else if(imm||valve){kind=valve?'hybrid':'imm';const steep=({balanced:180,sweet:210,bright:150,clear:150,body:240})[goal]+(roast==='dark'?-30:roast==='light'?30:0);
    steps.push('0:00 pour all '+water+'g and stir gently 3 times.');if(steep>120)steps.push('1:00 break the crust and skim the foam.');
    steps.push(mmssF(steep)+(valve?' open the valve and let it drain.':' press the plunger down slowly and pour.'));steps.push(mmssF(steep+(valve?60:20))+' done: swirl the cup and taste.');
    style=valve?'switch':'steep';why.push('A '+Math.round(steep/60*10)/10+'-minute steep'+(goal==='body'?' for a fuller, rounder cup':goal==='bright'?' kept short so the acidity stays lively':' for an even, sweet extraction')+'.')}
  else{const n=({balanced:3,sweet:3,bright:4,clear:2,body:3})[goal];const rest=water-bloomG,gap=goal==='clear'?40:30;let at=bloomT,poured=bloomG;
    steps.push('0:00 pour '+bloomG+'g, bloom'+(fresh?' (fresh coffee: let it degas)':'')+'.');
    let lastAt=0;for(let k=1;k<=n;k++){lastAt=at;poured=k===n?water:Math.round((bloomG+rest*k/n)/5)*5;steps.push(mmssF(at)+' pour to '+poured+'g'+(goal==='body'&&k===n?', then stir gently once':goal==='sweet'&&k===n?', then a gentle swirl':'')+'.');at+=gap+(goal==='clear'?15:0)}
    const end=lastAt+(goal==='clear'?50:40);steps.push(mmssF(end)+' let it drain, done by '+mmssF(end+15)+'.');style=goal==='clear'?'two-pour':n>=4?'pulse':'three-pour';
    why.push(n+' pours'+(goal==='bright'?' in short pulses keep the bed agitated, for a livelier cup':goal==='clear'?', big and calm, for a clean, tea-like clarity':goal==='body'?' and a final stir build sweetness and body':' after a '+bloomT+'-second bloom for an even extraction')+'.')}
  why.unshift((fer?beanTitle(bean)+' is a '+(PROCESSES[bean.process]||{name:'fermented'}).name.replace(/\s*\(.*\)$/,'').toLowerCase()+' coffee, so the water is a little cooler ('+temp+'°C) to keep the fruit clean and the ferment in check.':roast==='light'?'A light roast wants hot water ('+temp+'°C) to open up.':roast==='dark'?'A darker roast is brewed cooler ('+temp+'°C) and a little coarser to stay sweet, not bitter.':'Water at '+temp+'°C suits a medium roast.'));
  if(t.families.length)why.push('The 1:'+(Math.round(water/dose*10)/10)+' ratio is set for the '+t.families.slice(0,2).map(f=>f.n.toLowerCase()).join(' and ')+' cups you like.');
  const word=({balanced:'everyday',sweet:'sweet',bright:'bright',clear:'clean',body:'round'})[goal];
  return sanRec({b:bk,kind,name:shortName(beanTitle(bean)).slice(0,36)+' '+word+' '+style,by:'Made for you by The Brew Bench',dose,water,temp,off,why:why.join(' '),
    tip:'Taste it: sour or thin, go a click finer next time; bitter or dry, a click coarser.',steps})}
// The model's version: given the same facts, it writes the recipe as JSON, and it's checked like any recipe.
async function aiRecipe(bean,bk,goal){const B=BREWERS[bk],t=tasteOf(BEANS,LOG.filter(isMine)),P=bean.process&&PROCESSES[bean.process];
  const prompt='You are a specialty coffee brewing coach. Write ONE new pour-over or immersion recipe for this coffee and this person. Do not copy a famous recipe.\n\n'+
    'Coffee: '+beanTitle(bean)+(bean.roaster?' by '+bean.roaster:'')+'; origin '+(bean.origin?originName(bean.origin):'unknown')+'; variety '+(beanVars(bean).map(vName).join(', ')||'unknown')+'; process '+(P?P.name:'unknown')+'; roast '+(bean.roast||'unknown')+
    (bean.roastDate?'; '+daysAgo(bean.roastDate)+' days off roast':'')+(bean.flavours?'; bag notes: '+bean.flavours:'')+'.\n'+
    'Brewer: '+B.name+' ('+B.type+'). Cup goal: '+MK_GOALS.find(g=>g[0]===goal)[1]+'.\n'+
    'Their taste: '+(tasteLine(t)||'not known yet')+(t.notes.length?'; notes they love: '+t.notes.map(n=>n.n).join(', '):'')+'.\n\n'+
    'Reply with ONLY JSON: {"name":"short new name (max 40 chars)","dose":grams,"water":grams,"temp":celsius,"grind_offset":number from -2 (finer) to 2 (coarser) relative to a normal grind for this brewer,'+
    '"steps":["0:00 pour 45g, bloom.","0:40 pour to 150g.","..."],"why":"two or three sentences on why it suits this coffee and this person","tip":"one sentence"}\n'+
    'Each step starts with m:ss and the pours use "pour Xg" or "pour to Xg" with the scale total; the last pour reaches the full water.';
  const j=await SAMPLE.json(prompt,{});if(!j||typeof j!=='object')throw new Error('no reply');
  const r=sanRec({b:bk,kind:B.type==='Immersion and pressure'?'imm':B.type==='Valve and hybrid'?'hybrid':'pulse',name:j.name,by:'Made for you by AI',dose:j.dose,water:j.water,temp:j.temp,off:j.grind_offset,why:j.why,tip:j.tip,
    steps:(Array.isArray(j.steps)?j.steps:[]).filter(s=>/^\s*\d+:\d\d\b/.test(String(s)))});
  if(!r||r.steps.length<2||!(r.water>r.dose*8&&r.water<r.dose*20))throw new Error('unusable');return r}
function openMakeRecipe(bid){const d=$('vd'),beans=[...BEANS.filter(b=>b.shelf),...BEANS.filter(b=>!b.shelf)];if(!beans.length){toast('Add a coffee to your gallery first');return}
  const brewers=[...new Set([...MYB,'v60','origami','switch','frenchpress'])].filter(k=>BREWERS[k]&&MK_TYPES.includes(BREWERS[k].type)&&!BREWERS[k].of).slice(0,8);
  const t=tasteOf(BEANS,LOG.filter(isMine)),lean=FY_LEAN(t);
  const st={bean:bid&&beanById(bid)?bid:beans[0].id,b:MYB.find(k=>brewers.includes(k))||brewers[0],goal:lean==='bright'?'bright':lean==='round'?'sweet':'balanced',seed:1,rec:null,busy:false};
  const chips=(k,list,cur)=>'<div class="mk-chips" role="group">'+list.map(([v,n,pic])=>'<button type="button" data-mk="'+k+'" data-v="'+esc(v)+'" aria-pressed="'+(v===cur)+'">'+(pic||'')+esc(n)+'</button>').join('')+'</div>';
  const draw=()=>{const r=st.rec,bean=beanById(st.bean);
    $('vd-in').innerHTML='<div class="vd-head" style="--c:#8A5A3B"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:#C9964A"></i>'+(SAMPLE?'Made with AI':'Made for you')+'</span><h2 id="vd-title">A recipe for your coffee</h2>'+
      '<p class="hint" style="margin:0">'+(SAMPLE?'Written by AI from your coffee, your taste and your brewer.':'Built from your coffee, your taste and your brewer: a new recipe, not one from the list.')+'</p></div><div class="vd-body mk">'+
      '<div class="lbl">Your coffee</div>'+chips('bean',beans.slice(0,10).map(b=>[b.id,beanTitle(b),beanPic(b,'xs')]),st.bean)+
      '<div class="lbl">Brewer</div>'+chips('b',brewers.map(k=>[k,BREWERS[k].name]),st.b)+
      '<div class="lbl">The cup you want'+(t.families.length?' <span class="hint">your taste leans '+(lean==='bright'?'bright and fruity':lean==='round'?'sweet and round':'balanced')+'</span>':'')+'</div>'+chips('goal',MK_GOALS,st.goal)+
      (r?'<div class="mk-res"><div class="mk-h"><b>'+esc(r.name)+'</b><small>'+esc(r.by)+'</small></div>'+
        // The same stats, grind settings, pour graph and steps as every recipe page.
        recipeBody(r,-1).replace(/<div class="actions">[\s\S]*$/,'')+
        '<div class="actions"><button type="button" class="btn" id="mk-save">Save and brew it</button><button type="button" class="btn ghost" id="mk-again">Another one</button></div></div>'
       :'<div class="actions"><button type="button" class="btn" id="mk-go"'+(st.busy?' disabled':'')+'>'+(st.busy?'Writing your recipe…':'Create the recipe')+'</button></div><button type="button" class="linkbtn mk-rand" id="mk-rand">Or open a random recipe from the list</button>')+'</div>';
    hydrateImgs($('vd-in'));$('vd-x').onclick=()=>d.close()};
  const go=async()=>{const bean=beanById(st.bean);if(!bean)return;st.busy=true;draw();let r=null;
    if(SAMPLE)try{r=await aiRecipe(bean,st.b,st.goal)}catch(e){r=null}
    if(!r)r=makeRecipe(bean,st.b,st.goal,st.seed);st.rec=r;st.busy=false;draw()};
  $('vd-in').onclick=e=>{const c=e.target.closest('[data-mk]');if(c){st[c.dataset.mk]=c.dataset.v;st.rec=null;draw();return}
    if(e.target.closest('#mk-go')){go();return}if(e.target.closest('#mk-rand')){d.close();setTimeout(surpriseRecipe,200);return}if(e.target.closest('#mk-again')){st.seed++;st.rec=null;go();return}
    if(e.target.closest('#mk-save')){const r=Object.assign({},st.rec,{id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),author:ME||'',ts:Date.now()});saveRecipe(r);
      const i=RECIPES.findIndex(x=>x.id===r.id);d.close();toast('Saved to your recipes');if(i>=0)setTimeout(()=>openRecipe(i),250)}};
  draw();showDlg(d);d.scrollTop=0}

/* ---------- Trophies ---------- */
// Earned from the cabinet as it is: each has a goal and counts towards it. The day one is first earned is kept.
const WILD=['anaerobic','anaerobicnatural','anaerobicwashed','anaerobichoney','doubleanaerobic','carbonic','alchemy','lactic','yeast','koji','extended','thermalshock','mossto','coferment','infused','barrelaged'];
function cabStats(){const o=new Set(BEANS.map(b=>b.origin).filter(k=>k&&k!=='blend')),ml=MYLOG(),bl=BEANS.filter(isBlend);
  return{n:BEANS.length,bags:BEANS.reduce((a,b)=>a+buys(b),0),o,regs:new Set([...o].map(k=>(oInfo(k)||{}).reg).filter(Boolean)),procs:new Set(BEANS.map(b=>b.process).filter(Boolean)),
    roasters:new Set(BEANS.map(b=>b.roaster.toLowerCase()).filter(Boolean)),diary:BEANS.reduce((a,b)=>a+b.diary.length,0),done:BEANS.filter(b=>!b.shelf).length+BEANS.reduce((a,b)=>a+(b.bags||[]).length+(b.prior||0),0),rebought:BEANS.filter(b=>buys(b)>1).length,maxBuys:BEANS.reduce((a,b)=>Math.max(a,buys(b)),0),
    crowned:Object.values(TOP3).some(t=>t.ids.slice(0,3).every(Boolean)),perfect:BEANS.some(b=>b.rating===5),wild:BEANS.some(b=>WILD.includes(b.process)),
    geisha:BEANS.some(b=>beanVars(b).some(v=>/^geisha/.test(v))),arabia:BEANS.some(b=>['yemen','saudi','oman','uae'].includes(b.origin)),eth:o.has('ethiopia'),
    brews:ml.length,streak:brewStreak(ml),brewers:new Set(ml.map(l=>l.snap&&l.snap.b).filter(Boolean)).size,champ:ml.some(l=>l.snap&&CHAMP_REC.test(l.snap.rec||'')),
    decaf:BEANS.some(b=>PROCESSES[b.process]&&PROCESSES[b.process].cat==='decaf'),sl:BEANS.some(b=>beanVars(b).some(v=>/^sl(28|34)/.test(v))),
    fresh:BEANS.some(b=>ISO_D.test(b.roastDate||'')&&ISO_D.test(b.tried||'')&&(Date.parse(b.tried)-Date.parse(b.roastDate))/864e5<=3&&b.tried>=b.roastDate),
    two:[...o].some(k=>BEANS.some(b=>b.origin===k&&b.process==='washed')&&BEANS.some(b=>b.origin===k&&/natural/.test(b.process||''))),
    blends:bl.length,blendWide:bl.some(b=>new Set(blendParts(b).map(x=>x.o)).size>=3),
    blendRegs:bl.some(b=>new Set(blendParts(b).map(x=>(oInfo(x.o)||{}).reg).filter(Boolean)).size>=2),
    rated:BEANS.filter(b=>b.rating).length,noted:BEANS.filter(b=>(b.flavours||'').trim()).length,again:BEANS.some(b=>b.again==='yes'||buys(b)>1)}}
// A champion's recipe, as named in the recipe list ("Pan Wei (Barista 2026)") or credited to one.
const CHAMP_REC=/\((Brewers Cup|AeroPress|Barista) \d{4}\)|champion/i;
const logDay=l=>String(l.date||'').slice(0,10)||(l.ts?new Date(l.ts).toISOString().slice(0,10):'');
// The longest run of days in a row with at least one brew logged.
function brewStreak(ml=MYLOG()){const ds=[...new Set(ml.map(logDay).filter(d=>ISO_D.test(d)))].sort();let best=0,run=0,prev=null;
  for(const d of ds){run=prev&&Math.round((Date.parse(d)-Date.parse(prev))/864e5)===1?run+1:1;best=Math.max(best,run);prev=d}return best}
const TROPHIES=[
  ['first','First bag','Add your first coffee to the cabinet','☕',s=>[s.n,1]],['ten','Ten bags','Ten bags bought, bought-again ones included','🛍️',s=>[s.bags,10]],['fifty','The collector','Fifty coffees in the cabinet','🏛️',s=>[s.n,50]],
  ['birth','Where it began','A coffee from Ethiopia, the birthplace of Arabica','🐐',s=>[+s.eth,1]],['mocha','The Mocha road','A coffee from the Arabian Peninsula','⛵',s=>[+s.arabia,1]],
  ['pass5','Stamped passport','Coffees from five origins','🛂',s=>[s.o.size,5]],['pass15','Globetrotter','Coffees from fifteen origins','🌍',s=>[s.o.size,15]],['regions','All five regions','A coffee from every coffee region','🧭',s=>[s.regs.size,5]],
  ['procs','Process explorer','Five different processes','🧪',s=>[s.procs.size,5]],['wild','Wild side','An anaerobic, carbonic or co-fermented coffee','🍷',s=>[+s.wild,1]],['geisha','Geisha club','A Geisha in the cabinet','🌸',s=>[+s.geisha,1]],
  ['roasters','Roastery hopper','Coffees from five roasteries','🔥',s=>[s.roasters.size,5]],['diary','Diarist','Ten diary entries','📖',s=>[s.diary,10]],['done','Clean plate','Finish ten bags','🏁',s=>[s.done,10]],
  ['perfect','Perfect five','Rate a coffee five beans','✨',s=>[+s.perfect,1]],['crowned','Crowned','A full top 3 for a year','👑',s=>[+s.crowned,1]],
  ['atlas','Atlas','Coffees from twenty-five origins','🗺️',s=>[s.o.size,25]],
  ['blend1','The blender','Add your first blend','🌍',s=>[s.blends,1]],['blendworld','Around the world','A blend of three or more countries','🧳',s=>[+s.blendWide,1]],
  ['blendcont','Bridges','A blend from two coffee regions, say Africa and South America','🌉',s=>[+s.blendRegs,1]],['blend5','Master blender','Five blends in the cabinet','🎛️',s=>[s.blends,5]],['two','Two sides','A washed and a natural from the same origin','☯️',s=>[+s.two,1]],
  ['sl','Kenyan classics','An SL28 or SL34','🦁',s=>[+s.sl,1]],['decaf','Night owl','A decaf in the cabinet','🦉',s=>[+s.decaf,1]],
  ['fresh','Straight from the roaster','Add a coffee within three days of its roast','⏱️',s=>[+s.fresh,1]],['critic','The critic','Rate twenty coffees','🧐',s=>[s.rated,20]],
  ['notes','Tasting notes','Tasting notes on ten coffees','👃',s=>[s.noted,10]],['again','Old faithful','Buy a coffee again','💛',s=>[+s.again,1]],
  ['rebuy','Back for more','Buy a coffee again','🔁',s=>[s.rebought,1]],['regular','The regular','Buy the same coffee three times','🤝',s=>[s.maxBuys,3]],
  ['loyal','House favourites','Buy five different coffees again','🏡',s=>[s.rebought,5]],
  ['brew10','Ten brews','Log ten brews','📝',s=>[s.brews,10]],['brew100','Centurion','Log a hundred brews','💯',s=>[s.brews,100]],
  ['streak','Daily ritual','Brew on seven days in a row','📅',s=>[s.streak,7]],['kit','Toolkit','Brew with three different brewers','🧰',s=>[s.brewers,3]],
  ['champ','Champion\u2019s cup','Brew a world champion\u2019s recipe','🏆',s=>[+s.champ,1]]];
/* Seasonal trophies: each runs in its own window every year (northern-hemisphere seasons, coffee's new-crop arrivals,
   International Coffee Day, the month of a world final) and is earned once per year, kept with its year. Only what
   you do inside the window counts. */
const CA_O=['guatemala','honduras','elsalvador','nicaragua','costarica','panama','mexico'];
const inWin=(iso,w)=>!!iso&&iso>=w.from&&iso<=w.to;
const brewsIn=w=>LOG.filter(l=>inWin(logDay(l),w));
const addedIn=w=>BEANS.filter(b=>inWin(beanDay(b),w));
const months=(y,m1,m2)=>{const a=new Date(y,m1-1,1),b=new Date(y,m2,0);return{from:isoOf(a),to:isoOf(b)}};
const isoOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
// [id, name, what to do, icon, window for a date (or null when not running), progress in that window]
const SEASONAL=[
  ['winter','Winter warmer','Brew fifteen times this winter (December to February)','❄️',d=>{const m=d.getMonth()+1,y=d.getFullYear();return m===12?{...months(y,12,12),to:isoOf(new Date(y+1,2,0)),key:y}:m<=2?{from:isoOf(new Date(y-1,11,1)),to:isoOf(new Date(y,2,0)),key:y-1}:null},w=>[brewsIn(w).length,15]],
  ['spring','Spring clean','Add three new coffees this spring (March to May)','🌸',d=>{const m=d.getMonth()+1,y=d.getFullYear();return m>=3&&m<=5?{...months(y,3,5),key:y}:null},w=>[addedIn(w).length,3]],
  ['summer','Iced summer','Brew five iced or cold coffees this summer (June to August)','🧊',d=>{const m=d.getMonth()+1,y=d.getFullYear();return m>=6&&m<=8?{...months(y,6,8),key:y}:null},w=>[brewsIn(w).filter(l=>/iced|cold|flash|japanese|kyoto/i.test((l.snap&&l.snap.rec)||'')||(l.snap&&l.snap.b)==='cold').length,5]],
  ['autumn','Harvest moon','Coffees from three origins this autumn (September to November)','🍂',d=>{const m=d.getMonth()+1,y=d.getFullYear();return m>=9&&m<=11?{...months(y,9,11),key:y}:null},w=>[new Set(addedIn(w).map(b=>b.origin).filter(Boolean)).size,3]],
  ['icd','International Coffee Day','Log a brew on 1 October','🎉',d=>{const y=d.getFullYear();return d.getMonth()===9&&d.getDate()===1?{from:y+'-10-01',to:y+'-10-01',key:y}:null},w=>[Math.min(1,brewsIn(w).length),1]],
  ['ethcrop','Ethiopian new crop','Add an Ethiopian coffee while the new crop arrives (June to September)','🐐',d=>{const m=d.getMonth()+1,y=d.getFullYear();return m>=6&&m<=9?{...months(y,6,9),key:y}:null},w=>[+addedIn(w).some(b=>b.origin==='ethiopia'),1]],
  ['kencrop','Kenyan new crop','Add a Kenyan coffee while the new crop arrives (April to July)','🦁',d=>{const m=d.getMonth()+1,y=d.getFullYear();return m>=4&&m<=7?{...months(y,4,7),key:y}:null},w=>[+addedIn(w).some(b=>b.origin==='kenya'),1]],
  ['cacrop','Central American harvest','Add a Central American coffee in harvest arrivals (March to June)','🌋',d=>{const m=d.getMonth()+1,y=d.getFullYear();return m>=3&&m<=6?{...months(y,3,6),key:y}:null},w=>[+addedIn(w).some(b=>CA_O.includes(b.origin)),1]],
  ['brcrop','Brazilian new crop','Add a Brazilian coffee as the new crop lands (October to January)','🇧🇷',d=>{const m=d.getMonth()+1,y=d.getFullYear();return m>=10?{from:y+'-10-01',to:isoOf(new Date(y+1,1,0)),key:y}:m===1?{from:(y-1)+'-10-01',to:isoOf(new Date(y,1,0)),key:y-1}:null},w=>[+addedIn(w).some(b=>b.origin==='brazil'),1]],
  ['finals','Final watch','Brew a champion\u2019s recipe in the month of a world final','📺',d=>{if(typeof EVENTS==='undefined')return null;const t=d.getTime(),e=EVENTS.find(e=>{const s=new Date(e.start);return d.getFullYear()===s.getFullYear()&&d.getMonth()===s.getMonth()});if(!e)return null;const s=new Date(e.start);return{...months(s.getFullYear(),s.getMonth()+1,s.getMonth()+1),key:e.c+e.y,label:COMPS[e.c].name+' '+e.y}},w=>[+brewsIn(w).some(l=>l.snap&&CHAMP_REC.test(l.snap.rec||'')),1]]];
// What's running now (or on another day), with progress, and the next one to start.
function seasonNow(when){const d=when||new Date(),today=isoOf(d);return SEASONAL.map(([id,n,desc,ic,win,f])=>{const w=win(d);if(!w)return null;const [h,need]=f(w),key=id+'-'+w.key;
  return{id,key,n,desc,ic,w,h:Math.min(h,need),need,done:!!(TGOT&&TGOT[key]),left:Math.max(0,Math.round((Date.parse(w.to+'T23:59')-Date.parse(today+'T12:00'))/864e5))}}).filter(Boolean)}
function seasonNext(){const d=new Date();for(let i=1;i<=370;i++){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+i),y=new Date(x.getFullYear(),x.getMonth(),x.getDate()-1);
  for(const [id,n,desc,ic,win] of SEASONAL){const w=win(x);if(w&&!win(y))return{id,n,ic,days:i,w}}}return null}
const seasonEarned=()=>Object.keys(TGOT||{}).filter(k=>/-[a-z0-9]+$/.test(k)&&SEASONAL.some(t=>k.startsWith(t[0]+'-'))).map(k=>{const id=k.slice(0,k.indexOf('-')),t=SEASONAL.find(t=>t[0]===id);return{k,n:t[1],ic:t[3],y:k.slice(id.length+1).replace(/^[a-z]+/,''),at:TGOT[k]}}).sort((a,b)=>b.at.localeCompare(a.at))
let TGOT=load('bb-trophies',null);
// New trophies are announced; the first time this runs, the ones already earned are noted quietly.
function checkTrophies(){const st=cabStats(),first=!TGOT||typeof TGOT!=='object';if(first)TGOT={};const news=[];
  for(const [id,n,,ic,f] of TROPHIES){const [h,need]=f(st);if(h>=need&&!TGOT[id]){TGOT[id]=todayISO();news.push(ic+' '+n)}}
  for(const t of seasonNow())if(t.h>=t.need&&!TGOT[t.key]){TGOT[t.key]=todayISO();news.push(t.ic+' '+t.n)}
  save('bb-trophies',TGOT);if(!first&&news.length)setTimeout(()=>toast((news.length>1?'Trophies unlocked: ':'Trophy unlocked: ')+(news.length>3?news.slice(0,3).join(', ')+' and '+(news.length-3)+' more':news.join(', '))),600)}

/* ---------- From your cabinet: one coffee a day ---------- */
// Like the word of the day: a coffee from your cabinet, chosen for the date. A bag that needs you comes first (just at
// its peak, nearly empty, or fading), then one you tried on this day in an earlier year, then a memory from your diary
// or a favourite worth another look.
function cabinetDay(when){const day=when||new Date(),iso=day.getFullYear()+'-'+String(day.getMonth()+1).padStart(2,'0')+'-'+String(day.getDate()).padStart(2,'0');
  const seed=Math.floor(Date.parse(iso+'T12:00')/864e5),pick=l=>l[((seed%l.length)+l.length)%l.length],at=t=>Math.round((Date.parse(iso+'T12:00')-Date.parse(t+'T12:00'))/864e5);
  if(!BEANS.length)return null;const shelf=BEANS.filter(b=>b.shelf),need=[];
  for(const b of shelf){const d=b.roastDate?at(b.roastDate):null,c=cupsLeft(b),fw=freshWin(b).w;
    // Each nudge comes on a few days, not every day: the peak on days 4 and 5, fading once a week, running low every third day.
    if(d!=null&&d>=fw[0]&&d<=fw[0]+1)need.push({b,k:'peak',title:beanTitle(b)+' is at its peak',text:'Day '+d+' off roast: its best weeks start now. Brew it today.'});
    else if(c!=null&&c<=2&&seed%3===0)need.push({b,k:'low',title:c?'Only '+gramsLeft(b)+' g of '+beanTitle(b)+' left':beanTitle(b)+' is empty',text:c?'Make the last of it count, or note how it ended in its diary.':'Finish the bag in its page to move it into the cabinet.'});
    else if(d!=null&&d>fw[2]&&d<=fw[2]+30&&(d-fw[2]-1)%7===0)need.push({b,k:'fade',title:beanTitle(b)+' is fading',text:'Day '+d+' off roast. Brew it soon: a little finer and hotter brings it back.'})}
  if(need.length)return pick(need);
  const md=iso.slice(5),ago=BEANS.filter(b=>b.tried&&b.tried.slice(5)===md&&b.tried<iso);
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
    list.push({id:RIDS[i],title:'☕ '+(c?DAYK[c.k]:'Time for a good cup'),body:c?(c.k==='fav'?c.title+': ':c.title+'. ')+c.text:'Add the bag you’re drinking to your cabinet and keep its story.',schedule:{at,allowWhileIdle:true},isExactNotification:false,extra:c?{bean:c.b.id}:{}})}
  try{if(list.length)await ln.schedule({notifications:list});return true}catch(e){return false}}
let RST=0;function reschedule(){if(!REMIND.on||!LN())return;clearTimeout(RST);RST=setTimeout(scheduleReminders,1200)}
// Turning it on asks Android for permission to notify, the first time.
async function setReminder(on,t){const ln=LN();if(t)REMIND.t=t;
  if(on&&!REMIND.on){if(!ln){toast('Phone reminders work in the Android app');return false}
    try{let p=await ln.checkPermissions();if(p.display!=='granted')p=await ln.requestPermissions();if(p.display!=='granted'){toast('Allow notifications for Brew Bench in your phone’s settings first');return false}}catch(e){toast('Couldn’t turn on reminders');return false}}
  REMIND.on=on;save('bb-remind',REMIND);await scheduleReminders();if(on)toast('Your coffee of the day arrives at '+REMIND.t);return true}
// Tapping a notification takes you to what it's about, whether the app was closed or in the background: the coffee of
// the day opens that coffee (or the Beans page when the day's note has no coffee), a coffee fact opens what it's about
// (or Today in coffee on Explore). The listener is set up as the app loads, so the tap that opened the app isn't
// missed, and the tap is acted on once the app has finished opening (after the splash and the start page), so the
// start page doesn't land on top of it. Older notifications already on the phone are told apart by their ids.
(()=>{const ln=LN();if(!ln)return;let pend=null;
  const go=n=>{const x=(n&&n.extra)||{},id=+(n&&n.id)||0;document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    if(x.bean&&beanById(x.bean)){showTab('beans');openBean(x.bean);return}
    if(x.fact||(id>=7201&&id<7215)){if(goFact(x.fact))return;goTab('explore');setTimeout(()=>{const t=document.querySelector('#explore .today');if(t)t.scrollIntoView({block:'start',behavior:'smooth'})},400);return}
    if(id>=7101&&id<7115||x.bean)showTab('beans')};
  const ready=()=>NAV_READY&&!document.documentElement.classList.contains('splashing');
  const run=()=>{if(!pend)return;if(!ready()){setTimeout(run,150);return}const n=pend;pend=null;try{go(n)}catch(e){}};
  try{ln.addListener('localNotificationActionPerformed',a=>{pend=a&&a.notification;run()})}catch(e){}
  if(REMIND.on)setTimeout(scheduleReminders,3000)})();
// The home-screen widget (Android, see BrewWidget.java): the coffee you're drinking, meaning the cabinet coffee you
// brewed most recently (or added most recently, before any brews), sent when the app starts and each time you leave
// it. The widget works out the day's freshness itself from the roast date and window. Tapping it opens that coffee;
// its Log brew button opens the brew form with that coffee picked.
// A coffee you chose for the widget (from its page) stays on it while it's in your cabinet.
const wPinned=()=>{try{return localStorage.getItem('bb-wbean')||''}catch(e){return''}};
function widgetBean(){const sh=BEANS.filter(b=>b.shelf);if(!sh.length)return null;const pin=sh.find(b=>b.id===wPinned());if(pin)return pin;const last=b=>beanBrews(b).reduce((m,l)=>Math.max(m,+l.ts||0),0);
  return sh.map(b=>[b,last(b)]).sort((a,c)=>c[1]-a[1]||(+c[0].ts||0)-(+a[0].ts||0))[0][0]}
const wLeft=b=>{const c=cupsLeft(b);return c==null?'':c?c+(c===1?' cup left':' cups left'):'Bag empty'};
// The other widgets: Your cabinet (up to four shelf coffees, most recently brewed first), Quick brew (the recipe you've
// brewed most in the last two months, else the last one opened) and Coffee word of the day (the coming six weeks'
// words, the same as Today in coffee, so the widget moves on each day by itself).
// Every coffee in the cabinet (up to 30): the widget shows as many as its height holds and counts the rest.
const wCups=b=>{const c=cupsLeft(b);return c==null?'':c?c+(c===1?' cup':' cups'):'Empty'};
function widgetCabinet(){const last=b=>beanBrews(b).reduce((m,l)=>Math.max(m,+l.ts||0),0);
  return BEANS.filter(b=>b.shelf).map(b=>[b,last(b)]).sort((a,c)=>c[1]-a[1]||(+c[0].ts||0)-(+a[0].ts||0)).slice(0,30)
    .map(([b])=>({id:b.id,title:beanTitle(b),roastDate:b.roastDate||'',win:freshWin(b).w.join(','),cups:wCups(b)}))}
function widgetRecipe(){const since=Date.now()-60*864e5,n=new Map();for(const l of LOG)if(isMine(l)&&(+l.ts||0)>=since&&l.snap&&l.snap.rec)n.set(l.snap.rec,(n.get(l.snap.rec)||0)+1);
  let i=-1;const top=[...n].sort((a,b)=>b[1]-a[1])[0];if(top)i=RECIPES.findIndex(r=>r.name===top[0]);
  if(i<0&&typeof RECENT!=='undefined'&&RECENT.length)i=rByKey(RECENT[0]);if(i<0)return{};
  const r=RECIPES[i],sc=scaled(r),B=BREWERS[r.b];
  return{key:rkey(r),name:r.name,brewer:B?B.name:'',dose:gfmt(sc.dose)+' g',water:gfmt(sc.water)+' g',temp:r.temp?r.temp+'°C':'',line:[B&&B.name,gfmt(sc.dose)+' g : '+gfmt(sc.water)+' g',r.temp?r.temp+'°C':''].filter(Boolean).join(' · ')}}
function widgetWords(){const d0=Math.floor(Date.now()/864e5),out=[];for(let d=d0;d<d0+42;d++){const w=GLOSSARY[d%GLOSSARY.length];out.push([d,w[0],w[2],(GCAT[w[1]]||[''])[0]])}return out}
// Drinking now shows the coffee's photo (a small copy, 192 px) or, without one, its origin's flag.
async function updWidget(){const w=plugin('Widget');if(!w)return;try{const b=widgetBean();let rc={},photo='';try{rc=widgetRecipe()}catch(e){}
  if(b&&b.img)try{const t=await BIMG.thumb(b.id);if(t)photo=await shrinkPhoto(t,192)}catch(e){}
  w.update(Object.assign(b?{id:b.id,title:beanTitle(b),sub:[b.roaster,b.origin?originName(b.origin):''].filter(Boolean).join(' · '),flag:b.origin?flagOf(b.origin):'',photo,
    roastDate:b.roastDate||'',win:freshWin(b).w.join(','),left:wLeft(b)}:{id:''},{cabinet:JSON.stringify(widgetCabinet()),brew:JSON.stringify(rc),words:JSON.stringify(widgetWords())})).catch(()=>{})}catch(e){}}
(()=>{if(!plugin('Widget'))return;setTimeout(updWidget,2500);document.addEventListener('visibilitychange',()=>{if(document.hidden)updWidget()});
  const go=o=>{const [k,id]=String(o||'').split(':');document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    if(k==='bean'&&beanById(id)){showTab('beans');openBean(id);return}
    if(k==='log'){if(LEDIT)endEdit();LBEAN=id&&beanById(id)?id:null;renderLBean();renderFlForm();showTab('log');setTimeout(()=>$('l-form').scrollIntoView({block:'start'}),60);return}
    // Recipe keys hold a colon themselves ("r:kasuya-4-6"), so the rest of the request is the key.
    const rest=String(o).slice(k.length+1);
    if(k==='recipe'||k==='timer'){const i=rByKey(rest);if(i>=0){showTab('recipes');if(k==='timer')openTimer(i);else openRecipe(i);return}showTab('recipes');return}
    if(k==='recipes'){showTab('recipes');return}
    if(k==='resume')return;
    if(k==='word'&&GBY[rest]){openWord(rest);return}
    if(k==='word'||k==='explore'){goTab('explore');return}
    showTab('beans')};
  const ready=()=>NAV_READY&&!document.documentElement.classList.contains('splashing');
  // Asked on start (a tap that opened the app) and by the app when a tap arrives while it's running.
  const ask=()=>{if(!ready()){setTimeout(ask,150);return}plugin('Widget').pending().then(r=>{if(r&&r.open)go(r.open)}).catch(()=>{})};
  window.bbWidget=ask;ask()})();
function cabinetDayHTML(){const c=cabinetDay();if(!c)return '';
  return '<button type="button" class="cday k-'+c.k+'" data-bean="'+c.b.id+'">'+beanPic(c.b,'cd')+'<span class="cd-tx"><small>'+(c.k==='fav'?'From your cabinet':'From your cabinet · '+DAYK[c.k])+'</small><b>'+esc(c.title)+'</b><span>'+esc(c.text)+'</span></span></button>'}

/* Ratings are drawn as coffee beans: a filled bean, half a bean, or an empty one. */
const BEAN_G='<g transform="rotate(30 12 12)"><path class="bo" d="M12 2.6c4.1 0 6.6 4.3 6.6 9.4s-2.5 9.4-6.6 9.4-6.6-4.3-6.6-9.4 2.5-9.4 6.6-9.4z"/><path class="bc" d="M12.7 3.2c-2.4 2.6-.4 5.6-1.3 8.8s1.3 5.9-.6 8.8"/></g>';
const beanSVG='<svg viewBox="0 0 24 24" aria-hidden="true">'+BEAN_G+'</svg>';
const RATEW=['Not rated','Not for me','Okay','Good','Great','Outstanding'];
const rateWord=r=>RATEW[Math.floor(r)]||RATEW[0];
// An honourable mention's mark: a rosette, drawn like the app's other icons.
const HM_SVG='<svg class="hm-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a5 5 0 1 0 0 10a5 5 0 1 0 0-10z M12 6l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 8.1l2-.3z M9 12.4L7.6 20l4.4-2.4 4.4 2.4-1.4-7.6"/></svg>';
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
// Only the large photo on a coffee's page uses the full image; every list uses the small copy.
function loadImg(el){const id=el.dataset.bimg;if(!id)return;el.removeAttribute('data-bimg');const big=el.classList.contains('hero');
  const put=(u,now)=>{const i=new Image();i.alt='';i.decoding='async';i.src=u;if(now){i.className='now';el.classList.add('has');el.prepend(i)}else i.onload=()=>{el.classList.add('has');el.prepend(i)}};
  // A coffee's big picture shows its thumbnail at once and the full photo once the sheet has finished opening, so
  // decoding a camera-sized photo doesn't stall the slide.
  if(big){const t=BIMG.peekThumb(id),f=BIMG.peek(id);if(f&&!t){put(f,true);return}if(t)put(t,true);
    setTimeout(()=>(f?Promise.resolve(f):BIMG.get(id)).then(u=>{if(!u||!el.isConnected)return;const i=new Image();i.alt='';i.decoding='async';i.src=u;(i.decode?i.decode():Promise.resolve()).then(()=>{if(!el.isConnected)return;i.className='now hi';const old=el.querySelector(':scope>img');if(old)old.after(i);else el.prepend(i);el.classList.add('has');if(old)setTimeout(()=>old.remove(),300)}).catch(()=>{})}),620);return}
  const c=BIMG.peekThumb(id);if(c){put(c,true);return}BIMG.thumb(id).then(u=>{if(u)put(u,false);else if(el.classList.contains('tl-pic'))(el.closest('.tl-ph,.otd-pic')||el).remove()})}
const BIO='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){BIO.unobserve(e.target);loadImg(e.target)}}),{rootMargin:'400px 0px'}):null;
// Before the Beans tab is first opened, the small photos of its first coffees are read and decoded in the background, one
// at a time, and put into the page that was built ahead: opening the tab then shows them at once instead of filling in.
async function warmBeanPhotos(){const root=$('beans');if(!root)return;const order=[...BEANS.filter(b=>b.shelf),...BEANS.filter(b=>!b.shelf)].filter(b=>b.img).slice(0,24);
  for(const b of order){if(document.hidden)await new Promise(r=>setTimeout(r,1500));let u=BIMG.peekThumb(b.id);if(!u)try{u=await BIMG.thumb(b.id)}catch(e){u=null}
    if(u){try{const i=new Image();i.src=u;await i.decode()}catch(e){}root.querySelectorAll('[data-bimg="'+b.id+'"]').forEach(el=>{if(!el.classList.contains('hero'))loadImg(el)})}
    await new Promise(r=>(window.requestIdleCallback||setTimeout)(r,{timeout:500}))}}
function hydrateImgs(root){root.querySelectorAll('[data-bimg]').forEach(el=>{if(BIMG.peekThumb(el.dataset.bimg)||!BIO||root.closest&&root.closest('dialog'))loadImg(el);else BIO.observe(el)});requestAnimationFrame(()=>loadNear(root))}
// Photos already on screen (or close) load straight away. A list drawn while its tab was hidden never hears from the
// observer when the tab is shown, so its first rows stayed blank until you scrolled.
// Every photo is measured first, then the near ones load: loading one between measurements re-laid the page out each time.
function loadNear(root){if(!root)return;const H=innerHeight+400,near=[...root.querySelectorAll('[data-bimg]')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.bottom>-400&&r.top<H});
  near.forEach(el=>{if(BIO)BIO.unobserve(el);loadImg(el)})}
// The photo area: a placeholder in the origin's flag and coffee tones until the photo loads (or when there isn't one).
// Without a photo, a coffee gets a tile in its origin region's colour (the map's colours) with a large bean.
const regCol=k=>{const o=oInfo(k);return o&&REG[o.reg]?REG[o.reg].color:'var(--cherry)'};
const beanPic=(b,cls)=>'<span class="bpic'+(cls?' '+cls:'')+'" style="--rc:'+regCol(b.origin)+'"'+(b.img?' data-bimg="'+b.id+'"':'')+'><span class="bph">'+beanSVG+(b.origin?'<span class="bfl">'+flagOf(b.origin)+'</span>':'')+'</span></span>';
const glassRate=r=>'<span class="bglass">'+beanSVG+(r?r.toString().replace('.5','½'):'–')+'</span>';
const CROWN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>';

/* ---------- The Beans page ---------- */
// The coffees list's filters.
const BFILTERS=[['all','All'],['done','Finished'],['rebought','Bought again'],['blend','Blends'],['advent','Advent'],['top','4 beans and up'],['fav','Favourites']];
const bfKeep=(b,f)=>f==='all'||(f==='blend'?isBlend(b):f==='done'?!b.shelf:f==='rebought'?buys(b)>1:f==='advent'?!!b.cal:f==='again'?b.again==='yes'||buys(b)>1:f==='top'?b.rating>=4:inAnyTop(b.id));
function beanList(){const q=BQ.trim().toLowerCase();
  let l=BEANS.filter(b=>inSel(BYEAR,String(beanYear(b)))&&bfAny(b)&&(!q||[b.name,b.roaster,originName(b.origin),beanOrigin(b,true),b.process&&PROCESSES[b.process].name,beanVars(b).map(vName).join(' '),b.flavours,b.notes].join(' ').toLowerCase().includes(q)));
  const by={recent:(a,b)=>beanDay(b).localeCompare(beanDay(a))||b.ts-a.ts,rated:(a,b)=>b.rating-a.rating||beanDay(b).localeCompare(beanDay(a)),
    roaster:(a,b)=>(a.roaster||'~').localeCompare(b.roaster||'~')||b.rating-a.rating,origin:(a,b)=>(originName(a.origin)||'~').localeCompare(originName(b.origin)||'~')||b.rating-a.rating};
  return l.sort(by[BSORT])}
// Cards are grouped the way they're sorted: by year, roastery or origin. Top rated is one ranked list.
function beanGroups(l){if(BSORT==='rated')return [['',l]];const g=new Map();
  for(const b of l){const k=BSORT==='recent'?String(beanYear(b)):BSORT==='roaster'?(b.roaster||'Roastery not set'):(b.origin?flagOf(b.origin)+' '+originName(b.origin):'Origin not set');if(!g.has(k))g.set(k,[]);g.get(k).push(b)}
  return [...g]}
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
  return '<div class="crown-h"><div><span class="crown-k">'+(y===cy?'This year’s favourites':'Your history')+'</span><h3>Top 5 of '+y+'</h3></div>'+
    '<div class="crown-acts">'+(t&&t.ids.some(Boolean)?'<button type="button" class="sh-mini ic" data-t5share="'+y+'" aria-label="Share your top 5 of '+y+'" title="Share">'+SH_ICO+'</button>':'')+(n?'<button type="button" class="crown-btn" data-top3="'+y+'" data-slot="0">'+(has?'Change':'Pick')+'</button>':'')+'</div></div>'+
    (yrs.length>1?'<div class="crown-yrs" role="group" aria-label="Year">'+yrs.map(x=>'<button type="button" data-py="'+x+'" aria-pressed="'+(x===y)+'">'+x+'</button>').join('')+'</div>':'')+
    '<div class="podium">'+[1,0,2].map(slot).join('')+'</div>'+
    // 4th and 5th beneath the podium, then the honourable mentions.
    (n>3||(t&&(t.ids[3]||t.ids[4]))?'<div class="t45">'+[3,4].map(i=>{const id=t&&t.ids[i];if(!id)return '<button type="button" class="t45c empty" data-top3="'+y+'" data-slot="'+i+'"><span class="t45n">'+(i+1)+'</span><span class="t45t"><b>'+MEDALN[i+1]+' place</b><small>Tap to add</small></span></button>';
      const b=beanById(id),s=(t.snap||[]).find(x=>x.id===id)||{},v=b||Object.assign({id,img:true,origin:''},s);
      return '<button type="button" class="t45c" '+(b?'data-bean="'+id+'"':'data-top3="'+y+'" data-slot="'+i+'"')+'><span class="t45n">'+(i+1)+'</span>'+beanPic(Object.assign({},v,{img:b?b.img:true}),'xs')+'<span class="t45t"><b>'+esc(t3name(t,id))+'</b><small>'+esc((b?b.roaster:s.roaster)||'')+'</small></span></button>'}).join('')+'</div>':'')+
    (t&&(t.hm||[]).length||n>3?'<div class="t3hm"><div class="t3hm-h"><span>'+HM_SVG+' Honourable mentions</span>'+(n?'<button type="button" class="linkbtn" data-top3="'+y+'" data-slot="hm">'+(t&&(t.hm||[]).length?'Change':'Add')+'</button>':'')+'</div>'+
      (t&&(t.hm||[]).length?'<div class="t3hm-l">'+hmOf(t).map(id=>{const b=beanById(id),s=(t.snap||[]).find(x=>x.id===id)||{},v=b||Object.assign({id,img:true,origin:''},s);
        return '<button type="button" class="t3hm-i" '+(b?'data-bean="'+id+'"':'')+'>'+beanPic(Object.assign({},v,{img:b?b.img:true}),'av')+'<small>'+esc(t3name(t,id))+'</small></button>'}).join('')+'</div>'
       :'<p class="t3hm-e">The ones that nearly made it: coffees you want to remember.</p>')+'</div>':'')+
    (has?'':'<p class="crown-empty">'+(n?'Tap a place to crown a coffee of '+y+'. Your picks stay in your history after the year ends.':'Add the coffees you drink in '+y+', then crown your favourites here.')+'</p>')}
const SCAN_ICO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2 M16 4h2a2 2 0 0 1 2 2v2 M20 16v2a2 2 0 0 1-2 2h-2 M8 20H6a2 2 0 0 1-2-2v-2 M12 8.5c2 0 3.5 1.6 3.5 3.5S14 15.5 12 15.5 8.5 14 8.5 12 10 8.5 12 8.5z"/></svg>',
  PLUS_ICO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
// The view switch sticks just under the app bar, whose height follows the text size.
function setAbBottom(){const a=$('appbar');if(!a)return;const top=parseFloat(getComputedStyle(a).top)||0;document.documentElement.style.setProperty('--ab-b',Math.round(top+a.offsetHeight)+'px')}
addEventListener('resize',setAbBottom);
// The page: a compact hero with the two ways in, then one of three views (your coffees, the top 3, your scans).
function renderBeans(){const el=$('beans-in');if(!el)return;BSIG=beansSig();setAbBottom();
  if(!el.firstChild)el.innerHTML='<div id="bg-hero"></div><div class="seg bviews scrollrow" id="bg-views" role="group" aria-label="Show"></div>'+
    '<div class="bview" id="bv-coffees" aria-label="Your coffees"></div><div class="bview" id="bv-diary" aria-label="Your coffee diary"></div><div class="bview" id="bv-passport" aria-label="Your coffee passport"></div>'+
    '<div class="bview" id="bv-top3" aria-label="Top 3"></div><div class="bview" id="bv-scans" aria-label="Your scans"></div>';
  // "From your cabinet" lives on Explore only.
  // Only the view on screen is drawn now; the others are drawn when you switch to them.
  // The top shows at once; the long list follows a frame later, so the tab opens without a pause.
  renderBeanHero();BDIRTY=new Set(Object.keys(BVIEWS));
  if(!$('bv-'+BVIEW).firstChild&&!BVPEND){BVPEND=1;seg('bg-views',[['coffees','Coffees'],['diary','Diary'],['passport','Passport'],['top3','Top 5'],['scans','Scans']],()=>BVIEW,()=>{});
    requestAnimationFrame(()=>setTimeout(()=>{BVPEND=0;renderBeanViews()},16))}
  else if(!BVPEND)renderBeanViews()}
let BVPEND=0,BVDIR=0;
// The other views are built while the phone is idle, one at a time, so switching to one only has to show it. A tap
// or a page change in the meantime pushes the work back.
let BVPRE=0;function prebuildBViews(){if(BVPRE)return;BVPRE=1;const next=()=>{BVPRE=0;const v=[...BDIRTY].find(k=>k!==BVIEW);if(!v||!$('bv-'+v))return;
    if(performance.now()-NAV_AT<800||document.hidden){BVPRE=1;setTimeout(()=>whenIdle(next),600);return}
    BDIRTY.delete(v);try{BVIEWS[v]()}catch(e){}BVPRE=1;whenIdle(next)};whenIdle(next)}
let BDIRTY=new Set();
const BVIEWS={coffees:()=>renderCoffees(),diary:()=>renderDiaryView(),passport:()=>renderPassport(),top3:()=>renderTop3View(),scans:()=>renderBeanScans()};
// The journal's season, in the corner of the Beans header (northern-hemisphere seasons, as the seasonal trophies).
const seasonTag=()=>{const m=new Date().getMonth();return ['❄️ Winter','❄️ Winter','🌸 Spring','🌸 Spring','🌸 Spring','☀️ Summer','☀️ Summer','☀️ Summer','🍂 Autumn','🍂 Autumn','🍂 Autumn','❄️ Winter'][m]+' · '};
function renderBeanHero(){const cy=new Date().getFullYear(),N=BEANS.length,rated=BEANS.filter(b=>b.rating),avg=rated.length?rated.reduce((s,b)=>s+b.rating,0)/rated.length:0,
    roasters=new Set(BEANS.map(b=>b.roaster.toLowerCase()).filter(Boolean)).size,origins=new Set(BEANS.map(b=>b.origin).filter(Boolean)).size,
    last=[...BEANS].sort((a,b)=>beanDay(b).localeCompare(beanDay(a))||b.ts-a.ts).slice(0,3);
  const h=$('bg-hero');h.className='bg-hero'+(N?'':' empty');
  h.innerHTML='<div class="bgh-tx"><span class="bgh-k">'+seasonTag()+(window.PROFILE_OK&&PROFILE?esc(PROFILE.nick)+'’s coffee journal':'Your coffee journal')+'</span>'+
      (N?'<h3>'+N+' coffee'+(N===1?'':'s')+(origins?' <em>· '+origins+' origin'+(origins===1?'':'s')+'</em>':'')+'</h3>'+
        '<div class="bgh-stats"><span><b>'+roasters+'</b>'+(roasters===1?'roastery':'roasteries')+'</span><span><b>'+(avg?avg.toFixed(1):'–')+beanSVG+'</b>average</span><span><b>'+BEANS.filter(b=>beanYear(b)===cy).length+'</b>in '+cy+'</span></div>'
        :'<h3>Start your <em>coffee journal</em></h3><p>Scan a bag or add one by hand, then rate it in beans.</p>')+
      '</div><div class="bgh-fan" aria-hidden="true">'+(last.length?last.map(b=>beanPic(b)).join(''):'<span class="bpic"><span class="bph">'+beanSVG+'</span></span>')+'</div>'+
    '<div class="bgh-acts"><button type="button" class="bgh-btn main" id="bg-scan">'+SCAN_ICO+'Scan a bag</button><button type="button" class="bgh-btn" id="bg-add">'+PLUS_ICO+'Add a coffee</button></div>';
  hydrateImgs(h)}
function renderBeanViews(){const cy=new Date().getFullYear();
  seg('bg-views',[['coffees','Coffees'],['diary','Diary'],['passport','Passport'],['top3','Top 5'],['scans','Scans']],()=>BVIEW,v=>{if(v===BVIEW)return;const K=Object.keys(BVIEWS);BVDIR=K.indexOf(v)>K.indexOf(BVIEW)?1:-1;BVIEW=v;
    // The strip shows the pick at once (seg); the view, already built in the background, follows in the next frame.
    renderBeanViews()});
  if(BDIRTY.has(BVIEW)){BDIRTY.delete(BVIEW);BVIEWS[BVIEW]()}
  if(BDIRTY.size)prebuildBViews();
  requestAnimationFrame(()=>setTimeout(()=>loadNear($('bv-'+BVIEW)),30));
  for(const v of ['coffees','diary','passport','top3','scans']){const p=$('bv-'+v),on=v===BVIEW;if(p.hidden===!on)continue;p.hidden=!on;if(on&&!RM()&&BVDIR){p.classList.remove('bv-in-r','bv-in-l');void p.offsetWidth;p.classList.add(BVDIR>0?'bv-in-r':'bv-in-l')}}BVDIR=0;
  // Switched while scrolled down: the new view starts just under the stuck tab strip, not partway down or with the page
  // jumping back up (each view is at least a screen tall, so a short one can't pull the page up).
  // Only when the strip is stuck (scrolled past where it sits): at the top of the page there is nothing to measure.
  {const st=$('bg-views'),p=$('bv-'+BVIEW);if(st&&p){if(st._y==null)st._y=st.getBoundingClientRect().top+scrollY;if(scrollY>st._y-120){const sb=st.getBoundingClientRect().bottom,pt=p.getBoundingClientRect().top;if(pt<sb)scrollBy(0,pt-sb-8)}}}}
function renderCoffees(){const p=$('bv-coffees'),years=beanYears();BYEAR=BYEAR.filter(y=>years.includes(+y));
  if(!BEANS.length){p.innerHTML='<div class="bg-empty">'+beanSVG+'<b>No coffees yet</b><p>Scan a bag or add one by hand. Your earlier scans are under <button type="button" class="linkbtn" data-view="scans">Scans</button>, ready to add.</p></div>';return}
  const fs=BFILTERS.filter(([f])=>f==='all'||BEANS.some(b=>bfKeep(b,f)));BF=BF.filter(f=>fs.some(([x])=>x===f));
  p.innerHTML=shelfHTML()+advHTML()+seasonCardHTML()+'<div id="bg-yic"></div>'+trophyRowHTML()+'<div class="rhead cab-h"><h3 class="rh">All your coffees</h3><button type="button" class="sh-mini ic" data-galshare aria-label="Share your coffee gallery" title="Share">'+SH_ICO+'</button></div><div class="bg-tools">'+ltHTML('bg-lt',{q:{id:'bg-q',ph:'Search coffees, roasters, origins, notes',label:'Search your coffees',value:BQ},filter:fs.length>1||years.length>1,sort:true})+'</div><div id="bg-grid"></div>';
  // The shelf, season card and trophies above the grid have photos too: they're watched like the grid's, so a redraw
  // (after adding or editing a coffee) shows them again instead of leaving the ones off screen blank until a restart.
  hydrateImgs(p);
  renderBeanSort();
  // The year in coffee is the costliest block and sits below the fold: it's drawn once the page has opened.
  whenIdle(()=>{const e=$('bg-yic');if(e&&!e.firstChild)e.innerHTML=yearInCoffeeHTML()})}
// Sorting and filtering redraw only the cards and the chips' state, so the page doesn't jump.
// The coffee list's filter and sort, in the same sheet as every other list.
const BSORTS=[['recent','Recent'],['rated','Top rated'],['roaster','Roastery'],['origin','Origin']];
const bFilterName=()=>selName([...BF.map(f=>(BFILTERS.find(x=>x[0]===f)||[,f])[1]),...BYEAR],x=>x,'All coffees');
function renderBeanSort(){vwSet('bsort',BSORT);vwSet('byear',BYEAR);vwSet('bf',BF);ltSync('bg-lt',{on:BF.length+BYEAR.length>0,filter:bFilterName(),sort:BSORTS.find(x=>x[0]===BSORT)[1]});renderGrid()}
function openBeanFilter(){const years=beanYears(),fs=BFILTERS.filter(([f])=>f==='all'||BEANS.some(b=>bfKeep(b,f)));
  openChoices({title:'Filter coffees',one:'coffee',get:k=>k==='bf'?BF:BYEAR,set:(k,v)=>{if(k==='bf')BF=v;else BYEAR=v},render:renderBeanSort,count:()=>beanList().length,
    secs:()=>[fs.length>1?{h:'Show',key:'bf',multi:true,opts:fs.map(([f,n])=>[f,f==='all'?'All coffees':n])}:null,years.length>1?{h:'Year',key:'year',multi:true,chips:1,opts:[['all','All years'],...years.map(y=>[String(y),String(y)])]}:null]})}
function openBeanSort(){openChoices({title:'Sort coffees',one:'coffee',get:()=>BSORT,set:(k,v)=>{BSORT=v},render:renderBeanSort,count:()=>beanList().length,secs:()=>[{key:'sort',opts:BSORTS}]})}
// Idle time after the page has opened (the tab swing takes about a third of a second), or soon anyway.
const whenIdle=fn=>window.requestIdleCallback?requestIdleCallback(fn,{timeout:450}):setTimeout(fn,180);
// The first rows are drawn at once; the rest of a long gallery follows when the phone is idle.
let GRID_GEN=0;
function renderGrid(){const g=$('bg-grid');if(!g)return;const list=beanList(),gen=++GRID_GEN;let n=0;const FIRST=8;
  if(!list.length){g.innerHTML='<p class="hint">'+(BQ.trim()?'No coffees match that search.':'No coffees here yet.')+'</p>';return}
  const groups=beanGroups(list),later=[];
  g.innerHTML=groups.map(([h,l],gi)=>(h?'<div class="bg-gh"><b>'+esc(h)+'</b><span>'+l.length+'</span></div>':'')+'<div class="clist" data-g="'+gi+'">'+l.map(b=>{const i=n++;if(i<FIRST)return coffeeRow(b,false,i);later.push([gi,b,i]);return ''}).join('')+'</div>').join('');
  hydrateImgs(g);if(!later.length)return;
  whenIdle(()=>{if(gen!==GRID_GEN)return;const by=new Map();for(const [gi,b,i] of later){if(!by.has(gi))by.set(gi,'');by.set(gi,by.get(gi)+coffeeRow(b,false,i))}
    for(const [gi,h] of by){const c=g.querySelector('.clist[data-g="'+gi+'"]');if(c)c.insertAdjacentHTML('beforeend',emoIc(h))}hydrateImgs(g)})}
// One coffee as a row: the bag, its name, where it's from, and your rating. Bags you're drinking now (now=true) also
// show how fresh they are and what's left.
function coffeeRow(b,now,i){const rk=beanRank(b),f=now&&fresh(b),g=now?gramsLeft(b):null,isNew=!BSEEN.has(b.id)&&(i||0)<12;BSEEN.add(b.id);
  const meta=[b.roaster,b.origin?beanFlags(b)+' '+beanOrigin(b):'',!now&&b.process?shortName(PROCESSES[b.process].name):''].filter(Boolean).join(' · ');
  // One clean row: name with its medal and rating on the right, roaster and origin below, then (for bags you're
  // drinking) a single line of freshness and what's left, with a thin bar for the bag.
  const end=(rk?'<span class="cr-medal'+(rk>3?' r45':'')+'" style="--m:'+MEDAL[rk]+'" title="'+placeLine(rk,beanYear(b))+'">'+(rk>3?rk:CROWN)+'</span>':beanMention(b)?'<span class="cr-medal hm" title="Honourable mention, '+beanYear(b)+'">'+HM_SVG+'</span>':'')+
    (buys(b)>1?'<span class="cr-buys" title="Bought '+buys(b)+' times">'+buys(b)+'×</span>':'')+(b.rating?'<span class="cr-rate">'+beanSVG+String(b.rating).replace('.5','½')+'</span>':'');
  const bagPct=now&&g!=null&&b.bag>0?Math.max(0,Math.min(100,g/b.bag*100)):null;
  return '<button type="button" class="crow'+(now?' now':'')+(isNew?' enter':'')+'" data-bean="'+b.id+'" style="--i:'+Math.min(i||0,12)+'">'+beanPic(b,'rw')+
    '<span class="cr-tx"><span class="cr-top"><b>'+esc(beanTitle(b))+'</b>'+(end?'<span class="cr-end">'+end+'</span>':'')+'</span>'+(meta?'<small>'+esc(meta)+'</small>':'')+
      (!now&&b.flavours?'<small class="cr-notes">'+esc(b.flavours.split(/\s*[,;·]\s*/).filter(Boolean).slice(0,3).join(' · '))+'</small>':'')+
      (now?'<span class="cr-now">'+(f?'<span class="cr-fresh f-'+f.k+'"><i aria-hidden="true"></i>Day '+f.d+' · '+esc(f.label)+'</span>':'<span class="cr-fresh none"><i aria-hidden="true"></i>No roast date</span>')+(g!=null?'<span class="cr-left">'+(g?g+' g':'Bag empty')+'</span>':'')+'</span>'+
        (bagPct!=null?'<span class="cr-bar" aria-hidden="true"><i style="width:'+bagPct.toFixed(0)+'%"></i></span>':''):'')+'</span></button>'}
// The bags you're drinking now, each with its freshness and what's left.
// Drinking now: the bags you've started come first, the most used at the top (they're the ones to finish), then the
// bags not opened yet; ties go by roastery, A to Z. A bag counts as started once you've tried it or brewed from it.
function shelfOrder(){const k=new Map();for(const b of BEANS.filter(x=>x.shelf)){const g=gramsLeft(b),used=g!=null&&b.bag>0?Math.max(0,Math.min(1,1-g/b.bag)):0;
    k.set(b,{s:b.tried||used>0||beanBrews(b).length?1:0,u:used})}
  return [...k.keys()].sort((a,b)=>{const x=k.get(a),y=k.get(b);return (y.s-x.s)||(y.u-x.u)||(a.roaster||'').localeCompare(b.roaster||'',undefined,{sensitivity:'base'})||beanTitle(a).localeCompare(beanTitle(b))})}
function shelfHTML(){const sh=shelfOrder();
  return '<div class="shelf-h"><b>Drinking now</b><span>'+(sh.length?sh.length+' open bag'+(sh.length===1?'':'s'):'')+'</span>'+(sh.length?'<button type="button" class="sh-mini ic" data-shelfshare aria-label="Share what you’re drinking" title="Share">'+SH_ICO+'</button>':'')+'</div>'+
    (sh.length?'<div class="clist now">'+sh.map((b,i)=>coffeeRow(b,true,i)).join('')+'</div>'
     :'<p class="shelf-empty">The bags you’re drinking now show here, with how fresh they are and what’s left. Mark a coffee as “Drinking it” from its page.</p>')}
// The trophies you've earned, along the top of the cabinet.
// This season's challenges: what's running, how far along you are and how long is left.
function seasonCardHTML(full){const now=seasonNow(),nx=seasonNext();if(!now.length&&!nx)return '';
  const row=t=>'<div class="ssn'+(t.done?' on':'')+'"><span class="ssn-ic" aria-hidden="true">'+t.ic+'</span><span class="ssn-tx"><b>'+esc(t.w.label?t.n+': '+t.w.label:t.n)+'</b><small>'+(t.done?'Earned '+dfmt(Date.parse(TGOT[t.key]+'T12:00')):esc(t.desc))+'</small>'+
    (t.done?'':'<span class="tro-p" role="img" aria-label="'+t.h+' of '+t.need+'"><i style="width:'+(t.h/t.need*100).toFixed(0)+'%"></i></span>')+'</span><span class="ssn-n">'+(t.done?'✓':t.h+'/'+t.need)+'<small>'+(t.left?t.left+' day'+(t.left===1?'':'s')+' left':'Last day')+'</small></span></div>';
  const list=full?now:now.filter(t=>!t.done).slice(0,2);
  return '<div class="season"><div class="ssn-h"><span class="pp-k">This season</span>'+(full?'':'<button type="button" class="linkbtn" data-tro="1">All trophies</button>')+'</div>'+
    (list.length?list.map(row).join(''):'<p class="hint" style="margin:6px 0 0">Every challenge this season is done. Nice work.</p>')+
    (nx?'<p class="ssn-next">Next: '+nx.ic+' '+esc(nx.n)+(nx.w.label?' ('+esc(nx.w.label)+')':'')+', in '+nx.days+' day'+(nx.days===1?'':'s')+'</p>':'')+'</div>'}
function trophyRowHTML(){const got=TROPHIES.filter(t=>TGOT&&TGOT[t[0]]);
  return '<button type="button" class="tshelf" data-tro="1" aria-label="Trophies: '+got.length+' of '+TROPHIES.length+'. Open your trophies"><span class="ts-k">Trophies</span><span class="ts-row">'+
    (got.length?got.map(t=>'<i title="'+esc(t[1])+'">'+t[3]+'</i>').join(''):'<em>Your first comes with your first coffee</em>')+'</span><b>'+got.length+'<small>/'+TROPHIES.length+'</small></b></button>'}
function renderTop3View(){const p=$('bv-top3'),years=beanYears(),cy=new Date().getFullYear();if(BPOD==null||!(years.includes(BPOD)||BPOD===cy))BPOD=cy;
  const hist=Object.keys(TOP3).map(Number).filter(y=>y!==BPOD&&t3has(TOP3[y])).sort((a,b)=>b-a);
  p.innerHTML='<div class="crown">'+podiumHTML(BPOD,years)+'</div>'+
    (hist.length?'<h3 class="rh">Your favourites, year by year</h3><div class="t3hist">'+hist.map(y=>{const t=TOP3[y],ids=t.ids.filter(Boolean);return '<button type="button" class="t3tile" data-py="'+y+'"><span class="t3y">'+y+'</span><span class="t3av">'+
      ids.map(id=>{const b=beanById(id),s=(t.snap||[]).find(x=>x.id===id)||{};return beanPic(b||Object.assign({id,img:true,origin:''},s),'av')}).join('')+'</span><small>'+CROWN+esc(t3name(t,ids[0]))+'</small></button>'}).join('')+'</div>':'');
  hydrateImgs(p)}
/* ---------- The diary: every coffee's story in one timeline ---------- */
let DLIM=40,DYF=vwGet('dyf',[],vwStrs),DYB=null,DYI=[];const DYST={mom:'note',ph:null,t:'',d:''};
const DYFILTERS=[['all','All'],['written','Written'],['photos','Photos'],['brews','Brews'],['best','Best cups'],['dial','Dialled in']];
// Best cups: the entries you marked so, and the brews you gave five stars.
const dyKeep=(it,f)=>f==='all'||(f==='brews'?it.kind==='brew':f==='best'?(it.kind==='entry'?it.e.k==='best':+it.l.stars===5):it.kind==='entry'&&(f==='written'?!!it.e.t:f==='photos'?!!it.e.ph:it.e.k===f));
const dyBeanOrder=()=>[...BEANS].sort((a,c)=>(c.shelf-a.shelf)||beanDay(c).localeCompare(beanDay(a))||c.ts-a.ts);
// Which coffee you're writing about: the open bags first, the rest a tap away.
function dyBeansHTML(){const list=dyBeanOrder();if(!beanById(DYB))DYB=list[0].id;const sel=beanById(DYB);let l=list.slice(0,8);if(!l.includes(sel))l=[sel,...l.slice(0,7)];
  return '<div class="dmoms dbeans" id="dy-beans" role="group" aria-label="Which coffee">'+l.map(b=>'<button type="button" data-dyb="'+b.id+'" aria-pressed="'+(b.id===DYB)+'">'+beanPic(b,'xs')+'<span>'+esc(beanTitle(b))+'</span></button>').join('')+
    (list.length>8?'<button type="button" data-dyb="more">All coffees…</button>':'')+'</div>'}
function setDyBean(id){DYB=id;const r=$('dy-beans');if(!r)return;r.outerHTML=dyBeansHTML();hydrateImgs($('dy-write'))}
// A memory: what you wrote on this day in an earlier year, or else a month ago today.
function onThisDayHTML(items){const t=todayISO(),y=+t.slice(0,4),e=items.filter(it=>it.kind==='entry');
  let l=e.filter(it=>it.e.d.slice(5)===t.slice(5)&&+it.e.d.slice(0,4)<y),k='';
  if(l.length){const n=y-+l[0].e.d.slice(0,4);k='On this day · '+(n===1?'a year ago':n+' years ago')}
  else{const m=new Date(t+'T12:00');m.setMonth(m.getMonth()-1);const iso=m.getFullYear()+'-'+String(m.getMonth()+1).padStart(2,'0')+'-'+String(m.getDate()).padStart(2,'0');
    l=e.filter(it=>it.e.d===iso);k='A month ago today'}
  const it=l.find(x=>x.e.t||x.e.ph)||l[0];if(!it)return '';const b=it.bean;
  return '<button type="button" class="otd" data-bean="'+b.id+'">'+(it.e.ph?'<span class="otd-pic tl-pic" data-bimg="'+DPH(it.e.id)+'"></span>':beanPic(b,'xs'))+
    '<span class="otd-tx"><span class="otd-k">'+k+'</span><b>'+esc(beanTitle(b))+' · '+MOMENTS[it.e.k][0]+'</b>'+(it.e.t?'<small>'+esc(it.e.t)+'</small>':'')+'</span></button>'}
function renderDiaryView(){const p=$('bv-diary');if(!p)return;const items=[];
  for(const b of BEANS)for(const it of beanTimeline(b))items.push(Object.assign(it,{bean:b}));items.sort((x,y)=>y.t-x.t);DYI=items;
  const n=items.filter(i=>i.kind==='entry').length,fs=DYFILTERS.filter(([f])=>f==='all'||items.some(it=>dyKeep(it,f)));DYF=DYF.filter(f=>fs.some(([x])=>x===f));
  p.innerHTML='<div class="diary-h"><div><span class="crown-k">Your coffee diary</span><h3>'+(n?n+' entr'+(n===1?'y':'ies')+' <em>· '+(items.length-n)+' brew'+(items.length-n===1?'':'s')+'</em>':'Every bag has a story')+'</h3>'+
      '<p>'+(BEANS.length?'Opening a bag, the cup that clicked, the last one. Your logged brews join in on their own.':'Add a coffee to your gallery, then keep its story here.')+'</p></div></div>'+
    onThisDayHTML(items)+(BEANS.length?dwriteHTML('dy',DYST,dyBeansHTML()):'')+
    (fs.length>2?ltHTML('dy-lt',{filter:true}):'')+'<div id="dy-list"></div>';
  dySync();
  if(BEANS.length)wireDwrite('dy',DYST,()=>beanById(DYB),(b,msg)=>{saveBeans();checkTrophies();renderBeans();toast(msg)});
  renderDiaryList();hydrateImgs(p)}
// The timeline under the filters, by month; the newest 40 first and the rest a tap away, so a long diary opens at once.
// The diary's filter: the same button and sheet as every list, with what it's showing beside it.
const dyAny=it=>!DYF.length||DYF.some(f=>dyKeep(it,f));
const dyName=()=>selName(DYF,f=>(DYFILTERS.find(x=>x[0]===f)||[,f])[1],'Everything');
function dySync(){const n=DYI.filter(dyAny).length;ltSync('dy-lt',{on:DYF.length>0,filter:dyName(),k:dyName()+' · '+nOf(n,'item')})}
function openDiaryFilter(){openChoices({title:'Filter the diary',one:'item',get:()=>DYF,count:()=>DYI.filter(dyAny).length,
  set:(k,v)=>{DYF=v},render:()=>{DLIM=40;dySync();renderDiaryList()},secs:()=>[{key:'dyf',multi:true,opts:DYFILTERS.filter(([f])=>f==='all'||DYI.some(it=>dyKeep(it,f))).map(([f,n])=>[f,f==='all'?'Everything':n])}]})}
function renderDiaryList(){vwSet('dyf',DYF);const p=$('dy-list');if(!p)return;const items=DYI.filter(dyAny),months=new Map();
  for(const it of items.slice(0,DLIM)){const m=new Date(it.t).toLocaleDateString(undefined,{month:'long',year:'numeric'});if(!months.has(m))months.set(m,[]);months.get(m).push(it)}
  p.innerHTML=items.length?[...months].map(([m,l])=>'<h4 class="dy-m">'+esc(m)+'</h4>'+timelineHTML(l,true)).join('')+(items.length>DLIM?'<button type="button" class="btn ghost dy-more" id="dy-more">Show '+Math.min(60,items.length-DLIM)+' more</button>':'')
    :DYI.length?'<p class="hint">Nothing here yet.</p>':'<div class="bg-empty">'+beanSVG+'<b>Nothing written yet</b><p>'+(BEANS.length?'Write the first entry above, or log a brew with the coffee picked on the dial-in.':'Add a coffee first, then its story starts here.')+'</p></div>';
  hydrateImgs(p)}
// All your coffees, to choose which one the entry is about (open bags first).
function openDiaryPick(){const d=$('vd'),list=[...BEANS].sort((a,c)=>(c.shelf-a.shelf)||beanDay(c).localeCompare(beanDay(a)));
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Your diary</span><h2 id="vd-title">Which coffee is this about?</h2></div>'+
    '<div class="vd-body"><div class="t3list">'+list.map(b=>'<button type="button" class="t3opt" data-dypick="'+b.id+'" style="--m:var(--cherry)">'+beanPic(b,'xs')+'<span class="t3o-tx"><b>'+esc(beanTitle(b))+'</b><small>'+esc([b.shelf?'On the shelf':'',b.roaster].filter(Boolean).join(' · '))+'</small></span></button>').join('')+'</div></div>';
  hydrateImgs($('vd-in'));$('vd-in').querySelector('.t3list').onclick=e=>{const o=e.target.closest('[data-dypick]');if(o){$('vd').close();setDyBean(o.dataset.dypick)}};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}

/* ---------- The passport: a stamp for every origin you've had ---------- */
// Stamps are drawn once with the card's stamp, inked in the origin's colours as on a light card, and kept.
const STAMPS=new Map();
function stampURL(k){if(STAMPS.has(k))return STAMPS.get(k);let u='';
  try{const c=document.createElement('canvas');c.width=c.height=240;const x=c.getContext('2d');BC.F=getComputedStyle(document.body).fontFamily;
    bcStamp(x,120,120,cardStyle(originTheme(k),{mode:'light',col:'origin'}));u=c.toDataURL('image/png')}catch(e){}
  if(u)STAMPS.set(k,u);return u}
// A stamp not yet drawn shows as a faint ring; the real ones are drawn one at a time while the phone is idle.
const STAMP_WAIT='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><circle cx="120" cy="120" r="92" fill="none" stroke="rgba(120,80,40,.18)" stroke-width="3" stroke-dasharray="6 8"/></svg>');
const idle=f=>window.requestIdleCallback?requestIdleCallback(f,{timeout:300}):setTimeout(f,16);
function fillStamps(root){const left=[...root.querySelectorAll('img[data-stamp]')].filter(i=>!STAMPS.has(i.dataset.stamp));
  // Each stamp is a canvas drawing, so none is drawn while you're moving between pages.
  const next=()=>{if(performance.now()-NAV_AT<800){setTimeout(()=>idle(next),400);return}const im=left.shift();if(!im||!im.isConnected)return;const u=stampURL(im.dataset.stamp);root.querySelectorAll('img[data-stamp="'+im.dataset.stamp+'"]').forEach(x=>{if(u)x.src=u});if(left.length)idle(next)};
  root.querySelectorAll('img[data-stamp]').forEach(i=>{if(STAMPS.has(i.dataset.stamp))i.src=STAMPS.get(i.dataset.stamp)});if(left.length)idle(next)}
/* Trophies have their own page (a sheet), opened from the trophy row and "All trophies": the season, seasonal
   trophies and the medal grid. The passport keeps to stamps and origins. */
function trophiesHTML(){const st=cabStats(),T=TGOT||{},earned=TROPHIES.filter(t=>T[t[0]]).length;
  return seasonCardHTML(true)+(seasonEarned().length?'<h3 class="rh">Seasonal trophies <span class="hint">'+seasonEarned().length+' earned</span></h3><div class="chips ssn-got">'+seasonEarned().map(t=>'<span class="chip" title="Earned '+esc(dfmt(Date.parse(t.at+'T12:00')))+'">'+t.ic+' '+esc(t.n)+' '+esc(t.y)+'</span>').join('')+'</div>':'')+
    '<h3 class="rh">Trophies <span class="hint">'+earned+' of '+TROPHIES.length+'</span></h3><div class="trophies">'+[...TROPHIES].sort((a,b)=>(!!T[b[0]])-(!!T[a[0]])).map(([id,n,desc,ic,f])=>{const [h,need]=f(st),on=!!T[id];
      // A medal grid: earned ones in gold with the date, the rest in quiet grey with how far along you are.
      return '<div class="tro'+(on?' on':'')+'" title="'+esc(desc)+'"><span class="tro-ic" aria-hidden="true">'+ic+'</span><b>'+n+'</b>'+
        (on?'<small>'+new Date(T[id]+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})+'</small>'
          :'<small>'+esc(desc)+'</small><span class="tro-p" role="img" aria-label="'+Math.min(h,need)+' of '+need+'"><i style="width:'+Math.min(100,h/need*100).toFixed(0)+'%"></i></span>')+'</div>'}).join('')+'</div>'}
function openTrophies(){const d=$('vd'),T=TGOT||{},earned=TROPHIES.filter(t=>T[t[0]]).length;
  $('vd-in').innerHTML='<div class="vd-head" style="--c:#C9964A"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:#C9964A"></i>Your trophies</span><h2 id="vd-title">'+earned+' of '+TROPHIES.length+' earned</h2>'+
    '<p class="hint" style="margin:0">Earned by what you add, brew and buy again. Seasonal ones come round each year.</p></div><div class="vd-body tro-page">'+trophiesHTML()+'</div>';
  $('vd-x').onclick=()=>d.close();showDlg(d);d.scrollTop=0}
function renderPassport(){const p=$('bv-passport');if(!p)return;const st=cabStats(),total=Object.keys(ALLO()).length,by={};
  for(const b of BEANS)if(b.origin)(by[b.origin]=by[b.origin]||[]).push(b);
  // Every bag counts, bought-again ones included; "since" is the first of them.
  const nBags=k=>by[k].reduce((a,b)=>a+buys(b),0);
  const first=k=>by[k].map(beanFirst).sort()[0],got=Object.keys(by).sort((a,b)=>first(a).localeCompare(first(b)));
  const mon=iso=>new Date(iso+'T12:00').toLocaleDateString(undefined,{month:'short',year:'numeric'});
  const regs=Object.entries(REG).map(([rk,r])=>{const all=Object.keys(ALLO()).filter(k=>ALLO()[k].reg===rk),have=got.filter(k=>ALLO()[k]&&ALLO()[k].reg===rk).length;
    return '<span class="pp-reg"><small>'+esc(r.name.replace(' and Caribbean','').replace(' and Pacific',''))+'</small><span class="pp-rb"><i style="width:'+Math.min(100,have/all.length*100).toFixed(0)+'%;background:'+r.color+'"></i></span><b>'+have+'</b></span>'}).join('');
  // Blends: a region of their own, counted in coffees (one universal stamp for all of them).
  const nbl=(by.blend||[]).length;
  const blendReg='<span class="pp-reg pp-blend"><small>Blends</small><span class="pp-rb"><i style="width:'+(nbl?100:0)+'%;background:#4F8A74"></i></span><b>'+nbl+'</b></span>';
  // A few origins still to collect, different each day.
  const todo=Object.keys(ALLO()).filter(k=>!by[k]),seed=Math.floor(Date.now()/864e5),next=[];for(let i=0;i<Math.min(6,todo.length);i++)next.push(todo[(seed*7+i*11)%todo.length]);
  // The count is of the map's origins; countries off the map still get a stamp, counted on their own.
  const onMap=got.filter(k=>ALLO()[k]).length,T=TGOT||{},earned=TROPHIES.filter(t=>T[t[0]]).length;
  p.innerHTML='<div class="passport"><div class="pp-h"><span class="pp-k">Coffee passport</span><h3>'+onMap+' <em>of '+total+' origins'+(got.filter(k=>k!=='blend').length>onMap?' · +'+(got.filter(k=>k!=='blend').length-onMap)+' more':'')+'</em></h3><div class="pp-regs">'+regs+blendReg+'</div></div>'+
    (got.length?'<div class="pp-grid">'+got.map((k,i)=>'<button type="button" class="pp-st" data-ppo="'+k+'" style="--r:'+(((i*37)%15)-7)+'deg"><img alt="" src="'+(STAMPS.get(k)||STAMP_WAIT)+'" data-stamp="'+k+'"><b>'+esc(originName(k))+'</b><small>'+(k==='blend'?by.blend.length+' blend'+(by.blend.length===1?'':'s'):nBags(k)+' bag'+(nBags(k)===1?'':'s'))+' · since '+mon(first(k))+'</small></button>').join('')+'</div>'
      :'<p class="pp-empty">Your first stamp arrives with your first coffee.</p>')+
    (next.length?'<div class="pp-next"><b>Still to discover</b><div class="chips">'+[...new Set(next)].map(k=>'<button type="button" class="chip" data-o="'+k+'">'+(ALLO()[k].flag||'')+' '+esc(originName(k))+'</button>').join('')+'</div></div>':'')+'</div>'+
    '';fillStamps(p)}

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
  openBeanEditor(null,{name:scanTitle(s.sc,inf),roaster:scRoaster(s)||'',origin:s.sc.origin,blend:s.sc.blend||[],process:s.sc.process,variety:s.sc.variety,vars:scanVars(s.sc,inf),roast:s.sc.roast,roastDate:s.sc.date||'',
    flavours:inf&&Array.isArray(inf.tasting_notes)?inf.tasting_notes.slice(0,TN_MAX).reduce((t,n)=>{const x=t?t+', '+n:String(n);return x.length<=TN_LEN?x:t},''):'',photo,scan:s.id,lowres:!full&&!!s.t})}
$('beans-in').addEventListener('input',e=>{if(e.target.id!=='bg-q')return;BQ=e.target.value;renderGrid()});
$('beans-in').addEventListener('click',e=>{if(e.target.closest('#bg-lt-f'))openBeanFilter();else if(e.target.closest('#bg-lt-s'))openBeanSort();else if(e.target.closest('#dy-lt-f'))openDiaryFilter()});
$('beans-in').addEventListener('click',e=>{if(e.target.closest('#bg-add')){openBeanEditor();return}if(e.target.closest('#bg-scan,#bg-scan2')){showTab('scan');newScan();scrollTo(0,0);return} /* the Scan page offers taking or choosing a photo */
  const v=e.target.closest('[data-view]');if(v){BVIEW=v.dataset.view;renderBeanViews();if(v.classList.contains('tshelf'))$('bg-views').scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'});return}
  if(e.target.closest('[data-advnew]')){openCalEditor();return}const adv=e.target.closest('[data-adv]');if(adv){openCal(adv.dataset.adv);return}
  const dyb=e.target.closest('[data-dyb]');if(dyb){if(dyb.dataset.dyb==='more')openDiaryPick();else setDyBean(dyb.dataset.dyb);return}
  if(e.target.closest('#dy-more')){DLIM+=60;renderDiaryList();return}
  if(e.target.closest('[data-tro]')){openTrophies();return}
  const po=e.target.closest('[data-ppo]');if(po){openOrigin(po.dataset.ppo);return}
  const oo=e.target.closest('[data-o]');if(oo){showTab('map');selectOrigin(oo.dataset.o,true);return}
  const py=e.target.closest('[data-py]');if(py){BPOD=+py.dataset.py;renderTop3View();if(py.classList.contains('t3tile'))$('bv-top3').scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'});return}
  const t5=e.target.closest('[data-t5share]');if(t5){openShare(top5Doc(+t5.dataset.t5share));return}
  if(e.target.closest('[data-shelfshare]')){openShare(shelfDoc());return}
  if(e.target.closest('[data-galshare]')){openShare(galleryDoc());return}
  const t=e.target.closest('[data-top3]');if(t){openTop3(+t.dataset.top3,t.dataset.slot==='hm'?'hm':+(t.dataset.slot||0));return}
  const sa=e.target.closest('[data-scanadd]');if(sa){addScanToGallery(+sa.dataset.scanadd);return}
  const sc=e.target.closest('[data-scan]');if(sc){openSavedScan(+sc.dataset.scan);return}
  const b=e.target.closest('[data-bean]');if(b){const id=b.dataset.bean;tapOpen(b,()=>openBean(id))}});

/* ---------- One coffee ---------- */
function beanLogStats(b){const n=b.name.toLowerCase();if(n.length<3)return null;const l=LOG.filter(x=>(x.coffee||'').toLowerCase().includes(n));if(!l.length)return null;
  const r=l.filter(x=>x.rating);return{n:l.length,avg:r.length?r.reduce((s,x)=>s+x.rating,0)/r.length:0}}
// A coffee's page. write: open it at the diary, ready to write.
/* A stamp in the passport opens its origin: every coffee you've had from there, newest first. A coffee opened from
   here has a "‹ Yemen" button back to the list, and closing the sheet (or the back button) returns to the passport. */
let BFROM=null;$('vd').addEventListener('close',()=>{BFROM=null});
function openOrigin(k){const d=$('vd'),o=oInfo(k);if(!o)return;BFROM=k;const list=BEANS.filter(b=>b.origin===k).sort((a,c)=>beanDay(c).localeCompare(beanDay(a))||c.ts-a.ts);
  const bags=list.reduce((a,b)=>a+buys(b),0),first=list.length?list.map(beanFirst).sort()[0]:'',R=REG[o.reg],rated=list.filter(b=>b.rating),avg=rated.length?rated.reduce((a,b)=>a+b.rating,0)/rated.length:0;
  $('vd-in').innerHTML='<div class="vd-head" style="--c:'+(R?R.color:'var(--cherry)')+'"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:'+(R?R.color:'var(--cherry)')+'"></i>'+(R?esc(R.name):k==='blend'?'Blends':'Origin')+'</span>'+
    '<h2 id="vd-title"><span class="og-fl">'+flagOf(k)+'</span> '+esc(originName(k))+'</h2><p class="hint" style="margin:0">'+list.length+' coffee'+(list.length===1?'':'s')+(bags>list.length?' · '+bags+' bags':'')+(first?' · since '+new Date(first+'T12:00').toLocaleDateString(undefined,{month:'short',year:'numeric'}):'')+(avg?' · rated '+avg.toFixed(1)+' on average':'')+'</p></div>'+
    '<div class="vd-body"><div class="clist og-list">'+list.map((b,i)=>coffeeRow(b,false,i)).join('')+'</div>'+(k==='blend'?'':'<div class="actions"><button type="button" class="btn ghost" id="og-map">'+esc(originName(k))+' on the map</button></div>')+'</div>';
  hydrateImgs($('vd-in'));$('vd-in').onclick=e=>{if(!$('vd-in').querySelector('.og-list'))return;const r=e.target.closest('[data-bean]');if(r){BFROM=k;openBean(r.dataset.bean);return}if(e.target.closest('#og-map')){d.close();goTab('map');setTimeout(()=>{try{selectOrigin(k,true)}catch(x){}},350)}};
  $('vd-x').onclick=()=>d.close();showDlg(d);d.scrollTop=0}
function openBean(id,write){const b=beanById(id);if(!b)return;$('vd').dataset.bean=b.id;const d=$('vd'),rk=beanRank(b),P=b.process&&PROCESSES[b.process],ls=beanLogStats(b),f=b.shelf&&fresh(b);
  const cal=b.cal&&calById(b.cal.id);
  const fmt=s=>s?new Date(s+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';
  const kv=[isBlend(b)?['Blend of',blendParts(b).map(x=>flagOf(x.o)+' '+originName(x.o)+(x.r?' ('+x.r+')':'')).join(', ')||'Several origins']:['Origin',b.origin?flagOf(b.origin)+' '+originName(b.origin):''],['Process',P?P.name:''],[b.vars?'Varieties':'Variety',b.variety?varsName(b):''],['Roast',b.roast?b.roast[0].toUpperCase()+b.roast.slice(1):''],['Roasted',fmt(b.roastDate)],['Tried',b.tried?fmt(b.tried):'Not yet'],...(cal?[['Advent','Door '+b.cal.d+' · '+calName(cal)]]:[]),['Brewed',ls?ls.n+' time'+(ls.n===1?'':'s'):'']].filter(x=>x[1]);
  const st={mom:'note',ph:null};const g=gramsLeft(b),dose=Math.round(beanDose(b));
  const from=BFROM&&BFROM===b.origin?BFROM:null,calBack=cal&&ADVFROM===cal.id;
  $('vd-in').innerHTML='<div class="vd-head" style="--c:'+(rk?MEDAL[rk]:'var(--cherry)')+'"><button class="vd-close" id="vd-x" aria-label="Close">✕</button>'+(calBack?'<button type="button" class="vd-back adv-back" id="bd-advback">‹ Calendar</button>':from?'<button type="button" class="vd-back" id="vd-back">‹ '+esc(originName(from))+'</button>':'')+'<span class="vd-tools"><button type="button" class="vd-tool" id="bd-share" aria-label="Share this coffee" title="Share">'+lIc('share')+'</button><button type="button" class="vd-tool" id="bd-edit" aria-label="Edit this coffee" title="Edit">'+lIc('edit')+'</button></span><span class="pill"><i style="background:'+(rk?MEDAL[rk]:'var(--cherry)')+'"></i>'+(rk?placeLine(rk,beanYear(b)):beanMention(b)?'Honourable mention · '+beanYear(b):b.shelf?'Drinking now':'Your coffees')+'</span><h2 id="vd-title">'+esc(beanTitle(b))+'</h2>'+(b.roaster?'<p class="vd-sub">'+esc(b.roaster)+'</p>':'')+'</div>'+
    '<div class="vd-body"><div class="bd-hero">'+beanPic(b,'hero')+(b.rating?'<span class="bglass">'+beanSVG+b.rating.toString().replace('.5','½')+'<small>'+rateWord(b.rating)+'</small></span>':'')+'</div>'+
    // The bag now: how fresh it is, what's left, and finishing it.
    (b.shelf?'<div class="bd-shelf">'+(f?'<div class="bd-f"><div class="bd-fh"><b>'+f.label+'</b><span>Day '+f.d+' off roast</span></div>'+freshBar(f)+'<p>'+f.tip+'</p><small class="bd-fw">'+freshWinLine(f)+'</small></div>':'<label class="bd-addrd"><span><b>When was it roasted?</b><small>Add the date on the bag to see how fresh it is.</small></span><input type="date" id="bd-rd" class="dateinp" max="'+todayISO()+'" aria-label="Roast date"></label>')+
      (g!=null?'<div class="bd-bag"><div class="bd-bagh">'+bagLine(b)+'<button type="button" class="linkbtn" id="bd-left">Set what’s left</button></div><div class="bd-cupr"><span class="bd-cupl">Brewed a cup with</span><span class="bd-step"><button type="button" id="bd-cm" aria-label="Less coffee">−</button><b id="bd-cg">'+dose+' g</b><button type="button" id="bd-cp" aria-label="More coffee">+</button></span><button type="button" class="btn" id="bd-cup">Take it off</button></div>'+
        '<p class="bd-auto">Brews you log or finish with the dial-in’s timer come off on their own.</p></div>'
        :'<p class="hint" style="margin:8px 0 0">Add the bag size in Edit to see what’s left as you log brews.</p>')+
      '<button type="button" class="btn ghost bd-done" id="bd-done">🏁 Finish the bag</button></div>'
     :'')+
    (kv.length?'<div class="specs">'+kv.map(([k,v])=>'<div><b>'+k+'</b><span class="bd-v">'+esc(v)+'</span></div>').join('')+'</div>':'')+
    (b.flavours?'<h3>Tasting notes</h3><div class="chips">'+tnSplit(b.flavours).map(f=>{const n=tnLeaf(f);return'<span class="chip">'+(n?'<i class="dot" style="background:'+n.c+'"></i>':'')+esc(f)+'</span>'}).join('')+'</div>':'')+
    (b.notes?'<h3>Your notes</h3><p>'+esc(b.notes)+'</p>':'')+
    // Your bags: how many times you've bought it (set it for bags from before the app), buying it again when it's
    // finished, and the earlier bags folded away.
    '<div class="bd-buys"><div class="bd-bh"><span class="bd-bi" aria-hidden="true">🛍️</span><span class="bd-bt"><b>Bought '+(buys(b)===1?'once':buys(b)+' times')+'</b><small>'+(b.prior?'Including '+b.prior+' before the app':'Count bags from before the app too')+'</small></span>'+
      '<span class="stepper bd-bst"><button type="button" id="bd-bm" aria-label="One less time bought"'+(b.prior?'':' disabled')+'>−</button><output id="bd-bn" aria-live="polite">'+buys(b)+'</output><button type="button" id="bd-bp" aria-label="One more time bought">+</button></span></div>'+
      (b.shelf?'':'<div class="bd-rbrow"><button type="button" class="btn ghost" id="bd-rbopen" aria-expanded="false">Bought it again</button><button type="button" class="btn ghost" id="bd-shelf">Back on the shelf</button></div>'+
        '<div class="bd-rbform" id="bd-rbform" hidden><div class="two"><div class="field"><label for="bd-rb-rd">New roast date</label><input type="date" id="bd-rb-rd" max="'+todayISO()+'"></div>'+
        '<div class="field"><label for="bd-rb-g">Bag size (g)</label><input type="number" id="bd-rb-g" inputmode="numeric" min="50" max="5000" step="10" value="'+(b.bag||'')+'" placeholder="250"></div></div>'+
        '<button type="button" class="btn" id="bd-rebuy">Add the new bag</button></div>')+
      (b.bags&&b.bags.length?'<details class="bd-bagsd"><summary>Earlier bags ('+b.bags.length+')</summary><ol class="bd-bags">'+b.bags.slice().reverse().map((x,i)=>'<li><b>'+ordinal(b.bags.length-i)+' bag</b><span>'+[x.rd?'Roasted '+fmtD(x.rd):'',x.g?x.g+' g':'',x.off?'finished '+fmtD(x.off):''].filter(Boolean).join(' · ')+'</span></li>').join('')+'</ol></details>':'')+'</div>'+
    '<div class="actions bd-acts"><button class="btn" id="bd-brew">Brew it in the dial-in</button><button class="btn ghost" id="bd-mkrec">Create a recipe</button></div>'+
    // Its diary: a moment, a few words, the day.
    '<h3 id="bd-dh">Diary</h3>'+dwriteHTML('bd',st)+
    '<div id="bd-tl">'+timelineHTML(beanTimeline(b),false)+'</div>'+
    // Android: keep this coffee on the Drinking now widget instead of the one brewed most recently.
    (plugin('Widget')&&b.shelf?'<button type="button" class="btn ghost bd-wpin" id="bd-wpin">'+(wPinned()===b.id?'On your Drinking now widget · Let it choose again':'Show on the Drinking now widget')+'</button>':'')+
    '<button type="button" class="linkbtn danger" id="bd-del">Remove from the gallery</button></div>';
  hydrateImgs($('vd-in'));
  if($('bd-wpin'))$('bd-wpin').onclick=()=>{const on=wPinned()!==b.id;try{on?localStorage.setItem('bb-wbean',b.id):localStorage.removeItem('bb-wbean')}catch(e){}updWidget();
    $('bd-wpin').textContent=on?'On your Drinking now widget · Let it choose again':'Show on the Drinking now widget';toast(on?'Drinking now shows '+beanTitle(b):'Drinking now shows the coffee you brewed last')};
  const refresh=(msg)=>{saveBeans();checkTrophies();renderBeans();openBean(b.id);if(msg)toast(msg)};
  if($('bd-rd'))$('bd-rd').onchange=e=>{const v=e.target.value;if(!/^\d{4}-\d\d-\d\d$/.test(v)||v>todayISO())return;b.roastDate=v;refresh('Roast date added')};
  $('bd-edit').onclick=()=>{if(calBack)ADVRET=cal.id;openBeanEditor(b)};
  $('bd-mkrec').onclick=()=>openMakeRecipe(b.id);
  $('bd-share').onclick=()=>{d.close();openShare(beanDoc(b))};
  $('bd-brew').onclick=()=>{useBean(b);d.close();showTab('dial');
    if(!dialRec()){const t=techList(S.brewer)[0];if(t)S.rec=t[1]}if(dialRec())tune('Tuned for '+beanTitle(b));else{render();toast('Set up for '+beanTitle(b))}};
  // Tapping the chosen answer again clears it.
  // A cup brewed without logging it: you set the grams (it starts at your usual dose) and it comes off the bag.
  let cupG=dose;const cupShow=()=>{$('bd-cg').textContent=gfmt(cupG)+' g'};
  if($('bd-cm')){$('bd-cm').onclick=()=>{cupG=Math.max(1,cupG-1);cupShow()};$('bd-cp').onclick=()=>{cupG=Math.min(100,cupG+1);cupShow()}}
  if($('bd-cup'))$('bd-cup').onclick=()=>{setLeft(b,Math.max(0,(gramsLeft(b)||0)-cupG));refresh('Took '+gfmt(cupG)+' g off the bag')};
  if($('bd-left'))$('bd-left').onclick=()=>askSheet({title:'What’s left in the bag?',text:'Weigh the bag, or a good guess. Brews from here on come off this.',ok:'Save',input:{value:gramsLeft(b)??'',unit:'g',step:5,min:0,max:5000,label:'Grams left'}}).then(n=>{if(n==null)return;setLeft(b,n);refresh('Updated')});
  if($('bd-done'))$('bd-done').onclick=()=>{b.shelf=false;const ol=b.diary.find(e=>e.k==='opened'||e.k==='last');if(!ol||ol.k!=='last')b.diary.unshift(okEntry({k:'last',d:todayISO(),t:''}));refresh('Finished: it’s in the cabinet now. Add how it ended in its diary')};
  if($('bd-shelf'))$('bd-shelf').onclick=()=>{b.shelf=true;refresh('Back on the shelf')};
  if($('bd-rbopen'))$('bd-rbopen').onclick=e=>{const f=$('bd-rbform'),o=f.hidden;f.hidden=!o;e.currentTarget.setAttribute('aria-expanded',o);if(o)f.scrollIntoView({block:'nearest',behavior:RM()?'auto':'smooth'})};
  const setPrior=v=>{b.prior=Math.max(0,Math.min(99,v));saveBeans();checkTrophies();renderBeans();const n=buys(b);$('bd-bn').textContent=n;$('bd-bm').disabled=!b.prior;
    document.querySelector('.bd-bt b').textContent='Bought '+(n===1?'once':n+' times');document.querySelector('.bd-bt small').textContent=b.prior?'Including '+b.prior+' before the app':'Count bags from before the app too'};
  $('bd-bm').onclick=()=>setPrior((b.prior||0)-1);$('bd-bp').onclick=()=>setPrior((b.prior||0)+1);
  if($('bd-rebuy'))$('bd-rebuy').onclick=()=>{const rd=$('bd-rb-rd').value,g=+$('bd-rb-g').value;
    if(rd&&(!/^\d{4}-\d\d-\d\d$/.test(rd)||rd>todayISO())){toast('Pick a roast date that isn’t in the future');return}
    rebuyBean(b,rd,g>=50&&g<=5000?Math.round(g):0);refresh('New bag on the shelf: it’s in Drinking now')};
  wireDwrite('bd',st,()=>b,(_,msg)=>{refresh(msg);setTimeout(()=>{const h=$('bd-dh');if(h)h.scrollIntoView({block:'start'})},50)});
  $('bd-tl').onclick=e=>{const x=e.target.closest('[data-deldiary]');if(!x)return;const id=x.dataset.deldiary;const was=b.diary,gone=was.filter(en=>en.id===id);b.diary=was.filter(en=>en.id!==id);refresh();
    undoToast('Diary entry deleted',()=>{const cur=BEANS.find(x=>x.id===b.id);if(!cur)return;cur.diary=was;saveBeans();checkTrophies();renderBeans();if($('vd').open&&$('bd-tl')&&$('vd').dataset.bean===b.id)openBean(b.id)},()=>dropDiaryPhotos(gone))};
  $('bd-del').onclick=()=>{const inTop=inAnyTop(b.id);
    const i=BEANS.findIndex(x=>x.id===b.id);if(i<0)return;BEANS=BEANS.filter(x=>x.id!==b.id);saveBeans();d.close();renderBeans();
    undoToast('Removed “'+beanTitle(b)+'”',()=>{if(BEANS.some(x=>x.id===b.id))return;BEANS.splice(Math.min(i,BEANS.length),0,b);saveBeans();renderBeans()},
      ()=>{if(BEANS.some(x=>x.id===b.id))return;if(!inTop)BIMG.del(b.id);dropDiaryPhotos(b.diary||[])})};
  showDlg(d);$('vd-x').onclick=()=>d.close();if($('vd-back'))$('vd-back').onclick=()=>openOrigin(from);if($('bd-advback'))$('bd-advback').onclick=()=>openCal(cal.id,{back:b.cal.d});
  if(write)setTimeout(()=>{const h=$('bd-dh');if(h){h.scrollIntoView({block:'start'});$('bd-dt').focus({preventScroll:true})}},80);else d.scrollTop=0}
function beanDoc(b){const P=b.process&&PROCESSES[b.process];
  return{title:beanTitle(b),sub:(b.roaster?b.roaster+' | ':'')+'Rated '+(b.rating||'–')+' of 5',file:'coffee-'+beanTitle(b),
    card:()=>beanCardImg(b),cardTheme:()=>originTheme(b.origin),cardName:'coffee-card',cardTitle:'Coffee card',cardSub:'This coffee as one image: the bag, your rating in beans, where it’s from and what you tasted.',
    blocks:[{kv:[isBlend(b)?['Blend of',beanOrigin(b,true)||'Several origins']:['Origin',b.origin?originName(b.origin):'-'],['Process',P?P.name:'-'],[b.vars?'Varieties':'Variety',b.variety?varsName(b):'-'],['Roast',b.roast||'-']]},...(b.flavours?[{h:'Tasting notes',p:b.flavours}]:[]),...(b.notes?[{h:'Notes',p:b.notes}]:[])]}}

// The year's favourites, shared: the five in order (a coffee since removed from the gallery keeps its snapshot), then
// the honourable mentions.
function t5Items(y){const t=TOP3[y];if(!t)return[];return t.ids.map((id,i)=>{if(!id)return null;const b=beanById(id),s=(t.snap||[]).find(x=>x.id===id)||{};
  return{rk:i+1,id,b,name:t3name(t,id),roaster:(b?b.roaster:s.roaster)||'',origin:(b?b.origin:s.origin)||'',rating:+(b?b.rating:s.rating)||0}}).filter(Boolean)}
const t5Hm=y=>{const t=TOP3[y];return t?hmOf(t).map(id=>t3name(t,id)):[]};
function top5Doc(y){const it=t5Items(y),hm=t5Hm(y),line=x=>'#'+x.rk+' '+x.name+([x.roaster,x.origin?originName(x.origin):''].filter(Boolean).length?' ('+[x.roaster,x.origin?originName(x.origin):''].filter(Boolean).join(', ')+')':'')+(x.rating?' · '+x.rating+' of 5':'');
  return{heavy:true,title:'My top 5 of '+y,sub:it.length+' favourite coffee'+(it.length===1?'':'s')+(hm.length?' and '+hm.length+' honourable mention'+(hm.length===1?'':'s'):''),file:'top-5-'+y,
    card:()=>top5CardImg(y),cardTheme:()=>originTheme(it[0]&&it[0].origin),cardName:'top-5-'+y,cardTitle:'Top 5 card',cardSub:'Your favourite coffees of '+y+' as one image: in order, with your ratings and your honourable mentions.',
    blocks:[{h:'Top 5 of '+y,list:it.map(line)},...(hm.length?[{h:'Honourable mentions',list:hm}]:[])]}}
// What's on the shelf, shared: every bag you're drinking, in the shelf's order, with how fresh it is and what's left.
function shelfLine(b){const f=fresh(b),g=gramsLeft(b);return[b.roaster,b.origin?originName(b.origin):'',f?'Day '+f.d+', '+f.label.toLowerCase():'',g!=null?(g?g+' g left':'bag empty'):''].filter(Boolean).join(' · ')}
function shelfDoc(){const sh=shelfOrder();
  return{heavy:true,title:'What I’m drinking now',sub:sh.length+' open bag'+(sh.length===1?'':'s'),file:'drinking-now',
    card:()=>shelfCardImg(),cardTheme:()=>originTheme(sh[0]&&sh[0].origin),cardName:'drinking-now',cardTitle:'Shelf card',cardSub:'The bags you’re drinking as one image: each coffee, how fresh it is, what’s left and your rating.',
    blocks:[{h:'Drinking now',list:sh.map(b=>beanTitle(b)+(shelfLine(b)?' ('+shelfLine(b)+')':'')+(b.rating?' · '+b.rating+' of 5':''))}]}}

// The whole gallery, shared: every coffee you've collected, grouped by roastery.
// By roastery, A to Z (coffees without one last); within a roastery, the newest first.
function galleryOrder(){const r=b=>(b.roaster||'').trim();return [...BEANS].sort((a,b)=>(!r(a))-(!r(b))||r(a).localeCompare(r(b),undefined,{sensitivity:'base'})||beanDay(b).localeCompare(beanDay(a))||(b.ts||0)-(a.ts||0))}
function galleryDoc(){const all=galleryOrder();
  return{title:'My coffee gallery',sub:all.length+' coffee'+(all.length===1?'':'s'),file:'coffee-gallery',heavy:all.length>16,
    card:()=>galleryCardImg(),pdfCard:all.length>120?()=>galleryCardImg(true):null,cardTheme:()=>originTheme(all[0]&&all[0].origin),cardName:'coffee-gallery',cardTitle:'Gallery card',cardSub:'Every coffee you’ve collected, by roastery, hung like prints on a wall: each with its photo, origin and your rating, the top 5s marked.',
    blocks:[{h:'My coffees',list:all.map(b=>beanTitle(b)+([b.roaster,b.origin?originName(b.origin):''].filter(Boolean).length?' ('+[b.roaster,b.origin?originName(b.origin):''].filter(Boolean).join(', ')+')':'')+(b.rating?' · '+b.rating+' of 5':''))}]}}

// Brewing a gallery coffee: the dial-in takes its process, variety, roast and age, and remembers which coffee it is.
function useBean(b){S.bean=okSBean({name:beanTitle(b),roaster:b.roaster,origin:b.origin,id:b.id});S.bsig='';S.bday='';beanSync()}
// Pick the beans for the dial-in from the gallery: the bags you're drinking now first, then the rest, most recent first.
// pick: what to do with the chosen coffee (the brew log uses it); without it, the dial-in brews it.
function openBeanPick(pick){const d=$('vd'),list=[...BEANS].sort((a,c)=>beanDay(c).localeCompare(beanDay(a))||c.ts-a.ts);
  // A bag you're drinking shows how fresh it is and what's left, which matter more than its rating when you pick one.
  const pkMeta=b=>{const f=fresh(b),g=gramsLeft(b),m=[f?freshPill(f):'',g!=null?'<span class="pk-left">'+(g?g+' g left':'Bag empty')+'</span>':''].join('');return m?'<span class="pk-meta">'+m+'</span>':''};
  const opt=b=>'<button type="button" class="t3opt'+(S.bean&&S.bean.id===b.id?' on':'')+'" data-usebean="'+b.id+'" style="--m:var(--cherry)">'+beanPic(b,'xs')+'<span class="t3o-tx"><b>'+esc(beanTitle(b))+'</b><small>'+esc([b.roaster,b.origin?originName(b.origin):''].filter(Boolean).join(' · '))+'</small>'+(b.shelf&&pkMeta(b)||beanRow(b.rating,'sm'))+'</span></button>';
  const now=list.filter(b=>b.shelf),rest=list.filter(b=>!b.shelf);
  // With both kinds of coffee, each gets a heading; with only one kind, the list stands on its own.
  const grp=(h,l)=>l.length?(now.length&&rest.length?'<div class="bg-gh bp-gh"><b>'+h+'</b><span>'+l.length+'</span></div>':'')+'<div class="t3list">'+l.map(opt).join('')+'</div>':'';
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Your beans</span><h2 id="vd-title">'+(pick?'Which coffee did you brew?':'Which coffee are you brewing?')+'</h2><p class="vd-sub">'+(pick?'Its tasting notes show beside what you tasted.':'Its process, variety and roast tune the recipe, and it shows on your brew cards.')+'</p></div>'+
    '<div class="vd-body" id="bp-body">'+grp('Drinking now',now)+grp('Your other coffees',rest)+'</div>';
  hydrateImgs($('vd-in'));$('bp-body').onclick=e=>{const o=e.target.closest('[data-usebean]');if(!o)return;const b=beanById(o.dataset.usebean);if(!b)return;if(pick){d.close();pick(b);return}useBean(b);d.close();
    if(dialRec())tune('Brewing '+beanTitle(b));else{render();toast('Brewing '+beanTitle(b))}};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}
document.addEventListener('click',e=>{if(e.target.closest('#d-bean [data-dbpick]')){openBeanPick();return}if(e.target.closest('#d-bean [data-dbclear]')){S.bean=null;render()}});

/* ---------- Adding and editing ---------- */
// pre: details to start from (a scan); its photo comes as a data URL in pre.photo.
function openBeanEditor(b,pre){const isNew=!b;const B=Object.assign({name:'',roaster:'',origin:'',blend:[],process:'',variety:'',vars:[],roast:'',roastDate:'',tried:'',rating:0,flavours:'',notes:'',img:false,shelf:true,bag:0},b||{},pre||{});
  let photo=null,photoChanged=false,rating=B.rating;const d=$('vd');
  const opt=(h,none)=>'<option value="">'+none+'</option>'+h;
  const roasters=[...new Set([...BEANS.map(x=>x.roaster),...SCANS.map(scRoaster)].filter(Boolean))].sort();
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Bean gallery</span><h2 id="vd-title">'+(isNew?(B.cal?'Door '+B.cal.d+': add its coffee':'Add a coffee'):'Edit '+esc(beanTitle(B)))+'</h2></div>'+
   '<div class="vd-body beform"><div class="be-photo" id="be-photo"><span class="bph">'+beanSVG+'<small>Add a photo of the bag</small></span></div>'+
   '<div class="actions two-up"><button type="button" class="btn ghost" id="be-cam">Take a photo</button><button type="button" class="btn ghost" id="be-pick">Choose a photo</button></div>'+
   '<input type="file" id="be-camf" accept="image/*" capture="environment" hidden><input type="file" id="be-file" accept="image/*" hidden>'+
   '<div class="field"><div class="lbl">Your rating</div><div class="beanrate" id="be-rate"></div></div>'+
   '<div class="two stackm"><div class="field"><label for="be-name">Coffee name</label><input id="be-name" maxlength="60" value="'+esc(B.name)+'" autocomplete="off"></div>'+
   '<div class="field"><label for="be-roaster">Roastery</label><div class="acw"><input id="be-roaster" maxlength="50" value="'+esc(B.roaster)+'" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="be-rsug"><div class="acl" id="be-rsug" role="listbox" aria-label="Roasteries you’ve had" hidden></div></div></div></div>'+
   '<div class="field"><div class="lbl" id="be-olbl">Origin</div><div class="bvars" id="be-origins" role="group" aria-labelledby="be-olbl"></div>'+
   // A second origin makes it a blend (up to four), the same way varieties are added.
   '<button type="button" class="bv-add" id="be-addo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Add another origin</button></div>'+
   '<div class="field"><label for="be-process">Process</label><select id="be-process">'+opt(processOptions(),'Not sure')+'</select></div>'+
   '<div class="field"><div class="lbl" id="be-vlbl">Variety</div><div class="bvars" id="be-vars" role="group" aria-labelledby="be-vlbl"></div>'+
   '<button type="button" class="bv-add" id="be-addv"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Add another variety</button></div>'+
   '<div class="field"><div class="lbl">Roast</div><div class="seg" id="be-roast"></div></div>'+
   '<div class="two"><div class="field"><label for="be-rdate">Roasted on</label><input type="date" id="be-rdate" class="dateinp" value="'+B.roastDate+'" max="'+todayISO()+'"></div><div class="field"><label for="be-tried">Tried on</label><input type="date" id="be-tried" class="dateinp" value="'+B.tried+'" max="'+todayISO()+'"></div></div>'+
   '<div class="two bagrow"><div class="field"><label for="be-bag">Bag size <span class="hint">grams</span></label><input id="be-bag" type="number" inputmode="numeric" min="0" max="5000" step="1" value="'+(B.bag||'')+'"></div>'+
   '<div class="field"><div class="lbl">On the shelf</div><div class="seg" id="be-shelf"></div></div></div>'+
   '<div class="field tn"><div class="tn-head"><label for="tn-q">Tasting notes</label><span class="hint" id="tn-n"></span></div><div id="be-fl"></div></div>'+
   '<div class="field"><label for="be-notes">Your notes</label><textarea id="be-notes" rows="3" maxlength="600" placeholder="How you brewed it, what you loved, would you buy it again?">'+esc(B.notes)+'</textarea></div>'+
   '<div class="actions"><button class="btn" id="be-save">'+(isNew?'Add to the gallery':'Save changes')+'</button><button class="btn ghost" id="be-cancel">Cancel</button></div></div>';
  $('be-process').value=B.process;
  autoList($('be-roaster'),$('be-rsug'),roasters);
  // Origins: one picker to start; adding a second makes the coffee a blend (up to four), each removable.
  const oOpts=opt(originOptions(),'Not sure');let OL=isBlend(B)?blendParts(B).map(x=>x.o):[B.origin==='blend'?'':B.origin||''];if(!OL.length)OL=[''];
  const readOrigins=()=>{OL=[...$('be-origins').querySelectorAll('select')].map(x=>x.value)};
  const drawOrigins=()=>{const many=OL.length>1;$('be-origins').innerHTML=OL.map((o,i)=>'<div class="bvar"><select data-oi="'+i+'" aria-label="'+(many?'Origin '+(i+1):'Origin')+'">'+oOpts+'</select>'+(many?'<button type="button" class="bvar-x" data-ox="'+i+'" aria-label="Remove origin '+(i+1)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>':'')+'</div>').join('');
    $('be-origins').querySelectorAll('select').forEach((x,i)=>x.value=OL[i]);$('be-olbl').textContent=many?'Origins (a blend)':'Origin';$('be-addo').hidden=OL.length>=4};
  drawOrigins();
  $('be-addo').onclick=()=>{readOrigins();OL.push('');drawOrigins();const l=$('be-origins').querySelectorAll('select');l[l.length-1].focus()};
  $('be-origins').onclick=e=>{const x=e.target.closest('[data-ox]');if(!x)return;readOrigins();OL.splice(+x.dataset.ox,1);if(!OL.length)OL=[''];drawOrigins();TN.suggest()};
  // What the form says now: one origin, or a blend of the different origins picked.
  const pickedOrigins=()=>{readOrigins();return[...new Set(OL.filter(Boolean))]};
  const TN=tasteInput($('be-fl'),B.flavours,()=>({origin:pickedOrigins()[0]||'',origins:pickedOrigins(),process:$('be-process').value,vars:[...$('be-vars').querySelectorAll('select')].map(x=>x.value).filter(Boolean)}));
  ['be-origins','be-process','be-vars'].forEach(id=>$(id).addEventListener('change',()=>TN.suggest()));
  // Varieties: one picker to start; a blend or mixed lot adds more, up to four, each removable.
  // The pickers list each variety once; a regional Geisha (geisha:panama) shows as Geisha and keeps its region when saved.
  const vOpts=opt(varietyOptions(),'Not sure'),ORIG=beanVars(B),base=v=>String(v||'').split(':')[0];let VL=[...ORIG];if(!VL.length)VL=[''];
  const readVars=()=>{VL=[...$('be-vars').querySelectorAll('select')].map(x=>x.value&&(ORIG.find(o=>base(o)===x.value)||x.value))};
  const drawVars=()=>{const many=VL.length>1;$('be-vars').innerHTML=VL.map((v,i)=>'<div class="bvar"><select data-vi="'+i+'" aria-label="'+(many?'Variety '+(i+1):'Variety')+'">'+vOpts+'</select>'+(many?'<button type="button" class="bvar-x" data-vx="'+i+'" aria-label="Remove variety '+(i+1)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>':'')+'</div>').join('');
    $('be-vars').querySelectorAll('select').forEach((x,i)=>x.value=base(VL[i]));$('be-vlbl').textContent=many?'Varieties':'Variety';$('be-addv').hidden=VL.length>=4};
  drawVars();
  $('be-addv').onclick=()=>{readVars();VL.push('');drawVars();const l=$('be-vars').querySelectorAll('select');l[l.length-1].focus()};
  $('be-vars').onclick=e=>{const x=e.target.closest('[data-vx]');if(!x)return;readVars();VL.splice(+x.dataset.vx,1);if(!VL.length)VL=[''];drawVars()};
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
  $('be-cancel').onclick=()=>{if(ADVRET&&B.cal&&calById(B.cal.id)){const c=ADVRET;ADVRET=null;if(isNew)openCal(c,{back:B.cal.d});else calBackTo(b)}else d.close()};
  $('be-save').onclick=async()=>{const n=okBean({id:b?b.id:uid().replace(/[^a-z0-9]/g,'').slice(0,20),name:$('be-name').value,roaster:$('be-roaster').value,...(o=>o.length>1?{origin:'blend',blend:o.map(x=>({o:x}))}:{origin:o[0]||''})(pickedOrigins()),process:$('be-process').value,...(readVars(),{variety:VL.filter(Boolean)[0]||'',vars:VL.filter(Boolean).slice(1)}),
      roast:B.roast,roastDate:$('be-rdate').value,tried:$('be-tried').value,rating,flavours:TN.val(),notes:$('be-notes').value,img:photoChanged?!!photo:B.img,scan:B.scan||'',ts:b?b.ts:Date.now(),
      shelf:B.shelf,bag:$('be-bag').value,left:b?b.left:null,leftAt:b?b.leftAt:0,again:b?b.again:'',diary:b?b.diary:[],cups:b?b.cups:[],bags:b?b.bags:[],prior:b?b.prior:0,cal:B.cal});
    if(!n.name&&!n.origin&&!photo){toast('Add a name, an origin or a photo first');$('be-name').focus();return}
    let note='';if(photoChanged){if(photo){if(!await BIMG.put(n.id,photo)){n.img=false;note=', but the photo couldn’t be saved on this device'}}else if(!inAnyTop(n.id))BIMG.del(n.id)}
    // Moved to another year: it leaves the old year's top 3, where it no longer belongs.
    if(b&&beanYear(b)!==beanYear(n)){const t=TOP3[beanYear(b)],k=t?t.ids.indexOf(n.id):-1,h=t?(t.hm||[]).indexOf(n.id):-1;if(k>=0||h>=0){if(k>=0)t.ids[k]='';else (t.hm||[]).splice(h,1);t.snap=(t.snap||[]).filter(x=>x.id!==n.id);if(!t3has(t))delete TOP3[beanYear(b)];note+='. It left your favourites of '+beanYear(b)}}
    const i=BEANS.findIndex(x=>x.id===n.id);if(i>=0)BEANS[i]=n;else BEANS.unshift(n);if(!saveBeans())return;
    // A crowned coffee keeps its podium snapshot up to date.
    for(const t of Object.values(TOP3)){const s=(t.snap||[]).find(x=>x.id===n.id);if(s)Object.assign(s,{name:beanTitle(n),roaster:n.roaster,origin:n.origin,rating:n.rating})}saveTop3();
    // Added from an advent calendar's door: back to the calendar.
    if(n.cal&&ADVRET===n.cal.id&&calById(n.cal.id)){ADVRET=null;checkTrophies();renderBeans();if(isNew){openCal(n.cal.id,{back:n.cal.d});toast('Door '+n.cal.d+' added'+note)}else{calBackTo(n);toast('Saved'+note)}return}
    d.close();if(isNew)BVIEW='coffees';if(!$('beans').classList.contains('on'))showTab('beans');checkTrophies();renderBeans();toast((isNew?'Added to your gallery':'Saved')+note)};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}

/* ---------- Your favourites of the year: a top 5 and honourable mentions ---------- */
// Five places across the top: pick a place, then the coffee for it (a coffee already placed swaps places). The second
// tab marks honourable mentions: tap coffees to add or remove them. start: a place (0 to 4) or 'hm'.
function openTop3(y,start){const d=$('vd'),pool=BEANS.filter(b=>beanYear(b)===y).sort((a,b)=>b.rating-a.rating||beanDay(b).localeCompare(beanDay(a)));
  const T=TOP3[y]||{ids:[],hm:[]};let slots=[0,1,2,3,4].map(i=>pool.some(b=>b.id===T.ids[i])?T.ids[i]:''),hm=(T.hm||[]).filter(id=>pool.some(b=>b.id===id));
  let mode=start==='hm'?'hm':'places',act=typeof start==='number'&&start>=0&&start<5?start:0;
  const nextOpen=from=>{for(let k=1;k<=5;k++){const j=(from+k)%5;if(!slots[j])return j}return from};
  const draw=()=>{seg('t3-mode',[['places','Places'],['hm','Mentions'+(hm.length?' · '+hm.length:'')]],()=>mode,v=>{mode=v;draw()});
    $('t3-slots').hidden=mode!=='places';
    $('t3-slots').innerHTML=[0,1,2,3,4].map(i=>{const b=slots[i]&&beanById(slots[i]);return '<div class="t3slot'+(i>2?' sm':'')+(i===act?' act':'')+(b?' full':'')+'" style="--m:'+MEDAL[i+1]+'"><button type="button" class="t3s-main" data-sl="'+i+'" aria-pressed="'+(i===act)+'">'+
      '<span class="t3s-pic">'+(b?beanPic(b,'xs'):'<span class="t3s-n">'+(i+1)+'</span>')+'</span><span class="t3s-tx"><small>'+MEDALN[i+1]+'</small><b>'+(b?esc(beanTitle(b)):'Open')+'</b></span></button>'+(b?'<button type="button" class="t3s-x" data-unset="'+i+'" aria-label="Clear '+MEDALN[i+1]+'">✕</button>':'')+'</div>'}).join('');
    // Mentions only offer coffees that aren't already in the top five.
    $('t3-list').innerHTML=(mode==='hm'?pool.filter(b=>!slots.includes(b.id)):pool).map(b=>{const r=slots.indexOf(b.id)+1,m=hm.includes(b.id),on=mode==='places'?!!r:m;
      return '<button type="button" class="t3opt'+(on?' on':'')+'" data-t3="'+b.id+'" aria-pressed="'+on+'" style="--m:'+(mode==='places'?(MEDAL[r]||'var(--line)'):(m?'var(--honey)':'var(--line)'))+'">'+beanPic(b,'xs')+
      '<span class="t3o-tx"><b>'+esc(beanTitle(b))+'</b><small>'+esc([b.roaster,mode==='places'&&m?'Honourable mention':''].filter(Boolean).join(' · '))+'</small>'+beanRow(b.rating,'sm')+'</span><span class="t3o-r">'+(mode==='places'?(r||''):(m?HM_SVG:''))+'</span></button>'}).join('');
    $('t3-msg').innerHTML=mode==='places'?'Choose your <b style="color:color-mix(in srgb,'+MEDAL[act+1]+' 55%,var(--ink))">'+(act<3?MEDALN[act+1].toLowerCase():MEDALN[act+1]+' place')+'</b> coffee'+(slots[act]?', or tap it again to clear the place.':'.')
      :'Tap the coffees that nearly made it. Up to three'+(hm.length?': '+Math.min(hm.length,HM_MAX)+' of 3 chosen'+(hm.length>HM_MAX?'. Remove '+(hm.length-HM_MAX)+' to keep it to three.':'.'):'.');
    hydrateImgs($('t3-slots'));hydrateImgs($('t3-list'))};
  $('vd-in').innerHTML='<div class="vd-head" style="--c:'+MEDAL[1]+'"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:'+MEDAL[1]+'"></i>Favourites of '+y+'</span><h2 id="vd-title">Crown your favourites</h2>'+
    '<div class="seg" id="t3-mode" role="group" aria-label="Places or honourable mentions"></div><div class="t3slots five" id="t3-slots"></div><p class="vd-sub" id="t3-msg"></p></div>'+
    '<div class="vd-body"><div class="t3list" id="t3-list"></div><div class="actions"><button class="btn" id="t3-save">Save my favourites</button><button class="btn ghost" id="t3-clear">Clear all</button></div></div>';
  $('t3-slots').onclick=e=>{const x=e.target.closest('[data-unset]');if(x){slots[+x.dataset.unset]='';act=+x.dataset.unset;draw();return}const s=e.target.closest('[data-sl]');if(s){act=+s.dataset.sl;draw()}};
  $('t3-list').onclick=e=>{const o=e.target.closest('[data-t3]');if(!o)return;const id=o.dataset.t3;
    if(mode==='hm'){const k=hm.indexOf(id);if(k>=0)hm.splice(k,1);else if(slots.includes(id)){toast('It already has a place in your top 5');return}else if(hm.length>=HM_MAX){toast('Up to three honourable mentions: remove one to add another');return}else hm.push(id);draw();return}
    const at=slots.indexOf(id);if(at===act)slots[act]='';else{if(at>=0)slots[at]=slots[act];slots[act]=id;hm=hm.filter(x=>x!==id);act=nextOpen(act)}draw()};
  $('t3-clear').onclick=()=>{slots=['','','','',''];hm=[];act=0;draw()};
  $('t3-save').onclick=()=>{const any=slots.some(Boolean)||hm.length;
    if(any)TOP3[y]={ids:slots.slice(),hm:hm.slice(),snap:[...slots.filter(Boolean),...hm].map(id=>{const b=beanById(id);return{id,name:beanTitle(b),roaster:b.roaster,origin:b.origin,rating:b.rating}}),at:Date.now()};else delete TOP3[y];
    saveTop3();d.close();BPOD=y;BVIEW='top3';checkTrophies();renderBeans();toast(any?'Favourites of '+y+' saved':'Favourites of '+y+' cleared')};
  draw();showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}
// The app may have opened on the Beans page before this part loaded.
window.BEANS_OK=1;if(beanSync())retuneIfAuto();checkTrophies();renderDBean();if($('beans').classList.contains('on'))renderBeans();if($('settings').classList.contains('on'))renderSettings();
