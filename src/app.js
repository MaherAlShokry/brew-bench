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
const GRINDERS={
  zp6:{name:'ZP6 Special',per:90,um:22,min:20,max:90,step:7.3,body:-0.4,clarity:1.2},
  kultra:{name:'K-Ultra',per:100,um:20,min:5,max:110,step:8,body:0.7,clarity:-0.2}
};
function dial(g,c){const G=GRINDERS[g];c=Math.round(c);const r=Math.floor(c/G.per),rem=c%G.per;return (r>0?r+'.':'')+Math.floor(rem/10)+'.'+(rem%10)}
function dialHint(g,c){const G=GRINDERS[g];c=Math.round(c);const r=Math.floor(c/G.per),rem=c%G.per;return (r?r+' rotation, ':'')+'number '+Math.floor(rem/10)+', click '+(rem%10)+' ('+c+' clicks)'}
function roundG(g,v){const G=GRINDERS[g];return Math.round(clamp(v,G.min,G.max))}
const canGrind=(g,b)=>BREWERS[b].base[g]!=null;
let BASE=load('bb-base3',null);
function defBase(){const o={zp6:{},kultra:{}};for(const k in BREWERS){o.zp6[k]=BREWERS[k].base.zp6;o.kultra[k]=BREWERS[k].base.kultra}return o}
if(BASE&&!['zp6','kultra'].every(g=>BASE[g]&&typeof BASE[g]==='object'))BASE=null;
if(!BASE||!BASE.zp6){BASE=defBase();const old=load('bb-base2',null);if(old&&old.zp6)for(const g of['zp6','kultra'])for(const k in old[g])if(BASE[g][k]!==undefined&&old[g][k]!=null)BASE[g][k]=old[g][k]}
for(const k in BREWERS)for(const g of['zp6','kultra'])if(BASE[g][k]===undefined||(BASE[g][k]!==null&&!Number.isFinite(BASE[g][k])))BASE[g][k]=BREWERS[k].base[g];
function base(g,b){const v=BASE[g][b];return v==null?BREWERS[b].base[g]:v}
function settingFor(g,b,off){const bb=base(g,b);return bb==null?null:roundG(g,bb-off*GRINDERS[g].step)}
function gLabel(g,v){return GRINDERS[g].name+' '+dial(g,v)}
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
S.grinder=oneOf(S.grinder,['zp6','kultra'],'zp6');S.agit=oneOf(S.agit,['low','med','high'],'med');S.roast=oneOf(S.roast,['light','medium','dark'],'light');
S.setting=num(S.setting,56);S.temp=num(S.temp,93);S.ratio=num(S.ratio,15);S.bloom=num(S.bloom,45);if(S.rec!=null&&!RECIPES[S.rec])S.rec=null;
if(typeof S.variety!=='string'||!vById(S.variety))S.variety='caturra';if(!BREWERS[S.brewer]||!BREWERS[S.brewer].model)S.brewer='v60';if(!PROCESSES[S.process])S.process='washed';
if(S.grinder==='kultra'&&S.setting<30&&S.setting>5&&S.setting%1)S.setting=Math.round(S.setting*10);
if(!canGrind(S.grinder,S.brewer))S.grinder='kultra';S.setting=roundG(S.grinder,S.setting);
let LOG=load('bb-log',[]);

/* ================= MODEL ================= */
function rBias(r){const B=BREWERS[r.b];return -(0.45*r.off+(r.temp-93)/3*0.35+(r.water/r.dose-B.ratio.ref)*B.ratio.k)}
function compute(st){
  const G=GRINDERS[st.grinder],B=BREWERS[st.brewer],P=PROCESSES[st.process],Vp=vParams(st.variety);
  const step=(base(st.grinder,st.brewer)-st.setting)/G.step;
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
  const ax=[['Sweetness',r.sweet],['Acidity',r.acid],['Body',r.body],['Clarity',r.clarity],['Bitterness',r.bitter]];
  const R=88,pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/5;return[150+Math.cos(a)*R*v/10,150+Math.sin(a)*R*v/10]};
  let g='';for(const k of[2.5,5,7.5,10])g+='<polygon points="'+ax.map((_,i)=>pt(i,k).join(',')).join(' ')+'" fill="none" stroke="rgba(255,255,255,.18)"/>';
  g+=ax.map((_,i)=>{const p=pt(i,10);return'<line x1="150" y1="150" x2="'+p[0]+'" y2="'+p[1]+'" stroke="rgba(255,255,255,.18)"/>'}).join('');
  const lab=ax.map((a,i)=>{const an=-Math.PI/2+i*2*Math.PI/5,hw=textW(a[0],'600 11px')/2+4;return'<text x="'+clamp(150+Math.cos(an)*132,hw,300-hw).toFixed(1)+'" y="'+(154+Math.sin(an)*132).toFixed(1)+'" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">'+a[0]+'</text>'}).join('');
  $('cup').innerHTML='<circle cx="150" cy="150" r="146" fill="var(--surface2)"/><circle cx="150" cy="150" r="116" fill="var(--paper)" stroke="var(--line)" stroke-width="2"/>'+
   '<circle cx="150" cy="150" r="104" fill="'+liquid(r.D)+'" style="transition:fill .4s ease"/><circle cx="150" cy="150" r="104" fill="none" stroke="rgba(255,235,200,.35)" stroke-width="3"/>'+g+
   '<polygon points="'+ax.map((a,i)=>pt(i,a[1]).join(',')).join(' ')+'" fill="rgba(255,245,225,.30)" stroke="#FFF3DD" stroke-width="2" stroke-linejoin="round"/>'+
   ax.map((a,i)=>{const p=pt(i,a[1]);return'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="#FFF3DD"/>'}).join('')+lab;
}
function drawDial(id,g,c){
  const G=GRINDERS[g],svg=$(id);if(!svg)return;c=Math.round(c);const nums=G.per/10,rem=c%G.per,rot=Math.floor(c/G.per);
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
const grinderOpts=b=>[['zp6','ZP6 Special',canGrind('zp6',b)?'':'Too coarse for this brewer'],['kultra','K-Ultra',canGrind('kultra',b)?'':'Not suitable']];

/* ================= DIAL-IN ================= */
function convertSetting(st,g2,b2){if(!canGrind(g2,b2))return null;const step=(base(st.grinder,st.brewer)-st.setting)/GRINDERS[st.grinder].step;return roundG(g2,base(g2,b2)-step*GRINDERS[g2].step)}
function fitRanges(){const B=BREWERS[S.brewer];S.ratio=clamp(S.ratio,B.ratio.min,B.ratio.max);S.temp=clamp(S.temp,B.temp.min,B.temp.max);S.bloom=clamp(S.bloom,B.bloom.min,B.bloom.max)}
function render(){
  const G=GRINDERS[S.grinder],B=BREWERS[S.brewer];
  seg('g-grinder',grinderOpts(S.brewer),()=>S.grinder,v=>{if(v!==S.grinder){S.setting=convertSetting(S,v,S.brewer);S.grinder=v}render()});
  seg('g-agit',[['low','Gentle'],['med','Normal'],['high','Vigorous']],()=>S.agit,v=>{S.agit=v;render()});
  seg('g-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>S.roast,v=>{S.roast=v;render()});
  const gi=$('i-grind');gi.min=G.min;gi.max=G.max;gi.step=1;gi.value=S.setting;
  $('v-grind').textContent=dial(S.grinder,S.setting);drawDial('dialsvg',S.grinder,S.setting);
  const r=compute(S);
  $('v-grindhint').textContent='('+S.setting+' clicks) '+(Math.abs(r.step)<0.15?'at your baseline':(r.step>0?'finer':'coarser')+' than baseline');
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
  if(Math.abs(r.D)>0.4){const t=roundG(S.grinder,S.setting+r.D/0.45*G.step);const diff=Math.abs(t-S.setting);const ta=clamp(Math.round(S.temp-r.D/0.35*3),B.temp.min,B.temp.max);
    tips.push('To land in the sweet spot, try <b>'+gLabel(S.grinder,t)+'</b> ('+diff+' clicks '+(r.D>0?'coarser':'finer')+')'+(ta!==S.temp?', or keep the grind and move the water to <b>'+ta+'°C</b>.':'.'))}
  if(r.clarity<4&&r.body>6.5&&B.ratio.ref>10)tips.push('Body is crowding out detail. The ZP6 Special, V60, V60 NEO or Chemex will separate the flavours more.');
  if(r.body<3.5&&r.D>-0.45&&B.ratio.ref>10)tips.push('Balanced but light. The K-Ultra, an immersion brewer or a tighter ratio will add weight.');
  if(P.funk>=1.2&&S.temp>92)tips.push(P.name+' coffees get harsh with hot water. Try 88 to 91°C.');
  if(vParams(S.variety).clarity>=0.8&&S.agit==='high')tips.push('Vigorous agitation flattens delicate aromatics. Go gentle.');
  if(S.roast==='dark'&&S.temp>92)tips.push('Dark roasts extract fast. 88 to 90°C keeps bitterness down.');
  if(P.cat==='decaf')tips.push('Decaf extracts faster than regular coffee. Start a few clicks coarser.');
  if(!tips.length)tips.push('Nothing to change on paper. Brew it, then adjust by taste.');
  $('o-tips').innerHTML=tips.map(t=>'<div class="tip">'+t+'</div>').join('');
  save('bb-state',S);
}
function renderCal(){
  $('caltbody').innerHTML=MODEL.map(k=>{const b=BREWERS[k];const cell=g=>b.base[g]==null?'<td class="hint">n/a</td>':'<td><input type="number" step="1" data-g="'+g+'" data-b="'+k+'" value="'+base(g,k)+'" aria-label="'+GRINDERS[g].name+' clicks, '+esc(b.name)+'"> <span class="hint">'+dial(g,base(g,k))+'</span></td>';return'<tr><td>'+esc(b.name)+'</td>'+cell('zp6')+cell('kultra')+'</tr>'}).join('');
}
function initDial(){
  $('i-brewer').innerHTML=brewerOptions(MODEL);
  for(const id of['i-process','p-process','s-process'])$(id).innerHTML=processOptions();
  for(const id of['i-variety','p-variety','s-variety'])$(id).innerHTML=varietyOptions();
  $('i-grind').oninput=e=>{S.setting=+e.target.value;soon(render)};
  $('i-temp').oninput=e=>{S.temp=+e.target.value;soon(render)};
  $('i-ratio').oninput=e=>{S.ratio=+e.target.value;soon(render)};
  $('i-bloom').oninput=e=>{S.bloom=+e.target.value;soon(render)};
  $('i-brewer').onchange=e=>{const nb=e.target.value;let g=S.grinder;if(!canGrind(g,nb)){g='kultra';toast('The ZP6 Special can\u2019t grind fine enough for this, switched to the K-Ultra')}
    S.setting=canGrind(S.grinder,S.brewer)&&canGrind(g,nb)?convertSetting(S,g,nb):base(g,nb);S.grinder=g;S.brewer=nb;S.rec=null;
    const B=BREWERS[nb];if(S.ratio<B.ratio.min||S.ratio>B.ratio.max)S.ratio=B.ratio.def;if(S.bloom<B.bloom.min||S.bloom>B.bloom.max)S.bloom=B.bloom.def;fitRanges();render()};
  $('rec-chip').onclick=e=>{if(e.target.closest('[data-clear]')){S.rec=null;render()}};
  $('i-process').onchange=e=>{S.process=e.target.value;render()};
  $('i-variety').onchange=e=>{S.variety=e.target.value;render()};
  $('v-about').onclick=()=>openVariety(S.variety.split(':')[0]);
  renderCal();
  $('caltbody').oninput=e=>{const i=e.target;if(!i.dataset.g)return;const v=parseFloat(i.value);if(isNaN(v))return;BASE[i.dataset.g][i.dataset.b]=Math.round(v);save('bb-base3',BASE);i.nextElementSibling.textContent=dial(i.dataset.g,v);render();renderRecipes();renderPlan();renderGrindMap()};
  $('calreset').onclick=()=>{BASE=defBase();save('bb-base3',BASE);renderCal();render();renderRecipes();renderPlan();renderGrindMap();toast('Calibration reset')};
}

/* ================= PLANNER ================= */
let PL=Object.assign({brewer:'v60',grinder:'zp6',tech:0,process:'washed',variety:'pinkbourbon',roast:'light',age:14,goal:'balance'},load('bb-plan',{}));
if(!vById(PL.variety))PL.variety='pinkbourbon';if(!PROCESSES[PL.process])PL.process='washed';
const PBREWERS=MODEL.filter(k=>k!=='swi'&&RECIPES.some(r=>r.b===k||((k==='sw'||k==='swneo')&&r.b==='swi')));
if(!PBREWERS.includes(PL.brewer))PL.brewer='v60';
function techList(b){const all=RECIPES.map((r,i)=>[r,i]);return all.filter(([r])=>r.b===b).concat(all.filter(([r])=>(b==='sw'||b==='swneo')&&r.b==='swi'))}
function plan(c){
  const tl=techList(c.brewer);if(!tl.find(([,i])=>i===c.tech))c.tech=tl[0][1];
  const r=RECIPES[c.tech],B=BREWERS[r.b],P=PROCESSES[c.process],Vp=vParams(c.variety),Vv=vById(c.variety);
  let grinder=c.grinder;if(!canGrind(grinder,r.b))grinder='kultra';
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
  if(grinder!==c.grinder)why.unshift('The ZP6 Special can\u2019t grind this fine, so settings are for the K-Ultra.');
  const Dt={clarity:-0.3,balance:0,body:0.3}[c.goal];
  const agv={low:-0.25,med:0,high:0.25}[agit], roastE={light:0,medium:0.25,dark:0.6}[c.roast];
  const rest=(temp-r.temp)/3*0.35+(bloom-B.bloom.def)/15*0.12+agv+(ratio-r.water/r.dose)*B.ratio.k+roastE-(P.t+Vp.t);
  const step=r.off+(Dt-rest)/0.45;
  const set={};for(const g of['zp6','kultra'])set[g]=canGrind(g,r.b)?roundG(g,base(g,r.b)-step*GRINDERS[g].step):null;
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
  const other=p.grinder==='zp6'?'kultra':'zp6';const agl={low:'Gentle',med:'Normal',high:'Vigorous'}[p.agit];
  const gcell=g=>p.set[g]==null?'<div><b>'+GRINDERS[g].name+'</b><span>n/a</span><small>can\u2019t grind this fine</small></div>':'<div><b>'+GRINDERS[g].name+'</b><span>'+dial(g,p.set[g])+'</span><small>'+p.set[g]+' clicks from zero</small></div>';
  return '<p class="hint" style="margin:0">'+esc(B.name)+' with '+GRINDERS[p.grinder].name+'</p><h2>'+esc(p.r.name)+'</h2><p class="hint" style="margin-top:0">'+esc(p.r.by)+'</p>'+
   '<p>'+esc(PROCESSES[c.process].name)+' '+esc(vName(c.variety))+', '+c.roast+' roast. Predicted: <b>'+vt+'</b>.</p>'+
   '<div class="specs">'+gcell(p.grinder)+gcell(other)+
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
  seg('p-grinder',grinderOpts(PL.brewer),()=>PL.grinder,v=>{PL.grinder=v;renderPlan()});
  seg('p-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>PL.roast,v=>{PL.roast=v;renderPlan()});
  seg('p-goal',[['clarity','Clarity'],['balance','Balance'],['body','Sweetness and body']],()=>PL.goal,v=>{PL.goal=v;renderPlan()});
  const tl=techList(PL.brewer);if(!tl.find(([,i])=>i===PL.tech))PL.tech=tl[0][1];
  $('p-tech').innerHTML=tl.map(([r,i])=>'<option value="'+i+'">'+esc(r.name)+'</option>').join('');
  $('p-tech').value=PL.tech;$('p-process').value=PL.process;$('p-variety').value=PL.variety;$('p-age').value=PL.age;$('pv-age').textContent=PL.age+' days';
  const p=plan(PL);
  $('p-out').innerHTML=planHTML(p,PL)+'<div class="actions"><button class="btn" id="p-load">Open in dial-in</button><button class="btn ghost" id="p-timer">Start brew timer</button><button class="btn ghost" id="p-share">Share</button><button class="btn ghost" id="p-var">About '+esc(vById(PL.variety).name)+'</button></div>';
  $('p-load').onclick=()=>{Object.assign(S,p.st);render();showTab('dial');toast('Loaded into the dial-in')};
  $('p-timer').onclick=()=>openTimer(PL.tech,p);$('p-share').onclick=()=>openShare(recipeDoc(PL.tech,p));
  $('p-var').onclick=()=>openVariety(PL.variety.split(':')[0]);
  save('bb-plan',PL);
}
function initPlan(){
  $('p-brewer').innerHTML=brewerOptions(PBREWERS);
  $('p-brewer').onchange=e=>{PL.brewer=e.target.value;PL.tech=techList(PL.brewer)[0][1];if(!canGrind(PL.grinder,PL.brewer))PL.grinder='kultra';renderPlan()};
  $('p-tech').onchange=e=>{PL.tech=+e.target.value;renderPlan()};
  $('p-process').onchange=e=>{PL.process=e.target.value;renderPlan()};
  $('p-variety').onchange=e=>{PL.variety=e.target.value;renderPlan()};
  $('p-age').oninput=e=>{PL.age=+e.target.value;soon(renderPlan)};
}

/* ================= BREW TIMER ================= */
let TM=null;
function parseSteps(steps){let last=-1;return steps.map(s=>{const m=s.match(/(\d+):(\d\d)/);let t=m?(+m[1]*60+ +m[2]):null;if(t==null)t=last;else last=t;return{t,s}})}
function openTimer(idx,p){
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
const LAZY={gear:buildGear,recipes:renderRecipes,tech:renderTech,process:renderProcesses,variety:renderVarieties,map:buildMap,history:()=>{buildTree();startQuiz()}},BUILT={};
function ensureTab(id){document.querySelectorAll('.bean-fx').forEach(b=>b.remove());if(LAZY[id]&&!BUILT[id]){BUILT[id]=1;LAZY[id]()}}
function showTab(id,fromHistory){ensureTab(id);document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x.dataset.t===id));
  document.querySelectorAll('main section').forEach(s=>s.classList.toggle('on',s.id===id));window.scrollTo({top:0});
  const t=document.querySelector('.tab[data-t="'+id+'"]');if(t)t.scrollIntoView({block:'nearest',inline:'center'});
  // Each tab gets a history entry, so the back button (browser or Android) returns to the last tab.
  if(!fromHistory&&location.hash!=='#'+id)try{history.pushState(null,'','#'+id)}catch(e){}syncShell(id)}
try{history.scrollRestoration='manual'}catch(e){}
// Lock the page behind any open dialog or sheet so it can't scroll underneath.
{const sync=()=>document.documentElement.classList.toggle('locked',!!document.querySelector('dialog[open]'));
  const mo=new MutationObserver(sync);document.querySelectorAll('dialog').forEach(d=>{mo.observe(d,{attributes:true,attributeFilter:['open']});d.addEventListener('close',sync)})}
// An open dialog also gets a history entry, so back closes it instead of leaving the tab.
{const sm=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){if(!this.open){try{history.pushState({dlg:1},'',location.hash||'#dial')}catch(e){}
  this.addEventListener('close',()=>{if(history.state&&history.state.dlg)history.back()},{once:true})}return sm.call(this)}}
addEventListener('popstate',()=>{const open=[...document.querySelectorAll('dialog[open]')];if(open.length){open.forEach(d=>d.close());return}
  const h=location.hash.slice(1),id=h&&$(h)&&$(h).tagName==='SECTION'?h:'dial';if(!$(id).classList.contains('on'))showTab(id,true)});
document.querySelector('[role=tablist]').onclick=e=>{const t=e.target.closest('.tab');if(t)showTab(t.dataset.t)};

/* ================= RECIPES ================= */
let RF='all';
function renderRecipes(){
  const types=[...new Set(Object.values(BREWERS).map(b=>b.type))];
  seg('rfilter',[['all','All'],...types.map(t=>[t,t])],()=>RF,v=>{RF=v;renderRecipes()});
  const list=RECIPES.map((r,i)=>[r,i]).filter(([r])=>RF==='all'||BREWERS[r.b].type===RF);
  $('rgrid').innerHTML=list.map(([r,i])=>{const B=BREWERS[r.b];const z=settingFor('zp6',r.b,r.off),k=settingFor('kultra',r.b,r.off);
   return '<article class="card"><h3>'+esc(r.name)+'</h3><p class="hint" style="margin-top:-.2rem">'+esc(r.by)+'</p>'+
   '<div class="meta"><span>'+esc(B.name)+'</span><span>'+r.dose+'g : '+r.water+'g</span>'+(r.temp?'<span>'+r.temp+'°C'+(r.temp2?' then '+r.temp2+'°C':'')+'</span>':'')+'</div>'+
   '<div class="meta">'+(z!=null?'<span>ZP6 Special '+dial('zp6',z)+'</span>':'<span>ZP6 Special: too coarse</span>')+(k!=null?'<span>K-Ultra '+dial('kultra',k)+'</span>':'')+'</div>'+
   '<p>'+esc(r.why)+'</p><ol class="steps">'+r.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol><p class="hint">'+esc(r.tip)+'</p>'+
   '<div class="actions"><button class="btn" data-timer="'+i+'">Start timer</button><button class="btn ghost" data-rshare="'+i+'">Share</button>'+(B.model?'<button class="btn ghost" data-load="'+i+'">Load into dial-in</button>':'')+(PBREWERS.includes(r.b==='swi'?'sw':r.b)?'<button class="btn ghost" data-plan="'+i+'">Tune in planner</button>':'')+'</div></article>'}).join('');
}
$('rgrid').onclick=e=>{const b=e.target.closest('[data-load],[data-plan],[data-timer],[data-rshare]');if(!b)return;if(b.dataset.rshare){openShare(recipeDoc(+b.dataset.rshare));return}
  if(b.dataset.timer){openTimer(+b.dataset.timer);return}
  if(b.dataset.load){const i=+b.dataset.load,r=RECIPES[i],B=BREWERS[r.b];S.brewer=r.b;S.rec=i;if(!canGrind(S.grinder,r.b))S.grinder='kultra';S.setting=settingFor(S.grinder,r.b,r.off);S.temp=clamp(r.temp,B.temp.min,B.temp.max);S.bloom=B.bloom.def;S.agit='med';
    S.ratio=clamp(Math.round(r.water/r.dose/B.ratio.step)*B.ratio.step,B.ratio.min,B.ratio.max);render();showTab('dial');toast('Loaded '+r.name)}
  else{const i=+b.dataset.plan,r=RECIPES[i];PL.brewer=r.b==='swi'?'sw':r.b;PL.tech=i;if(!canGrind(PL.grinder,PL.brewer))PL.grinder='kultra';renderPlan();showTab('planner')}};

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
$('pmap').onclick=e=>{const g=e.target.closest('.pdg');if(!g)return;const k=g.dataset.k;$('pm-label').textContent=PROCESSES[k].name;const c=$('pc-'+k);if(c){c.classList.remove('flash');void c.offsetWidth;c.classList.add('flash');c.scrollIntoView({behavior:RM()?'auto':'smooth',block:'center'})}};
$('pmap').onmousemove=e=>{const g=e.target.closest('.pdg');if(g)$('pm-label').textContent=PROCESSES[g.dataset.k].name};
$('pgrid').onclick=e=>{const b=e.target.closest('[data-usep]');if(b){S.process=b.dataset.usep;render();showTab('dial');toast('Process set to '+PROCESSES[S.process].name)}};

/* ================= GEAR ================= */
const GEAR_G={
 zp6:{full:'1Zpresso ZP6 Special',burr:'48 mm hexagonal (six-sided) conical steel burrs, designed only for filter',dial:'External ring: 9 numbers per turn, 10 clicks per number, 90 clicks per rotation, about 22 microns per click',range:'Filter roughly 4.5 to 7.0 (45 to 70 clicks). Below about 2.0 the burrs rub, so no espresso or Turkish.',cup:'The fewest fines in the 1Zpresso range: very clean, separated, high-clarity cups.',use:'Washed coffees, Geisha and Ethiopian landraces, V60, NEO, Origami, Chemex.',start:56},
 kultra:{full:'1Zpresso K-Ultra',burr:'48 mm heptagonal (seven-sided) "K burr" conical steel burrs, an all-rounder',dial:'External ring: 10 numbers per turn, 10 clicks per number, 100 clicks per rotation, 20 microns per click. Can go past one full turn.',range:'Filter roughly 7.0 to 9.5 (70 to 95 clicks). Espresso around 2.5 to 4.5; French press and cold brew past one full turn.',cup:'More body and a rounder, more blended cup than the ZP6.',use:'Naturals and honeys, immersion, espresso, AeroPress, anything that tastes thin.',start:72}
};
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
  $('gear-grinders').innerHTML=Object.entries(GEAR_G).map(([k,g])=>'<div class="card"><h3>'+g.full+'</h3><svg class="dialbig" id="gd-'+k+'" viewBox="0 0 160 160" aria-hidden="true"></svg>'+
   '<input type="range" min="'+GRINDERS[k].min+'" max="'+GRINDERS[k].max+'" step="1" value="'+g.start+'" data-gd="'+k+'" aria-label="'+g.full+' dial position"><p class="hint" id="gh-'+k+'" style="text-align:center"></p>'+
   '<dl class="spec"><dt>Burrs</dt><dd>'+g.burr+'</dd><dt>Dial</dt><dd>'+g.dial+'</dd><dt>Range</dt><dd>'+g.range+'</dd><dt>Cup</dt><dd>'+g.cup+'</dd><dt>Reach for it</dt><dd>'+g.use+'</dd></dl></div>').join('');
  const upd=k=>{const c=+document.querySelector('[data-gd="'+k+'"]').value;drawDial('gd-'+k,k,c);$('gh-'+k).textContent=dialHint(k,c)};
  $('gear-grinders').oninput=e=>{const k=e.target.dataset.gd;if(k)upd(k)};upd('zp6');upd('kultra');
  $('gear-acc').innerHTML=GEAR_A.map(([n,d])=>'<div class="card hovercard"><h3>'+n+'</h3><p style="margin:0">'+d+'</p></div>').join('');
  renderGearBrewers();renderGrindMap();
}
function renderGearBrewers(){
  const types=[...new Set(Object.values(BREWERS).map(b=>b.type))];
  seg('gear-filter',[['all','All'],...types.map(t=>[t,t])],()=>GF,v=>{GF=v;renderGearBrewers()});
  $('gear-brewers').innerHTML=Object.entries(BREWERS).filter(([,b])=>GF==='all'||b.type===GF).map(([k,b])=>'<div class="card hovercard" id="gb-'+k+'" style="border-top:5px solid '+TYCOL[b.type]+'"><span class="hint">'+b.type+'</span><h3 style="margin-top:.2rem">'+esc(b.name)+'</h3><p>'+esc(b.desc)+'</p><p><b>How it behaves.</b> '+esc(b.how)+'</p><p><b>Best for.</b> '+esc(b.best)+'</p>'+
   '<div class="meta">'+(b.base.zp6!=null?'<span>ZP6 Special '+dial('zp6',base('zp6',k))+'</span>':'<span>ZP6 Special: too coarse</span>')+(b.base.kultra!=null?'<span>K-Ultra '+dial('kultra',base('kultra',k))+'</span>':'')+'</div>'+
   '<div class="actions">'+(RECIPES.some(r=>r.b===k)?'<button class="btn ghost" data-grec="'+k+'">See recipes</button>':'')+(b.model?'<button class="btn ghost" data-gdial="'+k+'">Dial it in</button>':'')+'</div></div>').join('');
}
$('gear-brewers').onclick=e=>{const a=e.target.closest('[data-grec]'),d=e.target.closest('[data-gdial]');
  if(a){RF=BREWERS[a.dataset.grec].type;renderRecipes();showTab('recipes')}
  if(d){$('i-brewer').value=d.dataset.gdial;$('i-brewer').dispatchEvent(new Event('change'));showTab('dial')}};
function renderGrindMap(){
  let h='';for(const g of['zp6','kultra']){const G=GRINDERS[g];const pos=c=>((c-G.min)/(G.max-G.min)*100).toFixed(2)+'%';
    // Markers closer than about one marker width go into separate lanes, so none hides another.
    const ms=Object.keys(BREWERS).filter(k=>BREWERS[k].base[g]!=null&&base(g,k)!=null).map(k=>({k,v:base(g,k)})).sort((a,b)=>a.v-b.v);
    const lanes=[],gap=(G.max-G.min)*0.06;for(const m of ms){let l=lanes.findIndex(x=>m.v-x>=gap);if(l<0){l=lanes.length;lanes.push(0)}lanes[l]=m.v;m.lane=l}
    h+='<h3 style="margin:0">'+G.name+'</h3><div class="grindtrack" data-g="'+g+'" style="--lanes:'+Math.max(1,lanes.length)+'">';
    for(let c=Math.ceil(G.min/10)*10;c<=G.max;c+=10)h+='<span class="scale" style="left:'+pos(c)+'">'+dial(g,c)+'</span>';
    for(const {k,v,lane} of ms)h+='<button type="button" class="gm" data-k="'+k+'" data-g="'+g+'" style="--lane:'+lane+';left:'+pos(clamp(v,G.min,G.max))+';background:'+TYCOL[BREWERS[k].type]+'" aria-label="'+esc(BREWERS[k].name)+' '+dial(g,v)+'" title="'+esc(BREWERS[k].name)+'"></button>';
    h+='</div><div class="gmlabel" id="gml-'+g+'">Tap a marker</div>'}
  h+='<div class="chips">'+Object.entries(TYCOL).map(([t,c])=>'<span class="pill"><i style="background:'+c+'"></i>'+t+'</span>').join('')+'</div>';
  $('grindmap').innerHTML=h;
}
$('grindmap').onclick=e=>{const m=e.target.closest('.gm');if(!m)return;const g=m.dataset.g,k=m.dataset.k;$('grindmap').querySelectorAll('.gm').forEach(x=>x.classList.toggle('on',x.dataset.k===k));
  for(const gg of['zp6','kultra']){const v=base(gg,k);$('gml-'+gg).textContent=BREWERS[k].name+': '+(BREWERS[k].base[gg]==null?'not possible':dial(gg,v)+' ('+v+' clicks)')}};

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
  const d=$('vd');if(!d.open){try{d.showModal()}catch(e){d.setAttribute('open','')}}
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
  $('mapzoom').className='mapbar seg';
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
  $('ts-chips').innerHTML=TS.map(t=>'<button class="chip" data-ts="'+t[0]+'" style="'+(sel===t[0]?'background:var(--cherry);color:var(--surface)':'')+'">'+t[1]+'</button>').join('');
  if(!sel){$('ts-out').innerHTML='';return}
  const t=TS.find(x=>x[0]===sel),G=GRINDERS[S.grinder],B=BREWERS[S.brewer];const dir=t[2]>0?1:-1;
  const newG=roundG(S.grinder,S.setting+dir*Math.round(Math.abs(t[2])*G.step*0.6));
  const newT=clamp(S.temp-dir*2,B.temp.min,B.temp.max);
  const extra={muddy:'Or move to the ZP6 Special or a paper-filter brewer for clarity.',stall:'Also pour more gently and swirl less.',harsh:'Also shorten the bloom and pour more gently.',hollow:'Or tighten the ratio by 1.',dry:'Also reduce agitation.'}[sel]||'';
  $('ts-out').innerHTML='<div class="tip"><b>'+t[3]+'</b><br>On your current '+esc(B.name)+': try <b>'+gLabel(S.grinder,newG)+'</b> ('+Math.abs(newG-S.setting)+' clicks '+(dir>0?'coarser':'finer')+'), or water at <b>'+newT+'°C</b>. '+extra+'</div><button class="btn ghost" id="ts-apply">Apply the grind change</button>';
  $('ts-apply').onclick=()=>{S.setting=newG;render();showTab('dial');toast('Grind changed to '+dial(S.grinder,newG))};
}
$('ts-chips').onclick=e=>{const b=e.target.closest('[data-ts]');if(b)renderTS(b.dataset.ts)};

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
    try{const r=await fetch(dbUrl('/log/'+op.id),op.op==='del'?{method:'DELETE'}:{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(op.data)});if(!r.ok)throw new Error(r.status)}
    catch(e){setSync('offline');return}PENDING.shift();save('bb-pending',PENDING)}}
function queue(op,id,data){if(!GROUP||!SYNC_DB)return;PENDING=PENDING.filter(p=>p.id!==id);PENDING.push({op,id,data});save('bb-pending',PENDING);flush()}
// Replace group entries with what the server has, keeping local changes that have not been sent yet.
function applyRemote(entries){const pend=new Map(PENDING.map(p=>[p.id,p]));const out=[];
  for(const [id,e] of Object.entries(entries||{})){if(!e||typeof e!=='object'||pend.get(id)&&pend.get(id).op==='del')continue;out.push(Object.assign({},e,{id}))}
  for(const p of PENDING)if(p.op==='put'&&!out.some(e=>e.id===p.id))out.push(p.data);
  LOG=out.sort((a,b)=>(b.ts||0)-(a.ts||0));save('bb-log',LOG);renderLog()}
function startStream(){stopStream();if(!GROUP||!SYNC_DB||typeof EventSource==='undefined')return;setSync('connecting');
  let snap={};const es=STREAM=new EventSource(dbUrl('/log'));
  const onData=(ev,merge)=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}if(!m)return;const path=m.path||'/';
    if(path==='/'){snap=merge?Object.assign(snap,m.data||{}):(m.data||{})}else{const id=path.split('/')[1];if(path.split('/').length>2){snap[id]=Object.assign({},snap[id],{[path.split('/')[2]]:m.data})}else if(m.data===null)delete snap[id];else snap[id]=merge?Object.assign({},snap[id],m.data):m.data}
    setSync('live');applyRemote(snap);flush()};
  es.addEventListener('put',e=>onData(e,false));es.addEventListener('patch',e=>onData(e,true));
  es.addEventListener('cancel',()=>{setSync('offline')});es.onerror=()=>setSync(navigator.onLine?'connecting':'offline')}
function stopStream(){if(STREAM){STREAM.close();STREAM=null}}
function joinGroup(code,name){ME=name.trim().slice(0,30);try{localStorage.setItem('bb-name',ME)}catch(e){}GROUP={code};save('bb-group',GROUP);
  LOG.forEach(l=>{if(!l.by)l.by=ME;queue('put',l.id,l)});renderLog();startStream()}
function leaveGroup(){stopStream();GROUP=null;PENDING=[];save('bb-group',null);save('bb-pending',[]);try{localStorage.removeItem('bb-group')}catch(e){}setSync('off');renderLog()}
addEventListener('online',()=>{if(GROUP){flush();if(!STREAM)startStream()}});addEventListener('offline',()=>{if(GROUP)setSync('offline')});
function inviteDoc(){const link=SITE_URL+'#join='+GROUP.code;return{title:'Join my brew log',sub:'Shared log code '+GROUP.code,file:'brew-log-invite',blocks:[{p:'Tap the link to see and add to our shared coffee log in The Brew Bench:'},{p:link},{p:'Or open the app, go to Log and enter the code '+GROUP.code+'.'}]}}
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
let SC=Object.assign({origin:'colombia',process:'washed',variety:'pinkbourbon',roast:'light',date:'',brewer:'v60',grinder:'zp6',info:null},load('bb-scan',{}));
if(!PROCESSES[SC.process])SC.process='washed';if(!vById(SC.variety))SC.variety='pinkbourbon';if(!ALLO()[SC.origin])SC.origin='colombia';if(!PBREWERS.includes(SC.brewer))SC.brewer='v60';
let SCANS=load('bb-scans',[]),SAMPLE=null,IMGS=null,SFILE=null,SCTL=null;
function daysSince(d){if(!d)return 14;const t=Date.parse(d);if(isNaN(t))return 14;return clamp(Math.round((Date.now()-t)/864e5),1,90)}
function initScan(){
  $('s-origin').innerHTML=Object.entries(REG).map(([rk,r])=>'<optgroup label="'+r.name+'">'+Object.keys(ALLO()).filter(k=>ALLO()[k].reg===rk).sort((a,b)=>ALLO()[a].name.localeCompare(ALLO()[b].name)).map(k=>'<option value="'+k+'">'+esc(ALLO()[k].name)+'</option>').join('')+'</optgroup>').join('');
  $('s-brewer').innerHTML=brewerOptions(PBREWERS);
  for(const [id,key] of [['s-origin','origin'],['s-process','process'],['s-variety','variety'],['s-brewer','brewer'],['s-date','date']])$(id).onchange=e=>{SC[key]=e.target.value;if(key==='brewer'&&!canGrind(SC.grinder,SC.brewer))SC.grinder='kultra';renderScan()};
  $('scan-pick').onclick=()=>$('scan-file').click();$('scan-drop').onclick=()=>$('scan-file').click();
  $('scan-file').onchange=e=>{const f=e.target.files[0];if(!f)return;SFILE=f;const u=URL.createObjectURL(f);$('scan-prev').src=u;$('scan-prev').hidden=false;$('scan-empty').hidden=true;$('scan-go').disabled=false;$('scan-status').hidden=false;
    $('scan-status').textContent='Ready. Tap "Read the label".';runScan(true)};
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
let OCR=null;
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('Could not load '+src));document.head.appendChild(s)})}
async function ocrWorker(onProgress){
  if(!OCR)OCR=(async()=>{const base=new URL('vendor/ocr/',location.href).href;if(!window.Tesseract)await loadScript(base+'tesseract.min.js');
    return Tesseract.createWorker('eng',1,{workerPath:base+'worker.min.js',corePath:base,langPath:base,gzip:true,workerBlobURL:false,
      logger:m=>{if(OCR_PROGRESS&&m&&typeof m.progress==='number')OCR_PROGRESS(m.status,m.progress)}})})().catch(e=>{OCR=null;throw e});
  OCR_PROGRESS=onProgress;return OCR}
let OCR_PROGRESS=null;
// Shrink big camera photos and boost contrast so text recognition is faster and more accurate.
function prepImage(file){return new Promise((ok,no)=>{const img=new Image();img.onload=()=>{const k=Math.min(1,1800/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
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
  let cancelled=false;SCTL={abort:()=>{cancelled=true;$('scan-status').textContent='Stopped.'}};$('scan-stop').hidden=!useImg;$('scan-go').disabled=true;$('scan-drop').classList.add('scanning');
  const st=$('scan-status');st.hidden=false;st.textContent=useImg?'Getting the text reader ready…':'Reading the text…';
  try{let text=txt;
    if(useImg){const w=await ocrWorker((status,p)=>{if(!cancelled)st.textContent=(/recogniz/.test(status)?'Reading the label… ':'Getting the text reader ready… ')+Math.round(p*100)+'%'});
      const img=await prepImage(SFILE);const res=await w.recognize(img);if(cancelled)return;text=res.data.text||'';$('scan-text').value=text.trim()}
    const j=parseLabel(text);if(!j.origin_key&&!j.variety_key&&!j.process_key&&!j.roast_date){st.textContent=useImg?'Couldn’t find coffee details in that photo. Try a closer, sharper shot of the label, or fill in the details below.':'No coffee details found in that text.';return}
    applyInfo(j);st.textContent=(j.confidence==='low'?'Found a few details. ':'Label read. ')+'Check them below and adjust anything that looks off.';renderScan();saveScan();toast('Label read')}
  catch(e){st.textContent='The text reader couldn’t start. Check your connection the first time you scan, or fill in the details below.'}
  finally{$('scan-stop').hidden=true;$('scan-go').disabled=!SFILE;$('scan-drop').classList.remove('scanning')}}
function thumb(cb){if(!SFILE){cb('');return}const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),s=160/Math.max(img.width,img.height);c.width=img.width*s;c.height=img.height*s;c.getContext('2d').drawImage(img,0,0,c.width,c.height);try{cb(c.toDataURL('image/jpeg',.7))}catch(e){cb('')}};img.onerror=()=>cb('');img.src=$('scan-prev').src}
function saveScan(){thumb(t=>{SCANS.unshift({t,info:SC.info,sc:{origin:SC.origin,process:SC.process,variety:SC.variety,roast:SC.roast,date:SC.date},when:new Date().toLocaleDateString()});SCANS=SCANS.slice(0,12);save('bb-scans',SCANS);renderScanList()})}
function renderScanList(){$('scan-list').innerHTML=SCANS.length?SCANS.map((s,i)=>'<button type="button" class="card vcard" data-scan="'+i+'" style="--c:var(--cherry)">'+(s.t?'<img src="'+s.t+'" alt="" style="width:100%;max-height:120px;object-fit:cover;border-radius:10px">':'')+'<h3 style="margin:.4rem 0 .1rem">'+esc((s.info&&(s.info.coffee_name||s.info.producer_or_farm))||originName(s.sc.origin))+'</h3><p class="hint" style="margin:0">'+esc(s.info&&s.info.roaster||'')+' '+esc(s.when)+'</p></button>').join(''):'<p class="hint">Scans you make appear here.</p>'}
function renderScan(){
  $('s-origin').value=SC.origin;$('s-process').value=SC.process;$('s-variety').value=SC.variety;$('s-date').value=SC.date||'';$('s-brewer').value=SC.brewer;
  seg('s-roast',[['light','Light'],['medium','Medium'],['dark','Dark']],()=>SC.roast,v=>{SC.roast=v;renderScan()});
  seg('s-grinder',grinderOpts(SC.brewer),()=>SC.grinder,v=>{SC.grinder=v;renderScan()});
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
function docText(doc){let t='# '+doc.title+'\n';if(doc.sub)t+=doc.sub+'\n';t+='\n';
  for(const b of doc.blocks){if(b.h)t+='## '+b.h+'\n';if(b.p)t+=b.p+'\n';if(b.kv)t+=b.kv.map(([k,v])=>'- '+k+': '+v).join('\n')+'\n';if(b.list)t+=b.list.map((x,i)=>(b.num?(i+1)+'. ':'- ')+x).join('\n')+'\n';t+='\n'}
  return t+'Made with The Brew Bench\n'}
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
  for(const b of doc.blocks){
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

function recipeDoc(i,p){const r=RECIPES[i],B=BREWERS[r.b];const z=p?p.set.zp6:settingFor('zp6',r.b,r.off),k=p?p.set.kultra:settingFor('kultra',r.b,r.off);
  const kv=[['Brewer',B.name],['Dose : water',r.dose+'g : '+(p?p.water:r.water)+'g'+(p?' (1:'+p.ratio+')':'')],['Water temperature',(p?p.temp:r.temp)?(p?p.temp:r.temp)+'°C'+(r.temp2?', then about '+r.temp2+'°C':''):'Cold or not applicable']];
  if(z!=null)kv.push(['ZP6 Special',dial('zp6',z)+' ('+z+' clicks)']);if(k!=null)kv.push(['K-Ultra',dial('kultra',k)+' ('+k+' clicks)']);
  if(p)kv.push([B.bloom.label,p.bloom+'s']);
  const blocks=[{p:r.why},{h:'Settings',kv},{h:'Steps',num:true,list:r.steps},{h:'Tip',p:r.tip}];
  if(p&&p.tw.length)blocks.push({h:'Tuned for your coffee',p:p.tw.join(' ')});if(p&&p.why.length)blocks.push({h:'Why these settings',list:p.why.map(w=>w.replace(/<[^>]+>/g,''))});
  return{title:r.name,sub:r.by+' | '+B.name,blocks,file:'recipe-'+r.name}}
function dialDoc(){const r=compute(S),[vt,vs]=verdict(r.D),B=BREWERS[S.brewer];
  return{title:'My brew: '+vName(S.variety),sub:PROCESSES[S.process].name+' | '+S.roast+' roast | '+B.name,file:'my-brew',blocks:[
   {h:'Settings',kv:[['Grinder',gLabel(S.grinder,S.setting)+' ('+S.setting+' clicks)'],['Brewer',B.name],['Water',S.temp+'°C'],['Ratio','1:'+S.ratio],[B.bloom.label,S.bloom+'s'],['Agitation',{low:'Gentle',med:'Normal',high:'Vigorous'}[S.agit]]]},
   {h:'Predicted cup',p:vt+'. '+vs},{kv:[['Sweetness',r.sweet.toFixed(1)+' / 10'],['Acidity',r.acid.toFixed(1)+' / 10'],['Body',r.body.toFixed(1)+' / 10'],['Clarity',r.clarity.toFixed(1)+' / 10'],['Bitterness',r.bitter.toFixed(1)+' / 10']]}]}}
function varietyDoc(id){const v=VBY[id];const b=[{kv:[['Family',FAM[v.fam].name],['Origin',v.origin||'-'],['Year',v.year||'-'],['Parentage',v.parents||'-']]},{h:'Story',p:v.story},{h:'In the cup',p:v.cup+' ('+v.notes.join(', ')+')'},{h:'How to brew it',p:v.brew}];
  if(v.subs)b.push({h:'Types',list:v.subs.map(s=>s.name+': '+s.cup)});return{title:v.name,sub:'Variety guide',blocks:b,file:'variety-'+v.name}}
function originDoc(k){const o=ALLO()[k];return{title:o.name,sub:'Coffee origin | '+REG[o.reg].name,file:'origin-'+o.name,blocks:[{kv:[['Regions',o.subs.join(', ')],['Altitude',o.alt],['Harvest',o.harvest],['Processing',o.process]]},{h:'In the cup',p:o.cup},{h:'Story',p:o.hist},{h:'Varieties grown here',list:o.vars.map(v=>VBY[v]?VBY[v].name:v)},{h:'Did you know?',p:o.fact}]}}
function historyDoc(){return{title:'The story of coffee',sub:'From Ethiopian forests to your cup',file:'coffee-history',blocks:[{h:'Timeline',list:TIMELINE.map(([w,t,d])=>w+' - '+t+': '+d)},{h:'People who spread coffee',list:PEOPLE.map(([n,r,d])=>n+' ('+r+'): '+d)}]}}
function logDoc(){return{title:'My brew log',sub:LOG.length+' brews',file:'brew-log',blocks:LOG.length?LOG.map(l=>({h:(l.coffee||'Untitled')+' - '+l.date,kv:[['Rating',l.stars?l.stars+' / 5':'-'],['Settings',l.settings||'-'],['Predicted',l.pred||'-'],['Notes',l.notes||'-']]})):[{p:'No brews logged yet.'}]}}
function scanDoc(p,c){const inf=SC.info||{};const o=ALLO()[SC.origin];const kv=[['Origin',o.name],['Variety',vName(SC.variety)],['Process',PROCESSES[SC.process].name],['Roast',SC.roast],['Days off roast',String(daysSince(SC.date))]];
  if(inf.roaster)kv.unshift(['Roaster',inf.roaster]);if(inf.producer_or_farm)kv.push(['Producer or farm',inf.producer_or_farm]);if(inf.altitude)kv.push(['Altitude',inf.altitude]);if((inf.tasting_notes||[]).length)kv.push(['Tasting notes',inf.tasting_notes.join(', ')]);
  const rd=recipeDoc(c.tech,p);return{title:inf.coffee_name||('Brew plan: '+o.name+' '+vName(SC.variety)),sub:'Bean profile and recommended brew',file:'bean-plan',blocks:[{h:'The coffee',kv}].concat(inf.summary?[{p:inf.summary}]:[]).concat([{h:'Recommended: '+RECIPES[c.tech].name,p:''}]).concat(rd.blocks.slice(1))}}

let SHDOC=null;
// Where people land from a shared message.
const SITE_URL='https://maheralshokry.github.io/brew-bench/';
const APPS=[['native','Share\u2026','#8E8E93','M12 15V3 M7 8l5-5 5 5 M5 12v8h14v-8'],
  ['whatsapp','WhatsApp','#25D366','M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.2z M9.5 9.2c.2 2.3 2.8 5 5.3 5.3l1-1.3-1.8-.9-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-.9-1.8z'],
  ['telegram','Telegram','#2AABEE','M20 5L3.5 11.4l5 1.8L18 7l-7.6 7.4.3 4.6 2.8-3 3.8 2.8z'],
  ['sms','Messages','#34C759','M4 5h16v11H9l-5 4z'],
  ['email','Email','#0A84FF','M3 6h18v12H3z M3 7l9 6 9-6']];
// Chat-friendly text: headings become *bold* (WhatsApp and Telegram both show it as bold).
function shareText(doc){const t=docText(doc).trim().replace(/^#+\s*(.+)$/gm,'*$1*');return(t.length>1400?t.slice(0,1400).replace(/\s+\S*$/,'')+'\u2026':t)+(t.includes(SITE_URL)?'':'\n\n'+SITE_URL)}
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
    openLink({whatsapp:'https://wa.me/?text='+e(t),telegram:'https://t.me/share/url?url='+e(SITE_URL)+'&text='+e(t.replace(SITE_URL,'').trim()),sms:'sms:?&body='+e(t),email:'mailto:?subject='+e(doc.title)+'&body='+e(t)}[k]);return}
  if(k==='native'&&!navigator.share&&!NATIVE){let ok=false;try{await navigator.clipboard.writeText(shareText(doc));ok=true}catch(e){}d.close();toast(ok?'This browser has no share menu, so the text was copied':'Sharing isn\u2019t available here; use Copy as text');return}
  if(k==='native'&&NATIVE){d.close();try{const blob=docPDF(doc);await nativeShare(doc.title,blob?base+'.pdf':null,blob,txt)}catch(err){if(!/cancel/i.test(err&&err.message||''))toast('Could not share')}return}
  if(k==='native'){try{const blob=docPDF(doc);const f=blob&&typeof File!=='undefined'?new File([blob],base+'.pdf',{type:'application/pdf'}):null;
      if(f&&navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({title:doc.title,files:[f]});else await navigator.share({title:doc.title,text:txt});d.close()}
    catch(err){if(!err||err.name!=='AbortError')toast('Sharing isn\u2019t allowed here; use Save as PDF instead')}}
});

/* ================= APP SHELL ================= */
/* Line icons for the sheets, drawn to match the bottom navigation. */
const ICO={globe:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18',leaf:'M5 19c0-8 5-14 14-14c0 9-6 14-14 14z M5 19l8-8',
  hourglass:'M7 3h10 M7 21h10 M8 3v3l4 6 4-6V3 M8 21v-3l4-6 4 6v3',flask:'M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7.5 15h9',drop:'M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z',
  clipboard:'M9 3h6v3H9z M7 4.5H5V21h14V4.5h-2 M8 11h8 M8 15h8 M8 19h5',cog:'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9L7 7 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1',
  book:'M4 19V5a2 2 0 0 1 2-2h13v14H6a2 2 0 0 0-2 2a2 2 0 0 0 2 2h13 M8 7h7',pencil:'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',moon:'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun:'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5L19 19 M5 19l1.5-1.5 M17.5 6.5L19 5',download:'M12 4v11 M7 10l5 5 5-5 M5 20h14',
  file:'M6 3h8l4 4v14H6z M14 3v4h4 M9 13h6 M9 17h4',share:'M12 15V3 M7 8l5-5 5 5 M5 12v8h14v-8',copy:'M9 9h11v11H9z M5 15H4V4h11v1',text:'M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M12 12v6'};
// True inside the Android app or when the site is already installed to the home screen.
const installed=()=>!!window.Capacitor||MQ('(display-mode: standalone)')||navigator.standalone===true;
const ico=(n,bg)=>'<span class="ic" style="background:'+bg+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+ICO[n]+'"/></svg></span>';

const TABNAMES={dial:'Dial-in',planner:'Brew planner',scan:'Scan beans',gear:'Gear and dials',recipes:'Recipes',tech:'Techniques',process:'Processes',map:'Origins map',variety:'Varieties',history:'History',guide:'Guide',log:'Brew log'};
const BNGROUP={dial:'dial',recipes:'recipes',scan:'scan',map:'explore',variety:'explore',history:'explore',process:'explore',tech:'explore',planner:'more',gear:'more',guide:'more',log:'more'};
function syncShell(id){$('ab-title').textContent=TABNAMES[id]||'Brew Bench';document.body.className=document.body.className.replace(/\bt-\w+/g,'').trim()+' t-'+id;
  document.querySelectorAll('.bottomnav [data-bn]').forEach(b=>b.setAttribute('aria-current',BNGROUP[id]===b.dataset.bn));
  const can=['dial','planner','scan','history','log','map','recipes'].includes(id);$('ab-share').hidden=!can}
const SHEETS={explore:[['map','Origins map','50 origins on an interactive map','#4F8A74','globe'],['variety','Varieties','44 varieties, stories and Geisha types','#B5533C','leaf'],['history','History','Family tree, timeline and a quiz','#8A5A3B','hourglass'],['process','Processes','From washed to thermal shock','#D2A04A','flask'],['tech','Techniques','Every move in the brewing toolbox','#6B8E4E','drop']],
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
  if(id==='dial')openShare(dialDoc());else if(id==='planner')openShare(recipeDoc(PL.tech,plan(Object.assign({},PL))));else if(id==='scan')$('sc-share').click();else if(id==='history')openShare(historyDoc());else if(id==='log')openShare(logDoc());else if(id==='map'){if(SEL)openShare(originDoc(SEL));else toast('Pick an origin first')}else if(id==='recipes')toast('Tap Share on any recipe card')};
$('dial-share').onclick=()=>openShare(dialDoc());
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
{const h=location.hash.slice(1),j=/^join=([A-Za-z0-9-]{8,9})$/.exec(h);
  if(j){JOIN_CODE=j[1].toUpperCase();try{history.replaceState(null,'','#log')}catch(e){}showTab('log',true);if(!GROUP)toast('Add your name and tap Join');else if(GROUP.code!==JOIN_CODE)toast('You are already in a shared log. Leave it first to join this one.');renderLog()}
  else if(h&&$(h)&&$(h).tagName==='SECTION')showTab(h,true);else syncShell('dial')}
if(GROUP)startStream();
if(window.claude&&window.claude.use){
  window.claude.use('sample').then(async s=>{SAMPLE=s;if(!s)return;
    try{const l=await s.limits();IMGS=!!(l&&l.images);if(IMGS)$('scan-file').accept=l.images.mediaTypes.join(',')}catch(e){IMGS=false}
    $('scan-go').disabled=!SFILE}).catch(()=>{});
  window.claude.use('downloads').then(d=>{DL=d;renderLog()}).catch(()=>{});
}else{$('scan-status').hidden=true;$('scan-lede').textContent='Take a photo of the bag or the roaster’s card. The text is read on your phone, matched to the guide and turned into a brew plan for your gear.'}
