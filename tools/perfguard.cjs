// Speed check for a pull request: the same common actions timed on the base build (BASE, default port 8098) and the
// pull request's build (PR, port 8099), interleaved run by run so both see the same machine, at 4x CPU slowdown.
// For each action: how long the main thread stays busy after the tap (long-frame time past 16 ms, summed) and the tap
// to the next frame. An action counts as slower only when its median is both 30% and 30 ms worse; those are measured
// again, and only a slowdown that holds fails the check. Writes perfguard.json and perfguard.md (a table for the PR).
// Usage: node tools/perfguard.cjs [rounds]   (needs Playwright; serve both builds first)
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const seed=require(path.join(__dirname,'..','tests','e2e','seed2.cjs'));
const BASE=+(process.env.BASE||8098),PR=+(process.env.PR||8099),ROUNDS=+(process.argv[2]||3);
const ACTIONS=['tap a rating','roast choice','light/dark','bottom tabs','open a coffee','passport view','open the timer','first tab visits'];
async function run(port){const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await c.route(/.*/,r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());const p=await c.newPage();
  await p.addInitScript(s=>{sessionStorage.setItem('bb-splashed','1');if(!localStorage.getItem('bb-seeded')){eval('('+s+')()');localStorage.setItem('bb-seeded','1')}window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{}}},seed.toString());
  await p.goto('http://localhost:'+port+'/index.html');await p.waitForTimeout(2500);await p.reload();
  const cdp=await c.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await p.waitForTimeout(4000);
  const out={};const med=a=>a.slice().sort((x,y)=>x-y)[a.length>>1];
  // First visits of the five bottom-bar pages, soon after opening: dropped-frame time over each slide.
  {let jank=0;for(const t of ['recipes','beans','explore','settings','dial']){await p.evaluate(()=>{window.__fr=[];let l=performance.now();const f=x=>{__fr.push(x-l);l=x;if(__fr.length<54)requestAnimationFrame(f)};requestAnimationFrame(f)});
    await p.tap('.bottomnav [data-bn="'+t+'"]');await p.waitForTimeout(1000);jank+=(await p.evaluate(()=>__fr)).reduce((a,x)=>a+Math.max(0,x-16.7),0)}out['first tab visits']=Math.round(jank)}
  await p.waitForTimeout(8000);
  await p.evaluate(()=>{window.__lf=[];new PerformanceObserver(l=>{for(const e of l.getEntries())__lf.push(e.duration)}).observe({type:'long-animation-frame'});window.__ev=[];new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.interactionId)__ev.push(e.duration)}).observe({type:'event',durationThreshold:16})});
  const meas=async(name,fn,n=6,w=700)=>{const r=[];for(let i=0;i<n;i++){await p.evaluate(()=>{__ev=[];__lf=[]});await fn(i);await p.waitForTimeout(w);r.push(await p.evaluate(()=>Math.round(__lf.reduce((a,x)=>a+Math.max(0,x-16),0)+Math.max(0,...__ev))))}out[name]=med(r)};
  await p.evaluate(()=>showTab('log'));await p.waitForTimeout(900);
  await meas('tap a rating',i=>p.tap('#l-stars [data-s="'+(i%2?4:3)+'"]'));
  await p.evaluate(()=>showTab('dial'));await p.waitForTimeout(900);
  await meas('roast choice',i=>p.tap('#dial .seg button:has-text("'+(i%2?'Medium':'Light')+'")'));
  await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(900);
  await meas('light/dark',i=>p.tap('#st-mode button:has-text("'+(i%2?'Light':'Dark')+'")'),4,1500);
  await meas('bottom tabs',i=>p.tap('.bottomnav [data-bn="'+(['recipes','settings'][i%2])+'"]'),6,900);
  await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(900);
  await meas('open a coffee',async i=>{await p.tap('#beans .crow >> nth='+(i%3));await p.waitForTimeout(700);await p.evaluate(()=>$('vd').close())},5,700);
  await meas('passport view',async i=>{await p.tap('#bg-views [data-v="'+(i%2?'coffees':'passport')+'"]')},6,900);
  await meas('open the timer',async i=>{await p.evaluate(()=>showTab('recipes'));await p.waitForTimeout(300);await p.evaluate(()=>openTimer(2));await p.waitForTimeout(700);await p.evaluate(()=>$('timer').close())},4,700);
  await b.close();return out}
(async()=>{const S={base:{},pr:{}};const add=(k,o)=>{for(const [a,v] of Object.entries(o))(S[k][a]=S[k][a]||[]).push(v)};
  const med=a=>a.slice().sort((x,y)=>x-y)[a.length>>1];
  for(let r=0;r<ROUNDS;r++){add('base',await run(BASE));add('pr',await run(PR))}
  const slower=a=>{const b=med(S.base[a]),q=med(S.pr[a]);return q>b*1.3&&q-b>30};
  let bad=ACTIONS.filter(a=>S.base[a]&&slower(a));
  // A slowdown is only believed if it holds when measured again.
  if(bad.length){for(let r=0;r<ROUNDS;r++){add('base',await run(BASE));add('pr',await run(PR))}bad=bad.filter(slower)}
  const rows=ACTIONS.filter(a=>S.base[a]).map(a=>({action:a,base:med(S.base[a]),pr:med(S.pr[a]),slower:bad.includes(a)}));
  fs.writeFileSync('perfguard.json',JSON.stringify({rows,bad},null,1));
  const md='### Speed check\nBusy time after each action (ms, median of '+S.base[ACTIONS[0]].length+' interleaved runs, 4x CPU). Lower is better; only a slowdown of 30% and 30 ms that holds when measured again fails.\n\n| Action | Base | This PR | |\n|---|---:|---:|---|\n'+
    rows.map(r=>'| '+r.action+' | '+r.base+' | '+r.pr+' | '+(r.slower?'**slower**':r.pr<r.base*0.8&&r.base-r.pr>20?'faster':'')+' |').join('\n')+'\n';
  fs.writeFileSync('perfguard.md',md);console.log(md);if(bad.length){console.log('Slower: '+bad.join(', '));process.exitCode=1}})();
