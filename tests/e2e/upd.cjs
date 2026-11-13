const {chromium}=require('playwright');const S='';
const ok=(c,m,x)=>console.log((c?'  ok  ':'  FAIL')+' '+m+(x!==undefined?'  ('+x+')':''));
(async()=>{const b=await chromium.launch();const errs=[];let calls=0,tag='v1.0.210';
 const mk=async(ver)=>{const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});
  await ctx.addInitScript(v=>{window.APP_VERSION=v;window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{}}},ver);
  await ctx.route(/.*/,r=>{const u=r.request().url();if(u.startsWith('http://localhost'))return r.continue();if(u.startsWith('https://api.github.com/repos/MaherAlShokry/brew-bench/releases/latest')){calls++;return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({tag_name:tag})})}return r.abort()});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));return{ctx,p}};
 let {ctx,p}=await mk('1.0.207');await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(4800);
 ok(await p.isVisible('#updcard'),'newer version: the card appears after opening');ok(/1\.0\.210/.test(await p.textContent('#updcard'))&&/1\.0\.207/.test(await p.textContent('#updcard')),'names both versions');
 await p.screenshot({path:S+'upd-card.png'});
 await p.evaluate(()=>{window.__nav=null;openLink=u=>{__nav=u}});await p.click('#upd-go');ok(await p.evaluate(()=>__nav)==='https://github.com/MaherAlShokry/brew-bench/releases/latest/download/brew-bench.apk'&&!(await p.$('#updcard')),'Update opens the download');
 await p.reload();await p.waitForTimeout(4800);ok(calls===1&&await p.isVisible('#updcard'),'no second check within 6 hours, card shown from memory',calls);
 await p.click('#upd-later');await p.waitForTimeout(400);await p.reload();await p.waitForTimeout(4800);ok(!(await p.$('#updcard')),'Later hides it');
 tag='v1.0.211';await p.evaluate(()=>{const u=JSON.parse(localStorage.getItem('bb-upd'));u.at=0;localStorage.setItem('bb-upd',JSON.stringify(u))});await p.reload();await p.waitForTimeout(4800);
 ok(await p.isVisible('#updcard')&&/1\.0\.211/.test(await p.textContent('#updcard')),'an even newer version shows again');
 // settings
 await p.evaluate(()=>{showTab('settings')});await p.waitForTimeout(500);ok(/Brew Bench 1\.0\.207/.test(await p.textContent('#settings .appver'))&&/1\.0\.211 is ready/.test(await p.textContent('#settings .appver')),'Settings opens with the version and what is ready');
 ok(await p.evaluate(()=>document.querySelector('#settings-in').firstElementChild.nextElementSibling.classList.contains('appver')),'right under the quick tools');
 await p.locator('.appver').screenshot({path:S+'upd-settings.png'});
 await p.evaluate(()=>{window.__nav=null;openLink=u=>{__nav=u}});await p.click('#st-updgo');ok(/brew-bench\.apk/.test(await p.evaluate(()=>__nav)),'Update button downloads the new version');
 tag='v1.0.207';await p.evaluate(()=>document.getElementById('st-upd').click());await p.waitForTimeout(600);ok(/latest version/.test(await p.textContent('#toast'))&&!(await p.$('#updcard')),'Check for updates: up to date',await p.textContent('#toast'));
 ok(await p.evaluate(()=>!dataKeys().includes('bb-upd')),'not in backups');await ctx.close();
 // same version: nothing
 ({ctx,p}=await mk('1.0.211'));tag='v1.0.211';await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(4800);ok(!(await p.$('#updcard')),'up to date: no card');await ctx.close();
 // the website never checks
 const w=await b.newContext({serviceWorkers:'block'});let wc=0;await w.route(/.*/,r=>{const u=r.request().url();if(u.includes('api.github.com'))wc++;return u.startsWith('http://localhost')?r.continue():r.abort()});const q=await w.newPage();await q.goto('http://localhost:8099/index.html');await q.waitForTimeout(4800);
 await q.evaluate(()=>showTab('settings'));ok(wc===0&&!(await q.$('#st-upd')),'website: no check, no version row');
 console.log('errors',errs.length?errs:'none');await b.close()})();
