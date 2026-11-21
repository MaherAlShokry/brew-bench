// One design language: no coloured edge stripes on cards anywhere a page shows them; families and types are named by
// a dot pill; card actions are round icon buttons or icon pills; steppers are pills with round buttons.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),o={stripes:[]};
  const stripes=tag=>document.querySelectorAll('main section.on .card, dialog[open] .vd-head').forEach(e=>{const s=getComputedStyle(e);
    const bw=['Top','Right','Bottom','Left'].map(d=>parseFloat(s['border'+d+'Width'])||0);if(Math.max(...bw)>=3&&Math.max(...bw)-Math.min(...bw)>=2)o.stripes.push(tag+': '+e.className)});
  for(const t of ['variety','process','tech','words','champs','history','gear','flow']){goTab(t);await w(500);stripes(t)}
  goTab('gear');await w(300);const bb=[...document.querySelectorAll('#gear button')].find(b=>b.textContent.trim()==='Brewers');bb&&bb.click();await w(400);stripes('gear brewers');
  openVariety('bourbon');await w(500);stripes('variety sheet');document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  goTab('variety');await w(400);const c=document.querySelector('#vgrid .vcard');
  o.cmp=!!c.querySelector('.ib.addcmp svg')&&!!c.querySelector('.pill.fam i');
  goTab('process');await w(400);o.proc=!!document.querySelector('#pgrid .pcard>.pill i')&&!!document.querySelector('#pgrid .pcard .pbtn[data-usep]');
  goTab('words');await w(400);o.wh=getComputedStyle(document.querySelector('.wgroup>h3')).textTransform;
  const st=document.querySelector('.stepper');if(st){const s=getComputedStyle(st),bt=getComputedStyle(st.querySelector('button'));o.step=s.borderTopLeftRadius+' '+bt.borderTopLeftRadius}
  return o});
ok('no coloured edge stripes on cards',!r.stripes.length,r.stripes);
ok('varieties: family dot pill and a round compare button',r.cmp);
ok('processes: type dot pill and an icon pill to brew',r.proc);
ok('coffee words: group headings match the app’s section labels',r.wh==='uppercase',r.wh);
ok('steppers are pills with round buttons',!r.step||/^999px 50%$/.test(r.step),r.step);
ok('no page errors',!errs.length,errs);
await b.close()})();
