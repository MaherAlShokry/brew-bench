// Finds elements still wearing the browser's own look: native disclosure markers, default grey buttons, unstyled fields.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const found=new Map();
for(const th of ['light','dark']){const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
await c.addInitScript(t=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t)},th);const p=await c.newPage();
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
const scan=async lbl=>{const r=await p.evaluate(()=>{const out=[];const vis=e=>e.offsetParent||getComputedStyle(e).position==='fixed';
  const where=e=>{const s=e.closest('section,dialog');return (s&&(s.id||s.className)||'?')};
  for(const s of document.querySelectorAll('summary'))if(vis(s)){const cs=getComputedStyle(s);const mk=getComputedStyle(s,'::marker');if(cs.display==='list-item'&&mk.content!=='none'&&mk.fontSize!=='0px')out.push('native marker: '+where(s)+' "'+s.textContent.trim().slice(0,30)+'" ('+(s.parentElement.className||'details')+')')}
  for(const e of document.querySelectorAll('button,input:not([type=hidden]):not([type=range]):not([type=checkbox]):not([type=radio]):not([type=file]),textarea,select'))if(vis(e)){const cs=getComputedStyle(e);
   if(/rgb\(2(39|40), 2(39|40), 2(39|40)\)|buttonface/i.test(cs.backgroundColor)&&!e.closest('#cup'))out.push('default background: '+where(e)+' '+e.tagName+' "'+(e.textContent||e.placeholder||e.id).trim().slice(0,30)+'"');
   if(/outset|inset/.test(cs.borderStyle))out.push('default border: '+where(e)+' '+e.tagName+' "'+(e.textContent||e.id).trim().slice(0,30)+'"');
   if(cs.fontFamily&&/^(Arial|Times|serif|sans-serif|system-ui)/i.test(cs.fontFamily)&&e.tagName!=='INPUT')out.push('default font: '+where(e)+' '+e.tagName+' "'+(e.textContent||e.id).trim().slice(0,30)+'" '+cs.fontFamily.slice(0,30))}
  return out});r.forEach(x=>{if(!found.has(x))found.set(x,lbl+'/'+th)})};
const tabs=await p.evaluate(()=>[...document.querySelectorAll('main section')].map(s=>s.id).filter(Boolean));
for(const t of tabs){try{await p.evaluate(t=>goTab(t),t)}catch(e){continue}await p.waitForTimeout(600);
 await p.evaluate(()=>document.querySelectorAll('main section.on details').forEach(d=>d.open=true));await p.waitForTimeout(200);
 if(t==='gear')for(const g of ['set','dials','brew','lib','acc']){await p.evaluate(g=>{gearTab(g);document.querySelectorAll('main section.on details').forEach(d=>d.open=true)},g);await p.waitForTimeout(300);await scan('gear:'+g)}
 else if(t==='beans')for(const v of [1,2,3,4,5]){await p.evaluate(v=>{document.querySelector('#bg-views button:nth-child('+v+')').click();document.querySelectorAll('main section.on details').forEach(d=>d.open=true)},v);await p.waitForTimeout(400);await scan('beans:'+v)}
 else await scan(t)}
// dialogs
for(const [n,f] of [['bean',()=>openBean(BEANS[0].id)],['editor',()=>openBeanEditor()],['recipe',()=>openRecipe(0)],['variety',()=>openVariety('geisha')],['word',()=>openWord(GLOSSARY[0][0])]]){try{await p.evaluate(f);await p.waitForTimeout(500);await p.evaluate(()=>document.querySelectorAll('dialog[open] details').forEach(d=>d.open=true));await scan('dlg:'+n);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(300)}catch(e){console.log('skip',n,e.message.slice(0,60))}}
await c.close()}
console.log(found.size?[...found].map(([k,v])=>v+'  '+k).join('\n'):'nothing native-looking');await b.close()})();
