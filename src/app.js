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
const MQ=q=>!!(window.matchMedia&&window.matchMedia(q).matches);const RM=()=>MQ('(prefers-reduced-motion: reduce)')||document.documentElement.getAttribute('data-motion')==='reduced';
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
  cmdred:{name:'C40 + Red Clix',full:'Comandante C40 with Red Clix',type:'manual',brand:'Comandante',fmt:'num',unit:'clicks',sub:1,first:0,um:15,min:8,max:90,v60:50,k:27.5,pts:[[8,450],[16,573],[36,968],[50,1232],[66,1716],[90,2400]],body:0.3,clarity:0.4,espresso:true,
    burr:'39 mm "Nitro Blade" conical burrs',adjust:'Red Clix axle doubles the clicks: about 15 microns per click, counted from fully closed',
    range:'Espresso about 12 to 20 clicks, AeroPress about 30 to 40, V60 about 44 to 56, French press about 60 to 70.',cup:'The C40 cup with finer steps.',use:'When you want espresso and filter from a Comandante.'},
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
  k2:{name:'Kingrinder K0 / K1 / K2',full:'Kingrinder K0, K1 and K2',type:'manual',brand:'Kingrinder',fmt:'num',unit:'clicks',sub:1,first:0,um:18,min:10,max:160,v60:75,k:16.4,body:0.3,clarity:0.1,espresso:true,
    burr:'38 mm conical steel burrs (K0 and K1) and 48 mm (K2)',adjust:'Internal dial under the burr: 40 clicks per turn, about 18 microns per click; count clicks from closed',
    range:'Espresso about 20 to 35 clicks (K1 and K2), AeroPress about 50 to 70, V60 about 55 to 95, French press about 100 to 120.',cup:'Balanced with medium body; good value.',use:'Budget all-round hand grinding. The K0 is the pour-over model.'},
  c5esp:{name:'Timemore C5 ESP Pro',full:'Timemore Chestnut C5 ESP Pro',type:'manual',brand:'Timemore',fmt:'num',unit:'clicks',sub:1,first:0,um:15,min:8,max:130,v60:66,k:18.7,body:0.3,clarity:0.2,espresso:true,
    burr:'Conical steel burrs, tuned for espresso and filter',adjust:'External dial: 50 clicks per turn, about 15 microns per click; count clicks from closed',
    range:'Espresso about 20 to 35 clicks, V60 about 48 to 84 (66 is a good start: finer for light roasts, coarser for dark), French press about 90 and up.',cup:'Sweet and clean for the price.',use:'Espresso and pour-over from one hand grinder.'},
  c5pro:{name:'Timemore C5 Pro',full:'Timemore Chestnut C5 Pro',type:'manual',brand:'Timemore',fmt:'num',unit:'clicks',sub:1,first:0,um:31,min:3,max:30,v60:12,k:60,body:0.4,clarity:0,espresso:false,
    burr:'Conical steel burrs, tuned for filter',adjust:'External dial: 48 clicks per turn, about 31 microns per click; count clicks from closed',
    range:'AeroPress about 8 to 11 clicks, pour-over about 10 to 14, French press about 18 to 22. Not for espresso (the C5 ESP Pro is).',cup:'Sweet with medium body.',use:'Everyday pour-over with big, easy steps.'},
  x25:{name:'Comandante X25',full:'Comandante X25 Trailmaster',type:'manual',brand:'Comandante',fmt:'num',unit:'clicks',sub:1,first:0,um:28,min:3,max:38,v60:20,k:62,body:0.3,clarity:0.3,espresso:false,
    burr:'Compact conical "Nitro Blade" steel burrs',adjust:'No numbers: count clicks from fully closed, about 25 to 30 microns per click',
    range:'AeroPress about 12 to 16 clicks, V60 about 15 to 25, French press about 27 to 33.',cup:'The Comandante cup in a smaller, lighter body.',use:'Travel and camping pour-over.'},
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
  sgp:{name:'Breville Smart Grinder Pro',full:'Breville (Sage) Smart Grinder Pro',type:'electric',brand:'Breville',fmt:'num',sub:1,first:1,min:0,max:59,v60:23,k:24,pts:[[0,380],[11,573],[23,1232],[29,1408],[53,1716],[59,1810]],body:0.4,clarity:-0.5,espresso:true,
    burr:'40 mm conical steel burrs',adjust:'60 numbered settings with a timer; the espresso settings are packed into the low numbers, so steps are not even',
    range:'Espresso about 8 to 15, pour-over about 18 to 30 (V60 near 24, Chemex near 30), French press about 50 to 60.',cup:'Fuller body, some fines.',use:'Espresso machines and everyday brewing.'},
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
// The first version saved its whole default table as soon as you touched calibration, so those old defaults
// looked like your own settings and held back later corrections. A table that is mostly old defaults drops them.
{const OLD={zp6:{v60:56,neo:53,origami:55,kono:55,melitta:56,chemex:64,kalita:54,orea:52,april:54,pulsar:66,tricolate:42,sw:60,swneo:57,swi:66,clever:62,aeropress:44,frenchpress:78,siphon:50,moka:32,phin:36,dallah:60,cold:82,batch:58},
  kultra:{v60:72,neo:69,origami:71,kono:71,melitta:72,chemex:84,kalita:64,orea:68,april:70,pulsar:88,tricolate:58,sw:76,swneo:73,swi:86,clever:80,aeropress:62,frenchpress:102,siphon:66,espresso:36,moka:46,phin:52,cezve:10,dallah:78,cold:106,batch:76}};
  let ch=false;for(const g in OLD){const B=BASE[g];if(!B)continue;const ks=Object.keys(B);if(ks.length>=10&&ks.filter(k=>B[k]===OLD[g][k]||B[k]==null).length>=ks.length*0.7){for(const k of ks)if(B[k]===OLD[g][k]||B[k]==null)delete B[k];ch=true}}
  if(ch)save('bb-base3',BASE)}
// Once, on every device: back to the app's own calibration (asked for in October 2026). Your later changes stay.
try{if(!localStorage.getItem('bb-calreset1')){BASE={};save('bb-base3',BASE);localStorage.setItem('bb-calreset1','1')}}catch(e){}
// Calibrating a brewer on one grinder says how fine you like that brewer, so your other grinders follow it on that
// brewer (the same grind size; averaged if you calibrated it on several). Cached; cleared when BASE changes.
let BOFF={};
// A brewer's other method (the Switch's full immersion) follows the brewer's calibration.
function boff(b){if(b in BOFF)return BOFF[b];const cb=BREWERS[b].of||b;let t=0,n=0;for(const g in BASE){const v=BASE[g]&&BASE[g][cb];if(v==null||!GRINDERS[g])continue;const d=defBase(g,cb,true);if(d!=null){t+=sizeOf(g,v)-sizeOf(g,d);n++}}return BOFF[b]=n?t/n:0}
function calX(g,b){const d=defBase(g,b,true);if(d==null)return null;const o=boff(b);if(!o)return d;const G=GRINDERS[g];return clamp(stepsFor(g,sizeOf(g,d)+o),G.min,G.max)}
// Your calibrated setting for a grinder on a brewer, or the estimate from the shared scale.
function base(g,b){const v=BASE[g]&&BASE[g][b];if(v!=null)return v;const x=calX(g,b);return x==null?null:Math.round(x)}
// The same, unrounded: used when converting between grinders so the result lands on the nearest click.
function baseX(g,b){const v=BASE[g]&&BASE[g][b];return v==null?calX(g,b):v}
const canGrind=(g,b)=>!!GRINDERS[g]&&base(g,b)!=null;
// First of your grinders that can do this brewer (falls back to any grinder in the library).
const capable=b=>MYG.find(g=>canGrind(g,b))||Object.keys(GRINDERS).find(g=>canGrind(g,b));
function settingFor(g,b,off){const bb=baseX(g,b);return bb==null?null:roundG(g,shift(g,bb,-off*160))}
function gLabel(g,v){const G=GRINDERS[g];return G.name+' '+dial(g,v)+(G.unit==='clicks'?' clicks':'')}
/* ================= YOUR RECIPES ================= */
// Recipes you or your team create sit after the built-in ones in RECIPES, so the timer and dial-in work with them.
// World championship recipes join the built-in ones, so the timer and dial-in work with them.
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
// A method of another brewer (the Switch used as a full immersion) isn't listed as a brewer of its own.
const LISTED=k=>!BREWERS[k].of,METHODS=k=>Object.keys(BREWERS).filter(x=>BREWERS[x].of===k);
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
// Any origin, on the map (ALLO) or off it (XO). A stored origin that is neither becomes '' ("not sure").
const oInfo=k=>ALLO()[k]||XO[k]||null;
const okOrigin=k=>typeof k==='string'&&oInfo(k)?k:'';
const originName=k=>(oInfo(k)||{}).name||k;
// The origin key for a country as written ("Oman", "oman", "Côte d'Ivoire"), or ''.
const originByName=n=>{const f=fold(String(n||'')).replace(/\(.*$/,'').trim();if(!f)return '';const all={...ALLO(),...XO};
  return Object.keys(all).find(k=>k===f||fold(all[k].name).replace(/\(.*$/,'').trim()===f)||''};
// The origin dropdown: each region's countries, on the map or not, in name order.
const originOptions=()=>{const all={...ALLO(),...XO};return Object.entries(REG).map(([rk,r])=>'<optgroup label="'+r.name+'">'+Object.keys(all).filter(k=>all[k].reg===rk)
  .sort((a,b)=>all[a].name.localeCompare(all[b].name)).map(k=>'<option value="'+k+'">'+esc(all[k].name)+'</option>').join('')+'</optgroup>').join('')};

/* ================= STATE ================= */
let S=Object.assign({grinder:'zp6',setting:56,brewer:'v60',temp:93,ratio:15,bloom:45,agit:'med',roast:'light',process:'washed',variety:'caturra',rec:null,dose:15,goal:'balance',amt:'mid',age:14,tuned:null},load('bb-state',{}));
S.agit=oneOf(S.agit,['low','med','high'],'med');S.roast=oneOf(S.roast,['light','medium','dark'],'light');
// The beans you're brewing: a coffee from your gallery or a scan, so shared cards can say which coffee it was.
const okSBean=b=>{if(!b||typeof b!=='object')return null;const id=/^[a-z0-9]{4,24}$/,o={name:str(b.name,60),roaster:str(b.roaster,50),origin:okOrigin(b.origin),id:id.test(b.id)?b.id:'',scan:id.test(b.scan)?b.scan:''};return o.name?o:null};
S.bean=okSBean(S.bean);
S.setting=num(S.setting,56);S.temp=num(S.temp,93);S.ratio=num(S.ratio,15);S.bloom=num(S.bloom,45);if(S.rec!=null&&!RECIPES[S.rec])S.rec=null;
S.dose=num(S.dose,15,3,120);S.age=Math.round(num(S.age,14,0,90));if(!S.tuned||typeof S.tuned!=='object')S.tuned=null;
if(typeof S.variety!=='string'||!vById(S.variety))S.variety='caturra';if(!BREWERS[S.brewer]||!BREWERS[S.brewer].model)S.brewer='v60';if(!PROCESSES[S.process])S.process='washed';
if(S.grinder==='kultra'&&S.setting<30&&S.setting>5&&S.setting%1)S.setting=Math.round(S.setting*10);
// If the saved grinder is gone or can't do this brewer, move to one of yours and carry the grind across, never the raw click number.
if(!MYG.includes(S.grinder)||!canGrind(S.grinder,S.brewer)){const g=MYG.find(x=>canGrind(x,S.brewer))||capable(S.brewer);
  S.setting=GRINDERS[S.grinder]&&canGrind(S.grinder,S.brewer)&&canGrind(g,S.brewer)?convertSetting(S,g,S.brewer):base(g,S.brewer);S.grinder=g}
S.setting=roundG(S.grinder,S.setting);
let LOG=load('bb-log',[]),LFL=[];

/* ================= MODEL ================= */
// The recipe's own settings sit at its brewer's sweet spot; a cold or out-of-range temperature counts as the brewer's nearest one.
/* How much each lever moves extraction (D = 0 is the sweet spot's centre, ±0.45 its edges).
   KG: one recipe step of grind (160 on the shared size scale, about 7 ZP6 clicks or 160 microns).
   KT: one degree of water. Grind is the bigger lever: in brewing studies a 5 °C change moves extraction about as much as
   a few clicks, so 1 °C is worth roughly one ZP6 click. Temperatures count from the brewer's own default. */
const KG=0.45,KT=0.2/3;
function rBias(r){const B=BREWERS[r.b];return -(KG*r.off+(clamp(r.temp||B.temp.def,B.temp.min,B.temp.max)-B.temp.def)*KT+(r.water/r.dose-B.ratio.ref)*B.ratio.k)}
// A longer bloom extracts a little more, with diminishing returns past 75 s (a 3-minute bloom is not four times a 45 s one).
const bloomE=(b,B)=>{const d=b-B.bloom.def,over=Math.max(0,b-75);return (d-over*0.75)/15*0.09};
function compute(st){
  const G=GRINDERS[st.grinder],B=BREWERS[st.brewer],P=PROCESSES[st.process],Vp=vParams(st.variety);
  const step=stepsBetween(st.grinder,baseX(st.grinder,st.brewer),st.setting);
  const agit={low:-0.25,med:0,high:0.25}[st.agit], roastE={light:0,medium:0.25,dark:0.6}[st.roast];
  const rec=st.rec!=null&&RECIPES[st.rec]&&sameFam(RECIPES[st.rec].b,st.brewer)?RECIPES[st.rec]:null;
  // A smaller dose than the recipe's drains faster through a dripper, so the same grind extracts a little less.
  const dadj=rec&&st.dose>0&&['Cone dripper','Flat-bottom dripper'].includes(B.type)?clamp(Math.round(-0.6*Math.log2(st.dose/rec.dose)*10)/10,-1,1):0;
  const E=KG*(step-dadj)+(st.temp-B.temp.def)*KT+bloomE(st.bloom,B)+agit+(st.ratio-B.ratio.ref)*B.ratio.k+roastE+(rec?rBias(rec):0);
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
// What the cup should taste of: the variety's and process's notes, shifted by how far the extraction lands from the sweet spot.
function cupNotes(st,r){const P=PROCESSES[st.process],Vv=vById(st.variety);let ch=[...Vv.notes.slice(0,3),...P.notes];
  if(r.D<-1.2)ch=['sour','grassy','thin',Vv.notes[0]];else if(r.D<-0.45)ch=['bright',...ch.slice(0,4)];
  else if(r.D>1.2)ch=['drying','bitter cocoa','papery','muted'];else if(r.D>0.45)ch=['syrupy','brown sugar',...Vv.notes.slice(0,2)];
  if(P.funk>=1.2&&r.D>0.45)ch.push('harsh ferment');return [...new Set(ch)]}
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
/* ---------- Dial-in with a recipe ----------
   Pick a recipe, your dose and the cup you're after: the brew plan tunes grind, water, ratio, bloom and agitation
   for the coffee in front of you, and the steps are rebuilt for your dose and target. Move any slider yourself and the
   dial-in keeps your setting (with a Re-tune button to go back to the tuned one). */
const dialRec=()=>S.rec!=null&&RECIPES[S.rec]&&(sameFam(RECIPES[S.rec].b,S.brewer)||(RECIPES[S.rec].b==='swi'&&(S.brewer==='sw'||S.brewer==='swneo')))?RECIPES[S.rec]:null;
const dialCtx=()=>({brewer:S.brewer,grinder:S.grinder,tech:S.rec,process:S.process,variety:S.variety,roast:S.roast,age:S.age,goal:S.goal,amt:S.amt,dose:S.dose});
const TUNED_KEYS=['grinder','setting','temp','ratio','bloom','agit'];
const isTuned=()=>!!S.tuned&&TUNED_KEYS.every(k=>S.tuned[k]===S[k]);
// How true the current settings are to the chosen target cup. Each target is planned for this coffee, recipe and dose;
// the target whose planned cup sits nearest the cup the current settings make is what you're actually brewing.
// share: how much closer the chosen target is than the next nearest (1 = right on it, under 0.5 = another is closer).
// FIT_R: how far your settings can move from the target's own cup and still make it; FIT_OFF: past this, and nearer
// another target's cup, you are brewing that other cup.
const FIT_R=2.2,FIT_OFF=4.5,FIT_HONEY='#C9964A',FIT_ROAST='#A8432F';
function cupFit(){if(!dialRec())return null;const B=BREWERS[S.brewer];
  const feats=st=>{const c=compute(st);return [c.D/0.15,c.acid/0.4,c.body/0.4,c.clarity/0.4,-st.ratio/B.ratio.step*0.6,c.sweet/0.4]};
  const cur=feats(S),d={};
  for(const [g] of GOALS){const p=plan(Object.assign(dialCtx(),{goal:g,amt:g===S.goal?S.amt:'mid'}));d[g]=Math.hypot(...feats(Object.assign({},S,p.st)).map((x,i)=>x-cur[i]))}
  const near=GOALS.map(x=>x[0]).filter(g=>g!==S.goal).sort((a,b)=>d[a]-d[b])[0],share=d[near]/((d[S.goal]+d[near])||1);
  const ds=d[S.goal],state=ds<=FIT_R?'on':share<0.5&&ds>FIT_OFF?'off':'drift';
  // One score for the colour, the marker and the percentage: 1 at the target's own settings, 0.56 at the edge of
  // "on target", 0.5 at the point where another cup takes over.
  const score=state==='on'?0.56+0.44*(1-ds/FIT_R):state==='drift'?0.5+0.06*clamp((FIT_OFF-ds)/(FIT_OFF-FIT_R),0,1):Math.min(share,0.499);
  return {state,share,score,near,dSel:ds}}
function renderFit(){const el=$('g-fit'),f=cupFit();
  document.querySelectorAll('#g-goal button').forEach(b=>{b.classList.remove('fit-near','fit-lean');b.style.removeProperty('--fitc')});
  if(!el)return f;el.hidden=!f;if(!f)return f;
  // How each target's cup is described in a sentence.
  const CUPW={balance:'balanced',sweet:'sweeter',bright:'brighter',clean:'clearer',tea:'tea-like',body:'fuller-bodied',strong:'stronger'};
  const me=CUPW[S.goal],nw=CUPW[f.near],nn=GOALN[f.near],cur=document.querySelector('#g-goal button[data-v="'+S.goal+'"]'),nb=document.querySelector('#g-goal button[data-v="'+f.near+'"]');
  // The chosen pebble keeps its fill and gets a border that follows the fit, in coffee tones: the theme colour on target, through caramel as the
  // cup drifts, to roast red once another target is closer. It blends smoothly as the settings move.
  const t=f.score,col=t>=0.56?'color-mix(in srgb,var(--cherry) '+Math.round(Math.min(1,(t-0.56)/0.3)*100)+'%,'+FIT_HONEY+')'
    :t>=0.5?'color-mix(in srgb,'+FIT_HONEY+' '+Math.round((t-0.5)/0.06*100)+'%,'+FIT_ROAST+')':FIT_ROAST;
  if(cur&&f.state!=='on')cur.style.setProperty('--fitc',col);if(nb&&f.state!=='on')nb.classList.add(f.state==='off'?'fit-near':'fit-lean')
  el.style.setProperty('--fc',col);
  const pct=Math.round(f.score*100),title=f.state==='on'?'On target':f.state==='drift'?'Drifting':'Closer to '+nn;
  const txt=f.state==='on'?'Your settings still make a '+me+' cup.'
    :f.state==='drift'?'Your changes are pulling away from a '+me+' cup. A little further and it turns '+nw+'.'
    :'Your settings now make a '+nw+' cup, not a '+me+' one.';
  el.className='fit fit-'+f.state;
  // The marker sits on three even zones (another cup · drifting · on target), so it lines up with the scale labels.
  const pos=Math.max(2,Math.min(98,t<0.5?(t-0.35)/0.15*33:t<0.56?33+(t-0.5)/0.06*33:66+(t-0.56)/0.44*34));
  const icon=f.state==='on'?'M5 9h12v4a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6z M17 10h1.5a2.5 2.5 0 0 1 0 5H17 M9 3c-1 1.5 1 2.5 0 4 M13 3c-1 1.5 1 2.5 0 4'
    :f.state==='drift'?'M12 3v10 M12 17v.5 M4.5 20h15L12 4z':'M4 8h14 M15 5l3 3-3 3 M20 16H6 M9 13l-3 3 3 3';
  el.innerHTML='<div class="fit-head"><span class="fit-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+icon+'"/></svg></span><b>'+esc(title)+'</b>'+
    '<span class="fit-pct" title="How '+esc(me)+' the cup still is">'+pct+'% '+esc(me)+'</span></div><p>'+esc(txt)+'</p>'+
    '<div class="gauge fit-g" role="meter" aria-label="How close to '+esc(GOALN[S.goal])+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><i style="left:'+pos.toFixed(1)+'%"></i></div>'+
    '<div class="gscale"><span>Another cup</span><span>Drifting</span><span>On target</span></div>'+
    (f.state==='on'?'':'<div class="fit-act"><button type="button" class="btn ghost" data-retune>Re-tune for '+esc(GOALN[S.goal])+'</button>'+(f.state==='off'?'<button type="button" class="btn ghost" data-fitgo="'+f.near+'">Switch to '+esc(nn)+'</button>':'')+'</div>');return f}
function tune(msg){if(!dialRec())return;const p=plan(dialCtx());Object.assign(S,p.st);{const B=BREWERS[S.brewer];S.temp=clamp(S.temp,B.temp.min,B.temp.max);S.bloom=clamp(S.bloom,B.bloom.min,B.bloom.max)}S.tuned=Object.fromEntries(TUNED_KEYS.map(k=>[k,S[k]]));render();if(msg)toast(msg)}
// Inputs that change the plan re-tune while you haven't moved the sliders yourself.
function retuneIfAuto(msg){if(dialRec()&&(isTuned()||!S.tuned))tune(msg);else render()}
function dialPlan(){const r=dialRec();if(!r)return null;const p=plan(dialCtx()),water=+gfmt(S.dose*S.ratio),ps=planSteps(r,S.dose,water,S.goal),bl=BREWERS[S.brewer].bloom.label==='Bloom'?bloomShift(ps.steps,S.bloom):{steps:ps.steps};
  return{r,p,water,steps:bl.steps,changes:bl.note?[...ps.changes,bl.note]:ps.changes}}
// Your bloom sets the second pour: the recipe's own bloom is the time from its first step (at 0:00) to its second, and
// every step after the first moves by the difference, so the steps, the timer and the brew card follow what you set.
// Only when that second step is a pour 25 to 90 s in: a stir, a press or the end of a steep isn't the end of a bloom.
function bloomShift(steps,bloom){const t=s=>{const m=/^(\d+):(\d\d)\b/.exec(s);return m?+m[1]*60+ +m[2]:null},fmt=v=>Math.floor(v/60)+':'+String(v%60).padStart(2,'0');
  const t1=t(steps[1]||'');if(!(bloom>0)||steps.length<2||t(steps[0])!==0||t1==null||t1<25||t1>90||!/^\d+:\d\d\s+(pour|add|open the valve)/i.test(steps[1]))return{steps};const d=Math.round(bloom)-t(steps[1]);if(!d)return{steps};
  return{steps:steps.map((s,i)=>{const v=t(s);return i&&v!=null?s.replace(/^\d+:\d\d/,fmt(Math.max(0,v+d))):s}),
    note:'Bloom '+Math.round(bloom)+' s (the recipe says '+t(steps[1])+' s): the next pours move '+Math.abs(d)+' s '+(d>0?'later':'earlier')+'.'}}
function renderDialRecipe(){const tl=techList(S.brewer),r=dialRec();
  const opts='<option value="">No recipe: dial in freely</option>'+tl.map(([x,i])=>'<option value="'+i+'">'+esc(x.name)+(x.b!==S.brewer&&sameFam(x.b,S.brewer)?' (for the '+BSHORT[x.b]+')':'')+(x.champ?' (champion)':'')+'</option>').join('');
  if($('i-rec').dataset.k!==S.brewer+'|'+tl.length){$('i-rec').innerHTML=opts;$('i-rec').dataset.k=S.brewer+'|'+tl.length}
  $('i-rec').value=r?String(S.rec):'';$('v-rec').textContent=r?(r.by||''):tl.length+' for this brewer';
  $('d-recbox').hidden=!r;$('mr-play').hidden=!r;
  if(!r){$('d-recipe').hidden=true;$('d-recipe').innerHTML='';return}
  const dp=dialPlan(),p=dp.p,tuned=isTuned();
  if(document.activeElement!==$('i-dose'))$('i-dose').value=S.dose;$('v-water').textContent=dp.water+'g';
  seg('g-goal',GOALS,()=>S.goal,v=>{S.goal=v;tune()});
  $('g-amtrow').hidden=S.goal==='balance';$('g-gdesc').textContent=GSPEC[S.goal].d;
  seg('g-amt',Object.keys(AMTS).map(k=>[k,AMTS[k].n]),()=>S.amt,v=>{S.amt=v;tune()});
  {const f=renderFit();$('d-tuned').hidden=!!f&&f.state!=='on'}
  $('d-tuned').innerHTML=tuned?'Grind, water, ratio, '+BREWERS[S.brewer].bloom.label.toLowerCase()+' and agitation are tuned for this coffee and target.':'You’ve adjusted the settings yourself. <button type="button" class="linkbtn" data-retune>Re-tune</button>';
  const notes=[...dp.changes,...p.tw,...p.why];
  $('d-recipe').hidden=false;
  $('d-recipe').innerHTML='<span class="pill"><i style="background:var(--cherry)"></i>Your recipe</span><h2>'+esc(r.name)+'</h2>'+(r.by?'<p class="hint" style="margin:0">'+esc(r.by)+'</p>':'')+
    '<div class="dr-meta"><span class="gl">'+esc(goalLabel(S.goal,S.amt))+'</span><span>'+S.dose+'g : '+dp.water+'g · 1:'+rr1(S.ratio)+'</span><span>'+S.temp+'°C'+(r.temp2?' then '+r.temp2+'°C':'')+'</span><span>'+esc(gLabel(S.grinder,S.setting))+'</span><span>'+BREWERS[S.brewer].bloom.label+' '+S.bloom+'s</span></div>'+
    '<div class="dr-cols"><div><h3 style="margin-top:0">Steps</h3>'+pourGraph(dp.steps,dp.water)+stepList(dp.steps)+(r.tip&&r.kind!=='46'?'<p class="hint">'+esc(r.tip)+'</p>':'')+'</div>'+
    '<div><h3 style="margin-top:0">What changed and why</h3><ul class="why">'+(notes.length?notes.map(w=>'<li>'+w+'</li>').join(''):'<li>The recipe as written suits this coffee.</li>')+'</ul></div></div>'+
    '<div class="actions"><button type="button" class="btn" data-dtimer>Start brew timer</button><button type="button" class="btn ghost" data-dfull>Original recipe</button><button type="button" class="btn ghost" data-dshare>Share</button></div>'}
function dialTimer(){const dp=dialPlan();if(!dp)return;openTimer(S.rec,{brewer:S.brewer,grinder:S.grinder,set:{[S.grinder]:S.setting},r:{dose:S.dose},water:dp.water,temp:S.temp,steps:dp.steps})}
// The Beans row under Your coffee: the coffee you picked, or a way to pick one from the gallery.
function renderDBean(){const el=$('d-bean');if(!el||!window.BEANS_OK)return;const b=S.bean,gb=b&&b.id&&beanById(b.id);
  if(b){el.innerHTML='<div class="dbean">'+(gb?beanPic(gb,'xs'):'<span class="bpic xs" style="--rc:'+regCol(b.origin)+'"><span class="bph">'+beanSVG+'</span></span>')+
      '<button type="button" class="dbean-tx" data-dbpick><b>'+esc(b.name)+'</b><small>'+esc([b.roaster,b.origin?originName(b.origin):''].filter(Boolean).join(' · ')||'Tap to change')+'</small></button>'+
      '<button type="button" class="dbean-x" data-dbclear aria-label="Clear the beans">✕</button></div>';hydrateImgs(el)}
  else el.innerHTML=BEANS.length?'<button type="button" class="btn ghost dbean-pick" data-dbpick>'+beanSVG+'Pick from your bean gallery</button>':'<p class="hint" style="margin:0">Add coffees under Beans (or scan a bag) and they show here and on your shared brew cards.</p>'}
function render(){
  const G=GRINDERS[S.grinder],B=BREWERS[S.brewer];
  grinderSeg('g-grinder',(S.brewer),()=>S.grinder,v=>{if(v!==S.grinder){const was=isTuned();S.setting=swapGrinder(v);S.grinder=v;
    // Same grind on another grinder is not a change of yours, so a tuned brew stays tuned.
    if(was)S.tuned=Object.assign({},S.tuned,{grinder:S.grinder,setting:S.setting})}render()});
  seg('g-agit',[['low','Gentle'],['med','Normal'],['high','Vigorous']],()=>S.agit,v=>{S.agit=v;render()});
  seg('g-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>S.roast,v=>{S.roast=v;retuneIfAuto()});
  const gi=$('i-grind');gi.min=G.min;gi.max=G.max;gi.step=1;gi.value=S.setting;
  $('v-grind').textContent=dial(S.grinder,S.setting);drawDial('dialsvg',S.grinder,S.setting);
  const r=compute(S);
  $('v-equiv').innerHTML=equivLine(S.grinder,S.setting,S.brewer);
  $('v-grindhint').textContent=(G.fmt==='rot'?'('+S.setting+' clicks) ':'')+(Math.abs(r.step)<0.15?'at your baseline':(r.step>0?'finer':'coarser')+' than baseline');
  const ti=$('i-temp');ti.min=B.temp.min;ti.max=B.temp.max;ti.value=S.temp;$('v-temp').textContent=S.temp+'°C';
  const ri=$('i-ratio');ri.min=Math.min(B.ratio.min,S.ratio);ri.max=Math.max(B.ratio.max,S.ratio);ri.step=B.ratio.step;ri.value=S.ratio;$('v-ratio').textContent='1:'+rr1(S.ratio);
  const bi=$('i-bloom');bi.min=B.bloom.min;bi.max=B.bloom.max;bi.step=B.bloom.max<=20?1:5;bi.value=S.bloom;$('v-bloom').textContent=S.bloom+'s';
  $('i-bloom').previousElementSibling.firstChild.textContent=B.bloom.label+' ';
  renderDialRecipe();renderDBean();
  $('i-brewer').value=S.brewer;$('i-process').value=S.process;$('i-variety').value=S.variety;$('i-age').value=S.age;$('v-age').textContent=S.age+' days';
  const [vt,vs]=verdict(r.D);$('o-verdict').textContent=vt;$('mr-v').textContent=vt;$('mr-g').textContent=gLabel(S.grinder,S.setting)+', '+S.temp+'°C, 1:'+rr1(S.ratio);$('mr-m').style.left=((clamp(r.D,-2.5,2.5)+2.5)/5*100)+'%';$('o-summary').textContent=vs+' '+strength(S)+'.';
  $('o-marker').style.left=((clamp(r.D,-2.5,2.5)+2.5)/5*100)+'%';
  $('o-bars').innerHTML=[['Sweetness',r.sweet],['Acidity',r.acid],['Body',r.body],['Clarity',r.clarity],['Bitterness',r.bitter,'bitter']]
    .map(([n,v,c])=>'<div class="bar '+(c||'')+'"><span>'+n+'</span><div class="t"><b style="width:'+(v*10)+'%"></b></div><span class="num" style="font-size:.9rem">'+v.toFixed(1)+'</span></div>').join('');
  drawCup(r);
  const P=PROCESSES[S.process];
  $('o-chips').innerHTML=cupNotes(S,r).map(c=>'<span class="chip">'+esc(c)+'</span>').join('');
  const tips=[];
  {const bx=baseX(S.grinder,S.brewer),off=bx==null?0:stepsBetween(S.grinder,bx,S.setting);
    if(Math.abs(off)>2.5)tips.push('<b>'+esc(gLabel(S.grinder,S.setting))+' is much '+(off>0?'finer':'coarser')+' than '+art(brewName(B.name))+' '+esc(brewName(B.name))+' usually needs.</b> Most brews start around '+esc(dial(S.grinder,Math.round(bx)))+'. <button type="button" class="linkbtn" data-reset-grind>Reset to '+esc(dial(S.grinder,Math.round(bx)))+'</button>')}
  if(Math.abs(r.D)>0.45){const bx0=baseX(S.grinder,S.brewer);let t=roundG(S.grinder,shift(S.grinder,S.setting,r.D/KG*160));
    // Stay inside the brewer's usual window (about 1.5 recipe steps either side of its baseline); the water temperature does the rest.
    if(bx0!=null){const lo=roundG(S.grinder,shift(S.grinder,bx0,-240)),hi=roundG(S.grinder,shift(S.grinder,bx0,240));t=r.D>0?Math.min(t,Math.max(hi,S.setting)):Math.max(t,Math.min(lo,S.setting))}const diff=Math.abs(t-S.setting);// Water alone is offered only when a few degrees will do it; past that the grind is the right lever.
    const dTa=-r.D/KT,ta=Math.abs(dTa)<=6?clamp(Math.round(S.temp+dTa),B.temp.min,B.temp.max):S.temp;
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
  // The recipe is kept by its key too: its place in the list moves when recipes are added or folded together.
  S.reck=S.rec!=null&&RECIPES[S.rec]?rkey(RECIPES[S.rec]):null;save('bb-state',S);
}
function renderCal(){
  $('caltbody').innerHTML=MODEL.filter(LISTED).map(k=>{const b=BREWERS[k];const cell=g=>!canGrind(g,k)?'<td class="hint">n/a</td>':'<td><input type="number" step="1" data-g="'+g+'" data-b="'+k+'" value="'+base(g,k)+'" aria-label="'+GRINDERS[g].name+' clicks, '+esc(b.name)+'"> <span class="hint">'+dial(g,base(g,k))+'</span></td>';return'<tr><td>'+esc(b.name)+'</td>'+MYG.map(cell).join('')+'</tr>'}).join('');
  $('calhead').innerHTML='<th>Brewer</th>'+MYG.map(g=>'<th>'+esc(gname(g))+'</th>').join('');
}
function initDial(){
  $('i-brewer').innerHTML=brewerOptions(MODEL);
  for(const id of['i-process','s-process'])$(id).innerHTML=processOptions();
  for(const id of['i-variety','s-variety'])$(id).innerHTML=varietyOptions();
  $('i-grind').oninput=e=>{S.setting=+e.target.value;soon(render)};
  $('i-temp').oninput=e=>{S.temp=+e.target.value;soon(render)};
  $('i-ratio').oninput=e=>{S.ratio=+e.target.value;soon(render)};
  $('i-bloom').oninput=e=>{S.bloom=+e.target.value;soon(render)};
  $('i-brewer').onchange=e=>{const nb=e.target.value;let g=S.grinder;if(!canGrind(g,nb)){g=capable(nb);toast(gname(S.grinder)+' can\u2019t grind for this brewer, switched to '+gname(g))}
    S.setting=canGrind(S.grinder,S.brewer)&&canGrind(g,nb)?convertSetting(S,g,nb):base(g,nb);S.grinder=g;S.brewer=nb;S.rec=null;S.tuned=null;
    const B=BREWERS[nb];if(S.ratio<B.ratio.min||S.ratio>B.ratio.max)S.ratio=B.ratio.def;if(S.bloom<B.bloom.min||S.bloom>B.bloom.max)S.bloom=B.bloom.def;fitRanges();render()};
  $('i-rec').onchange=e=>{const v=e.target.value;if(v===''){S.rec=null;S.tuned=null;render();return}const r=RECIPES[+v];S.rec=+v;S.dose=r.dose;tune('Tuned '+r.name+' for your coffee')};
  const setDose=v=>{v=Math.round(clamp(v,3,120)*2)/2;if(v===S.dose){$('i-dose').value=v;return}S.dose=v;retuneIfAuto()};
  $('d-dminus').onclick=()=>setDose(S.dose-(S.dose<=10?0.5:1));$('d-dplus').onclick=()=>setDose(S.dose+(S.dose<10?0.5:1));
  $('i-dose').onchange=e=>{const v=parseFloat(e.target.value);if(v>0)setDose(v);else e.target.value=S.dose};
  $('d-recbox').onclick=e=>{if(e.target.closest('[data-retune]'))tune('Re-tuned for this coffee and target');const g=e.target.closest('[data-fitgo]');if(g){S.goal=g.dataset.fitgo;tune()}};
  $('d-recipe').onclick=e=>{if(e.target.closest('[data-dtimer]'))dialTimer();else if(e.target.closest('[data-dfull]'))openRecipe(S.rec);else if(e.target.closest('[data-dshare]'))openShare(dialDoc())};
  $('mr-play').onclick=dialTimer;
  $('i-age').oninput=e=>{S.age=+e.target.value;$('v-age').textContent=S.age+' days';clearTimeout($('i-age')._t);$('i-age')._t=setTimeout(()=>retuneIfAuto(),250)};
  $('i-process').onchange=e=>{S.process=e.target.value;retuneIfAuto()};
  $('i-variety').onchange=e=>{S.variety=e.target.value;retuneIfAuto()};
  $('v-about').onclick=()=>openVariety(S.variety.split(':')[0]);
  renderCal();
  $('caltbody').oninput=e=>{const i=e.target;if(!i.dataset.g)return;const v=parseFloat(i.value);if(isNaN(v))return;(BASE[i.dataset.g]=BASE[i.dataset.g]||{})[i.dataset.b]=Math.round(v);(BOFF={},save('bb-base3',BASE));i.nextElementSibling.textContent=dial(i.dataset.g,v);render();renderRecipes();renderGrindMap()};
  $('calreset').onclick=()=>{BASE={};(BOFF={},save('bb-base3',BASE));renderCal();render();renderRecipes();renderGrindMap();if(BUILT.gear)renderMatch();toast('Calibration reset')};
}

/* ================= BREW PLAN (used by the dial-in and Scan) ================= */
const PBREWERS=MODEL.filter(k=>k!=='swi'&&RECIPES.some(r=>r.b===k||((k==='sw'||k==='swneo')&&r.b==='swi')));
// The V60 NEO is the V60 cone reshaped inside, so their recipes are one family: either brews the other's recipes.
// Same cup model, different dripper: a recipe moves between these freely.
const BFAM=b=>b==='neo'?'v60':b==='swneo'?'sw':b;
const sameFam=(a,b)=>BFAM(a)===BFAM(b);
// The Recipes tab also shelves full-immersion Switch recipes with the Switch.
let LASTSURP=-1;
const RFAM=b=>b==='swi'?'sw':BFAM(b);
const BTAG={neo:'NEO',swneo:'NEO',swi:'Immersion'};
const BSHORT={v60:'V60',neo:'NEO',sw:'Switch',swneo:'NEO Switch'};
function techList(b){const all=RECIPES.map((r,i)=>[r,i]);return all.filter(([r])=>r.b===b).concat(all.filter(([r])=>r.b!==b&&sameFam(r.b,b)),all.filter(([r])=>(b==='sw'||b==='swneo')&&r.b==='swi'))}
/* Target cup profiles. Each moves the predicted extraction (Dt), the ratio (in brewer steps), the agitation and, for
   Brighter, the water a degree cooler. Recipes that publish their own levers (Kasuya's 4:6) are rebuilt with them. */
// Each target nudges extraction (Dt), ratio (steps on the brewer's scale), water temperature (dT, °C), bloom or steep
// time (dB, seconds on the usual 20 to 180s bloom; scaled for brewers with a shorter one) and agitation.
// lt: which way the technique tweaks lean (a lighter, b heavier). f46/n46: how the 4:6 splits its pours.
const GSPEC={
 balance:{n:'Balanced',d:'The recipe as written, tuned only for this coffee.',Dt:0,dr:0,dT:0,dB:0},
 sweet:{n:'Sweeter',d:'Fuller extraction for caramel sweetness: a little hotter and a longer bloom.',Dt:0.15,dr:0,dT:1,dB:10,lt:'b',f46:'sweet',n46:3,why:'Sweeter: slightly fuller extraction, enough to reach the caramelised sugars without bitterness: a little hotter, a longer bloom.'},
 bright:{n:'Brighter',d:'Livelier acidity: cooler water, a shorter bloom and gentle pours.',Dt:-0.15,dr:0,dT:-2,dB:-10,ag:'low',lt:'a',f46:'bright',n46:3,why:'Brighter: slightly lighter extraction keeps the acidity lively: cooler water, a shorter bloom and gentle pours.'},
 clean:{n:'Clearer',d:'Each flavour distinct: a longer ratio, a degree cooler and gentle pours.',Dt:-0.3,dr:1,dT:-1,dB:5,ag:'low',lt:'a',n46:2,why:'Clearer: a longer ratio, a degree cooler and gentle pours, with an even bloom, for a lighter, more separated cup.'},
 tea:{n:'Tea-like',d:'Light, silky and delicate, like a good tea: longer ratio, cooler, short bloom, very gentle.',Dt:-0.25,dr:2,dT:-2,dB:-5,ag:'low',lt:'a',n46:2,why:'Tea-like: a longer ratio, cooler water, a shorter bloom and very gentle pours for a light, silky, delicate cup.'},
 body:{n:'More body',d:'Heavier, syrupy texture: hotter, a longer bloom, a tighter ratio and more agitation.',Dt:0.3,dr:-1,dT:1,dB:15,ag:'up',lt:'b',n46:4,why:'More body: a tighter ratio, a little hotter, a longer bloom and more agitation for weight and texture.'},
 strong:{n:'Stronger',d:'More coffee in every sip: a tighter ratio, a little hotter, same balance of flavour.',Dt:0.05,dr:-2,dT:1,dB:5,lt:'b',n46:3,why:'Stronger: a tighter ratio for more concentration, a degree hotter and a slightly longer bloom so the stronger brew still extracts fully.'}};
const GOALS=Object.keys(GSPEC).map(k=>[k,GSPEC[k].n]);
const GOALN=Object.fromEntries(GOALS);
const goalOf=g=>g==='clarity'?'clean':GOALN[g]?g:'balance';
// How strongly a target is applied.
const AMTS={low:{n:'A touch',m:0.5},mid:{n:'Clearly',m:1},high:{n:'A lot',m:1.4}};
const amtOf=a=>AMTS[a]?a:'mid';
const goalLabel=(g,a)=>GOALN[g]+(g!=='balance'&&a!=='mid'?' ('+AMTS[a].n.toLowerCase()+')':'');
S.goal=goalOf(S.goal);S.amt=amtOf(S.amt);
// Kasuya's 4:6: the first 40% of the water sets sweetness against acidity (a smaller first pour is sweeter, a bigger
// one brighter); the last 60% sets strength (fewer pours lighter, more pours fuller).
function steps46(dose,water,goal){const G=GSPEC[goal]||{},f=water*0.4,a=G.f46==='sweet'?f/3:G.f46==='bright'?f*2/3:f/2,n=G.n46||3,gap={2:60,3:45,4:35}[n],rest=water*0.6/n;
  const out=[],pours=[a,f-a,...Array(n).fill(rest)];let t=0,tot=0;
  pours.forEach((w,k)=>{tot+=w;out.push(mmss(t)+' pour '+gfmt(w)+'g'+(k?' (to '+gfmt(tot)+'g)':'')+'.');t+=k<1?45:k<2?45:gap});
  out.push(mmss(t-gap+(n===3?30:gap))+' remove the dripper.');return out}
function planSteps(r,dose,water,goal){
  goal=goalOf(goal);
  if(r.kind==='46'&&goal!=='balance'){const G=GSPEC[goal],st=steps46(dose,water,goal),f=water*0.4,n=G.n46||3,ch=[];
    if(G.f46){const a=G.f46==='sweet'?f/3:f*2/3;ch.push('First two pours '+gfmt(a)+'g then '+gfmt(f-a)+'g (instead of equal): '+(G.f46==='sweet'?'a smaller first pour is sweeter.':'a bigger first pour is brighter.'))}
    if(n!==3)ch.push('The last 60% in '+n+' pours instead of 3: '+(n<3?'lighter and cleaner.':'stronger, with more body.'));
    return{steps:st,changes:ch}}
  return{steps:scaleSteps(r,dose,water),changes:[]}}
// How far, in recipe grind steps (160 µm each), the coffee and the target may move a recipe's grind.
const GRIND_SWAY=0.9;
function plan(c){
  const tl=techList(c.brewer);if(!tl.find(([,i])=>i===c.tech))c.tech=tl[0][1];c.goal=goalOf(c.goal);c.amt=amtOf(c.amt);
  const r=RECIPES[c.tech],bb=sameFam(r.b,c.brewer)?c.brewer:r.b,B=BREWERS[bb],P=PROCESSES[c.process],Vp=vParams(c.variety),Vv=vById(c.variety);
  let grinder=GRINDERS[c.grinder]?c.grinder:MYG[0];if(!canGrind(grinder,bb))grinder=capable(bb);
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
    if(c.age<=7&&c.roast!=='dark'){bloom=55;why.push('Very fresh beans ('+c.age+' days): longer 55s bloom to let the CO\u2082 out.')}
    else if(c.age>=30){bloom=30;why.push('Older beans ('+c.age+' days): little gas left, so a short 30s bloom.')}
    if(P.funk>=1.2&&bloom>35){bloom=35;why.push('Loud processes get a shorter bloom to avoid early over-extraction.')}
    if(c.roast==='dark'&&bloom>30){bloom=30;why.push('Dark roast: a 30s bloom is enough; dark beans release their gas quickly.')}}
  else if(c.age<=7)why.push('Very fresh beans: expect more crema and gushing; let them rest a few more days if shots are erratic.');
  let agit='med';if(Vp.clarity>=0.8||P.funk>=1.2){agit='low';why.push('Gentle pours: agitation mutes delicate aromatics and exaggerates ferment.')}
  let ratio=r.water/r.dose;const st_=B.ratio.step,G=GSPEC[c.goal],m=c.goal==='balance'?0:AMTS[c.amt].m;
  const dr=G.dr?Math.sign(G.dr)*Math.max(1,Math.round(Math.abs(G.dr)*m+(m>1?0.4:0))):0,dT=G.dT?Math.sign(G.dT)*Math.max(1,Math.round(Math.abs(G.dT)*m+(m>1?0.4:0))):0;
  const span=B.bloom.max-B.bloom.min,bs=span>=60?5:1,dB=G.dB?Math.sign(G.dB)*Math.max(bs,Math.round(Math.abs(G.dB)*m*Math.min(1,span/160)/bs)*bs):0;
  const t0=temp,b0=bloom;ratio+=dr*st_;temp=clamp(temp+dT,B.temp.min,B.temp.max);bloom=clamp(bloom+dB,B.bloom.min,B.bloom.max);
  if(G.ag==='low')agit='low';else if(G.ag==='up')agit=agit==='low'||m<1?'med':'high';
  // Say exactly what the target moved, on top of what the coffee itself called for.
  const sg=v=>(v>0?'+':'\u2212')+Math.abs(v),moved=[temp!==t0&&'water '+sg(temp-t0)+'°C ('+temp+'°C)',bloom!==b0&&B.bloom.label.toLowerCase()+' '+sg(bloom-b0)+'s ('+bloom+'s)',dr&&'ratio '+(dr>0?'longer':'tighter')].filter(Boolean);
  if(G.why)why.push(G.why+(c.amt==='low'?' Applied lightly.':c.amt==='high'?' Pushed further.':'')+(moved.length?' For this target: '+moved.join(', ')+'.':''));
  const lo_=Math.min(B.ratio.min,r.water/r.dose),hi_=Math.max(B.ratio.max,r.water/r.dose);
  // As written, the recipe's own ratio is kept exactly; a target that moves it lands on the brewer's steps.
  ratio=dr?clamp(Math.round(ratio/st_)*st_,lo_,hi_):clamp(ratio,lo_,hi_);ratio=Math.round(ratio*100)/100;
  if(r.kind==='hedrick'&&c.roast!=='light')why.unshift('<b>Heads up:</b> this technique is built for light roasts.');
  if(r.temp2)why.unshift('Two temperatures: '+temp+'°C for the first stage, then about '+r.temp2+'°C as the steps say.');
  if(grinder!==c.grinder)why.unshift(gname(c.grinder)+' can\u2019t grind for this brewer, so settings are for '+gname(grinder)+'.');
  // Extraction stays inside the sweet spot; going further leans on ratio and agitation.
  const Dt=clamp(G.Dt*m,-0.33,0.33);
  // Your dose: a smaller bed in a dripper drains faster, so grind finer for it (coarser for a bigger one).
  const dose=c.dose>0?Math.round(c.dose*2)/2:r.dose,f_=dose/r.dose,perc=['Cone dripper','Flat-bottom dripper'].includes(B.type);
  const dadj=perc?clamp(Math.round(-0.6*Math.log2(f_)*10)/10,-1,1):0;
  if(dadj)why.push((dadj>0?'A smaller':'A bigger')+' dose than the recipe\u2019s '+r.dose+'g: grind a little '+(dadj>0?'finer':'coarser')+', because '+(dadj>0?'a shallower bed drains faster.':'a deeper bed drains slower.'));
  const agv={low:-0.25,med:0,high:0.25}[agit], roastE={light:0,medium:0.25,dark:0.6}[c.roast];
  const rest=(temp-clamp(r.temp||B.temp.def,B.temp.min,B.temp.max))*KT+bloomE(bloom,B)+agv+(ratio-r.water/r.dose)*B.ratio.k+roastE-(P.t+Vp.t);
  let step=r.off+dadj+(Dt-rest)/KG;
  // The coffee and the target move the grind only so far from the recipe (about 7 ZP6 clicks either way): a dark,
  // fermented coffee brewed for clarity would otherwise stack its way to the coarsest setting. What's left is taken
  // up by the water, up to 4°C cooler or warmer within the brewer's range, the way a barista would; anything beyond
  // shows in the predicted cup.
  const extra=step-r.off,lim=GRIND_SWAY;let held=false;
  if(Math.abs(extra)>lim){const want=Math.sign(extra)*(Math.abs(extra)-lim),t1=clamp(Math.round(temp+want*KG/KT),Math.max(B.temp.min,temp-4),Math.min(B.temp.max,temp+4)),dt=t1-temp;
    step=r.off+clamp(extra-dt*KT/KG,-lim,lim);held=true;
    if(dt||Math.abs(extra)-lim>0.25)why.push('The grind stays within a few clicks of the recipe rather than going much '+(extra<0?'coarser':'finer')+(dt?'; the water is '+Math.abs(dt)+'°C '+(dt<0?'cooler':'warmer')+' ('+t1+'°C) instead.':'.'));temp=t1}
  const set={};for(const g of new Set([...MYG,grinder]))set[g]=canGrind(g,bb)?roundG(g,shift(g,baseX(g,bb),-step*160)):null;
  const water=+gfmt(dose*ratio);
  const st={grinder,setting:set[grinder],brewer:bb,temp,ratio,bloom,agit,roast:c.roast,process:c.process,variety:c.variety,rec:c.tech};
  const ps=planSteps(r,dose,water,c.goal);
  const tw=[],k=r.kind,gl=c.goal;
  const pick=(a,b,d)=>G.lt==='a'?a:G.lt==='b'?b:d;
  if(k==='hybrid')tw.push(pick('Open the valve about 15s earlier.','Open the valve about 15s later.','Open the valve on time.'));
  if(k==='hoff')tw.push(pick('Skip the stir and just swirl.','Keep the stir and swirl.','Follow as written.'));
  if(k==='imm')tw.push(pick('Shorten the steep by 30s.','Add 30s to the steep.','Steep as written.'));
  if(k==='pulse')tw.push(pick('Use fewer, larger pours.','Use smaller, more frequent pours.','Keep the level steady.'));
  if(k==='kh1'||k==='kh2')tw.push(pick('Keep the immersion water at the cool end (70°C).','Use the warmer end (75 to 80°C) and open 15s later.','Follow the timings as written.'));
  if(k==='neo'||k==='swneo')tw.push(pick('Pour a little gentler in the middle stage.','Stir with the stream in the second pour.','Keep strong, steady pours.'));
  if(k==='aero')tw.push(pick('Use a paper filter and press gently.','Try a metal filter or a longer steep.','Press slowly and stop at the hiss.'));
  if(k==='esp')tw.push(pick('Stretch the ratio a little longer.','Pull a touch shorter and hotter.','Aim for 25 to 30 seconds.'));
  if(k==='single'||k==='hoff1'||k==='flash'||k==='pulsar')tw.push(pick('Pour a little faster and gentler.','Pour slower for more contact time.','Follow as written.'));
  return {r,grinder,temp,bloom,agit,ratio,water,dose,set,st,why,held,tw:k==='46'?[]:tw.filter(t=>gl!=='balance'),steps:ps.steps,changes:ps.changes,goal:c.goal,amt:c.amt};
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
   '<h3>Steps</h3>'+pourGraph(p.steps,p.water)+stepList(p.steps)+
   (p.tw.length?'<div class="tip">'+p.tw.join(' ')+'</div>':'')+
   '<h3>Why these settings</h3><ul class="why">'+(p.why.length?p.why.map(w=>'<li>'+w+'</li>').join(''):'<li>The recipe already suits this coffee.</li>')+
   '<li>Grind starts from the recipe\u2019s setting on your calibration, then moves to land the predicted extraction on your goal.</li></ul>';
}
/* ================= BREW TIMER ================= */
let TM=null;
function parseSteps(steps){let last=-1;return steps.map(s=>{const m=s.match(/(\d+):(\d\d)/);let t=m?(+m[1]*60+ +m[2]):null;if(t==null)t=last;else last=t;return{t,s}})}
const capS=t=>t.charAt(0).toUpperCase()+t.slice(1),stepTxt=s=>capS(s.replace(/^\s*\d+:\d\d\s*/,''));
const mmss=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
// The pour in a step, for the big target: "pour 60g (to 120g)" → to 120 g, +60 g; "pour to 250g" → to 250 g.
// Also "until 374g", "add 210g", "pour the last 70g", "pour all 250g", "bloom with 50g"; a range ("dilute with 100 to 150g") isn't a pour to its end.
function pourOf(txt){const to=/(?<!\d\s?)\b(?:to|until)\s+(\d{2,4})\s?g\b/i.exec(txt),add=/\b(?:pour(?:ing)?|add|bloom with)\s+(?:(?:the|another|all)\s+)?(?:(?:last|remaining|rest of the|final|first)\s+)?(\d{2,4})\s?g\b/i.exec(txt);return to?{to:+to[1],add:add?+add[1]:null}:add?{to:null,add:+add[1]}:null}
function openTimer(idx,p){noteRecent(RECIPES[idx]);
  // The steps follow the dose and water being brewed (the dial-in and Scan pass their own).
  const r0=RECIPES[idx],sc=scaled(r0),dose=p&&p.r&&p.r.dose||sc.dose,water=p&&p.water||sc.water;
  const r=Object.assign({},r0,{dose,water,steps:p&&p.steps||(p?scaleSteps(r0,dose,water):sc.steps),off:sc.off});const ev=parseSteps(r.steps);const timed=ev.filter(e=>e.t>=0);
  const total=timed.length?Math.max(...timed.map(e=>e.t))+(/finish|drain|finished|serve/i.test(r.steps[r.steps.length-1])?0:30):0;
  if(TM&&TM.iv)clearInterval(TM.iv);
  TM={idx,r,p,ev,total,el:0,run:false,iv:null,lastIdx:-1,lastWarn:-1,ctx:null};
  const g=p?p.grinder:(MYG.find(x=>settingFor(x,r.b,r.off)!=null)),gv=p?p.set[p.grinder]:g?settingFor(g,r.b,r.off):null;
  const meta=[(p?p.r.dose:r.dose)+'g : '+(p?p.water:r.water)+'g',(p?p.temp:r.temp)?(p?p.temp:r.temp)+'°C':'',gv!=null?gLabel(g,gv):''].filter(Boolean);
  // Tick marks on the ring where each timed step starts.
  const C=2*Math.PI*96,ticks=total?timed.filter(e=>e.t>0&&e.t<total).map(e=>{const a=e.t/total*2*Math.PI-Math.PI/2;return '<line x1="'+(110+86*Math.cos(a)).toFixed(1)+'" y1="'+(110+86*Math.sin(a)).toFixed(1)+'" x2="'+(110+106*Math.cos(a)).toFixed(1)+'" y2="'+(110+106*Math.sin(a)).toFixed(1)+'" class="tm-tick"/>'}).join(''):'';
  const I=d=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg>';
  $('tm-in').innerHTML='<div class="tm2"><div class="tm-top"><button class="tm-ic" id="tm-x" aria-label="Close timer">'+I('M6 6l12 12M18 6L6 18')+'</button><div class="tm-head"><h2 id="tm-title">'+esc(r.name)+'</h2><div class="tm-meta">'+meta.map(m=>'<span>'+esc(m)+'</span>').join('')+'</div></div></div>'+
   (total?'<div class="tm-ringwrap"><svg class="tm-ring" viewBox="0 0 220 220"><defs><linearGradient id="tmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--honey)"/><stop offset="1" stop-color="var(--cherry)"/></linearGradient></defs><circle cx="110" cy="110" r="96" class="tm-track"/><circle id="tm-arc" cx="110" cy="110" r="96" class="tm-arc" transform="rotate(-90 110 110)" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+C.toFixed(1)+'"/>'+ticks+'</svg>'+
      '<div class="tm-center"><div id="tm-big">0:00</div><div class="tm-of">of '+mmss(total)+'</div></div></div>'+
      '<div class="tm-now" id="tm-card"><div class="tm-step" id="tm-step">Ready when you are</div><div class="tm-target" id="tm-target"></div><div class="tm-text" id="tm-now">Get your gear ready, then press start.</div><div class="tm-bar"><i id="tm-barfill"></i></div><div class="tm-next" id="tm-next"></div></div>'+
      '<div class="tm-ctl"><button class="tm-ic big" id="tm-reset" aria-label="Reset">'+I('M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5')+'</button><button class="tm-play" id="tm-go" aria-label="Start">'+I('M8 5v14l11-7z')+'</button><button class="tm-ic big" id="tm-skip" aria-label="Next step">'+I('M6 5l9 7-9 7z M18 5v14')+'</button></div>'
    :'<p class="tm-text" style="text-align:center">This one is by eye rather than the clock.</p>')+
   '<details class="tm-all"'+(total?'':' open')+'><summary>All steps ('+ev.length+')</summary><ol id="tm-list">'+ev.map((e,i)=>'<li data-i="'+i+'">'+(e.t>=0?'<b>'+mmss(e.t)+'</b>':'')+'<span>'+esc(stepTxt(e.s))+'</span></li>').join('')+'</ol></details></div>';
  const d=$('timer');showDlg(d);d.scrollTop=0;
  $('tm-x').onclick=()=>d.close();
  // However the timer is closed (X, back, Escape, backdrop), stop it and let the screen sleep again.
  d.onclose=()=>{if(TM&&TM.iv)clearInterval(TM.iv);if(TM)TM.run=false;wake(false)};
  if(total){$('tm-go').onclick=()=>{if(TM.el>=TM.total){TM.el=0;TM.lastIdx=-1}if(!TM.ctx){try{TM.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}TM.run=!TM.run;setPlay();wake(TM.run);
      if(TM.run){TM.t0=performance.now()-TM.el*1000;TM.iv=setInterval(tick,200);tick()}else clearInterval(TM.iv)};
    $('tm-reset').onclick=()=>{clearInterval(TM.iv);TM.run=false;wake(false);TM.el=0;TM.lastIdx=-1;TM.lastWarn=-1;setPlay();paint()};
    // Skip jumps to the next step's time (handy when you pour faster than the recipe).
    $('tm-skip').onclick=()=>{const n=TM.ev.find(e=>e.t>TM.el+0.5);if(!n)return;TM.el=n.t;if(TM.run)TM.t0=performance.now()-TM.el*1000;paint()};paint()}
}
function setPlay(){const b=$('tm-go');b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(TM.run?'M7 5h4v14H7z M13 5h4v14h-4z':'M8 5v14l11-7z')+'"/></svg>';b.setAttribute('aria-label',TM.run?'Pause':TM.el>0?'Resume':'Start');b.classList.toggle('on',TM.run)}
// Keep the screen on while a brew timer runs (where the browser supports it).
let WL=null;function wake(on){try{if(on&&!WL&&navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>{WL=l;l.addEventListener('release',()=>{WL=null})}).catch(()=>{});else if(!on&&WL){WL.release();WL=null}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&TM&&TM.run)wake(true)});
function beep(soft){if(!TM.ctx)return;try{const o=TM.ctx.createOscillator(),g=TM.ctx.createGain();o.frequency.value=soft?660:880;g.gain.setValueAtTime(.001,TM.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.25,TM.ctx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,TM.ctx.currentTime+.35);o.connect(g).connect(TM.ctx.destination);o.start();o.stop(TM.ctx.currentTime+.4)}catch(e){}if(navigator.vibrate)navigator.vibrate(120)}
function tick(){TM.el=(performance.now()-TM.t0)/1000;if(TM.el>=TM.total){TM.el=TM.total;clearInterval(TM.iv);TM.run=false;wake(false);setPlay();paint();done();beep();beans(26);return}paint()}
function done(){const r=TM.r||RECIPES[TM.idx];$('tm-step').textContent='Done';$('tm-target').innerHTML='';$('tm-now').textContent='Enjoy your cup.';$('tm-next').innerHTML='<div class="tm-done"><button class="btn" id="tm-log">Log this brew</button><button class="btn ghost" id="tm-again">Brew again</button></div>';
  $('tm-log').onclick=()=>{const p=TM.p,B=BREWERS[r.b];$('timer').close();setTimeout(()=>{showTab('log');$('l-settings').value=r.name+', '+(p?p.r.dose:r.dose)+'g : '+(p?p.water:r.water)+'g'+((p?p.temp:r.temp)?', '+(p?p.temp:r.temp)+'°C':'');$('l-settings').dataset.brewer=r.b;$('l-coffee').focus()},250)};
  $('tm-again').onclick=()=>{TM.el=0;TM.lastIdx=-1;TM.lastWarn=-1;paint();$('tm-go').click()};drawCheck()}
// How long the drawdown took is the most reliable grind signal there is: a dripper that finishes early wants a finer
// grind, one that runs long a coarser one. About 35 s of drawdown is one recipe step of grind size (about 7 ZP6 clicks),
// so the answer becomes an exact setting on your grinder, and you can keep it as your setting for this brewer.
const DRAW_S=35;
function drawCheck(){const p=TM.p,r=TM.r||RECIPES[TM.idx],b=(p&&(p.brewer||p.st&&p.st.brewer))||r.b,B=BREWERS[b];
  if(!B||!['Cone dripper','Flat-bottom dripper'].includes(B.type))return;
  const g=p&&p.grinder||MYG.find(x=>canGrind(x,b)),v=p&&p.set&&p.set[g]!=null?p.set[g]:g?settingFor(g,b,r.off||0):null;if(g==null||v==null)return;
  const opts=[[-30,'30s early'],[-15,'15s early'],[0,'On time'],[15,'15s late'],[30,'30s late']];
  const box=document.createElement('div');box.className='tm-draw';
  box.innerHTML='<p class="tm-dq">When did the drawdown finish? <small>The recipe aims for '+mmss(TM.total)+'</small></p><div class="seg tm-dseg" role="group" aria-label="Drawdown timing">'+opts.map(([d,t])=>'<button type="button" data-dd="'+d+'" aria-pressed="false">'+t+'</button>').join('')+'</div><div class="tm-dres" aria-live="polite"></div>';
  $('tm-next').appendChild(box);
  box.querySelector('.tm-dseg').onclick=e=>{const bt=e.target.closest('[data-dd]');if(!bt)return;const dd=+bt.dataset.dd;
    box.querySelectorAll('[data-dd]').forEach(x=>x.setAttribute('aria-pressed',x===bt));const out=box.querySelector('.tm-dres');
    if(!dd){out.innerHTML='<p>Your grind is right for this brewer. Keep '+esc(gLabel(g,v))+'.</p>';return}
    // Early means the bed was too open: finer (a smaller size). Late: coarser.
    const ds=dd/DRAW_S*160,nv=roundG(g,shift(g,v,ds)),n=Math.abs(nv-v),G=GRINDERS[g];
    if(!n){out.innerHTML='<p>That\u2019s less than one click on the '+esc(G.name)+'. Keep '+esc(gLabel(g,v))+' and pour a touch '+(dd<0?'slower':'faster')+'.</p>';return}
    out.innerHTML='<p>Go <b>'+n+' click'+(n===1?'':'s')+' '+(dd<0?'finer':'coarser')+'</b> next time: <b>'+esc(gLabel(g,nv))+'</b>.</p><button type="button" class="btn ghost" id="tm-keep">Use this for my '+esc(BREWERS[B.of||b].name)+'</button>';
    $('tm-keep').onclick=()=>{const cb=B.of||b,bx=baseX(g,cb);if(bx==null)return;(BASE[g]=BASE[g]||{})[cb]=roundG(g,shift(g,bx,ds));BOFF={};save('bb-base3',BASE);
      render();renderCal();if(BUILT.recipes)renderRecipes();if(BUILT.gear){renderGrindMap();renderMatch()}$('tm-keep').disabled=true;$('tm-keep').textContent='Saved as your '+BREWERS[cb].name+' setting';toast('Your '+G.name+' setting for the '+BREWERS[cb].name+' is now '+dial(g,BASE[g][cb]))}}}
function paint(){const el=TM.el,C=2*Math.PI*96;$('tm-big').textContent=mmss(el);
  $('tm-arc').setAttribute('stroke-dashoffset',(C*(1-el/TM.total)).toFixed(1));
  let cur=-1;TM.ev.forEach((e,i)=>{if(e.t>=0&&e.t<=el)cur=i});
  if(cur!==TM.lastIdx&&TM.run&&cur>=0){beep();TM.lastIdx=cur}
  const ni=TM.ev.findIndex(e=>e.t>el),next=ni>=0?TM.ev[ni]:null,left=next?next.t-el:TM.total-el;
  // Three soft beeps before the next step, so you can get the kettle ready.
  if(TM.run&&next&&left<=3&&left>0){const w=Math.ceil(left);if(TM.lastWarn!==ni*10+w){TM.lastWarn=ni*10+w;beep(true)}}
  $('tm-list').querySelectorAll('li').forEach((li,i)=>{li.className=i<cur?'done':i===cur?'cur':''});
  const nTimed=TM.ev.filter(e=>e.t>=0).length,stepNo=cur>=0?TM.ev.slice(0,cur+1).filter(e=>e.t>=0).length:0;
  if(el>0&&el<TM.total||TM.run){const txt=cur>=0?TM.ev[cur].s.replace(/^\s*\d+:\d\d\s*/,''):'Get ready.',pr=cur>=0?pourOf(TM.ev[cur].s):null;
    $('tm-step').textContent=cur>=0?'Step '+stepNo+' of '+nTimed:'Starting';$('tm-now').textContent=txt.charAt(0).toUpperCase()+txt.slice(1);
    $('tm-target').innerHTML=pr?(pr.to?'<b>'+pr.to+'</b><small> g on the scale</small>'+(pr.add?'<em>+'+pr.add+' g</em>':''):'<b>+'+pr.add+'</b><small> g</small>'):'';
    const from=cur>=0?TM.ev[cur].t:0,span=(next?next.t:TM.total)-from;$('tm-barfill').style.width=(span>0?Math.min(100,(el-from)/span*100):100)+'%';
    $('tm-next').innerHTML=next?'<span>Next in <b>'+Math.ceil(left)+'s</b></span><span class="tm-nx">'+esc(stepTxt(next.s))+'</span>':'<span>Finishing in <b>'+Math.ceil(left)+'s</b></span>';
    $('tm-card').classList.toggle('warn',!!(TM.run&&next&&left<=3))}
  else if(el===0){$('tm-step').textContent='Ready when you are';$('tm-target').innerHTML='';$('tm-now').textContent='Get your gear ready, then press start.';$('tm-barfill').style.width='0';$('tm-next').innerHTML=TM.ev[0]?'<span class="tm-nx">First: '+esc(stepTxt(TM.ev[0].s))+'</span>':''}}

/* ================= TABS ================= */
// Heavy tabs are built the first time they are opened, which keeps startup quick.
const LAZY={champs:renderChamps,words:renderWords,wheel:renderWheelTab,flow:renderFlow,gear:buildGear,recipes:renderRecipes,tech:renderTech,process:renderProcesses,variety:renderVarieties,map:buildMap,history:()=>{buildTree();startQuiz()}},BUILT={};
// Explore and More re-render each visit: the word of the day, your counts and the theme can change.
const ALWAYS={explore:()=>renderExplore(),settings:()=>renderSettings(),beans:()=>{if(window.BEANS_OK)renderBeansIfChanged()},
  // The Beans row on the dial-in follows the gallery: a coffee added, renamed or removed shows on the next visit.
  dial:()=>{if(window.BEANS_OK)renderDBean()},
  // The countdown stops ticking when you leave the page; coming back starts it again.
  champs:()=>{if(BUILT.champs)renderCountdown()}};
// Pages are built the first time they're opened. So that first tap isn't slow, the rest are built ahead, one per
// idle moment, a few seconds after the app opens (never while it's in the background).
function prebuildTabs(){const ids=['recipes','gear','variety','process','map','words','history','flow','wheel','champs','tech'].filter(k=>LAZY[k]);
  const idle=window.requestIdleCallback?f=>requestIdleCallback(f,{timeout:4000}):f=>setTimeout(f,200);
  const next=()=>{if(document.hidden){setTimeout(()=>idle(next),2000);return}const id=ids.find(k=>!BUILT[k]);if(!id)return;BUILT[id]=1;try{LAZY[id]()}catch(e){BUILT[id]=0}idle(next)};
  setTimeout(()=>idle(next),2500)}
function ensureTab(id){document.querySelectorAll('.bean-fx').forEach(b=>b.remove());if(LAZY[id]&&!BUILT[id]){BUILT[id]=1;LAZY[id]()}if(ALWAYS[id])ALWAYS[id]()}
// NAVD counts tab changes you can step back through, so the app bar can offer a back button.
let BACKING=false,PEND_TAB=null,NAVD=0;
// Screens slide in the way you are going: deeper or to a tab on the right from the right, back or left from the left.
const BNORD=['dial','recipes','beans','explore','settings'];
// Moving between pages. Four kinds of move, each with its own motion (see "Navigation motion" in the styles):
// right / left between the bottom-bar sections, push into a page within a section, pop back out of it.
// pure: a plain navigation tap (bottom bar, tabs, Explore tiles, back). Those animate both pages at once with a
// view transition; any other move (an action that then scrolls to a card, say) switches at once, so code that
// runs right after showTab finds the new page in place, and only the new page animates in.
let NAV_READY=false;
function showTab(id,fromHistory,pure){ensureTab(id);const cur=document.querySelector('main section.on');let kind='';
  if(cur&&cur.id!==id){const a=BNORD.indexOf(BNGROUP[cur.id]),b=BNORD.indexOf(BNGROUP[id]);
    kind=a!==b&&a>=0&&b>=0?(b<a?'left':'right'):fromHistory?'pop':'push';document.body.classList.toggle('nav-back',kind==='left'||kind==='pop')}
  // Each tab gets a history entry, so the back button (browser or Android) returns to the last tab.
  if(!fromHistory&&location.hash!=='#'+id){NAVD++;if(BACKING)PEND_TAB=id;else try{history.pushState(null,'','#'+id)}catch(e){}}
  const swap=vt=>{
    // A page inside a section (the map, the log…) lights up that section's tab.
    document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x.dataset.t===(BNGROUP[id]||id)));
    document.querySelectorAll('main section').forEach(s=>s.classList.toggle('on',s.id===id));window.scrollTo({top:0});syncShell(id);
    if(kind&&NAV_READY){const sec=$(id);if(!vt){sec.classList.remove('nav-in');void sec.offsetWidth;sec.classList.add('nav-in');clearTimeout(sec._nav);sec._nav=setTimeout(()=>sec.classList.remove('nav-in'),800);
      // Between bottom-bar sections the page swings in as a whole; its blocks cascade only on the way in or out.
      if(kind==='push'||kind==='pop')cascadeIn(sec)}}};
  document.documentElement.dataset.nav=NAV_READY?kind:'';
  // The bottom-bar highlight answers the tap at once, before the page itself changes.
  if(kind){document.querySelectorAll('.bottomnav [data-bn]').forEach(b=>b.setAttribute('aria-current',BNGROUP[id]===b.dataset.bn));movePill()}
  // Moving deeper or back uses a view transition (both pages move). Between bottom-bar sections only the new page
  // swings in: capturing the whole old page first held each tap back by a frame or two on phones.
  if((kind==='push'||kind==='pop')&&pure&&NAV_READY&&document.startViewTransition&&!RM()&&!document.hidden&&!document.querySelector('dialog[open]')){
    const h=document.documentElement;h.classList.add('vt');
    try{document.startViewTransition(()=>swap(true)).finished.finally(()=>h.classList.remove('vt'))}catch(e){h.classList.remove('vt');swap()}}
  else swap()}
// The new page's first blocks arrive one after another, top to bottom: only those on screen, at most a dozen.
function cascadeIn(sec){if(RM()||!sec)return;const vh=innerHeight,picked=[];
  const pick=(el,depth)=>{for(const c of el.children){if(picked.length>=12)return;const r=c.getBoundingClientRect();if(!r.height||r.bottom<0)continue;if(r.top>vh)return;
    if(depth<2&&r.height>vh*.55&&c.children.length>1)pick(c,depth+1);else picked.push(c)}};
  pick(sec,0);picked.forEach((c,i)=>{c.style.setProperty('--ci',i);c.classList.remove('cascade');void c.offsetWidth;c.classList.add('cascade');
    const done=e=>{if(e&&e.target!==c)return;c.classList.remove('cascade');c.removeEventListener('animationend',done)};c.addEventListener('animationend',done);setTimeout(done,1400)})}
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
// Sheets slide away before they close (the CSS animates .closing), so nothing vanishes abruptly.
{const cl=HTMLDialogElement.prototype.close;HTMLDialogElement.prototype.close=function(v){if(!this.open||this.classList.contains('closing'))return;
  if(RM()||document.hidden)return cl.call(this,v);this.classList.add('closing');
  const done=()=>{clearTimeout(t);this.removeEventListener('animationend',end);if(!this.classList.contains('closing'))return;this.classList.remove('closing');cl.call(this,v)},
    end=e=>{if(e.target===this)done()},t=setTimeout(done,380);this.addEventListener('animationend',end)}}
document.addEventListener('cancel',e=>{if(e.target.tagName==='DIALOG'){e.preventDefault();e.target.close()}},true);
// Open a dialog; reopening one that is sliding away just keeps it.
function showDlg(d){if(d.classList.contains('closing')){d.classList.remove('closing');return}if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}}
addEventListener('popstate',()=>{const open=[...document.querySelectorAll('dialog[open]:not(.closing)')];
  if(BACKING){BACKING=false;try{if(PEND_TAB&&location.hash!=='#'+PEND_TAB)history.pushState(null,'','#'+PEND_TAB);if(open.length)history.pushState({dlg:1},'',location.hash||'#dial')}catch(e){}PEND_TAB=null;return}
  if(open.length){const top=DSTACK.filter(d=>d.open&&!d.classList.contains('closing')).pop();if(top){top.dataset.popped=1;top.close()}else open.forEach(d=>d.close());return}
  let h=location.hash.slice(1);if(h==='more')h='settings';if(openRoute(h))return;const id=h&&$(h)&&$(h).tagName==='SECTION'?h:'dial';if(!$(id).classList.contains('on')){NAVD=Math.max(0,NAVD-1);showTab(id,true,true)}});
document.querySelector('[role=tablist]').onclick=e=>{const t=e.target.closest('.tab');if(t)showTab(t.dataset.t,false,true)};

/* ================= RECIPES ================= */
// A recipe's details and buttons, used on its card and when it opens from a shared link.
const gfmt=v=>v>=10?String(Math.round(v)):String(Math.round(v*10)/10);
// Every weight in a recipe's steps scaled to another dose and water: water amounts by the water change, the coffee
// dose by the dose change. Step times stay as written.
// Amounts in the steps follow your dose and water. A range ("150 to 200g") scales at both ends; an amount of coffee
// ("16g of coffee", or the recipe's dose itself) follows the dose, everything else the water; a rate per litre stays.
function scaleSteps(r,dose,water){if(dose===r.dose&&water===r.water)return r.steps;const fd=dose/r.dose,fw=water/r.water;
  return r.steps.map(x=>x.replace(/(\d+(?:\.\d+)?)(?:(\s*(?:to|-|\u2013)\s*)(\d+(?:\.\d+)?))?(\s?)(g|ml)\b/gi,(m,a,mid,b,sp,u,at,str)=>{
    const after=str.slice(at+m.length,at+m.length+30);if(/^\s*(?:of\s+)?(?:\w+\s+)?(?:per|a|\/)\s*(?:litre|liter|l)\b/i.test(after))return m;
    const coffee=/^\s*(?:of\s+)?(?:ground\s+|fresh\s+)?(?:coffee|grounds)\b/i.test(after)||(!b&&Math.abs(+a-r.dose)<1e-6&&r.dose!==r.water&&!/^\s*(?:of\s+)?(?:\w+\s+)?water/i.test(after));
    const f=coffee?fd:fw;return gfmt(+a*f)+(b?mid+gfmt(+b*f):'')+sp+u}))}
// A recipe as written (sizing to your dose happens in the dial-in).
const scaled=r=>({dose:r.dose,water:r.water,steps:r.steps,off:r.off,adj:0,ratio:r.water/r.dose,on:false});
const rr1=v=>Math.round(v*10)/10;
// Steps as a timeline: the time each one starts in a badge, the instruction beside it.
// Each step also shows what kind of move it is (pour, swirl, valve…) as a small coloured icon; see steps.js.
// An untimed pour shows the time the chart estimated for it ("~1:00"), so the list and the chart agree.
const stepList=steps=>{const c=pourCurve(steps);return '<ol class="steps tl">'+steps.map((x,i)=>{const m=/^\s*(\d+:\d\d)\s*/.exec(x),k=stepKind(x),d=!m&&c&&c.dots[i];return '<li class="k-'+k+'">'+(m?'<span class="t">'+m[1]+'</span>':d&&d.e?'<span class="t est" title="Estimated from the recipe\'s pace">~'+mmss(d.t)+'</span>':'<span class="t dot"></span>')+'<i class="tk" title="'+SKNAME(k)+'">'+SKICO(k)+'</i>'+esc(capS(m?x.slice(m[0].length):x))+'</li>'}).join('')+'</ol>'};
function recipeBody(r,i,compact){const B=BREWERS[r.b],sc=compact?{dose:r.dose,water:r.water,steps:r.steps,off:r.off,ratio:r.water/r.dose}:scaled(r);const gs=MYG.map(g=>[g,settingFor(g,r.b,sc.off)]);
  const m=rmeta(r);
  return (compact?'<div class="meta"><span>'+esc(B.name)+'</span><span>'+r.dose+'g : '+r.water+'g</span>'+(r.temp?'<span>'+r.temp+'°C'+(r.temp2?' then '+r.temp2+'°C':'')+'</span>':'')+'</div>'
     :'<p class="hint" style="margin:0 0 .2rem">'+esc(B.name)+' · '+esc(B.type)+'</p>'+'<div class="rstats"><div><b>'+r.dose+'g</b><small>Coffee</small></div><div><b>'+r.water+'g</b><small>Water</small></div><div><b>'+(m.ratio||'–')+'</b><small>Ratio</small></div>'+
       '<div><b>'+(r.temp?r.temp+'°C':'–')+'</b><small>'+(r.temp2?'Then '+r.temp2+'°C':'Water')+'</small></div><div><b>'+(m.time!=null?mmss(m.time):'By eye')+'</b><small>Total time</small></div><div><b>'+m.level+'</b><small>'+m.pours+' pour'+(m.pours===1?'':'s')+'</small></div></div>')+
   '<div class="meta">'+gs.map(([g,v])=>'<span>'+esc(v!=null?gLabel(g,v):gname(g)+': n/a')+'</span>').join('')+'</div>'+
   (r.why?'<p>'+esc(r.why)+'</p>':'')+(compact?'<details class="rsteps"><summary>Steps ('+r.steps.length+')</summary>':'')+(compact?'':pourGraph(sc.steps,sc.water))+stepList(sc.steps)+(r.tip?'<p class="hint">'+esc(r.tip)+'</p>':'')+(compact?'</details>':'')+
   '<div class="actions">'+(B.model?'<button class="btn" data-load="'+i+'">Brew in the dial-in</button><button class="btn ghost" data-timer="'+i+'">Start timer</button>':'<button class="btn" data-timer="'+i+'">Start timer</button>')+'<button class="btn ghost" data-rshare="'+i+'">Share</button>'+(r.custom?'<button class="btn ghost" data-redit="'+esc(r.id)+'">Edit</button>':'')+'</div>'}
let RF='all',RQ='',RLIST=[];
// Shared logs (and so team recipes) only exist when a sync server is set up; SYNC_DB is defined further down.
const TEAM=()=>{try{return !!SYNC_DB}catch(e){return false}};
/* Favorites and recent brews, kept on this phone. A recipe's key survives app updates: its name for built-in
   recipes, its id for yours. */
const rkey=r=>r.custom?'c:'+r.id:'r:'+slug(r.name);
// Lists of recipe keys (plain strings), which load() would drop as it only keeps saved objects.
// Recipes that were the same method in another profile, dose or ratio were folded into one (the dial-in sets those);
// their old keys lead to the recipe they joined.
const RALIAS={'r:4-6-sweeter':'r:tetsu-kasuya-4-6','r:4-6-lighter-and-cleaner':'r:tetsu-kasuya-4-6','r:4-6-fuller-body':'r:tetsu-kasuya-4-6','r:mugen-small-cup':'r:mugen-one-pour',
  'r:kalita-for-darker-roasts':'r:kalita-pulse-pour','r:kalita-big-batch':'r:kalita-pulse-pour','r:ristretto':'r:classic-espresso-1-2','r:long-shot-allonge':'r:classic-espresso-1-2',
  'r:two-cup-v60':'r:the-ultimate-v60','r:chemex-for-one':'r:classic-chemex','r:ready-to-drink-cold-brew':'r:cold-brew-concentrate'};
const loadKeys=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'&&x.length<120).map(x=>RALIAS[x]||x))]:[]}catch(e){return[]}};
let FAVS=new Set(loadKeys('bb-favs'));
let RECENT=loadKeys('bb-recent').slice(0,8);
const rByKey=k=>{k=RALIAS[k]||k;return RECIPES.findIndex(r=>rkey(r)===k)};
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
/* What a recipe asks of you, worked out from its steps: how long it takes, how many pours, and how hard it is. */
const RMETA=new Map();
function rmeta(r){let m=RMETA.get(r);if(m)return m;const ts=parseSteps(r.steps).map(e=>e.t).filter(t=>t>=0),time=ts.length&&Math.max(...ts)>0?Math.max(...ts):null,
    pours=r.steps.filter(s=>/\bpour|\badd\b/i.test(s)).length,k=r.kind,type=BREWERS[r.b].type;
  const level=r.temp2||['hedrick','kh1','kh2','esp'].includes(k)||pours>=7?'Advanced':pours<=2||['single','imm'].includes(k)||['Valve and hybrid','Immersion and pressure'].includes(type)?'Easy':'Medium';
  const ratio=r.dose&&r.water?'1:'+(Math.round(r.water/r.dose*10)/10):'';
  m={time,pours,level,ratio};RMETA.set(r,m);return m}
const POUR=r=>['Cone dripper','Flat-bottom dripper'].includes(BREWERS[r.b].type)&&!ICED(r);
// Collections: ready-made shelves that cut across brewers.
const COLS=[
  ['start','Start here','Forgiving pour-overs with few steps','#5E8B6F',r=>POUR(r)&&rmeta(r).level==='Easy'],
  ['quick','Under 3 minutes','When you need coffee now','#C27A3A',r=>{const t=rmeta(r).time;return t!=null&&t<=180&&!ICED(r)&&!['esp'].includes(r.kind)}],
  ['one','One pour','Bloom, pour once, done','#3F7C93',r=>POUR(r)&&rmeta(r).pours<=2],
  ['small','One small cup','15g of coffee or less','#9C6B8E',r=>r.dose<=15&&r.water>=150],
  ['big','For sharing','450g of water or more','#7A6A3A',r=>r.water>=450],
  ['adv','Advanced','Two temperatures, fine control','#8E4A3A',r=>rmeta(r).level==='Advanced']];
const COLBY=Object.fromEntries(COLS.map(c=>[c[0],c]));
// Brewers that have recipes, in the guide's order, for the brewer shelf and the grouped list.
const RBREWERS=()=>Object.keys(BREWERS).filter(k=>RFAM(k)===k&&RECIPES.some(r=>RFAM(r.b)===k));
// A brewer family's name in the recipe library (the V60 and NEO share one shelf and one group).
const famName=k=>k==='v60'?'Hario V60 and V60 NEO':k==='sw'?'Hario Switch and NEO Switch':BREWERS[k].name;
const BT_ICON={'Cone dripper':'M5 5h14l-5 9h-4z M10 14h4 M12 14v3 M7 19h10','Flat-bottom dripper':'M5 5h14l-3 8H8z M8 13h8 M12 13v4 M7 19h10','Valve and hybrid':'M6 4h12l-4 8h-4z M10 12h4v3h-4z M7 19h10 M12 15v4',
  'Immersion and pressure':'M7 5h10v14H7z M7 5H5 M12 2v3 M9 10h6','Espresso and stovetop':'M6 10h10v3a5 5 0 0 1-10 0z M16 11h2a2 2 0 0 1 0 4h-2 M4 20h14 M9 4c-1 1.5 1 2.5 0 4 M13 4c-1 1.5 1 2.5 0 4',
  'Boiled':'M5 10h10l-1 8H6z M15 12l5-3 M8 6c-1 1 1 2 0 3','Cold':'M6 4h12l-2 16H8z M9 9h3v3H9z M12 13h3v3h-3z','Machine':'M5 3h14v6H5z M7 9v8h10V9 M9 13h6 M6 21h12'};
const bIcon=t=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(BT_ICON[t]||BT_ICON['Cone dripper'])+'"/></svg>';
function renderRHome(){const QI=(c,p)=>'<span class="qi" style="background:'+c+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+p+'"/></svg></span>';
  const again=RECENT.map(rByKey).filter(i=>i>=0).slice(0,6);
  $('rhome').innerHTML='<div class="qlinks">'+
    '<button type="button" data-q="surprise">'+QI('#2F80ED','M5 5h14v14H5z M9 9h.01 M15 9h.01 M12 12h.01 M9 15h.01 M15 15h.01')+'<span><b>Surprise me</b><small>'+(MYB.length?'A random recipe for your brewers':'Pick a random recipe')+'</small></span></button>'+
    '<button type="button" data-q="mine">'+QI('#C8741F','M4 20h4L19 9l-4-4L4 16z M13 7l4 4')+'<span><b>Your recipes</b><small>'+(CREC.length?(TEAM()?'Yours and your team’s':'Recipes you saved'):'Create your own recipe')+'</small></span>'+(CREC.length?'<span class="qn">'+CREC.length+'</span>':'')+'</button>'+
    '<button type="button" data-q="fav">'+QI('#E0445A','M12 20s-7-4.4-9-8.6C1.6 8.4 3.4 5 6.7 5c2 0 3.3 1.2 4.3 2.6C12 6.2 13.3 5 15.3 5c3.3 0 5.1 3.4 3.7 6.4C19 15.6 12 20 12 20z')+'<span><b>Favorites</b><small>'+(favCount()?'Your go-to recipes':'Tap the heart on any recipe')+'</small></span>'+(favCount()?'<span class="qn">'+favCount()+'</span>':'')+'</button></div>'+
    (again.length?'<h3 class="rh">Brew again</h3><div class="again">'+again.map(i=>'<button type="button" data-again="'+i+'"><b>'+esc(RECIPES[i].name)+'</b><small>'+esc(BREWERS[RECIPES[i].b].name)+'</small></button>').join('')+'</div>':'')+
    '<h3 class="rh">By brewer</h3><div class="bshelf">'+RBREWERS().map(k=>{const B=BREWERS[k],n=RECIPES.filter(r=>RFAM(r.b)===k).length;
      return '<button type="button" data-rb="'+k+'" aria-pressed="'+(RF==='b:'+k)+'"><span class="bi">'+bIcon(B.type)+'</span><b>'+esc(famName(k).replace(/\s*\(.*\)$/,''))+'</b><small>'+n+' recipe'+(n>1?'s':'')+'</small></button>'}).join('')+'</div>'+
    '<h3 class="rh">Collections</h3><div class="colshelf">'+COLS.map(([k,n,d,c,f])=>'<button type="button" data-col="'+k+'" aria-pressed="'+(RF==='col:'+k)+'" style="--cc:'+c+'"><b>'+esc(n)+'</b><small>'+esc(d)+'</small><span class="cn">'+RECIPES.filter(f).length+'</span></button>').join('')+'</div>'+
    '<h3 class="rh">Cup types</h3><div class="cups">'+CUPS.map(([k,n,d,g,f,ic])=>'<button type="button" class="cupcard" data-cup="'+k+'" aria-pressed="'+(RF==='cup:'+k)+'"><span class="cupart" style="--g:'+g+'">'+ic+'</span><b>'+esc(n)+'<span class="cc">'+RECIPES.filter(f).length+'</span></b><small>'+esc(d)+'</small></button>').join('')+'</div>'}
function showRecipeList(){renderRecipes();renderRHome();requestAnimationFrame(()=>$('rall').scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'}))}
$('rhome').onclick=e=>{const q=e.target.closest('[data-q]'),a=e.target.closest('[data-again]'),c=e.target.closest('[data-cup]'),bb=e.target.closest('[data-rb]'),co=e.target.closest('[data-col]');
  if(a){openRecipe(+a.dataset.again);return}
  const pick=k=>{RF=RF===k?'all':k;RQ='';$('rsearch').value='';showRecipeList()};
  if(c){pick('cup:'+c.dataset.cup);return}if(bb){pick('b:'+bb.dataset.rb);return}if(co){pick('col:'+co.dataset.col);return}
  if(!q)return;const k=q.dataset.q;
  // Surprise me draws from recipes for the brewers you have (a family counts: a V60 covers NEO recipes, a Switch its
  // immersion ones), and never repeats the last pick straight away. With no brewers set, it uses every recipe.
  if(k==='surprise'){const mine=RECIPES.map((r,i)=>i).filter(i=>MYB.some(b=>RFAM(b)===RFAM(RECIPES[i].b)));
    const all=mine.length?mine:RECIPES.map((r,i)=>i),pool=all.length>1?all.filter(i=>i!==LASTSURP):all;LASTSURP=pool[Math.floor(Math.random()*pool.length)];openRecipe(LASTSURP);
    if(!mine.length)toast(MYB.length?'No recipes for your brewers yet, so this is from all of them':'Add your brewers in Gear and Surprise me picks from those');return}
  if(k==='mine'){if(!CREC.length){openRecipeEditor(null);return}RF='mine'}
  if(k==='fav'){if(!favCount()){toast('Tap the heart on any recipe to save it here');return}RF='fav'}
  RQ='';$('rsearch').value='';showRecipeList()};
$('rsearch').oninput=e=>{RQ=e.target.value;if(RQ.trim()&&RF!=='all'){RF='all';renderRHome()}soon(renderRecipes)}; // a search looks through every recipe
let RSORT=(()=>{try{return localStorage.getItem('bb-rsort')||'brewer'}catch(e){return'brewer'}})();
const RF_NAME=()=>RF==='all'?'All recipes':RF==='fav'?'Favorites':RF==='mine'?(TEAM()?'Yours and your team’s':'Your recipes'):RF==='champ'?'Champions':RF.startsWith('cup:')?CUPBY[RF.slice(4)][1]
  :RF.startsWith('b:')&&BREWERS[RF.slice(2)]?famName(RFAM(RF.slice(2))):RF.startsWith('col:')&&COLBY[RF.slice(4)]?COLBY[RF.slice(4)][1]:'All recipes';
// One recipe as a compact row: what it is, who it's from, the numbers that matter, and a play button for the timer.
function rrow(r,i){const m=rmeta(r),lv={Easy:'e',Medium:'i',Advanced:'a'}[m.level];
  return '<article class="rrow'+(r.custom?' mine':'')+'"><button type="button" class="rr-open" data-open="'+i+'"><span class="rr-t"><b>'+esc(r.name)+'</b>'+(BTAG[r.b]?'<span class="rr-tag neo">'+BTAG[r.b]+'</span>':'')+(r.champ?'<span class="rr-tag champ">Champion</span>':'')+(r.custom?'<span class="rr-tag ours">'+esc(r.author&&r.author!==ME?'From '+r.author:'Yours')+'</span>':'')+'</span>'+
    (r.by?'<small class="rr-by">'+esc(r.by)+'</small>':'')+'<span class="rr-m"><span>'+r.dose+'g · '+r.water+'g</span>'+(m.ratio?'<span>'+m.ratio+'</span>':'')+(m.time!=null?'<span>'+mmss(m.time)+'</span>':'')+(r.temp?'<span>'+r.temp+'°C</span>':'')+'<span class="lv lv-'+lv+'">'+m.level+'</span></span></button>'+
    '<div class="rr-side">'+favBtn(r)+'<button type="button" class="rr-play" data-timer="'+i+'" aria-label="Start the timer for '+esc(r.name)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button></div></article>'}
function renderRecipes(){
  if(RF==='mine'&&!CREC.length)RF='all';if(RF==='fav'&&!favCount())RF='all';if((RF.startsWith('b:')&&!BREWERS[RF.slice(2)])||(RF.startsWith('col:')&&!COLBY[RF.slice(4)])||(RF.startsWith('cup:')&&!CUPBY[RF.slice(4)]))RF='all';
  const cup=RF.startsWith('cup:')?CUPBY[RF.slice(4)]:null,col=RF.startsWith('col:')?COLBY[RF.slice(4)]:null,rb=RF.startsWith('b:')?RF.slice(2):null,extra=cup||col||rb;
  seg('rfilter',[['all','All']].concat(extra?[[RF,esc(RF_NAME())+' ✕']]:[],favCount()?[['fav','♥ Favorites']]:[],CREC.length?[['mine',TEAM()?'Yours & team':'Yours']]:[],[['champ','Champions']]),()=>RF,v=>{RF=v===RF&&extra?'all':v;renderRecipes();renderRHome()});
  const q=fold(RQ.trim());
  let list=RECIPES.map((r,i)=>[r,i]).filter(([r])=>(RF==='all'||(RF==='mine'?r.custom:RF==='champ'?r.champ:RF==='fav'?FAVS.has(rkey(r)):cup?cup[4](r):col?col[4](r):rb?RFAM(r.b)===RFAM(rb):true))&&(!q||fold([r.name,r.by,r.why,BREWERS[r.b].name,BREWERS[r.b].type].join(' ')).includes(q)));
  const by=(a,b)=>(b[0].custom?1:0)-(a[0].custom?1:0);
  if(RSORT==='quick')list.sort((a,b)=>(rmeta(a[0]).time??1e9)-(rmeta(b[0]).time??1e9));else if(RSORT==='az')list.sort((a,b)=>a[0].name.localeCompare(b[0].name));else list.sort(by);
  RLIST=list;updShare();$('rall').textContent=RF_NAME()+' · '+list.length;
  $('rsort').value=RSORT;
  let html='';
  if(RSORT==='brewer'&&!rb){const order=Object.keys(BREWERS);const groups=new Map();for(const x of list){const k=RFAM(x[0].b);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}
    for(const k of [...groups.keys()].sort((a,b)=>order.indexOf(a)-order.indexOf(b))){const g=groups.get(k),B=BREWERS[k];
      html+='<div class="rgrp"><h4><span class="bi">'+bIcon(B.type)+'</span><span>'+esc(famName(k))+'</span><small>'+g.length+'</small></h4>'+g.map(([r,i])=>rrow(r,i)).join('')+'</div>'}}
  else html='<div class="rgrp">'+list.map(([r,i])=>rrow(r,i)).join('')+'</div>';
  $('rgrid').innerHTML=list.length?html:'<p class="hint">No recipes match. Try a shorter search, or pick All.</p>';
  if(!$('rhome').innerHTML)renderRHome();
}
$('rsort').onchange=e=>{RSORT=e.target.value;try{localStorage.setItem('bb-rsort',RSORT)}catch(x){}renderRecipes()};
function recipeAct(e){const ed=e.target.closest('[data-redit]');if(ed){openRecipeEditor(CREC.find(r=>r.id===ed.dataset.redit));return true}
  const b=e.target.closest('[data-load],[data-plan],[data-timer],[data-rshare]');if(!b)return false;if(b.dataset.rshare){openShare(recipeDoc(+b.dataset.rshare));return true}
  if(b.dataset.timer){openTimer(+b.dataset.timer);return true}
  if(b.dataset.load)loadRecipe(+b.dataset.load);else planRecipe(+b.dataset.plan);return true}
// Wrapped: a handler property that returns false cancels the tap, which kept "Steps" from opening.
$('rgrid').onclick=e=>{const o=e.target.closest('[data-open]');if(o){openRecipe(+o.dataset.open);return}recipeAct(e)};
// A recipe opened from a shared link.
function openRecipe(i){const r=RECIPES[i],B=BREWERS[r.b],d=$('vd');
  d.querySelector('#vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">\u2715</button>'+favBtn(r)+'<span class="pill"><i style="background:var(--cherry)"></i>'+esc(r.custom?(r.author?'From '+r.author:'Your recipe'):'Recipe')+'</span><h2 id="vd-title">'+esc(r.name)+'</h2>'+(r.by?'<p class="hint" style="margin:0">'+esc(r.by)+'</p>':'')+'</div>'+
   '<div class="vd-body">'+recipeBody(r,i)+'</div>';
  d.querySelector('.vd-body').onclick=e=>{if(!e.target.closest('[data-load],[data-plan],[data-timer],[data-rshare],[data-redit]'))return;const sh=e.target.closest('[data-rshare]');if(!sh)d.close();recipeAct(e)};
  $('vd-x').onclick=()=>d.close();showDlg(d);d.scrollTop=0}
function loadRecipe(i){const r=RECIPES[i];if(!r||!BREWERS[r.b].model)return;if(!sameFam(r.b,S.brewer))S.brewer=r.b;S.rec=i;S.dose=r.dose;if(!canGrind(S.grinder,r.b))S.grinder=capable(r.b);
  showTab('dial');tune('Tuned '+r.name+' for your coffee')}
const planRecipe=loadRecipe;

/* ---------- Creating, editing and sharing recipes ---------- */
// Team recipes come and go, which moves the ones after them; the dial-in keeps the same recipe by its key.
function recipesChanged(){const k=S.rec!=null&&RECIPES[S.rec]?rkey(RECIPES[S.rec]):null;syncRecipes();S.rec=k?(i=>i>=0?i:null)(rByKey(k)):null;if(S.rec==null)S.tuned=null;if(BUILT.recipes){renderRecipes();renderRHome()}render()}
function saveRecipe(r){const i=CREC.findIndex(x=>x.id===r.id);if(i>=0)CREC[i]=r;else CREC.push(r);save('bb-myrecipes',CREC);queue('put',r.id,r,'recipes');recipesChanged()}
function deleteRecipe(r){CREC=CREC.filter(x=>x.id!==r.id);save('bb-myrecipes',CREC);queue('del',r.id,null,'recipes');recipesChanged()}
// The editor: grind is set relative to each brewer's baseline, so it works on every grinder.
function openRecipeEditor(r,fresh){const isNew=!r||fresh;r=Object.assign({b:'v60',name:'',by:'',dose:15,water:250,temp:93,off:0,steps:['0:00 pour 50g, bloom.','0:45 pour to 150g.','1:30 pour to 250g.','3:00 finished.'],why:'',tip:''},r||{});
  const own=!r.author||r.author===ME,imm=!!BREWERS[r.b].of;
  // A stepper tile: the number is still typed, the buttons nudge it.
  const tile=(id,lab,unit,v,step)=>'<div class="re-tile"><label for="'+id+'">'+lab+'</label><div class="re-num"><input id="'+id+'" type="number" inputmode="decimal" value="'+v+'"><span>'+unit+'</span></div><div class="re-pms"><button type="button" class="re-pm" data-pm="'+id+'" data-d="-'+step+'" aria-label="Less '+lab.toLowerCase()+'">−</button><button type="button" class="re-pm" data-pm="'+id+'" data-d="'+step+'" aria-label="More '+lab.toLowerCase()+'">+</button></div></div>';
  const card=(n,t,body,hint)=>'<div class="re-card"><h3 class="re-h"><i>'+n+'</i>'+t+(hint?'<small>'+hint+'</small>':'')+'</h3>'+body+'</div>';
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>'+(isNew?'New recipe':'Edit recipe')+'</span><h2 id="vd-title">'+(isNew?'Create a recipe':esc(r.name))+'</h2></div>'+
   '<div class="vd-body recform re2">'+
   card(1,'The basics','<div class="field"><label for="re-name">Name</label><input id="re-name" maxlength="60" value="'+esc(r.name)+'" placeholder="e.g. Saturday V60"></div>'+
     '<div class="field"><label for="re-b">Brewer</label><select id="re-b">'+brewerOptions(Object.keys(BREWERS).filter(LISTED))+'</select></div>'+
     '<div class="field" id="re-mw" hidden><span class="lab">Method</span><div class="seg" id="re-m" role="group" aria-label="Method"><button type="button" data-m="hy">Hybrid</button><button type="button" data-m="im">Full immersion</button></div></div>')+
   card(2,'Coffee and water','<div class="re-tiles">'+tile('re-dose','Coffee','g',r.dose,0.5)+tile('re-water','Water','g',r.water,10)+tile('re-temp','Water temp','°C',r.temp,1)+'</div><p class="re-ratio" id="re-ratio"></p>')+
   card(3,'Grind','<div class="field"><label for="re-off" class="sr">Grind</label><input id="re-off" type="range" min="-3" max="3" step="0.1" value="'+(-r.off)+'"><div class="rangeends"><span>Finer</span><span id="re-offl">Brewer baseline</span><span>Coarser</span></div><div class="meta" id="re-gs"></div></div>','relative to the brewer, so it works on any grinder')+
   card(4,'Steps','<div id="re-steps"></div>','tap a kind of step to add it; times let the timer follow')+
   card(5,'The story','<div class="field"><label for="re-why">Why it works <span class="hint">optional</span></label><textarea id="re-why" rows="2" placeholder="What this recipe does differently">'+esc(r.why)+'</textarea></div>'+
     '<div class="field"><label for="re-tip">Tip <span class="hint">optional</span></label><input id="re-tip" maxlength="300" value="'+esc(r.tip)+'" placeholder="One thing to try next time"></div>'+
     '<div class="field"><label for="re-by">Credit <span class="hint">optional</span></label><input id="re-by" maxlength="60" value="'+esc(r.by)+'" placeholder="e.g. Based on Hoffmann"></div>')+
   '<div class="actions"><button class="btn" id="re-save">'+(isNew?'Save recipe':'Save changes')+'</button>'+(!isNew?'<button class="btn ghost" id="re-del">Delete</button>':'')+'</div>'+
   (GROUP&&SYNC_DB?'<p class="hint">Saved recipes are shared with your group ('+GROUP.code+').</p>':'<p class="hint">Share it from its card'+(SYNC_DB?', or start a shared log in the Log tab to share all your recipes with your team':'')+'.</p>')+'</div>';
  $('re-b').value=BREWERS[r.b].of||r.b;let method=imm?'im':'hy';
  const SE=stepEditor($('re-steps'),r.steps,{water:r.water,dose:r.dose});
  // The Switch and the NEO Switch brew as a hybrid or as a full immersion (its own grind baseline).
  const bOf=()=>{const b=$('re-b').value;return method==='im'&&METHODS(b).length?METHODS(b)[0]:method==='im'&&b==='swneo'?'swi':b};
  const meth=()=>{const b=$('re-b').value,has=METHODS(b).length>0||b==='swneo';$('re-mw').hidden=!has;$('re-m').querySelectorAll('[data-m]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.m===method))};
  const gs=()=>{const off=-(+$('re-off').value),b=bOf();$('re-offl').textContent=off===0?'Brewer baseline':(Math.abs(off).toFixed(1)+(off>0?' steps finer':' steps coarser'));
    $('re-gs').innerHTML=MYG.map(g=>{const v=settingFor(g,b,off);return '<span>'+esc(v!=null?gLabel(g,v):gname(g)+': n/a')+'</span>'}).join('')};
  const ratio=()=>{const d=+$('re-dose').value,w=+$('re-water').value;$('re-ratio').innerHTML=d>0&&w>0?'Ratio <b>1:'+rr1(w/d)+'</b>':'';SE.set({water:w>0?w:250,dose:d>0?d:15})};
  $('re-off').oninput=gs;$('re-b').onchange=()=>{meth();gs()};$('re-m').onclick=e=>{const x=e.target.closest('[data-m]');if(!x)return;method=x.dataset.m;meth();gs()};meth();gs();ratio();
  $('re-dose').oninput=$('re-water').oninput=ratio;
  document.querySelectorAll('.re-pm').forEach(x=>x.onclick=()=>{const i=$(x.dataset.pm),v=(+i.value||0)+(+x.dataset.d);i.value=Math.max(0,Math.round(v*10)/10);i.dispatchEvent(new Event('input'))});
  $('re-save').onclick=()=>{const n=sanRec({id:isNew?undefined:r.id,b:bOf(),name:$('re-name').value,by:$('re-by').value,author:isNew?(ME||''):r.author,dose:+$('re-dose').value,water:+$('re-water').value,temp:+$('re-temp').value,off:-(+$('re-off').value),
      steps:SE.value(),why:$('re-why').value,tip:$('re-tip').value,ts:isNew?Date.now():r.ts,kind:r.kind});
    if(!n){toast('Give the recipe a name');$('re-name').focus();return}saveRecipe(n);$('vd').close();RF='mine';if(BUILT.recipes)renderRecipes();showTab('recipes');toast(isNew?'Recipe saved':'Recipe updated')};
  if(!isNew)$('re-del').onclick=()=>{if(!confirm(own?'Delete this recipe?':'Delete '+r.author+'’s recipe for everyone?'))return;deleteRecipe(r);$('vd').close();toast('Recipe deleted')};
  const d=$('vd');showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}
$('r-new').onclick=()=>openRecipeEditor(null);
// Save the current dial-in as a starting recipe.
$('tosave').onclick=()=>{const dp=dialPlan();
  if(dp){const off=Math.round(stepsBetween(S.grinder,baseX(S.grinder,S.brewer),S.setting)*10)/10;
    openRecipeEditor({b:S.brewer,name:'My '+dp.r.name+(S.goal!=='balance'?' ('+goalLabel(S.goal,S.amt).toLowerCase()+')':''),by:'Adapted from '+(dp.r.by||dp.r.name),dose:S.dose,water:dp.water,temp:S.temp,off,steps:dp.steps.slice(),
      why:goalLabel(S.goal,S.amt)+' cup for '+PROCESSES[S.process].name.toLowerCase()+' '+vName(S.variety)+', '+S.roast+' roast.',tip:dp.r.tip||''},true);return}
  const B=BREWERS[S.brewer],dose=B.ratio.ref<5?18:B.ratio.ref<10?20:15,water=Math.round(dose*S.ratio),bloom=Math.round(dose*2.5);
  const off=Math.round(stepsBetween(S.grinder,baseX(S.grinder,S.brewer),S.setting)*10)/10;
  openRecipeEditor({b:S.brewer,name:'My '+B.name+' recipe',dose,water,temp:S.temp,off,steps:['0:00 pour '+bloom+'g, bloom.',mmss(S.bloom)+' pour to '+Math.round(water*0.6)+'g.',mmss(Math.max(90,S.bloom+45))+' pour to '+water+'g.',mmss(Math.max(180,S.bloom+135))+' finished.'],why:PROCESSES[S.process].name+' '+vName(S.variety)+', '+S.roast+' roast.'},true)};
// Share links carry the recipe itself, so anyone can add it with one tap.
const b64u={enc:o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),dec:s=>JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))))};
function recipeLink(r){const {id,custom,ts,...rest}=r;return SITE_URL+'#recipe='+b64u.enc(rest)}
/* Every share carries a link that opens the same thing in the app on the other phone. */
const slug=s=>String(s).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const chKey=ch=>ch.c+'-'+ch.y;
// The recipes in view (a brewer, a collection or a search) as one shareable list: the essentials of each, with a link.
const rListed=()=>(RF!=='all'||RQ.trim())&&RLIST.length>0;
function recipesDoc(){const max=30,list=RLIST.slice(0,max),title=RQ.trim()?'Recipes: \u201c'+RQ.trim()+'\u201d':RF_NAME();
  const blocks=list.map(([r,i])=>{const B=BREWERS[r.b],kv=[['Brewer',B.name],['Dose : water',r.dose+'g : '+r.water+'g (1:'+rr1(r.water/r.dose)+')']];
    if(r.temp)kv.push(['Water',r.temp+'°C'+(r.temp2?', then about '+r.temp2+'°C':'')]);
    for(const g of MYG){const v=settingFor(g,r.b,r.off);if(v!=null)kv.push([gname(g),dial(g,v)])}
    kv.push(['Steps and details',recipeHref(i)]);return{h:r.name+(r.by?' ('+r.by+')':''),kv}});
  if(RLIST.length>max)blocks.push({p:'And '+(RLIST.length-max)+' more in The Brew Bench.'});
  return{title,sub:RLIST.length+' recipe'+(RLIST.length>1?'s':''),blocks,link:SITE_URL+'#recipes',file:'recipes-'+title}}
function recipeHref(i){const r=RECIPES[i];return r.custom?recipeLink(r):r.champ?SITE_URL+'#c='+chKey(r.champ):SITE_URL+'#r='+slug(r.name)}
// A brew from the dial-in: the grind travels as steps from the brewer's baseline, so it lands right on any grinder.
function brewHref(){const off=Math.round(stepsBetween(S.grinder,baseX(S.grinder,S.brewer),S.setting)*10)/10;
  const rc=dialRec();return SITE_URL+'#brew='+b64u.enc(Object.assign({b:S.brewer,g:S.grinder,c:S.setting,off,t:S.temp,r:S.ratio,bl:S.bloom,a:S.agit,ro:S.roast,p:S.process,v:S.variety},rc&&!rc.custom?{rt:slug(rc.name),d:S.dose,go:S.goal,am:S.amt,age:S.age}:{}))}
function planHref(c){const r=RECIPES[c.tech];if(r&&r.custom)return recipeLink(r);
  return SITE_URL+'#plan='+b64u.enc({b:c.brewer,t:r?slug(r.name):'',p:c.process,v:c.variety,ro:c.roast,age:c.age,goal:c.goal,am:c.amt,d:c.dose})}
const ROASTS=['light','medium','dark'];
function goTab(id){try{history.replaceState(null,'','#'+id)}catch(e){}showTab(id,true)}
function openBrewLink(code){let x;try{x=b64u.dec(code)}catch(e){}goTab('dial');
  if(!x||!BREWERS[x.b]||!BREWERS[x.b].model){toast('That brew link looks broken');return}
  const b=x.b,g=MYG.includes(x.g)&&canGrind(x.g,b)?x.g:canGrind(S.grinder,b)?S.grinder:capable(b);
  S.brewer=b;S.grinder=g;S.setting=g===x.g&&Number.isFinite(+x.c)?roundG(g,+x.c):roundG(g,shift(g,baseX(g,b),-num(x.off,0,-6,6)*160));
  S.temp=num(x.t,S.temp);S.ratio=num(x.r,S.ratio);S.bloom=num(x.bl,S.bloom);fitRanges();S.rec=null;
  if(['low','med','high'].includes(x.a))S.agit=x.a;if(ROASTS.includes(x.ro))S.roast=x.ro;if(PROCESSES[x.p])S.process=x.p;if(typeof x.v==='string'&&vById(x.v))S.variety=x.v;
  // A brew shared with its recipe brings the recipe, dose and target too, with the sender's exact settings.
  const t=x.rt&&techList(b).find(([r])=>slug(r.name)===x.rt);S.tuned=null;
  if(t){S.rec=t[1];S.dose=num(x.d,t[0].dose,3,120);S.goal=goalOf(x.go);S.amt=amtOf(x.am);S.age=Math.round(num(x.age,S.age,0,90));S.tuned=Object.fromEntries(TUNED_KEYS.map(k=>[k,S[k]]))}
  render();toast('Opened the shared brew'+(g!==x.g&&GRINDERS[x.g]?', converted to your '+gname(g):''))}
function openPlanLink(code){let x;try{x=b64u.dec(code)}catch(e){}goTab('dial');
  if(!x||!PBREWERS.includes(x.b)){toast('That brew link looks broken');return}
  // The sender's brewer stays, even when the recipe was written for its family twin (a NEO recipe on a V60).
  const t=techList(x.b).find(([r])=>slug(r.name)===x.t)||techList(x.b)[0];S.brewer=sameFam(t[0].b,x.b)?x.b:t[0].b;S.rec=t[1];
  if(PROCESSES[x.p])S.process=x.p;if(typeof x.v==='string'&&vById(x.v))S.variety=x.v;if(ROASTS.includes(x.ro))S.roast=x.ro;S.age=Math.round(num(x.age,S.age,0,90));S.goal=goalOf(x.goal);S.amt=amtOf(x.am);S.dose=num(x.d,t[0].dose,3,120);
  if(!canGrind(S.grinder,S.brewer))S.grinder=capable(S.brewer);tune('Opened the shared brew')}
// Opens whatever a link points at. Returns false for plain tab links.
function openRoute(h){let m;try{h=decodeURIComponent(h)}catch(e){}
  const gone=()=>toast('That link points to something that isn\u2019t in this version of the app');
  if((m=/^recipe=([A-Za-z0-9_-]+)$/.exec(h))){goTab('recipes');importRecipe(m[1]);return true}
  if((m=/^r=([a-z0-9-]+)$/.exec(h))){goTab('recipes');const i=RECIPES.findIndex((r,k)=>k<BUILTIN_N&&slug(r.name)===m[1]);if(i>=0)openRecipe(i);else toast('That recipe isn\u2019t in this version of the app');return true}
  if((m=/^c=([a-z]+)-(\d{4})$/.exec(h))){goTab('champs');const ch=CHAMPS.find(x=>x.c===m[1]&&x.y===+m[2]);if(ch&&ch.rec)openChamp(ch);else if(!ch)gone();return true}
  if((m=/^k=([a-z0-9-]+)$/.exec(h))){const g=GLOSSARY.find(x=>slug(x[0])===m[1]);goTab('words');if(g)openWord(g[0]);else gone();return true}
  if((m=/^v=([\w-]+)$/.exec(h))){goTab('variety');if(VBY[m[1]])openVariety(m[1]);else gone();return true}
  if((m=/^o=([\w-]+)$/.exec(h))){goTab('map');if(ALLO()[m[1]])selectOrigin(m[1],true);else gone();return true}
  if((m=/^brew=([A-Za-z0-9_-]+)$/.exec(h))){openBrewLink(m[1]);return true}
  if((m=/^plan=([A-Za-z0-9_-]+)$/.exec(h))){openPlanLink(m[1]);return true}
  if((m=/^join=([A-Za-z0-9-]{8,9})$/.exec(h))){JOIN_CODE=m[1].toUpperCase();goTab('log');if(!SYNC_DB)toast('Shared logs aren\u2019t switched on in this version of the app');else if(!GROUP)toast('Add your name and tap Join');else if(GROUP.code!==JOIN_CODE)toast('You are already in a shared log. Leave it first to join this one.');renderLog();return true}
  // A shared link that got cut off or mangled on the way (chat apps sometimes do this) still says so.
  if(/^(recipe|brew|plan|join|[rcvok])=/.test(h))toast('That link looks broken or incomplete. Ask for it to be sent again.');
  return false}
function importRecipe(code){let r;try{r=sanRec(b64u.dec(code))}catch(e){r=null}if(!r){toast('That recipe link looks broken');return}
  r.id='r'+Date.now().toString(36);r.ts=Date.now();const B=BREWERS[r.b];
  $('vd-in').innerHTML='<div class="vd-head" style="--c:var(--cherry)"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:var(--cherry)"></i>Shared recipe'+(r.author?' from '+esc(r.author):'')+'</span><h2 id="vd-title">'+esc(r.name)+'</h2>'+
   '<div class="meta"><span>'+esc(B.name)+'</span><span>'+r.dose+'g : '+r.water+'g</span>'+(r.temp?'<span>'+r.temp+'°C</span>':'')+'</div></div><div class="vd-body">'+(r.why?'<p>'+esc(r.why)+'</p>':'')+stepList(r.steps)+(r.tip?'<p class="hint">'+esc(r.tip)+'</p>':'')+
   '<div class="meta">'+MYG.map(g=>{const v=settingFor(g,r.b,r.off);return '<span>'+esc(v!=null?gLabel(g,v):gname(g)+': n/a')+'</span>'}).join('')+'</div>'+
   '<div class="actions"><button class="btn" id="imp-add">Add to my recipes</button><button class="btn ghost" id="imp-no">Not now</button></div></div>';
  const d=$('vd');showDlg(d);d.scrollTop=0;$('vd-x').onclick=$('imp-no').onclick=()=>d.close();
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
let GDIAL=null;
function renderMyGrinders(){if(!MYG.includes(GDIAL))GDIAL=MYG[0];
  seg('gear-dialpick',MYG.length>1?MYG.map(g=>[g,esc(gname(g))]):[],()=>GDIAL,v=>{GDIAL=v;renderMyGrinders()});
  $('gear-grinders').innerHTML=MYG.map(g=>{const G=GRINDERS[g];return '<div class="card'+(g===GDIAL?' on':'')+'" data-g="'+g+'"><div class="ghead"><div><span class="hint">'+gtype(g)+'</span><h3 style="margin:.1rem 0 0">'+esc(G.full)+'</h3></div></div><svg class="dialbig" id="gd-'+g+'" viewBox="0 0 160 160" aria-hidden="true"></svg>'+
   '<input type="range" min="'+G.min+'" max="'+G.max+'" step="1" value="'+startFor(g)+'" data-gd="'+g+'" aria-label="'+esc(G.name)+' dial position"><p class="hint" id="gh-'+g+'" style="text-align:center"></p>'+specList(g)+'</div>'}).join('');
  const upd=g=>{const c=+document.querySelector('[data-gd="'+g+'"]').value;drawDial('gd-'+g,g,c);$('gh-'+g).textContent=dialHint(g,c)+nearestBrew(sizeOf(g,c))};
  $('gear-grinders').oninput=e=>{const g=e.target.dataset.gd;if(g)upd(g)};MYG.forEach(upd);
}
// "About a V60 grind": the brewer whose place on the shared scale is closest.
function nearestBrew(size){let best=null,d=1e9;for(const k of MODEL){const E=brewSize(k);if(E!=null&&Math.abs(E-size)<d){d=Math.abs(E-size);best=k}}return best&&d<140?' · about a '+BREWERS[best].name+' grind':''}
function grinderSelect(id,val,short){return '<select id="'+id+'">'+[['manual','Manual'],['electric','Electric'],['custom','Your grinders']].map(([t,l])=>{const ks=Object.keys(GRINDERS).filter(g=>t==='custom'?GRINDERS[g].custom:!GRINDERS[g].custom&&GRINDERS[g].type===t);
  return ks.length?'<optgroup label="'+l+'">'+ks.map(g=>'<option value="'+g+'"'+(g===val?' selected':'')+'>'+esc(GRINDERS[g][short?'name':'full'])+'</option>').join('')+'</optgroup>':''}).join('')+'</select>'}
let MATCH={g:null,v:'',to:null};
// A setting on grinder g as steps on grinder h: the same grind size. Calibration is how fine you like a brewer, which
// moves every grinder on it together, so it never changes how two grinders compare.
const matchSteps=(g,c,h)=>stepsFor(h,sizeOf(g,c));
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
let MYB=(()=>{try{const v=JSON.parse(localStorage.getItem('bb-mybrewers'));return Array.isArray(v)?[...new Set(v.filter(b=>typeof b==='string'&&BREWERS[b]).map(b=>BREWERS[b].of||b))]:[]}catch(e){return[]}})();
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
    else{const ks=Object.keys(BREWERS).filter(b=>LISTED(b)&&m(BREWERS[b].name+' '+BREWERS[b].type)),types=[...new Set(ks.map(b=>BREWERS[b].type))];
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
  showDlg(d);d.scrollTop=0}
const openGrinderPicker=()=>openGearPicker('grinders');
// Your kit: the grinders and brewers you own, at the top of Gear, each with a button to change them.
const KIT_IC={g:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10l-1 5H8z"/><path d="M8 9h8v6a4 4 0 0 1-8 0z"/><path d="M12 19v2"/><path d="M17 6h3"/></svg>',
  b:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16l-6 8v4h-4v-4z"/><path d="M8 21h8"/></svg>'};
function renderMyBrewers(){const el=$('gear-kit');if(!el)return;
  const row=(ic,title,sub,btn,attr,chips)=>'<div class="kit-row"><div class="kit-h"><span class="kit-ic">'+ic+'</span><div><b>'+title+'</b><small>'+sub+'</small></div><button type="button" class="btn ghost" '+attr+'>'+btn+'</button></div><div class="kit-chips">'+chips+'</div></div>';
  el.innerHTML='<h3 style="margin:0">Your kit</h3>'+
    row(KIT_IC.g,'Grinders','Settings everywhere are shown for these','Add or change','data-gpick',MYG.map(g=>'<button type="button" class="chip" data-kitg="'+g+'">'+esc(gname(g))+'</button>').join(''))+
    row(KIT_IC.b,'Brewers','Recipes and champion brews adapt to these',MYB.length?'Add or change':'Choose','data-gpick-b',MYB.length?MYB.map(b=>'<button type="button" class="chip" data-kitb="'+b+'">'+esc(BREWERS[b].name)+'</button>').join(''):'<p class="hint">None picked yet. Choose the brewers you own so recipes fit your kit.</p>');
  el.onclick=e=>{const g=e.target.closest('[data-kitg]'),b=e.target.closest('[data-kitb]');
    if(g){GDIAL=g.dataset.kitg;renderMyGrinders();$('g-dials').scrollIntoView({behavior:RM()?'auto':'smooth',block:'start'})}
    if(b){GF='all';renderGearBrewers();const c=$('gb-'+b.dataset.kitb);if(c){c.style.scrollMarginTop='16px';c.scrollIntoView({block:'start'});
      // Cards further down are laid out only when near the screen, so settle once they are, then land exactly.
      requestAnimationFrame(()=>requestAnimationFrame(()=>c.scrollIntoView({block:'start'})));c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),1400)}}}}
document.addEventListener('click',e=>{if(e.target.closest('[data-gpick-b]'))openGearPicker('brewers')});
document.addEventListener('click',e=>{if(e.target.closest('[data-gpick]'))openGrinderPicker()});
// Everything that shows grinder settings follows your grinders.
function grindersChanged(){if(!MYG.includes(S.grinder)||!canGrind(S.grinder,S.brewer)){const g=MYG.find(x=>canGrind(x,S.brewer))||capable(S.brewer);S.setting=canGrind(S.grinder,S.brewer)?convertSetting(S,g,S.brewer):base(g,S.brewer);S.grinder=g}
  if(!MYG.includes(SC.grinder))SC.grinder=MYG.find(x=>canGrind(x,SC.brewer))||capable(SC.brewer);
  render();renderScan();renderCal();if(BUILT.recipes)renderRecipes();if(BUILT.gear){renderMyGrinders();renderMyBrewers();renderMatch();renderLibrary();renderGearBrewers();renderGrindMap()}}
function renderCustomForm(){
  $('gcustom-in').innerHTML='<div class="cform"><div class="field"><label for="cg-name">Name</label><input id="cg-name" maxlength="40" placeholder="e.g. Hario Skerton Pro"></div>'+
   '<div class="two"><div class="field"><label for="cg-type">Type</label><select id="cg-type"><option value="manual">Manual</option><option value="electric">Electric</option></select></div>'+
   '<div class="field"><label for="cg-fmt">How is it set?</label><select id="cg-fmt"><option value="clicks">Clicks from fully closed</option><option value="num1">Numbered dial (1, 2, 3)</option><option value="num10">Numbered dial with 10 steps (5.6)</option><option value="num3">Numbered dial with thirds (4, 4.1, 4.2)</option><option value="rot">1Zpresso-style ring (rotation.number.click)</option></select></div></div>'+
   '<div class="two"><div class="field"><label for="cg-min">Finest setting</label><input id="cg-min" inputmode="decimal" value="0"></div><div class="field"><label for="cg-max">Coarsest setting</label><input id="cg-max" inputmode="decimal" value="40"></div></div>'+
   '<div class="two stackm"><div class="field"><label for="cg-v60">Your V60 setting</label><input id="cg-v60" inputmode="decimal" placeholder="e.g. 24"></div>'+
   '<div class="field"><label for="cg-ref">And one more you know</label><div class="joinrow"><select id="cg-reft" aria-label="Brewer for this setting"><option value="espresso">Espresso</option><option value="aeropress">AeroPress</option><option value="frenchpress" selected>French press</option></select><input id="cg-ref" inputmode="decimal" placeholder="optional"></div></div></div>'+
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
  $('gear-brewers').innerHTML=Object.entries(BREWERS).filter(([k,b])=>LISTED(k)&&(GF==='all'||b.type===GF)).map(([k,b])=>'<div class="card hovercard" id="gb-'+k+'" style="border-top:5px solid '+TYCOL[b.type]+'"><span class="hint">'+b.type+'</span><h3 style="margin-top:.2rem">'+esc(b.name)+'</h3><p>'+esc(b.desc)+'</p><p><b>How it behaves.</b> '+esc(b.how)+'</p><p><b>Best for.</b> '+esc(b.best)+'</p>'+
   '<div class="meta">'+MYG.map(g=>'<span>'+esc(canGrind(g,k)?gLabel(g,base(g,k)):gname(g)+': n/a')+'</span>').join('')+'</div>'+
   METHODS(k).map(x=>'<p class="hint" style="margin:.5rem 0 .2rem">'+esc(BREWERS[x].method)+'</p><div class="meta">'+MYG.map(g=>'<span>'+esc(canGrind(g,x)?gLabel(g,base(g,x)):gname(g)+': n/a')+'</span>').join('')+'</div>').join('')+
   '<div class="actions">'+(RECIPES.some(r=>RFAM(r.b)===RFAM(k))?'<button class="btn ghost" data-grec="'+k+'">See recipes</button>':'')+(b.model?'<button class="btn ghost" data-gdial="'+k+'">Dial it in</button>':'')+'</div></div>').join('');
}
$('gear-brewers').onclick=e=>{const a=e.target.closest('[data-grec]'),d=e.target.closest('[data-gdial]');
  if(a){RF='b:'+RFAM(a.dataset.grec);RQ='';$('rsearch').value='';showTab('recipes');showRecipeList()}
  if(d){$('i-brewer').value=d.dataset.gdial;$('i-brewer').dispatchEvent(new Event('change'));showTab('dial')}};
function renderGrindMap(){
  let h='';for(const g of MYG){const G=GRINDERS[g];const pos=c=>((c-G.min)/(G.max-G.min)*100).toFixed(2)+'%';
    // Markers closer than about one marker width go into separate lanes, so none hides another.
    const ms=Object.keys(BREWERS).filter(k=>LISTED(k)&&canGrind(g,k)).map(k=>({k,v:base(g,k)})).sort((a,b)=>a.v-b.v);
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
   (v.id!=='arabica'?'<div class="actions"><button class="btn" data-use="'+v.id+'">Brew this in the dial-in</button><button class="btn ghost" data-vshare="'+v.id+'">Share</button></div>':'')+'</div>';
  const d=$('vd');showDlg(d);d.scrollTop=0;
  $('vd-x').onclick=()=>d.close();
}
$('vd').addEventListener('click',e=>{const d=$('vd');if(e.target===d){d.close();return}
  const u=e.target.closest('[data-use]');if(u){S.variety=u.dataset.use;render();d.close();showTab('dial');toast('Variety set to '+vName(S.variety));return}
  const vs=e.target.closest('[data-vshare]');if(vs){d.close();openShare(varietyDoc(vs.dataset.vshare));return}
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
function buildMap(){mapData();
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
  if(z!=='all'){mapData();const keys=Object.keys(MAP.bbox).filter(k=>O[k]&&regionOf(k)===z);
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
  const o=ALLO()[k];if(!o)return;SEL=k;updShare();
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
// Columns of the tree, left to right: one generation of coffee each.
const TCOLS=[[20,'Wild species'],[210,'The arabica'],[395,'Where it began'],[590,'Heirlooms and lines'],[790,'Selections'],[990,'Crosses'],[1170,'Modern hybrids']];
const TTOP=56;
function drawTree(){
  const svg=$('tree');
  const pos={};for(const [id,x,y] of TREE.nodes){const lab=SHORT[id]||VBY[id].name,big=id==='arabica',h=big?32:26;
    pos[id]={x,y:y+TTOP-(big?3:1),h,w:Math.ceil(textW(lab,big?'600 13.5px':'12px'))+(big?46:40),lab,big,c:FAM[VBY[id].fam].color}}
  let W=0,H=0,defs='',e='',n='',t='';
  for(const id in pos){const p=pos[id];W=Math.max(W,p.x+p.w);H=Math.max(H,p.y+p.h)}
  for(const id in (TREE.notes||{})){const p=pos[id];if(!p)continue;const nx=p.x+p.w+10,nw=textW(TREE.notes[id],'italic 11px');W=Math.max(W,nx+nw+16);
    t+='<g class="tnote"><rect x="'+nx+'" y="'+(p.y+p.h/2-10)+'" width="'+Math.ceil(nw+16)+'" height="20" rx="6"/><text x="'+(nx+8)+'" y="'+(p.y+p.h/2+4)+'">'+esc(TREE.notes[id])+'</text></g>'}
  W=Math.ceil(W+24);H=Math.ceil(H+28);
  // Generation bands with their headings.
  let bands='';TCOLS.forEach(([x,lab],k)=>{const x0=k?x-12:0,x1=k<TCOLS.length-1?TCOLS[k+1][0]-12:W;
    bands+='<rect class="band'+(k%2?' alt':'')+'" x="'+x0+'" y="0" width="'+(x1-x0)+'" height="'+H+'"/>'+
      '<g class="th"><circle cx="'+(x+9)+'" cy="24" r="9"/><text class="thn" x="'+(x+9)+'" y="28">'+(k+1)+'</text><text x="'+(x+24)+'" y="28">'+esc(lab)+'</text></g>'});
  TREE.edges.forEach(([a,b],k)=>{const p=pos[a],c=pos[b],x1=p.x+p.w,y1=p.y+p.h/2,x2=c.x,y2=c.y+c.h/2,mx=x1+(x2-x1)*0.5;
    defs+='<linearGradient id="tg'+k+'" gradientUnits="userSpaceOnUse" x1="'+x1+'" y1="0" x2="'+x2+'" y2="0"><stop offset="0" stop-color="'+p.c+'"/><stop offset="1" stop-color="'+c.c+'"/></linearGradient>';
    e+='<path class="e" pathLength="1" style="--i:'+k+'" stroke="url(#tg'+k+')" data-a="'+a+'" data-b="'+b+'" d="M'+x1+' '+y1+' C'+mx+' '+y1+' '+mx+' '+y2+' '+x2+' '+y2+'"/>'});
  for(const id in pos){const p=pos[id],cy=p.y+p.h/2,bx=p.x+(p.big?17:15);
    n+='<g class="n'+(p.big?' big':'')+'" data-id="'+id+'" tabindex="0" role="button" aria-label="'+esc(p.lab)+'" style="--c:'+p.c+'"><rect x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="'+p.h+'" rx="'+p.h/2+'"/>'+
      // A little coffee bean in the family colour.
      '<g transform="translate('+bx+' '+cy+') rotate(-35)"><ellipse class="bean" rx="'+(p.big?7:5.6)+'" ry="'+(p.big?5:4.1)+'"/><path class="crease" d="M'+(p.big?-5.5:-4.4)+' .6Q0 -1.6 '+(p.big?5.5:4.4)+' .6"/></g>'+
      '<text x="'+(bx+(p.big?13:11))+'" y="'+(cy+(p.big?4.6:4.2))+'">'+esc(p.lab)+'</text></g>'}
  svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.style.setProperty('--tw',W+'px');
  svg.innerHTML='<defs>'+defs+'</defs>'+bands+'<g class="edges">'+e+'</g>'+t+n;
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
  $('treelegend').innerHTML=Object.values(FAM).map(f=>'<span class="pill tleg" style="--c:'+f.color+'"><i></i>'+f.name+'</span>').join('')+'<span class="pill tleg dna">Notes in italics: where DNA overturned the old story</span>';
  const box=svg.parentElement,edge=()=>{box.classList.toggle('at-start',box.scrollLeft<8);box.classList.toggle('at-end',box.scrollLeft+box.clientWidth>=box.scrollWidth-8)};box.onscroll=edge;requestAnimationFrame(edge);
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
  // Espresso ratios are written as the shot's weight in the cup, not the water that went through, so there is nothing to
  // take off for the grounds. Elsewhere the grounds hold back about twice their weight. Blooms and 4:6 pours are for filter.
  const cell=(k,v,n)=>'<div><b>'+k+'</b><span>'+v+'</span><small>'+n+'</small></div>';
  $('c-out').innerHTML=CALC.ratio<=4?cell('Shot weight',w+'g','in the cup, from '+CALC.dose+'g of coffee')+cell('Shot time','25 to 30s','from the moment the pump starts')
    :cell('Water',w+'g','about '+w+' ml')+cell('In the cup',Math.round(w-CALC.dose*2)+'g','after the grounds hold some back')+
     (CALC.ratio<10?cell('Steep','12 to 18 hours','in the fridge, then filter. Dilute to taste'):cell('Bloom water',Math.round(CALC.dose*2.5)+'g','about 2.5 times the dose')+cell('4:6 pours',Math.round(w/5)+'g','five equal pours'));
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
  const extra={muddy:S.grinder==='zp6'?'Or use a paper-filter brewer for more clarity.':'Or move to a clarity grinder like the ZP6 Special, or a paper-filter brewer.',stall:'Also pour more gently and swirl less.',harsh:'Also shorten the bloom and pour more gently.',hollow:'Or tighten the ratio by 1.',dry:'Also reduce agitation.'}[sel]||'';
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
const FIREBASE_DB_URL='https://brew-bench-default-rtdb.europe-west1.firebasedatabase.app';
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
  // No sync server set up for this copy of the app: there is nothing to join, so the card stays out of the way.
  el.hidden=!SYNC_DB;if(!SYNC_DB){el.innerHTML='';return}
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
// Editing a brew: it goes back into the form above, which saves over it. In a shared log only your own brews.
let LEDIT=null;
const canEdit=l=>!GROUP||!l.by||l.by===ME;
const LFIELDS=['l-coffee','l-settings','l-pred','l-notes'];
function editBrew(l){LEDIT=l.id;$('l-coffee').value=l.coffee||'';$('l-settings').value=l.settings||'';$('l-pred').value=l.pred||'';$('l-notes').value=l.notes||'';
  $('l-settings').dataset.brewer=l.brewer||'';STAR=+l.stars||0;LFL=flOf(l).map(x=>Array.isArray(x)?x.slice():x);renderStars();renderFlForm();
  $('l-editing').hidden=false;$('l-editing').textContent='Editing \u201c'+(l.coffee||'Untitled')+'\u201d from '+fmtDate(l);$('l-save').textContent='Update entry';$('l-cancel').hidden=false;
  $('l-form').scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'});$('l-coffee').focus({preventScroll:true})}
function endEdit(){LEDIT=null;LFIELDS.forEach(id=>$(id).value='');delete $('l-settings').dataset.brewer;STAR=0;LFL=[];renderStars();renderFlForm();
  $('l-editing').hidden=true;$('l-save').textContent='Save entry';$('l-cancel').hidden=true}
function renderLog(){renderShare();
  $('l-list').innerHTML=LOG.length?LOG.map((l,i)=>'<div class="logentry"><div class="lehead"><b>'+esc(l.coffee||'Untitled')+'</b>'+(l.stars?'<span class="stars-sm" aria-label="'+l.stars+' stars">'+'★'.repeat(+l.stars||0)+'<span>'+'★'.repeat(5-(+l.stars||0))+'</span></span>':'')+'<button class="x" data-lshare="'+i+'" aria-label="Share this brew as a card">Share</button>'+(canEdit(l)?'<button class="x" data-edit="'+i+'" aria-label="Edit entry">Edit</button>':'')+'<button class="x" data-del="'+i+'" aria-label="Delete entry">Delete</button></div>'+
    '<div class="hint">'+esc(fmtDate(l))+(l.edited?' \u00B7 edited':'')+(l.by&&GROUP?' · '+esc(l.by===ME?'you':l.by):'')+'</div>'+(l.settings?'<div class="hint">'+esc(l.settings)+'</div>':'')+(l.pred?'<div class="hint">Predicted: '+esc(l.pred)+'</div>':'')+(l.notes?'<p>'+esc(l.notes)+'</p>':'')+flEntry(l,i)+'</div>').join(''):'<p class="hint">No brews logged yet. Dial one in, then tap "Log this brew".</p>';
  renderPalate();
  const rated=LOG.filter(l=>+l.stars>0),avg=rated.length?(rated.reduce((a,l)=>a+ +l.stars,0)/rated.length).toFixed(1):'–';
  const cnt={};LOG.forEach(l=>{if(l.brewer)cnt[l.brewer]=(cnt[l.brewer]||0)+1});const fav=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
  const best=rated.slice().sort((a,b)=>b.stars-a.stars||b.ts-a.ts)[0];
  const stat=(k,v,small)=>'<div><b>'+k+'</b><span'+(String(v).length>6?' style="font-size:1rem"':'')+'>'+v+'</span>'+(small?'<small>'+small+'</small>':'')+'</div>';
  $('l-stats').innerHTML=LOG.length?stat('Brews logged',LOG.length)+stat('Average rating',avg,rated.length?'out of 5':'no ratings yet')+(fav?stat('Favourite brewer',esc(BREWERS[fav[0]]?BREWERS[fav[0]].name:fav[0])):'')+(best?stat('Top coffee',esc(best.coffee||'Untitled')):''):'';
  $('l-csv').hidden=!LOG.length;
}
// Flavour notes: a little profile wheel on each brew, and the notes as chips.
function flEntry(l,i){const fl=flOf(l);if(!fl.length)return'<button type="button" class="linkbtn fl-edit" data-fledit="'+i+'">+ Add flavour notes</button>';
  return'<div class="fl-entry"><button type="button" class="fl-mini" data-flview="'+i+'" aria-label="Open the flavour profile">'+fwStatic(fl)+'</button><div><div class="chips" style="margin:0 0 4px">'+flChips(fl)+'</div><button type="button" class="linkbtn" data-fledit="'+i+'">Edit notes</button></div></div>'}
function renderFlForm(){$('l-flchips').innerHTML=flChips(LFL);$('l-fl').querySelector('span').textContent=LFL.length?'Edit flavour notes':'Add flavour notes'}
function renderPalate(){const el=$('l-palate'),P=palate();el.hidden=!P;if(!P)return;
  el.innerHTML='<button type="button" class="fl-mini" id="pal-open" aria-label="Open your palate">'+fwStatic(P.fl)+'</button><div><h3>Your palate</h3><p class="hint" style="margin:0 0 6px">From '+P.n+(P.n===1?' brew':' brews')+' with flavour notes. You notice '+P.top.join(' and ')+' the most.</p>'+flBar(P.fl)+'<div class="chips" style="margin:0">'+flChips(P.fl.slice(0,6))+'</div></div>';
  $('pal-open').onclick=()=>openProfile('Your palate','From '+P.n+(P.n===1?' brew':' brews'),P.fl)}
$('l-fl').onclick=()=>openNotesPicker();
$('tolog').onclick=()=>{const r=compute(S),dp=dialPlan();if(LEDIT)endEdit();
  $('l-settings').value=(dp?dp.r.name+(S.goal!=='balance'?' ('+goalLabel(S.goal,S.amt).toLowerCase()+')':'')+', '+S.dose+'g : '+dp.water+'g, ':'')+gLabel(S.grinder,S.setting)+', '+BREWERS[S.brewer].name+', '+S.temp+'°C, 1:'+rr1(S.ratio)+', '+BREWERS[S.brewer].bloom.label.toLowerCase()+' '+S.bloom+'s, '+PROCESSES[S.process].name+' '+vName(S.variety);
  $('l-pred').value=verdict(r.D)[0];$('l-settings').dataset.brewer=S.brewer;LSNAP=brewSnap();
  // The coffee picked on the dial-in names the entry, and the brew comes off its bag.
  if(S.bean&&!$('l-coffee').value.trim())$('l-coffee').value=S.bean.name;showTab('log');$('l-coffee').focus()};
// The brew as it was on the dial-in, kept with the entry so its card can show the dial, the cup and the pours.
let LSNAP=null;
$('l-cancel').onclick=()=>endEdit();
$('l-save').onclick=()=>{const k=LEDIT?LOG.findIndex(x=>x.id===LEDIT):-1;
  if(k>=0){const o=LOG[k],u=Object.assign({},o,{coffee:$('l-coffee').value.trim(),settings:$('l-settings').value.trim(),stars:STAR,pred:$('l-pred').value.trim(),notes:$('l-notes').value.trim(),brewer:$('l-settings').dataset.brewer||o.brewer||'',edited:Date.now()});
    if(LFL.length)u.fl=LFL.slice();else delete u.fl;
    if(!u.coffee&&!u.settings&&!u.notes&&!LFL.length){toast('Add a coffee name or some notes first');return}
    LOG[k]=u;save('bb-log',LOG);queue('put',u.id,u);endEdit();renderLog();toast(GROUP?'Brew updated and shared':'Brew updated');return}
  if(LEDIT)endEdit();
  const e={id:uid(),ts:Date.now(),date:new Date().toLocaleDateString(),coffee:$('l-coffee').value.trim(),settings:$('l-settings').value.trim(),stars:STAR,pred:$('l-pred').value.trim(),notes:$('l-notes').value.trim(),brewer:$('l-settings').dataset.brewer||''};if(LFL.length)e.fl=LFL.slice();if(LSNAP)e.snap=LSNAP;LSNAP=null;
  if(GROUP)e.by=ME;
  if(!e.coffee&&!e.settings&&!e.notes&&!LFL.length){toast('Add a coffee name or some notes first');return}LOG.unshift(e);save('bb-log',LOG);queue('put',e.id,e);['l-coffee','l-settings','l-pred','l-notes'].forEach(id=>$(id).value='');delete $('l-settings').dataset.brewer;STAR=0;LFL=[];renderFlForm();renderStars();renderLog();toast(GROUP?'Brew saved and shared':'Brew saved');beans()};
$('l-list').onclick=e=>{const ls=e.target.closest('[data-lshare]');if(ls){const l=LOG[+ls.dataset.lshare];if(l)openShare(logEntryDoc(l));return}
  const fe=e.target.closest('[data-fledit]'),fv=e.target.closest('[data-flview]'),ed=e.target.closest('[data-edit]');
  if(ed){const l=LOG[+ed.dataset.edit];if(l&&canEdit(l))editBrew(l);return}
  if(fe){const l=LOG[+fe.dataset.fledit];if(l)openNotesPicker(l);return}
  if(fv){const l=LOG[+fv.dataset.flview];if(l)openProfile(l.coffee||'Untitled',[fmtDate(l),l.stars?l.stars+' of 5 stars':'',l.settings].filter(Boolean).join(' \u00B7 '),flOf(l),l);return}
  const b=e.target.closest('[data-del]');if(!b)return;const l=LOG[+b.dataset.del];if(!l)return;
  // One tap on Delete shouldn't lose a brew and its notes: ask first, as recipes do.
  if(!confirm(GROUP&&l.by&&l.by!==ME?'Delete '+l.by+'’s entry for everyone?':'Delete \u201c'+(l.coffee||'Untitled')+'\u201d from your log?'))return;if(LEDIT===l.id)endEdit();LOG.splice(+b.dataset.del,1);save('bb-log',LOG);queue('del',l.id);renderLog();toast('Entry deleted')};
$('l-csv').onclick=()=>{const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[['Date','Coffee','Settings','Stars','Predicted','Notes','Flavour notes']].concat(LOG.map(l=>[l.date,l.coffee,l.settings,l.stars,l.pred,l.notes,flText(flOf(l))]));
  saveFile('brew-log.csv',new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv'}))};

/* ================= SCAN ================= */
let SC=Object.assign({origin:'',process:'washed',variety:'pinkbourbon',roast:'light',date:'',brewer:'v60',grinder:'zp6',info:null,name:'',roaster:''},load('bb-scan',{}));SC.name=str(SC.name,60);SC.roaster=str(SC.roaster,50);if(!MYG.includes(SC.grinder))SC.grinder=MYG[0];
if(!PROCESSES[SC.process])SC.process='washed';if(!vById(SC.variety))SC.variety='pinkbourbon';if(!['light','medium','dark'].includes(SC.roast))SC.roast='light';if(!/^\d{4}-\d{2}-\d{2}$/.test(SC.date||''))SC.date='';SC.origin=okOrigin(SC.origin);if(!PBREWERS.includes(SC.brewer))SC.brewer='v60';
// Saved scans come from storage, a backup or another device: keep only well-formed ones, with known keys.
const okScan=x=>{if(!x||typeof x!=='object'||!x.sc||typeof x.sc!=='object')return null;const c=x.sc;
  if(!PROCESSES[c.process])c.process='washed';if(!vById(c.variety))c.variety='pinkbourbon';c.origin=okOrigin(c.origin);if(!['light','medium','dark'].includes(c.roast))c.roast='light';
  for(const k of ['name','roaster','date'])if(typeof c[k]!=='string')c[k]='';
  // The thumbnail goes into an <img>: only an inline picture is allowed.
  if(typeof x.t!=='string'||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x.t))x.t='';if(x.info&&typeof x.info!=='object')x.info=null;return x};
let SCANS=load('bb-scans',[]).map(okScan).filter(Boolean),SAMPLE=null,IMGS=null,SFILE=null,SCTL=null;
function daysSince(d){if(!d)return 14;const t=Date.parse(d);if(isNaN(t))return 14;return clamp(Math.round((Date.now()-t)/864e5),1,90)}
function initScan(){
  $('s-origin').innerHTML='<option value="">Not sure</option>'+originOptions();
  $('s-brewer').innerHTML=brewerOptions(PBREWERS);
  for(const [id,key] of [['s-origin','origin'],['s-process','process'],['s-variety','variety'],['s-brewer','brewer'],['s-date','date']])$(id).onchange=e=>{SC[key]=e.target.value;if(key==='brewer'&&!canGrind(SC.grinder,SC.brewer))SC.grinder=capable(SC.brewer);renderScan()};
  // Two ways in: the camera straight away, or a photo already on the phone. Typing or pasting the text is below.
  $('scan-pick').onclick=()=>openCamera();$('scan-choose').onclick=()=>$('scan-file').click();
  $('scan-drop').onclick=e=>{if(e.target.tagName!=='INPUT')openCamera()}; /* the hidden inputs sit inside the box, so their clicks bubble up to it */
  $('scan-cam').onchange=$('scan-file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)usePhoto(f)};
  $('scan-go').onclick=()=>runScan(true);$('scan-text-go').onclick=()=>runScan(false);$('scan-stop').onclick=()=>SCTL&&SCTL.abort();
  // Name and roastery: typed fixes show at once and update the saved scan they belong to.
  for(const [id,key,n] of [['s-name','name',60],['s-roaster','roaster',50]])$(id).oninput=e=>{SC[key]=str(e.target.value,n);const i=SCANS.findIndex(x=>x.id&&x.id===SC.id);if(i>=0){SCANS[i].sc[key]=SC[key];save('bb-scans',SCANS);renderScanList()}save('bb-scan',Object.assign({},SC));soon(renderScanHead)};
  renderScan();
}
function scanPrompt(extra){
  const ok=Object.entries({...ALLO(),...XO}).map(([k,o])=>k+'='+o.name.replace(/ \(.*\)$/,'')).join('; ');
  const pk=Object.entries(PROCESSES).map(([k,p])=>k+'='+p.name).join('; ');
  const vk=V.map(v=>v.id+'='+v.name).join('; ');
  return 'You are reading a specialty coffee bag, label or roaster card'+(extra?' (text below)':' (photo attached)')+'. Extract what is actually written; do not invent details. Then map to the allowed keys.\n\n'+
   'Allowed origin keys: '+ok+'\nAllowed process keys: '+pk+'\nAllowed variety keys: '+vk+'\n\n'+
   'Reply with ONLY one JSON object with these fields (use "" or [] or null when not shown):\n'+
   '{"roaster":"","coffee_name":"","country":"","origin_key":null,"region":"","producer_or_farm":"","altitude":"","varieties":[],"variety_key":null,"process":"","process_key":null,"roast_level":"light|medium|dark|unknown","roast_date":"YYYY-MM-DD or \\"\\"","tasting_notes":[],"summary":"one or two sentences on what to expect in the cup","confidence":"high|medium|low"}\n'+
   'Use origin_key null when the country is not in the list. Choose the closest key; for a blend of varieties pick the dominant one. If the roast date has no year, assume the most recent past date. Today is '+new Date().toISOString().slice(0,10)+'.'+(extra?'\n\nLabel text:\n'+extra.slice(0,4000):'');
}
async function runScan(useImg){
  if(!SAMPLE||(useImg&&!IMGS))return runLocalScan(useImg);
  const txt=$('scan-text').value.trim();if(!useImg&&!txt){toast('Paste the label text first');return}if(useImg&&!SFILE){toast('Take or choose a photo first');return}
  SCTL=new AbortController();$('scan-stop').hidden=false;$('scan-go').disabled=true;$('scan-drop').classList.add('scanning');$('scan-status').textContent='Reading the label\u2026 this can take up to a minute.';
  try{
    const j=await SAMPLE.json(scanPrompt(useImg?'':txt),Object.assign({signal:SCTL.signal},useImg?{images:SFILE}:{}));
    if(!j||typeof j!=='object')throw{code:'invalid_json'};
    // A country the app doesn't know leaves the origin as "not sure", never the last bag's.
    SC.origin=okOrigin(j.origin_key)||originByName(j.country);
    if(j.process_key&&PROCESSES[j.process_key])SC.process=j.process_key;
    if(j.variety_key&&VBY[j.variety_key])SC.variety=j.variety_key;
    if(['light','medium','dark'].includes(j.roast_level))SC.roast=j.roast_level;
    if(/^\d{4}-\d{2}-\d{2}$/.test(j.roast_date||''))SC.date=j.roast_date;
    SC.name=plausibleName(j.coffee_name)?niceName(j.coffee_name).slice(0,60):'';SC.roaster=plausibleName(j.roaster)?niceName(j.roaster).slice(0,50):'';
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
async function fetchProgress(url,onBytes){const res=await withTimeout(fetch(url),30000,'stalled');if(!res.ok)throw Object.assign(new Error('download'),{code:'download',detail:url.split('/').pop()+' answered '+res.status});
  const total=res.headers.get('content-encoding')?0:+res.headers.get('content-length')||0; /* compressed in transit: the length isn't the file size */if(!res.body||!res.body.getReader){await res.arrayBuffer();onBytes(total,total);return}
  const rd=res.body.getReader();let got=0;for(;;){const {done,value}=await withTimeout(rd.read(),30000,'stalled');if(done)break;got+=value.length;onBytes(got,total)}}
// What went wrong at each attempt, shown in small print under the message so a screenshot says why.
let OCR_LOG=[];const errText=e=>((e&&e.code?e.code+': ':'')+(e&&(e.detail||e.message)||String(e))).slice(0,140);
// The same reader, published online, for when the copy bundled with the app won't load on a phone.
const OCR_CDN={js:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/',core:'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/',lang:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/',blob:true};
async function startOcr(src){const core=src.core+(SIMD_OK&&!OCR_PLAIN?'tesseract-core-simd-lstm.wasm.js':'tesseract-core-lstm.wasm.js');
  if(!window.Tesseract)await loadScript(src.js+'tesseract.min.js');
  // Fetching the two big files first only shows progress in megabytes (and fills the cache). The reader loads them
  // itself either way, so a hiccup here is noted, not fatal.
  const files=[core,src.lang+'eng.traineddata.gz'],done=[0,0],size=[3.94e6,2.95e6];
  try{await Promise.all(files.map((u,k)=>fetchProgress(u,(g,t)=>{done[k]=g;size[k]=Math.max(t||size[k],g);const G=done[0]+done[1],T=size[0]+size[1];OCR_PROGRESS&&OCR_PROGRESS('download',Math.min(1,G/T),G,T)})))}
  catch(e){OCR_LOG.push('progress '+errText(e))}
  OCR_PROGRESS&&OCR_PROGRESS('start',0);
  return withTimeout(Tesseract.createWorker('eng',1,{workerPath:src.js+'worker.min.js',corePath:core,langPath:src.lang,gzip:true,workerBlobURL:!!src.blob,
    errorHandler:()=>{},logger:m=>{if(OCR_PROGRESS&&m&&typeof m.progress==='number')OCR_PROGRESS(m.status,m.progress)}}),40000,'start')}
async function ocrWorker(onProgress){OCR_PROGRESS=onProgress;
  if(!OCR){OCR_LOG=[];OCR=(async()=>{const base=new URL('vendor/ocr/',location.href).href,local={js:base,core:base,lang:base};
    try{return await startOcr(local)}catch(e){OCR_LOG.push('built-in '+errText(e));
      // Phones that can't run the faster (SIMD) reader get the plain one.
      if(SIMD_OK&&!OCR_PLAIN){OCR_PLAIN=true;try{return await startOcr(local)}catch(e2){OCR_LOG.push('plain '+errText(e2))}}
      // Last, the online copy (needs a connection).
      if(navigator.onLine!==false){OCR_PLAIN=false;try{return await startOcr(OCR_CDN)}catch(e3){OCR_LOG.push('online '+errText(e3))}}
      throw e}})().catch(e=>{OCR=null;throw e})}
  return OCR}
// Load a photo once; it is prepared (and turned, if needed) from this.
function loadImage(file){return new Promise((ok,no)=>{const img=new Image();img.onload=()=>{URL.revokeObjectURL(img.src);ok(img)};img.onerror=()=>no(new Error('image'));img.src=URL.createObjectURL(file)})}
// Grey, with the contrast stretched between the darkest and lightest 2% so faded print and shadows read cleanly.
// Light text on a dark label is flipped to dark on light, which the reader handles far better. rot turns the photo
// (for bags shot sideways); max is the long side in pixels, big enough that small print stays readable (a small
// photo is enlarged up to twice its size to get there).
function prepCanvas(img,rot=0,max=2000){const k=Math.min(2,max/Math.max(img.width,img.height)),w=Math.round(img.width*k),h=Math.round(img.height*k),side=rot%180!==0;
  const c=document.createElement('canvas');c.width=side?h:w;c.height=side?w:h;const x=c.getContext('2d');x.filter='grayscale(1)';
  x.translate(c.width/2,c.height/2);x.rotate(rot*Math.PI/180);x.drawImage(img,-w/2,-h/2,w,h);x.setTransform(1,0,0,1,0,0);x.filter='none';
  const d=x.getImageData(0,0,c.width,c.height),px=d.data,hist=new Uint32Array(256),N=px.length/4;for(let q=0;q<px.length;q+=4)hist[px[q]]++;
  // Only the brightest 0.3% is clipped: on a dark bag the light text itself is a tiny share of the photo.
  let a=0,lo=0,hi=255;for(let t=0;t<256;t++){a+=hist[t];if(a>N*.02){lo=t;break}}a=0;for(let t=255;t>=0;t--){a+=hist[t];if(a>N*.003){hi=t;break}}
  // Light text on a dark label is flipped to dark on light. Judge that from the middle of the photo, where the label
  // is, so a dark table or bag around a white sticker doesn't flip it.
  const mid=(lo+hi)/2,W=c.width,H=c.height;let dark=0,n=0;for(let y=Math.round(H*.25);y<H*.75;y+=2)for(let i=Math.round(W*.25);i<W*.75;i+=2){n++;if(px[(y*W+i)*4]<mid)dark++}
  const inv=dark>n*.5,span=Math.max(1,hi-lo);
  for(let q=0;q<px.length;q+=4){let v=(px[q]-lo)*255/span;v=v<0?0:v>255?255:v;if(inv)v=255-v;px[q]=px[q+1]=px[q+2]=v}x.putImageData(d,0,0);return c}
async function prepImage(file){return prepCanvas(await loadImage(file))}
// Uneven light (glare, a shadow across the bag): compare each pixel with its own neighbourhood instead of the whole
// photo, so text under a bright patch keeps its contrast. Works on a canvas prepared above (dark text on light).
function evenLight(c){const x=c.getContext('2d'),W=c.width,H=c.height,d=x.getImageData(0,0,W,H),px=d.data,I=new Float64Array((W+1)*(H+1)),r=Math.max(12,Math.round(Math.min(W,H)/28));
  for(let y=0;y<H;y++){let row=0;for(let i=0;i<W;i++){row+=px[(y*W+i)*4];I[(y+1)*(W+1)+i+1]=I[y*(W+1)+i+1]+row}}
  for(let y=0;y<H;y++){const y0=Math.max(0,y-r),y1=Math.min(H,y+r+1);for(let i=0;i<W;i++){const x0=Math.max(0,i-r),x1=Math.min(W,i+r+1),n=(y1-y0)*(x1-x0),
    m=(I[y1*(W+1)+x1]-I[y0*(W+1)+x1]-I[y1*(W+1)+x0]+I[y0*(W+1)+x0])/n,q=(y*W+i)*4,v=px[q]<m*.86&&m-px[q]>10?0:255;px[q]=px[q+1]=px[q+2]=v}}
  x.putImageData(d,0,0);return c}
// How useful a reading is: coffee details found count most, then the reader's own confidence.
const readScore=(info,conf)=>(info.origin_key?30:0)+(info.variety_key?25:0)+(info.process_key?25:0)+(info.roast_date?10:0)+((info.tasting_notes||[]).length?10:0)+(conf||0)/2;
// Read a label photo. If the first pass finds nothing (often a bag shot sideways or upside down), try the photo
// turned, quickly at a smaller size, and read the best way round properly.
// Each line the reader found, with its size and place as a share of the photo's width, so readings at different
// sizes can be merged and the biggest type (usually the coffee's name) picked out.
// On a tilted photo a long line's box is taller than its type, so the height is taken back by the slope of its
// baseline: the name's lines then still match in size, whatever their length.
const ocrLines=(r,c)=>(r.data.lines||[]).map(l=>{const b=l.bbox,bl=l.baseline,w=b.x1-b.x0,box=b.y1-b.y0,
  ok=bl&&bl.x1-bl.x0>w*.5,sl=ok?Math.max(-.3,Math.min(.3,(bl.y1-bl.y0)/(bl.x1-bl.x0))):0,h=Math.max(box*.45,box-Math.abs(sl)*w),
  // Its place is where it starts, at the left: lines of one column then line up even when one runs on much longer.
  y=ok?Math.max(b.y0,Math.min(b.y1-h,bl.y0+(b.x0-bl.x0)*sl-h)):b.y0;
  return{t:(l.text||'').trim(),x:b.x0/c.width,y:y/c.width,h:h/c.width,w:w/c.width,conf:l.confidence||0}}).filter(l=>l.t);
// Big headline type is often missed at full size (each letter is too large for the reader), so the photo is also read
// small. Lines only the small reading saw are added in their place.
function mergeLines(a,b){const have=fold(a.map(l=>l.t).join(' ')).replace(/[^a-z0-9]/g,'');const out=a.slice();
  for(const l of b){const k=fold(l.t).replace(/[^a-z0-9]/g,'');// Skip it when a line in the same place already reads the same (a letter or two apart). Two columns read as one
    // line ("H PROCESS: Washed") don't count, so the headline the small reading saw cleanly is kept.
    const dup=o=>{const ok=fold(o.t).replace(/[^a-z0-9]/g,'');return Math.abs(o.y-l.y)<l.h*.5&&Math.abs(o.x-l.x)<l.h&&(ok.includes(k.slice(0,Math.ceil(k.length/2)))||ok.includes(k.slice(-Math.ceil(k.length/2))))};
    if(k.length>=3&&l.conf>=55&&!have.includes(k)&&!out.some(dup))out.push(l)}
  return out.sort((p,q)=>p.y-q.y||p.x-q.x)}
// The reader's own page layout setting (one block of text), put back after any special reading.
const PSM_DEF='6';
// Where the writing is in a photo. A bag photo is mostly bag: the label's print is a fraction of the frame, and read
// at the whole photo's scale its small type is too small to read. Edges are counted in a grid on a small copy; cells
// much busier than the photo's typical cell are writing (or pattern), and the busiest group of them, with any other
// sizeable group, makes the box. vertical: the lines run up and down (a photo taken sideways).
function textBox(img){const S=Math.min(1,640/Math.max(img.width,img.height)),W=Math.max(1,Math.round(img.width*S)),H=Math.max(1,Math.round(img.height*S));
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,W,H);const px=x.getImageData(0,0,W,H).data;
  const g=new Uint8Array(W*H);for(let i=0;i<W*H;i++)g[i]=(px[i*4]*77+px[i*4+1]*150+px[i*4+2]*29)>>8;
  const E=new Uint8Array(W*H),C=12,cw=Math.ceil(W/C),ch=Math.ceil(H/C),cell=new Float32Array(cw*ch);
  for(let y=1;y<H-1;y++)for(let i=1;i<W-1;i++){const k=y*W+i,a=Math.abs(g[k+1]-g[k-1]),b=Math.abs(g[k+W]-g[k-W]);if(a+b>48){E[k]=a>=b?1:2;cell[((y/C)|0)*cw+((i/C)|0)]++}}
  const sorted=Array.from(cell).sort((a,b)=>a-b),med=sorted[sorted.length>>1],th=Math.max(C*C*.06,med*2.5);
  const on=new Uint8Array(cw*ch);for(let k=0;k<on.length;k++)if(cell[k]>th)on[k]=1;
  // Join neighbouring busy cells (letters in a word, lines in a block), then group them.
  const dil=new Uint8Array(cw*ch);for(let y=0;y<ch;y++)for(let i=0;i<cw;i++)if(on[y*cw+i])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const yy=y+dy,xx=i+dx;if(yy>=0&&yy<ch&&xx>=0&&xx<cw)dil[yy*cw+xx]=1}
  const lab=new Int32Array(cw*ch).fill(-1),groups=[];for(let k=0;k<dil.length;k++){if(!dil[k]||lab[k]>=0)continue;const gr={x0:1e9,y0:1e9,x1:-1,y1:-1,sum:0},st=[k];lab[k]=groups.length;
    while(st.length){const q=st.pop(),qy=(q/cw)|0,qx=q%cw;gr.x0=Math.min(gr.x0,qx);gr.x1=Math.max(gr.x1,qx);gr.y0=Math.min(gr.y0,qy);gr.y1=Math.max(gr.y1,qy);if(on[q])gr.sum+=cell[q];
      for(const n of [q-1,q+1,q-cw,q+cw]){if(n<0||n>=dil.length||(n===q-1&&qx===0)||(n===q+1&&qx===cw-1))continue;if(dil[n]&&lab[n]<0){lab[n]=groups.length;st.push(n)}}}groups.push(gr)}
  if(!groups.length)return null;groups.sort((a,b)=>b.sum-a.sum);const top=groups[0];let b={x0:top.x0,y0:top.y0,x1:top.x1,y1:top.y1};
  for(const gr of groups.slice(1))if(gr.sum>top.sum*.25){b.x0=Math.min(b.x0,gr.x0);b.y0=Math.min(b.y0,gr.y0);b.x1=Math.max(b.x1,gr.x1);b.y1=Math.max(b.y1,gr.y1)}
  const pad=1,X0=Math.max(0,(b.x0-pad)*C),Y0=Math.max(0,(b.y0-pad)*C),X1=Math.min(W,(b.x1+1+pad)*C),Y1=Math.min(H,(b.y1+1+pad)*C);
  // Lines of text make the row profile of edges rise and fall (line, gap, line); sideways text does it by column.
  const rows=new Float32Array(Y1-Y0),cols=new Float32Array(X1-X0);for(let y=Y0;y<Y1;y++)for(let i=X0;i<X1;i++)if(E[y*W+i]){rows[y-Y0]++;cols[i-X0]++}
  const cv=a=>{let m=0;for(const v of a)m+=v;m/=a.length||1;let d=0;for(const v of a)d+=(v-m)**2;return m?Math.sqrt(d/(a.length||1))/m:0};
  return{x:X0/S,y:Y0/S,w:(X1-X0)/S,h:(Y1-Y0)/S,vertical:cv(cols)>cv(rows)*1.25}}
function cropTo(img,b){const c=document.createElement('canvas');c.width=Math.round(b.w);c.height=Math.round(b.h);c.getContext('2d').drawImage(img,b.x,b.y,b.w,b.h,0,0,c.width,c.height);return c}
async function readLabelImage(w,file,onStatus){const photo=await loadImage(file);
  // Read the writing, not the bag: crop to it when it fills well under half the photo.
  const tb=textBox(photo),small=tb&&tb.w*tb.h<photo.width*photo.height*.5;let img=small?cropTo(photo,tb):photo;
  const read=async c=>{const r=await w.recognize(c),text=r.data.text||'',info=parseLabel(text);return{text,info,conf:r.data.confidence||0,score:readScore(info,r.data.confidence),lines:ocrLines(r,c)}};
  // Full size for the small print, then small for the headlines.
  const readBoth=async rot=>{const A=await read(prepCanvas(img,rot));let B=null;
    // Read as scattered text, so a headline beside a column of details comes back on its own.
    try{await w.setParameters({tessedit_pageseg_mode:'11'});B=await read(prepCanvas(img,rot,900))}catch(e){}finally{try{await w.setParameters({tessedit_pageseg_mode:PSM_DEF})}catch(e){}}
    if(!B)return A;const lines=mergeLines(A.lines,B.lines);
    // For picking the name, every confident line counts, even one the full-size reading also saw (it may have garbled it).
    const geo=A.lines.concat(B.lines.filter(l=>l.conf>=55&&l.t.length>=3)).sort((p,q)=>p.y-q.y||p.x-q.x);if(lines.length===A.lines.length)return Object.assign(A,{geo});
    // The details are read from the full-size text; the extra lines go after it, mostly to supply the name.
    const text=A.text+'\n'+lines.filter(l=>!A.lines.includes(l)).map(l=>l.t).join('\n'),info=parseLabel(text,geo);return{text,info,conf:A.conf,score:readScore(info,A.conf),lines,geo}};
  // A photo taken sideways is turned before reading; which way round is settled by a quick reading of each.
  let r0=0;if(tb&&tb.vertical){onStatus&&onStatus(90);let bs=-1;for(const rot of [90,270]){const r=await read(prepCanvas(img,rot,1300));if(r.score>bs){bs=r.score;r0=rot}}}
  let best=await readBoth(r0);best.rot=r0;if(best.geo)best.info=parseLabel(best.text,best.geo);
  const gaps=i=>!i.origin_key+!i.variety_key+!i.process_key;
  // Something read but details missing: try again with the light evened out, and as scattered text (labels laid out
  // in boxes and columns), then read everything found together.
  // A missing origin or process gets both extra readings. A missing variety (many bags never name one) gets only the
  // evened-out one, the cheap fix for glare washing out part of a line.
  if(gaps(best.info)&&gaps(best.info)<3){onStatus&&onStatus('more');const core=!best.info.origin_key||!best.info.process_key;
    const texts=[best.text];for(const [canvas,psm] of [[evenLight(prepCanvas(img,best.rot)),PSM_DEF],...(core?[[prepCanvas(img,best.rot),'11']]:[])]){try{if(psm!==PSM_DEF)await w.setParameters({tessedit_pageseg_mode:psm});const r=await w.recognize(canvas);texts.push(r.data.text||'')}catch(e){}finally{if(psm!==PSM_DEF)try{await w.setParameters({tessedit_pageseg_mode:PSM_DEF})}catch(e){}}}
    const both=texts.join('\n'),info=parseLabel(both,best.geo),sc=readScore(info,0);if(gaps(info)<gaps(best.info)||sc>best.score){const keep=best;best={text:both,info,score:sc,rot:keep.rot,geo:keep.geo};
      // Keep the clean first reading's name and roaster when it had them.
      if(keep.info.coffee_name)best.info.coffee_name=keep.info.coffee_name;if(keep.info.roaster)best.info.roaster=keep.info.roaster;
      // …unless the evened-out reading saw more of the same name ("Nyamas" under glare, "Nyamasheke" after).
      const ev=parseLabel(texts[1]||'').coffee_name,kn=keep.info.coffee_name;if(ev&&(!kn||(fold(ev).startsWith(fold(kn).slice(0,4))&&ev.length>kn.length)))best.info.coffee_name=ev}}
  if(!best.info.origin_key&&!best.info.variety_key&&!best.info.process_key){
    for(const rot of [90,270,180]){onStatus&&onStatus(rot);const r=await read(prepCanvas(img,rot,1300));if(r.score>best.score+8){r.rot=rot;best=r}}
    if(best.rot){const r=await readBoth(best.rot);if(r.score>=best.score){r.rot=best.rot;best=r}}}
  // The crop missed something (a roastery printed far from the label): read the whole photo too and keep the better.
  if(small&&gaps(best.info)){img=photo;const r=await readBoth(best.rot||0);r.rot=best.rot||0;if(r.geo)r.info=parseLabel(r.text,r.geo);if(gaps(r.info)<gaps(best.info)||(gaps(r.info)===gaps(best.info)&&r.score>best.score))best=r}
  return best}
const fold=t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[’']/g,"'");
const reEsc=t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Find the longest alias that appears as a whole word or phrase.
function findBest(text,entries){let best=null;for(const [alias,val] of entries){if(alias.length<3)continue;const m=new RegExp('(^|[^a-z0-9])'+reEsc(alias)+'($|[^a-z0-9])').exec(text);
  if(m&&(!best||alias.length>best.alias.length))best={alias,val,at:m.index}}return best}
// The country named first on the label (a blend lists its main origin first).
function findFirst(text,entries){const all=findAll(text,entries);return all.length?all[0]:null}
// Every alias found, in label order; where matches overlap, the longer one wins ("pink bourbon" over "bourbon").
function findAll(text,entries){const hits=[];for(const [alias,val] of entries){if(alias.length<3)continue;const re=new RegExp('(^|[^a-z0-9])('+reEsc(alias)+')(?=$|[^a-z0-9])','g');let m;
    while(m=re.exec(text)){const at=m.index+m[1].length;hits.push({alias,val,at,end:at+alias.length})}}
  hits.sort((a,b)=>a.at-b.at||b.alias.length-a.alias.length);const out=[];for(const h of hits){const o=out.find(x=>h.at<x.end&&x.at<h.end);if(!o)out.push(h);else if(h.alias.length>o.alias.length)out[out.indexOf(o)]=h}return out}
let LEX=null;
function lexicon(){if(LEX)return LEX;
  const strip=n=>fold(n).replace(/\([^)]*\)/g,' ').replace(/["“”]/g,'').replace(/\s+/g,' ').trim();
  const V_EXTRA={geisha:['geisha','gesha'],landrace:['heirloom','ethiopian landrace','ethiopian landraces','ethiopian heirloom','landrace'],jarc:['jarc','74110','74112','74158'],robusta:['robusta','canephora'],
    liberica:['liberica','excelsa'],yemenia:['yemenia','yemeni landrace'],kent:['kent','s795','s 795'],laurina:['laurina','bourbon pointu'],catuai:['catuai','red catuai','yellow catuai'],
    castillo:['castillo'],ruiru:['ruiru 11','ruiru','batian'],jackson:['jackson','mibirizi'],centroamericano:['centroamericano','h1'],bourbon:['bourbon','red bourbon','borbon','bourbon rojo','bourbon vermelho'],kona:['kona typica'],
    sl28:['sl28','sl 28','sl-28'],aji:['bourbon aji','aji bourbon','aji'],ombligon:['ombligon'],typicamejorado:['typica mejorado'],rumesudan:['rume sudan'],mokka:['mokka','maui mokka'],obata:['obata'],sl34:['sl34','sl 34','sl-34'],pinkbourbon:['pink bourbon','bourbon rosado','borbon rosado'],yellowbourbon:['yellow bourbon','bourbon amarelo','bourbon amarillo'],caturra:['caturra'],catuai:['catuai','red catuai','yellow catuai','catuai amarelo','catuai vermelho']};
  const vars=[];for(const v of V){if(v.id==='arabica')continue; /* "100% Arabica" on a bag says nothing about the variety */for(const a of (V_EXTRA[v.id]||[strip(v.name)]))vars.push([a,v.id])}
  const P_EXTRA={washed:['washed','fully washed','wet process','wet processed','lavado','lavada','lave'],doublewashed:['double washed','kenyan process','kenya process'],ecopulped:['eco pulped','eco-pulped','demucilaged'],
    natural:['natural','dry process','dry processed','sun dried','sun-dried','natural seco','secado al sol'],pulpednatural:['pulped natural','cereja descascada','descascado'],wethulled:['wet hulled','wet-hulled','giling basah'],honey:['honey','miel','honey process'],hydrohoney:['hydro honey','hydro honey process','hydro-honey','hydrohoney'],anaerobichoney:['anaerobic honey','honey anaerobic','miel anaerobico'],doubleanaerobic:['double anaerobic','doble anaerobico','double anaerobico'],mountainwater:['mountain water'],
    whitehoney:['white honey','yellow honey','miel amarilla','miel blanca'],redhoney:['red honey','miel roja'],blackhoney:['black honey','miel negra'],anaerobic:['anaerobic','anaerobico','anaerobica','anaerobio'],anaerobicnatural:['anaerobic natural','natural anaerobico','natural anaerobic'],anaerobicwashed:['anaerobic washed','lavado anaerobico'],
    carbonic:['carbonic maceration','carbonic'],lactic:['lactic'],yeast:['yeast'],koji:['koji'],extended:['extended fermentation'],thermalshock:['thermal shock'],mossto:['mossto'],
    coferment:['co-ferment','co-fermented','coferment','cofermented','co ferment'],infused:['infused'],barrelaged:['barrel aged','barrel-aged'],monsooned:['monsooned'],aged:['aged green'],
    swisswater:['swiss water'],sugarcane:['sugarcane','sugar cane','ethyl acetate','ea decaf'],co2decaf:['co2 decaf','co2 process'],mcdecaf:['methylene chloride']};
  const procs=[];for(const k in PROCESSES)for(const a of (P_EXTRA[k]||[strip(PROCESSES[k].name)]))procs.push([a,k]);
  // Roasting hubs (Japan, Australia, Oman…) are kept apart: their names are only taken from an "Origin:" line.
  const countries=[],regions=[],hubs=[];for(const [k,o] of Object.entries({...ALLO(),...XO})){const n=fold(o.name);const main=n.replace(/\(.*$/,'').trim();(o.hub?hubs:countries).push([main,k]);
    const inner=(n.match(/\(([^)]*)\)/)||[])[1];if(inner)regions.push([inner.trim(),k]);for(const r of o.subs||[])for(const part of fold(r).replace(/\([^)]*\)/g,'').split(/[:,/]/))if(part.trim())regions.push([part.trim(),k])}
  countries.push(['cote d\'ivoire','ivorycoast'],['ivory coast','ivorycoast'],['png','png'],['congo','drc'],['drc','drc'],['usa hawaii','kona']);
  const notes=new Set();for(const v of V)(v.notes||[]).forEach(n=>notes.add(fold(n)));for(const k in PROCESSES)(PROCESSES[k].notes||[]).forEach(n=>notes.add(fold(n)));
  ['chocolate','dark chocolate','milk chocolate','caramel','toffee','honey','brown sugar','molasses','vanilla','almond','hazelnut','walnut','peach','apricot','nectarine','plum','cherry','blackcurrant','blueberry','strawberry','raspberry','blackberry','grape','lemon','lime','orange','grapefruit','bergamot','mandarin','tangerine','pineapple','mango','papaya','passion fruit','lychee','guava','coconut','banana','apple','green apple','pear','jasmine','rose','hibiscus','lavender','floral','black tea','green tea','earl grey','cinnamon','clove','cardamom','nutmeg','tamarind','red wine','whisky','rum','cola','maple','date','fig','raisin','cacao','cocoa','nougat','marzipan','butterscotch','panela','sugarcane','melon','watermelon','kiwi','pomegranate','cranberry','rhubarb','sweet','juicy','bright','silky'].forEach(n=>notes.add(n));
  return LEX={vars,procs,countries,hubs,regions,notes:[...notes].filter(n=>n.length>2)}}
const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
function findDate(raw){const t=fold(raw),now=new Date(),cands=[];
  // A best-before or expiry date is never the roast date.
  const exp=at=>/\b(best\s*before|best\s*by|use\s*by|expir\w*|exp\.?|bb|consumir antes|vence)\W{0,3}$/.test(t.slice(Math.max(0,at-22),at).trim());
  const add=(y,m,d,at)=>{const yr=!!+y;y=+y;m=+m;d=+d;if(exp(at))return;if(!y)y=now.getFullYear();else if(y<100)y+=2000;if(m<1||m>12||d<1||d>31)return;let dt=new Date(y,m-1,d);if(dt>now&&!yr)dt=new Date(y-1,m-1,d); /* no year printed: assume the most recent one */
    if(dt>now||now-dt>400*864e5)return;cands.push({iso:dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'),at})};
  // The reader often takes a 0 for a 6, 8 or 9 ("2626-99-39" for 2026-09-30): an impossible date is tried with those
  // digits put back to 0, and kept only if that makes a real, recent date.
  const zeroes=v=>{const out=[v],idx=[...v].map((c,i)=>/[689]/.test(c)?i:-1).filter(i=>i>=0);for(let mask=1;mask<1<<idx.length&&mask<64;mask++){let w=[...v];idx.forEach((i,b)=>{if(mask>>b&1)w[i]='0'});out.push(w.join(''))}return out};
  const addFix=(y,mo,d,at)=>{const n=cands.length;add(y,mo,d,at);if(cands.length>n)return;
    for(const Y of zeroes(String(y)))for(const M of zeroes(String(mo)))for(const D of zeroes(String(d))){add(Y,M,D,at);if(cands.length>n)return}};
  let m;const r1=/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g;while(m=r1.exec(t))addFix(m[1],m[2],m[3],m.index);
  const r2=/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/g;while(m=r2.exec(t))add(m[3],m[2],m[1],m.index); /* day first, as on most bags */
  const mon='(jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec)[a-z]*\\.?';
  const r3=new RegExp('(\\d{1,2})(?:st|nd|rd|th)?\\s+'+mon+'(?:,?\\s+(\\d{2,4}))?','g');while(m=r3.exec(t))add(m[3]||0,MONTHS[m[2]],m[1],m.index);
  const r4=new RegExp(mon+'\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{2,4}))?','g');while(m=r4.exec(t))add(m[3]||0,MONTHS[m[1]],m[2],m.index);
  if(!cands.length)return null;const k=t.search(/roast|tostad|torrad|tueste/);if(k<0)return cands[0].iso;cands.sort((a,b)=>Math.abs(a.at-k)-Math.abs(b.at-k));return cands[0].iso}
// Turn label text into the same fields the Claude reader returns.
// OCR turns specks and logos into fragments like "i 2 ob". A real name has mostly letters and at least one proper word.
const cleanLine=x=>String(x||'').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}).]+$/gu,'').replace(/\s+/g,' ').trim()
const niceName=x=>{x=cleanLine(x);return /\p{Ll}/u.test(x)?x:x.toLowerCase().replace(/(^|[\s\-'’.&(])(\p{L})/gu,(m,a,c)=>a+c.toUpperCase())};
const scRoaster=x=>x.sc&&typeof x.sc.roaster==='string'?x.sc.roaster:(x.info&&x.info.roaster)||'';
function plausibleName(x){x=cleanLine(x);if(x.length<3||x.length>60)return false;const chars=x.replace(/\s/g,''),letters=(chars.match(/\p{L}/gu)||[]).length,words=x.split(' ');
    // Short words count against it, except the little words names are made of ("La Palma y El Tucán", "Finca de la Sierra").
  return letters/chars.length>=0.75&&words.some(w=>(w.match(/\p{L}/gu)||[]).length>=3)&&words.filter(w=>w.replace(/\W/g,'').length<=2&&!NAME_SMALL.test(w)).length<=Math.floor(words.length/2)}
const NAME_SMALL=/^(la|el|lo|le|y|e|de|da|do|di|du|del|of|no|nº|aa|ab|pb|st|sr|dr)$/i;
// Headings bags use for each detail, in English, Spanish and Portuguese ("Process: Washed", "PROCESO Lavado").
const KEYS={origin:'origin|origen|origem|country|pais|region|region de origen',variety:'varietals?|variet(?:y|ies)|variedad(?:es)?|variedades?|cultivars?',process:'process(?:ing)?|proceso|processo|beneficio|metodo',
  notes:'tasting notes|notes? de cata|notas? de cata|cup notes|cup profile|flavou?r notes|flavou?r profile|flavou?rs?|notes?|notas?|cup|profile|perfil|sabores|tastes? like|taste|in the cup|descriptors',altitude:'altitude|elevation|altura|altitud'};
function keyed(lines,key){const re=new RegExp('^\\s*(?:'+KEYS[key]+')\\b\\s*[:\\-–.]?\\s*(.+)$','i');for(const l of lines){const m=re.exec(fold(l));if(m&&m[1].trim().length>1)return{line:l,val:' '+m[1].trim()+' '}}return null}
// Close spellings for words the reader got slightly wrong ("Colombra", "Ethiopla"): one letter off, two for long words.
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 9;const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]}
function findFuzzy(text,entries){const words=[...new Set(text.match(/[a-z]{5,}/g)||[])];let best=null;
  for(const [alias,val] of entries){if(alias.length<6||/[^a-z]/.test(alias))continue;const lim=alias.length>=9?2:1;for(const w of words){if(w===alias)continue;const d=lev(w,alias);if(d<=lim&&(!best||d<best.d||(d===best.d&&alias.length>best.alias.length)))best={alias,val,d}}}return best}
// Spanish and Portuguese tasting words, shown in English.
const NOTE_EN={durazno:'peach',melocoton:'peach',pessego:'peach',mandarina:'mandarin',naranja:'orange',laranja:'orange',limon:'lemon',limao:'lemon',fresa:'strawberry',morango:'strawberry',cereza:'cherry',cereja:'cherry',
  frambuesa:'raspberry',mora:'blackberry',uva:'grape',manzana:'apple',maca:'apple',pera:'pear',pina:'pineapple',abacaxi:'pineapple',mango:'mango',maracuya:'passion fruit',maracuja:'passion fruit',
  caramelo:'caramel',chocolate:'chocolate',cacao:'cacao',miel:'honey',mel:'honey',panela:'panela',vainilla:'vanilla',baunilha:'vanilla',canela:'cinnamon',avellana:'hazelnut',almendra:'almond',nuez:'walnut',
  jazmin:'jasmine',jasmim:'jasmine',floral:'floral','frutos rojos':'red fruits','frutas vermelhas':'red fruits',te:'tea','te negro':'black tea'};
function parseLabel(raw,geo){const L=lexicon(),t=(' '+fold(raw).replace(/[|_~*]+/g,' ').replace(/[ \t]+/g,' ')+' ').replace(/\bs ?[|l1] ?(28|34|14|795)\b/g,'sl$1');const lines=String(raw).split(/\n+/).map(x=>x.trim()).filter(Boolean);const info={source:'phone'};let hits=0;
  const kO=keyed(lines,'origin'),kV=keyed(lines,'variety'),kP=keyed(lines,'process'),kN=keyed(lines,'notes');
  // A tasting note like "honey" must not decide the process, so the notes line is left out when looking for one.
  const noNotes=kN?t.replace(fold(kN.line),' '):t;
  const c=(kO&&(findFirst(kO.val,L.countries)||findFirst(kO.val,L.hubs)))||findFirst(t,L.countries)||findFuzzy(t,L.countries),r=findBest(t,L.regions);if(c){info.origin_key=c.val;hits++}else if(r){info.origin_key=r.val;hits++}
  if(r&&(!c||r.val===c.val))info.region=r.alias.replace(/\b\w/g,x=>x.toUpperCase());
  let vs=kV?findAll(kV.val,L.vars):[];if(!vs.length)vs=findAll(t,L.vars);if(!vs.length){const f=findFuzzy(t,L.vars);if(f)vs=[f]}if(vs.length){info.variety_key=vs[0].val;info.varieties=[...new Set(vs.map(x=>VBY[x.val].name.replace(/\s*\(.*$/,'')))];hits++}
  const pr=(kP&&findBest(kP.val,L.procs))||findBest(noNotes,L.procs)||findFuzzy(noNotes,L.procs)||(kN?null:findBest(t,L.procs));if(pr){info.process_key=pr.val;info.process=PROCESSES[pr.val].name;hits++}
  if(info.variety_key==='geisha'&&info.origin_key){const sub={panama:'panama',costarica:'costarica',colombia:'colombia',ethiopia:'ethiopia'}[info.origin_key];info.variety_key='geisha:'+(sub||'other')}
  const rl=/\b(light|medium|dark)(?:[- ](?:roast|roasted))?\b/.exec(t);info.roast_level=rl?rl[1]:/\bfilter\b/.test(t)?'light':/\bespresso\b/.test(t)?'medium':null;
  const d=findDate(raw);if(d){info.roast_date=d;hits++}
  const al=/(\d{1,2}[.,]?\d{3})\s*(?:-|–|—|to|a)\s*(\d{1,2}[.,]?\d{3})\s*(?:m\b|mas\S?|m\.?s\.?n\.?m\.?|msnm|meters|metres|metros)|(\d{1,2}[.,]?\d{3})\s*(?:m\b|mas\S?|m\.?s\.?n\.?m\.?|msnm|meters|metres|metros)|(?:altitude|elevation|altura|altitud)\s*:?\s*(\d{1,2}[.,]?\d{3})/.exec(t);if(al)info.altitude=(al[3]||al[4]||al[1]+' to '+al[2]).replace(/[.,]/g,',')+' m';
  let notes=[];
  // Notes from their own line, each word checked against known notes so small misreads are fixed ("Panels" → panela).
  if(kN)notes=kN.val.split(/\s*(?:,|\/|&|\+|•|·|;|\band\b|\by\b|\be\b)\s*/i).map(x=>x.replace(/[^a-z\s'-]/g,'').trim()).filter(x=>x.length>2&&x.length<30)
    .map(n=>{if(NOTE_EN[n])return NOTE_EN[n];if(L.notes.includes(n))return n;let b=null,bd=9;for(const k of L.notes){if(k.length<5)continue;const d=lev(n,k);if(d<bd){bd=d;b=k}}return b&&bd<=(n.length>=8?2:1)?b:n});
  if(!notes.length){const seen=[];for(const n of L.notes){const m=new RegExp('(^|[^a-z])'+reEsc(n)+'($|[^a-z])').exec(t);if(m)seen.push([m.index,n])}notes=seen.sort((a,b)=>a[0]-b[0]).map(x=>x[1]).filter((n,i,a)=>!a.some((o,j)=>j!==i&&o.includes(n)&&o!==n)).slice(0,5)}
  if(notes.length){info.tasting_notes=notes.slice(0,6).map(n=>n.replace(/^\w/,x=>x.toUpperCase()));hits++}
  const farm=/\b(finca|hacienda|fazenda|sitio|estate|farm|washing station|cooperative|co-?op)\b[ :]*([a-z0-9' .-]{2,40})/i.exec(raw.replace(/\n/g,' ; '));
  const prod=/\b(?:producer|produced by|grower|farmer)s?\s*[:\-]\s*([^\n;,]{2,40})/i.exec(raw);
  if(prod)info.producer_or_farm=prod[1].trim();else if(farm)info.producer_or_farm=(/^(finca|hacienda|fazenda|sitio)$/i.test(farm[1])?farm[1]+' '+farm[2]:farm[2]+' '+farm[1]).replace(/\s+/g,' ').replace(/\s*[;.].*$/,'').trim().replace(/\b\w/g,x=>x.toUpperCase());
  // Shop badges and buttons on a screenshot of a web shop are never the coffee's name.
  const BADGE=/^(limited( edition| release)?|new( arrival)?|sale|sold out|best ?sellers?|featured|exclusive|seasonal|in stock|out of stock|pre-?order|add to (cart|bag|basket)|buy now|shop now|subscribe|(coffee|product|bean) (information|info|details)|details|description|about (this|the) coffee|specifications?|overview)$/i;
  // The roastery, wherever it sits on the bag: a known roaster, "Roasted by …", a line naming one, or their web address.
  const ro=findRoaster(lines,t,geo);if(ro)info.roaster=ro.name;
  const same=x=>ro&&ro.line&&fold(x).replace(/[^a-z0-9]/g,'')===fold(ro.line).replace(/[^a-z0-9]/g,'');
  const bare=x=>{const r=fold(x).replace(/\b(specialty|speciality|single origin|coffee|cafe|beans?)\b/g,' ').replace(/\s+/g,' ').trim();return !r||L.countries.some(([c])=>c===r)};
  // Two columns often come back as one line ("Huye Mountain Roasted by"), so the roaster's part is cut off first.
  const cut=x=>cleanLine(x.replace(/\s+(?:roasted|tostado|torrado)\s+(?:by|por)\b.*$/i,''));
  const NOT_NAME=/[:@]|www\.|\.com|\d{3,}|\broast(ed|ing|ers?|ery)?\b|\bnotes?\b|\bprocess(ed|ing)?\b|\bvariet(y|al|als|ies)\b|\baltitude\b|\borigin\b|\bnet\b|\bweight\b|\bg\b|\barabica\b|\bspecialty\b|\bgrade\b/i;
  const ofRoaster=x=>ro&&(fold(x).includes(fold(ro.name))||fold(ro.name).replace(/[^a-z0-9]/g,'').includes(fold(x).replace(/[^a-z0-9]/g,'')));
  const isTitle=x=>!same(x)&&!bare(x)&&!BADGE.test(cleanLine(x))&&x.length<=60&&plausibleName(x)&&!NOT_NAME.test(x)&&!ofRoaster(x);
  // The second or third line of a name can be short on its own ("Lot 12", "AA", "No. 4").
  const isMore=x=>isTitle(x)||(/^(?:lot|no\.?|n[º°o]|#|batch)\s*\d{1,4}[a-z]?$|^(?:aa|ab|pb|aa\+?|[ivx]{1,4})$/i.test(cleanLine(x))&&!ofRoaster(x));
  // With line sizes known, a line the reader was unsure of (a logo or photo read as letters) is never the name.
  const sure=x=>!geo||geo.some(g=>g.conf>=65&&fold(cut(g.t))===fold(x));
  let title=lines.map(cut).find(x=>isTitle(x)&&sure(x));
  // With line sizes, the name is the biggest type on the bag, not the first line: bags open with taglines and logos.
  // A name set over two lines ("Huye / Mountain") is joined back up.
  if(geo&&geo.length>2){const key=x=>fold(cleanLine(x)).replace(/[^a-z0-9]/g,''),hs=[...new Map(geo.map(g=>[key(g.t),g.h])).values()].sort((a,b)=>a-b),med=hs[hs.length>>1];
    const cand=geo.map((g,k)=>({g,k,x:cut(g.t)})).filter(c=>isTitle(c.x)&&c.g.conf>=65);
    let big=cand.sort((a,b)=>b.g.h-a.g.h)[0];
    // The scattered reading can split a headline ("Finca" | "La Joya"): use the whole line read at the same place.
    // A shaky partial reading ("La Palmay E") gives way to the whole line read at the same place ("La Palma y El Tucan").
    if(big){const bk=key(big.x),whole=cand.filter(c=>Math.abs(c.g.y-big.g.y)<big.g.h*1.2&&c.g.x<big.g.x+big.g.h&&big.g.x-c.g.x<big.g.h*(key(c.x).includes(bk)?40:1)&&c.g.conf>=Math.min(big.g.conf,80)-10&&(key(c.x).includes(bk)||bk.length>=6&&key(c.x).startsWith(bk.slice(0,-2)))).sort((a,b)=>b.x.length-a.x.length)[0];if(whole)big=whole}
    // Two columns read as one line ("El Mirador Melbourne", the city from the roastery's column beside it) lose the
    // other column's words: they were also read on their own, in line with the rest of that column.
    const own=c=>{const bk=key(c.x);for(const o of geo){const ok=key(o.t);if(o.x>c.g.x+c.g.h*3&&Math.abs(o.y-c.g.y)<c.g.h*2&&ok.length>=3&&ok.length<bk.length&&bk.endsWith(ok)&&geo.some(p=>p!==o&&key(p.t)!==ok&&Math.abs(p.x-o.x)<o.h*2&&Math.abs(p.y-o.y)<o.h*4)){
      const w=c.x.split(' ');let tail='';while(w.length>1&&key(tail).length<ok.length)tail=w.pop()+' '+tail;if(key(tail)===ok)return{...c,x:cleanLine(w.join(' '))}}}return c};
    if(big)big=own(big);
    // Two columns read as one line ("Hambela COFFEE", the roastery's logo beside the name) lose the roastery's word.
    if(big&&ro){const rw=new Set(fold(ro.name).split(/[^a-z0-9]+/));const w=big.x.split(' ');while(w.length>1&&rw.has(fold(w[w.length-1]).replace(/[^a-z0-9]/g,''))&&w[w.length-1]===w[w.length-1].toUpperCase()&&w[0]!==w[0].toUpperCase())w.pop();big.x=w.join(' ')}
    // A long name is set over two or three lines of the same type ("Doña Hermilda Pacamara / Natural Anaeróbico",
    // "KIAMABARA / PEABERRY / LOT 12"), so lines just above and below in the same size and column are joined up.
    if(big&&big.g.h>=med*1.1){let gap=0;const near=(a,b)=>Math.abs(b.x-a.x)<a.h*2&&Math.abs(b.h-a.h)<a.h*.3&&b.h>=med*1.1&&b.conf>=55,block=[big];
      // The next line is the nearest row of text above or below. That row is often read twice, once cleanly and once
      // with specks ("Pink Bourbon sos si"): if any reading of it is the same size, the surest reading is used.
      const step=(from,dir)=>{const all=geo.map((g,k)=>({g,k,x:cut(g.t)})).filter(c=>{const d=(c.g.y-from.g.y)*dir;return d>from.g.h*.6&&d<from.g.h*2.3&&(!gap||Math.abs(d-gap)<gap*.4)&&Math.abs(c.g.x-from.g.x)<from.g.h*2&&c.g.conf>=55})
          .sort((a,b)=>Math.abs(a.g.y-from.g.y)-Math.abs(b.g.y-from.g.y));if(!all.length)return null;const row=all.filter(c=>Math.abs(c.g.y-all[0].g.y)<from.g.h*.4);
        return row.some(c=>near(from.g,c.g))?row.filter(c=>c.g.conf>=55&&!/,/.test(c.x)&&isMore(c.x)).sort((a,b)=>b.g.conf-a.g.conf)[0]||null:null};
      for(const dir of [1,-1]){let at=big;while(block.length<3){let n=step(at,dir);if(n)n=own(n);if(!n||block.some(b=>key(b.x)===key(n.x)||key(b.x).includes(key(n.x))||key(n.x).includes(key(b.x)))||block.map(b=>b.x).join(' ').length+n.x.length>59)break;gap=gap||Math.abs(n.g.y-at.g.y);block[dir>0?'push':'unshift'](n);at=n}}
      title=block.map(b=>b.x).join(' ')}
    // No roastery found from any clue: the small line at the very top of the bag is usually its logo.
    if(!ro){const top=geo.find(g=>g.conf>=60);const x=top&&cleanLine(top.t);if(x&&x.length<=30&&!/\d/.test(x)&&plausibleName(x)&&!bare(x)&&!(title&&key(x)===key(title))&&key(x)!==key(big?big.x:'')&&!findBest(' '+fold(x)+' ',L.countries)&&!findBest(' '+fold(x)+' ',L.procs)&&!/\b(specialty|single origin|whole bean|filter|espresso|limited|no\.?|lot)\b/i.test(x)&&top.h<(big?big.g.h:1))info.roaster=niceName(x)}}
  // No name on the label (a shop page, a back label): the farm stands in for it.
  if(!title&&info.producer_or_farm)title=info.producer_or_farm.replace(/\s+(farm|estate)$/i,'');
  // "El" before a capitalised word is often read as "gl" or "Bl" ("gl Paraiso").
  if(title)info.coffee_name=title.replace(/(^| )(?:gl|Bl|E1|EI)(?= \p{Lu})/gu,'$1El');
  info.confidence=hits>=4?'high':hits>=2?'medium':'low';info.summary=hits?'Read on this phone. Check the details below and adjust anything that looks off.':'';
  return info}
// Finding the roastery. Bags put it anywhere (top, bottom, on the back, only in the web address), so every line is
// scored and the strongest clue wins.
const RO_WORD='roasters?|roastery|roastworks|roasting(?: co(?:mpany)?)?|coffee roasting|micro ?roastery|coffee lab|coffee co\\.?|coffee company|coffee works|coffeeworks|coffee collective|kaffee(?:r[oö]sterei)?|kaffebrenneri(?:et)?|kafferosteri(?:et)?|kaffer[oø]steri(?:et)?|r[oö]sterei|torrefazione|torref[ae]c[cç][aã]o|torr[eé]facteur|tostadores?|tostaduria|brulerie';
let ROLEX=null;
function roLexicon(){if(ROLEX)return ROLEX;ROLEX=[];for(const e of (typeof ROASTERS!=='undefined'?ROASTERS:[])){const [name,...al]=e.split('|');
    for(const a of [name,...al]){const f=fold(a).replace(/&/g,' and ').replace(/[^a-z0-9%]+/g,' ').trim();if(f.replace(/[^a-z]/g,'').length>=3)ROLEX.push({name,f,c:f.replace(/[^a-z0-9%]/g,'')})}}
  ROLEX.sort((a,b)=>b.c.length-a.c.length);return ROLEX}
// Turn a web address or handle into a name: "onyxcoffeelab.com" → "Onyx Coffee Lab", "@sey.coffee" → "Sey Coffee".
const RO_PARTS=['coffeeroasters','roasters','roastery','roaster','roasting','roastworks','coffee','kaffee','kaffe','cafe','caffe','lab','company','co','collective','works','house','espresso','beans','brewers','the'];
function nameFromHandle(h){h=fold(h).replace(/^(https?:\/\/)?(www\.)?/,'').replace(/^@/,'');const m=/^([a-z0-9][a-z0-9_.\-]{1,40}?)(?:\.(com|co|net|org|coffee|cafe|shop|store|io|[a-z]{2}))?(?:\.[a-z]{2})?(?:\/.*)?$/.exec(h);if(!m)return'';
  let base=m[1].replace(/[_.\-]+/g,' ').trim();if(m[2]==='coffee'||m[2]==='cafe')base+=' '+m[2];
  // Split run-together words from the end: "onyxcoffeelab" → onyx coffee lab.
  const words=[];for(const w of base.split(' ')){let core=w,tail=[];let hit=true;while(hit&&core.length>3){hit=false;for(const p of RO_PARTS){if(core.length>p.length+2&&core.endsWith(p)){tail.unshift(p==='coffeeroasters'?'coffee roasters':p);core=core.slice(0,-p.length);hit=true;break}}}words.push(core,...tail)}
  const out=words.join(' ').replace(/\s+/g,' ').trim();if(!/[a-z]{3}/.test(out)||/^(gmail|hotmail|outlook|yahoo|icloud|instagram|facebook|shopify|google|amazon|info|hello|shop|order|orders|www)$/.test(out.split(' ')[0]))return'';
  return out.replace(/\b\w/g,x=>x.toUpperCase()).replace(/\bCo\b/,'Co.')}
function findRoaster(lines,t,geo){const clean=lines.map(cleanLine),L=lexicon(),cands=[];const add=(name,score,line)=>{name=cleanLine(name).replace(/\s+/g,' ').replace(/\b(\p{L}{4,}) (\p{L})(?= |$)/gu,(m,a,b)=>/^[ai&]$/i.test(b)?m:a+b).replace(/\s+(?:in|en|em|from|since|est\.?)\s+[\p{L}\d .'-]*$/iu,'');if(name&&(score>=100||plausibleName(name)))cands.push({name,score,line:line||''})};
  // A label word that says something about the coffee, not about who roasted it.
  const coffeeWord=x=>{const f=' '+fold(x)+' ';return /roast(ed)?\s*(on|date|level|profile)|\b(light|medium|dark|omni|filter|espresso)\s*roast|best before|net\s*w|weight|\bnotes?\b|\bprocess|\bvariet|\baltitude\s*[:\d]|\bmasl\b|\bfarm\b|\bfinca\b|single origin|specialty coffee|100 ?%|arabica/.test(f)||!!findBest(f,L.countries)||!!findBest(f,L.procs)};
  // 1. A roaster we know by name, anywhere in the text or run together in a web address.
  const flat=t.replace(/&/g,' and ').replace(/[^a-z0-9%]+/g,' ').replace(/ +/g,' '),words=flat.split(' ').filter(w=>w.length>=6);
  for(const r of roLexicon()){const hit=new RegExp('(^| )'+reEsc(r.f)+'( |$)').test(flat)||(r.c.length>=6&&words.some(w=>w.startsWith(r.c)));if(hit){const ln=clean.find(x=>fold(x).replace(/&/g,'and').replace(/[^a-z0-9%]/g,'').includes(r.c));add(r.name,100+r.c.length,ln);break}}
  // 2. "Roasted by Kawa", "Tostado por Café Pergamino", "Roaster: Rumble".
  const by=/\b(?:roasted|hand[- ]roasted|lovingly roasted|freshly roasted|roasted with care|(?:coffee\s+)?(?:sourced|imported|selected|curated|presented)|tostado|torrado|ger[oö]stet|torrefatto|torrefie)(?:\s+(?:in|en|em)\s+[\p{L} .'-]{2,30}?)?\s+(?:by|por|von|da|par)\s*:?\s*([^\n,;|•·]{2,45})/iu,lab=/^\s*(?:roaster|roastery|roasted by|tostador|torrefador|r[oö]ster(?:ei)?)\s*[:\-–]\s*(.{2,45})$/i;
  // "Roasted by" outranks "sourced" or "imported by" (an importer, or a roaster's own sourcing line) when a bag has both.
  lines.forEach((l,i)=>{let m=by.exec(l);if(m){const v=cleanLine(m[1]),sc=/sourced|imported|selected|curated|presented/i.test(m[0])?86:90;if(v.length>=3&&!coffeeWord(v))add(v,sc,l);else if(clean[i+1]&&!coffeeWord(clean[i+1]))add(clean[i+1],85,lines[i+1])}
    else if(/\b(?:roasted|sourced|imported|selected|curated|tostado|torrado)\s+(?:by|por)\s*:?\s*$/i.test(l)){
      // The name sits under "Roasted by", which in a side column may not be the next line of text read.
      const k=fold(clean[i]).replace(/[^a-z]/g,''),g=geo&&geo.find(x=>fold(x.t).replace(/[^a-z]/g,'').endsWith(k.slice(-8))),
        below=g&&geo.filter(x=>x!==g&&x.y>g.y&&x.y-g.y<g.h*3&&Math.abs(x.x-g.x)<g.h*3&&!coffeeWord(x.t)).sort((a,b)=>a.y-b.y)[0];
      if(below)add(cleanLine(below.t),88,below.t);else if(clean[i+1])add(clean[i+1],88,lines[i+1])}
    if(m=lab.exec(l))add(m[1],90,l)});
  // 3. A line that names a roastery ("Northbound Coffee Roasters", "Kafferosteriet Koppi"). A line with only the
  //    word ("COFFEE ROASTERS" under a logo) takes the name from the line above.
  const kw=new RegExp('\\b('+RO_WORD+')\\b','i'),only=new RegExp('^(?:(?:specialty|speciality|craft|small batch|independent|artisan|coffee|&|and|the)\\s+)*(?:'+RO_WORD+')(?:\\s+(?:&|and)\\s+(?:caf[eé]|coffee|bar|bakery))?(?:\\s+(?:since|est\\.?|established)\\s*\\d{4})?$','i');
  clean.forEach((x,i)=>{const f=fold(x);if(!kw.test(f)||/roast(ed)?\s*(on|date|level|profile)|\b(light|medium|dark|omni|filter|espresso)\s*roast/.test(f))return;
    if(only.test(f)){
      // The logo above it may have been read on its own, out of order: with positions, the line just above is used.
      const k=f.replace(/[^a-z]/g,''),g=geo&&geo.find(o=>fold(o.t).replace(/[^a-z]/g,'')===k),
        up=g&&geo.filter(o=>o.y<g.y&&g.y-o.y<Math.max(o.h,g.h)*1.8&&Math.abs(o.x-g.x)<Math.max(o.h,g.h)*3&&o.conf>=60).sort((a,b)=>b.y-a.y)[0],u=up&&cleanLine(up.t);
      if(u&&u.length<=30&&plausibleName(u)&&!coffeeWord(u)&&!kw.test(fold(u))){add(u+' '+x,82,up.t);return}
      const p=clean[i-1];if(p&&p.length<=30&&plausibleName(p)&&!coffeeWord(p)&&!kw.test(fold(p)))add(p+' '+x,80,lines[i-1]);else if(clean[i+1]&&clean[i+1].length<=30&&!coffeeWord(clean[i+1])&&!kw.test(fold(clean[i+1]))&&/^\p{Lu}/u.test(clean[i+1]))add(clean[i+1]+' '+x,70,lines[i+1]);return}
    // A sentence that mentions roasting ("…within 6 weeks of roasting.") is copy, not a name.
    if(x.split(' ').length<=6&&!/[.!?]\s+\p{L}/u.test(x)&&!coffeeWord(x.replace(kw,' ')))add(x.replace(/\s*(?:[-–|•·]|\best\b\.?|\bsince\b).*$/i,''),78,lines[i])});
  // 4. The web address, email or handle: "www.onyxcoffeelab.com", "hello@kurasu.kyoto", "@seycoffee". If a line spells
  //    the same name out, that line is used as written.
  const hs=String(lines.join(' ')).match(/(?:www\.|https?:\/\/)[\w.\-]+\.[a-z]{2,}|[\w.\-]+@[\w\-]+(?:\.[\w\-]+)+|@[a-z0-9_.]{3,30}|\b[a-z0-9\-]{4,}\.(?:com|coffee|cafe|co|shop)\b/gi)||[];
  for(const h of hs){const dom=h.includes('@')&&!h.startsWith('@')?h.split('@')[1]:h,n=nameFromHandle(dom);if(!n)continue;const c=fold(n).replace(/[^a-z0-9]/g,'');
    const ln=clean.find((x,i)=>{const k=fold(x).replace(/[^a-z0-9]/g,'');return k.length>=4&&(k===c||c.startsWith(k)&&k.length>=c.length*.5)&&!/[@.]/.test(lines[i])});
    if(ln&&plausibleName(ln)&&!coffeeWord(ln))add(ln,75,ln);else if(!coffeeWord(n))add(n,h.startsWith('@')?50:60,'')}
  // 5. A short line ending in "Coffee" ("Kawa Coffee", "Rumble Coffee") that is not about the beans themselves.
  clean.forEach((x,i)=>{if(/^[\p{L}&'.\- ]{2,30}\s(coffee|caf[eé]|caff[eè])$/iu.test(x)&&!coffeeWord(x)&&!findBest(' '+fold(x)+' ',L.vars)&&x.split(' ').length<=4)add(x,40,lines[i])});
  if(!cands.length)return null;cands.sort((a,b)=>b.score-a.score);const best=cands[0];
  // Names in capitals come back in normal case; a known roaster keeps its own spelling.
  return{name:best.score>=100?best.name:niceName(best.name).replace(/\s+/g,' ').slice(0,50),line:best.line}}
function applyInfo(j){SC.origin=okOrigin(j.origin_key);if(j.process_key&&PROCESSES[j.process_key])SC.process=j.process_key;
  // A label that names no variety gets plain arabica (neutral in the plan), not whatever the last bag was.
  SC.variety=j.variety_key&&vById(j.variety_key)?j.variety_key:'arabica';if(['light','medium','dark'].includes(j.roast_level))SC.roast=j.roast_level;if(/^\d{4}-\d{2}-\d{2}$/.test(j.roast_date||''))SC.date=j.roast_date;SC.name=plausibleName(j.coffee_name)?niceName(j.coffee_name).slice(0,60):'';SC.roaster=plausibleName(j.roaster)?niceName(j.roaster).slice(0,50):'';SC.info=j}
async function runLocalScan(useImg){
  const txt=$('scan-text').value.trim();if(!useImg&&!txt){toast('Paste the label text first');return}if(useImg&&!SFILE){toast('Take or choose a photo first');return}
  const st=$('scan-status'),mb=b=>(b/1e6).toFixed(1);let stop;const stopped=new Promise((_,no)=>{stop=()=>no(Object.assign(new Error('cancelled'),{code:'cancelled'}))});stopped.catch(()=>{});
  SCTL={abort:()=>stop()};$('scan-stop').hidden=!useImg;$('scan-go').disabled=true;$('scan-drop').classList.add('scanning');
  st.hidden=false;st.textContent=useImg?'Getting the text reader ready…':'Reading the text…';
  try{let text=txt,rot=0,j=null;
    if(useImg){const w=await Promise.race([ocrWorker((status,p,g,t)=>{if(SCTL.done)return;st.textContent=status==='download'?'Downloading the text reader (first time only)… '+mb(g)+' of '+mb(t)+' MB'
          :/recogniz/.test(status)?'Reading the label… '+Math.round(p*100)+'%':'Starting the text reader…'}),stopped]);
      const res=await Promise.race([withTimeout(readLabelImage(w,SFILE,k=>{if(!SCTL.done)st.textContent=k==='more'?'Looking closer for the rest of the details…':'Trying the photo the other way round…'}),180000,'slow'),stopped]);text=res.text;rot=res.rot||0;j=res.info;$('scan-text').value=text.trim()}
    // A photo's reading already chose the name and roastery from the type sizes; pasted text is read here.
    if(!j)j=parseLabel(text);if(!j.origin_key&&!j.variety_key&&!j.process_key&&!j.roast_date){st.textContent=useImg?'Couldn’t find coffee details in that photo. Try again with the label filling most of the photo, in sharp focus, or fill in the details below.':'No coffee details found in that text.';return}
    if(rot)await uprightPreview(rot);
    applyInfo(j);const found=[okOrigin(j.origin_key)&&originName(j.origin_key),j.process_key&&PROCESSES[j.process_key].name,j.variety_key&&vName(j.variety_key),j.roast_date&&'roasted '+fmtDate({date:j.roast_date})].filter(Boolean);
    st.textContent=(j.confidence==='low'?'Found a few details: ':'Label read: ')+found.join(' · ')+'. Your brew plan is below; adjust anything that looks off.';renderScan();saveScan();toast('Label read');
    // Show the result: it sits below the form, out of sight on a phone.
    setTimeout(()=>{const h=$('scan-head');if(h)scrollTo({top:h.getBoundingClientRect().top+scrollY-90,behavior:RM()?'auto':'smooth'})},250)}
  catch(e){const c=e&&e.code;st.textContent=c==='cancelled'?'Stopped.'
      :(c==='download'||c==='stalled'||!navigator.onLine)&&!NATIVE?'The text reader couldn’t download. It needs a connection the first time only; try again on Wi-Fi, or fill in the details below.'
      :c==='download'||c==='stalled'?'The text reader didn’t load on this phone. Check you’re online and try again, or paste the label text below.'
      :c==='start'?'The text reader didn’t start on this phone. Paste the label text below, or fill in the details by hand.'
      :c==='slow'?'Reading took too long. Try a closer photo of just the label, or fill in the details below.'
      :'The text reader couldn’t start. Try again, or fill in the details below.';
    // The technical reason, small, so a screenshot of this message shows what failed.
    if(c!=='cancelled'&&OCR_LOG.length)st.insertAdjacentHTML('beforeend','<small class="scan-why">Details: '+esc(OCR_LOG.join(' · '))+'</small>')}
  finally{if(SCTL)SCTL.done=true;$('scan-stop').hidden=true;$('scan-go').disabled=!SFILE;$('scan-drop').classList.remove('scanning')}}
// After a sideways photo is read, show it the right way up (the saved thumbnail follows the preview).
async function uprightPreview(rot){try{const img=await loadImage(SFILE),k=Math.min(1,1200/Math.max(img.width,img.height)),w=img.width*k,h=img.height*k,c=document.createElement('canvas'),side=rot%180!==0;
  c.width=side?h:w;c.height=side?w:h;const x=c.getContext('2d');x.translate(c.width/2,c.height/2);x.rotate(rot*Math.PI/180);x.drawImage(img,-w/2,-h/2,w,h);$('scan-prev').src=c.toDataURL('image/jpeg',.85)}catch(e){}}
function usePhoto(f){SFILE=f;if($('scan-prev').src.startsWith('blob:'))URL.revokeObjectURL($('scan-prev').src);
  $('scan-prev').src=URL.createObjectURL(f);$('scan-prev').hidden=false;$('scan-empty').hidden=true;$('scan-go').disabled=false;$('scan-again').hidden=false;$('scan-status').hidden=false;runScan(true)}
/* In-app camera. Some phones answer a file input's "use the camera" request with the gallery anyway, so the
   camera runs inside the app: a live viewfinder with a frame for the label and a shutter. If the camera can't
   start (no permission, no camera), the phone's own picker opens instead. */
let CAM=null;
async function openCamera(){
  // In the Android app the viewfinder only hands back a video frame (often 640x480), too soft for the small print on
  // a bag. The phone's own camera app takes a full-resolution, focused photo, so the app uses that.
  if(NATIVE||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){$('scan-cam').click();return}
  const d=$('vd');
  d.querySelector('#vd-in').innerHTML='<div class="cam"><div class="cam-view"><video id="cam-v" playsinline muted autoplay></video><div class="cam-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'+
    '<p class="cam-tip">Fill the frame with the label, hold steady</p><p class="cam-msg" id="cam-msg">Starting the camera…</p></div>'+
    '<div class="cam-bar"><button type="button" class="cam-side" id="cam-x" aria-label="Close camera">✕</button><button type="button" class="cam-shutter" id="cam-shot" aria-label="Take photo" disabled></button><button type="button" class="cam-side" id="cam-lib" aria-label="Choose from photos"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4"/><circle cx="15.5" cy="9" r="1.5"/></svg></button></div></div>';
  d.classList.add('camdlg');showDlg(d)
  const stop=()=>{if(CAM){CAM.getTracks().forEach(t=>t.stop());CAM=null}d.classList.remove('camdlg')};d.addEventListener('close',stop,{once:true});
  $('cam-x').onclick=()=>d.close();$('cam-lib').onclick=()=>{d.close();$('scan-file').click()};
  try{CAM=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:2560},height:{ideal:1920}}});
    if(!d.open){stop();return}const v=$('cam-v');v.srcObject=CAM;await v.play().catch(()=>{});$('cam-msg').hidden=true;$('cam-shot').disabled=false;
    // Keep refocusing as the phone moves, so small print on the label comes out sharp.
    try{const tr=CAM.getVideoTracks()[0],cap=tr.getCapabilities?tr.getCapabilities():{};if((cap.focusMode||[]).includes('continuous'))await tr.applyConstraints({advanced:[{focusMode:'continuous'}]})}catch(e){}}
  catch(e){stop();d.close();toast(e&&e.name==='NotAllowedError'?'Camera access was declined, so your photos open instead':'The camera couldn’t start, so the phone’s picker opens instead');setTimeout(()=>$('scan-cam').click(),300);return}
  $('cam-shot').onclick=async()=>{const v=$('cam-v'),b=$('cam-shot');b.disabled=true;let blob=null;
    // A full-resolution still where the phone supports it, otherwise the current video frame.
    try{if(window.ImageCapture&&CAM)blob=await new ImageCapture(CAM.getVideoTracks()[0]).takePhoto()}catch(e){blob=null}
    if(!blob){const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.92))}
    d.close();if(blob)usePhoto(new File([blob],'label.jpg',{type:blob.type||'image/jpeg'}));else toast('Couldn’t take the photo. Try again.')}}
function thumb(cb){if(!SFILE){cb('');return}const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),s=160/Math.max(img.width,img.height);c.width=img.width*s;c.height=img.height*s;c.getContext('2d').drawImage(img,0,0,c.width,c.height);try{cb(c.toDataURL('image/jpeg',.7))}catch(e){cb('')}};img.onerror=()=>cb('');img.src=$('scan-prev').src}
function saveScan(){SC.id='s'+Date.now().toString(36);const sid=SC.id;
  // A sharp copy of the photo is kept for the gallery; the list itself keeps only a small thumbnail.
  if(SFILE&&$('scan-prev').src)shrinkPhoto($('scan-prev').src,900).then(u=>BIMG.put(sid,u)).catch(()=>{});
  thumb(t=>{SCANS.unshift({id:SC.id,t,info:SC.info,sc:{origin:SC.origin,process:SC.process,variety:SC.variety,roast:SC.roast,date:SC.date,name:SC.name,roaster:SC.roaster},when:new Date().toLocaleDateString()});for(const x of SCANS.slice(12))if(x.id)BIMG.del(x.id);SCANS=SCANS.slice(0,12);save('bb-scans',SCANS);renderScanList()})}
// A saved scan reopens on the Scan page with its details.
function openSavedScan(i){const s=SCANS[i];if(!s)return;Object.assign(SC,{name:'',roaster:''},s.sc);SC.id=s.id;SC.info=s.info;if(typeof s.sc.name!=='string'&&s.info&&plausibleName(s.info.coffee_name))SC.name=niceName(s.info.coffee_name);if(typeof s.sc.roaster!=='string')SC.roaster=scRoaster(s)&&niceName(scRoaster(s));renderScan();showTab('scan')}
// Scans are listed on the Beans page.
function renderScanList(){if(window.BEANS_OK&&$('bv-scans')){renderBeanScans();renderBeanViews()}}
// What to call the coffee: its name if we have a real one, else origin and variety ("Colombia Pink Bourbon").
function scanTitle(sc,inf){const n=sc.name||(inf&&plausibleName(inf.coffee_name)?niceName(inf.coffee_name):'')||(inf&&inf.producer_or_farm)||'';const o=sc.origin?originName(sc.origin):'',v=sc.variety!=='arabica'?vName(sc.variety):'';return n||(o&&v?o+' '+v:o?o+' coffee':v||'A coffee')}
// The roastery gets its own spotlight card, with how many of their coffees you've scanned.
function renderScanHead(){const h=$('scan-head');if(!h)return;const r=SC.roaster,n=r?SCANS.filter(x=>scRoaster(x).toLowerCase()===r.toLowerCase()).length:0;
  const ti=scanTitle(SC,SC.info),sub=[SC.origin&&originName(SC.origin),SC.variety!=='arabica'&&vName(SC.variety)].filter(Boolean).join(' · ');
  h.innerHTML='<h2 style="margin-bottom:.2rem">'+esc(ti)+'</h2>'+(SC.name&&sub&&sub!==ti?'<p class="scan-sub">'+esc(sub)+'</p>':'')+
    (r?'<div class="roastery"><span class="ri"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z M18 11h1.5a2.5 2.5 0 0 1 0 5H17 M9 3c-1 1.5 1 2.5 0 4 M13 3c-1 1.5 1 2.5 0 4"/></svg></span><div><small>Roasted by</small><b>'+esc(r)+'</b>'+(n>1?'<small>'+n+' of their coffees in your scans</small>':'')+'</div></div>':'<p class="hint" style="margin:.2rem 0 .6rem">Add the roastery below to give them credit.</p>')}
function renderScan(){
  $('s-origin').value=SC.origin;$('s-process').value=SC.process;$('s-variety').value=SC.variety;$('s-date').value=SC.date||'';$('s-brewer').value=SC.brewer;
  seg('s-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>SC.roast,v=>{SC.roast=v;renderScan()});
  grinderSeg('s-grinder',(SC.brewer),()=>SC.grinder,v=>{SC.grinder=v;renderScan()});
  const age=daysSince(SC.date);const c={brewer:SC.brewer,grinder:SC.grinder,tech:techList(SC.brewer)[0][1],process:SC.process,variety:SC.variety,roast:SC.roast,age,goal:'balance'};
  const P=PROCESSES[SC.process],Vp=vParams(SC.variety);
  const tl=techList(SC.brewer);const pref=tl.find(([r])=>P.funk>=1.2?(r.kind==='kh1'||r.kind==='imm'||r.kind==='kh2'):Vp.clarity>=0.8?(r.kind==='46'||r.kind==='neo'||r.kind==='pulse'):true);if(pref)c.tech=pref[1];
  const p=plan(c);const o=oInfo(SC.origin),inf=SC.info;
  const kv=inf?[['Producer or farm',inf.producer_or_farm],['Region',inf.region],['Altitude',inf.altitude],['Varieties',(inf.varieties||[]).join(', ')],['Process',inf.process],['Notes',(inf.tasting_notes||[]).join(', ')]].filter(x=>x[1]):[];
  $('s-name').value=SC.name||'';$('s-roaster').value=SC.roaster||'';$('s-roasters').innerHTML=[...new Set(SCANS.map(scRoaster).filter(Boolean))].map(r=>'<option value="'+esc(r)+'">').join('');
  $('scan-out').innerHTML='<div id="scan-head"></div>'+(inf?(inf.summary?'<p class="hint">'+esc(inf.summary)+'</p>':'')+(kv.length?'<dl class="kv">'+kv.map(([k,v])=>'<dt>'+k+'</dt><dd>'+esc(v)+'</dd>').join('')+'</dl>':''):'<p class="hint">Scan a bag or fill in the details to get a plan.</p>')+
   // Only an origin on the map opens its page; one off the map is a plain chip.
   '<div class="chips">'+(!o?'':ALLO()[SC.origin]?'<button class="chip" data-o="'+SC.origin+'">'+(o.flag||'')+' '+esc(o.name)+'</button>':'<span class="chip">'+(o.flag||'')+' '+esc(o.name)+'</span>')+vbtn(SC.variety.split(':')[0])+'<span class="chip">'+esc(P.name)+'</span><span class="chip">'+age+' days off roast</span></div>'+
   '<h3>Recommended brew</h3>'+planHTML(p,c)+
   '<div class="actions"><button class="btn" id="sc-dial">Brew it in the dial-in</button><button class="btn ghost" id="sc-gallery">Add to the bean gallery</button><button class="btn ghost" id="sc-timer">Start brew timer</button><button class="btn ghost" id="sc-share">Share</button></div>';
  renderScanHead();
  const oc=$('scan-out').querySelector('[data-o]');if(oc)oc.onclick=()=>{showTab('map');selectOrigin(SC.origin,true)};
  $('sc-gallery').onclick=async()=>{let photo=null;if(SFILE&&$('scan-prev').src)try{photo=await shrinkPhoto($('scan-prev').src,900)}catch(e){}
    // A scan reopened from the list has no file, so its kept photo (or thumbnail) is used.
    if(!photo&&SC.id){photo=await BIMG.get(SC.id);if(!photo){const x=SCANS.find(q=>q.id===SC.id);photo=x&&x.t||null}}
    openBeanEditor(null,{name:SC.name||(inf&&plausibleName(inf.coffee_name)?niceName(inf.coffee_name):''),roaster:SC.roaster,origin:SC.origin,process:SC.process,variety:SC.variety,roast:SC.roast,roastDate:SC.date||'',
      flavours:inf&&Array.isArray(inf.tasting_notes)?inf.tasting_notes.join(', ').slice(0,160):'',photo,scan:SC.id||''})};
  $('sc-dial').onclick=()=>{S.bean=okSBean({name:SC.name||scanTitle(SC,SC.info),roaster:SC.roaster,origin:SC.origin,scan:SC.id||''});Object.assign(S,{brewer:p.st.brewer,rec:c.tech,process:c.process,variety:c.variety,roast:c.roast,age:c.age,goal:c.goal,amt:c.amt||'mid',dose:p.r.dose,grinder:p.grinder});showTab('dial');tune('Tuned for this coffee')};
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
function dialDoc(){const r=compute(S),[vt,vs]=verdict(r.D),B=BREWERS[S.brewer],dp=dialPlan();
  const doc={link:brewHref(),title:'My brew: '+vName(S.variety),sub:PROCESSES[S.process].name+' | '+S.roast+' roast | '+B.name,file:'my-brew',blocks:[
   {h:'Settings',kv:[['Grinder',gLabel(S.grinder,S.setting)+' ('+S.setting+' clicks)'],['Brewer',B.name],['Water',S.temp+'°C'],['Ratio','1:'+rr1(S.ratio)],[B.bloom.label,S.bloom+'s'],['Agitation',{low:'Gentle',med:'Normal',high:'Vigorous'}[S.agit]]]},
   {h:'Predicted cup',p:vt+'. '+vs},{kv:[['Sweetness',r.sweet.toFixed(1)+' / 10'],['Acidity',r.acid.toFixed(1)+' / 10'],['Body',r.body.toFixed(1)+' / 10'],['Clarity',r.clarity.toFixed(1)+' / 10'],['Bitterness',r.bitter.toFixed(1)+' / 10']]}]};
  if(dp){doc.title=dp.r.name+': '+vName(S.variety);doc.blocks.unshift({h:'Recipe',kv:[['Recipe',dp.r.name+(dp.r.by?' ('+dp.r.by+')':'')],['Target cup',goalLabel(S.goal,S.amt)],['Dose : water',S.dose+'g : '+dp.water+'g']]});
    doc.blocks.splice(2,0,{h:'Steps',num:true,list:dp.steps},{h:'What changed and why',list:[...dp.changes,...dp.p.tw,...dp.p.why].map(w=>w.replace(/<[^>]+>/g,''))})}
  // The share sheet offers this brew as a designed card image too.
  doc.card=brewCard;doc.cardName='brew-card';doc.cardTheme=()=>originTheme(S.bean&&S.bean.origin);
  return doc}
function varietyDoc(id){const v=VBY[id];const b=[{kv:[['Family',FAM[v.fam].name],['Origin',v.origin||'-'],['Year',v.year||'-'],['Parentage',v.parents||'-']]},{h:'Story',p:v.story},{h:'In the cup',p:v.cup+' ('+v.notes.join(', ')+')'},{h:'How to brew it',p:v.brew}];
  if(v.subs)b.push({h:'Types',list:v.subs.map(s=>s.name+': '+s.cup)});return{link:SITE_URL+'#v='+id,title:v.name,sub:'Variety guide',blocks:b,file:'variety-'+v.name}}
function originDoc(k){const o=ALLO()[k];return{link:SITE_URL+'#o='+k,title:o.name,sub:'Coffee origin | '+REG[o.reg].name,file:'origin-'+o.name,blocks:[{kv:[['Regions',o.subs.join(', ')],['Altitude',o.alt],['Harvest',o.harvest],['Processing',o.process]]},{h:'In the cup',p:o.cup},{h:'Story',p:o.hist},{h:'Varieties grown here',list:o.vars.map(v=>VBY[v]?VBY[v].name:v)},{h:'Did you know?',p:o.fact}]}}
function historyDoc(){return{link:SITE_URL+'#history',title:'The story of coffee',sub:'From Ethiopian forests to your cup',file:'coffee-history',blocks:[{h:'Timeline',list:TIMELINE.map(([w,t,d])=>w+' - '+t+': '+d)},{h:'People who spread coffee',list:PEOPLE.map(([n,r,d])=>n+' ('+r+'): '+d)}]}}
// One logged brew, as text and as a card.
function logEntryDoc(l){const fl=flOf(l).filter(([id])=>FW.byId[id]);
  return{title:l.coffee||'A brew',sub:fmtDate(l)+(l.stars?' | '+l.stars+' / 5':''),file:'brew-'+(l.coffee||'log'),
    blocks:[{kv:[['Settings',l.settings||'-'],['Predicted',l.pred||'-']]},...(fl.length?[{h:'What I tasted',p:fl.map(([id])=>FW.byId[id].n).join(', ')}]:[]),...(l.notes?[{h:'Notes',p:l.notes}]:[])],
    card:()=>logCard(l),cardTheme:()=>{const s=okSnap(l.snap);return originTheme(s&&s.bean&&s.bean.origin)},cardName:'brew-card',cardSub:'This brew as one image: your rating, '+(l.snap?'the settings with the grind dial, the predicted cup, the pours, ':'the settings, ')+'what you tasted and your notes.'}}
function logDoc(){return{title:'My brew log',sub:LOG.length+' brews',file:'brew-log',blocks:LOG.length?LOG.map(l=>({h:(l.coffee||'Untitled')+' - '+l.date,kv:[['Rating',l.stars?l.stars+' / 5':'-'],['Settings',l.settings||'-'],['Predicted',l.pred||'-'],['Notes',l.notes||'-']].concat(flOf(l).length?[['Flavour notes',flText(flOf(l))]]:[])})):[{p:'No brews logged yet.'}]}}
function scanDoc(p,c){const inf=SC.info||{};const kv=[...(SC.roaster?[['Roastery',SC.roaster]]:[]),['Origin',SC.origin?originName(SC.origin):'Not sure'],['Variety',vName(SC.variety)],['Process',PROCESSES[SC.process].name],['Roast',SC.roast],['Days off roast',String(daysSince(SC.date))]];
  if(inf.producer_or_farm)kv.push(['Producer or farm',inf.producer_or_farm]);if(inf.altitude)kv.push(['Altitude',inf.altitude]);if((inf.tasting_notes||[]).length)kv.push(['Tasting notes',inf.tasting_notes.join(', ')]);
  const rd=recipeDoc(c.tech,p,c);return{link:rd.link,title:scanTitle(SC,SC.info),sub:'Bean profile and recommended brew',file:'bean-plan',blocks:[{h:'The coffee',kv}].concat(inf.summary?[{p:inf.summary}]:[]).concat([{h:'Recommended: '+RECIPES[c.tech].name,p:''}]).concat(rd.blocks.slice(1))}}

let SHDOC=null;
// Where people land from a shared message.
const SITE_URL='https://brew-bench.web.app/';
const APPS=[['native','Share\u2026','#8E8E93','M12 15V3 M7 8l5-5 5 5 M5 12v8h14v-8'],
  ['whatsapp','WhatsApp','#25D366','M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.2z M9.5 9.2c.2 2.3 2.8 5 5.3 5.3l1-1.3-1.8-.9-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-.9-1.8z'],
  ['telegram','Telegram','#2AABEE','M20 5L3.5 11.4l5 1.8L18 7l-7.6 7.4.3 4.6 2.8-3 3.8 2.8z'],
  ['sms','Messages','#34C759','M4 5h16v11H9l-5 4z'],
  ['email','Email','#0A84FF','M3 6h18v12H3z M3 7l9 6 9-6']];
// Chat-friendly text: headings become *bold* (WhatsApp and Telegram both show it as bold).
// The link goes last and is never cut, so the other phone can always open it.
function shareText(doc){const link=doc.link||SITE_URL,t=docText(doc,true).replace(/\nMade with The Brew Bench\n$/,'').trim().replace(/^#+\s*(.+)$/gm,'*$1*');
  return(t.length>1400?t.slice(0,1400).replace(/\s+\S*$/,'')+'\u2026':t)+(t.includes(link)?'':'\n\nOpen it in The Brew Bench:\n'+link)}
// The PDF engine (360 KB) loads when a share sheet first opens, not on every start.
let PDFP=null;
const loadPDF=()=>window.jspdf&&window.jspdf.jsPDF?Promise.resolve():(PDFP=PDFP||loadScript(typeof JSPDF_SRC==='string'?JSPDF_SRC:'vendor/jspdf.umd.min.js').catch(e=>{PDFP=null;throw e}));
function openShare(doc){SHDOC=doc;loadPDF().catch(()=>{});const pdfOK=true;
  $('sh-in').innerHTML='<div class="sheet"><div class="grab"></div><button class="vd-close" id="sh-x" aria-label="Close">\u2715</button><h2 id="sh-title" style="margin:0 40px 2px 0">Share</h2><p class="hint" style="margin:0">'+esc(doc.title)+'</p>'+
   // A brew can also go out as a designed image card: shown first, with a preview drawn as the sheet opens.
   (doc.card?'<div class="shcard"><button type="button" class="shcard-pv" data-sh="img" aria-label="Share the brew card image"><span class="shcard-ph">Drawing your brew card…</span></button>'+
     '<div class="shcard-tx"><b>'+esc(doc.cardTitle||'Brew card')+'</b><small>'+esc(doc.cardSub||'One image with everything: recipe, numbers, grind dial, the predicted cup and every pour.')+'</small>'+
     '<div class="shcard-act"><button type="button" class="btn" data-sh="img">Share image</button><button type="button" class="btn ghost" data-sh="imgsave">Save</button></div></div>'+
     // The card's look is yours to choose each time: Dark or Light, in the origin's colours or one of the coffee colours.
     '<div class="shstyle"><div class="shmode" role="group" aria-label="Card style">'+[['dark','Dark'],['light','Light']].map(([k,n])=>'<button type="button" data-shmode="'+k+'" aria-pressed="'+(CARD_STYLE.mode===k)+'">'+n+'</button>').join('')+'</div>'+
     '<div class="shcols" role="group" aria-label="Card colours">'+shSwatches(doc)+'</div></div></div>':'')+
   '<div class="sharerow">'+APPS.map(([k,n,c,d])=>'<button type="button" data-sh="'+k+'"><span class="app" style="background:'+c+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg></span>'+n+'</button>').join('')+'</div>'+
   '<div class="sheetlist">'+
   '<button type="button" data-sh="pdf">'+ico('file','#B5533C')+'<span>Save as PDF<small>'+(pdfOK?'A styled page to send or print':'Loading the PDF engine\u2026 try again in a moment')+'</small></span></button>'+
   '<button type="button" data-sh="copy">'+ico('copy','#C9964A')+'<span>Copy as text<small>Paste it anywhere</small></span></button>'+
   '<button type="button" data-sh="md">'+ico('text','#8A5A3B')+'<span>Save as a text file<small>Plain text you can edit</small></span></button></div></div>';
  const d=$('sharesheet');showDlg(d);$('sh-x').onclick=()=>d.close();
  if(doc.card)drawShCard()}
let SHCARD=null,SHN=0;
// The preview, redrawn whenever the style changes; an older drawing that finishes late is dropped.
function drawShCard(){const d=$('sharesheet'),doc=SHDOC,n=++SHN;SHCARD=null;const pv=d.querySelector('.shcard-pv');if(pv)pv.classList.add('busy');
  doc.card().then(bl=>{if(SHDOC!==doc||n!==SHN||!bl)return;SHCARD=bl;const pv=d.querySelector('.shcard-pv');if(!pv)return;pv.classList.remove('busy');
    const u=URL.createObjectURL(bl);pv.innerHTML='<img src="'+u+'" alt="Your brew card">';pv.querySelector('img').onload=()=>setTimeout(()=>URL.revokeObjectURL(u),1000)}).catch(()=>{const ph=d.querySelector('.shcard-ph');if(ph)ph.textContent='Couldn’t draw the card'})}
// One swatch per colour, painted in what the card would use: its background and its accent.
function shSwatches(doc){const T=(doc.cardTheme&&doc.cardTheme())||OT.house,keep=Object.assign({},BC);
  const h=cardCols().map(([k,n])=>{const t=cardStyle(T,{mode:CARD_STYLE.mode,col:k}),lab=k==='origin'?(T.key?(flagOf(T.key)+' '+T.name):'House'):n;
    return '<button type="button" class="shsw" data-shcol="'+k+'" aria-pressed="'+(CARD_STYLE.col===k)+'" aria-label="'+esc(lab)+' colours"><i style="background:linear-gradient(135deg,'+t.bg[0]+' 0 55%,'+t.acc+' 55%)"></i><span>'+esc(lab)+'</span></button>'}).join('');
  Object.assign(BC,keep);return h}
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
  // Phone browsers hand downloads to a download manager that can't always read a blob link (Chrome on Android
  // reports "Download failed"), so phones get a self-contained data link; elsewhere the blob link lives a minute.
  try{const blob=data instanceof Blob?data:new Blob([data]),phone=matchMedia('(pointer:coarse)').matches&&blob.size<20e6;
    const u=phone?await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(blob)}):URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();if(!phone)setTimeout(()=>URL.revokeObjectURL(u),60000);toast('Download started');return true}catch(e){toast('Saving files isn\u2019t available here');return false}}
$('sharesheet').addEventListener('click',async e=>{const d=$('sharesheet');if(e.target===d){d.close();return}
  const sm=e.target.closest('[data-shmode],[data-shcol]');if(sm&&SHDOC){if(sm.dataset.shmode)CARD_STYLE.mode=sm.dataset.shmode;else CARD_STYLE.col=sm.dataset.shcol;saveCardStyle();
    d.querySelectorAll('[data-shmode]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.shmode===CARD_STYLE.mode));const sc=d.querySelector('.shcols');if(sc)sc.innerHTML=shSwatches(SHDOC);drawShCard();return}
  const b=e.target.closest('[data-sh]');if(!b||!SHDOC)return;const k=b.dataset.sh,doc=SHDOC,txt=docText(doc),base=fname(doc.file||doc.title);
  if(k==='img'||k==='imgsave'){const bl=SHCARD||await doc.card();if(!bl){toast('Couldn’t draw the card');return}d.close();await shareCard(bl,fname(doc.cardName||base),doc.title,k==='imgsave');return}
  if(k==='pdf'){try{await loadPDF()}catch(e){toast('Couldn’t load the PDF maker. Check your connection and try again');return}const blob=docPDF(doc);if(!blob){toast('Couldn’t make the PDF. Try again');return}d.close();await saveFile(base+'.pdf',blob)}
  if(k==='md'){d.close();await saveFile(base+'.txt',txt)}
  if(k==='copy'){let ok=false;try{await navigator.clipboard.writeText(txt);ok=true}catch(err){try{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();ok=document.execCommand('copy');ta.remove()}catch(e2){}}d.close();toast(ok?'Copied to clipboard':'Copying isn\u2019t allowed here; try Save as a text file')}
  if(k==='whatsapp'||k==='telegram'||k==='sms'||k==='email'){const t=shareText(doc),e=encodeURIComponent;d.close();
    openLink({whatsapp:'https://wa.me/?text='+e(t),telegram:'https://t.me/share/url?url='+e(doc.link||SITE_URL)+'&text='+e(t.replace(doc.link||SITE_URL,'').replace(/\n*Open it in The Brew Bench:\s*$/,'').trim()),sms:'sms:?&body='+e(t),email:'mailto:?subject='+e(doc.title)+'&body='+e(t)}[k]);return}
  if(k==='native'&&!navigator.share&&!NATIVE){let ok=false;try{await navigator.clipboard.writeText(shareText(doc));ok=true}catch(e){}d.close();toast(ok?'This browser has no share menu, so the text was copied':'Sharing isn\u2019t available here; use Copy as text');return}
  if(k==='native'&&NATIVE){d.close();await loadPDF().catch(()=>{});try{const blob=docPDF(doc);await nativeShare(doc.title,blob?base+'.pdf':null,blob,txt)}catch(err){if(!/cancel/i.test(err&&err.message||''))toast('Could not share')}return}
  if(k==='native'){await loadPDF().catch(()=>{});try{const blob=docPDF(doc);const f=blob&&typeof File!=='undefined'?new File([blob],base+'.pdf',{type:'application/pdf'}):null;
      if(f&&navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({title:doc.title,files:[f]});else await navigator.share({title:doc.title,text:txt});d.close()}
    catch(err){if(!err||err.name!=='AbortError')toast('Sharing isn\u2019t allowed here; use Save as PDF instead')}}
});

/* ================= WORLD CHAMPIONSHIPS ================= */
let CHF='all',CHB='all';
// Upcoming finals and new champions come from events.json on the website, so a yearly update reaches the app without a new release.
const EVURL='https://brew-bench.web.app/events.json';
let EVENTS=[];
function useEvents(src){const ok=e=>e&&COMPS[e.c]&&Number.isFinite(Date.parse(e.start))&&Number.isFinite(Date.parse(e.end))&&typeof e.city==='string';
  EVENTS=(Array.isArray(src&&src.events)?src.events:[]).filter(ok).map(e=>({c:e.c,y:num(e.y,new Date(e.start).getFullYear()),start:Date.parse(e.start),end:Date.parse(e.end),
    // The days at the venue, as written (a final ending at 8 pm in Panama is already the next day in Muscat).
    sd:String(e.start).slice(0,10),ed:String(e.end).slice(0,10),city:str(e.city,80),venue:str(e.venue,80),note:str(e.note,160)})).sort((a,b)=>a.start-b.start);
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
  const [n,...rest]=ev,C=COMPS[n.c],live=Date.now()>=n.start,day=d=>new Date(d+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'});
  // A final already under way says so, with the days it runs.
  const when=n.sd===n.ed?day(n.sd):day(n.sd)+' to '+day(n.ed);
  box.innerHTML='<div class="cd" style="--c:'+C.color+'"><span class="pill"><i style="background:'+C.color+'"></i>'+(live?'World final happening now':'Next world final')+'</span><h3>'+esc(C.name)+' '+n.y+'</h3>'+
   '<p class="hint" style="margin:0">'+esc(n.city)+(n.venue?' · '+esc(n.venue):'')+' · '+when+'</p>'+
   '<div class="cdclock" id="cd-clock" aria-live="off"></div>'+(n.note?'<p class="hint" style="margin:.4rem 0 0">'+esc(n.note)+'</p>':'')+'</div>'+
   (rest.length?'<div class="cdnext">'+rest.map(e=>'<div><span class="pill"><i style="background:'+COMPS[e.c].color+'"></i>'+COMPS[e.c].short+' '+e.y+'</span><b>'+esc(e.city)+'</b><small>'+new Date(e.sd+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})+' · in '+Math.max(0,Math.ceil((e.start-Date.now())/864e5))+' days</small></div>').join('')+'</div>':'');
  // The clock is drawn at once, even while the page is still opening; it stops ticking once you leave the page.
  let first=true;const tick=()=>{const el=$('cd-clock');if(!el||(!first&&!document.getElementById('champs').classList.contains('on'))){clearInterval(CDT);CDT=null;return}first=false;
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
   (why?'<p>'+esc(why)+'</p>':'')+(r.partial?'<p class="hint">'+esc(r.partial)+'</p>':'')+(steps?stepList(steps)
     :St?'<div class="chstart"><p class="hint" style="margin:0 0 .4rem">Start from a recipe in the same style: <b>'+esc(St.name)+'</b></p><div class="meta"><span>'+St.dose+'g : '+St.water+'g</span>'+(St.temp?'<span>'+St.temp+'°C</span>':'')+'</div>'+stepList(St.steps)+'</div>'
     :'<p class="hint">The full step-by-step was not published.</p>')+
   '<div class="ghead" style="margin-top:1.2rem"><h3 style="margin:0">Brew it with your gear</h3><button type="button" class="gpick-btn" data-ca="gear" aria-label="Edit your gear" title="Edit your gear">'+SWAP_ICON+'</button></div>'+brewLine+
   '<p class="hint" style="margin:.2rem 0 .5rem">'+(g?'Grind converted from the champion’s '+esc(r.grind.label)+(sub?', then adjusted for your '+esc(BREWERS[nb].name):'')+'.':'The champion’s grind: '+esc(r.grind&&r.grind.label?lcGrind(r.grind.label):'not published')+'. These are starting points for '+(nb&&MYB.length?'your '+esc(brewName(BREWERS[useB].name)):art(brewName(BREWERS[b].name))+' '+esc(brewName(BREWERS[b].name)))+'; adjust by taste.')+'</p>'+rows+
   (!sub&&r.alt?'<p class="hint">'+esc(r.alt)+'</p>':'')+
   '<div class="actions">'+(U?'<button type="button" class="btn" data-ca="timer">Start timer</button>':'')+(R2?'<button type="button" class="btn ghost" data-ca="load">Brew in the dial-in</button>':'')+
   (g?'<button type="button" class="btn ghost" data-ca="match">All grinders</button>':'')+'<button type="button" class="btn ghost" data-ca="share">Share</button></div></div>';
  d.querySelector('.vd-body').onclick=e=>{const a=e.target.closest('[data-ca]');if(!a)return;const k=a.dataset.ca;if(k==='share'){openShare(champDoc(ch));return}d.close();
    if(k==='gear'){setTimeout(()=>openGearPicker('brewers',()=>openChamp(ch)),0);return}
    if(k==='timer')openTimer(ui);else if(k==='plan')planRecipe(ui);else if(k==='match')openMatch(g,r.grind.c);
    else if(k==='load'){const B=BREWERS[useB],gr=MYG.find(h=>setOn(h)!=null)||S.grinder;S.brewer=useB;S.rec=useB===U.b?ui:null;S.grinder=gr;S.setting=setOn(gr)??base(gr,useB);
      S.temp=clamp(U.temp,B.temp.min,B.temp.max);S.bloom=B.bloom.def;S.agit='med';S.ratio=clamp(Math.round(U.water/U.dose/B.ratio.step)*B.ratio.step,B.ratio.min,B.ratio.max);S.dose=U.dose;S.goal='balance';S.amt='mid';
      // The champion's own settings count as the starting point; changing the coffee or target re-tunes from the recipe.
      S.tuned=S.rec!=null?Object.fromEntries(TUNED_KEYS.map(k=>[k,S[k]])):null;render();showTab('dial');toast('Loaded '+ch.who+'’s recipe')}};
  const hx=d.querySelector('.vd-head');hx.onclick=e=>{if(e.target.closest('#vd-x'))d.close()};
  showDlg(d);d.scrollTop=0}
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
  if(d.open)d.close();if(b.dataset.goP)openProcess(b.dataset.goP);else if(b.dataset.goK)openWord(b.dataset.goK);else showTab(b.dataset.goT,false,true);return true}
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
  $('vd-x').onclick=()=>d.close();showDlg(d);d.scrollTop=0}
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
const ICO={wheel:'M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0z M12 3v9l7.8 4.5 M12 12l-7.8 4.5',trophy:'M8 4h8v5a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 4 M16 6h3a3 3 0 0 1-3 4 M12 13v4 M8 21h8 M9 17h6',globe:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18',leaf:'M5 19c0-8 5-14 14-14c0 9-6 14-14 14z M5 19l8-8',
  hourglass:'M7 3h10 M7 21h10 M8 3v3l4 6 4-6V3 M8 21v-3l4-6 4 6v3',flask:'M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7.5 15h9',drop:'M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z',
  clipboard:'M9 3h6v3H9z M7 4.5H5V21h14V4.5h-2 M8 11h8 M8 15h8 M8 19h5',cog:'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9L7 7 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1',
  book:'M4 19V5a2 2 0 0 1 2-2h13v14H6a2 2 0 0 0-2 2a2 2 0 0 0 2 2h13 M8 7h7',pencil:'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',moon:'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun:'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5L19 19 M5 19l1.5-1.5 M17.5 6.5L19 5',download:'M12 4v11 M7 10l5 5 5-5 M5 20h14',
  file:'M6 3h8l4 4v14H6z M14 3v4h4 M9 13h6 M9 17h4',share:'M12 15V3 M7 8l5-5 5 5 M5 12v8h14v-8',copy:'M9 9h11v11H9z M5 15H4V4h11v1',text:'M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M12 12v6'};
// True inside the Android app or when the site is already installed to the home screen.
const installed=()=>!!window.Capacitor||MQ('(display-mode: standalone)')||navigator.standalone===true;
// A tile in the vibe's own accent turns light in the dark vibes, so its icon takes the paper colour instead of white.
const ico=(n,bg)=>'<span class="ic'+(/var\(--/.test(bg)?' on-accent':'')+'" style="background:'+bg+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+ICO[n]+'"/></svg></span>';

const TABNAMES={explore:'Explore',settings:'Settings',champs:'World championships',words:'Coffee words',wheel:'Flavour wheel',flow:'From seed to cup',dial:'Dial-in',scan:'Scan beans',gear:'Gear and dials',recipes:'Recipes',tech:'Techniques',process:'Processes',map:'Origins map',variety:'Varieties',history:'History',guide:'Guide',log:'Brew log',beans:'Beans'};
const BNGROUP={explore:'explore',settings:'settings',champs:'explore',words:'explore',wheel:'explore',flow:'explore',dial:'dial',recipes:'recipes',scan:'beans',map:'explore',variety:'explore',history:'explore',process:'explore',tech:'explore',gear:'settings',guide:'settings',log:'settings',beans:'beans'};
function syncShell(id){$('ab-title').textContent=TABNAMES[id]||'Brew Bench';$('ab-back').hidden=NAVD<1;document.body.className=document.body.className.replace(/\bt-\w+/g,'').trim()+' t-'+id;
  document.querySelectorAll('.bottomnav [data-bn]').forEach(b=>b.setAttribute('aria-current',BNGROUP[id]===b.dataset.bn));requestAnimationFrame(movePill);
  updShare(id)}
// The app bar's Share only shows when the page has something to share: a picked origin on the map, a list of recipes.
function updShare(id){id=id||(document.querySelector('main section.on')||{}).id;
  $('ab-share').hidden=!(['dial','scan','history','log','words','flow','wheel'].includes(id)||(id==='map'&&(()=>{try{return !!SEL}catch(e){return false}})())||(id==='recipes'&&rListed()))}
const SHEETS={explore:[['map','Origins map',Object.keys(ALLO()).length+' origins on an interactive map','#4F8A74','globe'],['variety','Varieties',V.length+' varieties, stories and Geisha types','#B5533C','leaf'],['history','History','Family tree, timeline and a quiz','#8A5A3B','hourglass'],['process','Processes','From washed to thermal shock','#D2A04A','flask'],['tech','Techniques','Every move in the brewing toolbox','#6B8E4E','drop'],['champs','World championships','Every champion, their recipes and gear','#C9964A','trophy'],['flow','From seed to cup','How coffee is made, step by step','#6E8FA8','leaf'],['words','Coffee words','A bank of '+GLOSSARY.length+' coffee terms','#9A7390','book'],['wheel','Flavour wheel','Name what you taste, then save it with your brews','#C4473F','wheel']],
  more:[['gear','Gear and dials','Grinders, brewers and dial reading','#6E8FA8','cog'],['guide','Guide','Ratio calculator and troubleshooting','#C9964A','book'],['log','Brew log','Your brews, ratings and exports','#6B8E4E','pencil']]};
/* Explore and More are pages, like Brew, Recipes and Scan: tiles grouped by what they're for. */
const HUB={explore:[['Where coffee comes from',['map','variety','process','flow']],['How to brew and taste',['tech','wheel','words']],['The people and the story',['history','champs']]],
  settings:[['Your tools',['gear','guide','log']]]};
// "On this page": buttons that jump to a section of a long page. A target is an element id, or (with @) the start of a
// heading's text, found when tapped so pages that re-render their headings keep working.
const JUMPS={history:[['@The coffee family tree','Family tree'],['@The coffee species','Species'],['@Timeline','Timeline'],['@People who','People'],['@Test yourself','Quiz']],
  guide:[['@Ratio calculator','Ratio calculator'],['@What does it taste like','Fix the taste'],['@The bloom','Bloom'],['@Extraction levers','Extraction'],['@Grinders and brewers','Grinders and brewers'],['@Troubleshoot','Troubleshoot']],
  champs:[['ch-next','Next finals'],['ch-about','The competitions'],['@Timeline','Every champion']],
  scan:[['@Coffee details','Coffee details'],['@Recommended brew','Brew plan']]};
for(const [sec,items] of Object.entries(JUMPS)){const s=$(sec);if(!s)continue;const at=s.querySelector('.lede')||s.querySelector('h2');
  at.insertAdjacentHTML('afterend','<div class="seg filters scrollrow jumpnav" role="navigation" aria-label="On this page">'+items.map(([t,n])=>'<button type="button" data-jump="'+esc(t)+'">'+esc(n)+'</button>').join('')+'</div>')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-jump]');if(!b)return;const t=b.dataset.jump,sec=b.closest('section');
  const el=t[0]==='@'?[...sec.querySelectorAll('h2,h3')].find(h=>h.offsetParent&&h.textContent.trim().startsWith(t.slice(1))):$(t);
  if(!el){toast('Nothing to show there yet');return}el.style.scrollMarginTop='96px';el.scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'})});
const hubItem=k=>[...SHEETS.explore,...SHEETS.more].find(x=>x[0]===k);
const hubCount=k=>({map:Object.keys(ALLO()).length,variety:V.length,process:Object.keys(PROCESSES).length,tech:TECH.length,words:GLOSSARY.length,champs:CHAMPS.length,gear:MYG.length+' grinder'+(MYG.length===1?'':'s'),log:LOG.length?LOG.length+' brew'+(LOG.length===1?'':'s'):0})[k];
const hubCard=k=>{const [,n,d,c,ic]=hubItem(k),cnt=hubCount(k);return '<button type="button" class="hubcard" data-go="'+k+'">'+ico(ic,c)+(cnt?'<span class="hn">'+cnt+'</span>':'')+'<b>'+n+'</b><small>'+d+'</small></button>'};
function renderExplore(){const day=Math.floor(Date.now()/864e5),w=GLOSSARY[day%GLOSSARY.length];
  $('explore-in').innerHTML='<button type="button" class="wotd" data-word="'+esc(w[0])+'"><small>Word of the day</small><b>'+esc(w[0])+'</b><span>'+esc(w[2])+'</span></button>'+factCard(day)+(window.BEANS_OK?cabinetDayHTML():'')+
    HUB.explore.map(([h,ks])=>'<h3 class="rh">'+h+'</h3><div class="hubgrid">'+ks.map(hubCard).join('')+'</div>').join('');if(window.BEANS_OK)hydrateImgs($('explore-in'))}
/* ---------- Settings: the app's look, name and your data ---------- */
// Vibes: whole palettes, light and dark (their colours live in the styles; these are for the previews).
const VIBES=[["roastery","Roastery","The house look: cream and roasted brown",{"paper":"#FBF7F0","surface":"#FFFDF9","surface2":"#F3EADC","ink":"#3B2A20","cherry":"#8A5A3B","honey":"#C9964A","leaf":"#6B8E4E"},{"paper":"#1F1814","surface":"#2A211B","surface2":"#362A22","ink":"#F3EADF","cherry":"#D9A06B","honey":"#E2B866","leaf":"#A7C084"}],["oat","Oat latte","Soft, milky and calm",{"paper":"#F6F0E8","surface":"#FFFCF7","surface2":"#EDE3D6","ink":"#3A3029","cherry":"#855735","honey":"#B98A3E","leaf":"#5F7F49"},{"paper":"#2F2A26","surface":"#3C3631","surface2":"#4A433D","ink":"#F5EFE8","cherry":"#E9C29E","honey":"#EDCB91","leaf":"#BCD1A6"}],["matcha","Matcha caf\u00e9","Fresh greens, easy on the eyes",{"paper":"#F1F5EB","surface":"#FCFEF8","surface2":"#E1E9D4","ink":"#24301D","cherry":"#3F6E2E","honey":"#9C7A26","leaf":"#4E7A3A"},{"paper":"#0D2216","surface":"#143020","surface2":"#1C3F2B","ink":"#E6F4E3","cherry":"#9FDB82","honey":"#E3CF7C","leaf":"#9FDB82"}],["blossom","Coffee blossom","Pink like the flowers on the tree",{"paper":"#FBF3F3","surface":"#FFFBFB","surface2":"#F4E0E2","ink":"#3D2328","cherry":"#A8324F","honey":"#B47E3A","leaf":"#5E8A5A"},{"paper":"#2A0D1D","surface":"#3A1429","surface2":"#4B1D36","ink":"#FCE9F0","cherry":"#FF93B6","honey":"#F3C98A","leaf":"#B4DDA8"}],["nordic","Nordic roast","Cool, light and minimal",{"paper":"#F3F6F8","surface":"#FFFFFF","surface2":"#E5EBF0","ink":"#1E2833","cherry":"#2C5A80","honey":"#9A7A3A","leaf":"#4F7C69"},{"paper":"#0A1A2E","surface":"#11253F","surface2":"#19324F","ink":"#E5EEF8","cherry":"#8FC4F2","honey":"#E3C68D","leaf":"#93D1B8"}],["desert","Desert mocha","Sand and terracotta, Yemen at dusk",{"paper":"#F8F0E3","surface":"#FFFAF1","surface2":"#EEDEC6","ink":"#3A2618","cherry":"#9A4522","honey":"#B87E25","leaf":"#6E7F3E"},{"paper":"#2E140A","surface":"#3E1D0F","surface2":"#4F2715","ink":"#FBE9D8","cherry":"#FFA06E","honey":"#F5C77A","leaf":"#CFD593"}],["neon","Neon espresso","Late-night caf\u00e9, a little loud",{"paper":"#F6F2FF","surface":"#FFFFFF","surface2":"#EBE3FF","ink":"#24183A","cherry":"#6A30D6","honey":"#C2357E","leaf":"#13896A"},{"paper":"#130A33","surface":"#1E1250","surface2":"#2A1B66","ink":"#F3EEFF","cherry":"#D0A5FF","honey":"#FF8BD0","leaf":"#5FF0BE"}],["caramel","Caramel pop","Warm, sweet and sunny",{"paper":"#FFF5EA","surface":"#FFFDF8","surface2":"#FBE4CC","ink":"#3B2412","cherry":"#9C4913","honey":"#B97A15","leaf":"#5E8040"},{"paper":"#2A1A06","surface":"#3A250B","surface2":"#4A3012","ink":"#FFF0DC","cherry":"#FFB061","honey":"#FFD27A","leaf":"#C3DA93"}],["pure","Pure","Crisp white by day, true black by night",{"paper":"#FFFFFF","surface":"#FFFFFF","surface2":"#F2F2F4","ink":"#0B0B0C","cherry":"#141416","honey":"#8A6A2C","leaf":"#2F7A45"},{"paper":"#000000","surface":"#0E0E10","surface2":"#1A1A1D","ink":"#FFFFFF","cherry":"#F4F4F5","honey":"#E3C17E","leaf":"#7FD08F"}],["black","Black coffee","White or pitch black, with a crema accent",{"paper":"#FFFFFF","surface":"#FFFFFF","surface2":"#F4F1EE","ink":"#121212","cherry":"#7A4A2C","honey":"#9A6B1F","leaf":"#4E7A3A"},{"paper":"#000000","surface":"#0F0D0C","surface2":"#1C1916","ink":"#FFFFFF","cherry":"#E2A877","honey":"#F0C477","leaf":"#A5CC86"}]];
let UI=Object.assign({accent:'classic',vibe:'roastery',logo:'bean',text:'m',motion:'full',start:'dial'},load('bb-ui',{}));
if(!VIBES.some(v=>v[0]===UI.vibe))UI.vibe='roastery';
const ACCENTS=[['classic','Vibe’s own','#8A5A3B'],['espresso','Espresso','#5E3B2A'],['cascara','Cascara','#A3392E'],['kenya','Kenya','#7B2D4E'],['honey','Honey','#A8741C'],['leaf','Coffee leaf','#4F7A45'],['coldbrew','Cold brew','#2E5C7A'],['geisha','Geisha','#76588C']];
if(!ACCENTS.some(a=>a[0]===UI.accent))UI.accent='classic';
// The logos: the bean drawn in the top bar's own markup, the rest from data/logos.json (which also makes the Android
// home-screen icons). Colours are the vibe's, so a logo follows your look.
const logoParts=parts=>parts.map(p=>{const col='var(--'+(p.fill||p.stroke)+')',op=p.op!=null?' opacity="'+p.op+'"':'';
  const paint=p.fill?'fill="'+col+'"':'fill="none" stroke="'+col+'" stroke-width="'+p.w+'" stroke-linecap="round" stroke-linejoin="round"';
  return p.c?'<circle cx="'+p.c[0]+'" cy="'+p.c[1]+'" r="'+p.c[2]+'" '+paint+op+'/>':'<path d="'+p.d+'" '+paint+op+'/>'}).join('');
const LOGOS=Object.assign({bean:['Bean',null]},Object.fromEntries(Object.entries(LOGO_DATA).filter(([k])=>k!=='_').map(([k,v])=>[k,[v.name,logoParts(v.parts)]])));
if(!LOGOS[UI.logo])UI.logo='bean';delete UI.name;if(!['s','m','l','xl'].includes(UI.text))UI.text='m';if(!['full','reduced'].includes(UI.motion))UI.motion='full';if(UI.start==='scan')UI.start='beans';if(!['dial','recipes','beans','explore'].includes(UI.start))UI.start='dial';
const BEAN_SVG=$('ab-logo').innerHTML;
// Each copy of the bean gets its own clip id: two elements with one id can draw the wrong (or no) bean.
const logoSVG=(k,sz)=>k==='bean'?BEAN_SVG.replace(/width="24" height="24"/,'width="'+sz+'" height="'+sz+'"').replace(/abBean/g,sz===24?'abBean':'abBean'+sz):'<svg viewBox="0 0 24 24" width="'+sz+'" height="'+sz+'" aria-hidden="true">'+LOGOS[k][1]+'</svg>';
// The browser tab icon follows the chosen logo and colours.
function setFavicon(){try{const cs=getComputedStyle(document.documentElement),col=v=>cs.getPropertyValue(v).trim()||'#8A5A3B';
  const svg=logoSVG(UI.logo,64).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ').replace(/var\((--[a-z-]+)\)/g,(m,v)=>col(v));
  const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle=col('--paper');x.beginPath();x.arc(32,32,32,0,7);x.fill();x.drawImage(img,6,6,52,52);
    let l=document.querySelector('link[rel="icon"]');if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l)}l.href=c.toDataURL('image/png')};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}catch(e){}}
function applyUI(){const d=document.documentElement;d.setAttribute('data-accent',UI.accent);if(UI.vibe==='roastery')d.removeAttribute('data-vibe');else d.setAttribute('data-vibe',UI.vibe);d.setAttribute('data-text',UI.text);d.setAttribute('data-motion',UI.motion);
  $('ab-logo').innerHTML=logoSVG(UI.logo,24);
  // In the Android app the home-screen icon follows the logo; the app swaps it when you next leave it.
  {const ai=plugin('AppIcon');if(ai)ai.set({name:UI.logo}).catch(()=>{})}
  const pap=(VIBES.find(v=>v[0]===UI.vibe)||VIBES[0])[curTheme()==='dark'?4:3].paper;document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{if(d.hasAttribute('data-theme')||UI.vibe!=='roastery')m.content=pap});(window.requestIdleCallback||(f=>setTimeout(f,300)))(setFavicon)}
function saveUI(){save('bb-ui',UI);applyUI()}
/* Your data: everything the app saves on this device, in one file you can keep or move to another phone. */
// Sign-in tokens never go into a backup file.
const DATA_SKIP=['bb-calreset1','bb-splash-test','bb-reset','bb-pending','bb-account','bb-fbcfg','bb-syncshadow','bb-syncat','bb-syncdb','bb-bio','bb-bio-no','bb-upd'];
function dataKeys(){const k=[];try{for(let i=0;i<localStorage.length;i++){const n=localStorage.key(i);if(n&&n.startsWith('bb-')&&!DATA_SKIP.includes(n))k.push(n)}}catch(e){}return k.sort()}
function dataSummary(){const n=k=>{let v=null;try{v=JSON.parse(localStorage.getItem(k)||'null')}catch(e){}return Array.isArray(v)?v.length:v&&typeof v==='object'?Object.keys(v).length:0};
  return [[n('bb-myrecipes'),'recipe'],[n('bb-log'),'brew'],[n('bb-beans'),'gallery coffee'],[n('bb-scans'),'scan'],[n('bb-favs'),'favourite']].filter(x=>x[0]).map(([c,w])=>c+' '+w+(c===1?'':'s')).join(', ')||'Nothing saved yet besides your settings'}
async function exportData(){const data={};for(const k of dataKeys()){try{data[k]=localStorage.getItem(k)}catch(e){}}
  const d=new Date(),day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  // Gallery photos live outside localStorage, so they travel in the backup alongside it.
  const images=await BIMG.all();
  const blob=new Blob([JSON.stringify({app:'brew-bench',kind:'backup',version:2,exported:d.toISOString(),data,images},null,1)],{type:'application/json'});
  await saveFile('brew-bench-backup-'+day+'.json',blob)}
// A backup's lists and photos, checked: only Brew Bench keys and photos, never the account or sync state.
function backupParts(j){if(!j||j.app!=='brew-bench'||!j.data||typeof j.data!=='object')return null;
  const ent=Object.entries(j.data).filter(([k,v])=>/^bb-[a-z0-9-]{1,40}$/.test(k)&&typeof v==='string'&&!DATA_SKIP.includes(k));
  const imgs=j.images&&typeof j.images==='object'?Object.entries(j.images).filter(([k,v])=>/^(dy:)?[a-z0-9]{4,24}$/.test(k)&&typeof v==='string'&&v.startsWith('data:image/')):[];
  return{ent,imgs}}
async function applyBackup({ent,imgs}){for(const k of dataKeys())localStorage.removeItem(k);for(const [k,v] of ent)localStorage.setItem(k,v);await BIMG.clear();for(const [k,v] of imgs)await BIMG.put(k,v)}
function importData(file){if(!file)return;if(file.size>80e6){toast('That file is too big to be a Brew Bench backup');return}
  const rd=new FileReader();rd.onload=()=>{let j;try{j=JSON.parse(rd.result)}catch(e){toast('That file isn’t a Brew Bench backup');return}
    const b=backupParts(j);if(!b){toast('That file isn’t a Brew Bench backup');return}if(!b.ent.length){toast('That backup is empty');return}
    const when=j.exported?new Date(j.exported).toLocaleDateString():'an earlier date';
    if(!confirm('Replace the data on this device with the backup from '+when+'? Your current recipes, log, scans and settings here will be overwritten.'))return;
    applyBackup(b).then(()=>{toast('Backup restored');setTimeout(()=>location.reload(),600)},()=>toast('Couldn’t restore the backup: storage is full or blocked'))};
  rd.onerror=()=>toast('Couldn’t read that file');rd.readAsText(file)}
// The website moved from GitHub Pages. The old address opens this one with #move and hands over what was saved
// there (each address keeps its own storage). Only that page, and only into the tab it opened, can hand data over.
const OLD_ORIGIN='https://maheralshokry.github.io';
if(location.hash==='#move'&&window.opener&&!NATIVE&&location.origin!==OLD_ORIGIN){const from=window.opener;let got=false;
  addEventListener('message',e=>{if(got||e.origin!==OLD_ORIGIN||e.source!==from||!e.data||e.data.kind!=='bb-move')return;got=true;
    try{history.replaceState(null,'',location.pathname)}catch(_){}const b=backupParts(e.data.backup);
    const has=['bb-beans','bb-log','bb-scans','bb-myrecipes'].some(k=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)&&v.length}catch(_){return false}});
    if(!b||!b.ent.length){toast('Nothing to bring across');return}
    if(has&&!confirm('Bring across what you saved at the old address? It replaces what is saved here.'))return;
    applyBackup(b).then(()=>{try{from.postMessage({kind:'bb-moved'},OLD_ORIGIN)}catch(_){}try{sessionStorage.setItem('bb-movedin','1')}catch(_){}location.reload()},()=>toast('Couldn’t bring it across: storage is full or blocked'))});
  // Say hello until the old page answers (it may still be gathering photos).
  let n=0;const hi=()=>{if(got||n++>20)return;try{from.postMessage({kind:'bb-move-ready'},OLD_ORIGIN)}catch(_){}setTimeout(hi,500)};hi()}
try{if(sessionStorage.getItem('bb-movedin')){sessionStorage.removeItem('bb-movedin');setTimeout(()=>toast('Your coffees, brews and settings are here'),700)}}catch(e){}
function renderSettings(){const t=document.documentElement.getAttribute('data-theme')||'auto';
  const row=(icon,bg,title,sub,body)=>'<div class="setrow"><div class="sl">'+ico(icon,bg)+'<span class="mt"><b>'+title+'</b>'+(sub?'<small>'+sub+'</small>':'')+'</span></div>'+(body||'')+'</div>';
  const qt=(k,n,d)=>'<button type="button" class="qtool" data-go="'+k+'">'+ico(hubItem(k)[4],hubItem(k)[3])+'<span><b>'+n+'</b><small>'+d+'</small></span></button>';
  $('settings-in').innerHTML='<div class="quicktools">'+qt('gear','Gear and dials',MYG.length+' grinder'+(MYG.length>1?'s':'')+(MYB.length?', '+MYB.length+' brewer'+(MYB.length>1?'s':''):''))+qt('log','Brew log',LOG.length?LOG.length+' brew'+(LOG.length>1?'s':''):'Rate and keep your brews')+qt('guide','Guide','Ratios and fixes')+'</div>'+
    // In the Android app: its version, whether a newer one is out, and a button to check now (the website updates itself).
    (appVersion()?'<div class="appver'+(updLatest()?' new':'')+'">'+ico('download','#4F8A74')+'<span class="av-tx"><b>Brew Bench '+esc(appVersion())+'</b><small>'+esc(updNote())+'</small></span>'+
      '<div class="av-btns">'+(updLatest()?'<button type="button" class="btn" id="st-updgo">Update to '+esc(updLatest())+'</button>':'')+'<button type="button" class="btn'+(updLatest()?' ghost':'')+'" id="st-upd">Check for updates</button></div></div>':'')+
    '<h3 class="rh">Appearance</h3><div class="setgroup">'+
    row(curTheme()==='dark'?'moon':'sun','#5B5F66','Light or dark','Bright cream, cosy espresso, or follow your phone','<div class="seg" id="st-mode"></div>')+
    row('drop','var(--cherry)','Vibe','A whole look, in light and in dark','<div class="vibes">'+VIBES.map(([k,n,d,L,D])=>'<button type="button" class="vibe" data-vibe="'+k+'" aria-pressed="'+(UI.vibe===k)+'" style="--l-p:'+L.paper+';--l-s:'+L.surface+';--l-i:'+L.ink+';--l-c:'+L.cherry+';--l-h:'+L.honey+';--d-p:'+D.paper+';--d-s:'+D.surface+';--d-i:'+D.ink+';--d-c:'+D.cherry+';--d-h:'+D.honey+'"><span class="vb-pv" aria-hidden="true"><i class="vb-l"><u></u><s></s><em></em></i><i class="vb-d"><u></u><s></s><em></em></i></span><b>'+n+'</b><small>'+d+'</small></button>').join('')+'</div>')+
    row('drop','var(--cherry)','Accent','Change just the highlight colour (Vibe’s own keeps the vibe’s)','<div class="swatches">'+ACCENTS.map(([k,n,c])=>'<button type="button" class="swatch" data-accent="'+k+'" aria-pressed="'+(UI.accent===k)+'"><i style="background:'+(k==='classic'?(VIBES.find(v=>v[0]===UI.vibe)||VIBES[0])[curTheme()==='dark'?4:3].cherry:c)+'"></i>'+n+'</button>').join('')+'</div>')+
    row('leaf','#6B8E4E','App logo','In the top bar, the tab and on your home screen','<div class="logos">'+Object.entries(LOGOS).map(([k,[n]])=>'<button type="button" class="logopick" data-logo="'+k+'" aria-pressed="'+(UI.logo===k)+'"><span class="lg-tile">'+logoSVG(k,36)+'</span>'+n+'</button>').join('')+'</div><p class="setnote">'+(NATIVE&&plugin('AppIcon')?'Your home-screen icon changes to match a moment after you leave the app.':NATIVE?'The home-screen icon follows the logo from the next app update.':'The browser tab shows it too. In the Android app, the home-screen icon follows it.')+'</p>')+
    row('text','#C9964A','Text size','','<div class="seg" id="st-text"></div>')+
    row('wheel','#6E8FA8','Motion','Animations between pages and sheets','<div class="seg" id="st-motion"></div>')+
    row('globe','#4F8A74','Open the app on','The page you see first','<div class="seg" id="st-start"></div>')+'</div>'+
   // The coffee of the day: always on the Beans and Explore pages; in the Android app, also as a notification.
   '<h3 class="rh">Reminders</h3><div class="setgroup">'+row('hourglass','#8A5A3B','Coffee of the day','A coffee from your cabinet each day: a bag at its peak or running low, one from this day in an earlier year, or a memory from your diary.',
     window.BEANS_OK&&LN()?'<div class="setbtns"><div class="seg" id="st-remind"></div><input type="time" id="st-rtime" class="dateinp" value="'+REMIND.t+'" aria-label="Reminder time"'+(REMIND.on?'':' disabled')+'></div>'
       :'<p class="setnote" style="margin:0">It’s at the top of Beans and Explore each day. In the Android app it can also arrive as a notification at the time you choose.</p>')+
     row('book','#9A7390','Coffee fact of the day','Something worth knowing from Explore each day, in turn: a coffee word, a variety, an origin, a process, a brewing technique, a moment in history or a champion.',
       typeof LN==='function'&&LN()?'<div class="setbtns"><div class="seg" id="st-learn"></div><input type="time" id="st-ltime" class="dateinp" value="'+LEARN.t+'" aria-label="Fact time"'+(LEARN.on?'':' disabled')+'></div>'
         :'<p class="setnote" style="margin:0">Today’s is on the Explore page. In the Android app it can also arrive as a notification at the time you choose.</p>')+'</div>'+
   /* Gear, Guide and the Log are the buttons at the top. */
   '<h3 class="rh">Your data</h3><div class="setgroup">'+row('download','#8A5A3B','Back up and restore','Everything you’ve saved stays on this device: '+esc(dataSummary())+'. Save it as a file to keep it safe or move it to another phone.',
     '<div class="setbtns"><button type="button" class="btn" id="st-export">Export my data</button><button type="button" class="btn ghost" id="st-import">Import a backup</button><input type="file" id="st-file" accept="application/json,.json" hidden></div>')+'</div>'+
   (installed()?'':'<h3 class="rh">Install</h3><div class="setgroup">'+row('download','#9A7390','Add to your home screen','Use it like an app, offline too','<p class="setnote" style="margin:0"><b>iPhone (Safari):</b> tap the Share button, then <b>Add to Home Screen</b>.<br><b>Android (Chrome):</b> tap the ⋮ menu, then <b>Add to Home screen</b>.</p>')+'</div>')+
   '<h3 class="rh">About</h3><div class="setgroup">'+row('book','#8A5A3B','The Brew Bench','A coffee field guide and dial-in tool. What you save stays on this device, or syncs with your account if you sign in.','<p class="setnote" style="margin:0"><a href="'+SITE_URL+'privacy.html" target="_blank" rel="noopener">Privacy policy</a> · <a href="'+SITE_URL+'delete-account.html" target="_blank" rel="noopener">Delete your account</a></p>')+
     '</div>';
  seg('st-mode',[['light','Light'],['dark','Dark'],['auto','Auto']],()=>t,v=>{if(v==='auto'){document.documentElement.removeAttribute('data-theme');try{localStorage.removeItem('bb-theme')}catch(e){}}
    else{document.documentElement.setAttribute('data-theme',v);try{localStorage.setItem('bb-theme',v)}catch(e){}}syncThemeBtn();applyUI();renderSettings()});
  seg('st-text',[['s','Small'],['m','Standard'],['l','Large'],['xl','Larger']],()=>UI.text,v=>{UI.text=v;saveUI();renderSettings()});
  seg('st-motion',[['full','Full'],['reduced','Reduced']],()=>UI.motion,v=>{UI.motion=v;saveUI();renderSettings()});
  if($('st-remind')){seg('st-remind',[['0','Off'],['1','Every day']],()=>REMIND.on?'1':'0',async v=>{await setReminder(v==='1');renderSettings()});
    $('st-rtime').onchange=async e=>{if(/^\d\d:\d\d$/.test(e.target.value)){REMIND.t=e.target.value;save('bb-remind',REMIND);await scheduleReminders();toast('Your coffee of the day arrives at '+REMIND.t)}}}
  if($('st-learn')){seg('st-learn',[['0','Off'],['1','Every day']],()=>LEARN.on?'1':'0',async v=>{await setLearn(v==='1');renderSettings()});
    $('st-ltime').onchange=async e=>{if(/^\d\d:\d\d$/.test(e.target.value)){LEARN.t=e.target.value;save('bb-learn',LEARN);await scheduleFacts();toast('Your coffee fact arrives at '+LEARN.t)}}}
  seg('st-start',[['dial','Brew'],['recipes','Recipes'],['beans','Beans'],['explore','Explore']],()=>UI.start,v=>{UI.start=v;saveUI();renderSettings();toast('The app will open on '+TABNAMES[v])})}
$('settings-in').addEventListener('click',e=>{const vb=e.target.closest('.vibe[data-vibe]');if(vb){UI.vibe=vb.dataset.vibe;UI.accent='classic';saveUI();renderSettings();toast((VIBES.find(v=>v[0]===UI.vibe)||[])[1]+' on');return}const a=e.target.closest('.swatch[data-accent]');if(a){UI.accent=a.dataset.accent;saveUI();renderSettings();return}
  const l=e.target.closest('.logopick[data-logo]');if(l){UI.logo=l.dataset.logo;saveUI();renderSettings();return}
  if(e.target.closest('#st-export')){exportData();return}if(e.target.closest('#st-import')){$('st-file').click();return}});
$('settings-in').addEventListener('change',e=>{if(e.target.id==='st-file'){importData(e.target.files[0]);e.target.value=''}});
for(const id of ['explore-in','settings-in'])$(id).addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){showTab(g.dataset.go,false,true);return}
  const cb=e.target.closest('.cday[data-bean]');if(cb){openBean(cb.dataset.bean);return}
  const w=e.target.closest('[data-word]');if(w)openWord(w.dataset.word)});
// Older code and links may still ask for the sheets; they are pages now.
const openSheet=which=>showTab(which);
// The highlight behind the current nav button glides to the next one.
// The highlight under the current bottom-bar button moves like a drop of liquid: its leading edge reaches the new
// button first and the rest follows, stretching and settling on the way.
let PILL=null;
function movePill(){const nav=document.querySelector('.bottomnav'),pill=nav&&nav.querySelector('.bn-pill'),b=nav&&nav.querySelector('[aria-current="true"]');if(!pill)return;
  if(!b||!nav.offsetWidth){pill.style.opacity=0;PILL=null;return}const x1=b.offsetLeft,w1=b.offsetWidth,from=PILL;PILL={x:x1,w:w1};
  pill.style.transition='none';pill.style.opacity=1;pill.style.width=w1+'px';pill.style.transform='translateX('+x1+'px)';
  if(!from||RM()||(from.x===x1&&from.w===w1)||!pill.animate)return;const right=x1>from.x,
    mid=right?{x:from.x+(x1-from.x)*.3,r:x1+w1}:{x:x1,r:from.x+from.w-(from.x+from.w-x1-w1)*.3};
  pill.animate([{transform:'translateX('+from.x+'px)',width:from.w+'px'},{offset:.42,transform:'translateX('+mid.x+'px) scaleY(.86)',width:(mid.r-mid.x)+'px'},
    {offset:.78,transform:'translateX('+(x1+(right?3:-3))+'px) scaleY(1.04)',width:(w1-2)+'px'},{transform:'translateX('+x1+'px)',width:w1+'px'}],{duration:620,easing:'cubic-bezier(.3,.7,.25,1)'})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(movePill);
addEventListener('resize',()=>soon(movePill));
document.querySelector('.bottomnav').onclick=e=>{const b=e.target.closest('[data-bn]');if(b)showTab(b.dataset.bn,false,true)};
$('ab-share').onclick=()=>{const id=(document.querySelector('main section.on')||{}).id;
  if(id==='dial')openShare(dialDoc());else if(id==='scan')$('sc-share').click();else if(id==='history')openShare(historyDoc());else if(id==='log')openShare(logDoc());else if(id==='map'){if(SEL)openShare(originDoc(SEL));else toast('Pick an origin first')}else if(id==='recipes'&&rListed())openShare(recipesDoc());else if(id==='words')openShare(wordsDoc());else if(id==='flow')openShare(flowDoc());else if(id==='wheel')openShare(wheelDoc())};
$('dial-share').onclick=()=>openShare(dialDoc());
$('ab-back').onclick=()=>history.back();
// The Android back gesture asks here first: close the top sheet, or step back a screen. False means there is nothing
// left to go back to, so the app goes to the background like any other.
window.bbBack=()=>{const d=[...document.querySelectorAll('dialog[open]:not(.closing)')].pop();
  if(d){if(history.state&&history.state.dlg)history.back();else d.close();return true}
  if(NAVD>0){history.back();return true}
  if(!document.getElementById('dial').classList.contains('on')){showTab('dial');NAVD=0;syncShell('dial');return true}
  return false};
$('hist-share').onclick=()=>openShare(historyDoc());
$('l-pdf').onclick=()=>openShare(logDoc());

/* ================= THEME ================= */
function curTheme(){return document.documentElement.getAttribute('data-theme')||(MQ('(prefers-color-scheme: dark)')?'dark':'light')}
function syncThemeBtn(){const t=curTheme();$('themebtn').textContent=t==='dark'?'Light':'Dark';
  // Once a theme is chosen by hand, the browser bar follows it rather than the system setting.
  if(document.documentElement.hasAttribute('data-theme'))document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.content=t==='dark'?'#1F1814':'#FBF7F0')}
$('themebtn').onclick=()=>{const n=curTheme()==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);try{localStorage.setItem('bb-theme',n)}catch(e){}syncThemeBtn()};
syncThemeBtn();

/* ================= APP UPDATES ================= */
// The Android app installed from the download link can't update itself, so it looks for a newer release on GitHub
// (when it opens, at most every 6 hours) and offers it. The website updates on its own, so this is the app only.
const UPD_API='https://api.github.com/repos/MaherAlShokry/brew-bench/releases/latest',APK_URL='https://github.com/MaherAlShokry/brew-bench/releases/latest/download/brew-bench.apk';
const appVersion=()=>NATIVE&&typeof APP_VERSION==='string'&&/^\d+(\.\d+)*$/.test(APP_VERSION)?APP_VERSION:'';
const verNewer=(a,b)=>{const x=String(a).replace(/^v/,'').split('.').map(n=>+n||0),y=String(b).replace(/^v/,'').split('.').map(n=>+n||0);
  for(let i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)>(y[i]||0)}return false};
let UPD=load('bb-upd',{});if(!UPD||typeof UPD!=='object')UPD={};
const updLatest=()=>typeof UPD.latest==='string'&&/^v?\d+(\.\d+)*$/.test(UPD.latest)&&verNewer(UPD.latest,appVersion())?UPD.latest.replace(/^v/,''):'';
function updNote(){const l=updLatest();return l?'Version '+l+' is ready to install.':UPD.at?'Up to date. Checked '+fmtAgo(UPD.at)+'.':'Updates are checked when the app opens.'}
const fmtAgo=t=>{const m=Math.round((Date.now()-t)/60000);return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' days ago'};
async function checkUpdate(force){if(!appVersion()||navigator.onLine===false)return null;
  if(!force&&UPD.at&&Date.now()-UPD.at<6*3600e3){showUpdate();return updLatest()}
  try{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),8000);const r=await fetch(UPD_API,{headers:{Accept:'application/vnd.github+json'},signal:ctl.signal});clearTimeout(t);
    if(!r.ok)return null;const j=await r.json();if(j&&typeof j.tag_name==='string')UPD.latest=j.tag_name;UPD.at=Date.now();save('bb-upd',UPD)}catch(e){return null}
  showUpdate(force);return updLatest()}
// A small card above the bottom bar. "Later" hides it until a newer version still, or for three days.
function showUpdate(force){const l=updLatest(),old=$('updcard');if(!l||(!force&&UPD.later===l&&Date.now()-(UPD.laterAt||0)<3*864e5)){if(old)old.remove();return}
  if(old)return;const c=document.createElement('div');c.id='updcard';c.className='updcard';c.setAttribute('role','status');
  c.innerHTML='<span class="upd-ic" aria-hidden="true">'+ico('download','#4F8A74')+'</span><span class="upd-tx"><b>A new version is ready</b><small>Version '+esc(l)+' · you have '+esc(appVersion())+'</small></span>'+
    '<button type="button" class="btn" id="upd-go">Update</button><button type="button" class="upd-x" id="upd-later" aria-label="Later">✕</button>';
  document.body.appendChild(c);
  $('upd-go').onclick=()=>{c.remove();toast('Downloading the new version. Open it when it finishes to install');openLink(APK_URL)};
  $('upd-later').onclick=()=>{UPD.later=l;UPD.laterAt=Date.now();save('bb-upd',UPD);c.classList.add('out');setTimeout(()=>c.remove(),260)}}
if(appVersion()){setTimeout(()=>checkUpdate(),4000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkUpdate()})}
document.addEventListener('click',e=>{if(e.target.closest('#st-updgo')){toast('Downloading the new version. Open it when it finishes to install');openLink(APK_URL);return}
  if(e.target.closest('#st-upd')){const b=e.target.closest('#st-upd');b.disabled=true;b.textContent='Checking…';
  checkUpdate(true).then(l=>{if(l===null)toast('Couldn’t check just now. Try again when you’re online');else if(!l)toast('You have the latest version');renderSettings()})}});

/* ================= A COFFEE FACT A DAY ================= */
// One thing worth knowing from Explore each day, taking the kinds in turn (a word, a variety, an origin, a process, a
// technique, a moment in history, a champion) and a different one of each kind every time it comes round. The same day
// gives the same fact, on the Explore page and in the notification.
const FACT_KINDS=['word','variety','origin','process','tech','history','champ'],FACT_ICON={word:'📖',variety:'🌱',origin:'🗺️',process:'🧪',tech:'☕',history:'📜',champ:'🏆'};
function factFor(day){const k=FACT_KINDS[((day%7)+7)%7],round=Math.floor(day/7),pick=n=>(Math.imul(round+1,2654435761)>>>0)%n;
  const trim=(t,n)=>{t=String(t||'').replace(/\s+/g,' ').trim();if(t.length<=n)return t;const c=t.slice(0,n),i=c.lastIndexOf('. ');return i>n*.45?c.slice(0,i+1):c.slice(0,c.lastIndexOf(' '))+'…'};
  if(k==='word'){const w=GLOSSARY[pick(GLOSSARY.length)];return{k,tag:'Coffee word',title:w[0],text:trim(w[2],230),go:{word:w[0]}}}
  if(k==='variety'){const vs=V.filter(v=>v.story&&v.fam!=='species'),v=vs[pick(vs.length)];return{k,tag:'Variety',title:v.name,text:trim(v.story,230),go:{variety:v.id}}}
  if(k==='origin'){const ks=Object.keys(O).filter(x=>O[x].hist),id=ks[pick(ks.length)],o=O[id];return{k,tag:'Origin',title:o.name,text:trim(o.hist,230),go:{origin:id}}}
  if(k==='process'){const ks=Object.keys(PROCESSES),id=ks[pick(ks.length)],p=PROCESSES[id];return{k,tag:'Process',title:p.name,text:trim(p.char,230),go:{process:id}}}
  if(k==='tech'){const t=TECH[pick(TECH.length)];return{k,tag:'Technique',title:t[1],text:trim(t[2]+' '+t[3],230),go:{tab:'tech'}}}
  if(k==='history'){const t=TIMELINE[pick(TIMELINE.length)];return{k,tag:'From history',title:t[1],text:trim(t[0]+'. '+t[2],230),go:{tab:'history'}}}
  const cs=CHAMPS.filter(c=>c.note),c=cs[pick(cs.length)];return{k:'champ',tag:'Champions',title:c.who+', '+COMPS[c.c].short+' '+c.y,text:trim(c.note+(c.coffee?' Brewed with '+c.coffee+'.':''),230),go:{champ:CHAMPS.indexOf(c)}}}
// The Explore page shows it under the word of the day (on word days, the word of the day already is one).
function factCard(day){const f=factFor(day);if(f.k==='word')return '';
  return '<button type="button" class="wotd fact" data-fact="'+day+'"><small>Did you know · '+esc(f.tag)+'</small><b>'+esc(f.title)+'</b><span>'+esc(f.text)+'</span></button>'}
function goFact(g){if(!g)return;if(g.word)openWord(g.word);else if(g.variety)openVariety(g.variety);else if(g.origin){goTab('map');selectOrigin(g.origin,true)}
  else if(g.process)openProcess(g.process);else if(g.champ!=null&&CHAMPS[g.champ]){showTab('champs');openChamp(CHAMPS[g.champ])}else if(g.tab)showTab(g.tab)}
$('explore-in').addEventListener('click',e=>{const f=e.target.closest('[data-fact]');if(f){e.stopPropagation();goFact(factFor(+f.dataset.fact).go)}},true);
// In the Android app it can also arrive as a notification: the next two weeks are scheduled ahead, and again on opening.
let LEARN=(v=>({on:!!(v&&v.on),t:v&&/^\d\d:\d\d$/.test(v.t)?v.t:'19:00'}))(load('bb-learn',null));
const FIDS=[...Array(14)].map((_,i)=>7201+i);
async function scheduleFacts(){const ln=typeof LN==='function'&&LN();if(!ln)return false;
  try{await ln.cancel({notifications:FIDS.map(id=>({id}))})}catch(e){}
  if(!LEARN.on)return true;const [h,m]=LEARN.t.split(':').map(Number),now=new Date(),list=[];
  for(let i=0;i<14;i++){const at=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i,h,m);if(at<=now)continue;const day=Math.floor((at-at.getTimezoneOffset()*6e4)/864e5),f=factFor(day);
    list.push({id:FIDS[i],title:FACT_ICON[f.k]+' '+f.tag+': '+f.title,body:f.text,largeBody:f.text,schedule:{at,allowWhileIdle:true},isExactNotification:false,extra:{fact:f.go}})}
  try{if(list.length)await ln.schedule({notifications:list});return true}catch(e){return false}}
async function setLearn(on){const ln=typeof LN==='function'&&LN();
  if(on&&!LEARN.on){if(!ln){toast('Phone reminders work in the Android app');return false}
    try{let p=await ln.checkPermissions();if(p.display!=='granted')p=await ln.requestPermissions();if(p.display!=='granted'){toast('Allow notifications for Brew Bench in your phone’s settings first');return false}}catch(e){toast('Couldn’t turn on reminders');return false}}
  LEARN.on=on;save('bb-learn',LEARN);await scheduleFacts();if(on)toast('Your coffee fact arrives at '+LEARN.t);return true}
setTimeout(()=>{const ln=typeof LN==='function'&&LN();if(!ln)return;
  try{ln.addListener('localNotificationActionPerformed',a=>{const g=a&&a.notification&&a.notification.extra&&a.notification.extra.fact;if(g)goFact(g)})}catch(e){}
  if(LEARN.on)scheduleFacts()},3200);

/* ================= INIT ================= */
// Drawings that loop (the pour on the Dial-in page) pause while they're out of sight, so the phone isn't redrawing
// something nobody can see.
if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('offscreen',!e.isIntersecting)));
  new Set([...document.querySelectorAll('.stream,.steam')].map(x=>x.closest('svg')).filter(Boolean)).forEach(x=>io.observe(x))}
// Label each cell with its column heading so tables can stack into cards on phones.
document.querySelectorAll('table.ref').forEach(t=>{const hs=[...t.querySelectorAll('thead th')].map(h=>h.textContent.trim());t.querySelectorAll('tbody tr').forEach(r=>[...r.children].forEach((c,i)=>{if(hs[i])c.dataset.label=hs[i]}))});
// If saved settings ever stop the app from starting, clear them (the brew log and scans are kept) and retry once.
// The dial-in's recipe, by key. A state saved before keys were kept points at the list as it was then (76 built-in
// recipes); the ones folded together lead to the recipe they joined.
{const OLD_GONE={22:'r:mugen-small-cup',26:'r:kalita-for-darker-roasts',43:'r:ristretto',44:'r:long-shot-allonge',53:'r:4-6-sweeter',54:'r:4-6-lighter-and-cleaner',55:'r:4-6-fuller-body',59:'r:two-cup-v60',64:'r:chemex-for-one',65:'r:kalita-big-batch',73:'r:ready-to-drink-cold-brew'};
  const st=load('bb-state',{});let i=null;
  if(typeof st.reck==='string')i=rByKey(st.reck);
  else if(Number.isInteger(st.rec)&&st.rec>=0)i=OLD_GONE[st.rec]?rByKey(OLD_GONE[st.rec]):st.rec-Object.keys(OLD_GONE).filter(k=>+k<st.rec).length;
  if(st.rec!=null||st.reck){S.rec=i!=null&&i>=0&&RECIPES[i]?i:null;if(S.rec==null)S.tuned=null}}
try{initDial();render();renderCalc();renderTS();renderStars();renderLog();initScan();}
catch(err){let retried=false;try{retried=sessionStorage.getItem('bb-reset')==='1';sessionStorage.setItem('bb-reset','1')}catch(e){}
  if(!retried){try{['bb-state','bb-plan','bb-scan','bb-calc','bb-base3'].forEach(k=>localStorage.removeItem(k))}catch(e){}location.reload()}throw err}
try{sessionStorage.removeItem('bb-reset')}catch(e){}
applyUI();
{let h=location.hash.slice(1);if(h==='more')h='settings';if(!openRoute(h)){if(h&&$(h)&&$(h).tagName==='SECTION')showTab(h,true);else if(!h&&UI.start!=='dial'&&$(UI.start))showTab(UI.start,true);else syncShell('dial')}}
// Moves animate only once the app has opened: the first page appears in place.
requestAnimationFrame(()=>{NAV_READY=true});
prebuildTabs();
if(GROUP)startStream();
if(window.claude&&window.claude.use){
  window.claude.use('sample').then(async s=>{SAMPLE=s;if(!s)return;
    try{const l=await s.limits();IMGS=!!(l&&l.images);if(IMGS)$('scan-file').accept=$('scan-cam').accept=l.images.mediaTypes.join(',')}catch(e){IMGS=false}
    $('scan-go').disabled=!SFILE}).catch(()=>{});
  window.claude.use('downloads').then(d=>{DL=d;renderLog()}).catch(()=>{});
}else{$('scan-status').hidden=true;$('scan-lede').textContent='Take a photo of the bag or the roaster’s card. The text is read on your phone, matched to the guide and turned into a brew plan for your gear.'}
