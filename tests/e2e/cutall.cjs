// Cut text and broken layout across every page and sheet: ellipses that cut, clamps hiding words, text clipped by an
// overflow:hidden box, and anything poking past the screen's edge (outside scrollers).
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const found=new Map();
const W0=+(process.argv[2]||320),M0=process.argv[3]||'light';for(const mode of [M0])for(const w of [W0]){const c=await b.newContext({viewport:{width:w,height:800},colorScheme:mode});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(()=>{const bs=JSON.parse(localStorage.getItem('bb-beans'));bs.slice(0,4).forEach((b,i)=>{b.cal={id:'cutcal',d:i*2+1}});localStorage.setItem('bb-beans',JSON.stringify(bs));
  localStorage.setItem('bb-advent',JSON.stringify([{id:'cutcal',name:'Inspiration Coffee Advent Calendar Twenty Twenty-Six',roaster:'The Barn Coffee Roasters Berlin',year:2026,n:24,g:50,notes:'Lovely box.'},{id:'cutcal2',name:'',roaster:'Spirit Hub',year:2025,n:24,g:50}]))});
// A third argument sets the text size (s, m, l, xl), as in Settings.
if(process.argv[4])await p.evaluate(t=>localStorage.setItem('bb-ui',JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('bb-ui')||'{}'),{text:t}))),process.argv[4]);
await p.reload();await p.waitForTimeout(1500);
const scan=async lbl=>{const r=await p.evaluate(()=>{const out=[];const dl=[...document.querySelectorAll('dialog[open]')].pop();const root=dl||document.querySelector('main section.on');if(!root)return out;const W=innerWidth;
  const inScroller=e=>{for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const o=getComputedStyle(a).overflowX;if(o==='auto'||o==='scroll')return true}return false};
  const nm=e=>(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):e.tagName.toLowerCase());
  for(const e of root.querySelectorAll('*')){if(!e.getClientRects().length)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0)continue;if(cs.contentVisibility==='auto'&&e.getBoundingClientRect().top>innerHeight*3)continue;
   const tx=e.textContent.trim().slice(0,46);
   if(cs.textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth+1)out.push(['ellipsis',nm(e),tx]);
   const lc=cs.webkitLineClamp;if(lc&&lc!=='none'&&e.scrollHeight>e.clientHeight+2)out.push(['clamp',nm(e),tx]);
   const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
   if(own&&(cs.overflowX==='hidden'||cs.overflowX==='clip')&&cs.textOverflow!=='ellipsis'&&e.scrollWidth>e.clientWidth+2&&!/input|textarea|select/i.test(e.tagName))out.push(['clipped',nm(e),tx]);
   if(own){const r=e.getBoundingClientRect();if((r.right>W+1||r.left<-1)&&!inScroller(e)&&r.width<W*1.5)out.push(['offscreen',nm(e),tx])}}
  return out});for(const [k,n,t] of r){const key=k+' '+n;if(!found.has(key))found.set(key,{at:lbl+'@'+w+(mode==='dark'?'d':''),t,n:0});found.get(key).n++}};
const go=async(lbl,js,wait=700)=>{const t0=Date.now();try{await Promise.race([p.evaluate(js),new Promise(r=>setTimeout(r,4000))]);await p.waitForTimeout(wait);await scan(lbl);console.error(lbl,Date.now()-t0)}catch(e){console.log('ERR',lbl,e.message.slice(0,80))}};
const close="document.querySelectorAll('dialog[open]').forEach(d=>d.close())";
if(process.argv[4]==='sanity'){await go('sanity',"goTab('dial');document.querySelector('main section.on').insertAdjacentHTML('afterbegin','<div style=\\'width:50px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\\'>long long long long text</div><p style=\\'width:600px\\'>wide text goes off</p>')")}
else for(const t of ['dial','recipes','log','explore','map','settings','scan','history','variety','process','tech','champs','words','flow','wheel','gear']){await go(t,`goTab('${t}');document.querySelectorAll('main section.on details').forEach(d=>d.open=true)`)}
for(const v of ['coffees','diary','passport','top3','scans'])await go('beans:'+v,`goTab('beans');BVIEW='${v}';renderBeanViews()`);
const sheets=[['bean',"openBean(BEANS[0].id)"],['bean-off',"openBean(BEANS.find(b=>!b.shelf).id)"],['editor',"openBeanEditor(BEANS[0])"],['recipe',"openRecipe(3)"],['recipe-champ',"openRecipe(RECIPES.findIndex(r=>r.champ)>=0?RECIPES.findIndex(r=>r.champ):5)"],
  ['variety',"openVariety(V[0].id)"],['origin',"openOrigin(BEANS[0].origin)"],['calendar',"openCal('cutcal')"],['calendar2',"openCal('cutcal2')"],['cal-editor',"openCalEditor(calById('cutcal'))"],['door-editor',"openBeanEditor(null,{roaster:'The Barn',bag:50,shelf:false,cal:{id:'cutcal',d:3}})"],
  ['share-bean',"openShare(beanDoc(BEANS[0]))"],['share-cal',"openShare(calDoc(calById('cutcal')))"],['profile',"openMe()"],['trophies',"openTrophies()"],['bean-filter',"goTab('beans');openBeanFilter()"],['bean-sort',"openBeanSort()"],
  ['recipe-filter',"goTab('recipes');$('rfiltbtn').click()"],['ask',"askSheet({title:'What’s left in the bag?',text:'Weigh the bag, or a good guess.',ok:'Save',input:{value:120,unit:'g',step:5,min:0,max:5000,label:'Grams left'}})"],
  ['top5-pick',"goTab('beans');BVIEW='top3';renderBeanViews();document.querySelector('[data-top3]')?.click()"]];
for(const [n,js] of sheets){await p.evaluate(close);await p.waitForTimeout(300);await go(n,js,900)}
if(errs.length)console.log('page errors',mode,w,errs.slice(0,3));await c.close()}
const rows=[...found.entries()].sort((a,b)=>a[0].localeCompare(b[0]));console.log(rows.length?rows.map(([k,v])=>k.padEnd(48)+' '+v.at.padEnd(18)+' x'+v.n+'  "'+v.t+'"').join('\n'):'nothing cut or off-screen');
await b.close()})();
