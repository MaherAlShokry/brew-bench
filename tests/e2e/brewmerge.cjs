// The NEO is an add-on, not a brewer, and the Switch's full immersion is the Switch: no picker offers the V60 NEO, the
// NEO Switch or "Hario Switch, full immersion"; their recipes are V60 and Switch recipes with the same grind as before;
// the old recipe keys still lead somewhere (the NEO copy of the Kasuya 10-pour to the V60 one); your own recipes saved
// for them move over. Surprise me makes a recipe at once, for one of your coffees and brewers, and Another one draws again.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(()=>localStorage.setItem('bb-mybrewers',JSON.stringify(['v60','neo','swneo','swi'])));await p.reload();await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const opts=[...document.querySelectorAll('#i-brewer option')].map(o=>o.value);
  const idx=n=>RECIPES.findIndex(r=>r.name===n),z=(b,off)=>settingFor('zp6',b,off),k=(b,off)=>settingFor('kultra',b,off);
  const R=n=>RECIPES[idx(n)];
  return{opts,myb:MYB,old:RECIPES.filter(r=>['neo','swneo','swi'].includes(r.b)).map(r=>r.name),
    split:[z('neo',0.3),z('v60',R('Split pour').off),k('neo',0.3),k('v60',R('Split pour').off),R('Split pour').b],
    yuma:[z('neo',0.6),z('v60',R('Yuma Kawano recipe').off),R('Yuma Kawano recipe').b],
    imm:[z('swi',0),z('swi',R('Full immersion').off),k('swi',0),k('swi',R('Full immersion').off),R('Full immersion').b,R('Full immersion').kind],immName:BREWERS[R('Full immersion').b].name,
    keys:[rByKey('r:tetsu-kasuya-10-pour-on-the-neo')===idx('Tetsu Kasuya 10-pour'),rByKey('r:neo-split-pour')===idx('Split pour'),rByKey('r:yuma-kawano-neo-recipe')===idx('Yuma Kawano recipe')],
    mig:[sanRec({name:'Mine',b:'swneo',off:0,steps:['0:00 pour.']}),sanRec({name:'Mine2',b:'neo',off:0.3,steps:['0:00 pour.']})].map(x=>[x.b,+x.off.toFixed(2),x.kind])}});
ok('the Brew page offers no NEO, NEO Switch or full-immersion Switch',!r.opts.some(v=>['neo','swneo','swi'].includes(v))&&r.opts.includes('v60')&&r.opts.includes('sw'),r.opts);
ok('your brewers: the NEO counts as the V60, the NEO Switch and immersion as the Switch',JSON.stringify(r.myb)==='["v60","sw"]',r.myb);
ok('no built-in recipe is for the NEO',!r.old.filter(n=>n!=='Full immersion').length,r.old);
ok('Split pour (was NEO split pour): a V60 recipe, same ZP6 and K-Ultra grind',r.split[4]==='v60'&&Math.abs(r.split[0]-r.split[1])<=1&&Math.abs(r.split[2]-r.split[3])<=1,r.split);
ok('Yuma Kawano recipe: a V60 recipe, same ZP6 grind',r.yuma[2]==='v60'&&Math.abs(r.yuma[0]-r.yuma[1])<=1,r.yuma);
ok('Full immersion: shown as a Hario Switch recipe, grind exactly as before',r.imm[4]==='swi'&&r.imm[5]==='imm'&&r.imm[0]===r.imm[1]&&r.imm[2]===r.imm[3]&&r.immName==='Hario Switch',r.imm);
ok('old recipe keys lead to the merged and renamed recipes',r.keys.every(Boolean),r.keys);
ok('your own NEO Switch and NEO recipes move to the Switch and the V60',JSON.stringify(r.mig)===JSON.stringify([['sw',0.41,'other'],['v60',0.71,'other']]),r.mig);
// Surprise me
await p.evaluate(()=>goTab('recipes'));await p.waitForTimeout(500);
await p.click('#rhome [data-q="surprise"]');await p.waitForTimeout(1200);
const s1=await p.evaluate(()=>({res:!!document.querySelector('dialog[open] .mk-res'),name:(document.querySelector('dialog[open] .mk-res b')||{}).textContent||'',pill:(document.querySelector('dialog[open] .vd-head .pill')||{}).textContent,
  brewers:[...document.querySelectorAll('dialog[open] [data-mk="b"]')].map(x=>x.dataset.v),picked:[...document.querySelectorAll('dialog[open] [data-mk][aria-pressed="true"]')].map(x=>x.dataset.mk)}));
ok('Surprise me shows a recipe at once',s1.res&&s1.name&&/Surprise/.test(s1.pill),s1);
ok('a coffee, a brewer and a cup are picked and shown',['bean','b','goal'].every(k=>s1.picked.includes(k)),s1.picked);
ok('the brewers on offer are your own, with no duplicates or NEO',JSON.stringify(s1.brewers)===JSON.stringify([...new Set(s1.brewers)])&&s1.brewers.includes('sw')&&!s1.brewers.some(v=>['neo','swneo','swi','switch'].includes(v)),s1.brewers);
let changed=false;for(let i=0;i<5&&!changed;i++){await p.click('dialog[open] #mk-again');await p.waitForTimeout(500);changed=await p.evaluate(n=>(document.querySelector('dialog[open] .mk-res b')||{}).textContent!==n,s1.name)}
ok('Another one draws a different recipe',changed);
ok('no page errors',!errs.length,errs);await b.close()})();
