const {chromium}=require('playwright');
const TABS=['dial','recipes','beans','explore','settings','log','gear'];
const grab=()=>{const out={};let i=0;document.querySelectorAll('main section.on *, .appbar *, .bottomnav, .bottomnav *').forEach(e=>{i++;if(!e.getClientRects().length)return;const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return;const s=getComputedStyle(e);if(s.visibility==='hidden'||+s.opacity===0)return;
  const key=(e.id?'#'+e.id:'')+e.tagName+'.'+[...e.classList].join('.')+'@'+Math.round(r.left)+','+Math.round(r.top+scrollY);out[key]=[s.backgroundColor,s.color,s.borderTopColor,s.fill,s.stroke,s.backgroundImage.slice(0,60)].join('|')});return out};
(async()=>{const b=await chromium.launch();
 const mk=async(theme)=>{const c=await b.newContext({viewport:{width:392,height:800},isMobile:true,hasTouch:true});const p=await c.newPage();await p.addInitScript(t=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t)},theme);
  await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.evaluate(t=>localStorage.setItem('bb-theme',t),theme);await p.reload();await p.waitForTimeout(1200);return p};
 for(const [from,to] of [['dark','light'],['light','dark']]){
  const live=await mk(from);const fresh=await mk(to);
  // visit all tabs in the old theme first so everything is built, then switch
  for(const t of TABS){await live.evaluate(t=>t==='gear'?goGear('set'):goTab(t),t);await live.waitForTimeout(700)}
  await live.evaluate(()=>goTab('settings'));await live.waitForTimeout(600);
  await live.evaluate(to=>document.querySelector('#st-mode [data-v="'+to+'"]').click(),to);await live.waitForTimeout(800);
  let total=0;
  for(const t of TABS){for(const p of [live,fresh]){await p.evaluate(t=>t==='gear'?goGear('set'):goTab(t),t);await p.waitForTimeout(900);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300)}
   const A=await live.evaluate(grab),B=await fresh.evaluate(grab);const diff=Object.keys(A).filter(k=>k in B&&A[k]!==B[k]&&!/seg-ind|bn-pill/.test('x')).slice(0,12);total+=diff.length;
   console.log(from+'→'+to,t,diff.length,diff.map(k=>k+'  LIVE '+A[k]+'  FRESH '+B[k]).join('\n   '))}
 }
 await b.close()})()
