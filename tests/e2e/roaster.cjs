// Roastery pages: opened from a coffee's roastery, the gallery's roastery headings and the roasteries count; the stats
// add up, the favourite is the best rated, Back from a coffee returns to the roastery, and Add starts a coffee from it.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,v,x)=>console.log((v?'ok  ':'FAIL')+' '+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>goTab('beans'));await p.waitForTimeout(500);
// From a coffee page.
const id=await p.evaluate(()=>{const b=BEANS.find(x=>x.roaster==='Spirit Hub');openBean(b.id);return b.id});await p.waitForTimeout(300);
await p.click('#bd-ro');await p.waitForTimeout(400);
const pg=await p.evaluate(()=>{const t=$('vd-title').textContent,st=[...document.querySelectorAll('.ro-stats b')].map(x=>x.textContent),best=document.querySelector('.ro-best b').textContent,rows=document.querySelectorAll('.ro-cl [data-bean]').length;
  const own=BEANS.filter(b=>b.roaster==='Spirit Hub'),rated=own.filter(b=>b.rating),avg=(rated.reduce((a,b)=>a+b.rating,0)/rated.length).toFixed(1),top=[...own].sort((a,b)=>b.rating-a.rating)[0];
  return{t,st,best,rows,want:{n:String(own.length),avg,top:beanTitle(top)}}});
ok('a coffee’s roastery opens its page',pg.t==='Spirit Hub',pg.t);
ok('the counts and average are right, and every coffee is listed',pg.st[0]===pg.want.n&&pg.st[1]===pg.want.avg&&pg.rows===+pg.want.n,pg);
ok('the favourite is the best rated',pg.best===pg.want.top,pg);
await p.click('.ro-cl [data-bean]');await p.waitForTimeout(400);
const back=await p.evaluate(()=>{const b=$('bd-roback');return b&&b.textContent});ok('a coffee opened from it has Back to the roastery',/Spirit Hub/.test(back||''),back);
await p.click('#bd-roback');await p.waitForTimeout(300);ok('and Back returns there',await p.evaluate(()=>$('vd-title').textContent==='Spirit Hub'));
await p.evaluate(()=>$('ro-add').click());await p.waitForTimeout(400);ok('Add starts a coffee from that roastery',await p.evaluate(()=>$('be-roaster').value==='Spirit Hub'));
await p.evaluate(()=>$('vd').close());
// From the list.
await p.evaluate(()=>{document.querySelector('#bg-ros').click()});await p.waitForTimeout(400);
const ls=await p.evaluate(()=>[...document.querySelectorAll('.ro-row .ro-tx b')].map(x=>x.textContent)),nro=await p.evaluate(()=>new Set(BEANS.map(b=>b.roaster).filter(Boolean)).size);ok('the roasteries count opens the list, most coffees first',ls.length===nro&&['Spirit Hub','Archers'].includes(ls[0]),ls);
await p.click('.ro-row');await p.waitForTimeout(300);ok('a roastery from the list has Back to the list',await p.evaluate(()=>!!$('ro-back')));
await p.click('#ro-back');await p.waitForTimeout(300);ok('which goes back',await p.evaluate(()=>!!document.querySelector('.ro-row')));
await p.evaluate(()=>$('vd').close());
// From the gallery's roastery headings.
await p.evaluate(()=>{BSORT='roaster';renderGrid()});await p.waitForTimeout(300);await p.click('#beans .ro-gh');await p.waitForTimeout(300);
ok('a roastery heading in the gallery opens its page',await p.evaluate(()=>!!document.querySelector('dialog[open] .ro-stats')));
ok('it shares',await p.evaluate(()=>{const d=roasterDoc('Archers');return d.blocks[1].list.length===2&&/Archers/.test(d.title)}));
// What they roast for you lists every origin and process (no top five), each in the aligned key under its bar.
const all=await p.evaluate(async()=>{const O=['colombia','ethiopia','kenya','panama','costarica','yemen','indonesia','rwanda'];
  for(let i=0;i<8;i++){const n=JSON.parse(JSON.stringify(BEANS[0]));n.id='ax'+i;n.roaster='Many Origins';n.origin=O[i];n.process=['washed','natural','honey','carbonic','anaerobicnatural','washed','natural','lactic'][i];BEANS.push(n)}
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());openRoaster('Many Origins');await new Promise(r=>setTimeout(r,600));
  const m=[...document.querySelectorAll('dialog[open] .ro-mix')].map(x=>x.querySelectorAll('.ro-key').length);
  const segs=document.querySelector('dialog[open] .ro-stack').children.length;BEANS.splice(BEANS.length-8,8);return {m,segs}});
ok('every origin and process shows, not just the top five',all.m[0]===8&&all.m[1]===6&&all.segs===8,all);
// Back from a second coffee returns to the roastery, not to the first coffee opened (the page restored by back is the one
// the next coffee steps back to).
const bk=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),T=()=>$('vd').open?$('vd-title').textContent:'';
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());await w(400);openRoaster('Archers');await w(600);const ro=T();
  const ids=[...document.querySelectorAll('#vd .ro-cl [data-bean]')].map(x=>x.dataset.bean);
  document.querySelector('#vd .ro-cl [data-bean="'+ids[0]+'"]').click();await w(600);history.back();await w(600);
  document.querySelector('#vd .ro-cl [data-bean="'+ids[1]+'"]').click();await w(600);const second=T();history.back();await w(600);return {ro,second,after:T(),want:beanTitle(beanById(ids[1]))}});
ok('back from a second coffee goes to the roastery, not the first coffee',bk.after===bk.ro&&bk.second===bk.want,bk);
ok('no errors',!errs.length,errs);await b.close()})();
