// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));const D='';
 for(const m of ['light','dark']){const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});await c.addInitScript(m=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',m)},m);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(700);
 if(m==='light'){
 await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(300);ok('Settings has the shortcut, not the full section',await p.evaluate(()=>!!document.querySelector('#settings [data-gearto="set"]')&&!document.querySelector('#settings #st-grind')));
 await p.click('#settings [data-gearto="set"]');await p.waitForTimeout(500);
 ok('shortcut opens Gear on Grind settings',await p.evaluate(()=>document.querySelector('main section.on').id==='gear'&&!document.querySelector('[data-gpanel="set"]').hidden&&document.querySelectorAll('#st-grind .gs').length===2));
 for(const t of ['dials','brew','lib','acc','set']){await p.click('#gear-tabs [data-gtab="'+t+'"]');await p.waitForTimeout(150);const r=await p.evaluate(t=>{const vis=[...document.querySelectorAll('#gear [data-gpanel]')].filter(x=>!x.hidden).map(x=>x.dataset.gpanel);const p=document.querySelector('[data-gpanel="'+t+'"]');return [vis.join(),p.innerText.trim().length>40]},t);ok('tab '+t+' shows only its panel, with content',r[0]===t&&r[1],r)}
 await p.click('#st-grind .gs[data-g="kultra"] [data-gall="-1"]');ok('grind settings still work here',await p.evaluate(()=>gOff('kultra')),-1);
 await p.evaluate(()=>{showTab('dial');goGear('dials')});await p.waitForTimeout(500);ok('Dials tab has Match a grind',await p.evaluate(()=>{const pn=document.querySelector('[data-gpanel="dials"]'),g=document.getElementById('gmatch');return !pn.hidden&&pn.contains(g)&&/Match a grind/.test(g.textContent)}));
 await p.evaluate(()=>{showTab('dial');showTab('gear')});ok('remembers the last tab',await p.evaluate(()=>!document.querySelector('[data-gpanel="dials"]').hidden));
 await p.evaluate(()=>gearTab('set'))}
 await p.evaluate(()=>{showTab('gear');gearTab('set');scrollTo(0,0)});await p.waitForTimeout(300);await p.screenshot({path:D+'gear-'+m+'.png'});
 if(m==='light'){await p.evaluate(()=>{gearTab('dials');scrollTo(0,0)});await p.waitForTimeout(300);await p.screenshot({path:D+'gear-dials.png'})}
 ok('no errors ('+m+')',!errs.length,errs);await c.close()}
 await b.close()})();
