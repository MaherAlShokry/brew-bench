const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:392,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:'dark'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1000);
await p.evaluate(()=>goTab('log'));await p.waitForTimeout(800);await p.evaluate(()=>$('l-filter').scrollIntoView());await p.evaluate(()=>scrollBy(0,-70));await p.waitForTimeout(400);await p.screenshot({path:'ls1.png'});
const n=await p.evaluate(()=>$('l-track').children.length);
await p.click('[data-lgo="1"]');await p.waitForTimeout(700);
const s1=await p.evaluate(()=>[$('l-pos').textContent,document.querySelector('[data-lgo="-1"]').disabled,Math.round($('l-track').children[1].getBoundingClientRect().left)]);ok('next arrow moves one brew',s1[0]==='2 of '+n&&!s1[1]&&s1[2]===10,s1);
await p.screenshot({path:'ls2.png'});
const sw=await p.evaluate(()=>document.documentElement.scrollWidth);ok('no page sideways scroll',sw<=392,sw);
ok('no errors',!errs.length,errs);await b.close()})()
