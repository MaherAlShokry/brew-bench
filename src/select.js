/* ================= DROPDOWNS ================= */
// Every <select> keeps doing its job (value, change events, labels), but its list opens in the app's own design: a sheet
// that slides up on phones and a card under the field on larger screens, with groups, a tick on the current choice and
// search for long lists. Each select sits in a wrapper that takes the tap, so the phone's own picker never appears.
const SEL_SEARCH_AT=12;
function selLabel(s){const l=s.id&&document.querySelector('label[for="'+s.id+'"]');
  return(l?l.textContent:s.getAttribute('aria-label')||'Choose').replace(/\s+/g,' ').trim()}
function enhanceSelect(s){if(s.dataset.ui||s.multiple||s.size>1||s.closest('#selsheet'))return;s.dataset.ui=1;
  const w=document.createElement('span');w.className='selw';s.parentNode.insertBefore(w,s);w.appendChild(s);
  s.tabIndex=0;
  w.addEventListener('click',e=>{if(s.disabled)return;e.preventDefault();openSelect(s)});
  s.addEventListener('keydown',e=>{if(['Enter',' ','ArrowDown','ArrowUp'].includes(e.key)||(e.altKey&&e.key==='ArrowDown')){e.preventDefault();openSelect(s)}});
  // Some browsers still open their list on mouse down; stop it here.
  s.addEventListener('mousedown',e=>{e.preventDefault();s.focus()})}
function openSelect(s){const d=$('selsheet'),opts=[...s.options],long=opts.length>=SEL_SEARCH_AT,cur=s.value;
  const row=o=>'<button type="button" role="option" class="selopt" data-v="'+esc(o.value)+'" aria-selected="'+(o.value===cur&&o.selected)+'"'+(o.disabled?' disabled':'')+'><span>'+esc(o.textContent)+'</span><i aria-hidden="true">✓</i></button>';
  let body='';for(const k of s.children){if(k.tagName==='OPTGROUP'){const kids=[...k.children].filter(o=>o.tagName==='OPTION');if(kids.length)body+='<div class="selgrp" role="group" aria-label="'+esc(k.label)+'"><h4>'+esc(k.label)+'</h4>'+kids.map(row).join('')+'</div>'}else if(k.tagName==='OPTION')body+=row(k)}
  $('sel-in').innerHTML='<div class="selhead"><div class="grab"></div><h3 id="sel-title">'+esc(selLabel(s))+'</h3><button type="button" class="vd-close" id="sel-x" aria-label="Close">✕</button></div>'+
    (long?'<input type="search" id="sel-q" placeholder="Search" aria-label="Search the list" autocomplete="off">':'')+'<div class="sellist" role="listbox" aria-labelledby="sel-title">'+body+'</div><p class="hint selnone" hidden>Nothing matches.</p>';
  const narrow=matchMedia('(max-width:759px)').matches;d.classList.toggle('pop',!narrow);
  if(!narrow){const r=s.getBoundingClientRect(),W=Math.max(r.width,260),below=innerHeight-r.bottom,up=below<320&&r.top>below;
    Object.assign(d.style,{left:Math.min(Math.max(8,r.left),innerWidth-W-8)+'px',width:W+'px',top:up?'auto':(r.bottom+6)+'px',bottom:up?(innerHeight-r.top+6)+'px':'auto',maxHeight:Math.max(220,(up?r.top:below)-24)+'px'})}
  else Object.assign(d.style,{left:'',width:'',top:'',bottom:'',maxHeight:''});
  const pick=v=>{if(s.value!==v){s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))}d.close();setTimeout(()=>s.focus({preventScroll:true}),0)};
  d.querySelector('.sellist').onclick=e=>{const b=e.target.closest('.selopt');if(b&&!b.disabled)pick(b.dataset.v)};
  $('sel-x').onclick=()=>d.close();
  const q=$('sel-q');if(q)q.oninput=()=>{const t=fold(q.value.trim());let n=0;d.querySelectorAll('.selopt').forEach(b=>{const hit=!t||fold(b.textContent).includes(t);b.hidden=!hit;if(hit)n++});
    d.querySelectorAll('.selgrp').forEach(g=>g.hidden=![...g.querySelectorAll('.selopt')].some(b=>!b.hidden));d.querySelector('.selnone').hidden=n>0};
  // Arrow keys move through the choices; typing jumps to the search.
  d.onkeydown=e=>{const all=[...d.querySelectorAll('.selopt:not([hidden]):not([disabled])')],i=all.indexOf(document.activeElement);
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=all[Math.max(0,Math.min(all.length-1,i<0?0:i+(e.key==='ArrowDown'?1:-1)))];if(n)n.focus()}
    else if(e.key==='Enter'&&document.activeElement===q){const f=all[0];if(f){e.preventDefault();pick(f.dataset.v)}}
    else if(q&&e.key.length===1&&document.activeElement!==q&&!e.ctrlKey&&!e.metaKey){q.focus()}};
  showDlg(d);const on=d.querySelector('.selopt[aria-selected="true"]')||d.querySelector('.selopt');
  if(on)on.scrollIntoView({block:'center'});
  // Keyboard users land on the current choice; on a phone nothing gets a focus ring until you use it.
  if(on&&!narrow)on.focus({preventScroll:true});else{const c=$('sel-in');c.tabIndex=-1;c.focus({preventScroll:true})}}
// Selects already on the page, and any drawn later.
document.querySelectorAll('select').forEach(enhanceSelect);
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1){if(n.tagName==='SELECT')enhanceSelect(n);else n.querySelectorAll&&n.querySelectorAll('select').forEach(enhanceSelect)}}).observe(document.body,{childList:true,subtree:true});
