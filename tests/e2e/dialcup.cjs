const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1000);
const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
const g0=await p.evaluate(()=>{const b=BEANS[0];b.bag=250;b.left=null;b.ts=Date.now()-1e6;b.cups=[];saveBeans();useBean(b);goTab('dial');S.rec=RECIPES.findIndex(r=>r.name==='Tetsu Kasuya 4:6');S.dose=15;return gramsLeft(b)});
await p.waitForTimeout(400);
await p.evaluate(()=>{dialTimer()});await p.waitForTimeout(400);await p.click('#tm-go');await p.waitForTimeout(300);ok('a mis-tap is not counted',await p.evaluate(g0=>{const t0=TM.t0;finishBrew();const r=gramsLeft(BEANS[0])===g0;$('tm-again').click();return r},g0));await p.waitForTimeout(300);await p.evaluate(()=>{TM.t0=performance.now()-90000;finishBrew()});await p.waitForTimeout(400);
const g1=await p.evaluate(()=>gramsLeft(BEANS[0]));ok('finishing the dial-in brew takes 15 g off',g0-g1===15,[g0,g1]);
ok('finish card says so',await p.evaluate(()=>/15 g off your/.test($('tm-next').textContent)));
await p.screenshot({path:'dialcup.png'});
await p.click('#tm-bagundo');await p.waitForTimeout(200);ok('undo puts it back',await p.evaluate(g0=>gramsLeft(BEANS[0])===g0,g0));
// again, then log it: counted once
await p.click('#tm-again');await p.waitForTimeout(300);await p.evaluate(()=>{TM.t0=performance.now()-90000;finishBrew()});await p.waitForTimeout(300);
ok('brew again takes another cup',await p.evaluate(g0=>gramsLeft(BEANS[0])===g0-15,g0));
await p.click('#tm-log');await p.waitForTimeout(900);
ok('log opens filled from the dial-in',await p.evaluate(()=>$('log').classList.contains('on')&&LBEAN===BEANS[0].id&&/15g/.test($('l-settings').value)));
await p.evaluate(()=>{STAR=4});await p.click('#l-save');await p.waitForTimeout(300);
ok('logging the same cup does not count twice',await p.evaluate(g0=>gramsLeft(BEANS[0])===g0-15&&!!LOG[0].cup,g0),await p.evaluate(()=>[gramsLeft(BEANS[0]),LOG[0].cup]));
// a recipe timer (not dial-in) takes nothing
await p.evaluate(()=>{openTimer(0)});await p.waitForTimeout(300);await p.click('#tm-go');await p.evaluate(()=>{TM.t0=performance.now()-90000;finishBrew()});await p.waitForTimeout(300);
ok('recipe timer leaves the bag alone',await p.evaluate(g0=>gramsLeft(BEANS[0])===g0-15,g0));
// survives reload (sanitised)
await p.reload();await p.waitForTimeout(900);ok('kept after reload',await p.evaluate(g0=>gramsLeft(BEANS[0])===g0-15,g0));
ok('no errors',!errs.length,errs);await b.close()})()
