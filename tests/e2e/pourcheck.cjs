// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Pours add up everywhere a recipe's steps are shown: each recipe as written, sized to other doses, and the dial-in's
// plan (what Brew, the timer and the brew card use) for every cup target, at awkward doses and ratios. In each list,
// "pour Xg (to Yg)" pours what takes the scale from the last total to Y, totals never go back down, and the last total
// is the water.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
const R=await p.evaluate(()=>{const F=[];let lists=0;
  const RE=/(\d+(?:\.\d+)?)\s?g\s*\(to\s+(\d+(?:\.\d+)?)\s?g\)|\b(?:to|until)\s+(\d+(?:\.\d+)?)\s?g\b|\bpour\s+(\d+(?:\.\d+)?)\s?g\b(?!\s*\(to)/gi;
  // Grams of coffee ("add 16g of coffee") and rates aren't water on the scale.
  const notWater=(x,i,len)=>/^\s*(?:of\s+)?(?:ground\s+|fresh\s+)?(?:coffee|grounds)\b|^\s*(?:of\s+)?(?:\w+\s+)?(?:per|a|\/)\s*(?:litre|liter|l)\b/i.test(x.slice(i+len,i+len+30));
  const check=(where,steps,water,full)=>{lists++;let lvl=null,last=null,prev=-1;
    steps.forEach(s=>{const x=String(s);for(const m of x.matchAll(RE)){if(notWater(x,m.index,m[0].length))continue;
      if(m[2]!=null){const to=+m[2];if(lvl!=null&&Math.abs(to-lvl-m[1])>0.05)F.push(where+': '+x+' (from '+lvl+'g)');lvl=to}
      else if(m[3]!=null)lvl=+m[3];else lvl=(lvl||0)+ +m[4];
      if(lvl!=null){if(lvl<prev-0.05&&m[3]==null)F.push(where+': goes back down at '+x);prev=Math.max(prev,lvl);last=lvl}}});
    return last};
  const asW=new Map();
  RECIPES.forEach((r,i)=>{const last=check('as written '+r.name,r.steps,r.water);asW.set(i,last!=null&&Math.abs(last-r.water)<0.6)});
  RECIPES.forEach((r,i)=>{for(const k of [0.8,1.013,1.21,1.37]){const d=Math.round(r.dose*k*10)/10,w=Math.round(r.water*k);const last=check('scaled '+r.name+' '+d+'/'+w,scaleSteps(r,d,w),w);
    if(asW.get(i)&&last!=null&&Math.abs(last-w)>0.6)F.push('scaled '+r.name+' '+d+'/'+w+': ends at '+last+'g, not '+w+'g')}});
  // The dial-in, as Brew shows it.
  const keep=JSON.stringify(S);let plans=0;
  RECIPES.forEach((r,i)=>{if(!BREWERS[r.b]||!BREWERS[r.b].model)return;for(const [dose,ratio] of [[20,15.2],[13.5,16.3],[18,14.7]])for(const goal of Object.keys(GSPEC)){
    try{S.brewer=r.b;S.rec=i;S.dose=dose;S.ratio=ratio;S.goal=goal;const dp=dialPlan();if(!dp)continue;plans++;const last=check('dial '+r.name+' '+dose+'g 1:'+ratio+' '+goal,dp.steps,dp.water);
      if(asW.get(i)&&last!=null&&Math.abs(last-dp.water)>0.6)F.push('dial '+r.name+' '+dose+'g '+goal+': ends at '+last+'g, not '+dp.water+'g')}catch(e){F.push('dial '+r.name+': '+e.message)}}});
  Object.assign(S,JSON.parse(keep));
  // A brew logged before the fix, with the old steps saved in it: its brew card reads right.
  const r10=RECIPES.find(r=>/10-pour/.test(r.name)),old=['0:00 pour 30g at 92°C, bloom.','0:55 pour 30g (to 61g).','1:10 pour 30g (to 91g).','1:25 pour 30g (to 122g).','1:40 pour 30g (to 152g).','3:25 drawdown finishes, remove the dripper.'];
  if(r10){const m=logModel({coffee:'Old brew',date:'2026-11-01',stars:4,snap:{rec:r10.name,b:r10.b,dose:20,water:304,t:92,steps:old}});check('old logged brew card',m.steps||[],304);
    if(!(m.steps||[]).some(x=>/pour 31g \(to 61g\)/.test(x)))F.push('old logged brew card: steps not corrected '+JSON.stringify(m.steps))}else F.push('no 10-pour recipe to test with');
  return{F,lists,plans}});
console.log('step lists checked',R.lists,'| dial plans',R.plans);
if(R.F.length)console.log('FAIL '+R.F.length+' problems:\n  '+[...new Set(R.F)].slice(0,40).join('\n  '));else console.log('ok   pours add up everywhere');
if(errs.length)console.log('FAIL errors',errs);await b.close()})();
