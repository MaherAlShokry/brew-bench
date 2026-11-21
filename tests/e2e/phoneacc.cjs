// Your phone's colours (Android 12+): the app asks the phone for its wallpaper accent and offers it as "Your phone"
// among the accents, one row still; picked, the app takes that colour (a lighter one in dark mode) and keeps it from
// the first paint on the next start. Older phones answer nothing and nothing is added.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const ctx=await b.newContext({viewport:{width:360,height:800}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');window.__wall={l:'#1B6A8C',i:'#0F4F6B',d:'#9BD0EA'};
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{Widget:{update:async()=>{},timer:async()=>{},pending:async()=>({open:''}),wallColors:async()=>window.__wall}}}});
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t));goTab('settings');await w(500);const sw=document.querySelector('.swatch[data-accent="phone"]'),o={has:!!sw};
  const tops=[...document.querySelectorAll('#settings-in .swatch')].map(s=>Math.round(s.getBoundingClientRect().top));o.oneRow=new Set(tops).size===1;
  sw.click();await w(600);o.cherry=getComputedStyle(document.documentElement).getPropertyValue('--cherry').trim().toLowerCase();o.accent=UI.accent;o.name=$('st-accn').textContent;
  document.documentElement.setAttribute('data-theme','dark');o.dark=getComputedStyle(document.documentElement).getPropertyValue('--cherry').trim().toLowerCase();document.documentElement.setAttribute('data-theme','light');return o});
ok('the phone\'s accent is offered, the dots still one row',r.has&&r.oneRow,r);
ok('picked, the app takes the phone\'s colour, lighter in dark mode',r.accent==='phone'&&r.cherry==='#1b6a8c'&&r.dark==='#9bd0ea'&&r.name==='Your phone',r);
await p.reload();await p.waitForTimeout(80);
const early=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cherry').trim().toLowerCase());
ok('it is there from the first paint on the next start',early==='#1b6a8c',early);
const p2=await ctx.newPage();await p2.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p2.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{Widget:{update:async()=>{},timer:async()=>{},pending:async()=>({open:''}),wallColors:async()=>({})}}}});await p2.goto('http://localhost:8099/index.html');await p2.waitForTimeout(1500);
const old=await p2.evaluate(()=>({acc:UI.accent,has:ACCENTS.some(a=>a[0]==='phone'),ls:localStorage.getItem('bb-phoneacc')}));
ok('a phone without its own colours gets nothing added, and the app falls back to the vibe\'s own',old.acc==='classic'&&!old.has&&!old.ls,old);
ok('no page errors',!errs.length,errs);await b.close()})();
