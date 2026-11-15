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
// It learns: the kind of change whose brews you rated higher comes first next time.
const two=await p.evaluate(()=>{for(const st of [1,2,3,4,5,6,7,8,9,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40]){S.setting=st;S.temp=93;render();if(PLAN&&PLAN.opts.length>1)return st}return 0});
if(two){const k0=await p.evaluate(()=>PLAN.opts.map(o=>o.k));
  await p.evaluate(()=>{localStorage.setItem('bb-planlearn',JSON.stringify({grind:[2,6],water:[2,9]}));render()});
  ok('what worked for you comes first, marked',await p.evaluate(()=>PLAN.opts[0].k==='water'&&!!document.querySelector('#o-tips .oplan-o .oplan-best')),k0);
  await p.screenshot({path:'shots/planbest.png'});
  await p.evaluate(()=>{localStorage.removeItem('bb-planlearn');document.querySelector('#o-tips [data-plan="1"]').click()});
  const pk=await p.evaluate(()=>JSON.parse(localStorage.getItem('bb-planpend')||'{}').k);ok('applying one remembers it until the brew is rated',pk==='water'||pk==='grind',pk);
  await p.evaluate(()=>{planRated(5)});ok('the rating counts for it',await p.evaluate(k=>JSON.parse(localStorage.getItem('bb-planlearn'))[k][1]===5&&!localStorage.getItem('bb-planpend'),pk))}
else ok('found a spot with two options',false);
ok('one + floats, its menu has log, save, a new recipe and scan',await p.evaluate(()=>{const f=$('d-fab');if(!f||getComputedStyle(f).position!=='fixed'||document.querySelectorAll('#dial .fab .ib').length!==1)return false;$('d-fab-add').click();return [...document.querySelectorAll('#d-fab .fab-mi')].map(x=>x.dataset.fab).join()==='log,save,recipe,scan'}));
await p.evaluate(()=>document.querySelector('#d-fab [data-fab=log]').click());await p.waitForTimeout(700);
ok('Log this brew from the menu goes to the log form',await p.evaluate(()=>document.querySelector('main section.on').id==='log'&&$('d-fab-menu')===null||document.querySelector('main section.on').id==='log'));
ok('no errors',!errs.length,errs);await b.close()})();
