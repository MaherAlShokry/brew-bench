// The Android home-screen widget, with a stand-in Widget plugin: the app sends the coffee you're drinking (the cabinet
// coffee brewed most recently) with its roast date and freshness window; a widget tap opens that coffee, and Log brew
// opens the brew form with it, both when the tap starts the app and while it's running.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(m,c,x)=>console.log((c?'ok   ':'FAIL ')+m+(c||x===undefined?'':' '+JSON.stringify(x)));
const run=async(open,seed)=>{const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p.addInitScript(open=>{window.__w={sent:[],open};sessionStorage.setItem('bb-splashed','1');
    window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{Widget:{update:async o=>{window.__w.sent.push(o)},timer:async o=>{(window.__w.tm=window.__w.tm||[]).push(o)},pending:async()=>{const o=window.__w.open;window.__w.open='';return{open:o||''}}}}}},open);
  await p.goto('http://localhost:8099/index.html');if(seed){await p.evaluate(require('./seed2.cjs'));await p.reload()}await p.waitForTimeout(3500);
  return{p,c,errs}};
// What's sent
let {p,c,errs}=await run('',true);
const sent=await p.evaluate(()=>window.__w.sent.slice(-1)[0]);const want=await p.evaluate(()=>{const w=widgetBean();return{id:w.id,win:freshWin(w).w.join(','),rd:w.roastDate}});
ok('sends the coffee on start, with its flag',sent&&sent.id===want.id&&sent.win===want.win&&sent.roastDate===want.rd&&sent.title&&sent.flag&&'photo' in sent,[sent,want]);
ok('it is the cabinet coffee brewed most recently',await p.evaluate(()=>{const w=widgetBean(),t=b=>beanBrews(b).reduce((m,l)=>Math.max(m,+l.ts||0),0);return BEANS.filter(b=>b.shelf).every(b=>t(b)<=t(w))}));
await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(200);
ok('sends again when leaving the app',(await p.evaluate(()=>window.__w.sent.length))>=2);
// A tap while running: open the coffee
await p.evaluate(id=>{window.__w.open='bean:'+id;window.bbWidget()},want.id);await p.waitForTimeout(1200);
ok('tap opens that coffee',await p.evaluate(id=>$('vd').open&&$('vd').dataset.bean===id&&!!$('bd-tl'),want.id));
await p.evaluate(id=>{window.__w.open='log:'+id;window.bbWidget()},want.id);await p.waitForTimeout(1200);
ok('Log brew opens the form with that coffee',await p.evaluate(id=>document.querySelector('main section.on').id==='log'&&LBEAN===id&&!$('vd').open,want.id));
ok('no errors',!errs.length,errs);
// Your cabinet, Quick brew and Word of the day
const more=await p.evaluate(()=>{const s=window.__w.sent.slice(-1)[0];return{cab:JSON.parse(s.cabinet||'[]'),brew:JSON.parse(s.brew||'{}'),words:JSON.parse(s.words||'[]'),shelf:BEANS.filter(b=>b.shelf).length,
  today:Math.floor(Date.now()/864e5),wotd:GLOSSARY[Math.floor(Date.now()/864e5)%GLOSSARY.length][0]}});
ok('cabinet: every shelf coffee (up to 30), with freshness data and cups',more.cab.length===Math.min(30,more.shelf)&&more.cab.every(c=>c.id&&c.title&&c.win.split(',').length===3&&'cups' in c),more.cab);
ok('quick brew: the recipe brewed most lately, with its numbers',more.brew.key&&more.brew.name&&/g : /.test(more.brew.line)&&/ g$/.test(more.brew.dose)&&/ g$/.test(more.brew.water)&&more.brew.brewer,more.brew);
ok('words: six weeks from today, today first, same as Today in coffee, with its category',more.words.length===42&&more.words[0][0]===more.today&&more.words[0][1]===more.wotd&&more.words[0][3],more.words[0]);
await p.evaluate(k=>{window.__w.open='timer:'+k;window.bbWidget()},more.brew.key);await p.waitForTimeout(1200);
ok('Start timer opens the timer on that recipe',await p.evaluate(()=>$('timer').open));
await p.evaluate(()=>$('timer').close());await p.waitForTimeout(300);
await p.evaluate(k=>{window.__w.open='recipe:'+k;window.bbWidget()},more.brew.key);await p.waitForTimeout(1200);
ok('tapping Quick brew opens the recipe',await p.evaluate(n=>$('vd').open&&$('vd').textContent.includes(n),more.brew.name));
await p.evaluate(w=>{window.__w.open='word:'+w;window.bbWidget()},more.wotd);await p.waitForTimeout(1200);
ok('the word opens in full',await p.evaluate(()=>document.querySelector('main section.on').id==='words'));
// Choosing the coffee for Drinking now, from its page
const other=await p.evaluate(id=>{const b=BEANS.find(x=>x.shelf&&x.id!==id);openBean(b.id);return b.id},want.id);await p.waitForTimeout(700);
await p.evaluate(()=>$('bd-wpin').click());await p.waitForTimeout(300);
ok('a chosen coffee stays on Drinking now',await p.evaluate(id=>window.__w.sent.slice(-1)[0].id===id&&/Let it choose/.test($('bd-wpin').textContent),other));
await p.evaluate(()=>$('bd-wpin').click());await p.waitForTimeout(300);
ok('letting it choose again goes back to the last brewed',await p.evaluate(id=>window.__w.sent.slice(-1)[0].id===id,want.id));
await p.evaluate(()=>$('vd').close());
// The Quick brew widget follows a running brew
await p.evaluate(k=>openTimer(rByKey(k)),more.brew.key);await p.waitForTimeout(500);
await p.evaluate(()=>$('tm-go').click());await p.waitForTimeout(1500);
const t1=await p.evaluate(()=>window.__w.tm.slice(-1)[0]);
ok('starting the timer tells the widget',t1&&t1.state==='run'&&t1.name&&t1.step&&t1.total>0&&/^Next at \d+:\d\d: /.test(t1.next),t1);
await p.evaluate(()=>$('tm-skip').click());await p.waitForTimeout(600);
const t2=await p.evaluate(()=>window.__w.tm.slice(-1)[0]);ok('a new step tells it again',t2.state==='run'&&t2.step!==t1.step&&t2.elapsed>t1.elapsed,[t1.step,t2.step]);
await p.evaluate(()=>$('tm-go').click());await p.waitForTimeout(300);ok('pausing',await p.evaluate(()=>window.__w.tm.slice(-1)[0].state==='pause'));
await p.evaluate(()=>$('timer').close());await p.waitForTimeout(300);ok('closing the timer ends it on the widget',await p.evaluate(()=>window.__w.tm.slice(-1)[0].state==='stop'));
const tab0=await p.evaluate(()=>{goTab('explore');return 'explore'});await p.waitForTimeout(500);await p.evaluate(()=>{window.__w.open='resume';window.bbWidget()});await p.waitForTimeout(800);ok('Open from the widget leaves the app where it was',await p.evaluate(t=>document.querySelector('main section.on').id===t,tab0));
ok('no errors (other widgets)',!errs.length,errs);
// Empty cabinet
await p.evaluate(()=>{BEANS.forEach(b=>b.shelf=false);updWidget()});ok('empty cabinet sends no coffee',await p.evaluate(()=>window.__w.sent.slice(-1)[0].id===''));
await c.close();
// A tap that started the app (cold start): acted on once the app has opened
({p,c,errs}=await run('log:'+want.id,false));
await p.evaluate(require('./seed2.cjs'));
({p,c,errs}=await (async()=>{await c.close();const c2=await b.newContext({viewport:{width:390,height:844}});const p2=await c2.newPage();const e2=[];p2.on('pageerror',e=>e2.push(e.message));await p2.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p2.goto('http://localhost:8099/index.html');await p2.evaluate(require('./seed2.cjs'));
  await p2.addInitScript(open=>{window.__w={sent:[],open};sessionStorage.setItem('bb-splashed','1');window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{Widget:{update:async o=>{window.__w.sent.push(o)},pending:async()=>{const o=window.__w.open;window.__w.open='';return{open:o||''}}}}}},'bean:'+want.id);
  await p2.reload();await p2.waitForTimeout(3500);return{p:p2,c:c2,errs:e2}})());
ok('cold start from a widget tap opens the coffee',await p.evaluate(id=>$('vd').open&&$('vd').dataset.bean===id,want.id));
ok('no errors (cold start)',!errs.length,errs);await c.close();await b.close()})();
