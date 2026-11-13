// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// PDFs are made in a background worker: a short card is one page, a long gallery runs over several, the pages match
// what the old way (on the page itself) makes, and making one doesn't freeze the screen.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(()=>{const B=JSON.parse(localStorage.getItem('bb-beans'));for(let i=0;i<40;i++)B.push(Object.assign({},B[i%8],{id:'more'+i+'x23',name:B[i%8].name+' '+(i+2)}));localStorage.setItem('bb-beans',JSON.stringify(B))});
await p.reload();await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{await loadPDF();const pages=async bl=>{const t=await bl.text();return (t.match(/\/Type \/Page\b(?!s)/g)||[]).length};
  const long=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>long.push(e.duration))).observe({type:'longtask'});
  const out={};
  for(const [n,doc] of [['bean',beanDoc(BEANS[0])],['gallery',galleryDoc()]]){const bl=await shCardFor(doc,{mode:'light',col:CARD_STYLE.col});
    await new Promise(r=>setTimeout(r,200));long.length=0;const a=await cardPDF(bl,doc.title);await new Promise(r=>setTimeout(r,100));const lw=Math.max(0,...long);
    const keep=PDFW;PDFW=false;const m=await cardPDF(bl,doc.title);PDFW=keep;
    out[n]={worker:!!PDFW,wp:a&&await pages(a),mp:m&&await pages(m),ws:a&&a.size,ms:m&&m.size,lw,title:a&&(await a.text()).includes('/Title')}}
  return out});
console.log(JSON.stringify(r));
ok('worker is used',r.bean.worker);
ok('short card: one page',r.bean.wp===1,r.bean);
ok('long gallery: several pages, same as before',r.gallery.wp>1&&r.gallery.wp===r.gallery.mp,r.gallery);
ok('similar size to before',Math.abs(r.gallery.ws-r.gallery.ms)/r.gallery.ms<0.35,r.gallery);
ok('no freeze while the PDF is made',r.bean.lw<120&&r.gallery.lw<120,[r.bean.lw,r.gallery.lw]);
ok('title kept',r.bean.title);
ok('no errors',!errs.length,errs);await b.close()})();
