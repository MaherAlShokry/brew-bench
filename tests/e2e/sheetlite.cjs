// Sheets open light: while a page sheet slides in, its sections past the first screen wait (vd-lite), and once it is
// in, everything is drawn and the fact tiles are fitted, as before. The brew settings reader is cached but answers
// exactly as before, and the diary dates read the same.
{const o=require('path').join(__dirname,'out');require('fs').mkdirSync(o,{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForFunction(()=>window.BEANS_OK,null,{timeout:20000});
await p.evaluate(()=>showTab('beans'));await p.waitForTimeout(1200);
const a=await p.evaluate(()=>{const d=$('vd');openBean(BEANS[0].id);const kids=[...d.querySelectorAll('.vd-body>*')];
  return{lite:d.classList.contains('vd-lite'),first:getComputedStyle(kids[0]).contentVisibility,later:kids.slice(2).every(k=>getComputedStyle(k).contentVisibility==='auto'),n:kids.length}});
ok('a coffee slides in with only its first sections drawn',a.lite&&a.first==='visible'&&a.later&&a.n>3,a);
await p.waitForTimeout(1000);
const c=await p.evaluate(()=>{const d=$('vd');const kids=[...d.querySelectorAll('.vd-body>*')];const f=d.querySelector('.bfacts');
  const fitted=f?f.style.getPropertyValue('--bfs')!=='':true;return{lite:d.classList.contains('vd-lite'),all:kids.every(k=>getComputedStyle(k).contentVisibility==='visible'),fitted}});
ok('once it is in, every section is drawn and the fact tiles are fitted',!c.lite&&c.all&&c.fitted,c);
await p.evaluate(()=>history.back());await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const lines=['Tetsu Kasuya 4:6, 20g : 320g, 92°C','Hoffmann 1 cup (V60), 15 g : 250 g, 1:16.7, 94 °C, Comandante C40 24 clicks','18g/300g Kalita Wave',''];
  const same=lines.every(t=>JSON.stringify(parseSettings(t))===JSON.stringify(parseSettings0(t)));
  const x=parseSettings(lines[0]);x.dose=999;const own=parseSettings(lines[0]).dose!==999;
  const before=parseSettings('My test brew 12g : 200g').rec;RECIPES.push(Object.assign({},RECIPES[0],{name:'My test brew',custom:true}));const after=parseSettings('My test brew 12g : 200g').rec;RECIPES.pop();
  let dates;try{dates=dfmt('2026-10-12')===new Date('2026-10-12').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})&&dfmt('nope')==='Invalid Date'}catch(e){dates='threw '+e.message}
  return{same,own,fresh:!before||before.name!=='My test brew',after:after&&after.name,dates}});
ok('the settings reader answers as before, each caller gets its own copy, and a new recipe is seen',r.same&&r.own&&r.fresh&&r.after==='My test brew',r);
ok('diary dates read the same (and a bad one still reads "Invalid Date")',r.dates===true,r.dates);
ok('no page errors',!errs.length,errs);await b.close()})();
