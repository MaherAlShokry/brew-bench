// The speed log: a slow tap is recorded with what was tapped and where, kept on this phone only, opened by tapping
// "Settings" five times, shared as a list, and cleared.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
// A button that takes 250 ms to answer.
await p.evaluate(()=>{goTab('settings');const x=document.createElement('button');x.id='slowbtn';x.textContent='Slow one';x.style.cssText='position:fixed;top:120px;left:20px;z-index:99';x.onclick=()=>{const t=performance.now();while(performance.now()-t<250);};document.body.appendChild(x)});
await p.tap('#slowbtn');await p.waitForTimeout(2600);
const rec=await p.evaluate(()=>({mem:SPEED.find(x=>/Slow one/.test(x.el)),stored:JSON.parse(localStorage.getItem('bb-speed')||'[]').length,synced:typeof SYNC_KEYS!=='undefined'&&(SYNC_KEYS.includes('bb-speed')||SYNC_COLS.includes('bb-speed'))}));
ok('a slow tap is recorded with what was tapped and on which page',rec.mem&&rec.mem.d>=200&&rec.mem.pg.startsWith('settings'),rec.mem);
ok('kept on this phone, not synced',rec.stored>=1&&!rec.synced,rec);
for(let i=0;i<5;i++)await p.click('#settings > h2');await p.waitForTimeout(400);
const sh=await p.evaluate(()=>({open:!!document.querySelector('dialog[open] .sp-list'),first:(document.querySelector('.sp-row')||{}).textContent||'',text:speedText()}));
ok('five taps on Settings open the list, slowest first',sh.open&&/Slow one/.test(sh.first),sh.first);
ok('the list shares as text',/speed log/.test(sh.text)&&/\d+ ms/.test(sh.text)&&/Slow one/.test(sh.text),sh.text.slice(0,200));
await p.click('#sp-clear');await p.waitForTimeout(300);
ok('Clear empties it',await p.evaluate(()=>!SPEED.length&&!localStorage.getItem('bb-speed')));
ok('no errors',!errs.length,errs);await b.close()})();
