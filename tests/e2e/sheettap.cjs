// Taps never go through a sheet to the page behind it. Sheets open as popovers, whose backdrop doesn't take taps by
// itself: with the Share sheet open over the brew log, a tap on "Pick from your beans" showing above the sheet opened
// the bean picker. Now a tap outside the top sheet only closes that sheet, and a tap while a sheet slides away does
// nothing; taps inside the sheet still work.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-onboarded','1')});
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>{goTab('log');openLogForm(false)});await p.waitForTimeout(800);
// Count clicks that reach the page behind, and put "Pick from your beans" well above where the sheet will be.
const at=await p.evaluate(()=>{window.__hits=0;document.querySelector('main').addEventListener('click',()=>window.__hits++);
  const e=[...document.querySelectorAll('[data-dbpick]')].find(e=>e.getClientRects().length);scrollBy(0,e.getBoundingClientRect().top-160);
  const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});
const open=()=>p.evaluate(()=>[...document.querySelectorAll('dialog[open]')].map(d=>d.id+(d.classList.contains('closing')?'~':'')));
await p.evaluate(()=>openShareNow({title:'Join my brew log',text:'x'}));await p.waitForTimeout(700);
ok('the Share sheet is open',(await open()).join()==='sharesheet',await open());
const sheetTop=await p.evaluate(()=>$('sharesheet').getBoundingClientRect().top);
ok('the bean button shows above the sheet',at.y<sheetTop-20,{at,sheetTop});
await p.touchscreen.tap(at.x,at.y);await p.waitForTimeout(700);
ok('a tap on the page behind reaches nothing',await p.evaluate(()=>window.__hits)===0,await p.evaluate(()=>window.__hits));
ok('no bean picker opened, and the tap outside closed the sheet',!(await open()).length,await open());
// A tap while the sheet slides away lands nowhere.
await p.evaluate(()=>openShareNow({title:'Join my brew log',text:'x'}));await p.waitForTimeout(700);
await p.evaluate(()=>$('sharesheet').close());await p.waitForTimeout(40);await p.touchscreen.tap(at.x,at.y);await p.waitForTimeout(700);
ok('a tap while the sheet closes reaches nothing',await p.evaluate(()=>window.__hits)===0&&!(await open()).length,{hits:await p.evaluate(()=>window.__hits),open:await open()});
// Taps inside a sheet still work: the Close button.
await p.evaluate(()=>openShareNow({title:'Join my brew log',text:'x'}));await p.waitForTimeout(700);
await p.tap('#sh-x');await p.waitForTimeout(600);ok('the sheet’s own buttons still work',!(await open()).length,await open());
// With no sheet open, the page takes taps as usual.
await p.touchscreen.tap(at.x,at.y);await p.waitForTimeout(800);
ok('with no sheet open, the bean button works',(await open()).length>0||await p.evaluate(()=>window.__hits)>0,await open());
ok('no page errors',!errs.length,errs);
await b.close()})();
