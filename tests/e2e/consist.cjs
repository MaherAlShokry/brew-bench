// Every origin × process × variety × roast combo: the headline's words match the meters.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(700);
const r=await p.evaluate(()=>{const save=Object.assign({},SC);let n=0,bad=[];const W={Acidity:['soft','mild','bright','lively','sparkling'],Body:[/tea-like/,/a light body/,/round/,/full/,/syrupy/]};
 for(const pr of Object.keys(PROCESSES))for(const v of V.map(x=>x.id))for(const ro of ['light','medium','dark']){Object.assign(SC,{process:pr,variety:v,roast:ro,origin:'colombia'});const x=beanProfile();n++;
  const m=Object.fromEntries(x.meters);if(!x.head.toLowerCase().includes(W.Acidity[m.Acidity-1]+' acidity')||!W.Body[m.Body-1].test(x.head))bad.push([pr,v,ro,x.head,m])}
 Object.assign(SC,save);return {n,bad:bad.slice(0,5),nb:bad.length}});console.log(r.n+' combos, '+r.nb+' mismatches',JSON.stringify(r.bad));await b.close()})();
