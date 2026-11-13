// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const seed=require('./seed.cjs');
(async()=>{const b=await chromium.launch();const errs=[];let issues=0;
for(const [w,h] of [[390,844],[1280,900]])for(const cs of ['light','dark']){const c=await b.newContext({viewport:{width:w,height:h},colorScheme:cs,serviceWorkers:'block'});const p=await c.newPage();
p.on('pageerror',e=>errs.push(w+cs+': '+e.message));p.on('dialog',d=>d.accept());await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});await seed(p);
const tabs=await p.evaluate(()=>[...document.querySelectorAll('main > section')].map(s=>s.id));
for(const t of tabs){await p.evaluate(t=>showTab(t),t);await p.waitForTimeout(250);const o=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>2){issues++;console.log('overflow',w,cs,t,o)}}
// the main sheets
const sheets=[['bean page',()=>openBean('guj1x2345')],['bean editor',()=>openBeanEditor()],['profile editor',()=>openProfileEditor()],['top 5 picker',()=>openTop3(new Date().getFullYear(),0)]];
for(const [n] of sheets){await p.evaluate(n=>{const f={'bean page':()=>openBean('guj1x2345'),'bean editor':()=>openBeanEditor(),'profile editor':()=>openProfileEditor(),'top 5 picker':()=>openTop3(new Date().getFullYear(),0)}[n];f()},n);await p.waitForTimeout(350);
  const o=await p.evaluate(()=>{const d=document.getElementById('vd');return d.open?d.scrollWidth-d.clientWidth:-1});if(o>2||o<0){issues++;console.log('sheet',n,w,cs,o)}await p.evaluate(()=>document.getElementById('vd').close());await p.waitForTimeout(400)}
// Beans views
for(const v of ['coffees','diary','passport','top3','scans']){await p.evaluate(v=>{showTab('beans');BVIEW=v;renderBeanViews()},v);await p.waitForTimeout(250)}
await c.close()}
console.log('issues',issues,'errors',errs.length?errs:'none');await b.close()})();
