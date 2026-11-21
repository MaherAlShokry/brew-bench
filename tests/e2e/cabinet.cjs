// Shared cabinet: in a shared log you share the coffees on your shelf (name, roastery, origin, process, notes only) and
// see your friends' under "On their shelves". The sync server is a stub here: writes are caught, and the stream is
// replaced by applying a snapshot.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const puts=[];
await p.route(u=>!u.href.startsWith('http://localhost'),async r=>{const u=r.request().url();if(/sync\.example/.test(u)){if(r.request().method()==='PUT')puts.push({u,body:r.request().postData()});return r.fulfill({status:200,body:'null'})}return r.abort()});
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-syncdb','https://sync.example');window.EventSource=class{constructor(){}addEventListener(){}close(){}}});
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
await p.evaluate(()=>{joinGroup('ABCD-2345','Sam')});await p.waitForTimeout(800);
const mine=puts.filter(x=>/\/cabinet\//.test(x.u)).map(x=>({u:x.u,b:JSON.parse(x.body)}));
const shelf=await p.evaluate(()=>BEANS.filter(b=>b.shelf).length);
ok('your shelf is shared, one record under your name, with only the bag details',mine.length>=1&&/\/groups\/ABCD-2345\/cabinet\/sam\.json/.test(mine[0].u)&&mine[0].b.by==='Sam'&&mine[0].b.beans.length===Math.min(8,shelf)&&mine[0].b.beans.every(x=>Object.keys(x).sort().join()==='f,n,o,p,r'),mine[0]);
const r=await p.evaluate(async()=>{applyRemote({log:{},recipes:{},cabinet:{sam:{by:'Sam',ts:1,beans:[{n:'Mine',r:'',o:'kenya',p:'washed',f:''}]},alex:{by:'Alex',ts:2,beans:[{n:'Halo Hartume',r:'Onyx',o:'ethiopia',p:'natural',f:'blueberry'},{n:'<img src=x onerror=alert(1)>',r:'',o:'nowhere',p:'',f:''}]}}});
  goTab('log');await new Promise(r=>setTimeout(r,500));const el=document.querySelector('#sh-cab');return{text:el&&el.textContent,img:!!(el&&el.querySelector('img')),cards:el?el.querySelectorAll('.sh-cb').length:0}});
ok('friends\' shelves show under On their shelves, not yours',/On their shelves/.test(r.text||'')&&/Alex/.test(r.text)&&/Halo Hartume/.test(r.text)&&/Onyx/.test(r.text)&&!/Mine/.test(r.text)&&r.cards===2,r);
ok('what comes from others is shown as text only',!r.img,r);
const n0=puts.length;await p.evaluate(()=>{BEANS[0].name=BEANS[0].name+' X';saveBeans()});await p.waitForTimeout(2200);
ok('changing your coffees shares the shelf again',puts.slice(n0).some(x=>/\/cabinet\//.test(x.u)),puts.slice(n0).map(x=>x.u));
ok('no page errors',!errs.length,errs);await b.close()})();
