// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(x!==undefined?'  ('+JSON.stringify(x)+')':''));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const state=()=>p.evaluate(()=>({RF,RSORT,RSORT2,LF:{sort:LF.sort,min:LF.min},GF,GLF,VF,CHF,BSORT,BYEAR,BF,DYF}));
// Pick something in every list, through each list's own drawing
await p.evaluate(()=>{const fam=Object.keys(FAM)[1],ty=[...new Set(Object.values(BREWERS).map(b=>b.type))][1],comp=Object.keys(COMPS)[0];
  RF=['champ'];renderRecipes();RSORT='az';RSORT2='quick';saveRSort();LF.sort='top';LF.min=3;saveLF();
  showTab('gear');GF=[ty];renderGearBrewers();GLF=['electric'];renderLibrary();showTab('variety');VF=[fam];renderVarieties();showTab('champs');CHF=[comp];renderChamps();
  showTab('beans');BSORT='roaster';BF=[];BYEAR=[String(new Date().getFullYear())];renderBeanSort()});
await p.waitForTimeout(400);
await p.evaluate(()=>{BVIEW='diary';renderBeanViews()});await p.waitForTimeout(600);
const dyOpt=await p.evaluate(()=>{const fs=document.querySelector('#bv-diary')?1:0;return fs});
await p.evaluate(()=>{if(typeof renderDiaryView==='function'){DYF=['opened'];renderDiaryView()}});await p.waitForTimeout(300);
const before=await state();console.log('picked',JSON.stringify(before));
await p.reload();await p.waitForTimeout(1500);
// lists that sanitise on draw get drawn once
await p.evaluate(()=>{showTab('recipes');showTab('gear');showTab('variety');showTab('champs');showTab('beans')});await p.waitForTimeout(800);
const kept=await state();
for(const k of Object.keys(before))ok('kept after closing: '+k,JSON.stringify(kept[k])===JSON.stringify(before[k]),{before:before[k],after:kept[k]});
// Settings row, then reset mode
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(600);
ok('Settings has the Sorts and filters choice',await p.evaluate(()=>!!document.querySelector('#st-views [data-v="reset"]')));
await p.click('#st-views [data-v="reset"]');await p.waitForTimeout(400);
await p.reload();await p.waitForTimeout(1500);await p.evaluate(()=>{showTab('recipes');showTab('gear');showTab('variety');showTab('champs');showTab('beans')});await p.waitForTimeout(800);
const reset=await state();
const def={RF:[],RSORT:'brewer',RSORT2:'level',LF:{sort:'new',min:0},GF:[],GLF:[],VF:[],CHF:[],BSORT:'recent',BYEAR:[],BF:[],DYF:[]};
for(const k of Object.keys(def))ok('reset on open: '+k,JSON.stringify(reset[k])===JSON.stringify(def[k]),reset[k]);
// back to keep: picks made now are kept again
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(500);await p.click('#st-views [data-v="keep"]');await p.waitForTimeout(300);
await p.evaluate(()=>{showTab('beans');BSORT='origin';renderBeanSort()});await p.reload();await p.waitForTimeout(1500);
ok('switched back to keep: new pick kept',await p.evaluate(()=>BSORT)==='origin');
ok('no errors',!errs.length,errs);await b.close()})();
