// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const ok=(c,m,x)=>{console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();
const mk=async(pre)=>{const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});await c.addInitScript(pre||(()=>{}));await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));return [c,p,errs]};
// --- one session: two scans in a row
let [c,p,errs]=await mk();await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
await p.evaluate(()=>goTab('scan'));await p.waitForTimeout(500);
ok(await p.evaluate(()=>!!document.querySelector('#scan-out .scan-wait')),'fresh scan page shows the placeholder, not a stale profile');
await (await p.$('#scan-out')).screenshot({path:'shots/scanwait.png'});
await p.evaluate(()=>{document.getElementById('scan-text').value='Finca Uno\nRoasted by Archers\nOrigin: Kenya\nProcess: Natural\nRoast: medium\nRoasted 2026-10-20';runLocalScan(false)});await p.waitForTimeout(900);
const a=await p.evaluate(()=>({o:SC.origin,p:SC.process,r:SC.roast,d:SC.date,rs:SC.roaster}));ok(a.o==='kenya'&&a.p==='natural'&&a.d==='2026-10-20','first scan read',a);
ok(await p.evaluate(()=>!!document.getElementById('sc-new')),'"Scan another bag" offered');
await p.click('#sc-new');await p.waitForTimeout(400);
const bl=await p.evaluate(()=>({w:!!document.querySelector('#scan-out .scan-wait'),t:document.getElementById('scan-text').value,pv:document.getElementById('scan-prev').hidden,o:SC.origin,d:SC.date,n:SC.name,rs:SC.roaster,sd:document.getElementById('s-date').value}));
ok(bl.w&&!bl.t&&bl.pv&&!bl.o&&!bl.d&&!bl.n&&!bl.rs&&!bl.sd,'Scan another bag clears everything',bl);
// second label without date/process/roast: nothing from the first carries over
await p.evaluate(()=>{document.getElementById('scan-text').value='Origin: Colombia\nVariety: Caturra';runLocalScan(false)});await p.waitForTimeout(900);
const s2=await p.evaluate(()=>({o:SC.origin,p:SC.process,r:SC.roast,d:SC.date,rs:SC.roaster}));ok(s2.o==='colombia'&&s2.d===''&&s2.p==='washed'&&s2.r==='light'&&!s2.rs,'second scan keeps nothing from the first',s2);
// Beans "Scan a bag" opens a blank scanner
await p.evaluate(()=>goTab('beans'));await p.waitForTimeout(700);await p.click('#bg-scan');await p.waitForTimeout(500);
ok(await p.evaluate(()=>!!document.querySelector('#scan-out .scan-wait')&&!SC.origin),'Beans "Scan a bag" opens blank');
// manual form edit reveals the profile
await p.selectOption('#s-origin','ethiopia').catch(async()=>{await p.evaluate(()=>{const s=document.getElementById('s-origin');s.value='ethiopia';s.dispatchEvent(new Event('change'))})});await p.waitForTimeout(400);
ok(await p.evaluate(()=>!document.querySelector('#scan-out .scan-wait')&&!!document.querySelector('.bprof')),'filling the form by hand shows the profile');
// dial-in: change things, reload in the same session → kept
await p.evaluate(()=>{const ri=RECIPES.findIndex(r=>r.name==='Tetsu Kasuya 4:6');Object.assign(S,{rec:ri,roast:'dark',goal:'strong'});tune();save('bb-state',S)});
await p.reload();await p.waitForTimeout(800);
ok(await p.evaluate(()=>S.rec!=null&&S.roast==='dark'&&S.goal==='strong'&&SC.origin==='ethiopia'),'a reload in the same session keeps the dial-in and scan');
const savedGrinder=await p.evaluate(()=>[S.grinder,S.brewer]);
const store=await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))));
ok(errs.length===0,'no errors (session)',errs);await c.close();
// --- reopen the app (new session): fresh by default
[c,p,errs]=await mk();
await p.addInitScript(st=>{if(!window.__s){const o=JSON.parse(st);for(const k in o)localStorage.setItem(k,o[k])}},store);
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(900);
const f=await p.evaluate(()=>({rec:S.rec,roast:S.roast,goal:S.goal,g:S.grinder,b:S.brewer,scan:SC.origin,blank:SC.blank,set:S.setting,base:Math.round(baseX(S.grinder,S.brewer))}));
ok(f.rec==null&&f.roast==='light'&&f.goal==='balance'&&!f.scan&&f.blank,'reopening starts Scan and Brew fresh',f);
ok(f.g===savedGrinder[0]&&f.b===savedGrinder[1],'your grinder and brewer stay',[f.g,f.b]);
ok(Math.abs(f.set-f.base)<=1,'grind back on the brewer\'s usual setting',[f.set,f.base]);
await p.evaluate(()=>goTab('settings'));await p.waitForTimeout(600);
ok(await p.evaluate(()=>!!document.getElementById('st-resume')&&/Start fresh/.test(document.getElementById('st-resume').textContent)),'Settings has the option');
await p.evaluate(()=>document.getElementById('st-resume').closest('.setrow').scrollIntoView({block:'center'}));await p.waitForTimeout(200);await p.locator('.setrow:has(#st-resume)').screenshot({path:'shots/resume.png'});
// choose "Where I left off", set a dial, and reopen
await p.click('#st-resume button:has-text("Where I left off")');await p.waitForTimeout(300);
await p.evaluate(()=>{Object.assign(S,{roast:'dark',goal:'strong'});save('bb-state',S)});
const store2=await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))));ok(errs.length===0,'no errors (fresh)',errs);await c.close();
[c,p,errs]=await mk();await p.addInitScript(st=>{const o=JSON.parse(st);for(const k in o)localStorage.setItem(k,o[k])},store2);
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(900);
const k=await p.evaluate(()=>({roast:S.roast,goal:S.goal}));ok(k.roast==='dark'&&k.goal==='strong','"Where I left off" keeps the last dial-in',k);
ok(errs.length===0,'no errors (keep)',errs);await c.close();await b.close()})();
