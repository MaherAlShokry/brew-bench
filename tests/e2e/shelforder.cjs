// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(()=>{const bs=JSON.parse(localStorage.getItem('bb-beans'));const t=bs[0];const mk=(id,name,roaster,bag,left,tried)=>Object.assign({},t,{id,name,roaster,bag,left,leftAt:Date.now()-1000,tried,shelf:true,ts:Date.now()-86400000,cups:[],bags:[],prior:0});
 const out=bs.map(x=>Object.assign(x,{shelf:false}));
 out.push(mk('aaaa1','Unopened Z','Zeta Roasters',250,250,''),mk('aaaa2','Unopened A','Alpha Roasters',250,250,''),mk('aaaa3','Half used','Mid Roasters',200,100,'2026-11-01'),
  mk('aaaa4','Nearly done','Beta Roasters',250,25,'2026-10-20'),mk('aaaa5','Just opened','Alpha Roasters',250,240,'2026-11-07'),mk('aaaa6','Tried, no bag','Gamma',0,null,'2026-11-05'));
 localStorage.setItem('bb-beans',JSON.stringify(out))});
await p.reload();await p.waitForTimeout(1200);await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>[...document.querySelectorAll('#bv-coffees .clist.now .crow')].map(r=>r.querySelector('b').textContent+' ('+(r.querySelector('small')||{}).textContent?.split(' · ')[0]+')').join('\n')));
console.log('errors',errs);await b.close()})();
