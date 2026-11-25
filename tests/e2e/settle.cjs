// A finished intro animation on a hidden page (the flavour wheel's spin-in, the variety tree's lines, a slide's end)
// kept the browser drawing 60 frames a second with nothing moving. Hidden pages let theirs go without anything on
// screen changing, loops on hidden pages pause and go on when shown, and the app sits still when nothing moves.
{const o=require('path').join(__dirname,'out');require('fs').mkdirSync(o,{recursive:true});process.chdir(o)}
const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));const errs=[];
const c=await b.newContext({...devices['Pixel 7']});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForFunction(()=>window.BEANS_OK,null,{timeout:20000});
// Build the wheel and the variety tree out of sight, as the app does in the background, and let their intros finish.
await p.evaluate(()=>{for(const k of ['wheel','history','variety'])if(LAZY[k]&&!BUILT[k]){BUILT[k]=1;LAZY[k]()}});await p.waitForFunction(()=>{const l=document.getAnimations().filter(a=>{const el=a.effect&&a.effect.target,s=el&&el.closest&&el.closest('main>section');return s&&!s.classList.contains('on')&&a.effect.getComputedTiming().iterations!==Infinity});
  return l.length&&l.every(a=>a.playState==='finished')},null,{timeout:20000,polling:250});
const hiddenDone=()=>p.evaluate(()=>document.getAnimations().filter(a=>{const el=a.effect&&a.effect.target,s=el&&el.closest&&el.closest('main>section');return s&&!s.classList.contains('on')&&a.playState==='finished'}).length);
const before=await hiddenDone();
await p.evaluate(()=>settleHidden());const after=await hiddenDone();
ok('finished animations on hidden pages are let go',before>0&&after===0,{before,after});
// Nothing on screen changes: an intro that ends at the element's own look is let go; one that ends somewhere else
// (held there by its fill) is kept exactly where it ended.
const look=await p.evaluate(async()=>{const s=$('explore'),mk=()=>{const i=document.createElement('i');i.style.cssText='display:block;width:4px;height:4px;opacity:.5';s.prepend(i);return i};
  const a1=mk(),a2=mk();const x1=a1.animate([{opacity:0},{opacity:.5}],{duration:20,fill:'both'}),x2=a2.animate([{opacity:0},{opacity:1,transform:'translateX(3px)'}],{duration:20,fill:'forwards'});
  await x1.finished;await x2.finished;settleHidden();const r={same:[x1.playState,getComputedStyle(a1).opacity],differs:[x2.playState,getComputedStyle(a2).opacity,getComputedStyle(a2).transform]};a1.remove();a2.remove();return r});
ok('an intro ending at the element\'s own look is let go; one ending elsewhere stays where it ended',
  look.same[0]==='idle'&&look.same[1]==='0.5'&&look.differs[0]==='finished'&&look.differs[1]==='1'&&look.differs[2]==='matrix(1, 0, 0, 1, 3, 0)',look);
// A looping animation on a hidden page pauses, and plays again when its page is shown.
const loop=await p.evaluate(async()=>{const s=$('explore');const i=document.createElement('i');i.style.cssText='display:block;width:4px;height:4px';s.prepend(i);
  const a=i.animate([{transform:'none'},{transform:'translateY(2px)'}],{duration:500,iterations:Infinity});settleHidden();const hid=a.playState;
  showTab('explore');await new Promise(r=>setTimeout(r,60));const shown=a.playState;a.cancel();i.remove();return{hid,shown}});
ok('a loop on a hidden page pauses and goes on when the page is shown',loop.hid==='paused'&&loop.shown==='running',loop);
// After a switch, once the slide is done and the background work has had its moment, nothing hidden is left over.
await p.evaluate(()=>showTab('dial'));await p.waitForTimeout(400);await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(3500);
ok('the switch to a page leaves nothing on the hidden pages still asking to be drawn',await hiddenDone()===0,await hiddenDone());
ok('no page errors',!errs.length,errs);await b.close()})();
