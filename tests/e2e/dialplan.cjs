// The Brew page's way to the sweet spot: options you tap (grind, water), each applied at once and landing in the sweet
// spot. The page's actions (log, save) are icons that float within reach.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
const n=await p.evaluate(()=>document.querySelectorAll('#o-tips [data-plan]').length);
ok('the way to the sweet spot is offered as options',n>=1,n);
if(n){await p.evaluate(()=>document.querySelector('#o-tips [data-plan]').click());await p.waitForTimeout(300);
  ok('tapping one applies it and lands in the sweet spot',await p.evaluate(()=>Math.abs(compute(S).D)<=0.45));}
ok('log and save float as icons',await p.evaluate(()=>{const f=$('tolog').closest('.fab');return !!f&&getComputedStyle(f).position==='fixed'&&!$('tolog').textContent.trim()&&$('tolog').getAttribute('aria-label')==='Log this brew'}));
ok('no errors',!errs.length,errs);await b.close()})();
