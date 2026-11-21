// Pour-overs never ask for a coarser grind than ZP6 7.0 (70 clicks), and only the ZP6 is held: the K-Ultra keeps the
// grind the coffee asks for (it used to be pulled finer along with the ZP6): every recipe for a dripper, Switch or Clever,
// with every target, strength, roast and process, on the dial-in and on the recipe page. French press and cold brew
// still go coarser.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const bad=[];let n=0;const T=['Cone dripper','Flat-bottom dripper','Valve and hybrid'];
  RECIPES.forEach((rc,i)=>{if(!T.includes(BREWERS[rc.b].type))return;const v=settingFor('zp6',rc.b,rc.off);if(v!=null&&v>70)bad.push(['page',rc.name,v]);
    for(const goal of Object.keys(GSPEC))for(const amt of ['mid','high'])for(const roast of ['light','dark'])for(const process of ['washed','natural','anaerobic','coldferment']){
      const pl=plan({brewer:rc.b,tech:i,goal,amt,roast,process,variety:'caturra',age:14,grinder:'zp6',dose:rc.dose});n++;if(pl.set.zp6!=null&&pl.set.zp6>70)bad.push([rc.name,goal,amt,roast,process,pl.set.zp6])}});
  // Plans where the ZP6 is held at 7.0: the K-Ultra should still be coarser than the ZP6-7.0 size in some of them.
  const match=roundG('kultra',stepsFor('kultra',sizeOf('zp6',70)));let held=0,free=0;
  RECIPES.forEach((rc,i)=>{if(!/10-pour/.test(rc.name))return;for(const process of ['natural','anaerobic','blackhoney'])for(const variety of ['caturra','sl28'])for(const age of [5,14]){
    const pl=plan({brewer:rc.b,tech:i,goal:'balance',amt:'low',roast:'light',process,variety,age,grinder:'zp6',dose:rc.dose});if(pl.set.zp6===70){held++;if(pl.set.kultra>match)free++}}});
  return{bad:bad.slice(0,5),n,fp:settingFor('zp6','frenchpress',0),held,free,match}});
ok('no pour-over plan or recipe page past ZP6 7.0 ('+r.n+' plans)',!r.bad.length,r.bad);
ok('French press still grinds coarser',r.fp>70,r.fp);
ok('10-pour with fruity coffees: where the ZP6 is held at 7.0, the K-Ultra still goes coarser',r.held>0&&r.free>0,r);
ok('no page errors',!errs.length,errs);await b.close()})();
