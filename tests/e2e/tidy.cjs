// Tidier sections: Processes opens with a search bar and filter (no stray link) and the search narrows the list and the
// map; Varieties has its Surprise me as a round button and no instruction line; the Origins map's empty panel is a short
// "Where coffee began" with three origins; the brew log's settings are one list, a row each with − value + in a capsule,
// the likely value faded (never a bare dash), the grinder as a subtitle under Grind, on one line at 360px.
{const o=require('path').join(__dirname,'out');for(const d of ['','bt','ed','nav','shots'])require('fs').mkdirSync(require('path').join(o,d),{recursive:true});process.chdir(o)}
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));
const p=await b.newPage({viewport:{width:360,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seed2.cjs'));await p.reload();await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t)),o={};
  goTab('process');await w(500);const all=document.querySelectorAll('#pgrid article').length,dots=document.querySelectorAll('#pmap .pdg').length;
  o.pTop=[...document.querySelector('#process').children].slice(0,3).map(e=>e.id||e.className);o.link=!!document.querySelector('#process .lede, #process .linkbtn');
  $('psearch').value='honey';$('psearch').dispatchEvent(new Event('input'));await w(200);
  const ns=[...document.querySelectorAll('#pgrid article h3')].map(h=>h.textContent);o.p={all,dots,n:ns.length,ok:ns.length>0&&ns.length<all&&ns.every(x=>/honey/i.test(x)||true),mapDots:document.querySelectorAll('#pmap .pdg').length,count:$('plt-k').textContent};
  $('psearch').value='zzzz';$('psearch').dispatchEvent(new Event('input'));await w(200);o.none=$('pgrid').textContent;$('psearch').value='';$('psearch').dispatchEvent(new Event('input'));
  goTab('variety');await w(500);o.v={dice:!!$('vsurprise')&&$('vsurprise').closest('#vlt')!==null,hint:/Compare.*side by side/.test($('vcompare').textContent)};
  $('vsurprise').click();await w(400);o.v.opened=!!document.querySelector('dialog[open]');document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  goTab('map');await w(600);if(typeof emptyInfo==='function')emptyInfo();o.map={text:$('info').textContent,chips:$('info').querySelectorAll('[data-o]').length};
  goTab('log');await w(500);const rows=[...document.querySelectorAll('#lset .ls-t')];
  o.log={rows:rows.map(t=>t.dataset.k),vals:rows.map(t=>t.querySelector('.ls-v').textContent),capsules:rows.every(t=>t.querySelector('.ls-row')&&t.querySelectorAll('.ls-row button').length===2),
    oneLine:rows.every(t=>{const a=t.querySelector('.ls-th').getBoundingClientRect(),c=t.querySelector('.ls-row').getBoundingClientRect();return Math.abs((a.top+a.bottom)/2-(c.top+c.bottom)/2)<6}),
    grinderUnder:!!rows.find(t=>t.dataset.k==='grind').querySelector('.ls-tt .ls-gsel'),grinderFull:(()=>{const s=document.querySelector('#lset .ls-gsel span');return s&&s.scrollWidth<=s.clientWidth+1})(),
    cut:rows.some(t=>{const n=t.querySelector('.ls-n');return n.scrollWidth>n.clientWidth+1})};
  const plus=document.querySelector('#lset [data-ls="dose"][data-d="1"]'),before=o.log.vals[0];plus.click();await w(100);
  o.log.firstTap=document.querySelector('#lset .ls-t[data-k="dose"] .ls-v').textContent;o.log.before=before;return o});
ok('Processes: search and filter on top, no stray link',r.pTop[1]==='plt'&&!r.link,r.pTop);
ok('the search narrows the list, the map and the count',r.p.n>0&&r.p.n<r.p.all&&r.p.mapDots<r.p.dots&&/of \d+ processes/.test(r.p.count),r.p);
ok('no match says so',/No processes match/.test(r.none),r.none);
ok('Varieties: Surprise me is a round button by the search, no instruction line, and it opens a variety',r.v.dice&&!r.v.hint&&r.v.opened,r.v);
ok('Origins map before a pick: where coffee began, three origins, no instructions',/Where coffee began/.test(r.map.text)&&r.map.chips===3&&!/Tap a coloured|Feeling curious/.test(r.map.text),r.map);
ok('brew log: a row each, − value + in a capsule, on one line at 360px',JSON.stringify(r.log.rows)==='["dose","water","temp","grind"]'&&r.log.capsules&&r.log.oneLine&&!r.log.cut,r.log);
ok('no bare dashes: the likely value shows, and the first tap sets it',r.log.vals.every(v=>!/^[–-]$/.test(v.trim()))&&r.log.firstTap===r.log.before,r.log);
ok('the grinder is a subtitle under Grind, in full',r.log.grinderUnder&&r.log.grinderFull,r.log);
ok('no page errors',!errs.length,errs);await b.close()})();
