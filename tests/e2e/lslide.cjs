// The brew log: the cards slide sideways as before (each card's heading following the order), tidied (details in an
// even grid), with filters by coffee, origin, region, brewer, recipe, how it tasted and period. No sideways page scroll.
{const o=require('path').join(__dirname,'out');require('fs').mkdirSync(o,{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:392,height:800},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seedbig.cjs'));await p.reload();await p.waitForFunction(()=>window.BEANS_OK,null,{timeout:20000});await p.waitForTimeout(800);
await p.evaluate(()=>goTab('log'));await p.waitForTimeout(800);
// The brew cards slide sideways, one at a time, as before; each card's heading follows the order.
const n=await p.evaluate(()=>$('l-track').children.length);
await p.evaluate(()=>document.querySelector('[data-lgo="1"]').click());await p.waitForTimeout(700);
const s1=await p.evaluate(()=>[$('l-pos').textContent,document.querySelector('[data-lgo="-1"]').disabled]);ok('the next arrow moves one brew',s1[0]==='2 of '+n&&!s1[1],s1);
// By coffee (A–Z) the brews stack, one stack per coffee in order; a stack opens that coffee's brews, headed by when.
const g=await p.evaluate(()=>{const h=()=>(document.querySelector('#l-track .le-day')||{}).textContent;LF.sort='az';renderLogList(true);const st=[...document.querySelectorAll('[data-lstack]')].map(x=>x.dataset.lstack);
  document.querySelector('[data-lstack]').click();const inside={coffee:LF.coffee.slice(),n:$('l-track')?$('l-track').children.length:0,want:LOG.filter(l=>lCoffee(l)===st[0]).length,day:h(),back:!!$('lst-back')};
  $('lst-back').click();const after=document.querySelectorAll('[data-lstack]').length;
  LF.sort='top';renderLogList(true);const top=h();LF.sort='new';renderLogList(true);
  const names=[...new Set(LOG.map(lCoffee))].sort((a,b)=>a.localeCompare(b));return{st,names,inside,after,top}});
ok('by coffee the brews stack, one stack per coffee, A–Z',JSON.stringify(g.st)===JSON.stringify(g.names),g);
ok('…a stack opens all of that coffee\'s brews, and All coffees goes back',g.inside.coffee[0]===g.st[0]&&g.inside.n===g.inside.want&&g.inside.back&&g.after===g.st.length,g.inside);
ok('highest rated: the heading is the rating',/beans?$/.test(g.top),g.top);
// The card: its details in an even two-column grid, the flavour edit button with the chips.
const cd=await p.evaluate(()=>{const c=document.querySelector('#l-track .le2'),ps=[...c.querySelectorAll('.le-pill')].map(x=>Math.round(x.getBoundingClientRect().width));return{cols:getComputedStyle(c.querySelector('.le-pills')).gridTemplateColumns.split(' ').length,w:[...new Set(ps)].length}});
ok('the card\'s details sit in an even two-column grid',cd.cols===2&&cd.w===1,cd);
// The filter sheet has the new sections, and each filter narrows the list.
await p.evaluate(()=>$('lf-f').click());await p.waitForTimeout(500);
const secs=await p.evaluate(()=>[...document.querySelectorAll('#sel-in .rs-sec h4')].map(h=>h.firstChild.textContent.trim()));await p.evaluate(()=>$('selsheet').close());
ok('filters: rating, when, coffee, origin, region, brewer, recipe, how it tasted',['Rating','When','Coffee','Origin','Region','Brewer','Recipe','How it tasted'].every(x=>secs.includes(x)),secs);
const f=await p.evaluate(()=>{const n=k=>{renderLogList(true);return LLN};const all=n();const c=lCoffee(LOG[0]);LF.coffee=[c];const byC=n(),allC=LOG.every(l=>lCoffee(l)!==c||lfKeep(l))&&LOG.filter(lfKeep).every(l=>lCoffee(l)===c);LF.coffee=[];
  const o=LOG.map(lOrigin).find(Boolean);LF.origin=[o];const byO=n(),okO=LOG.filter(lfKeep).every(l=>lOrigin(l)===o);LF.origin=[];
  LF.brewer=['sw'];const okB=n()>0&&LOG.filter(lfKeep).every(l=>lBrewer(l)==='sw');LF.brewer=[];LF.taste=['sour'];const okT=n()>0&&LOG.filter(lfKeep).every(l=>l.taste==='sour');LF.taste=[];
  LF.period='30';const okP=n()<all&&LOG.filter(lfKeep).every(l=>l.ts>=Date.now()-30*864e5);LF.period='';n();return{all,byC,allC,byO,okO,okB,okT,okP,name:lfName()}});
ok('coffee, origin, brewer, taste and period each narrow the list to what they say',f.byC<f.all&&f.allC&&f.byO<f.all&&f.okO&&f.okB&&f.okT&&f.okP&&f.name==='All brews',f);
const sw=await p.evaluate(()=>document.documentElement.scrollWidth);ok('no page sideways scroll',sw<=392,sw);
ok('no page errors',!errs.length,errs);await b.close()})();
