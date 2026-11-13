// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Open the app straight onto every page (a reload while you're there), on the website and as the Android app.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let bad=0;
 const p0=await b.newPage();await p0.goto('http://localhost:8099/index.html');const tabs=await p0.evaluate(()=>[...document.querySelectorAll('main section[id]')].map(s=>s.id));await p0.close();
 // Six at a time: each waits 3.6 s for the start-up work to run, so one after another took 2.5 minutes.
 const jobs=[];for(const app of [false,true])for(const t of tabs)jobs.push([app,t]);
 const one=async([app,t])=>{const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  if(app)await c.addInitScript(()=>{const ok=()=>Promise.resolve({});window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{LocalNotifications:{checkPermissions:()=>Promise.resolve({display:'granted'}),requestPermissions:()=>Promise.resolve({display:'granted'}),schedule:ok,cancel:ok,getPending:()=>Promise.resolve({notifications:[]}),addListener:ok,createChannel:ok},App:{addListener:ok,getInfo:()=>Promise.resolve({version:'1.0'})}}}});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p.goto('http://localhost:8099/index.html#'+t);await p.waitForTimeout(3600);
  const st=await p.evaluate(t=>[typeof BEANS,(document.querySelector('main section.on')||{}).id],t);
  if(errs.length||st[0]!=='object'){bad++;console.log('FAIL',app?'app':'web',t,st,errs.slice(0,2))}
  if(t==='settings'&&app){const has=await p.evaluate(()=>!!document.getElementById('st-learn')&&!!document.getElementById('st-remind'));if(!has){bad++;console.log('FAIL app settings: reminder switches missing')}}
  await c.close()};
 const q=[...jobs];await Promise.all(Array.from({length:6},async()=>{while(q.length)await one(q.shift())}));
 console.log(bad?bad+' problems':'every page opens cleanly ('+tabs.length+' pages, web and app)');await b.close()})();
