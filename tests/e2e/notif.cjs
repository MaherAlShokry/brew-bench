const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();let fails=0;const ok=(c,m,x)=>{console.log((c?'ok   ':'FAIL ')+m+(x!==undefined?' '+JSON.stringify(x):''));if(!c)fails++};
const run=async(name,payload,early)=>{const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p.addInitScript(([payload,early])=>{window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{LocalNotifications:{addListener:(n,cb)=>{if(n==='localNotificationActionPerformed'){window.__ln=cb;if(early)setTimeout(()=>cb(payload),50)}return {remove(){}}},schedule:async()=>{},cancel:async()=>{},checkPermissions:async()=>({display:'granted'})}}};
    if(!early)sessionStorage.setItem('bb-splashed','1')},[payload,early]);
  await p.goto('http://localhost:8099/index.html');if(!early){await p.evaluate(require('./seed2.cjs'));await p.reload()}await p.waitForTimeout(early?6000:2500);
  if(!early){await p.evaluate(pl=>window.__ln(pl),payload);await p.waitForTimeout(1500)}
  const st=await p.evaluate(()=>({tab:(document.querySelector('main section.on')||{}).id,dlg:(document.querySelector('dialog[open] #vd-title')||{}).textContent||'',hash:location.hash,splash:document.documentElement.classList.contains('splashing')}));
  await c.close();return{st,errs}};
// seed once on a context to get a bean id
const {st:s0}=await run('seed',{notification:{id:7101,extra:{}}},false);
const c0=await b.newContext();const p0=await c0.newPage();await p0.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p0.goto('http://localhost:8099/index.html');await p0.evaluate(require('./seed2.cjs'));const bean=await p0.evaluate(()=>JSON.parse(localStorage.getItem('bb-beans'))[0]);await c0.close();
let r=await run('bean warm',{notification:{id:7103,extra:{bean:bean.id}}},false);ok(r.st.tab==='beans'&&r.st.dlg===((bean.name)||''),'coffee-of-the-day opens that coffee (app open)',r.st);
r=await run('reminder no bean',{notification:{id:7104,extra:{}}},false);ok(r.st.tab==='beans','reminder without a coffee opens Beans',r.st);
r=await run('fact word',{notification:{id:7202,extra:{fact:{word:'Bloom'}}}},false);ok(r.st.tab==='words','fact opens its word',r.st);
r=await run('fact missing word',{notification:{id:7206,extra:{fact:{word:'nosuchword'}}}},false);ok(r.st.tab==='explore','fact with a missing word falls back to Explore',r.st);
r=await run('fact none',{notification:{id:7203,extra:{fact:null}}},false);ok(r.st.tab==='explore','fact with nothing to open lands on Explore',r.st);
r=await run('cold reminder',{notification:{id:7104,extra:{}}},true);ok(r.st.tab==='beans'&&!r.st.splash,'cold start from a reminder ends on Beans after the splash',r.st);
r=await run('cold fact',{notification:{id:7205,extra:{}}},true);ok(r.st.tab==='explore','cold start from a fact ends on Explore',r.st);
console.log('fails',fails);await b.close()})();
