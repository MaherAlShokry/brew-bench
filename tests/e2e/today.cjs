// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const ok=(c,m,x)=>{console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();
for(const [w,th] of [[390,'dark'],[390,'light'],[320,'dark']]){const c=await b.newContext({viewport:{width:w,height:900},deviceScaleFactor:2,serviceWorkers:'block'});
await c.addInitScript(t=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t)},th);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(700);await p.evaluate(()=>goTab('explore'));await p.waitForTimeout(700);
await (await p.$('.today')).screenshot({path:`shots/today-${w}-${th}.png`});
// every day of a fortnight: whole sentences or a clean ellipsis, no overflow
const r=await p.evaluate(()=>{const bad=[];for(let d=20390;d<20404;d++){const h=todayCard(d,GLOSSARY[d%GLOSSARY.length]);const el=document.createElement('div');el.innerHTML=h;el.querySelectorAll('.td-t>span').forEach(s=>{const t=s.textContent;if(!/[.!?…)”"]$/.test(t))bad.push(t.slice(-40))})}return bad});
ok(r.length===0,'text ends at a sentence',r.slice(0,3));
ok(await p.evaluate(()=>[...document.querySelectorAll('.today *')].every(e=>e.scrollWidth<=e.clientWidth+1||getComputedStyle(e).overflow==='visible')&&document.querySelector('.today').scrollWidth<=document.querySelector('.today').clientWidth+1),'nothing overflows');
await p.click('.td-row[data-word]');await p.waitForTimeout(600);ok(await p.evaluate(()=>!!document.querySelector('dialog[open]')||!document.getElementById('explore').classList.contains('on')),'word opens');
await p.keyboard.press('Escape');await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());goTab('explore')});await p.waitForTimeout(600);
if(await p.$('.td-row[data-fact]')){await p.click('.td-row[data-fact]');await p.waitForTimeout(600);ok(await p.evaluate(()=>!!document.querySelector('dialog[open]')||!document.getElementById('explore').classList.contains('on')),'fact opens')}
ok(errs.length===0,'no errors',errs);await c.close()}await b.close()})();
