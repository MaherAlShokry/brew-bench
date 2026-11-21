// Alignment and consistency: the coffee page's Brew it / New recipe / Reset grind sit on one line, and so do the
// "Brewed a cup with" stepper and its ✓, at phone widths and big text, with no label cut off; the palate's bar and notes
// take the card's full width inside it; a made recipe is named for itself with the coffee on its own line; your own
// saved recipe isn't called shared; a recipe's total time is its last step when that step finishes the brew, and its
// pour count leaves out a press "and pour", the coffee going in and "the pour should end about here".
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));const errs=[];
for(const [W,t] of [[320,'m'],[360,'xl'],[412,'m']]){const p=await b.newPage({viewport:{width:W,height:800}});p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
  await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
  await p.evaluate(t=>{const u=JSON.parse(localStorage.getItem('bb-ui')||'{}');u.text=t;localStorage.setItem('bb-ui',JSON.stringify(u))},t);await p.reload();await p.waitForTimeout(1500);
  const r=await p.evaluate(async()=>{const bn=BEANS[0];bn.shelf=true;DIALNEXT[bn.id]={g:'zp6',set:52};openBean(bn.id);await new Promise(r=>setTimeout(r,800));
    const line=sel=>{const row=document.querySelector(sel);if(!row)return null;const k=[...row.children].filter(e=>e.getClientRects().length&&!e.matches('.bd-cupl'));
      return{tops:new Set(k.map(e=>{const q=e.getBoundingClientRect();return Math.round((q.top+q.bottom)/2/6)})).size,cut:[...row.querySelectorAll('span')].some(s=>s.scrollWidth>s.clientWidth+1),n:k.length,in:k.every(e=>e.getBoundingClientRect().right<=row.getBoundingClientRect().right+1)}};
    const o={acts:line('dialog[open] .bd-acts'),cup:line('dialog[open] .bd-cupr'),auto:!!document.querySelector('dialog[open] .bd-auto')};document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    LOG.unshift({id:'pg1',ts:Date.now(),date:'',coffee:'X',settings:'',stars:4,fl:[['fruity.tropical-fruit.mango',3],['fruity.tropical-fruit.passion-fruit',3],['fruity.berry.blueberry',2]]});goTab('log');renderPalate();await new Promise(r=>setTimeout(r,300));
    const pc=$('l-palate').getBoundingClientRect();o.palate=[...$('l-palate').querySelectorAll('.chip,.fwbar')].every(e=>{const q=e.getBoundingClientRect();return q.left>=pc.left&&q.right<=pc.right+0.5&&q.bottom<=pc.bottom-8});
    o.palW=Math.round($('l-palate').querySelector('.pal-b').getBoundingClientRect().width/pc.width*100);return o});
  ok(W+'px/'+t+': Brew it, New recipe and Reset grind on one line, nothing cut',r.acts&&r.acts.n===3&&r.acts.tops===1&&!r.acts.cut&&r.acts.in,r.acts);
  ok(W+'px/'+t+': the cup stepper and its ✓ on one line',r.cup&&r.cup.tops===1&&r.cup.in&&!r.auto,r);
  ok(W+'px/'+t+': the palate\'s bar and notes sit inside the card, full width',r.palate&&r.palW>80,r);
  await p.close()}
const p=await b.newPage();p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const m=await p.evaluate(async()=>{const bn=BEANS[0],r=makeRecipe(bn,'frenchpress','balanced',3),v=makeRecipe(bn,'v60','sweet',3);
  const mine=Object.assign({},v,{id:'rmine1',author:'Sam',ts:Date.now()});ME='Sam';saveRecipe(mine);openRecipe(RECIPES.findIndex(x=>x.id==='rmine1'));await new Promise(r=>setTimeout(r,500));
  const pill=document.querySelector('dialog[open] .vd-head .pill').textContent,by=(document.querySelector('dialog[open] .vd-by')||{}).textContent;document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  const last=s=>Math.max(...s.map(stepSecs).filter(x=>x!=null)),R=n=>RECIPES.find(x=>x.name===n);
  return{name:r.name,by:r.by,coffee:beanTitle(bn),fp:[rmeta(r).time,last(r.steps),rmeta(r).pours],pill,mineBy:by,
    pours:['Classic 4-minute press','MUGEN one pour','Water-first Clever','Clever steep'].map(n=>R(n)&&rmeta(R(n)).pours),k46:[rmeta(R('Tetsu Kasuya 4:6')).time,last(R('Tetsu Kasuya 4:6').steps)]}});
ok('a made recipe has its own name, the coffee on its own line',!m.name.includes(m.coffee)&&/^[A-Z]/.test(m.name)&&m.by.startsWith('For ')&&m.by.length>4,m);
ok('your own saved recipe is "Your recipe", with the coffee under it',m.pill==='Your recipe'&&/^For /.test(m.mineBy||''),m);
ok('total time ends at the last step when it finishes the brew; one pour for a press',m.fp[0]===m.fp[1]&&m.fp[2]===1&&m.k46[0]===m.k46[1],m);
ok('pour counts leave out "and pour" after a press, the coffee going in and "the pour should end here"',JSON.stringify(m.pours)==='[1,1,1,1]',m.pours);
ok('no page errors',!errs.length,errs);await b.close()})();
