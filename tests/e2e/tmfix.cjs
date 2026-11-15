// The timer after a finished brew: Start again and Reset go back to the steps (not a "Brew complete" card that keeps
// running). A step in the list jumps the clock to it. Log this brew from the timer rises in as a page. And the Brew
// page's card is drawn ahead in a quiet moment, so Share shows it at once.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const S=()=>p.evaluate(()=>({run:TM.run,fin:!!TM.fin,el:TM.el,go:$('tm-go').getAttribute('aria-label'),card:$('tm-card').className,step:$('tm-step').textContent}));
const toEnd=async()=>{for(let i=0;i<30&&!(await S()).fin;i++){await p.click('#tm-skip');await p.waitForTimeout(80)}await p.waitForTimeout(300)};
await p.evaluate(()=>openTimer(RECIPES.findIndex(r=>/4:6/.test(r.name))));await p.waitForTimeout(600);
await p.click('.tm-all summary');await p.click('#tm-list li:nth-child(3)');await p.waitForTimeout(200);
let s=await S();ok('a step in the list jumps the clock to it',s.el>0&&/Step 3/.test(s.step),s);
await p.click('#tm-go');await p.waitForTimeout(300);await toEnd();
s=await S();ok('finished: the play button offers to start again',s.fin&&s.go==='Start again'&&/fin/.test(s.card),s);
await p.click('#tm-go');await p.waitForTimeout(500);s=await S();
ok('Start again goes back to the steps, running',s.run&&!s.fin&&!/fin/.test(s.card)&&/Step 1/.test(s.step),s);
await toEnd();ok('finished: the tick reads Done',await p.evaluate(()=>$('tm-skip').getAttribute('aria-label')==='Done'));
await p.click('#tm-skip');await p.waitForTimeout(400);ok('finished: the tick closes the timer',await p.evaluate(()=>!$('timer').open));
await p.evaluate(()=>openTimer(RECIPES.findIndex(r=>/4:6/.test(r.name))));await p.waitForTimeout(600);
await toEnd();await p.click('#tm-reset');await p.waitForTimeout(300);s=await S();
ok('Reset after a finish goes back to the start',!s.run&&!s.fin&&s.el===0&&!/fin/.test(s.card)&&s.go==='Start',s);
await toEnd();await p.evaluate(()=>{document.documentElement.dataset.nav=''});await p.click('#tm-log');await p.waitForTimeout(900);
ok('Log this brew from the timer rises in as a page',await p.evaluate(()=>$('log').classList.contains('on')&&document.documentElement.dataset.nav==='push'&&!$('timer').open));
// The Brew page's card, drawn ahead.
await p.evaluate(()=>{showTab('dial');render()});await p.waitForTimeout(7000);
ok('the brew card is drawn ahead in a quiet moment',await p.evaluate(()=>!!(PRE_CARD&&PRE_CARD.cards.size)));
const t=await p.evaluate(()=>new Promise(res=>{const t0=performance.now();$('dial-share').click();const chk=()=>{if(document.querySelector('#sharesheet .shcard-pv img'))res(performance.now()-t0);else if(performance.now()-t0>5000)res(-1);else requestAnimationFrame(chk)};chk()}));
ok('Share uses the card drawn ahead and shows it at once',t>=0&&t<900&&await p.evaluate(()=>SHDOC._cards===PRE_CARD.cards),Math.round(t));
ok('no page errors',!errs.length,errs);
await b.close()})();
