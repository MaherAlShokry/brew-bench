// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(async()=>{const bs=JSON.parse(localStorage.getItem('bb-beans'));const y=new Date().getFullYear();const cv=document.createElement('canvas');cv.width=600;cv.height=800;const x=cv.getContext('2d');
  bs.forEach((bb,i)=>{bb.tried=y+'-0'+(1+i%9)+'-1'+(i%9);if(i<5){bb.shelf=true;bb.bag=250;bb.rating=[5,4.5,4,4,3.5][i]}});
  for(const [i,bb] of bs.slice(0,6).entries()){x.fillStyle='hsl('+i*50+',55%,45%)';x.fillRect(0,0,600,800);await BIMG.put(bb.id,cv.toDataURL('image/jpeg',.8));bb.img=1}
  localStorage.setItem('bb-beans',JSON.stringify(bs));const t={};t[y]={ids:bs.slice(0,5).map(b=>b.id),hm:[bs[6].id],snap:[]};localStorage.setItem('bb-top3',JSON.stringify(t))});
await p.reload();await p.waitForTimeout(1200);await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(1000);
// Drinking now
const sb=await p.$('[data-shelfshare]');ok('Drinking now has a Share button',!!sb);
await sb.scrollIntoViewIfNeeded();const hb=await p.evaluate(()=>{const h=document.querySelector('.shelf-h').getBoundingClientRect();return {y:h.top,h:h.height}});await p.screenshot({path:'bt/shelf-h.png',clip:{x:0,y:Math.max(0,hb.y-10),width:390,height:hb.h+20}});
await sb.click();await p.waitForTimeout(400);ok('share sheet opens',await p.evaluate(()=>$('sharesheet').open));
await p.waitForSelector('#sharesheet .shcard-pv img',{timeout:15000});ok('shelf card drawn',true);
const save=async name=>{const d=await p.evaluate(async()=>{const bl=await SHCARD;const r=new FileReader();return await new Promise(ok=>{r.onload=()=>ok(r.result);r.readAsDataURL(bl)})});fs.writeFileSync('bt/'+name,Buffer.from(d.split(',')[1],'base64'))};
await save('card-shelf.jpg');
ok('text version lists every bag',await p.evaluate(()=>SHDOC.blocks[0].list.length===shelfOrder().length));
await p.evaluate(()=>$('sharesheet').close());await p.waitForTimeout(300);
// Top 5
await p.evaluate(()=>{BVIEW='top3';renderBeanViews()});await p.waitForTimeout(800);
const tb=await p.$('[data-t5share]');ok('Top 5 has a Share button',!!tb);await tb.scrollIntoViewIfNeeded();
const ch=await p.evaluate(()=>{const h=document.querySelector('.crown-h').getBoundingClientRect();return {y:h.top,h:h.height}});await p.screenshot({path:'bt/crown-h.png',clip:{x:0,y:Math.max(0,ch.y-10),width:390,height:ch.h+20}});
await tb.click();await p.waitForTimeout(400);await p.waitForSelector('#sharesheet .shcard-pv img',{timeout:15000});ok('top 5 card drawn',true);await save('card-top5.jpg');
ok('text version: five in order + mentions',await p.evaluate(()=>SHDOC.blocks[0].list.length===5&&/^#1 /.test(SHDOC.blocks[0].list[0])&&SHDOC.blocks[1].list.length===1),await p.evaluate(()=>SHDOC.blocks));
ok('no errors',!errs.length,errs);await b.close()})();
