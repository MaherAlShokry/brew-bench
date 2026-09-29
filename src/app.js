/* ================= UTIL ================= */
const $=id=>document.getElementById(id);
// Coalesce redraws from sliders and typing into one per frame, so dragging stays smooth.
const SOON=new Map();function soon(fn){if(!SOON.has(fn))SOON.set(fn,requestAnimationFrame(()=>{SOON.delete(fn);fn()}))}
const clamp=(v,a=0,b=10)=>Math.max(a,Math.min(b,v));
// Width of a string in a given CSS font, for sizing SVG labels.
const textW=(()=>{const c=document.createElement('canvas').getContext('2d');return(t,font)=>{c.font=font+' '+getComputedStyle(document.body).fontFamily;return c.measureText(t).width}})();
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Saved data can be from an older version or damaged, so only accept the shape we expect.
function load(k,d){let v;try{const t=localStorage.getItem(k);v=t?JSON.parse(t):d}catch(e){return d}
  if(Array.isArray(d))return Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):d;
  if(d===null||typeof d==='object')return v&&typeof v==='object'&&!Array.isArray(v)?v:d;return v}
const num=(v,d,a=-Infinity,b=Infinity)=>{v=+v;return Number.isFinite(v)?Math.min(b,Math.max(a,v)):d};
const oneOf=(v,list,d)=>list.includes(v)?v:d;
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const MQ=q=>!!(window.matchMedia&&window.matchMedia(q).matches);const RM=()=>MQ('(prefers-reduced-motion: reduce)');
let toastT;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600)}
// A small, quick burst of beans from the button that was tapped (a celebration, not a curtain over the content).
function beans(n=10){if(RM())return;const el=document.activeElement,r=el&&el!==document.body?el.getBoundingClientRect():null;
  const x0=r?r.left+r.width/2:innerWidth/2,y0=r?r.top+r.height/2:innerHeight*.6;
  for(let i=0;i<n;i++){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','-12 -8 24 16');s.setAttribute('width',12+Math.random()*6);s.classList.add('bean-fx');
    s.innerHTML='<ellipse rx="11" ry="7" fill="'+(['#8A5A3B','#6B4028','#A0714F','#6B8E4E'][i%4])+'"/><path d="M-9 0 Q0 -3 9 0" stroke="#F3EADC" stroke-width="1.6" fill="none"/>';
    s.style.left=x0+'px';s.style.top=y0+'px';document.body.appendChild(s);
    const a=-Math.PI/2+(Math.random()-.5)*2.2,d=60+Math.random()*70,dx=Math.cos(a)*d,dy=Math.sin(a)*d;
    s.animate([{transform:'translate(-50%,-50%) scale(.6)',opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${Math.random()*360-180}deg) scale(1)`,opacity:1,offset:.6},
      {transform:`translate(calc(-50% + ${dx*1.15}px),calc(-50% + ${dy+40}px)) rotate(${Math.random()*360-180}deg) scale(.9)`,opacity:0}],{duration:800+Math.random()*200,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}).onfinish=()=>s.remove()}}
const ns='http://www.w3.org/2000/svg';

/* ================= GRINDERS ================= */
/* Every grinder maps its dial to one shared "effective size" scale, anchored on a V60:
   size = 1232 + (steps - v60) * k, where v60 is the grinder's typical V60 setting (in steps) and k is
   the effective size per step. Brewers sit on the same scale (from the calibrated ZP6 / K-Ultra table),
   so any grinder can be placed for any brewer, and one grinder's setting can be matched on another.
   fmt 'rot': 1Zpresso-style rotation.number.click ring (per clicks per rotation, 10 clicks per number).
   fmt 'num': a plain dial: shown as first + steps/sub (sub 3 = thirds, like 4, 4.1, 4.2); unit 'clicks' counts from closed. */
const V60_SIZE=56*22;
const GRINDER_LIB={
  zp6:{name:'ZP6 Special',full:'1Zpresso ZP6 Special',type:'manual',brand:'1Zpresso',fmt:'rot',per:90,um:22,min:20,max:90,v60:56,k:22,body:-0.4,clarity:1.2,espresso:false,
    burr:'48 mm hexagonal (six-sided) conical steel burrs, designed only for filter',adjust:'External ring: 9 numbers per turn, 10 clicks per number, 90 clicks per rotation, about 22 microns per click',
    range:'Filter roughly 4.5 to 7.0 (45 to 70 clicks). Below about 2.0 the burrs rub, so no espresso or Turkish.',cup:'The fewest fines in the 1Zpresso range: very clean, separated, high-clarity cups.',use:'Washed coffees, Geisha and Ethiopian landraces, V60, NEO, Origami, Chemex.'},
  kultra:{name:'K-Ultra',full:'1Zpresso K-Ultra',type:'manual',brand:'1Zpresso',fmt:'rot',per:100,um:20,min:5,max:130,v60:80,k:20,pts:[[5,6],[10,97],[36,573],[80,1232],[130,2232]],body:0.7,clarity:-0.2,espresso:true,
    burr:'48 mm heptagonal (seven-sided) "K burr" conical steel burrs, an all-rounder',adjust:'External ring: 10 numbers per turn, 10 clicks per number, 100 clicks per rotation, 20 microns per click. Can go past one full turn.',
    range:'Filter roughly 7.0 to 9.5 (70 to 95 clicks). Espresso around 2.5 to 4.5; French press and cold brew past one full turn.',cup:'More body and a rounder, more blended cup than the ZP6.',use:'Naturals and honeys, immersion, espresso, AeroPress, anything that tastes thin.'},
  jxpro:{name:'JX-Pro',full:'1Zpresso JX-Pro',type:'manual',brand:'1Zpresso',fmt:'rot',per:40,um:12.5,min:20,max:160,v60:92,k:13,body:0.4,clarity:0,espresso:true,
    burr:'48 mm conical steel burrs',adjust:'External ring: 4 numbers per turn, 10 clicks per number, 40 clicks per rotation, about 12.5 microns per click',
    range:'Espresso about 1.0.0 to 1.2.0; filter about 2.0.0 to 2.8.0.',cup:'Balanced with medium body.',use:'Espresso at home plus everyday filter.'},
  comandante:{name:'Comandante C40',full:'Comandante C40 MK4',type:'manual',brand:'Comandante',fmt:'num',unit:'clicks',sub:1,first:0,um:30,min:5,max:45,v60:25,k:55,body:0.3,clarity:0.4,espresso:false,
    burr:'39 mm "Nitro Blade" high-nitrogen steel conical burrs',adjust:'No numbers: count clicks from fully closed, about 30 microns per click',
    range:'AeroPress about 15 to 20 clicks, V60 about 22 to 28, French press about 30 to 35. Espresso needs a finer-step axle.',cup:'Clear yet sweet, very consistent.',use:'Pour-over and AeroPress; a classic travel grinder.'},
  c3:{name:'Timemore C3',full:'Timemore Chestnut C3',type:'manual',brand:'Timemore',fmt:'num',unit:'clicks',sub:1,first:0,min:6,max:32,v60:18,k:75,body:0.4,clarity:-0.3,espresso:false,
    burr:'38 mm S2C stainless steel conical burrs',adjust:'Count clicks from fully closed',
    range:'AeroPress about 13 to 17 clicks, V60 about 16 to 22, French press about 22 to 26. Stay above 6 clicks: finer can dull the burrs.',cup:'Sweet with fuller body; a little muddier than premium grinders.',use:'Budget pour-over and immersion.'},
  k6:{name:'Kingrinder K6',full:'Kingrinder K6',type:'manual',brand:'Kingrinder',fmt:'num',unit:'clicks',sub:1,first:0,um:16,min:15,max:200,v60:95,k:11,body:0.1,clarity:0.4,espresso:true,
    burr:'48 mm heptagonal conical steel burrs',adjust:'External dial, 60 clicks per turn, about 16 microns per click; count clicks from closed',
    range:'Espresso about 30 to 50 clicks, V60 about 85 to 105, French press about 130 to 150.',cup:'Clean and bright for the price.',use:'All-round value: espresso to French press.'},
  ode2:{name:'Fellow Ode Gen 2',full:'Fellow Ode Brew Grinder Gen 2',type:'electric',brand:'Fellow',fmt:'num',sub:3,first:1,min:0,max:30,v60:12,k:45,body:-0.2,clarity:0.8,espresso:false,
    burr:'64 mm flat stainless steel "Gen 2" brew burrs',adjust:'Dial 1 to 11 with two steps between numbers (31 settings)',
    range:'AeroPress about 3 to 5, V60 about 4 to 6, French press about 7 to 9. Not for espresso.',cup:'Very clear and separated: flat-burr filter clarity.',use:'Pour-over and batch brew.'},
  encore:{name:'Baratza Encore',full:'Baratza Encore',type:'electric',brand:'Baratza',fmt:'num',sub:1,first:1,min:0,max:39,v60:15,k:40,body:0.3,clarity:-0.5,espresso:false,
    burr:'40 mm conical steel burrs (M3)',adjust:'40 numbered settings',
    range:'AeroPress about 8 to 12, V60 about 14 to 18, French press about 28 to 32.',cup:'Fuller body, more fines; forgiving.',use:'Everyday drip, Chemex and French press.'},
  virtuoso:{name:'Baratza Virtuoso+',full:'Baratza Virtuoso+',type:'electric',brand:'Baratza',fmt:'num',sub:1,first:1,min:0,max:39,v60:15,k:40,body:0.2,clarity:-0.2,espresso:false,
    burr:'40 mm conical steel burrs (M2)',adjust:'40 numbered settings with a digital timer',
    range:'AeroPress about 8 to 12, V60 about 14 to 18, French press about 28 to 32.',cup:'Balanced, a step cleaner than the Encore.',use:'Pour-over, drip and immersion.'},
  wilfa:{name:'Wilfa Uniform',full:'Wilfa Svart Uniform',type:'electric',brand:'Wilfa',fmt:'num',sub:1,first:1,min:0,max:40,v60:19,k:30,body:0,clarity:0.4,espresso:false,
    burr:'58 mm flat steel burrs',adjust:'41 numbered settings, weight-based dosing',
    range:'AeroPress about 10 to 14, V60 about 18 to 22, French press about 34 to 38.',cup:'Even grind with good clarity.',use:'Filter coffee in a home kitchen.'},
  niche:{name:'Niche Zero',full:'Niche Zero',type:'electric',brand:'Niche',fmt:'num',sub:1,first:0,min:0,max:50,v60:40,k:25,pts:[[0,300],[14,573],[40,1232],[50,1716]],body:0.8,clarity:-0.3,espresso:true,
    burr:'63 mm conical steel burrs, single dosing',adjust:'Stepless dial numbered 0 to 50',
    range:'Espresso about 10 to 20, AeroPress about 20 to 30, V60 about 35 to 45, French press 45 to 50.',cup:'Rich, syrupy body; classic conical sweetness.',use:'Espresso first, filter too.'},
  df64:{name:'DF64',full:'Turin DF64 Gen 2',type:'electric',brand:'Turin',fmt:'num',sub:1,first:0,min:0,max:90,v60:52,k:18.8,body:0,clarity:0.6,espresso:true,
    burr:'64 mm flat steel burrs (stock Italmill); popular to upgrade',adjust:'Stepless dial numbered 0 to 90',
    range:'Espresso about 15 to 20, V60 about 45 to 65, French press about 75 to 90. Every DF64 is zeroed differently, so check yours.',cup:'Clear, flat-burr profile; depends on the burrs fitted.',use:'Single-dose espresso and filter.'},
  jmax:{name:'J-Max',full:'1Zpresso J-Max',type:'manual',brand:'1Zpresso',fmt:'rot',per:90,um:8.8,min:40,max:260,v60:164,k:8,body:0.6,clarity:0,espresso:true,
    burr:'48 mm conical steel burrs, espresso-focused',adjust:'External ring: 9 numbers per turn, 10 clicks per number, 90 clicks per rotation, about 8.8 microns per click',
    range:'Espresso roughly 0.7.0 to 1.0.0; filter roughly 1.6.0 to 2.2.0 (past one full turn).',cup:'Rich and textured; very fine steps for dialing espresso.',use:'Espresso first, filter too.'},
  jultra:{name:'J-Ultra',full:'1Zpresso J-Ultra',type:'manual',brand:'1Zpresso',fmt:'rot',per:100,um:8,min:40,max:280,v60:180,k:7.3,body:0.5,clarity:0.2,espresso:true,
    burr:'48 mm heptagonal conical steel burrs (the K-Ultra shape, tuned for espresso)',adjust:'External ring: 10 numbers per turn, 10 clicks per number, 100 clicks per rotation, 8 microns per click',
    range:'Espresso roughly 0.8.0 to 1.1.0; filter roughly 1.7.0 to 2.3.0.',cup:'Syrupy espresso, cleaner filter than the J-Max.',use:'Espresso and precise filter dialing.'},
  jx:{name:'JX',full:'1Zpresso JX',type:'manual',brand:'1Zpresso',fmt:'rot',per:30,um:25,min:10,max:90,v60:50,k:26,body:0.4,clarity:0,espresso:false,
    burr:'48 mm conical steel burrs',adjust:'Internal dial: 3 numbers per turn, 10 clicks per number, 30 clicks per rotation, about 25 microns per click',
    range:'AeroPress roughly 1.1.0 to 1.2.0; V60 roughly 1.1.5 to 1.2.5; French press 2.0.0 and up.',cup:'Balanced with medium body.',use:'Everyday filter and AeroPress on a budget.'},
  xpro:{name:'X-Pro',full:'1Zpresso X-Pro',type:'manual',brand:'1Zpresso',fmt:'rot',per:40,um:12.5,min:20,max:160,v60:92,k:13,body:0.4,clarity:0.1,espresso:true,
    burr:'48 mm conical steel burrs',adjust:'External ring: 4 numbers per turn, 10 clicks per number, 40 clicks per rotation, about 12.5 microns per click',
    range:'Espresso about 1.0.0 to 1.2.0; filter about 2.0.0 to 2.8.0.',cup:'Balanced with medium body; like the JX-Pro with a folding handle.',use:'Travel espresso and filter.'},
  xultra:{name:'X-Ultra',full:'1Zpresso X-Ultra',type:'manual',brand:'1Zpresso',fmt:'rot',per:60,um:12.5,min:20,max:170,v60:95,k:12.4,body:0.5,clarity:0.2,espresso:true,
    burr:'48 mm heptagonal conical steel burrs',adjust:'External ring: 6 numbers per turn, 10 clicks per number, 60 clicks per rotation, about 12.5 microns per click',
    range:'Espresso roughly 0.4.0 to 1.0.0; filter roughly 1.3.0 to 1.5.0.',cup:'Sweet and full; the compact version of the K burr.',use:'All-rounder for travel.'},
  kmax:{name:'K-Max / K-Plus',full:'1Zpresso K-Max, K-Plus and K-Pro',type:'manual',brand:'1Zpresso',fmt:'rot',per:90,um:22,min:10,max:120,v60:65,k:20,body:0.6,clarity:0,espresso:true,
    burr:'48 mm "K burr" conical steel burrs',adjust:'External ring: 9 numbers per turn, 10 clicks per number, 90 clicks per rotation, about 22 microns per click',
    range:'Espresso roughly 2.5 to 3.5; filter roughly 6.0 to 8.0; French press about 9.0 and up.',cup:'Full and sweet; the K-Ultra\'s older siblings.',use:'Filter with body, AeroPress, occasional espresso.'},
  q2:{name:'Q2 / Q Air',full:'1Zpresso Q2 S and Q Air',type:'manual',brand:'1Zpresso',fmt:'rot',per:30,um:25,min:8,max:90,v60:48,k:26,body:0.5,clarity:-0.1,espresso:false,
    burr:'38 mm heptagonal conical steel burrs',adjust:'Internal dial: 3 numbers per turn, 10 clicks per number, 30 clicks per rotation, about 25 microns per click',
    range:'AeroPress roughly 1.0.0 to 1.2.0; V60 roughly 1.1.5 to 1.2.5; French press 2.0.0 and up.',cup:'Sweet and a little heavier than bigger burrs.',use:'Small travel grinder for filter.'},
  cmdred:{name:'C40 + Red Clix',full:'Comandante C40 with Red Clix',type:'manual',brand:'Comandante',fmt:'num',unit:'clicks',sub:1,first:0,um:15,min:8,max:90,v60:50,k:27.5,body:0.3,clarity:0.4,espresso:true,
    burr:'39 mm "Nitro Blade" conical burrs',adjust:'Red Clix axle doubles the clicks: about 15 microns per click, counted from fully closed',
    range:'Espresso about 12 to 20 clicks, AeroPress about 30 to 40, V60 about 44 to 56.',cup:'The C40 cup with finer steps.',use:'When you want espresso and filter from a Comandante.'},
  c2:{name:'Timemore C2',full:'Timemore Chestnut C2',type:'manual',brand:'Timemore',fmt:'num',unit:'clicks',sub:1,first:0,min:3,max:36,v60:19,k:50,body:0.4,clarity:-0.4,espresso:false,
    burr:'38 mm stainless steel conical burrs',adjust:'Count clicks from fully closed. Stay above 3 clicks: finer can dull the burrs.',
    range:'AeroPress about 14 to 18 clicks, V60 about 18 to 22, French press about 26 to 30.',cup:'Sweet and full, with more fines.',use:'Entry-level pour-over.'},
  c3esp:{name:'C3 ESP Pro',full:'Timemore Chestnut C3 ESP Pro',type:'manual',brand:'Timemore',fmt:'rot',per:30,um:23.3,min:10,max:110,v60:56,k:21.3,body:0.4,clarity:-0.2,espresso:true,
    burr:'38 mm S2C conical steel burrs',adjust:'External dial: 3 numbers per turn, 10 clicks per number, 30 clicks per rotation, about 23 microns per click; read as rotation.number.click',
    range:'Espresso about 0.8 to 1.1 turns from zero (24 to 33 clicks, shown as 2.4 to 1.0.3); pour-over roughly 1.1.5 to 2.0.0.',cup:'Sweet and full.',use:'Budget espresso and filter.'},
  s3:{name:'Timemore S3',full:'Timemore Chestnut S3',type:'manual',brand:'Timemore',fmt:'num',sub:10,first:0,um:15,min:1,max:90,v60:58,k:21,body:0.1,clarity:0.6,espresso:false,
    burr:'42 mm stainless steel "S2C" conical burrs, tuned for filter',adjust:'External dial: 9 numbers with 10 clicks each (90 settings), about 15 microns per click',
    range:'AeroPress about 4.3 to 4.8, V60 about 5.0 to 6.5, Chemex about 6.2 to 7.0, French press about 8.0 to 9.0. Not for espresso (Timemore makes an S3 ESP for that).',cup:'Clean and sweet with good separation; a pour-over specialist.',use:'V60, Origami, Chemex, AeroPress.'},
  c3spro:{name:'C3S Pro',full:'Timemore Chestnut C3S Pro',type:'manual',brand:'Timemore',fmt:'num',sub:1,first:0,min:3,max:36,v60:18,k:66,body:0.4,clarity:-0.2,espresso:true,
    burr:'38 mm S2C stainless steel conical burrs',adjust:'External numbered dial; steps are smaller in the espresso zone than in the filter zone',
    range:'Espresso roughly 5 to 9, AeroPress about 14, V60 about 16 to 21, French press about 25. Stay above 3 to protect the burrs.',cup:'Sweet with medium body, a little cleaner than the C3.',use:'Budget all-rounder with an easy-to-read dial.'},
  k4:{name:'Kingrinder K4',full:'Kingrinder K4',type:'manual',brand:'Kingrinder',fmt:'num',unit:'clicks',sub:1,first:0,um:16,min:15,max:200,v60:95,k:11,body:0.3,clarity:0.2,espresso:true,
    burr:'48 mm conical steel burrs',adjust:'External dial, 60 clicks per turn, about 16 microns per click; count clicks from closed',
    range:'Espresso about 30 to 50 clicks, V60 about 85 to 105, French press about 130 to 150.',cup:'Balanced, a little more body than the K6.',use:'All-round value.'},
  skerton:{name:'Hario Skerton Pro',full:'Hario Skerton Pro',type:'manual',brand:'Hario',fmt:'num',unit:'clicks',sub:1,first:0,min:1,max:18,v60:9,k:120,body:0.5,clarity:-0.8,espresso:false,
    burr:'38 mm ceramic conical burrs',adjust:'Count clicks from fully closed; large steps',
    range:'AeroPress about 6 to 7 clicks, V60 about 8 to 10, French press about 12 to 14.',cup:'Heavy body, muddier than steel burrs.',use:'Immersion and camping.'},
  minimill:{name:'Hario Mini Mill Plus',full:'Hario Mini Mill Slim Plus',type:'manual',brand:'Hario',fmt:'num',unit:'clicks',sub:1,first:0,min:1,max:16,v60:9,k:110,body:0.5,clarity:-0.9,espresso:false,
    burr:'ceramic conical burrs',adjust:'Count clicks from fully closed; large steps',
    range:'AeroPress about 6 to 7 clicks, V60 about 8 to 10, French press about 12 to 14.',cup:'Full body with lots of fines.',use:'Travel and immersion.'},
  porlex:{name:'Porlex Mini II',full:'Porlex Mini II',type:'manual',brand:'Porlex',fmt:'num',unit:'clicks',sub:1,first:0,min:1,max:18,v60:9,k:120,body:0.5,clarity:-0.7,espresso:false,
    burr:'ceramic conical burrs',adjust:'Count clicks from fully closed',
    range:'AeroPress about 6 to 8 clicks, V60 about 8 to 10, French press about 12 to 14.',cup:'Full body with fines.',use:'Travel; fits inside an AeroPress.'},
  opus:{name:'Fellow Opus',full:'Fellow Opus Conical Burr Grinder',type:'electric',brand:'Fellow',fmt:'num',sub:4,first:1,min:0,max:40,v60:18,k:36,body:0.6,clarity:-0.3,espresso:true,
    burr:'40 mm conical steel burrs',adjust:'Dial 1 to 11 with three marks between numbers (41 settings), plus an inner ring for finer espresso steps',
    range:'Espresso about 1 to 2 (use the inner ring), AeroPress about 3.2 to 4.2, V60 about 4.3 to 6, French press about 8 to 10.',cup:'Balanced with some body.',use:'Espresso to cold brew on one grinder.'},
  sgp:{name:'Breville Smart Grinder Pro',full:'Breville (Sage) Smart Grinder Pro',type:'electric',brand:'Breville',fmt:'num',sub:1,first:1,min:0,max:59,v60:23,k:24,pts:[[0,380],[11,573],[23,1232],[53,1716],[59,1810]],body:0.4,clarity:-0.5,espresso:true,
    burr:'40 mm conical steel burrs',adjust:'60 numbered settings with a timer; the espresso settings are packed into the low numbers, so steps are not even',
    range:'Espresso about 8 to 15, pour-over about 18 to 28, French press about 50 to 60.',cup:'Fuller body, some fines.',use:'Espresso machines and everyday brewing.'},
  oxo:{name:'OXO Conical Burr',full:'OXO Brew Conical Burr Grinder',type:'electric',brand:'OXO',fmt:'num',sub:1,first:1,min:0,max:14,v60:7,k:80,body:0.4,clarity:-0.6,espresso:false,
    burr:'40 mm conical steel burrs',adjust:'15 numbered settings',
    range:'AeroPress about 4 to 6, V60 about 7 to 9, French press about 12 to 15.',cup:'Full body, forgiving.',use:'Drip and French press.'},
  ek43:{name:'Mahlkönig EK43',full:'Mahlkönig EK43',type:'electric',brand:'Mahlkönig',fmt:'num',sub:10,first:0,min:0,max:160,v60:80,k:8.8,body:-0.2,clarity:0.9,espresso:true,
    burr:'98 mm flat cast steel burrs',adjust:'Stepless dial numbered 0 to 16 (read to one decimal)',
    range:'Dials vary by model and burr alignment. Roughly: espresso 0.3 to 1, AeroPress 5 to 7, V60 7.5 to 9, French press 12 to 14.',cup:'The café standard for clarity and high extraction.',use:'Specialty cafés, competition pour-over.'}
};
// Your own grinders, added in Gear (same fields; values in steps).
let CUSTOM_G=load('bb-custom-grinders',{});
for(const [id,g] of Object.entries(CUSTOM_G))if(!g||typeof g.name!=='string'||!Number.isFinite(g.v60)||!Number.isFinite(g.k)||g.k<=0)delete CUSTOM_G[id];
for(const g of Object.values(CUSTOM_G))delete g.pts;
const GRINDERS=Object.assign({},GRINDER_LIB,CUSTOM_G);
// One recipe "step" is the same change in grind size on every grinder, so offsets carry over exactly.
for(const G of Object.values(GRINDERS)){if(G.fmt==='num'){G.sub=G.sub||1;G.first=G.first||0}G.full=G.full||G.name}
// The grinders you use; the app shows settings for these.
let MYG=(()=>{try{const v=JSON.parse(localStorage.getItem('bb-mygrinders'));return Array.isArray(v)?v.filter(g=>typeof g==='string'&&GRINDERS[g]):[]}catch(e){return[]}})();if(!MYG.length)MYG=['zp6','kultra'];MYG=[...new Set(MYG)];
const gname=g=>GRINDERS[g]?GRINDERS[g].name:g;
function dial(g,c){const G=GRINDERS[g];c=Math.round(c);
  if(G.fmt==='rot'){const r=Math.floor(c/G.per),rem=c%G.per;return (r>0?r+'.':'')+Math.floor(rem/10)+'.'+(rem%10)}
  if(G.sub>1){const n=Math.floor(c/G.sub)+G.first,r=c%G.sub;return G.sub===10?n+'.'+r:(r?n+'.'+r:String(n))}
  return String(c+G.first)}
function dialHint(g,c){const G=GRINDERS[g];c=Math.round(c);
  if(G.fmt==='rot'){const r=Math.floor(c/G.per),rem=c%G.per;return (r?r+' rotation, ':'')+'number '+Math.floor(rem/10)+', click '+(rem%10)+' ('+c+' clicks)'}
  return G.unit==='clicks'?c+' clicks from fully closed':'setting '+dial(g,c)}
// Read a typed setting ("5.6", "1.2.4", "24", "4.1") back into steps.
function parseDial(g,str){const G=GRINDERS[g],p=String(str).trim().split(/[.,]/).map(x=>parseInt(x,10));if(p.some(isNaN)||!p.length)return null;
  if(G.fmt==='rot'){if(p.length===3)return p[0]*G.per+p[1]*10+p[2];if(p.length===2)return p[0]*10+p[1];return p[0]}
  if(G.sub>1)return (p[0]-G.first)*G.sub+(p[1]||0);return p[0]-G.first}
function roundG(g,v){const G=GRINDERS[g];return Math.round(clamp(v,G.min,G.max))}
// Where a brewer sits on the shared scale (from the tuned ZP6 / K-Ultra table).
function brewSize(b){const bb=BREWERS[b].base;return bb.zp6!=null?bb.zp6*22:bb.kultra!=null?sizeOf('kultra',bb.kultra):null}
const needsFine=b=>BREWERS[b].base.zp6==null;
// Grinders with uneven dials list [steps, size] points instead, and are read piecewise.
function interp(P,x,a,b){let i=1;while(i<P.length-1&&x>P[i][a])i++;const p=P[i-1],q=P[i];return p[b]+(x-p[a])*(q[b]-p[b])/(q[a]-p[a])}
const sizeOf=(g,c)=>{const G=GRINDERS[g];return G.pts?interp(G.pts,c,0,1):V60_SIZE+(c-G.v60)*G.k};
const stepsFor=(g,size)=>{const G=GRINDERS[g];return G.pts?interp(G.pts,size,1,0):G.v60+(size-V60_SIZE)/G.k};
// Move a setting by a change in grind size (160 on the shared scale is one recipe step), unrounded.
const shift=(g,c,ds)=>stepsFor(g,sizeOf(g,c)+ds);
// How far a setting sits from another, in recipe steps (positive = finer).
const stepsBetween=(g,from,c)=>(sizeOf(g,from)-sizeOf(g,c))/160;
function defBase(g,b,raw){if(g==='zp6'||g==='kultra'&&needsFine(b))return BREWERS[b].base[g];const G=GRINDERS[g],E=brewSize(b);if(E==null||(needsFine(b)&&!G.espresso))return null;
  const s=stepsFor(g,E);return s<G.min-0.5||s>G.max+0.5?null:raw?clamp(s,G.min,G.max):Math.round(clamp(s,G.min,G.max))}
let BASE=load('bb-base3',null);if(!BASE||typeof BASE!=='object')BASE={};
for(const g in BASE)if(!BASE[g]||typeof BASE[g]!=='object')delete BASE[g];
if(!BASE.zp6){const old=load('bb-base2',null);if(old&&old.zp6)for(const g of['zp6','kultra'])if(old[g]&&typeof old[g]==='object'){BASE[g]={};for(const k in old[g])if(Number.isFinite(old[g][k]))BASE[g][k]=old[g][k]}}
for(const g in BASE)for(const k in BASE[g])if(!BREWERS[k]||BASE[g][k]!==null&&!Number.isFinite(BASE[g][k]))delete BASE[g][k];
// Your calibrated setting for a grinder on a brewer, or the estimate from the shared scale.
function base(g,b){const v=BASE[g]&&BASE[g][b];return v==null?defBase(g,b):v}
// The same, unrounded: used when converting between grinders so the result lands on the nearest click.
function baseX(g,b){const v=BASE[g]&&BASE[g][b];return v==null?defBase(g,b,true):v}
const canGrind=(g,b)=>!!GRINDERS[g]&&base(g,b)!=null;
// First of your grinders that can do this brewer (falls back to any grinder in the library).
const capable=b=>MYG.find(g=>canGrind(g,b))||Object.keys(GRINDERS).find(g=>canGrind(g,b));
function settingFor(g,b,off){const bb=baseX(g,b);return bb==null?null:roundG(g,shift(g,bb,-off*160))}
function gLabel(g,v){const G=GRINDERS[g];return G.name+' '+dial(g,v)+(G.unit==='clicks'?' clicks':'')}
/* ================= YOUR RECIPES ================= */
// Recipes you or your team create sit after the built-in ones in RECIPES, so the timer, dial-in and planner all work with them.
// World championship recipes join the built-in ones, so the timer, dial-in and planner work with them.
for(const ch of CHAMPS){const r=ch.rec;if(!r)continue;
  if(r.same){const x=RECIPES.find(q=>q.name===r.same);if(x){x.champ=ch;ch.ri=RECIPES.indexOf(x);r.b=x.b;r.off=x.off}continue}
  // The champion's own grinder and setting set the grind when they were published; otherwise the recipe's description does.
  const g=r.grind&&r.grind.g;r.off=g&&GRINDERS[g]&&canGrind(g,r.b)?Math.round(stepsBetween(g,baseX(g,r.b),r.grind.c)*10)/10:(r.off||0);
  if(!r.steps||!r.water)continue;
  RECIPES.push({b:r.b,kind:r.kind||'other',name:ch.who+' ('+COMPS[ch.c].short+' '+ch.y+')',by:ch.who+', '+ch.y+' '+COMPS[ch.c].name+' champion',off:r.off,
    temp:r.temp||BREWERS[r.b].temp.def,temp2:r.temp2,dose:r.dose,water:r.water,why:r.why,steps:r.steps,tip:r.alt||'',champ:ch});ch.ri=RECIPES.length-1}
// Where a champion's full recipe was not published, a similar recipe already in the app is the starting point.
for(const ch of CHAMPS){const s=ch.rec&&ch.rec.start;if(s){const i=RECIPES.findIndex(q=>q.name===s);if(i>=0)ch.si=i}}
const BUILTIN_N=RECIPES.length,RKINDS=['pulse','single','imm','aero','esp','hybrid','46','other'];
const str=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
// Recipes can arrive from links and other phones, so every field is checked.
function sanRec(r){if(!r||typeof r!=='object'||!BREWERS[r.b])return null;const name=str(r.name,60);if(!name)return null;
  const steps=(Array.isArray(r.steps)?r.steps:[]).map(x=>str(x,160)).filter(Boolean).slice(0,20);
  return{id:str(r.id,40)||('r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),custom:true,b:r.b,kind:RKINDS.includes(r.kind)?r.kind:'other',name,by:str(r.by,60),author:str(r.author,30),
    dose:num(r.dose,15,1,200),water:num(r.water,250,5,3000),temp:num(r.temp,93,0,100),off:num(r.off,0,-4,4),why:str(r.why,400),tip:str(r.tip,300),steps:steps.length?steps:['0:00 brew.'],ts:num(r.ts,Date.now())}}
let CREC=load('bb-myrecipes',[]).map(sanRec).filter(Boolean);
function syncRecipes(){RECIPES.length=BUILTIN_N;CREC.slice().sort((a,b)=>a.ts-b.ts).forEach(r=>RECIPES.push(r))}
syncRecipes();
const MODEL=Object.keys(BREWERS).filter(k=>BREWERS[k].model);
function brewerOptions(list){const types=[...new Set(list.map(k=>BREWERS[k].type))];return types.map(t=>'<optgroup label="'+t+'">'+list.filter(k=>BREWERS[k].type===t).map(k=>'<option value="'+k+'">'+esc(BREWERS[k].name)+'</option>').join('')+'</optgroup>').join('')}

/* ================= VARIETY HELPERS ================= */
const SUBM={panama:{},costarica:{sweet:0.2,acid:-0.2,clarity:-0.1},colombia:{body:0.3,clarity:-0.1,sweet:0.1},ethiopia:{body:-0.2,acid:0.2},other:{clarity:-0.2,body:0.1}};
function vById(id){return VBY[String(id).split(':')[0]]}
function vParams(id){const [b,s]=String(id).split(':');const v=VBY[b];const m=Object.assign({},FAM[v.fam].d,v.m||{});if(s&&SUBM[s])for(const k in SUBM[s])m[k]=(m[k]||0)+SUBM[s][k];return m}
function vName(id){const [b,s]=String(id).split(':');const v=VBY[b];if(s&&v.subs){const x=v.subs.find(q=>q.k===s);if(x)return x.name}return v.name}
function varietyOptions(){let h='';for(const f in FAM){const list=V.filter(v=>v.fam===f&&v.id!=='arabica');if(!list.length)continue;h+='<optgroup label="'+FAM[f].name+'">';
  for(const v of list){h+='<option value="'+v.id+'">'+esc(v.name)+'</option>';if(v.subs)for(const s of v.subs)h+='<option value="'+v.id+':'+s.k+'">\u00a0\u00a0'+esc(s.name)+'</option>'}h+='</optgroup>'}return h}
function processOptions(){return Object.entries(PCAT).map(([c,n])=>'<optgroup label="'+n+'">'+Object.entries(PROCESSES).filter(([,p])=>p.cat===c).map(([k,p])=>'<option value="'+k+'">'+esc(p.name)+'</option>').join('')+'</optgroup>').join('')}
const ALLO=()=>({...O,...PTS});
const originName=k=>(ALLO()[k]||{}).name||k;

/* ================= STATE ================= */
let S=Object.assign({grinder:'zp6',setting:56,brewer:'v60',temp:93,ratio:15,bloom:45,agit:'med',roast:'light',process:'washed',variety:'caturra',rec:null},load('bb-state',{}));
S.agit=oneOf(S.agit,['low','med','high'],'med');S.roast=oneOf(S.roast,['light','medium','dark'],'light');
S.setting=num(S.setting,56);S.temp=num(S.temp,93);S.ratio=num(S.ratio,15);S.bloom=num(S.bloom,45);if(S.rec!=null&&!RECIPES[S.rec])S.rec=null;
if(typeof S.variety!=='string'||!vById(S.variety))S.variety='caturra';if(!BREWERS[S.brewer]||!BREWERS[S.brewer].model)S.brewer='v60';if(!PROCESSES[S.process])S.process='washed';
if(S.grinder==='kultra'&&S.setting<30&&S.setting>5&&S.setting%1)S.setting=Math.round(S.setting*10);
// If the saved grinder is gone or can't do this brewer, move to one of yours and carry the grind across, never the raw click number.
if(!MYG.includes(S.grinder)||!canGrind(S.grinder,S.brewer)){const g=MYG.find(x=>canGrind(x,S.brewer))||capable(S.brewer);
  S.setting=GRINDERS[S.grinder]&&canGrind(S.grinder,S.brewer)&&canGrind(g,S.brewer)?convertSetting(S,g,S.brewer):base(g,S.brewer);S.grinder=g}
S.setting=roundG(S.grinder,S.setting);
let LOG=load('bb-log',[]);

/* ================= MODEL ================= */
function rBias(r){const B=BREWERS[r.b];return -(0.45*r.off+(r.temp-93)/3*0.35+(r.water/r.dose-B.ratio.ref)*B.ratio.k)}
function compute(st){
  const G=GRINDERS[st.grinder],B=BREWERS[st.brewer],P=PROCESSES[st.process],Vp=vParams(st.variety);
  const step=stepsBetween(st.grinder,baseX(st.grinder,st.brewer),st.setting);
  const agit={low:-0.25,med:0,high:0.25}[st.agit], roastE={light:0,medium:0.25,dark:0.6}[st.roast];
  const rec=st.rec!=null&&RECIPES[st.rec]&&RECIPES[st.rec].b===st.brewer?RECIPES[st.rec]:null;
  const E=0.45*step+(st.temp-93)/3*0.35+(st.bloom-B.bloom.def)/15*0.12+agit+(st.ratio-B.ratio.ref)*B.ratio.k+roastE+(rec?rBias(rec):0);
  const D=E-(P.t+Vp.t);
  const roastAcid={light:1,medium:0,dark:-2}[st.roast], roastBit={light:0,medium:0.6,dark:2}[st.roast];
  const strengthTerm=B.ratio.ref>10?(B.ratio.ref-st.ratio)*0.5:(B.ratio.ref-st.ratio)*1.2;
  return {D,step,
    sweet:clamp(7.8-2.3*Math.pow(Math.abs(D),1.15)+P.sweet+Vp.sweet),
    acid:clamp(4.8-1.5*D+P.acid+Vp.acid+roastAcid),
    body:clamp(4.4+0.8*step+B.body+G.body+P.body+Vp.body+strengthTerm+(st.roast==='dark'?0.8:0)),
    clarity:clamp(5.4-0.7*step+G.clarity+B.clarity-P.funk+Vp.clarity-Math.max(0,D)*0.9),
    bitter:clamp(0.8+Math.max(0,D)*2.4+roastBit+Math.max(0,st.temp-96)*0.3)};
}
function verdict(D){
  if(D<-1.2)return['Under-extracted','Sour, thin and hollow. The flavours feel unfinished.'];
  if(D<-0.45)return['Bright and light','Lively and clear, a touch lean. Some sweetness left in the bean.'];
  if(D<=0.45)return['In the sweet spot','Balanced sweetness, acidity and body for this coffee.'];
  if(D<=1.2)return['Heavy and sweet','Syrupy and deep, acidity muted, starting to edge toward dry.'];
  return['Over-extracted','Drying, bitter, papery finish. Aromatics buried.'];
}
function strength(st){const B=BREWERS[st.brewer];if(B.ratio.ref<5)return st.ratio<1.6?'Very concentrated':st.ratio<=2.5?'Classic espresso strength':'Long and light';if(B.ratio.ref<10)return'Strong, made for milk and ice';return st.ratio<14.5?'Strong':st.ratio<=16?'Medium strength':'Light strength'}

/* ================= CUP + DIAL ================= */
function mix(a,b,t){const p=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const A=p(a),B=p(b);return'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'}
function liquid(D){const x=clamp(D,-2,2);const st=['#D9B35A','#C98A3E','#7A4524','#4A2A18','#1E120B'];const pos=x+2;const i=Math.min(3,Math.floor(pos));return mix(st[i],st[i+1],pos-i)}
function drawCup(r){
  // Cup on a saucer, seen from above; the flavour radar floats on the coffee and the labels sit outside the saucer.
  const ax=[['Sweetness',r.sweet],['Acidity',r.acid],['Body',r.body],['Clarity',r.clarity],['Bitterness',r.bitter]];
  const cx=210,cy=172,R=64,ang=i=>-Math.PI/2+i*2*Math.PI/5,pt=(i,v)=>[cx+Math.cos(ang(i))*R*v/10,cy+Math.sin(ang(i))*R*v/10];
  const poly=v=>ax.map((a,i)=>pt(i,v==null?a[1]:v).map(n=>n.toFixed(1)).join(',')).join(' ');
  let g='';for(const k of[2.5,5,7.5,10])g+='<polygon points="'+poly(k)+'" fill="none" stroke="rgba(255,255,255,'+(k===10?.3:.16)+')"/>';
  g+=ax.map((_,i)=>{const p=pt(i,10);return'<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="rgba(255,255,255,.16)"/>'}).join('');
  // Top and bottom labels read on one line; the side labels stack the score under the name.
  // Labels sit well outside the saucer: the top one centred, the sides stacked, the bottom two aligned away from the saucer.
  const lab=ax.map((a,i)=>{const an=ang(i),x=(cx+Math.cos(an)*134).toFixed(1),y=cy+Math.sin(an)*134,side=Math.abs(Math.cos(an))>0.6,
      anchor=i===0?'middle':Math.cos(an)>0?'start':'end',v='<tspan font-weight="800" fill="var(--cherry)">'+a[1].toFixed(1)+'</tspan>',T=(yy,s)=>'<text x="'+x+'" y="'+yy.toFixed(1)+'" text-anchor="'+anchor+'" font-size="14" font-weight="600" fill="var(--ink)">'+s+'</text>';
    return side?T(y-3,a[0])+T(y+15,v):T(y+(i===0?-2:14),a[0]+'  '+v)}).join('');
  $('cup').innerHTML='<circle cx="'+cx+'" cy="'+cy+'" r="106" fill="var(--surface2)"/><circle cx="'+cx+'" cy="'+cy+'" r="88" fill="var(--paper)" stroke="var(--line)" stroke-width="2"/>'+
   '<circle cx="'+cx+'" cy="'+cy+'" r="79" fill="'+liquid(r.D)+'" style="transition:fill .4s ease"/><circle cx="'+cx+'" cy="'+cy+'" r="79" fill="none" stroke="rgba(255,235,200,.35)" stroke-width="3"/>'+g+
   '<polygon points="'+poly()+'" fill="none" stroke="rgba(30,18,11,.35)" stroke-width="5" stroke-linejoin="round"/>'+
   '<polygon points="'+poly()+'" fill="rgba(255,245,225,.32)" stroke="#FFF3DD" stroke-width="2.5" stroke-linejoin="round"/>'+
   ax.map((a,i)=>{const p=pt(i,a[1]);return'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4" fill="#FFF3DD" stroke="rgba(30,18,11,.35)"/>'}).join('')+lab;
}
function drawDial(id,g,c){
  const G=GRINDERS[g],svg=$(id);if(!svg)return;c=Math.round(c);
  if(G.fmt!=='rot'){// A 270-degree gauge from the grinder's finest to coarsest setting.
    const t=(c-G.min)/Math.max(1,G.max-G.min),A=i=>(135+i*270)*Math.PI/180,P=(r,i)=>(80+Math.cos(A(i))*r).toFixed(1)+' '+(80+Math.sin(A(i))*r).toFixed(1);
    let h='<circle cx="80" cy="80" r="74" fill="var(--surface2)"/><path d="M'+P(60,0)+' A60 60 0 1 1 '+P(60,1)+'" fill="none" stroke="var(--line)" stroke-width="8" stroke-linecap="round"/>';
    h+='<path d="M'+P(60,0)+' A60 60 0 '+(t>2/3?1:0)+' 1 '+P(60,clamp(t,0.001,1))+'" fill="none" stroke="var(--cherry)" stroke-width="8" stroke-linecap="round"/>';
    h+='<text x="80" y="78" text-anchor="middle" font-size="24" font-weight="800" fill="var(--ink)">'+dial(g,c)+'</text><text x="80" y="98" text-anchor="middle" font-size="10" fill="var(--muted)">'+(G.unit==='clicks'?'clicks':'setting')+'</text>'+
      '<text x="'+(80+Math.cos(A(0))*60).toFixed(1)+'" y="'+(80+Math.sin(A(0))*60+18).toFixed(1)+'" text-anchor="middle" font-size="9" fill="var(--muted)">fine</text><text x="'+(80+Math.cos(A(1))*60).toFixed(1)+'" y="'+(80+Math.sin(A(1))*60+18).toFixed(1)+'" text-anchor="middle" font-size="9" fill="var(--muted)">coarse</text>';
    svg.innerHTML=h;return}const nums=G.per/10,rem=c%G.per,rot=Math.floor(c/G.per);
  let h='<circle cx="80" cy="80" r="74" fill="var(--surface2)"/><circle cx="80" cy="80" r="52" fill="var(--paper)" stroke="var(--line)"/>';
  for(let i=0;i<G.per;i++){const a=-Math.PI/2+i/G.per*2*Math.PI,big=i%10===0,r1=big?60:65;const rub=g==='zp6'&&rot===0&&i<20;
    h+='<line x1="'+(80+Math.cos(a)*r1).toFixed(1)+'" y1="'+(80+Math.sin(a)*r1).toFixed(1)+'" x2="'+(80+Math.cos(a)*72).toFixed(1)+'" y2="'+(80+Math.sin(a)*72).toFixed(1)+'" stroke="'+(rub?'#C0503A':'var(--muted)')+'" stroke-width="'+(big?1.6:.7)+'" opacity="'+(big?1:.6)+'"/>'}
  for(let n=0;n<nums;n++){const a=-Math.PI/2+n/nums*2*Math.PI;h+='<text x="'+(80+Math.cos(a)*45).toFixed(1)+'" y="'+(84+Math.sin(a)*45).toFixed(1)+'" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">'+n+'</text>'}
  const a=-Math.PI/2+rem/G.per*2*Math.PI;
  h+='<line x1="80" y1="80" x2="'+(80+Math.cos(a)*70).toFixed(1)+'" y2="'+(80+Math.sin(a)*70).toFixed(1)+'" stroke="var(--cherry)" stroke-width="3" stroke-linecap="round"/><circle cx="80" cy="80" r="17" fill="var(--cherry)"/>'+
     '<text x="80" y="84" text-anchor="middle" font-size="11" font-weight="800" fill="var(--surface)">'+dial(g,c)+'</text>';
  svg.innerHTML=h;
}

/* ================= SEGMENTS ================= */
function seg(el,opts,get,set){$(el).innerHTML=opts.map(([v,l,dis])=>'<button type="button" data-v="'+v+'" aria-pressed="'+(get()===v)+'"'+(dis?' disabled title="'+esc(dis)+'"':'')+'>'+l+'</button>').join('');
  $(el).onclick=e=>{const b=e.target.closest('button');if(b&&!b.disabled)set(b.dataset.v)}}
// Your grinders as a picker. With more than three they wrap as chips instead of a segmented control.
const grinderOpts=b=>MYG.map(g=>[g,gname(g),canGrind(g,b)?'':'Can\u2019t grind for this brewer']);
function grinderSeg(id,b,get,set){const el=$(id);el.classList.toggle('filters',MYG.length>3);seg(id,grinderOpts(b),get,set)}

/* ================= DIAL-IN ================= */
function convertSetting(st,g2,b2){if(!canGrind(g2,b2)||!canGrind(st.grinder,st.brewer))return null;const step=stepsBetween(st.grinder,baseX(st.grinder,st.brewer),st.setting);return roundG(g2,shift(g2,baseX(g2,b2),-step*160))}
// Switching grinders back and forth converts from the setting you started on, so rounding never drifts.
let SWAP=null;
function swapGrinder(v){if(!SWAP||SWAP.b!==S.brewer||SWAP.out[S.grinder]!==S.setting)SWAP={b:S.brewer,src:{grinder:S.grinder,setting:S.setting,brewer:S.brewer},out:{[S.grinder]:S.setting}};
  if(SWAP.out[v]==null)SWAP.out[v]=convertSetting(SWAP.src,v,S.brewer);return SWAP.out[v]}
// The same grind on your other grinders, for the dial-in and recipes.
function equivLine(g,c,b){const o=MYG.filter(h=>h!==g&&canGrind(h,b)).map(h=>esc(gLabel(h,convertSetting({grinder:g,setting:c,brewer:b},h,b))));
  return (o.length?'Same grind: '+o.join(' · ')+' · ':'')+'<button type="button" class="linkbtn" data-match="'+g+'|'+c+'">'+(o.length?'All grinders':'Same grind on other grinders')+' →</button>'}
function openMatch(g,c){MATCH={g,v:dial(g,c)};showTab('gear');renderMatch();requestAnimationFrame(()=>$('gmatch').scrollIntoView({behavior:RM()?'auto':'smooth',block:'start'}))}
document.addEventListener('click',e=>{const m=e.target.closest('[data-match]');if(m){const [g,c]=m.dataset.match.split('|');if(GRINDERS[g])openMatch(g,+c)}});
function fitRanges(){const B=BREWERS[S.brewer];S.ratio=clamp(S.ratio,B.ratio.min,B.ratio.max);S.temp=clamp(S.temp,B.temp.min,B.temp.max);S.bloom=clamp(S.bloom,B.bloom.min,B.bloom.max)}
function render(){
  const G=GRINDERS[S.grinder],B=BREWERS[S.brewer];
  grinderSeg('g-grinder',(S.brewer),()=>S.grinder,v=>{if(v!==S.grinder){S.setting=swapGrinder(v);S.grinder=v}render()});
  seg('g-agit',[['low','Gentle'],['med','Normal'],['high','Vigorous']],()=>S.agit,v=>{S.agit=v;render()});
  seg('g-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>S.roast,v=>{S.roast=v;render()});
  const gi=$('i-grind');gi.min=G.min;gi.max=G.max;gi.step=1;gi.value=S.setting;
  $('v-grind').textContent=dial(S.grinder,S.setting);drawDial('dialsvg',S.grinder,S.setting);
  const r=compute(S);
  $('v-equiv').innerHTML=equivLine(S.grinder,S.setting,S.brewer);
  $('v-grindhint').textContent=(G.fmt==='rot'?'('+S.setting+' clicks) ':'')+(Math.abs(r.step)<0.15?'at your baseline':(r.step>0?'finer':'coarser')+' than baseline');
  const ti=$('i-temp');ti.min=B.temp.min;ti.max=B.temp.max;ti.value=S.temp;$('v-temp').textContent=S.temp+'°C';
  const ri=$('i-ratio');ri.min=B.ratio.min;ri.max=B.ratio.max;ri.step=B.ratio.step;ri.value=S.ratio;$('v-ratio').textContent='1:'+S.ratio;
  const bi=$('i-bloom');bi.min=B.bloom.min;bi.max=B.bloom.max;bi.step=B.bloom.max<=20?1:5;bi.value=S.bloom;$('v-bloom').textContent=S.bloom+'s';
  $('i-bloom').previousElementSibling.firstChild.textContent=B.bloom.label+' ';
  const rc=S.rec!=null&&RECIPES[S.rec]&&RECIPES[S.rec].b===S.brewer?RECIPES[S.rec]:null;
  $('rec-chip').innerHTML=rc?'<span class="chip">Recipe: '+esc(rc.name)+(rc.temp2?', then '+rc.temp2+'°C':'')+' <button type="button" data-clear style="background:none;border:0;cursor:pointer;color:inherit" aria-label="Clear recipe">\u2715</button></span>':'';
  $('i-brewer').value=S.brewer;$('i-process').value=S.process;$('i-variety').value=S.variety;
  const [vt,vs]=verdict(r.D);$('o-verdict').textContent=vt;$('mr-v').textContent=vt;$('mr-g').textContent=gLabel(S.grinder,S.setting)+', '+S.temp+'°C, 1:'+S.ratio;$('mr-m').style.left=((clamp(r.D,-2.5,2.5)+2.5)/5*100)+'%';$('o-summary').textContent=vs+' '+strength(S)+'.';
  $('o-marker').style.left=((clamp(r.D,-2.5,2.5)+2.5)/5*100)+'%';
  $('o-bars').innerHTML=[['Sweetness',r.sweet],['Acidity',r.acid],['Body',r.body],['Clarity',r.clarity],['Bitterness',r.bitter,'bitter']]
    .map(([n,v,c])=>'<div class="bar '+(c||'')+'"><span>'+n+'</span><div class="t"><b style="width:'+(v*10)+'%"></b></div><span class="num" style="font-size:.9rem">'+v.toFixed(1)+'</span></div>').join('');
  drawCup(r);
  const P=PROCESSES[S.process],Vv=vById(S.variety);
  let ch=[...Vv.notes.slice(0,3),...P.notes];
  if(r.D<-1.2)ch=['sour','grassy','thin',Vv.notes[0]];else if(r.D<-0.45)ch=['bright',...ch.slice(0,4)];
  else if(r.D>1.2)ch=['drying','bitter cocoa','papery','muted'];else if(r.D>0.45)ch=['syrupy','brown sugar',...Vv.notes.slice(0,2)];
  if(P.funk>=1.2&&r.D>0.45)ch.push('harsh ferment');
  $('o-chips').innerHTML=[...new Set(ch)].map(c=>'<span class="chip">'+esc(c)+'</span>').join('');
  const tips=[];
  {const bx=baseX(S.grinder,S.brewer),off=bx==null?0:stepsBetween(S.grinder,bx,S.setting);
    if(Math.abs(off)>2.5)tips.push('<b>'+esc(gLabel(S.grinder,S.setting))+' is much '+(off>0?'finer':'coarser')+' than '+art(brewName(B.name))+' '+esc(brewName(B.name))+' usually needs.</b> Most brews start around '+esc(dial(S.grinder,Math.round(bx)))+'. <button type="button" class="linkbtn" data-reset-grind>Reset to '+esc(dial(S.grinder,Math.round(bx)))+'</button>')}
  if(Math.abs(r.D)>0.4){const bx0=baseX(S.grinder,S.brewer);let t=roundG(S.grinder,shift(S.grinder,S.setting,r.D/0.45*160));
    // Stay inside the brewer's usual window (about 1.5 recipe steps either side of its baseline); the water temperature does the rest.
    if(bx0!=null){const lo=roundG(S.grinder,shift(S.grinder,bx0,-240)),hi=roundG(S.grinder,shift(S.grinder,bx0,240));t=r.D>0?Math.min(t,Math.max(hi,S.setting)):Math.max(t,Math.min(lo,S.setting))}const diff=Math.abs(t-S.setting);const ta=clamp(Math.round(S.temp-r.D/0.35*3),B.temp.min,B.temp.max);
    const unit=(G.fmt==='rot'||G.unit==='clicks'?'click':'step')+(diff===1?'':'s'),way=r.D>0?'coarser':'finer';
    if(diff)tips.push('To land in the sweet spot, try <b>'+gLabel(S.grinder,t)+'</b> ('+diff+' '+unit+' '+way+')'+(ta!==S.temp?', or keep the grind and move the water to <b>'+ta+'°C</b>.':'.'));
    else tips.push('The '+esc(G.name)+' is at the '+(r.D>0?'coarse':'fine')+' end of its range here'+(ta!==S.temp?', so move the water to <b>'+ta+'°C</b> instead.':'. Try another grinder or brewer.'))}
  if(r.clarity<4&&r.body>6.5&&B.ratio.ref>10)tips.push('Body is crowding out detail. The ZP6 Special, V60, V60 NEO or Chemex will separate the flavours more.');
  if(r.body<3.5&&r.D>-0.45&&B.ratio.ref>10)tips.push('Balanced but light. The K-Ultra, an immersion brewer or a tighter ratio will add weight.');
  if(P.funk>=1.2&&S.temp>92)tips.push(P.name+' coffees get harsh with hot water. Try 88 to 91°C.');
  if(vParams(S.variety).clarity>=0.8&&S.agit==='high')tips.push('Vigorous agitation flattens delicate aromatics. Go gentle.');
  if(S.roast==='dark'&&S.temp>92)tips.push('Dark roasts extract fast. 88 to 90°C keeps bitterness down.');
  if(P.cat==='decaf')tips.push('Decaf extracts faster than regular coffee. Start a few clicks coarser.');
  if(!tips.length)tips.push('Nothing to change on paper. Brew it, then adjust by taste.');
  $('o-tips').innerHTML=tips.map(t=>'<div class="tip">'+t+'</div>').join('');
  $('o-tips').onclick=e=>{if(e.target.closest('[data-reset-grind]')){S.setting=roundG(S.grinder,baseX(S.grinder,S.brewer));render();toast('Grind reset to '+dial(S.grinder,S.setting))}};
  save('bb-state',S);
}
function renderCal(){
  $('caltbody').innerHTML=MODEL.map(k=>{const b=BREWERS[k];const cell=g=>!canGrind(g,k)?'<td class="hint">n/a</td>':'<td><input type="number" step="1" data-g="'+g+'" data-b="'+k+'" value="'+base(g,k)+'" aria-label="'+GRINDERS[g].name+' clicks, '+esc(b.name)+'"> <span class="hint">'+dial(g,base(g,k))+'</span></td>';return'<tr><td>'+esc(b.name)+'</td>'+MYG.map(cell).join('')+'</tr>'}).join('');
  $('calhead').innerHTML='<th>Brewer</th>'+MYG.map(g=>'<th>'+esc(gname(g))+'</th>').join('');
}
function initDial(){
  $('i-brewer').innerHTML=brewerOptions(MODEL);
  for(const id of['i-process','p-process','s-process'])$(id).innerHTML=processOptions();
  for(const id of['i-variety','p-variety','s-variety'])$(id).innerHTML=varietyOptions();
  $('i-grind').oninput=e=>{S.setting=+e.target.value;soon(render)};
  $('i-temp').oninput=e=>{S.temp=+e.target.value;soon(render)};
  $('i-ratio').oninput=e=>{S.ratio=+e.target.value;soon(render)};
  $('i-bloom').oninput=e=>{S.bloom=+e.target.value;soon(render)};
  $('i-brewer').onchange=e=>{const nb=e.target.value;let g=S.grinder;if(!canGrind(g,nb)){g=capable(nb);toast(gname(S.grinder)+' can\u2019t grind for this brewer, switched to '+gname(g))}
    S.setting=canGrind(S.grinder,S.brewer)&&canGrind(g,nb)?convertSetting(S,g,nb):base(g,nb);S.grinder=g;S.brewer=nb;S.rec=null;
    const B=BREWERS[nb];if(S.ratio<B.ratio.min||S.ratio>B.ratio.max)S.ratio=B.ratio.def;if(S.bloom<B.bloom.min||S.bloom>B.bloom.max)S.bloom=B.bloom.def;fitRanges();render()};
  $('rec-chip').onclick=e=>{if(e.target.closest('[data-clear]')){S.rec=null;render()}};
  $('i-process').onchange=e=>{S.process=e.target.value;render()};
  $('i-variety').onchange=e=>{S.variety=e.target.value;render()};
  $('v-about').onclick=()=>openVariety(S.variety.split(':')[0]);
  renderCal();
  $('caltbody').oninput=e=>{const i=e.target;if(!i.dataset.g)return;const v=parseFloat(i.value);if(isNaN(v))return;(BASE[i.dataset.g]=BASE[i.dataset.g]||{})[i.dataset.b]=Math.round(v);save('bb-base3',BASE);i.nextElementSibling.textContent=dial(i.dataset.g,v);render();renderRecipes();renderPlan();renderGrindMap()};
  $('calreset').onclick=()=>{BASE={};save('bb-base3',BASE);renderCal();render();renderRecipes();renderPlan();renderGrindMap();toast('Calibration reset')};
}

/* ================= PLANNER ================= */
let PL=Object.assign({brewer:'v60',grinder:'zp6',tech:0,process:'washed',variety:'pinkbourbon',roast:'light',age:14,goal:'balance'},load('bb-plan',{}));if(!MYG.includes(PL.grinder))PL.grinder=MYG[0];
if(!vById(PL.variety))PL.variety='pinkbourbon';if(!PROCESSES[PL.process])PL.process='washed';
const PBREWERS=MODEL.filter(k=>k!=='swi'&&RECIPES.some(r=>r.b===k||((k==='sw'||k==='swneo')&&r.b==='swi')));
if(!PBREWERS.includes(PL.brewer))PL.brewer='v60';
function techList(b){const all=RECIPES.map((r,i)=>[r,i]);return all.filter(([r])=>r.b===b).concat(all.filter(([r])=>(b==='sw'||b==='swneo')&&r.b==='swi'))}
function plan(c){
  const tl=techList(c.brewer);if(!tl.find(([,i])=>i===c.tech))c.tech=tl[0][1];
  const r=RECIPES[c.tech],B=BREWERS[r.b],P=PROCESSES[c.process],Vp=vParams(c.variety),Vv=vById(c.variety);
  let grinder=GRINDERS[c.grinder]?c.grinder:MYG[0];if(!canGrind(grinder,r.b))grinder=capable(r.b);
  const why=[];let temp=r.temp;
  if(c.roast==='medium'&&temp>93){temp=93;why.push('Medium roast: water capped at 93°C so roasty notes don\u2019t turn bitter.')}
  if(c.roast==='dark'&&temp>90){temp=Math.max(B.temp.min,90);why.push('Dark roast: 90°C or below, because dark beans extract fast.')}
  if(c.roast==='light'&&temp<93&&!['pulse','kh1','kh2','aero'].includes(r.kind)){temp=93;why.push('Light roast: at least 93°C to get enough out of dense beans.')}
  if(P.funk>=1.2&&temp>91){temp=91;why.push(P.name+': 91°C keeps the ferment fruity instead of harsh.')}
  else if(P.funk>=0.6&&temp>93){temp=93;why.push(P.name+': 93°C holds the fruit together without muddiness.')}
  if(Vp.clarity>=0.8&&temp>93&&P.funk<1.2){temp=93;why.push(Vv.name+' is aromatic; hotter water would flatten the florals.')}
  if(Vp.t>=0.25&&c.process==='washed'&&c.roast==='light'&&temp<95&&B.ratio.ref>10){temp=95;why.push('Dense washed '+Vv.name+' rewards hotter water, 95°C, to build sweetness.')}
  if(P.cat==='decaf'){temp=Math.min(temp,92);why.push('Decaf extracts fast: a little cooler and coarser.')}
  temp=clamp(temp,B.temp.min,B.temp.max);
  let bloom=B.bloom.def;
  if(B.bloom.label==='Bloom'){
    if(c.age<=7){bloom=55;why.push('Very fresh beans ('+c.age+' days): longer 55s bloom to let the CO\u2082 out.')}
    else if(c.age>=30){bloom=30;why.push('Older beans ('+c.age+' days): little gas left, so a short 30s bloom.')}
    if(P.funk>=1.2&&bloom>35){bloom=35;why.push('Loud processes get a shorter bloom to avoid early over-extraction.')}
    if(c.roast==='dark')bloom=Math.min(bloom,30)}
  else if(c.age<=7)why.push('Very fresh beans: expect more crema and gushing; let them rest a few more days if shots are erratic.');
  let agit='med';if(Vp.clarity>=0.8||P.funk>=1.2){agit='low';why.push('Gentle pours: agitation mutes delicate aromatics and exaggerates ferment.')}
  let ratio=r.water/r.dose;const st_=B.ratio.step;
  if(c.goal==='clarity'){ratio+=st_;why.push('Clarity goal: slightly longer ratio for a lighter, more separated cup.')}
  if(c.goal==='body'){ratio-=st_;why.push('Body goal: slightly tighter ratio for more weight and sweetness.')}
  ratio=clamp(Math.round(ratio/st_)*st_,B.ratio.min,B.ratio.max);
  if(r.kind==='hedrick'&&c.roast!=='light')why.unshift('<b>Heads up:</b> this technique is built for light roasts.');
  if(r.temp2)why.unshift('Two temperatures: '+temp+'°C for the first stage, then about '+r.temp2+'°C as the steps say.');
  if(grinder!==c.grinder)why.unshift(gname(c.grinder)+' can\u2019t grind for this brewer, so settings are for '+gname(grinder)+'.');
  const Dt={clarity:-0.3,balance:0,body:0.3}[c.goal];
  const agv={low:-0.25,med:0,high:0.25}[agit], roastE={light:0,medium:0.25,dark:0.6}[c.roast];
  const rest=(temp-r.temp)/3*0.35+(bloom-B.bloom.def)/15*0.12+agv+(ratio-r.water/r.dose)*B.ratio.k+roastE-(P.t+Vp.t);
  const step=r.off+(Dt-rest)/0.45;
  const set={};for(const g of new Set([...MYG,grinder]))set[g]=canGrind(g,r.b)?roundG(g,shift(g,baseX(g,r.b),-step*160)):null;
  const water=Math.round(r.dose*ratio*10)/10;
  const st={grinder,setting:set[grinder],brewer:r.b,temp,ratio,bloom,agit,roast:c.roast,process:c.process,variety:c.variety,rec:c.tech};
  const tw=[],k=r.kind,gl=c.goal;
  const pick=(a,b,d)=>gl==='clarity'?a:gl==='body'?b:d;
  if(k==='46')tw.push(pick('Make pour 1 larger than pour 2 (70/50) for brightness.','Make pour 1 smaller than pour 2 (50/70) and split the rest into four pours.','Keep the first two pours equal.'));
  if(k==='hybrid')tw.push(pick('Open the valve about 15s earlier.','Open the valve about 15s later.','Open the valve on time.'));
  if(k==='hoff')tw.push(pick('Skip the stir and just swirl.','Keep the stir and swirl.','Follow as written.'));
  if(k==='imm')tw.push(pick('Shorten the steep by 30s.','Add 30s to the steep.','Steep as written.'));
  if(k==='pulse')tw.push(pick('Use fewer, larger pours.','Use smaller, more frequent pours.','Keep the level steady.'));
  if(k==='kh1'||k==='kh2')tw.push(pick('Keep the immersion water at the cool end (70°C).','Use the warmer end (75 to 80°C) and open 15s later.','Follow the timings as written.'));
  if(k==='neo'||k==='swneo')tw.push(pick('Pour a little gentler in the middle stage.','Stir with the stream in the second pour.','Keep strong, steady pours.'));
  if(k==='aero')tw.push(pick('Use a paper filter and press gently.','Try a metal filter or a longer steep.','Press slowly and stop at the hiss.'));
  if(k==='esp')tw.push(pick('Stretch the ratio a little longer.','Pull a touch shorter and hotter.','Aim for 25 to 30 seconds.'));
  if(k==='single'||k==='hoff1'||k==='flash'||k==='pulsar')tw.push(pick('Pour a little faster and gentler.','Pour slower for more contact time.','Follow as written.'));
  return {r,grinder,temp,bloom,agit,ratio,water,set,st,why,tw};
}
function planHTML(p,c){
  const res=compute(p.st),[vt]=verdict(res.D),B=BREWERS[p.r.b];
  const others=Object.keys(p.set).filter(g=>g!==p.grinder);const agl={low:'Gentle',med:'Normal',high:'Vigorous'}[p.agit];
  const gcell=g=>p.set[g]==null?'<div><b>'+GRINDERS[g].name+'</b><span>n/a</span><small>can\u2019t grind this fine</small></div>':'<div><b>'+GRINDERS[g].name+'</b><span>'+dial(g,p.set[g])+'</span><small>'+esc(dialHint(g,p.set[g]))+'</small></div>';
  return '<p class="hint" style="margin:0">'+esc(B.name)+' with '+GRINDERS[p.grinder].name+'</p><h2>'+esc(p.r.name)+'</h2><p class="hint" style="margin-top:0">'+esc(p.r.by)+'</p>'+
   '<p>'+esc(PROCESSES[c.process].name)+' '+esc(vName(c.variety))+', '+c.roast+' roast. Predicted: <b>'+vt+'</b>.</p>'+
   '<div class="specs">'+gcell(p.grinder)+others.map(gcell).join('')+
    '<div><b>Water</b><span>'+p.temp+'°C</span>'+(p.r.temp2?'<small>then about '+p.r.temp2+'°C</small>':'')+'</div>'+
    '<div><b>Dose : water</b><span>'+p.r.dose+'g : '+p.water+'g</span><small>1:'+p.ratio+'</small></div>'+
    '<div><b>'+B.bloom.label+'</b><span>'+p.bloom+'s</span></div><div><b>Agitation</b><span>'+agl+'</span></div></div>'+
   '<h3>Steps</h3><ol class="steps">'+p.r.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'+
   (p.tw.length?'<div class="tip">'+p.tw.join(' ')+'</div>':'')+
   '<h3>Why these settings</h3><ul class="why">'+(p.why.length?p.why.map(w=>'<li>'+w+'</li>').join(''):'<li>The recipe already suits this coffee.</li>')+
   '<li>Grind starts from the recipe\u2019s setting on your calibration, then moves to land the predicted extraction on your goal.</li></ul>';
}
function renderPlan(){
  $('p-brewer').value=PL.brewer;
  grinderSeg('p-grinder',(PL.brewer),()=>PL.grinder,v=>{PL.grinder=v;renderPlan()});
  seg('p-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>PL.roast,v=>{PL.roast=v;renderPlan()});
  seg('p-goal',[['clarity','Clarity'],['balance','Balance'],['body','Sweetness and body']],()=>PL.goal,v=>{PL.goal=v;renderPlan()});
  const tl=techList(PL.brewer);if(!tl.find(([,i])=>i===PL.tech))PL.tech=tl[0][1];
  $('p-tech').innerHTML=tl.map(([r,i])=>'<option value="'+i+'">'+esc(r.name)+'</option>').join('');
  $('p-tech').value=PL.tech;$('p-process').value=PL.process;$('p-variety').value=PL.variety;$('p-age').value=PL.age;$('pv-age').textContent=PL.age+' days';
  const p=plan(PL);
  $('p-out').innerHTML=planHTML(p,PL)+'<div class="actions"><button class="btn" id="p-load">Open in dial-in</button><button class="btn ghost" id="p-timer">Start brew timer</button><button class="btn ghost" id="p-share">Share</button><button class="btn ghost" id="p-var">About '+esc(vById(PL.variety).name)+'</button></div>';
  $('p-load').onclick=()=>{Object.assign(S,p.st);render();showTab('dial');toast('Loaded into the dial-in')};
  $('p-timer').onclick=()=>openTimer(PL.tech,p);$('p-share').onclick=()=>openShare(recipeDoc(PL.tech,p,PL));
  $('p-var').onclick=()=>openVariety(PL.variety.split(':')[0]);
  save('bb-plan',PL);
}
function initPlan(){
  $('p-brewer').innerHTML=brewerOptions(PBREWERS);
  $('p-brewer').onchange=e=>{PL.brewer=e.target.value;PL.tech=techList(PL.brewer)[0][1];if(!canGrind(PL.grinder,PL.brewer))PL.grinder=capable(PL.brewer);renderPlan()};
  $('p-tech').onchange=e=>{PL.tech=+e.target.value;renderPlan()};
  $('p-process').onchange=e=>{PL.process=e.target.value;renderPlan()};
  $('p-variety').onchange=e=>{PL.variety=e.target.value;renderPlan()};
  $('p-age').oninput=e=>{PL.age=+e.target.value;soon(renderPlan)};
}

/* ================= BREW TIMER ================= */
let TM=null;
function parseSteps(steps){let last=-1;return steps.map(s=>{const m=s.match(/(\d+):(\d\d)/);let t=m?(+m[1]*60+ +m[2]):null;if(t==null)t=last;else last=t;return{t,s}})}
function openTimer(idx,p){noteRecent(RECIPES[idx]);
  const r=RECIPES[idx];const ev=parseSteps(r.steps);const timed=ev.filter(e=>e.t>=0);
  const total=timed.length?Math.max(...timed.map(e=>e.t))+(/finish|drain|finished|serve/i.test(r.steps[r.steps.length-1])?0:30):0;
  if(TM&&TM.iv)clearInterval(TM.iv);
  TM={idx,ev,total,el:0,run:false,iv:null,lastIdx:-1,ctx:null};
  const setLine=p?('<p class="hint">'+(p.set[p.grinder]!=null?gLabel(p.grinder,p.set[p.grinder])+', ':'')+p.temp+'°C, '+p.r.dose+'g : '+p.water+'g</p>'):'<p class="hint">'+r.dose+'g : '+r.water+'g, '+r.temp+'°C</p>';
  $('tm-in').innerHTML='<div class="tm"><button class="vd-close" id="tm-x" aria-label="Close timer">\u2715</button><h2 id="tm-title" style="margin:0 36px 0 0;text-align:left">'+esc(r.name)+'</h2><div style="text-align:left">'+setLine+'</div>'+
   (total?'<svg class="ring" viewBox="0 0 220 220"><circle cx="110" cy="110" r="96" fill="none" stroke="var(--surface2)" stroke-width="14"/><circle id="tm-arc" cx="110" cy="110" r="96" fill="none" stroke="var(--cherry)" stroke-width="14" stroke-linecap="round" transform="rotate(-90 110 110)" stroke-dasharray="603" stroke-dashoffset="603"/><text id="tm-big" x="110" y="118" text-anchor="middle" font-size="40" font-weight="800" fill="var(--ink)">0:00</text></svg>'
    +'<div class="now" id="tm-now">Get your gear ready, then press start.</div><div class="actions" style="justify-content:center"><button class="btn" id="tm-go">Start</button><button class="btn ghost" id="tm-reset">Reset</button></div>'
    :'<p class="now">This one is by eye rather than the clock.</p>')+
   '<ol id="tm-list">'+ev.map((e,i)=>'<li data-i="'+i+'">'+esc(e.s)+'</li>').join('')+'</ol></div>';
  const d=$('timer');if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}
  $('tm-x').onclick=()=>d.close();
  // However the timer is closed (X, back, Escape, backdrop), stop it and let the screen sleep again.
  d.onclose=()=>{if(TM&&TM.iv)clearInterval(TM.iv);if(TM)TM.run=false;wake(false)};
  if(total){$('tm-go').onclick=()=>{if(!TM.ctx){try{TM.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}TM.run=!TM.run;$('tm-go').textContent=TM.run?'Pause':'Resume';wake(TM.run);
      if(TM.run){TM.t0=performance.now()-TM.el*1000;TM.iv=setInterval(tick,200);tick()}else clearInterval(TM.iv)};
    $('tm-reset').onclick=()=>{clearInterval(TM.iv);TM.run=false;wake(false);TM.el=0;TM.lastIdx=-1;$('tm-go').textContent='Start';paint()};paint()}
}
// Keep the screen on while a brew timer runs (where the browser supports it).
let WL=null;function wake(on){try{if(on&&!WL&&navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>{WL=l;l.addEventListener('release',()=>{WL=null})}).catch(()=>{});else if(!on&&WL){WL.release();WL=null}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&TM&&TM.run)wake(true)});
function beep(){if(!TM.ctx)return;try{const o=TM.ctx.createOscillator(),g=TM.ctx.createGain();o.frequency.value=880;g.gain.setValueAtTime(.001,TM.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.25,TM.ctx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,TM.ctx.currentTime+.35);o.connect(g).connect(TM.ctx.destination);o.start();o.stop(TM.ctx.currentTime+.4)}catch(e){}if(navigator.vibrate)navigator.vibrate(120)}
function tick(){TM.el=(performance.now()-TM.t0)/1000;if(TM.el>=TM.total){TM.el=TM.total;clearInterval(TM.iv);TM.run=false;wake(false);$('tm-go').textContent='Start';paint();$('tm-now').textContent='Done. Enjoy your cup.';beep();beans(26);return}paint()}
function paint(){const el=TM.el,m=Math.floor(el/60),s=Math.floor(el%60);$('tm-big').textContent=m+':'+String(s).padStart(2,'0');
  $('tm-arc').setAttribute('stroke-dashoffset',(603*(1-el/TM.total)).toFixed(1));
  let cur=-1;TM.ev.forEach((e,i)=>{if(e.t>=0&&e.t<=el)cur=i});
  if(cur!==TM.lastIdx&&TM.run&&cur>=0){beep();TM.lastIdx=cur}
  const next=TM.ev.find(e=>e.t>el);
  $('tm-list').querySelectorAll('li').forEach((li,i)=>{li.className=i<cur?'done':i===cur?'cur':''});
  if(TM.el>0&&TM.el<TM.total)$('tm-now').textContent=(cur>=0?TM.ev[cur].s:'')+(next?' Next in '+Math.ceil(next.t-el)+'s.':'');}

/* ================= TABS ================= */
// Heavy tabs are built the first time they are opened, which keeps startup quick.
const LAZY={champs:renderChamps,words:renderWords,flow:renderFlow,gear:buildGear,recipes:renderRecipes,tech:renderTech,process:renderProcesses,variety:renderVarieties,map:buildMap,history:()=>{buildTree();startQuiz()}},BUILT={};
function ensureTab(id){document.querySelectorAll('.bean-fx').forEach(b=>b.remove());if(LAZY[id]&&!BUILT[id]){BUILT[id]=1;LAZY[id]()}}
// NAVD counts tab changes you can step back through, so the app bar can offer a back button.
let BACKING=false,PEND_TAB=null,NAVD=0;
function showTab(id,fromHistory){ensureTab(id);document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x.dataset.t===id));
  document.querySelectorAll('main section').forEach(s=>s.classList.toggle('on',s.id===id));window.scrollTo({top:0});
  const t=document.querySelector('.tab[data-t="'+id+'"]');if(t)t.scrollIntoView({block:'nearest',inline:'center'});
  // Each tab gets a history entry, so the back button (browser or Android) returns to the last tab.
  if(!fromHistory&&location.hash!=='#'+id){NAVD++;if(BACKING)PEND_TAB=id;else try{history.pushState(null,'','#'+id)}catch(e){}}syncShell(id)}
try{history.scrollRestoration='manual'}catch(e){}
// Lock the page behind any open dialog or sheet so it can't scroll underneath.
{const sync=()=>document.documentElement.classList.toggle('locked',!!document.querySelector('dialog[open]'));
  const mo=new MutationObserver(sync);document.querySelectorAll('dialog').forEach(d=>{mo.observe(d,{attributes:true,attributeFilter:['open']});d.addEventListener('close',sync)})}
// An open dialog also gets a history entry, so back closes it instead of leaving the tab.
// When one sheet closes and another opens straight away (Share inside a sheet, Start timer from a recipe), the step back
// for the closed one is still on its way; it must not close the new sheet, which then gets its own entry.
// Back closes only the sheet on top (the share sheet over a recipe returns to the recipe).
const DSTACK=[];
{const sm=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){if(!this.open){if(!BACKING)try{history.pushState({dlg:1},'',location.hash||'#dial')}catch(e){}DSTACK.push(this);
  this.addEventListener('close',()=>{const i=DSTACK.indexOf(this);if(i>=0)DSTACK.splice(i,1);if(this.dataset.popped){delete this.dataset.popped;return}
    if(!BACKING&&history.state&&history.state.dlg){BACKING=true;history.back()}},{once:true})}return sm.call(this)}}
addEventListener('popstate',()=>{const open=[...document.querySelectorAll('dialog[open]')];
  if(BACKING){BACKING=false;try{if(PEND_TAB&&location.hash!=='#'+PEND_TAB)history.pushState(null,'','#'+PEND_TAB);if(open.length)history.pushState({dlg:1},'',location.hash||'#dial')}catch(e){}PEND_TAB=null;return}
  if(open.length){const top=DSTACK.filter(d=>d.open).pop();if(top){top.dataset.popped=1;top.close()}else open.forEach(d=>d.close());return}
  const h=location.hash.slice(1);if(openRoute(h))return;const id=h&&$(h)&&$(h).tagName==='SECTION'?h:'dial';if(!$(id).classList.contains('on')){NAVD=Math.max(0,NAVD-1);showTab(id,true)}});
document.querySelector('[role=tablist]').onclick=e=>{const t=e.target.closest('.tab');if(t)showTab(t.dataset.t)};

/* ================= RECIPES ================= */
// A recipe's details and buttons, used on its card and when it opens from a shared link.
function recipeBody(r,i,compact){const B=BREWERS[r.b];const gs=MYG.map(g=>[g,settingFor(g,r.b,r.off)]);
  return '<div class="meta"><span>'+esc(B.name)+'</span><span>'+r.dose+'g : '+r.water+'g</span>'+(r.temp?'<span>'+r.temp+'°C'+(r.temp2?' then '+r.temp2+'°C':'')+'</span>':'')+'</div>'+
   '<div class="meta">'+gs.map(([g,v])=>'<span>'+esc(v!=null?gLabel(g,v):gname(g)+': n/a')+'</span>').join('')+'</div>'+
   (r.why?'<p>'+esc(r.why)+'</p>':'')+(compact?'<details class="rsteps"><summary>Steps ('+r.steps.length+')</summary>':'')+'<ol class="steps">'+r.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'+(r.tip?'<p class="hint">'+esc(r.tip)+'</p>':'')+(compact?'</details>':'')+
   '<div class="actions"><button class="btn" data-timer="'+i+'">Start timer</button><button class="btn ghost" data-rshare="'+i+'">Share</button>'+(B.model?'<button class="btn ghost" data-load="'+i+'">Load into dial-in</button>':'')+(PBREWERS.includes(r.b==='swi'?'sw':r.b)?'<button class="btn ghost" data-plan="'+i+'">Tune in planner</button>':'')+(r.custom?'<button class="btn ghost" data-redit="'+esc(r.id)+'">Edit</button>':'')+'</div>'}
let RF='all',RQ='';
/* Favorites and recent brews, kept on this phone. A recipe's key survives app updates: its name for built-in
   recipes, its id for yours. */
const rkey=r=>r.custom?'c:'+r.id:'r:'+slug(r.name);
// Lists of recipe keys (plain strings), which load() would drop as it only keeps saved objects.
const loadKeys=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.length<120):[]}catch(e){return[]}};
let FAVS=new Set(loadKeys('bb-favs'));
let RECENT=loadKeys('bb-recent').slice(0,8);
const rByKey=k=>RECIPES.findIndex(r=>rkey(r)===k);
const favCount=()=>RECIPES.filter(r=>FAVS.has(rkey(r))).length;
const HEART='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-9-8.6C1.6 8.4 3.4 5 6.7 5c2 0 3.3 1.2 4.3 2.6C12 6.2 13.3 5 15.3 5c3.3 0 5.1 3.4 3.7 6.4C19 15.6 12 20 12 20z"/></svg>';
const favBtn=r=>{const k=rkey(r),on=FAVS.has(k);return '<button type="button" class="favbtn" data-fav="'+esc(k)+'" aria-pressed="'+on+'" aria-label="'+(on?'Remove from favorites':'Add to favorites')+'">'+HEART+'</button>'};
function toggleFav(k){if(FAVS.has(k))FAVS.delete(k);else FAVS.add(k);save('bb-favs',[...FAVS]);const on=FAVS.has(k);
  document.querySelectorAll('[data-fav]').forEach(b=>{if(b.dataset.fav===k){b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?'Remove from favorites':'Add to favorites')}});
  toast(on?'Added to favorites':'Removed from favorites');if(BUILT.recipes){renderRHome();if(RF==='fav')renderRecipes()}}
// Hearts work anywhere (cards, recipe sheets, champion sheets) without triggering the card underneath.
document.addEventListener('click',e=>{const b=e.target.closest('[data-fav]');if(b){e.stopPropagation();e.preventDefault();toggleFav(b.dataset.fav)}},true);
function noteRecent(r){if(!r)return;const k=rkey(r);RECENT=[k,...RECENT.filter(x=>x!==k)].slice(0,8);save('bb-recent',RECENT);if(BUILT.recipes)renderRHome()}
// Cup types: a quick way into the recipes by the kind of coffee you want.
const ICED=r=>BREWERS[r.b].type==='Cold'||/\b(iced|cold|flash)\b|đá/i.test(r.name);
const CI=p=>'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="'+p+'"/></svg>';
const CUPS=[
  ['pour','Pour-over','Clean, bright, layered','linear-gradient(135deg,#D8A15A,#8A5A3B)',r=>['Cone dripper','Flat-bottom dripper','Machine'].includes(BREWERS[r.b].type)&&!ICED(r),CI('M16 14h32L36 34H28z M26 34h12 M32 38v4 M20 44h24l-3 12H23z M44 46h4a4 4 0 0 1 0 8h-5')],
  ['imm','Immersion','Presses, switches, siphons','linear-gradient(135deg,#9C7A5B,#4F3A2A)',r=>(BREWERS[r.b].type==='Valve and hybrid'||['frenchpress','siphon'].includes(r.b))&&!ICED(r),CI('M20 16h24v38H20z M20 16h-3 M44 22h5a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3h-5 M32 8v8 M26 8h12 M22 28h20')],
  ['aero','AeroPress','Quick, punchy, travel-ready','linear-gradient(135deg,#7FA7A0,#3F6E66)',r=>r.b==='aeropress'&&!ICED(r),CI('M24 8h16v8H24z M22 16h20v26H22z M26 42h12v6H26z M18 50h28v6H18z M28 24h8')],
  ['esp','Espresso-like','Strong and concentrated','linear-gradient(135deg,#B0704A,#5B2E1A)',r=>['Espresso and stovetop','Boiled'].includes(BREWERS[r.b].type)&&!ICED(r),CI('M18 30h24v8a12 12 0 0 1-24 0z M42 32h4a4 4 0 0 1 0 8h-5 M12 52h40 M26 12c-2 3 2 5 0 8 M34 12c-2 3 2 5 0 8')],
  ['iced','Iced and cold','Flash brews and cold brews','linear-gradient(135deg,#8EB6D0,#4C7390)',ICED,CI('M18 14h28l-4 42H22z M24 26h7v7h-7z M33 32h7v7h-7z M27 40h7v7h-7z M40 8l-6 16')],
  ['champ','Championships','Recipes that won world titles','linear-gradient(135deg,#E2B866,#9A6A1E)',r=>!!r.champ,CI('M22 10h20v14a10 10 0 0 1-20 0z M22 14h-7a6 6 0 0 0 7 10 M42 14h7a6 6 0 0 1-7 10 M32 34v10 M24 54h16 M26 44h12v10H26z')]];
const CUPBY=Object.fromEntries(CUPS.map(c=>[c[0],c]));
function renderRHome(){const QI=(c,p)=>'<span class="qi" style="background:'+c+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+p+'"/></svg></span>';
  const again=RECENT.map(rByKey).filter(i=>i>=0).slice(0,6);
  $('rhome').innerHTML='<h3 class="rh">Quick links</h3><div class="qlinks">'+
    '<button type="button" data-q="surprise">'+QI('#2F80ED','M5 5h14v14H5z M9 9h.01 M15 9h.01 M12 12h.01 M9 15h.01 M15 15h.01')+'<span><b>Surprise me</b><small>Pick a random recipe</small></span></button>'+
    '<button type="button" data-q="mine">'+QI('#F2A33A','M4 20h4L19 9l-4-4L4 16z M13 7l4 4')+'<span><b>Your recipes</b><small>'+(CREC.length?'Yours and your team’s':'Create your own recipe')+'</small></span>'+(CREC.length?'<span class="qn">'+CREC.length+'</span>':'')+'</button>'+
    '<button type="button" data-q="fav">'+QI('#E0445A','M12 20s-7-4.4-9-8.6C1.6 8.4 3.4 5 6.7 5c2 0 3.3 1.2 4.3 2.6C12 6.2 13.3 5 15.3 5c3.3 0 5.1 3.4 3.7 6.4C19 15.6 12 20 12 20z')+'<span><b>Favorites</b><small>'+(favCount()?'Your go-to recipes':'Tap the heart on any recipe')+'</small></span>'+(favCount()?'<span class="qn">'+favCount()+'</span>':'')+'</button></div>'+
    (again.length?'<h3 class="rh">Brew again</h3><div class="again">'+again.map(i=>'<button type="button" data-again="'+i+'"><b>'+esc(RECIPES[i].name)+'</b><small>'+esc(BREWERS[RECIPES[i].b].name)+'</small></button>').join('')+'</div>':'')+
    '<h3 class="rh">Cup types</h3><div class="cups">'+CUPS.map(([k,n,d,g,f,ic])=>'<button type="button" class="cupcard" data-cup="'+k+'" aria-pressed="'+(RF==='cup:'+k)+'"><span class="cupart" style="--g:'+g+'">'+ic+'</span><b>'+esc(n)+'<span class="cc">'+RECIPES.filter(f).length+'</span></b><small>'+esc(d)+'</small></button>').join('')+'</div>'}
function showRecipeList(){renderRecipes();renderRHome();requestAnimationFrame(()=>$('rall').scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'}))}
$('rhome').onclick=e=>{const q=e.target.closest('[data-q]'),a=e.target.closest('[data-again]'),c=e.target.closest('[data-cup]');
  if(a){openRecipe(+a.dataset.again);return}
  if(c){const k='cup:'+c.dataset.cup;RF=RF===k?'all':k;RQ='';$('rsearch').value='';showRecipeList();return}
  if(!q)return;const k=q.dataset.q;
  if(k==='surprise'){const pool=RECIPES.map((r,i)=>i);openRecipe(pool[Math.floor(Math.random()*pool.length)]);return}
  if(k==='mine'){if(!CREC.length){openRecipeEditor(null);return}RF='mine'}
  if(k==='fav'){if(!favCount()){toast('Tap the heart on any recipe to save it here');return}RF='fav'}
  RQ='';$('rsearch').value='';showRecipeList()};
$('rsearch').oninput=e=>{RQ=e.target.value;if(RQ.trim()&&RF!=='all'){RF='all';renderRHome()}soon(renderRecipes)}; // a search looks through every recipe
const RF_NAME=()=>RF==='all'?'All recipes':RF==='fav'?'Favorites':RF==='mine'?'Yours and your team’s':RF==='champ'?'Champions':RF.startsWith('cup:')?CUPBY[RF.slice(4)][1]:RF;
function renderRecipes(){
  const types=[...new Set(Object.values(BREWERS).map(b=>b.type))];
  if(RF==='mine'&&!CREC.length)RF='all';if(RF==='fav'&&!favCount())RF='all';
  const cup=RF.startsWith('cup:')?CUPBY[RF.slice(4)]:null;
  seg('rfilter',[['all','All']].concat(cup?[[RF,cup[1]]]:[],favCount()?[['fav','♥ Favorites']]:[],CREC.length?[['mine','Yours & team']]:[],[['champ','Champions']],types.map(t=>[t,t])),()=>RF,v=>{RF=v;renderRecipes();renderRHome()});
  const q=fold(RQ.trim());
  const list=RECIPES.map((r,i)=>[r,i]).filter(([r])=>(RF==='all'||(RF==='mine'?r.custom:RF==='champ'?r.champ:RF==='fav'?FAVS.has(rkey(r)):cup?cup[4](r):BREWERS[r.b].type===RF))&&(!q||fold([r.name,r.by,r.why,BREWERS[r.b].name].join(' ')).includes(q)))
    .sort((a,b)=>(b[0].custom?1:0)-(a[0].custom?1:0));
  $('rall').textContent=RF_NAME()+' · '+list.length;
  $('rgrid').innerHTML=list.map(([r,i])=>'<article class="card'+(r.custom?' mine':'')+'">'+favBtn(r)+(r.custom?'<span class="pill ours">'+esc(r.author&&r.author!==ME?'From '+r.author:'Your recipe')+'</span>':'')+'<h3>'+esc(r.name)+'</h3>'+(r.by?'<p class="hint" style="margin-top:-.2rem">'+esc(r.by)+'</p>':'')+recipeBody(r,i,true)+'</article>').join('')||'<p class="hint">No recipes match. Try a shorter search, or pick All.</p>';
  if(!$('rhome').innerHTML)renderRHome();
}
function recipeAct(e){const ed=e.target.closest('[data-redit]');if(ed){openRecipeEditor(CREC.find(r=>r.id===ed.dataset.redit));return true}
  const b=e.target.closest('[data-load],[data-plan],[data-timer],[data-rshare]');if(!b)return false;if(b.dataset.rshare){openShare(recipeDoc(+b.dataset.rshare));return true}
  if(b.dataset.timer){openTimer(+b.dataset.timer);return true}
  if(b.dataset.load)loadRecipe(+b.dataset.load);else planRecipe(+b.dataset.plan);return true}
$('rgrid').onclick=recipeAct;
// A recipe opened from a shared link.
function openRecipe(i){const r=RECIPES[i],B=BREWERS[r.b],d=$('vd');
  d.querySelector('#vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">\u2715</button>'+favBtn(r)+'<span class="pill"><i style="background:var(--cherry)"></i>'+esc(r.custom?(r.author?'From '+r.author:'Your recipe'):'Recipe')+'</span><h2 id="vd-title">'+esc(r.name)+'</h2>'+(r.by?'<p class="hint" style="margin:0">'+esc(r.by)+'</p>':'')+'</div>'+
   '<div class="vd-body">'+recipeBody(r,i)+'</div>';
  d.querySelector('.vd-body').onclick=e=>{if(!e.target.closest('[data-load],[data-plan],[data-timer],[data-rshare],[data-redit]'))return;const sh=e.target.closest('[data-rshare]');if(!sh)d.close();recipeAct(e)};
  $('vd-x').onclick=()=>d.close();if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}d.scrollTop=0}
function loadRecipe(i){const r=RECIPES[i],B=BREWERS[r.b];S.brewer=r.b;S.rec=i;if(!canGrind(S.grinder,r.b))S.grinder=capable(r.b);S.setting=settingFor(S.grinder,r.b,r.off);S.temp=clamp(r.temp,B.temp.min,B.temp.max);S.bloom=B.bloom.def;S.agit='med';
  S.ratio=clamp(Math.round(r.water/r.dose/B.ratio.step)*B.ratio.step,B.ratio.min,B.ratio.max);render();showTab('dial');toast('Loaded '+r.name)}
function planRecipe(i){const r=RECIPES[i];PL.brewer=r.b==='swi'?'sw':r.b;PL.tech=i;if(!canGrind(PL.grinder,PL.brewer))PL.grinder=capable(PL.brewer);renderPlan();showTab('planner')}

/* ---------- Creating, editing and sharing recipes ---------- */
function recipesChanged(){syncRecipes();if(S.rec!=null&&!RECIPES[S.rec])S.rec=null;if(BUILT.recipes){renderRecipes();renderRHome()}renderPlan();render()}
function saveRecipe(r){const i=CREC.findIndex(x=>x.id===r.id);if(i>=0)CREC[i]=r;else CREC.push(r);save('bb-myrecipes',CREC);queue('put',r.id,r,'recipes');recipesChanged()}
function deleteRecipe(r){CREC=CREC.filter(x=>x.id!==r.id);save('bb-myrecipes',CREC);queue('del',r.id,null,'recipes');recipesChanged()}
// The editor: grind is set relative to each brewer's baseline, so it works on every grinder.
function openRecipeEditor(r,fresh){const isNew=!r||fresh;r=Object.assign({b:'v60',name:'',by:'',dose:15,water:250,temp:93,off:0,steps:['0:00 pour 50g, bloom.','0:45 pour to 150g.','1:30 pour to 250g.','3:00 finished.'],why:'',tip:''},r||{});
  const own=!r.author||r.author===ME;
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>'+(isNew?'New recipe':'Edit recipe')+'</span><h2 id="vd-title">'+(isNew?'Create a recipe':esc(r.name))+'</h2></div>'+
   '<div class="vd-body recform"><div class="field"><label for="re-name">Name</label><input id="re-name" maxlength="60" value="'+esc(r.name)+'" placeholder="e.g. Saturday V60"></div>'+
   '<div class="field"><label for="re-b">Brewer</label><select id="re-b">'+brewerOptions(Object.keys(BREWERS))+'</select></div>'+
   '<div class="three"><div class="field"><label for="re-dose">Coffee (g)</label><input id="re-dose" type="number" inputmode="decimal" value="'+r.dose+'"></div><div class="field"><label for="re-water">Water (g)</label><input id="re-water" type="number" inputmode="decimal" value="'+r.water+'"></div><div class="field"><label for="re-temp">Water °C</label><input id="re-temp" type="number" inputmode="numeric" value="'+r.temp+'"></div></div>'+
   '<div class="field"><label for="re-off">Grind <span class="hint" id="re-offl"></span></label><input id="re-off" type="range" min="-3" max="3" step="0.1" value="'+(-r.off)+'"><div class="rangeends"><span>Finer</span><span>Brewer baseline</span><span>Coarser</span></div><div class="meta" id="re-gs"></div></div>'+
   '<div class="field"><label for="re-steps">Steps <span class="hint">one per line; start with a time like 0:45 so the timer can follow</span></label><textarea id="re-steps" rows="6">'+esc(r.steps.join('\n'))+'</textarea></div>'+
   '<div class="field"><label for="re-why">Why it works <span class="hint">optional</span></label><textarea id="re-why" rows="2">'+esc(r.why)+'</textarea></div>'+
   '<div class="field"><label for="re-tip">Tip <span class="hint">optional</span></label><input id="re-tip" maxlength="300" value="'+esc(r.tip)+'"></div>'+
   '<div class="field"><label for="re-by">Credit <span class="hint">optional, e.g. based on Hoffmann</span></label><input id="re-by" maxlength="60" value="'+esc(r.by)+'"></div>'+
   '<div class="actions"><button class="btn" id="re-save">'+(isNew?'Save recipe':'Save changes')+'</button>'+(!isNew?'<button class="btn ghost" id="re-del">Delete</button>':'')+'</div>'+
   (GROUP&&SYNC_DB?'<p class="hint">Saved recipes are shared with your group ('+GROUP.code+').</p>':'<p class="hint">Share it from its card, or start a shared log in the Log tab to share all your recipes with your team.</p>')+'</div>';
  $('re-b').value=r.b;
  const gs=()=>{const off=-(+$('re-off').value),b=$('re-b').value;$('re-offl').textContent=off===0?'baseline':(Math.abs(off).toFixed(1)+(off>0?' steps finer':' steps coarser'));
    $('re-gs').innerHTML=MYG.map(g=>{const v=settingFor(g,b,off);return '<span>'+esc(v!=null?gLabel(g,v):gname(g)+': n/a')+'</span>'}).join('')};
  $('re-off').oninput=gs;$('re-b').onchange=gs;gs();
  $('re-save').onclick=()=>{const n=sanRec({id:isNew?undefined:r.id,b:$('re-b').value,name:$('re-name').value,by:$('re-by').value,author:isNew?(ME||''):r.author,dose:+$('re-dose').value,water:+$('re-water').value,temp:+$('re-temp').value,off:-(+$('re-off').value),
      steps:$('re-steps').value.split('\n'),why:$('re-why').value,tip:$('re-tip').value,ts:isNew?Date.now():r.ts,kind:r.kind});
    if(!n){toast('Give the recipe a name');$('re-name').focus();return}saveRecipe(n);$('vd').close();RF='mine';if(BUILT.recipes)renderRecipes();showTab('recipes');toast(isNew?'Recipe saved':'Recipe updated')};
  if(!isNew)$('re-del').onclick=()=>{if(!confirm(own?'Delete this recipe?':'Delete '+r.author+'’s recipe for everyone?'))return;deleteRecipe(r);$('vd').close();toast('Recipe deleted')};
  const d=$('vd');if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}d.scrollTop=0;$('vd-x').onclick=()=>d.close()}
$('r-new').onclick=()=>openRecipeEditor(null);
// Save the current dial-in as a starting recipe.
$('tosave').onclick=()=>{const B=BREWERS[S.brewer],dose=B.ratio.ref<5?18:B.ratio.ref<10?20:15,water=Math.round(dose*S.ratio),bloom=Math.round(dose*2.5);
  const off=Math.round(stepsBetween(S.grinder,baseX(S.grinder,S.brewer),S.setting)*10)/10;
  openRecipeEditor({b:S.brewer,name:'My '+B.name+' recipe',dose,water,temp:S.temp,off,steps:['0:00 pour '+bloom+'g, bloom.','0:'+String(S.bloom).padStart(2,'0')+' pour to '+Math.round(water*0.6)+'g.','1:30 pour to '+water+'g.','3:00 finished.'],why:PROCESSES[S.process].name+' '+vName(S.variety)+', '+S.roast+' roast.'},true)};
// Share links carry the recipe itself, so anyone can add it with one tap.
const b64u={enc:o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),dec:s=>JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))))};
function recipeLink(r){const {id,custom,ts,...rest}=r;return SITE_URL+'#recipe='+b64u.enc(rest)}
/* Every share carries a link that opens the same thing in the app on the other phone. */
const slug=s=>String(s).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const chKey=ch=>ch.c+'-'+ch.y;
function recipeHref(i){const r=RECIPES[i];return r.custom?recipeLink(r):r.champ?SITE_URL+'#c='+chKey(r.champ):SITE_URL+'#r='+slug(r.name)}
// A brew from the dial-in: the grind travels as steps from the brewer's baseline, so it lands right on any grinder.
function brewHref(){const off=Math.round(stepsBetween(S.grinder,baseX(S.grinder,S.brewer),S.setting)*10)/10;
  return SITE_URL+'#brew='+b64u.enc({b:S.brewer,g:S.grinder,c:S.setting,off,t:S.temp,r:S.ratio,bl:S.bloom,a:S.agit,ro:S.roast,p:S.process,v:S.variety})}
function planHref(c){const r=RECIPES[c.tech];if(r&&r.custom)return recipeLink(r);
  return SITE_URL+'#plan='+b64u.enc({b:c.brewer,t:r?slug(r.name):'',p:c.process,v:c.variety,ro:c.roast,age:c.age,goal:c.goal})}
const ROASTS=['light','medium','dark'];
function goTab(id){try{history.replaceState(null,'','#'+id)}catch(e){}showTab(id,true)}
function openBrewLink(code){let x;try{x=b64u.dec(code)}catch(e){}goTab('dial');
  if(!x||!BREWERS[x.b]||!BREWERS[x.b].model){toast('That brew link looks broken');return}
  const b=x.b,g=MYG.includes(x.g)&&canGrind(x.g,b)?x.g:canGrind(S.grinder,b)?S.grinder:capable(b);
  S.brewer=b;S.grinder=g;S.setting=g===x.g&&Number.isFinite(+x.c)?roundG(g,+x.c):roundG(g,shift(g,baseX(g,b),-num(x.off,0,-6,6)*160));
  S.temp=num(x.t,S.temp);S.ratio=num(x.r,S.ratio);S.bloom=num(x.bl,S.bloom);fitRanges();S.rec=null;
  if(['low','med','high'].includes(x.a))S.agit=x.a;if(ROASTS.includes(x.ro))S.roast=x.ro;if(PROCESSES[x.p])S.process=x.p;if(typeof x.v==='string'&&vById(x.v))S.variety=x.v;
  render();toast('Opened the shared brew'+(g!==x.g&&GRINDERS[x.g]?', converted to your '+gname(g):''))}
function openPlanLink(code){let x;try{x=b64u.dec(code)}catch(e){}
  if(x&&PBREWERS.includes(x.b)){PL.brewer=x.b;const t=techList(x.b).find(([r])=>slug(r.name)===x.t);PL.tech=t?t[1]:techList(x.b)[0][1];
    if(!canGrind(PL.grinder,PL.brewer))PL.grinder=capable(PL.brewer);if(PROCESSES[x.p])PL.process=x.p;if(typeof x.v==='string'&&vById(x.v))PL.variety=x.v;
    if(ROASTS.includes(x.ro))PL.roast=x.ro;PL.age=Math.round(num(x.age,PL.age,0,90));if(['clarity','balance','body'].includes(x.goal))PL.goal=x.goal;renderPlan();goTab('planner');toast('Opened the shared brew plan')}
  else{goTab('planner');toast('That plan link looks broken')}}
// Opens whatever a link points at. Returns false for plain tab links.
function openRoute(h){let m;try{h=decodeURIComponent(h)}catch(e){}
  if((m=/^recipe=([A-Za-z0-9_-]+)$/.exec(h))){goTab('recipes');importRecipe(m[1]);return true}
  if((m=/^r=([a-z0-9-]+)$/.exec(h))){goTab('recipes');const i=RECIPES.findIndex((r,k)=>k<BUILTIN_N&&slug(r.name)===m[1]);if(i>=0)openRecipe(i);else toast('That recipe isn\u2019t in this version of the app');return true}
  if((m=/^c=([a-z]+)-(\d{4})$/.exec(h))){goTab('champs');const ch=CHAMPS.find(x=>x.c===m[1]&&x.y===+m[2]);if(ch&&ch.rec)openChamp(ch);return true}
  if((m=/^k=([a-z0-9-]+)$/.exec(h))){const g=GLOSSARY.find(x=>slug(x[0])===m[1]);goTab('words');if(g)openWord(g[0]);return true}
  if((m=/^v=([\w-]+)$/.exec(h))){goTab('variety');if(VBY[m[1]])openVariety(m[1]);return true}
  if((m=/^o=([\w-]+)$/.exec(h))){goTab('map');if(ALLO()[m[1]])selectOrigin(m[1],true);return true}
  if((m=/^brew=([A-Za-z0-9_-]+)$/.exec(h))){openBrewLink(m[1]);return true}
  if((m=/^plan=([A-Za-z0-9_-]+)$/.exec(h))){openPlanLink(m[1]);return true}
  if((m=/^join=([A-Za-z0-9-]{8,9})$/.exec(h))){JOIN_CODE=m[1].toUpperCase();goTab('log');if(!GROUP)toast('Add your name and tap Join');else if(GROUP.code!==JOIN_CODE)toast('You are already in a shared log. Leave it first to join this one.');renderLog();return true}
  return false}
function importRecipe(code){let r;try{r=sanRec(b64u.dec(code))}catch(e){r=null}if(!r){toast('That recipe link looks broken');return}
  r.id='r'+Date.now().toString(36);r.ts=Date.now();const B=BREWERS[r.b];
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Shared recipe'+(r.author?' from '+esc(r.author):'')+'</span><h2 id="vd-title">'+esc(r.name)+'</h2>'+
   '<div class="meta"><span>'+esc(B.name)+'</span><span>'+r.dose+'g : '+r.water+'g</span>'+(r.temp?'<span>'+r.temp+'°C</span>':'')+'</div></div><div class="vd-body">'+(r.why?'<p>'+esc(r.why)+'</p>':'')+'<ol class="steps">'+r.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>'+(r.tip?'<p class="hint">'+esc(r.tip)+'</p>':'')+
   '<div class="meta">'+MYG.map(g=>{const v=settingFor(g,r.b,r.off);return '<span>'+esc(v!=null?gLabel(g,v):gname(g)+': n/a')+'</span>'}).join('')+'</div>'+
   '<div class="actions"><button class="btn" id="imp-add">Add to my recipes</button><button class="btn ghost" id="imp-no">Not now</button></div></div>';
  const d=$('vd');if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}d.scrollTop=0;$('vd-x').onclick=$('imp-no').onclick=()=>d.close();
  $('imp-add').onclick=()=>{saveRecipe(r);d.close();RF='mine';showTab('recipes');toast('Added to your recipes')}}

/* ================= TECHNIQUES ================= */
let TC='all',TQ='';const TCOL={bloom:'#C9964A',pour:'#8A5A3B',bed:'#6B8E4E',structure:'#B5533C',temp:'#4F8A74',cold:'#6E8FA8',espresso:'#7B4F32',taste:'#9A7390'};
function renderTech(){
  seg('tcat',[['all','All'],...Object.entries(TCAT)],()=>TC,v=>{TC=v;renderTech()});
  const q=TQ.toLowerCase();const list=TECH.filter(t=>(TC==='all'||t[0]===TC)&&(!q||t.join(' ').toLowerCase().includes(q)));
  $('tgrid').innerHTML=list.length?list.map(t=>'<button type="button" class="card tcard hovercard" aria-expanded="false" style="--c:'+TCOL[t[0]]+'"><span class="cat">'+TCAT[t[0]]+'</span><h3 style="margin:.2rem 0">'+esc(t[1])+'</h3><p style="margin:0">'+esc(t[2])+'</p><p class="more"><b>Why and when.</b> '+esc(t[3])+'</p></button>').join(''):'<p class="hint">Nothing matches. Try a broader word.</p>';
}
$('tgrid').onclick=e=>{const c=e.target.closest('.tcard');if(c)c.setAttribute('aria-expanded',c.getAttribute('aria-expanded')!=='true')};
$('tsearch').oninput=e=>{TQ=e.target.value;soon(renderTech)};

/* ================= PROCESSES ================= */
let PC='all';const PCOL={classic:'#4F8A74',honey:'#D2A04A',ferment:'#B5533C',regional:'#8A5A3B',decaf:'#6E8FA8'};
const dirTag=d=>'<span class="dir '+(d==='coarser'?'coarse':'')+'">'+(d==='finer'?'Go finer':d==='coarser'?'Go coarser':'Baseline')+'</span>';
function renderProcesses(){
  seg('pcat',[['all','All'],...Object.entries(PCAT)],()=>PC,v=>{PC=v;renderProcesses()});
  $('pgrid').innerHTML=Object.entries(PROCESSES).filter(([,p])=>PC==='all'||p.cat===PC).map(([k,p])=>'<article class="card" id="pc-'+k+'" style="border-top:5px solid '+PCOL[p.cat]+'"><span class="hint">'+PCAT[p.cat]+'</span><h3 style="margin-top:.2rem">'+esc(p.name)+'</h3>'+dirTag(p.dir)+'<p>'+esc(p.char)+'</p><p><b>Brewing it well.</b> '+esc(p.brew)+'</p><div class="chips">'+p.notes.map(n=>'<span class="chip">'+esc(n)+'</span>').join('')+'</div><button class="btn ghost" data-usep="'+k+'">Brew with this process</button></article>').join('');
  const W=640,H=300,px=f=>60+f/1.7*540,py=a=>150-a/1.6*120;
  let h='<rect x="60" y="20" width="540" height="250" rx="14" fill="var(--paper)"/><line x1="60" y1="150" x2="600" y2="150" stroke="var(--line)"/><line x1="330" y1="20" x2="330" y2="270" stroke="var(--line)"/>'+
   '<text class="ax" x="64" y="292">Clean</text><text class="ax" x="596" y="292" text-anchor="end">Wild and fruity</text>'+
   '<text class="ax" x="70" y="40">Bright</text><text class="ax" x="70" y="260">Soft</text>';
  const used={};
  for(const [k,p] of Object.entries(PROCESSES)){if(PC!=='all'&&p.cat!==PC)continue;let x=px(p.funk),y=py(p.acid);const key=Math.round(x/10)+'_'+Math.round(y/10);used[key]=(used[key]||0)+1;x+=(used[key]-1)*9;
    h+='<g class="pdg" data-k="'+k+'"><circle class="pd" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="7" fill="'+PCOL[p.cat]+'" stroke="var(--surface)" stroke-width="2"><title>'+esc(p.name)+'</title></circle></g>'}
  h+='<text id="pm-label" x="330" y="8" text-anchor="middle"></text>';
  $('pmap').innerHTML=h;
}
document.querySelector('#process .lede').onclick=e=>{goLink(e)};
$('pmap').onclick=e=>{const g=e.target.closest('.pdg');if(!g)return;const k=g.dataset.k;$('pm-label').textContent=PROCESSES[k].name;const c=$('pc-'+k);if(c){c.classList.remove('flash');void c.offsetWidth;c.classList.add('flash');c.scrollIntoView({behavior:RM()?'auto':'smooth',block:'center'})}};
$('pmap').onmousemove=e=>{const g=e.target.closest('.pdg');if(g)$('pm-label').textContent=PROCESSES[g.dataset.k].name};
$('pgrid').onclick=e=>{const b=e.target.closest('[data-usep]');if(b){S.process=b.dataset.usep;render();showTab('dial');toast('Process set to '+PROCESSES[S.process].name)}};

/* ================= GEAR ================= */
const GEAR_A=[
 ['Kettle','A gooseneck kettle with temperature control. For two-temperature recipes keep a small bottle of room-temperature water beside it.'],
 ['Scale','Weigh coffee and water every time, ideally 0.1 g with a built-in timer.'],
 ['Filters','Cone papers fit the V60, NEO, Switch and Origami; Kalita Wave filters fit the Kalita and Origami; the Chemex needs its own thick filters. Rinse papers first.'],
 ['Water','The SCA standard targets about 150 mg/L total dissolved solids, calcium hardness around 68 mg/L (17 to 85) and alkalinity near 40 mg/L. Soft water tastes sour and thin; hard water flat and chalky.'],
 ['Distribution tools','A WDT needle tool breaks clumps; a spritz of water on the beans (RDT) cuts static in the grinder.'],
 ['Freshness','Most filter coffees taste best about one week to one month after roast; espresso often likes two weeks or more.']
];
let GF='all';const TYCOL={};Object.values(BREWERS).forEach(b=>{if(!TYCOL[b.type])TYCOL[b.type]=['#8A5A3B','#6B8E4E','#C9964A','#B5533C','#4F8A74','#6E8FA8','#9A7390','#5B5F66'][Object.keys(TYCOL).length%8]});
function buildGear(){
  renderMyGrinders();renderMyBrewers();renderMatch();renderLibrary();renderCustomForm();
  $('gear-acc').innerHTML=GEAR_A.map(([n,d])=>'<div class="card hovercard"><h3>'+n+'</h3><p style="margin:0">'+d+'</p></div>').join('');
  renderGearBrewers();renderGrindMap();
}
const gtype=g=>GRINDERS[g].custom?'Your grinder':GRINDERS[g].type==='electric'?'Electric':'Manual';
const startFor=g=>base(g,'v60')??Math.round((GRINDERS[g].min+GRINDERS[g].max)/2);
function specList(g){const G=GRINDERS[g];return '<details class="gspec"><summary>Details</summary><dl class="spec">'+[['Burrs',G.burr],['Dial',G.adjust],['Range',G.range],['Cup',G.cup],['Reach for it',G.use]].filter(x=>x[1]).map(([k,v])=>'<dt>'+k+'</dt><dd>'+esc(v)+'</dd>').join('')+'</dl></details>'}
function renderMyGrinders(){
  $('gear-grinders').innerHTML=MYG.map(g=>{const G=GRINDERS[g];return '<div class="card"><div class="ghead"><div><span class="hint">'+gtype(g)+'</span><h3 style="margin:.1rem 0 0">'+esc(G.full)+'</h3></div>'+
   (MYG.length>1?'<button type="button" class="chip" data-grm="'+g+'">Remove</button>':'')+'</div><svg class="dialbig" id="gd-'+g+'" viewBox="0 0 160 160" aria-hidden="true"></svg>'+
   '<input type="range" min="'+G.min+'" max="'+G.max+'" step="1" value="'+startFor(g)+'" data-gd="'+g+'" aria-label="'+esc(G.name)+' dial position"><p class="hint" id="gh-'+g+'" style="text-align:center"></p>'+specList(g)+'</div>'}).join('');
  const upd=g=>{const c=+document.querySelector('[data-gd="'+g+'"]').value;drawDial('gd-'+g,g,c);$('gh-'+g).textContent=dialHint(g,c)+nearestBrew(sizeOf(g,c))};
  $('gear-grinders').oninput=e=>{const g=e.target.dataset.gd;if(g)upd(g)};MYG.forEach(upd);
  $('gear-grinders').onclick=e=>{const b=e.target.closest('[data-grm]');if(b)setMine(b.dataset.grm,false)};
}
// "About a V60 grind": the brewer whose place on the shared scale is closest.
function nearestBrew(size){let best=null,d=1e9;for(const k of MODEL){const E=brewSize(k);if(E!=null&&Math.abs(E-size)<d){d=Math.abs(E-size);best=k}}return best&&d<140?' · about a '+BREWERS[best].name+' grind':''}
function grinderSelect(id,val,short){return '<select id="'+id+'">'+[['manual','Manual'],['electric','Electric'],['custom','Your grinders']].map(([t,l])=>{const ks=Object.keys(GRINDERS).filter(g=>t==='custom'?GRINDERS[g].custom:!GRINDERS[g].custom&&GRINDERS[g].type===t);
  return ks.length?'<optgroup label="'+l+'">'+ks.map(g=>'<option value="'+g+'"'+(g===val?' selected':'')+'>'+esc(GRINDERS[g][short?'name':'full'])+'</option>').join('')+'</optgroup>':''}).join('')+'</select>'}
let MATCH={g:null,v:'',to:null};
// A setting on grinder g as steps on grinder h. Measured from each grinder's V60 setting (yours, if you calibrated it),
// so the Match tool, dial-in and recipes all agree.
function matchSteps(g,c,h){const bg=baseX(g,'v60'),bh=baseX(h,'v60');return bg==null||bh==null?stepsFor(h,sizeOf(g,c)):shift(h,bh,sizeOf(g,c)-sizeOf(g,bg))}
function matchVal(g,c,h){const v=matchSteps(g,c,h),H=GRINDERS[h],size=sizeOf(g,c);return v>=H.min-0.5&&v<=H.max+0.5&&(size>=V60_SIZE*0.6||H.espresso)?roundG(h,v):null}
function renderMatch(){if(!MATCH.g||!GRINDERS[MATCH.g])MATCH={g:MYG[0],v:dial(MYG[0],startFor(MYG[0])),to:null};
  if(!MATCH.to||!GRINDERS[MATCH.to]||MATCH.to===MATCH.g)MATCH.to=MYG.find(h=>h!==MATCH.g)||(MATCH.g==='kultra'?'zp6':'kultra');
  $('gmatch').innerHTML='<h3 style="margin-top:0">Match a grind size</h3><p class="hint" style="margin-top:0">Type a setting on one grinder to get the same grind on another. For 1Zpresso dials, type the dial (5.4) or clicks (54).</p>'+
   '<div class="mswap"><div class="field"><label for="gm-from">From</label>'+grinderSelect('gm-from',MATCH.g,1)+'</div><button type="button" class="gpick-btn mswapbtn" id="gm-swap" aria-label="Swap grinders" title="Swap grinders">'+SWAP_ICON+'</button><div class="field"><label for="gm-to">To</label>'+grinderSelect('gm-to',MATCH.to,1)+'</div></div>'+
   '<div class="field"><label for="gm-val">Setting on the '+esc(GRINDERS[MATCH.g].name)+'</label><input id="gm-val" inputmode="decimal" style="width:100%" value="'+esc(MATCH.v)+'"></div><div id="gm-out"></div>';
  $('gm-from').onchange=e=>{MATCH.g=e.target.value;MATCH.v=dial(MATCH.g,startFor(MATCH.g));renderMatch()};
  $('gm-to').onchange=e=>{MATCH.to=e.target.value;if(MATCH.to===MATCH.g){MATCH.g=MYG.find(h=>h!==MATCH.to)||'zp6';MATCH.v=dial(MATCH.g,startFor(MATCH.g))}renderMatch()};
  $('gm-swap').onclick=()=>{const c=parseDial(MATCH.g,MATCH.v),v=c==null?null:matchVal(MATCH.g,c,MATCH.to);[MATCH.g,MATCH.to]=[MATCH.to,MATCH.g];MATCH.v=dial(MATCH.g,v??startFor(MATCH.g));renderMatch()};
  $('gm-val').oninput=e=>{MATCH.v=e.target.value;soon(matchOut)};matchOut()}
function matchOut(){const g=MATCH.g,c=parseDial(g,MATCH.v),G=GRINDERS[g];
  if(c==null||c<G.min-2||c>G.max+2){$('gm-out').innerHTML='<p class="hint">Type a setting the '+esc(G.name)+' can reach ('+dial(g,G.min)+' to '+dial(g,G.max)+').</p>';return}
  const size=sizeOf(g,c),lab=(h,v)=>esc(dial(h,v))+(GRINDERS[h].unit==='clicks'?' <small>clicks</small>':''),
    row=h=>{const v=matchVal(g,c,h);return '<div class="mrow'+(MYG.includes(h)?' mine':'')+'"><span>'+esc(GRINDERS[h].name)+'</span><b>'+(v!=null?lab(h,v):'<small>out of range</small>')+'</b></div>'};
  const to=MATCH.to,tv=matchVal(g,c,to),T=GRINDERS[to];
  const others=Object.keys(GRINDERS).filter(h=>h!==g&&h!==to&&!MYG.includes(h));
  $('gm-out').innerHTML='<div class="mbig"><span>'+esc(G.name)+' <b>'+lab(g,c)+'</b></span><span class="eq">=</span><span>'+esc(T.name)+' <b>'+(tv!=null?lab(to,tv):'out of range')+'</b></span></div>'+
   '<p class="hint" style="margin:.2rem 0 .6rem">'+esc(dialHint(g,c))+(tv!=null?' → '+esc(dialHint(to,tv)):'')+nearestBrew(size)+'</p>'+
   (MYG.filter(h=>h!==g&&h!==to).length?'<div class="mgroup"><h4>Your grinders</h4>'+MYG.filter(h=>h!==g&&h!==to).map(row).join('')+'</div>':'')+
   [['manual','Manual'],['electric','Electric'],['custom','Your own']].map(([t,n])=>{const ks=others.filter(h=>t==='custom'?GRINDERS[h].custom:!GRINDERS[h].custom&&GRINDERS[h].type===t);return ks.length?'<div class="mgroup"><h4>'+n+'</h4>'+ks.map(row).join('')+'</div>':''}).join('')+
   '<p class="hint" style="margin-top:.6rem">Estimates from typical settings; burr shape changes the taste, so fine-tune by taste.</p>'}
let GLF='all',GCMP=[],GLQ='';
// Line icons for grinder types: a hand grinder with its crank, and a plug-in (electric) bolt.
const GICO={manual:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10h10l-1.2 10H8.2z M5.5 20.5h13 M12 10V6.5 M12 6.5h6.5 M18.5 6.5v2"/><circle cx="18.5" cy="10" r="1.6"/></svg>',
  electric:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 3L5 13h6l-1 8 8-10h-6z"/></svg>',
  custom:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z M13 7l4 4"/></svg>'};
const gkind=g=>GRINDERS[g].custom?'custom':GRINDERS[g].type==='electric'?'electric':'manual';
const gicon=k=>'<span class="gi '+k+'">'+GICO[k]+'</span>';
function renderLibrary(){
  seg('glib-filter',[['all','All'],['manual',gicon('manual')+'Manual'],['electric',gicon('electric')+'Electric']].concat(Object.values(GRINDERS).some(G=>G.custom)?[['custom',gicon('custom')+'Your own']]:[]),()=>GLF,v=>{GLF=v;renderLibrary()});
  const q=fold(GLQ.trim()),hit=g=>{const G=GRINDERS[g];return !q||fold([G.full,G.brand,G.burr,G.use].join(' ')).includes(q)};
  const groups=[['manual','Manual grinders'],['electric','Electric grinders'],['custom','Your own grinders']].filter(([t])=>GLF==='all'||GLF===t);
  let html='';
  for(const [t,title] of groups){const ks=Object.keys(GRINDERS).filter(g=>gkind(g)===t&&hit(g));if(!ks.length)continue;
    // Brands with the most grinders first, then alphabetical.
    const brands=[...new Set(ks.map(g=>GRINDERS[g].brand||'Other'))].sort((a,b)=>ks.filter(g=>(GRINDERS[g].brand||'Other')===b).length-ks.filter(g=>(GRINDERS[g].brand||'Other')===a).length||a.localeCompare(b));
    html+='<div class="gtype">'+gicon(t)+'<div><h4>'+title+'</h4><small>'+ks.length+(ks.length===1?' grinder':' grinders')+(brands.length>1?' from '+brands.length+' brands':'')+'</small></div></div>';
    for(const br of brands){const bk=ks.filter(g=>(GRINDERS[g].brand||'Other')===br);
      html+=(t==='custom'?'':'<div class="gbrand">'+esc(br)+'<small>'+bk.length+'</small></div>')+'<div class="grid">'+bk.map(g=>{const G=GRINDERS[g],mine=MYG.includes(g),v6=base(g,'v60'),ap=base(g,'aeropress'),fp=base(g,'frenchpress'),es=base(g,'espresso');
        return '<div class="card gcard"><div class="gtop">'+gicon(gkind(g))+'<span class="hint">'+esc(G.brand||gtype(g))+' · '+(t==='custom'?'your grinder':t)+(G.espresso?' · espresso':'')+'</span>'+(mine?'<span class="mine-tag">✓ Yours</span>':'')+'</div>'+
          '<div class="ghead"><h3 style="margin:.35rem 0 0">'+esc(G.full)+'</h3>'+(G.custom?'<button type="button" class="chip" data-gdel="'+g+'">Delete</button>':'')+'</div>'+
          '<div class="meta">'+[['Espresso',G.espresso?es:null],['AeroPress',ap],['V60',v6],['French press',fp]].filter(([n,v])=>n!=='Espresso'||v!=null).map(([n,v])=>'<span>'+n+' '+(v!=null?esc(dial(g,v)):'n/a')+'</span>').join('')+'</div>'+specList(g)+
          '<div class="actions"><button type="button" class="btn'+(mine?' ghost':'')+'" data-gmine="'+g+'">'+(mine?'Remove from mine':'Add to my grinders')+'</button><button type="button" class="btn ghost" data-gcmp="'+g+'" aria-pressed="'+GCMP.includes(g)+'">'+(GCMP.includes(g)?'✓ Comparing':'Compare')+'</button></div></div>'}).join('')+'</div>'}}
  $('glib').innerHTML=html||'<p class="hint">No grinders match. Try a brand name, or pick All.</p>';
  renderGCompare()}
$('glib-search').oninput=e=>{GLQ=e.target.value;soon(renderLibrary)};
$('glib').onclick=e=>{const m=e.target.closest('[data-gmine]'),c=e.target.closest('[data-gcmp]'),d=e.target.closest('[data-gdel]');
  if(m){setMine(m.dataset.gmine,!MYG.includes(m.dataset.gmine));return}
  if(c){const g=c.dataset.gcmp;if(GCMP.includes(g))GCMP=GCMP.filter(x=>x!==g);else{if(GCMP.length>=3){toast('Compare up to three at a time');return}GCMP.push(g)}renderLibrary();if(GCMP.length)$('gcmp').scrollIntoView({behavior:RM()?'auto':'smooth',block:'nearest'});return}
  if(d&&confirm('Delete '+GRINDERS[d.dataset.gdel].name+'?')){const g=d.dataset.gdel;delete CUSTOM_G[g];save('bb-custom-grinders',CUSTOM_G);setMine(g,false,true);delete GRINDERS[g];GCMP=GCMP.filter(x=>x!==g);grindersChanged();toast('Grinder deleted')}};
function renderGCompare(){if(!GCMP.length){$('gcmp').innerHTML='';return}
  const rows=[['Type',g=>gtype(g)],['Burrs',g=>GRINDERS[g].burr||'–'],['Dial',g=>GRINDERS[g].adjust||'–'],['Microns per step',g=>GRINDERS[g].um?'about '+GRINDERS[g].um:'–'],['Espresso',g=>GRINDERS[g].espresso?'Yes':'No'],
    ['Espresso setting',g=>{const v=base(g,'espresso');return v!=null?dial(g,v):'n/a'}],['AeroPress',g=>{const v=base(g,'aeropress');return v!=null?dial(g,v):'n/a'}],['V60',g=>{const v=base(g,'v60');return v!=null?dial(g,v):'n/a'}],['French press',g=>{const v=base(g,'frenchpress');return v!=null?dial(g,v):'n/a'}],['In the cup',g=>GRINDERS[g].cup||'–']];
  $('gcmp').innerHTML='<div class="card cmpcard"><div class="ghead"><h3 style="margin:0">Side by side</h3><button type="button" class="chip" id="gcmp-clear">Clear</button></div><div class="scroll-x"><table class="gtable"><thead><tr><th></th>'+GCMP.map(g=>'<th>'+esc(GRINDERS[g].name)+'</th>').join('')+'</tr></thead><tbody>'+
   rows.map(([n,f])=>'<tr><th>'+n+'</th>'+GCMP.map(g=>'<td>'+esc(f(g))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></div>';
  $('gcmp-clear').onclick=()=>{GCMP=[];renderLibrary()}}
function setMine(g,on,quiet){if(on&&!MYG.includes(g))MYG.push(g);if(!on){if(MYG.length<=1&&!quiet){toast('Keep at least one grinder');return}MYG=MYG.filter(x=>x!==g)}if(!MYG.length)MYG=['kultra'];save('bb-mygrinders',MYG);
  if(!quiet){grindersChanged();toast(on?gname(g)+' added to your grinders':gname(g)+' removed')}}
// Pick which grinders you own from anywhere a grinder is chosen. The same list as "Your grinders" in Gear.
const SWAP_ICON='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></svg>';
// The brewers you own. Empty means you haven't said yet, and recipes are shown as the champion brewed them.
let MYB=(()=>{try{const v=JSON.parse(localStorage.getItem('bb-mybrewers'));return Array.isArray(v)?[...new Set(v.filter(b=>typeof b==='string'&&BREWERS[b]))]:[]}catch(e){return[]}})();
function setMyBrewer(b,on){MYB=on?[...new Set([...MYB,b])]:MYB.filter(x=>x!==b);save('bb-mybrewers',MYB)}
function openGearPicker(tab,after){let q='',T=tab==='brewers'?'brewers':'grinders';const d=$('vd');
  const row=(k,on,title,sub,ic)=>'<button type="button" data-gp="'+k+'" aria-pressed="'+on+'">'+(ic||'')+'<span><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></span><i class="tick" aria-hidden="true">'+(on?'✓':'')+'</i></button>';
  const grow=g=>{const G=GRINDERS[g];return row(g,MYG.includes(g),G.full,(G.brand||gtype(g))+(G.espresso?' · espresso capable':''),gicon(gkind(g)))};
  const brow=b=>row(b,MYB.includes(b),BREWERS[b].name,BREWERS[b].type);
  const m=s=>!q||s.toLowerCase().includes(q);
  const list=()=>{let h='';
    if(T==='grinders')h=[['mine','Your grinders'],['manual','Manual'],['electric','Electric'],['custom','Your own']].map(([t,n])=>{
      const ks=(t==='mine'?MYG.slice():Object.keys(GRINDERS).filter(g=>!MYG.includes(g)&&(t==='custom'?GRINDERS[g].custom:!GRINDERS[g].custom&&GRINDERS[g].type===t))).filter(g=>m(GRINDERS[g].full+' '+(GRINDERS[g].brand||'')));
      return ks.length?'<h4>'+n+'</h4>'+ks.map(grow).join(''):''}).join('');
    else{const ks=Object.keys(BREWERS).filter(b=>m(BREWERS[b].name+' '+BREWERS[b].type)),types=[...new Set(ks.map(b=>BREWERS[b].type))];
      h=(MYB.filter(b=>ks.includes(b)).length?'<h4>Your brewers</h4>'+MYB.filter(b=>ks.includes(b)).map(brow).join(''):'')+types.map(ty=>{const r=ks.filter(b=>BREWERS[b].type===ty&&!MYB.includes(b));return r.length?'<h4>'+esc(ty)+'</h4>'+r.map(brow).join(''):''}).join('')}
    return h||'<p class="hint">Nothing matches.</p>'};
  const draw=()=>{$('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Your gear</span><h2 id="vd-title">What do you brew with?</h2>'+
     '<p class="hint" style="margin:0">Tick what you own. Recipes, settings and championship recipes adapt to it.</p><div class="seg" id="gp-tab" style="margin-top:12px"></div></div><div class="vd-body"><input class="gpick-search" id="gp-q" type="search" placeholder="Search '+T+'" aria-label="Search '+T+'"><div class="gpick" id="gp-list">'+list()+'</div>'+
     '<div class="actions"><button type="button" class="btn" id="gp-done">Done</button></div></div>';
    seg('gp-tab',[['grinders','Grinders ('+MYG.length+')'],['brewers','Brewers ('+MYB.length+')']],()=>T,v=>{T=v;q='';draw()});
    $('gp-q').oninput=e=>{q=e.target.value.trim().toLowerCase();$('gp-list').innerHTML=list()};
    $('gp-list').onclick=e=>{const b=e.target.closest('[data-gp]');if(!b)return;const k=b.dataset.gp;let on;
      if(T==='grinders'){on=!MYG.includes(k);if(!on&&MYG.length<=1){toast('Keep at least one grinder');return}setMine(k,on,true)}else{on=!MYB.includes(k);setMyBrewer(k,on)}
      b.setAttribute('aria-pressed',on);b.querySelector('.tick').textContent=on?'✓':'';
      const tb=document.querySelector('#gp-tab button[data-v="'+T+'"]');if(tb)tb.textContent=T==='grinders'?'Grinders ('+MYG.length+')':'Brewers ('+MYB.length+')'};
    $('gp-done').onclick=$('vd-x').onclick=()=>d.close()};
  draw();
  const finish=()=>{d.removeEventListener('close',finish);grindersChanged();if(BUILT.champs)renderChamps();if(BUILT.gear)renderMyBrewers();if(after)setTimeout(after,0)};d.addEventListener('close',finish);
  if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}d.scrollTop=0}
const openGrinderPicker=()=>openGearPicker('grinders');
function renderMyBrewers(){$('gear-mybrewers').innerHTML='<div class="ghead"><h3 style="margin:0">Your brewers</h3><button type="button" class="gpick-btn" data-gpick-b aria-label="Change brewers" title="Change brewers">'+SWAP_ICON+'</button></div>'+
  (MYB.length?'<div class="meta">'+MYB.map(b=>'<span>'+esc(BREWERS[b].name)+'</span>').join('')+'</div>':'<p class="hint">Tell the app which brewers you own, and championship recipes adapt to them.</p>')}
document.addEventListener('click',e=>{if(e.target.closest('[data-gpick-b]'))openGearPicker('brewers')});
document.addEventListener('click',e=>{if(e.target.closest('[data-gpick]'))openGrinderPicker()});
// Everything that shows grinder settings follows your grinders.
function grindersChanged(){if(!MYG.includes(S.grinder)||!canGrind(S.grinder,S.brewer)){const g=MYG.find(x=>canGrind(x,S.brewer))||capable(S.brewer);S.setting=canGrind(S.grinder,S.brewer)?convertSetting(S,g,S.brewer):base(g,S.brewer);S.grinder=g}
  if(!MYG.includes(PL.grinder))PL.grinder=MYG.find(x=>canGrind(x,PL.brewer))||capable(PL.brewer);if(!MYG.includes(SC.grinder))SC.grinder=MYG.find(x=>canGrind(x,SC.brewer))||capable(SC.brewer);
  render();renderPlan();renderScan();renderCal();if(BUILT.recipes)renderRecipes();if(BUILT.gear){renderMyGrinders();renderMatch();renderLibrary();renderGearBrewers();renderGrindMap()}}
function renderCustomForm(){
  $('gcustom-in').innerHTML='<div class="cform"><div class="field"><label for="cg-name">Name</label><input id="cg-name" maxlength="40" placeholder="e.g. Hario Skerton Pro"></div>'+
   '<div class="two"><div class="field"><label for="cg-type">Type</label><select id="cg-type"><option value="manual">Manual</option><option value="electric">Electric</option></select></div>'+
   '<div class="field"><label for="cg-fmt">How is it set?</label><select id="cg-fmt"><option value="clicks">Clicks from fully closed</option><option value="num1">Numbered dial (1, 2, 3)</option><option value="num10">Numbered dial with 10 steps (5.6)</option><option value="num3">Numbered dial with thirds (4, 4.1, 4.2)</option><option value="rot">1Zpresso-style ring (rotation.number.click)</option></select></div></div>'+
   '<div class="two"><div class="field"><label for="cg-min">Finest setting</label><input id="cg-min" inputmode="decimal" value="0"></div><div class="field"><label for="cg-max">Coarsest setting</label><input id="cg-max" inputmode="decimal" value="40"></div></div>'+
   '<div class="two stackm"><div class="field"><label for="cg-v60">Your V60 setting</label><input id="cg-v60" inputmode="decimal" placeholder="e.g. 24"></div>'+
   '<div class="field"><label for="cg-ref">And one more you know</label><div class="joinrow"><select id="cg-reft"><option value="espresso">Espresso</option><option value="aeropress">AeroPress</option><option value="frenchpress" selected>French press</option></select><input id="cg-ref" inputmode="decimal" placeholder="optional"></div></div></div>'+
   '<div class="field"><label for="cg-burr">Burrs (optional)</label><input id="cg-burr" maxlength="80" placeholder="e.g. 38 mm ceramic conical"></div>'+
   '<p class="hint">The V60 setting anchors it; the second setting tells the app how far apart the settings are. Without it, the app assumes a typical spacing.</p>'+
   '<div class="actions"><button type="button" class="btn" id="cg-save">Add grinder</button></div></div>';
  $('cg-save').onclick=()=>{const name=$('cg-name').value.trim(),fmt=$('cg-fmt').value;if(!name){toast('Give the grinder a name');return}
    const G={custom:true,name,full:name,type:$('cg-type').value,burr:$('cg-burr').value.trim(),adjust:{clicks:'Clicks counted from fully closed',num1:'Numbered dial',num10:'Numbered dial, 10 steps per number',num3:'Numbered dial with thirds',rot:'Ring read as rotation.number.click'}[fmt],
      fmt:fmt==='rot'?'rot':'num',per:fmt==='rot'?100:undefined,sub:{num10:10,num3:3}[fmt]||1,first:0,unit:fmt==='clicks'?'clicks':undefined,body:0,clarity:0};
    GRINDERS.__tmp=G;const P=id=>{const v=$(id).value.trim();return v===''?null:parseDial('__tmp',v)};
    const mn=P('cg-min'),mx=P('cg-max'),v6=P('cg-v60'),rf=P('cg-ref'),rt=$('cg-reft').value;delete GRINDERS.__tmp;
    if(v6==null){toast('Add your V60 setting, it anchors everything');return}if(mn==null||mx==null||mx<=mn){toast('Check the finest and coarsest settings');return}
    let k=30;if(rf!=null&&rf!==v6){const E=brewSize(rt);k=(E-V60_SIZE)/(rf-v6);if(!(k>0)){toast('That setting should be '+(rt==='frenchpress'?'coarser':'finer')+' than your V60 setting');return}}
    Object.assign(G,{min:mn,max:mx,v60:v6,k:Math.round(k*10)/10,espresso:rt==='espresso'&&rf!=null,range:'V60 '+$('cg-v60').value+(rf!=null?', '+BREWERS[rt].name+' '+$('cg-ref').value:'')});
    const id='c'+Date.now().toString(36);CUSTOM_G[id]=G;save('bb-custom-grinders',CUSTOM_G);GRINDERS[id]=G;setMine(id,true,true);grindersChanged();
    $('gcustom').open=false;toast(name+' added to your grinders');GLF='all';renderLibrary()}}
function renderGearBrewers(){
  const types=[...new Set(Object.values(BREWERS).map(b=>b.type))];
  seg('gear-filter',[['all','All'],...types.map(t=>[t,t])],()=>GF,v=>{GF=v;renderGearBrewers()});
  $('gear-brewers').innerHTML=Object.entries(BREWERS).filter(([,b])=>GF==='all'||b.type===GF).map(([k,b])=>'<div class="card hovercard" id="gb-'+k+'" style="border-top:5px solid '+TYCOL[b.type]+'"><span class="hint">'+b.type+'</span><h3 style="margin-top:.2rem">'+esc(b.name)+'</h3><p>'+esc(b.desc)+'</p><p><b>How it behaves.</b> '+esc(b.how)+'</p><p><b>Best for.</b> '+esc(b.best)+'</p>'+
   '<div class="meta">'+MYG.map(g=>'<span>'+esc(canGrind(g,k)?gLabel(g,base(g,k)):gname(g)+': n/a')+'</span>').join('')+'</div>'+
   '<div class="actions">'+(RECIPES.some(r=>r.b===k)?'<button class="btn ghost" data-grec="'+k+'">See recipes</button>':'')+(b.model?'<button class="btn ghost" data-gdial="'+k+'">Dial it in</button>':'')+'</div></div>').join('');
}
$('gear-brewers').onclick=e=>{const a=e.target.closest('[data-grec]'),d=e.target.closest('[data-gdial]');
  if(a){RF=BREWERS[a.dataset.grec].type;renderRecipes();showTab('recipes')}
  if(d){$('i-brewer').value=d.dataset.gdial;$('i-brewer').dispatchEvent(new Event('change'));showTab('dial')}};
function renderGrindMap(){
  let h='';for(const g of MYG){const G=GRINDERS[g];const pos=c=>((c-G.min)/(G.max-G.min)*100).toFixed(2)+'%';
    // Markers closer than about one marker width go into separate lanes, so none hides another.
    const ms=Object.keys(BREWERS).filter(k=>canGrind(g,k)).map(k=>({k,v:base(g,k)})).sort((a,b)=>a.v-b.v);
    const lanes=[],gap=(G.max-G.min)*0.06;for(const m of ms){let l=lanes.findIndex(x=>m.v-x>=gap);if(l<0){l=lanes.length;lanes.push(0)}lanes[l]=m.v;m.lane=l}
    h+='<h3 style="margin:0">'+esc(G.name)+'</h3><div class="grindtrack" data-g="'+g+'" style="--lanes:'+Math.max(1,lanes.length)+'">';
    const tick=G.fmt==='rot'||G.sub===10?10:Math.max(1,Math.round((G.max-G.min)/8/(G.sub||1))*(G.sub||1));for(let c=Math.ceil(G.min/tick)*tick;c<=G.max;c+=tick)h+='<span class="scale" style="left:'+pos(c)+'">'+dial(g,c)+'</span>';
    for(const {k,v,lane} of ms)h+='<button type="button" class="gm" data-k="'+k+'" data-g="'+g+'" style="--lane:'+lane+';left:'+pos(clamp(v,G.min,G.max))+';background:'+TYCOL[BREWERS[k].type]+'" aria-label="'+esc(BREWERS[k].name)+' '+dial(g,v)+'" title="'+esc(BREWERS[k].name)+'"></button>';
    h+='</div><div class="gmlabel" id="gml-'+g+'">Tap a marker</div>'}
  h+='<div class="chips">'+Object.entries(TYCOL).map(([t,c])=>'<span class="pill"><i style="background:'+c+'"></i>'+t+'</span>').join('')+'</div>';
  $('grindmap').innerHTML=h;
}
$('grindmap').onclick=e=>{const m=e.target.closest('.gm');if(!m)return;const g=m.dataset.g,k=m.dataset.k;$('grindmap').querySelectorAll('.gm').forEach(x=>x.classList.toggle('on',x.dataset.k===k));
  for(const gg of MYG){const el=$('gml-'+gg);if(el)el.textContent=BREWERS[k].name+': '+(canGrind(gg,k)?gLabel(gg,base(gg,k)):'not possible')}};

/* ================= VARIETY DIALOG ================= */
function vbtn(id){const v=VBY[id];if(!v)return'';return'<button type="button" class="vbtn" data-v="'+id+'"><i style="background:'+FAM[v.fam].color+'"></i>'+esc(v.name)+'</button>'}
function openVariety(id){
  const v=VBY[id];if(!v)return;const f=FAM[v.fam];
  const grown=v.grown||Object.keys(ALLO()).filter(k=>(ALLO()[k].vars||[]).includes(id));
  $('vd-in').innerHTML='<div class="vd-head" style="--c:'+f.color+'"><button class="vd-close" id="vd-x" aria-label="Close">\u2715</button>'+
   '<span class="pill"><i style="background:'+f.color+'"></i>'+f.name+'</span><h2 id="vd-title">'+esc(v.name)+'</h2>'+
   '<div class="meta">'+(v.origin?'<span>'+esc(v.origin)+'</span>':'')+(v.year?'<span title="'+esc(v.year)+'">'+esc(v.year)+'</span>':'')+'</div></div>'+
   '<div class="vd-body">'+(v.parents?'<p class="hint" style="margin-top:0"><b>Parentage:</b> '+esc(v.parents)+'</p>':'')+
   '<p>'+esc(v.story)+'</p><h3>In the cup</h3><p>'+esc(v.cup)+'</p><div class="chips">'+v.notes.map(n=>'<span class="chip">'+esc(n)+'</span>').join('')+'</div>'+
   '<h3>Brewing it '+dirTag(v.dir)+'</h3><p>'+esc(v.brew)+'</p>'+
   (v.subs?'<h3>Types of '+esc(v.name.split(' ')[0])+'</h3>'+v.subs.map(s=>'<details class="sub"><summary>'+esc(s.name)+'</summary><p>'+esc(s.story)+'</p><p><b>Cup:</b> '+esc(s.cup)+'</p><button class="btn ghost" data-use="'+v.id+':'+s.k+'">Brew this in the dial-in</button></details>').join(''):'')+
   (grown.length?'<h3>Where it grows</h3><div class="chips">'+grown.filter(k=>ALLO()[k]).map(k=>'<button class="chip" data-o="'+k+'">'+(ALLO()[k].flag||'')+' '+esc(originName(k))+'</button>').join('')+'</div>':'')+
   (v.id!=='arabica'?'<div class="actions"><button class="btn" data-use="'+v.id+'">Brew this in the dial-in</button><button class="btn ghost" data-plan-v="'+v.id+'">Plan a brew</button><button class="btn ghost" data-vshare="'+v.id+'">Share</button></div>':'')+'</div>';
  const d=$('vd');if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}d.scrollTop=0;
  $('vd-x').onclick=()=>d.close();
}
$('vd').addEventListener('click',e=>{const d=$('vd');if(e.target===d){d.close();return}
  const u=e.target.closest('[data-use]');if(u){S.variety=u.dataset.use;render();d.close();showTab('dial');toast('Variety set to '+vName(S.variety));return}
  const vs=e.target.closest('[data-vshare]');if(vs){d.close();openShare(varietyDoc(vs.dataset.vshare));return}
  const p=e.target.closest('[data-plan-v]');if(p){PL.variety=p.dataset.planV;renderPlan();d.close();showTab('planner');return}
  const o=e.target.closest('[data-o]');if(o){d.close();showTab('map');selectOrigin(o.dataset.o,true)}});
$('timer').addEventListener('click',e=>{if(e.target===$('timer')){if(TM&&TM.iv)clearInterval(TM.iv);$('timer').close()}});
document.addEventListener('click',e=>{const b=e.target.closest('.vbtn[data-v]');if(b)openVariety(b.dataset.v)});

/* ================= VARIETIES TAB ================= */
let VF='all',VQ='',CMP=[];
function renderVarieties(){
  seg('vfam',[['all','All'],...Object.entries(FAM).map(([k,f])=>[k,f.name])],()=>VF,v=>{VF=v;renderVarieties()});
  const q=VQ.trim().toLowerCase();
  const list=V.filter(v=>(VF==='all'||v.fam===VF)&&(!q||(v.name+' '+(v.origin||'')+' '+v.notes.join(' ')+' '+(v.grown||[]).map(originName).join(' ')+' '+(v.subs||[]).map(s=>s.name).join(' ')).toLowerCase().includes(q)));
  $('vgrid').innerHTML=(list.length?list.map(v=>'<div class="card vcard" data-v="'+v.id+'" style="--c:'+FAM[v.fam].color+'" tabindex="0" role="button"><button type="button" class="addcmp" data-cmp="'+v.id+'" aria-pressed="'+CMP.includes(v.id)+'">'+(CMP.includes(v.id)?'Comparing':'+ Compare')+'</button><span class="fam">'+FAM[v.fam].name+'</span><h3>'+esc(v.name)+'</h3>'+
    '<div class="meta">'+(v.origin?'<span title="'+esc(v.origin)+'">'+esc(v.origin.match(/^[^,(]*(\([^)]*\))?[^,]*/)[0])+'</span>':'')+(v.year?'<span>'+esc(v.year)+'</span>':'')+(v.subs?'<span>'+v.subs.length+' types</span>':'')+'</div>'+
    '<p>'+esc(v.cup)+'</p>'+dirTag(v.dir)+'</div>').join(''):'<p class="hint">No varieties match. Try a country, a family or a flavour.</p>');
  renderCompare();
}
function renderCompare(){
  if(!CMP.length){$('vcompare').innerHTML='<div class="actions" style="margin:0 0 14px"><button class="btn ghost" id="vsurprise">Surprise me</button><span class="hint" style="align-self:center">Tap "+ Compare" on up to three varieties to see them side by side.</span></div>';$('vsurprise').onclick=()=>openVariety(V[Math.floor(Math.random()*V.length)].id);return}
  const vs=CMP.map(id=>VBY[id]);const m=vs.map(v=>vParams(v.id));const sc=x=>clamp((x+2)*2.5,0.3,10);
  const rows=[['Acidity','acid'],['Body','body'],['Sweetness','sweet'],['Clarity','clarity']];
  $('vcompare').innerHTML='<div class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">Side by side</h3><button type="button" class="chip" id="vclear">Clear</button></div>'+
   '<div class="cmpbar" style="--n:'+vs.length+';margin-top:10px"><span></span>'+vs.map(v=>'<b style="color:'+FAM[v.fam].color+'">'+esc(v.name.replace(/\s*\(.*$/,''))+'</b>').join('')+
   rows.map(([n,k])=>'<span>'+n+'</span>'+m.map((p,i)=>'<div class="t" title="'+sc(p[k]).toFixed(1)+' / 10"><b style="width:'+(sc(p[k])*10)+'%;background:'+FAM[vs[i].fam].color+'"></b><i>'+sc(p[k]).toFixed(1)+'</i></div>').join('')).join('')+
   '<span>Grind</span>'+vs.map(v=>'<span>'+dirTag(v.dir)+'</span>').join('')+'<span>Family</span>'+vs.map(v=>'<span class="hint">'+FAM[v.fam].name+'</span>').join('')+'</div></div>';
  $('vclear').onclick=()=>{CMP=[];renderVarieties()};
}
$('vsearch').oninput=e=>{VQ=e.target.value;soon(renderVarieties)};
$('vgrid').onclick=e=>{const c=e.target.closest('[data-cmp]');if(c){e.stopPropagation();const id=c.dataset.cmp;if(CMP.includes(id))CMP=CMP.filter(x=>x!==id);else{if(CMP.length>=3){toast('Compare up to three at a time');return}CMP.push(id)}renderVarieties();return}
  const b=e.target.closest('[data-v]');if(b)openVariety(b.dataset.v)};
$('vgrid').onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.vcard')){e.preventDefault();openVariety(e.target.dataset.v)}};

/* ================= MAP ================= */
let SEL=null,VIEW=[0,0,1000,520],HL=null;
const BIG=['brazil','china','india','indonesia','drc','mexico','peru','colombia','ethiopia','bolivia','tanzania','kenya','vietnam','myanmar','thailand','png','yemen','uganda','malawi','venezuela','zambia','zimbabwe','cameroon','ivorycoast','madagascar','southsudan','saudi','philippines','laos','nepal','cuba'];
function buildMap(){
  const svg=$('worldmap');
  let h='<rect x="-500" y="'+MAP.tropics[0]+'" width="2000" height="'+(MAP.tropics[1]-MAP.tropics[0])+'" fill="var(--belt)"/>'+
   '<line x1="-500" x2="1500" y1="'+MAP.tropics[0]+'" y2="'+MAP.tropics[0]+'" stroke="var(--honey)" stroke-dasharray="4 5" stroke-width=".8" opacity=".6"/>'+
   '<line x1="-500" x2="1500" y1="'+MAP.tropics[1]+'" y2="'+MAP.tropics[1]+'" stroke="var(--honey)" stroke-dasharray="4 5" stroke-width=".8" opacity=".6"/>'+
   '<text x="14" y="'+(MAP.tropics[0]-6)+'" font-size="11" fill="var(--honey)">Tropic of Cancer</text>'+
   '<text x="14" y="'+(MAP.tropics[1]+14)+'" font-size="11" fill="var(--honey)">Tropic of Capricorn</text>'+
   '<path d="'+MAP.bg+'" fill="var(--land)" stroke="var(--ocean)" stroke-width=".4"/>';
  for(const k in MAP.c){const o=O[k];if(!o)continue;h+='<path class="o" data-k="'+k+'" data-r="'+o.reg+'" d="'+MAP.c[k]+'" fill="'+REG[o.reg].color+'"><title>'+esc(o.name)+'</title></path>'}
  const dots=Object.keys(O).map(k=>[k,MAP.cent[k]]).concat([['kona',MAP.pts.kona],['reunion',MAP.pts.reunion]]);
  for(const [k,p] of dots){if(!p)continue;const o=ALLO()[k];const small=!BIG.includes(k);
    h+='<g class="dot" data-k="'+k+'" data-r="'+o.reg+'"><title>'+esc(o.name)+'</title><circle cx="'+p[0]+'" cy="'+p[1]+'" r="11" fill="transparent"/>'+
      '<circle class="v" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(small||PTS[k]?4:2.6)+'" fill="'+(PTS[k]||small?REG[o.reg].color:'var(--paper)')+'" stroke="var(--paper)" stroke-width="1.2"/></g>'}
  svg.innerHTML=h;
  svg.onclick=e=>{const t=e.target.closest('[data-k]');if(t)selectOrigin(t.dataset.k,false)};
  svg.onmousemove=e=>{const t=e.target.closest('[data-k]');const n=$('mapname');if(t){n.textContent=(ALLO()[t.dataset.k].flag||'')+' '+ALLO()[t.dataset.k].name;n.classList.add('show')}else n.classList.remove('show')};
  svg.onmouseleave=()=>$('mapname').classList.remove('show');
  const views=[['all','World'],['africa','Africa and Arabia'],['asia','Asia and Pacific'],['americas','The Americas']];
  $('mapzoom').className='mapbar seg filters';
  $('mapzoom').innerHTML=views.map(([k,l])=>'<button type="button" data-z="'+k+'" aria-pressed="'+(k==='all')+'">'+l+'</button>').join('')+'<button type="button" data-z="rand">Surprise me</button>';
  $('mapzoom').onclick=e=>{const b=e.target.closest('[data-z]');if(!b)return;if(b.dataset.z==='rand'){const ks=Object.keys(ALLO());let k;do{k=ks[Math.floor(Math.random()*ks.length)]}while(k===SEL);selectOrigin(k,true)}else zoomTo(b.dataset.z)};
  $('legend').innerHTML=Object.entries(REG).map(([k,r])=>'<button type="button" data-hl="'+k+'" aria-pressed="false"><i style="background:'+r.color+'"></i>'+r.name+'</button>').join('');
  $('legend').onclick=e=>{const b=e.target.closest('[data-hl]');if(!b)return;HL=HL===b.dataset.hl?null:b.dataset.hl;
    svg.classList.toggle('dim',!!HL);svg.querySelectorAll('.o').forEach(p=>p.classList.toggle('hl',p.dataset.r===HL));
    $('legend').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.hl===HL))};
  $('olist').innerHTML=Object.entries(REG).map(([rk,r])=>{const ks=Object.keys(ALLO()).filter(k=>ALLO()[k].reg===rk).sort((a,b)=>ALLO()[a].name.localeCompare(ALLO()[b].name));
    return'<h3><i style="background:'+r.color+'"></i>'+r.name+' <span class="hint">('+ks.length+')</span></h3><div class="chips">'+ks.map(k=>'<button class="chip" data-o="'+k+'">'+ALLO()[k].flag+' '+esc(ALLO()[k].name)+'</button>').join('')+'</div>'}).join('');
  $('olist').onclick=e=>{const b=e.target.closest('[data-o]');if(b){selectOrigin(b.dataset.o,true);$('worldmap').scrollIntoView({behavior:RM()?'auto':'smooth',block:'start'})}};
  emptyInfo();
}
function regionOf(k){const r=ALLO()[k].reg;return r==='central'||r==='south'?'americas':r==='arabia'?'africa':r}
function zoomTo(z){
  let box=[0,0,1000,520];
  if(z!=='all'){const keys=Object.keys(MAP.bbox).filter(k=>O[k]&&regionOf(k)===z);
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const k of keys){const b=MAP.bbox[k];x0=Math.min(x0,b[0][0]);y0=Math.min(y0,b[0][1]);x1=Math.max(x1,b[1][0]);y1=Math.max(y1,b[1][1])}
    if(z==='africa'){x1=Math.max(x1,MAP.pts.reunion[0]+10);y1=Math.max(y1,MAP.pts.reunion[1]+10)}
    const pad=24;x0-=pad;y0-=pad;x1+=pad;y1+=pad;let w=x1-x0,h=y1-y0;const ar=1000/520;
    if(w/h<ar){const nw=h*ar;x0-=(nw-w)/2;w=nw}else{const nh=w/ar;y0-=(nh-h)/2;h=nh}box=[x0,y0,w,h]}
  $('mapzoom').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.z===z));
  const from=VIEW.slice(),t0=performance.now(),dur=RM()?0:450;
  const step=now=>{const t=dur?Math.min(1,(now-t0)/dur):1,e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    VIEW=from.map((v,i)=>v+(box[i]-v)*e);$('worldmap').setAttribute('viewBox',VIEW.map(v=>v.toFixed(1)).join(' '));if(t<1)requestAnimationFrame(step)};
  requestAnimationFrame(step);
}
function emptyInfo(){
  $('info').innerHTML='<h2>Pick an origin</h2><p>Tap any coloured country or dot. Colours group origins by region; the shaded band is the coffee belt between the tropics.</p>'+
  '<div class="stats"><div><b>Where it all began</b><button class="chip" data-o="ethiopia" style="margin-top:4px">🇪🇹 Ethiopia</button> <button class="chip" data-o="yemen">🇾🇪 Yemen</button> <button class="chip" data-o="southsudan">🇸🇸 South Sudan</button></div><div><b>Feeling curious?</b>Tap "Surprise me" under the map.</div></div>';
}
$('info').onclick=e=>{const s=e.target.closest('[data-oshare]');if(s){openShare(originDoc(s.dataset.oshare));return}const b=e.target.closest('[data-o]');if(b)selectOrigin(b.dataset.o,true)};
function selectOrigin(k,zoom){
  const o=ALLO()[k];if(!o)return;SEL=k;
  document.querySelectorAll('#worldmap .o,#worldmap .dot').forEach(p=>p.classList.toggle('sel',p.dataset.k===k));
  if(zoom)zoomTo(k==='kona'?'all':regionOf(k));
  const r=REG[o.reg];
  $('info').innerHTML='<div class="flag" aria-hidden="true">'+o.flag+'</div><h2>'+esc(o.name)+'</h2><span class="pill"><i style="background:'+r.color+'"></i>'+r.name+'</span>'+
   '<h3>Regions</h3><div class="chips">'+o.subs.map(s=>'<span class="chip">'+esc(s)+'</span>').join('')+'</div>'+
   '<div class="stats"><div><b>Altitude</b>'+esc(o.alt)+'</div><div><b>Harvest</b>'+esc(o.harvest)+'</div><div><b>Processing</b>'+esc(o.process)+'</div></div>'+
   '<h3>In the cup</h3><p>'+esc(o.cup)+'</p><h3>Story</h3><p>'+esc(o.hist)+'</p>'+
   '<h3>Varieties grown here</h3><div class="chips">'+o.vars.map(vbtn).join('')+'</div>'+
   '<div class="fact"><b>Did you know?</b> '+esc(o.fact)+'</div><div class="actions"><button class="btn ghost" data-oshare="'+k+'">Share this origin</button></div>';
  const info=$('info');info.classList.remove('flash');void info.offsetWidth;info.classList.add('flash');
  if(MQ('(max-width:959px)')&&!zoom)info.scrollIntoView({behavior:RM()?'auto':'smooth',block:'nearest'});
}

/* ================= HISTORY ================= */
const SHORT={yemenia:'Yemeni landraces',liberica:'Liberica',ruiru:'Ruiru 11 / Batian',kent:'Kent',castillo:'Castillo',catuai:'Catuai',laurina:'Laurina',jackson:'Jackson / Mibirizi',centroamericano:'Centroamericano H1',eugenioides:'C. eugenioides',stenophylla:'C. stenophylla',arabica:'Coffea arabica',robusta:'C. canephora (Robusta)',landrace:'Ethiopian landraces',jarc:'JARC 74110 / 74112',geisha:'Geisha',bourbon:'Red Bourbon',kona:'Kona Typica'};
function drawTree(){
  const svg=$('tree');
  const pos={};for(const [id,x,y] of TREE.nodes){const lab=SHORT[id]||VBY[id].name;pos[id]={x,y,w:Math.ceil(textW(lab,'12px'))+34,lab}}
  let h='',W=0,H=0;for(const [a,b] of TREE.edges){const p=pos[a],c=pos[b];const x1=p.x+p.w,y1=p.y+12,x2=c.x,y2=c.y+12,mx=(x1+x2)/2;h+='<path class="e" data-a="'+a+'" data-b="'+b+'" d="M'+x1+' '+y1+' C'+mx+' '+y1+' '+mx+' '+y2+' '+x2+' '+y2+'"/>'}
  for(const id in (TREE.notes||{})){const p=pos[id];if(!p)continue;const nx=p.x+p.w+8;W=Math.max(W,nx+textW(TREE.notes[id],'italic 11px'));h+='<text class="tnote" x="'+nx+'" y="'+(p.y+16)+'">'+esc(TREE.notes[id])+'</text>'}
  for(const id in pos){const p=pos[id],c=FAM[VBY[id].fam].color;W=Math.max(W,p.x+p.w);H=Math.max(H,p.y+24);h+='<g class="n" data-id="'+id+'" tabindex="0" role="button" aria-label="'+esc(p.lab)+'"><rect x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="24" rx="12" stroke="'+c+'"/><circle cx="'+(p.x+12)+'" cy="'+(p.y+12)+'" r="4" fill="'+c+'"/><text x="'+(p.x+21)+'" y="'+(p.y+16)+'">'+esc(p.lab)+'</text></g>'}
  W=Math.ceil(W+20);H=Math.ceil(H+20);svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.style.setProperty('--tw',W+'px');
  svg.innerHTML=h;
}
function buildTree(){
  const svg=$('tree');drawTree();
  // Pill widths are measured from the real font, so redraw once web fonts arrive.
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(drawTree,()=>{});
  const parents={};for(const [a,b] of TREE.edges)(parents[b]=parents[b]||[]).push(a);
  const focus=id=>{const anc=new Set([id]),st=[id];while(st.length){const n=st.pop();for(const p of parents[n]||[])if(!anc.has(p)){anc.add(p);st.push(p)}}
    svg.classList.add('focus');svg.querySelectorAll('.n').forEach(n=>n.classList.toggle('on',anc.has(n.dataset.id)));svg.querySelectorAll('path.e').forEach(e=>e.classList.toggle('on',anc.has(e.dataset.a)&&anc.has(e.dataset.b)))};
  svg.onmouseover=e=>{const n=e.target.closest('.n');if(n)focus(n.dataset.id)};
  svg.onmouseleave=()=>svg.classList.remove('focus');
  svg.onclick=e=>{const n=e.target.closest('.n');if(!n){svg.classList.remove('focus');return}focus(n.dataset.id);openVariety(n.dataset.id)};
  svg.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){const n=e.target.closest('.n');if(n){e.preventDefault();focus(n.dataset.id);openVariety(n.dataset.id)}}};
  $('treelegend').innerHTML=Object.values(FAM).map(f=>'<span class="pill"><i style="background:'+f.color+'"></i>'+f.name+'</span>').join('')+'<span class="pill" style="font-style:italic">Italic notes: where DNA overturned the old story</span>';
  $('species').innerHTML=['arabica','robusta','liberica','eugenioides','stenophylla'].map(id=>{const v=VBY[id];return'<button type="button" class="card vcard" data-v="'+id+'" style="--c:'+FAM.species.color+'"><span class="fam">'+esc(v.origin)+'</span><h3>'+esc(v.name)+'</h3><p>'+esc(v.cup)+'</p></button>'}).join('');
  $('species').onclick=e=>{const b=e.target.closest('[data-v]');if(b)openVariety(b.dataset.v)};
  $('timeline').innerHTML=TIMELINE.map(([w,t,d])=>'<li><span class="when">'+esc(w)+'</span><h3>'+esc(t)+'</h3><p>'+esc(d)+'</p></li>').join('');
  $('people').innerHTML=PEOPLE.map(([n,r,d])=>'<div class="card hovercard"><h3>'+esc(n)+'</h3><p class="hint" style="margin:0 0 .3rem">'+esc(r)+'</p><p style="margin:0">'+esc(d)+'</p></div>').join('');
  if('IntersectionObserver' in window&&!RM()){document.documentElement.classList.add('js-anim');const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{threshold:.15});$('timeline').querySelectorAll('li').forEach(li=>io.observe(li))}
}
let QZ={i:0,score:0,order:[],answered:false};
function startQuiz(){QZ={i:0,score:0,order:QUIZ.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,8),answered:false};drawQuiz()}
function drawQuiz(){const el=$('quiz');
  if(QZ.i>=QZ.order.length){const s=QZ.score,n=QZ.order.length;el.innerHTML='<h3 style="margin-top:0">You scored '+s+' out of '+n+'</h3><p>'+(s===n?'Perfect. You could run a roastery.':s>=6?'Great result. A real coffee nerd.':s>=4?'Solid. The History and Varieties tabs have the rest.':'Good start. Explore the tabs and try again.')+'</p><div class="actions"><button class="btn" id="qz-again">Play again</button></div>';$('qz-again').onclick=startQuiz;if(s>=6)beans(30);return}
  const q=QUIZ[QZ.order[QZ.i]];
  el.innerHTML='<div class="qprog"><b style="width:'+(QZ.i/QZ.order.length*100)+'%"></b></div><p class="hint" style="margin:0">Question '+(QZ.i+1)+' of '+QZ.order.length+'. Score '+QZ.score+'</p><h3 style="margin-top:.3rem">'+esc(q[0])+'</h3>'+q[1].map((o,i)=>'<button type="button" class="qopt" data-a="'+i+'">'+esc(o)+'</button>').join('')+'<div id="qz-fb"></div>';
  QZ.answered=false;
  el.onclick=e=>{const b=e.target.closest('.qopt');if(b&&!QZ.answered){QZ.answered=true;const a=+b.dataset.a,ok=a===q[2];if(ok)QZ.score++;
      el.querySelectorAll('.qopt').forEach((x,i)=>{if(i===q[2])x.classList.add('right');else if(i===a)x.classList.add('wrong')});
      $('qz-fb').innerHTML='<p><b>'+(ok?'Correct.':'Not quite.')+'</b> '+esc(q[3])+'</p><button class="btn" id="qz-next">'+(QZ.i+1<QZ.order.length?'Next question':'See my score')+'</button>';
      $('qz-next').onclick=()=>{QZ.i++;drawQuiz()}}};
}

/* ================= GUIDE ================= */
let CALC=load('bb-calc',{dose:18,ratio:15});CALC.dose=num(CALC.dose,18,7,60);CALC.ratio=num(CALC.ratio,15,1,20);
function renderCalc(){
  $('c-dose').value=CALC.dose;$('c-ratio').value=CALC.ratio;$('cv-dose').textContent=CALC.dose+'g';$('cv-ratio').textContent='1:'+CALC.ratio;
  const w=Math.round(CALC.dose*CALC.ratio);
  seg('c-pre',[['1','1 cup'],['2','2 cups'],['esp','Espresso'],['cold','Cold brew']],()=>CALC.pre,v=>{CALC.pre=v;Object.assign(CALC,{'1':{dose:15,ratio:16.5},'2':{dose:30,ratio:16.5},'esp':{dose:18,ratio:2},'cold':{dose:50,ratio:8}}[v]);renderCalc()});
  $('c-out').innerHTML='<div><b>Water</b><span>'+w+'g</span><small>about '+w+' ml</small></div><div><b>In the cup</b><span>'+Math.round(CALC.ratio>4?w-CALC.dose*2:w-CALC.dose*0.1)+'g</span><small>after the grounds hold some back</small></div><div><b>Bloom water</b><span>'+Math.round(CALC.dose*2.5)+'g</span><small>about 2.5 times the dose</small></div><div><b>4:6 pours</b><span>'+Math.round(w/5)+'g</span><small>five equal pours</small></div>';
  save('bb-calc',CALC);
}
$('c-dose').oninput=e=>{CALC.dose=+e.target.value;CALC.pre=null;soon(renderCalc)};
$('c-ratio').oninput=e=>{CALC.ratio=+e.target.value;CALC.pre=null;soon(renderCalc)};
const TS=[['sour','Sour, sharp, thin',-1,'Under-extracted: the sweetness never made it out.'],['hollow','Weak and watery',-0.8,'Under-extracted or too much water.'],['flat','Flat, no acidity',0.6,'Slightly over-extracted or too hot.'],['bitter','Bitter',1,'Over-extracted or water too hot.'],['dry','Dry, papery, astringent',1.1,'Over-extracted, usually from fines or too much agitation.'],['muddy','Muddy, blurry',0.7,'Too fine for the process, or a grinder adding body.'],['harsh','Harsh or solvent-like',1,'An over-extracted ferment.'],['stall','Drawdown stalls',0.8,'Too fine, or too much agitation clogging the paper.']];
function renderTS(sel){
  $('ts-chips').innerHTML=TS.map(t=>'<button type="button" class="chip" data-ts="'+t[0]+'" aria-pressed="'+(sel===t[0])+'">'+t[1]+'</button>').join('');
  if(!sel){$('ts-out').innerHTML='';return}
  const t=TS.find(x=>x[0]===sel),g=S.grinder,G=GRINDERS[g],B=BREWERS[S.brewer];const dir=t[2]>0?1:-1;
  const newT=clamp(S.temp-dir*2,B.temp.min,B.temp.max);
  const extra={muddy:'Or move to the ZP6 Special or a paper-filter brewer for clarity.',stall:'Also pour more gently and swirl less.',harsh:'Also shorten the bloom and pour more gently.',hollow:'Or tighten the ratio by 1.',dry:'Also reduce agitation.'}[sel]||'';
  // Fixes start from your dial-in, but only if it sits in the brewer's normal window (about 1.5 recipe steps
  // either side of its baseline, e.g. ZP6 4.5 to 6.7 or K-Ultra 6.4 to 9.2 on a V60). Far outside it, reset first.
  const bx=baseX(g,S.brewer),off=bx==null?0:stepsBetween(g,bx,S.setting),at=(x,st)=>roundG(g,shift(g,bx,st*160)),lo=at(0,-1.5),hi=at(0,1.5),home=roundG(g,bx),unit=c=>(G.fmt==='rot'||G.unit==='clicks'?'click':'step')+(c===1?'':'s');
  const usual='<span class="ts-range">Usual range on '+art(brewName(B.name))+' '+esc(brewName(B.name))+': <b>'+esc(dial(g,lo))+'</b> to <b>'+esc(dial(g,hi))+'</b> on the '+esc(G.name)+'.</span>';
  let newG,msg;
  if(bx!=null&&Math.abs(off)>2.5){newG=home;
    msg='Your dial-in is set to <b>'+esc(gLabel(g,S.setting))+'</b>, which is much '+(off>0?'finer':'coarser')+' than a '+esc(B.name)+' normally needs. That alone can cause this. Start from <b>'+esc(gLabel(g,home))+'</b>, brew, then taste again.'}
  else{const want=roundG(g,shift(g,S.setting,dir*Math.abs(t[2])*160*0.6));newG=bx==null?want:dir>0?Math.min(want,Math.max(hi,S.setting)):Math.max(want,Math.min(lo,S.setting));const n=Math.abs(newG-S.setting);
    msg=n?'Try <b>'+esc(gLabel(g,newG))+'</b> ('+n+' '+unit(n)+' '+(dir>0?'coarser':'finer')+'), or keep the grind and use water at <b>'+newT+'°C</b>.'
      :'Your grind is already at the '+(dir>0?'coarse':'fine')+' end of the usual range, so change the water to <b>'+newT+'°C</b> instead.'}
  $('ts-out').innerHTML='<div class="tip"><b>'+t[3]+'</b><br>'+msg+' '+extra+usual+'</div>'+(newG!==S.setting?'<button class="btn" id="ts-apply">'+(bx!=null&&Math.abs(off)>2.5?'Reset the grind to '+esc(dial(g,newG)):'Use '+esc(dial(g,newG))+' in the dial-in')+'</button>':'');
  if(newG!==S.setting)$('ts-apply').onclick=()=>{S.setting=newG;render();showTab('dial');toast('Grind changed to '+dial(g,newG))};
}
$('ts-chips').onclick=e=>{const b=e.target.closest('[data-ts]');if(!b)return;renderTS(b.dataset.ts);const o=$('ts-out'),r=o.getBoundingClientRect();if(r.bottom>innerHeight-90)o.scrollIntoView({block:'center',behavior:RM()?'auto':'smooth'})};

/* ================= LOG ================= */
let STAR=0,DL=null;
function renderStars(){$('l-stars').innerHTML=[1,2,3,4,5].map(n=>'<button type="button" class="'+(n<=STAR?'on':'')+'" data-s="'+n+'" role="radio" aria-checked="'+(n===STAR)+'" aria-label="'+n+' stars">\u2605</button>').join('')}
$('l-stars').onclick=e=>{const b=e.target.closest('[data-s]');if(b){STAR=+b.dataset.s;renderStars()}};
/* ---------- Shared log (Firebase Realtime Database over REST, no SDK) ---------- */
// The Realtime Database URL of the Firebase project that holds shared logs (see README).
// Empty means shared logs are switched off. A 'bb-syncdb' value in localStorage overrides it, for testing.
const FIREBASE_DB_URL='';
const SYNC_DB=(()=>{try{return localStorage.getItem('bb-syncdb')||''}catch(e){return''}})()||FIREBASE_DB_URL;
let GROUP=load('bb-group',null);if(GROUP&&!(typeof GROUP.code==='string'&&/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(GROUP.code)))GROUP=null;
let ME=(()=>{try{return localStorage.getItem('bb-name')||''}catch(e){return''}})();
let PENDING=load('bb-pending',[]),STREAM=null,SYNC_STATE='off';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
// Older entries had no id or timestamp; give them one so they can be shared.
LOG.forEach(l=>{if(!l.id)l.id=uid();if(!l.ts){const t=Date.parse(l.date);l.ts=isNaN(t)?Date.now():t}});LOG.sort((a,b)=>b.ts-a.ts);save('bb-log',LOG);
const dbUrl=path=>SYNC_DB.replace(/\/+$/,'')+'/groups/'+GROUP.code+path+'.json';
const newCode=()=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';const r=crypto.getRandomValues(new Uint8Array(8));r.forEach((x,i)=>{c+=A[x%A.length];if(i===3)c+='-'});return c};
function setSync(st){SYNC_STATE=st;const el=$('sync-state');if(el){el.dataset.s=st;el.textContent={live:'Live',connecting:'Connecting…',offline:'Offline: changes will sync later',off:''}[st]||''}}
async function flush(){if(!GROUP||!SYNC_DB||!navigator.onLine)return;while(PENDING.length){const op=PENDING[0];
    try{const r=await fetch(dbUrl('/'+(op.col||'log')+'/'+op.id),op.op==='del'?{method:'DELETE'}:{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(op.data)});if(!r.ok)throw new Error(r.status)}
    catch(e){setSync('offline');return}PENDING.shift();save('bb-pending',PENDING)}}
// Shared data lives in collections under the group: 'log' (brews) and 'recipes'.
function queue(op,id,data,col='log'){if(!GROUP||!SYNC_DB)return;PENDING=PENDING.filter(p=>!(p.id===id&&(p.col||'log')===col));PENDING.push({col,op,id,data});save('bb-pending',PENDING);flush()}
// Replace a collection with what the server has, keeping local changes that have not been sent yet.
function mergeRemote(col,entries){const pend=new Map(PENDING.filter(p=>(p.col||'log')===col).map(p=>[p.id,p]));const out=[];
  for(const [id,e] of Object.entries(entries||{})){if(!e||typeof e!=='object'||pend.get(id)&&pend.get(id).op==='del')continue;out.push(Object.assign({},e,{id}))}
  for(const p of pend.values())if(p.op==='put'&&!out.some(e=>e.id===p.id))out.push(p.data);return out}
function applyRemote(snap){LOG=mergeRemote('log',snap.log).sort((a,b)=>(b.ts||0)-(a.ts||0));save('bb-log',LOG);renderLog();
  CREC=mergeRemote('recipes',snap.recipes).map(sanRec).filter(Boolean);save('bb-myrecipes',CREC);recipesChanged()}
function startStream(){stopStream();if(!GROUP||!SYNC_DB||typeof EventSource==='undefined')return;setSync('connecting');
  let snap={};const es=STREAM=new EventSource(dbUrl(''));
  // Apply a streamed change at its path, e.g. "/log/abc" or "/recipes/xyz/name".
  const onData=(ev,merge)=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}if(!m)return;const segs=(m.path||'/').split('/').filter(Boolean);
    if(!segs.length)snap=merge?Object.assign(snap,m.data||{}):(m.data||{});
    else{let o=snap;for(const k of segs.slice(0,-1)){if(!o[k]||typeof o[k]!=='object')o[k]={};o=o[k]}const last=segs.at(-1);
      if(m.data===null)delete o[last];else o[last]=merge&&o[last]&&typeof o[last]==='object'?Object.assign({},o[last],m.data):m.data}
    setSync('live');applyRemote(snap);flush()};
  es.addEventListener('put',e=>onData(e,false));es.addEventListener('patch',e=>onData(e,true));
  es.addEventListener('cancel',()=>{setSync('offline')});es.onerror=()=>setSync(navigator.onLine?'connecting':'offline')}
function stopStream(){if(STREAM){STREAM.close();STREAM=null}}
function joinGroup(code,name){ME=name.trim().slice(0,30);try{localStorage.setItem('bb-name',ME)}catch(e){}GROUP={code};save('bb-group',GROUP);
  LOG.forEach(l=>{if(!l.by)l.by=ME;queue('put',l.id,l)});CREC.forEach(r=>{if(!r.author)r.author=ME;queue('put',r.id,r,'recipes')});renderLog();startStream()}
function leaveGroup(){stopStream();GROUP=null;PENDING=[];save('bb-group',null);save('bb-pending',[]);try{localStorage.removeItem('bb-group')}catch(e){}setSync('off');renderLog()}
addEventListener('online',()=>{if(GROUP){flush();if(!STREAM)startStream()}});addEventListener('offline',()=>{if(GROUP)setSync('offline')});
function inviteDoc(){const link=SITE_URL+'#join='+GROUP.code;return{link,title:'Join my brew log',sub:'Shared log code '+GROUP.code,file:'brew-log-invite',blocks:[{p:'Tap the link to see and add to our shared coffee log in The Brew Bench:'},{p:link},{p:'Or open the app, go to Log and enter the code '+GROUP.code+'.'}]}}
function renderShare(){const el=$('l-share');if(!el)return;
  if(!SYNC_DB){el.innerHTML='<h3>Shared log</h3><p class="hint">Log brews together with friends and see each other’s entries live. This needs a one-time setup by whoever runs the app (see the README).</p>';return}
  if(!GROUP){el.innerHTML='<h3>Shared log</h3><p class="hint" style="margin-top:0">Log brews together: everyone in the group sees each other’s entries on their own phone.</p>'+
    '<div class="field"><label for="sh-name">Your name</label><input id="sh-name" maxlength="30" placeholder="e.g. Maher" value="'+esc(ME)+'"></div>'+
    '<div class="actions"><button class="btn" id="sh-new">Start a shared log</button></div>'+
    '<div class="field" style="margin-top:12px"><label for="sh-code">Or join with a code</label><div class="joinrow"><input id="sh-code" placeholder="ABCD-2345" maxlength="9" autocapitalize="characters" value="'+esc(JOIN_CODE||'')+'"><button class="btn ghost" id="sh-join">Join</button></div></div>';
    const name=()=>{const n=$('sh-name').value.trim();if(!n){toast('Add your name first, so friends know who logged what');$('sh-name').focus()}return n};
    $('sh-new').onclick=()=>{const n=name();if(n){joinGroup(newCode(),n);toast('Shared log started. Invite your friends.')}};
    $('sh-join').onclick=()=>{const n=name();if(!n)return;const c=$('sh-code').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(c.length!==8){toast('Codes look like ABCD-2345');return}JOIN_CODE='';joinGroup(c.slice(0,4)+'-'+c.slice(4),n);toast('Joined the shared log')};return}
  el.innerHTML='<div class="sharehead"><h3 style="margin:0">Shared log</h3><span class="sync" id="sync-state"></span></div><p class="hint" style="margin:.3rem 0 .8rem">You are <b>'+esc(ME||'Guest')+'</b>. Code <b class="code">'+GROUP.code+'</b></p>'+
    '<div class="actions"><button class="btn" id="sh-invite">Invite friends</button><button class="btn ghost" id="sh-leave">Leave</button></div>';
  $('sh-invite').onclick=()=>openShare(inviteDoc());
  $('sh-leave').onclick=()=>{if(confirm('Leave the shared log? Your phone keeps a copy of the entries.'))leaveGroup()};setSync(SYNC_STATE==='off'?'connecting':SYNC_STATE)}
let JOIN_CODE='';
const fmtDate=l=>{const d=new Date(l.ts||Date.parse(l.date));return isNaN(d)?(l.date||''):d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'})};
function renderLog(){renderShare();
  $('l-list').innerHTML=LOG.length?LOG.map((l,i)=>'<div class="logentry"><div class="lehead"><b>'+esc(l.coffee||'Untitled')+'</b>'+(l.stars?'<span class="stars-sm" aria-label="'+l.stars+' stars">'+'★'.repeat(+l.stars||0)+'<span>'+'★'.repeat(5-(+l.stars||0))+'</span></span>':'')+'<button class="x" data-del="'+i+'" aria-label="Delete entry">Delete</button></div>'+
    '<div class="hint">'+esc(fmtDate(l))+(l.by&&GROUP?' · '+esc(l.by===ME?'you':l.by):'')+'</div>'+(l.settings?'<div class="hint">'+esc(l.settings)+'</div>':'')+(l.pred?'<div class="hint">Predicted: '+esc(l.pred)+'</div>':'')+(l.notes?'<p>'+esc(l.notes)+'</p>':'')+'</div>').join(''):'<p class="hint">No brews logged yet. Dial one in, then tap "Log this brew".</p>';
  const rated=LOG.filter(l=>+l.stars>0),avg=rated.length?(rated.reduce((a,l)=>a+ +l.stars,0)/rated.length).toFixed(1):'–';
  const cnt={};LOG.forEach(l=>{if(l.brewer)cnt[l.brewer]=(cnt[l.brewer]||0)+1});const fav=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
  const best=rated.slice().sort((a,b)=>b.stars-a.stars||b.ts-a.ts)[0];
  const stat=(k,v,small)=>'<div><b>'+k+'</b><span'+(String(v).length>6?' style="font-size:1rem"':'')+'>'+v+'</span>'+(small?'<small>'+small+'</small>':'')+'</div>';
  $('l-stats').innerHTML=LOG.length?stat('Brews logged',LOG.length)+stat('Average rating',avg,rated.length?'out of 5':'no ratings yet')+(fav?stat('Favourite brewer',esc(BREWERS[fav[0]]?BREWERS[fav[0]].name:fav[0])):'')+(best?stat('Top coffee',esc(best.coffee||'Untitled')):''):'';
  $('l-csv').hidden=!LOG.length;
}
$('tolog').onclick=()=>{const r=compute(S);
  $('l-settings').value=gLabel(S.grinder,S.setting)+', '+BREWERS[S.brewer].name+', '+S.temp+'°C, 1:'+S.ratio+', '+BREWERS[S.brewer].bloom.label.toLowerCase()+' '+S.bloom+'s, '+PROCESSES[S.process].name+' '+vName(S.variety);
  $('l-pred').value=verdict(r.D)[0];$('l-settings').dataset.brewer=S.brewer;showTab('log');$('l-coffee').focus()};
$('l-save').onclick=()=>{const e={id:uid(),ts:Date.now(),date:new Date().toLocaleDateString(),coffee:$('l-coffee').value.trim(),settings:$('l-settings').value.trim(),stars:STAR,pred:$('l-pred').value.trim(),notes:$('l-notes').value.trim(),brewer:$('l-settings').dataset.brewer||''};
  if(GROUP)e.by=ME;
  if(!e.coffee&&!e.settings&&!e.notes){toast('Add a coffee name or some notes first');return}LOG.unshift(e);save('bb-log',LOG);queue('put',e.id,e);['l-coffee','l-settings','l-pred','l-notes'].forEach(id=>$(id).value='');delete $('l-settings').dataset.brewer;STAR=0;renderStars();renderLog();toast(GROUP?'Brew saved and shared':'Brew saved');beans()};
$('l-list').onclick=e=>{const b=e.target.closest('[data-del]');if(!b)return;const l=LOG[+b.dataset.del];if(!l)return;
  if(GROUP&&l.by&&l.by!==ME&&!confirm('Delete '+l.by+'’s entry for everyone?'))return;LOG.splice(+b.dataset.del,1);save('bb-log',LOG);queue('del',l.id);renderLog();toast('Entry deleted')};
$('l-csv').onclick=()=>{const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[['Date','Coffee','Settings','Stars','Predicted','Notes']].concat(LOG.map(l=>[l.date,l.coffee,l.settings,l.stars,l.pred,l.notes]));
  saveFile('brew-log.csv',new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv'}))};

/* ================= SCAN ================= */
let SC=Object.assign({origin:'colombia',process:'washed',variety:'pinkbourbon',roast:'light',date:'',brewer:'v60',grinder:'zp6',info:null},load('bb-scan',{}));if(!MYG.includes(SC.grinder))SC.grinder=MYG[0];
if(!PROCESSES[SC.process])SC.process='washed';if(!vById(SC.variety))SC.variety='pinkbourbon';if(!ALLO()[SC.origin])SC.origin='colombia';if(!PBREWERS.includes(SC.brewer))SC.brewer='v60';
let SCANS=load('bb-scans',[]),SAMPLE=null,IMGS=null,SFILE=null,SCTL=null;
function daysSince(d){if(!d)return 14;const t=Date.parse(d);if(isNaN(t))return 14;return clamp(Math.round((Date.now()-t)/864e5),1,90)}
function initScan(){
  $('s-origin').innerHTML=Object.entries(REG).map(([rk,r])=>'<optgroup label="'+r.name+'">'+Object.keys(ALLO()).filter(k=>ALLO()[k].reg===rk).sort((a,b)=>ALLO()[a].name.localeCompare(ALLO()[b].name)).map(k=>'<option value="'+k+'">'+esc(ALLO()[k].name)+'</option>').join('')+'</optgroup>').join('');
  $('s-brewer').innerHTML=brewerOptions(PBREWERS);
  for(const [id,key] of [['s-origin','origin'],['s-process','process'],['s-variety','variety'],['s-brewer','brewer'],['s-date','date']])$(id).onchange=e=>{SC[key]=e.target.value;if(key==='brewer'&&!canGrind(SC.grinder,SC.brewer))SC.grinder=capable(SC.brewer);renderScan()};
  // Two ways in: the camera straight away, or a photo already on the phone. Typing or pasting the text is below.
  $('scan-pick').onclick=()=>openCamera();$('scan-choose').onclick=()=>$('scan-file').click();
  $('scan-drop').onclick=e=>{if(e.target.tagName!=='INPUT')openCamera()}; /* the hidden inputs sit inside the box, so their clicks bubble up to it */
  $('scan-cam').onchange=$('scan-file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)usePhoto(f)};
  $('scan-go').onclick=()=>runScan(true);$('scan-text-go').onclick=()=>runScan(false);$('scan-stop').onclick=()=>SCTL&&SCTL.abort();
  $('scan-list').onclick=e=>{const b=e.target.closest('[data-scan]');if(b){const s=SCANS[+b.dataset.scan];Object.assign(SC,s.sc);SC.info=s.info;renderScan();window.scrollTo({top:0,behavior:RM()?'auto':'smooth'})}};
  renderScan();
}
function scanPrompt(extra){
  const ok=Object.entries(ALLO()).map(([k,o])=>k+'='+o.name).join('; ');
  const pk=Object.entries(PROCESSES).map(([k,p])=>k+'='+p.name).join('; ');
  const vk=V.map(v=>v.id+'='+v.name).join('; ');
  return 'You are reading a specialty coffee bag, label or roaster card'+(extra?' (text below)':' (photo attached)')+'. Extract what is actually written; do not invent details. Then map to the allowed keys.\n\n'+
   'Allowed origin keys: '+ok+'\nAllowed process keys: '+pk+'\nAllowed variety keys: '+vk+'\n\n'+
   'Reply with ONLY one JSON object with these fields (use "" or [] or null when not shown):\n'+
   '{"roaster":"","coffee_name":"","country":"","origin_key":null,"region":"","producer_or_farm":"","altitude":"","varieties":[],"variety_key":null,"process":"","process_key":null,"roast_level":"light|medium|dark|unknown","roast_date":"YYYY-MM-DD or \\"\\"","tasting_notes":[],"summary":"one or two sentences on what to expect in the cup","confidence":"high|medium|low"}\n'+
   'Choose the closest key; for a blend of varieties pick the dominant one. If the roast date has no year, assume the most recent past date. Today is '+new Date().toISOString().slice(0,10)+'.'+(extra?'\n\nLabel text:\n'+extra.slice(0,4000):'');
}
async function runScan(useImg){
  if(!SAMPLE||(useImg&&!IMGS))return runLocalScan(useImg);
  const txt=$('scan-text').value.trim();if(!useImg&&!txt){toast('Paste the label text first');return}if(useImg&&!SFILE){toast('Take or choose a photo first');return}
  SCTL=new AbortController();$('scan-stop').hidden=false;$('scan-go').disabled=true;$('scan-drop').classList.add('scanning');$('scan-status').textContent='Reading the label\u2026 this can take up to a minute.';
  try{
    const j=await SAMPLE.json(scanPrompt(useImg?'':txt),Object.assign({signal:SCTL.signal},useImg?{images:SFILE}:{}));
    if(!j||typeof j!=='object')throw{code:'invalid_json'};
    if(j.origin_key&&ALLO()[j.origin_key])SC.origin=j.origin_key;
    if(j.process_key&&PROCESSES[j.process_key])SC.process=j.process_key;
    if(j.variety_key&&VBY[j.variety_key])SC.variety=j.variety_key;
    if(['light','medium','dark'].includes(j.roast_level))SC.roast=j.roast_level;
    if(/^\d{4}-\d{2}-\d{2}$/.test(j.roast_date||''))SC.date=j.roast_date;
    SC.info=j;$('scan-status').textContent='Done'+(j.confidence==='low'?'. Low confidence: check the details below.':'. Check the details below and adjust anything that looks off.');
    renderScan();saveScan();toast('Label read');
  }catch(e){const c=e&&e.code;$('scan-status').textContent=c==='cancelled'?'Stopped.':c==='not_granted'||c==='sampling_disabled'?'Claude access for this page was declined, so fill in the details by hand.':c==='images_unavailable'?'Photo reading isn\u2019t available here; paste the label text instead.':c==='image_rejected'?'That image couldn\u2019t be read. Try a clearer, smaller photo.':c==='rate_limited'?'Too many requests right now. Try again in a little while.':c==='invalid_json'?'The label couldn\u2019t be turned into details. Try again or paste the text.':'Something went wrong reading the label. Try again.'}
  finally{$('scan-stop').hidden=true;$('scan-go').disabled=!SFILE;$('scan-drop').classList.remove('scanning')}
}
/* ---------- Reading a label on the phone itself (no Claude needed) ---------- */
// Text recognition runs in the browser with Tesseract.js (bundled in vendor/ocr, loaded only when needed).
let OCR=null,OCR_PROGRESS=null,OCR_PLAIN=false;
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('Could not load '+src));document.head.appendChild(s)})}
// Phones that can't run the faster (SIMD) reader get the plain one.
const SIMD_OK=(()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]))}catch(e){return false}})();
const withTimeout=(pr,ms,code)=>new Promise((ok,no)=>{const t=setTimeout(()=>no(Object.assign(new Error(code),{code})),ms);pr.then(v=>{clearTimeout(t);ok(v)},e=>{clearTimeout(t);no(e)})});
// Download a file with visible progress. The copy lands in the browser cache, so the reader picks it up from there.
async function fetchProgress(url,onBytes){const res=await withTimeout(fetch(url),30000,'stalled');if(!res.ok)throw Object.assign(new Error('download'),{code:'download'});
  const total=res.headers.get('content-encoding')?0:+res.headers.get('content-length')||0; /* compressed in transit: the length isn't the file size */if(!res.body||!res.body.getReader){await res.arrayBuffer();onBytes(total,total);return}
  const rd=res.body.getReader();let got=0;for(;;){const {done,value}=await withTimeout(rd.read(),30000,'stalled');if(done)break;got+=value.length;onBytes(got,total)}}
async function ocrWorker(onProgress){OCR_PROGRESS=onProgress;
  if(!OCR)OCR=(async()=>{const base=new URL('vendor/ocr/',location.href).href,core=base+(SIMD_OK&&!OCR_PLAIN?'tesseract-core-simd-lstm.wasm.js':'tesseract-core-lstm.wasm.js');
    if(!window.Tesseract)await loadScript(base+'tesseract.min.js');
    // First use downloads about 7 MB; show it in megabytes so it never looks stuck.
    const files=[core,base+'eng.traineddata.gz'],done=[0,0],size=[3.94e6,2.95e6];
    await Promise.all(files.map((u,k)=>fetchProgress(u,(g,t)=>{done[k]=g;size[k]=Math.max(t||size[k],g);const G=done[0]+done[1],T=size[0]+size[1];OCR_PROGRESS&&OCR_PROGRESS('download',Math.min(1,G/T),G,T)})));
    OCR_PROGRESS&&OCR_PROGRESS('start',0);
    return withTimeout(Tesseract.createWorker('eng',1,{workerPath:base+'worker.min.js',corePath:core,langPath:base,gzip:true,workerBlobURL:false,
      errorHandler:()=>{},logger:m=>{if(OCR_PROGRESS&&m&&typeof m.progress==='number')OCR_PROGRESS(m.status,m.progress)}}),40000,'start')})()
    // If the fast reader doesn't start on this phone, try the plain one once before giving up.
    .catch(e=>{OCR=null;if(e&&e.code==='start'&&SIMD_OK&&!OCR_PLAIN){OCR_PLAIN=true;return ocrWorker(OCR_PROGRESS)}throw e});
  return OCR}
// Shrink big camera photos and boost contrast so text recognition is faster and more accurate.
function prepImage(file){return new Promise((ok,no)=>{const img=new Image();img.onload=()=>{const k=Math.min(1,2400/Math.max(img.width,img.height)); /* big enough that small print on a label stays readable */const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
  const x=c.getContext('2d');x.filter='grayscale(1) contrast(1.35)';x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(img.src);ok(c)};img.onerror=()=>no(new Error('image'));img.src=URL.createObjectURL(file)})}
const fold=t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[’']/g,"'");
const reEsc=t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Find the longest alias that appears as a whole word or phrase.
function findBest(text,entries){let best=null;for(const [alias,val] of entries){if(alias.length<3)continue;const m=new RegExp('(^|[^a-z0-9])'+reEsc(alias)+'($|[^a-z0-9])').exec(text);
  if(m&&(!best||alias.length>best.alias.length))best={alias,val,at:m.index}}return best}
// Every alias found, in label order; where matches overlap, the longer one wins ("pink bourbon" over "bourbon").
function findAll(text,entries){const hits=[];for(const [alias,val] of entries){if(alias.length<3)continue;const re=new RegExp('(^|[^a-z0-9])('+reEsc(alias)+')(?=$|[^a-z0-9])','g');let m;
    while(m=re.exec(text)){const at=m.index+m[1].length;hits.push({alias,val,at,end:at+alias.length})}}
  hits.sort((a,b)=>a.at-b.at||b.alias.length-a.alias.length);const out=[];for(const h of hits){const o=out.find(x=>h.at<x.end&&x.at<h.end);if(!o)out.push(h);else if(h.alias.length>o.alias.length)out[out.indexOf(o)]=h}return out}
let LEX=null;
function lexicon(){if(LEX)return LEX;
  const strip=n=>fold(n).replace(/\([^)]*\)/g,' ').replace(/["“”]/g,'').replace(/\s+/g,' ').trim();
  const V_EXTRA={geisha:['geisha','gesha'],landrace:['heirloom','ethiopian landrace','ethiopian landraces','ethiopian heirloom','landrace'],jarc:['jarc','74110','74112','74158'],robusta:['robusta','canephora'],
    liberica:['liberica','excelsa'],yemenia:['yemenia','yemeni landrace'],kent:['kent','s795','s 795'],laurina:['laurina','bourbon pointu'],catuai:['catuai','red catuai','yellow catuai'],
    castillo:['castillo'],ruiru:['ruiru 11','ruiru','batian'],jackson:['jackson','mibirizi'],centroamericano:['centroamericano','h1'],bourbon:['bourbon','red bourbon'],kona:['kona typica']};
  const vars=[];for(const v of V){if(v.id==='arabica')continue; /* "100% Arabica" on a bag says nothing about the variety */for(const a of (V_EXTRA[v.id]||[strip(v.name)]))vars.push([a,v.id])}
  const P_EXTRA={washed:['washed','fully washed','wet process','wet processed'],doublewashed:['double washed','kenyan process','kenya process'],ecopulped:['eco pulped','eco-pulped','demucilaged'],
    natural:['natural','dry process','dry processed','sun dried','sun-dried'],pulpednatural:['pulped natural'],wethulled:['wet hulled','wet-hulled','giling basah'],honey:['honey'],
    whitehoney:['white honey','yellow honey'],redhoney:['red honey'],blackhoney:['black honey'],anaerobic:['anaerobic'],anaerobicnatural:['anaerobic natural'],anaerobicwashed:['anaerobic washed'],
    carbonic:['carbonic maceration','carbonic'],lactic:['lactic'],yeast:['yeast'],koji:['koji'],extended:['extended fermentation'],thermalshock:['thermal shock'],mossto:['mossto'],
    coferment:['co-ferment','co-fermented','coferment','cofermented','co ferment'],infused:['infused'],barrelaged:['barrel aged','barrel-aged'],monsooned:['monsooned'],aged:['aged green'],
    swisswater:['swiss water'],sugarcane:['sugarcane','sugar cane','ethyl acetate','ea decaf'],co2decaf:['co2 decaf','co2 process'],mcdecaf:['methylene chloride']};
  const procs=[];for(const k in PROCESSES)for(const a of (P_EXTRA[k]||[strip(PROCESSES[k].name)]))procs.push([a,k]);
  const countries=[],regions=[];for(const [k,o] of Object.entries(ALLO())){const n=fold(o.name);const main=n.replace(/\(.*$/,'').trim();countries.push([main,k]);
    const inner=(n.match(/\(([^)]*)\)/)||[])[1];if(inner)regions.push([inner.trim(),k]);for(const r of o.subs||[])for(const part of fold(r).replace(/\([^)]*\)/g,'').split(/[:,/]/))if(part.trim())regions.push([part.trim(),k])}
  countries.push(['cote d\'ivoire','ivorycoast'],['ivory coast','ivorycoast'],['png','png'],['congo','drc'],['drc','drc'],['usa hawaii','hawaii']);
  const notes=new Set();for(const v of V)(v.notes||[]).forEach(n=>notes.add(fold(n)));for(const k in PROCESSES)(PROCESSES[k].notes||[]).forEach(n=>notes.add(fold(n)));
  ['chocolate','dark chocolate','milk chocolate','caramel','toffee','honey','brown sugar','molasses','vanilla','almond','hazelnut','walnut','peach','apricot','nectarine','plum','cherry','blackcurrant','blueberry','strawberry','raspberry','blackberry','grape','lemon','lime','orange','grapefruit','bergamot','mandarin','tangerine','pineapple','mango','papaya','passion fruit','lychee','guava','coconut','banana','apple','green apple','pear','jasmine','rose','hibiscus','lavender','floral','black tea','green tea','earl grey','cinnamon','clove','cardamom','nutmeg','tamarind','red wine','whisky','rum','cola','maple','date','fig','raisin','cacao','cocoa','nougat','marzipan','butterscotch','panela','sugarcane','melon','watermelon','kiwi','pomegranate','cranberry','rhubarb','sweet','juicy','bright','silky'].forEach(n=>notes.add(n));
  return LEX={vars,procs,countries,regions,notes:[...notes].filter(n=>n.length>2)}}
const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
function findDate(raw){const t=fold(raw),now=new Date(),cands=[];
  const add=(y,m,d,at)=>{y=+y;m=+m;d=+d;if(!y)y=now.getFullYear();else if(y<100)y+=2000;if(m<1||m>12||d<1||d>31)return;let dt=new Date(y,m-1,d);if(dt>now)dt=new Date(y-1,m-1,d); /* no year printed: assume the most recent one */
    if(dt>now||now-dt>400*864e5)return;cands.push({iso:dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'),at})};
  let m;const r1=/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g;while(m=r1.exec(t))add(m[1],m[2],m[3],m.index);
  const r2=/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/g;while(m=r2.exec(t))add(m[3],m[2],m[1],m.index); /* day first, as on most bags */
  const mon='(jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec)[a-z]*\\.?';
  const r3=new RegExp('(\\d{1,2})(?:st|nd|rd|th)?\\s+'+mon+'(?:,?\\s+(\\d{2,4}))?','g');while(m=r3.exec(t))add(m[3]||0,MONTHS[m[2]],m[1],m.index);
  const r4=new RegExp(mon+'\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{2,4}))?','g');while(m=r4.exec(t))add(m[3]||0,MONTHS[m[1]],m[2],m.index);
  if(!cands.length)return null;const k=t.search(/roast/);if(k<0)return cands[0].iso;cands.sort((a,b)=>Math.abs(a.at-k)-Math.abs(b.at-k));return cands[0].iso}
// Turn label text into the same fields the Claude reader returns.
function parseLabel(raw){const L=lexicon(),t=' '+fold(raw).replace(/[|_~*]+/g,' ').replace(/[ \t]+/g,' ')+' ';const lines=String(raw).split(/\n+/).map(x=>x.trim()).filter(Boolean);const info={source:'phone'};let hits=0;
  const c=findBest(t,L.countries),r=findBest(t,L.regions);if(c){info.origin_key=c.val;hits++}else if(r){info.origin_key=r.val;hits++}
  if(r&&(!c||r.val===c.val))info.region=r.alias.replace(/\b\w/g,x=>x.toUpperCase());
  const vs=findAll(t,L.vars);if(vs.length){info.variety_key=vs[0].val;info.varieties=[...new Set(vs.map(x=>VBY[x.val].name.replace(/\s*\(.*$/,'')))];hits++}
  const pr=findBest(t,L.procs);if(pr){info.process_key=pr.val;info.process=PROCESSES[pr.val].name;hits++}
  if(info.variety_key==='geisha'&&info.origin_key){const sub={panama:'panama',costarica:'costarica',colombia:'colombia',ethiopia:'ethiopia'}[info.origin_key];info.variety_key='geisha:'+(sub||'other')}
  const rl=/\b(light|medium|dark)(?:[- ](?:roast|roasted))?\b/.exec(t);info.roast_level=rl?rl[1]:/\bfilter\b/.test(t)?'light':/\bespresso\b/.test(t)?'medium':null;
  const d=findDate(raw);if(d){info.roast_date=d;hits++}
  const al=/(\d{1,2}[.,]?\d{3})\s*(?:-|–|to)\s*(\d{1,2}[.,]?\d{3})\s*(?:m\b|mas\S?|meters|metres)|(\d{1,2}[.,]?\d{3})\s*(?:m\b|mas\S?|meters|metres)|(?:altitude|elevation)\s*:?\s*(\d{1,2}[.,]?\d{3})/.exec(t);if(al)info.altitude=(al[3]||al[4]||al[1]+' to '+al[2]).replace(/[.,]/g,',')+' m';
  const nl=lines.find(x=>/(tasting )?notes?\s*[:\-]|tastes? like|flavou?rs?\s*[:\-]|in the cup\s*[:\-]/i.test(x));let notes=[];
  if(nl)notes=nl.replace(/^.*?(?:notes?|tastes? like|flavou?rs?|in the cup)\s*[:\-]?\s*/i,'').split(/\s*(?:,|\/|&|\+|•|·|\band\b)\s*/i).map(x=>x.trim()).filter(x=>x.length>2&&x.length<30);
  if(!notes.length){const seen=[];for(const n of L.notes){const m=new RegExp('(^|[^a-z])'+reEsc(n)+'($|[^a-z])').exec(t);if(m)seen.push([m.index,n])}notes=seen.sort((a,b)=>a[0]-b[0]).map(x=>x[1]).filter((n,i,a)=>!a.some((o,j)=>j!==i&&o.includes(n)&&o!==n)).slice(0,5)}
  if(notes.length){info.tasting_notes=notes.slice(0,6).map(n=>n.replace(/^\w/,x=>x.toUpperCase()));hits++}
  const farm=/\b(finca|hacienda|fazenda|sitio|estate|farm|washing station|cooperative|co-?op)\b[ :]*([a-z0-9' .-]{2,40})/i.exec(raw.replace(/\n/g,' ; '));
  const prod=/\b(?:producer|produced by|grower|farmer)s?\s*[:\-]\s*([^\n;,]{2,40})/i.exec(raw);
  if(prod)info.producer_or_farm=prod[1].trim();else if(farm)info.producer_or_farm=(/^(finca|hacienda|fazenda|sitio)$/i.test(farm[1])?farm[1]+' '+farm[2]:farm[2]+' '+farm[1]).replace(/\s+/g,' ').replace(/\s*[;.].*$/,'').trim().replace(/\b\w/g,x=>x.toUpperCase());
  const title=lines.find(x=>x.length>=3&&x.length<=40&&/[a-z]/i.test(x)&&!/[:@]|www\.|\.com|\d{3,}|roast|notes?|process|variety|altitude|origin|net|weight|\bg\b/i.test(x));if(title)info.coffee_name=title.replace(/^[^a-z0-9]+/i,'').replace(/\s+/g,' ');
  info.confidence=hits>=4?'high':hits>=2?'medium':'low';info.summary=hits?'Read on this phone. Check the details below and adjust anything that looks off.':'';
  return info}
function applyInfo(j){if(j.origin_key&&ALLO()[j.origin_key])SC.origin=j.origin_key;if(j.process_key&&PROCESSES[j.process_key])SC.process=j.process_key;
  if(j.variety_key&&vById(j.variety_key))SC.variety=j.variety_key;if(['light','medium','dark'].includes(j.roast_level))SC.roast=j.roast_level;if(/^\d{4}-\d{2}-\d{2}$/.test(j.roast_date||''))SC.date=j.roast_date;SC.info=j}
async function runLocalScan(useImg){
  const txt=$('scan-text').value.trim();if(!useImg&&!txt){toast('Paste the label text first');return}if(useImg&&!SFILE){toast('Take or choose a photo first');return}
  const st=$('scan-status'),mb=b=>(b/1e6).toFixed(1);let stop;const stopped=new Promise((_,no)=>{stop=()=>no(Object.assign(new Error('cancelled'),{code:'cancelled'}))});stopped.catch(()=>{});
  SCTL={abort:()=>stop()};$('scan-stop').hidden=!useImg;$('scan-go').disabled=true;$('scan-drop').classList.add('scanning');
  st.hidden=false;st.textContent=useImg?'Getting the text reader ready…':'Reading the text…';
  try{let text=txt;
    if(useImg){const w=await Promise.race([ocrWorker((status,p,g,t)=>{if(SCTL.done)return;st.textContent=status==='download'?'Downloading the text reader (first time only)… '+mb(g)+' of '+mb(t)+' MB'
          :/recogniz/.test(status)?'Reading the label… '+Math.round(p*100)+'%':'Starting the text reader…'}),stopped]);
      const img=await prepImage(SFILE);const res=await Promise.race([withTimeout(w.recognize(img),120000,'slow'),stopped]);text=res.data.text||'';$('scan-text').value=text.trim()}
    const j=parseLabel(text);if(!j.origin_key&&!j.variety_key&&!j.process_key&&!j.roast_date){st.textContent=useImg?'Couldn’t find coffee details in that photo. Try again with the label filling most of the photo, in sharp focus, or fill in the details below.':'No coffee details found in that text.';return}
    applyInfo(j);st.textContent=(j.confidence==='low'?'Found a few details. ':'Label read. ')+'Check them below and adjust anything that looks off.';renderScan();saveScan();toast('Label read')}
  catch(e){const c=e&&e.code;st.textContent=c==='cancelled'?'Stopped.'
      :c==='download'||c==='stalled'||!navigator.onLine?'The text reader couldn’t download. It needs a connection the first time only; try again on Wi-Fi, or fill in the details below.'
      :c==='start'?'The text reader didn’t start on this phone. Paste the label text below, or fill in the details by hand.'
      :c==='slow'?'Reading took too long. Try a closer photo of just the label, or fill in the details below.'
      :'The text reader couldn’t start. Try again, or fill in the details below.'}
  finally{if(SCTL)SCTL.done=true;$('scan-stop').hidden=true;$('scan-go').disabled=!SFILE;$('scan-drop').classList.remove('scanning')}}
function usePhoto(f){SFILE=f;if($('scan-prev').src.startsWith('blob:'))URL.revokeObjectURL($('scan-prev').src);
  $('scan-prev').src=URL.createObjectURL(f);$('scan-prev').hidden=false;$('scan-empty').hidden=true;$('scan-go').disabled=false;$('scan-again').hidden=false;$('scan-status').hidden=false;runScan(true)}
/* In-app camera. Some phones answer a file input's "use the camera" request with the gallery anyway, so the
   camera runs inside the app: a live viewfinder with a frame for the label and a shutter. If the camera can't
   start (no permission, no camera), the phone's own picker opens instead. */
let CAM=null;
async function openCamera(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){$('scan-cam').click();return}
  const d=$('vd');
  d.querySelector('#vd-in').innerHTML='<div class="cam"><div class="cam-view"><video id="cam-v" playsinline muted autoplay></video><div class="cam-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
    '<p class="cam-tip">Fill the frame with the label, hold steady</p><p class="cam-msg" id="cam-msg">Starting the camera…</p></div>'+
    '<div class="cam-bar"><button type="button" class="cam-side" id="cam-x" aria-label="Close camera">✕</button><button type="button" class="cam-shutter" id="cam-shot" aria-label="Take photo" disabled></button><button type="button" class="cam-side" id="cam-lib" aria-label="Choose from photos"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4"/><circle cx="15.5" cy="9" r="1.5"/></svg></button></div></div>';
  d.classList.add('camdlg');if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}
  const stop=()=>{if(CAM){CAM.getTracks().forEach(t=>t.stop());CAM=null}d.classList.remove('camdlg')};d.addEventListener('close',stop,{once:true});
  $('cam-x').onclick=()=>d.close();$('cam-lib').onclick=()=>{d.close();$('scan-file').click()};
  try{CAM=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:2560},height:{ideal:1920}}});
    if(!d.open){stop();return}const v=$('cam-v');v.srcObject=CAM;await v.play().catch(()=>{});$('cam-msg').hidden=true;$('cam-shot').disabled=false}
  catch(e){stop();d.close();toast(e&&e.name==='NotAllowedError'?'Camera access was declined, so your photos open instead':'The camera couldn’t start, so the phone’s picker opens instead');setTimeout(()=>$('scan-cam').click(),300);return}
  $('cam-shot').onclick=async()=>{const v=$('cam-v'),b=$('cam-shot');b.disabled=true;let blob=null;
    // A full-resolution still where the phone supports it, otherwise the current video frame.
    try{if(window.ImageCapture&&CAM)blob=await new ImageCapture(CAM.getVideoTracks()[0]).takePhoto()}catch(e){blob=null}
    if(!blob){const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.92))}
    d.close();if(blob)usePhoto(new File([blob],'label.jpg',{type:blob.type||'image/jpeg'}));else toast('Couldn’t take the photo. Try again.')}}
function thumb(cb){if(!SFILE){cb('');return}const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),s=160/Math.max(img.width,img.height);c.width=img.width*s;c.height=img.height*s;c.getContext('2d').drawImage(img,0,0,c.width,c.height);try{cb(c.toDataURL('image/jpeg',.7))}catch(e){cb('')}};img.onerror=()=>cb('');img.src=$('scan-prev').src}
function saveScan(){thumb(t=>{SCANS.unshift({t,info:SC.info,sc:{origin:SC.origin,process:SC.process,variety:SC.variety,roast:SC.roast,date:SC.date},when:new Date().toLocaleDateString()});SCANS=SCANS.slice(0,12);save('bb-scans',SCANS);renderScanList()})}
function renderScanList(){$('scan-list').innerHTML=SCANS.length?SCANS.map((s,i)=>'<button type="button" class="card vcard" data-scan="'+i+'" style="--c:var(--cherry)">'+(s.t?'<img src="'+s.t+'" alt="" style="width:100%;max-height:120px;object-fit:cover;border-radius:10px">':'')+'<h3 style="margin:.4rem 0 .1rem">'+esc((s.info&&(s.info.coffee_name||s.info.producer_or_farm))||originName(s.sc.origin))+'</h3><p class="hint" style="margin:0">'+esc(s.info&&s.info.roaster||'')+' '+esc(s.when)+'</p></button>').join(''):'<p class="hint">Scans you make appear here.</p>'}
function renderScan(){
  $('s-origin').value=SC.origin;$('s-process').value=SC.process;$('s-variety').value=SC.variety;$('s-date').value=SC.date||'';$('s-brewer').value=SC.brewer;
  seg('s-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>SC.roast,v=>{SC.roast=v;renderScan()});
  grinderSeg('s-grinder',(SC.brewer),()=>SC.grinder,v=>{SC.grinder=v;renderScan()});
  const age=daysSince(SC.date);const c={brewer:SC.brewer,grinder:SC.grinder,tech:techList(SC.brewer)[0][1],process:SC.process,variety:SC.variety,roast:SC.roast,age,goal:'balance'};
  const P=PROCESSES[SC.process],Vp=vParams(SC.variety);
  const tl=techList(SC.brewer);const pref=tl.find(([r])=>P.funk>=1.2?(r.kind==='kh1'||r.kind==='imm'||r.kind==='kh2'):Vp.clarity>=0.8?(r.kind==='46'||r.kind==='neo'||r.kind==='pulse'):true);if(pref)c.tech=pref[1];
  const p=plan(c);const o=ALLO()[SC.origin],inf=SC.info;
  const kv=inf?[['Roaster',inf.roaster],['Coffee',inf.coffee_name],['Producer or farm',inf.producer_or_farm],['Region',inf.region],['Altitude',inf.altitude],['Varieties',(inf.varieties||[]).join(', ')],['Process',inf.process],['Notes',(inf.tasting_notes||[]).join(', ')]].filter(x=>x[1]):[];
  $('scan-out').innerHTML=(inf?'<h2 style="margin-bottom:.2rem">'+esc(inf.coffee_name||inf.producer_or_farm||'Your coffee')+'</h2>'+(inf.summary?'<p>'+esc(inf.summary)+'</p>':'')+(kv.length?'<dl class="kv">'+kv.map(([k,v])=>'<dt>'+k+'</dt><dd>'+esc(v)+'</dd>').join('')+'</dl>':''):'<h2 style="margin-bottom:.2rem">Your coffee</h2><p class="hint">Scan a bag or fill in the details to get a plan.</p>')+
   '<div class="chips"><button class="chip" data-o="'+SC.origin+'">'+(o.flag||'')+' '+esc(o.name)+'</button>'+vbtn(SC.variety.split(':')[0])+'<span class="chip">'+esc(P.name)+'</span><span class="chip">'+age+' days off roast</span></div>'+
   '<h3>Recommended brew</h3>'+planHTML(p,c)+
   '<div class="actions"><button class="btn" id="sc-dial">Open in dial-in</button><button class="btn ghost" id="sc-plan">Fine-tune in planner</button><button class="btn ghost" id="sc-timer">Start brew timer</button><button class="btn ghost" id="sc-share">Share</button></div>';
  $('scan-out').querySelector('[data-o]').onclick=()=>{showTab('map');selectOrigin(SC.origin,true)};
  $('sc-dial').onclick=()=>{Object.assign(S,p.st);render();showTab('dial');toast('Loaded into the dial-in')};
  $('sc-plan').onclick=()=>{Object.assign(PL,c);renderPlan();showTab('planner')};
  $('sc-timer').onclick=()=>openTimer(c.tech,p);$('sc-share').onclick=()=>openShare(scanDoc(p,c));
  const cp=Object.assign({},SC);save('bb-scan',cp);renderScanList();
}

/* ================= SHARE ================= */
function pdfSafe(s){return String(s??'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[\u2013\u2014]/g,'-').replace(/\u2026/g,'...').replace(/\u2082/g,'2').replace(/\u2605/g,'*').replace(/\u2022/g,'\u00b7').replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g,'').replace(/\s+$/,'')}
function docText(doc,noLink){let t='# '+doc.title+'\n';if(doc.sub)t+=doc.sub+'\n';t+='\n';
  for(const b of doc.blocks){if(b.h)t+='## '+b.h+'\n';if(b.p)t+=b.p+'\n';if(b.kv)t+=b.kv.map(([k,v])=>'- '+k+': '+v).join('\n')+'\n';if(b.list)t+=b.list.map((x,i)=>(b.num?(i+1)+'. ':'- ')+x).join('\n')+'\n';t+='\n'}
  return t+(doc.link&&!noLink&&!t.includes(doc.link)?'Open it in The Brew Bench: '+doc.link+'\n':'Made with The Brew Bench\n')}
function docPDF(doc){
  const J=(window.jspdf||{}).jsPDF;if(!J)return null;
  const pdf=new J({unit:'pt',format:'a4'});const W=595,H=842,M=48,CW=W-2*M;let y=0;
  const brown=[138,90,59],ink=[59,42,32],muted=[122,102,86],cream=[243,234,220],green=[107,142,78];
  const page=()=>{pdf.setFillColor(251,247,240);pdf.rect(0,0,W,H,'F')};
  const need=h=>{if(y+h>H-56){pdf.addPage();page();y=M}};
  page();pdf.setFillColor(...cream);pdf.rect(0,0,W,118,'F');pdf.setFillColor(...green);pdf.rect(0,114,W,4,'F');
  pdf.setFillColor(...brown);pdf.ellipse(W-M-16,52,16,10,'F');pdf.setDrawColor(...cream);pdf.setLineWidth(1.6);pdf.line(W-M-28,52,W-M-4,52);
  pdf.setTextColor(...brown);pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.text('THE BREW BENCH',M,40);
  pdf.setTextColor(...ink);pdf.setFontSize(22);const tl=pdf.splitTextToSize(pdfSafe(doc.title),CW-50);pdf.text(tl.slice(0,2),M,68);
  if(doc.sub){pdf.setFont('helvetica','normal');pdf.setFontSize(10.5);pdf.setTextColor(...muted);pdf.text(pdf.splitTextToSize(pdfSafe(doc.sub),CW)[0],M,tl.length>1?104:92)}
  y=148;
  const para=(txt,size=10.5,col=ink,bold=false,indent=0)=>{pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...col);
    const lines=pdf.splitTextToSize(pdfSafe(txt),CW-indent);for(const l of lines){need(size*1.45);pdf.text(l,M+indent,y);y+=size*1.45}};
  const linked=doc.link&&!doc.blocks.some(b=>b.p===doc.link)?[{h:'Open it in The Brew Bench',p:doc.link}]:[];
  for(const b of doc.blocks.concat(linked)){
    if(b.h){need(34);y+=6;pdf.setFont('helvetica','bold');pdf.setFontSize(13);pdf.setTextColor(...brown);pdf.text(pdfSafe(b.h),M,y);y+=6;pdf.setDrawColor(...cream);pdf.setLineWidth(1);pdf.line(M,y,M+CW,y);y+=14}
    if(b.p){para(b.p);y+=4}
    if(b.kv){for(const [k,v] of b.kv){pdf.setFont('helvetica','bold');pdf.setFontSize(10);const kl=pdfSafe(k);const lines=pdf.splitTextToSize(pdfSafe(v),CW-130);need(lines.length*14+4);
      pdf.setTextColor(...muted);pdf.text(kl,M,y);pdf.setFont('helvetica','normal');pdf.setTextColor(...ink);pdf.text(lines,M+130,y);y+=lines.length*14+4}y+=4}
    if(b.list){b.list.forEach((x,i)=>{const lab=b.num?(i+1)+'.':'-';pdf.setFont('helvetica','bold');pdf.setFontSize(10.5);const lines=pdf.splitTextToSize(pdfSafe(x),CW-22);need(lines.length*15+2);
      pdf.setTextColor(...brown);pdf.text(lab,M,y);pdf.setFont('helvetica','normal');pdf.setTextColor(...ink);pdf.text(lines,M+22,y);y+=lines.length*15+3});y+=4}
  }
  const n=pdf.getNumberOfPages();for(let i=1;i<=n;i++){pdf.setPage(i);pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);pdf.setTextColor(...muted);pdf.text('The Brew Bench  |  '+new Date().toLocaleDateString()+'  |  page '+i+' of '+n,M,H-28)}
  return pdf.output('blob');
}

function recipeDoc(i,p,c){const r=RECIPES[i],B=BREWERS[r.b];const gs=MYG.map(g=>[g,p&&p.set[g]!==undefined?p.set[g]:settingFor(g,r.b,r.off)]);
  const kv=[['Brewer',B.name],['Dose : water',r.dose+'g : '+(p?p.water:r.water)+'g'+(p?' (1:'+p.ratio+')':'')],['Water temperature',(p?p.temp:r.temp)?(p?p.temp:r.temp)+'°C'+(r.temp2?', then about '+r.temp2+'°C':''):'Cold or not applicable']];
  for(const [g,v] of gs)if(v!=null)kv.push([gname(g),dial(g,v)+', '+dialHint(g,v)]);
  if(p)kv.push([B.bloom.label,p.bloom+'s']);
  const blocks=[{p:r.why},{h:'Settings',kv},{h:'Steps',num:true,list:r.steps},{h:'Tip',p:r.tip}].filter(x=>!('p' in x)||x.p);
  if(p&&p.tw.length)blocks.push({h:'Tuned for your coffee',p:p.tw.join(' ')});if(p&&p.why.length)blocks.push({h:'Why these settings',list:p.why.map(w=>w.replace(/<[^>]+>/g,''))});
  return{link:c?planHref(c):recipeHref(i),title:r.name,sub:[r.by||(r.custom?(r.author?'By '+r.author:'Your recipe'):''),B.name].filter(Boolean).join(' | '),blocks,file:'recipe-'+r.name}}
function dialDoc(){const r=compute(S),[vt,vs]=verdict(r.D),B=BREWERS[S.brewer];
  return{link:brewHref(),title:'My brew: '+vName(S.variety),sub:PROCESSES[S.process].name+' | '+S.roast+' roast | '+B.name,file:'my-brew',blocks:[
   {h:'Settings',kv:[['Grinder',gLabel(S.grinder,S.setting)+' ('+S.setting+' clicks)'],['Brewer',B.name],['Water',S.temp+'°C'],['Ratio','1:'+S.ratio],[B.bloom.label,S.bloom+'s'],['Agitation',{low:'Gentle',med:'Normal',high:'Vigorous'}[S.agit]]]},
   {h:'Predicted cup',p:vt+'. '+vs},{kv:[['Sweetness',r.sweet.toFixed(1)+' / 10'],['Acidity',r.acid.toFixed(1)+' / 10'],['Body',r.body.toFixed(1)+' / 10'],['Clarity',r.clarity.toFixed(1)+' / 10'],['Bitterness',r.bitter.toFixed(1)+' / 10']]}]}}
function varietyDoc(id){const v=VBY[id];const b=[{kv:[['Family',FAM[v.fam].name],['Origin',v.origin||'-'],['Year',v.year||'-'],['Parentage',v.parents||'-']]},{h:'Story',p:v.story},{h:'In the cup',p:v.cup+' ('+v.notes.join(', ')+')'},{h:'How to brew it',p:v.brew}];
  if(v.subs)b.push({h:'Types',list:v.subs.map(s=>s.name+': '+s.cup)});return{link:SITE_URL+'#v='+id,title:v.name,sub:'Variety guide',blocks:b,file:'variety-'+v.name}}
function originDoc(k){const o=ALLO()[k];return{link:SITE_URL+'#o='+k,title:o.name,sub:'Coffee origin | '+REG[o.reg].name,file:'origin-'+o.name,blocks:[{kv:[['Regions',o.subs.join(', ')],['Altitude',o.alt],['Harvest',o.harvest],['Processing',o.process]]},{h:'In the cup',p:o.cup},{h:'Story',p:o.hist},{h:'Varieties grown here',list:o.vars.map(v=>VBY[v]?VBY[v].name:v)},{h:'Did you know?',p:o.fact}]}}
function historyDoc(){return{link:SITE_URL+'#history',title:'The story of coffee',sub:'From Ethiopian forests to your cup',file:'coffee-history',blocks:[{h:'Timeline',list:TIMELINE.map(([w,t,d])=>w+' - '+t+': '+d)},{h:'People who spread coffee',list:PEOPLE.map(([n,r,d])=>n+' ('+r+'): '+d)}]}}
function logDoc(){return{title:'My brew log',sub:LOG.length+' brews',file:'brew-log',blocks:LOG.length?LOG.map(l=>({h:(l.coffee||'Untitled')+' - '+l.date,kv:[['Rating',l.stars?l.stars+' / 5':'-'],['Settings',l.settings||'-'],['Predicted',l.pred||'-'],['Notes',l.notes||'-']]})):[{p:'No brews logged yet.'}]}}
function scanDoc(p,c){const inf=SC.info||{};const o=ALLO()[SC.origin];const kv=[['Origin',o.name],['Variety',vName(SC.variety)],['Process',PROCESSES[SC.process].name],['Roast',SC.roast],['Days off roast',String(daysSince(SC.date))]];
  if(inf.roaster)kv.unshift(['Roaster',inf.roaster]);if(inf.producer_or_farm)kv.push(['Producer or farm',inf.producer_or_farm]);if(inf.altitude)kv.push(['Altitude',inf.altitude]);if((inf.tasting_notes||[]).length)kv.push(['Tasting notes',inf.tasting_notes.join(', ')]);
  const rd=recipeDoc(c.tech,p,c);return{link:rd.link,title:inf.coffee_name||('Brew plan: '+o.name+' '+vName(SC.variety)),sub:'Bean profile and recommended brew',file:'bean-plan',blocks:[{h:'The coffee',kv}].concat(inf.summary?[{p:inf.summary}]:[]).concat([{h:'Recommended: '+RECIPES[c.tech].name,p:''}]).concat(rd.blocks.slice(1))}}

let SHDOC=null;
// Where people land from a shared message.
const SITE_URL='https://maheralshokry.github.io/brew-bench/';
const APPS=[['native','Share\u2026','#8E8E93','M12 15V3 M7 8l5-5 5 5 M5 12v8h14v-8'],
  ['whatsapp','WhatsApp','#25D366','M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.2z M9.5 9.2c.2 2.3 2.8 5 5.3 5.3l1-1.3-1.8-.9-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-.9-1.8z'],
  ['telegram','Telegram','#2AABEE','M20 5L3.5 11.4l5 1.8L18 7l-7.6 7.4.3 4.6 2.8-3 3.8 2.8z'],
  ['sms','Messages','#34C759','M4 5h16v11H9l-5 4z'],
  ['email','Email','#0A84FF','M3 6h18v12H3z M3 7l9 6 9-6']];
// Chat-friendly text: headings become *bold* (WhatsApp and Telegram both show it as bold).
// The link goes last and is never cut, so the other phone can always open it.
function shareText(doc){const link=doc.link||SITE_URL,t=docText(doc,true).replace(/\nMade with The Brew Bench\n$/,'').trim().replace(/^#+\s*(.+)$/gm,'*$1*');
  return(t.length>1400?t.slice(0,1400).replace(/\s+\S*$/,'')+'\u2026':t)+(t.includes(link)?'':'\n\nOpen it in The Brew Bench:\n'+link)}
function openShare(doc){SHDOC=doc;const pdfOK=!!(window.jspdf&&window.jspdf.jsPDF);
  $('sh-in').innerHTML='<div class="sheet"><div class="grab"></div><button class="vd-close" id="sh-x" aria-label="Close">\u2715</button><h2 id="sh-title" style="margin:0 40px 2px 0">Share</h2><p class="hint" style="margin:0">'+esc(doc.title)+'</p>'+
   '<div class="sharerow">'+APPS.map(([k,n,c,d])=>'<button type="button" data-sh="'+k+'"><span class="app" style="background:'+c+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg></span>'+n+'</button>').join('')+'</div>'+
   '<div class="sheetlist">'+
   '<button type="button" data-sh="pdf">'+ico('file','#B5533C')+'<span>Save as PDF<small>'+(pdfOK?'A styled page to send or print':'Loading the PDF engine\u2026 try again in a moment')+'</small></span></button>'+
   '<button type="button" data-sh="copy">'+ico('copy','#C9964A')+'<span>Copy as text<small>Paste it anywhere</small></span></button>'+
   '<button type="button" data-sh="md">'+ico('text','#8A5A3B')+'<span>Save as a text file<small>Plain text you can edit</small></span></button></div></div>';
  const d=$('sharesheet');if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}$('sh-x').onclick=()=>d.close()}
// Open a messaging app with the text filled in. In the Android app, Capacitor hands these links to the system.
function openLink(url){if(NATIVE||/^(mailto|sms):/.test(url))location.href=url;else window.open(url,'_blank','noopener')}
const fname=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'brew-bench';
// Inside the Android app, downloads don't work, so files are written to the app's cache
// and handed to Android's share sheet (save to Files or Drive, or send to another app).
const NATIVE=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const plugin=n=>NATIVE&&Capacitor.Plugins?Capacitor.Plugins[n]:null;
const toB64=blob=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(blob)});
async function nativeShare(title,name,data,text){const fs=plugin('Filesystem'),sh=plugin('Share');if(!sh)return false;
  if(name&&fs){const blob=data instanceof Blob?data:new Blob([data],{type:'text/plain'});
    const {uri}=await fs.writeFile({path:name,data:await toB64(blob),directory:'CACHE'});await sh.share({title,files:[uri]})}
  else await sh.share({title,text});return true}
async function saveFile(name,data){if(NATIVE){try{if(await nativeShare(name,name,data))return true}catch(e){if(!/cancel/i.test(e&&e.message||''))toast('Could not save the file');return false}}
  if(DL){try{await DL.save({filename:name,data});toast('Saved');return true}catch(e){if(e&&e.code==='declined')return false;}}
  try{const u=URL.createObjectURL(data instanceof Blob?data:new Blob([data]));const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast('Download started');return true}catch(e){toast('Saving files isn\u2019t available here');return false}}
$('sharesheet').addEventListener('click',async e=>{const d=$('sharesheet');if(e.target===d){d.close();return}const b=e.target.closest('[data-sh]');if(!b||!SHDOC)return;const k=b.dataset.sh,doc=SHDOC,txt=docText(doc),base=fname(doc.file||doc.title);
  if(k==='pdf'){const blob=docPDF(doc);if(!blob){toast('The PDF engine is still loading. Try again in a second');return}d.close();await saveFile(base+'.pdf',blob)}
  if(k==='md'){d.close();await saveFile(base+'.txt',txt)}
  if(k==='copy'){let ok=false;try{await navigator.clipboard.writeText(txt);ok=true}catch(err){try{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();ok=document.execCommand('copy');ta.remove()}catch(e2){}}d.close();toast(ok?'Copied to clipboard':'Copying isn\u2019t allowed here; try Save as a text file')}
  if(k==='whatsapp'||k==='telegram'||k==='sms'||k==='email'){const t=shareText(doc),e=encodeURIComponent;d.close();
    openLink({whatsapp:'https://wa.me/?text='+e(t),telegram:'https://t.me/share/url?url='+e(doc.link||SITE_URL)+'&text='+e(t.replace(doc.link||SITE_URL,'').replace(/\n*Open it in The Brew Bench:\s*$/,'').trim()),sms:'sms:?&body='+e(t),email:'mailto:?subject='+e(doc.title)+'&body='+e(t)}[k]);return}
  if(k==='native'&&!navigator.share&&!NATIVE){let ok=false;try{await navigator.clipboard.writeText(shareText(doc));ok=true}catch(e){}d.close();toast(ok?'This browser has no share menu, so the text was copied':'Sharing isn\u2019t available here; use Copy as text');return}
  if(k==='native'&&NATIVE){d.close();try{const blob=docPDF(doc);await nativeShare(doc.title,blob?base+'.pdf':null,blob,txt)}catch(err){if(!/cancel/i.test(err&&err.message||''))toast('Could not share')}return}
  if(k==='native'){try{const blob=docPDF(doc);const f=blob&&typeof File!=='undefined'?new File([blob],base+'.pdf',{type:'application/pdf'}):null;
      if(f&&navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({title:doc.title,files:[f]});else await navigator.share({title:doc.title,text:txt});d.close()}
    catch(err){if(!err||err.name!=='AbortError')toast('Sharing isn\u2019t allowed here; use Save as PDF instead')}}
});

/* ================= WORLD CHAMPIONSHIPS ================= */
let CHF='all',CHB='all';
// Upcoming finals and new champions come from events.json on the website, so a yearly update reaches the app without a new release.
const EVURL='https://maheralshokry.github.io/brew-bench/events.json';
let EVENTS=[];
function useEvents(src){const ok=e=>e&&COMPS[e.c]&&Number.isFinite(Date.parse(e.start))&&Number.isFinite(Date.parse(e.end))&&typeof e.city==='string';
  EVENTS=(Array.isArray(src&&src.events)?src.events:[]).filter(ok).map(e=>({c:e.c,y:num(e.y,new Date(e.start).getFullYear()),start:Date.parse(e.start),end:Date.parse(e.end),city:str(e.city,80),venue:str(e.venue,80),note:str(e.note,160)})).sort((a,b)=>a.start-b.start);
  for(const x of Array.isArray(src&&src.champs)?src.champs:[]){if(!x||!COMPS[x.c]||!Number.isFinite(+x.y)||typeof x.who!=='string'||CHAMPS.some(c=>c.c===x.c&&c.y===+x.y))continue;
    CHAMPS.push({c:x.c,y:+x.y,city:str(x.city,80),who:str(x.who,60),from:str(x.from,40),dev:str(x.dev,40)||(x.c==='wac'?'AeroPress':x.c==='wbc'?'Espresso machine':''),coffee:str(x.coffee,160),note:str(x.note,160)})}}
// Use the newer of the saved list and the one built into the app; fall back to the built-in one if the saved list is damaged.
{const c=load('bb-events',null);useEvents(c&&String(c.updated||'')>=EVENTS_DEFAULT.updated?c:EVENTS_DEFAULT);if(!EVENTS.length)useEvents(EVENTS_DEFAULT)}
let EVFETCH=false;
function fetchEvents(){if(EVFETCH||!navigator.onLine)return;EVFETCH=true;
  fetch(EVURL,{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&Array.isArray(j.events)){save('bb-events',j);useEvents(j);if(BUILT.champs)renderChamps()}}).catch(()=>{})}
const upcoming=()=>EVENTS.filter(e=>e.end>Date.now());
// The countdown to the next final, ticking every second while the page is open.
let CDT=null;
function renderCountdown(){const ev=upcoming().filter(e=>CHF==='all'||e.c===CHF),box=$('ch-next');if(!ev.length){box.innerHTML='';return}
  const [n,...rest]=ev,C=COMPS[n.c];
  box.innerHTML='<div class="cd" style="--c:'+C.color+'"><span class="pill"><i style="background:'+C.color+'"></i>Next world final</span><h3>'+esc(C.name)+' '+n.y+'</h3>'+
   '<p class="hint" style="margin:0">'+esc(n.city)+(n.venue?' · '+esc(n.venue):'')+' · '+new Date(n.start).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'})+'</p>'+
   '<div class="cdclock" id="cd-clock" aria-live="off"></div>'+(n.note?'<p class="hint" style="margin:.4rem 0 0">'+esc(n.note)+'</p>':'')+'</div>'+
   (rest.length?'<div class="cdnext">'+rest.map(e=>'<div><span class="pill"><i style="background:'+COMPS[e.c].color+'"></i>'+COMPS[e.c].short+' '+e.y+'</span><b>'+esc(e.city)+'</b><small>'+new Date(e.start).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})+' · in '+Math.max(0,Math.ceil((e.start-Date.now())/864e5))+' days</small></div>').join('')+'</div>':'');
  const tick=()=>{const el=$('cd-clock');if(!el||!document.getElementById('champs').classList.contains('on')){clearInterval(CDT);CDT=null;return}
    const now=Date.now();if(now>=n.end){clearInterval(CDT);CDT=null;renderCountdown();return}
    if(now>=n.start){el.innerHTML='<div class="cdlive"><i></i>Happening now in '+esc(n.city.split(',')[0])+'</div>';return}
    let s=Math.floor((n.start-now)/1e3);const d=Math.floor(s/86400);s%=86400;const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60);s%=60;
    el.innerHTML=[[d,'days'],[h,'hours'],[m,'min'],[s,'sec']].map(([v,l])=>'<div><b>'+String(v).padStart(l==='days'?1:2,'0')+'</b><small>'+l+'</small></div>').join('')};
  tick();clearInterval(CDT);CDT=setInterval(tick,1000)}
// Which brewer each champion used; espresso for the Barista Championship.
const chDev=ch=>ch.dev&&ch.dev!=='Not published'?ch.dev:null;
const chBrewer=ch=>ch.rec?(ch.ri!=null?RECIPES[ch.ri].b:ch.rec.b):null;
function renderChamps(){fetchEvents();
  seg('ch-filter',[['all','All']].concat(Object.entries(COMPS).map(([k,c])=>[k,c.short])),()=>CHF,v=>{CHF=v;CHB='all';renderChamps()});
  const pool=CHAMPS.filter(x=>CHF==='all'||x.c===CHF),devs=[...new Set(pool.map(chDev).filter(Boolean))].sort((a,b)=>pool.filter(x=>chDev(x)===b).length-pool.filter(x=>chDev(x)===a).length);
  if(CHB!=='all'&&CHB!=='mine'&&!devs.includes(CHB))CHB='all';
  seg('ch-brewer',[['all','Any brewer']].concat(MYB.length?[['mine','With my brewers']]:[],devs.map(d=>[d,d])),()=>CHB,v=>{CHB=v;renderChamps()});
  renderCountdown();
  $('ch-about').innerHTML=Object.entries(COMPS).filter(([k])=>CHF==='all'||CHF===k).map(([k,c])=>'<div class="card chcomp"><span class="pill"><i style="background:'+c.color+'"></i>Since '+c.since+'</span><h3>'+esc(c.name)+'</h3><p class="hint">'+esc(c.about)+'</p><p class="chcount">'+CHAMPS.filter(x=>x.c===k).length+' champions</p></div>').join('');
  const on=ch=>(CHF==='all'||ch.c===CHF)&&(CHB==='all'||(CHB==='mine'?MYB.includes(chBrewer(ch)):chDev(ch)===CHB));
  const years=[...new Set(CHAMPS.map(x=>x.y).concat(CH_GAPS.map(g=>g[0])))].sort((a,b)=>b-a);
  const card=ch=>{const C=COMPS[ch.c],mine=MYB.includes(chBrewer(ch));return '<div class="chwin"><div class="chpills"><span class="pill"><i style="background:'+C.color+'"></i>'+C.short+'</span>'+(chDev(ch)&&ch.c==='wbrc'?'<span class="pill chdev">'+esc(chDev(ch))+'</span>':'')+(mine?'<span class="pill chdev ours">✓ You can brew this</span>':'')+'</div>'+
    '<div class="chname"><span class="flag" aria-hidden="true">'+(FLAGS[ch.from]||'')+'</span><b>'+esc(ch.who)+'</b></div>'+
    '<p class="hint">'+esc(ch.from)+' · '+esc(ch.city)+'</p>'+(ch.coffee?'<p class="chcoffee">'+esc(ch.coffee)+'</p>':'')+(ch.note?'<p class="hint">'+esc(ch.note)+'</p>':'')+
    (ch.rec?'<button type="button" class="btn ghost chbtn" data-champ="'+CHAMPS.indexOf(ch)+'">Winner’s recipe</button>':'')+'</div>'};
  const html=years.map(y=>{const w=CHAMPS.filter(x=>x.y===y&&on(x)),gp=CHB==='all'?CH_GAPS.filter(g=>g[0]===y&&(CHF==='all'||g[1]===CHF)):[];
    if(!w.length&&!gp.length)return'';
    return '<li><span class="when">'+y+'</span>'+(w.length?'<div class="chrow">'+w.map(card).join('')+'</div>':'')+gp.map(g=>'<p class="hint">'+esc(g[2])+'</p>').join('')+'</li>'}).join('');
  $('ch-tl').innerHTML=html||'<li><p class="hint">No champion brewed with this yet.'+(CHB==='mine'?' Add more brewers to your gear.':'')+'</p></li>'}
$('ch-tl').onclick=e=>{const b=e.target.closest('[data-champ]');if(b)openChamp(CHAMPS[+b.dataset.champ])};
// Brewers that can stand in for each other, closest first. AeroPress recipes adapt best to other paper-filtered immersion brewers.
const SUBS={'Cone dripper':['Cone dripper','Flat-bottom dripper','Valve and hybrid','Machine','Immersion and pressure'],'Flat-bottom dripper':['Flat-bottom dripper','Cone dripper','Valve and hybrid','Machine','Immersion and pressure'],
  'Valve and hybrid':['Valve and hybrid','Cone dripper','Flat-bottom dripper','Immersion and pressure']};
const AERO_SUBS=['clever','swi','sw','swneo','frenchpress','siphon'];
function adaptBrewer(b){if(!MYB.length||MYB.includes(b))return b;
  if(b==='espresso')return['moka','aeropress','phin'].find(k=>MYB.includes(k))||null;const B=BREWERS[b],own=MYB.filter(x=>BREWERS[x].type!=='Espresso and stovetop'&&BREWERS[x].type!=='Boiled'&&BREWERS[x].type!=='Cold');
  if(!own.length)return null;
  if(b==='aeropress'){const x=AERO_SUBS.find(k=>own.includes(k));if(x)return x}
  const order=SUBS[B.type]||['Immersion and pressure','Valve and hybrid','Cone dripper','Flat-bottom dripper','Machine'];
  for(const ty of order){const x=own.find(k=>BREWERS[k].type===ty&&BREWERS[k].model!==false)||own.find(k=>BREWERS[k].type===ty);if(x)return x}return own[0]}
function adaptNote(from,to,shift){if(from===to)return'';
  if(from==='espresso')return to==='moka'?'No espresso machine: a moka pot makes the closest strong, rich coffee. Use a fine grind, don’t tamp, and take it off the heat as soon as it starts to sputter.'
    :to==='aeropress'?'No espresso machine: brew a short, strong AeroPress with a fine grind and about three times the dose in water. It won’t have crema, but it is close in strength.'
    :'No espresso machine: brew a small, strong phin with a fine grind. It is close in strength, not in texture.';const F=BREWERS[from],T=BREWERS[to],way=shift>40?'a little coarser':shift<-40?'a little finer':'about the same';
  if(from==='aeropress'){if(['clever','sw','swi','swneo'].includes(to))return'Steep with the valve closed for the same time, then open it instead of pressing, and add the same bypass water afterwards.';
    if(to==='frenchpress')return'Steep for the same time, plunge gently and pour through a paper filter if you can, then add the same bypass water.';
    if(to==='siphon')return'Steep in the top chamber for the same time, then let it draw down, and add the same bypass water.';
    return'Brew the same dose and water as a slow pour-over, then add the bypass water. Expect a lighter body than the pressed original.'}
  if(F.type===T.type)return'Same style of brewer: follow the steps as written. The grind below is '+way+', to suit your brewer.';
  if(T.type==='Valve and hybrid')return F.type==='Immersion and pressure'?'Steep with the valve closed, then open it to drain.':'Keep the valve open the whole time to brew it as a pour-over.';
  if(F.type==='Valve and hybrid')return'No valve: where the recipe closes the valve, pour slowly and keep the water level high instead of steeping.';
  if(F.type==='Cone dripper'&&T.type==='Flat-bottom dripper')return'Keep the same pours, aimed at the centre of the flat bed. The grind below is '+way+', to suit your brewer.';
  if(F.type==='Flat-bottom dripper'&&T.type==='Cone dripper')return'Keep the same pours, gently, so the cone drains evenly. The grind below is '+way+', to suit your brewer.';
  return'This brewer works quite differently, so treat the settings as a starting point and adjust by taste.'}
// Generic brewer names read in lower case mid-sentence ("your moka pot"); named products keep their capitals.
const brewName=s=>{s=s.replace(/, (hybrid|full immersion)$/,'');return /^(Espresso machine|French press|Moka pot|Batch brewer|Cold brew|Siphon|Vietnamese phin|Dallah|Cezve)/.test(s)?s.charAt(0).toLowerCase()+s.slice(1):s};
const art=s=>/^(UFO|U[a-z]|Eu)/.test(s)?'a':/^[AEIOU]/i.test(s)?'an':'a';
// Grind descriptions start mid-sentence: "The champion's grind: about 700 microns".
const lcGrind=s=>/^(About|Not|Medium|Coarse|Fine|Ground|Slightly|Sifted)\b/.test(s)?s.charAt(0).toLowerCase()+s.slice(1):s;
function champDoc(ch){const C=COMPS[ch.c],r=ch.rec,R=ch.ri!=null?RECIPES[ch.ri]:null,St=!R&&ch.si!=null?RECIPES[ch.si]:null;
  const dose=R?R.dose:r.dose,water=R?R.water:r.water,temp=r.temp===null?null:R?R.temp:r.temp,temp2=r.temp===null?null:R?R.temp2:r.temp2,steps=R?R.steps:r.steps,why=R?R.why||r.why:r.why;
  const kv=[['Brewer',chDev(ch)||BREWERS[R?R.b:r.b].name]];if(dose)kv.push(['Dose : water',dose+'g'+(water?' : '+water+'g':'')]);kv.push(['Water temperature',temp?temp+'°C'+(temp2?', then '+temp2+'°C':''):'Not published']);
  if(r.grind&&r.grind.label&&!/not published/i.test(r.grind.label))kv.push(['Grind',r.grind.label]);
  return{link:SITE_URL+'#c='+chKey(ch),title:ch.who+': '+C.name+' '+ch.y,sub:[ch.from,ch.city].filter(Boolean).join(' | '),file:'champion-'+ch.who,blocks:[
    ch.coffee&&{h:'The coffee',p:ch.coffee},(r.gear||[]).length&&{h:'Gear they used',list:r.gear},{h:'The recipe',kv},why&&{p:why},r.partial&&{p:r.partial},
    steps?{h:'Steps',num:true,list:steps}:St?{h:'Starting recipe: '+St.name,num:true,list:St.steps}:{p:'The full step-by-step was not published.'}].filter(Boolean)}}
function openChamp(ch){const C=COMPS[ch.c],r=ch.rec,R=ch.ri!=null?RECIPES[ch.ri]:null,St=!R&&ch.si!=null?RECIPES[ch.si]:null,U=R||St,ui=R?ch.ri:ch.si,b=R?R.b:r.b,d=$('vd');
  const dose=R?R.dose:r.dose,water=R?R.water:r.water,temp=r.temp===null?null:R?R.temp:r.temp,temp2=r.temp===null?null:R?R.temp2:r.temp2,steps=R?R.steps:r.steps,why=R?R.why||r.why:r.why,off=R?R.off:St?St.off:(r.off||0);
  const g=r.grind&&r.grind.g&&GRINDERS[r.grind.g]?r.grind.g:null;
  // Your gear: the brewer you own that is closest to theirs, and your grinders set for it.
  const nb=adaptBrewer(b),useB=nb||b,sub=nb&&nb!==b,shift=(brewSize(useB)??0)-(brewSize(b)??0);
  const setOn=h=>{if(g){const v=stepsFor(h,sizeOf(g,r.grind.c)+shift),H=GRINDERS[h];return v>=H.min-0.5&&v<=H.max+0.5?roundG(h,v):null}return canGrind(h,useB)?settingFor(h,useB,off):null};
  const rows=MYG.map(h=>{const v=setOn(h);return '<div class="mrow mine"><span>'+esc(GRINDERS[h].name)+'</span><b>'+(v!=null?esc(dial(h,v))+(GRINDERS[h].unit==='clicks'?' <small>clicks</small>':''):'<small>can’t reach this grind</small>')+'</b></div>'}).join('');
  const temps=temp?temp+'°C'+(temp2?' then '+temp2+'°C':''):'';
  const gear=(r.gear||[]).concat(r.grind&&r.grind.label&&!/not published/i.test(r.grind.label)&&!(r.gear||[]).some(x=>r.grind.label.startsWith(x))?['Grind: '+r.grind.label]:[]);
  const theirs=brewName(chDev(ch)||BREWERS[b].name);
  const brewLine=!MYB.length?'<p class="hint">They brewed on '+art(theirs)+' <b>'+esc(theirs)+'</b>. <button type="button" class="linkbtn" data-ca="gear">Tell the app which brewers you have</button> and the recipe adapts to them.</p>'
    :nb===null?'<p class="hint">None of your brewers suit this recipe. <button type="button" class="linkbtn" data-ca="gear">Edit your gear</button></p>'
    :sub?'<p><b>Brew it on your '+esc(brewName(BREWERS[nb].name))+'</b> instead of their '+esc(theirs)+'. '+esc(adaptNote(b,nb,shift))+'</p>'
    :'<p><b>You have the right brewer</b>: brew it on your '+esc(brewName(BREWERS[b].name))+(chDev(ch)&&!BREWERS[b].name.includes(chDev(ch))&&chDev(ch)!=='Espresso machine'?' (they used '+art(chDev(ch))+' '+esc(chDev(ch))+')':'')+'.</p>';
  const R2=U&&BREWERS[useB].model;
  d.querySelector('#vd-in').innerHTML='<div class="vd-head" style="--c:'+C.color+'"><button class="vd-close" id="vd-x" aria-label="Close">✕</button>'+(R?favBtn(R):'')+'<span class="pill"><i style="background:'+C.color+'"></i>'+esc(C.name)+' '+ch.y+'</span>'+
   '<h2 id="vd-title">'+(FLAGS[ch.from]||'')+' '+esc(ch.who)+'</h2><div class="meta"><span>'+esc(ch.from)+'</span><span>'+esc(ch.city)+'</span></div></div><div class="vd-body">'+
   (ch.coffee?'<p><b>The coffee.</b> '+esc(ch.coffee)+'</p>':'')+
   '<h3>Gear they used</h3>'+(gear.length?'<ul class="chgear">'+gear.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p class="hint" style="margin-top:0">Not published.</p>')+
   '<h3>The recipe</h3><div class="meta">'+(dose&&water?'<span>'+dose+'g : '+water+'g</span>':dose?'<span>'+dose+'g coffee</span>':'')+(temps?'<span>'+temps+(r.tNote?' ('+esc(r.tNote)+')':'')+'</span>':'<span>Temperature not published</span>')+(r.time?'<span>'+esc(r.time)+'</span>':'')+'</div>'+
   (why?'<p>'+esc(why)+'</p>':'')+(r.partial?'<p class="hint">'+esc(r.partial)+'</p>':'')+(steps?'<ol class="steps">'+steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'
     :St?'<div class="chstart"><p class="hint" style="margin:0 0 .4rem">Start from a recipe in the same style: <b>'+esc(St.name)+'</b></p><div class="meta"><span>'+St.dose+'g : '+St.water+'g</span>'+(St.temp?'<span>'+St.temp+'°C</span>':'')+'</div><ol class="steps">'+St.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol></div>'
     :'<p class="hint">The full step-by-step was not published.</p>')+
   '<div class="ghead" style="margin-top:1.2rem"><h3 style="margin:0">Brew it with your gear</h3><button type="button" class="gpick-btn" data-ca="gear" aria-label="Edit your gear" title="Edit your gear">'+SWAP_ICON+'</button></div>'+brewLine+
   '<p class="hint" style="margin:.2rem 0 .5rem">'+(g?'Grind converted from the champion’s '+esc(r.grind.label)+(sub?', then adjusted for your '+esc(BREWERS[nb].name):'')+'.':'The champion’s grind: '+esc(r.grind&&r.grind.label?lcGrind(r.grind.label):'not published')+'. These are starting points for '+(nb&&MYB.length?'your '+esc(brewName(BREWERS[useB].name)):art(brewName(BREWERS[b].name))+' '+esc(brewName(BREWERS[b].name)))+'; adjust by taste.')+'</p>'+rows+
   (!sub&&r.alt?'<p class="hint">'+esc(r.alt)+'</p>':'')+
   '<div class="actions">'+(U?'<button type="button" class="btn" data-ca="timer">Start timer</button>':'')+(R2?'<button type="button" class="btn ghost" data-ca="load">Load into dial-in</button>':'')+
   (U&&!sub&&PBREWERS.includes(b==='swi'?'sw':b)?'<button type="button" class="btn ghost" data-ca="plan">Tune in planner</button>':'')+(g?'<button type="button" class="btn ghost" data-ca="match">All grinders</button>':'')+'<button type="button" class="btn ghost" data-ca="share">Share</button></div></div>';
  d.querySelector('.vd-body').onclick=e=>{const a=e.target.closest('[data-ca]');if(!a)return;const k=a.dataset.ca;if(k==='share'){openShare(champDoc(ch));return}d.close();
    if(k==='gear'){setTimeout(()=>openGearPicker('brewers',()=>openChamp(ch)),0);return}
    if(k==='timer')openTimer(ui);else if(k==='plan')planRecipe(ui);else if(k==='match')openMatch(g,r.grind.c);
    else if(k==='load'){const B=BREWERS[useB],gr=MYG.find(h=>setOn(h)!=null)||S.grinder;S.brewer=useB;S.rec=useB===U.b?ui:null;S.grinder=gr;S.setting=setOn(gr)??base(gr,useB);
      S.temp=clamp(U.temp,B.temp.min,B.temp.max);S.bloom=B.bloom.def;S.agit='med';S.ratio=clamp(Math.round(U.water/U.dose/B.ratio.step)*B.ratio.step,B.ratio.min,B.ratio.max);render();showTab('dial');toast('Loaded '+ch.who+'’s recipe')}};
  const hx=d.querySelector('.vd-head');hx.onclick=e=>{if(e.target.closest('#vd-x'))d.close()};
  if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}d.scrollTop=0}
/* ================= COFFEE WORDS ================= */
let WC='all',WQ='';
const GBY=Object.fromEntries(GLOSSARY.map(g=>[g[0],g]));
// A link from a word or a flow step: a process, a variety, another word or a section.
function linkChip(l,label){const i=l.indexOf(':'),k=l.slice(0,i),v=l.slice(i+1);
  if(k==='p')return PROCESSES[v]?'<button type="button" class="chip p" data-go-p="'+v+'">'+esc(label||'Process: '+PROCESSES[v].name.replace(/\s*\(.*$/,''))+'</button>':'';
  if(k==='v')return VBY[v]?'<button type="button" class="chip v" data-go-v="'+v+'">'+esc(label||'Variety: '+VBY[v].name)+'</button>':'';
  if(k==='k')return GBY[v]?'<button type="button" class="chip" data-go-k="'+esc(v)+'">'+esc(label||v)+'</button>':'';
  if(k==='tab')return TABNAMES[v]?'<button type="button" class="chip" data-go-t="'+v+'">'+esc(label||TABNAMES[v])+' →</button>':'';return ''}
function goLink(e){const b=e.target.closest('[data-go-p],[data-go-v],[data-go-k],[data-go-t]');if(!b)return false;const d=$('vd');
  if(b.dataset.goV){openVariety(b.dataset.goV);return true}
  if(d.open)d.close();if(b.dataset.goP)openProcess(b.dataset.goP);else if(b.dataset.goK)openWord(b.dataset.goK);else showTab(b.dataset.goT);return true}
function openProcess(k){if(!PROCESSES[k])return;showTab('process');if(PC!=='all'&&PROCESSES[k].cat!==PC){PC='all';renderProcesses()}
  requestAnimationFrame(()=>{const c=$('pc-'+k);if(!c)return;flashTo(c)})}
// Scroll to a card and flash it. Cards further up can still change size as they render, so check again once the page settles.
function flashTo(c){c.classList.remove('flash');void c.offsetWidth;c.classList.add('flash');c.scrollIntoView({block:'center'});setTimeout(()=>{const r=c.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)c.scrollIntoView({block:'center'})},400)}
function renderWords(){
  seg('wcat',[['all','All']].concat(Object.entries(GCAT).map(([k,[n]])=>[k,n])),()=>WC,v=>{WC=v;renderWords()});
  const q=WQ.trim(),fq=fold(q),list=GLOSSARY.filter(g=>(WC==='all'||g[1]===WC)&&(!fq||fold(g[0]+' '+g[2]).includes(fq)));
  const mark=t=>{const h=esc(t);if(!q)return h;const re=new RegExp('('+reEsc(esc(q))+')','ig');return h.replace(re,'<mark class="wq">$1</mark>')};
  $('wcount').textContent=list.length===GLOSSARY.length?GLOSSARY.length+' words':list.length+' of '+GLOSSARY.length+' words';
  $('wlist').innerHTML=list.length?Object.entries(GCAT).map(([k,[n,c]])=>{const g=list.filter(x=>x[1]===k);if(!g.length)return '';
    return '<div class="wgroup" style="--c:'+c+'"><h3><i></i>'+esc(n)+'</h3><div class="wgrid">'+g.map(([t,,d,l])=>
      '<article class="card wcard" style="--c:'+c+'" data-w="'+esc(t)+'" tabindex="0" role="button" aria-expanded="false"><h4><span>'+mark(t)+'</span></h4><p class="wdef">'+mark(d)+'</p>'+
      (l.length?'<div class="wlinks">'+l.map(x=>linkChip(x)).join('')+'</div>':'')+'</article>').join('')+'</div></div>'}).join('')
    :'<p class="hint wempty">No words match. Try a shorter search, or pick All.</p>'}
const toggleWord=c=>{const o=!c.classList.contains('open');c.classList.toggle('open',o);c.setAttribute('aria-expanded',o)};
$('wlist').onclick=e=>{if(goLink(e))return;const c=e.target.closest('.wcard');if(c)toggleWord(c)};
$('wlist').onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('wcard')){e.preventDefault();toggleWord(e.target)}};
$('wsearch').oninput=e=>{WQ=e.target.value;soon(renderWords)};
// Open the Coffee words section on one word, expanded.
function openWord(t){const g=GBY[t];if(!g)return;showTab('words');WC='all';WQ='';$('wsearch').value='';renderWords();
  requestAnimationFrame(()=>{const c=[...document.querySelectorAll('#wlist .wcard')].find(x=>x.dataset.w===t);if(!c)return;c.classList.add('open');c.setAttribute('aria-expanded','true');
    flashTo(c)})}
function wordsDoc(){return{link:SITE_URL+'#words',title:'Coffee words',sub:GLOSSARY.length+' terms, from farm to cup',file:'coffee-words',blocks:Object.entries(GCAT).map(([k,[n]])=>({h:n,list:GLOSSARY.filter(g=>g[1]===k).map(g=>g[0]+': '+g[2])}))}}

/* ================= FROM SEED TO CUP ================= */
const FBY=Object.fromEntries(FLOW.map(f=>[f.id,f]));
const FNUM={};{let n=0;for(const f of FLOW)if(!f.side)FNUM[f.id]=++n}
const fIcon=n=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(FICO[n]||ICO[n])+'"/></svg>';
function renderFlow(){
  $('flowlegend').innerHTML=Object.values(FLOW_PHASES).map(([n,c])=>'<span class="pill"><i style="background:'+c+'"></i>'+esc(n)+'</span>').join('');
  $('flowchart').innerHTML=Object.entries(FLOW_PHASES).map(([ph,[pn,c]])=>'<div class="fphase" style="--c:'+c+'"><span class="fph">'+esc(pn)+'</span><div class="fsteps">'+
    FLOW.filter(f=>f.ph===ph).map(f=>'<button type="button" class="fstep'+(f.side?' side':'')+(f.branch?' key':'')+'" data-f="'+f.id+'"><span class="fico">'+fIcon(f.icon)+'</span><span><b>'+esc(f.t)+'</b><small>'+esc(f.s)+'</small></span><span class="fn">'+(f.side?'Optional':FNUM[f.id])+'</span></button>'+
      (f.branch?'<div class="fbranch" role="group" aria-label="Processing paths">'+FLOW_BRANCH.map((b,i)=>fbrHTML(b,i)).join('')+'</div>':'')+
      (f.tree?'<div class="fside" style="--c:'+c+'">'+treeKeys(f.tree).map(k=>'<button type="button" class="chip" data-go-p="'+k+'">'+esc(PROCESSES[k].name.replace(/\s*\(.*$/,''))+'</button>').join('')+'</div>':'')).join('')+
    '</div></div>').join('')}
$('flowchart').onclick=e=>{if(goLink(e)||togglePnode(e))return;const b=e.target.closest('[data-fb]');if(b){toggleBranch(b);return}const f=e.target.closest('[data-f]');if(f)openFlowStep(f.dataset.f)};
// A path card: its name, steps, taste, and the processes on it.
function fbrHTML(b,i){const ks=treeKeys(b.tree),nm=k=>PROCESSES[k].name.replace(/\s*\(.*$/,'');
  return '<button type="button" class="fbr" data-fb="'+i+'" aria-expanded="false"><b>'+esc(b.t)+'</b><small>'+esc(b.s)+'</small><em>'+esc(b.d)+'</em>'+
    '<span class="fbr-list">'+esc(ks.slice(0,3).map(nm).join(', '))+(ks.length>3?' + '+(ks.length-3)+' more':'')+'</span><span class="fbr-more">'+(ks.length>1?'Explore '+ks.length+' processes':'Explore it')+'</span></button>'}
// The processes on a path, as a tree: a process opens to show its description and its variations.
function ptreeHTML(nodes,depth){return '<div class="ptree'+(depth?' kids':'')+'">'+nodes.map(n=>{const P=n.p&&PROCESSES[n.p];if(n.p&&!P)return '';
  const name=P?P.name:n.g,sub=n.r||(P?P.char.split(/(?<=\.)\s/)[0]:n.s),c=P?PCOL[P.cat]:'var(--muted)',kn=n.kids?n.kids.length:0;
  return '<div class="pnode" style="--c:'+c+'"><button type="button" class="pn-h" aria-expanded="false"><i aria-hidden="true"></i><span class="pn-t"><b>'+esc(name)+'</b><small'+(n.r?'':' class="dup"')+'>'+esc(sub)+'</small>'+(kn?'<em>'+kn+(kn===1?' variation':' variations')+' inside</em>':'')+'</span>'+
    '<span class="pn-x" aria-hidden="true"></span></button><div class="pn-b">'+
    (P?'<p>'+esc(P.char)+'</p>'+(P.notes&&P.notes.length?'<div class="chips">'+P.notes.map(x=>'<span class="chip">'+esc(x)+'</span>').join('')+'</div>':'')+
       '<button type="button" class="btn ghost pn-go" data-go-p="'+n.p+'">How it works and how to brew it \u2192</button>':'<p>'+esc(n.d||n.s||'')+'</p>')+
    (kn?'<p class="pn-kh">'+(P?'Variations of '+esc(P.name.replace(/\s*\(.*$/,'').toLowerCase().replace(/^co2/,'CO2')):'In this group')+'</p>'+ptreeHTML(n.kids,depth+1):'')+'</div></div>'}).join('')+'</div>'}
function togglePnode(e){const h=e.target.closest('.pn-h');if(!h)return false;const n=h.parentElement,o=!n.classList.contains('open');n.classList.toggle('open',o);h.setAttribute('aria-expanded',o);return true}
// Tapping a path opens its tree right under it (and closes any other).
function toggleBranch(btn){const i=+btn.dataset.fb,box=btn.parentElement,cur=box.querySelector('.fbx'),same=cur&&+cur.dataset.fb===i;
  if(cur)cur.remove();box.querySelectorAll('.fbr').forEach(b=>b.setAttribute('aria-expanded','false'));if(same)return;
  const b=FLOW_BRANCH[i],el=document.createElement('div');el.className='fbx';el.dataset.fb=i;
  el.innerHTML='<div class="fbx-h"><b>The '+esc(b.t.toLowerCase())+' path</b><span class="hint">Tap a process to learn more; those with variations open to show them.</span></div>'+ptreeHTML(b.tree,0);
  btn.after(el);btn.setAttribute('aria-expanded','true');const r=el.getBoundingClientRect();if(r.bottom>innerHeight)el.scrollIntoView({block:'nearest',behavior:RM()?'auto':'smooth'})}
function flowSheet(c,pill,title,sub,body){const d=$('vd');
  d.querySelector('#vd-in').innerHTML='<div class="vd-head" style="--c:'+c+'"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:'+c+'"></i>'+esc(pill)+'</span><h2 id="vd-title">'+esc(title)+'</h2>'+(sub?'<p class="hint" style="margin:0">'+esc(sub)+'</p>':'')+'</div><div class="vd-body flowd">'+body+'</div>';
  d.querySelector('.vd-body').onclick=e=>{if(goLink(e)||togglePnode(e))return;const n=e.target.closest('[data-fnav]');if(n)openFlowStep(n.dataset.fnav);const b=e.target.closest('[data-fb]');if(b)openFlowBranch(+b.dataset.fb)};
  $('vd-x').onclick=()=>d.close();if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}d.scrollTop=0}
function openFlowStep(id){const f=FBY[id];if(!f)return;const [pn,c]=FLOW_PHASES[f.ph],i=FLOW.indexOf(f),prev=FLOW[i-1],next=FLOW[i+1];
  const chips=(f.k||[]).map(t=>linkChip('k:'+t)).join(''),go=(f.go||[]).map(([l,lab])=>linkChip(l,lab)).join('');
  flowSheet(c,pn+(f.side?' · optional':' · step '+FNUM[f.id]+' of '+Object.keys(FNUM).length),f.t,f.s,'<p>'+esc(f.d)+'</p>'+
    (f.n?'<ul class="fnotes">'+f.n.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+
    (f.branch?'<h3>The paths</h3><div class="fbranch" style="--c:'+c+'">'+FLOW_BRANCH.map((b,j)=>fbrHTML(b,j)).join('')+'</div>':'')+
    (f.tree?'<h3>The methods</h3>'+ptreeHTML(f.tree,0):'')+
    (go?'<h3>Go further</h3><div class="chips">'+go+'</div>':'')+
    (chips?'<h3>Words to know</h3><div class="chips">'+chips+'</div>':'')+
    '<div class="actions">'+(prev?'<button type="button" class="btn ghost" data-fnav="'+prev.id+'">← '+esc(prev.t)+'</button>':'')+(next?'<button type="button" class="btn" data-fnav="'+next.id+'">'+esc(next.t)+' →</button>':'')+'</div>')}
function openFlowBranch(i){const b=FLOW_BRANCH[i],c=FLOW_PHASES.mill[1];
  flowSheet(c,'Processing path',b.t,b.s,'<p><b>In the cup:</b> '+esc(b.d.toLowerCase())+'.</p><h3>'+(treeKeys(b.tree).length>1?'The processes on this path':'The process')+'</h3><p class="hint" style="margin-top:0">Tap a process to learn more; those with variations open to show them.</p>'+ptreeHTML(b.tree,0)+
    '<div class="actions"><button type="button" class="btn ghost" data-fnav="process">\u2190 Processing</button><button type="button" class="btn" data-fnav="dry">Drying \u2192</button></div>')}
function flowDoc(){return{link:SITE_URL+'#flow',title:'From seed to cup',sub:'How coffee is made, step by step',file:'seed-to-cup',blocks:FLOW.map(f=>({h:(f.side?'Optional: ':FNUM[f.id]+'. ')+f.t,p:f.d+(f.branch?' Paths: '+FLOW_BRANCH.map(b=>b.t+' ('+b.d.toLowerCase()+')').join(', ')+'.':'')}))}}

/* ================= APP SHELL ================= */
/* Line icons for the sheets, drawn to match the bottom navigation. */
const ICO={trophy:'M8 4h8v5a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 4 M16 6h3a3 3 0 0 1-3 4 M12 13v4 M8 21h8 M9 17h6',globe:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18',leaf:'M5 19c0-8 5-14 14-14c0 9-6 14-14 14z M5 19l8-8',
  hourglass:'M7 3h10 M7 21h10 M8 3v3l4 6 4-6V3 M8 21v-3l4-6 4 6v3',flask:'M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7.5 15h9',drop:'M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z',
  clipboard:'M9 3h6v3H9z M7 4.5H5V21h14V4.5h-2 M8 11h8 M8 15h8 M8 19h5',cog:'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9L7 7 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1',
  book:'M4 19V5a2 2 0 0 1 2-2h13v14H6a2 2 0 0 0-2 2a2 2 0 0 0 2 2h13 M8 7h7',pencil:'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',moon:'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun:'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5L19 19 M5 19l1.5-1.5 M17.5 6.5L19 5',download:'M12 4v11 M7 10l5 5 5-5 M5 20h14',
  file:'M6 3h8l4 4v14H6z M14 3v4h4 M9 13h6 M9 17h4',share:'M12 15V3 M7 8l5-5 5 5 M5 12v8h14v-8',copy:'M9 9h11v11H9z M5 15H4V4h11v1',text:'M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M12 12v6'};
// True inside the Android app or when the site is already installed to the home screen.
const installed=()=>!!window.Capacitor||MQ('(display-mode: standalone)')||navigator.standalone===true;
const ico=(n,bg)=>'<span class="ic" style="background:'+bg+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+ICO[n]+'"/></svg></span>';

const TABNAMES={champs:'World championships',words:'Coffee words',flow:'From seed to cup',dial:'Dial-in',planner:'Brew planner',scan:'Scan beans',gear:'Gear and dials',recipes:'Recipes',tech:'Techniques',process:'Processes',map:'Origins map',variety:'Varieties',history:'History',guide:'Guide',log:'Brew log'};
const BNGROUP={champs:'explore',words:'explore',flow:'explore',dial:'dial',recipes:'recipes',scan:'scan',map:'explore',variety:'explore',history:'explore',process:'explore',tech:'explore',planner:'more',gear:'more',guide:'more',log:'more'};
function syncShell(id){$('ab-title').textContent=TABNAMES[id]||'Brew Bench';$('ab-back').hidden=NAVD<1;document.body.className=document.body.className.replace(/\bt-\w+/g,'').trim()+' t-'+id;
  document.querySelectorAll('.bottomnav [data-bn]').forEach(b=>b.setAttribute('aria-current',BNGROUP[id]===b.dataset.bn));
  const can=['dial','planner','scan','history','log','map','recipes','words','flow'].includes(id);$('ab-share').hidden=!can}
const SHEETS={explore:[['map','Origins map','50 origins on an interactive map','#4F8A74','globe'],['variety','Varieties','44 varieties, stories and Geisha types','#B5533C','leaf'],['history','History','Family tree, timeline and a quiz','#8A5A3B','hourglass'],['process','Processes','From washed to thermal shock','#D2A04A','flask'],['tech','Techniques','Every move in the brewing toolbox','#6B8E4E','drop'],['champs','World championships','Every champion, their recipes and gear','#C9964A','trophy'],['flow','From seed to cup','How coffee is made, step by step','#6E8FA8','leaf'],['words','Coffee words','A bank of '+GLOSSARY.length+' coffee terms','#9A7390','book']],
  more:[['planner','Brew planner','A recipe tuned to your coffee','#8A5A3B','clipboard'],['gear','Gear and dials','Grinders, brewers and dial reading','#6E8FA8','cog'],['guide','Guide','Ratio calculator and troubleshooting','#C9964A','book'],['log','Brew log','Your brews, ratings and exports','#6B8E4E','pencil']]};
function openSheet(which){const items=SHEETS[which];
  $('ns-in').innerHTML='<div class="sheet"><div class="grab"></div><button class="vd-close" id="ns-x" aria-label="Close">\u2715</button><h2 id="ns-title" style="margin:0 40px 0 0">'+(which==='explore'?'Explore':'More')+'</h2><div class="sheetlist">'+
   items.map(([k,n,d,c,ic])=>'<button type="button" data-go="'+k+'">'+ico(ic,c)+'<span>'+n+'<small>'+d+'</small></span></button>').join('')+
   (which==='more'?'<button type="button" data-toggle-theme>'+ico(curTheme()==='dark'?'sun':'moon','#5B5F66')+'<span>'+(curTheme()==='dark'?'Switch to light theme':'Switch to dark theme')+'<small>Bright cream or cosy espresso</small></span></button>'+(installed()?'':'<button type="button" data-install="1">'+ico('download','#9A7390')+'<span>Add to your home screen<small>Use it like an app</small></span></button>'):'')+'</div><div id="ns-extra"></div></div>';
  const d=$('navsheet');if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}$('ns-x').onclick=()=>d.close()}
$('navsheet').addEventListener('click',e=>{const d=$('navsheet');if(e.target===d){d.close();return}const g=e.target.closest('[data-go]');if(g){d.close();showTab(g.dataset.go);return}
  if(e.target.closest('[data-toggle-theme]')){$('themebtn').click();d.close();toast(curTheme()==='dark'?'Dark theme on':'Light theme on');return}
  if(e.target.closest('[data-install]'))$('ns-extra').innerHTML='<div class="tip"><b>iPhone (Safari):</b> open this page\u2019s link in Safari, tap the Share button, then <b>Add to Home Screen</b>.<br><b>Android (Chrome):</b> open the link in Chrome, tap the \u22ee menu, then <b>Add to Home screen</b>.<br>Your calibration, log and scans stay saved on this phone.</div>'});
document.querySelector('.bottomnav').onclick=e=>{const b=e.target.closest('[data-bn]');if(!b)return;const k=b.dataset.bn;if(k==='explore'||k==='more')openSheet(k);else showTab(k)};
$('ab-share').onclick=()=>{const id=(document.querySelector('main section.on')||{}).id;
  if(id==='dial')openShare(dialDoc());else if(id==='planner')openShare(recipeDoc(PL.tech,plan(Object.assign({},PL)),PL));else if(id==='scan')$('sc-share').click();else if(id==='history')openShare(historyDoc());else if(id==='log')openShare(logDoc());else if(id==='map'){if(SEL)openShare(originDoc(SEL));else toast('Pick an origin first')}else if(id==='recipes')toast('Tap Share on any recipe card');else if(id==='words')openShare(wordsDoc());else if(id==='flow')openShare(flowDoc())};
$('dial-share').onclick=()=>openShare(dialDoc());
$('ab-back').onclick=()=>history.back();
$('hist-share').onclick=()=>openShare(historyDoc());
$('l-pdf').onclick=()=>openShare(logDoc());

/* ================= THEME ================= */
function curTheme(){return document.documentElement.getAttribute('data-theme')||(MQ('(prefers-color-scheme: dark)')?'dark':'light')}
function syncThemeBtn(){const t=curTheme();$('themebtn').textContent=t==='dark'?'Light':'Dark';
  // Once a theme is chosen by hand, the browser bar follows it rather than the system setting.
  if(document.documentElement.hasAttribute('data-theme'))document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.content=t==='dark'?'#1F1814':'#FBF7F0')}
$('themebtn').onclick=()=>{const n=curTheme()==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);try{localStorage.setItem('bb-theme',n)}catch(e){}syncThemeBtn()};
syncThemeBtn();

/* ================= INIT ================= */
// Label each cell with its column heading so tables can stack into cards on phones.
document.querySelectorAll('table.ref').forEach(t=>{const hs=[...t.querySelectorAll('thead th')].map(h=>h.textContent.trim());t.querySelectorAll('tbody tr').forEach(r=>[...r.children].forEach((c,i)=>{if(hs[i])c.dataset.label=hs[i]}))});
// If saved settings ever stop the app from starting, clear them (the brew log and scans are kept) and retry once.
try{initDial();initPlan();render();renderPlan();renderCalc();renderTS();renderStars();renderLog();initScan();}
catch(err){let retried=false;try{retried=sessionStorage.getItem('bb-reset')==='1';sessionStorage.setItem('bb-reset','1')}catch(e){}
  if(!retried){try{['bb-state','bb-plan','bb-scan','bb-calc','bb-base3'].forEach(k=>localStorage.removeItem(k))}catch(e){}location.reload()}throw err}
try{sessionStorage.removeItem('bb-reset')}catch(e){}
{const h=location.hash.slice(1);if(!openRoute(h)){if(h&&$(h)&&$(h).tagName==='SECTION')showTab(h,true);else syncShell('dial')}}
if(GROUP)startStream();
if(window.claude&&window.claude.use){
  window.claude.use('sample').then(async s=>{SAMPLE=s;if(!s)return;
    try{const l=await s.limits();IMGS=!!(l&&l.images);if(IMGS)$('scan-file').accept=$('scan-cam').accept=l.images.mediaTypes.join(',')}catch(e){IMGS=false}
    $('scan-go').disabled=!SFILE}).catch(()=>{});
  window.claude.use('downloads').then(d=>{DL=d;renderLog()}).catch(()=>{});
}else{$('scan-status').hidden=true;$('scan-lede').textContent='Take a photo of the bag or the roaster’s card. The text is read on your phone, matched to the guide and turned into a brew plan for your gear.'}
