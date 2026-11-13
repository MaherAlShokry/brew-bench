// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ok=(n,c,x)=>console.log((c?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
 const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await c.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
 await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);await p.evaluate(()=>showTab('scan'));
 // a big "phone photo" of a label
 const mk=()=>p.evaluate(async()=>{const c=document.createElement('canvas');c.width=4000;c.height=3000;const x=c.getContext('2d');x.fillStyle='#e9e2d6';x.fillRect(0,0,4000,3000);x.fillStyle='#f8f5ef';x.fillRect(900,500,2200,2000);x.fillStyle='#1d1a17';
  x.font='bold 170px sans-serif';x.fillText('KIAMBU AA',1050,850);x.font='90px sans-serif';[['Origin: Kenya',1150],['Process: Washed',1300],['Variety: SL28, SL34',1450],['Roast: Light',1600],['Roasted on 2026-10-20',1750]].forEach(([t,y])=>x.fillText(t,1050,y));
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.92));const f=new File([blob],'label.jpg',{type:'image/jpeg'});window.__f=f;return f.size});
 console.log('photo bytes',await mk());
 const scan=async(label,limit)=>{const t0=Date.now();await p.evaluate(()=>usePhoto(window.__f));
  for(;;){await p.waitForTimeout(500);const st=await p.evaluate(()=>[document.getElementById('scan-go').disabled,document.getElementById('scan-drop').classList.contains('scanning'),document.getElementById('scan-status').textContent]);if(!st[1]||Date.now()-t0>limit)return [Math.round((Date.now()-t0)/1000),st[2],st[1]]}};
 const cdp=await c.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 let r=await scan('normal',200000);ok('a 4000x3000 photo reads (4x slower CPU) in '+r[0]+' s',/Kenya/.test(r[1])&&!r[2],r[1].slice(0,120));
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 // the reader freezes mid-read
 await p.evaluate(async()=>{const w=await ocrWorker(()=>{});w.__rec=w.recognize;w.recognize=()=>new Promise(()=>{})});
 r=await scan('frozen',90000);ok('a frozen reader stops with a message in '+r[0]+' s',!r[2]&&/too long/.test(r[1])&&r[0]<70,r[1].slice(0,90));
 ok('the frozen reader was shut down',await p.evaluate(()=>OCR===null));
 r=await scan('after',200000);ok('the next scan works ('+r[0]+' s)',/Kenya/.test(r[1])&&!r[2],r[1].slice(0,80));
 ok('no page errors',!errs.length,errs.slice(0,3));await b.close()})();
