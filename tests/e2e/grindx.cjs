// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Across many coffees, roasts, targets and both grinders: the furthest any recipe goes from its brewer's normal grind.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{let worst=[0,''],n=0,over=0;const procs=['washed','natural','honey','anaerobicnatural','wethulled'].filter(k=>PROCESSES[k]);
 RECIPES.forEach((rc,i)=>{for(const g of ['zp6','kultra'])for(const ro of ['light','medium','dark'])for(const pr of procs)for(const goal of ['balance','sweet','clarity','body'].filter(x=>GSPEC[x])){const x=plan({brewer:rc.b,grinder:g,tech:i,process:pr,variety:'geisha',roast:ro,age:14,goal,amt:'high'});
  const gg=x.st.grinder,bx=baseX(gg,x.st.brewer);if(bx==null||x.st.setting==null)continue;n++;const st=stepsBetween(gg,bx,x.st.setting),lo=Math.min(-1.5,rc.off-1),hi=Math.max(1.5,rc.off+1);
  if(st>hi+0.2||st<lo-0.2)over++;const d=Math.abs(st)-Math.max(Math.abs(lo),Math.abs(hi));if(d>worst[0])worst=[d,rc.name+' '+g+' '+ro+' '+pr+' '+goal+' '+st.toFixed(2)]}});
 return n+' plans; outside the window: '+over+(worst[1]?'; worst: '+worst[1]:'')}));await b.close()})();
