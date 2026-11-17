// Tile icons stand out from their chip in every vibe, light and dark (at least 3:1, the bar for icons), sit inside
// their tile, and the tiles carry no coloured glow. Recipe stats, the coffee page, 2026 in coffee, the profile.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const seed=require('./seed2.cjs');
for(const vibe of ['roastery','pure','black','nordic'])for(const theme of ['light','dark']){
  const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
  await p.goto('http://localhost:8099/index.html');await p.evaluate(seed);
  await p.evaluate(([v,t])=>{const u=JSON.parse(localStorage.getItem('bb-ui')||'{}');u.vibe=v;localStorage.setItem('bb-ui',JSON.stringify(u));localStorage.setItem('bb-theme',t);
    localStorage.setItem('bb-profile',JSON.stringify({nick:'M',name:'',brief:'Hi.',city:'Oman',brewer:'sw',origin:'yemen',style:'sweet',since:Date.now(),updated:Date.now()}))},[vibe,theme]);
  await p.reload();await p.waitForTimeout(1300);
  const check=()=>p.evaluate(()=>{const cv=document.createElement('canvas');cv.width=cv.height=1;const cx=cv.getContext('2d',{willReadFrequently:true});
    const rgb=c=>{cx.clearRect(0,0,1,1);cx.fillStyle='#000';cx.fillStyle=c;cx.fillRect(0,0,1,1);const d=cx.getImageData(0,0,1,1).data;return [d[0],d[1],d[2]]};
    const L=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
    const cr=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
    const out=[],root=[...document.querySelectorAll('dialog[open]')].pop()||document;
    // [glyph element, chip element]
    const pairs=[...root.querySelectorAll('.yic-t>i .di,.me-sq i .di,.me-tiles>div>i .di')].map(g=>[g,g.closest('i'),'color'])
      .concat([...root.querySelectorAll(':is(.specs,.rstats,.stats)>div.tl .st-ic')].map(g=>[g,g,'stroke']))
      .concat([...root.querySelectorAll('.fig-ic svg')].map(g=>[g,g.closest('.fig-ic'),'stroke']));
    for(const [g,c,prop] of pairs){if(!g.getClientRects().length)continue;const gc=getComputedStyle(g)[prop],bc=getComputedStyle(c).backgroundColor;if(/rgba\(0, 0, 0, 0\)|transparent/.test(bc)){out.push({tile:(c.textContent||'').trim().slice(0,24),chip:'none'});continue}const r=cr(rgb(gc),rgb(bc));
      const t=g.getBoundingClientRect(),tile=c.closest('.yic-t,.me-sq>div,.me-tiles>div,div.tl,.figs>span')||c,tr=tile.getBoundingClientRect();
      const inside=t.left>=tr.left-1&&t.right<=tr.right+1&&t.top>=tr.top-1&&t.bottom<=tr.bottom+1;
      if(r<3||!inside)out.push({tile:(tile.textContent||'').trim().slice(0,24),contrast:+r.toFixed(2),inside})}
    const glow=[...root.querySelectorAll('.yic-t,.me-sq>div,.me-tiles>div,div.tl')].filter(e=>/-1[0-9]px/.test(getComputedStyle(e).boxShadow)).length;
    return {n:pairs.length,bad:out,glow}});
  const views=[['recipe',"openRecipe(3)"],['coffee',"openBean(BEANS[0].id)"],['profile',"openMe()"],['beans',"goTab('beans');const e=$('bg-yic');if(e&&!e.firstChild){e.innerHTML=yearInCoffeeHTML();hydrateImgs(e)}"]];
  for(const [n,js] of views){await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(300);await p.evaluate(js);await p.waitForTimeout(800);
    const r=await check();ok(vibe+' '+theme+' '+n+': '+r.n+' icons clear and in place, no glow',r.n>0&&!r.bad.length&&!r.glow,r)}
  ok(vibe+' '+theme+': no page errors',!errs.length,errs);await p.close()}
await b.close()})();
