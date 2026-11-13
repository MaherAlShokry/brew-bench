const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));const D='';
 for(const m of ['light','dark']){const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});await c.addInitScript(m=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',m)},m);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(700);
 if(m==='light'){ok('banner shows before a recipe is picked',await p.evaluate(()=>{showTab('dial');return getComputedStyle(document.querySelector('.herowrap')).display!=='none'||innerWidth>760}));}
 await p.evaluate(()=>{useBean(BEANS[0]);loadRecipe(RECIPES.findIndex(r=>/Ultimate V60/.test(r.name)));showTab('dial');scrollTo(0,0)});await p.waitForTimeout(600);
 const r=await p.evaluate(()=>({banner:getComputedStyle(document.querySelector('.herowrap')).display,steps:[...document.querySelectorAll('#dial .dstep')].map(d=>d.dataset.step+(d.open?'+':'-')+': '+d.querySelector('small').textContent),h:document.documentElement.scrollHeight,shares:[...document.querySelectorAll('#dial button')].filter(b=>b.offsetParent&&/^Share/.test(b.textContent.trim())).length}));
 console.log(JSON.stringify(r,null,1));
 if(m==='light'){ok('banner hidden once a recipe is picked',r.banner==='none');ok('no duplicate Share buttons on the page',r.shares<=1,r.shares);
  await p.click('#dial .dstep[data-step="gear"] summary');ok('tap a step to open it',await p.evaluate(()=>document.querySelector('#dial .dstep[data-step="gear"]').open));
  // The open step is saved on the toggle event, which comes just after the click; let it land before reloading, and
  // give a slower machine time to set the page up again.
  await p.waitForFunction(()=>{try{return JSON.parse(localStorage.getItem('bb-dsteps')||'{}').gear===true}catch(e){return false}},null,{timeout:5000}).catch(()=>{});
  await p.reload();ok('open steps are remembered',await p.waitForFunction(()=>{const d=document.querySelector('#dial .dstep[data-step="gear"]');return d&&d.open},null,{timeout:6000}).then(()=>true,()=>false));
  await p.click('#dial .dstep[data-step="gear"] summary');
  await p.evaluate(()=>{const e=document.getElementById('i-temp');e.value=95;e.dispatchEvent(new Event('input',{bubbles:true}))});await p.waitForTimeout(200);ok('fine-tune summary follows the sliders',await p.evaluate(()=>{document.querySelector('#dial .dstep[data-step="tune"]').open=false;return document.getElementById('ds-tune').textContent.includes('95°C')}));
  await p.evaluate(()=>document.querySelector('#dial .dstep[data-step="tune"]').open=true)}
 await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300);await p.screenshot({path:D+'dial-steps-'+m+'.png'});
 ok('no errors ('+m+')',!errs.length,errs);await c.close()}await b.close()})();
