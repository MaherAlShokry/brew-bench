// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});await c.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(700);
 const rec=await p.evaluate(()=>RECIPES.findIndex(r=>/Ultimate V60/.test(r.name)));
 const now=()=>p.evaluate(i=>({zp6:settingFor('zp6','v60',RECIPES[i].off),k:settingFor('kultra','v60',RECIPES[i].off),neoK:settingFor('kultra','neo',0)}),rec);
 const a0=await now();await p.evaluate(()=>goGear('set'));await p.waitForTimeout(400);
 ok('section shows both grinders',await p.evaluate(()=>document.querySelectorAll('#st-grind .gs').length),2);
 // nudge K-Ultra 2 finer
 for(let i=0;i<2;i++)await p.click('#st-grind .gs[data-g="kultra"] [data-gall="-1"]');
 const a1=await now();ok('K-Ultra nudge: recipes 2 clicks finer',a1.k===a0.k-2&&a1.zp6===a0.zp6&&a1.neoK===a0.neoK-2,[a0,a1]);
 // per brewer: ZP6 V60 +3
 await p.click('#st-grind details[data-g="zp6"] summary');for(let i=0;i<3;i++)await p.click('#st-grind .gs[data-g="zp6"] .gs-row[data-b="v60"] [data-gb="1"]');
 const a2=await now();ok('ZP6 on the V60 +3: V60 recipes follow',a2.zp6===a0.zp6+3,[a0.zp6,a2.zp6]);
 ok('details stay open',await p.evaluate(()=>document.querySelector('#st-grind details[data-g="zp6"]').open));
 ok('recipe card shows the new ZP6 setting',await p.evaluate(i=>{showTab('recipes');return true},rec));
 await p.evaluate(i=>openRecipe(i),rec);await p.waitForTimeout(400);const card=await p.evaluate(i=>{const t=document.querySelector('dialog[open]').innerText;return [t.includes(dial('zp6',settingFor('zp6','v60',RECIPES[i].off))),dial('zp6',settingFor('zp6','v60',RECIPES[i].off)),(t.match(/ZP6[^\n]{0,40}/)||[''])[0]]},rec);ok('recipe page shows the new ZP6 setting',card[0],card.slice(1));await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await p.reload();await p.waitForTimeout(700);const a3=await now();ok('kept after reopening',a3.zp6===a2.zp6&&a3.k===a2.k,[a2,a3]);
 await p.evaluate(()=>goGear('set'));await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('#st-grind details[data-g="kultra"]').open=true);
 await p.screenshot({path:'grind-settings.png',fullPage:true,clip:await p.evaluate(()=>{const r=document.getElementById('st-grind').getBoundingClientRect();return {x:0,y:Math.max(0,r.top+scrollY-50),width:390,height:Math.min(1400,r.height+60)}})});
 await p.click('#st-grind .gs[data-g="kultra"] [data-greset]');const a4=await now();ok('K-Ultra nudge cleared (it still follows the ZP6 V60 change)',a4.k===a0.k+3,[a0.k,a4.k]);
 await p.evaluate(()=>{document.querySelector('#st-grind details[data-g="zp6"]').open=true});await p.click('#st-grind .gs-row[data-b="v60"] [data-gbreset]');const a5=await now();ok('ZP6 V60 reset: both grinders back to the app settings',a5.zp6===a0.zp6&&a5.k===a0.k,[a0,a5]);
 ok('no errors',!errs.length,errs);await b.close()})();
