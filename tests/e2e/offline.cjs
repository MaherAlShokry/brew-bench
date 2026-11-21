// Offline: after one visit with a connection, the app opens with none. The page comes from its saved copy, the Origins
// map draws, coffee photos (kept on the phone) show, the fonts load, and nothing errors.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
// A photo for the first coffee, kept on the phone like one taken in the app.
await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=c.height=200;const x=c.getContext('2d');x.fillStyle='#7a4524';x.fillRect(0,0,200,200);const b=BEANS[0];await BIMG.put(b.id,c.toDataURL('image/jpeg',.8));b.img=true;saveBeans()});
const sw=await p.evaluate(async()=>{if(!navigator.serviceWorker)return'none';const r=await Promise.race([navigator.serviceWorker.ready.then(()=>'ready'),new Promise(r=>setTimeout(()=>r('timeout'),15000))]);
  await new Promise(r=>setTimeout(r,1500));return r+':'+(await caches.keys()).join(',')});
ok('the app is saved for offline use after the first visit',/^ready:brew-bench/.test(sw),sw);
await ctx.setOffline(true);await p.reload();await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),o={online:navigator.onLine,booted:typeof goTab==='function'&&!!document.querySelector('main section.on')};
  goTab('map');await w(2000);o.paths=document.querySelectorAll('#map svg path, #map path').length;
  openBean(BEANS[0].id);await w(1200);o.pic=!!document.querySelector('dialog[open] .bd-hero img[src^="data:"]');
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  o.font=!!(await caches.match('vendor/fonts/inter-latin-opsz-normal.woff2'))&&!!(await caches.match('vendor/fonts.css'));return o});
ok('with no connection the app opens from its saved copy',r.online===false&&r.booted,r);
ok('the Origins map draws offline',r.paths>50,r);
ok('coffee photos show offline',r.pic,r);
ok('the fonts are kept for offline use',r.font,r);
ok('no page errors',!errs.length,errs);await b.close()})();
