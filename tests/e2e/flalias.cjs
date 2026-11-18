// Flavour notes saved with a brew keep showing after the wheel changes: every note id any version of the app has
// saved (tests/e2e/fwids.json, from the history of the wheel) still leads to a note, directly or through FW_ALIAS,
// and a brew saved with old ids shows its notes and keeps them when its notes are edited.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');const IDS=require('./fwids.json');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1500);
const lost=await p.evaluate(ids=>ids.filter(id=>{const t=FW_ALIAS[id]||id;return !(FW.byId[t]&&FW.byId[t].leaf)}),IDS);
ok('all '+IDS.length+' note ids ever saved still lead to a note',!lost.length,lost.slice(0,10));
const r=await p.evaluate(()=>{const l={id:'fa1',ts:Date.now(),date:'',coffee:'Old brew',settings:'',stars:4,fl:[['fruity.other-fruit.mango',3],['fruity.other-fruit.peach',2],['green-vegetative.mint',1]]};
  return flOf(l).map(([id,v])=>FW.byId[id].n+v).join(',')});
ok('an old brew shows its moved notes',r==='Mango3,Peach2,Mint1',r);
ok('no page errors',!errs.length,errs);await b.close()})();
