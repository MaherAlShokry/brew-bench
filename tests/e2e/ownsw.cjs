// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:392,height:800},colorScheme:'light'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
await p.evaluate(()=>goTab('settings'));await p.waitForTimeout(900);
const chk=async l=>{const r=await p.evaluate(()=>{const i=document.querySelector('#settings-in .swatch[data-accent="classic"] i');const t=document.createElement('i');t.style.background=getComputedStyle(document.documentElement).getPropertyValue('--cherry');document.body.appendChild(t);const want=getComputedStyle(t).backgroundColor;t.remove();return {got:getComputedStyle(i).backgroundColor,want}});console.log((r.got===r.want?'ok  ':'FAIL')+' '+l,JSON.stringify(r))};
await chk('roastery light');
await p.click('#settings-in .vibe[data-vibe="pure"]');await p.waitForTimeout(500);await chk('pure light');
await p.click('#st-mode [data-v="dark"]');await p.waitForTimeout(500);await chk('pure dark');
await p.click('#settings-in .vibe[data-vibe="roastery"]');await p.waitForTimeout(500);await chk('roastery dark');
await p.click('#settings-in .vibe[data-vibe="pure"]');await p.click('#st-mode [data-v="auto"]');await p.waitForTimeout(400);await chk('pure auto(light)');
await p.emulateMedia({colorScheme:'dark'});await p.waitForTimeout(500);await chk('pure auto -> system dark');
console.log('errors',errs);await b.close()})();
