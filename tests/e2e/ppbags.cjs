const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:392,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{const b=BEANS[0];b.bags=[{id:uid(),rd:'',g:250,on:'2024-03-01',off:'2024-04-01'}];b.prior=1;saveBeans();const k=b.origin,want=BEANS.filter(x=>x.origin===k).reduce((a,x)=>a+buys(x),0);
 goTab('beans');return {k,want}});await p.waitForTimeout(1500);await p.evaluate(()=>document.querySelector('#bg-views [data-v="passport"]').click());await p.waitForTimeout(800);
const t=await p.evaluate(k=>{const s=document.querySelector('.pp-st[data-ppo="'+k+'"] small');return s&&s.textContent},r.k);
ok('passport counts every bag, rebuys and earlier bags included',t&&t.startsWith(r.want+' bag')&&/2024/.test(t),[t,r.want]);
await p.evaluate(k=>openOrigin(k),r.k);await p.waitForTimeout(600);const h=await p.evaluate(()=>document.querySelector('#vd .hint').textContent);ok('origin page agrees',h.includes(r.want+' bags')&&/2024/.test(h),h);
const tr=await p.evaluate(()=>{const s=cabStats();return [s.bags,BEANS.length]});ok('trophy counts bags',tr[0]>tr[1],tr);ok('no errors',!errs.length,errs);await b.close()})()
