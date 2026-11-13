// Timer cues: off until turned on; then each step is read aloud ("Pour 60 grams, to 120 grams.") and the phone buzzes,
// with short buzzes before the next step and a sign-off at the end. The choice is kept.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');window.__said=[];window.__buzz=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(u){__said.push(u.text)}}});window.SpeechSynthesisUtterance=function(t){this.text=t};navigator.vibrate=p=>{__buzz.push(p);return true}});
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1200);
ok('a step is said naturally',await p.evaluate(()=>cueText('0:45 pour 60g (to 120g) at 92°C')==='Pour 60 grams, to 120 grams at 92 degrees.'));
await p.evaluate(()=>{goTab('recipes');openTimerNow(0)});await p.waitForTimeout(400);
await p.click('#tm-go');await p.waitForTimeout(700);ok('off by default: nothing said, no buzz',await p.evaluate(()=>!__said.length&&!__buzz.some(x=>Array.isArray(x)&&x.length===3)));
await p.click('#tm-go');await p.click('#tm-reset');await p.click('[data-cue="voice"]');await p.click('[data-cue="buzz"]');await p.evaluate(()=>{__said=[];__buzz=[]});
await p.click('#tm-go');await p.waitForTimeout(700);
const r=await p.evaluate(()=>({said:__said,buzz:__buzz,stored:JSON.parse(localStorage.getItem('bb-cues'))}));
ok('turned on, the first step is read and the phone buzzes',r.said.includes('Pour 60 grams.')&&r.buzz.some(x=>JSON.stringify(x)==='[120,70,120]'),r);
ok('and the choice is kept',r.stored.voice&&r.stored.buzz,r.stored);
await p.evaluate(()=>{__said=[];__buzz=[];TM.t0-=(TM.total-1.5)*1000});await p.waitForTimeout(2200);
const end=await p.evaluate(()=>({said:__said,buzz:__buzz}));ok('the end is said and buzzed',end.said.some(x=>/Brew complete/.test(x))&&end.buzz.some(x=>JSON.stringify(x)==='[220,120,220]'),end);
ok('no errors',!errs.length,errs);await b.close()})();
