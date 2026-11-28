// Four fixes: (1) going back from a page never zooms the app out (the page sliding off the edge made the browser fit
// a wider page, the whole app shrank for half a second and the scroll jumped); (2) Surprise me picks from every recipe
// for a brewer before repeating; (3) the finish card's flavours are the bag's own, matched to the wheel; (4) the timer
// holds at steps that need you (valve, flip, kettle to a new temperature) and carries on when you tap Next.
{const o=require('path').join(__dirname,'out');require('fs').mkdirSync(o,{recursive:true});process.chdir(o)}
const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));const errs=[];
const c=await b.newContext({...devices['Pixel 7']});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForFunction(()=>window.BEANS_OK,null,{timeout:20000});await p.waitForTimeout(1500);
// 1. Back from a page inside Settings: the viewport never changes size and the scroll stays put.
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(700);await p.evaluate(()=>scrollTo(0,200));await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('#settings [data-go="log"]').click());await p.waitForTimeout(900);
const z=await p.evaluate(()=>new Promise(r=>{const h=[],y=[];const t0=performance.now();const f=()=>{h.push(innerHeight);y.push(Math.round(scrollY));if(performance.now()-t0<900)requestAnimationFrame(f);else r({h:[...new Set(h)],y:[...new Set(y)]})};history.back();requestAnimationFrame(f)}));
ok('going back never zooms the app out',z.h.length===1,z);ok('…and the page stays where you were',z.y.length===1&&Math.abs(z.y[0]-200)<=2,z);
// 2. Surprise me with the Switch: the real Switch recipes, all of them before any repeats.
await p.evaluate(()=>{showTab('recipes')});await p.waitForTimeout(600);await p.evaluate(()=>document.querySelector('#rhome [data-q="surprise"]').click());await p.waitForTimeout(700);
await p.evaluate(()=>{const c=document.querySelector('#vd-in [data-mk="b"][data-v="sw"]');if(c)c.click();const l=document.querySelector('#vd-in [data-lock="b"]');if(l)l.click()});await p.waitForTimeout(200);
const sw=await p.evaluate(async()=>{const n=RECIPES.filter(r=>RFAM(r.b)==='sw'&&!ICED(r)).length,seen=[];for(let i=0;i<n;i++){seen.push($('vd-in').querySelector('.mk-ht b').textContent);$('mk-again').click();await new Promise(r=>setTimeout(r,60))}
  return{n,distinct:new Set(seen).size,lib:seen.every(t=>RECIPES.some(r=>r.name===t)),btn:$('mk-save').textContent}});
ok('Surprise me goes through every Switch recipe before repeating',sw.n>=4&&sw.distinct===sw.n&&sw.lib,sw);ok('…and its button brews that recipe',/Brew it/.test(sw.btn),sw.btn);
await p.evaluate(()=>$('vd').close());
// 3. The bag's notes, as written, each matched to a wheel note.
const bn=await p.evaluate(()=>['Plum jam, cranberry & dark chocolate','Mixed berries / cacao nibs','Peach and Honey'].map(x=>bagNotes(x).map(w=>w+'='+((noteLeaf(w)||{}).n||'none'))));
ok('bag notes split on , & / and, kept as written, matched to the wheel',JSON.stringify(bn)===JSON.stringify([['Plum jam=Plum','cranberry=Cranberry','dark chocolate=Dark chocolate'],['Mixed berries=Raspberry','cacao nibs=Cacao'],['Peach=Peach','Honey=Honey']]),bn);
// 4. The timer holds at the valve and the kettle, and carries on with Next.
const i=await p.evaluate(()=>RECIPES.findIndex(r=>r.name==='New Hybrid (2025)'));await p.evaluate(i=>openTimerNow(i),i);await p.waitForTimeout(400);
const hs=await p.evaluate(()=>TM.ev.filter(e=>e.h).map(e=>mmss(e.t)+' '+stepTxt(e.s)));
ok('valve and kettle steps are holds',JSON.stringify(hs)===JSON.stringify(['0:45 Open the valve.','2:10 Close the valve, water at 70°C.','2:45 Open the valve.']),hs);
await p.evaluate(()=>$('tm-go').click());await p.evaluate(()=>{TM.t0-=46000});await p.waitForTimeout(900);
const h1=await p.evaluate(()=>({el:Math.round(TM.el),run:TM.run,step:$('tm-step').textContent}));
ok('the clock stops at a hold and waits',h1.el===45&&!h1.run&&h1.step==='Your move',h1);
await p.evaluate(()=>$('tm-skip').click());await p.waitForTimeout(500);
const h2=await p.evaluate(()=>({el:TM.el,run:TM.run,now:$('tm-now').textContent}));
ok('Next carries on from there, into the pour',h2.run&&h2.el>=45&&h2.el<46.5&&/Pour to 120g/.test(h2.now),h2);
await p.evaluate(()=>$('timer').close());
ok('no page errors',!errs.length,errs);await b.close()})();
