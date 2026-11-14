// Sync of what the roastery features keep (two phones on one account, against a stand-in database): a roastery's logo
// goes to the other phone and its removal too, and the scanner's memory from each phone is put together, not replaced.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
// The stand-in database: one tree, read with GET, written with PATCH (paths like col/x/id) and PUT/DELETE for photos.
const DB={};const at=(path,mk)=>{let o=DB;for(const k of path){if(o[k]==null){if(!mk)return undefined;o[k]={}}o=o[k]}return o};
const setPath=(path,v)=>{const last=path.pop();const o=at(path,true);if(v===null)delete o[last];else o[last]=v};
const route=async r=>{const u=new URL(r.request().url()),parts=u.pathname.replace(/\.json$/,'').split('/').filter(Boolean).map(decodeURIComponent),m=r.request().method();
  if(m==='GET'){const v=at(parts,false);return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(v===undefined?null:v)})}
  if(m==='PATCH'){const body=JSON.parse(r.request().postData()||'{}');for(const k in body)setPath(parts.concat(k.split('/')),body[k]);return r.fulfill({status:200,contentType:'application/json',body:'{}'})}
  if(m==='PUT'){setPath(parts.slice(),JSON.parse(r.request().postData()));return r.fulfill({status:200,contentType:'application/json',body:'{}'})}
  if(m==='DELETE'){setPath(parts.slice(),null);return r.fulfill({status:200,contentType:'application/json',body:'null'})}
  return r.fulfill({status:400,body:''})};
const phone=async()=>{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>u.href.startsWith('https://fake-db.test'),route);await p.route(u=>!u.href.startsWith('http://localhost')&&!u.href.startsWith('https://fake-db.test'),r=>r.abort());
  await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-syncdb','https://fake-db.test');
    localStorage.setItem('bb-account',JSON.stringify({uid:'u1',email:'a@b.c',provider:'password',idToken:'tok',refresh:'r',exp:Date.now()+864e5}))});
  await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();
  // Signed in, the app syncs as it opens and reloads once if it brought anything in: wait until it has settled.
  const settled=async()=>{for(let i=0;i<40;i++){try{await p.waitForTimeout(500);if(await p.evaluate(()=>typeof goTab==='function'&&!SYNC_BUSY&&document.readyState==='complete'))return}catch(e){}}};
  await settled();await p.waitForTimeout(1500);await settled();
  await p.evaluate(()=>goTab('beans'));await p.waitForFunction(()=>window.BEANS_OK);return{p,c,errs}};
const A=await phone();
await A.p.evaluate(async()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#1d3f8f';g.fillRect(0,0,64,64);
  await setRoLogo('Kuf Roastery',c.toDataURL('image/png'));roLearnWords('Kuf Roastery','KUF\nkufroastery.com\nRiyadh');await sync(true)});
ok('the logo goes up to the account',!!at(['userimg','u1','logo:kuf roastery'])&&!!at(['users','u1','data','img','logo:kuf roastery']),Object.keys(at(['users','u1','data','img'])||{}));
const B=await phone();
await B.p.evaluate(async()=>{roLearnWords('Julith Coffee','julith\n@julithcoffee\nJasmine');await sync(true)});
const gotLogo=await B.p.evaluate(async()=>!!(await BIMG.get('logo:kuf roastery')));
ok('the other phone gets the logo',gotLogo);
await B.p.reload();for(let i=0;i<20;i++){await B.p.waitForTimeout(500);try{if(await B.p.evaluate(()=>typeof roMark==='function'&&!SYNC_BUSY))break}catch(e){}}await B.p.waitForTimeout(1000);
ok('and shows it once it reloads',await B.p.evaluate(()=>/ro-mark logo/.test(roMark('Kuf Roastery'))));
const mem=await B.p.evaluate(()=>({kuf:!!(RMEM.t['Kuf Roastery']&&RMEM.t['Kuf Roastery'].kufroastery),jul:!!(RMEM.t['Julith Coffee']&&RMEM.t['Julith Coffee'].julith)}));
ok('the scanner’s memory from both phones is put together on the second',mem.kuf&&mem.jul,mem);
await A.p.evaluate(()=>sync(true));
const memA=await A.p.evaluate(()=>({kuf:!!RMEM.t['Kuf Roastery'],jul:!!RMEM.t['Julith Coffee']}));
ok('and the first phone gets the other’s memory, keeping its own',memA.kuf&&memA.jul,memA);
ok('it recognises a roastery from words learnt on the other phone',await A.p.evaluate(()=>roByWords('Ethiopia\n@julithcoffee\nWashed')==='Julith Coffee'));
// Removing the logo on one phone removes it on the other.
await A.p.evaluate(async()=>{await setRoLogo('Kuf Roastery','');await sync(true)});
await B.p.evaluate(()=>sync(true));
ok('removing the logo removes it on the other phone',await B.p.evaluate(async()=>!(await BIMG.get('logo:kuf roastery'))));
ok('no errors',!A.errs.length&&!B.errs.length,A.errs.concat(B.errs));await b.close()})();
