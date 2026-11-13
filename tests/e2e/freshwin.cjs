// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();let fails=0;
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(2000);
const r=await p.evaluate(()=>{const d=n=>{const t=new Date(Date.now()-n*864e5);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')};
  const k=(roast,n)=>fresh({roast,roastDate:d(n)}).k,out=[];
  const exp={light:[[6,'rest'],[7,'peak'],[30,'peak'],[31,'good'],[60,'good'],[61,'fade']],medium:[[3,'rest'],[4,'peak'],[21,'peak'],[22,'good'],[45,'good'],[46,'fade']],dark:[[2,'rest'],[3,'peak'],[14,'peak'],[15,'good'],[30,'good'],[31,'fade']],'':[[6,'rest'],[7,'peak'],[60,'good'],[61,'fade']]};
  for(const [ro,l] of Object.entries(exp))for(const [n,e] of l){const g=k(ro,n);out.push([(g===e?'ok   ':'FAIL ')+(ro||'unset')+' day '+n+' → '+g+' (want '+e+')'])}
  return out});
r.forEach(x=>{console.log(x[0]);if(x[0].startsWith('FAIL'))fails++});
for(const ro of ['light','']){await p.evaluate(ro=>{const b=BEANS.find(x=>x.shelf);b.roast=ro;const t=new Date(Date.now()-35*864e5);b.roastDate=t.toISOString().slice(0,10);openBean(b.id)},ro);await p.waitForTimeout(500);
  const el=await p.$('.bd-shelf');await el.screenshot({path:'fresh-'+(ro||'unset')+'.png'});console.log(ro||'unset',await p.evaluate(()=>document.querySelector('.bd-fh').textContent+' | '+document.querySelector('.bd-fw').textContent));await p.evaluate(()=>$('vd').close());await p.waitForTimeout(300)}
console.log('fails',fails);await b.close()})();
