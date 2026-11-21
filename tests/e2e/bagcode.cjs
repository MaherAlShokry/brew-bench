// Codes on the bag: a QR code with a web address in the scan photo becomes a "Bag's page" button; a code seen on a bag
// scanned before (and kept as a coffee) brings that coffee back with an "Open it" button. The phone's barcode reader is
// stubbed here (desktop Chromium has none).
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');window.__codes=[];
  window.BarcodeDetector=class{static async getSupportedFormats(){return['qr_code','ean_13']}async detect(){return window.__codes}}});
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
const r=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),o={};goTab('scan');await w(300);
  // Don't run the text reader in this test.
  window.runScan=()=>{};const cv=document.createElement('canvas');cv.width=cv.height=64;cv.getContext('2d').fillRect(8,8,40,40);const png=await new Promise(r=>cv.toBlob(r,'image/png'));
  const file=new File([png],'bag.png',{type:'image/png'});
  window.__codes=[{rawValue:'https://roaster.example/coffee/guji',format:'qr_code'}];usePhoto(file);await w(400);
  o.link=$('sc-link')&&{href:$('sc-link').href,text:$('sc-link').textContent,shown:!$('scan-codes').hidden};o.known1=!!$('sc-known');
  // A bag scanned before, kept as a coffee, with this barcode.
  const bn=BEANS[0];SCANS.unshift({id:'sold1',t:'',info:null,sc:{origin:bn.origin,process:'washed',variety:'caturra',roast:'light',date:'',name:bn.name,roaster:bn.roaster,code:'5012345678900'},when:''});bn.scan='sold1';
  window.__codes=[{rawValue:'5012345678900',format:'ean_13'}];usePhoto(new File([png],'bag2.png',{type:'image/png'}));await w(400);
  o.known=$('sc-known')&&$('scan-codes').textContent;o.noLink=!$('sc-link');if(!$('sc-known'))return o;$('sc-known').click();await w(600);o.opened=$('vd').open&&$('vd').dataset.bean===bn.id;
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  window.__codes=[{rawValue:'javascript:alert(1)',format:'qr_code'}];usePhoto(new File([png],'bag3.png',{type:'image/png'}));await w(400);o.bad=!$('sc-link');
  newScan();o.cleared=$('scan-codes').hidden;return o});
ok('a QR web address becomes a button to the bag\'s page',r.link&&r.link.shown&&r.link.href==='https://roaster.example/coffee/guji'&&/roaster\.example/.test(r.link.text)&&!r.known1,r);
ok('a code from a bag you kept brings that coffee back, and opens it',/You have this coffee/.test(r.known||'')&&r.noLink&&r.opened,r);
ok('only web addresses become links; a new scan clears it',r.bad&&r.cleared,r);
// Without the phone's reader (iPhone, computers): jsQR is loaded from vendor/ the first time and reads the QR code.
const p2=await (await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'})).newPage();p2.on('pageerror',e=>errs.push(e.message));let jsqrLoads=0;
await p2.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p2.route(/vendor\/jsqr\.js/,r=>{jsqrLoads++;r.fulfill({contentType:'text/javascript',body:'window.jsQR=function(d,w,h){return w>0&&h>0&&d.length===w*h*4?{data:"https://roaster.example/qr"}:null}'})});
await p2.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');delete window.BarcodeDetector});
await p2.goto('http://localhost:8099/index.html');await p2.waitForTimeout(1500);
const f=await p2.evaluate(async()=>{goTab('scan');window.runScan=()=>{};const cv=document.createElement('canvas');cv.width=cv.height=64;cv.getContext('2d').fillRect(8,8,40,40);const png=await new Promise(r=>cv.toBlob(r,'image/png'));
  usePhoto(new File([png],'q.png',{type:'image/png'}));await new Promise(r=>setTimeout(r,900));return{href:$('sc-link')&&$('sc-link').href,has:'BarcodeDetector' in window}});
ok('without the phone\'s reader, the QR code is read by the bundled reader, loaded once when needed',!f.has&&f.href==='https://roaster.example/qr'&&jsqrLoads===1,{f,jsqrLoads});
ok('no page errors',!errs.length,errs);await b.close()})();
