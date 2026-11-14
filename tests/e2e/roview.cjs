// Beans has a Roasteries view: every roastery you have coffee from, most coffees first, with how many and your
// average; a tap opens its page and back returns to the list where you were.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);await p.waitForTimeout(400);
ok('the strip has a Roastery view',await p.evaluate(()=>[...document.querySelectorAll('#bg-views button')].some(x=>x.textContent.trim()==='Roastery')));
await p.evaluate(()=>[...document.querySelectorAll('#bg-views button')].find(x=>x.textContent.trim()==='Roastery').click());await p.waitForTimeout(600);
const v=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#bv-roasteries .rov-row')];return{shown:!$('bv-roasteries').hidden,names:rows.map(r=>r.dataset.ro),n:roasteries().length,counts:rows.map(r=>+r.querySelector('.cr-tx>small').textContent.match(/\d+/)[0])}});
ok('it lists every roastery you have',v.shown&&v.names.length===v.n&&v.n>0,v);
ok('most coffees first',v.counts.every((x,i)=>!i||x<=v.counts[i-1]),v.counts);
await p.evaluate(()=>scrollTo(0,300));await p.waitForTimeout(150);const y=await p.evaluate(()=>Math.round(scrollY));
await p.evaluate(()=>document.querySelector('#bv-roasteries .rov-row').click());await p.waitForTimeout(700);
ok('a tap opens its page',await p.evaluate(n=>$('vd').open&&($('vd-title')||{}).textContent===n,v.names[0]));
await p.evaluate(()=>bbBack());await p.waitForTimeout(700);
ok('back returns to the list where you were',await p.evaluate(y=>!$('vd').open&&!$('bv-roasteries').hidden&&Math.abs(scrollY-y)<4,y));
ok('no errors',!errs.length,errs);await b.close()})();
