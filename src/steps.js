/* ================= STEPS AS A TIMELINE ================= */
// A recipe's steps stay plain strings ("0:45 pour to 150g."), so recipes, sharing and the timer are unchanged. These
// read them as a timeline: what kind of move each step is, how the water builds over time, and an editor for them.
const SK=[
  ['bloom',/\bbloom/i,'Bloom','M12 3.5c3.3 4.2 6 7.3 6 10.5a6 6 0 0 1-12 0c0-3.2 2.7-6.3 6-10.5z M9.2 14.5a2.8 2.8 0 0 0 2.8 2.8'],
  ['pour',/\bpour|\badd\b.*\bwater|\bfill\b|\btop (?:up|off)\b/i,'Pour','M6 19.5h7.5a1 1 0 0 0 1-1.1L13.6 11H5.9L5 18.4a1 1 0 0 0 1 1.1z M7.8 11V8.6h4V11 M14 13.2c2.6-.3 3.8-2.6 5-5.2 M19 8l1.8-.6 M5.6 13.2C3.6 13 3.4 16 5.2 16.4'],
  ['swirl',/\bswirl|\brao\b|\bspin\b/i,'Swirl','M19.5 12a7.5 7.5 0 1 1-2.2-5.3 M19.5 4.5v3.7h-3.7 M14.5 12a2.5 2.5 0 1 1-2.5-2.5'],
  ['stir',/\bstir|\bbreak the crust|\bagitat/i,'Stir','M17.6 3.4a2 2 0 0 1 2.8 2.8l-2 2a2 2 0 0 1-2.8-2.8z M15.6 8.4 7 17 M4 20.5c2.5 1 5.5 1 8 0 M3.5 17.5c.8.7 1.8 1.1 2.8 1.3'],
  ['valve',/\bvalve|\bswitch\b|\bon a cup|\bplace (?:it )?on\b/i,'Valve','M8 4h8 M12 4v3 M6.5 7h11v4h-11z M12 11v2.5 M12 16.5v.5 M12 19.5v.5'],
  ['press',/\bpress|\bplunge|\bflip\b|\binvert/i,'Press','M7 3.5h10 M12 3.5v7 M7.5 10.5h9 M6.5 10.5l1.2 9a1 1 0 0 0 1 .9h6.6a1 1 0 0 0 1-.9l1.2-9'],
  ['steep',/\bsteep|\bwait|\brest\b|\blet it\b(?!.*drain)/i,'Wait','M12 7.5V12l3 2 M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z'],
  ['ice',/\bice\b/i,'Ice','M4.5 8 12 4l7.5 4v8L12 20l-7.5-4z M4.5 8 12 12l7.5-4 M12 12v8'],
  ['prep',/\brinse|\bpreheat|\bwell in|\bgrind\b|\bweigh|\bheat\b/i,'Prep','M4.5 11h10v5.5a3.5 3.5 0 0 1-3.5 3.5h-3a3.5 3.5 0 0 1-3.5-3.5z M14.5 12.5h1.5a2.2 2.2 0 0 1 0 4.4h-1.5 M8 8c0-1.2 1-1.6 1-3 M11.5 8c0-1.2 1-1.6 1-3'],
  ['end',/\bfinish|\bdrawdown|\bdrain|\bremove|\bserve|\bdone\b|\bdecant|\bpour (?:it )?into/i,'Finish','M5 12.5l4.2 4.2L19 7']];
// End wins over pour ("pour into cups"), bloom over pour ("pour 50g, bloom").
const stepKind=s=>{const x=String(s).replace(/^\s*\d+:\d\d\s*/,'');for(const k of ['bloom','end','swirl','stir','valve','press','ice'])if(SK.find(z=>z[0]===k)[1].test(x))return k;
  for(const [k,re] of SK)if(re.test(x))return k;return 'note'};
const SKICO=k=>{const z=SK.find(x=>x[0]===k);return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(z?z[3]:'M6 12h12 M12 6v12')+'"/></svg>'};
const SKNAME=k=>{const z=SK.find(x=>x[0]===k);return z?z[2]:'Note'};

// How the water builds: [time, grams on the scale] at the start and end of each pour. Pours take about 10 s, or run
// to the next step when that comes sooner. Null when the steps don't say how much is poured, or when.
// Steps written without a time ("when the bed has drained, pour 60g") get one estimated from the recipe's own pace (its
// usual gap between timed steps), and one step can hold several pours ("then 60g (to 240g), then 60g (to 300g)").
// Estimated times are marked, so the chart's clock reads "~3:00".
function pourCurve(steps,water){const pts=[[0,0]],dots=[];let lvl=0,any=false,t=0,est=false;
  const own=steps.map(s=>{const m=/^\s*(\d+):(\d\d)/.exec(s)||/(?:^|[\s(])(\d+):(\d\d)(?![\d:])/.exec(s);return m?+m[1]*60+ +m[2]:null}),tt=own.filter(x=>x!=null),
    gaps=tt.slice(1).map((x,i)=>x-tt[i]).filter(g=>g>0).sort((a,b)=>a-b),gap=gaps.length?gaps[gaps.length>>1]:35;
  // Pours with no time of their own ("when the bed nearly drains, pour 60g") that sit before a timed step share the time
  // up to it evenly, the last drawdown included; after the last time only a real pour moves the clock, at the recipe's
  // pace (30 s at most). Other steps ("open the valve", "put the lid on") come as the pour before them finishes.
  const isPour=j=>{const x=String(steps[j]).replace(/^\s*\d+:\d\d\s*/,'');return own[j]==null&&j>0&&(/(?<!\d\s?)\b(?:to|until)\s+\d{2,4}\s?g\b/i.test(x)||!!pourOf(x)||/\b(pour|repeat|add)\b/i.test(x))};
  const runGap=i=>{let a=i;while(a>0&&own[a]==null)a--;let b=i;while(b<steps.length&&own[b]==null)b++;if(own[a]==null)return gap;if(b>=steps.length)return Math.min(gap,30);
    let n=0;for(let j=a+1;j<b;j++)if(isPour(j))n++;const g=(own[b]-own[a])/(n+1);return g>0?Math.round(g/5)*5||g:gap};
  steps.forEach((s,i)=>{const x=String(s).replace(/^\s*\d+:\d\d\s*/,'');
    // Every pour in the step: "to 240g" targets, or "pour 60g" amounts when there are none.
    const tos=[...x.matchAll(/(?<!\d\s?)\b(?:to|until)\s+(\d{2,4})\s?g\b/gi)].map(m=>+m[1]),p=pourOf(x),pours=tos.length?tos.map(v=>({to:v})):p?[p]:[];
    // After the last time, only a real pour (with grams) moves the clock: "pour over ice" or "pour slowly" doesn't.
    const later=own.slice(i+1).some(v=>v!=null),untimed=own[i]==null&&i>0&&(pours.length||(later&&/\b(pour|repeat|add)\b/i.test(x)));
    if(own[i]!=null)t=Math.max(t,own[i]);else if(untimed){t+=runGap(i);est=true}
    // A step with no time and no pour ("stir, then swirl") comes after the last pour has finished, not at its start.
    let st=t;if(own[i]==null&&!pours.length&&pts.length>1)st=Math.max(st,pts[pts.length-1][0]);dots.push({t:st,g:lvl,k:stepKind(s),e:own[i]==null&&own.slice(0,i).some(v=>v!=null)});
    pours.forEach((q,n)=>{const to=q.to||(q.add?lvl+q.add:null);if(to==null||to<=lvl)return;if(n){st+=gap;est=own[i]==null||est}
      const next=own.slice(i+1).find(v=>v!=null&&v>st),dur=Math.max(4,Math.min(next!=null?next-st:12,Math.max(8,(to-lvl)/5),gap*.6));
      pts.push([st,lvl],[st+dur,to]);lvl=to;any=true;t=Math.max(t,st)});
    if(pours.length>1&&own[i]==null)t=st});
  if(!any)return null;const end=Math.max(t,pts[pts.length-1][0],...dots.map(d=>d.t));pts.push([end,lvl]);
  // Every dot sits on the line: the water level at its moment.
  const at=x=>{for(let j=1;j<pts.length;j++){const [t0,g0]=pts[j-1],[t1,g1]=pts[j];if(x<=t1)return t1>t0?g0+(g1-g0)*Math.max(0,x-t0)/(t1-t0):g1}return lvl};
  dots.forEach(d=>{d.g=at(d.t)});
  return{pts,dots,end:Math.max(end,1),top:Math.max(lvl,water||0,1),lvl,est}}
// The curve as a small chart: the water rising pour by pour, a dot for each step coloured by its kind.
// Each chart's gradient gets its own id: several can be on screen at once (the dial-in and an open recipe).
let PGN=0;
function pourGraph(steps,water,opt){opt=opt||{};const c=pourCurve(steps,water);if(!c)return '';const gid='pgf'+(++PGN);const W=320,H=opt.h||92,px=12,py=12,X=t=>px+t/c.end*(W-2*px),Y=g=>H-py-g/c.top*(H-2*py);
  const line=c.pts.map(([t,g],i)=>(i?'L':'M')+X(t).toFixed(1)+' '+Y(g).toFixed(1)).join(' '),area=line+' L'+X(c.pts[c.pts.length-1][0]).toFixed(1)+' '+(H-py)+' L'+X(0)+' '+(H-py)+'Z';
  // A step's dot sits where it starts: a pour's at the level it pours from. Steps before the first time (rinse the paper)
  // aren't on the clock.
  const dots=c.dots.filter((d,i)=>i||/^\s*\d+:\d\d/.test(steps[0])).map(d=>'<circle class="pg-d k-'+d.k+'" cx="'+X(d.t).toFixed(1)+'" cy="'+Y(d.g).toFixed(1)+'" r="4"/>').join('');
  const goal=water&&Math.abs(c.lvl-water)>2?'<line class="pg-goal" x1="'+px+'" x2="'+(W-px)+'" y1="'+Y(water).toFixed(1)+'" y2="'+Y(water).toFixed(1)+'"/>':'';
  return '<figure class="pgraph"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Water over time: '+c.lvl+' g by '+mmss(c.end)+'">'+
    '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cherry)" stop-opacity=".32"/><stop offset="1" stop-color="var(--cherry)" stop-opacity="0"/></linearGradient></defs>'+
    goal+'<path class="pg-a" d="'+area+'" fill="url(#'+gid+')"/><path class="pg-l" d="'+line+'"/>'+dots+'</svg>'+
    '<figcaption><span>0:00</span><b>'+c.lvl+' g</b><span>'+(c.est?'~':'')+mmss(c.end)+'</span></figcaption></figure>'}

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
    el.querySelector('.se-graph').innerHTML=pourGraph(v,o.water);
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
