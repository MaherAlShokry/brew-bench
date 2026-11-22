// Opening the Android app from a widget (or a notification) goes straight to the place it asked for: the app moves
// there under its opening scene, which then lifts at once onto it. The start page (Brew) never shows first, and the
// scene doesn't play out its full length.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
for(const [want,tab] of [['passport','beans'],['log','log'],['scan','scan'],['word','explore'],['shelf','beans']]){
  const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await c.addInitScript(w=>{const ok=()=>Promise.resolve({});let left=w;
    window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{LocalNotifications:{checkPermissions:()=>Promise.resolve({display:'granted'}),requestPermissions:()=>Promise.resolve({display:'granted'}),schedule:ok,cancel:ok,getPending:()=>Promise.resolve({notifications:[]}),addListener:ok,createChannel:ok},App:{addListener:ok,getInfo:()=>Promise.resolve({version:'1.0'})},
      Widget:{pending:()=>{const r={open:left};left='';return Promise.resolve(r)},update:o=>{window.__wup=o;return Promise.resolve({})},timer:ok,timerState:()=>Promise.resolve({state:'stop'}),cabinet:ok,quick:ok,passport:ok,words:ok,schedule:ok,accent:ok}}};
    // What shows once the opening scene is gone: watched every frame from the start.
    window.__seen=[];const look=()=>{const h=document.documentElement,s=document.getElementById('splash');
      if(s&&h.classList.contains('splashing')&&!s.classList.contains('out')){requestAnimationFrame(look);return}
      const on=document.querySelector('main section.on');window.__seen.push(on&&on.id);window.__lift=window.__lift||performance.now();if(window.__seen.length<30)requestAnimationFrame(look)};
    requestAnimationFrame(look)},want);
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>({seen:[...new Set(window.__seen)],lift:Math.round(window.__lift||0),on:(document.querySelector('main section.on')||{}).id}));
  ok(want+': opens straight on '+tab+' (never the start page first)',r.seen.length===1&&r.seen[0]===tab&&r.on===tab,r);
  ok(want+': the opening scene lifts at once',r.lift>0&&r.lift<1500,r);
  ok(want+': no page errors',!errs.length,errs);await c.close()}
// What the app sends the Drinking now and Your shelf widgets: the share card's colours, and each bag as its row shows it.
{const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await c.addInitScript(()=>{const ok=()=>Promise.resolve({});window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{LocalNotifications:{checkPermissions:()=>Promise.resolve({display:'granted'}),requestPermissions:()=>Promise.resolve({display:'granted'}),schedule:ok,cancel:ok,getPending:()=>Promise.resolve({notifications:[]}),addListener:ok,createChannel:ok},App:{addListener:ok,getInfo:()=>Promise.resolve({version:'1.0'})},
    Widget:{pending:()=>Promise.resolve({open:''}),sdk:()=>Promise.resolve({sdk:35}),update:o=>{window.__wup=o;window.__wn=(window.__wn||0)+1;return Promise.resolve({})},timer:ok,timerState:()=>Promise.resolve({state:'stop'})}}}});
  const p=await c.newPage();await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1200);
  const r=await p.evaluate(async()=>{BEANS.slice(0,3).forEach(x=>x.shelf=true);await updWidget();const u=window.__wup||{},hm=JSON.parse(u.homeTheme||'{}'),th=JSON.parse(u.theme||'{}'),st=JSON.parse(u.shelfTheme||'{}'),cab=JSON.parse(u.cabinet||'[]'),ss=JSON.parse(u.shelfStats||'{}');
    return{hm,th,st,ss,first:cab[0],order:cab.map(x=>x.id).join()===shelfOrder().slice(0,30).map(x=>x.id).join(),n:cab.length}});
  const col=t=>t&&Array.isArray(t.bg)&&t.bg.length===3&&/^#[0-9a-f]{6}$/i.test(t.acc)&&/^#[0-9a-f]{6}$/i.test(t.ink);
  ok('the widgets get the share card colours (coffee, shelf and house)',col(r.th)&&col(r.st)&&col(r.hm),r);
  ok('the shelf is in the shelf card order, each row with its roastery, rating and grams left',r.order&&r.n>=3&&r.first&&'sub' in r.first&&'rating' in r.first&&'g' in r.first&&'bag' in r.first,r);
  ok('the shelf counts (bags, roasteries, origins)',r.ss.bags>=3&&'ros' in r.ss&&'ors' in r.ss,r.ss);
  // A frozen bag: its days in the freezer don't count on the widget either.
  const fz=await p.evaluate(async()=>{const b=BEANS[0],ago=d=>new Date(Date.now()-d*864e5).toISOString().slice(0,10);b.roastDate=ago(30);b.frz=[[ago(20),ago(8)]];
    await updWidget();const row=JSON.parse(window.__wup.cabinet).find(x=>x.id===b.id),wd=Math.round((Date.now()-Date.parse(row.roastDate+'T12:00'))/864e5);return{wd,app:fresh(b).d}});
  ok('a frozen bag counts the same days on the widget as in the app',Math.abs(fz.wd-fz.app)<=1,fz);
  // Logging a brew redraws the widgets shortly after (what's left, the shelf order).
  const lg=await p.evaluate(async()=>{const n0=window.__wn||0;LOG.unshift({id:'wl1',ts:Date.now(),date:'',coffee:'x',settings:'',stars:4});save('bb-log',LOG);wRefresh();await new Promise(r=>setTimeout(r,1200));LOG.shift();return(window.__wn||0)-n0});
  ok('logging a brew updates the widgets',lg>=1,lg);
  // The Now Bar switch is only for Android 16 and later.
  const nb=await p.evaluate(async()=>{goTab('settings');await new Promise(r=>setTimeout(r,300));const a=!!$('st-live');ANDROID_SDK=36;SET_H='';renderSettings();const b=!!$('st-live');return{a,b}});
  ok('the Now Bar switch shows only on Android 16',!nb.a&&nb.b,nb);await c.close()}
await b.close()})();
