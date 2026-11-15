// Liquid glass is gone (whoever had it keeps the house look). Four vibes and four logos are offered. In the app, back with the + menu open closes only the menu (it used to leave
// the app), and "Log this brew" rises in as a page of the Brew tab rather than sliding across to Settings.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));
// Someone who had Liquid glass on (as the old vibe, or the switch): it's gone, the house look stays.
await p.evaluate(()=>localStorage.setItem('bb-ui',JSON.stringify({vibe:'glass',glass:true,glassAmt:80,logo:'benchtop'})));await p.reload();await p.waitForTimeout(1200);
let st=await p.evaluate(()=>({glass:document.documentElement.hasAttribute('data-glass'),vibe:document.documentElement.getAttribute('data-vibe'),g:document.documentElement.style.getPropertyValue('--g'),bd:getComputedStyle(document.querySelector('.bottomnav')).backdropFilter}));
ok('Liquid glass is gone: no glass, the house look',!st.glass&&!st.vibe&&!st.g,st);
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(700);
const offer=await p.evaluate(()=>({v:[...document.querySelectorAll('#settings-in .vibe')].map(x=>x.dataset.vibe),l:[...document.querySelectorAll('#settings-in .logopick')].map(x=>x.dataset.logo),cur:[...document.querySelectorAll('#settings-in .logopick[aria-pressed=true]')].map(x=>x.dataset.logo),glassRow:/Liquid glass/.test($('settings-in').textContent)}));
ok('four vibes offered',JSON.stringify(offer.v)==='["roastery","pure","black","nordic"]',offer.v);
ok('four logos: the bean, the Bench, the dripper and the cherries',JSON.stringify(offer.l)==='["bean","bench","dripper","cherry"]',offer.l);
ok('a retired logo falls back to the bean',offer.cur[0]==='bean',offer.cur);
ok('no Liquid glass setting',!offer.glassRow);
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
// A ranked coffee opened as a full page has no coloured rule across the top (it sat under the status bar).
const rule=await p.evaluate(async()=>{showTab('beans');openBean(BEANS[0].id);await new Promise(r=>setTimeout(r,500));const h=document.querySelector('#vd .vd-head'),w=getComputedStyle(h).borderTopWidth;$('vd').close();return w});
ok('a coffee page has no stray line at the top',rule==='0px',rule);
ok('no page errors',!errs.length,errs);
await b.close()})();
