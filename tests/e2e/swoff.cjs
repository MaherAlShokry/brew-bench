// Offline-first website: it opens from the saved copy with no network, the map still loads, and when a newer
// version has been saved in the background the page offers a reload.
const {chromium}=require('playwright'),fs=require('fs'),os=require('os'),path=require('path'),{spawn,execSync}=require('child_process');
const ROOT=path.resolve(__dirname,'../..'),DIR=fs.mkdtempSync(path.join(os.tmpdir(),'bbsw-')),PORT=8097;
for(const f of ['index.html','sw.js','manifest.webmanifest','events.json','privacy.html'])fs.copyFileSync(path.join(ROOT,f),path.join(DIR,f));
for(const d of ['vendor','icons'])fs.cpSync(path.join(ROOT,d),path.join(DIR,d),{recursive:true});
const srv=spawn('python3',['-m','http.server',String(PORT),'--directory',DIR],{stdio:'ignore'});
const ok=(n,c,x)=>console.log((c?'ok   ':'FAIL ')+n+(c?'':' '+JSON.stringify(x||'')));
(async()=>{await new Promise(r=>setTimeout(r,800));const b=await chromium.launch();const ctx=await b.newContext();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await ctx.route(u=>!u.href.startsWith('http://localhost:'+PORT),r=>r.abort());
  await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
  const U='http://localhost:'+PORT+'/';
  await p.goto(U);await p.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:15000}).catch(()=>{});
  if(!await p.evaluate(()=>!!navigator.serviceWorker.controller)){await p.reload();await p.waitForTimeout(1500)}
  ok('service worker controls the page',await p.evaluate(()=>!!navigator.serviceWorker.controller));
  ok('map is not inline in the page',!fs.readFileSync(path.join(ROOT,'index.html'),'utf8').includes('"tropics"'));
  await p.waitForTimeout(1500);
  // Offline: the app opens and the map draws from the saved copy.
  await ctx.setOffline(true);
  await p.reload();await p.waitForTimeout(1500);
  ok('opens offline',await p.evaluate(()=>!!document.querySelector('nav, .tabbar, #today, body')&&typeof goTab==='function'));
  await p.evaluate(()=>goTab('map'));await p.waitForTimeout(300);
  const drew=await p.evaluate(async()=>{ensureTab('map');for(let i=0;i<40;i++){if(document.querySelectorAll('#worldmap .o').length)break;await new Promise(r=>setTimeout(r,100))}return document.querySelectorAll('#worldmap .o').length});
  ok('map draws offline',drew>40,drew);
  const zm=await p.evaluate(async()=>{selectOrigin('kenya',true);await new Promise(r=>setTimeout(r,700));return [...document.querySelectorAll('#worldmap .sel')].length});
  ok('selecting an origin marks it',zm>0,zm);
  await ctx.setOffline(false);
  // A new version on the server: the page still opens at once from the saved copy, then offers a reload.
  {const f=path.join(DIR,'index.html');fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(/const BUILD_ID="\w+"/,'const BUILD_ID="newbuild0001"'))}
  await p.reload();await p.waitForTimeout(400);
  const t=await p.waitForFunction(()=>{const t=document.getElementById('toast');return t&&t.classList.contains('show')&&/new version/i.test(t.textContent)},null,{timeout:12000}).then(()=>true,()=>false);
  ok('offers a reload when a new version is saved',t,await p.evaluate(async()=>{const r=await caches.match('./index.html');const tx=r&&await r.text();return [BUILD_ID,tx&&(tx.match(/const BUILD_ID="(\w+)"/)||[])[1],await caches.keys(),(await (await caches.open(await caches.keys().then(k=>k[0]))).keys()).map(r=>r.url).slice(0,4)]}));
  const same=await p.reload().then(()=>p.waitForTimeout(2500)).then(()=>p.evaluate(()=>{const t=document.getElementById('toast');return t&&t.classList.contains('show')&&/new version/i.test(t.textContent)}));
  ok('no reload offer when nothing changed',!same);
  ok('privacy page is its own page',await p.goto(U+'privacy.html').then(()=>p.evaluate(()=>!document.getElementById('worldmap'))));
  ok('no page errors',!errs.length,errs);
  await b.close();srv.kill();fs.rmSync(DIR,{recursive:true,force:true});console.log('done')})().catch(e=>{console.log('FAIL crash '+e.message);srv.kill();process.exit(1)});
