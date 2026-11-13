// A process added to the app is everywhere it should be. Alchemy (Qima's process for Yemeni lots): the processes page,
// the seed-to-cup tree, coffee words, the dial-in's process picker, a scanned label, a coffee's ferment and fruit logic.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1200);
const r=await p.evaluate(async()=>{const o={};const P=PROCESSES.alchemy;o.has=!!P&&P.cat==='ferment'&&!!PCAT[P.cat];
  goTab('process');await new Promise(r=>setTimeout(r,700));o.page=/Alchemy/.test($('process').textContent);
  o.tree=JSON.stringify(FLOW_BRANCH).includes('"alchemy"');
  goTab('words');await new Promise(r=>setTimeout(r,700));o.words=/Alchemy/.test($('words').textContent);
  goTab('dial');await new Promise(r=>setTimeout(r,500));o.picker=!![...document.querySelectorAll('select option')].find(x=>x.value==='alchemy');
  const lab=parseLabel('YEMEN HARAAZ\nProcess: Alchemy\nVariety: Yemenia');o.scan=lab&&lab.process;
  return o});
ok('Alchemy is a fermentation-led process',r.has);ok('on the processes page',r.page);ok('in the seed-to-cup tree',r.tree);ok('in coffee words',r.words);
ok('in the dial-in process picker',r.picker);ok('a label that says Alchemy is read as it',/Alchemy/.test(r.scan||''),r.scan);
ok('no errors',!errs.length,errs);await b.close()})();
