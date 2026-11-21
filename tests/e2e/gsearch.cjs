// Search everything: a round search button in the top bar opens one box across your coffees, recipes, origins,
// varieties, processes and coffee words; names starting with what you typed come first, the match is highlighted, and a
// tap opens it (a sheet, or the page it lives on).
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:360,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1800);
const vis=await p.evaluate(()=>['dial','recipes','beans','explore','settings'].map(t=>{goTab(t);const r=$('ab-search').getBoundingClientRect();return r.width>0&&r.right<=innerWidth}));
ok('the search button is in the top bar on every tab',vis.every(Boolean),vis);
await p.click('#ab-search');await p.waitForTimeout(600);
const s=async q=>p.evaluate(async q=>{const i=$('gs-q');i.value=q;i.dispatchEvent(new Event('input'));await new Promise(r=>setTimeout(r,60));
  return{groups:[...document.querySelectorAll('#gs-res .gx-h')].map(h=>h.textContent),first:(document.querySelector('#gs-res .gx-row b')||{}).textContent,mark:!!document.querySelector('#gs-res mark'),text:$('gs-res').textContent}},q);
const f=await p.evaluate(()=>document.activeElement&&document.activeElement.id);
ok('the box has the cursor',f==='gs-q',f);
const a=await s('kenya');ok('one word finds origins and more, best first, highlighted',a.groups.includes('Origins')&&a.mark,a);
const g=await s('geisha');ok('varieties are found',a&&g.groups.includes('Varieties'),g);
const w=await s('bloom');ok('recipes and coffee words are found',w.groups.includes('Coffee words')||w.groups.includes('Recipes'),w);
const c=await p.evaluate(()=>BEANS[0].name.slice(0,5));const mine=await s(c);ok('your coffees come first',mine.groups[0]==='Your coffees',mine);
const n=await s('zzqqx');ok('nothing matches says so',/Nothing matches/.test(n.text),n);
await s(c);await p.click('#gs-res [data-gs="0"]');await p.waitForTimeout(700);
ok('a coffee opens its page',await p.evaluate(()=>$('vd').open&&$('vd').dataset.bean===BEANS[0].id));
await p.evaluate(()=>{$('vd').close()});await p.waitForTimeout(300);await p.click('#ab-search');await p.waitForTimeout(500);
await s('washed');const k=await p.evaluate(()=>{const h=[...document.querySelectorAll('#gs-res .gx-h')].find(x=>x.textContent==='Processes');return h&&h.nextElementSibling.dataset.gs});
await p.click('#gs-res [data-gs="'+k+'"]');await p.waitForTimeout(900);
ok('a process opens its page, the sheet closed',await p.evaluate(()=>!$('vd').open&&document.querySelector('main section.on').id==='process'));
ok('no page errors',!errs.length,errs);await b.close()})();
