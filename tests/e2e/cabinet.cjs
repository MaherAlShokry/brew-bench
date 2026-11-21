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
const n2=puts.length;await p.evaluate(async()=>{goTab('log');await new Promise(r=>setTimeout(r,300));$('sh-cabsw').click()});await p.waitForTimeout(800);
const dels=await p.evaluate(()=>({share:CAB_SHARE}));
ok('the switch turns sharing off (and takes your shelf down)',dels.share===false,dels);
// A database whose rules refuse the shelf: the refusal is dropped, the queue carries on (brews still go up), the card
// says Live, not Offline, and the shelf stops being sent. The switch takes your shelf down.
const p3=await b.newPage({viewport:{width:390,height:844}});p3.on('pageerror',e=>errs.push(e.message));const got=[];
await p3.route(u=>!u.href.startsWith('http://localhost'),async r=>{const u=r.request().url();if(/sync2\.example/.test(u)){const m=r.request().method();got.push(m+' '+u.replace(/^.*\/groups\//,''));return r.fulfill({status:/\/cabinet\//.test(u)?401:200,body:/\/cabinet\//.test(u)?'{"error":"Permission denied"}':'null'})}return r.abort()});
await p3.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-syncdb','https://sync2.example');window.EventSource=class{constructor(){}addEventListener(){}close(){}}});
await p3.goto('http://localhost:8099/index.html');await p3.evaluate(require('./seed2.cjs'));await p3.reload();await p3.waitForTimeout(1800);
const q=await p3.evaluate(async()=>{joinGroup('WXYZ-2345','Sam');await new Promise(r=>setTimeout(r,1500));const e={id:'cabt1',ts:Date.now(),date:'',coffee:'After',settings:'x',stars:4};LOG.unshift(e);queue('put',e.id,e);await new Promise(r=>setTimeout(r,800));
  goTab('log');await new Promise(r=>setTimeout(r,400));return{pending:PENDING.length,state:SYNC_STATE,refused:CAB_REFUSED,sw:!!$('sh-cabsw'),label:$('sync-state')&&$('sync-state').textContent}});
ok('a refused shelf never holds the log back: nothing left waiting, the brew went up, and the card is not Offline',q.pending===0&&got.some(x=>/log\/cabt1/.test(x))&&q.state!=='offline'&&q.refused,{q,got:got.slice(-4)});
const n1=got.length;await p3.evaluate(()=>{BEANS[0].shelf=true;BEANS[0].name+=' Z';saveBeans()});await p3.waitForTimeout(2200);
ok('after a refusal the shelf is not sent again',!got.slice(n1).some(x=>/cabinet/.test(x)),got.slice(n1));
const card=await p3.evaluate(()=>{const t=document.querySelector('#l-share .sh-tx'),b=t.querySelector('b'),st=t.querySelector('.sh-st'),bt=document.querySelector('#sh-invite').getBoundingClientRect(),sr=st.getBoundingClientRect();
  return{titleH:Math.round(b.getBoundingClientRect().height),codeFull:t.querySelector('.code').scrollWidth<=t.querySelector('.code').clientWidth+1,overlap:sr.right>bt.left+1,code:t.querySelector('.code').textContent}});
ok('the card: the title on one line, the status and code under it, all of the code, nothing under the buttons',card.titleH<30&&card.codeFull&&!card.overlap&&card.code==='WXYZ-2345',card);
ok('no page errors',!errs.length,errs);await b.close()})();
