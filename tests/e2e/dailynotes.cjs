// The daily notes go to the Android app's own notifications (Widget.daily, DailyNotes.java) in the app's look: each has
// a header saying what it is, a title (the coffee or the fact) with no emoji, its text, what a tap opens and the vibe's
// colour; changing the look sends the new colour. Turning a note off clears that kind. A tap (as the widget's
// "open" request) opens the coffee, or the fact's word.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');window.__daily=[];window.__look=[];window.__open='';
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{
    LocalNotifications:{addListener:()=>({remove(){}}),schedule:async()=>{window.__lnUsed=1},cancel:async()=>{},checkPermissions:async()=>({display:'granted'}),requestPermissions:async()=>({display:'granted'})},
    Widget:{update:async()=>{},timer:async()=>{},pending:async()=>{const o=window.__open;window.__open='';return{open:o}},daily:async a=>{window.__daily.push(a)},dailyLook:async a=>{window.__look.push(a)}}}}});
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(2000);
await p.evaluate(async()=>{window.__daily=[];await setReminder(true,'08:30');await setLearn(true)});await p.waitForTimeout(300);
const d=await p.evaluate(()=>({calls:window.__daily,ln:!!window.__lnUsed}));
const cab=d.calls.filter(c=>c.kind==='cabinet').pop(),fact=d.calls.filter(c=>c.kind==='fact').pop();
ok('both kinds go to the app\'s own notifications, not the plugin',cab&&fact&&!d.ln,{kinds:d.calls.map(c=>c.kind),ln:d.ln});
const items=[...(cab?cab.items:[]),...(fact?fact.items:[])],emoji=/[\u{1F300}-\u{1FAFF}☀-➿]/u;
ok('two weeks of each',cab&&cab.items.length>=13&&fact&&fact.items.length>=13,[cab&&cab.items.length,fact&&fact.items.length]);
ok('every note has a header, a title with no emoji, text and a time',items.every(x=>x.tag&&x.title&&!emoji.test(x.title)&&!emoji.test(x.tag)&&x.body&&x.at>Date.now()),items.find(x=>!(x.tag&&x.title&&!emoji.test(x.title)&&x.body)));
ok('coffee notes open their coffee, fact notes their fact',cab.items.every(x=>/^(bean:|beans$)/.test(x.open))&&fact.items.every(x=>/^fact:/.test(x.open)),[cab.items[0].open,fact.items[0].open]);
// Laid out for the phone's own design: a coffee carries its line (never the coffee's name again), facts, tasting notes
// and Brew it / Open; a fact its topic icon, a short line, the full text and its label.
const cb=cab.items.filter(x=>/^bean:/.test(x.open));
ok('coffee notes carry their layout: a line, facts, Brew it and Open',cb.length>0&&cb.every(x=>x.line&&!x.line.includes(x.title)&&Array.isArray(x.chips)&&x.chips.length<=3&&x.acts&&x.acts[0][1]==='brewbean:'+x.open.slice(5)&&x.acts[1][1]===x.open),cb[0]);
ok('a diary note puts your note in its panel',cb.filter(x=>x.tag==='From your diary').every(x=>x.note&&/^Your note · /.test(x.noteLabel)),cb.find(x=>x.tag==='From your diary'));
ok('fact notes carry a topic icon, a label, a short line and the full text',fact.items.every(x=>['book','leaf','globe','flask','drop','hourglass','trophy'].includes(x.icon)&&/^#[0-9a-f]{6}$/i.test(x.tile)&&x.eyebrow&&x.line&&x.line.length<=120&&x.text&&x.tag==='Coffee fact'),fact.items.find(x=>!x.icon||!x.eyebrow));
ok('the vibe\'s colour goes with them',/^#[0-9a-f]{6}$/i.test(cab.accent||''),cab.accent);
await p.evaluate(()=>{window.__look=[];setAppIcon()});await p.waitForTimeout(200);
ok('changing the look sends the colour',await p.evaluate(()=>window.__look.length>0&&/^#[0-9a-f]{6}$/i.test(window.__look[0].accent)));
await p.evaluate(async()=>{window.__daily=[];await setLearn(false)});
ok('turning the fact off clears it',await p.evaluate(()=>window.__daily.some(c=>c.kind==='fact'&&c.items.length===0)));
// Taps: the app asks what to open (as from a widget).
const bean=await p.evaluate(()=>BEANS[0]);
await p.evaluate(id=>{window.__open='bean:'+id;window.bbWidget()},bean.id);await p.waitForTimeout(900);
ok('a coffee note opens that coffee',await p.evaluate(()=>(document.querySelector('dialog[open] #vd-title')||{}).textContent||'')===bean.name);
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());window.__open='fact:'+JSON.stringify({word:'Bloom'});window.bbWidget()});await p.waitForTimeout(900);
ok('a fact note opens its word',await p.evaluate(()=>(document.querySelector('main section.on')||{}).id)==='words');
await p.evaluate(()=>{window.__open='fact:null';window.bbWidget()});await p.waitForTimeout(900);
ok('a fact with nothing to open lands on Explore',await p.evaluate(()=>(document.querySelector('main section.on')||{}).id)==='explore');
await p.evaluate(id=>{window.__open='brewbean:'+id;window.bbWidget()},bean.id);await p.waitForTimeout(900);
ok('Brew it sets up the Brew page for that coffee',await p.evaluate(id=>(document.querySelector('main section.on')||{}).id==='dial'&&S.bean&&S.bean.id===id,bean.id));
ok('no page errors',!errs.length,errs);await b.close()})();
