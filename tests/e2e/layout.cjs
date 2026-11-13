const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const found=new Map();
for(const [w,th] of [[320,'light'],[390,'dark']]){const c=await b.newContext({viewport:{width:w,height:844},serviceWorkers:'block',hasTouch:true});
await c.addInitScript(t=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t)},th);const p=await c.newPage();
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(800);
const scan=async lbl=>{const r=await p.evaluate(()=>{const out=[],W=innerWidth;const root=document.querySelector('dialog[open]')||document.querySelector('main section.on');if(!root)return out;
  const vis=e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
  const name=e=>(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'')+' "'+(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,28)+'"';
  // off screen to the right / left
  for(const e of root.querySelectorAll('*')){if(!vis(e))continue;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
   let clip=false;for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a);if(/(auto|scroll|hidden|clip)/.test(s.overflowX)){clip=true;break}}
   if(!clip&&(r.right>W+1||r.left<-1)&&r.width<W*3&&!/backdrop|deco|bg|blob|steam|hero-art/.test(e.className))out.push('off screen: '+name(e));
   // text overflowing its own box (visible overflow)
   if(e.children.length===0&&e.textContent.trim()&&cs.overflow==='visible'&&e.scrollWidth>e.clientWidth+2&&cs.display!=='inline'&&!/sr\b/.test(e.className))out.push('text spills: '+name(e));
   // small tap targets
   if((e.tagName==='BUTTON'||e.getAttribute('role')==='button')&&(r.height<28||r.width<28)&&!e.closest('.cal,.calgrid')&&!e.classList.contains('linkbtn'))out.push('small tap target '+Math.round(r.width)+'x'+Math.round(r.height)+': '+name(e))}
  // overlapping text leaves (siblings in the same parent)
  const leaves=[...root.querySelectorAll('b,small,span,h2,h3,h4,p,em,label')].filter(e=>vis(e)&&e.children.length===0&&e.textContent.trim().length>1&&getComputedStyle(e).position==='static');
  for(let i=0;i<leaves.length;i++)for(let j=i+1;j<Math.min(leaves.length,i+6);j++){const a=leaves[i].getBoundingClientRect(),c=leaves[j].getBoundingClientRect();
   if(leaves[i].contains(leaves[j])||leaves[j].contains(leaves[i]))continue;const ox=Math.min(a.right,c.right)-Math.max(a.left,c.left),oy=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);
   if(ox>4&&oy>4)out.push('overlap: '+name(leaves[i])+' / '+name(leaves[j]))}
  return out});r.forEach(x=>{if(!found.has(x))found.set(x,lbl+'@'+w)})};
const tabs=await p.evaluate(()=>[...document.querySelectorAll('main section')].map(s=>s.id).filter(Boolean));
for(const t of tabs){try{await p.evaluate(t=>goTab(t),t)}catch(e){continue}await p.waitForTimeout(700);await p.evaluate(()=>document.querySelectorAll('.toast,#toast').forEach(x=>x.remove()));
 if(t==='gear')for(const g of ['set','dials','brew','lib','acc']){await p.evaluate(g=>gearTab(g),g);await p.waitForTimeout(300);await scan('gear:'+g)}
 else if(t==='beans')for(const v of [1,2,3,4,5]){await p.evaluate(v=>document.querySelector('#bg-views button:nth-child('+v+')').click(),v);await p.waitForTimeout(400);await scan('beans:'+v)}
 else await scan(t)}
for(const [n,f] of [['bean',()=>openBean(BEANS[0].id)],['editor',()=>openBeanEditor(BEANS[0])],['recipe',()=>openRecipe(0)],['variety',()=>openVariety('geisha')]]){try{await p.evaluate(f);await p.waitForTimeout(500);await scan('dlg:'+n);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(300)}catch(e){}}
await c.close()}
console.log(found.size?[...found].map(([k,v])=>v+'  '+k).join('\n'):'layout clean');await b.close()})();
