// Wrapping chip rows (Target cup) keep their own pick: changing the text size re-measures the gliding highlights, and
// once put one on the chips too, so the picked chip went see-through and a loose highlight floated over the page.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},colorScheme:'dark'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
await p.evaluate(()=>{localStorage.setItem('bb-ui',JSON.stringify({vibe:'pure'}));localStorage.setItem('bb-theme','dark')});await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>{loadRecipe(0);document.querySelectorAll('#dial details.dstep').forEach(d=>d.open=true)});await p.waitForTimeout(500);
await p.evaluate(()=>goTab('settings'));await p.waitForTimeout(800);
for(const v of ['l','m']){await p.evaluate(v=>document.querySelector('#st-text [data-v="'+v+'"]').click(),v);await p.waitForTimeout(500)}
await p.evaluate(()=>goTab('dial'));await p.waitForTimeout(800);
for(const v of ['sweet','balance']){await p.evaluate(v=>document.querySelector('#g-goal [data-v="'+v+'"]').click(),v);await p.waitForTimeout(500)}
const r=await p.evaluate(()=>{const on=document.querySelector('#g-goal [aria-pressed="true"]');return{stray:document.querySelectorAll('.seg.filters>.seg-ind,.seg.filters.has-ind').length,bg:getComputedStyle(on).backgroundColor,strips:document.querySelectorAll('.seg:not(.filters).has-ind').length}});
console.log(JSON.stringify(r));
if(r.stray)console.log('FAIL a chip row got a gliding highlight');if(r.bg==='rgba(0, 0, 0, 0)')console.log('FAIL the picked Target cup chip has no background');if(!r.strips)console.log('FAIL the one-line strips lost their highlight');
// A strip on a hidden page waits for its page after a change of look, then sits on its pick in the new colours.
await p.evaluate(()=>goTab('dial'));await p.waitForTimeout(500);await p.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));await p.waitForTimeout(400);
const stale=await p.evaluate(()=>!!$('st-mode')._stale);await p.evaluate(()=>goTab('settings'));await p.waitForTimeout(700);
const h=await p.evaluate(()=>{const s=$('st-mode'),i=s.querySelector(':scope>.seg-ind'),on=s.querySelector('[aria-pressed="true"]'),a=i.getBoundingClientRect(),b=on.getBoundingClientRect();on.setAttribute('data-peek','');const want=getComputedStyle(on).backgroundColor;on.removeAttribute('data-peek');
  return{off:Math.round(Math.abs(a.left-b.left)+Math.abs(a.top-b.top)+Math.abs(a.width-b.width)),bg:getComputedStyle(i).backgroundColor,want,op:getComputedStyle(i).opacity}});
console.log(JSON.stringify({stale,...h}));
if(!stale)console.log('FAIL a strip on a hidden page was measured straight away');if(h.off>2||h.op!=='1')console.log('FAIL the highlight is off its pick after the page opened');if(h.bg!==h.want)console.log('FAIL the highlight kept the old colours');
if(errs.length)console.log('FAIL errors',errs);await b.close()})();
