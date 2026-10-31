/* ================= STEPS AS A TIMELINE ================= */
// A recipe's steps stay plain strings ("0:45 pour to 150g."), so recipes, sharing and the timer are unchanged. These
// read them as a timeline: what kind of move each step is, how the water builds over time, and an editor for them.
const SK=[
  ['bloom',/\bbloom/i,'Bloom','M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z M9 15a3 3 0 0 0 3 3'],
  ['pour',/\bpour|\badd\b.*\bwater|\bfill\b|\btop (?:up|off)\b/i,'Pour','M5 7h9l-1 4h-7z M14 8l5-3 M9 11v2 M9 15v1 M9 18v1'],
  ['swirl',/\bswirl|\brao\b|\bspin\b/i,'Swirl','M12 5a7 7 0 1 1-7 7 M5 12a4 4 0 1 0 4-4'],
  ['stir',/\bstir|\bbreak the crust|\bagitat/i,'Stir','M15 3l-6 18 M7 14c2 2 8 2 10 0'],
  ['valve',/\bvalve|\bswitch\b|\bon a cup|\bplace (?:it )?on\b/i,'Valve','M12 4v6 M8 10h8 M6 14h12v4H6z'],
  ['press',/\bpress|\bplunge|\bflip\b|\binvert/i,'Press','M7 4h10 M12 4v9 M6 13h12 M8 17h8 M10 20h4'],
  ['steep',/\bsteep|\bwait|\brest\b|\blet it\b(?!.*drain)/i,'Wait','M12 7v5l3 2 M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z'],
  ['ice',/\bice\b/i,'Ice','M12 3v18 M4.5 7.5l15 9 M19.5 7.5l-15 9'],
  ['prep',/\brinse|\bpreheat|\bwell in|\bgrind\b|\bweigh|\bheat\b/i,'Prep','M5 18h14 M7 18V9h10v9 M9 6c0-1 1-2 1-3 M13 6c0-1 1-2 1-3'],
  ['end',/\bfinish|\bdrawdown|\bdrain|\bremove|\bserve|\bdone\b|\bdecant|\bpour (?:it )?into/i,'Finish','M5 12l4 4 10-10']];
// End wins over pour ("pour into cups"), bloom over pour ("pour 50g, bloom").
const stepKind=s=>{const x=String(s).replace(/^\s*\d+:\d\d\s*/,'');for(const k of ['bloom','end','swirl','stir','valve','press','ice'])if(SK.find(z=>z[0]===k)[1].test(x))return k;
  for(const [k,re] of SK)if(re.test(x))return k;return 'note'};
const SKICO=k=>{const z=SK.find(x=>x[0]===k);return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(z?z[3]:'M6 12h12 M12 6v12')+'"/></svg>'};
const SKNAME=k=>{const z=SK.find(x=>x[0]===k);return z?z[2]:'Note'};

// How the water builds: [time, grams on the scale] at the start and end of each pour. Pours take about 10 s, or run
// to the next step when that comes sooner. Null when the steps don't say how much is poured, or when.
function pourCurve(steps,water){const ev=parseSteps(steps),pts=[[0,0]];let lvl=0,any=false,end=0;
  ev.forEach((e,i)=>{if(e.t<0)return;end=Math.max(end,e.t);const p=pourOf(e.s);if(!p)return;const to=p.to||(p.add?lvl+p.add:null);if(to==null||to<=lvl)return;
    const nx=ev.slice(i+1).find(x=>x.t>e.t),dur=Math.max(4,Math.min(nx?nx.t-e.t:12,Math.max(8,(to-lvl)/5)));
    pts.push([e.t,lvl],[e.t+dur,to]);lvl=to;any=true;end=Math.max(end,e.t+dur)});
  if(!any)return null;const last=ev.filter(e=>e.t>=0).pop();if(last)end=Math.max(end,last.t);pts.push([Math.max(end,pts[pts.length-1][0]),lvl]);
  return{pts,end:Math.max(end,1),top:Math.max(lvl,water||0,1),lvl}}
// The curve as a small chart: the water rising pour by pour, a dot for each step coloured by its kind.
function pourGraph(steps,water,opt){opt=opt||{};const c=pourCurve(steps,water);if(!c)return '';const W=320,H=opt.h||92,px=12,py=12,X=t=>px+t/c.end*(W-2*px),Y=g=>H-py-g/c.top*(H-2*py);
  const line=c.pts.map(([t,g],i)=>(i?'L':'M')+X(t).toFixed(1)+' '+Y(g).toFixed(1)).join(' '),area=line+' L'+X(c.pts[c.pts.length-1][0]).toFixed(1)+' '+(H-py)+' L'+X(0)+' '+(H-py)+'Z';
  const ev=parseSteps(steps).filter(e=>e.t>=0);let lvl=0;
  // A step's dot sits where it starts: a pour's at the level it pours from.
  const dots=ev.map(e=>{const y=lvl,p=pourOf(e.s);if(p){const to=p.to||(p.add?lvl+p.add:lvl);lvl=Math.max(lvl,to)}return '<circle class="pg-d k-'+stepKind(e.s)+'" cx="'+X(e.t).toFixed(1)+'" cy="'+Y(y).toFixed(1)+'" r="4"/>'}).join('');
  const goal=water&&Math.abs(c.lvl-water)>2?'<line class="pg-goal" x1="'+px+'" x2="'+(W-px)+'" y1="'+Y(water).toFixed(1)+'" y2="'+Y(water).toFixed(1)+'"/>':'';
  return '<figure class="pgraph"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Water over time: '+c.lvl+' g by '+mmss(c.end)+'">'+
    '<defs><linearGradient id="pgf'+(opt.id||'')+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cherry)" stop-opacity=".32"/><stop offset="1" stop-color="var(--cherry)" stop-opacity="0"/></linearGradient></defs>'+
    goal+'<path class="pg-a" d="'+area+'" fill="url(#pgf'+(opt.id||'')+')"/><path class="pg-l" d="'+line+'"/>'+dots+'</svg>'+
    '<figcaption><span>0:00</span><b>'+c.lvl+' g</b><span>'+mmss(c.end)+'</span></figcaption></figure>'}

// The editor: one row per step on a rail, its time in a pill and what to do beside it, with a button for each kind of
// move to add the next step. stepEditor(el, steps, {water, dose}) returns {value(), set(opts)}.
function stepEditor(el,steps,o){o=Object.assign({water:250,dose:15},o);let rows=(steps.length?steps:['0:00 ']).map(s=>{const m=/^\s*(\d+:\d\d)\s*/.exec(s);return{t:m?m[1]:'',x:m?s.slice(m[0].length):s}});
  const ADD=[['bloom','Bloom'],['pour','Pour'],['swirl','Swirl'],['stir','Stir'],['steep','Wait'],['valve','Valve'],['press','Press'],['end','Finish']];
  el.innerHTML='<div class="se"><div class="se-graph"></div><ol class="se-list"></ol><div class="se-add" role="group" aria-label="Add a step">'+ADD.map(([k,n])=>'<button type="button" class="se-chip k-'+k+'" data-add="'+k+'">'+SKICO(k)+'<span>'+n+'</span></button>').join('')+'</div><p class="se-sum" aria-live="polite"></p></div>';
  const list=el.querySelector('.se-list'),secs=t=>{const m=/^(\d+):(\d\d)$/.exec(t);return m?+m[1]*60+ +m[2]:null};
  const early=i=>!!(rows[i].t&&i&&rows.slice(0,i).some(p=>secs(p.t)!=null&&secs(p.t)>secs(rows[i].t))),val=()=>rows.map(r=>(r.t?r.t+' ':'')+r.x.trim()).filter(s=>s.trim());
  const row=(r,i)=>{const k=stepKind(r.x),bad=early(i);
    return '<li class="se-row k-'+k+'" data-i="'+i+'"><span class="se-dot" title="'+SKNAME(k)+'">'+SKICO(k)+'</span>'+
      '<input class="se-t'+(bad?' bad':'')+'" value="'+esc(r.t)+'" placeholder="–:––" inputmode="numeric" maxlength="5" aria-label="Step '+(i+1)+' time">'+
      '<input class="se-x" value="'+esc(r.x)+'" placeholder="What to do" aria-label="Step '+(i+1)+'">'+
      '<span class="se-ops"><button type="button" class="se-op" data-up="'+i+'" aria-label="Move step '+(i+1)+' up"'+(i?'':' disabled')+'><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>'+
      '<button type="button" class="se-op" data-del="'+i+'" aria-label="Remove step '+(i+1)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span></li>'};
  const sum=()=>{const v=val(),c=pourCurve(v,o.water),last=rows.map(r=>secs(r.t)).filter(x=>x!=null),n=v.length;
    el.querySelector('.se-graph').innerHTML=pourGraph(v,o.water,{id:'ed'});
    const msg=[n+' step'+(n===1?'':'s')];if(last.length)msg.push('ends at '+mmss(Math.max(...last)));
    if(c)msg.push(Math.abs(c.lvl-o.water)<=2?'pours reach the full '+o.water+' g':'pours reach '+c.lvl+' of '+o.water+' g');
    if(rows.some((r,i)=>early(i)))msg.push('a time is earlier than the step before it');
    const p=el.querySelector('.se-sum');p.textContent=capS(msg.join(' · '));p.classList.toggle('warn',!!c&&Math.abs(c.lvl-o.water)>2||/earlier/.test(p.textContent))};
  const draw=focus=>{list.innerHTML=rows.map(row).join('');sum();if(focus!=null){const f=list.querySelector('[data-i="'+focus+'"] .se-x');if(f){f.focus();f.setSelectionRange(f.value.length,f.value.length)}}};
  // Typing keeps focus: only the edited row's icon and the chart change.
  list.oninput=e=>{const li=e.target.closest('.se-row');if(!li)return;const r=rows[+li.dataset.i];
    if(e.target.classList.contains('se-x')){r.x=e.target.value;const k=stepKind(r.x);li.className='se-row k-'+k;const d=li.querySelector('.se-dot');d.innerHTML=SKICO(k);d.title=SKNAME(k)}else r.t=e.target.value.trim();sum()};
  // "45" reads as 0:45 and "130" as 1:30 once you leave the time.
  list.addEventListener('focusout',e=>{if(!e.target.classList.contains('se-t'))return;const r=rows[+e.target.closest('.se-row').dataset.i],v=r.t.replace(/[^\d:]/g,'');
    let t='';if(/^\d+:\d{1,2}$/.test(v)){const [m,s]=v.split(':');t=+m+':'+String(Math.min(59,+s)).padStart(2,'0')}else if(/^\d{1,4}$/.test(v)){const n=+v;t=v.length<=2?(n>=60?Math.floor(n/60)+':'+String(n%60).padStart(2,'0'):'0:'+String(n).padStart(2,'0')):Math.floor(n/100)+':'+String(Math.min(59,n%100)).padStart(2,'0')}
    if(t!==r.t){r.t=t;e.target.value=t}list.querySelectorAll('.se-t').forEach((x,j)=>x.classList.toggle('bad',early(j)));sum()});
  list.onclick=e=>{const u=e.target.closest('[data-up]'),d=e.target.closest('[data-del]');
    if(u){const i=+u.dataset.up;[rows[i-1],rows[i]]=[rows[i],rows[i-1]];draw()}
    if(d){rows.splice(+d.dataset.del,1);if(!rows.length)rows.push({t:'0:00',x:''});draw()}};
  // A new step starts a little after the last one, with words to edit: the next pour aims at the rest of the water.
  el.querySelector('.se-add').onclick=e=>{const b=e.target.closest('[data-add]');if(!b)return;const k=b.dataset.add,ts=rows.map(r=>secs(r.t)).filter(x=>x!=null),last=ts.length?Math.max(...ts):null;
    const c=pourCurve(val(),o.water),lvl=c?c.lvl:0,gap={bloom:0,pour:last===0?40:30,swirl:10,stir:5,steep:30,valve:30,press:30,end:45}[k];
    const t=last==null?0:last+gap,left=Math.max(0,o.water-lvl),valves=rows.filter(r=>/\bclose\b/i.test(r.x)).length-rows.filter(r=>/\bopen\b/i.test(r.x)).length;
    const x={bloom:'pour '+Math.round(o.dose*2.5)+'g, bloom.',pour:left?'pour to '+(left>o.water*0.45?Math.round((lvl+left/2)/5)*5:o.water)+'g.':'pour slowly.',swirl:'swirl gently.',stir:'stir gently.',steep:'let it steep.',
      valve:valves>0?'open the valve.':'close the valve.',press:'press slowly.',end:'finished.'}[k];
    rows.push({t:k==='bloom'&&last==null?'0:00':mmss(t),x});draw(rows.length-1)};
  draw();
  return{value:val,set(n){Object.assign(o,n);sum()}}}
