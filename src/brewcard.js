/* ================= BREW CARDS ================= */
// A brew, a logged brew or a gallery coffee as one designed image to share. Drawn on a canvas in the app's espresso and
// honey colours, 1080 px wide (a phone story) and as tall as the content needs. One renderer draws every kind of card
// from a plain description (a "model"): the dial-in, the log and the gallery each build their own.
// The colours are set per card by its style (see cardStyle): INK is the text, MUTED the quieter text, PANE and CHIP the
// backings that text sits on. Dark is the default; a light card swaps them all.
const BC={W:1080,PAD:72,BG1:'#2E1C12',BG2:'#120B07',INK:'#FFF8EE',MUTED:'rgba(255,248,238,.8)',LINE:'rgba(255,248,238,.16)',HONEY:'#E2B866',LIGHT:false,PANE:'rgba(18,11,7,.9)',CHIP:'rgba(46,28,18,.86)'};
const bcI=a=>hexA(BC.INK,a);
function bcRound(x,X,Y,w,h,r){x.beginPath();x.roundRect(X,Y,w,h,r)}
// Lines of text that fit a width, at most `max` lines (the last one ends with an ellipsis if cut).
function bcWrap(x,t,w,max){const words=String(t).split(/\s+/).filter(Boolean);const out=[];let cur='';
  for(const wd of words){const tryL=cur?cur+' '+wd:wd;if(x.measureText(tryL).width<=w)cur=tryL;else{if(cur)out.push(cur);cur=wd}if(out.length===max)break}
  if(out.length<max&&cur)out.push(cur);
  if(out.length===max&&words.join(' ')!==out.join(' ')){let l=out[max-1];while(l&&x.measureText(l+'…').width>w)l=l.slice(0,-1);out[max-1]=l.replace(/\s+$/,'')+'…'}
  return out}
// A panel: a soft gradient pane with a fine edge.
function bcPane(x,X,Y,w,h,r){bcRound(x,X,Y,w,h,r||28);x.fillStyle=BC.PANE;x.fill();const g=x.createLinearGradient(0,Y,0,Y+h);g.addColorStop(0,bcI(.085));g.addColorStop(1,bcI(.035));x.fillStyle=g;x.fill();x.lineWidth=1.5;x.strokeStyle=bcI(.13);x.stroke()}
function bcLabel(x,t,X,Y,col){x.font='700 22px '+BC.F;x.fillStyle=col||BC.HONEY;x.letterSpacing='3px';x.fillText(t.toUpperCase(),X,Y);x.letterSpacing='0px'}
const bcCap=t=>t?t.charAt(0).toUpperCase()+t.slice(1):t;
// The app's bean mark.
function bcBean(x,cx,cy,s,col,crease){x.save();x.translate(cx,cy);x.rotate(-38*Math.PI/180);x.beginPath();x.ellipse(0,0,s*0.36,s*0.5,0,0,TAU);x.fillStyle=col;x.fill();
  x.beginPath();x.moveTo(s*0.02,-s*0.5);x.bezierCurveTo(-s*0.16,-s*0.2,s*0.16,0,s*0.0,s*0.18);x.bezierCurveTo(-s*0.1,s*0.32,s*0.06,s*0.42,s*0.02,s*0.5);x.lineWidth=s*0.07;x.strokeStyle=crease||BC.BG1;x.stroke();x.restore()}
// A rating as stars (the log) or coffee beans (the gallery), halves allowed for beans.
function bcRating(x,kind,v,X,Y,s){for(let i=1;i<=5;i++){const cx=X+(i-1)*s*1.18+s/2,f=v>=i?1:v>=i-0.5?0.5:0;
    if(kind==='beans'){bcBean(x,cx,Y,s,bcI(.16),bcI(.22));if(f){x.save();x.beginPath();x.rect(cx-s/2,Y-s/2,s*f,s);x.clip();bcBean(x,cx,Y,s,BC.HONEY);x.restore()}}
    else{x.save();x.translate(cx,Y);x.beginPath();for(let k=0;k<10;k++){const r=k%2?s*0.22:s*0.5,a=-Math.PI/2+k*Math.PI/5;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();x.fillStyle=f?BC.HONEY:bcI(.16);x.fill();x.restore()}}}
// The grinder's dial at the setting: a numbered ring for rotation dials, an arc from fine to coarse for the rest.
function bcDial(x,g,c,cx,cy,R){const G=GRINDERS[g];c=Math.round(c);x.save();
  x.beginPath();x.arc(cx,cy,R,0,TAU);x.fillStyle=bcI(.06);x.fill();x.lineWidth=2;x.strokeStyle=BC.LINE;x.stroke();
  if(G.fmt==='rot'){const rem=c%G.per,nums=G.per/10;
    for(let i=0;i<G.per;i++){const a=-Math.PI/2+i/G.per*TAU,big=i%10===0,r1=big?R*0.8:R*0.87;x.beginPath();x.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);x.lineTo(cx+Math.cos(a)*R*0.95,cy+Math.sin(a)*R*0.95);
      x.strokeStyle=big?BC.INK:bcI(.35);x.lineWidth=big?3:1.4;x.stroke()}
    x.font='600 '+Math.round(R*0.16)+'px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='center';x.textBaseline='middle';
    for(let n=0;n<nums;n++){const a=-Math.PI/2+n/nums*TAU;x.fillText(String(n),cx+Math.cos(a)*R*0.62,cy+Math.sin(a)*R*0.62)}
    const a=-Math.PI/2+rem/G.per*TAU;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(a)*R*0.9,cy+Math.sin(a)*R*0.9);x.lineCap='round';x.lineWidth=7;x.strokeStyle=BC.HONEY;x.stroke()}
  else{const t=clamp((c-G.min)/Math.max(1,G.max-G.min),0,1),A=i=>(135+i*270)*Math.PI/180;
    x.lineCap='round';x.lineWidth=16;x.beginPath();x.arc(cx,cy,R*0.78,A(0),A(1));x.strokeStyle=bcI(.14);x.stroke();
    x.beginPath();x.arc(cx,cy,R*0.78,A(0),A(Math.max(0.002,t)));x.strokeStyle=BC.HONEY;x.stroke();
    x.font='500 '+Math.round(R*0.13)+'px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='center';x.textBaseline='middle';
    x.fillText('fine',cx+Math.cos(A(0))*R*0.78,cy+Math.sin(A(0))*R*0.78+R*0.22);x.fillText('coarse',cx+Math.cos(A(1))*R*0.78,cy+Math.sin(A(1))*R*0.78+R*0.22)}
  x.beginPath();x.arc(cx,cy,R*0.32,0,TAU);x.fillStyle=BC.HONEY;x.fill();
  x.fillStyle=BC.BG1;x.font='800 '+Math.round(R*0.2)+'px '+BC.F;x.textAlign='center';x.textBaseline='middle';x.fillText(dial(g,c),cx,cy+1);x.restore()}
// The predicted cup seen from above, with the flavour radar floating on the coffee (as on the dial-in).
// L and Rt: the left and right edges the labels must stay inside (the panel on one side, the text on the other).
function bcCup(x,r,cx,cy,R,L,Rt){const ax=[['Sweet',r.sweet],['Acidity',r.acid],['Body',r.body],['Clarity',r.clarity],['Bitter',r.bitter]],ang=i=>-Math.PI/2+i*TAU/5;
  x.save();x.beginPath();x.arc(cx,cy,R*1.3,0,TAU);x.fillStyle=bcI(.07);x.fill();
  x.beginPath();x.arc(cx,cy,R*1.1,0,TAU);x.fillStyle='#F3EADC';x.fill();
  x.beginPath();x.arc(cx,cy,R,0,TAU);x.fillStyle=liquid(r.D);x.fill();x.lineWidth=4;x.strokeStyle='rgba(255,235,200,.35)';x.stroke();
  const pt=(i,v)=>[cx+Math.cos(ang(i))*R*0.92*v/10,cy+Math.sin(ang(i))*R*0.92*v/10];
  for(const k of [2.5,5,7.5,10]){x.beginPath();ax.forEach((_,i)=>{const p=pt(i,k);i?x.lineTo(...p):x.moveTo(...p)});x.closePath();x.strokeStyle='rgba(255,255,255,'+(k===10?.3:.15)+')';x.lineWidth=1.5;x.stroke()}
  x.beginPath();ax.forEach((a,i)=>{const p=pt(i,a[1]);i?x.lineTo(...p):x.moveTo(...p)});x.closePath();x.fillStyle='rgba(255,245,225,.34)';x.fill();x.strokeStyle='#FFF3DD';x.lineWidth=4;x.lineJoin='round';x.stroke();
  ax.forEach((a,i)=>{const p=pt(i,a[1]);x.beginPath();x.arc(p[0],p[1],6,0,TAU);x.fillStyle='#FFF3DD';x.fill()});
  x.font='600 22px '+BC.F;x.textBaseline='middle';
  ax.forEach((a,i)=>{const an=ang(i),al=Math.abs(Math.cos(an))<0.3?'center':Math.cos(an)>0?'left':'right',ly=cy+Math.sin(an)*R*1.48;let lx=cx+Math.cos(an)*R*1.5;
    // Each label is kept inside the panel: measured, then nudged in if it would cross an edge.
    x.font='600 22px '+BC.F;const w1=x.measureText(a[0]).width;x.font='800 26px '+BC.F;const w=Math.max(w1,x.measureText(a[1].toFixed(1)).width);
    if(L!=null){const lo=al==='right'?lx-w:al==='center'?lx-w/2:lx,hi=lo+w;if(lo<L)lx+=L-lo;if(Rt!=null&&hi>Rt)lx-=hi-Rt}
    x.textAlign=al;x.font='600 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(a[0],lx,ly-12);x.fillStyle=BC.INK;x.font='800 26px '+BC.F;x.fillText(a[1].toFixed(1),lx,ly+16);x.font='600 22px '+BC.F});
  x.restore()}
// Chips that wrap onto new rows; each can carry its own colour dot (flavour notes keep their wheel colours).
function bcChips(x,items,y){const W=BC.W,P=BC.PAD;let px=P;x.font='500 27px '+BC.F;
  for(const it of items){const t=typeof it==='string'?it:it.t,dot=typeof it==='string'?null:it.c,w=x.measureText(t).width+48+(dot?26:0);if(px+w>W-P){px=P;y+=70}
    bcRound(x,px,y,w,56,28);x.fillStyle=BC.CHIP;x.fill();x.fillStyle=bcI(.05);x.fill();x.strokeStyle=bcA(.38);x.lineWidth=1.5;x.stroke();
    if(dot){x.beginPath();x.arc(px+30,y+28,9,0,TAU);x.fillStyle=dot;x.fill()}x.fillStyle=BC.INK;x.textBaseline='alphabetic';x.fillText(t,px+24+(dot?26:0),y+38);px+=w+12}
  return y+56}
const bcLoad=src=>new Promise(ok=>{if(!src){ok(null);return}const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src});
/* ---------- Origin identity ---------- */
// A card takes the look of its coffee's origin: a palette and a faint pattern drawn from the place's own craft, a
// woven band along the top and a passport-style stamp. Origins without their own look use their region's.
const OT={
  house:   {bg:['#2B1A11','#1A100A','#0E0805'],glow:'#E2B866',acc:'#E2B866',acc2:'#A8432F',motif:null},
  yemen:   {bg:['#2B1612','#180B09','#0D0605'],glow:'#E08A3C',acc:'#E9B661',acc2:'#3E6E8E',motif:'arches',note:'Tower houses of Sana’a'},
  ethiopia:{bg:['#17231A','#0D150F','#070B08'],glow:'#E3B23C',acc:'#EBC66B',acc2:'#C4473A',motif:'tibeb',note:'Tibeb weave'},
  kenya:   {bg:['#2A1110','#160909','#0B0505'],glow:'#C8402A',acc:'#EBA93F',acc2:'#3576B8',motif:'beads',note:'Maasai beadwork'},
  tanzania:{bg:['#1D1A2C','#100E19','#08070D'],glow:'#E5893A',acc:'#F2B65C',acc2:'#3FA6AE',motif:'kili',note:'Kilimanjaro'},
  rwanda:  {bg:['#1E1914','#110E0B','#090706'],glow:'#C9A15A',acc:'#E9C47E',acc2:'#F3EADC',motif:'imigongo',note:'Imigongo'},
  burundi: {bg:['#16201A','#0C120E','#060907'],glow:'#5FA36F',acc:'#E6C27A',acc2:'#C24A3A',motif:'imigongo',note:'Imigongo'},
  uganda:  {bg:['#2A1A10','#170E08','#0C0704'],glow:'#C98A3E',acc:'#E2B06A',acc2:'#8C3B22',motif:'bark',note:'Bark cloth'},
  drc:     {bg:['#221A12','#130E09','#0A0705'],glow:'#C68F4E',acc:'#E3BC7A',acc2:'#7A2F1E',motif:'kuba',note:'Kuba cloth'},
  colombia:{bg:['#122017','#09120C','#050906'],glow:'#F2C14E',acc:'#F2C94C',acc2:'#D2553A',motif:'mochila',note:'Wayuu mochila'},
  brazil:  {bg:['#0F2320','#081311','#040A09'],glow:'#3FB68B',acc:'#F2D16B',acc2:'#2BA37A',motif:'waves',note:'Copacabana waves'},
  peru:    {bg:['#2A1220','#160911','#0B0508'],glow:'#C2407A',acc:'#EDB24F',acc2:'#D45087',motif:'chakana',note:'Andean chakana'},
  bolivia: {bg:['#26141C','#140A0F','#0A0507'],glow:'#B0475E',acc:'#EBB352',acc2:'#3D8C7A',motif:'chakana',note:'Andean chakana'},
  panama:  {bg:['#2A1018','#15070C','#0A0406'],glow:'#E0485E',acc:'#F4B860',acc2:'#3BAFA0',motif:'mola',note:'Guna mola'},
  guatemala:{bg:['#151A2D','#0A0D18','#05060C'],glow:'#7B5EA7',acc:'#EAB24E',acc2:'#3FA7A0',motif:'huipil',note:'Huipil weave'},
  elsalvador:{bg:['#141C2A','#0A0F17','#05070C'],glow:'#3E78B8',acc:'#E8B65A',acc2:'#D0573F',motif:'huipil',note:'Woven textiles'},
  mexico:  {bg:['#161A32','#0B0D1B','#05060D'],glow:'#2F6DB5',acc:'#F2C14E',acc2:'#E05A47',motif:'talavera',note:'Talavera tile'},
  indonesia:{bg:['#2A1A0E','#160E07','#0B0703'],glow:'#C98A3E',acc:'#E6BA6E',acc2:'#7A3B1E',motif:'kawung',note:'Kawung batik'},
  timor:   {bg:['#251410','#140A08','#0A0504'],glow:'#B5533C',acc:'#E9B867',acc2:'#3B6E5A',motif:'kawung',note:'Tais weave'},
  china:   {bg:['#142019','#0A120D','#050906'],glow:'#7FB069',acc:'#E3C276',acc2:'#B84A3A',motif:'terraces',note:'Yunnan terraces'},
  vietnam: {bg:['#13201A','#0A120E','#050907'],glow:'#6FAF7A',acc:'#E9C46A',acc2:'#C0392B',motif:'terraces',note:'Rice terraces'},
  thailand:{bg:['#1C1828','#0F0D16','#07060B'],glow:'#B07AC9',acc:'#E9BE5E',acc2:'#4FA38A',motif:'terraces',note:'Northern highlands'},
  myanmar: {bg:['#221A10','#130E08','#0A0704'],glow:'#D4A040',acc:'#EAC265',acc2:'#A8432F',motif:'terraces',note:'Shan highlands'},
  india:   {bg:['#2A1416','#160A0B','#0B0506'],glow:'#E07A3A',acc:'#F0B95A',acc2:'#2E8A7A',motif:'paisley',note:'Paisley'},
  png:     {bg:['#24160E','#140C07','#0A0603'],glow:'#C0703A',acc:'#E6B46A',acc2:'#7A2E1E',motif:'tapa',note:'Tapa cloth'},
  kona:    {bg:['#0F1F26','#081216','#04090B'],glow:'#3E9FC0',acc:'#F0C46A',acc2:'#3FB68B',motif:'waves',note:'Kona coast'},
  reunion: {bg:['#10202A','#081218','#04090C'],glow:'#3FA0C8',acc:'#F2C66B',acc2:'#E0604A',motif:'waves',note:'Île Bourbon'},
  jamaica: {bg:['#11201A','#09120E','#040907'],glow:'#3FA66B',acc:'#F2C94C',acc2:'#2E6FA8',motif:'contour',note:'Blue Mountains'}};
// Volcano and highland origins share contour lines, in their own colours.
for(const [k,glow,acc,acc2,note] of [['costarica','#3FA66B','#E9C46A','#C0503A','Volcanic highlands'],['honduras','#3E78B8','#E8BE60','#5FA36F','Mountain contours'],['nicaragua','#4F8FB0','#E6BF64','#C05A3A','Volcanic highlands'],
  ['ecuador','#D9A440','#EAC060','#3E78B8','Andean volcanoes'],['malawi','#3E8FB0','#E6BA62','#C0503A','Lake Malawi']])OT[k]={bg:['#13201C','#0A120F','#050908'],glow,acc,acc2,motif:'contour',note};
// Origins without a look of their own, including every country off the map, take their region's.
const OT_REG={africa:'kenya',arabia:'yemen',asia:'indonesia',central:'guatemala',south:'colombia'};
// The stamp's region is the short name of the first growing area ("Jazan (Khawlan…)" becomes "Jazan").
function originTheme(k){const o=k&&oInfo(k);if(!o)return null;const sub=String((o.subs||[])[0]||'').replace(/\s*\(.*$/,'').replace(/\s*[,/:].*$/,'').trim();
  return Object.assign({key:k,name:o.name.replace(/ \(.*\)$/,''),sub},OT[k]||OT[OT_REG[o.reg]]||OT.house)}
const hexA=(h,a)=>{const n=parseInt(h.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'};
const bcA=a=>hexA(BC.HONEY,a);
/* ---------- Card styles ---------- */
// You choose each card's look when you share it: Dark or Light, in the origin's own colours or one of the app's coffee
// colours. The origin's pattern and stamp stay in every style. Text colours are worked out against the card's own
// backgrounds, so every style keeps at least 4.5:1 contrast (the accent is stepped lighter or darker until it does).
const rgbOf=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]};
const hexOf=c=>'#'+c.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');
const mixHex=(a,b,t)=>{const A=rgbOf(a),B=rgbOf(b);return hexOf(A.map((v,i)=>v+(B[i]-v)*t))};
const relLum=h=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};const [r,g,b]=rgbOf(h);return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)};
const cRatio=(a,b)=>{const A=relLum(a),B=relLum(b);return(Math.max(A,B)+0.05)/(Math.min(A,B)+0.05)};
// Step a colour towards `to` (white or black) until it reaches `ratio` against every background in `bgs`.
const ensureC=(c,bgs,ratio,to)=>{for(let i=0;i<40&&bgs.some(bg=>cRatio(c,bg)<ratio);i++)c=mixHex(c,to,0.07);return c};
// What a translucent colour looks like over a background (to measure text on panels and chips).
const over=(fg,a,bg)=>mixHex(bg,fg,a);
let CARD_STYLE=(v=>({mode:v&&v.mode==='light'?'light':'dark',col:v&&typeof v.col==='string'?v.col:'origin'}))(load('bb-cardstyle',null));
const saveCardStyle=()=>save('bb-cardstyle',CARD_STYLE);
// The colour options: the origin's own, then the app's coffee colours (Settings > Colour).
const cardCols=()=>[['origin','Origin'],...ACCENTS.map(([k,n])=>[k,n])];
// A palette from one colour: deep tones for dark, tinted paper for light.
function palFrom(base,light){return light?{bg:[mixHex(base,'#FBF5EC',.86),mixHex(base,'#FBF5EC',.91),mixHex(base,'#FBF5EC',.94)],glow:mixHex(base,'#FFFFFF',.35),acc:base,acc2:mixHex(base,'#FFFFFF',.2)}
  :{bg:[mixHex(base,'#000000',.66),mixHex(base,'#000000',.8),mixHex(base,'#000000',.9)],glow:mixHex(base,'#FFFFFF',.25),acc:mixHex(base,'#FFE9C2',.62),acc2:mixHex(base,'#FFFFFF',.15)}}
// The card's theme in the chosen style. T is the origin's (or the house) theme; its pattern, stamp and names are kept.
function cardStyle(T,st){const light=st&&st.mode==='light',acc=ACCENTS.find(a=>a[0]===(st&&st.col));
  let pal=acc?palFrom(acc[2],light):{bg:T.bg.slice(),glow:T.glow,acc:T.acc,acc2:T.acc2};
  // The origin's own colours on paper: its deep tone tints the paper and its accents are deepened.
  if(!acc&&light){const bg=[mixHex(T.bg[0],'#FBF5EC',.84),mixHex(T.bg[0],'#FBF5EC',.9),mixHex(T.bg[0],'#FBF5EC',.94)];
    // On paper the origin's gold would turn muddy once deepened, so the accent is whichever of its colours reads best as it
    // is (Kenya's red, Yemen's blue), among the ones with real colour in them.
    const sat=h=>{const c=rgbOf(h);return(Math.max(...c)-Math.min(...c))/255},cands=[T.glow,T.acc2,T.acc].filter(c=>sat(c)>.3);
    const pick=(cands.length?cands:[T.acc]).sort((a,b)=>cRatio(b,bg[0])-cRatio(a,bg[0]))[0];
    pal={bg,glow:T.glow,acc:pick,acc2:pick===T.acc2?T.acc:T.acc2}}
  const ink=light?'#22160E':'#FFF8EE',to=light?'#000000':'#FFFFFF';
  // Text sits on the page, on panels and on chips: the accent must read on all of them.
  const pane=light?over('#FFFFFF',.8,pal.bg[1]):over(pal.bg[1],.9,pal.bg[1]),chip=light?over('#FFFFFF',.86,pal.bg[0]):over(pal.bg[0],.86,pal.bg[0]);
  const bgs=[...pal.bg,pane,chip],accT=ensureC(pal.acc,bgs,light?5:6,light?'#1A0E08':to);
  Object.assign(BC,{LIGHT:light,INK:ink,MUTED:hexA(ink,light?.78:.8),LINE:hexA(ink,.16),HONEY:accT,BG1:pal.bg[0],BG2:pal.bg[1],
    PANE:light?'rgba(255,255,255,.8)':hexA(pal.bg[1],.9),CHIP:light?'rgba(255,255,255,.86)':hexA(pal.bg[0],.86)});
  // The pattern is drawn in the accents: on paper they are deepened so the pattern still shows.
  return Object.assign({},T,{bg:pal.bg,glow:pal.glow,acc:accT,acc2:light?ensureC(pal.acc2,[pal.bg[1]],2.2,to):pal.acc2})}
// Patterns, drawn faint over the whole background and fading down the card. f(x,W,H,T) strokes or fills in T's colours.
const MOTIF={
  // Sana'a tower-house windows: arched frames with a round qamariya above.
  arches(x,W,H,T){x.lineWidth=2;for(let r=0;r*230<H;r++)for(let c=-1;c*190<W+190;c++){const cx=c*190+(r%2?95:0)+40,cy=r*230+40;
      x.strokeStyle=hexA(T.acc,.075*fadeY(cy));x.beginPath();x.moveTo(cx-38,cy+120);x.lineTo(cx-38,cy+38);x.arc(cx,cy+38,38,Math.PI,0);x.lineTo(cx+38,cy+120);x.closePath();x.stroke();
      x.beginPath();x.arc(cx,cy-24,16,0,TAU);x.stroke();x.beginPath();x.moveTo(cx,cy+2);x.lineTo(cx,cy+120);x.moveTo(cx-38,cy+70);x.lineTo(cx+38,cy+70);x.stroke()}},
  // Ethiopian tibeb: woven bands of diamonds and crosses.
  tibeb(x,W,H,T){for(let y=60;y<H;y+=180){x.fillStyle=hexA(T.acc,.06*fadeY(y));for(let c=0;c<W;c+=48){x.beginPath();x.moveTo(c+24,y-16);x.lineTo(c+40,y);x.lineTo(c+24,y+16);x.lineTo(c+8,y);x.closePath();x.fill()}
      x.fillStyle=hexA(T.acc2,.06*fadeY(y));x.fillRect(0,y+26,W,3);x.fillRect(0,y-29,W,3)}},
  // Maasai beadwork: rows of beads curving like a collar.
  beads(x,W,H,T){const cols=[T.acc,T.acc2,'#F3EADC'];for(let r=0;r<16;r++){const R=260+r*70;for(let a=0;a<TAU;a+=10/R){const px=W*0.85+Math.cos(a)*R,py=-80+Math.sin(a)*R;if(py<0||py>H||px<0||px>W)continue;
      x.fillStyle=hexA(cols[(r+Math.floor(a*R/40))%3],.08*fadeY(py));x.beginPath();x.arc(px,py,5,0,TAU);x.fill()}}},
  // Kilimanjaro: ridge lines with a snow cap, then a field of dots.
  kili(x,W,H,T){for(let i=0;i<7;i++){x.strokeStyle=hexA(i?T.acc:'#F3EADC',.08);x.lineWidth=2;x.beginPath();const b=360+i*26;x.moveTo(0,b+120);x.lineTo(W*0.3,b+40);x.lineTo(W*0.5,b-120+i*14);x.lineTo(W*0.58,b-110+i*14);x.lineTo(W*0.75,b+10);x.lineTo(W,b+90);x.stroke()}
    for(let y=700;y<H;y+=46)for(let c=(y/46)%2*23;c<W;c+=46){x.fillStyle=hexA(T.acc2,.05*fadeY(y));x.beginPath();x.arc(c,y,3,0,TAU);x.fill()}},
  // Rwandan imigongo: nested zigzag diamonds.
  imigongo(x,W,H,T){x.lineWidth=3;for(let r=0;r*200<H+200;r++)for(let c=0;c*200<W+200;c++){const cx=c*200+(r%2?100:0),cy=r*200;
      for(let k=1;k<=4;k++){x.strokeStyle=hexA(k%2?T.acc:T.acc2,.06*fadeY(cy));const s=k*22;x.beginPath();x.moveTo(cx,cy-s);x.lineTo(cx+s,cy);x.lineTo(cx,cy+s);x.lineTo(cx-s,cy);x.closePath();x.stroke()}}},
  // Ugandan bark cloth: fine fibrous lines.
  bark(x,W,H,T){x.lineWidth=1.2;for(let y=0;y<H;y+=9){x.strokeStyle=hexA(T.acc,.05*fadeY(y));x.beginPath();x.moveTo(0,y);for(let c=0;c<=W;c+=60)x.lineTo(c,y+Math.sin(c*0.02+y*0.07)*4);x.stroke()}},
  // Kuba cloth: interlocking squares.
  kuba(x,W,H,T){x.lineWidth=3;for(let r=0;r*120<H;r++)for(let c=0;c*120<W+120;c++){const X=c*120+(r%2?60:0),Y=r*120;x.strokeStyle=hexA((r+c)%2?T.acc:T.acc2,.06*fadeY(Y));
      x.save();x.translate(X,Y);x.rotate(Math.PI/4);x.strokeRect(-34,-34,68,68);x.strokeRect(-18,-18,36,36);x.restore()}},
  // Wayuu mochila: rows of stepped diamonds.
  mochila(x,W,H,T){for(let y=80;y<H;y+=150)for(let c=0;c<W+80;c+=80){const step=10,cols=[T.acc,T.acc2];x.fillStyle=hexA(cols[(c/80)%2],.07*fadeY(y));
      for(let i=0;i<4;i++){x.fillRect(c-i*step,y-30+i*step,step*(2*i+1),step);x.fillRect(c-i*step,y+30-i*step,step*(2*i+1),step)}}},
  // Copacabana: long sinuous waves.
  waves(x,W,H,T){x.lineWidth=16;for(let y=0;y<H;y+=64){x.strokeStyle=hexA(y%128?T.acc2:T.acc,.05*fadeY(y));x.beginPath();for(let c=-20;c<=W+20;c+=20){const yy=y+Math.sin(c/90+y/50)*22;c<0?x.moveTo(c,yy):x.lineTo(c,yy)}x.stroke()}},
  // The Andean chakana: stepped crosses.
  chakana(x,W,H,T){for(let r=0;r*200<H;r++)for(let c=0;c*200<W+200;c++){const X=c*200+(r%2?100:0),Y=r*200+60,s=14;x.fillStyle=hexA((r+c)%2?T.acc:T.acc2,.07*fadeY(Y));
      x.fillRect(X-s*3,Y-s,s*6,s*2);x.fillRect(X-s,Y-s*3,s*2,s*6);x.fillRect(X-s*2,Y-s*2,s*4,s*4);x.fillStyle=BC.BG2||'#000';x.fillRect(X-s*0.6,Y-s*0.6,s*1.2,s*1.2)}},
  // The Guna mola: layered, offset outlines.
  mola(x,W,H,T){x.lineWidth=9;for(let k=0;k<9;k++){x.strokeStyle=hexA(k%2?T.acc2:T.acc,.06);x.beginPath();x.ellipse(W*0.82,180,140+k*48,90+k*36,0.3,0,TAU);x.stroke()}
    for(let y=900;y<H;y+=120){x.strokeStyle=hexA(T.acc2,.05*fadeY(y));x.lineWidth=8;x.beginPath();for(let c=0;c<=W;c+=60)x.lineTo(c,y+((c/60)%2?28:-28));x.stroke()}},
  // Huipil: bright zigzag rows.
  huipil(x,W,H,T){x.lineWidth=5;for(let y=60;y<H;y+=90){x.strokeStyle=hexA((y/90)%2?T.acc:T.acc2,.07*fadeY(y));x.beginPath();for(let c=0;c<=W;c+=36)x.lineTo(c,y+((c/36)%2?18:-18));x.stroke()}},
  // Talavera: tiles with four-petal rosettes.
  talavera(x,W,H,T){for(let r=0;r*150<H;r++)for(let c=0;c*150<W+150;c++){const X=c*150+75,Y=r*150+75,a=.07*fadeY(Y);x.strokeStyle=hexA(T.acc2,a);x.lineWidth=2;x.strokeRect(X-75,Y-75,150,150);
      x.fillStyle=hexA(T.acc,a);for(let p=0;p<4;p++){x.beginPath();x.ellipse(X+Math.cos(p*Math.PI/2)*26,Y+Math.sin(p*Math.PI/2)*26,22,11,p*Math.PI/2,0,TAU);x.fill()}x.beginPath();x.arc(X,Y,9,0,TAU);x.fill()}},
  // Kawung batik: four ovals around a point.
  kawung(x,W,H,T){for(let r=0;r*110<H;r++)for(let c=0;c*110<W+110;c++){const X=c*110,Y=r*110;x.fillStyle=hexA((r+c)%2?T.acc:T.acc2,.06*fadeY(Y));
      for(let p=0;p<4;p++){x.beginPath();x.ellipse(X+Math.cos(p*Math.PI/2+Math.PI/4)*30,Y+Math.sin(p*Math.PI/2+Math.PI/4)*30,26,14,p*Math.PI/2+Math.PI/4,0,TAU);x.fill()}}},
  // Rice terraces: stacked curving contours.
  terraces(x,W,H,T){x.lineWidth=3;for(let i=0;i<60;i++){const y=40+i*42;x.strokeStyle=hexA(i%3?T.acc:T.acc2,.07*fadeY(y));x.beginPath();for(let c=0;c<=W;c+=20)x.lineTo(c,y+Math.sin(c/180+i*0.5)*30+Math.sin(c/60)*4);x.stroke()}},
  // Paisley: tear-drop boteh.
  paisley(x,W,H,T){for(let r=0;r*170<H;r++)for(let c=0;c*170<W+170;c++){const X=c*170+(r%2?85:0),Y=r*170+60;x.save();x.translate(X,Y);x.rotate(r%2?0.6:-0.6);x.strokeStyle=hexA((r+c)%2?T.acc:T.acc2,.08*fadeY(Y));x.lineWidth=2.5;
      x.beginPath();x.moveTo(0,-40);x.bezierCurveTo(40,-30,40,30,0,36);x.bezierCurveTo(-30,30,-30,0,0,0);x.bezierCurveTo(10,-10,10,-30,0,-40);x.stroke();x.restore()}},
  // Tapa: rows of triangles.
  tapa(x,W,H,T){for(let y=40;y<H;y+=80){x.fillStyle=hexA((y/80)%2?T.acc:T.acc2,.06*fadeY(y));for(let c=0;c<W;c+=40){x.beginPath();x.moveTo(c,y+20);x.lineTo(c+20,y-14);x.lineTo(c+40,y+20);x.closePath();x.fill()}}},
  // Volcano contours.
  contour(x,W,H,T){x.lineWidth=2;for(let k=0;k<22;k++){x.strokeStyle=hexA(k%4?T.acc:T.acc2,.075);x.beginPath();for(let a=0;a<=TAU+0.01;a+=0.05){const r=40+k*42+Math.sin(a*3+k)*12+Math.cos(a*5)*8;const px=W*0.8+Math.cos(a)*r*1.2,py=140+Math.sin(a)*r*0.8;a?x.lineTo(px,py):x.moveTo(px,py)}x.stroke()}}};
// The rest of the map, each with its own look.
Object.assign(OT,{
  southsudan:{bg:['#22140F','#130B08','#0A0504'],glow:'#C0503A',acc:'#EBB04F',acc2:'#3A7CB8',motif:'beads',note:'Dinka beadwork'},
  saudi:     {bg:['#2A1310','#160A08','#0B0504'],glow:'#C24A30',acc:'#EBB75E',acc2:'#F3EADC',motif:'sadu',note:'Al Sadu weave'},
  oman:      {bg:['#102221','#091514','#050B0B'],glow:'#D9A54A',acc:'#E8C47C',acc2:'#C8423A',motif:'forts',note:'Fort battlements'},
  philippines:{bg:['#1E1A10','#110E08','#090704'],glow:'#C9A040',acc:'#EAC462',acc2:'#3E8F86',motif:'banig',note:'Banig mat'},
  laos:      {bg:['#13201B','#0A120F','#050907'],glow:'#5FA37F',acc:'#E6C06A',acc2:'#B0473A',motif:'contour',note:'Bolaven Plateau'},
  srilanka:  {bg:['#2A1218','#16090D','#0B0507'],glow:'#D8607A',acc:'#EFBE5E',acc2:'#3FA08A',motif:'lotus',note:'Kandyan lotus'},
  nepal:     {bg:['#151B2C','#0B0F18','#05070C'],glow:'#4F7FC0',acc:'#EEC160',acc2:'#D0503F',motif:'flags',note:'Prayer flags'},
  taiwan:    {bg:['#121E20','#0A1213','#05090A'],glow:'#5FA0A8',acc:'#E3C276',acc2:'#B84A4A',motif:'clouds',note:'Alishan mist'},
  cuba:      {bg:['#151C2A','#0B0F17','#05070C'],glow:'#3E78B8',acc:'#EDC266',acc2:'#C0503F',motif:'talavera',note:'Cement tiles'},
  dominican: {bg:['#0F1F26','#081216','#04090B'],glow:'#3FA8C8',acc:'#F2C66B',acc2:'#E0604A',motif:'waves',note:'Caribbean waves'},
  haiti:     {bg:['#13201C','#0A120F','#050908'],glow:'#3E78B8',acc:'#E8BE60',acc2:'#C0503A',motif:'contour',note:'Haitian highlands'},
  puertorico:{bg:['#17192C','#0C0D18','#06060C'],glow:'#5F8FC8',acc:'#F0C46A',acc2:'#E07A8A',motif:'talavera',note:'Old San Juan tiles'},
  venezuela: {bg:['#15201A','#0B120E','#050907'],glow:'#E0A33A',acc:'#F2C94C',acc2:'#C0423A',motif:'mochila',note:'Wayuu weave'},
  zambia:    {bg:['#1C2014','#10120B','#080905'],glow:'#5FA33F',acc:'#EBB64E',acc2:'#C0503A',motif:'waxprint',note:'Chitenge print'},
  zimbabwe:  {bg:['#221B12','#130F0A','#0A0805'],glow:'#C69A4E',acc:'#E6BE74',acc2:'#7A8F4E',motif:'huipil',note:'Great Zimbabwe chevrons'},
  cameroon:  {bg:['#121A2C','#0A0E18','#05070C'],glow:'#3E6EB8',acc:'#E6C27A',acc2:'#F3EADC',motif:'kuba',note:'Ndop cloth'},
  ivorycoast:{bg:['#22170E','#130D08','#0A0704'],glow:'#E08A3A',acc:'#F0B95A',acc2:'#3F8F5A',motif:'kente',note:'Baoulé strip cloth'},
  sierraleone:{bg:['#141A2A','#0A0E17','#05070C'],glow:'#4F6FB8',acc:'#E9C06A',acc2:'#5FA37F',motif:'waxprint',note:'Gara tie-dye'},
  madagascar:{bg:['#1E1410','#110B08','#090604'],glow:'#C9703E',acc:'#EBB863',acc2:'#3F8F7A',motif:'kente',note:'Lamba weave'}});
Object.assign(MOTIF,{
  // Al Sadu: bands of triangles and diamonds between stripes.
  // Omani fort walls (Nizwa, Bahla): rows of pointed battlements with a round tower and its arched window.
  forts(x,W,H,T){x.lineWidth=2;for(let r=0,y=120;y<H;r++,y+=260){const a=.08*fadeY(y);x.strokeStyle=hexA(T.acc,a);
      x.beginPath();x.moveTo(0,y);for(let c=0;c<W;c+=40){x.lineTo(c+8,y);x.lineTo(c+20,y-22);x.lineTo(c+32,y);x.lineTo(c+40,y)}x.stroke();
      for(let c=r%2?210:60;c<W+60;c+=300){x.beginPath();x.moveTo(c-40,y+110);x.lineTo(c-40,y-30);for(let i=-40;i<40;i+=20){x.lineTo(i+c+10,y-52);x.lineTo(i+c+20,y-30)}x.lineTo(c+40,y+110);x.stroke();
        x.fillStyle=hexA(T.acc2,a*1.2);x.beginPath();x.moveTo(c-11,y+40);x.lineTo(c-11,y+6);x.arc(c,y+6,11,Math.PI,0);x.lineTo(c+11,y+40);x.closePath();x.fill()}}},
  sadu(x,W,H,T){for(let y=50;y<H;y+=170){const a=.07*fadeY(y);x.fillStyle=hexA(T.acc,a);x.fillRect(0,y-34,W,4);x.fillRect(0,y+30,W,4);
      for(let c=0;c<W;c+=60){x.fillStyle=hexA(T.acc2,a);x.beginPath();x.moveTo(c,y+26);x.lineTo(c+30,y-26);x.lineTo(c+60,y+26);x.closePath();x.fill();x.fillStyle=hexA(T.acc,a);x.beginPath();x.moveTo(c+30,y-8);x.lineTo(c+40,y+4);x.lineTo(c+30,y+16);x.lineTo(c+20,y+4);x.closePath();x.fill()}}},
  // Banig: a diagonal mat weave.
  banig(x,W,H,T){const s=36;for(let r=0;r*s<H+s;r++)for(let c=0;c*s<W+s;c++){if((r+c)%2)continue;const X=c*s,Y=r*s;x.fillStyle=hexA((Math.floor(r/3)+Math.floor(c/3))%2?T.acc:T.acc2,.055*fadeY(Y));
      x.save();x.translate(X,Y);x.rotate(Math.PI/4);x.fillRect(-s*0.35,-s*0.12,s*0.7,s*0.24);x.restore()}},
  // Kandyan lotus: petal rosettes.
  lotus(x,W,H,T){for(let r=0;r*190<H;r++)for(let c=0;c*190<W+190;c++){const X=c*190+(r%2?95:0),Y=r*190+60,a=.07*fadeY(Y);x.strokeStyle=hexA((r+c)%2?T.acc:T.acc2,a);x.lineWidth=2.5;
      for(let p=0;p<8;p++){x.save();x.translate(X,Y);x.rotate(p*Math.PI/4);x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(16,-28,0,-52);x.quadraticCurveTo(-16,-28,0,0);x.stroke();x.restore()}x.beginPath();x.arc(X,Y,8,0,TAU);x.stroke()}},
  // Prayer flags: strings of five colours swinging across.
  flags(x,W,H,T){const cols=['#3E78B8','#F3EADC','#C0503A','#5FA37F','#E9C06A'];for(let k=0;k<12;k++){const y0=60+k*130,a=.09*fadeY(y0);x.strokeStyle=hexA(T.acc,a);x.lineWidth=1.5;x.beginPath();x.moveTo(0,y0);x.quadraticCurveTo(W/2,y0+70,W,y0);x.stroke();
      for(let i=0;i<14;i++){const t=(i+0.5)/14,px=t*W,py=y0+2*(1-t)*t*70*1;x.fillStyle=hexA(cols[i%5],a*1.3);x.fillRect(px-14,py+2,28,34)}}},
  // Alishan mist: rolling cloud scrolls.
  clouds(x,W,H,T){x.lineWidth=3;for(let r=0;r*170<H;r++)for(let c=0;c*240<W+240;c++){const X=c*240+(r%2?120:0),Y=r*170+50;x.strokeStyle=hexA((r+c)%2?T.acc:T.acc2,.07*fadeY(Y));
      x.beginPath();x.arc(X,Y,30,Math.PI,TAU*0.98);x.stroke();x.beginPath();x.arc(X+46,Y+4,22,Math.PI*1.1,TAU*0.95);x.stroke();x.beginPath();x.arc(X-14,Y+2,12,0,Math.PI*1.6);x.stroke();x.beginPath();x.moveTo(X-60,Y+26);x.lineTo(X+80,Y+26);x.stroke()}},
  // Wax print and tie-dye: concentric rings.
  waxprint(x,W,H,T){x.lineWidth=4;for(let r=0;r*160<H;r++)for(let c=0;c*160<W+160;c++){const X=c*160+(r%2?80:0),Y=r*160+40;for(let k=1;k<=4;k++){x.strokeStyle=hexA(k%2?T.acc:T.acc2,.06*fadeY(Y));x.beginPath();x.arc(X,Y,k*15,0,TAU);x.stroke()}}},
  // Strip cloth: woven blocks in narrow strips.
  kente(x,W,H,T){const sw=90,bh=60;for(let c=0;c*sw<W;c++)for(let r=0;r*bh<H;r++){const X=c*sw,Y=r*bh,a=.06*fadeY(Y),k=(r+c*2)%4;
      if(k===0){x.fillStyle=hexA(T.acc,a);x.fillRect(X+6,Y+6,sw-12,bh-12)}else if(k===1){x.fillStyle=hexA(T.acc2,a);for(let i=0;i<4;i++)x.fillRect(X+6,Y+8+i*12,sw-12,5)}else if(k===2){x.fillStyle=hexA(T.acc,a);for(let i=0;i<5;i++)x.fillRect(X+8+i*16,Y+6,6,bh-12)}}}});
// MK scales every pattern: faint over the page, strong in the hero band at the top.
let MK=1;const fadeY=y=>MK*Math.max(0.35,1-y/2200);
// The band along the top: the pattern's colours as a woven strip.
function bcBand(x,W,T){const cols=[T.acc,T.acc2,T.glow];const h=14;for(let c=0,i=0;c<W;c+=28,i++){x.fillStyle=hexA(cols[i%3],.85);x.fillRect(c,0,28,h)}
  x.fillStyle=hexA('#000000',.25);for(let c=0;c<W;c+=28){x.beginPath();x.moveTo(c,h);x.lineTo(c+14,0);x.lineTo(c+28,h);x.closePath();x.fill()}}
// A passport-style stamp: the country on the arc, a growing region beneath, the bean in the middle.
// Shorter forms for names too long for the stamp's ring, tried after the full name. ':sub' entries are for the region.
const STAMP_SHORT={dominican:'Dominican Rep.',png:'Papua N.G.','jamaica:sub':'Blue Mtns','laos:sub':'Bolaven','cuba:sub':'S. Maestra',
  car:'C. African Rep.',congo:'Rep. of Congo',eqguinea:'Eq. Guinea',saotome:'São Tomé',uae:'UAE',trinidad:'Trinidad',solomon:'Solomon Is.'};
const STAMP_ARC=2.5,STAMP_MIN=15;
// The names to try: the full name, a set short form, then the name with its last words dropped.
// A shortened name never ends on a small word ("São Tomé and").
function stampNames(t,short){const w=t.split(' '),out=[t];if(short)out.push(short);for(let n=w.length-1;n>0;n--)if(!/^(and|of|the|de|da|del)$/i.test(w[n-1]))out.push(w.slice(0,n).join(' '));return out}
// The first name that fits the arc at the largest size and spacing; failing that, the shortest name, squeezed to fit.
function stampFit(x,names,r){let f;
  for(const t0 of names){const t=t0.toUpperCase();for(let sz=19;sz>=STAMP_MIN;sz--)for(const sp of [4,3,2]){
    x.font='800 '+sz+'px '+BC.F;x.letterSpacing='0px';const a=[...t].reduce((s,ch)=>s+x.measureText(ch).width+sp,0)/r;
    f={t,font:x.font,sp,a};if(a<=STAMP_ARC)return f}}
  const n=f.t.length;f.sp-=(f.a-STAMP_ARC)*r/n;f.a=STAMP_ARC;return f}
function bcStamp(x,cx,cy,T){const R=92;x.save();x.translate(cx,cy);x.rotate(-0.16);
  x.strokeStyle=hexA(T.acc,.85);x.lineWidth=3;x.beginPath();x.arc(0,0,R,0,TAU);x.stroke();x.lineWidth=1.5;x.beginPath();x.arc(0,0,R-12,0,TAU);x.stroke();
  // Letters set along the ring: reading left to right over the top, and left to right along the bottom. Each name is fitted to
  // its half of the ring, clear of the side dots: smaller type and tighter spacing first, then a shorter form of the name.
  const r=R-28,fit=t=>stampFit(x,t,r);
  const arcText=(f,top)=>{x.font=f.font;x.fillStyle=hexA(T.acc,.95);x.textAlign='center';x.textBaseline='middle';
    const ws=[...f.t].map(ch=>x.measureText(ch).width+f.sp);let a=top?-Math.PI/2-f.a/2:Math.PI/2+f.a/2;
    [...f.t].forEach((ch,i)=>{const h=ws[i]/2/r;a+=top?h:-h;x.save();x.rotate(a);x.translate(r,0);x.rotate(top?Math.PI/2:-Math.PI/2);x.fillText(ch,0,0);x.restore();a+=top?h:-h})};
  arcText(fit(stampNames(T.name,STAMP_SHORT[T.key])),true);if(T.sub)arcText(fit(stampNames(T.sub,STAMP_SHORT[T.key+':sub'])),false);
  bcBean(x,0,0,40,hexA(T.acc,.95),T.bg[0]);x.fillStyle=hexA(T.acc,.95);for(const s of [-1,1]){x.beginPath();x.arc(s*(R-28),0,3,0,TAU);x.fill()}x.restore();x.textAlign='left';x.textBaseline='alphabetic'}

/* Draw a card. m: {kicker, date, photo (an image), title, by, sub, rating {kind,v,word}, pills [[text,main]], tiles [[label,value]],
   grind {g,c,line}, cup {r,vt,vs}, text [{label,body}], steps [], expect {label,items,bar}, quote {label,text}, footer} */
function bcDraw(m){const W=BC.W,P=BC.PAD,IW=W-2*P,c=document.createElement('canvas');c.width=W;c.height=4400;const x=c.getContext('2d');
  BC.F=getComputedStyle(document.body).fontFamily;
  // The origin's look (or the house espresso and honey): its accent colours are used throughout the card.
  const T=cardStyle(m.theme||OT.house,m.style||CARD_STYLE);
  bcBG(x,W,c.height,T);
  x.textBaseline='alphabetic';x.textAlign='left';if(T.motif)bcBand(x,W,T);
  bcCheck(x,W,T);
  return bcBody(x,c,m,T)}
// The background: the palette's deep tones, a soft glow, the origin's pattern (bold in the hero band, faint below), a faint
// bean watermark and a very fine grain. Text never sits on it directly where it is busy: see bcBody.
function bcBG(x,W,H,T){const c={height:H};
  const bg=x.createLinearGradient(0,0,0,c.height);bg.addColorStop(0,T.bg[0]);bg.addColorStop(0.45,T.bg[1]);bg.addColorStop(1,T.bg[2]);x.fillStyle=bg;x.fillRect(0,0,W,c.height);
  const gl=x.createRadialGradient(W*0.95,-60,10,W*0.95,-60,W*1.05);gl.addColorStop(0,hexA(T.glow,.30));gl.addColorStop(1,hexA(T.glow,0));x.fillStyle=gl;x.fillRect(0,0,W,1300);
  // On paper a pattern needs more ink to show as much as it does on a dark card.
  const MP=BC.LIGHT?1.7:1;
  if(T.motif&&MOTIF[T.motif]){x.save();MK=MP;MOTIF[T.motif](x,W,c.height,T);x.restore();
    // The hero band: the pattern bold across the top, fading into the card.
    x.save();x.beginPath();x.rect(0,0,W,470);x.clip();MK=5.5*MP;MOTIF[T.motif](x,W,470,T);MK=1;x.restore();
    const fd=x.createLinearGradient(0,0,0,470),hf=BC.LIGHT?[.94,.9]:[.8,.72];fd.addColorStop(0,hexA(T.bg[0],hf[0]));fd.addColorStop(0.2,hexA(T.bg[0],hf[1]));fd.addColorStop(0.32,hexA(T.bg[0],.18));fd.addColorStop(0.62,hexA(T.bg[0],.6));fd.addColorStop(1,hexA(T.bg[0],1));x.fillStyle=fd;x.fillRect(0,0,W,471)}
  const gl2=x.createRadialGradient(-120,1100,10,-120,1100,760);gl2.addColorStop(0,hexA(T.acc2,BC.LIGHT?.08:.16));gl2.addColorStop(1,hexA(T.acc2,0));x.fillStyle=gl2;x.fillRect(0,0,W,2000);
  if(!T.motif){x.save();x.globalAlpha=0.05;bcBean(x,W-150,250,420,BC.HONEY,T.bg[0]);x.restore()}
  x.fillStyle=BC.LIGHT?'rgba(60,36,20,.03)':'rgba(255,255,255,.022)';for(let gy=0;gy<c.height;gy+=7)for(let gx=(gy/7)%2*3.5;gx<W;gx+=7)x.fillRect(gx,gy,1,1);
  // A soft shade on the left of the hero band, where the title and credit sit.
  if(T.motif){const sc=x.createLinearGradient(0,0,W*0.75,0);sc.addColorStop(0,hexA(T.bg[0],.62));sc.addColorStop(1,hexA(T.bg[0],0));x.fillStyle=sc;x.fillRect(0,130,W,320)}}
// The card checks itself: the accent is measured against the background actually drawn under the header, the title and
// the body (glow and pattern included), and stepped further from it if any of them falls short.
function bcCheck(x,W,T){const P=BC.PAD,worst=(y0,y1,x0,x1)=>{const d=x.getImageData(x0,y0,x1-x0,y1-y0).data,L=[];for(let i=0;i<d.length;i+=4*7)L.push(hexOf([d[i],d[i+1],d[i+2]]));
    L.sort((a,b)=>relLum(a)-relLum(b));return L[Math.floor(L.length*(BC.LIGHT?0.03:0.97))]};
  const zs=[worst(70,112,P,W-P),worst(150,330,P,W-300),worst(330,470,P,W-P),worst(900,2400,P,W-P)];
  BC.HONEY=T.acc=ensureC(BC.HONEY,zs,BC.LIGHT?4.8:5.2,BC.LIGHT?'#1A0E08':'#FFFFFF')}
function bcBody(x,c,m,T){const W=BC.W,P=BC.PAD,IW=W-2*P;
  // Header: the mark and kicker, the date, then a fine rule.
  let y=100;bcBean(x,P+16,y-9,32,BC.HONEY);bcLabel(x,m.kicker||'The Brew Bench',P+44,y);
  x.textAlign='right';x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(m.date||new Date().toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}),W-P,y);x.textAlign='left';
  y+=30;const rl=x.createLinearGradient(P,0,W-P,0);rl.addColorStop(0,bcA(.55));rl.addColorStop(1,bcA(0));x.fillStyle=rl;x.fillRect(P,y,IW,1.5);
  // A photo of the bag, framed like a print.
  if(m.photo){y+=36;const ph=m.photo,bh=Math.round(IW*0.72);x.save();bcRound(x,P,y,IW,bh,30);x.clip();
    const s=Math.max(IW/ph.width,bh/ph.height),dw=ph.width*s,dh=ph.height*s;x.drawImage(ph,P+(IW-dw)/2,y+(bh-dh)/2,dw,dh);
    const sh=x.createLinearGradient(0,y+bh*0.6,0,y+bh);sh.addColorStop(0,'rgba(14,8,5,0)');sh.addColorStop(1,'rgba(14,8,5,.5)');x.fillStyle=sh;x.fillRect(P,y,IW,bh);x.restore();
    bcRound(x,P,y,IW,bh,30);x.lineWidth=1.5;x.strokeStyle=bcA(.45);x.stroke();
    // The origin's stamp, set on the photo's corner like a sticker on the bag.
    if(T.key){x.beginPath();x.arc(W-P-110,y+bh-104,100,0,TAU);x.fillStyle=hexA(T.bg[1],.82);x.fill();bcStamp(x,W-P-110,y+bh-104,T)}y+=bh}
  // Title and credit
  // The origin's stamp sits top right, so the title wraps short of it.
  const stamp=T.key&&!m.photo,TW=stamp?IW-220:IW;if(stamp)bcStamp(x,W-P-96,y+126,T);
  y+=104;x.font='800 76px '+BC.F;x.fillStyle=BC.INK;x.letterSpacing='-1px';x.shadowColor=BC.LIGHT?'rgba(255,255,255,.75)':'rgba(0,0,0,.5)';x.shadowBlur=18;
  for(const l of bcWrap(x,m.title,TW,2)){x.fillText(l,P,y);y+=84}x.letterSpacing='0px';x.shadowBlur=0;x.shadowColor='transparent';
  if(m.by){x.font='italic 500 28px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,m.by,TW,1)[0],P,y-34);y+=10}
  if(stamp)y=Math.max(y,230+126+70);
  if(m.sub){x.font='600 32px '+BC.F;x.fillStyle=BC.HONEY;x.fillText(bcWrap(x,m.sub,IW,1)[0],P,y+4);y+=56}
  // Rating, large, with its word.
  if(m.rating&&m.rating.v){y+=6;bcRating(x,m.rating.kind,m.rating.v,P,y+24,46);const rv=String(m.rating.v).replace('.5','½'),rx=P+5*46*1.18+14;
    x.font='800 38px '+BC.F;x.fillStyle=BC.INK;x.fillText(rv,rx,y+37);
    if(m.rating.word){const vw=x.measureText(rv).width;x.font='500 28px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(m.rating.word,rx+vw+18,y+37)}y+=74}
  // Pills: outlined, the first (the target cup) in honey.
  if(m.pills&&m.pills.length){let px=P;y+=4;for(const [t,main] of m.pills){x.font='600 24px '+BC.F;const w=x.measureText(t).width+40;if(px+w>W-P){px=P;y+=60}
      bcRound(x,px,y,w,48,24);x.fillStyle=BC.CHIP;x.fill();if(main){x.fillStyle=bcA(.16);x.fill()}x.lineWidth=1.5;x.strokeStyle=main?bcA(.7):bcI(.22);x.stroke();
      x.fillStyle=main?BC.HONEY:bcI(.85);x.fillText(t,px+20,y+32);px+=w+10}y+=78}else y+=20;
  // The spec sheet: the coffee on one row, the numbers on the next, in one panel divided by fine lines.
  const specRows=[m.coffee,m.tiles].filter(r=>r&&r.length);
  if(specRows.length){const rows=specRows.map((r,ri)=>{const n=r.length,cw=IW/n,big=r===m.tiles,fs=big?(n>3?44:38):(n>3?28:32);x.font='700 '+fs+'px '+BC.F;
      const cells=r.map(([k,v])=>[k,bcWrap(x,v||'–',cw-44,2)]),lines=Math.max(...cells.map(cc=>cc[1].length));return{n,cw,fs,cells,big,h:big?136:(lines>1?150:118)}});
    const H=rows.reduce((a,r)=>a+r.h,0);bcPane(x,P,y,IW,H,28);let ry=y;
    rows.forEach((r,ri)=>{if(ri){x.fillStyle=bcI(.10);x.fillRect(P+24,ry,IW-48,1.5)}
      r.cells.forEach(([k,ls],i)=>{const X=P+i*r.cw;if(i){x.fillStyle=bcI(.09);x.fillRect(X,ry+22,1.5,r.h-44)}
        bcLabel(x,k,X+24,ry+44,r.big?BC.MUTED:BC.HONEY);x.font='700 '+r.fs+'px '+BC.F;x.fillStyle=BC.INK;ls.forEach((l,j)=>x.fillText(l,X+24,ry+(r.big?100:90)+j*(r.fs+8)))});ry+=r.h});
    y+=H+20}
  // Grind, with the dial drawn at the setting
  if(m.grind&&GRINDERS[m.grind.g]){const G=GRINDERS[m.grind.g],h=280,st=m.grind.c;bcPane(x,P,y,IW,h,28);bcDial(x,m.grind.g,st,P+146,y+h/2,108);const X=P+292;
    bcLabel(x,'Grind',X,y+64);x.font='800 88px '+BC.F;x.fillStyle=BC.INK;const dv=dial(m.grind.g,st);x.fillText(dv,X,y+154);
    const sw=x.measureText(dv).width;x.font='500 28px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(G.fmt==='rot'?Math.round(st)+' clicks':G.unit==='clicks'?'clicks':'',X+sw+16,y+154);
    x.font='600 30px '+BC.F;x.fillStyle=BC.INK;x.fillText(bcWrap(x,G.name,W-P-X-30,1)[0],X,y+200);
    if(m.grind.line){x.font='500 25px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,m.grind.line,W-P-X-30,1)[0],X,y+240)}y+=h+20}
  // The predicted cup
  if(m.cup){const r=m.cup.r,h=430,X=P+478,w=W-P-X-36;bcPane(x,P,y,IW,h,28);bcCup(x,r,P+212,y+h/2+6,100,P+24,X-20);
    bcLabel(x,'Predicted cup',X,y+68);x.font='800 44px '+BC.F;x.fillStyle=BC.INK;let yy=y+124;for(const l of bcWrap(x,m.cup.vt,w,2)){x.fillText(l,X,yy);yy+=52}
    x.font='500 25px '+BC.F;x.fillStyle=BC.MUTED;for(const l of bcWrap(x,m.cup.vs,w,4)){x.fillText(l,X,yy);yy+=35}
    const gy=y+h-84,gw=w;const gg=x.createLinearGradient(X,0,X+gw,0);gg.addColorStop(0,'#D9B35A');gg.addColorStop(.25,'#C98A3E');gg.addColorStop(.5,'#7A4524');gg.addColorStop(.75,'#4A2A18');gg.addColorStop(1,'#1E120B');
    bcRound(x,X,gy,gw,12,6);x.fillStyle=gg;x.fill();x.strokeStyle=bcI(.14);x.lineWidth=1;x.stroke();
    const mx=X+(clamp(r.D,-2.5,2.5)+2.5)/5*gw;bcRound(x,mx-4,gy-11,8,34,4);x.fillStyle=BC.INK;x.fill();
    x.font='500 19px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='left';x.fillText('Under',X,gy+48);x.textAlign='center';x.fillText('Sweet spot',X+gw/2,gy+48);x.textAlign='right';x.fillText('Over',X+gw,gy+48);x.textAlign='left';y+=h+20}
  // Text blocks (settings written as text, for log entries from before brews were kept in full)
  for(const tb of m.text||[]){if(!tb.body)continue;x.font='500 29px '+BC.F;const lines=bcWrap(x,tb.body,IW-56,6),h=86+lines.length*40;bcPane(x,P,y,IW,h,28);
    bcLabel(x,tb.label,P+28,y+48);x.font='500 29px '+BC.F;x.fillStyle=BC.INK;lines.forEach((l,j)=>x.fillText(l,P+28,y+94+j*40));y+=h+20}
  // Every pour: the times in a honey column, a fine line linking the steps.
  const steps=m.steps||[];
  if(steps.length){y+=40;bcLabel(x,'The pours',P,y);
    const last=[...steps].reverse().map(t=>/^(\d+:\d\d)/.exec(t)).find(Boolean);if(last){x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='right';x.fillText('Done by '+last[1],W-P,y);x.textAlign='left'}y+=22;
    const tx=P+108,tw=W-P-tx-10,show=steps.slice(0,10);x.font='500 30px '+BC.F;
    const rows=show.map(s=>{const mm=/^(\d+:\d\d)\s*(.*)$/.exec(s);return{t:mm?mm[1]:'',d:bcCap(mm?mm[2]:s)}}).map(o=>({...o,lines:bcWrap(x,o.d,tw,2)}));
    const top=y+18;let yy=y;const ys=rows.map(o=>{const r0=yy;yy+=30+o.lines.length*40;return r0});
    x.fillStyle=bcA(.28);x.fillRect(P+86,top+22,1.5,Math.max(0,ys[ys.length-1]-y+4));
    rows.forEach((o,i)=>{const ry=ys[i];x.font='700 26px '+BC.F;x.fillStyle=BC.HONEY;x.fillText(o.t||'·',P,ry+50);
      x.beginPath();x.arc(P+86.75,ry+41,7,0,TAU);x.fillStyle=BC.BG2;x.fill();x.lineWidth=2;x.strokeStyle=BC.HONEY;x.stroke();
      x.font='500 30px '+BC.F;x.fillStyle=BC.INK;o.lines.forEach((l,j)=>x.fillText(l,tx,ry+51+j*40))});
    y=yy+10;if(steps.length>show.length){x.font='500 23px '+BC.F;x.fillStyle=BC.MUTED;x.fillText('+ '+(steps.length-show.length)+' more in the app',tx,y+10);y+=36}}
  // Notes: expected or tasted, with the flavour families as one bar in the wheel's colours
  if(m.expect&&m.expect.items.length){y+=44;bcLabel(x,m.expect.label,P,y);y+=24;y=bcChips(x,m.expect.items.slice(0,10),y);
    if(m.expect.bar&&m.expect.bar.length){y+=24;let bx=P;x.save();bcRound(x,P,y,IW,12,6);x.clip();m.expect.bar.forEach(([cc,p])=>{x.fillStyle=cc.c;x.fillRect(bx,y,IW*p+1,12);bx+=IW*p});x.restore();y+=12}}
  // Your own words
  if(m.quote&&m.quote.text){y+=48;x.font='italic 500 33px '+BC.F;const lines=bcWrap(x,m.quote.text,IW-60,6),h=66+lines.length*46;
    x.font='800 132px Georgia,serif';x.fillStyle=bcA(.2);x.fillText('“',P,y+96);
    bcLabel(x,m.quote.label,P+64,y+26);x.font='italic 500 33px '+BC.F;x.fillStyle=BC.INK;lines.forEach((l,j)=>x.fillText(l,P+64,y+76+j*46));y+=h}
  // Footer: centred mark and line, the link beneath.
  y+=70;const fr=x.createLinearGradient(P,0,W-P,0);fr.addColorStop(0,bcA(0));fr.addColorStop(.5,bcA(.45));fr.addColorStop(1,bcA(0));x.fillStyle=fr;x.fillRect(P,y,IW,1.5);
  y+=64;x.font='700 26px '+BC.F;const ft=m.footer||'Brewed with The Brew Bench',fw=x.measureText(ft).width;bcBean(x,W/2-fw/2-22,y-9,28,BC.HONEY);
  x.fillStyle=BC.INK;x.textAlign='left';x.fillText(ft,W/2-fw/2+6,y);
  y+=40;x.textAlign='center';x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(SITE_URL.replace(/^https?:\/\//,'').replace(/\/$/,''),W/2,y);x.textAlign='left';
  // Trim to what was drawn.
  const H=Math.round(y+70),out=document.createElement('canvas');out.width=W;out.height=H;out.getContext('2d').drawImage(c,0,0);
  return out}
const bcBlob=async m=>{if(document.fonts&&document.fonts.ready)await document.fonts.ready;const cv=bcDraw(m);return new Promise(res=>cv.toBlob(res,'image/jpeg',0.92))};

/* ---------- What each card shows ---------- */
const AGITW={low:'Gentle',med:'Steady',high:'Lively'};
// The brew on the dial-in now.
// Under the title: the name of the beans you're brewing, or what the coffee is when none is picked.
// The coffee as labelled tiles: the beans' name (when picked) next to the variety, process and roast.
const bcCoffee=(bean,v,p,ro)=>[...(bean?[['Beans',bean.name]]:[]),['Variety',v?vName(v):''],['Process',p&&PROCESSES[p]?PROCESSES[p].name:''],['Roast',ro?bcCap(ro):'']];
function brewCard(){const r=compute(S),[vt,vs]=verdict(r.D),B=BREWERS[S.brewer],dp=dialPlan(),water=dp?dp.water:+gfmt(S.dose*S.ratio);
  return bcBlob({theme:originTheme(S.bean&&S.bean.origin),title:dp?dp.r.name:'My '+brewName(B.name)+' brew',by:dp&&dp.r.by,coffee:bcCoffee(S.bean,S.variety,S.process,S.roast),
    pills:[...(dp?[[goalLabel(S.goal,S.amt)+' cup',1]]:[]),[B.name],...(S.age?[[S.age+' days off roast']]:[])],
    tiles:[['Coffee',gfmt(S.dose)+' g'],['Water',gfmt(water)+' g'],['Temp',S.temp+'°C'],['Ratio','1:'+rr1(S.ratio)]],
    grind:{g:S.grinder,c:S.setting,line:BREWERS[S.brewer].bloom.label+' '+S.bloom+' s  ·  '+AGITW[S.agit]+' pours'},cup:{r,vt,vs},steps:dp?dp.steps:[],expect:{label:'Expect',items:cupNotes(S,r).slice(0,8)}})}
// What Log this brew keeps, so the log's card can show the dial, the cup and the pours later.
function brewSnap(){const r=compute(S),dp=dialPlan();
  return{g:S.grinder,c:S.setting,b:S.brewer,t:S.temp,ra:S.ratio,bl:S.bloom,ag:S.agit,dose:S.dose,water:dp?dp.water:+gfmt(S.dose*S.ratio),v:S.variety,p:S.process,ro:S.roast,
    bean:S.bean?Object.assign({},S.bean):null,age:S.age,rec:dp?dp.r.name:'',by:dp&&dp.r.by||'',goal:dp?goalLabel(S.goal,S.amt):'',steps:dp?dp.steps.slice(0,14):[],
    r:{D:+r.D.toFixed(3),sweet:+r.sweet.toFixed(2),acid:+r.acid.toFixed(2),body:+r.body.toFixed(2),clarity:+r.clarity.toFixed(2),bitter:+r.bitter.toFixed(2)}}}
// A snapshot can come from another phone in a shared log, so every field is checked before it is drawn.
function okSnap(s){if(!s||typeof s!=='object')return null;const n=(v,a,b)=>typeof v==='number'&&isFinite(v)?clamp(v,a,b):null,r=s.r||{};
  const o={g:GRINDERS[s.g]?s.g:null,c:n(s.c,0,400),b:BREWERS[s.b]?s.b:null,t:n(s.t,0,100),ra:n(s.ra,0.5,30),bl:n(s.bl,0,600),ag:AGITW[s.ag]?s.ag:'med',dose:n(s.dose,1,200),water:n(s.water,1,3000),
    v:typeof s.v==='string'&&VBY[s.v.split(':')[0]]?s.v:null,p:PROCESSES[s.p]?s.p:null,ro:['light','medium','dark'].includes(s.ro)?s.ro:null,bean:okSBean(s.bean),age:n(s.age,0,400),rec:str(s.rec,80),by:str(s.by,80),goal:str(s.goal,40),
    steps:(Array.isArray(s.steps)?s.steps:[]).filter(t=>typeof t==='string').map(t=>t.slice(0,160)).slice(0,14),
    r:['D','sweet','acid','body','clarity','bitter'].every(k=>typeof r[k]==='number'&&isFinite(r[k]))?{D:clamp(r.D,-5,5),sweet:clamp(r.sweet,0,10),acid:clamp(r.acid,0,10),body:clamp(r.body,0,10),clarity:clamp(r.clarity,0,10),bitter:clamp(r.bitter,0,10)}:null};
  return o.b?o:null}
// A brew from the log: what you rated and tasted, with the brew itself when it was logged from the dial-in.
function logCard(l){const s=okSnap(l.snap),fl=flOf(l).filter(([id])=>FW.byId[id]),B=s&&BREWERS[s.b],stars=clamp(Math.round(+l.stars||0),0,5);
  const m={theme:originTheme(s&&s.bean&&s.bean.origin),kicker:'From my brew log',date:fmtDate(l),title:l.coffee||(s&&s.rec)||'A brew',by:s&&s.rec&&l.coffee?s.rec+(s.by?' · '+s.by:''):s&&s.by,
    coffee:s&&s.v?bcCoffee(s.bean&&s.bean.name!==l.coffee?s.bean:null,s.v,s.p,s.ro):null,
    rating:stars?{kind:'stars',v:stars,word:['','Not for me','Okay','Good','Great','Outstanding'][stars]}:null,
    pills:[...(s&&s.goal?[[s.goal+' cup',1]]:[]),...(B?[[B.name]]:[]),...(l.by&&GROUP?[['Brewed by '+(l.by===ME?'me':l.by)]]:[])],
    footer:'Logged with The Brew Bench'};
  if(s){m.tiles=[['Coffee',s.dose!=null?gfmt(s.dose)+' g':'–'],['Water',s.water!=null?gfmt(s.water)+' g':'–'],['Temp',s.t!=null?s.t+'°C':'–'],['Ratio',s.ra!=null?'1:'+rr1(s.ra):'–']];
    if(s.g&&s.c!=null)m.grind={g:s.g,c:s.c,line:(B?B.bloom.label:'Bloom')+' '+(s.bl||0)+' s  ·  '+AGITW[s.ag]+' pours'};
    if(s.r){const [vt,vs]=verdict(s.r.D);m.cup={r:s.r,vt,vs}}m.steps=s.steps}
  else m.text=[{label:'Settings',body:l.settings},{label:'Predicted',body:l.pred}];
  if(fl.length)m.expect={label:'What I tasted',items:fl.map(([id,v])=>({t:FW.byId[id].n+(v>1?' '+'●'.repeat(v):''),c:FW.byId[id].c})),bar:flFamilies(fl)};
  if(l.notes)m.quote={label:'My notes',text:l.notes};
  return bcBlob(m)}
// A coffee from the gallery: the bag, your rating in beans, where it is from and what you tasted.
async function beanCardImg(b){const P=b.process&&PROCESSES[b.process],rk=beanRank(b),fmt=s=>s?new Date(s+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'–';
  const photo=b.img?await bcLoad(await BIMG.get(b.id)):null;
  return bcBlob({theme:originTheme(b.origin),kicker:'From my bean gallery',date:fmt(b.tried),photo,title:beanTitle(b),by:b.roaster,
    sub:[b.variety?vName(b.variety):'',P?P.name:'',b.roast?bcCap(b.roast)+' roast':''].filter(Boolean).join('  ·  '),
    rating:b.rating?{kind:'beans',v:b.rating,word:rateWord(b.rating)}:null,
    pills:rk?[[rk<=3?'#'+rk+' · '+MEDALN[rk]+' of '+beanYear(b):'#'+rk+' of '+beanYear(b),1]]:beanMention(b)?[['Honourable mention · '+beanYear(b),1]]:[],
    tiles:[['Origin',b.origin?originName(b.origin):'–'],['Roasted',fmt(b.roastDate)],['Tried',fmt(b.tried)]],
    expect:b.flavours?{label:'Tasting notes',items:b.flavours.split(/\s*[,;·]\s*/).filter(Boolean)}:null,
    quote:b.notes?{label:'My notes',text:b.notes}:null,footer:'From my bean gallery'})}

/* ---------- Sharing and saving the image ---------- */
// Share where the phone can (WhatsApp, Instagram, Photos). Otherwise, and for Save on a phone, the card opens full size,
// where press-and-hold saves it: phone browsers can refuse a script-started download (Chrome on Android reports it as
// "Download failed"), so the viewer is the dependable way to keep it.
async function shareCard(blob,name,title,save){const file=name+'.jpg';
  if(NATIVE){try{await nativeShare(title,file,blob);return}catch(e){if(/cancel/i.test(e&&e.message||''))return}}
  if(!save&&navigator.canShare){const f=new File([blob],file,{type:'image/jpeg'});try{if(navigator.canShare({files:[f]})){await navigator.share({files:[f],title});return}}catch(e){if(e&&e.name==='AbortError')return}}
  if(matchMedia('(pointer:coarse)').matches||!save){cardViewer(blob,file,title);return}
  saveFile(file,blob)}
function cardViewer(blob,file,title){const d=$('vd'),u=URL.createObjectURL(blob);
  $('vd-in').innerHTML='<div class="vd-head" style="--c:#C9964A"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:#C9964A"></i>Brew card</span><h2 id="vd-title">'+esc(title)+'</h2></div>'+
    '<div class="vd-body"><img class="cardview" src="'+u+'" alt="'+esc(title)+'"><p class="hint" style="text-align:center">Press and hold the image to save it to your phone, or download it.</p>'+
    '<div class="actions"><a class="btn" id="cv-dl" download="'+esc(file)+'">Download</a>'+(navigator.canShare?'<button type="button" class="btn ghost" id="cv-share">Share</button>':'')+'</div></div>';
  // A data link, not a blob one: it survives the hand-off to the phone's download manager.
  const rd=new FileReader();rd.onload=()=>{const a=$('cv-dl');if(a)a.href=rd.result};rd.readAsDataURL(blob);
  const sb=$('cv-share');if(sb)sb.onclick=async()=>{const f=new File([blob],file,{type:'image/jpeg'});try{if(navigator.canShare({files:[f]}))await navigator.share({files:[f],title});else toast('This browser can’t share images. Press and hold the image to save it')}catch(e){if(!e||e.name!=='AbortError')toast('Sharing was blocked. Press and hold the image to save it')}};
  d.addEventListener('close',()=>setTimeout(()=>URL.revokeObjectURL(u),60000),{once:true});showDlg(d);d.scrollTop=0;$('vd-x').onclick=()=>d.close()}
