// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const ok=(c,m,x)=>console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
(async()=>{const b=await chromium.launch();const errs=[];
for(const [th,w,vibe] of [['dark',390,'pure'],['light',320,'roastery']]){const c=await b.newContext({viewport:{width:w,height:844},deviceScaleFactor:2,serviceWorkers:'block'});
await c.addInitScript(([t,v])=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t);const u=JSON.parse(localStorage.getItem('bb-ui')||'{}');u.vibe=v;localStorage.setItem('bb-ui',JSON.stringify(u))},[th,vibe]);
const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
const exp=await p.evaluate(()=>({now:BEANS.filter(b=>b.shelf).length,done:BEANS.filter(b=>!b.shelf).length}));
await p.evaluate(()=>openBeanPick());await p.waitForTimeout(500);
const r=await p.evaluate(()=>[...document.querySelectorAll('#bp-body .t3list')].map(g=>({h:g.previousElementSibling.textContent,n:g.querySelectorAll('[data-usebean]').length,allShelf:[...g.querySelectorAll('[data-usebean]')].every(x=>beanById(x.dataset.usebean).shelf)})));
ok(r.length===2&&r[0].h.startsWith('Drinking now')&&r[0].n===exp.now&&r[0].allShelf,'drinking now first',r);
ok(r[1].h.startsWith('Your other coffees')&&r[1].n===exp.done&&!r[1].allShelf,'finished after',r[1]);
ok(await p.evaluate(()=>document.querySelectorAll('#bp-body .t3list')[0].querySelectorAll('.pk-meta').length>0&&!document.querySelectorAll('#bp-body .t3list')[1].querySelector('.pk-meta')),'drinking rows show freshness / left');
await p.screenshot({path:'bpick-'+th+'.png'});
const id=await p.evaluate(()=>document.querySelectorAll('#bp-body .t3list')[1].querySelector('[data-usebean]').dataset.usebean);await p.click('#bp-body .t3list:last-child [data-usebean]');await p.waitForTimeout(500);
ok(await p.evaluate(id=>S.bean&&S.bean.id===id,id),'picking a finished coffee works');
// all on shelf -> no headings
await p.evaluate(()=>{BEANS.forEach(b=>b.shelf=true);openBeanPick()});await p.waitForTimeout(300);ok(await p.evaluate(()=>!document.querySelector('.bp-gh')&&document.querySelectorAll('[data-usebean]').length===BEANS.length),'one group: no headings');
await c.close()}
await b.close();ok(!errs.length,'no errors',errs)})()
