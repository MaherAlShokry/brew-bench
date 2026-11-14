// What you tap is what you get: no two entries in a searchable list (notes, words, recipes, processes, varieties,
// origins, brewers, grinders, roasteries) can be confused once case, accents or spaces are set aside, unless they are
// really different and the app keeps them apart (Rosé the wine, Rose the flower); and a dropdown sets the exact option
// tapped, even if two options share a value.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(1200);
for(const t of ['words','recipes','process','variety','map','gear'])await p.evaluate(t=>goTab(t),t),await p.waitForTimeout(250);
const d=await p.evaluate(()=>{const out={},KEEP=new Set(['Rose|Rosé']);
  const N={fold:x=>fold(x).trim(),slug:x=>slug(x),alnum:x=>fold(x).replace(/[^a-z0-9]/g,'')};
  const chk=(name,list)=>{list=[...new Set(list.filter(x=>typeof x==='string'&&x))];for(const[k,f]of Object.entries(N)){const m={};for(const x of list)(m[f(x)]=m[f(x)]||[]).push(x);
    for(const s of Object.values(m))if(s.length>1&&!KEEP.has(s.slice().sort().join('|')))(out[name]=out[name]||[]).push(s.join(' / '))}};
  chk('words',GLOSSARY.map(g=>g[0]));chk('recipes',RECIPES.map(r=>r.name));chk('processes',Object.values(PROCESSES).map(x=>x.name));
  chk('varieties',V.flatMap(v=>[v.name,...(v.subs||[]).map(s=>s.name)]));chk('origins',Object.values(ALLO()).map(o=>o.name));
  chk('brewers',Object.values(BREWERS).map(x=>x.name));chk('grinders',Object.values(GRINDERS).map(g=>g.name));chk('roasteries',ROASTERS.map(r=>r.split('|')[0]));
  chk('notes',tnNotes().map(n=>n.n));return out});
ok('no two names in any list can be mixed up',!Object.keys(d).length,d);
// Notes that differ only by an accent each resolve to themselves; typing without accents still finds an accented one.
const lf=await p.evaluate(()=>[tnLeaf('Rose').n,tnLeaf('Rosé').n,tnLeaf('rose').n,(tnLeaf('creme brulee')||{}).n||tnNotes().find(n=>fold(n.n)!==n.n.toLowerCase()&&n.n!=='Rosé')&&tnLeaf(fold(tnNotes().find(n=>fold(n.n)!==n.n.toLowerCase()&&n.n!=='Rosé').n)).n]);
ok('each note resolves to itself, and accent-free typing still finds accented notes',lf[0]==='Rose'&&lf[1]==='Rosé'&&lf[2]==='Rose'&&!!lf[3],lf);
// A dropdown with two options sharing a value: tapping the second selects the second.
await p.evaluate(()=>{const s=document.createElement('select');s.id='dup-sel';s.innerHTML='<option value="">Pick</option><option value="x">First</option><option value="x">Second</option>';document.querySelector('#settings').appendChild(s);goTab('settings')});
await p.waitForTimeout(300);await p.evaluate(()=>{const s=$('dup-sel');s.scrollIntoView();openSelectNow(s)});await p.waitForTimeout(400);
await p.tap('#selsheet .selopt:has-text("Second")');await p.waitForTimeout(300);
const si=await p.evaluate(()=>$('dup-sel').selectedIndex);ok('a dropdown sets the exact option tapped',si===2,si);
ok('no errors',!errs.length,errs);await b.close()})();
