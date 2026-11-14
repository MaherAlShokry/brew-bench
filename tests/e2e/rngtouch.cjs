// The − and + beside a slider ignore accidental touches: a finger that lands on one and scrolls changes nothing, a
// real tap steps once (on lifting), a hold repeats. A mouse still steps at once.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
const cdp=await c.newCDPSession(p);
const info=await p.evaluate(()=>{const bt=[...document.querySelectorAll('#dial .rng-b')].find(x=>x.getClientRects().length&&/Increase/.test(x.getAttribute('aria-label')));bt.scrollIntoView({block:'center'});const r=bt.getBoundingClientRect();const inp=bt.parentElement.querySelector('input[type=range]');inp.id=inp.id||'rngT';return{x:r.left+r.width/2,y:r.top+r.height/2,id:inp.id}});
const val=()=>p.evaluate(id=>+document.getElementById(id).value,info.id);
const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
let v0=await val();
// a scroll that starts on the +
await touch('touchStart',info.x,info.y);for(let k=1;k<=6;k++){await touch('touchMove',info.x,info.y-k*12);await p.waitForTimeout(16)}await touch('touchEnd');await p.waitForTimeout(300);
ok('a scroll that starts on + changes nothing',await val()===v0,[v0,await val()]);
// a quick tap
await p.evaluate(()=>0);const r2=await p.evaluate(id=>{const bt=document.getElementById(id).parentElement.querySelector('.rng-b:last-child');const r=bt.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}},info.id);
v0=await val();await touch('touchStart',r2.x,r2.y);await p.waitForTimeout(80);await touch('touchEnd');await p.waitForTimeout(250);
ok('a tap steps once',await val()>v0,[v0,await val()]);
// a hold repeats
v0=await val();await touch('touchStart',r2.x,r2.y);await p.waitForTimeout(900);await touch('touchEnd');await p.waitForTimeout(200);
ok('a hold repeats',await val()-v0>=2*(+(await p.evaluate(id=>document.getElementById(id).step,info.id))||1)||await val()>=+(await p.evaluate(id=>document.getElementById(id).max,info.id)),[v0,await val()]);
ok('no errors',!errs.length,errs);await b.close()})();
