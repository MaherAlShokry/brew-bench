// What you saved keeps meaning the same thing after an update: every brewer, grinder, process, variety and recipe key
// the app has saved (tests/e2e/savedkeys.json: today's keys, plus recipe names and brewers from the app's history)
// still leads somewhere, directly or through an alias. Renaming or removing one fails here until an alias is added
// (RALIAS for recipes), the way fwids.json guards the flavour notes. A coffee saved with any process and variety keeps
// them when the app loads it.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const K=require('./savedkeys.json');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
const lost=await p.evaluate(K=>({brewers:K.brewers.filter(k=>!BREWERS[k]),grinders:K.grinders.filter(k=>!GRINDERS[k]),processes:K.processes.filter(k=>!PROCESSES[k]),
  varieties:K.varieties.filter(k=>!vById(k)),recipes:K.recipes.filter(k=>rByKey(k)<0)}),K);
for(const k of Object.keys(lost))ok('all '+K[k].length+' saved '+k+' keys still lead somewhere',!lost[k].length,lost[k].slice(0,10));
// Coffees saved with every process and variety come back with them.
await p.evaluate(K=>{const bs=K.processes.map((pr,i)=>({id:'keyt'+i,name:'K '+i,roaster:'R',origin:'ethiopia',process:pr,variety:K.varieties[i%K.varieties.length],rating:0,ts:Date.now()-i}));
  localStorage.setItem('bb-beans',JSON.stringify(bs))},K);
await p.reload();await p.waitForTimeout(1500);
const kept=await p.evaluate(K=>{const bad=[];K.processes.forEach((pr,i)=>{const b=beanById('keyt'+i);if(!b||b.process!==pr||b.variety!==K.varieties[i%K.varieties.length])bad.push(pr)});return bad},K);
ok('coffees keep their process and variety when loaded',!kept.length,kept.slice(0,10));
ok('no page errors',!errs.length,errs);await b.close()})();
