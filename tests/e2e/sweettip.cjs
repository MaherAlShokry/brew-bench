// The sweet-spot tip: never asks for water hotter than 96°C or more than 3°C away, and each option it offers lands in the sweet spot.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:900}});await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const save=JSON.stringify(S);const out=[],bad=[];let n=0;
 for(const br of ['v60','kalitawave','chemex','aeropress','frenchpress'].filter(k=>BREWERS[k]))for(const g of ['zp6','kultra'].filter(k=>GRINDERS[k]))for(const ro of ['light','medium','dark'])for(const pr of ['washed','natural','anaerobicnatural'].filter(k=>PROCESSES[k]))for(const tt of [88,93,96]){
  Object.assign(S,JSON.parse(save),{brewer:br,grinder:g,roast:ro,process:pr,temp:Math.min(tt,BREWERS[br].temp.max),rec:null});const bx=baseX(g,br);if(bx==null)continue;S.setting=roundG(g,bx);render();n++;
  const tip=[...document.querySelectorAll('#o-tips *')].map(x=>x.textContent).find(t=>/sweet spot|end of its range/.test(t)&&t.length<400)||'';if(!tip)continue;
  const temps=[...tip.matchAll(/(\d+)°C/g)].map(m=>+m[1]);for(const T of temps){if(T>96&&T>S.temp)bad.push(['hot',br,g,ro,pr,tt,tip]);if(Math.abs(T-S.temp)>3)bad.push(['far',br,g,ro,pr,tt,tip])}
  // check each offered option lands within the sweet spot
  const D0=compute(S).D;const opts=[];const m1=/sweet spot, try/.test(tip)?tip.match(/try (.+?) \(/):null;const m2=/sweet spot/.test(tip)?tip.match(/\(([^()]+)\) with water at (\d+)/):null;const m3=tip.match(/keep the grind (?:and use )?with water at (\d+)|keep the grind and use water at (\d+)/);if(m3)m3[1]=m3[1]||m3[2];
  const check=(set,temp)=>{const st=Object.assign({},S,{setting:set,temp});return compute(st).D};
  const parse=lab=>{for(let x=-60;x<=200;x+=0.5){const v=roundG(g,x);if(gLabel(g,v)===lab)return v}return null};
  if(m1){const v=parse(m1[1]);if(v!=null){const D=check(v,S.temp);if(Math.abs(D)>0.45)bad.push(['grind misses',br,g,ro,pr,tt,D.toFixed(2),tip])}}
  if(m3){const D=check(S.setting,+m3[1]);if(Math.abs(D)>0.45)bad.push(['water misses',br,g,ro,pr,tt,D.toFixed(2),tip])}
  if(m2){const v=parse(m2[1]);if(v!=null){const D=check(v,+m2[2]);if(Math.abs(D)>0.45)bad.push(['combo misses',br,g,ro,pr,tt,D.toFixed(2),tip])}}
  if(out.length<4||/closer/.test(tip)&&out.length<8)out.push(tip)}
 Object.assign(S,JSON.parse(save));render();return {n,out,bad:bad.slice(0,6),nb:bad.length}});
console.log(r.n+' setups; problems: '+r.nb);console.log(r.out.join('\n'));if(r.nb)console.log(JSON.stringify(r.bad,null,1));await b.close()})();
