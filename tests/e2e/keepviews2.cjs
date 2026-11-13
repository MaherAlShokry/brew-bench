// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(800);
const picks=await p.evaluate(()=>{const bf=BFILTERS.map(x=>x[0]).find(f=>f!=='all'&&BEANS.some(b=>bfKeep(b,f)));BF=[bf];renderCoffees();
  BVIEW='diary';renderBeanViews();const items=[];const dy=DYFILTERS.map(x=>x[0]).filter(f=>f!=='all');return {bf,dy}});
await p.waitForTimeout(500);
const dyPick=await p.evaluate(dy=>{for(const f of dy){DYF=[f];renderDiaryView();if(DYF.length)return f}return null},picks.dy);
console.log('picked BF',picks.bf,'DYF',dyPick);
await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(800);await p.evaluate(()=>{BVIEW='diary';renderBeanViews()});await p.waitForTimeout(500);
const r=await p.evaluate(()=>({BF,DYF,filterBtn:document.getElementById('bg-lt-f')&&document.getElementById('bg-lt-f').getAttribute('aria-pressed')}));
ok('gallery filter kept',JSON.stringify(r.BF)===JSON.stringify([picks.bf]),r);ok('diary filter kept',dyPick&&JSON.stringify(r.DYF)===JSON.stringify([dyPick]),r);ok('gallery filter button shows it is on',r.filterBtn==='true',r.filterBtn);
ok('no errors',!errs.length,errs);await b.close()})();
