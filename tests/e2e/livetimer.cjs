// The brew timer beyond the app (Android, with stand-in plugins): the timer sends the phone every step's time, so the
// notification, status-bar chip and widget can run it; their buttons (pause, resume, next, done, stop) move the open
// timer; tapping the notification keeps the timer open; a brew left running reopens where it is when the app starts;
// the widget gets the go-to recipe's steps so its Start works without the app; the first timer asks once for
// notifications. And "Brew again" on a logged brew opens the timer the same way, with a kept dial-in change.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(m,c,x)=>console.log((c?'ok   ':'FAIL ')+m+(c||x===undefined?'':' '+JSON.stringify(x)));
const run=async(w)=>{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p.addInitScript(w=>{window.__w=Object.assign({tm:[],perm:[],open:'',state:{state:'stop'}},w);sessionStorage.setItem('bb-splashed','1');
    window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{
      Widget:{update:async()=>{},timer:async o=>{window.__w.tm.push(o)},timerState:async()=>window.__w.state,pending:async()=>{const o=window.__w.open;window.__w.open='';return{open:o}},
        addListener:(n,f)=>{window.__w.on=f;return{remove(){}}}},
      LocalNotifications:{checkPermissions:async()=>{window.__w.perm.push('check');return{display:'prompt'}},requestPermissions:async()=>{window.__w.perm.push('ask');return{display:'granted'}}}}}},w);
  await p.goto('http://localhost:8099/index.html');return{p,c,errs}};
let {p,c,errs}=await run({});await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(2500);
await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);
const last=()=>p.evaluate(()=>window.__w.tm.slice(-1)[0]);
const fire=async n=>{await p.evaluate(n=>window.__w.on(n),n);await p.waitForTimeout(250)};
const tm=()=>p.evaluate(()=>({run:TM.run,fin:!!TM.fin,el:Math.round(TM.run?(performance.now()-TM.t0)/1000:TM.el),open:$('timer').open,lab:$('tm-go').getAttribute('aria-label')}));

// The widget's go-to recipe carries its steps and length.
const wr=await p.evaluate(()=>{const r=widgetRecipe();return{n:(r.steps||[]).length,total:r.total,first:r.steps&&r.steps[0]}});
ok('the widget gets the go-to recipe’s steps and length',wr.n>1&&wr.total>60000&&wr.first[0]===0&&typeof wr.first[1]==='string',wr);

// Start: everything the phone needs.
const ri=await p.evaluate(()=>RECIPES.findIndex(r=>parseSteps(r.steps).filter(e=>e.t>=0).length>2));
await p.evaluate(i=>{goTab('recipes');openTimerNow(i)},ri);await p.waitForTimeout(400);
await p.evaluate(()=>$('tm-go').click());await p.waitForTimeout(500);
let m=await last();const key=await p.evaluate(i=>rkey(RECIPES[i]),ri);
ok('starting sends the brew: run, its key, every step’s time, the length',m&&m.state==='run'&&m.key===key&&m.steps.length>2&&m.steps[0][0]===0&&m.total>0,m&&{state:m.state,key:m.key,n:m.steps&&m.steps.length});
ok('the first timer asks once for notifications',(await p.evaluate(()=>window.__w.perm.join())).includes('ask'),await p.evaluate(()=>window.__w.perm));

// The notification's buttons move the open timer.
await fire({state:'pause',elapsed:50000});let t=await tm();
ok('Pause on the notification pauses the timer at its time',!t.run&&t.el===50&&t.lab==='Resume',t);
await fire({state:'run',elapsed:50000});t=await tm();
ok('Resume runs it on from there',t.run&&t.el>=50&&t.el<52&&t.lab==='Pause',t);
await fire({state:'run',elapsed:90000});t=await tm();
ok('Next step moves it to the step’s time',t.run&&t.el>=90&&t.el<92,t);
await fire({state:'done',elapsed:120000});t=await tm();
ok('the end of the brew finishes it',t.fin&&!t.run,t);
await fire({state:'run',elapsed:0});t=await tm();
ok('Brew again on the finished notification starts over',t.run&&!t.fin&&t.el<2,t);
await fire({state:'stop',elapsed:0});t=await tm();
ok('Stop stops and resets it, the timer still open',!t.run&&t.el===0&&t.open,t);

// Tapping the notification while the timer is open keeps it open.
await p.evaluate(()=>$('tm-go').click());await p.waitForTimeout(300);
await p.evaluate(()=>{window.__w.open='resume';window.bbWidget()});await p.waitForTimeout(500);t=await tm();
ok('tapping the notification keeps the running timer open',t.open&&t.run,t);
// The dialog's close event comes as its own task, which can wait behind other work: wait for the message, not a fixed time.
await p.evaluate(()=>$('timer').close());await p.waitForFunction(()=>(window.__w.tm.slice(-1)[0]||{}).state==='stop',null,{timeout:5000}).catch(()=>{});
ok('closing the timer tells the phone to stop',(await last()).state==='stop');
ok('no errors',!errs.length,errs);await c.close();

// Cold start with a brew running on the phone: its timer opens where the brew is, without telling the phone to stop.
({p,c,errs}=await run({state:{state:'run',elapsed:30000,total:200000,key,name:'x',plan:''}}));await p.waitForTimeout(3500);
t=await p.evaluate(()=>({open:$('timer').open,run:TM&&TM.run,el:TM&&Math.round((performance.now()-TM.t0)/1000),title:$('tm-title')&&$('tm-title').textContent,stops:window.__w.tm.filter(x=>x.state==='stop').length}));
const name=await p.evaluate(i=>RECIPES[i].name,ri);
ok('a brew left running reopens in its timer, where it is',t.open&&t.run&&t.el>=30&&t.el<36&&t.title===name&&!t.stops,t);
await c.close();

// Paused on the phone, reopened from the notification with the plan it was opened with (its dose and water).
({p,c,errs}=await run({state:{state:'pause',elapsed:42000,total:200000,key,name:'x',plan:JSON.stringify({r:{dose:18},water:288,set:{}})},open:'resume'}));await p.waitForTimeout(3500);
t=await p.evaluate(()=>({open:$('timer').open,run:TM&&TM.run,el:TM&&TM.el,meta:$('timer').querySelector('.tm-meta').textContent}));
ok('a paused brew reopens paused, with its own dose and water',t.open&&!t.run&&t.el===42&&t.meta.startsWith('18g : 288g'),t);
ok('no errors',!errs.length,errs);await c.close();

// Brew again from the log.
({p,c,errs}=await run({}));await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(2500);
await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);
const ag=await p.evaluate(()=>{const l=LOG.find(l=>againPlan(l));const s=okSnap(l.snap),r=snapRecipe(s),g=MYG.find(x=>canGrind(x,s.b||r.b));
  const bean=s.bean&&s.bean.id||l.beanId||l.snap.bean.id;DIALNEXT[bean]={brewer:s.b||r.b,recipe:r.name,g,set:settingFor(g,s.b||r.b,r.off||0)+1,temp:(s.t||r.temp)+2,taste:'sour',at:todayISO()};
  return{i:LOG.indexOf(l),dose:s.dose,water:s.water||r.water,name:r.name,label:gLabel(g,settingFor(g,s.b||r.b,r.off||0)+1),temp:(s.t||r.temp)+2}});
await p.evaluate(()=>goTab('log'));await p.waitForTimeout(600);
ok('a logged brew shows Brew again',await p.evaluate(i=>!!document.querySelector('[data-again="'+i+'"]'),ag.i));
await p.evaluate(i=>document.querySelector('[data-again="'+i+'"]').click(),ag.i);await p.waitForTimeout(900);
t=await p.evaluate(()=>({open:$('timer').open,title:$('tm-title').textContent,meta:$('timer').querySelector('.tm-meta').textContent,toast:($('toast')||{}).textContent||document.body.innerText.match(/With your dial-in change[^\n]*/)?.[0]||''}));
ok('Brew again opens the timer on the same recipe, dose and water',t.open&&t.title===ag.name&&t.meta.startsWith(ag.dose+'g : '+ag.water+'g'),[t,ag]);
ok('with the dial-in change kept for that coffee, said so',t.meta.includes(ag.label)&&t.meta.includes(ag.temp+'°C')&&/dial-in change/.test(t.toast),[t,ag]);
ok('a brew whose recipe is gone has no Brew again',await p.evaluate(()=>againPlan({snap:{b:'v60',rec:'No such recipe',dose:15,water:250}})===null));
ok('no errors',!errs.length,errs);await c.close();
await b.close()})();
