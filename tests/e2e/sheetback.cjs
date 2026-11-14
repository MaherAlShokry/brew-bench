// Back inside a sheet steps back through its pages (your roasteries → a roastery → a coffee → its origin), each where
// you were on it, then closes the sheet with the page behind it where it was too. The sheet's own Back buttons do the same.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>{goTab('beans');for(let i=0;i<14;i++){const x=BEANS[i%BEANS.length];if(x)x.roaster=['Kuf Roastery','Julith Coffee','Archers'][i%3]}saveBeans();renderBeans()});await p.waitForFunction(()=>window.BEANS_OK);await p.waitForTimeout(800);
const back=async()=>{await p.evaluate(()=>bbBack());await p.waitForTimeout(700)};
const st=()=>p.evaluate(()=>({open:$('vd').open,y:Math.round($('vd').scrollTop),page:Math.round(scrollY),t:($('vd-title')||{}).textContent||''}));
await p.evaluate(()=>scrollTo(0,900));await p.waitForTimeout(300);const pageY=await p.evaluate(()=>Math.round(scrollY));
// Your roasteries, scrolled a little; then a roastery, scrolled; then a coffee on it.
await p.evaluate(()=>openRoastersNow());await p.waitForTimeout(600);await p.evaluate(()=>{$('vd').scrollTop=60});await p.waitForTimeout(150);const y1=await p.evaluate(()=>Math.round($('vd').scrollTop));
await p.evaluate(()=>document.querySelector('#vd-in [data-ro]').click());await p.waitForTimeout(700);const t2=(await st()).t;
await p.evaluate(()=>{$('vd').scrollTop=$('vd').scrollHeight});await p.waitForTimeout(150);const y2=await p.evaluate(()=>Math.round($('vd').scrollTop));
await p.evaluate(()=>document.querySelector('#vd-in [data-bean]').click());await p.waitForTimeout(700);
ok('a coffee opens over its roastery',(await st()).t!==t2,await st());
await back();let s=await st();ok('back returns to the roastery, where you were on it',s.open&&s.t===t2&&Math.abs(s.y-y2)<4&&y2>40,[s,y2]);
await back();s=await st();ok('back again returns to your roasteries, where you were',s.open&&/roaster/.test(s.t)&&Math.abs(s.y-y1)<4,[s,y1]);
await back();s=await st();ok('back again closes the sheet, the page where it was',!s.open&&Math.abs(s.page-pageY)<4,[s,pageY]);
// The sheet's own Back button, and closing from deep inside leaves no extra steps behind.
await p.evaluate(()=>openRoastersNow());await p.waitForTimeout(600);await p.evaluate(()=>document.querySelector('#vd-in [data-ro]').click());await p.waitForTimeout(700);
await p.evaluate(()=>$('ro-back')&&$('ro-back').click());await p.waitForTimeout(700);s=await st();
ok('the roastery’s own Back steps back too',s.open&&/roaster/.test(s.t),s);
await p.evaluate(()=>document.querySelector('#vd-in [data-ro]').click());await p.waitForTimeout(700);
await p.evaluate(()=>$('vd-x').click());await p.waitForTimeout(800);s=await st();
ok('closing from inside closes it',!s.open&&Math.abs(s.page-pageY)<4,[s,pageY]);
ok('and no old steps are left behind for back to spend',await p.evaluate(()=>!(history.state&&history.state.dlg)),await p.evaluate(()=>history.state));
// The same coffee drawn again after an edit adds no step.
await p.evaluate(()=>goTab('beans'));await p.waitForTimeout(400);
await p.evaluate(()=>{openBean(BEANS[0].id)});await p.waitForTimeout(600);await p.evaluate(()=>openBean(BEANS[0].id));await p.waitForTimeout(400);
await back();ok('a coffee redrawn in place: one back closes it',!(await st()).open);
ok('no errors',!errs.length,errs);await b.close()})();
