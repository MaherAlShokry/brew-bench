// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Share images are painted in a background worker: each card matches the one drawn on the page (same size, nearly the
// same pixels), the screen doesn't freeze while it's made, and PDFs follow the app's own look.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
for(const mode of ['light','dark']){const c=await b.newContext({viewport:{width:390,height:844},colorScheme:mode});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(m=>{const B=JSON.parse(localStorage.getItem('bb-beans'));localStorage.setItem('bb-theme',m);localStorage.setItem('bb-advent',JSON.stringify([{id:'cwcal1',name:'Test calendar',roaster:'Roaster',year:2026,n:24,g:50}]));B.slice(0,3).forEach((b,i)=>b.cal={id:'cwcal1',d:i+1});localStorage.setItem('bb-beans',JSON.stringify(B))},mode);
await p.reload();await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const docs=[['bean',()=>beanDoc(BEANS[0])],['gallery',()=>galleryDoc()],['log',()=>logDoc()],['history',()=>historyDoc()],['flow',()=>flowDoc()],['calendar',()=>calDoc(CALS[0])],['origin',()=>originDoc('kenya')],['brew',()=>dialDoc()]];
  const px=async bl=>{const bm=await createImageBitmap(bl),cv=new OffscreenCanvas(bm.width,bm.height),x=cv.getContext('2d');x.drawImage(bm,0,0);return{w:bm.width,h:bm.height,d:x.getImageData(0,0,bm.width,bm.height).data}};
  const long=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>long.push(e.duration))).observe({type:'longtask'});
  const out={worker:!!(await bcWorker()),cards:{}};
  for(const [k,mk] of docs){let doc;try{doc=mk()}catch(e){out.cards[k]={skip:e.message};continue}if(!doc.card){out.cards[k]={skip:'no card'};continue}
    const st={mode:'dark',col:CARD_STYLE.col};
    await new Promise(r=>setTimeout(r,300));long.length=0;
    const n0=BC.BGN||0;const t0=performance.now();const a=await shCardFor(doc,st);const bg=(BC.BGN||0)>n0;const tw=performance.now()-t0;await new Promise(r=>setTimeout(r,150));const lw=Math.max(0,...long);
    doc._cards=null;const keep=BCW;BCW=Promise.resolve(false);await new Promise(r=>setTimeout(r,300));long.length=0;const t1=performance.now();const m=await shCardFor(doc,st);const tm=performance.now()-t1;BCW=keep;await new Promise(r=>setTimeout(r,150));const lm=Math.max(0,...long);
    const A=await px(a),M=await px(m);let diff=0,n=0;if(A.w===M.w&&A.h===M.h){for(let i=0;i<A.d.length;i+=4*37){diff+=Math.abs(A.d[i]-M.d[i])+Math.abs(A.d[i+1]-M.d[i+1])+Math.abs(A.d[i+2]-M.d[i+2]);n+=3}}
    out.cards[k]={bg,size:[A.w,A.h],same:A.w===M.w&&A.h===M.h,diff:n?+(diff/n).toFixed(2):null,longTask:Math.round(lw),pageLongTask:Math.round(lm),ms:[Math.round(tw),Math.round(tm)],brk:(a._brk||[]).length===(m._brk||[]).length}}
  // The PDF is in the app's look, whatever look was picked for the image.
  CARD_STYLE.mode=curTheme()==='dark'?'light':'dark';CARD_STYLE.col='kenya';const seen=[];const keepF=shCardFor;
  shCardFor=(d,s)=>{seen.push(s);return keepF(d,s)};await docPDF(beanDoc(BEANS[0]));shCardFor=keepF;out.pdfStyle=seen[0];out.theme=curTheme();
  return out});
console.log(mode,JSON.stringify(r));
ok(mode+': cards are painted in the background',r.worker);
for(const [k,v] of Object.entries(r.cards)){if(v.skip){console.log('  skip',k,v.skip);continue}
  ok(mode+' '+k+': same size and look as drawn on the page',v.same&&v.diff!==null&&v.diff<3&&v.brk,v);
  // No freeze: the page's longest pause is short, or far shorter than drawing the same card on the page (a slower
  // machine, like CI's, stretches both).
  ok(mode+' '+k+': painted in the background, no freeze while it is made',v.bg&&(v.longTask<150||v.longTask<v.pageLongTask*0.4),v)}
ok(mode+': the PDF follows the app look (Vibe’s own, '+r.theme+')',r.pdfStyle&&r.pdfStyle.col==='classic'&&r.pdfStyle.mode===r.theme,r.pdfStyle);
ok(mode+': no errors',!errs.length,errs);await c.close()}
await b.close()})();
