// The Brew page plans the same water as the recipe page, to the gram, for every recipe and any dose (the ratio isn't
// rounded on the way, and 237.4999… from floating point is 238 like the recipe page's 15 × 190 / 12).
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const bad=[];let n=0;RECIPES.forEach((r,i)=>{if(!BREWERS[r.b]||!BREWERS[r.b].model)return;
  for(const d of [r.dose,10,12,15,18,20,30]){loadRecipe(i);S.goal='balance';S.dose=d;tune();const dp=dialPlan();if(!dp)continue;n++;
    const want=Math.round(d*r.water/r.dose);if(dp.water!==want)bad.push(r.name+' '+d+'g: '+dp.water+' vs '+want)}});
  const deep=RECIPES.findIndex(r=>r.name==='Deep 27 five pours');loadRecipe(deep);S.dose=10;tune();
  return{n,bad,deep:dialPlan().water,shown:$('v-ratio').textContent}});
ok('every recipe at every dose: Brew page water = recipe page water',r.n>300&&!r.bad.length,r.bad.slice(0,10));
ok('Deep 27 five pours at 10g plans 153g, ratio shown to one place',r.deep===153&&/^1:\d+(\.\d)?$/.test(r.shown),r);
ok('no page errors',!errs.length,errs);await b.close()})();
