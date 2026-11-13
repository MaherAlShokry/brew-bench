// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');
const TABS=['dial','beans','settings','gear','recipes'];
const grab=()=>{const out={};document.querySelectorAll('main section.on *, .appbar *, .bottomnav, .bottomnav *').forEach(e=>{if(!e.getClientRects().length)return;const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return;const s=getComputedStyle(e);
  const key=(e.id?'#'+e.id:'')+e.tagName+'.'+[...e.classList].join('.')+'@'+Math.round(r.left)+','+Math.round(r.top+scrollY);out[key]=[s.backgroundColor,s.color,s.borderTopColor].join('|')});return out};
(async()=>{const b=await chromium.launch();
 const mk=async(cs)=>{const c=await b.newContext({viewport:{width:392,height:800},isMobile:true,hasTouch:true,colorScheme:cs});const p=await c.newPage();await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');localStorage.removeItem('bb-theme')});
  await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1200);return p};
 const live=await mk('dark'),fresh=await mk('light');for(const t of TABS){await live.evaluate(t=>t==='gear'?goGear('set'):goTab(t),t);await live.waitForTimeout(600)}
 await live.emulateMedia({colorScheme:'light'});await live.waitForTimeout(600);
 for(const t of TABS){for(const p of [live,fresh]){await p.evaluate(t=>t==='gear'?goGear('set'):goTab(t),t);await p.waitForTimeout(900);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300)}
  const A=await live.evaluate(grab),B=await fresh.evaluate(grab);const d=Object.keys(A).filter(k=>k in B&&A[k]!==B[k]);console.log('auto dark→light',t,d.length,d.slice(0,5).join(' ; '))}
 await b.close()})()
