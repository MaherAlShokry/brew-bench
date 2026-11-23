// Android (the app and Chrome) draws no frosted blur: every blurred bar or badge re-blurs what's behind it on each
// frame of a scroll or slide, slow on a phone GPU. Elsewhere the blur stays. Warming a sheet in a quiet moment lays
// out only its first screen and leaves nothing behind.
{const o=require('path').join(__dirname,'out');require('fs').mkdirSync(o,{recursive:true});process.chdir(o)}
const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));const errs=[];
const open=async(ctx)=>{const c=await b.newContext(ctx);const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
  await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForFunction(()=>window.BEANS_OK,null,{timeout:20000});
  await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(1500);return p};
const blur=p=>p.evaluate(()=>{const f=s=>{const e=document.querySelector(s);return e?getComputedStyle(e).backdropFilter:'(none here)'};
  return{droid:document.documentElement.classList.contains('droid'),nav:f('.bottomnav'),pill:f('.bglass'),any:[...document.querySelectorAll('body *')].some(e=>{const v=getComputedStyle(e).backdropFilter;return v&&v!=='none'})}});
const a=await blur(await open({...devices['Pixel 7']}));
ok('on Android nothing is blurred (bars, rating pills, anything)',a.droid&&a.nav==='none'&&!a.any,a);
const pc=await open({viewport:{width:390,height:844}});const d=await blur(pc);
ok('elsewhere the frosted glass stays',!d.droid&&d.any,d);
const w=await pc.evaluate(()=>{SHEETS_WARM=0;warmSheets();const d=$('vd');return{open:d.open,lite:d.classList.contains('vd-lite'),warm:d.classList.contains('warm'),empty:!$('vd-in').firstChild}});
ok('warming a sheet out of sight leaves it closed, empty and plain',!w.open&&!w.lite&&!w.warm&&w.empty,w);
await pc.evaluate(()=>openBean(BEANS[0].id));await pc.waitForTimeout(900);
const o=await pc.evaluate(()=>{const d=$('vd');return{open:d.open,lite:d.classList.contains('vd-lite'),secs:d.querySelectorAll('.vd-body>*').length}});
ok('a coffee still opens normally after a warmed one',o.open&&!o.lite&&o.secs>3,o);
ok('no page errors',!errs.length,errs);await b.close()})();
