const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(async()=>{let bs=JSON.parse(localStorage.getItem('bb-beans'));const y=new Date().getFullYear();bs=bs.concat(bs.slice(0,4).map((x,i)=>Object.assign({},x,{id:'zz'+i+'abcd',name:x.name+' Reserve'})));
  const cv=document.createElement('canvas');cv.width=900;cv.height=1100;const x=cv.getContext('2d');
  for(const [i,bb] of bs.entries()){bb.tried=y+'-02-1'+(i%9);bb.shelf=i<6;bb.bag=250;bb.left=[250,110,40,200,0,180][i%6];bb.leftAt=Date.now()-1000;bb.rating=[5,4.5,4,3.5][i%4];
    if(i%2===0){const g=x.createLinearGradient(0,0,900,1100);g.addColorStop(0,'hsl('+i*40+',60%,55%)');g.addColorStop(1,'hsl('+(i*40+80)+',50%,25%)');x.fillStyle=g;x.fillRect(0,0,900,1100);x.fillStyle='#fff';x.font='bold 90px sans-serif';x.fillText('BAG '+i,120,560);await BIMG.put(bb.id,cv.toDataURL('image/jpeg',.9));bb.img=true}else bb.img=false}
  bs[0].name='Aroma Nativo Bourbon Aji Hydro Honey Lot 396';localStorage.setItem('bb-beans',JSON.stringify(bs));const t={};t[y]={ids:bs.slice(0,5).map(b=>b.id),hm:[bs[6].id,bs[7].id,bs[8].id,bs[9].id],snap:[]};localStorage.setItem('bb-top3',JSON.stringify(t))});
await p.reload();await p.waitForTimeout(1200);
const r=await p.evaluate(async()=>{const y=new Date().getFullYear();const out={};for(const [k,f] of [['top5',()=>top5CardImg(y)],['shelf',()=>shelfCardImg()],['gallery',()=>galleryCardImg()],['brew',()=>brewCard()]]){const bl=await f();const bm=await createImageBitmap(bl);out[k]={w:bm.width,h:bm.height,kb:Math.round(bl.size/1024),d:await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(bl)})}}
  return {out,hm:t5Hm(y),doc:top5Doc(y).blocks[1]}});
for(const k in r.out){fs.writeFileSync('bt/hq-'+k+'.jpg',Buffer.from(r.out[k].d.split(',')[1],'base64'));console.log(k,r.out[k].w+'x'+r.out[k].h,r.out[k].kb+'KB')}
ok('share shows 3 of the 4 saved mentions',r.hm.length===3,r.hm);ok('text version too',r.doc.list.length===3);
// in-app: Top 5 view lists 3; picker refuses a 4th
await p.evaluate(()=>{showTab('beans');BVIEW='top3';renderBeanViews()});await p.waitForTimeout(600);
ok('Top 5 view lists 3 mentions',await p.evaluate(()=>document.querySelectorAll('#bv-top3 .t3hm-i').length)===3);
console.log('errors',errs);await b.close()})();
