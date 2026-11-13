// Text the app cuts short: one-line ellipsis that is actually cutting, and line clamps hiding words.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const found=new Map();
for(const w of [320,390]){const c=await b.newContext({viewport:{width:w,height:844},serviceWorkers:'block'});
await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
const scan=async lbl=>{const r=await p.evaluate(()=>{const out=[];const root=document.querySelector('dialog[open]')||document.querySelector('main section.on');if(!root)return out;
  for(const e of root.querySelectorAll('*')){if(!e.offsetParent)continue;const cs=getComputedStyle(e);if(cs.contentVisibility==='auto'&&e.getBoundingClientRect().top>innerHeight*3)continue;
   const key=(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/)[0]:e.tagName.toLowerCase());
   if(cs.textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth+1)out.push('ellipsis '+key+' "'+e.textContent.trim().slice(0,40)+'"');
   const lc=cs.webkitLineClamp;if(lc&&lc!=='none'&&e.scrollHeight>e.clientHeight+2)out.push('clamp('+lc+') '+key+' "'+e.textContent.trim().slice(0,40)+'"')}
  return out});r.forEach(x=>{const k=x.replace(/ ".*/,'');if(!found.has(k))found.set(k,[lbl+'@'+w,x])})};
const tabs=await p.evaluate(()=>[...document.querySelectorAll('main section')].map(s=>s.id).filter(Boolean));
for(const t of tabs){try{await p.evaluate(t=>goTab(t),t)}catch(e){continue}await p.waitForTimeout(700);
 if(t==='dial'){await p.evaluate(()=>{const ri=RECIPES.findIndex(r=>r.name==='Tetsu Kasuya 4:6');Object.assign(S,{rec:ri,goal:'strong'});tune();S.setting+=12;render()});await p.waitForTimeout(300)}
 await p.evaluate(()=>document.querySelectorAll('main section.on details').forEach(d=>d.open=true));
 if(t==='gear')for(const g of ['set','dials','brew','lib','acc']){await p.evaluate(g=>gearTab(g),g);await p.waitForTimeout(300);await scan('gear:'+g)}
 else if(t==='beans')for(const v of [1,2,3,4,5]){await p.evaluate(v=>document.querySelector('#bg-views button:nth-child('+v+')').click(),v);await p.waitForTimeout(400);await scan('beans:'+v)}
 else await scan(t)}
for(const [n,f] of [['bean',()=>openBean(BEANS[0].id)],['editor',()=>openBeanEditor(BEANS[0])],['recipe',()=>openRecipe(0)],['variety',()=>openVariety('geisha')]]){try{await p.evaluate(f);await p.waitForTimeout(500);await scan('dlg:'+n);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(300)}catch(e){}}
await c.close()}
console.log(found.size?[...found.values()].map(([a,x])=>a+'  '+x).join('\n'):'nothing cut short');await b.close()})();
