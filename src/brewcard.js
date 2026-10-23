/* ================= BREW CARDS ================= */
// A brew, a logged brew or a gallery coffee as one designed image to share. Drawn on a canvas in the app's espresso and
// honey colours, 1080 px wide (a phone story) and as tall as the content needs. One renderer draws every kind of card
// from a plain description (a "model"): the dial-in, the log and the gallery each build their own.
const BC={W:1080,PAD:72,BG1:'#2E1C12',BG2:'#120B07',CREAM:'#FFF6E8',MUTED:'rgba(255,246,232,.62)',FAINT:'rgba(255,246,232,.10)',LINE:'rgba(255,246,232,.16)',HONEY:'#E2B866',CARAMEL:'#C9964A',ROAST:'#A8432F'};
function bcRound(x,X,Y,w,h,r){x.beginPath();x.roundRect(X,Y,w,h,r)}
// Lines of text that fit a width, at most `max` lines (the last one ends with an ellipsis if cut).
function bcWrap(x,t,w,max){const words=String(t).split(/\s+/).filter(Boolean);const out=[];let cur='';
  for(const wd of words){const tryL=cur?cur+' '+wd:wd;if(x.measureText(tryL).width<=w)cur=tryL;else{if(cur)out.push(cur);cur=wd}if(out.length===max)break}
  if(out.length<max&&cur)out.push(cur);
  if(out.length===max&&words.join(' ')!==out.join(' ')){let l=out[max-1];while(l&&x.measureText(l+'…').width>w)l=l.slice(0,-1);out[max-1]=l.replace(/\s+$/,'')+'…'}
  return out}
// A panel: a soft gradient pane with a fine edge.
function bcPane(x,X,Y,w,h,r){bcRound(x,X,Y,w,h,r||28);const g=x.createLinearGradient(0,Y,0,Y+h);g.addColorStop(0,'rgba(255,246,232,.085)');g.addColorStop(1,'rgba(255,246,232,.035)');x.fillStyle=g;x.fill();x.lineWidth=1.5;x.strokeStyle='rgba(255,246,232,.13)';x.stroke()}
function bcLabel(x,t,X,Y,col){x.font='700 22px '+BC.F;x.fillStyle=col||BC.HONEY;x.letterSpacing='3px';x.fillText(t.toUpperCase(),X,Y);x.letterSpacing='0px'}
const bcCap=t=>t?t.charAt(0).toUpperCase()+t.slice(1):t;
// The app's bean mark.
function bcBean(x,cx,cy,s,col,crease){x.save();x.translate(cx,cy);x.rotate(-38*Math.PI/180);x.beginPath();x.ellipse(0,0,s*0.36,s*0.5,0,0,TAU);x.fillStyle=col;x.fill();
  x.beginPath();x.moveTo(s*0.02,-s*0.5);x.bezierCurveTo(-s*0.16,-s*0.2,s*0.16,0,s*0.0,s*0.18);x.bezierCurveTo(-s*0.1,s*0.32,s*0.06,s*0.42,s*0.02,s*0.5);x.lineWidth=s*0.07;x.strokeStyle=crease||BC.BG1;x.stroke();x.restore()}
// A rating as stars (the log) or coffee beans (the gallery), halves allowed for beans.
function bcRating(x,kind,v,X,Y,s){for(let i=1;i<=5;i++){const cx=X+(i-1)*s*1.18+s/2,f=v>=i?1:v>=i-0.5?0.5:0;
    if(kind==='beans'){bcBean(x,cx,Y,s,'rgba(255,246,232,.16)','rgba(255,246,232,.22)');if(f){x.save();x.beginPath();x.rect(cx-s/2,Y-s/2,s*f,s);x.clip();bcBean(x,cx,Y,s,BC.HONEY);x.restore()}}
    else{x.save();x.translate(cx,Y);x.beginPath();for(let k=0;k<10;k++){const r=k%2?s*0.22:s*0.5,a=-Math.PI/2+k*Math.PI/5;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();x.fillStyle=f?BC.HONEY:'rgba(255,246,232,.16)';x.fill();x.restore()}}}
// The grinder's dial at the setting: a numbered ring for rotation dials, an arc from fine to coarse for the rest.
function bcDial(x,g,c,cx,cy,R){const G=GRINDERS[g];c=Math.round(c);x.save();
  x.beginPath();x.arc(cx,cy,R,0,TAU);x.fillStyle='rgba(255,246,232,.06)';x.fill();x.lineWidth=2;x.strokeStyle=BC.LINE;x.stroke();
  if(G.fmt==='rot'){const rem=c%G.per,nums=G.per/10;
    for(let i=0;i<G.per;i++){const a=-Math.PI/2+i/G.per*TAU,big=i%10===0,r1=big?R*0.8:R*0.87;x.beginPath();x.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);x.lineTo(cx+Math.cos(a)*R*0.95,cy+Math.sin(a)*R*0.95);
      x.strokeStyle=big?BC.CREAM:'rgba(255,246,232,.35)';x.lineWidth=big?3:1.4;x.stroke()}
    x.font='600 '+Math.round(R*0.16)+'px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='center';x.textBaseline='middle';
    for(let n=0;n<nums;n++){const a=-Math.PI/2+n/nums*TAU;x.fillText(String(n),cx+Math.cos(a)*R*0.62,cy+Math.sin(a)*R*0.62)}
    const a=-Math.PI/2+rem/G.per*TAU;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(a)*R*0.9,cy+Math.sin(a)*R*0.9);x.lineCap='round';x.lineWidth=7;x.strokeStyle=BC.HONEY;x.stroke()}
  else{const t=clamp((c-G.min)/Math.max(1,G.max-G.min),0,1),A=i=>(135+i*270)*Math.PI/180;
    x.lineCap='round';x.lineWidth=16;x.beginPath();x.arc(cx,cy,R*0.78,A(0),A(1));x.strokeStyle='rgba(255,246,232,.14)';x.stroke();
    x.beginPath();x.arc(cx,cy,R*0.78,A(0),A(Math.max(0.002,t)));x.strokeStyle=BC.HONEY;x.stroke();
    x.font='500 '+Math.round(R*0.13)+'px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='center';x.textBaseline='middle';
    x.fillText('fine',cx+Math.cos(A(0))*R*0.78,cy+Math.sin(A(0))*R*0.78+R*0.22);x.fillText('coarse',cx+Math.cos(A(1))*R*0.78,cy+Math.sin(A(1))*R*0.78+R*0.22)}
  x.beginPath();x.arc(cx,cy,R*0.32,0,TAU);x.fillStyle=BC.HONEY;x.fill();
  x.fillStyle=BC.BG1;x.font='800 '+Math.round(R*0.2)+'px '+BC.F;x.textAlign='center';x.textBaseline='middle';x.fillText(dial(g,c),cx,cy+1);x.restore()}
// The predicted cup seen from above, with the flavour radar floating on the coffee (as on the dial-in).
function bcCup(x,r,cx,cy,R){const ax=[['Sweet',r.sweet],['Acidity',r.acid],['Body',r.body],['Clarity',r.clarity],['Bitter',r.bitter]],ang=i=>-Math.PI/2+i*TAU/5;
  x.save();x.beginPath();x.arc(cx,cy,R*1.3,0,TAU);x.fillStyle='rgba(255,246,232,.07)';x.fill();
  x.beginPath();x.arc(cx,cy,R*1.1,0,TAU);x.fillStyle='#F3EADC';x.fill();
  x.beginPath();x.arc(cx,cy,R,0,TAU);x.fillStyle=liquid(r.D);x.fill();x.lineWidth=4;x.strokeStyle='rgba(255,235,200,.35)';x.stroke();
  const pt=(i,v)=>[cx+Math.cos(ang(i))*R*0.92*v/10,cy+Math.sin(ang(i))*R*0.92*v/10];
  for(const k of [2.5,5,7.5,10]){x.beginPath();ax.forEach((_,i)=>{const p=pt(i,k);i?x.lineTo(...p):x.moveTo(...p)});x.closePath();x.strokeStyle='rgba(255,255,255,'+(k===10?.3:.15)+')';x.lineWidth=1.5;x.stroke()}
  x.beginPath();ax.forEach((a,i)=>{const p=pt(i,a[1]);i?x.lineTo(...p):x.moveTo(...p)});x.closePath();x.fillStyle='rgba(255,245,225,.34)';x.fill();x.strokeStyle='#FFF3DD';x.lineWidth=4;x.lineJoin='round';x.stroke();
  ax.forEach((a,i)=>{const p=pt(i,a[1]);x.beginPath();x.arc(p[0],p[1],6,0,TAU);x.fillStyle='#FFF3DD';x.fill()});
  x.font='600 22px '+BC.F;x.textBaseline='middle';
  ax.forEach((a,i)=>{const an=ang(i),lx=cx+Math.cos(an)*R*1.55,ly=cy+Math.sin(an)*R*1.48;x.textAlign=Math.abs(Math.cos(an))<0.3?'center':Math.cos(an)>0?'left':'right';
    x.fillStyle=BC.MUTED;x.fillText(a[0],lx,ly-12);x.fillStyle=BC.CREAM;x.font='800 26px '+BC.F;x.fillText(a[1].toFixed(1),lx,ly+16);x.font='600 22px '+BC.F});
  x.restore()}
// Chips that wrap onto new rows; each can carry its own colour dot (flavour notes keep their wheel colours).
function bcChips(x,items,y){const W=BC.W,P=BC.PAD;let px=P;x.font='500 27px '+BC.F;
  for(const it of items){const t=typeof it==='string'?it:it.t,dot=typeof it==='string'?null:it.c,w=x.measureText(t).width+48+(dot?26:0);if(px+w>W-P){px=P;y+=70}
    bcRound(x,px,y,w,56,28);x.fillStyle='rgba(255,246,232,.05)';x.fill();x.strokeStyle='rgba(226,184,102,.38)';x.lineWidth=1.5;x.stroke();
    if(dot){x.beginPath();x.arc(px+30,y+28,9,0,TAU);x.fillStyle=dot;x.fill()}x.fillStyle=BC.CREAM;x.textBaseline='alphabetic';x.fillText(t,px+24+(dot?26:0),y+38);px+=w+12}
  return y+56}
const bcLoad=src=>new Promise(ok=>{if(!src){ok(null);return}const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src});
/* Draw a card. m: {kicker, date, photo (an image), title, by, sub, rating {kind,v,word}, pills [[text,main]], tiles [[label,value]],
   grind {g,c,line}, cup {r,vt,vs}, text [{label,body}], steps [], expect {label,items,bar}, quote {label,text}, footer} */
function bcDraw(m){const W=BC.W,P=BC.PAD,IW=W-2*P,c=document.createElement('canvas');c.width=W;c.height=4400;const x=c.getContext('2d');
  BC.F=getComputedStyle(document.body).fontFamily;
  // Background: deep espresso, a soft honey glow, a faint bean watermark and a very fine grain.
  const bg=x.createLinearGradient(0,0,0,c.height);bg.addColorStop(0,'#2B1A11');bg.addColorStop(0.45,'#1A100A');bg.addColorStop(1,'#0E0805');x.fillStyle=bg;x.fillRect(0,0,W,c.height);
  const gl=x.createRadialGradient(W*0.95,-60,10,W*0.95,-60,W*1.05);gl.addColorStop(0,'rgba(226,184,102,.30)');gl.addColorStop(1,'rgba(226,184,102,0)');x.fillStyle=gl;x.fillRect(0,0,W,1300);
  const gl2=x.createRadialGradient(-120,1100,10,-120,1100,760);gl2.addColorStop(0,'rgba(168,67,47,.18)');gl2.addColorStop(1,'rgba(168,67,47,0)');x.fillStyle=gl2;x.fillRect(0,0,W,2000);
  x.save();x.globalAlpha=0.05;bcBean(x,W-150,250,420,BC.HONEY,'#2B1A11');x.restore();
  x.fillStyle='rgba(255,255,255,.022)';for(let gy=0;gy<c.height;gy+=7)for(let gx=(gy/7)%2*3.5;gx<W;gx+=7)x.fillRect(gx,gy,1,1);
  x.textBaseline='alphabetic';x.textAlign='left';
  // Header: the mark and kicker, the date, then a fine rule.
  let y=100;bcBean(x,P+16,y-9,32,BC.HONEY);bcLabel(x,m.kicker||'The Brew Bench',P+44,y);
  x.textAlign='right';x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(m.date||new Date().toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}),W-P,y);x.textAlign='left';
  y+=30;const rl=x.createLinearGradient(P,0,W-P,0);rl.addColorStop(0,'rgba(226,184,102,.55)');rl.addColorStop(1,'rgba(226,184,102,0)');x.fillStyle=rl;x.fillRect(P,y,IW,1.5);
  // A photo of the bag, framed like a print.
  if(m.photo){y+=36;const ph=m.photo,bh=Math.round(IW*0.72);x.save();bcRound(x,P,y,IW,bh,30);x.clip();
    const s=Math.max(IW/ph.width,bh/ph.height),dw=ph.width*s,dh=ph.height*s;x.drawImage(ph,P+(IW-dw)/2,y+(bh-dh)/2,dw,dh);
    const sh=x.createLinearGradient(0,y+bh*0.6,0,y+bh);sh.addColorStop(0,'rgba(14,8,5,0)');sh.addColorStop(1,'rgba(14,8,5,.5)');x.fillStyle=sh;x.fillRect(P,y,IW,bh);x.restore();
    bcRound(x,P,y,IW,bh,30);x.lineWidth=1.5;x.strokeStyle='rgba(226,184,102,.45)';x.stroke();y+=bh}
  // Title and credit
  y+=104;x.font='800 76px '+BC.F;x.fillStyle=BC.CREAM;x.letterSpacing='-1px';
  for(const l of bcWrap(x,m.title,IW,2)){x.fillText(l,P,y);y+=84}x.letterSpacing='0px';
  if(m.by){x.font='italic 500 28px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,m.by,IW,1)[0],P,y-34);y+=10}
  if(m.sub){x.font='600 32px '+BC.F;x.fillStyle=BC.HONEY;x.fillText(bcWrap(x,m.sub,IW,1)[0],P,y+4);y+=56}
  // Rating, large, with its word.
  if(m.rating&&m.rating.v){y+=6;bcRating(x,m.rating.kind,m.rating.v,P,y+24,46);const rv=String(m.rating.v).replace('.5','½'),rx=P+5*46*1.18+14;
    x.font='800 38px '+BC.F;x.fillStyle=BC.CREAM;x.fillText(rv,rx,y+37);
    if(m.rating.word){const vw=x.measureText(rv).width;x.font='500 28px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(m.rating.word,rx+vw+18,y+37)}y+=74}
  // Pills: outlined, the first (the target cup) in honey.
  if(m.pills&&m.pills.length){let px=P;y+=4;for(const [t,main] of m.pills){x.font='600 24px '+BC.F;const w=x.measureText(t).width+40;if(px+w>W-P){px=P;y+=60}
      bcRound(x,px,y,w,48,24);if(main){x.fillStyle='rgba(226,184,102,.16)';x.fill()}x.lineWidth=1.5;x.strokeStyle=main?'rgba(226,184,102,.7)':'rgba(255,246,232,.22)';x.stroke();
      x.fillStyle=main?BC.HONEY:'rgba(255,246,232,.85)';x.fillText(t,px+20,y+32);px+=w+10}y+=78}else y+=20;
  // The spec sheet: the coffee on one row, the numbers on the next, in one panel divided by fine lines.
  const specRows=[m.coffee,m.tiles].filter(r=>r&&r.length);
  if(specRows.length){const rows=specRows.map((r,ri)=>{const n=r.length,cw=IW/n,big=r===m.tiles,fs=big?(n>3?44:38):(n>3?28:32);x.font='700 '+fs+'px '+BC.F;
      const cells=r.map(([k,v])=>[k,bcWrap(x,v||'–',cw-44,2)]),lines=Math.max(...cells.map(cc=>cc[1].length));return{n,cw,fs,cells,big,h:big?136:(lines>1?150:118)}});
    const H=rows.reduce((a,r)=>a+r.h,0);bcPane(x,P,y,IW,H,28);let ry=y;
    rows.forEach((r,ri)=>{if(ri){x.fillStyle='rgba(255,246,232,.10)';x.fillRect(P+24,ry,IW-48,1.5)}
      r.cells.forEach(([k,ls],i)=>{const X=P+i*r.cw;if(i){x.fillStyle='rgba(255,246,232,.09)';x.fillRect(X,ry+22,1.5,r.h-44)}
        bcLabel(x,k,X+24,ry+44,r.big?BC.MUTED:BC.HONEY);x.font='700 '+r.fs+'px '+BC.F;x.fillStyle=BC.CREAM;ls.forEach((l,j)=>x.fillText(l,X+24,ry+(r.big?100:90)+j*(r.fs+8)))});ry+=r.h});
    y+=H+20}
  // Grind, with the dial drawn at the setting
  if(m.grind&&GRINDERS[m.grind.g]){const G=GRINDERS[m.grind.g],h=280,st=m.grind.c;bcPane(x,P,y,IW,h,28);bcDial(x,m.grind.g,st,P+146,y+h/2,108);const X=P+292;
    bcLabel(x,'Grind',X,y+64);x.font='800 88px '+BC.F;x.fillStyle=BC.CREAM;const dv=dial(m.grind.g,st);x.fillText(dv,X,y+154);
    const sw=x.measureText(dv).width;x.font='500 28px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(G.fmt==='rot'?Math.round(st)+' clicks':G.unit==='clicks'?'clicks':'',X+sw+16,y+154);
    x.font='600 30px '+BC.F;x.fillStyle=BC.CREAM;x.fillText(bcWrap(x,G.name,W-P-X-30,1)[0],X,y+200);
    if(m.grind.line){x.font='500 25px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,m.grind.line,W-P-X-30,1)[0],X,y+240)}y+=h+20}
  // The predicted cup
  if(m.cup){const r=m.cup.r,h=430;bcPane(x,P,y,IW,h,28);bcCup(x,r,P+196,y+h/2+6,100);const X=P+478,w=W-P-X-36;
    bcLabel(x,'Predicted cup',X,y+68);x.font='800 44px '+BC.F;x.fillStyle=BC.CREAM;let yy=y+124;for(const l of bcWrap(x,m.cup.vt,w,2)){x.fillText(l,X,yy);yy+=52}
    x.font='500 25px '+BC.F;x.fillStyle=BC.MUTED;for(const l of bcWrap(x,m.cup.vs,w,4)){x.fillText(l,X,yy);yy+=35}
    const gy=y+h-84,gw=w;const gg=x.createLinearGradient(X,0,X+gw,0);gg.addColorStop(0,'#D9B35A');gg.addColorStop(.25,'#C98A3E');gg.addColorStop(.5,'#7A4524');gg.addColorStop(.75,'#4A2A18');gg.addColorStop(1,'#1E120B');
    bcRound(x,X,gy,gw,12,6);x.fillStyle=gg;x.fill();x.strokeStyle='rgba(255,246,232,.14)';x.lineWidth=1;x.stroke();
    const mx=X+(clamp(r.D,-2.5,2.5)+2.5)/5*gw;bcRound(x,mx-4,gy-11,8,34,4);x.fillStyle=BC.CREAM;x.fill();
    x.font='500 19px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='left';x.fillText('Under',X,gy+48);x.textAlign='center';x.fillText('Sweet spot',X+gw/2,gy+48);x.textAlign='right';x.fillText('Over',X+gw,gy+48);x.textAlign='left';y+=h+20}
  // Text blocks (settings written as text, for log entries from before brews were kept in full)
  for(const tb of m.text||[]){if(!tb.body)continue;x.font='500 29px '+BC.F;const lines=bcWrap(x,tb.body,IW-56,6),h=86+lines.length*40;bcPane(x,P,y,IW,h,28);
    bcLabel(x,tb.label,P+28,y+48);x.font='500 29px '+BC.F;x.fillStyle=BC.CREAM;lines.forEach((l,j)=>x.fillText(l,P+28,y+94+j*40));y+=h+20}
  // Every pour: the times in a honey column, a fine line linking the steps.
  const steps=m.steps||[];
  if(steps.length){y+=40;bcLabel(x,'The pours',P,y);
    const last=[...steps].reverse().map(t=>/^(\d+:\d\d)/.exec(t)).find(Boolean);if(last){x.font='500 22px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='right';x.fillText('Done by '+last[1],W-P,y);x.textAlign='left'}y+=22;
    const tx=P+108,tw=W-P-tx-10,show=steps.slice(0,10);x.font='500 30px '+BC.F;
    const rows=show.map(s=>{const mm=/^(\d+:\d\d)\s*(.*)$/.exec(s);return{t:mm?mm[1]:'',d:bcCap(mm?mm[2]:s)}}).map(o=>({...o,lines:bcWrap(x,o.d,tw,2)}));
    const top=y+18;let yy=y;const ys=rows.map(o=>{const r0=yy;yy+=30+o.lines.length*40;return r0});
    x.fillStyle='rgba(226,184,102,.28)';x.fillRect(P+86,top+22,1.5,Math.max(0,ys[ys.length-1]-y+4));
    rows.forEach((o,i)=>{const ry=ys[i];x.font='700 26px '+BC.F;x.fillStyle=BC.HONEY;x.fillText(o.t||'·',P,ry+50);
      x.beginPath();x.arc(P+86.75,ry+41,7,0,TAU);x.fillStyle='#1A100A';x.fill();x.lineWidth=2;x.strokeStyle=BC.HONEY;x.stroke();
      x.font='500 30px '+BC.F;x.fillStyle=BC.CREAM;o.lines.forEach((l,j)=>x.fillText(l,tx,ry+51+j*40))});
    y=yy+10;if(steps.length>show.length){x.font='500 23px '+BC.F;x.fillStyle=BC.MUTED;x.fillText('+ '+(steps.length-show.length)+' more in the app',tx,y+10);y+=36}}
  // Notes: expected or tasted, with the flavour families as one bar in the wheel's colours
  if(m.expect&&m.expect.items.length){y+=44;bcLabel(x,m.expect.label,P,y);y+=24;y=bcChips(x,m.expect.items.slice(0,10),y);
    if(m.expect.bar&&m.expect.bar.length){y+=24;let bx=P;x.save();bcRound(x,P,y,IW,12,6);x.clip();m.expect.bar.forEach(([cc,p])=>{x.fillStyle=cc.c;x.fillRect(bx,y,IW*p+1,12);bx+=IW*p});x.restore();y+=12}}
  // Your own words
  if(m.quote&&m.quote.text){y+=48;x.font='italic 500 33px '+BC.F;const lines=bcWrap(x,m.quote.text,IW-60,6),h=66+lines.length*46;
    x.font='800 132px Georgia,serif';x.fillStyle='rgba(226,184,102,.2)';x.fillText('“',P-10,y+96);
    bcLabel(x,m.quote.label,P+64,y+26);x.font='italic 500 33px '+BC.F;x.fillStyle=BC.CREAM;lines.forEach((l,j)=>x.fillText(l,P+64,y+76+j*46));y+=h}
  // Footer: centred mark and line, the link beneath.
  y+=70;const fr=x.createLinearGradient(P,0,W-P,0);fr.addColorStop(0,'rgba(226,184,102,0)');fr.addColorStop(.5,'rgba(226,184,102,.45)');fr.addColorStop(1,'rgba(226,184,102,0)');x.fillStyle=fr;x.fillRect(P,y,IW,1.5);
  y+=64;x.font='700 26px '+BC.F;const ft=m.footer||'Brewed with The Brew Bench',fw=x.measureText(ft).width;bcBean(x,W/2-fw/2-22,y-9,28,BC.HONEY);
  x.fillStyle=BC.CREAM;x.textAlign='left';x.fillText(ft,W/2-fw/2+6,y);
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
  return bcBlob({title:dp?dp.r.name:'My '+brewName(B.name)+' brew',by:dp&&dp.r.by,coffee:bcCoffee(S.bean,S.variety,S.process,S.roast),
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
  const m={kicker:'From my brew log',date:fmtDate(l),title:l.coffee||(s&&s.rec)||'A brew',by:s&&s.rec&&l.coffee?s.rec+(s.by?' · '+s.by:''):s&&s.by,
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
async function beanCard(b){const P=b.process&&PROCESSES[b.process],rk=beanRank(b),fmt=s=>s?new Date(s+'T12:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'–';
  const photo=b.img?await bcLoad(await BIMG.get(b.id)):null;
  return bcBlob({kicker:'From my bean gallery',date:fmt(b.tried),photo,title:beanTitle(b),by:b.roaster,
    sub:[b.variety?vName(b.variety):'',P?P.name:'',b.roast?bcCap(b.roast)+' roast':''].filter(Boolean).join('  ·  '),
    rating:b.rating?{kind:'beans',v:b.rating,word:rateWord(b.rating)}:null,
    pills:rk?[['#'+rk+' · '+MEDALN[rk]+' of '+beanYear(b),1]]:[],
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
