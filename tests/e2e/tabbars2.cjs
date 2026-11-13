// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const w of [360,390]){const c=await b.newContext({viewport:{width:w,height:800},deviceScaleFactor:2,colorScheme:'dark',serviceWorkers:'block'});
await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
await p.evaluate(()=>goTab('beans'));await p.waitForTimeout(1500);await p.evaluate(()=>{0;const el=document.getElementById('bg-views');el.querySelectorAll('button')[0].innerHTML='Coffees<i>10</i>';el.querySelectorAll('button')[4].innerHTML='Scans<i>12</i>'});
await (await p.$('#bg-views')).screenshot({path:`shots/bvx-${w}.png`});
console.log(w,await p.evaluate(()=>[...document.querySelectorAll('#bg-views button')].map(x=>x.scrollWidth>x.clientWidth+1?'CLIP '+x.innerText:'ok').join(' ')));await c.close()}
await b.close()})();
