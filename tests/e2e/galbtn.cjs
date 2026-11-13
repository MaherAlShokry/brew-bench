// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1200);await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(1000);
const g=await p.$('[data-galshare]');console.log('gallery button',!!g);await g.scrollIntoViewIfNeeded();const r=await p.evaluate(()=>{const h=document.querySelector('.cab-h').getBoundingClientRect();return{y:h.top,h:h.height}});
await p.screenshot({path:'bt/gal-h.png',clip:{x:0,y:Math.max(0,r.y-10),width:390,height:r.h+20}});await g.click();await p.waitForSelector('#sharesheet .shcard-pv img',{timeout:15000});console.log('gallery card drawn; text rows',await p.evaluate(()=>SHDOC.blocks[0].list.length),'beans',await p.evaluate(()=>BEANS.length));
console.log('errors',errs);await b.close()})();
