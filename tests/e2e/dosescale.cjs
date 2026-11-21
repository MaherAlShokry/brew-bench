// A recipe brewed at another size: in a dripper, less coffee grinds a little finer and the pours after the bloom come
// a little sooner (more coffee: coarser and later); the bloom keeps its time; a press, the AeroPress and Kasuya's 4:6
// timings stay. The same on the Brew page, on the recipe page's scaler and in the timer it starts.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const R=n=>RECIPES.findIndex(r=>r.name===n),secs=s=>{const m=/^\s*(\d+):(\d\d)/.exec(s);return m?+m[1]*60+ +m[2]:null};
  const at=(n,d,g)=>{loadRecipe(R(n));S.grinder=g||'zp6';S.goal='balance';S.dose=d;tune();const dp=dialPlan();return{set:S.setting,steps:dp.steps,water:dp.water,why:plan(dialCtx()).why.join(' '),total:clockTotal(dp.steps)}};
  const rao=[at('Rao-style V60',20),at('Rao-style V60',15),at('Rao-style V60',30)],kul=[at('Rao-style V60',20,'kultra'),at('Rao-style V60',15,'kultra')];
  const deep=[at('Deep 27 five pours',15),at('Deep 27 five pours',10)],k46=[at('Tetsu Kasuya 4:6',20),at('Tetsu Kasuya 4:6',15)],press=[at('Classic 4-minute press',30),at('Classic 4-minute press',15)];
  return{rao:rao.map(x=>x.set),kul:kul.map(x=>x.set),why:rao[1].why,
    bloom:[secs(rao[0].steps[1]),secs(rao[1].steps[1]),secs(rao[2].steps[1])],end:rao.map(x=>x.total),
    deep:deep.map(x=>[x.set,x.total,secs(x.steps[1])]),k46:k46.map(x=>[x.set,x.steps.map(secs).join()]),press:press.map(x=>[x.set,x.steps.map(secs).join()])}});
ok('less coffee in a dripper grinds finer, more grinds coarser (ZP6)',r.rao[1]<r.rao[0]&&r.rao[2]>r.rao[0]&&r.rao[0]-r.rao[1]<=3,r.rao);
ok('and on the K-Ultra',r.kul[1]<r.kul[0],r.kul);
ok('the Brew page says why',/Less coffee than the recipe.s 20g: grind a little finer/.test(r.why),r.why);
ok('the bloom keeps its time; the pours after it come sooner for less, later for more',r.bloom[0]===r.bloom[1]&&r.bloom[1]===r.bloom[2]&&r.end[1]<r.end[0]&&r.end[2]>r.end[0],{bloom:r.bloom,end:r.end});
ok('Deep 27 at 10g: finer and shorter, bloom kept',r.deep[1][0]<r.deep[0][0]&&r.deep[1][1]<r.deep[0][1]&&r.deep[1][2]===r.deep[0][2],r.deep);
ok('Kasuya 4:6 at 15g: finer, its timings kept',r.k46[1][0]<r.k46[0][0]&&r.k46[1][1]===r.k46[0][1],r.k46);
ok('a French press keeps its grind and steep at any dose',r.press[0][0]===r.press[1][0]&&r.press[0][1]===r.press[1][1],r.press);
// The recipe page's scaler: the grind under it and the steps follow, and its timer gets both.
const s=await p.evaluate(async()=>{const i=RECIPES.findIndex(r=>r.name==='Rao-style V60');openRecipe(i);await new Promise(r=>setTimeout(r,500));
  const read=()=>({g:[...document.querySelectorAll('dialog[open] #rs-body .gchip, dialog[open] #rs-body [class*="grind"] span')].map(e=>e.textContent).join('|')||document.querySelector('dialog[open] #rs-body').textContent.match(/ZP6[^|]{0,20}/)[0],
    t:[...document.querySelectorAll('dialog[open] #rs-body .steps .t')].map(e=>e.textContent).join(',')});
  const a=read();for(let k=0;k<5;k++)document.querySelector('dialog[open] [data-rsd="-1"]').click();await new Promise(r=>setTimeout(r,200));const c=read();
  document.querySelector('dialog[open] #rs-body [data-timer]').click();await new Promise(r=>setTimeout(r,700));
  const tm={set:TM.p&&TM.p.set,steps:TM.r.steps.map(x=>(x.match(/^\s*\d+:\d\d/)||[''])[0].trim()).join(',')};$('timer').close();
  return{a,c,tm,want:settingFor('zp6','v60',RECIPES[i].off+doseOff(RECIPES[i],15)),base:settingFor('zp6','v60',RECIPES[i].off)}});
ok('the recipe page at 15g shows the finer grind and the sooner pours',s.a.g!==s.c.g&&s.a.t!==s.c.t&&s.want<s.base,s);
ok('its timer starts with that grind and those times',s.tm.set&&s.tm.set.zp6===s.want&&s.tm.steps===s.c.t,s.tm);
ok('no page errors',!errs.length,errs);await b.close()})();
