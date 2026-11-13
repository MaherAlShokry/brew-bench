const {chromium}=require('playwright');const S='nav/';require('fs').mkdirSync(S,{recursive:true});
const ok=(c,m,x)=>console.log((c?'  ok  ':'  FAIL')+' '+m+(x!==undefined?'  ('+x+')':''));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await ctx.route(/.*/,r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
 const on=()=>p.evaluate(()=>document.querySelector('main section.on').id);
 await p.evaluate(()=>{window.__vt=0;const o=document.startViewTransition.bind(document);document.startViewTransition=f=>{__vt++;return o(f)}});
 // a tap on the bottom bar: the new page swings in on its own (no view transition), the highlight moves at once
 // The highlight answers the tap at once; the page follows in the next frame.
await p.tap('.bottomnav [data-bn="recipes"]');const now=await p.evaluate(()=>document.querySelector('.bottomnav [data-bn="recipes"]').getAttribute('aria-current'));ok(now==='true','the highlight moves on the tap itself',now);
await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(()=>requestAnimationFrame(r),0))));const mid=await p.evaluate(()=>[document.documentElement.dataset.nav,document.documentElement.classList.contains('vt'),$('recipes').classList.contains('nav-in'),document.querySelector('.bottomnav [data-bn="recipes"]').getAttribute('aria-current')]);
 for(const t of [60,140,240,380])await p.waitForTimeout(t===60?60:t-[60,140,240,380][[60,140,240,380].indexOf(t)-1]).then(()=>p.screenshot({path:S+'right-'+t+'.png'}));
 await p.waitForTimeout(500);ok(await on()==='recipes','bottom bar: on Recipes');ok(mid[0]==='right'&&!mid[1]&&mid[2]&&mid[3]==='true','moving right: new page swings in, highlight already moved',mid.join());
 ok(await p.evaluate(()=>__vt===0&&!document.documentElement.classList.contains('vt')),'no view transition between sections');
 ok(await p.evaluate(()=>document.querySelector('#ab-title').textContent),'title updated',await p.evaluate(()=>document.querySelector('#ab-title').textContent));
 // into a page from Explore (push), then back (pop)
 await p.tap('.bottomnav [data-bn="explore"]');await p.waitForTimeout(800);
 await p.evaluate(()=>document.querySelector('#explore-in [data-go="variety"]').click());const k1=await p.evaluate(()=>document.documentElement.dataset.nav);
 for(const t of [80,200,360])await p.waitForTimeout(t===80?80:t===200?120:160).then(()=>p.screenshot({path:S+'push-'+t+'.png'}));await p.waitForTimeout(500);
 ok(await on()==='variety'&&k1==='push','Explore tile: pushes into Varieties',k1);
 await p.goBack();await p.waitForTimeout(80);const k2=await p.evaluate(()=>document.documentElement.dataset.nav);await p.screenshot({path:S+'pop-80.png'});await p.waitForTimeout(150);await p.screenshot({path:S+'pop-230.png'});await p.waitForTimeout(600);
 ok(await on()==='explore'&&k2==='pop','back: pops out to Explore',k2);
 // an action that jumps to a page then scrolls stays in place, at once
 const sync=await p.evaluate(()=>{const before=__vt;openProcess(Object.keys(PROCESSES)[8]);return[document.querySelector('main section.on').id,__vt===before]});
 ok(sync[0]==='process'&&sync[1],'actions switch at once, no view transition',sync.join());await p.waitForTimeout(900);
 ok(await p.evaluate(()=>scrollY>100),'and their scroll to the card still works',await p.evaluate(()=>Math.round(scrollY)));
 await p.evaluate(()=>openWord(GLOSSARY[40][0]));await p.waitForTimeout(900);ok(await p.evaluate(()=>document.querySelector('main section.on').id==='words'&&!!document.querySelector('#wlist .wcard.open')),'jump to a word: opened');
 // cascade
 await p.tap('.bottomnav [data-bn="dial"]');await p.waitForTimeout(150);const lat=await p.evaluate(()=>document.querySelectorAll('.cascade').length);ok(lat===0,'bottom bar: the page swings in whole, no block cascade',lat);
 await p.waitForTimeout(900);await p.tap('.bottomnav [data-bn="explore"]');await p.waitForTimeout(900);
 await p.evaluate(()=>showTab('process'));await p.waitForTimeout(150);const cas=await p.evaluate(()=>document.querySelectorAll('.cascade').length);await p.waitForTimeout(1600);
 ok(cas===0,'into a page: it slides in whole, like every page (no block cascade)',cas);
 // reduced motion: nothing animates, no view transition
 await p.evaluate(()=>{document.documentElement.setAttribute('data-motion','reduced');__vt=0});await p.tap('.bottomnav [data-bn="beans"]');await p.waitForTimeout(100);
 ok(await on()==='beans'&&await p.evaluate(()=>__vt===0&&document.querySelectorAll('.cascade').length===0),'reduced motion: plain switch');
 // quick double taps don't break
 await p.evaluate(()=>document.documentElement.setAttribute('data-motion','full'));await p.tap('.bottomnav [data-bn="recipes"]');await p.tap('.bottomnav [data-bn="settings"]');await p.waitForTimeout(900);
 ok(await on()==='settings'&&await p.evaluate(()=>!document.documentElement.classList.contains('vt')),'fast taps land on the last one');
 console.log('errors',errs.length?errs:'none');await b.close()})();
