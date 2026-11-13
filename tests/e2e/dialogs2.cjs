// Open each dialog and sheet, in every vibe x light/dark: errors, text and icons that are hard to see, overflow.
const {chromium}=require('playwright');const demo=require('./seed2.cjs');(async()=>{const b=await chromium.launch();const R={};const add=(k,v)=>{(R[k]=R[k]||new Set()).add(v)};
 const OPEN={bean:()=>openBean(BEANS[0].id),beanEditor:()=>openBeanEditor(),beanPick:()=>openBeanPick(),explore:()=>document.querySelector('.bottomnav [data-sheet="explore"],.bottomnav [data-tab="explore"]')&&0};
 const vibes=['roastery','oat','matcha','blossom','nordic','desert','neon','caramel','pure','black'];
 for(const v of vibes)for(const m of ['light','dark']){const c=await b.newContext({viewport:{width:360,height:740},serviceWorkers:'block'});await c.addInitScript(([v,m])=>{localStorage.setItem('bb-ui',JSON.stringify({vibe:v}));localStorage.setItem('bb-theme',m);sessionStorage.setItem('bb-splashed','1')},[v,m]);
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.goto('http://localhost:8099/index.html');await p.evaluate(demo);await p.reload();await p.waitForTimeout(800);
  for(const [name,fn] of Object.entries(OPEN)){const before=errs.length;
   const ok=await p.evaluate(fn=>{try{(0,eval)('('+fn+')')();return true}catch(e){return 'throw '+e.message}},fn.toString());await p.waitForTimeout(350);
   if(ok!==true){if(!/is not defined|not a function/.test(ok))add('open '+name,v+'/'+m+' '+ok);continue}
   const r=await p.evaluate(()=>{const root=[...document.querySelectorAll('dialog[open]')].pop();if(!root)return null;
    const rgba=s=>{if(!s||s==='none')return null;const m=s.match(/[\d.]+/g);if(!m)return null;let n=m.map(Number);if(s.startsWith('color('))n=[n[0]*255,n[1]*255,n[2]*255,n.length>3?n[3]:1];return n.length>3?n:[...n,1]},lum=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)},mix=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3])).concat(1);
    const bgOf=el=>{const st=[];for(let e=el;e&&e.nodeType===1;e=e.parentElement){const s=getComputedStyle(e);if(s.backgroundImage&&s.backgroundImage!=='none')return null;const c=rgba(s.backgroundColor);if(c&&c[3]>0){st.push(c);if(c[3]>.95)break}if(e.tagName==='DIALOG')break}if(!st.length)return null;let base=st[st.length-1][3]>.95?st[st.length-1]:[255,255,255,1];for(let i=st.length-1;i>=0;i--)base=st[i][3]>.95?st[i]:mix(st[i],base);return base};
    const cr=(f,b)=>{const L1=lum(f),L2=lum(b);return (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05)};const out=[];const W=document.documentElement.clientWidth;
    for(const el of root.querySelectorAll('*')){if(!el.checkVisibility({opacityProperty:true,visibilityProperty:true}))continue;const bx=el.getBoundingClientRect();if(!bx.width)continue;
     if(bx.right>W+1){let sc=false;for(let e=el.parentElement;e&&e!==root.parentElement;e=e.parentElement){const o=getComputedStyle(e).overflowX;if(o!=='visible'){sc=true;break}}if(!sc&&!(el instanceof SVGElement))out.push('wide '+el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0])}
     const s=getComputedStyle(el);
     if(el.tagName==='svg'&&bx.width<80){const bg=bgOf(el);if(bg){let best=0;for(const sh of el.querySelectorAll('path,circle,rect,line,polyline,ellipse')){const ss=getComputedStyle(sh);for(const k of ['stroke','fill']){const c=rgba(ss[k]);if(c&&c[3]>.3)best=Math.max(best,cr(c,bg))}}if(best&&best<2.2)out.push('icon '+(el.parentElement.className||el.parentElement.tagName).toString().split(' ')[0]+' '+best.toFixed(2))}}
     const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1);if(!own||+s.opacity<.99)continue;const fg=rgba(s.color),bg=bgOf(el);if(!fg||!bg)continue;const r=cr(fg[3]<1?mix(fg,bg):fg,bg);const big=parseFloat(s.fontSize)>=18.6||(parseFloat(s.fontSize)>=14&&+s.fontWeight>=700);
     if(r<(big?3:4.5))out.push('text '+el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0]+' "'+el.textContent.trim().slice(0,16)+'" '+r.toFixed(2))}
    return out});
   if(r===null)add('no dialog: '+name,v+'/'+m);else r.forEach(x=>add(name+': '+x.replace(/ [\d.]+$/,''),v+'/'+m+' '+(x.match(/[\d.]+$/)||[''])[0]));
   errs.slice(before).forEach(e=>add('error in '+name,v+'/'+m+' '+e));
   await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(100)}
  await c.close()}
 const ks=Object.keys(R).sort();console.log(ks.map(k=>k+'  ['+R[k].size+'] '+[...R[k]].slice(0,3).join(', ')).join('\n')||'clean');await b.close()})();
