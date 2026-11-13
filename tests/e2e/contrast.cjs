const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const bad=[];
for(const th of ['light','dark'])for(const vibe of ['roastery','oat','matcha','blossom','nordic','desert','neon','caramel','pure','black']){const c=await b.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});
await c.addInitScript(([t,v])=>{sessionStorage.setItem('bb-splashed','1');localStorage.setItem('bb-theme',t);localStorage.setItem('bb-ui',JSON.stringify({vibe:v}))},[th,vibe]);const p=await c.newPage();
await p.goto('http://localhost:8099/index.html');await p.waitForTimeout(700);
await p.evaluate(()=>{showTab('scan');document.getElementById('scan-text').value='Origin: Colombia\nVariety: Pink Bourbon\nProcess: Anaerobic natural\nRoast: light';runLocalScan(false)});await p.waitForTimeout(800);
const r1=await p.evaluate(sel=>{const L=c=>{let m=c.match(/[\d.]+/g).map(Number);if(/^color\(/.test(c))m=m.map(x=>x*255);const f=x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};
 const bg=e=>{for(let x=e;x;x=x.parentElement){const s=getComputedStyle(x);const b=s.backgroundColor;if(b&&!/rgba\(.*, 0\)|transparent/.test(b)&&s.backgroundImage==='none')return b;if(s.backgroundImage!=='none'){/*gradient: sample via surface2*/return getComputedStyle(document.documentElement).getPropertyValue('--surface2').trim()?null:null}}return 'rgb(255,255,255)'};
 return [...document.querySelectorAll(sel)].filter(e=>e.offsetParent).map(e=>{let b=bg(e);if(!b){const d=document.createElement('div');d.style.background='var(--surface2)';document.body.appendChild(d);b=getComputedStyle(d).backgroundColor;d.remove()}const a=L(getComputedStyle(e).color),bb=L(b);const r=(Math.max(a,bb)+.05)/(Math.min(a,bb)+.05);return [e.textContent.trim().slice(0,20),+r.toFixed(2)]})},'.cuptraits em, .cuptraits b');
await p.evaluate(()=>goTab('explore'));await p.waitForTimeout(600);
const r2=await p.evaluate(()=>{const L=c=>{let m=c.match(/[\d.]+/g).map(Number);if(/^color\(/.test(c))m=m.map(x=>x*255);const f=x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};const bg=getComputedStyle(document.querySelector('.today')).backgroundColor;
 return [...document.querySelectorAll('.today small,.today b,.td-t>span,.td-head span,.td-head h2')].map(e=>{const a=L(getComputedStyle(e).color),bb=L(bg);return [e.textContent.trim().slice(0,20),+((Math.max(a,bb)+.05)/(Math.min(a,bb)+.05)).toFixed(2)]})});
for(const [t,r] of [...r1,...r2])if(r<4.5)bad.push([th,vibe,t,r]);await c.close()}
console.log(bad.length?JSON.stringify(bad,null,0):'all text 4.5:1 or better');await b.close()})();
