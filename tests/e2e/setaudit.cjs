// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:392,height:800},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1000);
await p.evaluate(()=>goTab('settings'));await p.waitForTimeout(1200);
const aligned=()=>p.evaluate(()=>[...document.querySelectorAll('#settings-in .seg')].filter(s=>s.offsetParent).map(s=>{const i=s.querySelector(':scope>.seg-ind'),on=s.querySelector(':scope>button[aria-pressed="true"]');if(!i||!on)return s.id+':noind';const a=i.getBoundingClientRect(),c=on.getBoundingClientRect();return Math.abs(a.left-c.left)<1.5&&Math.abs(a.width-c.width)<1.5&&Math.abs(a.top-c.top)<1.5?'':s.id+':off'}).filter(Boolean));
const pick=async(sel,label)=>{const r=await p.evaluate(async sel=>{const el=document.querySelector(sel);el.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,300));const y=scrollY,top=el.getBoundingClientRect().top,vibe=document.querySelector('#settings-in .vibe');el.click();await new Promise(r=>setTimeout(r,500));
  const el2=document.querySelector(sel);return {dy:Math.round(el2.getBoundingClientRect().top-top),sameVibe:vibe===document.querySelector('#settings-in .vibe'),pressed:el2.getAttribute('aria-pressed')}},sel);
  ok(label+': stays in place, page not rebuilt, picked',Math.abs(r.dy)<=2&&r.sameVibe&&r.pressed==='true',r);const al=await aligned();ok(label+': every highlight on its option',!al.length,al)};
ok('highlights aligned on open',!(await aligned()).length,await aligned());
await pick('#st-start [data-v="beans"]','start');await pick('#st-resume [data-v="keep"]','resume');await pick('#st-text [data-v="l"]','text large');await pick('#st-text [data-v="m"]','text std');
await pick('#st-mode [data-v="dark"]','mode dark');await pick('#st-mode [data-v="light"]','mode light');
const vb=await p.evaluate(()=>[...document.querySelectorAll('#settings-in .vibe')].map(x=>x.dataset.vibe));await pick('#settings-in .vibe[data-vibe="'+vb[1]+'"]','vibe');
const ac=await p.evaluate(()=>[...document.querySelectorAll('#settings-in .swatch')].map(x=>x.dataset.accent));await pick('#settings-in .swatch[data-accent="'+ac[2]+'"]','accent');
const lg=await p.evaluate(()=>[...document.querySelectorAll('#settings-in .logopick')].map(x=>x.dataset.logo));await pick('#settings-in .logopick[data-logo="'+lg[1]+'"]','logo');
await pick('#st-motion [data-v="reduced"]','motion reduced');await pick('#st-motion [data-v="full"]','motion full');
ok('one pressed per strip',await p.evaluate(()=>[...document.querySelectorAll('#settings-in .seg')].every(s=>s.querySelectorAll('[aria-pressed="true"]').length===1)));
await p.evaluate(()=>goTab('dial'));await p.waitForTimeout(600);await p.evaluate(()=>goTab('settings'));await p.waitForTimeout(900);ok('reopen: highlights aligned',!(await aligned()).length,await aligned());
ok('no errors',!errs.length,errs);await b.close()})()
