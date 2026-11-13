// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const ok=(c,m,x)=>{console.log((c?'ok  ':'FAIL')+' '+m+(x!==undefined?'  ('+JSON.stringify(x)+')':''));if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:900},deviceScaleFactor:2,serviceWorkers:'block'});await c.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme','light')});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
await p.evaluate(()=>goTab('scan'));await p.waitForTimeout(600);
ok(await p.evaluate(()=>document.getElementById('s-variety').value==='arabica'&&document.querySelector('#s-variety ~ *, #s-variety')&&/Not sure/.test(document.getElementById('s-variety').selectedOptions[0].textContent)),'blank scan shows Variety: Not sure');
const eg=await p.evaluate(()=>{const all=[];for(const t of ['scan','beans','recipes','gear','settings','log','tech','variety','words','wheel']){try{goTab(t)}catch(e){}}return [...document.querySelectorAll('[placeholder]')].map(e=>e.placeholder).filter(x=>/e\.g\./.test(x))});
ok(eg.length===0,'no "e.g." placeholders left',eg);
await p.evaluate(()=>{goTab('scan');scrollTo(0,0)});await p.waitForTimeout(500);await p.evaluate(()=>document.getElementById('s-name').scrollIntoView({block:'center'}));await p.waitForTimeout(300);await p.screenshot({path:'shots/scanform.png'});
ok(errs.length===0,'no errors',errs);await b.close()})();
