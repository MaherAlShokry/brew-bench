// Liquid glass is a switch with a strength over any vibe (it was a vibe; whoever had it keeps it, over the house look).
// Four vibes and four logos are offered. In the app, back with the + menu open closes only the menu (it used to leave
// the app), and "Log this brew" rises in as a page of the Brew tab rather than sliding across to Settings.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
// Someone who had picked the Liquid glass vibe.
await p.evaluate(()=>localStorage.setItem('bb-ui',JSON.stringify({vibe:'glass',logo:'kettle'})));await p.reload();await p.waitForTimeout(1200);
let st=await p.evaluate(()=>({glass:document.documentElement.hasAttribute('data-glass'),vibe:document.documentElement.getAttribute('data-vibe'),ui:JSON.parse(localStorage.getItem('bb-ui')),g:getComputedStyle(document.documentElement).getPropertyValue('--g').trim()}));
ok('the old glass vibe becomes glass on, over the house look',st.glass&&!st.vibe&&st.g==='0.6',st);
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(700);
const offer=await p.evaluate(()=>({v:[...document.querySelectorAll('#settings-in .vibe')].map(x=>x.dataset.vibe),l:[...document.querySelectorAll('#settings-in .logopick')].map(x=>x.dataset.logo),cur:[...document.querySelectorAll('#settings-in .logopick[aria-pressed=true]')].map(x=>x.dataset.logo)}));
ok('four vibes offered',JSON.stringify(offer.v)==='["roastery","pure","black","nordic"]',offer.v);
ok('four logos offered',JSON.stringify(offer.l)==='["bean","bench","benchtop","cherry"]',offer.l);
ok('a retired logo falls back to the bean',offer.cur[0]==='bean',offer.cur);
ok('the strength slider shows while glass is on',await p.isVisible('#st-glamt'));
// Sliding changes the glass at once, without redrawing Settings, and is kept.
const mark=await p.evaluate(()=>{const n=$('st-mode');n.dataset.mark='1';return 1});
await p.evaluate(()=>{const r=$('st-glamt');r.value=90;r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new Event('change',{bubbles:true}))});
st=await p.evaluate(()=>({g:document.documentElement.style.getPropertyValue('--g'),amt:JSON.parse(localStorage.getItem('bb-ui')).glassAmt,same:$('st-mode').dataset.mark==='1'}));
ok('the slider sets the strength live and keeps it',st.g==='0.9'&&st.amt===90&&st.same,st);
// Glass over another vibe, then off.
await p.click('#settings-in .vibe[data-vibe="nordic"]');await p.waitForTimeout(500);
st=await p.evaluate(()=>({glass:document.documentElement.hasAttribute('data-glass'),vibe:document.documentElement.getAttribute('data-vibe')}));
ok('glass stays on over Nordic roast',st.glass&&st.vibe==='nordic',st);
const bar=await p.evaluate(()=>{const s=getComputedStyle(document.querySelector('.bottomnav'));return s.backdropFilter||s.webkitBackdropFilter});
ok('the bars are frosted',/blur/.test(bar),bar);
await p.click('#st-glass button:has-text("Off")');await p.waitForTimeout(400);
st=await p.evaluate(()=>({glass:document.documentElement.hasAttribute('data-glass'),hidden:$('st-glamt-w').hidden}));
ok('off removes the glass and hides the slider',!st.glass&&st.hidden,st);
await p.reload();await p.waitForTimeout(1000);
ok('off is kept after a reload',await p.evaluate(()=>!document.documentElement.hasAttribute('data-glass')));
// Back with the + menu open (the Android back asks bbBack first): it closes the menu and stays in the app.
await p.evaluate(()=>showTab('dial'));await p.waitForTimeout(600);await p.click('#d-fab .fab-main');await p.waitForTimeout(300);
const r=await p.evaluate(()=>window.bbBack());await p.waitForTimeout(400);
ok('back closes the + menu and stays in the app',r===true&&await p.evaluate(()=>$('d-fab').querySelector('.fab-menu').hidden&&$('dial').classList.contains('on')));
// Log this brew rises in as a page (not a slide across to Settings).
await p.click('#d-fab .fab-main');await p.waitForTimeout(300);
const nav=p.evaluate(()=>new Promise(res=>{const o=new MutationObserver(()=>{const n=document.documentElement.dataset.nav;if(n){o.disconnect();res(n)}});o.observe(document.documentElement,{attributes:true,attributeFilter:['data-nav']});setTimeout(()=>res(document.documentElement.dataset.nav),2000)}));
await p.evaluate(()=>{document.documentElement.dataset.nav=''});
await p.click('.fab-mi[data-fab="log"]');const kind=await nav;await p.waitForTimeout(700);
ok('Log this brew opens the log as a page rising in',kind==='push'&&await p.evaluate(()=>$('log').classList.contains('on')),kind);
ok('no page errors',!errs.length,errs);
await b.close()})();
