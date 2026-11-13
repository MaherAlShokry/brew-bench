// Output (screenshots, downloads) goes to tests/e2e/out, wherever this is run from.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
// Drag each dial-in slider through its range: which blocks change height (and push the page around)?
const {chromium}=require('playwright');const demo=require('./seed2.cjs');(async()=>{const b=await chromium.launch();
 for(const W of [390,360]){const c=await b.newContext({viewport:{width:W,height:844},serviceWorkers:'block'});await c.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1')});const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
  await p.goto('http://localhost:8099/index.html');await p.evaluate(demo);await p.reload();await p.waitForTimeout(600);await p.evaluate(()=>{loadRecipe(RECIPES.findIndex(r=>r.b==='neo'));showTab('dial')});await p.waitForTimeout(400);
  const r=await p.evaluate(async()=>{const sec=$('dial');const blocks=()=>[...sec.querySelectorAll('[id]')].filter(e=>e.offsetParent&&!e.closest('input')).map(e=>[e.id,Math.round(e.getBoundingClientRect().height)]);
   const ranges=[...sec.querySelectorAll('input[type=range]')].filter(x=>x.offsetParent);const out={};
   for(const rg of ranges){const base=Object.fromEntries(blocks());const min=+rg.min,max=+rg.max,st=(max-min)/24,orig=rg.value;const seen={};
    for(let v=min;v<=max;v+=st){rg.value=v;rg.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,0));for(const [id,h] of blocks()){(seen[id]=seen[id]||new Set()).add(h)}}
    rg.value=orig;rg.dispatchEvent(new Event('input',{bubbles:true}));
    out[rg.id]=Object.entries(seen).filter(([id,s])=>s.size>1).map(([id,s])=>id+'('+Math.min(...s)+'-'+Math.max(...s)+')')}
   return out});
  console.log('width',W);for(const [k,v] of Object.entries(r))console.log('  '+k+': '+(v.join(' ')||'stable'));await c.close()}
 await b.close()})();
