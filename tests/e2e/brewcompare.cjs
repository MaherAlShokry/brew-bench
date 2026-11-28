// Three tidy-ups: (1) a champion's recipe shows just the champion's name where the competition is a tag beside it (the
// list, the recipe page, the timer) and keeps its full name as its identity; (2) the recipe page's header carries the
// brewer next to the author, with no loose brewer line below; (3) two brews compare side by side from the Brew log.
{const o=require('path').join(__dirname,'out');require('fs').mkdirSync(o,{recursive:true});process.chdir(o)}
const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
const ok=(n,v,x)=>console.log((v?'ok   ':'FAIL ')+n+(v||x===undefined?'':'  ('+JSON.stringify(x)+')'));const errs=[];
const c=await b.newContext({...devices['Pixel 7']});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.addInitScript(()=>sessionStorage.setItem('bb-splashed','1'));
await p.goto('http://localhost:8099/index.html');await p.evaluate(require('./seedbig.cjs'));await p.reload();await p.waitForFunction(()=>window.BEANS_OK,null,{timeout:20000});await p.waitForTimeout(1200);
// 1 and 2.
const ch=await p.evaluate(async()=>{const w=t=>new Promise(r=>setTimeout(r,t));const i=RECIPES.findIndex(r=>r.champ&&/^Chad Wang/.test(r.name));const r=RECIPES[i];
  showTab('recipes');await w(500);RF=['champ'];renderRecipes();await w(300);const row=[...document.querySelectorAll('#recipes .rrow')].find(a=>a.querySelector('[data-open="'+i+'"]'));
  const o={full:r.name,key:rkey(r),list:row&&row.querySelector('.rr-t b').textContent,tag:row&&row.querySelector('.rr-badge.champ').getAttribute('aria-label')};
  openRecipe(i);await w(500);o.title=$('vd-title').textContent;o.pill=document.querySelector('#vd .vd-head .pill').textContent;o.by=document.querySelector('#vd .vd-by').textContent;
  const u=RECIPES.findIndex(x=>x.name==='The Ultimate V60');openRecipe(u);await w(500);o.uby=document.querySelector('#vd .vd-by').textContent;o.loose=[...document.querySelectorAll('#rs-body p.hint')].some(x=>/Cone dripper/.test(x.textContent));
  const k=RECIPES.findIndex(x=>x.name==='Tetsu Kasuya 4:6');o.own=RECIPES[k].champ?rTitle(RECIPES[k]):'not a champion';openRecipe(k);await w(400);o.ownBy=document.querySelector('#vd .vd-by').textContent;
  openTimerNow(i);await w(400);o.timer=$('tm-title').textContent;$('timer').close();$('vd').close();RF=[];renderRecipes();return o});
ok('a champion\'s recipe: just the name in the list, a trophy badge beside it',ch.list==='Chad Wang'&&ch.tag==='Brewers Cup 2017 champion',ch);
ok('…and on its page and in the timer, its full name kept as its identity',ch.title==='Chad Wang'&&/Brewers Cup 2017/.test(ch.pill)&&ch.timer==='Chad Wang'&&ch.full==='Chad Wang (Brewers Cup 2017)'&&ch.key==='r:chad-wang-brewers-cup-2017',ch);
ok('a champion\'s own named method keeps its name and author',ch.own==='Tetsu Kasuya 4:6'&&/^Tetsu Kasuya, 2016 World Brewers Cup champion · Hario V60$/.test(ch.ownBy),ch);
ok('the header says who and which brewer; no loose brewer line',/^2017 World Brewers Cup champion · Hario V60$/.test(ch.by)&&/^James Hoffmann · Hario V60$/.test(ch.uby)&&!ch.loose,ch);
// 3. Compare two brews.
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(500);await p.evaluate(()=>document.querySelector('#settings [data-go="log"]').click());await p.waitForTimeout(1200);
await p.evaluate(()=>document.querySelector('#l-list [data-lcmp]').click());await p.waitForTimeout(700);
const pk=await p.evaluate(()=>({open:$('vd').open,h:[...document.querySelectorAll('#bcp-list .rcp-h')].map(x=>x.textContent),first:(document.querySelector('#bcp-list [data-bcp] b')||{}).textContent}));
ok('compare: pick another brew, the same coffee first',pk.open&&pk.h[0]==='Same coffee'&&/^[A-Z][a-z]{2} \d/.test(pk.first||''),pk);
await p.evaluate(()=>{const q=$('bcp-q');q.value='zzzz';q.dispatchEvent(new Event('input'))});const none=await p.evaluate(()=>$('bcp-list').textContent);
await p.evaluate(()=>{const q=$('bcp-q');q.value='';q.dispatchEvent(new Event('input'))});
ok('…search narrows the list',/No brew matches/.test(none),none);
await p.evaluate(()=>document.querySelector('#bcp-list [data-bcp]').click());await p.waitForTimeout(700);
const cm=await p.evaluate(()=>({cards:[...document.querySelectorAll('#vd .bc-card')].map(c=>c.querySelector('.bc-mark').textContent),heads:[...document.querySelectorAll('#vd .bc-h')].map(h=>h.textContent),
  changed:[...document.querySelectorAll('#vd .bc-row')].map(r=>[r.querySelector('.bc-k').textContent,...[...r.querySelectorAll('.bc-val')].map(v=>v.textContent)]),
  all:[...document.querySelectorAll('#vd .bc-row .bc-k, #vd .bc-same em')].map(e=>e.textContent)}));
ok('…then side by side: the two brews as A and B, what changed first (both sides filled), what one noted, what stayed the same',cm.cards.join()==='A,B'&&cm.heads[0]==='What changed'&&cm.changed.length>0&&cm.changed.every(r=>r.length===3&&r[1]!=='Not noted'&&r[2]!=='Not noted'&&r[1]!==r[2])&&['Recipe','Brewer','Coffee','Rating'].every(k=>cm.all.includes(k)),cm);
await p.evaluate(()=>$('bc-back').click());await p.waitForTimeout(500);ok('…and back to pick another',await p.evaluate(()=>!!$('bcp-list')),null);
await p.evaluate(()=>$('vd').close());
ok('no page errors',!errs.length,errs);await b.close()})();
