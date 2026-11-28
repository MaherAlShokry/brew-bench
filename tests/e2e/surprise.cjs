// Surprise me / Make a recipe: the recipe is there at once and is made again the moment a pick changes (no "create"
// step, no stray link); each row (coffee, brewer, cup) has a lock and Shuffle redraws only the unlocked rows; the
// actions are Brew it / Save and brew it and Shuffle (Another version when you picked yourself), and either opens the recipe.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),Q=s=>document.querySelector('dialog[open] '+s),QA=s=>[...document.querySelectorAll('dialog[open] '+s)];
  const pick=k=>(Q('[data-mk="'+k+'"][aria-pressed="true"]')||{dataset:{}}).dataset.v,name=()=>(Q('.mk-ht b')||{}).textContent;
  goTab('recipes');openMakeRecipe(null,true);await w(500);
  const o={atOnce:!!name(),noCreate:!Q('#mk-go')&&!Q('#mk-rand')&&!QA('.btn').length,locks:QA('[data-lock]').map(l=>l.dataset.lock),
    locksIn:QA('[data-lock]').every(l=>{const r=l.getBoundingClientRect();return r.right<=innerWidth&&r.width>0}),acts:QA('.sheet-acts button').map(b=>b.id),
    line:(Q('.mk-ht span')||{}).textContent};
  // Tapping a chip makes the recipe again right away, the sheet keeping its place.
  const d=$('vd');d.scrollTop=40;const before=name(),other=QA('[data-mk="goal"]').find(c=>c.getAttribute('aria-pressed')!=='true');other.click();await w(150);
  o.chip={changed:name()!==before||pick('goal')===other.dataset.v,goal:pick('goal')===other.dataset.v,keptScroll:d.scrollTop===40};
  // Lock brewer and cup: Shuffle changes only the coffee.
  Q('[data-lock="b"]').click();Q('[data-lock="goal"]').click();const b0=pick('b'),g0=pick('goal'),beans=new Set();
  for(let i=0;i<6;i++){$('mk-again').click();await w(120);beans.add(pick('bean'));if(pick('b')!==b0||pick('goal')!==g0){o.brokeLock=true;break}}
  o.shuffle={beans:beans.size,lockedPressed:Q('[data-lock="b"]').getAttribute('aria-pressed')};
  // Save opens the saved recipe.
  // One of the brewer's own recipes (Brew it) opens that recipe and adds nothing; a recipe made here (Save and brew it) is saved and opened.
  const n=RECIPES.length,shown=name(),lib=/^Brew it$/.test($('mk-save').textContent.trim());$('mk-save').click();await w(500);const tt=(document.querySelector('dialog[open] #vd-title')||{}).textContent;
  o.saved=lib?RECIPES.length===n&&tt===shown:RECIPES.length===n+1&&tt===RECIPES[RECIPES.length-1].name;o.lib=lib;
  document.querySelectorAll('dialog[open]').forEach(x=>x.close());
  // Make a recipe for a coffee: no locks, "Another version", instant too.
  openMakeRecipe(BEANS[1].id);await w(400);o.make={atOnce:!!name(),locks:QA('[data-lock]').length,again:$('mk-again').getAttribute('aria-label'),bean:pick('bean')===BEANS[1].id};
  document.querySelectorAll('dialog[open]').forEach(x=>x.close());return o});
ok('Surprise me shows a recipe at once, with no create button or link',r.atOnce&&r.noCreate,r);
ok('each row has a lock, on screen',JSON.stringify(r.locks)==='["bean","b","goal"]'&&r.locksIn,r.locks);
ok('the actions are Save and brew it and Shuffle, in the floating bar',JSON.stringify(r.acts)==='["mk-save","mk-again"]',r.acts);
ok('the summary names the coffee, brewer and cup',/·.*·/.test(r.line||''),r.line);
ok('a chip makes the recipe again at once, keeping the sheet\'s place',r.chip.goal&&r.chip.keptScroll,r.chip);
ok('Shuffle with brewer and cup locked changes only the coffee',!r.brokeLock&&r.shuffle.beans>1&&r.shuffle.lockedPressed==='true',r.shuffle);
ok('Brew it opens the recipe shown (Save and brew it saves a made one first)',r.saved,{lib:r.lib});
ok('Make a recipe for a coffee: instant, no locks, Another version',r.make.atOnce&&r.make.locks===0&&r.make.again==='Another version'&&r.make.bean,r.make);
ok('no page errors',!errs.length,errs);await b.close()})();
