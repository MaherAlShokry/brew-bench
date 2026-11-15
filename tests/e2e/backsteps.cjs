// Back goes one step at a time inside a section: from another Beans view to Coffees (then out of Beans), from Gear,
// the Brew log and the Guide to Settings, from an Explore section to Explore; returning to Coffees by hand leaves no
// dead step.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const where=()=>p.evaluate(()=>{const s=document.querySelector('main section.on');return s?s.id+(s.id==='beans'?':'+BVIEW:''):'gone'});
const tab=async t=>{await p.evaluate(t=>document.querySelector('[role=tablist] .tab[data-t='+t+']').click(),t);await p.waitForTimeout(500)};
const view=async v=>{await p.evaluate(v=>[...document.querySelectorAll('#bg-views button')].find(x=>x.textContent.trim()===v).click(),v);await p.waitForTimeout(400)};
const back=async()=>{await p.goBack();await p.waitForTimeout(600);return where()};
await tab('dial');await tab('beans');await view('Roastery');await view('Diary');
ok('Beans: back from a view returns to Coffees',await back()==='beans:coffees');
ok('then out of Beans',await back()==='dial');
await tab('beans');await view('Passport');await view('Coffees');
ok('Beans: back after returning to Coffees by hand leaves Beans (no dead step)',await back()==='dial');
for(const k of ['gear','log','guide']){await tab('settings');await p.evaluate(k=>document.querySelector('[data-go='+k+']').click(),k);await p.waitForTimeout(500);ok('Settings › '+k+': back returns to Settings',await back()==='settings')}
await tab('explore');await p.evaluate(()=>{const t=document.querySelector('#explore [data-go]');t&&t.click()});await p.waitForTimeout(600);
ok('Explore › a section: back returns to Explore',await back()==='explore');
ok('no errors',!errs.length,errs);await b.close()})();
