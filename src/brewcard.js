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
    // A star, filled to the rating: half a star shows as its left half in honey.
    else{x.save();x.translate(cx,Y);x.beginPath();for(let k=0;k<10;k++){const r=k%2?s*0.22:s*0.5,a=-Math.PI/2+k*Math.PI/5;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();
      x.fillStyle=f===1?BC.HONEY:bcI(.16);x.fill();if(f===0.5){x.save();x.clip();x.fillStyle=BC.HONEY;x.fillRect(-s/2,-s/2,s/2,s);x.restore()}x.restore()}}}
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
// The cup from above, as the dial-in draws it: a saucer and handle, the rim, the coffee coloured by the extraction,
// faint guide rings, the traits as crema, and one dot per trait in its own colour.
function bcCup2(x,TR,r,cx,cy,R){const n=TR.length,ang=i=>-Math.PI/2+i*TAU/n,pt=(i,v,f)=>{const rr=(f||R*0.9)*(.12+.88*clamp(v,0,10)/10);return[cx+Math.cos(ang(i))*rr,cy+Math.sin(ang(i))*rr]};
  x.save();x.beginPath();x.arc(cx,cy,R*1.3,0,TAU);x.fillStyle=bcI(.06);x.fill();x.lineWidth=1.5;x.strokeStyle=bcI(.12);x.stroke();
  x.beginPath();x.arc(cx+R*1.16,cy-R*.18,R*.26,-Math.PI/2,Math.PI/2);x.lineWidth=R*.12;x.strokeStyle=bcI(.25);x.stroke();
  x.beginPath();x.arc(cx,cy,R*1.12,0,TAU);x.fillStyle=BC.LIGHT?'#FFFFFF':'#F3EADC';x.fill();
  x.beginPath();x.arc(cx,cy,R,0,TAU);x.fillStyle=liquid(r.D);x.fill();
  const ring=f=>{x.beginPath();TR.forEach((_,i)=>{const a=ang(i),q=[cx+Math.cos(a)*R*.9*f,cy+Math.sin(a)*R*.9*f];i?x.lineTo(...q):x.moveTo(...q)});x.closePath()};
  for(const f of [.5,1]){ring(f);x.strokeStyle='rgba(255,236,210,.16)';x.lineWidth=1.5;x.stroke()}
  x.beginPath();TR.forEach((t,i)=>{const q=pt(i,t[1]);i?x.lineTo(...q):x.moveTo(...q)});x.closePath();x.fillStyle='rgba(226,176,122,.62)';x.fill();x.strokeStyle='#F1CFA2';x.lineWidth=3;x.lineJoin='round';x.stroke();
  TR.forEach((t,i)=>{const q=pt(i,t[1]);x.beginPath();x.arc(q[0],q[1],9,0,TAU);x.fillStyle=t[2];x.fill();x.lineWidth=3;x.strokeStyle='#2A1A10';x.stroke()});
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
// The vibe's own option is named after your vibe ("Pure"), so it's clear it follows the app's look.
const cardCols=()=>[['origin','Origin'],...ACCENTS.map(([k,n])=>[k,k==='classic'?((VIBES.find(v=>v[0]===UI.vibe)||VIBES[0])[1]):n])];
// Colours by hue, saturation and lightness: a palette keeps one hue clean from the deepest tone to the brightest,
// instead of mixing towards black or cream (which turned every colour muddy brown or beige).
const hslOf=h=>{const [r,g,b]=rgbOf(h).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;if(!d)return[0,0,l];
  const s=d/(1-Math.abs(2*l-1));let hu=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return[(hu*60+360)%360,s,l]};
const hsl=(h,s,l)=>{h=((h%360)+360)%360;s=clamp(s,0,1);l=clamp(l,0,1);const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return hexOf([r,g,b].map(v=>(v+m)*255))};
// A palette from one colour. Dark: an inky, clearly tinted ground with a luminous accent of the same hue and a second
// accent a little round the colour wheel. Light: crisp tinted paper with a deep, saturated accent.
function palFrom(base,light){const [h,s0]=hslOf(base),s=clamp(s0,.3,.65);
  return light?{bg:[hsl(h,s*.7,.935),hsl(h,s*.6,.962),hsl(h,s*.5,.982)],glow:hsl(h,.7,.62),acc:hsl(h,.68,.34),acc2:hsl(h+30,.55,.42)}
    :{bg:[hsl(h,s*.62,.145),hsl(h,s*.55,.088),hsl(h,s*.5,.05)],glow:hsl(h,.72,.56),acc:hsl(h,.78,.73),acc2:hsl(h+30,.62,.64)}}
// "Vibe's own": the app's own look, light or dark as the card is: its paper and surfaces as the ground and its colours
// as the accents. A vibe whose main colour has no hue (Pure's black and white) takes its gold as the accent.
function vibePal(light){const v=VIBES.find(x=>x[0]===UI.vibe)||VIBES[0],P=v[light?3:4],grey=c=>hslOf(c)[1]<.12;
  const acc=grey(P.cherry)?P.honey:P.cherry,acc2=acc===P.honey?P.leaf:P.honey;
  return light?{bg:[mixHex(P.surface2,P.paper,.35),mixHex(P.surface2,P.paper,.7),P.paper],glow:acc,acc:acc,acc2}
    :{bg:[mixHex(P.surface2,P.paper,.35),mixHex(P.surface,P.paper,.6),mixHex(P.paper,'#000000',.45)],glow:acc,acc,acc2}}
// The card's theme in the chosen style. T is the origin's (or the house) theme; its pattern, stamp and names are kept.
function cardStyle(T,st){const light=st&&st.mode==='light',col=st&&st.col,acc=col!=='classic'&&ACCENTS.find(a=>a[0]===col);
  let pal=col==='classic'?vibePal(light):acc?palFrom(acc[2],light):{bg:T.bg.slice(),glow:T.glow,acc:T.acc,acc2:T.acc2};
  // The origin's own colours on paper: its deep tone tints the paper and its accents are deepened.
  if(!acc&&col!=='classic'&&light){const [oh,os]=hslOf(T.bg[0]),ss=clamp(os,.3,.6),bg=[hsl(oh,ss*.62,.935),hsl(oh,ss*.52,.962),hsl(oh,ss*.42,.982)];
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
// One full-height drawing surface, reused for every card: a fresh 1080 × 4400 canvas each time is a lot of memory on a phone.
let BC_CV=null;
function bcDraw(m){const W=BC.W,P=BC.PAD,IW=W-2*P;BC.BRK=[];if(!BC_CV){BC_CV=document.createElement('canvas');BC_CV.width=W;BC_CV.height=4400}
  // A card that needs more room (a large gallery) gets a taller canvas; every other card draws on the usual one.
  // Drawn at one and a half times the size (1620 px wide: sharp on any phone, and about what messaging apps keep), a
  // very tall gallery a little less to keep memory in hand;
  // everything is laid out in the card's own 1080-wide units and scaled once here.
  // A card that knows its height draws on a canvas just that tall (the background is most of the drawing work).
  const H0=m.minH?Math.ceil(m.minH):4400,S=BC.S=Math.min(1.5,Math.sqrt(26e6/(W*H0)));
  if(BC_CV.width!==Math.round(W*S)||BC_CV.height!==Math.round(H0*S)){BC_CV.width=Math.round(W*S);BC_CV.height=Math.round(H0*S)}
  const c=BC_CV,x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.clearRect(0,0,c.width,c.height);x.setTransform(S,0,0,S,0,0);x.imageSmoothingQuality='high';
  BC.F=getComputedStyle(document.body).fontFamily;
  // The origin's look (or the house espresso and honey): its accent colours are used throughout the card.
  const T=cardStyle(m.theme||OT.house,m.style||CARD_STYLE);
  bcBG(x,W,H0,T);
  x.textBaseline='alphabetic';x.textAlign='left';if(T.motif)bcBand(x,W,T);
  bcCheck(x,W,T,H0);
  return m.draw?m.draw(x,c,T):bcBody(x,c,m,T)}
// The background: the palette's deep tones, a soft glow, the origin's pattern (bold in the hero band, faint below), a faint
// bean watermark and a very fine grain. Text never sits on it directly where it is busy: see bcBody.
function bcBG(x,W,H,T){const c={height:H};
  const bg=x.createLinearGradient(0,0,0,c.height);bg.addColorStop(0,T.bg[0]);bg.addColorStop(0.45,T.bg[1]);bg.addColorStop(1,T.bg[2]);x.fillStyle=bg;x.fillRect(0,0,W,c.height);
  const gl=x.createRadialGradient(W*0.95,-60,10,W*0.95,-60,W*1.05);gl.addColorStop(0,hexA(T.glow,.30));gl.addColorStop(1,hexA(T.glow,0));x.fillStyle=gl;x.fillRect(0,0,W,1300);
  // On paper a pattern needs more ink to show as much as it does on a dark card.
  const MP=BC.LIGHT?1.7:1;
  if(T.motif&&MOTIF[T.motif]){x.save();MK=MP;MOTIF[T.motif](x,W,c.height,T);x.restore();
    // The hero band: the pattern bold across the top, fading into the card.
    // Drawn on its own layer and faded out at the bottom, so it melts into the card below with no edge.
    const HB=520,hb=document.createElement('canvas');hb.width=W;hb.height=HB;const hx=hb.getContext('2d');MK=5.5*MP;MOTIF[T.motif](hx,W,HB,T);MK=1;
    const fd=hx.createLinearGradient(0,0,0,HB),hf=BC.LIGHT?[.94,.9]:[.8,.72];fd.addColorStop(0,hexA(T.bg[0],hf[0]));fd.addColorStop(0.18,hexA(T.bg[0],hf[1]));fd.addColorStop(0.3,hexA(T.bg[0],.18));fd.addColorStop(0.62,hexA(T.bg[0],.55));fd.addColorStop(1,hexA(T.bg[0],.75));hx.fillStyle=fd;hx.fillRect(0,0,W,HB);
    const mk=hx.createLinearGradient(0,0,0,HB);mk.addColorStop(0,'#000');mk.addColorStop(0.62,'#000');mk.addColorStop(1,'rgba(0,0,0,0)');hx.globalCompositeOperation='destination-in';hx.fillStyle=mk;hx.fillRect(0,0,W,HB);
    x.drawImage(hb,0,0)}
  const gl2=x.createRadialGradient(-120,1100,10,-120,1100,760);gl2.addColorStop(0,hexA(T.acc2,BC.LIGHT?.08:.16));gl2.addColorStop(1,hexA(T.acc2,0));x.fillStyle=gl2;x.fillRect(0,0,W,2000);
  if(!T.motif){x.save();x.globalAlpha=0.05;bcBean(x,W-150,250,420,BC.HONEY,T.bg[0]);x.restore()}
  // The grain: one 7 × 14 tile of dots, repeated, rather than a hundred thousand single-pixel squares.
  {const g=document.createElement('canvas');g.width=7;g.height=14;const gc=g.getContext('2d');gc.fillStyle=BC.LIGHT?'rgba(60,36,20,.03)':'rgba(255,255,255,.022)';gc.fillRect(0,0,1,1);gc.fillRect(3.5,7,1,1);
   x.fillStyle=x.createPattern(g,'repeat');x.fillRect(0,0,W,c.height)}
  // A soft shade on the left of the hero band, where the title and credit sit.
  // An oval with soft edges all round, so it leaves no line where it ends.
  if(T.motif){x.save();x.translate(W*0.12,300);x.scale(1,0.3);const sc=x.createRadialGradient(0,0,0,0,0,W*0.85);sc.addColorStop(0,hexA(T.bg[0],.66));sc.addColorStop(0.55,hexA(T.bg[0],.4));sc.addColorStop(1,hexA(T.bg[0],0));x.fillStyle=sc;x.fillRect(-W,-W*1.2,W*3,W*2.4);x.restore()}}
// The card checks itself: the accent is measured against the background actually drawn under the header, the title and
// the body (glow and pattern included), and stepped further from it if any of them falls short.
// It reads a small copy of the card (a quarter of the size) rather than the card itself: reading pixels back from a
// full-size canvas is slow on phones, and the background it measures is smooth enough to survive the shrink.
// The background is painted again, small, for this: copying the full-size card down to read it was most of a card's
// drawing time on a phone.
function bcCheck(x,W,T,Hbg){const P=BC.PAD,K=6,H0=2400,sm=document.createElement('canvas');sm.width=Math.ceil(W/K);sm.height=Math.ceil(H0/K);
  const sx=sm.getContext('2d',{willReadFrequently:true});sx.scale(1/K,1/K);bcBG(sx,W,Hbg,T);if(T.motif)bcBand(sx,W,T);const all=sx.getImageData(0,0,sm.width,sm.height).data;
  const worst=(y0,y1,x0,x1)=>{const L=[];for(let yy=Math.floor(y0/K);yy<Math.ceil(y1/K);yy++)for(let xx=Math.floor(x0/K);xx<Math.ceil(x1/K);xx++){const i=(yy*sm.width+xx)*4,h=hexOf([all[i],all[i+1],all[i+2]]);L.push([relLum(h),h])}
    if(!L.length)return null;L.sort((a,b)=>a[0]-b[0]);return L[Math.floor(L.length*(BC.LIGHT?0.03:0.97))][1]};
  const zs=[worst(70,112,P,W-P),worst(150,330,P,W-300),worst(330,470,P,W-P),worst(900,Math.min(2400,Hbg),P,W-P)].filter(Boolean);
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
  // Below the title the next lines are short (a rating, a line of pills), so they only need to clear the stamp's foot.
  if(stamp)y=Math.max(y,372);
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
  // A figure that isn't known isn't shown: a bar of dashes reads as broken.
  if(m.tiles)m.tiles=m.tiles.filter(([,v])=>v&&v!=='–');
  const specRows=[m.coffee,m.tiles].filter(r=>r&&r.length);
  if(specRows.length){const rows=specRows.map((r,ri)=>{const n=r.length,cw=IW/n,big=r===m.tiles;let fs=big?(n>3?50:58):(n>3?28:32);x.font='700 '+fs+'px '+BC.F;
      // The figures are one line each: as large as the widest one allows.
      if(big){const fit=()=>{x.font='800 '+fs+'px '+BC.F;return r.every(([,v])=>x.measureText(v||'–').width<=cw-52)};while(!fit()&&fs>30)fs-=2}
      
      if(!big)x.font='700 '+fs+'px '+BC.F;const cells=r.map(([k,v])=>[k,bcWrap(x,v||'–',cw-44,2)]),lines=Math.max(...cells.map(cc=>cc[1].length));return{n,cw,fs,cells,big,h:big?(lines>1?190:150):(lines>1?150:118)}});
    const H=rows.reduce((a,r)=>a+r.h,0);bcPane(x,P,y,IW,H,28);let ry=y;
    rows.forEach((r,ri)=>{if(ri){x.fillStyle=bcI(.10);x.fillRect(P+24,ry,IW-48,1.5)}
      r.cells.forEach(([k,ls],i)=>{const X=P+i*r.cw;if(i){x.fillStyle=bcI(.09);x.fillRect(X,ry+22,1.5,r.h-44)}
        // The numbers sit centred in their column, the figure large in the accent; the coffee's row reads left to right.
        if(r.big){x.textAlign='center';bcLabel(x,k,X+r.cw/2,ry+46,BC.MUTED);x.font='800 '+r.fs+'px '+BC.F;x.fillStyle=BC.HONEY;ls.forEach((l,j)=>x.fillText(l,X+r.cw/2,ry+112+j*(r.fs+8)));x.textAlign='left'}
        else{bcLabel(x,k,X+24,ry+44,BC.HONEY);x.font='700 '+r.fs+'px '+BC.F;x.fillStyle=BC.INK;ls.forEach((l,j)=>x.fillText(l,X+24,ry+90+j*(r.fs+8)))}});ry+=r.h});
    y+=H+20}
  // Grind, with the dial drawn at the setting
  if(m.grind&&GRINDERS[m.grind.g]){const G=GRINDERS[m.grind.g],h=280,st=m.grind.c;bcPane(x,P,y,IW,h,28);bcDial(x,m.grind.g,st,P+146,y+h/2,108);const X=P+292;
    bcLabel(x,'Grind',X,y+64);x.font='800 88px '+BC.F;x.fillStyle=BC.INK;const dv=dial(m.grind.g,st);x.fillText(dv,X,y+154);
    const sw=x.measureText(dv).width;x.font='500 28px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(G.fmt==='rot'?Math.round(st)+' clicks':G.unit==='clicks'?'clicks':'',X+sw+16,y+154);
    x.font='600 30px '+BC.F;x.fillStyle=BC.INK;x.fillText(bcWrap(x,G.name,W-P-X-30,1)[0],X,y+200);
    if(m.grind.line){x.font='500 25px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,m.grind.line,W-P-X-30,1)[0],X,y+240)}y+=h+20}
  // The predicted cup, as the dial-in shows it: the cup from above with its traits as crema and coloured dots, the
  // verdict and the extraction scale beside it, then each trait as a coloured bar with its score.
  if(m.cup){const r=m.cup.r,TR=[['Sweetness',r.sweet,'#D9894A'],['Acidity',r.acid,'#D4A72C'],['Body',r.body,'#B07A56'],['Clarity',r.clarity,'#4E9C97'],['Bitterness',r.bitter,'#B5533C']];
    const top=400,rowH=58,h=top+TR.length*rowH+34,X=P+372,w=W-P-X-36;bcPane(x,P,y,IW,h,28);bcCup2(x,TR,r,P+184,y+top/2+4,118);
    bcLabel(x,'Predicted cup',X,y+64);x.font='800 42px '+BC.F;x.fillStyle=BC.INK;let yy=y+118;for(const l of bcWrap(x,m.cup.vt,w,2)){x.fillText(l,X,yy);yy+=50}
    x.font='500 25px '+BC.F;x.fillStyle=BC.MUTED;for(const l of bcWrap(x,m.cup.vs,w,4)){x.fillText(l,X,yy);yy+=35}
    const gy=y+top-74,gw=w;const gg=x.createLinearGradient(X,0,X+gw,0);gg.addColorStop(0,'#D9B35A');gg.addColorStop(.25,'#C98A3E');gg.addColorStop(.5,'#7A4524');gg.addColorStop(.75,'#4A2A18');gg.addColorStop(1,'#1E120B');
    bcRound(x,X,gy,gw,12,6);x.fillStyle=gg;x.fill();x.strokeStyle=bcI(.14);x.lineWidth=1;x.stroke();
    const mx=X+(clamp(r.D,-2.5,2.5)+2.5)/5*gw;bcRound(x,mx-4,gy-11,8,34,4);x.fillStyle=BC.INK;x.fill();
    x.font='500 19px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='left';x.fillText('Under',X,gy+48);x.textAlign='center';x.fillText('Sweet spot',X+gw/2,gy+48);x.textAlign='right';x.fillText('Over',X+gw,gy+48);x.textAlign='left';
    // The traits
    x.fillStyle=bcI(.09);x.fillRect(P+28,y+top,IW-56,1.5);
    const bx=P+290,bw=W-P-120-bx;TR.forEach(([n,v,c],i)=>{const ry=y+top+30+i*rowH;
      x.beginPath();x.arc(P+44,ry,9,0,TAU);x.fillStyle=c;x.fill();
      x.font='500 28px '+BC.F;x.fillStyle=BC.INK;x.textBaseline='middle';x.fillText(n,P+68,ry+1);
      bcRound(x,bx,ry-7,bw,14,7);x.fillStyle=bcI(.12);x.fill();bcRound(x,bx,ry-7,Math.max(14,bw*clamp(v,0,10)/10),14,7);x.fillStyle=c;x.fill();
      x.font='800 30px '+BC.F;x.textAlign='right';x.fillStyle=BC.INK;x.fillText(v.toFixed(1),W-P-28,ry+1);x.textAlign='left';x.textBaseline='alphabetic'});
    y+=h+20}
  // Text blocks (settings written as text, for log entries from before brews were kept in full)
  for(const tb of m.text||[]){if(!tb.body)continue;x.font='500 29px '+BC.F;const lines=bcWrap(x,tb.body,IW-56,6),h=86+lines.length*40;bcPane(x,P,y,IW,h,28);
    bcLabel(x,tb.label,P+28,y+48);x.font='500 29px '+BC.F;x.fillStyle=BC.INK;lines.forEach((l,j)=>x.fillText(l,P+28,y+94+j*40));y+=h+20}
  // Every pour: the times in a honey column, a fine line linking the steps.
  const steps=m.steps||[];
  if(steps.length){y+=40;bcLabel(x,'The pours',P,y);
    // The same clock as the timer and the recipe page: a step with no time of its own gets its estimate (with ~), and
    // "Done by" is the brew's total, not the last time written in the steps.
    const ev=parseSteps(steps),tot=clockTotal(steps,ev);if(tot>0){x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='right';x.fillText('Done by '+mmss(tot),W-P,y);x.textAlign='left'}y+=22;
    const tx=P+108,tw=W-P-tx-10,show=steps.slice(0,10);x.font='500 30px '+BC.F;
    const rows=show.map((s,i)=>{const mm=/^(\d+:\d\d)\s*(.*)$/.exec(s),e=ev[i];return{t:mm?mm[1]:e&&e.e?'~'+mmss(e.t):'',d:bcCap(mm?mm[2]:s)}}).map(o=>({...o,lines:bcWrap(x,o.d,tw,2)}));
    const top=y+18;let yy=y;const ys=rows.map(o=>{const r0=yy;yy+=30+o.lines.length*40;return r0});
    x.fillStyle=bcA(.28);x.fillRect(P+86,top+22,1.5,Math.max(0,ys[ys.length-1]-y+4));
    rows.forEach((o,i)=>{const ry=ys[i];x.font=(o.t[0]==='~'?'700 22px ':'700 26px ')+BC.F;x.fillStyle=BC.HONEY;x.fillText(o.t||'·',P,ry+50);
      x.beginPath();x.arc(P+86.75,ry+41,7,0,TAU);x.fillStyle=BC.BG2;x.fill();x.lineWidth=2;x.strokeStyle=BC.HONEY;x.stroke();
      x.font='500 30px '+BC.F;x.fillStyle=BC.INK;o.lines.forEach((l,j)=>x.fillText(l,tx,ry+51+j*40))});
    y=yy+10;if(steps.length>show.length){x.font='500 23px '+BC.F;x.fillStyle=BC.MUTED;x.fillText('+ '+(steps.length-show.length)+' more in the app',tx,y+10);y+=36}}
  // Notes: expected or tasted, with the flavour families as one bar in the wheel's colours
  if(m.expect&&m.expect.items.length){y+=44;bcLabel(x,m.expect.label,P,y);y+=24;y=bcChips(x,m.expect.items.slice(0,10),y);
    if(m.expect.bar&&m.expect.bar.length){y+=24;let bx=P;x.save();bcRound(x,P,y,IW,12,6);x.clip();m.expect.bar.forEach(([cc,p])=>{x.fillStyle=cc.c;x.fillRect(bx,y,IW*p+1,12);bx+=IW*p});x.restore();y+=12}}
  // A list of brews: the name, the date and the stars, divided by fine lines.
  if(m.list&&m.list.items.length){y+=48;bcLabel(x,m.list.label,P,y);y+=22;const rh=96,h=m.list.items.length*rh;bcPane(x,P,y,IW,h,28);
    m.list.items.forEach((it,i)=>{const ry=y+i*rh;if(i){x.fillStyle=bcI(.09);x.fillRect(P+24,ry,IW-48,1.5)}
      const sw=it.s?5*24*1.18:0;x.font='700 32px '+BC.F;x.fillStyle=BC.INK;x.fillText(bcWrap(x,it.t,IW-80-sw-20,1)[0],P+28,ry+46);
      x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(it.d,P+28,ry+78);if(it.s)bcRating(x,'beans',it.s,W-P-28-sw,ry+rh/2,24)});y+=h}
  // Your own words
  if(m.quote&&m.quote.text){y+=48;x.font='italic 500 33px '+BC.F;const lines=bcWrap(x,m.quote.text,IW-100,6),h=66+lines.length*46;
    x.font='800 132px Georgia,serif';x.fillStyle=bcA(.2);x.fillText('“',P-6,y+96);const qx=P+Math.ceil(x.measureText('“').width)+6;
    bcLabel(x,m.quote.label,qx,y+26);x.font='italic 500 33px '+BC.F;x.fillStyle=BC.INK;lines.forEach((l,j)=>x.fillText(l,qx,y+76+j*46));y+=h}
  // Footer: centred mark and line, the link beneath.
  y+=70;const fr=x.createLinearGradient(P,0,W-P,0);fr.addColorStop(0,bcA(0));fr.addColorStop(.5,bcA(.45));fr.addColorStop(1,bcA(0));x.fillStyle=fr;x.fillRect(P,y,IW,1.5);
  y+=64;x.font='700 26px '+BC.F;const ft=m.footer||'Brewed with The Brew Bench',fw=x.measureText(ft).width;bcBean(x,W/2-fw/2-22,y-9,28,BC.HONEY);
  x.fillStyle=BC.INK;x.textAlign='left';x.fillText(ft,W/2-fw/2+6,y);
  y+=40;x.textAlign='center';x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(SITE_URL.replace(/^https?:\/\//,'').replace(/\/$/,''),W/2,y);x.textAlign='left';
  // Trim to what was drawn.
  const H=Math.round(y+70),out=document.createElement('canvas');out.width=Math.round(W*BC.S);out.height=Math.round(H*BC.S);out.getContext('2d').drawImage(c,0,0);
  return out}
// The look is taken when the card is asked for, not when it's drawn after the fonts load, so a card drawn ahead for
// another look (see the share sheet) keeps the one it was asked with.
const bcBlob=m=>{const st=m.style||Object.assign({},CARD_STYLE);return (async()=>{if(document.fonts&&document.fonts.ready)await document.fonts.ready;
  const cv=bcDraw(Object.assign({},m,{style:st})),brk=(BC.BRK||[]).map(y=>Math.round(y*BC.S));return new Promise(res=>cv.toBlob(b=>{if(b)b._brk=brk;res(b)},'image/jpeg',0.94))})()};
// Where a PDF page may end: between rows, never through one (in the card's own units).
const bcBrk=y=>{if(BC.BRK)BC.BRK.push(y)};

/* ---------- What each card shows ---------- */
const AGITW={low:'Gentle',med:'Steady',high:'Lively'};
// The brew on the dial-in now.
// Under the title: the name of the beans you're brewing, or what the coffee is when none is picked.
// The coffee as labelled tiles: the beans' name (when picked) next to the variety, process and roast.
// A recipe's credit, short: the person, not the titles after them ("Tetsu Kasuya, 2016 World Brewers Cup champion").
const bcBy=t=>t?String(t).split(',')[0].trim():t;
const bcShort=t=>String(t||'').replace(/\s*\([^)]*\)\s*$/,'');
const bcCoffee=(bean,v,p,ro)=>[...(bean?[['Beans',bean.name]]:[]),['Variety',v?bcShort(vName(v)):''],['Process',p&&PROCESSES[p]?bcShort(PROCESSES[p].name):''],['Roast',ro?bcCap(ro):'']];
function brewCard(){const r=compute(S),[vt,vs]=verdict(r.D),B=BREWERS[S.brewer],dp=dialPlan(),water=dp?dp.water:+gfmt(S.dose*S.ratio);
  return bcBlob({theme:originTheme(S.bean&&S.bean.origin),title:dp?dp.r.name:'My '+brewName(B.name)+' brew',by:dp&&bcBy(dp.r.by),coffee:bcCoffee(S.bean,S.variety,S.process,S.roast),
    pills:[...(dp?[[goalLabel(S.goal,S.amt)+' cup',1]]:[]),[B.name],...(S.age?[[S.age+' days off roast']]:[])],
    tiles:[['Coffee',gfmt(S.dose)+' g'],['Water',gfmt(water)+' g'],['Temp',S.temp+'°C'],['Ratio','1:'+rr1(S.ratio)]],
    grind:{g:S.grinder,c:S.setting,line:BREWERS[S.brewer].bloom.label+' '+S.bloom+' s  ·  '+AGITW[S.agit]+' pours'},cup:{r,vt,vs},steps:dp?dp.steps:[],expect:{label:'Expect',items:cupNotes(S,r).slice(0,8)}})}
// What Log this brew keeps, so the log's card can show the dial, the cup and the pours later.
function brewSnap(){const r=compute(S),dp=dialPlan();
  return{g:S.grinder,c:S.setting,b:S.brewer,t:S.temp,ra:S.ratio,bl:S.bloom,ag:S.agit,dose:S.dose,water:dp?dp.water:+gfmt(S.dose*S.ratio),v:S.variety,p:S.process,ro:S.roast,
    bean:S.bean?Object.assign({},S.bean):null,age:S.age,rec:dp?dp.r.name:'',by:dp&&bcBy(dp.r.by)||'',goal:dp?goalLabel(S.goal,S.amt):'',steps:dp?dp.steps.slice(0,14):[],
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
  const m={theme:originTheme(s&&s.bean&&s.bean.origin),kicker:'From my brew log',date:fmtDate(l),title:l.coffee||(s&&s.rec)||'A brew',by:s&&s.rec&&l.coffee?s.rec+(s.by?' · '+bcBy(s.by):''):s&&bcBy(s.by),
    coffee:s&&s.v?bcCoffee(s.bean&&s.bean.name!==l.coffee?s.bean:null,s.v,s.p,s.ro):null,
    rating:stars?{kind:'beans',v:stars,word:STARW[stars]}:null,
    pills:[...(s&&s.goal?[[s.goal+' cup',1]]:[]),...(B?[[B.name]]:[]),...(l.by&&GROUP?[['Brewed by '+(l.by===ME?'me':l.by)]]:[])],
    footer:'Logged with The Brew Bench'};
  if(s){m.tiles=[['Coffee',s.dose!=null?gfmt(s.dose)+' g':'–'],['Water',s.water!=null?gfmt(s.water)+' g':'–'],['Temp',s.t!=null?s.t+'°C':'–'],['Ratio',s.ra!=null?'1:'+rr1(s.ra):'–']];
    if(s.g&&s.c!=null)m.grind={g:s.g,c:s.c,line:(B?B.bloom.label:'Bloom')+' '+(s.bl||0)+' s  ·  '+AGITW[s.ag]+' pours'};
    if(s.r){const [vt,vs]=verdict(s.r.D);m.cup={r:s.r,vt,vs}}
    // Brews logged before the steps followed the brewing temperature: the recipe's own temperature is put right here.
    const rr=s.rec&&RECIPES.find(x=>x.name===s.rec);let st=s.steps;
    // Brews logged before a recipe's steps were corrected (Matt Winton's two pours in one step): the card is drawn from
    // the recipe as it is now, at the brew's own dose, water and bloom.
    if(rr&&rr.kind!=='46'&&s.dose&&s.water&&st.length&&st.length!==rr.steps.length){const sc=scaleSteps(rr,s.dose,s.water);st=s.bl&&BREWERS[rr.b]&&BREWERS[rr.b].bloom.label==='Bloom'?bloomShift(sc,s.bl).steps:sc}
    m.steps=stepsAtTemp(st,rr&&rr.temp,s.t)}
  else{// Logged by hand: the numbers are read back from the settings line, so the card has the same tiles as a dial-in brew.
    const q=parseSettings(l.settings||''),bean=l.beanId&&window.BEANS_OK?beanById(l.beanId):null;
    if(bean){m.theme=originTheme(bean.origin);if(bean.variety||bean.process||bean.roast)m.coffee=bcCoffee(beanTitle(bean)!==l.coffee?{name:beanTitle(bean)}:null,bean.variety,bean.process,bean.roast).filter(c=>c[1])}
    if(q.rec&&!m.by)m.by=q.rec.name===l.coffee?String(q.rec.by||'').split(',')[0]:q.rec.name+(q.rec.by?' · '+q.rec.by.split(',')[0]:'');
    // The recipe's pours, when the brew was made at the recipe's own dose.
    if(q.rec&&Array.isArray(q.rec.steps)&&(!q.dose||q.dose===q.rec.dose))m.steps=q.rec.steps;
    const QB=BREWERS[l.brewer]||q.brewer;if(QB&&!m.pills.some(p=>p[0]===QB.name))m.pills.push([QB.name]);if(q.grind)m.pills.push([q.grind]);
    if(q.dose||q.water||q.temp)m.tiles=[['Coffee',q.dose?gfmt(q.dose)+' g':'–'],['Water',q.water?gfmt(q.water)+' g':'–'],['Temp',q.temp?q.temp+'°C':'–'],['Ratio',q.ratio?'1:'+rr1(q.ratio):'–']];
    if(l.pred)m.sub='Expected: '+l.pred;
    if(!m.tiles&&l.settings)m.text=[{label:'Settings',body:l.settings}];
    else if(q.rest)m.text=[{label:'Also',body:q.rest}]}
  if(fl.length)m.expect={label:'What I tasted',items:fl.map(([id,v])=>({t:FW.byId[id].n+(v>1?' '+'●'.repeat(v):''),c:FW.byId[id].c})),bar:flFamilies(fl)};
  if(l.notes)m.quote={label:'My notes',text:l.notes};
  return bcBlob(m)}
// The settings line, read back: the recipe, the brewer, the grinder, dose : water, temperature and ratio. What isn't
// recognised is kept as text so nothing typed is lost.
function parseSettings(t){const o={};let rest=t;const take=re=>{const m=re.exec(rest);if(m)rest=rest.replace(m[0],' ');return m};
  const rec=[...RECIPES].sort((a,b)=>b.name.length-a.name.length).find(r=>r.name&&rest.toLowerCase().includes(r.name.toLowerCase()));
  if(rec){o.rec=rec;rest=rest.replace(new RegExp(rec.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),' ');take(/\s*\([^)]*\)/)}
  let m=take(/(\d+(?:[.,]\d+)?)\s*g\s*[:/]\s*(\d+(?:[.,]\d+)?)\s*g/i);if(m){o.dose=+m[1].replace(',','.');o.water=+m[2].replace(',','.')}
  m=take(/(\d{2,3}(?:[.,]\d)?)\s*°\s*C/i);if(m)o.temp=+m[1].replace(',','.');
  m=take(/\b1\s*:\s*(\d+(?:[.,]\d+)?)/);o.ratio=m?+m[1].replace(',','.'):o.dose&&o.water?o.water/o.dose:null;
  const G=Object.values(GRINDERS).sort((a,b)=>b.name.length-a.name.length).find(g=>rest.includes(g.name));
  if(G){m=take(new RegExp(G.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*(\\d+(?:[.,]\\d+)*(?:\\s*clicks)?)?'));o.grind=G.name+(m&&m[1]?' · '+m[1].trim():'')}
  const B=Object.values(BREWERS).sort((a,b)=>b.name.length-a.name.length).find(b=>rest.includes(b.name));if(B){o.brewer=B;rest=rest.replace(B.name,' ')}
  if(!o.brewer&&rec)o.brewer=BREWERS[rec.b];
  o.rest=rest.split(',').map(x=>x.trim()).filter(x=>x&&/[a-z]/i.test(x)).join(', ');return o}
// The whole log as one image: how many brews, the average, your palate and the latest cups.
// A recipe as a card, in the brew card's design: who it's from, the four numbers, the grind on your first grinder that
// can make it (as a dial), why it works, every pour and the tip.
function recipeCard(i){const r=RECIPES[i];if(!r)return Promise.resolve(null);const B=BREWERS[r.b],mt=rmeta(r);
  const g=MYG.find(h=>settingFor(h,r.b,r.off)!=null),c=g?settingFor(g,r.b,r.off):null,ra=r.dose?r.water/r.dose:null;
  const m={theme:OT.house,kicker:r.champ?'Champion’s recipe':r.custom?'My recipe':'Recipe',date:famName(r.b),title:r.name,by:r.by||(r.custom&&r.author?'By '+r.author:''),
    pills:[[mt.level,1],[B.type],...(mt.time!=null?[['Done in '+mmss(mt.time)]]:[])],
    tiles:[['Coffee',r.dose+' g'],['Water',r.water+' g'],['Temp',r.temp?r.temp+'°C':'–'],['Ratio',ra?'1:'+rr1(ra):'–']],
    grind:g&&c!=null?{g,c,line:B.bloom.label+' '+B.bloom.def+' s  ·  '+mt.pours+' pour'+(mt.pours===1?'':'s')}:null,
    text:r.why?[{label:'Why it works',body:r.why}]:[],steps:r.steps.slice(0,14),quote:r.tip?{label:'Tip',text:r.tip}:null,footer:'Shared from The Brew Bench'};
  if(r.temp2)m.pills.push(['Then '+r.temp2+'°C']);
  return bcBlob(m)}
// An origin as a card: its own colours and stamp, where and how its coffee grows, how it tastes, its story, the varieties
// grown there and a fact.
function originCard(k){const o=ALLO()[k];if(!o)return Promise.resolve(null);
  const m={theme:originTheme(k),kicker:'Coffee origin',date:REG[o.reg]?REG[o.reg].name:'',title:o.name,by:(o.subs||[]).slice(0,3).join(' · '),
    coffee:[['Altitude',o.alt],['Harvest',o.harvest],['Processing',o.process]].filter(([,v])=>v),
    text:[{label:'In the cup',body:o.cup},{label:'Story',body:o.hist}].filter(t=>t.body),
    expect:o.vars&&o.vars.length?{label:'Varieties grown here',items:o.vars.slice(0,10).map(v=>({t:VBY[v]?shortName(VBY[v].name):v,c:VBY[v]&&FAM[VBY[v].fam]?FAM[VBY[v].fam].color:BC.HONEY}))}:null,
    quote:o.fact?{label:'Did you know?',text:o.fact}:null,footer:'Shared from The Brew Bench'};
  return bcBlob(m)}
function logSumCard(){const L=LOG.filter(l=>l&&!(l.by&&l.by!==ME)),rated=L.filter(l=>+l.stars>0),avg=rated.length?rated.reduce((a,l)=>a+ +l.stars,0)/rated.length:0;
  const coffees=new Set(L.map(l=>(l.coffee||'').trim().toLowerCase()).filter(Boolean)),P=palate(),nick=window.PROFILE_OK&&PROFILE&&PROFILE.nick;
  const brewers=new Map();L.forEach(l=>{const s=okSnap(l.snap),b=s&&s.b||l.brewer||(parseSettings(l.settings||'').brewer||{}).name;const n=BREWERS[b]?BREWERS[b].name:b;if(n)brewers.set(n,(brewers.get(n)||0)+1)});
  const top=[...brewers].sort((a,b)=>b[1]-a[1])[0],best=[...rated].sort((a,b)=>b.stars-a.stars||(b.ts||0)-(a.ts||0))[0];
  return bcBlob({kicker:'My brew log',title:nick?nick+'’s brew log':'My brew log',sub:L.length+(L.length===1?' brew':' brews')+'  ·  '+coffees.size+(coffees.size===1?' coffee':' coffees'),
    rating:avg?{kind:'beans',v:Math.round(avg*2)/2,word:'average'}:null,
    pills:[...(best?[['Favourite: '+(best.coffee||'a brew'),1]]:[]),...(top?[['Most brewed on '+top[0]]]:[])],
    tiles:[['Brews',String(L.length)],['Coffees',String(coffees.size)],['Rated',String(rated.length)],['5 stars',String(rated.filter(l=>+l.stars===5).length)]],
    expect:P?{label:'My palate',items:P.fl.slice(0,8).map(([id,v])=>({t:FW.byId[id].n,c:FW.byId[id].c})),bar:flFamilies(P.fl)}:null,
    list:{label:'Latest cups',items:L.slice(0,6).map(l=>({t:l.coffee||'A brew',d:fmtDate(l),s:clamp(Math.round(+l.stars||0),0,5)}))},
    footer:'Logged with The Brew Bench'})}
// A coffee from the gallery: the bag, your rating in beans, where it is from and what you tasted.
async function beanCardImg(b){const style=Object.assign({},CARD_STYLE),P=b.process&&PROCESSES[b.process],rk=beanRank(b),fmt=s=>s?new Date(s+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'–';
  const photo=b.img?await bcLoad(await BIMG.get(b.id)):null;
  return bcBlob({style,theme:originTheme(b.origin),kicker:'From my bean gallery',date:fmt(beanDay(b)),photo,title:beanTitle(b),by:b.roaster,
    sub:[b.variety?vName(b.variety):'',P?P.name:'',b.roast?bcCap(b.roast)+' roast':''].filter(Boolean).join('  ·  '),
    rating:b.rating?{kind:'beans',v:b.rating,word:rateWord(b.rating)}:null,
    pills:rk?[[rk<=3?'#'+rk+' · '+MEDALN[rk]+' of '+beanYear(b):'#'+rk+' of '+beanYear(b),1]]:beanMention(b)?[['Honourable mention · '+beanYear(b),1]]:[],
    tiles:[['Origin',b.origin?originName(b.origin):'–'],['Roasted',fmt(b.roastDate)],['Tried',b.tried?fmt(b.tried):'Not yet']],
    expect:b.flavours?{label:'Tasting notes',items:b.flavours.split(/\s*[,;·]\s*/).filter(Boolean)}:null,
    quote:b.notes?{label:'My notes',text:b.notes}:null,footer:'From my bean gallery'})}

/* ---------- Designed cards: your Top 5 and your shelf ---------- */
// The same header, background and footer as every card; the body is laid out for the collection it shows.
function bcHead(x,kicker,date){const W=BC.W,P=BC.PAD;let y=100;bcBean(x,P+16,y-9,32,BC.HONEY);bcLabel(x,kicker,P+44,y);
  x.textAlign='right';x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(date,W-P,y);x.textAlign='left';
  y+=30;const rl=x.createLinearGradient(P,0,W-P,0);rl.addColorStop(0,bcA(.55));rl.addColorStop(1,bcA(0));x.fillStyle=rl;x.fillRect(P,y,W-2*P,1.5);return y}
function bcFoot(x,c,y,ft){const W=BC.W,P=BC.PAD;y+=70;const fr=x.createLinearGradient(P,0,W-P,0);fr.addColorStop(0,bcA(0));fr.addColorStop(.5,bcA(.45));fr.addColorStop(1,bcA(0));x.fillStyle=fr;x.fillRect(P,y,W-2*P,1.5);
  y+=64;x.font='700 26px '+BC.F;const fw=x.measureText(ft).width;bcBean(x,W/2-fw/2-22,y-9,28,BC.HONEY);x.fillStyle=BC.INK;x.textAlign='left';x.fillText(ft,W/2-fw/2+6,y);
  y+=40;x.textAlign='center';x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(SITE_URL.replace(/^https?:\/\//,'').replace(/\/$/,''),W/2,y);x.textAlign='left';
  const H=Math.round(y+70),out=document.createElement('canvas');out.width=Math.round(W*BC.S);out.height=Math.round(H*BC.S);out.getContext('2d').drawImage(c,0,0);return out}
// A coffee's picture in a rounded frame: its photo, cropped to fill, or (without one) a tile in its origin's colours
// with the bean mark, like the gallery's.
function bcPic(x,img,origin,X,Y,w,h,r,edge,ew){x.save();bcRound(x,X,Y,w,h,r);x.clip();
  if(img){const s=Math.max(w/img.width,h/img.height),dw=img.width*s,dh=img.height*s;x.drawImage(img,X+(w-dw)/2,Y+(h-dh)/2,dw,dh)}
  // No photo: a tile in the origin's colours (its light ones on a light card), the bean mark on it. Built with palFrom,
  // not cardStyle, which would also restyle the card being drawn.
  else{const t=originTheme(origin),L=BC.LIGHT,bg=L?palFrom(t.acc||'#8A5A3B',true).bg:t.bg,g=x.createLinearGradient(X,Y,X+w,Y+h);
    g.addColorStop(0,bg?bg[0]:(L?'#EFE3D3':'#5B3A26'));g.addColorStop(1,bg?bg[2]:(L?'#E4D3BE':'#2E1C12'));x.fillStyle=g;x.fillRect(X,Y,w,h);
    if(L){x.fillStyle='rgba(60,36,20,.05)';x.fillRect(X,Y,w,h)}
    bcBean(x,X+w/2,Y+h/2,Math.min(w,h)*0.42,L?'rgba(60,36,20,.16)':'rgba(255,248,238,.22)',L?'rgba(255,255,255,.35)':'rgba(0,0,0,.18)')}
  x.restore();if(edge){bcRound(x,X,Y,w,h,r);x.lineWidth=ew||3;x.strokeStyle=edge;x.stroke()}}
// Centred text on up to `max` lines; returns the y below it.
function bcCenter(x,t,cx,y,w,font,col,lh,max){x.font=font;x.fillStyle=col;x.textAlign='center';const L=bcWrap(x,t,w,max||2);L.forEach((l,i)=>x.fillText(l,cx,y+i*lh));x.textAlign='left';return y+(L.length-1)*lh}
// The crown over the winner.
function bcCrown(x,cx,cy,s,col){x.save();x.translate(cx-s/2,cy-s/2);x.scale(s/24,s/24);x.beginPath();x.moveTo(3,8);x.lineTo(7.5,12);x.lineTo(12,5);x.lineTo(16.5,12);x.lineTo(21,8);x.lineTo(19,19);x.lineTo(5,19);x.closePath();x.fillStyle=col;x.fill();x.restore()}
const BC_FRESH={rest:'#8FB3D6',peak:'#7CC48A',good:'#E2B866',fade:'#D08A6A'};

// Story-sized cards (1080 × 1920, the brew card's size): the footer sits at the bottom, the content above it.
const BC_STORY=1920,BC_FOOT=244;
// Chips on one line only: as many as fit, then "+N more".
function bcChipLine(x,items,y){const W=BC.W,P=BC.PAD;x.font='500 27px '+BC.F;let used=P,k=0;
  for(;k<items.length;k++){const w=x.measureText(items[k]).width+48,more=items.length-k-1,mw=more?x.measureText('+'+more+' more').width+48+12:0;if(used+w+mw>W-P)break;used+=w+12}
  const shown=items.slice(0,Math.max(1,k)),rest=items.length-shown.length;return bcChips(x,rest?[...shown,'+'+rest+' more']:shown,y)}
// A ring for what's left in a bag, the grams in the middle.
function bcLeftRing(x,cx,cy,R,pc,g){x.save();x.lineCap='round';x.lineWidth=Math.max(8,R*0.17);x.beginPath();x.arc(cx,cy,R,0,TAU);x.strokeStyle=bcI(.12);x.stroke();
  if(pc>0){x.beginPath();x.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+TAU*pc);x.strokeStyle=BC.HONEY;x.stroke()}
    // The grams with their unit beside them ("110 g"), centred in the ring.
  // The number and its unit share one baseline, set so the figures sit in the ring's middle.
  x.textBaseline='alphabetic';if(g){const nf='800 '+Math.round(R*0.48)+'px '+BC.F,uf='700 '+Math.round(R*0.3)+'px '+BC.F,by=cy+R*0.17;x.font=nf;const nw=x.measureText(String(g)).width;x.font=uf;const uw=x.measureText(' g').width,x0=cx-(nw+uw)/2;
    x.textAlign='left';x.font=nf;x.fillStyle=BC.INK;x.fillText(String(g),x0,by);x.font=uf;x.fillText(' g',x0+nw,by)}
  else{x.textAlign='center';x.font='800 '+Math.round(R*0.32)+'px '+BC.F;x.fillStyle=BC.INK;x.fillText('Empty',cx,cy+R*0.11)}
  x.restore()}

// Your Top 5 of a year, with room to breathe: the title, then a podium (the three medal coffees as framed photos on
// steps in their medal's colours, gold raised in the middle in a soft glow under a crown) with each one's name, roastery
// and rating set in a clean column beneath; 4th and 5th in rows; the honourable mentions on one line. The card is the
// brew card's height and the free space is shared out evenly between the sections.
async function top5CardImg(y){const style=Object.assign({},CARD_STYLE),it=t5Items(y),hm=t5Hm(y),nick=window.PROFILE_OK&&PROFILE&&PROFILE.nick,n=BEANS.filter(b=>beanYear(b)===y).length;
  const imgs=await Promise.all(it.map(async c=>c.b&&c.b.img?bcLoad(await BIMG.get(c.id)):null));
  return bcBlob({style,theme:originTheme(it[0]&&it[0].origin),minH:2100,draw:(x,c)=>{const W=BC.W,P=BC.PAD,IW=W-2*P,H=2100,end=H-BC_FOOT;
    const pod=[2,1,3].map(rk=>it.find(q=>q.rk===rk)).filter(Boolean),rest=it.filter(q=>q.rk>3),RH=128;
    const D={1:[280,350,110],2:[236,295,80],3:[236,295,56]},CG=26,LAB=196;
    let Y=bcHead(x,nick?nick+'’s favourites':'My favourite coffees',String(y));
    // "Top 5 of 2026": large but not shouting; the year in the accent, "of" quieter.
    let fs=104;const parts=()=>{x.font='800 '+fs+'px '+BC.F;const a=x.measureText('Top 5 ').width,c2=x.measureText(String(y)).width;x.font='500 '+Math.round(fs*0.48)+'px '+BC.F;return[a,x.measureText('of ').width,c2]};
    let pw=parts();while(pw[0]+pw[1]+pw[2]>IW&&fs>72){fs-=4;pw=parts()}
    Y+=Math.round(fs*1.18);x.font='800 '+fs+'px '+BC.F;x.fillStyle=BC.INK;x.fillText('Top 5',P-3,Y);x.font='500 '+Math.round(fs*0.48)+'px '+BC.F;x.fillStyle=BC.MUTED;x.fillText('of',P-3+pw[0],Y);
    x.font='800 '+fs+'px '+BC.F;x.fillStyle=BC.HONEY;x.fillText(String(y),P-3+pw[0]+pw[1],Y);
    Y+=56;x.font='500 28px '+BC.F;x.fillStyle=BC.MUTED;x.fillText([n?n+' coffee'+(n===1?'':'s')+' tasted this year':'',hm.length?hm.length+' honourable mention'+(hm.length===1?'':'s'):''].filter(Boolean).join('  ·  '),P,Y);
    // The sections' heights, and the space between them.
    const hPod=pod.length?70+D[1][1]+D[1][2]+LAB:0,hRest=rest.length*RH,hHm=hm.length?hmH(x,hm.slice(0,3)):0,secs=[hPod,hRest,hHm].filter(Boolean);
    const gap=Math.max(56,Math.min(210,(end-Y-secs.reduce((a,b)=>a+b,0))/(secs.length+1)));
    if(pod.length){Y+=gap;const order=pod.map(q=>q.rk),tw=order.reduce((a,r)=>a+D[r][0],0)+CG*(order.length-1),base=Y+70+D[1][1]+D[1][2];let X=(W-tw)/2;const colX={};order.forEach(r=>{colX[r]=X;X+=D[r][0]+CG});
      if(colX[1]!=null){const cx=colX[1]+D[1][0]/2,cy=Y+70+D[1][1]/2,gl=x.createRadialGradient(cx,cy,20,cx,cy,460);gl.addColorStop(0,hexA(MEDAL[1],.34));gl.addColorStop(1,hexA(MEDAL[1],0));x.fillStyle=gl;x.fillRect(cx-480,cy-480,960,960)}
      // A fine floor line under the steps.
      const fl=x.createLinearGradient(P,0,W-P,0);fl.addColorStop(0,bcA(0));fl.addColorStop(.5,bcA(.5));fl.addColorStop(1,bcA(0));x.fillStyle=fl;x.fillRect(P,base,IW,2);
      for(const q of pod){const [w,h,sh]=D[q.rk],X0=colX[q.rk],med=MEDAL[q.rk],stepTop=base-sh,py=stepTop-h-14,i=it.indexOf(q),cx=X0+w/2;
        const sg=x.createLinearGradient(0,stepTop,0,base);sg.addColorStop(0,hexA(med,.95));sg.addColorStop(1,hexA(med,.5));bcRound(x,X0,stepTop,w,sh,[12,12,0,0]);x.fillStyle=sg;x.fill();
        x.save();bcRound(x,X0,stepTop,w,sh,[12,12,0,0]);x.clip();x.fillStyle='rgba(255,255,255,.32)';x.fillRect(X0,stepTop,w,3);x.restore();
        x.font='800 '+(q.rk===1?62:48)+'px '+BC.F;x.fillStyle='rgba(36,22,14,.6)';x.textAlign='center';x.fillText(String(q.rk),cx,stepTop+sh/2+(q.rk===1?22:17));
        // The photo, a framed print a little above its step.
        x.save();x.shadowColor='rgba(0,0,0,.38)';x.shadowBlur=36;x.shadowOffsetY=16;bcRound(x,X0+10,py,w-20,h,22);x.fillStyle=BC.BG1;x.fill();x.restore();
        bcPic(x,imgs[i],q.origin,X0+10,py,w-20,h,22,med,q.rk===1?5:3);
        if(q.rk===1)bcCrown(x,cx,py-38,58,med);
        // Its label below the floor: name, roastery, rating.
        let ty=base+60;x.textAlign='center';x.font='800 '+(q.rk===1?32:27)+'px '+BC.F;x.fillStyle=BC.INK;const nl=bcWrap(x,q.name,w+(q.rk===1?10:0),2),lh=q.rk===1?38:33;nl.forEach((l,k)=>x.fillText(l,cx,ty+k*lh));ty+=(nl.length-1)*lh;
        if(q.roaster){ty+=36;x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,q.roaster,w,1)[0],cx,ty)}
        x.textAlign='left';if(q.rating){const sz=q.rk===1?24:21;bcRating(x,'beans',q.rating,cx-(5*sz*1.18)/2,ty+40,sz)}}
      Y+=hPod}
    if(rest.length){Y+=gap;bcPane(x,P,Y,IW,hRest,28);
      rest.forEach((q,k)=>{const ry=Y+k*RH,i=it.indexOf(q),med=MEDAL[q.rk],cy=ry+RH/2;if(k){x.fillStyle=bcI(.09);x.fillRect(P+28,ry,IW-56,1.5)}
        x.font='800 34px '+BC.F;x.fillStyle=hexA(med,.95);x.textAlign='center';x.fillText(String(q.rk),P+56,cy+12);x.textAlign='left';
        bcPic(x,imgs[i],q.origin,P+96,ry+22,RH-44,RH-44,18,hexA(med,.6),2);
        const sw=q.rating?5*22*1.18:0,tx=P+96+RH-44+26,tw2=W-P-28-sw-24-tx;x.font='700 30px '+BC.F;x.fillStyle=BC.INK;x.fillText(bcWrap(x,q.name,tw2,1)[0],tx,cy-5);
        x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,[q.roaster,q.origin?originName(q.origin):''].filter(Boolean).join('  ·  ')||MEDALN[q.rk]+' place',tw2,1)[0],tx,cy+29);
        if(q.rating)bcRating(x,'beans',q.rating,W-P-28-sw,cy,22)});
      Y+=hRest}
    if(hm.length){Y+=gap;bcLabel(x,'Honourable mentions',P,Y+22);bcChips(x,hm.slice(0,3),Y+48)}
    return bcFoot(x,c,end,'From my bean gallery')}})}

// Your shelf: every bag you're drinking as a row in one panel (photo, name, roastery and origin, a freshness tag, your
// rating, and a ring for what's left). The card is as long as your shelf: a row per bag, up to twelve.
async function shelfCardImg(){const style=Object.assign({},CARD_STYLE),sh=shelfOrder(),nick=window.PROFILE_OK&&PROFILE&&PROFILE.nick;
  const many=sh.length>12,shown=many?sh.slice(0,11):sh,more=sh.length-shown.length,imgs=await Promise.all(shown.map(async b=>b.img?bcLoad(await BIMG.get(b.id)):null));
  const ros=new Set(sh.map(b=>(b.roaster||'').toLowerCase()).filter(Boolean)).size,ors=new Set(sh.map(b=>b.origin).filter(Boolean)).size;
  const notes=[];sh.forEach(b=>(b.flavours||'').split(/\s*[,;·]\s*/).filter(Boolean).forEach(f=>{if(!notes.some(q=>q.toLowerCase()===f.toLowerCase()))notes.push(f)}));
  const rhS=shown.length<=3?200:176,minH=130+118+40+58+48+shown.length*rhS+(more?64:0)+(notes.length?146:0)+BC_FOOT+40;
  return bcBlob({style,theme:originTheme(sh[0]&&sh[0].origin),minH,draw:(x,c)=>{const W=BC.W,P=BC.PAD,IW=W-2*P,rh=rhS;
    let Y=bcHead(x,nick?'On '+nick+'’s shelf':'On my shelf',new Date().toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}));
    Y+=118;x.font='800 104px '+BC.F;x.fillStyle=BC.INK;x.fillText('Drinking',P-4,Y);const dw=x.measureText('Drinking ').width;x.fillStyle=BC.HONEY;x.fillText('now',P-4+dw,Y);
    Y+=40;bcStatPills(x,P,Y,[[sh.length,sh.length===1?'bag open':'bags open'],[ros,ros===1?'roastery':'roasteries'],[ors,ors===1?'origin':'origins']]);Y+=58+48;
    const ph=shown.length*rh+(more?64:0);bcPane(x,P,Y,IW,ph,30);
    shown.forEach((b,i)=>{const ry=Y+i*rh,cy=ry+rh/2,f=fresh(b),g=gramsLeft(b),s=rh-40,R=Math.min(56,(rh-56)/2);if(i){x.fillStyle=bcI(.09);x.fillRect(P+28,ry,IW-56,1.5)}
      bcPic(x,imgs[i],b.origin,P+22,ry+20,s,s,22);
      const tx=P+22+s+28,ring=g!=null&&b.bag>0,tw=W-P-28-(ring?R*2+28:0)-tx;
      x.font='800 32px '+BC.F;x.fillStyle=BC.INK;const nl=bcWrap(x,beanTitle(b),tw,1),meta=[b.roaster,b.origin?originName(b.origin):''].filter(Boolean).join('  ·  ');
      let ty=cy-34;x.fillText(nl[0],tx,ty);
      if(meta){x.font='500 23px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,meta,tw,1)[0],tx,ty+34)}
      const tag=f?'Day '+f.d+' · '+f.label:'No roast date',fc=f?BC_FRESH[f.k]:bcI(.4);x.font='700 21px '+BC.F;const tgw=x.measureText(tag).width+50,tgY=ty+52;
      bcRound(x,tx,tgY,tgw,38,19);x.fillStyle=hexA(fc,.16);x.fill();x.strokeStyle=hexA(fc,.55);x.lineWidth=1.5;x.stroke();x.beginPath();x.arc(tx+20,tgY+19,6,0,TAU);x.fillStyle=fc;x.fill();x.fillStyle=BC.INK;x.fillText(tag,tx+34,tgY+26);
      if(b.rating&&tgw+16+5*20*1.18<=tw)bcRating(x,'beans',b.rating,tx+tgw+16,tgY+19,20);
      if(ring)bcLeftRing(x,W-P-28-R,cy,R,clamp(g/b.bag,0,1),g);bcBrk(ry+rh)});
    if(more){const my=Y+shown.length*rh;x.fillStyle=bcI(.09);x.fillRect(P+28,my,IW-56,1.5);x.font='600 26px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='center';x.fillText('and '+more+' more bag'+(more===1?'':'s')+' on the shelf',W/2,my+42);x.textAlign='left'}
    Y+=ph;
    if(notes.length){Y+=64;bcLabel(x,'In my cups',P,Y);bcChipLine(x,notes,Y+26);Y+=26+56}
    return bcFoot(x,c,Y,'From my bean gallery')}})}
// How tall a set of chips will be once wrapped (the same measure bcChips uses).
function hmH(x,items){const W=BC.W,P=BC.PAD;x.font='500 27px '+BC.F;let px=P,rows=1;for(const t of items){const w=x.measureText(t).width+48;if(px+w>W-P){px=P;rows++}px+=w+12}return 48+56+(rows-1)*70}
// Counts as pills: the figure in the accent, the word after it.
function bcStatPills(x,X,Y,list){let px=X;list.forEach(([v,l])=>{x.font='800 30px '+BC.F;const vw=x.measureText(String(v)).width;x.font='500 26px '+BC.F;const lw=x.measureText(l).width,w=vw+lw+58;
  bcRound(x,px,Y,w,58,29);x.fillStyle=BC.CHIP;x.fill();x.strokeStyle=bcA(.38);x.lineWidth=1.5;x.stroke();
  x.font='800 30px '+BC.F;x.fillStyle=BC.HONEY;x.fillText(String(v),px+24,Y+40);x.font='500 26px '+BC.F;x.fillStyle=BC.INK;x.fillText(l,px+24+vw+10,Y+39);px+=w+12})}

// Your gallery: every coffee you've collected, by roastery (A to Z, newest first within each), hung like prints on a wall, each framed with a small
// name card beneath (name, roastery, rating) and a medal on the ones that made a year's top 5; then where they're from.
// The card grows with the collection and shows all of it: three across for a small one, then four, five and six.
async function galleryCardImg(){const style=Object.assign({},CARD_STYLE),nick=window.PROFILE_OK&&PROFILE&&PROFILE.nick;
  // Every coffee is shown: more to a row as the gallery grows, so even a large one stays a sensible length.
  const all=galleryOrder(),N=all.length,cols=N<=9?3:N<=40?4:N<=90?5:6,shown=all,more=0,K={3:0,4:1,5:2,6:3}[cols],pick=a=>a[K];
  const imgs=await Promise.all(shown.map(async b=>b.img?bcLoad(cols===3?(BIMG.peek(b.id)||await BIMG.get(b.id)):(BIMG.peekThumb(b.id)||await BIMG.thumb(b.id))):null));
  const gapG=pick([30,22,18,14]),cwG=(BC.W-2*BC.PAD-gapG*(cols-1))/cols,chG=cwG+pick([118,104,92,84]),minH=900+Math.ceil(N/cols)*(chG+gapG)+600;
  const ros=new Set(all.map(b=>(b.roaster||'').toLowerCase()).filter(Boolean)).size,orc=new Map();all.forEach(b=>{if(b.origin)orc.set(b.origin,(orc.get(b.origin)||0)+1)});
  const first=all.length?all.map(beanDay).sort()[0]:'',since=first?new Date(first+'T12:00').toLocaleDateString(undefined,{month:'short',year:'numeric'}):'';
  return bcBlob({style,theme:originTheme(all[0]&&all[0].origin),minH,draw:(x,c)=>{const W=BC.W,P=BC.PAD,IW=W-2*P;
    let Y=bcHead(x,nick?nick+'’s coffee journey':'My coffee journey',since?'Since '+since:'');
    Y+=118;x.font='800 100px '+BC.F;x.fillStyle=BC.INK;x.fillText('My',P-4,Y);const mw=x.measureText('My ').width;x.fillStyle=BC.HONEY;x.fillText('gallery',P-4+mw,Y);
    Y+=40;bcStatPills(x,P,Y,[[all.length,all.length===1?'coffee':'coffees'],[ros,ros===1?'roastery':'roasteries'],[orc.size,orc.size===1?'origin':'origins']]);Y+=58+56;
    // The wall: framed prints in a grid.
    // Whole pixels throughout, so every frame's edge is crisp, and the grid centred under the title.
    const gap=gapG,cw=Math.floor((IW-gap*(cols-1))/cols),gx=P+Math.floor((IW-(cw*cols+gap*(cols-1)))/2),mat=pick([14,10,8,7]),phH=cw-mat*2,lab=pick([118,104,92,84]),ch=mat+phH+lab;
    shown.forEach((b,i)=>{const col=i%cols,row=Math.floor(i/cols),X=gx+col*(cw+gap),yy=Math.round(Y+row*(ch+gap)),rk=beanRank(b);
      // The frame: a pane with a fine edge, the photo inset like a mounted print.
      // A soft shadow under each frame for a small wall; a large one keeps the fine edge only (blurring dozens of shadows is slow).
      if(cols<=4){x.save();x.shadowColor='rgba(0,0,0,.28)';x.shadowBlur=22;x.shadowOffsetY=10;bcRound(x,X,yy,cw,ch,20);x.fillStyle=BC.PANE;x.fill();x.restore()}bcPane(x,X,yy,cw,ch,20);
      bcPic(x,imgs[i],b.origin,X+mat,yy+mat,cw-mat*2,phH,14);
      if(rk){const r=pick([24,20,17,15]),bx=X+cw-mat-r-8,by=yy+mat+r+8,med=MEDAL[rk];x.beginPath();x.arc(bx,by,r,0,TAU);x.fillStyle=med;x.fill();x.lineWidth=3;x.strokeStyle='rgba(18,11,7,.6)';x.stroke();
        if(rk<=3)bcCrown(x,bx,by+1,r*1.05,'#24160E');else{x.font='800 '+Math.round(r*0.95)+'px '+BC.F;x.fillStyle='#24160E';x.textAlign='center';x.fillText(String(rk),bx,by+r*0.34);x.textAlign='left'}}
      // The name card.
      const tx=X+mat+4,tw=cw-mat*2-8;let ty=yy+mat+phH+pick([40,36,32,29]);x.font='800 '+pick([25,22,19,17])+'px '+BC.F;x.fillStyle=BC.INK;x.fillText(bcWrap(x,beanTitle(b),tw,1)[0],tx,ty);
      // The line under the name: roastery and origin when both fit, else the roastery alone (the gallery's order), never a lone "…".
      x.font='500 '+pick([20,18,16,15])+'px '+BC.F;x.fillStyle=BC.MUTED;const both=[b.roaster,b.origin?originName(b.origin):''].filter(Boolean).join(' · '),meta=x.measureText(both).width<=tw?both:(b.roaster||(b.origin?originName(b.origin):'')||'–');
      x.fillText(bcWrap(x,meta,tw,1)[0],tx,ty+pick([30,27,24,22]));
      if(b.rating){const sz=pick([18,15,13,12]);bcRating(x,'beans',b.rating,tx,ty+pick([62,56,50,46]),sz)}});
    for(let r=1;r<=Math.ceil(shown.length/cols);r++)bcBrk(Y+r*(ch+gap)-gap/2);
    Y+=Math.ceil(shown.length/cols)*(ch+gap)-gap;
    if(more){Y+=52;x.font='600 26px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='center';x.fillText('and '+more+' more coffee'+(more===1?'':'s')+' in the gallery',W/2,Y);x.textAlign='left'}
    if(orc.size){Y+=64;bcLabel(x,'Where they’re from',P,Y);Y=bcChips(x,[...orc].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>originName(k)+(v>1?'  ×'+v:'')),Y+26)}
    return bcFoot(x,c,Y,'From my bean gallery')}})}

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
// The brew log's cards read snapshots with okSnap above; the log drew before this file ran, so it draws again now.
window.CARD_OK=true;try{renderLogList()}catch(e){}

/* ---------- A share without a card of its own: its text, set in the cards' style ---------- */
// The same header, panes, labels and footer as every other card, so a PDF of a list or a guide looks like the rest.
// Laid out twice: once to measure (on a scratch canvas), then drawn on a canvas exactly that tall.
function docCardLay(x,doc,draw){const W=BC.W,P=BC.PAD,IW=W-2*P,F=BC.F;let Y=draw?bcHead(x,doc.kicker||'The Brew Bench',new Date().toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})):130;
  const T=(s,font,col,X,y)=>{if(draw){x.font=font;x.fillStyle=col;x.fillText(s,X,y)}};
  x.font='800 68px '+F;const tl=bcWrap(x,doc.title||'',IW,3);Y+=96;tl.forEach((l,i)=>{if(draw){x.font='800 68px '+F;x.fillStyle=BC.INK;x.letterSpacing='-1px';x.fillText(l,P,Y);x.letterSpacing='0px'}Y+=i<tl.length-1?78:0});
  if(doc.sub){x.font='600 30px '+F;bcWrap(x,doc.sub,IW,2).forEach(l=>{Y+=46;T(l,'600 30px '+F,BC.HONEY,P,Y)})}
  Y+=24;
  const linked=doc.link&&!doc.blocks.some(b=>b.p===doc.link)?[{h:'Open it in The Brew Bench',p:doc.link}]:[];
  for(const b of doc.blocks.concat(linked)){
    if(b.h){if(draw)bcBrk(Y+20);Y+=64;if(draw)bcLabel(x,b.h,P,Y);Y+=10}
    if(b.p){x.font='500 29px '+F;const L=bcWrap(x,b.p,IW-56,400),h=48+L.length*41;Y+=18;if(draw){bcPane(x,P,Y,IW,h,26);L.forEach((l,j)=>{T(l,'500 29px '+F,BC.INK,P+28,Y+56+j*41);bcBrk(Y+66+j*41)})}Y+=h}
    if(b.kv&&b.kv.length){Y+=18;const kw=Math.min(300,IW*0.34);x.font='600 29px '+F;const rows=b.kv.map(([k,v])=>({k,L:bcWrap(x,String(v),IW-kw-56,8)})),hs=rows.map(r=>34+r.L.length*40),h=hs.reduce((a,v)=>a+v,0)+16;
      if(draw){bcPane(x,P,Y,IW,h,26);let ry=Y+8;rows.forEach((r,i)=>{if(i){x.fillStyle=bcI(.09);x.fillRect(P+24,ry,IW-48,1.5)}
        x.font='700 21px '+F;x.fillStyle=BC.MUTED;x.letterSpacing='2px';x.fillText(bcWrap(x,String(r.k).toUpperCase(),kw-24,1)[0],P+28,ry+46);x.letterSpacing='0px';
        r.L.forEach((l,j)=>T(l,'600 29px '+F,BC.INK,P+kw+28,ry+48+j*40));ry+=hs[i];bcBrk(ry)})}Y+=h}
    if(b.list&&b.list.length){Y+=18;x.font='500 29px '+F;const lw=b.num?56:36,rows=b.list.map(t=>bcWrap(x,String(t),IW-56-lw,6)),hs=rows.map(L=>32+L.length*40),h=hs.reduce((a,v)=>a+v,0)+16;
      if(draw){bcPane(x,P,Y,IW,h,26);let ry=Y+8;rows.forEach((L,i)=>{if(i){x.fillStyle=bcI(.09);x.fillRect(P+24,ry,IW-48,1.5)}
        if(b.num)T(String(i+1),'800 28px '+F,BC.HONEY,P+28,ry+48);else{x.beginPath();x.arc(P+36,ry+38,6,0,TAU);x.fillStyle=BC.HONEY;x.fill()}
        L.forEach((l,j)=>T(l,'500 29px '+F,BC.INK,P+28+lw,ry+48+j*40));ry+=hs[i];bcBrk(ry)})}Y+=h}}
  return Y}
async function docCardImg(doc){const style=Object.assign({},CARD_STYLE);if(document.fonts&&document.fonts.ready)await document.fonts.ready;
  const sc=document.createElement('canvas').getContext('2d');BC.F=getComputedStyle(document.body).fontFamily;const H=docCardLay(sc,doc,false)+BC_FOOT+60;
  return bcBlob({style,theme:(doc.cardTheme&&doc.cardTheme())||null,minH:H,draw:(x,c)=>bcFoot(x,c,docCardLay(x,doc,true),'Made with The Brew Bench')})}

/* ---------- The PDF: the share's card on A4 pages ---------- */
// A long card is cut between rows, never through a line: just above each page's end, the calmest pixel row (the
// background between panes) is where the page breaks. Each page is filled with the card's colour behind the slice.
async function cardPDF(blob,title){const J=(window.jspdf||{}).jsPDF;if(!J||!blob)return null;
  const img=await new Promise((ok,no)=>{const u=URL.createObjectURL(blob),i=new Image();i.onload=()=>{URL.revokeObjectURL(u);ok(i)};i.onerror=e=>{URL.revokeObjectURL(u);no(e)};i.src=u});
  const iw=img.naturalWidth,ih=img.naturalHeight,full=document.createElement('canvas');full.width=iw;full.height=ih;const fx=full.getContext('2d',{willReadFrequently:true});fx.drawImage(img,0,0);
  const PW=595.28,PH=841.89,pageH=Math.floor(iw*PH/PW),pdf=new J({unit:'pt',format:'a4',compress:true});pdf.setProperties({title:title||'The Brew Bench',creator:'The Brew Bench'});
  const calm=(from,to)=>{const h=to-from;if(h<=0)return to;const d=fx.getImageData(0,from,iw,h).data;let best=to,bs=Infinity;
    for(let r=h-1;r>=0;r--){let s=0;const o=r*iw*4;for(let i=4*8;i<iw*4-32;i+=24){s+=Math.abs(d[o+i]-d[o+i-24])+Math.abs(d[o+i+1]-d[o+i-23])+Math.abs(d[o+i+2]-d[o+i-22])+0.5*(Math.abs(d[o+i]-d[o+32])+Math.abs(d[o+i+1]-d[o+33])+Math.abs(d[o+i+2]-d[o+34]))}
      const sc=s+(h-1-r)*0.6;if(sc<bs){bs=sc;best=from+r}}return best};
  const colAt=y=>{const d=fx.getImageData(3,Math.max(0,Math.min(ih-1,y)),1,1).data;return[d[0],d[1],d[2]]};
  // A card up to about one and a half pages tall goes on one page, scaled to fit and framed in its own colour; only a
  // long one (a big gallery, a long list) runs over several.
  if(ih<=pageH*1.5){const k=Math.min(PW/iw,PH/ih),w=iw*k,h=ih*k,bg=colAt(Math.round(ih/2));pdf.setFillColor(...bg);pdf.rect(0,0,PW,PH,'F');
    pdf.addImage(full.toDataURL('image/jpeg',0.88),'JPEG',(PW-w)/2,(PH-h)/2,w,h,undefined,'FAST');return pdf.output('blob')}
  // Pages after the first start a little down the page, so a pane carried over doesn't touch the top edge.
  const brk=(blob._brk||[]).filter(v=>v>0&&v<ih).sort((a,b)=>a-b),TOP=Math.round(iw*30/PW);
  let y=0,n=0;while(y<ih-2){const room=pageH-(n?TOP:0);let end=Math.min(ih,y+room);
    if(end<ih){const ok=brk.filter(v=>v>y+room*0.45&&v<=end);end=ok.length?ok[ok.length-1]:calm(Math.max(y+Math.floor(room*0.7),end-Math.floor(room*0.22)),end)}
    const sh=end-y,cv=document.createElement('canvas');cv.width=iw;cv.height=sh;cv.getContext('2d').drawImage(full,0,y,iw,sh,0,0,iw,sh);
    const bg=colAt(n?y+2:end-1);if(n)pdf.addPage();pdf.setFillColor(...bg);pdf.rect(0,0,PW,PH,'F');
    pdf.addImage(cv.toDataURL('image/jpeg',0.86),'JPEG',0,n?TOP*PW/iw:0,PW,sh*PW/iw,undefined,'FAST');n++;y=end}
  return pdf.output('blob')}

/* ---------- An advent calendar ---------- */
// The box: its photo, name and roastery, the total rating (the average of the coffees rated from it), how far along it
// is, every door (opened ones with their coffee's picture and rating), the best of the box and your review.
async function calCardImg(c){const style=Object.assign({},CARD_STYLE),s=calStats(c),sc=calScore(c,s),rk=calRanked(),pos=rk.findIndex(x=>x.c.id===c.id);
  const photo=c.img?await bcLoad(BIMG.peek(c.id)||await BIMG.get(c.id)):null,doors=Array.from({length:c.n},(_,i)=>s.doors.get(i+1)||null);
  const imgs=await Promise.all(doors.map(async b=>b&&b.img?bcLoad(BIMG.peekThumb(b.id)||await BIMG.thumb(b.id)):null));
  const W=BC.W,P=BC.PAD,IW=W-2*P,cols=c.n<=12?4:6,gap=c.n<=12?20:14,cw=Math.floor((IW-gap*(cols-1))/cols),rows=Math.ceil(c.n/cols),best=s.best,phH=photo?Math.round(IW*0.62):0;
  const orc=new Map();doors.forEach(b=>{if(b&&b.origin)orc.set(b.origin,(orc.get(b.origin)||0)+1)});const topO=[...orc].sort((a,b)=>b[1]-a[1])[0];
  const minH=130+(photo?36+phH:0)+104+84*2+60+100+58+56+70+rows*(cw+gap)+(best.length?90+best.length*124:0)+(c.notes?420:0)+(orc.size?200:0)+BC_FOOT+60;
  return bcBlob({style,theme:originTheme(topO&&topO[0]),minH,draw:(x,cv)=>{const F=BC.F;
    let Y=bcHead(x,'Advent calendar · '+c.year,c.roaster&&c.name?c.roaster:'');
    if(photo){Y+=36;x.save();bcRound(x,P,Y,IW,phH,30);x.clip();const k=Math.max(IW/photo.width,phH/photo.height),dw=photo.width*k,dh=photo.height*k;x.drawImage(photo,P+(IW-dw)/2,Y+(phH-dh)/2,dw,dh);
      const g=x.createLinearGradient(0,Y+phH*0.6,0,Y+phH);g.addColorStop(0,'rgba(14,8,5,0)');g.addColorStop(1,'rgba(14,8,5,.45)');x.fillStyle=g;x.fillRect(P,Y,IW,phH);x.restore();
      bcRound(x,P,Y,IW,phH,30);x.lineWidth=1.5;x.strokeStyle=bcA(.45);x.stroke();Y+=phH}
    Y+=104;x.font='800 76px '+F;x.fillStyle=BC.INK;x.letterSpacing='-1px';for(const l of bcWrap(x,calName(c),IW,2)){x.fillText(l,P,Y);Y+=84}x.letterSpacing='0px';
    // The total rating, large: the beans, the figure and what it is.
    if(sc.v){Y+=6;bcRating(x,'beans',Math.round(sc.v*2)/2,P,Y+24,46);const rx=P+5*46*1.18+14,rv=sc.v.toFixed(1);x.font='800 40px '+F;x.fillStyle=BC.INK;x.fillText(rv,rx,Y+38);
      const vw=x.measureText(rv).width;x.font='500 26px '+F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,'average of '+sc.n+' rated',W-P-rx-vw-18,1)[0],rx+vw+18,Y+37);Y+=80}
    else{x.font='500 28px '+F;x.fillStyle=BC.MUTED;x.fillText('Not rated yet',P,Y+20);Y+=56}
    bcStatPills(x,P,Y,[[s.open+'/'+c.n,'doors opened'],...(s.origins?[[s.origins,s.origins===1?'origin':'origins']]:[]),...(rk.length>1&&pos>=0?[['#'+(pos+1),'of '+rk.length+' calendars']]:[])]);Y+=58+64;
    // The doors: a grid like the box itself.
    bcLabel(x,'The doors',P,Y);Y+=28;
    doors.forEach((b,i)=>{const X=P+(i%cols)*(cw+gap),yy=Y+Math.floor(i/cols)*(cw+gap),n=String(i+1);
      if(b){bcPic(x,imgs[i],b.origin,X,yy,cw,cw,18);const r=cols>4?19:23;x.beginPath();x.arc(X+r+8,yy+r+8,r,0,TAU);x.fillStyle='rgba(18,11,7,.72)';x.fill();
        x.font='800 '+(cols>4?20:24)+'px '+F;x.fillStyle='#FFF8EE';x.textAlign='center';x.fillText(n,X+r+8,yy+r+8+(cols>4?7:8));x.textAlign='left';
        if(b.rating){const t=String(b.rating).replace('.5','½');x.font='800 '+(cols>4?19:22)+'px '+F;const tw=x.measureText(t).width+22,th=cols>4?30:34;
          bcRound(x,X+cw-tw-8,yy+cw-th-8,tw,th,th/2);x.fillStyle='rgba(18,11,7,.72)';x.fill();x.fillStyle='#FFF8EE';x.fillText(t,X+cw-tw+3,yy+cw-8-th*0.3)}}
      else{bcRound(x,X,yy,cw,cw,18);x.fillStyle=BC.CHIP;x.fill();x.lineWidth=1.5;x.strokeStyle=bcI(.16);x.stroke();
        x.font='800 '+(cols>4?40:52)+'px '+F;x.fillStyle=bcI(.55);x.textAlign='center';x.fillText(n,X+cw/2,yy+cw/2+(cols>4?14:18));x.textAlign='left'}});
    for(let r=0;r<=rows;r++)bcBrk(Y+r*(cw+gap)-gap/2);
    Y+=rows*(cw+gap)-gap;
    // The best of the box, like a podium list.
    if(best.length){Y+=72;bcLabel(x,'Best of the box',P,Y);Y+=22;const rh=124,h=best.length*rh;bcPane(x,P,Y,IW,h,28);
      best.forEach((b,i)=>{const ry=Y+i*rh,sw=5*24*1.18;if(i){x.fillStyle=bcI(.09);x.fillRect(P+24,ry,IW-48,1.5)}
        x.beginPath();x.arc(P+52,ry+rh/2,24,0,TAU);x.fillStyle=MEDAL[i+1]||BC.HONEY;x.fill();x.font='800 24px '+F;x.fillStyle='#24160E';x.textAlign='center';x.fillText(String(i+1),P+52,ry+rh/2+8);x.textAlign='left';
        const tx=P+96,tw=IW-96-sw-40;x.font='800 32px '+F;x.fillStyle=BC.INK;x.fillText(bcWrap(x,beanTitle(b),tw,1)[0],tx,ry+54);
        x.font='500 23px '+F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,['Door '+b.cal.d,b.origin?originName(b.origin):'',b.roaster&&b.roaster!==c.roaster?b.roaster:''].filter(Boolean).join('  ·  '),tw,1)[0],tx,ry+88);
        bcRating(x,'beans',b.rating,W-P-28-sw,ry+rh/2,24);bcBrk(ry+rh)});Y+=h}
    if(orc.size){bcBrk(Y+30)}if(c.notes){bcBrk(Y+(orc.size?150:30))}
    if(orc.size){Y+=64;bcLabel(x,'Where they’re from',P,Y);Y=bcChips(x,[...orc].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>originName(k)+(v>1?'  ×'+v:'')),Y+26)}
    if(c.notes){Y+=56;x.font='italic 500 33px '+F;const lines=bcWrap(x,c.notes,IW-100,6);x.font='800 132px Georgia,serif';x.fillStyle=bcA(.2);x.fillText('“',P-6,Y+96);const qx=P+Math.ceil(x.measureText('“').width)+6;
      bcLabel(x,'My review',qx,Y+26);x.font='italic 500 33px '+F;x.fillStyle=BC.INK;lines.forEach((l,j)=>x.fillText(l,qx,Y+76+j*46));Y+=66+lines.length*46}
    return bcFoot(x,cv,Y,'From my advent calendar')}})}
