const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [w,th] of [[390,'dark'],[390,'light'],[320,'dark']]){const c=await b.newContext({viewport:{width:w,height:1600},deviceScaleFactor:2,serviceWorkers:'block'});
await c.addInitScript(t=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t)},th);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(700);await p.evaluate(()=>goTab('recipes'));await p.waitForTimeout(900);
const g=await p.$('.cups');await g.scrollIntoViewIfNeeded();await g.screenshot({path:`shots/cups-${w}-${th}.png`});
console.log(w,th,await p.evaluate(()=>{const cs=[...document.querySelectorAll('.cupcard')].filter(x=>x.offsetParent);const h=cs.map(x=>Math.round(x.getBoundingClientRect().height));const arts=cs.map(x=>Math.round(x.querySelector('.cupart').getBoundingClientRect().width));const card=cs.map(x=>Math.round(x.getBoundingClientRect().width));return {n:cs.length,h:[...new Set(h)],artFull:arts.every((a,i)=>a>=card[i]-2),bWrap:cs.some(x=>x.querySelector('b').getBoundingClientRect().height>30)}}),errs);await c.close()}await b.close()})();
