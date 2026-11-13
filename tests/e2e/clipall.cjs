// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Every page at four phone widths: text cut off (without a tooltip or ellipsis meant as a summary), or text running under a picture.
const {chromium}=require('playwright');const demo=require('./seed2.cjs');(async()=>{const b=await chromium.launch();const R={};const add=(k,v)=>{(R[k]=R[k]||new Set()).add(v)};
 for(const W of [320,360,390,430]){const c=await b.newContext({viewport:{width:W,height:800},serviceWorkers:'block'});await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p.goto('http://localhost:8099/index.html');await p.evaluate(demo);await p.reload();await p.waitForTimeout(800);
  const tabs=await p.evaluate(()=>[...document.querySelectorAll('main section[id]')].map(s=>s.id));
  for(const t of tabs){await p.evaluate(t=>{showTab(t);if(t==='gear')gearTab('set')},t);await p.waitForTimeout(250);
   const r=await p.evaluate(()=>{const out=[];const sec=document.querySelector('main section.on');if(!sec)return out;
    for(const el of sec.querySelectorAll('button,span,b,h3,h4,small,label,p,div,strong,em,i,a')){if(!el.checkVisibility())continue;const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>2);if(!own)continue;
     const s=getComputedStyle(el);if(el.scrollWidth>el.clientWidth+2&&(s.overflow==='hidden'||s.overflowX==='hidden')&&s.textOverflow!=='ellipsis'&&!el.closest('.scrollrow,[style*="overflow-x"],.chips,.cgrid'))out.push('cut: '+el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0]+' "'+el.textContent.trim().slice(0,24)+'"');}
    // text sitting over a picture beside it
    for(const pic of sec.querySelectorAll('.bgh-fan,.bpic,.tro-ic,.ssn-ic,img')){if(!pic.checkVisibility())continue;const pr=pic.getBoundingClientRect();if(pr.width<20)continue;const box=pic.parentElement;for(const tx of box.parentElement?box.parentElement.querySelectorAll('b,small,span,h3'):[]){if(tx.contains(pic)||pic.contains(tx)||!tx.checkVisibility())continue;const rg=document.createRange();rg.selectNodeContents(tx);for(const q of rg.getClientRects()){if(q.width>4&&q.right>pr.left+3&&q.left<pr.right-3&&q.bottom>pr.top+3&&q.top<pr.bottom-3&&getComputedStyle(pic).position!=='absolute'){out.push('over a picture: "'+tx.textContent.trim().slice(0,24)+'"');break}}}}
    return [...new Set(out)]});
   r.forEach(x=>add(t+': '+x,W))}
  await c.close()}
 const ks=Object.keys(R).sort();console.log(ks.map(k=>k+'  @'+[...R[k]].join(',')).join('\n')||'no clipping on any page at 320, 360, 390 and 430 px');await b.close()})();
