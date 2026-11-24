// Quick log at the end of a brew: rate it in beans, tap a flavour or two, save in one tap; the entry carries the dial-in
// (coffee, settings, snapshot) and the flavours; "Log this brew" then opens that entry instead of making a second one.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
await p.evaluate(()=>{const bn=BEANS[0];bn.flavours='Peach, jasmine, honey';useBean(bn);goTab('dial');S.rec=RECIPES.findIndex(r=>r.name==='Tetsu Kasuya 4:6');S.dose=15;render();dialTimer()});await p.waitForTimeout(500);
await p.click('#tm-go');await p.evaluate(()=>{TM.t0=performance.now()-90000;finishBrew()});await p.waitForTimeout(400);
const a=await p.evaluate(()=>({box:!!document.querySelector('.tm-quick'),stars:document.querySelectorAll('.tm-qstars [data-qs]').length,fl:[...document.querySelectorAll('.tm-qfl [data-qf]')].map(x=>x.dataset.qf),dis:$('tm-qsave').disabled,n:LOG.length}));
ok('the finish shows a quick rating, flavours and a save button (off until rated)',a.box&&a.stars===5&&a.fl.length>0&&a.dis,a);
await p.click('.tm-qstars [data-qs="4"]');await p.click('.tm-qfl [data-qf]');
// More: the flavour wheel over the timer, for a note the coffee isn't known for; it comes back as a chip.
await p.click('#tm-qadd');await p.waitForTimeout(600);const wheel=await p.evaluate(()=>!!document.querySelector('dialog#vd[open] #fl-box'));
await p.evaluate(()=>{const q=$('fl-q');q.value='bergamot';q.dispatchEvent(new Event('input'));document.querySelector('#fl-res [data-fa]').click();$('fl-done').click()});await p.waitForTimeout(500);
const back=await p.evaluate(()=>({chips:[...document.querySelectorAll('.tm-qmore .chip')].map(c=>c.textContent),timer:$('timer').open}));
ok('More opens the flavour wheel and brings the note back as a chip',wheel&&back.chips.some(t=>/bergamot/i.test(t))&&back.timer,{wheel,back});
await p.click('#tm-qsave');await p.waitForTimeout(300);
const e=await p.evaluate(n=>{const e=LOG[0];return{added:LOG.length===n+1,stars:e.stars,fl:e.fl,snap:!!(e.snap&&e.snap.bean&&e.snap.bean.id===BEANS[0].id),settings:e.settings,saved:!!document.querySelector('.tm-quick.saved')}},a.n);
ok('one tap saves the brew with its rating, flavours (and the wheel\'s) and dial-in',e.added&&e.stars===4&&e.fl&&e.fl.length===2&&e.snap&&/g :/.test(e.settings)&&e.saved,e);
// It carries the coffee's name too, so the log card is not "Untitled"; brews saved before that get the name back.
const nm=await p.evaluate(()=>{const e=LOG[0],t=beanTitle(BEANS[0]);renderLogList(true);const card=document.querySelector('#l-list .logentry b');
  const had=e.coffee===t,shown=card&&card.textContent;e.coffee='';nameLogBeans();return{had,shown,t,fixed:LOG[0].coffee===t}});
ok('the quick-logged brew is named after its coffee, and an unnamed one is repaired',nm.had&&nm.shown===nm.t&&nm.fixed,nm);
await p.click('#tm-skip');await p.waitForTimeout(900);
const f=await p.evaluate(n=>({same:LOG.length===n+1,editing:LEDIT===LOG[0].id,tab:document.querySelector('main section.on').id}),a.n);
ok('Log this brew then opens that entry, not a second one',f.same&&f.editing&&f.tab==='log',f);
ok('no page errors',!errs.length,errs);await b.close()})();
