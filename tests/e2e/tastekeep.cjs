// "How did it taste?" stays with the brew: saved on the entry (from the tick and from the log form), shown on its card,
// and the next time you pick that coffee on the Brew page, a note says its grind and water were moved for it (once).
{const o=require('path').join(__dirname,'out');require('fs').mkdirSync(o,{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
const brew=async()=>{await p.evaluate(()=>{const bn=BEANS[0];useBean(bn);goTab('dial');S.rec=RECIPES.findIndex(r=>r.name==='Tetsu Kasuya 4:6');render();dialTimer()});await p.waitForTimeout(500);
  await p.evaluate(()=>{$('tm-go').click();TM.t0=performance.now()-90000;finishBrew()});await p.waitForTimeout(400)};
// 1. Tick: rating + Sour.
await brew();await p.evaluate(()=>{document.querySelector('.tm-qstars [data-qs="3"]').click();document.querySelector('.tm-tseg [data-tt="sour"]').click();$('tm-skip').click()});await p.waitForTimeout(500);
const a=await p.evaluate(()=>{renderLogList(true);const card=document.querySelector('#l-list .logentry .le-pred');return{taste:LOG[0].taste,card:card&&card.textContent}});
ok('the tick saves how it tasted with the brew',a.taste==='sour',a);ok('…and its card says so',/Tasted Sour/.test(a.card||''),a.card);
// 2. Log this brew (the form): Bitter.
await brew();await p.evaluate(()=>{document.querySelector('.tm-tseg [data-tt="bitter"]').click();TM.log()});await p.waitForTimeout(900);
await p.evaluate(()=>{$('l-coffee').value=$('l-coffee').value||'Form coffee';$('l-save').click()});await p.waitForTimeout(400);
ok('the log form saves it too',await p.evaluate(()=>LOG[0].taste)==='bitter',await p.evaluate(()=>LOG[0].taste));
// 3. Picking that coffee again: a note, once.
await p.evaluate(()=>{const x=DIALNEXT[BEANS[0].id];const set=o=>{if(o){o.taste='sour';delete o.told}};set(x);if(x&&x.by)Object.values(x.by).forEach(set);save('bb-dialnext',DIALNEXT);$('toast').textContent=''});
// (A note shown while another toast with a button is up waits its turn behind it.)
const said=()=>$('toast').textContent+' '+(typeof toastQ!=='undefined'&&toastQ?JSON.stringify(toastQ):'');
const t1=await p.evaluate(async s=>{useBean(BEANS[0]);await new Promise(r=>setTimeout(r,100));return eval('('+s+')')()},said.toString());
const t2=await p.evaluate(async s=>{$('toast').textContent='';try{toastQ=null}catch(e){}useBean(BEANS[0]);await new Promise(r=>setTimeout(r,100));return eval('('+s+')')()},said.toString());
ok('picking the coffee again says why its grind moved',/tasted sour/i.test(t1),t1);ok('…only the first time',!/tasted/i.test(t2),t2);
ok('no page errors',!errs.length,errs);await b.close()})();
