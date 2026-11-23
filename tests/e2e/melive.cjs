// The profile stays live: a brew logged or a coffee changed while it is open redraws it in place (keeping the scroll),
// and never wipes the profile editor.
{const o=require('path').join(__dirname,'out');require('fs').mkdirSync(o,{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
const cups=()=>p.evaluate(()=>{const m=$('vd-in').textContent.match(/over (\d+) cups/);return m&&+m[1]});
await p.evaluate(()=>openMe());await p.waitForTimeout(600);await p.evaluate(()=>{$('vd').scrollTop=300});
const a=await cups(),y0=await p.evaluate(()=>$('vd').scrollTop);
await p.evaluate(()=>{for(let i=0;i<2;i++){LOG.unshift({id:uid(),ts:Date.now(),date:'',coffee:beanTitle(BEANS[0]),beanId:BEANS[0].id,settings:'',stars:4,pred:'',notes:'',brewer:'v60'});save('bb-log',LOG)}});
await p.waitForTimeout(400);const c=await cups(),y1=await p.evaluate(()=>$('vd').scrollTop);
ok('a brew logged while the profile is open shows on it at once, scroll kept',a&&c===a+2&&Math.abs(y1-y0)<2,{a,c,y0,y1});
const ed=await p.evaluate(async()=>{document.querySelector('#pf-edit').click();await new Promise(r=>setTimeout(r,300));const before=$('vd-in').innerHTML;
  LOG.unshift({id:uid(),ts:Date.now(),date:'',coffee:'X',settings:'',stars:3,pred:'',notes:'',brewer:'v60'});save('bb-log',LOG);saveBeans();
  await new Promise(r=>setTimeout(r,400));return $('vd-in').innerHTML===before});
ok('the profile editor is never redrawn under you',ed);
ok('no page errors',!errs.length,errs);await b.close()})();
