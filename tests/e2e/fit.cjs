// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const out=[];const ri=RECIPES.findIndex(r=>r.name==='Tetsu Kasuya 4:6');
 for(const [g] of GOALS){Object.assign(S,{brewer:'v60',grinder:'zp6',rec:ri,goal:g,amt:'mid',process:'washed',variety:'caturra',roast:'medium',age:14});tune();
  const f0=cupFit();const base={setting:S.setting,temp:S.temp,ratio:S.ratio};const row=[g+': at plan '+f0.state+' '+Math.round(f0.score*100)];
  for(const [lab,ch] of [['grind 7 finer',()=>S.setting=base.setting-7],['grind 15 finer',()=>S.setting=base.setting-15],['grind 15 coarser',()=>S.setting=base.setting+15],['+3°C',()=>S.temp=base.temp+3],['-3°C',()=>S.temp=base.temp-3],['ratio -2',()=>S.ratio=base.ratio-2],['ratio +2',()=>S.ratio=base.ratio+2]]){
   Object.assign(S,base);ch();const f=cupFit();row.push(lab+' → '+f.state+' '+Math.round(f.score*100)+(f.state!=='on'?' (near '+f.near+')':''))}
  Object.assign(S,base);out.push(row.join(' | '))}
 return out.join('\n')}));await b.close()})();
