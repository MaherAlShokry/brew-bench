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
function okBean(b){if(!b||typeof b!=='object'||typeof b.id!=='string'||!BID.test(b.id))return null;
  const r=Math.round(clamp(+b.rating||0,0,5)*2)/2;
  return{id:b.id,name:str(b.name,60),roaster:str(b.roaster,50),origin:ALLO()[b.origin]?b.origin:'',process:PROCESSES[b.process]?b.process:'',
    variety:VBY[String(b.variety||'').split(':')[0]]?String(b.variety):'',roast:['light','medium','dark'].includes(b.roast)?b.roast:'',
    roastDate:ISO_D.test(b.roastDate)?b.roastDate:'',tried:ISO_D.test(b.tried)?b.tried:todayISO(),rating:r,flavours:str(b.flavours,160),notes:str(b.notes,600),
    img:!!b.img,scan:typeof b.scan==='string'&&BID.test(b.scan)?b.scan:'',ts:+b.ts||Date.now()}}
let BEANS=load('bb-beans',[]);BEANS=Array.isArray(BEANS)?BEANS.map(okBean).filter(Boolean):[];
// Top 3 per year: three places (gold, silver, bronze), each a bean id or '' while open, plus a snapshot so a podium
// survives the bean being deleted later.
let TOP3=(t=>{const o={};if(t&&typeof t==='object')for(const [y,v] of Object.entries(t))if(/^\d{4}$/.test(y)&&v&&Array.isArray(v.ids)){
  const ids=[0,1,2].map(i=>typeof v.ids[i]==='string'&&BID.test(v.ids[i])?v.ids[i]:'');if(!ids.some(Boolean))continue;
  o[y]={ids,snap:(Array.isArray(v.snap)?v.snap:[]).filter(s=>s&&BID.test(s.id)).slice(0,3).map(s=>({id:s.id,name:str(s&&s.name,60),roaster:str(s&&s.roaster,50),origin:ALLO()[s&&s.origin]?s.origin:'',rating:clamp(+(s&&s.rating)||0,0,5)})),at:+v.at||0}}return o})(load('bb-top3',{}));
const t3has=t=>!!t&&t.ids.some(Boolean);
let BQ='',BSORT='recent',BYEAR='all',BPOD=null,BVIEW='coffees';
// Cards slide in the first time you see them, not every time the list is sorted or searched.
const BSEEN=new Set();
function saveBeans(){try{localStorage.setItem('bb-beans',JSON.stringify(BEANS));return true}catch(e){toast('Couldn’t save: this device’s storage is full');return false}}
const saveTop3=()=>save('bb-top3',TOP3);
const beanYear=b=>+b.tried.slice(0,4);
const beanById=id=>BEANS.find(b=>b.id===id);
const beanTitle=b=>b.name||(b.origin?originName(b.origin)+(b.variety?' '+vName(b.variety):''):'Unnamed coffee');
const flagOf=k=>(ALLO()[k]||{}).flag||'';
// The place a bean holds in its year's top 3 (1, 2 or 3), or 0.
const beanRank=b=>{const t=TOP3[beanYear(b)];return t?t.ids.indexOf(b.id)+1:0};
const inAnyTop=id=>Object.values(TOP3).some(t=>t.ids.includes(id));
const MEDAL=['','#C9964A','#A49C92','#A8673F'],MEDALN=['','Gold','Silver','Bronze'];

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
const regCol=k=>{const o=ALLO()[k];return o&&REG[o.reg]?REG[o.reg].color:'var(--cherry)'};
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
  if(!el.firstChild)el.innerHTML='<div id="bg-hero"></div><div class="seg bviews" id="bg-views" role="group" aria-label="Show"></div>'+
    '<div class="bview" id="bv-coffees" aria-label="Your coffees"></div><div class="bview" id="bv-top3" aria-label="Top 3"></div><div class="bview" id="bv-scans" aria-label="Your scans"></div>';
  renderBeanHero();renderBeanViews();renderCoffees();renderTop3View();renderBeanScans()}
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
  seg('bg-views',[['coffees','Coffees'+cnt(BEANS.length)],['top3','Top 3'],['scans','Scans'+cnt(SCANS.length)]],()=>BVIEW,v=>{if(v===BVIEW)return;BVIEW=v;renderBeanViews()});
  for(const v of ['coffees','top3','scans']){const p=$('bv-'+v),on=v===BVIEW;if(p.hidden===!on)continue;p.hidden=!on;if(on&&!RM()){p.classList.remove('bv-in');void p.offsetWidth;p.classList.add('bv-in')}}}
function renderCoffees(){const p=$('bv-coffees'),years=beanYears();if(BYEAR!=='all'&&!years.includes(+BYEAR))BYEAR='all';
  if(!BEANS.length){p.innerHTML='<div class="bg-empty">'+beanSVG+'<b>No coffees yet</b><p>Scan a bag or add one by hand. Your earlier scans are under <button type="button" class="linkbtn" data-view="scans">Scans</button>, ready to add.</p></div>';return}
  p.innerHTML='<div class="bg-tools"><input type="search" id="bg-q" placeholder="Search coffees, roasters, origins, notes" aria-label="Search your coffees" value="'+esc(BQ)+'">'+
    '<div class="seg filters scrollrow" id="bg-sort" role="group" aria-label="Sort"></div>'+(years.length>1?'<div class="seg filters scrollrow" id="bg-year" role="group" aria-label="Show year"></div>':'')+'</div><div id="bg-grid"></div>';
  seg('bg-sort',[['recent','Recent'],['rated','Top rated'],['roaster','Roastery'],['origin','Origin']],()=>BSORT,v=>{BSORT=v;renderBeanSort()});
  if(years.length>1)seg('bg-year',[['all','All years'],...years.map(y=>[String(y),String(y)])],()=>BYEAR,v=>{BYEAR=v;renderBeanSort()});
  renderGrid()}
// Sorting and filtering redraw only the cards and the chips' state, so the page doesn't jump.
function renderBeanSort(){for(const [id,v] of [['bg-sort',BSORT],['bg-year',BYEAR]]){const s=$(id);if(s)s.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v))}renderGrid()}
function renderGrid(){const g=$('bg-grid');if(!g)return;const list=beanList();let n=0;
  g.innerHTML=list.length?beanGroups(list).map(([h,l])=>(h?'<div class="bg-gh"><b>'+esc(h)+'</b><span>'+l.length+'</span></div>':'')+'<div class="bgrid">'+l.map(b=>beanCard(b,n++)).join('')+'</div>').join(''):'<p class="hint">No coffees match that search.</p>';
  hydrateImgs(g)}
function renderTop3View(){const p=$('bv-top3'),years=beanYears(),cy=new Date().getFullYear();if(BPOD==null||!(years.includes(BPOD)||BPOD===cy))BPOD=cy;
  const hist=Object.keys(TOP3).map(Number).filter(y=>y!==BPOD&&t3has(TOP3[y])).sort((a,b)=>b-a);
  p.innerHTML='<div class="crown">'+podiumHTML(BPOD,years)+'</div>'+
    (hist.length?'<h3 class="rh">Your top 3 history</h3><div class="t3hist">'+hist.map(y=>{const t=TOP3[y],ids=t.ids.filter(Boolean);return '<button type="button" class="t3tile" data-py="'+y+'"><span class="t3y">'+y+'</span><span class="t3av">'+
      ids.map(id=>{const b=beanById(id),s=(t.snap||[]).find(x=>x.id===id)||{};return beanPic(b||Object.assign({id,img:true,origin:''},s),'av')}).join('')+'</span><small>'+CROWN+esc(t3name(t,ids[0]))+'</small></button>'}).join('')+'</div>':'');
  hydrateImgs(p)}
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
  const v=e.target.closest('[data-view]');if(v){BVIEW=v.dataset.view;renderBeanViews();return}
  const py=e.target.closest('[data-py]');if(py){BPOD=+py.dataset.py;renderTop3View();if(py.classList.contains('t3tile'))$('bv-top3').scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'});return}
  const t=e.target.closest('[data-top3]');if(t){openTop3(+t.dataset.top3,+(t.dataset.slot||0));return}
  const sa=e.target.closest('[data-scanadd]');if(sa){addScanToGallery(+sa.dataset.scanadd);return}
  const sc=e.target.closest('[data-scan]');if(sc){openSavedScan(+sc.dataset.scan);return}
  const b=e.target.closest('[data-bean]');if(b)openBean(b.dataset.bean)});

/* ---------- One coffee ---------- */
function beanLogStats(b){const n=b.name.toLowerCase();if(n.length<3)return null;const l=LOG.filter(x=>(x.coffee||'').toLowerCase().includes(n));if(!l.length)return null;
  const r=l.filter(x=>x.rating);return{n:l.length,avg:r.length?r.reduce((s,x)=>s+x.rating,0)/r.length:0}}
function openBean(id){const b=beanById(id);if(!b)return;const d=$('vd'),rk=beanRank(b),P=b.process&&PROCESSES[b.process],ls=beanLogStats(b);
  const fmt=s=>s?new Date(s+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';
  const kv=[['Origin',b.origin?flagOf(b.origin)+' '+originName(b.origin):''],['Process',P?P.name:''],['Variety',b.variety?vName(b.variety):''],['Roast',b.roast?b.roast[0].toUpperCase()+b.roast.slice(1):''],['Roasted',fmt(b.roastDate)],['Tried',fmt(b.tried)]].filter(x=>x[1]);
  $('vd-in').innerHTML='<div class="vd-head" style="--c:'+(rk?MEDAL[rk]:'var(--cherry)')+'"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:'+(rk?MEDAL[rk]:'var(--cherry)')+'"></i>'+(rk?MEDALN[rk]+' · top 3 of '+beanYear(b):'Bean gallery')+'</span><h2 id="vd-title">'+esc(beanTitle(b))+'</h2>'+(b.roaster?'<p class="vd-sub">'+esc(b.roaster)+'</p>':'')+'</div>'+
    '<div class="vd-body"><div class="bd-hero">'+beanPic(b,'hero')+glassRate(b.rating)+'</div>'+'<div class="bd-rate">'+beanRow(b.rating,'big')+'<span>'+(b.rating?b.rating.toString().replace('.5','½')+' · ':'')+rateWord(b.rating)+'</span></div>'+
    (kv.length?'<div class="specs">'+kv.map(([k,v])=>'<div><b>'+k+'</b><span class="bd-v">'+esc(v)+'</span></div>').join('')+'</div>':'')+
    (b.flavours?'<h3>Tasting notes</h3><div class="chips">'+b.flavours.split(/\s*[,;·]\s*/).filter(Boolean).map(f=>'<span class="chip">'+esc(f)+'</span>').join('')+'</div>':'')+
    (b.notes?'<h3>Your notes</h3><p>'+esc(b.notes)+'</p>':'')+
    (ls?'<p class="hint">In your brew log: '+ls.n+' brew'+(ls.n===1?'':'s')+(ls.avg?', rated '+ls.avg.toFixed(1)+' on average':'')+'.</p>':'')+
    '<div class="actions"><button class="btn" id="bd-brew">Brew it in the dial-in</button><button class="btn ghost" id="bd-edit">Edit</button><button class="btn ghost" id="bd-share">Share</button></div>'+
    '<button type="button" class="linkbtn danger" id="bd-del">Remove from the gallery</button></div>';
  hydrateImgs($('vd-in'));
  $('bd-edit').onclick=()=>openBeanEditor(b);
  $('bd-share').onclick=()=>{d.close();openShare(beanDoc(b))};
  $('bd-brew').onclick=()=>{if(b.process)S.process=b.process;if(b.variety)S.variety=b.variety;if(b.roast)S.roast=b.roast;if(b.roastDate)S.age=daysSince(b.roastDate);d.close();showTab('dial');
    if(!dialRec()){const t=techList(S.brewer)[0];if(t)S.rec=t[1]}if(dialRec())tune('Tuned for '+beanTitle(b));else{render();toast('Set up for '+beanTitle(b))}};
  $('bd-del').onclick=()=>{const inTop=inAnyTop(b.id);
    if(!confirm('Remove “'+beanTitle(b)+'” from your gallery?'+(inTop?' It stays in your top 3 history.':'')))return;
    BEANS=BEANS.filter(x=>x.id!==b.id);saveBeans();if(!inTop)BIMG.del(b.id);d.close();renderBeans();toast('Removed from your gallery')};
  showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}
function beanDoc(b){const P=b.process&&PROCESSES[b.process];
  return{title:beanTitle(b),sub:(b.roaster?b.roaster+' | ':'')+'Rated '+(b.rating||'–')+' of 5',file:'coffee-'+beanTitle(b),
    blocks:[{kv:[['Origin',b.origin?originName(b.origin):'-'],['Process',P?P.name:'-'],['Variety',b.variety?vName(b.variety):'-'],['Roast',b.roast||'-']]},...(b.flavours?[{h:'Tasting notes',p:b.flavours}]:[]),...(b.notes?[{h:'Notes',p:b.notes}]:[])]}}

/* ---------- Adding and editing ---------- */
// pre: details to start from (a scan); its photo comes as a data URL in pre.photo.
function openBeanEditor(b,pre){const isNew=!b;const B=Object.assign({name:'',roaster:'',origin:'',process:'',variety:'',roast:'',roastDate:'',tried:todayISO(),rating:0,flavours:'',notes:'',img:false},b||{},pre||{});
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
   '<div class="field"><label for="be-origin">Origin</label><select id="be-origin">'+opt(Object.entries(REG).map(([rk,r])=>'<optgroup label="'+r.name+'">'+Object.keys(ALLO()).filter(k=>ALLO()[k].reg===rk).sort((a,c)=>ALLO()[a].name.localeCompare(ALLO()[c].name)).map(k=>'<option value="'+k+'">'+esc(ALLO()[k].name)+'</option>').join('')+'</optgroup>').join(''),'Not sure')+'</select></div>'+
   '<div class="two stackm"><div class="field"><label for="be-process">Process</label><select id="be-process">'+opt(processOptions(),'Not sure')+'</select></div>'+
   '<div class="field"><label for="be-variety">Variety</label><select id="be-variety">'+opt(varietyOptions(),'Not sure')+'</select></div></div>'+
   '<div class="field"><div class="lbl">Roast</div><div class="seg" id="be-roast"></div></div>'+
   '<div class="two"><div class="field"><label for="be-rdate">Roasted on</label><input type="date" id="be-rdate" class="dateinp" value="'+B.roastDate+'"></div><div class="field"><label for="be-tried">Tried on</label><input type="date" id="be-tried" class="dateinp" value="'+B.tried+'"></div></div>'+
   '<div class="field"><label for="be-fl">Tasting notes <span class="hint">separate with commas</span></label><input id="be-fl" maxlength="160" value="'+esc(B.flavours)+'" placeholder="e.g. jasmine, peach, honey"></div>'+
   '<div class="field"><label for="be-notes">Your notes</label><textarea id="be-notes" rows="3" maxlength="600" placeholder="How you brewed it, what you loved, would you buy it again?">'+esc(B.notes)+'</textarea></div>'+
   '<div class="actions"><button class="btn" id="be-save">'+(isNew?'Add to the gallery':'Save changes')+'</button><button class="btn ghost" id="be-cancel">Cancel</button></div></div>';
  for(const [id,k] of [['be-origin','origin'],['be-process','process'],['be-variety','variety']])$(id).value=B[k];
  // Tapping the chosen roast again clears it: not every bag says.
  const roastSeg=()=>seg('be-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>B.roast,v=>{B.roast=B.roast===v?'':v;roastSeg()});roastSeg();
  beanRateInput('be-rate',()=>rating,v=>rating=v);
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
      roast:B.roast,roastDate:$('be-rdate').value,tried:$('be-tried').value||todayISO(),rating,flavours:$('be-fl').value,notes:$('be-notes').value,img:photoChanged?!!photo:B.img,scan:B.scan||'',ts:b?b.ts:Date.now()});
    if(!n.name&&!n.origin&&!photo){toast('Add a name, an origin or a photo first');$('be-name').focus();return}
    let note='';if(photoChanged){if(photo){if(!await BIMG.put(n.id,photo)){n.img=false;note=', but the photo couldn’t be saved on this device'}}else if(!inAnyTop(n.id))BIMG.del(n.id)}
    // Moved to another year: it leaves the old year's top 3, where it no longer belongs.
    if(b&&beanYear(b)!==beanYear(n)){const t=TOP3[beanYear(b)],k=t?t.ids.indexOf(n.id):-1;if(k>=0){t.ids[k]='';t.snap=(t.snap||[]).filter(x=>x.id!==n.id);if(!t3has(t))delete TOP3[beanYear(b)];note+='. It left the top 3 of '+beanYear(b)}}
    const i=BEANS.findIndex(x=>x.id===n.id);if(i>=0)BEANS[i]=n;else BEANS.unshift(n);if(!saveBeans())return;
    // A crowned coffee keeps its podium snapshot up to date.
    for(const t of Object.values(TOP3)){const s=(t.snap||[]).find(x=>x.id===n.id);if(s)Object.assign(s,{name:beanTitle(n),roaster:n.roaster,origin:n.origin,rating:n.rating})}saveTop3();
    d.close();if(isNew)BVIEW='coffees';if(!$('beans').classList.contains('on'))showTab('beans');renderBeans();toast((isNew?'Added to your gallery':'Saved')+note)};
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
    saveTop3();d.close();BPOD=y;BVIEW='top3';renderBeans();toast(slots.some(Boolean)?'Top 3 of '+y+' saved':'Top 3 of '+y+' cleared')};
  draw();showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}
// The app may have opened on the Beans page before this part loaded.
window.BEANS_OK=1;if($('beans').classList.contains('on'))renderBeans();
