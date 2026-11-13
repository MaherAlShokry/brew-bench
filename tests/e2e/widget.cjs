// The Android home-screen widget, with a stand-in Widget plugin: the app sends the coffee you're drinking (the cabinet
// coffee brewed most recently) with its roast date and freshness window; a widget tap opens that coffee, and Log brew
// opens the brew form with it, both when the tap starts the app and while it's running.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(m,c,x)=>console.log((c?'ok   ':'FAIL ')+m+(c||x===undefined?'':' '+JSON.stringify(x)));
const run=async(open,seed)=>{const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p.addInitScript(open=>{window.__w={sent:[],open};sessionStorage.setItem('bb-splashed','1');
    window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{Widget:{update:async o=>{window.__w.sent.push(o)},pending:async()=>{const o=window.__w.open;window.__w.open='';return{open:o||''}}}}}},open);
  await p.goto('http://localhost:8099/index.html');if(seed){await p.evaluate(require('./seed2.cjs'));await p.reload()}await p.waitForTimeout(3500);
  return{p,c,errs}};
// What's sent
let {p,c,errs}=await run('',true);
const sent=await p.evaluate(()=>window.__w.sent.slice(-1)[0]);const want=await p.evaluate(()=>{const w=widgetBean();return{id:w.id,win:freshWin(w).w.join(','),rd:w.roastDate}});
ok('sends the coffee on start',sent&&sent.id===want.id&&sent.win===want.win&&sent.roastDate===want.rd&&sent.title,[sent,want]);
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
ok('cabinet: shelf coffees, at most four, with freshness data',more.cab.length===Math.min(4,more.shelf)&&more.cab.every(c=>c.id&&c.title&&c.win.split(',').length===3),more.cab);
ok('quick brew: the recipe brewed most lately',more.brew.key&&more.brew.name&&/g : /.test(more.brew.line),more.brew);
ok('words: six weeks from today, today first, same as Today in coffee',more.words.length===42&&more.words[0][0]===more.today&&more.words[0][1]===more.wotd,more.words[0]);
await p.evaluate(k=>{window.__w.open='timer:'+k;window.bbWidget()},more.brew.key);await p.waitForTimeout(1200);
ok('Start timer opens the timer on that recipe',await p.evaluate(()=>$('timer').open));
await p.evaluate(()=>$('timer').close());await p.waitForTimeout(300);
await p.evaluate(k=>{window.__w.open='recipe:'+k;window.bbWidget()},more.brew.key);await p.waitForTimeout(1200);
ok('tapping Quick brew opens the recipe',await p.evaluate(n=>$('vd').open&&$('vd').textContent.includes(n),more.brew.name));
await p.evaluate(w=>{window.__w.open='word:'+w;window.bbWidget()},more.wotd);await p.waitForTimeout(1200);
ok('the word opens in full',await p.evaluate(()=>document.querySelector('main section.on').id==='words'));
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
