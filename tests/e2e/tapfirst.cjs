// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Buttons that open a sheet or a page answer the tap first: the button shows pressed in the very next frame, and the
// sheet or page follows. Real taps (a tap from code opens at once).
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
// Watch the first frame after the tap: is the button pressed, and is the sheet already open?
const watch=()=>p.evaluate(()=>{window.__f=null;addEventListener('click',e=>{const b=e.target.closest('button,a,[role=button],.tile,.qtool,.hubtile');requestAnimationFrame(()=>{window.__f={pressed:!!(b&&(b.classList.contains('tapped-b')||b.classList.contains('tapped'))),open:!!document.querySelector('dialog[open]')}})},{once:true,capture:true})});
const run=async(name,sel,done)=>{await p.waitForTimeout(500);const el=await p.$(sel);if(!el){ok(name+': button there',false,sel);return}await el.scrollIntoViewIfNeeded();await watch();await el.tap();await p.waitForTimeout(900);
  const f=await p.evaluate(()=>window.__f),d=await p.evaluate(done);ok(name+': pressed in the first frame',f&&f.pressed,f);ok(name+': then it opens',d,d);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(x=>x.close()))};
await p.evaluate(()=>loadRecipe(0));await p.waitForTimeout(600);
await run('start timer','#mr-play',()=>!!document.querySelector('dialog[open]'));
await run('share','#ab-share',()=>$('sharesheet').open);
await p.evaluate(()=>goTab('explore'));await run('explore tile','#explore [data-go="map"]',()=>$('map').classList.contains('on'));
// From code it still opens at once.
const now=await p.evaluate(()=>{openShare(dialDoc());return $('sharesheet').open});ok('from code: opens at once',now);
ok('no errors',!errs.length,errs);await b.close()})();
