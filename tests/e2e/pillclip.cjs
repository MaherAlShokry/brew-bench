// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Every visible pill (segmented buttons, chips, tabs) on every page, with all sections and dialogs' details opened: none may cut its words.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const bad=new Set();
for(const w of [320,360,390]){const c=await b.newContext({viewport:{width:w,height:800},serviceWorkers:'block'});
await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
const tabs=await p.evaluate(()=>[...document.querySelectorAll('main section')].map(s=>s.id).filter(Boolean));
for(const t of tabs){try{await p.evaluate(t=>goTab(t),t)}catch(e){continue}await p.waitForTimeout(700);
 await p.evaluate(()=>document.querySelectorAll('main section.on details').forEach(d=>d.open=true));await p.waitForTimeout(300);
 if(t==='gear'){for(const g of ['set','dials','brew','lib','acc']){await p.evaluate(g=>gearTab(g),g);await p.waitForTimeout(250);await chk(t+':'+g)}}
 else if(t==='beans'){for(const v of ['coffees','diary','passport','top3','scans']){await p.evaluate(v=>document.querySelector('#bg-views [data-v="'+v+'"],#bg-views button:nth-child('+(['coffees','diary','passport','top3','scans'].indexOf(v)+1)+')').click(),v);await p.waitForTimeout(400);await chk(t+':'+v)}}
 else await chk(t);
 async function chk(lbl){const r=await p.evaluate(()=>[...document.querySelectorAll('main section.on .seg button, main section.on button.chip, main section.on [role=tab]')].filter(x=>x.offsetParent&&x.getBoundingClientRect().width>0).filter(x=>{const cs=getComputedStyle(x);return x.scrollWidth>x.clientWidth+1&&cs.overflowX!=='visible'||(cs.textOverflow==='ellipsis'&&x.scrollWidth>x.clientWidth+1)}).map(x=>x.innerText.replace(/\s+/g,' ').slice(0,30)));r.forEach(x=>bad.add(lbl+' @'+w+': '+x))}
}await c.close()}
console.log(bad.size?[...bad].join('\n'):'no cut-off pills');await b.close()})();
