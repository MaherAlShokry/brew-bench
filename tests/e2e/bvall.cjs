// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1000);
await p.evaluate(()=>goTab('beans'));await p.waitForTimeout(4000);
const r=[];for(const v of ['passport','top3','scans','diary','coffees','passport']){await p.evaluate(()=>scrollTo(0,1000));await p.waitForTimeout(200);await p.evaluate(v=>document.querySelector('#bg-views [data-v="'+v+'"]').click(),v);await p.waitForTimeout(80);
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);await p.waitForTimeout(400);r.push(await p.evaluate(([v,sw])=>[v,$('bv-'+v).innerHTML.length,sw,$('bv-'+v).className],[v,sw]))}
ok('every view has content after switching',r.every(x=>x[1]>200),r);ok('no sideways overflow during slide',r.every(x=>x[2]<=390),r.map(x=>x[2]));
const g=await p.evaluate(()=>{const a=document.querySelector('.appbar').getBoundingClientRect(),s=$('bg-views').getBoundingClientRect();return [a.left,a.right,s.left,s.right,s.top-a.bottom]});ok('stuck strip same width as top bar with a gap',Math.abs(g[0]-g[2])<1&&Math.abs(g[1]-g[3])<1&&g[4]>4,g);
ok('no errors',!errs.length,errs);await b.close()})()
