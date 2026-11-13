// The main flows, used the way a person would.
const {chromium}=require('playwright');const demo=require('./seed2.cjs');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errs=[];const ok=(n,v,x)=>console.log((v?'  ok   ':'  FAIL ')+n+(x!=null?'  ('+x+')':''));
const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block',acceptDownloads:true});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.route(u=>!u.href.startsWith('http://localhost'),r=>r.abort());await p.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'});await p.evaluate(demo);await p.reload({waitUntil:'networkidle'});
// Ratio calculator
const calc=await p.evaluate(()=>{showTab('guide');const out={};for(const k of ['1','2','esp','cold']){document.querySelector('#c-pre [data-v="'+k+'"]').click();out[k]=[...document.querySelectorAll('#c-out > div')].map(d=>d.querySelector('b').textContent+'='+d.querySelector('span').textContent).join(', ')}return out});
ok('1 cup: 15 g at 1:16.5 → 248 g water, 218 g in the cup',/Water=248g/.test(calc['1'])&&/In the cup=218g/.test(calc['1']),calc['1']);
ok('2 cups → 495 g water',/Water=495g/.test(calc['2']),calc['2']);
ok('espresso: 18 g at 1:2 → a 36 g shot, no bloom or 4:6',/Shot weight=36g/.test(calc.esp)&&!/Bloom|4:6/.test(calc.esp),calc.esp);
ok('cold brew: 50 g at 1:8 → 400 g water, steep, no 4:6',/Water=400g/.test(calc.cold)&&/Steep/.test(calc.cold)&&!/4:6/.test(calc.cold),calc.cold);
// Load a recipe into the dial-in
const ld=await p.evaluate(()=>{showTab('recipes');const i=RECIPES.findIndex(r=>r.b==='v60'&&BREWERS[r.b].model);openRecipe(i);const btn=document.querySelector('#vd [data-load]');btn.click();return{rec:S.rec,i,brewer:S.brewer,tab:document.querySelector('main section.on').id}});
ok('recipe loads into the dial-in',ld.rec===ld.i&&ld.tab==='dial',JSON.stringify(ld));
await p.waitForTimeout(500);
// Grinder swap there and back keeps the setting
const sw=await p.evaluate(()=>{const g0=S.grinder,s0=S.setting,other=MYG.find(g=>g!==g0&&canGrind(g,S.brewer));const v=swapGrinder(other);S.grinder=other;S.setting=v;const back=swapGrinder(g0);return{g0,s0,other,v,back}});
ok('switching grinders and back keeps the setting',sw.back===sw.s0,JSON.stringify(sw));await p.evaluate(sw=>{S.grinder=sw.g0;S.setting=sw.s0;render()},sw);
// Timer: total equals the recipe's last step; play and reset work
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(400);
const tm=await p.evaluate(async()=>{const i=RECIPES.findIndex(r=>r.name==='The Ultimate V60')>=0?RECIPES.findIndex(r=>r.name==='The Ultimate V60'):0;openTimer(i);await new Promise(r=>setTimeout(r,300));
  const want=rmeta(RECIPES[i]).time;const tot=TM.total;document.getElementById('tm-go').click();await new Promise(r=>setTimeout(r,1300));const el=TM.el;document.getElementById('tm-reset').click();await new Promise(r=>setTimeout(r,200));return{want,tot,el,after:TM.el}});
ok('timer runs and resets',tm.el>0.8&&tm.after<0.2,JSON.stringify(tm));ok('timer length covers the recipe',tm.tot>=(tm.want||0),tm.tot+' vs last step '+tm.want);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(400);
// Log: add, edit, delete
await p.evaluate(()=>showTab('log'));await p.waitForTimeout(300);const n0=await p.evaluate(()=>LOG.length);
await p.fill('#l-coffee','Audit Kenya');await p.click('#l-stars [data-s="4"]');await p.fill('#l-notes','Juicy');await p.click('#l-save');await p.waitForTimeout(300);
ok('log entry saved',await p.evaluate(n=>LOG.length===n+1&&LOG.some(l=>l.coffee==='Audit Kenya'&&l.stars===4),n0));
const ei=await p.evaluate(()=>LOG.findIndex(l=>l.coffee==='Audit Kenya'));await p.click('[data-edit="'+ei+'"]');await p.waitForTimeout(200);await p.fill('#l-notes','Juicy, edited');await p.click('#l-save');await p.waitForTimeout(300);
ok('log entry edited in place',await p.evaluate(n=>LOG.length===n+1&&LOG.some(l=>l.notes==='Juicy, edited'),n0));
const di=await p.evaluate(()=>LOG.findIndex(l=>l.coffee==='Audit Kenya'));await p.click('[data-del="'+di+'"]');await p.waitForTimeout(500);
ok('log entry deleted',await p.evaluate(n=>LOG.length===n&&!LOG.some(l=>l.coffee==='Audit Kenya'),n0));
// Scan pasted text
await p.evaluate(()=>showTab('scan'));await p.waitForTimeout(300);await p.evaluate(()=>{document.querySelector('#scan-text').closest('details')&&(document.querySelector('#scan-text').closest('details').open=true)});
await p.fill('#scan-text','SPIRIT HUB\nAroma Nativo\nColombia, Huila\nVariety: Aji\nProcess: Hydro Honey\nRoasted 10.10.2026\nNotes: peach, passion fruit');await p.click('#scan-text-go');await p.waitForTimeout(800);
const sc=await p.evaluate(()=>({o:SC.origin,p:SC.process,v:SC.variety,n:SC.name,r:SC.roaster,d:SC.date}));ok('pasted label read',sc.o==='colombia'&&sc.p==='hydrohoney'&&sc.v==='aji',JSON.stringify(sc));
// Cards
const cards=await p.evaluate(async()=>{const a=await brewCard(),b2=await beanCardImg(beanById('guj1x2345'));const sz=async bl=>{const im=new Image();im.src=URL.createObjectURL(bl);await im.decode();return im.width+'x'+im.height};return [a&&await sz(a),b2&&await sz(b2)]});
ok('brew card and coffee card render',cards.every(Boolean),cards.join(' '));
// Backup: export, wipe, import back
await p.evaluate(()=>showTab('settings'));await p.waitForTimeout(300);
const dl=p.waitForEvent('download');await p.click('#st-export');const d=await dl;const path=__dirname+'/out/backup.json';fs.mkdirSync(__dirname+'/out',{recursive:true});await d.saveAs(path);const bk=JSON.parse(fs.readFileSync(path,'utf8'));
ok('backup has data and no tokens',bk.kind==='backup'&&!!bk.data['bb-beans']&&!bk.data['bb-account']&&!Object.keys(bk.data).some(k=>/sync/.test(k)),Object.keys(bk.data).length+' keys');
const before=await p.evaluate(()=>JSON.stringify([BEANS.length,LOG.length,Object.keys(TOP3).length,PROFILE&&PROFILE.nick]));
await p.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('bb-'))localStorage.removeItem(k)});await p.reload({waitUntil:'networkidle'});
ok('wiped',await p.evaluate(()=>BEANS.length===0));
await p.evaluate(()=>showTab('settings'));await p.setInputFiles('#st-file',path);await p.waitForTimeout(700);await p.click('#ask-ok');await p.waitForTimeout(400);await p.waitForLoadState('networkidle');await p.waitForTimeout(1500);
const after=await p.evaluate(()=>JSON.stringify([BEANS.length,LOG.length,Object.keys(TOP3).length,PROFILE&&PROFILE.nick]));ok('restored to the same state',after===before,before+' → '+after);
// Theme and colour
const th=await p.evaluate(()=>{showTab('settings');document.querySelector('#st-mode [data-v="dark"]').click();const t1=curTheme();document.querySelector('.swatch[data-accent="leaf"]').click();const a=document.documentElement.dataset.accent;document.querySelector('#st-mode [data-v="auto"]').click();return t1+' '+a});
ok('theme and colour switch',th==='dark leaf',th);
console.log('errors',errs.length?errs:'none');await b.close()})();
