// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// The 10-pour across coffees: never more than about one step coarser than the 4:6 on the same coffee.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(700);
console.log(await p.evaluate(()=>{const i46=RECIPES.findIndex(r=>r.name==='Tetsu Kasuya 4:6'),i10=RECIPES.findIndex(r=>r.name==='Tetsu Kasuya 10-pour');const rows=[];let worst=0;
 for(const ro of ['light','medium','dark'])for(const pr of ['washed','natural','anaerobicnatural'])for(const g of ['zp6','kultra']){const c={brewer:'v60',grinder:g,process:pr,variety:'caturra',roast:ro,age:14,goal:'balance'};
  const a=plan(Object.assign({},c,{tech:i46})).st.setting,t=plan(Object.assign({},c,{tech:i10})).st.setting;const st=stepsBetween(g,a,t);worst=Math.max(worst,Math.abs(st));window.__m=Math.min(window.__m??9,st);window.__M=Math.max(window.__M??-9,st);
  if(g==='zp6'||ro==='medium')rows.push(ro+' '+pr+' '+g+': 4:6 '+gLabel(g,a)+'  10-pour '+gLabel(g,t))}
 return rows.join('\n')+'\n10-pour vs 4:6 in steps (+ = coarser): '+window.__m.toFixed(2)+' to '+window.__M.toFixed(2)}));await b.close()})();
