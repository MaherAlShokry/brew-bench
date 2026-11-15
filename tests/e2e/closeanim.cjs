// Pages inside a section move like a stack: opening one, the page you were on eases left beneath it; back, it slides
// off to the right over the page beneath. The back button shrinks away when there's nowhere to go back to, the back button shrinks away when there's nowhere to go back to, and a process path folds away. Each
// leaves nothing behind once done.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(2500);
await p.click('.bottomnav [data-bn="beans"]');await p.waitForTimeout(700);await p.click('.bottomnav [data-bn="explore"]');await p.waitForTimeout(700);
await p.click('#explore .hubgrid button >> nth=0');await p.waitForTimeout(60);
const op=await p.evaluate(()=>{const o=document.querySelector('main section.nav-out');return {out:o&&o.id,anim:o&&getComputedStyle(o).animationName}});
ok('opening a page: the one you were on eases left beneath it',op.out==='explore'&&op.anim==='vt-push-old',op);await p.waitForTimeout(840);const sub=await p.evaluate(()=>document.querySelector('main section.on').id);
await p.click('#ab-back');await p.waitForTimeout(60);
const mid=await p.evaluate(()=>{const o=document.querySelector('main section.nav-out');return {out:o&&o.id,on:document.querySelector('main section.on').id,anim:o&&getComputedStyle(o).animationName}});
ok('back from a page inside a section: it slides off over the page beneath',mid.out===sub&&mid.on==='explore'&&mid.anim==='page-out',mid);
await p.waitForTimeout(500);
ok('and leaves nothing behind',await p.evaluate(s=>!document.querySelector('.nav-out')&&!$(s).getAttribute('style'),sub));
// The back button: shown with somewhere to go back to, shrinking away (not vanishing) when there isn't.
await p.evaluate(()=>{NAVD=1;setBack(true)});ok('back button shows',await p.evaluate(()=>!$('ab-back').hidden));
await p.evaluate(()=>setBack(false));const bb=await p.evaluate(()=>({out:$('ab-back').classList.contains('out'),hidden:$('ab-back').hidden}));
ok('back button shrinks away first',bb.out&&!bb.hidden,bb);await p.waitForTimeout(260);
ok('then hides',await p.evaluate(()=>$('ab-back').hidden&&!$('ab-back').classList.contains('out')));
// A process path folds away when its button is tapped again.
await p.evaluate(()=>goTab('flow'));await p.waitForTimeout(700);
const has=await p.evaluate(()=>!!document.querySelector('.fbr'));
if(has){await p.click('.fbr >> nth=0');await p.waitForTimeout(300);ok('a process path opens',await p.evaluate(()=>!!document.querySelector('.fbx')));
  await p.click('.fbr >> nth=0');ok('it folds away',await p.evaluate(()=>{const x=document.querySelector('.fbx');return !!x&&x.classList.contains('out')}));
  await p.waitForTimeout(300);ok('and is gone',await p.evaluate(()=>!document.querySelector('.fbx')))}
else ok('flow page has process paths',false);
ok('no page errors',!errs.length,errs);await b.close()})();
