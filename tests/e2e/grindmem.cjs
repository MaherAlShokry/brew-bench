// Grind memory: with a coffee picked on the Brew page, the line under it offers what that coffee was last brewed at
// (from its newest logged brew), and Use it sets the grinder, setting, temperature and brewer in one tap; then it says
// In use. A setting saved to try next time comes first.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const setup=await p.evaluate(()=>{const g=MYG[0],bn=BEANS[0],br=S.brewer;const set=roundG(g,S.setting+(GRINDERS[g].step||0.1)*3);
  LOG.unshift({id:'gm1',ts:Date.now(),date:'',coffee:beanTitle(bn),settings:'',stars:4,snap:{g,c:set,b:br,t:91,bean:{id:bn.id,name:beanTitle(bn)}}});save('bb-log',LOG);
  delete DIALNEXT[bn.id];useBean(bn);goTab('dial');render();return{g,set,id:bn.id}});
await p.waitForTimeout(500);
const line=await p.evaluate(()=>{const e=document.querySelector('#d-bean .dnext');return e&&e.textContent});
ok('the coffee shows what it was last brewed at',/Last time/.test(line||'')&&/91°C/.test(line||''),line);
await p.click('#d-bean [data-dnuse]');await p.waitForTimeout(300);
const st=await p.evaluate(()=>({g:S.grinder,set:S.setting,t:S.temp,line:document.querySelector('#d-bean .dnext').textContent}));
ok('Use it sets the grinder, setting and temperature',st.g===setup.g&&Math.abs(st.set-setup.set)<1e-6&&st.t===91,{st,setup});
ok('then it says In use',/In use/.test(st.line)&&!(await p.$('#d-bean [data-dnuse]')),st.line);
await p.evaluate(id=>{DIALNEXT[id]={g:S.grinder,set:S.setting,temp:93,taste:'sour',at:'2026-11-01'};render()},setup.id);await p.waitForTimeout(200);
const l2=await p.evaluate(()=>document.querySelector('#d-bean .dnext').textContent);ok('a saved Try this time comes first',/Try this time/.test(l2)&&/93°C/.test(l2),l2);
ok('no page errors',!errs.length,errs);await b.close()})();
