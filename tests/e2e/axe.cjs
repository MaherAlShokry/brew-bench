// Accessibility: every page, the Beans views and the main sheets pass axe-core's WCAG 2.1 A and AA rules, in light and
// dark. (axe-core is installed next to Playwright: npm i --no-save axe-core@4.10.3.)
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const AXE=require('fs').readFileSync(require.resolve('axe-core/axe.min.js',{paths:[__dirname]}),'utf8');
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const PAGES=['dial','scan','beans','tech','gear','map','variety','champs','flow','words','wheel','history','recipes','process','guide','log','explore','settings'];
const SHEETS={bean:'openBean(BEANS[0].id)',beanEdit:'openBeanEditor(null)',recipe:'openRecipe(0)',variety:"openVariety('geisha')",origin:"openOrigin('kenya')",trophies:'openTrophies()',
  me:'openMe()',logFilter:'openLogFilter()',tips:'openTips()',flow:'openFlowStep(FLOW[0].id)',champ:'openChamp(CHAMPS[0])',timer:'openTimerNow(0)',share:'openShareNow(beanDoc(BEANS[0]))',speed:'openSpeed()'};
(async()=>{const b=await chromium.launch();const errs=[];
for(const mode of ['light','dark']){const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,colorScheme:mode,reducedMotion:'reduce'});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
  await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.evaluate(m=>localStorage.setItem('bb-theme',m),mode);await p.reload();await p.waitForTimeout(1800);
  await p.addScriptTag({content:AXE});const found={};
  const run=async(name,sel)=>{await p.waitForTimeout(400);const r=await p.evaluate(async sel=>{if(!document.querySelector(sel))return[{id:'nothing to check',t:sel}];
      const res=await axe.run(sel,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},resultTypes:['violations']});
      return res.violations.map(v=>({id:v.id,t:v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(', ')}))},sel);
    for(const v of r)(found[name]=found[name]||[]).push(v.id+': '+v.t)};
  for(const t of PAGES){await p.evaluate(t=>goTab(t),t);await run('page '+t,'#'+t)}
  await p.evaluate(()=>goTab('beans'));for(const v of ['diary','passport','top3']){await p.evaluate(v=>document.querySelector('#bg-views [data-v="'+v+'"]').click(),v);await run('beans '+v,'#beans')}
  await run('tab bar and header','body > header, nav.tabs');
  for(const [k,f] of Object.entries(SHEETS)){const e=await p.evaluate(f=>{try{(0,eval)(f);return ''}catch(e){return e.message}},f);if(e){(found['sheet '+k]=found['sheet '+k]||[]).push('could not open: '+e);continue}
    await run('sheet '+k,'dialog[open]');await p.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close()});await p.waitForTimeout(150)}
  ok(mode+': '+PAGES.length+' pages, 3 Beans views and '+Object.keys(SHEETS).length+' sheets pass axe (WCAG 2.1 AA)',!Object.keys(found).length,found);
  await c.close()}
ok('no errors',!errs.length,errs);await b.close()})();
