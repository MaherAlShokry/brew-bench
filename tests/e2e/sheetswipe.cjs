// Sheet gestures on a phone: a swipe from the left edge goes back (closes a sheet with nowhere to go back to, or
// returns to the sheet before), a pull down at the top closes it, and a short or slow drag springs back. Nothing is
// left behind (no transform) once it's done, and the next sheet opens normally.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
// A drag: touch events on the sheet, step by step.
const drag=(x0,y0,x1,y1,ms)=>p.evaluate(async([x0,y0,x1,y1,ms])=>{const d=$('vd'),n=10,T=(x,y)=>new Touch({identifier:1,target:d,clientX:x,clientY:y});
  const fire=(type,x,y)=>d.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:type==='touchend'?[]:[T(x,y)],changedTouches:[T(x,y)]}));
  fire('touchstart',x0,y0);for(let i=1;i<=n;i++){await new Promise(r=>setTimeout(r,ms/n));fire('touchmove',x0+(x1-x0)*i/n,y0+(y1-y0)*i/n)}fire('touchend',x1,y1)},[x0,y0,x1,y1,ms]);
const st=()=>p.evaluate(()=>({open:$('vd').open,tf:$('vd').style.transform,title:($('vd-title')||{}).textContent}));
await p.evaluate(()=>openBean(BEANS[0].id));await p.waitForTimeout(800);
await drag(8,400,90,404,600);await p.waitForTimeout(400);let s=await st();ok('a short, slow edge swipe springs back',s.open&&!s.tf,s);
await drag(8,400,300,404,250);await p.waitForTimeout(600);s=await st();ok('an edge swipe across closes the sheet',!s.open&&!s.tf,s);
await p.evaluate(()=>openBean(BEANS[1].id));await p.waitForTimeout(800);s=await st();ok('the next sheet opens normally',s.open&&!s.tf,s);
await drag(200,300,200,560,300);await p.waitForTimeout(600);s=await st();ok('a pull down at the top closes it',!s.open&&!s.tf,s);
await p.evaluate(()=>openBean(BEANS[0].id));await p.waitForTimeout(800);await p.evaluate(()=>$('vd').scrollTop=400);await p.waitForTimeout(100);
await drag(200,300,200,560,300);await p.waitForTimeout(500);s=await st();ok('scrolled down, a downward drag scrolls rather than closes',s.open,s);
await p.evaluate(()=>$('vd').close());await p.waitForTimeout(500);
// Back to the sheet before: a coffee opened from its origin.
await p.evaluate(()=>openOrigin(BEANS[0].origin));await p.waitForTimeout(800);const t0=(await st()).title;
await p.evaluate(()=>document.querySelector('#vd [data-bean]').click());await p.waitForTimeout(900);const t1=(await st()).title;
await drag(8,400,300,404,250);await p.waitForTimeout(900);s=await st();ok('an edge swipe returns to the sheet before',s.open&&s.title===t0&&t1!==t0&&!s.tf,{t0,t1,s});
ok('no page errors',!errs.length,errs);await b.close()})();
