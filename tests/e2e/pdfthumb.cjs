// The share sheet shows the PDF's first page, small, on its row, in the app's look (light or dark as the app is, the
// vibe's own colours), whatever look the image has; and the PDF then reuses that card.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
for(const mode of ['light','dark']){const c=await b.newContext({viewport:{width:390,height:844},colorScheme:mode});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(m=>{localStorage.setItem('bb-theme',m);localStorage.setItem('bb-cardstyle',JSON.stringify({mode:m==='dark'?'light':'dark',col:'kenya'}))},mode);await p.reload();await p.waitForTimeout(1200);
for(const [k,mk] of [['bean','beanDoc(BEANS[0])'],['words','wordsDoc()'],['flow','flowDoc()']]){
  await p.evaluate(mk=>{window.__d=(0,eval)(mk);openShare(window.__d)},mk);
  const shown=await p.waitForFunction(()=>{const i=document.querySelector('#sharesheet .sh-pdfpv.on img');return i&&i.naturalWidth>0},null,{timeout:15000}).then(()=>true,()=>false);
  ok(mode+' '+k+': PDF preview on its row',shown);
  // The sheet draws the other look ahead while idle; let that finish, so only the PDF's own card is counted.
  await p.evaluate(async()=>{for(let i=0;i<3;i++)await new Promise(r=>requestIdleCallback(r,{timeout:3000}));await new Promise(r=>setTimeout(r,300))});
  const r=await p.evaluate(async()=>{const d=window.__d,st=pdfStyle(),seen=[];const keep=shCardFor;shCardFor=(x,s)=>{seen.push(s);return keep(x,s)};const t=performance.now();const pdf=await docPDF(d);shCardFor=keep;
    return{st,seen:seen[0]||null,ms:Math.round(performance.now()-t),size:pdf&&pdf.size,cached:!!(d._pdfBl||(d._cards&&d._cards.size))}});
  ok(mode+' '+k+': the PDF is in the app look and reuses the preview’s card',r.st.mode===mode&&r.st.col==='classic'&&(!r.seen||(r.seen.mode===mode&&r.seen.col==='classic'))&&r.size>1000&&r.cached,r);
  await p.evaluate(()=>$('sharesheet').close());await p.waitForTimeout(300)}
ok(mode+': no errors',!errs.length,errs);await c.close()}
await b.close()})();
