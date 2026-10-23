/* ================= BREW CARD ================= */
// The brew as one designed image to share: the coffee and recipe, the numbers, the grinder's dial at your setting,
// the predicted cup, every pour and the notes to expect. Drawn on a canvas in the app's espresso and honey colours,
// 1080 px wide (a phone story) and as tall as the brew needs.
const BC={W:1080,PAD:72,BG1:'#2E1C12',BG2:'#120B07',CREAM:'#FFF6E8',MUTED:'rgba(255,246,232,.62)',FAINT:'rgba(255,246,232,.10)',LINE:'rgba(255,246,232,.16)',HONEY:'#E2B866',CARAMEL:'#C9964A',ROAST:'#A8432F'};
function bcRound(x,X,Y,w,h,r){x.beginPath();x.roundRect(X,Y,w,h,r)}
// Lines of text that fit a width, at most `max` lines (the last one ends with an ellipsis if cut).
function bcWrap(x,t,w,max){const words=String(t).split(/\s+/);const out=[];let cur='';
  for(const wd of words){const tryL=cur?cur+' '+wd:wd;if(x.measureText(tryL).width<=w)cur=tryL;else{if(cur)out.push(cur);cur=wd}if(out.length===max)break}
  if(out.length<max&&cur)out.push(cur);
  if(out.length===max&&words.join(' ')!==out.join(' ')){let l=out[max-1];while(l&&x.measureText(l+'…').width>w)l=l.slice(0,-1);out[max-1]=l.replace(/\s+$/,'')+'…'}
  return out}
function bcCard(x,X,Y,w,h,r){bcRound(x,X,Y,w,h,r||28);x.fillStyle=BC.FAINT;x.fill();x.lineWidth=2;x.strokeStyle=BC.LINE;x.stroke()}
function bcLabel(x,t,X,Y,col){x.font='700 22px '+BC.F;x.fillStyle=col||BC.HONEY;x.letterSpacing='3px';x.fillText(t.toUpperCase(),X,Y);x.letterSpacing='0px'}
// The app's bean mark.
function bcBean(x,cx,cy,s,col){x.save();x.translate(cx,cy);x.rotate(-38*Math.PI/180);x.beginPath();x.ellipse(0,0,s*0.36,s*0.5,0,0,TAU);x.fillStyle=col;x.fill();
  x.beginPath();x.moveTo(s*0.02,-s*0.5);x.bezierCurveTo(-s*0.16,-s*0.2,s*0.16,0,s*0.0,s*0.18);x.bezierCurveTo(-s*0.1,s*0.32,s*0.06,s*0.42,s*0.02,s*0.5);x.lineWidth=s*0.07;x.strokeStyle=BC.BG1;x.stroke();x.restore()}
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
function brewCardCanvas(){const W=BC.W,P=BC.PAD,c=document.createElement('canvas');c.width=W;c.height=3600;const x=c.getContext('2d');
  BC.F=getComputedStyle(document.body).fontFamily;
  const r=compute(S),[vt,vs]=verdict(r.D),B=BREWERS[S.brewer],dp=dialPlan(),G=GRINDERS[S.grinder],Pr=PROCESSES[S.process];
  const water=dp?dp.water:+gfmt(S.dose*S.ratio);
  // Background: espresso with a honey glow and a fine grain.
  const bg=x.createLinearGradient(0,0,0,c.height);bg.addColorStop(0,BC.BG1);bg.addColorStop(0.6,BC.BG2);x.fillStyle=bg;x.fillRect(0,0,W,c.height);
  const gl=x.createRadialGradient(W*0.92,-40,10,W*0.92,-40,W*0.95);gl.addColorStop(0,'rgba(226,184,102,.42)');gl.addColorStop(1,'rgba(226,184,102,0)');x.fillStyle=gl;x.fillRect(0,0,W,1200);
  const gl2=x.createRadialGradient(-80,900,10,-80,900,700);gl2.addColorStop(0,'rgba(168,67,47,.30)');gl2.addColorStop(1,'rgba(168,67,47,0)');x.fillStyle=gl2;x.fillRect(0,0,W,1800);
  x.fillStyle='rgba(255,255,255,.035)';for(let gy=0;gy<c.height;gy+=9)for(let gx=(gy/9)%2*4.5;gx<W;gx+=9)x.fillRect(gx,gy,1.2,1.2);
  x.textBaseline='alphabetic';x.textAlign='left';
  // Header
  let y=104;bcBean(x,P+20,y-12,40,BC.HONEY);bcLabel(x,'The Brew Bench',P+56,y-2);
  x.textAlign='right';x.font='500 24px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(new Date().toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}),W-P,y-2);x.textAlign='left';
  y+=92;x.font='800 72px '+BC.F;x.fillStyle=BC.CREAM;const title=dp?dp.r.name:'My '+brewName(B.name)+' brew';
  for(const l of bcWrap(x,title,W-2*P,2)){x.fillText(l,P,y);y+=82}
  if(dp&&dp.r.by){x.font='500 28px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,dp.r.by,W-2*P,1)[0],P,y-30);y+=14}
  x.font='600 34px '+BC.F;x.fillStyle=BC.HONEY;x.fillText(bcWrap(x,[vName(S.variety),Pr.name,S.roast[0].toUpperCase()+S.roast.slice(1)+' roast'].join('  ·  '),W-2*P,1)[0],P,y+8);y+=60;
  // Pills: the target cup and the brewer.
  {let px=P;const pill=(t,fill,ink)=>{x.font='700 26px '+BC.F;const w=x.measureText(t).width+44;bcRound(x,px,y,w,54,27);x.fillStyle=fill;x.fill();if(!ink){x.strokeStyle=BC.LINE;x.lineWidth=2;x.stroke()}x.fillStyle=ink||BC.CREAM;x.fillText(t,px+22,y+36);px+=w+12};
    if(dp)pill(goalLabel(S.goal,S.amt)+' cup',BC.HONEY,BC.BG1);pill(B.name,BC.FAINT);if(S.age)pill(S.age+' days off roast',BC.FAINT)}
  y+=90;
  // The numbers
  {const tiles=[['Coffee',gfmt(S.dose)+' g'],['Water',gfmt(water)+' g'],['Temp',S.temp+'°C'],['Ratio','1:'+rr1(S.ratio)]],gap=16,tw=(W-2*P-gap*3)/4;
    tiles.forEach(([k,v],i)=>{const X=P+i*(tw+gap);bcCard(x,X,y,tw,150,26);bcLabel(x,k,X+22,y+44,BC.MUTED);x.font='800 46px '+BC.F;x.fillStyle=BC.CREAM;x.fillText(v,X+22,y+112)});y+=150+22}
  // Grind, with the dial drawn at the setting
  {const h=290;bcCard(x,P,y,W-2*P,h,30);bcDial(x,S.grinder,S.setting,P+150,y+h/2,112);const X=P+300;
    bcLabel(x,'Grind',X,y+66);x.font='800 92px '+BC.F;x.fillStyle=BC.CREAM;x.fillText(dial(S.grinder,S.setting),X,y+160);
    const sw=x.measureText(dial(S.grinder,S.setting)).width;x.font='600 30px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(G.fmt==='rot'?S.setting+' clicks':G.unit==='clicks'?'clicks':'',X+sw+16,y+160);
    x.font='600 30px '+BC.F;x.fillStyle=BC.CREAM;x.fillText(bcWrap(x,G.name,W-P-X-30,1)[0],X,y+206);
    x.font='500 26px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(bcWrap(x,B.bloom.label+' '+S.bloom+' s  ·  '+{low:'Gentle',med:'Steady',high:'Lively'}[S.agit]+' pours',W-P-X-30,1)[0],X,y+246);y+=h+22}
  // The predicted cup
  {const h=440;bcCard(x,P,y,W-2*P,h,30);bcCup(x,r,P+196,y+h/2+6,102);const X=P+478,w=W-P-X-36;
    bcLabel(x,'Predicted cup',X,y+70);x.font='800 46px '+BC.F;x.fillStyle=BC.CREAM;let yy=y+128;for(const l of bcWrap(x,vt,w,2)){x.fillText(l,X,yy);yy+=54}
    x.font='500 26px '+BC.F;x.fillStyle=BC.MUTED;for(const l of bcWrap(x,vs,w,4)){x.fillText(l,X,yy);yy+=36}
    // Extraction gauge
    const gy=y+h-86,gw=w;const gg=x.createLinearGradient(X,0,X+gw,0);gg.addColorStop(0,'#D9B35A');gg.addColorStop(.25,'#C98A3E');gg.addColorStop(.5,'#7A4524');gg.addColorStop(.75,'#4A2A18');gg.addColorStop(1,'#1E120B');
    bcRound(x,X,gy,gw,16,8);x.fillStyle=gg;x.fill();x.strokeStyle=BC.LINE;x.lineWidth=1.5;x.stroke();
    const mx=X+(clamp(r.D,-2.5,2.5)+2.5)/5*gw;bcRound(x,mx-5,gy-12,10,40,5);x.fillStyle=BC.CREAM;x.fill();
    x.font='500 20px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='left';x.fillText('Under',X,gy+52);x.textAlign='center';x.fillText('Sweet spot',X+gw/2,gy+52);x.textAlign='right';x.fillText('Over',X+gw,gy+52);x.textAlign='left';y+=h+22}
  // Every pour, on a timeline
  const steps=dp?dp.steps:[];
  if(steps.length){y+=30;bcLabel(x,'The pours',P,y);
    // The last timed step is when the brew ends.
    const last=[...steps].reverse().map(t=>/^(\d+:\d\d)/.exec(t)).find(Boolean);if(last){x.font='600 24px '+BC.F;x.fillStyle=BC.MUTED;x.textAlign='right';x.fillText('Done by '+last[1],W-P,y);x.textAlign='left'}y+=30;const tl=P+70,tw=W-P-tl-40;const show=steps.slice(0,10);
    x.font='500 30px '+BC.F;const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);const rows=show.map(s=>{const m=/^(\d+:\d\d)\s*(.*)$/.exec(s);return{t:m?m[1]:'',d:cap(m?m[2]:s)}}).map(o=>({...o,lines:bcWrap(x,o.d,tw-40,2)}));
    const top=y;rows.forEach((o,i)=>{const rh=28+o.lines.length*40;
      if(i<rows.length-1){x.beginPath();x.moveTo(P+40,y+44);x.lineTo(P+40,y+rh+30);x.strokeStyle=BC.LINE;x.lineWidth=3;x.stroke()}
      x.beginPath();x.arc(P+40,y+36,o.t?26:10,0,TAU);x.fillStyle=o.t?'rgba(226,184,102,.16)':BC.HONEY;x.fill();if(o.t){x.lineWidth=2.5;x.strokeStyle=BC.HONEY;x.stroke();
        x.font='700 '+(o.t.length>4?17:19)+'px '+BC.F;x.fillStyle=BC.HONEY;x.textAlign='center';x.fillText(o.t,P+40,y+43);x.textAlign='left'}
      x.font='500 30px '+BC.F;x.fillStyle=BC.CREAM;o.lines.forEach((l,j)=>x.fillText(l,tl+16,y+46+j*40));y+=rh+14});
    if(steps.length>show.length){x.font='500 24px '+BC.F;x.fillStyle=BC.MUTED;x.fillText('+ '+(steps.length-show.length)+' more in the app',tl+16,y+10);y+=40}}
  // What to expect in the cup
  const notes=cupNotes(S,r).slice(0,8);
  if(notes.length){y+=34;bcLabel(x,'Expect',P,y);y+=24;let px=P;x.font='600 28px '+BC.F;
    for(const n of notes){const w=x.measureText(n).width+48;if(px+w>W-P){px=P;y+=70}bcRound(x,px,y,w,56,28);x.fillStyle='rgba(226,184,102,.14)';x.fill();x.strokeStyle='rgba(226,184,102,.4)';x.lineWidth=2;x.stroke();
      x.fillStyle=BC.CREAM;x.fillText(n,px+24,y+38);px+=w+12}y+=56}
  // Footer
  y+=64;x.beginPath();x.moveTo(P,y);x.lineTo(W-P,y);x.strokeStyle=BC.LINE;x.lineWidth=2;x.stroke();y+=58;
  bcBean(x,P+16,y-10,30,BC.HONEY);x.font='700 26px '+BC.F;x.fillStyle=BC.CREAM;x.fillText('Brewed with The Brew Bench',P+44,y);
  x.textAlign='right';x.font='500 24px '+BC.F;x.fillStyle=BC.MUTED;x.fillText(SITE_URL.replace(/^https?:\/\//,'').replace(/\/$/,''),W-P,y);x.textAlign='left';
  // Trim to what was drawn, never shorter than a 4:5 post.
  const H=Math.max(1350,Math.round(y+64)),out=document.createElement('canvas');out.width=W;out.height=H;const o=out.getContext('2d');o.drawImage(c,0,0);
  return out}
async function brewCard(){if(document.fonts&&document.fonts.ready)await document.fonts.ready;const cv=brewCardCanvas();return new Promise(res=>cv.toBlob(res,'image/jpeg',0.92))}
// Share the card where the phone can (WhatsApp, Instagram, Photos), otherwise save it.
async function shareCard(blob,name,title,save){const f=new File([blob],name+'.jpg',{type:'image/jpeg'});
  if(!save){if(NATIVE){try{await nativeShare(title,name+'.jpg',blob);return}catch(e){if(/cancel/i.test(e&&e.message||''))return}}
    else if(navigator.canShare){try{if(navigator.canShare({files:[f]})){await navigator.share({files:[f],title});return}}catch(e){if(e&&e.name==='AbortError')return}}}
  saveFile(name+'.jpg',blob)}
