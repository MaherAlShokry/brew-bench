// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:392,height:800},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1000);
const run=async(sel,tab)=>{await p.evaluate(t=>goTab(t),tab);await p.waitForTimeout(1200);return p.evaluate(async sel=>{let s=document.querySelector(sel);s.scrollIntoView({block:'center'});await new Promise(r=>setTimeout(r,400));s=document.querySelector(sel);
 const bs=[...s.querySelectorAll(':scope>button')],cur=bs.findIndex(x=>x.getAttribute('aria-pressed')==='true'),tgt=bs[cur===0?bs.length-1:0];const xs=[],lit=[];tgt.click();
 for(let f=0;f<18;f++){const s2=document.querySelector(sel),i=s2.querySelector(':scope>.seg-ind');xs.push(i?Math.round(i.getBoundingClientRect().left):null);lit.push([...s2.querySelectorAll(':scope>button')].filter(x=>{const c=getComputedStyle(x).backgroundColor;return c!=='rgba(0, 0, 0, 0)'}).length);await new Promise(r=>requestAnimationFrame(r))}
 return [sel,xs.join(','),'lit:'+Math.max(...lit)]},sel)};
for(const [s,t] of [['#gear-tabs','settings'],['#gear-tabs','settings'],['#gear-tabs','settings']])console.log(JSON.stringify(await run(s,t).catch(e=>[s,String(e).slice(0,100)])));
console.log(errs);await b.close()})()
