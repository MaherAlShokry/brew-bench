const {chromium}=require('playwright');const S='ed/';
(async()=>{const b=await chromium.launch();const errs=[];const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
 for(const mode of (process.env.MODES||'light').split(',')){
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});await ctx.route(/.*/,r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
 await ctx.addInitScript(m=>{localStorage.setItem('bb-theme',m)},mode);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
 await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
 await p.evaluate(()=>openRecipeEditor(null));await p.waitForTimeout(500);
 await p.screenshot({path:S+mode+'-top.png'});
 await p.locator('#re-steps').scrollIntoViewIfNeeded();await p.waitForTimeout(200);await p.locator('#re-steps').screenshot({path:S+mode+'-steps.png'});
 if(mode==='light'){
  ok('starts with 4 steps',(await p.locator('.se-row').count())===4);
  await p.click('[data-add="swirl"]');ok('swirl added',(await p.locator('.se-row').count())===5,await p.locator('.se-row').last().locator('.se-x').inputValue());
  await p.click('[data-del="4"]');
  // edit a time: "75" -> 1:15
  const t=p.locator('.se-row').nth(2).locator('.se-t');await t.fill('75');await p.locator('#re-name').click();ok('75 reads as 1:15',(await t.inputValue())==='1:15',await t.inputValue());
  await t.fill('3:30');await p.locator('#re-name').click();ok('out-of-order time flagged',await p.locator('.se-row').nth(3).locator('.se-t').evaluate(e=>e.classList.contains('bad')));await t.fill('1:30');await p.locator('#re-name').click();
  ok('summary',true,await p.locator('.se-sum').textContent());
  await p.fill('#re-water','300');await p.dispatchEvent('#re-water','input');ok('ratio follows',/1:20/.test(await p.locator('#re-ratio').textContent()),await p.locator('#re-ratio').textContent());
  ok('summary warns about water',await p.locator('.se-sum').evaluate(e=>e.classList.contains('warn')),await p.locator('.se-sum').textContent());
  await p.click('.re-pm[data-pm="re-water"][data-d="-10"]');ok('stepper nudges',(await p.inputValue('#re-water'))==='290');
  // Switch method
  await p.selectOption('#re-b','sw');ok('method shows for Switch',!(await p.locator('#re-mw').isHidden()));await p.click('[data-m="im"]');
  await p.fill('#re-name','Test immersion');await p.click('#re-save');await p.waitForTimeout(400);
  const saved=await p.evaluate(()=>{const r=CREC.find(x=>x.name==='Test immersion');return r&&{b:r.b,steps:r.steps,water:r.water}});ok('saved as Switch immersion',saved&&saved.b==='swi',saved);
  // reopen it: brewer shows Switch with immersion pressed
  await p.evaluate(()=>openRecipeEditor(CREC.find(x=>x.name==='Test immersion')));await p.waitForTimeout(300);
  ok('reopens as Switch + immersion',(await p.inputValue('#re-b'))==='sw'&&await p.locator('[data-m="im"]').getAttribute('aria-pressed')==='true');
  await p.evaluate(()=>$('vd').close());await p.waitForTimeout(400);
  ok('immersion not in brewer pickers',await p.evaluate(()=>![...document.querySelectorAll('#s-brewer option,#re-b option')].some(o=>o.value==='swi')));
  // recipe detail with graph
  await p.evaluate(()=>openRecipe(1));await p.waitForTimeout(400);ok('graph in recipe',await p.locator('#vd .pgraph').count()===1);await p.locator('#vd .vd-body').screenshot({path:S+'recipe.png'});await p.evaluate(()=>$('vd').close());await p.waitForTimeout(400);
  // timer drawdown check
  await p.evaluate(()=>{openTimer(2);TM.el=TM.total;paint();done()});await p.waitForTimeout(300);ok('drawdown check shown',await p.locator('.tm-draw').count()===1);
  await p.click('[data-dd="-30"]');ok('advice',true,await p.locator('.tm-dres').textContent());
  await p.click('#tm-keep');await p.waitForTimeout(200);ok('saved calibration',await p.evaluate(()=>BASE[MYG[0]]&&BASE[MYG[0]].v60),await p.evaluate(()=>[BASE[MYG[0]],dial(MYG[0],base(MYG[0],'v60'))]));
  await p.locator('#timer .tm2').screenshot({path:S+'timer.png'});
 }
 await ctx.close()}
 console.log('errors',errs.length?errs:'none');await b.close()})();
