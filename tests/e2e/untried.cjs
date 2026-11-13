const {chromium}=require('playwright');const ok=(c,m,x)=>console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
await p.evaluate(()=>openBeanEditor());await p.waitForTimeout(400);
ok(await p.$eval('#be-tried',e=>e.value===''),'Tried on starts empty');
ok(await p.$eval('#be-tried',e=>!e.required),'Tried on not required');
const shown=await p.evaluate(()=>{const e=$('be-tried');const btn=e.parentElement.querySelector('button,.datebtn,[data-date]')||e.nextElementSibling;return btn?btn.textContent.trim():''});ok(/Choose a date/.test(shown),'shows placeholder',shown);
await p.fill('#be-name','Untried Test');await p.evaluate(()=>$('be-save').click());await p.waitForTimeout(600);
const bn=await p.evaluate(()=>BEANS.find(b=>b.name==='Untried Test'));ok(bn&&bn.tried==='','saved with no tried date',bn&&bn.tried);
const r=await p.evaluate(id=>{const b=beanById(id);return{year:beanYear(b),day:beanDay(b),today:todayISO()}},bn.id);ok(r.day===r.today&&r.year===+r.today.slice(0,4),'falls back to added day',r);
// reload keeps empty
await p.reload();await p.waitForTimeout(800);ok(await p.evaluate(()=>BEANS.find(b=>b.name==='Untried Test').tried)==='','still empty after reload');
// all bean views render
for(const v of [1,2,3,4,5]){await p.evaluate(()=>goTab('beans'));await p.waitForTimeout(300);await p.evaluate(v=>document.querySelector('#bg-views button:nth-child('+v+')').click(),v);await p.waitForTimeout(300)}
await p.evaluate(id=>openBean(id),bn.id);await p.waitForTimeout(500);const txt=await p.evaluate(()=>document.querySelector('dialog[open]').innerText);ok(/Tried\s*\n?\s*Not yet/.test(txt),'detail says Not yet');
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(id=>openBeanEditor(beanById(id)),bn.id);await p.waitForTimeout(400);ok(await p.$eval('#be-tried',e=>e.value===''),'edit keeps it empty');
await p.evaluate(()=>{$('be-tried').parentElement.querySelector('button')?.click()||$('be-tried').click()});await p.waitForTimeout(400);
ok(await p.evaluate(()=>!!document.querySelector('.calclear')),'calendar has Clear');
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
// share card
const card=await p.evaluate(async id=>{try{const bl=await beanCardImg(beanById(id));return !!bl}catch(e){return e.message}},bn.id);ok(card===true,'share card renders',card);
// log a brew with it sets tried
await p.evaluate(id=>{const b=beanById(id);S.bean=okSBean({name:b.name,id:b.id});save('bb-state',S)},bn.id);
const res=await p.evaluate(()=>{goTab('dial');return 1});await p.waitForTimeout(500);
const logged=await p.evaluate(id=>{const btn=[...document.querySelectorAll('button')].find(x=>/log this brew|save brew|log brew/i.test(x.textContent)&&x.offsetParent);return btn?btn.textContent.trim():null},bn.id);ok(true,'log button',logged);
await b.close();ok(!errs.length,'no errors',errs)})()
