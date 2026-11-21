// Problem reports (Settings › About): off by default and keeping nothing; turned on, an error the page raises and a
// start after the app closed by itself are kept on the phone, the Send button counts them, and turning it off clears them.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>{if(!/test boom/.test(e.message))errs.push(e.message)});
await ctx.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await ctx.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(2500);
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(400);
ok('off by default, with no Send button',await p.evaluate(()=>!UI.reports&&!$('st-repsend')&&$('st-rep').getAttribute('aria-checked')==='false'));
await p.evaluate(()=>{setTimeout(()=>{throw new Error('test boom off')},0)});await p.waitForTimeout(200);
ok('nothing is kept while off',await p.evaluate(()=>REPORTS.length===0&&!localStorage.getItem('bb-reports')));
await p.click('#st-rep');await p.waitForTimeout(500);
await p.evaluate(()=>{setTimeout(()=>{throw new Error('test boom')},0)});await p.waitForTimeout(200);
// A start that finds the last visit still marked running (no pagehide: the app was killed) notes a restart.
await p.evaluate(()=>{localStorage.setItem('bb-running','1')});const p2=await ctx.newPage();p2.on('pageerror',e=>{if(!/test boom/.test(e.message))errs.push(e.message)});await p2.goto('http://localhost:8099/index.html');await p2.waitForTimeout(2500);
const got=await p2.evaluate(()=>{showTab('settings');return {k:REPORTS.map(r=>r.k),btn:($('st-repsend')||{}).textContent,txt:reportText()}});
ok('an error and a restart are kept, and Send counts them',got.k.includes('error')&&got.k.includes('restart')&&/Send report \(2\)/.test(got.btn),got);
ok('the report reads as plain text with the speed log',/problem report/.test(got.txt)&&/Closed by itself/.test(got.txt)&&/speed log/.test(got.txt));
await p2.click('#st-rep');await p2.waitForTimeout(500);
ok('turning it off clears what was kept',await p2.evaluate(()=>REPORTS.length===0&&!localStorage.getItem('bb-reports')));
ok('no page errors',!errs.length,errs);
await b.close()})();
