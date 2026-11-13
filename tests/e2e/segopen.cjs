// Opening Settings: the Light / Dark / Auto highlight sits on its option from the first frame the page shows, and stays
// there while the page slides in (it used to glide in from where it was last, trailing the page).
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const errs=[];
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
for(const [mode,scheme] of [['auto','dark'],['dark','dark'],['light','light']]){const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:scheme});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(m=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',m)},mode);await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(2500);
  await p.evaluate(()=>{window.__f=[];const t0=performance.now();const step=()=>{const s=document.getElementById('st-mode'),sec=document.getElementById('settings');if(s&&sec.classList.contains('on')){const ind=s.querySelector('.seg-ind'),on=s.querySelector('[aria-pressed="true"]');
      if(ind&&on&&getComputedStyle(ind).opacity!=='0'){const r=ind.getBoundingClientRect(),o=on.getBoundingClientRect();if(o.width)__f.push(Math.round(r.left-o.left))}}if(performance.now()-t0<900)requestAnimationFrame(step)};requestAnimationFrame(step)});
  await p.tap('[data-bn="settings"]');await p.waitForTimeout(1000);
  const f=await p.evaluate(()=>__f);ok(mode+': the highlight stays on its option in every frame of the page opening',f.length>5&&f.every(d=>Math.abs(d)<=2),f.filter(d=>Math.abs(d)>2).slice(0,5));
  await c.close()}
ok('no errors',!errs.length,errs);await b.close()})();
