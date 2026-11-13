// Every page, every vibe x light/dark: text that's hard to read, things wider than a small phone, unlabelled controls.
const {chromium}=require('playwright');const demo=require('./seed2.cjs');(async()=>{const b=await chromium.launch();const R={};const add=(k,v)=>{(R[k]=R[k]||new Set()).add(v)};
 const vibes=['roastery','oat','matcha','blossom','nordic','desert','neon','caramel','pure','black'];
 for(const v of vibes)for(const m of ['light','dark']){const w=v==='roastery'&&m==='light'?320:390;
  const c=await b.newContext({viewport:{width:w,height:740},serviceWorkers:'block'});await c.addInitScript(([v,m])=>{localStorage.setItem('bb-ui',JSON.stringify({vibe:v}));localStorage.setItem('bb-theme',m);sessionStorage.setItem('bb-splashed','1')},[v,m]);
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.goto('http://localhost:8099/index.html');await p.evaluate(demo);await p.reload();await p.waitForTimeout(700);
  const tabs=await p.evaluate(()=>[...document.querySelectorAll('main section[id]')].map(s=>s.id));
  for(const t of tabs){await p.evaluate(t=>showTab(t),t);await p.waitForTimeout(300);
   const r=await p.evaluate(()=>{const rgba=s=>{if(!s||s==='none')return null;const m=s.match(/[\d.]+/g);if(!m)return null;let n=m.map(Number);if(s.startsWith('color('))n=[n[0]*255,n[1]*255,n[2]*255,n.length>3?n[3]:1];return n.length>3?n:[...n,1]},lum=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
    const mix=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3])).concat(1);
    const bgOf=el=>{const st=[];for(let e=el;e&&e.nodeType===1;e=e.parentElement){const s=getComputedStyle(e);if(s.backgroundImage&&s.backgroundImage!=='none'&&!/^url/.test(s.backgroundImage))return null;if(/^url/.test(s.backgroundImage))return null;const c=rgba(s.backgroundColor);if(c&&c[3]>0){st.push(c);if(c[3]>.95)break}}let base=rgba(getComputedStyle(document.body).backgroundColor);for(let i=st.length-1;i>=0;i--)base=st[i][3]>.95?st[i]:mix(st[i],base);return base};
    const out={text:[],wide:[],label:[]};const sec=document.querySelector('main section.on');
    const W=document.documentElement.clientWidth;
    for(const el of sec.querySelectorAll('*')){if(!el.checkVisibility({opacityProperty:true,visibilityProperty:true}))continue;const bx=el.getBoundingClientRect();if(!bx.width)continue;
     if(bx.right>W+1&&!el.closest('[style*="overflow"],.hscroll,.seg,.chips,.rail,.scroller,svg,canvas')){let sc=false;for(let e=el.parentElement;e&&e!==document.body;e=e.parentElement){const o=getComputedStyle(e).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'){sc=true;break}}if(!sc)out.wide.push(el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0])}
     if((el.tagName==='BUTTON'||el.tagName==='A'||el.tagName==='INPUT'||el.tagName==='SELECT'||el.tagName==='TEXTAREA')&&el.type!=='hidden'){const n=(el.getAttribute('aria-label')||el.title||el.textContent||el.placeholder||'').trim()||(el.id&&document.querySelector('label[for="'+el.id+'"]'))||el.closest('label');if(!n)out.label.push(el.tagName.toLowerCase()+(el.id?'#'+el.id:'.'+String(el.className).split(' ')[0]))}
     const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1);if(!own)continue;
     const s=getComputedStyle(el);if(+s.opacity<.99)continue;const fg=rgba(s.color),bg=bgOf(el);if(!fg||!bg)continue;const f=fg[3]<1?mix(fg,bg):fg;const L1=lum(f),L2=lum(bg),cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
     const big=parseFloat(s.fontSize)>=18.6||(parseFloat(s.fontSize)>=14&&+s.fontWeight>=700);if(cr<(big?3:4.5))out.text.push(el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0]+' "'+el.textContent.trim().slice(0,18)+'" '+cr.toFixed(2))}
    return out});
   r.text.forEach(x=>add('text '+t+': '+x.replace(/ [\d.]+$/,''),v+'/'+m+' '+x.match(/[\d.]+$/)[0]));r.wide.forEach(x=>add('wide '+t+': '+x,v+'/'+m+'@'+w));r.label.forEach(x=>add('label '+t+': '+x,v+'/'+m))}
  errs.forEach(e=>add('error',v+'/'+m+' '+e));await c.close()}
 const ks=Object.keys(R).sort();console.log(ks.map(k=>k+'  ['+R[k].size+'] '+[...R[k]].slice(0,4).join(', ')).join('\n')||'clean');await b.close()})();
