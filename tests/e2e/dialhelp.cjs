// The dial-in helper: after a brew, how it tasted. Sour suggests a finer grind (exact clicks on your grinder) and hotter
// water; bitter the opposite; with a drawdown answer the grind follows the drawdown. Remembered with the coffee, it shows
// on the coffee's page and in the dial-in next time; Balanced keeps what worked.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const id=await p.evaluate(()=>{const b=BEANS.find(x=>x.shelf)||BEANS[0];useBean(b);goTab('dial');return b.id});await p.waitForTimeout(400);
const brew=async()=>{await p.evaluate(id=>{const r=RECIPES[0],g=MYG[0];openTimerNow(0,{brewer:r.b,grinder:g,set:{[g]:settingFor(g,r.b,r.off)},r:{dose:r.dose},water:r.water,temp:r.temp,steps:r.steps,bean:id})},id);await p.waitForTimeout(600);await p.evaluate(()=>{TM.el=TM.total;finishBrew()});await p.waitForTimeout(300)};
await brew();
const base=await p.evaluate(()=>({g:TM.p.grinder,v:TM.p.set[TM.p.grinder],t:TM.p.temp}));
await p.click('[data-tt="sour"]');await p.waitForTimeout(200);
const sour=await p.evaluate(()=>({txt:document.querySelector('.tm-tres').textContent,rec:TM.tasteRec}));
ok('sour suggests a finer grind on your grinder and hotter water',/finer/.test(sour.txt)&&sour.rec.temp===Math.min(99,base.t+2)&&sour.rec.set!==base.v,{sour,base});
await p.click('[data-tt="bitter"]');await p.waitForTimeout(200);
const bit=await p.evaluate(()=>({txt:document.querySelector('.tm-tres').textContent,rec:TM.tasteRec}));ok('bitter suggests coarser and cooler',/coarser/.test(bit.txt)&&bit.rec.temp===Math.max(85,base.t-2),bit);
// With a drawdown answer, the grind follows the drawdown (30 s late: coarser, more than the taste alone would).
const hasDraw=await p.evaluate(()=>!!document.querySelector('.tm-dseg'));
if(hasDraw){await p.click('[data-dd="30"]');await p.waitForTimeout(200);const dr=await p.evaluate(()=>TM.tasteRec);ok('the drawdown sets the grind when given',Math.abs(dr.set-base.v)>=Math.abs(bit.rec.set-base.v),{dr,bit:bit.rec,base})}
await p.click('[data-tt="sour"]');await p.click('#tm-tkeep');await p.waitForTimeout(200);
const kept=await p.evaluate(id=>({s:JSON.parse(localStorage.getItem('bb-dialnext')||'{}')[id],sync:SYNC_KEYS.includes('bb-dialnext')}),id);ok('remembered with the coffee, and synced',kept.s&&kept.s.taste==='sour'&&kept.sync,kept);
await p.evaluate(()=>$('timer').close());await p.waitForTimeout(300);
const shown=await p.evaluate(id=>{renderDBean();const dial=($('d-bean').querySelector('.dnext')||{}).textContent||'';openBean(id);const page=(document.querySelector('.bd-dnext')||{}).textContent||'';$('vd').close();return{dial,page}},id);
ok('the dial-in and the coffee’s page show it next time',/Try this time/.test(shown.dial)&&/Try next time/.test(shown.page)&&/°C/.test(shown.page),shown);
await brew();await p.click('[data-tt="good"]');await p.click('#tm-tkeep');await p.waitForTimeout(200);
ok('Balanced keeps what worked',await p.evaluate(id=>JSON.parse(localStorage.getItem('bb-dialnext'))[id].taste==='good'&&/Keep it/.test(document.querySelector('.tm-tres').textContent),id));
ok('no errors',!errs.length,errs);await b.close()})();
