// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
 // give every coffee a photo, as a real gallery would have
 await p.evaluate(async()=>{const bs=JSON.parse(localStorage.getItem('bb-beans'));const cv=document.createElement('canvas');cv.width=600;cv.height=800;const x=cv.getContext('2d');for(const [i,bb] of bs.entries()){x.fillStyle='hsl('+i*40+',60%,45%)';x.fillRect(0,0,600,800);await BIMG.put(bb.id,cv.toDataURL('image/jpeg',.8));bb.img=1}localStorage.setItem('bb-beans',JSON.stringify(bs))});
 const check=async label=>{const r=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#bv-coffees .crow')];const vis=rows.filter(r=>{const b=r.getBoundingClientRect();return b.bottom>0&&b.top<innerHeight});return {rows:rows.length,onscreen:vis.length,withImg:vis.filter(r=>r.querySelector('.bpic img')).length,pending:vis.filter(r=>r.querySelector('[data-bimg]')).length}});console.log(label.padEnd(44),JSON.stringify(r))};
 for(const mode of ['fresh-start-wait','fresh-start-tap']){await p.reload();await p.waitForTimeout(mode==='fresh-start-wait'?6000:800);await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(1500);
  await p.evaluate(()=>{const l=document.querySelector('#bv-coffees .clist');if(l)l.scrollIntoView({block:'start'})});await p.waitForTimeout(1500);await check(mode+': rows on screen');
  await p.evaluate(()=>scrollBy(0,900));await p.waitForTimeout(1500);await check(mode+': after scrolling');}
 console.log('errors',errs);await b.close()})();
