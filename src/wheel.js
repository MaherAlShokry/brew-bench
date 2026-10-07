/* ================= FLAVOUR WHEEL ================= */
// Every word on the wheel becomes a node with an id ("fruity.berry.blueberry"), a depth, a colour and its share of the
// circle (each note gets the same slice, so a group is as wide as its notes). One layout function places the slices and
// their labels for any zoom; the SVG on screen and the canvas for downloads both draw from it.
const FW=(()=>{const all=[],byId={},slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),toHex=a=>'#'+a.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
  const tint=(c,to,t)=>{const A=hex(c),B=hex(to);return toHex(A.map((v,i)=>v+(B[i]-v)*t))};
  const count=x=>Array.isArray(x)?1:x.k.reduce((s,k)=>s+count(k),0),total=FWHEEL.reduce((s,c)=>s+count(c),0);let at=0;
  function walk(x,parent,i){const arr=Array.isArray(x),n={n:arr?x[0]:x.n,d:arr?x[1]:x.d,l:arr?(x[2]||[]):[],parent,depth:parent?parent.depth+1:0,kids:[],leaf:arr};
    n.id=(parent?parent.id+'.':'')+slug(n.n);n.cat=parent?parent.cat:n;
    n.c=!parent?x.c:arr?tint(n.cat.c,'#FFFFFF',[0.2,0.34,0.1,0.42][i%4]):tint(n.cat.c,i%2?'#000000':'#FFFFFF',i%2?0.12:0.14);
    n.a0=at/total;if(!arr)x.k.forEach((k,j)=>n.kids.push(walk(k,n,j)));else at++;n.a1=at/total;all.push(n);byId[n.id]=n;return n}
  const roots=FWHEEL.map((c,i)=>walk(c,null,i));
  const lum=c=>{const [r,g,b]=hex(c).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
  all.forEach(n=>{n.ink=lum(n.c)>.42?'#2A1D14':'#FFFDF9';n.path=[];for(let p=n;p;p=p.parent)n.path.unshift(p)});
  return {all,byId,roots,leaves:all.filter(n=>n.leaf),tint}})();
const TAU=Math.PI*2,FW_HOLE=0.2;
// Ring radii for a zoom depth z (0 at the top, 1 inside a family, 2 inside a group): the opened part folds into the
// middle and what is inside it shares the rest of the wheel.
function fwRing(n,z,R){const L=3-z,k=n.depth-z,f=x=>R*(FW_HOLE+(1-FW_HOLE)*Math.max(0,Math.min(L,x))/L);return[f(k),n.leaf?(k+1>0?R:f(k+1)):f(k+1)]}
// Where a slice sits for a zoom (the view is the part of the circle, 0 to 1, that fills the wheel).
function fwSector(s0,s1,ri,ro){const p=(a,r)=>(r*Math.sin(a)).toFixed(2)+','+(-r*Math.cos(a)).toFixed(2);if(s1-s0<1e-4)return'';
  if(s1-s0>=TAU-1e-6)return'M0,'+(-ro)+'A'+ro+','+ro+' 0 1 1 0,'+ro+'A'+ro+','+ro+' 0 1 1 0,'+(-ro)+'ZM0,'+(-ri)+'A'+ri+','+ri+' 0 1 0 0,'+ri+'A'+ri+','+ri+' 0 1 0 0,'+(-ri)+'Z';
  const L=s1-s0>Math.PI?1:0;return'M'+p(s0,ro)+'A'+ro+','+ro+' 0 '+L+' 1 '+p(s1,ro)+'L'+p(s1,ri)+'A'+ri+','+ri+' 0 '+L+' 0 '+p(s0,ri)+'Z'}
// A label inside a slice: along the radius when the slice is narrow, across it when wide; never upside down.
// Names with a slash ("Sour/Fermented") may break onto two lines when that lets them be larger.
function fwLabel(text,s0,s1,ri,ro,base,minFs,bold){const span=s1-s0,rm=(ri+ro)/2,cw=bold?.6:.56;if(span<1e-3)return null;
  const opts=[[text]];const k=text.indexOf('/');if(k>0)opts.push([text.slice(0,k+1),text.slice(k+1)]);let best=null;
  for(const lines of opts){const len=Math.max(...lines.map(l=>l.length)),h=lines.length*1.12;
    if(span>=TAU-1e-6){const fs=Math.min(base,(ro-ri)*.5/h,(TAU*rm*.3)/(len*cw));if(!best||fs>best.fs)best={x:0,y:-rm,rot:0,fs,lines};continue}
    const fsR=Math.min(base,(ro-ri-8)/(len*cw),span*rm*.8/h),fsT=span<Math.PI*.9?Math.min(base,(span*rm-6)/(len*cw),(ro-ri)*.55/h):0;
    const tang=fsT>=fsR*1.05,fs=(tang?fsT:fsR)*(lines.length>1?.97:1);if(best&&fs<=best.fs)continue;
    const m=(s0+s1)/2,deg=m*180/Math.PI;best={x:rm*Math.sin(m),y:-rm*Math.cos(m),rot:tang?(deg>90&&deg<270?deg+180:deg):(deg>180?deg+90:deg-90),fs,lines}}
  return best&&best.fs>=minFs?best:null}
// In a profile, the notes you tasted take more of the circle (more for stronger ones), so the cup reads at a glance.
function fwAngles(sel){const w=n=>n.leaf?(sel.has(n.id)?4+3*sel.get(n.id):1):n.kids.reduce((t,k)=>t+w(k),0),out={},tot=FW.roots.reduce((t,c)=>t+w(c),0);let at=0;
  const walk=n=>{const a0=at/tot;if(n.leaf)at+=w(n);else n.kids.forEach(walk);out[n.id]=[a0,at/tot]};FW.roots.forEach(walk);return out}
// Every slice, label and (for profiles) intensity fill, for a view, radius and mode.
// mode 'explore' and 'pick' colour everything; 'profile' fades notes you did not taste and fills the ones you did by intensity.
function fwLayout(view,R,o){const out=[],w=view.a1-view.a0,ang=x=>Math.max(0,Math.min(1,(x-view.a0)/w))*TAU,sel=o.sel||new Map(),has=sel.size>0;
  const hot=new Set();sel.forEach((v,id)=>{const n=FW.byId[id];if(n)n.path.forEach(p=>hot.add(p.id))});const A=o.mode==='profile'&&has?fwAngles(sel):null;
  for(const n of FW.all){const s0=ang(A?A[n.id][0]:n.a0),s1=ang(A?A[n.id][1]:n.a1);if(s1-s0<1e-4)continue;
    const [ri,ro]=fwRing(n,view.z||0,R);if(ro-ri<.5)continue;let op=1,fill=null;
    if(o.mode==='profile'){op=hot.has(n.id)?(n.leaf?.2:1):.13;if(n.leaf&&sel.has(n.id))fill=fwSector(s0,s1,ri,ri+(ro-ri)*Math.min(3,sel.get(n.id))/3)}
    else if(o.mode==='pick'&&has)op=sel.has(n.id)?1:hot.has(n.id)?.92:.42;
    const base=R*(n.depth===0?.075:n.depth===1?.064:.058)*(1+.35*(view.z||0));
    let lab=o.labels===false?null:fwLabel(n.n,s0,s1,ri,ro,base,o.minFs||0,n.depth===0);
    if(lab&&o.mode==='profile'&&!hot.has(n.id))lab=n.depth<2&&!n.leaf?lab:null;
    out.push({n,d:fwSector(s0,s1,ri,ro),fill,op,lab,on:sel.has(n.id)})}
  return out}
// Label colour and strength: in a profile, notes you tasted are read on their fill (or in ink when the fill is short).
function fwInk(it,o,INK){if(o.mode!=='profile')return[it.n.ink,1];const v=o.sel&&o.sel.get(it.n.id);if(v)return[v>=2?it.n.ink:INK,1];
  return[it.op<1&&!it.n.leaf?INK:it.n.ink,it.op<.5?.55:1]}
const FW_EASE=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
// An interactive wheel in a container. Explore: tap a group to open it, a note to read about it. Pick: tap notes to add
// or remove them. Profile: shows what you tasted. Tap the middle to step back out.
function makeWheel(box,o){const R=300,NS='http://www.w3.org/2000/svg',api={view:{a0:0,a1:1,z:0},focus:null,selected:null,sel:o.sel||new Map()};let raf=0;
  box.innerHTML='<svg class="fwheel" viewBox="-306 -306 612 612" role="group" aria-label="'+esc(o.label||'Coffee flavour wheel')+'"><g class="fw-seg"></g><g class="fw-fill"></g><g class="fw-lab" aria-hidden="true"></g>'+
    '<g class="fw-mid" role="button" tabindex="0" aria-label="Step back out"><circle r="'+(R*FW_HOLE-3)+'"></circle><text class="fw-mt" y="-4"></text><text class="fw-ms" y="16"></text></g></svg>';
  const svg=box.firstChild,gS=svg.children[0],gF=svg.children[1],gL=svg.children[2],mid=svg.children[3],els={};
  const minFs=()=>{const w=svg.getBoundingClientRect().width||600;return Math.min(13,7.6*612/w)};
  function draw(){const items=fwLayout(api.view,R,{mode:o.mode,sel:api.sel,labels:o.labels,minFs:minFs()});const seen=new Set();
    for(const it of items){const id=it.n.id;seen.add(id);let e=els[id];
      if(!e){e=els[id]={p:document.createElementNS(NS,'path'),t:document.createElementNS(NS,'text'),f:document.createElementNS(NS,'path')};
        e.p.dataset.id=id;e.p.setAttribute('fill',it.n.c);if(o.mode!=='profile'){e.p.setAttribute('tabindex','0');e.p.setAttribute('role','button')}e.p.setAttribute('aria-label',it.n.path.map(x=>x.n).join(', '));
        e.f.setAttribute('fill',it.n.c);e.f.dataset.id=id;e.t.setAttribute('fill',it.n.ink);if(it.n.depth===0)e.t.setAttribute('font-weight','700');gS.appendChild(e.p);gF.appendChild(e.f);gL.appendChild(e.t)}
      e.p.setAttribute('d',it.d);e.p.style.display='';e.p.setAttribute('fill-opacity',it.op);e.p.classList.toggle('on',o.mode==='pick'&&it.on||api.selected===id);
      if(it.fill){e.f.setAttribute('d',it.fill);e.f.style.display=''}else e.f.style.display='none';
      if(it.lab){const L=it.lab,key=L.lines.join('|');if(e.t.dataset.k!==key){e.t.dataset.k=key;e.t.textContent='';L.lines.forEach((ln,j)=>{const ts=document.createElementNS(NS,'tspan');ts.setAttribute('x',0);ts.setAttribute('dy',j?'1.12em':((1-L.lines.length)*.56)+'em');ts.textContent=ln;e.t.appendChild(ts)})}e.t.style.display='';e.t.setAttribute('font-size',L.fs.toFixed(1));e.t.setAttribute('transform','translate('+L.x.toFixed(1)+' '+L.y.toFixed(1)+') rotate('+L.rot.toFixed(1)+')');
        const [ic,io]=fwInk(it,{mode:o.mode,sel:api.sel},'var(--ink)');e.t.setAttribute('fill',ic);e.t.setAttribute('fill-opacity',io);e.t.setAttribute('font-weight',it.n.depth===0||(o.mode==='profile'&&it.on)?'700':'500')}else e.t.style.display='none'}
    for(const id in els)if(!seen.has(id)){els[id].p.style.display='none';els[id].t.style.display='none';els[id].f.style.display='none'}
    const f=api.focus&&FW.byId[api.focus];mid.querySelector('circle').setAttribute('fill',f?f.c:'var(--surface2)');
    const mt=mid.querySelector('.fw-mt'),ms=mid.querySelector('.fw-ms');mt.setAttribute('fill',f?f.ink:'var(--ink)');ms.setAttribute('fill',f?f.ink:'var(--muted)');
    const title=f?f.n:(o.center||'Flavour wheel'),k=title.indexOf('/'),lines=k>0?[title.slice(0,k+1),title.slice(k+1)]:[title];if(mt.dataset.t!==title){mt.dataset.t=title;mt.textContent='';lines.forEach((ln,j)=>{const ts=document.createElementNS(NS,'tspan');ts.setAttribute('x',0);ts.setAttribute('dy',j?'1.1em':((1-lines.length)*.55)+'em');ts.textContent=ln;mt.appendChild(ts)})}mt.setAttribute('font-size',Math.min(17,100/Math.max(6,...lines.map(l=>l.length))*1.7).toFixed(1));ms.setAttribute('y',lines.length>1?24:16);
    ms.textContent=f?'← back':(o.hint||'tap a colour');mid.classList.toggle('back',!!f)}
  api.zoom=(id,instant)=>{const n=id&&FW.byId[id];api.focus=n&&!n.leaf?id:null;const rg=api.focus?(o.mode==='profile'&&api.sel.size?fwAngles(api.sel)[id]:[n.a0,n.a1]):null,t=rg?{a0:rg[0],a1:rg[1],z:n.depth+1}:{a0:0,a1:1,z:0},f={...api.view};
    cancelAnimationFrame(raf);if(instant||RM()){api.view=t;draw();return}const t0=performance.now(),D=520;
    const step=now=>{const k=FW_EASE(Math.min(1,(now-t0)/D));api.view={a0:f.a0+(t.a0-f.a0)*k,a1:f.a1+(t.a1-f.a1)*k,z:f.z+(t.z-f.z)*k};draw();if(k<1)raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step)};
  api.back=()=>{const f=api.focus&&FW.byId[api.focus];api.zoom(f&&f.parent?f.parent.id:null)};
  api.redraw=draw;
  const hit=id=>{const n=FW.byId[id];if(!n)return;
    if(o.mode==='pick'){if(!n.leaf){api.zoom(api.focus===id?(n.parent&&n.parent.id):id);return}
      if(api.sel.has(id))api.sel.delete(id);else api.sel.set(id,2);draw();o.onChange&&o.onChange(api.sel,id);return}
    if(o.mode==='profile'){if(!n.leaf)api.zoom(api.focus===id?(n.parent&&n.parent.id):id);return}
    if(!n.leaf&&api.focus!==id)api.zoom(id);else if(!n.leaf)api.zoom(n.parent&&n.parent.id);
    api.selected=id;draw();o.onSelect&&o.onSelect(n)};
  svg.addEventListener('click',e=>{if(e.target.closest('.fw-mid')){if(api.focus)api.back();return}const p=e.target.closest('[data-id]');if(p)hit(p.dataset.id)});
  svg.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const p=e.target.closest('[data-id],.fw-mid');if(!p)return;e.preventDefault();p.dispatchEvent(new MouseEvent('click',{bubbles:true}))});
  draw();new ResizeObserver(()=>draw()).observe(box);return api}

/* Downloads: the wheel as a poster image in the app's design. */
function fwCanvas(o){const W=1600,H=2600,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const font=getComputedStyle(document.body).fontFamily,PAPER='#F7F1E6',INK='#2A1D14',MUTED='#7A6656',CHERRY='#8A5A3B';
  x.fillStyle=PAPER;x.fillRect(0,0,W,H);
  // Header
  x.fillStyle=CHERRY;x.font='600 30px '+font;x.textBaseline='alphabetic';x.fillText('THE BREW BENCH',96,118);
  x.fillStyle=INK;x.font='800 76px '+font;x.fillText(o.title,96,200);
  if(o.sub){x.fillStyle=MUTED;x.font='400 34px '+font;x.fillText(o.sub,96,252)}
  // Wheel
  const R=640,cx=W/2,cy=300+R+10;x.save();x.translate(cx,cy);
  const items=fwLayout({a0:0,a1:1,z:0},R,{mode:o.mode||'explore',sel:o.sel,minFs:13});
  for(const it of items){const p=new Path2D(it.d);x.globalAlpha=it.op;x.fillStyle=it.n.c;x.fill(p);x.globalAlpha=1;x.lineWidth=3;x.strokeStyle=PAPER;x.stroke(p);
    if(it.fill){x.fillStyle=it.n.c;x.fill(new Path2D(it.fill));x.stroke(new Path2D(it.fill))}}
  x.textAlign='center';x.textBaseline='middle';
  for(const it of items){const L=it.lab;if(!L)continue;x.save();x.translate(L.x,L.y);x.rotate(L.rot*Math.PI/180);
    x.font=(it.n.depth===0||o.mode==='profile'&&it.on?'700 ':'500 ')+L.fs.toFixed(1)+'px '+font;const [ic,io]=fwInk(it,o,INK);x.fillStyle=ic;x.globalAlpha=io;L.lines.forEach((ln,j)=>x.fillText(ln,0,1+(j-(L.lines.length-1)/2)*L.fs*1.12));x.restore()}
  x.globalAlpha=1;x.beginPath();x.arc(0,0,R*FW_HOLE-4,0,TAU);x.fillStyle='#FFFDF9';x.fill();
  x.fillStyle=INK;x.font='700 34px '+font;x.fillText(o.center||'Flavour',0,-14);x.fillStyle=MUTED;x.font='400 26px '+font;x.fillText(o.centerSub||'wheel',0,24);x.restore();
  // Notes you tasted, with intensity dots
  let y=cy+R+(o.notes&&o.notes.length?90:10);x.textAlign='left';x.textBaseline='middle';
  if(o.notes&&o.notes.length){let px=96;x.font='600 30px '+font;
    for(const [id,v] of o.notes){const n=FW.byId[id];if(!n)continue;const label=n.n+' '+'●'.repeat(v)+'○'.repeat(3-v),w=x.measureText(label).width+76;
      if(px+w>W-96){px=96;y+=66;if(y>H-260)break}
      x.fillStyle=FW.tint(n.c,'#FFFFFF',.78);x.beginPath();x.roundRect(px,y-26,w,52,26);x.fill();x.fillStyle=n.c;x.beginPath();x.arc(px+28,y,11,0,TAU);x.fill();
      x.fillStyle=INK;x.fillText(label,px+50,y+1);px+=w+14}y+=40}
  // Footer, then trim the page to what was drawn.
  const end=y+80;x.fillStyle=MUTED;x.font='400 24px '+font;x.textAlign='center';
  x.fillText('Tasting words from the Coffee Taster’s Flavor Wheel by the SCA and World Coffee Research.',W/2,end);
  x.fillText('Designed in The Brew Bench · '+SITE_URL.replace(/^https?:\/\//,'').replace(/\/$/,''),W/2,end+38);
  const out=document.createElement('canvas');out.width=W;out.height=end+96;out.getContext('2d').drawImage(c,0,0);
  return new Promise(res=>out.toBlob(res,'image/png'))}
// Share the image where the phone can (WhatsApp, Photos and so on), otherwise download it.
async function fwExport(o,file){if(document.fonts&&document.fonts.ready)await document.fonts.ready;const blob=await fwCanvas(o);if(!blob){toast('Could not make the image');return}
  const f=new File([blob],file+'.png',{type:'image/png'});
  if(!NATIVE&&navigator.canShare&&matchMedia('(pointer:coarse)').matches){try{if(navigator.canShare({files:[f]})){await navigator.share({files:[f],title:o.title});return}}catch(e){if(e&&e.name==='AbortError')return}}
  saveFile(file+'.png',blob)}

/* The Flavour wheel page in Explore. */
let FWX=null;
function fwInfo(n){const el=$('fw-info');if(!n){el.innerHTML='<h3 style="margin-top:0">How to taste with the wheel</h3><ol class="fw-how"><li><b>Start in the middle.</b> Is it fruity, sweet, nutty, roasted? Pick the broad family first.</li><li><b>Work outwards.</b> Tap the colour to open it, then look for the closer match: berry, then blueberry.</li><li><b>Trust your first word.</b> If you can’t name it exactly, the group is a good answer.</li></ol><p class="hint" style="margin-bottom:0">Tap any colour on the wheel, or search for a note.</p>';return}
  const crumbs=n.path.map((p,i)=>'<button type="button" class="chip fw-crumb" data-fz="'+p.id+'"><i style="background:'+p.c+'"></i>'+esc(p.n)+'</button>'+(i<n.path.length-1?'<span class="fw-sep">›</span>':'')).join('');
  const kids=n.kids.length?'<p class="fw-sub">Inside '+esc(n.n)+'</p><div class="chips">'+n.kids.map(k=>'<button type="button" class="chip" data-fz="'+k.id+'"><i class="dot" style="background:'+k.c+'"></i>'+esc(k.n)+'</button>').join('')+'</div>':'';
  const links=(n.l||[]).map(l=>linkChip(l)).filter(Boolean).join('');
  el.innerHTML='<div class="fw-crumbs">'+crumbs+'</div><h3 class="fw-name"><i style="background:'+n.c+'"></i>'+esc(n.n)+'</h3><p>'+esc(n.d)+'</p>'+kids+(links?'<p class="fw-sub">Read more</p><div class="chips">'+links+'</div>':'')}
// Open a note or group from a chip, the search or a link: zoom to where it lives and show it.
function fwGo(id){const n=FW.byId[id];if(!n||!FWX)return;FWX.zoom(n.leaf?(n.parent&&n.parent.id):id);FWX.selected=id;FWX.redraw();fwInfo(n);
  if(matchMedia('(max-width:759px)').matches)$('fw-box').scrollIntoView({block:'start',behavior:RM()?'auto':'smooth'})}
function renderWheelTab(){
  FWX=makeWheel($('fw-box'),{mode:'explore',onSelect:n=>fwInfo(n)});fwInfo(null);
  $('fw-cats').innerHTML=FW.roots.map(c=>'<button type="button" class="chip" data-fz="'+c.id+'"><i class="dot" style="background:'+c.c+'"></i>'+esc(c.n)+'</button>').join('');
  const res=$('fw-res'),find=()=>{const q=fold($('fw-q').value.trim());if(!q){res.innerHTML='';return}
    const hits=FW.all.filter(n=>fold(n.n).includes(q)).sort((a,b)=>(fold(a.n).startsWith(q)?0:1)-(fold(b.n).startsWith(q)?0:1)||b.depth-a.depth).slice(0,8);
    res.innerHTML=hits.length?hits.map(n=>'<button type="button" class="chip" data-fz="'+n.id+'"><i class="dot" style="background:'+n.c+'"></i>'+esc(n.n)+(n.parent?' <small>'+esc(n.parent.n)+'</small>':'')+'</button>').join(''):'<p class="hint" style="margin:0">No note by that name. Try a shorter word.</p>'};
  $('fw-q').oninput=()=>soon(find);$('fw-q').onkeydown=e=>{if(e.key==='Enter'){const b=res.querySelector('[data-fz]');if(b){b.click();$('fw-q').blur()}}};
  $('wheel').addEventListener('click',e=>{if(goLink(e))return;const z=e.target.closest('[data-fz]');if(z)fwGo(z.dataset.fz)});
  $('fw-dl').onclick=()=>fwExport({title:'Coffee flavour wheel',sub:FW.leaves.length+' tasting notes, from the middle out'},'brew-bench-flavour-wheel');
  $('fw-log').onclick=()=>{showTab('log');openNotesPicker()}}
function wheelDoc(){return{link:SITE_URL+'#wheel',title:'Coffee flavour wheel',sub:FW.leaves.length+' tasting notes',file:'flavour-wheel',
  blocks:FW.roots.map(c=>({h:c.n,p:c.d,list:c.kids.map(k=>k.n+(k.kids.length?': '+k.kids.map(x=>x.n).join(', '):''))})).concat([{p:'Tasting words from the Coffee Taster’s Flavor Wheel by the SCA and World Coffee Research.'}])}}

/* Tasting notes on brews. A brew keeps fl: [[note id, 1 light | 2 medium | 3 strong], ...]. */
const FL_LV=['','Light','Medium','Strong'];
// Notes can arrive from friends' phones, so keep only real notes with a sensible strength.
function flOf(l){return Array.isArray(l&&l.fl)?l.fl.filter(x=>Array.isArray(x)&&FW.byId[x[0]]&&FW.byId[x[0]].leaf).map(([id,v])=>[id,Math.max(1,Math.min(3,Math.round(+v)||2))]).slice(0,40):[]}
const flMap=fl=>new Map(fl);
const flChips=fl=>fl.map(([id,v])=>{const n=FW.byId[id];return'<span class="flchip" title="'+FL_LV[v]+'"><i style="background:'+n.c+'"></i><b>'+esc(n.n)+'</b><span class="lv" aria-label="'+FL_LV[v]+'">'+'●'.repeat(v)+'○'.repeat(3-v)+'</span></span>'}).join('');
const flText=fl=>fl.map(([id,v])=>FW.byId[id].n+(v!==2?' ('+FL_LV[v].toLowerCase()+')':'')).join(', ');
// A small, still wheel for lists: what you tasted is filled in, the rest stays faint.
function fwStatic(fl){const items=fwLayout({a0:0,a1:1,z:0},300,{mode:'profile',sel:flMap(fl),labels:false});
  return'<svg class="fwheel" viewBox="-306 -306 612 612" aria-hidden="true">'+items.map(it=>'<path d="'+it.d+'" fill="'+it.n.c+'" fill-opacity="'+it.op+'"/>'+(it.fill?'<path d="'+it.fill+'" fill="'+it.n.c+'"/>':'')).join('')+'<circle r="57" fill="var(--surface2)" stroke="var(--paper)" stroke-width="2"/></svg>'}
// The notes picker: tap families to open them and notes to add them; set how strong each one was.
function openNotesPicker(entry){const d=$('vd'),sel=flMap(entry?flOf(entry):LFL.slice());
  $('vd-in').innerHTML='<div class="vd-head" style="--c:#C4473F"><button class="vd-close" id="vd-x" aria-label="Done">✕</button><span class="pill"><i style="background:#C4473F"></i>Tasting notes</span>'+
    '<h2 id="vd-title">'+(entry&&entry.coffee?esc(entry.coffee):'What did you taste?')+'</h2><p class="hint" style="margin:0">Start in the middle: tap a family to open it, then tap the notes you taste. Tap a note again to remove it.</p></div>'+
    '<div class="vd-body fl-pick"><input type="search" id="fl-q" placeholder="Find a note, e.g. jasmine" aria-label="Find a flavour note" style="width:100%"><div class="chips fw-res" id="fl-res"></div>'+
    '<div class="fw-box" id="fl-box"></div><div class="fl-sel" id="fl-sel"></div><div class="actions"><button type="button" class="btn" id="fl-done">Done</button><button type="button" class="btn ghost" id="fl-clear">Clear all</button></div></div>';
  const list=()=>{$('fl-sel').innerHTML=sel.size?[...sel].map(([id,v])=>{const n=FW.byId[id];return'<div class="fl-selrow"><i style="background:'+n.c+'"></i><span><b>'+esc(n.n)+'</b> <small class="hint">'+esc(n.parent?n.parent.n:'')+'</small></span>'+
      '<div class="fl-lv" role="group" aria-label="How strong">'+[1,2,3].map(k=>'<button type="button" data-lv="'+k+'" data-id="'+id+'" aria-pressed="'+(v===k)+'">'+FL_LV[k]+'</button>').join('')+'</div><button type="button" class="x" data-rm="'+id+'" aria-label="Remove '+esc(n.n)+'">✕</button></div>'}).join(''):'<p class="hint" style="margin:0">No notes yet.</p>'};
  const W=makeWheel($('fl-box'),{mode:'pick',sel,center:'Your cup',hint:sel.size?'tap to add':'tap a colour',label:'Flavour wheel: tap the notes you taste',onChange:()=>list()});list();
  const res=$('fl-res');$('fl-q').oninput=()=>{const q=fold($('fl-q').value.trim());res.innerHTML=q?FW.all.filter(n=>fold(n.n).includes(q)).slice(0,8).map(n=>'<button type="button" class="chip" data-fa="'+n.id+'"><i class="dot" style="background:'+n.c+'"></i>'+esc(n.n)+(n.parent?' <small>'+esc(n.parent.n)+'</small>':'')+'</button>').join(''):''};
  d.querySelector('.vd-body').onclick=e=>{const a=e.target.closest('[data-fa]'),lv=e.target.closest('[data-lv]'),rm=e.target.closest('[data-rm]');
    if(a){const n=FW.byId[a.dataset.fa];if(n.leaf){if(!sel.has(n.id))sel.set(n.id,2);W.zoom(n.parent&&n.parent.id)}else W.zoom(n.id);W.redraw();list();$('fl-q').value='';res.innerHTML='';return}
    if(lv){sel.set(lv.dataset.id,+lv.dataset.lv);list();W.redraw();return}
    if(rm){sel.delete(rm.dataset.rm);list();W.redraw();return}
    if(e.target.closest('#fl-clear')){if(!sel.size||confirm('Remove all the notes?')){sel.clear();list();W.redraw()}return}
    if(e.target.closest('#fl-done'))d.close()};
  $('vd-x').onclick=()=>d.close();
  // Whatever you leave the sheet with (Done, the cross or back) is kept.
  d.addEventListener('close',()=>{const fl=[...sel];if(entry){entry.fl=fl;save('bb-log',LOG);queue('put',entry.id,entry);renderLog();toast(fl.length?'Flavour notes saved':'Flavour notes removed')}else{LFL=fl;renderFlForm()}},{once:true});
  showDlg(d);d.scrollTop=0}
// A brew's flavour profile, large: zoom into a family to read it, download it as an image.
function openProfile(title,sub,fl,entry){const d=$('vd');
  $('vd-in').innerHTML='<div class="vd-head" style="--c:#C4473F"><button class="vd-close" id="vd-x" aria-label="Close">✕</button><span class="pill"><i style="background:#C4473F"></i>Flavour profile</span>'+
    '<h2 id="vd-title">'+esc(title)+'</h2>'+(sub?'<p class="hint" style="margin:0">'+esc(sub)+'</p>':'')+'</div><div class="vd-body"><div class="fw-box" id="fp-box" style="max-width:460px"></div>'+
    '<div class="chips" style="margin-top:12px">'+flChips(fl)+'</div><div class="actions"><button type="button" class="btn" id="fp-dl">Download image</button>'+(entry?'<button type="button" class="btn ghost" id="fp-edit">Edit notes</button>':'')+'</div></div>';
  makeWheel($('fp-box'),{mode:'profile',sel:flMap(fl),center:'Profile',hint:'tap a family',label:'Flavour profile of '+title});
  $('vd-x').onclick=()=>d.close();
  $('fp-dl').onclick=()=>fwExport({title,sub,mode:'profile',sel:flMap(fl),notes:fl,center:'Flavour',centerSub:'profile'},fname(title)+'-flavour-profile');
  if(entry)$('fp-edit').onclick=()=>{d.close();setTimeout(()=>openNotesPicker(entry),320)};
  showDlg(d);d.scrollTop=0}
// Your palate: every note across your brews, the strength adding up.
function palate(){const sc=new Map();let n=0;for(const l of LOG){const fl=flOf(l);if(!fl.length)continue;n++;fl.forEach(([id,v])=>sc.set(id,(sc.get(id)||0)+v))}
  if(!n)return null;const max=Math.max(...sc.values()),fl=[...sc].sort((a,b)=>b[1]-a[1]).map(([id,v])=>[id,Math.max(1,Math.ceil(3*v/max))]);
  const cats=new Map();sc.forEach((v,id)=>{const c=FW.byId[id].cat.n;cats.set(c,(cats.get(c)||0)+v)});
  return{n,fl,top:[...cats].sort((a,b)=>b[1]-a[1]).slice(0,2).map(c=>c[0].toLowerCase())}}
