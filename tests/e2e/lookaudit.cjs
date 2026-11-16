// Out-of-place details across every page and sheet, at phone size with a notch, in light and dark: icons with no
// drawing, divider lines that curve at their ends (a rounded box with only a top border), header buttons that overlap
// each other or sit under the status bar, and buttons stacked so close they touch.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const found=new Map();
for(const mode of ['light','dark']){const c=await b.newContext({viewport:{width:390,height:844},colorScheme:mode});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{sessionStorage.setItem('bb-splashed','1');window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android',Plugins:{Widget:{update:async()=>{},timer:async()=>{},pending:async()=>({open:''})}}}});
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>document.documentElement.style.setProperty('--cut-top','36px'));
const scan=async lbl=>{const r=await p.evaluate(()=>{const out=[];const dl=[...document.querySelectorAll('dialog[open]')].pop();const root=dl||document.querySelector('main section.on');if(!root)return out;
  const nm=e=>(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):e.tagName.toLowerCase());
  const vis=e=>{if(!e.getClientRects().length)return false;const cs=getComputedStyle(e);return cs.visibility!=='hidden'&&+cs.opacity>0};
  for(const e of root.querySelectorAll('path[d="undefined"],path[d=""],path:not([d])'))if(vis(e))out.push(['no-icon',nm(e.closest('button,a,span,div')||e),'']);
  for(const e of root.querySelectorAll('*')){if(!vis(e))continue;const cs=getComputedStyle(e);
    const t=parseFloat(cs.borderTopWidth),l=parseFloat(cs.borderLeftWidth),bt=parseFloat(cs.borderBottomWidth),rad=parseFloat(cs.borderTopLeftRadius);
    if(t>0&&!l&&!bt&&rad>3&&cs.borderTopStyle!=='none')out.push(['curved-line',nm(e),e.textContent.trim().slice(0,40)]);
    if(!l&&!t&&bt>0&&!parseFloat(cs.borderRightWidth)&&parseFloat(cs.borderBottomLeftRadius)>3&&cs.borderBottomStyle!=='none')out.push(['curved-line',nm(e),e.textContent.trim().slice(0,40)])}
  // Header: absolute buttons overlapping each other or the pill/title, or above the status bar.
  const sa=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cut-top'))||0;
  const head=root.querySelector('.vd-head,.selhead');if(head&&dl&&innerWidth<760){const items=[...head.querySelectorAll(':scope > *')].filter(vis);
    for(const e of items){const r=e.getBoundingClientRect();if(r.top<sa-1&&getComputedStyle(e).position==='absolute')out.push(['under-status-bar',nm(e),e.textContent.trim().slice(0,30)])}
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i].getBoundingClientRect(),c=items[j].getBoundingClientRect();
      if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)out.push(['head-overlap',nm(items[i])+' × '+nm(items[j]),items[j].textContent.trim().slice(0,30)])}}
  // Buttons one above the other with no room between.
  const cva=e=>{for(let a=e.parentElement;a&&a!==root;a=a.parentElement)if(getComputedStyle(a).contentVisibility==='auto')return true;return false};
  const btns=[...root.querySelectorAll('button.btn,button.pbtn,.pbtn')].filter(e=>vis(e)&&!cva(e)).map(e=>[e,e.getBoundingClientRect()]);
  for(const [e,r] of btns)for(const [f,s] of btns){if(e===f||e.contains(f)||f.contains(e))continue;const hx=r.left<s.right&&s.left<r.right;const gap=s.top-r.bottom;
    if(hx&&gap>-r.height/2&&gap<4&&s.top>r.top)out.push(['buttons-touch',nm(e)+' / '+nm(f),f.textContent.trim().slice(0,30)])}
  return out});for(const [k,n,t] of r){const key=k+' '+n;if(!found.has(key))found.set(key,{at:lbl+(mode==='dark'?' d':''),t,n:0});found.get(key).n++}};
const go=async(lbl,js,wait=700)=>{try{await Promise.race([p.evaluate(js),new Promise(r=>setTimeout(r,4000))]);await p.waitForTimeout(wait);await scan(lbl)}catch(e){console.log('ERR',lbl,e.message.slice(0,80))}};
const close="document.querySelectorAll('dialog[open]').forEach(d=>d.close())";
for(const t of ['dial','recipes','log','explore','map','settings','scan','history','variety','process','tech','champs','words','flow','wheel','gear'])await go(t,`goTab('${t}');document.querySelectorAll('main section.on details').forEach(d=>d.open=true)`);
for(const v of ['coffees','diary','passport','top3'])await go('beans:'+v,`goTab('beans');BVIEW='${v}';renderBeanViews()`);
const ten="RECIPES.findIndex(r=>/10-pour/.test(r.name))";
const sheets=[['bean',"BEANS[0].shelf=true;openBean(BEANS[0].id)"],['bean-off',"openBean((BEANS.find(b=>!b.shelf)||BEANS[1]).id)"],['editor',"openBeanEditor(BEANS[0])"],['recipe',"openRecipe(3)"],
  ['compare-pick',`openComparePickNow(${ten})`],['compare',`openCompareNow(${ten},3)`],['roasteries',"openRoastersNow()"],['roastery',`openRoasterNow(BEANS[0].roaster,true)`],['rename-roastery',`openRenameRoastery(BEANS[0].roaster,true)`],
  ['variety',"openVariety(V[0].id)"],['origin',"openOrigin(BEANS[0].origin)"],['share-bean',"openShare(beanDoc(BEANS[0]))"],['profile',"openMe()"],['trophies',"openTrophies()"],
  ['bean-filter',"goTab('beans');openBeanFilter()"],['bean-sort',"openBeanSort()"],['recipe-filter',"goTab('recipes');$('rfiltbtn').click()"],['make-recipe',"openMakeRecipe(BEANS[0].id)"]];
for(const [n,js] of sheets){await p.evaluate(close);await p.waitForTimeout(300);await go(n,js,900);await p.evaluate(()=>{const d=[...document.querySelectorAll('dialog[open]')].pop();if(d)d.scrollTop=d.scrollHeight});await p.waitForTimeout(200);await scan(n+'↓')}
if(errs.length)console.log('FAIL page errors',mode,errs.slice(0,3));await c.close()}
const rows=[...found.entries()].sort((a,b)=>a[0].localeCompare(b[0]));console.log(rows.length?rows.map(([k,v])=>'FAIL '+k.padEnd(60)+' '+v.at.padEnd(18)+' x'+v.n+'  "'+v.t+'"').join('\n'):'nothing out of place');
await b.close()})();
