// Smoothness guards: the tab bar hides by a class on the bar itself (on <html> it restyled every element of a long
// list on each scroll); a burst of shared-log updates is applied once and an unchanged one redraws nothing; the bars
// that stay on screen don't blur what scrolls under them; the Brew page's pour animation doesn't run for ever.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),o={};goTab('beans');await w(500);
  o.htmlClass=document.documentElement.className;
  // Remote updates: five in a row, one application; the same again, no redraw.
  let n=0;const orig=renderLog;window.renderLog=function(){n++;return orig.apply(this,arguments)};
  const snap={log:Object.fromEntries(LOG.map(l=>[l.id,Object.assign({},l)])),recipes:{}};for(let i=0;i<5;i++)applyRemote(snap);await w(300);o.first=n;
  applyRemote(snap);await w(300);o.again=n;window.renderLog=orig;
  o.blur=['.appbar','.bottomnav'].map(s=>{const e=document.querySelector(s);return e?getComputedStyle(e).backdropFilter:'none'});
  const st=document.querySelector('.stream');o.stream=st?getComputedStyle(st).animationIterationCount:'none';return o});
ok('the tab bar hides by its own class, never one on the page',!/nav-away/.test(r.htmlClass),r.htmlClass);
ok('a burst of shared-log updates is applied once; an unchanged one redraws nothing',r.first===1&&r.again===1,r);
ok('the bars on screen don\'t blur what scrolls under them',r.blur.every(x=>x==='none'),r.blur);
ok('the pour animation plays a few times, not for ever',r.stream!=='infinite',r.stream);
// Scrolling the coffee list: the bar slides away and back, and the page itself isn't marked.
await p.evaluate(()=>scrollTo(0,0));for(let i=0;i<8;i++){await p.mouse.wheel(0,200);await p.waitForTimeout(40)}await p.waitForTimeout(300);
const s=await p.evaluate(()=>({bar:document.querySelector('.bottomnav').classList.contains('nav-away'),html:document.documentElement.classList.contains('nav-away')}));
ok('scrolling down: the bar goes, by its own class',s.bar&&!s.html,s);
ok('no page errors',!errs.length,errs);await b.close()})();
