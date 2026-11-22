// Grind memory: picking a coffee on the Brew page sets what it was last brewed at (from its newest logged brew): the
// grinder, setting and temperature (never the brewer: that stays as chosen), quietly, with nothing shown. A setting saved after its last brew comes first.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const setup=await p.evaluate(()=>{const g=MYG[0],bn=BEANS[0],br=S.brewer;const set=roundG(g,S.setting+(GRINDERS[g].step||0.1)*3);
  LOG.unshift({id:'gm1',ts:Date.now(),date:'',coffee:beanTitle(bn),settings:'',stars:4,snap:{g,c:set,b:br,t:91,bean:{id:bn.id,name:beanTitle(bn)}}});save('bb-log',LOG);
  delete DIALNEXT[bn.id];S.temp=94;useBean(bn);goTab('dial');render();return{g,set,id:bn.id}});
await p.waitForTimeout(500);
const st=await p.evaluate(()=>({g:S.grinder,set:S.setting,t:S.temp,line:!!document.querySelector('#d-bean .dnext,[data-dnuse]')}));
ok('picking the coffee sets the grinder, setting and temperature it was last brewed at',st.g===setup.g&&Math.abs(st.set-setup.set)<1e-6&&st.t===91,{st,setup});
ok('quietly: no line or button about it',!st.line);
await p.evaluate(id=>{DIALNEXT[id]={g:S.grinder,set:S.setting,temp:93,taste:'sour',at:'2026-11-01'};useBean(beanById(id));render()},setup.id);await p.waitForTimeout(200);
ok('what was saved after its last brew comes first',await p.evaluate(()=>S.temp)===93);
ok('no page errors',!errs.length,errs);await b.close()})();
